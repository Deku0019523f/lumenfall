import { map as map1 } from './chapter1.js';
import { map as map2 } from './chapter2.js';
import { map as map3 } from './chapter3.js';
import { ROOMS as R1 } from './rooms_racines.js';
import { ROOMS as R2 } from './rooms_plaines.js';
import { ROOMS as R3 } from './rooms_village.js';

// Salles de chaque zone (monde interconnecté, voir monde.md) — générées par tools/make_world.py
export const ZONES = { racines: R1, plaines: R2, village: R3 };

// Un chapitre = une zone (salles) + un thème visuel + des ennemis + un boss.
// roster : qui occupe quels emplacements d'ennemis de la carte (lettres c f k h w r) — voir src/enemies/Bestiary.js.
export const CHAPTERS = [
  {
    title: 'Les Racines Mousseuses', subtitle: 'Chapitre 1',
    map: map1,
    theme: { tiles: 'mossy', solid: 0x1a2b22, platform: 0x4a8a5a, spike: '#9be36a', bands: [0x0f1c16, 0x14281e, 0x1b3626], bg: { image: 'forest', tint: 0x4a6a5c } },
    crawler: 'green', hpMul: 1, portal: 'blue',
    roster: { c: ['slime', 'rat', 'rat'], f: ['bat', 'spore'], k: 'cracheur' },
    boss: { name: 'La Gardienne des Racines', strip: 'boss_poison', spriteH: 3.9, hp: 48, w: 2.6, h: 2.8, color: '#2f6b3a', moves: ['roots', 'volley', 'summon', 'charge'] },
    mini: { name: 'Le Gardien du Pont', strip: 'slime_green', spriteH: 2.6, hp: 20, w: 2.0, h: 1.8, color: '#2f6b3a', tint: 0xb6ff8a, shards: 25, moves: ['charge', 'roots'] },
    unlocks: ['dash'], rooms: 'racines', startRoom: 'racines/entree',
  },
  {
    title: 'Les Plaines du Vent', subtitle: 'Chapitre 2',
    map: map2,
    theme: { tiles: 'mond', solid: 0x2b2550, platform: 0x7a6cff, spike: '#ff8a5c', bands: [0x1d2b4a, 0x2a3d63, 0x3b5380], bg: { image: 'windrise', tint: 0xffffff } },
    crawler: 'orange', hpMul: 1.3, portal: 'yellow',
    roster: { c: ['slimeOr', 'rat'], f: ['bat', 'batGrande'], k: ['cracheur', 'verFeu'] },
    boss: { name: 'Le Souffle Ancien', strip: 'boss_wind', spriteH: 3.6, hp: 62, w: 2.4, h: 2.8, color: '#3a8a9a', moves: ['gust', 'blades', 'leap', 'burst', 'charge'] },
    mini: { name: 'La Sentinelle du Vent', strip: 'boss_wind', spriteH: 2.6, hp: 28, w: 1.8, h: 2.0, color: '#3a8a9a', tint: 0xcfefff, shards: 30, moves: ['blades', 'leap'] },
    unlocks: ['wall'], rooms: 'plaines', startRoom: 'plaines/entree',
  },
  {
    title: 'Le Village Oublié', subtitle: 'Chapitre 3',
    map: map3,
    theme: { tiles: 'village', solid: 0x3a2412, platform: 0x8a6a2a, spike: '#ff5577', bands: [0x120d1f, 0x1a1330, 0x261c44], bg: { image: 'windrise', tint: 0x5b5a8a } },
    crawler: 'green', hpMul: 1.6, portal: 'red',
    roster: { c: ['slime', 'rat'], f: ['batGrande', 'bat'], k: ['cracheur', 'verFeu'], h: ['sauteur', 'mimic'] },
    boss: { name: 'Le Roi Gélatine', strip: 'slime_orange', spriteH: 3.4, hp: 85, w: 3.4, h: 2.6, color: '#8a5a1f', tint: 0xffb0b0, moves: ['jump', 'multijump', 'rain', 'summon', 'charge', 'burst'] },
    mini: { name: 'Le Veilleur Gelé', strip: 'slime_orange', spriteH: 2.8, hp: 34, w: 2.2, h: 1.8, color: '#4a6a9a', tint: 0x9fc8ff, shards: 35, moves: ['multijump', 'volley'] },
    unlocks: [], rooms: 'village', startRoom: 'village/place',
  },
];
