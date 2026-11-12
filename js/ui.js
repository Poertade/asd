'use strict';
// ============================================================
//  Componentes de interface: caixa de diálogo, escolhas, listas
// ============================================================

const BOX = { x: 20, y: VIEW_H - 178, w: VIEW_W - 40, h: 158 };

class MessageBox {
  constructor(speaker, text, opts = {}) {
    this.speaker = speaker; this.opts = opts;
    this.portrait = opts.portrait || (speaker && PORTRAIT_FOR[speaker]) || null;
    const textW = BOX.w - 56 - (this.portrait ? 140 : 0);
    const lines = wrapText(text, textW, 30);
    this.pages = [];
    for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    this.page = 0; this.chars = 0; this.done = false;
    this.promise = new Promise(r => (this.res = r));
  }
  pageLen() { return this.pages[this.page].reduce((s, l) => s + visibleLen(l), 0); }
  update() {
    const total = this.pageLen();
    const spd = [0, 0.7, 1.5, 4][State.opts.textSpeed || 2];
    if (this.opts.hold && this.page === this.pages.length - 1 && this.chars >= total) {
      if (!this.held) { this.held = true; this.res(); }
      return;
    }
    if (this.chars < total) {
      const before = Math.floor(this.chars);
      this.chars = Math.min(total, this.chars + spd);
      if (Math.floor(this.chars) !== before && Math.floor(this.chars) % 3 === 0) Audio2.sfx('text');
      if (Input.ok() || Input.cancel()) this.chars = total;
    } else if (Input.ok() || (Input.cancel() && !this.opts.noCancel)) {
      if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; Audio2.sfx('cursor'); }
      else { G.remove(this); this.res(); }
    }
  }
  draw() {
    drawWin(BOX.x, BOX.y, BOX.w, BOX.h);
    let tx = BOX.x + 28;
    if (this.portrait) { drawPortrait(this.portrait, BOX.x + 16, BOX.y + 16, 126); tx += 140; }
    if (this.speaker) {
      setFont(28);
      const w = textW(this.speaker, 28) + 32;
      drawWin(BOX.x + 16, BOX.y - 34, w, 40, { bgTop: 'rgba(60,40,30,0.97)', bgBot: 'rgba(30,20,16,0.97)' });
      text(this.speaker, BOX.x + 32, BOX.y - 28, { size: 28, color: UI.hi });
    }
    let left = this.chars;
    const lines = this.pages[this.page];
    for (let i = 0; i < lines.length; i++) {
      richText(lines[i], tx, BOX.y + 22 + i * 40, { size: 30 }, Math.floor(left));
      left -= visibleLen(lines[i]);
      if (left <= 0) break;
    }
    if (this.chars >= this.pageLen()) drawDownArrow(BOX.x + BOX.w - 30, BOX.y + BOX.h - 26);
  }
}

const PORTRAIT_FOR = {};
function drawPortrait(id, x, y, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = UI.border2; ctx.lineWidth = 3; ctx.strokeRect(x, y, size, size);
  ctx.beginPath(); ctx.rect(x + 2, y + 2, size - 4, size - 4); ctx.clip();
  if (id === 'ticao' && PORTRAITS.ticao) {
    const img = PORTRAITS.ticao;
    // recorte da cabeça (crânio)
    const sx = img.width * 0.02, sy = 0, sw = img.width * 0.56, sh = img.width * 0.56;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
    ctx.imageSmoothingEnabled = false;
  } else {
    const spr = id === 'ticao' ? Sprites.char('ticao', 'down', 0) : Sprites.char(id, 'down', 0);
    const grd = ctx.createLinearGradient(0, y, 0, y + size);
    grd.addColorStop(0, '#3a3058'); grd.addColorStop(1, '#1a1428');
    ctx.fillStyle = grd; ctx.fillRect(x, y, size, size);
    ctx.imageSmoothingEnabled = false;
    // mostra a cabeça ampliada
    ctx.drawImage(spr, 0, 0, 16, 16, x - size * 0.3, y + size * 0.02, size * 1.6, size * 1.6);
  }
  ctx.restore();
}

