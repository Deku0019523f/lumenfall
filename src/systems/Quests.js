import { STORY } from '../story/story.js';

// Suivi des quêtes : état sérialisable { active: [ids], prog: {id: n}, done: [ids] }.
export class Quests {
  constructor(game) { this.game = game; this.active = new Set(); this.prog = {}; this.done = new Set(); }

  all() { return STORY.flatMap((c, ci) => c.quests.map((q) => ({ ...q, chapter: ci }))); }
  get(id) { return this.all().find((q) => q.id === id); }

  // Active les quêtes d'un chapitre (lors du dialogue avec le PNJ, ou à l'arrivée)
  activate(chapter) {
    for (const q of STORY[chapter]?.quests || []) if (!this.done.has(q.id)) this.active.add(q.id);
  }

  progress(type, n = 1) {
    const g = this.game;
    for (const id of [...this.active]) {
      const q = this.get(id);
      if (!q || q.type !== type || q.chapter !== g.world.index) continue;
      this.prog[id] = Math.min(q.goal, (this.prog[id] || 0) + n);
      if (this.prog[id] >= q.goal) this.#complete(q);
    }
  }

  #complete(q) {
    const g = this.game;
    this.active.delete(q.id); this.done.add(q.id);
    g.player.shards += q.reward;
    g.say(`QUÊTE ACCOMPLIE  +${q.reward} ✦`, 3);
    g.fx.ring(g.player.x, g.player.y + 1, 0xffe08a, 4, 0.5);
    g.save();
  }

  // Quêtes visibles : actives du chapitre courant (non terminées)
  current() {
    return [...this.active].map((id) => this.get(id)).filter((q) => q && q.chapter === this.game.world.index)
      .map((q) => ({ ...q, n: this.prog[q.id] || 0 }));
  }

  // Pour l'écran des quêtes : toutes les quêtes connues (actives + terminées)
  list() {
    return this.all().filter((q) => this.active.has(q.id) || this.done.has(q.id))
      .map((q) => ({ ...q, n: this.done.has(q.id) ? q.goal : this.prog[q.id] || 0, done: this.done.has(q.id) }));
  }

  toJSON() { return { active: [...this.active], prog: this.prog, done: [...this.done] }; }
  load(d) { this.active = new Set(d?.active || []); this.prog = d?.prog || {}; this.done = new Set(d?.done || []); }
  reset() { this.load(null); }
}
