import * as THREE from 'three';

// Effets visuels additifs (lueurs, croissants, étincelles, anneaux, chiffres). Mise à jour manuelle.
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return new THREE.CanvasTexture(c);
}

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.plane = new THREE.PlaneGeometry(1, 1);
    this.texGlow = canvasTex(64, 64, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
    this.texRing = canvasTex(128, 128, (g, w, h) => {
      g.strokeStyle = '#fff'; g.lineWidth = 9; g.shadowColor = '#fff'; g.shadowBlur = 10;
      g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 14, 0, Math.PI * 2); g.stroke();
    });
    // croissant : deux arcs, pointes effilées, dégradé vers la pointe
    this.texCrescent = canvasTex(256, 128, (g, w, h) => {
      g.translate(w * 0.1, h / 2);
      const grad = g.createLinearGradient(0, -h / 2, w, h / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0.2)'); grad.addColorStop(0.5, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0.9)');
      g.fillStyle = grad; g.shadowColor = '#fff'; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(0, -h * 0.46);
      g.quadraticCurveTo(w * 0.95, -h * 0.35, w * 0.8, h * 0.46);
      g.quadraticCurveTo(w * 0.62, 0, 0, -h * 0.46); g.fill();
    });
    this.texSpark = canvasTex(64, 16, (g, w, h) => {
      const r = g.createLinearGradient(0, 0, w, 0);
      r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = r; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, 0); g.lineTo(w, h); g.closePath(); g.fill();
    });
    this.numTex = new Map();
  }

  #mesh(tex, color, w, h, x, y, z = 3) {
    const m = new THREE.Mesh(this.plane, new THREE.MeshBasicMaterial({
      map: tex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    m.position.set(x, y, z); m.scale.set(w, h, 1);
    this.scene.add(m);
    return m;
  }

  // Croissant de lame qui balaie et suit le joueur. kind: 'front' | 'up' | 'down'
  slash(p, kind, size = 1, color = 0xdff6ff, heavy = false) {
    const dir = p.facing;
    const m = this.#mesh(this.texCrescent, color, 3.2 * size, 1.9 * size, p.x, p.y, 3);
    const rot = kind === 'up' ? Math.PI / 2 : kind === 'down' ? -Math.PI / 2 : 0;
    const ox = kind === 'front' ? dir * 1.5 * size : 0.1 * dir, oy = kind === 'up' ? 1.6 : kind === 'down' ? -0.4 : 0.9;
    this.items.push({ kind: 'slash', mesh: m, p, ox, oy, dir, rot, size, life: heavy ? 0.26 : 0.19, max: heavy ? 0.26 : 0.19, vert: kind !== 'front' });
    // halo
    this.glow(p.x + ox, p.y + oy, color, 2.4 * size, 0.18);
  }

  glow(x, y, color = 0xffffff, size = 1.5, life = 0.25, grow = 1.6) {
    const m = this.#mesh(this.texGlow, color, size, size, x, y, 2.9);
    this.items.push({ kind: 'glow', mesh: m, life, max: life, size, grow });
  }

  ring(x, y, color = 0xffffff, size = 2.5, life = 0.3) {
    const m = this.#mesh(this.texRing, color, 0.4, 0.4, x, y, 3);
    this.items.push({ kind: 'ring', mesh: m, life, max: life, size });
  }

  sparks(x, y, color = 0xffe9a0, n = 8, speed = 9, dirAngle = null, spread = Math.PI * 2) {
    for (let i = 0; i < n; i++) {
      const a = (dirAngle ?? 0) + (Math.random() - 0.5) * spread, s = speed * (0.5 + Math.random() * 0.8);
      const m = this.#mesh(this.texSpark, color, 0.9 + Math.random() * 0.6, 0.14, x, y, 3);
      m.rotation.z = a;
      this.items.push({ kind: 'spark', mesh: m, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.28 + Math.random() * 0.15, max: 0.4 });
    }
  }

  // compat : éclat de petits points lumineux
  burst(x, y, color = 0xffffff, n = 8, speed = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      const sz = 0.18 + Math.random() * 0.25;
      const m = this.#mesh(this.texGlow, color, sz, sz, x, y, 3);
      this.items.push({ kind: 'dot', mesh: m, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, max: 0.4 });
    }
  }

  // Gros impact : lueur + anneau + étincelles orientées
  impact(x, y, dir, heavy = false, color = 0xffe9a0) {
    this.glow(x, y, 0xffffff, heavy ? 2.6 : 1.6, 0.16, 1.4);
    this.ring(x, y, color, heavy ? 3.6 : 2.2, heavy ? 0.36 : 0.26);
    this.sparks(x, y, color, heavy ? 14 : 8, heavy ? 13 : 9, dir > 0 ? 0 : Math.PI, heavy ? 2.2 : 1.6);
    this.burst(x, y, color, heavy ? 8 : 4, 6);
  }

  number(x, y, value, color = '#fff', big = false) {
    const key = value + color;
    let t = this.numTex.get(key);
    if (!t) {
      t = canvasTex(96, 48, (g, w, h) => {
        g.font = 'bold 38px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 7; g.strokeStyle = '#0d0a1c'; g.strokeText(String(value), w / 2, h / 2);
        g.fillStyle = color; g.fillText(String(value), w / 2, h / 2);
      });
      this.numTex.set(key, t);
    }
    const m = new THREE.Mesh(this.plane, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    const s = big ? 1.5 : 1.1;
    m.position.set(x + (Math.random() - 0.5) * 0.5, y, 4); m.scale.set(s * 2, s, 1);
    this.scene.add(m);
    this.items.push({ kind: 'num', mesh: m, vy: 4.5, life: 0.7, max: 0.7, big });
  }

  // Traînée de dash : fantômes lumineux
  trail(x, y, dir, color = 0x8fd8ff) {
    const m = this.#mesh(this.texGlow, color, 1.1, 1.7, x, y + 0.8, 2.5);
    this.items.push({ kind: 'ghost', mesh: m, life: 0.26, max: 0.26 });
  }

  // Poussière / souffle (atterrissage, dash)
  puff(x, y, n = 5, color = 0xcfd6e6) {
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1, sz = 0.3 + Math.random() * 0.3;
      const m = this.#mesh(this.texGlow, color, sz, sz, x, y + 0.1, 2.4);
      this.items.push({ kind: 'dot', mesh: m, vx: dir * (1 + Math.random() * 3), vy: 0.5 + Math.random() * 2, life: 0.4, max: 0.4, soft: true });
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      const t = 1 - Math.max(0, it.life / it.max), k = 1 - t;
      const m = it.mesh;
      switch (it.kind) {
        case 'slash': {
          const p = it.p, sweep = (t - 0.5) * 0.9;
          m.position.set(p.x + it.ox * (0.9 + t * 0.35), p.y + it.oy, 3);
          m.scale.set(3.2 * it.size * (0.7 + t * 0.5) * it.dir, 1.9 * it.size * (1 - t * 0.35), 1);
          m.rotation.z = it.vert ? it.rot - sweep * it.dir : sweep * it.dir * -1;
          if (it.vert) m.scale.x = 3.2 * it.size * (0.7 + t * 0.5);
          m.material.opacity = Math.min(1, k * 2.2);
          break;
        }
        case 'glow': { const s = it.size * (1 + t * (it.grow - 1)); m.scale.set(s, s, 1); m.material.opacity = k; break; }
        case 'ring': { const s = 0.4 + (it.size - 0.4) * (1 - k * k); m.scale.set(s, s, 1); m.material.opacity = k; break; }
        case 'spark': m.position.x += it.vx * dt; m.position.y += it.vy * dt; it.vx *= 0.92; it.vy = it.vy * 0.92 - 6 * dt; m.rotation.z = Math.atan2(it.vy, it.vx); m.material.opacity = k; break;
        case 'dot': m.position.x += it.vx * dt; m.position.y += it.vy * dt; it.vy -= (it.soft ? 0 : 14) * dt; it.vx *= 0.97; m.material.opacity = k; break;
        case 'num': m.position.y += it.vy * dt; it.vy *= 0.93; m.material.opacity = Math.min(1, k * 2.5); break;
        case 'ghost': m.material.opacity = k * 0.7; break;
      }
      if (it.life <= 0) { this.scene.remove(m); m.material.dispose(); this.items.splice(i, 1); }
    }
  }
}
