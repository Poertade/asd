'use strict';
// ============================================================
//  Batalha por turnos (visão lateral)
// ============================================================

// espera em quadros respeitando a velocidade de batalha escolhida
const bw = n => G.wait(Math.max(1, Math.round(n / (State.opts.battleSpeed || 1))));

const Combat = {
  damage(u, t, sk) {
    let A, D;
    if (sk.type === 'phys') { A = u.stat('atk'); D = t.stat('def'); }
    else { A = u.stat('mag'); D = t.stat('mag') * 0.5 + t.stat('def') * 0.25; }
    let dmg = (sk.pow || 1) * A * 1.6 * 50 / (50 + D);
    dmg *= U.rand(0.9, 1.1);
    let weak = false, resist = false;
    if (sk.el) { if (t.weak(sk.el)) { dmg *= 1.5; weak = true; } else if (t.resist(sk.el)) { dmg *= 0.5; resist = true; } }
    let crit = false;
    if (sk.type === 'phys' && U.chance(0.06 + (sk.crit || 0))) { dmg *= 1.5; crit = true; }
    if (t.defending) dmg *= 0.5;
    return { dmg: Math.max(1, Math.round(dmg)), weak, resist, crit };
  },
  missChance(u, t) { return 0.04 + U.clamp((t.stat('spd') - u.stat('spd')) * 0.004, 0, 0.08); },
  heal(u, sk) {
    if (sk.pctHeal) return null;
    return Math.round((sk.base || 0) + u.stat('mag') * (sk.pow || 1) * 2.0 * U.rand(0.95, 1.05));
  },
};

// ---------- fundos de batalha ----------
const BG_CACHE = {};
function battleBg(kind) {
  if (BG_CACHE[kind]) return BG_CACHE[kind];
  const W = 240, H = 100;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const R = U.seeded(U.hash(kind) + 3);
  const grad = (y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const hills = (y, amp, col, freq, seed) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 2) c.lineTo(x, y - Math.abs(Math.sin(x * freq + seed)) * amp - Math.sin(x * freq * 2.7 + seed) * amp * 0.3); c.lineTo(W, H); c.fill(); };
  const P = {
    field: { sky: [[0, '#5aa0e8'], [1, '#bfe4ff']], far: '#7fb07a', mid: '#5c9e3e', ground: [[0, '#6aab48'], [1, '#3f7a2e']] },
    forest: { sky: [[0, '#1d3a2a'], [1, '#4f7a4a']], far: '#24452c', mid: '#1a3622', ground: [[0, '#3f6e34'], [1, '#22421f']] },
    cave: { sky: [[0, '#120e18'], [1, '#2e2638']], far: '#2a2232', mid: '#221a2a', ground: [[0, '#4a4250'], [1, '#2a2430']] },
    swamp: { sky: [[0, '#2a3a2e'], [1, '#6a7a5a']], far: '#3a4a36', mid: '#2e3a2a', ground: [[0, '#4a5a3a'], [1, '#2a3424']] },
    snow: { sky: [[0, '#8fb4d8'], [1, '#e8f2fc']], far: '#c8d8ea', mid: '#a8bcd2', ground: [[0, '#f0f6fc'], [1, '#c3d1e2']] },
    lighthouse: { sky: [[0, '#0a0c24'], [1, '#2a2a5a']], far: '#1a1a3a', mid: '#141430', ground: [[0, '#6a6070'], [1, '#3a3442']] },
    tower: { sky: [[0, '#0c0614'], [1, '#2a1638']], far: '#1e1028', mid: '#160a20', ground: [[0, '#3a3150'], [1, '#1a1426']] },
    final: { sky: [[0, '#000000'], [1, '#3a0a3a']], far: '#1a0626', mid: '#10041a', ground: [[0, '#2a1438'], [1, '#08040e']] },
    ruins: { sky: [[0, '#1e2a2a'], [1, '#5a6a5a']], far: '#2e3a36', mid: '#26302c', ground: [[0, '#4a5446'], [1, '#262e26']] },
  }[kind] || {};
  c.fillStyle = grad(0, 50, P.sky || [[0, '#000'], [1, '#333']]); c.fillRect(0, 0, W, 52);
  if (kind === 'lighthouse' || kind === 'tower' || kind === 'final') for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${R() * 0.8})`; c.fillRect(R() * W | 0, R() * 45 | 0, 1, 1); }
  if (kind === 'field') { c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 4; i++) { const x = R() * W, y = 6 + R() * 18; c.fillRect(x, y, 18, 3); c.fillRect(x + 4, y - 2, 10, 2); } }
  if (kind === 'snow' || kind === 'field') { hills(44, 20, P.far, 0.03, R() * 10); }
  else hills(46, 10, P.far, 0.05, R() * 10);
  if (kind === 'forest') for (let i = 0; i < 14; i++) { const x = R() * W | 0, h = 20 + R() * 25; c.fillStyle = P.mid; c.fillRect(x, 50 - h, 4, h); c.beginPath(); c.arc(x + 2, 50 - h, 8 + R() * 6, 0, 7); c.fill(); }
  if (kind === 'swamp' || kind === 'ruins') for (let i = 0; i < 8; i++) { const x = R() * W | 0, h = 14 + R() * 20; c.fillStyle = P.mid; c.fillRect(x, 50 - h, 3, h); c.fillRect(x - 4, 50 - h + 4, 5, 1); c.fillRect(x + 2, 50 - h + 8, 6, 1); if (kind === 'ruins') { c.fillStyle = '#5a6a62'; c.fillRect(x + 10, 50 - h, 6, h); } }
  if (kind === 'cave') for (let i = 0; i < 18; i++) { const x = R() * W | 0, h = 6 + R() * 16; c.fillStyle = '#1a141f'; c.beginPath(); c.moveTo(x - 4, 0); c.lineTo(x, h); c.lineTo(x + 4, 0); c.fill(); }
  if (kind === 'cave') for (let i = 0; i < 6; i++) { c.fillStyle = '#5ab8f0'; const x = R() * W | 0; c.fillRect(x, 44 + R() * 6 | 0, 2, 4); }
  if (kind === 'snow') { hills(50, 8, P.mid, 0.06, 3); }
  if (kind === 'tower' || kind === 'final') for (let i = 0; i < 12; i++) { c.fillStyle = kind === 'final' ? '#3a1050' : '#2a2040'; c.fillRect(R() * W | 0, R() * 45 | 0, 6 + R() * 6 | 0, 3); }
  if (kind === 'lighthouse') { c.fillStyle = '#6a6070'; c.fillRect(0, 38, W, 14); for (let x = 0; x < W; x += 12) { c.fillStyle = '#4a4252'; c.fillRect(x, 38, 1, 14); } c.fillStyle = '#ffd77a'; c.fillRect(20, 20, 3, 3); }
  // chão
  c.fillStyle = grad(50, H, P.ground || [[0, '#444'], [1, '#222']]); c.fillRect(0, 50, W, H - 50);
  for (let i = 0; i < 140; i++) { const y = 52 + R() * 48, a = 0.08 + R() * 0.12; c.fillStyle = R() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.6})`; c.fillRect(R() * W | 0, y | 0, 2 + R() * 4 | 0, 1); }
  if (kind === 'swamp') for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(90,140,110,0.35)'; c.fillRect(R() * W | 0, 56 + R() * 40 | 0, 14, 2); }
  // ampliação pixelada
  const big = document.createElement('canvas'); big.width = VIEW_W; big.height = 400;
  const bc = big.getContext('2d'); bc.imageSmoothingEnabled = false; bc.drawImage(cv, 0, 0, W, H, 0, 0, VIEW_W, 400);
  return (BG_CACHE[kind] = big);
}

