/* DrumPath — Theory section (T2, D-030, build/theory-course-plan.md §9).
   Reader: Theory home (Continue, rings per tier, index by tier or thread, search, bookmarks, Remember deck),
   card view (one screen + More), diagrams v1, Hear it (kit synth + click, visual / spoken count, 1 e & a or takadimi),
   Try it (the normal engine, kind:'theory' runs: minutes + streak only), Check, statuses, review queue.
   Content lives in theory/*.js (DP_THEORY parts) and theory/concepts.js (concept → cards, lesson hand map).
   Theory never blocks a lesson and never changes lesson progress, readiness or status (D-028 f). */
'use strict';
const TH_PLAY=85;                       // Try it: score ≥ 85 % (and dynamics, if scored) → Can play
const TH_REV=[1,3,7,21,60];             // Remember deck: days until the next review, step by step (pedagogy P-2)
const TH_TIERS={A:['Foundation','≈ Grades Debut–3 · drum Levels 0–3'],B:['Intermediate','≈ Grades 4–5 · Levels 4–6'],C:['Advanced','≈ Grades 6–8 · Levels 7–9'],D:['Expert','beyond Grade 8 · Level 10 and on']};
const TH_THREADS={R:'Rhythm and reading',H:'Pitch and harmony',F:'Form and arrangement',G:'Groove, feel and styles',E:'Ear (listening)',B:'Band and performance'};
// the whole course (plan §3); parts not written yet show as “coming”
const TH_PLAN=[['A1','R','Sound, beat and time'],['A2','R','Reading rhythm 1'],['A3','R','The drum chart 1'],['A4','G','Groove basics'],['A5','H','Notes and the keyboard'],['A6','H','Major scale and keys'],['A7','H','First chords'],['A8','F','Song form 1'],['A9','E','Listening 1'],['A10','B','Playing with others 1'],
  ['B1','R','Reading rhythm 2'],['B2','R','Triplets and swing'],['B3','R','Meter 2'],['B4','R','The drum chart 2'],['B5','H','Minor keys and more scales'],['B6','H','Intervals'],['B7','H','Harmony and function'],['B8','H','7th chords'],['B9','F','Song form 2'],['B10','G','Styles 1'],['B11','E','Listening 2'],['B12','B','Playing with others 2'],
  ['C1','R','Odd meters'],['C2','R','Groupings and displacement'],['C3','R','Polyrhythm 1'],['C4','R','Advanced reading'],['C5','H','Modes'],['C6','H','Advanced harmony'],['C7','H','Modulation'],['C8','G','Jazz language'],['C9','G','Styles 2'],['C10','F','Arranging for drums'],['C11','E','Listening 3'],
  ['D1','R','Indian rhythm: konnakol compositions'],['D2','R','Metric modulation and tempo'],['D3','R','Polyrhythm 2 and polymeter'],['D4','F','Form analysis'],['D5','H','Chromatic and modern harmony'],['D6','B','Improvisation and soloing'],['D7','G','Groove science'],['D8','E','Producer’s ear']];
/* Tier A spoken count = TAKADIMI (each syllable names a position in the beat: “di” is always halfway), shown next to 1 e & a.
   Konnakol proper (tala, jathis, tihai) starts in Tier B. */
const TH_SYL={1:['ta'],2:['ta','di'],3:['ta','ki','da'],4:['ta','ka','di','mi'],6:['ta','va','ki','di','da','ma'],8:['ta','','ka','','di','','mi','']};
/* Konnakol syllables (TH_KON, thKonRun) live in theory/concepts.js so the part files can use them. */
// what the bottom row of a count grid says at step i: dg.syl = 'kon' (konnakol by beat), an array (one per step), else takadimi
function thSylAt(syl,mt,j,i){if(Array.isArray(syl))return syl[i%syl.length]||'';const grp=mt.groups[mt.beatOf[j]],g=grp[1]-grp[0];return((syl==='kon'?TH_KON:TH_SYL)[g]||[])[j-grp[0]]||'';}

/* ---------- content index ---------- */
const THP=(typeof DP_THEORY!=='undefined'?DP_THEORY:[]).slice().sort((a,b)=>TH_PLAN.findIndex(p=>p[0]===a.id)-TH_PLAN.findIndex(p=>p[0]===b.id));
const THC={},TH_ORDER=[];
THP.forEach(p=>p.ch.forEach(c=>c.cards.forEach((k,i)=>{Object.defineProperties(k,{part:{value:p,enumerable:false},chap:{value:c,enumerable:false}});k.i=i;k.n=TH_ORDER.length;THC[k.id]=k;TH_ORDER.push(k);})));
const thCon=()=>typeof DP_CONCEPTS!=='undefined'?DP_CONCEPTS:{};

/* ---------- clock (tests use a fake one) + statuses ---------- */
let thClock=null;const thNow=()=>thClock!=null?thClock:Date.now();
const DAY=864e5;
const TH_BL='https://aaditya-verma.github.io/backline/';
function thS(){return thFill(state).theory;}
function thSt(id){const c=thS().cards[id];return !c?'':c.p?'p':c.h?'h':c.u?'u':c.r?'r':'';}
const thKnown=id=>/[uph]/.test(thSt(id));
const TH_ST_LABEL={'':'New',r:'Read',u:'Understood',p:'Can play',h:'Can hear'};
function thChip(id){const s=thSt(id);return s==='p'?'<span class="chip ms">Can play</span>':s==='h'?'<span class="chip ms">Can hear</span>':s==='u'?'<span class="chip ms">Understood</span>':s==='r'?'<span class="chip ip">Read</span>':'<span class="chip">New</span>';}
function thMark(id,k,quiet){
  if(!THC[id])return false;const t=thS(),c=t.cards[id]||(t.cards[id]={});if(c[k])return false;
  c[k]=thNow();c.updatedAt=thNow();
  if(k==='r'&&THC[id].rem&&!t.review[id])t.review[id]={due:thNow()+TH_REV[0]*DAY,step:0,at:thNow()};
  if(!quiet)save();return true;
}
function thAddTime(ms){if(!(ms>0))return;const k=today();state.days[k]=(state.days[k]||0)+ms;}
/* review queue: Got it → next interval (1 → 3 → 7 → 21 → 60 days, then retired); Again → back to 1 day */
function thReview(id,ok){
  const t=thS(),r=t.review[id]||(t.review[id]={due:0,step:0,at:0});
  if(ok){r.step=(r.step||0)+1;if(r.step>=TH_REV.length){r.done=true;r.due=null;}else r.due=thNow()+TH_REV[r.step]*DAY;}
  else{r.step=0;r.done=false;r.due=thNow()+TH_REV[0]*DAY;}
  r.at=thNow();if(typeof p1Act==='function')p1Act();save();return r;   // a deck review keeps the gentle streak (P1)
}
function thDue(){const t=thS(),now=thNow();return Object.entries(t.review).filter(([id,r])=>THC[id]&&!r.done&&r.due!=null&&r.due<=now).sort((a,b)=>a[1].due-b[1].due).map(([id])=>id);}
function thContinue(){const t=thS();const lc=t.lastCard&&THC[t.lastCard];if(lc&&!thSt(lc.id))return lc;return TH_ORDER.find(k=>!thSt(k.id))||lc||TH_ORDER[0];}

/* ---------- concept tags (theory-brief §B): automatic from exercise data + hand map ---------- */
function thTagsOf(l){
  const out=new Set();if(!l)return out;const hand=(thCon()._lessons||{})[l.id];if(hand)hand.forEach(x=>out.add(x));
  (l.ex||[]).forEach(e=>{const v=e.v||{},all=Object.values(v).join(''),spb=e.steps||4*e.sub,lanes=Object.keys(v).filter(k=>/[^.]/.test(v[k]));
    if(e.sub===1)out.add('quarter');if(e.sub===2)out.add('eighth');if(e.sub===4)out.add('sixteenth');if(e.sub===3||e.sub===6)out.add('triplet');if(e.sub===8)out.add('roll32');
    if((e.swing||0.5)>0.5)out.add('swing');if(/X/.test(all))out.add('accent');if(/g/.test(all))out.add('ghost');if(/f/.test(all))out.add('flam');if(/d/.test(all))out.add('drag');
    if(/o/.test(v.HH||''))out.add('openhh');if(/r/.test(v.S||''))out.add('rim');if(e.st&&/[RL]/.test(e.st))out.add('sticking');
    if(/(6|12)\/8/.test(e.meter||''))out.add('compound');if(/3\/4/.test(e.meter||'')||(e.sub===2&&spb===6))out.add('meter34');
    if(e.click==='24')out.add('click24');if(e.labels)out.add('form');
    if(lanes.length===1&&/\./.test(all)&&e.sub<=4)out.add('rests');
    if(v.C&&v.C[0]==='x'&&(e.bars||1)>1)out.add('crash1');
    const S=v.S||'',hits=i=>S[i]&&S[i]!=='.';
    if(S&&(v.HH||v.R)&&v.K&&spb===4*e.sub&&hits(e.sub)&&hits(3*e.sub))out.add('backbeat');
    if((v.HH||v.R)&&v.K&&S)out.add('groove');
    if((e.bars||1)>1&&(v.T1||v.T2||v.T3||/fill/i.test(e.n||'')))out.add('fill');
    if(e.sub===2&&v.HH==='xxxxxxxx'&&v.K&&S)out.add('rockbeat');});
  return out;
}
// concept → the cards that teach it (only cards that exist now; later tiers fill in as they ship)
function thCardsFor(tag){return((thCon()[tag]||{}).cards||[]).filter(id=>THC[id]);}
function thLessonCards(id){const l=LBY[id];const tags=[...thTagsOf(l)];const seen=new Set(),out=[];tags.forEach(tg=>thCardsFor(tg).forEach(c=>{if(!seen.has(c)){seen.add(c);out.push(c);}}));
  ((THC&&TH_ORDER)||[]).forEach(k=>{if((k.links&&k.links.lessons||[]).includes(id)&&!seen.has(k.id)){seen.add(k.id);out.push(k.id);}});
  return out.sort((a,b)=>THC[a].n-THC[b].n);}
function thCardLessons(k){const out=new Set((k.links&&k.links.lessons)||[]);const tags=Object.entries(thCon()).filter(([tg,c])=>tg[0]!=='_'&&(c.cards||[]).includes(k.id)).map(x=>x[0]);
  if(tags.length)LESSONS.forEach(l=>{if(l.type!=='play')return;const t=thTagsOf(l);if(tags.some(x=>t.has(x)))out.add(l.id);});
  return [...out].filter(id=>LBY[id]).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));}
