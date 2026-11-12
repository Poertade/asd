'use strict';
// ============================================================
//  MAPAS — Parte 1: Farol, Vila Pavio, Campos Dourados, Floresta
// ============================================================
const inParty = id => State.inParty(id);
const ch = () => State.chapter;

// ------------------------------------------------------------
//  Casa do faroleiro
// ------------------------------------------------------------
MAPS.casa_farol = {
  name: 'Casa do Faroleiro', theme: 'indoor', base: '_', music: () => State.chapter >= 6 ? 'ending' : 'home', pad: '#',
  tiles: [
    '############',
    '#kkq#kk#<k##',
    '#__________#',
    '#B__tt_____#',
    '#B__tt_____#',
    '#______mm__#',
    '#x_____mm_K#',
    '#__________#',
    '#####D######',
  ],
  ents: [
    E.warp(8, 1, 'farol_topo', 4, 6, 'up', { sfx: 'stairs' }),
    E.warp(5, 8, 'farol_ext', 11, 8, 'down', { locked: () => !State.flag('prologo'), lockedText: 'Lá fora está escuro demais... Antes, é melhor ver por que a luz do farol parou de girar.' }),
    E.obj(4, 3, null, async S => {
      if (S.flag('carta')) { await S.say(null, 'A mesa onde Aurélio tomava café toda manhã.'); return; }
      S.setFlag('carta');
      await S.say(null, 'Sobre a mesa há um bilhete dobrado, com a letra trêmula de Aurélio.');
      await S.say(null, '"Perdoe-me, Lia. Não procure por mim. — A."');
      await S.give('carta_aurelio');
      await S.say('Lia', 'Mestre Aurélio...? O que isso quer dizer?');
    }),
    E.trig(5, 7, async S => {
      if (S.flag('prologo') && !S.flag('carta')) {
        S.setFlag('carta');
        await S.say(null, 'Antes de sair, Lia nota um bilhete dobrado sobre a mesa.');
        await S.say(null, '"Perdoe-me, Lia. Não procure por mim. — A."');
        await S.give('carta_aurelio');
        await S.say('Lia', 'Não procurar...? Até parece. Vamos, Tição.');
      }
    }),
  ],
  async onEnter(S) {
    if (S.flag('intro')) return;
    S.setFlag('intro');
    await S.wait(30);
    await S.say(null, 'Lia acorda com um silêncio estranho. Nenhum rangido da engrenagem, nenhum brilho girando pela janela.');
    await S.emote('player', '?');
    await S.say('Lia', 'Mestre Aurélio? ...A luz do farol parou?');
    await S.say(null, '(Use as setas ou WASD para andar. Z ou Enter interage. X ou Esc abre o menu.)');
    await S.say('Lia', 'Preciso subir até a sala da lanterna. A escada fica ali no canto.');
  },
};

// ------------------------------------------------------------
//  Sala da lanterna
// ------------------------------------------------------------
MAPS.farol_topo = {
  name: 'Sala da Lanterna', theme: 'indoor', base: 's', music: () => State.flag('fim') ? 'ending' : 'home', pad: '#',
  tiles: [
    '###########',
    '#kV#####Vk#',
    '#sssssssss#',
    '#sssssssss#',
    '#sssssssss#',
    '#sssssssss#',
    '#sssssssss#',
    '#sss>sssss#',
    '###########',
  ],
  ents: [
    E.warp(4, 7, 'casa_farol', 8, 2, 'down', { sfx: 'stairs' }),
    E.obj(5, 3, () => State.flag('fim') ? 'bigLampOn' : 'bigLampOff', async S => {
      if (S.flag('fim')) await S.say(null, 'A Chama Eterna arde, calma e quente.');
      else await S.say(null, 'O grande lampião está frio. Só restam cinzas cinzentas no fundo.');
    }, { big: true }),
    E.block(4, 3), E.block(6, 3),
    E.npc(5, 5, 'ticao', 'Tição', null, { cond: () => State.flag('ticao_vis') && !inParty('ticao'), fixed: true }),
  ],
  async onEnter(S) {
    if (S.flag('prologo')) return;
    await S.wait(20);
    await S.say('Lia', 'A chama... está apagada!');
    await S.say(null, 'O lampião que ardeu por mil anos está frio. Das cinzas sobe um fio de fumaça cinza.');
    await S.walk('player', 'U');
    G.shake(10, 3); S.sfx('bark');
    S.setFlag('ticao_vis');
    await S.emote('player', '!');
    await S.say('???', 'Grrrr...', { portrait: 'ticao' });
    await S.say('Lia', 'Um filhote?! Você estava no meio das cinzas? E essa máscara... é um crânio?');
    await S.say(null, 'O filhote encara Lia com um único olho vermelho, brilhante como uma brasa.');
    await S.say('Lia', 'Calma, calma... Eu não vou te machucar.');
    G.shake(20, 4); S.sfx('roar');
    await S.say(null, 'Uma bruma gelada escorre pela janela quebrada e ganha forma!');
    await S.say(null, 'O filhote salta para o lado de Lia, rosnando para a névoa.');
    await S.join('ticao');
    await S.say(null, '(Em batalha, escolha comandos com as setas e confirme com Z/Enter. Habilidades gastam PM.)');
    await S.battle(['fiapo', 'fiapo'], { bg: 'lighthouse', intro: 'Fiapos de Névoa invadem a sala!', canFlee: false });
    await S.say('Lia', 'Ufa... Você me ajudou! Obrigada, pequeno.');
    S.sfx('ember'); G.flash('#ffb347', 20);
    await S.say(null, 'A máscara do filhote brilha. Quatro faíscas coloridas surgem das cinzas e disparam pela janela — verde, azul, violeta e branca.');
    await S.say('Lia', 'Aquilo eram... pedaços da chama? A Chama Eterna se partiu em quatro?');
    await S.say('Lia', 'Se a gente juntar essas brasas de novo, talvez dê para reacender o farol!');
    await S.say('Lia', 'Você precisa de um nome. Pretinho assim, com esse olho de brasa... *Tição*! Gostou?');
    S.sfx('bark');
    await S.say('Tição', 'Au! Au!');
    await S.say('Lia', 'Mestre Aurélio não está em lugar nenhum... Vamos até a Vila Pavio. A Prefeita Dalva vai saber o que fazer.');
    S.setFlag('prologo'); S.chapter(1);
  },
};

