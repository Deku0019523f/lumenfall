import { createHeroSprite, animateHero } from './Animations.js';
import { updateMovement } from './Movement.js';
import { updateCombat } from './Combat.js';

export class Player {
  constructor(scene, x, y, assets) {
    this.x = x; this.y = y; this.w = 0.7; this.h = 1.5;
    this.vx = 0; this.vy = 0; this.prevY = y;
    this.facing = 1; this.state = 'idle';
    this.onGround = false; this.touchingWall = false; this.wallDir = 1;
    this.coyoteT = 0; this.jumpBuf = 0; this.airJumps = 0;
    this.dashT = 0; this.dashCd = 0; this.dashDir = 1;
    this.attackT = 0; this.attackLock = 0; this.attackKind = 'front'; this.attackDmg = 1;
    this.comboIdx = 0; this.comboT = 0; this.chargeT = 0; this.hitSet = new Set();
    this.maxHp = 5; this.hp = 5; this.maxEnergy = 9; this.energy = 0;
    this.invuln = 0; this.hurtT = 0; this.dead = false;
    this.abilities = { dash: true, doubleJump: false, wall: false };
    this.spawnPoint = { x, y };
    this.sprite = createHeroSprite(assets);
    scene.add(this.sprite.root);
  }

  update(input, game, dt) {
    if (this.dead) return;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtT > 0) { this.hurtT -= dt; if (this.hurtT <= 0) this.state = 'idle'; }

    updateMovement(this, input, game.level, dt);
    updateCombat(this, input, game, dt);

    // Pics et chute dans le vide
    const lvl = game.level;
    const tx0 = Math.floor(this.x - this.w / 2), tx1 = Math.floor(this.x + this.w / 2);
    for (let tx = tx0; tx <= tx1; tx++) if (lvl.isSpike(tx, Math.floor(this.y + 0.1))) { this.damage(1, 0, game, true); break; }
    if (this.y < -3) this.damage(1, 0, game, true);

    // État d'animation
    if (this.state !== 'hurt') {
      this.state = this.dashT > 0 ? 'dash' : this.attackT > 0 ? 'attack' : this.chargeT > 0.2 ? 'charge'
        : !this.onGround ? (this.vy > 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 0.5 ? 'run' : 'idle';
    }
    animateHero(this, dt);
  }

  damage(n, fromDir, game, respawn = false) {
    if (this.invuln > 0 || this.dead) return;
    this.hp -= n; this.invuln = 1.0; this.state = 'hurt'; this.hurtT = 0.25;
    this.vx = -fromDir * 7; this.vy = 9;
    game.camera.shake(0.35, 0.25);
    game.fx.burst(this.x, this.y + 1, 0xff5577, 10, 7);
    if (respawn && this.hp > 0) { this.x = this.spawnPoint.x; this.y = this.spawnPoint.y; this.vx = this.vy = 0; }
    if (this.hp <= 0) { this.dead = true; game.onPlayerDeath?.(); }
  }

  respawn() {
    this.dead = false; this.hp = this.maxHp; this.energy = 0; this.invuln = 1.5;
    this.x = this.spawnPoint.x; this.y = this.spawnPoint.y; this.vx = this.vy = 0; this.state = 'idle';
  }
}
