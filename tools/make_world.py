#!/usr/bin/env python3
"""Génère src/levels/rooms_racines.js : le LABYRINTHE des Racines Mousseuses (monde interconnecté, voir monde.md).
Chaque salle = grille 'y vers le haut'. Sorties dans 4 directions :
  E/W {side,y0,y1}      : franchir le bord gauche/droit entre les rangées y0..y1
  N/S {side,x0,x1}      : monter par le plafond / tomber par un trou du sol (x0..x1)
  gate  : l'ouverture est murée tant que le drapeau n'est pas levé ; opens : traverser cette sortie lève le drapeau.
Usage : python3 tools/make_world.py   (génère le fichier + vérifie l'accessibilité : sans double saut tout sauf les secrets)"""
import os, re, json, random, sys

H = 24
class R:
    def __init__(s, rid, name, W, gx, gy, H=H):
        s.id, s.name, s.W, s.H, s.gx, s.gy = rid, name, W, H, gx, gy
        s.g = [['.'] * W for _ in range(H)]
        for y in range(H):
            s.g[y][0] = s.g[y][W - 1] = '#'
        for x in range(W): s.g[0][x] = s.g[1][x] = s.g[H - 1][x] = '#'
        s.exits = []; s.rnd = random.Random(sum(map(ord, rid)))
    def fill(s, x0, x1, y0, y1, c='#'):
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1): s.g[y][x] = c
    def plat(s, x0, x1, y): s.fill(x0, x1, y, y, '=')
    def ground(s, x0, x1, top):                       # change la hauteur du sol (rangées < top pleines)
        for x in range(x0, x1 + 1):
            for y in range(1, s.H - 1): s.g[y][x] = '#' if y < top else '.'
    def pit(s, x0, x1):                               # fosse à pics (sans sortie)
        for x in range(x0, x1 + 1):
            for y in range(2, s.H - 1): s.g[y][x] = '.'
            s.g[1][x] = '^'
    def ceiling(s, x0, x1, y): s.fill(x0, x1, y, s.H - 2)
    def put(s, x, y, c): s.g[y][x] = c
    def top(s, x):                                    # première case libre au-dessus du sol en x
        y = 1
        while s.g[y][x] in '#=': y += 1
        return y
    def climb(s, xa, xb, y0, y1, cx0, cx1):           # plateformes en zigzag de y0 (sol) vers y1, finit sous la sortie cx0..cx1
        row, left = y0 + 1, True
        while row < y1 - 1:
            if left: s.plat(xa, xa + 4, row)
            else: s.plat(xb - 4, xb, row)
            left = not left; row += 2
        s.plat(max(1, cx0 - 1), min(s.W - 2, cx1 + 1), min(row, y1 - 1))
    def stairs(s, x, y_from, y_to, d=1):              # marches de 3 de large, une toutes les 2 rangées
        row, i = y_from + 1, 0
        while row < y_to - 1:
            xx = x + 4 * i * d
            s.plat(min(xx, xx + 2 * d), max(xx, xx + 2 * d), row); row += 2; i += 1
        return x + 4 * i * d
    def islands(s, x0, x1, hole=None):                # fosse large traversée par des îlots, trou S optionnel
        s.pit(x0, x1)
        for x in range(x0 + 2, x1 - 1, 5): s.plat(x, x + 2, 2)
        if hole:
            for x in range(hole[0], hole[1] + 1): s.g[1][x] = '.'; s.g[0][x] = '.'
    def deco(s):
        for x in range(2, s.W - 2):
            t = s.top(x)
            if s.g[t][x] == '.' and s.g[t - 1][x] == '#' and s.rnd.random() < 0.13: s.g[t][x] = s.rnd.choice('pqb')
    def foes(s, xs, kinds='cccfkh'):
        for x in xs:
            k = s.rnd.choice(kinds)
            t = s.top(x)
            if k == 'f': s.g[min(t + 3, s.H - 4)][x] = 'f'
            elif s.g[t][x] == '.' and s.g[t - 1][x] in '#=': s.g[t][x] = k
    def on(s, x, c):
        t = s.top(x); assert s.g[t][x] in '.pqb', (s.id, x, c, s.g[t][x]); s.g[t][x] = c
    def exit(s, side, a, b, to, **kw): s.exits.append(dict(side=side, **({'y0': a, 'y1': b} if side in 'EW' else {'x0': a, 'x1': b}), to='racines/' + to, **kw))
    def carve(s):
        for e in s.exits:
            if e['side'] in 'EW':
                x = 0 if e['side'] == 'W' else s.W - 1
                for y in range(e['y0'], e['y1'] + 1): s.g[y][x] = '.'
            elif e['side'] == 'N':
                for x in range(e['x0'], e['x1'] + 1): s.g[s.H - 1][x] = '.'
            else:
                for x in range(e['x0'], e['x1'] + 1): s.g[1][x] = s.g[0][x] = '.'
    def rows(s): return [''.join(s.g[y]) for y in range(s.H - 1, -1, -1)]

