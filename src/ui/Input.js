// Entrées unifiées : joystick tactile + boutons + clavier (pour tester sur PC).
export class Input {
  constructor() {
    this.axisX = 0;
    this.axisY = 0;
    this.down = { jump: false, attack: false, dash: false, special: false };
    this.pressed = { jump: false, attack: false, dash: false, special: false };
    this.released = { jump: false, attack: false, dash: false, special: false };
    this.attackHeldT = 0;
    this.#bindStick();
    this.#bindButtons();
    this.#bindKeyboard();
  }

  // À appeler en fin de frame
  endFrame() {
    for (const k in this.pressed) { this.pressed[k] = false; this.released[k] = false; }
  }

  #set(name, v) {
    if (v && !this.down[name]) this.pressed[name] = true;
    if (!v && this.down[name]) this.released[name] = true;
    this.down[name] = v;
  }

  #bindStick() {
    const stick = document.getElementById('stick');
    const knob = document.getElementById('knob');
    let id = null;
    const R = 56;
    const upd = (e) => {
      const r = stick.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.axisX = Math.abs(dx) < 10 ? 0 : dx / R;
      this.axisY = Math.abs(dy) < 14 ? 0 : -dy / R; // haut = positif
    };
    const end = () => { id = null; knob.style.transform = ''; this.axisX = 0; this.axisY = 0; };
    stick.addEventListener('pointerdown', (e) => { id = e.pointerId; stick.setPointerCapture(id); upd(e); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === id) upd(e); });
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
  }

  #bindButtons() {
    const map = { bJump: 'jump', bAtk: 'attack', bDash: 'dash', bSpec: 'special' };
    for (const [elId, name] of Object.entries(map)) {
      const el = document.getElementById(elId);
      el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); el.classList.add('on'); this.#set(name, true); });
      const up = () => { el.classList.remove('on'); this.#set(name, false); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }
  }

  #bindKeyboard() {
    const keys = new Set();
    const sync = () => {
      this.axisX = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyQ') || keys.has('KeyA') ? 1 : 0);
      this.axisY = (keys.has('ArrowUp') || keys.has('KeyW') || keys.has('KeyZ') ? 1 : 0) - (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0);
    };
    const bind = { Space: 'jump', KeyK: 'jump', KeyJ: 'attack', KeyL: 'dash', ShiftLeft: 'dash', KeyU: 'special' };
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      keys.add(e.code); sync();
      if (bind[e.code]) { this.#set(bind[e.code], true); e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
      keys.delete(e.code); sync();
      if (bind[e.code]) this.#set(bind[e.code], false);
    });
  }
}
