'use strict';
// ============================================================
//  Estado do jogo e salvamento
// ============================================================

const State = {
  SAVE_KEY: 'vale_monstrinhos_save_v1',
  opts: { textSpeed: 2 },
  invSize: 24, inv: [], tools: {}, flags: {}, stats: {}, skills: {}, monsters: [], wild: {}, season: 0, day: 1, year: 1, time: 360, weather: 'sol', look: 0,

  newGame(look) {
    Object.assign(this, {
      look: look || 0, day: 1, season: 0, year: 1, time: 6 * 60, weather: 'sol', tomorrow: 'sol',
      gold: 300, energy: 100, hp: 100, invSize: 24, inv: Array(36).fill(null), sel: 0,
      tools: { enxada: 0, regador: 0, picareta: 0, machado: 0, espada: 0, vara: 0 }, water: CAN_CAPACITY[0],
      soil: {}, objs: {}, chests: {}, ship: [], monsters: [], wild: {}, trough: 0, box: [], barnCap: 4,
      npc: {}, offerings: {}, flags: {}, skills: { farm: 0, mine: 0, combat: 0, fish: 0 }, caveMax: 0,
      stats: { planted: 0, watered: 0, harvested: 0, fish: 0, mined: 0, shipped: 0, kills: 0, tamed: 0 },
      playTime: 0, lastSummary: null,
    });
    for (const t of ['enxada', 'regador', 'picareta', 'machado', 'espada', 'vara']) this.addItem(t, 1);
    this.addItem('sem_nabo', 15);
    this.addItem('biscoito', 3);
  },

  // ---------- calendário ----------
  get dayIndex() { return (this.year - 1) * 28 + this.season * 7 + this.day; },
  get seasonKey() { return SEASON_KEYS[this.season]; },
  weekday() { return WEEKDAYS[(this.dayIndex - 1) % 7]; },
  clock() { const t = this.time % (24 * 60), h = Math.floor(t / 60), m = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
  dateText() { return `${this.weekday()}, ${this.day} de ${SEASONS[this.season]}`; },
  slot() { return this.time < 12 * 60 ? 0 : this.time < 18 * 60 ? 1 : 2; },

  // ---------- atributos ----------
  skillLevel(k) { const xp = this.skills[k] || 0; let l = 0; while (l < 5 && xp >= SKILL_XP[l + 1]) l++; return l; },
  addXp(k, n) {
    const before = this.skillLevel(k);
    this.skills[k] = (this.skills[k] || 0) + n;
    const after = this.skillLevel(k);
    if (after > before) { G.toast(`${SKILL_NAMES[k]} subiu para o nível ${after}!`, UI.hi); Audio2.sfx('levelup'); }
  },
  get maxEnergy() { return 100 + (this.skillLevel('farm') + this.skillLevel('mine')) * 8; },
  get maxHp() { return 100 + this.skillLevel('combat') * 12; },
  get hearts() { return 0; },

  // ---------- inventário ----------
  addItem(id, n = 1) {
    for (let i = 0; i < this.invSize && n > 0; i++) { const s = this.inv[i]; if (s && s.id === id && ITEMS[id].kind !== 'tool' && s.n < 99) { const k = Math.min(n, 99 - s.n); s.n += k; n -= k; } }
    for (let i = 0; i < this.invSize && n > 0; i++) if (!this.inv[i]) { const k = ITEMS[id].kind === 'tool' ? 1 : Math.min(n, 99); this.inv[i] = { id, n: k }; n -= k; }
    return n; // sobra (inventário cheio)
  },
  count(id) { let c = 0; for (let i = 0; i < this.invSize; i++) if (this.inv[i] && this.inv[i].id === id) c += this.inv[i].n; return c; },
  countCat(cat) { let c = 0; for (let i = 0; i < this.invSize; i++) { const s = this.inv[i]; if (s && this.inCat(s.id, cat)) c += s.n; } return c; },
  inCat(id, cat) { const k = ITEMS[id].kind; return cat === 'fish' ? k === 'fish' && id !== 'bota' : cat === 'veg' ? k === 'crop' : false; },
  has(id, n = 1) { return this.count(id) >= n; },
  removeItem(id, n = 1) {
    for (let i = this.invSize - 1; i >= 0 && n > 0; i--) { const s = this.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) this.inv[i] = null; } }
  },
  removeCat(cat, n) {
    for (let i = this.invSize - 1; i >= 0 && n > 0; i--) { const s = this.inv[i]; if (s && this.inCat(s.id, cat)) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) this.inv[i] = null; } }
  },
  canAdd(id) { for (let i = 0; i < this.invSize; i++) { const s = this.inv[i]; if (!s || (s.id === id && s.n < 99 && ITEMS[id].kind !== 'tool')) return true; } return false; },
  selItem() { return this.inv[this.sel]; },

  // ---------- amizade com moradores ----------
  npcData(id) { return this.npc[id] || (this.npc[id] = { pts: 0, talked: 0, gifted: 0, rewards: {} }); },
  npcHearts(id) { return Math.min(5, Math.floor(this.npcData(id).pts / 100)); },
  monHearts(m) { return Math.min(5, Math.floor(m.pts / 100)); },

  // ---------- salvar ----------
  serialize() {
    const keys = ['look', 'day', 'season', 'year', 'time', 'weather', 'tomorrow', 'gold', 'energy', 'hp', 'invSize', 'inv', 'sel', 'tools', 'water', 'soil', 'objs', 'chests', 'ship', 'monsters', 'wild', 'trough', 'box', 'barnCap', 'npc', 'offerings', 'flags', 'skills', 'caveMax', 'stats', 'playTime'];
    const o = { v: 1 };
    for (const k of keys) o[k] = this[k];
    return JSON.parse(JSON.stringify(o));
  },
  deserialize(d) { this.newGame(d.look); Object.assign(this, d); },
  save() { try { localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.serialize())); return true; } catch (e) { return false; } },
  loadSaved() { try { const s = localStorage.getItem(this.SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  hasSave() { return !!this.loadSaved(); },
};
