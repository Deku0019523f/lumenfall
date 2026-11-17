import * as THREE from 'three';
import { SpriteAnim } from '../engine/SpriteAnim.js';
import { SEEKER } from '../assets/manifest.js';

const PX = 1 / 16; // 1 pixel de sprite = 1/16 de tuile (le Seeker fait ~24 px = 1,5 tuile)

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

// Héros : sorcier bleu animé (bandes de sprites). Repli : la Veilleuse dessinée par code si les images manquent.
const HERO_H = 2.1;
const STATE_ANIM = { idle: 'idle', run: 'walk', jump: 'jump', fall: 'jump', dash: 'dash', attack: 'dash', charge: 'idle', hurt: 'jump' };

export function createHeroSprite(assets) {
  const root = new THREE.Group();
  // 1) Hooded Seeker (prioritaire)
  if (assets && Object.keys(SEEKER).every((n) => assets.strips['seeker_' + n])) {
    const flip = new THREE.Group(); root.add(flip);
    const anims = {};
    for (const [n, d] of Object.entries(SEEKER)) {
      const a = new SpriteAnim(assets.strips['seeker_' + n], d.fh * PX, { fps: d.fps || 10 });
      a.t = 0; a.setFrame(0);
      // l'origine du groupe = les pieds ; le plan est décalé pour que le point d'appui tombe dessus
      a.mesh.position.set((d.fw / 2 - d.feet[0]) * PX, (d.feet[1] - d.fh / 2) * PX, 0);
      a.mesh.visible = false; flip.add(a.mesh); anims[n] = a;
    }
    anims.idle.mesh.visible = true;
    return { root, flip, anims, current: 'idle', mat: anims.idle.mat, mesh: anims.idle.mesh, sheet: true, seeker: true };
  }
  const names = ['idle', 'walk', 'jump', 'dash'];
  if (assets && names.every((n) => assets.strips['hero_' + n])) {
    const anims = {};
    for (const n of names) {
      const a = new SpriteAnim(assets.strips['hero_' + n], HERO_H, { fps: n === 'walk' ? 16 : n === 'dash' ? 20 : 10 });
      a.mesh.position.y = HERO_H / 2 - 0.05; a.mesh.visible = false; root.add(a.mesh); anims[n] = a;
    }
    anims.idle.mesh.visible = true;
    return { root, anims, current: 'idle', mat: anims.idle.mat, mesh: anims.idle.mesh, sheet: true };
  }
  const tex = drawHero();
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), mat);
  mesh.position.y = 1.05;
  root.add(mesh);
  return { root, mesh, mat, sheet: false };
}

// Animation selon l'état. Avec les sprites : choix de la bande + léger squash ; sinon squash & stretch seul.
function animateSeeker(p, dt) {
  const t = performance.now() / 1000, S = p.sprite;
  let name = p.dead ? 'death' : p.state === 'hurt' ? 'hurt' : p.state === 'attack' ? 'attack'
    : p.state === 'jump' || p.state === 'fall' ? 'jump' : p.state === 'dash' ? 'run' : p.state === 'run' ? 'run' : 'idle';
  if (name !== S.current) { S.anims[S.current].mesh.visible = false; S.current = name; S.anims[name].mesh.visible = true; S.anims[name].t = 0; }
  const a = S.anims[name], d = SEEKER[name];
  if (name === 'jump') {
    // frame choisie selon la vitesse verticale (0 envol, 1-12 montée, 13-14 sommet, 15-25 chute, 26-27 réception)
    const f = p.vy > 7 ? 1 + Math.round((9 - p.vy) / 9 * 3) : p.vy > 0.5 ? 6 + Math.round((7 - p.vy) / 7 * 6) : p.vy > -1.5 ? 13 : 15 + Math.min(10, Math.floor((-p.vy - 1.5) / 1.4));
    a.setFrame(Math.max(1, Math.min(25, f)));
  } else if (name === 'idle') a.play(dt);
  else if (name === 'run') a.play(dt, p.state === 'dash' ? 30 : Math.max(8, Math.abs(p.vx) * 1.6));
  else { // lecture unique : reste sur la dernière image
    a.t += dt * d.fps; a.setFrame(Math.min(a.t, d.frames - 1));
  }
  let sx = 1, sy = 1;
  if (p.state === 'dash') { sx = 1.25; sy = 0.88; }
  if (p.state === 'charge') sx = 0.95 + Math.sin(t * 40) * 0.03;
  a.mesh.scale.set(sx, sy, 1);
  a.mesh.rotation.z = p.state === 'attack' && p.attackKind === 'up' ? 0.5 : 0;
  S.flip.scale.x = p.facing;
  const blink = p.invuln > 0 && !p.dead && Math.floor(t * 20) % 2 === 0;
  for (const n in S.anims) S.anims[n].mat.opacity = blink ? 0.35 : 1;
  S.mat = a.mat;
  S.root.position.set(p.x, p.y, 1);
}

export function animateHero(p, dt) {
  if (p.sprite.seeker) return animateSeeker(p, dt);
  const t = performance.now() / 1000;
  const S = p.sprite;
  let sx = 1, sy = 1, rot = 0;
  switch (p.state) {
    case 'run': sy = 1 + Math.sin(t * 20) * 0.02; break;
    case 'jump': sx = 0.95; sy = 1.06; break;
    case 'fall': sx = 1.03; sy = 0.97; break;
    case 'dash': sx = 1.15; sy = 0.9; break;
    case 'attack': sx = 1.1; sy = 0.96; rot = -0.12 * p.facing; break;
    case 'charge': sx = 0.94 + Math.sin(t * 40) * 0.03; sy = 0.94; break;
    case 'hurt': rot = 0.25 * -p.facing; break;
    default: sy = 1 + Math.sin(t * 2.5) * 0.012;
  }
  let mesh = S.mesh;
  if (S.sheet) {
    const name = STATE_ANIM[p.state] || 'idle';
    if (name !== S.current) { S.anims[S.current].mesh.visible = false; S.current = name; S.anims[name].mesh.visible = true; S.anims[name].t = 0; }
    const a = S.anims[name];
    if (name === 'jump') a.setFrame(p.vy > 6 ? 1 : p.vy > 0 ? 3 : p.vy > -8 ? 5 : 7);
    else a.play(dt);
    mesh = a.mesh; S.mat = a.mat;
    for (const n in S.anims) S.anims[n].mat.opacity = p.invuln > 0 && Math.floor(t * 20) % 2 === 0 ? 0.35 : 1;
  } else {
    S.mat.opacity = p.invuln > 0 && Math.floor(t * 20) % 2 === 0 ? 0.35 : 1;
  }
  mesh.scale.set(sx * p.facing, sy, 1);
  mesh.rotation.z = rot;
  S.root.position.set(p.x, p.y, 1);
}
