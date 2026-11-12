'use strict';
// ============================================================
//  Arte procedural: tiles por estação, objetos, plantas, ícones,
//  personagens e monstrinhos
// ============================================================

const TILE_DEFS = {
  '.': {}, ',': {}, '"': {}, ':': {}, ';': {}, 's': {}, '_': {}, 'm': {}, 'o': {}, 'F': {}, 'D': {},
  '=': {}, '|': {},
  '~': { solid: true, water: true, anim: 2 },
  'T': { solid: true, over: true }, 'P': { solid: true, over: true }, 'b': { solid: true, over: true },
  'f': { solid: true, over: true }, 'r': { solid: true, over: true }, '^': { solid: true }, 'C': { solid: true },
  '#': { solid: true }, 'H': { solid: true }, 'W': { solid: true }, 'R': { solid: true }, 'Q': { solid: true }, 'G': { solid: true },
  'k': { solid: true }, 't': { solid: true, over: true }, 'c': { solid: true, over: true }, 'x': { solid: true, over: true },
  'K': { solid: true, over: true }, 'B': { solid: true, over: true }, 'q': { solid: true, anim: 3 }, 'E': { solid: true, over: true, anim: 2 },
  'w': { solid: true, over: true, water: true }, 'z': { solid: true, over: true }, 'V': { solid: true, over: true },
};
const TILLABLE = { '.': 1, ',': 1, '"': 1, ':': 1 };

const SEASON_PAL = {
  spring: { g: '#5ca63e', gd: '#46892f', gl: '#7cc254', tree: '#3f8a3a', treed: '#2a6428', treel: '#5aac48', flower: ['#ff8ab8', '#ffe066', '#ffffff', '#b59cff'] },
  summer: { g: '#4f9a34', gd: '#3c7e28', gl: '#6cb444', tree: '#2f7a30', treed: '#1f5a22', treel: '#4a9a3a', flower: ['#ffd040', '#ff6a3a', '#ffffff', '#ff4a8a'] },
  autumn: { g: '#a08a3c', gd: '#806c2c', gl: '#c0a450', tree: '#c8702a', treed: '#9a4a1a', treel: '#e8963a', flower: ['#ff8a2a', '#c84a2a', '#ffd040', '#a05a2a'] },
  winter: { g: '#e8eef6', gd: '#c6d2e2', gl: '#ffffff', tree: '#5a7a6a', treed: '#3a5a4a', treel: '#ffffff', flower: ['#ffffff', '#d8e8ff', '#bfe8ff', '#ffffff'] },
};