// ------------------------------------------------------------
//  Penhasco do farol
// ------------------------------------------------------------
(function () {
  const g = MB.make(26, 18, '~');
  MB.ellipse(g, 12.5, 8.5, 12, 8.3, ';', false);
  MB.ellipse(g, 12.5, 9, 10.6, 6.9, '.', false);
  MB.rect(g, 17, 4, 9, 12, '.');
  MB.rect(g, 21, 3, 5, 5, 'T'); MB.rect(g, 21, 12, 5, 4, 'T'); MB.rect(g, 23, 8, 3, 1, 'T');
  MB.stamp(g, 8, 1, ['   LLL ', '   LLL ', '   LLL ', '   LLL ', 'RRRRRRR', 'RRRRRRR', 'HWHDHWH'], true);
  MB.path(g, [[11, 8], [11, 10], [25, 10]], 1, ':');
  MB.protect(g, 6, 12, 1); MB.protect(g, 13, 9, 0);
  MB.scatter(g, ',', 14, 101); MB.scatter(g, 'F', 3, 102); MB.scatter(g, 'T', 5, 103, ['.'], [2, 4, 18, 12]); MB.scatter(g, 'b', 3, 104);
  MAPS.farol_ext = {
    name: 'Penhasco do Farol', theme: 'grass', base: '.', pad: '~',
    music: () => State.chapter >= 5 && !State.flag('fim') ? 'tower' : 'home',
    ambient: () => State.chapter >= 5 && !State.flag('fim') ? 'embers' : null,
    dark: () => State.chapter >= 5 && !State.flag('fim') ? 0.45 : 0,
    tiles: MB.rows(g),
    ents: [
      E.warp(11, 7, 'casa_farol', 5, 7, 'up', { cond: () => !(State.chapter >= 5 && !State.flag('fim')) }),
      E.warp(11, 7, 'torre1', 11, 18, 'up', { cond: () => State.chapter >= 5 && !State.flag('fim') && State.flag('torre_aberta') }),
      E.obj(11, 7, null, async S => { await finalArrival(S); }, { cond: () => State.chapter >= 5 && !State.flag('torre_aberta'), solid: true }),
      E.warp(25, 10, 'vila', 1, 12, 'right'),
      E.obj(6, 12, null, ['Uma lápide simples, coberta de flores secas: "Helena — que a luz te guie para casa."']),
      E.sign(13, 9, 'Farol de Cinzaluz. "Enquanto houver luz, haverá caminho."'),
    ],
    async onEnter(S) {
      if (State.chapter >= 5 && !S.flag('torre_aberta') && !S.flag('torre_vista')) {
        S.setFlag('torre_vista');
        await S.wait(20);
        G.shake(20, 3);
        await S.say(null, 'O farol está irreconhecível: as paredes brancas viraram pedra negra, e uma névoa púrpura escorre do topo.');
        await S.say('Lia', 'O farol... O que fizeram com ele?!');
        await S.say('Tição', 'Grrrr...');
      }
    },
  };
})();

async function finalArrival(S) {
  S.setFlag('torre_aberta');
  await S.say(null, 'Diante da porta, uma figura alta surge da névoa, com uma lanterna de chama negra na mão.');
  await S.say('Lia', 'Mestre... Aurélio?');
  await S.say('Aurélio', 'Eu pedi que não me procurasse, Lia.', { portrait: 'aurelio' });
  await S.say('Aurélio', 'Trinta anos cuidando dessa chama... enquanto o mar levava a Helena. A névoa me prometeu que, no escuro, eu poderia ouvi-la de novo.', { portrait: 'aurelio' });
  await S.say('Aurélio', 'Então eu apaguei a luz. E o Vazio me deu esta lanterna.', { portrait: 'aurelio' });
  await S.say('Nara', 'Ele não está falando por conta própria. Olhem os olhos dele... a névoa está dentro dele.');
  await S.say('Bento', 'Seu Aurélio, o senhor me ensinou a segurar um martelo! Volta pra gente!');
  await S.say('Aurélio', 'Suba, se quiser. Mas quando chegar ao topo, não haverá luz que te salve.', { portrait: 'aurelio' });
  await S.say(null, 'Aurélio se desfaz em fumaça. A porta do farol se abre sozinha, rangendo.');
  await S.say('Lia', 'Vamos subir. Pela chama... e por ele.');
  await S.say('Tição', 'Au!');
}