// lesson page: “New idea here” chips for unread cards (never blocks), ✓ chips for cards already read
function thLessonChips(id){
  const back=typeof TH_BACK!=='undefined'&&TH_BACK.lesson===id&&THC[TH_BACK.card]?`<button class="sm" data-thcard="${TH_BACK.card}">‹ Back to card: ${esc(THC[TH_BACK.card].t)}</button>`:'';
  const cs=thLessonCards(id);if(!cs.length&&!back)return '';const un=cs.filter(c=>!thSt(c)),rd=cs.filter(c=>thSt(c));
  return `<div class="thchips">${back}${un.slice(0,2).map(c=>`<button class="sm thnew" data-thcard="${c}">New idea here: ${esc(THC[c].t)} <span class="mut">· 2-min card</span></button>`).join('')}${rd.slice(0,4).map(c=>`<button class="sm ghost" data-thcard="${c}">✓ ${esc(THC[c].t)}</button>`).join('')}</div>`;
}
// Home: the Remember deck's due count and at most one theory nudge a day (same card all day; dismissable)
function thNudge(){
  const t=thS();if(t.nudgeOff===today()||!TH_ORDER.length)return null;
  let nx=null;try{nx=nextLesson();}catch(_){}
  const fromL=nx?thLessonCards(nx.id).find(c=>!thSt(c)):null;
  if(fromL)return{id:fromL,why:'New idea in '+nx.id+' '+nx.t};
  const c=thContinue();return c&&!thSt(c.id)?{id:c.id,why:'Next card in '+c.part.id+' '+c.part.t}:null;
}
function thHomeCard(){
  if(!TH_ORDER.length)return '';const due=thDue().length,n=thNudge();
  if(!due&&!n)return '';
  return `<div class="card thhome" style="margin-top:12px"><div class="note-k" style="color:var(--accent)">Theory</div>
    ${n?`<div class="row" style="flex-wrap:nowrap;align-items:center"><div style="flex:1;min-width:0"><b>${esc(THC[n.id].t)}</b><div class="mut" style="font-size:14px">${esc(n.why)} · 2-min card</div></div><button class="sm" data-thcard="${n.id}">Read</button><button class="sm ghost" data-thnudgeoff title="Not today">✕</button></div>`:''}
    ${due?`<div class="row" style="margin-top:${n?8:0}px;align-items:center"><span>Remember deck: <b>${due} due</b></span><span class="sp"></span><button class="sm pri" data-thgo='{"mode":"review"}'>Review</button></div>`:''}</div>`;
}

