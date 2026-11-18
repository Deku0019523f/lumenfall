#!/usr/bin/env python3
"""Convertit le pack « Bot Wheel » (avatar de l'Ombre Éternelle) en bandes horizontales.
Usage : python3 tools/build_botwheel.py "<dossier Bot Wheel>" [sortie=assets/enemies]
Feuilles sources : verticales, cellules 117x26 px (le corps occupe les 39 px de gauche, les FX débordent).
Sortie : ombre_<anim>.png = N cellules 117x26 côte à côte (manifest : pixel:true)."""
import sys, os
from PIL import Image
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'assets/enemies'
CW, CH = 117, 26
MAP = {  # nom de sortie : fichier source
  'idle': 'static idle.png', 'wake': 'wake.png', 'move': 'move with FX.png',
  'charge': 'charge.png', 'shoot': 'shoot with FX.png', 'dash': 'GAS dash with FX.png',
  'hurt': 'damaged.png', 'death': 'death.png',
}
os.makedirs(out, exist_ok=True)
for name, f in MAP.items():
    im = Image.open(os.path.join(src, f)).convert('RGBA')
    n = im.height // CH
    strip = Image.new('RGBA', (CW * n, CH))
    for i in range(n):
        strip.paste(im.crop((0, i * CH, CW, (i + 1) * CH)), (i * CW, 0))
    strip.save(os.path.join(out, f'ombre_{name}.png'))
    print(f'ombre_{name}.png', n, 'frames')
