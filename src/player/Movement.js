import { GRAVITY, MAX_FALL, moveBody } from '../engine/physics.js';

export const MOVE = {
  speed: 7.5, accel: 60, jumpV: 15.5, jumpCut: 0.45, coyote: 0.1, buffer: 0.12,
  dashSpeed: 20, dashTime: 0.16, dashCooldown: 0.45, wallSlide: -3, wallJumpX: 9,
};

// Met à jour déplacements, sauts, dash et collisions. Retourne les infos de contact.
export function updateMovement(p, input, level, dt) {
  const m = MOVE;
  const locked = p.state === 'hurt' || p.attackLock > 0 && p.onGround;

  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.coyoteT > 0) p.coyoteT -= dt;
  if (input.pressed.jump) p.jumpBuf = m.buffer; else if (p.jumpBuf > 0) p.jumpBuf -= dt;

  // Dash / esquive (invincible pendant l'action)
  if (input.pressed.dash && p.dashCd <= 0 && p.abilities.dash && p.dashT <= 0 && p.state !== 'hurt') {
    p.dashT = m.dashTime; p.dashCd = m.dashCooldown; p.invuln = Math.max(p.invuln, m.dashTime + 0.05);
    p.dashDir = input.axisX !== 0 ? Math.sign(input.axisX) : p.facing;
    p.facing = p.dashDir; p.vy = 0;
  }

  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dashDir * m.dashSpeed;
    p.vy = 0;
  } else {
    // Horizontal
    const target = locked ? 0 : input.axisX * m.speed;
    const a = m.accel * (p.onGround ? 1 : 0.75);
    if (p.state !== 'hurt') {
      p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), a * dt);
      if (!locked && input.axisX !== 0) p.facing = Math.sign(input.axisX);
    }
    // Gravité (+ glissement sur mur si débloqué)
    p.vy = Math.max(p.vy + GRAVITY * dt, MAX_FALL);
    if (p.abilities.wall && p.touchingWall && !p.onGround && p.vy < m.wallSlide) p.vy = m.wallSlide;
  }

  // Saut / double saut / saut mural
  if (p.jumpBuf > 0 && p.state !== 'hurt') {
    if (p.onGround || p.coyoteT > 0) { p.vy = m.jumpV; p.jumpBuf = 0; p.coyoteT = 0; p.airJumps = 0; }
    else if (p.abilities.wall && p.touchingWall) { p.vy = m.jumpV; p.vx = -p.wallDir * m.wallJumpX; p.facing = -p.wallDir; p.jumpBuf = 0; }
    else if (p.abilities.doubleJump && p.airJumps < 1) { p.vy = m.jumpV * 0.92; p.airJumps++; p.jumpBuf = 0; }
  }
  if (input.released.jump && p.vy > 0 && p.dashT <= 0) p.vy *= m.jumpCut; // hauteur variable

  p.dropDown = input.axisY < -0.6 && input.down.jump; // descendre des plateformes
  const res = moveBody(p, dt, level);

  p.touchingWall = !p.onGround && (res.hitWallL || res.hitWallR);
  p.wallDir = res.hitWallR ? 1 : res.hitWallL ? -1 : p.wallDir;
  const was = p.onGround;
  p.onGround = res.onGround;
  if (was && !p.onGround && p.vy <= 0) p.coyoteT = m.coyote;
  if (p.onGround) p.airJumps = 0;
  return res;
}
