'use strict';
// ============================================================
//  MAPAS — Parte 2: Minas, Charco, Pico, Farol de Cinzas, final
// ============================================================

// labirinto determinístico (backtracking) em células 2x2
MB.maze = function (g, x0, y0, cw, chh, seed, floor = 'g') {
  const R = U.seeded(seed);
  const seen = new Set(), stack = [[0, chh - 1]];
  const key = (i, j) => i + ',' + j;
  seen.add(key(0, chh - 1));
  this.set(g, x0, y0 + 2 * (chh - 1), floor, true);
  const deg = {};
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < cw && b < chh && !seen.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[Math.floor(R() * nb.length)];
    seen.add(key(a, b));
    this.set(g, x0 + 2 * a, y0 + 2 * b, floor, true);
    this.set(g, x0 + i + a, y0 + j + b, floor, true);
    deg[key(i, j)] = (deg[key(i, j)] || 0) + 1; deg[key(a, b)] = (deg[key(a, b)] || 0) + 1;
    stack.push([a, b]);
  }
  return Object.entries(deg).filter(([, d]) => d === 1).map(([k]) => { const [i, j] = k.split(',').map(Number); return [x0 + 2 * i, y0 + 2 * j]; });
};

// ------------------------------------------------------------
//  Minas de Ferrugem
// ------------------------------------------------------------
(function () {
  const g = MB.make(34, 26, 'C');
  MB.path(g, [[0, 13], [2, 13]], 3, 'o');
  MB.rect(g, 3, 12, 1, 3, 'o', true);
  MB.rect(g, 4, 13, 1, 1, 'o', true);
  MB.rect(g, 5, 7, 10, 12, 'o', true);
  MB.path(g, [[15, 13], [21, 13]], 3, 'o');
  MB.rect(g, 22, 9, 8, 9, 'o', true);
  MB.rect(g, 25, 8, 1, 1, 'o', true);
  MB.path(g, [[25, 6], [25, 3]], 3, 'o');
  MB.rect(g, 22, 1, 8, 4, 'o', true);
  MB.set(g, 28, 2, '>', true);
  MB.rect(g, 9, 19, 1, 1, 'o', true);
  MB.rect(g, 6, 20, 8, 4, 'o', true);
  MB.rect(g, 30, 13, 1, 1, 'o', true);
  MB.rect(g, 31, 11, 2, 5, 'o', true);
  MB.path(g, [[5, 13], [29, 13]], 1, 'n');
  for (const [x, y] of [[5, 7], [14, 7], [5, 18], [14, 18], [22, 17], [29, 17], [22, 1], [6, 23]]) MB.set(g, x, y, 'E', true);
  MB.set(g, 22, 9, 'x', true); MB.set(g, 23, 9, 'K', true); MB.set(g, 13, 20, 'x', true); MB.set(g, 29, 1, 'K', true);
  MB.scatter(g, '*', 18, 501, ['C']);
  MAPS.minas1 = {
    name: 'Minas de Ferrugem', theme: 'cave', base: 'o', music: 'cave', pad: 'C', bg: 'cave', ambient: 'dust', dark: 0.6,
    encounters: 'minas', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.warp(0, 12, 'campos', 42, 15, 'left'), E.warp(0, 13, 'campos', 42, 15, 'left'), E.warp(0, 14, 'campos', 42, 15, 'left'),
      { type: 'gate', x: 4, y: 13, open: () => !!State.flag('mina_aberta'), talk: async S => {
        if (S.has('chave_mina')) { S.setFlag('mina_aberta'); S.sfx('door'); await S.say(null, 'Bento gira a chave enferrujada. O portão da mina se abre com um rangido.'); }
        else await S.say(null, 'O portão de ferro da mina está trancado com um cadeado enorme. Quem teria a chave?');
      } },
      { type: 'lever', x: 6, y: 8, flag: 'mina_a' },
      { type: 'gate', x: 9, y: 19, open: () => !!State.flag('mina_a') },
      { type: 'lever', x: 12, y: 22, flag: 'mina_b' },
      { type: 'gate', x: 25, y: 8, open: () => !!State.flag('mina_b') },
      { type: 'gate', x: 30, y: 13, open: () => !State.flag('mina_a') },
      E.sign(15, 11, 'Galeria Superior. "Alavanca da esquerda: comportas do sul. A da sala sul abre o poço."'),
      E.chest(7, 22, 'pocao', 2), E.chest(32, 11, 200), E.chest(32, 15, 'eter'), E.chest(28, 10, 'bomba', 2),
      E.warp(28, 2, 'minas2', 3, 2, 'down', { sfx: 'stairs' }),
    ],
    async onEnter(S) {
      if (!S.flag('minas_intro')) {
        S.setFlag('minas_intro'); await S.wait(10);
        await S.say('Bento', 'PIPO! ...PIPOOO!');
        await S.say(null, 'O eco responde de volta, várias vezes, e some no escuro.');
        await S.say('Nara', 'Fale mais baixo, grandalhão. Tem coisa acordando aqui embaixo.');
      }
    },
  };
})();

