'use strict';
// Base de arte em pixel (compartilhada com O Farol de Cinzas)
// ============================================================
//  Arte procedural em pixel: tiles, personagens, monstros, ícones
//  Tudo é gerado por código em resolução baixa e ampliado sem suavização.
// ============================================================

class PixelArt {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; }
  fill(c) { this.d.fill(c); return this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    return this;
  }
  circle(cx, cy, r, c) { return this.ellipse(cx, cy, r, r, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    return this;
  }
  thick(x0, y0, x1, y1, c, t = 2) { for (let i = 0; i < t; i++) for (let j = 0; j < t; j++) this.line(x0 + i, y0 + j, x1 + i, y1 + j, c); return this; }
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    for (const [x, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
      const px = x + 0.5, py = y + 0.5; let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
      }
      if (inside) this.set(x, y, c);
    }
    return this;
  }
  // contorno escuro automático em volta dos pixels preenchidos
  outline(c = '#1a1222', diag = false) {
    const src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x]) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx];
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1) || (diag && (n(x - 1, y - 1) || n(x + 1, y + 1) || n(x + 1, y - 1) || n(x - 1, y + 1)))) this.d[y * this.w + x] = c;
    }
    return this;
  }
  // aplica sombreamento: escurece pixels de cor 'c' abaixo/à direita de um contorno
  map(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const c = this.d[y * this.w + x]; const r = fn(c, x, y); if (r !== undefined) this.d[y * this.w + x] = r; } return this; }
  flipX() { const p = new PixelArt(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x]; return p; }
  draw(other, ox, oy) { for (let y = 0; y < other.h; y++) for (let x = 0; x < other.w; x++) { const c = other.d[y * other.w + x]; if (c) this.set(ox + x, oy + y, c); } return this; }
  toCanvas() {
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
    const c = cv.getContext('2d'); const img = c.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const col = this.d[i]; if (!col) continue;
      const [r, g, b, a] = hexRGBA(col);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = a;
    }
    c.putImageData(img, 0, 0); return cv;
  }
}

const RGB_CACHE = {};
function hexRGBA(h) {
  if (RGB_CACHE[h]) return RGB_CACHE[h];
  let r = 0, g = 0, b = 0, a = 255;
  if (h[0] === '#') {
    if (h.length === 4) { r = parseInt(h[1] + h[1], 16); g = parseInt(h[2] + h[2], 16); b = parseInt(h[3] + h[3], 16); }
    else { r = parseInt(h.slice(1, 3), 16); g = parseInt(h.slice(3, 5), 16); b = parseInt(h.slice(5, 7), 16); if (h.length === 9) a = parseInt(h.slice(7, 9), 16); }
  }
  return (RGB_CACHE[h] = [r, g, b, a]);
}
function shade(h, amt) { // amt -1..1
  const [r, g, b] = hexRGBA(h);
  const f = v => U.clamp(Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)), 0, 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function mix(a, b, t) {
  const A = hexRGBA(a), B = hexRGBA(b);
  const f = i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0');
  return '#' + f(0) + f(1) + f(2);
}
const OUT = '#1a1222';

// ============================================================
//  PERSONAGENS (humanoides paramétricos 16x16)
// ============================================================
const SKIN = { claro: '#f2c9a0', medio: '#d9a273', moreno: '#a8704a', escuro: '#7a4a30', palido: '#d8d4e8' };

