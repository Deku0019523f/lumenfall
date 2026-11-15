import * as THREE from 'three';
import { aabb } from '../engine/physics.js';

export const COMBAT = {
  atkTime: 0.18, comboWindow: 0.38, chargeTime: 0.55, chargedTime: 0.3,
  specialCost: 3, projSpeed: 16, pogo: 12,
};

// Hitbox rectangulaire devant/au-dessus/au-dessous du joueur.
function hitbox(p, kind) {
  // y = bas de la boîte (même convention que aabb et les corps)
  if (kind === 'up') return { x: p.x, y: p.y + p.h - 0.2, w: 1.6, h: 1.4 };
  if (kind === 'down') return { x: p.x, y: p.y - 1.4, w: 1.3, h: 1.4 };
  const reach = kind === 'charged' ? 3.2 : p.comboIdx === 2 ? 2.6 : 2.0;
  const hh = kind === 'charged' ? 1.9 : 1.4;
  return { x: p.x + p.facing * (reach / 2 + p.w / 2 - 0.1), y: p.y + 0.9 - hh / 2, w: reach, h: hh };
}

function strike(p, game, kind, dmg) {
  const hb = hitbox(p, kind);
  let hitAny = false;
  for (const e of game.enemies) {
    if (e.dead || p.hitSet.has(e)) continue;
    if (aabb(hb, e)) {
      p.hitSet.add(e);
      e.hit(dmg, Math.sign(e.x - p.x) || p.facing, game);
      p.energy = Math.min(p.maxEnergy, p.energy + 1);
      hitAny = true;
      game.camera.shake(0.12 + dmg * 0.05, 0.12);
      game.fx.burst(e.x, e.y + e.h / 2, 0xffe08a, 6, 5);
    }
  }
  if (hitAny && kind === 'down') { p.vy = COMBAT.pogo; p.airJumps = 0; } // rebond sur ennemi
  return hitAny;
}

export function updateCombat(p, input, game, dt) {
  const C = COMBAT;
  if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.comboIdx = 0; }
  if (p.attackLock > 0) p.attackLock -= dt;

  // Charge : maintenir attaque
  if (input.down.attack && p.attackT <= 0 && p.state !== 'hurt') p.chargeT += dt; else if (!input.down.attack) { /* relâchement géré plus bas */ }

  // Fin de l'attaque active
  if (p.attackT > 0) {
    p.attackT -= dt;
    strike(p, game, p.attackKind, p.attackDmg);
    if (p.attackT <= 0) p.hitSet.clear();
  }

  // Lancer une attaque rapide (appui court) / chargée (relâchement après charge)
  if (input.released.attack && p.attackT <= 0 && p.state !== 'hurt') {
    const charged = p.chargeT >= C.chargeTime;
    p.chargeT = 0;
    let kind = 'front', dmg = 1;
    if (charged) { kind = 'charged'; dmg = 3; p.attackT = C.chargedTime; p.attackLock = C.chargedTime; }
    else {
      if (input.axisY > 0.6) kind = 'up';
      else if (input.axisY < -0.6 && !p.onGround) kind = 'down';
      p.comboIdx = p.comboT > 0 ? (p.comboIdx + 1) % 3 : 0;
      if (p.comboIdx === 2) dmg = 2;
      p.attackT = C.atkTime; p.attackLock = p.onGround ? C.atkTime * 0.8 : 0; p.comboT = C.comboWindow;
    }
    p.attackKind = kind; p.attackDmg = dmg; p.hitSet.clear();
    const a = kind === 'up' ? Math.PI / 2 : kind === 'down' ? -Math.PI / 2 : 0;
    const hb = hitbox(p, kind);
    game.fx.slash(hb.x, hb.y + hb.h / 2, kind === 'up' || kind === 'down' ? 1 : p.facing, charged ? 1.9 : 1.2, charged ? 0x6ee7ff : 0xe8e4ff, a);
    if (charged) game.camera.shake(0.2, 0.15);
  }

  // Attaque spéciale : projectile d'énergie (coûte de l'énergie)
  if (input.pressed.special && p.energy >= C.specialCost && p.state !== 'hurt') {
    p.energy -= C.specialCost;
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0x6ee7ff }));
    m.position.set(p.x + p.facing * 0.8, p.y + 1, 2);
    game.scene.add(m);
    game.projectiles.push({ mesh: m, x: m.position.x, y: m.position.y, w: 0.7, h: 0.7, vx: p.facing * C.projSpeed, life: 1.2, dmg: 2 });
    p.attackLock = 0.15;
  }

  // Projectiles
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const pr = game.projectiles[i];
    pr.x += pr.vx * dt; pr.life -= dt;
    pr.mesh.position.x = pr.x;
    const box = { x: pr.x, y: pr.y - pr.h / 2, w: pr.w, h: pr.h };
    let dead = pr.life <= 0 || game.level.isSolid(Math.floor(pr.x), Math.floor(pr.y));
    for (const e of game.enemies) {
      if (!e.dead && aabb(box, e)) { e.hit(pr.dmg, Math.sign(pr.vx), game); game.fx.burst(pr.x, pr.y, 0x6ee7ff, 8); dead = true; break; }
    }
    if (dead) { game.scene.remove(pr.mesh); pr.mesh.geometry.dispose(); pr.mesh.material.dispose(); game.projectiles.splice(i, 1); }
  }
}
