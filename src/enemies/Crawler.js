import { Enemy } from './Enemy.js';

// Rampant (slime) : patrouille, fait demi-tour aux murs et aux rebords, charge le joueur proche.
// variant : 'green' (chapitres 1 et 3) ou 'orange' (chapitre 2)
export class Crawler extends Enemy {
  constructor(game, x, y, variant = 'green', hpMul = 1) {
    const orange = variant === 'orange';
    super(game, x, y, {
      w: orange ? 1.3 : 1.2, h: 0.95, hp: Math.round(3 * hpMul), color: orange ? '#8a5a1f' : '#2f6b3a',
      skin: { strip: orange ? 'slime_orange' : 'slime_green', h: orange ? 1.15 : 1.0, fps: 9 },
    });
    this.speed = orange ? 2.6 : 2.2;
  }
  ai(game) {
    const lvl = game.level;
    const ahead = Math.floor(this.x + this.dir * (this.w / 2 + 0.2));
    const wall = lvl.isSolid(ahead, Math.floor(this.y + 0.3));
    const edge = this.onGround && !lvl.isSolid(ahead, Math.floor(this.y - 0.5)) && !lvl.isPlatform(ahead, Math.floor(this.y - 0.5));
    if (wall || edge) this.dir *= -1;
    const p = game.player;
    const close = Math.abs(p.x - this.x) < 6 && Math.abs(p.y - this.y) < 1.5;
    if (close) this.dir = Math.sign(p.x - this.x) || this.dir;
    this.vx = this.dir * this.speed * (close ? 1.7 : 1);
  }
}