/* ---------- diagrams v1 ---------- */
const TH_LAY={};   // notation layouts on the card shown now (for the Hear-it playhead)
function thW(){const w=(view&&view.clientWidth)||360;return Math.max(260,Math.min(720,w-(w<600?34:70)));}
function thDiagram(k,dg,key){
  if(!dg)return '';
  try{const f=TH_DG[dg.type];if(!f)return '';return `<div class="thdg" data-thdg="${key||k.id}">${f(dg,key||k.id)}</div>`;}
  catch(e){return `<div class="thdg mut">Diagram can’t draw (${esc(e.message)})</div>`;}
}
const thSvg=(w,h,body,cls)=>`<svg class="thsvg ${cls||''}" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px" preserveAspectRatio="xMinYMid meet">${body}</svg>`;
const TH_DG={
  nt(dg,key){const W=thW(),zoom=W>=600?1.15:1;const lay=ntBuild(dg.ex,W/zoom,{noRepeat:!dg.repeat});TH_LAY[key]=lay;lay.zoom=zoom;
    return `<div class="thnt">${lay.svg.replace(/^<svg([^>]*?) width="(\d+)" height="(\d+)"/,(m,a,ww,hh)=>`<svg${a} width="${Math.ceil(ww*zoom)}" height="${Math.ceil(hh*zoom)}"`)}</div>`;},
  count(dg,key){ // count grid: Western count over takadimi syllables, notes as dots
    const ex=dg.ex,sub=ex.sub,spb=ex.steps||4*sub,bars=ex.bars||1,n=spb*bars,mts=ntMeters(ex),W=thW();
    const cw=Math.max(18,Math.min(54,(W-8)/n)),w=Math.ceil(cw*n+8),lanes=LANES.filter(v=>ex.v[v]&&/[^.]/.test(ex.v[v]));
    const kon=dg.kon!==false,rowN=26,rowD=rowN+Math.max(16,lanes.length*9+8),h=rowD+(kon?22:4);let s='';
    for(let i=0;i<n;i++){const b=Math.floor(i/spb),j=i%spb,x=4+i*cw,mt=mts[b],beat=j===mt.groups[mt.beatOf[j]][0];
      s+=`<rect class="thcell${beat?' beat':''}" data-st="${i}" x="${x+1}" y="2" width="${cw-2}" height="${h-4}" rx="5"/>`;
      if(j===0&&b>0)s+=`<line class="thbar" x1="${x}" x2="${x}" y1="0" y2="${h}"/>`;
      const word=(mt.full||mt.count)[j]||'';s+=`<text class="thcw${beat?' b':''}" x="${x+cw/2}" y="18">${esc(word)}</text>`;
      lanes.forEach((v,li)=>{const c=ex.v[v][i];if(!c||c==='.')return;const yy=rowN+6+li*9,r=c==='X'?4.6:c==='g'?2.4:3.4;
        s+=c==='o'?`<circle cx="${x+cw/2}" cy="${yy}" r="3.4" fill="none" stroke="${VOICES[v].c}" stroke-width="1.6"/>`:`<circle cx="${x+cw/2}" cy="${yy}" r="${r}" fill="${VOICES[v].c}"/>`;});
      if(kon){const syl=thSylAt(dg.syl,mt,j,i);s+=`<text class="thkw" x="${x+cw/2}" y="${h-8}">${esc(syl)}</text>`;}}
    if(lanes.length>1)s+='';
    return thSvg(w,h,s)+(lanes.length>1?`<div class="thleg">${lanes.map(v=>`<span><i style="background:${VOICES[v].c}"></i>${VOICES[v].n}</span>`).join('')}</div>`:'')+(kon?`<div class="thleg mut">top: count · bottom: ${dg.syl?'konnakol':'takadimi'} syllables</div>`:'');},
  tree(dg){ // note-value tree: each row splits the one above in two
    const rows=dg.rows||[1,2,4,8],W=Math.min(thW(),560),lab=74,w=W,rh=42,h=rows.length*rh+6;let s='';
    rows.forEach((d,ri)=>{const y=ri*rh+26,cw=(w-lab-6)/d;s+=`<text class="thtl" x="0" y="${y+4}">${{1:'whole',2:'half',4:'quarter',8:'8th',16:'16th'}[d]}</text>`;
      for(let i=0;i<d;i++){const x=lab+i*cw+Math.min(12,cw/2);s+=thHeadSvg(x,y,d);}
      if(d>=8){const per=d===8?2:4;for(let g=0;g<d;g+=per){const x1=lab+g*cw+Math.min(12,cw/2)+4.6,x2=lab+(g+per-1)*cw+Math.min(12,cw/2)+4.6;s+=`<rect class="thf" x="${x1-0.7}" y="${y-22}" width="${x2-x1+1.4}" height="3"/>`;if(d===16)s+=`<rect class="thf" x="${x1-0.7}" y="${y-17}" width="${x2-x1+1.4}" height="3"/>`;}}
      if(ri)s+=`<line class="thgl" x1="${lab-4}" x2="${w}" y1="${y-31}" y2="${y-31}"/>`;});
    return thSvg(w,h,s)+`<div class="thleg mut">each row lasts the same time: one 4/4 bar</div>`;},
  tempo(dg){ // tempo ruler 40–200 BPM
    const W=Math.min(thW(),620),x0=12,x1=W-12,lo=40,hi=200,X=b=>x0+(b-lo)/(hi-lo)*(x1-x0),h=78;let s='';
    [['slow',40,76],['medium',76,120],['fast',120,200]].forEach(([n,a,b],i)=>{s+=`<rect class="thz z${i}" x="${X(a)}" y="22" width="${X(b)-X(a)}" height="14"/><text class="thtl c" x="${(X(a)+X(b))/2}" y="16">${n}</text>`;});
    for(let b=40;b<=200;b+=20)s+=`<line class="thgl" x1="${X(b)}" x2="${X(b)}" y1="36" y2="44"/><text class="thsm" x="${X(b)}" y="56">${b}</text>`;
    (dg.marks||[]).forEach(m=>{s+=`<path class="thmk" d="M${X(m)} 38 l-6 -12 h12z"/><text class="thtl c b" x="${X(m)}" y="${h-4}">${m}</text>`;});
    return thSvg(W,h,s)+`<div class="thleg mut">beats per minute (BPM)</div>`;},
  key(dg){ // drum key: where each pad sits on the staff
    const pads=dg.pads||['C','R','HH','T1','T2','S','T3','K','HP'],W=Math.min(thW(),620),cw=(W-56)/pads.length,st=34,h=st+40+44;let s='';
    for(let i=0;i<5;i++)s+=`<line class="thsl" x1="0" x2="${W}" y1="${st+i*10}" y2="${st+i*10}"/>`;
    s+=`<rect class="thf" x="5" y="${st+10}" width="3.5" height="20"/><rect class="thf" x="11" y="${st+10}" width="3.5" height="20"/>`;
    pads.forEach((v,i)=>{const x=26+i*cw+cw/2,y=st+NT.pos[v]*5;
      if(v==='C'||y<st-1)s+=`<line class="thsl" x1="${x-9}" x2="${x+9}" y1="${st-10}" y2="${st-10}"/>`;
      s+=NT.xHead[v]?`<path class="thln" d="M${x-4.3} ${y-4.3} L${x+4.3} ${y+4.3} M${x-4.3} ${y+4.3} L${x+4.3} ${y-4.3}"/>`:`<ellipse class="thf" cx="${x}" cy="${y}" rx="5.5" ry="3.9" transform="rotate(-20 ${x} ${y})"/>`;
      const up=!NT.feet[v];s+=`<line class="thln" x1="${up?x+5:x-5}" x2="${up?x+5:x-5}" y1="${y}" y2="${up?y-24:y+24}"/>`;
      const ly=st+40+16+(i%2)*18;s+=`<text class="thsm c" x="${x}" y="${ly}" fill="${VOICES[v].c}">${VOICES[v].n}</text>`;});
    return thSvg(W,h,s)+`<div class="thleg mut">x heads = cymbals and the hi-hat pedal · stems up = hands, down = feet</div>`;},
  form(dg){ // form strip: sections in proportion to their bars
    const parts=dg.parts,tot=parts.reduce((a,p)=>a+p[1],0),W=Math.min(thW(),680),h=dg.fills?66:52;let x=0,s='';
    parts.forEach(([n,b],i)=>{const w=b/tot*W;s+=`<rect class="thsec s${i%4}" x="${x+1}" y="4" width="${w-2}" height="30" rx="6"/><text class="thtl c" x="${x+w/2}" y="24">${esc(w>46?n:n[0])}</text><text class="thsm c" x="${x+w/2}" y="48">${b} bar${b===1?'':'s'}</text>`;
      if(dg.fills)for(let k=4;k<=b;k+=4)s+=`<path class="thmk" d="M${x+k/b*w-3} 36 l3 6 l3 -6z"/>`;x+=w;});
    return thSvg(W,h,s)+(dg.fills?'<div class="thleg mut">▾ = end of a 4-bar phrase: a place for a fill</div>':'');},
  energy(dg){ // energy curve over a song's sections
    const parts=dg.parts,W=Math.min(thW(),680),h=96,n=parts.length,cw=W/n;let s='',d='';
    parts.forEach(([nm,e],i)=>{const x=i*cw+cw/2,y=12+(1-e)*50;d+=(i?' L':'M')+x+' '+y;s+=`<text class="thsm c" x="${x}" y="${h-6}">${esc(nm)}</text><circle class="thmkc" cx="${x}" cy="${y}" r="3.5"/>`;});
    return thSvg(W,h,`<line class="thgl" x1="0" x2="${W}" y1="62" y2="62"/><path class="thcurve" d="${d}"/>`+s)+`<div class="thleg mut">higher = fuller and louder</div>`;},
  ladder(dg){ // dynamics or any growing scale
    const it=dg.items,W=Math.min(thW(),560),cw=W/it.length,h=78;let s='';
    it.forEach((t,i)=>{const bh=8+i*(46/(it.length-1||1)),x=i*cw;s+=`<rect class="thz z1" x="${x+4}" y="${56-bh}" width="${cw-8}" height="${bh}" rx="4"/><text class="thtl c b it" x="${x+cw/2}" y="${h-4}">${esc(t)}</text>`;});
    return thSvg(W,h,s)+(dg.note?`<div class="thleg mut">${esc(dg.note)}</div>`:'');},
  hair(dg){ // crescendo / decrescendo hairpins
    const W=Math.min(thW(),520),h=60;return thSvg(W,h,`<path class="thln" d="M10 18 L${W/2-20} 6 M10 18 L${W/2-20} 30"/><path class="thln" d="M${W/2+20} 6 L${W-10} 18 M${W/2+20} 30 L${W-10} 18"/><text class="thsm c" x="${W/4}" y="${h-4}">crescendo: get louder</text><text class="thsm c" x="${3*W/4}" y="${h-4}">decrescendo: get softer</text>`);},
  wave(dg){ const W=Math.min(thW(),520),h=70;let d='M0 35';for(let x=0;x<=W;x+=4)d+=` L${x} ${35+Math.sin(x/12)*22*Math.exp(-x/(W*0.7))}`;
    return thSvg(W,h,`<line class="thgl" x1="0" x2="${W}" y1="35" y2="35"/><path class="thcurve" d="${d}"/>`)+`<div class="thleg mut">a hit makes the air shake; the shaking fades</div>`;},
  feel(dg){ // where hits land against the beat: steady / rushing / dragging
    const W=Math.min(thW(),560),h=dg.rows?dg.rows.length*30+10:40,rows=dg.rows||[[dg.mode||'steady',dg.mode==='rush'?-1:dg.mode==='drag'?1:0]];let s='';
    const beats=4,bw=(W-80)/beats;rows.forEach(([lb,dir],r)=>{const y=r*30+20;s+=`<text class="thtl" x="0" y="${y+4}">${esc(lb)}</text>`;
      for(let b=0;b<beats;b++){const x=80+b*bw+bw/2;s+=`<line class="thgl" x1="${x}" x2="${x}" y1="${y-11}" y2="${y+11}"/><circle class="thmkc${dir?' off':''}" cx="${x+dir*(4+b*4)}" cy="${y}" r="5"/>`;}});
    return thSvg(W,h,s)+`<div class="thleg mut">lines = the click · dots = your hits</div>`;},
  keys(dg){ // piano keyboard: dg.from (MIDI, a C), dg.oct (octaves), dg.hi (MIDI to colour), dg.names (true = letter on every white key, 'all' = black keys too), dg.marks ({midi:label}), dg.steps ([[a,b,'W'|'H'],…] arcs under the keys)
    const from=dg.from||60,oct=dg.oct||1,W=Math.min(thW(),620),whites=[];for(let n=from;n<=from+12*oct;n++)if(![1,3,6,8,10].includes(BacklineTone.mod(n)))whites.push(n);
    const ww=W/whites.length,kh=dg.steps?96:110,h=kh+(dg.steps?34:6),hi=new Set(dg.hi||[]),mk=dg.marks||{};let s='',xs={};
    whites.forEach((n,i)=>{const x=i*ww;xs[n]=x+ww/2;s+=`<rect class="thkey wk${hi.has(n)?' hi':''}" data-n="${n}" x="${x+0.5}" y="0" width="${ww-1}" height="${kh}" rx="4"/>`;
      const lab=mk[n]!=null?mk[n]:dg.names?BacklineTone.noteName(n,dg.flats)+(dg.oct>1&&BacklineTone.mod(n)===0&&dg.octNums?Math.floor(n/12)-1:''):'';if(lab!=='')s+=`<text class="thkl" x="${x+ww/2}" y="${kh-8}">${esc(lab)}</text>`;});
    for(let n=from;n<from+12*oct;n++){if(![1,3,6,8,10].includes(BacklineTone.mod(n)))continue;const x=xs[n-1]+ww/2-ww*0.3;xs[n]=x+ww*0.3;
      s+=`<rect class="thkey bk${hi.has(n)?' hi':''}" data-n="${n}" x="${x}" y="0" width="${ww*0.6}" height="${kh*0.6}" rx="3"/>`;
      const lab=mk[n]!=null?mk[n]:dg.names==='all'?BacklineTone.noteName(n,dg.flats):'';if(lab!=='')s+=`<text class="thkl bl" x="${x+ww*0.3}" y="${kh*0.6-7}">${esc(lab)}</text>`;}
    (dg.steps||[]).forEach(([a,b,l])=>{const x1=xs[a],x2=xs[b];if(x1==null||x2==null)return;s+=`<path class="thln" d="M${x1} ${kh+4} Q${(x1+x2)/2} ${kh+20} ${x2} ${kh+4}"/><text class="thsm c b" x="${(x1+x2)/2}" y="${kh+30}">${esc(l)}</text>`;});
    return thSvg(W,h,s)+(dg.note?`<div class="thleg mut">${esc(dg.note)}</div>`:'');},
  neck(dg){ // guitar neck: dg.strings (low → high names), dg.frets, dg.hi [[stringIndex,fret,label]]
    const st=dg.strings||['E','A','D','G','B','E'],fr=dg.frets||12,W=Math.min(thW(),660),lw=24,fw=(W-lw-6)/(fr+1),sh=st.length>1?18:0,h=Math.max(1,st.length-1)*sh+44;let s='';
    const openMidi=dg.open||[40,45,50,55,59,64].slice(0,st.length);
    st.forEach((n,i)=>{const y=14+(st.length-1-i)*sh;s+=`<text class="thsm" x="0" y="${y+4}">${n}</text><line class="thsl" style="opacity:.8" x1="${lw}" x2="${W}" y1="${y}" y2="${y}"/>`;});
    for(let f=0;f<=fr;f++){const x=lw+f*fw+fw;s+=`<line class="${f===0?'thbar':'thgl'}" x1="${x}" x2="${x}" y1="8" y2="${20+(st.length-1)*sh}"/>`;if([3,5,7,9,12,15].includes(f))s+=`<text class="thsm c" x="${x-fw/2}" y="${h-4}">${f}</text>`;}
    (dg.hi||[]).forEach(([si,f,l])=>{const y=14+(st.length-1-si)*sh,x=lw+f*fw+fw/2;s+=`<circle class="thfret" data-n="${(openMidi[si]||40)+f}" cx="${x}" cy="${y}" r="8"/>${l!=null?`<text class="thfl" x="${x}" y="${y+3.5}">${esc(l)}</text>`:''}`;});
    return thSvg(W,h,s)+(dg.note?`<div class="thleg mut">${esc(dg.note)}</div>`:'');},
  chart(dg){ // chord chart: one box per bar, chord names (and Roman numerals) inside
    const bars=dg.bars,per=Math.min(bars.length,dg.per||4),rows=Math.ceil(bars.length/per),W=Math.min(thW(),620),bw=W/per,rh=dg.rn?50:40,h=rows*(rh+6);let s='',ci=0;
    bars.forEach((b,i)=>{const r=Math.floor(i/per),x=(i%per)*bw,y=r*(rh+6);s+=`<rect class="thsec" x="${x+1}" y="${y}" width="${bw-2}" height="${rh}" rx="6"/>`;
      [].concat(b).forEach((c,j,arr)=>{const cx=x+bw*(j+0.5)/arr.length;s+=`<text class="thchd" data-ci="${ci}" x="${cx}" y="${y+24}">${esc(c)}</text>`;if(dg.rn&&dg.rn[ci])s+=`<text class="thsm c" x="${cx}" y="${y+42}">${esc(dg.rn[ci])}</text>`;ci++;});});
    return thSvg(W,h,s)+(dg.note?`<div class="thleg mut">${esc(dg.note)}</div>`:'');},
  tala(dg){ // tala circle: one dot per beat with its hand gesture (clap / finger count / wave); lights in time with Hear it
    const g=dg.g,n=g.length,lab={clap:'clap',wave:'wave'};
    if(thW()<600){ // phones: one row of beats (the circle would push the card past one screen)
      const W=Math.min(thW(),560),cw=W/n,h=64;let s='';
      g.forEach((x,i)=>{const px=i*cw+cw/2,big=x==='clap';s+=`<circle class="thtb${big?' clap':x==='wave'?' wave':''}" cx="${px}" cy="20" r="${big?14:11}"/><text class="thtl c b" x="${px}" y="25">${i+1}</text><text class="thsm c" x="${px}" y="54">${esc(lab[x]||x)}</text>`;});
      (dg.split||[]).forEach(b=>{s+=`<line class="thbar" x1="${b*cw}" x2="${b*cw}" y1="2" y2="38"/>`;});
      return thSvg(W,h,s)+`<div class="thleg mut">${esc((dg.name?dg.name+' · ':'')+(dg.note||''))}${/\d/.test(g.join(''))?' · numbers under the dots = fingers':''}</div>`;}
    const W=Math.min(thW(),340),R=W/2-34,cx=W/2,cy=R+30,h=2*R+64;let s=`<circle class="thgl" cx="${cx}" cy="${cy}" r="${R}" fill="none"/>`;
    g.forEach((x,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,px=cx+R*Math.cos(a),py=cy+R*Math.sin(a),big=x==='clap';
      s+=`<circle class="thtb${big?' clap':x==='wave'?' wave':''}" cx="${px}" cy="${py}" r="${big?15:12}"/><text class="thtl c b" x="${px}" y="${py+4.5}">${i+1}</text>`;
      const lx=cx+(R+0)*Math.cos(a)*0.62,ly=cy+R*Math.sin(a)*0.62;s+=`<text class="thsm c" x="${lx}" y="${ly+4}">${esc(lab[x]||('finger '+x))}</text>`;});
    if(dg.split)dg.split.forEach(b=>{const a=-Math.PI/2+(b-0.5)*2*Math.PI/n;s+=`<line class="thbar" x1="${cx+(R-22)*Math.cos(a)}" y1="${cy+(R-22)*Math.sin(a)}" x2="${cx+(R+22)*Math.cos(a)}" y2="${cy+(R+22)*Math.sin(a)}"/>`;});
    s+=`<text class="thtl c b" x="${cx}" y="${cy+5}">${esc(dg.name||'')}</text>`;
    return thSvg(W,h,s)+(dg.note?`<div class="thleg mut">${esc(dg.note)}</div>`:'');},
  swing(dg){ // straight vs swung 8ths, drawn on a triplet ruler: swung = long (2/3) + short (1/3)
    const W=Math.min(thW(),560),rows=dg.rows||[['straight',0.5],['swung',2/3]],bw=(W-78)/2,h=rows.length*34+22;let s='';
    for(let b=0;b<=2;b++){const x=78+b*bw;s+=`<line class="thgl" x1="${x}" x2="${x}" y1="6" y2="${h-18}"/>`;if(b<2){s+=`<text class="thsm c" x="${x+8}" y="${h-4}">${b+1}</text>`;for(let k=1;k<3;k++)s+=`<line class="thgl dash" x1="${x+k*bw/3}" x2="${x+k*bw/3}" y1="10" y2="${h-22}"/>`;}}
    rows.forEach(([lb,f],r)=>{const y=r*34+22;s+=`<text class="thtl" x="0" y="${y+4}">${esc(lb)}</text>`;
      for(let b=0;b<2;b++){const x=78+b*bw;s+=`<rect class="thz z1" x="${x+2}" y="${y-8}" width="${f*bw-4}" height="16" rx="5"/><rect class="thz z0" x="${x+f*bw+2}" y="${y-8}" width="${(1-f)*bw-4}" height="16" rx="5"/><circle class="thmkc" cx="${x+3}" cy="${y}" r="4"/><circle class="thmkc" cx="${x+f*bw+3}" cy="${y}" r="4"/>`;}});
    return thSvg(W,h,s)+`<div class="thleg mut">dashed lines = the beat cut in three (triplets)</div>`;},
  road(dg){ // chart road map: the written order (boxes) and the order you actually play (letters below)
    const sec=dg.written,W=Math.min(thW(),620),cw=W/sec.length,h=96;let s='';
    sec.forEach((t,i)=>{const x=i*cw;s+=`<rect class="thsec s${i%4}" x="${x+2}" y="4" width="${cw-4}" height="30" rx="6"/><text class="${t.length*7.5>cw-8?'thsm':'thtl'} c" x="${x+cw/2}" y="24">${esc(t)}</text>`;});
    (dg.marks||[]).forEach(([i,t])=>{s+=`<text class="thsm c b" x="${i*cw+cw/2}" y="48">${esc(t)}</text>`;});
    s+=`<text class="thtl" x="0" y="${h-12}">play: ${esc(dg.play.join(' → '))}</text>`;
    return thSvg(W,h,s);},
  simile(dg){ // one-bar repeat: bar 1 written out, bar 2 the slash-and-dots sign
    const W=Math.min(thW(),520),st=24,h=st+40+26,bw=(W-30)/2;let s='';
    for(let i=0;i<5;i++)s+=`<line class="thsl" x1="0" x2="${W}" y1="${st+i*10}" y2="${st+i*10}"/>`;
    s+=`<rect class="thf" x="5" y="${st+10}" width="3.5" height="20"/><rect class="thf" x="11" y="${st+10}" width="3.5" height="20"/>`;
    [26+bw,W-1].forEach(x=>{s+=`<line class="thsl" style="opacity:1" x1="${x}" x2="${x}" y1="${st}" y2="${st+40}"/>`;});
    for(let b=0;b<4;b++){const x=34+b*(bw-16)/4+8;s+=`<path class="thln" d="M${x-4} ${st-9} L${x+4} ${st-1} M${x-4} ${st-1} L${x+4} ${st-9}"/><line class="thln" x1="${x+4}" x2="${x+4}" y1="${st-5}" y2="${st-30+20}"/>`;
      s+=b%2?`<ellipse class="thf" cx="${x}" cy="${st+25}" rx="5.5" ry="3.9" transform="rotate(-20 ${x} ${st+25})"/>`:`<ellipse class="thf" cx="${x}" cy="${st+35}" rx="5.5" ry="3.9" transform="rotate(-20 ${x} ${st+35})"/>`;}
    const cx=26+bw+bw/2;s+=`<path class="thf" d="M${cx-11} ${st+30} L${cx+5} ${st+8} L${cx+11} ${st+10} L${cx-5} ${st+32}z"/><circle class="thf" cx="${cx-9}" cy="${st+14}" r="2.6"/><circle class="thf" cx="${cx+9}" cy="${st+27}" r="2.6"/>`;
    s+=`<text class="thsm c" x="${26+bw/2}" y="${h-4}">bar 1, written out</text><text class="thsm c" x="${cx}" y="${h-4}">bar 2 = the same</text>`;
    return thSvg(W,h,s);},
  staff(dg){ const W=Math.min(thW(),520),st=16,h=st+40+30;let s='';
    for(let i=0;i<5;i++)s+=`<line class="thsl" x1="40" x2="${W}" y1="${st+i*10}" y2="${st+i*10}"/>`;
    s+=`<rect class="thf" x="46" y="${st+10}" width="3.5" height="20"/><rect class="thf" x="52" y="${st+10}" width="3.5" height="20"/>`;
    if(dg.mark!=='clef'){for(let i=0;i<5;i++)s+=`<text class="thsm" x="0" y="${st+i*10+4}">line ${5-i}</text>`;for(let i=0;i<4;i++)s+=`<text class="thsm" x="${W-56}" y="${st+i*10+9}">space ${4-i}</text>`;}
    s+=`<text class="thsm" x="40" y="${h-6}">${dg.mark==='clef'?'percussion clef: two thick bars':'lines and spaces count from the bottom'}</text>`;
    return thSvg(W,h,s);}
};
function thHeadSvg(x,y,d){const hollow=d<=2;let s=hollow?`<ellipse class="thln" cx="${x}" cy="${y}" rx="5.5" ry="3.9" transform="rotate(-20 ${x} ${y})"/>`:`<ellipse class="thf" cx="${x}" cy="${y}" rx="5.5" ry="3.9" transform="rotate(-20 ${x} ${y})"/>`;
  if(d>=2)s+=`<line class="thln" x1="${x+5}" x2="${x+5}" y1="${y}" y2="${y-22}"/>`;return s;}

