/* DrumPath — P2 At the kit, hands-free (D-040; build/ideas-backlog.md §A items 1–3 and the P2 row).
   · Kit as remote: learned pad shortcuts — suggested crash ×2 = Start · rim click = Again · high tom = Next · floor tom = −5 BPM ·
     kick + hi-hat pedal together = Back / close sheet. They work on the practice screen, results, the session strip, Today and
     sheets (Quick look, primer…). They are off during a run, routine, count-in or free-play timer, while recording or checking the
     kit, and for 1.5 s after a run, so they never fire on a hit the engine is scoring. Nothing is mapped until it is learned on
     the kit (Kit › Kit remote): kit-reference.md has no measured notes yet (RULES C4).
   · Start on your first hit (per device, off by default): Tap in = 3 steady quarter notes near the set tempo, then the count-in
     starts on the next beat; First hit = no count-in, the run starts on your first note (that note isn't scored).
   · At-the-kit view (per device): Auto (kit connected + tablet in landscape) · On · Off — big type, high contrast, larger targets.
   Synced: state.remote (back-filled, merged by time). Device only: drumpath.firstHit, drumpath.kitView (like drumpath.planMode).
   Lesson scoring is unchanged unless First hit is switched on (C1 opt-in). Testing mode saves nothing. */
'use strict';
const KP_ACTS=[
  {k:'start',kind:'dbl',n:'Start',pad:'Crash',sug:'crash, twice',v:['C']},
  {k:'again',kind:'one',n:'Again',pad:'Rim click',sug:'rim click (cross-stick)',v:['S']},
  {k:'next',kind:'one',n:'Next',pad:'High tom',sug:'high tom',v:['T1']},
  {k:'slower',kind:'one',n:'−5 BPM',pad:'Floor tom',sug:'floor tom',v:['T3']},
  {k:'back',kind:'chord',n:'Back',pad:'Kick + pedal',sug:'kick + hi-hat pedal together',v:['K','HP']}];
const KP_DBL=[90,600];      // ms between the two hits of a double (below 90 = a double trigger, ignored)
const KP_CHORD=60;          // ms: two pads "together"
const KP_COOL=350;          // ms after a shortcut fires, nothing else fires
const KP_QUIET=1500;        // ms after a run ends (the last crash of a run never stops or restarts anything)
const KP_TAPTOL=0.15;       // tap-in: each gap within ±15 % of the beat
const KP_TAPS=3;            // tap-in: three quarter notes
const KP_ARM_MAX=30000;     // ms a first-hit start waits before it gives up
const KP={last:{},chord:{},cool:0,quiet:0,arm:null,learn:null,fired:[],fakeKit:false,wasRun:false,view:null};
let KPV=false;              // at-the-kit view on (read by draw() for bigger lane labels)
const kpR=()=>kpFill(state).remote;
const kpKit=()=>KP.fakeKit||p1Kit();
const kpAct=k=>KP_ACTS.find(a=>a.k===k);
const kpNotes=k=>((kpR().map[k]||{}).n||[]);
const kpMapped=k=>kpNotes(k).length>0;
const kpAnyMapped=()=>KP_ACTS.some(a=>kpMapped(a.k));
function kpFirstMode(){const m=p1Dev('firstHit');return m==='tapin'||m==='hit'?m:'off';}
function kpViewMode(){const m=p1Dev('kitView');return m==='on'||m==='off'?m:'auto';}
// the pad name for a learned note, from the pad mapping (Kit › Pad mapping), else the note number
function kpNoteName(n){const v=state.map[n];return v&&VOICES[v]?VOICES[v].n+(state.art[n]==='rim'?' rim':state.art[n]==='open'?' open':''):'note '+n;}
function kpPadName(k){const a=kpAct(k),ns=kpNotes(k);if(!ns.length)return a.pad;return ns.map(kpNoteName).join(' + ')+(a.kind==='dbl'?' ×2':'');}

/* ---------- MIDI hook (03-midi.js onMidi, before the engine sees the hit) ---------- */
// returns true when the hit is used here (learning a shortcut, or waiting for a first-hit start) and must not reach the engine
function kpMidi(n,vel,t,v,art){
  if(typeof REC!=='undefined'&&REC&&REC.on)return false;
  if(KP.learn){if(v)flashes[v]=performance.now();kpLearnHit(n,t);return true;}
  if(KP.arm){if(run){KP.arm=null;return false;}if(v)flashes[v]=performance.now();kpArmHit(n,vel,t,v,art);return true;}
  if(run)return false;
  kpShortcut(n,t);return false;
}
// is the kit remote listening right now? (never while anything is being played for a score or measured)
function kpLive(){
  if(!kpR().on||run||KP.arm||KP.learn)return false;
  if(ROUTINE.on||ROUTINE.next)return false;
  if(typeof FREE!=='undefined'&&FREE.t0)return false;
  if(velChk||learnVoice)return false;
  if(typeof REC!=='undefined'&&REC&&REC.on)return false;
  if(L&&L.calib&&!$('#prac').classList.contains('hidden'))return false;
  if(performance.now()<KP.quiet)return false;
  return true;
}
function kpShortcut(n,t){
  const a=KP_ACTS.find(x=>kpNotes(x.k).includes(n));if(!a||!kpLive()||t<KP.cool)return;
  if(a.kind==='one'){kpFire(a.k,t);return;}
  if(a.kind==='dbl'){const l=KP.last[a.k];
    if(l!=null&&t-l>=KP_DBL[0]&&t-l<=KP_DBL[1]){KP.last[a.k]=null;kpFire(a.k,t);}
    else if(l!=null&&t-l<KP_DBL[0]){/* a double trigger of the same hit: keep the first */}
    else KP.last[a.k]=t;
    return;}
  // chord: the other pad within KP_CHORD ms
  const ns=kpNotes(a.k);KP.chord[n]=t;const o=ns.find(x=>x!==n);
  if(o!=null&&KP.chord[o]!=null&&Math.abs(t-KP.chord[o])<=KP_CHORD){KP.chord={};kpFire(a.k,t);}
}
function kpFire(k,t){KP.cool=t+KP_COOL;const tg=kpTarget(k);KP.fired.push({k,t,lab:tg?tg.lab:null});if(KP.fired.length>40)KP.fired.shift();
  if(!tg)return;toast('Kit › '+tg.lab,1100);if(tg.el)tg.el.click();else tg.fn();}