// ------------------------------------------------------------
//  Vila Pavio
// ------------------------------------------------------------
(function () {
  const g = MB.make(36, 26, '.');
  MB.border(g, 'T');
  MB.rect(g, 1, 1, 3, 1, 'T'); MB.rect(g, 32, 1, 3, 1, 'T'); MB.rect(g, 1, 24, 2, 1, 'T'); MB.rect(g, 33, 24, 2, 1, 'T');
  MB.path(g, [[0, 12], [35, 12]], 1, ':');
  MB.rect(g, 11, 8, 11, 7, 's', true);
  MB.house(g, 3, 2, 5, 'R');
  MB.house(g, 14, 2, 7, 'Q');
  MB.house(g, 27, 2, 5, 'R');
  MB.house(g, 3, 15, 5, 'Q');
  MB.house(g, 24, 15, 7, 'R');
  MB.path(g, [[5, 5], [5, 11]], 1, ':');
  MB.path(g, [[17, 5], [17, 7]], 1, ':');
  MB.path(g, [[29, 5], [29, 11]], 1, ':');
  MB.path(g, [[17, 15], [17, 19]], 1, ':');
  MB.path(g, [[5, 18], [5, 19], [27, 19], [27, 18]], 1, ':');
  MB.set(g, 13, 9, 'w', true); MB.set(g, 19, 9, 'z', true);
  MB.set(g, 10, 11, 'E', true); MB.set(g, 22, 13, 'E', true); MB.set(g, 31, 13, 'E', true);
  MB.set(g, 31, 16, 'j', true); MB.set(g, 32, 17, 'K', true); MB.set(g, 23, 17, 'x', true); MB.set(g, 2, 4, 'K', true); MB.set(g, 8, 4, 'x', true);
  MB.rect(g, 8, 21, 6, 1, 'f', true); MB.rect(g, 8, 24, 6, 1, 'f', true); MB.rect(g, 8, 22, 1, 2, 'f', true); MB.rect(g, 13, 22, 1, 2, 'f', true);
  MB.rect(g, 9, 22, 4, 2, 'F', true);
  for (const [x, y] of [[34, 11], [34, 13], [24, 7], [12, 14], [20, 6], [8, 17], [23, 10], [2, 13], [2, 11], [33, 12], [16, 10], [30, 21], [20, 21]]) MB.protect(g, x, y, 1);
  MB.scatter(g, ',', 30, 201); MB.scatter(g, 'F', 6, 202); MB.scatter(g, 'T', 7, 203, ['.'], [2, 20, 32, 4]); MB.scatter(g, 'b', 5, 204);
  MAPS.vila = {
    name: 'Vila Pavio', theme: 'grass', base: '.', music: 'village', pad: 'T',
    tiles: MB.rows(g),
    ents: [
      E.warp(0, 12, 'farol_ext', 24, 10, 'left'),
      E.warp(35, 12, 'campos', 1, 15, 'right'),
      E.warp(5, 4, 'loja', 5, 7, 'up'),
      E.warp(17, 4, 'casa_prefeita', 6, 8, 'up'),
      E.warp(29, 4, 'casa_tito', 4, 6, 'up'),
      E.warp(5, 17, 'casa_cida', 4, 6, 'up'),
      E.warp(27, 17, 'forja', 5, 7, 'up'),
      E.fire(16, 11),
      E.sign(2, 11, 'Vila Pavio.  Oeste: Farol de Cinzaluz.  Leste: Campos Dourados.'),
      E.sign(7, 5, 'Armazém do Seu Mané — ervas, poções e quinquilharias.'),
      E.sign(31, 18, 'Forja do Bento — armas e armaduras sob encomenda.'),
      E.npc(34, 12, 'guarda', 'Seu Tonho', async S => {
        await S.say('Seu Tonho', 'Alto lá, Lia! A Prefeita pediu pra ninguém sair da vila com essa névoa. E ela quer falar com você — casa de telhado azul, ao norte da praça.');
      }, { cond: () => !State.flag('missao'), fixed: true, dir: 'left' }),
      E.npc(34, 11, 'guarda', 'Seu Tonho', tonhoTalk, { cond: () => !!State.flag('missao'), dir: 'left', baseDir: 'left' }),
      E.npc(24, 7, 'menino', 'Tito', titoTalk, { wander: 2 }),
      E.npc(12, 14, 'velha', 'Dona Zefa', async S => {
        if (ch() >= 5) { await S.say('Dona Zefa', 'Aquela torre escura no lugar do farol... Ai, meu coração. Vai com Deus, menina.'); return; }
        await S.say('Dona Zefa', 'O Aurélio, sumido? Coitado... Desde que o mar levou a Helena, há trinta anos, ele só vivia pra aquela chama.');
        await S.say('Dona Zefa', 'Ele dizia que, enquanto a luz brilhasse, ela saberia o caminho de casa. Que coisa triste.');
      }, { wander: 2 }),
      E.npc(20, 6, 'homem', 'Seu Raimundo', async S => {
        const tips = [
          'Monstro forte demais? Descansa numa fogueira: ela cura todo mundo e ainda guarda a sua jornada.',
          'O Incenso Repelente do armazém afasta os monstros por um tempo. Bom pra quem só quer passar.',
          'Cada bicho tem uma fraqueza. Depois que você derrota um, dá pra ver a fraqueza dele na hora de mirar.',
          'Se apertar X ou Esc fora de batalha, abre o menu. Lá tem até o seu objetivo atual anotado.',
          'Defender em batalha recupera um pouquinho de PM. Às vezes compensa!',
          'Achou as batalhas lentas? Nas Opções do menu dá pra deixar a batalha mais rápida.',
        ];
        await S.say('Seu Raimundo', U.pick(tips));
      }, { wander: 2 }),
      E.npc(8, 17, 'menina', 'Lili', async S => {
        if (ch() >= 2) await S.say('Lili', 'Posso fazer carinho no Tição? ...Ele é quentinho! Parece um pãozinho saindo do forno!');
        else await S.say('Lili', 'Minha vó diz que tem um espírito morando no farol. Será que é verdade?');
        if (inParty('ticao')) await S.say('Tição', 'Au!');
      }, { wander: 2 }),
      E.npc(23, 10, 'gato', 'Gato', ['Miau.', '(O gato te ignora com elegância.)'], { wander: 3 }),
      E.npc(10, 22, 'galinha', 'Galinha', ['Có-có-có!'], { wander: 1 }),
      E.npc(12, 23, 'galinha', 'Galinha', ['Cocoricó? Não, essa é a galinha.'], { wander: 1 }),
      E.npc(2, 13, 'pescador', 'Seu Zé', async S => {
        await S.say('Seu Zé', 'Trinta anos pescando sob a luz daquele farol, e nunca vi ela apagar. Sem luz, nenhum barco sai do porto.');
      }, { fixed: true, dir: 'right' }),
    ],
    async onEnter(S) {
      if (S.flag('prologo') && !S.flag('vila_chegada')) {
        S.setFlag('vila_chegada');
        await S.wait(10);
        await S.say(null, 'Na Vila Pavio, as pessoas olham assustadas para o farol apagado. Uma névoa fina cobre os telhados.');
        await S.say('Lia', 'Preciso falar com a Prefeita Dalva. A casa dela é a de telhado azul, ao norte da praça.');
      }
      if (S.has('brasa_verde') && !S.flag('rosa_alerta')) {
        S.setFlag('rosa_alerta');
        await S.wait(10);
        await S.say('Rosa', 'Lia! Graças a Deus você voltou! O Bento está desesperado lá na forja — o Pipo, aprendiz dele, sumiu!');
        await S.say('Rosa', 'Por favor, fala com ele. A forja é a casa grande do sudeste.');
      }
    },
  };
})();

