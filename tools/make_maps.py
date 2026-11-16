#!/usr/bin/env python3
"""Génère src/levels/chapterN.js (cartes ASCII). Usage : python3 tools/make_maps.py
Contraintes de jouabilité : fossés <= 4 tuiles, marches <= 2 tuiles, aucune capacité obligatoire
(double saut et saut mural ne servent qu'aux coffres/secrets)."""
import os

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

def write(name, title, m):
    rows = m.text(); assert len({len(r) for r in rows}) == 1
    assert sum(r.count('P') for r in rows) == 1 and sum(r.count('B') for r in rows) == 1, name
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'levels', name + '.js')
    body = ',\n'.join(f"    '{r}'" for r in rows)
    open(path, 'w', encoding='utf-8').write(
        f"// {title} — généré par tools/make_maps.py (légende dans plan.md)\nexport const map = [\n{body},\n];\n")
    print(f'{name}: {m.w}x{m.h}'); print('\n'.join(rows)); print()

# ---------------- Chapitre 1 : Les Racines Mousseuses (96x14) ----------------
m = Map(96, 14)
m.ground(1, 14, 2); m.at(3, 'P'); m.at(7, 'S'); m.at(5, 'p'); m.at(11, 'b'); m.at(12, 'c')
m.pit(15, 17)
m.ground(18, 30, 2); m.plat(20, 22, 5); m.at(24, 'f', 2); m.at(27, 'c'); m.at(19, 'q'); m.at(29, 'p')
m.ground(31, 40, 4); m.at(33, 'b')
m.pit(41, 44); m.plat(42, 43, 5)
m.ground(45, 58, 4); m.at(50, 'c'); m.at(55, 'c'); m.at(46, 'p'); m.at(53, 'q')
m.plat(52, 54, 5); m.plat(56, 58, 7); m.at(57, 'D', 4)           # orbe de double saut (accessible en simple saut)
m.pit(59, 61)
m.ground(62, 72, 3); m.at(63, 'S'); m.at(67, 'c'); m.at(65, 'f', 2); m.at(65, 'b', 0); m.at(71, 'q')
m.plat(68, 70, 6); m.at(69, 'C', 4)                               # coffre secret : double saut requis
m.pit(73, 76)
m.ground(77, 95, 3); m.at(78, 'p')
arena(m, 77, 94, 3, 13)
# le mur droit doit rester plein
for y in range(m.h): m.g[y][95] = '#'
write('chapter1', 'Chapitre 1 : Les Racines Mousseuses', m)

# ---------------- Chapitre 2 : Les Plaines du Vent (116x17) ----------------
m = Map(116, 17)
m.ground(1, 12, 2); m.at(3, 'P'); m.at(6, 'S'); m.at(9, 'p')
m.pit(13, 16)
m.ground(17, 28, 2); m.at(20, 'c'); m.at(25, 'c'); m.plat(21, 23, 5); m.at(27, 'f', 2); m.at(18, 'b')
m.pit(29, 31)
m.ground(32, 49, 3); m.at(34, 'W', 0); m.at(40, 'c'); m.at(45, 'c'); m.at(42, 'f', 3); m.at(37, 'q'); m.at(47, 'S')
# tour à saut mural (optionnelle) : tunnel de 2 tuiles au sol, puits entre x=51..53
m.solid(50, 50, 5, 12); m.solid(54, 58, 5, 12)
m.ground(50, 58, 3)
m.at(57, 'C', 10)                                                  # coffre au sommet
m.pit(59, 62)
m.ground(63, 76, 3); m.at(64, 'S'); m.at(67, 'c'); m.at(72, 'c'); m.at(69, 'f', 3); m.at(75, 'p')
m.pit(77, 80); m.plat(78, 79, 5)
m.ground(81, 92, 5); m.at(84, 'c'); m.at(89, 'c'); m.plat(86, 88, 6); m.at(87, 'f', 3); m.at(83, 'b')
m.pit(93, 95)
arena(m, 96, 115, 3, 14)
for y in range(m.h): m.g[y][115] = '#'
write('chapter2', 'Chapitre 2 : Les Plaines du Vent', m)

# ---------------- Chapitre 3 : Le Village Oublié (124x17) ----------------
m = Map(124, 17)
m.ground(1, 10, 2); m.at(3, 'P'); m.at(5, 'S'); m.at(8, 'b')
m.pit(11, 14); m.plat(12, 13, 4)
m.ground(15, 26, 2); m.at(18, 'c'); m.at(24, 'c'); m.solid(21, 22, 2, 3)   # maison basse à franchir
m.ground(27, 36, 4); m.at(29, 'c'); m.at(33, 'f', 3); m.at(31, 'q')
m.pit(37, 40); m.plat(38, 39, 6)
m.ground(41, 54, 4); m.at(43, 'S'); m.at(46, 'c'); m.at(51, 'c'); m.at(49, 'f', 3)
m.pit(55, 58)
m.plat(47, 49, 7); m.plat(51, 53, 9); m.plat(55, 57, 11); m.at(56, 'C', 12)   # coffre : escalier de plateformes
m.ground(59, 72, 3); m.at(61, 'c'); m.at(66, 'c'); m.at(70, 'c'); m.at(63, 'f', 3); m.at(68, 'p')
m.solid(64, 65, 3, 4)
m.pit(73, 76)
m.ground(77, 90, 4); m.at(78, 'S'); m.at(82, 'c'); m.at(86, 'c'); m.at(80, 'f', 3); m.at(88, 'f', 3)
m.plat(83, 85, 7); m.at(84, 'C', 4)
m.pit(91, 94)
m.ground(95, 100, 3); m.at(97, 'c')
m.pit(101, 103)
arena(m, 104, 123, 3, 14)
for y in range(m.h): m.g[y][123] = '#'
write('chapter3', 'Chapitre 3 : Le Village Oublié', m)
