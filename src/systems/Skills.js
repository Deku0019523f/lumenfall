import { defaultStats } from '../player/Player.js';

// Compétences à débloquer avec les éclats de lumière. 3 branches ; `req` = compétence requise.
export const BRANCHES = {
  blade: { name: 'Lame', color: '#8fd8ff' },
  shadow: { name: 'Ombre', color: '#b59bff' },
  light: { name: 'Lumière', color: '#ffe08a' },
};

export const SKILLS = [
  { id: 'swift', branch: 'blade', name: 'Lame vive', cost: 8, desc: 'Attaques 25 % plus rapides.' },
  { id: 'power', branch: 'blade', name: 'Tranchant', cost: 16, req: 'swift', desc: '+1 dégât sur toutes les attaques.' },
  { id: 'combo4', branch: 'blade', name: 'Quatrième souffle', cost: 18, req: 'swift', desc: 'Combo en 4 coups, finale dévastatrice.' },
  { id: 'wave', branch: 'blade', name: 'Onde de lame', cost: 24, req: 'combo4', desc: "L'attaque chargée lance une onde qui traverse les ennemis." },

  { id: 'quickdash', branch: 'shadow', name: 'Éclair', cost: 8, desc: 'Récupération du dash bien plus courte.' },
  { id: 'fleet', branch: 'shadow', name: 'Pas du vent', cost: 10, desc: 'Course plus rapide.' },
  { id: 'airdash', branch: 'shadow', name: 'Dash aérien', cost: 14, req: 'quickdash', desc: 'Un dash de plus en l’air.' },
  { id: 'ghost', branch: 'shadow', name: 'Dash spectral', cost: 22, req: 'airdash', desc: 'Le dash traverse et blesse les ennemis, invincibilité prolongée.' },

  { id: 'reserve', branch: 'light', name: 'Réserve de lumière', cost: 8, desc: 'Énergie maximale 9 → 12.' },
  { id: 'armor', branch: 'light', name: 'Armure de lueur', cost: 12, desc: '+1 masque de vie (soigne aussi).' },
  { id: 'vampire', branch: 'light', name: 'Soif de lumière', cost: 20, req: 'reserve', desc: 'Regagne 1 vie tous les 6 coups portés.' },
  { id: 'nova', branch: 'light', name: 'Nova', cost: 26, req: 'reserve', desc: 'BAS + SPÉC. : onde de lumière autour de toi (4 énergie, 3 dégâts).' },
];

export const skillById = (id) => SKILLS.find((s) => s.id === id);

export function computeStats(owned) {
  const has = (id) => owned.includes(id);
  const s = defaultStats();
  if (has('swift')) s.atkSpeed = 1.25;
  if (has('power')) s.power = 1;
  if (has('combo4')) s.combo4 = true;
  if (has('wave')) s.wave = true;
  if (has('quickdash')) s.dashCd = 0.28;
  if (has('fleet')) s.speed = 8.4;
  if (has('airdash')) s.airDashes = 2;
  if (has('ghost')) s.ghost = true;
  if (has('reserve')) s.maxEnergy = 12;
  if (has('vampire')) s.vampire = true;
  if (has('nova')) s.nova = true;
  return s;
}

// Applique l'ensemble des compétences au joueur (appelé au chargement et après chaque achat).
export function applySkills(player, owned) {
  player.skills = [...owned];
  player.stats = computeStats(owned);
  player.maxEnergy = player.stats.maxEnergy;
  player.energy = Math.min(player.energy, player.maxEnergy);
}

export function canBuy(player, id) {
  const s = skillById(id);
  if (!s || player.skills.includes(id)) return 'owned';
  if (s.req && !player.skills.includes(s.req)) return 'locked';
  if (player.shards < s.cost) return 'poor';
  return 'ok';
}

export function buy(player, id) {
  if (canBuy(player, id) !== 'ok') return false;
  const s = skillById(id);
  player.shards -= s.cost;
  applySkills(player, [...player.skills, id]);
  if (id === 'armor') { player.maxHp += 1; player.hp = player.maxHp; }
  return true;
}
