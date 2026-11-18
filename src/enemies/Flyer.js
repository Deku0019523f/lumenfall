import { Enemy } from './Enemy.js';

// Volant : plane en sinusoïde, repère le joueur, plonge, puis remonte. cfg.skin : apparence (chauve-souris…).
export class Flyer extends Enemy {
  constructor(game, x, y, hpMul = 1, cfg = {}) {
    super(game, x, y, { w: cfg.w ?? 1.0, h: cfg.h ?? 0.9, hp: Math.round((cfg.hp ?? 2) * hpMul), color: '#6b2f5a', scale: 1.4, gravity: false,
      skin: cfg.skin ?? { strip: 'spore', h: 1.1, fps: 12 } });
    this.homeY = y + 1.5; this.t = Math.random() * 6; this.mode = 'hover'; this.modeT = 0; this.y = this.homeY;
  }
  ai(game, dt) {
    const p = game.player; this.t += dt; this.modeT -= dt;
    const dx = p.x - this.x, dy = p.y + 0.8 - this.y;
    this.dir = Math.sign(dx) || this.dir;
    this.want = this.mode === 'hover' ? 'move' : 'attack';
    if (this.mode === 'hover') {
      this.vx = Math.sin(this.t) * 1.5; this.vy = (this.homeY + Math.sin(this.t * 2) * 0.5 - this.y) * 3;
      if (Math.abs(dx) < 7 && Math.abs(dy) < 8 && this.modeT <= 0) { this.mode = 'windup'; this.modeT = 0.45; this.vx = this.vy = 0; }
    } else if (this.mode === 'windup') {
      this.vy = 1.5;
      if (this.modeT <= 0) { this.mode = 'dive'; this.modeT = 0.7; const d = Math.hypot(dx, dy) || 1; this.vx = dx / d * 11; this.vy = dy / d * 11; }
    } else if (this.mode === 'dive') {
      if (this.modeT <= 0 || game.level.isSolid(Math.floor(this.x), Math.floor(this.y))) { this.mode = 'hover'; this.modeT = 1.6; }
    }
  }
}
