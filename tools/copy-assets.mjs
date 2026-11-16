// Copie assets/ dans dist/assets/ après `vite build` (les images ne passent pas par Vite : chargées à l'exécution).
import { cpSync, existsSync } from 'node:fs';
if (existsSync('assets')) { cpSync('assets', 'dist/assets', { recursive: true }); console.log('assets/ → dist/assets/'); }
else console.warn('Dossier assets/ absent : le jeu utilisera les sprites dessinés par code.');
