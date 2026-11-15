/* DrumPath — Theory T3: practice ↔ theory (D-032, theory-course-plan §5b).
   · Practice screen: "Theory for this exercise" — ranked cards (relevance → need → first time), smart display
     (opens itself / chip / quiet tick), Read · 30-second recap · Read 1–2 then start · Skip, start. Never during a run.
   · After a run: "Fix it with theory" — mistakes → the cards that explain them (max 3) + coach rule D2.
   · Every card: "Practise this" — quick try → your next lesson → an easy win → songs → the rest.
   · Progress › Theory: Understood × Practised per concept. Practise plan: one short recap per item + Remember deck.
   · Song pages: concepts you know.
   Display and new state fields only (state.theory.skips / auto / plog / fails, state.set.thPanel); scoring untouched. */
'use strict';
const TH_TAGS={};
const thTags=id=>TH_TAGS[id]||(TH_TAGS[id]=[...thTagsOf(LBY[id])]);
function thConceptLessons(tag){return LESSONS.filter(l=>l.type==='play'&&thTags(l.id).includes(tag));}
function thCardConcepts(cid){return Object.entries(thCon()).filter(([t,c])=>t[0]!=='_'&&(c.cards||[]).includes(cid)).map(x=>x[0]);}
function thConceptName(tag){const c=thCon()[tag];return c&&c.t||tag;}
function thBestCard(tag){const cs=thCardsFor(tag);return cs.find(c=>!thKnown(c))||cs[0]||null;}
function thT3Fill(){const t=thS();if(!t.skips||typeof t.skips!=='object')t.skips={};if(!t.auto||typeof t.auto!=='object')t.auto={};if(!Array.isArray(t.plog))t.plog=[];if(!t.fails||typeof t.fails!=='object')t.fails={};return t;}

/* ---------- ranking ---------- */
// rows for a lesson's theory: core before supporting, then need (new > read, not understood > review due > weak spot > known), then first time
function thPanelRows(lessonId){
  const t=thT3Fill(),hand=(thCon()._lessons||{})[lessonId]||[],rows=new Map(),now=thNow();
  thTags(lessonId).forEach(tg=>{const cs=thCardsFor(tg);if(!cs.length)return;const ls=thConceptLessons(tg),ix=ls.findIndex(l=>l.id===lessonId);
    const core=hand.includes(tg)||(ix>=0&&ix<3),first=ix===0;
    cs.forEach(c=>{const r=rows.get(c);if(!r)rows.set(c,{id:c,tag:tg,core,first});else{r.core=r.core||core;r.first=r.first||first;}});});
  TH_ORDER.forEach(k=>{if(((k.links||{}).lessons||[]).includes(lessonId)&&!rows.has(k.id))rows.set(k.id,{id:k.id,tag:null,core:true,first:false});});
  const fail=t.fails[lessonId],failCards=fail?fail.cards.map(x=>x.card):[];
  failCards.forEach(c=>{if(THC[c]&&!rows.has(c))rows.set(c,{id:c,tag:null,core:true,first:false});});
  return [...rows.values()].map(r=>{const st=thSt(r.id),rv=t.review[r.id],due=!!(rv&&!rv.done&&rv.due!=null&&rv.due<=now),weak=failCards.includes(r.id);
    r.st=st;r.due=due;r.weak=weak;r.need=!st?0:st==='r'?1:due?2:weak?3:4;
    const fr=weak?fail.cards.find(x=>x.card===r.id):null;
    r.why=[r.core?'core idea here':'supporting',r.first?'first time in your lessons':'',r.need===0?'new':r.need===1?'check not passed yet':r.need===2?'review due':'',fr?fr.text:''].filter(Boolean).join(' · ');
    return r;}).sort((a,b)=>(b.core-a.core)||(a.need-b.need)||(b.first-a.first)||(THC[a.id].n-THC[b.id].n));
}
// how loud the panel is for this visit: 'open' | 'chip' | 'tick' | 'off'
function thPanelMode(lessonId,ctx={}){
  const rows=thPanelRows(lessonId);if(!rows.length)return{mode:'off',rows};
  const att=rows.filter(r=>r.need<4);if(!att.length)return{mode:'tick',rows};
  const pref=state.set.thPanel||'smart',t=thT3Fill(),now=thNow();
  if(ctx.busy||pref==='never')return{mode:'chip',rows,why:ctx.busy?'busy':'never'};
  if(t.auto[lessonId]===today())return{mode:'chip',rows,why:'shown today'};
  if(pref==='always')return{mode:'open',rows,why:'always'};
  const skipped=c=>(t.skips[c]||[]).filter(ts=>now-ts<7*DAY).length>=2;
  const p=LBY[lessonId]&&state.prog[lessonId],firstVisit=!(p&&p.attempts)&&!state.sessions.some(s=>s.id===lessonId);
  const log=t.plog.slice(-20),skipShare=log.length>=5?log.filter(x=>x==='s').length/log.length:0;
  const fail=t.fails[lessonId];
  const trig=firstVisit?'first visit':fail&&fail.cards.length?'last run':att.some(r=>r.core&&(r.need===0||r.need===2)&&!skipped(r.id))?'core card new or due':'';
  if(!trig)return{mode:'chip',rows};
  if(skipShare>=0.8&&!firstVisit)return{mode:'chip',rows,why:'you usually skip'};
  return{mode:'open',rows,why:trig};
}

