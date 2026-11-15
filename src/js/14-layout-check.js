/* DrumPath — layout check (?test=1 › Settings › Check layout, and the headless build check).
   Finds, on the current screen: text that overlaps other text, text cut off or spilling out of its box,
   and anything that makes the page wider than the screen (outside areas meant to scroll sideways). */
'use strict';
function layoutAudit(root,opt){
  opt=opt||{};root=root||document.body;const issues=[],W=document.documentElement.clientWidth;
  const vis=el=>{const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
  const scrollsX=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll')return p;}return null;};
  const name=el=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;const c=[...el.classList].slice(0,2).join('.');if(c)s+='.'+c;const t=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,28);return s+(t?' “'+t+'”':'');};
  // text boxes: one rect per text node line
  const boxes=[];const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  // clip each text box to every scrolling/clipping ancestor, so text scrolled out of sight doesn't count
  const clipTo=(el,r)=>{let L=r.left,T=r.top,R=r.right,B=r.bottom;for(let p=el;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);
      if(s.overflowX!=='visible'||s.overflowY!=='visible'){const q=p.getBoundingClientRect();L=Math.max(L,q.left);T=Math.max(T,q.top);R=Math.min(R,q.right);B=Math.min(B,q.bottom);}}
    return R-L>1&&B-T>1?{left:L,top:T,right:R,bottom:B}:null;};
  let n;while((n=tw.nextNode())){const el=n.parentElement;if(!el||!vis(el)||el.closest('svg,textarea,select,.pat,[data-layout-skip]'))continue;
    const rg=document.createRange();rg.selectNodeContents(n);for(const r0 of rg.getClientRects()){if(r0.width<2||r0.height<2)continue;const r=clipTo(el,r0);if(r)boxes.push({el,r,clip:scrollsX(el)});}}
  // 1. text overlapping other text (different elements, not nested)
  const seen=new Set();
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;
    const x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
    if(x>2&&y>3){const pa=getComputedStyle(a.el).position,pb=getComputedStyle(b.el).position;if(pa==='fixed'||pb==='fixed'||pa==='sticky'||pb==='sticky')continue;
      const k=name(a.el)+'|'+name(b.el);if(!seen.has(k)){seen.add(k);issues.push({kind:'overlap',what:name(a.el)+'  ⟷  '+name(b.el)});}}}
  // 2. text spilling out of its own box (no wrapping, not ellipsised, not inside a sideways-scroll area)
  root.querySelectorAll('*').forEach(el=>{if(!vis(el)||el.closest('svg,textarea,select,input,.pat,[data-layout-skip]'))return;const s=getComputedStyle(el);
    if(![...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))return;
    if(el.scrollWidth>el.clientWidth+2&&s.overflowX==='visible'&&s.textOverflow!=='ellipsis'&&el.clientWidth>0&&s.display!=='inline')issues.push({kind:'spill',what:name(el)+' needs '+el.scrollWidth+'px, has '+el.clientWidth+'px'});});
  // 3. page wider than the screen
  if(document.documentElement.scrollWidth>W+1){const wide=[...root.querySelectorAll('*')].filter(el=>vis(el)&&!scrollsX(el)&&el.getBoundingClientRect().right>W+1&&getComputedStyle(el).position!=='fixed');
    const top=wide.filter(el=>!wide.some(o=>o!==el&&o.contains(el))).slice(0,4);issues.push({kind:'page-wider',what:'page is '+document.documentElement.scrollWidth+'px on a '+W+'px screen: '+top.map(name).join(', ')});}
  // 4. content cut off at the screen edge inside a card that doesn't scroll
  root.querySelectorAll('.card').forEach(c=>{if(!vis(c))return;const r=c.getBoundingClientRect();if(r.right>W+1&&!scrollsX(c))issues.push({kind:'cut',what:name(c)+' runs past the screen edge'});});
  // 5. (practice screen) anything that ends below the visible screen, outside areas meant to scroll
  if(opt.fit){const H=document.documentElement.clientHeight||innerHeight,low=[];
    const inScroller=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){if(p===root.parentElement)break;const s=getComputedStyle(p);if(['auto','scroll','hidden'].includes(s.overflowY)||['auto','scroll','hidden'].includes(s.overflowX))return true;}return false;};
    root.querySelectorAll('*').forEach(el=>{if(!vis(el)||el.closest('svg')||inScroller(el))return;const r=el.getBoundingClientRect();if(r.bottom>H+1&&!low.some(o=>o.contains(el)))low.push(el);});
    low.slice(0,4).forEach(el=>issues.push({kind:'below-screen',what:name(el)+' ends at '+Math.round(el.getBoundingClientRect().bottom)+'px on a '+H+'px-high screen'}));}
  return issues;
}
function layoutReport(){const is=layoutAudit(view);const box=openSheet('Layout check',is.length?`<p class="mut">${is.length} problem${is.length===1?'':'s'} on this screen at ${innerWidth}×${innerHeight}:</p>${is.map(i=>`<div style="font-size:13px;margin:4px 0"><b>${i.kind}</b> ${esc(i.what)}</div>`).join('')}`:`<p>No overlaps or cut-off text on this screen at ${innerWidth}×${innerHeight}. ✓</p>`);return is;}