/* ---------- Hear it: kit synth + click, count shown (and optionally spoken) in time ---------- */
const HEAR={nodes:[],raf:0,timers:[],on:null,t0:0,spec:null,key:''};
function thHearSpecs(k){
  const h=k.hear;if(h===false)return [];
  if(Array.isArray(h))return h;if(h)return [h];
  const ex=k.dg&&(k.dg.type==='nt'||k.dg.type==='count')?k.dg.ex:null;return ex?[{ex,bpm:70}]:[];
}
function thVoice(v,t,gain,ch){
  const g=ac.createGain();g.connect(ac.destination);const pk=Math.max(0.0002,gain);
  if(v==='K'||v==='T1'||v==='T2'||v==='T3'){const o=ac.createOscillator(),f={K:[120,45],T1:[260,170],T2:[200,130],T3:[150,95]}[v];
    o.frequency.setValueAtTime(f[0],t);o.frequency.exponentialRampToValueAtTime(f[1],t+0.15);env(g,t,0.9*pk,v==='K'?0.35:0.3);o.connect(g);o.start(t);o.stop(t+0.4);HEAR.nodes.push(o);}
  else{const s=ac.createBufferSource();s.buffer=noiseBuf;const fl=ac.createBiquadFilter();
    if(v==='S'){if(ch==='r'){fl.type='bandpass';fl.frequency.value=3200;env(g,t,0.9*pk,0.07);}else{fl.type='bandpass';fl.frequency.value=1800;env(g,t,0.8*pk,0.18);}}
    else if(v==='HH'||v==='HP'){fl.type='highpass';fl.frequency.value=7000;env(g,t,0.45*pk,ch==='o'?0.45:0.05);}
    else{fl.type='highpass';fl.frequency.value=4500;env(g,t,0.4*pk,v==='C'?1.0:0.4);}
    s.connect(fl).connect(g);s.start(t);s.stop(t+1.1);HEAR.nodes.push(s);}
}
function thHearStop(){
  HEAR.nodes.forEach(n=>{try{n.stop(0);}catch(_){}});HEAR.nodes=[];if(HEAR.tone)HEAR.tone.stop();document.querySelectorAll('.thkey.on,.thchd.on,.thfret.on').forEach(x=>x.classList.remove('on'));cancelAnimationFrame(HEAR.raf);HEAR.timers.forEach(clearTimeout);HEAR.timers=[];
  try{window.speechSynthesis&&speechSynthesis.cancel();}catch(_){}
  HEAR.on=null;document.querySelectorAll('[data-thhear].on').forEach(b=>{b.classList.remove('on');b.innerHTML=b.dataset.lab;});
  document.querySelectorAll('.thcell.on,.thtb.on').forEach(c=>c.classList.remove('on'));const bc=$('#thbig');if(bc)bc.textContent='';
  Object.keys(TH_LAY).forEach(kk=>{const ph=document.querySelector(`[data-thdg="${kk}"] .nph`);if(ph){ph.setAttribute('x1',-9);ph.setAttribute('x2',-9);}});
}
// plan the sound of one spec: events {t (s from start), v, ch, gain} + clicks + count words per step
function thHearPlan(sp){
  const ex=sp.ex||X('Click',1,{},{bars:sp.bars||2}),sub=ex.sub,spb=ex.steps||4*sub,bars=ex.bars||1,n=spb*bars,bpmv=sp.bpm||70;
  const stepS=60/bpmv/sub,reps=sp.reps||(n*stepS<4?2:1),cin=sp.cin!=null?sp.cin:!!sp.ex,cinS=cin?spb*stepS:0,mts=ntMeters(ex);
  const evs=[],clicks=[],words=[];const beats=beatStepsOf(ex),mode=sp.click||'all';
  if(cin)beats.forEach((st,i)=>clicks.push({t:st*stepS,k:i===0?'acc':'beat'}));
  const swOff=((ex.swing||0.5)-0.5)*2*stepS; // same long–short as the scoring engine (04-engine buildRun)
  for(let r=0;r<reps;r++)for(let i=0;i<n;i++){const j=i%spb,t=cinS+(r*n+i)*stepS+(j%2?swOff:0),b=Math.floor(i/spb),mt=mts[b];
    const ramp=sp.ramp?sp.ramp[0]+(sp.ramp[1]-sp.ramp[0])*((r*n+i)/Math.max(1,reps*n-1)):1;
    for(const v in ex.v){const c=ex.v[v][i];if(!c||c==='.')continue;evs.push({t,v,ch:c,gain:(c==='X'?1:c==='g'?0.22:0.62)*ramp*(sp.gain||1)});}
    if(mode!=='none'&&beats.includes(j)&&(mode==='all'||(mode==='24'&&(j===beats[1]||j===beats[3]))||(mode==='1'&&j===0)))clicks.push({t,k:j===0?'acc':'beat'});
    const grp=mt.groups[mt.beatOf[j]],g=grp[1]-grp[0];words.push({t,i,w:(mt.full||mt.count)[j]||'',kon:thSylAt(sp.syl,mt,j,i),beat:j===grp[0],bn:mt.beatOf[j]+1});}
  return{evs,clicks,words,stepS,total:cinS+reps*n*stepS,cinS,n};
}
async function thHear(id,idx,spec){
  const k=THC[id];if(!k)return;const sp=spec||thHearSpecs(k)[idx||0];if(!sp)return;const key=id+':'+(idx==null?0:idx);
  if(HEAR.on===key){thHearStop();return;}thHearStop();
  if(sp.seq||sp.chords)return thHearTone(k,sp,key);
  const a=audio();if(a.state!=='running'){try{await a.resume();}catch(_){}}
  const P0=thHearPlan(sp),t0=a.currentTime+0.15;HEAR.on=key;HEAR.t0=t0;HEAR.spec=sp;
  P0.evs.forEach(e=>thVoice(e.v,t0+e.t,e.gain,e.ch));P0.clicks.forEach(c=>click(t0+c.t,c.k,HEAR.nodes));
  const b=document.querySelector(`[data-thhear="${key}"]`);if(b){b.classList.add('on');b.innerHTML='■ Stop';}
  // spoken count (Settings: voice on): beat numbers, or syllables when there is time for them
  if(state.set.thVoice&&window.speechSynthesis){const lead=0.06;P0.words.forEach(w=>{const say=(state.set.thKon||sp.kon||sp.syl)?(P0.stepS>=0.24||w.beat?w.kon:''):(w.beat?String(w.bn):(P0.stepS>=0.24?w.w:''));if(!say)return;
    HEAR.timers.push(setTimeout(()=>{try{const u=new SpeechSynthesisUtterance(say);u.rate=1.6;u.volume=1;speechSynthesis.speak(u);}catch(_){}},Math.max(0,(t0+w.t-a.currentTime-lead)*1000)));});}
  const dgKey=k.id,lay=TH_LAY[dgKey],wrap=document.querySelector(`[data-thdg="${dgKey}"]`);let lastI=-1;
  const tick=()=>{if(HEAR.on!==key)return;const el=a.currentTime-t0;if(el>P0.total+0.2){thHearStop();return;}
    const cur=P0.words.filter(w=>w.t<=el).pop();const bc=$('#thbig');
    if(el<P0.cinS){if(bc)bc.textContent='count-in';}
    else if(cur&&cur.i!==lastI){lastI=cur.i;if(bc)bc.textContent=(state.set.thKon||sp.kon||sp.syl)?cur.kon:cur.w;
      if(wrap&&sp.ex){const tb=wrap.querySelectorAll('.thtb');if(tb.length){const nb=tb.length,bi=Math.floor(cur.i/sp.ex.sub)%nb;tb.forEach((x,ii)=>x.classList.toggle('on',ii===bi));}}
      if(wrap){wrap.querySelectorAll('.thcell.on').forEach(c=>c.classList.remove('on'));const c=wrap.querySelector(`.thcell[data-st="${cur.i}"]`);if(c)c.classList.add('on');
        if(lay&&lay.steps[cur.i]){const ph=wrap.querySelector('.nph'),s=lay.steps[cur.i],sy=lay.sys[s.sys];if(ph){ph.setAttribute('x1',s.x);ph.setAttribute('x2',s.x);ph.setAttribute('y1',sy.top+6);ph.setAttribute('y2',sy.top+sy.h-8);}}}}
    HEAR.raf=requestAnimationFrame(tick);};
  HEAR.raf=requestAnimationFrame(tick);
}

