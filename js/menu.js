'use strict';
// ============================================================
//  Menus: menu de campo, loja, título, fim de jogo, créditos
// ============================================================

const SLOT_NAMES = { weapon: 'Arma', armor: 'Armadura', acc: 'Acessório' };
const STAT_NAMES = { hp: 'PV', mp: 'PM', atk: 'Ataque', def: 'Defesa', mag: 'Magia', spd: 'Velocidade' };

function drawHeroCard(h, x, y, w, sel) {
  if (sel) { ctx.fillStyle = 'rgba(255,198,92,0.13)'; ctx.fillRect(x, y, w, 92); }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 8, y + 8, 76, 76);
  ctx.drawImage(Sprites.char(h.id, 'down', 0), x + 14, y + 12, 64, 64);
  if (!h.alive) { ctx.fillStyle = 'rgba(120,0,0,0.4)'; ctx.fillRect(x + 8, y + 8, 76, 76); }
  text(h.name, x + 100, y + 6, { size: 30, color: sel ? UI.hi : UI.text });
  text(`${h.cd.cls}`, x + 100, y + 36, { size: 22, color: UI.dim });
  text(`Nível ${h.lv}`, x + 100, y + 60, { size: 24 });
  const bx = x + 280;
  text('PV', bx, y + 10, { size: 22, color: UI.dim });
  drawBar(bx + 34, y + 16, 170, 10, h.hp / h.maxHp, h.alive ? UI.hp : UI.bad);
  text(`${h.hp}/${h.maxHp}`, bx + 320, y + 6, { size: 26, align: 'right' });
  text('PM', bx, y + 38, { size: 22, color: UI.dim });
  drawBar(bx + 34, y + 44, 170, 10, h.mp / Math.max(1, h.maxMp), UI.mp);
  text(`${h.mp}/${h.maxMp}`, bx + 320, y + 34, { size: 26, align: 'right', color: UI.mp });
  text('EXP', bx, y + 64, { size: 20, color: UI.dim });
  drawBar(bx + 34, y + 70, 170, 6, h.xp / h.xpNext, '#d8b04a');
  text(`faltam ${h.xpNext - h.xp}`, bx + 320, y + 62, { size: 20, align: 'right', color: UI.dim });
}

