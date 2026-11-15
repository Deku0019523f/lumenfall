# Plan détaillé — Lumenfall

Metroidvania 2D d'action-aventure (Three.js, caméra orthographique), jouable sur Android via Capacitor.

## Choix de conception
- Style : dessin animé 2D (sprites dessinés par canvas, remplaçables par de vraies feuilles de sprites)
- Univers : fantasy original (la « Veilleuse », créatures des Racines Lumineuses)
- Mode : solo, exploration, progression, boss difficiles à phases

## Structure des fichiers

```
lumenfall/
├── index.html                 # Canvas + HUD tactile (joystick, 4 boutons, vie, énergie)
├── package.json               # three, gsap, howler, capacitor, vite
├── vite.config.js
├── capacitor.config.json      # appId com.premium225.lumenfall
├── RAPPORT.md                 # mémoire du projet (à mettre à jour à chaque étape)
├── plan.md                    # ce fichier
├── src/
│   ├── main.js                # boucle de jeu, assemblage, sauvegarde/chargement
│   ├── engine/
│   │   ├── renderer.js        # WebGLRenderer + scène, VIEW_HEIGHT = 11 tuiles
│   │   ├── camera.js          # caméra ortho, suivi lissé, limites de carte, secousses
│   │   └── physics.js         # collisions AABB sur grille, plateformes traversables
│   ├── player/
│   │   ├── Player.js          # état, vie, énergie, dégâts, respawn
│   │   ├── Movement.js        # course, saut variable, coyote/buffer, double saut, dash, mur
│   │   ├── Combat.js          # combo x3, attaque chargée, haut/bas (rebond), spécial
│   │   └── Animations.js      # sprite procédural + squash & stretch par état
│   ├── enemies/
│   │   ├── Enemy.js           # base : vie, stun, contact, mort
│   │   ├── Crawler.js         # rampant : patrouille, demi-tour, charge
│   │   └── Flyer.js           # volant : vol, préparation, plongeon
│   ├── bosses/
│   │   └── Boss.js            # Gardienne des Racines : 3 phases
│   ├── world/
│   │   └── Level.js           # carte ASCII → tuiles instanciées, fond parallaxe simple
│   ├── levels/
│   │   └── zone1.js           # Les Racines Lumineuses (64x12)
│   ├── objects/
│   │   └── Interactables.js   # points de sauvegarde, orbe double saut, coffre
│   ├── ui/
│   │   ├── Input.js           # joystick + boutons tactiles + clavier (test PC)
│   │   └── HUD.js             # masques de vie, énergie, messages, barre de boss
│   ├── audio/                 # (vide) Howler.js à brancher
│   └── systems/
│       ├── Effects.js         # arcs de coup, particules
│       └── SaveSystem.js      # localStorage (SQLite Capacitor prévu)
└── assets/                    # (vide) sprites, sons, fonds à venir
```

## Légende des cartes
`#` solide · `=` plateforme traversable · `^` pics · `P` départ · `c` rampant · `f` volant · `S` sauvegarde · `C` coffre · `D` orbe double saut · `B` boss

## Contrôles
- Tactile : joystick gauche, SAUT, ATTAQUE (maintenir = chargée), DASH, SPÉC.
- Clavier : flèches/ZQSD, Espace/K saut, J attaque, L/Maj dash, U spécial
- Haut + attaque = coup vers le haut ; bas + attaque en l'air = coup plongeant (rebond sur ennemi)

## Feuille de route (10 étapes)
1. Personnage et animations — fait (version procédurale)
2. Déplacements, sauts, collisions — fait
3. Système de combat — fait
4. Ennemis — fait (2 types)
5. Environnements — partiel (1 zone)
6. Caméra et exploration — partiel (1 carte, pas de transitions)
7. Boss et compétences — partiel (1 boss, double saut)
8. Interface Android — partiel (commandes fixes, non personnalisables)
9. Sauvegarde et progression — partiel (localStorage)
10. Optimisation et export APK — à faire
