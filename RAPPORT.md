# RAPPORT — Lumenfall

## Objectif du projet
Jeu Android d'action-aventure 2D de type Metroidvania (inspiré de Hollow Knight: Silksong), rendu avec Three.js (caméra orthographique), commandes tactiles, exportable en APK via Capacitor.

## Stack et technologies
- Three.js (rendu 2D, caméra orthographique), JavaScript ES modules (chargé depuis un CDN via importmap pour GitHub Pages, depuis node_modules avec Vite)
- Python 3 + Pillow pour les outils (`tools/build_assets.py`, `tools/make_maps.py`, `tools/build_bat.py`, `tools/build_monsters.py`, `tools/build_botwheel.py`)
- Vite (dev/build), Capacitor 6 (Android)
- Audio : **Web Audio procédural** (`src/audio/Music.js`, aucun fichier son) ; GSAP et Howler.js déclarés dans package.json mais **non utilisés**
- Sauvegarde : localStorage (SQLite prévu)

## Architecture et structure des fichiers
Voir `plan.md` (arborescence détaillée et rôle de chaque fichier). Ennemis : voir `bestiaire.md`. Monde interconnecté prévu : `monde.md`. Packs d'assets : `assets-packs.md`.

## Fonctionnalités développées
- Moteur : renderer, caméra avec suivi lissé et secousses, physique AABB sur grille
- Joueur : course, saut variable (coyote time + buffer), double saut (débloqué par orbe), dash avec invincibilité, glissade/saut mural (débloqué par l'orbe du chapitre 2), descente des plateformes
- Combat v2 (fluide et percutant) : attaque déclenchée **à l'appui** (buffer 0,18 s), combo 3 coups (4 avec compétence), fente vers l'avant, attaque chargée (maintenir après le coup puis relâcher), coup haut/bas avec rebond, spéciale (projectile, 3 énergie). Impact : hit-stop, croissant de lame additif qui suit le joueur, étincelles, anneaux, lueurs, chiffres de dégâts, zoom/secousse de caméra, recul + écrasement des ennemis, poussière au dash/atterrissage
- Compétences (12, 3 branches Lame/Ombre/Lumière) achetées avec les **étincelles** ✦ (dropées par ennemis, coffres, quêtes, boss), menu pause → Compétences
- Histoire (INTRO, arrivée de chapitre, PNJ Mousse/Zéphyr/Mirelle, intro de boss, épilogue) et **quêtes** par chapitre (talk/kill/chest/orb/mini/boss) avec récompenses, suivi à l'écran, persistance
- Menus (v0.4, style « Slumber's Tale ») : titre doré italique aligné à gauche, entrées en texte seul, faisceau de lumière + poussières + vignette ; Continuer / Nouvelle partie / Chapitres / Options / Comment jouer / Crédits ; pause : Reprendre, Compétences, Quêtes, Options, Menu principal, Effacer
- **Arbre de compétences en nœuds** (SVG, `Menu.js` + `Skills.js`)
- **Musique et sons** procéduraux : un thème par chapitre, mini-boss, boss, menu ; effets ; réglages sauvegardés (clé `lumenfall.audio`)
- **Héros « Hooded Seeker »** (Primitive Pixels, Lite, palette Void) : idle, course, saut, attaque, dégâts, mort ; point d'appui (feet) par animation ; repli sur l'ancien sorcier puis sur le dessin procédural
- **Bestiaire** (v0.4.3, `src/enemies/Bestiary.js`, voir `bestiaire.md`) : catalogue central de tous les ennemis ordinaires ; les lettres de la carte (c f k h w r) sont des emplacements, chaque chapitre choisit qui les occupe via `roster` (chapters.js). Ennemis : slime, slime orangé, rat, spore, chauve-souris, grande chauve-souris, cracheur, sauteur, esprit, brute, **ver de feu** (crache une boule de feu animée), **mimic** (coffre qui s'ouvre et poursuit)
- **Animations d'ennemis par états** (`Enemy.js`) : idle / move / attack / hurt / death (+ closed/opening pour le mimic) ; l'IA règle `this.want` ; `hurt` automatique ; mort jouée en entier puis fondu (`game.corpses`) ; projectiles avec bande animée (`shots.js`) ; repli (`skin.fallback`) si les images manquent
- **Boss à attaques propres** (`bosses/Boss.js`, `moves` par boss dans chapters.js) : racines, invocation, rafale de vent, lames, pluie, nova, bonds, volée, charge ; phases ; zones de danger (`systems/Hazards.js`)
- **Portails** (pack « Pixel Portal Update 2 » ; `objects/Portals.js`) : paires `T` ↔ `t`, portail de sortie après le boss, portail d'arrivée ; découvertes sauvegardées
- Saut mural durci : il faut pousser vers le mur et **alterner les murs**
- **Chapitres longs et grands** : 3 cartes générées par segments (≈604x18, 736x18, 888x18 ; 11 à 15 coffres), points de sauvegarde, grottes, paliers, tours à saut mural, coffres secrets, un mini-boss au milieu et un boss à la fin ; chacune avec tileset, fond à parallaxe, plantes animées, ennemis, boss
- Monde : pics, plateformes, points de sauvegarde, coffres (+1 vie max, persistants), orbes (D double saut ch.1, W saut mural ch.2)
- Interface : joystick, 4 boutons, vie en masques, barre d'énergie, barre de boss, messages ; clavier pour tester sur PC
- Sauvegarde v3 (localStorage ; v2 acceptée)
- Test direct d'un chapitre : `?chapitre=2`

## Fonctionnalités restantes
- Monde interconnecté façon Hollow Knight (voir `monde.md` : zones, salles, verrous, carte du monde, sauvegarde v4) — non commencé
- **Boss final L'Ombre Éternelle** (avatar = pack Bot Wheel, bandes `ombre_*` prêtes) — zone des Ombres pas encore construite
- Décor animé (pack Plants Animated) et tileset de grottes (pack Cave) : non convertis (voir `assets-packs.md`)
- Mimic en vrai coffre (pour l'instant il occupe un emplacement `h` du chapitre 3)
- Sprites de coffre/orbes/sauvegarde/PNJ (formes lumineuses simples) ; animations Seeker manquantes (dash, saut mural, double saut, cast)
- Vrais fichiers audio ; commandes tactiles personnalisables ; équilibrage ; SQLite ; APK

## Modifications importantes
- v0.1.0 : projet créé (une zone).
- v0.2.0 : chapitres (`World`, `chapters.js`), 3 cartes générées, vrais sprites, autotile, fonds, décors animés, boss configurables, sauvegarde v2.
- v0.3.0 : combat refait, compétences + étincelles, histoire/quêtes/dialogues/PNJ, menus, mini-boss, générateur de cartes par segments, sauvegarde v3.
- v0.4.0 : portails, héros Seeker, musique/sons, monstres, boss à mouvements, cartes agrandies, menu et arbre de compétences refaits, saut mural durci.
- v0.4.2 : histoire adaptée (fragments = les 7 morceaux de la Flamme ; étincelles = monnaie).
- v0.4.3 : **bestiaire** (Bestiary.js, roster par chapitre), animations d'ennemis par états, cadavres animés, projectiles animés, nouveaux ennemis (rat, chauve-souris x2, ver de feu, mimic) — packs Dark Fantasy Enemies, Monsters Creatures Fantasy 2, Fire Worm ; manifest.js : `ENEMY_SHEETS`.

## Problèmes rencontrés et solutions
- Réseau désactivé dans l'environnement de développement : pas de `npm install`, donc **le jeu n'a pas été lancé dans un navigateur** par l'assistant. Vérifications faites : syntaxe (`node --check`), test de fumée Node avec un faux `three` (chargement des 3 chapitres avec et sans images, traversée, boss, portails, sauvegarde, et un scénario `bestiary` : chaque ennemi créé, animé, tué ; cadavres retirés).
- Latence d'attaque (v0.2) : l'attaque part maintenant à l'appui.
- Hitbox d'attaque : convention y = bas de la boîte (comme aabb).
- **Écran noir sur GitHub Pages** : `importmap` vers three@0.170.0 (jsdelivr) + `./src/main.js` relatif ; plus tard `src/audio/Music.js` n'avait pas été poussé (import silencieusement échoué) → poussé. Les erreurs JS s'affichent à l'écran (bandeau rouge).
- **Orientation paysage** : écran d'accueil plein écran + verrou paysage ; message « Tourne ton téléphone ». APK : `android:screenOrientation="sensorLandscape"` dans AndroidManifest.xml après `npm run cap:add`.
- **Les images (assets/) ne peuvent pas être poussées par l'outil GitHub de la session** (texte seul) : Alec les ajoute à la main (zips fournis). Sans elles, le jeu retombe sur des sprites dessinés (testé). Les `tools/build_*.py` convertissent les packs.
- Le rendu WebGL n'a **jamais été vu** par l'assistant : à valider visuellement (alignement pieds/sol, tailles des ennemis — `skin.h` dans Bestiary.js —, fond, portails).
- Licences : Mondstadt Theme, Seeker, Portail interdisent la redistribution des fichiers (à garder hors dépôt public) ; les packs d'ennemis (Dark Fantasy Enemies, Monsters Creatures Fantasy 2, Fire Worm, Bot Wheel, Plants, Cave) sont utilisés avec l'accord d'Alec (obtenus légalement auprès des ccréateurs, itch.io) ; vérifier tout de même les conditions de redistribution si le dépôt reste public.
- Cartes v0.4 : le robot de traversée atteint l'arène du boss sur les 3 chapitres. Cavernes : plafond à 4 tuiles, paliers : marches de 2 tuiles.
- Portail de sortie : s'ouvre à la position de départ du boss ; portail de carte : appuyer sur HAUT.
- Sprites ennemis des nouveaux packs : orientés à droite (`faces: 'right'`), les anciens à gauche. Bande `worm_walk.png` absente du premier envoi d'images : le ver utilise alors `worm_idle` pour marcher (repli automatique).
- Un push accidentel de `main.js` avec un contenu bidon a été corrigé immédiatement (commit suivant) ; le fichier distant a été vérifié identique au local (SHA).

## Carte et génération
`python3 tools/make_maps.py` (graine fixe par chapitre) → `src/levels/chapterN.js`. Légende dans plan.md. Cartes en RLE (`src/levels/rle.js`). Le test de fumée Node (stub de three) n'est pas versionné.

## Assets (sources et conversion)
Zips d'origine (non versionnés) : BlueWizard_Animations, Slimes, Plant_Animations, Mossy_Assets, Mondstadt-Theme, Village Props, Seeker_Lite, Pixel_Portal_Update_2, Bot Wheel, Plants Animated, Cave Assets, Dark Fantasy Enemies FREE, Monsters Creatures Fantasy 2, Fire Worm.
Héros/décors/portails : `python3 -I tools/build_assets.py <dossier_raw> assets`. Ennemis : `tools/build_bat.py`, `tools/build_monsters.py` (→ `assets/enemies/<id>_<anim>.png`), `tools/build_botwheel.py` (→ `ombre_*`). Détails dans `assets-packs.md` et `bestiaire.md`.

## Dépendances installées
Aucune installée localement (voir package.json : three, gsap, howler, @capacitor/core, @capacitor/android, @capacitor/cli, vite).

## Commandes importantes
```
npm install
npm run dev          # test dans le navigateur (clavier ou tactile)
npm run build        # génère dist/
npm run cap:add      # première fois : ajoute la plateforme Android
npm run cap:sync     # build + synchronisation Android
npm run cap:open     # ouvre Android Studio pour générer l'APK
```

## Variables d'environnement nécessaires
Aucune.

## État actuel du projet
v0.4.3 : héros Seeker, portails, musique, bestiaire de 12 ennemis avec animations par états, boss à attaques variées, cartes agrandies, menu façon Slumber's Tale, arbre de compétences. Logique testée sous Node. **Rendu WebGL jamais vu par l'assistant.** Images d'ennemis à compléter : `worm_walk`, `bat2_hurt`, `bat2_death`, `mimic_hurt` (le reste est déjà sur GitHub).

## Prochaines étapes
1. Ajouter les 4 images manquantes dans `assets/enemies/`, ouvrir la page, régler tailles/alignements des ennemis (`h` dans Bestiary.js) et la difficulté
2. Monde interconnecté (`monde.md`, jalon 1 : tranche verticale des Racines) — corriger d'abord l'ordre des régions selon l'histoire (Plaines, Forêt, Ruines, Cendre, Champignons, Citadelle, Ombres)
3. Boss final L'Ombre Éternelle (Bot Wheel) quand la zone des Ombres existe
4. Convertir Plants Animated (décor) et Cave (grottes)
5. Équilibrage, musique, commandes personnalisables, APK
