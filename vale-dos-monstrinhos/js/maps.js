'use strict';
// ============================================================
//  Mapas do Vale dos Monstrinhos
// ============================================================

const MAPS = {};

// Construtor de mapas determinístico (evita erros de contagem em ASCII)
const MB = {
  make(w, h, ch) { return { w, h, t: Array.from({ length: h }, () => Array(w).fill(ch)), prot: new Set() }; },
  set(g, x, y, ch, prot) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < g.w && y < g.h) { g.t[y][x] = ch; if (prot) g.prot.add(x + ',' + y); } },
  get(g, x, y) { return x >= 0 && y >= 0 && x < g.w && y < g.h ? g.t[y][x] : null; },
  rect(g, x, y, w, h, ch, prot) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(g, x + i, y + j, ch, prot); return g; },
  border(g, ch, th = 1) { for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (x < th || y < th || x >= g.w - th || y >= g.h - th) g.t[y][x] = ch; return g; },
  stamp(g, x, y, rows, prot) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== ' ') this.set(g, x + i, y + j, c, prot); })); return g; },
  ellipse(g, cx, cy, rx, ry, ch, prot = true) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(g, x, y, ch, prot);
    }
    return g;
  },
  // escava um caminho ao longo de uma linha poligonal com pincel quadrado
  path(g, pts, wd = 3, ch = '.', prot = true) {
    const o0 = -Math.floor((wd - 1) / 2);
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / Math.max(1, n)), y = Math.round(y0 + (y1 - y0) * k / Math.max(1, n));
        for (let a = 0; a < wd; a++) for (let b = 0; b < wd; b++) this.set(g, x + o0 + a, y + o0 + b, ch, prot);
      }
    }
    return g;
  },
  protect(g, x, y, r = 0) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) g.prot.add((x + i) + ',' + (y + j)); },
  // espalha um tile de forma determinística (não toca em áreas protegidas)
  scatter(g, ch, n, seed, on = ['.'], area) {
    const R = U.seeded(seed);
    const [ax, ay, aw, ah] = area || [0, 0, g.w, g.h];
    let tries = 0, placed = 0;
    while (placed < n && tries++ < n * 40) {
      const x = ax + Math.floor(R() * aw), y = ay + Math.floor(R() * ah);
      if (g.prot.has(x + ',' + y)) continue;
      if (!on.includes(this.get(g, x, y))) continue;
      g.t[y][x] = ch; placed++;
    }
    return g;
  },
  // casa: telhado (2 linhas) + parede com porta; retorna a posição da porta
  house(g, x, y, w, roof = 'R') {
    this.rect(g, x, y, w, 2, roof, true);
    const mid = Math.floor(w / 2);
    for (let i = 0; i < w; i++) this.set(g, x + i, y + 2, i === mid ? 'D' : (i === 1 || i === w - 2) ? 'W' : 'H', true);
    return { x: x + mid, y: y + 2 };
  },
  rows(g) { return g.t.map(r => r.join('')); },
};