// every screen on this device, at its current size and orientation
async function layoutSweep(){
  const keep={cur,vp:JSON.stringify({lessons:VP.lessons,songs:VP.songs,progress:VP.progress,theory:VP.theory})};const out=[];const wait=()=>new Promise(r=>setTimeout(r,120));const keepPM=typeof P1_MEM!=='undefined'?P1_MEM.planMode:undefined;
  const firstSong=allSongs()[0],lesson=LESSONS.find(l=>l.type==='play');
  const screens=[['Home',()=>go('home')],['Practise',()=>go('practise')],['Skill map',()=>go('lessons',{lv:null,sd:null,id:null})],['Level 3',()=>go('lessons',{lv:3,sd:null,id:null},{keep:true})],['Level 4',()=>go('lessons',{lv:4,sd:null,id:null},{keep:true})],
    ['A lesson',()=>openLesson(lesson.id)],['Progress',()=>go('progress')],['Songs',()=>go('songs',{view:'all',id:null})],['Song matrix',()=>go('songs',{view:'matrix',id:null})],
    ['A song',()=>go('songs',{id:firstSong.id})],['Compare',()=>go('compare')],['Studio',()=>go('studio')],['Library',()=>go('library')],['Theory',()=>thGo({mode:'home'})],['Theory part',()=>thGo({mode:'part',part:'A2'})],['Theory card · notation',()=>thGo({mode:'card',card:'A2.06.3'})],['Theory card · count',()=>thGo({mode:'card',card:'A1.08.4'})],['Theory card · key',()=>thGo({mode:'card',card:'A3.01.1'})],['Theory card · energy',()=>thGo({mode:'card',card:'A4.07.1'})],['Remember deck',()=>{TH_RV.list=[];thGo({mode:'review'});}],['Theory card · keyboard',()=>thGo({mode:'card',card:'A6.01.2'})],['Theory card · chord chart',()=>thGo({mode:'card',card:'A7.05.3'})],['Theory card · guitar neck',()=>thGo({mode:'card',card:'A5.06.3'})],['Theory card · listening',()=>thGo({mode:'card',card:'A9.03.1'})],['Progress · Theory',()=>go('progress',{mode:'theory'})],['Progress · Journal',()=>go('progress',{mode:'journal'})],
    ['Today · On the go',()=>{p1Dev('planMode','go');go('home');}],['Today · At the kit',()=>{p1Dev('planMode','kit');go('home');}],['Practise · At the kit',()=>go('practise')],['Ear game',()=>{EAR.qs=[];go('today',{mode:'ear'});}],['Ear game · answered',()=>{EAR.qs.forEach((q,i)=>{EAR.ans[i]=i%2?q.c:(q.c+1)%q.a.length;});render();}],['Free play',()=>go('today',{mode:'free'})],['Journal',()=>go('today',{mode:'journal'})],
    ['Session strip on a page',()=>{p1Dev('planMode','go');p1Start(1);p1ClosePrac();go('theory',null,{keep:true});}],['Kit',()=>go('kit')],['Settings',()=>go('settings')]];
  for(const [n,f] of screens){try{f();await wait();out.push([n,layoutAudit(view)]);}catch(e){out.push([n,[{kind:'error',what:e.message}]]);}}
  // header: everything in the brand row must stay on one line
  {const row=document.querySelector('.brand-row');const kids=row?[...row.children].filter(e=>e.offsetParent&&e.getBoundingClientRect().width>0):[];
   const tops=kids.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2;});const bad=tops.length&&Math.max(...tops)-Math.min(...tops)>8;
   out.push(['Header',bad?[{kind:'wrap',what:'header buttons wrap onto a second line'}]:[]]);}
  // practice screen in each view (Grid · Notation · Both), incl. a 12-bar chart and a tap-a-note explanation
  const keepNv=state.set.nview;
  for(const id of [lesson.id,'3.2.07','4.7.02'])for(const m of ['grid','notation','both']){if(!LBY[id])continue;
    try{openPractice(id);state.set.nview=m;notaRender(true);if(m!=='grid')notaSelect(3);draw();await wait();out.push(['Practice '+id+' · '+m,layoutAudit($('#prac'),{fit:1})]);notaSelect(null);}catch(e){out.push(['Practice '+id+' · '+m,[{kind:'error',what:e.message}]]);}}
  state.set.nview=keepNv;
  // theory panel on the practice screen: the list as a sheet (phones) and as the right-hand rail (tablet landscape)
  try{openPractice(lesson.id);if(typeof thPanelSheet==='function'){closeSheets();thPanelSheet();await wait();const m=document.querySelector('.modal');out.push(['Practice · theory sheet',m?layoutAudit(m):[]]);closeSheets();TH_P.open=true;thPanelSync();await wait();out.push(['Practice · theory '+(thWide()?'rail':'chip'),layoutAudit($('#prac'),{fit:1})]);TH_P.open=false;thPanelSync();}}catch(e){out.push(['Practice · theory panel',[{kind:'error',what:e.message}]]);}
  // P1: a tap drill on the screen pads, the session strip and a session result on the practice screen
  try{const pl=p1Plan('go',p1Mins()),ti=pl.items.findIndex(x=>x.k==='tap');if(ti>=0){SES={slot:'go',day:p1Day(),i:ti,runs:0,mixI:0};p1OpenTap(pl.items[ti]);await wait();out.push(['Practice · tap drill + session strip',layoutAudit($('#prac'),{fit:1})]);
     showResult('<div class="row"><div class="score">87%</div></div>'+p1NextBox());await wait();out.push(['Practice · session result',layoutAudit($('#prac'),{fit:1})]);}}catch(e){out.push(['Practice · tap drill',[{kind:'error',what:e.message}]]);}
  // P1b: the Quick-look sheet over every Today item kind, the primer, the ear game with a peek, Revise, the glossary
  if(typeof qlOpen==='function'){const wait2=()=>new Promise(r=>setTimeout(r,90));SES=null;$('#prac').classList.add('hidden');L=null;go('home');
    const ms=LESSONS.filter(l=>l.type==='play'),chk=LESSONS.find(l=>l.type!=='play'&&!l.later&&qlLessonRefs(l.id).length),tapS=p1TapSpec(),song=allSongs()[0],cid=(TH_ORDER.find(k=>k.rem)||TH_ORDER[0]).id;
    const kinds=[['card',{k:'card',card:TH_ORDER[0].id}],['tap',tapS?{k:'tap',src:tapS.src}:null],['ear',{k:'ear'}],['warm',{k:'warm',id:'2.3.01'}],['lesson',chk?{k:'lesson',id:chk.id}:null],['focus',{k:'focus',id:ms[0].id}],
      ['review',{k:'review',id:'2.3.02'}],['mix',{k:'mix',ids:['2.3.01','2.3.02','2.3.03']}],['song',song?{k:'song',song:song.id}:null]];
    for(const [n,it] of kinds){if(!it)continue;try{closeSheets();const m=qlOpen(qlItemRefs(it).join(','));await wait2();out.push(['Quick look · '+n,m?layoutAudit(m):[{kind:'error',what:'no sheet for '+n}]]);}catch(e){out.push(['Quick look · '+n,[{kind:'error',what:e.message}]]);}}
    for(const n of ['deck','revise']){try{closeSheets();const m=qlOpenList(n,[cid,TH_ORDER[1].id]);await wait2();out.push(['Quick look · '+n+' list',m?layoutAudit(m):[]]);}catch(e){out.push(['Quick look · '+n,[{kind:'error',what:e.message}]]);}}
    try{closeSheets();const m=qlOpen('swing');m.querySelector('[data-qlused]').click();await wait2();out.push(['Quick look · used in',layoutAudit(m)]);}catch(e){out.push(['Quick look · used in',[{kind:'error',what:e.message}]]);}
    try{closeSheets();const m=qlPrimer('A1.06.1');await wait2();out.push(['Primer sheet',layoutAudit(m)]);}catch(e){out.push(['Primer sheet',[{kind:'error',what:e.message}]]);}
    try{closeSheets();openPractice(lesson.id);closeSheets();const m=qlOpen(qlPracRefs().join(','));await wait2();out.push(['Quick look over the practice screen',m?layoutAudit(m):[]]);closeSheets();$('#prac').classList.add('hidden');L=null;}catch(e){out.push(['Quick look · practice',[{kind:'error',what:e.message}]]);}
    const keepRv=JSON.stringify(P1D().revise);
    try{closeSheets();EAR.qs=[];p1EarNew(7);if(!EAR.qs.some(q=>q.peek)){const st=qlEarState();if(st.peek)EAR.qs.push(Object.assign(p1EarQ(st.peek.k,p1Rnd(3)),{peek:true,card:st.peek.c,lab:st.peek.n}));}go('today',{mode:'ear'});await wait();out.push(['Ear game · with a peek',layoutAudit(view)]);
      EAR.qs.forEach((q,i)=>{EAR.ans[i]=i%2?q.c:(q.c+1)%q.a.length;});render();await wait();out.push(['Ear game · peek answered',layoutAudit(view)]);}catch(e){out.push(['Ear game · peek',[{kind:'error',what:e.message}]]);}
    try{P1D().revise[p1Day()]=[cid,'B2.04.1'];go('today',{mode:'revise'});await wait();out.push(['Revise',layoutAudit(view)]);}catch(e){out.push(['Revise',[{kind:'error',what:e.message}]]);}
    P1D().revise=JSON.parse(keepRv);
    try{thGo({mode:'glossary'});await wait();out.push(['A–Z glossary',layoutAudit(view)]);}catch(e){out.push(['A–Z glossary',[{kind:'error',what:e.message}]]);}
    closeSheets();EAR.qs=[];}
  // P2: the kit remote (legend, waiting for a first hit, hints on Today / the session strip / sheets, the Kit card while learning)
  if(typeof kpKitCard==='function'){const kr=JSON.stringify(state.remote),kf=KP.fakeKit,wait3=()=>new Promise(r=>setTimeout(r,90));KP.fakeKit=true;SES=null;closeSheets();
    state.remote.on=true;[['start',[49]],['again',[37]],['next',[48]],['slower',[43]],['back',[36,44]]].forEach(([k,n])=>{state.remote.map[k]={n,at:1};});
    const pr=async(n,f,o)=>{try{f();await wait3();out.push([n,layoutAudit(o?o():$('#prac'),o?undefined:{fit:1})]);}catch(e){out.push([n,[{kind:'error',what:e.message}]]);}};
    await pr('Practice · kit legend',()=>{openPractice(lesson.id);kpLegend();});
    await pr('Practice · kit legend on a result',()=>{showResult('<div class="row"><div class="score">91%</div></div><p class="mut">Run detail</p>');kpLegend();});
    await pr('Practice · tap-in waiting',()=>{$('#result').classList.add('hidden');KP.arm={mode:'tapin',at:performance.now(),taps:[],bpmNow:96};kpArmUi();});
    await pr('Practice · first-hit waiting',()=>{KP.arm={mode:'hit',at:performance.now(),taps:[]};kpArmUi();});
    kpDisarm();$('#prac').classList.add('hidden');L=null;
    await pr('Today · At the kit · kit hint',()=>{p1Dev('planMode','kit');go('home');},()=>view);
    await pr('Session strip · kit hint',()=>{p1Dev('planMode','go');p1Start(1);p1ClosePrac();closeSheets();go('theory',null,{keep:true});},()=>view);
    SES=null;await pr('Sheet · kit hint',()=>{closeSheets();openSheet('Quick look','<p>A short sheet.</p>');},()=>document.querySelector('.modal'));closeSheets();
    await pr('Kit · remote card learning',()=>{KP.learn={k:'back',notes:[],t0:0,miss:true};go('kit');},()=>view);KP.learn=null;
    state.remote=JSON.parse(kr);KP.fakeKit=kf;kpViewBtn();}
  SES=null;if(typeof p1PracSync==='function')p1PracSync();L=null;if(keepPM===undefined)delete P1_MEM.planMode;else P1_MEM.planMode=keepPM;
  $('#prac').classList.add('hidden');
  const v=JSON.parse(keep.vp);Object.assign(VP.lessons,v.lessons);Object.assign(VP.songs,v.songs);Object.assign(VP.progress,v.progress);if(v.theory)VP.theory=v.theory;go(keep.cur==='practise'?'settings':'settings');
  return out;
}
