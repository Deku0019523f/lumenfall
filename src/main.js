import { createRenderer } from './engine/renderer.js';
import { GameCamera } from './engine/camera.js';
import { aabb } from './engine/physics.js';
import { Player } from './player/Player.js';
import { Effects } from './systems/Effects.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { Input } from './ui/Input.js';
import { HUD } from './ui/HUD.js';
import { World } from './world/World.js';
import { CHAPTERS } from './levels/chapters.js';
import { loadAssets } from './assets/Assets.js';

async function boot() {
  const assets = await loadAssets();
  if (assets.missing) console.warn(`[Lumenfall] ${assets.missing} image(s) introuvable(s) : repli sur les sprites dessinés.`);

  const { renderer, scene } = createRenderer(document.getElementById('game'));
  const camera = new GameCamera();
  const input = new Input();
  const hud = new HUD();
  const fx = new Effects(scene);

  const game = {
    scene, camera, fx, input, assets, hud,
    world: null, level: null, player: null, boss: null, inter: null,
    enemies: [], projectiles: [], enemyShots: [],
    collected: new Set(), bossDead: {}, transitioning: false,
    say: (t) => hud.say(t),
    save(extra = {}) {
      const p = this.player;
      SaveSystem.write({
        v: 2, chapter: this.world.index, spawn: { x: p.spawnPoint.x, y: p.spawnPoint.y },
        maxHp: p.maxHp, abilities: p.abilities, collected: [...this.collected], bossDead: this.bossDead, ...extra,
      });
    },
    onPlayerDeath() { setTimeout(() => { game.player.respawn(); hud.say('Renaissance'); }, 1200); },
    onBossStart(b) { hud.say(b.name.toUpperCase(), 2.5); },
    onBossPhase(n) { hud.say(`PHASE ${n}`, 1.5); },
    onEnemyKilled(e) { if (e === game.boss) { game.bossDead[game.world.index] = true; hud.say('BOSS VAINCU', 3); setTimeout(endChapter, 3200); } },
  };
  game.world = new World(game);
  window.__lumenfall = game; // accès console (débogage / tests)

  // --- Sauvegarde (v2) ou démarrage ; ?chapitre=N pour tester directement un chapitre
  const urlCh = parseInt(new URLSearchParams(location.search).get('chapitre'), 10);
  const dev = urlCh >= 1 && urlCh <= CHAPTERS.length;
  let saved = dev ? null : SaveSystem.load();
  if (saved && saved.v !== 2) { SaveSystem.clear(); saved = null; } // ancienne sauvegarde (avant les chapitres)

  game.player = new Player(scene, 0, 0, assets);
  const P = game.player;
  let chapter = 0, spawn = null;
  if (saved) {
    chapter = Math.min(saved.chapter ?? 0, CHAPTERS.length - 1);
    spawn = saved.spawn || null;
    P.maxHp = saved.maxHp ?? 5; Object.assign(P.abilities, saved.abilities);
    game.collected = new Set(saved.collected || []); game.bossDead = saved.bossDead || {};
  } else if (dev) {
    chapter = urlCh - 1;
    if (chapter >= 1) P.abilities.doubleJump = true;
    if (chapter >= 2) P.abilities.wall = true;
  }
  const first = game.world.load(chapter, spawn, !!game.bossDead[chapter]);
  hud.title(first.subtitle, first.title);

  // --- Fin de chapitre : fondu, chapitre suivant (ou fin du jeu)
  function endChapter() {
    const idx = game.world.index, next = idx + 1;
    if (next >= CHAPTERS.length) { game.save(); hud.title('FIN', 'Merci d\'avoir joué', 8); return; }
    game.transitioning = true;
    game.save({ chapter: next, spawn: null }); // la progression est sauvegardée avant la transition
    hud.fade(true);
    setTimeout(() => {
      const ch = game.world.load(next, null, false);
      hud.title(ch.subtitle, ch.title);
      game.transitioning = false;
      hud.fade(false);
    }, 900);
  }

  document.getElementById('menuBtn').addEventListener('click', () => {
    if (confirm('Effacer la sauvegarde et recommencer ?')) { SaveSystem.clear(); location.href = location.pathname; }
  });

  function updateEnemyShots(dt) {
    for (let i = game.enemyShots.length - 1; i >= 0; i--) {
      const s = game.enemyShots[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      s.mesh.position.set(s.x, s.y, 2);
      const p = game.player;
      let dead = s.life <= 0 || game.level.isSolid(Math.floor(s.x), Math.floor(s.y));
      if (!p.dead && aabb({ x: s.x, y: s.y - s.h / 2, w: s.w, h: s.h }, p)) { p.damage(1, Math.sign(s.vx) * -1 || 1, game); dead = true; }
      if (dead) { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); game.enemyShots.splice(i, 1); }
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); // plafonné pour éviter les sauts après un lag
    last = now;

    // Figé tant que le joueur n'a pas touché "JOUER" (et pendant les transitions de chapitre)
    if (document.body.dataset.started === '1' && !game.transitioning) {
      game.player.update(input, game, dt);
      for (const e of game.enemies) e.update(game, dt);
      game.enemies = game.enemies.filter((e) => !e.dead);
      updateEnemyShots(dt);
      game.inter.update(dt);
      fx.update(dt);
      camera.follow(game.player, game.player.facing, dt);
      hud.update(game.player, game.boss, dt);
    }
    game.world.update(dt);
    renderer.render(scene, camera.cam);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot().catch((e) => { console.error(e); if (window.showErr) window.showErr('Erreur: ' + (e && e.message || e)); });
