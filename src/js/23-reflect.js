/* DrumPath — P4 Reflection (D-042, build/ideas-backlog.md §F items 24–27 + the P4 row). Builds on the P1 journal and gentle streak.
   · Weekly review (weeks run Sun–Sat): on Sunday a card on Home looks back at the week just ended — minutes, practice days,
     runs, lessons passed, the best improvement, the weak spot, next week's focus — and stays until opened or dismissed (at most
     until Wednesday). Every week can be opened on the Reflection page (‹ ›), and shared as an image (no journal, no pain notes).
   · Pain notes → coach rule D5: the review lists the week's pain days; 2+ pain days make next week "a gentle week"; 2+ pain
     days in the last 7 make Today's reminder stronger (a 10-minute session or a rest day; rest days never break the streak).
   · Badges that mean something: consistency first (practice days, 3-day weeks, a month of habit, journal lines), then real
     milestones (levels, the first 6/8 groove, the first song ready, 4-bar gaps, 100 cards understood…). Nothing for grinding:
     no badge for long sessions or big days. Earned badges are kept even if the data behind them is trimmed later.
   Everything is worked out from data that already exists; new state field state.reflect only (badges earned, reviews opened).
   Display-side only: no engine change, lesson scoring untouched. Testing mode saves nothing. */
'use strict';
const RF_PAIN_GENTLE=2;     // pain days in a week (or in the last 7 days) that make it "a gentle week" (coach rule D5)
const RF_HOME_DAYS=3;       // the Sunday card stays on Home until Wednesday (Sun + 3 days), unless opened or dismissed
const RF_TEMPO_GAIN=5, RF_SCORE_GAIN=5, RF_PLATEAU=3, RF_PAD_N=30, RF_PAD_WEAK=85, RF_PAD_OFF=15, RF_MISS=2;
ICONS.reflect='<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8.5 14.5l2.5 2.5 4.5-5"/>';
ICONS.badge='<circle cx="12" cy="14.5" r="6"/><path d="M8.6 9.6L6 3h4l2 4.2L14 3h4l-2.6 6.6"/><path d="M12 12v5M10 14.5h4"/>';
const rfS=()=>rfFill(state).reflect;
const rfDay=ts=>dkey(new Date(ts));
const rfWkOf=ts=>weekKeyD(new Date(ts));
function rfRange(wk){const a=pdate(wk),b=new Date(a);b.setDate(a.getDate()+7);return [a.getTime(),b.getTime()];}
function rfShift(wk,n){const d=pdate(wk);d.setDate(d.getDate()+7*n);return dkey(d);}
function rfDays(wk){const d=pdate(wk);return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return dkey(x);});}
const rfL=id=>LBY[id]?id+' '+LBY[id].t:id;

/* ---------- state: {badges:{id:{at,got}}, weeks:{wk:{seen,off}}, seenAt} — synced; merge: union, earliest times, later seenAt ---------- */
function rfFill(s){let r=s.reflect;if(!r||typeof r!=='object'||Array.isArray(r))r=s.reflect={};
  ['badges','weeks'].forEach(f=>{if(!r[f]||typeof r[f]!=='object'||Array.isArray(r[f]))r[f]={};});
  Object.keys(r.badges).forEach(k=>{const b=r.badges[k];if(!b||typeof b!=='object'||!(b.at>0))delete r.badges[k];else if(!(b.got>0))b.got=b.at;});
  Object.keys(r.weeks).forEach(k=>{if(!r.weeks[k]||typeof r.weeks[k]!=='object')delete r.weeks[k];});
  if(typeof r.seenAt!=='number'||!isFinite(r.seenAt))r.seenAt=0;return s;}
function rfMerge(A,B){const a=rfFill({reflect:JSON.parse(JSON.stringify(A||{}))}).reflect,b=rfFill({reflect:JSON.parse(JSON.stringify(B||{}))}).reflect,m={badges:{},weeks:{},seenAt:Math.max(a.seenAt,b.seenAt)};
  const mn=(x,y)=>x&&y?Math.min(x,y):x||y||undefined;
  new Set([...Object.keys(a.badges),...Object.keys(b.badges)]).forEach(k=>{const x=a.badges[k]||{},y=b.badges[k]||{};m.badges[k]={at:mn(x.at,y.at),got:mn(x.got,y.got)};});
  new Set([...Object.keys(a.weeks),...Object.keys(b.weeks)]).forEach(k=>{const x=a.weeks[k]||{},y=b.weeks[k]||{},o={};['seen','off'].forEach(f=>{const v=mn(x[f],y[f]);if(v)o[f]=v;});m.weeks[k]=o;});
  return m;}

/* ---------- one week, worked out from what is already stored ---------- */
function rfPainDays(from,to){const j=state.journal||{};return Object.keys(j).filter(k=>j[k]&&j[k].pain&&pdate(k).getTime()>=from&&pdate(k).getTime()<to).sort();}
function rfPain7(now){now=now||p1Now();const e=new Date(now);e.setHours(0,0,0,0);e.setDate(e.getDate()+1);return rfPainDays(e.getTime()-7*DAY,e.getTime());}
function rfMusicDays(from,to){const out=new Set(),inW=k=>{const t=pdate(k).getTime();return t>=from&&t<to;};
  Object.entries(P1D().days).forEach(([d,sl])=>{if(!inW(d))return;Object.values(sl||{}).forEach(p=>{if(p&&p.done&&Object.keys(p.done).some(k=>k==='free'||/^song:/.test(k)))out.add(d);});});
  Object.values(state.songLog||{}).forEach(a=>(a||[]).forEach(x=>{if(x&&x[0]&&inW(String(x[0]).slice(0,10)))out.add(String(x[0]).slice(0,10));}));return [...out].sort();}
function rfWeek(wk){
  const [from,to]=rfRange(wk),inW=ts=>ts>=from&&ts<to,days=rfDays(wk),A=p1ActiveDays(),j=state.journal||{};
  const runs=state.sessions.filter(s=>inW(s.ts)),lr=runs.filter(s=>!s.kind&&LBY[s.id]);
  const cards=Object.entries(((state.theory||{}).cards)||{}),uAt=c=>Math.min(...['u','p','h'].map(f=>c&&c[f]||Infinity));
  const w={wk,from,to,days,mins:days.reduce((a,k)=>a+(state.days[k]||0),0)/60000,act:days.filter(k=>A.has(k)),runs:runs.length,lr,lessonRuns:lr.length,passed:lr.filter(runPassed).length,
    mastered:Object.entries(state.prog).filter(([id,p])=>LBY[id]&&p.masteredAt&&inW(p.masteredAt)).sort((x,y)=>x[1].masteredAt-y[1].masteredAt).map(x=>x[0]),
    read:cards.filter(([,c])=>c&&c.r&&inW(c.r)).length,understood:cards.filter(([,c])=>inW(uAt(c))).length,time:runs.filter(s=>s.kind==='time').length,
    pain:rfPainDays(from,to),journal:days.filter(k=>j[k]&&(j[k].t||j[k].pain)),music:rfMusicDays(from,to)};
  const pd=rfDays(rfShift(wk,-1));w.prev={mins:pd.reduce((a,k)=>a+(state.days[k]||0),0)/60000,act:pd.filter(k=>A.has(k)).length};
  w.best=rfBest(w);w.weak=rfWeak(w);w.focus=rfFocus(w);
  w.badges=Object.entries(rfS().badges).filter(([id,b])=>RF_BY[id]&&inW(b.at)).sort((x,y)=>x[1].at-y[1].at).map(x=>x[0]);
  w.cur=from<=p1Now()&&p1Now()<to;return w;}
function rfWeekName(wk){const w=periodName('W'+wk),y=pdate(wk).getFullYear();return w+(y!==new Date(p1Now()).getFullYear()?' '+y:'');}

