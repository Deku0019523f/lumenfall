# Bestiaire de Lumenfall

Tous les ennemis ordinaires sont définis dans **`src/enemies/Bestiary.js`** (un seul endroit). Les boss restent dans `src/bosses/`.

## Comment ça marche
- La carte (ASCII) ne contient que des **emplacements** : `c` rampant, `f` volant, `k` tireur, `h` sauteur, `w` esprit, `r` brute.
- Chaque chapitre (`src/levels/chapters.js`) a un **`roster`** : qui occupe quel emplacement. Une liste `['rat','slime']` répartit les ennemis de façon déterministe (même carte → mêmes ennemis).
- `spawnEnemy()` (Bestiary.js) crée l'ennemi ; `World.js` ne connaît plus les classes.
- **Animations par états** (`Enemy.js`) : `skin.states = { move, idle, attack, hurt, death, … }` = clés de bandes (`assets/enemies/<id>_<anim>.png`, déclarées dans `manifest.js`). L'IA demande une animation avec `this.want = 'attack'` ; `hurt` est automatique quand l'ennemi est touché ; `death` joue en entier puis le cadavre s'efface (`game.corpses`).
- **Repli** : si les images d'un ennemi manquent, il utilise `skin.fallback` (ancien sprite) ou le dessin par code. Le jeu ne bloque jamais.
- `faces: 'right'` indique que le dessin d'origine regarde à droite (les anciens sprites regardent à gauche).

## Catalogue
| Id | Nom | IA (classe) | Chapitres | Images |
|---|---|---|---|---|
| slime | Slime | Crawler | 1, 3 | slime_green (ancien) |
| slimeOr | Slime orangé | Crawler | 2 | slime_orange (ancien) |
| rat | Rat des racines | Crawler (rapide) | 1, 2, 3 | rat_* |
| spore | Spore volante | Flyer | 1 | spore (ancien) |
| bat | Chauve-souris | Flyer (plongeon = attaque) | 1, 2, 3 | bat_fly/dive/hurt/die |
| batGrande | Grande chauve-souris | Flyer | 2, 3 | bat2_* |
| cracheur | Cracheur | Spitter | 1, 2, 3 | slime_green teinté |
| sauteur | Sauteur | Hopper | 3 | slime_green teinté |
| esprit | Esprit | Wisp | (cartes) | spore teinté |
| brute | Brute | Brute | (cartes) | slime_orange teinté |
| verFeu | Ver de feu | FireWorm : s'arrête, se dresse, crache une boule de feu | 2, 3 | worm_*, fireball_move |
| mimic | Mimic | Mimic : coffre fermé, s'ouvre quand on approche, poursuit et mord | 3 | mimic_* |

## Ajouter un ennemi
1. Convertir les images en bandes horizontales dans `assets/enemies/<id>_<anim>.png` (scripts `tools/build_*.py`).
2. Déclarer les bandes dans `ENEMY_SHEETS` (manifest.js : nombre d'images par animation).
3. Ajouter l'entrée dans `BESTIARY` (Bestiary.js) avec sa classe d'IA et son `skin.states`.
4. L'affecter à un emplacement dans le `roster` d'un chapitre.
Nouvelle IA : une classe qui étend `Enemy` avec `ai(game, dt)` ; elle règle `this.dir`, `this.vx`, `this.want`.

## Images à ajouter à la main (assets/enemies/)
Voir `assets-packs.md` ; les scripts : `tools/build_bat.py`, `tools/build_monsters.py`, `tools/build_botwheel.py`. Les ennemis de ces packs (Dark Fantasy Enemies, Monsters Creatures Fantasy 2, Fire Worm) sont utilisés avec l'accord d'Alec (packs obtenus légalement auprès des créateurs, itch.io).

## Réservé pour plus tard
Ombre Éternelle (`ombre_*`, boss final, Bot Wheel) ; slime MCF2 (variante Champignons).
