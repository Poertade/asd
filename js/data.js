'use strict';
// ============================================================
//  DADOS: elementos, estados, habilidades, itens, equipamentos,
//  personagens, inimigos, grupos de inimigos e lojas
// ============================================================

const ELEMENTS = {
  fogo: { name: 'Fogo', color: '#ff7a2a' }, gelo: { name: 'Gelo', color: '#8fd8ff' }, raio: { name: 'Raio', color: '#ffe04a' },
  natureza: { name: 'Natureza', color: '#6ad04a' }, luz: { name: 'Luz', color: '#fff6c8' }, sombra: { name: 'Sombra', color: '#b06aff' },
};

const STATUS = {
  poison: { name: 'Veneno', short: 'VEN', color: '#a05ad8', turns: 5 },
  burn: { name: 'Queimadura', short: 'QUE', color: '#ff7a2a', turns: 3 },
  sleep: { name: 'Sono', short: 'SON', color: '#8fb8ff', turns: 3 },
  stun: { name: 'Atordoado', short: 'ATO', color: '#ffe04a', turns: 1 },
  silence: { name: 'Silêncio', short: 'SIL', color: '#c8c8d8', turns: 3 },
  regen: { name: 'Regeneração', short: 'REG', color: '#7dff9c', turns: 3, good: true },
  taunt: { name: 'Provocando', short: 'PRV', color: '#ff9a5a', turns: 3, good: true },
};
const BUFF_NAMES = { atk: 'Ataque', def: 'Defesa', mag: 'Magia', spd: 'Velocidade' };