const Tiles = {
  cache: {},
  get(ch, theme, variant = 0, frame = 0) {
    const key = ch + '|' + theme + '|' + variant + '|' + frame;
    return this.cache[key] || (this.cache[key] = this.make(ch, theme, variant, frame).toCanvas());
  },
  make(ch, theme, variant, frame) {
    const T = SEASON_PAL[theme] || SEASON_PAL.spring;
    const R = U.seeded(U.hash(ch + theme) + variant * 7919 + 1);
    const p = new PixelArt(16, 16);
    const speck = (base, cols, n) => { p.fill(base); for (let i = 0; i < n; i++) p.set(R() * 16, R() * 16, cols[Math.floor(R() * cols.length)]); };
    const grass = () => {
      if (theme === 'cave') { speck('#5e5668', ['#4c4456', '#706878'], 22); return; }
      speck(T.g, [T.gd, T.gd, T.gl], 18);
      if (theme !== 'winter') for (let i = 0; i < 3; i++) { const x = 1 + R() * 14 | 0, y = 2 + R() * 12 | 0; p.set(x, y, T.gd); p.set(x + 1, y - 1, T.gd); p.set(x - 1, y - 1, T.gd); }
    };
    switch (ch) {
      case '.': grass(); break;
      case ',': grass(); for (let i = 0; i < 3; i++) { const x = 2 + R() * 12 | 0, y = 2 + R() * 12 | 0, col = T.flower[R() * 4 | 0]; p.set(x, y, col); p.set(x + 1, y, col); p.set(x, y + 1, col); p.set(x + 1, y + 1, shade(col, -0.3)); } break;
      case '"': grass(); for (let i = 0; i < 6; i++) { const x = 1 + R() * 13 | 0, y = 4 + R() * 11 | 0; p.line(x, y, x - 1, y - 3, T.gd); p.line(x + 1, y, x + 2, y - 3, shade(T.gd, -0.2)); p.set(x, y - 1, T.gl); } break;
      case 'F': grass(); for (let i = 0; i < 8; i++) { const x = 1 + R() * 13 | 0, y = 1 + R() * 13 | 0, col = T.flower[R() * 4 | 0]; p.rect(x, y, 2, 2, col); p.set(x, y + 2, T.gd); } break;
      case ':': speck(theme === 'winter' ? '#c8b8a8' : '#b38b5a', theme === 'winter' ? ['#b0a090', '#e0d8d0'] : ['#9c7548', '#c9a26f', '#8a653e'], 26); break;
      case ';': speck('#e4d199', ['#d2bc80', '#f2e4b8', '#c8b070'], 24); break;
      case 's': { p.fill('#a39e95'); p.rect(0, 7, 16, 1, '#7d786f'); p.rect(0, 15, 16, 1, '#7d786f'); p.rect(7, 0, 1, 8, '#7d786f'); p.rect(3, 8, 1, 8, '#7d786f'); p.rect(11, 8, 1, 8, '#7d786f'); for (let i = 0; i < 5; i++) p.set(R() * 16, R() * 16, '#bdb8ae'); break; }
      case '_': { p.fill('#a5733f'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#7a5230'); const off = ((y / 4) % 2) * 8 + (R() * 3 | 0); p.rect(off % 16, y, 1, 3, '#7a5230'); p.rect(0, y, 16, 1, '#b8854f'); } break; }
      case 'm': { p.fill('#3a6a9a'); p.rect(0, 0, 16, 1, '#e8c45a'); p.rect(0, 15, 16, 1, '#e8c45a'); for (let i = 0; i < 16; i += 4) { p.set(i + 2, 7, '#e8c45a'); p.set(i + 1, 8, '#e8c45a'); p.set(i + 3, 8, '#e8c45a'); } break; }
      case 'o': speck('#5e5668', ['#4c4456', '#706878', '#4c4456'], 22); break;
      case 'D': { p.fill('#5c3a22'); p.rect(2, 1, 12, 15, '#8a5a32'); for (let x = 5; x < 14; x += 3) p.rect(x, 2, 1, 14, '#6e4527'); p.rect(11, 8, 2, 2, '#e8c45a'); break; }
      case '~': { const wc = theme === 'cave' ? '#264a7a' : '#3b7fd6'; p.fill(wc); for (let i = 0; i < 8; i++) p.set(R() * 16, R() * 16, shade(wc, -0.2)); const off = frame ? 3 : 0; for (let y = 3; y < 16; y += 6) { const x = (y * 5 + off) % 12; p.rect(x, y, 4, 1, '#8cc4ff'); } if (theme === 'winter') { p.rect(0, 0, 16, 1, '#dff0ff'); } break; }
      case '=': { p.fill('#3b7fd6'); p.rect(0, 2, 16, 12, '#a8794a'); for (let x = 0; x < 16; x += 4) p.rect(x + 3, 2, 1, 12, '#7a5230'); p.rect(0, 2, 16, 1, '#5e3f24'); p.rect(0, 13, 16, 1, '#5e3f24'); break; }
      case '|': { p.fill('#3b7fd6'); p.rect(2, 0, 12, 16, '#a8794a'); for (let y = 0; y < 16; y += 4) p.rect(2, y + 3, 12, 1, '#7a5230'); p.rect(2, 0, 1, 16, '#5e3f24'); p.rect(13, 0, 1, 16, '#5e3f24'); break; }
      case 'T': { p.rect(7, 11, 3, 5, '#6b4526'); p.ellipse(8, 7, 7, 6.5, T.treed); p.ellipse(7.5, 6.5, 6.5, 5.8, T.tree); p.ellipse(6, 5, 3.5, 3, T.treel); for (let i = 0; i < 6; i++) p.set(3 + R() * 10, 3 + R() * 8, T.treed); p.outline(OUT); break; }
      case 'P': { p.rect(7, 12, 2, 4, '#5b3b20'); const c = theme === 'autumn' ? '#3a6a4a' : theme === 'winter' ? '#2d5a4a' : '#2f6a3a'; for (let i = 0; i < 3; i++) { const y = 1 + i * 4, w = 3 + i * 2; p.poly([[8, y], [8 + w + 0.5, y + 6], [8 - w - 0.5, y + 6]], c); if (theme === 'winter') p.line(8 - w + 1, y + 5, 8, y + 1, '#ffffff'); } p.outline(OUT); break; }
      case 'b': { const c = theme === 'winter' ? '#6a8a7a' : T.tree; p.ellipse(8, 10, 7, 5.5, shade(c, -0.3)); p.ellipse(7.5, 9.5, 6.3, 4.8, c); p.ellipse(6, 8, 3, 2, shade(c, 0.2)); if (theme === 'winter') p.ellipse(7, 6.5, 5, 1.5, '#ffffff'); p.outline(OUT); break; }
      case 'r': { p.ellipse(8, 10, 7, 5.5, '#6a6670'); p.ellipse(7.5, 9.5, 6.5, 4.8, '#8e8a96'); p.ellipse(6, 8, 3, 2, '#b0acb8'); if (theme === 'winter') p.ellipse(7, 6.5, 5, 1.6, '#ffffff'); p.outline(OUT); break; }
      case 'f': { p.rect(1, 4, 2, 11, '#8a5a32'); p.rect(13, 4, 2, 11, '#8a5a32'); p.rect(0, 6, 16, 2, '#a8743f'); p.rect(0, 11, 16, 2, '#a8743f'); if (theme === 'winter') { p.rect(0, 5, 16, 1, '#ffffff'); p.rect(1, 3, 2, 1, '#ffffff'); p.rect(13, 3, 2, 1, '#ffffff'); } p.outline(OUT); break; }
      case '^': { const c = theme === 'winter' ? '#8d9bb0' : '#8f6a45'; p.fill(c); for (let y = 2; y < 16; y += 5) { p.rect(0, y, 16, 1, shade(c, -0.3)); for (let i = 0; i < 3; i++) p.set(R() * 16, y + 1, shade(c, 0.25)); } if (theme === 'winter') p.rect(0, 0, 16, 2, '#ffffff'); else p.rect(0, 0, 16, 1, shade(c, 0.3)); break; }
      case 'C': { p.fill('#2c2434'); for (let i = 0; i < 5; i++) { const x = R() * 13 | 0, y = R() * 13 | 0; p.ellipse(x + 2, y + 2, 2.5, 2, '#4a3e58'); p.set(x + 3, y + 3, '#1a1422'); } p.rect(0, 14, 16, 2, '#1a1422'); p.rect(0, 0, 16, 1, '#4a3e58'); break; }
      case '#': { p.fill('#c8a878'); for (let x = 0; x < 16; x += 4) p.rect(x, 0, 1, 12, '#b8986a'); p.rect(0, 0, 16, 2, '#a8885a'); p.rect(0, 12, 16, 4, '#7a5a3a'); p.rect(0, 12, 16, 1, '#a07a50'); break; }
      case 'H': case 'W': { p.fill('#d8b07a'); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, '#a8804a'); p.rect(0, y, 16, 1, '#e8c890'); } if (ch === 'W') { p.rect(3, 3, 10, 9, '#5a3a20'); p.rect(4, 4, 8, 7, '#8ad0ff'); p.rect(4, 4, 8, 3, '#c8ecff'); p.rect(7, 4, 2, 7, '#5a3a20'); p.rect(4, 7, 8, 1, '#5a3a20'); p.rect(2, 12, 12, 1, '#7a4a2a'); } break; }
      case 'R': case 'Q': case 'G': { const base = { R: '#c8504a', Q: '#4a73b8', G: '#4a9a5a' }[ch]; p.fill(base); for (let y = 0; y < 16; y += 4) { p.rect(0, y + 3, 16, 1, shade(base, -0.35)); const off = (y / 4) % 2 ? 2 : 0; for (let x = off; x < 16; x += 4) p.rect(x, y, 1, 3, shade(base, -0.2)); p.rect(0, y, 16, 1, shade(base, 0.18)); } if (theme === 'winter') { p.rect(0, 0, 16, 3, '#ffffff'); p.rect(0, 3, 16, 1, '#dfe8f2'); } break; }
      case 'k': { p.fill('#5e3a22'); for (let y = 1; y < 16; y += 5) { p.rect(1, y, 14, 4, '#2e1d12'); let x = 1; while (x < 15) { const w = 1 + (R() * 2 | 0); p.rect(x, y, w, 4, ['#b5483a', '#3f6fb0', '#4f9a4a', '#d8a84a', '#8a4ab0'][R() * 5 | 0]); x += w; } p.rect(0, y + 4, 16, 1, '#7a5230'); } break; }
      case 't': { p.rect(1, 3, 14, 9, '#8a5a32'); p.rect(1, 3, 14, 2, '#b07a46'); p.rect(2, 12, 2, 3, '#5e3a1e'); p.rect(12, 12, 2, 3, '#5e3a1e'); p.rect(6, 4, 4, 3, '#e8e0d0'); p.outline(OUT); break; }
      case 'c': { p.rect(0, 4, 16, 12, '#7a4f2c'); p.rect(0, 2, 16, 4, '#b07a46'); p.rect(0, 2, 16, 1, '#d4a06a'); break; }
      case 'x': { p.rect(2, 3, 12, 12, '#a8743f'); p.rect(2, 3, 12, 1, '#c99a60'); p.rect(2, 8, 12, 1, '#7a5230'); p.line(3, 4, 13, 14, '#7a5230'); p.outline(OUT); break; }
      case 'K': { p.ellipse(8, 9, 6, 6.5, '#8a5a32'); p.rect(2, 5, 12, 1, '#555a62'); p.rect(2, 12, 12, 1, '#555a62'); p.ellipse(8, 3.5, 5, 1.6, '#6e4527'); p.outline(OUT); break; }
      case 'B': { p.rect(1, 1, 14, 14, '#6e4527'); p.rect(2, 2, 12, 12, '#e8e0d0'); p.rect(3, 2, 10, 4, '#ffffff'); p.rect(2, 7, 12, 7, '#4a8ac8'); p.rect(2, 7, 12, 1, '#7ab0e0'); p.outline(OUT); break; }
      case 'V': { p.ellipse(8, 10, 5, 5, '#c0603a'); p.rect(6, 3, 4, 3, '#c0603a'); p.set(7, 2, '#4f9a4a'); p.set(8, 1, '#4f9a4a'); p.set(9, 2, '#4f9a4a'); p.outline(OUT); break; }
      case 'q': { p.fill('#6a646e'); for (let y = 0; y < 16; y += 4) p.rect(0, y + 3, 16, 1, '#4a444e'); p.rect(3, 6, 10, 10, '#1a1010'); p.rect(4, 11, 8, 4, ['#ff7a2a', '#ffb347', '#ff5a1f'][frame % 3]); p.rect(6, 9 - (frame % 2), 4, 3, '#ffe08a'); break; }
      case 'E': { p.rect(7, 4, 2, 12, '#3a3a42'); p.rect(5, 14, 6, 2, '#3a3a42'); p.rect(4, 0, 8, 5, '#2a2a32'); p.rect(5, 1, 6, 3, frame ? '#ffe08a' : '#ffcf5a'); p.outline(OUT); break; }
      case 'w': { p.ellipse(8, 9, 7, 6, '#7d786f'); p.ellipse(8, 9, 5, 4, '#2a4a7a'); p.ellipse(7, 8, 2, 1, '#5a8ac8'); p.rect(1, 1, 1, 8, '#6b4526'); p.rect(14, 1, 1, 8, '#6b4526'); p.rect(1, 1, 14, 1, theme === 'winter' ? '#ffffff' : '#8a5a32'); p.outline(OUT); break; }
      case 'z': { p.rect(4, 12, 8, 4, '#7d786f'); p.rect(5, 5, 6, 7, '#a39e95'); p.circle(8, 4, 3, '#a39e95'); p.set(7, 3, '#5a5650'); p.set(9, 3, '#5a5650'); p.outline(OUT); break; }
      default: p.fill('#ff00ff');
    }
    return p;
  },
};

