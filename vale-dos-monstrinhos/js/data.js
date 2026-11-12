'use strict';
// ============================================================
//  Vale dos Monstrinhos — dados do jogo
// ============================================================

const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'];
const DAYS_PER_SEASON = 7;
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ------------------------------------------------------------
//  Itens. kind: tool, seed, crop, forage, material, ore, gem, fish, product, food, mfood, craft, key
//  icon: [forma, cor, cor2]
// ------------------------------------------------------------
const ITEMS = {
  // ferramentas
  enxada: { name: 'Enxada', kind: 'tool', icon: ['hoe'], desc: 'Prepara a terra para o plantio.' },
  regador: { name: 'Regador', kind: 'tool', icon: ['can'], desc: 'Rega a terra. Encha na água.' },
  picareta: { name: 'Picareta', kind: 'tool', icon: ['pick'], desc: 'Quebra pedras e minérios.' },
  machado: { name: 'Machado', kind: 'tool', icon: ['axe'], desc: 'Corta galhos, tocos e árvores.' },
  espada: { name: 'Espada', kind: 'tool', icon: ['sword'], desc: 'Para se defender na caverna. Também corta mato.' },
  vara: { name: 'Vara de Pesca', kind: 'tool', icon: ['rod'], desc: 'Use virado para a água.' },

  // sementes
  sem_nabo: { name: 'Sementes de Nabo-Lua', kind: 'seed', crop: 'nabo', price: 10, buy: 20, icon: ['seed', '#e8e4f8', '#7ad04a'] },
  sem_batata: { name: 'Sementes de Batata-Bolha', kind: 'seed', crop: 'batata', price: 20, buy: 40, icon: ['seed', '#c8a060', '#7ad04a'] },
  sem_couve: { name: 'Sementes de Couve-Asa', kind: 'seed', crop: 'couve', price: 30, buy: 60, icon: ['seed', '#5ac85a', '#3a8a3a'] },
  sem_morango: { name: 'Sementes de Morango-Estrela', kind: 'seed', crop: 'morango', price: 40, buy: 80, icon: ['seed', '#ff4a6a', '#7ad04a'] },
  sem_tomate: { name: 'Sementes de Tomate-Chama', kind: 'seed', crop: 'tomate', price: 25, buy: 50, icon: ['seed', '#ff5a2a', '#5aa03a'] },
  sem_milho: { name: 'Sementes de Milho-Sol', kind: 'seed', crop: 'milho', price: 45, buy: 90, icon: ['seed', '#ffd040', '#5aa03a'] },
  sem_melao: { name: 'Sementes de Melão-Gota', kind: 'seed', crop: 'melao', price: 40, buy: 80, icon: ['seed', '#7ad8ff', '#5aa03a'] },
  sem_pimenta: { name: 'Sementes de Pimenta-Brasa', kind: 'seed', crop: 'pimenta', price: 20, buy: 40, icon: ['seed', '#e83a2a', '#5aa03a'] },
  sem_abobora: { name: 'Sementes de Abóbora-Risonha', kind: 'seed', crop: 'abobora', price: 50, buy: 100, icon: ['seed', '#ff8a2a', '#6a8a2a'] },
  sem_berinjela: { name: 'Sementes de Berinjela-Noite', kind: 'seed', crop: 'berinjela', price: 15, buy: 30, icon: ['seed', '#6a3a9a', '#5a8a3a'] },
  sem_uva: { name: 'Sementes de Uva-Nuvem', kind: 'seed', crop: 'uva', price: 30, buy: 60, icon: ['seed', '#9a8aff', '#5a8a3a'] },
  sem_inhame: { name: 'Sementes de Inhame-Roxo', kind: 'seed', crop: 'inhame', price: 25, buy: 50, icon: ['seed', '#a05ac8', '#5a8a3a'] },
  sem_raiz: { name: 'Sementes de Raiz-de-Gelo', kind: 'seed', crop: 'raizgelo', price: 35, buy: 70, icon: ['seed', '#bfe8ff', '#8ab0c8'] },

  // colheitas
  nabo: { name: 'Nabo-Lua', kind: 'crop', price: 35, energy: 15, icon: ['root', '#f0ecff', '#7ad04a'] },
  batata: { name: 'Batata-Bolha', kind: 'crop', price: 70, energy: 22, icon: ['tuber', '#c8a060'] },
  couve: { name: 'Couve-Asa', kind: 'crop', price: 110, energy: 25, icon: ['leaf', '#5ac85a'] },
  morango: { name: 'Morango-Estrela', kind: 'crop', price: 60, energy: 18, icon: ['berry', '#ff3a5a'] },
  tomate: { name: 'Tomate-Chama', kind: 'crop', price: 45, energy: 15, icon: ['round', '#ff4a2a'] },
  milho: { name: 'Milho-Sol', kind: 'crop', price: 50, energy: 18, icon: ['corn', '#ffd040'] },
  melao: { name: 'Melão-Gota', kind: 'crop', price: 220, energy: 40, icon: ['round', '#7ad8ff', '#3a9ad8'] },
  pimenta: { name: 'Pimenta-Brasa', kind: 'crop', price: 40, energy: 10, icon: ['pepper', '#e83a2a'] },
  abobora: { name: 'Abóbora-Risonha', kind: 'crop', price: 260, energy: 45, icon: ['gourd', '#ff8a2a'] },
  berinjela: { name: 'Berinjela-Noite', kind: 'crop', price: 45, energy: 15, icon: ['pepper', '#6a3a9a'] },
  uva: { name: 'Uva-Nuvem', kind: 'crop', price: 40, energy: 15, icon: ['grape', '#9a8aff'] },
  inhame: { name: 'Inhame-Roxo', kind: 'crop', price: 100, energy: 30, icon: ['tuber', '#a05ac8'] },
  raizgelo: { name: 'Raiz-de-Gelo', kind: 'crop', price: 160, energy: 30, icon: ['root', '#bfe8ff', '#8ab0c8'] },

  // coleta
  frutinha: { name: 'Frutinha Silvestre', kind: 'forage', price: 20, energy: 10, icon: ['berry', '#7a5aff'] },
  flor_lua: { name: 'Flor-Lua', kind: 'forage', price: 40, icon: ['flower', '#fff6a8'] },
  cogumelo_mato: { name: 'Cogumelo do Mato', kind: 'forage', price: 30, energy: 12, icon: ['mushroom', '#c8703a'] },
  avela: { name: 'Avelã', kind: 'forage', price: 35, energy: 10, icon: ['nut', '#a8743f'] },
  cristal_gelo: { name: 'Cristal de Gelo', kind: 'forage', price: 50, icon: ['gem', '#d8f4ff'] },
  concha: { name: 'Concha', kind: 'forage', price: 30, icon: ['shell', '#ffd8c8'] },
  seiva: { name: 'Seiva', kind: 'material', price: 8, icon: ['sap', '#d8a040'] },
  fibra: { name: 'Fibra', kind: 'material', price: 2, icon: ['fiber', '#7ab04a'] },
  madeira: { name: 'Madeira', kind: 'material', price: 2, icon: ['wood', '#a8743f'] },
  pedra: { name: 'Pedra', kind: 'material', price: 2, icon: ['stone', '#9a96a0'] },

  // minérios e gemas
  min_cobre: { name: 'Minério de Cobre', kind: 'ore', price: 12, icon: ['ore', '#d8823a'] },
  min_ferro: { name: 'Minério de Ferro', kind: 'ore', price: 25, icon: ['ore', '#a8b8d0'] },
  cristal_lunar: { name: 'Cristal Lunar', kind: 'gem', price: 160, icon: ['gem', '#7af0ff'] },
  quartzo: { name: 'Quartzo', kind: 'gem', price: 25, icon: ['gem', '#f0f0f8'] },
  topazio: { name: 'Topázio', kind: 'gem', price: 80, icon: ['gem', '#ffc040'] },
  ametista: { name: 'Ametista', kind: 'gem', price: 100, icon: ['gem', '#b05aff'] },

  // restos de monstros
  gosma: { name: 'Gosma', kind: 'material', price: 5, icon: ['goo', '#7ad04a'] },
  asa: { name: 'Asa de Morcego', kind: 'material', price: 15, icon: ['wing', '#6a4a5a'] },
  po_magico: { name: 'Pó Mágico', kind: 'material', price: 40, icon: ['dust', '#e0a8ff'] },
  coracao_bolor: { name: 'Coração de Bolor', kind: 'key', price: 0, icon: ['heart', '#c87aff'], desc: 'Pulsa devagar. A Árvore-Lua precisa dele.' },

  // produtos dos monstrinhos
  ovo_pluma: { name: 'Ovo Pluma', kind: 'product', price: 50, energy: 20, icon: ['egg', '#fff4d8'] },
  la_macia: { name: 'Lã Macia', kind: 'product', price: 140, icon: ['wool', '#f4f0ff'] },
  cogumelo_fofo: { name: 'Cogumelo Fofo', kind: 'product', price: 60, energy: 20, icon: ['mushroom', '#ff7ab8'] },
  brasa_viva: { name: 'Brasa Viva', kind: 'product', price: 90, icon: ['ember', '#ff8a2a'] },

  // peixes
  lambari: { name: 'Lambari-Lua', kind: 'fish', price: 30, energy: 12, icon: ['fish', '#c8d8f0'] },
  carpa: { name: 'Carpa-Bolha', kind: 'fish', price: 45, energy: 15, icon: ['fish', '#e8a040'] },
  bagre: { name: 'Bagre-Lodo', kind: 'fish', price: 60, energy: 18, icon: ['fish', '#6a7a4a'] },
  truta: { name: 'Truta-Folha', kind: 'fish', price: 70, energy: 20, icon: ['fish', '#7ac87a'] },
  dourado: { name: 'Dourado-Sol', kind: 'fish', price: 120, energy: 25, icon: ['fish', '#ffc020'] },
  enguia: { name: 'Enguia-Sombra', kind: 'fish', price: 110, energy: 25, icon: ['eel', '#4a3a6a'] },
  perca: { name: 'Perca-Pedra', kind: 'fish', price: 50, energy: 15, icon: ['fish', '#8a8a9a'] },
  salmao: { name: 'Salmão-Névoa', kind: 'fish', price: 90, energy: 22, icon: ['fish', '#ff9a8a'] },
  peixe_cristal: { name: 'Peixe-Cristal', kind: 'fish', price: 150, energy: 25, icon: ['fish', '#bff0ff'] },
  peixe_lua: { name: 'Peixe-Lua Lendário', kind: 'fish', price: 600, energy: 60, icon: ['fish', '#fff6a8'] },
  bota: { name: 'Bota Velha', kind: 'material', price: 1, icon: ['boot', '#6a4a3a'] },
  alga: { name: 'Alga', kind: 'material', price: 5, icon: ['algae', '#3a8a5a'] },

  // comidas e itens de monstros
  biscoito: { name: 'Biscoito Monstro', kind: 'mfood', price: 20, buy: 40, icon: ['cookie', '#d8a050'], desc: 'Monstrinhos adoram. Dê a um monstrinho selvagem para ganhar a confiança dele.' },
  racao: { name: 'Ração de Monstro', kind: 'mfood', price: 8, buy: 15, icon: ['feed', '#c8a060'], desc: 'Coloque no cocho do curral. Cada monstrinho come uma por dia.' },
  adubo: { name: 'Adubo', kind: 'craft', price: 10, buy: 25, icon: ['fert', '#6a5a3a'], desc: 'Use na terra preparada: as plantas crescem mais rápido.' },
  bau: { name: 'Baú', kind: 'craft', price: 0, icon: ['chest'], desc: 'Coloque no chão para guardar itens.', place: 'chest' },
  salada: { name: 'Salada da Horta', kind: 'food', price: 120, energy: 60, hp: 20, icon: ['bowl', '#7ad04a'] },
  sopa_cogumelo: { name: 'Sopa de Cogumelo', kind: 'food', price: 90, energy: 50, hp: 40, icon: ['bowl', '#c8703a'] },
  ensopado: { name: 'Ensopado do Pescador', kind: 'food', price: 200, energy: 100, hp: 70, icon: ['bowl', '#e8a040'] },
  torta: { name: 'Torta de Frutinhas', kind: 'food', price: 110, energy: 70, hp: 20, icon: ['pie', '#7a5aff'] },
  pao_milho: { name: 'Pão de Milho', kind: 'food', price: 130, energy: 70, hp: 30, icon: ['bread', '#ffd040'] },
  omelete: { name: 'Omelete Fofa', kind: 'food', price: 140, energy: 80, hp: 50, icon: ['bowl', '#fff0a0'] },
};

