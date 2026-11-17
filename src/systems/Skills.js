import { defaultStats } from '../player/Player.js';

// Compétences à débloquer avec les éclats de lumière. 3 branches ; `req` = compétence requise.
export const BRANCHES = {
  blade: { name: 'Lame', color: '#8fd8ff' },
  shadow: { name: 'Ombre', color: '#b59bff' },
  light: { name: 'Lumière', color: '#ffe08a' },
};


// pos : position du nœud dans l'arbre (viewBox 1000x500) ; icon : glyphe ; req : nœud parent (absent = relié à la racine)
export const ROOT = { id: 'root', name: 'Flamme du Veilleur', desc: 'Le point de départ de ton pouvoir.', pos: { x: 500, y: 62 }, icon: '✦' };
export const SKILLS = [
  { id: 'swift', branch: 'blade', name: 'Lame vive', cost: 8, icon: '⚡', pos: { x: 210, y: 170 }, desc: 'Attaques 25 % plus rapides.' },
  { id: 'power', branch: 'blade', name: 'Tranchant', cost: 16, req: 'swift', icon: '⚔', pos: { x: 100, y: 300 }, desc: '+1 dégât sur toutes les attaques.' },
  { id: 'combo4', branch: 'blade', name: 'Quatrième souffle', cost: 18, req: 'swift', icon: '✺', pos: { x: 300, y: 300 }, desc: 'Combo en 4 coups, finale dévastatrice.' },
  { id: 'wave', branch: 'blade', name: 'Onde de lame', cost: 24, req: 'combo4', icon: '≋', pos: { x: 300, y: 430 }, desc: "L'attaque chargée lance une onde qui traverse les ennemis." },

  { id: 'armor', branch: 'light', name: 'Armure de lueur', cost: 12, icon: '♥', pos: { x: 500, y: 170 }, desc: '+1 masque de vie (soigne aussi).' },
  { id: 'reserve', branch: 'light', name: 'Réserve de lumière', cost: 8, req: 'armor', icon: '◍', pos: { x: 500, y: 300 }, desc: 'Énergie maximale 9 → 12.' },
  { id: 'vampire', branch: 'light', name: 'Soif de lumière', cost: 20, req: 'reserve', icon: '☠', pos: { x: 430, y: 430 }, desc: 'Regagne 1 vie tous les 6 coups portés.' },
  { id: 'nova', branch: 'light', name: 'Nova', cost: 26, req: 'reserve', icon: '☀', pos: { x: 570, y: 430 }, desc: 'BAS + SPÉC. : onde de lumière autour de toi (4 énergie, 3 dégâts).' },

  { id: 'quickdash', branch: 'shadow', name: 'Éclair', cost: 8, icon: '➤', pos: { x: 790, y: 170 }, desc: 'Récupération du dash bien plus courte.' },
  { id: 'fleet', branch: 'shadow', name: 'Pas du vent', cost: 10, req: 'quickdash', icon: '≫', pos: { x: 900, y: 300 }, desc: 'Course plus rapide.' },
  { id: 'airdash', branch: 'shadow', name: 'Dash aérien', cost: 14, req: 'quickdash', icon: '⇪', pos: { x: 690, y: 300 }, desc: 'Un dash de plus en l’air.' },
  { id: 'ghost', branch: 'shadow', name: 'Dash spectral', cost: 22, req: 'airdash', icon: '◐', pos: { x: 690, y: 430 }, desc: 'Le dash traverse et blesse les ennemis, invincibilité prolongée.' },
];

export const skillById = (id) => (id === 'root' ? ROOT : SKILLS.find((s) => s.id === id));

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
  if (!s || id === 'root' || player.skills.includes(id)) return 'owned';
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