// ------------------------------------------------------------
//  Objetos no chão (pedras, galhos, árvores, minérios...)
// ------------------------------------------------------------
const ObjArt = {
  cache: {},
  get(kind, season, frame = 0) {
    const key = kind + '|' + season + '|' + frame;
    return this.cache[key] || (this.cache[key] = this.make(kind, season, frame).toCanvas());
  },
  make(kind, season, frame) {
    const T = SEASON_PAL[season] || SEASON_PAL.spring;
    let p = new PixelArt(16, 16);
    const rock = (c, specks, sc) => {
      p.ellipse(8, 10, 6.5, 5, shade(c, -0.3)); p.ellipse(7.5, 9.5, 6, 4.4, c); p.ellipse(6, 8, 2.6, 1.8, shade(c, 0.25));
      if (specks) for (const [x, y] of [[5, 10], [9, 8], [10, 11], [7, 12], [11, 9]]) { p.set(x, y, sc); p.set(x + 1, y, shade(sc, 0.3)); }
      p.outline(OUT);
    };
    switch (kind) {
      case 'weed': { const c = season === 'autumn' ? '#a08a3c' : season === 'winter' ? '#8a948a' : '#4a9a3a'; for (let i = 0; i < 5; i++) { const x = 3 + i * 2.5; p.thick(x, 15, x + (i % 2 ? 2 : -2), 7 + (i % 3), shade(c, (i % 2) * 0.15), 1); } p.ellipse(8, 14, 6, 2, shade(c, -0.25)); p.outline(OUT); break; }
      case 'stone': rock('#8e8a96'); break;
      case 'branch': { p.thick(2, 12, 13, 9, '#7a5230', 2); p.line(7, 11, 9, 6, '#7a5230'); p.line(11, 10, 13, 13, '#7a5230'); p.set(9, 6, '#5aa03a'); p.outline(OUT); break; }
      case 'stump': { p.ellipse(8, 11, 6, 4, '#6b4526'); p.rect(2, 7, 12, 5, '#8a5a32'); p.ellipse(8, 7, 6, 2.5, '#c8a070'); p.ellipse(8, 7, 3.5, 1.4, '#a8804a'); p.set(8, 7, '#7a5230'); p.outline(OUT); break; }
      case 'rock': rock('#7a7284'); break;
      case 'rock2': rock('#6a6278'); p.line(5, 9, 9, 12, '#3a3248'); break;
      case 'ore_cobre': rock('#7a7284', true, '#d8823a'); break;
      case 'ore_ferro': rock('#7a7284', true, '#c8d8f0'); break;
      case 'ore_cristal': rock('#5a5278', true, '#7af0ff'); p.poly([[7, 6], [9, 1], [11, 6]], '#7af0ff'); p.line(9, 2, 9, 5, '#d8ffff'); break;
      case 'ore_gema': rock('#7a7284', true, '#ffc040'); break;
      case 'ore_ametista': rock('#5a5278', true, '#b05aff'); p.poly([[5, 7], [6, 2], [8, 7]], '#b05aff'); break;
      case 'boulder': { p = new PixelArt(16, 16); p.ellipse(8, 9, 7.5, 6.5, '#5a5468'); p.ellipse(7.5, 8.5, 7, 6, '#7a7284'); p.ellipse(5.5, 6.5, 3, 2.2, '#a09ab0'); p.line(9, 9, 13, 12, '#4a4458'); p.outline(OUT); break; }
      case 'ladder': { p.ellipse(8, 9, 7, 6, '#120c18'); p.ellipse(8, 9, 5.5, 4.5, '#06040a'); p.rect(5, 4, 1, 10, '#a8743f'); p.rect(10, 4, 1, 10, '#a8743f'); for (let y = 5; y < 14; y += 3) p.rect(5, y, 6, 1, '#c99a60'); break; }
      case 'ladder_up': { p.rect(4, 0, 2, 16, '#a8743f'); p.rect(10, 0, 2, 16, '#a8743f'); for (let y = 1; y < 16; y += 3) p.rect(4, y, 8, 1, '#c99a60'); p.outline(OUT); break; }
      case 'dead': { p.line(8, 15, 7, 8, '#7a6040'); p.line(7, 8, 4, 6, '#7a6040'); p.line(7, 9, 11, 7, '#7a6040'); p.set(4, 5, '#8a7050'); p.set(11, 6, '#8a7050'); p.outline(OUT); break; }
      case 'chest': { p.rect(1, 5, 14, 10, '#a06838'); p.rect(1, 5, 14, 1, '#c99060'); p.rect(1, 9, 14, 1, '#6a4020'); p.rect(7, 8, 2, 3, '#e8c45a'); p.rect(1, 5, 1, 10, '#d8a84a'); p.rect(14, 5, 1, 10, '#d8a84a'); p.outline(OUT); break; }
      case 'tree': { // 16x32
        p = new PixelArt(16, 32);
        p.rect(6, 20, 4, 12, '#6b4526'); p.rect(6, 20, 1, 12, '#4f321b'); p.rect(4, 30, 8, 2, '#5a3a20');
        if (season === 'winter') { p.line(8, 21, 3, 12, '#6b4526'); p.line(8, 20, 13, 11, '#6b4526'); p.line(8, 18, 8, 6, '#6b4526'); p.line(5, 15, 2, 9, '#6b4526'); p.line(11, 14, 14, 8, '#6b4526'); for (const [x, y] of [[3, 11], [13, 10], [8, 5], [2, 8], [14, 7]]) p.rect(x - 1, y, 3, 1, '#ffffff'); }
        else {
          p.ellipse(8, 13, 8, 9, T.treed); p.ellipse(7.5, 12.5, 7.4, 8.4, T.tree); p.ellipse(5.5, 9, 3.5, 3.5, T.treel); p.ellipse(10.5, 15, 2.5, 2, T.treel);
          if (season === 'spring') for (const [x, y] of [[4, 14], [11, 9], [7, 17], [12, 14], [6, 7]]) { p.set(x, y, '#ffb8d8'); p.set(x + 1, y, '#ffffff'); }
          if (season === 'summer') for (const [x, y] of [[4, 14], [11, 10], [8, 17]]) p.circle(x, y, 1.2, '#e83a3a');
        }
        p.outline(OUT); break;
      }
      case 'moontree': case 'moontree_bloom': { // 48x48
        const bloom = kind === 'moontree_bloom';
        p = new PixelArt(48, 48);
        for (let i = 0; i < 5; i++) p.thick(24, 44, 10 + i * 7, 47, '#6a5a6a', 2);
        p.poly([[18, 46], [20, 20], [28, 20], [30, 46]], bloom ? '#8a7a9a' : '#6a5e66');
        p.line(21, 24, 20, 44, bloom ? '#a898b8' : '#7e727a');
        if (bloom) { for (const [x, y, r] of [[24, 14, 13], [12, 18, 9], [36, 18, 9], [18, 8, 8], [31, 8, 8]]) { p.circle(x, y, r, '#7a8ad8'); p.circle(x - 1, y - 1, r - 1.5, '#a8b8ff'); } for (let i = 0; i < 24; i++) p.set(4 + (i * 37) % 40, 2 + (i * 23) % 26, i % 2 ? '#ffffff' : '#fff6a8'); p.circle(24, 14, 3, '#fff6c8'); }
        else { p.thick(22, 22, 12, 10, '#6a5e66', 2); p.thick(26, 22, 37, 8, '#6a5e66', 2); p.line(15, 13, 9, 9, '#6a5e66'); p.line(34, 11, 40, 9, '#6a5e66'); p.line(24, 20, 24, 6, '#6a5e66'); for (const [x, y] of [[9, 9], [40, 9], [24, 6], [12, 10]]) p.set(x, y, '#8a8aa8'); }
        p.outline(OUT); break;
      }
    }
    return p;
  },
  // item caído no chão (coletável)
  forage(id) { return Icons.get(id); },
};