async function tonhoTalk(S) {
  if (ch() < 2) { await S.say('Seu Tonho', 'Cuidado lá fora, Lia. Os Campos Dourados estão cheios de bichos estranhos desde ontem à noite.'); return; }
  const q = S.flag('q_javali');
  if (!q) {
    await S.say('Seu Tonho', 'Ouvi dizer que você está juntando as brasas do farol. Sabe o que mais? Um Javali-Rei anda destruindo as plantações no sudeste dos Campos.');
    await S.say('Seu Tonho', 'Se der conta dele, a guarda paga 300 moedas. E eu te dou uma lembrancinha.');
    S.quest('javali', 'active');
  } else if (q === 'active' && S.flag('javali_vencido')) {
    await S.say('Seu Tonho', 'Você derrubou o Javali-Rei?! Os fazendeiros vão fazer até festa! Toma, como prometido.');
    await S.gold(300);
    await S.give('presa_javali');
    S.quest('javali', 'done');
  } else if (q === 'active') await S.say('Seu Tonho', 'O Javali-Rei foi visto no canto sudeste dos Campos Dourados. Vá preparada, ele é bravo!');
  else await S.say('Seu Tonho', 'A vila está mais segura graças a você, Lia.');
}

async function titoTalk(S) {
  let q = S.flag('q_osso');
  if (q !== 'done' && S.has('osso_brinquedo')) q = 'active';
  if (ch() < 3 && !q) {
    await S.say('Tito', 'Esse cachorrinho é seu? Que máscara irada! Ele é um cachorro-caveira?');
    if (inParty('ticao')) { S.sfx('bark'); await S.say('Tição', 'Au!'); await S.say('Tito', 'Ele respondeu! Haha!'); }
    return;
  }
  if (!q) {
    await S.say('Tito', 'Lia... meu osso de brinquedo caiu do cais! O Seu Jonas disse que a correnteza leva tudo pro Charco das Lamúrias.');
    await S.say('Tito', 'Se você achar ele por lá... traz pra mim? Por favorzinho?');
    S.quest('osso', 'active');
  } else if (q === 'active' && S.has('osso_brinquedo')) {
    await S.say('Tito', 'Meu osso!! Você achou! Obrigado, obrigado!');
    S.take('osso_brinquedo');
    await S.say('Tito', 'Olha... O Tição gostou dele, né? Então leva esse aqui. Meu vô achou na praia, é de ouro de verdade!');
    await S.give('osso_dourado');
    await S.say(null, '(O Osso Dourado é uma arma para o Tição. Equipe pelo menu.)');
    S.quest('osso', 'done');
  } else if (q === 'active') await S.say('Tito', 'O osso deve estar em algum lugar do Charco das Lamúrias... Ele é bem branquinho!');
  else await S.say('Tito', 'Quando eu crescer, quero ser guardião de farol igual a você, Lia!');
}

// ------------------------------------------------------------
//  Interiores da vila
// ------------------------------------------------------------
MAPS.loja = {
  name: 'Armazém do Seu Mané', theme: 'indoor', base: '_', music: 'village', pad: '#',
  tiles: [
    '###########',
    '#kk#VV#kxx#',
    '#_________#',
    '#ccccc____#',
    '#_________#',
    '#____mm___#',
    '#K___mm__K#',
    '#____mm___#',
    '#####D#####',
  ],
  ents: [
    E.warp(5, 8, 'vila', 5, 5, 'down'),
    E.npc(3, 2, 'mercador', 'Seu Mané', async S => {
      await S.say('Seu Mané', ch() >= 2 ? 'Chegou mercadoria nova! Dá uma olhada.' : 'Bem-vinda, Lia! Ervas, antídotos, tudo pra uma boa viagem.');
      await S.shop('armazem');
    }, { fixed: true }),
    E.npc(8, 4, 'menina', 'Freguesa', ['Dizem que o Incenso Repelente espanta até sogra. Hihi.'], { wander: 1 }),
  ],
};

MAPS.casa_prefeita = {
  name: 'Casa da Prefeita', theme: 'indoor', base: '_', music: 'village', pad: '#',
  tiles: [
    '#############',
    '#kk#q#kkk#VV#',
    '#___________#',
    '#__ttt______#',
    '#___________#',
    '#_______mmm_#',
    '#K______mmm_#',
    '#___________#',
    '#___________#',
    '######D######',
  ],
  ents: [
    E.warp(6, 9, 'vila', 17, 5, 'down'),
    E.npc(4, 4, 'prefeita', 'Prefeita Dalva', prefeitaTalk, { fixed: true }),
    E.chest(11, 7, 'pocao', 2),
  ],
};

