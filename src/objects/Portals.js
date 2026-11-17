import { SpriteAnim } from '../engine/SpriteAnim.js';

// Portails (pack « Pixel Portal »). Deux usages :
//  • paires de portails dans la carte ('T' ↔ 't', i-ème T avec i-ème t) : raccourcis, actifs une fois les DEUX extrémités découvertes ;
//  • portail de sortie (après le boss) et portail d'arrivée (le héros en sort) pour changer de chapitre.
// Séquence de téléportation : le héros est aspiré (rétrécit), apparaît à l'autre portail (grandit).
const COLORS = { blue: 0x6ea8ff, yellow: 0xffd24a, red: 0xff4a6a };
const OPEN = 12, LOOP0 = 12, LOOP1 = 20, SIZE = 3.4;

export class Portals {
  constructor(game, spawns, color = 'blue') {
    this.game = game; this.color = color; this.items = []; this.tele = null; this.cool = 0;
    const strip = game.assets?.strips?.['portal_' + color];
    this.strip = strip;
    const ts = spawns.filter((s) => s.type === 'T'), us = spawns.filter((s) => s.type === 't');
    const n = Math.min(ts.length, us.length);
    for (let i = 0; i < n; i++) {
      const a = this.#make(ts[i]), b = this.#make(us[i]); a.twin = b; b.twin = a;
    }
  }