/* Hear it with the shared tone synth (lib/tone.x.y.z.js, from Backline): notes, intervals, scales, chords, progressions.
   sp.seq = [midi | [midi…] | null(rest)], one step per sp.beats (default 1) beat; sp.chords = ['C','G',…], sp.beats per
   chord (default 4), with an optional drum groove sp.ex looped under it; sp.voice = 'keys' (default) | 'pad'. */
function thTonePlan(sp){
  const bpmv=sp.bpm||80,beatS=60/bpmv,ev=[];let t=0;
  if(sp.seq){const per=(sp.beats||1)*beatS;sp.seq.forEach((n,i)=>{if(n!=null)ev.push({t,d:per*(sp.legato===false?0.6:0.95),notes:[].concat(n),i,kind:'n'});t+=per;});}
  else{const per=(sp.beats||4)*beatS;sp.chords.forEach((c,i)=>{ev.push({t,d:per,chord:c,i,kind:'c'});t+=per;});}
  return{ev,total:t,beatS};
}
async function thHearTone(k,sp,key){
  const a=audio();if(a.state!=='running'){try{await a.resume();}catch(_){}}
  if(!HEAR.tone||HEAR.tone.ctx!==a)HEAR.tone=new BacklineTone.Tone(a);
  const P0=thTonePlan(sp),t0=a.currentTime+0.12,T=HEAR.tone;HEAR.on=key;
  if(sp.seq)P0.ev.forEach(e=>e.notes.forEach(n=>sp.voice==='pad'?T.pad([n],t0+e.t,e.d):T.keys(n,t0+e.t,e.d)));
  else{T.progression(sp.chords,t0,P0.beatS,sp.beats||4);
    if(sp.ex){const ex=sp.ex,spb=ex.steps||4*ex.sub,n=spb*(ex.bars||1),stepS=P0.beatS/ex.sub;for(let i=0;i*stepS<P0.total-1e-6;i++){const j=i%n;for(const v in ex.v){const c=ex.v[v][j];if(c&&c!=='.')thVoice(v,t0+i*stepS,(c==='X'?1:c==='g'?0.22:0.55)*(sp.gain||0.8),c);}}}
    if(sp.click)for(let b=0;b*P0.beatS<P0.total-1e-6;b++)click(t0+b*P0.beatS,b%(sp.beats||4)===0?'acc':'beat',HEAR.nodes);}
  const b=document.querySelector(`[data-thhear="${key}"]`);if(b){b.classList.add('on');b.innerHTML='■ Stop';}
  const wrap=document.querySelector(`[data-thdg="${k.id}"]`);let last=-1;
  const tick=()=>{if(HEAR.on!==key)return;const el=a.currentTime-t0;if(el>P0.total+0.4){thHearStop();return;}
    const cur=P0.ev.filter(e=>e.t<=el&&el<e.t+e.d).pop();const bc=$('#thbig');
    if(cur&&cur.i!==last){last=cur.i;if(bc)bc.textContent=cur.chord||cur.notes.map(n=>BacklineTone.noteName(n,sp.flats)).join(' ');
      if(wrap){wrap.querySelectorAll('.thkey.on,.thchd.on,.thfret.on').forEach(x=>x.classList.remove('on'));
        if(cur.notes)cur.notes.forEach(n=>wrap.querySelectorAll(`.thkey[data-n="${n}"],.thfret[data-n="${n}"]`).forEach(x=>x.classList.add('on')));
        else{const c=wrap.querySelector(`.thchd[data-ci="${cur.i}"]`);if(c)c.classList.add('on');const v=BacklineTone.voicing(cur.chord);if(v)v.pad.concat(v.pad.map(x=>x+12),v.pad.map(x=>x-12)).forEach(n=>wrap.querySelectorAll(`.thkey[data-n="${n}"]`).forEach(x=>x.classList.add('on')));}}}
    else if(!cur&&last!==-2){last=-2;if(wrap)wrap.querySelectorAll('.thkey.on,.thchd.on,.thfret.on').forEach(x=>x.classList.remove('on'));}
    HEAR.raf=requestAnimationFrame(tick);};
  HEAR.raf=requestAnimationFrame(tick);
}

/* ---------- Try it: the practice screen, scored by the normal engine ---------- */
function openTheoryTry(id,i){
  const k=THC[id];const t=k&&(k.try||(typeof thQuickTry==='function'&&thQuickTry(k)));if(!t)return;closeSheets();thHearStop();const b=t.bpm||70;
  L={id:'th:'+id,t:k.t,theory:id,type:'play',lv:0,sd:1,bpm:[b,b],step:5,ex:t.ex,loop:t.loop};stretchMode=false;exI=Math.min(i||0,t.ex.length-1);bpm=b;
  $('#prac').classList.remove('hidden');$('#result').classList.add('hidden');
  $('#ptitle').innerHTML=`<span class="idx">Theory</span>${esc(k.t)}`;renderPracBar();renderPads(L.ex[exI]);sizeCv();makePreview();draw();
}
function thTryDone(R,res){
  const id=L.theory,k=THC[id],ok=res.score>=TH_PLAY&&(res.dynScore==null||res.dynScore>=state.set.dynPass);
  thAddTime(res.elapsed);lastRunTs=0;
  state.sessions.push(Object.assign({ts:Date.now(),id:L.id,kind:'theory',card:id,ex:exI,bpm:R.bpm,score:res.score,on:res.on,n:res.n,ext:res.ext,miss:res.miss,avg:Math.round(res.avg),dur:Math.round(res.elapsed/1000)},res.dynScore!=null?{dyn:res.dynScore}:{}));
  const newly=ok&&thMark(id,'p',true);if(ok)thMark(id,'r',true);save();renderPracBar();
  showResult(`<div class="row"><div><div class="score" style="color:${ok?'var(--good)':'var(--warn)'}">${res.score}%</div>${res.dynScore!=null?`<div class="mut">Timing · dynamics ${res.dynScore}%</div>`:''}</div><div style="margin-left:18px"><div style="font-weight:700;font-size:20px">${ok?'Can play ✓':'Not yet'}</div><div class="mut">${ok?(newly?'Marked “Can play” on the card.':'Still “Can play”.'):`Need ${TH_PLAY}%${res.dynScore!=null?' and '+state.set.dynPass+'% dynamics':''} for “Can play”. Try a slower tempo (−5 BPM).`}</div></div></div>
    <p>${res.on} of ${res.n} notes on time (±${state.set.tol} ms) · ${res.miss} missed · ${res.ext} extra</p><p class="mut" style="font-size:13px">Theory tries count for practice minutes and your streak, never for lesson progress or song readiness.</p>`);
}

/* ---------- Check ---------- */
const TH_ANS={};   // this session's answers: {cardId:{qi:choice}}
function thCheckHtml(k,qs,opts={}){
  const a=TH_ANS[k.id]||{};
  return qs.map((q,i)=>{const pick=a[i];return `<div class="thq"><b>${opts.num?opts.num+i+1+'. ':''}${esc(q.q)}</b>${q.hear?` <button class="sm ghost" data-thqh="${k.id}:${i}">▶ Play</button>`:''}<div class="thans">${q.a.map((x,j)=>`<button class="sm ${pick===j?(j===q.c?'pri':'bad'):''}" data-thq="${k.id}" data-qi="${i}" data-qj="${j}">${esc(x)}</button>`).join('')}</div>${pick!=null?`<p class="mut thwhy">${pick===q.c?'✓ ':'✗ '}${esc(q.why||'')}</p>`:''}</div>`;}).join('');
}
function thAnswer(id,qi,qj){
  const k=THC[id];if(!k||!k.check)return;const a=TH_ANS[id]=TH_ANS[id]||{};a[qi]=qj;
  if(k.check.every((q,i)=>a[i]===q.c)){thMark(id,'r',true);const u=thMark(id,'u',true),h=k.ear&&thMark(id,'h',true);if(h)toast('Can hear ✓');else if(u)toast('Understood ✓');save();}
}