async function prefeitaTalk(S) {
  if (!S.flag('missao')) {
    await S.say('Prefeita Dalva', 'Lia! Graças aos céus você está bem. A névoa desceu sobre os campos esta noite... O farol se apagou, não foi?');
    await S.say('Lia', 'Apagou. E Mestre Aurélio sumiu. Encontrei esse filhote nas cinzas da chama... e quatro faíscas saíram voando.');
    S.sfx('bark'); await S.say('Tição', 'Au!');
    await S.say('Prefeita Dalva', 'Um espírito de chama... Então a lenda é verdadeira. A Chama Eterna nasceu da união de quatro *Brasas Primordiais*: da Mata, da Pedra, da Água e do Gelo.');
    await S.say('Prefeita Dalva', 'Se elas se espalharam, devem ter voltado para onde nasceram: a *Floresta Sussurrante* ao norte, as *Minas de Ferrugem* a leste, o *Charco das Lamúrias* ao sul e o *Pico do Silêncio* no nordeste.');
    if (S.has('carta_aurelio')) {
      await S.say('Lia', 'E tem isso... um bilhete do Mestre.');
      await S.say('Prefeita Dalva', '"Não procure por mim"...? Isso não é do feitio do Aurélio. Ele nunca deixaria aquela chama por nada nesse mundo.');
    }
    await S.say('Prefeita Dalva', 'Comece pela floresta. Uma erveira chamada *Nara* vive lá — ela conhece cada raiz daquele lugar.');
    await S.say('Prefeita Dalva', 'Leve isto. E passe no armazém e na forja antes de partir. A fogueira da praça também vai te fazer bem.');
    await S.gold(100);
    await S.give('erva', 3);
    S.setFlag('missao');
    await S.say(null, '(O objetivo atual fica anotado no menu — X ou Esc.)');
    return;
  }
  const lines = {
    1: 'A Floresta Sussurrante fica ao norte dos Campos Dourados. Procure a erveira Nara.',
    2: S.flag('bento') ? 'As Minas de Ferrugem ficam no extremo leste dos Campos. Tragam o Pipo de volta!' : 'Uma das brasas! Estou orgulhosa. Mas o Bento está procurando por você, parece aflito.',
    3: 'Para chegar ao Charco das Lamúrias, fale com Seu Jonas, o barqueiro, no cais ao sul dos Campos.',
    4: 'O Pico do Silêncio fica além do rio, no nordeste. A ponte caiu há anos... mas com o Bento, quem sabe?',
    5: 'As quatro brasas! Vá ao farol, Lia. E traga o Aurélio de volta para nós.',
  };
  await S.say('Prefeita Dalva', lines[Math.min(5, ch())] || lines[1]);
}

MAPS.casa_tito = {
  name: 'Casa do Tito', theme: 'indoor', base: '_', music: 'village', pad: '#',
  tiles: [
    '##########',
    '#kq##VV#k#',
    '#________#',
    '#B__tt___#',
    '#B_______#',
    '#____mm__#',
    '#K___mm__#',
    '####D#####',
  ],
  ents: [
    E.warp(4, 7, 'vila', 29, 5, 'down'),
    E.npc(6, 4, 'mulher', 'Dona Lúcia', async S => {
      await S.say('Dona Lúcia', 'O Tito não para de falar do seu cachorrinho de caveira. Esse menino!');
      if (ch() >= 3) await S.say('Dona Lúcia', 'E agora vive chorando pelo tal osso de brinquedo que caiu do cais...');
    }, { wander: 1 }),
    E.chest(8, 2, 'antidoto', 3),
  ],
};

MAPS.casa_cida = {
  name: 'Casa de Dona Cida', theme: 'indoor', base: '_', music: 'village', pad: '#',
  tiles: [
    '##########',
    '#kq##VV#k#',
    '#________#',
    '#B__tt___#',
    '#B_______#',
    '#____mm__#',
    '#K___mm__#',
    '####D#####',
  ],
  ents: [
    E.warp(4, 7, 'vila', 5, 18, 'down'),
    E.npc(6, 4, 'cida', 'Dona Cida', async S => {
      const q = S.flag('q_anel');
      if (!q) {
        await S.say('Dona Cida', 'Ai, Lia... Fui colher amoras na Floresta Sussurrante e meu anel de noivado escorregou do dedo. Foi numa clareira, lá pro noroeste da mata.');
        await S.say('Dona Cida', 'Com essa névoa, não tenho coragem de voltar. Se você passar por lá... procura pra mim? Ele brilha no sol.');
        S.quest('anel', 'active');
      } else if (q === 'active' && S.has('anel_cida')) {
        await S.say('Dona Cida', 'Meu anel!! Ai, menina, você não sabe o que isso significa pra mim. Cinquenta anos de casada!');
        S.take('anel_cida');
        await S.say('Dona Cida', 'Toma, leva esse aqui. Era do meu marido, dizem que dá vigor a quem usa.');
        await S.give('anel_vigor');
        await S.gold(80);
        S.quest('anel', 'done');
      } else if (q === 'active') await S.say('Dona Cida', 'O anel deve estar numa clareira a noroeste da Floresta Sussurrante. Procure um brilho no chão.');
      else await S.say('Dona Cida', 'Toda vez que olho pro anel, lembro de você. Obrigada, querida.');
    }, { wander: 1 }),
  ],
};

MAPS.forja = {
  name: 'Forja do Bento', theme: 'indoor', base: '_', music: 'village', pad: '#',
  tiles: [
    '############',
    '#jj#xx#kK#j#',
    '#__________#',
    '#_cccc_____#',
    '#__________#',
    '#_x___mm___#',
    '#_____mm__K#',
    '#__________#',
    '#####D######',
  ],
  ents: [
    E.warp(5, 8, 'vila', 27, 18, 'down'),
    E.npc(3, 2, 'mulher', 'Rosa', async S => {
      await S.say('Rosa', S.flag('bento') ? 'O Bento está com vocês? Então cuidem dele, viu? E comprem alguma coisa, que a forja não para!' : 'Bem-vinda à forja! O que vai ser hoje?');
      await S.shop('forja');
    }, { fixed: true }),
    E.npc(8, 3, 'bento', 'Bento', bentoTalk, { cond: () => !inParty('bento') }),
    E.npc(9, 5, 'pipo', 'Pipo', async S => {
      await S.say('Pipo', 'Mestre Bento me deixou cuidando do fole enquanto vocês viajam. Ninguém vai sair daqui com espada torta!');
    }, { cond: () => !!State.flag('pipo_salvo') }),
  ],
};

