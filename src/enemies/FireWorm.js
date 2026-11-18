import { Enemy } from './Enemy.js';
import { spawnShot } from './shots.js';

const ATTACK_T = 16 / 14; // 16 images à 14 i/s

// Ver de feu : rampe lentement ; quand le joueur est en vue il s'arrête, se dresse (animation d'attaque)
// et crache une boule de feu au milieu de l'animation. Repli sans images : ressemble à un Cracheur.
export class FireWorm extends Enemy {
  constructor(game, x, y, hpMul = 1, cfg = {}) {
    super(game, x, y, { w: 1.3, h: 1.1, hp: Math.round((cfg.hp ?? 4) * hpMul), color: '#8a3a1f', skin: cfg.skin });
    this.speed = 1.1; this.cd = 1 + Math.random(); this.atk = 0; this.fired = false; this.shardValue = 3;
  }
  ai(game, dt) {
    const p = game.player, lvl = game.level, dx = p.x - this.x, dy = p.y + 0.8 - (this.y + 0.8);
    const see = Math.abs(dx) < 11 && Math.abs(dy) < 4;
    if (this.atk > 0) { // en train de cracher
      this.atk -= dt; this.vx = 0; this.want = 'attack';
      const dur = this.states?.attack ? ATTACK_T : 0.9;
      if (!this.fired && this.atk < dur * 0.45) {
        this.fired = true;
        const d = Math.hypot(dx, dy) || 1;
        spawnShot(game, this.x + this.dir * 0.9, this.y + 1.1, dx / d * 7.5, dy / d * 7.5, { color: 0xff7a2a, r: 0.28, strip: 'fireball_move' });
      }
      if (this.atk <= 0) { this.cd = 2.4; this.want = 'move'; }
      return;
    }
    this.cd -= dt;
    if (see) {
      this.dir = Math.sign(dx) || this.dir; this.vx = 0; this.want = 'idle';
      if (this.cd <= 0) { this.atk = this.states?.attack ? ATTACK_T + 0.1 : 0.9; this.fired = false; game.audio?.sfx('warn'); }
      return;
    }
    const ahead = Math.floor(this.x + this.dir * (this.w / 2 + 0.2));
    if (lvl.isSolid(ahead, Math.floor(this.y + 0.3)) || (this.onGround && !lvl.isSolid(ahead, Math.floor(this.y - 0.5)))) this.dir *= -1;
    this.vx = this.dir * this.speed; this.want = 'move';
  }
}