function humanoid(o, dir, frame) {
  const p = new PixelArt(16, 16);
  const skin = o.skin || SKIN.claro, hair = o.hair || '#5a3a20', shirt = o.shirt || '#3f6fb0', pants = o.pants || '#4a3a30', shoes = o.shoes || '#2a1e18';
  const hairD = shade(hair, -0.3), shirtD = shade(shirt, -0.3), shirtL = shade(shirt, 0.2);
  const side = dir === 'left' || dir === 'right';
  const bob = frame === 0 ? 0 : 0;
  // pernas / pés
  const legY = 13;
  if (o.dress) {
    const dc = o.dress, dd = shade(dc, -0.3);
    p.rect(5, 10, 6, 3, dc); p.rect(4, 12, 8, 2, dc); p.rect(4, 13, 8, 1, dd);
    if (frame === 1) { p.rect(5, 14, 2, 1, shoes); p.rect(9, 14, 2, 2, shoes); }
    else if (frame === 2) { p.rect(5, 14, 2, 2, shoes); p.rect(9, 14, 2, 1, shoes); }
    else { p.rect(5, 14, 2, 2, shoes); p.rect(9, 14, 2, 2, shoes); }
  } else if (!side) {
    const lL = frame === 1 ? 1 : 2, rL = frame === 2 ? 1 : 2;
    p.rect(5, legY, 2, lL, pants); p.rect(9, legY, 2, rL, pants); p.rect(7, legY, 2, 1, pants);
    p.rect(5, legY + lL, 2, 1, shoes); p.rect(9, legY + rL, 2, 1, shoes);
  } else {
    if (frame === 0) { p.rect(6, legY, 4, 2, pants); p.rect(6, 15, 2, 1, shoes); p.rect(8, 15, 2, 1, shoes); }
    else if (frame === 1) { p.rect(5, legY, 2, 2, pants); p.rect(9, legY, 2, 2, pants); p.rect(7, legY, 2, 1, pants); p.rect(4, 15, 3, 1, shoes); p.rect(9, 15, 3, 1, shoes); }
    else { p.rect(6, legY, 4, 2, pants); p.rect(5, 15, 3, 1, shoes); p.rect(8, 15, 2, 1, shoes); }
  }
  // corpo
  if (!o.dress) { p.rect(5, 9, 6, 4, shirt); p.rect(5, 12, 6, 1, o.belt || shirtD); }
  else { p.rect(5, 9, 6, 2, o.dress); }
  if (o.apron) p.rect(6, 10, 4, 4, o.apron);
  // braços
  const armC = o.dress ? o.dress : shirt;
  if (!side) {
    const aL = frame === 1 ? -1 : 0, aR = frame === 2 ? -1 : 0;
    p.rect(4, 9 + aL, 1, 3, armC); p.rect(11, 9 + aR, 1, 3, armC);
    p.set(4, 12 + aL, skin); p.set(11, 12 + aR, skin);
  } else {
    const sw = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    p.rect(7 + sw, 9, 2, 3, shade(armC, -0.15)); p.rect(7 + sw, 12, 2, 1, skin);
  }
  if (o.cape) { const cc = o.cape; if (dir === 'up') p.rect(4, 9, 8, 6, cc); else if (!side) { p.rect(4, 9, 1, 5, cc); p.rect(11, 9, 1, 5, cc); } else p.rect(dir === 'left' ? 9 : 4, 9, 3, 5, cc); }
  // cabeça
  if (dir === 'down') {
    p.rect(4, 2, 8, 7, skin);
    p.rect(4, 8, 8, 1, shade(skin, -0.12));
    p.set(6, 5, '#1a1424'); p.set(9, 5, '#1a1424'); p.set(6, 6, '#1a1424'); p.set(9, 6, '#1a1424');
    if (o.blush) { p.set(5, 7, '#f08a8a'); p.set(10, 7, '#f08a8a'); }
  } else if (dir === 'up') {
    p.rect(4, 2, 8, 7, skin);
  } else {
    p.rect(4, 2, 8, 7, skin);
    p.set(5, 5, '#1a1424'); p.set(5, 6, '#1a1424');
    p.set(3, 6, skin);
  }
  // cabelo
  const hs = o.hairStyle || 'short';
  const H = (x, y, w, h) => p.rect(x, y, w, h, hair);
  if (hs === 'bald') {
    if (dir !== 'down') H(dir === 'left' ? 9 : dir === 'right' ? 4 : 4, 4, dir === 'up' ? 8 : 3, 3);
    else { H(4, 4, 1, 3); H(11, 4, 1, 3); }
    p.rect(5, 1, 6, 1, skin); p.set(6, 2, shade(skin, 0.2));
  } else {
    H(4, 1, 8, 2); H(3, 2, 10, 1);
    if (dir === 'down') { H(4, 3, 8, 1); H(3, 3, 1, 4); H(12, 3, 1, 4); if (hs === 'spiky') { p.set(5, 4, hair); p.set(9, 4, hair); p.set(4, 0, hair); p.set(8, 0, hair); p.set(11, 0, hair); } else p.set(5, 4, hair); }
    else if (dir === 'up') { H(3, 2, 10, 6); p.rect(4, 7, 8, 1, hairD); }
    else { const back = dir === 'left' ? 8 : 3; H(back, 2, 5, 5); H(4, 3, 8, 1); p.rect(dir === 'left' ? 12 : 3, 3, 1, 4, hair); if (dir === 'left') { p.set(4, 4, hair); } else { p.set(11, 4, hair); } }
    if (hs === 'long') { if (dir === 'down') { H(3, 7, 1, 4); H(12, 7, 1, 4); } else if (dir === 'up') H(3, 8, 10, 3); else H(dir === 'left' ? 10 : 3, 7, 3, 4); }
    if (hs === 'ponytail') { if (dir === 'up') H(7, 8, 2, 3); else if (side) H(dir === 'left' ? 12 : 2, 4, 2, 4); }
    if (hs === 'bun') { p.circle(8, 0.8, 2, hair); }
    p.rect(4, 1, 8, 1, shade(hair, 0.15));
  }
  if (o.beard) { const bc = o.beardColor || hair; if (dir === 'down') { p.rect(4, 7, 8, 2, bc); p.rect(5, 9, 6, 1, bc); p.set(7, 7, skin); p.set(8, 7, skin); } else if (side) { p.rect(dir === 'left' ? 3 : 8, 7, 5, 2, bc); } }
  if (o.hat) {
    const hc = o.hat;
    if (o.hatType === 'hood') { p.rect(3, 0, 10, 3, hc); if (dir !== 'down') p.rect(3, 2, 10, 7, hc); else { p.rect(3, 2, 1, 7, hc); p.rect(12, 2, 1, 7, hc); } }
    else if (o.hatType === 'helmet') { p.rect(3, 0, 10, 3, hc); p.rect(3, 3, 10, 1, shade(hc, -0.3)); p.rect(7, 0, 2, 1, '#ffe08a'); }
    else if (o.hatType === 'witch') { p.rect(2, 2, 12, 1, hc); p.poly([[4, 2], [12, 2], [9, -3], [8, -3]], hc); p.rect(4, 1, 8, 1, shade(hc, 0.2)); }
    else { p.rect(3, 0, 10, 3, hc); p.rect(dir === 'left' ? 1 : dir === 'right' ? 4 : 2, 3, 12, 1, shade(hc, -0.25)); }
  }
  if (o.glasses && dir === 'down') { p.rect(5, 5, 2, 2, '#d0e8ff'); p.rect(9, 5, 2, 2, '#d0e8ff'); p.rect(7, 5, 2, 1, '#333'); }
  p.outline(OUT);
  return p;
}


// ============================================================
//  MONSTROS (arte procedural por tipo)
// ============================================================
function eyes(p, x, y, gap, col = '#1a1424', glint = '#ffffff', size = 1) {
  for (const ex of [x, x + gap]) { p.rect(ex, y, size + 1, size + 1, col); if (glint) p.set(ex, y, glint); }
}

