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
    try { localStorage.setItem('farol_mute', this.muted ? '1' : '0'); } catch (e) {}
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

// ------------------------------------------------------------
//  Trilha sonora (composições originais)
// ------------------------------------------------------------
const MUSIC = {
  title: { bpm: 84, ch: [
    { w: 'triangle', v: 0.16, n: 'A4 - - - C5 - B4 - | A4 - - - E4 - - - | F4 - - - G4 - A4 - | E4 - - - - - - - | A4 - - - C5 - D5 - | E5 - - - D5 - C5 - | B4 - - - G4 - B4 - | A4 - - - - - - -' },
    { w: 'square', v: 0.035, n: 'A2 - E3 - A3 - E3 - | F2 - C3 - F3 - C3 - | D2 - A2 - D3 - A2 - | E2 - B2 - E3 - G#3 - | A2 - E3 - A3 - E3 - | C3 - G3 - C4 - G3 - | G2 - D3 - G3 - D3 - | A2 - E3 - A3 - E3 -' },
  ] },
  home: { bpm: 80, ch: [
    { w: 'triangle', v: 0.15, n: 'C5 - - - E5 - - - | D5 - C5 - A4 - - - | F4 - - - A4 - C5 - | G4 - - - - - - - | C5 - - - E5 - G5 - | F5 - E5 - D5 - - - | C5 - B4 - D5 - - - | C5 - - - - - - -' },
    { w: 'sine', v: 0.12, n: 'C3 - G3 - E3 - G3 - | A2 - E3 - C3 - E3 - | F2 - C3 - A2 - C3 - | G2 - D3 - B2 - D3 - | C3 - G3 - E3 - G3 - | F2 - C3 - A2 - C3 - | G2 - D3 - B2 - D3 - | C3 - G3 - C4 - - -' },
  ] },
  village: { bpm: 120, ch: [
    { w: 'square', v: 0.05, n: 'E5 - D5 C5 D5 - E5 - | G5 - E5 - C5 - - - | D5 - E5 F5 E5 - D5 - | C5 - D5 - G4 - - - | E5 - D5 C5 D5 - E5 - | G5 - A5 - G5 - E5 - | F5 - E5 - D5 - G4 - | C5 - - - - - . .' },
    { w: 'triangle', v: 0.16, n: 'C3 . G2 . C3 . G2 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | A2 . E3 . A2 . E3 . | F2 . C3 . G2 . D3 . | C3 . G2 . C3 . . .' },
    { w: 'drum', v: 0.2, n: 'o . x . x . x . | o . x . x . x x' },
  ] },
  field: { bpm: 132, ch: [
    { w: 'square', v: 0.05, n: 'D5 - - G5 - - B5 - | A5 - G5 - F#5 - D5 - | E5 - - C5 - - E5 - | D5 - - - - - . . | D5 - - G5 - - B5 - | D6 - C6 - B5 - A5 - | G5 - A5 - B5 - F#5 - | G5 - - - - - . .' },
    { w: 'triangle', v: 0.17, n: 'G2 - G3 - G2 - G3 - | D2 - D3 - D2 - D3 - | C3 - C4 - C3 - C4 - | D2 - D3 - D2 - D3 - | G2 - G3 - G2 - G3 - | E2 - E3 - E2 - E3 - | C3 - C4 - D2 - D3 - | G2 - G3 - G2 - G3 -' },
    { w: 'drum', v: 0.22, n: 'o . x . s . x . | o . x o s . x .' },
  ] },
  forest: { bpm: 96, ch: [
    { w: 'triangle', v: 0.15, n: 'B4 - - - - - E5 - | D5 - - - B4 - - - | C5 - - - - - A4 - | B4 - - - - - - - | G4 - - - A4 - B4 - | D5 - - - E5 - - - | F#5 - - - D5 - - - | E5 - - - - - - -' },
    { w: 'square', v: 0.025, n: 'E4 G4 B4 G4 E4 G4 B4 G4 | E4 G4 B4 G4 E4 G4 B4 G4 | C4 E4 G4 E4 C4 E4 G4 E4 | B3 D#4 F#4 D#4 B3 D#4 F#4 D#4 | E4 G4 B4 G4 E4 G4 B4 G4 | G3 B3 D4 B3 G3 B3 D4 B3 | D4 F#4 A4 F#4 B3 D#4 F#4 D#4 | E4 G4 B4 G4 E4 G4 B4 G4' },
    { w: 'sine', v: 0.14, n: 'E2 - - - - - - - | E2 - - - - - - - | C2 - - - - - - - | B1 - - - - - - - | E2 - - - - - - - | G2 - - - - - - - | D2 - - - B1 - - - | E2 - - - - - - -' },
  ] },
  cave: { bpm: 80, ch: [
    { w: 'triangle', v: 0.15, n: 'D4 - - - - - - - | F4 - - - E4 - - - | D4 - - - A3 - - - | C#4 - - - - - - - | D4 - - - F4 - A4 - | G4 - - - F4 - E4 - | F4 - - - D4 - - - | A3 - - - - - - -' },
    { w: 'square', v: 0.03, n: 'D2 - - - D3 - - - | Bb1 - - - Bb2 - - - | G1 - - - G2 - - - | A1 - - - A2 - - - | D2 - - - D3 - - - | C2 - - - C3 - - - | Bb1 - - - Bb2 - - - | A1 - - - A2 - - -' },
    { w: 'drum', v: 0.12, n: '. . . . . . x . | . . . . . . . . | . . . x . . . . | . . . . . . . .' },
  ] },
  swamp: { bpm: 90, ch: [
    { w: 'triangle', v: 0.15, n: 'E4 - - F#4 - - G#4 - | A#4 - - - G#4 - - - | F#4 - - E4 - - D4 - | E4 - - - - - - - | C5 - - A#4 - - G#4 - | F#4 - - - G#4 - - - | A#4 - - G#4 - - F#4 - | E4 - - - - - - -' },
    { w: 'square', v: 0.025, n: 'E3 . G#3 . C4 . G#3 . | E3 . G#3 . C4 . G#3 . | D3 . F#3 . A#3 . F#3 . | E3 . G#3 . C4 . G#3 .' },
    { w: 'sine', v: 0.14, n: 'E2 - - - - - - - | C2 - - - - - - - | D2 - - - - - - - | E2 - - - - - - -' },
  ] },
  snow: { bpm: 104, ch: [
    { w: 'square', v: 0.025, n: 'B4 D5 F#5 B5 F#5 D5 B4 D5 | G4 B4 D5 G5 D5 B4 G4 B4 | D5 F#5 A5 D6 A5 F#5 D5 F#5 | F#4 A#4 C#5 F#5 C#5 A#4 F#4 A#4' },
    { w: 'triangle', v: 0.15, n: 'F#5 - - - - - E5 - | D5 - - - B4 - - - | A4 - - - D5 - - - | C#5 - - - - - - - | F#5 - - - G5 - F#5 - | E5 - - - D5 - B4 - | D5 - - - E5 - F#5 - | F#5 - - - - - - -' },
    { w: 'sine', v: 0.13, n: 'B2 - - - - - - - | G2 - - - - - - - | D2 - - - - - - - | F#2 - - - - - - -' },
  ] },
  tower: { bpm: 88, ch: [
    { w: 'triangle', v: 0.15, n: 'C5 - - - Eb5 - - - | D5 - - - G4 - - - | Ab4 - - - G4 - F4 - | G4 - - - - - - - | C5 - - - Eb5 - G5 - | F5 - - - Eb5 - D5 - | Eb5 - - - D5 - B4 - | C5 - - - - - - -' },
    { w: 'square', v: 0.03, n: 'C2 - G2 - C3 - G2 - | G1 - D2 - G2 - D2 - | Ab1 - Eb2 - Ab2 - Eb2 - | G1 - D2 - G2 - B2 - | C2 - G2 - C3 - G2 - | F1 - C2 - F2 - C2 - | Ab1 - Eb2 - G1 - D2 - | C2 - G2 - C3 - G2 -' },
    { w: 'drum', v: 0.14, n: 'o . . . . . . . | o . . . s . . .' },
  ] },
  battle: { bpm: 152, ch: [
    { w: 'square', v: 0.05, n: 'A4 - C5 - E5 - A5 - | G5 - F5 - E5 - D5 - | E5 - - - D5 - C5 - | B4 - - - G#4 - - - | A4 - C5 - E5 - A5 - | B5 - A5 - G5 - F5 - | G5 - - - A5 - B5 - | C6 - B5 - G#5 - E5 -' },
    { w: 'triangle', v: 0.17, n: 'A2 A2 A3 A2 A2 A3 A2 G2 | F2 F2 F3 F2 F2 F3 F2 F2 | G2 G2 G3 G2 G2 G3 G2 G2 | E2 E2 E3 E2 E2 E3 E2 G#2 | A2 A2 A3 A2 A2 A3 A2 G2 | F2 F2 F3 F2 F2 F3 F2 F2 | G2 G2 G3 G2 G2 G3 G2 G2 | E2 E2 E3 E2 E2 E3 E2 E2' },
    { w: 'drum', v: 0.25, n: 'o . x . s . x o | . o x . s . x .' },
  ] },
  boss: { bpm: 160, ch: [
    { w: 'square', v: 0.05, n: 'D5 - - A4 - - D5 - | F5 - E5 - D5 - C5 - | Bb4 - - F4 - - Bb4 - | A4 - - - C#5 - E5 - | D5 - - A4 - - D5 - | G5 - F5 - E5 - D5 - | E5 - F5 - G5 - A5 - | A5 - - - - - . .' },
    { w: 'sawtooth', v: 0.035, n: 'D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | A1 A2 A1 A2 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | G1 G2 G1 G2 G1 G2 G1 G2 | C2 C3 C2 C3 C2 C3 C2 C3 | A1 A2 A1 A2 A1 A2 A1 A2' },
    { w: 'drum', v: 0.28, n: 'o x s x o o s x | o x s x o x s s' },
  ] },
  final: { bpm: 168, ch: [
    { w: 'square', v: 0.05, n: 'E5 - - B4 - - E5 - | G5 - F#5 - E5 - D5 - | C5 - - G4 - - C5 - | B4 - - - D#5 - F#5 - | E5 - G5 - B5 - - - | A5 - G5 - F#5 - E5 - | D5 - E5 - F#5 - A5 - | B5 - - - - - - -' },
    { w: 'sawtooth', v: 0.035, n: 'E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3 | A1 A2 A1 A2 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | B1 B2 B1 B2 B1 B2 B1 B2' },
    { w: 'triangle', v: 0.1, n: 'B3 - - - - - - - | B3 - - - - - - - | G3 - - - - - - - | F#3 - - - - - - - | G3 - - - - - - - | E3 - - - - - - - | F#3 - - - - - - - | D#4 - - - - - - -' },
    { w: 'drum', v: 0.3, n: 'o x s x o o s x | o x s o o x s s' },
  ] },
  ending: { bpm: 92, ch: [
    { w: 'triangle', v: 0.16, n: 'A4 - - - C5 - - - | F5 - - - E5 - D5 - | C5 - - - A4 - - - | G4 - - - - - - - | Bb4 - - - D5 - - - | G5 - - - F5 - E5 - | F5 - - - - - - - | . . . . . . . .' },
    { w: 'square', v: 0.03, n: 'F2 - C3 - A3 - C3 - | D2 - A2 - F3 - A2 - | F2 - C3 - A3 - C3 - | C2 - G2 - E3 - G2 - | Bb1 - F2 - D3 - F2 - | C2 - G2 - E3 - G2 - | F2 - C3 - A3 - C3 - | F2 - C3 - F3 - - -' },
  ] },
  victory: { bpm: 150, once: true, ch: [
    { w: 'square', v: 0.07, n: 'E5 . E5 . G5 - - - E5 - C5 - D5 - G5 - - - - - . . C5 E5 G5 C6 - - - - - - . .' },
    { w: 'triangle', v: 0.16, n: 'C3 . C3 . E3 - - - C3 - A2 - B2 - D3 - - - - - . . C3 - G2 - C3 - - - - - . .' },
  ] },
  gameover: { bpm: 70, once: true, ch: [
    { w: 'triangle', v: 0.16, n: 'A4 - - - G4 - - - F4 - - - E4 - - - D4 - - - - - - -' },
    { w: 'sine', v: 0.12, n: 'A2 - - - - - - - F2 - - - - - - - D2 - - - - - - -' },
  ] },
};