(function () {
  const g = MB.make(36, 28, 'C');
  MB.rect(g, 1, 1, 6, 5, 'o', true);
  MB.set(g, 3, 1, '<', true);
  MB.path(g, [[4, 5], [4, 12]], 2, 'o');
  MB.rect(g, 2, 12, 10, 6, 'o', true);
  MB.path(g, [[11, 14], [18, 14]], 2, 'o');
  MB.rect(g, 18, 9, 9, 10, 'o', true);
  MB.path(g, [[22, 9], [22, 4]], 2, 'o');
  MB.rect(g, 17, 1, 12, 4, 'o', true);
  MB.path(g, [[26, 16], [32, 16], [32, 22]], 2, 'o');
  MB.rect(g, 27, 21, 8, 6, 'o', true);
  MB.rect(g, 35, 23, 1, 1, 'o', true);
  MB.path(g, [[8, 17], [8, 23], [15, 23]], 2, 'o');
  MB.rect(g, 14, 21, 6, 5, 'o', true);
  MB.path(g, [[2, 15], [11, 15]], 1, 'n');
  MB.path(g, [[19, 17], [26, 17]], 1, 'n');
  for (const [x, y] of [[2, 12], [11, 12], [11, 17], [18, 9], [26, 9], [26, 18], [17, 1], [28, 1], [27, 26], [34, 26], [14, 25], [19, 21]]) MB.set(g, x, y, '*', true);
  for (const [x, y] of [[6, 1], [18, 18], [27, 21], [14, 21], [2, 17]]) MB.set(g, x, y, 'E', true);
  MB.scatter(g, '*', 20, 511, ['C']);
  MAPS.minas2 = {
    name: 'Galeria Profunda', theme: 'cave', base: 'o', music: 'cave', pad: 'C', bg: 'cave', ambient: 'dust', dark: 0.65,
    encounters: 'minas2', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.warp(3, 1, 'minas1', 28, 3, 'down', { sfx: 'stairs' }),
      E.npc(24, 12, 'pipo', 'Pipo', null, { cond: () => !State.flag('pipo_salvo'), fixed: true }),
      { type: 'boss', x: 22, y: 12, enemy: 'toupeira', scale: 1.8, cond: () => !State.flag('pipo_salvo') },
      { type: 'boss', x: 24, y: 14, enemy: 'pedregulho', scale: 1.6, cond: () => !State.flag('pipo_salvo') },
      ...trigLine(19, [14, 15], pipoEvent, 'pipo_evento'),
      ...trigLine([22, 23], 8, pipoEvent, 'pipo_evento'),
      E.chest(18, 2, 'pocao', 3), E.chest(27, 2, 'eter'), E.chest(28, 4, 300),
      E.chest(18, 24, 'talisma_desperto'), E.chest(3, 16, 'cristal_gelo', 2), E.chest(28, 22, 'pocao', 2),
      E.fire(30, 25),
      { type: 'gate', x: 35, y: 23, open: () => !!State.flag('galeria_aberta'), talk: async S => {
        if (S.has('chave_galeria')) { S.setFlag('galeria_aberta'); S.sfx('door'); await S.say(null, 'A chave da galeria serve! O portão pesado se arrasta para o lado.'); }
        else await S.say(null, 'Um portão enorme, marcado com um símbolo de chama azul. Está trancado.');
      } },
      E.warp(35, 23, 'minas3', 1, 10, 'right'),
    ],
  };
})();

async function pipoEvent(S) {
  await S.say('Pipo', 'Socorro! Alguém?! Mestre Bento?!');
  await S.say('Bento', 'PIPO! Segura aí, moleque!');
  await S.say(null, 'Criaturas da mina cercam o menino, encolhido atrás de um carrinho de minério.');
  await S.battle(['toupeira', 'pedregulho', 'toupeira'], { bg: 'cave', intro: 'Criaturas cercam Pipo!', canFlee: false });
  S.setFlag('pipo_salvo');
  await S.say('Pipo', 'Mestre! Eu sabia que o senhor vinha!');
  await S.say('Bento', 'Moleque teimoso! Eu mandei buscar minério na entrada, não no fundo da mina! ...Tá machucado?');
  await S.say('Pipo', 'Só o orgulho. É que eu vi uma luz azul descendo pro fundo da mina... e um monstro de ferro enorme indo atrás dela.');
  await S.say('Pipo', 'Achei essa chave caída no chão. Acho que abre o portão da galeria funda, lá no sudeste.');
  await S.give('chave_galeria');
  await S.say('Bento', 'Agora volta pra vila. Já! E conta pra Rosa que eu tô bem.');
  await S.say('Pipo', 'Sim, senhor! Boa sorte, pessoal!');
}

(function () {
  const g = MB.make(18, 14, 'C');
  MB.ellipse(g, 9, 6.5, 7.5, 5.5, 'o');
  MB.path(g, [[0, 10], [3, 10]], 1, 'o');
  MB.path(g, [[1, 10], [15, 10]], 1, 'n');
  for (const [x, y] of [[3, 3], [15, 3], [2, 7], [16, 7], [5, 1], [13, 1]]) MB.set(g, x, y, '*', true);
  MAPS.minas3 = {
    name: 'Coração da Mina', theme: 'cave', base: 'o', music: 'cave', pad: 'C', bg: 'cave', dark: 0.45,
    tiles: MB.rows(g),
    ents: [
      E.warp(0, 10, 'minas2', 34, 23, 'left'),
      { type: 'boss', x: 9, y: 4, enemy: 'colosso', scale: 1.5, cond: () => !State.flag('colosso_vencido'), talk: colossoFight },
      E.block(8, 4, () => !State.flag('colosso_vencido')), E.block(10, 4, () => !State.flag('colosso_vencido')),
      ...trigLine(3, 10, colossoFight, 'colosso_intro'),
    ],
  };
})();

async function colossoFight(S) {
  if (S.flag('colosso_vencido')) return;
  await S.say(null, 'Uma máquina de mineração ancestral, coberta de ferrugem, guarda uma faísca azul no peito. Seus olhos acendem.');
  await S.say('Bento', 'Isso é... um colosso de forja dos antigos! Meu avô contava histórias desses aí.');
  await S.say('Nara', 'A névoa está movendo as engrenagens dele. Cuidado quando o núcleo esquentar — defendam-se!');
  S.sfx('roar'); G.shake(25, 6);
  await S.battle(['colosso'], { boss: true, bg: 'cave' });
  S.setFlag('colosso_vencido');
  await S.say(null, 'O Colosso range, ajoelha-se e para de vez. A faísca azul se solta do seu peito.');
  S.sfx('ember'); G.flash('#5ab8ff', 20);
  await S.give('brasa_azul');
  await S.say('Tição', 'Auuu!');
  S.chapter(3);
  await S.say('Bento', 'Esse trilho aqui leva direto pra saída. Todo mundo no carrinho!');
  await S.fadeOut(20);
  for (let i = 0; i < 3; i++) { S.sfx('slide'); await S.wait(14); }
  await S.warp('campos', 41, 15, 'left');
  await S.say('Lia', 'Duas brasas! A próxima está no Charco das Lamúrias, ao sul.');
  await S.say('Bento', 'O Seu Jonas tem uma balsa no cais. Se ela estiver quebrada... bom, conserto é comigo!');
}

