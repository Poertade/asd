'use strict';
// ============================================================
//  Inicialização e laço principal
// ============================================================

function resizeCanvas() {
  const touch = document.body.classList.contains('touch-on');
  const portrait = window.innerHeight > window.innerWidth;
  const reserve = touch && portrait ? Math.min(260, window.innerHeight * 0.4) : 0;
  const w = window.innerWidth, h = window.innerHeight - reserve;
  const s = Math.max(0.2, Math.min(w / VIEW_W, h / VIEW_H));
  canvas.style.width = Math.floor(VIEW_W * s) + 'px';
  canvas.style.height = Math.floor(VIEW_H * s) + 'px';
}

async function boot() {
  try { Audio2.muted = localStorage.getItem('farol_mute') === '1'; } catch (e) { /* sem armazenamento */ }
  setupTouch();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  document.body.addEventListener('touchstart', () => setTimeout(resizeCanvas, 50), { once: true, passive: true });
  canvas.addEventListener('pointerdown', () => { Audio2.unlock(); try { canvas.focus(); } catch (e) {} });
  try { canvas.focus(); } catch (e) {}
  // fonte em pixel (com limite de espera)
  try {
    if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load(`32px VT323`), new Promise(r => setTimeout(r, 2500))]);
  } catch (e) { /* usa fonte reserva */ }
  await loadPortraits();
  G.fade.a = 1;
  G.push(new TitleScene());
  G.fadeTo(0, 40);
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  const frame = now => {
    acc += Math.min(250, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      try { G.update(); } catch (e) { console.error(e); }
      Input.endFrame();
      acc -= STEP; n++;
    }
    if (n === 5) acc = 0;
    try { G.draw(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// atalhos de depuração (úteis para testes): DBG.warp('campos', 21, 14)
window.DBG = {
  warp(m, x, y) { if (!World.map) { State.map = m; State.x = x; State.y = y; startWorld(); } else World.load(m, x, y, 'down'); },
  level(n) { for (const h of State.party) { h.setLevel(n); } },
  give(id, n = 1) { State.addItem(id, n); },
  flag(k, v = true) { State.setFlag(k, v); },
  join(id) { if (!State.inParty(id)) { const h = State.addHero(id, State.avgLevel()); h.setLevel(State.avgLevel()); World.map && World.rebuildFollowers(); } },
  heal() { State.healAll(); },
  gold(n) { State.gold += n; },
};

boot();
