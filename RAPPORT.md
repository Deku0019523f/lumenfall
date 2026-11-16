# RAPPORT — Lumenfall

## Objectif du projet
Jeu Android d'action-aventure 2D de type Metroidvania (inspiré de Hollow Knight: Silksong), rendu avec Three.js (caméra orthographique), commandes tactiles, exportable en APK via Capacitor.

## Stack et technologies
- Three.js (rendu 2D, caméra orthographique), JavaScript ES modules (chargé depuis un CDN via importmap pour GitHub Pages, depuis node_modules avec Vite)
- Python 3 + Pillow pour les outils (`tools/build_assets.py`, `tools/make_maps.py`)
- Vite (dev/build), Capacitor 6 (Android)
- GSAP et Howler.js : déclarés dans package.json, **pas encore utilisés**
- Sauvegarde : localStorage (SQLite prévu)

## Architecture et structure des fichiers
Voir `plan.md` (arborescence détaillée et rôle de chaque fichier).

## Fonctionnalités développées
- Moteur : renderer, caméra avec suivi lissé et secousses, physique AABB sur grille
- Joueur : course, saut variable (coyote time + buffer), double saut (débloqué par orbe), dash avec invincibilité, glissade/saut mural (orbe du chapitre 2), descente des plateformes
- Combat v2 (fluide et percutant) : attaque déclenchée **à l'appui** (buffer 0,18 s), combo 3 coups (4 avec compétence), fente vers l'avant, attaque chargée (maintenir après le coup puis relâcher), coup haut/bas avec rebond, spéciale (projectile, 3 énergie). Impact : hit-stop, croissant de lame additif qui suit le joueur, étincelles, anneaux, lueurs, chiffres de dégâts, zoom/secousse de caméra, recul + écrasement des ennemis, poussière au dash/atterrissage
- Compétences (12, 3 branches Lame/Ombre/Lumière) achetées avec les **éclats de lumière** ✦ (dropés par ennemis, coffres, quêtes, boss), menu pause → Compétences
- Histoire (INTRO, arrivée de chapitre, PNJ Mousse/Zéphyr/Mirelle, intro de boss, épilogue) et **quêtes** par chapitre (talk/kill/chest/orb/mini/boss) avec récompenses en éclats, suivi à l'écran, persistance
- Menus : démarrage (Continuer / Nouvelle partie / Chapitres / Comment jouer) et pause (Reprendre, Compétences, Quêtes, Menu principal, Effacer)
- Ennemis : Rampant (patrouille/charge), Volant (plongeon) ; 3 boss à 3 phases + 3 mini-boss (mêmes attaques que les boss)
- **Chapitres longs** : 3 cartes générées par segments (Racines Mousseuses ≈336x18, Plaines du Vent ≈414x18, Village Oublié ≈494x18), avec points de sauvegarde réguliers, ponts à îlots, paliers, tours à saut mural, coffres secrets (double saut), un mini-boss au milieu et un boss à la fin ; chacune avec son tileset autotile 3x3, son fond à parallaxe, ses plantes animées, ses ennemis et son boss ; fin de boss → dialogue → fondu → chapitre suivant
- Sprites réels : sorcier bleu (idle/marche/saut/dash), slimes vert/orange, spores, boss plante empoisonnée / plante du vent / slime géant
- Monde : pics, plateformes, points de sauvegarde, coffres (+1 vie max, +10 ✦, persistants), orbes (D double saut ch.1, W saut mural ch.2)
- Interface : joystick, 4 boutons, vie en masques, barre d'énergie, éclats, quête en cours, barre de boss, messages, boîte de dialogue ; clavier pour tester sur PC
- Sauvegarde v3 (localStorage ; v2 acceptée) : chapitre, point de sauvegarde, vie max, capacités, coffres/orbes, boss/mini-boss vaincus, éclats, compétences, quêtes, scènes vues, chapitres débloqués
- Test direct d'un chapitre : `?chapitre=2` (capacités débloquées automatiquement, 150 éclats, sans menu)

## Fonctionnalités restantes
- Animation d'attaque dédiée du héros (utilise le dash + croissant de lame), sprites de coffre/orbes/sauvegarde/PNJ (formes lumineuses simples)
- Sons et musiques (Howler.js)
- Carte du monde, zones secrètes supplémentaires, plus de PNJ/quêtes secondaires
- Boss avec attaques propres à chaque chapitre (les boss et mini-boss utilisent les mêmes attaques)
- Commandes tactiles personnalisables, options (volume…)
- Migration de la sauvegarde vers SQLite
- Optimisation et export APK

## Modifications importantes
- v0.1.0 : projet créé (une zone).
- v0.2.0 : système de chapitres (`World`, `chapters.js`), 3 cartes générées, vrais sprites (zips fournis par Alec), autotile, fonds, décors animés, boss configurables, sauvegarde v2 (les anciennes sauvegardes sont effacées), `zone1.js` supprimé.
- v0.3.0 : combat refait (Combat.js/Effects.js/camera.js, hit-stop dans main.js), compétences + éclats (Skills.js, Shards.js), histoire/quêtes/dialogues/PNJ (story.js, Quests.js, Dialogue.js, Npc.js), menus (Menu.js, index.html), mini-boss ('M'), nouveau générateur de cartes par segments (make_maps.py, cartes en RLE), sauvegarde v3.