// ------------------------------------------------------------
//  Charco das Lamúrias
// ------------------------------------------------------------
(function () {
  const g = MB.make(44, 34, 'y');
  MB.border(g, 'd');
  for (const [x, y, rx, ry, c] of [[15, 27, 5, 3, '~'], [30, 29, 6, 2.5, '~'], [6, 14, 3.5, 4, '~'], [30, 13, 4, 3, '~'], [16, 5, 4, 2.5, '~'], [39, 17, 3, 2.5, '%'], [26, 25, 3, 2, '%'], [13, 17, 3, 2, '%'], [33, 4, 4, 2, '~']]) MB.ellipse(g, x, y, rx, ry, c, false);
  MB.rect(g, 1, 28, 6, 4, 'y', true);
  MB.path(g, [[4, 29], [11, 29], [11, 21], [22, 21]], 2, 'y');
  MB.path(g, [[22, 21], [22, 1]], 2, 'y');
  MB.path(g, [[22, 0], [22, 0]], 2, 'y');
  MB.path(g, [[22, 13], [9, 13], [9, 6]], 2, 'y');
  MB.path(g, [[23, 21], [35, 21], [35, 27]], 2, 'y');
  MB.path(g, [[35, 21], [38, 21], [38, 9]], 2, 'y');
  MB.rect(g, 28, 21, 4, 2, '%', true);
  MB.rect(g, 22, 16, 2, 2, '%', true);
  MB.set(g, 9, 5, 'y', true); MB.set(g, 38, 8, 'y', true); MB.set(g, 35, 29, 'y', true);
  MB.house(g, 24, 15, 5, 'R');
  MB.rect(g, 24, 18, 6, 1, 'y', true);
  MB.path(g, [[26, 18], [26, 21]], 1, 'y');
  MB.path(g, [[11, 25], [5, 25]], 2, 'y');
  MB.path(g, [[22, 8], [30, 8]], 2, 'y');
  MB.path(g, [[36, 24], [41, 24]], 2, 'y');
  MB.path(g, [[15, 13], [15, 17]], 1, 'y');
  MB.path(g, [[39, 10], [41, 10]], 1, 'y');
  MB.scatter(g, 'd', 30, 601, ['y']); MB.scatter(g, '~', 50, 602, ['y']); MB.scatter(g, '%', 35, 603, ['y']);
  MB.scatter(g, 'l', 12, 604, ['~']); MB.scatter(g, 'M', 6, 605, ['y']); MB.scatter(g, 'r', 6, 606, ['y']);
  MAPS.charco1 = {
    name: 'Charco das Lamúrias', theme: 'swamp', base: 'y', music: 'swamp', pad: 'd', bg: 'swamp', ambient: 'fog',
    dark: () => State.flag('lanternas') ? 0.15 : 0.55, lightR: 3.2,
    encounters: 'charco', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.npc(2, 29, 'barqueiro', 'Seu Jonas', async S => {
        const c = await S.ask('Voltar para os Campos Dourados?', ['Sim', 'Ficar'], 'Seu Jonas');
        if (c === 0) { S.sfx('door'); await S.warp('campos', 21, 26, 'up'); }
      }, { fixed: true, dir: 'right' }),
      E.obj(2, 31, 'raft', ['A balsa de Seu Jonas.']),
      E.warp(22, 0, 'charco2', 15, 26, 'up'), E.warp(23, 0, 'charco2', 16, 26, 'up'),
      E.obj(22, 3, 'fogwall', ['Uma parede de névoa gelada, quase sólida. Tição rosna para ela.'], { cond: () => !State.flag('lanternas') }),
      E.obj(23, 3, 'fogwall', ['Uma parede de névoa gelada, quase sólida. Tição rosna para ela.'], { cond: () => !State.flag('lanternas') }),
      { type: 'lantern', x: 9, y: 5, flag: 'lant1', talk: lanternTalk },
      { type: 'lantern', x: 38, y: 8, flag: 'lant2', talk: lanternTalk },
      { type: 'lantern', x: 35, y: 29, flag: 'lant3', talk: lanternTalk },
      E.npc(28, 18, 'quiteria', 'Vó Quitéria', quiteriaTalk, { fixed: true, dir: 'down' }),
      E.obj(26, 17, null, ['A cabana de Vó Quitéria. Lá dentro, algo borbulha num caldeirão.']),
      { type: 'sparkle', x: 5, y: 25, flag: 'cog1', item: 'cogumelo_lunar', cond: () => !State.flag('cog1') },
      { type: 'sparkle', x: 30, y: 8, flag: 'cog2', item: 'cogumelo_lunar', cond: () => !State.flag('cog2') },
      { type: 'sparkle', x: 41, y: 24, flag: 'cog3', item: 'cogumelo_lunar', cond: () => !State.flag('cog3') },
      { type: 'sparkle', x: 15, y: 17, flag: 'osso_achado', item: 'osso_brinquedo', cond: () => !State.flag('osso_achado') },
      E.chest(5, 26, 'manto_encantado'), E.chest(30, 9, 'pocao_maior'), E.chest(41, 25, 450), E.chest(41, 10, 'pena'),
      E.sign(12, 29, 'Charco das Lamúrias. "Quando as três lanternas ardem, a névoa recua."'),
    ],
    async onEnter(S) {
      if (!S.flag('charco_intro')) {
        S.setFlag('charco_intro'); await S.wait(10);
        await S.say('Seu Jonas', 'Daqui eu não passo. Fico esperando vocês aqui na balsa.');
        await S.say('Nara', 'Cuidado com a água esverdeada: ela queima a pele. E essa névoa... não dá pra ver um palmo à frente.');
        await S.say('Lia', 'Olha ali, uma placa. "Quando as três lanternas ardem, a névoa recua." Tição, você consegue acendê-las?');
        S.sfx('bark'); await S.say('Tição', 'Au!');
      }
    },
  };
})();

async function lanternTalk(S, e) {
  await S.say(null, 'Uma lanterna de pedra antiga, apagada há muito tempo.');
  await S.say(null, 'Tição se aproxima e sopra uma chama violeta no pavio.');
  S.setFlag(e.flag); S.sfx('ember'); G.flash('#c87aff', 10);
  const n = ['lant1', 'lant2', 'lant3'].filter(f => S.flag(f)).length;
  if (n < 3) { await S.say(null, `A lanterna acende! (${n}/3)`); return; }
  S.setFlag('lanternas');
  G.shake(20, 3);
  await S.say(null, 'A terceira lanterna acende. Um vento morno atravessa o charco e a névoa recua, revelando um caminho ao norte!');
  await S.say('Nara', 'As Ruínas Afundadas... A brasa violeta deve estar lá.');
}

