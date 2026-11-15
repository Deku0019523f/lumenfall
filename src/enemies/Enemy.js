import * as THREE from 'three';
import { moveBody, GRAVITY, MAX_FALL, aabb } from '../engine/physics.js';

// Sprite d'ennemi procédural : corps coloré + yeux brillants.
export function makeBlobTexture(body = '#3a2f6b', eye = '#ffe08a', spikes = true) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 96;
  const g = c.getContext('2d'); g.translate(48, 88); g.lineWidth = 5; g.strokeStyle = '#0d0a1c'; g.fillStyle = body;
  g.beginPath(); g.ellipse(0, -30, 38, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  if (spikes) for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 14 - 7, -56); g.lineTo(i * 14, -80); g.lineTo(i * 14 + 7, -56); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = eye; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 14, -34, 6, 9, 0, 0, Math.PI * 2); g.fill(); }
  return new THREE.CanvasTexture(c);
}

export class Enemy {
  constructor(game, x, y, { w = 1.2, h = 1.0, hp = 3, color = '#3a2f6b', scale = 1.6, gravity = true } = {}) {
    this.x = x; this.y = y; this.w = w; this.h = h; this.vx = 0; this.vy = 0; this.prevY = y;
    this.hp = hp; this.dead = false; this.dir = -1; this.gravity = gravity; this.flash = 0; this.stun = 0;
    this.contactDmg = 1; this.onGround = false;
    const mat = new THREE.MeshBasicMaterial({ map: makeBlobTexture(color), transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat);
    this.mesh.position.z = 1;
    this.scale = scale;
    game.scene.add(this.mesh);
  }

  hit(dmg, dir, game) {
    if (this.dead) return;
    this.hp -= dmg; this.flash = 0.12; this.stun = 0.18; this.vx = dir * 6; if (this.gravity) this.vy = 5;
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    this.dead = true;
    game.fx.burst(this.x, this.y + this.h / 2, 0xb59bff, 14, 8);
    game.scene.remove(this.mesh); this.mesh.material.map.dispose(); this.mesh.material.dispose();
    game.onEnemyKilled?.(this);
  }

  // Sous-classes : ai(game, dt)
  update(game, dt) {
    if (this.dead) return;
    if (this.stun > 0) { this.stun -= dt; this.vx *= 0.9; } else this.ai(game, dt);
    if (this.gravity) { this.vy = Math.max(this.vy + GRAVITY * dt, MAX_FALL); this.onGround = moveBody(this, dt, game.level).onGround; }
    else { this.x += this.vx * dt; this.y += this.vy * dt; }
    this.flash = Math.max(0, this.flash - dt);
    this.mesh.position.set(this.x, this.y + this.scale * 0.45, 1);
    this.mesh.scale.x = -this.dir;
    this.mesh.material.color.setHex(this.flash > 0 ? 0xffffff : 0xffffff);
    this.mesh.material.opacity = this.flash > 0 ? 0.6 : 1;
    const p = game.player;
    if (!p.dead && aabb(this, p)) p.damage(this.contactDmg, Math.sign(this.x - p.x) || 1, game);
  }
}
