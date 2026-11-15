/* DrumPath — G1 Guide (build/guide-plan.md, D-044): tour player, "?" page help, More › Guide hub, hints, What's new.
   · Tours (src/guide/tours.js): spotlight + bubble, Look / Do it / Go steps, Back · Next · Steps ☰, ✕ keeps your place
     (Resume), Android Back = previous step, ←/→/Esc on a keyboard. Cross-page steps go through guideGo() only (R1 points it
     at its addresses later). The lit element is the real one and works; tours pause during a run, while a sheet is open,
     and come back on the result. A run started in a tour is a real run (saved, scored, counts; D-044 b); testing mode
     still saves nothing (D-022). The bubble never covers the pads; on phones it docks to the top or bottom, on tablets it
     floats beside its target. At the kit (kit remote learned): high tom = Next, rim click = Back, kick + pedal = close.
   · "?" (header, practice screen): what's here, its tour, its How pages, its words (Quick look ⓘ).
   · How it works (src/guide/how.js): one sheet per process with your own numbers; "Show me ›" lights the real screen.
   · Hints (off by default, D-044 a): a "New here? Tour" pill the first time a page is opened (Settings › Guide).
   Synced: state.guide = {tours:{id:{step,done,at}}, tips:{page:at}, hints, hintsAt, seenVer} (back-filled, merged).
   No engine change. */
'use strict';
ICONS.guide='<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.7v.4"/><circle cx="12" cy="17.2" r=".7" fill="currentColor"/>';
NAVI.guide=['Guide','Tours, how it works, what’s new'];
VP.guide=VP.guide||{tab:'tours'};
const gdS=()=>gdFill(state).guide;
const gdTour=id=>GD_TOURS.find(t=>t.id===id)||null;
const gdHowOf=id=>GD_HOW.find(h=>h.id===id)||null;
const gdTxt=x=>typeof x==='function'?x():x;

/* ---------- state ---------- */
function gdFill(s){let g=s.guide;if(!g||typeof g!=='object'||Array.isArray(g))g=s.guide={};
  ['tours','tips'].forEach(f=>{if(!g[f]||typeof g[f]!=='object'||Array.isArray(g[f]))g[f]={};});
  Object.keys(g.tours).forEach(k=>{const t=g.tours[k];if(!t||typeof t!=='object'||!(t.at>0))delete g.tours[k];else{t.step=Math.max(0,Math.floor(+t.step||0));t.done=!!t.done;}});
  Object.keys(g.tips).forEach(k=>{if(!(g.tips[k]>0))delete g.tips[k];});
  if(typeof g.hints!=='boolean')g.hints=false;if(!(g.hintsAt>0))g.hintsAt=0;if(!(g.seenVer>0))g.seenVer=0;return s;}
// newest place per tour (a tour finished on either device stays ✓), tips: union with the earliest time, hints: the later switch, seenVer: max
function gdMerge(A,B){const a=gdFill({guide:JSON.parse(JSON.stringify(A||{}))}).guide,b=gdFill({guide:JSON.parse(JSON.stringify(B||{}))}).guide;
  const m={tours:{},tips:{},hints:false,hintsAt:0,seenVer:Math.max(a.seenVer,b.seenVer)};
  new Set([...Object.keys(a.tours),...Object.keys(b.tours)]).forEach(k=>{const x=a.tours[k],y=b.tours[k];const n=!x?y:!y?x:(y.at>x.at?y:x);m.tours[k]={step:n.step,done:!!((x&&x.done)||(y&&y.done)),at:n.at};});
  new Set([...Object.keys(a.tips),...Object.keys(b.tips)]).forEach(k=>{const x=a.tips[k],y=b.tips[k];m.tips[k]=x&&y?Math.min(x,y):x||y;});
  const h=b.hintsAt>a.hintsAt?b:a;m.hints=h.hints;m.hintsAt=h.hintsAt;return m;}
function gdRec(id,step,done){const g=gdS(),o=g.tours[id]||{};g.tours[id]={step,done:!!(done||o.done),at:Date.now()};save();}

/* ---------- where am I ---------- */
const gdVisEl=e=>{if(!e||!e.getClientRects().length)return false;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;const s=getComputedStyle(e);if(s.visibility==='hidden'||+s.opacity===0)return false;
  const pr=$('#prac');if(!pr.classList.contains('hidden')&&!pr.contains(e)&&!e.closest('.modal,#gdlay'))return false;return true;};
function gdVis(sel){for(const s of [].concat(sel)){const e=[...document.querySelectorAll(s)].find(gdVisEl);if(e)return e;}return null;}
const gdPracOpen=()=>!$('#prac').classList.contains('hidden')&&!!L;
function gdPage(){if(gdPracOpen()){const res=!$('#result').classList.contains('hidden');if(L.time)return res?'timeresult':'timedrill';if(res)return 'result';if(L.tap)return 'tapdrill';return 'practice';}
  if(cur==='lessons'&&VP.lessons.id)return 'lesson';return cur;}
function gdLesson(){let f=null;try{f=typeof p1Focus==='function'?p1Focus():null;}catch(_){}return (f&&LBY[f.id]?f:LESSONS.find(l=>l.type==='play'&&!l.later)).id;}
function gdPracId(){return gdPracOpen()&&LBY[L.id]&&!L.calib&&!L.time&&!L.tap&&!L.theory?L.id:gdLesson();}
const gdRoute=a=>{a=gdTxt(a);return typeof a==='string'?{v:a}:(a||{v:'any'});};
function gdHere(a){const r=gdRoute(a);if(r.v==='any')return true;const pg=gdPage();if(r.v!==pg)return false;
  if(r.id&&pg==='lesson'&&VP.lessons.id!==r.id)return false;if(r.id&&pg==='practice'&&L.id!==r.id)return false;if(r.v==='guide'&&r.tab&&VP.guide.tab!==r.tab)return false;return true;}
/* ONE route helper for every cross-page step (plan §4; R1 later points it at its addresses). Returns true if it navigated. */
function guideGo(v,p){if(v&&typeof v==='object'){p=v;v=v.v;}p=p||{};if(run)return false;
  const leave=()=>{if(gdPracOpen()||!$('#prac').classList.contains('hidden'))p1ClosePrac();closeSheets();closeMore();};
  switch(v){
    case 'practice':{const id=p.id||gdLesson();if(!LBY[id])return false;closeSheets();if(!gdPracOpen()||L.id!==id)openPractice(id);else $('#result').classList.add('hidden');return true;}
    case 'result':case 'timeresult':case 'timedrill':case 'tapdrill':case 'any':return false;
    case 'lesson':leave();openLesson(p.id||gdLesson());return true;
    case 'lessons':leave();go('lessons',{lv:null,sd:null,id:null});return true;
    case 'theory':leave();if(typeof thGo==='function')thGo({mode:'home'});else go('theory');return true;
    case 'today':leave();go('today',{mode:'plan'});return true;
    case 'guide':leave();go('guide',{tab:p.tab||VP.guide.tab||'tours'});return true;
    default:if(!NAVI[v]&&v!=='time'&&v!=='reflect')return false;leave();go(v,p.params);return true;}}

