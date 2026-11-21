// Prologue animé (Saison 1) : textes tirés de histoires/saison-1/00-lumenfall-la-flamme-du-veilleur.txt (Prologue — La dernière lumière)
// puis la scène « Le petit Veilleur » (début du chapitre 1). Chaque scène a un décor animé (voir src/ui/Cinematic.js).
export const PROLOGUE_TITLE = { kicker: 'LUMENFALL — La Flamme du Veilleur', title: 'Prologue', sub: 'La dernière lumière' };

export const PROLOGUE = [
  { id: 'flamme', paras: [
    "Il y a plusieurs milliers d'années, le monde de Lumenfall était protégé par une force mystérieuse appelée la Flamme Originelle.",
    "Cette lumière maintenait l'équilibre entre les humains, les esprits et les anciennes créatures de la nature.",
  ] },
  { id: 'ombre', paras: [
    "Mais un jour, une entité oubliée, connue sous le nom de l'Ombre Éternelle, réussit à briser le sceau qui retenait ses pouvoirs.",
  ] },
  { id: 'chute', paras: [
    "Le ciel s'assombrit. Les royaumes tombèrent les uns après les autres. Les forêts perdirent leurs couleurs, les rivières cessèrent de couler et les esprits disparurent.",
  ] },
  { id: 'sacrifice', paras: [
    "Pour empêcher la destruction totale du monde, les anciens Veilleurs sacrifièrent leurs vies afin de fragmenter la Flamme Originelle en sept éclats.",
    "Ces fragments furent dispersés aux quatre coins du monde.",
  ] },
  { id: 'silence', paras: [
    "L'équilibre fut rétabli, mais à un prix terrible : les Veilleurs disparurent de l'histoire.",
  ] },
  { id: 'veilleur', paras: [
    "Un enfant, dont personne ne connaît l'origine, voit les esprits et entend parler les arbres. Une nuit, une lanterne s'est mise à brûler entre ses mains, d'une flamme violette.",
    "Une lumière traverse le ciel, et vient se poser devant lui.",
  ] },
];

// Fin de la partie (après le dialogue du Roi Gélatine) : le premier fragment rejoint la lanterne.
export const ENDING_TITLE = { kicker: 'LUMENFALL', title: 'Le premier fragment', sub: 'La Flamme t\'appelle' };
export const ENDING_CINE = [
  { id: 'eveil', paras: [
    "Un premier fragment de la Flamme a rejoint la lanterne du Veilleur.",
    "Six autres brillent encore, quelque part aux confins du monde.",
  ] },
];
