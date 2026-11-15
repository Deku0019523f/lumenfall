// Sauvegarde : localStorage (WebView Android persistant). Passage à SQLite (Capacitor) prévu à l'étape 9.
const KEY = 'lumenfall.save.v1';

export const SaveSystem = {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  },
  write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
  },
  clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};