/* ---------- player ---------- */
const GD={tour:null,i:0,t0:0,tick:null,clicked:false,list:false,sig:'',el:null,paused:false,hist:false,popIgnore:false,shown:{},showMe:null,lastPlace:''};
const gdStep=()=>GD.tour&&GD.tour.steps[GD.i];
function gdStart(id,o={}){const t=o.tour||gdTour(id);if(!t)return false;if(run){toast('Tours start after the run');return false;}
  closeSheets();closeMore();gdStop(true);GD.tour=t;const rec=gdS().tours[t.id];
  const i=o.step!=null?o.step:(o.resume&&rec&&!rec.done?Math.min(rec.step,t.steps.length-1):0);
  if(!t.adhoc&&!o.quiet){gdS().tips[gdPage()]=gdS().tips[gdPage()]||Date.now();}
  if(t.whatsnew&&gdS().seenVer<t.whatsnew)gdS().seenVer=t.whatsnew;
  try{history.pushState({gd:1},'');GD.hist=true;}catch(_){GD.hist=false;}
  if(!GD.tick)GD.tick=setInterval(gdTick,250);gdEnter(i,{nav:true});return true;}
function gdEnter(i,o={}){const t=GD.tour;if(!t)return;GD.i=Math.max(0,Math.min(i,t.steps.length-1));GD.t0=performance.now();GD.clicked=false;GD.list=false;GD.sig='';
  const s=gdStep();if(o.nav&&!gdHere(s.at))guideGo(gdRoute(s.at));
  if(!t.adhoc)gdRec(t.id,GD.i,false);
  requestAnimationFrame(()=>{gdScrollTo(gdTarget(s));gdTick();});}
// bring the target into view: the page, or the result pane on the practice screen (never the fixed bars)
function gdScrollTo(el){if(!el||el.closest('.bnav,.top,.dock,#pads'))return;const r=el.getBoundingClientRect(),H=document.documentElement.clientHeight,W=document.documentElement.clientWidth;
  if(el.closest('.ptop')){if(r.left<0||r.right>W)el.scrollIntoView({block:'nearest',inline:'center'});return;}   // the practice top bar scrolls sideways on short screens
  if(el.closest('#prac')){const pe=$('#pads'),lim=pe&&gdVisEl(pe)?pe.getBoundingClientRect().top:H;if(r.top<0||r.bottom>lim)el.scrollIntoView({block:r.height>lim*0.6?'start':'center'});return;}
  if(r.top<70||r.bottom>H-90)el.scrollIntoView({block:r.height>H*0.6?'start':'center'});}
function gdNext(){if(!GD.tour)return;if(GD.i>=GD.tour.steps.length-1){gdFinish();return;}const s=gdStep();
  if(s.k==='go'&&!gdHere(s.to)){guideGo(gdRoute(s.to));}gdEnter(GD.i+1,{nav:true});}
function gdBack(){if(!GD.tour)return;if(GD.i===0)return;gdEnter(GD.i-1,{nav:true});}
function gdFinish(end){const t=GD.tour;if(!t)return;if(!t.adhoc){gdRec(t.id,0,true);toast('Tour done ✓ '+t.t);}GD.tour=null;gdStop();if(end&&t.end)t.end.fn();else if(cur==='guide')render();}
function gdClose(){gdStop();if(cur==='guide')render();}
function gdStop(keepHist){if(GD.tour&&!GD.tour.adhoc)gdRec(GD.tour.id,GD.i,false);GD.tour=null;clearInterval(GD.tick);GD.tick=null;const l=$('#gdlay');if(l)l.remove();GD.el=null;
  if(GD.hist&&!keepHist){GD.hist=false;try{if(history.state&&history.state.gd){GD.popIgnore=true;history.back();}}catch(_){}}}
addEventListener('popstate',()=>{if(GD.popIgnore){GD.popIgnore=false;return;}if(!GD.tour)return;GD.hist=false;
  if(GD.i>0){gdBack();try{history.pushState({gd:1},'');GD.hist=true;}catch(_){}}else gdClose();});
