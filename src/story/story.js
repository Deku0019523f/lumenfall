// Histoire de Lumenfall : textes (français), dialogues et quêtes par chapitre.
// who : 'Lueur' (esprit-guide du héros), un nom de PNJ, ou 'Le Veilleur' (le héros).

export const INTRO = [
  { who: '', text: "Jadis, l'Arbre-Lumière veillait sur le monde. Chaque nuit, ses fruits d'or tombaient doucement sur les terres, et rien ne faisait peur à personne." },
  { who: '', text: "Puis la Nuit a grandi. L'Arbre s'est brisé, et sa lumière s'est éparpillée en mille éclats, tombés jusqu'aux racines du monde." },
  { who: 'Lueur', text: "Veilleur… tu m'entends ? Je suis Lueur, le dernier souffle de l'Arbre. Tu es le seul à pouvoir encore porter la flamme." },
  { who: 'Lueur', text: "Retrouve les éclats de lumière. Chaque éclat te rendra plus fort. Descends aux Racines, traverse les Plaines, atteins le Village Oublié." },
];

export const ENDING = [
  { who: 'Le Roi Gélatine', text: "Impossible… la Nuit ne peut pas… s'éteindre…" },
  { who: 'Lueur', text: "Regarde, Veilleur. Les éclats se rassemblent. Là-haut, l'Arbre-Lumière refleurit." },
  { who: 'Le Veilleur', text: "Alors c'est fini ?" },
  { who: 'Lueur', text: "Non. C'est le début d'un nouveau jour. Merci d'avoir porté la flamme jusqu'au bout." },
];

// Types de quêtes : kill (ennemis tués), chest (coffres ouverts), talk, mini (mini-boss), boss, orb
export const STORY = [
  {
    arrival: [
      { who: 'Lueur', text: "Nous voici aux Racines Mousseuses. Les créatures d'ici ont bu la lumière brisée : elles sont folles de peur." },
    ],
    npc: {
      name: 'Mousse l\'Ancien',
      lines: [
        { who: 'Mousse l\'Ancien', text: "Un Veilleur ! Je croyais votre lignée disparue. Approche, petit." },
        { who: 'Mousse l\'Ancien', text: "La Gardienne des Racines protège le passage vers les plaines, mais le poison de la Nuit l'a corrompue." },
        { who: 'Mousse l\'Ancien', text: "Aide-moi à calmer ces bois : chasse les bêtes enragées, ouvre les coffres des anciens, et bats le gardien de la clairière." },
        { who: 'Lueur', text: "Chaque exploit te rapportera des éclats. Ouvre le menu (II) pour les dépenser en compétences." },
      ],
    },
    quests: [
      { id: 'c1_talk', type: 'talk', goal: 1, title: "Parler à Mousse l'Ancien", reward: 3 },
      { id: 'c1_kill', type: 'kill', goal: 12, title: 'Chasser 12 créatures enragées', reward: 15 },
      { id: 'c1_chest', type: 'chest', goal: 2, title: 'Ouvrir 2 coffres des anciens', reward: 15 },
      { id: 'c1_mini', type: 'mini', goal: 1, title: 'Vaincre le Gardien du Pont', reward: 20 },
      { id: 'c1_boss', type: 'boss', goal: 1, title: 'Vaincre la Gardienne des Racines', reward: 30 },
    ],
    bossIntro: [{ who: 'La Gardienne des Racines', text: "Va-t'en… la lumière… me brûle…" }],
    outro: [
      { who: 'Mousse l\'Ancien', text: "(Une voix lointaine) Tu as réussi, Veilleur. Les racines respirent de nouveau. Va, le vent t'attend." },
      { who: 'Lueur', text: "Les Plaines du Vent s'ouvrent devant nous." },
    ],
  },
  {
    arrival: [
      { who: 'Lueur', text: "Le vent est plein de voix ici. Écoute : il porte des éclats… et des cris." },
    ],
    npc: {
      name: 'Zéphyr',
      lines: [
        { who: 'Zéphyr', text: "Ho, voyageur ! Moi, c'est Zéphyr, éclaireur des plaines. Le vent m'a dit que tu viendrais." },
        { who: 'Zéphyr', text: "Le Souffle Ancien dort tout au bout, mais la Nuit l'a réveillé. Il disperse les éclats aux quatre vents." },
        { who: 'Zéphyr', text: "Cherche les tours de pierre : ceux qui savent s'accrocher aux murs y trouvent des trésors." },
      ],
    },
    quests: [
      { id: 'c2_talk', type: 'talk', goal: 1, title: "Écouter Zéphyr", reward: 3 },
      { id: 'c2_orb', type: 'orb', goal: 1, title: 'Trouver l\'orbe du vent (saut mural)', reward: 10 },
      { id: 'c2_kill', type: 'kill', goal: 20, title: 'Repousser 20 créatures des plaines', reward: 25 },
      { id: 'c2_chest', type: 'chest', goal: 3, title: 'Ouvrir 3 coffres', reward: 25 },
      { id: 'c2_mini', type: 'mini', goal: 1, title: 'Vaincre la Sentinelle du Vent', reward: 25 },
      { id: 'c2_boss', type: 'boss', goal: 1, title: 'Vaincre le Souffle Ancien', reward: 40 },
    ],
    bossIntro: [{ who: 'Le Souffle Ancien', text: "Les éclats… sont à moi. Emportés… par la tempête." }],
    outro: [
      { who: 'Zéphyr', text: "(Dans le vent) Le village est au sud, Veilleur. On dit que plus personne n'en est revenu." },
      { who: 'Lueur', text: "Alors nous serons les premiers." },
    ],
  },
  {
    arrival: [
      { who: 'Lueur', text: "Le Village Oublié… La Nuit y est la plus épaisse. Reste près de moi." },
    ],
    npc: {
      name: 'Mirelle',
      lines: [
        { who: 'Mirelle', text: "Doucement ! Ne fais pas de bruit… Oh. Tu brilles. Tu es celui de la prophétie ?" },
        { who: 'Mirelle', text: "Le Roi Gélatine règne sur nos maisons. Il avale chaque éclat de lumière qu'il trouve." },
        { who: 'Mirelle', text: "Tous les coffres du village sont à toi si tu nous libères. Prends-les, prends tout, mais bats-le !" },
      ],
    },
    quests: [
      { id: 'c3_talk', type: 'talk', goal: 1, title: 'Rassurer Mirelle', reward: 3 },
      { id: 'c3_kill', type: 'kill', goal: 28, title: 'Nettoyer le village : 28 créatures', reward: 35 },
      { id: 'c3_chest', type: 'chest', goal: 4, title: 'Ouvrir 4 coffres', reward: 35 },
      { id: 'c3_mini', type: 'mini', goal: 1, title: 'Vaincre le Veilleur Gelé', reward: 30 },
      { id: 'c3_boss', type: 'boss', goal: 1, title: 'Vaincre le Roi Gélatine', reward: 60 },
    ],
    bossIntro: [
      { who: 'Le Roi Gélatine', text: "Une petite lumière ? Je vais l'avaler… comme les autres." },
      { who: 'Lueur', text: "Tiens bon, Veilleur. C'est lui qui a la dernière part de l'Arbre." },
    ],
    outro: [],
  },
];
