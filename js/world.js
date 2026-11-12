'use strict';
// ============================================================
//  Mundo: mapas, jogador, seguidores, entidades, quebra-cabeças,
//  encontros aleatórios e a API de roteiro (S)
// ============================================================

const SOLID_TYPES = { npc: 1, chest: 1, sign: 1, bonfire: 1, lever: 1, boulder: 1, lantern: 1, boss: 1, obj: 1, block: 1 };
const WALK_SPEED = 11, RUN_SPEED = 7, SLIDE_SPEED = 6;

const World = {
  map: null, player: null, followers: [], busy: false, cam: { x: 0, y: 0 },
  banner: null, particles: [], encSteps: 20, emotes: [], darkCv: null, toxicWarned: false,

  // ---------- carregamento ----------
  load(id, x, y, dir) {
    const def = MAPS[id];
    if (!def) throw new Error('Mapa inexistente: ' + id);
    const rows = def.tiles;
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const pad = def.pad || 'v';
    const grid = rows.map(r => r.padEnd(w, pad));
    const prevName = this.map ? this.map.def.name : null;
    this.map = { id, def, w, h, grid, theme: def.theme || 'grass', base: def.base || '.', dark: def.dark || 0, ents: [] };
    // chão sob objetos (árvores, barris...): usa o piso vizinho mais comum
    const under = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const td = TILE_DEFS[grid[y][x]];
      if (!td || !td.over) continue;
      const cnt = {};
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = grid[y + dy] && grid[y + dy][x + dx];
        const d = c && TILE_DEFS[c];
        if (d && !d.solid && !d.over && !d.anim && c !== 'D' && c !== '<' && c !== '>' && c !== '=' && c !== '|') cnt[c] = (cnt[c] || 0) + 1;
      }
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
      if (best && best[0] !== this.map.base && 's_goSyI'.includes(best[0])) under[x + ',' + y] = best[0];
    }
    this.map.under = under;
    for (const e of def.ents || []) this.map.ents.push(this.makeEnt(e));
    this.placeSolvedBoulders();
    const p = this.player = { x, y, px: x * TS, py: y * TS, dir: dir || 'down', moving: false, t: 0, parity: false, sprite: State.party[0].id, isPlayer: true };
    this.rebuildFollowers();
    State.map = id; State.x = x; State.y = y; State.dir = p.dir;
    this.resetEnc();
    this.initAmbient(typeof def.ambient === 'function' ? def.ambient() : def.ambient);
    const mus = typeof def.music === 'function' ? def.music() : def.music;
    if (mus) Audio2.play(mus);
    if (def.name && def.name !== prevName) this.banner = { text: def.name, t: 170 };
    this.emotes = [];
    this.updateCam(true);
    void p;
  },
  rebuildFollowers() {
    const p = this.player;
    this.followers = State.party.slice(1).map(h => ({ x: p.x, y: p.y, px: p.x * TS, py: p.y * TS, dir: p.dir, sprite: h.id, moving: false, t: 0, fx: p.x, fy: p.y, parity: false }));
  },
  makeEnt(d) {
    const e = Object.assign({}, d);
    e.px = e.x * TS; e.py = e.y * TS; e.dir = d.dir || 'down'; e.moving = false; e.t = 0;
    e.homeX = e.x; e.homeY = e.y; e.wanderT = U.randi(60, 200); e.parity = false;
    return e;
  },
  placeSolvedBoulders() {
    const groups = {};
    for (const e of this.map.ents) if (e.type === 'plate') (groups[e.group] = groups[e.group] || { plates: [], boulders: [] }).plates.push(e);
    for (const e of this.map.ents) if (e.type === 'boulder' && groups[e.group]) groups[e.group].boulders.push(e);
    for (const [g, o] of Object.entries(groups)) {
      if (!State.flag(g)) continue;
      o.boulders.forEach((b, i) => { const pl = o.plates[i]; if (pl) { b.x = pl.x; b.y = pl.y; b.px = b.x * TS; b.py = b.y * TS; } });
    }
  },
  resetEnc() { const r = this.map.def.rate || [18, 32]; this.encSteps = U.randi(r[0], r[1]); },

  // ---------- consultas ----------
  tileAt(x, y) { if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return null; return this.map.grid[y][x]; },
  active(e) { return !e.cond || e.cond(); },
  isSolidEnt(e) {
    if (!this.active(e)) return false;
    if (e.type === 'gate') return !(e.open && e.open());
    if (e.solid === false) return false;
    return !!SOLID_TYPES[e.type];
  },
  entsAt(x, y) { return this.map.ents.filter(e => e.x === x && e.y === y && this.active(e)); },
  ent(id) { return this.map.ents.find(e => e.id === id); },
  blocked(x, y, mover) {
    const t = this.tileAt(x, y);
    if (t === null) return true;
    const td = TILE_DEFS[t];
    if (!td || td.solid) return true;
    for (const e of this.map.ents) if (e !== mover && e.x === x && e.y === y && this.isSolidEnt(e)) return true;
    if (mover && !mover.isPlayer) {
      const p = this.player;
      if ((p.x === x && p.y === y)) return true;
      if (this.followers.some(f => f.x === x && f.y === y)) return true;
    }
    return false;
  },

  // ---------- atualização ----------
  update() {
    const p = this.player;
    const top = G.top();
    const control = !this.busy && top && top.isWorld;
    if (p.moving) this.advance(p);
    for (const f of this.followers) if (f.moving) this.advanceF(f, p);
    if (!p.moving && control) {
      if (Input.cancel()) { Audio2.sfx('ok'); G.push(new MenuScene()); }
      else if (Input.ok()) this.interact();
      else { const d = Input.dirHeld(); if (d) this.tryMove(d); }
    }
    // NPCs
    for (const e of this.map.ents) {
      if (e.moving) { this.advance(e); continue; }
      if (e.type === 'npc' && e.wander && !this.busy && this.active(e)) {
        if (--e.wanderT <= 0) {
          e.wanderT = U.randi(90, 240);
          const d = U.pick(['up', 'down', 'left', 'right']);
          const [dx, dy] = U.DIRS[d];
          const nx = e.x + dx, ny = e.y + dy;
          e.dir = d;
          if (Math.abs(nx - e.homeX) + Math.abs(ny - e.homeY) <= (e.wander === true ? 2 : e.wander) && !this.blocked(nx, ny, e)) this.startMove(e, nx, ny, 16);
        }
      }
    }
    this.emotes.forEach(m => m.t--); this.emotes = this.emotes.filter(m => m.t > 0);
    if (this.banner && --this.banner.t <= 0) this.banner = null;
    this.updateAmbient();
    this.updateCam();
  },
  updateCam(snap) {
    const p = this.player, m = this.map;
    const mw = m.w * TS, mh = m.h * TS;
    let cx = p.px + TS / 2 - VIEW_W / 2, cy = p.py + TS / 2 - VIEW_H / 2;
    cx = mw <= VIEW_W ? (mw - VIEW_W) / 2 : U.clamp(cx, 0, mw - VIEW_W);
    cy = mh <= VIEW_H ? (mh - VIEW_H) / 2 : U.clamp(cy, 0, mh - VIEW_H);
    this.cam.x = Math.round(cx); this.cam.y = Math.round(cy);
    void snap;
  },
  startMove(e, nx, ny, speed) {
    e.fx = e.x; e.fy = e.y; e.x = nx; e.y = ny; e.moving = true; e.t = 0; e.spd = speed; e.parity = !e.parity;
  },
  advance(e) {
    e.t += 1 / e.spd;
    if (e.t >= 1) { e.t = 1; e.moving = false; }
    e.px = U.lerp(e.fx, e.x, e.t) * TS; e.py = U.lerp(e.fy, e.y, e.t) * TS;
    if (!e.moving) {
      if (e.isPlayer) this.onStep();
      if (e.onArrive) { const f = e.onArrive; e.onArrive = null; f(); }
    }
  },
  advanceF(f, p) {
    f.t = p.moving ? p.t : 1;
    if (f.t >= 1) { f.t = 1; f.moving = false; }
    f.px = U.lerp(f.fx, f.x, f.t) * TS; f.py = U.lerp(f.fy, f.y, f.t) * TS;
  },
  moveFollowers(oldX, oldY) {
    let tx = oldX, ty = oldY;
    for (const f of this.followers) {
      const ox = f.x, oy = f.y;
      if (ox !== tx || oy !== ty) {
        f.fx = ox; f.fy = oy; f.x = tx; f.y = ty; f.moving = true; f.t = 0; f.parity = !f.parity;
        f.dir = tx > ox ? 'right' : tx < ox ? 'left' : ty > oy ? 'down' : 'up';
      }
      tx = ox; ty = oy;
    }
  },
  speed() {
    const run = State.opts.run ? !Input.held.run : Input.held.run;
    return run ? RUN_SPEED : WALK_SPEED;
  },
  tryMove(dir) {
    const p = this.player;
    p.dir = dir;
    const [dx, dy] = U.DIRS[dir];
    const nx = p.x + dx, ny = p.y + dy;
    const boulder = this.map.ents.find(e => e.type === 'boulder' && e.x === nx && e.y === ny && this.active(e));
    if (boulder) {
      if (State.flag(boulder.group)) return; // já resolvido
      const bx = nx + dx, by = ny + dy;
      const t = this.tileAt(bx, by);
      const free = t && !this.blocked(bx, by, boulder) && !this.map.ents.some(e => e.x === bx && e.y === by && this.active(e) && (e.type === 'warp' || e.type === 'trigger'));
      if (!free) return;
      if (!p.pushT) p.pushT = 0;
      if (++p.pushT < 8) return; // pequena pausa antes de empurrar
      p.pushT = 0;
      Audio2.sfx('push');
      this.startMove(boulder, bx, by, 14);
      boulder.onArrive = () => this.checkPlates(boulder.group);
      const ox = p.x, oy = p.y;
      this.startMove(p, nx, ny, 14);
      this.moveFollowers(ox, oy);
      return;
    }
    p.pushT = 0;
    if (this.blocked(nx, ny, p)) return;
    const ox = p.x, oy = p.y;
    this.startMove(p, nx, ny, this.speed());
    this.moveFollowers(ox, oy);
  },
  checkPlates(group) {
    const plates = this.map.ents.filter(e => e.type === 'plate' && e.group === group);
    const boulders = this.map.ents.filter(e => e.type === 'boulder' && e.group === group);
    const done = plates.every(pl => boulders.some(b => b.x === pl.x && b.y === pl.y));
    if (done && !State.flag(group)) {
      State.setFlag(group);
      Audio2.sfx('switch');
      G.shake(10, 3);
      this.run(async () => { await S.wait(10); Audio2.sfx('door'); await S.say(null, 'Ouve-se um estalo pesado. Algo se abriu!'); });
    }
  },
  onStep() {
    const p = this.player;
    State.x = p.x; State.y = p.y; State.dir = p.dir;
    if (this.busy || p.scripted) return;
    State.steps++;
    // gatilhos e portas
    for (const e of this.entsAt(p.x, p.y)) {
      if (e.type === 'warp') { this.useWarp(e); return; }
      if (e.type === 'trigger') {
        if (e.once && State.flag(e.once)) continue;
        if (e.once) State.setFlag(e.once);
        this.run(e.script, e);
        return;
      }
    }
    const t = this.tileAt(p.x, p.y);
    // gelo: continua deslizando
    if (TILE_DEFS[t] && TILE_DEFS[t].ice) {
      const [dx, dy] = U.DIRS[p.dir];
      if (!this.blocked(p.x + dx, p.y + dy, p) && !this.map.ents.some(e => e.type === 'boulder' && e.x === p.x + dx && e.y === p.y + dy)) {
        const ox = p.x, oy = p.y;
        Audio2.sfx('slide');
        this.startMove(p, p.x + dx, p.y + dy, SLIDE_SPEED);
        p.sliding = true;
        this.moveFollowers(ox, oy);
        return;
      }
    }
    p.sliding = false;
    if (TILE_DEFS[t] && TILE_DEFS[t].hurt) {
      let hurt = false;
      for (const h of State.party) if (h.alive && !h.immune('poison')) { const d = Math.max(1, Math.floor(h.maxHp * 0.03)); if (h.hp > 1) { h.hp = Math.max(1, h.hp - d); hurt = true; } }
      if (hurt) { G.flash('#6a2a8a', 6); Audio2.sfx('poison'); if (!this.toxicWarned) { this.toxicWarned = true; G.toast('O lodo tóxico fere o grupo!', '#c88aff'); } }
    }
    if (State.repel > 0) { State.repel--; if (State.repel === 0) G.toast('O efeito do incenso acabou.'); }
    // encontros
    let enc = this.map.def.encounters;
    if (typeof enc === 'function') enc = enc();
    if (enc && State.repel <= 0 && !this.busy && !(TILE_DEFS[t] && (t === 'D' || t === '<' || t === '>' || TILE_DEFS[t].ice))) {
      if (--this.encSteps <= 0) {
        this.resetEnc();
        const troop = U.weighted(TROOPS[enc].map(([ids, w]) => ({ ids, w })));
        this.run(async () => { await Battle.start(troop.ids, { bg: this.map.def.bg }); });
      }
    }
  },
  useWarp(e) {
    if (e.locked && e.locked()) { this.run(async () => { await S.say(null, e.lockedText || 'Está trancado.'); }); return; }
    Audio2.sfx(e.sfx || 'door');
    this.run(async () => { await this.goto(e.to, e.tx, e.ty, e.dir || this.player.dir); });
  },
  async goto(mapId, x, y, dir) {
    this.busy = true;
    await G.fadeTo(1, 12);
    this.load(mapId, x, y, dir);
    if (this.map.def.onEnter) { await G.fadeTo(0, 12); await this.map.def.onEnter(S); }
    else await G.fadeTo(0, 12);
  },

  // ---------- interação ----------
  interact() {
    const p = this.player;
    const [dx, dy] = U.DIRS[p.dir];
    let tx = p.x + dx, ty = p.y + dy;
    let e = this.interactableAt(tx, ty);
    if (!e) { const t = this.tileAt(tx, ty); if (t && TILE_DEFS[t] && TILE_DEFS[t].counter) e = this.interactableAt(tx + dx, ty + dy); }
    if (!e) {
      const t = this.tileAt(tx, ty);
      const msg = TILE_TEXT[t];
      if (msg) this.run(async () => { await S.say(null, typeof msg === 'function' ? msg() : msg); });
      return;
    }
    this.run(async () => { await this.useEnt(e); }, e);
  },
  interactableAt(x, y) {
    return this.map.ents.find(e => e.x === x && e.y === y && this.active(e) && e.type !== 'warp' && e.type !== 'trigger' && e.type !== 'plate' && (e.type !== 'gate' || e.talk));
  },
  async useEnt(e) {
    const p = this.player;
    switch (e.type) {
      case 'npc': case 'boss': case 'obj': {
        if (e.type === 'npc' && !e.fixed) e.dir = U.OPP[p.dir];
        await this.talk(e);
        if (e.type === 'npc' && !e.fixed && e.baseDir) e.dir = e.baseDir;
        break;
      }
      case 'sign': await S.say(null, e.text); break;
      case 'chest': {
        const key = 'chest:' + this.map.id + ':' + e.x + ',' + e.y;
        if (State.flag(key)) { await S.say(null, 'O baú está vazio.'); break; }
        State.setFlag(key); Audio2.sfx('chest');
        if (e.gold) { State.gold += e.gold; await S.say(null, `Você encontrou *${e.gold} moedas*!`); }
        if (e.item) await S.give(e.item, e.n || 1);
        break;
      }
      case 'sparkle': {
        State.setFlag(e.flag);
        Audio2.sfx('item');
        if (e.talk) await this.talk(e); else await S.give(e.item, e.n || 1);
        break;
      }
      case 'bonfire': await bonfireRest(e); break;
      case 'lever': {
        const on = !State.flag(e.flag);
        State.setFlag(e.flag, on);
        Audio2.sfx('switch'); G.shake(6, 2);
        await S.say(null, e.text || (on ? 'Você puxou a alavanca. Um portão se moveu ao longe.' : 'Você empurrou a alavanca de volta.'));
        break;
      }
      case 'lantern': {
        if (State.flag(e.flag)) { await S.say(null, 'A lanterna arde com uma chama violeta.'); break; }
        if (e.talk) { await this.talk(e); break; }
        break;
      }
      case 'gate': if (e.talk) await this.talk(e); break;
      case 'boulder': await S.say(null, 'Uma pedra pesada. Talvez dê para empurrá-la.'); break;
    }
  },
  async talk(e) {
    const t = e.talk;
    if (!t) return;
    if (typeof t === 'function') await t(S, e);
    else if (Array.isArray(t)) { for (const pg of t) await S.say(e.name, pg); }
    else await S.say(e.name, t);
  },
  // executa um roteiro bloqueando o controle do jogador
  run(fn, e) {
    if (!fn) return Promise.resolve();
    this.busy = true;
    this.depth = (this.depth || 0) + 1;
    const pr = (async () => {
      try { await fn(S, e); }
      catch (err) { if (!err || !err.abort) { console.error(err); } }
      finally { this.depth--; if (this.depth <= 0) { this.depth = 0; this.busy = false; } }
    })();
    return pr;
  },

  // ---------- desenho ----------
  draw() {
    const m = this.map, cam = this.cam;
    const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
    const x1 = Math.ceil((cam.x + VIEW_W) / TS), y1 = Math.ceil((cam.y + VIEW_H) / TS);
    ctx.imageSmoothingEnabled = false;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const sx = x * TS - cam.x, sy = y * TS - cam.y;
      const ch = this.tileAt(x, y);
      if (ch === null) continue;
      this.drawTile(ch, x, y, sx, sy);
    }
    // entidades e personagens ordenados por y
    const list = [];
    for (const e of m.ents) if (this.active(e) && e.type !== 'warp' && e.type !== 'trigger' && !e.hidden) list.push(e);
    for (const f of this.followers) list.push(f);
    list.push(this.player);
    list.sort((a, b) => (a.type === 'plate' ? -1 : 0) - (b.type === 'plate' ? -1 : 0) || a.py - b.py || (a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0));
    for (const e of list) this.drawEnt(e);
    // emotes
    for (const em of this.emotes) {
      const e = em.ent; const sx = e.px - cam.x + TS / 2, sy = e.py - cam.y - 20 - Math.min(8, (40 - em.t) * 2) * 0;
      drawWin(sx - 20, sy - 30, 40, 36, { alpha: 0.95 });
      text(em.kind, sx, sy - 26, { size: 30, align: 'center', color: em.kind === '!' ? '#ff6a5a' : em.kind === '♥' ? '#ff8ab8' : UI.hi });
    }
    this.drawDark();
    this.drawAmbient();
    if (this.banner) {
      const a = Math.min(1, this.banner.t / 30, (170 - this.banner.t) / 20);
      ctx.globalAlpha = a;
      setFont(36); const w = textW(this.banner.text, 36) + 70;
      drawWin(VIEW_W / 2 - w / 2, 24, w, 56);
      text(this.banner.text, VIEW_W / 2, 34, { size: 36, align: 'center', color: UI.hi });
      ctx.globalAlpha = 1;
    }
  },
  drawTile(ch, x, y, sx, sy) {
    const m = this.map, td = TILE_DEFS[ch];
    if (!td) return;
    const variant = ch === 'L' ? (y % 2) : ((x * 7 + y * 13) % 4);
    if (td.over) ctx.drawImage(Tiles.get(m.under[x + ',' + y] || m.base, m.theme, (x * 3 + y * 5) % 4, 0), sx, sy, TS, TS);
    const frame = td.anim ? Math.floor(G.frame / 28 + (x + y) * 0.3) % td.anim : 0;
    ctx.drawImage(Tiles.get(ch, m.theme, variant, frame), sx, sy, TS, TS);
  },
  drawEnt(e) {
    const cam = this.cam;
    const sx = Math.round(e.px - cam.x), sy = Math.round(e.py - cam.y);
    if (sx < -TS * 3 || sy < -TS * 3 || sx > VIEW_W + TS * 2 || sy > VIEW_H + TS * 2) return;
    const shadow = () => { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + TS - 5, 15, 6, 0, 0, Math.PI * 2); ctx.fill(); };
    if (e.sprite && (e.type === 'npc' || !e.type)) {
      shadow();
      const fr = e.moving && !e.sliding ? (e.t < 0.5 ? (e.parity ? 1 : 2) : 0) : 0;
      ctx.drawImage(Sprites.char(e.sprite, e.dir, fr), sx, sy - 8, TS, TS);
      return;
    }
    const anim2 = Math.floor(G.frame / 12) % 2, anim3 = Math.floor(G.frame / 8) % 3;
    let cv = null;
    switch (e.type) {
      case 'chest': cv = Sprites.obj(State.flag('chest:' + this.map.id + ':' + e.x + ',' + e.y) ? 'chest_open' : 'chest'); break;
      case 'bonfire': cv = Sprites.obj(e.off && e.off() ? 'bonfire_off' : 'bonfire', anim3); break;
      case 'lever': cv = Sprites.obj(State.flag(e.flag) ? 'lever_on' : 'lever_off'); break;
      case 'gate': cv = e.open && e.open() ? (e.look === 'vines' ? null : Sprites.obj('gate_open')) : Sprites.obj(e.look === 'vines' ? 'vines' : 'gate', anim2); break;
      case 'boulder': cv = Sprites.obj('boulder'); break;
      case 'plate': cv = Sprites.obj(this.map.ents.some(b => b.type === 'boulder' && b.x === e.x && b.y === e.y) ? 'plate_on' : 'plate'); break;
      case 'lantern': cv = Sprites.obj(State.flag(e.flag) ? 'lantern_on' : 'lantern_off', anim2); break;
      case 'sparkle': cv = Sprites.obj('sparkle', anim2); break;
      case 'sign': cv = Sprites.obj('sign'); break;
      case 'obj': cv = e.tile ? Tiles.get(e.tile, this.map.theme, 0, 0) : e.obj ? Sprites.obj(typeof e.obj === 'function' ? e.obj() : e.obj, anim2) : null; break;
      case 'boss': {
        const mc = MonsterSprites.get(e.enemy);
        const s = e.scale || 2, w = mc.width * s, h = mc.height * s;
        const bob = Math.sin(G.frame / 20) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + TS - 4, w * 0.35, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(mc, sx + TS / 2 - w / 2, sy + TS - h + bob, w, h);
        return;
      }
    }
    if (!cv) return;
    if (e.type === 'obj' && e.big) { ctx.drawImage(cv, sx - TS / 2, sy - TS, TS * 2, TS * 2); return; }
    ctx.drawImage(cv, sx, sy, TS, TS);
  },
  drawDark() {
    const m = this.map;
    const dark = typeof m.dark === 'function' ? m.dark() : m.dark;
    if (!dark) return;
    if (!this.darkCv) { this.darkCv = document.createElement('canvas'); this.darkCv.width = VIEW_W; this.darkCv.height = VIEW_H; }
    const dc = this.darkCv.getContext('2d');
    dc.globalCompositeOperation = 'source-over';
    dc.clearRect(0, 0, VIEW_W, VIEW_H);
    dc.fillStyle = m.darkColor || `rgba(6,4,14,${dark})`;
    if (!m.darkColor) dc.fillStyle = `rgba(6,4,14,${dark})`;
    dc.fillRect(0, 0, VIEW_W, VIEW_H);
    dc.globalCompositeOperation = 'destination-out';
    const light = (x, y, r, a = 1) => {
      const flick = 1 + Math.sin(G.frame / 7 + x) * 0.03;
      const g = dc.createRadialGradient(x, y, 0, x, y, r * flick);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.7})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dc.fillStyle = g; dc.beginPath(); dc.arc(x, y, r * flick, 0, Math.PI * 2); dc.fill();
    };
    const cam = this.cam, p = this.player;
    light(p.px - cam.x + TS / 2, p.py - cam.y + TS / 2, TS * (m.def.lightR || 3.6));
    for (const e of m.ents) {
      if (!this.active(e)) continue;
      if (e.type === 'bonfire' && !(e.off && e.off())) light(e.px - cam.x + TS / 2, e.py - cam.y + TS / 2, TS * 3.2);
      if (e.type === 'lantern' && State.flag(e.flag)) light(e.px - cam.x + TS / 2, e.py - cam.y + TS / 2, TS * 3.6);
      if (e.light) light(e.px - cam.x + TS / 2, e.py - cam.y + TS / 2, TS * e.light);
    }
    const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
    for (let y = y0; y < y0 + 14; y++) for (let x = x0; x < x0 + 22; x++) {
      const t = this.tileAt(x, y);
      const r = { E: 2.6, j: 2.6, q: 2.6, '*': 1.7, e: 1.3 }[t];
      if (r) light(x * TS - cam.x + TS / 2, y * TS - cam.y + TS / 2, TS * r, 0.8);
    }
    ctx.drawImage(this.darkCv, 0, 0);
  },

  // ---------- partículas de ambiente ----------
  initAmbient(kind) {
    this.ambient = kind; this.particles = [];
    const n = { fireflies: 22, snow: 90, fog: 9, embers: 45, dust: 18, leaves: 14 }[kind] || 0;
    for (let i = 0; i < n; i++) this.particles.push(this.newParticle(kind, true));
  },
  newParticle(kind, init) {
    const x = U.rand(0, VIEW_W), y = init ? U.rand(0, VIEW_H) : (kind === 'embers' ? VIEW_H + 10 : -20);
    switch (kind) {
      case 'fireflies': return { x, y: U.rand(0, VIEW_H), vx: U.rand(-0.3, 0.3), vy: U.rand(-0.3, 0.3), ph: U.rand(0, 6) };
      case 'snow': return { x, y, vx: U.rand(-0.6, 0.2), vy: U.rand(0.8, 2.2), r: U.rand(1.5, 3.5) };
      case 'fog': return { x: init ? x : -300, y: U.rand(0, VIEW_H), vx: U.rand(0.2, 0.6), r: U.rand(120, 240) };
      case 'embers': return { x, y, vx: U.rand(-0.4, 0.4), vy: U.rand(-0.6, -1.6), life: U.rand(0, 1) };
      case 'dust': return { x, y: U.rand(0, VIEW_H), vx: U.rand(-0.2, 0.2), vy: U.rand(-0.15, 0.15), ph: U.rand(0, 6) };
      case 'leaves': return { x, y, vx: U.rand(-0.8, -0.2), vy: U.rand(0.6, 1.2), ph: U.rand(0, 6) };
    }
    return { x, y };
  },
  updateAmbient() {
    const k = this.ambient;
    for (let i = 0; i < this.particles.length; i++) {
      const q = this.particles[i];
      if (k === 'fireflies' || k === 'dust') { q.ph += 0.03; q.x += q.vx + Math.sin(q.ph) * 0.3; q.y += q.vy + Math.cos(q.ph * 0.7) * 0.3; if (q.x < -10) q.x = VIEW_W + 10; if (q.x > VIEW_W + 10) q.x = -10; if (q.y < -10) q.y = VIEW_H + 10; if (q.y > VIEW_H + 10) q.y = -10; }
      else if (k === 'snow' || k === 'leaves') { if (q.ph != null) { q.ph += 0.05; q.x += Math.sin(q.ph) * 0.8; } q.x += q.vx; q.y += q.vy; if (q.y > VIEW_H + 10 || q.x < -20) this.particles[i] = this.newParticle(k, false); }
      else if (k === 'fog') { q.x += q.vx; if (q.x - q.r > VIEW_W) this.particles[i] = this.newParticle(k, false); }
      else if (k === 'embers') { q.x += q.vx + Math.sin(G.frame / 20 + i) * 0.3; q.y += q.vy; q.life -= 0.004; if (q.y < -10 || q.life <= 0) { this.particles[i] = this.newParticle(k, false); this.particles[i].life = 1; } }
    }
  },
  drawAmbient() {
    const k = this.ambient; if (!k) return;
    ctx.save();
    for (const q of this.particles) {
      if (k === 'fireflies') { const a = 0.5 + Math.sin(q.ph * 3) * 0.5; ctx.fillStyle = `rgba(220,255,120,${a * 0.25})`; ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, 7); ctx.fill(); ctx.fillStyle = `rgba(240,255,170,${a})`; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
      else if (k === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(q.x, q.y, q.r, q.r); }
      else if (k === 'fog') { const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r); g.addColorStop(0, 'rgba(200,210,190,0.22)'); g.addColorStop(1, 'rgba(200,210,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); }
      else if (k === 'embers') { ctx.fillStyle = `rgba(255,${120 + (q.life * 100 | 0)},40,${Math.max(0, q.life)})`; ctx.fillRect(q.x, q.y, 3, 3); }
      else if (k === 'dust') { ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillRect(q.x, q.y, 2, 2); }
      else if (k === 'leaves') { ctx.fillStyle = '#c8803a'; ctx.fillRect(q.x, q.y, 6, 3); }
    }
    ctx.restore();
  },
};

