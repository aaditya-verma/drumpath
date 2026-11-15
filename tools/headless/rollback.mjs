// Fix-queue v35 item 1: reproduce the 15 Nov rollback (stale/frozen second tab + a failed pre-write check + resume without
// refresh) and check that a lower-rev state can never overwrite a newer one. Usage: node rollback.mjs <base-url> [--expect-bug]
import { launch, open, settle, report } from './lib.mjs';
const base = process.argv[2] || 'http://localhost:8135', expectBug = process.argv.includes('--expect-bug');
const b = await launch(), rows = [], T = (n, ok, d) => rows.push([n, !!ok, d || '']);
const stored = p => p.evaluate(async () => { const db = await idbOpen(); const a = await idbReadAll(db); db.close(); const c = Object.values(((a.state || {}).theory || {}).cards || {});
  return { rev: a.state && a.state.rev, runs: a.runs.length, cards: c.filter(x => x.r || x.u).length, und: c.filter(x => x.u).length }; });
const act = (p, f, arg) => p.evaluate(f, arg);
// helpers inside the page
const addCard = (i, und) => { const id = TH_ORDER[i].id; const c = state.theory.cards[id] = state.theory.cards[id] || {}; c.r = c.r || Date.now(); if (und) c.u = Date.now(); save(); };
const addRun = ts => { state.sessions.push({ ts, id: '1.2.02', bpm: 60, score: 90 }); save(); };
const failNextTx = n => { const o = IDBDatabase.prototype.transaction; window.__fail = n; IDBDatabase.prototype.transaction = function (...a) { if (window.__fail > 0) { window.__fail--; throw new DOMException('The database connection is closing.', 'InvalidStateError'); } return o.apply(this, a); }; };
const freeze = () => { if (typeof BC !== 'undefined' && BC) BC.onmessage = null; };   // a frozen tab gets no messages
try {
  // ---------- scenario 1: the 15 Nov sequence ----------
  {
    const ctx = await b.newContext(); const A = await open(ctx, base + '/');
    await act(A, addRun, 1e12); await act(A, addCard, 0); await act(A, addCard, 1); await settle(A);
    await act(A, freeze);                                  // ~13:05: tab A goes to the background with this state in memory
    const B = await open(ctx, base + '/');                 // the owner keeps practising in another tab
    for (let i = 2; i < 10; i++) await act(B, addCard, [i, true]).catch(() => 0);
    await B.evaluate(() => { for (let i = 2; i < 10; i++) { const id = TH_ORDER[i].id; state.theory.cards[id] = { r: Date.now(), u: Date.now() }; save(); } });
    await act(B, addRun, 2e12); await act(B, addRun, 3e12); await settle(B);
    const sB = await stored(B); await B.close();
    // ~18:00: tab A resumes without a refresh; its first transaction fails (connection closing), then it saves
    await act(A, failNextTx, 1); await act(A, addCard, 10); await settle(A); await A.waitForTimeout(400); await settle(A);
    const C = await open(ctx, base + '/'); const sC = await stored(C);
    const exp = await A.evaluate(async () => { let blob = null; const o = URL.createObjectURL; URL.createObjectURL = x => { blob = x; return 'blob:x'; }; try { await exportData(); } finally { URL.createObjectURL = o; } const s = JSON.parse(await blob.text()); const c = Object.values(s.theory.cards); return { rev: s.rev, runs: s.sessions.length, cards: c.filter(x => x.r || x.u).length, und: c.filter(x => x.u).length }; });
    const log = await A.evaluate(() => typeof slogRead === 'function' ? slogRead().map(e => e.ev) : null);
    const lost = sC.rev < sB.rev || sC.und < sB.und;
    console.log('stored after tab B:', JSON.stringify(sB), '\nstored after stale tab A:', JSON.stringify(sC), '\nexport from tab A:', JSON.stringify(exp), '\nsave log (A):', JSON.stringify(log));
    if (expectBug) { T('v34 reproduces the rollback: stored rev goes down and understood cards are lost', lost, `rev ${sB.rev} → ${sC.rev}, understood ${sB.und} → ${sC.und}`);
      T('v34: a backup exported from the stale tab is the old copy', exp.und < sB.und, `export understood ${exp.und} of ${sB.und}`); }
    else {
      T('Stored rev never goes down after the stale tab saves', sC.rev > sB.rev, `rev ${sB.rev} → ${sC.rev}`);
      T('Nothing from the newer tab is lost (runs, cards, understood)', sC.runs >= sB.runs && sC.und >= sB.und && sC.cards >= sB.cards + 1, JSON.stringify(sC));
      T('The stale tab’s own new card is kept too', sC.cards === sB.cards + 1, sC.cards + ' cards');
      T('A backup exported from the stale tab includes everything', exp.und >= sB.und && exp.runs >= sB.runs && exp.cards === sC.cards, JSON.stringify(exp));
      T('Save log shows the retry and the merge', log && log.includes('retry') && log.includes('merge'), (log || []).join(','));
    }
    await ctx.close();
  }
  if (!expectBug) {
    // ---------- scenario 2: the check keeps failing → nothing is written, banner, stash merged on the next start ----------
    { const ctx = await b.newContext(); const A = await open(ctx, base + '/');
      await act(A, addCard, 0); await act(A, addCard, [1, true]).catch(() => 0); await settle(A); const s0 = await stored(A);
      await act(A, failNextTx, 999); await act(A, addCard, 5); await A.waitForTimeout(2500); await settle(A).catch(() => 0);
      await A.evaluate(() => { window.__fail = 0; });
      const s1 = await stored(A); const bar = await A.evaluate(() => { const e = document.querySelector('#stbar'); return e ? e.textContent : ''; });
      const stash = await A.evaluate(() => !!localStorage.getItem('drumpath.v1.emergency'));
      T('Persistent failure: nothing is written to the store', s1.rev === s0.rev && s1.cards === s0.cards, `rev ${s0.rev} → ${s1.rev}`);
      T('Persistent failure: a warning banner says the change isn’t saved', /wasn’t saved/.test(bar), bar.slice(0, 60));
      T('Persistent failure: the change is stashed on the device', stash);
      await A.close(); const C = await open(ctx, base + '/', { settle: 800 }); await settle(C); const s2 = await stored(C);
      const left = await C.evaluate(() => !!localStorage.getItem('drumpath.v1.emergency'));
      T('Next start merges the stashed change back in and clears the stash', s2.cards === s0.cards + 1 && !left && s2.rev > s0.rev, JSON.stringify(s2));
      await ctx.close(); }
    // ---------- scenario 3: an older copy was written over the store (e.g. by an old v34 tab) → the next save merges ----------
    { const ctx = await b.newContext(); const A = await open(ctx, base + '/');
      for (let i = 0; i < 4; i++) await act(A, addCard, i); await settle(A); const s0 = await stored(A);
      await A.evaluate(async () => { const db = await idbOpen(); const tx = db.transaction(['state'], 'readwrite'); const st = tx.objectStore('state'); const r = await idbReq(st.get('main'));
        r.rev = 1; r.theory.cards = {}; st.put(r, 'main'); await new Promise(res => tx.oncomplete = res); db.close(); });
      await act(A, addCard, 6); await settle(A); const s1 = await stored(A);
      T('A lower-rev copy in the store is merged, not trusted: nothing lost', s1.cards === s0.cards + 1 && s1.rev > s0.rev, `${s0.cards} → ${s1.cards} cards, rev ${s0.rev} → ${s1.rev}`);
      // a newer app version wrote the store → this tab refuses to write and asks for a reload
      await A.evaluate(async () => { const db = await idbOpen(); const tx = db.transaction(['state'], 'readwrite'); const st = tx.objectStore('state'); const r = await idbReq(st.get('main')); r.app = 99; r.rev += 3; st.put(r, 'main'); await new Promise(res => tx.oncomplete = res); db.close(); });
      const before = await stored(A); await act(A, addCard, 8); await A.waitForTimeout(800); const after = await stored(A);
      const bar = await A.evaluate(() => { const e = document.querySelector('#stbar'); return e ? e.textContent : ''; });
      T('Data saved by a newer app version is never overwritten by this tab', after.rev === before.rev && after.cards === before.cards, `rev ${before.rev} → ${after.rev}`);
      T('…and the banner asks to reload', /updated in another tab/.test(bar), bar.slice(0, 50));
      await ctx.close(); }
    // ---------- scenario 4: resume → refresh before the next save (pageshow / focus / visibility) ----------
    { const ctx = await b.newContext(); const A = await open(ctx, base + '/'); await act(A, addCard, 0); await settle(A); await act(A, freeze);
      const B = await open(ctx, base + '/'); await B.evaluate(() => { for (let i = 1; i < 6; i++) { state.theory.cards[TH_ORDER[i].id] = { r: Date.now(), u: Date.now() }; save(); } }); await settle(B); await B.close();
      const r = await A.evaluate(async () => { const before = Object.keys(state.theory.cards).length; dispatchEvent(new Event('focus')); const id = TH_ORDER[7].id; state.theory.cards[id] = { r: Date.now() }; save();
        await new Promise(r => setTimeout(r, 900)); return { before, after: Object.keys(state.theory.cards).length, log: slogRead().slice(-4).map(e => e.ev) }; });
      const s = await stored(A);
      T('On focus the tab refreshes before saving (its memory catches up)', r.after === 7 && r.before === 1, JSON.stringify(r));
      T('…and the save that follows writes the union', s.cards === 7, s.cards + ' cards');
      // pageshow + visibilitychange listeners exist
      const ls = await A.evaluate(() => typeof storeResume === 'function');
      T('Resume hooks: visibilitychange, pageshow, focus, resume', ls);
      await ctx.close(); }
    // ---------- scenario 4b: owner's extra (a): the merge itself fails → the lower-rev write is refused; (b) pageshow refreshes first ----------
    { const ctx = await b.newContext(); const A = await open(ctx, base + '/'); await act(A, addCard, 0); await settle(A); await act(A, freeze);
      const B = await open(ctx, base + '/'); await B.evaluate(() => { for (let i = 1; i < 5; i++) { state.theory.cards[TH_ORDER[i].id] = { r: Date.now(), u: Date.now() }; save(); } }); await settle(B); await B.close(); await A.waitForTimeout(300); const sB = await stored(A);
      await A.evaluate(() => { const o = mergeStates; window.__mfail = 99; window.mergeStates = (...a) => { if (window.__mfail-- > 0) throw new Error('merge broke'); return o(...a); }; state.theory.cards[TH_ORDER[8].id] = { r: Date.now() }; STORE.stale = false; storeSave(); });
      await A.waitForTimeout(2500); await settle(A).catch(() => 0); const s1 = await stored(A);
      T('(a) If the merge fails, the stale tab writes nothing (stored copy untouched)', s1.rev === sB.rev && s1.und === sB.und, `rev ${sB.rev} → ${s1.rev}, understood ${s1.und} · ` + JSON.stringify(await A.evaluate(() => slogRead().slice(-8).map(e => e.ev + ':' + e.from + '>' + (e.to ?? e.cur) + (e.msg ? ':' + e.msg.slice(0, 30) : '')))));
      await A.evaluate(() => { window.__mfail = 0; });
      const r = await A.evaluate(async () => { dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); state.theory.cards[TH_ORDER[9].id] = { r: Date.now() }; save(); await new Promise(r => setTimeout(r, 900)); return slogRead().slice(-3).map(e => e.ev); });
      await settle(A); const s2 = await stored(A);
      T('(b) pageshow refreshes before the next save; the union is written', s2.und === sB.und && s2.cards === sB.cards + 2 && s2.rev > sB.rev && r.includes('refresh'), JSON.stringify(s2) + ' ' + r.join(','));
      await ctx.close(); }
    // ---------- scenario 5: import / reset still replace (higher rev, intentional) ----------
    { const ctx = await b.newContext(); const A = await open(ctx, base + '/'); for (let i = 0; i < 3; i++) await act(A, addCard, i); await settle(A); const s0 = await stored(A);
      await A.evaluate(() => { const m = state.map, ar = state.art, l = state.lat, s = state.set; state = freshState(); state.map = m; state.art = ar; state.lat = l; state.set = s; save(); }); await settle(A); const s1 = await stored(A);
      T('Reset all progress still works and gets a higher rev', s1.cards === 0 && s1.rev > s0.rev, `rev ${s0.rev} → ${s1.rev}`);
      await ctx.close(); }
  }
} finally { await b.close(); }
process.exit(report('rollback ' + base, rows) ? 1 : 0);
