'use strict';
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
//  TILES
// ============================================================
const TILE_DEFS = {
  // chão
  '.': { name: 'grama' }, ',': { name: 'grama-flor' }, '"': { name: 'capim' }, 'F': { name: 'canteiro' },
  ':': { name: 'terra' }, ';': { name: 'areia' }, 's': { name: 'pedra' }, '_': { name: 'madeira' }, 'm': { name: 'tapete' },
  'o': { name: 'caverna' }, 'n': { name: 'trilho-h' }, 'u': { name: 'trilho-v' }, 'y': { name: 'lama' }, '%': { name: 'lodo', anim: 2, hurt: true },
  'S': { name: 'neve' }, 'I': { name: 'gelo', ice: true }, 'g': { name: 'piso-escuro' }, 'e': { name: 'brasa-piso', anim: 3 },
  '=': { name: 'ponte-h' }, '|': { name: 'ponte-v' }, '<': { name: 'escada-sobe' }, '>': { name: 'escada-desce' }, 'D': { name: 'porta' },
  // sólidos
  '~': { name: 'agua', solid: true, anim: 2 }, 'T': { name: 'arvore', solid: true, over: true }, 'P': { name: 'pinheiro', solid: true, over: true },
  'A': { name: 'pinheiro-neve', solid: true, over: true }, 'd': { name: 'arvore-morta', solid: true, over: true }, 'b': { name: 'arbusto', solid: true, over: true },
  'r': { name: 'rocha', solid: true, over: true }, '^': { name: 'penhasco', solid: true }, 'f': { name: 'cerca', solid: true, over: true },
  '#': { name: 'parede', solid: true }, 'H': { name: 'casa', solid: true }, 'W': { name: 'janela', solid: true }, 'R': { name: 'telhado', solid: true }, 'Q': { name: 'telhado-azul', solid: true },
  'B': { name: 'cama', solid: true, over: true }, 't': { name: 'mesa', solid: true, over: true }, 'k': { name: 'estante', solid: true }, 'c': { name: 'balcao', solid: true, over: true, counter: true },
  'x': { name: 'caixote', solid: true, over: true }, 'K': { name: 'barril', solid: true, over: true }, 'V': { name: 'vaso', solid: true, over: true },
  'C': { name: 'rocha-caverna', solid: true }, '*': { name: 'cristal', solid: true, over: true, anim: 2 }, 'G': { name: 'tijolo-escuro', solid: true }, 'v': { name: 'vazio', solid: true },
  'L': { name: 'farol', solid: true }, 'w': { name: 'poco', solid: true, over: true }, 'X': { name: 'lapide', solid: true, over: true }, 'M': { name: 'cogumelo', solid: true, over: true },
  'j': { name: 'fornalha', solid: true, over: true, anim: 3 }, 'q': { name: 'lareira', solid: true, anim: 3 }, 'h': { name: 'ponte-quebrada', solid: true },
  'E': { name: 'poste', solid: true, over: true, anim: 2 }, 'l': { name: 'vitoria-regia', solid: true }, 'z': { name: 'estatua', solid: true, over: true },
  'O': { name: 'pilar', solid: true, over: true }, 'Y': { name: 'placa', solid: true, over: true }, 'Z': { name: 'cadeira', solid: false, over: true },
};

const THEMES = {
  grass: { g: '#5c9e3e', gd: '#437f2f', gl: '#7cbb4f', water: '#3b7fd6', wd: '#2a5fb0', wl: '#8cc4ff', cliff: '#8f6a45', cliffd: '#6a4a2e', cliffl: '#b08a5e', tree: '#2f7a34', treed: '#1f5a27', treel: '#4fa048', rock: '#8e8a86' },
  forest: { g: '#3f7e36', gd: '#2d6029', gl: '#5c9a45', water: '#2f6fb0', wd: '#1f4f8a', wl: '#7fb5ee', cliff: '#6e553c', cliffd: '#4e3a28', cliffl: '#8e7252', tree: '#245e2c', treed: '#16421d', treel: '#3d8a3b', rock: '#7d7a76' },
  swamp: { g: '#52603a', gd: '#3e4a2b', gl: '#6a7a48', water: '#2e4a3c', wd: '#1f3329', wl: '#5f8a6e', cliff: '#4d4a3a', cliffd: '#353326', cliffl: '#66624c', tree: '#3d5a32', treed: '#2a4024', treel: '#557a42', rock: '#6a6a62' },
  snow: { g: '#e6edf5', gd: '#c3d1e2', gl: '#ffffff', water: '#4a86c8', wd: '#2f5f9c', wl: '#bfe1ff', cliff: '#8d9bb0', cliffd: '#66738a', cliffl: '#c9d4e3', tree: '#2d5a4a', treed: '#1d3d33', treel: '#467a64', rock: '#9aa3ae' },
  cave: { g: '#5e5668', gd: '#4c4456', gl: '#706878', water: '#264a7a', wd: '#183356', wl: '#5f8fc8', cliff: '#2c2434', cliffd: '#1a1422', cliffl: '#4a3e58', tree: '#2f5a34', treed: '#1f3d24', treel: '#457a48', rock: '#6c6472' },
  tower: { g: '#1f1929', gd: '#17121f', gl: '#2c2438', water: '#1a1030', wd: '#0f0820', wl: '#5a3f8a', cliff: '#4c4068', cliffd: '#2e2644', cliffl: '#6e5f92', tree: '#2f2a40', treed: '#1f1a2c', treel: '#453d5c', rock: '#5a5470' },
  indoor: { g: '#a0703f', gd: '#7a5230', gl: '#bb8a55', water: '#3b7fd6', wd: '#2a5fb0', wl: '#8cc4ff', cliff: '#8f6a45', cliffd: '#6a4a2e', cliffl: '#b08a5e', tree: '#2f7a34', treed: '#1f5a27', treel: '#4fa048', rock: '#8e8a86' },
};

