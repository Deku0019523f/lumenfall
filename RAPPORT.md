# RAPPORT — Lumenfall

## Objectif du projet
Jeu Android d'action-aventure 2D de type Metroidvania (inspiré de Hollow Knight: Silksong), rendu avec Three.js (caméra orthographique), commandes tactiles, exportable en APK via Capacitor.

## Stack et technologies
- Three.js (rendu 2D, caméra orthographique), JavaScript ES modules
- Vite (dev/build), Capacitor 6 (Android)
- GSAP et Howler.js : déclarés dans package.json, **pas encore utilisés**
- Sauvegarde : localStorage (SQLite prévu)

## Architecture et structure des fichiers
Voir `plan.md` (arborescence détaillée et rôle de chaque fichier).

## Fonctionnalités développées
- Moteur : renderer, caméra avec suivi lissé et secousses, physique AABB sur grille
- Joueur : course, saut variable (coyote time + buffer), double saut (débloqué par orbe), dash avec invincibilité, glissade/saut mural (code prêt, capacité non débloquable pour l'instant), descente des plateformes
- Combat : combo en 3 coups, attaque chargée, coup haut/bas avec rebond, attaque spéciale (projectile, coûte 3 énergie), énergie gagnée en frappant
- Ennemis : Rampant (patrouille/charge), Volant (plongeon) ; Boss « La Gardienne des Racines » à 3 phases
- Monde : carte ASCII (zone 1, 64x12), pics, plateformes, points de sauvegarde, coffre (+1 vie max), orbe de double saut
- Interface : joystick, 4 boutons, vie en masques, barre d'énergie, barre de boss, messages ; clavier pour tester sur PC
- Sauvegarde : point de sauvegarde, vie max, capacités, boss vaincu

## Fonctionnalités restantes
- Vraies feuilles de sprites et animations (actuellement formes dessinées par canvas)
- Sons et musiques (Howler.js)
- Plusieurs zones reliées, transitions, carte, zones secrètes
- Capacité de saut mural débloquable, autres compétences
- Commandes tactiles personnalisables, menu pause/options
- Migration de la sauvegarde vers SQLite
- Optimisation et export APK

## Modifications importantes
- Projet créé de zéro (v0.1.0). Lignes de la carte zone1 recalées à 64 colonnes (certaines étaient trop courtes).

## Problèmes rencontrés et solutions
- Réseau désactivé dans l'environnement de développement : `npm install` impossible, donc **le jeu n'a pas été lancé dans un navigateur**. Vérifications faites : syntaxe de tous les fichiers (`node --check`) et test de collision headless de physics.js (chute et mur OK).
- Hitbox d'attaque : convention y = bas de la boîte (comme aabb), corrigée après revue.

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
Base jouable écrite (étapes 1 à 4 largement faites, 5 à 9 partielles), **non testée à l'exécution** dans un navigateur.

## Prochaines étapes
1. `npm install && npm run dev`, tester et corriger les bugs visibles (équilibrage saut/dash/boss)
2. Remplacer les sprites procéduraux par de vraies animations
3. Ajouter sons/musiques, puis plusieurs zones et le saut mural
4. Menu pause + commandes personnalisables
5. `npm run cap:add` et génération de l'APK
