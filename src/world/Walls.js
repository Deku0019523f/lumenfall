import * as THREE from 'three';

// Murs fissurés (lettre X dans les cartes) : invisibles pour Level, gérés ici.
// Un coup de lame, de projectile ou de nova les fait s'effondrer (tout le pan d'un coup) ; l'état est mémorisé dans game.collected.
function crackTexture(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, 64, 6);
  g.strokeStyle = 'rgba(8,6,12,0.85)'; g.lineWidth = 2.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(34, 0); g.lineTo(28, 18); g.lineTo(38, 30); g.lineTo(26, 46); g.lineTo(33, 64);
  g.moveTo(28, 18); g.lineTo(12, 24); g.moveTo(38, 30); g.lineTo(54, 38); g.moveTo(26, 46); g.lineTo(10, 54); g.stroke();
  g.strokeStyle = 'rgba(220,240,255,0.35)'; g.lineWidth = 1; g.strokeRect(1.5, 1.5, 61, 61);
  return new THREE.CanvasTexture(c);
}

export class Walls {
  constructor(game, level, roomId, theme) {
    this.game = game; this.level = level; this.roomId = roomId;
    this.tiles = new Map();                     // "tx,ty" -> mesh
    const key = (tx, ty) => `wall:${roomId}:${tx}:${ty}`;
    let tex = null;
    for (let r = 0; r < level.h; r++) {
      const row = level.rows[r];
      for (let tx = 0; tx < row.length; tx++) {
        if (row[tx] !== 'X') continue;
        const ty = level.h - 1 - r;
        if (game.collected?.has(key(tx, ty))) continue;
        tex ||= crackTexture('#' + new THREE.Color(theme?.solid ?? 0x2a2a3a).offsetHSL(0, 0, 0.1).getHexString());
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.02), new THREE.MeshBasicMaterial({ map: tex }));
        m.position.set(tx + 0.5, ty + 0.5, 0.08);
        level.group.add(m); this.tiles.set(`${tx},${ty}`, m);
      }
    }
    if (!this.tiles.size) return;
    const base = level.isSolid.bind(level);
    level.isSolid = (tx, ty) => this.tiles.has(`${tx},${ty}`) || base(tx, ty);
  }

  #overlap(b, tx, ty) { return Math.abs(b.x - (tx + 0.5)) * 2 < b.w + 1 && b.y < ty + 1 && b.y + b.h > ty; }

  #hit(box) {
    for (const k of this.tiles.keys()) { const [tx, ty] = k.split(',').map(Number); if (this.#overlap(box, tx, ty)) { this.#collapse(tx, ty); return true; } }
    return false;
  }

  #collapse(sx, sy) {                           // tout le pan de mur relié s'effondre
    const g = this.game, todo = [[sx, sy]], done = [];
    while (todo.length) {
      const [x, y] = todo.pop(), k = `${x},${y}`;
      if (!this.tiles.has(k)) continue;
      const m = this.tiles.get(k); this.tiles.delete(k); m.removeFromParent(); m.geometry.dispose();
      done.push([x, y]); g.collected?.add(`wall:${this.roomId}:${x}:${y}`);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) todo.push([x + dx, y + dy]);
    }
    for (const [x, y] of done) {
      g.fx?.burst?.(x + 0.5, y + 0.5, 0xbfae98, 6, 4); g.fx?.ring?.(x + 0.5, y + 0.5, 0xd8c8b0, 1.6, 0.35);
    }
    g.audio?.sfx?.('kill'); g.camera.shake(0.45, 0.35); g.hitStop = Math.max(g.hitStop || 0, 0.08);
    g.hud?.say?.('Un mur s\'effondre…', 2.2);
    if (g.save) g.save();
  }

  update() {
    if (!this.tiles.size) return;
    const g = this.game, p = g.player;
    if (p && p.attackT > 0 && !p.dead) {
      const k = p.attackKind;
      let b;
      if (k === 'up') b = { x: p.x, y: p.y + p.h - 0.3, w: 1.8, h: 1.6 };
      else if (k === 'down') b = { x: p.x, y: p.y - 1.5, w: 1.5, h: 1.6 };
      else {
        const reach = k === 'charged' ? 3.6 : p.attackFinisher ? 3.0 : 2.2, hh = k === 'charged' ? 2.1 : p.attackFinisher ? 1.7 : 1.4;
        b = { x: p.x + p.facing * (reach / 2 + p.w / 2 - 0.1), y: p.y + 0.9 - hh / 2, w: reach, h: hh };
      }
      this.#hit(b);
    }
    for (const pr of g.projectiles || []) if (this.tiles.size) this.#hit({ x: pr.x, y: pr.y - pr.h / 2, w: pr.w + 0.6, h: pr.h + 0.6 });
  }
}
