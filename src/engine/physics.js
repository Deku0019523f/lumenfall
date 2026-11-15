// Physique AABB simple : les corps ont {x,y,w,h,vx,vy} (x,y = centre bas, y vers le haut).
export const GRAVITY = -42;
export const MAX_FALL = -22;

export function aabb(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && (a.y + a.h / 2) - (b.y + b.h / 2) < (a.h + b.h) / 2 &&
         (b.y + b.h / 2) - (a.y + a.h / 2) < (a.h + b.h) / 2;
}

// Déplace le corps en résolvant les collisions avec la grille de tuiles solides.
// level.isSolid(tx, ty) → bool. Retourne {onGround, hitCeiling, hitWallL, hitWallR}.
export function moveBody(body, dt, level) {
  const res = { onGround: false, hitCeiling: false, hitWallL: false, hitWallR: false };
  const hw = body.w / 2;

  // Axe X
  body.x += body.vx * dt;
  const topY = body.y + body.h - 0.001, botY = body.y + 0.001;
  if (body.vx > 0) {
    const tx = Math.floor(body.x + hw);
    for (let ty = Math.floor(botY); ty <= Math.floor(topY); ty++) {
      if (level.isSolid(tx, ty)) { body.x = tx - hw - 0.0001; body.vx = 0; res.hitWallR = true; break; }
    }
  } else if (body.vx < 0) {
    const tx = Math.floor(body.x - hw);
    for (let ty = Math.floor(botY); ty <= Math.floor(topY); ty++) {
      if (level.isSolid(tx, ty)) { body.x = tx + 1 + hw + 0.0001; body.vx = 0; res.hitWallL = true; break; }
    }
  }

  // Axe Y
  body.y += body.vy * dt;
  const lx = Math.floor(body.x - hw + 0.001), rx = Math.floor(body.x + hw - 0.001);
  if (body.vy <= 0) {
    const ty = Math.floor(body.y);
    for (let tx = lx; tx <= rx; tx++) {
      if (level.isSolid(tx, ty) || (level.isPlatform(tx, ty) && body.prevY >= ty + 1 - 0.001 && !body.dropDown)) {
        body.y = ty + 1; body.vy = 0; res.onGround = true; break;
      }
    }
  } else {
    const ty = Math.floor(body.y + body.h);
    for (let tx = lx; tx <= rx; tx++) {
      if (level.isSolid(tx, ty)) { body.y = ty - body.h - 0.0001; body.vy = 0; res.hitCeiling = true; break; }
    }
  }
  body.prevY = body.y;
  return res;
}
