#!/usr/bin/env python3
"""Génère src/levels/rooms_racines.js, rooms_plaines.js, rooms_village.js : les LABYRINTHES des 3 chapitres (monde interconnecté, voir monde.md).
Chaque salle = grille 'y vers le haut'. Sorties dans 4 directions :
  E/W {side,y0,y1}      : franchir le bord gauche/droit entre les rangées y0..y1
  N/S {side,x0,x1}      : monter par le plafond / tomber par un trou du sol (x0..x1)
  gate  : l'ouverture est murée tant que le drapeau n'est pas levé ; opens : traverser cette sortie lève le drapeau.
  X dans une carte = mur fissuré (se brise d'un coup de lame, voir src/world/Walls.js)
Usage : python3 tools/make_world.py   (génère les fichiers + vérifie l'accessibilité : sans double saut tout sauf les secrets)"""
import os, re, json, random, sys

H = 24
CUR = {'zone': 'racines'}
ZONES = {}
class R:
    def __init__(s, rid, name, W, gx, gy, H=H):
        s.id, s.name, s.W, s.H, s.gx, s.gy = rid, name, W, H, gx, gy
        s.g = [['.'] * W for _ in range(H)]
        for y in range(H):
            s.g[y][0] = s.g[y][W - 1] = '#'
        for x in range(W): s.g[0][x] = s.g[1][x] = s.g[H - 1][x] = '#'
        s.zone = CUR['zone']; s.exits = []; s.gated = []; s.levers = []; s.area = None; s.dark = 0; s.rnd = random.Random(sum(map(ord, s.zone + rid)))
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
    def exit(s, side, a, b, to, **kw): s.exits.append(dict(side=side, **({'y0': a, 'y1': b} if side in 'EW' else {'x0': a, 'x1': b}), to=s.zone + '/' + to, **kw))
    def carve(s):
        for e in s.exits:
            if e['side'] in 'EW':
                x = 0 if e['side'] == 'W' else s.W - 1
                for y in range(e['y0'], e['y1'] + 1): s.g[y][x] = '.'
            elif e['side'] == 'N':
                for x in range(e['x0'], e['x1'] + 1): s.g[s.H - 1][x] = '.'
            else:
                for x in range(e['x0'], e['x1'] + 1): s.g[1][x] = s.g[0][x] = '.'
    def shelf(s, x0, x1, py, cx):                                    # étagère visible mais hors de portée d'un simple saut : coffre atteignable seulement avec le double saut
        s.plat(x0, x1, py); s.put(cx, py + 1, 'C'); s.gated.append((cx, py + 1))
    def lever(s, x, flag): s.levers.append((x, 2, flag))              # levier (frappé du glaive) : lève le drapeau, ouvre la porte du même nom ailleurs
    def spikebed(s, x0, x1):                                         # lit de pics au sol (à franchir d'un saut, <= 4 de large)
        assert x1 - x0 <= 3, (s.id, x0, x1)
        for x in range(x0, x1 + 1): s.g[2][x] = '^'
    def pillars(s, x, h=2): s.fill(x, x + 1, 2, 1 + h)               # pilier (h <= 2 : franchissable d'un saut)
    def nook(s, side, xw, cx):                                       # alcôve au fond d'un cul-de-sac : mur fissuré en xw, coffre en cx
        if side == 'W': s.fill(1, xw - 1, 2, 3, '.'); s.fill(1, xw, 4, 4, '#'); s.fill(xw, xw, 2, 3, 'X')
        else: s.fill(xw + 1, s.W - 2, 2, 3, '.'); s.fill(xw, s.W - 2, 4, 4, '#'); s.fill(xw, xw, 2, 3, 'X')
        s.put(cx, 2, 'C')
    def wall(s, x0, x1, y0, y1): s.fill(x0, x1, y0, y1, 'X')          # mur fissuré : se brise d'un coup de lame
    def pocket(s, xl, xr, cx):                                       # alcôve close (mur fissuré à gauche) contenant un coffre en cx
        s.fill(xl + 1, xr - 1, 2, 3, '.'); s.fill(xl, xr, 4, 4, '#'); s.fill(xr, xr, 2, 4, '#'); s.fill(xl, xl, 2, 3, 'X'); s.put(cx, 2, 'C')
    def rows(s): return [''.join(s.g[y]) for y in range(s.H - 1, -1, -1)]

