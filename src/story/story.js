// Histoire de Lumenfall : textes (français), dialogues et quêtes par chapitre.
// who : 'Lueur' (petit esprit lumineux, guide du héros), un nom de PNJ, ou 'Le Veilleur' (le héros).
// Vocabulaire : « fragments » = les sept morceaux de la Flamme Originelle (l'enjeu de l'histoire) ;
//               « étincelles » ✦ = la monnaie du jeu (arbre de compétences). Ne pas les confondre.

export const INTRO = [
  { who: '', text: "Jadis, la Flamme Originelle veillait sur Lumenfall. Grâce à elle, les humains, les esprits et les créatures de la nature vivaient en équilibre." },
  { who: '', text: "Puis l'Ombre Éternelle a brisé son sceau. Pour l'arrêter, les anciens Veilleurs se sont sacrifiés : ils ont fragmenté la Flamme en sept fragments, dispersés aux quatre coins du monde." },
  { who: '', text: "Les Veilleurs ont disparu des légendes. Des siècles ont passé." },
  { who: '', text: "Un enfant, dont personne ne connaît l'origine, voit les esprits et entend parler les arbres. Une nuit, une lanterne s'est mise à brûler entre ses mains, d'une flamme violette." },
  { who: '', text: "Une lumière traverse le ciel, et vient se poser devant lui." },
  { who: 'Lueur', text: "Enfin… le dernier héritier s'est réveillé. Le monde a besoin de son Veilleur." },
  { who: 'Lueur', text: "Je suis Lueur. Ta lanterne reconnaît les fragments de la Flamme : retrouve-les. Mais commence par les Racines, là où l'Ombre a chassé les créatures du village." },
];

export const ENDING = [
  { who: 'Le Roi Gélatine', text: "Impossible… la lumière de la maison… elle me brûle de l'intérieur…" },
  { who: 'Lueur', text: "Un fragment de la Flamme ! Ta lanterne s'illumine, Veilleur. Tu entends ? La Flamme t'appelle." },
  { who: 'Le Veilleur', text: "Alors l'Ombre est vaincue ?" },
  { who: 'Lueur', text: "Pas encore. Elle commence seulement à nous observer. Il reste d'autres régions à traverser : la Forêt des Murmures, les Ruines Englouties, les Montagnes de Cendre…" },
  { who: 'Lueur', text: "Mais pour ce soir, repose-toi. Tu as porté la flamme jusqu'au bout de ce chemin. Merci d'avoir joué." },
];

