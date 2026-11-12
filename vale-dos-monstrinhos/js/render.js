'use strict';
// ============================================================
//  Desenho do mundo e HUD
// ============================================================

const SoilArt = {
  c: {},
  get(kind) {
    if (this.c[kind]) return this.c[kind];
    const p = new PixelArt(16, 16);
    const base = kind === 'wet' ? '#5a3a22' : '#8a5a34', dark = shade(base, -0.25), lite = shade(base, 0.18);
    p.rect(1, 1, 14, 14, base);
    for (let y = 3; y < 15; y += 4) { p.rect(2, y, 12, 1, dark); p.rect(2, y - 1, 12, 1, lite); }
    p.rect(1, 1, 14, 1, lite); p.rect(1, 14, 14, 1, dark);
    if (kind === 'fert') { p.d.fill(null); for (const [x, y] of [[3, 4], [10, 6], [6, 11], [12, 12], [4, 8]]) { p.set(x, y, '#c8b878'); p.set(x + 1, y, '#a89858'); } }
    return (this.c[kind] = p.toCanvas());
  },
};

function drawWorld() {
  const W2 = World, m = W2.map, cam = W2.cam;
  ctx.imageSmoothingEnabled = false;
  const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
  const x1 = Math.ceil((cam.x + VIEW_W) / TS), y1 = Math.ceil((cam.y + VIEW_H) / TS);
  // chão
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const ch = W2.tile(x, y); if (ch === null) continue;
    const td = TILE_DEFS[ch]; if (!td) continue;
    const sx = x * TS - cam.x, sy = y * TS - cam.y;
    const variant = (x * 7 + y * 13) % 4;
    if (td.over) ctx.drawImage(Tiles.get(m.under[x + ',' + y] || m.base, m.theme, (x * 3 + y * 5) % 4, 0), sx, sy, TS, TS);
    const fr = td.anim ? Math.floor(G.frame / 28 + (x + y) * 0.3) % td.anim : 0;
    ctx.drawImage(Tiles.get(ch, m.theme, variant, fr), sx, sy, TS, TS);
  }
  // terra preparada
  if (m.id === 'fazenda') for (const [k, s] of Object.entries(State.soil)) {
    const [x, y] = k.split(',').map(Number);
    if (x < x0 - 1 || x > x1 || y < y0 - 1 || y > y1) continue;
    const sx = x * TS - cam.x, sy = y * TS - cam.y;
    ctx.drawImage(SoilArt.get(s.wet ? 'wet' : 'dry'), sx, sy, TS, TS);
    if (s.fert) ctx.drawImage(SoilArt.get('fert'), sx, sy, TS, TS);
  }
  // lista ordenada por profundidade
  const L = [];
  for (const [k, o] of Object.entries(m.objs)) {
    const [x, y] = k.split(',').map(Number);
    if (x < x0 - 1 || x > x1 || y < y0 - 1 || y > y1 + 2) continue;
    L.push({ y: y * TS + TS - (o.k === 'ladder' || o.k === 'forage' ? 30 : 2), f: () => drawObj(o, x, y) });
  }
  if (m.id === 'fazenda') for (const [k, s] of Object.entries(State.soil)) {
    if (!s.crop) continue;
    const [x, y] = k.split(',').map(Number);
    if (x < x0 - 1 || x > x1 || y < y0 - 1 || y > y1 + 1) continue;
    L.push({ y: y * TS + TS - 3, f: () => drawCrop(s.crop, x, y) });
  }
  for (const f of m.fixed) if (f.type !== 'warp' && f.type !== 'door' && f.type !== 'bed' && f.type !== 'barn') L.push({ y: (f.y + (f.h || 1)) * TS - 1, f: () => drawFixed(f) });
  for (const e of W2.ents) L.push({ y: e.y, f: () => drawEnt(e) });
  for (const d of W2.drops) L.push({ y: d.y + 10, f: () => { const sx = d.x - cam.x, sy = d.y - cam.y; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sx, sy + 12, 10, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(Icons.get(d.id), sx - 16, sy - 16 - d.z + Math.sin((G.frame + d.x) / 12) * 2, 32, 32); } });
  L.push({ y: W2.p.y + 0.5, f: drawPlayer });
  L.sort((a, b) => a.y - b.y);
  for (const it of L) it.f();
  // projéteis, partículas, números
  for (const q of W2.projs) { ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x - cam.x, q.y - cam.y, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x - cam.x - 2, q.y - cam.y - 2, 2.5, 0, 7); ctx.fill(); }
  for (const q of W2.parts) { ctx.globalAlpha = Math.min(1, q.life / 10); ctx.fillStyle = q.c; ctx.fillRect(q.x - cam.x - q.s / 2, q.y - cam.y - q.s / 2, q.s, q.s); }
  ctx.globalAlpha = 1;
  // pesca
  if (W2.fishing) {
    const f = W2.fishing, p = W2.p;
    const bx = f.bx - cam.x, by = f.by - cam.y + Math.sin(G.frame / 10) * 2 + (f.st === 'bite' ? Math.sin(G.frame) * 4 : 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x - cam.x + DIRV[p.dir][0] * 20, p.y - cam.y - 40); ctx.quadraticCurveTo((p.x + f.bx) / 2 - cam.x, Math.min(p.y, f.by) - cam.y - 30, bx, by); ctx.stroke();
    ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 5, by - 1, 10, 2);
    if (f.st === 'bite') { drawWin(p.x - cam.x - 18, p.y - cam.y - 100, 36, 36); text('!', p.x - cam.x, p.y - cam.y - 98, { size: 32, align: 'center', color: '#ff5a4a' }); }
  }
  for (const q of W2.pops) { if (q.t < 0) continue; ctx.globalAlpha = Math.max(0, 1 - q.t / 50); text(q.txt, q.x - cam.x, q.y - cam.y - q.t * 0.8, { size: 26, align: 'center', color: q.c }); ctx.globalAlpha = 1; }
  // alvo da ferramenta
  if (!W2.busy && G.top() && G.top().isWorld && !W2.fishing) {
    const [tx, ty] = W2.target();
    const sx = tx * TS - cam.x, sy = ty * TS - cam.y;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.strokeRect(sx + 2, sy + 2, TS - 4, TS - 4);
  }
  drawLight();
  // clima
  if (W2.weather.length) {
    if (State.weather === 'chuva') { ctx.strokeStyle = 'rgba(180,200,255,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const q of W2.weather) { ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 4, q.y + 12); } ctx.stroke(); }
    else if (State.season === 2 && State.weather === 'sol') { for (const q of W2.weather) { ctx.fillStyle = q.s > 1 ? '#d8702a' : '#e8a040'; ctx.fillRect(q.x, q.y, 6, 3); } }
    else { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (const q of W2.weather) ctx.fillRect(q.x, q.y, 3 * q.s, 3 * q.s); }
  }
  if (W2.banner) {
    const a = Math.min(1, W2.banner.t / 30, (150 - W2.banner.t) / 20);
    ctx.globalAlpha = a; setFont(34); const w = textW(W2.banner.text, 34) + 60;
    drawWin(VIEW_W / 2 - w / 2, 70, w, 54); text(W2.banner.text, VIEW_W / 2, 80, { size: 34, align: 'center', color: UI.hi });
    ctx.globalAlpha = 1;
  }
}

