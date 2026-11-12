'use strict';
// ============================================================
//  Vale dos Monstrinhos — engine básica (derivada de O Farol de Cinzas)
//  Canvas, entrada, pilha de cenas, temporizadores, texto, janelas
// ============================================================

const VIEW_W = 960, VIEW_H = 576;
const PX = 3;            // escala dos pixels (arte de 16px -> 48px)
const TS = 16 * PX;      // tamanho do tile na tela
const FONT = 'VT323, "Courier New", monospace';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------- utilidades ----------
const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  chance: p => Math.random() < p,
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
  weighted(list) { // [{w, ...}]
    const tot = list.reduce((s, e) => s + (e.w || 1), 0);
    let r = Math.random() * tot;
    for (const e of list) { r -= (e.w || 1); if (r <= 0) return e; }
    return list[list.length - 1];
  },
  // gerador pseudo-aleatório determinístico (para arte procedural)
  seeded(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  },
  hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  fmtTime(sec) {
    sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
  DIRS: { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] },
  OPP: { up: 'down', down: 'up', left: 'right', right: 'left' },
};

// ---------- entrada ----------
const Input = {
  held: {}, hit: {}, hold: {},
  keymap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', Space: 'ok', KeyJ: 'ok', NumpadEnter: 'ok',
    KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel', KeyK: 'cancel', KeyI: 'cancel',
    KeyQ: 'prev', KeyE: 'next', ShiftLeft: 'run', ShiftRight: 'run', KeyM: 'mute',
    Digit1: 's1', Digit2: 's2', Digit3: 's3', Digit4: 's4', Digit5: 's5', Digit6: 's6', Digit7: 's7', Digit8: 's8',
  },
  press(a) {
    if (!this.held[a]) { this.hit[a] = true; this.hold[a] = 0; }
    this.held[a] = true;
  },
  release(a) { this.held[a] = false; },
  endFrame() {
    this.hit = {};
    for (const a in this.held) if (this.held[a]) this.hold[a] = (this.hold[a] || 0) + 1;
  },
  ok() { return !!this.hit.ok; },
  cancel() { return !!this.hit.cancel; },
  // navegação de menu com repetição automática
  rep(a) {
    if (this.hit[a]) return true;
    const t = this.hold[a] || 0;
    return this.held[a] && t > 16 && (t - 16) % 5 === 0;
  },
  dirHeld() {
    // prioridade para a última direção pressionada
    let best = null, bt = 1e9;
    for (const d of ['up', 'down', 'left', 'right']) if (this.held[d] && (this.hold[d] || 0) < bt) { best = d; bt = this.hold[d] || 0; }
    return best;
  },
  clearAll() { this.held = {}; this.hit = {}; this.hold = {}; },
};

window.addEventListener('keydown', e => {
  const a = Input.keymap[e.code];
  if (!a) return;
  e.preventDefault();
  if (e.repeat) return;
  if (a === 'mute') { Audio2.toggleMute(); return; }
  Input.press(a);
  Audio2.unlock();
});
window.addEventListener('keyup', e => { const a = Input.keymap[e.code]; if (a) { e.preventDefault(); Input.release(a); } });
window.addEventListener('blur', () => Input.clearAll());

// controles de toque
function setupTouch() {
  const box = document.getElementById('touch');
  if (!box) return;
  const show = () => document.body.classList.add('touch-on');
  window.addEventListener('touchstart', show, { once: true, passive: true });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) show();
  box.querySelectorAll('[data-a]').forEach(btn => {
    const a = btn.dataset.a;
    const down = e => { e.preventDefault(); Audio2.unlock(); if (a === 'mute') { Audio2.toggleMute(); return; } Input.press(a); btn.classList.add('on'); };
    const up = e => { e.preventDefault(); Input.release(a); btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
  });
}

