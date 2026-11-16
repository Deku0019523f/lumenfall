import * as THREE from 'three';
import { Enemy } from '../enemies/Enemy.js';

// Boss de chapitre : 3 phases, attaques de plus en plus agressives.
// cfg : { name, hp, w, h, strip, spriteH, tint, color }  — chaque chapitre fournit sa propre config (voir levels/chapters.js).
export class Boss extends Enemy {
  constructor(game, x, y, cfg = {}) {
    const hp = cfg.hp ?? 40;
    super(game, x, y, {
      w: cfg.w ?? 2.6, h: cfg.h ?? 2.8, hp, color: cfg.color ?? '#7a2f4a', scale: 4.2,
      skin: cfg.strip ? { strip: cfg.strip, h: cfg.spriteH ?? 3.6, fps: 10, tint: cfg.tint } : null,
    });
    this.maxHp = hp; this.phase = 1; this.state = 'idle'; this.stateT = 1.2; this.name = cfg.name ?? 'Gardien';
    this.contactDmg = 1; this.active = false; this.slamPending = false; this.home = { x, y }; this.shardValue = cfg.shards ?? 40; this.mini = !!cfg.mini;
  }

  hit(dmg, dir, game, heavy = false) {
    if (this.dead) return;
    this.hp -= dmg; this.flash = 0.1; // pas de stun : un boss ne se laisse pas interrompre
    const ph = this.hp < this.maxHp * 0.33 ? 3 : this.hp < this.maxHp * 0.66 ? 2 : 1;
    if (ph !== this.phase) { this.phase = ph; this.state = 'roar'; this.stateT = 1.0; this.vx = 0; game.camera.shake(0.6, 0.6); game.onBossPhase?.(ph); }
    if (this.hp <= 0) this.die(game);
  }

  ai(game, dt) {
    const p = game.player;
    if (this.y < -2) { this.x = this.home.x; this.y = this.home.y; this.vx = this.vy = 0; } // tombé dans le vide
    if (!this.active) { if (Math.abs(p.x - this.x) < 14) { this.active = true; game.onBossStart?.(this); } else return; }
    const sp = 1 + (this.phase - 1) * 0.3; // vitesse selon la phase
    this.stateT -= dt;
    const face = Math.sign(p.x - this.x) || 1;

    switch (this.state) {
      case 'idle':
        this.dir = face; this.vx = face * 2.2 * sp;
        if (this.stateT <= 0) this.#pick(game);
        break;
      case 'charge': // ruée horizontale
        this.vx = this.dir * 13 * sp;
        if (this.stateT <= 0 || this.onGround && game.level.isSolid(Math.floor(this.x + this.dir * 1.5), Math.floor(this.y + 0.5))) this.#to('recover', 0.6);
        break;
      case 'windup': this.vx = 0; if (this.stateT <= 0) this.#start(this.next, game); break;
      case 'jump': // saut + impact
        if (this.onGround && this.stateT < 0.9) { this.#shockwave(game); game.camera.shake(0.5, 0.3); this.#to('recover', 0.7); }
        break;
      case 'volley': // tir en éventail
        this.vx = 0;
        if (this.stateT <= 0) this.#to('recover', 0.5);
        break;
      case 'recover': this.vx = 0; if (this.stateT <= 0) this.#to('idle', 0.9 / sp); break;
      case 'roar': this.vx = 0; if (this.stateT <= 0) this.#to('idle', 0.5); break;
    }
  }

  #to(s, t) { this.state = s; this.stateT = t; }

  #pick(game) {
    const opts = ['charge', 'jump'];
    if (this.phase >= 2) opts.push('volley');
    if (this.phase >= 3) opts.push('charge', 'jump');
    this.next = opts[Math.floor(Math.random() * opts.length)];
    this.#to('windup', 0.5 / (1 + (this.phase - 1) * 0.3));
    this.dir = Math.sign(game.player.x - this.x) || 1;
  }

  #start(kind, game) {
    if (kind === 'charge') this.#to('charge', 0.9);
    else if (kind === 'jump') { this.vy = 19; this.vx = this.dir * 5; this.#to('jump', 1.4); }
    else if (kind === 'volley') { this.#volley(game); this.#to('volley', 0.7); }
  }

  #shot(game, x, y, vx, vy) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), new THREE.MeshBasicMaterial({ color: 0xff5577 }));
    m.position.set(x, y, 2); game.scene.add(m);
    game.enemyShots.push({ mesh: m, x, y, w: 0.6, h: 0.6, vx, vy, life: 2.5 });
  }

  #volley(game) {
    const n = this.phase === 3 ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const a = (-0.5 + i / (n - 1)) * 1.1;
      this.#shot(game, this.x, this.y + 1.8, Math.cos(a) * this.dir * 9, Math.sin(a) * 9 + 1);
    }
  }

  #shockwave(game) {
    for (const d of [-1, 1]) this.#shot(game, this.x + d * 1.4, this.y + 0.4, d * 10, 0);
  }
}
