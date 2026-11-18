// Voix « blips » : un petit son par lettre, propre à chaque personnage (Web Audio, aucun fichier son).
// Pour ajouter un personnage : une entrée dans PROFILES (nom exact du champ `who` dans story.js).
//   base : hauteur de base (Hz) · wave : forme d'onde · len : durée d'un blip (s) · gain : volume relatif
//   lp : filtre passe-bas (Hz) · harm : ajoute l'octave (cloche) · glide : glissando (-0.3 = descend de 30 %)
//   vib : vibrato (Hz) · noise : souffle filtré au lieu d'une onde · speed : vitesse d'écriture · boss : texte tremblant
//   color : couleur du nom et du cadre de la boîte de dialogue
export const PROFILES = {
  '': { base: 210, wave: 'sine', len: 0.07, gain: 0.45, color: '#e9e4d0', speed: 0.9 },
  'Lueur': { base: 780, wave: 'sine', len: 0.05, gain: 0.8, harm: true, color: '#bfe9ff' },
  'Le Veilleur': { base: 330, wave: 'triangle', len: 0.06, gain: 0.8, color: '#d9b8ff' },
  "Mousse l'Ancien": { base: 118, wave: 'sawtooth', lp: 650, len: 0.1, gain: 0.7, color: '#a8d98a', speed: 0.85 },
  'Zéphyr': { base: 560, wave: 'triangle', len: 0.045, vib: 22, gain: 0.7, color: '#9fe3d4', speed: 1.2 },
  'Mirelle': { base: 430, wave: 'sine', len: 0.075, gain: 0.8, color: '#ffc8a8', speed: 0.9 },
  'La Gardienne des Racines': { base: 92, wave: 'square', lp: 520, len: 0.11, gain: 0.6, color: '#7fd16a', boss: true, speed: 0.8 },
  'Le Souffle Ancien': { noise: true, base: 320, len: 0.09, gain: 1.0, color: '#cfe8ff', boss: true, speed: 0.85 },
  'Le Roi Gélatine': { base: 150, wave: 'sine', glide: -0.4, len: 0.13, gain: 0.95, color: '#ff9ccf', boss: true, speed: 0.8 },
};

const norm = (s) => String(s || '').replace(/[’]/g, "'");

// Personnage inconnu : voix déduite du nom (toujours la même pour le même nom).
function fallback(who) {
  let h = 0; for (const c of who) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { base: 200 + (h % 400), wave: ['sine', 'triangle', 'square'][h % 3], len: 0.06, gain: 0.7, color: '#e9e4d0' };
}

export function profile(who) {
  const k = norm(who);
  return PROFILES[k] || (PROFILES[k] = fallback(k));
}

export class Voice {
  constructor() { this.ctx = null; this.noise = null; }

  #ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      this.ctx = new AC();
      this.out = this.ctx.createGain(); this.out.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 0.3, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  // ch : la lettre qui vient d'apparaître (sa hauteur varie selon la lettre) ; soft : voix murmurée (texte entre parenthèses)
  blip(who, ch = 'a', soft = false) {
    try {
      if (!this.#ensure()) return;
      const p = profile(who), c = this.ctx, t = c.currentTime;
      const vol = (window.__lumenfall?.audio?.vol?.sfx ?? 0.8) * 0.22 * (p.gain ?? 1) * (soft ? 0.5 : 1);
      if (vol <= 0) return;
      const code = ch.toLowerCase().charCodeAt(0) || 97;
      const semi = ((code * 7) % 9) - 4 + ('aeiouyéèêàùô'.includes(ch.toLowerCase()) ? 2 : 0);   // les voyelles chantent un peu plus haut
      const f = p.base * Math.pow(2, semi / 12) * (1 + (Math.random() - 0.5) * 0.03);
      const len = p.len * (soft ? 1.2 : 1);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      let node = g;
      if (p.lp) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = p.lp; lp.connect(g); node = lp; }
      if (p.noise) {
        const s = c.createBufferSource(); s.buffer = this.noise;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3;
        s.connect(bp); bp.connect(node); s.start(t, Math.random() * 0.1, len + 0.02);
      } else {
        const o = c.createOscillator(); o.type = p.wave || 'sine'; o.frequency.setValueAtTime(f, t);
        if (p.glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * (1 + p.glide)), t + len);
        if (p.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = p.vib; lg.gain.value = f * 0.04; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + len + 0.02); }
        o.connect(node); o.start(t); o.stop(t + len + 0.02);
        if (p.harm) { const o2 = c.createOscillator(), g2 = c.createGain(); o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.3; o2.connect(g2); g2.connect(node); o2.start(t); o2.stop(t + len + 0.02); }
      }
      g.connect(this.out); this.out.gain.value = 1;
    } catch (e) { /* le son ne doit jamais bloquer le jeu */ }
  }
}
