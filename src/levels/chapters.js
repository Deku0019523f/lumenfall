import { map as map1 } from './chapter1.js';
import { map as map2 } from './chapter2.js';
import { map as map3 } from './chapter3.js';

// Un chapitre = une carte + un thème visuel + des ennemis + un boss.
// Pour ajouter un chapitre : tools/make_maps.py (carte) → une entrée ici → c'est tout.
export const CHAPTERS = [
  {
    title: 'Les Racines Mousseuses', subtitle: 'Chapitre 1',
    map: map1,
    theme: { tiles: 'mossy', solid: 0x1a2b22, platform: 0x4a8a5a, spike: '#9be36a', bands: [0x0f1c16, 0x14281e, 0x1b3626], bg: { image: 'windrise', tint: 0x3d6a52 } },
    crawler: 'green', hpMul: 1,
    boss: { name: 'La Gardienne des Racines', strip: 'boss_poison', spriteH: 3.9, hp: 40, w: 2.6, h: 2.8, color: '#2f6b3a' },
    unlocks: ['dash'],
  },
  {
    title: 'Les Plaines du Vent', subtitle: 'Chapitre 2',
    map: map2,
    theme: { tiles: 'mond', solid: 0x2b2550, platform: 0x7a6cff, spike: '#ff8a5c', bands: [0x1d2b4a, 0x2a3d63, 0x3b5380], bg: { image: 'windrise', tint: 0xffffff } },
    crawler: 'orange', hpMul: 1.3,
    boss: { name: 'Le Souffle Ancien', strip: 'boss_wind', spriteH: 3.6, hp: 55, w: 2.4, h: 2.8, color: '#3a8a9a' },
    unlocks: ['wall'],
  },
  {
    title: 'Le Village Oublié', subtitle: 'Chapitre 3',
    map: map3,
    theme: { tiles: 'village', solid: 0x3a2412, platform: 0x8a6a2a, spike: '#ff5577', bands: [0x120d1f, 0x1a1330, 0x261c44], bg: { image: 'windrise', tint: 0x5b5a8a } },
    crawler: 'green', hpMul: 1.6,
    boss: { name: 'Le Roi Gélatine', strip: 'slime_orange', spriteH: 3.4, hp: 75, w: 3.4, h: 2.6, color: '#8a5a1f', tint: 0xffb0b0 },
    unlocks: [],
  },
];
