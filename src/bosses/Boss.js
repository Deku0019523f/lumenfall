import { Enemy } from '../enemies/Enemy.js';
import { Crawler } from '../enemies/Crawler.js';
import { Flyer } from '../enemies/Flyer.js';
import { spawnShot } from '../enemies/shots.js';

// Boss et mini-boss : 3 phases, chaque boss a son propre répertoire d'attaques (cfg.moves, voir levels/chapters.js).
// Attaques : charge, jump (saut + onde), leap (bond ciblé), multijump (3 bonds), volley (éventail), burst (cercle de tirs),
// roots (racines temporisées), summon (renforts), gust (rafale de vent), blades (lames de vent), rain (pluie acide).
const MIN_PHASE = { charge: 1, jump: 1, leap: 1, roots: 1, gust: 1, rain: 1, volley: 2, summon: 2, blades: 2, multijump: 2, burst: 3 };

export class Boss extends Enemy {
  constructor(game, x, y, cfg = {}) {
    const hp = cfg.hp ?? 40;
    super(game, x, y, {
      w: cfg.w ?? 2.6, h: cfg.h ?? 2.8, hp, color: cfg.color ?? '#7a2f4a', scale: 4.2,
      skin: cfg.strip ? { strip: cfg.strip, h: cfg.spriteH ?? 3.6, fps: 10, tint: cfg.tint } : null,
    });
    this.maxHp = hp; this.phase = 1; this.state = 'idle'; this.stateT = 1.2; this.name = cfg.name ?? 'Gardien';
    this.contactDmg = 1; this.active = false; this.home = { x, y }; this.shardValue = cfg.shards ?? 40; this.mini = !!cfg.mini;
    this.moves = cfg.moves ?? ['charge', 'jump', 'volley']; this.baseTint = cfg.tint ?? 0xffffff;
    this.queue = []; this.minions = []; this.jumps = 0; this.windName = '';
  }

  hit(dmg, dir, game, heavy = false) {
    if (this.dead) return;
    this.hp -= dmg; this.flash = 0.1; // pas de stun : un boss ne se laisse pas interrompre
    const ph = this.hp < this.maxHp * 0.33 ? 3 : this.hp < this.maxHp * 0.66 ? 2 : 1;
    if (ph !== this.phase) { this.phase = ph; this.state = 'roar'; this.stateT = 1.0; this.vx = 0; this.queue = []; game.camera.shake(0.6, 0.6); game.audio?.sfx('roar'); game.onBossPhase?.(ph); }
    if (this.hp <= 0) this.die(game);
  }