// ---------- IA de chefes ----------
const AI = {
  raiz(b, f) {
    f.turn++;
    if (!f.flags.p2 && f.hp < f.maxHp * 0.5) { f.flags.p2 = true; b.summon(['broto', 'broto'], 'Brotos sombrios irrompem do chão!'); return { skill: 'b_floracao' }; }
    if (f.flags.p2 && f.turn % 5 === 0 && !b.foes.some(x => x.alive && x.id === 'broto')) { b.summon(['broto'], 'Um broto sombrio renasce!'); return { skill: 'b_seiva' }; }
    return null;
  },
  colosso(b, f) {
    f.turn++;
    if (f.turn % 4 === 3) { f.chargeNext = 'b_laser'; return { skill: 'e_carga', msg: 'O núcleo do Colosso brilha cada vez mais quente!' }; }
    return null;
  },
  hidra(b, f) {
    f.turn++;
    for (const h of b.foes) {
      if (h === f || h.alive) continue;
      f.flags[h.uid] = (f.flags[h.uid] || 0) + 1;
      if (f.flags[h.uid] >= 3) {
        f.flags[h.uid] = 0;
        h.hp = Math.floor(h.maxHp * 0.5); h.status = {}; h.buffs = {}; h.alpha = 1; h.dead = false;
        return { special: async () => { b.msg = 'A Hidra regenera uma cabeça!'; Audio2.sfx('roar'); G.shake(14, 5); b.pop(h, 'Regenerada!', UI.good); await bw(50); } };
      }
    }
    return null;
  },
  grifo(b, f) {
    f.turn++;
    if (f.turn % 5 === 4) { f.chargeNext = 'b_mergulho'; return { skill: 'e_carga', msg: 'O Grifo sobe alto, mirando em alguém...' }; }
    return null;
  },
  aurelio(b, f) {
    f.turn++;
    if (b.heroes.some(h => h.alive && Object.values(h.buffs).some(x => x.v > 0)) && U.chance(0.35)) return { skill: 'b_apagar' };
    if (f.turn % 6 === 5) { f.chargeNext = 'b_eclipse'; return { skill: 'e_carga', msg: 'A lanterna negra suga toda a luz da sala!' }; }
    return null;
  },
  vazio(b, f) {
    f.turn++;
    if (!f.flags.p2 && f.hp < f.maxHp * 0.5) {
      f.flags.p2 = true;
      return { special: async () => {
        b.msg = 'O Vazio revela sua forma verdadeira!';
        Audio2.sfx('roar'); G.shake(40, 8); G.flash('#ff3a2a', 20);
        f.sprite = MonsterSprites.get('vazio2');
        f.e = Object.assign({}, f.e, { name: 'O Vazio — Forma Verdadeira' });
        f.buffs = {}; f.status = {};
        await bw(70);
      } };
    }
    if (f.turn % 5 === 4) { f.chargeNext = 'b_eclipse'; return { skill: 'e_carga', msg: 'O Vazio abre todos os olhos. A escuridão se adensa...' }; }
    return null;
  },
  guardiao(b, f) {
    f.turn++;
    if (f.turn % 4 === 3) { f.chargeNext = 'b_julgamento'; return { skill: 'e_carga', msg: 'O Guardião ergue a espada em brasa para o céu!' }; }
    return null;
  },
};
function foeActs(f) {
  const id = f.id;
  if (id === 'colosso') return f.hp < f.maxHp * 0.4 ? 2 : 1;
  if (id === 'grifo' || id === 'guardiao') return 2;
  if (id === 'aurelio') return f.hp < f.maxHp * 0.5 ? 2 : 1;
  if (id === 'vazio') return 2;
  if (id === 'raiz_mae') return f.flags.p2 ? 2 : 1;
  if (id === 'javali_rei') return f.hp < f.maxHp * 0.5 ? 2 : 1;
  return 1;
}

// ---------- controle externo ----------
const Battle = {
  start(ids, opts = {}) {
    return new Promise((resolve, reject) => {
      const snap = State.snapshot();
      const mapMusic = () => { const md = World.map && World.map.def.music; return typeof md === 'function' ? md() : md; };
      const launch = async (retry) => {
        Audio2.sfx('encounter');
        Audio2.play(opts.music || (opts.boss ? 'boss' : 'battle'));
        if (!retry) { G.flash('#ffffff', 10); await bw(8); }
        await G.fadeTo(1, 12);
        const sc = new BattleScene(ids, opts, async result => {
          if (result === 'lose') {
            const go = new GameOverScene(async choice => {
              if (choice === 'retry') {
                State.restore(snap); World.rebuildFollowers();
                G.remove(go); launch(true);
              } else {
                G.remove(go);
                reject(new ScriptAbort());
                if (choice === 'load') loadGame(); else toTitle();
              }
            });
            G.remove(sc); G.push(go);
            G.fadeTo(0, 20);
          } else {
            await G.fadeTo(1, 14);
            G.remove(sc);
            for (const h of State.party) { h.clearBattle(); if (!h.alive) h.hp = 1; }
            Audio2.play(mapMusic());
            State.battles++;
            await G.fadeTo(0, 14);
            resolve(result);
          }
        });
        G.push(sc);
        await G.fadeTo(0, 12);
        sc.begin();
      };
      launch(false);
    });
  },
};

class BattleScene {
  constructor(ids, opts, done) {
    this.opaque = true; this.opts = opts; this.done = done;
    this.heroes = State.party.slice();
    this.foes = [];
    this.uidc = 0;
    for (const id of ids) this.addFoe(id);
    this.nameFoes();
    this.layout();
    this.heroes.forEach((h, i) => { h.clearBattle(); Object.assign(h, { bx: 712 + i * 34, by: 126 + i * 64, ox: 0, oy: 0, flash: 0, shake: 0, pose: 0 }); });
    this.msg = ''; this.particles = []; this.popups = []; this.overlays = []; this.ui = null;
    this.bg = battleBg(opts.bg || 'field');
    this.canFlee = opts.canFlee !== undefined ? opts.canFlee : !opts.boss;
    this.fleeBonus = 0; this.reserved = {};
    this.activeHero = null; this.round = 0;
  }
  addFoe(id) {
    const f = new Foe(id);
    f.uid = 'f' + (this.uidc++);
    f.sprite = MonsterSprites.get(id);
    Object.assign(f, { ox: 0, oy: 0, flash: 0, shake: 0, alpha: 1, dead: false });
    this.foes.push(f);
    return f;
  }
  nameFoes() {
    const counts = {};
    for (const f of this.foes) counts[f.id] = (counts[f.id] || 0) + 1;
    const idx = {};
    for (const f of this.foes) if (counts[f.id] > 1 && !f.suffix) { idx[f.id] = (idx[f.id] || 0) + 1; f.suffix = ' ' + 'ABCDEF'[idx[f.id] - 1]; }
  }
  fname(f) { return f.isHero ? f.name : f.name + (f.suffix || ''); }
  layout() {
    const fs = this.foes;
    const ws = fs.map(f => f.sprite.width * PX);
    const total = ws.reduce((a, b) => a + b, 0);
    const avail = 560;
    const gap = Math.max(0, (avail - total) / (fs.length + 1));
    let x = 40 + gap;
    const hydra = fs.some(f => f.id === 'hidra_corpo');
    fs.forEach((f, i) => {
      f.cx = x + ws[i] / 2; x += ws[i] + gap;
      f.footY = 380 - (fs.length >= 3 && i % 2 === 1 && !hydra ? 26 : 0);
      if (hydra && f.id !== 'hidra_corpo') f.footY = 360;
    });
  }
  summon(ids, msg) {
    const alive = this.foes.filter(f => f.alive);
    if (alive.length >= 5) return;
    for (const id of ids) { const f = this.addFoe(id); f.alpha = 0; f.fadeIn = true; }
    this.foes = this.foes.filter(f => f.alive || f.fadeIn);
    this.nameFoes(); this.layout();
    this.msg = msg;
    Audio2.sfx('nature');
  }
  center(b) {
    if (b.isHero) return { x: b.bx + 32 + b.ox, y: b.by + 32 + b.oy };
    return { x: b.cx + b.ox, y: b.footY - b.sprite.height * PX / 2 + b.oy };
  }
  side(b) { return b.isHero ? this.heroes : this.foes; }
  opp(b) { return b.isHero ? this.foes : this.heroes; }

