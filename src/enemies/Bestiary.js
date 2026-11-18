import { Crawler } from './Crawler.js';
import { Flyer } from './Flyer.js';
import { Spitter, Hopper, Wisp, Brute } from './Variants.js';
import { FireWorm } from './FireWorm.js';
import { Mimic } from './Mimic.js';

// ────────────────────────────────────────────────────────────────────────────────────────
// BESTIAIRE : tous les ennemis ordinaires du jeu, au même endroit.
//   cls   : classe de comportement (IA)           cfg : réglages (taille, vitesse, vie de base, apparence)
//   skin  : { states: {…}, h, fps, fpsBy, faces, fallback }   voir Enemy.js — les clés sont des bandes de manifest.js
//   Si les images d'un ennemi manquent, il retombe sur skin.fallback (ancien sprite) : le jeu n'est jamais bloqué.
// Les lettres de la carte (c f k h w r) désignent un EMPLACEMENT d'ennemi ; chaque chapitre décide qui s'y trouve
// via chapters.js → roster (voir pick() plus bas). Les boss ne sont pas ici (voir src/bosses/).
// ────────────────────────────────────────────────────────────────────────────────────────
const SLIME = { strip: 'slime_green', h: 1.0 };

export const BESTIARY = {
  slime:     { name: 'Slime',            cls: Crawler, args: ['green'] },
  slimeOr:   { name: 'Slime orangé',     cls: Crawler, args: ['orange'] },
  rat: {
    name: 'Rat des racines', cls: Crawler, args: ['green'],
    cfg: { w: 1.1, h: 0.8, hp: 2, speed: 3.2, skin: {
      states: { move: 'rat_run', idle: 'rat_idle', hurt: 'rat_hurt', death: 'rat_death' }, h: 1.0, fps: 14, faces: 'right', fallback: SLIME } },
  },
  spore:     { name: 'Spore volante',    cls: Flyer, args: [] },
  bat: {
    name: 'Chauve-souris', cls: Flyer, args: [],
    cfg: { w: 1.0, h: 0.8, hp: 2, skin: {
      states: { move: 'bat_fly', attack: 'bat_dive', hurt: 'bat_hurt', death: 'bat_die' }, h: 1.8, fps: 12, fallback: { strip: 'spore', h: 1.1 } } },
  },
  batGrande: {
    name: 'Grande chauve-souris', cls: Flyer, args: [],
    cfg: { w: 1.3, h: 1.0, hp: 3, skin: {
      states: { move: 'bat2_fly', attack: 'bat2_attack', hurt: 'bat2_hurt', death: 'bat2_death' }, h: 2.0, fps: 12, faces: 'right', fallback: { strip: 'spore', h: 1.1 } } },
  },
  cracheur:  { name: 'Cracheur',         cls: Spitter, args: [] },
  sauteur:   { name: 'Sauteur',          cls: Hopper, args: [] },
  esprit:    { name: 'Esprit',           cls: Wisp, args: [] },
  brute:     { name: 'Brute',            cls: Brute, args: [] },
  verFeu: {
    name: 'Ver de feu', cls: FireWorm, args: [],
    cfg: { hp: 4, skin: {
      states: { move: 'worm_walk', idle: 'worm_idle', attack: 'worm_attack', hurt: 'worm_hurt', death: 'worm_death' },
      h: 2.0, fps: 10, fpsBy: { attack: 14 }, faces: 'right', fallback: { strip: 'slime_orange', h: 1.2, tint: 0xff7a3a } } },
  },
  mimic: {
    name: 'Mimic', cls: Mimic, args: [],
    cfg: { hp: 7, skin: {
      states: { closed: 'mimic_closed', opening: 'mimic_opening', move: 'mimic_walk', attack: 'mimic_attack', hurt: 'mimic_hurt', death: 'mimic_death' },
      h: 2.0, fps: 10, fpsBy: { attack: 16 }, faces: 'right', fallback: { strip: 'slime_orange', h: 1.2, tint: 0xc58a3a } } },
  },
};

// Roster par défaut : qui occupe chaque lettre de la carte quand le chapitre ne dit rien.
export const DEFAULT_ROSTER = { c: 'slime', f: 'spore', k: 'cracheur', h: 'sauteur', w: 'esprit', r: 'brute' };
export const ENEMY_LETTERS = Object.keys(DEFAULT_ROSTER).join('');

// Choix déterministe (pas d'aléatoire : même carte → mêmes ennemis) dans une liste « id » ou « [id, id…] ».
function pick(entry, x, y) {
  if (!Array.isArray(entry)) return entry;
  const h = Math.abs(Math.floor(x * 7 + y * 13)) % entry.length;
  return entry[h];
}

// Crée l'ennemi de la lettre `letter` à (x, y). ch = le chapitre (hpMul, roster, crawler).
export function spawnEnemy(letter, game, x, y, ch) {
  const roster = { ...DEFAULT_ROSTER, ...(ch.roster || {}) };
  let id = pick(roster[letter], x, y);
  if (letter === 'c' && !ch.roster?.c && ch.crawler === 'orange') id = 'slimeOr'; // compatibilité : ancien réglage
  const def = BESTIARY[id] || BESTIARY[DEFAULT_ROSTER[letter]];
  const m = ch.hpMul ?? 1;
  const e = def.cls === Crawler ? new Crawler(game, x, y, def.args[0], m, def.cfg)
    : new def.cls(game, x, y, m, def.cfg);
  e.bestiaryId = id;
  if (def.cls === Crawler || def.cls === Flyer) e.shardValue = Math.round(2 * m);
  return e;
}
