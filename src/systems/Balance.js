import { COMBAT } from '../player/Combat.js';

// ÉQUILIBRAGE — tous les réglages de difficulté au même endroit.
//  hp   : multiplicateur de points de vie (appliqué par-dessus la vie de base de chaque ennemi / boss)
//  size : multiplicateur de taille (corps ET image)
// Avant (v0.5) : le héros frappait toutes les 0,17 s, ennemis minuscules et boss de 48 à 85 PV (tombaient en < 30 s).
export const BALANCE = {
  hero: { atkTime: 0.26 },                 // durée d'un coup, en secondes (plus grand = plus lent)
  enemy: { hp: 2.0, size: 1.4 },           // ennemis ordinaires
  mini: { hp: 3.5, size: 1.25 },           // mini-boss
  boss: { hp: 4.5, size: 1.3 },            // boss de chapitre
};

COMBAT.atkTime = BALANCE.hero.atkTime;

export function applyBalance(e, kind) {
  const b = BALANCE[kind]; if (!e || !b) return e;
  e.hp = Math.max(1, Math.round(e.hp * b.hp)); if (e.maxHp !== undefined) e.maxHp = e.hp;
  const k = b.size; e.w *= k; e.h *= k;
  const upd = e.update.bind(e);
  e.update = (game, dt) => {
    upd(game, dt);
    const m = e.mesh; if (!m) return;
    m.scale.x *= k; m.scale.y *= k;
    m.position.y += (k - 1) * e.scale * (e.sheet ? 0.5 : 0.45);   // les pieds restent au sol
  };
  return e;
}