  // ---------- fluxo principal ----------
  async begin() {
    const names = [...new Set(this.foes.map(f => f.name))];
    this.msg = this.opts.intro || (this.foes.length === 1 ? `${this.foes[0].name} apareceu!` : `${names.join(', ')} apareceram!`);
    await bw(60);
    let result;
    try { result = await this.loop(); } catch (e) { console.error(e); result = 'win'; }
    this.done(result);
  }
  async loop() {
    for (;;) {
      this.round++;
      const acts = await this.commandPhase();
      let list = [];
      if (acts === 'flee') {
        const hs = this.heroes.filter(h => h.alive), fs = this.foes.filter(f => f.alive);
        const avg = a => a.reduce((s, b) => s + b.stat('spd'), 0) / Math.max(1, a.length);
        const ch = U.clamp(0.5 + (avg(hs) - avg(fs)) * 0.03 + this.fleeBonus, 0.25, 0.95);
        this.msg = 'Tentando fugir...'; await bw(30);
        if (U.chance(ch)) { Audio2.sfx('flee'); this.msg = 'O grupo fugiu da batalha!'; for (const h of this.heroes) h.oy = 0; await bw(45); return 'flee'; }
        this.fleeBonus += 0.15;
        this.msg = 'Não conseguiram fugir!'; Audio2.sfx('buzz'); await bw(40);
      } else list = acts.map(a => ({ ...a, spd: a.actor.stat('spd') * U.rand(0.85, 1.15) + (a.kind === 'defend' ? 999 : 0) }));
      for (const f of this.foes) if (f.alive) {
        const n = foeActs(f);
        for (let i = 0; i < n; i++) list.push({ kind: 'foe', actor: f, spd: f.stat('spd') * U.rand(0.85, 1.15) * (i ? 0.6 : 1) - i * 5 });
      }
      list.sort((a, b) => b.spd - a.spd);
      for (const a of list) {
        if (!a.actor.alive) continue;
        if (this.over()) break;
        await this.perform(a);
        const o = this.over(); if (o) break;
      }
      const o = this.over();
      if (o) return o === 'win' ? await this.victory() : await this.defeat();
      await this.endRound();
      const o2 = this.over();
      if (o2) return o2 === 'win' ? await this.victory() : await this.defeat();
    }
  }
  over() {
    if (this.foes.every(f => !f.alive)) return 'win';
    if (this.heroes.every(h => !h.alive)) return 'lose';
    return null;
  }

  // ---------- fase de comandos ----------
  async commandPhase() {
    const able = this.heroes.filter(h => h.alive && !h.status.sleep && !h.status.stun);
    const acts = [];
    this.reserved = {};
    let i = 0;
    while (i < able.length) {
      const h = able[i];
      this.activeHero = h;
      const a = await this.chooseAction(h, i > 0);
      if (a === 'back') {
        i--; const prev = acts.pop();
        if (prev && prev.kind === 'item') this.reserved[prev.item]--;
        continue;
      }
      if (a.kind === 'flee') { this.activeHero = null; return 'flee'; }
      if (a.kind === 'item') this.reserved[a.item] = (this.reserved[a.item] || 0) + 1;
      acts.push(a); i++;
    }
    this.activeHero = null;
    this.msg = '';
    return acts;
  }
  async chooseAction(h, canBack) {
    for (;;) {
      this.msg = `${h.name}: o que fazer?`;
      const c = await this.uiCommand(h);
      if (c === 'back') { if (canBack) return 'back'; continue; }
      if (c === 0) { const t = await this.uiTarget('enemy', h); if (t) return { kind: 'skill', actor: h, skill: 'atk', targets: t }; }
      else if (c === 1) {
        const s = await this.uiSkill(h); if (!s) continue;
        const t = await this.uiTarget(SKILLS[s].tgt, h); if (t) return { kind: 'skill', actor: h, skill: s, targets: t };
      } else if (c === 2) {
        const it = await this.uiItem(h); if (!it) continue;
        const t = await this.uiTarget(ITEMS[it].tgt, h); if (t) return { kind: 'item', actor: h, item: it, targets: t };
      } else if (c === 3) return { kind: 'defend', actor: h };
      else if (c === 4) {
        if (!this.canFlee) { Audio2.sfx('buzz'); this.msg = 'Não há como fugir desta batalha!'; await bw(50); continue; }
        return { kind: 'flee' };
      }
    }
  }
  // menus internos (promessas resolvidas em update)
  uiCommand(h) {
    return new Promise(res => {
      this.ui = { type: 'cmd', hero: h, sel: this.lastCmd && this.lastCmd[h.id] || 0, res: v => { this.ui = null; res(v); } };
    });
  }
  uiSkill(h) {
    const list = h.skills();
    return new Promise(res => {
      const lv = new ListView({
        items: list, x: 30, y: 84, w: 600, rowH: 40, visible: 7,
        enabled: s => h.mp >= (SKILLS[s].mp || 0) && !h.status.silence,
        drawRow: (s, x, y, sel, en) => {
          const sk = SKILLS[s];
          text(sk.name, x, y + 6, { size: 28, color: en ? (sel ? UI.hi : UI.text) : UI.dim });
          text(`${sk.mp} PM`, x + 548, y + 6, { size: 26, align: 'right', color: en ? UI.mp : UI.dim });
          if (sk.el) { ctx.fillStyle = ELEMENTS[sk.el].color; ctx.fillRect(x + 440, y + 14, 12, 12); }
        },
      });
      lv.sel = (this.lastSkill && this.lastSkill[h.id]) || 0; lv.clampSel();
      this.ui = { type: 'list', lv, title: 'Habilidades', desc: s => SKILLS[s].desc + (h.status.silence ? ' (Silenciado!)' : ''), res: v => { this.ui = null; if (v) { this.lastSkill = this.lastSkill || {}; this.lastSkill[h.id] = lv.sel; } res(v); } };
    });
  }
  uiItem() {
    const avail = id => State.count(id) - (this.reserved[id] || 0);
    const list = State.usableItems(true).filter(id => avail(id) > 0);
    return new Promise(res => {
      const lv = new ListView({
        items: list, x: 30, y: 84, w: 600, rowH: 40, visible: 7, empty: 'Nenhum item utilizável.',
        drawRow: (id, x, y, sel) => {
          drawIcon(id, x, y + 4, 2);
          text(ITEMS[id].name, x + 40, y + 6, { size: 28, color: sel ? UI.hi : UI.text });
          text('x' + avail(id), x + 548, y + 6, { size: 26, align: 'right' });
        },
      });
      this.ui = { type: 'list', lv, title: 'Itens', desc: id => ITEMS[id].desc, res: v => { this.ui = null; res(v); } };
    });
  }
  uiTarget(kind, user) {
    if (kind === 'self') return Promise.resolve([user]);
    if (kind === 'none') return Promise.resolve([]);
    let pool, all = false;
    if (kind === 'enemy' || kind === 'enemies') pool = this.foes.filter(f => f.alive);
    else if (kind === 'ally_dead') pool = this.heroes.filter(h => !h.alive);
    else pool = this.heroes.filter(h => h.alive);
    if (kind === 'enemies' || kind === 'allies') all = true;
    if (!pool.length) { Audio2.sfx('buzz'); this.msg = 'Nenhum alvo válido.'; return Promise.resolve(null); }
    let sel = 0;
    if (kind === 'ally' || kind === 'ally_dead') { const i = pool.indexOf(user); if (i >= 0 && kind === 'ally') sel = i; }
    if (pool === this.foes || kind === 'enemy') { const i = pool.indexOf(this.lastTarget); if (i >= 0) sel = i; }
    return new Promise(res => {
      this.ui = { type: 'target', pool, all, sel, user, res: v => { this.ui = null; if (v && !all && !pool[0].isHero) this.lastTarget = v[0]; res(v); } };
    });
  }

