// Boîte de dialogue à machine à écrire. Pause le jeu (game.dialogue actif). Toucher la boîte / SAUT / ATTAQUE = suivant.
export class Dialogue {
  constructor() {
    this.box = document.createElement('div');
    this.box.id = 'dialog';
    this.box.innerHTML = '<div class="who"></div><div class="txt"></div><div class="nxt">▼</div>';
    document.body.appendChild(this.box);
    this.who = this.box.querySelector('.who'); this.txt = this.box.querySelector('.txt');
    this.lines = []; this.i = 0; this.chars = 0; this.cb = null; this.active = false;
    this.box.addEventListener('pointerdown', (e) => { e.preventDefault(); this.advance(); });
  }

  // lines : [{who, text}] ; cb appelé à la fin
  start(lines, cb) {
    if (!lines || !lines.length) { cb?.(); return; }
    this.lines = lines; this.i = 0; this.cb = cb; this.active = true;
    this.box.style.display = 'block'; this.#show();
  }

  #show() { const l = this.lines[this.i]; this.who.textContent = l.who || ''; this.who.style.display = l.who ? 'block' : 'none'; this.chars = 0; this.txt.textContent = ''; }

  advance() {
    if (!this.active) return;
    const full = this.lines[this.i].text;
    if (this.chars < full.length) { this.chars = full.length; this.txt.textContent = full; return; }
    this.i++;
    if (this.i >= this.lines.length) { this.active = false; this.box.style.display = 'none'; const cb = this.cb; this.cb = null; cb?.(); }
    else this.#show();
  }

  update(dt, input) {
    if (!this.active) return;
    const full = this.lines[this.i].text;
    if (this.chars < full.length) { this.chars = Math.min(full.length, this.chars + dt * 45); const n = Math.floor(this.chars); if (n % 3 === 0 && n !== this.lastN) window.__lumenfall?.audio?.sfx('talk'); this.lastN = n; this.txt.textContent = full.slice(0, n); }
    if (input && (input.pressed.jump || input.pressed.attack)) this.advance();
  }
}