// best improvement: tempo gain > a lesson mastered > a first pass > accuracy gain > gap ladder > drift test > theory > showing up
function rfBest(w){
  const before=state.sessions.filter(s=>s.ts<w.from&&!s.kind&&LBY[s.id]),by={};w.lr.forEach(s=>(by[s.id]=by[s.id]||[]).push(s));
  const c={tempo:[],first:[],acc:[]};
  Object.entries(by).forEach(([id,rs])=>{const b=before.filter(s=>s.id===id),pass=rs.filter(runPassed),bp=pass.length?Math.max(...pass.map(s=>s.bpm||0)):0,b0p=b.filter(runPassed),b0=b0p.length?Math.max(...b0p.map(s=>s.bpm||0)):0;
    if(bp&&b0&&bp-b0>=RF_TEMPO_GAIN)c.tempo.push({k:'tempo',id,v:bp-b0,t:rfL(id),d:`${b0} → ${bp} BPM (+${bp-b0})`});
    else if(bp&&!b0p.length)c.first.push({k:'first',id,v:bp,t:'First pass: '+rfL(id),d:`at ${bp} BPM`});
    const sc=Math.max(...rs.map(s=>s.score||0)),s0=b.length?Math.max(...b.map(s=>s.score||0)):null;
    if(s0!=null&&sc-s0>=RF_SCORE_GAIN)c.acc.push({k:'acc',id,v:sc-s0,t:rfL(id),d:`best ${s0}% → ${sc}% (+${sc-s0} points)`});});
  const top=a=>a.sort((x,y)=>y.v-x.v)[0];
  if(c.tempo.length)return top(c.tempo);
  if(w.mastered.length)return {k:'mastered',id:w.mastered[0],t:'Mastered '+rfL(w.mastered[0]),d:w.mastered.length>1?'+ '+p1Pl(w.mastered.length-1,'more lesson'):'three passing runs in a row at goal'};
  if(c.first.length)return top(c.first);if(c.acc.length)return top(c.acc);
  const gaps=s=>s.id==='time:gap'&&s.tf&&s.tf.ok&&typeof TF_GAP!=='undefined',gw=state.sessions.filter(s=>gaps(s)&&s.ts>=w.from&&s.ts<w.to),g0=state.sessions.filter(s=>gaps(s)&&s.ts<w.from);
  const gm=gw.length?Math.max(...gw.map(s=>s.tf.step||0)):-1,g0m=g0.length?Math.max(...g0.map(s=>s.tf.step||0)):-1;
  if(gm>g0m)return {k:'gap',v:gm,t:'Gap click: clean at step '+(gm+1),d:tfStepName(gm)};
  const drs=s=>s.id==='time:drift'&&s.tf&&s.tf.st!=null,dw=state.sessions.filter(s=>drs(s)&&s.ts>=w.from&&s.ts<w.to),d0=state.sessions.filter(s=>drs(s)&&s.ts<w.from);
  const dm=dw.length?Math.max(...dw.map(s=>s.tf.st)):null,d0m=d0.length?Math.max(...d0.map(s=>s.tf.st)):null;
  if(dm!=null&&(d0m==null||dm-d0m>=5))return {k:'drift',v:dm,t:'Tempo-drift test: steadiness '+dm,d:d0m==null?'your first drift test':'up from '+d0m};
  if(w.understood>=3)return {k:'theory',v:w.understood,t:'Understood '+p1Pl(w.understood,'theory card'),d:p1Pl(w.read,'card')+' read'};
  if(w.act.length)return {k:'showing',v:w.act.length,t:'Showing up: '+p1Pl(w.act.length,'practice day'),d:'that’s what moves a beginner forward'};
  return null;}
// weak spot: a lesson stuck this week > a pad off the beat > a drifting tempo > an idea missed > a review not clean
function rfWeak(w){
  const by={};w.lr.forEach(s=>(by[s.id]=by[s.id]||[]).push(s));
  const pl=Object.entries(by).filter(([,rs])=>!rs.some(runPassed)&&rs.length>=RF_PLATEAU).map(([id,rs])=>{const f={};rs.forEach(s=>{f[s.bpm]=(f[s.bpm]||0)+1;});const bpm=+Object.entries(f).sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0][0];return {k:'plateau',id,bpm,n:rs.length,t:rfL(id),d:`${p1Pl(rs.length,'run')} at ${bpm} BPM, no pass yet`};}).sort((a,b)=>b.n-a.n);
  if(pl.length)return pl[0];
  const pa=padAgg(w.lr),pads=LANES.filter(v=>pa[v]&&pa[v].n>=RF_PAD_N);
  const lo=pads.filter(v=>pa[v].timing<RF_PAD_WEAK).sort((a,b)=>pa[a].timing-pa[b].timing)[0];
  if(lo)return {k:'pad',v:lo,t:VOICES[lo].n+' timing',d:`${Math.round(pa[lo].timing)}% on time over ${pa[lo].n} notes${pa[lo].off!=null&&Math.abs(pa[lo].off)>=6?' · '+rushTxt(pa[lo].off):''}`};
  const off=pads.filter(v=>pa[v].off!=null&&Math.abs(pa[v].off)>=RF_PAD_OFF).sort((a,b)=>Math.abs(pa[b].off)-Math.abs(pa[a].off))[0];
  if(off)return {k:'off',v:off,ms:Math.round(pa[off].off),t:`${VOICES[off].n} ${pa[off].off<0?'rushes':'drags'}`,d:`about ${Math.round(Math.abs(pa[off].off))} ms ${pa[off].off<0?'early':'late'} on average`};
  const dr=state.sessions.filter(s=>s.id==='time:drift'&&s.tf&&s.tf.dev>5&&s.ts>=w.from&&s.ts<w.to).pop();
  if(dr)return {k:'drift',t:'Tempo drifts without the click',d:`${Math.round(dr.tf.start)} → ${Math.round(dr.tf.end)} BPM in the drift test`};
  const ms={},mi=((state.theory||{}).miss)||{};Object.entries(mi).forEach(([id,a])=>{const n=(a||[]).filter(t=>t>=w.from&&t<w.to).length;if(n)ms[id]=n;});
  const top=Object.entries(ms).filter(([id,n])=>n>=RF_MISS&&typeof THC!=='undefined'&&THC[id]).sort((a,b)=>b[1]-a[1])[0];
  if(top)return {k:'miss',card:top[0],n:top[1],t:'“'+THC[top[0]].t+'”',d:`missed or looked up ${top[1]} times`};
  const rv=Object.entries(P1D().rev).filter(([id,r])=>LBY[id]&&r&&r.ok===0&&r.at>=w.from&&r.at<w.to)[0];
  if(rv)return {k:'review',id:rv[0],t:'Review of '+rfL(rv[0]),d:'not clean yet'};
  return null;}
// next week's focus: a gentle week after pain (D5) comes first; then the weak spot, the main lesson, the habit, music (D7)
function rfFocus(w){const out=[],k=w.weak&&w.weak.k;
  if(w.pain.length>=RF_PAIN_GENTLE)out.push({k:'gentle',t:'A gentle week',d:`You noted pain on ${w.pain.length} days. Keep sessions to 10 minutes, warm up longer, check the throne height and a loose grip, and stop if it hurts (coach rule D5). If it keeps coming back, see a doctor or physio.`});
  if(k==='plateau')out.push({k,t:`Rebuild ${w.weak.id} at ${Math.max(30,w.weak.bpm-10)} BPM`,d:'A few clean runs 10 BPM slower, then climb again (coach rule D2).',open:w.weak.id});
  else if(k==='pad')out.push({k,t:`${VOICES[w.weak.v].n}: lock it to the click`,d:'Take your lesson 10 BPM slower and listen for this pad landing on the click; the gap click at the kit helps too.'});
  else if(k==='off')out.push({k,t:`${VOICES[w.weak.v].n}: ${w.weak.ms<0?'wait for the beat':'get there on time'}`,d:'Count out loud (coach rule D3) and play the gap click; every result shows your pocket per pad.'});
  else if(k==='drift')out.push({k,t:'Hold the tempo',d:'Two gap-click runs per session build the internal clock; try the drift test again next week.'});
  else if(k==='miss')out.push({k,t:'Re-read '+w.weak.t,d:'It came up '+w.weak.n+' times: one more read, then a Check.',card:w.weak.card});
  else if(k==='review')out.push({k,t:'Review '+w.weak.id+' again',d:'Once at goal −10 BPM; clean twice and it moves on.',open:w.weak.id});
  if(!out.some(x=>x.k==='gentle')){const f=p1Focus();if(f&&!(w.weak&&w.weak.id===f.id)){const b=(state.prog[f.id]||{}).bpm||f.bpm[0];out.push({k:'main',t:'Keep going: '+rfL(f.id),d:'your current lesson, target '+b+' BPM',open:f.id});}}
  const a=w.act.length;out.push({k:'habit',t:a<3?'Three short days':a<5?'Four days, two rest':'Same rhythm',d:a<3?'10 minutes at the kit, or On the go on the phone, counts.':a<5?'Your 2 rest days a week are part of the plan; they never break the streak.':'Keep your rest days too: they’re part of the training.'});
  if(!w.music.length&&!out.some(x=>x.k==='gentle'))out.push({k:'music',t:'Play some music',d:'A song or free play once in the week (coach rule D7).'});
  return out;}

