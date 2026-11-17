import * as THREE from 'three';

// Zones de danger temporisées (racines, éruptions…) : avertissement lumineux puis coup actif.
export class Hazards {
  constructor(game) { this.game = game; this.items = []; }

  // x = centre, y = bas ; warn = délai avant l'impact (s) ; life = durée active (s)
  add({ x, y, w = 1.2, h = 3, warn = 0.8, life = 0.45, color = 0xff6a4a }) {
    const g = this.game, fx = g.fx;
    const mk = (a) => new THREE.Mesh(fx.plane, new THREE.MeshBasicMaterial({ map: fx.texGlow, color, transparent: true, opacity: a, depthWrite: false, blending: THREE.AdditiveBlending }));
    const floor = mk(0.7), col = mk(0);
    floor.position.set(x, y + 0.15, 2.7); floor.scale.set(w * 1.3, 0.5, 1);
    col.position.set(x, y + h / 2, 2.8); col.scale.set(w, 0.1, 1);
    g.scene.add(floor); g.scene.add(col);
    this.items.push({ x, y, w, h, warn, life, t: 0, floor, col, fired: false });
  }

  update(dt) {
    const g = this.game, p = g.player;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      if (it.t < it.warn) {
        const k = it.t / it.warn;
        it.floor.material.opacity = 0.35 + 0.5 * Math.abs(Math.sin(k * 14));
        it.floor.scale.set(it.w * (1.1 + k * 0.6), 0.4 + k * 0.3, 1);
      } else {
        if (!it.fired) { it.fired = true; g.camera.shake(0.18, 0.12); g.fx.sparks(it.x, it.y + 0.3, 0xffb07a, 6, 8, Math.PI / 2, 1.2); }
        const a = (it.t - it.warn) / it.life, up = Math.min(1, a * 5);
        it.col.scale.set(it.w * (1 - a * 0.4), it.h * up, 1); it.col.position.y = it.y + it.h * up / 2;
        it.col.material.opacity = 1 - Math.max(0, a - 0.5) * 2; it.floor.material.opacity = 0.5 * (1 - a);
        if (!p.dead && a < 0.8 && Math.abs(p.x - it.x) * 2 < it.w + p.w && p.y < it.y + it.h * up && p.y + p.h > it.y) p.damage(1, Math.sign(it.x - p.x) || 1, g);
        if (it.t > it.warn + it.life) { this.#remove(it); this.items.splice(i, 1); }
      }
    }
  }

  #remove(it) { for (const m of [it.floor, it.col]) { this.game.scene.remove(m); m.material.dispose(); } }
  clear() { for (const it of this.items) this.#remove(it); this.items.length = 0; }
}