// ------------------------------------------------------------
//  Fazenda
// ------------------------------------------------------------
const FARM_FIELD = [3, 9, 21, 21]; // x, y, w, h (área com entulho inicial)
(function () {
  const g = MB.make(44, 34, '.');
  MB.rect(g, 0, 0, 44, 2, 'T'); MB.border(g, 'T');
  MB.house(g, 5, 2, 7, 'R');
  MB.house(g, 30, 3, 7, 'Q');
  MB.path(g, [[8, 5], [8, 7], [33, 7]], 1, ':');
  MB.path(g, [[33, 6], [33, 8]], 1, ':');
  MB.path(g, [[25, 7], [25, 17], [43, 17]], 1, ':');
  MB.path(g, [[20, 30], [20, 33]], 1, ':');
  for (let x = 28; x <= 41; x++) { if (x !== 33) MB.set(g, x, 9, 'f', true); MB.set(g, x, 16, 'f', true); }
  for (let y = 9; y <= 16; y++) { MB.set(g, 28, y, 'f', true); MB.set(g, 41, y, 'f', true); }
  MB.rect(g, 29, 10, 12, 6, '.', true);
  MB.ellipse(g, 34, 26, 5.5, 3.6, ';', true); MB.ellipse(g, 34, 26, 4.5, 2.8, '~', true);
  MB.set(g, 14, 6, 'w', true);
  MB.rect(g, 2, 5, 2, 2, 'F', true);
  for (const [x, y] of [[11, 5], [10, 5], [29, 6], [37, 6], [24, 8], [30, 24], [33, 17], [8, 6], [14, 7]]) MB.protect(g, x, y, 0);
  MB.scatter(g, ',', 30, 901, ['.'], [2, 2, 40, 30]); MB.scatter(g, '"', 20, 902, ['.'], [26, 18, 16, 14]);
  MAPS.fazenda = {
    name: 'Sítio da Vó Lurdes', music: 'farm', outdoor: true, fish: 'lagoa', persist: true, tiles: MB.rows(g),
    ents: [
      { type: 'warp', x: 8, y: 4, to: 'casa', tx: 5, ty: 7, dir: 'up', door: true },
      { type: 'warp', x: 43, y: 17, to: 'vila', tx: 1, ty: 16, dir: 'right' },
      { type: 'warp', x: 20, y: 33, to: 'bosque', tx: 20, ty: 1, dir: 'down' },
      { type: 'bin', x: 11, y: 5 },
      { type: 'trough', x: 37, y: 6 },
      { type: 'box', x: 29, y: 6 },
      { type: 'barn', x: 33, y: 5 },
      { type: 'sign', x: 24, y: 8, text: 'Sítio da Vó Lurdes. "Aqui moram plantas felizes e monstrinhos mais felizes ainda."' },
    ],
    pasture: [29, 10, 12, 6],
  };
})();

// ------------------------------------------------------------
//  Casa
// ------------------------------------------------------------
MAPS.casa = {
  name: 'Casa', music: 'farm', indoor: true, tiles: [
    '############',
    '#kkq####kk##',
    '#__________#',
    '#B_________#',
    '#B___tt____#',
    '#_____mm___#',
    '#K____mm__V#',
    '#__________#',
    '#####D######',
  ],
  ents: [
    { type: 'warp', x: 5, y: 8, to: 'fazenda', tx: 8, ty: 5, dir: 'down', door: true },
    { type: 'bed', x: 1, y: 3 }, { type: 'bed', x: 1, y: 4 },
    { type: 'radio', x: 10, y: 2 },
  ],
};

