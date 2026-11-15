/* DrumPath — P1b Quick look + learn before test (D-038, build/p1b-brief.md; build rules D-039).
   · ⓘ Quick look: a bottom sheet with a card's idea, diagram / ▶ Hear it, Remember line, Read full card · Remember this ·
     Used in…, from every Today item, ear question, theory recap, the practice-screen header and "Fix it with theory".
   · Tappable terms: known terms get a dotted underline on their first appearance per screen → Quick look;
     More › Theory › A–Z glossary (recently looked up first); the header search finds terms.
   · Learn before you're tested: a 30-second primer shows once, automatically, before a Today item whose idea is new.
   · Ear game "middle way": question kinds unlock with the cards you've read; one Peek from the next locked kind.
   · Revision: every lookup and wrong answer queues its card for tomorrow's Revise slot; "Remember this" = the deck now.
   · Session phases Learn → Practise → Check → Revise; Used in / Built on cross-links; Progress › Theory "Looked up most".
   Content comes from existing cards (no new card text). New fields only (state.theory.look/miss/primed,
   state.plan.revise); testing mode saves nothing; lesson scoring untouched. */
'use strict';
ICONS.info='<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.7v.2"/>';
const QL_MAXTS=20, QL_QMAX=12;
const qlT=()=>thFill(state).theory;
const qlI=(refs,lab)=>refs&&refs.length?`<button class="sm ghost qli" data-ql="${esc([].concat(refs).join(','))}" title="Quick look${lab?': '+esc(lab):''}" aria-label="Quick look">${icon('info',16)}</button>`:'';

/* ---------- refs: a card id (A1.02.3) or a concept tag (swing) ---------- */
function qlCardOf(ref){if(!ref)return null;if(THC[ref])return ref;const cs=thCardsFor(ref);return cs.find(c=>!thKnown(c))||cs[0]||null;}
function qlName(ref){return THC[ref]?THC[ref].t:thConceptName(ref);}
function qlRefsOf(cid){return [cid,...thCardConcepts(cid)];}

/* ---------- lookups, wrong answers, the Revise queue ---------- */
function qlPush(f,id){const t=qlT(),a=t[f][id]||(t[f][id]=[]);a.push(thNow());if(a.length>QL_MAXTS)a.splice(0,a.length-QL_MAXTS);}
const qlDayAdd=(d,n)=>{const x=pdate(d);x.setDate(x.getDate()+n);return dkey(x);};
function qlQueue(id,day){if(!THC[id])return false;const r=P1D().revise,d=day||qlDayAdd(p1Day(),1),a=r[d]||(r[d]=[]);
  const cut=qlDayAdd(p1Day(),-30);Object.keys(r).forEach(k=>{if(k<cut)delete r[k];});
  if(a.includes(id)||a.length>=QL_QMAX)return false;a.push(id);return true;}
function qlLook(id){if(!THC[id])return;qlPush('look',id);qlQueue(id);save();}
// a wrong answer (ear game, Check, Fix it with theory): counted as a miss and queued; a wrong peek is only queued
function qlWrong(id,o={}){if(!THC[id])return;if(!o.peek)qlPush('miss',id);qlQueue(id);if(!o.quiet)save();}
function qlInDeck(id){const r=qlT().review[id];return !!(r&&!r.done&&r.due!=null&&r.due<=thNow());}
function qlRemember(id){if(!THC[id])return;const t=qlT(),r=t.review[id];
  if(!r||r.done)t.review[id]={due:thNow(),step:0,at:thNow()};else r.due=Math.min(r.due==null?thNow():r.due,thNow());save();}
// the Revise slot for a day: cards queued for it, plus earlier days (up to 7) whose Revise wasn't done
function qlRevDone(d){const dd=P1D().days[d]||{};return Object.values(dd).some(p=>p&&p.done&&p.done.revise);}
function qlReviseCards(day){day=day||p1Day();const r=P1D().revise,from=qlDayAdd(day,-7),out=[];
  Object.keys(r).sort().forEach(d=>{if(d>day||d<from||(d!==day&&qlRevDone(d)))return;(r[d]||[]).forEach(id=>{if(THC[id]&&!out.includes(id))out.push(id);});});return out;}
function qlReviseItem(){const rc=qlReviseCards();return rc.length?{k:'revise',key:'revise',mins:Math.min(3,Math.max(1,Math.round(rc.length*0.5))),t:'Revise · '+p1Pl(rc.length,'card'),why:'What you looked up or missed lately, as short recaps'}:null;}

/* ---------- session phases ---------- */
const QL_PHASE={card:'Learn',tap:'Practise',warm:'Practise',lesson:'Practise',focus:'Practise',review:'Practise',mix:'Practise',song:'Practise',free:'Practise',ear:'Check',revise:'Revise',deck:'Revise',journal:'Revise'};
const qlPhase=k=>QL_PHASE[k]||'Practise';

/* ---------- ear game: kinds unlocked by cards (order = unlock order; the next locked kind is the peek) ---------- */
const QL_EAR=[
  {k:'snare',c:'A1.02.2',cards:['A1.02.1','A1.02.2','A1.02.3'],n:'which beat has the snare'},
  {k:'strong',c:'A1.02.3',cards:['A1.02.3'],n:'the strong beat'},
  {k:'bars',c:'A1.06.1',cards:['A1.06.1','A1.06.2','A1.06.3','A1.06.4'],n:'counting bars'},
  {k:'tempo',c:'A1.03.1',cards:['A1.03.1','A1.03.2','A1.03.3','A1.03.4'],n:'faster or slower'},
  {k:'swing',c:'B2.04.1',cards:['B2.04.1','B2.04.2','B2.04.3','B2.04.4'],n:'straight or swing'},
  {k:'meter',c:'B3.02.2',cards:['B3.02.1','B3.02.2'],n:'3/4 or 6/8'}];
function qlEarState(){const cs=qlT().cards,un=[],locked=[],since={};
  QL_EAR.forEach(x=>{const ts=x.cards.map(id=>cs[id]&&cs[id].r).filter(Boolean);if(ts.length){un.push(x);since[x.k]=Math.min(...ts);}else locked.push(x);});
  return{un,locked,peek:locked[0]||null,since};}
const qlEarKind=k=>QL_EAR.find(x=>x.k===k);
// "New: counting bars" the day it unlocks and the next day
function qlEarNew(k,st){const t=(st||qlEarState()).since[k];if(!t)return false;const d=dkey(new Date(t));return d>=qlDayAdd(p1Day(),-1);}
function qlEarWhy(){const s=qlEarState();return (s.un.length?s.un.map(x=>x.n[0].toUpperCase()+x.n.slice(1)).join(' · '):'Read a card to unlock questions')+(s.peek?' · peek: '+s.peek.n:'');}
function qlPeekPrimer(id){const k=THC[id];if(!k)return '';const t=qlT();if(!t.primed[id]){t.primed[id]=thNow();save();}const hs=thHearSpecs(k);
  return `<div class="card qlpeek"><div class="note-k">Peek · a new idea first, 30 seconds</div><b>${esc(k.t)}</b><p class="thidea qlpi">${esc(k.idea)}</p><div class="row qlpr">${hs.map((h,i)=>`<button class="sm" data-thhear="${k.id}:${i}" data-lab="${h.l?esc(h.l):'▶ Hear it'}">${h.l?esc(h.l):'▶ Hear it'}</button>`).join('')}${qlI([id],k.t)}</div></div>`;}