// ------------------------------------------------------------
//  Plantas em crescimento (16x24)
// ------------------------------------------------------------
const CropArt = {
  cache: {},
  get(cropId, stage, ready) {
    const key = cropId + stage + (ready ? 'r' : '');
    return this.cache[key] || (this.cache[key] = this.make(CROPS[cropId], stage, ready).toCanvas());
  },
  // stage: 0 semente, 1 broto, 2 crescendo, 3 adulta
  make(c, stage, ready) {
    const p = new PixelArt(16, 24);
    const L = c.leaf, Ld = shade(L, -0.3), F = c.c;
    if (stage === 0) { p.ellipse(8, 21, 3, 1.5, '#5a3a20'); p.set(7, 20, '#c8a060'); p.set(9, 21, '#c8a060'); return p; }
    if (stage === 1) { p.line(8, 22, 8, 18, L); p.ellipse(6, 17, 2, 1.2, L); p.ellipse(10, 17, 2, 1.2, L); return p.outline(OUT); }
    const big = stage >= 3;
    switch (c.look) {
      case 'root': {
        for (const [dx, h] of [[-3, 7], [0, 9], [3, 7]]) p.thick(8 + dx * 0.5, 21, 8 + dx, 21 - h * (big ? 1 : 0.7), dx ? L : Ld, 2);
        if (big) { p.ellipse(8, 21, 3.5, 2.5, F); p.set(7, 20, '#ffffff'); }
        break;
      }
      case 'bush': { p.ellipse(8, 18, big ? 6 : 4, big ? 4.5 : 3, Ld); p.ellipse(8, 17, big ? 5 : 3.5, big ? 3.5 : 2.5, L); if (ready) { p.circle(4, 21, 1.5, F); p.circle(12, 21, 1.5, F); } if (big) p.set(8, 13, '#ffffff'); break; }
      case 'leafy': { const r = big ? 6 : 4; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; p.ellipse(8 + Math.cos(a) * r * 0.6, 17 + Math.sin(a) * r * 0.4, r * 0.55, r * 0.4, i % 2 ? L : Ld); } p.ellipse(8, 17, r * 0.5, r * 0.35, shade(F, 0.2)); break; }
      case 'berry': { p.ellipse(8, 18, big ? 6 : 4, big ? 4 : 3, Ld); p.ellipse(7, 17, big ? 5 : 3, big ? 3 : 2, L); if (big) for (const [x, y] of [[4, 17], [11, 16], [8, 20], [12, 20]]) { p.circle(x, y, ready ? 1.4 : 0.8, ready ? F : '#ffffff'); if (ready) p.set(x, y - 1, '#ffffff'); } break; }
      case 'vine': { p.rect(8, big ? 6 : 12, 1, big ? 17 : 11, '#a8743f'); for (let y = big ? 8 : 13; y < 22; y += 3) { p.ellipse(6, y, 2.4, 1.2, L); p.ellipse(11, y + 1, 2.4, 1.2, Ld); } if (ready) for (const [x, y] of [[5, 12], [11, 15], [6, 18], [11, 9]]) { p.ellipse(x, y, 1.6, 2, F); p.set(x, y - 1, shade(F, 0.4)); } break; }
      case 'corn': { const h = big ? 18 : 11; for (const dx of [-3, 0, 3]) { p.thick(8 + dx, 22, 8 + dx, 22 - h + Math.abs(dx), dx ? Ld : L, 1); p.line(8 + dx, 22 - h * 0.5, 8 + dx + (dx || 3), 22 - h * 0.6, L); } if (ready) { p.ellipse(11, 12, 1.6, 3, F); p.ellipse(5, 14, 1.6, 3, F); } break; }
      case 'melon': { p.line(2, 21, 14, 20, L); p.ellipse(4, 19, 2.5, 1.4, L); p.ellipse(13, 18, 2.5, 1.4, Ld); if (big) { p.ellipse(8, 18, ready ? 5.5 : 3, ready ? 4.5 : 2.5, ready ? F : shade(F, -0.4)); p.line(8, 14, 8, 22, shade(F, -0.3)); if (ready) p.set(6, 16, '#ffffff'); } break; }
      case 'grape': { p.rect(3, big ? 8 : 13, 1, 15, '#a8743f'); p.rect(12, big ? 8 : 13, 1, 15, '#a8743f'); p.rect(3, big ? 8 : 13, 10, 1, '#a8743f'); for (let x = 4; x < 12; x += 3) p.ellipse(x, big ? 11 : 15, 2, 1.5, L); if (ready) for (const x of [5, 10]) for (let k = 0; k < 4; k++) p.circle(x + (k % 2), 14 + k * 1.6, 1.1, F); break; }
    }
    return p.outline(OUT);
  },
};

