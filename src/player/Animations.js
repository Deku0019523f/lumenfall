import * as THREE from 'three';

// Personnage dessiné procéduralement (style dessin animé) : "Veilleuse", petite chasseuse à cape.
function drawHero() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.translate(64, 120);
  g.lineJoin = 'round'; g.lineCap = 'round';
  // cape
  g.fillStyle = '#5b3fd0'; g.strokeStyle = '#150f33'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-26, -62); g.quadraticCurveTo(-48, -20, -34, 0); g.lineTo(26, 0);
  g.quadraticCurveTo(40, -24, 24, -62); g.closePath(); g.fill(); g.stroke();
  // corps
  g.fillStyle = '#e8e4ff';
  g.beginPath(); g.ellipse(0, -30, 18, 26, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  // tête / masque
  g.beginPath(); g.ellipse(0, -72, 26, 28, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  // cornes
  g.fillStyle = '#e8e4ff';
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(s * 14, -94); g.quadraticCurveTo(s * 30, -118, s * 40, -108);
    g.quadraticCurveTo(s * 26, -100, s * 22, -90); g.closePath(); g.fill(); g.stroke();
  }
  // yeux
  g.fillStyle = '#150f33';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 10 + 6, -72, 5, 9, 0.2 * s, 0, Math.PI * 2); g.fill(); }
  // aiguille (arme)
  g.strokeStyle = '#6ee7ff'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(14, -34); g.lineTo(52, -50); g.stroke();
  return new THREE.CanvasTexture(c);
}

export function createHeroSprite() {
  const tex = drawHero();
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), mat);
  const root = new THREE.Group();
  mesh.position.y = 1.05;
  root.add(mesh);
  return { root, mesh, mat };
}

// Animation par squash & stretch selon l'état (en attendant de vraies feuilles de sprites).
export function animateHero(p, dt) {
  const t = performance.now() / 1000;
  let sx = 1, sy = 1, rot = 0;
  switch (p.state) {
    case 'run': sy = 1 + Math.sin(t * 20) * 0.04; sx = 1 - Math.sin(t * 20) * 0.03; rot = Math.sin(t * 10) * 0.03; break;
    case 'jump': sx = 0.9; sy = 1.12; break;
    case 'fall': sx = 1.06; sy = 0.94; break;
    case 'dash': sx = 1.4; sy = 0.75; break;
    case 'attack': sx = 1.12; sy = 0.95; rot = -0.12 * p.facing; break;
    case 'charge': sx = 0.92 + Math.sin(t * 40) * 0.03; sy = 0.92; break;
    case 'hurt': rot = 0.25 * -p.facing; break;
    default: sy = 1 + Math.sin(t * 2.5) * 0.015;
  }
  p.sprite.mesh.scale.set(sx * p.facing, sy, 1);
  p.sprite.mesh.rotation.z = rot;
  p.sprite.root.position.set(p.x, p.y, 1);
  // clignotement d'invincibilité
  p.sprite.mat.opacity = p.invuln > 0 && Math.floor(t * 20) % 2 === 0 ? 0.35 : 1;
}
