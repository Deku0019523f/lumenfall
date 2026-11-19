#!/usr/bin/env python3
"""Génère src/levels/rooms_racines.js : les SALLES de la zone des Racines Mousseuses (jalon 1 du monde interconnecté, voir monde.md).
Réutilise les segments de tools/make_maps.py (Map, Gen). Usage : python3 tools/make_rooms.py
Une salle = une carte ASCII (RLE) + position gx/gy sur la carte du monde + sorties : {side:'E'|'W', y0, y1, to}.
y0 = hauteur (tuiles) où se tient le joueur à la sortie ; y1 = dernière rangée ouverte. Sorties basses : y 2..5 ; sorties hautes (branches) : y 11..14."""
import os, re, json
_here = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(_here, 'make_maps.py'), encoding='utf-8').read().split("build('chapter1'")[0]
NS = {'__file__': os.path.join(_here, 'make_maps.py'), '__name__': 'make_maps_defs'}
exec(compile(_src, 'make_maps.py', 'exec'), NS)
Gen = NS['Gen']

MIX = {'c': .55, 'f': .2, 'k': .15, 'h': .1}
LOW, HIGH = (2, 5), (11, 14)

def finish(g, ladder=False, start=False):
    """Termine la salle : sol au niveau 2 jusqu'au mur droit ; échelle de plateformes vers la sortie haute (E) si ladder."""
    if ladder:
        g.run(22, enemies=False, top=2, spike_ok=False)
        W = g.x + 1; m = g.m
        for (r, a, b) in ((4, 17, 14), (6, 13, 10), (8, 9, 6), (10, 5, 2)):
            m.plat(W - a, W - b, r)
    else:
        g.run(8, enemies=False, top=2, spike_ok=False)
        W = g.x + 1
    return W

def emit(rid, g, W, exits, gx, gy):
    m = g.m; m.w = W
    m.g = [row[:W] for row in m.g]
    for y in range(m.h): m.g[y][W - 1] = '#'
    for (side, (y0, y1)) in exits:
        x = 0 if side == 'W' else W - 1
        for y in range(y0, y1 + 1): m.g[y][x] = '.'
    rows = m.text(); assert len({len(r) for r in rows}) == 1
    for y in range(m.h):
        for x in range(W):
            c = m.g[y][x]
            if c in 'cSNMBCDWkhrTt': assert y > 0 and m.g[y - 1][x] in '#=', (rid, c, x, y)
    return {'rows': rows, 'w': W, 'gx': gx, 'gy': gy}

def mk(seed, spikes=False):
    return Gen(seed, 400, mix=MIX, spikes=spikes)

rooms = {}
g = mk(101); g.run(18, enemies=False, top=2, spike_ok=False); g.m.g[2][3] = 'P'; g.m.g[2][7] = 'S'; g.m.g[2][12] = 'N'; g.run(16)
rooms['r01'] = emit('r01', g, finish(g), [('E', LOW)], 0, 0)
g = mk(102); g.run(14); g.gap(3); g.run(12); g.gap(2); g.run(14)
rooms['r02'] = emit('r02', g, finish(g), [('W', LOW), ('E', LOW)], 1, 0)
g = mk(103); g.run(8, enemies=False, top=2, spike_ok=False); g.cave(); g.run(8)
rooms['r03'] = emit('r03', g, finish(g, ladder=True), [('W', LOW), ('E', LOW), ('E', HIGH)], 2, 0)
g = mk(104); g.run(10); g.bridge(4); g.run(10)
rooms['r04'] = emit('r04', g, finish(g), [('W', LOW), ('E', LOW)], 3, 0)
g = mk(105); g.run(8); g.terrace(); g.checkpoint(10)
rooms['r05'] = emit('r05', g, finish(g), [('W', LOW), ('E', LOW)], 4, 0)
g = mk(106); g.run(10); g.tiers(3); g.run(8)
rooms['r06'] = emit('r06', g, finish(g, ladder=True), [('W', LOW), ('E', LOW), ('E', HIGH)], 5, 0)
g = mk(107); g.mini(); g.run(8)
rooms['r07'] = emit('r07', g, finish(g), [('W', LOW), ('E', LOW)], 6, 0)
g = mk(108); g.run(10); g.cave(); g.run(8); g.chest_ledge()
rooms['r08'] = emit('r08', g, finish(g), [('W', LOW), ('E', LOW)], 7, 0)
g = mk(109); g.run(12); g.checkpoint(10); g.run(10)
rooms['r09'] = emit('r09', g, finish(g), [('W', LOW), ('E', LOW)], 8, 0)
g = mk(110); g.run(8, enemies=False, top=2, spike_ok=False); g.run(32, enemies=False, top=2, spike_ok=False)
g.m.g[2][12] = 'S'; g.m.g[2][36] = 'B'
rooms['r10'] = emit('r10', g, finish(g), [('W', LOW)], 9, 0)

def branch(seed, secret):
    g = mk(seed)
    g.run(10, enemies=False, top=11, spike_ok=False); g.run(14, top=11)
    x0, top = g.run(12, enemies=False, top=11, spike_ok=False); cx = x0 + 6
    if secret: g.m.plat(cx - 1, cx + 1, top + 3); g.m.g[top + 4][cx] = 'C'
    else: g.m.plat(cx - 1, cx + 1, top + 1); g.m.g[top + 2][cx] = 'C'
    g.run(6, enemies=False, top=11, spike_ok=False)
    return g, g.x + 1
g, W = branch(111, False); rooms['r11'] = emit('r11', g, W, [('W', HIGH)], 2, -1)
g, W = branch(112, True); rooms['r12'] = emit('r12', g, W, [('W', HIGH)], 5, -1)

def ex(side, rng, to): return {'side': side, 'y0': rng[0], 'y1': rng[1], 'to': 'racines/' + to}
chain = ['r%02d' % i for i in range(1, 11)]
for i, rid in enumerate(chain):
    rooms[rid]['exits'] = ([ex('W', LOW, chain[i - 1])] if i else []) + ([ex('E', LOW, chain[i + 1])] if i < 9 else [])
rooms['r03']['exits'].append(ex('E', HIGH, 'r11')); rooms['r06']['exits'].append(ex('E', HIGH, 'r12'))
rooms['r11']['exits'] = [ex('W', HIGH, 'r03')]; rooms['r12']['exits'] = [ex('W', HIGH, 'r06')]

rle = lambda r: re.sub(r'(.)\1+', lambda mo: mo.group(1) + str(len(mo.group(0))), r)
out = ["// Salles de la zone des Racines Mousseuses — généré par tools/make_rooms.py (ne pas éditer à la main). Voir monde.md.",
       "import { decode } from './rle.js';", "", "export const ROOMS = {"]
for rid in sorted(rooms):
    r = rooms[rid]
    body = ',\n'.join(f"      '{rle(row)}'" for row in r['rows'])
    out.append(f"  'racines/{rid}': {{ gx: {r['gx']}, gy: {r['gy']}, exits: {json.dumps(r['exits'])},\n    map: decode([\n{body},\n    ]) }},")
out.append("};\n")
open(os.path.join(_here, '..', 'src', 'levels', 'rooms_racines.js'), 'w', encoding='utf-8').write('\n'.join(out))
for rid in sorted(rooms): print(rid, rooms[rid]['w'], 'x 18', [(e['side'], e['y0']) for e in rooms[rid]['exits']])
