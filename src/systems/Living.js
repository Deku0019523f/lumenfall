import * as THREE from 'three';

// « Le monde vivant » : toutes les animations d'ambiance du jeu, regroupées ici (un seul branchement dans main.js).
//  • Ambiance par chapitre : lucioles (Racines), feuilles portées par le vent (Plaines), braises violettes + brume (Village)
//  • Lueur : petite lumière compagnon qui suit le héros (apparaît après le prologue)
//  • PNJ : point d'exclamation doré tant qu'on ne leur a pas parlé ; cristaux de sauvegarde et orbes : halo qui respire
//  • Cartes : nom du boss (barres de cinéma + zoom), flash de victoire, titre de chapitre animé, pouvoir éveillé
//  • Détails : cœurs qui battent à 1 PV, éclat de réapparition, menu d'accueil avec braises et lucioles
const rnd = (a, b) => a + Math.random() * (b - a);

const CSS = `
#title.cn { animation: cnTitle 3.8s ease-out both; }
@keyframes cnTitle { 0% { letter-spacing: 26px; filter: blur(8px); transform: translateY(10px); } 22% { letter-spacing: 6px; filter: none; transform: none; } 100% { letter-spacing: 8px; filter: none; transform: translateY(-4px); } }
#title.cn::after { content: ''; display: block; height: 2px; width: 0; margin: 12px auto 0; background: linear-gradient(90deg, transparent, #ffe08a, transparent); animation: cnLine 2.2s .5s ease-out forwards; }
@keyframes cnLine { to { width: min(420px, 60vw); } }
body.lowhp .mask:not(.empty) { animation: cnBeat .85s ease-in-out infinite; }
@keyframes cnBeat { 0%, 100% { transform: scale(1); } 18% { transform: scale(1.28); box-shadow: 0 0 14px #ff5577; background: #ffd6de; } 36% { transform: scale(1.05); } }
#menu.home .logo { animation: cnLogo 6s ease-in-out infinite; }
@keyframes cnLogo { 50% { transform: translateY(-5px) scale(1.006); } }
#cnBars i { position: fixed; left: 0; right: 0; height: 11vh; background: #000; z-index: 40; pointer-events: none; }
#cnBars i:first-child { top: 0; animation: cnBarT 2.9s ease-in-out both; } #cnBars i:last-child { bottom: 0; animation: cnBarB 2.9s ease-in-out both; }
@keyframes cnBarT { 0% { transform: translateY(-100%); } 14%, 80% { transform: none; } 100% { transform: translateY(-100%); } }
@keyframes cnBarB { 0% { transform: translateY(100%); } 14%, 80% { transform: none; } 100% { transform: translateY(100%); } }
#cnBoss { position: fixed; left: 0; right: 0; top: 36%; text-align: center; z-index: 41; pointer-events: none; font-family: 'EB Garamond', Georgia, serif; color: #fff3c8; animation: cnBoss 2.9s ease-out both; }
#cnBoss small { display: block; font-size: clamp(12px, 3vh, 17px); letter-spacing: 9px; color: #ff9aa8; margin-bottom: 4px; }
#cnBoss b { display: block; font-weight: 500; font-size: clamp(30px, 9vh, 62px); letter-spacing: 8px; text-transform: uppercase; text-shadow: 0 0 24px rgba(255,90,120,.85), 0 0 60px rgba(150,80,255,.55), 0 3px 8px #000; }
#cnBoss.mini b { font-size: clamp(22px, 6vh, 40px); } #cnBoss.mini small { color: #cdbcf5; }
@keyframes cnBoss { 0% { opacity: 0; letter-spacing: 30px; filter: blur(10px); } 16% { opacity: 1; filter: none; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-8px); } }
#cnFlash { position: fixed; inset: 0; z-index: 39; pointer-events: none; background: radial-gradient(circle, #fff8e0, #ffe08a 40%, transparent 75%); animation: cnFlash 1.1s ease-out both; }
@keyframes cnFlash { 0% { opacity: .9; } 100% { opacity: 0; } }
#cnPower { position: fixed; left: 0; right: 0; top: 30%; text-align: center; z-index: 41; pointer-events: none; font-family: 'EB Garamond', Georgia, serif; color: #fff3c8; text-shadow: 0 0 22px #ffd27a, 0 2px 8px #000; animation: cnBoss 3s ease-out both; }
#cnPower small { display: block; font-size: clamp(12px, 3vh, 16px); letter-spacing: 8px; opacity: .8; } #cnPower b { font-weight: 500; font-size: clamp(26px, 7vh, 46px); letter-spacing: 6px; }
#cnMenuFx { position: fixed; inset: 0; z-index: 51; pointer-events: none; }
`;