/* ---------- what each Today item is built on ---------- */
function qlLessonRefs(id){if(!LBY[id])return [];const out=[];thPanelRows(id).forEach(r=>{const ref=r.tag||r.id;if(!out.includes(ref))out.push(ref);});return out.slice(0,4);}
function qlSongRefs(sid){let s=null;try{s=songById(sid);}catch(_){}if(!s)return [];const out=[];
  songTags(s).forEach(t=>{if(LBY[t.id])thTags(t.id).forEach(g=>{if(thCardsFor(g).length&&!out.includes(g))out.push(g);});});return out.slice(0,4);}
function qlItemRefs(it){
  if(!it)return [];
  if(it.k==='card')return THC[it.card]?[it.card]:[];
  if(it.k==='ear'){const s=qlEarState();return [...s.un.map(x=>x.c),...(s.peek?[s.peek.c]:[])];}
  if(it.k==='tap')return LBY[it.src]?qlLessonRefs(it.src):/^th:/.test(it.src||'')&&THC[it.src.slice(3)]?[it.src.slice(3)]:[];
  if(it.k==='song')return qlSongRefs(it.song);
  if(['deck','revise','journal','free'].includes(it.k))return [];
  return qlLessonRefs(p1ItemLesson(it));
}
function qlBuiltOn(it){const rs=qlItemRefs(it).filter(r=>qlCardOf(r));if(!rs.length||it.k==='card')return '';
  return `<div class="qlbo"><span class="mut">Built on</span>${rs.slice(0,3).map(r=>`<button class="qlchip" data-ql="${esc(r)}">${esc(qlName(r))}</button>`).join('')}</div>`;}
// the ⓘ on a Today row: the item's ideas; the deck and the Revise slot list their cards
function qlItemBtn(it){if(it.k==='deck')return thDue().length?`<button class="sm ghost qli" data-qllist="deck" title="Quick look: the cards due" aria-label="Quick look">${icon('info',16)}</button>`:'';
  if(it.k==='revise')return qlReviseCards().length?`<button class="sm ghost qli" data-qllist="revise" title="Quick look: the cards to revise" aria-label="Quick look">${icon('info',16)}</button>`:'';
  return qlI(qlItemRefs(it).filter(r=>qlCardOf(r)),it.t);}

/* ---------- learn before you're tested: a primer once, before an item whose idea is new ---------- */
function qlPrimerCard(it){if(!it||['card','deck','revise','journal','ear'].includes(it.k))return null;const t=qlT();
  for(const ref of qlItemRefs(it)){const ids=THC[ref]?[ref]:thCardsFor(ref).slice(0,1);for(const id of ids)if(!thSt(id)&&!t.primed[id])return id;}return null;}
function qlPrimeItem(it){const id=qlPrimerCard(it);if(!id||run)return null;return qlPrimer(id);}
function qlPrimer(id){const k=THC[id];if(!k)return null;qlT().primed[id]=thNow();save();thHearStop();const hs=thHearSpecs(k);
  const m=openSheet('Learn first · 30 seconds',`<div class="qlbody"><div class="mut qlk">New idea · ${esc(k.part.id+' '+k.chap.t)}</div><h2 class="qlt">${esc(k.t)}</h2><p class="thidea">${esc(k.idea)}</p>
   ${hs.length?`<div class="thact">${hs.map((h,i)=>`<button class="sm" data-thhear="${k.id}:${i}" data-lab="${h.l?esc(h.l):'▶ Hear it'}">${h.l?esc(h.l):'▶ Hear it'}</button>`).join('')}</div>`:''}
   ${k.rem?`<div class="threm"><span class="note-k">Remember</span><span>${esc(k.rem)}</span></div>`:''}
   <div class="row qlbtns"><button class="pri" data-qlok>Got it</button><button class="ghost" data-qlok>Skip</button><span class="sp"></span><button class="sm ghost" data-qlfull="${k.id}">Read full card</button></div></div>`);
  m.classList.add('qlprimer');m.dataset.card=id;return m;}

/* ---------- the Quick look sheet ---------- */
const QL={refs:[],i:0,used:false};
function qlOpen(refs,i){
  refs=(Array.isArray(refs)?refs:String(refs||'').split(',')).map(x=>x.trim()).filter(r=>qlCardOf(r));if(!refs.length)return null;
  if(run){toast('Quick look opens after the run');return null;}
  QL.refs=[...new Set(refs)];QL.i=Math.min(i||0,QL.refs.length-1);QL.used=false;thHearStop();qlLook(qlCardOf(QL.refs[QL.i]));
  const m=openSheet('Quick look',`<div class="qlbody">${qlHtml()}</div>`);m.classList.add('qlsheet');
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))thHearStop();});return m;
}
function qlHtml(){
  const id=qlCardOf(QL.refs[QL.i]),k=THC[id],hs=thHearSpecs(k),inDeck=qlInDeck(id);
  return `${QL.refs.length>1?`<div class="chips qlchips">${QL.refs.map((r,j)=>`<button class="sm ${j===QL.i?'pri':'ghost'}" data-qlsw="${j}">${esc(qlName(r))}</button>`).join('')}</div>`:''}
   <div class="mut qlk">${esc(k.part.id+' · '+k.chap.t)} · ${thChip(id)}</div><h2 class="qlt">${esc(k.t)}</h2><p class="thidea">${esc(k.idea)}</p>
   ${k.dg?thDiagram(k,k.dg,k.id):''}
   ${hs.length?`<div class="thact">${hs.map((h,j)=>`<button class="sm" data-thhear="${k.id}:${j}" data-lab="${h.l?esc(h.l):'▶ Hear it'}">${h.l?esc(h.l):'▶ Hear it'}</button>`).join('')}</div>`:''}
   ${k.rem?`<div class="threm"><span class="note-k">Remember</span><span>${esc(k.rem)}</span></div>`:''}
   <div class="row qlbtns"><button class="sm" data-qlfull="${k.id}">Read full card</button>${k.rem?`<button class="sm${inDeck?' ghost':''}" data-qlrem="${k.id}">${inDeck?'In your deck ✓':'Remember this'}</button>`:''}<button class="sm ghost" data-qlused="${k.id}" aria-expanded="${QL.used}">Used in…</button></div>
   ${QL.used?`<div class="qlused">${qlUsedHtml(k.id)}</div>`:''}
   <p class="mut qlnote">Looked up, so it comes back as a short recap in tomorrow’s Revise.</p>`;
}
// Used in: today's items · lessons · songs
function qlTodayUsing(id){let pl=null;try{pl=p1Plan(p1Mode(),p1Mins(),{keep:true});}catch(_){}if(!pl)return [];const set=new Set(qlRefsOf(id));
  return pl.items.filter(it=>qlItemRefs(it).some(r=>set.has(r)||qlCardOf(r)===id)).map(it=>it.t);}