/* ---------- views ---------- */
VP.theory=VP.theory||{mode:'home',by:'tier',part:null,card:null};
function thGo(p){go('theory',Object.assign({mode:'home',part:null,card:null},p));}
function renderTheory(){
  const p=VP.theory;thHearStop();
  if(!THP.length){view.innerHTML='<h1>Theory</h1><div class="card mut">The theory course hasn’t loaded.</div>';return;}
  if(p.mode==='card'&&THC[p.card])return thRenderCard(THC[p.card]);
  if(p.mode==='part'&&THP.find(x=>x.id===p.part))return thRenderPart(THP.find(x=>x.id===p.part));
  if(p.mode==='review')return thRenderReview();
  thRenderHome();
}
function thTierStats(tier){const ks=TH_ORDER.filter(k=>k.part.tier===tier);return{n:ks.length,u:ks.filter(k=>thKnown(k.id)).length,r:ks.filter(k=>thSt(k.id)).length};}
function thPartStats(pt){const ks=pt.ch.flatMap(c=>c.cards);return{n:ks.length,u:ks.filter(k=>thKnown(k.id)).length,r:ks.filter(k=>thSt(k.id)).length};}
function thRenderHome(){
  const p=VP.theory,t=thS(),due=thDue().length,c=thContinue(),by=p.by||'tier';
  const partRow=([pid,th,name])=>{const pt=THP.find(x=>x.id===pid);if(!pt)return `<div class="lrow dim"><span class="idx">${pid}</span><span>${esc(name)}</span><span class="sp"></span><span class="chip">Coming</span></div>`;
    const st=thPartStats(pt);return `<div class="lrow" data-thgo='{"mode":"part","part":"${pid}"}'>${ring(st.u/st.n,34,4)}<span class="idx">${pid}</span><span style="min-width:0">${esc(pt.t)} <span class="mut" style="font-size:13px">· ${st.n} cards</span></span><span class="sp"></span>${st.u?`<span class="chip ms">${st.u}/${st.n}</span>`:st.r?`<span class="chip ip">${st.r} read</span>`:'<span class="chip">New</span>'}</div>`;};
  const groups=by==='thread'?Object.keys(TH_THREADS).map(k=>[TH_THREADS[k],TH_PLAN.filter(x=>x[1]===k)]):Object.keys(TH_TIERS).map(k=>[k+' · '+TH_TIERS[k][0],TH_PLAN.filter(x=>x[0][0]===k),TH_TIERS[k][1]]);
  const bms=t.bookmarks.filter(id=>THC[id]);
  view.innerHTML=`<h1>Theory</h1>
  <p class="hero line">Read music, count it and understand it, one small card at a time. Free order: lessons suggest cards, nothing is ever blocked.</p>
  <div class="grid thtop2">
    <div class="card tap" data-thcard="${c.id}"><div class="note-k" style="color:var(--accent)">${thSt(c.id)?'Last card':'Continue'}</div><b style="font-size:17px">${esc(c.t)}</b><div class="mut" style="font-size:14px">${c.part.id} ${esc(c.part.t)} · ${esc(c.chap.t)}</div></div>
    <div class="card ${due?'tap':''}" ${due?`data-thgo='{"mode":"review"}'`:''}><div class="note-k">Remember deck</div><b style="font-size:17px">${due?due+' due now':'Nothing due'}</b><div class="mut" style="font-size:14px">${Object.values(t.review).filter(r=>!r.done).length} cards in review · spaced 1, 3, 7, 21, 60 days</div></div>
  </div>
  <div class="thtiers">${Object.keys(TH_TIERS).map(k=>{const s=thTierStats(k);return `<div class="card thtier">${ring(s.n?s.u/s.n:0,52,6,s.n?null:'–')}<div style="min-width:0"><div class="thtk">Tier ${k}</div><b>${TH_TIERS[k][0]}</b><div class="mut" style="font-size:13px">${s.n?`${s.u} of ${s.n} understood`:'coming'}</div></div></div>`;}).join('')}</div>
  <div class="row" style="margin:16px 0 8px;align-items:center"><div class="seg"><button class="${by==='tier'?'on':''}" data-thby="tier">By tier</button><button class="${by==='thread'?'on':''}" data-thby="thread">By topic</button></div><span class="sp"></span><input id="thq" placeholder="Search theory, e.g. “ghost”" style="flex:1;min-width:150px;max-width:340px"></div>
  <div id="thres"></div>
  ${bms.length?`<h2>Bookmarks</h2><div class="list">${bms.map(id=>thCardRow(THC[id])).join('')}</div>`:''}
  ${groups.map(([h,ps,sub])=>ps.length?`<h2>${esc(h)}${sub?` <span class="mut" style="font-size:14px;font-weight:600">${esc(sub)}</span>`:''}</h2><div class="list">${ps.map(partRow).join('')}</div>`:'').join('')}`;
  const q=$('#thq'),res=$('#thres');q.value=p.q||'';const run_=()=>{p.q=q.value;const r=thSearch(q.value);res.innerHTML=q.value.trim()?(r.length?`<div class="list" style="margin-bottom:10px">${r.slice(0,30).map(thCardRow).join('')}</div>`:'<p class="mut">No card matches that yet.</p>'):'';};
  q.addEventListener('input',run_);if(p.q)run_();
}
function thSearch(s){s=String(s||'').trim().toLowerCase();if(!s)return [];const ws=s.split(/\s+/);
  return TH_ORDER.map(k=>{const hay=(k.t+' '+k.idea+' '+(k.rem||'')+' '+[].concat(k.more||[]).join(' ')+' '+k.chap.t+' '+k.part.t).toLowerCase();if(!ws.every(w=>hay.includes(w)))return null;
    return{k,s:(k.t.toLowerCase().includes(s)?3:0)+(k.chap.t.toLowerCase().includes(s)?1:0)};}).filter(Boolean).sort((a,b)=>b.s-a.s||a.k.n-b.k.n).map(x=>x.k);}
function thCardRow(k){return `<div class="lrow" data-thcard="${k.id}"><span class="idx">${k.id}</span><span style="min-width:0"><b>${esc(k.t)}</b><span class="mut thsnip"> ${esc(k.idea)}</span></span><span class="sp"></span>${thChip(k.id)}</div>`;}
function thCrumbs(parts){return `<nav class="crumbs">${parts.map((x,i)=>i===parts.length-1?`<span class="cur">${esc(x[0])}</span>`:`<button data-thgo='${JSON.stringify(x[1])}'>${esc(x[0])}</button><span>›</span>`).join('')}</nav>`;}
function thRenderPart(pt){
  const st=thPartStats(pt);
  view.innerHTML=thCrumbs([['Theory',{mode:'home'}],[pt.id+' '+pt.t,null]])+
  `<div class="row" style="align-items:center;margin:4px 0 6px;flex-wrap:nowrap">${ring(st.u/st.n,64,7)}<div style="min-width:0"><h1 style="margin:0">${esc(pt.t)}</h1><div class="mut">Tier ${pt.tier} · ${TH_TIERS[pt.tier][0]} · ${TH_THREADS[pt.th]} · ${st.n} cards, ${st.u} understood</div></div></div>
  ${pt.d?`<p style="max-width:860px">${esc(pt.d)}</p>`:''}
  ${pt.ch.map(c=>`<h2 style="font-size:18px">${c.id.split('.')[1]*1}. ${esc(c.t)}</h2><div class="list">${c.cards.map(thCardRow).join('')}</div>`).join('')}`;
}
function thWhere(k){   // lessons and songs moved to "Practise this" (T3); timing stays here
  if(k.mine!=='timing')return '';const rs=state.sessions.filter(s=>LBY[s.id]&&s.avg!=null).slice(-20);if(!rs.length)return '';const av=rs.reduce((a,s)=>a+s.avg,0)/rs.length;
  return `<div class="thwhere"><div class="thwl"><span class="note-k">Your timing</span> last ${rs.length} runs: ${Math.abs(av)<8?'centred on the beat':av<0?'rushing, '+Math.round(-av)+' ms ahead':'dragging, '+Math.round(av)+' ms behind'} on average</div></div>`;
}
// the card itself (also used as a sheet over the practice screen: opts.sheet)
function thCardHtml(k,opts={}){
  const t=thS(),sib=k.chap.cards,hs=thHearSpecs(k),bm=t.bookmarks.includes(k.id),lastOfCh=k.i===sib.length-1,chq=sib.reduce((a,c)=>a+(c.check||[]).length,0);
  const side=`${typeof thPractiseThis==='function'?thPractiseThis(k,opts):''}${thWhere(k)}${k.backline?`<div class="thwl"><span class="note-k">In Backline</span> ${k.backline.map(x=>`<a class="btn sm" href="${TH_BL}${x.h?'#'+x.h:''}" target="_blank" rel="noopener">${esc(x.l)} ↗</a>`).join('')}</div>`:''}`;
  return `<div class="thcard${opts.sheet?' thsheetcard':''}" ${opts.sheet?'':'data-thswipe'} data-thcid="${k.id}"><div class="thmain">
   <div class="thhead"><span class="mut thn">${opts.sheet?esc(k.part.id+' · '+k.chap.t)+' · ':''}Card ${k.i+1} of ${sib.length}</span><span class="sp"></span>${thChip(k.id)}<button class="icon ghost thstar ${bm?'on':''}" data-thbm="${k.id}" title="${bm?'Remove bookmark':'Bookmark'}">${bm?'★':'☆'}</button></div>
   <h1 class="tht">${esc(k.t)}</h1>
   <p class="thidea">${esc(k.idea)}</p>
   ${thDiagram(k,k.dg)}
   ${hs.length||k.try?`<div class="thact">${hs.map((h,i)=>{const lab=(h.l?esc(h.l):'▶ Hear it');return `<button class="sm" data-thhear="${k.id}:${i}" data-lab="${lab}">${lab}</button>`;}).join('')}${hs.length&&k.dg&&/^(count|nt)$/.test(k.dg.type)?`<button class="sm ghost ${state.set.thKon?'on':''}" data-thkon title="Count shown as numbers or as takadimi syllables">Count: ${state.set.thKon?'ta ka di mi':'1 e & a'}</button>`:''}${hs.length?'<span id="thbig" class="thbig"></span>':''}${k.try&&!opts.sheet?`<span class="sp"></span><button class="sm pri" data-thtry="${k.id}">${icon('play',14)} Try it</button>`:''}</div>`:''}
   ${k.rem?`<div class="threm"><span class="note-k">Remember</span><span>${esc(k.rem)}</span></div>`:''}
   ${k.more?`<div class="thmore"><button class="thmt ghost" data-thmore aria-expanded="${VP.theory.more===k.id}">${VP.theory.more===k.id?'Less ▴':'More ▾'}</button><div class="thmb${VP.theory.more===k.id?'':' hidden'}">${[].concat(k.more).map(x=>`<p>${esc(x)}</p>`).join('')}${k.see?`<div class="chips">${k.see.filter(s=>THC[s]).map(s=>`<button class="sm ghost" data-thcard="${s}">See: ${esc(THC[s].t)}</button>`).join('')}</div>`:''}</div></div>`:''}
   ${k.check?`<div class="thcheck"><div class="note-k">Check${k.ear?' · listen':''}</div>${thCheckHtml(k,k.check)}</div>`:''}
   ${!opts.sheet&&lastOfCh&&chq>sib.length?`<div class="row" style="margin-top:8px"><button class="sm" data-thchap="${k.id}">Chapter check · ${chq} questions</button></div>`:''}
   </div>${side?`<aside class="thside">${side}</aside>`:''}</div>`;
}
function thRenderCard(k){
  const t=thS();thMark(k.id,'r',true);t.lastCard=k.id;t.lastAt=thNow();save();
  const pi=TH_ORDER[k.n-1],nx=TH_ORDER[k.n+1];
  view.innerHTML=thCrumbs([['Theory',{mode:'home'}],[k.part.id+' '+k.part.t,{mode:'part',part:k.part.id}],[k.chap.t,null]])+thCardHtml(k)+
  `<div class="thnav">${pi?`<button data-thcard="${pi.id}" title="${esc(pi.t)}">‹ Back</button>`:'<span></span>'}<span class="sp"></span>${nx?`<button class="pri" data-thcard="${nx.id}" title="${esc(nx.t)}">Next ›</button>`:'<span class="mut">End of the written course for now</span>'}</div>`;
}
function thChapterCheck(id){
  const k=THC[id],cs=k.chap.cards.filter(c=>c.check);let off=0;
  const html=()=>{off=0;return `<p class="mut" style="margin-top:0">All the questions in “${esc(k.chap.t)}”. Each card turns Understood when its questions are right.</p>`+cs.map(c=>{const h=`<div class="mut" style="font-size:13px;margin-top:10px">${esc(c.t)}</div>`+thCheckHtml(c,c.check,{num:off});off+=c.check.length;return h;}).join('');};
  openSheet('Chapter check',`<div id="thchq">${html()}</div>`,{mount:m=>{m.addEventListener('click',e=>{const b=e.target.closest('[data-thq]');if(!b)return;e.stopPropagation();thAnswer(b.dataset.thq,+b.dataset.qi,+b.dataset.qj);$('#thchq',m).innerHTML=html();});}});
}
const TH_RV={list:[],i:0,show:false,done:0};
function thRenderReview(){
  if(!TH_RV.list.length||TH_RV.i>=TH_RV.list.length&&!TH_RV.fin){TH_RV.list=thDue();TH_RV.i=0;TH_RV.show=false;TH_RV.done=0;TH_RV.fin=false;}
  const id=TH_RV.list[TH_RV.i],k=THC[id];
  const head=thCrumbs([['Theory',{mode:'home'}],['Remember deck',null]]);
  if(!k){TH_RV.list=[];TH_RV.fin=false;const nxt=Object.values(thS().review).filter(r=>!r.done&&r.due).sort((a,b)=>a.due-b.due)[0];
    view.innerHTML=head+`<h1>Remember deck</h1><div class="card"><b>${TH_RV.done?'Done for now: '+TH_RV.done+' card'+(TH_RV.done===1?'':'s')+' reviewed.':'Nothing is due.'}</b><p class="mut">Cards join the deck when you first read them. ${nxt?'Next one is due '+new Date(nxt.due).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})+'.':''}</p><button data-thgo='{"mode":"home"}'>Theory home</button></div>`;return;}
  const r=thS().review[id]||{};
  view.innerHTML=head+`<h1>Remember deck <span class="mut" style="font-size:16px">${TH_RV.i+1} of ${TH_RV.list.length}</span></h1>
  <div class="card thrv" data-thswipe="rv"><div class="mut" style="font-size:13px">${k.part.id} ${esc(k.part.t)} · ${esc(k.chap.t)} · step ${(r.step||0)+1} of ${TH_REV.length}</div><h2 style="margin:6px 0">${esc(k.t)}</h2>
   ${TH_RV.show?`<div class="threm"><span class="note-k">Remember</span><span>${esc(k.rem)}</span></div>${k.dg&&k.dg.type!=='form'&&k.dg.type!=='energy'?thDiagram(k,k.dg,'rv'):''}
   <div class="row" style="margin-top:12px"><button data-thrv="0">Again <span class="mut">· 1 day</span></button><span class="sp"></span><button class="pri" data-thrv="1">Got it <span style="opacity:.75">· ${(r.step||0)+1>=TH_REV.length?'retire':TH_REV[(r.step||0)+1]+' days'}</span></button></div>`:
   `<p class="mut">What do you remember about this? Say it out loud, then check.</p><button class="pri" data-thrvshow>Show</button>`}
   <div class="row" style="margin-top:10px"><button class="sm ghost" data-thcard="${k.id}">Open the card</button></div></div>`;
}