// ------------------------------------------------------------
//  Vila Bruma
// ------------------------------------------------------------
(function () {
  const g = MB.make(44, 32, '.');
  MB.rect(g, 0, 0, 44, 2, 'T'); MB.border(g, 'T');
  MB.rect(g, 14, 10, 17, 11, 's', true);
  MB.path(g, [[0, 16], [14, 16]], 1, ':');
  MB.path(g, [[22, 10], [22, 0]], 1, ':');
  MB.house(g, 4, 3, 5, 'R'); MB.path(g, [[6, 6], [6, 16]], 1, ':');
  MB.house(g, 3, 7, 5, 'Q');
  MB.house(g, 33, 3, 7, 'G'); MB.path(g, [[36, 6], [36, 9], [31, 9]], 1, ':');
  MB.house(g, 33, 17, 5, 'R'); MB.path(g, [[35, 20], [35, 21], [31, 21]], 1, ':');
  MB.house(g, 15, 23, 5, 'Q'); MB.path(g, [[17, 21], [17, 22]], 1, ':');
  MB.rect(g, 0, 27, 44, 2, '~', true); MB.rect(g, 0, 26, 44, 1, ';', true); MB.rect(g, 0, 29, 44, 1, ';', true);
  MB.set(g, 22, 15, 'w', true); MB.set(g, 18, 13, 'z', true);
  for (const [x, y] of [[13, 9], [31, 9], [13, 21], [31, 20]]) MB.set(g, x, y, 'E', true);
  MB.rect(g, 25, 3, 5, 3, 'F', true);
  for (const [x, y] of [[15, 12], [30, 12], [9, 9], [24, 9], [35, 6], [23, 17], [31, 21], [20, 21], [27, 5], [20, 13], [12, 15]]) MB.protect(g, x, y, 1);
  MB.scatter(g, ',', 25, 911); MB.scatter(g, 'b', 6, 912, ['.'], [2, 2, 40, 22]);
  MAPS.vila = {
    name: 'Vila Bruma', music: 'town', outdoor: true, fish: 'rio', persist: true, tiles: MB.rows(g),
    ents: [
      { type: 'warp', x: 0, y: 16, to: 'fazenda', tx: 42, ty: 17, dir: 'left' },
      { type: 'warp', x: 22, y: 0, to: 'montanha', tx: 20, ty: 28, dir: 'up' },
      { type: 'prop', x: 14, y: 10, w: 2, h: 2, art: 'stall' },
      { type: 'prop', x: 29, y: 10, w: 2, h: 2, art: 'forge', anim: true },
      { type: 'sign', x: 12, y: 15, text: 'Vila Bruma. Norte: Montanha e Caverna. Oeste: Sítio da Vó Lurdes.' },
      { type: 'sign', x: 16, y: 12, text: 'Barraca da Dona Flor — aberta das 9h às 17h.' },
      { type: 'sign', x: 28, y: 12, text: 'Ferraria do Seu Malho — melhorias e reformas, das 9h às 16h.' },
      { type: 'door', x: 6, y: 5, text: 'A casa da Dona Flor. Tem um vaso de flores em cada janela.' },
      { type: 'door', x: 5, y: 9, text: 'A casa da Vovó Nena. Cheira a bolo saindo do forno.' },
      { type: 'door', x: 36, y: 5, text: 'Laboratório da Íris. Uma placa diz: "Monstrologia — favor não alimentar os experimentos".' },
      { type: 'door', x: 35, y: 19, text: 'A casa do Pituco. Tem desenhos de monstrinhos colados na porta.' },
      { type: 'door', x: 17, y: 25, text: 'A casa do Davi. Varas de pesca encostadas na parede.' },
    ],
  };
})();

// ------------------------------------------------------------
//  Montanha
// ------------------------------------------------------------
(function () {
  const g = MB.make(40, 30, '.');
  MB.border(g, 'P');
  MB.rect(g, 0, 0, 40, 6, '^', true);
  MB.ellipse(g, 12, 13, 8.5, 6, ';', true); MB.ellipse(g, 12, 13, 7.5, 5, '~', true);
  MB.path(g, [[20, 29], [20, 22], [28, 14], [28, 6]], 1, ':');
  for (const [x, y] of [[12, 19], [30, 16], [24, 9], [28, 6], [27, 7], [29, 7]]) MB.protect(g, x, y, 1);
  MB.scatter(g, 'P', 26, 921, ['.'], [1, 6, 38, 23]); MB.scatter(g, ',', 20, 922); MB.scatter(g, '"', 20, 923);
  MAPS.montanha = {
    name: 'Montanha', music: 'mountain', outdoor: true, fish: 'lago', persist: true, tiles: MB.rows(g),
    ents: [
      { type: 'warp', x: 20, y: 29, to: 'vila', tx: 22, ty: 1, dir: 'down' },
      { type: 'cave', x: 28, y: 5 },
      { type: 'sign', x: 30, y: 7, text: 'Caverna Brumosa. "Cuidado: monstros com bolor. Desça por sua conta e risco."' },
    ],
  };
})();