def room(*a, **k):
    r = R(*a, **k); ZONES.setdefault(r.zone, {})[r.id] = r; return r

# ---------- surface basse (gy 0) ----------
A = room('entree', "L'Entrée des Racines", 46, 0, 0)
A.put(3, 2, 'P'); A.put(7, 2, 'S'); A.put(12, 2, 'N')
A.climb(18, 28, 2, 20, 21, 23); A.foes([16, 32, 38], 'cc'); A.deco()
A.exit('E', 2, 5, 'clairiere'); A.exit('S', 38, 40, 'prof1'); A.exit('N', 21, 23, 'raccourci', gate='raccourci')
# trou S : fosse sans pics, bords sûrs
B = room('clairiere', 'La Clairière Moussue', 58, 1, 0)
B.pit(20, 22); B.ground(30, 36, 3); B.climb(44, 54, 2, 20, 47, 49)
B.foes([10, 15, 26, 33, 40, 52], 'cccfkh'); B.deco(); B.spikebed(8, 10); B.pillars(40)
B.exit('W', 2, 5, 'entree'); B.exit('E', 2, 5, 'gouffre'); B.exit('N', 47, 49, 'canopee')
C = room('gouffre', 'Le Gouffre aux Piques', 62, 2, 0)
C.islands(20, 36, hole=(28, 29)); C.climb(48, 58, 2, 20, 51, 53); C.foes([8, 14, 42, 46], 'cck'); C.deco()
C.exit('W', 2, 5, 'clairiere'); C.exit('E', 2, 5, 'souche'); C.exit('S', 28, 29, 'cavern'); C.exit('N', 51, 53, 'passage')
Hh = room('souche', 'La Souche Creuse', 50, 3, 0)
Hh.pit(10, 13); Hh.climb(14, 24, 2, 20, 17, 19); Hh.put(28, 2, 'S'); Hh.foes([8, 32], 'cc'); Hh.deco()
Hh.exit('W', 2, 5, 'gouffre'); Hh.exit('E', 2, 5, 'chambre'); Hh.exit('N', 17, 19, 'cime'); Hh.exit('S', 36, 38, 'prof4', opens='puits')
# étagères à double saut (coffres visibles dès le début, atteints après l'orbe de la Chambre aux Racines)
A.shelf(2, 6, 5, 4); B.shelf(12, 17, 5, 14); Hh.shelf(40, 44, 5, 42)
Z = room('chambre', 'La Chambre aux Racines', 38, 4, 0)
Z.pit(10, 13); Z.plat(16, 19, 3); Z.plat(22, 26, 5); Z.plat(28, 32, 7); Z.put(30, 8, 'C'); Z.put(24, 6, 'D'); Z.foes([8, 18, 34], 'cc'); Z.deco()
Z.exit('W', 2, 5, 'souche')

