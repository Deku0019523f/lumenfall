import * as THREE from 'three';
import { moveBody, GRAVITY, MAX_FALL, aabb } from '../engine/physics.js';
import { SpriteAnim } from '../engine/SpriteAnim.js';

// Sprite de repli (si les images manquent) : corps coloré + yeux brillants.
export function makeBlobTexture(body = '#3a2f6b', eye = '#ffe08a', spikes = true) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  const g = c.getContext('2d'); g.translate(48, 88); g.lineWidth = 5; g.strokeStyle = '#0d0a1c'; g.fillStyle = body;
  g.beginPath(); g.ellipse(0, -30, 38, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  if (spikes) for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 14 - 7, -56); g.lineTo(i * 14, -80); g.lineTo(i * 14 + 7, -56); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = eye; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 14, -34, 6, 9, 0, 0, Math.PI * 2); g.fill(); }
  return new THREE.CanvasTexture(c);
}

// skin : { strip: 'slime_green', h: 1.0, fps: 10, tint: 0xffffff }   (une seule bande en boucle)
//     ou { states: { move: 'rat_run', idle: 'rat_idle', attack: 'rat_bite', hurt: 'rat_hurt', death: 'rat_death' },
//          h: 1.0, fps: 12, fpsBy: { attack: 16 }, faces: 'right', fallback: { strip: 'slime_green', h: 1.0 } }
//   (states = clés de assets.strips ; h = hauteur monde d'UNE frame ; faces : sens du dessin d'origine)
// Les sous-classes demandent une animation avec this.want = 'attack' (par défaut 'move') ; 'hurt' est automatique.
const ONCE = new Set(['hurt', 'death', 'attack', 'opening']);
export class Enemy {
  constructor(game, x, y, { w = 1.2, h = 1.0, hp = 3, color = '#3a2f6b', scale = 1.6, gravity = true, skin = null } = {}) {
    this.game = game; this.x = x; this.y = y; this.w = w; this.h = h; this.vx = 0; this.vy = 0; this.prevY = y;
    this.hp = hp; this.dead = false; this.dir = -1; this.gravity = gravity; this.flash = 0; this.stun = 0;
    this.contactDmg = 1; this.onGround = false; this.tint = skin?.tint ?? 0xffffff;
    this.want = 'move'; this.cur = null; this.anims = {}; this.facing = skin?.faces === 'right' ? 1 : -1;
    const strips = game.assets?.strips;
    if (skin?.states && strips) {
      this.skin = skin;
      this.states = Object.fromEntries(Object.entries(skin.states).filter(([, k]) => strips[k]));
      if (!this.states.move && this.states.idle) this.states.move = this.states.idle;
      if (!this.states.move) skin = skin.fallback ? { tint: skin.tint, ...skin.fallback } : null; // images absentes
      else { this.sheet = true; this.scale = skin.h; this.#setAnim('move'); }
    }
    if (!this.sheet) {
      const strip = skin?.strip && strips?.[skin.strip];
      if (strip) {
        this.anim = new SpriteAnim(strip, skin.h, { fps: skin.fps ?? 10 });
        this.mesh = this.anim.mesh; this.scale = skin.h; this.sheet = true; this.facing = -1;
      } else {
        const mat = new THREE.MeshBasicMaterial({ map: makeBlobTexture(color), transparent: true });
        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
        this.scale = scale; this.sheet = false; this.facing = -1;
      }
      game.scene.add(this.mesh);
    }
    this.mesh.position.z = 1;
  }

  #setAnim(name) {
    const key = this.states[name]; if (!key || this.cur === name) return;
    let a = this.anims[name];
    if (!a) a = this.anims[name] = new SpriteAnim(this.game.assets.strips[key], this.skin.h, { fps: this.skin.fpsBy?.[name] ?? this.skin.fps ?? 12 });
    if (this.mesh) { this.mesh.parent?.remove(this.mesh); a.mesh.position.set(this.mesh.position.x, this.mesh.position.y, 1); }
    this.cur = name; this.anim = a; this.mesh = a.mesh; a.t = 0; a.setFrame(0); this.once = ONCE.has(name);
    this.game.scene.add(this.mesh);
  }