// conta o tempo de jogo enquanto houver um mundo carregado (inclui batalhas e diálogos)
G.onTick = () => { if (World.map && G.scenes.some(s => s.isWorld || s instanceof BattleScene || s instanceof MessageBox || s instanceof MenuScene)) State.time += 1 / 60; };

// textos ao examinar certos tiles
const TILE_TEXT = {
  k: () => U.pick(['Livros sobre faróis, marés e constelações.', '"Manual do Faroleiro, vol. 3: Como acalmar uma chama teimosa."', 'Um almanaque velho com as fases da lua anotadas à mão.']),
  w: 'A água do poço reflete o céu. Você vê o próprio rosto cansado.',
  X: () => U.pick(['"Aqui descansa quem manteve a luz acesa."', 'O nome na lápide foi apagado pelo tempo.']),
  j: 'O calor da fornalha aquece o rosto.',
  q: 'O fogo crepita na lareira.',
  B: 'Uma cama arrumada. Não é hora de dormir.',
  z: 'Uma estátua antiga de um faroleiro segurando uma lanterna.',
};

// cena que envolve o mundo
class WorldScene {
  constructor() { this.opaque = true; this.isWorld = true; }
  update() { World.update(); }
  draw() { World.draw(); }
}

// ---------- descanso na fogueira ----------
async function bonfireRest(e) {
  Audio2.sfx('ember');
  State.healAll();
  G.flash('#ffb347', 14);
  await S.say(null, 'O calor da fogueira restaura as forças do grupo. (PV e PM recuperados)');
  const c = await S.ask('Deseja salvar o progresso?', ['Salvar', 'Agora não']);
  if (c === 0) {
    if (State.save()) { Audio2.sfx('save'); await S.say(null, 'Progresso salvo.'); }
    else await S.say(null, 'Não foi possível salvar neste navegador (armazenamento bloqueado).');
  }
}

