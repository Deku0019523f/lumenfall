import { Level } from './Level.js';
import { Background } from './Background.js';
import { CHAPTERS, ZONES } from '../levels/chapters.js';
import { spawnEnemy, ENEMY_LETTERS } from '../enemies/Bestiary.js';
import { Hazards } from '../systems/Hazards.js';
import { Portals } from '../objects/Portals.js';
import { Boss } from '../bosses/Boss.js';
import { Npc } from '../objects/Npc.js';
import { STORY } from '../story/story.js';
import { Interactables } from '../objects/Interactables.js';
import { Walls } from './Walls.js';

// Gère le chapitre courant : construit la carte, les ennemis, le boss, et nettoie le précédent.
export class World {
  constructor(game) { this.game = game; this.level = null; this.bg = null; this.index = -1; this.roomId = null; this.changing = false; }

  // fromSave : { x, y } point de réapparition à utiliser (sinon départ de la carte)
  load(index, spawn = null) {
    const ch = CHAPTERS[index];
    if (ch.rooms) return this.loadRoom(spawn?.room && ZONES[ch.rooms][spawn.room] ? spawn.room : ch.startRoom, null, spawn, index);
    this.roomId = null;
    return this.#build(index, ch, ch.map, spawn);
  }

  // Charge une salle d'une zone. entry = côté de la NOUVELLE salle par lequel on entre ('E'|'W'|'N'|'S'|null) ; spawn = point imposé (sauvegarde, cristal)
  loadRoom(id, entry = null, spawn = null, index = this.index, fromId = null) {
    const g = this.game, ch = CHAPTERS[index], room = ZONES[ch.rooms][id];
    this.roomId = id; this.room = room; g.visited?.add(id);
    const H = room.map.length, W = room.map[0].length;
    let at = spawn, boost = 0;
    if (!at && entry && fromId) {
      const back = room.exits.find((e) => e.to === fromId && e.side === entry) || room.exits.find((e) => e.side === entry);
      if (entry === 'W' || entry === 'E') at = { x: entry === 'W' ? 1.6 : W - 2.6, y: back ? back.y0 : 2 };
      else if (entry === 'N') at = { x: (back.x0 + back.x1 + 1) / 2, y: H - 2.6 };   // on tombe depuis la salle du dessus
      else {                                                                           // on jaillit du trou du sol, posé à côté du trou
        const floor = (x) => room.map[H - 2]?.[x] === '#' && room.map[H - 3]?.[x] !== '#';
        const xr = back.x1 + 2, xl = back.x0 - 2;
        at = { x: (floor(xr) || !floor(xl) ? xr : xl) + 0.5, y: 2 }; boost = 9;
      }
    }
    // sorties verrouillées : murées tant que le drapeau n'est pas levé (levé en traversant l'autre côté)
    const rows = room.map.map((r) => r.split(''));
    for (const e of room.exits) {
      if (!e.gate || g.collected?.has('flag:' + e.gate)) continue;
      if (e.side === 'W' || e.side === 'E') for (let y = e.y0; y <= e.y1; y++) rows[H - 1 - y][e.side === 'W' ? 0 : W - 1] = '#';
      else for (let x = e.x0; x <= e.x1; x++) { if (e.side === 'N') rows[0][x] = '#'; else { rows[H - 1][x] = '#'; rows[H - 2][x] = '#'; } }
    }
    this.#wrapGame();
    const ch2 = this.#build(index, ch, rows.map((r) => r.join('')), at, id);
    if (boost) g.player.vy = boost;
    return ch2;
  }