function qlUsedHtml(id){
  const k=THC[id],td=qlTodayUsing(id),ls=thCardLessons(k).filter(x=>LBY[x]&&LBY[x].type==='play'),prac=!$('#prac').classList.contains('hidden');
  let songs=[];try{const seen=new Set();ls.forEach(l=>songsUsing(l).forEach(s=>{if(!seen.has(s.id)){seen.add(s.id);songs.push(s);}}));}catch(_){}
  const row=(h,b)=>`<div class="qlur"><span class="note-k">${h}</span><div>${b}</div></div>`;
  return row('Today',td.length?td.map(esc).join(' · '):'<span class="mut">not in today’s plan</span>')+
    row('Lessons',ls.length?ls.slice(0,8).map(x=>prac?`<span class="idx">${x}</span>`:`<button class="sm ghost" data-open="${x}">${x}</button>`).join(' ')+(ls.length>8?` <span class="mut">+${ls.length-8}</span>`:''):'<span class="mut">none yet</span>')+
    row('Songs',songs.length?songs.slice(0,4).map(s=>prac?esc(s.title):`<button class="sm ghost" data-song="${esc(s.id)}">${esc(s.title)}</button>`).join(' ')+(songs.length>4?` <span class="mut">+${songs.length-4}</span>`:''):'<span class="mut">none yet</span>');
}
// one line on every card (side column): Used in today's items · lessons · songs
function qlUsedLine(k){const td=qlTodayUsing(k.id),ls=thCardLessons(k).filter(x=>LBY[x]&&LBY[x].type==='play');let ns=0;try{const seen=new Set();ls.forEach(l=>songsUsing(l).forEach(s=>seen.add(s.id)));ns=seen.size;}catch(_){}
  if(!td.length&&!ls.length&&!ns)return '';
  return `<div class="thwl qlusedl"><span class="note-k">Used in</span> <span>${[td.length?'Today: '+td.map(esc).join(' · '):'',ls.length?p1Pl(ls.length,'lesson'):'',ns?p1Pl(ns,'song'):''].filter(Boolean).join(' · ')}</span></div>`;}
// a list of cards (the deck due now, the Revise slot) → Quick look each
function qlOpenList(kind,list){const ids=list||(kind==='deck'?thDue():qlReviseCards());if(!ids.length)return null;
  return openSheet(kind==='deck'?'Remember deck · due now':'Revise · cards queued',`<div class="list">${ids.slice(0,20).map(id=>`<div class="lrow"><span class="idx">${id}</span><span style="flex:1;min-width:0"><b>${esc(THC[id].t)}</b></span>${qlI([id],THC[id].t)}</div>`).join('')}</div>`);}

/* ---------- the Revise slot's own screen (Today › Revise) ---------- */
function qlReviseHtml(){const ids=qlReviseCards();
  return `<h1>Revise</h1><p class="sub">Short recaps of what you looked up or got wrong. Read each one (▶ where there’s a sound), then Done. <b>Remember this</b> puts a card in your Remember deck.</p>
  ${ids.length?ids.map(id=>{const k=THC[id],hs=thHearSpecs(k),dk=qlInDeck(id);return `<div class="card qlrv"><div class="mut qlk">${esc(k.part.id+' · '+k.chap.t)}</div><b>${esc(k.t)}</b><div class="threm"><span class="note-k">Remember</span><span>${esc(k.rem||k.idea)}</span></div>
     <div class="row qlpr">${hs.slice(0,2).map((h,i)=>`<button class="sm" data-thhear="${k.id}:${i}" data-lab="${h.l?esc(h.l):'▶ Hear'}">${h.l?esc(h.l):'▶ Hear'}</button>`).join('')}${k.rem?`<button class="sm ${dk?'ghost':''}" data-qlrem="${id}">${dk?'In your deck ✓':'Remember this'}</button>`:''}<span class="sp"></span>${qlI([id],k.t)}</div></div>`;}).join(''):'<div class="card mut">Nothing to revise today. Lookups and wrong answers come back here the next day.</div>'}
  <div class="row" style="margin-top:12px"><span class="sp"></span><button class="pri" data-qlrvdone>Done ›</button></div>`;}
function qlReviseDone(){thHearStop();const it=p1Cur();
  if(it&&it.k==='revise'){p1Mark(it,'done');p1Next();return;}
  const pl=p1Plan(p1Mode(),p1Mins());if(!pl.done.revise){pl.done.revise=p1Now();p1Act();}save();go('home');}

/* ---------- practice screen header: ⓘ next to the Theory chip ---------- */
function qlPracRefs(){if(!L||L.calib)return [];if(L.theory)return THC[L.theory]?[L.theory]:[];if(L.tap)return LBY[L.src]?qlLessonRefs(L.src):/^th:/.test(L.src||'')?[L.src.slice(3)]:[];return LBY[L.id]?qlLessonRefs(L.id):[];}
function qlPracSync(){const el=$('#qlpw');if(!el)return;const rs=qlPracRefs().filter(r=>qlCardOf(r));el.innerHTML=rs.length?qlI(rs,'the ideas in this exercise'):'';}

/* ---------- tappable terms (first appearance per screen) ---------- */
// [shown name, pattern, ref]: refs are concept tags or card ids from theory/*.js (no new card text)
const QL_TERMS=[['Accent','accents?','accent'],['Backbeat','backbeats?','backbeat'],['Bar','bars?|barlines?','bars'],['Beat','beats?','A1.02.2'],['BPM','BPM','A1.03.2'],
  ['Chord','chords?','chords'],['Click','click','click'],['Count-in','count-ins?','countin'],['Crash on 1','crash on (?:“1”|1)','crash1'],['Drag','drags?','drag'],['Dragging','dragging','A1.09.3'],
  ['Drum key','drum key','drumkey'],['Dynamics','dynamics','dynamics'],['Dotted note','dotted notes?','dotted'],['8th notes','8th notes?|8ths','eighth'],['Fill','fills?','fill'],['Flam','flams?','flam'],
  ['Ghost note','ghost notes?','ghost'],['Groove','grooves?','groove'],['Half-time','half-time','halftime'],['Konnakol','konnakol','konnakol'],['Open hi-hat','open hi-hats?','openhh'],
  ['Phrase','phrases?','phrase'],['Pulse','pulse','pulse'],['Quarter note','quarter notes?','quarter'],['Repeat sign','repeat signs?','repeat'],['Rim / cross-stick','cross-stick|rim ?clicks?|rimshots?','rim'],
  ['Rudiment','rudiments?','rudiments'],['Rushing','rushing','A1.09.2'],['16th notes','16th notes?|16ths','sixteenth'],['Sticking','sticking','sticking'],['Subdivision','subdivisions?','A1.08.1'],
  ['Swing','swing|swung|shuffle','swing'],['Syncopation','syncopation|syncopated','syncopation'],['Takadimi','takadimi','A1.08.4'],['Tempo','tempos?','A1.03.1'],['Tihai','tihai','tihai'],
  ['Time signature','time signatures?','A1.07.1'],['Triplet','triplets?','triplet'],['12-bar blues','12-bar blues','blues'],['4/4','4/4','meter44'],['3/4','3/4','meter34'],['6/8','6/8|12/8','compound']];