// tgt é relativo a quem usa: enemy/enemies = lado oposto; ally/allies = próprio lado
const SKILLS = {
  // ---------- comum ----------
  atk: { name: 'Ataque', tgt: 'enemy', type: 'phys', pow: 1.0, fx: 'slash' },

  // ---------- Lia ----------
  golpe_firme: { name: 'Golpe Firme', mp: 3, tgt: 'enemy', type: 'phys', pow: 1.6, fx: 'slash2', desc: 'Golpe concentrado em um inimigo (160%).' },
  corte_flamejante: { name: 'Corte Flamejante', mp: 5, tgt: 'enemy', type: 'phys', pow: 1.4, el: 'fogo', st: ['burn', 0.3], fx: 'fire', desc: 'Corte de fogo (140%). Pode queimar.' },
  grito_coragem: { name: 'Grito de Coragem', mp: 6, tgt: 'allies', type: 'buff', buff: { atk: 1 }, turns: 4, fx: 'buff', desc: 'Aumenta o Ataque de todo o grupo.' },
  lamina_giratoria: { name: 'Lâmina Giratória', mp: 8, tgt: 'enemies', type: 'phys', pow: 1.0, fx: 'slash2', desc: 'Gira a espada e atinge todos os inimigos.' },
  golpe_certeiro: { name: 'Golpe Certeiro', mp: 8, tgt: 'enemy', type: 'phys', pow: 2.3, crit: 0.35, fx: 'slash2', desc: 'Golpe devastador (230%), crítico frequente.' },
  corte_aurora: { name: 'Corte da Aurora', mp: 13, tgt: 'enemies', type: 'phys', pow: 1.45, el: 'luz', fx: 'light', desc: 'Lâmina de luz em todos os inimigos.' },
  lamina_farol: { name: 'Lâmina do Farol', mp: 20, tgt: 'enemy', type: 'phys', pow: 3.6, el: 'luz', fx: 'light', desc: 'O golpe supremo da guardiã (360% de luz).' },

  // ---------- Tição ----------
  fogo_fatuo: { name: 'Fogo-Fátuo', mp: 4, tgt: 'enemy', type: 'mag', pow: 1.4, el: 'fogo', st: ['burn', 0.2], fx: 'fire', desc: 'Chama espiritual em um inimigo.' },
  uivo_sombrio: { name: 'Uivo Sombrio', mp: 4, tgt: 'enemies', type: 'debuff', buff: { atk: -1 }, turns: 4, fx: 'dark', desc: 'Reduz o Ataque de todos os inimigos.' },
  mordida_espectral: { name: 'Mordida Espectral', mp: 5, tgt: 'enemy', type: 'phys', pow: 1.4, el: 'sombra', drain: 0.5, fx: 'dark', desc: 'Mordida sombria que absorve PV.' },
  labareda: { name: 'Labareda', mp: 9, tgt: 'enemies', type: 'mag', pow: 1.05, el: 'fogo', fx: 'fire', desc: 'Fogo em todos os inimigos.' },
  olhar_rubro: { name: 'Olhar Rubro', mp: 6, tgt: 'enemy', type: 'status', st: ['sleep', 0.65], fx: 'dark', desc: 'O olho vermelho faz o alvo adormecer.' },
  raio_fantasma: { name: 'Raio Fantasma', mp: 8, tgt: 'enemy', type: 'mag', pow: 1.8, el: 'raio', st: ['stun', 0.25], fx: 'thunder', desc: 'Raio espectral. Pode atordoar.' },
  inferno_osseo: { name: 'Inferno Ósseo', mp: 16, tgt: 'enemies', type: 'mag', pow: 1.6, el: 'fogo', fx: 'fire', desc: 'Chamas ancestrais em todos os inimigos.' },
  eclipse: { name: 'Eclipse', mp: 22, tgt: 'enemy', type: 'mag', pow: 3.3, el: 'sombra', fx: 'dark', desc: 'Engole um inimigo em escuridão total.' },

  // ---------- Nara ----------
  balsamo: { name: 'Bálsamo', mp: 4, tgt: 'ally', type: 'heal', pow: 1.0, base: 22, fx: 'heal', desc: 'Recupera PV de um aliado.' },
  purificar: { name: 'Purificar', mp: 3, tgt: 'ally', type: 'cure', fx: 'heal', desc: 'Remove estados negativos de um aliado.' },
  espinhos: { name: 'Espinhos', mp: 3, tgt: 'enemy', type: 'mag', pow: 1.25, el: 'natureza', st: ['poison', 0.4], fx: 'nature', desc: 'Vinhas espinhosas. Pode envenenar.' },
  brisa_curativa: { name: 'Brisa Curativa', mp: 9, tgt: 'allies', type: 'heal', pow: 0.65, base: 15, fx: 'heal', desc: 'Recupera PV de todo o grupo.' },
  bencao: { name: 'Bênção da Mata', mp: 6, tgt: 'allies', type: 'buff', buff: { def: 1 }, turns: 4, fx: 'buff', desc: 'Aumenta a Defesa de todo o grupo.' },
  renascer: { name: 'Renascer', mp: 14, tgt: 'ally_dead', type: 'revive', pct: 0.5, fx: 'heal', desc: 'Revive um aliado com 50% dos PV.' },
  geada: { name: 'Geada', mp: 6, tgt: 'enemy', type: 'mag', pow: 1.55, el: 'gelo', buff: { spd: -1 }, turns: 3, fx: 'ice', desc: 'Gelo cortante que reduz a Velocidade.' },
  tempestade: { name: 'Tempestade', mp: 12, tgt: 'enemies', type: 'mag', pow: 1.2, el: 'raio', fx: 'thunder', desc: 'Raios em todos os inimigos.' },
  grande_cura: { name: 'Grande Cura', mp: 18, tgt: 'allies', type: 'heal', pow: 1.3, base: 40, cure: true, fx: 'heal', desc: 'Cura muito e remove estados do grupo.' },
  luz_sagrada: { name: 'Luz Sagrada', mp: 20, tgt: 'enemy', type: 'mag', pow: 3.0, el: 'luz', fx: 'light', desc: 'Raio de luz pura em um inimigo.' },

  // ---------- Bento ----------
  marretada: { name: 'Marretada', mp: 3, tgt: 'enemy', type: 'phys', pow: 1.7, st: ['stun', 0.25], fx: 'smash', desc: 'Golpe pesado (170%). Pode atordoar.' },
  provocar: { name: 'Provocar', mp: 4, tgt: 'self', type: 'buff', buff: { def: 1 }, turns: 3, addSt: 'taunt', fx: 'buff', desc: 'Atrai ataques inimigos e aumenta a Defesa.' },
  quebra_armadura: { name: 'Quebra-Armadura', mp: 5, tgt: 'enemy', type: 'phys', pow: 1.3, buff: { def: -1 }, turns: 4, fx: 'smash', desc: 'Golpe que reduz a Defesa do alvo.' },
  terremoto: { name: 'Terremoto', mp: 10, tgt: 'enemies', type: 'phys', pow: 1.15, el: 'natureza', fx: 'quake', desc: 'Faz o chão tremer sob todos os inimigos.' },
  muralha: { name: 'Muralha', mp: 9, tgt: 'allies', type: 'buff', buff: { def: 1 }, turns: 4, addSt: 'regen', fx: 'buff', desc: 'Defesa e regeneração para o grupo.' },
  forja_ardente: { name: 'Forja Ardente', mp: 12, tgt: 'enemy', type: 'phys', pow: 2.7, el: 'fogo', fx: 'fire', desc: 'Martelo em brasa (270% de fogo).' },
  golpe_titanico: { name: 'Golpe Titânico', mp: 20, tgt: 'enemy', type: 'phys', pow: 3.8, st: ['stun', 0.4], fx: 'quake', desc: 'O golpe mais forte do ferreiro.' },

  // ---------- inimigos ----------
  e_mordida: { name: 'Mordida', tgt: 'enemy', type: 'phys', pow: 1.25, fx: 'bite' },
  e_investida: { name: 'Investida', tgt: 'enemy', type: 'phys', pow: 1.5, fx: 'smash' },
  e_acido: { name: 'Ácido', tgt: 'enemy', type: 'phys', pow: 0.9, st: ['poison', 0.4], fx: 'poison' },
  e_ferroada: { name: 'Ferroada', tgt: 'enemy', type: 'phys', pow: 1.0, st: ['poison', 0.5], fx: 'poison' },
  e_esporos: { name: 'Esporos', tgt: 'enemies', type: 'status', st: ['sleep', 0.3], fx: 'status' },
  e_uivo: { name: 'Uivo', tgt: 'self', type: 'buff', buff: { atk: 1 }, turns: 3, fx: 'buff' },
  e_chicote: { name: 'Chicote de Vinha', tgt: 'enemy', type: 'phys', pow: 1.2, el: 'natureza', fx: 'nature' },
  e_dreno: { name: 'Sugar', tgt: 'enemy', type: 'phys', pow: 1.0, drain: 0.6, fx: 'bite' },
  e_fogo: { name: 'Chama', tgt: 'enemy', type: 'mag', pow: 1.3, el: 'fogo', st: ['burn', 0.2], fx: 'fire' },
  e_gelo: { name: 'Estilhaço', tgt: 'enemy', type: 'mag', pow: 1.3, el: 'gelo', fx: 'ice' },
  e_raio: { name: 'Faísca', tgt: 'enemy', type: 'mag', pow: 1.3, el: 'raio', fx: 'thunder' },
  e_sombra: { name: 'Bola Sombria', tgt: 'enemy', type: 'mag', pow: 1.3, el: 'sombra', fx: 'dark' },
  e_chamas: { name: 'Mar de Chamas', tgt: 'enemies', type: 'mag', pow: 0.85, el: 'fogo', fx: 'fire' },
  e_nevasca: { name: 'Nevasca', tgt: 'enemies', type: 'mag', pow: 0.85, el: 'gelo', buff: { spd: -1 }, buffChance: 0.3, turns: 3, fx: 'ice' },
  e_tremor: { name: 'Tremor', tgt: 'enemies', type: 'phys', pow: 0.8, el: 'natureza', fx: 'quake' },
  e_maldicao: { name: 'Maldição', tgt: 'enemy', type: 'debuff', buff: { atk: -1, def: -1 }, turns: 3, fx: 'dark' },
  e_grito: { name: 'Grito Aterrador', tgt: 'enemies', type: 'debuff', buff: { atk: -1 }, turns: 3, fx: 'dark' },
  e_olhar: { name: 'Olhar Hipnótico', tgt: 'enemy', type: 'status', st: ['sleep', 0.5], fx: 'status' },
  e_nuvem: { name: 'Nuvem Tóxica', tgt: 'enemies', type: 'status', st: ['poison', 0.45], fx: 'poison' },
  e_silencio: { name: 'Névoa Muda', tgt: 'enemies', type: 'status', st: ['silence', 0.4], fx: 'status' },
  e_cura: { name: 'Regenerar', tgt: 'self', type: 'heal', pow: 0, base: 0, pctHeal: 0.15, fx: 'heal' },
  e_dreno_mana: { name: 'Devorar Luz', tgt: 'enemy', type: 'mag', pow: 1.0, el: 'sombra', mpDrain: 10, fx: 'dark' },
  e_carga: { name: 'Concentrar', tgt: 'self', type: 'charge', fx: 'buff' },
  e_pancada: { name: 'Pancada', tgt: 'enemy', type: 'phys', pow: 1.4, st: ['stun', 0.15], fx: 'smash' },
  e_garras: { name: 'Garras', tgt: 'enemy', type: 'phys', pow: 1.1, hits: 2, fx: 'slash' },
  e_lingua: { name: 'Linguada', tgt: 'enemy', type: 'phys', pow: 1.1, buff: { spd: -1 }, buffChance: 0.4, turns: 3, fx: 'bite' },
  e_coaxar: { name: 'Coaxar Sonolento', tgt: 'enemies', type: 'status', st: ['sleep', 0.3], fx: 'status' },
  e_sopro_fogo: { name: 'Sopro Ígneo', tgt: 'enemies', type: 'mag', pow: 1.0, el: 'fogo', st: ['burn', 0.3], fx: 'fire' },
  e_sopro_veneno: { name: 'Sopro Pútrido', tgt: 'enemies', type: 'mag', pow: 0.8, el: 'natureza', st: ['poison', 0.5], fx: 'poison' },
  e_sopro_gelo: { name: 'Sopro Gélido', tgt: 'enemies', type: 'mag', pow: 1.0, el: 'gelo', fx: 'ice' },
  // chefes
  b_raizes: { name: 'Raízes Estranguladoras', tgt: 'enemies', type: 'phys', pow: 0.85, el: 'natureza', fx: 'nature' },
  b_seiva: { name: 'Absorver Seiva', tgt: 'enemy', type: 'mag', pow: 1.3, el: 'natureza', drain: 0.8, fx: 'nature' },
  b_floracao: { name: 'Floração Sombria', tgt: 'self', type: 'buff', buff: { atk: 1, mag: 1 }, turns: 4, fx: 'dark' },
  b_soco: { name: 'Soco Esmagador', tgt: 'enemy', type: 'phys', pow: 1.8, fx: 'smash' },
  b_ferrugem: { name: 'Chuva de Ferrugem', tgt: 'enemies', type: 'debuff', buff: { def: -1 }, turns: 3, fx: 'poison' },
  b_laser: { name: 'Feixe de Brasa', tgt: 'enemies', type: 'mag', pow: 1.9, el: 'fogo', fx: 'fire', charged: true },
  b_mergulho: { name: 'Mergulho Glacial', tgt: 'enemy', type: 'phys', pow: 2.6, el: 'gelo', fx: 'ice', charged: true },
  b_rugido: { name: 'Rugido Polar', tgt: 'enemies', type: 'debuff', buff: { atk: -1, spd: -1 }, turns: 3, fx: 'ice' },
  b_lanterna: { name: 'Lanterna Negra', tgt: 'enemies', type: 'mag', pow: 1.15, el: 'sombra', fx: 'dark' },
  b_apagar: { name: 'Apagar', tgt: 'enemies', type: 'dispel', fx: 'dark' },
  b_corrente: { name: 'Corrente de Névoa', tgt: 'enemy', type: 'phys', pow: 1.6, st: ['silence', 0.5], fx: 'dark' },
  b_eclipse: { name: 'Eclipse Total', tgt: 'enemies', type: 'mag', pow: 2.3, el: 'sombra', fx: 'dark', charged: true },
  b_abraco: { name: 'Abraço do Vazio', tgt: 'enemy', type: 'mag', pow: 1.9, el: 'sombra', drain: 0.5, fx: 'dark' },
  b_esquecer: { name: 'Esquecimento', tgt: 'enemies', type: 'status', st: ['silence', 0.35], fx: 'status' },
  b_lamina_brasa: { name: 'Lâmina de Brasa', tgt: 'enemy', type: 'phys', pow: 2.0, el: 'fogo', st: ['burn', 0.4], fx: 'fire' },
  b_julgamento: { name: 'Julgamento', tgt: 'enemies', type: 'mag', pow: 2.2, el: 'luz', fx: 'light', charged: true },
};