  dispose() {
    this.mesh?.parent?.remove(this.mesh);
    for (const a of Object.values(this.anims)) a.dispose();
    if (!Object.keys(this.anims).length) { if (this.anim) this.anim.dispose(); else { this.mesh.material.map.dispose(); this.mesh.material.dispose(); this.mesh.geometry.dispose(); } }
  }

  hit(dmg, dir, game, heavy = false) {
    if (this.dead) return;
    this.hp -= dmg; this.flash = 0.14; this.stun = heavy ? 0.3 : 0.2; this.vx = dir * (heavy ? 11 : 7); if (this.gravity) this.vy = heavy ? 7 : 4.5;
    if (this.states?.hurt && this.hp > 0) { this.cur = null; this.#setAnim('hurt'); }
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    this.dead = true;
    game.fx.burst(this.x, this.y + this.h / 2, 0xb59bff, 14, 8); game.fx.glow(this.x, this.y + this.h / 2, 0xb59bff, 2.5, 0.3);
    game.shards?.drop(this.x, this.y + this.h / 2, this.shardValue ?? 1);
    if (this.states?.death) { // le cadavre joue son animation de mort, puis disparaît (voir tickCorpse, appelé par main.js)
      this.#setAnim('death'); this.vx = 0; this.corpseT = 0; (game.corpses ||= []).push(this);
    } else this.dispose();
    game.onEnemyKilled?.(this);
  }

  // Animation de mort : renvoie false quand le cadavre doit être retiré.
  tickCorpse(dt) {
    this.corpseT += dt; this.anim.play(dt); this.#clampOnce();
    this.mesh.material.transparent = true; this.mesh.material.opacity = this.corpseT > this.anim.frames / (this.anim.fps || 12) ? Math.max(0, 1 - (this.corpseT - this.anim.frames / (this.anim.fps || 12)) * 2.5) : 1;
    this.mesh.position.set(this.x, this.y + this.scale / 2 - 0.02, 1);
    if (this.mesh.material.opacity <= 0) { this.dispose(); return false; }
    return true;
  }
  #clampOnce() { if (this.once && this.anim.t >= this.anim.frames) { this.anim.t = this.anim.frames - 0.001; this.anim.setFrame(this.anim.t); } }

  // Sous-classes : ai(game, dt)
  update(game, dt) {
    if (this.dead) return;
    if (this.stun > 0) { this.stun -= dt; this.vx *= 0.9; } else this.ai(game, dt);
    if (this.gravity) { this.vy = Math.max(this.vy + GRAVITY * dt, MAX_FALL); this.onGround = moveBody(this, dt, game.level).onGround; }
    else { this.x += this.vx * dt; this.y += this.vy * dt; }
    this.flash = Math.max(0, this.flash - dt);
    if (this.states) {
      if (this.cur === 'hurt' && this.stun <= 0) this.cur = null; // fin de la stupeur : on repart sur l'animation voulue
      if (this.cur !== 'hurt') this.#setAnim(this.states[this.want] ? this.want : 'move');
    }
    if (this.anim) { this.anim.play(dt); this.#clampOnce(); }
    // sprite à bas aligné sur les pieds ; le repli dessiné est décalé comme avant
    this.mesh.position.set(this.x, this.y + (this.sheet ? this.scale / 2 - 0.02 : this.scale * 0.45), 1);
    const sq = this.flash / 0.14;
    this.mesh.scale.set(this.dir * this.facing * (1 + 0.22 * sq), 1 - 0.18 * sq, 1);
    this.mesh.material.color.setHex(this.flash > 0 ? 0xffaaaa : this.tint);
    this.mesh.material.opacity = this.flash > 0 ? 0.75 : 1;
    const p = game.player;
    if (!p.dead && aabb(this, p)) p.damage(this.contactDmg, Math.sign(this.x - p.x) || 1, game);
  }
}
