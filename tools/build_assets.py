#!/usr/bin/env python3
"""Convertit les packs d'assets bruts (zips extraits) en feuilles de sprites légères pour Lumenfall.
Usage : python3 -I tools/build_assets.py <dossier_raw> <dossier_sortie>
<dossier_raw> contient : wizard/ slimes/ plants/ mossy/ mond/ props/ (zips extraits, voir RAPPORT.md).
Sortie : bandes horizontales (frames côte à côte), le nombre de frames est déclaré dans src/assets/manifest.js.
"""
import glob, os, sys
from PIL import Image

RAW, OUT = sys.argv[1], sys.argv[2]

def frames(pattern, step=1):
    return sorted(glob.glob(os.path.join(RAW, pattern)))[::step]

def union_bbox(files):
    x0 = y0 = 10**9; x1 = y1 = 0
    for f in files:
        b = Image.open(f).convert('RGBA').getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if b: x0 = min(x0, b[0]); y0 = min(y0, b[1]); x1 = max(x1, b[2]); y1 = max(y1, b[3])
    return (x0, y0, x1, y1)

def strip(files, out, scale, box=None):
    box = box or union_bbox(files)
    w = max(1, round((box[2] - box[0]) * scale)); h = max(1, round((box[3] - box[1]) * scale))
    S = Image.new('RGBA', (w * len(files), h), (0, 0, 0, 0))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGBA').crop(box).resize((w, h), Image.LANCZOS)
        S.paste(im, (i * w, 0))
    os.makedirs(os.path.dirname(os.path.join(OUT, out)), exist_ok=True)
    S.save(os.path.join(OUT, out), optimize=True)
    print(f'{out}: {len(files)} frames de {w}x{h}')
    return box

# --- Héros : cadre commun pour que toutes les animations s'alignent (pieds au même endroit)
W = 'wizard/BlueWizard/'
hero = frames(W + '2BlueWizardIdle/*.png', 2) + frames(W + '2BlueWizardWalk/*.png', 2) + \
       frames(W + '2BlueWizardJump/*.png') + frames(W + '2BlueWizardJump/Dash2/*.png', 2)
box = union_bbox(hero)
strip(frames(W + '2BlueWizardIdle/*.png', 2), 'characters/hero_idle.png', 0.5, box)
strip(frames(W + '2BlueWizardWalk/*.png', 2), 'characters/hero_walk.png', 0.5, box)
strip(frames(W + '2BlueWizardJump/*.png'), 'characters/hero_jump.png', 0.5, box)
strip(frames(W + '2BlueWizardJump/Dash2/*.png', 2), 'characters/hero_dash.png', 0.5, box)

# --- Ennemis
strip(frames('slimes/SlimeGreen/*.png', 2), 'enemies/slime_green.png', 0.5)
strip(frames('slimes/SlimeOrange/*.png', 2), 'enemies/slime_orange.png', 0.35)
strip(frames('plants/Plant Animations/PlantJump/*.png'), 'enemies/spore.png', 0.4)
strip(frames('plants/Plant Animations/Plant 8 Poison/*.png', 2), 'enemies/boss_poison.png', 0.5)
strip(frames('plants/Plant Animations/Plant Wind 1/*.png', 2), 'enemies/boss_wind.png', 0.5)

# --- Décors animés
strip(frames('plants/Plant Animations/Plant 1/*.png', 3), 'effects/plant1.png', 0.4)
strip(frames('plants/Plant Animations/Plant 4/*.png', 3), 'effects/plant4.png', 0.4)
strip(frames('plants/Plant Animations/BlueFlower1/*.png', 3), 'effects/blueflower.png', 0.25)

# --- Tilesets en 9 tranches (3x3 : coins, bords, centre), chaque tranche redimensionnée à 64 px
def ninepatch(src, cells, cell, out, nearest=False):
    im = Image.open(src).convert('RGBA')
    S = Image.new('RGBA', (192, 192), (0, 0, 0, 0))
    for k, (cx, cy) in enumerate(cells):
        t = im.crop((cx * cell, cy * cell, (cx + 1) * cell, (cy + 1) * cell))
        t = t.resize((64, 64), Image.NEAREST if nearest else Image.LANCZOS)
        S.paste(t, ((k % 3) * 64, (k // 3) * 64))
    S.save(os.path.join(OUT, out), optimize=True); print(out)

os.makedirs(os.path.join(OUT, 'maps'), exist_ok=True)
# ordre : HG, H, HD, G, C, D, BG, B, BD
ninepatch(os.path.join(RAW, 'mossy/Mossy Tileset/Mossy - TileSet.png'), [(0,0),(2,0),(5,0),(0,2),(2,2),(5,2),(0,5),(2,5),(5,5)], 256, 'maps/tiles_mossy.png')
MD = os.path.join(RAW, 'mond/x_Mondstadt Tileset Platform - Basic/Mondstadt Tileset Platform - Basic/')
ninepatch(MD + 'basic.png', [(0,1),(1,1),(8,1),(0,3),(1,2),(8,3),(0,6),(1,6),(8,6)], 32, 'maps/tiles_mond.png', nearest=True)
ninepatch(os.path.join(RAW, 'props/Textures/TX Tileset Ground.png'), [(0,0),(1,0),(2,0),(0,1),(1,1),(2,1),(0,2),(1,2),(2,2)], 32, 'maps/tiles_village.png', nearest=True)

# --- Fond ciel (parallaxe) : JPEG pour rester léger
bg = Image.open(MD + 'windrise-background.png').convert('RGB').resize((1024, 384), Image.LANCZOS)
bg.save(os.path.join(OUT, 'backgrounds/windrise.jpg'), quality=82, optimize=True); print('backgrounds/windrise.jpg')