const MONSTER_ART = {
  blob(o) { // gosma
    const s = o.size || 24, p = new PixelArt(s, s), c = o.c || '#5ad06a';
    const cx = s / 2, base = s - 3;
    p.ellipse(cx, base - s * 0.28, s * 0.42, s * 0.34, shade(c, -0.3));
    p.ellipse(cx - 0.5, base - s * 0.3, s * 0.38, s * 0.3, c);
    p.rect(Math.round(cx - s * 0.42), base - 3, Math.round(s * 0.84), 3, shade(c, -0.3));
    p.ellipse(cx - s * 0.15, base - s * 0.45, s * 0.12, s * 0.08, shade(c, 0.5));
    if (o.crystal) { p.poly([[cx - 4, base - s * 0.55], [cx - 1, base - s * 0.85], [cx + 1, base - s * 0.55]], '#bff0ff'); p.poly([[cx + 2, base - s * 0.5], [cx + 5, base - s * 0.72], [cx + 5, base - s * 0.45]], '#8fd8ff'); }
    eyes(p, cx - 5, base - s * 0.32, 8, '#1a1424', '#ffffff', 1);
    p.rect(cx - 2, base - s * 0.15, 4, 1, shade(c, -0.5));
    return p.outline(OUT);
  },
  wisp(o) { // fiapo de névoa / lume errante
    const s = o.size || 22, p = new PixelArt(s, s), c = o.c || '#b8c4e0';
    const cx = s / 2;
    p.poly([[cx - 6, s * 0.55], [cx, 2], [cx + 6, s * 0.55]], shade(c, -0.15));
    p.ellipse(cx, s * 0.6, 7, 6, c);
    p.poly([[cx - 6, s * 0.65], [cx - 3, s - 2], [cx, s * 0.75], [cx + 3, s - 1], [cx + 6, s * 0.65]], c);
    p.ellipse(cx - 1, s * 0.5, 3.5, 3, shade(c, 0.45));
    eyes(p, cx - 4, s * 0.55, 6, o.eye || '#1a1424', null, 1);
    return p.outline(o.out || OUT);
  },
  beast(o) { // quadrúpede: rato, javali, lobo, iéti...
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#7a6a5a', d = shade(c, -0.3), l = shade(c, 0.25);
    const by = s * 0.6, bl = s * (o.long || 0.3);
    // cauda
    if (o.tail) p.thick(s * 0.5 + bl, by - 2, s - 2, by - s * 0.25, o.tailC || c, 2);
    // pernas
    const lh = o.legH || s * 0.2;
    for (const lx of [s * 0.5 - bl * 0.8, s * 0.5 - bl * 0.3, s * 0.5 + bl * 0.4, s * 0.5 + bl * 0.85]) p.rect(lx, by + 2, o.legW || 3, lh, d);
    // corpo
    p.ellipse(s * 0.55, by, bl, s * (o.bodyH || 0.18), c);
    p.ellipse(s * 0.5, by - 2, bl * 0.7, s * 0.08, l);
    if (o.mane) p.ellipse(s * 0.33, by - 3, s * 0.14, s * 0.18, o.mane);
    if (o.spikes) for (let i = 0; i < 5; i++) p.poly([[s * 0.35 + i * 3, by - s * 0.16], [s * 0.37 + i * 3, by - s * 0.27], [s * 0.42 + i * 3, by - s * 0.15]], o.spikes);
    // cabeça
    const hx = s * 0.22, hy = by - s * 0.12, hr = s * (o.head || 0.14);
    p.ellipse(hx, hy, hr * 1.1, hr, c);
    p.ellipse(hx - hr * 0.9, hy + hr * 0.3, hr * 0.6, hr * 0.45, o.snout || l);
    p.set(hx - hr * 1.5, hy + hr * 0.1, '#1a1424');
    // orelhas
    p.poly([[hx - 1, hy - hr * 0.7], [hx + 1, hy - hr * 1.8], [hx + 3, hy - hr * 0.6]], d);
    p.poly([[hx + 2, hy - hr * 0.6], [hx + 4, hy - hr * 1.6], [hx + 5, hy - hr * 0.4]], c);
    // olho
    p.rect(hx - hr * 0.4, hy - hr * 0.3, 2, 2, o.eye || '#ff3b30'); p.set(hx - hr * 0.4, hy - hr * 0.3, '#ffffff');
    if (o.tusk) { p.line(hx - hr * 1.2, hy + hr * 0.6, hx - hr * 1.5, hy - hr * 0.1, '#f4ecd8'); p.line(hx - hr * 1.1, hy + hr * 0.6, hx - hr * 1.4, hy, '#f4ecd8'); }
    if (o.horns) { p.thick(hx + 2, hy - hr * 0.9, hx + 6, hy - hr * 2, o.horns, 2); }
    if (o.frost) for (let i = 0; i < 8; i++) p.set(s * 0.3 + Math.random() * s * 0.5, by - 4 + Math.random() * 6, '#ffffff');
    if (o.fire) { for (let i = 0; i < 4; i++) p.poly([[s * 0.4 + i * 4, by - s * 0.15], [s * 0.42 + i * 4, by - s * 0.32 - (i % 2) * 3], [s * 0.48 + i * 4, by - s * 0.15]], i % 2 ? '#ffb347' : '#ff6a1f'); }
    return p.outline(OUT);
  },
  bird(o) {
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#3a3a4a', d = shade(c, -0.35), l = shade(c, 0.3);
    const cx = s / 2, cy = s * 0.55;
    // asas
    p.poly([[cx, cy - 2], [2, cy - s * 0.35], [4, cy - s * 0.05], [cx - 3, cy + 4]], d);
    p.poly([[cx, cy - 2], [s - 2, cy - s * 0.35], [s - 4, cy - s * 0.05], [cx + 3, cy + 4]], d);
    for (let i = 0; i < 4; i++) { p.line(4 + i * 3, cy - s * 0.28 + i * 2, cx - 2, cy, c); p.line(s - 5 - i * 3, cy - s * 0.28 + i * 2, cx + 2, cy, c); }
    // corpo
    p.ellipse(cx, cy + 2, s * 0.17, s * 0.22, c);
    p.ellipse(cx, cy + 4, s * 0.1, s * 0.13, o.belly || l);
    // cauda
    p.poly([[cx - 3, cy + s * 0.2], [cx, cy + s * 0.42], [cx + 3, cy + s * 0.2]], d);
    // cabeça
    p.circle(cx, cy - s * 0.2, s * 0.12, c);
    p.poly([[cx - 2, cy - s * 0.17], [cx, cy - s * 0.05], [cx + 2, cy - s * 0.17]], o.beak || '#e8b040');
    p.set(cx - 3, cy - s * 0.24, o.eye || '#ff3b30'); p.set(cx + 2, cy - s * 0.24, o.eye || '#ff3b30');
    if (o.crest) p.poly([[cx - 2, cy - s * 0.3], [cx, cy - s * 0.45], [cx + 2, cy - s * 0.3]], o.crest);
    if (o.lion) { p.ellipse(cx, cy + s * 0.25, s * 0.25, s * 0.12, o.lion); for (const lx of [cx - s * 0.2, cx + s * 0.15]) p.rect(lx, cy + s * 0.3, 3, s * 0.15, shade(o.lion, -0.3)); }
    if (o.talons) { p.rect(cx - 4, cy + s * 0.27, 2, 3, '#e8b040'); p.rect(cx + 2, cy + s * 0.27, 2, 3, '#e8b040'); }
    return p.outline(OUT);
  },
  mushroom(o) {
    const s = o.size || 24, p = new PixelArt(s, s), c = o.c || '#c84a3a';
    const cx = s / 2;
    p.rect(cx - 4, s * 0.5, 8, s * 0.42, '#efe4c8'); p.rect(cx - 4, s * 0.5, 2, s * 0.42, '#d8ccb0');
    p.ellipse(cx, s * 0.42, s * 0.44, s * 0.3, c);
    p.rect(Math.round(cx - s * 0.44), Math.round(s * 0.5), Math.round(s * 0.88), 2, shade(c, -0.35));
    for (const [x, y, r] of [[cx - 5, s * 0.3, 2], [cx + 4, s * 0.25, 1.6], [cx + 1, s * 0.42, 1.2], [cx - 8, s * 0.45, 1]]) p.circle(x, y, r, o.spots || '#fff6e0');
    eyes(p, cx - 3, s * 0.62, 4, '#1a1424', '#ffffff', 0);
    p.rect(cx - 1, s * 0.75, 2, 1, '#8a3a2a');
    p.rect(cx - 6, s * 0.92, 3, 2, '#d8ccb0'); p.rect(cx + 3, s * 0.92, 3, 2, '#d8ccb0');
    return p.outline(OUT);
  },
  insect(o) { // vespa
    const s = o.size || 24, p = new PixelArt(s, s), c = o.c || '#e8c030';
    const cx = s / 2, cy = s / 2;
    p.ellipse(cx - 2, cy - 6, 6, 3.5, 'rgba(210,235,255,0.8)'); p.ellipse(cx + 4, cy - 6, 6, 3.5, '#c8e0f0');
    p.ellipse(cx + 3, cy + 2, 6, 4.5, c);
    for (let i = 0; i < 3; i++) p.rect(cx + i * 3, cy - 2, 1, 9, '#2a2020');
    p.poly([[cx + 8, cy + 2], [cx + 12, cy + 5], [cx + 8, cy + 4]], '#2a2020');
    p.ellipse(cx - 4, cy + 1, 3, 3, '#3a3030');
    p.circle(cx - 8, cy, 3.5, c);
    p.rect(cx - 10, cy - 1, 2, 2, '#ff3b30');
    p.line(cx - 9, cy - 3, cx - 11, cy - 7, '#2a2020'); p.line(cx - 7, cy - 3, cx - 7, cy - 7, '#2a2020');
    for (let i = 0; i < 3; i++) p.line(cx - 4 + i * 2, cy + 3, cx - 6 + i * 2, cy + 7, '#2a2020');
    return p.outline(OUT);
  },
  plant(o) { // flor-boca
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#d8406a';
    const cx = s / 2;
    p.thick(cx, s - 2, cx - 2, s * 0.5, '#3f8a3a', 3);
    p.ellipse(cx - 7, s * 0.75, 6, 2.5, '#4fa048'); p.ellipse(cx + 7, s * 0.7, 6, 2.5, '#3f8a3a');
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; p.ellipse(cx - 2 + Math.cos(a) * 7, s * 0.35 + Math.sin(a) * 6, 4, 4, i % 2 ? c : shade(c, 0.2)); }
    p.ellipse(cx - 2, s * 0.35, 7, 6, shade(c, -0.25));
    p.ellipse(cx - 2, s * 0.38, 5.5, 3.5, '#3a0a14');
    for (let i = 0; i < 5; i++) { p.set(cx - 6 + i * 2, s * 0.38 - 3, '#ffffff'); p.set(cx - 5 + i * 2, s * 0.38 + 3, '#ffffff'); }
    if (o.vines) { p.line(cx + 2, s * 0.8, s - 2, s * 0.45, '#2f6a2a'); p.line(cx - 4, s * 0.85, 2, s * 0.55, '#2f6a2a'); }
    return p.outline(OUT);
  },
  bat(o) {
    const s = o.size || 24, p = new PixelArt(s, s), c = o.c || '#7a4a3a';
    const cx = s / 2, cy = s * 0.45;
    p.poly([[cx, cy], [1, cy - 6], [3, cy + 2], [6, cy], [8, cy + 4], [cx - 2, cy + 2]], shade(c, -0.25));
    p.poly([[cx, cy], [s - 1, cy - 6], [s - 3, cy + 2], [s - 6, cy], [s - 8, cy + 4], [cx + 2, cy + 2]], shade(c, -0.25));
    p.ellipse(cx, cy + 1, 4, 5, c);
    p.poly([[cx - 4, cy - 3], [cx - 3, cy - 8], [cx - 1, cy - 3]], c); p.poly([[cx + 4, cy - 3], [cx + 3, cy - 8], [cx + 1, cy - 3]], c);
    p.set(cx - 2, cy, '#ffd040'); p.set(cx + 1, cy, '#ffd040');
    p.set(cx - 1, cy + 3, '#ffffff'); p.set(cx + 1, cy + 3, '#ffffff');
    if (o.rust) for (let i = 0; i < 6; i++) p.set(cx - 8 + Math.random() * 16, cy - 3 + Math.random() * 6, '#c8703a');
    return p.outline(OUT);
  },
  golem(o) {
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#8a8290', d = shade(c, -0.3), l = shade(c, 0.25);
    const cx = s / 2;
    // pernas
    p.rect(cx - s * 0.25, s * 0.72, s * 0.17, s * 0.25, d); p.rect(cx + s * 0.08, s * 0.72, s * 0.17, s * 0.25, d);
    // tronco
    p.rect(cx - s * 0.3, s * 0.3, s * 0.6, s * 0.45, c);
    p.rect(cx - s * 0.3, s * 0.3, s * 0.6, 2, l);
    // braços
    p.rect(cx - s * 0.46, s * 0.33, s * 0.15, s * 0.42, d); p.rect(cx + s * 0.31, s * 0.33, s * 0.15, s * 0.42, d);
    p.rect(cx - s * 0.48, s * 0.68, s * 0.19, s * 0.12, c); p.rect(cx + s * 0.29, s * 0.68, s * 0.19, s * 0.12, c);
    // cabeça
    p.rect(cx - s * 0.15, s * 0.1, s * 0.3, s * 0.22, c); p.rect(cx - s * 0.15, s * 0.1, s * 0.3, 2, l);
    p.rect(cx - s * 0.1, s * 0.18, s * 0.07, s * 0.05, o.eye || '#ffb030'); p.rect(cx + s * 0.04, s * 0.18, s * 0.07, s * 0.05, o.eye || '#ffb030');
    // núcleo
    p.circle(cx, s * 0.5, s * 0.07, o.core || '#ff7a2a'); p.circle(cx, s * 0.5, s * 0.03, '#fff1a8');
    // rachaduras / musgo
    for (let i = 0; i < 4; i++) { const x = cx - s * 0.25 + Math.random() * s * 0.5, y = s * 0.35 + Math.random() * s * 0.3; p.line(x, y, x + 2, y + 3, d); }
    if (o.rust) for (let i = 0; i < 14; i++) p.set(cx - s * 0.3 + Math.random() * s * 0.6, s * 0.3 + Math.random() * s * 0.45, U.pick(['#c8703a', '#a0502a', '#e08a4a']));
    if (o.ice) { for (let i = 0; i < 4; i++) p.poly([[cx - s * 0.3 + i * s * 0.15, s * 0.3], [cx - s * 0.27 + i * s * 0.15, s * 0.18], [cx - s * 0.22 + i * s * 0.15, s * 0.3]], '#d8f4ff'); }
    if (o.moss) for (let i = 0; i < 10; i++) p.set(cx - s * 0.3 + Math.random() * s * 0.6, s * 0.3 + Math.random() * 3, '#5a9a3a');
    return p.outline(OUT);
  },
  ghost(o) {
    const s = o.size || 28, p = new PixelArt(s, s), c = o.c || '#9ab8d8';
    const cx = s / 2;
    p.ellipse(cx, s * 0.42, s * 0.3, s * 0.3, c);
    p.rect(cx - s * 0.3, s * 0.42, s * 0.6, s * 0.3, c);
    for (let i = 0; i < 4; i++) p.poly([[cx - s * 0.3 + i * s * 0.15, s * 0.7], [cx - s * 0.22 + i * s * 0.15, s * 0.92], [cx - s * 0.15 + i * s * 0.15, s * 0.7]], c);
    p.ellipse(cx - s * 0.1, s * 0.3, s * 0.08, s * 0.06, shade(c, 0.5));
    p.rect(cx - 5, s * 0.4, 3, 4, '#1a1424'); p.rect(cx + 2, s * 0.4, 3, 4, '#1a1424');
    p.ellipse(cx, s * 0.62, 3, 2, '#1a1424');
    if (o.helmet) { p.ellipse(cx, s * 0.18, s * 0.3, s * 0.12, '#e8c040'); p.rect(cx - s * 0.32, s * 0.2, s * 0.64, 2, '#a88a20'); p.circle(cx, s * 0.12, 2, '#fff6c8'); }
    if (o.pick) { p.thick(cx + s * 0.25, s * 0.45, cx + s * 0.45, s * 0.15, '#6b4526', 2); p.poly([[cx + s * 0.35, s * 0.1], [cx + s * 0.48, s * 0.18], [cx + s * 0.5, s * 0.08]], '#9aa0aa'); }
    return p.outline(o.out || '#2a3a5a');
  },
  frog(o) {
    const s = o.size || 28, p = new PixelArt(s, s), c = o.c || '#5a8a3a';
    const cx = s / 2;
    p.ellipse(cx, s * 0.65, s * 0.4, s * 0.25, c);
    p.ellipse(cx, s * 0.72, s * 0.28, s * 0.15, o.belly || '#d8d08a');
    p.circle(cx - s * 0.2, s * 0.4, s * 0.12, c); p.circle(cx + s * 0.2, s * 0.4, s * 0.12, c);
    p.circle(cx - s * 0.2, s * 0.4, s * 0.07, '#f0e070'); p.circle(cx + s * 0.2, s * 0.4, s * 0.07, '#f0e070');
    p.rect(cx - s * 0.22, s * 0.38, 2, 3, '#1a1424'); p.rect(cx + s * 0.18, s * 0.38, 2, 3, '#1a1424');
    p.line(cx - s * 0.25, s * 0.6, cx + s * 0.25, s * 0.6, shade(c, -0.45));
    p.ellipse(cx - s * 0.36, s * 0.85, s * 0.1, s * 0.05, shade(c, -0.2)); p.ellipse(cx + s * 0.36, s * 0.85, s * 0.1, s * 0.05, shade(c, -0.2));
    for (let i = 0; i < 6; i++) p.set(cx - s * 0.3 + Math.random() * s * 0.6, s * 0.5 + Math.random() * s * 0.15, shade(c, -0.3));
    return p.outline(OUT);
  },
  serpent(o) {
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#6a8a3a', l = o.belly || '#c8c070';
    for (let i = 0; i < 14; i++) { const t = i / 13; const x = s * 0.85 - t * s * 0.6, y = s * 0.85 - Math.sin(t * Math.PI * 1.5) * s * 0.2 - t * s * 0.35; const r = s * (0.09 - t * 0.02); p.circle(x, y, r, i % 2 ? c : shade(c, 0.1)); }
    const hx = s * 0.22, hy = s * 0.3;
    p.ellipse(hx, hy, s * 0.13, s * 0.1, c); p.ellipse(hx - s * 0.06, hy + s * 0.04, s * 0.08, s * 0.04, l);
    p.rect(hx - 1, hy - 3, 2, 2, o.eye || '#ffd040');
    p.line(hx - s * 0.13, hy + 2, hx - s * 0.2, hy + 4, '#e83a5a'); p.line(hx - s * 0.2, hy + 4, hx - s * 0.22, hy + 2, '#e83a5a');
    if (o.leech) { p.circle(hx - s * 0.1, hy, s * 0.06, '#3a0a14'); for (let i = 0; i < 5; i++) p.set(hx - s * 0.1 + Math.cos(i) * 3, hy + Math.sin(i) * 3, '#ffffff'); }
    return p.outline(OUT);
  },
  zombie(o) {
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#7a9a7a';
    const cx = s / 2;
    p.rect(cx - 5, s * 0.72, 4, s * 0.25, '#3a4a5a'); p.rect(cx + 1, s * 0.72, 4, s * 0.25, '#3a4a5a');
    p.rect(cx - 7, s * 0.38, 14, s * 0.36, '#4a5a6a');
    p.thick(cx - 7, s * 0.42, cx - 14, s * 0.55, c, 3); p.thick(cx + 6, s * 0.42, cx - 4, s * 0.58, c, 3);
    p.circle(cx, s * 0.27, 6, c);
    p.rect(cx - 4, s * 0.25, 2, 2, '#ffe08a'); p.rect(cx + 1, s * 0.25, 2, 2, '#ffe08a');
    p.rect(cx - 2, s * 0.33, 4, 1, '#2a3a2a');
    for (let i = 0; i < 6; i++) p.line(cx - 6 + i * 2, s * 0.38, cx - 7 + i * 2, s * 0.38 + 4 + (i % 3) * 3, '#3f7a3a');
    p.line(cx - 4, s * 0.18, cx - 6, s * 0.28, '#3f7a3a');
    return p.outline(OUT);
  },
  knight(o) {
    const s = o.size || 32, p = new PixelArt(s, s), c = o.c || '#4a4a5e', l = shade(c, 0.3);
    const cx = s / 2;
    p.rect(cx - 6, s * 0.72, 5, s * 0.25, shade(c, -0.2)); p.rect(cx + 1, s * 0.72, 5, s * 0.25, shade(c, -0.2));
    p.rect(cx - 8, s * 0.36, 16, s * 0.38, c); p.rect(cx - 8, s * 0.36, 16, 2, l);
    p.ellipse(cx - 9, s * 0.38, 3.5, 3, l); p.ellipse(cx + 9, s * 0.38, 3.5, 3, l);
    p.rect(cx - 6, s * 0.08, 12, s * 0.28, c); p.rect(cx - 6, s * 0.08, 12, 2, l);
    p.rect(cx - 5, s * 0.2, 10, 2, '#0a0812'); p.set(cx - 3, s * 0.2, o.eye || '#c87aff'); p.set(cx + 2, s * 0.2, o.eye || '#c87aff');
    p.poly([[cx, s * 0.02], [cx + 2, s * 0.08], [cx - 2, s * 0.08]], o.plume || '#8a3ab0');
    // espada
    p.thick(cx + 12, s * 0.75, cx + 13, s * 0.15, '#c8c8d8', 2); p.rect(cx + 9, s * 0.72, 8, 2, '#8a6a3a');
    // escudo
    p.ellipse(cx - 11, s * 0.55, 5, 7, shade(c, -0.15)); p.rect(cx - 12, s * 0.48, 2, 10, o.eye || '#c87aff');
    // fumaça
    for (let i = 0; i < 6; i++) p.set(cx - 8 + Math.random() * 16, s * 0.36 + Math.random() * 3, '#2a1a3a');
    return p.outline(OUT);
  },
  eye(o) {
    const s = o.size || 28, p = new PixelArt(s, s), c = o.c || '#e8e0e8';
    const cx = s / 2, cy = s * 0.42;
    for (let i = 0; i < 5; i++) { const x = cx - 8 + i * 4; p.thick(x, cy + 6, x + Math.sin(i) * 3, s - 2, '#5a2a6a', 2); }
    p.circle(cx, cy, s * 0.32, shade(c, -0.15)); p.circle(cx - 1, cy - 1, s * 0.3, c);
    for (let i = 0; i < 5; i++) { const a = i * 1.3; p.line(cx + Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.28, cx + Math.cos(a) * s * 0.15, cy + Math.sin(a) * s * 0.15, '#d84a5a'); }
    p.circle(cx, cy, s * 0.15, o.iris || '#8a3ab0'); p.circle(cx, cy, s * 0.07, '#0a0812'); p.set(cx - 2, cy - 2, '#ffffff');
    return p.outline(OUT);
  },
  tree(o) { // Raiz-Mãe
    const s = o.size || 64, p = new PixelArt(s, s), c = o.c || '#5a4030', d = shade(c, -0.35), l = shade(c, 0.2);
    const cx = s / 2;
    // raízes
    for (let i = 0; i < 6; i++) p.thick(cx - 6 + i * 2.4, s * 0.85, cx - s * 0.45 + i * s * 0.18, s - 2, d, 3);
    // tronco
    p.poly([[cx - s * 0.2, s * 0.92], [cx - s * 0.13, s * 0.3], [cx + s * 0.13, s * 0.3], [cx + s * 0.2, s * 0.92]], c);
    for (let i = 0; i < 5; i++) p.line(cx - s * 0.12 + i * s * 0.06, s * 0.35, cx - s * 0.14 + i * s * 0.07, s * 0.9, d);
    p.line(cx - s * 0.12, s * 0.3, cx - s * 0.15, s * 0.9, l);
    // copa
    for (const [x, y, r] of [[cx, s * 0.2, s * 0.22], [cx - s * 0.22, s * 0.28, s * 0.16], [cx + s * 0.22, s * 0.27, s * 0.17], [cx - s * 0.1, s * 0.08, s * 0.12], [cx + s * 0.12, s * 0.1, s * 0.13]]) { p.circle(x, y, r, o.leaf ? shade(o.leaf, -0.3) : '#2a3a1e'); p.circle(x - 1, y - 1, r * 0.85, o.leaf || '#3a5a28'); }
    for (let i = 0; i < 18; i++) p.set(cx - s * 0.35 + Math.random() * s * 0.7, Math.random() * s * 0.4, '#8a3ab0');
    // rosto
    p.ellipse(cx - s * 0.06, s * 0.5, s * 0.04, s * 0.05, '#0a0812'); p.ellipse(cx + s * 0.06, s * 0.5, s * 0.04, s * 0.05, '#0a0812');
    p.set(cx - s * 0.06, s * 0.5, '#c87aff'); p.set(cx + s * 0.06, s * 0.5, '#c87aff');
    p.ellipse(cx, s * 0.65, s * 0.08, s * 0.06, '#0a0812');
    for (let i = 0; i < 4; i++) p.set(cx - s * 0.05 + i * 3, s * 0.61, '#d8ccb0');
    // galhos-braço
    p.thick(cx - s * 0.13, s * 0.45, cx - s * 0.42, s * 0.55, c, 3); p.thick(cx - s * 0.42, s * 0.55, cx - s * 0.47, s * 0.68, c, 2);
    p.thick(cx + s * 0.13, s * 0.45, cx + s * 0.42, s * 0.52, c, 3); p.thick(cx + s * 0.42, s * 0.52, cx + s * 0.46, s * 0.64, c, 2);
    return p.outline(OUT);
  },
  hydraHead(o) {
    const s = o.size || 40, p = new PixelArt(s, s), c = o.c || '#4a6a4a', l = o.belly || '#a8b080';
    for (let i = 0; i < 12; i++) { const t = i / 11; p.circle(s * 0.7 - Math.sin(t * 2) * s * 0.1, s - 4 - t * s * 0.55, s * 0.09, i % 2 ? c : shade(c, 0.1)); p.set(s * 0.64 - Math.sin(t * 2) * s * 0.1, s - 4 - t * s * 0.55, l); }
    const hx = s * 0.45, hy = s * 0.3;
    p.ellipse(hx, hy, s * 0.2, s * 0.13, c);
    p.ellipse(hx - s * 0.12, hy + s * 0.06, s * 0.12, s * 0.05, '#3a0a14');
    for (let i = 0; i < 4; i++) { p.set(hx - s * 0.2 + i * 3, hy + s * 0.03, '#ffffff'); }
    p.rect(hx, hy - s * 0.07, 3, 2, o.eye || '#ffd040');
    for (let i = 0; i < 3; i++) p.poly([[hx + i * 3, hy - s * 0.1], [hx + 2 + i * 3, hy - s * 0.22], [hx + 3 + i * 3, hy - s * 0.09]], o.fin || '#8a3ab0');
    return p.outline(OUT);
  },
  hydraBody(o) {
    const s = o.size || 56, p = new PixelArt(s, s), c = o.c || '#3a5a3a';
    const cx = s / 2;
    p.ellipse(cx, s * 0.7, s * 0.45, s * 0.25, shade(c, -0.3));
    p.ellipse(cx, s * 0.68, s * 0.42, s * 0.22, c);
    for (let i = 0; i < 5; i++) p.poly([[cx - s * 0.3 + i * s * 0.13, s * 0.5], [cx - s * 0.26 + i * s * 0.13, s * 0.35], [cx - s * 0.2 + i * s * 0.13, s * 0.5]], '#8a3ab0');
    for (let i = 0; i < 3; i++) p.thick(cx - s * 0.12 + i * s * 0.12, s * 0.5, cx - s * 0.1 + i * s * 0.12, s * 0.2, c, 4);
    p.circle(cx, s * 0.2, s * 0.11, c); p.rect(cx - 4, s * 0.17, 3, 3, '#ffd040'); p.rect(cx + 2, s * 0.17, 3, 3, '#ffd040');
    p.ellipse(cx, s * 0.27, s * 0.06, s * 0.03, '#3a0a14');
    for (let i = 0; i < 20; i++) p.set(cx - s * 0.4 + Math.random() * s * 0.8, s * 0.6 + Math.random() * s * 0.2, shade(c, -0.4));
    p.ellipse(cx, s * 0.92, s * 0.48, s * 0.06, '#2e4a3c');
    return p.outline(OUT);
  },
  keeper(o) { // Aurélio possuído
    const s = o.size || 40, p = new PixelArt(s, s);
    const cx = s / 2;
    p.poly([[cx - 12, s - 2], [cx - 8, s * 0.35], [cx + 8, s * 0.35], [cx + 12, s - 2]], '#2a1a3a');
    p.poly([[cx - 6, s - 2], [cx - 5, s * 0.4], [cx + 5, s * 0.4], [cx + 6, s - 2]], '#3a2a5a');
    p.rect(cx - 1, s * 0.42, 2, s * 0.5, '#5a3a7a');
    p.circle(cx, s * 0.25, 6, '#d8d4e8');
    p.rect(cx - 6, s * 0.29, 12, 6, '#e8e4f0'); p.rect(cx - 4, s * 0.35, 8, 4, '#e8e4f0');
    p.rect(cx - 3, s * 0.22, 2, 2, '#c87aff'); p.rect(cx + 2, s * 0.22, 2, 2, '#c87aff');
    p.rect(cx - 5, s * 0.15, 10, 2, '#bcb8cc');
    // lanterna negra
    p.thick(cx + 10, s * 0.45, cx + 14, s * 0.6, '#5a5060', 1);
    p.rect(cx + 11, s * 0.6, 7, 9, '#2a2a32'); p.rect(cx + 12, s * 0.62, 5, 6, '#7a3ab0'); p.rect(cx + 13, s * 0.64, 3, 3, '#e0b0ff');
    p.thick(cx + 6, s * 0.42, cx + 11, s * 0.6, '#3a2a5a', 2);
    p.thick(cx - 6, s * 0.42, cx - 12, s * 0.62, '#3a2a5a', 2);
    for (let i = 0; i < 16; i++) p.set(cx - 14 + Math.random() * 28, s * 0.3 + Math.random() * s * 0.6, U.pick(['#5a2a7a', '#3a1a4a']));
    return p.outline('#0a0612');
  },
  void(o) { // O Vazio
    const s = o.size || 72, p = new PixelArt(s, s), c = o.c || '#1a1028';
    const cx = s / 2;
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.33; p.poly([[cx + Math.cos(a) * s * 0.25, s * 0.42 + Math.sin(a) * s * 0.25], [cx + Math.cos(a) * s * 0.48, s * 0.42 + Math.sin(a) * s * 0.42], [cx + Math.cos(a + 0.12) * s * 0.25, s * 0.42 + Math.sin(a + 0.12) * s * 0.25]], i % 2 ? '#5a2a8a' : '#3a1a5a'); }
    p.ellipse(cx, s * 0.55, s * 0.36, s * 0.4, c);
    for (let i = 0; i < 6; i++) p.thick(cx - s * 0.3 + i * s * 0.12, s * 0.8, cx - s * 0.35 + i * s * 0.14 + Math.sin(i) * 4, s - 2, '#2a1a3a', 3);
    const eyesP = o.phase2 ? [[cx, s * 0.45, 7], [cx - 14, s * 0.35, 4], [cx + 14, s * 0.36, 4], [cx - 10, s * 0.6, 3], [cx + 11, s * 0.62, 3], [cx, s * 0.72, 3]] : [[cx, s * 0.48, 6], [cx - 12, s * 0.38, 3], [cx + 12, s * 0.4, 3]];
    for (const [x, y, r] of eyesP) { p.circle(x, y, r + 1, '#0a0612'); p.circle(x, y, r, o.phase2 ? '#ff5a3a' : '#c87aff'); p.circle(x, y, r * 0.45, '#0a0612'); p.set(x - 1, y - 1, '#ffffff'); }
    for (let i = 0; i < 40; i++) p.set(cx - s * 0.35 + Math.random() * s * 0.7, s * 0.2 + Math.random() * s * 0.7, U.pick(['#2a1a3a', '#3a2050', '#120a1c']));
    return p.outline('#000000');
  },
  guardian(o) { // Guardião Esquecido (superchefe)
    const s = o.size || 56, p = new PixelArt(s, s), c = '#8a8296', l = '#b0a8bc', d = '#5a5466';
    const cx = s / 2;
    p.rect(cx - 9, s * 0.7, 7, s * 0.27, d); p.rect(cx + 2, s * 0.7, 7, s * 0.27, d);
    p.rect(cx - 12, s * 0.32, 24, s * 0.4, c); p.rect(cx - 12, s * 0.32, 24, 2, l);
    p.ellipse(cx - 14, s * 0.35, 6, 5, l); p.ellipse(cx + 14, s * 0.35, 6, 5, l);
    p.rect(cx - 7, s * 0.08, 14, s * 0.24, c); p.rect(cx - 7, s * 0.08, 14, 2, l);
    p.rect(cx - 5, s * 0.17, 10, 3, '#1a1424'); p.rect(cx - 4, s * 0.17, 2, 2, '#ff9a3a'); p.rect(cx + 2, s * 0.17, 2, 2, '#ff9a3a');
    p.poly([[cx - 7, s * 0.08], [cx - 11, s * 0.0], [cx - 5, s * 0.06]], l); p.poly([[cx + 7, s * 0.08], [cx + 11, s * 0.0], [cx + 5, s * 0.06]], l);
    p.circle(cx, s * 0.5, 4, '#ff7a2a'); p.circle(cx, s * 0.5, 2, '#fff1a8');
    p.thick(cx + 18, s * 0.9, cx + 20, s * 0.1, '#ffb347', 3); p.thick(cx + 19, s * 0.9, cx + 20, s * 0.15, '#fff1a8', 1); p.rect(cx + 14, s * 0.72, 11, 3, '#6a5440');
    for (let i = 0; i < 8; i++) p.set(cx - 12 + Math.random() * 24, s * 0.32 + Math.random() * s * 0.4, '#5a9a3a');
    return p.outline(OUT);
  },
};