addEventListener('keydown',e=>{if(!GD.tour||GD.paused||e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(e.key==='ArrowRight'){e.preventDefault();gdNext();}else if(e.key==='ArrowLeft'){e.preventDefault();gdBack();}else if(e.key==='Escape'){gdClose();}});
// a "Do it" step is done when you tap (inside) the lit element, unless it has its own condition
document.addEventListener('click',e=>{if(!GD.tour)return;const s=gdStep();if(s&&s.k==='do'&&GD.el&&GD.el.contains(e.target))GD.clicked=true;},true);
function gdTarget(s){if(!s||!s.el)return null;if(typeof s.el==='function'){const e=s.el();return e&&gdVisEl(e)?e:null;}return gdVis(s.el);}
function gdTick(){
  if(!GD.tour)return;const s=gdStep();
  const pause=!!run||[...document.querySelectorAll('.modal')].length>0||!$('#msheet').classList.contains('hidden')||(typeof KP!=='undefined'&&!!KP.arm);
  let lay=$('#gdlay');
  if(pause){GD.paused=true;if(lay)lay.classList.add('hidden');return;}
  GD.paused=false;
  if(s.k==='do'&&(s.done?s.done():GD.clicked)){gdAdvance();return;}
  if(s.k==='go'&&gdHere(s.to)){gdAdvance();return;}
  if(!lay){lay=document.createElement('div');lay.id='gdlay';lay.innerHTML='<div class="gdspot"></div><div class="gdb" role="dialog" aria-live="polite"></div>';document.body.appendChild(lay);}
  lay.classList.remove('hidden');
  const here=gdHere(s.at),el=here||s.at==='any'?gdTarget(s):null,skip=s.k==='do'&&performance.now()-GD.t0>10000;
  const sig=[GD.tour.id,GD.i,here,!!el,skip,GD.list,document.documentElement.classList.contains('atkit'),gdKitLine()].join('|');
  if(sig!==GD.sig){GD.sig=sig;$('.gdb',lay).innerHTML=gdBubble(s,here,el,skip);}
  GD.el=el;gdPlace(lay,el);
}
function gdAdvance(){if(GD.i>=GD.tour.steps.length-1){gdFinish();return;}gdEnter(GD.i+1,{nav:!['result','timeresult'].includes(gdPage())});}   // never pulls you off a result
function gdKitLine(){if(typeof kpR!=='function'||!kpR().on||!(kpKit()||KPV))return '';const it=[['next','Next'],['again','Back'],['back','Close']].filter(([k])=>kpMapped(k)).map(([k,l])=>`<b>${esc(kpPadName(k))}</b> ${l}`);
  return it.length?`<div class="gdkit"><span class="kpk">Kit</span> ${it.join(' · ')}</div>`:'';}
function gdBubble(s,here,el,skip){const t=GD.tour,n=t.steps.length,last=GD.i===n-1,adhoc=t.adhoc;
  const need=s.need?gdTxt(s.need):'';let body=`<div class="gdb-t">${gdTxt(s.t)}</div>`;
  if(!here&&s.at!=='any'){const r=gdRoute(s.at),can=!['result','timeresult','timedrill','tapdrill'].includes(r.v);
    body+=`<div class="gdb-why">${can?'This step is on another page.':s.why||'This step shows after a run.'}</div><div class="gdb-f">${can?'<button class="sm pri" data-gd="there">Take me there ›</button>':''}${s.miss?`<button class="sm pri" data-gd="miss">${esc(s.miss.lab)}</button>`:''}</div>`;}
  else if(!el)body+=`<div class="gdb-why">${s.why||'This part isn’t on the screen right now.'}</div>`;
  if(need)body+=`<div class="gdb-why">${need}</div>`;
  if(s.k==='do'&&here&&el)body+=`<div class="gdb-do">▸ ${s.do||'Tap the lit button.'}</div>`;
  if(s.run&&here)body+=`<div class="gdb-run mut">${SANDBOX?'Testing mode: this run isn’t saved.':'This run will be saved and counts.'}</div>`;
  const h=s.how&&gdHowOf(s.how);
  const nextLab=last?(adhoc?'Got it':'Done'):s.k==='do'&&here&&el&&!skip?'':(!el||!here)&&!last?'Skip ›':s.k==='do'?'Skip this':'Next ›';
  return `<div class="gdb-h"><span class="note-k">${adhoc?'Show me':esc(t.t)+' · step '+(GD.i+1)+' of '+n}</span><span class="sp"></span><button class="icon ghost gdx" data-gd="x" title="Close the tour (keeps your place)" aria-label="Close">${icon('close',18)}</button></div>${body}
   <div class="gdb-f">${h?`<button class="sm ghost gdhow" data-gd="how:${h.id}">How this works ›</button>`:''}<span class="sp"></span>${GD.i>0?'<button class="sm ghost" data-gd="back">‹ Back</button>':''}${nextLab?`<button class="sm pri" data-gd="next">${nextLab}</button>`:''}${last&&t.end&&!adhoc?`<button class="sm pri" data-gd="end">${esc(t.end.lab)}</button>`:''}</div>
   ${adhoc?'':`<div class="gdb-x"><span class="gddots" aria-hidden="true">${t.steps.map((_,j)=>`<i class="${j<GD.i?'d':j===GD.i?'c':''}"></i>`).join('')}</span><span class="sp"></span><button class="sm ghost" data-gd="steps" aria-expanded="${GD.list}">Steps ☰</button></div>
   ${GD.list?`<ol class="gdsteps">${t.steps.map((x,j)=>`<li><button class="${j===GD.i?'on':''}" data-gd="jump:${j}">${esc(String(gdTxt(x.t)).replace(/<[^>]+>/g,'').slice(0,64))}</button></li>`).join('')}</ol>`:''}`}${gdKitLine()}`;}
/* place the bubble: never over the pads, never over its target (unless the target is most of the screen) */
function gdPlace(lay,el){const b=$('.gdb',lay),sp=$('.gdspot',lay),de=document.documentElement,Z=parseFloat(getComputedStyle(de).zoom)||1;
  // everything is measured in screen px (getBoundingClientRect), then divided by the page zoom when set as CSS (125 % text)
  const vw=de.clientWidth,vh=de.clientHeight,px=v=>(v/Z)+'px';
  const R=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};};
  const pe=gdPracOpen()?$('#pads'):null,pads=pe&&gdVisEl(pe)?R(pe):null,lim=pads?Math.max(80,pads.t):vh;
  let t=el?R(el):null;if(t){const q=6*Z;t={l:t.l-q,t:t.t-q,r:t.r+q,b:t.b+q,w:t.w+2*q,h:t.h+2*q};}
  if(t){Object.assign(sp.style,{display:'block',left:px(t.l),top:px(t.t),width:px(t.w),height:px(t.h)});}else sp.style.display='none';
  const big=t&&t.h>lim*0.55;const hit=(x,y,w,h)=>[pads,big?null:t].filter(Boolean).some(q=>x<q.r&&x+w>q.l&&y<q.b&&y+h>q.t);
  const key=[vw,vh,Z,t&&[t.l,t.t,t.w,t.h].map(Math.round),pads&&Math.round(pads.t),GD.sig].join('|');if(key===GD.lastPlace)return;GD.lastPlace=key;
  b.classList.remove('compact','gddock');b.style.maxHeight='';b.style.right='auto';b.style.bottom='auto';b.style.left='0px';b.style.top='0px';
  const m=8*Z,wide=vw>=700*Z&&vh>=420*Z;
  if(wide){const wc=Math.min(document.documentElement.classList.contains('atkit')?440:360,vw/Z-24);b.style.width=wc+'px';const w=wc*Z,h=b.getBoundingClientRect().height;
    const cl=(v,a,z)=>Math.max(a,Math.min(z,v)),c=[],g=12*Z,top=72*Z;
    if(t){const my=cl(t.t+t.h/2-h/2,m,lim-h-m),mx=cl(t.l+t.w/2-w/2,m,vw-w-m);c.push([t.r+g,my],[t.l-g-w,my],[mx,t.b+g],[mx,t.t-g-h]);}
    c.push([vw-w-g,lim-h-g],[vw-w-g,top],[g,lim-h-g],[g,top]);
    const ok=c.find(([x,y])=>x>=m&&y>=m&&x+w<=vw-m&&y+h<=lim-m&&!hit(x,y,w,h));
    if(ok){b.style.left=px(ok[0]);b.style.top=px(ok[1]);return;}}
  // phones (and anything that didn't fit): dock across the screen, below or above the target, always above the pads
  b.classList.add('gddock');b.style.width='';b.style.left='';b.style.right='';let h=b.getBoundingClientRect().height;const e=6*Z;
  const regs=t&&!big?[[t.b+e,lim-e],[e,t.t-e]]:[[e,lim-e]];
  let r=regs.find(([a,z])=>z-a>=h);
  if(!r){r=regs.slice().sort((x,y)=>(y[1]-y[0])-(x[1]-x[0]))[0];if(r[1]-r[0]<h){b.classList.add('compact');h=b.getBoundingClientRect().height;if(r[1]-r[0]<h){const mh=Math.max(64*Z,r[1]-r[0]);b.style.maxHeight=px(mh);h=mh;}}}
  const below=r===regs[0];b.style.top=px(below?Math.max(r[0],r[1]-h):r[0]);}
