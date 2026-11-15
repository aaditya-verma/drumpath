// Re-simulates every Level 0–4 exercise in 6 modes through the real engine (buildRun → hit → finish), with seeded
// jitter so two builds can be compared run for run. Usage: node resim.mjs <base-url> [out.json]
// Modes: perfect, jitter 15 ms, jitter 40 ms, wrong dynamics, wrong sound, no graces. Compares score, dynamics,
// per-pad records and every stored hit (the stored run minus its timestamps).
import fs from 'node:fs';
import { launch, open } from './lib.mjs';
const base = process.argv[2] || 'http://localhost:8135', outFile = process.argv[3];
const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1200, height: 760 } });
const p = await open(ctx, base + '/?test=1', { settle: 800 });
const res = await p.evaluate(async () => {
  const MODES = [['ok', 0], ['ok', 15], ['ok', 40], ['dyn', 0], ['art', 0], ['nograce', 0]];
  let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const out = {}; let n = 0, ex = 0;
  const lessons = LESSONS.filter(l => l.type === 'play' && /^[0-4]\./.test(l.id) && !l.calib);
  for (const l of lessons) {
    for (let i = 0; i < l.ex.length; i++) {
      ex++;
      for (const [mode, jit] of MODES) {
        seed = (ex * 97 + jit * 13 + mode.length) | 0 || 1;
        state.sessions = []; state.prog = {}; closeSheets();
        openPractice(l.id); exI = i; bpm = l.bpm ? l.bpm[0] : 60;
        const R = buildRun(L, L.ex[exI], bpm, 10000, { calib: L.calib }); R.startPerf = performance.now(); R.nodes = []; R.t0 = 0; run = R;
        const even = R.ex.dyn === 'even', hs = [];
        R.evs.forEach(e => { if (e.listen) return; const j = jit ? (rnd() * 2 - 1) * jit : 0, tt = e.t + j + state.lat;
          if (e.gr && mode !== 'nograce') for (let k = e.gr; k >= 1; k--) hs.push([tt - 30 * k, e.v, mode === 'dyn' ? 95 : 45, e.art]);
          hs.push([tt, e.v, simVel(e, mode, even), e.art ? (mode === 'art' ? (e.art === 'open' ? 'closed' : e.art === 'closed' ? 'open' : e.art === 'rim' ? 'head' : 'rim') : e.art) : undefined]); });
        hs.sort((a, b) => a[0] - b[0]).forEach(h => hit(h[1], h[2], h[0], h[3]));
        try { finish(); } catch (e) { out[l.id + '#' + i + ':' + mode + jit] = 'ERR ' + e.message; continue; }
        const s = state.sessions[state.sessions.length - 1];
        const c = s ? JSON.parse(JSON.stringify(s)) : null; if (c) { delete c.ts; delete c.dur; delete c.ms; }
        out[l.id + '#' + i + ':' + mode + jit] = c; n++;
      }
    }
  }
  $('#prac').classList.add('hidden'); L = null;
  return { n, ex, out };
});
await b.close();
if (outFile) fs.writeFileSync(outFile, JSON.stringify(res.out));
console.log(`${res.ex} exercises × 6 modes = ${res.n} runs simulated`);
if (process.argv[4]) { const a = JSON.parse(fs.readFileSync(process.argv[4], 'utf8')); const keys = new Set([...Object.keys(a), ...Object.keys(res.out)]); let d = 0;
  for (const k of keys) if (JSON.stringify(a[k]) !== JSON.stringify(res.out[k])) { if (d < 5) console.log('DIFF', k); d++; }
  console.log(d ? `${d} runs differ` : `identical to ${process.argv[4]} (${keys.size} runs)`); process.exit(d ? 1 : 0); }
