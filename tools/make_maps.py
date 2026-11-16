#!/usr/bin/env python3
"""Génère src/levels/chapterN.js (cartes ASCII longues, assemblées par segments avec une graine fixe).
Usage : python3 tools/make_maps.py
Contraintes de jouabilité : fossés <= 4 tuiles, marches <= 2 tuiles, aucune capacité obligatoire
(double saut et saut mural ne servent qu'aux coffres/secrets)."""
import os, random, re

class Map:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.g = [['.'] * w for _ in range(h)]          # g[y][x], y=0 en bas
        s.top = [2] * w                              # hauteur du sol par colonne
        for y in range(h): s.g[y][0] = s.g[y][w - 1] = '#'
        for x in range(w): s.g[h - 1][x] = '#'
    def put(s, x, y, c): s.g[y][x] = c
    def solid(s, x0, x1, y0, y1):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1): s.g[y][x] = '#'
    def ground(s, x0, x1, top):
        for x in range(x0, x1 + 1):
            s.top[x] = top
            for y in range(0, top): s.g[y][x] = '#'
    def pit(s, x0, x1):
        for x in range(x0, x1 + 1):
            s.top[x] = 0
            s.g[0][x] = '#'; s.g[1][x] = '^'
    def plat(s, x0, x1, y):
        for x in range(x0, x1 + 1): s.g[y][x] = '='
    def at(s, x, c, dy=0): s.g[s.top[x] + dy][x] = c   # pose un symbole au sol (ou à dy au-dessus)
    def text(s): return [''.join(s.g[y][x] for x in range(s.w)) for y in range(s.h - 1, -1, -1)]

def arena(m, x0, x1, top, boss_dx):
    m.ground(x0, x1 - 1, top); m.ground(x1 - 1, x1 - 1, top)
    m.at(x0 + 2, 'S'); m.at(x0 + boss_dx, 'B')


def write(name, title, m, width):
    # recadre à la largeur finale + mur droit plein
    m.w = width
    m.g = [row[:width] for row in m.g]
    for y in range(m.h): m.g[y][width - 1] = '#'
    rows = m.text(); assert len({len(r) for r in rows}) == 1
    cnt = lambda c: sum(r.count(c) for r in rows)
    assert cnt('P') == 1 and cnt('B') == 1 and cnt('M') == 1 and cnt('N') == 1, name
    # validation : objets posés sur un support
    for y in range(m.h):
        for x in range(m.w):
            c = m.g[y][x]
            if c in 'cSNMBCDW': assert y > 0 and m.g[y - 1][x] in '#=', (name, c, x, y, 'sans support')
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels', name + '.js')
    rle = lambda r: re.sub(r'(.)\1+', lambda mo: mo.group(1) + str(len(mo.group(0))), r)
    body = ',\n'.join(f"    '{rle(r)}'" for r in rows)
    open(path, 'w', encoding='utf-8').write(
        f"// {title} — généré par tools/make_maps.py (légende dans plan.md) ; lignes compressées (RLE, voir rle.js)\nimport {{ decode }} from './rle.js';\n\nexport const map = decode([\n{body},\n]);\n")
    print(f'{name}: {width}x{m.h}  c={cnt("c")} f={cnt("f")} S={cnt("S")} C={cnt("C")} N={cnt("N")} M={cnt("M")}')

