#!/usr/bin/env python3
"""Packs « Monsters Creatures Fantasy 2 » et « Fire Worm » : copie les bandes utiles dans assets/enemies (pixel:true).
Usage : python3 tools/build_monsters.py "<dossier Monsters Creatures Fantasy 2>" "<dossier Fire Worm>" [sortie=assets/enemies]
Cellules : Rat 70, Bat 87, Mimic 146, Slime 156, Worm 90, Fire Ball 46 (px, carrées sauf Bat 87x87)."""
import sys, os, shutil
from PIL import Image
mc, fw = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else 'assets/enemies'
os.makedirs(out, exist_ok=True)
J = os.path.join
FILES = {  # sortie : (fichier source, taille de cellule)
  'rat_idle': (J(mc, 'Rat/idle.png'), 70), 'rat_run': (J(mc, 'Rat/run.png'), 70), 'rat_bite': (J(mc, 'Rat/attack_bite.png'), 70),
  'rat_hurt': (J(mc, 'Rat/hurt.png'), 70), 'rat_death': (J(mc, 'Rat/rat-death.png'), 70),
  'mimic_closed': (J(mc, 'Mimic/Idle_closed.png'), 146), 'mimic_opening': (J(mc, 'Mimic/opening.png'), 146),
  'mimic_walk': (J(mc, 'Mimic/walk.png'), 146), 'mimic_attack': (J(mc, 'Mimic/attack_1.png'), 146), 'mimic_death': (J(mc, 'Mimic/death.png'), 146),
  'bat2_fly': (J(mc, 'Bat/fly.png'), 87), 'bat2_attack': (J(mc, 'Bat/attack.png'), 87),
  'worm_idle': (J(fw, 'Sprites/Worm/Idle.png'), 90), 'worm_walk': (J(fw, 'Sprites/Worm/Walk.png'), 90), 'worm_attack': (J(fw, 'Sprites/Worm/Attack.png'), 90),
  'worm_hurt': (J(fw, 'Sprites/Worm/Get Hit.png'), 90), 'worm_death': (J(fw, 'Sprites/Worm/Death.png'), 90),
  'fireball_move': (J(fw, 'Sprites/Fire Ball/Move.png'), 46), 'fireball_boom': (J(fw, 'Sprites/Fire Ball/Explosion.png'), 46),
}
for name, (f, cell) in FILES.items():
    shutil.copyfile(f, J(out, name + '.png'))
    print(name + '.png', Image.open(f).width // cell, 'frames')
