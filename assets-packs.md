# Intégration des packs d'assets (Bot Wheel, Plants Animated, Cave Maaot)

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