async function bentoTalk(S) {
  if (!S.has('brasa_verde')) {
    await S.say('Bento', 'Opa, Lia! Soube do farol... Coisa feia. Se precisar de arma ou armadura, fala com a Rosa no balcão. Eu tô aqui batendo umas ferraduras.');
    return;
  }
  await S.say('Bento', 'Lia! O Pipo, meu aprendiz... Mandei o moleque buscar minério nas Minas de Ferrugem ontem à tarde. Ele não voltou.');
  await S.say('Bento', 'E dizem que a névoa desceu pras minas. Eu vou atrás dele nem que seja sozinho!');
  await S.say('Lia', 'Você não vai sozinho. A Brasa Azul deve estar lá também — o Tição está farejando para o leste desde que voltamos.');
  S.sfx('bark'); await S.say('Tição', 'Au! Au!');
  await S.say('Nara', 'Um braço forte a mais não faz mal a ninguém.');
  await S.say('Bento', '...Então tá decidido. Toma, a chave do portão da mina. E pode contar com esse braço aqui!');
  await S.give('chave_mina');
  await S.join('bento');
  S.setFlag('bento');
  await S.say('Rosa', 'Bento! Traz o Pipo de volta. E volta você também, viu?');
  await S.say(null, '(As Minas de Ferrugem ficam no extremo leste dos Campos Dourados.)');
}

// ------------------------------------------------------------
//  Campos Dourados
// ------------------------------------------------------------
(function () {
  const g = MB.make(44, 34, '.');
  MB.border(g, 'T');
  MB.rect(g, 7, 28, 30, 1, ';');
  MB.rect(g, 6, 29, 32, 5, '~');
  MB.rect(g, 35, 0, 2, 12, '~');
  MB.rect(g, 35, 10, 9, 2, '~');
  MB.path(g, [[0, 15], [43, 15]], 1, ':');
  MB.path(g, [[21, 0], [21, 27]], 1, ':');
  MB.path(g, [[21, 28], [21, 30]], 1, '|');
  MB.path(g, [[30, 15], [30, 5], [34, 5]], 1, ':');
  MB.rect(g, 35, 5, 2, 1, '=', true);
  MB.path(g, [[37, 5], [43, 5]], 1, ':');
  // fazendinha
  MB.rect(g, 3, 3, 9, 1, 'f', true); MB.rect(g, 3, 9, 9, 1, 'f', true); MB.rect(g, 3, 3, 1, 7, 'f', true); MB.rect(g, 11, 3, 1, 7, 'f', true);
  MB.rect(g, 4, 4, 7, 5, '"', true); MB.set(g, 7, 9, ':', true);
  MB.path(g, [[7, 10], [7, 14]], 1, ':');
  for (const [x, y] of [[20, 27], [38, 24], [22, 14], [31, 6], [40, 2], [4, 21], [8, 12], [26, 20], [14, 19], [33, 26], [16, 7], [1, 14], [1, 16]]) MB.protect(g, x, y, 1);
  MB.scatter(g, 'T', 70, 301); MB.scatter(g, 'b', 18, 302); MB.scatter(g, 'r', 8, 303); MB.scatter(g, '"', 60, 304); MB.scatter(g, ',', 40, 305); MB.scatter(g, 'F', 6, 306);
  MAPS.campos = {
    name: 'Campos Dourados', theme: 'grass', base: '.', music: 'field', pad: 'T', bg: 'field',
    encounters: () => State.chapter >= 2 ? 'campos2' : 'campos', rate: [20, 34],
    tiles: MB.rows(g),
    ents: [
      E.warp(0, 15, 'vila', 34, 12, 'left'),
      E.warp(21, 0, 'floresta1', 20, 32, 'up'),
      E.warp(43, 15, 'minas1', 1, 13, 'right'),
      E.warp(43, 5, 'pico1', 15, 38, 'up'),
      E.sign(22, 14, '↑ Floresta Sussurrante   → Minas de Ferrugem   ↓ Cais   ← Vila Pavio'),
      E.sign(31, 6, 'Pico do Silêncio →  (Cuidado: ponte sobre o rio)'),
      E.npc(20, 27, 'barqueiro', 'Seu Jonas', jonasTalk, { fixed: true, dir: 'down' }),
      E.obj(21, 31, 'raft', ['A balsa de Seu Jonas balança na água.'], { cond: () => !!State.flag('balsa') }),
      E.obj(35, 5, null, ponteTalk, { tile: 'h', cond: () => !State.flag('ponte') }),
      E.obj(36, 5, null, ponteTalk, { tile: 'h', cond: () => !State.flag('ponte') }),
      { type: 'boss', x: 38, y: 24, enemy: 'javali_rei', scale: 1.5, cond: () => State.flag('q_javali') === 'active' && !State.flag('javali_vencido'), talk: async S => {
        await S.say(null, 'Um javali gigantesco, com presas de marfim e crina eriçada, bufa e raspa o chão!');
        await S.say('Bento', ch() >= 3 ? 'Esse aí é o Javali-Rei! Segura firme!' : 'Que bicho enorme!');
        await S.battle(['javali_rei', 'javali'], { boss: true, bg: 'field' });
        S.setFlag('javali_vencido');
        await S.say(null, 'O Javali-Rei foge para dentro do mato, derrotado. Seu Tonho vai gostar de saber.');
      } },
      E.chest(40, 2, 650),
      E.chest(4, 21, 'eter'),
      E.chest(16, 7, 'incenso', 2),
      ...trigLine(1, [14, 15, 16], async S => {
        await S.say(null, 'Tição levanta o focinho e fareja o vento. A máscara brilha de leve quando ele olha para o norte.');
        await S.say('Lia', 'A brasa verde está na floresta, não é? Vamos lá, Tição.');
      }, 'campos_intro', { cond: () => State.chapter === 1 }),
    ],
  };
})();

