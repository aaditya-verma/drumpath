// G1 Guide (D-044): every tour step's page + target, the bubble on screen / off the pads / off its target / C8-clean,
// on all 13 C8 sizes (+ 125 % on the tablet sizes), fresh and seeded, in the normal and the at-the-kit view; then the
// in-app guide tests once. Seeded = a used logbook, or a real backup: SEED=/path/backup.json (loaded in memory only,
// ?test=1 saves nothing). Usage: node guide.mjs <base-url>   (ONLY=360x740,… to limit sizes; PAR=4 contexts at once)
import fs from 'node:fs';
import { launch, open } from './lib.mjs';
const base = process.argv[2] || 'http://localhost:8135';
const SIZES0 = [[360, 740], [360, 780], [400, 860], [412, 915], [640, 937], [760, 1200], [780, 360], [800, 1280], [860, 400], [915, 412], [1024, 553], [1200, 760], [1280, 800]];
const SIZES = process.env.ONLY ? SIZES0.filter(([w, h]) => process.env.ONLY.split(',').includes(w + 'x' + h)) : SIZES0;
const TABLET = new Set(['760x1200', '800x1280', '1024x553', '1200x760', '1280x800']);
const SEED = process.env.SEED ? JSON.parse(fs.readFileSync(process.env.SEED, 'utf8')) : null;
const seedFn = s => { if (s) { const n = normaliseState(s); Object.keys(n).forEach(k => { state[k] = n[k]; }); state.set = Object.assign({}, state.set, n.set); }
  else { const now = Date.now(), DAY = 864e5; LESSONS.filter(l => l.type === 'play').slice(0, 10).forEach((l, i) => { state.prog[l.id] = { bpm: l.bpm[0] + 5, streak: 1, best: 92, bestBpm: l.bpm[0], attempts: 3, ms: 6e5, status: 'progress', last: now - i * DAY, ex: 0 };
      state.sessions.push({ ts: now - i * DAY, id: l.id, ex: 0, bpm: l.bpm[0], score: 88, on: 18, n: 20, ext: 1, miss: 1, avg: 6, dur: 60, pads: { S: [20, 18, 1, 1, 6, null] }, hits: [[5, 4, 80]] }); });
    TH_ORDER.slice(0, 20).forEach((k, i) => { state.theory.cards[k.id] = { r: now - i * 36e5 }; }); }
  if (typeof render === 'function') render(); };
const jobs = [];
for (const [w, h] of SIZES) for (const seeded of [false, true]) for (const kit of ['off', 'on']) for (const zoom of TABLET.has(w + 'x' + h) ? [1, 1.25] : [1]) jobs.push({ w, h, seeded, kit, zoom });
const b = await launch(); const flags = []; let steps = 0, cfgs = 0;
async function runJob(j) {
  const ctx = await b.newContext({ viewport: { width: j.w, height: j.h } });
  const p = await open(ctx, base + '/?test=1', { settle: 500, init: { fn: k => { try { localStorage.setItem('drumpath.kitView', JSON.stringify(k)); } catch (_) {} }, arg: j.kit } });
  if (j.zoom !== 1) await p.evaluate(z => { document.documentElement.style.zoom = z; dispatchEvent(new Event('resize')); }, j.zoom);
  if (j.seeded) await p.evaluate(seedFn, SEED);
  const rows = await p.evaluate(async () => await gdWalkAll({ runMs: 25000 }));
  const tag = `${j.w}×${j.h}${j.zoom !== 1 ? ' @125%' : ''} ${j.seeded ? 'seeded' : 'fresh'} kit-view ${j.kit}`;
  rows.forEach(r => { steps++; const bad = r.issues.length || !r.here || !(r.el || r.why); if (bad) flags.push(`${tag} · ${r.tour}#${r.i + 1} (${r.page}${r.here ? '' : ', not on its page'}${r.el ? '' : r.why ? ', target missing (says why)' : ', TARGET MISSING'}) ${r.issues.join(' | ')}`); });
  if (p._errs) flags.push(`${tag} page errors: ${p._errs.slice(0, 2).join(' | ')}`);
  cfgs++; await ctx.close();
}
const PAR = +(process.env.PAR || 4); const q = jobs.slice();
await Promise.all(Array.from({ length: PAR }, async () => { while (q.length) await runJob(q.shift()); }));
// the in-app suite once, on a phone and on the tablet
for (const [w, h] of [[400, 860], [1200, 760]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await open(ctx, base + '/?test=1', { settle: 800 });
  const t = await p.evaluate(async () => (await gdTests()).map(x => [x.pass, x.name, x.det]));
  const bad = t.filter(x => !x[0]); console.log(`guide tests ${w}×${h}: ${t.length - bad.length}/${t.length}`); bad.forEach(x => flags.push(`gdTests ${w}×${h}: ${x[1]} — ${x[2]}`));
  await ctx.close();
}
await b.close();
console.log(`${steps} tour steps checked over ${cfgs} configurations (13 sizes × fresh/seeded × normal/at-the-kit view, + 125 % on the tablet sizes)`);
const uniq = [...new Set(flags)]; uniq.forEach(f => console.log('FLAG ' + f)); console.log(uniq.length ? uniq.length + ' flags' : 'no problems');
process.exit(uniq.length ? 1 : 0);
