import * as THREE from 'three';

// Éclats de lumière : dropés par les ennemis, attirés par le joueur, comptent comme monnaie de compétences.
export class Shards {
  constructor(game) { this.game = game; this.items = []; }

  drop(x, y, value = 1) {
    const g = this.game, n = Math.min(value, 8), each = Math.ceil(value / n);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(g.fx.plane, new THREE.MeshBasicMaterial({
        map: g.fx.texGlow, color: 0xffe08a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      m.scale.set(0.38, 0.38, 1); m.position.set(x, y, 2.8);
      g.scene.add(m);
      const a = Math.PI * (0.25 + Math.random() * 0.5);
      this.items.push({ mesh: m, x, y, vx: Math.cos(a) * (Math.random() - 0.5) * 12, vy: 5 + Math.random() * 6, value: each, age: 0 });
    }
  }

  update(dt) {
    const g = this.game, p = g.player;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const s = this.items[i];
      s.age += dt;
      const dx = p.x - s.x, dy = p.y + 0.8 - s.y, d = Math.hypot(dx, dy);
      if (s.age > 0.45 && d < 5) { // aimant
        const sp = 9 + (5 - d) * 4;
        s.vx = dx / Math.max(d, 0.01) * sp; s.vy = dy / Math.max(d, 0.01) * sp;
        s.x += s.vx * dt; s.y += s.vy * dt;
      } else {
        s.vy -= 28 * dt;
        const ny = s.y + s.vy * dt;
        if (s.vy < 0 && g.level.isSolid(Math.floor(s.x), Math.floor(ny))) { s.vy = -s.vy * 0.35; s.vx *= 0.6; } else s.y = ny;
        s.x += s.vx * dt;
      }
      s.mesh.position.set(s.x, s.y, 2.8);
      s.mesh.material.opacity = 0.75 + Math.sin(s.age * 12) * 0.25;
      if ((d < 0.7 && s.age > 0.25) || s.age > 40 || s.y < -6) {
        if (d < 0.9) { p.shards += s.value; g.fx.glow(s.x, s.y, 0xffe08a, 1.2, 0.2); g.hud?.shardPulse?.(); }
        g.scene.remove(s.mesh); s.mesh.material.dispose(); this.items.splice(i, 1);
      }
    }
  }

  clear() {
    for (const s of this.items) { this.game.scene.remove(s.mesh); s.mesh.material.dispose(); }
    this.items.length = 0;
  }
}
