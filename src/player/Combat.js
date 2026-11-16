import * as THREE from 'three';
import { aabb } from '../engine/physics.js';

export const COMBAT = {
  atkTime: 0.17, comboWindow: 0.45, chargeTime: 0.45, chargedTime: 0.28, buffer: 0.18,
  specialCost: 3, novaCost: 4, projSpeed: 17, pogo: 12,
};

// Hitbox rectangulaire devant/au-dessus/au-dessous du joueur (y = bas de la boîte).
function hitbox(p, kind) {
  if (kind === 'up') return { x: p.x, y: p.y + p.h - 0.3, w: 1.8, h: 1.6 };
  if (kind === 'down') return { x: p.x, y: p.y - 1.5, w: 1.5, h: 1.6 };
  const fin = p.attackFinisher;
  const reach = kind === 'charged' ? 3.6 : fin ? 3.0 : 2.2;
  const hh = kind === 'charged' ? 2.1 : fin ? 1.7 : 1.4;
  return { x: p.x + p.facing * (reach / 2 + p.w / 2 - 0.1), y: p.y + 0.9 - hh / 2, w: reach, h: hh };
}

function onKill(p, game, e) {
  game.hitStop = Math.max(game.hitStop || 0, 0.12);
  game.camera.shake(0.35, 0.2); game.camera.punch(0.07);
  game.fx.ring(e.x, e.y + e.h / 2, 0xb59bff, 4, 0.4);
}

function strike(p, game, kind, dmg) {
  const hb = hitbox(p, kind);
  let hitAny = false;
  const heavy = kind === 'charged' || p.attackFinisher;
  for (const e of game.enemies) {
    if (e.dead || p.hitSet.has(e)) continue;
    if (!aabb(hb, e)) continue;
    p.hitSet.add(e);
    const dir = Math.sign(e.x - p.x) || p.facing;
    e.hit(dmg, dir, game, heavy);
    const cx = e.x, cy = e.y + e.h / 2;
    game.fx.impact(cx, cy, dir, heavy);
    game.fx.number(cx, cy + e.h / 2 + 0.3, dmg, heavy ? '#ffd24a' : '#ffffff', heavy);
    p.energy = Math.min(p.maxEnergy, p.energy + 1);
    p.hitCount = (p.hitCount || 0) + 1;
    if (p.stats.vampire && p.hitCount % 6 === 0 && p.hp < p.maxHp) { p.hp++; game.fx.ring(p.x, p.y + 1, 0xff7aa8, 3, 0.4); game.say?.('+1 vie'); }
    game.hitStop = Math.max(game.hitStop || 0, heavy ? 0.075 : 0.04);
    game.camera.shake(heavy ? 0.3 : 0.13, 0.12); game.camera.punch(heavy ? 0.05 : 0.02);
    if (e.dead) onKill(p, game, e);
    hitAny = true;
  }
  if (hitAny && kind === 'down') { p.vy = COMBAT.pogo; p.airJumps = 0; p.airDashes = 0; }
  if (hitAny && kind === 'front' && !p.onGround) p.vy = Math.max(p.vy, 3); // léger soutien en l'air
  return hitAny;
}

function startAttack(p, game, kind, charged, input) {
  const C = COMBAT, st = p.stats;
  const maxCombo = st.combo4 ? 4 : 3;
  let dmg = 1 + st.power;
  p.attackFinisher = false;
  if (charged) {
    kind = 'charged'; dmg = 3 + st.power; p.attackT = C.chargedTime / st.atkSpeed;
  } else {
    p.comboIdx = p.comboT > 0 ? (p.comboIdx + 1) % maxCombo : 0;
    if (kind === 'front' && p.comboIdx === maxCombo - 1) { p.attackFinisher = true; dmg += 1; }
    p.attackT = C.atkTime / st.atkSpeed * (p.attackFinisher ? 1.25 : 1);
    p.comboT = C.comboWindow;
  }
  p.attackKind = kind; p.attackDmg = dmg; p.hitSet.clear(); p.chargeT = 0;
  p.attackAnim = 0;
  // Fente vers l'avant (au sol)
  if (kind === 'front' || kind === 'charged') {
    if (input.axisX !== 0) p.facing = Math.sign(input.axisX);
    if (p.onGround) { p.lungeT = 0.1; p.lungeV = charged ? 13 : p.attackFinisher ? 11 : 7.5; }
  }
  const heavy = charged || p.attackFinisher;
  game.fx.slash(p, kind === 'charged' ? 'front' : kind, charged ? 1.5 : p.attackFinisher ? 1.25 : 1,
    charged ? 0x6ee7ff : p.attackFinisher ? 0xffe9a0 : 0xdff6ff, heavy);
  if (heavy) { game.camera.shake(0.18, 0.12); game.camera.punch(0.03); }
  if (charged && st.wave) fireProj(p, game, { dmg: 2 + st.power, color: 0x6ee7ff, size: 1.6, speed: 15, pierce: true });
}