// ------------------------------------------------------------
//  Bosque
// ------------------------------------------------------------
(function () {
  const g = MB.make(40, 34, '.');
  MB.border(g, 'T'); MB.rect(g, 0, 0, 3, 34, 'T'); MB.rect(g, 37, 0, 3, 34, 'T');
  MB.rect(g, 30, 0, 2, 34, '~', true);
  MB.rect(g, 30, 22, 2, 1, '=', true);
  MB.path(g, [[20, 0], [20, 8]], 1, ':');
  MB.ellipse(g, 20, 14, 8, 5.5, '.', true);
  MB.ellipse(g, 20, 14, 6, 4, ',', true);
  MB.ellipse(g, 9, 25, 5, 4, 'F', true);
  MB.path(g, [[20, 20], [20, 26], [12, 26]], 1, ':');
  MB.path(g, [[20, 22], [29, 22]], 1, ':');
  for (const [x, y] of [[14, 12], [9, 25], [22, 29], [33, 22], [20, 16], [20, 17], [19, 17], [21, 17]]) MB.protect(g, x, y, 1);
  MB.scatter(g, 'T', 30, 931, ['.'], [3, 2, 27, 30]); MB.scatter(g, 'b', 12, 932, ['.'], [3, 2, 27, 30]); MB.scatter(g, '"', 30, 933); MB.scatter(g, 'T', 8, 934, ['.'], [32, 2, 5, 30]);
  MAPS.bosque = {
    name: 'Bosque da Árvore-Lua', music: 'forest', outdoor: true, fish: 'rio', persist: true, tiles: MB.rows(g),
    ents: [
      { type: 'warp', x: 20, y: 0, to: 'fazenda', tx: 20, ty: 32, dir: 'up' },
      { type: 'prop', x: 19, y: 12, w: 3, h: 3, art: 'moontree' },
      { type: 'altar', x: 20, y: 16 },
    ],
  };
})();

// ------------------------------------------------------------
//  Objetos iniciais e diários
// ------------------------------------------------------------
const GRASSY = { '.': 1, ',': 1, '"': 1 };
const FORAGE = { 0: ['frutinha', 'flor_lua'], 1: ['frutinha', 'concha'], 2: ['cogumelo_mato', 'avela'], 3: ['cristal_gelo'] };

function freeCells(mapId, area, ok = TILLABLE) {
  const m = MAPS[mapId], out = [];
  const [ax, ay, aw, ah] = area || [0, 0, m.tiles[0].length, m.tiles.length];
  const blocked = new Set((m.ents || []).flatMap(e => { const r = []; for (let i = 0; i < (e.w || 1); i++) for (let j = 0; j < (e.h || 1); j++) r.push((e.x + i) + ',' + (e.y + j)); return r; }));
  for (let y = ay; y < ay + ah; y++) for (let x = ax; x < ax + aw; x++) {
    const c = m.tiles[y] && m.tiles[y][x];
    if (!c || !ok[c]) continue;
    if (blocked.has(x + ',' + y)) continue;
    out.push([x, y]);
  }
  return out;
}

