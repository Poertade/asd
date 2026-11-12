'use strict';
// ============================================================
//  Trilha sonora e efeitos do Vale dos Monstrinhos (composições originais)
// ============================================================

const MUSIC = {
  title: { bpm: 96, ch: [
    { w: 'triangle', v: 0.16, n: 'G4 - C5 - E5 - G5 - | F5 - E5 - D5 - C5 - | A4 - C5 - F5 - A5 - | G5 - - - - - . . | G4 - C5 - E5 - G5 - | A5 - G5 - F5 - E5 - | D5 - E5 - F5 - D5 - | C5 - - - - - . .' },
    { w: 'sine', v: 0.12, n: 'C3 - G3 - E3 - G3 - | C3 - G3 - E3 - G3 - | F2 - C3 - A2 - C3 - | G2 - D3 - B2 - D3 - | C3 - G3 - E3 - G3 - | F2 - C3 - A2 - C3 - | G2 - D3 - B2 - D3 - | C3 - G3 - C4 - - -' },
  ] },
  farm: { bpm: 112, ch: [
    { w: 'square', v: 0.045, n: 'G4 - C5 - E5 - G5 - | F5 - E5 - D5 - C5 - | A4 - C5 - F5 - A5 - | G5 - - - - - . . | G4 - C5 - E5 - G5 - | A5 - G5 - F5 - E5 - | D5 - E5 - F5 - D5 - | C5 - - - - - . .' },
    { w: 'triangle', v: 0.16, n: 'C3 . G3 . C3 . G3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 . . .' },
    { w: 'drum', v: 0.16, n: 'o . x . s . x . | o . x x s . x .' },
  ] },
  town: { bpm: 120, ch: [
    { w: 'square', v: 0.045, n: 'A4 - C5 A4 F4 - A4 - | Bb4 - D5 - C5 - A4 - | G4 - Bb4 G4 E4 - G4 - | F4 - - - C5 - - - | A4 - C5 A4 F4 - A4 - | D5 - C5 - Bb4 - A4 - | G4 - A4 - Bb4 - E4 - | F4 - - - - - . .' },
    { w: 'triangle', v: 0.16, n: 'F2 . C3 . F2 . C3 . | Bb2 . F3 . Bb2 . F3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | F2 . C3 . F2 . C3 . | Bb2 . F3 . Bb2 . F3 . | C3 . G3 . C3 . E3 . | F2 . C3 . F2 . . .' },
    { w: 'drum', v: 0.16, n: 'o . x . x . s . | o . x . x . s x' },
  ] },
  forest: { bpm: 92, ch: [
    { w: 'triangle', v: 0.15, n: 'E5 - - - A4 - - - | C5 - B4 - A4 - - - | G4 - - - C5 - - - | E5 - D5 - C5 - - - | A4 - - - E5 - - - | F5 - E5 - D5 - - - | C5 - B4 - G4 - B4 - | A4 - - - - - - -' },
    { w: 'square', v: 0.022, n: 'A3 C4 E4 C4 A3 C4 E4 C4 | F3 A3 C4 A3 F3 A3 C4 A3 | C3 E3 G3 E3 C3 E3 G3 E3 | G3 B3 D4 B3 G3 B3 D4 B3' },
    { w: 'sine', v: 0.12, n: 'A2 - - - - - - - | F2 - - - - - - - | C2 - - - - - - - | G2 - - - - - - -' },
  ] },
  mountain: { bpm: 100, ch: [
    { w: 'triangle', v: 0.15, n: 'D5 - - A4 - - F#5 - | E5 - - - D5 - - - | B4 - - G4 - - D5 - | C#5 - - - A4 - - - | D5 - - A4 - - F#5 - | A5 - G5 - F#5 - E5 - | D5 - E5 - F#5 - E5 - | D5 - - - - - - -' },
    { w: 'square', v: 0.03, n: 'D3 - A3 - D3 - A3 - | A2 - E3 - A2 - E3 - | G2 - D3 - G2 - D3 - | A2 - E3 - A2 - C#3 - | D3 - A3 - D3 - A3 - | F#2 - C#3 - F#2 - C#3 - | G2 - D3 - A2 - E3 - | D3 - A3 - D3 - - -' },
  ] },
  cave: { bpm: 84, ch: [
    { w: 'triangle', v: 0.14, n: 'E4 - - - - - G4 - | F#4 - - - - - - - | E4 - - - B3 - - - | C4 - - - B3 - - - | E4 - - - G4 - B4 - | A4 - - - G4 - F#4 - | G4 - - - E4 - - - | D#4 - - - - - - -' },
    { w: 'square', v: 0.025, n: 'E2 - - - E3 - - - | D2 - - - D3 - - - | C2 - - - C3 - - - | B1 - - - B2 - - -' },
    { w: 'drum', v: 0.1, n: '. . . . . . x . | . . . . . . . . | . . . x . . . . | . . . . . . . .' },
  ] },
  boss: { bpm: 156, ch: [
    { w: 'square', v: 0.05, n: 'E5 - G5 - B5 - A5 - | G5 - F#5 - E5 - D5 - | C5 - E5 - G5 - F#5 - | B4 - - - D#5 - - - | E5 - G5 - B5 - C6 - | B5 - A5 - G5 - F#5 - | G5 - F#5 - E5 - D#5 - | E5 - - - - - . .' },
    { w: 'sawtooth', v: 0.032, n: 'E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3 | A1 A2 A1 A2 A1 A2 A1 A2 | B1 B2 B1 B2 B1 B2 B1 B2 | E2 E3 E2 E3 E2 E3 E2 E3' },
    { w: 'drum', v: 0.26, n: 'o x s x o o s x | o x s x o x s s' },
  ] },
  night: { bpm: 72, ch: [
    { w: 'triangle', v: 0.14, n: 'E5 - - - C5 - - - | D5 - - - G4 - - - | C5 - - - A4 - - - | B4 - - - - - - - | E5 - - - G5 - - - | F5 - - - D5 - - - | E5 - - - D5 - B4 - | C5 - - - - - - -' },
    { w: 'sine', v: 0.1, n: 'C3 - - - - - - - | G2 - - - - - - - | A2 - - - - - - - | E2 - - - - - - - | C3 - - - - - - - | F2 - - - - - - - | G2 - - - - - - - | C3 - - - - - - -' },
  ] },
  rain: { bpm: 80, ch: [
    { w: 'triangle', v: 0.14, n: 'A4 - C5 - E5 - - - | D5 - C5 - B4 - - - | C5 - B4 - A4 - - - | G#4 - - - - - - - | A4 - C5 - E5 - G5 - | F5 - E5 - D5 - - - | C5 - B4 - G#4 - B4 - | A4 - - - - - - -' },
    { w: 'sine', v: 0.11, n: 'A2 - E3 - A3 - E3 - | D2 - A2 - D3 - A2 - | A2 - E3 - A3 - E3 - | E2 - B2 - E3 - G#3 - | A2 - E3 - A3 - E3 - | D2 - A2 - D3 - A2 - | E2 - B2 - E3 - B2 - | A2 - E3 - A3 - - -' },
  ] },
  jingle: { bpm: 140, once: true, ch: [
    { w: 'square', v: 0.06, n: 'C5 E5 G5 C6 - - E5 G5 C6 E6 - - - - . .' },
    { w: 'triangle', v: 0.14, n: 'C3 - G3 - C4 - - - G2 - C3 - - - . .' },
  ] },
  ending: { bpm: 92, ch: [
    { w: 'triangle', v: 0.16, n: 'A4 - - - C5 - - - | F5 - - - E5 - D5 - | C5 - - - A4 - - - | G4 - - - - - - - | Bb4 - - - D5 - - - | G5 - - - F5 - E5 - | F5 - - - - - - - | . . . . . . . .' },
    { w: 'square', v: 0.03, n: 'F2 - C3 - A3 - C3 - | D2 - A2 - F3 - A2 - | F2 - C3 - A3 - C3 - | C2 - G2 - E3 - G2 - | Bb1 - F2 - D3 - F2 - | C2 - G2 - E3 - G2 - | F2 - C3 - A3 - C3 - | F2 - C3 - F3 - - -' },
  ] },
};