// ------------------------------------------------------------
//  Ícones de itens (16x16)
// ------------------------------------------------------------
const Icons = {
  cache: {},
  get(id) {
    if (this.cache[id]) return this.cache[id];
    const info = ITEMS[id];
    const [shape, c = '#e05a5a', c2 = '#5aa03a'] = info ? info.icon : ['?'];
    const p = new PixelArt(16, 16);
    switch (shape) {
      case 'hoe': case 'can': case 'pick': case 'axe': case 'sword': case 'rod': {
        const tier = State.tools ? State.tools[id] || 0 : 0;
        const m = TIER_COLORS[tier];
        if (shape === 'hoe') { p.thick(3, 14, 11, 4, '#8a5a32', 2); p.poly([[9, 2], [15, 4], [13, 7], [8, 5]], m); }
        if (shape === 'can') { p.ellipse(7, 10, 5, 4.5, m); p.rect(3, 6, 8, 2, shade(m, 0.3)); p.thick(11, 9, 15, 5, m, 1); p.thick(3, 7, 2, 11, shade(m, -0.3), 1); p.set(15, 4, '#8ad0ff'); }
        if (shape === 'pick') { p.thick(4, 15, 10, 5, '#8a5a32', 2); p.poly([[2, 4], [8, 1], [15, 5], [13, 6], [8, 3], [3, 6]], m); }
        if (shape === 'axe') { p.thick(4, 15, 10, 3, '#8a5a32', 2); p.poly([[8, 2], [14, 1], [15, 7], [10, 7]], m); }
        if (shape === 'sword') { p.thick(4, 12, 13, 3, m, 2); p.line(4, 12, 12, 3, '#ffffff'); p.line(2, 10, 6, 14, '#b08a3a'); p.rect(1, 14, 2, 2, '#6b4526'); }
        if (shape === 'rod') { p.line(2, 15, 13, 2, '#8a5a32'); p.line(3, 15, 14, 2, '#a8743f'); p.line(14, 2, 14, 11, '#e8e8f0'); p.circle(14, 12, 1.2, '#ff4a4a'); }
        break;
      }
      case 'seed': { p.rect(3, 2, 10, 13, '#e8d8b0'); p.rect(3, 2, 10, 2, '#c8b890'); p.circle(8, 9, 3.5, c); p.ellipse(8, 6, 2, 1.2, c2); p.set(7, 8, '#ffffff'); break; }
      case 'root': { p.thick(6, 4, 4, 1, c2, 1); p.thick(9, 4, 11, 1, c2, 1); p.thick(8, 4, 8, 0, shade(c2, -0.2), 1); p.ellipse(8, 9, 4.5, 4.5, c); p.poly([[6, 12], [10, 12], [8, 16]], c); p.set(6, 8, '#ffffff'); break; }
      case 'tuber': { p.ellipse(8, 9, 6, 4.5, c); p.ellipse(6, 8, 2, 1.4, shade(c, 0.3)); for (const [x, y] of [[5, 10], [10, 8], [9, 11]]) p.set(x, y, shade(c, -0.4)); break; }
      case 'leaf': { p.ellipse(8, 9, 6.5, 5.5, shade(c, -0.25)); p.ellipse(7, 8, 5, 4, c); p.line(8, 14, 8, 5, shade(c, 0.4)); p.line(8, 9, 4, 6, shade(c, 0.4)); p.line(8, 10, 12, 7, shade(c, 0.4)); break; }
      case 'berry': { for (const [x, y] of [[6, 9], [10, 9], [8, 12], [8, 6]]) { p.circle(x, y, 2.6, c); p.set(x - 1, y - 1, shade(c, 0.5)); } p.line(8, 3, 9, 1, '#5aa03a'); break; }
      case 'round': { p.circle(8, 9, 5.5, c); p.ellipse(6, 7, 2, 1.5, shade(c, 0.45)); if (c2 && c2 !== '#5aa03a') for (let y = 5; y < 14; y += 3) p.line(4, y, 12, y + 1, c2); p.rect(7, 2, 2, 2, '#5aa03a'); break; }
      case 'corn': { p.ellipse(8, 8, 3.5, 6.5, c); for (let y = 3; y < 14; y += 2) { p.set(7, y, shade(c, -0.2)); p.set(9, y + 1, shade(c, -0.2)); } p.poly([[4, 15], [6, 6], [8, 15]], '#6ab03a'); p.poly([[12, 15], [10, 6], [8, 15]], '#5a9a3a'); break; }
      case 'pepper': { p.ellipse(8, 10, 3.5, 5.5, c); p.set(7, 7, shade(c, 0.5)); p.rect(7, 3, 2, 2, '#5aa03a'); p.set(9, 2, '#5aa03a'); break; }
      case 'gourd': { p.ellipse(8, 10, 7, 5, shade(c, -0.15)); p.ellipse(5.5, 10, 3, 4.5, c); p.ellipse(10.5, 10, 3, 4.5, c); p.ellipse(8, 10, 2.5, 5, shade(c, 0.1)); p.rect(7, 3, 2, 3, '#6a8a2a'); p.set(6, 10, '#3a2010'); p.set(10, 10, '#3a2010'); p.line(6, 12, 10, 12, '#3a2010'); break; }
      case 'grape': { for (let k = 0; k < 6; k++) { const x = 6 + (k % 3) * 2 - (k > 2 ? -1 : 0), y = 6 + Math.floor(k / 3) * 3; p.circle(x, y, 2, c); } p.circle(8, 12, 2, c); p.set(5, 5, shade(c, 0.5)); p.line(8, 3, 9, 1, '#5aa03a'); break; }
      case 'flower': { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; p.circle(8 + Math.cos(a) * 3.5, 7 + Math.sin(a) * 3.5, 2.2, c); } p.circle(8, 7, 2, '#ffb030'); p.line(8, 10, 8, 15, '#5aa03a'); p.ellipse(10, 13, 2, 1, '#5aa03a'); break; }
      case 'mushroom': { p.rect(6, 8, 4, 6, '#f0e6cc'); p.ellipse(8, 7, 6, 4, c); p.set(5, 6, '#ffffff'); p.set(10, 5, '#ffffff'); p.set(8, 7, '#ffffff'); break; }
      case 'nut': { p.ellipse(8, 10, 4.5, 4, c); p.ellipse(8, 6, 4.5, 2, shade(c, -0.3)); p.set(6, 9, shade(c, 0.4)); break; }
      case 'gem': { p.poly([[8, 1], [14, 6], [8, 15], [2, 6]], c); p.poly([[8, 1], [8, 15], [2, 6]], shade(c, 0.3)); p.line(2, 6, 14, 6, shade(c, -0.2)); break; }
      case 'shell': { p.ellipse(8, 9, 6, 5, c); for (let i = -2; i <= 2; i++) p.line(8, 14, 8 + i * 2.5, 5, shade(c, -0.25)); break; }
      case 'sap': { p.ellipse(8, 10, 4, 4.5, c); p.poly([[5, 9], [8, 2], [11, 9]], c); p.set(6, 9, '#ffffff'); break; }
      case 'fiber': { for (let i = 0; i < 5; i++) p.line(4 + i * 2, 15, 6 + i, 2, i % 2 ? c : shade(c, -0.2)); p.rect(4, 9, 9, 2, '#c8a060'); break; }
      case 'wood': { p.rect(2, 6, 12, 6, c); p.ellipse(13, 9, 2, 3, '#d8b080'); p.ellipse(13, 9, 1, 1.5, '#a8743f'); p.line(2, 8, 11, 8, shade(c, -0.3)); break; }
      case 'stone': { p.ellipse(8, 10, 6, 4.5, c); p.ellipse(6.5, 8.5, 2.5, 1.5, shade(c, 0.3)); break; }
      case 'ore': { p.ellipse(8, 9, 6, 5, '#7a7284'); for (const [x, y] of [[5, 8], [9, 7], [10, 11], [7, 11], [11, 9]]) { p.rect(x, y, 2, 2, c); } break; }
      case 'goo': { p.ellipse(8, 11, 6, 3.5, c); p.ellipse(8, 8, 3.5, 3, c); p.set(6, 7, '#ffffff'); break; }
      case 'wing': { p.poly([[2, 6], [14, 4], [12, 8], [14, 12], [6, 10]], c); p.line(2, 6, 12, 8, shade(c, 0.3)); break; }
      case 'dust': { p.ellipse(8, 11, 5, 3.5, '#d8c8b0'); for (let i = 0; i < 9; i++) p.set(4 + (i * 5) % 9, 3 + (i * 3) % 8, c); break; }
      case 'heart': { p.circle(5.5, 6, 3.5, c); p.circle(10.5, 6, 3.5, c); p.poly([[2, 7], [14, 7], [8, 14]], c); p.set(4, 5, '#ffffff'); break; }
      case 'egg': { p.ellipse(8, 9, 4.5, 5.5, c); for (const [x, y] of [[6, 8], [10, 10], [8, 12]]) p.set(x, y, '#e8b8d8'); p.set(6, 6, '#ffffff'); break; }
      case 'wool': { for (const [x, y] of [[5, 7], [10, 7], [8, 10], [4, 11], [12, 11]]) p.circle(x, y, 3, c); p.set(5, 6, '#ffffff'); break; }
      case 'ember': { p.circle(8, 9, 5, shade(c, -0.4)); p.circle(8, 9, 3.5, c); p.circle(7, 8, 1.5, '#fff1a8'); break; }
      case 'fish': case 'eel': {
        if (shape === 'eel') { p.thick(2, 10, 13, 8, c, 3); p.set(13, 8, '#ffffff'); p.line(2, 10, 1, 12, c); }
        else { p.ellipse(7, 9, 5.5, 3.5, c); p.poly([[11, 9], [15, 5], [15, 13]], shade(c, -0.15)); p.set(4, 8, '#1a1424'); p.line(5, 11, 9, 11, shade(c, 0.35)); p.poly([[6, 6], [9, 4], [9, 6]], shade(c, -0.2)); }
        break;
      }
      case 'boot': { p.rect(4, 2, 5, 9, c); p.rect(4, 10, 10, 4, c); p.rect(4, 13, 10, 1, '#3a2a20'); break; }
      case 'algae': { for (let i = 0; i < 4; i++) p.thick(4 + i * 3, 15, 5 + i * 3 + (i % 2 ? 1 : -1), 3, i % 2 ? c : shade(c, 0.2), 1); break; }
      case 'cookie': { p.circle(8, 8, 6, c); for (const [x, y] of [[6, 6], [10, 7], [7, 10], [10, 11]]) p.rect(x, y, 2, 1, '#5a3a20'); p.circle(5, 4, 1.5, '#ffffff'); p.set(8, 5, '#1a1424'); p.set(10, 5, '#1a1424'); break; }
      case 'feed': { p.poly([[3, 15], [4, 4], [12, 4], [13, 15]], c); p.rect(5, 2, 6, 3, shade(c, -0.2)); p.rect(5, 8, 6, 4, '#f0e6cc'); p.set(7, 9, '#c84a4a'); p.set(9, 9, '#c84a4a'); break; }
      case 'fert': { p.poly([[3, 15], [4, 4], [12, 4], [13, 15]], c); p.rect(5, 2, 6, 3, shade(c, -0.2)); p.circle(8, 10, 2.5, '#7ad04a'); break; }
      case 'chest': { p.rect(1, 5, 14, 10, '#a06838'); p.rect(1, 5, 14, 1, '#c99060'); p.rect(1, 9, 14, 1, '#6a4020'); p.rect(7, 8, 2, 3, '#e8c45a'); break; }
      case 'bowl': { p.ellipse(8, 10, 6.5, 4, '#f0e6cc'); p.ellipse(8, 8, 5.5, 2, c); p.rect(2, 8, 13, 1, '#d8ccb0'); for (const [x, y] of [[6, 7], [9, 8], [11, 7]]) p.set(x, y, shade(c, -0.3)); p.set(7, 4, '#e0e0f0'); p.set(9, 3, '#e0e0f0'); break; }
      case 'pie': { p.ellipse(8, 10, 6.5, 4, '#d8a050'); p.ellipse(8, 8, 5.5, 2.5, c); for (let x = 4; x < 13; x += 3) p.line(x, 6, x + 2, 10, '#e8c080'); break; }
      case 'bread': { p.ellipse(8, 10, 6.5, 4, c); p.ellipse(8, 8, 6, 3, shade(c, 0.2)); p.line(5, 7, 6, 9, shade(c, -0.3)); p.line(9, 7, 10, 9, shade(c, -0.3)); break; }
      default: p.circle(8, 8, 5, '#ff00ff');
    }
    p.outline(OUT);
    return (this.cache[id] = p.toCanvas());
  },
  reset(id) { delete this.cache[id]; },
};

