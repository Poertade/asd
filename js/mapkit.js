'use strict';
// ============================================================
//  Construtor de mapas + missões + objetivo atual
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

// atalhos para entidades
const E = {
  warp: (x, y, to, tx, ty, dir, extra) => Object.assign({ type: 'warp', x, y, to, tx, ty, dir }, extra || {}),
  npc: (x, y, sprite, name, talk, extra) => Object.assign({ type: 'npc', x, y, sprite, name, talk }, extra || {}),
  chest: (x, y, item, n, extra) => Object.assign({ type: 'chest', x, y }, typeof item === 'number' ? { gold: item } : { item, n: n || 1 }, extra || {}),
  sign: (x, y, text) => ({ type: 'sign', x, y, text }),
  fire: (x, y, extra) => Object.assign({ type: 'bonfire', x, y }, extra || {}),
  trig: (x, y, script, once, extra) => Object.assign({ type: 'trigger', x, y, script, once }, extra || {}),
  block: (x, y, cond) => ({ type: 'block', x, y, cond }),
  obj: (x, y, obj, talk, extra) => Object.assign({ type: 'obj', x, y, obj, talk }, extra || {}),
};
// gatilhos em faixa (para corredores largos)
function trigLine(xs, ys, script, once, extra) {
  const out = [];
  for (const x of [].concat(xs)) for (const y of [].concat(ys)) out.push(E.trig(x, y, script, once, extra));
  return out;
}

// retratos por nome de quem fala
Object.assign(PORTRAIT_FOR, {
  'Tição': 'ticao', 'Lia': 'lia', 'Nara': 'nara', 'Bento': 'bento', 'Aurélio': 'aurelio', 'Prefeita Dalva': 'prefeita',
  'Pipo': 'pipo', 'Vó Quitéria': 'quiteria', 'Seu Jonas': 'barqueiro', 'Tito': 'menino', 'Dona Cida': 'cida', 'Rosa': 'mulher',
  'Seu Tonho': 'guarda', 'Monge Bóris': 'monge', 'Mascate Fantasma': 'fantasma', '???': null,
});

const QUESTS = {
  anel: { title: 'O anel de Dona Cida', desc: 'Dona Cida perdeu o anel de noivado na Floresta Sussurrante, perto de uma clareira a noroeste. Procure um brilho no chão.' },
  javali: { title: 'O Javali-Rei', desc: 'Seu Tonho, o guarda, paga bem a quem derrotar o Javali-Rei, visto no canto sudeste dos Campos Dourados.' },
  osso: { title: 'O osso do Tito', desc: 'O osso de brinquedo do Tito foi parar no Charco das Lamúrias, levado pela correnteza.' },
  cogumelos: { title: 'Cogumelos Lunares', desc: 'Vó Quitéria, no Charco, precisa de 5 Cogumelos Lunares. Eles brilham no chão do charco e das ruínas.' },
  guardiao: { title: 'O Guardião Esquecido', desc: 'O Monge Bóris fala de um guardião antigo que dorme numa caverna de gelo no Cume. O caminho é escondido no gelo, a oeste.' },
};

function currentObjective() {
  const f = k => State.flag(k), h = k => State.has(k);
  if (!f('prologo')) return 'Suba até a sala da lanterna do farol e descubra o que aconteceu com a chama.';
  if (!f('missao')) return 'Vá até a Vila Pavio, a leste do farol, e fale com a Prefeita Dalva (casa de telhado azul).';
  if (!h('brasa_verde')) return f('nara') ? 'Atravesse a Floresta Sussurrante e encontre a Brasa Verde no Bosque Antigo, ao norte.' : 'Siga para a Floresta Sussurrante, ao norte dos Campos Dourados.';
  if (!f('bento')) return 'Volte à Vila Pavio. Algo aconteceu com o aprendiz do ferreiro Bento.';
  if (!h('brasa_azul')) return f('pipo_salvo') ? 'Desça até o Coração da Mina e recupere a Brasa Azul.' : 'Entre nas Minas de Ferrugem (leste dos Campos), encontre Pipo e a Brasa Azul.';
  if (!f('balsa')) return 'Fale com Seu Jonas, o barqueiro, no cais ao sul dos Campos Dourados.';
  if (!h('brasa_violeta')) return f('lanternas') ? 'A névoa se abriu. Siga para as Ruínas Afundadas, ao norte do Charco.' : 'Acenda as três lanternas do Charco das Lamúrias para dissipar a névoa.';
  if (!f('ponte')) return 'Atravesse o rio no nordeste dos Campos Dourados rumo ao Pico do Silêncio.';
  if (!h('brasa_branca')) return 'Escale o Pico do Silêncio e encontre a Brasa Branca no cume.';
  if (!f('torre_aberta')) return 'Leve as quatro brasas de volta ao Farol.';
  if (!f('vazio_vencido')) return 'Suba o Farol de Cinzas até o topo e enfrente quem apagou a chama.';
  return 'A luz voltou. Aproveite o dia!';
}
