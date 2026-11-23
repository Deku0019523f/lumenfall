import * as THREE from 'three';
import { ZONES, CHAPTERS } from '../levels/chapters.js';

// Exploration « à la Hollow Knight » : fragments de vie / d'âme, ombre qui garde les étincelles après la mort, leviers et portes
// scellées (visibles dès le début), titres de région, pénombre des souterrains, indices de murs fissurés, carte enrichie.
// Tout l'état est dans game.collected (donc dans la sauvegarde) : 'frag:vie:<coffre>', 'frag:ame:<coffre>', 'flag:<porte>', 'shade:<salle>|x|y|n'.
const FRAG = 3;                                    // fragments pour une récompense
const LOOT = {                                     // contenu des coffres : vie | ame | eclats (défaut : étincelles)
  'racines/entree': 'vie', 'racines/clairiere': 'ame', 'racines/souche': 'vie', 'racines/chambre': 'eclats', 'racines/canopee': 'vie',
  'racines/hauteur': 'vie', 'racines/crypte': 'vie', 'racines/raccourci': 'ame', 'racines/galerie': (x) => (x < 70 ? 'vie' : 'ame'),
  'plaines/belvedere': 'vie', 'plaines/tour': 'vie', 'plaines/caverne': 'vie', 'plaines/secret': 'vie', 'plaines/sanctuaire': 'ame', 'plaines/cascade': 'ame', 'village/egouts': 'vie',
  'village/maisons': 'vie', 'village/grenier': 'vie', 'village/cave': 'vie', 'village/crypte': 'vie', 'village/marche': (x) => (x < 45 ? 'ame' : 'vie'),
};
const SAY = { vie: ['FRAGMENT DE VIE', 'Un masque de plus'], ame: ['FRAGMENT D’ÂME', 'Réserve d’énergie accrue'] };

const CSS = `
#rwDark{position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;transition:opacity 1.6s;background:radial-gradient(ellipse 60% 70% at 50% 55%,rgba(0,0,0,0) 30%,rgba(2,3,12,.9) 100%)}
#rwCard{position:fixed;left:50%;top:15%;transform:translateX(-50%);z-index:25;text-align:center;pointer-events:none;font-family:'Cormorant Garamond',Georgia,serif;color:#fff3c8;text-shadow:0 0 16px #ffd24a;animation:rwCard 3.2s ease both}
#rwCard small{display:block;letter-spacing:6px;font-size:13px;opacity:.8}
#rwCard b{display:block;font-size:30px;letter-spacing:4px;font-weight:600}
#rwCard i{display:block;font-style:normal;font-size:14px;opacity:.85;margin-top:2px}
@keyframes rwCard{0%{opacity:0;transform:translate(-50%,10px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}`;

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