/* ---------- badges that mean something (earned dates worked out from your data; kept once earned) ---------- */
const RF_BADGES=[
  {id:'day1',g:'Habit',n:'First session',d:'Any practice day: kit, phone or theory.',f:c=>c.actAt(1)},
  {id:'wk3',g:'Habit',n:'A three-day week',d:'3 practice days in one week (Sun–Sat).',f:c=>c.weeksRun(1),p:c=>[c.bestWeek(),3]},
  {id:'month',g:'Habit',n:'A month of habit',d:'4 weeks in a row with 3+ practice days each.',f:c=>c.weeksRun(4),p:c=>[c.longRun(),4]},
  {id:'days30',g:'Habit',n:'30 practice days',d:'30 days with some practice, any length.',f:c=>c.actAt(30),p:c=>[c.act.length,30]},
  {id:'days100',g:'Habit',n:'100 practice days',d:'100 days with some practice.',f:c=>c.actAt(100),p:c=>[c.act.length,100]},
  {id:'journal10',g:'Habit',n:'Ten journal lines',d:'One line on 10 different days.',f:c=>c.jAt(10),p:c=>[c.jn.length,10]},
  {id:'review4',g:'Habit',n:'Four weekly reviews',d:'Opened the weekly review 4 times.',f:c=>c.revAt(4),p:c=>[c.rv.length,4]},
  {id:'pass1',g:'Skills',n:'First lesson mastered',d:'Three passing runs in a row at goal.',f:c=>c.ms[0]||(c.msAny?'now':null)},
  ...[0,1,2,3,4].map(lv=>({id:'lv'+lv,g:'Skills',n:'Level '+lv+' complete',d:'Every lesson of Level '+lv+': '+(LEVELS[lv]||'')+'.',lv,f:c=>c.level(lv),p:c=>c.levelP(lv)})),
  {id:'g68',g:'Skills',n:'First 6/8 groove',d:'A 6/8 groove lesson mastered.',f:c=>c.msWhere(ex=>ex.meter==='6/8'&&ex.v.K&&Object.keys(ex.v).length>=3)},
  {id:'swing',g:'Skills',n:'First swing groove',d:'A swung groove lesson mastered.',f:c=>c.msWhere(ex=>ex.swing>0.5&&ex.v.K)},
  {id:'review1',g:'Skills',n:'First clean review',d:'A passed lesson came back days later and was still clean.',f:c=>c.revClean()},
  {id:'song1',g:'Music',n:'First song ready',d:'A song’s core skills reached its tempo.',f:c=>c.song()},
  {id:'music4',g:'Music',n:'Music in four weeks',d:'A song or free play in 4 different weeks (coach rule D7).',f:c=>c.musicAt(4),p:c=>[c.mw.length,4]},
  {id:'gap4',g:'Time feel',n:'Four-bar gaps',d:'Reached the 4-bar gaps of the gap click.',f:c=>c.gap(4)},
  {id:'gaptop',g:'Time feel',n:'Top of the gap ladder',d:'Every step of the gap click.',f:c=>c.gap(typeof TF_GAP!=='undefined'?TF_GAP.length-1:9)},
  {id:'steady',g:'Time feel',n:'Steady without a click',d:'A tempo-drift test within ±5 %.',f:c=>c.drift()},
  {id:'tf1h',g:'Time feel',n:'An hour of time feel',d:'60 minutes of gap-click and drift-test runs.',f:c=>c.tfAt(3600),p:c=>[Math.floor(c.tfS/60),60,'min']},
  {id:'tf10h',g:'Time feel',n:'10 hours of time feel',d:'10 hours of gap-click and drift-test runs.',f:c=>c.tfAt(36000),p:c=>[Math.floor(c.tfS/3600),10,'h']},
  {id:'cards25',g:'Theory',n:'25 cards understood',d:'Marked Understood, Can play or Can hear.',f:c=>c.cardAt(25),p:c=>[c.cu.length,25]},
  {id:'cards100',g:'Theory',n:'100 cards understood',d:'Marked Understood, Can play or Can hear.',f:c=>c.cardAt(100),p:c=>[c.cu.length,100]},
  {id:'play10',g:'Theory',n:'Ten cards played',d:'Can play on 10 theory cards (Try it ≥ 85 %).',f:c=>c.playAt(10),p:c=>[c.cp.length,10]},
  {id:'hours10',g:'Practice',n:'10 hours of practice',d:'All practice minutes together.',f:c=>c.hAt(10),p:c=>[Math.floor(c.totMs/3600000),10,'h']},
  {id:'hours50',g:'Practice',n:'50 hours of practice',d:'All practice minutes together.',f:c=>c.hAt(50),p:c=>[Math.floor(c.totMs/3600000),50,'h']}];
const RF_BY={};RF_BADGES.forEach(b=>{RF_BY[b.id]=b;});
const RF_GROUPS=['Habit','Skills','Music','Time feel','Theory','Practice'];
function rfCtx(now){now=now||p1Now();
  const act=[...p1ActiveDays()].filter(k=>pdate(k).getTime()<=now).sort(),at=k=>pdate(k).getTime()+12*3600000;
  const wkN={};act.forEach(k=>{const w=weekKeyD(pdate(k));(wkN[w]=wkN[w]||[]).push(k);});const wks=Object.keys(wkN).sort();
  const j=state.journal||{},jn=Object.keys(j).filter(k=>j[k]&&j[k].t).sort();
  const rv=Object.values(rfS().weeks).map(x=>x.seen).filter(Boolean).sort((a,b)=>a-b);
  const ms=Object.entries(state.prog).filter(([id,p])=>LBY[id]&&p.status==='mastered').map(([id,p])=>[id,p.masteredAt||null]);
  const msT=ms.map(x=>x[1]).filter(Boolean).sort((a,b)=>a-b);
  const cards=Object.values(((state.theory||{}).cards)||{}),cu=cards.map(c=>Math.min(...['u','p','h'].map(f=>c&&c[f]||Infinity))).filter(isFinite).sort((a,b)=>a-b),cp=cards.map(c=>c&&c.p).filter(Boolean).sort((a,b)=>a-b);
  const tr=state.sessions.filter(s=>s.kind==='time'&&s.dur>0).sort((a,b)=>a.ts-b.ts),tfS=tr.reduce((a,s)=>a+s.dur,0);
  const dk=Object.keys(state.days).filter(k=>state.days[k]>0).sort(),totMs=dk.reduce((a,k)=>a+state.days[k],0);
  const mwk={};const mdays=rfMusicDays(0,now+DAY);mdays.forEach(k=>{const w=weekKeyD(pdate(k));if(!mwk[w])mwk[w]=k;});const mw=Object.keys(mwk).sort();
  const nth=(a,n,f)=>a.length>=n?f(a[n-1]):null;
  const c={act,jn,rv,ms,cu,cp,tfS,totMs,mw,
    actAt:n=>nth(act,n,at),jAt:n=>nth(jn,n,k=>(j[k].at>0?j[k].at:at(k))),revAt:n=>nth(rv,n,x=>x),cardAt:n=>nth(cu,n,x=>x),playAt:n=>nth(cp,n,x=>x),musicAt:n=>nth(mw,n,w=>at(mwk[w])),
    bestWeek:()=>Math.max(0,...wks.map(w=>wkN[w].length)),
    longRun:()=>{let best=0,run=0,prev=null;wks.forEach(w=>{if(wkN[w].length<3){run=0;prev=w;return;}run=prev&&rfShift(prev,1)===w&&run?run+1:1;prev=w;best=Math.max(best,run);});return best;},
    weeksRun:n=>{let run=0,prev=null;for(const w of wks){if(wkN[w].length<3){run=0;prev=w;continue;}run=prev&&rfShift(prev,1)===w&&run?run+1:1;prev=w;if(run>=n)return at(wkN[w][2]);}return null;},
    level:lv=>{const ls=LESSONS.filter(l=>l.lv===lv&&!l.later);if(!ls.length||!ls.every(l=>statusOf(l)==='ms'))return null;const t=ls.filter(l=>l.type==='play').map(l=>(state.prog[l.id]||{}).masteredAt||0);return t.length&&t.every(Boolean)?Math.max(...t):'now';},
    levelP:lv=>{const ls=LESSONS.filter(l=>l.lv===lv&&!l.later);return [ls.filter(l=>statusOf(l)==='ms').length,ls.length];},
    msWhere:f=>{const t=ms.filter(([id])=>{const l=LBY[id];return l&&l.ex&&l.ex.some(f);}).map(x=>x[1]||'now');return t.length?t.filter(x=>x!=='now').sort((a,b)=>a-b)[0]||'now':null;},
    revClean:()=>{const r=Object.values(P1D().rev).filter(x=>x&&x.ok===1&&x.step>=1&&x.at);return r.length?Math.min(...r.map(x=>x.at)):null;},
    song:()=>{let st=[];try{st=allSongStats(songCtx());}catch(_){}return st.some(x=>x.state==='ready')?'now':null;},
    gap:i=>{if(typeof tfLad!=='function')return null;const top=Math.max(tfLad('kit').top||0,tfLad('touch').top||0);if(top<i)return null;const r=state.sessions.filter(s=>s.id==='time:gap'&&s.tf&&s.tf.step>=i).sort((a,b)=>a.ts-b.ts)[0];return r?r.ts:'now';},
    drift:()=>{const r=state.sessions.filter(s=>s.id==='time:drift'&&s.tf&&s.tf.dev!=null&&s.tf.dev<=5).sort((a,b)=>a.ts-b.ts)[0];return r?r.ts:null;},
    tfAt:sec=>{let a=0;for(const s of tr){a+=s.dur;if(a>=sec)return s.ts;}return null;},
    hAt:h=>{let a=0;for(const k of dk){a+=state.days[k];if(a>=h*3600000)return at(k);}return null;}};
  c.ms=msT;c.msAny=ms.length>0;return c;}