// tipo de ataque básico de cada herói
const BASIC_FX = { lia: 'slash', ticao: 'bite', nara: 'slash', bento: 'smash' };

const CHARS = {
  lia: {
    name: 'Lia', cls: 'Aprendiz do Farol',
    base: { hp: 46, mp: 10, atk: 11, def: 7, mag: 5, spd: 8 }, grow: { hp: 14.5, mp: 2.6, atk: 2.7, def: 1.9, mag: 1.3, spd: 1.35 },
    start: { weapon: 'espada_curta', armor: 'tunica', acc: null },
    skills: [[1, 'golpe_firme'], [3, 'corte_flamejante'], [6, 'grito_coragem'], [9, 'lamina_giratoria'], [12, 'golpe_certeiro'], [15, 'corte_aurora'], [19, 'lamina_farol']],
    desc: 'Aprendiz de faroleira. Corajosa e teimosa.',
  },
  ticao: {
    name: 'Tição', cls: 'Espírito da Chama',
    base: { hp: 36, mp: 14, atk: 9, def: 5, mag: 10, spd: 12 }, grow: { hp: 11.5, mp: 3.6, atk: 2.2, def: 1.5, mag: 2.5, spd: 1.9 },
    start: { weapon: 'coleira_couro', armor: null, acc: null },
    skills: [[1, 'fogo_fatuo'], [2, 'uivo_sombrio'], [4, 'mordida_espectral'], [7, 'labareda'], [10, 'olhar_rubro'], [13, 'raio_fantasma'], [16, 'inferno_osseo'], [20, 'eclipse']],
    desc: 'Filhote com máscara de caveira. Sente as brasas.',
  },
  nara: {
    name: 'Nara', cls: 'Erveira da Mata',
    base: { hp: 34, mp: 20, atk: 6, def: 5, mag: 11, spd: 9 }, grow: { hp: 10.5, mp: 4.6, atk: 1.4, def: 1.5, mag: 2.8, spd: 1.55 },
    start: { weapon: 'cajado_salgueiro', armor: 'tunica', acc: null },
    skills: [[1, 'balsamo'], [1, 'espinhos'], [1, 'purificar'], [7, 'brisa_curativa'], [9, 'bencao'], [11, 'renascer'], [12, 'geada'], [15, 'tempestade'], [18, 'grande_cura'], [21, 'luz_sagrada']],
    desc: 'Curandeira que vive na Floresta Sussurrante.',
  },
  bento: {
    name: 'Bento', cls: 'Ferreiro',
    base: { hp: 60, mp: 6, atk: 14, def: 9, mag: 3, spd: 5 }, grow: { hp: 17.5, mp: 1.9, atk: 3.0, def: 2.4, mag: 0.8, spd: 1.0 },
    start: { weapon: 'martelo_forja', armor: 'colete_couro', acc: null },
    skills: [[1, 'marretada'], [1, 'provocar'], [11, 'quebra_armadura'], [13, 'terremoto'], [16, 'muralha'], [18, 'forja_ardente'], [22, 'golpe_titanico']],
    desc: 'O ferreiro da vila. Força bruta e coração mole.',
  },
};

function xpToNext(lv) { return Math.round(10 * Math.pow(lv, 1.65) + 10); }

