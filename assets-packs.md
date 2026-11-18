# Intégration des packs d'assets (Bot Wheel, Plants Animated, Cave Maaot, ennemis)

## Bot Wheel → avatar de L'Ombre Éternelle (boss final, Royaume des Ombres)
Feuilles verticales, cellules 117×26 px (corps dans les 39 px de gauche, FX qui débordent).
`python3 tools/build_botwheel.py "<dossier Bot Wheel>" assets/enemies` produit des bandes horizontales `ombre_*.png` (pixel:true) :

| Bande | Frames | Usage dans le combat |
|---|---|---|
| ombre_wake | 5 | intro / réveil (bossIntro) |
| ombre_idle | 1 | attente entre attaques |
| ombre_move | 8 | patrouille / poursuite (phase 1) |
| ombre_charge | 4 | télégraphie avant tir ou dash |
| ombre_shoot | 4 | salve de projectiles (FX inclus) |
| ombre_dash | 7 | charge fulgurante (phase 2-3) |
| ombre_hurt | 2 | dégâts |
| ombre_death | 6 | mort (fin / choix final) |

Taille en jeu : ~4×4 tuiles (sprite pixel agrandi), pivot aux pieds. Le boss n'est pas encore dans le jeu (zone Ombres = jalon 5) : manifest à compléter à ce moment-là.
Les .gif « hot wheels » = animations de roue à part (option : phase 3 « forme roue »).

## Plants Animated → décor animé
Séquences PNG (30–45 images, 256–1024 px) : trop lourdes pour mobile telles quelles.
Plan : script d'export réduisant à 8–12 images, 128 px, en bande horizontale (herbe/plantes Forêt, Ruines, Champignons), affichées en décor derrière le joueur.

## Cave Assets → tileset grottes
Pack peint à la main (haute résolution, non pixel-art) : rochers, sol, plateformes. Style différent du Seeker en pixel art → à utiliser en décor d'arrière-plan et plateformes de Ruines/Citadelle/Cendre après réduction et léger filtre de palette.

## Licences
Aucune licence trouvée dans les packs. Vérifier les conditions avant de publier : le dépôt est public, donc ne pas versionner les fichiers sources (PNG générés seulement si la licence le permet, sinon dépôt privé).

## Ordre des régions (à corriger dans monde.md et la carte)
Selon l'histoire : Plaines, Forêt, Ruines, Cendre, Champignons, Citadelle (dernier refuge des anciens Veilleurs), Ombres.

## Ennemis supplémentaires (packs Dark Fantasy Enemies, Monsters Creatures Fantasy 2, Fire Worm)
`tools/build_bat.py` (chauve-souris 64 px) et `tools/build_monsters.py` (copie les bandes dans assets/enemies/, pixel:true).

| Ennemi | Cellule | Bandes (images) | Usage prévu |
|---|---|---|---|
| Chauve-souris (DFE) | 64 | fly 9, dive 8, hurt 5, die 12 | **Branchée** : Flyer utilise bat_fly si présent, sinon spore |
| Rat | 70 | idle 10, run 8, bite 12, hurt 3, death 6 | **Branché** : Crawler variant 'rat' (rat_run), pas encore assigné à un chapitre |
| Ver de feu | 90 | idle 9, walk 9, attack 16, hit 3, death 8 | Cendre : ennemi qui crache la boule de feu |
| Boule de feu | 46 | move 6, explosion 7 | projectile du ver de feu |
| Mimic | 146 | closed, opening 6, walk 6, attack 14, death 6… | coffre piégé (Ruines/Citadelle) |
| Slime (MCF2) | 156 | idle 14, walk 6, attack 19, hurt 3, death 11 | variante de slime (Champignons) |
| Chauve-souris 2 (MCF2) | 87 | fly 11, attack 11 | variante Ruines/Ombres |

Un fichier absent n'est pas bloquant : le jeu retombe sur les sprites existants. Licences non vérifiées (voir plus haut).
