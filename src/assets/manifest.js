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
  portal_red:    { url: B + 'effects/portal_red.png', frames: 21, pixel: true },
  portal_yellow: { url: B + 'effects/portal_yellow.png', frames: 21, pixel: true },
  portal_blue:   { url: B + 'effects/portal_blue.png', frames: 21, pixel: true },
  // Animation Pack, coffres et flammes (tools/build_extra_assets.py)
  fx_energyball:   { url: B + 'effects/fx_energyball.png', frames: 9, pixel: true },
  fx_energyimpact: { url: B + 'effects/fx_energyimpact.png', frames: 8, pixel: true },
  fx_hit:          { url: B + 'effects/fx_hit.png', frames: 7, pixel: true },
  fx_explosion:    { url: B + 'effects/fx_explosion.png', frames: 8, pixel: true },
  fx_burn:         { url: B + 'effects/fx_burn.png', frames: 10, pixel: true },
  fx_fireline:     { url: B + 'effects/fx_fireline.png', frames: 7, pixel: true },
  fx_shine:        { url: B + 'effects/fx_shine.png', frames: 6, pixel: true },
  fx_iceburst:     { url: B + 'effects/fx_iceburst.png', frames: 7, pixel: true },
  fx_iceball:      { url: B + 'effects/fx_iceball.png', frames: 4, pixel: true },
  fx_thunder:      { url: B + 'effects/fx_thunder.png', frames: 4, pixel: true },
  fx_crystal:      { url: B + 'effects/fx_crystal.png', frames: 6, pixel: true },
  fx_mirror:       { url: B + 'effects/fx_mirror.png', frames: 5, pixel: true },
  fx_beam:         { url: B + 'effects/fx_beam.png', frames: 7, pixel: true },
  fx_flame:        { url: B + 'effects/fx_flame.png', frames: 35, pixel: true },
  chest_wood:      { url: B + 'effects/chest_wood.png', frames: 7, pixel: true },
  chest_iron:      { url: B + 'effects/chest_iron.png', frames: 7, pixel: true },
  chest_silver:    { url: B + 'effects/chest_silver.png', frames: 7, pixel: true },
  chest_gold:      { url: B + 'effects/chest_gold.png', frames: 7, pixel: true },
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
  forest:   { url: B + 'backgrounds/forest.jpg' },
};
// Atlas de décors (tools/build_decor.py) : rectangles dans assets/decor.js
export const DECOR_ATLAS = {
  mossy:   { url: B + 'decor/mossy.png', pixel: false },
  village: { url: B + 'decor/village.png', pixel: true },
};
