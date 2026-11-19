import * as THREE from 'three';

// Points de sauvegarde (S), orbes de compétence (D) et coffres (C).
export class Interactables {
  constructor(game, spawns) {
    this.game = game;
    this.list = [];
    const defs = {
      S: { color: 0x6ee7ff, size: 0.7, kind: 'save' },
      D: { color: 0xffe08a, size: 0.6, kind: 'orb', ability: 'doubleJump', label: 'DOUBLE SAUT' },
      W: { color: 0x9be36a, size: 0.6, kind: 'orb', ability: 'wall', label: 'SAUT MURAL' },
      C: { color: 0xc58a3a, size: 0.9, kind: 'chest' },
    };
    for (const s of spawns) {
      const d = defs[s.type]; if (!d) continue;
      const key = `${game.world.roomId ?? game.world.index}:${s.x}:${s.y}`;
      if (s.type !== 'S' && game.collected.has(key)) continue; // déjà ramassé (sauvegardé)
      // sprites animés des packs (coffre, cristal, miroir) ; sans image → carré de couleur
      const chest = ['chest_wood', 'chest_iron', 'chest_gold'][Math.min(2, game.world.index)];
      const sname = d.kind === 'chest' ? chest : d.kind === 'save' ? 'fx_crystal' : 'fx_mirror';
      const a = game.assets?.strips?.[sname];
      let mesh, anim = null;
      if (a) {
        const tex = a.tex.clone(); tex.needsUpdate = true; tex.repeat.set(1 / a.frames, 1);
        const sz = d.kind === 'chest' ? 2.1 : d.kind === 'save' ? 2.4 : 1.9;
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite: false }));
        if (d.kind === 'orb') mesh.material.color.setHex(d.color);
        anim = { tex, frames: a.frames, t: 0, open: false };
        mesh.position.set(s.x, s.y + (d.kind === 'chest' ? 0.78 : 1.0), 0.5);
      } else {
        mesh = new THREE.Mesh(new THREE.PlaneGeometry(d.size, d.size), new THREE.MeshBasicMaterial({ color: d.color, transparent: true }));
        mesh.rotation.z = Math.PI / 4; mesh.position.set(s.x, s.y + d.size / 2 + 0.2, 0.5);
      }
      game.scene.add(mesh);
      this.list.push({ ...s, ...d, key, mesh, anim, used: false, baseY: mesh.position.y });
    }
  }

  dispose() { for (const it of this.list) { this.game.scene.remove(it.mesh); it.mesh.geometry.dispose(); it.mesh.material.dispose(); } this.list = []; }

  update(dt) {
    const g = this.game, p = g.player, t = performance.now() / 1000;
    for (const it of this.list) {
      if (it.anim) {
        const A = it.anim; A.t += dt;
        let f = 0;
        if (it.kind === 'chest') { if (A.open) f = Math.min(A.frames - 1, Math.floor((A.t) * 12)); }
        else f = Math.floor(A.t * (it.kind === 'save' ? 9 : 8)) % A.frames;
        A.tex.offset.x = f / A.frames;
        if (it.kind === 'chest' && A.open && A.t > 0.7 && !it.puffed) { it.puffed = true; g.fx.sprite('fx_shine', it.x, it.y + 1.4, { w: 2.2, fps: 14, color: 0xffe08a }); }
      }
      if (it.used && it.kind !== 'save' && it.kind !== 'chest') continue;
      if (it.used && it.kind === 'chest') continue;
      if (it.kind !== 'chest') it.mesh.position.y = it.baseY + Math.sin(t * 3 + it.x) * 0.08;
      const near = Math.abs(p.x - it.x) < 0.9 && Math.abs((p.y + 0.8) - it.mesh.position.y) < 1.4;
      if (!near) continue;
      if (it.kind === 'save' && p.hp > 0) {
        if (!it.active) {
          for (const o of this.list) if (o.kind === 'save') { o.active = false; o.mesh.material.color.setHex(o.anim ? 0x9aa8c0 : 0x6ee7ff); }
          it.active = true; it.mesh.material.color.setHex(0xffffff); g.fx.sprite('fx_shine', it.x, it.y + 1.2, { w: 3, fps: 16, color: 0x6ee7ff });
          p.spawnPoint = { x: it.x, y: it.y, room: g.world.roomId }; p.hp = p.maxHp;
          g.audio?.sfx('ui'); g.save(); g.say('Sauvegardé');
        }
      } else if (it.kind === 'orb') {
        it.used = true; g.collected.add(it.key); g.scene.remove(it.mesh); g.fx.sprite('fx_burn', it.x, it.y + 1, { w: 3, fps: 14, color: 0xffe08a }); p.abilities[it.ability] = true; g.audio?.sfx('skill'); g.fx.ring(p.x, p.y + 1, 0xffe08a, 5, 0.6); g.quests.progress('orb'); g.save(); g.say(it.label, 3);
      } else if (it.kind === 'chest') {
        it.used = true; g.collected.add(it.key); if (it.anim) { it.anim.open = true; it.anim.t = 0; } else it.mesh.material.color.setHex(0x55442a); g.audio?.sfx('chest'); p.maxHp++; p.hp = p.maxHp; g.shards.drop(it.x, it.y + 1, 10); g.fx.ring(p.x, p.y + 1, 0xc58a3a, 4, 0.5); g.quests.progress('chest'); g.save(); g.say('+1 VIE MAX  +10 ✦', 2.5);
      }
    }
  }
}