// ------------------------------------------------------------
//  Personagens
// ------------------------------------------------------------
const PLAYER_LOOKS = [
  { skin: '#f2c9a0', hair: '#c4552a', hairStyle: 'ponytail', shirt: '#4a8ac8', pants: '#5a4a30', belt: '#7a4a20', hat: '#e8c060', blush: true },
  { skin: '#a8704a', hair: '#2a1a14', hairStyle: 'spiky', shirt: '#d84a4a', pants: '#3a4a7a', belt: '#5a3a20', hat: '#e8c060' },
];
const CharArt = {
  cache: {},
  get(lookKey, look, dir, frame) {
    const key = lookKey + dir + frame;
    if (this.cache[key]) return this.cache[key];
    const p = dir === 'right' ? humanoid(look, 'left', frame).flipX() : humanoid(look, dir, frame);
    return (this.cache[key] = p.toCanvas());
  },
};
function portraitSprite(id) {
  if (id === 'player') return CharArt.get('player' + State.look, PLAYER_LOOKS[State.look], 'down', 0);
  if (NPCS[id]) return CharArt.get('npc_' + id, NPCS[id].look, 'down', 0);
  if (id === 'vovo') return CharArt.get('vovo', { skin: '#f2c9a0', hair: '#e8e4dc', hairStyle: 'bun', dress: '#8a5aaa', glasses: true }, 'down', 0);
  return null;
}

