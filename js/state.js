'use strict';
// ============================================================
//  Estado do jogo: heróis, inimigos em batalha, inventário, flags, save
// ============================================================

function buffMult(b) { if (!b || !b.v) return 1; return b.v > 0 ? 1 + 0.25 * b.v : 1 / (1 + 0.25 * -b.v); }

class Battler {
  stat(k) {
    let v = this.raw(k) * buffMult(this.buffs[k]);
    if (k === 'atk' && this.status.burn) v *= 0.85;
    return Math.max(1, v);
  }
  get alive() { return this.hp > 0; }
  hasSt(s) { return !!this.status[s]; }
  clearBattle() { this.status = {}; this.buffs = {}; this.defending = false; this.charged = null; }
}

class Hero extends Battler {
  constructor(id, lv = 1) {
    super();
    this.id = id; this.cd = CHARS[id]; this.lv = lv; this.xp = 0; this.isHero = true;
    this.equip = { weapon: this.cd.start.weapon, armor: this.cd.start.armor, acc: this.cd.start.acc };
    this.status = {}; this.buffs = {};
    this.hp = this.maxHp; this.mp = this.maxMp;
  }
  get name() { return this.cd.name; }
  baseStat(k) { return Math.floor(this.cd.base[k] + this.cd.grow[k] * (this.lv - 1)); }
  eqList() { return ['weapon', 'armor', 'acc'].map(s => this.equip[s]).filter(Boolean).map(id => EQUIPS[id]); }
  eqBonus(k) { let v = 0; for (const e of this.eqList()) v += e[k] || 0; return v; }
  raw(k) { return this.baseStat(k) + this.eqBonus(k); }
  get maxHp() { let pct = 0; for (const e of this.eqList()) pct += e.hpPct || 0; return Math.floor((this.baseStat('hp') + this.eqBonus('hp')) * (1 + pct)); }
  get maxMp() { return this.baseStat('mp') + this.eqBonus('mp'); }
  skills() { return this.cd.skills.filter(([l]) => this.lv >= l).map(([, s]) => s); }
  weak() { return false; }
  resist(el) { return this.eqList().some(e => (e.resist || []).includes(el)); }
  immune(st) { return this.eqList().some(e => (e.immune || []).includes(st)); }
  get xpNext() { return xpToNext(this.lv); }
  // ganha xp; retorna lista de níveis ganhos e habilidades novas
  gainXp(n) {
    const out = [];
    if (this.lv >= 40) return out;
    this.xp += n;
    while (this.xp >= this.xpNext && this.lv < 40) {
      this.xp -= this.xpNext;
      const oldHp = this.maxHp, oldMp = this.maxMp;
      const before = this.skills();
      this.lv++;
      this.hp += this.maxHp - oldHp; this.mp += this.maxMp - oldMp;
      const learned = this.skills().filter(s => !before.includes(s));
      out.push({ lv: this.lv, learned });
    }
    return out;
  }
  // nível de um novo membro: acompanha o grupo
  setLevel(lv) {
    this.lv = lv; this.xp = 0; this.hp = this.maxHp; this.mp = this.maxMp;
  }
}

class Foe extends Battler {
  constructor(id) {
    super();
    this.id = id; this.e = ENEMIES[id]; this.isHero = false;
    this.maxHpV = this.e.hp; this.hp = this.e.hp; this.mp = this.e.mp || 30;
    this.status = {}; this.buffs = {};
    this.turn = 0; this.flags = {};
  }
  get name() { return this.e.name; }
  get maxHp() { return this.maxHpV; }
  get maxMp() { return this.e.mp || 30; }
  raw(k) { return this.e[k] || 1; }
  weak(el) { return (this.e.weak || []).includes(el); }
  resist(el) { return (this.e.resist || []).includes(el); }
  immune(st) { return (this.e.immune || []).includes(st); }
}

