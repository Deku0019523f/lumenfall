import { Enemy } from './Enemy.js';

// Mimic : ressemble à un coffre fermé et reste immobile ; quand le joueur s'approche il s'ouvre (animation),
// puis le poursuit et mord (attaque). Résistant et généreux en étincelles.
export class Mimic extends Enemy {
  constructor(game, x, y, hpMul = 1, cfg = {}) {
    super(game, x, y, { w: 1.3, h: 1.0, hp: Math.round((cfg.hp ?? 7) * hpMul), color: '#8a5a2a', skin: cfg.skin });
    this.mode = 'sleep'; this.modeT = 0; this.speed = 3.4; this.shardValue = 8;
    this.baseContact = 1; this.contactDmg = 0; // inoffensif tant qu'il dort
    this.want = this.states?.closed ? 'closed' : 'move';
  }
  ai(game, dt) {
    const p = game.player, lvl = game.level, dx = p.x - this.x, dy = Math.abs(p.y - this.y);
    this.modeT -= dt;
    if (this.mode === 'sleep') {
      this.vx = 0; this.want = this.states?.closed ? 'closed' : 'move';
      if (Math.abs(dx) < 3.2 && dy < 2) { this.mode = 'wake'; this.modeT = 0.7; game.audio?.sfx('warn'); }
    } else if (this.mode === 'wake') {
      this.vx = 0; this.want = this.states?.opening ? 'opening' : 'move'; this.dir = Math.sign(dx) || this.dir;
      if (this.modeT <= 0) { this.mode = 'chase'; this.contactDmg = this.baseContact; }
    } else {
      this.dir = Math.sign(dx) || this.dir;
      const ahead = Math.floor(this.x + this.dir * (this.w / 2 + 0.2));
      const blocked = lvl.isSolid(ahead, Math.floor(this.y + 0.3));
      const close = Math.abs(dx) < 1.6 && dy < 1.2;
      this.vx = blocked ? 0 : this.dir * this.speed;
      this.want = close && this.states?.attack ? 'attack' : 'move';
      if (this.onGround && blocked && Math.abs(dx) > 1) this.vy = 9; // saute les marches
    }
  }
}