// ------------------------------------------------------------
//  Cultivos: dias para amadurecer, rebrota, estações, aparência
// ------------------------------------------------------------
const CROPS = {
  nabo: { item: 'nabo', days: 3, seasons: [0], look: 'root', c: '#f0ecff', leaf: '#6ac04a' },
  batata: { item: 'batata', days: 4, seasons: [0], look: 'bush', c: '#c8a060', leaf: '#5aa83a', extra: 0.4 },
  couve: { item: 'couve', days: 5, seasons: [0], look: 'leafy', c: '#5ac85a', leaf: '#3a9a3a' },
  morango: { item: 'morango', days: 5, regrow: 2, seasons: [0], look: 'berry', c: '#ff3a5a', leaf: '#4aa03a' },
  tomate: { item: 'tomate', days: 4, regrow: 2, seasons: [1], look: 'vine', c: '#ff4a2a', leaf: '#4a9a3a' },
  milho: { item: 'milho', days: 6, regrow: 2, seasons: [1, 2], look: 'corn', c: '#ffd040', leaf: '#6ab03a' },
  melao: { item: 'melao', days: 6, seasons: [1], look: 'melon', c: '#7ad8ff', leaf: '#4aa03a' },
  pimenta: { item: 'pimenta', days: 3, regrow: 2, seasons: [1], look: 'vine', c: '#e83a2a', leaf: '#4a9a3a' },
  abobora: { item: 'abobora', days: 6, seasons: [2], look: 'melon', c: '#ff8a2a', leaf: '#5a8a2a' },
  berinjela: { item: 'berinjela', days: 3, regrow: 2, seasons: [2], look: 'vine', c: '#6a3a9a', leaf: '#4a8a3a' },
  uva: { item: 'uva', days: 5, regrow: 2, seasons: [2], look: 'grape', c: '#9a8aff', leaf: '#4a8a3a' },
  inhame: { item: 'inhame', days: 4, seasons: [2], look: 'bush', c: '#a05ac8', leaf: '#5a8a3a', extra: 0.3 },
  raizgelo: { item: 'raizgelo', days: 5, seasons: [3], look: 'root', c: '#bfe8ff', leaf: '#8ab8d0' },
};

