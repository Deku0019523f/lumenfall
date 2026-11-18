# Carte du monde de Lumenfall

Complète la section « Structure du monde » de `plan.md`. Une seule carte reliée (style Hallownest) : le **Village Oublié** est le cœur, les régions de l'histoire rayonnent autour. Une version visuelle interactive existe (page « Carte de Lumenfall »).

## Décisions (validées par Alec)
- **Un fragment par boss de région.** Le Roi Gélatine donne le 2ᵉ fragment. Les Racines (chapitre d'ouverture, hors des sept régions) et le Royaume des Ombres ne donnent pas de fragment : sept fragments au total.
- **Verrous** : pouvoirs de la lanterne (histoire) + compétences de l'arbre (dash aérien, dash spectral) + orbes (double saut, saut mural).
- **Gardiens** : choisis ci-dessous (noms et attaques réutilisent les mouvements existants de `Boss.js`).
- La route principale reste faisable sans capacité optionnelle ; les verrous ferment des raccourcis, des coffres et les zones suivantes.

## Disposition (nord en haut)
```
 Plaines du Vent  ~~portail~~  Village Oublié ---(verrou)--- Montagnes de Cendre
   |  (portail)                 |  \                              |  (raccourci)
   |                            |   (verrou)                      |
Racines  --raccourci--  Forêt des Murmures      Citadelle Oubliée --(verrou)-- Royaume des Champignons
 Mousseuses                   | (verrou)             .                         |
                      Ruines Englouties --------canal (libre)-------------------+
                              | (verrou : 7 fragments)
                      Royaume des Ombres
```

## Zones, verrous et fragments
| Zone | État | Fragment | Accès (verrou) | Pouvoir gagné |
|------|------|----------|----------------|---------------|
| Racines Mousseuses | jouable | — | départ | double saut ; la lanterne s'éveille |
| Plaines du Vent | jouable | 1 | portail bleu après la Gardienne des Racines | saut mural |
| Village Oublié | jouable | 2 | portail jaune après le Souffle Ancien | parler aux esprits |
| Forêt des Murmures | à construire | 3 | parler aux esprits | éclairer les passages cachés |
| Ruines Englouties | à construire | 4 | éclairer les passages cachés | réveiller les anciens mécanismes |
| Citadelle Oubliée | à construire | 5 | réveiller les anciens mécanismes | repousser l'Ombre |
| Montagnes de Cendre | à construire | 6 | dash aérien ou raccourci de la Citadelle | — |
| Royaume des Champignons | à construire | 7 | canal depuis les Ruines, ou dash spectral | — |
| Royaume des Ombres | à construire | aucun | repousser l'Ombre + 7 fragments | choix final |

Parcours conseillé : Racines → Plaines → Village → Forêt → Ruines → Citadelle → Montagnes → Champignons → Royaume des Ombres.

## Liaisons
- Racines ↔ Plaines : portail bleu · Plaines ↔ Village : portail jaune (liaisons d'histoire déjà dans le jeu)
- Village ↔ Forêt : verrou (parler aux esprits) · Racines ↔ Forêt : raccourci qui s'ouvre depuis la Forêt
- Forêt ↔ Ruines : verrou (éclairer les passages cachés)
- Village ↔ Citadelle : verrou (réveiller les mécanismes) · Village ↔ Montagnes : verrou (dash aérien) · Citadelle ↔ Montagnes : raccourci
- Citadelle ↔ Champignons : verrou (dash spectral) · Ruines ↔ Champignons : canal libre
- Ruines ↔ Royaume des Ombres : verrou (repousser l'Ombre, 7 fragments)

## Gardiens, mini-boss et PNJ (noms choisis)
Les `moves` sont ceux de `Boss.js` (roots, volley, summon, charge, gust, blades, leap, burst, jump, multijump, rain) ; chaque boss en ajoute selon la phase.

| Zone | Boss (fragment) | Idée et attaques (`moves`) | Mini-boss | PNJ |
|------|----------------|---------------------------|-----------|-----|
| Forêt des Murmures | **L'Arbre-Chœur** | arbre dont les voix attaquent en chœur : roots, volley, summon (esprits), burst | Le Murmureur (volley, leap) | Sylve la Chuchoteuse |
| Ruines Englouties | **Le Colosse Noyé** | géant de pierre resté sous l'eau : rain (cascades), charge, leap, burst | La Méduse Aveugle (volley, rain) | Maël, pêcheur de lumière |
| Citadelle Oubliée | **Le Connétable de Fer** | automate-chef : charge, blades (lames), volley, rain (rouages) | Le Garde de Fer (charge, blades) | Tic, dernier automate |
| Montagnes de Cendre | **Le Forgeron de Cendre** | forgeron-volcan : leap, rain (météores), burst, charge | Le Brasier Errant (volley, leap) | Brasa la Forgeronne |
| Royaume des Champignons | **La Mère des Spores** | summon (petits champignons), volley (spores), roots, gust | Le Cueilleur de Spores (summon, volley) | Spora, herboriste |
| Royaume des Ombres | **L'Ombre Éternelle** (aucun fragment) | combat final en 3 phases, tous les mouvements ; puis choix : restaurer, détruire ou fusionner | L'Écho du Veilleur (miroir du héros : dash, charge) | Voix du Premier Veilleur |

Chaque boss a sa musique de boss (thème déjà géré par `Music.js`) et sa voix de dialogue (`Voice.js`, `PROFILES`).

## Taille du monde (estimation à ajuster)
Une **salle** = un écran de jeu continu de 30 à 60 tuiles de large, 18 à 36 de haut (embranchements verticaux), avec 1 à 4 sorties. Les trois cartes actuelles (600 à 900 tuiles) sont redessinées en salles.

| Zone | Salles | Dont |
|------|--------|------|
| Racines | 12 | départ, grotte, mini-boss, arène |
| Plaines | 16 | 2 tours à saut mural, mini-boss, arène |
| Village (hub) | 20 | quartier central (cristal, PNJ, portes), arène du Roi, salles-raccourcis |
| Forêt, Ruines, Citadelle, Montagnes, Champignons | 14 à 18 chacune | mini-boss, arène, 2 à 3 secrets |
| Royaume des Ombres | 12 | salles de résonance, arène finale |

Environ 140 salles au total.

## Modèle de données (étape A)
`src/levels/world.js` :
```
ZONES  = { racines: { theme, music, portal, bg, boss, mini, npc, fragment }, ... }
ROOMS  = { 'racines/r01': { zone, map (RLE), gx, gy,            // position sur la carte du monde
             exits: [{ side:'E', y0, y1, to:'racines/r02', at:'W', gate: null }] } }
GATES  = { spirits:'power', reveal:'power', mechanisms:'power', banish:'power',
           airdash:'skill', ghostdash:'skill', fragments7:'count', wall:'orb', double:'orb' }
```
- Une **sortie** couvre des tuiles du bord de la salle ; le joueur y entre et apparaît dans la salle voisine à la sortie `at`, à la même hauteur.
- Un **verrou** ferme visuellement la sortie (porte, voile d'Ombre, barrière de spores) tant que la condition n'est pas remplie ; un raccourci s'ouvre une seule fois, de l'autre côté.
- `World.js` charge une salle à la fois, conserve les salles voisines en mémoire pour une transition courte (fondu ou glissement).
- **Sauvegarde v4** : salles visitées, verrous et raccourcis ouverts, fragments (liste), pouvoirs de la lanterne, dernier cristal (salle, x, y), boss vaincus par zone. Les sauvegardes v3 sont converties (chapitre → zone).
- **Carte du monde** (menu) : dessine les salles visitées à leur position `gx, gy`, colorées par zone, avec cristaux, coffres vus, verrous et position du joueur.
- **Générateur** : `tools/make_maps.py` produit des salles avec sorties, puis vérifie par parcours de graphe que chaque zone est atteignable avec les pouvoirs dans l'ordre conseillé.

## Jalons (chacun jouable et testé avant le suivant)
1. **Tranche verticale Racines** : étapes A + B sur la zone des Racines seule (12 salles, transitions, sorties, cristal). Test : traverser la zone d'une salle à l'autre jusqu'au boss.
2. **Sauvegarde v4 et carte du monde** (étapes C + D).
3. **Plaines puis Village** redessinés en salles, portails d'histoire conservés, hub relié (étape E).
4. **Verrous et pouvoirs de la lanterne** (apparition des portes fermées, gains de pouvoirs).
5. **Zones 4 à 9**, une par une, avec gardien, fragment, PNJ et quêtes (étape F).
6. **Choix final et fins** (3 suites de la saison 1).
