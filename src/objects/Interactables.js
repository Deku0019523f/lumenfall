import * as THREE from 'three';

// Points de sauvegarde (S), orbes de compétence (D) et coffres (C).
export class Interactables {
  constructor(game, spawns) {
    this.game = game;
    this.list = [];
    const defs = {
      S: { color: 0x6ee7ff, size: 0.7, kind: 'save' },
      D: { color: 0xffe08a, size: 0.6, kind: 'orb' },
      C: { color: 0xc58a3a, size: 0.9, kind: 'chest' },
    };
    for (const s of spawns) {
      const d = defs[s.type]; if (!d) continue;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(d.size, d.size), new THREE.MeshBasicMaterial({ color: d.color, transparent: true }));
      mesh.rotation.z = Math.PI / 4; mesh.position.set(s.x, s.y + d.size / 2 + 0.2, 0.5);
      game.scene.add(mesh);
      this.list.push({ ...s, ...d, mesh, used: false, baseY: mesh.position.y });
    }
  }

  update(dt) {
    const g = this.game, p = g.player, t = performance.now() / 1000;
    for (const it of this.list) {
      if (it.used && it.kind !== 'save') continue;
      it.mesh.position.y = it.baseY + Math.sin(t * 3 + it.x) * 0.08;
      const near = Math.abs(p.x - it.x) < 0.9 && Math.abs((p.y + 0.8) - it.mesh.position.y) < 1.4;
      if (!near) continue;
      if (it.kind === 'save' && p.hp > 0) {
        if (!it.active) {
          for (const o of this.list) if (o.kind === 'save') { o.active = false; o.mesh.material.color.setHex(0x6ee7ff); }
          it.active = true; it.mesh.material.color.setHex(0xffffff);
          p.spawnPoint = { x: it.x, y: it.y }; p.hp = p.maxHp;
          g.save(); g.say('Sauvegardé');
        }
      } else if (it.kind === 'orb') {
        it.used = true; g.scene.remove(it.mesh); p.abilities.doubleJump = true; g.save(); g.say('DOUBLE SAUT');
      } else if (it.kind === 'chest') {
        it.used = true; it.mesh.material.color.setHex(0x55442a); p.maxHp++; p.hp = p.maxHp; g.save(); g.say('+1 VIE MAX');
      }
    }
  }
}
