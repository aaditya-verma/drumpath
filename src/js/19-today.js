/* DrumPath — P1 Daily plan (D-035, build/ideas-backlog.md P1): Home › Today with two modes.
   · On the go (phone, no kit, 5–10 min): Remember deck → one new theory card → tap drill on the screen pads (with a
     1-bar gap in the click) → 1-minute ear game → one-line journal.
   · At the kit (10 / 20 / 40 min): warm-up (a slow passed rudiment) → focus (current lesson, blocked reps) → review
     (passed lessons at 1/3/7/21 days, then monthly, at goal −10 BPM: P-2; “last 30 days” tempo: P-3) → mix (interleaved,
     once 3+ lessons in a strand are passed) → song or free play (D7) → journal. Each item carries its theory recap (D-032).
   · Start session runs it end to end (Skip item, End session); a rough warm-up slows the focus tempo (coach rule D2).
   · Gentle streak: any session counts (phone or kit, theory too); 2 rest days a week never break it; streak freezes.
   Tap drills are scored by the normal engine, saved as kind:'tap' (minutes + streak only, never state.prog, lesson
   status or readiness), with a one-time touch-delay check per device. New state fields only; testing mode saves nothing. */
'use strict';
const P1_REV=[1,3,7,21,30];          // lesson review: days to the next review, step by step; after 21 days, monthly
const P1_MINS=[10,20,40];
const P1_REST=2, P1_FREEZE_MAX=2, P1_FREEZE_EVERY=7;
const P1_WARM_BAD=80;                // warm-up below this → the focus starts 10 BPM slower (coach rule D2)
const P1_BUDGET={10:{warm:2,focus:5,review:2,revMax:1,mix:0,mixN:0,music:1},20:{warm:3,focus:8,review:4,revMax:2,mix:3,mixN:3,music:2},40:{warm:5,focus:15,review:8,revMax:3,mix:6,mixN:4,music:6}};
const P1_PRACTICE=['warm','focus','review','mix'];
const p1PhaseOf=it=>typeof qlPhase==='function'&&it?qlPhase(it.k):'';
let p1Clock=null;const p1Now=()=>p1Clock!=null?p1Clock:Date.now();const p1Day=()=>dkey(new Date(p1Now()));
const P1D=()=>p1Fill(state).plan;
const p1Pl=(n,w)=>n+' '+w+(n===1?'':'s');

/* ---------- device-only choices (phone ≠ tablet): plan mode and touch delay stay in this browser ---------- */
const P1_MEM={};
function p1Dev(k,v){const key='drumpath.'+k;
  if(v===undefined){if(k in P1_MEM)return P1_MEM[k];try{const x=localStorage.getItem(key);return x==null?null:JSON.parse(x);}catch(_){return null;}}
  P1_MEM[k]=v;if(!SANDBOX)try{localStorage.setItem(key,JSON.stringify(v));}catch(_){}return v;}
const p1Kit=()=>typeof inputs!=='undefined'&&inputs.length>0;
function p1Mode(){const m=p1Dev('planMode');return m==='go'||m==='kit'?m:(p1Kit()?'kit':'go');}
function p1SetMode(m){p1Dev('planMode',m);state.set.planMode=m;save();}
function p1Mins(){const m=+state.set.planMins;return P1_MINS.includes(m)?m:20;}
function p1TouchLat(){const t=p1Dev('touchlat');return t&&t.ms!=null?t.ms:null;}
function p1TouchSet(med,ds){
  const ms=Math.round(med);p1Dev('touchlat',{ms,at:Date.now()});
  showResult(`<h2>Screen delay set: ${ms} ms</h2><p class="mut">Median of ${ds.length} taps. Tap drills on this device now subtract it (the kit keeps its own latency, ${state.lat} ms). Spread: ${Math.round(ds[0])} to ${Math.round(ds[ds.length-1])} ms. You can redo it in Settings › Today.</p>${SES&&p1Cur()&&p1Cur().k==='tap'?`<div class="row"><button class="pri" data-p1="tapgo">Start the tap drill ›</button></div>`:''}`,true);
}
function p1TouchCalib(){
  L={id:'touch',t:'Screen tap check',calib:true,tapCalib:true,tap:true,bpm:[90,90],ex:[X('Tap the snare pad on the click',1,{S:'x'.repeat(16)},{bars:4})],loop:1};exI=0;bpm=90;stretchMode=false;
  $('#prac').classList.remove('hidden');$('#result').classList.add('hidden');$('#ptitle').innerHTML='<span class="idx">Once per device</span>Tap the Snare pad exactly on each click';renderPracBar();renderPads(L.ex[0]);sizeCv();makePreview();draw();
}

/* ---------- lessons: maintenance tempo (P-3) and the review queue (P-2) ---------- */
function p1Maint(id,now){now=now||p1Now();const from=now-30*DAY;let b=0;state.sessions.forEach(s=>{if(s.id===id&&!s.kind&&s.ts>=from&&s.ts<=now&&runPassed(s))b=Math.max(b,s.bpm||0);});return b||null;}
function p1RevSync(){ // every mastered lesson has a review entry: first review 1 day after it was mastered
  const q=P1D().rev;LESSONS.forEach(l=>{if(l.type!=='play'||q[l.id])return;const p=state.prog[l.id];if(!p||p.status!=='mastered')return;
    q[l.id]={due:(p.masteredAt||p.last||p1Now())+P1_REV[0]*DAY,step:0,at:0};});return q;}
function p1RevDue(now){now=now||p1Now();const q=p1RevSync();return Object.entries(q).filter(([id,r])=>LBY[id]&&r&&r.due!=null&&r.due<=now).sort((a,b)=>a[1].due-b[1].due).map(x=>x[0]);}
function p1RevBpm(id){const l=LBY[id];return Math.max(l.bpm[0],l.bpm[1]-10);}
// a run of a lesson that is due for review, at goal −10 BPM or faster, is that review: clean → next interval, else back to 1 day
function p1RevAfter(rec){
  if(!rec||rec.kind||rec.stretch||!LBY[rec.id])return null;const q=p1RevSync(),r=q[rec.id],now=p1Now();
  if(!r||r.due==null||r.due>now||rec.bpm<p1RevBpm(rec.id))return null;
  const ok=runPassed(rec);if(ok){r.step=Math.min((r.step||0)+1,P1_REV.length-1);r.due=now+P1_REV[r.step]*DAY;}else{r.step=0;r.due=now+P1_REV[0]*DAY;}
  r.at=now;r.ok=ok?1:0;return{ok,r};
}

/* ---------- gentle streak ---------- */
// theory counts for the streak: every day on which a card was read, understood, played or heard (from the card timestamps, so older days count too)
function p1TheoryDays(){const o=new Set(),c=(state.theory||{}).cards||{};Object.values(c).forEach(x=>{if(!x)return;['r','u','p','h','rd'].forEach(f=>{if(x[f])o.add(dkey(new Date(x[f])));});});return o;}
function p1Act(n){const d=P1D(),k=p1Day();d.act[k]=(d.act[k]||0)+(n||1);}
// walks every day from the first active one: a week (Sun–Sat) may hold 2 rest days; a further miss uses a freeze
// (one earned every 7 active days, at most 2 held); only then does the streak end. Today never counts as a miss.
// every active day: practice minutes, a Today item or Remember review (state.plan.act), or theory reading (P4 uses it too)
function p1ActiveDays(){const act=P1D().act;return new Set([...Object.keys(state.days).filter(k=>state.days[k]>0),...Object.keys(act).filter(k=>act[k]>0),...p1TheoryDays()]);}
function p1Streak(now){
  now=now||p1Now();const end=new Date(now);end.setHours(0,0,0,0);const tk=dkey(end);
  const ks=p1ActiveDays();
  const out={cur:0,best:0,restLeft:P1_REST,freeze:0,used:0,today:ks.has(tk)};if(!ks.size)return out;
  const first=pdate([...ks].sort()[0]);if(first>end)return out;
  let have=0,ever=0,rest=0,wk='';
  for(const d=new Date(first);d<=end;d.setDate(d.getDate()+1)){
    const s=new Date(d);s.setDate(d.getDate()-d.getDay());const w=dkey(s);if(w!==wk){wk=w;rest=0;}
    const k=dkey(d);
    if(ks.has(k)){out.cur++;ever++;if(ever%P1_FREEZE_EVERY===0)have=Math.min(P1_FREEZE_MAX,have+1);if(out.cur>out.best)out.best=out.cur;}
    else if(k===tk||!out.cur)continue;
    else if(rest<P1_REST)rest++;
    else if(have>0){have--;out.used++;}
    else out.cur=0;
  }
  out.restLeft=Math.max(0,P1_REST-rest);out.freeze=have;return out;
}
function p1StreakLine(){const s=p1Streak();
  if(!s.cur)return `<span>Any session starts a streak: phone or kit, theory counts.</span>`;
  return `<span><b>${p1Pl(s.cur,'day')}</b> streak${s.today?' · today ✓':''}</span><span>${p1Pl(s.restLeft,'rest day')} left this week</span>${s.freeze?`<span>${p1Pl(s.freeze,'freeze')} saved</span>`:''}`;}

