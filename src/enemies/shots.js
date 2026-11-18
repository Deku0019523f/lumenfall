import * as THREE from 'three';
import { SpriteAnim } from '../engine/SpriteAnim.js';

// Projectile ennemi (géré par main.js : updateEnemyShots). color : hex, r : rayon.
// strip : clé d'une bande (ex. 'fireball_move') affichée à la place du disque (orientée vers sa vitesse), si elle est chargée ;
// sinon (cas par défaut) disque + boule de glace animée (fx_iceball) si disponible.
export function spawnShot(game, x, y, vx, vy, { color = 0xff5577, r = 0.3, life = 2.5, strip = null } = {}) {
  const st = strip && game.assets?.strips?.[strip];
  let m, anim = null;
  if (st) { anim = new SpriteAnim(st, r * 3.2, { fps: 14 }); m = anim.mesh; m.scale.x = vx < 0 ? -1 : 1; }
  else {
    m = new THREE.Mesh(new THREE.CircleGeometry(r, 10), new THREE.MeshBasicMaterial({ color }));
    // sprite animé (boule de glace) collé au projectile ; le disque reste pour l'impact et la couleur
    const a = game.assets?.strips?.fx_iceball;
    if (a) {
      const t = a.tex.clone(); t.needsUpdate = true; t.repeat.set(1 / a.frames, 1);
      const c = new THREE.Mesh(game.fx.plane, new THREE.MeshBasicMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      c.scale.set(r * 5, r * 5, 1); c.position.z = 0.1; c.rotation.z = Math.atan2(vy, vx) + Math.PI;
      c.onBeforeRender = () => { t.offset.x = (Math.floor(performance.now() / 70) % a.frames) / a.frames; };
      m.material.opacity = 0.0; m.material.transparent = true; m.add(c);
    }
  }
  m.position.set(x, y, 2); game.scene.add(m);
  game.enemyShots.push({ mesh: m, anim, x, y, w: r * 2, h: r * 2, vx, vy, life });
  game.audio?.sfx('shoot');
}