  // ---------- execução ----------
  async perform(a) {
    const u = a.actor;
    if (a.kind === 'foe') {
      if (u.status.sleep) { this.msg = `${this.fname(u)} está dormindo...`; this.pop(u, 'Zzz', STATUS.sleep.color); await bw(30); return; }
      if (u.status.stun) { delete u.status.stun; this.msg = `${this.fname(u)} está atordoado!`; await bw(30); return; }
      const c = this.foeChoose(u);
      if (c.special) { await c.special(); return; }
      if (c.msg) { this.msg = c.msg; }
      await this.useSkill(u, c.skill, c.targets || this.autoTargets(u, SKILLS[c.skill]), c.msg);
      return;
    }
    if (u.status.sleep) { this.msg = `${u.name} está dormindo...`; this.pop(u, 'Zzz', STATUS.sleep.color); await bw(30); return; }
    if (u.status.stun) { delete u.status.stun; this.msg = `${u.name} está atordoado!`; await bw(30); return; }
    if (a.kind === 'defend') {
      u.defending = true; this.msg = `${u.name} se defende.`;
      const mpg = Math.max(1, Math.round(u.maxMp * 0.05)); u.mp = Math.min(u.maxMp, u.mp + mpg);
      this.pop(u, `+${mpg} PM`, UI.mp); Audio2.sfx('buff');
      await bw(24); return;
    }
    if (a.kind === 'item') {
      if (!State.has(a.item)) { this.msg = `Não há mais ${ITEMS[a.item].name}!`; await bw(30); return; }
      State.removeItem(a.item);
      this.reserved[a.item] = Math.max(0, (this.reserved[a.item] || 0) - 1);
      await this.useItem(u, a.item, this.fixTargets(u, ITEMS[a.item].tgt, a.targets));
      return;
    }
    const sk = SKILLS[a.skill];
    if (sk.mp && u.mp < sk.mp) { this.msg = `${u.name} não tem PM suficiente!`; await bw(30); return; }
    if (sk.mp && u.status.silence) { this.msg = `${u.name} está silenciado e não consegue usar habilidades!`; await bw(40); return; }
    if (sk.mp) u.mp -= sk.mp;
    await this.useSkill(u, a.skill, this.fixTargets(u, sk.tgt, a.targets));
  }
  fixTargets(u, kind, targets) {
    if (kind === 'enemies') return this.opp(u).filter(b => b.alive);
    if (kind === 'allies') return this.side(u).filter(b => b.alive);
    if (kind === 'ally_dead') return targets.filter(t => !t.alive);
    if (kind === 'self') return [u];
    const t = targets[0];
    if (t && t.alive) return [t];
    if (kind === 'enemy') { const alive = this.opp(u).filter(b => b.alive); return alive.length ? [U.pick(alive)] : []; }
    if (kind === 'ally') { const alive = this.side(u).filter(b => b.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp); return alive.length ? [alive[0]] : []; }
    return [];
  }
  foeChoose(f) {
    if (f.charged) { const s = f.charged; f.charged = null; return { skill: s }; }
    const ai = f.e.ai && AI[f.e.ai];
    if (ai) { const r = ai(this, f); if (r) return r; }
    const opts = f.e.acts.filter(([s]) => {
      const sk = SKILLS[s];
      if (s === 'e_cura' && f.hp > f.maxHp * 0.5) return false;
      if (sk.type === 'buff' && sk.tgt === 'self' && Object.keys(sk.buff).every(k => (f.buffs[k] && f.buffs[k].v > 0))) return false;
      return true;
    }).map(([s, w]) => ({ s, w }));
    return { skill: U.weighted(opts.length ? opts : [{ s: 'atk', w: 1 }]).s };
  }
  autoTargets(u, sk) {
    const opp = this.opp(u).filter(b => b.alive), own = this.side(u).filter(b => b.alive);
    switch (sk.tgt) {
      case 'enemies': return opp;
      case 'allies': return own;
      case 'self': return [u];
      case 'ally': return [own.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
      default: {
        const taunt = opp.filter(b => b.status.taunt);
        if (taunt.length && U.chance(0.7)) return [U.pick(taunt)];
        // heróis da frente atraem um pouco mais
        const w = opp.map((b, i) => ({ b, w: 1 + (opp.length - i) * 0.15 + (b.hp < b.maxHp * 0.3 ? 0.3 : 0) }));
        return [U.weighted(w).b];
      }
    }
  }
  async useSkill(u, skId, targets, customMsg) {
    const sk = SKILLS[skId];
    if (!customMsg) this.msg = skId === 'atk' ? `${this.fname(u)} ataca!` : `${this.fname(u)}: ${sk.name}`;
    if (sk.type === 'charge') {
      u.charged = u.chargeNext || 'atk'; u.chargeNext = null;
      Audio2.sfx('magic'); u.flash = 20;
      this.spawn('buff', [u]);
      await bw(55);
      return;
    }
    if (sk.charged) G.flash('#ffffff', 8);
    await this.lunge(u, true);
    const fxk = skId === 'atk' && u.isHero ? BASIC_FX[u.id] : sk.fx;
    this.spawn(fxk, targets);
    this.sfxFor(fxk);
    await bw(fxk === 'thunder' || fxk === 'light' ? 18 : 12);
    let anyHit = false;
    for (const t of targets) if (this.applySkill(u, sk, t)) anyHit = true;
    if (anyHit && (fxk === 'smash' || fxk === 'quake' || sk.charged)) G.shake(12, sk.charged ? 8 : 4);
    await bw(28);
    await this.lunge(u, false);
    await this.checkDeaths();
  }
  sfxFor(fx) {
    const m = { slash: 'slash', slash2: 'slash', bite: 'hit', smash: 'hit', fire: 'fire', ice: 'ice', thunder: 'thunder', nature: 'nature', light: 'light', dark: 'dark', heal: 'heal', buff: 'buff', debuff: 'debuff', poison: 'poison', status: 'status', quake: 'hit' };
    Audio2.sfx(m[fx] || 'hit');
  }
  applySkill(u, sk, t) {
    switch (sk.type) {
      case 'phys': case 'mag': {
        if (!t.alive) return false;
        let hit = false;
        for (let i = 0; i < (sk.hits || 1); i++) {
          if (!t.alive) break;
          if (sk.type === 'phys' && U.chance(Combat.missChance(u, t))) { this.pop(t, 'Errou!', '#cccccc'); Audio2.sfx('miss'); continue; }
          const r = Combat.damage(u, t, sk);
          t.hp = Math.max(0, t.hp - r.dmg);
          hit = true;
          this.pop(t, String(r.dmg), r.crit ? '#ffe04a' : '#ffffff', r.crit ? 44 : 36, i * 8);
          if (r.crit) { this.pop(t, 'Crítico!', '#ffe04a', 24, 10); Audio2.sfx('crit'); }
          if (r.weak) this.pop(t, 'Fraqueza!', '#ff8a5a', 24, 14);
          if (r.resist) this.pop(t, 'Resiste', '#a0a0b0', 24, 14);
          t.flash = 10; t.shake = 12;
          if (t.status.sleep && sk.type === 'phys') delete t.status.sleep;
          if (sk.drain && u.alive) { const d = Math.round(r.dmg * sk.drain); u.hp = Math.min(u.maxHp, u.hp + d); this.pop(u, `+${d}`, UI.good); }
          if (sk.mpDrain) { const d = Math.min(t.mp, sk.mpDrain); t.mp -= d; u.mp = Math.min(u.maxMp, u.mp + d); if (d) this.pop(t, `-${d} PM`, UI.mp, 26, 16); }
        }
        if (hit && t.alive && sk.st) this.tryStatus(t, sk.st[0], sk.st[1]);
        if (hit && t.alive && sk.buff && (!sk.buffChance || U.chance(sk.buffChance))) this.applyBuff(t, sk.buff, sk.turns || 3);
        return hit;
      }
      case 'heal': {
        if (!t.alive) return false;
        const amt = sk.pctHeal ? Math.round(t.maxHp * sk.pctHeal) : Combat.heal(u, sk);
        const real = Math.min(t.maxHp - t.hp, amt);
        t.hp += real;
        this.pop(t, `+${amt}`, UI.good);
        if (sk.cure) this.cureAll(t);
        return true;
      }
      case 'cure': { const had = this.cureAll(t); this.pop(t, had ? 'Curado!' : 'Sem efeito', had ? UI.good : '#aaa', 26); return true; }
      case 'revive': {
        if (t.alive) { this.pop(t, 'Sem efeito', '#aaa', 26); return false; }
        t.hp = Math.max(1, Math.floor(t.maxHp * sk.pct)); t.status = {}; t.buffs = {};
        this.pop(t, 'Reviveu!', UI.good, 30); return true;
      }
      case 'buff': case 'debuff': {
        if (!t.alive) return false;
        if (sk.buff) this.applyBuff(t, sk.buff, sk.turns || 3);
        if (sk.addSt) { t.status[sk.addSt] = STATUS[sk.addSt].turns; }
        return true;
      }
      case 'status': {
        if (!t.alive) return false;
        this.tryStatus(t, sk.st[0], sk.st[1], true);
        return true;
      }
      case 'dispel': {
        if (!t.alive) return false;
        let any = false;
        for (const k in t.buffs) if (t.buffs[k].v > 0) { delete t.buffs[k]; any = true; }
        for (const s of ['regen', 'taunt']) if (t.status[s]) { delete t.status[s]; any = true; }
        if (any) this.pop(t, 'Dissipado!', '#c87aff', 26);
        return true;
      }
    }
    return false;
  }
  tryStatus(t, st, chance, showFail) {
    if (t.immune(st)) { if (showFail) this.pop(t, 'Imune', '#aaa', 24, 14); return; }
    if (t.status[st]) return;
    if (!U.chance(chance)) { if (showFail) this.pop(t, 'Falhou', '#aaa', 24, 14); return; }
    t.status[st] = st === 'sleep' ? U.randi(2, 3) : STATUS[st].turns;
    this.pop(t, STATUS[st].name, STATUS[st].color, 26, 18);
  }
  applyBuff(t, buff, turns) {
    for (const [k, v] of Object.entries(buff)) {
      const cur = t.buffs[k] || { v: 0, t: 0 };
      cur.v = U.clamp(cur.v + v, -2, 2); cur.t = turns;
      if (cur.v === 0) delete t.buffs[k]; else t.buffs[k] = cur;
      this.pop(t, `${BUFF_NAMES[k]} ${v > 0 ? '▲' : '▼'}`, v > 0 ? '#7dff9c' : '#ff8a8a', 24, 16);
    }
  }
  cureAll(t) {
    let had = false;
    for (const s of ['poison', 'burn', 'sleep', 'stun', 'silence']) if (t.status[s]) { delete t.status[s]; had = true; }
    for (const k in t.buffs) if (t.buffs[k].v < 0) { delete t.buffs[k]; had = true; }
    return had;
  }
  async useItem(u, id, targets) {
    const it = ITEMS[id];
    this.msg = `${u.name} usa ${it.name}.`;
    await this.lunge(u, true);
    if (it.dmg) {
      this.spawn(it.el === 'fogo' ? 'fire' : it.el === 'gelo' ? 'ice' : 'thunder', targets);
      this.sfxFor(it.el === 'fogo' ? 'fire' : it.el === 'gelo' ? 'ice' : 'thunder');
      await bw(14);
      for (const t of targets) {
        if (!t.alive) continue;
        let d = it.dmg * U.rand(0.95, 1.05);
        if (t.weak(it.el)) d *= 1.5; else if (t.resist(it.el)) d *= 0.5;
        d = Math.round(d); t.hp = Math.max(0, t.hp - d); t.flash = 10; t.shake = 12;
        this.pop(t, String(d), '#ffffff', 36);
      }
    } else {
      this.spawn('heal', targets); Audio2.sfx('heal');
      await bw(12);
      for (const t of targets) applyItemEffect(it, t, (txt, col) => this.pop(t, txt, col));
    }
    await bw(28);
    await this.lunge(u, false);
    await this.checkDeaths();
  }
  async lunge(u, fwd) {
    if (!u.alive && fwd) return;
    const n = 7;
    for (let i = 1; i <= n; i++) {
      const k = fwd ? i / n : 1 - i / n;
      if (u.isHero) { u.ox = -36 * k; u.pose = fwd ? 1 : 0; }
      else { u.ox = 22 * k; }
      await bw(1);
    }
    if (!fwd) { u.ox = 0; u.pose = 0; }
  }
  async checkDeaths() {
    let any = false;
    for (const f of this.foes) if (!f.alive && !f.dead) { f.dead = true; any = true; Audio2.sfx('death'); f.dying = 30; }
    for (const h of this.heroes) if (!h.alive && !h.koShown) { h.koShown = true; h.status = {}; h.buffs = {}; this.pop(h, 'Nocaute', '#ff6363', 26); }
    for (const h of this.heroes) if (h.alive) h.koShown = false;
    // hidra: se o corpo morrer, as cabeças caem junto
    const body = this.foes.find(f => f.id === 'hidra_corpo');
    if (body && !body.alive) for (const f of this.foes) if (f.alive) { f.hp = 0; f.dead = true; f.dying = 30; any = true; }
    if (any) await bw(26);
  }
  async endRound() {
    const all = [...this.heroes, ...this.foes].filter(b => b.alive);
    let any = false;
    for (const b of all) {
      const big = b.e && b.e.boss;
      if (b.status.poison) { const d = Math.max(1, Math.floor(b.maxHp * (big ? 0.02 : 0.07))); b.hp = Math.max(b.isHero ? 1 : 0, b.hp - d); this.pop(b, String(d), STATUS.poison.color); any = true; }
      if (b.status.burn) { const d = Math.max(1, Math.floor(b.maxHp * (big ? 0.015 : 0.05))); b.hp = Math.max(b.isHero ? 1 : 0, b.hp - d); this.pop(b, String(d), STATUS.burn.color); any = true; }
      if (b.status.regen) { const d = Math.max(1, Math.floor(b.maxHp * 0.08)); b.hp = Math.min(b.maxHp, b.hp + d); this.pop(b, `+${d}`, UI.good); any = true; }
      for (const s of Object.keys(b.status)) { if (s === 'stun') continue; if (--b.status[s] <= 0) delete b.status[s]; }
      for (const k of Object.keys(b.buffs)) if (--b.buffs[k].t <= 0) delete b.buffs[k];
      b.defending = false;
    }
    if (any) { Audio2.sfx('poison'); await bw(36); }
    await this.checkDeaths();
  }
  async victory() {
    this.activeHero = null;
    await bw(20);
    Audio2.play('victory');
    let xp = 0, gold = 0; const drops = [];
    for (const f of this.foes) {
      State.setFlag('seen_' + f.id);
      xp += f.e.xp || 0; gold += f.e.gold || 0;
      for (const [id, ch] of f.e.drops || []) if (U.chance(ch)) drops.push(id);
    }
    State.gold += gold;
    for (const d of drops) State.addItem(d, 1);
    this.reward = { xp, gold, drops };
    this.msg = 'Vitória!';
    for (const h of this.heroes) { if (!h.alive) h.hp = 1; h.pose = 0; }
    await this.waitOk(30);
    const lines = [];
    for (const h of this.heroes) {
      const ups = h.gainXp(xp);
      for (const u of ups) {
        lines.push({ text: `${h.name} subiu para o nível ${u.lv}!`, sfx: 'levelup', hero: h });
        for (const s of u.learned) lines.push({ text: `${h.name} aprendeu *${SKILLS[s].name}*!`, sfx: 'item' });
      }
    }
    this.reward = null;
    for (const l of lines) {
      this.msg = l.text.replace(/\*/g, ''); Audio2.sfx(l.sfx);
      if (l.hero) this.spawn('buff', [l.hero]);
      await this.waitOk(20);
    }
    return 'win';
  }
  async defeat() {
    this.msg = 'O grupo foi derrotado...';
    Audio2.play('gameover');
    await bw(120);
    return 'lose';
  }
  waitOk(min = 0) {
    return new Promise(res => { this.okWait = { t: min, res }; });
  }

  // ---------- efeitos visuais ----------
  pop(b, txt, color, size = 36, delay = 0) {
    const c = this.center(b);
    this.popups.push({ x: c.x + U.randi(-10, 10), y: c.y - 20, txt, color, size, t: -delay, life: 60 });
  }
  spawn(kind, targets) {
    for (const t of targets) {
      const { x, y } = this.center(t);
      const P = (n, f) => { for (let i = 0; i < n; i++) this.particles.push(f(i)); };
      switch (kind) {
        case 'slash': this.overlays.push({ k: 'slash', x, y, t: 0, d: 12, c: '#ffffff' }); break;
        case 'slash2': this.overlays.push({ k: 'slash', x, y, t: 0, d: 12, c: '#ffffff' }); this.overlays.push({ k: 'slash', x, y, t: -5, d: 12, c: '#ffe08a', flip: true }); break;
        case 'bite': this.overlays.push({ k: 'bite', x, y, t: 0, d: 14 }); break;
        case 'smash': this.overlays.push({ k: 'burst', x, y, t: 0, d: 14, c: '#ffe08a' }); P(10, () => ({ x, y, vx: U.rand(-4, 4), vy: U.rand(-4, 1), life: 22, c: '#c8b090', s: 5, g: 0.25 })); break;
        case 'quake': P(18, () => ({ x: x + U.rand(-50, 50), y: y + 40, vx: U.rand(-1, 1), vy: U.rand(-4, -1), life: 30, c: U.pick(['#8a6a48', '#a8845a', '#6a4a30']), s: 6, g: 0.2 })); this.overlays.push({ k: 'burst', x, y: y + 30, t: 0, d: 14, c: '#c8a070' }); break;
        case 'fire': P(28, () => ({ x: x + U.rand(-30, 30), y: y + U.rand(0, 40), vx: U.rand(-1, 1), vy: U.rand(-4, -1.5), life: U.randi(20, 34), c: U.pick(['#ff5a1f', '#ff9a3a', '#ffd04a', '#fff1a8']), s: U.rand(6, 11), g: -0.02 })); break;
        case 'ice': P(18, () => ({ x: x + U.rand(-40, 40), y: y - U.rand(60, 120), vx: 0, vy: U.rand(5, 8), life: 22, c: U.pick(['#bfe1ff', '#8fd8ff', '#ffffff']), s: U.rand(4, 8), shard: true })); this.overlays.push({ k: 'flash', x, y, t: -10, d: 12, c: 'rgba(170,220,255,0.5)' }); break;
        case 'thunder': this.overlays.push({ k: 'bolt', x, y, t: 0, d: 14 }); G.flash('#fff8c0', 6); break;
        case 'nature': P(22, i => ({ x, y, ang: i / 22 * Math.PI * 2, rad: 70, spin: 0.12, life: 30, c: U.pick(['#4fa048', '#6ad04a', '#2f7a34', '#a8e070']), s: 7, orbit: true })); break;
        case 'light': this.overlays.push({ k: 'beam', x, y, t: 0, d: 22 }); P(14, () => ({ x: x + U.rand(-30, 30), y: y + U.rand(-30, 40), vx: 0, vy: U.rand(-2, -0.5), life: 30, c: '#fff6c8', s: 4 })); break;
        case 'dark': P(24, i => ({ x, y, ang: i / 24 * Math.PI * 2, rad: 90, spin: -0.08, shrink: true, life: 28, c: U.pick(['#7a3ab0', '#b06aff', '#3a1a5a']), s: 8, orbit: true })); break;
        case 'heal': P(18, () => ({ x: x + U.rand(-30, 30), y: y + U.rand(0, 40), vx: U.rand(-0.3, 0.3), vy: U.rand(-2.5, -1), life: 34, c: U.pick(['#7dff9c', '#ffffff', '#c8ffd8']), s: U.rand(3, 6), star: true })); break;
        case 'buff': P(8, i => ({ x: x - 30 + i * 9, y: y + 30, vx: 0, vy: -2.4, life: 30, c: '#ffe08a', arrow: 1 })); break;
        case 'debuff': P(8, i => ({ x: x - 30 + i * 9, y: y - 40, vx: 0, vy: 2.0, life: 30, c: '#c87aff', arrow: -1 })); break;
        case 'poison': P(16, () => ({ x: x + U.rand(-30, 30), y: y + U.rand(0, 30), vx: U.rand(-0.4, 0.4), vy: U.rand(-1.8, -0.6), life: 34, c: U.pick(['#a05ad8', '#c88aff', '#6a2a8a']), s: U.rand(4, 8), bubble: true })); break;
        case 'status': this.overlays.push({ k: 'rings', x, y, t: 0, d: 24, c: '#ff8ab8' }); break;
        default: this.overlays.push({ k: 'burst', x, y, t: 0, d: 12, c: '#ffffff' });
      }
    }
  }

  // ---------- atualização / entrada ----------
  update() {
    // partículas
    for (const p of this.particles) {
      p.life--;
      if (p.orbit) { p.ang += p.spin; if (p.shrink) p.rad *= 0.94; else p.rad *= 0.985; }
      else { p.x += p.vx || 0; p.y += p.vy || 0; if (p.g) p.vy += p.g; }
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const o of this.overlays) o.t++;
    this.overlays = this.overlays.filter(o => o.t < o.d);
    for (const p of this.popups) p.t++;
    this.popups = this.popups.filter(p => p.t < p.life);
    for (const b of [...this.heroes, ...this.foes]) { if (b.flash > 0) b.flash--; if (b.shake > 0) b.shake--; }
    for (const f of this.foes) {
      if (f.dying > 0) { f.dying--; f.alpha = f.dying / 30; }
      if (f.fadeIn) { f.alpha = Math.min(1, f.alpha + 0.05); if (f.alpha >= 1) f.fadeIn = false; }
    }
    if (this.okWait) {
      if (this.okWait.t > 0) this.okWait.t--;
      else if (Input.ok() || Input.cancel()) { const r = this.okWait.res; this.okWait = null; Audio2.sfx('cursor'); r(); }
      return;
    }
    const ui = this.ui;
    if (!ui) return;
    if (ui.type === 'cmd') {
      if (Input.rep('up')) { ui.sel = (ui.sel + 4) % 5; Audio2.sfx('cursor'); }
      if (Input.rep('down')) { ui.sel = (ui.sel + 1) % 5; Audio2.sfx('cursor'); }
      if (Input.ok()) { Audio2.sfx('ok'); this.lastCmd = this.lastCmd || {}; this.lastCmd[ui.hero.id] = ui.sel === 4 ? 0 : ui.sel; ui.res(ui.sel); }
      else if (Input.cancel()) { Audio2.sfx('cancel'); ui.res('back'); }
    } else if (ui.type === 'list') {
      const r = ui.lv.handle();
      const cur = ui.lv.current();
      if (cur) this.msg = ui.desc(cur);
      if (r === 'ok') ui.res(cur); else if (r === 'cancel') ui.res(null);
    } else if (ui.type === 'target') {
      const n = ui.pool.length;
      if (!ui.all) {
        if (Input.rep('left') || Input.rep('up')) { ui.sel = (ui.sel + n - 1) % n; Audio2.sfx('cursor'); }
        if (Input.rep('right') || Input.rep('down')) { ui.sel = (ui.sel + 1) % n; Audio2.sfx('cursor'); }
        const t = ui.pool[ui.sel];
        this.msg = t.isHero ? `${t.name}  PV ${t.hp}/${t.maxHp}` : `${this.fname(t)}${this.weakHint(t)}`;
      } else this.msg = ui.pool[0].isHero ? 'Todos os aliados' : 'Todos os inimigos';
      if (Input.ok()) { Audio2.sfx('ok'); ui.res(ui.all ? ui.pool : [ui.pool[ui.sel]]); }
      else if (Input.cancel()) { Audio2.sfx('cancel'); ui.res(null); }
    }
  }
  weakHint(f) {
    const key = 'seen_' + f.id;
    if (!State.flag(key)) return '';
    const w = (f.e.weak || []).map(e => ELEMENTS[e].name);
    return w.length ? `  (fraqueza: ${w.join(', ')})` : '';
  }

  // ---------- desenho ----------
  draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bg, 0, 0);
    // inimigos
    for (const f of this.foes) {
      if (f.dead && f.dying <= 0) continue;
      const w = f.sprite.width * PX, h = f.sprite.height * PX;
      const bob = Math.sin(G.frame / 18 + f.cx) * 3;
      const sh = f.shake > 0 ? U.randi(-5, 5) : 0;
      const x = f.cx - w / 2 + f.ox + sh, y = f.footY - h + f.oy + bob;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.cx + f.ox, f.footY, w * 0.38, 10, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = f.alpha;
      if (f.charged) { ctx.fillStyle = `rgba(255,${120 + Math.sin(G.frame / 4) * 60 | 0},60,0.35)`; ctx.beginPath(); ctx.ellipse(f.cx, f.footY - h / 2, w * 0.6, h * 0.6, 0, 0, 7); ctx.fill(); }
      ctx.drawImage(f.sprite, x, y, w, h);
      if (f.flash > 0 && f.flash % 4 < 2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * f.alpha; ctx.drawImage(f.sprite, x, y, w, h); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalAlpha = 1;
      if (f.alive) {
        if (!f.e.boss) drawBar(f.cx - 40, f.footY + 8, 80, 6, f.hp / f.maxHp, '#ff6363');
        this.drawStatusTags(f, f.cx - 40, f.footY + 16);
      }
    }
    // heróis
    for (const h of this.heroes) {
      const sh = h.shake > 0 ? U.randi(-4, 4) : 0;
      const x = h.bx + h.ox + sh, y = h.by + h.oy;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + 32, y + 62, 24, 8, 0, 0, 7); ctx.fill();
      const spr = HeroSprites.get(h.id, h.pose);
      if (!h.alive) {
        ctx.save(); ctx.translate(x + 32, y + 52); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.6; ctx.drawImage(spr, -32, -32, 64, 64); ctx.restore(); ctx.globalAlpha = 1;
      } else {
        const low = h.hp < h.maxHp * 0.25;
        ctx.drawImage(spr, x, y + (low ? 4 : 0), 64, 64);
        if (h.flash > 0 && h.flash % 4 < 2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(spr, x, y, 64, 64); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
        if (h.defending) { ctx.strokeStyle = 'rgba(140,200,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 30, y + 34, 36, -1.2, 1.2); ctx.stroke(); }
        if (h.status.sleep) text('Z', x + 48, y - 10 + Math.sin(G.frame / 10) * 4, { size: 28, color: '#8fb8ff' });
      }
      if (h === this.activeHero) drawDownArrow(x + 32, y - 22);
    }
    // efeitos
    for (const o of this.overlays) this.drawOverlay(o);
    for (const p of this.particles) {
      const a = Math.min(1, p.life / 12);
      ctx.globalAlpha = a; ctx.fillStyle = p.c;
      let px = p.x, py = p.y;
      if (p.orbit) { px = p.x + Math.cos(p.ang) * p.rad; py = p.y + Math.sin(p.ang) * p.rad * 0.7; }
      if (p.arrow) { ctx.beginPath(); ctx.moveTo(px, py - 8 * p.arrow); ctx.lineTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.fill(); ctx.fillRect(px - 2, py, 4, 8 * p.arrow); }
      else if (p.bubble) { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, p.s, 0, 7); ctx.stroke(); }
      else if (p.shard) { ctx.fillRect(px - 1, py - p.s * 1.5, 3, p.s * 3); }
      else if (p.star) { ctx.fillRect(px - p.s / 2, py - 1, p.s, 2); ctx.fillRect(px - 1, py - p.s / 2, 2, p.s); }
      else ctx.fillRect(px - p.s / 2, py - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1;
    // alvos
    if (this.ui && this.ui.type === 'target') {
      const ts = this.ui.all ? this.ui.pool : [this.ui.pool[this.ui.sel]];
      for (const t of ts) {
        const c = this.center(t);
        const yy = t.isHero ? t.by - 26 : t.footY - t.sprite.height * PX - 22;
        drawDownArrow(c.x, yy);
        if (!t.isHero) { drawBar(t.cx - 50, t.footY + 8, 100, 8, t.hp / t.maxHp, '#ff6363'); }
      }
    }
    // popups
    for (const p of this.popups) {
      if (p.t < 0) continue;
      const k = p.t / p.life;
      const yy = p.y - Math.min(30, p.t * 2) + (p.t < 10 ? -Math.sin(p.t / 10 * Math.PI) * 10 : 0);
      ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      text(p.txt, p.x, yy, { size: p.size, align: 'center', color: p.color });
      ctx.globalAlpha = 1;
    }
    // mensagem superior
    drawWin(16, 12, VIEW_W - 32, 52);
    richText(this.msg || '', 34, 22, { size: 30 });
    const boss = this.foes.find(f => f.e.boss && f.alive && (f.id !== 'hidra_fogo' && f.id !== 'hidra_veneno'));
    if (boss) {
      drawWin(16, 70, 320, 44, { alpha: 0.92 });
      text(boss.e.name.split(' — ')[0], 32, 76, { size: 22, color: UI.hi });
      drawBar(32, 100, 288, 8, boss.hp / boss.maxHp, '#ff4a4a');
    }
    this.drawPanel();
    if (this.ui && this.ui.type === 'list') {
      drawWin(16, 74, 630, 316);
      ui_title(this.ui.title, 30, 52);
      this.ui.lv.draw();
    }
    if (this.reward) {
      const r = this.reward;
      drawWin(260, 150, 440, 170);
      text('Vitória!', 480, 162, { size: 40, align: 'center', color: UI.hi });
      text(`Experiência: +${r.xp}`, 290, 212, { size: 30 });
      text(`Moedas: +${r.gold}`, 290, 246, { size: 30, color: '#ffd04a' });
      if (r.drops.length) text(`Itens: ${r.drops.map(d => State.itemInfo(d).name).join(', ')}`, 290, 280, { size: 26, color: UI.good });
    }
    if (this.okWait && this.okWait.t <= 0) drawDownArrow(VIEW_W - 50, 44);
  }
  drawStatusTags(b, x, y) {
    let i = 0;
    for (const s of Object.keys(b.status)) { const S2 = STATUS[s]; if (!S2) continue; text(S2.short, x + i * 34, y, { size: 18, color: S2.color }); i++; }
    for (const [k, v] of Object.entries(b.buffs)) { text((v.v > 0 ? '▲' : '▼') + k.toUpperCase(), x + i * 34, y, { size: 16, color: v.v > 0 ? '#7dff9c' : '#ff8a8a' }); i++; }
  }
  drawPanel() {
    const y0 = 400;
    // comandos
    drawWin(16, y0, 250, 166);
    if (this.ui && this.ui.type === 'cmd') {
      const opts = ['Atacar', 'Habilidades', 'Itens', 'Defender', 'Fugir'];
      opts.forEach((o, i) => {
        const dis = i === 4 && !this.canFlee;
        text(o, 54, y0 + 10 + i * 30, { size: 28, color: dis ? UI.dim : i === this.ui.sel ? UI.hi : UI.text });
        if (i === this.ui.sel) drawCursor(28, y0 + 15 + i * 30);
      });
    } else {
      text(`Turno ${this.round || 1}`, 36, y0 + 14, { size: 26, color: UI.dim });
      text(`${State.gold} moedas`, 36, y0 + 46, { size: 24, color: '#ffd04a' });
    }
    // grupo
    drawWin(276, y0, VIEW_W - 292, 166);
    this.heroes.forEach((h, i) => {
      const y = y0 + 10 + i * 38;
      const act = h === this.activeHero;
      if (act) { ctx.fillStyle = 'rgba(255,198,92,0.14)'; ctx.fillRect(284, y - 2, VIEW_W - 308, 36); }
      text(h.name, 296, y + 2, { size: 28, color: !h.alive ? UI.bad : act ? UI.hi : UI.text });
      text(`Nv${h.lv}`, 400, y + 6, { size: 20, color: UI.dim });
      text('PV', 448, y + 6, { size: 20, color: UI.dim });
      drawBar(476, y + 10, 140, 10, h.hp / h.maxHp, h.hp < h.maxHp * 0.25 ? '#ff6363' : UI.hp);
      text(`${h.hp}/${h.maxHp}`, 700, y + 2, { size: 26, align: 'right', color: h.hp < h.maxHp * 0.25 ? UI.bad : UI.text });
      text('PM', 712, y + 6, { size: 20, color: UI.dim });
      drawBar(740, y + 10, 70, 10, h.mp / Math.max(1, h.maxMp), UI.mp);
      text(`${h.mp}`, 852, y + 2, { size: 26, align: 'right', color: UI.mp });
      this.drawStatusTags(h, 862, y + 8);
    });
  }
  drawOverlay(o) {
    if (o.t < 0) return;
    const k = o.t / o.d;
    ctx.save();
    switch (o.k) {
      case 'slash': {
        ctx.strokeStyle = o.c; ctx.lineWidth = 6 * (1 - k) + 1; ctx.globalAlpha = 1 - k * 0.6;
        const s = o.flip ? -1 : 1, L = 70;
        ctx.beginPath(); ctx.moveTo(o.x - L * s, o.y - L); ctx.lineTo(o.x - L * s + 2 * L * s * Math.min(1, k * 2), o.y - L + 2 * L * Math.min(1, k * 2)); ctx.stroke();
        break;
      }
      case 'bite': {
        const g = 40 * (1 - Math.min(1, k * 1.6));
        ctx.fillStyle = '#ffffff';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(o.x + i * 14 - 7, o.y - g - 12); ctx.lineTo(o.x + i * 14 + 7, o.y - g - 12); ctx.lineTo(o.x + i * 14, o.y - g + 4); ctx.fill();
          ctx.beginPath(); ctx.moveTo(o.x + i * 14 - 7, o.y + g + 12); ctx.lineTo(o.x + i * 14 + 7, o.y + g + 12); ctx.lineTo(o.x + i * 14, o.y + g - 4); ctx.fill();
        }
        break;
      }
      case 'burst': {
        ctx.strokeStyle = o.c; ctx.lineWidth = 4; ctx.globalAlpha = 1 - k;
        const r = 10 + k * 50;
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(o.x + Math.cos(a) * r * 0.4, o.y + Math.sin(a) * r * 0.4); ctx.lineTo(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r); ctx.stroke(); }
        break;
      }
      case 'bolt': {
        ctx.strokeStyle = '#fff8a0'; ctx.lineWidth = 5; ctx.globalAlpha = k < 0.5 ? 1 : (1 - k) * 2;
        ctx.beginPath(); let x = o.x, y = 0; ctx.moveTo(x, y);
        const R = U.seeded(o.x * 13 + 7);
        while (y < o.y) { x = o.x + (R() - 0.5) * 50; y += 26; ctx.lineTo(x, Math.min(y, o.y)); }
        ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        break;
      }
      case 'beam': {
        const w = 60 * Math.sin(k * Math.PI);
        const g = ctx.createLinearGradient(o.x - w, 0, o.x + w, 0);
        g.addColorStop(0, 'rgba(255,250,220,0)'); g.addColorStop(0.5, 'rgba(255,250,220,0.85)'); g.addColorStop(1, 'rgba(255,250,220,0)');
        ctx.fillStyle = g; ctx.fillRect(o.x - w, 0, w * 2, o.y + 60);
        break;
      }
      case 'flash': { ctx.fillStyle = o.c; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(o.x, o.y, 70, 0, 7); ctx.fill(); break; }
      case 'rings': { ctx.strokeStyle = o.c; ctx.lineWidth = 3; ctx.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(o.x, o.y, 20 + k * 40 + i * 10, (20 + k * 40 + i * 10) * 0.5, 0, 0, 7); ctx.stroke(); } break; }
    }
    ctx.restore();
  }
}
function ui_title(t, x, y) {
  setFont(26); const w = textW(t, 26) + 30;
  drawWin(x, y, w, 36, { bgTop: 'rgba(60,40,30,0.97)', bgBot: 'rgba(30,20,16,0.97)' });
  text(t, x + 15, y + 4, { size: 26, color: UI.hi });
}

// efeito de item de cura (usado na batalha e no menu)
function applyItemEffect(it, t, pop) {
  if (it.revive) {
    if (t.alive) { pop && pop('Sem efeito', '#aaa'); return false; }
    t.hp = Math.max(1, Math.floor(t.maxHp * it.revive)); t.status = {}; pop && pop('Reviveu!', UI.good); return true;
  }
  if (!t.alive) { pop && pop('Sem efeito', '#aaa'); return false; }
  let ok = false;
  if (it.heal) { const a = Math.min(it.heal, t.maxHp - t.hp); t.hp += a; pop && pop(`+${a}`, UI.good); ok = ok || a > 0; }
  if (it.mpHeal) { const a = Math.min(it.mpHeal, t.maxMp - t.mp); t.mp += a; pop && pop(`+${a} PM`, UI.mp); ok = ok || a > 0; }
  if (it.cure) {
    const list = it.cure === 'all' ? ['poison', 'burn', 'sleep', 'stun', 'silence'] : it.cure;
    for (const s of list) if (t.status && t.status[s]) { delete t.status[s]; ok = true; }
    pop && pop('Curado!', UI.good);
    if (!ok && it.cure) ok = true;
  }
  return ok;
}
