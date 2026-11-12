'use strict';
// ============================================================
//  Mundo: movimento livre, ferramentas, plantio, monstrinhos,
//  moradores, combate na caverna, pesca e passagem do tempo
// ============================================================

const OBJ_SOLID = { stone: 1, rock: 1, rock2: 1, ore_cobre: 1, ore_ferro: 1, ore_cristal: 1, ore_gema: 1, ore_ametista: 1, boulder: 1, branch: 1, stump: 1, tree: 1, treestump: 1, weed: 1, chest: 1, ladder_up: 1 };
const ROCKS = { stone: 1, rock: 1, rock2: 1, ore_cobre: 1, ore_ferro: 1, ore_cristal: 1, ore_gema: 1, ore_ametista: 1, boulder: 1 };
const WOODS = { branch: 1, stump: 1, tree: 1, treestump: 1 };
const FIXED_SOLID = { bin: 1, trough: 1, box: 1, barn: 1, sign: 1, radio: 1, bed: 1, altar: 1, cave: 1, prop: 1, door: 1 };
const WILD_SPOTS = { gotinha: ['bosque', 33, 22], brotinho: ['bosque', 9, 25], fungo: ['bosque', 22, 29], plumito: ['vila', 27, 5], lanudo: ['montanha', 30, 16], pedregulho: ['montanha', 24, 9] };
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const World = {
  map: null, p: null, ents: [], drops: [], parts: [], pops: [], projs: [], weather: [],
  busy: false, depth: 0, cam: { x: 0, y: 0 }, tAcc: 0, banner: null, cave: null, fishing: null, swing: null, feed: [],
  holdT: 0, lastSlot: -1, darkCv: null,

  // ---------------- carregamento ----------------
  load(id, tx, ty, dir) {
    let def, objs;
    if (id === 'caverna') {
      const c = this.cave;
      def = { name: c.floor === 20 ? 'Caverna — Fundo' : `Caverna — Andar ${c.floor}`, music: c.floor === 20 && !State.flags.rei ? 'boss' : 'cave', cave: true, tiles: c.data.tiles, ents: [] };
      objs = c.data.objs;
    } else { def = MAPS[id]; objs = def.persist ? (State.objs[id] || (State.objs[id] = {})) : {}; }
    const rows = def.tiles;
    const prevName = this.map && this.map.def.name;
    this.map = { id, def, w: rows[0].length, h: rows.length, grid: rows, objs, theme: def.indoor ? 'indoor' : def.cave ? 'cave' : State.seasonKey, base: def.indoor ? '_' : def.cave ? 'o' : '.', fixed: (def.ents || []).map(e => ({ ...e })), under: {} };
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[0].length; x++) {
      const td = TILE_DEFS[rows[y][x]]; if (!td || !td.over) continue;
      const cnt = {};
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = rows[y + dy] && rows[y + dy][x + dx]; if (c && 's_o;:'.includes(c)) cnt[c] = (cnt[c] || 0) + 1; }
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 2) this.map.under[x + ',' + y] = best[0];
    }
    this.p = { x: tx * TS + TS / 2, y: ty * TS + TS - 6, dir: dir || 'down', moving: false, anim: 0, inv: 0, kx: 0, ky: 0 };
    this.ents = []; this.drops = []; this.parts = []; this.projs = []; this.pops = [];
    this.swing = null; this.fishing = null;
    this.spawnNpcs(); this.spawnMonsters();
    if (def.cave) for (const en of this.cave.data.enemies) this.spawnEnemy(en.id, en.x, en.y);
    this.lastSlot = State.slot();
    this.playMusic();
    if (def.name && def.name !== prevName) this.banner = { text: def.name, t: 150 };
    this.initWeather();
    this.updateCam();
  },
  playMusic() {
    const d = this.map.def;
    let m = d.music;
    if (d.outdoor && (State.time >= 20 * 60)) m = 'night';
    if (d.outdoor && State.weather !== 'sol' && m !== 'night') m = 'rain';
    Audio2.play(m);
  },
  spawnNpcs() {
    this.ents = this.ents.filter(e => e.kind !== 'npc');
    const slot = State.slot();
    for (const [id, n] of Object.entries(NPCS)) {
      const s = n.sched[slot];
      if (!s || s[0] !== this.map.id) continue;
      if (State.weather !== 'sol' && slot === 1 && s[0] === 'fazenda') continue;
      this.ents.push({ kind: 'npc', id, x: s[1] * TS + TS / 2, y: s[2] * TS + TS - 6, dir: s[3] || 'down', hx: s[1], hy: s[2], wt: U.randi(60, 200), tx: null, anim: 0 });
    }
  },
  spawnMonsters() {
    const m = this.map;
    if (m.id === 'fazenda') {
      const [ax, ay, aw, ah] = m.def.pasture;
      for (const mon of State.monsters) this.ents.push({ kind: 'farmmon', m: mon, x: (ax + Math.random() * aw) * TS + TS / 2, y: (ay + Math.random() * ah) * TS + TS - 6, dir: 'down', wt: U.randi(30, 120), anim: Math.random() * 60 });
    }
    for (const [sp, spot] of Object.entries(WILD_SPOTS)) {
      if (spot[0] !== m.id) continue;
      const w = State.wild[sp] || {};
      if ((w.back || 0) > State.dayIndex) continue;
      this.ents.push({ kind: 'wild', sp, x: spot[1] * TS + TS / 2, y: spot[2] * TS + TS - 6, hx: spot[1], hy: spot[2], dir: 'down', wt: 60, anim: 0 });
    }
    if (m.def.cave && this.cave.floor >= 6 && this.cave.floor <= 14 && Math.random() < 0.35 && ((State.wild.faisquinha || {}).back || 0) <= State.dayIndex) {
      const cells = [];
      for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) if (m.grid[y][x] === 'o' && !m.objs[x + ',' + y]) cells.push([x, y]);
      const [x, y] = U.pick(cells);
      this.ents.push({ kind: 'wild', sp: 'faisquinha', x: x * TS + TS / 2, y: y * TS + TS - 6, hx: x, hy: y, dir: 'down', wt: 60, anim: 0 });
    }
  },
  spawnEnemy(id, tx, ty) {
    const e = ENEMIES[id];
    const hp = Math.round(e.hp * (1 + (this.cave ? Math.max(0, this.cave.floor - 10) * 0.03 : 0)));
    this.ents.push({ kind: 'enemy', id, e, x: tx * TS + TS / 2, y: ty * TS + TS - 6, hp, maxHp: hp, vx: 0, vy: 0, t: U.randi(20, 80), hit: 0, anim: Math.random() * 60, awake: !e.ambush, jump: 0, shootT: 90 });
  },

  // ---------------- consultas ----------------
  tile(tx, ty) { const m = this.map; if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return null; return m.grid[ty][tx]; },
  fixedAt(tx, ty) {
    for (const f of this.map.fixed) if (tx >= f.x && ty >= f.y && tx < f.x + (f.w || 1) && ty < f.y + (f.h || 1)) return f;
    return null;
  },
  solidAt(tx, ty) {
    const c = this.tile(tx, ty);
    if (c === null) return true;
    const d = TILE_DEFS[c];
    if (!d || d.solid) return true;
    const o = this.map.objs[tx + ',' + ty];
    if (o && OBJ_SOLID[o.k]) return true;
    const f = this.fixedAt(tx, ty);
    if (f && FIXED_SOLID[f.type]) return true;
    return false;
  },
  boxFree(x, y) {
    for (const [ox, oy] of [[-10, -9], [10, -9], [-10, -1], [10, -1], [0, -9], [0, -1]]) if (this.solidAt(Math.floor((x + ox) / TS), Math.floor((y + oy) / TS))) return false;
    return true;
  },
  ptile() { return [Math.floor(this.p.x / TS), Math.floor((this.p.y - 6) / TS)]; },
  target() {
    const p = this.p, [dx, dy] = DIRV[p.dir];
    return [Math.floor((p.x + dx * 34) / TS), Math.floor((p.y - 12 + dy * 34) / TS)];
  },
  areaTiles(tier, tx, ty) {
    const [dx, dy] = DIRV[this.p.dir];
    if (tier === 0) return [[tx, ty]];
    if (tier === 3) { const out = []; const cx = tx + dx, cy = ty + dy; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) out.push([cx + i, cy + j]); return out; }
    const n = tier === 1 ? 3 : 5; const out = [];
    for (let k = 0; k < n; k++) out.push([tx + dx * k, ty + dy * k]);
    return out;
  },
  entInFront() {
    const p = this.p, [dx, dy] = DIRV[p.dir];
    const fx = p.x + dx * 34, fy = p.y - 12 + dy * 34;
    let best = null, bd = 34;
    for (const e of this.ents) {
      if (e.kind === 'enemy') continue;
      const d = Math.hypot(e.x - fx, e.y - 12 - fy);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  },

  // ---------------- laço ----------------
  update() {
    const p = this.p;
    const top = G.top();
    const control = !this.busy && top && top.isWorld && !this.fishing;
    // tempo
    if (control) { this.tAcc++; if (this.tAcc >= 360) { this.tAcc = 0; this.timeStep(); } State.playTime += 1 / 60; }
    if (p.inv > 0) p.inv--;
    // knockback
    if (Math.abs(p.kx) + Math.abs(p.ky) > 0.1) { this.moveP(p.kx, 0); this.moveP(0, p.ky); p.kx *= 0.8; p.ky *= 0.8; }
    // ferramenta em uso
    if (this.swing) {
      this.swing.t++;
      if (this.swing.t === this.swing.hitAt) this.applyTool(this.swing.tool);
      if (this.swing.t >= this.swing.dur) this.swing = null;
    }
    if (this.fishing) this.updateFishing();
    if (Input.held.ok) this.holdT++; else this.holdT = 0;
    p.moving = false;
    if (control && !this.swing) {
      // atalhos da barra
      for (let i = 1; i <= 8; i++) if (Input.hit['s' + i]) { State.sel = i - 1; Audio2.sfx('cursor'); }
      if (Input.rep('prev')) { State.sel = (State.sel + 7) % 8; Audio2.sfx('cursor'); }
      if (Input.rep('next')) { State.sel = (State.sel + 1) % 8; Audio2.sfx('cursor'); }
      let dx = 0, dy = 0;
      if (Input.held.left) dx -= 1; if (Input.held.right) dx += 1; if (Input.held.up) dy -= 1; if (Input.held.down) dy += 1;
      if (dx || dy) {
        const last = Input.dirHeld();
        p.dir = (dx && dy) ? (last === 'up' || last === 'down' ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right')) : dx ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        const sp = (State.energy <= 0 ? 2.0 : 3.3) * (dx && dy ? 0.72 : 1);
        this.moveP(dx * sp, 0); this.moveP(0, dy * sp);
        p.moving = true; p.anim++;
      }
      if (Input.cancel()) { Audio2.sfx('ok'); G.push(new MenuScene()); }
      else if (Input.ok()) { this.holdT = 0; this.act(); }
      else if (Input.held.ok && this.holdT > 14) {
        const it = State.selItem();
        if (it && ITEMS[it.id].kind === 'tool' && it.id !== 'vara') this.useItem();
      }
    }
    this.checkWarp();
    this.updateEnts();
    this.updateDrops();
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vy += q.g || 0; q.life--; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const q of this.pops) q.t++;
    this.pops = this.pops.filter(q => q.t < 50);
    this.feed.forEach(f => f.t--); this.feed = this.feed.filter(f => f.t > 0);
    if (this.banner && --this.banner.t <= 0) this.banner = null;
    this.updateWeather();
    this.updateCam();
  },
  moveP(dx, dy) {
    const p = this.p;
    const nx = p.x + dx, ny = p.y + dy;
    if (this.boxFree(nx, ny)) { p.x = nx; p.y = ny; return true; }
    // desliza em quinas
    if (dx && this.boxFree(nx, ny - 6)) { p.y -= 1; }
    else if (dx && this.boxFree(nx, ny + 6)) { p.y += 1; }
    else if (dy && this.boxFree(nx - 6, ny)) { p.x -= 1; }
    else if (dy && this.boxFree(nx + 6, ny)) { p.x += 1; }
    return false;
  },
  checkWarp() {
    if (this.busy) return;
    const [tx, ty] = this.ptile();
    for (const f of this.map.fixed) if (f.type === 'warp' && f.x === tx && f.y === ty) {
      if (f.door) Audio2.sfx('door');
      this.run(() => this.goto(f.to, f.tx, f.ty, f.dir));
      return;
    }
    const o = this.map.objs[tx + ',' + ty];
    if (o && o.k === 'ladder') { Audio2.sfx('stairs'); this.run(() => this.enterCave(this.cave.floor + 1)); return; }
    if (o && o.k === 'forage') this.pickForage(tx, ty, o);
  },
  updateCam() {
    const p = this.p, m = this.map;
    const mw = m.w * TS, mh = m.h * TS;
    let cx = p.x - VIEW_W / 2, cy = p.y - 20 - VIEW_H / 2;
    cx = mw <= VIEW_W ? (mw - VIEW_W) / 2 : U.clamp(cx, 0, mw - VIEW_W);
    cy = mh <= VIEW_H ? (mh - VIEW_H) / 2 : U.clamp(cy, 0, mh - VIEW_H);
    this.cam.x = Math.round(cx); this.cam.y = Math.round(cy);
  },

  // ---------------- tempo ----------------
  timeStep() {
    State.time += 10;
    if (State.slot() !== this.lastSlot) { this.lastSlot = State.slot(); this.spawnNpcs(); }
    if (State.time === 20 * 60) this.playMusic();
    if (State.time === 22 * 60) G.toast('Está ficando tarde...', UI.hi);
    if (State.time === 24 * 60) G.toast('Meia-noite! Melhor ir dormir.', UI.bad);
    if (State.time >= 26 * 60) this.run(() => endDay('passout'));
  },

  // ---------------- ação principal ----------------
  act() {
    if (this.fishing) return;
    const [tx, ty] = this.target();
    const e = this.entInFront();
    if (e) { this.run(() => this.interactEnt(e)); return; }
    const f = this.fixedAt(tx, ty);
    if (f && f.type !== 'warp') { this.run(() => this.useFixed(f)); return; }
    const key = tx + ',' + ty;
    const soil = this.map.id === 'fazenda' && State.soil[key];
    if (soil && soil.crop && !soil.crop.dead && cropReady(soil.crop)) { this.harvest(tx, ty, soil); return; }
    const o = this.map.objs[key];
    if (o && o.k === 'chest') { G.push(new ChestScene(o)); return; }
    if (o && o.k === 'ladder_up') { this.run(async () => { const c = await S.ask('Voltar para a superfície?', ['Subir', 'Ficar']); if (c === 0) { Audio2.sfx('stairs'); await this.goto('montanha', 28, 6, 'down'); } }); return; }
    if (o && o.k === 'forage') { this.pickForage(tx, ty, o); return; }
    this.useItem();
  },
  useItem() {
    const it = State.selItem();
    if (!it) return;
    const info = ITEMS[it.id];
    const [tx, ty] = this.target();
    if (info.kind === 'tool') {
      if (it.id === 'vara') { this.startFishing(); return; }
      if (it.id !== 'espada' && State.energy <= 0) { G.toast('Exausto demais! Coma algo ou vá dormir.', UI.bad); Audio2.sfx('buzz'); return; }
      this.swing = { tool: it.id, t: 0, dur: it.id === 'espada' ? 14 : 18, hitAt: it.id === 'espada' ? 5 : 9 };
      Audio2.sfx('swing');
      return;
    }
    if (info.kind === 'seed') { this.plant(tx, ty, it.id); return; }
    if (it.id === 'adubo') {
      const s = this.map.id === 'fazenda' && State.soil[tx + ',' + ty];
      if (s && !s.fert) { s.fert = true; State.removeItem('adubo'); Audio2.sfx('dig'); this.burst(tx, ty, '#6a5a3a'); }
      else G.toast('Use o adubo em terra preparada.', UI.dim);
      return;
    }
    if (info.place === 'chest') {
      if (!this.solidAt(tx, ty) && !this.map.objs[tx + ',' + ty] && !(State.soil[tx + ',' + ty] && this.map.id === 'fazenda') && this.map.def.persist) {
        this.map.objs[tx + ',' + ty] = { k: 'chest', items: Array(24).fill(null) }; State.removeItem('bau'); Audio2.sfx('place');
      } else G.toast('Não dá para colocar o baú aqui.', UI.dim);
      return;
    }
    if (info.energy || info.hp) {
      this.run(async () => {
        const c = await S.ask(`Comer ${info.name}? (+${info.energy || 0} energia${info.hp ? `, +${info.hp} vida` : ''})`, ['Comer', 'Não']);
        if (c === 0) { State.removeItem(it.id); State.energy = Math.min(State.maxEnergy, State.energy + (info.energy || 0)); State.hp = Math.min(State.maxHp, State.hp + (info.hp || Math.round((info.energy || 0) / 2))); Audio2.sfx('eat'); }
      });
      return;
    }
    if (it.id === 'racao') { G.toast('Coloque a ração no cocho do curral.', UI.dim); return; }
    if (it.id === 'biscoito') { G.toast('Dê o biscoito a um monstrinho (fique de frente para ele).', UI.dim); }
  },

  // ---------------- ferramentas ----------------
  applyTool(tool) {
    const tier = State.tools[tool] || 0;
    const [tx, ty] = this.target();
    const cost = tool === 'espada' ? 0 : [2, 3, 3, 4][tier];
    State.energy = Math.max(0, State.energy - cost);
    const fz = this.map.id === 'fazenda';
    if (tool === 'enxada') {
      let any = false;
      for (const [x, y] of this.areaTiles(tier, tx, ty)) {
        const k = x + ',' + y;
        if (!fz || this.map.objs[k] || State.soil[k] || this.fixedAt(x, y) || !TILLABLE[this.tile(x, y)]) continue;
        State.soil[k] = { wet: State.weather === 'chuva' }; any = true; this.burst(x, y, '#8a5a32');
      }
      Audio2.sfx(any ? 'dig' : 'thud');
      if (!any && !fz) G.toast('Só dá para cavar a terra do sítio.', UI.dim);
    } else if (tool === 'regador') {
      const c = this.tile(tx, ty);
      if (TILE_DEFS[c] && TILE_DEFS[c].water) { State.water = CAN_CAPACITY[tier]; Audio2.sfx('water'); this.burst(tx, ty, '#8ad0ff'); G.toast('Regador cheio!', '#8ad0ff'); State.energy += cost; return; }
      if (State.water <= 0) { G.toast('O regador está vazio. Encha na água!', UI.bad); Audio2.sfx('buzz'); State.energy += cost; return; }
      State.water--;
      let any = false;
      for (const [x, y] of this.areaTiles(tier, tx, ty)) { const s = fz && State.soil[x + ',' + y]; if (s && !s.wet) { s.wet = true; any = true; State.stats.watered++; } this.burst(x, y, '#8ad0ff', 4); }
      Audio2.sfx('water');
      void any;
    } else if (tool === 'picareta') {
      const k = tx + ',' + ty, o = this.map.objs[k];
      if (o && ROCKS[o.k]) this.hitRock(tx, ty, o, TOOL_POWER[tier]);
      else if (fz && State.soil[k] && !(State.soil[k].crop && !State.soil[k].crop.dead)) { delete State.soil[k]; Audio2.sfx('dig'); }
      else Audio2.sfx('thud');
    } else if (tool === 'machado') {
      const k = tx + ',' + ty, o = this.map.objs[k];
      if (o && WOODS[o.k]) this.hitWood(tx, ty, o, TOOL_POWER[tier]);
      else Audio2.sfx('thud');
    } else if (tool === 'espada') {
      this.swordHit(tier);
      const k = tx + ',' + ty, o = this.map.objs[k];
      if (o && o.k === 'weed') { delete this.map.objs[k]; this.burst(tx, ty, '#5aa03a'); if (Math.random() < 0.6) this.drop('fibra', 1, tx, ty); Audio2.sfx('cut'); }
      const s = fz && State.soil[k];
      if (s && s.crop && s.crop.dead) { delete s.crop; Audio2.sfx('cut'); }
    }
  },
  hitRock(tx, ty, o, power) {
    o.hp -= power; this.burst(tx, ty, '#b0acb8', 5);
    if (o.hp > 0) { Audio2.sfx('pick'); o.shake = 8; return; }
    Audio2.sfx('break');
    delete this.map.objs[tx + ',' + ty];
    const lv = State.skillLevel('mine'), cave = !!this.map.def.cave;
    const extra = () => Math.random() < lv * 0.1 ? 1 : 0;
    switch (o.k) {
      case 'stone': case 'rock': case 'rock2': this.drop('pedra', 1 + extra(), tx, ty); if (cave && Math.random() < 0.04) this.drop('quartzo', 1, tx, ty); State.addXp('mine', 1); break;
      case 'ore_cobre': this.drop('min_cobre', U.randi(1, 2) + extra(), tx, ty); State.addXp('mine', 4); break;
      case 'ore_ferro': this.drop('min_ferro', U.randi(1, 2) + extra(), tx, ty); State.addXp('mine', 6); break;
      case 'ore_cristal': this.drop('cristal_lunar', 1, tx, ty); State.addXp('mine', 12); break;
      case 'ore_gema': this.drop(Math.random() < 0.55 ? 'topazio' : 'quartzo', 1, tx, ty); State.addXp('mine', 8); break;
      case 'ore_ametista': this.drop('ametista', 1, tx, ty); State.addXp('mine', 10); break;
      case 'boulder': this.drop('pedra', U.randi(4, 7), tx, ty); State.addXp('mine', 5); break;
    }
    State.stats.mined++;
    if (cave) this.maybeLadder(tx, ty);
  },
  maybeLadder(tx, ty) {
    const c = this.cave;
    if (c.ladder || c.floor >= 20) return;
    const left = Object.values(this.map.objs).filter(o => ROCKS[o.k]).length;
    if (left <= 2 || Math.random() < 0.025 + 1 / Math.max(6, left)) { this.map.objs[tx + ',' + ty] = { k: 'ladder' }; c.ladder = true; Audio2.sfx('ladder'); G.toast('Você achou a escada para o próximo andar!', UI.hi); }
  },
  hitWood(tx, ty, o, power) {
    o.hp -= power; this.burst(tx, ty, '#c8a070', 5);
    if (o.hp > 0) { Audio2.sfx('chop'); o.shake = 8; return; }
    Audio2.sfx('break');
    const k = tx + ',' + ty;
    if (o.k === 'tree') {
      this.map.objs[k] = { k: 'treestump', hp: 3, regrow: State.dayIndex + 5 };
      this.drop('madeira', U.randi(6, 9), tx, ty); if (Math.random() < 0.6) this.drop('seiva', U.randi(1, 2), tx, ty);
      State.addXp('farm', 2);
    } else {
      delete this.map.objs[k];
      this.drop('madeira', o.k === 'branch' ? 1 : 4, tx, ty);
      if (o.k !== 'branch' && Math.random() < 0.4) this.drop('seiva', 1, tx, ty);
    }
  },
  swordHit(tier) {
    const p = this.p, [dx, dy] = DIRV[p.dir];
    const cx = p.x + dx * 30, cy = p.y - 16 + dy * 30;
    const dmgBase = SWORD_DMG[tier] * (1 + State.skillLevel('combat') * 0.06);
    for (const e of this.ents) {
      if (e.kind !== 'enemy' || e.hp <= 0) continue;
      const size = e.e.size * PX * 0.5;
      if (Math.abs(e.x - cx) < 34 + size * 0.5 && Math.abs(e.y - 12 - cy) < 34 + size * 0.5) {
        if (e.e.ambush && !e.awake) e.awake = true;
        let d = Math.round(dmgBase * U.rand(0.9, 1.1));
        const crit = Math.random() < 0.08; if (crit) d = Math.round(d * 1.6);
        e.hp -= d; e.hit = 10;
        const kb = e.e.boss ? 2 : 7;
        const ang = Math.atan2(e.y - p.y, e.x - p.x); e.vx = Math.cos(ang) * kb; e.vy = Math.sin(ang) * kb;
        this.pops.push({ x: e.x, y: e.y - size - 10, txt: String(d), c: crit ? '#ffe04a' : '#ffffff', t: 0 });
        Audio2.sfx(crit ? 'crit' : 'hit');
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
  },
  killEnemy(e) {
    Audio2.sfx('poof');
    for (let i = 0; i < 14; i++) this.parts.push({ x: e.x, y: e.y - 16, vx: U.rand(-3, 3), vy: U.rand(-4, 0), g: 0.2, life: 30, c: e.e.c, s: 5 });
    const tx = Math.floor(e.x / TS), ty = Math.floor((e.y - 6) / TS);
    for (const [id, ch] of e.e.drops || []) if (Math.random() < ch) this.drop(id, 1, tx, ty);
    State.addXp('combat', e.e.xp); State.stats.kills++;
    if (e.e.boss) {
      State.flags.rei = true;
      this.drop('ametista', 2, tx, ty); this.drop('cristal_lunar', 2, tx, ty);
      this.run(async () => {
        await S.wait(40);
        G.flash('#ffffff', 30); Audio2.play('cave');
        await S.say(null, 'O Rei Bolor se desmancha numa poça brilhante. O ar da caverna fica leve de repente.');
        await S.say(null, 'No meio da poça, sobra um coração roxo que pulsa devagar: o *Coração de Bolor*. A Árvore-Lua precisa dele.');
      });
    }
    const left = this.ents.filter(x => x.kind === 'enemy' && x.hp > 0).length;
    if (this.cave && !this.cave.ladder && left === 0 && this.cave.floor < 20 && Math.random() < 0.6) {
      this.map.objs[tx + ',' + ty] = { k: 'ladder' }; this.cave.ladder = true; Audio2.sfx('ladder'); G.toast('Uma escada apareceu!', UI.hi);
    }
  },

  // ---------------- plantio e colheita ----------------
  plant(tx, ty, seed) {
    const s = this.map.id === 'fazenda' && State.soil[tx + ',' + ty];
    if (!s) { G.toast('Plante em terra preparada com a enxada.', UI.dim); return; }
    if (s.crop) return;
    const cid = ITEMS[seed].crop, c = CROPS[cid];
    if (!c.seasons.includes(State.season)) { G.toast(`Essa semente não cresce no ${SEASONS[State.season].toLowerCase()}.`, UI.bad); Audio2.sfx('buzz'); return; }
    s.crop = { id: cid, age: 0 };
    State.removeItem(seed); State.stats.planted++;
    Audio2.sfx('plant'); this.burst(tx, ty, '#7ad04a', 4);
    // planta o resto em sequência se segurar o botão
  },
  harvest(tx, ty, s) {
    const c = CROPS[s.crop.id];
    let n = 1;
    if (c.extra && Math.random() < c.extra) n++;
    if (Math.random() < State.skillLevel('farm') * 0.05) n++;
    const left = State.addItem(c.item, n);
    if (left) this.drop(c.item, left, tx, ty);
    this.notify(c.item, n - left);
    State.addXp('farm', Math.max(2, Math.round(ITEMS[c.item].price / 15)));
    State.stats.harvested += n;
    Audio2.sfx('harvest');
    for (let i = 0; i < 8; i++) this.parts.push({ x: tx * TS + TS / 2, y: ty * TS + TS / 2, vx: U.rand(-2, 2), vy: U.rand(-3, -1), g: 0.15, life: 24, c: c.c, s: 4 });
    if (c.regrow) s.crop.age = c.days - c.regrow; else delete s.crop;
  },
  pickForage(tx, ty, o) {
    if (!State.canAdd(o.item)) { G.toast('Mochila cheia!', UI.bad); return; }
    delete this.map.objs[tx + ',' + ty];
    State.addItem(o.item, 1); this.notify(o.item, 1); Audio2.sfx('pickup');
    State.addXp('farm', 2);
  },

  // ---------------- interação com entidades ----------------
  async interactEnt(e) {
    const p = this.p;
    if (e.kind === 'npc') { e.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; await talkNpc(e.id); return; }
    if (e.kind === 'farmmon') {
      const m = e.m, sp = MONSTRINHOS[m.sp];
      const it = State.selItem();
      if (it && (it.id === 'biscoito' || it.id === sp.fav) && m.treat !== State.dayIndex) {
        State.removeItem(it.id); m.treat = State.dayIndex; m.pts += it.id === sp.fav ? 40 : 25; Audio2.sfx('love');
        this.heartPop(e); await S.say(null, `${m.name} adorou o petisco! ${heartsText(State.monHearts(m))}`); return;
      }
      if (!m.petted) { m.petted = true; m.pts += 15; Audio2.sfx('love'); this.heartPop(e); G.toast(`Você fez carinho em ${m.name}!`, '#ff8ab8'); }
      await S.say(null, `${m.name} (${sp.name}) ${heartsText(State.monHearts(m))}\n${sp.desc}${m.fedOk === false ? ' Parece com fome: o cocho estava vazio.' : ''}`);
      return;
    }
    if (e.kind === 'wild') { await tameTalk(e); return; }
  },
  heartPop(e) { for (let i = 0; i < 4; i++) this.pops.push({ x: e.x + U.rand(-12, 12), y: e.y - 40 - i * 6, txt: '♥', c: '#ff6a9a', t: -i * 6 }); },
  async useFixed(f) {
    switch (f.type) {
      case 'bed': {
        const c = await S.ask('Dormir e encerrar o dia? (O jogo é salvo ao dormir.)', ['Dormir', 'Ainda não']);
        if (c === 0) await endDay('sleep');
        break;
      }
      case 'bin': await shipTalk(); break;
      case 'trough': {
        const n = State.count('racao');
        if (n > 0) {
          const add = Math.min(n, 40 - State.trough);
          if (add <= 0) { await S.say(null, 'O cocho já está cheio (40 rações).'); break; }
          State.removeItem('racao', add); State.trough += add; Audio2.sfx('place');
          await S.say(null, `Você colocou ${add} ração no cocho. Agora há *${State.trough}*. Cada monstrinho come uma por noite.`);
        } else await S.say(null, `Ração no cocho: *${State.trough}*. Cada monstrinho come uma por noite. Compre Ração de Monstro com a Dona Flor ou faça com fibras.`);
        break;
      }
      case 'box': {
        if (!State.box.length) { await S.say(null, 'A caixa do curral está vazia. Os produtos dos monstrinhos aparecem aqui todas as manhãs.'); break; }
        const keep = [];
        for (const b of State.box) { const left = State.addItem(b.id, b.n); if (b.n - left) this.notify(b.id, b.n - left); if (left) keep.push({ id: b.id, n: left }); }
        State.box = keep; Audio2.sfx('pickup');
        if (keep.length) G.toast('Mochila cheia! Sobrou coisa na caixa.', UI.bad);
        break;
      }
      case 'barn': {
        const list = State.monsters.map(m => `${m.name} (${MONSTRINHOS[m.sp].name})`).join(', ');
        await S.say(null, `Curral dos Monstrinhos: ${State.monsters.length}/${State.barnCap} moradores.${list ? ' ' + list + '.' : ' Ainda vazio... Faça amizade com monstrinhos selvagens dando biscoitos!'}`);
        break;
      }
      case 'radio': {
        const w = { sol: 'sol o dia todo', chuva: 'chuva! Não precisa regar as plantações', neve: 'neve fininha' }[State.tomorrow];
        await S.say(null, `"Rádio Bruma informa: amanhã teremos ${w}." ...E agora, uma dica do dia: ${U.pick(RADIO_TIPS)}`);
        break;
      }
      case 'sign': case 'door': await S.say(null, f.text); break;
      case 'altar': G.push(new AltarScene()); break;
      case 'cave': await caveMenu(); break;
      case 'prop': if (f.art === 'moontree') await S.say(null, State.flags.fim ? 'A Árvore-Lua brilha suave, cheia de flores prateadas.' : 'A Árvore-Lua está seca e cinzenta. Mesmo assim, dá pra sentir um calorzinho vindo do tronco.'); break;
    }
  },

  // ---------------- entidades ----------------
  updateEnts() {
    const p = this.p;
    for (const e of this.ents) {
      e.anim++;
      if (e.kind === 'npc' || e.kind === 'wild' || e.kind === 'farmmon') this.wander(e);
      else if (e.kind === 'enemy') this.updateEnemy(e);
    }
    this.ents = this.ents.filter(e => !(e.kind === 'enemy' && e.hp <= 0));
    // projéteis
    for (const q of this.projs) {
      q.x += q.vx; q.y += q.vy; q.t--;
      if (this.solidTileOnly(q.x, q.y)) q.t = 0;
      if (Math.hypot(q.x - p.x, q.y - (p.y - 16)) < 22) { this.hurt(q.dmg, q.x, q.y); q.t = 0; }
    }
    this.projs = this.projs.filter(q => q.t > 0);
    void p;
  },
  solidTileOnly(x, y) { const c = this.tile(Math.floor(x / TS), Math.floor(y / TS)); return c === null || (TILE_DEFS[c] && TILE_DEFS[c].solid); },
  wander(e) {
    if (this.busy && e.kind === 'npc') return;
    if (e.tx != null) {
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
      const sp = e.kind === 'npc' ? 1.2 : 0.9;
      if (d < 2) { e.tx = null; return; }
      const nx = e.x + dx / d * sp, ny = e.y + dy / d * sp;
      if (this.boxFree(nx, ny) && Math.hypot(nx - this.p.x, ny - this.p.y) > 26) { e.x = nx; e.y = ny; e.moving = true; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); }
      else e.tx = null;
      return;
    }
    e.moving = false;
    if (--e.wt > 0) return;
    e.wt = U.randi(90, 260);
    if (e.kind === 'farmmon') {
      const [ax, ay, aw, ah] = this.map.def.pasture || [0, 0, 1, 1];
      e.tx = (ax + Math.random() * aw) * TS + TS / 2; e.ty = (ay + Math.random() * ah) * TS + TS - 6;
    } else {
      const r = e.kind === 'npc' ? 1.5 : 1.2;
      e.tx = (e.hx + U.rand(-r, r)) * TS + TS / 2; e.ty = (e.hy + U.rand(-r, r)) * TS + TS - 6;
    }
  },
  updateEnemy(e) {
    const p = this.p, E2 = e.e;
    if (e.hit > 0) e.hit--;
    const dx = p.x - e.x, dy = (p.y) - e.y, d = Math.hypot(dx, dy) || 1;
    const move = (vx, vy) => {
      const nx = e.x + vx, ny = e.y + vy;
      if (E2.fly ? !this.solidTileOnly(nx, ny - 8) : this.boxFree(nx, ny)) { e.x = nx; e.y = ny; return true; }
      return false;
    };
    // empurrão
    if (Math.abs(e.vx) + Math.abs(e.vy) > 0.2 && !e.jump) { move(e.vx, 0); move(0, e.vy); e.vx *= 0.82; e.vy *= 0.82; }
    if (E2.ambush && !e.awake) { if (d < TS * 2.2) e.awake = true; else return; }
    const aggro = E2.boss || d < TS * 7;
    if (E2.boss) {
      e.summon = (e.summon || 0) + 1;
      if (e.summon > 420) { e.summon = 0; for (let i = 0; i < 2; i++) { const a = Math.random() * Math.PI * 2; this.spawnEnemy('lodinho_roxo', Math.floor(e.x / TS + Math.cos(a) * 3), Math.floor(e.y / TS + Math.sin(a) * 2)); } Audio2.sfx('roar'); G.shake(14, 4); }
      for (const n of this.ents) if (n.kind === 'enemy' && !n.e.boss && this.solidAt(Math.floor(n.x / TS), Math.floor((n.y - 6) / TS))) n.hp = 0;
    }
    if (E2.hop) {
      if (e.jump > 0) { e.jump--; move(e.vx, 0); move(0, e.vy); if (!e.jump) { e.vx = 0; e.vy = 0; if (E2.boss) { G.shake(8, 3); Audio2.sfx('thud'); } } }
      else if (--e.t <= 0) {
        e.t = U.randi(E2.boss ? 50 : 40, E2.boss ? 90 : 90);
        const sp = E2.speed * (E2.boss ? 3.2 : 2.6);
        if (aggro) { e.vx = dx / d * sp; e.vy = dy / d * sp; } else { const a = Math.random() * 7; e.vx = Math.cos(a) * sp * 0.5; e.vy = Math.sin(a) * sp * 0.5; }
        e.jump = 22;
      }
    } else if (E2.shoot) {
      if (aggro) {
        const want = d > TS * 4.5 ? 1 : d < TS * 3 ? -1 : 0;
        move(dx / d * E2.speed * want + Math.sin(e.anim / 30) * 0.6, dy / d * E2.speed * want + Math.cos(e.anim / 25) * 0.6);
        if (--e.shootT <= 0) { e.shootT = 110; this.projs.push({ x: e.x, y: e.y - 16, vx: dx / d * 3.2, vy: (dy - 16) / d * 3.2, dmg: E2.dmg, t: 160, c: E2.c }); Audio2.sfx('shoot'); }
      }
    } else if (aggro) {
      const wob = E2.fly ? Math.sin(e.anim / 12) * 1.4 : 0;
      move(dx / d * E2.speed + wob * (dy / d), dy / d * E2.speed - wob * (dx / d));
    }
    e.dir = dx < 0 ? 'left' : 'right';
    // contato
    const r = E2.size * PX * 0.32 + 10;
    if (d < r && p.inv <= 0 && e.hit < 6) this.hurt(E2.dmg, e.x, e.y);
  },
  hurt(dmg, fx, fy) {
    const p = this.p;
    if (p.inv > 0) return;
    State.hp -= dmg; p.inv = 50;
    const a = Math.atan2(p.y - fy, p.x - fx); p.kx = Math.cos(a) * 8; p.ky = Math.sin(a) * 8;
    this.pops.push({ x: p.x, y: p.y - 60, txt: '-' + dmg, c: '#ff5a5a', t: 0 });
    Audio2.sfx('hurt'); G.shake(8, 4);
    if (State.hp <= 0) { State.hp = 0; this.run(() => endDay('faint')); }
  },

  // ---------------- itens no chão ----------------
  drop(id, n, tx, ty) {
    for (let i = 0; i < n; i++) this.drops.push({ id, x: tx * TS + TS / 2 + U.rand(-10, 10), y: ty * TS + TS / 2 + U.rand(-6, 10), z: 0, vz: U.rand(3, 5), vx: U.rand(-1.5, 1.5), t: 0 });
  },
  updateDrops() {
    const p = this.p;
    for (const d of this.drops) {
      d.t++;
      if (d.vz !== 0 || d.z > 0) { d.z += d.vz; d.vz -= 0.35; d.x += d.vx; if (d.z <= 0) { d.z = 0; d.vz = 0; d.vx = 0; } continue; }
      const dist = Math.hypot(p.x - d.x, p.y - 12 - d.y);
      if (d.t > 20 && dist < 96 && State.canAdd(d.id)) { d.x += (p.x - d.x) * 0.18; d.y += (p.y - 12 - d.y) * 0.18; }
      if (d.t > 20 && dist < 18 && State.canAdd(d.id)) { State.addItem(d.id, 1); d.got = true; this.notify(d.id, 1); Audio2.sfx('pickup'); }
    }
    this.drops = this.drops.filter(d => !d.got);
  },
  notify(id, n) {
    if (n <= 0) return;
    const f = this.feed.find(x => x.id === id);
    if (f) { f.n += n; f.t = 150; } else this.feed.push({ id, n, t: 150 });
    if (this.feed.length > 5) this.feed.shift();
  },
  burst(tx, ty, c, n = 6) { for (let i = 0; i < n; i++) this.parts.push({ x: tx * TS + TS / 2, y: ty * TS + TS / 2, vx: U.rand(-2, 2), vy: U.rand(-3, -0.5), g: 0.18, life: 20, c, s: 4 }); },

  // ---------------- pesca ----------------
  startFishing() {
    const [tx, ty] = this.target();
    let wx = tx, wy = ty;
    const [dx, dy] = DIRV[this.p.dir];
    for (let k = 0; k < 3; k++) { const c = this.tile(wx, wy); if (c === '~') break; wx += dx; wy += dy; }
    if (this.tile(wx, wy) !== '~' || !this.map.def.fish) { G.toast('Fique de frente para a água para pescar.', UI.dim); return; }
    if (State.energy <= 0) { G.toast('Exausto demais para pescar.', UI.bad); return; }
    State.energy = Math.max(0, State.energy - 3);
    Audio2.sfx('cast');
    this.fishing = { st: 'wait', t: U.randi(90, 360), bx: wx * TS + TS / 2, by: wy * TS + TS / 2 };
  },
  updateFishing() {
    const f = this.fishing;
    if (G.top() && !G.top().isWorld) return;
    if (Input.cancel()) { this.fishing = null; return; }
    if (f.st === 'wait') {
      if (Input.ok()) { this.fishing = null; G.toast('Cedo demais... nada mordeu.', UI.dim); return; }
      if (--f.t <= 0) { f.st = 'bite'; f.t = 42; Audio2.sfx('bite'); }
    } else if (f.st === 'bite') {
      if (Input.ok()) {
        this.fishing = null;
        const fish = rollFish(this.map.def.fish);
        if (ITEMS[fish.id].kind !== 'fish') { State.addItem(fish.id, 1); this.notify(fish.id, 1); Audio2.sfx('pickup'); G.toast(`Você pescou: ${ITEMS[fish.id].name}...`, UI.dim); return; }
        G.push(new FishScene(fish));
        return;
      }
      if (--f.t <= 0) { this.fishing = null; G.toast('O peixe escapou!', UI.bad); }
    }
  },

  // ---------------- clima ----------------
  initWeather() {
    this.weather = [];
    if (!this.map.def.outdoor) return;
    const n = State.weather === 'chuva' ? 110 : State.weather === 'neve' || State.season === 3 ? 70 : State.season === 2 ? 14 : 0;
    for (let i = 0; i < n; i++) this.weather.push({ x: U.rand(0, VIEW_W), y: U.rand(0, VIEW_H), s: U.rand(0.6, 1.4), ph: U.rand(0, 6) });
  },
  updateWeather() {
    const rain = State.weather === 'chuva';
    for (const q of this.weather) {
      if (rain) { q.x -= 3 * q.s; q.y += 13 * q.s; }
      else if (State.season === 2 && State.weather === 'sol') { q.ph += 0.04; q.x += Math.sin(q.ph) * 1.2 - 0.5; q.y += 0.9 * q.s; }
      else { q.ph += 0.03; q.x += Math.sin(q.ph) * 0.7 - 0.3; q.y += 1.4 * q.s; }
      if (q.y > VIEW_H + 10) { q.y = -10; q.x = U.rand(0, VIEW_W + 100); }
      if (q.x < -20) q.x = VIEW_W + 10;
    }
  },

  // ---------------- roteiros e viagens ----------------
  run(fn) {
    if (!fn) return Promise.resolve();
    this.busy = true; this.depth = (this.depth || 0) + 1;
    return (async () => {
      try { await fn(); } catch (err) { console.error(err); }
      finally { this.depth--; if (this.depth <= 0) { this.depth = 0; this.busy = false; } }
    })();
  },
  async goto(id, tx, ty, dir) {
    await G.fadeTo(1, 12);
    this.load(id, tx, ty, dir);
    await G.fadeTo(0, 12);
    if (id === 'vila') questStep('vila');
    if (id === 'bosque') questStep('bosque');
    if (MAPS[id] && MAPS[id].onEnter) await MAPS[id].onEnter();
  },
  async enterCave(floor) {
    this.cave = { floor, data: genCaveFloor(floor), ladder: false };
    if (floor % 5 === 0 && floor > State.caveMax) G.toast(`Ponto de parada: andar ${floor}. Você pode voltar direto para cá.`, UI.hi);
    State.caveMax = Math.max(State.caveMax, floor);
    questStep('caverna');
    await this.goto('caverna', this.cave.data.start[0], this.cave.data.start[1], 'down');
    if (floor === 20 && !State.flags.rei) {
      await S.wait(20);
      G.shake(30, 5); Audio2.sfx('roar');
      await S.say(null, 'O chão da caverna treme. Uma gosma roxa gigantesca, com uma coroa torta, se ergue no fundo da gruta!');
      await S.say(null, 'É o *Rei Bolor*, a origem do bolor que deixa os monstros bravos. Cuidado com os pulos dele!');
    }
  },
};

// ------------------------------------------------------------
//  Funções auxiliares de jogo
// ------------------------------------------------------------
function cropReady(cr) { return cr.age >= CROPS[cr.id].days; }
function cropStage(cr) {
  const c = CROPS[cr.id];
  if (cr.age >= c.days) return 3;
  if (cr.age === 0) return 0;
  return cr.age / c.days < 0.45 ? 1 : 2;
}
function heartsText(h) { return '♥'.repeat(h) + '♡'.repeat(5 - h); }
const RADIO_TIPS = [
  'monstrinhos com o cocho cheio trabalham e produzem melhor.',
  'cada estação dura 7 dias. Plante o que cresce antes da estação virar!',
  'segure o botão de ação para continuar usando a ferramenta.',
  'a Barraca da Dona Flor abre das 9h às 17h.',
  'na caverna, a cada 5 andares existe um ponto de parada.',
  'presentes que os moradores amam rendem muita amizade.',
  'se a energia acabar, coma alguma coisa. Colheitas também matam a fome!',
  'o Seu Malho melhora suas ferramentas com minério e moedas.',
];

function rollFish(loc) {
  const lv = State.skillLevel('fish');
  const list = FISH[loc].filter(([, seasons]) => seasons.includes(State.season)).map(([id, , dif, w]) => ({ id, dif, w: w * (dif >= 3 ? 1 + lv * 0.15 : 1) }));
  return U.weighted(list);
}

// tarefas guiadas (diário)
const QUESTS = [
  { id: 'plantar', text: 'Limpe um pedaço do campo, cave com a enxada e plante 5 sementes.', done: () => State.stats.planted >= 5 },
  { id: 'regar', text: 'Regue as plantações com o regador (encha na lagoa ou no poço).', done: () => State.stats.watered >= 5 },
  { id: 'vila', text: 'Visite a Vila Bruma, a leste do sítio.', done: () => State.flags.q_vila },
  { id: 'colher', text: 'Colha sua primeira plantação.', done: () => State.stats.harvested >= 1 },
  { id: 'monstro', text: 'Faça amizade com um monstrinho selvagem dando Biscoito Monstro (um por dia).', done: () => State.stats.tamed >= 1 },
  { id: 'bosque', text: 'Visite a Árvore-Lua no bosque, ao sul do sítio.', done: () => State.flags.q_bosque },
  { id: 'caverna', text: 'Entre na Caverna Brumosa, na montanha ao norte da vila.', done: () => State.flags.q_caverna },
  { id: 'oferendas', text: 'Entregue as 4 oferendas no altar da Árvore-Lua.', done: () => OFFERINGS.every(o => offeringDone(o)) },
  { id: 'rei', text: 'Desça até o andar 20 da caverna e derrote o Rei Bolor.', done: () => !!State.flags.rei },
  { id: 'arvore', text: 'Leve o Coração de Bolor até a Árvore-Lua.', done: () => !!State.flags.fim },
];
function questStep(k) { State.flags['q_' + k] = true; }
function currentQuest() { return QUESTS.find(q => !q.done()); }

function needKey(id) { return typeof id === 'object' ? 'cat_' + id.cat : id; }
function needCount(id) { return typeof id === 'object' ? State.countCat(id.cat) : State.count(id); }
function needIcon(id) { return typeof id === 'object' ? (id.cat === 'fish' ? 'carpa' : 'nabo') : id; }
function needName(id) { return typeof id === 'object' ? (id.cat === 'fish' ? 'Qualquer peixe' : 'Qualquer colheita') : ITEMS[id].name; }
function offeringDone(o) { const d = State.offerings[o.id] || {}; return o.need.every(([id, n]) => (d[needKey(id)] || 0) >= n); }

// ------------------------------------------------------------
//  Moradores
// ------------------------------------------------------------
async function talkNpc(id) {
  const n = NPCS[id], d = State.npcData(id), today = State.dayIndex;
  const it = State.selItem();
  const hour = State.time / 60;
  const giftable = it && ITEMS[it.id].kind !== 'tool' && ITEMS[it.id].kind !== 'key';
  const opts = [];
  if (giftable && d.gifted !== today) opts.push('gift');
  if (id === 'flor') opts.push('shop');
  if (id === 'malho') opts.push('forge');
  let choice = 'talk';
  if (opts.length) {
    const labels = opts.map(o => o === 'gift' ? `Dar ${ITEMS[it.id].name}` : o === 'shop' ? 'Comprar e vender' : 'Ferraria');
    const c = await S.ask(`${n.name}`, [...labels, 'Conversar'], n.name);
    if (c < 0) return;
    choice = opts[c] || 'talk';
  }
  if (choice === 'shop') {
    const [a, b] = SHOPS.flor.open;
    if (hour < a || hour >= b) { await S.say(n.name, 'A barraca abre das 9h às 17h, meu bem. Volte nesse horário!'); return; }
    G.push(new ShopScene('flor')); return;
  }
  if (choice === 'forge') {
    if (hour < 9 || hour >= 16) { await S.say(n.name, 'A forja só funciona das 9h às 16h. Volte mais tarde.'); return; }
    G.push(new ForgeScene()); return;
  }
  if (choice === 'gift') {
    State.removeItem(it.id);
    d.gifted = today;
    let pts = 15, line = 'Ah, obrigado.';
    if (n.loves.includes(it.id)) { pts = 80; line = U.pick(['Uau! Eu AMO isso! Como você sabia?', 'Não acredito! É o meu favorito!']); }
    else if (n.likes.includes(it.id) || (id === 'davi' && ITEMS[it.id].kind === 'fish' && it.id !== 'bota')) { pts = 45; line = U.pick(['Que gentileza! Muito obrigado.', 'Ah, que legal! Eu gosto bastante disso.']); }
    else if (n.dislikes.includes(it.id)) { pts = -20; line = U.pick(['Hm... não é bem o meu gosto.', 'Eca. Por que você me daria isso?']); }
    d.pts = Math.max(0, d.pts + pts);
    Audio2.sfx(pts > 0 ? 'love' : 'buzz');
    await S.say(n.name, line);
  } else {
    if (d.talked !== today) { d.talked = today; d.pts += 10; }
    const lines = n.talk.concat(seasonLine(id));
    await S.say(n.name, lines[(today + id.length) % lines.length]);
  }
  for (const [h, r] of Object.entries(n.hearts || {})) {
    if (State.npcHearts(id) >= +h && !d.rewards[h]) {
      d.rewards[h] = true;
      await S.say(n.name, r[0]);
      await S.give(r[1][0], r[1][1]);
    }
  }
}
function seasonLine(id) {
  const s = State.season;
  const L = {
    flor: ['Na primavera tudo brota! Morangos-Estrela valem cada moeda.', 'Verão pede tomate e melão. E muita água!', 'Outono é tempo de abóbora. Elas sorriem pra você, sabia?', 'No inverno a terra descansa. Só a Raiz-de-Gelo aguenta o frio.'],
    malho: ['Primavera. Hm. Bom tempo pra descer na caverna antes do calor.', 'Calor de verão e calor de forja. Haja suor.', 'No outono o ferro esfria mais rápido. Bom pra têmpera.', 'Inverno. A forja é o lugar mais quente da vila.'],
    iris: ['Na primavera os Brotinhos ficam agitados!', 'No verão as Gotinhas adoram brincar no rio.', 'Outono é a estação preferida dos Fungos.', 'No inverno, os Lanudos ficam ainda mais fofos.'],
    davi: ['Primavera: os Lambaris-Lua estão mordendo na lagoa!', 'Verão é época do Dourado-Sol no rio.', 'Outono traz o Salmão-Névoa pro lago.', 'No inverno, o Peixe-Cristal aparece no lago.'],
    nena: ['Primavera me lembra a Lurdes plantando morangos.', 'No verão eu faço pão de milho pra vila toda.', 'Outono é tempo de torta de abóbora!', 'No inverno, nada como uma sopa quentinha.'],
    pituco: ['Na primavera eu caço borboletas!', 'Verão! Hora de nadar no rio!', 'Outono tem folhas pra pular em cima!', 'Neve! Vou fazer um boneco de neve monstrinho!'],
  };
  return L[id] ? [L[id][s]] : [];
}

// ------------------------------------------------------------
//  Monstrinhos selvagens
// ------------------------------------------------------------
async function tameTalk(e) {
  const sp = MONSTRINHOS[e.sp];
  const w = State.wild[e.sp] || (State.wild[e.sp] = { trust: 0, last: 0, back: 0 });
  const it = State.selItem();
  const food = it && (it.id === 'biscoito' || it.id === sp.fav);
  if (!food) {
    await S.say(null, `Um ${sp.name} selvagem te observa com curiosidade. ${'●'.repeat(w.trust)}${'○'.repeat(3 - w.trust)}`);
    if (!w.hinted) { w.hinted = true; await S.say(null, `(Selecione um Biscoito Monstro na barra e fique de frente para ele. Dizem que ${sp.name}s adoram ${ITEMS[sp.fav].name}.)`); }
    return;
  }
  if (w.last === State.dayIndex) { await S.say(null, `O ${sp.name} já ganhou um presente hoje. Volte amanhã!`); return; }
  State.removeItem(it.id);
  w.last = State.dayIndex;
  w.trust += it.id === sp.fav ? 2 : 1;
  Audio2.sfx('love'); World.heartPop(e);
  if (w.trust < 3) { await S.say(null, `O ${sp.name} comeu tudo e chegou mais perto! Confiança: ${'●'.repeat(Math.min(3, w.trust))}${'○'.repeat(Math.max(0, 3 - w.trust))}`); return; }
  if (State.monsters.length >= State.barnCap) { w.trust = 2; await S.say(null, `O ${sp.name} quer ir morar com você, mas o curral está cheio! (Peça uma reforma ao Seu Malho.)`); return; }
  const used = State.monsters.map(m => m.name);
  const name = MONSTER_NAMES.find(n => !used.includes(n)) || sp.name;
  State.monsters.push({ id: Date.now() + Math.random(), sp: e.sp, name, pts: 50, petted: false, last: State.dayIndex, treat: 0 });
  w.trust = 0; w.back = State.dayIndex + 3;
  State.stats.tamed++;
  World.ents = World.ents.filter(x => x !== e);
  Audio2.sfx('levelup');
  await S.say(null, `O ${sp.name} pulou de alegria! Ele vai morar no seu curral. Você o chamou de *${name}*!`);
  await S.say(null, `${sp.desc} Não esqueça de deixar ração no cocho do curral.`);
}

// ------------------------------------------------------------
//  Venda pela caixa de envio
// ------------------------------------------------------------
async function shipTalk() {
  const it = State.selItem();
  if (it && ITEMS[it.id].kind !== 'tool' && ITEMS[it.id].kind !== 'key' && ITEMS[it.id].price > 0) {
    const info = ITEMS[it.id];
    const c = await S.ask(`Enviar ${it.n}x ${info.name} para vender? (${info.price * it.n} moedas amanhã cedo)`, ['Enviar tudo', 'Enviar 1', 'Cancelar']);
    if (c === 0 || c === 1) {
      const n = c === 0 ? it.n : 1;
      State.removeItem(it.id, n);
      const s = State.ship.find(x => x.id === it.id); if (s) s.n += n; else State.ship.push({ id: it.id, n });
      Audio2.sfx('ship');
    }
    return;
  }
  const total = State.ship.reduce((a, s) => a + ITEMS[s.id].price * s.n, 0);
  await S.say(null, State.ship.length ? `Na caixa de envio: itens que valem *${total} moedas*. O pagamento chega amanhã cedo.` : 'A caixa de envio está vazia. Segure um item e use a caixa para enviá-lo. O dinheiro chega na manhã seguinte.');
}

// ------------------------------------------------------------
//  Caverna
// ------------------------------------------------------------
async function caveMenu() {
  const checkpoints = [1, 5, 10, 15, 20].filter(f => f === 1 || f <= State.caveMax);
  let floor = 1;
  if (checkpoints.length > 1) {
    const c = await S.ask('Descer de vagonete até qual andar?', checkpoints.map(f => f === 1 ? 'Andar 1' : `Andar ${f}`).concat(['Cancelar']));
    if (c < 0 || c >= checkpoints.length) return;
    floor = checkpoints[c];
  } else {
    const c = await S.ask('Entrar na Caverna Brumosa?', ['Entrar', 'Agora não']);
    if (c !== 0) return;
  }
  if (floor === 20 && State.flags.rei) floor = 15;
  Audio2.sfx('stairs');
  await World.enterCave(floor);
}

// ------------------------------------------------------------
//  Fim do dia
// ------------------------------------------------------------
async function endDay(reason) {
  World.busy = true;
  if (reason === 'passout') { await S.say(null, 'São 2h da manhã... Você desmaia de cansaço.'); }
  if (reason === 'faint') { G.flash('#ff2a2a', 20); await S.say(null, 'Você desmaiou! ...Íris te encontrou e te levou para casa.'); }
  await G.fadeTo(1, 40);
  const sum = processNight(reason);
  World.cave = null;
  World.load('casa', 2, 4, 'down');
  State.save();
  const sc = new DaySummaryScene(sum);
  G.push(sc);
  await G.fadeTo(0, 20);
  await sc.promise;
}

function processNight(reason) {
  const sum = { earned: 0, ship: State.ship.slice(), notes: [], lost: 0, reason };
  for (const s of State.ship) sum.earned += ITEMS[s.id].price * s.n;
  State.gold += sum.earned; State.stats.shipped += sum.earned; State.ship = [];
  if (reason === 'passout' || reason === 'faint') { sum.lost = Math.min(500, Math.floor(State.gold * 0.1)); State.gold -= sum.lost; }
  const late = State.time >= 24 * 60;
  State.energy = reason === 'sleep' ? (late ? Math.round(State.maxEnergy * 0.75) : State.maxEnergy) : Math.round(State.maxEnergy * 0.5);
  State.hp = reason === 'faint' ? Math.round(State.maxHp * 0.5) : State.maxHp;
  // plantas crescem
  for (const s of Object.values(State.soil)) {
    if (s.crop && !s.crop.dead && s.wet) { s.crop.age++; if (s.fert && Math.random() < 0.35) s.crop.age++; s.crop.age = Math.min(s.crop.age, CROPS[s.crop.id].days); }
    s.wet = false;
  }
  // monstrinhos
  const today = State.dayIndex + 1;
  const crops = () => Object.values(State.soil).filter(s => s.crop && !s.crop.dead);
  for (const m of State.monsters) {
    const sp = MONSTRINHOS[m.sp];
    const fed = State.trough > 0;
    if (fed) State.trough--;
    m.fedOk = fed;
    m.pts = Math.max(0, Math.min(600, m.pts + (fed ? 5 : -15) + (m.petted ? 10 : -3)));
    m.petted = false;
    const h = State.monHearts(m);
    if (!fed) { sum.notes.push(`${m.name} ficou com fome (cocho vazio).`); continue; }
    if (sp.product) {
      if (today - (m.last || 0) >= sp.every) {
        m.last = today;
        const n = h >= 4 ? 2 : 1;
        const b = State.box.find(x => x.id === sp.product); if (b) b.n += n; else State.box.push({ id: sp.product, n });
        sum.notes.push(`${m.name} deixou ${n}x ${ITEMS[sp.product].name} na caixa do curral.`);
      }
    } else if (sp.job === 'water') {
      const dry = crops().filter(s => !s.wet); U.shuffle(dry);
      const n = Math.min(dry.length, 5 + h * 2);
      m.jobToday = n; m.waterMorning = true;
      if (n) sum.notes.push(`${m.name} vai regar ${n} plantações hoje cedo.`);
    } else if (sp.job === 'grow') {
      const list = crops().filter(s => !cropReady(s.crop)); U.shuffle(list);
      const n = Math.min(list.length, 3 + h);
      for (let i = 0; i < n; i++) list[i].crop.age++;
      if (n) sum.notes.push(`${m.name} cantou para ${n} plantações, que cresceram mais rápido.`);
    } else if (sp.job === 'clear') {
      const o = State.objs.fazenda;
      const keys = Object.keys(o).filter(k => ['weed', 'stone', 'branch'].includes(o[k].k)); U.shuffle(keys);
      const n = Math.min(keys.length, 2 + h);
      for (let i = 0; i < n; i++) {
        const k = o[keys[i]].k; delete o[keys[i]];
        const id = k === 'weed' ? 'fibra' : k === 'stone' ? (Math.random() < 0.2 ? 'min_cobre' : 'pedra') : 'madeira';
        const b = State.box.find(x => x.id === id); if (b) b.n++; else State.box.push({ id, n: 1 });
      }
      if (n) sum.notes.push(`${m.name} limpou ${n} entulhos do campo e guardou o que achou.`);
    }
  }
  // calendário
  State.day++;
  if (State.day > DAYS_PER_SEASON) {
    State.day = 1; State.season++;
    if (State.season > 3) { State.season = 0; State.year++; }
    let dead = 0;
    for (const s of Object.values(State.soil)) if (s.crop && !s.crop.dead && !CROPS[s.crop.id].seasons.includes(State.season)) { s.crop.dead = true; dead++; }
    sum.notes.unshift(`Começou o ${SEASONS[State.season].toLowerCase()}!${dead ? ` ${dead} plantas de outra estação murcharam.` : ''}`);
    sum.newSeason = true;
  }
  State.weather = State.tomorrow;
  if (State.weather === 'neve' && State.season !== 3) State.weather = 'chuva';
  if (State.weather === 'chuva' && State.season === 3) State.weather = 'neve';
  const r = Math.random();
  State.tomorrow = State.season === 3 ? (r < 0.3 ? 'neve' : 'sol') : (r < 0.24 ? 'chuva' : 'sol');
  if (State.weather === 'chuva') for (const s of Object.values(State.soil)) s.wet = true;
  // Gotinhas regam de manhã (depois da chuva)
  for (const m of State.monsters) if (m.waterMorning) {
    const dry = Object.values(State.soil).filter(s => s.crop && !s.crop.dead && !s.wet); U.shuffle(dry);
    for (let i = 0; i < Math.min(dry.length, m.jobToday); i++) dry[i].wet = true;
    m.waterMorning = false;
  }
  dailyObjects();
  State.time = 6 * 60;
  State.water = CAN_CAPACITY[State.tools.regador];
  return sum;
}

// ------------------------------------------------------------
//  Cena principal e API de roteiro
// ------------------------------------------------------------
class WorldScene {
  constructor() { this.opaque = true; this.isWorld = true; }
  update() { World.update(); }
  draw() { drawWorld(); drawHUD(); }
}

const S = {
  async say(speaker, ...pages) {
    let opts = {};
    if (pages.length && typeof pages[pages.length - 1] === 'object') opts = pages.pop();
    for (const p of pages) await showMessage(speaker, p, opts);
  },
  async ask(q, options, speaker) {
    const mb = new MessageBox(speaker || null, q, { hold: true });
    G.push(mb); await mb.promise;
    const r = await showChoice(options, { cancel: true });
    G.remove(mb);
    return r;
  },
  async give(id, n = 1) {
    const left = State.addItem(id, n);
    Audio2.sfx('pickup');
    await S.say(null, `Recebeu *${ITEMS[id].name}*${n > 1 ? ' x' + n : ''}!${left ? ' (A mochila está cheia, parte ficou no chão.)' : ''}`);
    if (left) World.drop(id, left, ...World.ptile());
  },
  wait: f => G.wait(f),
  fadeOut: (f = 20) => G.fadeTo(1, f),
  fadeIn: (f = 20) => G.fadeTo(0, f),
};