function gdSimRun(o={}){/* test only: a real run through the engine (simulate), fast */return (async()=>{if(o.open!==false&&!gdPracOpen())guideGo('practice',{id:gdLesson()});bpm=Math.min(300,Math.max(bpm,o.bpm||240));$('#bpmv').textContent=bpm;await simulate(0,'ok');})();}

/* ---------- Show me (a one-step tour on the real screen) ---------- */
function gdShowMe(id){const h=gdHowOf(id);if(!h||!h.show)return false;closeSheets();
  return gdStart(null,{tour:{id:'show:'+id,adhoc:true,t:'Show me',steps:[{k:'look',at:h.show.at,el:h.show.el,t:h.show.t,how:null}]}});}

/* ---------- "?" page help ---------- */
function gdHelp(){if(run){toast('Help opens after the run');return null;}const pk=gdPage(),pg=GD_PAGES[pk]||{t:NAVI[cur]?NAVI[cur][0]:'This page',what:'',tours:[],how:[]};
  const trs=(pg.tours||[]).map(gdTour).filter(Boolean),hw=(pg.how||[]).map(gdHowOf).filter(Boolean);
  const words=(pg.words||[]).map(w=>typeof QL_TERMS!=='undefined'&&QL_TERMS.find(x=>x[0]===w)).filter(x=>x&&typeof qlCardOf==='function'&&qlCardOf(x[2]));
  const m=openSheet('Help · '+esc(pg.t),`<div class="gdhelp"><div class="note-k">What’s here</div><p class="gdwhat">${esc(pg.what)}</p>
   ${trs.map(t=>{const r=gdS().tours[t.id];return `<button class="gdtour" data-gd="${r&&!r.done&&r.step>0?'resume':'start'}:${t.id}">${icon('play',16)}<span><b>${r&&!r.done&&r.step>0?'Resume':'Take the tour'}</b> · ${esc(t.t)} · ${gdPl(t.steps.length,'step')}${r&&r.done?' ✓':''}</span></button>`;}).join('')}
   ${hw.length?`<div class="note-k" style="margin-top:12px">How it works</div><div class="list">${hw.map(h=>`<div class="lrow" data-gd="how:${h.id}"><span style="flex:1">${esc(h.t)}</span><span>›</span></div>`).join('')}</div>`:''}
   ${words.length?`<div class="gdwords"><span class="mut">Words here:</span> ${words.map(x=>`<button class="sm ghost" data-ql="${esc(x[2])}">${esc(x[0])} ${icon('info',14)}</button>`).join('')}</div>`:''}
   <div class="row" style="margin-top:12px"><button class="sm" data-gd="hub">All of the Guide ›</button></div></div>`);
  m.classList.add('gdsheet');return m;}

/* ---------- How it works sheet ---------- */
function gdHowHtml(h){let mine='';try{mine=h.mine();}catch(e){mine='<span class="mut">Not available here.</span>';}
  return `<div class="gdhw"><div class="note-k">In one line</div><p class="gdline">${gdTxt(h.line)}</p>${gdTxt(h.dg)||''}
   <div class="note-k">Step by step</div><ol class="gdol">${gdTxt(h.steps).map(x=>`<li>${x}</li>`).join('')}</ol>
   <div class="note-k">With your numbers</div><div class="gdmine">${mine}</div>
   ${h.rem?`<div class="threm"><span class="note-k">Remember</span><span>${esc(h.rem)}</span></div>`:''}
   <div class="row" style="margin-top:10px">${h.show?`<button class="sm pri" data-gd="show:${h.id}">Show me ›</button>`:''}${(h.rel||[]).map(gdHowOf).filter(Boolean).map(r=>`<button class="sm ghost" data-gd="how:${r.id}">${esc(r.t)} ›</button>`).join('')}</div>
   <p class="mut gdsrc">Checked against v${GD_CHECKED} · ${esc(h.src)}</p></div>`;}
function gdHow(id){const h=gdHowOf(id);if(!h)return null;closeSheets();const m=openSheet('How it works · '+esc(h.t),gdHowHtml(h));m.classList.add('gdsheet');return m;}

/* ---------- More › Guide ---------- */
const gdNewOn=()=>gdS().seenVer<APP.v&&GD_NEW.some(x=>x.v===APP.v);
function gdMoreTile(){return `<button class="mtile" data-gd="hub">${icon('guide')}<b>Guide${gdNewOn()?' <span class="chip ms gdnew">New</span>':''}</b><span>Tours, how it works, what’s new</span></button>`;}
function gdTourRow(t){const r=gdS().tours[t.id],res=r&&!r.done&&r.step>0;
  return `<div class="lrow gdrow"><span class="gdnum">${t.n||'★'}</span><span class="gdrt"><b>${esc(t.t)}</b><span class="mut"> · ${esc(t.sub)}</span><span class="mut gdrs">${gdPl(t.steps.length,'step')} · starts: ${esc(t.from)}${t.kit?' · at the kit too':''}</span></span>
   <button class="sm ${res?'pri':r&&r.done?'ghost':''}" data-gd="${res?'resume':'start'}:${t.id}">${res?'Resume · step '+(r.step+1)+' of '+t.steps.length:r&&r.done?'Again ✓':'Start'}</button></div>`;}