// Types de quêtes : kill (ennemis tués), chest (coffres ouverts), talk, mini (mini-boss), boss, orb
export const STORY = [
  {
    arrival: [
      { who: 'Lueur', text: "Nous voici aux Racines Mousseuses. Les créatures obscures, repoussées du village par ta lanterne, ont fui jusqu'ici." },
      { who: 'Lueur', text: "L'Ombre les a rendues folles de peur. Sois prudent, Veilleur." },
    ],
    npc: {
      name: 'Mousse l\'Ancien',
      lines: [
        { who: 'Mousse l\'Ancien', text: "Un Veilleur ! Je croyais votre lignée disparue. Approche, petit. Cette lanterne… elle brûle encore." },
        { who: 'Mousse l\'Ancien', text: "La Gardienne des Racines protège le passage vers les plaines, mais l'Ombre l'a corrompue." },
        { who: 'Mousse l\'Ancien', text: "Aide-moi à calmer ces bois : chasse les bêtes enragées, ouvre les coffres des anciens, et bats le gardien du pont." },
        { who: 'Lueur', text: "Chaque exploit te rapportera des étincelles. Ouvre le menu (II) pour les dépenser en compétences." },
      ],
    },
    quests: [
      { id: 'c1_talk', type: 'talk', goal: 1, title: "Parler à Mousse l'Ancien", reward: 3 },
      { id: 'c1_kill', type: 'kill', goal: 25, title: 'Chasser 25 créatures enragées', reward: 15 },
      { id: 'c1_chest', type: 'chest', goal: 5, title: 'Ouvrir 5 coffres des anciens', reward: 15 },
      { id: 'c1_mini', type: 'mini', goal: 1, title: 'Vaincre le Gardien du Pont', reward: 20 },
      { id: 'c1_boss', type: 'boss', goal: 1, title: 'Vaincre la Gardienne des Racines', reward: 30 },
    ],
    bossIntro: [{ who: 'La Gardienne des Racines', text: "Va-t'en… la lumière… me brûle…" }],
    outro: [
      { who: 'Mousse l\'Ancien', text: "(Une voix lointaine) Tu as réussi, Veilleur. Les racines respirent de nouveau, et ta lanterne brille plus fort. Va, le vent t'attend." },
      { who: 'Lueur', text: "Un portail s'ouvre sur les Plaines du Vent. Là-bas, je sens le premier fragment de la Flamme." },
    ],
  },
  {
    arrival: [
      { who: 'Lueur', text: "Le vent est plein de voix ici. Écoute : il porte le premier fragment de la Flamme… et des cris." },
      { who: 'Lueur', text: "Ta lanterne peut éclairer les passages cachés, réveiller les anciens mécanismes et repousser l'Ombre. Mais prends garde : chaque fragment pris réveille une part de l'Ombre." },
    ],
    npc: {
      name: 'Zéphyr',
      lines: [
        { who: 'Zéphyr', text: "Ho, voyageur ! Moi, c'est Zéphyr, éclaireur des plaines. Le vent m'a dit que tu viendrais." },
        { who: 'Zéphyr', text: "Le Souffle Ancien dort tout au bout, et il garde le fragment. Mais l'Ombre l'a réveillé, et il disperse tout aux quatre vents." },
        { who: 'Zéphyr', text: "Cherche les tours de pierre : ceux qui savent s'accrocher aux murs y trouvent des trésors." },
      ],
    },
    quests: [
      { id: 'c2_talk', type: 'talk', goal: 1, title: "Écouter Zéphyr", reward: 3 },
      { id: 'c2_orb', type: 'orb', goal: 1, title: 'Trouver l\'orbe du vent (saut mural)', reward: 10 },
      { id: 'c2_kill', type: 'kill', goal: 40, title: 'Repousser 40 créatures des plaines', reward: 25 },
      { id: 'c2_chest', type: 'chest', goal: 7, title: 'Ouvrir 7 coffres', reward: 25 },
      { id: 'c2_mini', type: 'mini', goal: 1, title: 'Vaincre la Sentinelle du Vent', reward: 25 },
      { id: 'c2_boss', type: 'boss', goal: 1, title: 'Vaincre le Souffle Ancien', reward: 40 },
    ],
    bossIntro: [{ who: 'Le Souffle Ancien', text: "Le fragment… est à moi. Emporté… par la tempête." }],
    outro: [
      { who: 'Zéphyr', text: "(Dans le vent) Le village est au sud, Veilleur. On dit que plus personne n'en est revenu." },
      { who: 'Lueur', text: "Tu as pris le premier fragment, et l'Ombre l'a senti. Alors nous serons les premiers à revenir du village." },
    ],
  },
  {
    arrival: [
      { who: 'Lueur', text: "Le Village Oublié… Autrefois, un refuge des Veilleurs. L'Ombre y est la plus épaisse. Reste près de moi." },
    ],
    npc: {
      name: 'Mirelle',
      lines: [
        { who: 'Mirelle', text: "Doucement ! Ne fais pas de bruit… Oh. Tu brilles. Tu es celui de la prophétie ?" },
        { who: 'Mirelle', text: "Le Roi Gélatine règne sur nos maisons. Il avale chaque lueur qu'il trouve, et il garde un fragment de la Flamme." },
        { who: 'Mirelle', text: "Tous les coffres du village sont à toi si tu nous libères. Prends-les, prends tout, mais bats-le !" },
      ],
    },
    quests: [
      { id: 'c3_talk', type: 'talk', goal: 1, title: 'Rassurer Mirelle', reward: 3 },
      { id: 'c3_kill', type: 'kill', goal: 55, title: 'Nettoyer le village : 55 créatures', reward: 35 },
      { id: 'c3_chest', type: 'chest', goal: 9, title: 'Ouvrir 9 coffres', reward: 35 },
      { id: 'c3_mini', type: 'mini', goal: 1, title: 'Vaincre le Veilleur Gelé', reward: 30 },
      { id: 'c3_boss', type: 'boss', goal: 1, title: 'Vaincre le Roi Gélatine', reward: 60 },
    ],
    bossIntro: [
      { who: 'Le Roi Gélatine', text: "Une petite lumière ? Je vais l'avaler… comme les autres." },
      { who: 'Lueur', text: "Tiens bon, Veilleur. Il garde un fragment de la Flamme, et il a avalé la lumière des maisons." },
    ],
    outro: [],
  },
];