// ------------------------------------------------------------
//  Ferramentas e melhorias
// ------------------------------------------------------------
const TIERS = ['Básico', 'de Cobre', 'de Ferro', 'Lunar'];
const TIER_COLORS = ['#9a96a0', '#d8823a', '#c8d8f0', '#7af0ff'];
const UPGRADES = [
  null,
  { gold: 400, item: 'min_cobre', n: 8 },
  { gold: 1200, item: 'min_ferro', n: 8 },
  { gold: 3000, item: 'cristal_lunar', n: 3 },
];
const CAN_CAPACITY = [40, 60, 90, 140];
const SWORD_DMG = [10, 16, 26, 40];
const TOOL_POWER = [1, 2, 3, 4];

// ------------------------------------------------------------
//  Monstrinhos domesticáveis
// ------------------------------------------------------------
const MONSTRINHOS = {
  gotinha: { name: 'Gotinha', fav: 'frutinha', job: 'water', desc: 'Rega algumas plantações todas as manhãs.', home: 'bosque', art: 'drop', c: '#6ac8ff' },
  brotinho: { name: 'Brotinho', fav: 'flor_lua', job: 'grow', desc: 'Faz algumas plantações crescerem mais rápido.', home: 'bosque', art: 'sprout', c: '#7ad85a' },
  fungo: { name: 'Fungo', fav: 'cogumelo_mato', product: 'cogumelo_fofo', every: 1, desc: 'Produz Cogumelos Fofos.', home: 'bosque', art: 'shroom', c: '#ff7ab8' },
  plumito: { name: 'Plumito', fav: 'nabo', product: 'ovo_pluma', every: 1, desc: 'Bota Ovos Pluma.', home: 'vila', art: 'puff', c: '#fff4c8' },
  lanudo: { name: 'Lanudo', fav: 'couve', product: 'la_macia', every: 2, desc: 'Dá Lã Macia a cada dois dias.', home: 'montanha', art: 'wool', c: '#f4f0ff' },
  pedregulho: { name: 'Pedregulho', fav: 'quartzo', job: 'clear', desc: 'Limpa pedras, galhos e mato da fazenda e guarda o que achar.', home: 'montanha', art: 'pebble', c: '#a8a4b0' },
  faisquinha: { name: 'Faisquinha', fav: 'pimenta', product: 'brasa_viva', every: 2, desc: 'Solta Brasas Vivas a cada dois dias.', home: 'caverna', art: 'spark', c: '#ffa040' },
};
const MONSTER_NAMES = ['Bolota', 'Pipoca', 'Fofinho', 'Tampinha', 'Biju', 'Chuvisco', 'Paçoca', 'Jujuba', 'Pingo', 'Cacau', 'Nhoque', 'Bambu'];