  ai(game, dt) {
    const p = game.player;
    if (this.y < -2) { this.x = this.home.x; this.y = this.home.y; this.vx = this.vy = 0; } // tombé dans le vide
    if (!this.active) { if (Math.abs(p.x - this.x) < 14) { this.active = true; game.onBossStart?.(this); } else return; }
    const sp = 1 + (this.phase - 1) * 0.3; // vitesse selon la phase
    this.stateT -= dt;
    const face = Math.sign(p.x - this.x) || 1;
    for (let i = this.queue.length - 1; i >= 0; i--) { this.queue[i].t -= dt; if (this.queue[i].t <= 0) { this.queue[i].fn(); this.queue.splice(i, 1); } }

    switch (this.state) {
      case 'idle':
        this.dir = face; this.vx = face * 2.2 * sp;
        if (this.stateT <= 0) this.#pick(game);
        break;
      case 'charge': // ruée horizontale
        this.vx = this.dir * 13 * sp;
        if (this.stateT <= 0 || this.onGround && game.level.isSolid(Math.floor(this.x + this.dir * 1.5), Math.floor(this.y + 0.5))) this.#to('recover', 0.6);
        break;
      case 'windup': // annonce : le boss clignote
        this.vx = 0; this.dir = face; this.tint = Math.floor(this.stateT * 14) % 2 ? 0xffffff : this.baseTint;
        if (this.stateT <= 0) { this.tint = this.baseTint; this.#start(this.next, game); }
        break;
      case 'jump': // saut + impact
        if (this.onGround && this.stateT < (this.jumpT ?? 0.9)) {
          this.#shockwave(game); game.camera.shake(0.5, 0.3);
          if (this.jumps > 1) { this.jumps--; this.#leap(game, 0.25); } else this.#to('recover', 0.7);
        }
        break;
      case 'volley': this.vx = 0; if (this.stateT <= 0) this.#to('recover', 0.5); break;
      case 'cast': this.vx = 0; if (this.stateT <= 0) this.#to('recover', 0.5); break;
      case 'gust': // rafale : pousse le joueur
        this.vx = 0; p.vx += this.dir * 34 * dt;
        if (Math.random() < 0.5) game.fx.puff(p.x - this.dir * 2 + Math.random() * 3, p.y + Math.random() * 2, 1, 0xcfefff);
        if (this.stateT <= 0) this.#to('recover', 0.6);
        break;
      case 'recover': this.vx = 0; if (this.stateT <= 0) this.#to('idle', 0.9 / sp); break;
      case 'roar': this.vx = 0; if (this.stateT <= 0) this.#to('idle', 0.5); break;
    }
  }

  #to(s, t) { this.state = s; this.stateT = t; }

  #pick(game) {
    const opts = this.moves.filter((m) => this.mini ? m !== 'burst' : (MIN_PHASE[m] ?? 1) <= this.phase);
    const pool = this.phase >= 3 ? [...opts, ...opts.slice(-2)] : opts; // phase 3 : plus d'attaques « avancées »
    let m = pool[Math.floor(Math.random() * pool.length)] || 'charge';
    if (m === this.next && opts.length > 1) m = opts[(opts.indexOf(m) + 1) % opts.length]; // évite de répéter
    this.next = m;
    this.#to('windup', (m === 'roots' || m === 'rain' ? 0.7 : 0.5) / (1 + (this.phase - 1) * 0.25));
    this.dir = Math.sign(game.player.x - this.x) || 1;
    game.audio?.sfx('warn');
  }

  #start(kind, game) {
    const p = game.player, sp = this.phase;
    switch (kind) {
      case 'charge': this.#to('charge', 0.9); break;
      case 'jump': this.jumps = 1; this.vy = 19; this.vx = this.dir * 5; this.jumpT = 0.9; this.#to('jump', 1.4); break;
      case 'leap': this.jumps = 1; this.#leap(game, 0); break;
      case 'multijump': this.jumps = 3; this.#leap(game, 0); break;
      case 'volley': this.#volley(game); this.#to('volley', 0.7); break;
      case 'burst': { // cercle de tirs
        const n = 10, off = Math.random();
        for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; spawnShot(game, this.x, this.y + 1.4, Math.cos(a) * 7, Math.sin(a) * 7, { color: 0xffa14a, life: 3 }); }
        game.camera.shake(0.3, 0.2); this.#to('cast', 0.8); break;
      }
      case 'roots': { // colonnes d'éruption temporisées autour du joueur
        const n = sp >= 3 ? 7 : 5;
        for (let i = 0; i < n; i++) game.hazards.add({ x: p.x + (i - (n - 1) / 2) * 2.2, y: this.y, w: 1.3, h: 3.2, warn: 0.85 + Math.abs(i - (n - 1) / 2) * 0.13, color: 0x7bd05a });
        this.#to('cast', 1.8); break;
      }
      case 'summon': {
        this.minions = this.minions.filter((m) => !m.dead);
        const n = Math.min(sp >= 3 ? 3 : 2, 5 - this.minions.length);
        for (let i = 0; i < n; i++) {
          const x = this.x + (i % 2 ? 1 : -1) * (2.5 + i), y = this.y + 0.2;
          const e = i % 2 ? new Flyer(game, x, y + 1.5, 1) : new Crawler(game, x, y, 'green', 1);
          e.shardValue = 1; game.enemies.push(e); this.minions.push(e); game.fx.impact(x, y + 0.6, 1, false, 0xb59bff);
        }
        this.#to('cast', 1.0); break;
      }
      case 'gust': game.camera.shake(0.12, 1.2); game.audio?.sfx('nova'); this.#to('gust', 1.5); break;
      case 'blades': // lames de vent à deux hauteurs (sauter ou esquiver)
        for (let i = 0; i < 6; i++) this.queue.push({ t: i * 0.38, fn: () => spawnShot(game, this.x + this.dir * 1.5, this.y + (i % 2 ? 2.1 : 0.45), this.dir * 12, 0, { color: 0xcfefff, r: 0.32, life: 2.2 }) });
        this.#to('cast', 2.4); break;
      case 'rain': // pluie acide depuis le plafond
        for (let i = 0; i < 10; i++) this.queue.push({ t: i * 0.22, fn: () => spawnShot(game, p.x + (Math.random() - 0.5) * 12, this.y + 9, 0, -9, { color: 0x9be36a, r: 0.25, life: 2 }) });
        this.#to('cast', 2.6); break;
    }
  }

  // bond ciblé vers le joueur, avec onde de choc à l'atterrissage
  #leap(game, delay) {
    const p = game.player, air = 0.8;
    this.dir = Math.sign(p.x - this.x) || 1;
    this.vy = 17; this.vx = Math.max(-14, Math.min(14, (p.x - this.x) / air)); this.jumpT = 1.1 - 0.001; this.#to('jump', 1.1 + delay);
  }

  #volley(game) {
    const n = this.phase === 3 ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const a = (-0.5 + i / (n - 1)) * 1.1;
      spawnShot(game, this.x, this.y + 1.8, Math.cos(a) * this.dir * 9, Math.sin(a) * 9 + 1);
    }
  }

  #shockwave(game) {
    for (const d of [-1, 1]) spawnShot(game, this.x + d * 1.4, this.y + 0.4, d * 10, 0);
  }
}
