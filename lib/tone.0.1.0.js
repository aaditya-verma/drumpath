/* Backline tone 0.1.0 — the shared synth (theory-course-plan §4a), vendored into DrumPath as a pinned plain script.
   Source: aaditya-verma/backline @ 5d9d89d — app/music.js (chord names, voicing, voice leading) and app/player.js
   (bass, pad, keys voices; same oscillators, filters and envelopes). Same sound in DrumPath theory and in Backline jams.
   Free, no samples, works offline and on the claude.ai copy. Exposes window.BacklineTone. To update: replace this
   file with a newer pinned copy (tone.x.y.z.js) and change the script tag; never edit the copy in place. */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const PC = { C: 0, 'B#': 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, F: 5, 'E#': 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11 };
  const pcOf = n => (n in PC ? PC[n] : -1);
  const mod = n => ((n % 12) + 12) % 12;
  const TONES = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], aug: [0, 4, 8], '5': [0, 7] };
  const midiHz = n => 440 * Math.pow(2, (n - 69) / 12);
  function parseChord(s) {
    if (!s || s === 'N') return null;
    const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(s); if (!m) return null;
    return { root: pcOf(m[1]), suf: m[2], bass: m[3] ? pcOf(m[3]) : null };
  }
  const noteName = (pc, flats) => (flats ? FLAT : SHARP)[mod(pc)];
  function voicing(s, n = 0) {
    const c = parseChord(s); if (!c) return null;
    const root = mod(c.root + n), iv = TONES[c.suf] || TONES[''];
    const bassPc = c.bass != null ? mod(c.bass + n) : root;
    const bass = 36 + bassPc + (bassPc > 7 ? -12 : 0);
    const base = 52 + mod(root - 4);
    return { bass, pad: iv.map(i => base + i) };
  }
  function voiceLead(prev, name, n = 0) {
    const c = parseChord(name); if (!c) return null;
    const pcs = (TONES[c.suf] || TONES['']).map(i => mod(c.root + n + i));
    const cands = [];
    for (let k = 0; k < pcs.length; k++) for (const base of [48, 52, 55, 57, 60]) {
      const order = pcs.slice(k).concat(pcs.slice(0, k)); let last = base - 1; const notes = [];
      for (const pc of order) { let x = last + 1; while (mod(x) !== pc) x++; notes.push(x); last = x; }
      if (notes[0] >= 50 && notes[notes.length - 1] <= 76) cands.push(notes);
    }
    if (!cands.length) return voicing(name, n).pad;
    if (!prev || !prev.length) return cands.reduce((a, b) => Math.abs(a[0] + a[a.length - 1] - 118) <= Math.abs(b[0] + b[b.length - 1] - 118) ? a : b);
    const dist = (a, b) => a.reduce((s, x) => s + Math.min(...b.map(y => Math.abs(x - y))), 0) + b.reduce((s, y) => s + Math.min(...a.map(x => Math.abs(x - y))), 0);
    return cands.reduce((best, x) => dist(prev, x) < dist(prev, best) ? x : best);
  }
  /* voices: the caller passes an AudioContext and a node to keep (for stopping) */
  function Tone(ctx, dest) {
    this.ctx = ctx; this.voices = [];
    this.out = ctx.createDynamicsCompressor(); this.out.threshold.value = -14; this.out.ratio.value = 4; this.out.connect(dest || ctx.destination);
    this.bus = {}; for (const [k, g] of Object.entries({ bass: 0.55, chords: 0.22, keys: 0.5 })) { const n = ctx.createGain(); n.gain.value = g; n.connect(this.out); this.bus[k] = n; }
  }
  Tone.prototype._keep = function (n) { this.voices.push(n); if (this.voices.length > 400) this.voices.splice(0, 200); return n; };
  Tone.prototype.stop = function () { const t = this.ctx.currentTime; this.voices.forEach(v => { try { v.stop(t + 0.03); } catch (e) { /* already stopped */ } }); this.voices = []; };
  // bass: Backline's legato bass voice
  Tone.prototype.bass = function (n, t, d) { const ctx = this.ctx, o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(n); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(260, t + Math.min(d, 0.35));
    const end = t + d + 0.03, g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.85, t + 0.012); g.gain.exponentialRampToValueAtTime(0.6, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(f); f.connect(g); g.connect(this.bus.bass); o.start(t); o.stop(end + 0.02); this._keep(o); };
  // pad: Backline's held, detuned chord pad (fades in 60 ms, rings 350 ms into the next chord)
  Tone.prototype.pad = function (notes, t, d) { const ctx = this.ctx, REL = 0.35, end = t + Math.max(0.1, d) + REL, g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.06); g.gain.setValueAtTime(0.5, t + Math.max(0.07, d)); g.gain.exponentialRampToValueAtTime(0.0001, end); d = end - t;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.connect(g); g.connect(this.bus.chords);
    for (const n of notes) for (const det of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midiHz(n); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + d + 0.05); this._keep(o); } };
  // keys: Backline's General-MIDI keyboard voice (single notes for scales, intervals, melodies)
  Tone.prototype.keys = function (n, t, d, vel = 96) { const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = midiHz(n); f.type = 'lowpass'; f.frequency.value = 2400;
    const pk = 0.08 + 0.22 * (vel / 127), sus = 0.35, rel = Math.min(0.25, d * 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.008); g.gain.exponentialRampToValueAtTime(pk * sus + 0.0001, t + Math.min(d, 0.3));
    g.gain.setValueAtTime(pk * sus + 0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + rel);
    o.connect(f); f.connect(g); g.connect(this.bus.keys); o.start(t); o.stop(t + d + rel + 0.05); this._keep(o); };
  // a chord progression the way Backline plays it: held voice-led pad + one legato bass note per beat
  Tone.prototype.progression = function (chords, t0, beatS, beatsEach) { let prev = null, held = null, t = t0;
    chords.forEach((c, i) => { const v = voicing(c); const d = beatsEach * beatS;
      if (v) { for (let b = 0; b < beatsEach; b++) this.bass(v.bass, t + b * beatS, beatS);
        if (c !== held) { let run = d; for (let k = i + 1; k < chords.length && chords[k] === c; k++) run += d; prev = voiceLead(prev, c); this.pad(prev, t, run); held = c; } }
      else held = null;
      t += d; });
    return t; };
  const api = { VERSION, SHARP, FLAT, TONES, pcOf, mod, midiHz, parseChord, noteName, voicing, voiceLead, Tone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BacklineTone = api;
})(typeof window !== 'undefined' ? window : globalThis);
