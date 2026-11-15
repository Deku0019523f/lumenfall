import { Enemy } from './Enemy.js';

// Rampant : patrouille, fait demi-tour aux murs et aux rebords.
export class Crawler extends Enemy {
  constructor(game, x, y) { super(game, x, y, { w: 1.2, h: 0.95, hp: 3, color: '#3a2f6b' }); this.speed = 2.2; }
  ai(game) {
    const lvl = game.level;
    const ahead = Math.floor(this.x + this.dir * (this.w / 2 + 0.2));
    const wall = lvl.isSolid(ahead, Math.floor(this.y + 0.3));
    const edge = this.onGround && !lvl.isSolid(ahead, Math.floor(this.y - 0.5)) && !lvl.isPlatform(ahead, Math.floor(this.y - 0.5));
    if (wall || edge) this.dir *= -1;
    // Charge si le joueur est proche et au même niveau
    const p = game.player;
    const close = Math.abs(p.x - this.x) < 6 && Math.abs(p.y - this.y) < 1.5;
    if (close) this.dir = Math.sign(p.x - this.x) || this.dir;
    this.vx = this.dir * this.speed * (close ? 1.7 : 1);
  }
}