// ------------------------------------------------------------
//  Inimigos da caverna
// ------------------------------------------------------------
const ENEMIES = {
  lodinho: { name: 'Lodinho', hp: 24, dmg: 6, speed: 1.1, xp: 4, art: 'slime', c: '#7ad04a', size: 16, floors: [1, 9], drops: [['gosma', 0.6]], hop: true },
  morcego: { name: 'Morcego-Bruma', hp: 18, dmg: 7, speed: 1.8, xp: 5, art: 'bat', c: '#6a5a7a', size: 18, floors: [2, 12], drops: [['asa', 0.4]], fly: true },
  pedrinho: { name: 'Pedrinho Bravo', hp: 40, dmg: 9, speed: 1.4, xp: 7, art: 'crab', c: '#8a8690', size: 16, floors: [3, 11], drops: [['pedra', 0.8], ['quartzo', 0.15]], ambush: true },
  lodinho_azul: { name: 'Lodinho Azul', hp: 55, dmg: 11, speed: 1.2, xp: 9, art: 'slime', c: '#5aa8ff', size: 18, floors: [8, 16], drops: [['gosma', 0.7]], hop: true },
  fogo_fatuo: { name: 'Fogo-Fátuo', hp: 38, dmg: 10, speed: 1.0, xp: 10, art: 'wisp', c: '#c87aff', size: 16, floors: [9, 18], drops: [['po_magico', 0.25]], shoot: true, fly: true },
  aranha: { name: 'Aranha-Cristal', hp: 62, dmg: 13, speed: 2.1, xp: 12, art: 'spider', c: '#7ad8e8', size: 18, floors: [11, 19], drops: [['quartzo', 0.4], ['topazio', 0.08]] },
  golem: { name: 'Golem de Musgo', hp: 130, dmg: 18, speed: 0.8, xp: 18, art: 'golem', c: '#6a8a5a', size: 24, floors: [14, 19], drops: [['min_ferro', 0.8], ['pedra', 1]] },
  lodinho_roxo: { name: 'Lodinho Roxo', hp: 90, dmg: 16, speed: 1.4, xp: 14, art: 'slime', c: '#b05aff', size: 20, floors: [15, 19], drops: [['gosma', 0.8], ['ametista', 0.05]], hop: true },
  rei_bolor: { name: 'Rei Bolor', hp: 1100, dmg: 22, speed: 1.0, xp: 200, art: 'king', c: '#9a4ad8', size: 44, boss: true, drops: [['coracao_bolor', 1]], hop: true },
};