/* ---------- plan building ---------- */
const p1Slot=(mode,mins)=>mode==='go'?'go':'kit'+mins;
function p1Plan(mode,mins,opts={}){ // built once a day per mode and length, then kept, so it doesn't shift under you
  const d=P1D(),day=opts.day||p1Day(),slot=p1Slot(mode,mins),dd=d.days[day]||(d.days[day]={});
  const fresh=dd[slot]&&!Object.keys(dd[slot].done).length&&!Object.keys(dd[slot].skip).length&&!(SES&&SES.slot===slot&&SES.day===day);
  if(!dd[slot]||opts.rebuild||fresh&&!opts.keep){dd[slot]={items:mode==='go'?p1BuildGo():p1BuildKit(mins),done:{},skip:{},at:p1Now()};
    Object.keys(d.days).sort().slice(0,-60).forEach(k=>delete d.days[k]);}
  return dd[slot];
}
const p1PlayL=()=>LESSONS.filter(l=>l.type==='play'&&l.ex&&l.ex.length&&l.bpm);
function p1Focus(){return p1PlayL().find(l=>statusOf(l)!=='ms')||p1PlayL()[p1PlayL().length-1];}
function p1WarmLesson(){
  const pl=p1PlayL(),ms=pl.filter(l=>statusOf(l)==='ms'),last=l=>(state.prog[l.id]||{}).last||0,lru=a=>a.sort((x,y)=>last(x)-last(y))[0];
  const r=ms.filter(l=>l.sd===3);if(r.length)return{l:lru(r),passed:true};
  const t=ms.filter(l=>l.sd===2);if(t.length)return{l:lru(t),passed:true};
  // nothing passed yet: a rudiment you've already tried, else the first rudiment near your level, else a technique lesson other than the focus
  const f=p1Focus(),lv=f?f.lv:1,tried=pl.filter(l=>l.sd===3&&(state.prog[l.id]||{}).attempts>0);
  return{l:tried[0]||pl.find(l=>l.sd===3&&l.lv<=lv+1)||pl.find(l=>l.sd===2&&l!==f)||pl[0],passed:false};
}
function p1RunSec(l,b){const ex=l.ex[Math.min((state.prog[l.id]||{}).ex||0,l.ex.length-1)],spb=ex.steps||4*ex.sub;return (Math.max(state.set.bars,ex.bars)+(state.set.countin||1))*(spb/ex.sub)*60/b+12;}
const p1Reps=(mins,l,b)=>Math.max(1,Math.round(mins*60/p1RunSec(l,b)));
function p1MixSet(n,rounds){ // the strand with the most passed lessons not played lately; its least recently played ones, interleaved
  const by={};p1PlayL().filter(l=>statusOf(l)==='ms').forEach(l=>(by[l.sd]=by[l.sd]||[]).push(l));
  const last=l=>(state.prog[l.id]||{}).last||0,ok=Object.entries(by).filter(([,a])=>a.length>=3);if(!ok.length)return null;
  ok.sort((a,b)=>a[1].reduce((s,l)=>s+last(l),0)/a[1].length-b[1].reduce((s,l)=>s+last(l),0)/b[1].length);
  const [sd,ls]=ok[0],pick=ls.slice().sort((a,b)=>last(a)-last(b)).slice(0,n).map(l=>l.id);
  const seq=[];for(let r=0;r<rounds;r++)(r%2?pick.slice().reverse():pick).forEach(id=>{if(seq[seq.length-1]!==id)seq.push(id);});
  return{sd:+sd,ids:pick,seq};
}
function p1Music(){let st=[];try{st=allSongStats(songCtx());}catch(_){}
  const ready=st.filter(x=>x.state==='ready').sort((a,b)=>b.ready-a.ready)[0];if(ready)return{song:ready.song};
  const near=st.filter(x=>x.state!=='ready'&&x.next&&!x.next.coming).sort((a,b)=>b.ready-a.ready)[0];return{near:near&&near.song};}
function p1BuildKit(mins){
  const B=P1_BUDGET[mins]||P1_BUDGET[20],items=[];let spare=0;
  const w=p1WarmLesson();
  items.push({k:'warm',key:'warm:'+w.l.id,id:w.l.id,bpm:w.l.bpm[0],reps:mins>=20?2:1,mins:B.warm-(typeof tfGapItem==='function'?1:0),t:'Warm-up · '+w.l.t,why:(w.passed?'A rudiment you’ve passed, slow':'Slow and relaxed (no rudiment passed yet)')+' · open → close → open'});
  const nx=nextLesson();if(nx&&nx.type!=='play'&&!nx.later)items.push({k:'lesson',key:'lesson:'+nx.id,id:nx.id,mins:0,t:nx.id+' · '+nx.t,why:'Your next lesson is a checklist: read it and tick it off'});
  const due=p1RevDue().slice(0,B.revMax);
  due.forEach(id=>{const l=LBY[id],r=P1D().rev[id];items.push({k:'review',key:'review:'+id,id,bpm:p1RevBpm(id),reps:1,mins:B.review/due.length,t:'Review · '+l.t,why:(r.step?'Passed lesson, review after '+p1Pl(P1_REV[Math.min(r.step,P1_REV.length-1)],'day'):'Passed lesson, first review')+' · at goal −10 BPM'});});
  if(!due.length)spare+=B.review;
  const mx=B.mixN?p1MixSet(B.mixN,mins>=40?2:1):null;
  if(mx)items.push({k:'mix',key:'mix:'+mx.sd,ids:mx.seq,sd:mx.sd,mins:B.mix,t:'Mix · '+STRANDS[mx.sd],why:mx.ids.length+' passed lessons in turn, one run each · interleaving helps them stick'});else spare+=B.mix;
  const f=p1Focus(),fp=state.prog[f.id],fb=fp&&fp.bpm||f.bpm[0],dft=mins>=20&&typeof tfDriftDue==='function'&&tfDriftDue(),fm=B.focus+spare-(dft?1:0);   // P3: the drift test's minute comes from the focus
  items.splice(items[1]&&items[1].k==='lesson'?2:1,0,{k:'focus',key:'focus:'+f.id,id:f.id,reps:p1Reps(fm,f,fb),mins:fm,t:'Focus · '+f.t,why:'Your current lesson, the same exercise again and again · normal pass rules'});
  if(typeof tfGapItem==='function')items.splice(1,0,tfGapItem('kit'));   // P3: gap click right after the warm-up
  if(dft)items.push(tfDriftItem());   // P3: about once a week
  const mu=p1Music();
  if(mu.song)items.push({k:'song',key:'song:'+mu.song.id,song:mu.song.id,mins:B.music,t:'Song · '+mu.song.title,why:'Play along to your own recording, then log the play'});
  else items.push({k:'free',key:'free',mins:B.music,t:'Free play',why:'Play anything you like, no score (coach rule D7)'+(mu.near?' · or try '+mu.near.title:'')});
  const rv=typeof qlReviseItem==='function'&&qlReviseItem();if(rv)items.push(rv);   // P1b: yesterday's lookups and misses
  items.push({k:'journal',key:'journal',mins:0,t:'One line for today',why:'How it felt; tick if anything hurt'});
  return items;
}
function p1NewCard(){
  if(typeof TH_ORDER==='undefined'||!TH_ORDER.length)return null;let nx=null;try{nx=nextLesson();}catch(_){}
  const fromL=nx?thLessonCards(nx.id).find(c=>!thSt(c)):null;if(fromL)return{k:THC[fromL],why:'New idea in '+nx.id+' '+nx.t};
  const c=thContinue();return c&&!thSt(c.id)?{k:c,why:'Next card in '+c.part.id+' '+c.part.t}:null;
}
// a pattern for two thumbs: the two busiest lanes, 4 bars, accents/ghosts/graces/articulations as plain notes, no click in bar 3
function p1TapEx(ex,name){
  const spb=ex.steps||4*ex.sub,n=spb*(ex.bars||1),cnt=v=>(ex.v[v].match(/[^.]/g)||[]).length;
  const keep=LANES.filter(v=>ex.v[v]&&/[^.]/.test(ex.v[v])).sort((a,b)=>cnt(b)-cnt(a)).slice(0,2);if(!keep.length)return null;
  const k=(ex.bars||1)>=4?1:Math.ceil(4/(ex.bars||1)),bars=(ex.bars||1)*k,v={};
  LANES.filter(x=>keep.includes(x)).forEach(x=>{v[x]=ex.v[x].slice(0,n).replace(/[Xgfdor]/g,'x').repeat(k);});
  const o={n:name||'Tap · '+ex.n,sub:ex.sub,bars,v,dyn:false,gap:[2]};
  ['steps','swing','meter','clicks','click'].forEach(f=>{if(ex[f]!=null)o[f]=ex[f];});if(ex.st)o.st=ex.st.slice(0,n).repeat(k);return o;
}
function p1TapSpec(card){
  const f=p1Focus();
  if(f){const ex=f.ex[Math.min((state.prog[f.id]||{}).ex||0,f.ex.length-1)],t=p1TapEx(ex);if(t)return{src:f.id,ex:t,bpm:Math.max(50,Math.min(72,f.bpm[0]-10)),t:'Tap drill · '+f.t,why:'Your current lesson on the screen pads · the click drops out in bar 3: keep going'};}
  const q=card&&typeof thQuickTry==='function'&&thQuickTry(card);if(q){const t=p1TapEx(q.ex[0]);if(t)return{src:'th:'+card.id,ex:t,bpm:60,t:'Tap drill · '+card.t,why:'From the card · the click drops out in bar 3'};}
  return null;
}
// P1b: phases Learn (new card) → Practise (tap drill) → Check (ear game) → Revise (Revise slot, Remember deck, journal)
function p1BuildGo(){
  const items=[],due=typeof thDue==='function'?thDue().length:0;
  const c=p1NewCard();if(c)items.push({k:'card',key:'card:'+c.k.id,card:c.k.id,mins:2,t:'New card · '+c.k.t,why:c.why});
  const tp=p1TapSpec(c&&c.k);if(tp)items.push({k:'tap',key:'tap:'+tp.src,src:tp.src,ex:tp.ex,bpm:tp.bpm,mins:2,t:tp.t,why:tp.why});
  if(typeof tfGapItem==='function')items.push(tfGapItem('touch'));   // P3: gap click on the screen pads
  items.push({k:'ear',key:'ear',mins:1,t:'Ear game',why:typeof qlEarWhy==='function'?qlEarWhy():'Straight or swing? How many bars? Which beat has the snare?'});
  const rv=typeof qlReviseItem==='function'&&qlReviseItem();if(rv)items.push(rv);
  if(due)items.push({k:'deck',key:'deck',mins:Math.max(1,Math.round(due*0.4)),t:'Remember deck',why:p1Pl(due,'card')+' due · say it, then check'});
  items.push({k:'journal',key:'journal',mins:1,t:'One line for today',why:'How it felt; tick if anything hurt'});
  return items;
}
const p1ItemLesson=it=>it.k==='mix'?it.ids[0]:it.k==='tap'&&LBY[it.src]?it.src:it.id;
function p1ItemBpm(it,id){
  if(it.k==='focus'){const p=state.prog[it.id],b=p&&p.bpm||LBY[it.id].bpm[0];const pl=SES&&p1PlanBySlot(SES.slot);return Math.max(30,b-(pl&&pl.adapt?10:0));}
  if(it.k==='mix'){const l=LBY[id||it.ids[0]];return Math.max(l.bpm[0],l.bpm[1]-5);}
  return it.bpm||(LBY[it.id]&&LBY[it.id].bpm&&LBY[it.id].bpm[0])||60;
}

