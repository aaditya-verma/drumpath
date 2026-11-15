// Headless helpers for DrumPath checks (v35). Needs Playwright + Chrome; serve the repo first, e.g.
//   python3 -m http.server 8135   (from the repo root)   then   node tools/headless/<check>.mjs http://localhost:8135
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (_) { pw = require('/opt/npm-tools/node_modules/playwright'); }
export const chromium = pw.chromium;
export async function launch() {
  const exe = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => { try { require('fs').accessSync(p); return true; } catch (_) { return false; } });
  return chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
}
// a page that never reaches the network (fonts, Google scripts) and waits until storage has loaded
export async function open(ctx, url, opt = {}) {
  const p = await ctx.newPage();
  if (opt.viewport) await p.setViewportSize(opt.viewport);
  await p.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort());
  p.on('pageerror', e => { (p._errs = p._errs || []).push(String(e)); });
  if (opt.init) await p.addInitScript(opt.init.fn, opt.init.arg);
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof bootReady !== 'undefined' && bootReady, null, { timeout: 30000 });
  await p.waitForTimeout(opt.settle ?? 300);
  return p;
}
export const settle = p => p.waitForFunction(() => typeof STORE === 'undefined' || (!STORE.writing && !STORE.refreshing && !STORE.again), null, { timeout: 20000 }).then(() => p.waitForTimeout(150));
export function report(name, rows) { let bad = 0; for (const [n, ok, d] of rows) { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? '  — ' + d : '')); } console.log(`${name}: ${rows.length - bad}/${rows.length}`); return bad; }