async function quiteriaTalk(S) {
  const q = S.flag('q_cogumelos'), n = State.count('cogumelo_lunar');
  if (!q) {
    await S.say('Vó Quitéria', 'Ora, ora, visitas no meu charco! E com um espírito de chama a tiracolo. Faz tempo que não vejo um desses.');
    await S.say('Vó Quitéria', 'Escutem, meus queridos: preciso de *5 Cogumelos Lunares* pra minha poção. Eles brilham no chão, aqui no charco e nas ruínas ao norte.');
    await S.say('Vó Quitéria', 'Tragam todos e eu pago com coisa boa. Coisa muito boa.');
    S.quest('cogumelos', 'active');
    if (n >= 5) return quiteriaTalk(S);
  } else if (q === 'active' && n >= 5) {
    await S.say('Vó Quitéria', 'Cinco! Cinco cogumelinhos lunares! Ah, que beleza. Tomem, como prometido.');
    S.take('cogumelo_lunar', 5);
    await S.give('elixir', 2);
    await S.give('amuleto_brasa');
    await S.say('Vó Quitéria', 'Esse amuleto protege contra a escuridão. Vocês vão precisar, se forem enfrentar o que eu acho que vão.');
    S.quest('cogumelos', 'done');
  } else if (q === 'active') await S.say('Vó Quitéria', `Você tem ${n} de 5 cogumelos. Procure o brilho no chão do charco e das ruínas!`);
  else await S.say('Vó Quitéria', 'A névoa tem medo de gente que não desiste. Lembre-se disso, menina.');
}

(function () {
  const g = MB.make(32, 28, '~');
  MB.rect(g, 13, 22, 6, 5, 's', true);
  MB.path(g, [[15, 27], [15, 26]], 2, 's');
  MB.path(g, [[15, 18], [15, 21]], 2, '|');
  MB.rect(g, 10, 13, 12, 6, 's', true);
  MB.path(g, [[6, 15], [9, 15]], 2, '=');
  MB.rect(g, 1, 11, 5, 8, 's', true);
  MB.path(g, [[22, 15], [25, 15]], 2, '=');
  MB.rect(g, 26, 11, 5, 8, 's', true);
  MB.path(g, [[15, 10], [15, 12]], 2, '|');
  MB.rect(g, 8, 1, 16, 9, 's', true);
  for (const [x, y] of [[9, 2], [22, 2], [9, 8], [22, 8], [11, 14], [20, 14], [11, 17], [20, 17], [2, 12], [29, 12]]) MB.set(g, x, y, 'O', true);
  MB.rect(g, 2, 16, 3, 2, '%', true); MB.rect(g, 27, 13, 3, 1, '%', true); MB.rect(g, 12, 4, 2, 2, '%', true); MB.rect(g, 18, 6, 3, 1, '%', true);
  MB.scatter(g, 'l', 18, 611, ['~']);
  MAPS.charco2 = {
    name: 'Ruínas Afundadas', theme: 'swamp', base: 's', music: 'swamp', pad: '~', bg: 'ruins', ambient: 'fog', dark: 0.3,
    encounters: 'ruinas', rate: [16, 28],
    tiles: MB.rows(g),
    ents: [
      E.warp(15, 27, 'charco1', 22, 1, 'down'), E.warp(16, 27, 'charco1', 23, 1, 'down'),
      E.fire(17, 24),
      E.chest(1, 11, 'pocao_maior'), E.chest(30, 11, 'eter', 2), E.chest(10, 13, 'pena'), E.chest(21, 18, 380),
      { type: 'sparkle', x: 3, y: 13, flag: 'cog4', item: 'cogumelo_lunar', cond: () => !State.flag('cog4') },
      { type: 'sparkle', x: 29, y: 17, flag: 'cog5', item: 'cogumelo_lunar', cond: () => !State.flag('cog5') },
      ...trigLine([15, 16], 10, hidraFight, 'hidra_intro'),
      { type: 'boss', x: 15, y: 3, enemy: 'hidra_corpo', scale: 1.5, cond: () => !State.flag('hidra_vencida'), talk: hidraFight },
      E.block(14, 3, () => !State.flag('hidra_vencida')), E.block(16, 3, () => !State.flag('hidra_vencida')),
    ],
  };
})();

async function hidraFight(S) {
  if (S.flag('hidra_vencida')) return;
  await S.say(null, 'A água do templo afundado começa a borbulhar. Três cabeças emergem, uma delas mordendo uma faísca violeta.');
  await S.say('Bento', 'Três cabeças?! Isso não é justo!');
  await S.say('Nara', 'Se cortarmos as cabeças, o corpo faz crescer de novo. Mirem no corpo quando puderem!');
  S.sfx('roar'); G.shake(25, 6);
  await S.battle(['hidra_fogo', 'hidra_corpo', 'hidra_veneno'], { boss: true, bg: 'ruins' });
  S.setFlag('hidra_vencida');
  await S.say(null, 'A Hidra afunda nas águas escuras, e um lamento antigo finalmente se cala.');
  S.sfx('ember'); G.flash('#c87aff', 20);
  await S.give('brasa_violeta');
  await S.say('Tição', 'Auuu!');
  await S.say(null, 'Entre os destroços, brilha uma escama verde-escura.');
  await S.give('escama_hidra');
  S.chapter(4);
  await S.say('Bento', 'Olha só essas vigas do templo: madeira-de-lei, nem apodreceu com a água! Vou levar umas tábuas. Com isso, conserto a ponte do rio.');
  await S.say('Lia', 'Então o próximo destino é o Pico do Silêncio. Vamos voltar com o Seu Jonas.');
  await S.warp('campos', 21, 26, 'up');
}

// ------------------------------------------------------------
//  Pico do Silêncio
// ------------------------------------------------------------
const ICE1 = [
  '...r.r...r...r..',
  '.....r.....r....',
  '.r...........r..',
  '................',
  '..r............r',
  '......r.........',
  '..............r.',
  '.r..........r...',
  '.rrr....r......r',
  '..r.............',
  '....r.r....r....',
];
const ICE2 = [
  '..........r.......',
  '..................',
  '....r.r..........r',
  '.............r....',
  '..................',
  '.......r.....r....',
  '.............r..r.',
  '....r......r....r.',
  '.....r.....r......',
  '.r.r.....r.r......',
  '....r.r.r.........',
  '........r.........',
];
const iceRows = rows => rows.map(r => r.replace(/\./g, 'I'));