// records newly earned badges (at = when it was earned, as far as the data shows; got = when the app noticed) → the new ids
function rfCheck(now){now=now||p1Now();const r=rfS(),c=rfCtx(now),out=[];
  RF_BADGES.forEach(b=>{if(r.badges[b.id])return;let v=null;try{v=b.f(c);}catch(_){}if(v==null)return;const at=v==='now'||!(v>0)?now:Math.min(v,now);r.badges[b.id]={at,got:now};out.push(b.id);});
  if(out.length)save();return out;}
const rfNew=()=>Object.entries(rfS().badges).filter(([id,b])=>RF_BY[id]&&b.got>rfS().seenAt).map(x=>x[0]);
function rfAfterRun(){const n=rfCheck();if(!n.length)return;const box=$('#result .in');if(box)box.insertAdjacentHTML('beforeend',`<div class="rfnewb" data-rf="badges">${icon('badge',20)}<span><b>New badge${n.length>1?'s':''}:</b> ${n.map(id=>esc(RF_BY[id].n)).join(' · ')}</span></div>`);}

/* ---------- pain notes → coach rule D5 (Today, the pain sheet) ---------- */
function rfPainNote(){const d=rfPain7();if(d.length<RF_PAIN_GENTLE)return '';
  return `<div class="p1pain rfpain"><b>Pain on ${d.length} of the last 7 days.</b> Coach rule D5: take today easy — a 10-minute session or a rest day (rest days never break your streak). Check your set-up and grip; if it keeps coming back, see a doctor or physio.${p1Mode()==='kit'&&p1Mins()!==10?' <button class="sm" data-p1mins="10">Make today 10 min</button>':''}</div>`;}
function rfPainExtra(){const d=rfPain7();return d.length>=RF_PAIN_GENTLE?`<p><b>That’s ${d.length} days with pain in the last week.</b> Make the next few sessions short and easy (10 minutes), or rest; your weekly review will suggest a gentle week. If it keeps coming back or doesn’t settle, see a doctor or physio.</p>`:'';}

/* ---------- Home card (Sunday → Wednesday) + new badges ---------- */
function rfHomeWeek(now){now=now||p1Now();const cw=rfWkOf(now),lw=rfShift(cw,-1),dn=Math.floor((now-pdate(cw).getTime())/DAY);
  if(dn>RF_HOME_DAYS)return null;const s=rfS().weeks[lw]||{};if(s.seen||s.off)return null;const A=p1ActiveDays();return rfDays(lw).some(k=>A.has(k))?lw:null;}
function rfHomeCard(){rfCheck();const lw=rfHomeWeek(),nb=rfNew();if(!lw&&!nb.length)return '';let h='';
  if(lw){const w=rfWeek(lw);h+=`<div class="rfh"><div style="min-width:0"><div class="note-k">Your week · ${esc(rfWeekName(lw))}</div><div class="rfhl"><b>${Math.round(w.mins)} min</b> · ${p1Pl(w.act.length,'practice day')} · ${p1Pl(w.runs,'run')}${w.best?' · best: '+esc(w.best.t):''}</div></div><div class="row rfhb"><button class="pri sm" data-rf="open" data-wk="${lw}">Weekly review ›</button><button class="sm ghost" data-rf="off" data-wk="${lw}" title="Not now">✕</button></div></div>`;}
  if(nb.length)h+=`<div class="rfnewb" data-rf="badges">${icon('badge',20)}<span><b>New badge${nb.length>1?'s':''}:</b> ${nb.slice(0,3).map(id=>esc(RF_BY[id].n)).join(' · ')}${nb.length>3?' +'+(nb.length-3):''}</span><span class="sp"></span><span class="mut">›</span></div>`;
  return `<section class="card rfhome">${h}</section>`;}

/* ---------- Reflection page ---------- */
VP.reflect=VP.reflect||{wk:null};
function rfStat(k,v,u,d){return `<div class="card stat"><div class="k">${k}</div><div class="v">${v}${u?`<small>${u}</small>`:''}</div>${d?`<div class="d">${d}</div>`:''}</div>`;}
function rfReviewHtml(w){
  const pv=(a,b,u)=>Math.round(a)===Math.round(b)?'same as last week':'last week '+Math.round(b)+(u||'');
  const ln=(x,lab)=>x?`<div class="rfln"><span class="note-k">${lab}</span><b>${esc(x.t)}</b>${x.d?`<span class="mut">${esc(x.d)}</span>`:''}${x.id&&LBY[x.id]?`<button class="sm ghost" data-open="${x.id}">Open</button>`:''}${x.card&&typeof qlI==='function'?qlI([x.card],x.t):''}</div>`:'';
  return `<div class="grid rfgrid">${rfStat('Minutes',Math.round(w.mins),'min',pv(w.mins,w.prev.mins,' min'))}${rfStat('Practice days',w.act.length,'of 7',pv(w.act.length,w.prev.act))}${rfStat('Runs',w.runs,'',p1Pl(w.lessonRuns,'lesson run')+' · '+w.passed+' passed')}${rfStat('Lessons mastered',w.mastered.length,'',w.understood?p1Pl(w.understood,'card')+' understood':w.read?p1Pl(w.read,'card')+' read':'')}</div>
   ${w.best?ln(w.best,'Best improvement'):`<div class="rfln"><span class="note-k">Best improvement</span><span class="mut">${w.cur?'Nothing yet this week.':'A quiet week. Rest is part of training too.'}</span></div>`}
   ${w.weak?ln(w.weak,'Weak spot'):`<div class="rfln"><span class="note-k">Weak spot</span><span class="mut">Nothing stood out${w.lessonRuns?'':' (play a few lessons to see one)'}.</span></div>`}
   <div class="rfln rffoc"><span class="note-k">${w.cur?'Focus for the rest of the week':'Next week’s focus'}</span><ol>${w.focus.map(f=>`<li class="${f.k==='gentle'?'rfgentle':''}"><b>${esc(f.t)}</b> <span class="mut">${esc(f.d)}</span>${f.open&&LBY[f.open]?` <button class="sm ghost" data-open="${f.open}">Open</button>`:''}${f.card&&typeof qlI==='function'?qlI([f.card],f.t):''}</li>`).join('')}</ol></div>
   ${w.badges.length?`<div class="rfln"><span class="note-k">Badges this week</span><div class="rfbl">${w.badges.map(id=>`<span class="chip ms">${esc(RF_BY[id].n)}</span>`).join('')}</div></div>`:''}`;}
