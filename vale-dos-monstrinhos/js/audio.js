'use strict';
// ============================================================
//  Áudio: sintetizador chiptune simples (WebAudio) — músicas e efeitos
//  Notação: cada token = 1 colcheia. "C4" nota, "-" sustenta, "." pausa.
//  Bateria: o = bumbo, s = caixa, x = chimbal.
// ============================================================

const Audio2 = {
  ac: null, master: null, mus: null, sfxG: null, noiseBuf: null,
  muted: false, current: null, track: null, step: 0, nextTime: 0, timer: null, pendingName: null,
  musicVol: 0.55, sfxVol: 0.7,

  unlock() {
    try {
      if (!this.ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ac = new AC();
        this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(this.ac.destination);
        this.mus = this.ac.createGain(); this.mus.gain.value = this.musicVol; this.mus.connect(this.master);
        this.sfxG = this.ac.createGain(); this.sfxG.gain.value = this.sfxVol; this.sfxG.connect(this.master);
        const len = this.ac.sampleRate * 1;
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        if (this.pendingName) { const n = this.pendingName; this.pendingName = null; this.current = null; this.play(n); }
      }
      if (this.ac.state === 'suspended') this.ac.resume();
    } catch (e) { /* sem áudio */ }
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
    G.toast(this.muted ? 'Som desligado (M)' : 'Som ligado (M)');
    try { localStorage.setItem('vale_mute', this.muted ? '1' : '0'); } catch (e) {}
  },
  freq(n) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    if (!m) return 0;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = 12 * (parseInt(m[3]) + 1) + base;
    return 440 * Math.pow(2, (midi - 69) / 12);
  },
  parse(str) { return str.replace(/\|/g, ' ').trim().split(/\s+/); },

  play(name) {
    if (this.current === name) return;
    this.stop();
    this.current = name;
    if (!name) return;
    const def = MUSIC[name];
    if (!def) return;
    if (!this.ac) { this.pendingName = name; return; }
    this.track = {
      def, chans: def.ch.map(c => ({ ...c, tokens: this.parse(c.n) })),
      stepDur: 60 / def.bpm / 2,
    };
    this.step = 0;
    this.nextTime = this.ac.currentTime + 0.08;
    this.trackGain = this.ac.createGain(); this.trackGain.gain.value = 1; this.trackGain.connect(this.mus);
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.trackGain && this.ac) {
      const g = this.trackGain;
      try { g.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); } catch (e) {}
      setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 400);
    }
    this.trackGain = null; this.track = null; this.current = null;
  },
  schedule() {
    const t = this.track; if (!t || !this.ac) return;
    while (this.nextTime < this.ac.currentTime + 0.15) {
      let maxLen = 0;
      for (const ch of t.chans) {
        maxLen = Math.max(maxLen, ch.tokens.length);
        if (t.def.once && this.step >= ch.tokens.length) continue;
        const i = this.step % ch.tokens.length;
        const tok = ch.tokens[i];
        if (tok === '-' || tok === '.') continue;
        let dur = 1;
        while (ch.tokens[(i + dur) % ch.tokens.length] === '-' && dur < ch.tokens.length) dur++;
        if (ch.w === 'drum') this.drum(tok, this.nextTime, ch.v);
        else this.note(ch.w, this.freq(tok), this.nextTime, dur * t.stepDur, ch.v, this.trackGain);
      }
      this.nextTime += t.stepDur;
      this.step++;
      if (t.def.once && this.step >= maxLen) { const tr = this.trackGain; clearInterval(this.timer); this.timer = null; this.track = null; setTimeout(() => { if (this.trackGain === tr) this.current = null; }, 100); return; }
    }
  },
  note(wave, f, time, dur, vol, dest, attack = 0.008) {
    if (!f) return;
    const ac = this.ac;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = wave || 'square';
    o.frequency.setValueAtTime(f, time);
    const v = vol || 0.1;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(v, time + attack);
    g.gain.setValueAtTime(v, time + Math.max(attack, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.98);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(time); o.stop(time + dur + 0.02);
  },
  noise(time, dur, vol, filterType, freq, dest, endFreq) {
    const ac = this.ac;
    const src = ac.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter(); f.type = filterType || 'highpass'; f.frequency.setValueAtTime(freq || 4000, time);
    if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, time + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    src.start(time, Math.random() * 0.5); src.stop(time + dur + 0.02);
  },
  drum(tok, time, vol = 0.3) {
    const dest = this.trackGain;
    if (tok === 'x') this.noise(time, 0.04, vol * 0.35, 'highpass', 7000, dest);
    else if (tok === 's') { this.noise(time, 0.12, vol * 0.6, 'bandpass', 1800, dest); }
    else if (tok === 'o') {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.frequency.setValueAtTime(140, time); o.frequency.exponentialRampToValueAtTime(40, time + 0.12);
      g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
      o.connect(g); g.connect(dest); o.start(time); o.stop(time + 0.16);
    }
  },
  sweep(wave, f0, f1, dur, vol, time) {
    const ac = this.ac; time = time || ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = wave; o.frequency.setValueAtTime(f0, time); o.frequency.exponentialRampToValueAtTime(f1, time + dur);
    g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g); g.connect(this.sfxG); o.start(time); o.stop(time + dur + 0.02);
  },
  arp(notes, step, wave = 'square', vol = 0.12, len) {
    const t = this.ac.currentTime;
    notes.forEach((n, i) => this.note(wave, this.freq(n), t + i * step, len || step * 1.1, vol));
  },

  sfx(name) {
    if (!this.ac || this.muted) return;
    const t = this.ac.currentTime;
    try {
      switch (name) {
        case 'cursor': this.note('square', 880, t, 0.04, 0.05); break;
        case 'ok': this.note('square', 660, t, 0.05, 0.07); this.note('square', 990, t + 0.05, 0.06, 0.07); break;
        case 'cancel': this.note('square', 440, t, 0.05, 0.06); this.note('square', 300, t + 0.05, 0.07, 0.06); break;
        case 'buzz': this.note('square', 120, t, 0.12, 0.08); break;
        case 'text': this.note('square', 1200 + Math.random() * 200, t, 0.015, 0.015); break;
        case 'hit': this.noise(t, 0.12, 0.5, 'lowpass', 2500, null, 300); this.sweep('square', 220, 80, 0.1, 0.08); break;
        case 'crit': this.noise(t, 0.2, 0.7, 'lowpass', 5000, null, 300); this.sweep('square', 600, 90, 0.18, 0.1); break;
        case 'miss': this.noise(t, 0.15, 0.15, 'bandpass', 2000, null, 6000); break;
        case 'slash': this.noise(t, 0.09, 0.35, 'highpass', 3000, null, 900); break;
        case 'fire': this.noise(t, 0.45, 0.45, 'lowpass', 800, null, 3000); this.sweep('sawtooth', 120, 60, 0.4, 0.05); break;
        case 'ice': this.arp(['E6', 'B6', 'G6', 'E7'], 0.04, 'triangle', 0.08); this.noise(t, 0.3, 0.12, 'highpass', 6000); break;
        case 'thunder': this.noise(t, 0.5, 0.7, 'lowpass', 6000, null, 200); this.sweep('sawtooth', 900, 50, 0.3, 0.08); break;
        case 'nature': this.sweep('triangle', 300, 900, 0.25, 0.1); this.noise(t, 0.3, 0.15, 'bandpass', 1200); break;
        case 'light': this.arp(['C6', 'G6', 'C7'], 0.05, 'sine', 0.1, 0.3); break;
        case 'dark': this.sweep('sawtooth', 300, 70, 0.5, 0.08); this.sweep('square', 150, 40, 0.5, 0.05); break;
        case 'magic': this.sweep('sine', 400, 1600, 0.3, 0.1); break;
        case 'heal': this.arp(['C5', 'E5', 'G5', 'C6'], 0.06, 'sine', 0.12, 0.2); break;
        case 'buff': this.arp(['G4', 'C5', 'E5', 'G5'], 0.05, 'triangle', 0.12); break;
        case 'debuff': this.arp(['G5', 'D#5', 'C5', 'G4'], 0.06, 'triangle', 0.12); break;
        case 'status': this.sweep('square', 500, 200, 0.25, 0.06); this.sweep('square', 520, 210, 0.25, 0.04); break;
        case 'levelup': this.arp(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, 'square', 0.08, 0.15); break;
        case 'chest': this.arp(['A5', 'C#6', 'E6', 'A6'], 0.06, 'square', 0.07); break;
        case 'item': this.arp(['E5', 'A5'], 0.07, 'square', 0.07); break;
        case 'door': this.noise(t, 0.12, 0.3, 'lowpass', 600); this.note('triangle', 90, t, 0.12, 0.2); break;
        case 'stairs': this.arp(['C4', 'E4', 'G4'], 0.06, 'triangle', 0.12); break;
        case 'encounter': this.sweep('sawtooth', 200, 1200, 0.35, 0.07); this.noise(t, 0.4, 0.2, 'bandpass', 800, null, 5000); break;
        case 'death': this.noise(t, 0.5, 0.35, 'lowpass', 3000, null, 100); this.sweep('square', 400, 60, 0.5, 0.06); break;
        case 'save': this.arp(['G5', 'D6', 'G6'], 0.09, 'sine', 0.12, 0.4); break;
        case 'push': this.noise(t, 0.2, 0.3, 'lowpass', 400); break;
        case 'switch': this.note('square', 300, t, 0.05, 0.1); this.note('square', 600, t + 0.06, 0.08, 0.1); break;
        case 'slide': this.noise(t, 0.2, 0.08, 'highpass', 5000); break;
        case 'poison': this.sweep('square', 300, 150, 0.15, 0.05); break;
        case 'flee': this.arp(['C5', 'A4', 'F4'], 0.05, 'square', 0.07); break;
        case 'roar': this.noise(t, 0.8, 0.5, 'lowpass', 500, null, 120); this.sweep('sawtooth', 110, 55, 0.8, 0.1); break;
        case 'bark': this.sweep('square', 700, 350, 0.08, 0.08); this.sweep('square', 650, 330, 0.08, 0.08, t + 0.12); break;
        case 'ember': this.arp(['C5', 'G5', 'C6', 'G6', 'C7'], 0.08, 'sine', 0.1, 0.5); break;
      }
    } catch (e) { /* ignora */ }
  },
};