# ---------- canopée (gy 1) ----------
D = room('canopee', 'La Canopée', 50, 1, 1)
D.put(10, 2, 'S'); D.foes([18, 26, 36, 44], 'ccf'); D.plat(24, 27, 3); D.plat(30, 34, 5); D.plat(36, 40, 7); D.put(38, 8, 'C'); D.deco()
D.exit('W', 2, 5, 'raccourci'); D.exit('E', 2, 5, 'passage'); D.exit('S', 20, 22, 'clairiere')
Rr = room('raccourci', 'Le Raccourci du Veilleur', 40, 0, 1)
Rr.foes([14, 26, 32], 'cc'); Rr.deco(); Rr.ceiling(14, 22, 5); Rr.nook('W', 6, 3)
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
U1.ceiling(1, 28, 14); U1.ceiling(44, 52, 14); U1.climb(30, 42, 2, 20, 38, 40); U1.foes([8, 16, 24, 48], 'cch'); U1.pillars(12); U1.pillars(20)
U1.exit('E', 2, 5, 'prof2'); U1.exit('N', 38, 40, 'entree')
U2 = room('prof2', 'La Galerie Sombre', 58, 1, -1)
U2.ceiling(1, 56, 14); U2.put(10, 2, 'S'); U2.foes([18, 24, 38, 46], 'cck'); U2.spikebed(14, 16)
U2.exit('W', 2, 5, 'prof1'); U2.exit('E', 2, 5, 'cavern'); U2.exit('S', 28, 30, 'crypte', gate='crypte')
U2.fill(27, 31, 2, 2, '.')
Cr = room('crypte', 'La Crypte des Veilleurs', 36, 1, -2)
Cr.ceiling(1, 10, 14); Cr.ceiling(18, 34, 14); Cr.climb(12, 22, 2, 20, 15, 17); Cr.on(30, 'C'); Cr.foes([24, 28, 33], 'cc')
Cr.exit('N', 15, 17, 'prof2')
U3 = room('cavern', 'La Caverne Cachée', 58, 2, -1)
U3.ceiling(1, 20, 14); U3.ceiling(34, 56, 14); U3.climb(22, 32, 2, 20, 26, 28); U3.put(18, 2, 'S'); U3.foes([8, 14, 40, 48], 'cch')
U3.exit('W', 2, 5, 'prof2'); U3.exit('E', 2, 5, 'prof4'); U3.exit('N', 26, 28, 'gouffre'); U3.exit('S', 40, 42, 'galerie')
U4 = room('prof4', 'Le Sous-Souche', 50, 3, -1)
U4.ceiling(1, 26, 14); U4.ceiling(40, 48, 14); U4.climb(28, 38, 2, 20, 34, 36); U4.foes([8, 16, 44], 'cck')
U4.exit('W', 2, 5, 'cavern'); U4.exit('N', 34, 36, 'souche', gate='puits')

U5 = room('galerie', 'La Grande Galerie', 84, 2, -2)
U5.ceiling(1, 32, 14); U5.ceiling(48, 82, 14); U5.climb(34, 46, 2, 20, 40, 42); U5.put(30, 2, 'S')
U5.spikebed(10, 12); U5.pillars(18); U5.pillars(24); U5.spikebed(52, 54); U5.plat(56, 58, 3); U5.plat(60, 63, 5); U5.plat(65, 69, 7); U5.put(67, 8, 'C')
U5.foes([14, 22, 28, 56, 62, 72], 'cch'); U5.lever(72, 'crypte'); U5.nook('E', 76, 80)
U5.exit('N', 40, 42, 'cavern')