function rfBadgesHtml(now){const r=rfS().badges,c=rfCtx(now),nb=new Set(rfNew());
  return RF_GROUPS.map(g=>{const bs=RF_BADGES.filter(b=>b.g===g);return `<div class="rfbg"><div class="note-k">${g}</div><div class="rfbgrid">${bs.map(b=>{const e=r[b.id];let p='';
    if(!e&&b.p){try{const [x,y,u]=b.p(c);p=`<div class="bar rfbar"><i style="width:${Math.min(100,100*x/y)}%"></i></div><span class="mut rfbp">${Math.min(x,y)} of ${y}${u?' '+u:''}</span>`;}catch(_){}}
    return `<div class="rfb ${e?'got':''}${nb.has(b.id)?' new':''}"><span class="rfbi">${icon('badge',22)}</span><div class="rfbt"><div class="rfbn"><b>${esc(b.n)}</b>${nb.has(b.id)?'<span class="chip ms">New</span>':''}</div><span class="mut">${esc(b.d)}</span>${e?`<span class="rfbd">${esc(periodName('D'+rfDay(e.at)))}${new Date(e.at).getFullYear()!==new Date(p1Now()).getFullYear()?' '+new Date(e.at).getFullYear():''}</span>`:p}</div></div>`;}).join('')}</div></div>`;}).join('');}
function rfWeeksBars(endWk,n){const A=p1ActiveDays(),items=[];for(let i=n-1;i>=0;i--){const wk=rfShift(endWk,-i),a=rfDays(wk).filter(k=>A.has(k)).length;items.push({l:pdate(wk).getDate()+' '+MON[pdate(wk).getMonth()],v:a,k:wk,t:rfWeekName(wk)+': '+p1Pl(a,'practice day')});}
  return svgBars(items,{h:150,max:7,fmt:v=>Math.round(v)+'',labels:n,w:600});}
function renderReflect(){
  rfCheck();const cw=rfWkOf(p1Now()),first=(()=>{const a=[...p1ActiveDays()].sort()[0];return a?weekKeyD(pdate(a)):cw;})();
  let wk=VP.reflect.wk||rfShift(cw,-1);if(wk>cw)wk=cw;if(wk<first&&wk!==rfShift(cw,-1))wk=first;VP.reflect.wk=wk;
  const w=rfWeek(wk),r=rfS(),j=state.journal||{};
  if(!w.cur&&(w.act.length||w.runs)&&!(r.weeks[wk]||{}).seen){r.weeks[wk]=Object.assign(r.weeks[wk]||{},{seen:p1Now()});save();rfCheck();}
  const nbN=rfNew().length,got=Object.keys(r.badges).filter(id=>RF_BY[id]).length;
  view.innerHTML=`<h1>Reflection</h1><p class="sub">Once a week, look back: what you did, what got better, what to try next. Gentle on purpose: rest days are part of it and nothing here is red.</p>
  <section class="card rfc"><div class="tfh"><div style="min-width:0"><div class="note-k">${w.cur?'This week so far':'Weekly review'}</div><div class="h2" style="margin:0">${esc(rfWeekName(wk))}</div></div>
    <div class="row rfnav"><button class="sm" data-rfwk="-1"${wk<=first?' disabled':''} aria-label="Previous week">‹</button><button class="sm" data-rfwk="1"${wk>=cw?' disabled':''} aria-label="Next week">›</button>${wk!==rfShift(cw,-1)?`<button class="sm ghost" data-rfwk="0">Last week</button>`:''}</div></div>
   ${w.act.length||w.runs?rfReviewHtml(w):`<p class="mut">No practice this week${w.cur?' yet':''}. That’s allowed — your streak has 2 rest days a week.</p>`}
   <div class="row" style="margin-top:12px"><button class="pri" data-rf="share" data-wk="${wk}">Share as an image</button><span class="mut" style="font-size:13px">Numbers only: no journal lines or pain notes.</span></div></section>
  ${w.pain.length?`<section class="card rfc rfpainc"><div class="note-k">Pain notes · coach rule D5</div><p><b>${p1Pl(w.pain.length,'day')} with pain:</b> ${w.pain.map(k=>esc(periodName('D'+k))).join(', ')}.</p><p class="mut">Pain is a signal, not part of the work. Stop when it hurts, warm up longer, let the stick rebound (D4) and check your set-up.${w.pain.length>=RF_PAIN_GENTLE?' Next week is a gentle week.':''}</p><button class="sm ghost" data-rf="d5">Coach rule D5</button></section>`:''}
  <section class="card rfc"><div class="note-k">Journal · ${esc(rfWeekName(wk))}</div>${w.journal.length?`<div class="list">${w.journal.map(k=>`<div class="lrow"><span class="idx">${esc(periodName('D'+k))}</span><span style="flex:1;min-width:0">${esc(j[k].t||'—')}</span>${j[k].pain?'<span class="chip ip">Pain</span>':''}</div>`).join('')}</div>`:'<p class="mut">No lines this week. The last item of each Today session asks for one.</p>'}<div class="row" style="margin-top:8px"><button class="sm ghost" data-nav="progress" data-p='{"mode":"journal"}'>All journal lines ›</button></div></section>
  <section class="card rfc"><div class="note-k">Consistency · practice days per week</div><div class="rfwb">${rfWeeksBars(cw,8)}</div><div class="p1streak">${p1StreakLine()}</div></section>
  <section class="card rfc" id="rfbadges"><div class="tfh"><div><div class="note-k">Badges</div><div class="h2" style="margin:0">${got} of ${RF_BADGES.length}</div></div>${nbN?`<button class="sm" data-rf="seen">Mark ${nbN} new as seen</button>`:''}</div><p class="mut">For showing up and for real milestones, never for grinding.</p>${rfBadgesHtml()}</section>
  ${TEST?'<div class="card" style="margin-top:12px"><button class="sm" data-rftest>Run reflection tests</button><div id="rftests"></div></div>':''}`;
  if(VP.reflect.badges){VP.reflect.badges=false;requestAnimationFrame(()=>{const e=$('#rfbadges');if(e)e.scrollIntoView({block:'start'});});}
  view.querySelectorAll('.rfwb [data-k]').forEach(g=>g.addEventListener('click',()=>{VP.reflect.wk=g.dataset.k;render();}));
}

/* ---------- share as an image (own canvas drawing; nothing private) ---------- */
function rfWrap(ctx,t,maxW){const out=[];let line='';String(t).split(/\s+/).forEach(wd=>{const x=line?line+' '+wd:wd;if(ctx.measureText(x).width>maxW&&line){out.push(line);line=wd;}else line=x;});if(line)out.push(line);return out;}
function rfImage(wk){
  const w=rfWeek(wk),W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),texts=[];
  const C={bg:'#0e1115',panel:'#181d24',ink:'#eef2f5',mut:'#9aa5b1',acc:'#5ad1a0'};   // DrumPath's green on the dark card, whatever the app theme
  const D='"Big Shoulders Display","Arial Narrow",sans-serif',B='"Figtree",system-ui,sans-serif';
  const txt=(t,x,y,f,c,al)=>{g.font=f;g.fillStyle=c;g.textAlign=al||'left';g.fillText(t,x,y);texts.push(String(t));};
  const rr=(x,y,w0,h0,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w0,y,x+w0,y+h0,r);g.arcTo(x+w0,y+h0,x,y+h0,r);g.arcTo(x,y+h0,x,y,r);g.arcTo(x,y,x+w0,y,r);g.closePath();g.fill();};
  g.fillStyle=C.bg;g.fillRect(0,0,W,H);g.fillStyle=C.acc;g.fillRect(0,0,W,12);
  txt('DRUMPATH',70,110,'800 46px '+D,C.acc);txt('Week review',W-70,110,'600 34px '+B,C.mut,'right');
  txt(rfWeekName(wk)+(w.cur?' (so far)':''),70,200,'800 76px '+D,C.ink);
  const st=p1Streak(),tiles=[[Math.round(w.mins),'minutes'],[w.act.length+' / 7','practice days'],[w.runs,'runs'],[st.cur,'day streak']];
  tiles.forEach(([v,l],i)=>{const x=70+(i%2)*480,y=250+Math.floor(i/2)*230;g.fillStyle=C.panel;rr(x,y,460,200,28);txt(String(v),x+36,y+120,'800 104px '+D,C.ink);txt(l,x+36,y+170,'600 32px '+B,C.mut);});
  let y=790;const block=(lab,lines)=>{txt(lab.toUpperCase(),70,y,'700 26px '+B,C.acc);y+=52;lines.slice(0,2).forEach(t=>{g.font='600 40px '+B;rfWrap(g,t,W-140).slice(0,2).forEach(l=>{txt(l,70,y,'600 40px '+B,C.ink);y+=52;});});y+=26;};
  block('Best this week',[w.best?w.best.t+(w.best.d?' · '+w.best.d:''):'Showing up is the win']);
  block(w.cur?'Rest of the week':'Next week',w.focus.filter(f=>f.k!=='gentle').slice(0,2).map(f=>f.t));
  if(w.badges.length&&y<H-170){txt('BADGES',70,y,'700 26px '+B,C.acc);y+=52;g.font='600 36px '+B;let x=70;w.badges.slice(0,4).forEach(id=>{const t=RF_BY[id].n,tw=g.measureText(t).width+44;if(x+tw>W-70){x=70;y+=64;}g.fillStyle=C.panel;rr(x,y-40,tw,56,28);txt(t,x+22,y,'600 36px '+B,C.ink);x+=tw+14;});}
  txt('Gentle streak · 2 rest days a week never break it',70,H-70,'500 28px '+B,C.mut);
  return {cv,texts};}
