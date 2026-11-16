// Interface : masques de vie, barre d'énergie, messages, barre de boss.
export class HUD {
  constructor() {
    this.hpEl = document.getElementById('hp');
    this.fill = document.getElementById('energyFill');
    this.msg = document.getElementById('msg');
    this.titleEl = document.getElementById('title');
    this.fadeEl = document.getElementById('fade');
    this.titleT = 0;
    this.lastHp = -1; this.lastMax = -1; this.msgT = 0;
    this.shardEl = document.getElementById('shards'); this.questEl = document.getElementById('quest'); this.lastShards = -1; this.lastQuest = '';
    this.bossBar = document.createElement('div');
    this.bossBar.style.cssText = 'position:absolute;left:25%;right:25%;bottom:calc(14px + env(safe-area-inset-bottom));height:10px;background:#1d1a33;border:2px solid #5b5580;border-radius:6px;display:none;overflow:hidden;pointer-events:none';
    this.bossFill = document.createElement('div');
    this.bossFill.style.cssText = 'height:100%;width:100%;background:#ff5577';
    this.bossBar.appendChild(this.bossFill);
    document.getElementById('hud').appendChild(this.bossBar);
  }

  shardPulse() { this.shardEl.classList.add('pulse'); clearTimeout(this._sp); this._sp = setTimeout(() => this.shardEl.classList.remove('pulse'), 120); }

  update(p, boss, dt, quests) {
    if (p.hp !== this.lastHp || p.maxHp !== this.lastMax) {
      this.lastHp = p.hp; this.lastMax = p.maxHp;
      this.hpEl.innerHTML = Array.from({ length: p.maxHp }, (_, i) => `<div class="mask${i < p.hp ? '' : ' empty'}"></div>`).join('');
    }
    if (p.shards !== this.lastShards) { this.lastShards = p.shards; this.shardEl.textContent = `✦ ${p.shards}`; }
    if (quests) {
      const q = quests.current()[0], t = q ? `${q.title}  ${q.n}/${q.goal}` : '';
      if (t !== this.lastQuest) { this.lastQuest = t; this.questEl.textContent = t; this.questEl.style.display = t ? 'block' : 'none'; }
    }
    this.fill.style.width = `${(p.energy / p.maxEnergy) * 100}%`;
    if (this.titleT > 0) { this.titleT -= dt; this.titleEl.style.opacity = Math.min(1, this.titleT); }
    if (this.msgT > 0) { this.msgT -= dt; this.msg.style.opacity = Math.min(1, this.msgT * 2); }
    const show = boss && boss.active && !boss.dead;
    this.bossBar.style.display = show ? 'block' : 'none';
    if (show) this.bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
  }

  // Carte de titre : petite ligne (ex. « Chapitre 2 ») + grand titre
  title(sub, main, t = 3.5) { this.titleEl.innerHTML = `<small>${sub}</small>${main}`; this.titleT = t; this.titleEl.style.opacity = 1; }
  fade(on) { this.fadeEl.style.opacity = on ? 1 : 0; }

  say(text, t = 2) { this.msg.textContent = text; this.msgT = t; this.msg.style.opacity = 1; }
}