// ------------------------------------------------------------
//  Peixes por local e estação. dif: 1 fácil, 2 médio, 3 difícil
// ------------------------------------------------------------
const FISH = {
  lagoa: [['lambari', [0, 1], 1, 5], ['carpa', [0, 1, 2, 3], 2, 3], ['bagre', [2, 3], 2, 3], ['alga', [0, 1, 2, 3], 0, 1], ['bota', [0, 1, 2, 3], 0, 0.5]],
  rio: [['truta', [0, 2], 2, 4], ['dourado', [1], 3, 2], ['enguia', [2, 3], 3, 2], ['lambari', [0, 1], 1, 3], ['alga', [0, 1, 2, 3], 0, 1]],
  lago: [['perca', [0, 1, 2, 3], 1, 4], ['salmao', [2], 2, 3], ['peixe_cristal', [3], 3, 2], ['carpa', [0, 1, 2, 3], 2, 2], ['peixe_lua', [0, 1, 2, 3], 4, 0.12], ['bota', [0, 1, 2, 3], 0, 0.5]],
};

// ------------------------------------------------------------
//  Receitas (cat:'fish' = qualquer peixe; cat:'veg' = qualquer colheita)
// ------------------------------------------------------------
const RECIPES = [
  { out: 'biscoito', n: 2, need: [['frutinha', 2], ['seiva', 1]] },
  { out: 'racao', n: 2, need: [['fibra', 6]] },
  { out: 'adubo', n: 2, need: [['seiva', 1], ['gosma', 1]] },
  { out: 'bau', n: 1, need: [['madeira', 30]] },
  { out: 'salada', n: 1, need: [['couve', 1], ['nabo', 1]] },
  { out: 'sopa_cogumelo', n: 1, need: [['cogumelo_mato', 2]] },
  { out: 'torta', n: 1, need: [['frutinha', 3], ['ovo_pluma', 1]] },
  { out: 'pao_milho', n: 1, need: [['milho', 2]] },
  { out: 'omelete', n: 1, need: [['ovo_pluma', 2], [{ cat: 'veg' }, 1]] },
  { out: 'ensopado', n: 1, need: [['batata', 1], [{ cat: 'fish' }, 1]] },
];