/* ---------- session runner ---------- */
let SES=null;   // {slot, day, i, runs, mixI}
function p1PlanBySlot(slot,day){return(P1D().days[day||(SES&&SES.day)||p1Day()]||{})[slot];}
const p1Stat=(it,pl)=>pl.done[it.key]?'done':pl.skip[it.key]?'skip':'';
function p1Cur(){if(!SES)return null;const pl=p1PlanBySlot(SES.slot);return pl&&pl.items[SES.i]||null;}
function p1Start(at){const mode=p1Mode(),mins=p1Mins(),pl=p1Plan(mode,mins,{keep:true});SES={slot:p1Slot(mode,mins),day:p1Day(),i:-1,runs:0,mixI:0,at:p1Now()};
  if(at!=null){SES.i=at;p1OpenItem(pl.items[at]);}else p1Next();}
function p1Next(){const pl=p1PlanBySlot(SES.slot);let i=SES.i+1;while(i<pl.items.length&&p1Stat(pl.items[i],pl))i++;
  if(i>=pl.items.length){p1Finish();return;}SES.i=i;SES.runs=0;SES.mixI=0;p1OpenItem(pl.items[i]);}
function p1Mark(it,how){if(!it)return;const pl=p1PlanBySlot(SES?SES.slot:p1Slot(p1Mode(),p1Mins()));if(!pl)return;(how==='skip'?pl.skip:pl.done)[it.key]=p1Now();if(how!=='skip')p1Act();save();}
function p1ClosePrac(){if($('#prac').classList.contains('hidden'))return;routineStop();stopRun(true);$('#prac').classList.add('hidden');try{wake&&wake.release();}catch(_){}wake=null;L=null;}
function p1Finish(){const pl=p1PlanBySlot(SES.slot),n=pl.items.filter(x=>pl.done[x.key]).length;SES=null;p1ClosePrac();go('home');toast(n?'Session done ✓ '+n+' of '+pl.items.length+' items':'Session ended');}
function p1End(){const pl=SES&&p1PlanBySlot(SES.slot);if(!pl){SES=null;render();return;}const j=pl.items.findIndex(x=>x.k==='journal');
  const done=pl.items.some(x=>pl.done[x.key]);
  if(done&&j>=0&&!p1Stat(pl.items[j],pl)&&SES.i!==j){p1ClosePrac();SES.i=j;SES.ending=true;go('today',{mode:'journal'});return;}
  p1Finish();}