// ============================================================
//  API de roteiro usada pelos mapas
// ============================================================
const S = {
  async say(speaker, ...pages) {
    let opts = {};
    if (pages.length && typeof pages[pages.length - 1] === 'object') opts = pages.pop();
    for (const p of pages) await showMessage(speaker, p, opts);
  },
  async narrate(...pages) { for (const p of pages) await showMessage(null, p); },
  async ask(q, options, speaker) {
    const mb = new MessageBox(speaker || null, q, { hold: true });
    G.push(mb);
    await mb.promise;
    const r = await showChoice(options, { cancel: true, start: 0 });
    G.remove(mb);
    return r;
  },
  flag: k => State.flag(k),
  setFlag: (k, v = true) => State.setFlag(k, v),
  has: (id, n = 1) => State.has(id, n),
  take: (id, n = 1) => State.removeItem(id, n),
  async give(id, n = 1, silent) {
    State.addItem(id, n);
    if (silent) return;
    Audio2.sfx('item');
    const info = State.itemInfo(id);
    await S.say(null, `Recebeu *${info.name}*${n > 1 ? ' x' + n : ''}!`);
  },
  async gold(n) { State.gold += n; Audio2.sfx('item'); await S.say(null, `Recebeu *${n} moedas*!`); },
  async join(id) {
    const lv = Math.max(1, Math.round(State.party.reduce((s, h) => s + h.lv, 0) / State.party.length));
    const h = State.addHero(id, lv);
    h.setLevel(lv);
    World.rebuildFollowers();
    Audio2.sfx('levelup');
    await S.say(null, `*${h.name}* entrou para o grupo! (Nível ${lv})`);
  },
  battle: (ids, opts) => Battle.start(ids, opts),
  warp: (m, x, y, d) => World.goto(m, x, y, d),
  wait: f => G.wait(f),
  fadeOut: (f = 20) => G.fadeTo(1, f),
  fadeIn: (f = 20) => G.fadeTo(0, f),
  shake: (f, i) => G.shake(f, i),
  flash: (c, f) => G.flash(c, f),
  sfx: n => Audio2.sfx(n),
  music: n => Audio2.play(n),
  ent: id => World.ent(id),
  heal: () => State.healAll(),
  toast: (t, c) => G.toast(t, c),
  chapter(n) { if ((State.flag('chapter') || 0) < n) State.setFlag('chapter', n); },
  quest(id, st) {
    const q = QUESTS[id]; const prev = State.flag('q_' + id);
    State.setFlag('q_' + id, st);
    if (st === 'active' && prev !== 'active') { Audio2.sfx('item'); G.toast('Nova missão: ' + q.title, UI.hi); }
    if (st === 'done' && prev !== 'done') { Audio2.sfx('levelup'); G.toast('Missão concluída: ' + q.title, UI.good); }
  },
  emote(target, kind = '!', t = 50) {
    const e = target === 'player' ? World.player : typeof target === 'string' ? World.ent(target) : target;
    if (e) World.emotes.push({ ent: e, kind, t });
    return G.wait(Math.min(t, 40));
  },
  face(target, dir) { const e = target === 'player' ? World.player : World.ent(target); if (e) e.dir = dir; },
  // caminha por uma rota como "UULLD" (U/D/L/R)
  async walk(target, path, speed = 14) {
    const e = target === 'player' ? World.player : typeof target === 'string' ? World.ent(target) : target;
    if (!e) return;
    const map = { U: 'up', D: 'down', L: 'left', R: 'right' };
    for (const c of path) {
      const d = map[c]; if (!d) continue;
      const [dx, dy] = U.DIRS[d];
      e.dir = d;
      const ox = e.x, oy = e.y;
      if (e.isPlayer) e.scripted = true;
      World.startMove(e, e.x + dx, e.y + dy, speed);
      if (e.isPlayer) World.moveFollowers(ox, oy);
      await new Promise(res => { e.onArrive = res; });
    }
    if (e.isPlayer) e.scripted = false;
  },
  setPos(id, x, y, dir) { const e = World.ent(id); if (e) { e.x = x; e.y = y; e.px = x * TS; e.py = y * TS; if (dir) e.dir = dir; } },
  async shop(id) { const sc = new ShopScene(id); G.push(sc); await sc.promise; },
  async save() { if (State.save()) { Audio2.sfx('save'); await S.say(null, 'Progresso salvo.'); } },
  hero: id => State.hero(id),
};