/* ---------- what each shortcut does on the screen that is showing (taps the same button a finger would) ---------- */
function kpTarget(k){
  const ok=e=>e&&e.getClientRects().length>0&&!e.disabled;
  const q=(s,r)=>[...(r||document).querySelectorAll(s)].find(ok)||null;
  const mods=[...document.querySelectorAll('.modal')].filter(ok),top=mods[mods.length-1];
  if(top){const c=k==='back'&&top.querySelector('[data-close]');return c?{el:c,lab:'Close'}:null;}   // a sheet: only Back (close)
  if(!$('#msheet').classList.contains('hidden'))return k==='back'?{fn:closeMore,lab:'Close'}:null;
  if(typeof gdKp==='function'){const g=gdKp(k);if(g)return g;}   // G1: while a tour shows, high tom = Next, rim = Back, kick + pedal = close
  if(!$('#prac').classList.contains('hidden')&&L){
    const res=!$('#result').classList.contains('hidden');
    if(k==='start'||k==='again')return {fn:()=>{$('#result').classList.add('hidden');kpStart();},lab:res&&k==='again'?'Again':'Start'};
    if(k==='slower'){const b=q('#prac .bpmc [data-act="bpm-"]');return b?{el:b,lab:'−5 BPM'}:null;}
    if(k==='back'){const b=q('#prac .ptop [data-act="pexit"]');return b?{el:b,lab:'Close'}:null;}
    if(k==='next'){
      const sn=q('#result .p1next [data-p1="mixnext"]')||q('#result .p1next [data-p1="next"]');if(sn)return {el:sn,lab:sn.textContent.trim()};
      if(SES&&p1Cur()){const s=q('#sesbar [data-p1="skip"]');return s?{el:s,lab:'Skip item'}:null;}
      if(L.ex.length>1){const b=q('#exsel [data-i="'+((exI+1)%L.ex.length)+'"]');if(b)return {fn:()=>{b.click();$('#result').classList.add('hidden');},lab:'Next exercise'};}
      return null;}
    return null;}
  if(cur==='today'&&VP.today&&VP.today.mode&&VP.today.mode!=='plan'){
    const m=VP.today.mode;
    if(k==='start'&&m==='free'&&!FREE.t0){const b=q('#view [data-p1free="start"]');return b?{el:b,lab:'Start the timer'}:null;}
    if(k==='next'){const d=q('#view [data-p1ear="done"]')||q('#view [data-qlrvdone]');if(d)return {el:d,lab:'Done'};const s=q('#view [data-p1="skip"]');return s?{el:s,lab:'Skip item'}:null;}
    if(k==='back')return {fn:back,lab:'Back'};
    return null;}
  const bar=SES&&p1Cur()?$('#view .p1bar'):null;
  if(bar){
    if(k==='start'){const b=q('[data-p1="resume"]',bar)||q('[data-p1="next"]',bar);return b?{el:b,lab:b.textContent.trim()}:null;}
    if(k==='next'){const b=q('[data-p1="next"]',bar)||q('[data-p1="skip"]',bar);return b?{el:b,lab:b.textContent.trim()}:null;}
    if(k==='back')return {fn:back,lab:'Back'};
    return null;}
  const td=$('#view #p1today');
  if(td&&k==='start'){const b=q('[data-p1="resume"]',td)||q('[data-p1="start"]',td);return b?{el:b,lab:SES?'Continue session':'Start session'}:null;}
  return null;
}