// ---------- itens ----------
const ITEMS = {
  erva: { name: 'Erva Medicinal', icon: ['herb'], price: 12, tgt: 'ally', heal: 50, desc: 'Recupera 50 PV.' },
  pocao: { name: 'Poção', icon: ['potion', '#e05a5a'], price: 45, tgt: 'ally', heal: 150, desc: 'Recupera 150 PV.' },
  pocao_maior: { name: 'Poção Maior', icon: ['potion', '#ff3a6a'], price: 140, tgt: 'ally', heal: 400, desc: 'Recupera 400 PV.' },
  elixir: { name: 'Elixir', icon: ['potion', '#ffd040'], price: 0, sell: 250, tgt: 'ally', heal: 9999, mpHeal: 999, desc: 'Recupera todos os PV e PM.' },
  eter: { name: 'Éter', icon: ['potion', '#5aa8ff'], price: 70, tgt: 'ally', mpHeal: 30, desc: 'Recupera 30 PM.' },
  eter_maior: { name: 'Éter Maior', icon: ['potion', '#3a6aff'], price: 200, tgt: 'ally', mpHeal: 80, desc: 'Recupera 80 PM.' },
  antidoto: { name: 'Antídoto', icon: ['potion', '#a05ad8'], price: 10, tgt: 'ally', cure: ['poison'], desc: 'Cura o veneno.' },
  agua_benta: { name: 'Água Benta', icon: ['potion', '#e8f0ff'], price: 35, tgt: 'ally', cure: 'all', desc: 'Remove todos os estados negativos.' },
  pena: { name: 'Pena de Fênix', icon: ['feather'], price: 180, tgt: 'ally_dead', revive: 0.4, desc: 'Revive um aliado com 40% dos PV.' },
  cha: { name: 'Chá de Ervas', icon: ['tea'], price: 110, tgt: 'allies', heal: 100, desc: 'Recupera 100 PV de todo o grupo.' },
  bomba: { name: 'Bomba de Fogo', icon: ['bomb'], price: 60, tgt: 'enemies', dmg: 70, el: 'fogo', battle: true, desc: 'Causa 70 de dano de fogo em todos os inimigos.' },
  cristal_gelo: { name: 'Cristal Gélido', icon: ['crystal', '#8fd8ff'], price: 0, sell: 60, tgt: 'enemy', dmg: 260, el: 'gelo', battle: true, desc: 'Causa 260 de dano de gelo em um inimigo.' },
  raio_garrafa: { name: 'Raio Engarrafado', icon: ['potion', '#ffe04a'], price: 240, tgt: 'enemies', dmg: 200, el: 'raio', battle: true, desc: 'Causa 200 de dano de raio em todos os inimigos.' },
  incenso: { name: 'Incenso Repelente', icon: ['incense'], price: 40, tgt: 'none', field: true, repel: 150, desc: 'Afasta monstros por 150 passos.' },
  barraca: { name: 'Barraca', icon: ['tent', '#4f8a4a'], price: 250, tgt: 'none', field: true, fullRest: true, desc: 'Recupera todo o grupo (fora de batalha).' },
  // itens-chave
  brasa_verde: { name: 'Brasa Verde', icon: ['ember', '#5aff8a'], key: true, desc: 'Brasa primordial da Floresta. Cheira a chuva.' },
  brasa_azul: { name: 'Brasa Azul', icon: ['ember', '#5ab8ff'], key: true, desc: 'Brasa primordial das Minas. Fria ao toque.' },
  brasa_violeta: { name: 'Brasa Violeta', icon: ['ember', '#c87aff'], key: true, desc: 'Brasa primordial do Charco. Sussurra baixinho.' },
  brasa_branca: { name: 'Brasa Branca', icon: ['ember', '#ffffff'], key: true, desc: 'Brasa primordial do Pico. Brilha como neve ao sol.' },
  carta_aurelio: { name: 'Bilhete de Aurélio', icon: ['letter'], key: true, desc: '"Perdoe-me, Lia. Não procure por mim." — A.' },
  chave_mina: { name: 'Chave da Mina', icon: ['key'], key: true, desc: 'Abre o portão das Minas de Ferrugem.' },
  chave_galeria: { name: 'Chave da Galeria', icon: ['key'], key: true, desc: 'Chave enferrujada encontrada nas minas.' },
  anel_cida: { name: 'Anel de Noivado', icon: ['ring', '#ff6a8a'], key: true, desc: 'O anel perdido de Dona Cida.' },
  cogumelo_lunar: { name: 'Cogumelo Lunar', icon: ['mushroom', '#b8c8ff'], key: true, desc: 'Brilha fraquinho no escuro. Vó Quitéria quer cinco.' },
  remo: { name: 'Vara de Balsa', icon: ['staff', '#c8a070'], key: true, desc: 'Vara nova para a balsa de Seu Jonas.' },
  sino_gelo: { name: 'Sino de Gelo', icon: ['bell'], key: true, desc: 'Seu som acalma a nevasca do Pico.' },
  osso_brinquedo: { name: 'Osso de Brinquedo', icon: ['bone'], key: true, desc: 'O brinquedo favorito do Tito.' },
};