class Gen:
    def __init__(s, seed, target, h=18, spikes=False, flyers=0.35):
        s.r = random.Random(seed); s.target = target; s.m = Map(target + 150, h)
        s.x = 1; s.top = 2; s.spikes = spikes; s.flyers = flyers; s.since_s = 0
    def newtop(s, lo=2, hi=6):
        d = s.r.choice([-2, -1, -1, 0, 0, 0, 1, 1, 2])
        t = max(lo, min(hi, s.top + d)); s.top = t; return t
    def free(s, x, y): return s.m.g[y][x] == '.'
    def deco(s, x0, x1, top):
        for x in range(x0 + 1, x1 - 1):
            if s.r.random() < 0.12 and s.free(x, top): s.m.g[top][x] = s.r.choice('pqb')
    def enemies(s, x0, x1, top, step=(4, 6)):
        x = x0 + s.r.randint(3, 5)
        while x < x1 - 2:
            if s.free(x, top):
                if s.r.random() < s.flyers: s.m.g[top + s.r.randint(2, 3)][x] = 'f'
                else: s.m.g[top][x] = 'c'
            x += s.r.randint(*step)
    def run(s, n, enemies=True, spike_ok=True, top=None):
        top = s.newtop() if top is None else top; s.top = top
        x0 = s.x; s.m.ground(x0, x0 + n - 1, top); s.x += n; s.since_s += n
        s.deco(x0, x0 + n, top)
        if s.spikes and spike_ok and n >= 12 and s.r.random() < 0.4:
            sx = x0 + s.r.randint(5, n - 7)
            for dx in (0, 1): s.m.g[top][sx + dx] = '^'
        if enemies: s.enemies(x0, x0 + n, top)
        return x0, top
    def gap(s, n):
        s.m.pit(s.x, s.x + n - 1); s.x += n
    def bridge(s, islands):
        top = s.top; x = s.x; up = False
        for i in range(islands):
            if i: s.m.pit(x, x + 1); x += 2           # fossé de 2 entre les îlots
            w = s.r.randint(2, 3); row = top + (1 if up else 0)
            s.m.plat(x, x + w - 1, row)
            if s.r.random() < 0.5: s.m.g[row + s.r.randint(2, 3)][x + w // 2] = 'f'
            for k in range(w): s.m.top[x + k] = row + 1
            x += w; up = not up
        # sous les îlots : vide avec pics
        for xx in range(s.x, x):
            if s.m.g[0][xx] != '#': s.m.g[0][xx] = '#'
            if s.m.g[1][xx] == '.': s.m.g[1][xx] = '^'
        s.since_s += x - s.x; s.x = x
    def terrace(s):
        # montée puis descente par paliers de 2
        t0 = max(2, min(4, s.top))
        for t in (t0, t0 + 2, t0 + 4 if t0 + 4 <= 6 else t0 + 2, t0 + 2, t0):
            s.run(4, enemies=False, top=t)
        s.enemies(s.x - 20, s.x, s.top)
    def checkpoint(s, n=10):
        x0, top = s.run(n, enemies=False, spike_ok=False); s.m.g[top][x0 + 3] = 'S'; s.since_s = 0
    def chest_ledge(s, n=12, secret=False):
        x0, top = s.run(n, spike_ok=False)
        cx = x0 + n // 2
        if secret:   # double saut requis
            s.m.plat(cx - 1, cx + 1, top + 3); s.m.g[top + 4][cx] = 'C'
        else:
            s.m.plat(cx - 1, cx + 1, top + 1); s.m.g[top + 2][cx] = 'C'
    def orb(s, ch, n=12):
        x0, top = s.run(n, enemies=False, spike_ok=False); cx = x0 + n // 2
        s.m.plat(cx - 1, cx + 1, top + 1); s.m.g[top + 2][cx] = ch
    def tower(s):
        x0, top = s.run(10, enemies=False, spike_ok=False); x = x0 + 1
        s.m.solid(x, x, top + 2, top + 9); s.m.solid(x + 4, x + 8, top + 2, top + 9)
        s.m.g[top + 10][x + 7] = 'C'
    def mini(s):
        s.checkpoint(8)
        x0, top = s.run(26, enemies=False, spike_ok=False); s.m.g[top][x0 + 17] = 'M'; s.since_s = 0
    def finish(s, boss_dx=14):
        s.gap(3)
        x0 = s.x; top = 3
        s.m.ground(x0, x0 + 21, top); s.m.g[top][x0 + 2] = 'S'; s.m.g[top][x0 + boss_dx] = 'B'
        s.x = x0 + 22
        return s.x + 1

def build(name, title, seed, target, features, **kw):
    g = Gen(seed, target, **kw)
    g.run(18, enemies=False, top=2, spike_ok=False)
    g.m.g[2][3] = 'P'; g.m.g[2][7] = 'S'; g.m.g[2][12] = 'N'; g.since_s = 0
    feats = sorted(features)
    beats = ['run', 'gap', 'bridge', 'terrace', 'run', 'gap']
    i = 0
    while g.x < target:
        if feats and feats[0][0] * target <= g.x:
            fr, f = feats.pop(0)
            g.gap(g.r.randint(2, 3)) if g.r.random() < 0.6 else None
            getattr(g, f[0])(*f[1:]); continue
        if g.since_s > 70: g.gap(g.r.randint(2, 3)) if g.r.random() < 0.5 else None; g.checkpoint(); continue
        b = beats[i % len(beats)] if g.r.random() < 0.6 else g.r.choice(beats); i += 1
        if b == 'gap': g.gap(g.r.randint(2, 4)); g.run(g.r.randint(8, 16))
        elif b == 'bridge': g.bridge(g.r.randint(3, 5)); g.run(g.r.randint(8, 12))
        elif b == 'terrace': g.terrace()
        else: g.run(g.r.randint(12, 24))
    width = g.finish()
    write(name, title, g.m, width)

build('chapter1', 'Chapitre 1 : Les Racines Mousseuses', 11, 300, [
    (0.18, ('chest_ledge',)), (0.30, ('orb', 'D')), (0.42, ('chest_ledge',)), (0.52, ('mini',)),
    (0.68, ('chest_ledge', 12, True)), (0.80, ('chest_ledge',))])
build('chapter2', 'Chapitre 2 : Les Plaines du Vent', 22, 380, [
    (0.12, ('orb', 'W')), (0.22, ('chest_ledge',)), (0.34, ('tower',)), (0.50, ('mini',)),
    (0.62, ('chest_ledge', 12, True)), (0.74, ('chest_ledge',)), (0.86, ('tower',))], spikes=True)
build('chapter3', 'Chapitre 3 : Le Village Oublié', 33, 460, [
    (0.10, ('chest_ledge',)), (0.24, ('chest_ledge', 12, True)), (0.38, ('tower',)), (0.52, ('mini',)),
    (0.66, ('chest_ledge',)), (0.78, ('chest_ledge', 12, True)), (0.88, ('chest_ledge',))], spikes=True, flyers=0.4)
