import { SKILLS, BRANCHES, canBuy, buy, skillById } from '../systems/Skills.js';
import { CHAPTERS } from '../levels/chapters.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Menus plein écran : démarrage, chapitres, aide, pause, compétences, quêtes.
// h : { continue(), newGame(), chapter(i), resume(), mainMenu(), erase(), hasSave(), unlocked() }
export class Menu {
  constructor(game, h) {
    this.game = game; this.h = h; this.screen = null;
    this.el = document.getElementById('menu');
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
      this.#act(b.dataset.act, b.dataset.arg);
    });
  }

  get open() { return this.screen !== null; }

  show(screen) {
    this.screen = screen; this.el.style.display = 'flex'; this.el.className = screen === 'start' || screen === 'help' || screen === 'chapters' ? 'dim' : 'pause';
    this.el.innerHTML = this[`#${screen}`]();
  }

  hide() { this.screen = null; this.el.style.display = 'none'; this.el.innerHTML = ''; }

  #act(a, arg) {
    const h = this.h;
    switch (a) {
      case 'continue': h.continue(); break;
      case 'new': if (!h.hasSave() || confirm('Effacer la partie en cours et recommencer ?')) h.newGame(); break;
      case 'chapters': this.show('chapters'); break;
      case 'chapter': h.chapter(parseInt(arg, 10)); break;
      case 'help': this.show('help'); break;
      case 'start': this.show('start'); break;
      case 'pause': this.show('pausemenu'); break;
      case 'resume': h.resume(); break;
      case 'skills': this.show('skills'); break;
      case 'quests': this.show('quests'); break;
      case 'main': h.mainMenu(); break;
      case 'erase': if (confirm('Effacer la sauvegarde et recommencer ?')) h.erase(); break;
      case 'buy': {
        const g = this.game, ok = buy(g.player, arg);
        if (ok) { g.save(); g.hud.say(`${skillById(arg).name} débloqué !`, 2); g.fx.ring(g.player.x, g.player.y + 1, 0xffe08a, 4, 0.5); }
        this.show('skills'); break;
      }
    }
  }

  '#start'() {
    const h = this.h, has = h.hasSave();
    const ch = has ? CHAPTERS[Math.min(h.savedChapter(), CHAPTERS.length - 1)] : null;
    return `<div class="logo">LUMENFALL</div><div class="tag">La flamme du Veilleur</div>
      <div class="col">
        ${has ? `<button data-act="continue" class="primary">CONTINUER<small>${esc(ch.subtitle)} — ${esc(ch.title)}</small></button>` : ''}
        <button data-act="new" class="${has ? '' : 'primary'}">NOUVELLE PARTIE</button>
        <button data-act="chapters" ${has ? '' : 'disabled'}>CHAPITRES</button>
        <button data-act="help">COMMENT JOUER</button>
      </div>`;
  }

  '#chapters'() {
    const un = this.h.unlocked();
    return `<div class="head">CHAPITRES</div><div class="row wrap">${CHAPTERS.map((c, i) =>
      `<button data-act="chapter" data-arg="${i}" ${i <= un ? '' : 'disabled'} class="card"><b>${esc(c.subtitle)}</b>${esc(c.title)}<small>${i <= un ? 'Jouer' : '🔒 Verrouillé'}</small></button>`).join('')}</div>
      <button data-act="start" class="back">← Retour</button>`;
  }

  '#help'() {
    return `<div class="head">COMMENT JOUER</div>
      <div class="help"><p><b>Joystick</b> : bouger. Haut + ATTAQUE = coup vers le haut, Bas + ATTAQUE en l'air = coup plongeant (rebond).</p>
      <p><b>ATTAQUE</b> : enchaîne un combo ; maintiens puis relâche pour une attaque chargée. <b>DASH</b> : esquive invincible. <b>SPÉC.</b> : projectile (3 énergie, gagnée en frappant).</p>
      <p>Les ennemis laissent des <b>éclats de lumière ✦</b> : dépense-les dans <b>II → Compétences</b>. Parle aux PNJ lumineux pour recevoir des quêtes.</p>
      <p class="dim2">Clavier : flèches/ZQSD · Espace saut · J attaque · L dash · U spécial · Échap pause</p></div>
      <button data-act="start" class="back">← Retour</button>`;
  }

  '#pausemenu'() {
    return `<div class="head">PAUSE</div><div class="col">
      <button data-act="resume" class="primary">REPRENDRE</button>
      <button data-act="skills">COMPÉTENCES<small>✦ ${this.game.player.shards}</small></button>
      <button data-act="quests">QUÊTES</button>
      <button data-act="main">MENU PRINCIPAL</button>
      <button data-act="erase" class="danger">EFFACER LA SAUVEGARDE</button></div>`;
  }

  '#skills'() {
    const p = this.game.player;
    const col = (b) => `<div class="branch" style="--c:${BRANCHES[b].color}"><div class="bname">${BRANCHES[b].name}</div>${SKILLS.filter((s) => s.branch === b).map((s) => {
      const st = canBuy(p, s.id), req = s.req ? skillById(s.req).name : '';
      const tag = st === 'owned' ? '✔ Acquis' : st === 'locked' ? `🔒 Requiert ${esc(req)}` : `✦ ${s.cost}`;
      return `<button data-act="buy" data-arg="${s.id}" class="skill ${st}" ${st === 'ok' ? '' : 'disabled'}><b>${esc(s.name)}</b><span>${esc(s.desc)}</span><em>${tag}</em></button>`;
    }).join('')}</div>`;
    return `<div class="head">COMPÉTENCES <span class="gold">✦ ${p.shards}</span></div><div class="row tree">${Object.keys(BRANCHES).map(col).join('')}</div>
      <button data-act="pause" class="back">← Retour</button>`;
  }

  '#quests'() {
    const list = this.game.quests.list();
    const chapters = [...new Set(list.map((q) => q.chapter))];
    const body = list.length ? chapters.map((c) => `<div class="qch">${esc(CHAPTERS[c].subtitle)} — ${esc(CHAPTERS[c].title)}</div>` +
      list.filter((q) => q.chapter === c).map((q) => `<div class="q ${q.done ? 'done' : ''}"><span>${q.done ? '✔' : '◇'} ${esc(q.title)}</span><em>${q.done ? 'Terminée' : `${q.n}/${q.goal}  ·  +${q.reward} ✦`}</em></div>`).join('')).join('')
      : '<p class="dim2">Aucune quête. Parle aux PNJ lumineux pour en recevoir.</p>';
    return `<div class="head">QUÊTES</div><div class="qlist">${body}</div><button data-act="pause" class="back">← Retour</button>`;
  }
}
