/* DrumPath — How it works pages marked G1 in build/guide-plan.md §6 (D-044). Same layout every time: in one line · diagram ·
   step by step · with your numbers (live, from this device's data; copes with empty data and old runs, RULES A4) ·
   remember · Show me (opens the real screen, lit up) · related · source + the version it was checked against (RULES C10).
   These pages own the user-facing explanation; RULES / DECISIONS / specs stay the owner of the rules (plan §8). */
'use strict';
const gdD=ts=>new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short'});
const gdPl=(n,w)=>n+' '+w+(n===1?'':'s');
function gdLastLessonRun(){for(let i=state.sessions.length-1;i>=0;i--){const s=state.sessions[i];if(!s.kind&&LBY[s.id]&&s.n>0)return s;}return null;}
const GD_HOW=[
 {id:'scoring',area:'Practise',t:'Scoring a run',src:'RULES B1, B6 · pattern-spec · D-023',
  line:()=>`Each note counts as on time if you hit it within ±${state.set.tol} ms.`,
  dg:()=>`<div class="gddg gdwin"><span class="bad">early ✗</span><span class="ok">±${state.set.tol} ms ✓</span><span class="bad">late ✗</span></div>`,
  steps:()=>[`Each hit is matched to the nearest note on its pad (from Level 4, within the note's own match window).`,`Within ±${state.set.tol} ms → on time. Further off, a wrong pad or no hit → missed; a hit with no note → extra.`,`Score = notes on time ÷ all the notes. ${state.set.pass} % or more = a clean run.`,`Dynamics (accents, ghosts) compare each hit with your own run’s normal loudness, never fixed numbers.`],
  mine:()=>{const r=gdLastLessonRun();if(!r)return 'No lesson run yet: your first one shows here.';const ok=r.score>=state.set.pass;
    return `<b>${esc(r.id)}</b> at ${r.bpm} BPM, ${gdD(r.ts)}: ${r.on} of ${r.n} on time = <b>${r.score} %</b> ${ok?'✓ clean':'(clean needs '+state.set.pass+' %)'}${r.avg!=null&&isFinite(r.avg)?` · on average ${Math.abs(r.avg)} ms ${r.avg<0?'early':r.avg>0?'late':'on the beat'}`:''}${r.dyn!=null?` · dynamics ${r.dyn} %`:''}.`;},
  rem:'Slow and clean first (coach rule D1).',show:{at:gdPracAt,el:'#go',t:'Play a run: the result shows this score, pad by pad.'},rel:['pass']},
 {id:'pass',area:'Practise',t:'The pass rule & tempo steps',src:'RULES B1, B2 · D2',
  line:()=>'Three clean runs in a row at the target tempo, then the target goes up.',
  dg:()=>`<div class="gddg gdpass"><i class="ok">✓</i><i class="ok">✓</i><i class="ok">✓</i><span>→ +5 BPM</span><span class="mut">· a miss resets the count</span></div>`,
  steps:()=>[`A clean run = ${state.set.pass} % on time${state.set.dynPass?` (and ${state.set.dynPass} % dynamics where they’re scored)`:''} at or above the target tempo.`,'Three clean runs in a row → the target goes up by the lesson’s step (usually +5 BPM).','At the goal tempo, three in a row → mastered.','A run below the target can pass, but doesn’t count towards the three. Failed twice at one tempo? Drop 10 BPM and rebuild (D2).'],
  mine:()=>{const id=gdLesson(),l=LBY[id],p=state.prog[id]||{},rs=state.sessions.filter(s=>s.id===id).slice(-5);
    return `<b>${esc(id+' '+l.t)}</b>: target ${p.bpm||l.bpm[0]} BPM (goal ${l.bpm[0]} → ${l.bpm[1]}) · clean in a row ${p.streak||0} of 3 · best ${p.best||0} % · ${gdPl(p.attempts||0,'run')}${rs.length?` · last ${rs.length}: ${rs.map(s=>s.score>=state.set.pass?'✓':'✗').join(' ')}`:''}.`;},
  rem:'A clean run at 80 beats a sloppy one at 100.',show:{at:gdLessonAt,el:'#view .card.stat',t:'Your target tempo and the step it goes up by.'},rel:['scoring']},
 {id:'today',area:'Today',t:'How Today’s plan is built',src:'D-035, D-038, D-041',
  line:()=>'Each day the app builds a short plan from where you are, in four phases.',
  dg:()=>`<div class="gddg gdph"><span>Learn</span>→<span>Practise</span>→<span>Check</span>→<span>Revise</span></div>`,
  steps:()=>['<b>On the go</b> (phone, no kit): a new theory card, a tap drill on the screen pads, a gap click, the ear game, Revise, one journal line.','<b>At the kit</b> (10 / 20 / 40 min): warm-up, a gap click, your current lesson as the focus, a review, a mix, a song or free play, the journal.','The plan is kept for the day, so it doesn’t shift under you. Lookups and misses come back in tomorrow’s Revise.','Any practice day keeps the gentle streak: minutes, a Today item, a review or reading a card.'],
  mine:()=>{let pl=null;try{pl=p1Plan(p1Mode(),p1Mins());}catch(_){}if(!pl)return 'Open Home to build today’s plan.';const it=pl.items,ph={};it.forEach(x=>{const k=typeof qlPhase==='function'?qlPhase(x.k):'Practise';ph[k]=(ph[k]||0)+1;});
    const tot=Math.round(it.reduce((a,x)=>a+(+x.mins||0),0)),dn=it.filter(x=>pl.done[x.key]).length;
    return `Today, <b>${p1Mode()==='go'?'On the go':'At the kit · '+p1Mins()+' min'}</b>: ${gdPl(it.length,'item')}, about ${tot} min — ${Object.entries(ph).map(([k,n])=>k+' '+n).join(' · ')}. ${dn} done. ${String(p1StreakLine()).replace(/<[^>]+>/g,'')}`;},
  rem:'Short and every day beats long and rare.',show:{at:'home',el:'#p1today .p1h',t:'Today’s plan, on Home.'},rel:['gap']},
 {id:'gap',area:'Time feel',t:'The gap-click ladder',src:'D-041 · coach rule D2',
  line:()=>'The click drops out for a while: keep playing, and land on time when it comes back.',
  dg:()=>`<div class="gddg gdgap"><span>click</span><span class="q">gap · keep going</span><span>click is back ← ±${TF_RET} ms?</span></div>`,
  steps:()=>[`Ten steps: 1-bar gaps (60 → 72 BPM), 2-bar gaps, 4-bar gaps, then sparse clicks (on 2 & 4, beat 4 only, the “&”, a quarter click at 40 BPM).`,`Clean = you keep playing (90 % of the gap notes) and are within ±${TF_RET} ms when the click returns.`,`${TF_UP} clean in a row → up one step; ${TF_DOWN} rough in a row → back one. Steps you pick by hand don’t move it.`,'The kit and the screen pads keep separate ladders.'],
  mine:()=>['kit','touch'].map(s=>{const ld=tfLad(s);return `<b>${s==='kit'?'Kit':'Screen pads'}</b>: step ${ld.s+1} of ${TF_GAP.length} (${esc(tfStepName(ld.s))}) · ${ld.ok} of ${TF_UP} clean${ld.bad?' · '+ld.bad+' rough':''}`;}).join('<br>')+(()=>{const g=state.sessions.filter(s=>s.id==='time:gap'&&s.tf&&s.tf.dr).slice(-1)[0];return g?`<br>Last gap click ${gdD(g.ts)}: ${g.tf.dr.map(d=>d==null?'—':(d>0?'+':'')+Math.round(d)+' ms').join(' · ')}`:'<br>No gap click played yet.';})(),
  rem:'Count in your head through the gap.',show:{at:'time',el:'#view .tfl',t:'Your ladder; the lit step is where you are.'},rel:['today']},
 {id:'kitremote',area:'Kit',t:'Kit remote',src:'D-040 · kit-reference (C4)',
  line:()=>'Learned pad hits work as buttons, so you can drive the app with sticks in your hands.',
  dg:()=>`<table class="gddg gdkr">${KP_ACTS.map(a=>`<tr><td>${esc(a.n)}</td><td>${esc(kpMapped(a.k)?kpPadName(a.k):a.sug)}</td></tr>`).join('')}</table>`,
  steps:()=>['Nothing works until it is learned on your kit: Kit › Kit remote › <b>Learn all</b> (no pad note is measured in the app yet).',`A double = two hits ${KP_DBL[0]}–${KP_DBL[1]} ms apart; “together” = within ${KP_CHORD} ms.`,'Off during a run and its count-in, a routine, the free-play timer, recording, pad learning and for 1.5 s after a run, so a crash in a groove never stops anything.','While a tour is open: high tom = Next, rim = Back, kick + pedal = close.'],
  mine:()=>{const r=kpR(),ls=KP_ACTS.filter(a=>kpMapped(a.k));return `Remote <b>${r.on?'on':'off'}</b> · kit ${kpKit()?'connected':'not connected'} · ${ls.length?'learned: '+ls.map(a=>esc(a.n+' = '+kpPadName(a.k))).join(' · '):'nothing learned yet: tap Learn all at the kit'}.`;},
  rem:'Learn the pads once per kit; it syncs to your other devices.',show:{at:'kit',el:'#kpcard',t:'The Kit remote card: Learn all is here.'},rel:[]},
 {id:'data',area:'Data',t:'Where your data lives',src:'D-018, D-021, D-022, D-043 · RULES A3',
  line:()=>'On this device first, copied to your Google Drive when connected; the claude.ai copy saves nothing.',
  dg:()=>`<div class="gddg gddata"><span>This device<br><small>IndexedDB</small></span>⇄<span>Your Drive<br><small>sync + snapshots</small></span><span class="mut">claude.ai = testing mode</span></div>`,
  steps:()=>['Every change is saved on this device at once; each save has a number that only goes up, so an old tab can never overwrite newer progress.','With Drive connected, both copies are merged (nothing is dropped) and synced; your other devices pick it up.','DrumPath on claude.ai runs in testing mode: you can try everything, nothing is saved.','<b>Export backup</b> (Settings) writes one file with everything. Do it before a big update.'],
  mine:()=>{const runs=state.sessions.length,cards=Object.keys((state.theory||{}).cards||{}).length;
    return `${SANDBOX?'<b>Testing mode</b>: nothing is saved on this device. ':''}This device: ${typeof STORE!=='undefined'&&STORE.mode==='idb'?'IndexedDB':'browser storage'} · save #${state.rev||0} · ${gdPl(runs,'run')}, ${gdPl(cards,'card')} read · last backup ${state.lastBackup?gdD(state.lastBackup):'never'} · Drive ${driveOn()?'on'+(DRV.lastSync?', synced '+gdD(DRV.lastSync):''):'not connected'}.`;},
  rem:'Export a backup before every update that touches your data.',show:{at:'settings',el:['#storagecard','#view [data-act="export"]'],t:'Storage and Backup in Settings.'},rel:[]},
];
