import * as THREE from 'three';

// Légende : # solide | = plateforme traversable | ^ pics | . vide
// P départ | c rampant | f volant | S point de sauvegarde | C coffre | D orbe double-saut | B boss
export class Level {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.rows = def.map;
    this.h = this.rows.length;
    this.w = Math.max(...this.rows.map((r) => r.length));
    this.spawns = []; // {type,x,y}
    this.spawn = { x: 2, y: 2 };
    this.group = new THREE.Group();
    this.#parse();
    this.#build();
  }

  // Coordonnées monde : y=0 en bas de la carte.
  #cell(tx, ty) {
    const row = this.rows[this.h - 1 - ty];
    return row && tx >= 0 && tx < row.length ? row[tx] : tx < 0 || tx >= this.w ? '#' : '.';
  }

  isSolid(tx, ty) { return ty < 0 ? false : this.#cell(tx, ty) === '#'; }
  isPlatform(tx, ty) { return this.#cell(tx, ty) === '='; }
  isSpike(tx, ty) { return this.#cell(tx, ty) === '^'; }

  get bounds() { return { minX: 0, maxX: this.w, minY: 0, maxY: this.h }; }

  #parse() {
    for (let r = 0; r < this.h; r++) {
      for (let c = 0; c < this.rows[r].length; c++) {
        const ch = this.rows[r][c];
        const x = c + 0.5, y = this.h - 1 - r;
        if (ch === 'P') this.spawn = { x, y };
        else if ('cfSCDB'.includes(ch)) this.spawns.push({ type: ch, x, y });
      }
    }
  }

  #build() {
    const solid = [], plat = [], spike = [];
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const ch = this.#cell(tx, ty);
      if (ch === '#') solid.push([tx, ty]);
      else if (ch === '=') plat.push([tx, ty]);
      else if (ch === '^') spike.push([tx, ty]);
    }
    const mk = (list, geo, color, dy = 0) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color }), list.length);
      const m = new THREE.Matrix4();
      list.forEach(([x, y], i) => { m.setPosition(x + 0.5, y + 0.5 + dy, 0); mesh.setMatrixAt(i, m); });
      this.group.add(mesh);
    };
    mk(solid, new THREE.PlaneGeometry(1, 1), this.def.palette.solid);
    mk(plat, new THREE.PlaneGeometry(1, 0.25), this.def.palette.platform, 0.375);
    mk(spike, new THREE.PlaneGeometry(0.9, 0.5), 0xff5577, -0.25);

    // Fond en couches de parallaxe très simples (bandes).
    for (let i = 0; i < 3; i++) {
      const g = new THREE.PlaneGeometry(this.w * 1.2, this.h * (0.5 - i * 0.12));
      const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: this.def.palette.bg[i], transparent: true, opacity: 0.55 }));
      mesh.position.set(this.w / 2, (this.h * (0.5 - i * 0.12)) / 2, -5 - i);
      this.group.add(mesh);
    }
  }
}