# =====================================================================================================
# LES PLAINES DU VENT (chapitre 2) — deux colonnes de salles qui se répondent, un puits central, un sous-terrain
# =====================================================================================================
CUR['zone'] = 'plaines'
# Carte de référence (illustration de l'utilisateur) : départ à gauche, sanctuaire, camp, gouffre (défi), passage secret,
# cascade centrale, caverne (récompense), falaises verticales, souterrain (violet), Tour du Vent en haut.
pd = room('entree', 'Le Point de Départ', 46, 0, 2)
pd.put(3, 2, 'P'); pd.foes([14, 38], 'cc'); pd.deco()
pd.exit('E', 2, 5, 'sanctuaire'); pd.exit('S', 22, 24, 'gouffre')
pg = room('gouffre', 'Le Gouffre aux Piques', 64, 0, 1)
pg.islands(14, 34); pg.pit(40, 43); pg.climb(48, 58, 2, 20, 51, 53); pg.foes([8, 38, 46], 'ckk'); pg.deco()
pg.exit('E', 2, 5, 'camp'); pg.exit('N', 51, 53, 'entree')
pa = room('sanctuaire', 'Le Sanctuaire', 56, 1, 2)
pa.put(10, 2, 'S'); pa.climb(36, 46, 2, 20, 40, 42); pa.foes([22, 30], 'cc'); pa.deco(); pa.shelf(24, 28, 5, 26)
pa.exit('W', 2, 5, 'entree'); pa.exit('E', 2, 5, 'centre'); pa.exit('N', 40, 42, 'secret'); pa.exit('S', 14, 16, 'camp')
pc = room('camp', 'Le Camp Abandonné', 52, 1, 1)
pc.put(10, 2, 'S'); pc.put(16, 2, 'N'); pc.climb(34, 44, 2, 20, 38, 40); pc.foes([24, 30], 'cc'); pc.deco()
pc.exit('N', 38, 40, 'sanctuaire'); pc.exit('W', 2, 5, 'gouffre'); pc.exit('E', 2, 5, 'souterrain')
ps = room('souterrain', 'Le Passage Souterrain', 58, 2, 1)
ps.ceiling(1, 34, 14); ps.ceiling(48, 56, 14); ps.climb(36, 46, 2, 20, 40, 42); ps.put(6, 2, 'S'); ps.foes([12, 22], 'cch')
ps.exit('W', 2, 5, 'camp'); ps.exit('E', 2, 5, 'bas'); ps.exit('N', 40, 42, 'centre')
pm = room('centre', 'Le Cœur des Plaines', 60, 2, 2)
pm.put(22, 2, 'S'); pm.climb(34, 44, 2, 20, 38, 40); pm.foes([28, 50], 'ckf'); pm.deco(); pm.spikebed(14, 16); pm.pillars(46)
pm.exit('W', 2, 5, 'sanctuaire'); pm.exit('E', 2, 5, 'cascade'); pm.exit('N', 38, 40, 'pont'); pm.exit('S', 12, 14, 'souterrain')
pk = room('secret', 'Le Passage Secret', 44, 1, 3)
pk.ceiling(1, 42, 14); pk.foes([16, 22], 'cc'); pk.pocket(28, 36, 32)
pk.exit('S', 8, 10, 'sanctuaire'); pk.exit('E', 2, 5, 'pont')
pb = room('pont', 'Le Pont du Vent', 62, 2, 3)
pb.islands(14, 30); pb.put(40, 2, 'M'); pb.climb(44, 54, 2, 20, 47, 49); pb.put(8, 2, 'S'); pb.foes([34], 'c'); pb.deco()
pb.exit('W', 2, 5, 'secret'); pb.exit('E', 2, 5, 'tour'); pb.exit('S', 34, 36, 'centre'); pb.exit('N', 47, 49, 'suspendu')
pu = room('suspendu', 'Le Passage Suspendu', 64, 2, 4)
pu.islands(16, 32); pu.put(8, 2, 'S'); pu.foes([40, 46], 'ck'); pu.deco()
pu.wall(1, 2, 2, 5)
pu.exit('W', 2, 5, 'belvedere'); pu.exit('E', 2, 5, 'boss'); pu.exit('S', 46, 48, 'pont')
pq = room('belvedere', 'Le Belvédère', 48, 1, 4)
pq.put(10, 2, 'S'); pq.plat(24, 27, 3); pq.plat(28, 32, 4); pq.plat(34, 38, 6); pq.put(36, 7, 'C'); pq.foes([14, 40], 'ff'); pq.deco()
pq.exit('E', 2, 5, 'suspendu')
pn = room('boss', 'La Tour du Vent', 52, 3, 4)
pn.put(8, 2, 'S'); pn.put(38, 2, 'B'); pn.exit('W', 2, 5, 'suspendu')
pt = room('tour', 'La Tour en Ruine', 56, 3, 3)
pt.plat(22, 25, 3); pt.plat(26, 30, 4); pt.plat(32, 36, 6); pt.put(34, 7, 'C'); pt.foes([12, 18, 44, 50], 'cckh'); pt.deco()
pt.exit('W', 2, 5, 'pont'); pt.exit('S', 30, 32, 'cascade', opens='vent')
pv = room('cascade', 'La Cascade', 56, 3, 2)
pv.ceiling(1, 14, 14); pv.ceiling(28, 54, 14); pv.put(40, 2, 'S'); pv.climb(16, 26, 2, 20, 20, 22); pv.foes([6, 34, 48], 'cch')
pv.exit('W', 2, 5, 'centre'); pv.exit('E', 2, 5, 'caverne'); pv.exit('N', 20, 22, 'tour', gate='vent')
pe = room('caverne', 'La Caverne Cachée', 50, 4, 2)
pe.pit(10, 13); pe.plat(16, 19, 3); pe.plat(22, 26, 5); pe.put(24, 6, 'C'); pe.foes([34, 44], 'cc'); pe.deco()
pe.exit('W', 2, 5, 'cascade'); pe.exit('S', 38, 40, 'falaises')
pz = room('bas', 'Le Souterrain Profond', 58, 3, 1)
pz.ceiling(1, 56, 14); pz.islands(16, 30); pz.put(40, 2, 'S'); pz.foes([36, 46], 'cch'); pz.lever(52, 'falaises')
pz.exit('W', 2, 5, 'souterrain'); pz.exit('E', 2, 5, 'falaises')
pf = room('falaises', 'Les Falaises du Vent', 44, 4, 1)
pf.climb(8, 18, 2, 20, 10, 12); pf.put(16, 6, 'W'); pf.put(24, 2, 'S'); pf.foes([30, 38], 'ckf'); pf.deco()
pf.exit('W', 2, 5, 'bas'); pf.exit('N', 10, 12, 'caverne', gate='falaises')