// ---------- equipamentos ----------
const ALL = ['lia', 'ticao', 'nara', 'bento'];
const EQUIPS = {
  // armas — Lia
  espada_curta: { name: 'Espada Curta', slot: 'weapon', who: ['lia'], atk: 4, price: 0, icon: ['sword'] },
  espada_ferro: { name: 'Espada de Ferro', slot: 'weapon', who: ['lia'], atk: 9, price: 130, icon: ['sword'] },
  lamina_runica: { name: 'Lâmina Rúnica', slot: 'weapon', who: ['lia'], atk: 16, mag: 2, price: 420, icon: ['sword'] },
  lamina_prateada: { name: 'Lâmina Prateada', slot: 'weapon', who: ['lia'], atk: 25, mag: 4, price: 980, icon: ['sword'] },
  espada_farol: { name: 'Espada do Farol', slot: 'weapon', who: ['lia'], atk: 36, mag: 8, price: 0, icon: ['sword'], desc: 'Forjada com a luz do primeiro farol.' },
  // Tição
  coleira_couro: { name: 'Coleira de Couro', slot: 'weapon', who: ['ticao'], atk: 3, mag: 3, price: 0, icon: ['collar', '#8a5a32'] },
  presa_prata: { name: 'Coleira de Prata', slot: 'weapon', who: ['ticao'], atk: 7, mag: 7, price: 160, icon: ['collar', '#c8c8d8'] },
  coleira_runica: { name: 'Coleira Rúnica', slot: 'weapon', who: ['ticao'], atk: 12, mag: 12, price: 450, icon: ['collar', '#5a8aff'] },
  osso_dourado: { name: 'Osso Dourado', slot: 'weapon', who: ['ticao'], atk: 18, mag: 19, price: 0, icon: ['bone'], desc: 'Presente do Tito. Tição adora.' },
  chama_ancestral: { name: 'Chama Ancestral', slot: 'weapon', who: ['ticao'], atk: 26, mag: 28, price: 0, icon: ['collar', '#ff7a2a'] },
  // Nara
  cajado_salgueiro: { name: 'Cajado de Salgueiro', slot: 'weapon', who: ['nara'], atk: 2, mag: 5, price: 0, icon: ['staff', '#6ad04a'] },
  cajado_carvalho: { name: 'Cajado de Carvalho', slot: 'weapon', who: ['nara'], atk: 4, mag: 10, price: 170, icon: ['staff', '#8a5a32'] },
  cetro_musgo: { name: 'Cetro de Musgo', slot: 'weapon', who: ['nara'], atk: 6, mag: 16, price: 460, icon: ['staff', '#4f8a4a'] },
  cetro_lunar: { name: 'Cetro Lunar', slot: 'weapon', who: ['nara'], atk: 8, mag: 24, price: 1000, icon: ['staff', '#b8c8ff'] },
  galho_ancestral: { name: 'Galho Ancestral', slot: 'weapon', who: ['nara'], atk: 10, mag: 33, price: 0, icon: ['staff', '#ffe08a'] },
  // Bento
  martelo_forja: { name: 'Martelo de Forja', slot: 'weapon', who: ['bento'], atk: 9, price: 0, icon: ['hammer'] },
  marreta_aco: { name: 'Marreta de Aço', slot: 'weapon', who: ['bento'], atk: 16, price: 440, icon: ['hammer'] },
  martelo_runico: { name: 'Martelo Rúnico', slot: 'weapon', who: ['bento'], atk: 25, price: 1020, icon: ['hammer'] },
  martelo_tita: { name: 'Martelo Titã', slot: 'weapon', who: ['bento'], atk: 36, price: 0, icon: ['hammer'] },
  // armaduras
  tunica: { name: 'Túnica', slot: 'armor', who: ALL, def: 3, price: 20, icon: ['robe', '#8a7a5a'] },
  colete_couro: { name: 'Colete de Couro', slot: 'armor', who: ALL, def: 7, price: 90, icon: ['armor', '#8a5a32'] },
  cota_malha: { name: 'Cota de Malha', slot: 'armor', who: ['lia', 'bento'], def: 13, price: 320, icon: ['armor', '#9aa0aa'] },
  manto_encantado: { name: 'Manto Encantado', slot: 'armor', who: ['ticao', 'nara'], def: 9, mag: 5, price: 340, icon: ['robe', '#5a6aaa'] },
  armadura_placas: { name: 'Armadura de Placas', slot: 'armor', who: ['lia', 'bento'], def: 21, price: 850, icon: ['armor', '#c8c8d8'] },
  manto_estelar: { name: 'Manto Estelar', slot: 'armor', who: ['ticao', 'nara'], def: 15, mag: 10, price: 880, icon: ['robe', '#3a3a8a'] },
  armadura_guardiao: { name: 'Armadura do Guardião', slot: 'armor', who: ['lia', 'bento'], def: 30, mag: 4, price: 0, icon: ['armor', '#ffd040'] },
  veu_aurora: { name: 'Véu da Aurora', slot: 'armor', who: ['ticao', 'nara'], def: 23, mag: 16, price: 0, icon: ['robe', '#ffb8d8'] },
  // acessórios
  anel_vigor: { name: 'Anel de Vigor', slot: 'acc', who: ALL, hpPct: 0.15, price: 0, icon: ['ring', '#ff5a5a'], desc: '+15% PV máximos.' },
  amuleto_antiveneno: { name: 'Amuleto Antiveneno', slot: 'acc', who: ALL, immune: ['poison'], def: 2, price: 120, icon: ['amulet', '#a05ad8'], desc: 'Imunidade a veneno.' },
  pena_veloz: { name: 'Pena Veloz', slot: 'acc', who: ALL, spd: 6, price: 220, icon: ['feather'], desc: '+6 Velocidade.' },
  talisma_desperto: { name: 'Talismã Desperto', slot: 'acc', who: ALL, immune: ['sleep', 'stun'], price: 0, icon: ['amulet', '#ffe04a'], desc: 'Imunidade a sono e atordoamento.' },
  brinco_mana: { name: 'Brinco de Mana', slot: 'acc', who: ALL, mp: 20, price: 260, icon: ['amulet', '#5aa8ff'], desc: '+20 PM máximos.' },
  bracelete_forca: { name: 'Bracelete de Força', slot: 'acc', who: ALL, atk: 7, price: 320, icon: ['ring', '#d84a3a'], desc: '+7 Ataque.' },
  pingente_lunar: { name: 'Pingente Lunar', slot: 'acc', who: ALL, mag: 8, price: 320, icon: ['amulet', '#b8c8ff'], desc: '+8 Magia.' },
  cachecol_la: { name: 'Cachecol de Lã', slot: 'acc', who: ALL, def: 4, resist: ['gelo'], price: 300, icon: ['robe', '#d84a3a'], desc: 'Resiste a gelo. +4 Defesa.' },
  escama_hidra: { name: 'Escama de Hidra', slot: 'acc', who: ALL, def: 6, immune: ['poison'], resist: ['natureza'], price: 0, icon: ['crystal', '#4f8a4a'], desc: 'Resiste a natureza, imune a veneno.' },
  presa_javali: { name: 'Presa do Javali-Rei', slot: 'acc', who: ALL, atk: 6, def: 3, price: 0, icon: ['bone'], desc: '+6 Ataque, +3 Defesa.' },
  anel_guardiao: { name: 'Anel do Guardião', slot: 'acc', who: ALL, atk: 10, def: 10, mag: 10, spd: 5, hpPct: 0.1, price: 0, icon: ['ring', '#ffd040'], desc: 'Tudo melhora um pouco.' },
  amuleto_brasa: { name: 'Amuleto de Brasa', slot: 'acc', who: ALL, resist: ['sombra'], mag: 4, price: 0, icon: ['ember', '#ff7a2a'], desc: 'Resiste a sombra. +4 Magia.' },
};

