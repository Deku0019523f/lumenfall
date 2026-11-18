# Plan détaillé — Lumenfall

Metroidvania 2D d'action-aventure (Three.js, caméra orthographique), jouable sur Android via Capacitor, **en mode paysage**.

## Choix de conception
- Style : 2D dessiné/pixel mêlés (packs d'assets fournis : héros Hooded Seeker, slimes, plantes, tilesets Mossy / Mondstadt / Village, portails Pixel Portal)
- Univers : fantasy original
- Mode : solo, exploration, progression **par chapitres** (une nouvelle carte par chapitre), boss difficiles à phases

## Histoire (version adaptée au jeu)
Sources : dossier `histoires/`. **Saison 1** = `saison-1/00-lumenfall-la-flamme-du-veilleur.txt` (histoire de base) + **trois suites** selon le choix final du joueur (`suite-1-l-heritier-de-la-flamme`, `suite-2-le-monde-sans-flamme`, `suite-3-le-dernier-serment`). **Saison 2** (« Les Échos de l'Origine ») : seul le prologue est écrit. Le jeu actuel raconte le **début** de la saison 1 : l'intro et les 3 premiers chapitres. Le reste (7 régions, choix final, suites, saison 2) n'est pas encore dans le jeu.

**Lore de base** : la *Flamme Originelle* protégeait le monde de Lumenfall (équilibre entre humains, esprits et créatures de la nature). L'*Ombre Éternelle* a brisé son sceau ; les anciens Veilleurs se sont sacrifiés pour fragmenter la Flamme en **sept fragments** dispersés dans le monde, puis ont disparu de l'histoire. Des siècles plus tard, un enfant d'origine inconnue (voit les esprits, entend les arbres) reçoit une **lanterne** où s'allume une flamme violette. Il est le dernier héritier, le nouveau Veilleur. Son guide est **Lueur**, un petit esprit lumineux.

**Vocabulaire (décidé)** :
- **Fragments** (ou « éclats de la Flamme ») = les 7 morceaux de la Flamme Originelle, enjeu de l'histoire.
- **Étincelles** ✦ = la monnaie du jeu (dépensée dans l'arbre de compétences). Remplace le mot « éclats » dans les menus, le HUD, les quêtes et les dialogues pour éviter la confusion.

**Intro** (narration, `INTRO` dans story.js) : prologue en 4-5 phrases (Flamme, Ombre, sacrifice des Veilleurs, sept fragments) → l'enfant voit une lumière traverser le ciel → Lueur : « Enfin… le dernier héritier s'est réveillé. Le monde a besoin de son Veilleur. »

| # | Chapitre | Rôle dans l'histoire | Personnages / boss |
|---|----------|----------------------|--------------------|
| 1 | Les Racines Mousseuses | Équivalent de « Le petit Veilleur » : les créatures obscures, repoussées du village par la lanterne, ont fui vers les racines de la forêt ancienne. Chapitre d'ouverture (hors des 7 régions). La lanterne s'éveille pleinement à la fin. | Mousse l'Ancien reconnaît un Veilleur qu'il croyait disparu ; la Gardienne des Racines, corrompue par l'Ombre |
| 2 | Les Plaines du Vent | Première région : le **premier fragment**. Lueur explique les pouvoirs de la lanterne (éclairer les passages cachés, réveiller les anciens mécanismes, repousser l'Ombre, absorber les fragments, parler aux esprits). Chaque fragment pris réveille une part de l'Ombre. | Zéphyr, éclaireur ; le Souffle Ancien garde le fragment |
| 3 | Le Village Oublié | Ancien refuge des Veilleurs, là où l'Ombre est la plus épaisse. Fin de la partie jouable : la lanterne s'illumine, Lueur évoque les prochaines régions (Forêt des Murmures, Ruines Englouties, Montagnes de Cendre…) et l'Ombre commence à observer le héros. | Mirelle (« celui de la prophétie ») ; le Roi Gélatine garde un fragment et avale la lumière des maisons |

**Les 7 régions de l'histoire complète** (pour la suite) : 1 Plaines du Vent · 2 Forêt des Murmures · 3 Ruines Englouties · 4 Montagnes de Cendre · 5 Royaume des Champignons · 6 Citadelle Oubliée · 7 Royaume des Ombres. Chacune : un gardien, des secrets, des ennemis, un fragment.

**Fin de la saison 1** : l'Ombre Éternelle est l'ancien premier Veilleur, créateur de la Flamme, consumé par son pouvoir. Choix final du joueur : restaurer la Flamme (devenir le Veilleur éternel → suite *L'Héritier de la Flamme*), la détruire (*Le Monde sans Flamme*) ou fusionner avec l'Ombre (*Le Dernier Serment*). Le fichier de suite correspondant au choix raconte la fin. La saison 2 (prologue « Les Échos de l'Origine ») vient après. À prévoir plus tard : sauvegarder le choix du joueur.

Textes du jeu : `src/story/story.js` (INTRO, ENDING, arrivées, PNJ, intros/outros de boss) est **adapté au tableau ci-dessus** (v0.4.2) ; les quêtes, leurs identifiants et leurs récompenses n'ont pas changé, seul le mot « éclats » est devenu « étincelles ».

## Dialogues animés (fait, v0.4.3)
- **Voix « blips »** : un petit son par lettre, propre à chaque personnage, généré en Web Audio (aucun fichier). Module `src/audio/Voice.js` : tableau `PROFILES` (hauteur, forme d'onde, durée, couleur du nom), une voix déduite du nom pour tout personnage inconnu. La hauteur varie selon la lettre (voyelles plus aiguës) ; un blip toutes les 2 lettres ; pas de blip sur les espaces ni la ponctuation. Volume = volume « effets sonores » des options.
  - Lueur : aiguë, cristalline · Le Veilleur : médium doux · Mousse l'Ancien : grave et lente · Zéphyr : légère, rapide, vibrato · Mirelle : douce · Narration : discrète · Boss : graves ou soufflées, texte tremblant (Gardienne : carrée grave ; Souffle Ancien : souffle filtré ; Roi Gélatine : glissando mou).
- **Écriture plus vivante** (`src/ui/Dialogue.js`) : pauses après `.` `,` `!` `?` `…` ; lettres qui apparaissent avec un petit effet (rebond/fondu) ; balises dans les textes : `*mot*` = mot en or lumineux (Flamme, Ombre, noms clés), `~texte~` = texte tremblant (boss, cris) ; lignes entre parenthèses = voix lointaine (italique, murmurée) ; nom du personnage et cadre de la boîte dans la couleur de sa voix ; toucher la boîte pendant l'écriture = tout afficher, puis ▼ pour passer à la suite. Mise en page calculée dès le début de la ligne pour que les mots ne sautent pas de ligne en cours d'écriture.
- État : **fait (v0.4.3)** — `src/audio/Voice.js` (profils de voix) et `src/ui/Dialogue.js` (écriture animée) sont dans le jeu ; `story.js` est déjà adapté à l'histoire (v0.4.2). Mots clés dorés automatiquement : Flamme, Ombre, fragments, étincelles. Ajouter un personnage = une ligne dans `PROFILES`.

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

## Étincelles, compétences, quêtes
- Étincelles ✦ (anciennement « éclats », voir Vocabulaire) : 2 par ennemi (× multiplicateur du chapitre), 10 par coffre, 25-40 par mini-boss, 40 par boss, + récompenses de quêtes.
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
├── histoires/                 # saison-1/ (histoire de base + 3 suites selon le choix final) · saison-2/ (prologue)
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
│   ├── objects/ (Interactables : S/D/W/C ; Shards : étincelles ✦ ; Npc : PNJ 'N' ; Portals : paires T/t, sortie de chapitre, arrivée)
│   ├── story/story.js         # textes FR : intro, épilogue, PNJ, quêtes, arrivées, intros/outros de boss
│   ├── ui/ (Input, HUD [vie, énergie, ✦, quête], Dialogue [machine à écrire animée, voix blips, pauses, mots dorés], Menu [accueil calqué sur la maquette, options, crédits, pause, arbre de compétences SVG, quêtes])
│   ├── audio/
│   │   ├── Music.js           # musique procédurale (Web Audio) par chapitre/boss/menu + effets sonores, volumes
│   │   └── Voice.js           # voix « blips » des dialogues, profils par personnage (PROFILES)
│   └── systems/ (Effects [additifs : croissant, étincelles, anneaux, chiffres], Skills, Quests, SaveSystem, Hazards [zones de danger des boss])
└── assets/                    # images générées par tools/build_assets.py (≈ 2,5 Mo) — à ajouter à la main sur GitHub
    ├── characters/ seeker_{idle,run,jump,attack,hurt,death}.png (Hooded Seeker Lite) + hero_* (ancien sorcier, repli)
    ├── enemies/    slime_green, slime_orange, spore, boss_poison, boss_wind
    ├── effects/    plant1, plant4, blueflower (décors animés), portal_{blue,yellow,red} (pack Pixel Portal, 21 images de 64 px)
    ├── maps/       tiles_mossy, tiles_mond, tiles_village (3x3 tranches de 64 px)
    ├── backgrounds/ windrise.jpg
    ├── ui/         menu_bg.jpg (fond du menu, texte retiré), logo.png (logo encadré, fond transparent), cursor.png (icône de sélection)
    └── fonts/      eb-garamond-latin-400/500-normal.woff2 (police du menu, embarquée pour jouer hors ligne)
```

## Légende des cartes
`#` solide · `=` plateforme traversable · `^` pics · `P` départ · `c` slime · `f` spore volante · `k` cracheur · `h` sauteur · `w` esprit volant · `r` brute · `S` sauvegarde · `C` coffre · `D` orbe double saut · `W` orbe saut mural · `B` boss · `T`/`t` portails appariés (le i-ème T avec le i-ème t ; le dernier `t` est dans l'arène) · `M` mini-boss · `N` PNJ · décor : `p` plante, `q` tige, `b` fleur bleue

## Contrôles
- Tactile : joystick gauche, SAUT, ATTAQUE (appui = coup immédiat ; maintenir après le coup puis relâcher = chargée), DASH, SPÉC., II = pause
- Clavier : flèches/ZQSD, Espace/K saut, J attaque, L/Maj dash, U spécial, Échap pause (Bas + U = Nova si débloquée)
- Haut + attaque = coup vers le haut ; bas + attaque en l'air = coup plongeant (rebond sur ennemi) ; HAUT devant un portail = entrer
- Test direct d'un chapitre : `index.html?chapitre=2` (sans sauvegarde)

## Feuille de route
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
12. Menu d'accueil calqué sur la maquette — fait (v0.4.1)
13. Histoire adaptée (story.js) + renommage éclats → étincelles — fait (v0.4.2)
14. Dialogues animés (voix blips, écriture vivante, balises `*or*` `~tremble~`) — fait (v0.4.3)
15. Suite de l'histoire : régions 2 à 7, choix final (3 suites de la saison 1), puis saison 2 — à planifier
