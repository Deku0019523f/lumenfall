import { Enemy } from './Enemy.js';
import { spawnShot } from './shots.js';

// Nouveaux monstres, chacun avec une attaque propre.

// Cracheur : immobile, vise le joueur et tire un projectile après un temps de charge.
export class Spitter extends Enemy {
  constructor(game, x, y, hpMul = 1, cfg = {}) {
    super(game, x, y, { w: 1.1, h: 0.95, hp: Math.round(3 * hpMul), color: '#6a3a9a', skin: cfg.skin ?? { strip: 'slime_green', h: 1.05, fps: 8, tint: 0xc08aff } });
    this.cd = 1 + Math.random(); this.windup = 0; this.baseTint = 0xc08aff;
  }
  ai(game, dt) {
    const p = game.player, dx = p.x - this.x, dy = p.y + 0.8 - (this.y + 0.5);
    this.dir = Math.sign(dx) || this.dir; this.vx = 0;
    const see = Math.abs(dx) < 11 && Math.abs(dy) < 5;
    if (this.windup > 0) {
      this.windup -= dt; this.tint = Math.floor(this.windup * 14) % 2 ? 0xffffff : this.baseTint;
      if (this.windup <= 0) {
        const d = Math.hypot(dx, dy) || 1; this.tint = this.baseTint;
        spawnShot(game, this.x, this.y + 0.6, dx / d * 8.5, dy / d * 8.5, { color: 0xc08aff, r: 0.28 });
        this.cd = 2.2;
      }
    } else if (see) { this.cd -= dt; if (this.cd <= 0) { this.windup = 0.6; game.audio?.sfx('warn'); } }
  }
}

// Sauteur : attend, puis bondit en arc vers le joueur.
export class Hopper extends Enemy {
  constructor(game, x, y, hpMul = 1) {
    super(game, x, y, { w: 1.1, h: 0.95, hp: Math.round(3 * hpMul), color: '#2f5a9a', skin: { strip: 'slime_green', h: 1.05, fps: 14, tint: 0x8ad0ff } });
    this.cd = Math.random() * 1.2; this.contactDmg = 1;
  }
  ai(game, dt) {
    const p = game.player;
    if (this.onGround) {
      this.vx *= 0.6; this.cd -= dt;
      if (this.cd <= 0 && Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 6) {
        this.dir = Math.sign(p.x - this.x) || 1;
        this.vy = 14 + Math.random() * 2; this.vx = this.dir * (5 + Math.min(4, Math.abs(p.x - this.x) * 0.5)); this.cd = 1.1 + Math.random() * 0.5;
      }
    }
  }
}

// Esprit : vole en rond, tire 3 projectiles en éventail.
export class Wisp extends Enemy {
  constructor(game, x, y, hpMul = 1) {
    super(game, x, y, { w: 0.9, h: 0.9, hp: Math.round(2 * hpMul), color: '#2f9aa9', scale: 1.3, gravity: false, skin: { strip: 'spore', h: 1.0, fps: 14, tint: 0x7af0ff } });
    this.t = Math.random() * 6; this.homeX = x; this.homeY = y + 1.5; this.y = this.homeY; this.cd = 1.5 + Math.random() * 2;
  }
  ai(game, dt) {
    const p = game.player; this.t += dt;
    this.dir = Math.sign(p.x - this.x) || this.dir;
    this.vx = (this.homeX + Math.cos(this.t * 0.9) * 4 - this.x) * 2;
    this.vy = (this.homeY + Math.sin(this.t * 1.7) * 1.1 - this.y) * 3;
    if (Math.abs(p.x - this.x) < 10 && Math.abs(p.y - this.y) < 7) {
      this.cd -= dt;
      if (this.cd <= 0) {
        this.cd = 3;
        const a0 = Math.atan2(p.y + 0.8 - this.y, p.x - this.x);
        for (const da of [-0.32, 0, 0.32]) spawnShot(game, this.x, this.y, Math.cos(a0 + da) * 7, Math.sin(a0 + da) * 7, { color: 0x7af0ff, r: 0.22, life: 2.2 });
      }
    }
  }
}

// Brute : lente et résistante ; annonce une ruée puis charge tout droit.
export class Brute extends Enemy {
  constructor(game, x, y, hpMul = 1) {
    super(game, x, y, { w: 1.7, h: 1.5, hp: Math.round(8 * hpMul), color: '#9a2f2f', skin: { strip: 'slime_orange', h: 1.8, fps: 8, tint: 0xff9a8a } });
    this.state = 'walk'; this.stateT = 0; this.baseTint = 0xff9a8a; this.shardValue = 6;
  }
  hit(dmg, dir, game, heavy) { super.hit(dmg, dir, game, false); if (!this.dead && this.state !== 'recover') { this.stun = 0.06; this.vx = dir * 2; } }
  ai(game, dt) {
    const p = game.player, lvl = game.level; this.stateT -= dt;
    const near = Math.abs(p.x - this.x) < 8 && Math.abs(p.y - this.y) < 2;
    if (this.state === 'walk') {
      const ahead = Math.floor(this.x + this.dir * 1.2);
      if (lvl.isSolid(ahead, Math.floor(this.y + 0.3)) || !lvl.isSolid(ahead, Math.floor(this.y - 0.5))) this.dir *= -1;
      this.vx = this.dir * 1.4;
      if (near && this.onGround) { this.state = 'windup'; this.stateT = 0.75; this.dir = Math.sign(p.x - this.x) || 1; game.audio?.sfx('warn'); }
    } else if (this.state === 'windup') {
      this.vx = 0; this.tint = Math.floor(this.stateT * 16) % 2 ? 0xffffff : 0xff4a4a;
      if (this.stateT <= 0) { this.state = 'charge'; this.stateT = 0.9; this.tint = this.baseTint; }
    } else if (this.state === 'charge') {
      this.vx = this.dir * 12;
      const ahead = Math.floor(this.x + this.dir * 1.2);
      const blocked = lvl.isSolid(ahead, Math.floor(this.y + 0.3)) || !lvl.isSolid(ahead, Math.floor(this.y - 0.5));
      if (this.stateT <= 0 || blocked) { this.state = 'recover'; this.stateT = 1.1; game.camera.shake(0.2, 0.15); game.fx.puff(this.x, this.y, 5); }
    } else { this.vx = 0; if (this.stateT <= 0) this.state = 'walk'; }
  }
}
