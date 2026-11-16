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
- Joueur : course, saut variable (coyote time + buffer), double saut (débloqué par orbe), dash avec invincibilité, glissade/saut mural (débloqué par l'orbe du chapitre 2), descente des plateformes
- Combat : combo en 3 coups, attaque chargée, coup haut/bas avec rebond, attaque spéciale (projectile, coûte 3 énergie), énergie gagnée en frappant
- Ennemis : Rampant (patrouille/charge), Volant (plongeon) ; Boss à 3 phases, un par chapitre
- **Chapitres** : 3 cartes distinctes (Racines Mousseuses 96x14, Plaines du Vent 116x17, Village Oublié 124x17), chacune avec son tileset autotile 3x3, son fond à parallaxe, ses plantes animées, ses ennemis et son boss ; fin de boss → fondu → chapitre suivant
- Sprites réels : sorcier bleu (idle/marche/saut/dash), slimes vert/orange, spores, boss plante empoisonnée / plante du vent / slime géant
- Monde : pics, plateformes, points de sauvegarde, coffres (+1 vie max, persistants), orbes (D double saut ch.1, W saut mural ch.2)
- Interface : joystick, 4 boutons, vie en masques, barre d'énergie, barre de boss, messages, titres de chapitre ; clavier pour tester sur PC
- Sauvegarde v2 (localStorage) : chapitre, point de sauvegarde, vie max, capacités, coffres/orbes ramassés, boss vaincus
- Test direct d'un chapitre : `?chapitre=2` (capacités débloquées automatiquement, sans sauvegarde)

## Fonctionnalités restantes
- Animation d'attaque du héros (utilise le dash + arc de coup), sprites de coffre/orbes/sauvegarde (formes simples)
- Sons et musiques (Howler.js)
- Zones reliées entre elles dans un même chapitre, carte du monde, zones secrètes supplémentaires
- Autres compétences, boss avec attaques propres à chaque chapitre (les 3 utilisent les mêmes attaques)
- Commandes tactiles personnalisables, menu pause/options
- Migration de la sauvegarde vers SQLite
- Optimisation et export APK

## Modifications importantes
- v0.1.0 : projet créé (une zone).
- v0.2.0 : système de chapitres (`World`, `chapters.js`), 3 cartes générées, vrais sprites (zips fournis par Alec), autotile, fonds, décors animés, boss configurables, sauvegarde v2 (les anciennes sauvegardes sont effacées), `zone1.js` supprimé.

## Problèmes rencontrés et solutions
- Réseau désactivé dans l'environnement de développement : `npm install` impossible, donc **le jeu n'a pas été lancé dans un navigateur**.
- Hitbox d'attaque : convention y = bas de la boîte (comme aabb), corrigée après revue.
- **Écran noir sur GitHub Pages** (déployé depuis la racine, sans build) : `import 'three'` et le chemin absolu `/src/main.js` ne se résolvaient pas. Solution : `importmap` vers three@0.170.0 sur jsdelivr + `./src/main.js` relatif dans index.html. Les erreurs JS s'affichent maintenant à l'écran (bandeau rouge en bas).
- **Orientation paysage** : écran d'accueil « JOUER » qui passe en plein écran et verrouille le paysage (`screen.orientation.lock`), et message « Tourne ton téléphone » en mode portrait. Le jeu reste figé tant que JOUER n'est pas touché.
- Pour l'APK : après `npm run cap:add`, mettre `android:screenOrientation="sensorLandscape"` sur l'activité dans `android/app/src/main/AndroidManifest.xml` (le dossier android/ est ignoré par git).
- **Les images (assets/) ne peuvent pas être poussées par l'outil GitHub de la session** (il n'envoie que du texte, et `git push` est bloqué tant que le compte GitHub n'est pas relié). Le code est sur GitHub ; `assets/` doit être ajouté à la main (zip fourni). Sans lui, le jeu retombe automatiquement sur des sprites dessinés par code et des couleurs unies (testé).
- Aucun navigateur/three.js utilisable dans l'environnement de dev : le rendu n'a **jamais été vu**. Testé : logique complète sous Node avec un faux `three` (chargement des 3 chapitres avec et sans images, traversée de chaque carte, boss + 3 phases, transition de chapitre, sauvegarde/rechargement). À valider visuellement : alignement des sprites (pieds/sol), taille des tuiles, fond à parallaxe.
- Licences des packs : Mondstadt Theme autorise l'usage commercial mais **interdit la redistribution des fichiers** → ne pas laisser les images de ce pack dans un dépôt public ; vérifier aussi Mossy, Slimes, Plant Animations, BlueWizard, Village Props.

## Assets (sources et conversion)
Zips d'origine (non versionnés) : BlueWizard_Animations, Slimes, Plant_Animations (2 parties .001/.002 à fusionner : `cat a.zip.001 a.zip.002 > a.zip`), Mossy_Assets, Mondstadt-Theme (zips imbriqués), Village Props.
Extraire chacun dans son dossier (`wizard/ slimes/ plants/ mossy/ mond/ props/`) puis : `python3 -I tools/build_assets.py <dossier_raw> assets`. Sortie ≈ 2,5 Mo.

## Dépendances installées
Aucune installée localement (voir package.json : three, gsap, howler, @capacitor/core, @capacitor/android, @capacitor/cli, vite).

## Commandes importantes
```
npm install
npm run dev          # test dans le navigateur (clavier ou tactile)
npm run build        # génère dist/ (+ copie assets/)
npm run cap:add      # première fois : ajoute la plateforme Android
npm run cap:sync     # build + synchronisation Android
npm run cap:open     # ouvre Android Studio pour générer l'APK
npm run maps         # régénère les cartes des chapitres
```

## Variables d'environnement nécessaires
Aucune.

## État actuel du projet
v0.2.0 : 3 chapitres jouables sur le papier (logique testée sous Node), assets intégrés. **Rendu jamais vu dans un navigateur.** Les images doivent être ajoutées sur GitHub (dossier `assets/`).

## Prochaines étapes
1. Envoyer `assets/` sur GitHub, ouvrir la page, corriger ce qui est visuellement faux (alignement sprites, taille, fond)
2. Équilibrage (saut/dash/boss), attaques propres à chaque boss
3. Sons/musiques (Howler.js)
4. Menu pause + commandes personnalisables, choix de chapitre
5. `npm run cap:add` (+ `sensorLandscape`) et génération de l'APK
