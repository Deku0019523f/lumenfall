import { PROLOGUE, PROLOGUE_TITLE } from '../story/prologue.js';

// Prologue animé : scènes dessinées en direct (canvas 2D, aucune image à ajouter) + texte qui apparaît mot à mot.
// Lecture automatique ; toucher / Espace / Entrée = accélérer (afficher tout le texte, puis passer au suivant) ; « Passer » = quitter.
// Chaque scène a un dessin draw(k) où k = { ctx, W, H, t (temps de scène), st (n° du paragraphe), sT (temps depuis le paragraphe), dt, glow() }.
const TAU = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); }, lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => { const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const a = p(c1), b = p(c2); return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`; };

const CSS = `
#cine { position: fixed; inset: 0; z-index: 300; background: #000; color: #f3efe0; font-family: 'EB Garamond', 'Cormorant Garamond', Georgia, serif; opacity: 0; transition: opacity .9s; touch-action: manipulation; user-select: none; }
#cine.on { opacity: 1; }
#cine canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#cine .shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.35) 22%, transparent 42%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55)); }
#cine .txt { position: absolute; left: 50%; bottom: max(7%, env(safe-area-inset-bottom)); transform: translateX(-50%); width: min(880px, 88vw); text-align: center; font-size: clamp(18px, 4.6vh, 31px); line-height: 1.5; letter-spacing: .4px; text-shadow: 0 2px 10px #000, 0 0 26px #000; min-height: 4.5em; display: flex; align-items: flex-end; justify-content: center; }
#cine .txt p { margin: 0; transition: opacity .5s; } #cine .txt p.out { opacity: 0; }
#cine .txt p.q { font-style: italic; }
#cine .w { display: inline-block; opacity: 0; margin-right: .27em; animation: cineW .95s ease-out forwards; }
#cine .w.g { color: #ffe08a; text-shadow: 0 0 12px rgba(255,200,90,.75), 0 2px 10px #000; }
#cine.fast .w { animation-duration: .01s !important; animation-delay: 0s !important; }
@keyframes cineW { from { opacity: 0; transform: translateY(9px); filter: blur(5px); } to { opacity: 1; transform: none; filter: none; } }
#cine .skip { position: absolute; top: max(14px, env(safe-area-inset-top)); right: 16px; font: inherit; font-size: clamp(14px, 3.4vh, 19px); letter-spacing: 2px; color: #d8d2bc; background: rgba(0,0,0,.35); border: 1px solid rgba(216,210,188,.35); border-radius: 18px; padding: 6px 16px; cursor: pointer; opacity: .75; }
#cine .hint { position: absolute; bottom: 2.2%; left: 0; right: 0; text-align: center; font-size: clamp(11px, 2.4vh, 14px); letter-spacing: 3px; opacity: 0; color: #cfc9b0; animation: cineH 2.6s ease-in-out infinite; pointer-events: none; }
@keyframes cineH { 50% { opacity: .55; } }
#cine .ttl { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .3em; text-align: center; pointer-events: none; opacity: 0; transition: opacity 1.4s; }
#cine .ttl.on { opacity: 1; } #cine .ttl small { font-size: clamp(12px, 3vh, 18px); letter-spacing: 7px; color: #cdbcf5; }
#cine .ttl b { font-weight: 500; font-size: clamp(34px, 11vh, 80px); letter-spacing: 12px; color: #fff3c8; text-shadow: 0 0 30px rgba(190,140,255,.8), 0 0 70px rgba(255,200,110,.5); }
#cine .ttl em { font-size: clamp(18px, 5vh, 34px); letter-spacing: 6px; color: #f1dfa0; }
`;
const GOLD_WORDS = /Flamme|Originelle|Ombre|Éternelle|Veilleurs?|lanterne|fragments?|éclats|violette/i;

// Lueurs prédessinées (une par couleur) : le dessin additionne des centaines de ces taches de lumière.
const glowCache = new Map();
function glowSprite(color) {
  let c = glowCache.get(color); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.22, color); gr.addColorStop(0.55, color + '55'); gr.addColorStop(1, color + '00');
  g.fillStyle = gr; g.fillRect(0, 0, 96, 96); glowCache.set(color, c); return c;
}

const stars = (n) => Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random() * 0.7, s: rnd(0.5, 1.6), p: rnd(0, TAU) }));
function drawStars(k, list, a = 1) { for (const s of list) k.glow(s.x * k.W, s.y * k.H, k.H * 0.012 * s.s, '#cfd8ff', a * (0.35 + 0.35 * Math.sin(k.t * 1.6 + s.p))); }
function sky(k, top, bot) { const g = k.ctx.createLinearGradient(0, 0, 0, k.H); g.addColorStop(0, top); g.addColorStop(1, bot); k.ctx.fillStyle = g; k.ctx.fillRect(0, 0, k.W, k.H); }
function hills(k, y0, color, amp = 0.03, seed = 0) {
  const { ctx, W, H } = k; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H * y0 + Math.sin(x / W * 5 + seed) * H * amp + Math.sin(x / W * 13 + seed * 2) * H * amp * 0.4);
  ctx.lineTo(W, H); ctx.fill();
}
function drop(ctx, x, y, w, h, fill) {       // goutte de flamme
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x, y - h);
  ctx.bezierCurveTo(x + w, y - h * 0.45, x + w * 0.85, y, x, y); ctx.bezierCurveTo(x - w * 0.85, y, x - w, y - h * 0.45, x, y - h); ctx.fill();
}
function flame(k, x, y, size, a = 1, violet = true) {  // flamme vivante : lueur + 3 gouttes qui vacillent
  const { ctx, t } = k, fl = 1 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 15 + 1);
  k.glow(x, y - size * 0.45, size * 2.2 * fl, violet ? '#9a6bff' : '#ff9a4a', 0.5 * a);
  k.glow(x, y - size * 0.4, size * 1.2 * fl, '#ffc870', 0.75 * a);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const sway = Math.sin(t * 5) * size * 0.06;
  drop(ctx, x + sway, y, size * 0.5 * fl, size * 1.15 * fl, `rgba(150,100,255,${0.55 * a})`);
  drop(ctx, x + sway * 0.6, y, size * 0.36 * fl, size * 0.85 * fl, `rgba(255,205,120,${0.85 * a})`);
  drop(ctx, x, y, size * 0.2 * fl, size * 0.5 * fl, `rgba(255,255,240,${0.95 * a})`);
  ctx.restore();
}
function figure(k, x, y, h, color, arms = 0, a = 1) {        // silhouette encapuchonnée ; arms 0..1 = bras levés
  const { ctx } = k; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - h * 0.2, y); ctx.lineTo(x - h * 0.08, y - h * 0.62); ctx.lineTo(x + h * 0.08, y - h * 0.62); ctx.lineTo(x + h * 0.2, y); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - h * 0.72, h * 0.12, 0, TAU); ctx.fill();
  ctx.lineWidth = h * 0.07; ctx.beginPath();
  for (const s of [-1, 1]) { ctx.moveTo(x + s * h * 0.07, y - h * 0.58); ctx.lineTo(x + s * lerp(h * 0.22, h * 0.14, arms), y - lerp(h * 0.32, h * 0.98, arms)); }
  ctx.stroke(); ctx.restore();
}
function tree(k, x, y, h, color, seed) {
  const { ctx, t } = k, sw = Math.sin(t * 0.9 + seed) * h * 0.02; ctx.fillStyle = color;
  ctx.fillRect(x - h * 0.03, y - h * 0.4, h * 0.06, h * 0.4);
  for (let i = 0; i < 4; i++) { const yy = y - h * (0.3 + i * 0.2), w = h * (0.34 - i * 0.07); ctx.beginPath(); ctx.moveTo(x - w + sw * i, yy); ctx.lineTo(x + sw * (i + 1), yy - h * 0.3); ctx.lineTo(x + w + sw * i, yy); ctx.fill(); }
}

const FRAG = ['#ffd27a', '#8fe8ff', '#9dff9a', '#ff9ad0', '#b98cff', '#ff8a6a', '#fff3a0'];

// ─── Scènes ─────────────────────────────────────────────────────────────────────────────────────────────────
const SCENES = {
  flamme: {                      // 1. La Flamme veille sur le monde ; humains, esprits et créatures gravitent en équilibre
    init() { return { stars: stars(110), embers: [], wisps: [['#ffd98a', 1], ['#8fe8ff', -1], ['#9dff9a', 1]].flatMap(([c, d], g) => Array.from({ length: 7 }, (_, i) => ({ c, d, a: rnd(0, TAU), r: 0.25 + g * 0.06 + rnd(0, 0.04), sp: rnd(0.18, 0.32) }))) }; },
    draw(k, S) {
      const { ctx, W, H, t, st, sT, dt } = k; sky(k, '#070816', '#251a45'); drawStars(k, S.stars);
      const f = st === 0 ? ease(sT / 4.5) : 1, fx = W / 2, fy = H * 0.62;
      hills(k, 0.8, '#05060d', 0.03, 1);
      flame(k, fx, fy, H * (0.06 + 0.16 * f), 0.35 + 0.65 * f);
      if (Math.random() < dt * 40 * f) S.embers.push({ x: fx + rnd(-1, 1) * H * 0.05, y: fy - H * 0.1, vx: rnd(-8, 8), vy: -rnd(30, 70), l: 0, m: rnd(2, 4), c: Math.random() < 0.5 ? '#ffd27a' : '#c9a0ff' });
      for (let i = S.embers.length - 1; i >= 0; i--) { const e = S.embers[i]; e.l += dt; e.x += (e.vx + Math.sin(t * 2 + i) * 10) * dt * (H / 600); e.y += e.vy * dt * (H / 600); if (e.l > e.m) { S.embers.splice(i, 1); continue; } k.glow(e.x, e.y, H * 0.012, e.c, 1 - e.l / e.m); }
      const wa = st >= 1 ? ease(sT / 3.5) : 0;
      if (wa > 0) for (const w of S.wisps) { w.a += w.d * w.sp * dt; for (let q = 0; q < 6; q++) { const a = w.a - w.d * q * 0.07; k.glow(fx + Math.cos(a) * w.r * H * 1.5, fy - H * 0.16 + Math.sin(a) * w.r * H * 0.38, H * (q ? 0.009 : 0.017), w.c, wa * (1 - q / 6)); } }
    },
  },
  ombre: {                       // 2. L'Ombre brise le sceau
    init() { return { stars: stars(70), ten: Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * TAU + rnd(-0.2, 0.2), w: rnd(0.8, 1.4), ph: rnd(0, TAU) })), shards: [], flashed: false }; },
    draw(k, S) {
      const { ctx, W, H, t, sT, dt } = k, p = clamp(sT / 7), fx = W / 2, fy = H * 0.5, R = H * 0.3;
      sky(k, mix('#0b0a1c', '#020104', p), mix('#2a1a4a', '#12041a', p)); drawStars(k, S.stars, 1 - p * 0.8);
      flame(k, fx, fy + H * 0.1, H * (0.17 - 0.06 * p), 1 - 0.35 * p);
      // sceau : anneau de runes ; il se fissure puis éclate
      const broke = sT > 6.4;
      if (!broke) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fx, fy); ctx.rotate(t * 0.15);
        for (let i = 0; i < 24; i++) {
          const a0 = (i / 24) * TAU, thr = 0.3 + (i * 7 % 24) / 24 * 0.6, off = Math.max(0, p - thr) * H * 0.04 * ((i % 3) + 1), al = (1 - Math.max(0, p - thr) * 2.2) * 0.9;
          if (al <= 0) continue;
          ctx.strokeStyle = `rgba(255,214,140,${al})`; ctx.lineWidth = H * 0.008; ctx.beginPath(); ctx.arc(Math.cos(a0) * off, Math.sin(a0) * off, R, a0, a0 + TAU / 24 * 0.8); ctx.stroke();
          ctx.lineWidth = 2; ctx.strokeStyle = `rgba(190,150,255,${al * 0.8})`; ctx.beginPath(); ctx.moveTo(Math.cos(a0) * R * 1.07, Math.sin(a0) * R * 1.07); ctx.lineTo(Math.cos(a0) * R * 1.17, Math.sin(a0) * R * 1.17); ctx.stroke();
        }
        ctx.restore();
      }
      if (sT > 6.4 && !S.flashed) { S.flashed = true; for (let i = 0; i < 40; i++) S.shards.push({ a: rnd(0, TAU), v: rnd(120, 380), l: 0 }); }
      for (const s of S.shards) { s.l += dt; k.glow(fx + Math.cos(s.a) * s.v * s.l * (H / 600), fy + Math.sin(s.a) * s.v * s.l * (H / 600), H * 0.012, '#ffd98a', Math.max(0, 1 - s.l / 1.6)); }
      // tentacules d'ombre qui rampent vers la flamme
      ctx.save(); ctx.lineCap = 'round';
      for (const T of S.ten) {
        const L = ease(p * 1.05), ox = fx + Math.cos(T.a) * W * 0.75, oy = fy + Math.sin(T.a) * H * 0.9, hx = lerp(ox, fx, L * 0.92), hy = lerp(oy, fy, L * 0.92);
        const mx = (ox + hx) / 2 + Math.sin(t * 1.4 + T.ph) * H * 0.07, my = (oy + hy) / 2 + Math.cos(t * 1.2 + T.ph) * H * 0.07;
        for (const [wd, col] of [[H * 0.05 * T.w, 'rgba(150,60,220,.25)'], [H * 0.028 * T.w, 'rgba(8,0,16,.95)']]) { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.stroke(); }
      }
      ctx.restore();
      if (sT > 6.4) { const f = clamp(1 - (sT - 6.4) / 0.9); if (f > 0) { ctx.fillStyle = `rgba(255,245,225,${f * 0.9})`; ctx.fillRect(0, 0, W, H); } }
    },
  },
  chute: {                       // 3. Le ciel s'assombrit, les royaumes tombent
    init() { return { leaves: Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), s: rnd(0.6, 1.4), ph: rnd(0, TAU) })), dust: [], bolt: null, nextBolt: 3, flash: 0 }; },
    draw(k, S) {
      const { ctx, W, H, t, sT, dt } = k, p = clamp(sT / 11);
      sky(k, mix('#3b2a63', '#07030a', p), mix('#e0905c', '#3a0c12', p));
      k.glow(W * 0.72, H * 0.56, H * 0.5, '#ffb070', 0.7 * (1 - p));
      for (let i = 0; i < 6; i++) k.glow(((i * 0.23 + t * 0.012) % 1.2 - 0.1) * W, H * (0.12 + (i % 3) * 0.1), H * 0.4, '#1a0f26', 0.35 + 0.4 * p);
      // rivière qui se tarit
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * (1 - p); ctx.fillStyle = '#6fb8ff'; ctx.beginPath(); ctx.moveTo(0, H * 0.9);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.9 + Math.sin(x * 0.02 + t * 2) * 3 - H * 0.02 * (1 - x / W)); ctx.lineTo(W, H * 0.93); ctx.lineTo(0, H * 0.93); ctx.fill(); ctx.restore();
      hills(k, 0.84, '#06040a', 0.025, 3);
      // royaumes : tours qui s'inclinent et s'effondrent l'une après l'autre
      for (let i = 0; i < 7; i++) {
        const bx = W * (0.07 + i * 0.14), bw = H * 0.07, bh = H * (0.2 + 0.08 * (i % 3)), fall = ease((p - 0.2 - i * 0.07) / 0.35), by = H * 0.86 + fall * bh * 1.2;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(fall * 0.4 * (i % 2 ? 1 : -1)); ctx.fillStyle = '#0b0710';
        ctx.fillRect(-bw / 2, -bh, bw, bh); ctx.beginPath(); ctx.moveTo(-bw * 0.65, -bh); ctx.lineTo(0, -bh - bw * 1.1); ctx.lineTo(bw * 0.65, -bh); ctx.fill();
        ctx.fillStyle = `rgba(255,200,120,${0.8 * (1 - clamp(p * 2.2))})`; ctx.fillRect(-bw * 0.08, -bh * 0.7, bw * 0.16, bw * 0.28); ctx.restore();
        if (fall > 0 && fall < 1 && Math.random() < dt * 30) S.dust.push({ x: bx + rnd(-bw, bw), y: H * 0.86, vx: rnd(-20, 20), vy: -rnd(10, 60), l: 0 });
      }
      for (let i = S.dust.length - 1; i >= 0; i--) { const d = S.dust[i]; d.l += dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.l > 2.5) { S.dust.splice(i, 1); continue; } k.glow(d.x, d.y, H * 0.03, '#5a4a5a', 0.4 * (1 - d.l / 2.5)); }
      for (const l of S.leaves) { l.y += dt * 0.05 * l.s; l.x += Math.sin(t + l.ph) * dt * 0.02; if (l.y > 1) { l.y = -0.05; l.x = Math.random(); } ctx.fillStyle = mix('#7cc65a', '#4a4650', p); ctx.save(); ctx.translate(l.x * W, l.y * H); ctx.rotate(t * l.s + l.ph); ctx.fillRect(-3 * l.s, -1.5 * l.s, 6 * l.s, 3 * l.s); ctx.restore(); }
      if (p > 0.35 && sT > S.nextBolt) { S.nextBolt = sT + rnd(2, 3.6); S.flash = 1; const pts = []; let x = rnd(0.15, 0.85) * W; for (let y = 0; y < H * 0.85; y += H * 0.07) { pts.push([x, y]); x += rnd(-0.04, 0.04) * W; } S.bolt = pts; }
      if (S.flash > 0) { S.flash -= dt * 2.6; ctx.fillStyle = `rgba(210,200,255,${Math.max(0, S.flash) * 0.3})`; ctx.fillRect(0, 0, W, H); if (S.bolt) { ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, S.flash)})`; ctx.lineWidth = 3; ctx.beginPath(); S.bolt.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); } }
    },
  },
  sacrifice: {                   // 4. Les Veilleurs fragmentent la Flamme en sept éclats, dispersés aux quatre coins du monde
    init() { return { stars: stars(80), sparks: [], burst: false }; },
    draw(k, S) {
      const { ctx, W, H, t, st, sT, dt } = k, fx = W / 2, fy = H * 0.6; sky(k, '#04040c', '#150b28'); drawStars(k, S.stars, 0.8); hills(k, 0.84, '#030208', 0.02, 5);
      const build = st === 0 ? ease(sT / 8) : 1, gone = st >= 1 ? clamp(sT / 2.6) : 0;
      // les sept Veilleurs, bras levés, lueur dans les mains
      for (let i = 0; i < 7; i++) {
        const u = i / 6, x = lerp(W * 0.12, W * 0.88, u), y = H * (0.86 - Math.sin(u * Math.PI) * 0.02), a = 1 - gone;
        if (a <= 0) continue;
        figure(k, x, y, H * 0.2, '#0a0614', clamp(build * 1.4), a);
        k.glow(x, y - H * 0.19, H * 0.05 * build + 1, FRAG[i], 0.9 * a * build);
        if (build > 0.15 && gone < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = FRAG[i]; ctx.globalAlpha = 0.28 * build * a; ctx.lineWidth = 2 + Math.sin(t * 6 + i) * 1; ctx.beginPath(); ctx.moveTo(x, y - H * 0.19); ctx.quadraticCurveTo((x + fx) / 2, y - H * 0.45, fx, fy - H * 0.14); ctx.stroke(); ctx.restore(); }
        if (gone > 0 && Math.random() < dt * 14 * a) S.sparks.push({ x: x + rnd(-1, 1) * H * 0.05, y: y - rnd(0, 1) * H * 0.2, l: 0, c: FRAG[i] });
      }
      if (st === 0) flame(k, fx, fy, H * (0.1 + 0.14 * build), 0.5 + 0.5 * build);
      else {
        const b = sT; if (!S.burst) { S.burst = true; }
        if (b < 0.5) flame(k, fx, fy, H * (0.24 + b * 0.2), 1);
        if (b < 0.9) { ctx.fillStyle = `rgba(255,248,230,${clamp(1 - Math.abs(b - 0.25) / 0.65) * 0.8})`; ctx.fillRect(0, 0, W, H); }
        for (let i = 0; i < 7; i++) {   // sept éclats vers les quatre coins
          const ang = -Math.PI * 0.5 + (i - 3) * 0.42 + (i % 2 ? 0.2 : 0), L = ease((b - 0.3) / 4.2), d = L * W * 0.75;
          for (let q = 0; q < 10; q++) { const dd = Math.max(0, d - q * H * 0.02); k.glow(fx + Math.cos(ang) * dd * 1.05, fy - H * 0.14 + Math.sin(ang) * dd * 0.8 + L * L * H * 0.2, H * (q ? 0.012 : 0.026), FRAG[i], (1 - q / 10) * clamp(1.4 - L * 0.6)); }
        }
      }
      for (let i = S.sparks.length - 1; i >= 0; i--) { const s = S.sparks[i]; s.l += dt; s.y -= dt * H * 0.1; if (s.l > 2) { S.sparks.splice(i, 1); continue; } k.glow(s.x, s.y, H * 0.012, s.c, 1 - s.l / 2); }
    },
  },
  silence: {                     // 5. L'équilibre revient ; les Veilleurs s'effacent des légendes
    init() { return { stars: stars(130), dust: [] }; },
    draw(k, S) {
      const { ctx, W, H, t, sT, dt } = k; sky(k, '#04070f', '#101c34'); drawStars(k, S.stars); k.glow(W * 0.78, H * 0.2, H * 0.3, '#9fb8ff', 0.45); k.glow(W * 0.78, H * 0.2, H * 0.05, '#e8f0ff', 0.9);
      hills(k, 0.8, '#070a14', 0.035, 2); hills(k, 0.88, '#03040a', 0.03, 7);
      FRAG.forEach((c, i) => k.glow(W * (0.08 + i * 0.14), H * (0.28 + 0.12 * Math.sin(i * 2.1)), H * 0.03, c, 0.35 + 0.25 * Math.sin(t * 1.3 + i)));
      const fade = clamp(sT / 9);
      for (let i = 0; i < 7; i++) {
        const x = W * (0.2 + i * 0.1), y = H * 0.82 + Math.sin(i * 1.7) * H * 0.012; figure(k, x, y, H * 0.16, '#0a0f1c', 0, 0.9 * (1 - fade));
        if (Math.random() < dt * 8 * (1 - fade * 0.5)) S.dust.push({ x: x + rnd(-1, 1) * H * 0.04, y: y - rnd(0.1, 0.8) * H * 0.16, l: 0, c: FRAG[i] });
      }
      for (let i = S.dust.length - 1; i >= 0; i--) { const d = S.dust[i]; d.l += dt; d.y -= dt * H * 0.05; d.x += Math.sin(t + i) * dt * 8; if (d.l > 3) { S.dust.splice(i, 1); continue; } k.glow(d.x, d.y, H * 0.01, d.c, 0.8 * (1 - d.l / 3)); }
    },
  },
  veilleur: {                    // 6. L'enfant, la lanterne violette, la lumière qui tombe du ciel
    init() { return { stars: stars(120), spirits: Array.from({ length: 6 }, (_, i) => ({ a: rnd(0, TAU), r: rnd(0.05, 0.14), x: 0.2 + i * 0.1, y: rnd(0.4, 0.66), sp: rnd(0.4, 0.9) })), leaves: [] }; },
    draw(k, S) {
      const { ctx, W, H, t, st, sT, dt } = k; sky(k, '#080b20', '#231d45'); drawStars(k, S.stars); k.glow(W * 0.2, H * 0.18, H * 0.22, '#9fb0ff', 0.25);
      hills(k, 0.8, '#07060f', 0.03, 4); [0.05, 0.14, 0.9, 0.97].forEach((x, i) => tree(k, W * x, H * 0.86, H * (0.34 + (i % 2) * 0.1), '#050409', i));
      const hx = W * 0.62, hy = H * 0.86;           // maisonnette à la fenêtre chaude
      ctx.fillStyle = '#0c0912'; ctx.fillRect(hx, hy - H * 0.22, H * 0.28, H * 0.22); ctx.beginPath(); ctx.moveTo(hx - H * 0.03, hy - H * 0.22); ctx.lineTo(hx + H * 0.14, hy - H * 0.36); ctx.lineTo(hx + H * 0.31, hy - H * 0.22); ctx.fill();
      k.glow(hx + H * 0.08, hy - H * 0.12, H * 0.09, '#ffb066', 0.7 + 0.1 * Math.sin(t * 7)); ctx.fillStyle = '#ffd89a'; ctx.fillRect(hx + H * 0.06, hy - H * 0.14, H * 0.05, H * 0.05);
      const cx = W * 0.42, cy = hy;                  // l'enfant et sa lanterne
      const lit = st === 0 ? ease((sT - 2.5) / 3) : 1, lx = cx + H * 0.07, ly = cy - H * 0.1;
      figure(k, cx, cy, H * 0.22, '#0d0a1a', 0, 1); ctx.fillStyle = '#0d0a1a'; ctx.fillRect(cx + H * 0.02, cy - H * 0.13, H * 0.055, H * 0.012);
      ctx.fillStyle = '#1a1226'; ctx.fillRect(lx - H * 0.012, ly - H * 0.012, H * 0.024, H * 0.03);
      k.glow(lx, ly, H * (0.03 + 0.2 * lit) * (1 + 0.06 * Math.sin(t * 8)), '#a56bff', 0.25 + 0.6 * lit); k.glow(lx, ly, H * 0.025, '#e8d6ff', 0.4 + 0.6 * lit);
      // esprits visibles de l'enfant, feuilles qui murmurent
      const sa = st === 0 ? ease((sT - 1) / 4) : 0.9;
      for (const s of S.spirits) { s.a += dt * s.sp; k.glow((s.x + Math.cos(s.a) * s.r * 0.4) * W, (s.y + Math.sin(s.a * 1.3) * s.r * 0.5) * H, H * 0.024, '#8fe8ff', 0.5 * sa); k.glow((s.x + Math.cos(s.a) * s.r * 0.4) * W, (s.y + Math.sin(s.a * 1.3) * s.r * 0.5) * H, H * 0.008, '#ffffff', 0.8 * sa); }
      if (Math.random() < dt * 4) S.leaves.push({ x: rnd(0, 1) * W, y: rnd(0.2, 0.6) * H, l: 0 });
      for (let i = S.leaves.length - 1; i >= 0; i--) { const l = S.leaves[i]; l.l += dt; l.x += dt * 20; l.y += Math.sin(l.l * 3) * dt * 14 + dt * 8; if (l.l > 4) { S.leaves.splice(i, 1); continue; } k.glow(l.x, l.y, H * 0.006, '#9dff9a', 0.5 * (1 - l.l / 4)); }
      if (st >= 1) {   // la lumière traverse le ciel et se pose devant lui
        const L = ease(sT / 3.6), x0 = W * 0.05, y0 = H * 0.05, x1 = cx + H * 0.2, y1 = cy - H * 0.16, mx = W * 0.3, my = H * 0.02;
        const pos = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1];
        if (L < 1) for (let q = 0; q < 16; q++) { const [x, y] = pos(Math.max(0, L - q * 0.016)); k.glow(x, y, H * (q ? 0.018 : 0.04), '#bff4ff', 1 - q / 16); }
        else {
          const b = sT - 3.6, bob = Math.sin(t * 2.4) * H * 0.012;
          if (b < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,245,255,${1 - b})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x1, y1, H * (0.03 + b * 0.25), 0, TAU); ctx.stroke(); ctx.restore(); }
          k.glow(x1, y1 + bob, H * 0.09, '#8fe8ff', 0.6); k.glow(x1, y1 + bob, H * 0.03, '#ffffff', 1);
        }
      }
    },
  },
};

