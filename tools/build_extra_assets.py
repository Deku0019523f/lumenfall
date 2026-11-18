#!/usr/bin/env python3
"""Assets « Utilise tout » : effets de combat, coffres, flammes, cristal, miroir.
Usage : python3 -I tools/build_extra_assets.py <dossier_raw> <dossier_sortie>
<dossier_raw> contient apack/ props/ (zips extraits). Sortie : bandes horizontales dans effects/.
"""
import os, sys
from PIL import Image

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(OUT, 'effects'), exist_ok=True)

def save(S, name):
    S.save(os.path.join(OUT, 'effects', name + '.png'), optimize=True)
    print(f'effects/{name}.png {S.width}x{S.height}')

def cut(path, n, fw, fh, vertical, name):
    im = Image.open(os.path.join(RAW, path)).convert('RGBA')
    S = Image.new('RGBA', (fw * n, fh), (0, 0, 0, 0))
    for i in range(n):
        box = (0, i * fh, fw, (i + 1) * fh) if vertical else (i * fw, 0, (i + 1) * fw, fh)
        S.paste(im.crop(box), (i * fw, 0))
    save(S, name)

A = 'apack/Animation Pack/'
cut(A + 'Energy ball/EnergyBall.png', 9, 128, 128, False, 'fx_energyball')
cut(A + 'Energy ball/energyBallImpact.png', 8, 128, 128, True, 'fx_energyimpact')
cut(A + 'Hit Effect.png', 7, 128, 128, True, 'fx_hit')
cut(A + 'explosioneffect.png', 8, 128, 128, True, 'fx_explosion')
cut(A + 'Fire/Burn.png', 10, 128, 128, True, 'fx_burn')
cut(A + 'Fire/Line of fire.png', 7, 128, 64, True, 'fx_fireline')
cut(A + 'Fire/Shine.png', 6, 64, 64, False, 'fx_shine')
cut(A + 'Ice/Burst of ice.png', 7, 128, 128, True, 'fx_iceburst')
cut(A + 'Ice/Ball of ice.png', 4, 128, 128, True, 'fx_iceball')
cut(A + 'Thunder.png', 4, 128, 256, False, 'fx_thunder')
cut(A + 'Crystal.png', 6, 128, 128, False, 'fx_crystal')
cut(A + 'Magic Mirror.png', 5, 128, 128, True, 'fx_mirror')
cut(A + 'projetilNew.png', 7, 256, 64, True, 'fx_beam')

# Coffres : 4 variantes (bois, fer, argent, or) x 7 images de 64x64 ; une bande par variante
T = 'props/Textures/'
ch = Image.open(os.path.join(RAW, T + 'TX Chest Animation.png')).convert('RGBA')
for r, nm in enumerate(['wood', 'iron', 'silver', 'gold']):
    S = Image.new('RGBA', (64 * 7, 64), (0, 0, 0, 0))
    for i in range(7): S.paste(ch.crop((i * 64, r * 64, (i + 1) * 64, (r + 1) * 64)), (i * 64, 0))
    save(S, 'chest_' + nm)

# Flammes (blanches, teintées dans le jeu) : grille 6x6 de 33 px, images non vides
fl = Image.open(os.path.join(RAW, T + 'TX FX Flame.png')).convert('RGBA')
cells = [fl.crop((c * 33, r * 33, c * 33 + 33, r * 33 + 33)) for r in range(6) for c in range(6)]
cells = [c for c in cells if c.getchannel('A').getbbox()]
S = Image.new('RGBA', (33 * len(cells), 33), (0, 0, 0, 0))
for i, c in enumerate(cells): S.paste(c, (i * 33, 0))
save(S, 'fx_flame'); print('flame frames', len(cells))
