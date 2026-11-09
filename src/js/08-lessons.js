/* DrumPath — Lessons: skill map (levels × strands) → level → strand → lesson, with run history */
'use strict';
const ALL_L=()=>[...LESSONS,...LATER];
function exMeta(e){const g={1:'quarter notes',2:'8th notes',3:'triplets',4:'16th notes',6:'16th-note triplets',8:'32nd notes'}[e.sub]||('÷'+e.sub);
  const m=e.meter||(e.steps&&e.steps!==4*e.sub?e.steps+' steps per bar':'');
  return [g,m,e.bars>1?e.bars+' bars':'',e.swing&&e.swing!==0.5?'swing '+Math.round(e.swing*100)+'%':'',e.click&&e.click!=='all'?(e.click==='24'?'click on 2 & 4 only':'click on 1 only'):'',e.dyn==='even'?'even doubles scored':isDyn(e)?'dynamics scored':'',hasArt(e)?'sound checked':'',hasGraces(e)?'grace notes':''].filter(Boolean).join(' · ');}
function patText(ex){
  const spb=ex.steps||ex.sub*4, n=spb*ex.bars;
  const cnt=Array.from({length:n},(_,i)=>{const b=i%spb;if(b%ex.sub===0)return String(b/ex.sub+1);return ex.sub===2?'&':ex.sub===3?(b%3===1?'t':'l'):['','e','&','a'][b%4]||'.';});
  const fmt=a=>a.map((c,i)=>(i&&i%spb===0?'| ':'')+c).join(' ');
  let lines=['         '+fmt(cnt)];
  if(ex.st)lines.push('Stick    '+fmt(Array.from({length:n},(_,i)=>ex.st[i%ex.st.length]||'.')));
  LANES.filter(v=>ex.v[v]).forEach(v=>lines.push(VOICES[v].n.slice(0,8).padEnd(9)+fmt(ex.v[v].slice(0,n).split('').map(c=>({'.':'·',X:'>',g:'g',o:'o',r:'r',f:'f',d:'d'}[c]||'x')))));
  return lines.join('\n');
}
function lessonRow(l){
  const s=statusOf(l),p=state.prog[l.id];
  let right='';
  if(l.later)right='<span class="chip">Coming</span>';
  else if(l.bpm){const cb=p?p.bpm:l.bpm[0],pct=(cb-l.bpm[0])/Math.max(1,l.bpm[1]-l.bpm[0]);
    right=`<span class="mut num" style="font-size:13px">${cb}→${l.bpm[1]}</span><div class="bar mbar" title="Tempo ladder"><i style="width:${s==='ms'?100:Math.round(pct*100)}%"></i></div>${p&&p.best?`<span class="mut num" style="font-size:13px">${p.best}%</span>`:''}${chip(s)}`;}
  else right=`<span class="mut" style="font-size:13px">${{info:'Read & check',tool:'Setup',song:'Song'}[l.type]||''}</span>${chip(s)}`;
  return `<div class="lrow ${l.later?'dim':''}" ${l.later?'':`data-open="${l.id}"`}><span class="idx">${l.id}</span><span style="flex:1;min-width:120px">${esc(l.t)}</span>${right}</div>`;
}
const doneFrac=ls=>{const r=ls.filter(l=>!l.later);return r.length?r.filter(l=>statusOf(l)==='ms').length/r.length:0;};
function crumbs(parts){return `<nav class="crumbs">${parts.map((p,i)=>i===parts.length-1?`<span class="cur">${esc(p[0])}</span>`:`<button data-crumb='${JSON.stringify(p[1])}'>${esc(p[0])}</button><span>›</span>`).join('')}</nav>`;}
function renderLessons(){
  const p=VP.lessons;
  if(p.id&&LBY[p.id])return renderLesson(p.id);
  if(p.lv!=null)return renderLevel(p.lv,p.sd);
  const all=ALL_L(),done=LESSONS.filter(l=>statusOf(l)==='ms').length;
  let g=`<div class="hd"></div>`+Object.keys(STRANDS).map(k=>`<div class="hd">${k}. ${STRANDS[k]}</div>`).join('');
  for(let lv=0;lv<=10;lv++){const ls=all.filter(l=>l.lv===lv),f=doneFrac(ls),later=ls.every(l=>l.later);
    g+=`<div class="lv" data-lvl="${lv}">${later?ring(0,38,5,lv):ring(f,38,5,lv)}<div>${esc(LEVELS[lv])}<small>${later?'coming':Math.round(f*100)+'% · '+ls.length+' lessons'}</small></div></div>`;
    for(let sd=1;sd<=8;sd++){const c=ls.filter(l=>l.sd===sd);
      if(!c.length){g+=`<div class="c e"></div>`;continue;}
      const cl=c.every(l=>l.later),cf=doneFrac(c),dn=c.filter(l=>statusOf(l)==='ms').length,ipn=c.filter(l=>statusOf(l)==='ip').length;
      const bg=cl?'transparent':cf>0?`color-mix(in srgb,var(--accent) ${Math.round(18+cf*72)}%,var(--surface))`:ipn?'color-mix(in srgb,var(--accent) 9%,var(--surface))':'var(--surface)';
      g+=`<div class="c ${cl?'later':''}" data-cell="${lv}.${sd}" title="Level ${lv} · ${STRANDS[sd]}" style="background:${bg};color:${cf>0.55?'var(--accent-ink)':'var(--ink)'}">${cl?c.length:dn+'/'+c.length}</div>`;}
  }
  const ipl=LESSONS.filter(l=>statusOf(l)==='ip').sort((a,b)=>(state.prog[b.id].last||0)-(state.prog[a.id].last||0)).slice(0,6);
  view.innerHTML=`<h1>Lessons</h1><p class="sub">${done} of ${LESSONS.length} playable lessons done · every lesson is unlocked; start at the top and move on when you’re ready. Levels 4–10 are indexed and coming next.</p>
   ${TEST?testBanner():''}
   <h2>Skill map</h2><p class="sub">Rows are levels, columns are strands. Shading = share of lessons done. Tap a level or a cell.</p>
   <div class="card"><div class="smap">${g}</div></div>
   ${ipl.length?`<h2>In progress</h2><div class="list">${ipl.map(lessonRow).join('')}</div>`:''}
   <h2>All levels</h2>
   <div class="grid2">${Array.from({length:11},(_,lv)=>{const ls=all.filter(l=>l.lv===lv),later=ls.every(l=>l.later);return `<div class="card tap row" data-lvl="${lv}">${ring(later?0:doneFrac(ls),54,6,later?'–':null)}<div style="flex:1"><div class="note-k mut">Level ${lv}</div><b style="font-size:17px">${esc(LEVELS[lv])}</b><div class="mut" style="font-size:13px">${ls.length} lessons${later?' · coming':''}</div></div></div>`;}).join('')}</div>`;
}
function testBanner(){const vi=validateLessons();return `<div class="card" style="border-color:${vi.length?'var(--warn)':'var(--accent)'};margin-bottom:12px"><b>Test mode</b> · lesson data check: ${vi.length?vi.length+' issue(s)':'all patterns valid ✓'}${vi.length?`<div class="pat" style="margin-top:8px;max-height:200px;overflow:auto">${esc(vi.join('\n'))}</div>`:''}</div>`;}
function renderLevel(lv,sd){
  const ls=ALL_L().filter(l=>l.lv===lv&&(!sd||l.sd===sd)).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  const lvAll=ALL_L().filter(l=>l.lv===lv),later=lvAll.every(l=>l.later);
  const runs=runsWhere(s=>LBY[s.id].lv===lv&&(!sd||LBY[s.id].sd===sd)),st=statsOf(runs,null);
  const sds=[...new Set(ls.map(l=>l.sd))].sort((a,b)=>a-b);
  view.innerHTML=crumbs([['Skill map',{lv:null,sd:null,id:null}],...(sd?[['Level '+lv,{lv,sd:null,id:null}],[STRANDS[sd],null]]:[['Level '+lv+': '+LEVELS[lv],null]])])+
  `<div class="row" style="align-items:center;margin:4px 0 6px">${ring(later?0:doneFrac(ls),72,8,later?'–':null)}<div><h1 style="margin:0">${sd?esc(STRANDS[sd]):esc(LEVELS[lv])}</h1><div class="mut">Level ${lv}${sd?' · '+esc(LEVELS[lv]):''} · ${ls.length} lessons${later?' · coming soon':''}</div></div></div>
  ${later?'':`<div class="grid" style="margin-top:12px">
    <div class="card stat"><div class="k">Done</div><div class="v">${ls.filter(l=>statusOf(l)==='ms').length}<small>/ ${ls.length}</small></div></div>
    <div class="card stat"><div class="k">Practice</div><div class="v">${Math.round(st.mins)}<small>min</small></div><div class="d">${st.runs} runs</div></div>
    <div class="card stat"><div class="k">Timing</div><div class="v">${fmtN(st.timing)}<small>%</small></div><div class="d">all runs here</div></div>
    ${st.dyn!=null?`<div class="card stat"><div class="k">Dynamics</div><div class="v">${fmtN(st.dyn)}<small>%</small></div></div>`:''}</div>`}
  ${!sd?`<div class="chips" style="margin:14px 0 4px">${sds.map(k=>`<button class="sm" data-cell="${lv}.${k}">${k}. ${STRANDS[k]}</button>`).join('')}</div>`:''}
  ${sds.map(k=>`${sd?'':`<div class="h2" style="font-size:18px;margin:18px 0 8px">${k}. ${STRANDS[k]}</div>`}<div class="list">${ls.filter(l=>l.sd===k).map(lessonRow).join('')}</div>`).join('')}`;
}
function renderLesson(id){
  const l=LBY[id],s=statusOf(l),sctx=songCtx(),songs=songsUsing(id).map(x=>songStats(sctx,x)).sort((a,b)=>b.ready-a.ready),cs=VP.lessons.ctx&&songById(VP.lessons.ctx),sm=stretchMax(id);
  const runs=state.sessions.filter(x=>x.id===id);
  let body='';
  if(l.type==='play'){const p=P(id),pa=padAgg(runs);
    const lr=runs.slice(-40);
    body=`<div class="row" style="margin:12px 0"><button class="pri" style="font-size:20px;padding:14px 34px" data-play="${id}">${icon('play',18)} Practise</button>${s==='ms'?`<button data-reset="${id}">Reset progress</button>`:''}</div>
     <div class="grid">
      <div class="card stat"><div class="k">Target tempo</div><div class="v">${p.bpm}<small>BPM</small></div><div class="d">${l.bpm[0]} → ${l.bpm[1]}, +${l.step} per 3 passes</div><div class="bar" style="margin-top:6px"><i style="width:${s==='ms'?100:Math.round(100*(p.bpm-l.bpm[0])/Math.max(1,l.bpm[1]-l.bpm[0]))}%"></i></div></div>
      <div class="card stat"><div class="k">Best score</div><div class="v">${p.best}<small>%</small></div><div class="d">best passing tempo ${p.bestBpm||'–'}${p.masteredAt?' · mastered '+new Date(p.masteredAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):''}</div></div>
      <div class="card stat"><div class="k">Practice</div><div class="v">${mins(p.ms)}<small>min</small></div><div class="d">${p.attempts} runs</div></div>
     </div>
     ${lr.length>1?`<h2>Tempo ladder</h2><div class="card">${svgLines([{name:'BPM',c:'var(--accent)',pts:lr.map(x=>x.bpm),dots:lr.map(runPassed)}],lr.map(x=>new Date(x.ts).getDate()+' '+MON[new Date(x.ts).getMonth()]),{h:200,labels:8,min:l.bpm[0]-5,max:l.bpm[1]+5})}<div class="legend"><span><i style="background:var(--accent)"></i>filled = passed</span><span>hollow = not passed</span></div></div>`:''}
     ${Object.keys(pa).length?`<h2>By pad</h2><div class="card"><table><tr><th>Pad</th><th class="n">On time</th><th class="n">Notes</th><th class="n">Missed</th><th>Timing</th>${Object.values(pa).some(q=>q.dyn!=null)?'<th class="n">Dynamics</th>':''}</tr>${LANES.filter(v=>pa[v]).map(v=>{const q=pa[v];return `<tr><td><b style="color:${VOICES[v].c}">${VOICES[v].n}</b></td><td class="n">${fmtN(q.timing)}%</td><td class="n">${q.n}</td><td class="n">${q.miss}</td><td>${rushTxt(q.off)}</td>${Object.values(pa).some(z=>z.dyn!=null)?`<td class="n">${fmtN(q.dyn)}%</td>`:''}</tr>`;}).join('')}</table></div>`:''}
     <h2>Exercises</h2>${l.ex.map((e,i)=>`<div class="card" style="margin-bottom:10px"><div class="row"><b>${i+1}. ${esc(e.n)}</b><span class="mut">${exMeta(e)}</span><span class="sp"></span><button class="sm" data-play="${id}" data-ex="${i}">${icon('play',14)} Play</button></div><div class="pat" style="margin-top:8px">${esc(patText(e))}</div></div>`).join('')}
     <h2>Runs</h2>${runList([...runs].reverse().slice(0,30),'No runs yet for this lesson.')}`;
  }else{
    const ck=state.done[id+'_ck']||{},qa=state.done[id+'_qa']||{};
    const quiz=l.quiz?`<h2>Quick quiz</h2>${l.quiz.map((q,i)=>`<div class="card" style="margin-bottom:10px"><b>${i+1}. ${esc(q.q)}</b><div class="row" style="margin-top:8px">${q.a.map((a,j)=>`<button class="sm ${qa[i]===j&&j===q.c?'pri':''}" ${qa[i]===j&&j!==q.c?'style="border-color:var(--bad);color:var(--bad)"':''} data-quiz="${id}" data-qi="${i}" data-qj="${j}">${esc(a)}</button>`).join('')}</div>${qa[i]!=null?`<p class="mut" style="margin:8px 0 0">${qa[i]===q.c?'✓ ':'✗ '}${esc(q.why||'')}</p>`:''}</div>`).join('')}`:'';
    body=`${quiz}${l.check?`<h2>Checklist</h2><div class="card">${l.check.map((c,i)=>`<label class="row" style="padding:8px 0;cursor:pointer"><input type="checkbox" data-ck="${id}" data-i="${i}" ${ck[i]?'checked':''} style="width:22px;height:22px"> ${esc(c)}</label>`).join('')}</div>`:''}
      <div class="row" style="margin-top:14px">
      ${l.tool==='kit'?'<button class="pri" data-nav="kit">Open Kit</button>':''}
      ${l.tool==='latency'?'<button class="pri" data-act="latency">Run latency test</button>':''}
      ${l.type==='song'?'<button class="pri" data-nav="songs">Open Songs</button>':''}
      <button data-done="${id}">${state.done[id]?'Mark not done':'Mark done'}</button></div>`;
  }
  const sib=LESSONS.filter(x=>x.lv===l.lv).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true})),ix=sib.indexOf(l);
  view.innerHTML=crumbs([['Skill map',{lv:null,sd:null,id:null}],['Level '+l.lv,{lv:l.lv,sd:null,id:null}],[STRANDS[l.sd],{lv:l.lv,sd:l.sd,id:null}],[l.id,null]])+
   (cs?(()=>{const k=songStats(sctx,cs).skills.find(q=>q.id===id);return k?`<div class="card" style="border:1px solid var(--accent);margin-bottom:10px"><div class="row" style="flex-wrap:nowrap"><div style="flex:1"><span class="note-k" style="color:var(--accent)">For ${esc(cs.title)}</span><div>${k.core?'Core':'Support'} skill · ${SKILL_LABEL[k.status]} · score ${k.score} · best ${k.best||'–'} / song ${k.T||'–'} BPM</div></div><button class="sm" data-song="${esc(cs.id)}">Song</button></div></div>`:'';})():'')+
   `<h1><span class="idx" style="font-size:.55em;vertical-align:middle">${l.id}</span> ${esc(l.t)} ${chip(s)}</h1>
   <p style="font-size:17px;max-width:900px">${esc(l.d)}</p>${body}
   <h2>Songs that use this</h2>
   <div class="card">${songs.length?`${sm?`<p class="mut" style="margin-top:0">Song tempos go up to <b>${sm} BPM</b>${l.bpm?` (goal ${l.bpm[1]})`:''}. ${canStretch(id)?'Use <b>Stretch</b> on the practice screen to push past the goal without changing this lesson’s progress.':'Pass the goal tempo to unlock Stretch.'}</p>`:''}${songs.slice(0,12).map(x=>{const k=x.skills.find(q=>q.id===id);return `<div class="row" style="padding:6px 0;cursor:pointer;flex-wrap:nowrap" data-song="${esc(x.song.id)}">${ring(x.ready/100,36,4)}<div style="flex:1;min-width:0"><b>${esc(x.song.title)}</b> <span class="mut">${esc(x.song.artist)}</span><div class="mut" style="font-size:13px">${k.core?'core':'support'} · ${x.T?(x.unsure?'≈':'')+x.T+' BPM':'BPM not set'} · this skill ${k.score}</div></div>${stChip(x.state)}</div>`;}).join('')}${songs.length>12?`<button class="sm" data-nav="songs" data-p='{"view":"matrix"}'>All ${songs.length} songs in the matrix</button>`:''}`:'<span class="mut">No songs use this lesson yet.</span>'}</div>
   <div class="row" style="margin-top:18px">${ix>0?`<button data-open="${sib[ix-1].id}">← ${sib[ix-1].id} ${esc(sib[ix-1].t)}</button>`:''}<span class="sp"></span>${ix<sib.length-1?`<button data-open="${sib[ix+1].id}">${sib[ix+1].id} ${esc(sib[ix+1].t)} →</button>`:''}</div>`;
}