export class Living {
  constructor(game) {
    this.g = game; this.t = 0; this.kind = -1; this.pool = []; this.alpha = 0; this.hist = []; this.marks = new Map(); this.halos = new Map();
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const fx = game.fx; this.mats = [];
    // Lueur : cœur + halo + traînée
    this.lueur = { core: this.#spr(0xffffff, 0.34, 3.7), halo: this.#spr(0x8fe8ff, 1.6, 3.65), trail: Array.from({ length: 7 }, () => this.#spr(0x8fe8ff, 0.3, 3.6)), x: 0, y: 0, init: false, ph: Math.random() * 6 };
    this.lueur.core.visible = this.lueur.halo.visible = false; this.lueur.trail.forEach((m) => (m.visible = false));
    // pictogramme « ! »
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.font = 'bold 54px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#ffd27a'; x.shadowBlur = 14; x.fillStyle = '#fff3c8'; x.fillText('!', 32, 34);
    this.texBang = new THREE.CanvasTexture(c);
    // titre de chapitre animé + cœurs qui battent
    const hud = game.hud, orig = hud.title.bind(hud);
    hud.title = (sub, main, t) => { orig(sub, main, t); const el = hud.titleEl; el.classList.remove('cn'); void el.offsetWidth; el.classList.add('cn'); };
    this.prev = { dead: false, dj: false, wall: false };
    // menu d'accueil : braises et lucioles (canvas par-dessus)
    this.mcv = document.createElement('canvas'); this.mcv.id = 'cnMenuFx'; this.mcv.style.display = 'none'; document.body.appendChild(this.mcv); this.mctx = this.mcv.getContext('2d');
    this.mp = Array.from({ length: 70 }, () => this.#mpart(true));
  }

  #spr(color, size, z) {
    const g = this.g, m = new THREE.Mesh(g.fx.plane, new THREE.MeshBasicMaterial({ map: g.fx.texGlow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.scale.set(size, size, 1); m.position.z = z; g.scene.add(m); return m;
  }
  #kill(m) { this.g.scene.remove(m); m.material.dispose(); }

  // ─── Ambiance (particules relatives à la caméra : aucune dépendance aux salles) ───
  #rebuild(kind) {
    for (const p of this.pool) this.#kill(p.m);
    this.pool = []; this.kind = kind;
    const n = kind === 1 ? 34 : kind === 0 ? 30 : 36;
    for (let i = 0; i < n; i++) {
      const col = kind === 0 ? (Math.random() < 0.6 ? 0xcfff7a : 0x9bffd0) : kind === 1 ? (Math.random() < 0.5 ? 0xe8f6ff : 0xbfe8c8) : (Math.random() < 0.5 ? 0xc9a0ff : 0xffa868);
      const m = this.#spr(col, 0.3, 3.4);
      if (kind === 1) m.scale.set(0.55, 0.16, 1);
      this.pool.push({ m, u: Math.random(), v: Math.random(), s: rnd(0.6, 1.4), ph: rnd(0, 6.3), size: kind === 0 ? rnd(0.22, 0.5) : kind === 1 ? rnd(0.5, 1) : rnd(0.18, 0.4) });
    }
    if (kind === 2) for (let i = 0; i < 6; i++) { const m = this.#spr(0x8a7ab0, 9, 3.9); m.material.opacity = 0.07; this.pool.push({ m, u: Math.random(), v: rnd(0.1, 0.5), s: 0.25, ph: rnd(0, 6.3), size: 9, mist: true }); }
  }

  #ambience(dt, on) {
    const g = this.g, kind = Math.max(0, Math.min(2, g.world?.index ?? 0));
    if (kind !== this.kind) this.#rebuild(kind);
    const cam = g.camera, hw = cam.halfW * 1.05, hh = cam.halfH * 1.05, T = this.t;
    for (const p of this.pool) {
      p.m.visible = on; if (!on) continue;
      if (kind === 0) { p.u += Math.sin(T * 0.4 + p.ph) * 0.01 * dt * p.s; p.v += Math.cos(T * 0.35 + p.ph) * 0.012 * dt; }
      else if (kind === 1) { p.u += (0.07 + 0.03 * Math.sin(T * 0.5 + p.ph)) * dt * p.s; p.v += Math.sin(T * 1.6 + p.ph) * 0.02 * dt - 0.006 * dt; p.m.rotation.z = Math.sin(T * 2 + p.ph) * 0.5; }
      else if (p.mist) p.u += 0.006 * dt;
      else { p.v += 0.035 * dt * p.s; p.u += Math.sin(T * 0.8 + p.ph) * 0.01 * dt; }
      p.u = ((p.u % 1) + 1) % 1; p.v = ((p.v % 1) + 1) % 1;
      p.m.position.x = cam.x + (p.u - 0.5) * 2 * hw; p.m.position.y = cam.y + (p.v - 0.5) * 2 * hh;
      if (p.mist) continue;
      const a = kind === 0 ? 0.15 + 0.85 * Math.max(0, Math.sin(T * 1.7 * p.s + p.ph)) : kind === 1 ? 0.55 : 0.8 * Math.min(1, Math.min(p.v, 1 - p.v) * 5);
      p.m.material.opacity = a; if (kind !== 1) p.m.scale.set(p.size, p.size, 1);
    }
  }

  // ─── Lueur, compagnon ───
  #companion(dt, on) {
    const g = this.g, p = g.player, L = this.lueur, vis = on && !p.dead;
    this.alpha = vis ? Math.min(1, this.alpha + dt * 0.5) : Math.max(0, this.alpha - dt * 2);
    const show = this.alpha > 0.01;
    L.core.visible = L.halo.visible = show; L.trail.forEach((m) => (m.visible = show));
    if (!show) { L.init = false; return; }
    const tx = p.x - p.facing * 1.2, ty = p.y + 2.1 + Math.sin(this.t * 2 + L.ph) * 0.25;
    if (!L.init || Math.hypot(tx - L.x, ty - L.y) > 16) { L.x = tx; L.y = ty; L.init = true; this.hist = []; }
    const k = 1 - Math.pow(0.04, dt); L.x += (tx - L.x) * k; L.y += (ty - L.y) * k;
    this.hist.unshift({ x: L.x, y: L.y }); if (this.hist.length > 40) this.hist.length = 40;
    const fl = 1 + Math.sin(this.t * 11) * 0.07, low = p.hp <= 1 && p.maxHp > 1, col = low ? 0xffc27a : 0x8fe8ff, A = this.alpha;
    L.core.position.set(L.x, L.y, 3.7); L.core.material.opacity = A;
    L.halo.position.set(L.x, L.y, 3.65); L.halo.scale.set(1.6 * fl, 1.6 * fl, 1); L.halo.material.color.setHex(col); L.halo.material.opacity = 0.75 * A;
    L.trail.forEach((m, i) => { const h = this.hist[(i + 1) * 5] || this.hist[this.hist.length - 1]; if (!h) return; m.position.set(h.x, h.y, 3.6); const s = 0.3 * (1 - i / 8); m.scale.set(s, s, 1); m.material.color.setHex(col); m.material.opacity = (0.55 - i * 0.07) * A; });
  }

  // ─── PNJ, cristaux, orbes ───
  #objects(dt, on) {
    const g = this.g, T = this.t, seen = new Set();
    for (const n of g.npcs || []) {
      seen.add(n); let m = this.marks.get(n);
      if (!m) { m = new THREE.Mesh(g.fx.plane, new THREE.MeshBasicMaterial({ map: this.texBang, transparent: true, depthWrite: false })); m.scale.set(0.8, 0.8, 1); g.scene.add(m); this.marks.set(n, m); }
      m.visible = on && !g.seen.has(n.key); m.position.set(n.x, n.y + 2.5 + Math.abs(Math.sin(T * 3)) * 0.3, 4);
    }
    for (const [n, m] of this.marks) if (!seen.has(n)) { this.#kill(m); this.marks.delete(n); }
    const seenI = new Set();
    for (const it of g.inter?.list || []) {
      if (it.kind !== 'save' && it.kind !== 'orb') continue; if (it.used) continue;
      seenI.add(it); let h = this.halos.get(it);
      if (!h) { h = this.#spr(it.kind === 'save' ? 0x8fe8ff : it.color, 2, 0.4); this.halos.set(it, h); }
      const s = (it.kind === 'save' ? 2.6 : 3.4) * (1 + Math.sin(T * 2.2 + it.x) * 0.12);
      h.scale.set(s, s, 1); h.position.set(it.mesh.position.x, it.mesh.position.y, 0.4); h.material.opacity = 0.35 + Math.sin(T * 2.2 + it.x) * 0.12; h.visible = on;
    }
    for (const [it, h] of this.halos) if (!seenI.has(it)) { this.#kill(h); this.halos.delete(it); }
  }

  // ─── Cartes et événements ───
  bossCard(b) {
    const g = this.g, mini = !!b.mini;
    if (!mini) { const bars = document.createElement('div'); bars.id = 'cnBars'; bars.innerHTML = '<i></i><i></i>'; document.body.appendChild(bars); setTimeout(() => bars.remove(), 3000); }
    const el = document.createElement('div'); el.id = 'cnBoss'; if (mini) el.className = 'mini';
    el.innerHTML = `<small>${mini ? 'GARDIEN' : 'BOSS'}</small><b></b>`; el.querySelector('b').textContent = b.name; document.body.appendChild(el); setTimeout(() => el.remove(), 3000);
    g.camera.punch(mini ? 0.08 : 0.16); g.camera.shake(mini ? 0.15 : 0.35, 0.6);
    g.fx.ring(b.x, b.y + 1, 0xff5577, 6, 0.7);
  }
  victory(e) {
    const g = this.g, f = document.createElement('div'); f.id = 'cnFlash'; document.body.appendChild(f); setTimeout(() => f.remove(), 1200);
    for (let i = 0; i < 3; i++) setTimeout(() => g.fx.ring(e.x, e.y + 1, i ? 0xffe08a : 0xffffff, 5 + i * 2.5, 0.8), i * 160);
    g.fx.sparks(e.x, e.y + 1, 0xffe08a, 40, 12);
  }
  power(label) {
    const g = this.g, p = g.player, el = document.createElement('div'); el.id = 'cnPower'; el.innerHTML = '<small>POUVOIR ÉVEILLÉ</small><b></b>'; el.querySelector('b').textContent = label; document.body.appendChild(el); setTimeout(() => el.remove(), 3100);
    for (let i = 0; i < 4; i++) setTimeout(() => g.fx.ring(p.x, p.y + 1, 0xffe08a, 3 + i * 1.8, 0.7), i * 140);
    g.fx.sparks(p.x, p.y + 1, 0xffe08a, 36, 11); g.camera.shake(0.2, 0.4);
  }
  #events() {
    const g = this.g, p = g.player;
    if (this.prev.dead && !p.dead) { g.fx.ring(p.x, p.y + 1, 0x8fe8ff, 3.5, 0.6); g.fx.ring(p.x, p.y + 1, 0xffffff, 2, 0.4); g.fx.sparks(p.x, p.y + 1, 0x8fe8ff, 24, 9); }
    this.prev.dead = p.dead;
    for (const [k, key, lbl] of [['dj', 'doubleJump', 'Double saut'], ['wall', 'wall', 'Saut mural']]) {
      const has = !!p.abilities?.[key]; if (has && !this.prev[k] && this.prevReady) this.power(lbl); this.prev[k] = has;
    }
    this.prevReady = true;
    document.body.classList.toggle('lowhp', p.hp === 1 && p.maxHp > 1 && !p.dead);
  }

  // ─── Menu d'accueil ───
  #mpart(init) { const fire = Math.random() < 0.65; return { x: Math.random(), y: init ? Math.random() : 1.05, s: rnd(0.02, 0.07), r: rnd(1.2, 3.2), ph: rnd(0, 6.3), c: fire ? '255,190,110' : '150,255,190', fire }; }
  #menuFx(dt, on) {
    const cv = this.mcv; cv.style.display = on ? 'block' : 'none'; if (!on) return;
    if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; }
    const c = this.mctx, W = cv.width, H = cv.height; c.clearRect(0, 0, W, H); c.globalCompositeOperation = 'lighter';
    for (const p of this.mp) {
      p.y -= p.s * dt * (p.fire ? 1 : 0.4); p.x += Math.sin(this.t * 0.7 + p.ph) * 0.012 * dt;
      if (p.y < -0.05) Object.assign(p, this.#mpart(false));
      const a = (p.fire ? 0.7 : 0.2 + 0.7 * Math.max(0, Math.sin(this.t * 1.6 + p.ph))) * Math.min(1, p.y * 4, (1 - p.y) * 6 + 0.2), r = p.r * (H / 500) * 3;
      const gr = c.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, r); gr.addColorStop(0, `rgba(${p.c},${a})`); gr.addColorStop(1, `rgba(${p.c},0)`); c.fillStyle = gr; c.fillRect(p.x * W - r, p.y * H - r, r * 2, r * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }

  update(dt) {
    const g = this.g; this.t += dt;
    const started = document.body.dataset.started === '1', inGame = started && !g.menu?.open && !g.cine?.active;
    this.#ambience(dt, started && !g.cine?.active && !(g.menu?.open && g.menu.screen === 'start'));
    this.#companion(dt, inGame || (started && g.dialogue?.active));
    this.#objects(dt, started);
    if (started && g.player) this.#events();
    this.#menuFx(dt, !!g.menu?.open && g.menu.screen === 'start' && !g.cine?.active);
  }
}