# =====================================================================================================
# LE VILLAGE OUBLIÉ (chapitre 3) — une place centrale, des rues, des toits, des égouts ; le manoir du Roi Gélatine
# =====================================================================================================
CUR['zone'] = 'village'
va = room('place', 'La Place du Village', 60, 1, 1)
va.put(3, 2, 'P'); va.put(8, 2, 'S'); va.put(14, 2, 'N'); va.climb(26, 36, 2, 20, 30, 32); va.foes([22, 40, 50], 'cc'); va.deco()
va.exit('W', 2, 5, 'ruelles'); va.exit('E', 2, 5, 'marche'); va.exit('N', 30, 32, 'toits'); va.exit('S', 46, 48, 'egouts')
vr = room('ruelles', 'Les Ruelles Oubliées', 56, 0, 1)
vr.climb(36, 46, 2, 20, 40, 42); vr.pit(14, 18); vr.foes([8, 24, 30, 50], 'cckh'); vr.deco()
vr.exit('E', 2, 5, 'place'); vr.exit('N', 40, 42, 'maisons', gate='toit'); vr.exit('S', 24, 26, 'cave')
vm = room('marche', 'Le Marché Désert', 58, 2, 1)
vm.climb(8, 18, 2, 20, 12, 14); vm.pit(30, 34); vm.put(22, 2, 'S'); vm.foes([40, 48], 'ckf'); vm.deco(); vm.shelf(37, 41, 5, 39)
vm.exit('W', 2, 5, 'place'); vm.exit('N', 12, 14, 'clocher', gate='cloche'); vm.exit('S', 42, 44, 'crypte')
vh = room('maisons', 'Les Toits des Maisons', 56, 0, 2)
vh.plat(14, 17, 3); vh.plat(20, 24, 4); vh.plat(26, 30, 6); vh.put(28, 7, 'C'); vh.climb(40, 50, 2, 20, 44, 46); vh.foes([10, 36], 'cf'); vh.deco()
vh.exit('S', 20, 22, 'ruelles'); vh.exit('E', 2, 5, 'toits'); vh.exit('N', 44, 46, 'grenier')
vt = room('toits', 'Les Toits', 60, 1, 2)
vt.islands(14, 28); vt.climb(40, 50, 2, 20, 44, 46); vt.put(36, 2, 'S'); vt.foes([8, 54], 'ckf'); vt.deco()
vt.exit('W', 2, 5, 'maisons'); vt.exit('E', 2, 5, 'clocher'); vt.exit('S', 6, 8, 'place'); vt.exit('N', 44, 46, 'galerie')
vc = room('clocher', 'Le Clocher', 48, 2, 2)
vc.put(36, 2, 'M'); vc.foes([14], 'c'); vc.deco()
vc.exit('W', 2, 5, 'toits'); vc.exit('S', 20, 22, 'marche', opens='cloche')
vg = room('grenier', 'Le Grenier Secret', 40, 0, 3)
vg.plat(16, 20, 6); vg.put(18, 7, 'C'); vg.foes([10, 30], 'f'); vg.deco()
vg.exit('S', 8, 10, 'maisons')
ve = room('egouts', 'Les Égouts', 64, 1, 0)
ve.ceiling(1, 18, 14); ve.ceiling(26, 62, 14); ve.climb(16, 26, 2, 20, 20, 22); ve.foes([8, 34, 44, 54], 'cckh')
ve.exit('N', 20, 22, 'place'); ve.exit('W', 2, 5, 'cave'); ve.exit('E', 2, 5, 'crypte')
vv = room('cave', 'La Cave Oubliée', 50, 0, 0)
vv.ceiling(1, 18, 14); vv.ceiling(30, 48, 14); vv.climb(18, 30, 2, 20, 22, 24); vv.put(8, 2, 'S'); vv.on(40, 'C'); vv.foes([14, 44], 'cc')
vv.exit('E', 2, 5, 'egouts'); vv.exit('N', 22, 24, 'ruelles')
vy = room('crypte', 'La Crypte du Village', 54, 2, 0)
vy.ceiling(1, 18, 14); vy.ceiling(30, 52, 14); vy.climb(18, 30, 2, 20, 22, 24); vy.plat(40, 44, 6); vy.put(42, 7, 'C'); vy.foes([8, 34, 48], 'cch'); vy.lever(50, 'toit')
vy.exit('W', 2, 5, 'egouts'); vy.exit('N', 22, 24, 'marche')
vl = room('galerie', 'La Galerie du Manoir', 52, 1, 3)
vl.put(10, 2, 'S'); vl.foes([20, 30], 'cf'); vl.deco()
vl.exit('S', 38, 40, 'toits'); vl.exit('E', 2, 5, 'manoir')
vo = room('manoir', 'Le Manoir du Roi Gélatine', 52, 2, 3)
vo.put(8, 2, 'S'); vo.put(38, 2, 'B'); vo.exit('W', 2, 5, 'galerie')