function shake(o) { if (!o.shake) return 0; o.shake--; return Math.sin(o.shake * 2) * 3; }
function drawObj(o, x, y) {
  const cam = World.cam, sx = x * TS - cam.x + shake(o), sy = y * TS - cam.y;
  const season = World.map.theme === 'cave' || World.map.theme === 'indoor' ? 'spring' : World.map.theme;
  if (o.k === 'forage') { const bob = Math.sin((G.frame + x * 20) / 18) * 2; ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sx + TS / 2, sy + TS - 8, 12, 4, 0, 0, 7); ctx.fill(); ctx.drawImage(Icons.get(o.item), sx + 8, sy + 4 + bob, 32, 32); return; }
  if (o.k === 'tree') { ctx.drawImage(ObjArt.get('tree', season), sx, sy - TS, TS, TS * 2); return; }
  if (o.k === 'treestump') { ctx.drawImage(ObjArt.get('stump', season), sx, sy, TS, TS); return; }
  if (o.k === 'chest') { ctx.drawImage(ObjArt.get('chest', season), sx, sy, TS, TS); return; }
  ctx.drawImage(ObjArt.get(o.k, season), sx, sy, TS, TS);
}
function drawCrop(cr, x, y) {
  const cam = World.cam, sx = x * TS - cam.x, sy = y * TS - cam.y;
  if (cr.dead) { ctx.drawImage(ObjArt.get('dead', 'spring'), sx, sy, TS, TS); return; }
  const st = cropStage(cr), ready = st === 3;
  const sway = ready ? Math.sin((G.frame + x * 13) / 25) : 0;
  ctx.drawImage(CropArt.get(cr.id, st, ready), sx + sway, sy - TS / 2, TS, TS * 1.5);
  if (ready && Math.floor(G.frame / 30 + x) % 6 === 0) { ctx.fillStyle = 'rgba(255,255,220,0.9)'; ctx.fillRect(sx + 34, sy + 2, 3, 3); }
}
function drawFixed(f) {
  const cam = World.cam, sx = f.x * TS - cam.x, sy = f.y * TS - cam.y;
  switch (f.type) {
    case 'prop': {
      if (f.art === 'moontree') { const cv = ObjArt.get(State.flags.fim ? 'moontree_bloom' : 'moontree', 'spring'); ctx.drawImage(cv, sx - TS * 0.5, sy - TS * 1.5, TS * 4, TS * 4); if (State.flags.fim) { ctx.globalAlpha = 0.25 + Math.sin(G.frame / 30) * 0.1; ctx.fillStyle = '#c8d8ff'; ctx.beginPath(); ctx.arc(sx + TS * 1.5, sy, TS * 2.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
      else ctx.drawImage(Props.get(f.art, Math.floor(G.frame / 8) % 3), sx, sy, TS * 2, TS * 2);
      break;
    }
    case 'trough': ctx.drawImage(Props.get(State.trough > 0 ? 'trough_full' : 'trough'), sx, sy, TS, TS); break;
    case 'box': ctx.drawImage(Props.get(State.box.length ? 'box_full' : 'box'), sx, sy, TS, TS); break;
    case 'altar': ctx.drawImage(Props.get('altar', Math.floor(G.frame / 20) % 2), sx, sy, TS, TS); break;
    case 'cave': ctx.drawImage(Props.get('cave'), sx, sy, TS, TS); break;
    case 'bin': case 'radio': case 'sign': ctx.drawImage(Props.get(f.type), sx, sy, TS, TS); break;
  }
}
function drawEnt(e) {
  const cam = World.cam, sx = e.x - cam.x, sy = e.y - cam.y;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(sx, sy - 2, e.kind === 'enemy' ? e.e.size * 1.1 : 15, 5, 0, 0, 7); ctx.fill();
  if (e.kind === 'npc') {
    const fr = e.moving ? [1, 0, 2, 0][Math.floor(e.anim / 8) % 4] : 0;
    ctx.drawImage(CharArt.get('npc_' + e.id, NPCS[e.id].look, e.dir, fr), sx - 24, sy - 46, 48, 48);
    return;
  }
  if (e.kind === 'farmmon' || e.kind === 'wild') {
    const sp = MONSTRINHOS[e.kind === 'farmmon' ? e.m.sp : e.sp];
    const fr = Math.floor(e.anim / (e.moving ? 10 : 24)) % 2;
    const cv = MonArt.get(sp.art, sp.c, fr, 16);
    const bob = e.moving ? -Math.abs(Math.sin(e.anim / 6)) * 4 : 0;
    const flip = e.dir === 'left';
    ctx.save(); ctx.translate(sx, sy + bob); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(cv, -24, -46, 48, 48); ctx.restore();
    if (e.kind === 'wild') { const w = State.wild[e.sp]; if (Math.floor(G.frame / 40) % 3 === 0) text(w && w.trust ? '♥' : '?', sx, sy - 70, { size: 24, align: 'center', color: w && w.trust ? '#ff8ab8' : '#ffffff' }); }
    if (e.kind === 'farmmon' && e.m.petted === false && State.time < 22 * 60 && Math.floor(G.frame / 50) % 4 === 0) text('♡', sx, sy - 66, { size: 22, align: 'center', color: '#ffb8d8' });
    return;
  }
  if (e.kind === 'enemy') {
    const E2 = e.e, s = E2.size * PX;
    const fr = Math.floor(e.anim / 14) % 2;
    let yoff = 0;
    if (E2.hop && e.jump > 0) yoff = -Math.sin((22 - e.jump) / 22 * Math.PI) * (E2.boss ? 40 : 22);
    if (E2.fly) yoff = -18 + Math.sin(e.anim / 10) * 4;
    if (E2.ambush && !e.awake) { ctx.drawImage(ObjArt.get('rock', 'spring'), sx - 24, sy - 46, 48, 48); return; }
    const cv = MonArt.get(E2.art, E2.c, fr, E2.size);
    ctx.save(); ctx.translate(sx, sy + yoff); if (e.dir === 'left') ctx.scale(-1, 1);
    ctx.drawImage(cv, -s / 2, -s, s, s);
    if (e.hit > 0 && e.hit % 4 < 2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(cv, -s / 2, -s, s, s); }
    ctx.restore();
    if (e.hp < e.maxHp && !E2.boss) drawBar(sx - 20, sy - s - 10 + yoff, 40, 5, e.hp / e.maxHp, '#ff5a5a');
    if (E2.boss) { drawWin(VIEW_W / 2 - 200, 20, 400, 46); text(E2.name, VIEW_W / 2, 24, { size: 22, align: 'center', color: UI.hi }); drawBar(VIEW_W / 2 - 180, 48, 360, 8, e.hp / e.maxHp, '#c87aff'); }
  }
}
function drawPlayer() {
  const p = World.p, cam = World.cam, sx = Math.round(p.x - cam.x), sy = Math.round(p.y - cam.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(sx, sy - 2, 15, 5, 0, 0, 7); ctx.fill();
  if (p.inv > 0 && Math.floor(p.inv / 4) % 2) return;
  const fr = p.moving ? [1, 0, 2, 0][Math.floor(p.anim / 7) % 4] : 0;
  const sw = World.swing;
  const look = PLAYER_LOOKS[State.look];
  const drawTool = () => {
    if (!sw) return;
    const k = sw.t / sw.dur, [dx, dy] = DIRV[p.dir];
    const base = Math.atan2(dy, dx);
    const ang = base + (k - 0.5) * (sw.tool === 'espada' ? 2.6 : 1.6) * (p.dir === 'left' ? -1 : 1);
    const r = 30;
    ctx.save(); ctx.translate(sx + Math.cos(ang) * r, sy - 24 + Math.sin(ang) * r); ctx.rotate(ang + Math.PI / 4);
    ctx.drawImage(Icons.get(sw.tool), -18, -18, 36, 36); ctx.restore();
    if (sw.tool === 'espada' && k > 0.2 && k < 0.8) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy - 24, r + 12, base - 1.1, base + 1.1); ctx.stroke(); }
  };
  if (p.dir === 'up') drawTool();
  ctx.drawImage(CharArt.get('player' + State.look, look, p.dir, sw ? 1 : fr), sx - 24, sy - 46, 48, 48);
  if (p.dir !== 'up') drawTool();
  if (World.fishing) { const [dx] = DIRV[p.dir]; ctx.drawImage(Icons.get('vara'), sx + (dx >= 0 ? 0 : -32), sy - 60, 32, 32); }
}

// luz: noite, chuva e escuridão da caverna
function drawLight() {
  const m = World.map;
  let dark = 0, col = '10,12,40';
  if (m.def.cave) { dark = 0.55; col = '6,4,14'; }
  else if (m.def.outdoor) {
    const t = State.time;
    if (t >= 17 * 60) dark = Math.min(0.62, (t - 17 * 60) / 240 * 0.62);
    if (State.weather !== 'sol') dark = Math.max(dark, 0.18);
  } else if (State.time >= 20 * 60) dark = 0.15;
  if (dark <= 0) return;
  if (!World.darkCv) { World.darkCv = document.createElement('canvas'); World.darkCv.width = VIEW_W; World.darkCv.height = VIEW_H; }
  const dc = World.darkCv.getContext('2d');
  dc.globalCompositeOperation = 'source-over';
  dc.clearRect(0, 0, VIEW_W, VIEW_H);
  dc.fillStyle = `rgba(${col},${dark})`; dc.fillRect(0, 0, VIEW_W, VIEW_H);
  dc.globalCompositeOperation = 'destination-out';
  const light = (x, y, r) => { const g = dc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = g; dc.beginPath(); dc.arc(x, y, r, 0, 7); dc.fill(); };
  const cam = World.cam, p = World.p;
  light(p.x - cam.x, p.y - cam.y - 20, m.def.cave ? TS * 3.4 : TS * 2.2);
  const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
  for (let y = y0; y < y0 + 13; y++) for (let x = x0; x < x0 + 21; x++) { const c = World.tile(x, y); if (c === 'E' || c === 'W' || c === 'q') light(x * TS - cam.x + TS / 2, y * TS - cam.y + TS / 2, TS * (c === 'W' ? 1.4 : 2.6)); }
  for (const f of m.fixed) if (f.type === 'prop' && f.art === 'forge') light(f.x * TS - cam.x + TS, f.y * TS - cam.y + TS, TS * 2.5);
  for (const e of World.ents) if (e.kind === 'wild' && e.sp === 'faisquinha') light(e.x - cam.x, e.y - cam.y - 20, TS * 2);
  for (const [k, o] of Object.entries(m.objs)) if (o.k === 'ore_cristal' || o.k === 'ladder') { const [x, y] = k.split(',').map(Number); light(x * TS - cam.x + TS / 2, y * TS - cam.y + TS / 2, TS * 1.4); }
  ctx.drawImage(World.darkCv, 0, 0);
}

// ------------------------------------------------------------
//  HUD
// ------------------------------------------------------------
function weatherIcon(x, y, w) {
  if (w === 'sol') { ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffd040'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); ctx.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); ctx.stroke(); } }
  else { ctx.fillStyle = '#d8e0f0'; ctx.beginPath(); ctx.arc(x - 6, y, 8, 0, 7); ctx.arc(x + 5, y - 3, 9, 0, 7); ctx.arc(x + 10, y + 2, 6, 0, 7); ctx.fill(); ctx.fillStyle = w === 'neve' ? '#ffffff' : '#6ab0ff'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 8 + i * 7, y + 10 + (i % 2) * 3, 2, w === 'neve' ? 2 : 5); }
}
function drawHUD() {
  if (!World.map) return;
  // relógio
  const px = VIEW_W - 236;
  drawWin(px, 10, 226, 104, { alpha: 0.95 });
  text(State.dateText(), px + 16, 18, { size: 24 });
  text(State.clock(), px + 16, 44, { size: 36, color: State.time >= 22 * 60 ? UI.bad : UI.hi });
  weatherIcon(px + 180, 62, State.weather);
  text(`${State.gold} moedas`, px + 16, 82, { size: 24, color: '#ffd04a' });
  // objetivo / andar
  if (World.map.def.cave) { drawWin(10, 10, 170, 44, { alpha: 0.9 }); text(World.cave.floor === 20 ? 'Fundo da caverna' : `Andar ${World.cave.floor}`, 26, 18, { size: 26, color: UI.hi }); }
  else { const q = currentQuest(); if (q && World.map.def.outdoor) { const lines = wrapText(q.text, 380, 20); drawWin(10, 10, 410, 18 + lines.length * 20, { alpha: 0.8 }); lines.forEach((l, i) => text(l, 22, 16 + i * 20, { size: 20, color: '#e8e0d0' })); } }
  // energia e vida
  const bx = VIEW_W - 44, by = VIEW_H - 200;
  const vbar = (x, frac, col, label) => {
    drawWin(x - 6, by - 8, 36, 180, { alpha: 0.9 });
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 2, by + 22, 20, 142);
    const h = Math.round(142 * U.clamp(frac, 0, 1));
    ctx.fillStyle = col; ctx.fillRect(x + 2, by + 22 + 142 - h, 20, h);
    text(label, x + 12, by - 4, { size: 22, align: 'center', color: col });
  };
  vbar(bx, State.energy / State.maxEnergy, State.energy < 20 ? '#ff6a4a' : '#7ad04a', 'E');
  if (World.map.def.cave || State.hp < State.maxHp) vbar(bx - 44, State.hp / State.maxHp, '#ff5a6a', 'V');
  // barra de itens
  const n = 8, sw = 54, hx = Math.round(VIEW_W / 2 - (n * sw) / 2), hy = VIEW_H - 64;
  drawWin(hx - 8, hy - 8, n * sw + 12, 64, { alpha: 0.92 });
  for (let i = 0; i < n; i++) {
    const s = State.inv[i], x = hx + i * sw, sel = i === State.sel;
    ctx.fillStyle = sel ? 'rgba(255,198,92,0.28)' : 'rgba(0,0,0,0.3)'; ctx.fillRect(x, hy, sw - 4, 50);
    if (sel) { ctx.strokeStyle = UI.hi; ctx.lineWidth = 3; ctx.strokeRect(x, hy, sw - 4, 50); }
    if (s) {
      ctx.drawImage(Icons.get(s.id), x + 5, hy + 3, 40, 40);
      if (s.n > 1) text(String(s.n), x + sw - 8, hy + 28, { size: 20, align: 'right' });
      if (s.id === 'regador') drawBar(x + 4, hy + 44, sw - 12, 4, State.water / CAN_CAPACITY[State.tools.regador], '#5aa8ff');
    }
    text(String(i + 1), x + 4, hy + 1, { size: 14, color: UI.dim });
  }
  const cur = State.selItem();
  if (cur) { const nm = ITEMS[cur.id].name + (ITEMS[cur.id].kind === 'tool' && State.tools[cur.id] ? ' ' + TIERS[State.tools[cur.id]] : ''); setFont(22); const w = textW(nm, 22) + 24; drawWin(VIEW_W / 2 - w / 2, hy - 44, w, 32, { alpha: 0.85 }); text(nm, VIEW_W / 2, hy - 40, { size: 22, align: 'center', color: UI.hi }); }
  // itens recebidos
  let fy = VIEW_H - 120;
  for (const f of World.feed.slice().reverse()) {
    ctx.globalAlpha = Math.min(1, f.t / 30);
    const label = `+${f.n} ${ITEMS[f.id].name}`; setFont(22); const w = textW(label, 22) + 56;
    drawWin(10, fy - 6, w, 40, { alpha: 0.85 }); ctx.drawImage(Icons.get(f.id), 18, fy - 2, 32, 32); text(label, 54, fy + 2, { size: 22 });
    ctx.globalAlpha = 1; fy -= 46;
  }
}