  #make(s, extra = {}) {
    const g = this.game, key = `portal:${g.world.index}:${s.x}:${s.y}`;
    const it = { x: s.x, y: s.y, key, state: 'closed', t: 0, a: null, ...extra };
    if (this.strip) { it.a = new SpriteAnim(this.strip, SIZE, { fps: 14 }); it.a.t = 0; it.a.mesh.position.set(s.x, s.y + SIZE / 2 - 0.15, 0.6); g.scene.add(it.a.mesh); }
    if (g.collected.has(key) || extra.open) { it.state = 'loop'; it.disc = true; }
    this.items.push(it); this.#frame(it);
    return it;
  }

  // Portail de sortie du chapitre : le héros qui le touche passe au chapitre suivant
  openExit(x, y) {
    const it = this.#make({ x, y }, { exit: true, open: true });
    it.state = 'opening'; it.t = 0; it.disc = true;
    this.game.audio?.sfx('portalOpen'); this.game.camera.shake(0.25, 0.4);
    this.game.fx.ring(x, y + 1.5, COLORS[this.color], 5, 0.6);
    return it;
  }

  // Arrivée dans un nouveau chapitre : un portail s'ouvre sur le point de départ, le héros en sort
  arrive() {
    const g = this.game, p = g.player;
    const it = this.#make({ x: p.x, y: p.y }, { open: true, arrival: true });
    it.state = 'opening'; it.t = 0;
    this.tele = { phase: 'out', t: 0, dur: 0.55, delay: 0.7, src: it, dst: it, arrival: true };
    p.sprite.root.scale.setScalar(0.001);
    g.audio?.sfx('portalOpen');
  }

  #frame(it) {
    if (!it.a) return;
    let f = 0, o = 1;
    if (it.state === 'closed') { f = 4; o = 0.45; }
    else if (it.state === 'opening') f = Math.min(OPEN - 1, it.t * 14);
    else if (it.state === 'closing') f = Math.max(0, OPEN - 1 - it.t * 14);
    else f = LOOP0 + ((it.t * 12) % (LOOP1 - LOOP0 + 1));
    it.a.setFrame(f); it.a.mat.opacity = o; it.a.mesh.visible = !(it.state === 'closing' && f < 0.5);
  }

  #ring(it, big = 4) { this.game.fx.ring(it.x, it.y + 1.5, COLORS[this.color], big, 0.45); this.game.fx.glow?.(it.x, it.y + 1.5, COLORS[this.color], 3, 0.3); }

  update(dt) {
    const g = this.game, p = g.player;
    if (this.cool > 0) this.cool -= dt;
    for (const it of this.items) {
      it.t += dt;
      if (it.state === 'closed' && !p.dead && Math.abs(p.x - it.x) < 5 && Math.abs(p.y - it.y) < 4) { // découverte
        it.state = 'opening'; it.t = 0; it.disc = true; g.collected.add(it.key); g.audio?.sfx('portalOpen'); this.#ring(it, 5); g.say?.('Un portail s\'éveille…', 2);
      } else if (it.state === 'opening' && it.t * 14 >= OPEN) { it.state = 'loop'; it.t = 0; }
      else if (it.state === 'closing' && it.t * 14 >= OPEN) it.dead = true;
      this.#frame(it);
    }
    for (let i = this.items.length - 1; i >= 0; i--) if (this.items[i].dead) { this.#drop(this.items[i]); this.items.splice(i, 1); }

    const T = this.tele;
    if (T) { this.#updateTele(T, dt); return; }
    if (p.dead || this.cool > 0) return;
    for (const it of this.items) {
      if (it.state !== 'loop' || it.arrival) continue;
      if (Math.abs(p.x - it.x) > 0.8 || Math.abs((p.y + 0.8) - (it.y + 1.55)) > 1.7) { it.hint = false; continue; }
      if (!it.exit) { // portail de la carte : appuyer sur HAUT pour entrer (évite de se téléporter en passant devant)
        if (!(it.twin && it.twin.disc)) { if (g.input.axisY > 0.6) { g.say?.('Le portail ne répond pas… explore plus loin', 2.5); this.cool = 2; } continue; }
        if (g.input.axisY <= 0.6) { if (!it.hint) { it.hint = true; g.say?.('↑ pour entrer dans le portail', 1.5); } continue; }
      }
      this.tele = { phase: 'in', t: 0, dur: 0.3, delay: 0, src: it, dst: it.exit ? null : it.twin };
      g.audio?.sfx('portal'); this.#ring(it, 4); p.invuln = Math.max(p.invuln, 0.8);
      return;
    }
  }

  #updateTele(T, dt) {
    const g = this.game, p = g.player, root = p.sprite.root;
    p.vx = p.vy = 0; p.invuln = Math.max(p.invuln, 0.25);
    if (T.delay > 0) { T.delay -= dt; root.scale.setScalar(0.001); return; }
    T.t += dt; const k = Math.min(1, T.t / T.dur);
    if (T.phase === 'in') { // aspiré vers le centre du portail
      const e = k * k; root.scale.setScalar(Math.max(0.001, 1 - e));
      p.x += (T.src.x - p.x) * Math.min(1, dt * 14); p.y += ((T.src.y + 0.5) - p.y) * Math.min(1, dt * 10);
      if (k >= 1) {
        if (!T.dst) { this.tele = null; g.onExitPortal?.(); return; }
        p.x = T.dst.x; p.y = T.dst.y; g.camera.snapTo(p.x, p.y);
        this.#ring(T.dst, 5); g.audio?.sfx('portal'); g.camera.shake(0.15, 0.2);
        this.tele = { phase: 'out', t: 0, dur: 0.3, delay: 0, src: T.dst, dst: T.dst }; this.cool = 1.2;
      }
    } else { // ressort du portail
      const e = 1 - (1 - k) * (1 - k); root.scale.setScalar(Math.max(0.001, e));
      p.x = T.dst.x; p.y = T.dst.y;
      if (k >= 1) {
        root.scale.setScalar(1); this.tele = null; this.cool = 1.2;
        if (T.arrival) { T.src.state = 'closing'; T.src.t = 0; }
      }
    }
  }

  #drop(it) { if (it.a) { this.game.scene.remove(it.a.mesh); it.a.dispose(); } }
  clear() { for (const it of this.items) this.#drop(it); this.items = []; this.tele = null; this.cool = 0; }
}
