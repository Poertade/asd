'use strict';
// ============================================================
//  Inicialização e laço principal
// ============================================================

function resizeCanvas() {
  const touch = document.body.classList.contains('touch-on');
  const portrait = window.innerHeight > window.innerWidth;
  const reserve = touch && portrait ? Math.min(260, window.innerHeight * 0.4) : 0;
  const s = Math.max(0.2, Math.min(window.innerWidth / VIEW_W, (window.innerHeight - reserve) / VIEW_H));
  canvas.style.width = Math.floor(VIEW_W * s) + 'px';
  canvas.style.height = Math.floor(VIEW_H * s) + 'px';
}

async function boot() {
  try { Audio2.muted = localStorage.getItem('vale_mute') === '1'; } catch (e) { /* sem armazenamento */ }
  setupTouch();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  document.body.addEventListener('touchstart', () => setTimeout(resizeCanvas, 50), { once: true, passive: true });
  canvas.addEventListener('pointerdown', () => { Audio2.unlock(); try { canvas.focus(); } catch (e) {} });
  try { canvas.focus(); } catch (e) {}
  try { if (document.fonts && document.fonts.load) await Promise.race([document.fonts.load('32px VT323'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* fonte reserva */ }
  G.fade.a = 1;
  G.push(new TitleScene());
  G.fadeTo(0, 40);
  let last = performance.now(), acc = 0;
  const STEP = 1000 / 60;
  const frame = now => {
    acc += Math.min(250, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) { try { G.update(); } catch (e) { console.error(e); } Input.endFrame(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    try { G.draw(); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// atalhos de teste: DBG.go('vila', 22, 15)
window.DBG = {
  go(m, x, y) { World.load(m, x, y, 'down'); },
  give(id, n = 1) { State.addItem(id, n); },
  gold(n) { State.gold += n; },
  sleep() { World.run(() => endDay('sleep')); },
  cave(f) { World.run(() => World.enterCave(f)); },
  time(h) { State.time = h * 60; },
};

boot();