const State = {
  flags: {}, heroes: {}, party: [], inv: {}, gold: 0, time: 0,
  map: 'casa_farol', x: 3, y: 3, dir: 'down', repel: 0, steps: 0, battles: 0,
  opts: { run: false, textSpeed: 2, battleSpeed: 1 },

  newGame() {
    this.flags = {}; this.heroes = {}; this.party = []; this.inv = {}; this.gold = 60; this.time = 0;
    this.repel = 0; this.steps = 0; this.battles = 0;
    this.addHero('lia', 1);
    this.addItem('erva', 3);
    this.map = 'casa_farol'; this.x = 3; this.y = 4; this.dir = 'down';
  },
  addHero(id, lv) {
    const h = new Hero(id, lv || 1);
    this.heroes[id] = h; if (!this.party.includes(h)) this.party.push(h);
    return h;
  },
  hero(id) { return this.heroes[id]; },
  inParty(id) { return this.party.some(h => h.id === id); },
  avgLevel() { return Math.round(this.party.reduce((s, h) => s + h.lv, 0) / Math.max(1, this.party.length)); },
  flag(k) { return this.flags[k]; },
  setFlag(k, v = true) { this.flags[k] = v; },
  get chapter() { return this.flags.chapter || 0; },

  // inventário (itens e equipamentos soltos)
  addItem(id, n = 1) { this.inv[id] = (this.inv[id] || 0) + n; if (this.inv[id] <= 0) delete this.inv[id]; },
  has(id, n = 1) { return (this.inv[id] || 0) >= n; },
  count(id) { return this.inv[id] || 0; },
  removeItem(id, n = 1) { this.addItem(id, -n); },
  itemInfo(id) { return ITEMS[id] || EQUIPS[id]; },
  ownedCount(id) { // inclui equipados
    let n = this.count(id);
    for (const h of Object.values(this.heroes)) for (const s of ['weapon', 'armor', 'acc']) if (h.equip[s] === id) n++;
    return n;
  },
  usableItems(battle) {
    return Object.keys(this.inv).filter(id => ITEMS[id] && !ITEMS[id].key && (battle ? !ITEMS[id].field : !ITEMS[id].battle));
  },

  healAll() { for (const h of this.party) { h.hp = h.maxHp; h.mp = h.maxMp; h.status = {}; } },

  // ---------- salvar / carregar ----------
  SAVE_KEY: 'farol_cinzas_save_v1',
  serialize() {
    const heroes = {};
    for (const [id, h] of Object.entries(this.heroes)) heroes[id] = { lv: h.lv, xp: h.xp, hp: h.hp, mp: h.mp, equip: { ...h.equip } };
    return {
      v: 1, flags: { ...this.flags }, gold: this.gold, time: this.time, inv: { ...this.inv }, heroes,
      party: this.party.map(h => h.id), map: this.map, x: this.x, y: this.y, dir: this.dir, repel: this.repel,
      steps: this.steps, battles: this.battles, opts: { ...this.opts },
    };
  },
  deserialize(d) {
    this.flags = d.flags || {}; this.gold = d.gold || 0; this.time = d.time || 0; this.inv = d.inv || {};
    this.heroes = {};
    for (const [id, hd] of Object.entries(d.heroes)) {
      const h = new Hero(id, hd.lv); h.xp = hd.xp; h.equip = { ...hd.equip }; h.hp = Math.min(hd.hp, h.maxHp); h.mp = Math.min(hd.mp, h.maxMp);
      this.heroes[id] = h;
    }
    this.party = d.party.map(id => this.heroes[id]).filter(Boolean);
    this.map = d.map; this.x = d.x; this.y = d.y; this.dir = d.dir || 'down'; this.repel = d.repel || 0;
    this.steps = d.steps || 0; this.battles = d.battles || 0;
    if (d.opts) this.opts = { ...this.opts, ...d.opts };
  },
  save() {
    if (typeof World !== 'undefined' && World.map) { this.map = World.map.id; this.x = World.player.x; this.y = World.player.y; this.dir = World.player.dir; }
    try { localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.serialize())); return true; } catch (e) { return false; }
  },
  loadSaved() {
    try { const s = localStorage.getItem(this.SAVE_KEY); if (!s) return null; return JSON.parse(s); } catch (e) { return null; }
  },
  hasSave() { return !!this.loadSaved(); },
  // instantâneo para tentar a batalha de novo
  snapshot() { return JSON.stringify(this.serialize()); },
  restore(snap) {
    const d = JSON.parse(snap);
    const keepMap = { map: this.map, x: this.x, y: this.y, dir: this.dir };
    this.deserialize(d);
    Object.assign(this, keepMap);
  },
};