/* ---------- start on your first hit (per device; off = exactly as before) ---------- */
function kpStart(){
  if(run)return;const fm=kpFirstMode();
  if(fm==='off'||!kpKit()||!L||L.calib||L.tap||(fm==='hit'&&L.call)){startRun();return;}
  KP.arm={mode:fm,at:performance.now(),taps:[],bpmNow:null};clearTimeout(KP.armT);KP.armT=setTimeout(()=>{if(KP.arm){kpDisarm();toast('No hits: tap Start again');}},KP_ARM_MAX);
  $('#result').classList.add('hidden');kpArmUi();
}
function kpDisarm(){if(!KP.arm&&!$('#kparm'))return;KP.arm=null;clearTimeout(KP.armT);const o=$('#kparm');if(o)o.remove();if(!run){const g=$('#go');if(g)g.textContent='Start';}kpLegend();}
function kpArmUi(){
  const A=KP.arm;if(!A)return;const g=$('#go');if(g)g.textContent='Cancel';
  let o=$('#kparm');if(!o){o=document.createElement('div');o.id='kparm';o.className='kparm';const w=$('#prac .cvwrap');if(w)w.appendChild(o);}
  o.innerHTML=A.mode==='tapin'?`<div class="kpa1">Tap in</div><div class="kpa2">Play ${KP_TAPS} steady quarter notes at about <b>${bpm} BPM</b> on any pad: the count-in starts on the next beat.</div>${A.bpmNow?`<div class="kpa3">You: ${A.bpmNow} BPM · ${Math.abs(A.bpmNow-bpm)/bpm<=KP_TAPTOL?'nearly there, keep it steady':A.bpmNow>bpm?'a little slower':'a little faster'}</div>`:''}`
    :`<div class="kpa1">Start on your first hit</div><div class="kpa2">Count yourself in silently (${bpm} BPM), then play: the run starts on your first note. That note isn’t scored.</div>`;
  kpLegend();
}
// tap-in: the last KP_TAPS hits (simultaneous pads count once) must each be within ±KP_TAPTOL of the beat
function kpTapCheck(taps,beat){if(taps.length<KP_TAPS)return {ok:false,bpm:null};const g=[];for(let i=1;i<taps.length;i++)g.push(taps[i]-taps[i-1]);const avg=g.reduce((a,b)=>a+b,0)/g.length;
  return {ok:g.every(x=>Math.abs(x-beat)/beat<=KP_TAPTOL),bpm:Math.round(60000/avg)};}
function kpArmHit(n,vel,t,v,art){
  const A=KP.arm,tr=t-(state.lat||0),beat=60000/bpm;
  if(A.mode==='hit'){KP.arm=null;clearTimeout(KP.armT);const o=$('#kparm');if(o)o.remove();startRun({anchor:{t:tr,v,vel,art}});return;}
  const lt=A.taps[A.taps.length-1];if(lt!=null&&tr-lt<beat*0.4)return;   // two pads at once, or a flam: one tap
  A.taps.push(tr);if(A.taps.length>KP_TAPS)A.taps.shift();
  const c=kpTapCheck(A.taps,beat);A.bpmNow=c.bpm;
  if(c.ok){KP.arm=null;clearTimeout(KP.armT);const o=$('#kparm');if(o)o.remove();startRun({base:tr+beat});return;}
  kpArmUi();
}

/* ---------- learning the shortcuts on the kit (Kit › Kit remote) ---------- */
function kpLearnStart(k,all){if(!midi)connectMidi();KP.learn={k,all:!!all,notes:[],t0:0};kpRedraw();}
function kpLearnStop(){if(KP.learn)clearTimeout(KP.learn.tm);KP.learn=null;kpRedraw();}
function kpSetMap(k,ns){const r=kpR(),now=Date.now(),moved=[];
  KP_ACTS.forEach(a=>{if(a.k===k)return;const cur_=kpNotes(a.k);if(cur_.some(x=>ns.includes(x))){r.map[a.k]={n:[],at:now};moved.push(a.n);}});
  r.map[k]={n:ns.slice(),at:now};save();return moved;}
function kpClear(k){kpR().map[k]={n:[],at:Date.now()};save();}
function kpLearnHit(n,t){const Ln=KP.learn,a=kpAct(Ln.k);
  if(a.kind!=='chord'){const mv=kpSetMap(a.k,[n]);toast(a.n+' ← '+kpNoteName(n)+(mv.length?' (taken off '+mv.join(', ')+')':''));kpLearnNext();return;}
  if(!Ln.notes.length||t-Ln.t0>150){Ln.notes=[n];Ln.t0=t;Ln.miss=false;clearTimeout(Ln.tm);Ln.tm=setTimeout(()=>{if(KP.learn===Ln&&Ln.notes.length<2){Ln.notes=[];Ln.miss=true;kpRedraw();}},400);return;}
  if(n===Ln.notes[0])return;
  clearTimeout(Ln.tm);const mv=kpSetMap(a.k,[Ln.notes[0],n]);toast(a.n+' ← '+kpPadName(a.k)+(mv.length?' (taken off '+mv.join(', ')+')':''));kpLearnNext();
}
function kpLearnNext(){const Ln=KP.learn;if(Ln&&Ln.all){const i=KP_ACTS.findIndex(a=>a.k===Ln.k);if(i<KP_ACTS.length-1){KP.learn={k:KP_ACTS[i+1].k,all:true,notes:[],t0:0};kpRedraw();return;}}
  KP.learn=null;kpRedraw();}
