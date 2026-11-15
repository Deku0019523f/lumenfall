import { createRenderer } from './engine/renderer.js';
import { GameCamera } from './engine/camera.js';
import { aabb } from './engine/physics.js';
import { Level } from './world/Level.js';
import { zone1 } from './levels/zone1.js';
import { Player } from './player/Player.js';
import { Crawler } from './enemies/Crawler.js';
import { Flyer } from './enemies/Flyer.js';
import { Boss } from './bosses/Boss.js';
import { Interactables } from './objects/Interactables.js';
import { Effects } from './systems/Effects.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { Input } from './ui/Input.js';
import { HUD } from './ui/HUD.js';

const { renderer, scene } = createRenderer(document.getElementById('game'));
const camera = new GameCamera();
const input = new Input();
const hud = new HUD();
const fx = new Effects(scene);

const level = new Level(zone1);
scene.add(level.group);
camera.setBounds(level.bounds);

const game = {
  scene, camera, fx, level, input,
  enemies: [], projectiles: [], enemyShots: [], player: null, boss: null, inter: null,
  say: (t) => hud.say(t),
  save() {
    const p = this.player;
    SaveSystem.write({ spawn: p.spawnPoint, maxHp: p.maxHp, abilities: p.abilities, bossDead: !!(this.boss && this.boss.dead) });
  },
  onPlayerDeath() { setTimeout(() => { game.player.respawn(); hud.say('Renaissance'); }, 1200); },
  onBossStart() { hud.say('LA GARDIENNE DES RACINES', 2.5); },
  onBossPhase(n) { hud.say(`PHASE ${n}`, 1.5); },
  onEnemyKilled(e) { if (e === game.boss) { hud.say('BOSS VAINCU', 3); game.save(); } },
};

// Chargement de la sauvegarde
const saved = SaveSystem.load();
const start = saved?.spawn ?? level.spawn;
game.player = new Player(scene, start.x, start.y);
if (saved) { game.player.maxHp = saved.maxHp ?? 5; game.player.hp = game.player.maxHp; Object.assign(game.player.abilities, saved.abilities); }

for (const s of level.spawns) {
  if (s.type === 'c') game.enemies.push(new Crawler(game, s.x, s.y));
  else if (s.type === 'f') game.enemies.push(new Flyer(game, s.x, s.y));
  else if (s.type === 'B' && !saved?.bossDead) { game.boss = new Boss(game, s.x, s.y); game.enemies.push(game.boss); }
}
game.inter = new Interactables(game, level.spawns);
camera.snapTo(start.x, start.y);

document.getElementById('menuBtn').addEventListener('click', () => {
  if (confirm('Effacer la sauvegarde et recommencer ?')) { SaveSystem.clear(); location.reload(); }
});

function updateEnemyShots(dt) {
  for (let i = game.enemyShots.length - 1; i >= 0; i--) {
    const s = game.enemyShots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    s.mesh.position.set(s.x, s.y, 2);
    const p = game.player;
    let dead = s.life <= 0 || level.isSolid(Math.floor(s.x), Math.floor(s.y));
    if (!p.dead && aabb({ x: s.x, y: s.y - s.h / 2, w: s.w, h: s.h }, p)) { p.damage(1, Math.sign(s.vx) * -1 || 1, game); dead = true; }
    if (dead) { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); game.enemyShots.splice(i, 1); }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30); // plafonné pour éviter les sauts après un lag
  last = now;

  // Le jeu reste figé tant que le joueur n'a pas touché "JOUER"
  if (document.body.dataset.started !== '1') {
    renderer.render(scene, camera.cam);
    requestAnimationFrame(frame);
    return;
  }

  game.player.update(input, game, dt);
  for (const e of game.enemies) e.update(game, dt);
  game.enemies = game.enemies.filter((e) => !e.dead);
  updateEnemyShots(dt);
  game.inter.update(dt);
  fx.update(dt);
  camera.follow(game.player, game.player.facing, dt);
  hud.update(game.player, game.boss, dt);

  renderer.render(scene, camera.cam);
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