class ChoiceBox {
  constructor(options, opts = {}) {
    this.options = options; this.opts = opts; this.sel = opts.start || 0;
    setFont(30);
    this.w = Math.max(200, ...options.map(o => textW(o, 30))) + 70;
    this.h = options.length * 42 + 24;
    this.x = opts.x != null ? opts.x : VIEW_W - this.w - 30;
    this.y = opts.y != null ? opts.y : BOX.y - this.h - 44;
    this.promise = new Promise(r => (this.res = r));
  }
  update() {
    const n = this.options.length;
    if (Input.rep('up')) { this.sel = (this.sel + n - 1) % n; Audio2.sfx('cursor'); }
    if (Input.rep('down')) { this.sel = (this.sel + 1) % n; Audio2.sfx('cursor'); }
    if (Input.ok()) { Audio2.sfx('ok'); G.remove(this); this.res(this.sel); }
    else if (Input.cancel() && this.opts.cancel !== false) { Audio2.sfx('cancel'); G.remove(this); this.res(-1); }
  }
  draw() {
    if (this.opts.under) this.opts.under();
    drawWin(this.x, this.y, this.w, this.h);
    this.options.forEach((o, i) => {
      text(o, this.x + 44, this.y + 14 + i * 42, { size: 30, color: i === this.sel ? UI.hi : UI.text });
      if (i === this.sel) drawCursor(this.x + 16, this.y + 20 + i * 42);
    });
  }
}

// Lista navegável genérica (usada em menus, lojas e batalha)
class ListView {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, w: 300, rowH: 40, visible: 8, sel: 0, top: 0, cols: 1 }, o);
    this.clampSel();
  }
  setItems(items) { this.items = items; this.clampSel(); }
  clampSel() { const n = this.items.length; if (this.sel >= n) this.sel = Math.max(0, n - 1); this.scroll(); }
  scroll() {
    const row = Math.floor(this.sel / this.cols), vis = this.visible;
    if (row < this.top) this.top = row;
    if (row >= this.top + vis) this.top = row - vis + 1;
  }
  current() { return this.items[this.sel]; }
  draw() {
    const n = this.items.length;
    if (!n && this.empty) { text(this.empty, this.x + 16, this.y + 8, { size: 28, color: UI.dim }); return; }
    const colW = this.w / this.cols;
    for (let r = 0; r < this.visible; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = (this.top + r) * this.cols + c;
        if (i >= n) break;
        const x = this.x + c * colW, y = this.y + r * this.rowH;
        const sel = i === this.sel && this.focus !== false;
        if (sel) { ctx.fillStyle = 'rgba(255,198,92,0.13)'; ctx.fillRect(x + 2, y, colW - 4, this.rowH - 2); drawCursor(x + 4, y + this.rowH / 2 - 9); }
        const en = !this.enabled || this.enabled(this.items[i]);
        this.drawRow(this.items[i], x + 26, y, sel, en, colW - 30);
      }
    }
    const rows = Math.ceil(n / this.cols);
    if (this.top > 0) { ctx.fillStyle = UI.hi; ctx.beginPath(); ctx.moveTo(this.x + this.w - 20, this.y - 2); ctx.lineTo(this.x + this.w - 10, this.y - 12); ctx.lineTo(this.x + this.w, this.y - 2); ctx.fill(); }
    if (this.top + this.visible < rows) drawDownArrow(this.x + this.w - 10, this.y + this.visible * this.rowH - 4);
  }
}
// navegação com volta circular; retorna 'ok' | 'cancel' | null
ListView.prototype.handle = function () {
  const n = this.items.length;
  if (n) {
    const c = this.cols;
    let d = 0;
    if (Input.rep('up')) d = -c; else if (Input.rep('down')) d = c;
    else if (c > 1 && Input.rep('left')) d = -1; else if (c > 1 && Input.rep('right')) d = 1;
    if (d) {
      let s = this.sel + d;
      if (s < 0) s = c === 1 ? n - 1 : (this.sel % c) + Math.floor((n - 1 - (this.sel % c)) / c) * c;
      else if (s >= n) s = c === 1 ? 0 : this.sel % c;
      if (s >= n) s = n - 1;
      if (s !== this.sel) { this.sel = s; Audio2.sfx('cursor'); this.scroll(); }
    }
  }
  if (Input.ok()) {
    if (!n) { Audio2.sfx('buzz'); return null; }
    if (this.enabled && !this.enabled(this.current())) { Audio2.sfx('buzz'); return null; }
    Audio2.sfx('ok'); return 'ok';
  }
  if (Input.cancel()) { Audio2.sfx('cancel'); return 'cancel'; }
  return null;
};

// helpers de promessa
function showMessage(speaker, txt, opts) { const m = new MessageBox(speaker, txt, opts); G.push(m); return m.promise; }
function showChoice(options, opts) { const c = new ChoiceBox(options, opts); G.push(c); return c.promise; }

// pequeno desenho de ícone de item escalado
function drawIcon(id, x, y, scale = 2) {
  const info = State.itemInfo(id);
  if (!info || !info.icon) return;
  const cv = Icons.get(info.icon[0], info.icon[1]);
  ctx.drawImage(cv, x, y, 16 * scale, 16 * scale);
}