(function () {
  const g = MB.make(30, 40, 'A');
  MB.rect(g, 1, 29, 28, 10, 'S', false);
  MB.path(g, [[15, 39], [15, 22]], 3, 'S');
  MB.path(g, [[15, 8], [15, 0]], 3, 'S');
  MB.path(g, [[16, 4], [22, 4]], 2, 'S');
  MB.house(g, 4, 30, 7, 'Q');
  MB.rect(g, 3, 33, 11, 3, 'S', true);
  MB.rect(g, 6, 9, 18, 13, '^', true);
  MB.stamp(g, 7, 10, iceRows(ICE1), true);
  MB.set(g, 15, 21, 'S', true); MB.set(g, 15, 9, 'S', true);
  MB.protect(g, 26, 36, 1); MB.protect(g, 2, 37, 1);
  MB.scatter(g, 'A', 18, 701, ['S'], [1, 29, 28, 10]); MB.scatter(g, 'r', 8, 702, ['S'], [1, 29, 28, 10]);
  MAPS.pico1 = {
    name: 'Trilha Gélida', theme: 'snow', base: 'S', music: 'snow', pad: 'A', bg: 'snow', ambient: 'snow',
    encounters: 'pico', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.warp(14, 39, 'campos', 42, 5, 'left'), E.warp(15, 39, 'campos', 42, 5, 'left'), E.warp(16, 39, 'campos', 42, 5, 'left'),
      E.warp(14, 0, 'pico2', 15, 28, 'up'), E.warp(15, 0, 'pico2', 15, 28, 'up'), E.warp(16, 0, 'pico2', 15, 28, 'up'),
      E.obj(7, 32, null, ['O Refúgio do Alpinista. Uma placa diz: "Lareira acesa, sopa quente. Bata antes de entrar."']),
      E.npc(9, 34, 'alpinista', 'Marta', async S => {
        await S.say('Marta', 'Subindo o Pico? Com esse frio? Vocês são loucos. Mas loucos bem equipados vivem mais. Dá uma olhada!');
        await S.shop('refugio');
      }, { fixed: true }),
      E.npc(4, 35, 'monge', 'Monge Bóris', boristTalk, { wander: 1 }),
      E.fire(12, 34),
      E.sign(17, 22, 'Cuidado: gelo! Quem pisa no gelo desliza até bater em algo. Pense antes de andar.'),
      E.chest(22, 4, 'cachecol_la'), E.chest(26, 36, 'pocao_maior'), E.chest(2, 37, 'eter_maior'),
    ],
    async onEnter(S) {
      if (!S.flag('pico_intro')) {
        S.setFlag('pico_intro'); await S.wait(10);
        await S.say('Bento', 'Brrr! Eu devia ter trazido a fornalha.');
        await S.say('Nara', 'Lá em cima o ar é fino. Descansem no refúgio antes de subir.');
        await S.say('Tição', 'Au! (Tição solta vapor pelo focinho, todo contente com a neve.)');
      }
    },
  };
})();

async function boristTalk(S) {
  const q = S.flag('q_guardiao');
  if (!q) {
    await S.say('Monge Bóris', 'Medito há vinte invernos nesta montanha. Dizem que, no gelo do Cume, existe uma passagem escondida a oeste.');
    await S.say('Monge Bóris', 'Ela leva a uma caverna onde dorme o *Guardião Esquecido*, o primeiro protetor da chama. Só os mais fortes devem acordá-lo.');
    S.quest('guardiao', 'active');
  } else if (q === 'active' && S.flag('guardiao_vencido')) {
    await S.say('Monge Bóris', 'Vocês acordaram o Guardião... e ele os reconheceu como dignos. A montanha agradece.');
    S.quest('guardiao', 'done');
  } else if (q === 'active') await S.say('Monge Bóris', 'No grande campo de gelo do Cume, há uma saída a oeste, no meio do paredão. Deslize com sabedoria.');
  else await S.say('Monge Bóris', 'Que a sua chama nunca vacile.');
}

(function () {
  const g = MB.make(30, 30, 'A');
  MB.path(g, [[15, 29], [15, 21]], 3, 'S');
  MB.path(g, [[15, 6], [15, 5]], 3, 'S');
  MB.ellipse(g, 15, 3, 8, 2.8, 'S');
  MB.path(g, [[5, 11], [2, 11], [2, 25]], 1, 'S');
  MB.rect(g, 5, 7, 20, 14, '^', true);
  MB.stamp(g, 6, 8, iceRows(ICE2), true);
  MB.set(g, 15, 20, 'S', true); MB.set(g, 15, 7, 'S', true); MB.set(g, 5, 11, 'S', true);
  MB.set(g, 2, 26, '>', true);
  MB.rect(g, 17, 22, 5, 3, 'S', true);
  MB.scatter(g, 'r', 4, 711, ['S'], [8, 1, 14, 4]);
  MAPS.pico2 = {
    name: 'Cume do Silêncio', theme: 'snow', base: 'S', music: 'snow', pad: 'A', bg: 'snow', ambient: 'snow',
    encounters: 'cume', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.warp(14, 29, 'pico1', 15, 1, 'down'), E.warp(15, 29, 'pico1', 15, 1, 'down'), E.warp(16, 29, 'pico1', 15, 1, 'down'),
      E.warp(2, 26, 'caverna_gelo', 8, 9, 'up', { sfx: 'stairs' }),
      E.chest(21, 23, 'pocao_maior', 2),
      E.fire(9, 4),
      ...trigLine([14, 15, 16], 6, async S => {
        await S.say(null, 'O vento para de repente. No topo, uma criatura imensa dorme sobre um ninho de gelo, abraçada a uma faísca branca.');
        await S.say('Nara', 'É melhor descansar na fogueira antes de chegar perto.');
      }, 'cume_intro'),
      ...trigLine([14, 15, 16], 2, grifoFight, 'grifo_intro'),
      { type: 'boss', x: 15, y: 1, enemy: 'grifo', scale: 1.2, cond: () => !State.flag('grifo_vencido'), talk: grifoFight },
    ],
  };
})();

async function grifoFight(S) {
  if (S.flag('grifo_vencido')) return;
  S.sfx('roar'); G.shake(25, 6);
  await S.say(null, 'O Grifo Glacial abre os olhos. Suas penas eriçam como lâminas de gelo.');
  await S.say('Lia', 'Essa é a última brasa. Pessoal... tudo o que temos!');
  await S.say('Bento', 'Pode vir, passarinho!');
  await S.battle(['grifo'], { boss: true, bg: 'snow' });
  S.setFlag('grifo_vencido');
  await S.say(null, 'O Grifo pousa devagar, cansado, e abaixa a cabeça. A faísca branca flutua até Tição.');
  S.sfx('ember'); G.flash('#ffffff', 20);
  await S.give('brasa_branca');
  S.chapter(5);
  await S.say(null, 'As quatro brasas giram em volta de Tição. Ele uiva para o oeste, na direção do farol.');
  await S.say('Tição', 'Auuuuuuu!');
  await S.say('Nara', 'Elas querem voltar para casa.');
  await S.say('Lia', 'Então vamos levá-las. Para o Farol!');
  await S.fadeOut(30);
  await S.warp('farol_ext', 20, 10, 'left');
}