// ------------------------------------------------------------
//  Monstrinhos e inimigos (2 quadros de animação)
// ------------------------------------------------------------
const MonArt = {
  cache: {},
  get(kind, c, frame = 0, size = 16) {
    const key = kind + c + frame + size;
    return this.cache[key] || (this.cache[key] = this.make(kind, c, frame, size).toCanvas());
  },
  make(kind, c, frame, s) {
    let p = new PixelArt(s, s);
    const d = shade(c, -0.3), l = shade(c, 0.4);
    const sq = frame ? 1 : 0; // achatado no quadro 1
    const cx = s / 2;
    const face = (x, y, gap = 4, blush = true) => {
      p.rect(x, y, 1, 2, '#1a1424'); p.rect(x + gap, y, 1, 2, '#1a1424');
      p.set(x, y, '#ffffff');
      if (blush) { p.set(x - 1, y + 2, '#ff9ab8'); p.set(x + gap + 1, y + 2, '#ff9ab8'); }
      p.set(x + gap / 2, y + 3, '#1a1424');
    };
    switch (kind) {
      case 'drop': {
        p.poly([[cx - 6, s - 6], [cx, 1 + sq], [cx + 6, s - 6]], c);
        p.ellipse(cx, s - 6, 6.5 + sq * 0.5, 5 - sq * 0.5, c);
        p.ellipse(cx - 2, s - 8, 1.5, 2.5, l);
        face(cx - 3, s - 7, 5);
        break;
      }
      case 'sprout': {
        p.ellipse(cx, s - 5, 6, 5 - sq * 0.5, c);
        p.line(cx, s - 9, cx, s - 13, '#4a8a3a');
        p.ellipse(cx - 3, s - 13 + sq, 3, 1.6, '#6ad04a'); p.ellipse(cx + 3, s - 14 + sq, 3, 1.6, '#4ab03a');
        face(cx - 3, s - 7, 5);
        p.rect(cx - 4, s - 1, 2, 1, d); p.rect(cx + 2, s - 1, 2, 1, d);
        break;
      }
      case 'shroom': {
        p.rect(cx - 3, s - 7, 6, 6, '#f0e6cc');
        p.ellipse(cx, s - 9 + sq, 7, 5, c); p.rect(cx - 7, s - 8 + sq, 14, 1, d);
        for (const [x, y] of [[cx - 4, s - 11], [cx + 2, s - 12], [cx + 4, s - 9]]) p.set(x, y + sq, '#ffffff');
        face(cx - 2, s - 6, 4, true);
        break;
      }
      case 'puff': {
        p.circle(cx, s - 7 + sq * 0.5, 6.5, c);
        p.ellipse(cx - 6, s - 7, 2, 3, shade(c, -0.1)); p.ellipse(cx + 6, s - 7, 2, 3, shade(c, -0.1));
        p.poly([[cx - 1, s - 7], [cx + 1, s - 7], [cx, s - 5]], '#ffa030');
        face(cx - 3, s - 10, 5, true);
        p.set(cx, s - 14, '#ff8a2a'); p.set(cx - 1, s - 15, '#ff8a2a');
        p.rect(cx - 3, s - 1, 1, 1, '#ffa030'); p.rect(cx + 2, s - 1, 1, 1, '#ffa030');
        break;
      }
      case 'wool': {
        for (const [x, y] of [[cx - 4, s - 7], [cx + 4, s - 7], [cx, s - 10], [cx - 2, s - 5], [cx + 3, s - 5]]) p.circle(x, y + sq * 0.5, 4, c);
        p.ellipse(cx - 4, s - 7, 3, 3, '#5a4a5a');
        p.set(cx - 5, s - 8, '#ffffff'); p.set(cx - 3, s - 8, '#ffffff');
        p.rect(cx - 3, s - 2, 1, 2, '#5a4a5a'); p.rect(cx + 3, s - 2, 1, 2, '#5a4a5a');
        break;
      }
      case 'pebble': {
        p.ellipse(cx, s - 6, 6.5, 5.5 - sq * 0.5, c); p.ellipse(cx - 2, s - 8, 2.5, 1.5, l);
        p.rect(cx - 7, s - 7, 2, 3, d); p.rect(cx + 5, s - 7, 2, 3, d);
        face(cx - 3, s - 7, 5);
        p.set(cx + 3, s - 11, '#7ad04a'); p.set(cx + 2, s - 11, '#7ad04a');
        break;
      }
      case 'spark': {
        p.poly([[cx - 5, s - 5], [cx, 1 + sq], [cx + 5, s - 5]], shade(c, -0.1));
        p.ellipse(cx, s - 5, 5.5, 4.5, c); p.ellipse(cx, s - 6, 3, 2.5, '#ffe08a');
        face(cx - 3, s - 7, 5, false);
        break;
      }
      case 'slime': {
        p.ellipse(cx, s - 5 + sq, s * 0.42 + sq, s * 0.32 - sq, d);
        p.ellipse(cx - 0.5, s - 6 + sq, s * 0.38 + sq, s * 0.28 - sq, c);
        p.rect(Math.round(cx - s * 0.42), s - 3, Math.round(s * 0.84), 2, d);
        p.ellipse(cx - s * 0.15, s - 9 + sq, 1.5, 1.2, l);
        p.rect(cx - 3, s - 7 + sq, 2, 2, '#1a1424'); p.rect(cx + 2, s - 7 + sq, 2, 2, '#1a1424'); p.set(cx - 3, s - 7 + sq, '#ff4a4a'); p.set(cx + 2, s - 7 + sq, '#ff4a4a');
        break;
      }
      case 'king': {
        p.ellipse(cx, s - 12 + sq, s * 0.46, s * 0.34 - sq, d);
        p.ellipse(cx - 1, s - 13 + sq, s * 0.42, s * 0.3 - sq, c);
        p.ellipse(cx - 8, s - 22 + sq, 4, 3, l);
        for (let i = 0; i < 5; i++) p.poly([[cx - 10 + i * 5, 12 + sq], [cx - 8 + i * 5, 4 + sq], [cx - 6 + i * 5, 12 + sq]], '#ffd040');
        p.rect(cx - 10, 11 + sq, 22, 3, '#e8a020');
        p.rect(cx - 8, s - 16 + sq, 4, 4, '#1a1424'); p.rect(cx + 5, s - 16 + sq, 4, 4, '#1a1424'); p.set(cx - 8, s - 16 + sq, '#ff4a4a'); p.set(cx + 5, s - 16 + sq, '#ff4a4a');
        p.rect(cx - 5, s - 9 + sq, 10, 2, '#3a0a3a');
        break;
      }
      case 'bat': {
        const w = frame ? -3 : 0;
        p.poly([[cx, cx], [1, cx - 6 - w], [3, cx + 2], [6, cx], [cx - 2, cx + 3]], d);
        p.poly([[cx, cx], [s - 1, cx - 6 - w], [s - 3, cx + 2], [s - 6, cx], [cx + 2, cx + 3]], d);
        p.ellipse(cx, cx + 1, 3.5, 4, c);
        p.poly([[cx - 3, cx - 2], [cx - 3, cx - 6], [cx - 1, cx - 2]], c); p.poly([[cx + 3, cx - 2], [cx + 3, cx - 6], [cx + 1, cx - 2]], c);
        p.set(cx - 2, cx, '#ffd040'); p.set(cx + 1, cx, '#ffd040');
        break;
      }
      case 'crab': {
        p.ellipse(cx, s - 6, 6.5, 4.5 - sq * 0.5, c); p.ellipse(cx - 2, s - 8, 2.5, 1.2, l);
        p.rect(cx - 8, s - 9 + sq, 3, 3, d); p.rect(cx + 5, s - 9 + sq, 3, 3, d);
        for (let i = 0; i < 3; i++) { p.line(cx - 4 + i * 4, s - 3, cx - 5 + i * 4, s - 1, d); }
        p.rect(cx - 3, s - 9, 1, 2, '#ff4a4a'); p.rect(cx + 2, s - 9, 1, 2, '#ff4a4a');
        break;
      }
      case 'wisp': {
        p.poly([[cx - 5, s - 6], [cx - 1, 2 + sq], [cx + 1, 4], [cx + 5, s - 6]], shade(c, -0.15));
        p.ellipse(cx, s - 6, 5.5, 4.5, c); p.ellipse(cx, s - 7, 3, 2.5, l);
        p.rect(cx - 3, s - 7, 2, 2, '#1a1424'); p.rect(cx + 2, s - 7, 2, 2, '#1a1424');
        break;
      }
      case 'spider': {
        for (let i = 0; i < 4; i++) { const y = s - 9 + i * 2; p.line(cx - 3, y, cx - 8, y - 2 + (frame ? 2 : 0) + i, d); p.line(cx + 3, y, cx + 8, y - 2 + (frame ? 0 : 2) + i, d); }
        p.ellipse(cx, s - 7, 5, 4, c); p.ellipse(cx, s - 11, 3, 2.5, shade(c, -0.1));
        p.poly([[cx - 2, s - 5], [cx, s - 12], [cx + 2, s - 5]], l);
        p.set(cx - 1, s - 12, '#ff4a4a'); p.set(cx + 1, s - 12, '#ff4a4a');
        break;
      }
      case 'golem': {
        p = MONSTER_ART.golem({ size: s, c, moss: true, eye: '#ffe04a', core: '#7ad04a' });
        if (frame) p = p.flipX();
        return p;
      }
    }
    return p.outline(OUT);
  },
};