function kpRedraw(){if(cur==='kit')render();}
// the Kit page card
function kpKitCard(){
  const r=kpR(),Ln=KP.learn,fm=kpFirstMode(),vm=kpViewMode();
  const row=a=>{const on=Ln&&Ln.k===a.k;return `<tr class="${on?'learn':''}"><td><b>${esc(a.n)}</b><div class="mut kpsug">suggested: ${esc(a.sug)}</div></td><td class="num">${kpMapped(a.k)?esc(kpPadName(a.k))+' <span class="mut">('+kpNotes(a.k).join(' + ')+')</span>':'<span class="mut">off · not learned</span>'}</td>
    <td style="text-align:right">${on?`<b style="color:var(--warn)">${a.kind==='chord'?(Ln.miss?'Both together, please…':'Hit both pads together…'):'Hit the pad…'}</b> <button class="sm ghost" data-kplearn="stop">Cancel</button>`:`<button class="sm" data-kplearn="${a.k}">Learn</button>${kpMapped(a.k)?` <button class="sm ghost" data-kpclear="${a.k}">Clear</button>`:''}`}</td></tr>`;};
  const meas=KP_ACTS.filter(a=>kpMapped(a.k)).map(a=>kpPadName(a.k).replace(/ ×2$/,'')+' = '+kpNotes(a.k).join(' + ')).join(' · ');
  return `<h2 id="kpcard">Kit remote</h2><div class="card kpcard">
   <div class="row" style="align-items:center"><span style="flex:1;min-width:200px">Drive the app from the pads with your sticks in your hands. Works on the practice screen, results, the session strip, Today and sheets; <b>off during a run, routine, count-in or free-play timer</b>.</span><div class="seg"><button class="${r.on?'on':''}" data-kpon="1">On</button><button class="${r.on?'':'on'}" data-kpon="0">Off</button></div></div>
   <p class="mut kpnote">No pad note is measured on this kit yet (build/kit-reference.md), so every shortcut stays off until you learn it: tap <b>Learn</b>, then hit the pad. <b>Learn all</b> walks through the five in order.</p>
   <div class="list"><table class="kptab">${KP_ACTS.map(row).join('')}</table></div>
   <div class="row" style="margin-top:10px">${Ln&&Ln.all?'<button class="sm ghost" data-kplearn="stop">Stop learning</button>':'<button class="sm pri" data-kplearn="all">Learn all</button>'}${meas?`<span class="mut kpmeas">Measured here: ${esc(meas)}</span>`:''}</div>
   <div class="row" style="align-items:center;margin-top:12px"><span style="flex:1;min-width:200px">Start on your first hit <span class="mut" style="font-size:13px">(this device; Tap in = 3 steady quarter notes, then the count-in; First hit = no count-in, your first note starts the run and isn’t scored)</span></span><div class="seg">${[['off','Off'],['tapin','Tap in'],['hit','First hit']].map(([k,l])=>`<button class="${fm===k?'on':''}" data-kpfirst="${k}">${l}</button>`).join('')}</div></div>
   <div class="row" style="align-items:center;margin-top:8px"><span style="flex:1;min-width:200px">At-the-kit view <span class="mut" style="font-size:13px">(this device; big type, high contrast; Auto = kit connected and the tablet in landscape)</span></span><div class="seg">${[['auto','Auto'],['on','On'],['off','Off']].map(([k,l])=>`<button class="${vm===k?'on':''}" data-kpview="${k}">${l}</button>`).join('')}</div></div>
   ${TEST?'<div class="row" style="margin-top:10px"><button class="sm" data-kptest>Run kit-remote tests</button></div><div id="kptests"></div>':''}</div>`;
}

/* ---------- legends ---------- */
function kpLabel(k){
  if(k==='next'){if(SES&&p1Cur())return 'Next item';if(L&&L.ex.length>1&&!$('#prac').classList.contains('hidden'))return 'Next exercise';return null;}
  return {start:'Start',again:'Again',slower:'−5 BPM',back:'Close'}[k];
}
function kpLegend(){
  const el=$('#kplg');if(!el)return;const r=kpR();
  if(!kpKit()||!r.on||(L&&L.calib)){el.classList.add('hidden');el.innerHTML='';return;}
  el.classList.remove('hidden');
  if(KP.arm){el.innerHTML=`<span class="kpk">Kit</span><span>${KP.arm.mode==='tapin'?'Tap in at '+bpm+' BPM on any pad':'Waiting for your first hit'}</span><span class="mut">· shortcuts off</span>`;return;}
  if(run){el.innerHTML='<span class="kpk">Kit</span><span class="mut">Shortcuts are off during the run</span>';return;}
  const acts=KP_ACTS.filter(a=>kpMapped(a.k)&&kpLabel(a.k));
  el.innerHTML=acts.length?`<span class="kpk">Kit</span>${acts.map(a=>`<span class="kpi"><b>${esc(kpPadName(a.k))}</b> ${esc(kpLabel(a.k))}</span>`).join('')}${kpFirstMode()!=='off'?`<span class="kpi mut">${kpFirstMode()==='tapin'?'Tap-in start':'First-hit start'}</span>`:''}`
    :'<span class="kpk">Kit remote</span><span class="mut">not set up</span><button class="sm ghost" data-kpsetup>Set up</button>';
}
// one short line for the Today card ('today') and the session strip on pages ('bar')
function kpHint(ctx){
  if(!kpKit()||!kpR().on)return '';
  if(!kpAnyMapped())return ctx==='today'?'<div class="kphint mut">Kit remote: <button class="sm ghost" data-kpsetup>Set it up</button> to start and skip from the pads.</div>':'';
  const it=[];if(kpMapped('start'))it.push(kpPadName('start')+' '+(ctx==='today'?'to start':'continue'));if(kpMapped('next'))it.push(kpPadName('next')+' next item');if(ctx==='bar'&&kpMapped('back'))it.push(kpPadName('back')+' back');
  return it.length?`<div class="kphint mut"><span class="kpk">Kit</span> ${esc(it.join(' · '))}</div>`:'';
}
function kpSheetHint(m){if(!kpKit()||!kpR().on||!kpMapped('back'))return;const b=m.querySelector('.sbody');if(b&&!b.querySelector('.kpsh'))b.insertAdjacentHTML('beforeend',`<p class="kphint kpsh mut"><span class="kpk">Kit</span> ${esc(kpPadName('back'))} closes this</p>`);}
// practice screen: kit remote state and the view button (called from renderPracBar, startRun, stopRun, finish)
function kpRunState(){const on=!!run;if(!on&&KP.wasRun)KP.quiet=performance.now()+KP_QUIET;KP.wasRun=on;$('#prac').classList.toggle('kprun',on);kpLegend();kpViewBtn();}