/* ---------- events (own listener; data-th* attributes only) ---------- */
document.addEventListener('click',e=>{
  const T=e.target;let b;
  if((b=T.closest('[data-thcard]'))){closeSheets();thHearStop();thGo({mode:'card',card:b.dataset.thcard});return;}
  if((b=T.closest('[data-thgo]'))){closeSheets();const p=JSON.parse(b.dataset.thgo);if(p.mode==='review'){TH_RV.list=[];}thGo(p);return;}
  if((b=T.closest('[data-thby]'))){VP.theory.by=b.dataset.thby;render();return;}
  if((b=T.closest('[data-thqh]'))){const [id,qi]=b.dataset.thqh.split(':');const q=THC[id]&&THC[id].check[+qi];if(q&&q.hear)thHear(id,'q'+qi,q.hear);return;}
  if((b=T.closest('[data-thhear]'))){const [id,i]=b.dataset.thhear.split(':');thHear(id,+i);return;}
  if((b=T.closest('[data-thkon]'))){state.set.thKon=!state.set.thKon;save();b.classList.toggle('on',state.set.thKon);b.textContent='Count: '+(state.set.thKon?'ta ka di mi':'1 e & a');return;}
  if((b=T.closest('[data-thtry]'))){openTheoryTry(b.dataset.thtry);return;}
  if((b=T.closest('[data-thbm]'))){const t=thS(),id=b.dataset.thbm,i=t.bookmarks.indexOf(id);if(i>=0)t.bookmarks.splice(i,1);else t.bookmarks.push(id);t.bmAt=thNow();save();const on=i<0;b.classList.toggle('on',on);b.textContent=on?'★':'☆';b.title=on?'Remove bookmark':'Bookmark';return;}
  if((b=T.closest('[data-thq]'))&&b.closest('.thsheetcard')){const box=b.closest('.thsheetcard');thAnswer(b.dataset.thq,+b.dataset.qi,+b.dataset.qj);const k=THC[box.dataset.thcid];if(k){const w=box.parentElement;box.outerHTML=thCardHtml(k,{sheet:true});}return;}
  if((b=T.closest('[data-thq]'))&&!b.closest('.modal')){const y=scrollY;thAnswer(b.dataset.thq,+b.dataset.qi,+b.dataset.qj);render();scrollTo(0,y);return;}
  if((b=T.closest('[data-thchap]'))){thChapterCheck(b.dataset.thchap);return;}
  if(T.closest('[data-thrvshow]')){TH_RV.show=true;render();return;}
  if((b=T.closest('[data-thrv]'))){const id=TH_RV.list[TH_RV.i];if(id){thReview(id,b.dataset.thrv==='1');TH_RV.done++;}TH_RV.i++;TH_RV.show=false;if(TH_RV.i>=TH_RV.list.length){TH_RV.list=[];TH_RV.fin=true;TH_RV.i=0;}render();scrollTo(0,0);return;}
  if((b=T.closest('[data-thpset]'))){state.set.thPanel=b.dataset.thpset;save();render();return;}
  if((b=T.closest('[data-thset]'))){state.set[b.dataset.thset]=b.dataset.v==='1';save();render();if(b.dataset.thset==='thVoice'&&state.set.thVoice&&!window.speechSynthesis)toast('This browser has no speech voice; the count is shown instead.');return;}
  if((b=T.closest('[data-thmore]'))){const k=VP.theory.card,open=VP.theory.more!==k;VP.theory.more=open?k:null;const body=b.nextElementSibling;body.classList.toggle('hidden',!open);b.textContent=open?'Less ▴':'More ▾';b.setAttribute('aria-expanded',open);return;}
  if(T.closest('[data-thnudgeoff]')){thS().nudgeOff=today();save();render();return;}
});
// swipe left / right on a card = Next / Back
(()=>{let x0=null,y0=0;
  document.addEventListener('touchstart',e=>{const c=e.target.closest&&e.target.closest('[data-thswipe]');if(!c||e.target.closest('svg,.thdg,input'))return;x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
  document.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
    if(Math.abs(dx)<70||Math.abs(dy)>45||cur!=='theory'||VP.theory.mode!=='card')return;const k=THC[VP.theory.card];if(!k)return;const to=TH_ORDER[k.n+(dx<0?1:-1)];if(to)thGo({mode:'card',card:to.id});},{passive:true});})();