// ---------- jogo / cenas ----------
const G = {
  scenes: [], timers: [], frame: 0,
  fade: { a: 1, target: 0, speed: 0.05, res: null, color: '#000' },
  shakeT: 0, shakeI: 0, flashT: 0, flashC: '#fff',
  toasts: [],
  push(s) { this.scenes.push(s); if (s.enter) s.enter(); return s; },
  remove(s) { const i = this.scenes.indexOf(s); if (i >= 0) this.scenes.splice(i, 1); if (s.leave) s.leave(); },
  top() { return this.scenes[this.scenes.length - 1]; },
  replaceAll(s) { for (const sc of this.scenes.slice()) this.remove(sc); this.push(s); },
  wait(frames) { return new Promise(res => this.timers.push({ t: Math.max(1, frames | 0), res })); },
  fadeTo(a, frames = 20, color = '#000') {
    this.fade.target = a; this.fade.color = color;
    this.fade.speed = Math.abs(a - this.fade.a) / Math.max(1, frames);
    if (this.fade.speed === 0) return Promise.resolve();
    return new Promise(res => { this.fade.res = res; });
  },
  shake(frames = 15, intensity = 6) { this.shakeT = frames; this.shakeI = intensity; },
  flash(color = '#fff', frames = 8) { this.flashC = color; this.flashT = frames; this.flashMax = frames; },
  toast(text, color) { this.toasts.push({ text, color: color || '#f3ead7', t: 150 }); },

  update() {
    this.frame++;
    if (this.onTick) this.onTick();
    const top = this.top();
    if (top && top.update) top.update();
    // timers
    if (this.timers.length) {
      const done = [];
      this.timers = this.timers.filter(t => { if (--t.t <= 0) { done.push(t.res); return false; } return true; });
      done.forEach(r => r());
    }
    // fade
    const f = this.fade;
    if (f.a !== f.target) {
      if (f.a < f.target) f.a = Math.min(f.target, f.a + f.speed); else f.a = Math.max(f.target, f.a - f.speed);
      if (f.a === f.target && f.res) { const r = f.res; f.res = null; r(); }
    }
    if (this.shakeT > 0) this.shakeT--;
    if (this.flashT > 0) this.flashT--;
    this.toasts.forEach(t => t.t--);
    this.toasts = this.toasts.filter(t => t.t > 0);
  },

  draw() {
    ctx.save();
    ctx.fillStyle = '#05040a';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.shakeT > 0) ctx.translate(U.randi(-this.shakeI, this.shakeI), U.randi(-this.shakeI, this.shakeI));
    // desenha a partir da última cena opaca
    let start = 0;
    for (let i = this.scenes.length - 1; i >= 0; i--) if (this.scenes[i].opaque) { start = i; break; }
    for (let i = start; i < this.scenes.length; i++) { const s = this.scenes[i]; if (s.draw) s.draw(ctx); }
    ctx.restore();
    if (this.flashT > 0) {
      ctx.globalAlpha = this.flashT / (this.flashMax || 8) * 0.8;
      ctx.fillStyle = this.flashC; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1;
    }
    if (this.fade.a > 0) {
      ctx.globalAlpha = this.fade.a; ctx.fillStyle = this.fade.color;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1;
    }
    // avisos curtos (toasts)
    let ty = 70;
    for (const t of this.toasts) {
      const a = Math.min(1, t.t / 30);
      ctx.globalAlpha = a;
      ctx.font = `26px ${FONT}`;
      const w = ctx.measureText(t.text).width + 32;
      drawWin(VIEW_W - w - 16, ty, w, 40, { alpha: 0.9 });
      text(t.text, VIEW_W - w, ty + 8, { size: 26, color: t.color });
      ctx.globalAlpha = 1; ty += 46;
    }
  },
};

// ---------- texto ----------
const TEXT_CACHE = {};
function setFont(size) { ctx.font = `${size}px ${FONT}`; }
function text(str, x, y, o = {}) {
  const size = o.size || 28;
  setFont(size);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'top';
  if (o.shadow !== false) { ctx.fillStyle = o.shadowColor || 'rgba(0,0,0,0.75)'; ctx.fillText(str, x + 2, y + 2); }
  ctx.fillStyle = o.color || '#f3ead7';
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function textW(str, size = 28) { setFont(size); return ctx.measureText(str).width; }
// quebra de linha respeitando \n ; ignora '*' (marcador de destaque) na medição
function wrapText(str, maxW, size = 28) {
  setFont(size);
  const out = [];
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test.replace(/\*/g, '')).width > maxW && line) { out.push(line); line = w; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}
// texto com destaque: trechos entre *asteriscos* ficam em âmbar. 'limit' = nº de caracteres visíveis
function richText(line, x, y, o = {}, limit = Infinity) {
  const size = o.size || 28;
  setFont(size); ctx.textBaseline = 'top';
  let hi = false, cx = x, shown = 0;
  const parts = line.split('*');
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) hi = !hi;
    let seg = parts[i];
    if (shown + seg.length > limit) seg = seg.slice(0, Math.max(0, limit - shown));
    shown += parts[i].length;
    if (seg) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(seg, cx + 2, y + 2);
      ctx.fillStyle = hi ? (o.hiColor || '#ffc65c') : (o.color || '#f3ead7');
      ctx.fillText(seg, cx, y);
      cx += ctx.measureText(seg).width;
    }
    if (shown >= limit) break;
  }
}
function visibleLen(line) { return line.replace(/\*/g, '').length; }

// ---------- janelas ----------
const UI = {
  bg: 'rgba(16,14,30,0.94)', bg2: 'rgba(30,24,48,0.94)', border: '#d79b45', border2: '#5a3a1c',
  text: '#f3ead7', dim: '#8f88a6', hi: '#ffc65c', hp: '#5fd36a', mp: '#5aa8ff', bad: '#ff6363', good: '#7dff9c',
};
function drawWin(x, y, w, h, o = {}) {
  ctx.save();
  ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
  const c = 6;
  ctx.beginPath();
  ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath();
  const grd = ctx.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, o.bgTop || '#221c3a');
  grd.addColorStop(1, o.bgBot || '#0c0a18');
  ctx.fillStyle = grd; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = UI.border2; ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = o.border || UI.border; ctx.stroke();
  ctx.restore();
}
function drawBar(x, y, w, h, frac, color, back = 'rgba(0,0,0,0.6)') {
  frac = U.clamp(frac, 0, 1);
  ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, Math.round(w * frac), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, Math.round(w * frac), Math.max(1, h / 3 | 0));
}
function drawCursor(x, y) {
  const o = Math.sin(G.frame * 0.2) * 3;
  ctx.fillStyle = UI.hi;
  ctx.beginPath(); ctx.moveTo(x + o, y); ctx.lineTo(x + 14 + o, y + 9); ctx.lineTo(x + o, y + 18); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 2; ctx.stroke();
}
function drawDownArrow(x, y) {
  const o = Math.sin(G.frame * 0.15) * 3;
  ctx.fillStyle = UI.hi;
  ctx.beginPath(); ctx.moveTo(x - 8, y + o); ctx.lineTo(x + 8, y + o); ctx.lineTo(x, y + 10 + o); ctx.closePath(); ctx.fill();
}