// ---------- inimigos ----------
// art: parâmetros do gerador; weak/resist: elementos; acts: [habilidade, peso]
const ENEMIES = {
  // campos / prólogo
  fiapo: { name: 'Fiapo de Névoa', hp: 45, mp: 10, atk: 9, def: 3, mag: 8, spd: 7, xp: 6, gold: 5, weak: ['luz', 'fogo'], art: { type: 'wisp', c: '#b8c4e0', size: 20 }, acts: [['atk', 3], ['e_sombra', 1]], drops: [['erva', 0.25]] },
  gosma: { name: 'Gosma Verde', hp: 51, atk: 9, def: 4, mag: 3, spd: 4, xp: 7, gold: 6, weak: ['fogo'], art: { type: 'blob', c: '#5ad06a', size: 22 }, acts: [['atk', 3], ['e_acido', 1]], drops: [['antidoto', 0.3]] },
  rato: { name: 'Rato-Cinza', hp: 42, atk: 11, def: 3, mag: 2, spd: 10, xp: 7, gold: 6, art: { type: 'beast', c: '#7a7480', size: 24, long: 0.26, head: 0.13, tail: true, tailC: '#d8a0a0', snout: '#d8a0a0' }, acts: [['atk', 3], ['e_mordida', 1]], drops: [['erva', 0.2]] },
  corvo: { name: 'Corvo Vazio', hp: 48, atk: 12, def: 3, mag: 4, spd: 13, xp: 9, gold: 7, weak: ['raio'], art: { type: 'bird', c: '#2e2a3a', size: 28, eye: '#c87aff' }, acts: [['atk', 2], ['e_garras', 1]], drops: [['erva', 0.2]] },
  javali: { name: 'Javali Bravo', hp: 105, atk: 15, def: 7, mag: 2, spd: 6, xp: 16, gold: 13, weak: ['gelo'], art: { type: 'beast', c: '#6a4a3a', size: 32, long: 0.32, head: 0.16, tusk: true, mane: '#4a3020' }, acts: [['atk', 2], ['e_investida', 1]], drops: [['erva', 0.3]] },
  javali_rei: { name: 'Javali-Rei', boss: true, hp: 760, atk: 28, def: 13, mag: 6, spd: 9, xp: 260, gold: 300, weak: ['gelo'], art: { type: 'beast', c: '#7a3a2a', size: 44, long: 0.34, head: 0.17, tusk: true, mane: '#d8c8a0', spikes: '#d8c8a0' }, acts: [['atk', 2], ['e_investida', 2], ['e_uivo', 1], ['e_tremor', 1]], drops: [['pocao', 1]] },
  // floresta
  fungolino: { name: 'Fungolino', hp: 120, atk: 16, def: 6, mag: 13, spd: 5, xp: 13, gold: 9, weak: ['fogo'], resist: ['natureza'], art: { type: 'mushroom', c: '#c84a3a', size: 24 }, acts: [['atk', 3], ['e_esporos', 1]], drops: [['erva', 0.3]] },
  vespa: { name: 'Vespa Brava', hp: 91, atk: 19, def: 5, mag: 6, spd: 15, xp: 13, gold: 9, weak: ['fogo', 'gelo'], art: { type: 'insect', c: '#e8c030', size: 24 }, acts: [['atk', 2], ['e_ferroada', 2]], drops: [['antidoto', 0.3]] },
  lobo_nevoa: { name: 'Lobo da Névoa', hp: 161, atk: 21, def: 7, mag: 6, spd: 12, xp: 17, gold: 12, weak: ['luz'], art: { type: 'beast', c: '#5a5a72', size: 32, long: 0.3, head: 0.15, tail: true, eye: '#c87aff' }, acts: [['atk', 3], ['e_mordida', 2], ['e_uivo', 1]], drops: [['erva', 0.25]] },
  flor_boca: { name: 'Flor-Boca', hp: 190, atk: 20, def: 8, mag: 16, spd: 4, xp: 20, gold: 15, weak: ['fogo'], resist: ['natureza'], art: { type: 'plant', c: '#d8406a', size: 32, vines: true }, acts: [['e_chicote', 3], ['e_dreno', 1]], drops: [['pocao', 0.15]] },
  raiz_mae: { name: 'Raiz-Mãe Corrompida', boss: true, hp: 1350, mp: 99, atk: 25, def: 12, mag: 25, spd: 8, xp: 420, gold: 320, weak: ['fogo'], resist: ['natureza', 'sombra'], immune: ['sleep', 'stun'], art: { type: 'tree', size: 64 }, acts: [['e_chicote', 3], ['b_raizes', 2], ['b_seiva', 2], ['e_esporos', 1]], ai: 'raiz', drops: [['pocao', 1]] },
  broto: { name: 'Broto Sombrio', hp: 90, atk: 14, def: 6, mag: 10, spd: 6, xp: 10, gold: 5, weak: ['fogo'], resist: ['natureza'], art: { type: 'plant', c: '#8a3ab0', size: 24 }, acts: [['e_chicote', 2], ['e_dreno', 1]] },
  // minas
  morcego: { name: 'Morcego-Ferrugem', hp: 149, atk: 25, def: 8, mag: 8, spd: 17, xp: 22, gold: 15, weak: ['luz'], art: { type: 'bat', c: '#7a4a3a', size: 24, rust: true }, acts: [['atk', 2], ['e_dreno', 2]], drops: [['erva', 0.3]] },
  pedregulho: { name: 'Pedregulho', hp: 269, atk: 28, def: 19, mag: 6, spd: 4, xp: 28, gold: 22, weak: ['gelo', 'raio'], resist: ['fogo'], art: { type: 'golem', c: '#8a8290', size: 30, moss: true }, acts: [['atk', 3], ['e_pancada', 1]], drops: [['pocao', 0.15]] },
  toupeira: { name: 'Toupeira Mineira', hp: 203, atk: 27, def: 11, mag: 6, spd: 9, xp: 24, gold: 19, weak: ['gelo'], art: { type: 'beast', c: '#6a5a4a', size: 28, long: 0.27, head: 0.15, snout: '#e8a0a0', legH: 4 }, acts: [['atk', 3], ['e_tremor', 1]], drops: [['erva', 0.3]] },
  mineiro_espectral: { name: 'Mineiro Espectral', hp: 186, atk: 21, def: 7, mag: 28, spd: 10, xp: 28, gold: 24, weak: ['luz'], resist: ['sombra'], art: { type: 'ghost', c: '#9ab8d8', size: 28, helmet: true, pick: true }, acts: [['atk', 1], ['e_sombra', 2], ['e_maldicao', 1]], drops: [['eter', 0.15]] },
  gosma_cristal: { name: 'Gosma de Cristal', hp: 174, atk: 20, def: 24, mag: 21, spd: 6, xp: 27, gold: 34, weak: ['raio'], resist: ['gelo'], art: { type: 'blob', c: '#7fb8e8', size: 24, crystal: true }, acts: [['atk', 2], ['e_gelo', 2]], drops: [['cristal_gelo', 0.2]] },
  colosso: { name: 'Colosso de Ferrugem', boss: true, hp: 2400, mp: 99, atk: 36, def: 21, mag: 30, spd: 7, xp: 900, gold: 650, weak: ['raio', 'gelo'], resist: ['fogo'], immune: ['sleep', 'stun', 'poison'], art: { type: 'golem', c: '#9a6a4a', size: 64, rust: true, eye: '#ff5a2a' }, acts: [['b_soco', 3], ['e_tremor', 2], ['b_ferrugem', 1]], ai: 'colosso', drops: [['eter', 1]] },
  // charco
  sapo: { name: 'Sapo-Lamúria', hp: 286, atk: 34, def: 12, mag: 13, spd: 10, xp: 36, gold: 22, weak: ['gelo'], art: { type: 'frog', c: '#5a7a3a', size: 28 }, acts: [['atk', 2], ['e_lingua', 2], ['e_coaxar', 1]], drops: [['antidoto', 0.3]] },
  sanguessuga: { name: 'Sanguessuga Gigante', hp: 259, atk: 30, def: 10, mag: 8, spd: 7, xp: 32, gold: 20, weak: ['fogo', 'raio'], art: { type: 'serpent', c: '#4a3a3a', belly: '#8a5a5a', size: 30, leech: true }, acts: [['atk', 1], ['e_dreno', 3]], drops: [['pocao', 0.15]] },
  lume_errante: { name: 'Lume Errante', hp: 217, atk: 16, def: 10, mag: 38, spd: 16, xp: 38, gold: 28, weak: ['gelo'], resist: ['fogo'], art: { type: 'wisp', c: '#ff9a3a', size: 22 }, acts: [['e_fogo', 3], ['atk', 1]], drops: [['eter', 0.2]] },
  afogado: { name: 'Afogado', hp: 394, atk: 37, def: 14, mag: 8, spd: 6, xp: 42, gold: 30, weak: ['luz', 'fogo'], resist: ['sombra'], art: { type: 'zombie', c: '#7a9a8a', size: 32 }, acts: [['atk', 2], ['e_acido', 1], ['e_pancada', 1]], drops: [['agua_benta', 0.2]] },
  serpe: { name: 'Serpe do Lodo', hp: 332, atk: 38, def: 13, mag: 10, spd: 13, xp: 44, gold: 30, weak: ['gelo'], resist: ['natureza'], art: { type: 'serpent', c: '#6a8a3a', size: 32 }, acts: [['atk', 2], ['e_ferroada', 2]], drops: [['antidoto', 0.4]] },
  hidra_corpo: { name: 'Hidra das Lamúrias', boss: true, hp: 2700, mp: 99, atk: 40, def: 20, mag: 30, spd: 8, xp: 1100, gold: 700, weak: ['raio'], resist: ['natureza'], immune: ['sleep', 'stun', 'poison'], art: { type: 'hydraBody', size: 56 }, acts: [['b_soco', 2], ['e_nuvem', 1], ['e_tremor', 1]], ai: 'hidra', drops: [['pocao_maior', 1]] },
  hidra_fogo: { name: 'Cabeça Ígnea', boss: true, hp: 820, atk: 32, def: 16, mag: 36, spd: 12, xp: 250, gold: 150, weak: ['gelo'], resist: ['fogo'], immune: ['sleep', 'poison'], art: { type: 'hydraHead', c: '#8a4a2a', belly: '#e8a060', fin: '#ff7a2a', size: 40 }, acts: [['e_mordida', 2], ['e_sopro_fogo', 2]], noFlee: true },
  hidra_veneno: { name: 'Cabeça Pútrida', boss: true, hp: 820, atk: 32, def: 16, mag: 36, spd: 11, xp: 250, gold: 150, weak: ['fogo'], resist: ['natureza'], immune: ['sleep', 'poison'], art: { type: 'hydraHead', c: '#4a6a3a', belly: '#a8b080', fin: '#8a3ab0', size: 40 }, acts: [['e_mordida', 2], ['e_sopro_veneno', 2]] },
  // pico
  lobo_glacial: { name: 'Lobo Glacial', hp: 435, atk: 49, def: 18, mag: 13, spd: 17, xp: 56, gold: 34, weak: ['fogo'], resist: ['gelo'], art: { type: 'beast', c: '#c8d8e8', size: 32, long: 0.3, head: 0.15, tail: true, eye: '#3a8aff', frost: true }, acts: [['atk', 2], ['e_mordida', 2], ['e_uivo', 1]], drops: [['pocao', 0.25]] },
  ieti: { name: 'Iéti Jovem', hp: 683, atk: 57, def: 22, mag: 10, spd: 8, xp: 72, gold: 46, weak: ['fogo'], resist: ['gelo'], art: { type: 'golem', c: '#e8eef5', size: 34, eye: '#3a6aaa', core: '#bfe1ff' }, acts: [['atk', 2], ['e_pancada', 2]], drops: [['pocao_maior', 0.1]] },
  harpia: { name: 'Harpia da Nevasca', hp: 394, atk: 46, def: 15, mag: 43, spd: 21, xp: 62, gold: 40, weak: ['raio'], art: { type: 'bird', c: '#8aa8c8', size: 32, crest: '#e8f4ff', eye: '#ffd040', talons: true }, acts: [['e_garras', 2], ['e_nevasca', 1]], drops: [['eter', 0.2]] },
  espirito_gelido: { name: 'Espírito Gélido', hp: 414, atk: 24, def: 20, mag: 54, spd: 14, xp: 68, gold: 50, weak: ['fogo'], resist: ['gelo', 'sombra'], art: { type: 'ghost', c: '#bfe8ff', size: 28, out: '#2a5a8a' }, acts: [['e_gelo', 3], ['e_nevasca', 1]], drops: [['cristal_gelo', 0.3]] },
  sentinela: { name: 'Sentinela de Gelo', hp: 870, atk: 60, def: 34, mag: 13, spd: 5, xp: 88, gold: 60, weak: ['fogo', 'raio'], resist: ['gelo'], art: { type: 'golem', c: '#8fc8e8', size: 34, ice: true, eye: '#ffffff', core: '#3a8aff' }, acts: [['atk', 2], ['e_pancada', 2], ['e_tremor', 1]], drops: [['eter_maior', 0.1]] },
  grifo: { name: 'Grifo Glacial', boss: true, hp: 4800, mp: 99, atk: 64, def: 27, mag: 58, spd: 19, xp: 2600, gold: 1500, weak: ['fogo'], resist: ['gelo'], immune: ['sleep', 'stun', 'poison'], art: { type: 'bird', c: '#d8e8f5', size: 56, crest: '#5ab8ff', lion: '#c8b080', talons: true, eye: '#3a8aff' }, acts: [['e_garras', 3], ['e_nevasca', 2], ['b_rugido', 1]], ai: 'grifo', drops: [['elixir', 1]] },
  // farol de cinzas
  cavaleiro_oco: { name: 'Cavaleiro Oco', hp: 746, atk: 73, def: 32, mag: 27, spd: 14, xp: 115, gold: 72, weak: ['luz'], resist: ['sombra'], art: { type: 'knight', c: '#4a4a5e', size: 32 }, acts: [['atk', 3], ['e_pancada', 1], ['e_maldicao', 1]], drops: [['pocao_maior', 0.15]] },
  olho_vazio: { name: 'Olho do Vazio', hp: 539, atk: 39, def: 22, mag: 72, spd: 19, xp: 105, gold: 70, weak: ['luz'], resist: ['sombra'], art: { type: 'eye', size: 30 }, acts: [['e_sombra', 3], ['e_olhar', 1], ['e_silencio', 1]], drops: [['eter', 0.3]] },
  quimera: { name: 'Quimera de Cinzas', hp: 995, atk: 76, def: 29, mag: 56, spd: 15, xp: 140, gold: 90, weak: ['gelo'], resist: ['fogo'], art: { type: 'beast', c: '#6a5a5a', size: 40, long: 0.32, head: 0.17, mane: '#ff7a2a', tail: true, tailC: '#4a8a3a', fire: true, horns: '#d8c8a0' }, acts: [['atk', 2], ['e_sopro_fogo', 2], ['e_garras', 1]], drops: [['pocao_maior', 0.2]] },
  devorador: { name: 'Devorador de Luz', hp: 829, atk: 64, def: 25, mag: 66, spd: 12, xp: 130, gold: 85, weak: ['luz'], resist: ['sombra'], art: { type: 'wisp', c: '#3a2a5a', size: 30, eye: '#ff5a3a', out: '#0a0612' }, acts: [['e_dreno_mana', 2], ['e_sombra', 2], ['atk', 1]], drops: [['eter_maior', 0.15]] },
  aurelio: { name: 'Aurélio, o Apagador', boss: true, hp: 7500, mp: 99, atk: 64, def: 32, mag: 62, spd: 18, xp: 3500, gold: 0, weak: ['luz'], resist: ['sombra'], immune: ['sleep', 'stun', 'poison', 'silence'], art: { type: 'keeper', size: 40 }, acts: [['b_lanterna', 3], ['b_corrente', 2], ['e_gelo', 1], ['b_apagar', 1]], ai: 'aurelio' },
  vazio: { name: 'O Vazio', boss: true, hp: 7600, mp: 99, atk: 62, def: 34, mag: 64, spd: 20, xp: 0, gold: 0, weak: ['luz'], resist: ['sombra'], immune: ['sleep', 'stun', 'poison', 'silence'], art: { type: 'void', size: 72 }, acts: [['b_abraco', 3], ['b_lanterna', 2], ['b_esquecer', 1], ['e_dreno_mana', 1]], ai: 'vazio' },
  vazio2: { name: 'O Vazio — Forma Verdadeira', boss: true, hp: 1, art: { type: 'void', size: 72, phase2: true } },
  guardiao: { name: 'Guardião Esquecido', boss: true, hp: 7200, mp: 99, atk: 60, def: 38, mag: 56, spd: 17, xp: 4000, gold: 2000, weak: [], resist: ['fogo'], immune: ['sleep', 'stun', 'poison', 'silence'], art: { type: 'guardian', size: 56 }, acts: [['b_lamina_brasa', 3], ['e_chamas', 2], ['e_carga', 1]], ai: 'guardiao' },
};