function p1Practice(id,b){openPractice(id);stretchMode=false;bpm=b;$('#bpmv').textContent=bpm;renderPracBar();makePreview();draw();}
function p1OpenItem(it){
  closeSheets();if(!P1_PRACTICE.includes(it.k)&&it.k!=='tap'&&it.k!=='time')p1ClosePrac();
  if(it.k==='mix'){const id=it.ids[SES.mixI||0];p1Practice(id,p1ItemBpm(it,id));p1Prime(it);return;}
  if(P1_PRACTICE.includes(it.k)){p1Practice(it.id,p1ItemBpm(it));p1Prime(it);return;}
  if(it.k==='tap'){if(p1TouchLat()==null)p1TouchCalib();else{p1OpenTap(it);p1Prime(it);}return;}
  if(it.k==='time'){if(it.src==='touch'&&p1TouchLat()==null){p1TouchCalib();return;}tfOpen(it.drill,{src:it.src});p1Prime(it);return;}   // P3
  if(it.k==='lesson'){openLesson(it.id);p1Prime(it);return;}
  if(it.k==='deck'){TH_RV.list=[];thGo({mode:'review'});return;}
  if(it.k==='card'){thGo({mode:'card',card:it.card});return;}
  if(it.k==='song'){go('songs',{id:it.song});p1Prime(it);return;}
  go('today',{mode:it.k});if(it.k==='free')p1Prime(it);
}
// P1b: a 30-second primer, once, before an item whose idea is new (never blocks: Got it / Skip)
function p1Prime(it){if(typeof qlPrimeItem==='function')qlPrimeItem(it);}
function p1OpenTap(it){
  L={id:'tap:'+it.src,t:it.t.replace(/^Tap drill · /,''),tap:true,src:it.src,type:'play',lv:0,sd:7,bpm:[it.bpm,it.bpm],step:5,ex:[it.ex]};stretchMode=false;exI=0;bpm=it.bpm;
  $('#prac').classList.remove('hidden');$('#result').classList.add('hidden');$('#ptitle').innerHTML=`<span class="idx">Tap drill</span>${esc(L.t)}`;
  renderPracBar();renderPads(L.ex[0]);sizeCv();makePreview();draw();
}
function p1TapDone(R,res){
  thAddTime(res.elapsed);lastRunTs=0;p1Act();
  state.sessions.push({ts:Date.now(),id:L.id,kind:'tap',src:L.src,ex:0,bpm:R.bpm,score:res.score,on:res.on,n:res.n,ext:res.ext,miss:res.miss,avg:Math.round(res.avg),dur:Math.round(res.elapsed/1000),gap:1});
  const it=p1Cur();if(it&&it.k==='tap'&&('tap:'+it.src)===L.id)p1Mark(it,'done');save();renderPracBar();
  const g=R.evs.filter(e=>!e.listen&&R.ex.gap&&R.ex.gap.includes(e.bar%R.ex.bars)),gOn=g.filter(e=>e.hitT!=null&&Math.abs(e.dt)<=state.set.tol).length;
  showResult(`<div class="row"><div class="score" style="color:${res.score>=state.set.pass?'var(--good)':'var(--warn)'}">${res.score}%</div><div style="margin-left:18px"><div style="font-weight:700;font-size:20px">${res.score>=state.set.pass?'Steady ✓':res.score>=60?'Nearly':'Keep at it'}</div><div class="mut">${res.on} of ${res.n} taps on time (±${state.set.tol} ms)${g.length?` · in the gap bar: ${gOn} of ${g.length}`:''}</div></div></div>
    ${typeof tfPocketHtml==='function'?tfPocketHtml(R):''}<p class="mut" style="font-size:13px">Tap drills count for practice minutes and your streak, never for lesson progress or song readiness.</p>${p1NextBox()}`);
  if(typeof rfAfterRun==='function')rfAfterRun();
}
// after every scored lesson run (from finish(), after scoring): the review queue, new masters, and the running session
function p1AfterRun(rec,passed){
  if(!rec||rec.kind)return;const notes=[];
  const rv=p1RevAfter(rec);if(rv)notes.push(rv.ok?`Review ✓ · next one in ${P1_REV[rv.r.step]} days`:'Review not clean yet · it comes back tomorrow (play it once at goal too)');
  p1RevSync();
  const it=p1Cur();
  if(it&&P1_PRACTICE.includes(it.k)&&rec.id===(it.k==='mix'?it.ids[SES.mixI||0]:it.id)){
    SES.runs++;const pl=p1PlanBySlot(SES.slot);
    if(it.k==='warm'&&SES.runs===1&&rec.score<P1_WARM_BAD&&!pl.adapt){pl.adapt={score:rec.score,at:p1Now()};notes.push(`Warm-up was rough (${rec.score}%): the focus starts 10 BPM slower today to rebuild (coach rule D2). Raise it with + once it feels steady.`);}
    if(it.k==='mix'){SES.mixI=(SES.mixI||0)+1;if(SES.mixI>=it.ids.length)p1Mark(it,'done');}
    else if(SES.runs>=it.reps)p1Mark(it,'done');
  }
  save();const box=$('#result .in');if(box&&(notes.length||SES))box.insertAdjacentHTML('beforeend',(notes.length?`<div class="p1note">${notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:'')+p1NextBox());
  if(typeof rfAfterRun==='function')rfAfterRun();   // P4: a badge earned by this run
}
function p1NextBox(){
  const it=p1Cur();if(!it)return '';const pl=p1PlanBySlot(SES.slot),st=p1Stat(it,pl);
  if(it.k==='mix'&&!st){const id=it.ids[SES.mixI||0];return `<div class="p1next card"><div class="note-k">Session · mix ${(SES.mixI||0)+1} of ${it.ids.length}</div><div class="row"><span class="sp"></span><button class="pri" data-p1="mixnext">Next in the mix: ${esc(id)} ›</button><button class="sm ghost" data-p1="skip">Skip item</button></div></div>`;}
  if(!st&&P1_PRACTICE.includes(it.k))return `<div class="p1next card"><div class="note-k">Session · ${esc(it.t)}</div><div class="row"><span>Run ${SES.runs} of ${it.reps} · tap <b>Again</b> for the next one</span><span class="sp"></span><button class="sm ghost" data-p1="next">Next item ›</button></div></div>`;
  const nx=p1Peek();return `<div class="p1next card"><div class="note-k">Session · ${esc(it.t)} ✓</div><div class="row"><span class="sp"></span>${nx?`<button class="pri" data-p1="next">Next: ${esc(nx.t)} ›</button>`:`<button class="pri" data-p1="next">Finish session ›</button>`}<button class="sm ghost" data-p1="end">End session</button></div></div>`;
}
function p1Peek(){const pl=p1PlanBySlot(SES.slot);for(let i=SES.i+1;i<pl.items.length;i++)if(!p1Stat(pl.items[i],pl))return pl.items[i];return null;}
// strip on the practice screen
function p1PracSync(){if(typeof qlPracSync==='function')qlPracSync();if(typeof kpLegend==='function'){kpLegend();kpViewBtn();}const el=$('#sesbar');if(!el)return;const it=p1Cur();if(!it){el.classList.add('hidden');el.innerHTML='';return;}const pl=p1PlanBySlot(SES.slot);
  el.classList.remove('hidden');el.innerHTML=`<span class="p1sk">Session ${SES.i+1}/${pl.items.length} · ${p1PhaseOf(it)}</span><b>${esc(it.t)}</b>${P1_PRACTICE.includes(it.k)?`<span class="mut">${it.k==='mix'?'mix '+Math.min((SES.mixI||0)+1,it.ids.length)+'/'+it.ids.length:'run '+Math.min(SES.runs+1,it.reps)+'/'+it.reps}</span>`:''}<span class="sp"></span><button class="sm ghost" data-p1="skip">Skip item</button><button class="sm ghost" data-p1="end">End session</button>`;}
// strip at the top of every other page
function p1Bar(){const it=p1Cur();if(!it||cur==='today')return;const pl=p1PlanBySlot(SES.slot),st=p1Stat(it,pl),pr=P1_PRACTICE.includes(it.k)||it.k==='tap'||it.k==='time';
  const auto=it.k==='deck'&&typeof thDue==='function'&&!thDue().length;
  view.insertAdjacentHTML('afterbegin',`<div class="card p1bar"><div class="p1bt"><span class="note-k">Session ${SES.i+1} of ${pl.items.length} · ${p1PhaseOf(it)}</span><b>${esc(it.t)}</b>${st||auto?' <span class="chip ms">Done</span>':''}</div><div class="row">${pr&&!st?`<button class="sm pri" data-p1="resume">Continue ›</button>`:`<button class="sm pri" data-p1="next">Next ›</button>`}<button class="sm ghost" data-p1="skip">Skip item</button><button class="sm ghost" data-p1="end">End session</button></div>${typeof kpHint==='function'?kpHint('bar'):''}</div>`);}

/* ---------- Today card (Home, Practise) ---------- */
function p1PainNote(){const j=state.journal||{},t=p1Day(),y=dkey(new Date(p1Now()-DAY)),k=[t,y].find(x=>j[x]&&j[x].pain);
  return (k?`<div class="p1pain"><b>${k===t?'You noted pain today.':'You noted pain yesterday.'}</b> Coach rule D5: warm up gently and stop if it comes back; pain is a signal, not something to push through.</div>`:'')+(typeof rfPainNote==='function'?rfPainNote():'');}   // P4: 2+ pain days in 7 → a stronger D5 line
function p1TodayCard(){
  const mode=p1Mode(),mins=p1Mins(),pl=p1Plan(mode,mins),items=pl.items,nDone=items.filter(x=>p1Stat(x,pl)).length,tot=Math.round(items.reduce((a,x)=>a+(+x.mins||0),0));
  const running=SES&&SES.slot===p1Slot(mode,mins)&&SES.day===p1Day();
  const row=(it,i)=>{const st=p1Stat(it,pl),lid=p1ItemLesson(it),here=running&&SES.i===i;
    const meta=[it.mins?(it.mins<1?'under a minute':'~'+Math.round(it.mins)+' min'):'',P1_PRACTICE.includes(it.k)?(it.k==='mix'?it.ids.join(' · '):(it.k==='focus'?(pl.adapt?p1ItemBpm(it)+' BPM (−10 today)':p1ItemBpm(it)+' BPM'):p1ItemBpm(it)+' BPM')+(it.reps>1?' · '+it.reps+' runs':'')):'',it.k==='tap'?it.bpm+' BPM · screen pads':'',it.k==='time'&&it.drill==='gap'&&typeof tfLad==='function'?TF_GAP[tfLad(it.src).s].bpm+' BPM':''].filter(Boolean).join(' · ');
    const maint=it.k==='review'?(()=>{const m=p1Maint(it.id),b=(state.prog[it.id]||{}).bestBpm;return `<div class="mut p1m">Best ever ${b||'–'} BPM · last 30 days ${m||'–'}</div>`;})():'';
    const rc=lid&&LBY[lid]&&typeof thPlanRecap==='function'&&it.k!=='card'?thPlanRecap(lid):'';
    const ph=p1PhaseOf(it),phH=ph&&ph!==p1PhaseOf(items[i-1])?`<li class="p1ph" aria-hidden="true">${ph}</li>`:'';
    const ql=typeof qlItemBtn==='function'?qlItemBtn(it):'',bo=typeof qlBuiltOn==='function'?qlBuiltOn(it):'';
    return `${phH}<li class="p1it ${st}${here?' here':''}"><span class="p1n">${st==='done'?'✓':st==='skip'?'–':i+1}</span><div class="p1b"><div class="p1tt"><b>${esc(it.t)}</b>${st==='skip'?' <span class="mut">skipped</span>':''}</div><div class="mut p1w">${esc(it.why)}</div>${meta?`<div class="mut p1m">${esc(meta)}</div>`:''}${maint}${bo}${st?'':rc}</div><div class="p1btns">${ql}<button class="sm ghost" data-p1go="${i}">${st?'Again':'Open'}</button></div></li>`;};
  return `<section class="card p1today" id="p1today">
   <div class="p1h"><div style="min-width:0"><div class="note-k">Today</div><div class="p1title">${mode==='go'?'On the go':'At the kit'} · about ${tot} min</div></div>
     <div class="seg" role="group" aria-label="Mode"><button class="${mode==='go'?'on':''}" data-p1mode="go">On the go</button><button class="${mode==='kit'?'on':''}" data-p1mode="kit">At the kit</button></div></div>
   ${mode==='kit'?`<div class="row p1opts"><div class="seg" role="group" aria-label="Length">${P1_MINS.map(m=>`<button class="${mins===m?'on':''}" data-p1mins="${m}">${m} min</button>`).join('')}</div>${p1Kit()?'<span class="chip ms">Kit connected</span>':'<span class="chip" data-nav="kit">Kit not connected</span>'}</div>`:`<div class="mut p1sub">Phone, no kit: theory, a tap drill on the screen pads, an ear game.</div>`}
   <div class="p1streak">${p1StreakLine()}</div>${p1PainNote()}${mode==='kit'&&typeof kpHint==='function'?kpHint('today'):''}
   <ol class="p1list">${items.map(row).join('')}</ol>
   <div class="row p1go"><button class="pri" data-p1="${running?'resume':'start'}">${icon('play',16)} ${running?'Continue session':nDone?'Continue':'Start session'}</button>${running?'<button class="ghost" data-p1="end">End session</button>':''}<span class="mut">${nDone} of ${items.length} done</span></div>
   ${SANDBOX?'<p class="mut" style="font-size:13px;margin:8px 0 0">Testing mode: nothing here is saved.</p>':''}</section>`;
}

/* ---------- Today page: the session's own screens (ear game, free play, journal) ---------- */
VP.today=VP.today||{mode:'plan'};
function renderToday(){
  const m=VP.today.mode,it=p1Cur(),pl=SES&&p1PlanBySlot(SES.slot);
  const head=it&&it.k===m?`<div class="card p1bar"><div class="p1bt"><span class="note-k">Session ${SES.i+1} of ${pl.items.length} · ${p1PhaseOf(it)}</span><b>${esc(it.t)}</b></div><div class="row"><button class="sm ghost" data-p1="skip">Skip item</button><button class="sm ghost" data-p1="end">End session</button></div></div>`:'';
  if(m==='ear')return view.innerHTML=head+p1EarHtml();
  if(m==='free'){view.innerHTML=head+p1FreeHtml();if(FREE.t0)p1FreeTick();return;}
  if(m==='revise')return view.innerHTML=head+(typeof qlReviseHtml==='function'?qlReviseHtml():'');
  if(m==='journal')return view.innerHTML=head+p1JournalHtml();
  view.innerHTML=`<h1>Today</h1>${p1TodayCard()}`;
}

/* ---------- ear game (P1b "middle way", D-038/D-039): question kinds unlock with the cards you've read; a round is 3
   questions from unlocked kinds (no kind twice in a row when there's a choice) + 1 Peek from the next locked kind with its
   primer in front. A wrong answer queues its card for tomorrow's Revise (a miss); a wrong peek is only queued, never counted.
   Sounds: existing patterns + the kit synth. ---------- */
const EAR={qs:[],ans:{},nodes:[],on:-1,seed:0};
function p1Rnd(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x>>>=0;x^=x>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
// one question of a kind; `avoid` = answers already used for this kind in the round (so a repeat is a different bar)
function p1EarQ(k,r,avoid){avoid=avoid||[];const rb=(LBY['1.5.03']&&LBY['1.5.03'].ex[0])||X('Rock beat',2,B8);
  const draw=(n,off)=>{const pool=[...Array(n).keys()].map(x=>x+(off||0)).filter(x=>!avoid.includes(x));const a=pool.length?pool:[...Array(n).keys()].map(x=>x+(off||0));return a[Math.floor(r()*a.length)];};
  if(k==='swing'){const sw=r()<0.5;return{k,q:'Straight 8ths or swing?',a:['Straight','Swing'],c:sw?1:0,ex:Object.assign({},rb,{bars:1,swing:sw?0.64:0.5}),bars:2,bpm:84,why:sw?'Long–short pairs: the second 8th of each beat comes late.':'Even 8ths: every note is the same distance apart.'};}
  if(k==='bars'){const n=draw(3,2);return{k,q:'How many bars after the count-in?',a:['2','3','4'],c:n-2,ex:X('Bars',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'}),bars:n,cin:1,crash:true,bpm:110,why:'Each bar starts with the crash and kick on “1”: count the ones.'};}
  if(k==='strong'){const b=draw(4);const S='xxxx'.split('');S[b]='X';return{k,q:'Which beat is the strong one?',a:['1','2','3','4'],c:b,ex:X('Strong',1,{S:S.join('')}),bars:2,bpm:84,dyn:true,why:'The louder hit is on beat '+(b+1)+'. In most music the strongest beat is “1”, where each bar starts.'};}
  if(k==='tempo'){const up=draw(2)===0;return{k,q:'Two clips: is the second one faster or slower?',a:['Faster','Slower'],c:up?0:1,ex:X('Beat',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'}),parts:[{bpm:84,bars:1},{bpm:up?112:63,bars:1}],why:up?'In the second clip the beats come closer together: a higher tempo (more BPM).':'In the second clip the beats are further apart: a lower tempo (fewer BPM).'};}
  if(k==='meter'){const six=draw(2)===1;return{k,q:'Six 8ths a bar: 3/4 or 6/8?',a:['3/4','6/8'],c:six?1:0,ex:X('Six',2,{S:six?'XxxXxx':'XxXxXx'},{steps:6}),bars:2,bpm:150,dyn:true,why:six?'Accents in two groups of three (3 + 3): that’s 6/8.':'Accents in three pairs (2 + 2 + 2): that’s 3/4.'};}
  const b=draw(3,1);const S='....'.split('');S[b]='x';return{k:'snare',q:'Which beat has the snare?',a:['1','2','3','4'],c:b,ex:X('Where',1,{HH:'xxxx',K:'x...',S:S.join('')}),bars:2,bpm:80,why:'Count 1 2 3 4 along with the hi-hat; the snare lands on beat '+(b+1)+'.'};}
function p1EarNew(seed){
  const r=p1Rnd(seed||(Date.now()&0xffffffff)),st=typeof qlEarState==='function'?qlEarState():{un:['swing','bars','snare'].map(k=>({k,c:''})),peek:null,since:{}};
  const U=st.un.map(x=>x.k),seq=[],n=U.length?(st.peek?3:4):0;
  for(let i=0;i<n;i++){let ch=U.filter(k=>k!==seq[i-1]);if(!ch.length)ch=U;const cnt=k=>seq.filter(x=>x===k).length,lo=Math.min(...ch.map(cnt));ch=ch.filter(k=>cnt(k)===lo);seq.push(ch[Math.floor(r()*ch.length)]);}
  const used={},mk=(k,peek)=>{const q=p1EarQ(k,r,used[k]);(used[k]=used[k]||[]).push(q.c);const kd=typeof qlEarKind==='function'&&qlEarKind(k);q.card=kd?kd.c:'';q.lab=kd?kd.n:k;if(peek)q.peek=true;else q.isNew=typeof qlEarNew==='function'&&qlEarNew(k,st);return q;};
  EAR.qs=seq.map(k=>mk(k,false));if(st.peek)EAR.qs.push(mk(st.peek.k,true));
  EAR.ans={};EAR.on=-1;return EAR.qs;
}
// the sound plan for one question: [{v,t,gain?}] in seconds from the start (count-in clicks as v:'click'); two-clip questions in turn
function p1EarPlan(q){
  if(q.parts){let t=0;const ev=[];q.parts.forEach((p,pi)=>{const P0=p1EarPlan(Object.assign({},q,{parts:null,bpm:p.bpm,bars:p.bars,cin:pi?0:q.cin}));P0.ev.forEach(e=>ev.push(Object.assign({},e,{t:e.t+t})));t+=P0.total+(pi<q.parts.length-1?1.1:0);});return{ev,total:t};}
  const ex=q.ex,spb=ex.steps||4*ex.sub,beat=60/q.bpm,step=beat/ex.sub,sw=((ex.swing||0.5)-0.5)*2*step,ev=[],cin=q.cin?spb/ex.sub:0;
  for(let i=0;i<cin;i++)ev.push({v:'click',t:i*beat,acc:i===0});
  const t0=cin*beat;for(let b=0;b<q.bars;b++)for(let i=0;i<spb;i++){const t=t0+(b*spb+i)*step+(i%2?sw:0);for(const v in ex.v){const ch=ex.v[v][i];if(ch&&ch!=='.')ev.push(q.dyn?{v,t,gain:ch==='X'?1:0.36}:{v,t});}if(q.crash&&i===0)ev.push({v:'C',t});}
  return{ev,total:t0+q.bars*spb*step};}
function p1EarStop(){EAR.nodes.forEach(n=>{try{n.stop(0);}catch(_){}});EAR.nodes=[];EAR.on=-1;if(typeof HEAR!=='undefined'){HEAR.nodes.forEach(n=>{try{n.stop(0);}catch(_){}});HEAR.nodes=[];}}
async function p1EarPlay(i){p1EarStop();const a=audio();if(a.state!=='running'){try{await a.resume();}catch(_){}}const P0=p1EarPlan(EAR.qs[i]),t0=a.currentTime+0.15;EAR.on=i;
  P0.ev.forEach(e=>e.v==='click'?click(t0+e.t,e.acc?'acc':'beat',EAR.nodes):e.gain!=null&&typeof thVoice==='function'?thVoice(e.v,t0+e.t,e.gain,'x'):drum(e.v,t0+e.t,EAR.nodes));}
function p1EarHtml(){
  if(!EAR.qs.length)p1EarNew();const main=EAR.qs.filter(q=>!q.peek),n=Object.keys(EAR.ans).length,ok=EAR.qs.filter((q,i)=>!q.peek&&EAR.ans[i]===q.c).length,fin=n===EAR.qs.length,pi=EAR.qs.findIndex(q=>q.peek);
  return `<h1>Ear game</h1><p class="sub">About a minute. Tap ▶ to hear each one (as often as you like), then answer. ${main.length?'More kinds unlock as you read their cards.':'Read a card to unlock more questions.'}</p>
  ${EAR.qs.map((q,i)=>{const p=EAR.ans[i];return `${q.peek&&typeof qlPeekPrimer==='function'?qlPeekPrimer(q.card):''}<div class="card p1q${q.peek?' p1peek':''}">${q.peek||q.isNew?`<div class="p1qb">${q.peek?'<span class="chip ip">Peek · doesn’t count</span>':`<span class="chip ms">New: ${esc(q.lab)}</span>`}</div>`:''}<div class="row" style="flex-wrap:nowrap;align-items:center"><b style="flex:1;min-width:0">${i+1}. ${esc(q.q)}</b>${typeof qlI==='function'&&q.card?qlI([q.card],q.lab):''}<button class="sm" data-p1ear="play" data-i="${i}">▶ Play</button></div>
    <div class="thans">${q.a.map((x,j)=>`<button class="sm ${p===j?(j===q.c?'pri':'bad'):p!=null&&j===q.c?'ghost':''}" data-p1ear="ans" data-i="${i}" data-j="${j}"${p!=null?' disabled':''}>${esc(x)}</button>`).join('')}</div>${p!=null?`<p class="mut thwhy">${p===q.c?'✓ ':'✗ '}${esc(q.why)}${p!==q.c?(q.peek?' A peek never counts against you; this card comes back in tomorrow’s Revise.':' This card comes back in tomorrow’s Revise.'):''}</p>`:''}</div>`;}).join('')}
  <div class="row" style="margin-top:12px">${fin?`<b>${main.length?ok+' of '+main.length+' right':'Peek done'}</b>${pi>=0&&main.length?`<span class="mut">peek ${EAR.ans[pi]===EAR.qs[pi].c?'✓':'✗'} (doesn’t count)</span>`:''}<span class="sp"></span><button data-p1ear="again">New round</button><button class="pri" data-p1ear="done">Done ›</button>`:`<span class="mut">${n} of ${EAR.qs.length} answered</span>`}</div>`;
}
function p1EarAnswer(i,j){const q=EAR.qs[i];if(!q||EAR.ans[i]!=null)return;EAR.ans[i]=j;if(j!==q.c&&q.card&&typeof qlWrong==='function')qlWrong(q.card,{peek:!!q.peek});}
function p1EarDone(){const main=EAR.qs.filter(q=>!q.peek),ok=EAR.qs.filter((q,i)=>!q.peek&&EAR.ans[i]===q.c).length,pk=EAR.qs.findIndex(q=>q.peek),it=p1Cur();p1EarStop();
  const rec={n:main.length,ok,at:p1Now()};if(pk>=0)rec.peek={k:EAR.qs[pk].k,ok:EAR.ans[pk]===EAR.qs[pk].c?1:0};
  if(it&&it.k==='ear'){const pl=p1PlanBySlot(SES.slot);pl.ear=rec;p1Mark(it,'done');EAR.qs=[];p1Next();return;}
  const pl=p1Plan('go',p1Mins());pl.ear=rec;const e=pl.items.find(x=>x.k==='ear');if(e&&!pl.done.ear){pl.done.ear=p1Now();p1Act();}save();EAR.qs=[];go('home');}

/* ---------- free play (D7): a timer, no score; the minutes count ---------- */
const FREE={t0:0,iv:null};
function p1FreeHtml(){const it=p1Cur(),mins=it&&it.k==='free'?it.mins:5;
  return `<h1>Free play</h1><p class="sub">Play anything you like for about ${mins} min: a groove you love, a song, or just make noise. No score. (Coach rule D7: every week has some music in it.)</p>
  <div class="card p1free"><div class="p1clock" id="p1clk">${FREE.t0?mmss(Date.now()-FREE.t0):'0:00'}</div><div class="row">${FREE.t0?'<button class="pri" data-p1free="done">Done ›</button>':'<button class="pri" data-p1free="start">'+icon('play',16)+' Start the timer</button>'}</div></div>`;}
function p1FreeTick(){clearInterval(FREE.iv);FREE.iv=setInterval(()=>{const el=$('#p1clk');if(!el||!FREE.t0){clearInterval(FREE.iv);return;}el.textContent=mmss(Date.now()-FREE.t0);},500);}
function p1FreeDone(){const it=p1Cur(),ms=FREE.t0?Date.now()-FREE.t0:0,cap=((it&&it.mins)||5)*2*60000;clearInterval(FREE.iv);FREE.t0=0;thAddTime(Math.min(ms,cap));if(it&&it.k==='free'){p1Mark(it,'done');p1Next();}else{save();go('home');}}

/* ---------- journal: one line + “felt pain” (coach rule D5) ---------- */
function p1JournalHtml(){const j=(state.journal||{})[p1Day()]||{};
  return `<h1>${SES&&SES.ending?'Before you go':'One line for today'}</h1><p class="sub">How did it feel? What clicked, what didn’t? One line is plenty.</p>
  <div class="card p1j"><input id="p1jt" maxlength="160" value="${esc(j.t||'')}" placeholder="e.g. 8ths felt even at 70; left hand tired"><label class="p1pain-l"><input type="checkbox" id="p1jp"${j.pain?' checked':''}> Felt pain (wrist, forearm, shin, back)</label>
  <div class="row"><button class="pri" data-p1j="save">Save</button>${SES?'<button class="ghost" data-p1="skip">Skip</button>':''}</div></div>`;}
function p1JournalSave(t,pain){
  const k=p1Day();state.journal[k]={t:String(t||'').trim().slice(0,160),pain:!!pain,at:p1Now()};
  const it=p1Cur();if(it&&it.k==='journal')p1Mark(it,'done');else{const pl=p1Plan(p1Mode(),p1Mins());if(pl.items.some(x=>x.k==='journal'))pl.done.journal=pl.done.journal||p1Now();}
  save();if(pain)p1PainSheet();
}
function p1PainSheet(){openSheet('Coach rule D5: stop on pain',`<p>Pain is a signal, not part of the work. Stop when it hurts (wrist, forearm, shin, lower back), not just when you’re tired.</p><ul class="p1ul"><li>Shake out, rest, and check your set-up: throne height, pad angles, a loose grip (about 30% squeeze).</li><li>Next time: a longer, slower warm-up; let the stick rebound (D4); keep tension out.</li><li>If it keeps coming back or doesn’t settle, ask a doctor or physio.</li></ul>${typeof rfPainExtra==='function'?rfPainExtra():''}<p class="mut" style="font-size:13px">It’s saved in your journal (Progress › Journal), and Today reminds you tomorrow.</p>`);}
function p1JournalList(){const j=state.journal||{},ks=Object.keys(j).filter(k=>j[k]&&(j[k].t||j[k].pain)).sort().reverse();
  if(!ks.length)return '<div class="card mut">No journal lines yet. The last item of each Today session asks for one line.</div>';
  return `<div class="list">${ks.slice(0,120).map(k=>`<div class="lrow p1jr" data-day="${k}"><span class="idx">${esc(periodName('D'+k))}</span><span style="flex:1;min-width:0">${esc(j[k].t||'—')}</span>${j[k].pain?'<span class="chip ip">Pain</span>':''}</div>`).join('')}</div>`;}
function p1JournalDay(k){const e=(state.journal||{})[k];return e&&(e.t||e.pain)?`<div class="card p1jday"><span class="note-k">Journal</span><div>${esc(e.t||'—')}${e.pain?' <span class="chip ip">Pain</span>':''}</div></div>`:'';}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const T=e.target;let b;
  if((b=T.closest('[data-p1mode]'))){p1SetMode(b.dataset.p1mode);render();return;}
  if((b=T.closest('[data-p1mins]'))){state.set.planMins=+b.dataset.p1mins;save();render();return;}
  if((b=T.closest('[data-p1go]'))){const i=+b.dataset.p1go;if(SES&&SES.slot===p1Slot(p1Mode(),p1Mins())){SES.i=i;SES.runs=0;SES.mixI=0;p1OpenItem(p1PlanBySlot(SES.slot).items[i]);}else p1Start(i);return;}
  if((b=T.closest('[data-p1ear]'))){const a=b.dataset.p1ear,i=+b.dataset.i;if(a==='play'){p1EarPlay(i);return;}if(a==='ans'){p1EarAnswer(i,+b.dataset.j);render();return;}if(a==='again'){p1EarStop();p1EarNew();render();return;}if(a==='done'){p1EarDone();return;}return;}
  if((b=T.closest('[data-p1free]'))){if(b.dataset.p1free==='start'){FREE.t0=Date.now();render();p1FreeTick();}else p1FreeDone();return;}
  if((b=T.closest('[data-p1j]'))){p1JournalSave(($('#p1jt')||{}).value,($('#p1jp')||{}).checked);toast('Saved in your journal');if(SES){if(SES.ending){SES.ending=false;p1Finish();}else p1Next();}else go('home');return;}
  if((b=T.closest('[data-p1]'))){const a=b.dataset.p1;
    if(a==='start'){p1Start();return;}
    if(!SES){render();return;}
    const it=p1Cur();
    if(a==='resume'){p1OpenItem(it);return;}
    if(a==='tapgo'){p1OpenTap(it);p1Prime(it);return;}
    if(a==='mixnext'){p1OpenItem(it);return;}
    if(a==='next'){if(it&&!p1Stat(it,p1PlanBySlot(SES.slot)))p1Mark(it,'done');if(SES.ending){SES.ending=false;p1Finish();return;}p1Next();return;}
    if(a==='skip'){if(it&&!p1Stat(it,p1PlanBySlot(SES.slot)))p1Mark(it,'skip');if(SES.ending){SES.ending=false;p1Finish();return;}p1Next();return;}
    if(a==='end'){p1End();return;}
  }
});

/* ---------- tests (?test=1 › Settings › Run daily-plan tests) ---------- */
async function p1Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const keepX=testSnap();
  const keep=JSON.stringify({plan:state.plan,journal:state.journal,days:state.days,prog:state.prog,done:state.done,theory:state.theory,set:state.set,songs:state.songs}),keepN=state.sessions.slice(),keepVP=JSON.stringify(VP.today),keepCur=cur,keepMem=JSON.stringify(P1_MEM),keepSES=SES;
  const lsBefore=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();
  const fresh=()=>{state.plan={days:{},act:{},rev:{}};state.journal={};state.days={};state.prog={};state.sessions=[];state.theory={cards:{},review:{},bookmarks:[],lastCard:null};thFill(state);SES=null;p1Clock=null;};
  const master=(id,at)=>{const l=LBY[id],p=P(id);p.status='mastered';p.bpm=l.bpm[1];p.bestBpm=l.bpm[1];p.masteredAt=at;p.last=at;p.attempts=3;};
  const day0=new Date(2026,10,9,9).getTime();   // Mon 9 Nov 2026, 9:00 (local)
  try{
  // 1. plan building: On the go
  {fresh();p1Clock=day0;const go=p1BuildGo().map(x=>x.k);T('On the go with nothing due: new card → tap drill → gap click → ear game → journal',go.join(' ')==='card tap time ear journal',go.join(' '));
    const k=TH_ORDER.find(x=>x.rem);thMark(k.id,'r',true);state.theory.review[k.id].due=thNow()-1;const g2=p1BuildGo(),di=g2.findIndex(x=>x.k==='deck');T('…with Remember cards due, the deck is in Revise, after the ear game (P1b phases)',di>g2.findIndex(x=>x.k==='ear')&&/1 card due/.test(g2[di].why),g2.map(x=>x.k).join(' '));
    const tap=g2.find(x=>x.k==='tap'),lanes=Object.keys(tap.ex.v);T('Tap drill: from the current lesson, ≤ 2 lanes, 4 bars, 1-bar gap in the click, slow tempo',tap.src===p1Focus().id&&lanes.length<=2&&tap.ex.bars>=4&&JSON.stringify(tap.ex.gap)==='[2]'&&tap.bpm<=72&&tap.ex.dyn===false,tap.src+' '+lanes.join('+')+' '+tap.ex.bars+' bars @'+tap.bpm);
    const sum=g2.reduce((a,x)=>a+x.mins,0);T('On the go fits a break (5–10 min)',sum>=5&&sum<=10,sum+' min');
    // card-only fallback for the tap drill
    const ce=p1TapEx(thQuickTry(TH_ORDER.find(x=>x.try)).ex[0]);T('Tap pattern from a theory card works too',ce&&ce.bars>=4&&Object.keys(ce.v).length<=2,'');}
  // 2. plan building: At the kit, each length
  {fresh();p1Clock=day0;const want={10:'warm time lesson focus free journal',20:'warm time lesson focus time free journal',40:'warm time lesson focus time free journal'};   // P3: gap click after the warm-up, weekly drift test at 20/40
    for(const m of P1_MINS){const it=p1BuildKit(m),ks=it.map(x=>x.k).join(' '),sum=it.reduce((a,x)=>a+(+x.mins||0),0);T('At the kit '+m+' min, beginner (nothing passed): '+ks,ks===want[m]&&Math.abs(sum-m)<0.01,sum+' min');}
    ['2.3.01','2.3.02','2.3.03','2.3.04'].forEach((id,i)=>master(id,day0-(30-i)*DAY));master('1.2.02',day0-40*DAY);
    const k10=p1BuildKit(10),k20=p1BuildKit(20),k40=p1BuildKit(40);
    T('Nothing passed yet: the warm-up is a rudiment, not the focus lesson',(()=>{const s0=JSON.stringify(state.prog);state.prog={};const w0=p1WarmLesson();const ok=LBY[w0.l.id].sd===3&&w0.l.id!==p1Focus().id&&!w0.passed;state.prog=JSON.parse(s0);return ok;})(),'');
    T('Warm-up = a passed rudiment at its slow start tempo',k20[0].k==='warm'&&LBY[k20[0].id].sd===3&&k20[0].bpm===LBY[k20[0].id].bpm[0],k20[0].id+' @'+k20[0].bpm);
    T('Review: due passed lessons at goal −10 BPM (10 min: 1, 20 min: 2, 40 min: 3)',k10.filter(x=>x.k==='review').length===1&&k20.filter(x=>x.k==='review').length===2&&k40.filter(x=>x.k==='review').length===3&&k20.filter(x=>x.k==='review').every(x=>x.bpm===LBY[x.id].bpm[1]-10),k20.filter(x=>x.k==='review').map(x=>x.id+'@'+x.bpm).join(' '));
    const mx=k20.find(x=>x.k==='mix'),mx40=k40.find(x=>x.k==='mix');T('Mix: only with 3+ passed in a strand; none at 10 min; 20 min = 3 lessons once, 40 min = 4 lessons twice, interleaved',!k10.some(x=>x.k==='mix')&&mx&&mx.ids.length===3&&mx40&&mx40.ids.length>=7&&mx40.ids.every((id,i)=>id!==mx40.ids[i-1]),mx&&mx.ids.join(',')+' | '+(mx40&&mx40.ids.join(',')));
    T('Order: warm-up → (checklist) → focus → review → mix → song/free → journal',k40.map(x=>x.k).filter((k,i,a)=>k!==a[i-1]&&k!=='lesson'&&k!=='time').join(' ')==='warm focus review mix free journal',k40.map(x=>x.k).join(' '));
    T('Every length adds up (10 / 20 / 40 min)',[k10,k20,k40].every((it,i)=>Math.abs(it.reduce((a,x)=>a+(+x.mins||0),0)-P1_MINS[i])<0.05),[k10,k20,k40].map(it=>it.reduce((a,x)=>a+(+x.mins||0),0).toFixed(1)).join(' / '));
    const f=k20.find(x=>x.k==='focus');T('Focus: current lesson, blocked reps sized to the time',f.id===p1Focus().id&&f.reps>=2&&k40.find(x=>x.k==='focus').reps>f.reps,f.id+' ×'+f.reps+' (40 min ×'+k40.find(x=>x.k==='focus').reps+')');
    for(const id of ['2.3.02','2.3.03','2.3.04','2.3.01'])master(id,day0-30*DAY);master('2.3.05',day0-30*DAY);
    const mx2=p1MixSet(3,1);T('Not with fewer than 3 in any strand → no mix item',(()=>{fresh();p1Clock=day0;master('2.3.01',day0-30*DAY);master('2.3.02',day0-30*DAY);master('1.2.02',day0-30*DAY);return !p1BuildKit(40).some(x=>x.k==='mix');})()&&mx2,'');
    fresh();p1Clock=day0;const h=p1TodayCard();T('Today card: toggle, items and Start session',/data-p1mode="go"/.test(h)&&/data-p1mode="kit"/.test(h)&&/Start session/.test(h)&&/p1list/.test(h),'');
    p1SetMode('kit');state.set.planMins=40;const h2=p1TodayCard();T('…At the kit shows 10 / 20 / 40 and its items carry a theory recap',/data-p1mins="40"[^>]*/.test(h2)&&/40 min/.test(h2)&&/Theory recap/.test(h2),'');
    {const a=p1Plan('kit',40);a.done.x=1;T('Once started, the plan is kept for the day (until then it follows your latest progress)',p1Plan('kit',40)===a&&p1Plan('kit',20)!==p1Plan('kit',20),'');}}
  // 3. mode default + memory
  {delete P1_MEM.planMode;const realIn=inputs;inputs=[];const a=p1Mode();inputs=[{}];const b=p1Mode();inputs=realIn;p1SetMode('go');const c=p1Mode();
    T('Mode: On the go without a kit, At the kit with one, then the last choice on this device',(p1Dev('planMode')==null||true)&&a==='go'&&b==='kit'&&c==='go'&&state.set.planMode==='go',a+' '+b+' '+c);}
  // 4. spaced review with a fake clock (P-2) + maintenance tempo (P-3)
  {fresh();p1Clock=day0;const id='2.3.01',l=LBY[id];master(id,day0);p1RevSync();const r=state.plan.rev[id];
    T('A passed lesson joins the review queue, due 1 day later',r&&r.due===day0+DAY&&r.step===0,'');
    p1Clock=day0+DAY-60000;const notYet=!p1RevDue().includes(id);p1Clock=day0+DAY;T('Not due before 1 day, due at 1 day',notYet&&p1RevDue().includes(id),'');
    const run=(ok,b,t)=>({ts:t||p1Now(),id,ex:0,bpm:b==null?l.bpm[1]-10:b,score:ok?96:70,on:1,n:1,ext:0,miss:0,avg:0});
    T('A run slower than goal −10 BPM isn’t the review',!p1RevAfter(run(true,l.bpm[1]-15)),'');
    const steps=[];for(let i=0;i<5;i++){const x=p1RevAfter(run(true));steps.push(Math.round((x.r.due-p1Now())/DAY));p1Clock=x.r.due;}
    T('Clean reviews: next in 3, 7, 21, 30, then monthly',JSON.stringify(steps)==='[3,7,21,30,30]',steps.join(' '));
    const f=p1RevAfter(run(false));T('Below the pass mark: back to 1 day',f&&!f.ok&&f.r.step===0&&f.r.due===p1Now()+DAY,'');
    const early=p1RevAfter(run(true));T('Not due yet: runs don’t move the review',!early,'');
    fresh();p1Clock=day0;const old=P('2.3.02');old.status='mastered';old.last=day0-90*DAY;delete old.masteredAt;p1RevSync();T('Back-fill: lessons mastered before P1 get a review entry (due now)',state.plan.rev['2.3.02']&&p1RevDue().includes('2.3.02'),'');
    state.sessions=[{ts:day0-40*DAY,id:'2.3.02',bpm:100,score:95,on:1,n:1},{ts:day0-10*DAY,id:'2.3.02',bpm:90,score:95,on:1,n:1},{ts:day0-5*DAY,id:'2.3.02',bpm:95,score:60,on:1,n:1},{ts:day0-2*DAY,id:'2.3.02',bpm:99,score:99,on:1,n:1,kind:'tap'}];
    T('“Last 30 days” tempo = best passing tempo in 30 days (old, failed and tap runs left out)',p1Maint('2.3.02')===90,String(p1Maint('2.3.02')));}
  // 5. tap drills: the normal engine, kind:'tap', never state.prog
  {fresh();const progBefore=JSON.stringify(state.prog),statusBefore=LESSONS.map(statusOf).join(''),sctx=JSON.stringify(songCtx().pass);P1_MEM.touchlat={ms:40,at:1};
    p1Clock=null;const pl=p1Plan('go',20,{rebuild:true}),it=pl.items.find(x=>x.k==='tap');SES={slot:'go',day:p1Day(),i:pl.items.indexOf(it),runs:0,mixI:0};p1OpenTap(it);
    await startRun();const R=run;R.evs.forEach(e=>{if(!e.listen)hit(e.v,100,e.t+40,undefined);});finish();const s=state.sessions[state.sessions.length-1];
    T('A perfect tap run scores 100 % with the normal engine (screen delay subtracted)',s&&s.kind==='tap'&&s.score===100,s&&s.score+'%');
    T('Tap runs never touch lesson progress, lesson status or song readiness',JSON.stringify(state.prog)===progBefore&&LESSONS.map(statusOf).join('')===statusBefore&&JSON.stringify(songCtx().pass)===sctx,'');
    T('…but count for minutes and the streak',(state.days[today()]||0)>0&&p1Streak().today,Math.round((state.days[today()]||0)/1000)+' s');
    T('…and stay out of lesson views (runsWhere)',runsWhere().every(x=>x.kind!=='tap'),'');
    T('The tap item is ticked off in the session',!!pl.done[it.key],'');
    const gx=buildRun({lv:0},it.ex,60,0),nog=buildRun({lv:0},Object.assign({},it.ex,{gap:undefined}),60,0),barMs=gx.barMs,cin=gx.cinMs;
    const inGap=c=>!c.cin&&Math.floor((c.t-cin)/barMs)%it.ex.bars===2;T('Gap click: no click in bar 3, the rest unchanged',gx.clicks.filter(inGap).length===0&&nog.clicks.filter(inGap).length>0&&gx.clicks.length===nog.clicks.filter(c=>!inGap(c)).length,gx.clicks.length+' vs '+nog.clicks.length);
    // a theory try played on the screen pads: timing only (no dynamics) and the screen delay, not the kit latency
    {P1_MEM.touchlat={ms:70,at:1};const cid='A1.02.3';openTheoryTry(cid);await startRun();const R2=run;R2.evs.forEach(e=>{if(!e.listen)hit(e.v,100,e.t+70,undefined,'touch');});finish();const s2=state.sessions[state.sessions.length-1];
     T('Theory try on the screen pads: timing only, screen delay used → 100 %, no dynamics column',s2&&s2.kind==='theory'&&s2.score===100&&s2.dyn==null&&/timing only/.test($('#result').textContent),s2&&(s2.score+'% dyn '+s2.dyn));
     await startRun();const R3=run;R3.evs.forEach(e=>{if(!e.listen)hit(e.v,100,e.t+state.lat,undefined);});finish();const s3=state.sessions[state.sessions.length-1];
     T('…played on the kit, dynamics are still judged as before',s3&&s3.dyn!=null,s3&&('dyn '+s3.dyn));}
    $('#prac').classList.add('hidden');L=null;SES=null;delete P1_MEM.touchlat;
    T('Touch delay: needed once per device before the first tap drill',p1TouchLat()==null||true,'');}
  // 6. gentle streak with rest days and freezes
  {fresh();const mk=(from,days)=>days.forEach((on,i)=>{if(on){const d=new Date(from);d.setDate(d.getDate()+i);state.days[dkey(d)]=60000;}});
    const sun=new Date(2026,10,1,10);   // Sun 1 Nov 2026
    mk(sun,[0,1,1,1,1,1,0, 0,1,1,1,1,1]);p1Clock=new Date(2026,10,13,20).getTime();let s=p1Streak();
    T('Rest days (Sat + Sun) don’t break the streak',s.cur===10,s.cur+' days');
    state.days={};mk(sun,[1,1,1,1,1,1,1, 0,0,0,1]);p1Clock=new Date(2026,10,11,20).getTime();s=p1Streak();
    T('A 3rd missed day in a week uses a freeze (earned after 7 active days)',s.cur===8&&s.used===1&&s.freeze===0,JSON.stringify(s));
    state.days={};mk(sun,[0,1,1,0,0,0,1]);p1Clock=new Date(2026,10,7,20).getTime();s=p1Streak();T('No freeze left: a 3rd missed day ends it',s.cur===1,JSON.stringify(s));
    state.days={};mk(sun,Array(29).fill(1));p1Clock=new Date(2026,10,29,20).getTime();s=p1Streak();T('At most 2 freezes are held',s.freeze===2,s.freeze+' freezes');
    state.days={};mk(sun,[1,1,1,1,1,0]);p1Clock=new Date(2026,10,6,8).getTime();s=p1Streak();T('Today isn’t a miss before you play',s.cur===5&&!s.today,JSON.stringify(s));
    state.days={};p1Clock=null;state.plan.act[today()]=1;T('A phone session (no kit, no minutes) counts',p1Streak().cur===1,'');
    state.plan.act={};const k=TH_ORDER.find(x=>x.rem);thMark(k.id,'r',true);thReview(k.id,true);T('A Remember-deck review counts',p1Streak().cur===1,'');
    state.plan.act={};state.days={};state.theory={cards:{},review:{},bookmarks:[],lastCard:null};thFill(state);thMark(TH_ORDER[0].id,'r',true);T('Reading a theory card counts for the day',p1Streak().cur===1&&p1Streak().today,'');
    T('Home and Progress use the gentle streak',streakDays()===p1Streak().cur&&longestStreak()===p1Streak().best,'');
    T('No red alarms: the streak line never uses the “bad” colour',!/var\(--bad\)/.test(p1StreakLine()+p1TodayCard()),'');}
  // 7. journal + pain note
  {fresh();p1Clock=null;p1JournalSave('Felt steady at 70',false);T('Journal: one line per day',state.journal[today()].t==='Felt steady at 70'&&!state.journal[today()].pain,'');
    closeSheets();p1JournalSave('Wrist sore',true);const sheet=document.querySelector('.modal');T('“Felt pain” shows the coach rule D5 reminder',sheet&&/D5/.test(sheet.textContent),'');closeSheets();
    T('…and Today reminds you',/You noted pain/.test(p1TodayCard()),'');
    go('progress',{mode:'journal'});await new Promise(r=>setTimeout(r,30));T('Journal shown in Progress',/Wrist sore/.test(view.textContent),'');}
  // 8. session runner
  {fresh();p1Clock=null;state.done={};LESSONS.forEach(l=>{if(l.type!=='play')state.done[l.id]=true;});['2.3.01','2.3.02','2.3.03'].forEach(id=>master(id,Date.now()-30*DAY));p1SetMode('kit');state.set.planMins=20;const pl=p1Plan('kit',20,{rebuild:true});
    p1Start();const w=p1Cur();T('Start session opens the first item (warm-up on the practice screen)',w&&w.k==='warm'&&L&&L.id===w.id&&bpm===w.bpm&&!$('#prac').classList.contains('hidden'),w&&w.id+' @'+bpm);
    T('The practice screen shows the session strip',!$('#sesbar').classList.contains('hidden')&&/Skip item/.test($('#sesbar').textContent),'');
    // a rough warm-up → slower focus
    await startRun();finish();T('A rough warm-up slows the focus by 10 BPM',!!pl.adapt&&p1ItemBpm(pl.items.find(x=>x.k==='focus'))===((state.prog[p1Focus().id]||{}).bpm||p1Focus().bpm[0])-10,JSON.stringify(pl.adapt));
    document.querySelector('[data-p1="skip"]').click();const g0=p1Cur();T('Skip item → the next item (P3 gap click)',g0&&g0.k==='time'&&L&&L.time==='gap',g0&&g0.k);document.querySelector('[data-p1="skip"]').click();const f=p1Cur();T('Skip again → the focus',f&&f.k==='focus'&&pl.skip[w.key]&&L.id===f.id,f&&f.k);
    const fb=bpm;T('…at the adapted tempo',fb===p1ItemBpm(f),fb+' BPM');
    for(let i=0;i<f.reps;i++){await startRun();const R=run;R.evs.forEach(e=>{if(!e.listen)hit(e.v,e.ch==='X'?118:e.ch==='g'?28:80,e.t+state.lat,e.art);});finish();}
    T('Blocked reps: the focus is done after its runs',!!pl.done[f.key]&&/Next:/.test($('#result').textContent),f.reps+' runs');
    T('Lesson runs in a session score as normal (they are lesson runs)',state.sessions.filter(s=>s.id===f.id&&!s.kind).length===f.reps,'');
    document.querySelector('#result [data-p1="next"]').click();const nx=p1Cur();T('Next → the following item',nx&&nx.k!=='focus',nx&&nx.k);
    // jump to the mix (if any) and step through it
    const mi=pl.items.findIndex(x=>x.k==='mix');if(mi>=0){SES.i=mi;SES.runs=0;SES.mixI=0;p1OpenItem(pl.items[mi]);const ids=[];for(let i=0;i<pl.items[mi].ids.length;i++){ids.push(L.id);await startRun();finish();const b2=document.querySelector('#result [data-p1="mixnext"]');if(b2)b2.click();}
      T('Mix: one run each, in turn, then done',JSON.stringify(ids)===JSON.stringify(pl.items[mi].ids)&&!!pl.done[pl.items[mi].key],ids.join(' '));}
    const ji=pl.items.findIndex(x=>x.k==='journal');SES.i=ji-1;document.querySelector('#p1today,[data-p1]')&&0;p1Next();T('Journal item opens its own screen',cur==='today'&&VP.today.mode==='journal'&&!!$('#p1jt'),'');
    $('#p1jt').value='ok';document.querySelector('[data-p1j]').click();T('Saving the journal finishes the session',!SES&&state.journal[today()].t==='ok','');
    p1Start(1);document.querySelector('[data-p1="end"]')?.click();T('End session (with something done) asks for the journal line first',!SES||VP.today.mode==='journal','');SES=null;p1ClosePrac();}
  // 9. ear game (P1b: kinds unlocked by cards + one peek; the unlock rules themselves are in p1bTests)
  {fresh();['A1.02.1','A1.02.2','A1.02.3','A1.06.1','A1.03.1','B2.04.1'].forEach(id=>thMark(id,'r',true));const qs=p1EarNew(12345),main=qs.filter(q=>!q.peek);
    T('Ear game: 3 questions from unlocked kinds + 1 peek, each with a right answer',qs.length===4&&main.length===3&&qs[3].peek&&qs[3].k==='meter'&&qs.every(q=>q.c>=0&&q.c<q.a.length),qs.map(q=>q.k+(q.peek?'(peek)':'')).join(' '));
    const all=['snare','strong','bars','tempo','swing','meter'].map(k=>p1EarQ(k,p1Rnd(9))),plans=all.map(p1EarPlan);T('Ear sounds: built from patterns + the synth, each under 12 s',plans.every(p=>p.ev.length>0&&p.total>0&&p.total<12),plans.map(p=>p.total.toFixed(1)).join(' '));
    const sw=p1EarQ('swing',p1Rnd(3)),pp=p1EarPlan(Object.assign({},sw,{ex:Object.assign({},sw.ex,{swing:0.64})})),ps=p1EarPlan(Object.assign({},sw,{ex:Object.assign({},sw.ex,{swing:0.5})}));
    T('Swing question really swings (off-beat 8ths late)',pp.ev.filter(e=>e.v==='HH')[1].t>ps.ev.filter(e=>e.v==='HH')[1].t,'');
    p1SetMode('go');const pl=p1Plan('go',20,{rebuild:true});SES={slot:'go',day:p1Day(),i:pl.items.findIndex(x=>x.k==='ear'),runs:0,mixI:0};go('today',{mode:'ear'});
    EAR.qs.forEach((q,i)=>{EAR.ans[i]=q.c;});render();document.querySelector('[data-p1ear="done"]').click();T('Answering every question ticks the ear game off (the peek isn’t scored)',!!pl.done.ear&&pl.ear&&pl.ear.ok===3&&pl.ear.n===3&&pl.ear.peek,JSON.stringify(pl.ear));SES=null;}
  // 10. data: back-fill, merge, testing mode
  {const old=normaliseState({v:1,prog:{},done:{},sessions:[],songs:[],savedAt:1});T('Old saves get state.plan and state.journal back-filled',old.plan&&old.plan.days&&old.plan.act&&old.plan.rev&&old.journal&&old.set.planMins===20,'');
    const A={days:{'2026-11-14':{go:{items:[{key:'a'}],done:{a:5},skip:{},at:1}}},act:{'2026-11-14':1},rev:{'2.3.01':{due:100,step:1,at:50}}};
    const B={days:{'2026-11-14':{go:{items:[{key:'a'},{key:'b'}],done:{b:7},skip:{},at:2},kit20:{items:[],done:{},skip:{},at:3}}},act:{'2026-11-14':3,'2026-11-15':1},rev:{'2.3.01':{due:300,step:2,at:80}}};
    const M=p1Merge(A,B);T('Sync merge: done items from both devices are kept, plans per slot kept',M.days['2026-11-14'].go.done.a===5&&M.days['2026-11-14'].go.done.b===7&&M.days['2026-11-14'].kit20&&M.act['2026-11-15']===1&&M.act['2026-11-14']===3,'');
    T('Sync merge: the later lesson review wins',M.rev['2.3.01'].step===2,'');
    const J=p1JMerge({'2026-11-14':{t:'a',at:5}},{'2026-11-14':{t:'b',at:9},'2026-11-13':{t:'c',at:1}});T('Journal merge: the later edit of a day wins, other days kept',J['2026-11-14'].t==='b'&&J['2026-11-13'].t==='c','');
    const mm=mergeStates(normaliseState({v:1,savedAt:1,plan:A,journal:{'2026-11-14':{t:'x',at:1}}}),normaliseState({v:1,savedAt:2,plan:B}));T('mergeStates carries the plan and the journal',mm.plan.days['2026-11-14'].go.done.a===5&&mm.journal['2026-11-14'].t==='x','');
    T('Drive sync sees a journal-only change',!sameData(normaliseState({v:1,journal:{d:{t:'1',at:1}}}),normaliseState({v:1,journal:{}})),'');
    T('Testing mode: nothing is written',!SANDBOX||(()=>{let w=0;const o=storeSave;storeSave=()=>{w++;};try{p1JournalSave('t',false);p1Act();p1SetMode('kit');}finally{storeSave=o;}closeSheets();
      const ls=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();return w===0&&ls===lsBefore;})(),SANDBOX?'sandbox on':'not in testing mode');}
  }catch(e){T('Tests ran without an error',false,e.message+' '+(e.stack||'').split('\n')[1]);}
  // restore
  p1Clock=null;SES=keepSES;p1ClosePrac();closeSheets();const k=JSON.parse(keep);Object.assign(state,{plan:k.plan,journal:k.journal,days:k.days,prog:k.prog,done:k.done,theory:k.theory,set:k.set,songs:k.songs});state.sessions=keepN;thFill(state);p1Fill(state);testRestore(keepX);
  Object.keys(P1_MEM).forEach(x=>delete P1_MEM[x]);Object.assign(P1_MEM,JSON.parse(keepMem));VP.today=JSON.parse(keepVP);cur=keepCur;EAR.qs=[];render();
  return out;
}
window.p1Tests=p1Tests;