export class Cinematic {
  constructor(game) {
    this.game = game; this.active = false;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const el = this.el = document.createElement('div'); el.id = 'cine';
    el.innerHTML = '<canvas></canvas><div class="shade"></div><div class="ttl"><small></small><b></b><em></em></div><div class="txt"></div><div class="hint">TOUCHER POUR CONTINUER</div><button class="skip">Passer ›</button>';
    el.style.display = 'none'; document.body.appendChild(el);
    this.cv = el.querySelector('canvas'); this.ctx = this.cv.getContext('2d'); this.txt = el.querySelector('.txt'); this.ttl = el.querySelector('.ttl');
    el.addEventListener('pointerdown', (e) => { if (e.target.closest('.skip')) return; this.#advance(); });
    el.querySelector('.skip').addEventListener('click', (e) => { e.stopPropagation(); this.#finish(); });
    window.addEventListener('keydown', (e) => { if (!this.active) return; if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) { e.preventDefault(); this.#advance(); } else if (e.code === 'Escape') this.#finish(); });
  }

  // done() est appelé à la fin (ou au « Passer »). opts.scene : numéro de scène de départ (tests).
  play(done, opts = {}) {
    if (this.active) return;
    this.active = true; this.done = done; this.game.transitioning = true; this.el.style.display = 'block';
    this.#resize(); this.onResize = () => this.#resize(); window.addEventListener('resize', this.onResize);
    requestAnimationFrame(() => this.el.classList.add('on'));
    this.si = (opts.scene ?? 0) - 1; this.pi = -1; this.sT = 0; this.t = 0; this.stT = 0; this.paraT = 0; this.paraDur = 0; this.revealDone = 0; this.fade = 1; this.mode = 'title'; this.titleT = 0; this.S = null;
    if (opts.scene) { this.mode = 'scene'; this.#nextScene(true); } else this.#showTitle();
    this.last = performance.now(); this.raf = requestAnimationFrame((n) => this.#loop(n));
  }

  #resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.W = this.cv.width = Math.round(innerWidth * dpr); this.H = this.cv.height = Math.round(innerHeight * dpr);
  }

  #showTitle() {
    const [k, b, e] = this.ttl.children; k.textContent = PROLOGUE_TITLE.kicker; b.textContent = PROLOGUE_TITLE.title.toUpperCase(); e.textContent = PROLOGUE_TITLE.sub;
    this.txt.innerHTML = ''; this.ttl.classList.add('on'); this.mode = 'title'; this.titleT = 0; this.fade = 1;
  }

  #nextScene(first = false) {
    this.si++; this.ttl.classList.remove('on');
    if (this.si >= PROLOGUE.length) { this.mode = 'end'; this.endT = 0; return; }
    const sc = PROLOGUE[this.si]; this.S = SCENES[sc.id].init(); this.draw = SCENES[sc.id].draw; this.sT = 0; this.pi = -1; this.mode = 'scene'; if (!first) this.fade = 1;
    this.#nextPara();
  }

  #nextPara() {
    const sc = PROLOGUE[this.si]; this.pi++;
    if (this.pi >= sc.paras.length) { this.mode = 'out'; this.outT = 0; this.txt.firstChild?.classList.add('out'); return; }
    const text = sc.paras[this.pi], words = text.split(' ');
    this.txt.innerHTML = ''; this.el.classList.remove('fast');
    const p = document.createElement('p'); if (text.startsWith('«')) p.className = 'q';
    words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'w' + (GOLD_WORDS.test(w) ? ' g' : ''); s.style.animationDelay = (0.4 + i * 0.075) + 's'; s.textContent = w; p.appendChild(s); });
    this.txt.appendChild(p); this.stT = 0; this.paraT = 0;
    this.revealDone = 0.4 + words.length * 0.075 + 0.9; this.paraDur = this.revealDone + 1.5 + text.length * 0.03;
  }

  #advance() {
    if (!this.active) return;
    if (this.mode === 'title') { this.titleT = Math.max(this.titleT, 3.2); return; }
    if (this.mode !== 'scene') return;
    if (this.paraT < this.revealDone) { this.el.classList.add('fast'); this.paraT = this.revealDone; } else this.#nextPara();
  }

  #loop(now) {
    if (!this.active) return;
    const dt = Math.min((now - this.last) / 1000, 0.05); this.last = now; this.t += dt;
    const { ctx, W, H } = this; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.mode === 'title') {
      this.titleT += dt; this.fade = 1;
      if (this.titleT > 4.6) { this.ttl.classList.remove('on'); }
      if (this.titleT > 5.6) this.#nextScene();
    } else if (this.mode === 'scene' || this.mode === 'out') {
      this.sT += dt; this.stT += dt; if (this.mode === 'scene') { this.paraT += dt; if (this.paraT > this.paraDur) this.#nextPara(); }
      const k = { ctx, W, H, t: this.sT, st: Math.max(0, this.pi), sT: this.stT, dt, glow: (x, y, r, c, a) => { if (a <= 0.003 || r < 0.5) return; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(glowSprite(c), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } };
      this.draw(k, this.S);
      if (this.mode === 'out') { this.outT += dt; this.fade = clamp(this.outT / 0.9); if (this.outT > 1) this.#nextScene(); } else this.fade = Math.max(0, this.fade - dt * 1.1);
    } else if (this.mode === 'end') { this.endT += dt; this.fade = clamp(this.endT / 1.2); if (this.endT > 1.4) { this.#finish(); return; } }
    if (this.fade > 0) { ctx.globalAlpha = this.fade; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    this.raf = requestAnimationFrame((n) => this.#loop(n));
  }

  #finish() {
    if (!this.active) return; this.active = false; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize);
    this.el.classList.remove('on'); this.ttl.classList.remove('on');
    setTimeout(() => { this.el.style.display = 'none'; this.txt.innerHTML = ''; }, 950);
    this.game.transitioning = false; const d = this.done; this.done = null; d?.();
  }
}
