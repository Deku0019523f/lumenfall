#!/usr/bin/env python3
"""Pack « Dark Fantasy Enemies FREE » : chauve-souris -> bandes horizontales 64x64 (pixel:true).
Usage : python3 tools/build_bat.py "<dossier DarkFantasyEnemies_FREE/Bat/Bat with VFX>" [sortie=assets/enemies]"""
import sys, os
from PIL import Image
src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else 'assets/enemies'
os.makedirs(out, exist_ok=True)
for name, f in {'fly': 'Bat-IdleFly', 'dive': 'Bat-Attack1', 'hurt': 'Bat-Hurt', 'die': 'Bat-Die'}.items():
    im = Image.open(os.path.join(src, f + '.png')).convert('RGBA')
    im.save(os.path.join(out, f'bat_{name}.png')); print(f'bat_{name}.png', im.width // 64, 'frames')