MAPS.caverna_gelo = (function () {
  const g = MB.make(16, 12, 'C');
  MB.ellipse(g, 8, 5.5, 6.5, 4.5, 'I');
  MB.rect(g, 7, 9, 3, 2, 'o', true);
  MB.set(g, 8, 10, '<', true);
  MB.rect(g, 5, 2, 7, 6, 'o', true);
  for (const [x, y] of [[3, 3], [13, 3], [2, 6], [14, 6], [4, 8], [12, 8]]) MB.set(g, x, y, '*', true);
  return {
    name: 'Caverna do Guardião', theme: 'cave', base: 'o', music: 'cave', pad: 'C', dark: 0.3,
    tiles: MB.rows(g),
    ents: [
      E.warp(8, 10, 'pico2', 2, 25, 'up', { sfx: 'stairs' }),
      { type: 'boss', x: 8, y: 3, enemy: 'guardiao', scale: 1.2, cond: () => !State.flag('guardiao_vencido'), talk: async S => {
        await S.say(null, 'Uma armadura de pedra, coberta de gelo e musgo, segura uma espada que ainda brilha em brasa.');
        await S.say('???', 'QUEM... ACORDA... O GUARDIÃO DA PRIMEIRA CHAMA?', { portrait: null });
        await S.say('Lia', 'Lia, aprendiz do Farol de Cinzaluz. A chama se apagou, e nós vamos reacendê-la.');
        await S.say('???', 'ENTÃO... MOSTREM... QUE SÃO DIGNOS DELA.', { portrait: null });
        const c = await S.ask('Enfrentar o Guardião Esquecido? (Um desafio muito difícil.)', ['Lutar!', 'Ainda não']);
        if (c !== 0) return;
        await S.battle(['guardiao'], { boss: true, bg: 'cave', music: 'final' });
        S.setFlag('guardiao_vencido');
        await S.say('???', 'DIGNOS... A CHAMA... ESTÁ EM BOAS MÃOS.', { portrait: null });
        await S.say(null, 'O Guardião se desfaz em neve brilhante. No chão, sobra um anel quente ao toque.');
        await S.give('anel_guardiao');
        await S.gold(1000);
      } },
      E.block(7, 3, () => !State.flag('guardiao_vencido')), E.block(9, 3, () => !State.flag('guardiao_vencido')),
    ],
  };
})();

// ------------------------------------------------------------
//  Farol de Cinzas (masmorra final)
// ------------------------------------------------------------
const PED = { brasa_verde: 'verde', brasa_azul: 'azul', brasa_violeta: 'violeta', brasa_branca: 'branca' };
(function () {
  const g = MB.make(24, 20, 'G');
  MB.rect(g, 1, 1, 22, 18, 'g', true);
  MB.rect(g, 1, 9, 22, 1, 'G', true);
  MB.rect(g, 11, 9, 2, 1, 'g', true);
  MB.set(g, 11, 19, 'D', true);
  MB.set(g, 11, 2, '<', true);
  for (const [x, y] of [[4, 4], [19, 4], [4, 14], [19, 14], [6, 11], [17, 11]]) MB.set(g, x, y, 'O', true);
  for (const [x, y] of [[10, 13], [11, 14], [12, 13], [13, 14], [11, 12], [12, 15], [9, 15], [14, 12]]) MB.set(g, x, y, 'e', true);
  MAPS.torre1 = {
    name: 'Farol de Cinzas', theme: 'tower', base: 'g', music: 'tower', pad: 'G', bg: 'tower', ambient: 'embers', dark: 0.35,
    encounters: 'torre', rate: [20, 32],
    tiles: MB.rows(g),
    ents: [
      E.warp(11, 19, 'farol_ext', 11, 8, 'down'),
      E.warp(11, 2, 'torre2', 12, 19, 'up', { sfx: 'stairs' }),
      E.fire(19, 17),
      E.npc(3, 17, 'fantasma', 'Mascate Fantasma', async S => {
        await S.say('Mascate Fantasma', 'Hehehe... Até um fantasma precisa ganhar a vida. Moedas não servem pra nada no além, mas eu gosto do barulhinho.');
        await S.shop('mascate');
      }, { fixed: true }),
      ...['brasa_verde', 'brasa_azul', 'brasa_violeta', 'brasa_branca'].map((b, i) => E.obj([8, 15, 8, 15][i], [12, 12, 16, 16][i], () => State.flag('ped_' + b) ? 'ped_' + PED[b] : 'ped_off', pedestalTalk(b))),
      { type: 'gate', x: 11, y: 9, open: () => !!State.flag('torre_selo'), talk: sealTalk },
      { type: 'gate', x: 12, y: 9, open: () => !!State.flag('torre_selo'), talk: sealTalk },
      E.chest(2, 2, 'chama_ancestral'), E.chest(21, 2, 'pocao_maior', 2), E.chest(21, 7, 'eter_maior'),
    ],
    async onEnter(S) {
      if (!S.flag('torre1_intro')) {
        S.setFlag('torre1_intro'); await S.wait(10);
        await S.say(null, 'Por dentro, o farol virou um labirinto de pedra negra. Quatro pedestais vazios cercam o salão de entrada.');
        await S.say('Nara', 'Os pedestais têm encaixes... do tamanho das brasas.');
      }
    },
  };
})();

