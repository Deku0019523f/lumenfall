// Décodage des cartes compressées (RLE) : un caractère suivi de son nombre de répétitions (ex. « .300 » = 300 points).
export function decode(rows) {
  return rows.map((r) => r.replace(/(\D)(\d*)/g, (_, c, n) => c.repeat(n ? parseInt(n, 10) : 1)));
}
