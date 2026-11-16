import * as THREE from 'three';
import { VIEW_HEIGHT } from './renderer.js';

export class GameCamera {
  constructor() {
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
    this.cam.position.z = 10;
    this.x = 0;
    this.y = 0;
    this.shakeT = 0;
    this.shakeAmp = 0;
    this.zoomP = 0; // « coup de zoom » à l'impact
    this.bounds = null; // {minX,maxX,minY,maxY} en unités monde
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const h = VIEW_HEIGHT / 2;
    this.halfH = h;
    this.halfW = h * aspect;
    Object.assign(this.cam, { left: -this.halfW, right: this.halfW, top: h, bottom: -h });
    this.cam.updateProjectionMatrix();
  }

  setBounds(b) { this.bounds = b; }

  snapTo(x, y) { this.x = x; this.y = y; this.#clamp(); }

  shake(amp = 0.25, dur = 0.2) { if (amp >= this.shakeAmp * (this.shakeT > 0 ? 0.6 : 0)) { this.shakeAmp = amp; this.shakeT = dur; } }

  punch(z = 0.04) { this.zoomP = Math.max(this.zoomP, z); }

  follow(target, facing, dt) {
    const tx = target.x + facing * 1.5;
    const ty = target.y + 1.0;
    const k = 1 - Math.pow(0.001, dt); // lissage indépendant du framerate
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.#clamp();

    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      ox = (Math.random() - 0.5) * this.shakeAmp;
      oy = (Math.random() - 0.5) * this.shakeAmp;
    }
    this.zoomP *= Math.pow(0.0005, dt);
    this.cam.zoom = 1 + this.zoomP; this.cam.updateProjectionMatrix();
    this.cam.position.x = this.x + ox;
    this.cam.position.y = this.y + oy;
  }

  #clamp() {
    const b = this.bounds;
    if (!b) return;
    const minX = b.minX + this.halfW, maxX = b.maxX - this.halfW;
    const minY = b.minY + this.halfH, maxY = b.maxY - this.halfH;
    this.x = minX > maxX ? (b.minX + b.maxX) / 2 : Math.min(Math.max(this.x, minX), maxX);
    this.y = minY > maxY ? (b.minY + b.maxY) / 2 : Math.min(Math.max(this.y, minY), maxY);
  }
}