let QL_RE=null;
function qlTermList(){return QL_TERMS.filter(x=>qlCardOf(x[2]));}
function qlRe(){if(QL_RE)return QL_RE;const ts=qlTermList().map(x=>({x,re:new RegExp('^(?:'+x[1]+')$','i')}));
  const alt=qlTermList().map(x=>x[1]).sort((a,b)=>b.length-a.length).join('|');QL_RE={all:new RegExp('(^|[^\\w/-])('+alt+')(?![\\w/-])','gi'),ts};return QL_RE;}
const QL_SKIP='button,a,input,textarea,select,label,svg,h1,h2,h3,b,strong,code,.chip,.idx,nav,.crumbs,.note-k,.lrow,.tap,.qlsheet,.thans,.p1n,.thdg,.thbig,.thsnip,.mtile,.qlk,.p1clock,[data-noterms],[data-ql],[data-thcard],[data-open],[data-song],[data-thgo],[data-nav],[data-act],[data-p1go],[data-run],[data-day],[data-p1],[data-thquad],[contenteditable]';
const QL_SCREENS=['home','practise','today','lessons','theory','songs','progress'];
function qlTerms(root){
  try{if(!root||!QL_SCREENS.includes(cur))return 0;const R=qlRe(),used=new Set();let n=0;
    const here=cur==='theory'&&VP.theory&&VP.theory.mode==='card'?VP.theory.card:null;
    const skipRef=ref=>here&&(ref===here||thCardsFor(ref).includes(here));
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:x=>x.textContent.trim().length>1&&x.parentElement&&!x.parentElement.closest(QL_SKIP)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    const nodes=[];let x;while((x=tw.nextNode()))nodes.push(x);
    for(let node of nodes){let guard=0;
      while(node&&guard++<6){R.all.lastIndex=0;let m,hitAt=-1,ref=null,len=0;const s=node.textContent;
        while((m=R.all.exec(s))){const w=m[2],tm=R.ts.find(t=>t.re.test(w));if(tm&&!used.has(tm.x[2])&&!skipRef(tm.x[2])){hitAt=m.index+m[1].length;ref=tm.x[2];len=w.length;break;}}
        if(hitAt<0)break;used.add(ref);n++;
        const mid=node.splitText(hitAt),rest=mid.splitText(len),sp=document.createElement('span');sp.className='qlterm';sp.dataset.ql=ref;sp.setAttribute('role','button');sp.tabIndex=0;sp.title='Quick look: '+qlName(ref);
        mid.parentNode.replaceChild(sp,mid);sp.appendChild(mid);node=rest;}}
    return n;}catch(e){console.warn('terms',e);return 0;}
}

/* ---------- A–Z glossary (More › Theory) + header search ---------- */
function qlGloss(){const seen=new Set(),out=[];qlTermList().forEach(x=>{const id=THC[x[2]]?x[2]:thCardsFor(x[2])[0];if(seen.has(x[0]))return;seen.add(x[0]);out.push({w:x[0],ref:x[2],id});});
  return out.sort((a,b)=>a.w.replace(/^\d+\S*\s*/,'').localeCompare(b.w.replace(/^\d+\S*\s*/,''),undefined,{sensitivity:'base'}));}
const qlFirst=s=>{const m=String(s||'').match(/^.*?[.!?](\s|$)/);return (m?m[0]:s).trim();};
function qlGlossRow(g){const k=THC[g.id];return `<div class="lrow qlg" data-ql="${esc(g.ref)}"><span style="flex:1;min-width:0"><b>${esc(g.w)}</b><span class="mut qlgi"> ${esc(qlFirst(k.idea))}</span></span>${icon('info',16)}</div>`;}
function qlRecent(n){const lk=qlT().look,a=Object.entries(lk).filter(([id,ts])=>THC[id]&&ts.length).map(([id,ts])=>[id,ts[ts.length-1]]).sort((x,y)=>y[1]-x[1]);return a.slice(0,n||6).map(x=>x[0]);}
function qlGlossary(){
  const gl=qlGloss(),rec=qlRecent(6),q=(VP.theory.gq||'').trim().toLowerCase(),list=q?gl.filter(g=>(g.w+' '+THC[g.id].t+' '+THC[g.id].idea).toLowerCase().includes(q)):gl;
  const by={};list.forEach(g=>{const L0=(g.w.match(/[A-Za-z]/)||['#'])[0].toUpperCase();(by[L0]=by[L0]||[]).push(g);});
  view.innerHTML=thCrumbs([['Theory',{mode:'home'}],['A–Z glossary',null]])+`<h1>A–Z glossary</h1><p class="sub">${gl.length} terms from the theory course. Tap one for a Quick look; a dotted underline anywhere in the app does the same.</p>
   <input id="qlgq" placeholder="Find a term, e.g. “ghost”" value="${esc(VP.theory.gq||'')}" style="width:100%;max-width:420px;margin:4px 0 10px">
   ${rec.length&&!q?`<h2>Recently looked up</h2><div class="list">${rec.map(id=>`<div class="lrow qlg" data-ql="${id}"><span class="idx">${id}</span><span style="flex:1;min-width:0"><b>${esc(THC[id].t)}</b></span>${icon('info',16)}</div>`).join('')}</div>`:''}
   <div id="qlgl">${Object.keys(by).sort().map(L0=>`<h2 class="qlgh">${L0}</h2><div class="list">${by[L0].map(qlGlossRow).join('')}</div>`).join('')||'<p class="mut">No term matches.</p>'}</div>`;
  const inp=$('#qlgq');inp.addEventListener('input',()=>{VP.theory.gq=inp.value;const p=inp.selectionStart;render();const i2=$('#qlgq');if(i2){i2.focus();try{i2.setSelectionRange(p,p);}catch(_){}}});
}
function qlSearchHtml(t){t=String(t||'').trim().toLowerCase();if(t.length<2)return '';
  const gs=qlGloss().filter(g=>g.w.toLowerCase().includes(t)||THC[g.id].t.toLowerCase().includes(t)).slice(0,8);
  const cs=thSearch(t).filter(k=>!gs.some(g=>g.id===k.id)).slice(0,5);
  return (gs.length?`<h2>Theory terms</h2><div class="list">${gs.map(qlGlossRow).join('')}</div>`:'')+(cs.length?`<h2>Theory cards</h2><div class="list">${cs.map(k=>`<div class="lrow" data-ql="${k.id}"><span class="idx">${k.id}</span><span style="flex:1;min-width:0"><b>${esc(k.t)}</b></span>${thChip(k.id)}</div>`).join('')}</div>`:'');}

