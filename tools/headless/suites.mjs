// Runs every in-app test suite under ?test=1 and prints pass counts. Usage: node suites.mjs <base-url>
import { launch, open, report } from './lib.mjs';
const base = process.argv[2] || 'http://localhost:8135';
const SUITES = [['sandbox', 'sandboxTests'], ['storage', 'storageTests'], ['drive', 'driveTests'], ['analyse', 'analyseTests'], ['studio', 'studioTests'], ['songs', 'songTests'],
  ['compare', 'compareTests'], ['library', 'libTests'], ['notation', 'notationTests'], ['theory', 'theoryTests'], ['T3', 'thT3Tests'], ['T4', 'thT4Tests'], ['daily plan', 'p1Tests'],
  ['quick look', 'p1bTests'], ['kit remote', 'p2Tests'], ['time feel', 'p3Tests'], ['reflection', 'p4Tests']];
const b = await launch(); const ctx = await b.newContext({ viewport: { width: 1200, height: 760 } });
const p = await open(ctx, base + '/?test=1', { settle: 800 });
const rows = []; const sum = [];
for (const [n, f] of SUITES) {
  const r = await p.evaluate(async f => { if (typeof window[f] !== 'function' && typeof eval(f) !== 'function') return { err: 'missing' };
    try { const out = await eval(f)(); const a = Array.isArray(out) ? out : (out && out.rows) || []; return { n: a.length, ok: a.filter(x => x.pass || x.ok).length, bad: a.filter(x => !(x.pass || x.ok)).map(x => x.name + ' — ' + (x.det || x.d || '')) }; }
    catch (e) { return { err: String(e && e.stack || e).slice(0, 300) }; } }, f);
  if (r.err) { rows.push([n, false, r.err]); continue; }
  sum.push(`${n} ${r.ok}/${r.n}`); rows.push([`${n} ${r.ok}/${r.n}`, r.ok === r.n && r.n > 0, r.bad.slice(0, 5).join(' | ')]);
}
// fix-queue item 5: after all suites, nothing simulated is left in memory
const left = await p.evaluate(() => ({ badges: Object.keys(state.reflect.badges).length, cards: Object.keys(state.theory.cards).length, runs: state.sessions.length }));
rows.push(['After every suite, no badges / theory cards / runs are left in memory (item 5)', left.badges === 0 && left.cards === 0 && left.runs === 0, JSON.stringify(left)]);
if (p._errs) console.log('page errors:', p._errs.slice(0, 5));
await b.close(); console.log(sum.join(', '));
process.exit(report('suites ' + base, rows) ? 1 : 0);
