import { createRenderer } from './engine/renderer.js';
import { GameCamera } from './engine/camera.js';
import { aabb } from './engine/physics.js';
import { Player } from './player/Player.js';
import { Effects } from './systems/Effects.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { Quests } from './systems/Quests.js';
import { applySkills } from './systems/Skills.js';
import { Shards } from './objects/Shards.js';
import { Input } from './ui/Input.js';
import { HUD } from './ui/HUD.js';
import { Dialogue } from './ui/Dialogue.js';
import { Cinematic } from './ui/Cinematic.js';
import { Living } from './systems/Living.js';
import { ENDING_CINE, ENDING_TITLE } from './story/prologue.js';
import { Menu } from './ui/Menu.js';
import { World } from './world/World.js';
import { CHAPTERS } from './levels/chapters.js';
import { INTRO, ENDING, STORY } from './story/story.js';
import { Music } from './audio/Music.js';
import { loadAssets } from './assets/Assets.js';

const SAVE_VERSION = 4;

async function boot() {
  const assets = await loadAssets();
  if (assets.missing) console.warn(`[Lumenfall] ${assets.missing} image(s) introuvable(s) : repli sur les sprites dessinés.`);

  const { renderer, scene } = createRenderer(document.getElementById('game'));
  const camera = new GameCamera();
  const input = new Input();
  const hud = new HUD();
  const fx = new Effects(scene, assets);
  const dialogue = new Dialogue();

  const audio = new Music();
  const unlockAudio = () => audio.unlock();
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlockAudio, { passive: true }));

  const game = {
    audio, scene, camera, fx, input, assets, hud, dialogue,
    world: null, level: null, player: null, boss: null, miniBoss: null, inter: null, npcs: [],
    enemies: [], projectiles: [], enemyShots: [],
    collected: new Set(), visited: new Set(), bossDead: {}, seen: new Set(), unlocked: 0, transitioning: false, hitStop: 0,
    say: (t, d) => hud.say(t, d),
    save(extra = {}) {
      const p = this.player;
      SaveSystem.write({
        v: SAVE_VERSION, chapter: this.world.index, spawn: { x: p.spawnPoint.x, y: p.spawnPoint.y },
        maxHp: p.maxHp, abilities: p.abilities, collected: [...this.collected], bossDead: this.bossDead,
        shards: p.shards, skills: p.skills, quests: this.quests.toJSON(), seen: [...this.seen], unlocked: this.unlocked, rooms: [...this.visited], ...extra,
      });
    },
    onPlayerDeath() { setTimeout(() => { game.player.respawn(); hud.say('Renaissance'); }, 1200); },
    onBossStart(b) {
      game.living.bossCard(b);
      if (!b.mini) dialogue.start(STORY[game.world.index].bossIntro);
    },
    onBossPhase(n) { hud.say(`PHASE ${n}`, 1.5); },
    onEnemyKilled(e) {
      const idx = game.world.index;
      if (e === game.boss) {
        game.bossDead[idx] = true; game.quests.progress('boss'); game.hitStop = 0.35; camera.shake(0.7, 0.6); camera.punch(0.12);
        hud.say('BOSS VAINCU', 3); game.living.victory(e); game.save();
        setTimeout(() => dialogue.start(STORY[idx].outro, () => { game.portals.openExit(e.home.x, e.home.y); hud.say('Un portail s\'ouvre…', 3); }), 2200);
      } else if (e.mini) {
        game.bossDead['m' + idx] = true; game.quests.progress('mini'); camera.shake(0.5, 0.4);
        hud.say(`${e.name.toUpperCase()} VAINCU`, 3); game.living.victory(e); game.save();
      } else game.quests.progress('kill');
    },
  };
  game.onExitPortal = () => endChapter();
  game.cine = new Cinematic(game);
  game.world = new World(game);
  game.shards = new Shards(game);
  game.quests = new Quests(game);
  game.living = new Living(game);
  window.__lumenfall = game;  // accès console (débogage / tests)

  game.player = new Player(scene, 0, 0, assets);
  const P = game.player;

  // --- Progression (sauvegarde v4 : + salles visitées ; v2 et v3 acceptées)
  function applyProgress(d = {}) {
    P.maxHp = d.maxHp ?? 5; P.hp = P.maxHp;
    P.abilities = { dash: true, doubleJump: false, wall: false, ...(d.abilities || {}) };
    P.shards = d.shards || 0; P.energy = 0;
    applySkills(P, d.skills || []);
    game.visited = new Set(d.rooms || []); game.collected = new Set(d.collected || []); game.bossDead = d.bossDead || {};
    game.seen = new Set(d.seen || []); game.unlocked = d.unlocked ?? d.chapter ?? 0;
    game.quests.load(d.quests);
  }
  const loadSave = () => { const s = SaveSystem.load(); if (s && (s.v >= 2 && s.v <= 4)) return s; if (s) SaveSystem.clear(); return null; };
  const urlCh = parseInt(new URLSearchParams(location.search).get('chapitre'), 10);
  const dev = urlCh >= 1 && urlCh <= CHAPTERS.length;

  // --- Fin de chapitre : fondu, chapitre suivant (ou fin du jeu)
  function endChapter() {
    const idx = game.world.index, next = idx + 1;
    if (next >= CHAPTERS.length) {
      game.save();
      dialogue.start(ENDING, () => game.cine.play(() => { hud.title('FIN', "Merci d'avoir joué", 8); setTimeout(() => showStart(), 8500); }, { script: ENDING_CINE, title: ENDING_TITLE }));
      return;
    }
    game.transitioning = true;
    game.unlocked = Math.max(game.unlocked, next);
    game.save({ chapter: next, spawn: null });
    hud.fade(true);
    setTimeout(() => { enterChapter(next, null); game.portals.arrive(); game.transitioning = false; hud.fade(false); }, 900);
  }

  // Charge un chapitre, affiche le titre puis la scène d'arrivée (une seule fois)
  function enterChapter(i, spawn) {
    const ch = game.world.load(i, spawn);
    hud.title(ch.subtitle, ch.title);
    const key = `arr:${i}`;
    if (!game.seen.has(key)) { game.seen.add(key); setTimeout(() => dialogue.start(STORY[i].arrival), 1200); }
    return ch;
  }

  // --- Menus
  const menu = new Menu(game, {
    hasSave: () => !!loadSave(),
    savedChapter: () => loadSave()?.chapter ?? 0,
    unlocked: () => Math.max(loadSave()?.unlocked ?? 0, loadSave()?.chapter ?? 0),
    continue() {
      const s = loadSave(); if (!s) return;
      applyProgress(s); window.enterGame(); menu.hide();
      enterChapter(Math.min(s.chapter ?? 0, CHAPTERS.length - 1), s.spawn || null);
    },
    newGame() {
      SaveSystem.clear(); applyProgress({}); window.enterGame(); menu.hide();
      const ch = game.world.load(0, null);
      hud.title(ch.subtitle, ch.title);
      game.seen.add('intro'); game.seen.add('arr:0');
      const afterCine = () => dialogue.start(INTRO.slice(5), () => dialogue.start(STORY[0].arrival));
      game.cine.play(afterCine);
    },
    chapter(i) {
      const s = loadSave(); if (s) applyProgress(s);
      window.enterGame(); menu.hide(); enterChapter(i, null);
    },
    resume() { menu.hide(); },
    mainMenu() { if (game.world.index >= 0) game.save(); showStart(); },
    erase() { SaveSystem.clear(); applyProgress({}); game.world.load(0, null); showStart(); },
  });
  function showStart() {
    const s = loadSave();
    game.transitioning = false; hud.fade(false);
    if (!s) { applyProgress({}); }
    game.world.load(s ? Math.min(s.chapter ?? 0, CHAPTERS.length - 1) : 0, s?.spawn || null); // décor de fond
    menu.show('start');
  }

  game.menu = menu;
  document.getElementById('menuBtn').addEventListener('click', togglePause);
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') togglePause(); });
  function togglePause() {
    if (['start', 'help', 'chapters', 'credits'].includes(menu.screen) || (menu.screen === 'options' && menu.origin === 'start')) return;
    if (menu.open) { menu.hide(); return; }
    if (document.body.dataset.started !== '1' || dialogue.active || game.transitioning) return;
    menu.show('pausemenu');
  }

  // --- Démarrage : ?chapitre=N lance directement (test) ; sinon menu de démarrage
  if (dev) {
    applyProgress({ shards: 150, unlocked: urlCh - 1 });
    if (urlCh >= 2) P.abilities.doubleJump = true;
    if (urlCh >= 3) P.abilities.wall = true;
    document.body.dataset.started = '1';
    game.seen.add('intro'); game.seen.add(`arr:${urlCh - 1}`);
    const ch = game.world.load(urlCh - 1, null); hud.title(ch.subtitle, ch.title);
  } else {
    const s = loadSave();
    applyProgress(s || {});
    game.world.load(s ? Math.min(s.chapter ?? 0, CHAPTERS.length - 1) : 0, s?.spawn || null);
    menu.show('start');
  }

  function updateEnemyShots(dt) {
    for (let i = game.enemyShots.length - 1; i >= 0; i--) {
      const s = game.enemyShots[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      s.mesh.position.set(s.x, s.y, 2); s.anim?.play(dt);
      const p = game.player;
      let dead = s.life <= 0 || game.level.isSolid(Math.floor(s.x), Math.floor(s.y));
      if (!p.dead && aabb({ x: s.x, y: s.y - s.h / 2, w: s.w, h: s.h }, p)) { p.damage(1, Math.sign(s.vx) * -1 || 1, game); dead = true; }
      if (dead && s.life > 0) fx.sprite('fx_hit', s.x, s.y, { w: 1.8, fps: 28, color: s.mesh.material.color.getHex() }); // impact d'un tir ennemi
      if (dead) { scene.remove(s.mesh); if (s.anim) s.anim.dispose(); else { s.mesh.geometry.dispose(); s.mesh.material.dispose(); } game.enemyShots.splice(i, 1); }
    }
  }

  function pickTrack() {
    if (game.cine?.active) { audio.setTrack(game.cine.script?.[0]?.id === 'eveil' ? 'ending' : 'prologue'); return; }
    if (document.body.dataset.started !== '1' || (menu.open && ['start', 'help', 'chapters', 'credits'].includes(menu.screen)) || (menu.screen === 'options' && menu.origin === 'start')) { audio.setTrack('menu'); return; }
    const bo = game.boss?.active && !game.boss.dead, mi = game.miniBoss?.active && !game.miniBoss.dead;
    audio.setTrack(bo ? 'boss' : mi ? 'mini' : 'ch' + Math.max(0, game.world.index));
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); // plafonné pour éviter les sauts après un lag
    last = now;

    const started = document.body.dataset.started === '1';
    const frozen = game.hitStop > 0;
    if (frozen) game.hitStop -= dt;
    const blocked = menu.open || dialogue.active || game.transitioning || !started;

    if (started && !blocked && !frozen) {
      game.player.update(input, game, dt);
      for (const e of game.enemies) e.update(game, dt);
      game.hazards?.update(dt);
      game.portals?.update(dt);
      game.enemies = game.enemies.filter((e) => !e.dead);
      if (game.corpses?.length) game.corpses = game.corpses.filter((c) => c.tickCorpse(dt));
      updateEnemyShots(dt);
      game.inter.update(dt);
      for (const n of game.npcs) n.update(dt);
      game.shards.update(dt);
    }
    if (started) {
      dialogue.update(dt, input);
      fx.update(frozen ? dt * 0.15 : dt);
      if (!menu.open) {
        camera.follow(game.player, game.player.facing, dt);
        const b = game.boss?.active && !game.boss.dead ? game.boss : game.miniBoss?.active && !game.miniBoss.dead ? game.miniBoss : null;
        hud.update(game.player, b, dt, game.quests);
      }
    }
    game.world.update(dt);
    game.living.update(dt);
    pickTrack();
    renderer.render(scene, camera.cam);
    if (!frozen) input.endFrame(); // les appuis ne se perdent pas pendant le hit-stop
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot().catch((e) => { console.error(e); if (window.showErr) window.showErr('Erreur: ' + (e && e.message || e)); });
