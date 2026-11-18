# Carte du monde de Lumenfall (proposition)

Complète la section « Structure du monde » de `plan.md`. Une seule carte reliée (style Hallownest) : le **Village Oublié** est le cœur, les régions de l'histoire rayonnent autour. Une version visuelle interactive a été publiée en page (« Carte de Lumenfall »).

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
Le Village est relié à la Forêt, à la Citadelle et aux Montagnes ; les Ruines mènent aux Champignons et au Royaume des Ombres.

## Zones
| Zone | État | Fragment | Accès (verrou) | Pouvoir gagné |
|------|------|----------|----------------|---------------|
| Racines Mousseuses | jouable | — | départ | double saut ; la lanterne s'éveille |
| Plaines du Vent | jouable | 1 | portail bleu après la Gardienne des Racines | saut mural |
| Village Oublié | jouable | 2 (Roi Gélatine) | portail jaune après le Souffle Ancien | parler aux esprits |
| Forêt des Murmures | à construire | 3 | parler aux esprits | éclairer les passages cachés |
| Ruines Englouties | à construire | 4 | éclairer les passages cachés | réveiller les anciens mécanismes |
| Citadelle Oubliée | à construire | 5 | réveiller les anciens mécanismes | repousser l'Ombre |
| Montagnes de Cendre | à construire | 6 | dash aérien (compétence) ou raccourci de la Citadelle | — |
| Royaume des Champignons | à construire | 7 | canal depuis les Ruines, ou dash spectral | — |
| Royaume des Ombres | à construire | aucun | repousser l'Ombre + 7 fragments | choix final |

L'ordre des fragments suit le parcours conseillé (chaque pouvoir est gagné avant le verrou qui le demande). Le Royaume des Ombres n'a pas de fragment : il s'ouvre avec les sept, ce qui donne bien sept fragments au total.

## Liaisons
- Racines ↔ Plaines : portail (histoire) · Plaines ↔ Village : portail (histoire)
- Village ↔ Forêt : verrou (parler aux esprits) · Racines ↔ Forêt : raccourci qui s'ouvre depuis la Forêt
- Forêt ↔ Ruines : verrou (éclairer les passages cachés)
- Village ↔ Citadelle : verrou (réveiller les mécanismes) · Village ↔ Montagnes : verrou (dash aérien) · Citadelle ↔ Montagnes : raccourci
- Citadelle ↔ Champignons : verrou (dash spectral) · Ruines ↔ Champignons : canal libre
- Ruines ↔ Royaume des Ombres : verrou (repousser l'Ombre, 7 fragments)

## Parcours conseillé
Racines → Plaines → Village → Forêt → Ruines → Citadelle → Montagnes → Champignons → Royaume des Ombres.

## À valider
1. Fragment du Village = 2ᵉ fragment, Royaume des Ombres sans fragment.
2. Pouvoirs de la lanterne comme verrous (sinon verrous par compétences seules).
3. Noms et attaques des gardiens des régions 2 à 7.
4. Taille des zones en salles (étape A de `plan.md`).