// células perto de onde moradores e monstrinhos ficam não recebem árvores/entulho
function nearSpot(mapId, x, y) {
  for (const s of Object.values(WILD_SPOTS)) if (s[0] === mapId && Math.abs(s[1] - x) <= 2 && Math.abs(s[2] - y) <= 2) return true;
  for (const n of Object.values(NPCS)) for (const s of n.sched) if (s[0] === mapId && Math.abs(s[1] - x) <= 1 && Math.abs(s[2] - y) <= 1) return true;
  return false;
}
function genInitialObjects() {
  const R = U.seeded(4242);
  const pick = arr => arr.splice(Math.floor(R() * arr.length), 1)[0];
  const o = State.objs;
  o.fazenda = {}; o.bosque = {}; o.montanha = {}; o.vila = {};
  // fazenda: entulho no campo e árvores nas bordas
  let cells = freeCells('fazenda', FARM_FIELD).filter(([x, y]) => !(x === 8 && y <= 8) && !(y === 7));
  for (const [k, n, hp] of [['weed', 55, 1], ['stone', 30, 1], ['branch', 26, 1], ['stump', 6, 4]]) for (let i = 0; i < n && cells.length; i++) { const [x, y] = pick(cells); o.fazenda[x + ',' + y] = { k, hp }; }
  cells = freeCells('fazenda', [2, 18, 23, 13], GRASSY).filter(([x, y]) => !o.fazenda[x + ',' + y] && x !== 20);
  for (let i = 0; i < 10 && cells.length; i++) { const [x, y] = pick(cells); o.fazenda[x + ',' + y] = { k: 'tree', hp: 8 }; }
  cells = freeCells('fazenda', [26, 18, 16, 14], GRASSY).filter(([x, y]) => Math.hypot((x - 34) / 6.5, (y - 26) / 4.6) > 1 && y !== 17 && !nearSpot('fazenda', x, y));
  for (let i = 0; i < 8 && cells.length; i++) { const [x, y] = pick(cells); o.fazenda[x + ',' + y] = { k: 'tree', hp: 8 }; }
  // bosque e montanha: árvores e pedras
  cells = freeCells('bosque', [3, 2, 26, 30], GRASSY).filter(([x, y]) => Math.hypot((x - 20) / 9, (y - 14) / 6.5) > 1 && x !== 20 && y !== 22 && y !== 26 && !nearSpot('bosque', x, y));
  for (let i = 0; i < 26 && cells.length; i++) { const [x, y] = pick(cells); o.bosque[x + ',' + y] = { k: 'tree', hp: 8 }; }
  for (let i = 0; i < 12 && cells.length; i++) { const [x, y] = pick(cells); o.bosque[x + ',' + y] = { k: 'branch', hp: 1 }; }
  cells = freeCells('montanha', [14, 6, 25, 22], GRASSY).filter(([x, y]) => y > 7 && !nearSpot('montanha', x, y));
  for (let i = 0; i < 18 && cells.length; i++) { const [x, y] = pick(cells); o.montanha[x + ',' + y] = { k: i < 4 ? 'ore_cobre' : 'stone', hp: i < 4 ? 2 : 1 }; }
  for (let i = 0; i < 10 && cells.length; i++) { const [x, y] = pick(cells); o.montanha[x + ',' + y] = { k: 'tree', hp: 8 }; }
}

// renova coleta, árvores e um pouco de mato a cada dia
function dailyObjects() {
  const R = Math.random;
  const season = State.season;
  for (const [mapId, n, area] of [['bosque', 6, [3, 2, 33, 30]], ['montanha', 3, [1, 6, 38, 23]], ['vila', 2, [2, 2, 40, 23]], ['fazenda', 1, [26, 18, 16, 14]]]) {
    const o = State.objs[mapId] || (State.objs[mapId] = {});
    const existing = Object.values(o).filter(x => x.k === 'forage').length;
    let cells = freeCells(mapId, area, GRASSY).filter(([x, y]) => !o[x + ',' + y]);
    for (let i = existing; i < n && cells.length; i++) {
      const [x, y] = cells.splice(Math.floor(R() * cells.length), 1)[0];
      o[x + ',' + y] = { k: 'forage', item: U.pick(FORAGE[season]) };
    }
  }
  // árvores voltam a crescer dos tocos
  for (const mapId of Object.keys(State.objs)) for (const ob of Object.values(State.objs[mapId])) {
    if (ob.k === 'treestump' && State.dayIndex >= ob.regrow) { ob.k = 'tree'; ob.hp = 8; delete ob.regrow; }
  }
  // um pouco de mato nasce na fazenda (não no inverno)
  if (season !== 3) {
    const o = State.objs.fazenda;
    const cells = freeCells('fazenda', FARM_FIELD).filter(([x, y]) => !o[x + ',' + y] && !State.soil[x + ',' + y] && y !== 7);
    for (let i = 0; i < 3 && cells.length; i++) { const [x, y] = cells.splice(Math.floor(R() * cells.length), 1)[0]; o[x + ',' + y] = { k: 'weed', hp: 1 }; }
  }
  // pedras e minério voltam na montanha
  const om = State.objs.montanha;
  if (Object.values(om).filter(x => x.k === 'stone' || x.k === 'ore_cobre').length < 10) {
    const cells = freeCells('montanha', [14, 8, 25, 20], GRASSY).filter(([x, y]) => !om[x + ',' + y]);
    for (let i = 0; i < 4 && cells.length; i++) { const [x, y] = cells.splice(Math.floor(R() * cells.length), 1)[0]; om[x + ',' + y] = R() < 0.3 ? { k: 'ore_cobre', hp: 2 } : { k: 'stone', hp: 1 }; }
  }
}

