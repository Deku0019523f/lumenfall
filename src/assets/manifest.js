// Bandes de sprites (frames côte à côte) générées par tools/build_assets.py.
// Si un fichier est absent (ex. images pas encore envoyées sur GitHub), le jeu retombe sur des sprites dessinés par code.
const B = './assets/';
export const STRIPS = {
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
