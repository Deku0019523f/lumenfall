import * as THREE from 'three';

// Animation de sprite à partir d'une bande horizontale (frames côte à côte).
// strip = { tex, frames } (voir Assets.js). h = hauteur monde ; la largeur suit le ratio d'une frame.
export class SpriteAnim {
  constructor(strip, h, { fps = 12, flipX = false } = {}) {
    this.frames = strip.frames;
    this.tex = strip.tex.clone();          // une texture par instance : l'offset est propre à chaque sprite
    this.tex.needsUpdate = true;
    this.tex.repeat.set(1 / this.frames, 1);
    const fw = strip.tex.image.width / this.frames, fh = strip.tex.image.height;
    this.w = h * fw / fh; this.h = h;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this.w, this.h), this.mat);
    this.fps = fps; this.t = Math.random() * this.frames; this.frame = 0; this.flipX = flipX;
    this.setFrame(0);
  }
  setFrame(i) {
    this.frame = ((Math.floor(i) % this.frames) + this.frames) % this.frames;
    this.tex.offset.x = this.frame / this.frames;
  }
  play(dt, fps = this.fps) { this.t += dt * fps; this.setFrame(this.t); }
  dispose() { this.mesh.geometry.dispose(); this.mat.dispose(); this.tex.dispose(); }
}
