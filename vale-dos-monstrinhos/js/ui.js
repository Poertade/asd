'use strict';
// ============================================================
//  Telas e menus
// ============================================================

Object.assign(PORTRAIT_FOR, { 'Dona Flor': 'flor', 'Seu Malho': 'malho', 'Íris': 'iris', 'Davi': 'davi', 'Vovó Nena': 'nena', 'Pituco': 'pituco', 'Vó Lurdes': 'vovo', 'Você': 'player' });

function drawSlot(x, y, s, size, sel, dim) {
  ctx.fillStyle = sel ? 'rgba(255,198,92,0.3)' : dim ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)';
  ctx.fillRect(x, y, size, size);
  if (sel) { ctx.strokeStyle = UI.hi; ctx.lineWidth = 3; ctx.strokeRect(x, y, size, size); }
  if (s) { ctx.drawImage(Icons.get(s.id), x + 4, y + 4, size - 8, size - 8); if (s.n > 1) text(String(s.n), x + size - 4, y + size - 22, { size: 20, align: 'right' }); }
}
function itemInfoText(id) {
  const it = ITEMS[id];
  const parts = [];
  if (it.desc) parts.push(it.desc);
  if (it.kind === 'tool') parts.push(`Nível: ${TIERS[State.tools[id] || 0]}.`);
  if (it.kind === 'seed') { const c = CROPS[it.crop]; parts.push(`Cresce em ${c.days} dias${c.regrow ? `, rebrota a cada ${c.regrow}` : ''}. Estação: ${c.seasons.map(s => SEASONS[s]).join(', ')}.`); }
  if (it.energy) parts.push(`Comer: +${it.energy} energia.`);
  if (it.price && it.kind !== 'tool') parts.push(`Vende por ${it.price}.`);
  return parts.join(' ');
}