class MenuScene {
  constructor() {
    this.modes = ['root']; this.rootSel = 0; this.heroSel = 0; this.msg = '';
    this.items = ['Itens', 'Habilidades', 'Equipar', 'Status', 'Missões', 'Opções', 'Salvar', 'Título'];
  }
  get mode() { return this.modes[this.modes.length - 1]; }
  push(m) { this.modes.push(m); }
  pop() { this.modes.pop(); if (!this.modes.length) { G.remove(this); } }
  update() {
    const m = this.mode;
    if (this.toastT > 0) this.toastT--;
    if (m === 'root') {
      const n = this.items.length;
      if (Input.rep('up')) { this.rootSel = (this.rootSel + n - 1) % n; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { this.rootSel = (this.rootSel + 1) % n; Audio2.sfx('cursor'); }
      if (Input.cancel()) { Audio2.sfx('cancel'); G.remove(this); return; }
      if (Input.ok()) {
        Audio2.sfx('ok');
        switch (this.rootSel) {
          case 0: this.openItems(); break;
          case 1: this.pickHero(h => this.openSkills(h)); break;
          case 2: this.pickHero(h => this.openEquip(h)); break;
          case 3: this.pickHero(h => { this.statusHero = h; this.push('status'); }); break;
          case 4: this.push('quests'); break;
          case 5: this.optSel = 0; this.push('options'); break;
          case 6: { const ok = State.save(); Audio2.sfx(ok ? 'save' : 'buzz'); this.flash(ok ? 'Progresso salvo!' : 'Não foi possível salvar neste navegador.'); break; }
          case 7: this.confirmSel = 1; this.push('confirmTitle'); break;
        }
      }
    } else if (m === 'pickHero') {
      const n = State.party.length;
      if (Input.rep('up')) { this.heroSel = (this.heroSel + n - 1) % n; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { this.heroSel = (this.heroSel + 1) % n; Audio2.sfx('cursor'); }
      if (Input.cancel()) { Audio2.sfx('cancel'); this.pop(); }
      else if (Input.ok()) { Audio2.sfx('ok'); const cb = this.pickCb; this.pop(); cb(State.party[this.heroSel]); }
    } else if (m === 'items') {
      if (Input.rep('left') || Input.rep('right')) { this.itemTab = 1 - this.itemTab; Audio2.sfx('cursor'); this.refreshItems(); }
      const r = this.itemList.handle();
      if (r === 'cancel') this.pop();
      else if (r === 'ok') {
        const id = this.itemList.current();
        const it = ITEMS[id];
        if (this.itemTab === 1 || it.battle) { this.flash(it.key ? it.desc : 'Só pode ser usado em batalha.'); }
        else if (it.tgt === 'none') this.useFieldItem(id);
        else if (it.tgt === 'allies') { State.party.forEach(h => applyItemEffect(it, h)); State.removeItem(id); Audio2.sfx('heal'); this.flash(`${it.name} usado no grupo.`); this.refreshItems(); }
        else this.pickHero(h => {
          if (applyItemEffect(it, h)) { State.removeItem(id); Audio2.sfx('heal'); this.flash(`${it.name} usado em ${h.name}.`); }
          else { Audio2.sfx('buzz'); this.flash('Não teria efeito.'); }
          this.refreshItems();
        }, true);
      }
    } else if (m === 'skills') {
      const r = this.skillList.handle();
      if (r === 'cancel') this.pop();
      else if (r === 'ok') {
        const s = this.skillList.current(), sk = SKILLS[s], h = this.skillHero;
        if (h.mp < sk.mp) { Audio2.sfx('buzz'); this.flash('PM insuficiente.'); return; }
        if (sk.tgt === 'allies') {
          h.mp -= sk.mp; Audio2.sfx('heal');
          for (const t of State.party) if (t.alive) { if (sk.type === 'heal') t.hp = Math.min(t.maxHp, t.hp + Combat.heal(h, sk)); }
          this.flash(`${h.name} usou ${sk.name}.`);
        } else this.pickHero(t => {
          if (h.mp < sk.mp) return;
          let ok = false;
          if (sk.type === 'heal' && t.alive && t.hp < t.maxHp) { t.hp = Math.min(t.maxHp, t.hp + Combat.heal(h, sk)); ok = true; }
          if (sk.type === 'revive' && !t.alive) { t.hp = Math.floor(t.maxHp * sk.pct); ok = true; }
          if (sk.type === 'cure' && t.alive) { t.status = {}; ok = true; }
          if (ok) { h.mp -= sk.mp; Audio2.sfx('heal'); this.flash(`${h.name} usou ${sk.name} em ${t.name}.`); }
          else { Audio2.sfx('buzz'); this.flash('Não teria efeito.'); }
        }, true);
      }
    } else if (m === 'equipSlot') {
      if (Input.rep('up')) { this.slotSel = (this.slotSel + 2) % 3; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { this.slotSel = (this.slotSel + 1) % 3; Audio2.sfx('cursor'); }
      if (Input.rep('left') || Input.rep('right')) {
        const n = State.party.length; const i = State.party.indexOf(this.eqHero);
        this.eqHero = State.party[(i + (Input.rep('left') ? n - 1 : 1)) % n]; Audio2.sfx('cursor');
      }
      if (Input.cancel()) { Audio2.sfx('cancel'); this.pop(); }
      else if (Input.ok()) { Audio2.sfx('ok'); this.openEquipList(); }
    } else if (m === 'equipList') {
      const r = this.eqList.handle();
      if (r === 'cancel') this.pop();
      else if (r === 'ok') {
        const id = this.eqList.current(), slot = ['weapon', 'armor', 'acc'][this.slotSel], h = this.eqHero;
        const old = h.equip[slot];
        const hpFrac = h.hp / h.maxHp;
        if (old) State.addItem(old, 1);
        if (id === '__none') h.equip[slot] = null;
        else { State.removeItem(id, 1); h.equip[slot] = id; }
        h.hp = Math.max(h.alive ? 1 : 0, Math.min(h.maxHp, Math.round(h.maxHp * hpFrac))); h.mp = Math.min(h.mp, h.maxMp);
        Audio2.sfx('item');
        this.pop();
      }
    } else if (m === 'status' || m === 'quests') {
      if (m === 'status' && (Input.rep('left') || Input.rep('right'))) { const n = State.party.length, i = State.party.indexOf(this.statusHero); this.statusHero = State.party[(i + (Input.rep('left') ? n - 1 : 1)) % n]; Audio2.sfx('cursor'); }
      if (Input.cancel() || Input.ok()) { Audio2.sfx('cancel'); this.pop(); }
    } else if (m === 'options') {
      if (Input.rep('up')) { this.optSel = (this.optSel + 3) % 4; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { this.optSel = (this.optSel + 1) % 4; Audio2.sfx('cursor'); }
      const d = Input.rep('left') ? -1 : Input.rep('right') || Input.ok() ? 1 : 0;
      if (d) {
        Audio2.sfx('cursor');
        if (this.optSel === 0) State.opts.textSpeed = ((State.opts.textSpeed - 1 + d + 3) % 3) + 1;
        if (this.optSel === 1) State.opts.run = !State.opts.run;
        if (this.optSel === 2) State.opts.battleSpeed = (State.opts.battleSpeed || 1) > 1 ? 1 : 1.7;
        if (this.optSel === 3) Audio2.toggleMute();
      }
      if (Input.cancel()) { Audio2.sfx('cancel'); this.pop(); }
    } else if (m === 'confirmTitle') {
      if (Input.rep('up') || Input.rep('down')) { this.confirmSel = 1 - this.confirmSel; Audio2.sfx('cursor'); }
      if (Input.cancel()) { Audio2.sfx('cancel'); this.pop(); }
      else if (Input.ok()) { if (this.confirmSel === 0) { G.remove(this); toTitle(); } else this.pop(); }
    }
  }
  flash(t) { this.msg = t; this.toastT = 150; }
  pickHero(cb, keep) { this.pickCb = cb; this.pickKeep = keep; this.push('pickHero'); }
  openItems() { this.itemTab = 0; this.itemList = new ListView({ items: [], x: 300, y: 92, w: 620, rowH: 40, visible: 8, empty: 'Nada aqui.', drawRow: (id, x, y, sel) => { drawIcon(id, x, y + 4, 2); text(ITEMS[id].name, x + 42, y + 6, { size: 28, color: sel ? UI.hi : UI.text }); if (!ITEMS[id].key || State.count(id) > 1) text('x' + State.count(id), x + 570, y + 6, { size: 26, align: 'right' }); } }); this.refreshItems(); this.push('items'); }
  refreshItems() {
    const all = Object.keys(State.inv).filter(id => ITEMS[id]);
    this.itemList.setItems(this.itemTab === 0 ? all.filter(id => !ITEMS[id].key) : all.filter(id => ITEMS[id].key));
  }
  useFieldItem(id) {
    const it = ITEMS[id];
    if (it.repel) { State.repel = it.repel; State.removeItem(id); Audio2.sfx('magic'); this.flash('Um aroma forte afasta os monstros por um tempo.'); }
    else if (it.fullRest) { State.healAll(); State.removeItem(id); Audio2.sfx('heal'); this.flash('O grupo descansou e recuperou todas as forças.'); }
    this.refreshItems();
  }
  openSkills(h) {
    this.skillHero = h;
    const list = h.skills().filter(s => ['heal', 'revive', 'cure'].includes(SKILLS[s].type));
    if (!list.length) { Audio2.sfx('buzz'); this.flash(`${h.name} não tem habilidades para usar fora de batalha.`); return; }
    this.skillList = new ListView({ items: list, x: 300, y: 92, w: 620, rowH: 40, visible: 8, enabled: s => h.mp >= SKILLS[s].mp, drawRow: (s, x, y, sel, en) => { text(SKILLS[s].name, x, y + 6, { size: 28, color: en ? (sel ? UI.hi : UI.text) : UI.dim }); text(SKILLS[s].mp + ' PM', x + 570, y + 6, { size: 26, align: 'right', color: UI.mp }); } });
    this.push('skills');
  }
  openEquip(h) { this.eqHero = h; this.slotSel = 0; this.push('equipSlot'); }
  openEquipList() {
    const slot = ['weapon', 'armor', 'acc'][this.slotSel], h = this.eqHero;
    const list = Object.keys(State.inv).filter(id => EQUIPS[id] && EQUIPS[id].slot === slot && EQUIPS[id].who.includes(h.id));
    if (h.equip[slot]) list.push('__none');
    this.eqList = new ListView({ items: list, x: 300, y: 300, w: 620, rowH: 38, visible: 4, empty: 'Nada para equipar.', drawRow: (id, x, y, sel) => {
      if (id === '__none') { text('(remover)', x, y + 6, { size: 26, color: sel ? UI.hi : UI.dim }); return; }
      drawIcon(id, x, y + 4, 2); text(EQUIPS[id].name, x + 42, y + 6, { size: 26, color: sel ? UI.hi : UI.text }); text('x' + State.count(id), x + 570, y + 6, { size: 24, align: 'right' });
    } });
    this.push('equipList');
  }
  // diferença de atributos ao trocar equipamento
  previewStats(h, slot, id) {
    const save = h.equip[slot];
    const before = {}; const after = {};
    for (const k of ['atk', 'def', 'mag', 'spd']) before[k] = Math.round(h.raw(k));
    before.hp = h.maxHp; before.mp = h.maxMp;
    h.equip[slot] = id === '__none' ? null : id;
    for (const k of ['atk', 'def', 'mag', 'spd']) after[k] = Math.round(h.raw(k));
    after.hp = h.maxHp; after.mp = h.maxMp;
    h.equip[slot] = save;
    return { before, after };
  }

  draw() {
    const m = this.mode;
    // painel do grupo
    drawWin(276, 20, 664, 420);
    State.party.forEach((h, i) => drawHeroCard(h, 290, 32 + i * 100, 636, m === 'pickHero' && i === this.heroSel));
    // menu raiz
    drawWin(20, 20, 240, 360);
    this.items.forEach((o, i) => {
      text(o, 58, 34 + i * 41, { size: 30, color: i === this.rootSel ? UI.hi : UI.text });
      if (i === this.rootSel && m === 'root') drawCursor(30, 40 + i * 41);
    });
    // rodapé
    drawWin(20, 452, 920, 108);
    text(`${State.gold} moedas`, 40, 464, { size: 28, color: '#ffd04a' });
    text(`Tempo ${U.fmtTime(State.time)}`, 40, 498, { size: 24, color: UI.dim });
    text(World.map ? World.map.def.name || '' : '', 40, 526, { size: 22, color: UI.dim });
    text('Objetivo:', 270, 464, { size: 24, color: UI.hi });
    const lines = wrapText(currentObjective(), 640, 26);
    lines.slice(0, 3).forEach((l, i) => text(l, 270, 490 + i * 24, { size: 26 }));
    // sub-telas
    if (m === 'items' || (m === 'pickHero' && this.modes.includes('items'))) {
      if (m === 'items') {
        drawWin(276, 20, 664, 420);
        ['Consumíveis', 'Importantes'].forEach((t, i) => text(t, 310 + i * 200, 36, { size: 28, color: i === this.itemTab ? UI.hi : UI.dim }));
        text('◄ ►', 880, 38, { size: 24, align: 'right', color: UI.dim });
        this.itemList.draw();
        const cur = this.itemList.current();
        drawWin(20, 452, 920, 108);
        if (cur) richText(ITEMS[cur].desc, 40, 470, { size: 28 });
      }
    }
    if (m === 'skills') {
      drawWin(276, 20, 664, 420);
      text(`Habilidades de ${this.skillHero.name}  (PM ${this.skillHero.mp}/${this.skillHero.maxMp})`, 310, 38, { size: 28, color: UI.hi });
      this.skillList.draw();
      const cur = this.skillList.current();
      drawWin(20, 452, 920, 108);
      if (cur) text(SKILLS[cur].desc, 40, 470, { size: 28 });
    }
    if (m === 'equipSlot' || m === 'equipList') this.drawEquip();
    if (m === 'status') this.drawStatus();
    if (m === 'quests') this.drawQuests();
    if (m === 'options') {
      drawWin(276, 20, 664, 264);
      text('Opções', 300, 34, { size: 30, color: UI.hi });
      const vals = [['Velocidade do texto', ['Lenta', 'Normal', 'Rápida'][State.opts.textSpeed - 1]], ['Correr sempre', State.opts.run ? 'Sim' : 'Não'], ['Velocidade da batalha', (State.opts.battleSpeed || 1) > 1 ? 'Rápida' : 'Normal'], ['Som (tecla M)', Audio2.muted ? 'Desligado' : 'Ligado']];
      vals.forEach(([k, v], i) => { const y = 84 + i * 44; text(k, 330, y, { size: 28, color: i === this.optSel ? UI.hi : UI.text }); text('◄ ' + v + ' ►', 900, y, { size: 28, align: 'right' }); if (i === this.optSel) drawCursor(302, y + 6); });
      text('Dica: segure Shift para alternar entre andar e correr.', 300, 250, { size: 22, color: UI.dim });
    }
    if (m === 'confirmTitle') {
      drawWin(300, 180, 460, 170);
      text('Voltar à tela de título?', 330, 196, { size: 30 });
      text('O progresso não salvo será perdido.', 330, 230, { size: 24, color: UI.dim });
      ['Sim', 'Não'].forEach((o, i) => { text(o, 380, 268 + i * 36, { size: 30, color: i === this.confirmSel ? UI.hi : UI.text }); if (i === this.confirmSel) drawCursor(352, 274 + i * 36); });
    }
    if (this.toastT > 0 && this.msg) {
      const a = Math.min(1, this.toastT / 20);
      ctx.globalAlpha = a; drawWin(160, 400, 640, 48); text(this.msg, 480, 410, { size: 28, align: 'center', color: UI.hi }); ctx.globalAlpha = 1;
    }
  }
  drawEquip() {
    const h = this.eqHero;
    drawWin(276, 20, 664, 420);
    ctx.drawImage(Sprites.char(h.id, 'down', 0), 296, 34, 64, 64);
    text(`${h.name} — Equipamento`, 376, 40, { size: 30, color: UI.hi });
    text('◄ ► troca personagem', 920, 44, { size: 22, align: 'right', color: UI.dim });
    ['weapon', 'armor', 'acc'].forEach((s, i) => {
      const y = 108 + i * 44, id = h.equip[s];
      text(SLOT_NAMES[s], 330, y, { size: 26, color: UI.dim });
      if (id) drawIcon(id, 470, y - 2, 2);
      text(id ? EQUIPS[id].name : '—', 510, y, { size: 28, color: i === this.slotSel ? UI.hi : UI.text });
      if (i === this.slotSel) drawCursor(302, y + 6);
    });
    const slot = ['weapon', 'armor', 'acc'][this.slotSel];
    let pv = null;
    if (this.mode === 'equipList') {
      this.eqList.draw();
      const cur = this.eqList.current();
      if (cur) pv = this.previewStats(h, slot, cur);
      drawWin(20, 452, 920, 108);
      if (cur && cur !== '__none') { const e = EQUIPS[cur]; text(e.desc || describeEquip(e), 40, 468, { size: 26 }); text('Pode usar: ' + e.who.map(w => CHARS[w].name).join(', '), 40, 504, { size: 22, color: UI.dim }); }
    } else {
      const id = h.equip[slot];
      drawWin(20, 452, 920, 108);
      if (id) text(EQUIPS[id].desc || describeEquip(EQUIPS[id]), 40, 468, { size: 26 });
    }
    // atributos
    const keys = ['hp', 'mp', 'atk', 'def', 'mag', 'spd'];
    keys.forEach((k, i) => {
      const x = 330 + (i % 3) * 200, y = 244 + Math.floor(i / 3) * 34 - (this.mode === 'equipList' ? 0 : 0);
      const cur = k === 'hp' ? h.maxHp : k === 'mp' ? h.maxMp : Math.round(h.raw(k));
      if (this.mode === 'equipList') return;
      text(`${STAT_NAMES[k]} ${cur}`, x, y, { size: 26 });
    });
    if (pv) {
      keys.forEach((k, i) => {
        const x = 330 + (i % 3) * 200, y = 228 + Math.floor(i / 3) * 32;
        const a = pv.before[k], b = pv.after[k];
        const col = b > a ? UI.good : b < a ? UI.bad : UI.text;
        text(`${STAT_NAMES[k]} ${a}→`, x, y, { size: 24, color: UI.dim });
        text(String(b), x + textW(`${STAT_NAMES[k]} ${a}→`, 24) + 4, y, { size: 24, color: col });
      });
    }
  }
  drawStatus() {
    const h = this.statusHero;
    drawWin(20, 20, 920, 540);
    ctx.drawImage(Sprites.char(h.id, 'down', 0), 40, 40, 96, 96);
    text(h.name, 160, 40, { size: 40, color: UI.hi });
    text(`${h.cd.cls} — Nível ${h.lv}`, 160, 84, { size: 28 });
    text(h.cd.desc, 160, 116, { size: 24, color: UI.dim });
    text('◄ ►', 900, 40, { size: 24, align: 'right', color: UI.dim });
    const st = [['PV', `${h.hp}/${h.maxHp}`], ['PM', `${h.mp}/${h.maxMp}`], ['Ataque', Math.round(h.raw('atk'))], ['Defesa', Math.round(h.raw('def'))], ['Magia', Math.round(h.raw('mag'))], ['Velocidade', Math.round(h.raw('spd'))], ['Experiência', `${h.xp}/${h.xpNext}`]];
    st.forEach(([k, v], i) => { text(k, 50, 170 + i * 36, { size: 28, color: UI.dim }); text(String(v), 380, 170 + i * 36, { size: 28, align: 'right' }); });
    text('Equipamento', 440, 160, { size: 28, color: UI.hi });
    ['weapon', 'armor', 'acc'].forEach((s, i) => { const id = h.equip[s]; text(`${SLOT_NAMES[s]}: ${id ? EQUIPS[id].name : '—'}`, 440, 196 + i * 32, { size: 26 }); });
    text('Habilidades', 440, 312, { size: 28, color: UI.hi });
    const sk = h.skills();
    sk.forEach((s, i) => text(`${SKILLS[s].name} (${SKILLS[s].mp})`, 440 + (i % 2) * 240, 348 + Math.floor(i / 2) * 30, { size: 24 }));
    const next = h.cd.skills.find(([l]) => l > h.lv);
    if (next) text(`Próxima habilidade no nível ${next[0]}.`, 440, 520, { size: 22, color: UI.dim });
  }
  drawQuests() {
    drawWin(20, 20, 920, 540);
    text('Diário de missões', 44, 34, { size: 34, color: UI.hi });
    text('Objetivo principal:', 44, 80, { size: 26, color: UI.dim });
    wrapText(currentObjective(), 860, 28).forEach((l, i) => text(l, 44, 108 + i * 28, { size: 28 }));
    let y = 190;
    const list = Object.entries(QUESTS).filter(([id]) => State.flag('q_' + id));
    if (!list.length) text('Nenhuma missão secundária ainda. Converse com as pessoas!', 44, y, { size: 26, color: UI.dim });
    for (const [id, q] of list) {
      const st = State.flag('q_' + id);
      text((st === 'done' ? '✔ ' : '• ') + q.title, 44, y, { size: 28, color: st === 'done' ? UI.good : UI.hi });
      if (st !== 'done') { wrapText(q.desc, 820, 24).forEach((l, i) => text(l, 74, y + 30 + i * 24, { size: 24, color: UI.text })); y += 30 + wrapText(q.desc, 820, 24).length * 24 + 12; }
      else y += 36;
    }
  }
}

function describeEquip(e) {
  const parts = [];
  for (const k of ['atk', 'def', 'mag', 'spd', 'hp', 'mp']) if (e[k]) parts.push(`${STAT_NAMES[k]} ${e[k] > 0 ? '+' : ''}${e[k]}`);
  if (e.hpPct) parts.push(`PV +${Math.round(e.hpPct * 100)}%`);
  if (e.immune) parts.push('Imune: ' + e.immune.map(s => STATUS[s].name).join(', '));
  if (e.resist) parts.push('Resiste: ' + e.resist.map(s => ELEMENTS[s].name).join(', '));
  return parts.join('  ');
}

// ============================================================
//  Loja
// ============================================================
class ShopScene {
  constructor(id) {
    this.shop = SHOPS[id]; this.mode = 'root'; this.sel = 0; this.qty = 1; this.msg = '';
    this.promise = new Promise(r => (this.res = r));
    const ch = State.chapter;
    this.stock = [];
    for (const [t, list] of this.shop.tiers) if (ch >= t) for (const i of list) if (!this.stock.includes(i)) this.stock.push(i);
  }
  price(id) { return (ITEMS[id] || EQUIPS[id]).price; }
  sellPrice(id) { const i = State.itemInfo(id); return i.sell || Math.floor((i.price || 0) / 2); }
  update() {
    if (this.toastT > 0) this.toastT--;
    if (this.mode === 'root') {
      if (Input.rep('up')) { this.sel = (this.sel + 2) % 3; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { this.sel = (this.sel + 1) % 3; Audio2.sfx('cursor'); }
      if (Input.cancel() || (Input.ok() && this.sel === 2)) { Audio2.sfx('cancel'); G.remove(this); this.res(); return; }
      if (Input.ok()) {
        Audio2.sfx('ok');
        if (this.sel === 0) { this.list = new ListView({ items: this.stock, x: 40, y: 110, w: 520, rowH: 40, visible: 8, enabled: id => State.gold >= this.price(id), drawRow: (id, x, y, sel, en) => { drawIcon(id, x, y + 4, 2); text(State.itemInfo(id).name, x + 42, y + 6, { size: 28, color: en ? (sel ? UI.hi : UI.text) : UI.dim }); text(String(this.price(id)), x + 470, y + 6, { size: 26, align: 'right', color: '#ffd04a' }); } }); this.mode = 'buy'; }
        else { this.refreshSell(); this.mode = 'sell'; }
      }
    } else if (this.mode === 'buy' || this.mode === 'sell') {
      const r = this.list.handle();
      if (r === 'cancel') this.mode = 'root';
      else if (r === 'ok') { this.qty = 1; this.mode = this.mode === 'buy' ? 'buyQty' : 'sellQty'; }
    } else if (this.mode === 'buyQty' || this.mode === 'sellQty') {
      const id = this.list.current(), buy = this.mode === 'buyQty';
      const max = buy ? Math.max(1, Math.min(99, Math.floor(State.gold / this.price(id)))) : State.count(id);
      if (Input.rep('up') || Input.rep('right')) { this.qty = Math.min(max, this.qty + (Input.rep('up') ? 1 : 10)); Audio2.sfx('cursor'); }
      if (Input.rep('down') || Input.rep('left')) { this.qty = Math.max(1, this.qty - (Input.rep('down') ? 1 : 10)); Audio2.sfx('cursor'); }
      if (Input.cancel()) { Audio2.sfx('cancel'); this.mode = buy ? 'buy' : 'sell'; }
      else if (Input.ok()) {
        if (buy) {
          const cost = this.price(id) * this.qty;
          if (cost > State.gold) { Audio2.sfx('buzz'); return; }
          State.gold -= cost; State.addItem(id, this.qty); Audio2.sfx('item');
          this.flash(`Comprou ${State.itemInfo(id).name}${this.qty > 1 ? ' x' + this.qty : ''}.`);
          this.mode = 'buy';
        } else {
          State.gold += this.sellPrice(id) * this.qty; State.removeItem(id, this.qty); Audio2.sfx('item');
          this.flash(`Vendeu por ${this.sellPrice(id) * this.qty} moedas.`);
          this.refreshSell(); this.mode = 'sell';
        }
      }
    }
  }
  refreshSell() {
    const items = Object.keys(State.inv).filter(id => { const i = State.itemInfo(id); return i && !i.key && this.sellPrice(id) > 0; });
    if (!this.list || this.mode === 'root') this.list = new ListView({ items, x: 40, y: 110, w: 520, rowH: 40, visible: 8, empty: 'Nada para vender.', drawRow: (id, x, y, sel) => { drawIcon(id, x, y + 4, 2); text(`${State.itemInfo(id).name} x${State.count(id)}`, x + 42, y + 6, { size: 28, color: sel ? UI.hi : UI.text }); text(String(this.sellPrice(id)), x + 470, y + 6, { size: 26, align: 'right', color: '#ffd04a' }); } });
    else this.list.setItems(items);
  }
  flash(t) { this.msg = t; this.toastT = 120; }
  draw() {
    drawWin(20, 20, 920, 64);
    text(this.shop.name, 44, 34, { size: 34, color: UI.hi });
    text(`${State.gold} moedas`, 916, 38, { size: 30, align: 'right', color: '#ffd04a' });
    drawWin(20, 96, 560, 360);
    if (this.mode === 'root') {
      ['Comprar', 'Vender', 'Sair'].forEach((o, i) => { text(o, 76, 120 + i * 44, { size: 32, color: i === this.sel ? UI.hi : UI.text }); if (i === this.sel) drawCursor(46, 128 + i * 44); });
    } else this.list.draw();
    // detalhes
    drawWin(592, 96, 348, 360);
    const id = this.mode !== 'root' && this.list ? this.list.current() : null;
    if (id) {
      const info = State.itemInfo(id);
      text(info.name, 612, 110, { size: 28, color: UI.hi });
      wrapText(info.desc || describeEquip(info), 310, 24).slice(0, 4).forEach((l, i) => text(l, 612, 146 + i * 26, { size: 24 }));
      text(`Você tem: ${State.ownedCount(id)}`, 612, 258, { size: 24, color: UI.dim });
      if (EQUIPS[id]) {
        const e = EQUIPS[id];
        State.party.forEach((h, i) => {
          const y = 290 + i * 38;
          ctx.drawImage(Sprites.char(h.id, 'down', 0), 612, y - 4, 32, 32);
          if (!e.who.includes(h.id)) { text('não pode usar', 654, y, { size: 22, color: UI.dim }); return; }
          const old = h.equip[e.slot];
          const d = k => (e[k] || 0) - (old ? EQUIPS[old][k] || 0 : 0);
          const parts = ['atk', 'def', 'mag', 'spd'].filter(k => e[k] || (old && EQUIPS[old][k])).map(k => ({ k, v: d(k) }));
          let x = 654;
          if (old === id) { text('equipado', x, y, { size: 22, color: UI.good }); return; }
          for (const p of parts) { const s = `${STAT_NAMES[p.k].slice(0, 3)} ${p.v >= 0 ? '+' : ''}${p.v}`; text(s, x, y, { size: 22, color: p.v > 0 ? UI.good : p.v < 0 ? UI.bad : UI.text }); x += textW(s, 22) + 12; }
          if (!parts.length) text(describeEquip(e).slice(0, 26), x, y, { size: 20, color: UI.dim });
        });
      }
    }
    if (this.mode === 'buyQty' || this.mode === 'sellQty') {
      const buy = this.mode === 'buyQty', id2 = this.list.current();
      const total = (buy ? this.price(id2) : this.sellPrice(id2)) * this.qty;
      drawWin(150, 200, 360, 120);
      text(`Quantidade: ${this.qty}`, 180, 216, { size: 30 });
      text(`Total: ${total} moedas`, 180, 254, { size: 28, color: '#ffd04a' });
      text('▲▼ ±1   ◄► ±10', 180, 288, { size: 20, color: UI.dim });
    }
    drawWin(20, 468, 920, 92);
    const tip = this.toastT > 0 ? this.msg : (this.mode === 'root' ? '"Fique à vontade, dê uma olhada!"' : 'Z/Enter: escolher   X/Esc: voltar');
    text(tip, 44, 492, { size: 28, color: this.toastT > 0 ? UI.hi : UI.text });
  }
}

// ============================================================
//  Tela de título
// ============================================================
class TitleScene {
  constructor() {
    this.opaque = true; this.sel = State.hasSave() ? 1 : 0; this.t = 0;
    this.stars = Array.from({ length: 90 }, () => ({ x: U.rand(0, VIEW_W), y: U.rand(0, 330), s: U.rand(0.5, 2), p: U.rand(0, 6) }));
    Audio2.play('title');
  }
  opts() { return ['Novo jogo', 'Continuar', Audio2.muted ? 'Som: desligado' : 'Som: ligado']; }
  update() {
    this.t++;
    const n = 3;
    if (Input.rep('up')) { this.sel = (this.sel + n - 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.sel = (this.sel + 1) % n; Audio2.sfx('cursor'); }
    if (Input.ok()) {
      if (this.sel === 0) { Audio2.sfx('ok'); this.busy = true; newGame(); }
      else if (this.sel === 1) { if (State.hasSave()) { Audio2.sfx('ok'); loadGame(); } else Audio2.sfx('buzz'); }
      else { Audio2.toggleMute(); }
    }
  }
  draw() {
    drawNightScene(this.t, this.stars, true);
    // Tição
    if (PORTRAITS.ticao) {
      const img = PORTRAITS.ticao; const h = 300, w = img.width / img.height * h;
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.95; ctx.drawImage(img, VIEW_W - w - 40, VIEW_H - h - 40 + Math.sin(this.t / 40) * 4, w, h); ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = false;
    }
    // título
    ctx.save();
    ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 24;
    text('O Farol de Cinzas', VIEW_W / 2 - 120, 64, { size: 84, align: 'center', color: '#ffd77a' });
    ctx.restore();
    text('Uma aventura de Lia e Tição', VIEW_W / 2 - 120, 150, { size: 32, align: 'center', color: '#e8dcc8' });
    const o = this.opts();
    drawWin(80, 300, 300, 170);
    o.forEach((s, i) => {
      const dis = i === 1 && !State.hasSave();
      text(s, 128, 318 + i * 46, { size: 32, color: dis ? UI.dim : i === this.sel ? UI.hi : UI.text });
      if (i === this.sel) drawCursor(98, 326 + i * 46);
    });
    text('Setas/WASD: mover   Z/Enter: confirmar   X/Esc: menu/voltar   Shift: correr   M: som', VIEW_W / 2, VIEW_H - 30, { size: 22, align: 'center', color: UI.dim });
    if (typeof document !== 'undefined' && document.hasFocus && !document.hasFocus() && Math.floor(this.t / 40) % 2 === 0) {
      drawWin(80, 486, 300, 40, { alpha: 0.9 }); text('Clique na tela para jogar', 230, 492, { size: 26, align: 'center', color: UI.hi });
    }
  }
}

// cenário noturno com farol (título e créditos)
function drawNightScene(t, stars, lit) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#05061a'); g.addColorStop(0.55, '#1a1a46'); g.addColorStop(1, '#2a2a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const s of stars) { ctx.globalAlpha = 0.5 + Math.sin(t / 30 + s.p) * 0.4; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.globalAlpha = 1;
  // lua
  ctx.fillStyle = '#f4ecd0'; ctx.beginPath(); ctx.arc(780, 90, 34, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1a46'; ctx.beginPath(); ctx.arc(796, 82, 30, 0, 7); ctx.fill();
  // mar
  ctx.fillStyle = '#0c1430'; ctx.fillRect(0, 400, VIEW_W, 176);
  for (let i = 0; i < 26; i++) { const y = 410 + (i % 8) * 20, x = ((i * 137 + t * (0.3 + (i % 3) * 0.2)) % (VIEW_W + 80)) - 40; ctx.fillStyle = 'rgba(120,160,220,0.25)'; ctx.fillRect(x, y, 40, 2); }
  // penhasco
  ctx.fillStyle = '#141024'; ctx.beginPath(); ctx.moveTo(380, VIEW_H); ctx.lineTo(420, 420); ctx.lineTo(520, 380); ctx.lineTo(640, 395); ctx.lineTo(700, VIEW_H); ctx.fill();
  // farol
  const fx = 560, fy = 380;
  ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.moveTo(fx - 30, fy); ctx.lineTo(fx - 20, fy - 190); ctx.lineTo(fx + 20, fy - 190); ctx.lineTo(fx + 30, fy); ctx.fill();
  ctx.fillStyle = '#a8352e'; for (let i = 0; i < 3; i++) { const y = fy - 40 - i * 55; ctx.fillRect(fx - 28 + i * 3, y, 56 - i * 6, 20); }
  ctx.fillStyle = '#2a2430'; ctx.fillRect(fx - 26, fy - 214, 52, 26); ctx.fillRect(fx - 32, fy - 192, 64, 6);
  ctx.beginPath(); ctx.moveTo(fx - 26, fy - 214); ctx.lineTo(fx, fy - 238); ctx.lineTo(fx + 26, fy - 214); ctx.fill();
  if (lit) {
    const pulse = 0.6 + Math.sin(t / 25) * 0.15;
    ctx.fillStyle = `rgba(255,200,110,${pulse})`; ctx.fillRect(fx - 18, fy - 210, 36, 18);
    const a = Math.sin(t / 90);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createLinearGradient(fx, 0, fx + 500 * a, 0);
    gr.addColorStop(0, 'rgba(255,210,130,0.35)'); gr.addColorStop(1, 'rgba(255,210,130,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(fx, fy - 200); ctx.lineTo(fx + 520 * a, fy - 260); ctx.lineTo(fx + 520 * a, fy - 140); ctx.fill();
    ctx.restore();
  } else { ctx.fillStyle = '#3a3448'; ctx.fillRect(fx - 18, fy - 210, 36, 18); }
}

// ============================================================
//  Fim de jogo (derrota)
// ============================================================
class GameOverScene {
  constructor(cb) {
    this.opaque = true; this.cb = cb; this.sel = 0; this.t = 0;
    this.opts = ['Tentar a batalha de novo', State.hasSave() ? 'Carregar jogo salvo' : 'Carregar (sem save)', 'Voltar ao título'];
  }
  update() {
    this.t++;
    if (this.t < 40 || this.chosen) return;
    if (Input.rep('up')) { this.sel = (this.sel + 2) % 3; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.sel = (this.sel + 1) % 3; Audio2.sfx('cursor'); }
    if (Input.ok()) {
      if (this.sel === 1 && !State.hasSave()) { Audio2.sfx('buzz'); return; }
      Audio2.sfx('ok'); this.chosen = true;
      this.cb(['retry', 'load', 'title'][this.sel]);
    }
  }
  draw() {
    ctx.fillStyle = '#08040c'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const a = Math.min(1, this.t / 60);
    ctx.globalAlpha = a;
    text('A chama se apagou...', VIEW_W / 2, 150, { size: 64, align: 'center', color: '#c87a5a' });
    text('Mas uma brasa ainda resiste. Tente outra vez.', VIEW_W / 2, 230, { size: 30, align: 'center', color: UI.dim });
    drawWin(280, 300, 400, 160);
    this.opts.forEach((o, i) => { text(o, 330, 318 + i * 44, { size: 30, color: i === this.sel ? UI.hi : UI.text }); if (i === this.sel) drawCursor(300, 324 + i * 44); });
    ctx.globalAlpha = 1;
  }
}

// ============================================================
//  Créditos finais
// ============================================================
class CreditsScene {
  constructor() {
    this.opaque = true; this.t = 0; this.y = VIEW_H;
    this.stars = Array.from({ length: 90 }, () => ({ x: U.rand(0, VIEW_W), y: U.rand(0, 330), s: U.rand(0.5, 2), p: U.rand(0, 6) }));
    this.lines = [
      ['O Farol de Cinzas', 60, '#ffd77a'], ['', 30], ['Obrigado por jogar!', 36, UI.text], ['', 40],
      ['Lia', 30, UI.hi], ['A nova guardiã do farol', 24, UI.dim], ['', 16],
      ['Tição', 30, UI.hi], ['O filhote que era uma chama', 24, UI.dim], ['', 16],
      ['Nara', 30, UI.hi], ['Erveira da Floresta Sussurrante', 24, UI.dim], ['', 16],
      ['Bento', 30, UI.hi], ['Ferreiro de Vila Pavio', 24, UI.dim], ['', 16],
      ['Aurélio', 30, UI.hi], ['O velho faroleiro, enfim em paz', 24, UI.dim], ['', 40],
      ['Roteiro, código, arte em pixel e música', 26, UI.dim], ['gerados proceduralmente para este jogo', 26, UI.dim], ['', 20],
      ['Arte do Tição', 26, UI.dim], ['imagem enviada pelo jogador', 26, UI.text], ['', 40],
      [`Tempo de jogo: ${U.fmtTime(State.time)}`, 30, UI.text], [`Batalhas vencidas: ${State.battles}`, 30, UI.text], [`Passos dados: ${State.steps}`, 30, UI.text], ['', 60],
      ['Enquanto houver alguém para cuidar da luz,', 28, UI.text], ['nenhuma noite será escura demais.', 28, UI.text], ['', 80], ['FIM', 72, '#ffd77a'],
    ];
    this.total = this.lines.reduce((s, l) => s + l[1] + 14, 0);
    Audio2.play('ending');
  }
  update() {
    this.t++;
    if (this.y > VIEW_H / 2 - this.total + 40) this.y -= Input.held.ok ? 3 : 0.6;
    else if (Input.ok() || Input.cancel()) { this.done = true; State.setFlag('cleared', true); toTitle(); }
  }
  draw() {
    drawNightScene(this.t, this.stars, true);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    let y = this.y;
    for (const [t, s, c] of this.lines) { if (t && y > -80 && y < VIEW_H + 40) text(t, VIEW_W / 2, y, { size: s, align: 'center', color: c }); y += s + 14; }
    if (this.y <= VIEW_H / 2 - this.total + 40) text('Pressione Z para voltar ao título', VIEW_W / 2, VIEW_H - 40, { size: 24, align: 'center', color: UI.dim });
  }
}

// ============================================================
//  Fluxo geral
// ============================================================
async function newGame() {
  await G.fadeTo(1, 30);
  State.newGame();
  const sc = new IntroScene();
  G.replaceAll(sc);
  await G.fadeTo(0, 20);
}
function startWorld() {
  G.replaceAll(new WorldScene());
  World.map = null;
  World.busy = false; World.depth = 0;
  World.load(State.map, State.x, State.y, State.dir);
}
async function loadGame() {
  const d = State.loadSaved();
  if (!d) return;
  await G.fadeTo(1, 20);
  State.deserialize(d);
  startWorld();
  await G.fadeTo(0, 20);
}
async function toTitle() {
  await G.fadeTo(1, 20);
  World.busy = false; World.depth = 0;
  G.replaceAll(new TitleScene());
  await G.fadeTo(0, 20);
}

// texto de abertura
class IntroScene {
  constructor() {
    this.opaque = true; this.i = 0; this.t = 0;
    this.pages = [
      'Por mil anos, a *Chama Eterna* do Grande Farol iluminou as Terras de Cinzaluz.',
      'Sua luz mantinha longe a *Névoa Vazia* — uma bruma que apaga cores, memórias e vidas.',
      'O velho faroleiro *Aurélio* cuidou da chama a vida inteira. Sua aprendiz, *Lia*, cresceu ouvindo histórias sobre ela.',
      'Até que, numa noite sem lua...',
      '...a chama se apagou.',
    ];
    Audio2.play('home');
  }
  update() {
    this.t++;
    if (this.t > 30 && (Input.ok() || Input.cancel())) {
      Audio2.sfx('cursor'); this.i++; this.t = 0;
      if (this.i >= this.pages.length) { this.finish(); }
    }
  }
  async finish() {
    if (this.fin) return; this.fin = true;
    await G.fadeTo(1, 30);
    startWorld();
    await G.fadeTo(0, 30);
    if (World.map.def.onEnter) World.run(World.map.def.onEnter);
  }
  draw() {
    ctx.fillStyle = '#050308'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const p = this.pages[Math.min(this.i, this.pages.length - 1)];
    const a = Math.min(1, this.t / 40);
    ctx.globalAlpha = a;
    const lines = wrapText(p, 760, 36);
    lines.forEach((l, j) => richText(l, VIEW_W / 2 - 380, VIEW_H / 2 - lines.length * 24 + j * 48, { size: 36 }));
    ctx.globalAlpha = 1;
    if (this.t > 30) drawDownArrow(VIEW_W / 2, VIEW_H - 80);
  }
}