# ---------- régions (titre affiché en changeant de région, couleur de la carte, pénombre) ----------
AREAS = {
    'racines': [('Les Racines Mousseuses', 0.0, ['entree', 'clairiere', 'gouffre', 'souche', 'chambre']),
                ('La Canopée', 0.0, ['canopee', 'raccourci', 'passage', 'cime', 'arene', 'hauteur']),
                ('Les Racines Profondes', 0.5, ['prof1', 'prof2', 'cavern', 'prof4', 'crypte', 'galerie'])],
    'plaines': [('Les Plaines', 0.0, ['entree', 'sanctuaire', 'camp', 'gouffre', 'centre', 'cascade']),
                ('La Tour du Vent', 0.1, ['pont', 'suspendu', 'belvedere', 'boss', 'tour', 'secret']),
                ('Le Souterrain', 0.5, ['souterrain', 'bas']),
                ('Les Falaises du Vent', 0.15, ['falaises', 'caverne'])],
    'village': [('La Place du Village', 0.05, ['place', 'ruelles', 'marche']),
                ('Les Toits', 0.0, ['maisons', 'toits', 'clocher', 'grenier', 'galerie', 'manoir']),
                ('Les Souterrains', 0.5, ['egouts', 'cave', 'crypte'])],
}
for _zn, _lst in AREAS.items():
    for _name, _dark, _ids in _lst:
        for _i in _ids: ZONES[_zn][_i].area, ZONES[_zn][_i].dark = _name, _dark
    assert all(r.area for r in ZONES[_zn].values()), [r.id for r in ZONES[_zn].values() if not r.area]