/* ---------- Progress › Theory: looked up most (lookups + misses, last 30 days) ---------- */
function qlTop(n,now){now=now||thNow();const from=now-30*DAY,t=qlT(),by={};
  ['look','miss'].forEach(f=>Object.entries(t[f]).forEach(([id,ts])=>{if(!THC[id])return;const c=ts.filter(x=>x>=from&&x<=now).length;if(!c)return;const cs=thCardConcepts(id),keys=cs.length?cs:[id];
    keys.forEach(kk=>{const o=by[kk]||(by[kk]={ref:kk,look:0,miss:0});o[f]+=c;});}));
  return Object.values(by).sort((a,b)=>(b.look+b.miss)-(a.look+a.miss)||b.miss-a.miss||String(a.ref).localeCompare(b.ref)).slice(0,n||5);}
function qlTopHtml(){const top=qlTop(5);
  return `<h2>Looked up most <span class="mut" style="font-size:14px;font-weight:600">last 30 days</span></h2>${top.length?`<div class="list">${top.map(o=>`<div class="lrow"><span style="flex:1;min-width:0"><b>${esc(qlName(o.ref))}</b><span class="mut" style="font-size:13px"> · ${[o.look?p1Pl(o.look,'lookup'):'',o.miss?p1Pl(o.miss,'miss').replace('misss','misses'):''].filter(Boolean).join(' · ')}</span></span>${qlI([o.ref],qlName(o.ref))}</div>`).join('')}</div>`:'<div class="card mut">Nothing looked up yet. Every ⓘ and every wrong answer shows up here, and comes back in the next day’s Revise.</div>'}`;}

