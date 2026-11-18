import * as THREE from 'three';
import { SpriteAnim } from '../engine/SpriteAnim.js';
import { MOSSY, VILLAGE } from '../assets/decor.js';

// Légende : # solide | = plateforme traversable | ^ pics | . vide
// P départ | c rampant | f volant | k cracheur | h sauteur | w esprit | r brute | S sauvegarde | C coffre | D orbe double-saut | W orbe saut mural | B boss | T/t portails appariés (le 1er T ↔ le 1er t…)
// Décor animé (sans collision) : p plante | q tige | b fleur bleue
const SPAWN_CHARS = 'cfkhwrSCDWBNMTt';
const DECOR = {
  p: { strip: 'plant1', h: 1.7 },
  q: { strip: 'plant4', h: 2.2 },
  b: { strip: 'blueflower', h: 1.3 },
};

let GLOW = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (GLOW = new THREE.CanvasTexture(c));
}

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
    this.decor = []; this.flames = [];
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
    this.#scatter(assets);
  }

  // Décor dispersé (déterministe) : atlas Mossy (ch. 1-2) ou accessoires du village (ch. 3), flammes animées sur feux et torches.
  #scatter(assets) {
    const kind = this.theme.tiles === 'village' ? 'village' : 'mossy';
    const atlas = assets?.decor?.[kind], R = kind === 'village' ? VILLAGE : MOSSY;
    if (!atlas) return;
    let seed = 7 + this.w * 31 + this.h;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const PX = kind === 'village' ? 1 / 22 : 1 / 100; // unités par pixel d'atlas
    const sprite = (name, x, y, z, { anchor = 'bottom', flip = false, scale = 1, color = 0xffffff, opacity = 1 } = {}) => {
      const r = R[name]; if (!r) return null;
      const t = atlas.clone(); t.needsUpdate = true;
      t.repeat.set(r[2] / atlas.image.width, r[3] / atlas.image.height);
      t.offset.set(r[0] / atlas.image.width, 1 - (r[1] + r[3]) / atlas.image.height);
      const w = r[2] * PX * scale, h = r[3] * PX * scale;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity, depthWrite: false }));
      m.position.set(x, anchor === 'top' ? y - h / 2 : y + h / 2, z); if (flip) m.scale.x = -1;
      this.group.add(m); return { m, w, h };
    };
    const flame = (x, y, w, color) => {
      const a = assets?.strips?.fx_flame; if (!a) return;
      const t = a.tex.clone(); t.needsUpdate = true; t.repeat.set(1 / a.frames, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.position.set(x, y + w / 2 * 0.8, 0.1); this.group.add(m);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(w * 3, w * 3), new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
      g.position.set(x, y + w / 2, 0.05); this.group.add(g);
      this.flames.push({ t, frames: a.frames, ph: rnd() * a.frames });
    };
    const GROUND = kind === 'village'
      ? ['Barrel', 'Crate_Large', 'Crate_Small', 'Pot_01', 'Pot_02', 'Pot_03', 'Bush_02', 'Bush_03', 'Sunflower_01', 'Sunflower_02', 'Sunflower_03', 'Pumpkin_01', 'Hay_Bale', 'Gunny_Bag_01', 'Grass_02', 'Grass_05', 'Rock_02', 'Stump']
      : ['plant1', 'plant2', 'plant3', 'plant4', 'plant5', 'plant6', 'rock1', 'rock2', 'rock3'];
    const BIG = kind === 'village' ? ['Well', 'Scarecrow', 'Tree_02', 'Statue', 'Weapon_Rack', 'Training_Dummy', 'Banner_Pillar', 'Sign_01', 'Gravestone_02', 'Gravestone_03', 'Gravestone_04', 'Stone_of_Recall', 'Log_Bench', 'Wood_Logs', 'Campfire', 'Fire_Bowl', 'Campfire', 'Fire_Bowl'] : [];
    let lastBig = -99;
    for (let ty = 1; ty < this.h - 1; ty++) {
      for (let tx = 1; tx < this.w - 1; tx++) {
        const c = this.#cell(tx, ty);
        if (c === '#' && this.#cell(tx, ty + 1) === '.' && this.#cell(tx - 1, ty + 1) === '.' && this.#cell(tx + 1, ty + 1) === '.') {
          const r = rnd();
          if (kind === 'village' && BIG.length && r < 0.09 && tx - lastBig > 7) {
            const n = BIG[Math.floor(rnd() * BIG.length)]; lastBig = tx;
            sprite(n, tx + 0.5, ty + 1 - 0.05, -0.35, { flip: rnd() < 0.5 });
            if (n === 'Campfire') flame(tx + 0.5, ty + 1.05, 1.5, 0xff9a3a);
            else if (n === 'Fire_Bowl') flame(tx + 0.5, ty + 1.45, 1.1, 0xff9a3a);
          } else if (r < (kind === 'village' ? 0.22 : 0.3)) {
            const n = GROUND[Math.floor(rnd() * GROUND.length)];
            const sc = kind === 'village' ? 1 : 0.55 + rnd() * 0.4;
            sprite(n, tx + 0.5 + (rnd() - 0.5) * 0.6, ty + 1 - 0.04, -0.45, { flip: rnd() < 0.5, scale: sc, color: kind === 'village' ? 0xffffff : 0xa8c8b0 });
          }
        } else if (c === '#' && this.#cell(tx, ty - 1) === '.' && kind === 'mossy' && rnd() < 0.16) {
          const n = ['vine1', 'vine2', 'vine3', 'vine4'][Math.floor(rnd() * 4)];
          sprite(n, tx + 0.5, ty + 0.05, -0.3, { anchor: 'top', scale: 0.35 + rnd() * 0.35, flip: rnd() < 0.5, color: 0xb8d8c0 });
        } else if (c === '^' && kind === 'mossy' && rnd() < 0.5) {
          sprite(['thorn1', 'thorn2', 'thorn3'][Math.floor(rnd() * 3)], tx + 0.5, ty - 0.05, 0.2, { scale: 0.3, flip: rnd() < 0.5 });
        }
      }
    }
    // feu de camp d'un point de sauvegarde au chapitre 3
    if (kind === 'village') for (const d of this.spawns) if (d.type === 'S') { sprite('Fire_Bowl', d.x + 1.6, d.y - 0.04, -0.3); flame(d.x + 1.6, d.y + 0.85, 1.1, 0xff9a3a); }
  }

  update(dt) {
    for (const a of this.decor) a.play(dt);
    const t = performance.now() / 1000;
    for (const f of this.flames) f.t.offset.x = (Math.floor(t * 14 + f.ph) % f.frames) / f.frames;
  }

  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const a of this.decor) a.dispose();
    this.group.removeFromParent();
  }
}