def finish():
    for zn, rooms in ZONES.items():
        for r in rooms.values(): r.carve()
        for r in rooms.values():                      # zones d'arrivée sans ennemis (autour des trous/plafonds et des portes)
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
                back = [x for x in rooms[e['to'].split('/')[1]].exits if x['to'] == zn + '/' + r.id]
                assert back, ('lien non réciproque', zn, r.id, e['to'])
finish()

# ---------------- vérification d'accessibilité (physique approchée : saut 2.8, portée 5, double saut non compté) ---
def free(r, x, y): return 0 <= x < r.W and 0 <= y < r.H and r.g[y][x] != '#'
def support(r, x, y): return y >= 1 and r.g[y - 1][x] in '#=' if 0 <= x < r.W else False
def body(r, x, y): return free(r, x, y) and free(r, x, y + 1)
def explore(r, starts, up=2):
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
        while top < up + 1 and free(r, x, y + 1 + top) and r.g[y + 1 + top][x] != '#': top += 1
        for dx in range(-5, 6):
            for dy in range(-12, up + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < r.W and 0 <= ny < r.H and support(r, nx, ny) and body(r, nx, ny) and (dy <= 0 or top >= dy):
                    if all(free(r, x + int(dx * t / 6), max(y, ny) + 1) for t in range(1, 6)) or dy <= 0: st.append((nx, ny))
        if y >= r.H - 4: exits_used.add(('N', x))
    return seen, exits_used

def check(zn, start):
    rooms = ZONES[zn]; flags = set()
    entries = {start[0]: [start[1]]}
    reach = {}
    for _ in range(60):
        changed = False
        for rid in list(entries):
            r = rooms[rid]; seen, used = explore(r, entries[rid])
            reach[rid] = seen
            for (lx, ly, lf) in r.levers:
                if lf not in flags and any((lx + dx, ly) in seen for dx in (-1, 0, 1)): flags.add(lf); changed = True
            for e in r.exits:
                if e.get('gate') and e['gate'] not in flags: continue
                to = e['to'].split('/')[1]; t = rooms[to]; go = False; land = []
                back = [b for b in t.exits if b['to'] == zn + '/' + rid][0]
                if e['side'] in 'EW':
                    go = any(x >= r.W - 2 if e['side'] == 'E' else x <= 1 for (x, y) in seen if e['y0'] <= y <= e['y1'])
                    land = [(1 if e['side'] == 'E' else t.W - 2, back['y0'])]
                elif e['side'] == 'N':
                    go = any(sd == 'N' and e['x0'] <= x <= e['x1'] for sd, x in used)
                    land = [(x, 2) for x in range(back['x0'] - 3, back['x1'] + 4) if 0 < x < t.W and support(t, x, 2) and body(t, x, 2)]
                else:
                    go = any(sd == 'S' and e['x0'] <= x <= e['x1'] for sd, x in used) or any(e['x0'] <= x <= e['x1'] and y <= 2 for x, y in seen if not support(r, x, y))
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
                    new = [q for q in land2 if q not in cur]
                    if new: cur.extend(new); changed = True
        if not changed: break
    return entries, reach, flags, [r for r in rooms if r not in entries]

def exit_report(zn, entries):
    """sorties jamais franchissables à pied depuis les points d'arrivée connus (hors double saut) — les portes à drapeau comptent comme ouvertes."""
    rooms, bad = ZONES[zn], []
    for rid, r in rooms.items():
        seen, used = explore(r, entries.get(rid, []))
        for e in r.exits:
            if e['side'] in 'EW': go = any(x >= r.W - 2 if e['side'] == 'E' else x <= 1 for (x, y) in seen if e['y0'] <= y <= e['y1'])
            elif e['side'] == 'N': go = any(sd == 'N' and e['x0'] <= x <= e['x1'] for sd, x in used)
            else: go = any(sd == 'S' and e['x0'] <= x <= e['x1'] for sd, x in used) or any(e['x0'] <= x <= e['x1'] and y <= 2 for x, y in seen if not support(r, x, y))
            if not go: bad.append((rid, e['side'], e['to'].split('/')[1]))
    return bad

START = {'racines': ('entree', (3, 2)), 'plaines': ('entree', (3, 2)), 'village': ('place', (3, 2))}
NEEDS_DOUBLE_JUMP = {'racines': {'hauteur'}, 'plaines': set(), 'village': {'grenier', 'crypte'}}
FILES = {'racines': ('rooms_racines.js', 'Racines Mousseuses'), 'plaines': ('rooms_plaines.js', 'Plaines du Vent'), 'village': ('rooms_village.js', 'Village Oublié')}

if __name__ == '__main__':
    rle = lambda r: re.sub(r'(.)\1+', lambda mo: mo.group(1) + str(len(mo.group(0))), r)
    ok = True
    for zn, rooms in ZONES.items():
        entries, reach, flags, missing = check(zn, START[zn])
        bad = []
        for rid, r in rooms.items():
            if rid not in reach: continue
            for y in range(r.H):
                for x in range(r.W):
                    if r.g[y][x] in 'CSMBDW' and not any((x + dx, y) in reach[rid] for dx in (-1, 0, 1)) and rid not in NEEDS_DOUBLE_JUMP[zn] and (x, y) not in r.gated: bad.append((rid, r.g[y][x], x, y))
            for (lx, ly, lf) in r.levers:
                if not any((lx + dx, ly) in reach[rid] for dx in (-1, 0, 1)): bad.append((rid, 'levier inaccessible', lx, ly))
            for (x, y) in r.gated:   # étagères : inaccessibles à pied, accessibles avec le double saut
                seen_dj, _ = explore(r, [q for q in entries[rid]], up=5)
                if any((x + dx, y) in reach[rid] for dx in (-1, 0, 1)): bad.append((rid, 'étagère trop basse', x, y))
                elif not any((x + dx, y) in seen_dj for dx in (-1, 0, 1)): bad.append((rid, 'étagère hors de portée du double saut', x, y))
        print(f'[{zn}] {len(rooms)} salles | drapeaux {sorted(flags)} | non atteintes : {missing or "aucune"} | objets inaccessibles : {bad or "aucun"}')
        blocked = exit_report(zn, entries)
        print('   sorties non franchissables à pied :', blocked or 'aucune')
        ok &= not missing and not bad
        fn, title = FILES[zn]
        out = [f"// Labyrinthe : {title} — généré par tools/make_world.py (ne pas éditer à la main). Voir monde.md.", "import { decode } from './rle.js';", "", "export const ROOMS = {"]
        for rid, r in rooms.items():
            extra = (f" levers: {json.dumps([list(l) for l in r.levers])}," if r.levers else '') + (f" shelves: {json.dumps([list(g) for g in r.gated])}," if r.gated else '')
            txt = ',\n'.join(f"      '{rle(row)}'" for row in r.rows())
            out.append(f"  '{zn}/{rid}': {{ name: {json.dumps(r.name, ensure_ascii=False)}, gx: {r.gx}, gy: {r.gy}, area: {json.dumps(r.area, ensure_ascii=False)}, dark: {r.dark}, exits: {json.dumps(r.exits)},{extra}\n    map: decode([\n{txt},\n    ]) }},")
        out.append("};\n")
        open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'levels', fn), 'w', encoding='utf-8').write('\n'.join(out))
    sys.exit(0 if ok else 1)