/* ---------- practice screen: chip, rail (tablet landscape) or sheet (phones) ---------- */
const TH_P={lesson:null,mode:'off',open:false,rows:[],queue:null};
const thWide=()=>innerWidth>=1000&&innerWidth>innerHeight;
function thPanelBusy(){return !!(run||ROUTINE.on||stretchMode);}
function thPanelOnOpen(){
  TH_P.lesson=null;TH_P.open=false;TH_P.all=false;const rail=$('#thrail'),chip=$('#thchipw');if(rail)rail.classList.add('hidden');if(chip)chip.innerHTML='';
  if(!L||L.theory||L.calib||!LBY[L.id])return;
  const m=thPanelMode(L.id,{busy:thPanelBusy()});Object.assign(TH_P,{lesson:L.id,mode:m.mode,rows:m.rows,why:m.why});
  if(m.mode==='open'){thT3Fill().auto[L.id]=today();save();if(thWide())TH_P.open=true;else setTimeout(()=>{if(L&&TH_P.lesson===L.id&&!run&&!document.querySelector('.modal'))thPanelSheet();},60);}
  thPanelSync();
}
function thPanelSync(){
  const rail=$('#thrail'),chip=$('#thchipw');if(!rail||!chip)return;
  if(!TH_P.lesson||!L||L.id!==TH_P.lesson||TH_P.mode==='off'){rail.classList.add('hidden');chip.innerHTML='';return;}
  const rows=TH_P.rows=thPanelRows(TH_P.lesson),nw=rows.filter(r=>r.need===0||r.need===1).length,dv=rows.filter(r=>r.need===2).length,wk=rows.filter(r=>r.need===3).length;
  const att=nw+dv+wk;TH_P.mode=att?(TH_P.mode==='tick'?'chip':TH_P.mode):'tick';
  chip.innerHTML=`<button class="sm thpchip ${att?'att':''}" data-thpchip title="Theory for this exercise">${att?`Theory${nw?' · '+nw+' new':''}${dv?' · '+dv+' review':''}${wk?' · '+wk+' to fix':''}`:'Theory ✓'}</button>`;
  const show=thWide()&&TH_P.open&&!run;rail.classList.toggle('hidden',!show);if(show)rail.innerHTML=thPanelHtml(true);
  if(show||!rail.classList.contains('hidden'))requestAnimationFrame(()=>{sizeCv();draw();});
}
function thPanelHtml(rail){
  const rows=TH_P.rows,att=rows.filter(r=>r.need<4),t=thS();
  const last=id=>{const rv=t.review[id],c=t.cards[id];const ts=(rv&&rv.at)||(c&&(c.u||c.r));return ts?new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short'}):'';};
  return `<div class="thpanel">${rail?`<div class="row" style="align-items:center;flex-wrap:nowrap"><b style="flex:1">Theory for this exercise</b><button class="icon ghost" data-thpclose title="Hide">${icon('close',16)}</button></div>`:''}
   <div class="thpact">${att.length?`<button class="sm" data-thprecap>30-second recap</button><button class="sm" data-thpqueue>Read ${Math.min(2,att.length)}, then start</button>`:''}<button class="sm pri" data-thpskip>${att.length?'Skip, start':'Start'}</button></div>
   ${att.length?'':`<p class="mut" style="font-size:14px;margin:6px 0">Every card for this exercise is understood. Revise any of them:</p>`}
   <div class="thplist">${rows.slice(0,TH_P.all?rows.length:5).map(r=>`<div class="thprow ${r.need===4?'dim':''}"><div style="min-width:0;flex:1"><div class="row" style="gap:6px;align-items:center">${thChip(r.id)}<b>${esc(THC[r.id].t)}</b></div><div class="mut thpwhy">${esc(r.why)}${r.need===4&&last(r.id)?' · last '+last(r.id):''}</div></div><button class="sm ghost" data-thsheet="${r.id}">${r.need===4?'Revise':'Read'}</button></div>`).join('')}</div>${rows.length>5&&!TH_P.all?`<button class="sm ghost" data-thpall>Show all ${rows.length}</button>`:''}</div>`;
}
function thPanelSheet(){openSheet('Theory for this exercise',thPanelHtml(false));}
function thLog(x){const t=thT3Fill();t.plog.push(x);if(t.plog.length>40)t.plog.splice(0,t.plog.length-40);}
function thPanelStart(){closeSheets();TH_P.open=false;thPanelSync();if(L&&!run&&!$('#prac').classList.contains('hidden')){$('#result').classList.add('hidden');startRun();}}
// a card as a sheet (over the practice screen or anywhere); ✕ returns exactly where you were
function thCardSheet(id,opts={}){
  const k=THC[id];if(!k)return;thMark(id,'r',true);save();thHearStop();
  const q=opts.queue,i=q?q.indexOf(id):-1,nx=q&&q[i+1];
  const foot=q?`<div class="row" style="margin-top:12px">${nx?`<button data-thqnext="${nx}">Next card ›</button>`:''}<span class="sp"></span><button class="pri" data-thpstart>Start now</button></div>`:(TH_P.lesson&&!$('#prac').classList.contains('hidden')?`<div class="row" style="margin-top:12px"><span class="sp"></span><button class="pri" data-thpstart>Start</button></div>`:'');
  closeSheets();openSheet(q?`Card ${i+1} of ${q.length}`:'Theory card',thCardHtml(k,{sheet:true})+foot);
}
function thRecapSheet(){
  const att=TH_P.rows.filter(r=>r.need<4).slice(0,3);
  openSheet('30-second recap',att.map(r=>{const k=THC[r.id],hs=thHearSpecs(k);thMark(r.id,'r',true);return `<div class="threcap"><b>${esc(k.t)}</b><div class="threm" style="margin:6px 0"><span class="note-k">Remember</span><span>${esc(k.rem||k.idea)}</span></div>${hs.length?`<button class="sm" data-thhear="${k.id}:0" data-lab="▶ Hear it">▶ Hear it</button>`:''} <button class="sm ghost" data-thsheet="${k.id}">Whole card</button>${typeof qlI==='function'?' '+qlI([k.id],k.t):''}</div>`;}).join('')+`<div class="row" style="margin-top:12px"><span class="sp"></span><button class="pri" data-thpstart>Start now</button></div>`);
  save();
}

/* ---------- after a run: fix it with theory ---------- */
const TH_POS={2:['the beat','the “&”'],4:['the beat','the “e”','the “&”','the “a”'],3:['the beat','the 2nd triplet note','the 3rd triplet note']};
function thFixRows(R,res){
  const out=[],add=(tag,text,card)=>{const c=card||thBestCard(tag);if(c&&THC[c]&&!out.some(x=>x.card===c))out.push({card:c,text});};
  const sc=R.evs.filter(e=>!e.listen),tol=state.set.tol,ok=e=>e.hitT!=null&&Math.abs(e.dt)<=tol&&e.artOk!==false;
  const names=TH_POS[R.sub];
  if(names){const pos={};sc.forEach(e=>{const q=(e.step%R.spb)%R.sub;const p=pos[q]||(pos[q]={n:0,ok:0,dt:0,h:0});p.n++;if(ok(e))p.ok++;if(e.hitT!=null){p.dt+=e.dt;p.h++;}});
    const bad=Object.entries(pos).filter(([q,p])=>p.n>=4&&p.ok/p.n<0.8).sort((a,b)=>a[1].ok/a[1].n-b[1].ok/b[1].n);
    bad.forEach(([q,p])=>{q=+q;const m=p.h?Math.round(p.dt/p.h):0,txt=`${p.ok} of ${p.n} notes on ${names[q]} on time${Math.abs(m)>=8?` (mostly ${m<0?'early':'late'} by ${Math.abs(m)} ms)`:''}`;
      if(q===0)add('click',txt);else if(R.sub===4)add(q===2?'eighth':'sixteenth',txt);else if(R.sub===2)add('eighth',txt);else add('triplet',txt);});}
  if(res.avg<-15)add(null,'rushing: '+Math.round(-res.avg)+' ms ahead on average','A1.09.2');else if(res.avg>15)add(null,'dragging: '+Math.round(res.avg)+' ms behind on average','A1.09.3');
  if(res.dynScore!=null&&res.dynScore<state.set.dynPass){const bx=sc.filter(e=>e.ch==='X'&&e.dynOk===false).length,bg=sc.filter(e=>e.ch==='g'&&e.dynOk===false).length;
    if(bx)add('accent',bx+' accent'+(bx>1?'s':'')+' not loud enough');if(bg)add('ghost',bg+' ghost note'+(bg>1?'s':'')+' too loud');}
  const art=sc.filter(e=>e.artOk===false);if(art.some(e=>e.v==='HH'))add('openhh','open / closed hi-hat mixed up');if(art.some(e=>e.v==='S'))add('rim','rim / head mixed up');
  return out.slice(0,3);
}
function thFixHtml(R,res){
  try{if(!R||!R.lesson||R.lesson.theory||!LBY[R.lesson.id])return '';const t=thT3Fill(),id=R.lesson.id,rows=thFixRows(R,res);
    if(res.passed)delete t.fails[id];else t.fails[id]={ts:thNow(),cards:rows};
    if(typeof qlWrong==='function')rows.forEach(r=>qlWrong(r.card,{quiet:true}));   // P1b: each mistake → tomorrow's Revise
    const rs=state.sessions.filter(s=>s.id===id),prev=rs[rs.length-2],last=rs[rs.length-1];
    const twice=!res.passed&&prev&&last&&prev.bpm===last.bpm&&!runPassed(prev);
    if(!rows.length&&!twice)return '';
    return `<div class="card thfix"><div class="note-k" style="color:var(--accent)">Fix it with theory</div>${rows.map(r=>`<div class="thprow"><div style="flex:1;min-width:0"><b>${esc(THC[r.card].t)}</b><div class="mut thpwhy">${esc(r.text)}</div></div>${typeof qlI==='function'?qlI([r.card],THC[r.card].t):''}<button class="sm" data-thsheet="${r.card}">Read</button></div>`).join('')}
      ${twice?`<p class="mut" style="font-size:14px;margin:8px 0 0">Two misses in a row at ${last.bpm} BPM: drop 10 BPM and build it back up (coach rule D2).</p>`:''}</div>`;}
  catch(e){console.warn('fix-it',e);return '';}
}

/* ---------- on every card: Practise this ---------- */
const TH_BACK={card:null,lesson:null};
function thQuickTry(k){if(k.try)return k.try;const ex=k.dg&&(k.dg.type==='nt'||k.dg.type==='count')&&k.dg.ex;if(!ex||!Object.values(ex.v).some(s=>/[^.]/.test(s)))return null;
  const spb=ex.steps||4*ex.sub,bars=ex.bars||1;const ex2=bars>=2?ex:Object.assign({},ex,{n:'Quick try',bars:2,v:Object.fromEntries(Object.entries(ex.v).map(([k2,s])=>[k2,s+s])),st:ex.st?ex.st+ex.st:undefined});
  if(!ex2.st)delete ex2.st;return{ex:[ex2],bpm:65,quick:true};}
function thPractiseThis(k,opts={}){
  const ls=thCardLessons(k).map(id=>LBY[id]).filter(l=>l&&l.type==='play');let nx=null;try{nx=nextLesson();}catch(_){}
  const fl=nx?nx.lv:1,qt=thQuickTry(k),rows=[],used=new Set();
  const lessonRow=(l,kind)=>{used.add(l.id);const p=state.prog[l.id];return `<div class="thprow"><div style="flex:1;min-width:0"><div class="note-k">${kind}</div><b><span class="idx">${l.id}</span> ${esc(l.t)}</b><div class="mut thpwhy">Level ${l.lv} · ${p&&p.ms?mins(p.ms)+' min practised':'not played yet'}</div></div>${chip(statusOf(l))}<button class="sm ghost" data-thlesson="${l.id}" data-thfrom="${k.id}">Open</button></div>`;};
  if(qt&&!opts.sheet)rows.push(`<div class="thprow"><div style="flex:1;min-width:0"><div class="note-k">Quick try</div><b>${esc(qt.quick?'2 bars from this card':k.try.ex[0].n)}</b><div class="mut thpwhy">scored, counts for minutes and streak only</div></div>${thSt(k.id)==='p'?'<span class="chip ms">Can play</span>':''}<button class="sm pri" data-thtry="${k.id}">${icon('play',13)} Try</button></div>`);
  const next=ls.find(l=>statusOf(l)!=='ms'&&l.lv<=fl)||ls.find(l=>statusOf(l)!=='ms');if(next)rows.push(lessonRow(next,'Your next lesson with this'));
  const win=ls.find(l=>statusOf(l)==='ms'&&!used.has(l.id));if(win)rows.push(lessonRow(win,'Easy win'));
  let songs=[];try{const ctx=songCtx(),seen=new Set();ls.forEach(l=>songsUsing(l.id).forEach(s=>{if(!seen.has(s.id)){seen.add(s.id);songs.push(songStats(ctx,s));}}));songs.sort((a,b)=>b.ready-a.ready);}catch(_){songs=[];}
  songs.slice(0,2).forEach(x=>rows.push(`<div class="thprow"><div style="flex:1;min-width:0"><div class="note-k">Song that needs it</div><b>${esc(x.song.title)}</b><div class="mut thpwhy">${esc(x.song.artist)} · ${x.ready}% ready</div></div><button class="sm ghost" data-song="${esc(x.song.id)}">Open</button></div>`));
  const rest=ls.filter(l=>!used.has(l.id));
  if(!rows.length&&!rest.length)return '';
  return `<div class="thpt"><div class="note-k" style="color:var(--accent)">Practise this</div>${rows.join('')}${rest.length?`<div class="thwl" style="margin-top:6px"><span class="mut" style="font-size:13px">Also in:</span> ${rest.slice(0,6).map(l=>`<button class="sm ghost" data-thlesson="${l.id}" data-thfrom="${k.id}">${l.id}</button>`).join('')}${rest.length>6?`<span class="mut" style="font-size:13px">+${rest.length-6}</span>`:''}</div>`:''}</div>`;
}

/* ---------- Progress › Theory: Understood × Practised ---------- */
const TH_Q=[['solid','Understood and practised','solid'],['play','Practised, not understood yet','read the card'],['read','Understood, not practised yet','try it or play a lesson'],['none','Neither yet','coming up']];
function thCross(){
  const out={solid:[],play:[],read:[],none:[]};
  Object.entries(thCon()).forEach(([tag,c])=>{if(tag[0]==='_')return;const cs=(c.cards||[]).filter(id=>THC[id]);if(!cs.length)return;
    const u=cs.some(thKnown),p=thConceptLessons(tag).some(l=>{const q=state.prog[l.id];return q&&q.attempts>0;})||cs.some(id=>thSt(id)==='p');
    out[u&&p?'solid':p?'play':u?'read':'none'].push(tag);});
  return out;
}
function progTheory(){
  const x=thCross(),sel=VP.progress.thq||null,cnt={'':0,r:0,u:0,p:0,h:0};TH_ORDER.forEach(k=>cnt[thSt(k.id)]++);
  return `<p class="mut" style="margin-top:0">Each concept from the theory course against your practice: do you understand it (a card's check passed), and have you played it (a lesson that uses it)?</p>
  <div class="thq4">${TH_Q.map(([k,l,h])=>`<div class="card tap thq4c ${sel===k?'on':''}" data-thquad="${k}"><div class="k">${l}</div><div class="v">${x[k].length}<small>concepts</small></div><div class="d">${h}</div></div>`).join('')}</div>
  ${sel?`<h2>${esc(TH_Q.find(q=>q[0]===sel)[1])}</h2>${x[sel].length?`<div class="list">${x[sel].map(tag=>{const c=thBestCard(tag),ls=thConceptLessons(tag),l=ls.find(q=>statusOf(q)!=='ms')||ls[0];
     return `<div class="lrow"><span style="flex:1;min-width:0"><b>${esc(thConceptName(tag))}</b><span class="mut" style="font-size:13px"> · ${ls.length} lesson${ls.length===1?'':'s'}</span></span>${c?`<button class="sm ghost" data-thcard="${c}">Card</button>`:''}${l?`<button class="sm ghost" data-open="${l.id}">${l.id}</button>`:''}</div>`;}).join('')}</div>`:'<div class="card mut">None.</div>'}`:''}
  ${typeof qlTopHtml==='function'?qlTopHtml():''}
  <h2>Cards</h2><div class="hero-stats">${[['','New'],['r','Read'],['u','Understood'],['p','Can play'],['h','Can hear']].map(([k,l])=>`<div class="card stat"><div class="k">${l}</div><div class="v">${cnt[k]}<small>/ ${TH_ORDER.length}</small></div></div>`).join('')}</div>
  <p class="mut" style="font-size:13px">Concept × lesson and timing by note position come to Compare in theory step T5.</p>`;
}

/* ---------- Practise plan: one short recap per item; Remember deck ---------- */
function thPlanRecap(lessonId){
  const r=LBY[lessonId]?thPanelRows(lessonId).find(x=>x.need<4):null;if(!r)return '';const k=THC[r.id],hs=thHearSpecs(k);
  return `<div class="threcap tiny"><div class="note-k">Theory recap · under a minute</div><b>${esc(k.t)}</b> <span class="mut">— ${esc(k.rem||k.idea)}</span><div class="row" style="margin-top:6px;gap:6px">${hs.length?`<button class="sm ghost" data-thhear="${k.id}:0" data-lab="▶ Hear">▶ Hear</button>`:''}<button class="sm ghost" data-thsheet="${k.id}">Read</button>${typeof qlI==='function'?qlI([k.id],k.t):''}</div></div>`;
}
function thPlanDeck(){const n=thDue().length;if(!n)return '';return `<div class="card"><div class="note-k" style="color:var(--accent)">Remember deck</div><b style="font-size:18px">${n} card${n===1?'':'s'} due</b><div class="mut">About ${Math.max(1,Math.round(n*0.3))} min · theory reviews</div><div class="row" style="margin-top:10px"><button class="pri" data-thgo='{"mode":"review"}'>Review</button></div></div>`;}

/* ---------- song pages: concepts you know ---------- */
function thSongConcepts(song,x){
  const ids=(x&&x.skills||[]).map(k=>k.id).filter(id=>LBY[id]&&LBY[id].type==='play');const tags=new Set();ids.forEach(id=>thTags(id).forEach(t=>tags.add(t)));
  if(/(6|12)\/8/.test(song.meter||''))tags.add('compound');
  const list=[...tags].filter(t=>thCardsFor(t).length);if(!list.length)return '';const known=list.filter(t=>thCardsFor(t).some(thKnown));
  return `<div class="card" style="margin-top:12px"><span class="note-k" style="color:var(--accent)">Theory</span><div style="font-size:17px;margin-top:4px"><b>Concepts you know: ${known.length} of ${list.length}</b></div>
   <div class="chips" style="margin-top:8px">${list.map(t=>{const k=known.includes(t),c=thBestCard(t);return `<button class="sm ${k?'ghost':'thnew'}" data-thcard="${c}">${k?'✓ ':''}${esc(thConceptName(t))}</button>`;}).join('')}</div></div>`;
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const T=e.target;let b;
  if(T.closest('[data-thpchip]')){if(thWide()){TH_P.open=!TH_P.open;thPanelSync();}else thPanelSheet();return;}
  if(T.closest('[data-thpall]')){TH_P.all=true;const sh=T.closest('.modal');if(sh){sh.querySelector('.sbody').innerHTML=thPanelHtml(false);}else thPanelSync();return;}
  if(T.closest('[data-thpclose]')){TH_P.open=false;thPanelSync();return;}
  if((b=T.closest('[data-thsheet]'))){if(TH_P.lesson&&!$('#prac').classList.contains('hidden'))thLog('r');thCardSheet(b.dataset.thsheet);return;}
  if(T.closest('[data-thprecap]')){thLog('r');closeSheets();thRecapSheet();return;}
  if(T.closest('[data-thpqueue]')){thLog('r');const q=TH_P.rows.filter(r=>r.need<4).slice(0,2).map(r=>r.id);if(q.length)thCardSheet(q[0],{queue:q});return;}
  if((b=T.closest('[data-thqnext]'))){const box=$('.modal .thsheetcard');const q=TH_P.rows.filter(r=>r.need<4).slice(0,2).map(r=>r.id);thCardSheet(b.dataset.thqnext,{queue:q.includes(b.dataset.thqnext)?q:[b.dataset.thqnext]});return;}
  if(T.closest('[data-thpskip]')){const t=thT3Fill(),now=thNow();if(TH_P.rows.some(r=>r.need<4)){thLog('s');TH_P.rows.filter(r=>r.need<4).forEach(r=>{(t.skips[r.id]=t.skips[r.id]||[]).push(now);t.skips[r.id]=t.skips[r.id].slice(-5);});save();}thPanelStart();return;}
  if(T.closest('[data-thpstart]')){thPanelStart();return;}
  if((b=T.closest('[data-thlesson]'))){TH_BACK.card=b.dataset.thfrom;TH_BACK.lesson=b.dataset.thlesson;closeSheets();openLesson(b.dataset.thlesson);return;}
  if((b=T.closest('[data-thquad]'))){VP.progress.thq=VP.progress.thq===b.dataset.thquad?null:b.dataset.thquad;render();return;}
});
addEventListener('resize',()=>{if(TH_P.lesson&&!$('#prac').classList.contains('hidden'))thPanelSync();});