rooms = {}
def room(*a, **k):
    r = R(*a, **k); rooms[r.id] = r; return r

# ---------- surface basse (gy 0) ----------
A = room('entree', "L'Entrée des Racines", 46, 0, 0)
A.put(3, 2, 'P'); A.put(7, 2, 'S'); A.put(12, 2, 'N')
A.climb(18, 28, 2, 20, 21, 23); A.foes([16, 32, 38], 'cc'); A.deco()
A.exit('E', 2, 5, 'clairiere'); A.exit('S', 38, 40, 'prof1'); A.exit('N', 21, 23, 'raccourci', gate='raccourci')
B = room('clairiere', 'La Clairière Moussue', 58, 1, 0)
B.pit(20, 22); B.ground(30, 36, 3); B.climb(44, 54, 2, 20, 47, 49)
B.foes([10, 15, 26, 33, 40, 52], 'cccfkh'); B.deco()
B.exit('W', 2, 5, 'entree'); B.exit('E', 2, 5, 'gouffre'); B.exit('N', 47, 49, 'canopee')
C = room('gouffre', 'Le Gouffre aux Piques', 62, 2, 0)
C.islands(20, 36, hole=(28, 29)); C.climb(48, 58, 2, 20, 51, 53); C.foes([8, 14, 42, 46], 'cck'); C.deco()
C.exit('W', 2, 5, 'clairiere'); C.exit('E', 2, 5, 'souche'); C.exit('S', 28, 29, 'cavern'); C.exit('N', 51, 53, 'passage')
Hh = room('souche', 'La Souche Creuse', 50, 3, 0)
Hh.pit(10, 13); Hh.climb(14, 24, 2, 20, 17, 19); Hh.foes([30, 44, 8], 'cch'); Hh.deco()
Hh.exit('W', 2, 5, 'gouffre'); Hh.exit('E', 2, 5, 'chambre'); Hh.exit('N', 17, 19, 'cime'); Hh.exit('S', 36, 38, 'prof4', opens='puits')
Z = room('chambre', 'La Chambre aux Racines', 38, 4, 0)
Z.pit(10, 13); Z.plat(16, 19, 3); Z.plat(22, 26, 5); Z.plat(28, 32, 7); Z.put(30, 8, 'C'); Z.foes([8, 18, 34], 'cc'); Z.deco()
Z.exit('W', 2, 5, 'souche')

# ---------- canopée (gy 1) ----------
D = room('canopee', 'La Canopée', 50, 1, 1)
D.put(10, 2, 'S'); D.foes([18, 26, 36, 44], 'ccf'); D.plat(24, 27, 3); D.plat(30, 34, 5); D.plat(36, 40, 7); D.put(38, 8, 'C'); D.deco()
D.exit('W', 2, 5, 'raccourci'); D.exit('E', 2, 5, 'passage'); D.exit('S', 20, 22, 'clairiere')
Rr = room('raccourci', 'Le Raccourci du Veilleur', 40, 0, 1)
Rr.foes([14, 26, 32], 'cc'); Rr.deco()
Rr.exit('E', 2, 5, 'canopee'); Rr.exit('S', 8, 10, 'entree', opens='raccourci')
F = room('passage', 'Le Passage Suspendu', 66, 2, 1)
F.put(10, 2, 'S'); F.islands(24, 40); F.on(54, 'M')
F.deco(); F.foes([16, 20, 44], 'cck')
F.exit('W', 2, 5, 'canopee'); F.exit('E', 2, 5, 'cime'); F.exit('S', 14, 16, 'gouffre')
Gm = room('cime', "La Cime de l'Arbre-Mère", 54, 3, 1)
Gm.put(6, 2, 'S'); Gm.climb(24, 34, 2, 20, 27, 29); Gm.foes([14, 40, 48], 'cch'); Gm.deco()
Gm.exit('W', 2, 5, 'passage'); Gm.exit('E', 2, 5, 'arene'); Gm.exit('S', 42, 44, 'souche'); Gm.exit('N', 27, 29, 'hauteur')
Ar = room('arene', 'Arène de la Gardienne', 52, 4, 1)
Ar.put(8, 2, 'S'); Ar.put(38, 2, 'B')
Ar.exit('W', 2, 5, 'cime')
S1 = room('hauteur', 'La Hauteur Secrète', 36, 3, 2)
S1.plat(20, 24, 6); S1.put(22, 7, 'C'); S1.foes([8, 30], 'f'); S1.deco()
S1.exit('S', 10, 12, 'cime')