function renderGuide(){const tab=VP.guide.tab||'tours',g=gdS(),nw=GD_NEW.find(x=>x.v===APP.v);
  const areas=[...new Set(GD_HOW.map(h=>h.area))];
  view.innerHTML=`<h1>Guide</h1><p class="sub">How DrumPath works, on the screen you’re on. Tap <b>?</b> on any page for help on that page.</p>
   ${gdNewOn()&&nw?`<div class="card gdnewc"><div class="note-k" style="color:var(--accent)">New in v${nw.v}</div><b>${esc(nw.items[0])}</b><div class="row" style="margin-top:8px"><button class="sm pri" data-gd="start:${nw.tour}">What’s new · ${gdPl(gdTour(nw.tour).steps.length,'step')}</button><button class="sm ghost" data-gd="newoff">Not now</button></div></div>`:''}
   <div class="seg gdtabs" role="group" aria-label="Guide"><button class="${tab==='tours'?'on':''}" data-gd="tab:tours">Tours</button><button class="${tab==='how'?'on':''}" data-gd="tab:how">How it works</button><button class="${tab==='new'?'on':''}" data-gd="tab:new">What’s new</button></div>
   ${tab==='tours'?`<div class="list gdtours">${GD_TOURS.filter(t=>!t.whatsnew).map(gdTourRow).join('')}</div><p class="mut gdmore">More tours (Progress, Songs, Theory, Reflection, your data…) come in the next Guide steps.</p>`:''}
   ${tab==='how'?areas.map(a=>`<h2>${esc(a)}</h2><div class="list">${GD_HOW.filter(h=>h.area===a).map(h=>`<div class="lrow" data-gd="how:${h.id}"><span style="flex:1;min-width:0"><b>${esc(h.t)}</b><span class="mut gdrs">${gdTxt(h.line)}</span></span><span>›</span></div>`).join('')}</div>`).join('')+'<p class="mut gdmore">More pages (dynamics, readiness, the streak, badges, the save log…) come in the next Guide step.</p>':''}
   ${tab==='new'?GD_NEW.map(x=>`<div class="card"><div class="note-k">v${x.v} · ${esc(x.date)}</div><ul class="gdul">${x.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><button class="sm" data-gd="start:${x.tour}">Take the tour · ${gdPl(gdTour(x.tour).steps.length,'step')}</button></div>`).join(''):''}
   <h2>Hints</h2>${gdSettingsCard()}
   ${TEST?'<div class="card" style="margin-top:12px"><button class="sm" data-gdtest>Run guide tests</button><div id="gdtests"></div></div>':''}`;}
function gdSettingsCard(){const g=gdS();return `<div class="card row" id="gdset" style="align-items:center"><span style="flex:1;min-width:200px">Show hints <span class="mut" style="font-size:13px">(a small “New here? Tour” pill the first time you open a page; off by default)</span></span><div class="seg"><button class="${g.hints?'on':''}" data-gd="hints:1">On</button><button class="${g.hints?'':'on'}" data-gd="hints:0">Off</button></div><button class="sm ghost" data-gd="hub">Guide ›</button></div>`;}
/* hints pill (only when switched on): once per page, the first time it's opened */
function gdAfterRender(){const g=gdS(),pk=gdPage();const old=$('#view .gdpill');if(old)old.remove();
  if(!g.hints||GD.tour||gdPracOpen())return;const pg=GD_PAGES[pk],t=pg&&pg.tours&&pg.tours.map(gdTour).find(x=>x&&!(g.tours[x.id]||{}).done);if(!t)return;
  if(g.tips[pk]&&!GD.shown[pk])return;if(!g.tips[pk]){g.tips[pk]=Date.now();GD.shown[pk]=1;save();}
  view.insertAdjacentHTML('afterbegin',`<div class="gdpill"><span class="gddot"></span><span>New here?</span><button class="sm" data-gd="start:${t.id}">Tour · ${gdPl(t.steps.length,'step')}</button><button class="icon ghost" data-gd="pillx" aria-label="Dismiss">${icon('close',16)}</button></div>`);}
/* the kit remote while a tour is showing (21-atkit.js kpTarget): high tom = Next, rim = Back, kick + pedal = close; crash ×2 and floor tom work as usual */
function gdKp(k){if(!GD.tour||GD.paused||!$('#gdlay'))return null;if(k==='next')return {fn:gdNext,lab:'Tour › Next'};if(k==='again')return GD.i>0?{fn:gdBack,lab:'Tour › Back'}:null;if(k==='back')return {fn:gdClose,lab:'Tour › Close'};return null;}

/* ---------- events ---------- */
document.addEventListener('click',e=>{const T=e.target;let b;
  if((b=T.closest('[data-gdtest]'))){(async()=>{const el=$('#gdtests');el.innerHTML='Running…';const t=await gdTests();go('guide');const e2=$('#gdtests');if(e2)e2.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>Guide: ${t.filter(x=>x.pass).length}/${t.length} pass</b></div>`+t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');})();return;}
  if(!(b=T.closest('[data-gd]')))return;e.stopPropagation();const [a,x]=b.dataset.gd.split(':');
  if(a==='help'){gdHelp();return;}
  if(a==='hub'){closeSheets();if(gdPracOpen()&&!run)p1ClosePrac();go('guide',{tab:VP.guide.tab||'tours'});return;}
  if(a==='tab'){VP.guide.tab=x;render();return;}
  if(a==='start'||a==='resume'){gdStart(x,{resume:a==='resume'});return;}
  if(a==='next'){gdNext();return;}if(a==='back'){gdBack();return;}if(a==='x'){gdClose();return;}
  if(a==='end'){gdFinish(true);return;}
  if(a==='steps'){GD.list=!GD.list;gdTick();return;}
  if(a==='jump'){gdEnter(+x,{nav:true});return;}
  if(a==='there'){guideGo(gdRoute(gdStep().at));GD.sig='';gdEnter(GD.i,{nav:true});return;}
  if(a==='miss'){const s=gdStep();if(s.miss)s.miss.fn();GD.sig='';return;}
  if(a==='how'){gdHow(x);return;}
  if(a==='show'){gdShowMe(x);return;}
  if(a==='hints'){const g=gdS();g.hints=x==='1';g.hintsAt=Date.now();save();render();if(g.hints)toast('Hints on: a small pill on pages you haven’t opened yet');return;}
  if(a==='pillx'){gdS().tips[gdPage()]=gdS().tips[gdPage()]||Date.now();GD.shown[gdPage()]=0;save();const p=$('#view .gdpill');if(p)p.remove();return;}
  if(a==='newoff'){gdS().seenVer=APP.v;save();render();return;}
},true);

/* ---------- layout sweep views (RULES C8, called from 14-layout-check.js) ---------- */
async function gdSweep(out,wait){const keepG=JSON.stringify(state.guide);closeSheets();
  const pr=async(n,f,o)=>{try{await f();await wait();out.push([n,layoutAudit(o?o():view)]);}catch(e){out.push([n,[{kind:'error',what:e.message}]]);}};
  for(const tab of ['tours','how','new'])await pr('Guide · '+tab,()=>{gdS().seenVer=0;go('guide',{tab});});
  await pr('Guide · a tour to resume',()=>{gdS().tours.lesson={step:3,done:false,at:Date.now()};gdS().tours.welcome={step:0,done:true,at:Date.now()};go('guide',{tab:'tours'});});
  for(const h of GD_HOW)await pr('How it works · '+h.t,()=>gdHow(h.id),()=>document.querySelector('.modal'));
  closeSheets();
  for(const [n,f] of [['home',()=>go('home')],['time',()=>go('time')],['kit',()=>go('kit')],['settings',()=>go('settings')],['practice',()=>openPractice(LESSONS.find(l=>l.type==='play').id)]])
    await pr('Help · '+n,()=>{closeSheets();f();gdHelp();},()=>document.querySelector('.modal'));
  closeSheets();if(gdPracOpen())p1ClosePrac();
  await pr('Hints pill',()=>{const g=gdS();g.hints=true;delete g.tips.time;GD.shown={};go('time');});
  await pr('Tour bubble · home',async()=>{gdStart('welcome');await wait();gdTick();},()=>$('#gdlay'));
  await pr('Tour bubble · steps list',async()=>{GD.list=true;GD.sig='';gdTick();},()=>$('#gdlay'));
  await pr('Tour bubble · practice',async()=>{gdStart('prac',{step:2});await wait();gdTick();},()=>$('#gdlay'));
  gdStop();if(gdPracOpen())p1ClosePrac();state.guide=JSON.parse(keepG);gdFill(state);}

/* ---------- tests (?test=1 › More › Guide › Run guide tests; headless: tools/headless/guide.mjs) ---------- */
const gdWait=ms=>new Promise(r=>setTimeout(r,ms));
async function gdWaitFor(f,ms){const t0=Date.now();while(Date.now()-t0<ms){if(f())return true;await gdWait(60);}return f();}
function gdRect(e){const r=e.getBoundingClientRect();return r;}
const gdOverlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
// one row per step: the page it belongs to was reached and its target found, the bubble is on screen, off the pads, off its target
function gdCheckStep(){const s=gdStep(),lay=$('#gdlay'),b=lay&&$('.gdb',lay);GD.lastPlace='';gdTick();
  const here=gdHere(s.at),el=gdTarget(s),out={tour:GD.tour.id,i:GD.i,k:s.k,page:gdPage(),here,el:!!el,why:!el&&!!s.why,issues:[]};
  if(!b||!gdVisEl(b)){out.issues.push('no bubble');return out;}
  const br=gdRect(b),de=document.documentElement,W=de.clientWidth,H=de.clientHeight,Z=parseFloat(getComputedStyle(de).zoom)||1;
  if(br.left<-1||br.top<-1||br.right>W+1||br.bottom>H+1)out.issues.push('bubble off screen '+[br.left,br.top,br.right,br.bottom].map(Math.round));
  const pe=gdPracOpen()&&$('#pads');if(pe&&gdVisEl(pe)&&gdOverlap(br,gdRect(pe))>1)out.issues.push('bubble over the pads');
  if(el){const tr=gdRect(el);if(tr.bottom<0||tr.top>H||tr.right<0||tr.left>W)out.issues.push('target off screen');
    const big=tr.height+12>((pe&&gdVisEl(pe)?gdRect(pe).top:H)*0.55);if(!big&&gdOverlap(br,tr)>tr.width*tr.height*0.15)out.issues.push('bubble covers its target');}
  const la=layoutAudit(b);if(la.length)out.issues.push(...la.map(i=>i.kind+' '+i.what));
  return out;}
async function gdWalk(id,o={}){const t=gdTour(id),rows=[];gdStart(id,{step:0});await gdWait(o.wait||160);
  for(let i=0;i<t.steps.length;i++){if(i>0){const p=t.steps[i-1];
      if(p.k==='do'&&p.sim){await p.sim();const ok=await gdWaitFor(()=>GD.i===i||!GD.tour,o.runMs||25000);if(!ok||GD.i!==i)gdEnter(i,{nav:true});}
      else gdNext();await gdWait(o.wait||160);}
    if(!GD.tour)break;if(document.querySelector('.modal')){closeSheets();await gdWait(60);}rows.push(gdCheckStep());}
  gdStop();return rows;}
async function gdWalkAll(o={}){const keep=testSnap(),keepR=JSON.stringify(state.remote),kf=KP.fakeKit,keepG=JSON.stringify(state.guide),keepB=bpm,out=[];KP.fakeKit=true;SES=null;closeSheets();
  if(gdPracOpen())p1ClosePrac();go('home');
  for(const t of GD_TOURS){try{if(t.id==='result'){guideGo('practice',{id:gdLesson()});await gdSimRun();await gdWaitFor(()=>gdPage()==='result',o.runMs||25000);}const rs=await gdWalk(t.id,o);out.push(...rs);}catch(e){out.push({tour:t.id,i:-1,issues:['error '+e.message]});}
    if(gdPracOpen()&&!run)p1ClosePrac();closeSheets();}
  gdStop();if(gdPracOpen())p1ClosePrac();testRestore(keep);state.remote=JSON.parse(keepR);KP.fakeKit=kf;state.guide=JSON.parse(keepG);gdFill(state);bpm=keepB;go('home');return out;}
async function gdTests(){const R=[],T=(name,pass,det)=>R.push({name,pass:!!pass,det:det==null?'':String(det)});
  const keep=testSnap(),keepG=JSON.stringify(state.guide),keepR=JSON.stringify(state.remote),kf=KP.fakeKit,nS=state.sessions.length,keepCur=cur,keepB=bpm;
  try{
    {const s={};gdFill(s);T('Back-fill: an old backup gets state.guide (hints off)',s.guide&&s.guide.tours&&s.guide.tips&&s.guide.hints===false&&s.guide.seenVer===0);
     const o=normaliseState({v:1,prog:{},sessions:[],savedAt:1});T('normaliseState back-fills it too',o.guide&&o.guide.hints===false);
     const b={guide:{tours:{a:{at:'x'},b:{step:'2',at:5}},tips:{p:'q',h:3},hints:'yes',seenVer:-1}};gdFill(b);T('Back-fill drops broken entries',!b.guide.tours.a&&b.guide.tours.b.step===2&&!b.guide.tips.p&&b.guide.tips.h===3&&b.guide.hints===false&&b.guide.seenVer===0);
     const m=gdMerge({tours:{a:{step:2,at:10},b:{step:0,done:true,at:5}},tips:{home:9},hints:true,hintsAt:20,seenVer:36},{tours:{a:{step:4,at:20},b:{step:3,at:30}},tips:{home:4,time:7},hints:false,hintsAt:10,seenVer:35});
     T('Merge: newest place per tour, a finished tour stays ✓',m.tours.a.step===4&&m.tours.b.step===3&&m.tours.b.done===true,JSON.stringify(m.tours));
     T('Merge: tips union with the earliest time, the later hints switch, seenVer max',m.tips.home===4&&m.tips.time===7&&m.hints===true&&m.seenVer===36);
     const ms=mergeStates(normaliseState({v:1,savedAt:1,guide:{tours:{welcome:{step:0,done:true,at:3}}}}),normaliseState({v:1,savedAt:2}));T('mergeStates carries state.guide',ms.guide&&ms.guide.tours.welcome&&ms.guide.tours.welcome.done);
     T('Drive sync sees a guide-only change',!sameData(normaliseState({v:1,guide:{hints:true,hintsAt:1}}),normaliseState({v:1})));}
    // routes
    const routes=[['home'],['practise'],['lessons'],['lesson',{id:gdLesson()}],['practice',{id:gdLesson()}],['progress'],['songs'],['time'],['kit'],['settings'],['guide',{tab:'how'}],['theory'],['reflect'],['library']];
    const bad=[];for(const [v,p] of routes){guideGo(v,p);await gdWait(30);if(!gdHere(Object.assign({v},p||{})))bad.push(v+'→'+gdPage());}if(gdPracOpen())p1ClosePrac();
    T('guideGo() reaches every page a tour or How page uses',!bad.length,bad.join(', '));
    T('guideGo() refuses pages that only a run can open',guideGo('result')===false&&guideGo('timeresult')===false);
    // links
    const lk=[];GD_TOURS.forEach(t=>t.steps.forEach((s,i)=>{if(s.how&&!gdHowOf(s.how))lk.push(t.id+'#'+(i+1)+' how:'+s.how);}));GD_HOW.forEach(h=>(h.rel||[]).forEach(r=>{if(!gdHowOf(r))lk.push(h.id+' rel:'+r);}));
    Object.entries(GD_PAGES).forEach(([k,p])=>{(p.tours||[]).forEach(x=>{if(!gdTour(x))lk.push(k+' tour:'+x);});(p.how||[]).forEach(x=>{if(!gdHowOf(x))lk.push(k+' how:'+x);});});
    T('Every “How this works”, related and page-help link resolves',!lk.length,lk.join(', '));
    {const bs=[];for(const h of GD_HOW){gdShowMe(h.id);await gdWait(180);gdTick();if(!(gdHere(gdStep().at)&&gdTarget(gdStep())))bs.push(h.id+'@'+gdPage());gdStop();if(gdPracOpen())p1ClosePrac();}T('Every “Show me ›” opens its screen with the element lit',!bs.length,bs.join(', '));}
    T('G1 set: tours 1–5, 10, 11 + What’s new; six How pages',['welcome','today','lesson','prac','result','time','atkit','new36'].every(gdTour)&&['scoring','pass','today','gap','kitremote','data'].every(gdHowOf));
    T('Every prompt is short (≤ 3 lines on a phone: ≤ 175 characters)',GD_TOURS.every(t=>t.steps.every(s=>String(gdTxt(s.t)).replace(/<[^>]+>/g,'').length<=175)),GD_TOURS.flatMap(t=>t.steps.map(s=>String(gdTxt(s.t)).replace(/<[^>]+>/g,'').length)).sort((a,b)=>b-a)[0]);
    // How pages with fresh data
    {const fresh=testSnap();state.sessions=[];state.prog={};state.theory={cards:{},review:{},bookmarks:[],lastCard:null};thFill(state);
     const bh=[];GD_HOW.forEach(h=>{const x=gdHowHtml(h);if(/undefined|NaN|null/.test(x.replace(/data-[a-z]+="[^"]*"/g,'')))bh.push(h.id);});T('How pages: live numbers work with empty data',!bh.length,bh.join(', '));
     state.sessions.push({ts:Date.now()-864e5,id:gdLesson(),ex:0,bpm:60,score:69,on:11,n:16,ext:0,miss:0,avg:-8});T('…and with an old run that has totals only (RULES A4)',/11 of 16 on time = <b>69 %/.test(gdHowHtml(gdHowOf('scoring'))),gdHowOf('scoring').mine());
     testRestore(fresh);state.sessions=state.sessions.slice(0,nS);}
    // help sheets
    {const hb=[];for(const [n,f] of [['home',()=>go('home')],['time',()=>go('time')],['kit',()=>go('kit')],['practice',()=>openPractice(gdLesson())]]){closeSheets();f();const m=gdHelp();if(!m||!m.querySelector('[data-gd^="start:"],[data-gd^="resume:"]'))hb.push(n);}closeSheets();if(gdPracOpen())p1ClosePrac();
     T('“?” lists the page’s tour and How pages (Home, Time feel, Kit, practice screen)',!hb.length,hb.join(', '));}
    T('“?” is in the header and on the practice screen',!!$('#helpbtn[data-gd="help"]')&&!!$('#prac .ptop [data-gd="help"]'));
    // player
    go('home');gdStart('welcome');await gdWait(120);gdTick();T('A tour opens a bubble and lights its target',gdVisEl($('#gdlay .gdb'))&&$('#gdlay .gdspot').style.display!=='none');
    T('Bubble: step 1 of 8, no Back on step 1',/step 1 of 8/.test($('#gdlay').textContent)&&!$('#gdlay [data-gd="back"]'));
    gdNext();gdNext();await gdWait(60);T('Next moves on; Back goes back',GD.i===2&&(gdBack(),GD.i===1));
    GD.list=true;GD.sig='';gdTick();$('#gdlay [data-gd="jump:5"]').click();await gdWait(60);T('Steps ☰ jumps to any step',GD.i===5);
    gdClose();T('✕ keeps your place',gdS().tours.welcome&&gdS().tours.welcome.step===5&&!gdS().tours.welcome.done&&!$('#gdlay'));
    go('guide',{tab:'tours'});T('The Guide shows Resume · step 6 of 8',/Resume · step 6 of 8/.test(view.textContent));
    view.querySelector('[data-gd="resume:welcome"]').click();await gdWait(60);T('Resume continues there',GD.tour&&GD.tour.id==='welcome'&&GD.i===5);
    gdEnter(7,{nav:true});gdNext();T('Done on the last step marks the tour ✓',gdS().tours.welcome.done&&!GD.tour);
    go('guide',{tab:'tours'});T('…and the Guide shows it',/Again ✓/.test(view.querySelector('.gdtours').textContent));
    gdStart('welcome');await gdWait(60);gdNext();history.back();await gdWait(200);T('Android Back = previous step while a tour is open',GD.tour&&GD.i===0,GD.i);gdClose();await gdWait(150);
    // missing target, other page
    p1Dev('planMode','go');go('home');gdStart('today',{step:2});await gdWait(120);gdTick();T('Missing target: the bubble says why and offers Skip',/At the kit<\/b> mode/.test($('#gdlay').innerHTML)&&/Skip ›/.test($('#gdlay').textContent));
    gdClose();go('progress');gdStart('today',{step:3});guideGo('progress');GD.sig='';await gdWait(60);gdTick();T('On the wrong page: “Take me there ›” goes there',/Take me there/.test($('#gdlay').textContent)&&($('#gdlay [data-gd="there"]').click(),gdHere('home')));gdClose();
    // Do it: waits for the tap
    go('home');p1Dev('planMode','go');gdStart('today',{step:1});await gdWait(120);gdTick();const w0=GD.i;await gdWait(400);gdTick();T('“Do it” waits (no Next until you tap or 10 s)',GD.i===w0&&!$('#gdlay [data-gd="next"]'));
    $('#p1today [data-p1mode="kit"]').click();await gdWait(300);T('…and moves on when you tap the lit thing',GD.i===w0+1,GD.i);
    GD.t0-=11000;gdEnter(1,{nav:true});GD.t0-=11000;GD.sig='';gdTick();T('“Skip this” shows after 10 s',/Skip this/.test($('#gdlay').textContent));gdClose();
    // a tour run is a real run; pauses during the run; testing note
    {const n0=state.sessions.length,id=gdLesson();gdStart('lesson',{step:5});await gdWait(150);gdTick();const note=/Testing mode: this run isn’t saved/.test($('#gdlay').textContent);
     const p=gdSimRun();await gdWait(400);const paused=$('#gdlay').classList.contains('hidden')&&!!run;await p;await gdWaitFor(()=>GD.i===6,25000);
     const s=state.sessions[state.sessions.length-1];T('A run started in a tour is a real run (scored, in the log)',state.sessions.length===n0+1&&s.id===id&&s.n>0,s&&s.id+' '+s.score+'%');
     T('The tour pauses during the run and comes back on the result',paused&&GD.i===6&&gdPage()==='result'&&gdVisEl($('#gdlay .gdb')));
     T('The bubble says so (testing mode: “isn’t saved”)',note);
     gdNext();await gdWait(60);gdTick();const pe=$('#pads'),br=gdRect($('#gdlay .gdb'));T('The bubble never covers the pads',!gdVisEl(pe)||gdOverlap(br,gdRect(pe))<=1);gdClose();p1ClosePrac();}
    // testing mode saves nothing
    {const r0=typeof STORE!=='undefined'?STORE.rev:0,w0=typeof STORE!=='undefined'?STORE.writes||0:0;gdStart('welcome');gdNext();gdClose();gdS().hints=true;save();gdS().hints=false;
     T('Testing mode: tours and hints change memory only, nothing is written',SANDBOX&&(typeof STORE==='undefined'||(STORE.rev===r0&&(STORE.writes||0)===w0)),'rev '+r0+' → '+(typeof STORE!=='undefined'?STORE.rev:'-'));}
    // kit remote drives the tour
    {KP.fakeKit=true;state.remote.on=true;[['start',[49]],['again',[37]],['next',[48]],['slower',[43]],['back',[36,44]]].forEach(([k,n])=>{state.remote.map[k]={n,at:1};});KP.quiet=0;KP.cool=0;go('home');gdStart('welcome');await gdWait(120);gdTick();
     const fire=k=>{KP.cool=0;kpFire(k,performance.now());};fire('next');T('Kit: high tom = Next',GD.i===1);fire('again');T('Kit: rim click = Back',GD.i===0);
     fire('next');fire('start');T('Kit: crash ×2 still does its own job (here: Start session)',GD.tour&&GD.i===1&&!!SES,SES&&SES.slot);SES=null;if(gdPracOpen())p1ClosePrac();closeSheets();go('home');GD.sig='';gdTick();
     T('Kit legend in the bubble',/High tom|Tom 1|Next/.test(($('#gdlay .gdkit')||{}).textContent||''),($('#gdlay .gdkit')||{}).textContent);
     fire('back');T('Kit: kick + pedal together closes the tour',!GD.tour);
     KP.fakeKit=kf;state.remote=JSON.parse(keepR);}
    // hints
    {const g=gdS();g.hints=false;g.tips={};GD.shown={};go('time');T('Hints are off by default: no pill',!$('#view .gdpill'));
     g.hints=true;go('time');T('Hints on: a “New here? Tour” pill the first time',!!$('#view .gdpill')&&/Tour · 5 steps/.test($('#view .gdpill').textContent));
     $('#view [data-gd="pillx"]').click();go('time');T('✕ dismisses it for good',!$('#view .gdpill')&&g.tips.time>0);GD.shown={};go('home');go('time');T('…and it doesn’t come back',!$('#view .gdpill'));g.hints=false;}
    // what's new
    {const g=gdS();g.seenVer=0;openMore();T('What’s new: “New” on More › Guide after an update',/New/.test($('#msheet [data-gd="hub"]').textContent));closeMore();go('guide');T('…and a card in the Guide',/New in v36/.test(view.textContent));
     view.querySelector('[data-gd="newoff"]').click();T('Not now: offered once only',g.seenVer===APP.v&&!/New in v36/.test(view.textContent));
     g.seenVer=0;gdStart('new36');T('Taking the tour also marks it seen',g.seenVer===36);gdClose();}
    // walk every step at this size
    {const rows=await gdWalkAll({runMs:25000});const bad=rows.filter(r=>r.issues.length||!r.here||!(r.el||r.why));
     T('Every tour step: its page and target, at '+innerWidth+'×'+innerHeight+(document.documentElement.classList.contains('atkit')?' (at-the-kit view)':''),!bad.length&&rows.length===GD_TOURS.reduce((a,t)=>a+t.steps.length,0),bad.slice(0,4).map(r=>r.tour+'#'+(r.i+1)+' '+r.page+(r.here?'':' not-here')+(r.el?'':' no-target')+' '+r.issues.join(';')).join(' | ')||rows.length+' steps');}
  }catch(e){T('No errors',false,e.stack||e.message);}
  gdStop();closeSheets();if(gdPracOpen()&&!run)p1ClosePrac();SES=null;testRestore(keep);state.sessions=state.sessions.slice(0,nS);state.guide=JSON.parse(keepG);gdFill(state);state.remote=JSON.parse(keepR);KP.fakeKit=kf;bpm=keepB;cur=keepCur;render();
  return R;}
