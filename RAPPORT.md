# RAPPORT — Lumenfall

## Objectif du projet
Jeu Android d'action-aventure 2D de type Metroidvania (inspiré de Hollow Knight: Silksong), rendu avec Three.js (caméra orthographique), commandes tactiles, exportable en APK via Capacitor.

## Stack et technologies
- Three.js (rendu 2D, caméra orthographique), JavaScript ES modules (chargé depuis un CDN via importmap pour GitHub Pages, depuis node_modules avec Vite)
- Python 3 + Pillow pour les outils (`tools/build_assets.py`, `tools/make_maps.py`)
- Vite (dev/build), Capacitor 6 (Android)
- Audio : **Web Audio procédural** (`src/audio/Music.js`, aucun fichier son) ; GSAP et Howler.js déclarés dans package.json mais **non utilisés**
- Sauvegarde : localStorage (SQLite prévu)

## Architecture et structure des fichiers
Voir `plan.md` (arborescence détaillée et rôle de chaque fichier).

## Fonctionnalités développées
- Moteur : renderer, caméra avec suivi lissé et secousses, physique AABB sur grille
- Joueur : course, saut variable (coyote time + buffer), double saut (débloqué par orbe), dash avec invincibilité, glissade/saut mural (débloqué par l'orbe du chapitre 2), descente des plateformes
- Combat v2 (fluide et percutant) : attaque déclenchée **à l'appui** (buffer 0,18 s), combo 3 coups (4 avec compétence), fente vers l'avant, attaque chargée (maintenir après le coup puis relâcher), coup haut/bas avec rebond, spéciale (projectile, 3 énergie). Impact : hit-stop, croissant de lame additif qui suit le joueur, étincelles, anneaux, lueurs, chiffres de dégâts, zoom/secousse de caméra, recul + écrasement des ennemis, poussière au dash/atterrissage
- Compétences (12, 3 branches Lame/Ombre/Lumière) achetées avec les **éclats de lumière** ✦ (dropés par ennemis, coffres, quêtes, boss), menu pause → Compétences
- Histoire (INTRO, arrivée de chapitre, PNJ Mousse/Zéphyr/Mirelle, intro de boss, épilogue) et **quêtes** par chapitre (talk/kill/chest/orb/mini/boss) avec récompenses en éclats, suivi à l'écran, persistance
- Menus (v0.4, style « Slumber's Tale ») : titre doré italique aligné à gauche, entrées en texte seul (plume ❦ + soulignement sur la ligne choisie, clavier ↑↓/Entrée), faisceau de lumière diagonal + poussières + vignette ; Continuer / Nouvelle partie / Chapitres / Options (volumes musique & effets) / Comment jouer / Crédits ; pause : Reprendre, Compétences, Quêtes, Options, Menu principal, Effacer
- **Arbre de compétences en nœuds** (SVG, `Menu.js` + `Skills.js`) : racine « Flamme du Veilleur », nœuds ronds à anneaux, lignes pointillées blanches sur le chemin acquis, « ? » tant que le parent n'est pas acquis, boussole d'éclats en haut à gauche, onglets Compétences/Quêtes, panneau de détail + Débloquer/Retour
- **Musique et sons** : un thème par chapitre (ch0/ch1/ch2), thème de mini-boss et de boss, thème du menu ; effets (saut, dash, coups, sort, éclat, coffre, quête, boss, portail…) ; réglages sauvegardés (clé `lumenfall.audio`)
- **Héros « Hooded Seeker »** (Primitive Pixels, version Lite, palette Void) : idle, course, saut (image choisie selon la vitesse verticale), attaque, dégâts, mort ; point d'appui (feet) par animation, 1 px = 1/16 de tuile ; repli sur l'ancien sorcier puis sur le dessin procédural
- **Nouveaux monstres** (`enemies/Variants.js`) : Cracheur `k` (vise et tire), Sauteur `h` (bonds en arc), Esprit `w` (vole, tir en éventail), Brute `r` (charge, résiste au recul)
- **Boss à attaques propres** (`bosses/Boss.js`, `moves` par boss dans chapters.js) : racines (colonnes de danger), invocation, rafale de vent, lames, pluie, nova radiale, bonds ciblés avec onde de choc, volée, charge ; les mouvements s'ajoutent selon la phase (zones de danger : `systems/Hazards.js`)
- **Portails** (pack « Pixel Portal Update 2 », 3 couleurs : bleu ch.1, jaune ch.2, rouge ch.3 ; `objects/Portals.js`) : le héros est aspiré (il rétrécit), puis ressort à l'autre portail. Paires `T` ↔ `t` dans les cartes (2 par chapitre : raccourcis ; il faut avoir **découvert les deux extrémités** en s'en approchant, puis appuyer sur **HAUT** dans le portail). Portail de **sortie** : s'ouvre à la place du boss après sa défaite et l'épilogue (il reste ouvert si on recharge) → chapitre suivant ; portail d'**arrivée** : le héros sort du portail au début du chapitre. Découvertes sauvegardées (`collected`, clés `portal:…`). Sons `portal`/`portalOpen`.
- Saut mural durci : il faut pousser vers le mur et **alterner les murs** (plus de spam de Saut)
- Ennemis : Rampant (patrouille/charge), Volant (plongeon) ; Boss « La Gardienne des Racines » à 3 phases
- **Chapitres longs et grands** : 3 cartes générées par segments (Racines Mousseuses ≈604x18, Plaines du Vent ≈736x18, Village Oublié ≈888x18 ; 11 à 15 coffres chacune), avec points de sauvegarde réguliers, ponts à îlots, terrasses, **grottes** (plafond bas, stalactites, alcôve à coffre), **paliers** (escaliers de plateformes avec ennemis et coffre au sommet), tours à saut mural, coffres secrets (double saut), un mini-boss au milieu et un boss à la fin ; chacune avec son tileset autotile 3x3, son fond à parallaxe, ses plantes animées, ses ennemis et son boss ; fin de boss → portail de sortie → chapitre suivant
- Sprites réels : slimes vert/orange, spores, boss plante empoisonnée / plante du vent / slime géant
- Monde : pics, plateformes, points de sauvegarde, coffres (+1 vie max, persistants), orbes (D double saut ch.1, W saut mural ch.2)
- Interface : joystick, 4 boutons, vie en masques, barre d'énergie, barre de boss, messages ; clavier pour tester sur PC
- Sauvegarde v3 (localStorage ; v2 acceptée) : chapitre, point de sauvegarde, vie max, capacités, coffres/orbes/portails découverts, boss/mini-boss vaincus, éclats, compétences, quêtes, scènes vues, chapitres débloqués
- Test direct d'un chapitre : `?chapitre=2` (capacités débloquées automatiquement, sans sauvegarde)

## Fonctionnalités restantes
- Sprites de coffre/orbes/sauvegarde/PNJ (formes lumineuses simples) ; animations du Seeker non fournies dans la version Lite : dash, saut mural, double saut, cast (version complète payante)
- Vrais fichiers audio (musique composée) à la place de la musique procédurale
- Carte du monde, zones secrètes supplémentaires, plus de PNJ/quêtes secondaires
- Commandes tactiles personnalisables
- Équilibrage des nouveaux monstres/boss, difficulté

- Migration de la sauvegarde vers SQLite
- Optimisation et export APK

## Modifications importantes
- v0.1.0 : projet créé (une zone).
- v0.2.0 : système de chapitres (`World`, `chapters.js`), 3 cartes générées, vrais sprites (zips fournis par Alec), autotile, fonds, décors animés, boss configurables, sauvegarde v2 (les anciennes sauvegardes sont effacées), `zone1.js` supprimé.
- v0.3.0 : combat refait (Combat.js/Effects.js/camera.js, hit-stop dans main.js), compétences + éclats (Skills.js, Shards.js), histoire/quêtes/dialogues/PNJ (story.js, Quests.js, Dialogue.js, Npc.js), menus (Menu.js, index.html), mini-boss ('M'), nouveau générateur de cartes par segments (make_maps.py), sauvegarde v3.

- v0.4.0 : portails (Portals.js, T/t dans make_maps.py), héros Seeker (`player/Animations.js`, `assets/manifest.js` SEEKER), musique/sons (`audio/Music.js`), monstres (`enemies/Variants.js`, `shots.js`), boss à mouvements (`Boss.js`, `Hazards.js`), cartes agrandies avec grottes/paliers/coffres (`make_maps.py`, quêtes relevées dans story.js), menu et arbre de compétences refaits (`Menu.js`, CSS d'index.html, `Skills.js` : positions/`req`/ROOT), saut mural durci.

## Problèmes rencontrés et solutions
- Réseau désactivé dans l'environnement de développement : `npm install` impossible, donc **le jeu n'a pas été lancé dans un navigateur**. Vérifications faites : syntaxe de tous les fichiers (`node --check`) et test de collision headless de physics.js (chute et mur OK).
- Latence d'attaque (v0.2) : l'attaque partait au relâchement du bouton ; maintenant à l'appui, la charge se fait en maintenant après le premier coup.
- Hitbox d'attaque : convention y = bas de la boîte (comme aabb), corrigée après revue.
- **Écran noir sur GitHub Pages** (déployé depuis la racine, sans build) : `import 'three'` et le chemin absolu `/src/main.js` ne se résolvaient pas. Solution : `importmap` vers three@0.170.0 sur jsdelivr + `./src/main.js` relatif dans index.html. Les erreurs JS s'affichent maintenant à l'écran (bandeau rouge en bas).
- **Orientation paysage** : écran d'accueil qui passe en plein écran et verrouille le paysage (`screen.orientation.lock`), et message « Tourne ton téléphone » en mode portrait. Le jeu reste figé tant que le menu n'est pas quitté.
- Pour l'APK : après `npm run cap:add`, mettre `android:screenOrientation="sensorLandscape"` sur l'activité dans `android/app/src/main/AndroidManifest.xml` (le dossier android/ est ignoré par git).

- **Les images (assets/) ne peuvent pas être poussées par l'outil GitHub de la session** (il n'envoie que du texte, et `git push` est bloqué tant que le compte GitHub n'est pas relié). Le code est sur GitHub ; `assets/` doit être ajouté à la main (zip fourni). Sans lui, le jeu retombe automatiquement sur des sprites dessinés par code et des couleurs unies (testé).
- Aucun navigateur/three.js utilisable dans l'environnement de dev : le rendu n'a **jamais été vu**. Testé : logique complète sous Node avec un faux `three` (chargement des 3 chapitres avec et sans images, traversée de chaque carte, boss + 3 phases, transition de chapitre, sauvegarde/rechargement). À valider visuellement : alignement des sprites (pieds/sol), taille des tuiles, fond à parallaxe.
- Licences des packs : Mondstadt Theme autorise l'usage commercial mais **interdit la redistribution des fichiers** → ne pas laisser les images de ce pack dans un dépôt public ; vérifier aussi Mossy, Slimes, Plant Animations, BlueWizard, Village Props.

- Cartes v0.4 : le robot de traversée (test Node, scénario `run`) atteint l'arène du boss sur les 3 chapitres. Menu/arbre vérifiés en capture d'écran (Chromium, page de test avec faux `three`) ; le rendu WebGL reste jamais vu.
- Cavernes : plafond à 4 tuiles au-dessus du sol (saut max ≈ 2,9 tuiles), stalactites d'1 tuile ; paliers : marches de 2 tuiles, écart horizontal 2.
- Portails : `assets/effects/portal_{blue,yellow,red}.png` (feuilles 21 images de 64 px, ouverture 0-11 puis boucle 12-20 ; fermeture = ouverture à l'envers). Licence du pack portail : usage libre, redistribution des fichiers interdite → à ajouter à la main, comme le reste d'`assets/`. Test Node : scénarios `portal` (paires, refus sans HAUT, sortie de chapitre) et `run` (robot de traversée) dans le script de fumée local.
- Le portail de sortie apparaissait sur le portail `t` de l'arène : il s'ouvre maintenant à la position de départ du boss. Marcher devant un portail de carte téléportait sans le vouloir : il faut maintenant appuyer sur HAUT.
- Les nouveaux sprites du Seeker (`assets/characters/seeker_*.png`) sont binaires : à ajouter à la main sur GitHub comme le reste d'`assets/`. Licence Seeker : usage commercial permis, redistribution des images interdite.

## Carte et génération
`python3 tools/make_maps.py` (graine fixe par chapitre) → `src/levels/chapterN.js`. Légende dans plan.md. Les cartes sont écrites en RLE (`src/levels/rle.js` les décode au chargement). Le test de fumée Node (stub de three) n'est pas versionné.

## Assets (sources et conversion)
Zips d'origine (non versionnés) : BlueWizard_Animations, Slimes, Plant_Animations (2 parties .001/.002 à fusionner : `cat a.zip.001 a.zip.002 > a.zip`), Mossy_Assets, Mondstadt-Theme (zips imbriqués), Village Props, Seeker_Lite, Pixel_Portal_Update_2.
Extraire chacun dans son dossier (`wizard/ slimes/ plants/ mossy/ mond/ props/`) puis : `python3 -I tools/build_assets.py <dossier_raw> assets`. Sortie ≈ 2,5 Mo. Les feuilles `seeker_*.png` et `portal_*.png` sont des feuilles d'origine mises à plat (frames côte à côte).

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
v0.4.0 : héros Seeker, portails (paires + sortie de chapitre), musique, nouveaux monstres, boss à attaques variées, cartes agrandies (grottes/paliers/coffres), menu façon Slumber's Tale, arbre de compétences en nœuds. Logique testée sous Node (traversée des 3 cartes, boss + phases, portails, systèmes, rechargement). **Rendu WebGL jamais vu dans un navigateur.** Les images doivent être ajoutées sur GitHub (dossier `assets/`).

## Prochaines étapes
1. Envoyer `assets/` sur GitHub, ouvrir la page, corriger ce qui est visuellement faux (alignement sprites, taille, fond, position des portails)
2. Équilibrage (coûts des compétences, dégâts, densité d'ennemis, boss), sentir le combat sur téléphone ; vérifier l'alignement du Seeker (pieds/sol) et la taille
3. Remplacer la musique procédurale par de vrais morceaux si souhaité
4. Commandes personnalisables, plus de quêtes secondaires
5. `npm run cap:add` (+ `sensorLandscape`) et génération de l'APK