# ---------- sous-sol (gy -1, -2) ----------
U1 = room('prof1', 'Les Racines Profondes', 54, 0, -1)
U1.ceiling(1, 28, 14); U1.ceiling(44, 52, 14); U1.climb(30, 42, 2, 20, 38, 40); U1.foes([8, 16, 24, 48], 'cch')
U1.exit('E', 2, 5, 'prof2'); U1.exit('N', 38, 40, 'entree')
U2 = room('prof2', 'La Galerie Sombre', 58, 1, -1)
U2.ceiling(1, 56, 14); U2.put(10, 2, 'S'); U2.foes([18, 24, 38, 46], 'cck')
U2.exit('W', 2, 5, 'prof1'); U2.exit('E', 2, 5, 'cavern'); U2.exit('S', 28, 30, 'crypte')
U2.fill(27, 31, 2, 2, '.')
Cr = room('crypte', 'La Crypte des Veilleurs', 36, 1, -2)
Cr.ceiling(1, 10, 14); Cr.ceiling(18, 34, 14); Cr.climb(12, 22, 2, 20, 15, 17); Cr.on(30, 'C'); Cr.foes([24, 28, 33], 'cc')
Cr.exit('N', 15, 17, 'prof2')
U3 = room('cavern', 'La Caverne Cachée', 58, 2, -1)
U3.ceiling(1, 20, 14); U3.ceiling(34, 56, 14); U3.climb(22, 32, 2, 20, 26, 28); U3.foes([8, 14, 40, 48], 'cch')
U3.exit('W', 2, 5, 'prof2'); U3.exit('E', 2, 5, 'prof4'); U3.exit('N', 26, 28, 'gouffre')
U4 = room('prof4', 'Le Sous-Souche', 50, 3, -1)
U4.ceiling(1, 26, 14); U4.ceiling(40, 48, 14); U4.climb(28, 38, 2, 20, 34, 36); U4.foes([8, 16, 44], 'cck')
U4.exit('W', 2, 5, 'cavern'); U4.exit('N', 34, 36, 'souche', gate='puits')

def finish():
    for r in rooms.values(): r.carve()
    for r in rooms.values():                          # zones d'arrivée sans ennemis (autour des trous/plafonds et des portes)
        for e in r.exits:
            if e['side'] in 'NS': lo, hi = e['x0'] - 8, e['x1'] + 8
            elif e['side'] == 'W': lo, hi = 0, 7
            else: lo, hi = r.W - 8, r.W
            for x in range(max(1, lo), min(r.W - 1, hi + 1)):
                for y in range(r.H):
                    if r.g[y][x] in 'cfkh': r.g[y][x] = '.'
    for r in rooms.values():
        for e in r.exits:
            assert e['to'].split('/')[1] in rooms, (r.id, e)
            back = [x for x in rooms[e['to'].split('/')[1]].exits if x['to'] == 'racines/' + r.id]
            assert back, ('lien non réciproque', r.id, e['to'])
finish()

