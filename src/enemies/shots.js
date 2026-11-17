import * as THREE from 'three';

// Projectile ennemi (géré par main.js : updateEnemyShots). color : hex, r : rayon.
export function spawnShot(game, x, y, vx, vy, { color = 0xff5577, r = 0.3, life = 2.5 } = {}) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 10), new THREE.MeshBasicMaterial({ color }));
  m.position.set(x, y, 2); game.scene.add(m);
  game.enemyShots.push({ mesh: m, x, y, w: r * 2, h: r * 2, vx, vy, life });
  game.audio?.sfx('shoot');
}