function pedestalTalk(b) {
  return async S => {
    if (S.flag('ped_' + b)) { await S.say(null, `A ${ITEMS[b].name} brilha sobre o pedestal.`); return; }
    const c = await S.ask(`Um pedestal com um encaixe ${PED[b]}. Colocar a ${ITEMS[b].name}?`, ['Colocar', 'Não']);
    if (c !== 0) return;
    S.setFlag('ped_' + b); S.sfx('ember'); G.flash(ITEMS[b].icon[1], 10);
    const n = Object.keys(PED).filter(k => S.flag('ped_' + k)).length;
    if (n < 4) { await S.say(null, `A brasa ressoa e projeta sua cor pelas paredes. (${n}/4)`); return; }
    S.setFlag('torre_selo'); G.shake(20, 4);
    await S.say(null, 'As quatro cores se cruzam no centro do salão. As grades do portão norte se desfazem em cinzas!');
    await S.say('Lia', 'As brasas continuam com a gente... só emprestaram a luz. Vamos subir.');
  };
}
async function sealTalk(S) { await S.say(null, 'Grades de sombra sólida. Quatro marcas coloridas estão gravadas nelas.'); }

(function () {
  const g = MB.make(26, 22, 'v');
  MB.rect(g, 9, 17, 8, 4, 'g', true);
  MB.set(g, 12, 20, '>', true);
  MB.path(g, [[12, 13], [12, 16]], 2, 'g');
  MB.rect(g, 6, 6, 14, 7, 'g', true);
  MB.path(g, [[2, 9], [5, 9]], 2, 'g'); MB.path(g, [[2, 3], [2, 9]], 2, 'g');
  MB.rect(g, 1, 1, 5, 4, 'g', true);
  MB.path(g, [[20, 9], [23, 9]], 2, 'g'); MB.path(g, [[23, 3], [23, 9]], 2, 'g');
  MB.rect(g, 20, 1, 5, 4, 'g', true);
  MB.path(g, [[12, 5], [12, 3]], 1, 'g');
  MB.rect(g, 10, 1, 5, 2, 'g', true);
  MB.set(g, 12, 1, '<', true);
  for (const [x, y] of [[6, 6], [19, 6], [6, 12], [19, 12]]) MB.set(g, x, y, 'O', true);
  MAPS.torre2 = {
    name: 'Farol de Cinzas — Ponte do Vazio', theme: 'tower', base: 'g', music: 'tower', pad: 'v', bg: 'tower', ambient: 'embers', dark: 0.4,
    encounters: 'torre', rate: [20, 32],
    tiles: MB.rows(g),
    ents: [
      E.warp(12, 20, 'torre1', 11, 3, 'down', { sfx: 'stairs' }),
      E.warp(12, 1, 'torre3', 1, 19, 'up', { sfx: 'stairs' }),
      { type: 'boulder', x: 9, y: 8, group: 't2_pedras' }, { type: 'plate', x: 9, y: 11, group: 't2_pedras' },
      { type: 'boulder', x: 16, y: 10, group: 't2_pedras' }, { type: 'plate', x: 13, y: 10, group: 't2_pedras' },
      { type: 'gate', x: 12, y: 4, open: () => !!State.flag('t2_pedras'), talk: async S => { await S.say(null, 'Grades de sombra. Dois círculos no chão do salão parecem esperar algo pesado.'); } },
      E.obj(7, 7, 'sign', async S => {
        await S.say(null, 'Palavras riscadas na pedra: "O peso abre o caminho."');
        if (S.flag('t2_pedras')) return;
        const c = await S.ask('Recolocar as pedras na posição original?', ['Sim', 'Não']);
        if (c === 0) { for (const b of World.map.ents.filter(e => e.type === 'boulder')) { b.x = b.homeX; b.y = b.homeY; b.px = b.x * TS; b.py = b.y * TS; } S.sfx('push'); }
      }),
      E.chest(1, 1, 'veu_aurora'), E.chest(5, 1, 'pocao_maior'), E.chest(24, 1, 'armadura_guardiao'), E.chest(20, 1, 'eter_maior'),
    ],
  };
})();

(function () {
  const g = MB.make(23, 21, 'G');
  const ends = MB.maze(g, 1, 1, 11, 10, 777);
  MB.set(g, 1, 19, '>', true);
  MB.set(g, 21, 1, '<', true);
  const spots = ends.filter(([x, y]) => !(x === 1 && y === 19) && !(x === 21 && y === 1));
  spots.sort((a, b) => (b[0] + (20 - b[1])) - (a[0] + (20 - a[1])));
  MAPS.torre3 = {
    name: 'Farol de Cinzas — Escadaria Escura', theme: 'tower', base: 'g', music: 'tower', pad: 'G', bg: 'tower', ambient: 'embers', dark: 0.7, lightR: 3.4,
    encounters: 'torre', rate: [22, 34],
    tiles: MB.rows(g),
    ents: [
      E.warp(1, 19, 'torre2', 12, 2, 'down', { sfx: 'stairs' }),
      E.warp(21, 1, 'torre_topo', 7, 10, 'up', { sfx: 'stairs' }),
      ...['espada_farol', 'galho_ancestral', 'martelo_tita', 'elixir', 'pocao_maior', 'eter_maior'].map((it, i) => spots[i] ? E.chest(spots[i][0], spots[i][1], it) : null).filter(Boolean),
      ...[[5, 13], [13, 7], [17, 15], [9, 3]].map(([x, y]) => ({ type: 'obj', x, y, obj: null, solid: false, light: 1.6, cond: () => true })),
    ],
    async onEnter(S) {
      if (!S.flag('torre3_intro')) {
        S.setFlag('torre3_intro'); await S.wait(10);
        await S.say('Lia', 'Está escuro demais... Tição, fica perto de mim.');
        await S.say('Tição', 'Au. (A máscara de Tição brilha, iluminando o caminho.)');
      }
    },
  };
})();

(function () {
  const g = MB.make(15, 13, 'v');
  MB.ellipse(g, 7, 6, 6.6, 5.6, 'g');
  for (const [x, y] of [[3, 3], [11, 3], [2, 7], [12, 7], [4, 10], [10, 10]]) MB.set(g, x, y, 'e', true);
  MB.set(g, 7, 11, '>', true);
  MAPS.torre_topo = {
    name: 'Topo do Farol de Cinzas', theme: 'tower', base: 'g', music: () => State.flag('vazio_vencido') ? 'ending' : 'tower', pad: 'v', bg: 'final', ambient: 'embers', dark: 0.2,
    tiles: MB.rows(g),
    ents: [
      E.warp(7, 11, 'torre3', 21, 1, 'down', { sfx: 'stairs' }),
      E.obj(7, 3, 'bigLampOff', ['O lampião do farol, coberto por uma crosta de cinzas negras.'], { big: true }),
      E.block(6, 3), E.block(8, 3),
      E.npc(7, 5, 'aurelio_mal', 'Aurélio', null, { id: 'aurelio', fixed: true, dir: 'up', cond: () => !State.flag('vazio_vencido') }),
      E.fire(3, 8),
      ...trigLine([5, 6, 7, 8, 9], 7, finalBattle, 'final_intro'),
    ],
    async onEnter(S) {
      if (!S.flag('topo_intro')) {
        S.setFlag('topo_intro'); await S.wait(10);
        await S.say(null, 'O topo do farol. Aurélio está de costas, diante do lampião morto. Há uma fogueira fraca perto da escada.');
        await S.say('Nara', 'Última chance de descansar, Lia.');
      }
    },
  };
})();