async function jonasTalk(S) {
  if (!S.flag('balsa')) {
    await S.say('Seu Jonas', 'Atravessar o lago? A balsa rachou no meio quando aquelas criaturas da névoa subiram nela. Sem conserto, não levo ninguém pro Charco.');
    if (ch() >= 3 && inParty('bento')) {
      await S.say('Bento', 'Deixa comigo, Seu Jonas! Martelo, prego e um pouco de piche resolvem.');
      await S.fadeOut(20);
      for (let i = 0; i < 3; i++) { S.sfx('hit'); await S.wait(18); }
      await S.fadeIn(20);
      await S.say('Seu Jonas', 'Rapaz, ficou melhor que nova! Querem ir pro Charco das Lamúrias agora? Cuidado, lá a névoa é grossa e a água queima a pele.');
      S.setFlag('balsa');
    } else return;
  }
  const c = await S.ask('Atravessar o lago até o Charco das Lamúrias?', ['Sim', 'Agora não'], 'Seu Jonas');
  if (c === 0) { S.sfx('door'); await S.warp('charco1', 4, 30, 'right'); }
}

async function ponteTalk(S) {
  if (ch() >= 4) {
    await S.say('Bento', 'Agora sim! Com as tábuas de madeira-de-lei que trouxemos das ruínas, essa ponte fica de pé rapidinho.');
    await S.fadeOut(20);
    for (let i = 0; i < 4; i++) { S.sfx('hit'); await S.wait(16); }
    S.setFlag('ponte');
    await S.fadeIn(20);
    await S.say('Lia', 'Perfeito, Bento! Rumo ao Pico do Silêncio.');
    return;
  }
  await S.say(null, 'A ponte desabou. A correnteza do rio é forte demais para atravessar a nado.');
  if (inParty('bento')) await S.say('Bento', 'Eu conserto isso, mas preciso de madeira boa, de lei, que aguente água. Aqui nos campos não tem nada assim.');
}

// ------------------------------------------------------------
//  Floresta Sussurrante
// ------------------------------------------------------------
(function () {
  const g = MB.make(40, 34, 'T');
  MB.path(g, [[20, 33], [20, 25]], 3);
  MB.ellipse(g, 20, 21, 5, 4, '.');
  MB.path(g, [[15, 21], [11, 21]], 3);
  MB.ellipse(g, 7, 20, 4.5, 3.5, '.');
  MB.house(g, 5, 13, 5, 'R');
  MB.rect(g, 5, 16, 5, 1, '.', true);
  MB.path(g, [[25, 21], [28, 21]], 3);
  MB.rect(g, 27, 16, 9, 10, '.', true);
  MB.path(g, [[20, 17], [20, 15]], 3);
  MB.rect(g, 20, 13, 1, 1, '.', true);
  MB.path(g, [[20, 11], [20, 1]], 3);
  MB.path(g, [[20, 1], [20, 0]], 3);
  MB.ellipse(g, 13, 6, 3.5, 2.5, '.');
  MB.path(g, [[16, 6], [19, 6]], 3);
  MB.ellipse(g, 27, 5, 3.5, 2.5, '.');
  MB.path(g, [[21, 5], [24, 5]], 3);
  MB.path(g, [[11, 18], [11, 11], [8, 9]], 2);
  MB.ellipse(g, 7, 8, 3, 2.5, '.');
  MB.scatter(g, '"', 40, 401, ['.']); MB.scatter(g, ',', 25, 402, ['.']); MB.scatter(g, 'F', 6, 403, ['.']);
  MB.scatter(g, 'M', 6, 404, ['T']); MB.scatter(g, 'b', 10, 405, ['T']);
  MAPS.floresta1 = {
    name: 'Floresta Sussurrante', theme: 'forest', base: '.', music: 'forest', pad: 'T', bg: 'forest', ambient: 'fireflies',
    encounters: 'floresta', rate: [18, 30],
    tiles: MB.rows(g),
    ents: [
      E.warp(19, 33, 'campos', 21, 1, 'down'), E.warp(20, 33, 'campos', 21, 1, 'down'), E.warp(21, 33, 'campos', 21, 1, 'down'),
      E.warp(19, 0, 'floresta2', 15, 24, 'up'), E.warp(20, 0, 'floresta2', 15, 24, 'up'), E.warp(21, 0, 'floresta2', 15, 24, 'up'),
      { type: 'gate', x: 20, y: 13, look: 'vines', open: () => !!State.flag('f1_pedras'), talk: async S => {
        await S.say(null, 'Uma muralha de espinhos negros fecha a passagem. Não dá para atravessar.');
        if (inParty('nara')) await S.say('Nara', 'Os espinhos dos antigos. Eles cedem quando as duas pedras da clareira leste estão sobre os altares.');
      } },
      E.obj(28, 17, 'sign', async S => {
        await S.say(null, 'Uma pedra entalhada: "Duas pedras, dois altares. Os espinhos só cedem ao peso."');
        if (S.flag('f1_pedras')) return;
        const c = await S.ask('Recolocar as pedras na posição original?', ['Sim', 'Não']);
        if (c === 0) { for (const b of World.map.ents.filter(e => e.type === 'boulder')) { b.x = b.homeX; b.y = b.homeY; b.px = b.x * TS; b.py = b.y * TS; } S.sfx('push'); }
      }),
      { type: 'boulder', x: 29, y: 21, group: 'f1_pedras' }, { type: 'plate', x: 29, y: 18, group: 'f1_pedras' },
      { type: 'boulder', x: 32, y: 23, group: 'f1_pedras' }, { type: 'plate', x: 34, y: 23, group: 'f1_pedras' },
      E.npc(7, 19, 'nara', 'Nara', null, { cond: () => !State.flag('nara'), fixed: true }),
      { type: 'boss', x: 5, y: 21, enemy: 'lobo_nevoa', scale: 1.5, cond: () => !State.flag('nara') },
      { type: 'boss', x: 9, y: 21, enemy: 'lobo_nevoa', scale: 1.5, cond: () => !State.flag('nara') },
      ...trigLine(13, [20, 21, 22], naraEvent, 'nara_evento'),
      E.obj(7, 15, null, ['A cabana de Nara. Cheira a hortelã, alecrim e chá de camomila.']),
      E.chest(10, 18, 'pocao', 2),
      { type: 'sparkle', x: 6, y: 8, flag: 'anel_achado', item: 'anel_cida', cond: () => State.flag('q_anel') === 'active' && !State.flag('anel_achado') },
      E.chest(12, 5, 120), E.chest(29, 4, 'eter'), E.chest(35, 25, 'presa_prata'),
    ],
  };
})();