/* ---------- events (capture, so a term inside a tappable row opens Quick look, not the row) ---------- */
document.addEventListener('click',e=>{
  const T=e.target;let b;const stop=()=>{e.preventDefault();e.stopPropagation();};
  if((b=T.closest('[data-qlsw]'))){stop();QL.i=+b.dataset.qlsw;QL.used=false;thHearStop();qlLook(qlCardOf(QL.refs[QL.i]));const bd=b.closest('.qlbody');if(bd)bd.innerHTML=qlHtml();return;}
  if((b=T.closest('[data-ql]'))){stop();qlOpen(b.dataset.ql);return;}
  if((b=T.closest('[data-qllist]'))){stop();qlOpenList(b.dataset.qllist);return;}
  if((b=T.closest('[data-qlfull]'))){stop();thCardSheet(b.dataset.qlfull);return;}
  if((b=T.closest('[data-qlrem]'))){stop();qlRemember(b.dataset.qlrem);b.textContent='In your deck ✓';b.classList.add('ghost');toast('In your Remember deck now');return;}
  if((b=T.closest('[data-qlused]'))){stop();QL.used=!QL.used;const bd=b.closest('.qlbody');if(bd)bd.innerHTML=qlHtml();return;}
  if(T.closest('[data-qlok]')){stop();thHearStop();const m=T.closest('.modal');if(m)m.remove();return;}
  if(T.closest('[data-qlrvdone]')){stop();qlReviseDone();return;}
  if(T.closest('[data-qlt]')){stop();(async()=>{const el=$('#qltests');el.innerHTML='Running…';const t=await p1bTests();const e2=$('#qltests')||el;e2.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>Quick look (P1b): ${t.filter(x=>x.pass).length}/${t.length} pass</b></div>`+t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');})();return;}
},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('qlterm')){e.preventDefault();qlOpen(e.target.dataset.ql);}});

/* ---------- tests (?test=1 › Settings › Today › Run Quick-look tests) ---------- */
async function p1bTests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const keep=JSON.stringify({plan:state.plan,journal:state.journal,days:state.days,prog:state.prog,done:state.done,theory:state.theory,set:state.set}),keepN=state.sessions.slice(),keepVP=JSON.stringify({t:VP.today,th:VP.theory,pr:VP.progress}),keepCur=cur,keepMem=JSON.stringify(P1_MEM),keepSES=SES;
  const lsBefore=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();
  const day0=new Date(2026,10,9,9).getTime(),setClock=t=>{p1Clock=t;thClock=t;};
  const fresh=()=>{closeSheets();state.plan={days:{},act:{},rev:{}};p1Fill(state);state.journal={};state.days={};state.prog={};state.sessions=[];state.theory={cards:{},review:{},bookmarks:[],lastCard:null};thFill(state);SES=null;setClock(day0);EAR.qs=[];};
  const rd=(...ids)=>ids.forEach(id=>thMark(id,'r',true));
  const kinds=()=>qlEarState().un.map(x=>x.k).join(' ');
  try{
  // 1. unlock rules, card by card
  {fresh();const s0=qlEarState();T('Nothing read: no kind unlocked, the peek is “which beat has the snare”',!s0.un.length&&s0.peek&&s0.peek.k==='snare','');
    const q0=p1EarNew(5);T('…so the round is just the peek (with its primer)',q0.length===1&&q0[0].peek&&q0[0].card==='A1.02.2',q0.map(q=>q.k).join(' '));
    const want={'A1.02.1':'snare','A1.02.2':'snare','A1.02.3':'snare strong','A1.06.1':'bars','A1.06.4':'bars','A1.03.1':'tempo','A1.03.2':'tempo','B2.04.1':'swing','B2.04.3':'swing','B3.02.1':'meter','B3.02.2':'meter'};
    const bad=Object.entries(want).filter(([id,k])=>{fresh();rd(id);return kinds()!==k;}).map(x=>x[0]);T('Each kind unlocks with its own cards (A1.02 → snare, A1.02.3 → strong, A1.06 → bars, A1.03 → tempo, B2.04 → swing, B3.02 → meter)',!bad.length,bad.join(' ')||Object.keys(want).length+' cards');
    T('Card ids exist in theory/*.js',QL_EAR.every(x=>THC[x.c]&&x.cards.every(id=>THC[id])),'');}
  // 2. the brief's day-1 example + round rules
  {fresh();rd('A1.02.1','A1.02.2','A1.02.3');let ok=true,det='';
    for(let sd=1;sd<=40;sd++){const qs=p1EarNew(sd),m=qs.filter(q=>!q.peek),ks=m.map(q=>q.k),sn=m.filter(q=>q.k==='snare');
      const good=qs.length===4&&m.length===3&&qs[3].peek&&qs[3].k==='bars'&&ks.every(k=>k==='snare'||k==='strong')&&ks.every((k,i)=>k!==ks[i-1])&&ks.includes('snare')&&ks.includes('strong')&&(sn.length<2||sn[0].c!==sn[1].c);
      if(!good){ok=false;det='seed '+sd+': '+qs.map(q=>q.k+(q.peek?'(peek)':'')+q.c).join(' ');break;}if(sd===1)det=qs.map(q=>q.k+(q.peek?'(peek)':'')).join(' ');}
    T('Day 1, only A1.02 read: snare / strong / snare (a different beat) style round + peek “count the bars”, no kind twice in a row',ok,det);
    rd(...QL_EAR.flatMap(x=>x.cards));const qa=p1EarNew(3);T('Everything unlocked: 4 questions, no peek',qa.length===4&&!qa.some(q=>q.peek),qa.map(q=>q.k).join(' '));}
  // 3. "New: counting bars" the next day
  {fresh();rd('A1.02.1');setClock(day0);rd('A1.06.1');setClock(day0+DAY);let qs=p1EarNew(2),b=qs.find(q=>q.k==='bars'&&!q.peek);for(let sd=3;!b&&sd<30;sd++){qs=p1EarNew(sd);b=qs.find(q=>q.k==='bars'&&!q.peek);}
    T('A newly unlocked kind shows “New: counting bars” the next day',b&&b.isNew&&/New: counting bars/.test(p1EarHtml()),'');
    setClock(day0+3*DAY);let b3=null;for(let sd=2;!b3&&sd<30;sd++)b3=p1EarNew(sd).find(q=>q.k==='bars');T('…and not after that',b3&&!b3.isNew,'');}
  // 4. peek behaviour
  {fresh();rd('A1.02.1','A1.02.2','A1.02.3');p1SetMode('go');const pl=p1Plan('go',20,{rebuild:true});SES={slot:'go',day:p1Day(),i:pl.items.findIndex(x=>x.k==='ear'),runs:0,mixI:0};
    p1EarNew(11);go('today',{mode:'ear'});const html=view.innerHTML,pi=EAR.qs.findIndex(q=>q.peek);
    T('The peek is marked “Peek” and has its primer in front',pi===3&&html.indexOf('qlpeek')>=0&&html.indexOf('qlpeek')<html.indexOf('p1peek')&&/Peek · doesn’t count/.test(html)&&!!qlT().primed['A1.06.1'],'');
    const pk=EAR.qs[pi];p1EarAnswer(pi,(pk.c+1)%pk.a.length);const tm=qlDayAdd(p1Day(),1);
    T('A wrong peek doesn’t count against you: no miss, but the card is queued for tomorrow',!qlT().miss['A1.06.1']&&(P1D().revise[tm]||[]).includes('A1.06.1'),JSON.stringify(P1D().revise));
    const q0=EAR.qs[0];p1EarAnswer(0,(q0.c+1)%q0.a.length);T('A wrong answer to a scored question is a miss and queues its card',(qlT().miss[q0.card]||[]).length===1&&(P1D().revise[tm]||[]).includes(q0.card),q0.card);
    p1EarAnswer(1,EAR.qs[1].c);p1EarAnswer(2,EAR.qs[2].c);render();document.querySelector('[data-p1ear="done"]').click();
    T('The round scores 2 of 3 (the wrong peek isn’t in the score)',pl.ear&&pl.ear.n===3&&pl.ear.ok===2&&pl.ear.peek&&pl.ear.peek.ok===0,JSON.stringify(pl.ear));SES=null;}
  // 5. primer once, before an item whose idea is new; never blocks; never during a run
  {fresh();p1SetMode('kit');state.set.planMins=20;const pl=p1Plan('kit',20,{rebuild:true}),f=pl.items.find(x=>x.k==='focus'),pc=qlPrimerCard(f);
    T('A Today item declares the ideas it needs (Built on) and finds a new one',qlItemRefs(f).length>0&&pc&&!thSt(pc),f.id+' → '+qlItemRefs(f).join(',')+' · primer '+pc);
    p1Start(pl.items.indexOf(f));const m=document.querySelector('.modal.qlprimer');T('Opening the item shows the 30-second primer automatically (over the practice screen, before the run)',m&&m.dataset.card===pc&&!$('#prac').classList.contains('hidden')&&!run&&/Got it/.test(m.textContent)&&/Skip/.test(m.textContent),'');
    m.querySelector('[data-qlok]').click();T('“Skip / Got it” closes it; the item stays open (never blocks)',!document.querySelector('.modal.qlprimer')&&L&&L.id===f.id,'');
    closeSheets();p1OpenItem(f);T('Shown once: opening the same item again shows no primer for that card',!document.querySelector('.modal.qlprimer')||document.querySelector('.modal.qlprimer').dataset.card!==pc,'');
    closeSheets();const pc2=qlPrimerCard(f);if(pc2){await startRun();const r2=qlPrimeItem(f);stopRun(false);T('Never during a run',!r2,'');}else T('Never during a run',true,'(no second new card)');
    closeSheets();fresh();rd(...thCardsFor('pulse'),...thCardsFor('count'),...thLessonCards('1.2.02'));const f2={k:'focus',id:'1.2.02'};T('No primer when the item’s cards are already read',!qlPrimerCard(f2),'');
    T('No primer for the new card, the deck, the ear game or the journal',['card','deck','ear','journal','revise'].every(k=>!qlPrimerCard({k,card:'A1.01.1'})),'');
    SES=null;p1ClosePrac();closeSheets();}
  // 6. revise queue with a fake clock
  {fresh();setClock(day0);const d0=p1Day(),d1=qlDayAdd(d0,1);qlOpen('swing');const sid=qlCardOf('swing');
    T('A Quick look is recorded and queues its card for tomorrow’s Revise (not today’s)',(qlT().look[sid]||[]).length===1&&(P1D().revise[d1]||[]).includes(sid)&&!qlReviseCards(d0).includes(sid),sid);closeSheets();
    qlOpen('swing');closeSheets();T('Looking it up again: counted again, queued once',qlT().look[sid].length===2&&P1D().revise[d1].filter(x=>x===sid).length===1,'');
    setClock(day0+DAY);T('Next day: the card is in the Revise slot',qlReviseCards().includes(sid),'');
    const go1=p1BuildGo(),k1=p1BuildKit(20);T('…and Today has a Revise item (On the go after the ear game; at the kit before the journal)',go1.findIndex(x=>x.k==='revise')>go1.findIndex(x=>x.k==='ear')&&k1[k1.length-2].k==='revise',go1.map(x=>x.k).join(' ')+' | '+k1.map(x=>x.k).join(' '));
    setClock(day0+3*DAY);T('Not revised: it carries over (up to 7 days)',qlReviseCards().includes(sid),'');setClock(day0+9*DAY);T('…then drops off',!qlReviseCards().includes(sid),'');
    setClock(day0+DAY);p1SetMode('go');const pl=p1Plan('go',20,{rebuild:true});const ri=pl.items.findIndex(x=>x.k==='revise');SES={slot:'go',day:p1Day(),i:ri,runs:0,mixI:0};p1OpenItem(pl.items[ri]);
    T('The Revise item opens short recaps with Remember this',cur==='today'&&VP.today.mode==='revise'&&view.textContent.includes(THC[sid].t)&&!!view.querySelector('[data-qlrem]'),'');
    view.querySelector('[data-qlrvdone]').click();T('Done ticks it off',!!pl.done.revise,'');SES=null;
    setClock(day0+2*DAY);T('A done Revise slot doesn’t carry over',!qlReviseCards().includes(sid),'');
    fresh();for(let i=0;i<20;i++)qlQueue(TH_ORDER[i].id);T('At most '+QL_QMAX+' cards a day, no repeats',P1D().revise[qlDayAdd(p1Day(),1)].length===QL_QMAX,'');}
  // 7. Remember this, wrong Check answers, Fix it with theory
  {fresh();const id='B2.04.1';qlRemember(id);T('“Remember this” puts the card in the Remember deck now',thDue().includes(id),'');
    fresh();const k=TH_ORDER.find(x=>x.check&&x.check[0].a.length>1);delete TH_ANS[k.id];thAnswer(k.id,0,(k.check[0].c+1)%k.check[0].a.length);
    T('A wrong Check answer is a miss and queues the card',(qlT().miss[k.id]||[]).length===1&&(P1D().revise[qlDayAdd(p1Day(),1)]||[]).includes(k.id),k.id);delete TH_ANS[k.id];
    fresh();openPractice('1.5.03');await startRun();const R=run;R.evs.forEach(e=>{if(!e.listen)hit(e.v,80,e.t+state.lat+70,e.art);});finish();
    const fx=[...document.querySelectorAll('#result .thfix .thprow')];const fc=fx.map(r=>(r.querySelector('[data-thsheet]')||{}).dataset.thsheet).filter(Boolean);
    T('“Fix it with theory” rows have ⓘ, and each mistake queues its card',fx.length>0&&fx.every(r=>r.querySelector('.qli'))&&fc.every(c=>(qlT().miss[c]||[]).length&&(P1D().revise[qlDayAdd(p1Day(),1)]||[]).includes(c)),fc.join(' '));
    T('Lesson scoring unchanged by P1b: the run is an ordinary lesson run',state.sessions.length===1&&!state.sessions[0].kind&&state.sessions[0].score<90,state.sessions[0]&&state.sessions[0].score+'%');
    T('Practice header has an ⓘ for the lesson’s ideas',!!$('#qlpw .qli'),'');
    $('#prac').classList.add('hidden');L=null;}
  // 8. ⓘ everywhere: Today rows, ear questions, recaps, practice header (tap drill, theory try); never during a run
  {fresh();rd('A1.02.1','A1.02.2','A1.02.3');const t=TH_ORDER.find(x=>x.rem);rd(t.id);state.theory.review[t.id].due=thNow()-1;qlQueue('B2.04.1',p1Day());
    p1SetMode('go');const h=p1TodayCard(),box=document.createElement('div');box.innerHTML=h;const rows=[...box.querySelectorAll('.p1it')],plg=p1Plan('go',20);
    const miss=plg.items.filter((it,i)=>!['journal','free'].includes(it.k)&&!rows[i].querySelector('.qli')).map(x=>x.k);
    T('Every Today item has an ⓘ (journal/free play have no idea to look up)',!miss.length,plg.items.map(x=>x.k).join(' ')+(miss.length?' missing: '+miss:''));
    T('Items show “Built on” concept chips',rows.some(r=>r.querySelector('.qlbo .qlchip')),'');
    const phs=[...box.querySelectorAll('.p1ph')].map(x=>x.textContent).join(' ');T('Today shows the phases Learn → Practise → Check → Revise',phs==='Learn Practise Check Revise',phs);
    p1SetMode('kit');const hk=document.createElement('div');hk.innerHTML=p1TodayCard();T('At the kit: items show theory recaps with ⓘ',[...hk.querySelectorAll('.threcap')].some(r=>r.querySelector('.qli')),'');
    go('today',{mode:'ear'});EAR.qs=[];render();const qn=[...view.querySelectorAll('.p1q')];T('Every ear question has an ⓘ',qn.length&&qn.every(q=>q.querySelector('.qli')),qn.length+' questions');
    view.querySelector('.p1q .qli').click();const qm=document.querySelector('.modal.qlsheet');EAR.ans[0]=EAR.qs[0].c;T('Quick look over the ear game: a sheet; the game keeps its state',qm&&cur==='today'&&VP.today.mode==='ear'&&EAR.qs.length>0,'');
    qm.querySelector('[data-close]').click();T('✕ returns exactly there',!document.querySelector('.modal.qlsheet')&&cur==='today'&&view.querySelector('.p1q')&&EAR.ans[0]!=null,'');
    P1_MEM.touchlat={ms:40,at:1};p1SetMode('go');const pg=p1Plan('go',20,{rebuild:true}),tp=pg.items.find(x=>x.k==='tap');if(tp){p1OpenTap(tp);T('Practice header ⓘ on a tap drill',!!$('#qlpw .qli'),'');}
    openTheoryTry('A1.02.3');T('…and on a theory try',$('#qlpw .qli')&&$('#qlpw .qli').dataset.ql==='A1.02.3','');
    await startRun();closeSheets();const r=qlOpen('swing');stopRun(false);T('Quick look never opens during a run',!r&&!document.querySelector('.modal.qlsheet'),'');
    $('#prac').classList.add('hidden');L=null;delete P1_MEM.touchlat;}
  // 9. the sheet: idea, diagram/Hear it (swing: Straight / Swung), Remember, buttons, Used in
  {fresh();p1SetMode('kit');state.set.planMins=20;const m=qlOpen('swing'),tx=m&&m.textContent;
    T('Quick look sheet: title, idea, Remember line, Read full card · Remember this · Used in…',m&&tx.includes(THC['B2.04.1'].t)&&tx.includes(THC['B2.04.1'].rem)&&/Read full card/.test(tx)&&/Remember this/.test(tx)&&/Used in/.test(tx),'');
    T('…for swing: ▶ Straight and ▶ Swung side by side',m&&/▶ Straight/.test(tx)&&/▶ Swung/.test(tx),'');
    m.querySelector('[data-qlused]').click();T('Used in… lists today’s items, lessons and songs',/Lessons/.test(m.textContent)&&/Today/.test(m.textContent)&&!!m.querySelector('.qlused [data-open]'),'');
    m.querySelector('[data-qlrem]').click();T('Remember this from the sheet → deck now',thDue().includes('B2.04.1'),'');
    m.querySelector('[data-qlfull]').click();const cs=document.querySelector('.modal .thsheetcard');T('Read full card opens the whole card as a sheet (marked Read)',cs&&cs.dataset.thcid==='B2.04.1'&&thSt('B2.04.1'),'');closeSheets();
    const f=p1Plan('kit',20).items.find(x=>x.k==='focus'),fr=qlItemRefs(f),fc=qlCardOf(fr[0]);T('A card’s “Used in” names today’s items that are built on it',qlTodayUsing(fc).some(t=>t===f.t),fc+' → '+qlTodayUsing(fc).join(' | '));
    thGo({mode:'card',card:fc});T('Cards show a “Used in” line',!!view.querySelector('.qlusedl')&&/Today/.test(view.querySelector('.qlusedl').textContent),'');
    const ms=qlOpen(fr.join(','));T('An item with several ideas: one chip per idea, switchable',fr.length<2||(ms.querySelectorAll('[data-qlsw]').length===fr.length&&(ms.querySelector('[data-qlsw="1"]').click(),ms.querySelector('[data-qlsw="1"]').classList.contains('pri'))),fr.join(','));closeSheets();}
  // 10. tappable terms + glossary + search
  {fresh();openLesson('1.5.03');const ts=[...view.querySelectorAll('.qlterm')].map(x=>x.dataset.ql);T('Terms get a dotted underline, each only once per screen',ts.length>0&&new Set(ts).size===ts.length,ts.join(' '));
    p1SetMode('go');go('home');const th=[...view.querySelectorAll('.qlterm')];T('…on Home / Today too, never inside buttons or tappable rows',th.length>0&&th.every(x=>!x.closest('button,a,.lrow,[data-thcard]')),th.map(x=>x.textContent).join(' '));
    if(th[0]){th[0].click();T('Tapping a term opens its Quick look',!!document.querySelector('.modal.qlsheet'),th[0].textContent);closeSheets();}
    thGo({mode:'card',card:'B2.04.1'});T('A card doesn’t link a term to itself',![...view.querySelectorAll('.qlterm')].some(x=>qlCardOf(x.dataset.ql)==='B2.04.1'||thCardsFor(x.dataset.ql).includes('B2.04.1')),'');
    T('Every glossary term points at a card that exists',qlGloss().length>=30&&qlGloss().every(g=>THC[g.id]),qlGloss().length+' terms');
    qlOpen('ghost');closeSheets();thGo({mode:'glossary'});const gt=view.textContent;T('More › Theory › A–Z glossary: “Recently looked up” first, then every term',/Recently looked up/.test(gt)&&gt.indexOf('Recently')<gt.indexOf('Accent')&&view.querySelectorAll('.qlg').length>=qlGloss().length,'');
    VP.theory.gq='swing';render();T('…with its own filter',view.querySelectorAll('#qlgl .qlg').length>=1&&/Swing/.test($('#qlgl').textContent)&&!/Accent/.test($('#qlgl').textContent),'');VP.theory.gq='';
    thGo({mode:'home'});T('Theory home links to the glossary',!!view.querySelector('[data-thgo*="glossary"]'),'');
    T('Header search finds terms (and theory cards)',/Swing/.test(qlSearchHtml('swing'))&&/Theory terms/.test(qlSearchHtml('backbeat')),'');}
  // 11. Progress › Theory: looked up most (last 30 days)
  {fresh();const ids=['B2.04.1','A3.05.1','A3.04.1'];ids.forEach((id,i)=>{for(let j=0;j<=i;j++)qlLook(id);});qlWrong('A3.04.1');setClock(day0-40*DAY);for(let i=0;i<9;i++)qlLook('A1.06.1');setClock(day0);
    const top=qlTop(5).map(o=>o.ref);T('Looked up most: top concepts by lookups + misses in the last 30 days (older ones left out)',top[0]==='accent'&&top.includes('swing')&&top.includes('ghost')&&!top.includes('bars')&&top.length<=5,top.join(' '));
    go('progress',{mode:'theory'});T('…shown on Progress › Theory',/Looked up most/.test(view.textContent),'');}
  // 12. session strip shows the phase
  {fresh();p1SetMode('go');p1Plan('go',20,{rebuild:true});p1Start(0);T('Session strip shows the phase (Learn first)',/Learn/.test((document.querySelector('.p1bar')||{}).textContent||''),'');SES=null;p1ClosePrac();closeSheets();}
  // 13. data: back-fill, merge, testing mode
  {const o=normaliseState({v:1,savedAt:1});T('Old saves get theory.look/miss/primed and plan.revise back-filled',o.theory.look&&o.theory.miss&&o.theory.primed&&o.plan.revise&&!Array.isArray(o.plan.revise),'');
    const A={cards:{},review:{},look:{'B2.04.1':[1,3]},miss:{'A3.04.1':[5]},primed:{'A1.02.1':10}},B={cards:{},review:{},look:{'B2.04.1':[2,3],'A1.06.1':[7]},miss:{},primed:{'A1.02.1':4,'A1.03.1':9}},M=thMerge(A,B);
    T('Merge: lookups and misses = union of timestamps, a primer shown on either device counts',JSON.stringify(M.look['B2.04.1'])==='[1,2,3]'&&M.look['A1.06.1'][0]===7&&M.miss['A3.04.1'][0]===5&&M.primed['A1.02.1']===4&&M.primed['A1.03.1']===9,JSON.stringify(M.look));
    const P2=p1Merge({revise:{'2026-11-16':['a','b']}},{revise:{'2026-11-16':['b','c'],'2026-11-17':['d']}});T('Merge: each day’s Revise slot = cards from both devices',P2.revise['2026-11-16'].join('')==='abc'&&P2.revise['2026-11-17'][0]==='d','');
    const mm=mergeStates(normaliseState({v:1,savedAt:1,theory:A,plan:{revise:{'2026-11-16':['a']}}}),normaliseState({v:1,savedAt:2,theory:B}));T('mergeStates carries the new fields',mm.theory.look['B2.04.1'].length===3&&mm.plan.revise['2026-11-16'][0]==='a','');
    T('Drive sync sees a lookup-only change',!sameData(normaliseState({v:1,theory:{look:{x:[1]}}}),normaliseState({v:1})),'');
    T('Testing mode: nothing is written',!SANDBOX||(()=>{let w=0;const o2=storeSave;storeSave=()=>{w++;};try{fresh();qlOpen('swing');closeSheets();qlWrong('A3.04.1');qlRemember('B2.04.1');qlPrimer('A1.02.1');closeSheets();qlQueue('A1.06.1');}finally{storeSave=o2;}
      const ls=(()=>{try{return JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]));}catch(_){return '';}})();return w===0&&ls===lsBefore;})(),SANDBOX?'sandbox on':'not in testing mode');}
  }catch(e){T('Tests ran without an error',false,e.message+' '+(e.stack||'').split('\n')[1]);}
  // restore
  setClock(null);SES=keepSES;p1ClosePrac();closeSheets();const k=JSON.parse(keep);Object.assign(state,{plan:k.plan,journal:k.journal,days:k.days,prog:k.prog,done:k.done,theory:k.theory,set:k.set});state.sessions=keepN;thFill(state);p1Fill(state);
  Object.keys(P1_MEM).forEach(x=>delete P1_MEM[x]);Object.assign(P1_MEM,JSON.parse(keepMem));const v=JSON.parse(keepVP);VP.today=v.t;VP.theory=v.th;VP.progress=v.pr;cur=keepCur;EAR.qs=[];render();
  return out;
}
window.p1bTests=p1bTests;
