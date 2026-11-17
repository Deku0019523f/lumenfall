# Plan détaillé — Lumenfall

Metroidvania 2D d'action-aventure (Three.js, caméra orthographique), jouable sur Android via Capacitor, **en mode paysage**.

## Choix de conception
- Style : 2D dessiné/pixel mêlés (packs d'assets fournis : héros Hooded Seeker, slimes, plantes, tilesets Mossy / Mondstadt / Village, portails Pixel Portal)
- Univers : fantasy original
- Mode : solo, exploration, progression **par chapitres** (une nouvelle carte par chapitre), boss difficiles à phases

## Chapitres (une carte longue, un thème, un PNJ, un mini-boss, un boss chacun)
| # | Titre | Carte | Ennemis | PNJ | Mini-boss | Boss | Orbe | Portail |
|---|-------|-------|---------|-----|-----------|------|------|---------|
| 1 | Les Racines Mousseuses | ≈604x18 | slime vert, spore, cracheur, sauteur | Mousse l'Ancien | Le Gardien du Pont | La Gardienne des Racines | double saut | bleu |
| 2 | Les Plaines du Vent | ≈736x18 | slime orange, spore, cracheur, sauteur, esprit, brute | Zéphyr | La Sentinelle du Vent | Le Souffle Ancien | saut mural (+ 2 tours à saut mural) | jaune |
| 3 | Le Village Oublié | ≈888x18 | tous les types (nombreux) | Mirelle | Le Veilleur Gelé | Le Roi Gélatine | — | rouge |

Boss (attaques, `moves` dans chapters.js) : ch1 racines/volée/invocation/charge ; ch2 rafale/lames/bond/nova/charge ; ch3 saut/multi-bond/pluie/invocation/charge/nova. Cartes : grottes (plafond bas + coffre), paliers (escalier de plateformes + coffre), 11 à 15 coffres.

Portails : 2 paires T↔t par chapitre (raccourcis, à découvrir des deux côtés puis HAUT pour entrer), un portail de sortie qui s'ouvre à la mort du boss, un portail d'arrivée au début de chaque chapitre.

Règle : aucune capacité n'est obligatoire pour finir un chapitre (fossés ≤ 4 tuiles, marches ≤ 2). Double saut et saut mural ouvrent des coffres optionnels.
Ajouter un chapitre : `build(...)` dans `tools/make_maps.py` → `npm run maps` → une entrée dans `src/levels/chapters.js` (+ `STORY` dans `src/story/story.js`).

## Éclats, compétences, quêtes
- Éclats ✦ : 2 par ennemi (× multiplicateur du chapitre), 10 par coffre, 25-40 par mini-boss, 40 par boss, + récompenses de quêtes.
- 12 compétences en **arbre de nœuds** (src/systems/Skills.js : `pos`, `req`, racine `ROOT` ; rendu SVG dans ui/Menu.js) : Lame (Lame vive, Tranchant, Quatrième souffle, Onde de lame), Ombre (Éclair, Pas du vent, Dash aérien, Dash spectral), Lumière (Réserve, Armure, Soif de lumière, Nova). Coût total ≈ 196 ✦.
- Quêtes (src/story/story.js + src/systems/Quests.js) : activées en parlant au PNJ du chapitre ; types talk / kill / chest / orb / mini / boss.

## Structure des fichiers

```
lumenfall/
├── index.html                 # Canvas, HUD tactile, CSS des menus, message « tourner le téléphone », importmap three (CDN)
├── package.json               # three, gsap, howler, capacitor, vite — scripts dev/build/cap:*/maps
├── vite.config.js             # publicDir:false (assets copié par tools/copy-assets.mjs)
├── capacitor.config.json      # appId com.premium225.lumenfall
├── RAPPORT.md / plan.md       # mémoire du projet
├── tools/
│   ├── build_assets.py        # zips bruts → bandes de sprites + tilesets 3x3 (assets/)
│   ├── make_maps.py           # génère src/levels/chapterN.js (cartes ASCII)
│   └── copy-assets.mjs        # copie assets/ vers dist/assets/ après le build
├── src/
│   ├── main.js                # boot async, boucle de jeu (hit-stop, pause menu/dialogue), sauvegarde v3, chapitres, portail de sortie, ?chapitre=N
│   ├── assets/
│   │   ├── manifest.js        # liste des bandes de sprites (Seeker, portails…), tilesets, fonds (+ nb de frames)
│   │   └── Assets.js          # chargement parallèle ; image absente → null (repli sprites dessinés)
│   ├── engine/
│   │   ├── renderer.js · camera.js · physics.js
│   │   └── SpriteAnim.js      # animation d'une bande horizontale de frames
│   ├── player/  (Player [stats, fige pendant un portail], Movement [dash/air-dash/fente/saut mural alterné], Combat [appui+buffer, combo, chargé, nova, projectiles], Animations [Seeker : feet par anim, repli sorcier/procédural])
│   ├── enemies/ (Enemy, Crawler = slime, Flyer = spore, Variants = Cracheur/Sauteur/Esprit/Brute, shots = projectiles ennemis)
│   ├── bosses/  (Boss : mouvements `moves` par chapitre/phase)
│   ├── world/
│   │   ├── Level.js           # carte ASCII → autotile 3x3 par thème, plateformes, pics, décor animé
│   │   ├── Background.js      # fond à parallaxe (image)
│   │   └── World.js           # charge/nettoie un chapitre (ennemis, boss, portails, objets, fond)
│   ├── levels/
│   │   ├── chapters.js        # définition des chapitres (thème, ennemis, boss, couleur de portail)
│   │   ├── rle.js             # décodeur des cartes compressées (RLE)
│   │   └── chapter1.js … chapter3.js   # cartes générées, lignes en RLE (ne pas éditer à la main)
│   ├── objects/ (Interactables : S/D/W/C ; Shards : éclats ✦ ; Npc : PNJ 'N' ; Portals : paires T/t, sortie de chapitre, arrivée)
│   ├── story/story.js         # textes FR : intro, épilogue, PNJ, quêtes, arrivées, intros/outros de boss
│   ├── ui/ (Input, HUD [vie, énergie, ✦, quête], Dialogue [machine à écrire], Menu [démarrage style Slumber's Tale, options, crédits, pause, arbre de compétences SVG, quêtes])
│   ├── audio/Music.js         # musique procédurale (Web Audio) par chapitre/boss/menu + effets sonores, volumes
│   └── systems/ (Effects [additifs : croissant, étincelles, anneaux, chiffres], Skills, Quests, SaveSystem, Hazards [zones de danger des boss])
└── assets/                    # images générées par tools/build_assets.py (≈ 2,5 Mo) — à ajouter à la main sur GitHub
    ├── characters/ seeker_{idle,run,jump,attack,hurt,death}.png (Hooded Seeker Lite) + hero_* (ancien sorcier, repli)
    ├── enemies/    slime_green, slime_orange, spore, boss_poison, boss_wind
    ├── effects/    plant1, plant4, blueflower (décors animés), portal_{blue,yellow,red} (pack Pixel Portal, 21 images de 64 px)
    ├── maps/       tiles_mossy, tiles_mond, tiles_village (3x3 tranches de 64 px)
    └── backgrounds/ windrise.jpg
```

## Légende des cartes
`#` solide · `=` plateforme traversable · `^` pics · `P` départ · `c` slime · `f` spore volante · `k` cracheur · `h` sauteur · `w` esprit volant · `r` brute · `S` sauvegarde · `C` coffre · `D` orbe double saut · `W` orbe saut mural · `B` boss · `T`/`t` portails appariés (le i-ème T avec le i-ème t ; le dernier `t` est dans l'arène) · `M` mini-boss · `N` PNJ · décor : `p` plante, `q` tige, `b` fleur bleue

## Contrôles
- Tactile : joystick gauche, SAUT, ATTAQUE (appui = coup immédiat ; maintenir après le coup puis relâcher = chargée), DASH, SPÉC., II = pause
- Clavier : flèches/ZQSD, Espace/K saut, J attaque, L/Maj dash, U spécial, Échap pause (Bas + U = Nova si débloquée)
- Haut + attaque = coup vers le haut ; bas + attaque en l'air = coup plongeant (rebond sur ennemi) ; HAUT devant un portail = entrer
- Test direct d'un chapitre : `index.html?chapitre=2` (sans sauvegarde)

## Feuille de route (10 étapes)
1. Personnage et animations — fait (Hooded Seeker : idle, course, saut, attaque, dégâts, mort)
2. Déplacements, sauts, collisions — fait
3. Système de combat — fait
4. Ennemis — fait (6 types d'ennemis, 3 boss + 3 mini-boss à attaques propres)
5. Environnements — fait pour 3 chapitres (3 tilesets, fonds, décors animés)
6. Caméra et exploration — fait (cartes séparées par chapitre, reliées par portails ; raccourcis T/t)
7. Boss et compétences — fait (3 boss, double saut, saut mural)
8. Interface Android — menus de démarrage/pause, dialogues, quêtes (paysage + plein écran ; commandes non personnalisables)
9. Sauvegarde et progression — fait (chapitre, point de sauvegarde, vie max, capacités, coffres et portails découverts)
10. Optimisation et export APK — à faire
11. Musique et sons — fait (procédural) ; menu/arbre refaits — fait (v0.4.0) ; portails — fait