async function rfShare(wk){
  try{if(document.fonts&&document.fonts.load)await Promise.race([Promise.all(['800 40px "Big Shoulders Display"','600 40px "Figtree"'].map(f=>document.fonts.load(f))),sleep(800)]);}catch(_){}
  const {cv}=rfImage(wk),url=cv.toDataURL('image/png'),name='drumpath-week-'+wk+'.png';
  const m=openSheet('Share your week',`<img class="rfimg" src="${url}" alt="Your week as an image"><p class="mut" style="font-size:13px">Numbers only: your journal lines and pain notes stay private.</p><div class="row"><button class="pri" id="rfsh">Share</button><button id="rfsv">Save image</button></div>`);
  const blob=()=>new Promise(r=>cv.toBlob(r,'image/png'));
  $('#rfsh',m).onclick=async()=>{const b=await blob(),f=new File([b],name,{type:'image/png'});
    try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'My drum week',text:'My week on DrumPath'});return;}}catch(e){if(e&&e.name==='AbortError')return;}
    toast('Sharing isn’t available here: saving the image instead');rfSave(b,name);};
  $('#rfsv',m).onclick=async()=>rfSave(await blob(),name);return m;}
async function rfSave(b,name){const framed=window.self!==window.top;
  if(framed&&typeof isClaudeHost==='function'&&isClaudeHost()){try{const dl=await window.claude.use('downloads');if(dl){await dl.save({filename:name,data:b});toast('Image saved');return;}}catch(_){}}
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Image saved');}

/* ---------- events ---------- */
document.addEventListener('click',e=>{const T=e.target;let b;
  if((b=T.closest('[data-rf]'))){const a=b.dataset.rf;
    if(a==='open'){go('reflect',{wk:b.dataset.wk});return;}
    if(a==='off'){const r=rfS(),k=b.dataset.wk;r.weeks[k]=Object.assign(r.weeks[k]||{},{off:p1Now()});save();render();return;}
    if(a==='badges'){closeSheets();if(!$('#prac').classList.contains('hidden')&&typeof p1ClosePrac==='function'&&!run)p1ClosePrac();go('reflect',{badges:true});return;}
    if(a==='seen'){rfS().seenAt=p1Now();save();render();return;}
    if(a==='share'){rfShare(b.dataset.wk);return;}
    if(a==='d5'){p1PainSheet();return;}
    if(a==='page'){go('reflect');return;}}
  if((b=T.closest('[data-rfwk]'))){const n=+b.dataset.rfwk,cw=rfWkOf(p1Now());VP.reflect.wk=n?rfShift(VP.reflect.wk||rfShift(cw,-1),n):rfShift(cw,-1);render();return;}
  if((b=T.closest('[data-rftest]'))){(async()=>{const el=$('#rftests');el.innerHTML='Running…';const t=await p4Tests();go('reflect');const e2=$('#rftests');if(e2)e2.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>Reflection: ${t.filter(x=>x.pass).length}/${t.length} pass</b></div>`+t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');})();return;}
});

/* ---------- tests (?test=1 › Reflection › Run reflection tests) ---------- */
async function p4Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det===undefined?'':String(det)});
  const keep=JSON.stringify({reflect:state.reflect,journal:state.journal,days:state.days,prog:state.prog,done:state.done,plan:state.plan,theory:state.theory,time:state.time,songLog:state.songLog,set:state.set}),keepS=state.sessions,keepVP=JSON.stringify(VP.reflect),keepCur=cur,keepMem=JSON.stringify(P1_MEM),keepSES=SES;
  const lsBefore=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();
  const H=3600000,at=(k,h)=>pdate(k).getTime()+(h==null?10:h)*H;
  const fresh=()=>{state.reflect={};state.journal={};state.days={};state.prog={};state.done={};state.sessions=[];state.plan={days:{},act:{},rev:{}};state.theory={cards:{},review:{},bookmarks:[],lastCard:null};state.songLog={};thFill(state);p1Fill(state);
    state.time={gap:{kit:{s:0,ok:0,bad:0,top:0,at:0},touch:{s:0,ok:0,bad:0,top:0,at:0}}};SES=null;p1Clock=null;};
  const master=(id,ts)=>{const l=LBY[id],p=P(id);p.status='mastered';p.bpm=l.bpm[1];p.bestBpm=l.bpm[1];p.masteredAt=ts;p.last=ts;p.attempts=3;};
  const run_=(id,ts,bpm,score,o)=>Object.assign({ts,id,ex:0,bpm,score,on:score,n:100,ext:0,miss:0,avg:0,dur:60},o||{});
  const W0='2026-11-08',W1='2026-11-15',Wm='2026-11-01';   // Sun 8 Nov (the week under review), Sun 15 Nov (this week), Sun 1 Nov
  try{
    // state
    {const s={};rfFill(s);T('Back-fill: an old backup gets state.reflect',s.reflect&&s.reflect.badges&&s.reflect.weeks&&s.reflect.seenAt===0);
     const o=normaliseState({v:1,prog:{},sessions:[],savedAt:1});T('normaliseState back-fills it too (via p1Fill)',o.reflect&&o.reflect.badges);
     const b={reflect:{badges:{x:{at:'bad'},y:{at:5}},weeks:{a:3},seenAt:'q'}};rfFill(b);T('Back-fill drops broken entries',!b.reflect.badges.x&&b.reflect.badges.y.got===5&&!b.reflect.weeks.a&&b.reflect.seenAt===0);
     const m=rfMerge({badges:{a:{at:5,got:9}},weeks:{w:{seen:7}},seenAt:3},{badges:{a:{at:4,got:12},b:{at:8,got:8}},weeks:{w:{seen:6,off:2},v:{off:1}},seenAt:10});
     T('Merge: badges kept from both devices with the earliest dates; reviews opened = earliest; seenAt = later',m.badges.a.at===4&&m.badges.a.got===9&&m.badges.b.at===8&&m.weeks.w.seen===6&&m.weeks.w.off===2&&m.weeks.v.off===1&&m.seenAt===10,JSON.stringify(m));
     const ms=mergeStates(normaliseState({v:1,savedAt:1,reflect:{badges:{day1:{at:3,got:3}}}}),normaliseState({v:1,savedAt:2}));T('mergeStates carries state.reflect',ms.reflect&&ms.reflect.badges.day1&&ms.reflect.badges.day1.at===3);
     T('Drive sync sees a reflection-only change',!sameData(normaliseState({v:1,reflect:{weeks:{a:{seen:1}}}}),normaliseState({v:1})));}
    // a week, worked out from the data
    fresh();p1Clock=at(W1,11);   // Sun 15 Nov 11:00
    rfDays(Wm).slice(1,4).forEach(k=>{state.days[k]=20*60000;});rfDays(W0).slice(1,6).forEach(k=>{state.days[k]=15*60000;});
    state.sessions=[run_('1.5.03',at(Wm,0)+DAY,70,95),run_('1.5.03',at(W0)+DAY,80,96),run_('1.5.03',at(W0)+2*DAY,85,94),run_('1.6.01',at(W0)+2*DAY,60,70),
      run_('1.6.01',at(W0)+3*DAY,60,72),run_('1.6.01',at(W0)+3*DAY+60000,60,68),run_('1.6.01',at(W0)+4*DAY,60,74),{ts:at(W0)+4*DAY,id:'time:gap',kind:'time',src:'kit',bpm:60,score:96,dur:50,tf:{step:2,ok:1}},{ts:at(W0)+5*DAY,id:'tap:1.5.03',kind:'tap',bpm:60,score:90,dur:30}];
    state.journal[rfDays(W0)[2]]={t:'Left wrist sore',pain:true,at:at(W0,20)+2*DAY};state.journal[rfDays(W0)[4]]={t:'Better, felt steady',pain:true,at:at(W0,20)+4*DAY};state.journal[rfDays(W0)[5]]={t:'Fine today',pain:false,at:at(W0,20)+5*DAY};
    let w=rfWeek(W0);
    T('Week: minutes, practice days, runs (all kinds), lesson runs and passes',Math.round(w.mins)===75&&w.act.length===5&&w.runs===8&&w.lessonRuns===6&&w.passed===2,JSON.stringify({m:w.mins,a:w.act.length,r:w.runs,lr:w.lessonRuns,p:w.passed}));
    T('…compared with the week before',Math.round(w.prev.mins)===60&&w.prev.act===3,JSON.stringify(w.prev));
    T('Best improvement: the biggest tempo gain (1.5.03 70 → 85)',w.best&&w.best.k==='tempo'&&w.best.id==='1.5.03'&&/70 → 85/.test(w.best.d),JSON.stringify(w.best));
    T('Weak spot: a lesson with 3+ runs and no pass this week (1.6.01 at 60)',w.weak&&w.weak.k==='plateau'&&w.weak.id==='1.6.01'&&w.weak.bpm===60,JSON.stringify(w.weak));
    T('Pain on 2 days → next week is “a gentle week” first (coach rule D5)',w.pain.length===2&&w.focus[0].k==='gentle'&&/D5/.test(w.focus[0].d),w.focus.map(f=>f.k).join(','));
    T('…then the weak spot, rebuilt 10 BPM slower (coach rule D2)',w.focus[1].k==='plateau'&&/at 50 BPM/.test(w.focus[1].t)&&/D2/.test(w.focus[1].d),w.focus[1].t);
    T('A gentle week leaves out the new-lesson push and the music nudge',!w.focus.some(f=>f.k==='main'||f.k==='music'));
    delete state.journal[rfDays(W0)[4]];w=rfWeek(W0);T('One pain day: no gentle week; main lesson + habit + music (D7) instead',!w.focus.some(f=>f.k==='gentle')&&w.focus.some(f=>f.k==='habit')&&w.focus.some(f=>f.k==='music'),w.focus.map(f=>f.k).join(','));
    T('5 practice days: the habit line keeps the rest days',w.focus.find(f=>f.k==='habit').t==='Same rhythm');
    state.plan.days[rfDays(W0)[3]]={kit20:{items:[],done:{free:at(W0)+3*DAY},skip:{}}};T('Free play in the week: no music nudge',!rfWeek(W0).focus.some(f=>f.k==='music'));
    // best-improvement order
    {const s0=state.sessions;state.sessions=s0.filter(s=>s.id!=='1.5.03'||s.ts>=at(W0));master('1.6.02',at(W0)+DAY);let b=rfWeek(W0).best;T('No tempo gain: a lesson mastered this week comes next',b&&b.k==='mastered'&&b.id==='1.6.02',JSON.stringify(b));
     delete state.prog['1.6.02'];b=rfWeek(W0).best;T('…then a first pass',b&&b.k==='first'&&b.id==='1.5.03'&&/85 BPM/.test(b.d),JSON.stringify(b));
     state.sessions=[run_('1.6.01',at(Wm)+DAY,60,60),run_('1.6.01',at(W0)+DAY,60,72)];b=rfWeek(W0).best;T('…then an accuracy gain (+12 points)',b&&b.k==='acc'&&/\+12 points/.test(b.d),JSON.stringify(b));
     state.sessions=[{ts:at(Wm)+DAY,id:'time:gap',kind:'time',tf:{step:1,ok:1}},{ts:at(W0)+DAY,id:'time:gap',kind:'time',tf:{step:3,ok:1}}];b=rfWeek(W0).best;T('…then a gap-click step',b&&b.k==='gap'&&/step 4/.test(b.t),JSON.stringify(b));
     state.sessions=[];b=rfWeek(W0).best;T('Nothing else: “showing up” still counts',b&&b.k==='showing',JSON.stringify(b));
     state.sessions=s0;}
    // weak-spot order
    {const s0=state.sessions;const hits=n=>({pads:{K:[n,Math.round(n*0.7),0,0,20,null],S:[n,n,0,0,2,null]}});state.sessions=[run_('1.5.03',at(W0)+DAY,80,95,hits(40))];
     let k=rfWeak(rfWeek(W0));T('No stuck lesson: the weakest pad (kick 70 % on time)',k&&k.k==='pad'&&k.v==='K'&&/70% on time/.test(k.d),JSON.stringify(k));
     state.sessions=[run_('1.5.03',at(W0)+DAY,80,95,{pads:{K:[40,39,0,0,-22,null]}})];k=rfWeak(rfWeek(W0));T('…or a pad that rushes 15+ ms',k&&k.k==='off'&&/rushes/.test(k.t),JSON.stringify(k));
     state.sessions=[{ts:at(W0)+DAY,id:'time:drift',kind:'time',tf:{start:70,end:77,dev:9.5,st:52}}];k=rfWeak(rfWeek(W0));T('…or a drifting tempo test',k&&k.k==='drift'&&/70 → 77/.test(k.d),JSON.stringify(k));
     const cid=TH_ORDER[0].id;state.sessions=[];state.theory.miss[cid]=[at(W0)+DAY,at(W0)+2*DAY,at(Wm)];k=rfWeak(rfWeek(W0));T('…or an idea missed twice (ear game, checks, lookups)',k&&k.k==='miss'&&k.card===cid&&k.n===2,JSON.stringify(k));
     const f=rfWeek(W0).focus.find(x=>x.k==='miss');T('…and the focus offers a Quick look at its card',f&&f.card===cid&&/data-ql/.test(rfReviewHtml(rfWeek(W0))));state.theory.miss={};state.sessions=s0;}
    // Today and the pain sheet (D5)
    {fresh();p1Clock=at(W1,11);p1SetMode('kit');state.set.planMins=20;state.journal[dkey(new Date(p1Now()-DAY))]={t:'sore',pain:true,at:p1Now()-DAY};
     T('One pain day: Today keeps the P1 reminder only',/You noted pain yesterday/.test(p1TodayCard())&&!/rfpain/.test(p1TodayCard()));
     state.journal[dkey(new Date(p1Now()-3*DAY))]={t:'sore',pain:true,at:p1Now()-3*DAY};const h=p1TodayCard();
     T('2 pain days in the last 7: a stronger D5 line on Today, with “Make today 10 min”',/Pain on 2 of the last 7 days/.test(h)&&/data-p1mins="10"[^>]*>Make today 10 min/.test(h));
     T('…which a 10-minute session no longer offers',(()=>{state.set.planMins=10;const ok=!/Make today 10 min/.test(p1TodayCard());state.set.planMins=20;return ok;})());
     closeSheets();p1Clock=null;state.journal={};const d1=dkey(new Date(Date.now()-2*DAY));state.journal[d1]={t:'x',pain:true,at:Date.now()-2*DAY};p1JournalSave('wrist again',true);const sh=document.querySelector('.modal');
     T('Saving a 2nd pain day in a week: the D5 sheet says so',sh&&/2 days with pain in the last week/.test(sh.textContent));closeSheets();}
    // badges
    {fresh();p1Clock=new Date(2026,10,30,12).getTime();const sun=new Date(2026,9,4);   // Sun 4 Oct 2026
     for(let i=0;i<28;i++){const d=new Date(sun);d.setDate(sun.getDate()+i);if([1,3,5].includes(d.getDay()))state.days[dkey(d)]=10*60000;}
     let c=rfCtx();T('Habit: first session = the first practice day',c.actAt(1)===at(dkey(new Date(2026,9,5)),12));
     T('Habit: a three-day week = its 3rd day; a month of habit = the 3rd day of the 4th such week',c.weeksRun(1)===at('2026-10-09',12)&&c.weeksRun(4)===at('2026-10-30',12),new Date(c.weeksRun(4)).toDateString());
     delete state.days['2026-10-21'];c=rfCtx();T('…a week with only 2 days breaks the run',c.weeksRun(4)===null&&c.longRun()===2,c.longRun());state.days['2026-10-21']=600000;
     T('30 practice days: not yet (12), with progress',c.actAt(30)===null&&RF_BY.days30.p(rfCtx())[0]===12);
     const n1=rfCheck();T('rfCheck records what is earned, with the date it was earned',n1.includes('day1')&&n1.includes('wk3')&&n1.includes('month')&&state.reflect.badges.month.at===at('2026-10-30',12)&&state.reflect.badges.month.got===p1Now(),n1.join(','));
     T('Nothing for grinding: no badge for long sessions or minutes in a day',!RF_BADGES.some(b=>/session length|in a day|marathon/i.test(b.n+b.d)));
     T('…and nothing twice',rfCheck().length===0);
     T('New badges show on Home until seen',/New badges?:/.test(rfHomeCard())&&rfNew().length===n1.length);
     state.days={};T('Earned badges are kept even if the data behind them goes (e.g. trimmed)',rfCheck().length===0&&state.reflect.badges.month);
     go('reflect');$('#view [data-rf="seen"]').click();T('Mark as seen clears “New”',rfNew().length===0&&!/New badge/.test(rfHomeCard()));
     master('2.3.01',at('2026-11-02'));T('First lesson mastered = its mastery date',rfCheck().includes('pass1')&&state.reflect.badges.pass1.at===at('2026-11-02'));
     const l68=LESSONS.find(l=>l.ex&&l.ex.some(ex=>ex.meter==='6/8'&&ex.v.K&&Object.keys(ex.v).length>=3));master(l68.id,at('2026-11-20'));T('First 6/8 groove ('+l68.id+')',rfCheck().includes('g68')&&state.reflect.badges.g68.at===at('2026-11-20'));
     const l0=LESSONS.filter(l=>l.lv===0&&!l.later);l0.forEach(l=>{if(l.type==='play')master(l.id,at('2026-11-21'));else state.done[l.id]=true;});T('Level 0 complete when every Level 0 lesson is done',rfCheck().includes('lv0')&&!state.reflect.badges.lv1);
     const lv1=RF_BY.lv1.p(rfCtx());T('…Level 1 shows its progress (n of N)',lv1[1]===LESSONS.filter(l=>l.lv===1&&!l.later).length,lv1.join(' of '));
     state.time.gap.kit.top=4;state.sessions.push({ts:at('2026-11-22'),id:'time:gap',kind:'time',src:'kit',dur:3700,tf:{step:4,ok:1}});T('Four-bar gaps (ladder step 5) and an hour of time feel',(()=>{const n=rfCheck();return n.includes('gap4')&&n.includes('tf1h')&&!n.includes('gaptop');})());
     const cs=TH_ORDER.slice(0,25);cs.forEach((k,i)=>{state.theory.cards[k.id]={r:at('2026-11-01')+i,u:at('2026-11-02')+i};});T('25 cards understood',rfCheck().includes('cards25')&&state.reflect.badges.cards25.at===at('2026-11-02')+24);
     for(let i=0;i<10;i++)state.journal[dkey(new Date(2026,10,1+i))]={t:'line '+i,at:at(dkey(new Date(2026,10,1+i)),21)};T('Ten journal lines',rfCheck().includes('journal10'));
     T('Badges page: every group, earned with dates, locked with progress bars',(()=>{go('reflect');const v=$('#view');return RF_GROUPS.every(g=>v.textContent.includes(g))&&v.querySelectorAll('.rfb.got').length===Object.keys(state.reflect.badges).length&&v.querySelector('.rfbar');})());}
    // Home card: Sunday → Wednesday, until opened or dismissed
    {fresh();rfDays(W0).slice(1,4).forEach(k=>{state.days[k]=15*60000;});p1Clock=at(W1,9);let h=rfHomeCard();
     T('Sunday: Home shows the review of the week just ended',/Your week/.test(h)&&h.includes('data-wk="'+W0+'"'),h.slice(0,80));
     p1Clock=at(W1,9)+3*DAY;T('…still on Wednesday',/Your week/.test(rfHomeCard()));p1Clock=at(W1,9)+4*DAY;T('…gone on Thursday',!/Your week/.test(rfHomeCard()));
     p1Clock=at(W1,9);go('home');const b=$('#view [data-rf="off"]');b&&b.click();T('✕ dismisses it',state.reflect.weeks[W0]&&state.reflect.weeks[W0].off&&!/Your week/.test(rfHomeCard()));
     delete state.reflect.weeks[W0];go('home');$('#view [data-rf="open"]').click();T('Opening it goes to the review and marks it read',cur==='reflect'&&VP.reflect.wk===W0&&state.reflect.weeks[W0].seen&&!/Your week/.test(rfHomeCard()));
     T('The review page: stats, best, weak spot, focus, journal, consistency, badges',(()=>{const t=$('#view').textContent;return /Weekly review/.test(t)&&/Practice days/.test(t)&&/Best improvement/.test(t)&&/Weak spot/.test(t)&&/Next week’s focus/.test(t)&&/Consistency/.test(t)&&/Badges/.test(t)&&$('#view .rfwb svg');})());
     $('#view [data-rfwk="1"]').click();T('› moves to this week (“so far”)',VP.reflect.wk===W1&&/This week so far/.test($('#view').textContent));
     T('…and stops there',$('#view [data-rfwk="1"]').disabled);
     state.days={};state.sessions=[];p1Clock=at(W1,9);T('An empty week: no Sunday card',!/Your week/.test(rfHomeCard()));}
    // share image
    {fresh();p1Clock=at(W1,11);rfDays(W0).slice(1,4).forEach(k=>{state.days[k]=15*60000;});state.journal[rfDays(W0)[2]]={t:'SECRET wrist line',pain:true,at:at(W0)+2*DAY};
     const im=rfImage(W0);T('Share image: 1080 × 1350 PNG drawn on the device',im.cv.width===1080&&im.cv.height===1350&&/^data:image\/png/.test(im.cv.toDataURL('image/png')));
     T('…numbers only: no journal line or pain note on it',im.texts.length>8&&!im.texts.some(t=>/SECRET|wrist|pain/i.test(t))&&im.texts.some(t=>/minutes/.test(t)),im.texts.slice(0,6).join(' | '));
     const m=await rfShare(W0);T('…a sheet with a preview, Share and Save image',m&&m.querySelector('img.rfimg')&&m.querySelector('#rfsh')&&m.querySelector('#rfsv'));closeSheets();}
    // results: a new badge line after a run; lesson scoring untouched
    {fresh();p1Clock=null;const id='1.2.02',before=JSON.stringify(state.prog);openPractice(id);await startRun();const R=run;R.evs.forEach(e=>{if(!e.listen)hit(e.v,e.ch==='X'?118:e.ch==='g'?28:80,e.t+state.lat,e.art);});R.end=performance.now()-1e4;finish();
     const s=state.sessions[state.sessions.length-1];T('After the first run of a day: “New badge: First session” on the result',/New badge/.test($('#result').textContent)&&/First session/.test($('#result').textContent));
     T('…the run itself is a normal lesson run',s&&s.id===id&&!s.kind&&s.score===100,s&&s.score);
     $('#prac').classList.add('hidden');L=null;}
    // testing mode
    T('Testing mode: nothing is written',!SANDBOX||(()=>{let wN=0;const o=storeSave;storeSave=()=>{wN++;};try{rfS().seenAt=1;save();rfCheck();}finally{storeSave=o;}const ls=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();return wN===0&&ls===lsBefore;})(),SANDBOX?'sandbox on':'not in testing mode');
  }catch(e){T('No errors',false,e.message+' '+(e.stack||'').split('\n')[1]);}
  p1Clock=null;SES=keepSES;closeSheets();if(typeof p1ClosePrac==='function')p1ClosePrac();const k=JSON.parse(keep);Object.assign(state,{reflect:k.reflect,journal:k.journal,days:k.days,prog:k.prog,done:k.done,plan:k.plan,theory:k.theory,time:k.time,songLog:k.songLog,set:k.set});state.sessions=keepS;thFill(state);p1Fill(state);
  Object.keys(P1_MEM).forEach(x=>delete P1_MEM[x]);Object.assign(P1_MEM,JSON.parse(keepMem));VP.reflect=JSON.parse(keepVP);cur=keepCur;render();
  return out;
}
window.p4Tests=p4Tests;
