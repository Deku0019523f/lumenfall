import * as THREE from 'three';
import { SpriteAnim } from '../engine/SpriteAnim.js';

// Légende : # solide | = plateforme traversable | ^ pics | . vide
// P départ | c rampant | f volant | S sauvegarde | C coffre | D orbe double-saut | W orbe saut mural | B boss | M mini-boss | N PNJ
// Décor animé (sans collision) : p plante | q tige | b fleur bleue
const SPAWN_CHARS = 'cfSCDWBNM';
const DECOR = {
  p: { strip: 'plant1', h: 1.7 },
  q: { strip: 'plant4', h: 2.2 },
  b: { strip: 'blueflower', h: 1.3 },
};

function spikeTexture(color) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 48;
  const g = c.getContext('2d'); g.fillStyle = color; g.strokeStyle = '#120a14'; g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(i * 32 + 3, 46); g.lineTo(i * 32 + 16, 4); g.lineTo(i * 32 + 29, 46); g.closePath(); g.fill(); g.stroke(); }
  return new THREE.CanvasTexture(c);
}

export class Level {
  // def : { name, map, theme: { tiles, solid, platform, spike, bands[] } }
  constructor(def, assets) {
    this.def = def; this.theme = def.theme;
    this.name = def.name;
    this.rows = def.map;
    this.h = this.rows.length;
    this.w = Math.max(...this.rows.map((r) => r.length));
    this.spawns = []; // {type,x,y}
    this.decorSpawns = [];
    this.spawn = { x: 2, y: 2 };
    this.group = new THREE.Group();
    this.decor = [];
    this.#parse();
    this.#build(assets);
  }

  // Coordonnées monde : y=0 en bas de la carte.
  #cell(tx, ty) {
    const row = this.rows[this.h - 1 - ty];
    return row && tx >= 0 && tx < row.length ? row[tx] : tx < 0 || tx >= this.w ? '#' : '.';
  }

  isSolid(tx, ty) { return ty < 0 ? false : this.#cell(tx, ty) === '#'; }
  isPlatform(tx, ty) { return this.#cell(tx, ty) === '='; }
  isSpike(tx, ty) { return this.#cell(tx, ty) === '^'; }
  // pour l'autotile : hors carte = plein
  #full(tx, ty) { return tx < 0 || tx >= this.w || ty < 0 || ty >= this.h || this.#cell(tx, ty) === '#'; }

  get bounds() { return { minX: 0, maxX: this.w, minY: 0, maxY: this.h }; }

  #parse() {
    for (let r = 0; r < this.h; r++) {
      for (let c = 0; c < this.rows[r].length; c++) {
        const ch = this.rows[r][c];
        const x = c + 0.5, y = this.h - 1 - r;
        if (ch === 'P') this.spawn = { x, y };
        else if (SPAWN_CHARS.includes(ch)) this.spawns.push({ type: ch, x, y });
        else if (DECOR[ch]) this.decorSpawns.push({ type: ch, x, y });
      }
    }
  }

  #build(assets) {
    const T = this.theme;
    const tilesTex = assets?.tiles?.[T.tiles] || null;
    const solid = [], plat = [], spike = [];
    const slices = Array.from({ length: 9 }, () => []);
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.#cell(tx, ty);
      if (ch === '#') {
        if (tilesTex) {
          const W = this.#full(tx - 1, ty), E = this.#full(tx + 1, ty), N = this.#full(tx, ty + 1), S = this.#full(tx, ty - 1);
          const col = !W && !E ? 1 : !W ? 0 : !E ? 2 : 1;
          const row = !N ? 0 : !S ? 2 : 1;
          slices[row * 3 + col].push([tx, ty]);
        } else solid.push([tx, ty]);
      } else if (ch === '=') plat.push([tx, ty]);
      else if (ch === '^') spike.push([tx, ty]);
    }

    const inst = (list, geo, material, dy = 0) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geo, material, list.length);
      const m = new THREE.Matrix4();
      list.forEach(([x, y], i) => { m.setPosition(x + 0.5, y + 0.5 + dy, 0); mesh.setMatrixAt(i, m); });
      this.group.add(mesh);
    };
    // plan 1x1 dont l'UV pointe sur la tranche (col,row) du tileset 3x3 (haut = row 0)
    const sliceGeo = (col, row, halfTop = false) => {
      const g = new THREE.PlaneGeometry(1.02, halfTop ? 0.5 : 1.02);
      const e = 0.5 / 192, uv = g.attributes.uv;
      const u0 = col / 3 + e, u1 = (col + 1) / 3 - e, v1 = 1 - row / 3 - e;
      const v0 = halfTop ? v1 - 1 / 6 : 1 - (row + 1) / 3 + e;
      uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
      return g;
    };

    if (tilesTex) {
      const mat = new THREE.MeshBasicMaterial({ map: tilesTex, transparent: true });
      slices.forEach((list, k) => inst(list, sliceGeo(k % 3, Math.floor(k / 3)), mat));
      inst(plat, sliceGeo(1, 0, true), mat, 0.25); // dessus de plateforme : moitié haute de la tranche "haut"
    } else {
      inst(solid, new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: T.solid }));
      inst(plat, new THREE.PlaneGeometry(1, 0.25), new THREE.MeshBasicMaterial({ color: T.platform }), 0.375);
    }
    inst(spike, new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: spikeTexture(T.spike ?? '#ff5577'), transparent: true }), -0.25);

    // Sans image de fond : bandes colorées simples (repli)
    if (!assets?.bg?.[T.bg?.image]) {
      for (let i = 0; i < 3; i++) {
        const g = new THREE.PlaneGeometry(this.w * 1.2, this.h * (0.5 - i * 0.12));
        const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: T.bands[i], transparent: true, opacity: 0.55 }));
        mesh.position.set(this.w / 2, (this.h * (0.5 - i * 0.12)) / 2, -5 - i);
        this.group.add(mesh);
      }
    }

    // Décor animé (plantes) : devant le fond, derrière les tuiles et le joueur
    for (const d of this.decorSpawns) {
      const def = DECOR[d.type], strip = assets?.strips?.[def.strip];
      if (!strip) continue;
      const a = new SpriteAnim(strip, def.h, { fps: 8 });
      a.mesh.position.set(d.x, d.y + def.h / 2 - 0.03, -0.4);
      this.group.add(a.mesh); this.decor.push(a);
    }
  }

  update(dt) { for (const a of this.decor) a.play(dt); }

  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const a of this.decor) a.dispose();
    this.group.removeFromParent();
  }
}