/* ---------- tests (?test=1 › Settings › Run theory tests) ---------- */
async function theoryTests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const keep=JSON.stringify({theory:state.theory,days:state.days,prog:state.prog,n:state.sessions.length,set:state.set}),keepVP=JSON.stringify(VP.theory),keepCur=cur;
  const ids=TH_ORDER.map(k=>k.id);
  // 1. content
  {const bad=[];const seen=new Set();THP.forEach(p=>{if(!TH_PLAN.some(x=>x[0]===p.id))bad.push(p.id+': not in the plan');p.ch.forEach(c=>{if(!c.id.startsWith(p.id+'.'))bad.push(c.id+': wrong part');c.cards.forEach(k=>{
      if(seen.has(k.id))bad.push(k.id+': duplicate id');seen.add(k.id);if(!k.id.startsWith(c.id+'.')||!/^[A-D]\d+\.\d\d\.\d+$/.test(k.id))bad.push(k.id+': id format');
      ['t','idea','dg','rem'].forEach(f=>{if(!k[f])bad.push(k.id+': no '+f);});if(!k.check||!k.check.length)bad.push(k.id+': no check');
      (k.check||[]).forEach((q,i)=>{if(!q.q||!Array.isArray(q.a)||q.a.length<2||!(q.c>=0&&q.c<q.a.length)||!q.why)bad.push(k.id+' Q'+(i+1)+': malformed');});
      ((k.links||{}).lessons||[]).forEach(l=>{if(!LBY[l]&&!LATER.some(x=>x.id===l))bad.push(k.id+': unknown lesson '+l);});(k.see||[]).forEach(s=>{if(!ids.includes(s))bad.push(k.id+': see '+s+' missing');});});});});
    const nch=THP.reduce((a,p)=>a+p.ch.length,0);
    T('Content: '+THP.length+' parts, '+nch+' chapters, '+ids.length+' cards; every card complete',!bad.length,bad.slice(0,6).join(' · '));}
  T('Tier A parts A1–A4 are all there',['A1','A2','A3','A4'].every(id=>THP.some(p=>p.id===id)),THP.map(p=>p.id).join(' '));
  // 2. diagrams + takadimi counts
  {const bad=[];TH_ORDER.forEach(k=>{const h=thDiagram(k,k.dg);if(!/<svg/.test(h)||/can’t draw/.test(h))bad.push(k.id);});T('Every card’s diagram draws',!bad.length,bad.slice(0,8).join(' '));}
  {const rc=TH_ORDER.filter(k=>k.part.th==='R'&&k.dg.type==='count');const bad=rc.filter(k=>k.dg.kon===false||!/thkw/.test(thDiagram(k,k.dg)));T('Count grids show takadimi syllables ('+rc.length+' grids)',rc.length&&!bad.length,bad.map(k=>k.id).join(' '));}
  T('Takadimi: 8ths ta-di, 16ths ta-ka-di-mi, triplets ta-ki-da (“di” always halfway)',TH_SYL[2].join(' ')==='ta di'&&TH_SYL[4].join(' ')==='ta ka di mi'&&TH_SYL[3].join(' ')==='ta ki da'&&TH_SYL[4][2]===TH_SYL[2][1],'');
  // 3. Hear it plans
  {const bad=[];let n=0;TH_ORDER.forEach(k=>thHearSpecs(k).forEach((sp,i)=>{n++;try{const P0=thHearPlan(sp);if(!(P0.total>0)||P0.words.length!==P0.n*Math.round((P0.total-P0.cinS)/(P0.n*P0.stepS)))bad.push(k.id+':'+i);}catch(e){bad.push(k.id+':'+i+' '+e.message);}}));
    T('Every Hear it plays in time ('+n+' sounds), count words line up with steps',!bad.length,bad.slice(0,6).join(' '));}
  // 4. Try it: patterns valid, drawn, and scored by the normal engine (perfect → 100 % → Can play; silence → no)
  const tries=TH_ORDER.filter(k=>k.try);
  {const bad=[];tries.forEach(k=>k.try.ex.forEach((ex,i)=>{const spb=ex.steps||4*ex.sub,n=spb*ex.bars;Object.entries(ex.v).forEach(([v,s])=>{if(!LANES.includes(v)||s.length!==n||/[^.xXgorfd]/.test(s))bad.push(k.id+'.'+i+' '+v);});if(ex.st&&ex.st.length!==n)bad.push(k.id+'.'+i+' st');try{ntBuild(ex,400);}catch(e){bad.push(k.id+'.'+i+' notation');}}));
    T('Every Try pattern is valid and draws as notation ('+tries.reduce((a,k)=>a+k.try.ex.length,0)+' patterns)',!bad.length,bad.slice(0,6).join(' '));}
  const scoreTry=async(k,i,mode)=>{openTheoryTry(k.id,i);const ex=L.ex[exI];await startRun();const R=run;
    if(mode==='ok')R.evs.forEach(e=>{if(!e.listen){const fl=e.gr;if(fl)for(let g=fl;g>=1;g--)hit(e.v,40,e.t+state.lat-30*g,e.art);hit(e.v,e.ch==='X'?118:e.ch==='g'?28:80,e.t+state.lat,e.art);}});
    finish();const s=state.sessions[state.sessions.length-1];$('#prac').classList.add('hidden');L=null;return s;};
  {state.theory=JSON.parse(JSON.stringify(state.theory));const progBefore=JSON.stringify(state.prog),bad=[];let n=0,kinds=true;
    for(const k of tries)for(let i=0;i<k.try.ex.length;i++){n++;const s=await scoreTry(k,i,'ok');if(!s||s.kind!=='theory'||s.score!==100||(s.dyn!=null&&s.dyn<state.set.dynPass))bad.push(k.id+'.'+i+' '+(s&&s.score)+'/'+(s&&s.dyn));if(s&&s.id!=='th:'+k.id)kinds=false;}
    T('Every Try: a perfect run scores 100 % with the normal engine ('+n+' runs)',!bad.length,bad.slice(0,6).join(' '));
    T('A passing Try marks the card “Can play”',tries.every(k=>thSt(k.id)==='p'),'');
    const k0=tries[0];delete state.theory.cards[k0.id];const s0=await scoreTry(k0,0,'none');T('A silent Try scores 0 and doesn’t mark Can play',s0.score===0&&thSt(k0.id)!=='p',s0.score+'%');
    T('Theory tries never touch lesson progress (state.prog unchanged)',JSON.stringify(state.prog)===progBefore&&kinds,'');
    const tr=state.sessions.filter(s=>s.kind==='theory');T('Theory runs are kept out of lesson views and song readiness',tr.length>0&&tr.every(s=>!LBY[s.id])&&runsWhere().every(s=>s.kind!=='theory'),tr.length+' theory runs');
    state.sessions=state.sessions.filter(s=>s.kind!=='theory');}
  // 5. Check
  {const k=TH_ORDER.find(x=>x.check.length>=2);delete TH_ANS[k.id];delete state.theory.cards[k.id];thAnswer(k.id,0,(k.check[0].c+1)%k.check[0].a.length);k.check.forEach((q,i)=>i&&thAnswer(k.id,i,q.c));
    const wrong=thSt(k.id)!=='u';k.check.forEach((q,i)=>thAnswer(k.id,i,q.c));T('Check: a wrong answer doesn’t count, all right → Understood',wrong&&thSt(k.id)==='u',k.id);
    const bad=TH_ORDER.filter(x=>{delete TH_ANS[x.id];const c=state.theory.cards[x.id];if(c){delete c.u;}x.check.forEach((q,i)=>thAnswer(x.id,i,q.c));return !thKnown(x.id);});T('Every Check scores (all '+ids.length+' cards reach Understood)',!bad.length,bad.slice(0,6).map(x=>x.id).join(' '));}
  // 6. Remember deck with a fake clock
  {state.theory={cards:{},review:{},bookmarks:[],lastCard:null};const t0=Date.UTC(2026,10,15,8);thClock=t0;const k=TH_ORDER.find(x=>x.rem);
    thMark(k.id,'r',true);const r=state.theory.review[k.id];T('Reading a card puts its Remember line in the deck, due in 1 day',r&&r.due===t0+DAY&&r.step===0,'');
    thClock=t0+DAY-1000;const notYet=!thDue().includes(k.id);thClock=t0+DAY;const now=thDue().includes(k.id);T('Not due before 1 day, due at 1 day',notYet&&now,'');
    const steps=[];let ok=true;for(const d of [3,7,21,60]){const rr=thReview(k.id,true);steps.push(Math.round((rr.due-thClock)/DAY));thClock=rr.due;if(!thDue().includes(k.id))ok=false;}
    T('Got it: next reviews in 3, 7, 21, 60 days',JSON.stringify(steps)==='[3,7,21,60]'&&ok,steps.join(' '));
    const fin=thReview(k.id,true);thClock+=400*DAY;T('After the 60-day review the card retires',fin.done&&!thDue().includes(k.id),'');
    state.theory.review[k.id]={due:thClock,step:3,at:thClock};const ag=thReview(k.id,false);T('Again: back to 1 day',ag.step===0&&ag.due===thClock+DAY,'');
    const k2=TH_ORDER.filter(x=>x.rem)[1];thMark(k2.id,'r',true);thClock+=2*DAY;T('Due count on Home',thDue().length===2&&/2 due/.test(thHomeCard()),thDue().length+' due');
    thClock=null;}
  // 7. links: concept tags, lesson chips, nudge, search
  {T('Concept tags from exercise data (1.5.03 → 8th notes + backbeat; 2.1.04 → 16ths; 3.2.07 → ghost notes)',thTagsOf(LBY['1.5.03']).has('eighth')&&thTagsOf(LBY['1.5.03']).has('backbeat')&&thTagsOf(LBY['2.1.04']).has('sixteenth')&&(!LBY['3.2.07']||thTagsOf(LBY['3.2.07']).has('ghost')),[...thTagsOf(LBY['1.5.03'])].join(','));
    const cn=thCon(),bad=Object.entries(cn).filter(([k])=>k[0]!=='_').flatMap(([k,c])=>(c.cards||[]).filter(id=>/^A[1-4]\./.test(id)&&!THC[id]).map(id=>k+'→'+id));T('Concept map points at real cards',!bad.length,bad.slice(0,5).join(' '));
    const hb=Object.entries(cn._lessons||{}).filter(([id])=>!LBY[id]&&!LATER.some(x=>x.id===id)).map(x=>x[0]);T('Hand map lessons exist',!hb.length,hb.join(' '));
    state.theory={cards:{},review:{},bookmarks:[],lastCard:null};const ch=thLessonChips('1.5.03');T('Lesson page shows “New idea here” chips for unread cards',/New idea here/.test(ch),'');
    thLessonCards('1.5.03').forEach(c=>thMark(c,'r',true));T('…and ✓ chips once read',!/New idea here/.test(thLessonChips('1.5.03'))&&/✓/.test(thLessonChips('1.5.03')),'');
    const withCards=LESSONS.filter(l=>l.type==='play'&&l.lv<=2&&thLessonCards(l.id).length).length;T('Lessons in Levels 0–2 with a theory link',withCards>=20,withCards+' lessons');
    state.theory={cards:{},review:{},bookmarks:[],lastCard:null};const n1=thNudge(),h1=thHomeCard(),n2=thNudge();T('Home: one theory nudge a day (same card all day)',n1&&n2&&n1.id===n2.id&&(h1.match(/data-thnudgeoff/g)||[]).length===1,n1&&n1.id);
    state.theory.nudgeOff=today();T('…and none after “Not today”',!thNudge(),'');
    T('Search finds cards (“ghost”, “bpm”)',thSearch('ghost').length>0&&thSearch('bpm').length>0,thSearch('ghost').length+' / '+thSearch('bpm').length);}
  // 8. never blocks: every lesson page still opens with no theory read
  {state.theory={cards:{},review:{},bookmarks:[],lastCard:null};const bad=[];for(const l of LESSONS){try{renderLesson(l.id);if(l.type==='play'&&!view.querySelector('[data-play]'))bad.push(l.id);}catch(e){bad.push(l.id+' '+e.message);}}
    T('No lesson is ever blocked (all '+LESSONS.length+' lesson pages open, Practise there)',!bad.length,bad.slice(0,5).join(' '));}
  // 9. data: back-fill, merge, testing mode
  {const old=normaliseState({v:1,prog:{},done:{},sessions:[],songs:[],savedAt:1});T('Old saves get state.theory back-filled',old.theory&&old.theory.cards&&old.theory.review&&Array.isArray(old.theory.bookmarks),'');
    const A={cards:{'A1.01.1':{r:5,updatedAt:5},'A2.02.1':{r:3,u:4,updatedAt:4}},review:{'A1.01.1':{due:100,step:1,at:50}},bookmarks:['A1.01.1'],bmAt:10,lastCard:'A1.01.1',lastAt:7};
    const B={cards:{'A1.01.1':{r:2,p:9,updatedAt:9}},review:{'A1.01.1':{due:300,step:2,at:80}},bookmarks:[],bmAt:20,lastCard:'A2.02.1',lastAt:9};
    const M=thMerge(A,B);T('Sync merge: a status reached on either device is kept',M.cards['A1.01.1'].r===2&&M.cards['A1.01.1'].p===9&&M.cards['A2.02.1'].u===4,'');
    T('Sync merge: the later review and bookmark list win',M.review['A1.01.1'].step===2&&M.bookmarks.length===0&&M.lastCard==='A2.02.1','');
    const mm=mergeStates(normaliseState({v:1,savedAt:1,theory:A}),normaliseState({v:1,savedAt:2,theory:B}));T('mergeStates carries theory',mm.theory&&mm.theory.cards['A1.01.1'].p===9,'');
    T('Testing mode: nothing is written',!SANDBOX||(()=>{let w=0;const o=storeSave;storeSave=()=>{w++;};try{thMark(TH_ORDER[3].id,'r');thReview(TH_ORDER[3].id,true);}finally{storeSave=o;}return w===0;})(),SANDBOX?'sandbox on':'not in testing mode');}
  if(typeof thT3Tests==='function')out.push(...await thT3Tests());
  if(typeof thT4Tests==='function')out.push(...await thT4Tests());
  // restore
  const k=JSON.parse(keep);state.theory=k.theory;state.days=k.days;state.prog=k.prog;state.sessions=state.sessions.slice(0,k.n);state.set=k.set;thFill(state);Object.keys(TH_ANS).forEach(x=>delete TH_ANS[x]);
  VP.theory=JSON.parse(keepVP);cur=keepCur;render();
  return out;
}
window.theoryTests=theoryTests;
