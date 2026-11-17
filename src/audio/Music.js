// Musique et effets sonores 100 % procéduraux (Web Audio) : aucun fichier audio à héberger.
// Un thème par ambiance (menu, 3 chapitres, mini-boss, boss) ; fondu enchaîné entre thèmes.
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10],
};

// root : note MIDI ; prog : degrés des accords (1 par mesure) ; arp : probabilité d'une note d'arpège par croche
const TRACKS = {
  menu:  { root: 57, mode: 'minor', bpm: 58, prog: [0, 5, 3, 4], arp: 0.55, lead: 0.5, pad: 'sine', drums: 0, bass: 1 },
  ch0:   { root: 50, mode: 'dorian', bpm: 72, prog: [0, 3, 5, 4], arp: 0.7, lead: 0.4, pad: 'triangle', drums: 0, bass: 1 },
  ch1:   { root: 55, mode: 'mixo', bpm: 96, prog: [0, 4, 5, 3], arp: 0.85, lead: 0.55, pad: 'triangle', drums: 1, bass: 1 },
  ch2:   { root: 52, mode: 'phryg', bpm: 80, prog: [0, 5, 6, 4], arp: 0.7, lead: 0.35, pad: 'sawtooth', drums: 0, bass: 1 },
  mini:  { root: 47, mode: 'minor', bpm: 116, prog: [0, 5, 3, 6], arp: 0.9, lead: 0.3, pad: 'sawtooth', drums: 2, bass: 2 },
  boss:  { root: 45, mode: 'minor', bpm: 132, prog: [0, 0, 5, 6, 0, 0, 3, 4], arp: 1, lead: 0.5, pad: 'sawtooth', drums: 3, bass: 2 },
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const KEY = 'lumenfall.audio';

export class Music {
  constructor() {
    this.ctx = null; this.track = null; this.want = null; this.step = 0; this.nextT = 0; this.cfg = null;
    this.vol = { music: 0.6, sfx: 0.8 };
    try { Object.assign(this.vol, JSON.parse(localStorage.getItem(KEY)) || {}); } catch { /* ignore */ }
    this.lastSfx = {};
  }

  setVolume(kind, v) {
    this.vol[kind] = v;
    try { localStorage.setItem(KEY, JSON.stringify(this.vol)); } catch { /* ignore */ }
    if (!this.ctx) return;
    if (kind === 'music') this.bus.gain.setTargetAtTime(v * 0.5, this.ctx.currentTime, 0.05);
    else this.sfxBus.gain.setTargetAtTime(v * 0.7, this.ctx.currentTime, 0.05);
  }

  // À appeler depuis un geste de l'utilisateur (les navigateurs bloquent le son avant)
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.connect(c.destination);
    this.bus = c.createGain(); this.bus.gain.value = 0; this.bus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vol.sfx * 0.7; this.sfxBus.connect(this.master);
    // réverbération : bruit décroissant
    const len = c.sampleRate * 2.2, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = c.createConvolver(); this.verb.buffer = ir;
    this.verbGain = c.createGain(); this.verbGain.gain.value = 0.42; this.verb.connect(this.verbGain); this.verbGain.connect(this.bus);
    // écho
    this.delay = c.createDelay(1); this.delay.delayTime.value = 0.375;
    const fb = c.createGain(); fb.gain.value = 0.34; this.delay.connect(fb); fb.connect(this.delay);
    const dg = c.createGain(); dg.gain.value = 0.35; this.delay.connect(dg); dg.connect(this.bus); dg.connect(this.verb);
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.nextT = c.currentTime + 0.1;
    this.timer = setInterval(() => this.#tick(), 60);
    if (this.want) this.setTrack(this.want, true);
  }

  setTrack(name, force = false) {
    this.want = name;
    if (!this.ctx || (name === this.track && !force)) return;
    const c = this.ctx, t = c.currentTime;
    this.track = name;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setTargetAtTime(0, t, 0.12);
    clearTimeout(this.swap);
    this.swap = setTimeout(() => {
      this.cfg = TRACKS[name] || null; this.step = 0; this.nextT = c.currentTime + 0.05;
      this.bus.gain.setTargetAtTime(this.vol.music * 0.5, c.currentTime, 0.5);
    }, force ? 0 : 450);
  }

  stop() { this.want = null; this.track = null; if (this.ctx) this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }

  #tick() {
    const c = this.ctx; if (!c || !this.cfg || c.state !== 'running') return;
    const sixteenth = 60 / this.cfg.bpm / 4;
    while (this.nextT < c.currentTime + 0.25) { this.#play(this.step, this.nextT, sixteenth); this.step++; this.nextT += sixteenth; }
  }

  #note(freq, t, dur, { type = 'sine', gain = 0.2, a = 0.01, r = 0.2, to = this.bus, echo = false, verb = true, cutoff = 0, detune = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a);
    g.gain.setTargetAtTime(0, t + Math.max(a, dur - r), r / 3);
    let node = o;
    if (cutoff) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; o.connect(f); node = f; }
    node.connect(g); g.connect(to);
    if (echo) g.connect(this.delay);
    if (verb && to === this.bus) g.connect(this.verb);
    o.start(t); o.stop(t + dur + r + 0.1);
  }

  #drum(kind, t, vol = 1) {
    const c = this.ctx;
    if (kind === 'kick') {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.55 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.25);
    } else {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
      g.gain.setValueAtTime((kind === 'snare' ? 0.3 : 0.1) * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'snare' ? 0.16 : 0.05));
      s.connect(f); f.connect(g); g.connect(this.bus); s.start(t, Math.random() * 0.5); s.stop(t + 0.2);
    }
  }

  #play(step, t, s16) {
    const C = this.cfg, sc = SCALES[C.mode], rnd = Math.random;
    const bar = Math.floor(step / 16), pos = step % 16;
    const deg = C.prog[bar % C.prog.length];
    const noteOf = (d, oct = 0) => C.root + sc[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const chord = [0, 2, 4].map((k) => noteOf(deg + k));
    const barDur = s16 * 16;
    if (pos === 0) { // nappe d'accord
      chord.forEach((m, i) => this.#note(mtof(m + 12), t, barDur, { type: C.pad, gain: 0.07, a: 0.6, r: 1.2, detune: (i - 1) * 6, cutoff: 1400 }));
      this.#note(mtof(chord[0]), t, barDur, { type: 'sine', gain: 0.1, a: 0.4, r: 1 });
    }
    if (C.bass) { // basse
      const hits = C.bass === 2 ? [0, 3, 6, 8, 11, 14] : [0, 8];
      if (hits.includes(pos)) this.#note(mtof(chord[0] - 12), t, s16 * (C.bass === 2 ? 2 : 6), { type: C.bass === 2 ? 'sawtooth' : 'sine', gain: C.bass === 2 ? 0.11 : 0.17, a: 0.01, r: 0.15, cutoff: 500, verb: false });
    }
    if (pos % 2 === 0 && rnd() < C.arp) { // arpège (croches)
      const pat = [0, 1, 2, 1, 2, 3, 2, 1][(pos / 2) % 8], k = pat % 3, oct = pat >= 3 ? 2 : 1;
      this.#note(mtof(chord[k] + 12 * oct), t, s16 * 3, { type: 'triangle', gain: 0.075, a: 0.005, r: 0.35, echo: true, cutoff: 3200 });
    }
    if ((pos === 0 || pos === 6 || pos === 10) && rnd() < C.lead) { // mélodie éparse (cloche)
      const d = deg + [0, 1, 2, 4, 5, 7][Math.floor(rnd() * 6)];
      this.#note(mtof(noteOf(d, 2)), t, s16 * 4, { type: 'sine', gain: 0.09, a: 0.01, r: 0.9, echo: true });
    }
    if (C.drums >= 1) { // percussions
      if (C.drums >= 2 ? pos % 4 === 0 : pos === 0 || pos === 8) this.#drum('kick', t, C.drums === 3 ? 1 : 0.7);
      if (C.drums >= 2 && (pos === 4 || pos === 12)) this.#drum('snare', t);
      if (C.drums >= 1 && pos % 2 === 1) this.#drum('hat', t, 0.8);
    }
  }

  // --- Effets sonores
  sfx(name) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime;
    if (this.lastSfx[name] && t - this.lastSfx[name] < 0.04) return;
    this.lastSfx[name] = t;
    const out = this.sfxBus;
    const tone = (f0, f1, dur, type = 'sine', gain = 0.25, delay = 0) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + delay + dur);
      g.gain.setValueAtTime(gain, t + delay); g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);
      o.connect(g); g.connect(out); o.start(t + delay); o.stop(t + delay + dur + 0.05);
    };
    const hiss = (dur, f0, f1, gain = 0.25, q = 1) => {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noise; f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
    };
    switch (name) {
      case 'slash': hiss(0.14, 900, 3200, 0.22, 0.8); break;
      case 'slashHeavy': hiss(0.22, 500, 2600, 0.3, 0.7); tone(160, 70, 0.2, 'triangle', 0.15); break;
      case 'hit': hiss(0.07, 2500, 600, 0.3, 1.5); tone(220, 90, 0.1, 'square', 0.1); break;
      case 'kill': tone(300, 60, 0.28, 'sawtooth', 0.15); hiss(0.2, 1800, 300, 0.25); break;
      case 'jump': tone(300, 620, 0.12, 'sine', 0.12); break;
      case 'dash': hiss(0.18, 400, 2000, 0.25, 0.6); break;
      case 'hurt': tone(240, 70, 0.3, 'sawtooth', 0.22); break;
      case 'shard': tone(1200, 1800, 0.08, 'sine', 0.1); tone(1800, 2400, 0.1, 'sine', 0.08, 0.05); break;
      case 'chest': [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.2, 'triangle', 0.14, i * 0.07)); break;
      case 'skill': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.35, 'sine', 0.13, i * 0.06)); break;
      case 'quest': [523, 659, 784].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.14, i * 0.1)); break;
      case 'spell': tone(500, 1400, 0.2, 'sine', 0.15); hiss(0.2, 1500, 4000, 0.1); break;
      case 'nova': tone(120, 900, 0.4, 'sine', 0.25); hiss(0.4, 300, 5000, 0.2); break;
      case 'roar': tone(110, 45, 0.7, 'sawtooth', 0.28); hiss(0.7, 300, 100, 0.2, 0.4); break;
      case 'shoot': tone(700, 250, 0.15, 'square', 0.08); break;
      case 'warn': tone(300, 300, 0.12, 'square', 0.07); break;
      case 'portal': tone(180, 1500, 0.45, 'sine', 0.18); tone(360, 2400, 0.45, 'triangle', 0.08, 0.05); hiss(0.45, 400, 6000, 0.15, 0.6); break;
      case 'portalOpen': tone(300, 900, 0.5, 'sine', 0.1); hiss(0.5, 200, 3000, 0.1, 0.5); break;
      case 'ui': tone(660, 880, 0.06, 'sine', 0.1); break;
      case 'talk': tone(420 + Math.random() * 120, 400, 0.04, 'triangle', 0.05); break;
    }
  }
}