async function finalBattle(S) {
  if (S.flag('vazio_vencido')) return;
  await S.wait(10); S.face('aurelio', 'down'); await S.wait(20);
  await S.say('Aurélio', 'Vocês vieram mesmo. Teimosa como sempre, Lia.');
  await S.say('Lia', 'Mestre, me escuta. A Helena não está na névoa. A névoa só sabe tirar, ela não devolve nada!');
  await S.say('Aurélio', 'CALE-SE! No escuro eu ouço a voz dela! Eu não vou deixar vocês reacenderem essa chama!');
  S.sfx('roar'); G.shake(30, 6); G.flash('#7a3ab0', 20);
  await S.battle(['aurelio'], { boss: true, bg: 'final', intro: 'Aurélio ergue a lanterna negra!' });
  await S.say(null, 'Aurélio cai de joelhos. A lanterna negra racha e se parte no chão.');
  await S.say('Aurélio', 'Lia... O que... o que foi que eu fiz...');
  G.shake(40, 4); S.sfx('dark');
  await S.say(null, 'Dos cacos da lanterna, a névoa se ergue e toma uma forma imensa, cheia de olhos.');
  await S.say('???', 'VELHO TOLO. VOCÊ ME DEU A LUZ DE MIL ANOS PARA DEVORAR.', { portrait: null });
  await S.say('???', 'SÓ FALTA A ÚLTIMA BRASA. O FILHOTE.', { portrait: null });
  S.sfx('bark');
  await S.say('Tição', 'GRRRRRR!');
  await S.say('Aurélio', 'Lia... As brasas... use as brasas! A chama ainda está com vocês!');
  await S.say('Lia', 'Nara, Bento, Tição... todos juntos. Pela luz!');
  S.heal();
  await S.say(null, 'As quatro brasas brilham juntas e o calor delas restaura o grupo!');
  await S.battle(['vazio'], { boss: true, bg: 'final', music: 'final', intro: 'O Vazio desperta!' });
  S.setFlag('vazio_vencido');
  await ending(S);
}

async function ending(S) {
  S.music(null);
  await S.say(null, 'O Vazio se desfaz num grito sem som. A névoa escorre pelas janelas e se perde no mar.');
  await S.say(null, 'Tição caminha devagar até o lampião. As quatro brasas saem flutuando e giram em volta dele.');
  await S.say('Nara', 'Lia... uma chama precisa de um coração para nascer. Ele sabe disso.');
  await S.say('Lia', 'Tição? Não... espera! Tição!');
  await S.say('Tição', 'Au.');
  G.flash('#ffffff', 60); S.sfx('ember');
  S.setFlag('fim');
  await S.say(null, 'Tição salta para dentro do lampião. As brasas o seguem. A Chama Eterna desperta, mais forte e mais quente do que nunca.');
  await S.say('Lia', '...Obrigada, meu amigo.');
  await S.fadeOut(60);
  // epílogo na sala da lanterna
  const keep = State.party.filter(h => h.id === 'lia');
  State.party = keep;
  S.music('ending');
  await S.warp('farol_topo', 5, 6, 'up');
}

// epílogo: NPCs na sala da lanterna depois do final
MAPS.farol_topo.ents.push(
  E.npc(3, 5, 'aurelio', 'Aurélio', null, { cond: () => !!State.flag('fim'), fixed: true, dir: 'right' }),
  E.npc(7, 5, 'nara', 'Nara', null, { cond: () => !!State.flag('fim'), fixed: true, dir: 'left' }),
  E.npc(8, 4, 'bento', 'Bento', null, { cond: () => !!State.flag('fim'), fixed: true, dir: 'left' }),
  E.npc(5, 4, 'ticao', 'Tição', null, { cond: () => !!State.flag('ticao_volta'), fixed: true, dir: 'down' }),
);
const _topoEnter = MAPS.farol_topo.onEnter;
MAPS.farol_topo.onEnter = async function (S) {
  if (S.flag('fim') && !S.flag('epilogo')) {
    S.setFlag('epilogo');
    await S.wait(30);
    await S.say(null, 'Na manhã seguinte, o sol nasce sobre um mar calmo. A luz do farol gira de novo, mesmo de dia.');
    await S.say('Aurélio', 'Trinta anos olhando para a escuridão... e a luz estava aqui o tempo todo. Me perdoe, Lia.');
    await S.say('Aurélio', 'Eu não sou mais digno desta chama. Ela é sua agora. Você é a guardiã do farol.');
    await S.say('Bento', 'E a gente ajuda! Eu forjo uma engrenagem nova pra lanterna, que essa aí já tá rangendo.');
    await S.say('Nara', 'E eu trago ervas para o seu chá, faroleira.');
    await S.say('Lia', 'Obrigada, pessoal. Só queria que o Tição estivesse aqui pra ver.');
    await S.wait(40);
    S.sfx('bark'); G.shake(8, 2);
    await S.say('???', 'Au!', { portrait: 'ticao' });
    S.setFlag('ticao_volta'); S.sfx('ember'); G.flash('#ffb347', 30);
    await S.say(null, 'Uma brasinha pula do lampião, rola no chão... e vira um filhote preto, com uma máscara de caveira e um olho vermelho brilhante.');
    await S.say('Lia', 'TIÇÃO!!');
    await S.say('Nara', 'Parece que a chama, acesa de novo, não precisa mais de um coração emprestado. E achou que você precisava mais dele.');
    await S.say('Bento', 'Hahaha! Esse cachorro não larga ninguém mesmo!');
    await S.say('Tição', 'Au! Au! Auuu!');
    await S.say(null, 'E assim, enquanto houver alguém para cuidar da luz, nenhuma noite em Cinzaluz será escura demais.');
    await S.fadeOut(60);
    G.replaceAll(new CreditsScene());
    await S.fadeIn(40);
    return;
  }
  if (_topoEnter) await _topoEnter(S);
};