  // Sorties de salle : bord gauche/droit à hauteur d'une ouverture, plafond ouvert (monter), trou du sol (tomber)
  #checkExits() {
    const g = this.game, p = g.player, lv = this.level, room = this.room;
    if (!room || this.changing || g.transitioning || g.dialogue?.active || g.menu?.open || p.dead || document.body.dataset.started !== '1') return;
    const inX = (e) => p.x >= e.x0 - 0.2 && p.x <= e.x1 + 1.2;
    let ex = null, side = null;
    if (p.x < 0.5 || p.x > lv.w - 1.35) { side = p.x < 0.5 ? 'W' : 'E'; ex = room.exits.find((e) => e.side === side && p.y >= e.y0 - 0.5 && p.y <= e.y1 + 1); }
    else if (p.y > lv.h - 1.6) { side = 'N'; ex = room.exits.find((e) => e.side === 'N' && inX(e) && !(e.gate && !g.collected.has('flag:' + e.gate))); }
    else if (p.y < 0.5) { side = 'S'; ex = room.exits.find((e) => e.side === 'S' && inX(e)); }
    if (!ex) return;
    this.changing = true; g.hud.fade(true);
    const from = this.roomId, opp = { E: 'W', W: 'E', N: 'S', S: 'N' }[side];
    const keep = { ...p.spawnPoint };
    if (ex.opens && !g.collected.has('flag:' + ex.opens)) { g.collected.add('flag:' + ex.opens); setTimeout(() => g.hud.say('Quelque part, un passage s\'ouvre…', 3), 600); }
    setTimeout(() => {
      this.loadRoom(ex.to, opp, null, this.index, from); p.spawnPoint = keep; p.invuln = Math.max(p.invuln, 0.8); g.hud.fade(false); this.changing = false;
      const nm = this.room?.name; if (nm && !this.shown?.has(this.roomId)) { (this.shown ||= new Set()).add(this.roomId); g.hud.say(nm, 2.5); }
    }, 260);
  }

  // Sauvegarde et renaissance conscientes des salles (installé une seule fois)
  #wrapGame() {
    const g = this.game; if (g.__roomsWrapped) return; g.__roomsWrapped = true;
    const save = g.save.bind(g);
    g.save = (extra = {}) => {
      const sp = g.player.spawnPoint;
      return save(this.roomId && !extra.spawn && extra.spawn !== null ? { ...extra, spawn: { x: sp.x, y: sp.y, room: sp.room ?? this.roomId } } : extra);
    };
    const respawn = g.player.respawn.bind(g.player);
    g.player.respawn = () => {
      const sp = g.player.spawnPoint;
      if (this.roomId && sp.room && sp.room !== this.roomId) { this.loadRoom(sp.room, null, { x: sp.x, y: sp.y, room: sp.room }); }
      respawn();
    };
  }

  #build(index, ch, map, spawn = null, roomId = null) {
    const g = this.game;
    this.#clear();
    this.index = index;
    this.level = new Level({ name: ch.title, map, theme: ch.theme, seed: roomId ? [...roomId].reduce((a, c) => a + c.charCodeAt(0), 0) : 0 }, g.assets);
    g.level = this.level; g.scene.add(this.level.group);
    const bgTex = g.assets?.bg?.[ch.theme.bg?.image];
    if (bgTex) this.bg = new Background(g.scene, bgTex, ch.theme.bg.tint);
    g.camera.setBounds(this.level.bounds);
    this.walls = new Walls(g, this.level, roomId, ch.theme);   // murs fissurés (X)

    g.portals = new Portals(g, this.level.spawns, ch.portal);
    for (const s of this.level.spawns) {
      if (ENEMY_LETTERS.includes(s.type)) g.enemies.push(spawnEnemy(s.type, g, s.x, s.y, ch));
      else if (s.type === 'B' && !g.bossDead[index]) { g.boss = new Boss(g, s.x, s.y, ch.boss); g.enemies.push(g.boss); }
      else if (s.type === 'B') g.portals.openExit(s.x, s.y); // boss déjà vaincu : le portail de sortie reste ouvert
      else if (s.type === 'M' && !g.bossDead['m' + index]) { const m = new Boss(g, s.x, s.y, { ...ch.mini, mini: true }); g.miniBoss = m; g.enemies.push(m); }
      else if (s.type === 'N') g.npcs.push(new Npc(g, s.x, s.y, STORY[index].npc));
    }
    g.hazards = g.hazards || new Hazards(g);
    g.inter = new Interactables(g, this.level.spawns);

    const p = g.player, at = spawn || this.level.spawn;
    p.spawnPoint = { x: at.x, y: at.y, room: this.roomId };
    p.sprite.root.scale.setScalar(1);
    p.x = at.x; p.y = at.y; p.vx = p.vy = 0; p.hp = p.maxHp; p.dead = false; p.invuln = 1;
    g.camera.snapTo(at.x, at.y);
    g.unlocked = Math.max(g.unlocked || 0, index);
    return ch;
  }

  update(dt) {
    this.#checkExits();
    this.walls?.update();
    this.level?.update(dt);
    this.bg?.update(this.game.camera, this.level);
  }

  #clear() {
    const g = this.game;
    for (const e of g.enemies) if (!e.dead) { e.dispose ? e.dispose() : (g.scene.remove(e.mesh), e.anim?.dispose()); }
    for (const c of g.corpses || []) c.dispose();
    g.corpses = []; g.enemies = []; g.boss = null; g.miniBoss = null; g.hazards?.clear(); g.portals?.clear();
    for (const n of g.npcs || []) n.dispose();
    g.npcs = []; g.shards?.clear();
    for (const pr of g.projectiles) g.scene.remove(pr.mesh);
    for (const s of g.enemyShots) g.scene.remove(s.mesh);
    g.projectiles = []; g.enemyShots = [];
    g.inter?.dispose();
    this.bg?.dispose(); this.bg = null; this.walls = null;
    this.level?.dispose(); this.level = null;
  }
}