/* ---------- tests (run inside theoryTests) ---------- */
async function thT3Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const keep=JSON.stringify({theory:state.theory,set:state.set,prog:state.prog,n:state.sessions.length});
  const fresh=()=>{state.theory={cards:{},review:{},bookmarks:[],lastCard:null};thT3Fill();};
  // 1. shared synth
  {const bad=[],all=[];(function walk(x){if(!x||typeof x!=='object')return;if(x.id&&x.dg&&x.dg.type==='keys'){all.push(x);return;}Object.values(x).forEach(walk);})(DP_THEORY);
   all.forEach(c=>{const lo=c.dg.from,hi=lo+12*(c.dg.oct||1);[].concat(c.hear||[]).forEach(h=>(h.seq||[]).flat(2).forEach(m=>{if(typeof m==='number'&&(m<lo||m>hi))bad.push(c.id+':'+m);}));(c.dg.hi||[]).forEach(m=>{if(m<lo||m>hi)bad.push(c.id+' hi '+m);});});
   T('Keyboard cards: every note Hear it plays is on the drawn keyboard ('+all.length+' cards)',all.length>20&&!bad.length,bad.join(' '));}
  const BT=window.BacklineTone;T('Shared tone synth loaded (Backline tone '+(BT&&BT.VERSION)+')',BT&&BT.VERSION==='0.1.0'&&typeof BT.Tone==='function','');
  {const v=BT.voicing('C'),vl=BT.voiceLead([60,64,67],'F');T('Synth: C = C E G over a low C',v&&v.bass===36&&v.pad.map(BT.mod).sort((a,b)=>a-b).join()==='0,4,7',v&&JSON.stringify(v));
   T('Synth: voice leading C → F keeps the common C',vl&&vl.includes(60)&&vl.map(BT.mod).sort((a,b)=>a-b).join()==='0,5,9',vl&&vl.join(' '));}
  {const bad=[];let n=0;TH_ORDER.forEach(k=>thHearSpecs(k).concat((k.check||[]).filter(q=>q.hear).map(q=>q.hear)).forEach(sp=>{if(!sp.seq&&!sp.chords)return;n++;try{const P0=thTonePlan(sp);if(!(P0.total>0))bad.push(k.id);if(sp.chords&&sp.chords.some(c=>!BT.parseChord(c)))bad.push(k.id+' chord');if(sp.seq&&sp.seq.some(x=>x!=null&&[].concat(x).some(m=>!(m>=24&&m<=108))))bad.push(k.id+' note');}catch(e){bad.push(k.id+' '+e.message);}}));
   T('Every tone Hear it plans (notes in range, chord names readable) ('+n+' sounds)',n>0&&!bad.length,bad.slice(0,6).join(' '));}
  {const ear=TH_ORDER.filter(k=>k.ear);const bad=ear.filter(k=>!k.check.some(q=>q.hear));T('Listening cards have questions you hear ('+ear.length+' cards)',ear.length&&!bad.length,bad.map(k=>k.id).join(' '));
   if(ear.length){fresh();const k=ear[0];delete TH_ANS[k.id];k.check.forEach((q,i)=>thAnswer(k.id,i,q.c));T('A listening check passed → Can hear',thSt(k.id)==='h',k.id+' '+thSt(k.id));}}
  // 2. panel ranking + smart display
  fresh();const lid='1.5.03';state.prog=JSON.parse(JSON.stringify(state.prog));delete state.prog[lid];const keepSess=state.sessions;state.sessions=state.sessions.filter(s=>s.id!==lid);
  {const rows=thPanelRows(lid);T('Panel ranks core cards first, then new before known',rows.length>2&&rows[0].core&&rows[0].need===0,rows.slice(0,3).map(r=>r.id+(r.core?'*':'')+r.need).join(' '));
   const ids=rows.map(r=>r.id);thMark(ids[0],'u',true);const r2=thPanelRows(lid);T('…an understood card drops to the end',r2[r2.length-1].id===ids[0]||r2.filter(r=>r.need===4).some(r=>r.id===ids[0])&&r2.findIndex(r=>r.id===ids[0])>r2.findIndex(r=>r.need<4),'');}
  fresh();{const m=thPanelMode(lid);T('Smart: first visit opens the panel',m.mode==='open'&&m.why==='first visit',m.mode+' '+m.why);
   thT3Fill().auto[lid]=today();T('Smart: at most once per lesson per day',thPanelMode(lid).mode==='chip','');
   T('Never during a run, routine or stretch (chip only)',thPanelMode('2.1.04',{busy:true}).mode==='chip','');
   const ks=state.set.thPanel;state.set.thPanel='never';T('Setting “Never”: chip only',thPanelMode('2.1.04').mode==='chip','');state.set.thPanel='always';T('Setting “Always”: opens',thPanelMode('2.1.04').mode==='open','');state.set.thPanel=ks;
   fresh();state.prog[lid]={attempts:3,bpm:60,status:'progress'};const m2=thPanelMode(lid);T('Smart: a new core card opens it (not a first visit)',m2.mode==='open'&&m2.why==='core card new or due',m2.mode+' '+m2.why);
   const t=thT3Fill(),now=thNow();thPanelRows(lid).forEach(r=>{t.skips[r.id]=[now-1000,now-500];});T('Smart: cards skipped twice stop auto-opening for 7 days',thPanelMode(lid).mode==='chip','');
   fresh();thT3Fill().plog=['s','s','s','s','s','s'];T('Smart: you always skip → it settles to the chip',thPanelMode(lid).mode==='chip','');
   fresh();thPanelRows(lid).forEach(r=>thMark(r.id,'u',true));T('All cards understood → quiet tick, still listing every card',thPanelMode(lid).mode==='tick'&&thPanelRows(lid).length>0,'');}
  // 3. fix it with theory
  {fresh();const R={lesson:LBY['2.1.04'],sub:4,spb:16,evs:[]};for(let i=0;i<32;i++)R.evs.push({step:i,v:'S',ch:'x',hitT:1,dt:i%4===1||i%4===3?45:0,artOk:true});
   const rows=thFixRows(R,{avg:-20,dynScore:null,passed:false});T('Fix it: late “e”/“a” → the 16ths card; rushing → its card; max 3',rows.length&&rows.length<=3&&thCardConcepts(rows[0].card).includes('sixteenth')&&rows.some(r=>r.card==='A1.09.2'),rows.map(r=>r.card+': '+r.text).join(' | '));
   const R2={lesson:LBY['3.2.07'],sub:4,spb:16,evs:[{step:0,v:'S',ch:'X',hitT:1,dt:0,dynOk:false},{step:2,v:'S',ch:'g',hitT:1,dt:0,dynOk:false},{step:4,v:'HH',ch:'o',hitT:1,dt:0,artOk:false}]};
   const r2=thFixRows(R2,{avg:0,dynScore:40,passed:false});T('Fix it: weak accents / loud ghosts / open hi-hat → their cards',['accent','ghost','openhh'].every(tg=>r2.some(r=>thCardConcepts(r.card).includes(tg))),r2.map(r=>r.card).join(' '));
   thPanelRows(lid).forEach(r=>thMark(r.id,'u',true));state.prog[lid]={attempts:4,bpm:60,status:'progress'};
   const h=thFixHtml(Object.assign(R,{lesson:LBY[lid]}),{avg:-20,dynScore:null,passed:false});const pm=thPanelMode(lid);T('A failed run stores its cards and the next visit opens the panel (even with every card understood)',/Fix it with theory/.test(h)&&thS().fails[lid]&&pm.mode==='open'&&pm.why==='last run',pm.mode+' '+pm.why);
   thFixHtml(R,{avg:0,dynScore:null,passed:true});T('A passing run clears it',!thS().fails[lid],'');}
  // 4. practise this, cross-tab, plan, songs, back chip
  {fresh();const k=THC['A2.04.1'],h=thPractiseThis(k);T('Practise this: quick try, your next lesson, then more',/Quick try/.test(h)&&/next lesson/.test(h),'');
   const qt=TH_ORDER.filter(c=>!c.try&&thQuickTry(c));T('Quick try built from the card’s own example ('+qt.length+' more cards)',qt.length>0&&qt.every(c=>{const ex=thQuickTry(c).ex[0],L2=(ex.steps||4*ex.sub)*ex.bars;return Object.values(ex.v).every(s=>s.length===L2);}),'');
   const x=thCross(),tot=Object.values(x).reduce((a,v)=>a+v.length,0),nc=Object.entries(thCon()).filter(([t,c])=>t[0]!=='_'&&(c.cards||[]).some(id=>THC[id])).length;
   T('Understood × Practised covers every concept once',tot===nc,tot+' / '+nc);
   thCardsFor('eighth').forEach(c=>thMark(c,'u',true));state.prog['1.5.03']={attempts:2,bpm:60,status:'progress'};const x2=thCross();T('…8th notes read and played → solid',x2.solid.includes('eighth'),'');
   fresh();const pr=thPlanRecap('1.5.03');T('Practise plan: a short recap for an item with new theory',/Theory recap/.test(pr),'');
   const t=thS();t.review[TH_ORDER[0].id]={due:thNow()-1,step:0,at:1};T('Practise plan: Remember deck reviews folded in',/1 card due/.test(thPlanDeck()),'');
   const song=allSongs().find(s=>songTags(s).some(q=>q.id==='1.5.03'));if(song){const sh=thSongConcepts(song,songStats(songCtx(),song));T('Song page: “Concepts you know: n of m”',/Concepts you know: \d+ of \d+/.test(sh),song.title);}
   TH_BACK.card='A2.04.1';TH_BACK.lesson='1.5.03';T('Opening a lesson from a card keeps a “Back to card” chip',/Back to card/.test(thLessonChips('1.5.03')),'');TH_BACK.card=TH_BACK.lesson=null;}
  // 5. never blocks: Skip, start starts the run with the panel open
  {fresh();openPractice(lid);TH_P.open=true;thPanelSync();thPanelStart();T('“Skip, start” starts the run straight away',!!run,'');stopRun(false);$('#prac').classList.add('hidden');L=null;}
  state.sessions=keepSess;const k2=JSON.parse(keep);state.theory=k2.theory;state.set=k2.set;state.prog=k2.prog;state.sessions=state.sessions.slice(0,k2.n);thFill(state);thT3Fill();
  return out;
}

