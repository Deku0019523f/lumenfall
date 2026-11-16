import * as THREE from 'three';

// PNJ de chapitre : lueur dorée. Le dialogue démarre quand le joueur s'approche.
export class Npc {
  constructor(game, x, y, story) {
    this.game = game; this.x = x; this.y = y; this.story = story;
    this.key = `npc:${game.world.index}`;
    const tex = game.fx.texGlow;
    this.glow = new THREE.Mesh(game.fx.plane, new THREE.MeshBasicMaterial({ map: tex, color: 0x9be3ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.glow.scale.set(1.6, 1.6, 1); this.glow.position.set(x, y + 1.1, 0.6);
    this.core = new THREE.Mesh(game.fx.plane, new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.core.scale.set(0.7, 0.7, 1); this.core.position.set(x, y + 1.1, 0.7);
    game.scene.add(this.glow); game.scene.add(this.core);
    this.mark = null; this.t = 0;
  }

  update(dt) {
    const g = this.game, p = g.player; this.t += dt;
    const talked = g.seen.has(this.key);
    const s = 1.6 + Math.sin(this.t * 3) * 0.2; this.glow.scale.set(s, s, 1);
    this.glow.position.y = this.core.position.y = this.y + 1.1 + Math.sin(this.t * 2) * 0.12;
    this.glow.material.color.setHex(talked ? 0x7a88a8 : 0xffe08a);
    if (!talked && !g.dialogue.active && Math.abs(p.x - this.x) < 2.6 && Math.abs(p.y - this.y) < 2.5 && !p.dead) {
      g.seen.add(this.key);
      g.dialogue.start(this.story.lines, () => { g.quests.activate(g.world.index); g.quests.progress('talk'); g.save(); });
    }
  }

  dispose() {
    for (const m of [this.glow, this.core]) { this.game.scene.remove(m); m.material.dispose(); }
  }
}
