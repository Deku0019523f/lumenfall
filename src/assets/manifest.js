// Bandes de sprites (frames côte à côte) générées par tools/build_assets.py.
// Si un fichier est absent (ex. images pas encore envoyées sur GitHub), le jeu retombe sur des sprites dessinés par code.
const B = './assets/';
// Héros « Hooded Seeker » (Primitive Pixels, palette Void) : feet = point d'appui (px) ; fps de lecture
export const SEEKER = {
  idle:   { frames: 24, fw: 30, fh: 30, feet: [15, 28], fps: 10 },
  run:    { frames: 10, fw: 30, fh: 30, feet: [17, 28], fps: 14 },
  jump:   { frames: 28, fw: 30, fh: 30, feet: [16, 28], fps: 0 },
  attack: { frames: 8,  fw: 90, fh: 50, feet: [16, 38], fps: 26 },
  hurt:   { frames: 9,  fw: 55, fh: 80, feet: [26, 52], fps: 16 },
  death:  { frames: 20, fw: 40, fh: 50, feet: [20, 48], fps: 12 },
};
export const STRIPS = {
  ...Object.fromEntries(Object.entries(SEEKER).map(([k, v]) => ['seeker_' + k, { url: B + `characters/seeker_${k}.png`, frames: v.frames, pixel: true }])),
  hero_idle:   { url: B + 'characters/hero_idle.png', frames: 10 },
  hero_walk:   { url: B + 'characters/hero_walk.png', frames: 10 },
  hero_jump:   { url: B + 'characters/hero_jump.png', frames: 8 },
  hero_dash:   { url: B + 'characters/hero_dash.png', frames: 8 },
  slime_green:  { url: B + 'enemies/slime_green.png', frames: 15 },
  slime_orange: { url: B + 'enemies/slime_orange.png', frames: 15 },
  spore:        { url: B + 'enemies/spore.png', frames: 20 },
  boss_poison:  { url: B + 'enemies/boss_poison.png', frames: 15 },
  boss_wind:    { url: B + 'enemies/boss_wind.png', frames: 15 },
  plant1:      { url: B + 'effects/plant1.png', frames: 30 },
  plant4:      { url: B + 'effects/plant4.png', frames: 20 },
  blueflower:  { url: B + 'effects/blueflower.png', frames: 20 },
};
// Tilesets 3x3 (coins, bords, centre) : chaque tranche fait 64 px
export const TILES = {
  mossy:   { url: B + 'maps/tiles_mossy.png', pixel: false },
  mond:    { url: B + 'maps/tiles_mond.png', pixel: true },
  village: { url: B + 'maps/tiles_village.png', pixel: true },
};
export const BACKGROUNDS = {
  windrise: { url: B + 'backgrounds/windrise.jpg' },
};