// efeitos extras do sítio
const _baseSfx = Audio2.sfx.bind(Audio2);
Audio2.sfx = function (name) {
  if (!this.ac || this.muted) return;
  const t = this.ac.currentTime;
  try {
    switch (name) {
      case 'swing': this.noise(t, 0.1, 0.12, 'bandpass', 1500, null, 4000); return;
      case 'dig': this.noise(t, 0.15, 0.35, 'lowpass', 900, null, 300); return;
      case 'thud': this.note('triangle', 90, t, 0.08, 0.15); return;
      case 'water': this.noise(t, 0.3, 0.2, 'bandpass', 2500, null, 900); this.arp(['C6', 'E6'], 0.05, 'sine', 0.05); return;
      case 'pick': this.note('square', 900, t, 0.04, 0.06); this.noise(t, 0.08, 0.25, 'highpass', 3000); return;
      case 'chop': this.note('square', 220, t, 0.05, 0.07); this.noise(t, 0.08, 0.3, 'lowpass', 1500); return;
      case 'break': this.noise(t, 0.3, 0.4, 'lowpass', 2500, null, 200); return;
      case 'cut': this.noise(t, 0.12, 0.25, 'highpass', 2500, null, 6000); return;
      case 'plant': this.arp(['E5', 'G5'], 0.05, 'triangle', 0.1); return;
      case 'harvest': this.arp(['G5', 'C6', 'E6'], 0.05, 'square', 0.06); return;
      case 'pickup': this.arp(['A5', 'E6'], 0.04, 'square', 0.05); return;
      case 'eat': this.noise(t, 0.08, 0.2, 'bandpass', 800); this.noise(t + 0.12, 0.08, 0.2, 'bandpass', 900); this.arp(['C5', 'E5', 'G5'], 0.06, 'triangle', 0.08); return;
      case 'place': this.note('triangle', 200, t, 0.07, 0.15); return;
      case 'love': this.arp(['E6', 'G6', 'B6'], 0.07, 'sine', 0.09, 0.2); return;
      case 'ship': this.noise(t, 0.15, 0.25, 'lowpass', 600); this.note('triangle', 140, t, 0.1, 0.15); return;
      case 'coin': this.arp(['B5', 'E6'], 0.06, 'square', 0.07); return;
      case 'anvil': this.note('square', 1200, t, 0.15, 0.06); this.note('square', 1810, t, 0.2, 0.04); this.noise(t, 0.05, 0.3, 'highpass', 4000); return;
      case 'craft': this.arp(['C5', 'G5', 'C6'], 0.06, 'triangle', 0.1); return;
      case 'cast': this.sweep('sine', 900, 300, 0.25, 0.08); return;
      case 'bite': this.arp(['A5', 'A5'], 0.09, 'square', 0.08); return;
      case 'reel': this.sweep('square', 400, 900, 0.1, 0.05); return;
      case 'catch': this.arp(['C5', 'E5', 'G5', 'C6', 'E6'], 0.06, 'square', 0.07); return;
      case 'hurt': this.sweep('square', 400, 120, 0.2, 0.1); return;
      case 'poof': this.noise(t, 0.3, 0.3, 'bandpass', 1200, null, 300); return;
      case 'shoot': this.sweep('sawtooth', 600, 200, 0.2, 0.05); return;
      case 'ladder': this.arp(['C5', 'D5', 'E5', 'G5'], 0.05, 'triangle', 0.1); return;
    }
  } catch (e) { return; }
  _baseSfx(name);
};