async function naraEvent(S) {
  await S.say('???', 'Xô! Xô, bichos! Saiam daqui!', { portrait: 'nara' });
  await S.emote('player', '!');
  await S.say(null, 'Uma moça de vestido verde se defende de dois lobos de névoa com um cajado.');
  await S.say('Nara', 'Ei, vocês aí! Uma ajudinha cairia muito bem agora!');
  await S.say('Lia', 'Aguenta firme! Tição, vamos!');
  await S.battle(['lobo_nevoa', 'lobo_nevoa'], { bg: 'forest', intro: 'Lobos da Névoa atacam!', canFlee: false });
  S.setFlag('nara');
  await S.say('Nara', 'Ufa... Obrigada. Esses lobos eram mansos até ontem. Desde que a névoa desceu, a mata inteira adoeceu.');
  await S.say('Nara', 'Eu sou Nara, cuido das ervas desta floresta. E você deve ser a menina do farol. E esse aí...?');
  S.sfx('bark'); await S.say('Tição', 'Au!');
  await S.say('Nara', 'Um espírito de chama usando o crânio de um guardião antigo. Faz séculos que ninguém vê um desses.');
  await S.say('Lia', 'A chama do farol se partiu em quatro brasas. Uma delas veio para cá.');
  await S.say('Nara', 'Então foi isso que caiu no Bosque Antigo esta noite. A Raiz-Mãe, a árvore mais velha da mata, não para de gemer desde então.');
  await S.say('Nara', 'O caminho para o bosque está fechado por espinhos. Eles cedem se as duas pedras da clareira leste estiverem sobre os altares.');
  await S.say('Nara', 'Vou com vocês. Alguém precisa remendar os arranhões.');
  await S.join('nara');
  await S.say(null, '(Nara cura o grupo com Bálsamo. Habilidades de cura também podem ser usadas pelo menu.)');
}

(function () {
  const g = MB.make(30, 26, 'T');
  MB.path(g, [[15, 25], [15, 20]], 3);
  MB.ellipse(g, 15, 18, 4, 2.5, '.');
  MB.path(g, [[11, 17], [6, 17], [6, 10], [14, 10]], 2);
  MB.path(g, [[19, 17], [25, 17], [25, 13]], 2);
  MB.ellipse(g, 25, 12, 2.5, 2, '.');
  MB.path(g, [[14, 10], [24, 10], [24, 6], [21, 6]], 2);
  MB.ellipse(g, 15, 5, 6, 3.5, '.');
  MB.path(g, [[6, 10], [3, 10], [3, 7]], 2);
  MB.ellipse(g, 3, 6, 2, 2, '.');
  MB.scatter(g, '"', 30, 411, ['.']); MB.scatter(g, ',', 15, 412, ['.']); MB.scatter(g, 'M', 8, 413, ['T']);
  MAPS.floresta2 = {
    name: 'Bosque Antigo', theme: 'forest', base: '.', music: 'forest', pad: 'T', bg: 'forest', ambient: 'fireflies', dark: 0.3,
    encounters: 'bosque', rate: [16, 28],
    tiles: MB.rows(g),
    ents: [
      E.warp(14, 25, 'floresta1', 20, 1, 'down'), E.warp(15, 25, 'floresta1', 20, 1, 'down'), E.warp(16, 25, 'floresta1', 20, 1, 'down'),
      E.fire(17, 17),
      E.chest(25, 11, 'pocao', 2), E.chest(3, 5, 'cajado_carvalho'), E.chest(12, 18, 'erva', 4),
      ...trigLine(21, [6, 7], raizFight, 'raiz_intro'),
      { type: 'boss', x: 15, y: 3, enemy: 'raiz_mae', scale: 1.5, cond: () => !State.flag('raiz_vencida'), talk: raizFight },
      E.block(14, 3, () => !State.flag('raiz_vencida')), E.block(16, 3, () => !State.flag('raiz_vencida')),
    ],
    async onEnter(S) {
      if (!S.flag('f2_intro')) { S.setFlag('f2_intro'); await S.wait(10); await S.say('Nara', 'O Bosque Antigo. Sintam como o ar está pesado... A Raiz-Mãe está ao norte. Descansem na fogueira antes.'); }
    },
  };
})();

async function raizFight(S) {
  if (S.flag('raiz_vencida')) return;
  await S.say(null, 'No centro do bosque, uma árvore colossal pulsa com veias roxas. Uma faísca verde brilha presa entre seus galhos.');
  await S.say('Nara', 'A Raiz-Mãe... A névoa entrou nela. Ela não nos reconhece mais.');
  S.sfx('roar'); G.shake(20, 5);
  await S.say('Tição', 'Grrrrr!');
  await S.say('Lia', 'Desculpe, velha árvore. A gente vai te libertar!');
  await S.battle(['raiz_mae'], { boss: true, bg: 'forest' });
  S.setFlag('raiz_vencida');
  await S.say(null, 'As veias roxas se desfazem em fumaça. A Raiz-Mãe suspira, e suas folhas voltam a ficar verdes.');
  S.sfx('ember'); G.flash('#5aff8a', 20);
  await S.say(null, 'A faísca verde desce flutuando até a máscara de Tição.');
  await S.give('brasa_verde');
  await S.say('Tição', 'Auuuu!');
  await S.say('Nara', 'Uma de quatro. A mata está respirando de novo... dá para sentir daqui.');
  S.chapter(2);
  await S.say('Nara', 'Conheço um atalho até os Campos. Vamos voltar para a vila, vocês precisam descansar.');
  await S.warp('campos', 21, 2, 'down');
}