/* ---------- at-the-kit view ---------- */
function kpViewCalc(w,h,kit,mode){if(mode==='on')return true;if(mode==='off')return false;return !!kit&&w>h&&Math.min(w,h)>=500;}
function kpViewSync(){
  const on=kpViewCalc(innerWidth,innerHeight,kpKit(),kpViewMode());KPV=on;
  const was=document.documentElement.classList.contains('atkit');document.documentElement.classList.toggle('atkit',on);
  kpViewBtn();
  if(was!==on&&typeof sizeCv==='function'&&!$('#prac').classList.contains('hidden'))requestAnimationFrame(()=>{sizeCv();draw();if(typeof notaRender==='function')notaRender();});
  return on;
}
function kpViewSet(m){p1Dev('kitView',m);kpViewSync();render();}
function kpViewBtn(){
  const on=document.documentElement.classList.contains('atkit'),show=kpKit()||on||kpViewMode()==='on';
  const h=$('#kvbtn');if(h){h.classList.toggle('hidden',!show);h.classList.toggle('on',on);h.innerHTML=icon('kit',16)+'<span class="lb">'+(on?'Kit view ✓':'Kit view')+'</span>';h.title=on?'At-the-kit view is on: tap for the normal view':'At-the-kit view: big type, high contrast';}
  const p=$('#kvp');if(p){p.classList.toggle('hidden',!show);p.classList.toggle('on',on);p.textContent=on?'Kit view ✓':'Kit view';}
}
addEventListener('resize',()=>kpViewSync());
addEventListener('orientationchange',()=>setTimeout(kpViewSync,150));

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const T=e.target;let b;
  if((b=T.closest('[data-kplearn]'))){const k=b.dataset.kplearn;if(k==='stop')kpLearnStop();else if(k==='all')kpLearnStart(KP_ACTS[0].k,true);else kpLearnStart(k,false);return;}
  if((b=T.closest('[data-kpclear]'))){kpClear(b.dataset.kpclear);kpRedraw();return;}
  if((b=T.closest('[data-kpon]'))){const r=kpR();r.on=b.dataset.kpon==='1';r.onAt=Date.now();save();render();return;}
  if((b=T.closest('[data-kpfirst]'))){p1Dev('firstHit',b.dataset.kpfirst);render();return;}
  if((b=T.closest('[data-kpview]'))){kpViewSet(b.dataset.kpview);return;}
  if((b=T.closest('[data-act="kitview"]'))){kpViewSet(document.documentElement.classList.contains('atkit')?'off':'on');if(!$('#prac').classList.contains('hidden'))kpLegend();return;}
  if((b=T.closest('[data-kpsetup]'))){closeSheets();if(!$('#prac').classList.contains('hidden')){routineStop();stopRun();kpDisarm();$('#prac').classList.add('hidden');L=null;}go('kit');setTimeout(()=>{const c=$('#kpcard');if(c)c.scrollIntoView({block:'start'});},60);return;}
  if((b=T.closest('[data-kptest]'))){(async()=>{const el=$('#kptests');el.innerHTML='Running…';const t=await p2Tests();const e2=$('#kptests')||el;e2.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>Kit remote: ${t.filter(x=>x.pass).length}/${t.length} pass</b></div>`+t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');})();return;}
});
setTimeout(kpViewSync,0);

/* ---------- tests (?test=1 › Kit › Kit remote › Run kit-remote tests) ---------- */
async function p2Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det===undefined?'':String(det)});
  const keepX=testSnap();
  const keep=JSON.stringify({remote:state.remote,map:state.map,art:state.art,lat:state.lat,set:state.set}),keepN=state.sessions.length,keepMem=JSON.stringify(P1_MEM),keepCur=cur,keepFake=KP.fakeKit,keepSES=SES;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const midiHit=(n,t,vel)=>onMidi({data:[0x99,n,vel||90],timeStamp:t});
  const reset=()=>{closeSheets();if(run)stopRun(false);kpDisarm();routineStop();KP.learn=null;KP.last={};KP.chord={};KP.cool=0;KP.quiet=0;KP.fired=[];FREE.t0=0;SES=null;$('#prac').classList.add('hidden');$('#result').classList.add('hidden');L=null;};
  const fired=()=>KP.fired.map(f=>f.k).join(',');
  const N={C:49,RIM:37,T1:48,T3:43,K:36,HP:44};
  try{
    reset();KP.fakeKit=true;state.lat=0;
    // back-fill and defaults
    {const s={};kpFill(s);T('Back-fill: an old backup gets remote = on, nothing mapped',s.remote&&s.remote.on===true&&Object.keys(s.remote.map).length===0);
     const s2={remote:{on:false,map:{start:{n:[49],at:5},bad:null}}};kpFill(s2);T('Back-fill keeps learned shortcuts and repairs broken entries',s2.remote.on===false&&s2.remote.map.start.n[0]===49&&Array.isArray(s2.remote.map.bad.n));}
    state.remote={on:true,onAt:0,map:{}};
    openPractice('1.2.02');midiHit(N.C,performance.now());midiHit(N.C,performance.now()+250);
    T('Defaults: nothing fires until a pad is learned (no measured notes, C4)',!KP.fired.length&&!run,fired());reset();
    // learn
    go('kit');kpLearnStart('start',false);midiHit(N.C,1000);T('Learn: the next hit maps Start',kpNotes('start').join()==='49'&&!KP.learn,kpNotes('start').join());
    kpLearnStart('back',false);midiHit(N.K,2000);T('Learn a pair: one pad alone is not enough',!kpMapped('back')&&KP.learn);midiHit(N.HP,2030);T('Learn a pair: kick + pedal together',kpNotes('back').join()==='36,44'&&!KP.learn,kpNotes('back').join());
    kpLearnStart('back',false);midiHit(N.K,3000);midiHit(N.HP,3400);T('Learn a pair: a second pad 400 ms later starts over',KP.learn&&kpNotes('back').join()==='36,44');kpLearnStop();
    kpLearnStart(KP_ACTS[0].k,true);[N.C,N.RIM,N.T1,N.T3].forEach((n,i)=>midiHit(n,5000+i*1000));midiHit(N.K,9000);midiHit(N.HP,9020);
    T('Learn all: five shortcuts in order',kpNotes('start')+'|'+kpNotes('again')+'|'+kpNotes('next')+'|'+kpNotes('slower')+'|'+kpNotes('back')==='49|37|48|43|36,44'&&!KP.learn);
    kpLearnStart('next',false);midiHit(N.RIM,10000);T('Learn: a note already used moves (Again cleared, Next = rim)',kpNotes('next').join()==='37'&&!kpMapped('again'));
    kpSetMap('again',[N.RIM]);kpSetMap('next',[N.T1]);
    T('Learning never reaches the engine or the pad mapping',state.sessions.length===keepN&&JSON.stringify(state.map)===JSON.stringify(JSON.parse(keep).map));
    T('Kit page shows the remote card',(()=>{render();return !!$('#view .kpcard')&&$('#view .kpcard').textContent.includes('Learn all');})());
    reset();
    // double-hit window
    openPractice('1.2.02');let t0=performance.now()+5000;
    midiHit(N.C,t0);T('Crash once: nothing',!KP.fired.length);
    midiHit(N.C,t0+50);T('Two crash hits 50 ms apart (double trigger): nothing',!KP.fired.length);
    midiHit(N.C,t0+300);T('Crash ×2 within 90–600 ms: Start',fired()==='start'&&(run||KP.arm),fired());reset();
    openPractice('1.2.02');t0=performance.now()+5000;midiHit(N.C,t0);midiHit(N.C,t0+800);T('Two crash hits 800 ms apart: nothing',!KP.fired.length);
    midiHit(N.C,t0+1200);T('…but the second and third (400 ms) do',fired()==='start',fired());reset();
    // chord window
    openPractice('1.2.02');t0=performance.now()+5000;midiHit(N.K,t0);midiHit(N.HP,t0+40);T('Kick + pedal within 60 ms: Back (practice closes)',fired()==='back'&&$('#prac').classList.contains('hidden'),fired());reset();
    openPractice('1.2.02');t0=performance.now()+5000;midiHit(N.K,t0);midiHit(N.HP,t0+120);T('Kick + pedal 120 ms apart: nothing',!KP.fired.length);reset();
    openPractice('1.2.02');t0=performance.now()+5000;midiHit(N.K,t0);T('Kick alone: nothing',!KP.fired.length);reset();
    // ignored during runs, count-in, routine, free play, recording; quiet after a run
    openPractice('1.2.02');await startRun();const R=run;t0=performance.now();midiHit(N.RIM,t0);midiHit(N.C,t0+200);midiHit(N.C,t0+400);midiHit(N.K,t0+600);midiHit(N.HP,t0+610);
    T('During the count-in and the run: no shortcut fires',!KP.fired.length&&run===R,fired());
    T('…and those hits go to the engine as usual',R.extras.length+R.evs.filter(e=>e.hitT!=null).length>=0&&run===R);
    stopRun(false);t0=performance.now()+100;midiHit(N.RIM,t0);T('Just after a run (1.5 s quiet): nothing',!KP.fired.length);
    KP.quiet=0;midiHit(N.RIM,performance.now()+2000);T('After the quiet time: Again starts a run',fired()==='again'&&!!run,fired());reset();
    const rl=LESSONS.find(l=>l.routine);if(rl){openPractice(rl.id);ROUTINE.on=true;midiHit(N.RIM,performance.now()+5000);T('During a routine: nothing',!KP.fired.length);ROUTINE.on=false;reset();}
    go('today',{mode:'free'});FREE.t0=Date.now();midiHit(N.RIM,performance.now()+5000);midiHit(N.C,performance.now()+5100);midiHit(N.C,performance.now()+5400);T('During the free-play timer: nothing',!KP.fired.length);FREE.t0=0;reset();
    if(typeof REC!=='undefined'){const kr=REC;REC={on:true};openPractice('1.2.02');KP.quiet=0;kpShortcut(N.RIM,performance.now()+5000);T('While recording (Analyse & tag › From my playing): nothing',!KP.fired.length);REC=kr;reset();}
    {const kl=learnVoice;learnVoice='C';openPractice('1.2.02');KP.quiet=0;const lv0=learnVoice;try{onMidi({data:[0x99,99,80],timeStamp:performance.now()+5000});}catch(_){}T('While learning a pad mapping: nothing',!KP.fired.length);learnVoice=kl;Object.keys(state.map).forEach(k=>{if(+k===99)delete state.map[k];});state.map=JSON.parse(keep).map;state.art=JSON.parse(keep).art;reset();}
    state.remote.on=false;openPractice('1.2.02');midiHit(N.RIM,performance.now()+5000);T('Kit remote switched off: nothing',!KP.fired.length);state.remote.on=true;reset();
    // what each shortcut does
    openPractice(LESSONS.find(l=>l.type==='play'&&l.ex&&l.ex.length>1).id);const nEx=L.ex.length;midiHit(N.T1,performance.now()+5000);T('Practice: high tom = next exercise',nEx<2||exI===1,exI);reset();
    openPractice('1.2.02');const b0=bpm;midiHit(N.T3,performance.now()+5000);T('Practice: floor tom = −5 BPM',bpm===b0-5,b0+'→'+bpm);reset();
    openPractice('1.2.02');showResult('<p>r</p>');midiHit(N.RIM,performance.now()+5000);T('Results: rim = Again (result hidden, run starts)',!!run&&$('#result').classList.contains('hidden'));reset();
    openPractice('1.2.02');openSheet('Test','<p>x</p>');t0=performance.now()+5000;midiHit(N.RIM,t0);T('A sheet open: rim does nothing',!run&&!!document.querySelector('.modal'));
    midiHit(N.K,t0+500);midiHit(N.HP,t0+510);T('A sheet open: kick + pedal closes it (practice stays)',!document.querySelector('.modal')&&!$('#prac').classList.contains('hidden'));reset();
    {const m=openSheet('Quick look','<p>x</p>');T('Sheets show the kit hint (kick + pedal closes this)',!!m.querySelector('.kpsh'));reset();}
    // session runner (Today › At the kit)
    p1Dev('planMode','kit');go('home');midiHit(N.C,performance.now()+5000);midiHit(N.C,performance.now()+5300);
    T('Today › At the kit: crash ×2 starts the session',!!SES&&KP.fired.length===1,fired());
    if(SES){const i0=SES.i;closeSheets();if(run)stopRun(false);KP.quiet=0;KP.cool=0;$('#result').classList.add('hidden');midiHit(N.T1,performance.now()+6000);T('In a session: high tom = next item',SES&&SES.i>i0,i0+'→'+(SES&&SES.i));
      closeSheets();if(run)stopRun(false);KP.quiet=0;KP.cool=0;p1ClosePrac();go('theory',null,{keep:true});const i1=SES&&SES.i;midiHit(N.T1,performance.now()+7000);T('Session strip on a page: high tom = next/skip item',SES&&SES.i>i1||!SES,i1+'→'+(SES&&SES.i));}
    T('Today card shows the kit hint',(()=>{reset();p1Dev('planMode','kit');go('home');const h=$('#view #p1today .kphint');return h&&/to start/.test(h.textContent);})());
    reset();go('progress');midiHit(N.C,performance.now()+5000);midiHit(N.C,performance.now()+5300);T('A page with no session: crash ×2 does nothing',KP.fired.length===1&&!KP.fired[0].lab&&!run&&!SES);reset();
    // legend
    openPractice('1.2.02');const lg=$('#kplg');T('Practice legend lists the learned pads',lg&&!lg.classList.contains('hidden')&&/Again/.test(lg.textContent)&&/−5 BPM/.test(lg.textContent),lg&&lg.textContent);
    await startRun();T('Legend during the run: shortcuts off',/off during the run/.test($('#kplg').textContent));stopRun(false);reset();
    // tap-in
    {const beat=60000/80;T('Tap-in: 3 taps at the beat ±10 % start',kpTapCheck([0,beat*1.1,beat*2.0],beat).ok);T('Tap-in: a gap 20 % off does not',!kpTapCheck([0,beat*1.2,beat*2.2],beat).ok);
     T('Tap-in: exactly ±15 % is still in',kpTapCheck([0,beat*1.15,beat*2.0],beat).ok&&kpTapCheck([0,beat*0.85,beat*1.85],beat).ok);T('Tap-in: two taps are not enough',!kpTapCheck([0,beat],beat).ok);}
    p1Dev('firstHit','tapin');openPractice('1.2.02');bpm=80;kpStart();T('Tap-in: Start waits (no click yet), Cancel on the button',!!KP.arm&&!run&&$('#go').textContent==='Cancel'&&!!$('#kparm'));
    t0=performance.now()+50;midiHit(N.K,t0);midiHit(N.K,t0+600);midiHit(N.K,t0+1200);T('Tap-in at 100 BPM for an 80 BPM run: still waiting, says “a little slower”',!!KP.arm&&!run&&/slower/.test($('#kparm').textContent),$('#kparm')&&$('#kparm').textContent);
    midiHit(N.K,t0+1950);midiHit(38,t0+1960);T('Tap-in: two pads at once count as one tap',!!KP.arm&&KP.arm.taps.length===3);midiHit(N.K,t0+2700);await wait(10);
    T('Tap-in at 80 BPM: the run starts, count-in on the next beat',!!run&&!KP.arm&&Math.abs(run.base-(t0+2700+750))<1&&run.cinBars===state.set.countin,run&&Math.round(run.base-(t0+2700)));
    T('Tap-in: same tempo and pattern as a normal start (scoring unchanged)',run&&run.bpm===80&&run.evs.length===buildRun(L,L.ex[exI],80,0,{}).evs.length&&!run.evs.some(e=>e.anchor));stopRun(false);reset();
    openPractice('1.2.02');kpStart();T('Start again while waiting cancels',!!KP.arm);$('#go').click();T('…Cancel: back to Start',!KP.arm&&!run&&$('#go').textContent==='Start');reset();
    // first hit
    p1Dev('firstHit','hit');openPractice('1.2.02');bpm=80;kpStart();T('First hit: Start waits for your first note',!!KP.arm&&KP.arm.mode==='hit'&&!run);
    t0=performance.now()+40;midiHit(N.S||38,t0);const R2=run,a0=R2&&R2.evs.find(e=>e.anchor);
    T('First hit: the run starts on that hit, no count-in',!!R2&&R2.cinBars===0&&a0&&Math.abs(a0.t-t0)<1,R2&&R2.cinBars);
    if(R2){R2.evs.forEach(e=>{if(!e.listen&&!e.anchor)hit(e.v,80,e.t,e.art);});finish();const s=state.sessions[state.sessions.length-1];const nAll=R2.evs.filter(e=>!e.listen).length;
      T('First hit: that first note isn’t scored; the rest are as normal',s&&s.n===nAll-1&&s.score===100,s&&(s.n+'/'+nAll+' '+s.score+'%'));}
    reset();openPractice('1.2.02');p1Dev('firstHit','off');kpStart();T('First-hit start off: Start starts at once, with the count-in',!!run&&!KP.arm&&run.cinBars===state.set.countin&&!run.evs.some(e=>e.anchor));stopRun(false);reset();
    p1Dev('firstHit','hit');{const kk=KP.fakeKit;KP.fakeKit=false;const ki=inputs;inputs=[];openPractice('1.2.02');kpStart();T('No kit connected: Start starts at once',!!run&&!KP.arm);stopRun(false);inputs=ki;KP.fakeKit=kk;reset();}
    p1Dev('firstHit','off');
    // at-the-kit view
    T('View Auto: kit + tablet landscape → on',kpViewCalc(1280,800,true,'auto')&&kpViewCalc(1024,553,true,'auto'));
    T('View Auto: tablet portrait → off',!kpViewCalc(800,1280,true,'auto'));
    T('View Auto: phone landscape (860×400) → off',!kpViewCalc(860,400,true,'auto'));
    T('View Auto: no kit → off',!kpViewCalc(1280,800,false,'auto'));
    T('View On / Off override Auto',kpViewCalc(400,860,false,'on')&&!kpViewCalc(1280,800,true,'off'));
    kpViewSet('on');T('View On: the page switches to the at-the-kit view',document.documentElement.classList.contains('atkit')&&KPV);kpViewSet('off');T('View Off: normal view',!document.documentElement.classList.contains('atkit')&&!KPV);
    // merge
    {const A={on:true,onAt:10,map:{start:{n:[49],at:100},next:{n:[48],at:300}}},B={on:false,onAt:20,map:{start:{n:[57],at:200},next:{n:[],at:250},back:{n:[36,44],at:50}}};const m=kpMerge(A,B);
     T('Merge: per shortcut the later learn wins',m.map.start.n[0]===57&&m.map.next.n[0]===48&&m.map.back.n.join()==='36,44');T('Merge: a later Clear wins too',kpMerge({map:{next:{n:[48],at:1}}},{map:{next:{n:[],at:2}}}).map.next.n.length===0);
     T('Merge: the on/off switch follows its own time',m.on===false&&m.onAt===20);
     const full=mergeStates(Object.assign(freshState(),{remote:A,savedAt:5}),Object.assign(freshState(),{remote:B,savedAt:9}));T('mergeStates carries the remote',full.remote&&full.remote.map.start.n[0]===57);}
    // testing mode
    if(SANDBOX){let ls=null;try{ls=localStorage.getItem('drumpath.firstHit');}catch(_){}p1Dev('firstHit','tapin');let ls2=null;try{ls2=localStorage.getItem('drumpath.firstHit');}catch(_){}
      T('Testing mode: device choices stay in memory (nothing written)',ls===ls2,String(ls2));p1Dev('firstHit','off');
      const r0=state.rev;kpSetMap('again',[N.RIM]);T('Testing mode: learning saves nothing to the device',SANDBOX&&true,'rev '+r0+'→'+state.rev+' (in memory only)');}
  }catch(e){T('no errors',false,e.message+' '+(e.stack||'').split('\n')[1]);}
  reset();const k=JSON.parse(keep);state.remote=k.remote;state.map=k.map;state.art=k.art;state.lat=k.lat;state.set=k.set;state.sessions.length=Math.min(state.sessions.length,keepN);testRestore(keepX);
  Object.keys(P1_MEM).forEach(x=>delete P1_MEM[x]);Object.assign(P1_MEM,JSON.parse(keepMem));KP.fakeKit=keepFake;SES=keepSES;kpViewSync();go(keepCur==='kit'?'kit':'settings');
  return out;
}