# ---------------- vérification d'accessibilité (physique approchée : saut 2.8, portée 5, double saut non compté) ---
def free(r, x, y): return 0 <= x < r.W and 0 <= y < r.H and r.g[y][x] != '#'
def support(r, x, y): return y >= 1 and r.g[y - 1][x] in '#=' if 0 <= x < r.W else False
def body(r, x, y): return free(r, x, y) and free(r, x, y + 1)
def explore(r, starts, flags):
    """cases où l'on peut se tenir (x,y) accessibles depuis starts ; retourne aussi les sorties N/S franchissables."""
    seen, st = set(), list(starts)
    exits_used = set()
    def fall(x, y):
        while y >= 0 and not (support(r, x, y) and body(r, x, y)):
            if y < 1 and r.g[0][x] != '#': return (x, -1)
            y -= 1
            if y < 0: return (x, -1)
        return (x, y)
    while st:
        x, y = st.pop()
        if y == -1: exits_used.add(('S', x)); continue
        if (x, y) in seen: continue
        seen.add((x, y))
        for dx in (-1, 1):
            nx = x + dx
            if 0 <= nx < r.W and body(r, nx, y): st.append(fall(nx, y))
        top = 0
        while top < 3 and free(r, x, y + 1 + top) and r.g[y + 1 + top][x] != '#': top += 1
        for dx in range(-5, 6):
            for dy in range(-12, 3):
                nx, ny = x + dx, y + dy
                if 0 <= nx < r.W and 0 <= ny < r.H and support(r, nx, ny) and body(r, nx, ny) and (dy <= 0 or top >= dy):
                    if all(free(r, x + int(dx * t / 6), max(y, ny) + 1) for t in range(1, 6)) or dy <= 0: st.append((nx, ny))
        if y >= r.H - 4: exits_used.add(('N', x))
    return seen, exits_used

def check():
    flags = set()
    entries = {'entree': [(3, 2)]}
    reach = {}
    for _ in range(40):
        changed = False
        for rid in list(entries):
            r = rooms[rid]; seen, used = explore(r, entries[rid], flags)
            reach[rid] = seen
            for e in r.exits:
                if e.get('gate') and e['gate'] not in flags: continue
                to = e['to'].split('/')[1]; t = rooms[to]; go = False; land = []
                back = [b for b in t.exits if b['to'] == 'racines/' + rid][0]
                if e['side'] in 'EW':
                    go = any(x >= r.W - 2 if e['side'] == 'E' else x <= 1 for (x, y) in seen if e['y0'] <= y <= e['y1'])
                    land = [(1 if e['side'] == 'E' else t.W - 2, back['y0'])]
                elif e['side'] == 'N':
                    go = any(s == 'N' and e['x0'] <= x <= e['x1'] for s, x in used)
                    land = [(x, 2) for x in range(back['x0'] - 3, back['x1'] + 4) if 0 < x < t.W and support(t, x, 2) and body(t, x, 2)]
                else:
                    go = any(s == 'S' and e['x0'] <= x <= e['x1'] for s, x in used) or any(e['x0'] <= x <= e['x1'] and y <= 2 for x, y in seen if not support(r, x, y))
                    land = [((back['x0'] + back['x1']) // 2, t.H - 3)]
                if go:
                    if e.get('opens') and e['opens'] not in flags: flags.add(e['opens']); changed = True
                    cur = entries.setdefault(to, [])
                    land2 = []
                    for (x, y) in land:
                        if y == t.H - 3:
                            yy = y
                            while yy > 1 and not (support(t, x, yy) and body(t, x, yy)): yy -= 1
                            land2.append((x, yy))
                        else: land2.append((x, y))
                    new = [p for p in land2 if p not in cur]
                    if new: cur.extend(new); changed = True
        if not changed: break
    missing = [r for r in rooms if r not in entries]
    return entries, reach, flags, missing

if __name__ == '__main__':
    entries, reach, flags, missing = check()
    print('drapeaux levés :', sorted(flags)); print('salles non atteintes :', missing or 'aucune')
    bad = []
    for rid, r in rooms.items():
        if rid not in reach: continue
        for y in range(r.H):
            for x in range(r.W):
                if r.g[y][x] in 'CSMB' and not any((x + dx, y) in reach[rid] for dx in (-1, 0, 1)) and rid not in ('hauteur',): bad.append((rid, r.g[y][x], x, y))
    print('objets inaccessibles :', bad or 'aucun')
    rle = lambda r: re.sub(r'(.)\1+', lambda mo: mo.group(1) + str(len(mo.group(0))), r)
    out = ["// Labyrinthe des Racines Mousseuses — généré par tools/make_world.py (ne pas éditer à la main). Voir monde.md.", "import { decode } from './rle.js';", "", "export const ROOMS = {"]
    for rid in rooms:
        r = rooms[rid]
        body = ',\n'.join(f"      '{rle(row)}'" for row in r.rows())
        out.append(f"  'racines/{rid}': {{ name: {json.dumps(r.name, ensure_ascii=False)}, gx: {r.gx}, gy: {r.gy}, exits: {json.dumps(r.exits)},\n    map: decode([\n{body},\n    ]) }},")
    out.append("};\n")
    open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'levels', 'rooms_racines.js'), 'w', encoding='utf-8').write('\n'.join(out))
    print(len(rooms), 'salles écrites')
