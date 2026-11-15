// RULES C8 layout check: the in-app layoutSweep() on every C8 size, fresh and seeded, in the normal and the at-the-kit view,
// plus 125 % (whole-page zoom) on the tablet sizes. Usage: node layout.mjs <base-url>
import { launch, open } from './lib.mjs';
const base = process.argv[2] || 'http://localhost:8135';
const ONLY = process.env.ONLY; const SIZES0 = [[360, 740], [360, 780], [400, 860], [412, 915], [640, 937], [760, 1200], [780, 360], [800, 1280], [860, 400], [915, 412], [1024, 553], [1200, 760], [1280, 800]];
const SIZES = ONLY ? SIZES0.filter(([w, h]) => ONLY.split(',').includes(w + 'x' + h)) : SIZES0;
const TABLET = new Set(['760x1200', '800x1280', '1024x553', '1200x760', '1280x800']);
const seed = () => {   // a used logbook: runs with per-pad detail, lesson progress, theory cards, minutes, a journal, badges
  const now = Date.now(), DAY = 864e5, play = LESSONS.filter(l => l.type === 'play').slice(0, 14);
  play.forEach((l, i) => { state.prog[l.id] = { bpm: l.bpm[0] + 5, streak: 1, best: 92, bestBpm: l.bpm[0], attempts: 3 + i, ms: 6e5, status: i < 5 ? 'mastered' : 'progress', last: now - i * DAY, ex: 0, masteredAt: i < 5 ? now - (20 - i) * DAY : undefined };
    for (let k = 0; k < 3; k++) state.sessions.push({ ts: now - (i * 2 + k) * DAY / 2, id: l.id, ex: 0, bpm: l.bpm[0], score: 80 + k * 6, on: 18, n: 20, ext: 1, miss: 1, avg: 6 - k, dur: 60, pads: { K: [40, 34, 2, 1, 21, null], S: [40, 37, 1, 0, 3, null] }, hits: Array(20).fill(0).map((_, j) => [j % 2 ? 2 : 7, (j % 5) * 5 - 10, 80]) }); });
  state.sessions.sort((a, b) => a.ts - b.ts);
  TH_ORDER.slice(0, 40).forEach((k, i) => { state.theory.cards[k.id] = { r: now - i * 36e5, ...(i % 2 ? { u: now - i * 36e5 } : {}) }; });
  for (let d = 0; d < 21; d++) { const k = dkey(new Date(now - d * DAY)); if (d % 3 !== 2) state.days[k] = (8 + d % 5) * 6e4; }
  state.journal[dkey(new Date(now - DAY))] = { t: 'Steady at 70 on the rock beat; left hand tired near the end', at: now - DAY };
  ['day1', 'wk3', 'pass1'].forEach((id, i) => { state.reflect.badges[id] = { at: now - (10 - i) * DAY, got: now - DAY }; });
  state.songs = state.songs || []; if (typeof render === 'function') render();
};
const b = await launch(); let views = 0, total = 0; const flags = [];
for (const [w, h] of SIZES) for (const seeded of [false, true]) for (const kit of ['off', 'on']) for (const zoom of TABLET.has(w + 'x' + h) ? [1, 1.25] : [1]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await open(ctx, base + '/?test=1', { settle: 500, init: { fn: k => { try { localStorage.setItem('drumpath.kitView', JSON.stringify(k)); } catch (_) {} }, arg: kit } });
  if (zoom !== 1) await p.evaluate(z => { document.documentElement.style.zoom = z; dispatchEvent(new Event('resize')); }, zoom);
  if (seeded) await p.evaluate(seed);
  const r = await p.evaluate(async () => { const out = await layoutSweep(); return out.map(([n, is]) => [n, is.map(i => i.kind + ' ' + i.what)]); });
  views = r.length; total++;
  r.forEach(([n, is]) => { if (is.length) flags.push(`${w}×${h}${zoom !== 1 ? ' @125%' : ''} ${seeded ? 'seeded' : 'fresh'} kit-view ${kit} · ${n}: ${is.slice(0, 2).join(' | ')}`); });
  if (p._errs) flags.push(`${w}×${h} page errors: ${p._errs.slice(0, 2).join(' | ')}`);
  await ctx.close();
}
await b.close();
console.log(`${views} views × ${total} configurations (13 sizes × fresh/seeded × normal/at-the-kit view, + 125 % on the tablet sizes)`);
const uniq = [...new Set(flags)]; uniq.forEach(f => console.log('FLAG ' + f)); console.log(uniq.length ? uniq.length + ' flags' : 'no problems');