// grupos de inimigos por área
const TROOPS = {
  prologo: [[['fiapo'], 1]],
  campos: [[['fiapo', 'fiapo'], 3], [['gosma'], 2], [['rato', 'rato'], 3], [['gosma', 'fiapo'], 2], [['corvo'], 2], [['corvo', 'rato'], 2]],
  campos2: [[['javali'], 3], [['corvo', 'corvo'], 2], [['javali', 'rato'], 2], [['gosma', 'gosma', 'fiapo'], 2]],
  floresta: [[['fungolino', 'fungolino'], 3], [['vespa', 'vespa'], 2], [['lobo_nevoa'], 2], [['flor_boca'], 1], [['vespa', 'fungolino', 'vespa'], 2], [['lobo_nevoa', 'vespa'], 2]],
  bosque: [[['lobo_nevoa', 'lobo_nevoa'], 3], [['flor_boca', 'fungolino'], 2], [['vespa', 'vespa', 'vespa'], 2], [['flor_boca', 'lobo_nevoa'], 2]],
  minas: [[['morcego', 'morcego'], 3], [['pedregulho'], 2], [['toupeira', 'morcego'], 3], [['mineiro_espectral', 'mineiro_espectral'], 2], [['toupeira', 'toupeira'], 2]],
  minas2: [[['gosma_cristal', 'gosma_cristal'], 2], [['pedregulho', 'morcego'], 3], [['mineiro_espectral', 'toupeira', 'morcego'], 3], [['gosma_cristal', 'mineiro_espectral'], 2]],
  charco: [[['sapo', 'sapo'], 3], [['sanguessuga', 'sanguessuga'], 2], [['lume_errante', 'lume_errante'], 2], [['afogado'], 2], [['sapo', 'lume_errante', 'sanguessuga'], 2]],
  ruinas: [[['afogado', 'afogado'], 2], [['serpe', 'sapo'], 3], [['serpe', 'lume_errante'], 2], [['afogado', 'serpe', 'lume_errante'], 2]],
  pico: [[['lobo_glacial', 'lobo_glacial'], 3], [['harpia'], 2], [['ieti'], 2], [['espirito_gelido', 'harpia'], 2], [['lobo_glacial', 'espirito_gelido'], 2]],
  cume: [[['ieti', 'harpia'], 2], [['sentinela'], 2], [['espirito_gelido', 'espirito_gelido', 'harpia'], 2], [['lobo_glacial', 'lobo_glacial', 'harpia'], 2], [['sentinela', 'espirito_gelido'], 1]],
  torre: [[['cavaleiro_oco', 'olho_vazio'], 3], [['devorador', 'devorador'], 2], [['quimera'], 2], [['olho_vazio', 'olho_vazio', 'cavaleiro_oco'], 2], [['quimera', 'devorador'], 2]],
};

