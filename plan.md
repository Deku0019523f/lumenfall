# Plan détaillé — Lumenfall

Metroidvania 2D d'action-aventure (Three.js, caméra orthographique), jouable sur Android via Capacitor, **en mode paysage**.

## Choix de conception
- Style : 2D dessiné/pixel mêlés (packs d'assets fournis : sorcier bleu, slimes, plantes, tilesets Mossy / Mondstadt / Village)
- Univers : fantasy original
- Mode : solo, exploration, progression **par chapitres** (une nouvelle carte par chapitre), boss difficiles à phases

## Chapitres (une carte longue, un thème, un PNJ, un mini-boss, un boss chacun)
| # | Titre | Carte | Ennemis | PNJ | Mini-boss | Boss | Orbe |
|---|-------|-------|---------|-----|-----------|------|------|
| 1 | Les Racines Mousseuses | ≈336x18 | slime vert, spore | Mousse l'Ancien | Le Gardien du Pont | La Gardienne des Racines | double saut |
| 2 | Les Plaines du Vent | ≈414x18 | slime orange, spore | Zéphyr | La Sentinelle du Vent | Le Souffle Ancien | saut mural (+ 2 tours à saut mural) |
| 3 | Le Village Oublié | ≈494x18 | slimes, spores (nombreux) | Mirelle | Le Veilleur Gelé | Le Roi Gélatine | — |

Règle : aucune capacité n'est obligatoire pour finir un chapitre (fossés ≤ 4 tuiles, marches ≤ 2). Double saut et saut mural ouvrent des coffres optionnels.
Ajouter un chapitre : `build(...)` dans `tools/make_maps.py` → `npm run maps` → une entrée dans `src/levels/chapters.js` (+ `STORY` dans `src/story/story.js`).

## Éclats, compétences, quêtes
- Éclats ✦ : 2 par ennemi (× multiplicateur du chapitre), 10 par coffre, 25-40 par mini-boss, 40 par boss, + récompenses de quêtes.
- 12 compétences (src/systems/Skills.js) : Lame (Lame vive, Tranchant, Quatrième souffle, Onde de lame), Ombre (Éclair, Pas du vent, Dash aérien, Dash spectral), Lumière (Réserve, Armure, Soif de lumière, Nova). Coût total ≈ 196 ✦.
- Quêtes (src/story/story.js + src/systems/Quests.js) : activées en parlant au PNJ du chapitre ; types talk / kill / chest / orb / mini / boss.

## Structure des fichiers

```
lumenfall/
├── index.html                 # Canvas, HUD tactile, menus/dialogues (styles), message « tourner le téléphone », importmap three (CDN), window.enterGame()
├── package.json               # three, gsap, howler, capacitor, vite — scripts dev/build/cap:*/maps
├── vite.config.js             # publicDir:false (assets copié par tools/copy-assets.mjs)
├── capacitor.config.json      # appId com.premium225.lumenfall
├── RAPPORT.md / plan.md       # mémoire du projet
├── tools/
│   ├── build_assets.py        # zips bruts → bandes de sprites + tilesets 3x3 (assets/)
│   ├── make_maps.py           # génère src/levels/chapterN.js (cartes ASCII, segments + graine fixe)
│   └── copy-assets.mjs        # copie assets/ vers dist/assets/ après le build
├── src/
│   ├── main.js                # boot async, boucle de jeu (hit-stop, pause menu/dialogue), sauvegarde v3, chapitres, ?chapitre=N
│   ├── assets/
│   │   ├── manifest.js        # liste des bandes de sprites, tilesets, fonds (+ nb de frames)
│   │   └── Assets.js          # chargement parallèle ; image absente → null (repli sprites dessinés)
│   ├── engine/
│   │   ├── renderer.js · camera.js (suivi, secousse, zoom d'impact) · physics.js
│   │   └── SpriteAnim.js      # animation d'une bande horizontale de frames
│   ├── player/  (Player [stats], Movement [dash/air-dash/fente], Combat [appui+buffer, combo, chargé, nova, projectiles], Animations)
│   ├── enemies/ (Enemy, Crawler = slime, Flyer = spore)
│   ├── bosses/  (Boss configurable : nom, vie, sprite, taille ; sert aussi aux mini-boss)
│   ├── world/
│   │   ├── Level.js           # carte ASCII → autotile 3x3 par thème, plateformes, pics, décor animé
│   │   ├── Background.js      # fond à parallaxe (image)
│   │   └── World.js           # charge/nettoie un chapitre (ennemis, boss, mini-boss, PNJ, objets, fond)
│   ├── levels/
│   │   ├── chapters.js        # définition des chapitres (thème, ennemis, mini-boss, boss)
│   │   ├── rle.js             # décodeur des cartes compressées (RLE)
│   │   └── chapter1.js … chapter3.js   # cartes générées, lignes en RLE (ne pas éditer à la main)
│   ├── objects/ (Interactables : S/D/W/C ; Shards : éclats ✦ ; Npc : PNJ 'N')
│   ├── story/story.js         # textes FR : intro, épilogue, PNJ, quêtes, arrivées, intros/outros de boss
│   ├── ui/ (Input, HUD [vie, énergie, ✦, quête], Dialogue [machine à écrire], Menu [démarrage/pause/compétences/quêtes])
│   ├── audio/                 # (vide) Howler.js à brancher
│   └── systems/ (Effects [additifs : croissant, étincelles, anneaux, chiffres], Skills, Quests, SaveSystem)
└── assets/                    # images générées par tools/build_assets.py (≈ 2,5 Mo)
    ├── characters/ hero_{idle,walk,jump,dash}.png
    ├── enemies/    slime_green, slime_orange, spore, boss_poison, boss_wind
    ├── effects/    plant1, plant4, blueflower (décors animés)
    ├── maps/       tiles_mossy, tiles_mond, tiles_village (3x3 tranches de 64 px)
    └── backgrounds/ windrise.jpg
```

## Légende des cartes
`#` solide · `=` plateforme traversable · `^` pics · `P` départ · `c` slime · `f` spore volante · `S` sauvegarde · `C` coffre · `D` orbe double saut · `W` orbe saut mural · `B` boss · `M` mini-boss · `N` PNJ · décor : `p` plante, `q` tige, `b` fleur bleue

## Contrôles
- Tactile : joystick gauche, SAUT, ATTAQUE (appui = coup immédiat ; maintenir après le coup puis relâcher = chargée), DASH, SPÉC., II = pause
- Clavier : flèches/ZQSD, Espace/K saut, J attaque, L/Maj dash, U spécial, Échap pause (Bas + U = Nova si débloquée)
- Haut + attaque = coup vers le haut ; bas + attaque en l'air = coup plongeant (rebond sur ennemi)
- Test direct d'un chapitre : `index.html?chapitre=2` (sans menu ni sauvegarde)

## Feuille de route (10 étapes)
1. Personnage et animations — fait (sorcier bleu animé : idle, marche, saut, dash)
2. Déplacements, sauts, collisions — fait
3. Système de combat — fait (v2 : appui, buffer, hit-stop, effets)
4. Ennemis — fait (slimes, spores, 3 boss + 3 mini-boss)
5. Environnements — fait pour 3 chapitres longs (3 tilesets, fonds, décors animés)
6. Caméra et exploration — fait (cartes séparées par chapitre ; pas encore de zones reliées entre elles)
7. Boss et compétences — fait (3 boss, 3 mini-boss, 12 compétences, double saut, saut mural)
8. Interface Android — menus de démarrage/pause, dialogues, quêtes (paysage + plein écran ; commandes non personnalisables)
9. Sauvegarde et progression — fait (v3 : chapitre, point de sauvegarde, vie max, capacités, coffres, éclats, compétences, quêtes)
10. Optimisation et export APK — à faire