function fireProj(p, game, { dmg, color, size = 1, speed = COMBAT.projSpeed, pierce = false }) {
  const m = new THREE.Mesh(game.fx.plane, new THREE.MeshBasicMaterial({
    map: game.fx.texGlow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  m.scale.set(1.1 * size, 1.1 * size, 1);
  m.position.set(p.x + p.facing * 0.8, p.y + 1, 3);
  game.scene.add(m);
  game.projectiles.push({ mesh: m, x: m.position.x, y: m.position.y, w: 0.7 * size, h: 0.7 * size, vx: p.facing * speed, life: 1.2, dmg, pierce, color, hit: new Set() });
}

function nova(p, game) {
  const C = COMBAT, R = 3.5;
  p.energy -= C.novaCost;
  game.fx.ring(p.x, p.y + 0.9, 0xffe9a0, R * 2.2, 0.45); game.fx.ring(p.x, p.y + 0.9, 0xffffff, R * 1.5, 0.3);
  game.fx.glow(p.x, p.y + 0.9, 0xffe9a0, R * 1.6, 0.35, 1.3);
  game.fx.sparks(p.x, p.y + 0.9, 0xffe9a0, 18, 12);
  game.camera.shake(0.45, 0.25); game.camera.punch(0.08); game.hitStop = Math.max(game.hitStop || 0, 0.06);
  for (const e of game.enemies) {
    if (e.dead) continue;
    if (Math.hypot(e.x - p.x, (e.y + e.h / 2) - (p.y + 0.9)) <= R + e.w / 2) {
      const d = 3 + p.stats.power;
      e.hit(d, Math.sign(e.x - p.x) || 1, game, true);
      game.fx.impact(e.x, e.y + e.h / 2, Math.sign(e.x - p.x) || 1, true, 0xffe9a0);
      game.fx.number(e.x, e.y + e.h + 0.3, d, '#ffd24a', true);
      if (e.dead) onKill(p, game, e);
    }
  }
  p.invuln = Math.max(p.invuln, 0.3);
}

export function updateCombat(p, input, game, dt) {
  const C = COMBAT, st = p.stats;
  if (p.comboT > 0) { p.comboT -= dt; if (p.comboT <= 0) p.comboIdx = 0; }
  if (p.atkBuf > 0) p.atkBuf -= dt;
  if (input.pressed.attack) { p.atkBuf = C.buffer; p.chargeT = 0; }
  if (p.attackT > 0) p.attackAnim += dt;

  // Charge : maintenir après le coup
  if (input.down.attack && p.attackT <= 0 && p.state !== 'hurt') p.chargeT += dt;
  else if (!input.down.attack) { /* géré au relâchement */ }

  // Coup actif : touche dès la première image
  if (p.attackT > 0) {
    p.attackT -= dt;
    strike(p, game, p.attackKind, p.attackDmg);
    if (p.attackT <= 0) p.hitSet.clear();
  }

  // Lancer : à l'appui (buffer) ; relâchement après charge → coup chargé
  if (p.attackT <= 0 && p.state !== 'hurt') {
    if (input.released.attack && p.chargeT >= C.chargeTime) { startAttack(p, game, 'front', true, input); p.atkBuf = 0; }
    else if (p.atkBuf > 0) {
      let kind = 'front';
      if (input.axisY > 0.6) kind = 'up'; else if (input.axisY < -0.6 && !p.onGround) kind = 'down';
      p.atkBuf = 0; startAttack(p, game, kind, false, input);
    }
  }
  if (input.released.attack) p.chargeT = 0;

  // Spéciale : projectile ; bas + spéciale = nova (si compétence)
  if (input.pressed.special && p.state !== 'hurt') {
    if (st.nova && input.axisY < -0.6 && p.energy >= C.novaCost) nova(p, game);
    else if (p.energy >= C.specialCost) {
      p.energy -= C.specialCost;
      fireProj(p, game, { dmg: 2 + st.power, color: 0x6ee7ff });
      game.fx.glow(p.x + p.facing * 0.8, p.y + 1, 0x6ee7ff, 1.8, 0.2);
      p.vx -= p.facing * 3; game.camera.shake(0.1, 0.1);
    }
  }

  // Projectiles (avec traînée)
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const pr = game.projectiles[i];
    pr.x += pr.vx * dt; pr.life -= dt;
    pr.mesh.position.x = pr.x;
    pr.mesh.scale.setScalar(pr.mesh.scale.x * (1 + Math.sin(pr.life * 40) * 0.01));
    if (Math.random() < 0.7) game.fx.burst(pr.x, pr.y, pr.color, 1, 1.5);
    const box = { x: pr.x, y: pr.y - pr.h / 2, w: pr.w, h: pr.h };
    let dead = pr.life <= 0 || game.level.isSolid(Math.floor(pr.x), Math.floor(pr.y));
    for (const e of game.enemies) {
      if (e.dead || pr.hit.has(e) || !aabb(box, e)) continue;
      pr.hit.add(e);
      const dir = Math.sign(pr.vx);
      e.hit(pr.dmg, dir, game, true);
      game.fx.impact(pr.x, pr.y, dir, true, pr.color);
      game.fx.number(e.x, e.y + e.h + 0.3, pr.dmg, '#8fe9ff', true);
      game.hitStop = Math.max(game.hitStop || 0, 0.05); game.camera.shake(0.2, 0.12);
      if (e.dead) onKill(p, game, e);
      if (!pr.pierce) { dead = true; break; }
    }
    if (dead) { game.scene.remove(pr.mesh); pr.mesh.material.dispose(); game.projectiles.splice(i, 1); }
  }
}
