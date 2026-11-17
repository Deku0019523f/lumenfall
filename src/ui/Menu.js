import { SKILLS, BRANCHES, ROOT, canBuy, buy, skillById } from '../systems/Skills.js';
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
    this.el.addEventListener('input', (e) => {
      const k = e.target.dataset?.vol; if (!k) return;
      game.audio?.setVolume(k, e.target.value / 100); game.audio?.sfx('ui');
      const o = this.el.querySelector(`[data-out="${k}"]`); if (o) o.textContent = e.target.value + ' %';
    });
    // sélection au clavier / à la souris dans les menus textuels
    this.el.addEventListener('mouseover', (e) => { const b = e.target.closest('.mi'); if (b && !b.disabled) this.#select(b); });
    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      const items = [...this.el.querySelectorAll('.mi:not(:disabled)')]; if (!items.length) return;
      let i = items.findIndex((b) => b.classList.contains('sel')); if (i < 0) i = 0;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.#select(items[(i + 1) % items.length]); e.preventDefault(); }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.#select(items[(i + items.length - 1) % items.length]); e.preventDefault(); }
      else if (e.code === 'Enter') { items[i].click(); e.preventDefault(); }
    });
  }

  #select(b) {
    this.el.querySelectorAll('.mi.sel').forEach((x) => x.classList.remove('sel'));
    b.classList.add('sel'); this.game.audio?.sfx('ui');
  }

  get open() { return this.screen !== null; }

  show(screen) {
    this.screen = screen; this.el.style.display = 'flex'; this.el.className = ['start', 'help', 'chapters', 'options', 'credits'].includes(screen) ? 'start' : screen === 'skills' || screen === 'quests' ? 'tree' : 'pause';
    this.el.innerHTML = this[`#${screen}`]();
    this.el.scrollTop = 0;
    const first = this.el.querySelector('.mi:not(:disabled)'); if (first) first.classList.add('sel');
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
      case 'options': this.origin = this.screen; this.show('options'); break;
      case 'credits': this.show('credits'); break;
      case 'node': this.sel = arg; this.show('skills'); break;
      case 'start': this.show('start'); break;
      case 'pause': this.show('pausemenu'); break;
      case 'tab': this.show(arg); break;
      case 'resume': h.resume(); break;
      case 'skills': this.show('skills'); break;
      case 'quests': this.show('quests'); break;
      case 'main': h.mainMenu(); break;
      case 'erase': if (confirm('Effacer la sauvegarde et recommencer ?')) h.erase(); break;
      case 'buy': {
        const g = this.game, ok = buy(g.player, arg);
        if (ok) g.audio?.sfx('skill');
        if (ok) { g.save(); g.hud.say(`${skillById(arg).name} débloqué !`, 2); g.fx.ring(g.player.x, g.player.y + 1, 0xffe08a, 4, 0.5); }
        this.show('skills'); break;
      }
    }
  }

  '#start'() {
    const h = this.h, has = h.hasSave();
    const ch = has ? CHAPTERS[Math.min(h.savedChapter(), CHAPTERS.length - 1)] : null;
    const item = (act, label, extra = '', dis = false) => `<button data-act="${act}" class="mi" ${dis ? 'disabled' : ''}><i>❦</i><span>${label}${extra}</span></button>`;
    return `<div class="beam"></div><div class="motes"></div>
      <div class="title"><div class="orn">⁂ ✦ ⁂</div><h1>Lumenfall</h1><div class="sub">La flamme du Veilleur</div></div>
      <nav class="list">
        ${has ? item('continue', 'Continuer', `<small>${esc(ch.subtitle)} — ${esc(ch.title)}</small>`) : ''}
        ${item('new', 'Nouvelle partie')}
        ${item('chapters', 'Chapitres', '', !has)}
        ${item('options', 'Options')}
        ${item('help', 'Comment jouer')}
        ${item('credits', 'Crédits')}
      </nav>
      <div class="ver">v0.4.0</div>`;
  }

  '#chapters'() {
    const un = this.h.unlocked();
    return `<div class="beam"></div><div class="panel"><h2>Chapitres</h2><nav class="list">${CHAPTERS.map((c, i) =>
      `<button data-act="chapter" data-arg="${i}" ${i <= un ? '' : 'disabled'} class="mi"><i>❦</i><span>${esc(c.title)}<small>${esc(c.subtitle)} · ${i <= un ? 'Jouer' : 'Verrouillé'}</small></span></button>`).join('')}
      <button data-act="start" class="mi back"><i>←</i><span>Retour</span></button></nav></div>`;
  }

  '#help'() {
    return `<div class="beam"></div><div class="panel"><h2>Comment jouer</h2>
      <div class="help"><p><b>Joystick</b> : bouger. Haut + ATTAQUE = coup vers le haut, Bas + ATTAQUE en l'air = coup plongeant (rebond).</p>
      <p><b>ATTAQUE</b> : enchaîne un combo ; maintiens puis relâche pour une attaque chargée. <b>DASH</b> : esquive invincible. <b>SPÉC.</b> : projectile (3 énergie, gagnée en frappant).</p>
      <p>Les ennemis laissent des <b>éclats de lumière ✦</b> : dépense-les dans <b>II → Compétences</b>. Parle aux PNJ lumineux pour recevoir des quêtes.</p>
      <p><b>Portails</b> : approche-toi pour les éveiller, puis appuie sur <b>HAUT</b> dedans pour te téléporter vers leur jumeau déjà découvert. Après un boss, un portail t'emmène au chapitre suivant.</p>
      <p><b>Saut mural</b> (une fois l'orbe trouvée) : pousse vers le mur, puis saute en alternant les murs. Les caves cachent des coffres ; les boss changent d'attaque à chaque phase.</p>
      <p class="dim2">Clavier : flèches/ZQSD · Espace saut · J attaque · L dash · U spécial · Échap pause</p></div>
      <nav class="list"><button data-act="start" class="mi back"><i>←</i><span>Retour</span></button></nav></div>`;
  }

  '#pausemenu'() {
    const item = (act, label, extra = '', cls = '') => `<button data-act="${act}" class="mi ${cls}"><i>❦</i><span>${label}${extra}</span></button>`;
    return `<div class="panel"><h2>Pause</h2><nav class="list">
      ${item('resume', 'Reprendre')}
      ${item('skills', 'Compétences', `<small>✦ ${this.game.player.shards} éclats</small>`)}
      ${item('quests', 'Quêtes')}
      ${item('options', 'Options')}
      ${item('main', 'Menu principal')}
      ${item('erase', 'Effacer la sauvegarde', '', 'danger')}</nav></div>`;
  }

  '#options'() {
    const v = this.game.audio?.vol || { music: 0.6, sfx: 0.8 };
    const slider = (k, label) => `<label class="opt"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(v[k] * 100)}" data-vol="${k}"><em data-out="${k}">${Math.round(v[k] * 100)} %</em></label>`;
    const back = this.origin === 'pausemenu' ? 'pause' : 'start';
    return `<div class="beam"></div><div class="panel"><h2>Options</h2>${slider('music', 'Musique')}${slider('sfx', 'Effets sonores')}
      <nav class="list"><button data-act="${back}" class="mi back"><i>←</i><span>Retour</span></button></nav></div>`;
  }

  '#credits'() {
    return `<div class="beam"></div><div class="panel"><h2>Crédits</h2><div class="help">
      <p><b>Lumenfall</b> — jeu et code : Alec (développeur indépendant).</p>
      <p>Héros « Hooded Seeker » : Primitive Pixels.</p>
      <p>Ennemis, tuiles et décors : packs graphiques utilisés sous licence d'usage (voir RAPPORT.md).</p>
      <p>Musique et effets sonores : générés par le jeu (Web Audio).</p></div>
      <nav class="list"><button data-act="start" class="mi back"><i>←</i><span>Retour</span></button></nav></div>`;
  }

  #tabs(cur) {
    const t = (id, l) => `<button data-act="tab" data-arg="${id}" class="tab ${cur === id ? 'on' : ''}">${l}</button>`;
    return `<div class="tabs">${t('skills', 'Compétences')}${t('quests', 'Quêtes')}</div>
      <div class="compass" title="Éclats de lumière"><b>${this.game.player.shards}</b><small>✦</small></div>`;
  }

  '#skills'() {
    const p = this.game.player;
    const owned = (id) => id === 'root' || p.skills?.includes(id);
    const reveal = (n) => n.id === 'root' || owned(n.id) || !n.req || owned(n.req);   // « ? » tant que le parent n'est pas acquis
    if (!this.sel || !skillById(this.sel)) this.sel = 'root';
    const nodes = [ROOT, ...SKILLS];
    const color = (n) => (n.branch ? BRANCHES[n.branch].color : '#f3ead0');
    const lines = SKILLS.map((n) => {
      const par = skillById(n.req || 'root');
      return `<line x1="${par.pos.x}" y1="${par.pos.y}" x2="${n.pos.x}" y2="${n.pos.y}" class="ln ${owned(n.id) ? 'own' : reveal(n) ? 'vis' : 'hid'}"/>`;
    }).join('');
    const node = (n) => {
      const st = n.id === 'root' ? 'owned' : canBuy(p, n.id), open = reveal(n), r = n.id === 'root' ? 34 : 26;
      const sel = this.sel === n.id ? 'sel' : '';
      return `<g data-act="node" data-arg="${n.id}" class="nd ${st} ${open ? '' : 'hidden'} ${sel}" style="--c:${color(n)}" transform="translate(${n.pos.x} ${n.pos.y})">
        <circle r="${r + 11}" class="ring"/><circle r="${r + 5}" class="ring2"/><circle r="${r}" class="disc"/>
        <text class="ico" y="${n.id === 'root' ? 9 : 7}">${open ? n.icon : '?'}</text>
        ${open ? `<text class="lbl" y="${r + 28}">${esc(n.name)}</text>` : ''}</g>`;
    };
    const sn = skillById(this.sel), st = this.sel === 'root' ? 'owned' : canBuy(p, this.sel), open = reveal(sn);
    const info = !open ? '<b>???</b><span>Débloque la compétence précédente pour la révéler.</span>'
      : `<b>${esc(sn.name)}</b><span>${esc(sn.desc)}</span>` + (sn.id === 'root' ? '' : st === 'owned' ? '<em class="g">✔ Acquis</em>' : st === 'locked' ? `<em>🔒 Requiert ${esc(skillById(sn.req).name)}</em>` : `<em>✦ ${sn.cost}${st === 'poor' ? ' — il te manque ' + (sn.cost - p.shards) + ' éclats' : ''}</em>`);
    const canDo = open && st === 'ok';
    return `${this.#tabs('skills')}
      <svg class="graph" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">${lines}${nodes.map(node).join('')}</svg>
      <div class="info">${info}</div>
      <div class="hints"><button data-act="pause" class="hint">⟵ Retour</button><button data-act="buy" data-arg="${this.sel}" class="hint ok" ${canDo ? '' : 'disabled'}>Débloquer</button></div>`;
  }

  '#quests'() {
    const list = this.game.quests.list();
    const chapters = [...new Set(list.map((q) => q.chapter))];
    const body = list.length ? chapters.map((c) => `<div class="qch">${esc(CHAPTERS[c].subtitle)} — ${esc(CHAPTERS[c].title)}</div>` +
      list.filter((q) => q.chapter === c).map((q) => `<div class="q ${q.done ? 'done' : ''}"><span>${q.done ? '✔' : '◇'} ${esc(q.title)}</span><em>${q.done ? 'Terminée' : `${q.n}/${q.goal}  ·  +${q.reward} ✦`}</em></div>`).join('')).join('')
      : '<p class="dim2">Aucune quête. Parle aux PNJ lumineux pour en recevoir.</p>';
    return `${this.#tabs('quests')}<div class="qlist">${body}</div><div class="hints"><button data-act="pause" class="hint">⟵ Retour</button></div>`;
  }
}