const leverTex = (on) => canvasTex(64, 96, (g, w, h) => {
  g.fillStyle = '#3a3f4a'; g.fillRect(8, 76, 48, 14); g.fillStyle = '#5a6272'; g.fillRect(8, 76, 48, 4);
  g.strokeStyle = on ? '#ffd24a' : '#b9c0d0'; g.lineWidth = 8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(32, 78); g.lineTo(on ? 54 : 10, on ? 48 : 30); g.stroke();
  g.fillStyle = on ? '#ffe9a0' : '#ff6b6b'; g.beginPath(); g.arc(on ? 54 : 10, on ? 48 : 30, 9, 0, 7); g.fill();
});
const sigilTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(10,8,24,.55)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffd24a'; g.lineWidth = 5; g.globalAlpha = .9;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(16 + i * 32, 4); g.lineTo(16 + i * 32, 124); g.stroke(); }
  g.beginPath(); g.moveTo(4, 64); g.lineTo(124, 64); g.stroke();
  g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(64, 64, 14, 0, 7); g.fill(); g.fillStyle = '#1a1030'; g.beginPath(); g.arc(64, 64, 6, 0, 7); g.fill();
});
const shadeTex = () => canvasTex(64, 80, (g) => {
  const gr = g.createRadialGradient(32, 34, 4, 32, 34, 32); gr.addColorStop(0, 'rgba(210,190,255,.95)'); gr.addColorStop(1, 'rgba(120,90,220,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 80);
  g.fillStyle = 'rgba(235,225,255,.92)'; g.beginPath(); g.moveTo(14, 70); g.lineTo(14, 32); g.quadraticCurveTo(14, 8, 32, 8); g.quadraticCurveTo(50, 8, 50, 32); g.lineTo(50, 70);
  for (let i = 0; i < 4; i++) g.lineTo(50 - i * 9 - 4.5, i % 2 ? 70 : 62); g.closePath(); g.fill();
  g.fillStyle = '#1b1238'; g.beginPath(); g.ellipse(25, 34, 4, 6, 0, 0, 7); g.ellipse(39, 34, 4, 6, 0, 0, 7); g.fill();
});
const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

export class Rewards {
  constructor(game) {
    const g = this.g = game;
    this.objs = []; this.levers = []; this.shade = null; this.safe = null; this.areaKey = null; this.areaIdx = null; this.dust = 0; this.t = 0;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.dark = document.createElement('div'); this.dark.id = 'rwDark'; document.body.appendChild(this.dark);

    const w = g.world, lr = w.loadRoom.bind(w);
    w.loadRoom = (id, entry, ...rest) => { this.#clearObjs(); const r = lr(id, entry, ...rest); this.#onRoom();
      const ow = entry === 'N' && this.#room()?.exits.find((e) => e.oneway && e.side === 'N');   // chute à sens unique : la sortie du plafond est murée
      if (ow && String(rest[2] || '').split('/').pop() === ow.to.split('/').pop()) setTimeout(() => this.g.hud.say('La chute s’est refermée derrière vous…', 3), 3600);
      return r; };
    const od = g.onPlayerDeath;
    g.onPlayerDeath = () => { this.#dropShade(); od && od(); };
  }

  #clearObjs() {
    for (const o of this.objs) { this.g.scene.remove(o.mesh); o.mesh.geometry?.dispose?.(); o.mesh.material?.map?.dispose?.(); o.mesh.material?.dispose?.(); }
    this.objs = []; this.levers = []; this.shade = null;
  }
  #add(mesh, extra = {}) { this.g.scene.add(mesh); const o = { mesh, ...extra }; this.objs.push(o); return o; }
  #room() { return this.g.world.room; }
  #flag(f) { return this.g.collected.has('flag:' + f); }

  // ─── Chargement d'une salle : titre de région, pénombre, leviers, portes scellées, ombre ───
  #onRoom() {
    const g = this.g, rm = this.#room(), id = g.world.roomId; if (!rm || !id) return;
    const idx = g.world.index;
    if (rm.area) {
      if (this.areaIdx === idx && this.areaKey !== rm.area) { g.hud.title('RÉGION', rm.area, 3.4); g.audio?.sfx?.('ui'); }
      this.areaKey = rm.area; this.areaIdx = idx;
    }
    this.dark.style.opacity = String(Math.min(0.85, (rm.dark || 0) * 1.5));
    const W = rm.map[0].length, H = rm.map.length;

    // leviers
    for (const [lx, ly, flag] of rm.levers || []) {
      const pulled = this.#flag(flag), m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.95), new THREE.MeshBasicMaterial({ map: leverTex(pulled), transparent: true, depthWrite: false }));
      m.position.set(lx + 0.5, ly + 0.95, 0.4);
      const o = this.#add(m, { kind: 'lever', x: lx + 0.5, y: ly, flag, pulled });
      if (!pulled) {
        const gl = new THREE.Mesh(g.fx.plane, new THREE.MeshBasicMaterial({ map: g.fx.texGlow, color: 0xffd24a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        gl.scale.set(2.2, 2.2, 1); gl.position.set(lx + 0.5, ly + 1.2, 0.35); o.glow = this.#add(gl, { kind: 'glow' });
      }
      this.levers.push(o);
    }

    // portes scellées : visibles tant que le drapeau n'est pas levé ; effet d'ouverture la première fois qu'on les revoit ouvertes
    for (const e of rm.exits) {
      if (!e.gate || e.oneway) continue;
      let cx, cy, sw, sh;
      if (e.side === 'W' || e.side === 'E') { cx = e.side === 'W' ? 0.5 : W - 0.5; cy = (e.y0 + e.y1 + 1) / 2; sw = 1; sh = e.y1 - e.y0 + 1; }
      else { cx = (e.x0 + e.x1 + 1) / 2; cy = e.side === 'N' ? H - 0.5 : 1; sw = e.x1 - e.x0 + 1; sh = e.side === 'N' ? 1 : 2; }
      const seenKey = `gateseen:${id}:${e.gate}`;
      if (!this.#flag(e.gate)) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: sigilTex(), transparent: true, depthWrite: false }));
        m.position.set(cx, cy, 0.6); this.#add(m, { kind: 'sigil', phase: Math.random() * 6 });
      } else if (!g.collected.has(seenKey)) {
        g.collected.add(seenKey);
        setTimeout(() => { g.fx.ring(cx, cy, 0xffd24a, 5, 0.7); g.fx.sparks(cx, cy, 0xffe08a, 24, 8); g.camera.shake(0.25, 0.4); g.hud.say('Une porte scellée s’est ouverte !', 3); g.audio?.sfx?.('skill'); }, 700);
      }
    }

    // ombre : garde les étincelles perdues à la mort
    const key = [...g.collected].find((k) => k.startsWith('shade:'));
    if (key) { const [r, x, y, n] = key.slice(6).split('|'); if (r === id) this.#spawnShade(+x, +y, +n); }
  }

  #spawnShade(x, y, n) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: shadeTex(), transparent: true, depthWrite: false, opacity: 0.9 }));
    m.position.set(x, y + 1.1, 0.9);
    this.shade = this.#add(m, { kind: 'shade', x, y, n });
  }

  #dropShade() {
    const g = this.g, p = g.player; if (p.shards <= 0) return;
    for (const k of [...g.collected]) if (k.startsWith('shade:')) g.collected.delete(k);
    this.#clearShadeObj();
    const s = this.safe && this.safe.room === g.world.roomId && (p.y < 1.2 || !p.onGround) ? this.safe : { x: p.x, y: p.y };
    const n = p.shards; p.shards = 0;
    g.collected.add(`shade:${g.world.roomId}|${s.x.toFixed(2)}|${s.y.toFixed(2)}|${n}`);
    this.#spawnShade(s.x, s.y, n);
    setTimeout(() => g.hud.say(`Ton ombre garde ${n} ✦ — retrouve-la`, 3.5), 1500);
    g.save();
  }
  #clearShadeObj() { if (!this.shade) return; this.g.scene.remove(this.shade.mesh); this.objs = this.objs.filter((o) => o !== this.shade); this.shade = null; }

  // ─── Coffres : fragments ───
  openChest(it) {
    const g = this.g, p = g.player, id = g.world.roomId, L = LOOT[id], kind = typeof L === 'function' ? L(it.x) : (L || 'eclats');
    if (kind === 'eclats') {
      g.shards.drop(it.x, it.y + 1, 40); g.fx.ring(p.x, p.y + 1, 0xc58a3a, 4, 0.5); g.say('+40 ✦', 2.5); return;
    }
    g.collected.add(`frag:${kind}:${it.key}`);
    const n = this.#count(kind), got = n % FRAG === 0;
    g.shards.drop(it.x, it.y + 1, 15);
    g.fx.ring(p.x, p.y + 1, kind === 'vie' ? 0xff6b8a : 0x7fd8ff, 4, 0.6); g.fx.sparks(it.x, it.y + 1.4, kind === 'vie' ? 0xff8aa8 : 0x9fe4ff, 20, 8);
    if (got) {
      if (kind === 'vie') { p.maxHp++; p.hp = p.maxHp; } else p.energy += 2;
      g.audio?.sfx?.('skill'); this.#card(SAY[kind][0] + ' — COMPLET', SAY[kind][1], '+1 ' + (kind === 'vie' ? 'MASQUE' : '×2 ÉNERGIE MAX'));
    } else { this.#card(SAY[kind][0], `${n % FRAG}/${FRAG}`, '+15 ✦'); }
  }
  #count(kind) { let n = 0; for (const k of this.g.collected) if (k.startsWith(`frag:${kind}:`)) n++; return n; }
  #card(small, big, sub) {
    document.getElementById('rwCard')?.remove();
    const el = document.createElement('div'); el.id = 'rwCard'; el.innerHTML = '<small></small><b></b><i></i>';
    el.children[0].textContent = small; el.children[1].textContent = big; el.children[2].textContent = sub || ''; document.body.appendChild(el); setTimeout(() => el.remove(), 3300);
  }

  // ─── Carte du monde enrichie : régions, bancs, coffres hors de portée, leviers, ombre ───
  #mapHtml(html) {
    const g = this.g, W = g.world, zone = ZONES[CHAPTERS[Math.max(0, W.index)]?.rooms]; if (!zone) return html;
    const ids = Object.keys(zone), seen = g.visited || new Set();
    const gxs = ids.map((i) => zone[i].gx), gys = ids.map((i) => zone[i].gy);
    const x0 = Math.min(...gxs), y1 = Math.max(...gys), CW = 56, CH = 44, P = 20;
    const shadeRoom = [...g.collected].find((k) => k.startsWith('shade:'))?.slice(6).split('|')[0];
    let svg = '';
    for (const id of ids) {
      const r = zone[id], x = P + (r.gx - x0) * CW, y = P + (y1 - r.gy) * CH, v = seen.has(id);
      if (v && r.area) svg += `<rect x="${x + 2}" y="${y + 19}" width="32" height="3.5" rx="1.5" fill="hsl(${hue(r.area)},60%,62%)"/>`;
      if (v && r.map.some((row) => row.includes('S'))) svg += `<circle cx="${x + 7}" cy="${y + 7}" r="3.2" fill="#6ee7ff"/>`;
      if (v && (r.shelves || []).some(() => ![...g.collected].some((k) => k.startsWith(id + ':')))) svg += `<text x="${x + 18}" y="${y + 16}" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffd24a">?</text>`;
      if (v && (r.levers || []).some(([, , f]) => !g.collected.has('flag:' + f))) svg += `<text x="${x + 29}" y="${y + 12}" font-size="10" fill="#ffd24a">⚙</text>`;
      if (shadeRoom === id) svg += `<text x="${x + 18}" y="${y + 17}" text-anchor="middle" font-size="15" fill="#b9a2ff" stroke="#120a2a" stroke-width=".6">✖</text>`;
    }
    const legend = 'gris : salle voisine inconnue<br><span style="color:#6ee7ff">●</span> banc · <span style="color:#ffd24a">?</span> coffre hors de portée · <span style="color:#ffd24a">⚙</span> levier · <span style="color:#b9a2ff">✖</span> ton ombre · trait coloré : région';
    return html.replace('</svg>', svg + '</svg>').replace('gris : salle voisine inconnue', legend);
  }

  update(dt) {
    const g = this.g, p = g.player; this.t += dt;
    if (!this.mapWrapped && g.menu && typeof g.menu['#map'] === 'function') {
      this.mapWrapped = true; const m = g.menu, orig = m['#map'].bind(m); m['#map'] = () => this.#mapHtml(orig());
    }
    // énergie max : base + fragments d'âme
    p.maxEnergy = (p.stats?.maxEnergy ?? 9) + Math.floor(this.#count('ame') / FRAG) * 2;
    if (document.body.dataset.started !== '1' || !g.level) return;
    for (const o of this.objs) {
      if (o.kind === 'sigil') o.mesh.material.opacity = 0.7 + Math.sin(this.t * 2.4 + o.phase) * 0.25;
      else if (o.kind === 'glow') o.mesh.material.opacity = 0.55 + Math.sin(this.t * 3) * 0.3;
      else if (o.kind === 'shade') { o.mesh.position.y = o.y + 1.1 + Math.sin(this.t * 2.2) * 0.18; o.mesh.material.opacity = 0.65 + Math.sin(this.t * 3.1) * 0.25; }
    }
    if (g.menu?.open || g.dialogue?.active || g.transitioning || p.dead) return;

    if (p.onGround && !g.level.isSpike(Math.floor(p.x), Math.floor(p.y - 0.4)) && !g.level.isSpike(Math.floor(p.x), Math.floor(p.y + 0.1))) this.safe = { room: g.world.roomId, x: p.x, y: p.y };

    // ombre : on la retrouve en la touchant
    const sh = this.shade;
    if (sh && Math.abs(p.x - sh.x) < 1.2 && Math.abs(p.y + 0.8 - (sh.y + 1.1)) < 1.8) {
      p.shards += sh.n; for (const k of [...g.collected]) if (k.startsWith('shade:')) g.collected.delete(k);
      g.fx.ring(sh.x, sh.y + 1, 0xb9a2ff, 5, 0.7); g.fx.sparks(sh.x, sh.y + 1, 0xd8c8ff, 30, 10); g.audio?.sfx?.('skill');
      g.hud.say(`Ombre dissipée : +${sh.n} ✦`, 3); this.#clearShadeObj(); g.save();
    }
    // leviers : frappés du glaive
    for (const o of this.levers) {
      if (o.pulled || p.attackT <= 0 || Math.abs(p.x - o.x) > 2.4 || Math.abs(p.y - o.y) > 2) continue;
      o.pulled = true; g.collected.add('flag:' + o.flag);
      o.mesh.material.map.dispose(); o.mesh.material.map = leverTex(true); o.mesh.material.needsUpdate = true;
      if (o.glow) { this.g.scene.remove(o.glow.mesh); this.objs = this.objs.filter((q) => q !== o.glow); }
      g.fx.ring(o.x, o.y + 1, 0xffd24a, 4, 0.6); g.fx.sparks(o.x, o.y + 1.2, 0xffe08a, 18, 8); g.camera.shake(0.35, 0.5); g.hitStop = Math.max(g.hitStop || 0, 0.1);
      g.audio?.sfx?.('chest'); g.hud.say('Un mécanisme résonne au loin…', 3.2); g.save();
    }
    // murs fissurés : un peu de poussière signale les passages secrets proches
    const walls = g.world.walls;
    if (walls?.tiles?.size && (this.dust -= dt) <= 0) {
      this.dust = 0.9;
      for (const k of walls.tiles.keys()) { const [tx, ty] = k.split(',').map(Number); if (Math.abs(tx - p.x) < 7 && Math.abs(ty - p.y) < 5) { g.fx.burst(tx + 0.5, ty + 0.5, 0xd8c8b0, 2, 1.5); break; } }
    }
  }
}