// ------------------------------------------------------------
//  Caverna: gerador de andares
// ------------------------------------------------------------
function genCaveFloor(floor) {
  const W = 32, H = 24;
  const R = Math.random;
  let t = [];
  if (floor === 20) {
    for (let y = 0; y < H; y++) { t.push([]); for (let x = 0; x < W; x++) t[y].push(((x - 16) / 13) ** 2 + ((y - 12) / 9.5) ** 2 <= 1 ? 'o' : 'C'); }
  } else {
    for (let y = 0; y < H; y++) { t.push([]); for (let x = 0; x < W; x++) t[y].push(x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 'C' : R() < 0.56 ? 'o' : 'C'); }
    for (let it = 0; it < 4; it++) {
      const n = t.map(r => r.slice());
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        let walls = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (t[y + j][x + i] === 'C') walls++;
        n[y][x] = walls >= 5 ? 'C' : 'o';
      }
      t = n;
    }
    // garante uma sala central e mantém só a maior região conectada
    for (let y = 9; y < 15; y++) for (let x = 12; x < 20; x++) t[y][x] = 'o';
    const seen = new Set([16 + ',' + 12]); const q = [[16, 12]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && t[ny] && t[ny][nx] === 'o') { seen.add(k); q.push([nx, ny]); } } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (t[y][x] === 'o' && !seen.has(x + ',' + y)) t[y][x] = 'C';
  }
  const objs = {}, start = floor === 20 ? [16, 19] : [16, 12];
  const floorCells = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (t[y][x] === 'o' && Math.hypot(x - start[0], y - start[1]) > 1.5) floorCells.push([x, y]);
  objs[start[0] + ',' + (start[1] - 1)] = { k: 'ladder_up' };
  const take = () => floorCells.splice(Math.floor(R() * floorCells.length), 1)[0];
  if (floor !== 20) {
    const nRocks = Math.floor(floorCells.length * 0.22);
    for (let i = 0; i < nRocks && floorCells.length; i++) {
      const [x, y] = take();
      if (objs[x + ',' + (y + 1)] && objs[x + ',' + (y + 1)].k === 'ladder_up') continue;
      const r = R();
      let k = R() < 0.5 ? 'rock' : 'rock2', hp = 1 + Math.floor(floor / 8);
      if (floor <= 6) { if (r < 0.14) { k = 'ore_cobre'; hp = 2; } else if (r < 0.17) { k = 'ore_gema'; hp = 2; } }
      else if (floor <= 13) { if (r < 0.08) { k = 'ore_cobre'; hp = 2; } else if (r < 0.2) { k = 'ore_ferro'; hp = 3; } else if (r < 0.23) { k = 'ore_gema'; hp = 3; } }
      else { if (r < 0.15) { k = 'ore_ferro'; hp = 3; } else if (r < 0.2) { k = 'ore_cristal'; hp = 4; } else if (r < 0.24) { k = 'ore_ametista'; hp = 4; } else if (r < 0.27) { k = 'ore_gema'; hp = 3; } }
      if (R() < 0.05 && floor > 4) { k = 'boulder'; hp = 6; }
      objs[x + ',' + y] = { k, hp };
    }
  }
  // inimigos
  const enemies = [];
  if (floor === 20) enemies.push({ id: 'rei_bolor', x: 16, y: 7 });
  else {
    const pool = Object.entries(ENEMIES).filter(([, e]) => !e.boss && floor >= e.floors[0] && floor <= e.floors[1]).map(([id]) => id);
    const n = Math.min(10, 3 + Math.floor(floor / 2));
    const far = floorCells.filter(([x, y]) => Math.hypot(x - start[0], y - start[1]) > 6);
    for (let i = 0; i < n && far.length; i++) { const [x, y] = far.splice(Math.floor(R() * far.length), 1)[0]; enemies.push({ id: U.pick(pool), x, y }); }
  }
  return { tiles: t.map(r => r.join('')), objs, start, enemies, floor };
}
