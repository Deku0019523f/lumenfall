import { Level } from './Level.js';
import { Background } from './Background.js';
import { CHAPTERS } from '../levels/chapters.js';
import { Crawler } from '../enemies/Crawler.js';
import { Flyer } from '../enemies/Flyer.js';
import { Boss } from '../bosses/Boss.js';
import { Interactables } from '../objects/Interactables.js';

// Gère le chapitre courant : construit la carte, les ennemis, le boss, et nettoie le précédent.
export class World {
  constructor(game) { this.game = game; this.level = null; this.bg = null; this.index = -1; }

  // fromSave : { x, y } point de réapparition à utiliser (sinon départ de la carte)
  load(index, spawn = null, bossDead = false) {
    const g = this.game, ch = CHAPTERS[index];
    this.#clear();
    this.index = index;
    this.level = new Level({ name: ch.title, map: ch.map, theme: ch.theme }, g.assets);
    g.level = this.level; g.scene.add(this.level.group);
    const bgTex = g.assets?.bg?.[ch.theme.bg?.image];
    if (bgTex) this.bg = new Background(g.scene, bgTex, ch.theme.bg.tint);
    g.camera.setBounds(this.level.bounds);

    for (const s of this.level.spawns) {
      if (s.type === 'c') g.enemies.push(new Crawler(g, s.x, s.y, ch.crawler, ch.hpMul));
      else if (s.type === 'f') g.enemies.push(new Flyer(g, s.x, s.y, ch.hpMul));
      else if (s.type === 'B' && !bossDead) { g.boss = new Boss(g, s.x, s.y, ch.boss); g.enemies.push(g.boss); }
    }
    g.inter = new Interactables(g, this.level.spawns);

    const p = g.player, at = spawn || this.level.spawn;
    p.spawnPoint = { x: at.x, y: at.y };
    p.x = at.x; p.y = at.y; p.vx = p.vy = 0; p.hp = p.maxHp; p.dead = false; p.invuln = 1;
    g.camera.snapTo(at.x, at.y);
    return ch;
  }

  update(dt) {
    this.level?.update(dt);
    this.bg?.update(this.game.camera, this.level);
  }

  #clear() {
    const g = this.game;
    for (const e of g.enemies) if (!e.dead) { g.scene.remove(e.mesh); e.anim?.dispose(); }
    g.enemies = []; g.boss = null;
    for (const pr of g.projectiles) g.scene.remove(pr.mesh);
    for (const s of g.enemyShots) g.scene.remove(s.mesh);
    g.projectiles = []; g.enemyShots = [];
    g.inter?.dispose();
    this.bg?.dispose(); this.bg = null;
    this.level?.dispose(); this.level = null;
  }
}
