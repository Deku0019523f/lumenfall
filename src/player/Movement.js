import { GRAVITY, MAX_FALL, moveBody, aabb } from '../engine/physics.js';

export const MOVE = {
  speed: 7.5, accel: 60, jumpV: 15.5, jumpCut: 0.45, coyote: 0.1, buffer: 0.12,
  dashSpeed: 20, dashTime: 0.16, dashCooldown: 0.45, wallSlide: -3, wallJumpX: 9,
};

// Met à jour déplacements, sauts, dash et collisions. Retourne les infos de contact.
export function updateMovement(p, input, level, dt, game) {
  const m = MOVE, st = p.stats;
  const locked = p.state === 'hurt';
  const atkSlow = p.attackT > 0 && p.onGround ? 0.45 : 1;

  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.coyoteT > 0) p.coyoteT -= dt;
  if (input.pressed.jump) p.jumpBuf = m.buffer; else if (p.jumpBuf > 0) p.jumpBuf -= dt;

  // Dash / esquive (invincible pendant l'action)
  if (p.onGround) p.airDashes = 0;
  const canAir = p.onGround || p.airDashes < st.airDashes;
  if (input.pressed.dash && p.dashCd <= 0 && p.abilities.dash && p.dashT <= 0 && p.state !== 'hurt' && canAir) {
    if (!p.onGround) p.airDashes++;
    p.attackT = 0; p.hitSet.clear();
    p.dashT = m.dashTime; p.dashCd = st.dashCd; p.invuln = Math.max(p.invuln, m.dashTime + (st.ghost ? 0.25 : 0.05));
    p.dashHit = new Set();
    game?.fx.puff(p.x, p.y, 5); game?.camera.punch(0.015); game?.audio?.sfx('dash');
    p.dashDir = input.axisX !== 0 ? Math.sign(input.axisX) : p.facing;
    p.facing = p.dashDir; p.vy = 0;
  }

  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dashDir * m.dashSpeed;
    p.vy = 0;
    game?.fx.trail(p.x, p.y, p.dashDir);
    if (st.ghost) for (const e of game.enemies) if (!e.dead && !p.dashHit.has(e) && aabb({ x: p.x, y: p.y, w: p.w, h: p.h }, e)) { p.dashHit.add(e); e.hit(1 + st.power, p.dashDir, game, false); game.fx.impact(e.x, e.y + e.h / 2, p.dashDir); game.hitStop = Math.max(game.hitStop || 0, 0.04); }
  } else {
    // Horizontal
    let target = locked ? 0 : input.axisX * st.speed * atkSlow;
    if (p.lungeT > 0) { p.lungeT -= dt; target = p.facing * p.lungeV; }
    const a = m.accel * (p.onGround ? 1 : 0.75) * (p.lungeT > 0 ? 3 : 1);
    if (p.state !== 'hurt') {
      p.vx += Math.sign(target - p.vx) * Math.min(Math.abs(target - p.vx), a * dt);
      if (!locked && p.attackT <= 0 && input.axisX !== 0) p.facing = Math.sign(input.axisX);
    }
    // Gravité (+ glissement sur mur si débloqué)
    p.vy = Math.max(p.vy + GRAVITY * dt, MAX_FALL);
    if (p.abilities.wall && p.touchingWall && !p.onGround && p.vy < m.wallSlide) p.vy = m.wallSlide;
  }

  // Saut / double saut / saut mural
  if (p.jumpBuf > 0 && p.state !== 'hurt') {
    if (p.onGround || p.coyoteT > 0) { game?.audio?.sfx('jump'); p.vy = m.jumpV; p.jumpBuf = 0; p.coyoteT = 0; p.airJumps = 0; }
    else if (p.abilities.wall && p.touchingWall && p.wallDir !== p.lastWallJump && input.axisX * p.wallDir > 0.3) {
      // Saut mural : il faut pousser vers le mur et alterner les côtés (plus de « spam » sur SAUT)
      p.vy = m.jumpV * 0.88; p.vx = -p.wallDir * m.wallJumpX; p.facing = -p.wallDir; p.jumpBuf = 0; p.lastWallJump = p.wallDir;
      game?.fx.puff(p.x + p.wallDir * 0.3, p.y + 0.8, 3);
    }
    else if (p.abilities.doubleJump && p.airJumps < 1) { game?.audio?.sfx('jump'); p.vy = m.jumpV * 0.92; p.airJumps++; p.jumpBuf = 0; }
  }
  if (input.released.jump && p.vy > 0 && p.dashT <= 0) p.vy *= m.jumpCut; // hauteur variable

  p.dropDown = input.axisY < -0.6 && input.down.jump; // descendre des plateformes
  const res = moveBody(p, dt, level);

  p.touchingWall = !p.onGround && (res.hitWallL || res.hitWallR);
  p.wallDir = res.hitWallR ? 1 : res.hitWallL ? -1 : p.wallDir;
  const was = p.onGround;
  p.onGround = res.onGround;
  if (was && !p.onGround && p.vy <= 0) p.coyoteT = m.coyote;
  if (p.onGround) { p.airJumps = 0; p.lastWallJump = 0; }
  if (p.onGround && !was && p.prevVy < -9) { game?.fx.puff(p.x, p.y, 6); }
  p.prevVy = p.vy;
  return res;
}
