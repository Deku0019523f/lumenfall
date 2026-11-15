import * as THREE from 'three';

// Effets visuels légers : arcs de coup, particules, projectiles. Mise à jour manuelle (aucune allocation lourde).
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.slashGeo = new THREE.RingGeometry(0.55, 1, 20, 1, -0.9, 1.8);
    this.dotGeo = new THREE.PlaneGeometry(0.16, 0.16);
  }

  slash(x, y, dir, scale = 1, color = 0xe8e4ff, angle = 0) {
    const m = new THREE.Mesh(this.slashGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    m.position.set(x, y, 2);
    m.scale.set(scale * 1.6 * dir, scale * 1.3, 1);
    m.rotation.z = angle;
    this.scene.add(m);
    this.items.push({ mesh: m, life: 0.16, max: 0.16, kind: 'slash' });
  }

  burst(x, y, color = 0xffffff, n = 8, speed = 6) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.dotGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.set(x, y, 2);
      this.scene.add(m);
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this.items.push({ mesh: m, life: 0.35, max: 0.35, vx: Math.cos(a) * s, vy: Math.sin(a) * s, kind: 'dot' });
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      const k = Math.max(0, it.life / it.max);
      it.mesh.material.opacity = k;
      if (it.kind === 'dot') { it.mesh.position.x += it.vx * dt; it.mesh.position.y += it.vy * dt; it.vy -= 14 * dt; }
      else it.mesh.scale.multiplyScalar(1 + dt * 2);
      if (it.life <= 0) { this.scene.remove(it.mesh); it.mesh.material.dispose(); this.items.splice(i, 1); }
    }
  }
}