## Problèmes rencontrés et solutions
- Réseau désactivé dans l'environnement de développement : `npm install` impossible, donc **le jeu n'a pas été lancé dans un navigateur**. Vérifications faites : syntaxe de tous les fichiers (`node --check`) et test de collision headless de physics.js (chute et mur OK).
- Latence d'attaque (v0.2) : l'attaque partait au relâchement du bouton ; maintenant à l'appui, la charge se fait en maintenant après le premier coup.
- Hitbox d'attaque : convention y = bas de la boîte (comme aabb), corrigée après revue.
- **Écran noir sur GitHub Pages** (déployé depuis la racine, sans build) : `import 'three'` et le chemin absolu `/src/main.js` ne se résolvaient pas. Solution : `importmap` vers three@0.170.0 sur jsdelivr + `./src/main.js` relatif dans index.html. Les erreurs JS s'affichent maintenant à l'écran (bandeau rouge en bas).
- **Orientation paysage** : le menu (CONTINUER / NOUVELLE PARTIE / CHAPITRES) appelle `window.enterGame()` (index.html) dans le geste tactile : plein écran + `screen.orientation.lock`, et message « Tourne ton téléphone » en mode portrait. Le jeu reste figé tant que le menu n'a pas été validé.
- Pour l'APK : après `npm run cap:add`, mettre `android:screenOrientation="sensorLandscape"` sur l'activité dans `android/app/src/main/AndroidManifest.xml` (le dossier android/ est ignoré par git).
- **Les images (assets/) ne peuvent pas être poussées par l'outil GitHub de la session** (il n'envoie que du texte, et `git push` est bloqué tant que le compte GitHub n'est pas relié). Le code est sur GitHub ; `assets/` doit être ajouté à la main (zip fourni). Sans lui, le jeu retombe automatiquement sur des sprites dessinés par code et des couleurs unies (testé).
- Aucun navigateur/three.js utilisable dans l'environnement de dev : le rendu n'a **jamais été vu**. Testé : logique complète sous Node avec un faux `three` (chargement des 3 chapitres avec et sans images, traversée de chaque carte, boss + 3 phases, transition de chapitre, sauvegarde/rechargement, PNJ, quêtes, éclats, achat des 12 compétences, combo/chargé/nova/dash). À valider visuellement : alignement des sprites (pieds/sol), taille des tuiles, fond à parallaxe, lisibilité des effets de combat, menus sur téléphone.
- Licences des packs : Mondstadt Theme autorise l'usage commercial mais **interdit la redistribution des fichiers** → ne pas laisser les images de ce pack dans un dépôt public ; vérifier aussi Mossy, Slimes, Plant Animations, BlueWizard, Village Props.

## Carte et génération
`python3 tools/make_maps.py` (graine fixe par chapitre) → `src/levels/chapterN.js`. Légende dans plan.md. Les cartes sont écrites en RLE (`src/levels/rle.js` les décode au chargement). Le test de fumée Node (stub de three) n'est pas versionné.

## Assets (sources et conversion)
Zips d'origine (non versionnés) : BlueWizard_Animations, Slimes, Plant_Animations (2 parties .001/.002 à fusionner : `cat a.zip.001 a.zip.002 > a.zip`), Mossy_Assets, Mondstadt-Theme (zips imbriqués), Village Props.
Extraire chacun dans son dossier (`wizard/ slimes/ plants/ mossy/ mond/ props/`) puis : `python3 -I tools/build_assets.py <dossier_raw> assets`. Sortie ≈ 2,5 Mo.

## Dépendances installées
Aucune installée localement (voir package.json : three, gsap, howler, @capacitor/core, @capacitor/android, @capacitor/cli, vite).

## Commandes importantes
```
npm install
npm run dev          # test dans le navigateur (clavier ou tactile)
npm run build        # génère dist/
npm run maps         # régénère les cartes des chapitres
npm run cap:add      # première fois : ajoute la plateforme Android
npm run cap:sync     # build + synchronisation Android
npm run cap:open     # ouvre Android Studio pour générer l'APK
```

## Variables d'environnement nécessaires
Aucune.

## État actuel du projet
v0.3.0 : 3 chapitres longs, menus, histoire, quêtes, compétences, combat refait — logique testée sous Node, assets intégrés. **Rendu jamais vu dans un navigateur.** Les images doivent être ajoutées sur GitHub (dossier `assets/`).

## Prochaines étapes
1. Envoyer `assets/` sur GitHub, ouvrir la page, corriger ce qui est visuellement faux (alignement sprites, taille, fond, effets)
2. Équilibrage (coûts des compétences, dégâts, densité d'ennemis, boss), sentir le combat sur téléphone (durées de hit-stop, buffer), attaques propres à chaque boss
3. Sons/musiques (Howler.js)
4. Commandes personnalisables, options, plus de quêtes secondaires
5. `npm run cap:add` (+ `sensorLandscape`) et génération de l'APK