// ------------------------------------------------------------
//  Lojas
// ------------------------------------------------------------
const SHOPS = {
  flor: { name: 'Barraca da Dona Flor', owner: 'flor', open: [9, 17],
    stock: () => {
      const s = State.season;
      const seeds = [['sem_nabo', 'sem_batata', 'sem_couve', 'sem_morango'], ['sem_tomate', 'sem_milho', 'sem_melao', 'sem_pimenta'], ['sem_abobora', 'sem_berinjela', 'sem_uva', 'sem_inhame', 'sem_milho'], ['sem_raiz']][s];
      return [...seeds, 'racao', 'biscoito', 'adubo'];
    } },
};

// ------------------------------------------------------------
//  Moradores
// ------------------------------------------------------------
const NPCS = {
  flor: {
    name: 'Dona Flor', look: { skin: '#d9a273', hair: '#e8e4dc', hairStyle: 'bun', dress: '#e07a9a', hat: '#ffd04a' },
    loves: ['flor_lua', 'morango'], likes: ['frutinha', 'abobora', 'couve', 'uva'], dislikes: ['gosma', 'bota', 'asa'],
    sched: [['vila', 15, 12, 'down'], ['vila', 15, 12, 'down'], ['vila', 8, 22, 'down']],
    talk: [
      'Bom dia, querida alma da roça! Semente boa é semente plantada no dia certo.',
      'Sua avó plantava morangos que brilhavam no escuro. Ela tinha um jeitinho com a terra.',
      'Lembre de regar todo dia! Planta com sede não cresce, só reclama.',
      'Cada estação tem suas sementes. Quando a estação vira, o que é de outra época murcha.',
      'Os monstrinhos do vale adoram biscoito. Eu vendo, mas dá pra fazer com frutinhas e seiva.',
    ],
    hearts: { 3: ['Toma, leva umas sementes por minha conta. Você merece!', ['sem_morango', 5]] },
  },
  malho: {
    name: 'Seu Malho', look: { skin: '#a8704a', hair: '#3a2a1e', hairStyle: 'bald', shirt: '#8a4a3a', pants: '#3a3a48', apron: '#5a4a3a', beard: true, beardColor: '#5a4a3a' },
    loves: ['topazio', 'ametista'], likes: ['min_ferro', 'pimenta', 'quartzo', 'cristal_lunar'], dislikes: ['flor_lua', 'alga'],
    sched: [['vila', 30, 12, 'down'], ['vila', 30, 12, 'down'], ['vila', 24, 15, 'left']],
    talk: [
      'Hm. Ferramenta boa é ferramenta bem cuidada. Traga minério que eu melhoro as suas.',
      'A caverna da montanha tem cobre lá em cima e ferro mais embaixo. Dizem que no fundo tem coisa pior.',
      'Se for descer na caverna, leve comida. E não confie em pedra que se mexe.',
      'Eu também faço reformas. Um curral maior cabe mais monstrinhos.',
    ],
    hearts: { 3: ['Isso aqui sobrou da forja. Pode ficar.', ['min_ferro', 5]] },
  },
  iris: {
    name: 'Íris', look: { skin: '#f2c9a0', hair: '#7a3ab0', hairStyle: 'ponytail', shirt: '#e8e4f0', pants: '#4a3a6a', glasses: true },
    loves: ['cogumelo_fofo', 'po_magico'], likes: ['ovo_pluma', 'uva', 'la_macia', 'brasa_viva'], dislikes: ['pedra', 'bota'],
    sched: [['bosque', 14, 12, 'down'], ['vila', 24, 9, 'down'], ['vila', 35, 6, 'down']],
    talk: [
      'Sou monstróloga! Estudo os monstrinhos do vale. Cada espécie tem uma comida favorita.',
      'Para ganhar a confiança de um monstrinho selvagem, dê um presente por dia. Com três, ele te segue pra casa.',
      'Monstrinhos felizes trabalham melhor. Faça carinho e deixe o cocho cheio de ração.',
      'Os monstros da caverna estão doentes de bolor. Acho que tem algo lá no fundo espalhando isso.',
      'A Árvore-Lua do bosque está fraca. Quando ela brilhava, os monstrinhos viviam tranquilos.',
    ],
    hearts: { 3: ['Fiz alguns biscoitos de teste. Os monstrinhos aprovaram!', ['biscoito', 4]] },
  },
  davi: {
    name: 'Davi', look: { skin: '#7a4a30', hair: '#1a1414', hairStyle: 'short', shirt: '#3a6a9a', pants: '#5a4a3a', hat: '#d8c060' },
    loves: ['dourado', 'peixe_cristal', 'peixe_lua'], likes: ['truta', 'salmao', 'enguia', 'carpa', 'ensopado'], dislikes: ['alga', 'gosma'],
    sched: [['montanha', 12, 19, 'up'], ['fazenda', 30, 24, 'left'], ['vila', 20, 21, 'down']],
    talk: [
      'Peixe bom morde quando a gente tem paciência. Espera o "!" e reage rápido.',
      'Cada lugar tem seus peixes: a lagoa da fazenda, o rio do bosque e o lago da montanha.',
      'Dizem que no lago da montanha vive um peixe que brilha como a lua. Nunca pesquei um.',
      'No inverno o lago dá Peixe-Cristal. Lindo e difícil de pegar.',
    ],
    hearts: { 3: ['Pega essa isca da sorte... quer dizer, esse peixe. Bom proveito!', ['salmao', 2]] },
  },
  nena: {
    name: 'Vovó Nena', look: { skin: '#f2c9a0', hair: '#d8d4cc', hairStyle: 'bun', dress: '#6a7aaa', glasses: true },
    loves: ['abobora', 'torta'], likes: ['batata', 'ensopado', 'omelete', 'ovo_pluma', 'milho'], dislikes: ['asa', 'gosma'],
    sched: [['vila', 9, 9, 'down'], ['vila', 20, 13, 'down'], ['vila', 9, 9, 'down']],
    talk: [
      'Ah, você é a cara da sua avó Lurdes! Ela era minha melhor amiga, sabia?',
      'A Lurdes dizia que a Árvore-Lua escuta quem cuida da terra com carinho.',
      'Cozinhar é fácil: abra o menu e veja a aba de receitas. Comida boa devolve as forças.',
      'No meu tempo, os monstrinhos dormiam no telhado das casas. Que saudade.',
    ],
    hearts: { 3: ['Fiz uma torta para você. Coma tudo, hein!', ['torta', 2]] },
  },
  pituco: {
    name: 'Pituco', look: { skin: '#d9a273', hair: '#5a3a20', hairStyle: 'spiky', shirt: '#e85a3a', pants: '#3a4a8a' },
    loves: ['biscoito', 'frutinha'], likes: ['milho', 'ovo_pluma', 'morango', 'concha'], dislikes: ['couve', 'berinjela'],
    sched: [['vila', 23, 17, 'down'], ['fazenda', 33, 17, 'up'], ['vila', 31, 21, 'down']],
    talk: [
      'Quando eu crescer vou ter cem monstrinhos! Ou mil!',
      'O Plumito vive no campo ao norte da vila. Ele adora nabo!',
      'Eu vi um Lanudo na montanha. Ele é tão fofo que parece uma nuvem com pé!',
      'Posso fazer carinho nos seus monstrinhos? Por favorzinho?',
    ],
    hearts: { 3: ['Achei isso na beira do rio. É pra você!', ['concha', 3]] },
  },
};