/* ---------- T4 tests (Tier B: konnakol, swing in Hear it, new diagrams, concept links) ---------- */
async function thT4Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const B=TH_ORDER.filter(k=>k.id[0]==='B');
  const shipped=THP.filter(x=>x.tier==='B').map(x=>x.id);
  T('Tier B content: '+shipped.join(' ')+' loaded ('+B.length+' cards), ids unique and in plan order',B.length>=60&&new Set(B.map(k=>k.id)).size===B.length&&['B1','B2','B3','B4'].every(p=>shipped.includes(p))&&shipped.every((p,i)=>i===0||TH_PLAN.findIndex(x=>x[0]===p)>TH_PLAN.findIndex(x=>x[0]===shipped[i-1])),THP.map(p=>p.id).join());
  T('Circle of fifths: 12 major keys outside, relative minors inside, lit keys marked',(()=>{const h=TH_DG.c5({hi:['C','G']});return (h.match(/class="thtb/g)||[]).length===12&&(h.match(/thtb on/g)||[]).length===2&&/Am/.test(h)&&/F♯m/.test(h);})());
  T('Chord names the synth can’t read are played as notes (ø, °7 cards use seq)',B.every(k=>thHearSpecs(k).concat((k.check||[]).map(q=>q.hear).filter(Boolean)).every(sp=>!sp.chords||sp.chords.every(c=>!/[ø°]|m7b5|dim7/.test(c)&&BacklineTone.voicing(c)))));
  // konnakol syllables
  const m4=ntMeters(TX('t',3,{S:'xxx'}))[0];
  T('Konnakol: tisra = ta ki ta; jathis 5 and 7 built from 2+3 and 3+4',[0,1,2].map(j=>thSylAt('kon',m4,j,j)).join(' ')==='ta ki ta'&&TH_KON[5].join(' ')==='ta ka ta ki ta'&&TH_KON[7].join(' ')==='ta ki ta ta ka di mi',[0,1,2].map(j=>thSylAt('kon',m4,j,j)).join(' '));
  T('Konnakol: 5 + 7 + 4 fills a bar of 16ths, accents on each group start',thKonRun([5,7,4]).length===16&&thKonAcc([5,7,4])==='XxxxxXxxxxxxXxxx'&&thKonAcc([3,3,2])==='XxxXxxXx');
  // swing in Hear it matches the scoring engine
  const pl=thHearPlan({ex:TX('s',2,{R:'xxxxxxxx'},{swing:0.67}),bpm:60,cin:false,reps:1}),pl0=thHearPlan({ex:TX('s',2,{R:'xxxxxxxx'}),bpm:60,cin:false,reps:1});
  const d1=pl.evs[1].t-pl.evs[0].t,d2=pl.evs[2].t-pl.evs[1].t;
  T('Hear it swings like the engine: 2/3 + 1/3 of the beat at swing 0.67; straight stays even',Math.abs(d1-0.67)<0.01&&Math.abs(d2-0.33)<0.01&&Math.abs((pl0.evs[1].t-pl0.evs[0].t)-0.5)<1e-6,d1.toFixed(3)+' / '+d2.toFixed(3));
  T('Hear it words use the card’s syllables (konnakol) when given',thHearPlan({ex:TX('k',4,{S:'xxxx'}),bpm:60,cin:false,reps:1,syl:'kon'}).words.map(w=>w.kon).join(' ')==='ta ka di mi ta ka di mi ta ka di mi ta ka di mi');
  // every Tier B diagram draws and every sound plan builds
  const badDg=[],badHear=[];
  for(const k of B){const h=thDiagram(k,k.dg,'t4'+k.id);if(k.dg&&(!/<svg/.test(h)||/can’t draw/.test(h)))badDg.push(k.id);
    for(const sp of thHearSpecs(k)){try{const p=sp.seq||sp.chords?thTonePlan(sp):thHearPlan(sp);if(!(p.total>0))badHear.push(k.id);}catch(e){badHear.push(k.id+':'+e.message);}}
    for(const q of k.check||[])if(q.hear){try{thHearPlan(q.hear);}catch(e){badHear.push(k.id+' check');}}}
  T('Every Tier B diagram draws',!badDg.length,badDg.join(' '));
  T('Every Tier B Hear it (incl. listening checks) builds a plan',!badHear.length,badHear.join(' '));
  T('Tala diagram: one dot per beat (Adi tala = 8), clap/wave marked',(()=>{const h=TH_DG.tala({g:['clap','1','2','3','clap','wave','clap','wave'],split:[4,6],name:'Adi tala'});return (h.match(/class="thtb/g)||[]).length===8&&(h.match(/thtb clap/g)||[]).length===3&&(h.match(/thtb wave/g)||[]).length===2;})());
  T('Tihai (B9.05.1): three 5-note phrases with 1-step gaps; the last note lands on the next bar’s “1” with the crash',typeof B9_TIH==='undefined'||(()=>{const S=B9_TIH.S,notes=[...S].map((c,i)=>c!=='.'?i:-1).filter(i=>i>=0);return notes.length===15&&notes[notes.length-1]===16&&B9_TIH.C[16]==='x'&&[0,6,12].every(i=>S[i]==='X');})());
  // concept links: tags that were “later” now point at real cards
  const con=thCon(),later=['triplet','swing','compound','flam','drag','roll32'].filter(t=>!thCardsFor(t).length||con[t].later);
  T('Triplets, swing, 6/8–12/8, flams, drags and rolls now link to Tier B cards',!later.length,later.join());
  const lc=id=>thLessonCards(id);
  T('Lessons suggest the new cards (3.1.02 → triplets, 4.5.07 → swing, 4.1.05 → 12/8, 3.3.07 → flam)',lc('3.1.02').includes('B2.01.1')&&lc('4.5.07').some(c=>c.startsWith('B2.04'))&&lc('4.1.05').some(c=>c.startsWith('B3.0'))&&lc('3.3.07').includes('B4.01.1'));
  T('Every card id in concepts exists',Object.entries(con).filter(([k])=>k[0]!=='_').every(([,v])=>(v.cards||[]).every(id=>THC[id])),Object.entries(con).filter(([k])=>k[0]!=='_').flatMap(([,v])=>(v.cards||[]).filter(id=>!THC[id])).join(' '));
  return out;
}
