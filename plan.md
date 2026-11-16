# Plan détaillé — Lumenfall

Metroidvania 2D d'action-aventure (Three.js, caméra orthographique), jouable sur Android via Capacitor, **en mode paysage**.

## Choix de conception
- Style : 2D dessiné/pixel mêlés (packs d'assets fournis : sorcier bleu, slimes, plantes, tilesets Mossy / Mondstadt / Village)
- Univers : fantasy original
- Mode : solo, exploration, progression **par chapitres** (une nouvelle carte par chapitre), boss difficiles à phases

## Chapitres (une carte, un thème, un boss chacun)
| # | Titre | Carte | Tileset | Ennemis | Boss | Récompense |
|---|-------|-------|---------|---------|------|-----------|
| 1 | Les Racines Mousseuses | 96x14 | Mossy | slime vert, spore | La Gardienne des Racines (plante empoisonnée) | orbe double saut, 1 coffre |
| 2 | Les Plaines du Vent | 116x17 | Mondstadt | slime orange, spore | Le Souffle Ancien (plante du vent) | orbe saut mural, 1 coffre (tour à saut mural) |
| 3 | Le Village Oublié | 124x17 | Village (props) | slimes, spores (plus nombreux) | Le Roi Gélatine (slime géant) | 2 coffres |

Règle : aucune capacité n'est obligatoire pour finir un chapitre (fossés ≤ 4 tuiles, marches ≤ 2). Double saut et saut mural ouvrent des coffres optionnels.
Ajouter un chapitre : carte dans `tools/make_maps.py` → `npm run maps` → une entrée dans `src/levels/chapters.js`.

## Structure des fichiers

```
lumenfall/
├── index.html                 # Canvas, HUD tactile, écran JOUER, message « tourner le téléphone », importmap three (CDN)
├── package.json               # three, gsap, howler, capacitor, vite — scripts dev/build/cap:*/maps
├── vite.config.js             # publicDir:false (assets copié par tools/copy-assets.mjs)
├── capacitor.config.json      # appId com.premium225.lumenfall
├── RAPPORT.md / plan.md       # mémoire du projet
├── tools/
│   ├── build_assets.py        # zips bruts → bandes de sprites + tilesets 3x3 (assets/)
│   ├── make_maps.py           # génère src/levels/chapterN.js (cartes ASCII)
│   └── copy-assets.mjs        # copie assets/ vers dist/assets/ après le build
├── src/
│   ├── main.js                # boot async, boucle de jeu, sauvegarde v2, fin de chapitre / transitions, ?chapitre=N
│   ├── assets/
│   │   ├── manifest.js        # liste des bandes de sprites, tilesets, fonds (+ nb de frames)
│   │   └── Assets.js          # chargement parallèle ; image absente → null (repli sprites dessinés)
│   ├── engine/
│   │   ├── renderer.js · camera.js · physics.js
│   │   └── SpriteAnim.js      # animation d'une bande horizontale de frames
│   ├── player/  (Player, Movement, Combat, Animations)
│   ├── enemies/ (Enemy, Crawler = slime, Flyer = spore)
│   ├── bosses/  (Boss configurable : nom, vie, sprite, taille)
│   ├── world/
│   │   ├── Level.js           # carte ASCII → autotile 3x3 par thème, plateformes, pics, décor animé
│   │   ├── Background.js      # fond à parallaxe (image)
│   │   └── World.js           # charge/nettoie un chapitre (ennemis, boss, objets, fond)
│   ├── levels/
│   │   ├── chapters.js        # définition des chapitres (thème, ennemis, boss)
│   │   └── chapter1.js … chapter3.js   # cartes générées (ne pas éditer à la main)
│   ├── objects/Interactables.js   # sauvegarde, orbes (D double saut, W saut mural), coffres (persistants)
│   ├── ui/ (Input, HUD : vie, énergie, titres de chapitre, fondu)
│   ├── audio/                 # (vide) Howler.js à brancher
│   └── systems/ (Effects, SaveSystem)
└── assets/                    # images générées par tools/build_assets.py (≈ 2,5 Mo)
    ├── characters/ hero_{idle,walk,jump,dash}.png
    ├── enemies/    slime_green, slime_orange, spore, boss_poison, boss_wind
    ├── effects/    plant1, plant4, blueflower (décors animés)
    ├── maps/       tiles_mossy, tiles_mond, tiles_village (3x3 tranches de 64 px)
    └── backgrounds/ windrise.jpg
```

## Légende des cartes
`#` solide · `=` plateforme traversable · `^` pics · `P` départ · `c` slime · `f` spore volante · `S` sauvegarde · `C` coffre · `D` orbe double saut · `W` orbe saut mural · `B` boss · décor : `p` plante, `q` tige, `b` fleur bleue

## Contrôles
- Tactile : joystick gauche, SAUT, ATTAQUE (maintenir = chargée), DASH, SPÉC.
- Clavier : flèches/ZQSD, Espace/K saut, J attaque, L/Maj dash, U spécial
- Haut + attaque = coup vers le haut ; bas + attaque en l'air = coup plongeant (rebond sur ennemi)
- Test direct d'un chapitre : `index.html?chapitre=2` (sans sauvegarde)

## Feuille de route (10 étapes)
1. Personnage et animations — fait (sorcier bleu animé : idle, marche, saut, dash)
2. Déplacements, sauts, collisions — fait
3. Système de combat — fait
4. Ennemis — fait (slimes, spores, 3 boss)
5. Environnements — fait pour 3 chapitres (3 tilesets, fonds, décors animés)
6. Caméra et exploration — fait (cartes séparées par chapitre ; pas encore de zones reliées entre elles)
7. Boss et compétences — fait (3 boss, double saut, saut mural)
8. Interface Android — partiel (paysage + plein écran ; commandes non personnalisables)
9. Sauvegarde et progression — fait (chapitre, point de sauvegarde, vie max, capacités, coffres ramassés)
10. Optimisation et export APK — à faire