// ---------- lojas (estoque cresce com o capítulo) ----------
const SHOPS = {
  armazem: { name: 'Armazém da Vila', tiers: [
    [0, ['erva', 'antidoto', 'incenso']],
    [2, ['pocao', 'agua_benta', 'bomba']],
    [3, ['eter', 'pena', 'cha']],
    [4, ['pocao_maior', 'barraca']],
    [5, ['eter_maior', 'raio_garrafa']],
  ] },
  forja: { name: 'Forja', tiers: [
    [0, ['espada_ferro', 'presa_prata', 'colete_couro']],
    [2, ['cajado_carvalho', 'amuleto_antiveneno', 'pena_veloz']],
    [3, ['lamina_runica', 'coleira_runica', 'cetro_musgo', 'marreta_aco', 'cota_malha', 'manto_encantado', 'brinco_mana']],
    [4, ['bracelete_forca', 'pingente_lunar', 'armadura_placas', 'manto_estelar']],
    [5, ['lamina_prateada', 'cetro_lunar', 'martelo_runico', 'cachecol_la']],
  ] },
  refugio: { name: 'Refúgio do Alpinista', tiers: [
    [0, ['pocao', 'pocao_maior', 'eter', 'eter_maior', 'pena', 'agua_benta', 'cachecol_la', 'barraca']],
  ] },
  mascate: { name: 'Mascate Fantasma', tiers: [
    [0, ['pocao_maior', 'eter_maior', 'pena', 'agua_benta', 'raio_garrafa', 'barraca', 'cha']],
  ] },
};
