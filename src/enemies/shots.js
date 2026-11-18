import * as THREE from 'three';
import { SpriteAnim } from '../engine/SpriteAnim.js';

// Projectile ennemi (géré par main.js : updateEnemyShots). color : hex, r : rayon.
// strip : clé d'une bande (ex. 'fireball_move') affichée à la place du disque (orientée vers sa vitesse), si elle est chargée.
export function spawnShot(game, x, y, vx, vy, { color = 0xff5577, r = 0.3, life = 2.5, strip = null } = {}) {
  const st = strip && game.assets?.strips?.[strip];
  let m, anim = null;
  if (st) { anim = new SpriteAnim(st, r * 3.2, { fps: 14 }); m = anim.mesh; m.scale.x = vx < 0 ? -1 : 1; }
  else m = new THREE.Mesh(new THREE.CircleGeometry(r, 10), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, 2); game.scene.add(m);
  game.enemyShots.push({ mesh: m, anim, x, y, w: r * 2, h: r * 2, vx, vy, life });
  game.audio?.sfx('shoot');
}