// sprites fixos (lixeira de envio, cocho, barraca etc.)
const Props = {
  cache: {},
  get(kind, frame = 0) {
    const key = kind + frame;
    return this.cache[key] || (this.cache[key] = this.make(kind, frame).toCanvas());
  },
  make(kind, frame) {
    let p = new PixelArt(16, 16);
    switch (kind) {
      case 'bin': p.rect(1, 5, 14, 10, '#8a5a32'); p.rect(1, 3, 14, 3, '#b07a46'); p.rect(1, 3, 14, 1, '#d4a06a'); for (let x = 4; x < 14; x += 4) p.rect(x, 6, 1, 9, '#6a4020'); p.rect(5, 8, 6, 3, '#e8d8b0'); p.rect(6, 9, 4, 1, '#8a5a32'); break;
      case 'trough': p.rect(0, 7, 16, 7, '#8a5a32'); p.rect(1, 8, 14, 3, '#5a3a20'); p.rect(0, 7, 16, 1, '#b07a46'); p.rect(1, 13, 2, 3, '#6a4020'); p.rect(13, 13, 2, 3, '#6a4020'); break;
      case 'trough_full': p.rect(0, 7, 16, 7, '#8a5a32'); p.rect(1, 8, 14, 3, '#d8b860'); for (let x = 2; x < 14; x += 2) p.set(x, 8, '#f0d880'); p.rect(0, 7, 16, 1, '#b07a46'); p.rect(1, 13, 2, 3, '#6a4020'); p.rect(13, 13, 2, 3, '#6a4020'); break;
      case 'box': p.rect(2, 5, 12, 10, '#c89a5a'); p.rect(2, 5, 12, 2, '#e8c080'); p.rect(2, 10, 12, 1, '#a07a40'); p.circle(8, 12, 1.5, '#ff7ab8'); break;
      case 'box_full': p.rect(2, 5, 12, 10, '#c89a5a'); p.rect(2, 5, 12, 2, '#e8c080'); p.circle(6, 4, 2, '#fff4d8'); p.circle(10, 4, 2, '#ff7ab8'); p.rect(2, 10, 12, 1, '#a07a40'); break;
      case 'radio': p.rect(2, 5, 12, 9, '#c84a3a'); p.rect(3, 6, 6, 7, '#3a2a2a'); for (let y = 7; y < 13; y += 2) p.rect(3, y, 6, 1, '#6a4a4a'); p.circle(11.5, 8, 1.5, '#e8c45a'); p.line(12, 5, 14, 1, '#9a9aa8'); break;
      case 'altar': p.rect(3, 9, 10, 7, '#8a8296'); p.rect(2, 7, 12, 3, '#a59cb2'); p.circle(8, 4 + (frame ? 0.5 : 0), 2.5, '#a8b8ff'); p.circle(8, 4, 1.2, '#ffffff'); break;
      case 'cave': p.fill('#2c2434'); p.ellipse(8, 11, 6.5, 8, '#06040a'); p.rect(2, 2, 12, 2, '#6b4526'); p.rect(2, 2, 2, 14, '#6b4526'); p.rect(12, 2, 2, 14, '#6b4526'); break;
      case 'stall': { p = new PixelArt(32, 32); for (let x = 0; x < 32; x += 4) p.rect(x, 2, 4, 8, (x / 4) % 2 ? '#ffffff' : '#e84a6a'); p.rect(0, 9, 32, 2, '#c83a5a'); p.rect(2, 10, 2, 20, '#8a5a32'); p.rect(28, 10, 2, 20, '#8a5a32'); p.rect(0, 20, 32, 10, '#a8743f'); p.rect(0, 20, 32, 2, '#d4a06a'); for (const [x, c] of [[4, '#ff4a5a'], [10, '#ffd040'], [16, '#7ad04a'], [22, '#ff8a2a']]) p.circle(x + 2, 18, 2.5, c); break; }
      case 'forge': { p = new PixelArt(32, 32); p.rect(0, 12, 32, 20, '#6a646e'); p.rect(0, 12, 32, 2, '#8a848e'); p.rect(4, 18, 10, 10, '#1a1010'); p.rect(5, 22, 8, 5, ['#ff7a2a', '#ffb347', '#ff5a1f'][frame % 3]); p.rect(7, 20, 4, 3, '#ffe08a'); p.rect(18, 20, 10, 4, '#3a3a42'); p.rect(20, 24, 6, 6, '#2a2a32'); for (let x = 0; x < 32; x += 4) p.rect(x, 4, 4, 8, (x / 4) % 2 ? '#5a5a66' : '#3a3a48'); break; }
      case 'sign': p.rect(7, 9, 2, 7, '#6b4526'); p.rect(2, 2, 12, 8, '#a8743f'); p.rect(2, 2, 12, 1, '#c99a60'); p.rect(4, 4, 8, 1, '#5e3a1e'); p.rect(4, 6, 6, 1, '#5e3a1e'); break;
      case 'mailbox': p.rect(7, 8, 2, 8, '#6b4526'); p.rect(3, 3, 10, 6, '#4a73b8'); p.ellipse(8, 3, 5, 2, '#4a73b8'); p.rect(12, 2, 1, 4, '#e83a3a'); break;
    }
    return p.outline(OUT);
  },
};