// ------------------------------------------------------------
//  Oferendas da Árvore-Lua
// ------------------------------------------------------------
const OFFERINGS = [
  { id: 'terra', name: 'Oferenda da Terra', need: [[{ cat: 'veg' }, 10], ['seiva', 3], ['fibra', 15]], reward: [['gold', 600], ['adubo', 10]], text: 'A terra do vale volta a respirar.' },
  { id: 'monstros', name: 'Oferenda dos Monstrinhos', need: [['ovo_pluma', 2], ['cogumelo_fofo', 1], ['la_macia', 1]], reward: [['curral', 1], ['biscoito', 5]], text: 'O Seu Malho amplia o seu curral de graça!' },
  { id: 'caverna', name: 'Oferenda da Caverna', need: [['min_cobre', 10], ['min_ferro', 5], ['quartzo', 3]], reward: [['gold', 1000], ['racao', 20]], text: 'As pedras do vale brilham de novo.' },
  { id: 'aguas', name: 'Oferenda das Águas', need: [[{ cat: 'fish' }, 3], ['carpa', 1], ['perca', 1]], reward: [['gold', 800], ['ensopado', 3]], text: 'Os rios cantam mais alto.' },
];

const SKILL_NAMES = { farm: 'Cultivo', mine: 'Mineração', combat: 'Combate', fish: 'Pesca' };
const SKILL_XP = [0, 50, 150, 350, 700, 1200];