const Tiles = {
  cache: {},
  get(ch, theme, variant = 0, frame = 0) {
    const key = ch + '|' + theme + '|' + variant + '|' + frame;
    let c = this.cache[key];
    if (!c) { c = this.cache[key] = this.make(ch, theme, variant, frame).toCanvas(); }
    return c;
  },
  make(ch, theme, variant, frame) {
    const T = THEMES[theme] || THEMES.grass;
    const R = U.seeded(U.hash(ch + theme) + variant * 7919 + 1);
    const p = new PixelArt(16, 16);
    const speck = (base, cols, n) => { p.fill(base); for (let i = 0; i < n; i++) p.set(R() * 16, R() * 16, cols[Math.floor(R() * cols.length)]); };
    const grass = () => {
      speck(T.g, [T.gd, T.gd, T.gl], 18);
      for (let i = 0; i < 3; i++) { const x = 1 + R() * 14 | 0, y = 2 + R() * 12 | 0; p.set(x, y, T.gd); p.set(x + 1, y - 1, T.gd); p.set(x - 1, y - 1, T.gd); }
    };
    switch (ch) {
      case '.': grass(); break;
      case ',': grass(); for (let i = 0; i < 3; i++) { const x = 2 + R() * 12 | 0, y = 2 + R() * 12 | 0, col = ['#ffe066', '#ff8fb1', '#ffffff', '#b59cff'][R() * 4 | 0]; p.set(x, y, col); p.set(x + 1, y, col); p.set(x, y + 1, col); p.set(x + 1, y + 1, shade(col, -0.3)); } break;
      case '"': grass(); for (let i = 0; i < 6; i++) { const x = 1 + R() * 13 | 0, y = 4 + R() * 11 | 0; p.line(x, y, x - 1, y - 3, T.gd); p.line(x + 1, y, x + 2, y - 3, shade(T.gd, -0.2)); p.set(x, y - 1, T.gl); } break;
      case 'F': grass(); for (let i = 0; i < 8; i++) { const x = 1 + R() * 13 | 0, y = 1 + R() * 13 | 0, col = ['#ff6b8a', '#ffd34d', '#ffffff', '#c58bff', '#ff9a3c'][R() * 5 | 0]; p.set(x, y, col); p.set(x + 1, y, col); p.set(x, y + 1, col); p.set(x + 1, y + 1, col); p.set(x, y + 2, T.gd); } break;
      case ':': speck('#b38b5a', ['#9c7548', '#c9a26f', '#8a653e'], 26); for (let i = 0; i < 2; i++) { const x = R() * 14 | 0, y = R() * 14 | 0; p.set(x, y, '#d8c09a'); p.set(x + 1, y, '#8a653e'); } break;
      case ';': speck('#e4d199', ['#d2bc80', '#f2e4b8', '#c8b070'], 24); break;
      case 's': { p.fill('#a39e95'); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const c = shade('#a39e95', (R() - 0.5) * 0.12); p.rect(i * 8 + (j ? 4 : 0) % 8, j * 8, 8, 8, c); } p.rect(0, 7, 16, 1, '#7d786f'); p.rect(0, 15, 16, 1, '#7d786f'); p.rect(7, 0, 1, 8, '#7d786f'); p.rect(3, 8, 1, 8, '#7d786f'); p.rect(11, 8, 1, 8, '#7d786f'); for (let i = 0; i < 5; i++) p.set(R() * 16, R() * 16, '#bdb8ae'); break; }
      case '_': { p.fill('#a5733f'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#7a5230'); const off = ((y / 4) % 2) * 8 + (R() * 3 | 0); p.rect(off % 16, y, 1, 3, '#7a5230'); p.rect(0, y, 16, 1, '#b8854f'); } for (let i = 0; i < 4; i++) p.set(R() * 16, R() * 16, '#8f6136'); break; }
      case 'm': { p.fill('#9c2f3a'); p.rect(0, 0, 16, 1, '#c9a04a'); p.rect(0, 15, 16, 1, '#c9a04a'); for (let i = 0; i < 16; i += 4) { p.set(i + 2, 4, '#c9a04a'); p.set(i + 1, 5, '#c9a04a'); p.set(i + 3, 5, '#c9a04a'); p.set(i + 2, 6, '#c9a04a'); p.set(i, 11, '#7a2230'); p.set(i + 2, 10, '#7a2230'); } break; }
      case 'o': speck(T.g, [T.gd, T.gl, T.gd], 22); break;
      case 'n': speck(T.g, [T.gd, T.gl], 14); for (let x = 1; x < 16; x += 4) p.rect(x, 3, 2, 10, '#5e4630'); p.rect(0, 4, 16, 1, '#9aa0aa'); p.rect(0, 11, 16, 1, '#9aa0aa'); p.rect(0, 5, 16, 1, '#5d6068'); p.rect(0, 12, 16, 1, '#5d6068'); break;
      case 'u': speck(T.g, [T.gd, T.gl], 14); for (let y = 1; y < 16; y += 4) p.rect(3, y, 10, 2, '#5e4630'); p.rect(4, 0, 1, 16, '#9aa0aa'); p.rect(11, 0, 1, 16, '#9aa0aa'); p.rect(5, 0, 1, 16, '#5d6068'); p.rect(12, 0, 1, 16, '#5d6068'); break;
      case 'y': speck('#5e4c33', ['#4c3d29', '#6e5a3e', '#433524'], 30); for (let i = 0; i < 2; i++) { const x = R() * 12 | 0, y = R() * 12 | 0; p.rect(x, y, 3, 1, '#7a6a52'); } break;
      case '%': { p.fill('#5a7a2c'); for (let i = 0; i < 18; i++) p.set(R() * 16, R() * 16, R() < 0.5 ? '#4a6622' : '#6d8e36'); const b = frame ? [[4, 5], [11, 10]] : [[9, 3], [3, 11]]; for (const [x, y] of b) { p.set(x, y, '#a8d060'); p.set(x + 1, y, '#a8d060'); p.set(x, y + 1, '#88b048'); } break; }
      case 'S': speck(T.g, [T.gd, T.gl, T.gd], 16); break;
      case 'I': { p.fill('#a6d6f0'); for (let i = 0; i < 3; i++) { const o = R() * 16 | 0; p.line(o, 0, o - 10, 15, '#d8f0ff'); } for (let i = 0; i < 2; i++) { const x = R() * 13 | 0, y = R() * 13 | 0; p.line(x, y, x + 3, y + 2, '#7fbde0'); } p.rect(0, 0, 16, 1, '#c8e8fa'); break; }
      case 'g': { p.fill(T.g); for (let y = 0; y < 16; y += 8) { p.rect(0, y + 7, 16, 1, T.gd); const off = (y / 8) % 2 ? 4 : 12; p.rect(off, y, 1, 7, T.gd); p.rect(0, y, 16, 1, T.gl); } for (let i = 0; i < 6; i++) p.set(R() * 16, R() * 16, T.gd); break; }
      case 'e': { p.fill('#2a1f2a'); for (let i = 0; i < 10; i++) p.set(R() * 16, R() * 16, '#3a2a36'); const glow = ['#ff7a2a', '#ffb347', '#ff5a1f'][frame % 3]; p.line(2, 3, 7, 8, glow); p.line(7, 8, 13, 6, glow); p.line(7, 8, 9, 14, glow); p.set(7, 8, '#ffe08a'); break; }
      case '=': { const W = THEMES[theme] || T; p.fill(W.water); p.rect(0, 2, 16, 12, '#a8794a'); for (let x = 0; x < 16; x += 4) p.rect(x + 3, 2, 1, 12, '#7a5230'); p.rect(0, 2, 16, 1, '#5e3f24'); p.rect(0, 13, 16, 1, '#5e3f24'); p.rect(0, 1, 16, 1, '#c9b18a'); p.rect(0, 14, 16, 1, '#c9b18a'); break; }
      case '|': { const W = THEMES[theme] || T; p.fill(W.water); p.rect(2, 0, 12, 16, '#a8794a'); for (let y = 0; y < 16; y += 4) p.rect(2, y + 3, 12, 1, '#7a5230'); p.rect(2, 0, 1, 16, '#5e3f24'); p.rect(13, 0, 1, 16, '#5e3f24'); p.rect(1, 0, 1, 16, '#c9b18a'); p.rect(14, 0, 1, 16, '#c9b18a'); break; }
      case '<': { p.fill('#3a3040'); for (let i = 0; i < 4; i++) { const c = shade('#b8a890', -i * 0.15); p.rect(1, 12 - i * 4, 14, 4, c); p.rect(1, 12 - i * 4, 14, 1, shade(c, 0.2)); } p.rect(0, 0, 1, 16, '#2a2030'); p.rect(15, 0, 1, 16, '#2a2030'); break; }
      case '>': { p.fill('#141018'); for (let i = 0; i < 4; i++) { const c = shade('#8a7a68', -i * 0.22); p.rect(2, i * 4, 12, 3, c); p.rect(2, i * 4, 12, 1, shade(c, 0.2)); } p.rect(0, 0, 2, 16, '#5c5060'); p.rect(14, 0, 2, 16, '#5c5060'); break; }
      case 'D': { p.fill('#5c3a22'); p.rect(2, 1, 12, 15, '#8a5a32'); p.rect(2, 1, 12, 1, '#a8743f'); for (let x = 5; x < 14; x += 3) p.rect(x, 2, 1, 14, '#6e4527'); p.rect(11, 8, 2, 2, '#e8c45a'); p.rect(0, 0, 2, 16, '#4a2e1a'); p.rect(14, 0, 2, 16, '#4a2e1a'); break; }
      case '~': { p.fill(T.water); for (let i = 0; i < 8; i++) p.set(R() * 16, R() * 16, T.wd); const off = frame ? 3 : 0; for (let y = 3; y < 16; y += 6) { const x = (y * 5 + off) % 12; p.rect(x, y, 4, 1, T.wl); p.rect(x + 1, y - 1, 2, 1, shade(T.wl, 0.3)); } break; }
      case 'T': { const c = T.tree; p.rect(7, 11, 3, 5, '#6b4526'); p.rect(7, 11, 1, 5, '#4f321b'); p.ellipse(8, 7, 7, 6.5, T.treed); p.ellipse(7.5, 6.5, 6.5, 5.8, c); p.ellipse(6, 5, 3.5, 3, T.treel); for (let i = 0; i < 6; i++) p.set(3 + R() * 10, 3 + R() * 8, T.treed); p.set(5, 4, shade(T.treel, 0.3)); p.outline(OUT); break; }
      case 'P': case 'A': { const snow = ch === 'A'; p.rect(7, 12, 2, 4, '#5b3b20'); for (let i = 0; i < 3; i++) { const y = 1 + i * 4, w = 3 + i * 2; p.poly([[8, y], [8 + w + 0.5, y + 6], [8 - w - 0.5, y + 6]], i % 2 ? T.tree : shade(T.tree, 0.08)); p.line(8, y + 1, 8 + w - 1, y + 5, T.treed); if (snow) { p.line(8 - w + 1, y + 5, 8, y + 1, '#ffffff'); p.set(8, y, '#ffffff'); p.set(9, y + 1, '#e8f0ff'); } } p.outline(OUT); break; }
      case 'd': { p.rect(7, 6, 3, 10, '#5a5048'); p.rect(7, 6, 1, 10, '#433b34'); p.thick(8, 8, 3, 3, '#5a5048', 2); p.thick(9, 7, 13, 2, '#5a5048', 2); p.line(3, 3, 2, 1, '#5a5048'); p.line(13, 2, 14, 0, '#5a5048'); p.line(5, 5, 4, 7, '#5a5048'); p.set(12, 4, '#6e8a3a'); p.set(4, 4, '#6e8a3a'); p.outline(OUT); break; }
      case 'b': { p.ellipse(8, 10, 7, 5.5, T.treed); p.ellipse(7.5, 9.5, 6.3, 4.8, T.tree); p.ellipse(6, 8, 3, 2, T.treel); p.set(5, 11, '#e0475a'); p.set(10, 9, '#e0475a'); p.set(11, 12, '#e0475a'); p.outline(OUT); break; }
      case 'r': { const c = T.rock; p.ellipse(8, 10, 7, 5.5, shade(c, -0.25)); p.ellipse(7.5, 9.5, 6.5, 4.8, c); p.ellipse(6, 8, 3, 2, shade(c, 0.25)); p.line(9, 9, 11, 12, shade(c, -0.3)); if (theme === 'snow') { p.ellipse(7, 6.5, 5, 1.6, '#ffffff'); } p.outline(OUT); break; }
      case '^': { p.fill(T.cliff); for (let y = 2; y < 16; y += 5) { p.rect(0, y, 16, 1, T.cliffd); for (let i = 0; i < 3; i++) p.set(R() * 16, y + 1, T.cliffl); } for (let i = 0; i < 3; i++) { const x = R() * 16 | 0, y = R() * 14 | 0; p.line(x, y, x + 1, y + 3, T.cliffd); } if (theme === 'snow') { p.rect(0, 0, 16, 2, '#ffffff'); p.set(R() * 16, 2, '#ffffff'); p.set(R() * 16, 2, '#e8f0ff'); } else p.rect(0, 0, 16, 1, T.cliffl); break; }
      case 'f': { p.rect(1, 4, 2, 11, '#8a5a32'); p.rect(13, 4, 2, 11, '#8a5a32'); p.rect(0, 6, 16, 2, '#a8743f'); p.rect(0, 11, 16, 2, '#a8743f'); p.rect(1, 3, 2, 1, '#c99a60'); p.rect(13, 3, 2, 1, '#c99a60'); p.outline(OUT); break; }
      case '#': { p.fill('#6e4f38'); for (let x = 0; x < 16; x += 4) p.rect(x, 0, 1, 12, '#5a3e2b'); p.rect(0, 0, 16, 2, '#4a3324'); p.rect(0, 12, 16, 4, '#3f2b1e'); p.rect(0, 12, 16, 1, '#8a6a4c'); break; }
      case 'H': case 'W': { p.fill('#b67c4a'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#8a5a32'); p.rect(0, y, 16, 1, '#c99360'); } if (ch === 'W') { p.rect(3, 3, 10, 9, '#5a3a20'); p.rect(4, 4, 8, 7, '#ffd77a'); p.rect(4, 4, 8, 3, '#ffe9a8'); p.rect(7, 4, 2, 7, '#5a3a20'); p.rect(4, 7, 8, 1, '#5a3a20'); p.rect(2, 12, 12, 1, '#7a4a2a'); } break; }
      case 'R': case 'Q': { const base = ch === 'R' ? '#b5483a' : '#41639e'; p.fill(base); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, shade(base, -0.35)); const off = (y / 4) % 2 ? 2 : 0; for (let x = off; x < 16; x += 4) p.rect(x, y, 1, 3, shade(base, -0.2)); p.rect(0, y, 16, 1, shade(base, 0.18)); } break; }
      case 'B': { p.rect(1, 1, 14, 14, '#6e4527'); p.rect(2, 2, 12, 12, '#e8e0d0'); p.rect(3, 2, 10, 4, '#ffffff'); p.rect(2, 7, 12, 7, '#a83a4a'); p.rect(2, 7, 12, 1, shade('#a83a4a', 0.3)); p.outline(OUT); break; }
      case 't': { p.rect(1, 3, 14, 9, '#8a5a32'); p.rect(1, 3, 14, 2, '#b07a46'); p.rect(2, 12, 2, 3, '#5e3a1e'); p.rect(12, 12, 2, 3, '#5e3a1e'); if (variant % 3 === 0) { p.rect(6, 4, 4, 3, '#e8e0d0'); p.rect(7, 3, 2, 1, '#c84a3a'); } p.outline(OUT); break; }
      case 'k': { p.fill('#5e3a22'); for (let y = 1; y < 16; y += 5) { p.rect(1, y, 14, 4, '#2e1d12'); let x = 1; while (x < 15) { const w = 1 + (R() * 2 | 0); p.rect(x, y + (R() < 0.3 ? 1 : 0), w, 4, ['#b5483a', '#3f6fb0', '#4f9a4a', '#d8a84a', '#8a4ab0'][R() * 5 | 0]); x += w + (R() < 0.2 ? 1 : 0); } p.rect(0, y + 4, 16, 1, '#7a5230'); } break; }
      case 'c': { p.rect(0, 4, 16, 12, '#7a4f2c'); p.rect(0, 2, 16, 4, '#b07a46'); p.rect(0, 2, 16, 1, '#d4a06a'); for (let x = 3; x < 16; x += 5) p.rect(x, 7, 1, 9, '#5e3a1e'); break; }
      case 'x': { p.rect(2, 3, 12, 12, '#a8743f'); p.rect(2, 3, 12, 1, '#c99a60'); p.rect(2, 8, 12, 1, '#7a5230'); p.line(3, 4, 13, 14, '#7a5230'); p.outline(OUT); break; }
      case 'K': { p.ellipse(8, 9, 6, 6.5, '#8a5a32'); p.rect(2, 5, 12, 1, '#555a62'); p.rect(2, 12, 12, 1, '#555a62'); p.ellipse(8, 3.5, 5, 1.6, '#6e4527'); p.rect(5, 6, 1, 6, '#a8743f'); p.outline(OUT); break; }
      case 'V': { p.ellipse(8, 10, 5, 5, '#c0603a'); p.rect(6, 3, 4, 3, '#c0603a'); p.rect(5, 3, 6, 1, '#e08a5a'); p.ellipse(6.5, 9, 1.5, 2.5, '#e08a5a'); p.set(7, 2, '#4f9a4a'); p.set(8, 1, '#4f9a4a'); p.set(9, 2, '#4f9a4a'); p.outline(OUT); break; }
      case 'C': { p.fill(T.cliff); for (let i = 0; i < 5; i++) { const x = R() * 13 | 0, y = R() * 13 | 0; p.ellipse(x + 2, y + 2, 2.5, 2, T.cliffl); p.set(x + 3, y + 3, T.cliffd); } p.rect(0, 14, 16, 2, T.cliffd); p.rect(0, 0, 16, 1, T.cliffl); break; }
      case '*': { const g = frame ? '#9fe8ff' : '#7fd4ff'; p.poly([[5, 15], [3, 7], [6, 2], [8, 15]], '#4aa0e0'); p.poly([[8, 15], [9, 4], [12, 0], [13, 15]], '#5ab8f0'); p.poly([[10, 15], [13, 8], [15, 12], [14, 15]], '#3a80c0'); p.line(6, 4, 5, 12, g); p.line(11, 2, 10, 12, g); p.outline(OUT); break; }
      case 'G': { p.fill(T.cliff); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, T.cliffd); const off = (y / 4) % 2 ? 4 : 0; for (let x = off; x < 16; x += 8) p.rect(x, y, 1, 3, T.cliffd); p.rect(0, y, 16, 1, T.cliffl); } if (variant % 5 === 0) { p.rect(6, 5, 4, 5, '#7a3ab0'); p.rect(7, 6, 2, 3, '#c38aff'); } break; }
      case 'v': { p.fill('#07060c'); if (variant % 3 === 0) p.set(R() * 16, R() * 16, '#3a3060'); break; }
      case 'L': { const band = variant % 2; p.fill(band ? '#c8433a' : '#ece6da'); p.rect(0, 0, 16, 1, band ? '#e0625a' : '#ffffff'); p.rect(0, 15, 16, 1, band ? '#8e2c26' : '#c8c0b0'); for (let x = 0; x < 16; x += 8) p.rect(x, 0, 1, 16, band ? '#a8352e' : '#d2cabc'); break; }
      case 'w': { p.ellipse(8, 9, 7, 6, '#7d786f'); p.ellipse(8, 9, 5, 4, '#2a4a7a'); p.ellipse(7, 8, 2, 1, '#5a8ac8'); for (let a = 0; a < 6; a++) p.set(8 + Math.cos(a) * 6, 9 + Math.sin(a) * 5, '#a39e95'); p.rect(1, 1, 1, 8, '#6b4526'); p.rect(14, 1, 1, 8, '#6b4526'); p.rect(1, 1, 14, 1, '#8a5a32'); p.outline(OUT); break; }
      case 'X': { p.rect(4, 3, 8, 12, '#8a8a92'); p.ellipse(8, 4, 4, 3, '#8a8a92'); p.rect(5, 3, 1, 12, '#a8a8b0'); p.rect(7, 5, 2, 6, '#6a6a72'); p.rect(6, 7, 4, 1, '#6a6a72'); p.rect(3, 14, 10, 2, '#5a5048'); p.outline(OUT); break; }
      case 'M': { p.rect(6, 9, 4, 7, '#e8dcc0'); p.ellipse(8, 7, 7, 5, '#c83a3a'); p.ellipse(8, 9, 7, 2, '#8a2a2a'); p.set(5, 5, '#ffffff'); p.set(10, 4, '#ffffff'); p.set(11, 7, '#ffffff'); p.set(4, 7, '#ffffff'); p.outline(OUT); break; }
      case 'j': { p.rect(1, 2, 14, 14, '#6a646e'); p.rect(1, 2, 14, 2, '#8a848e'); p.rect(4, 7, 8, 7, '#1a1010'); const fc = ['#ff7a2a', '#ffb347', '#ff5a1f'][frame % 3]; p.rect(5, 10, 6, 4, fc); p.rect(6, 9 - (frame % 2), 4, 2, '#ffe08a'); for (let i = 0; i < 4; i++) p.set(2 + i * 4, 5, '#4a444e'); p.outline(OUT); break; }
      case 'q': { p.fill('#6a646e'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#4a444e'); } p.rect(3, 6, 10, 10, '#1a1010'); const fc = ['#ff7a2a', '#ffb347', '#ff5a1f'][frame % 3]; p.rect(4, 11, 8, 4, fc); p.rect(6, 9 - (frame % 2), 4, 3, '#ffe08a'); p.rect(4, 14, 8, 2, '#5a3a20'); p.rect(0, 0, 16, 2, '#8a848e'); break; }
      case 'h': { const W = THEMES[theme] || T; p.fill(W.water); for (let y = 3; y < 16; y += 6) p.rect((y * 3) % 12, y, 4, 1, W.wl); p.rect(1, 4, 3, 8, '#7a5230'); p.rect(11, 2, 3, 4, '#7a5230'); p.rect(9, 11, 5, 2, '#a8743f'); p.line(2, 4, 3, 2, '#5e3f24'); break; }
      case 'E': { p.rect(7, 4, 2, 12, '#3a3a42'); p.rect(5, 14, 6, 2, '#3a3a42'); p.rect(4, 0, 8, 5, '#2a2a32'); p.rect(5, 1, 6, 3, frame ? '#ffe08a' : '#ffcf5a'); p.outline(OUT); break; }
      case 'l': { const W = THEMES[theme] || T; p.fill(W.water); for (let y = 3; y < 16; y += 6) p.rect((y * 3) % 12, y, 4, 1, W.wl); p.ellipse(8, 8, 6, 5, '#4f8a3a'); p.poly([[8, 8], [14, 6], [14, 10]], W.water); p.set(6, 6, '#ff9ab8'); p.set(7, 6, '#ffc8da'); break; }
      case 'z': { p.rect(4, 12, 8, 4, '#7d786f'); p.rect(5, 4, 6, 8, '#a39e95'); p.circle(8, 4, 3, '#a39e95'); p.rect(6, 6, 1, 5, '#bdb8ae'); p.set(7, 3, '#5a5650'); p.set(9, 3, '#5a5650'); p.outline(OUT); break; }
      case 'O': { p.rect(4, 1, 8, 15, '#8a8296'); p.rect(4, 1, 2, 15, '#a59cb2'); p.rect(3, 0, 10, 2, '#a59cb2'); p.rect(3, 14, 10, 2, '#6a6276'); p.outline(OUT); break; }
      case 'Y': { p.rect(7, 9, 2, 7, '#6b4526'); p.rect(2, 2, 12, 8, '#a8743f'); p.rect(2, 2, 12, 1, '#c99a60'); p.rect(4, 4, 8, 1, '#5e3a1e'); p.rect(4, 6, 6, 1, '#5e3a1e'); p.outline(OUT); break; }
      case 'Z': { p.rect(4, 6, 8, 3, '#8a5a32'); p.rect(4, 1, 8, 5, '#a8743f'); p.rect(4, 9, 2, 5, '#5e3a1e'); p.rect(10, 9, 2, 5, '#5e3a1e'); p.outline(OUT); break; }
      default: p.fill('#ff00ff');
    }
    return p;
  },
};

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

// filhote com máscara de caveira (Tição) — 16x16
function pup(dir, frame, pal) {
  const P = pal || { fur: '#2c2a38', furL: '#4a475c', furD: '#1c1a26', skull: '#eeeadf', skullD: '#bdb6a8', eye: '#ff3b30', ear: '#6b5a86' };
  const p = new PixelArt(16, 16);
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  if (dir === 'left' || dir === 'right') {
    // cauda
    p.line(13, 8, 15, 4, P.fur); p.line(14, 8, 15, 5, P.fur); p.set(15, 3, P.furD);
    // corpo
    p.ellipse(9.5, 10.5, 5, 3, P.fur); p.ellipse(9, 9.8, 3.5, 1.5, P.furL);
    // pernas
    p.rect(5 + step, 12, 2, 3, P.furD); p.rect(11 - step, 12, 2, 3, P.furD); p.rect(8, 12, 2, 3 - (frame ? 1 : 0), P.fur);
    // juba
    p.ellipse(6, 9, 3, 2.5, P.furD);
    // orelha
    p.poly([[6, 1], [8.5, 0], [9, 4], [6, 4]], P.fur); p.set(7, 2, P.ear); p.set(7, 3, P.ear);
    // crânio
    p.ellipse(5.5, 5.5, 4.5, 3.8, P.skull);
    p.rect(0, 5, 4, 3, P.skull); p.rect(0, 7, 4, 1, P.skullD);
    p.set(0, 5, P.furD);
    p.rect(3, 4, 3, 3, '#2a2030'); p.set(4, 5, P.eye); p.set(3, 5, '#ff8a70');
    p.set(1, 8, '#ffffff'); p.set(3, 8, '#ffffff');
    p.line(6, 2, 7, 4, P.skullD);
  } else if (dir === 'down') {
    p.ellipse(8, 11.5, 5, 3, P.fur); p.ellipse(8, 10.5, 3, 1.4, P.furL);
    p.rect(4, 12 + (frame === 1 ? -1 : 0), 2, 3, P.furD); p.rect(10, 12 + (frame === 2 ? -1 : 0), 2, 3, P.furD);
    p.ellipse(8, 9.5, 5, 2.2, P.furD);
    p.poly([[2, 0], [5, 2], [4, 5], [2, 4]], P.fur); p.poly([[14, 0], [11, 2], [12, 5], [14, 4]], P.fur);
    p.set(3, 2, P.ear); p.set(13, 2, P.ear); p.set(3, 3, P.ear); p.set(13, 3, P.ear);
    p.ellipse(8, 5.5, 5, 4.2, P.skull);
    p.rect(5, 8, 6, 2, P.skull); p.rect(5, 9, 6, 1, P.skullD);
    p.rect(4, 4, 3, 3, '#2a2030'); p.rect(9, 4, 3, 3, '#2a2030');
    p.set(5, 5, P.eye); p.set(5, 4, '#ff8a70');
    p.set(7, 7, '#2a2030'); p.set(8, 7, '#2a2030');
    p.set(6, 10, '#ffffff'); p.set(9, 10, '#ffffff');
    p.line(8, 1, 9, 3, P.skullD);
  } else { // up
    p.line(8, 9, 8, 6, P.fur); p.line(9, 9, 10, 6, P.fur); // cauda
    p.ellipse(8, 11.5, 5, 3, P.fur);
    p.rect(4, 12 + (frame === 1 ? -1 : 0), 2, 3, P.furD); p.rect(10, 12 + (frame === 2 ? -1 : 0), 2, 3, P.furD);
    p.ellipse(8, 5.8, 4.8, 4, P.furD);
    p.ellipse(8, 4.5, 4.2, 3, P.skull); p.rect(4, 5, 8, 1, P.skullD);
    p.poly([[2, 0], [5, 2], [4, 5], [2, 4]], P.fur); p.poly([[14, 0], [11, 2], [12, 5], [14, 4]], P.fur);
    p.line(8, 9, 8, 5, P.fur); p.line(8, 6, 8, 2, P.fur);
  }
  p.outline(OUT);
  if (dir === 'right') return p.flipX();
  return p;
}

// gato / galinha / animais pequenos
function smallAnimal(kind, dir, frame) {
  const p = new PixelArt(16, 16);
  if (kind === 'gato') {
    const c = '#e08a3a', d = '#b0602a';
    p.ellipse(9, 11, 4.5, 2.6, c); p.line(13, 10, 15, 6, c); p.set(15, 5, d);
    p.circle(5, 8, 3, c); p.poly([[2, 4], [4, 6], [2, 7]], c); p.poly([[7, 4], [7, 7], [5, 6]], c);
    p.set(4, 8, '#1a1424'); p.set(6, 8, '#1a1424');
    p.rect(6 + (frame === 1 ? 1 : 0), 13, 1, 2, d); p.rect(11 - (frame === 1 ? 1 : 0), 13, 1, 2, d);
    for (let i = 0; i < 3; i++) p.set(8 + i * 2, 10, d);
  } else {
    const c = '#f4f0e6';
    p.ellipse(8, 10, 4.5, 3.5, c); p.circle(5, 6, 2.2, c); p.set(4, 3.5, '#e03a3a'); p.set(5, 3.5, '#e03a3a'); p.set(2, 6, '#f0a030'); p.set(4, 6, '#1a1424');
    p.rect(7, 13 + (frame === 1 ? 0 : 0), 1, 2, '#f0a030'); p.rect(9, 13, 1, 2 - (frame ? 1 : 0), '#f0a030'); p.set(11, 8, '#d8d0c0'); p.set(12, 7, '#d8d0c0');
  }
  p.outline(OUT);
  return dir === 'right' ? p.flipX() : p;
}

// Definições visuais de personagens (overworld + batalha)
const CHAR_LOOKS = {
  lia: { skin: SKIN.claro, hair: '#c4552a', hairStyle: 'ponytail', shirt: '#2f6f8f', pants: '#4a3a30', belt: '#7a4a20', cape: '#b5483a', blush: true },
  nara: { skin: SKIN.moreno, hair: '#2a1a14', hairStyle: 'long', dress: '#4f8a4a', shoes: '#4a2e1a', blush: true },
  bento: { skin: SKIN.medio, hair: '#3a2a1e', hairStyle: 'short', shirt: '#8a4a3a', pants: '#3a3a48', apron: '#6a5440', beard: true, beardColor: '#3a2a1e' },
  aurelio: { skin: SKIN.claro, hair: '#d8d4cc', hairStyle: 'bald', shirt: '#3a4a6a', pants: '#2a2a3a', beard: true, beardColor: '#e8e4dc', cape: '#2a3550' },
  aurelio_mal: { skin: SKIN.palido, hair: '#a8a4bc', hairStyle: 'bald', shirt: '#2a1f3a', pants: '#1a1426', beard: true, beardColor: '#bcb8cc', cape: '#3a1a4a' },
  prefeita: { skin: SKIN.escuro, hair: '#d8d4cc', hairStyle: 'bun', dress: '#7a3a8a', blush: false, glasses: true },
  mercador: { skin: SKIN.medio, hair: '#2a1a14', hairStyle: 'short', shirt: '#c8a040', pants: '#4a3a30', hat: '#6a3a2a', beard: true },
  menino: { skin: SKIN.medio, hair: '#5a3a20', hairStyle: 'spiky', shirt: '#d84a3a', pants: '#3a4a8a' },
  menina: { skin: SKIN.claro, hair: '#e8c45a', hairStyle: 'long', dress: '#e07aa0', blush: true },
  mulher: { skin: SKIN.moreno, hair: '#5a2a1a', hairStyle: 'bun', dress: '#3a7a8a' },
  velha: { skin: SKIN.claro, hair: '#d8d4cc', hairStyle: 'bun', dress: '#6a5a8a', glasses: true },
  homem: { skin: SKIN.escuro, hair: '#1a1414', hairStyle: 'short', shirt: '#5a8a4a', pants: '#4a3a30' },
  pescador: { skin: SKIN.medio, hair: '#8a7a6a', hairStyle: 'short', shirt: '#3a5a8a', pants: '#5a4a3a', hat: '#d8c060', beard: true, beardColor: '#a89a8a' },
  guarda: { skin: SKIN.medio, hair: '#3a2a1e', hairStyle: 'short', shirt: '#7a7a8a', pants: '#3a3a48', hat: '#9a9aaa', hatType: 'helmet' },
  mineiro: { skin: SKIN.medio, hair: '#3a2a1e', hairStyle: 'short', shirt: '#8a6a3a', pants: '#3a3a48', hat: '#e8c040', hatType: 'helmet', beard: true },
  pipo: { skin: SKIN.claro, hair: '#d8a040', hairStyle: 'spiky', shirt: '#4a7aaa', pants: '#5a4a3a', hat: '#e8c040', hatType: 'helmet' },
  barqueiro: { skin: SKIN.escuro, hair: '#d8d4cc', hairStyle: 'short', shirt: '#4a6a5a', pants: '#3a3a30', hat: '#5a4a3a', beard: true, beardColor: '#d8d4cc' },
  quiteria: { skin: SKIN.moreno, hair: '#a8a4a0', hairStyle: 'long', dress: '#3a4a2a', hat: '#2a2a3a', hatType: 'witch' },
  alpinista: { skin: SKIN.claro, hair: '#8a4a2a', hairStyle: 'short', shirt: '#c84a3a', pants: '#3a3a48', hat: '#3a6aaa', hatType: 'hood' },
  fantasma: { skin: '#cfe8ff', hair: '#a8c8e8', hairStyle: 'long', dress: '#9ab8d8', shoes: '#9ab8d8' },
  cida: { skin: SKIN.escuro, hair: '#2a1a14', hairStyle: 'bun', dress: '#d8a040', blush: true },
  monge: { skin: SKIN.medio, hair: '#2a1a14', hairStyle: 'bald', shirt: '#c87a2a', pants: '#c87a2a', cape: '#a85a1a' },
};

const Sprites = {
  cache: {},
  // retorna canvas 16x16 do personagem na direção/quadro
  char(id, dir = 'down', frame = 0) {
    const key = id + dir + frame;
    if (this.cache[key]) return this.cache[key];
    let p;
    if (id === 'ticao') p = pup(dir, frame);
    else if (id === 'gato' || id === 'galinha') p = smallAnimal(id, dir === 'right' ? 'right' : 'left', frame);
    else {
      const look = CHAR_LOOKS[id] || CHAR_LOOKS.homem;
      if (dir === 'right') p = humanoid(look, 'left', frame).flipX();
      else p = humanoid(look, dir, frame);
    }
    return (this.cache[key] = p.toCanvas());
  },
  obj(name, frame = 0) {
    const key = 'obj_' + name + frame;
    if (this.cache[key]) return this.cache[key];
    const p = new PixelArt(16, 16);
    switch (name) {
      case 'chest': case 'chest_open': {
        const open = name === 'chest_open';
        p.rect(1, 6, 14, 9, '#8a5a32'); p.rect(1, 6, 14, 1, '#b07a46');
        p.rect(1, 9, 14, 1, '#d8a84a'); p.rect(7, 8, 2, 3, '#e8c45a');
        if (open) { p.rect(1, 2, 14, 4, '#5e3a1e'); p.rect(2, 6, 12, 2, '#1a1010'); }
        else { p.rect(1, 3, 14, 4, '#a06838'); p.rect(1, 3, 14, 1, '#c99060'); p.rect(1, 6, 14, 1, '#d8a84a'); }
        p.rect(1, 3, 1, 12, '#d8a84a'); p.rect(14, 3, 1, 12, '#d8a84a');
        p.outline(OUT); break;
      }
      case 'bonfire': {
        p.rect(3, 12, 10, 2, '#6b4526'); p.line(2, 14, 13, 11, '#8a5a32'); p.line(2, 11, 13, 14, '#5e3a1e');
        for (let i = 0; i < 6; i++) p.set(2 + i * 2.3, 14, '#6a6a72');
        const f = frame % 3;
        const h = [8, 9, 7][f];
        p.poly([[4, 12], [8, 12 - h], [12, 12]], '#ff6a1f');
        p.poly([[5.5, 12], [8 + (f - 1), 12 - h + 3], [10.5, 12]], '#ffb347');
        p.poly([[7, 12], [8, 12 - h + 6], [9, 12]], '#fff1a8');
        p.set(4 + f * 3, 2 + f, '#ffb347'); p.set(11 - f, 3, '#ff8a3a');
        p.outline(OUT); break;
      }
      case 'bonfire_off': {
        p.rect(3, 12, 10, 2, '#4a3a2e'); p.line(2, 14, 13, 11, '#5a4a3e'); p.line(2, 11, 13, 14, '#3e3026');
        p.ellipse(8, 12, 3, 1.5, '#3a3a42'); p.set(7, 11, '#8a3a2a'); p.outline(OUT); break;
      }
      case 'lever_off': case 'lever_on': {
        p.rect(4, 11, 8, 4, '#6a646e'); p.rect(4, 11, 8, 1, '#8a848e');
        if (name === 'lever_on') { p.line(8, 11, 12, 4, '#8a5a32'); p.circle(12, 4, 1.8, '#3fbf5a'); }
        else { p.line(8, 11, 4, 4, '#8a5a32'); p.circle(4, 4, 1.8, '#d83a3a'); }
        p.outline(OUT); break;
      }
      case 'gate': {
        p.rect(0, 0, 16, 2, '#4a4a56'); p.rect(0, 14, 16, 2, '#4a4a56');
        for (let x = 1; x < 16; x += 3) { p.rect(x, 0, 2, 16, '#7a7a88'); p.rect(x, 0, 1, 16, '#a0a0b0'); }
        p.rect(0, 7, 16, 2, '#5a5a66'); p.outline(OUT); break;
      }
      case 'gate_open': { p.rect(0, 0, 16, 2, '#4a4a56'); p.rect(0, 0, 2, 3, '#7a7a88'); p.rect(14, 0, 2, 3, '#7a7a88'); break; }
      case 'boulder': { p.ellipse(8, 9, 7, 6.5, '#6a6470'); p.ellipse(7.5, 8.5, 6.2, 5.6, '#8e8696'); p.ellipse(6, 6.5, 3, 2.2, '#b0a8b8'); p.line(9, 10, 12, 12, '#5a5460'); p.outline(OUT); break; }
      case 'plate': case 'plate_on': { const on = name === 'plate_on'; p.rect(2, 2, 12, 12, on ? '#4a8a5a' : '#6a646e'); p.rect(3, 3, 10, 10, on ? '#6ad08a' : '#8a848e'); p.rect(5, 5, 6, 6, on ? '#9affb8' : '#a8a2ac'); break; }
      case 'lantern_off': case 'lantern_on': {
        const on = name === 'lantern_on';
        p.rect(7, 6, 2, 10, '#3a3a42'); p.rect(5, 14, 6, 2, '#3a3a42');
        p.rect(4, 0, 8, 7, '#2a2a32'); p.rect(5, 1, 6, 5, on ? (frame % 2 ? '#ffe08a' : '#ffcf5a') : '#4a4a5a');
        if (on) p.rect(6, 2, 4, 3, '#fff6c8');
        p.outline(OUT); break;
      }
      case 'sparkle': { const s = frame % 2 ? 3 : 2; const c = '#fff6c8'; p.line(8, 8 - s, 8, 8 + s, c); p.line(8 - s, 8, 8 + s, 8, c); p.set(8, 8, '#ffffff'); if (frame % 2) { p.set(6, 6, '#ffe08a'); p.set(10, 10, '#ffe08a'); } break; }
      case 'sign': { p.rect(7, 9, 2, 7, '#6b4526'); p.rect(2, 2, 12, 8, '#a8743f'); p.rect(2, 2, 12, 1, '#c99a60'); p.rect(4, 4, 8, 1, '#5e3a1e'); p.rect(4, 6, 6, 1, '#5e3a1e'); p.outline(OUT); break; }
      case 'raft': { p.rect(1, 4, 14, 9, '#8a5a32'); for (let x = 1; x < 15; x += 3) p.rect(x, 4, 1, 9, '#5e3a1e'); p.rect(1, 6, 14, 1, '#c9a060'); p.rect(1, 10, 14, 1, '#c9a060'); p.outline(OUT); break; }
      case 'rope': { p.rect(7, 0, 2, 16, '#c9a060'); for (let y = 1; y < 16; y += 3) p.set(7, y, '#8a6a3a'); break; }
      case 'ember_green': case 'ember_blue': case 'ember_violet': case 'ember_white': {
        const col = { ember_green: '#5aff8a', ember_blue: '#5ab8ff', ember_violet: '#c87aff', ember_white: '#ffffff' }[name];
        const r = 4 + (frame % 2) * 0.6;
        p.circle(8, 8, r + 1.5, shade(col, -0.5)); p.circle(8, 8, r, col); p.circle(7, 7, r / 2, '#ffffff');
        break;
      }
      case 'vines': {
        for (let i = 0; i < 5; i++) { p.thick(1 + i * 3, 15, 3 + i * 3 + (frame ? 1 : 0), 0, i % 2 ? '#2f5a2a' : '#3f7a34', 2); }
        for (let i = 0; i < 14; i++) { const x = 1 + (i * 7) % 14, y = 1 + (i * 5) % 14; p.set(x, y, '#c8d8a0'); p.set(x + 1, y, '#1a2a14'); }
        p.line(0, 5, 15, 7, '#2a4a24'); p.line(0, 11, 15, 9, '#2a4a24');
        p.outline(OUT); break;
      }
      case 'fogwall': {
        for (let i = 0; i < 6; i++) p.ellipse(3 + (i * 5 + frame) % 12, 3 + (i * 7) % 12, 4, 3, i % 2 ? '#c8ccd8' : '#a8b0c0');
        p.ellipse(8, 8, 6, 6, '#b8c0d0'); break;
      }
      case 'ped_off': case 'ped_verde': case 'ped_azul': case 'ped_violeta': case 'ped_branca': {
        p.rect(4, 8, 8, 7, '#5a5470'); p.rect(3, 6, 10, 3, '#7a7290'); p.rect(3, 14, 10, 2, '#4a4460'); p.rect(4, 6, 8, 1, '#9a92b0');
        const col = { ped_verde: '#5aff8a', ped_azul: '#5ab8ff', ped_violeta: '#c87aff', ped_branca: '#ffffff' }[name];
        if (col) { p.circle(8, 3.5 - (frame % 2) * 0.5, 2.8, shade(col, -0.4)); p.circle(8, 3.5 - (frame % 2) * 0.5, 2, col); p.set(7, 2, '#ffffff'); }
        else p.rect(6, 5, 4, 1, '#2a2438');
        p.outline(OUT); break;
      }
      case 'bigLampOff': case 'bigLampOn': {
        const on = name === 'bigLampOn';
        p.rect(2, 9, 12, 7, '#8a7a68'); p.rect(2, 9, 12, 1, '#b0a090'); p.rect(3, 15, 10, 1, '#5a4a3e');
        p.ellipse(8, 7, 6, 4, on ? '#ffb347' : '#4a4250');
        if (on) { p.ellipse(8, 6, 4, 3, '#ffe08a'); p.ellipse(8, 5, 2, 2, '#ffffff'); }
        else { p.set(6, 7, '#7a3a2a'); p.set(9, 6, '#5a5060'); p.set(10, 8, '#8a4a2a'); }
        p.rect(1, 2, 2, 8, '#5a5060'); p.rect(13, 2, 2, 8, '#5a5060'); p.rect(1, 1, 14, 2, '#6a6070');
        p.outline(OUT); break;
      }
    }
    return (this.cache[key] = p.toCanvas());
  },
};

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

const MonsterSprites = {
  cache: {},
  get(enemyId) {
    if (this.cache[enemyId]) return this.cache[enemyId];
    const e = ENEMIES[enemyId];
    const art = e.art;
    const p = MONSTER_ART[art.type](art);
    return (this.cache[enemyId] = p.toCanvas());
  },
};

// sprites de batalha dos heróis (perfil voltado à esquerda)
const HeroSprites = {
  cache: {},
  get(id, pose = 0) {
    const key = id + pose;
    if (this.cache[key]) return this.cache[key];
    let p;
    if (id === 'ticao') p = pup('left', pose === 1 ? 1 : 0);
    else p = humanoid(CHAR_LOOKS[id], 'left', pose === 1 ? 1 : 0);
    return (this.cache[key] = p.toCanvas());
  },
};

// ============================================================
//  ÍCONES DE ITENS
// ============================================================
const Icons = {
  cache: {},
  get(kind, color) {
    const key = kind + (color || '');
    if (this.cache[key]) return this.cache[key];
    const p = new PixelArt(16, 16);
    const c = color || '#e05a5a';
    switch (kind) {
      case 'potion': p.rect(6, 1, 4, 2, '#c8a070'); p.rect(7, 3, 2, 3, '#d8e8f0'); p.ellipse(8, 10, 5, 5, c); p.ellipse(6.5, 8.5, 1.5, 2, shade(c, 0.5)); p.rect(3, 9, 10, 1, shade(c, -0.2)); break;
      case 'herb': p.line(8, 15, 8, 6, '#3f7a2e'); p.ellipse(5, 6, 3, 2, '#5ab04a'); p.ellipse(11, 5, 3, 2, '#4fa040'); p.ellipse(8, 3, 2, 3, '#6ac05a'); p.ellipse(5, 10, 2.5, 1.5, '#4fa040'); break;
      case 'feather': p.thick(3, 14, 12, 2, '#ffcf5a', 1); for (let i = 0; i < 8; i++) { p.line(4 + i, 12 - i, 1 + i, 9 - i, i % 2 ? '#ff7a2a' : '#ff5a3a'); p.line(5 + i, 13 - i, 8 + i, 14 - i, '#ffb347'); } break;
      case 'bomb': p.circle(8, 10, 5, '#3a3a48'); p.circle(6, 8, 1.5, '#7a7a88'); p.line(10, 5, 12, 2, '#c8a070'); p.set(13, 1, '#ffb347'); p.set(12, 0, '#ff5a1f'); break;
      case 'crystal': p.poly([[8, 1], [13, 7], [8, 15], [3, 7]], c); p.poly([[8, 1], [8, 15], [3, 7]], shade(c, 0.3)); break;
      case 'incense': p.rect(5, 11, 6, 4, '#8a5a32'); p.rect(7, 4, 2, 7, '#c8a070'); for (let i = 0; i < 3; i++) p.set(8 + (i % 2), 3 - i, '#d8d0e8'); break;
      case 'sword': p.thick(3, 13, 12, 3, '#d8dce8', 2); p.line(4, 13, 12, 4, '#ffffff'); p.line(2, 10, 6, 14, '#b08a3a'); p.line(2, 11, 5, 14, '#b08a3a'); p.rect(1, 14, 2, 2, '#6b4526'); break;
      case 'staff': p.thick(3, 14, 11, 4, '#8a5a32', 2); p.circle(12, 3, 2.5, c); p.set(11, 2, '#ffffff'); break;
      case 'hammer': p.thick(3, 14, 9, 6, '#8a5a32', 2); p.poly([[7, 1], [14, 6], [11, 9], [4, 4]], '#8a8a98'); p.line(7, 1, 4, 4, '#b0b0c0'); break;
      case 'collar': p.ellipse(8, 8, 6, 4, c); p.ellipse(8, 8, 4, 2.4, null); for (let y = 6; y <= 10; y++) for (let x = 5; x <= 11; x++) if (((x + 0.5 - 8) / 4) ** 2 + ((y + 0.5 - 8) / 2.4) ** 2 <= 1) p.d[y * 16 + x] = null; p.circle(8, 12, 1.6, '#e8c45a'); break;
      case 'armor': p.poly([[3, 3], [6, 2], [8, 4], [10, 2], [13, 3], [13, 13], [3, 13]], c); p.rect(3, 3, 10, 1, shade(c, 0.3)); p.rect(7, 4, 2, 9, shade(c, -0.2)); break;
      case 'robe': p.poly([[5, 2], [11, 2], [14, 15], [2, 15]], c); p.rect(7, 2, 2, 13, shade(c, 0.3)); break;
      case 'ring': p.circle(8, 10, 4.5, '#e8c45a'); p.circle(8, 10, 2.5, null); for (let y = 8; y <= 12; y++) for (let x = 6; x <= 10; x++) if (((x + 0.5 - 8)) ** 2 + ((y + 0.5 - 10)) ** 2 <= 6) p.d[y * 16 + x] = null; p.poly([[6, 5], [8, 2], [10, 5], [8, 7]], c); break;
      case 'amulet': p.line(3, 2, 8, 9, '#c8a070'); p.line(13, 2, 8, 9, '#c8a070'); p.circle(8, 11, 3.5, c); p.set(7, 10, '#ffffff'); break;
      case 'key': p.circle(4, 5, 3, '#e8c45a'); p.set(4, 5, null); p.thick(6, 7, 13, 14, '#e8c45a', 2); p.rect(10, 13, 2, 2, '#e8c45a'); p.rect(12, 11, 2, 2, '#e8c45a'); break;
      case 'ember': p.circle(8, 8, 6, shade(c, -0.5)); p.circle(8, 8, 4.5, c); p.circle(7, 7, 2, '#ffffff'); break;
      case 'letter': p.rect(2, 4, 12, 9, '#f0e6cc'); p.line(2, 4, 8, 9, '#a89a7a'); p.line(14, 4, 8, 9, '#a89a7a'); p.circle(8, 9, 1.5, '#c83a3a'); break;
      case 'mushroom': p.rect(7, 8, 3, 6, '#efe4c8'); p.ellipse(8, 7, 6, 4, c); p.set(6, 5, '#ffffff'); p.set(10, 6, '#ffffff'); break;
      case 'bone': p.rect(4, 7, 8, 2, '#f4ecd8'); p.circle(3.5, 6.5, 2, '#f4ecd8'); p.circle(3.5, 9.5, 2, '#f4ecd8'); p.circle(12.5, 6.5, 2, '#f4ecd8'); p.circle(12.5, 9.5, 2, '#f4ecd8'); break;
      case 'tent': p.poly([[8, 2], [15, 14], [1, 14]], c); p.poly([[8, 6], [10, 14], [6, 14]], '#2a1e18'); break;
      case 'tea': p.ellipse(8, 10, 5, 4, '#f0e6cc'); p.rect(3, 6, 10, 4, '#f0e6cc'); p.ellipse(8, 6, 5, 1.5, '#8ab04a'); p.circle(13, 9, 2, null); p.set(8, 3, '#d8d0e8'); p.set(7, 2, '#d8d0e8'); break;
      case 'bell': p.ellipse(8, 9, 5, 6, '#e8c45a'); p.rect(3, 12, 10, 2, '#d8b040'); p.circle(8, 14, 1.5, '#8a6a20'); p.rect(7, 2, 2, 2, '#8a6a20'); break;
      default: p.circle(8, 8, 5, c);
    }
    p.outline(OUT);
    return (this.cache[key] = p.toCanvas());
  },
};

// imagem do Tição (arte do usuário)
const PORTRAITS = { ticao: null };
function loadPortraits() {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { PORTRAITS.ticao = img; res(); };
    img.onerror = () => res();
    img.src = (window.TICAO_DATA_URL || 'assets/ticao.png');
  });
}