// ------------------------------------------------------------
//  Menu principal (abas)
// ------------------------------------------------------------
class MenuScene {
  constructor() { this.tab = 0; this.cur = 0; this.hold = -1; this.tabs = ['Mochila', 'Receitas', 'Monstrinhos', 'Amigos', 'Diário', 'Opções']; this.sub = 0; }
  update() {
    if (Input.rep('prev')) { this.tab = (this.tab + this.tabs.length - 1) % this.tabs.length; this.cur = 0; this.hold = -1; Audio2.sfx('cursor'); }
    if (Input.rep('next')) { this.tab = (this.tab + 1) % this.tabs.length; this.cur = 0; this.hold = -1; Audio2.sfx('cursor'); }
    if (Input.cancel()) { if (this.hold >= 0) { this.hold = -1; Audio2.sfx('cancel'); } else { Audio2.sfx('cancel'); G.remove(this); } return; }
    const t = this.tabs[this.tab];
    if (t === 'Mochila') this.updInv();
    else if (t === 'Receitas') this.updCraft();
    else if (t === 'Opções') this.updOpts();
    else { if (Input.rep('up')) this.cur = Math.max(0, this.cur - 1); if (Input.rep('down')) this.cur++; }
  }
  updInv() {
    const cols = 12, n = State.invSize;
    if (Input.rep('left')) { this.cur = (this.cur + n - 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('right')) { this.cur = (this.cur + 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('up')) { this.cur = (this.cur - cols + n) % n; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = (this.cur + cols) % n; Audio2.sfx('cursor'); }
    if (Input.ok()) {
      if (this.hold < 0) { if (State.inv[this.cur]) { this.hold = this.cur; Audio2.sfx('ok'); } }
      else {
        const a = State.inv[this.hold], b = State.inv[this.cur];
        if (b && a && a.id === b.id && this.hold !== this.cur && ITEMS[a.id].kind !== 'tool') { const k = Math.min(a.n, 99 - b.n); b.n += k; a.n -= k; if (!a.n) State.inv[this.hold] = null; }
        else { State.inv[this.hold] = b; State.inv[this.cur] = a; }
        this.hold = -1; Audio2.sfx('place');
      }
    }
  }
  updCraft() {
    const n = RECIPES.length;
    if (Input.rep('up')) { this.cur = (this.cur + n - 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = (this.cur + 1) % n; Audio2.sfx('cursor'); }
    if (Input.ok()) {
      const r = RECIPES[this.cur];
      if (!canCraft(r)) { Audio2.sfx('buzz'); return; }
      if (!State.canAdd(r.out)) { G.toast('Mochila cheia!', UI.bad); Audio2.sfx('buzz'); return; }
      for (const [id, k] of r.need) { if (typeof id === 'object') State.removeCat(id.cat, k); else State.removeItem(id, k); }
      State.addItem(r.out, r.n); Audio2.sfx('craft'); G.toast(`Você fez ${r.n}x ${ITEMS[r.out].name}!`, UI.good);
    }
  }
  updOpts() {
    const n = 4;
    if (Input.rep('up')) { this.cur = (this.cur + n - 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = (this.cur + 1) % n; Audio2.sfx('cursor'); }
    if (Input.ok() || Input.rep('left') || Input.rep('right')) {
      if (this.cur === 0) { State.opts.textSpeed = (State.opts.textSpeed % 3) + 1; Audio2.sfx('cursor'); }
      if (this.cur === 1) Audio2.toggleMute();
      if (this.cur === 2 && Input.ok()) { G.remove(this); toTitle(); }
      if (this.cur === 3 && Input.ok()) { G.remove(this); }
    }
  }
  draw() {
    drawWin(20, 16, VIEW_W - 40, VIEW_H - 32);
    this.tabs.forEach((t, i) => text(t, 50 + i * 148, 30, { size: 28, color: i === this.tab ? UI.hi : UI.dim }));
    ctx.fillStyle = UI.border; ctx.fillRect(50 + this.tab * 148, 60, textW(this.tabs[this.tab], 28), 3);
    text('Q/E: trocar aba', VIEW_W - 44, 534, { size: 18, align: 'right', color: UI.dim });
    const t = this.tabs[this.tab];
    if (t === 'Mochila') this.drawInv();
    if (t === 'Receitas') this.drawCraft();
    if (t === 'Monstrinhos') this.drawMon();
    if (t === 'Amigos') this.drawFriends();
    if (t === 'Diário') this.drawJournal();
    if (t === 'Opções') this.drawOpts();
  }
  drawInv() {
    const size = 64, gap = 6, x0 = 52, y0 = 86;
    for (let i = 0; i < 36; i++) {
      const x = x0 + (i % 12) * (size + gap), y = y0 + Math.floor(i / 12) * (size + gap) + (i >= 12 ? 10 : 0);
      drawSlot(x, y, i < State.invSize ? State.inv[i] : null, size, i === this.cur, i >= State.invSize);
      if (i === this.hold) { ctx.strokeStyle = '#7ad0ff'; ctx.lineWidth = 3; ctx.strokeRect(x - 3, y - 3, size + 6, size + 6); }
    }
    text('Barra rápida = primeira fileira (1 a 8)', x0, y0 + 3 * (size + gap) + 18, { size: 20, color: UI.dim });
    const s = State.inv[this.cur];
    drawWin(40, 360, VIEW_W - 80, 120);
    if (s) {
      ctx.drawImage(Icons.get(s.id), 60, 380, 64, 64);
      text(ITEMS[s.id].name + (s.n > 1 ? ` x${s.n}` : ''), 140, 376, { size: 30, color: UI.hi });
      wrapText(itemInfoText(s.id), VIEW_W - 220, 24).slice(0, 3).forEach((l, i) => text(l, 140, 410 + i * 24, { size: 24 }));
    } else text('Espaço vazio.', 60, 400, { size: 26, color: UI.dim });
    text(this.hold >= 0 ? 'Escolha onde colocar (Z) — X cancela' : 'Z: pegar e mover item   X: fechar', 50, 500, { size: 22, color: UI.dim });
    text(`Moedas: ${State.gold}   Energia: ${State.energy}/${State.maxEnergy}   Vida: ${State.hp}/${State.maxHp}`, VIEW_W - 50, 500, { size: 22, align: 'right', color: '#ffd04a' });
  }
  drawCraft() {
    RECIPES.forEach((r, i) => {
      const y = 78 + i * 44, ok = canCraft(r), sel = i === this.cur;
      if (sel) { ctx.fillStyle = 'rgba(255,198,92,0.15)'; ctx.fillRect(44, y - 2, VIEW_W - 88, 42); drawCursor(48, y + 10); }
      ctx.drawImage(Icons.get(r.out), 72, y, 36, 36);
      text(`${ITEMS[r.out].name}${r.n > 1 ? ' x' + r.n : ''}`, 116, y + 6, { size: 26, color: ok ? (sel ? UI.hi : UI.text) : UI.dim });
      let x = 420;
      for (const [id, k] of r.need) {
        const have = typeof id === 'object' ? State.countCat(id.cat) : State.count(id);
        const name = typeof id === 'object' ? (id.cat === 'fish' ? 'Qualquer peixe' : 'Qualquer colheita') : ITEMS[id].name;
        const s = `${name} ${have}/${k}`;
        text(s, x, y + 8, { size: 21, color: have >= k ? UI.good : UI.bad });
        x += textW(s, 21) + 22;
      }
    });
    const r = RECIPES[this.cur]; const it = ITEMS[r.out];
    text(itemInfoText(r.out) || it.name, 50, 520, { size: 22, color: UI.dim });
  }
  drawMon() {
    text(`Curral: ${State.monsters.length}/${State.barnCap}   Ração no cocho: ${State.trough}`, 50, 76, { size: 26, color: UI.hi });
    if (!State.monsters.length) text('Nenhum monstrinho ainda. Dê Biscoito Monstro a um monstrinho selvagem, um por dia!', 50, 116, { size: 24, color: UI.dim });
    State.monsters.forEach((m, i) => {
      const y = 110 + i * 46, sp = MONSTRINHOS[m.sp];
      ctx.drawImage(MonArt.get(sp.art, sp.c, 0, 16), 50, y - 4, 44, 44);
      text(`${m.name}`, 104, y + 4, { size: 26 });
      text(sp.name, 250, y + 6, { size: 22, color: UI.dim });
      text(heartsText(State.monHearts(m)), 390, y + 4, { size: 24, color: '#ff8ab8' });
      text((m.petted ? 'carinho ✔' : 'quer carinho') + (m.fedOk === false ? ' · com fome' : ''), 560, y + 6, { size: 22, color: m.petted ? UI.good : UI.dim });
    });
    const y0 = 110 + Math.max(1, State.monsters.length) * 46 + 20;
    text('Monstrinhos selvagens do vale', 50, y0, { size: 24, color: UI.hi });
    Object.entries(MONSTRINHOS).forEach(([k, sp], i) => {
      const w = State.wild[k] || { trust: 0 };
      const x = 50 + (i % 4) * 220, y = y0 + 34 + Math.floor(i / 4) * 40;
      ctx.drawImage(MonArt.get(sp.art, sp.c, 0, 16), x, y - 4, 36, 36);
      text(`${sp.name} ${'●'.repeat(Math.min(3, w.trust))}${'○'.repeat(Math.max(0, 3 - w.trust))}`, x + 40, y + 2, { size: 21 });
    });
  }
  drawFriends() {
    Object.entries(NPCS).forEach(([id, n], i) => {
      const y = 82 + i * 70, h = State.npcHearts(id), d = State.npcData(id);
      ctx.drawImage(CharArt.get('npc_' + id, n.look, 'down', 0), 50, y - 6, 60, 60);
      text(n.name, 120, y + 2, { size: 28 });
      text(heartsText(h), 300, y + 2, { size: 26, color: '#ff8ab8' });
      text(d.talked === State.dayIndex ? 'conversou hoje' : '', 470, y + 6, { size: 20, color: UI.good });
      text(d.gifted === State.dayIndex ? 'presente entregue' : '', 610, y + 6, { size: 20, color: UI.good });
      const loves = d.pts >= 100 ? `Ama: ${n.loves.map(x => ITEMS[x].name).join(', ')}` : 'Converse mais para descobrir o que ama.';
      text(loves, 120, y + 32, { size: 20, color: UI.dim });
    });
  }
  drawJournal() {
    const q = currentQuest();
    text('Objetivo atual', 50, 76, { size: 26, color: UI.hi });
    wrapText(q ? q.text : 'O vale está em paz. Aproveite o seu sítio!', 860, 24).forEach((l, i) => text(l, 50, 106 + i * 26, { size: 24 }));
    let y = 170;
    QUESTS.forEach(qq => { if (qq.done()) { text('✔ ' + qq.text, 50, y, { size: 20, color: UI.good }); y += 24; } });
    y = Math.max(y + 12, 300);
    text('Habilidades', 50, y, { size: 26, color: UI.hi });
    Object.keys(SKILL_NAMES).forEach((k, i) => {
      const lv = State.skillLevel(k), xp = State.skills[k], nx = SKILL_XP[Math.min(5, lv + 1)];
      text(`${SKILL_NAMES[k]}: nível ${lv}`, 50 + (i % 2) * 430, y + 34 + Math.floor(i / 2) * 50, { size: 24 });
      drawBar(50 + (i % 2) * 430, y + 62 + Math.floor(i / 2) * 50, 300, 6, lv >= 5 ? 1 : (xp - SKILL_XP[lv]) / (nx - SKILL_XP[lv]), '#d8b04a');
    });
    const st = State.stats;
    text(`Plantado: ${st.planted}  Colhido: ${st.harvested}  Peixes: ${st.fish}  Monstros derrotados: ${st.kills}  Andar mais fundo: ${State.caveMax}  Ganho: ${st.shipped} moedas`, 50, 500, { size: 20, color: UI.dim });
  }
  drawOpts() {
    const opts = [`Velocidade do texto: ${['Lenta', 'Normal', 'Rápida'][State.opts.textSpeed - 1]}`, `Som: ${Audio2.muted ? 'desligado' : 'ligado'} (tecla M)`, 'Voltar ao título (o progresso desde a última noite é perdido)', 'Fechar menu'];
    opts.forEach((o, i) => { text(o, 80, 90 + i * 46, { size: 28, color: i === this.cur ? UI.hi : UI.text }); if (i === this.cur) drawCursor(52, 96 + i * 46); });
    const help = [
      'Controles: setas/WASD andam · Z/Espaço usa a ferramenta ou interage · X/Esc abre o menu',
      'Q/E trocam o item da barra (ou teclas 1 a 8) · segure Z para repetir a ferramenta · M liga/desliga o som',
      'O jogo salva quando você dorme na cama. O dia acaba às 2h da manhã.',
    ];
    help.forEach((h, i) => text(h, 50, 330 + i * 32, { size: 21, color: UI.dim }));
  }
}
function canCraft(r) { return r.need.every(([id, k]) => (typeof id === 'object' ? State.countCat(id.cat) : State.count(id)) >= k); }

// ------------------------------------------------------------
//  Loja da Dona Flor
// ------------------------------------------------------------
class ShopScene {
  constructor(id) {
    this.shop = SHOPS[id]; this.mode = 'buy'; this.cur = 0; this.qty = 1; this.picking = false; this.msg = ''; this.msgT = 0;
    this.stock = this.shop.stock();
    if (State.invSize < 36) this.stock.push('__mochila');
  }
  sellList() { const out = []; for (let i = 0; i < State.invSize; i++) { const s = State.inv[i]; if (s && ITEMS[s.id].kind !== 'tool' && ITEMS[s.id].kind !== 'key' && ITEMS[s.id].price > 0 && !out.includes(s.id)) out.push(s.id); } return out; }
  list() { return this.mode === 'buy' ? this.stock : this.sellList(); }
  price(id) { return id === '__mochila' ? 1500 : ITEMS[id].buy; }
  update() {
    if (this.msgT > 0) this.msgT--;
    const L = this.list();
    if (this.picking) {
      const id = L[this.cur];
      const max = this.mode === 'buy' ? Math.max(1, Math.min(99, Math.floor(State.gold / this.price(id)))) : State.count(id);
      if (Input.rep('up') || Input.rep('right')) this.qty = Math.min(max, this.qty + (Input.rep('up') ? 1 : 10));
      if (Input.rep('down') || Input.rep('left')) this.qty = Math.max(1, this.qty - (Input.rep('down') ? 1 : 10));
      if (Input.cancel()) { this.picking = false; Audio2.sfx('cancel'); }
      else if (Input.ok()) {
        if (this.mode === 'buy') {
          const cost = this.price(id) * this.qty;
          if (cost > State.gold) { Audio2.sfx('buzz'); return; }
          const left = State.addItem(id, this.qty);
          const bought = this.qty - left;
          State.gold -= this.price(id) * bought;
          this.flash(left ? 'Mochila cheia! Comprou só ' + bought : `Comprou ${bought}x ${ITEMS[id].name}.`);
        } else { State.removeItem(id, this.qty); State.gold += ITEMS[id].price * this.qty; this.flash(`Vendeu por ${ITEMS[id].price * this.qty} moedas.`); }
        Audio2.sfx('coin'); this.picking = false;
        this.cur = Math.min(this.cur, Math.max(0, this.list().length - 1));
      }
      return;
    }
    if (Input.rep('left') || Input.rep('right') || Input.rep('prev') || Input.rep('next')) { this.mode = this.mode === 'buy' ? 'sell' : 'buy'; this.cur = 0; Audio2.sfx('cursor'); }
    if (Input.rep('up')) { this.cur = Math.max(0, this.cur - 1); Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = Math.min(L.length - 1, this.cur + 1); Audio2.sfx('cursor'); }
    if (Input.cancel()) { Audio2.sfx('cancel'); G.remove(this); return; }
    if (Input.ok() && L.length) {
      const id = L[this.cur];
      if (id === '__mochila') {
        if (State.gold < 1500) { Audio2.sfx('buzz'); this.flash('Moedas insuficientes.'); return; }
        State.gold -= 1500; State.invSize = 36; Audio2.sfx('levelup'); this.flash('Mochila maior! Agora cabem 36 itens.'); this.stock = this.stock.filter(x => x !== '__mochila'); return;
      }
      if (this.mode === 'buy' && State.gold < this.price(id)) { Audio2.sfx('buzz'); this.flash('Moedas insuficientes.'); return; }
      this.qty = 1; this.picking = true; Audio2.sfx('ok');
    }
  }
  flash(m) { this.msg = m; this.msgT = 120; }
  draw() {
    drawWin(20, 16, VIEW_W - 40, VIEW_H - 32);
    text(this.shop.name, 44, 28, { size: 32, color: UI.hi });
    text(`${State.gold} moedas`, VIEW_W - 44, 32, { size: 28, align: 'right', color: '#ffd04a' });
    ['Comprar', 'Vender'].forEach((t, i) => text(t, 44 + i * 150, 70, { size: 28, color: (this.mode === 'buy') === (i === 0) ? UI.hi : UI.dim }));
    const L = this.list();
    const top = Math.max(0, Math.min(this.cur - 4, L.length - 9));
    L.slice(top, top + 9).forEach((id, j) => {
      const i = top + j, y = 112 + j * 42, sel = i === this.cur;
      if (sel) { ctx.fillStyle = 'rgba(255,198,92,0.15)'; ctx.fillRect(40, y - 2, 560, 40); drawCursor(44, y + 9); }
      if (id === '__mochila') { ctx.drawImage(Icons.get('bau'), 70, y, 34, 34); text('Mochila Grande (+12 espaços)', 112, y + 5, { size: 24 }); text('1500', 590, y + 5, { size: 24, align: 'right', color: '#ffd04a' }); return; }
      ctx.drawImage(Icons.get(id), 70, y, 34, 34);
      text(ITEMS[id].name + (this.mode === 'sell' ? ` x${State.count(id)}` : ''), 112, y + 5, { size: 24, color: this.mode === 'buy' && State.gold < this.price(id) ? UI.dim : UI.text });
      text(String(this.mode === 'buy' ? this.price(id) : ITEMS[id].price), 590, y + 5, { size: 24, align: 'right', color: '#ffd04a' });
    });
    if (!L.length) text('Nada para vender.', 70, 120, { size: 24, color: UI.dim });
    drawWin(620, 100, 300, 300);
    const id = L[this.cur];
    if (id && id !== '__mochila') { ctx.drawImage(Icons.get(id), 730, 116, 80, 80); wrapText(ITEMS[id].name + '. ' + itemInfoText(id), 260, 22).slice(0, 7).forEach((l, i) => text(l, 640, 206 + i * 24, { size: 22 })); text(`Você tem: ${State.count(id)}`, 640, 370, { size: 22, color: UI.dim }); }
    if (this.picking) {
      const total = (this.mode === 'buy' ? this.price(id) : ITEMS[id].price) * this.qty;
      drawWin(200, 220, 380, 120);
      text(`Quantidade: ${this.qty}`, 230, 236, { size: 30 });
      text(`Total: ${total} moedas`, 230, 274, { size: 26, color: '#ffd04a' });
      text('▲▼ ±1   ◀▶ ±10', 230, 306, { size: 20, color: UI.dim });
    }
    text(this.msgT > 0 ? this.msg : '◀▶ troca entre Comprar e Vender · Z escolhe · X sai', 44, 500, { size: 24, color: this.msgT > 0 ? UI.hi : UI.dim });
  }
}

// ------------------------------------------------------------
//  Ferraria do Seu Malho
// ------------------------------------------------------------
class ForgeScene {
  constructor() { this.cur = 0; this.msg = ''; this.msgT = 0; }
  rows() {
    const r = ['enxada', 'regador', 'picareta', 'machado', 'espada', 'vara'].map(t => ({ t }));
    if (State.barnCap < 8) r.push({ barn: true });
    return r;
  }
  cost(row) {
    if (row.barn) return { gold: 2500, mats: [['madeira', 50], ['pedra', 30]] };
    const tier = State.tools[row.t]; const u = UPGRADES[tier + 1];
    return u ? { gold: u.gold, mats: [[u.item, u.n]] } : null;
  }
  update() {
    if (this.msgT > 0) this.msgT--;
    const R = this.rows();
    if (Input.rep('up')) { this.cur = (this.cur + R.length - 1) % R.length; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = (this.cur + 1) % R.length; Audio2.sfx('cursor'); }
    if (Input.cancel()) { Audio2.sfx('cancel'); G.remove(this); return; }
    if (Input.ok()) {
      const row = R[this.cur], c = this.cost(row);
      if (!c) { Audio2.sfx('buzz'); this.flash('Essa ferramenta já está no nível máximo!'); return; }
      if (State.gold < c.gold || !c.mats.every(([id, n]) => State.count(id) >= n)) { Audio2.sfx('buzz'); this.flash('Falta material ou moeda.'); return; }
      State.gold -= c.gold; for (const [id, n] of c.mats) State.removeItem(id, n);
      if (row.barn) { State.barnCap = 8; this.flash('Curral reformado! Agora cabem 8 monstrinhos.'); }
      else { State.tools[row.t]++; Icons.reset(row.t); if (row.t === 'regador') State.water = CAN_CAPACITY[State.tools.regador]; this.flash(`${ITEMS[row.t].name} melhorado para ${TIERS[State.tools[row.t]]}!`); }
      Audio2.sfx('anvil');
      this.cur = Math.min(this.cur, this.rows().length - 1);
    }
  }
  flash(m) { this.msg = m; this.msgT = 150; }
  draw() {
    drawWin(20, 16, VIEW_W - 40, VIEW_H - 32);
    text('Ferraria do Seu Malho', 44, 28, { size: 32, color: UI.hi });
    text(`${State.gold} moedas`, VIEW_W - 44, 32, { size: 28, align: 'right', color: '#ffd04a' });
    const R = this.rows();
    R.forEach((row, i) => {
      const y = 86 + i * 54, sel = i === this.cur, c = this.cost(row);
      if (sel) { ctx.fillStyle = 'rgba(255,198,92,0.15)'; ctx.fillRect(40, y - 4, VIEW_W - 80, 50); drawCursor(44, y + 10); }
      if (row.barn) { text('Reforma: Curral Grande (8 vagas)', 76, y + 6, { size: 26 }); }
      else { ctx.drawImage(Icons.get(row.t), 72, y - 2, 40, 40); text(`${ITEMS[row.t].name} ${TIERS[State.tools[row.t]]}`, 122, y + 6, { size: 26 }); }
      if (!c) { text('nível máximo', 560, y + 8, { size: 22, color: UI.good }); return; }
      const ok = State.gold >= c.gold && c.mats.every(([id, n]) => State.count(id) >= n);
      const matTxt = c.mats.map(([id, n]) => `${ITEMS[id].name} ${State.count(id)}/${n}`).join(', ');
      text(`${c.gold} moedas + ${matTxt}`, 440, y + 8, { size: 22, color: ok ? UI.good : UI.bad });
    });
    const tips = 'Melhorias: enxada e regador alcançam mais terra; picareta e machado quebram mais rápido; espada causa mais dano; vara facilita a pesca.';
    wrapText(this.msgT > 0 ? this.msg : tips, VIEW_W - 100, 22).forEach((l, i) => text(l, 44, 470 + i * 26, { size: 22, color: this.msgT > 0 ? UI.hi : UI.dim }));
  }
}

// ------------------------------------------------------------
//  Baú
// ------------------------------------------------------------
class ChestScene {
  constructor(o) { this.o = o; this.side = 0; this.cur = 0; Audio2.sfx('door'); }
  update() {
    const n = this.side === 0 ? 24 : State.invSize, cols = 12;
    if (Input.rep('left')) this.cur = (this.cur + n - 1) % n;
    if (Input.rep('right')) this.cur = (this.cur + 1) % n;
    if (Input.rep('up')) { if (this.side === 1 && this.cur < cols) { this.side = 0; this.cur += 12; } else this.cur = (this.cur - cols + n) % n; }
    if (Input.rep('down')) { if (this.side === 0 && this.cur >= 12) { this.side = 1; this.cur -= 12; } else this.cur = (this.cur + cols) % n; }
    if (Input.rep('prev') || Input.rep('next')) { this.side = 1 - this.side; this.cur = 0; }
    if (Input.cancel()) { Audio2.sfx('cancel'); G.remove(this); return; }
    if (Input.ok()) {
      const src = this.side === 0 ? this.o.items : State.inv, s = src[this.cur];
      if (!s) return;
      if (this.side === 0) { const left = State.addItem(s.id, s.n); if (left === s.n) { Audio2.sfx('buzz'); return; } if (left) s.n = left; else src[this.cur] = null; }
      else {
        if (ITEMS[s.id].kind === 'tool') { Audio2.sfx('buzz'); return; }
        let n = s.n;
        for (let i = 0; i < 24 && n; i++) { const c = this.o.items[i]; if (c && c.id === s.id && c.n < 99) { const k = Math.min(n, 99 - c.n); c.n += k; n -= k; } }
        for (let i = 0; i < 24 && n; i++) if (!this.o.items[i]) { this.o.items[i] = { id: s.id, n }; n = 0; }
        if (n === s.n) { Audio2.sfx('buzz'); return; }
        if (n) s.n = n; else State.inv[this.cur] = null;
      }
      Audio2.sfx('place');
    }
  }
  draw() {
    drawWin(20, 16, VIEW_W - 40, VIEW_H - 32);
    text('Baú', 50, 26, { size: 30, color: UI.hi });
    const size = 64, gap = 6;
    for (let i = 0; i < 24; i++) drawSlot(52 + (i % 12) * (size + gap), 64 + Math.floor(i / 12) * (size + gap), this.o.items[i], size, this.side === 0 && i === this.cur);
    text('Mochila', 50, 216, { size: 30, color: UI.hi });
    for (let i = 0; i < 36; i++) drawSlot(52 + (i % 12) * (size + gap), 254 + Math.floor(i / 12) * (size + gap), i < State.invSize ? State.inv[i] : null, size, this.side === 1 && i === this.cur, i >= State.invSize);
    text('Z: mover para o outro lado · X: fechar', 50, 520, { size: 22, color: UI.dim });
  }
}

// ------------------------------------------------------------
//  Altar da Árvore-Lua
// ------------------------------------------------------------
class AltarScene {
  constructor() { this.cur = 0; this.msg = ''; this.msgT = 0; questStep('bosque'); }
  rows() { const r = OFFERINGS.slice(); if (OFFERINGS.every(offeringDone)) r.push({ id: 'coracao', name: 'O Coração da Caverna', need: [['coracao_bolor', 1]] }); return r; }
  update() {
    if (this.msgT > 0) this.msgT--;
    const R = this.rows();
    if (Input.rep('up')) { this.cur = (this.cur + R.length - 1) % R.length; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.cur = (this.cur + 1) % R.length; Audio2.sfx('cursor'); }
    if (Input.cancel()) { Audio2.sfx('cancel'); G.remove(this); return; }
    if (Input.ok()) {
      const o = R[this.cur];
      if (!o) { this.cur = 0; return; }
      if (o.id === 'coracao') {
        if (State.flags.fim) { this.flash('A Árvore-Lua já floresceu.'); return; }
        if (!State.has('coracao_bolor')) { Audio2.sfx('buzz'); this.flash('O Coração de Bolor está no fundo da Caverna Brumosa (andar 20).'); return; }
        State.removeItem('coracao_bolor'); G.remove(this); World.run(finale); return;
      }
      if (offeringDone(o)) { this.flash('Esta oferenda já foi entregue.'); return; }
      const d = State.offerings[o.id] || (State.offerings[o.id] = {});
      let gave = 0;
      const order = o.need.filter(([id]) => typeof id !== 'object').concat(o.need.filter(([id]) => typeof id === 'object'));
      for (const [id, n] of order) {
        const key = needKey(id), k = Math.min(n - (d[key] || 0), needCount(id));
        if (k > 0) { if (typeof id === 'object') State.removeCat(id.cat, k); else State.removeItem(id, k); d[key] = (d[key] || 0) + k; gave += k; }
      }
      if (!gave) { Audio2.sfx('buzz'); this.flash('Você não tem nenhum item que falta nesta oferenda.'); return; }
      Audio2.sfx('ember');
      if (offeringDone(o)) {
        for (const [id, n] of o.reward) { if (id === 'gold') State.gold += n; else if (id === 'curral') State.barnCap = Math.max(State.barnCap, 8); else { const left = State.addItem(id, n); if (left) World.drop(id, left, ...World.ptile()); } }
        G.flash('#c8d8ff', 20); Audio2.sfx('levelup');
        this.flash(`${o.name} completa! ${o.text} Recompensa: ${o.reward.map(([id, n]) => id === 'gold' ? n + ' moedas' : id === 'curral' ? 'curral maior' : n + 'x ' + ITEMS[id].name).join(', ')}.`);
      } else this.flash(`Você entregou ${gave} ${gave > 1 ? 'itens' : 'item'}.`);
    }
  }
  flash(m) { this.msg = m; this.msgT = 240; }
  draw() {
    drawWin(20, 16, VIEW_W - 40, VIEW_H - 32);
    text('Altar da Árvore-Lua', 44, 28, { size: 32, color: '#c8d8ff' });
    text('"Traga o que o vale tem de melhor, e eu voltarei a brilhar." — palavras gravadas na pedra', 44, 64, { size: 20, color: UI.dim });
    const R = this.rows();
    R.forEach((o, i) => {
      const y = 100 + i * 70, sel = i === this.cur, done = o.id === 'coracao' ? !!State.flags.fim : offeringDone(o);
      if (sel) { ctx.fillStyle = 'rgba(200,216,255,0.12)'; ctx.fillRect(40, y - 4, VIEW_W - 80, 64); drawCursor(44, y + 6); }
      text((done ? '✔ ' : '') + o.name, 72, y, { size: 26, color: done ? UI.good : sel ? UI.hi : UI.text });
      let x = 72;
      const d = State.offerings[o.id] || {};
      for (const [id, n] of o.need) {
        const got = o.id === 'coracao' ? (State.flags.fim ? 1 : 0) : (d[needKey(id)] || 0);
        ctx.drawImage(Icons.get(needIcon(id)), x, y + 30, 28, 28);
        const s = (typeof id === 'object' ? needName(id) + ' ' : '') + `${got}/${n}` + (got < n ? ` (tem ${needCount(id)})` : '');
        text(s, x + 32, y + 34, { size: 20, color: got >= n ? UI.good : needCount(id) ? UI.hi : UI.dim });
        x += textW(s, 20) + 60;
      }
    });
    wrapText(this.msgT > 0 ? this.msg : 'Z: entregar os itens que você tem · X: sair', VIEW_W - 100, 22).forEach((l, i) => text(l, 44, 480 + i * 26, { size: 22, color: this.msgT > 0 ? UI.hi : UI.dim }));
  }
}

// ------------------------------------------------------------
//  Minijogo de pesca: acerte o marcador na zona verde
// ------------------------------------------------------------
class FishScene {
  constructor(fish) {
    this.fish = fish; this.dif = fish.dif;
    const lv = State.skillLevel('fish'), rod = State.tools.vara;
    this.need = Math.max(1, Math.min(3, this.dif));
    this.hits = 0; this.miss = 0; this.pos = 0; this.vel = 0.011 + this.dif * 0.0045;
    this.zw = U.clamp(0.3 - this.dif * 0.05 + lv * 0.02 + rod * 0.03, 0.1, 0.45);
    this.zone = U.rand(0.1, 0.9 - this.zw); this.t = 0; this.done = null; this.flashT = 0;
    Audio2.sfx('reel');
  }
  update() {
    this.t++;
    if (this.done) { if (--this.doneT <= 0) G.remove(this); return; }
    this.pos += this.vel;
    if (this.pos > 1 || this.pos < 0) { this.vel = -this.vel; this.pos = U.clamp(this.pos, 0, 1); }
    if (this.dif >= 3 && this.t % 70 === 0) this.vel *= U.rand(0.8, 1.25);
    if (this.flashT > 0) this.flashT--;
    if (Input.ok()) {
      if (this.pos >= this.zone && this.pos <= this.zone + this.zw) {
        this.hits++; Audio2.sfx('reel'); this.flashT = 10;
        if (this.hits >= this.need) return this.finish(true);
        this.zone = U.rand(0.05, 0.95 - this.zw); this.zw *= 0.85;
      } else { this.miss++; Audio2.sfx('buzz'); if (this.miss >= 2) return this.finish(false); }
    }
    if (this.t > 60 * 9) this.finish(false);
  }
  finish(ok) {
    this.done = ok ? 'ok' : 'fail'; this.doneT = 70;
    if (ok) {
      const left = State.addItem(this.fish.id, 1);
      if (left) World.drop(this.fish.id, 1, ...World.ptile()); else World.notify(this.fish.id, 1);
      State.stats.fish++; State.addXp('fish', 4 + this.dif * 4); Audio2.sfx('catch');
    } else Audio2.sfx('cancel');
  }
  draw() {
    const x = 180, y = 150, w = 600;
    drawWin(x - 20, y - 50, w + 40, 230);
    if (this.done) {
      text(this.done === 'ok' ? `Você pescou: ${ITEMS[this.fish.id].name}!` : 'O peixe escapou...', x + w / 2, y + 40, { size: 34, align: 'center', color: this.done === 'ok' ? UI.good : UI.bad });
      if (this.done === 'ok') ctx.drawImage(Icons.get(this.fish.id), x + w / 2 - 32, y + 86, 64, 64);
      return;
    }
    text(['', 'Peixe fácil', 'Peixe médio', 'Peixe difícil', 'Peixe lendário!'][Math.min(4, this.dif)] + ` — acertos ${this.hits}/${this.need}`, x, y - 36, { size: 26, color: UI.hi });
    ctx.fillStyle = '#1a2a4a'; ctx.fillRect(x, y, w, 40);
    ctx.fillStyle = this.flashT > 0 ? '#c8ffb8' : '#4ac85a'; ctx.fillRect(x + this.zone * w, y, this.zw * w, 40);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + this.pos * w - 3, y - 8, 6, 56);
    ctx.drawImage(Icons.get(this.fish.dif >= 4 ? 'peixe_lua' : 'lambari'), x + this.pos * w - 16, y + 48, 32, 32);
    text('Aperte Z quando o marcador estiver na faixa verde!', x + w / 2, y + 120, { size: 24, align: 'center' });
    text(`Erros: ${this.miss}/2`, x + w / 2, y + 150, { size: 22, align: 'center', color: UI.dim });
  }
}

// ------------------------------------------------------------
//  Resumo do dia
// ------------------------------------------------------------
class DaySummaryScene {
  constructor(sum) { this.sum = sum; this.t = 0; this.promise = new Promise(r => (this.res = r)); this.opaque = true; Audio2.play('jingle'); }
  update() { this.t++; if (this.t > 30 && (Input.ok() || Input.cancel())) { G.remove(this); World.playMusic(); this.res(); } }
  draw() {
    ctx.fillStyle = '#141024'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const s = this.sum;
    text('Fim do dia', VIEW_W / 2, 30, { size: 44, align: 'center', color: UI.hi });
    let y = 96;
    if (s.ship.length) {
      text('Vendas da caixa de envio', 80, y, { size: 26, color: '#ffd04a' }); y += 36;
      s.ship.slice(0, 8).forEach((it, i) => { const x = 80 + (i % 4) * 200, yy = y + Math.floor(i / 4) * 40; ctx.drawImage(Icons.get(it.id), x, yy, 32, 32); text(`${it.n}x  ${ITEMS[it.id].price * it.n}`, x + 40, yy + 4, { size: 22 }); });
      y += Math.ceil(Math.min(8, s.ship.length) / 4) * 40 + 6;
      text(`Total: ${s.earned} moedas`, 80, y, { size: 30, color: '#ffd04a' }); y += 46;
    } else { text('Nada foi vendido hoje.', 80, y, { size: 24, color: UI.dim }); y += 40; }
    if (s.lost) { text(`Você perdeu ${s.lost} moedas ao desmaiar.`, 80, y, { size: 24, color: UI.bad }); y += 34; }
    for (const n of s.notes.slice(0, 7)) { wrapText(n, 800, 22).forEach(l => { text(l, 80, y, { size: 22 }); y += 26; }); }
    text(`Bom dia! ${State.dateText()} · Ano ${State.year}`, VIEW_W / 2, VIEW_H - 92, { size: 30, align: 'center', color: UI.hi });
    text({ sol: 'Previsão: sol', chuva: 'Está chovendo: as plantações foram regadas', neve: 'Está nevando' }[State.weather] + ' · Jogo salvo', VIEW_W / 2, VIEW_H - 56, { size: 24, align: 'center', color: UI.dim });
    if (this.t > 30) drawDownArrow(VIEW_W - 50, VIEW_H - 30);
  }
}

// ------------------------------------------------------------
//  Título, escolha de visual, abertura, créditos
// ------------------------------------------------------------
function drawFarmBackdrop(t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#7ac8f0'); g.addColorStop(0.6, '#d8f0ff'); g.addColorStop(1, '#bfe4ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) { const x = ((i * 260 + t * 0.2) % (VIEW_W + 200)) - 100, y = 60 + i * 30; ctx.beginPath(); ctx.ellipse(x, y, 60, 16, 0, 0, 7); ctx.ellipse(x + 30, y - 10, 40, 14, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#7ab86a'; ctx.beginPath(); ctx.moveTo(0, 380); for (let x = 0; x <= VIEW_W; x += 20) ctx.lineTo(x, 330 + Math.sin(x / 120) * 30); ctx.lineTo(VIEW_W, VIEW_H); ctx.lineTo(0, VIEW_H); ctx.fill();
  ctx.fillStyle = '#5ca63e'; ctx.fillRect(0, 400, VIEW_W, 176);
  ctx.fillStyle = '#8a5a34'; for (let r = 0; r < 4; r++) ctx.fillRect(80, 430 + r * 32, 420, 18);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) ctx.drawImage(CropArt.get(['nabo', 'morango', 'couve', 'tomate'][r], 3, true), 86 + c * 46, 400 + r * 32, 36, 54);
  // casa
  ctx.fillStyle = '#d8b07a'; ctx.fillRect(600, 300, 180, 110); ctx.fillStyle = '#c8504a'; ctx.beginPath(); ctx.moveTo(580, 305); ctx.lineTo(690, 230); ctx.lineTo(800, 305); ctx.fill();
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(675, 350, 34, 60); ctx.fillStyle = '#8ad0ff'; ctx.fillRect(620, 330, 34, 28); ctx.fillRect(728, 330, 34, 28);
  // monstrinhos pulando
  const mons = [['drop', '#6ac8ff'], ['sprout', '#7ad85a'], ['puff', '#fff4c8'], ['shroom', '#ff7ab8'], ['wool', '#f4f0ff']];
  mons.forEach(([k, c], i) => { const x = 560 + i * 72, y = 470 - Math.abs(Math.sin(t / 18 + i)) * 26; ctx.drawImage(MonArt.get(k, c, Math.floor(t / 20 + i) % 2, 16), x, y, 64, 64); });
}

class TitleScene {
  constructor() { this.opaque = true; this.t = 0; this.sel = State.hasSave() ? 1 : 0; Audio2.play('title'); }
  update() {
    this.t++;
    if (Input.rep('up')) { this.sel = (this.sel + 2) % 3; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.sel = (this.sel + 1) % 3; Audio2.sfx('cursor'); }
    if (Input.ok()) {
      if (this.sel === 0) { Audio2.sfx('ok'); G.replaceAll(new LookScene()); }
      else if (this.sel === 1) { if (State.hasSave()) { Audio2.sfx('ok'); loadGame(); } else Audio2.sfx('buzz'); }
      else Audio2.toggleMute();
    }
  }
  draw() {
    drawFarmBackdrop(this.t);
    ctx.save(); ctx.shadowColor = '#3a2a6a'; ctx.shadowBlur = 0;
    text('Vale dos Monstrinhos', VIEW_W / 2 + 4, 44 + 4, { size: 80, align: 'center', color: '#3a2a6a', shadow: false });
    text('Vale dos Monstrinhos', VIEW_W / 2, 44, { size: 80, align: 'center', color: '#fff6c8' });
    ctx.restore();
    text('plante, colha, faça amigos... monstruosos!', VIEW_W / 2, 132, { size: 28, align: 'center', color: '#3a2a6a', shadow: false });
    const o = ['Novo jogo', 'Continuar', Audio2.muted ? 'Som: desligado' : 'Som: ligado'];
    drawWin(80, 190, 280, 160);
    o.forEach((s, i) => { const dis = i === 1 && !State.hasSave(); text(s, 128, 206 + i * 46, { size: 32, color: dis ? UI.dim : i === this.sel ? UI.hi : UI.text }); if (i === this.sel) drawCursor(98, 214 + i * 46); });
    if (document.hasFocus && !document.hasFocus() && Math.floor(this.t / 40) % 2 === 0) { drawWin(80, 360, 280, 40); text('Clique na tela para jogar', 220, 366, { size: 24, align: 'center', color: UI.hi }); }
    drawWin(20, VIEW_H - 46, VIEW_W - 40, 36, { alpha: 0.85 });
    text('Setas: andar · Z: usar/interagir · X: menu · Q/E: trocar item · M: som', VIEW_W / 2, VIEW_H - 42, { size: 22, align: 'center', color: UI.text });
  }
}

class LookScene {
  constructor() { this.opaque = true; this.sel = 0; this.t = 0; }
  update() {
    this.t++;
    if (Input.rep('left') || Input.rep('right')) { this.sel = 1 - this.sel; Audio2.sfx('cursor'); }
    if (Input.cancel()) { G.replaceAll(new TitleScene()); return; }
    if (Input.ok()) { Audio2.sfx('ok'); newGame(this.sel); }
  }
  draw() {
    drawFarmBackdrop(this.t);
    drawWin(180, 80, 600, 380);
    text('Escolha seu visual', VIEW_W / 2, 100, { size: 40, align: 'center', color: UI.hi });
    for (let i = 0; i < 2; i++) {
      const x = 300 + i * 240, y = 170;
      if (i === this.sel) { ctx.fillStyle = 'rgba(255,198,92,0.2)'; ctx.fillRect(x - 20, y - 10, 160, 200); ctx.strokeStyle = UI.hi; ctx.lineWidth = 3; ctx.strokeRect(x - 20, y - 10, 160, 200); }
      const dirs = ['down', 'left', 'up', 'right'];
      ctx.drawImage(CharArt.get('player' + i, PLAYER_LOOKS[i], dirs[Math.floor(this.t / 40) % 4], Math.floor(this.t / 10) % 3), x, y, 120, 120);
    }
    text('◀ ▶ para escolher · Z para começar', VIEW_W / 2, 410, { size: 26, align: 'center' });
  }
}

class IntroScene {
  constructor() {
    this.opaque = true; this.i = 0; this.t = 0;
    this.pages = [
      'Querida pessoa da minha vida,',
      'Se você está lendo esta carta, é porque eu fui descansar e o sítio agora é seu.',
      'Ele está meio bagunçado, eu sei. Mato, pedra, galho por todo lado. Mas a terra é boa, eu prometo.',
      'Antigamente, monstrinhos viviam aqui com a gente. Gotinhas regavam a horta, Plumitos botavam ovos fofinhos...',
      'Mas a *Árvore-Lua* do bosque começou a murchar, e os monstrinhos se espalharam pelo vale.',
      'Cuide da terra, faça amigos — gente e monstrinho — e leve oferendas à Árvore-Lua. Ela vai escutar.',
      'Com todo o amor do mundo,\n— Vó Lurdes',
    ];
    Audio2.play('title');
  }
  update() {
    this.t++;
    if (this.t > 20 && (Input.ok() || Input.cancel())) { Audio2.sfx('cursor'); this.i++; this.t = 0; if (this.i >= this.pages.length) this.finish(); }
  }
  async finish() {
    if (this.fin) return; this.fin = true;
    await G.fadeTo(1, 30);
    startWorld('fazenda', 41, 17, 'left');
    await G.fadeTo(0, 30);
    World.run(introCutscene);
  }
  draw() {
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#d8c8a0'; for (let y = 60; y < VIEW_H; y += 40) ctx.fillRect(80, y, VIEW_W - 160, 2);
    const p = this.pages[Math.min(this.i, this.pages.length - 1)];
    const lines = wrapText(p, 760, 34);
    ctx.globalAlpha = Math.min(1, this.t / 25);
    lines.forEach((l, j) => richText(l, 100, 220 + j * 46 - lines.length * 20, { size: 34, color: '#3a2a20', hiColor: '#a8402a' }));
    ctx.globalAlpha = 1;
    if (this.t > 20) drawDownArrow(VIEW_W - 100, VIEW_H - 60);
  }
}

async function introCutscene() {
  await S.wait(30);
  await S.say('Íris', 'Olá! Você deve ser a família da Dona Lurdes! Eu sou a Íris, monstróloga da Vila Bruma.');
  await S.say('Pituco', 'E eu sou o Pituco! A gente veio te dar as boas-vindas!');
  await S.say('Íris', 'O sítio está precisando de carinho. Use a *enxada* para cavar, plante as sementes e regue com o *regador* todo dia.');
  await S.say('Íris', 'Mato, pedras e galhos saem com a *espada*, a *picareta* e o *machado*. Dá para encher o regador na lagoa ou no poço.');
  await S.say('Íris', 'E o mais importante: monstrinhos selvagens vivem pelo vale. Dê *Biscoito Monstro* a eles, um por dia. Com três, eles vêm morar no seu curral!');
  await S.say('Pituco', 'E eles ajudam! A Gotinha rega, o Plumito bota ovo... é o máximo!');
  await S.say('Íris', 'A Dona Flor mandou essas sementes de Nabo-Lua. Eu deixei uns biscoitos também. A vila fica a leste, e o bosque da Árvore-Lua ao sul.');
  await S.say(null, '(Setas andam. Z usa a ferramenta da barra ou conversa. Q/E ou 1-8 trocam o item. X abre o menu. Durma na cama da casa para salvar.)');
}

async function finale() {
  World.busy = true;
  await S.say(null, 'Você coloca o Coração de Bolor no altar. Ele derrete devagar numa luz prateada que escorre pelas raízes da Árvore-Lua.');
  G.shake(40, 4); Audio2.sfx('ember');
  await G.fadeTo(1, 50, '#ffffff');
  State.flags.fim = true;
  await G.wait(30);
  await G.fadeTo(0, 60, '#ffffff');
  Audio2.play('ending');
  await S.say(null, 'A Árvore-Lua desperta! Seus galhos se enchem de flores prateadas e um vento morno atravessa o vale inteiro.');
  await S.say('Íris', 'Você conseguiu! O bolor sumiu da caverna e os monstrinhos estão voltando para o vale. Olha só quantos!');
  await S.say('Vovó Nena', 'A Lurdes estaria tão orgulhosa... Esse sítio voltou a ter vida.');
  await S.say('Pituco', 'Agora vou poder ter mil monstrinhos!!');
  await S.say(null, 'E assim, entre colheitas, pescarias e monstrinhos fofos, a vida no vale seguiu feliz. (Você pode continuar jogando o quanto quiser!)');
  const sc = new CreditsScene(); G.push(sc); await sc.promise;
}

class CreditsScene {
  constructor() {
    this.opaque = true; this.t = 0; this.y = VIEW_H; this.promise = new Promise(r => (this.res = r));
    this.lines = [['Vale dos Monstrinhos', 56, UI.hi], ['', 30], ['Obrigado por jogar!', 34, UI.text], ['', 40],
      ['Dona Flor · Seu Malho · Íris', 26, UI.text], ['Davi · Vovó Nena · Pituco', 26, UI.text], ['', 30],
      [`Monstrinhos no curral: ${State.monsters.length}`, 26, UI.text], [`Colheitas: ${State.stats.harvested} · Peixes: ${State.stats.fish}`, 26, UI.text], [`Moedas ganhas: ${State.stats.shipped}`, 26, UI.text], ['', 40],
      ['Em memória da Vó Lurdes, que sabia conversar com a terra.', 26, UI.dim], ['', 60], ['FIM (mas o sítio continua!)', 40, UI.hi]];
    this.total = this.lines.reduce((s, l) => s + l[1] + 14, 0);
  }
  update() { this.t++; if (this.y > VIEW_H / 2 - this.total + 30) this.y -= Input.held.ok ? 3 : 0.7; else if (Input.ok() || Input.cancel()) { G.remove(this); this.res(); } }
  draw() { drawFarmBackdrop(this.t); ctx.fillStyle = 'rgba(20,16,40,0.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); let y = this.y; for (const [t, s, c] of this.lines) { if (t) text(t, VIEW_W / 2, y, { size: s, align: 'center', color: c }); y += s + 14; } }
}

// ------------------------------------------------------------
//  Fluxo do jogo
// ------------------------------------------------------------
async function newGame(look) {
  await G.fadeTo(1, 25);
  State.newGame(look);
  genInitialObjects(); dailyObjects();
  G.replaceAll(new IntroScene());
  await G.fadeTo(0, 25);
}
function startWorld(map, x, y, dir) {
  G.replaceAll(new WorldScene());
  World.map = null; World.busy = false; World.depth = 0; World.cave = null;
  World.load(map, x, y, dir);
}
async function loadGame() {
  const d = State.loadSaved(); if (!d) return;
  await G.fadeTo(1, 20);
  State.deserialize(d);
  startWorld('casa', 2, 4, 'down');
  await G.fadeTo(0, 20);
}
async function toTitle() { await G.fadeTo(1, 20); World.busy = false; World.map = null; G.replaceAll(new TitleScene()); await G.fadeTo(0, 20); }
