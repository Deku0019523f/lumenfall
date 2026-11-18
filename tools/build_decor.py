#!/usr/bin/env python3
"""Atlas de décors : Mossy (découpés par composantes connexes) + accessoires du village (rects Unity).
Usage : python3 -I tools/build_decor.py <dossier_raw> <dossier_sortie> <props_rects.json>
Écrit assets/decor/mossy.png, assets/decor/village.png et src/assets/decor.js (rectangles).
"""
import json, os, sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

RAW, OUT, RECTS = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(os.path.join(OUT, 'decor'), exist_ok=True)

def pack(items, width, name):
    x = y = rowh = 0; rects = {}; place = []
    for k, im in items:
        if x + im.width > width: x = 0; y += rowh + 2; rowh = 0
        place.append((im, x, y)); rects[k] = [x, y, im.width, im.height]; x += im.width + 2; rowh = max(rowh, im.height)
    S = Image.new('RGBA', (width, y + rowh), (0, 0, 0, 0))
    for im, px, py in place: S.paste(im, (px, py))
    S.save(os.path.join(OUT, 'decor', name + '.png'), optimize=True); print(name, S.size)
    return rects

# --- Mossy : (feuille, indice de composante) -> nom
M = os.path.join(RAW, 'mossy/Mossy Tileset/Mossy - %s.png')
WANT = {'Hanging Plants': {0: 'vine1', 1: 'vine2', 7: 'vine3', 8: 'vine4', 6: 'leaf'},
        'Decorations&Hazards': {3: 'thorn1', 4: 'thorn2', 7: 'thorn3', 0: 'rock1', 1: 'rock2', 2: 'rock3',
                                13: 'plant1', 14: 'plant2', 15: 'plant3', 23: 'plant4', 24: 'plant5', 26: 'plant6'},
        'FloatingPlatforms': {0: 'moss1', 5: 'moss2', 7: 'moss3'}}
items = []
for sheet, wanted in WANT.items():
    im = Image.open(M % sheet).convert('RGBA'); a = np.array(im)[:, :, 3] > 8
    lab, k = ndi.label(ndi.binary_dilation(a, iterations=3))
    boxes = ndi.find_objects(lab)
    for i, nm in wanted.items():
        o = boxes[i]; c = im.crop((o[1].start, o[0].start, o[1].stop, o[0].stop))
        sc = 160 / max(c.size); c = c.resize((max(1, round(c.width * sc)), max(1, round(c.height * sc))), Image.LANCZOS)
        items.append((nm, c))
mossy = pack(items, 1024, 'mossy')

# --- Village : accessoires choisis (coordonnées Unity : y depuis le bas)
VP = Image.open(os.path.join(RAW, 'props/Textures/TX Village Props.png')).convert('RGBA'); H = VP.height
rects = {r[0].replace('TX Village Props - ', ''): r[1:] for r in json.load(open(RECTS))}
KEEP = ['Barrel', 'Crate Large', 'Crate Small', 'Pot 01', 'Pot 02', 'Pot 03', 'Well', 'Scarecrow', 'Gravestone 02', 'Gravestone 03', 'Gravestone 04',
        'Bush 02', 'Bush 03', 'Tree 02', 'Statue', 'Sunflower 01', 'Sunflower 02', 'Sunflower 03', 'Pumpkin 01', 'Pumpkin 02', 'Rock 02', 'Hay Bale',
        'Weapon Rack', 'Training Dummy', 'Banner Pillar', 'Sign 01', 'Road Lamp Pillar', 'Road Lamp Light On', 'Campfire', 'Fire Bowl', 'Torch',
        'Stone of Recall', 'Wood Logs', 'Log Bench', 'Stump', 'Gunny Bag 01', 'Grass 02', 'Grass 05']
vi = []
for k in KEEP:
    x, y, w, h = rects[k]; vi.append((k.replace(' ', '_'), VP.crop((int(x), int(H - y - h), int(x + w), int(H - y)))))
village = pack(vi, 512, 'village')
js = '// Généré par tools/build_decor.py : rectangles [x, y, w, h] (px, origine en haut à gauche) des atlas decor/mossy.png et decor/village.png\n'
js += 'export const MOSSY = ' + json.dumps(mossy) + ';\nexport const VILLAGE = ' + json.dumps(village) + ';\n'
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src/assets/decor.js'), 'w').write(js)
