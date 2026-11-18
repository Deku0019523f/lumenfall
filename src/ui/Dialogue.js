import { Voice, profile } from '../audio/Voice.js';

// Boîte de dialogue à machine à écrire animée. Pause le jeu (game.dialogue actif).
// Toucher la boîte / SAUT / ATTAQUE = tout afficher, puis passer à la ligne suivante.
//
// Dans les textes de story.js :
//   *mot*   → mot en or lumineux          ~texte~ → texte tremblant (cris)
//   (texte) → ligne entière entre parenthèses = voix lointaine (italique, murmurée)
// Les mots clés de l'histoire (KEYWORDS) sont mis en or automatiquement ; les boss parlent d'une voix légèrement tremblante.
// La voix, la vitesse et la couleur de chaque personnage sont dans PROFILES (audio/Voice.js).

const KEYWORDS = /Flamme Originelle|Ombre Éternelle|Flamme|Ombre|fragments?|étincelles?/g;
const BASE_CPS = 45;                                   // lettres par seconde
const PAUSE = { '.': 0.3, '!': 0.32, '?': 0.32, ',': 0.15, ';': 0.18, ':': 0.18, '…': 0.4, '—': 0.2 };

const CSS = `
#dialog.v { border-color: var(--col); box-shadow: 0 0 22px color-mix(in srgb, var(--col) 45%, transparent); }
#dialog .w { display: inline-block; white-space: nowrap; }
#dialog .c { display: inline-block; visibility: hidden; white-space: pre; }
#dialog .c.on { visibility: visible; animation: dlgPop .16s ease-out; }
#dialog .c.on.q { animation: none; }
#dialog .c.g { color: #ffe08a; text-shadow: 0 0 8px rgba(255,200,90,.7); }
#dialog .c.s.on { animation: dlgShake .09s linear infinite alternate; }
#dialog .c.s2.on { animation: dlgShake2 .14s linear infinite alternate; }
#dialog.far .txt { font-style: italic; opacity: .78; }
#dialog .nxt { visibility: hidden; } #dialog.done .nxt { visibility: visible; }
@keyframes dlgPop { from { opacity: 0; transform: translateY(5px) scale(.85); } to { opacity: 1; transform: none; } }
@keyframes dlgShake { from { transform: translate(-.7px, -.6px) rotate(-1.4deg); } to { transform: translate(.7px, .6px) rotate(1.4deg); } }
@keyframes dlgShake2 { from { transform: translate(-.3px, -.3px) rotate(-.6deg); } to { transform: translate(.3px, .3px) rotate(.6deg); } }
`;

// Texte → liste de lettres {ch, g, s} (balises *…* et ~…~ retirées, mots clés dorés)
function parse(text) {
  const out = []; let g = false, s = false;
  for (const ch of text) {
    if (ch === '*') { g = !g; continue; }
    if (ch === '~') { s = !s; continue; }
    out.push({ ch, g, s });
  }
  const plain = out.map((o) => o.ch).join('');
  for (const m of plain.matchAll(KEYWORDS)) for (let i = m.index; i < m.index + m[0].length; i++) out[i].g = true;
  return out;
}

export class Dialogue {
  constructor() {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.box = document.createElement('div');
    this.box.id = 'dialog';
    this.box.innerHTML = '<div class="who"></div><div class="txt"></div><div class="nxt">▼</div>';
    document.body.appendChild(this.box);
    this.who = this.box.querySelector('.who'); this.txt = this.box.querySelector('.txt');
    this.voice = new Voice();
    this.lines = []; this.i = 0; this.cb = null; this.active = false;
    this.letters = []; this.spans = []; this.shown = 0; this.t = 0; this.k = 0; this.soft = false; this.prof = null;
    this.box.addEventListener('pointerdown', (e) => { e.preventDefault(); this.advance(); });
  }

  // lines : [{who, text}] ; cb appelé à la fin
  start(lines, cb) {
    if (!lines || !lines.length) { cb?.(); return; }
    this.lines = lines; this.i = 0; this.cb = cb; this.active = true;
    this.box.style.display = 'block'; this.#show();
  }

  #show() {
    const l = this.lines[this.i], p = this.prof = profile(l.who || '');
    this.soft = /^\s*\(/.test(l.text);
    this.box.style.setProperty('--col', p.color || '#9b8cff');
    this.box.classList.add('v'); this.box.classList.remove('done'); this.box.classList.toggle('far', this.soft);
    this.who.textContent = l.who || ''; this.who.style.color = p.color || '#ffe08a'; this.who.style.display = l.who ? 'block' : 'none';
    // toute la ligne est construite d'avance (lettres cachées) : les mots ne changent pas de ligne pendant l'écriture
    this.letters = parse(l.text); this.spans = [];
    this.txt.textContent = '';
    let word = null;
    for (const L of this.letters) {
      if (L.ch === ' ' || L.ch === '\n') { this.txt.appendChild(document.createTextNode(' ')); word = null; this.spans.push(null); continue; }
      if (!word) { word = document.createElement('span'); word.className = 'w'; this.txt.appendChild(word); }
      const sp = document.createElement('span');
      sp.className = 'c' + (L.g ? ' g' : '') + (L.s ? ' s' : p.boss ? ' s2' : '');
      sp.textContent = L.ch;
      if (L.s || p.boss) sp.style.animationDelay = `-${(Math.random() * 0.2).toFixed(2)}s`;
      word.appendChild(sp); this.spans.push(sp);
    }
    this.shown = 0; this.t = 0; this.k = 0;
  }

  #reveal(i, quick = false) { const sp = this.spans[i]; if (sp) { sp.classList.add('on'); if (quick) sp.classList.add('q'); } }

  advance() {
    if (!this.active) return;
    if (this.shown < this.spans.length) {                // tout afficher d'un coup
      for (let i = this.shown; i < this.spans.length; i++) this.#reveal(i, true);
      this.shown = this.spans.length; this.box.classList.add('done'); return;
    }
    this.i++;
    if (this.i >= this.lines.length) { this.active = false; this.box.style.display = 'none'; const cb = this.cb; this.cb = null; cb?.(); }
    else this.#show();
  }

  update(dt, input) {
    if (!this.active) return;
    if (this.shown < this.spans.length) {
      this.t -= dt;
      while (this.t <= 0 && this.shown < this.spans.length) {
        const i = this.shown++, ch = this.letters[i].ch, next = this.letters[i + 1]?.ch, prev = this.letters[i - 1]?.ch;
        this.#reveal(i);
        if (/[\p{L}\p{N}]/u.test(ch) && this.k++ % 2 === 0) this.voice.blip(this.lines[this.i].who || '', ch, this.soft);
        let pause = PAUSE[ch] || 0;
        if (ch === '.' && next === '.') pause = 0.1;                       // « ... » : petits points rapides…
        else if (ch === '.' && prev === '.') pause = 0.4;                  // … puis longue pause
        if (pause && (next === undefined || next === ' ' || ch === '.' || ch === '…')) this.t += pause;
        this.t += 1 / (BASE_CPS * (this.prof?.speed || 1) * (this.soft ? 0.85 : 1));
      }
      if (this.shown >= this.spans.length) this.box.classList.add('done');
    }
    if (input && (input.pressed.jump || input.pressed.attack)) this.advance();
  }
}
