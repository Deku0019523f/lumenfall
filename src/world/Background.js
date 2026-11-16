import * as THREE from 'three';

// Fond défilant (parallaxe) : un plan qui suit la caméra, l'image glisse plus lentement que le décor.
export class Background {
  constructor(scene, tex, tint = 0xffffff) {
    this.tex = tex.clone(); this.tex.needsUpdate = true;
    this.tex.wrapS = THREE.RepeatWrapping;
    this.imgAspect = tex.image.width / tex.image.height;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, color: tint, depthWrite: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.mat);
    this.mesh.position.z = -9; this.mesh.renderOrder = -10;
    scene.add(this.mesh); this.scene = scene;
  }
  update(camera, level) {
    const w = camera.halfW * 2, h = camera.halfH * 2;
    this.mesh.scale.set(w * 1.02, h * 1.02, 1);
    this.mesh.position.x = camera.cam.position.x; this.mesh.position.y = camera.cam.position.y;
    // largeur visible de l'image : même hauteur que l'écran, repeat.x < 1 si l'écran est moins large que l'image
    this.tex.repeat.set(Math.min(1, (w / h) / this.imgAspect), 0.85);
    this.tex.offset.x = (camera.x / level.w) * 0.35;
    this.tex.offset.y = 0.15 * (1 - Math.min(1, Math.max(0, camera.y / level.h)));
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mat.dispose(); this.tex.dispose(); }
}
