/* DrumPath — Home (hero, stats, coach notes, recent runs) and Practise (today's plan) */
'use strict';
function coachNotes(){
  const out=[], now=Date.now(), d28=now-28*864e5, d14=now-14*864e5;
  const recent=runsWhere(s=>s.ts>=d28), pa=padAgg(recent);
  // rushing / dragging per pad
  Object.entries(pa).filter(([,q])=>q.offN>=30&&q.off!=null&&Math.abs(q.off)>=10).sort((a,b)=>Math.abs(b[1].off)-Math.abs(a[1].off)).slice(0,2).forEach(([v,q])=>
    out.push({k:q.off<0?'Rushing':'Dragging',c:q.off<0?'var(--blue)':'var(--warn)',t:`${VOICES[v].n} ${q.off<0?'rushes':'drags'} about ${Math.round(Math.abs(q.off))} ms`,d:`Average over ${q.offN} hits in the last 4 weeks. Try the same lesson 10 BPM slower and listen for the click.`,nav:['progress',{mode:'pads'}]}));
  // best / weakest pad
  const ranked=Object.entries(pa).filter(([,q])=>q.n>=40).sort((a,b)=>b[1].timing-a[1].timing);
  if(ranked.length>=2){const [bv,bq]=ranked[0],[wv,wq]=ranked[ranked.length-1];
    out.push({k:'Strongest pad',c:'var(--good)',t:`${VOICES[bv].n} is your most accurate pad`,d:`${Math.round(bq.timing)}% on time over 4 weeks; ${VOICES[wv].n} is lowest at ${Math.round(wq.timing)}%.`,nav:['progress',{mode:'pads'}]});}
  // stuck lessons
  Object.entries(state.prog).forEach(([id,p])=>{const l=LBY[id];if(!l||l.type!=='play'||p.status==='mastered')return;
    const at=state.sessions.filter(s=>s.id===id&&s.bpm>=p.bpm);const last=at.slice(-6);
    if(last.length>=6&&!last.some(runPassed))out.push({k:'Plateau',c:'var(--warn)',t:`${id} stuck at ${p.bpm} BPM`,d:`${last.length} runs without a pass. Drop 10 BPM for a few runs, then come back up.`,open:id});});
  // dynamics weak
  const dl={};recent.filter(s=>s.dyn!=null).forEach(s=>{(dl[s.id]=dl[s.id]||[]).push(s.dyn);});
  Object.entries(dl).filter(([,a])=>a.length>=3&&a.reduce((x,y)=>x+y,0)/a.length<state.set.dynPass).slice(0,1).forEach(([id,a])=>
    out.push({k:'Dynamics',c:'var(--warn)',t:`Accents and ghosts in ${id}`,d:`Dynamics average ${Math.round(a.reduce((x,y)=>x+y,0)/a.length)}%. Exaggerate: accents from high, ghosts barely lifting the stick.`,open:id}));
  // review due
  const rusty=LESSONS.filter(l=>l.type==='play'&&statusOf(l)==='ms'&&(state.prog[l.id]||{}).last<d14);
  if(rusty.length)out.push({k:'Review',c:'var(--accent)',t:`${rusty.length} mastered lesson${rusty.length>1?'s':''} not played in 2 weeks`,d:rusty.slice(0,4).map(l=>l.id).join(', ')+(rusty.length>4?'…':''),open:rusty[0].id});
  // consistency
  const ws=weekStart(),lw=new Date(ws);lw.setDate(ws.getDate()-7);
  const dThis=Object.keys(state.days).filter(k=>pdate(k)>=ws&&state.days[k]>0).length,dLast=Object.keys(state.days).filter(k=>pdate(k)>=lw&&pdate(k)<ws&&state.days[k]>0).length;
  if(dThis||dLast)out.push({k:'Consistency',c:'var(--accent)',t:`${dThis} practice day${dThis===1?'':'s'} this week`,d:`Last week: ${dLast}. Short daily sessions beat one long one.`,nav:['progress',{mode:'calendar'}]});
  if(!out.length)out.push({k:'Start here',c:'var(--accent)',t:'Your coach notes appear after a few runs',d:'Play a few lessons with the kit connected: notes on rushing, plateaus and reviews will show up here.',open:nextLesson().id});
  return out;
}
function renderHome(){
  const ws=weekStart(),wk=dayMinutes(d=>d>=ws),st=streakDays();
  const doneN=LESSONS.filter(l=>statusOf(l)==='ms').length,nx=nextLesson();
  const last=[...state.sessions].reverse().find(s=>LBY[s.id]);
  const r7=statsOf(runsWhere(s=>s.ts>=Date.now()-7*864e5));
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push({l:'SMTWTFS'[d.getDay()],v:(state.days[dkey(d)]||0)/60000,k:'D'+dkey(d),t:periodName('D'+dkey(d))+': '+Math.round((state.days[dkey(d)]||0)/60000)+' min'});}
  const notes=coachNotes();
  const recent=[...state.sessions].reverse().filter(s=>LBY[s.id]).slice(0,8);
  const firstTs=(state.sessions.find(x=>LBY[x.id])||{}).ts, totalMin=dayMinutes(), lastBk=state.lastBackup;
  const ago=ts=>{if(!ts)return 'never';const d=Math.floor((Date.now()-ts)/864e5);return d<1?'today':d+'d ago';};
  const pl=(n,w)=>n+' '+w+(n===1?'':'s');
  view.innerHTML=`<div class="fresh"><span class="chip" data-nav="kit"><span class="dot ${inputs.length?'ok':''}"></span>Kit: ${inputs.length?'connected':'not connected'}</span><span class="chip" data-nav="kit"><span class="dot ok"></span>Latency ${state.lat} ms</span><span class="chip" data-nav="settings"><span class="dot ${lastBk&&Date.now()-lastBk<14*864e5?'ok':''}"></span>Backup: ${ago(lastBk)}</span></div>
  <h1>Overview</h1>
  <p class="hero line">${state.sessions.length?`Every run you’ve played since ${new Date(firstTs||Date.now()).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}: ${pl(state.sessions.length,'run')} over ${Math.round(totalMin)} minutes, ${doneN} of ${LESSONS.length} lessons done.`:`Your drum logbook. Connect the kit, set up in Level 0, and every run you play is scored and kept here.`}</p>
  <div class="hero-stats">
    <div class="card tap stat" data-nav="progress" data-p='{"mode":"calendar"}'><div class="k">Current streak</div><div class="v">${st}<small>${st===1?'day':'days'}</small></div><div class="d">longest ${pl(longestStreak(),'day')}</div></div>
    <div class="card tap stat" data-nav="progress" data-p='{"mode":"timeline"}'><div class="k">This week</div><div class="v">${Math.round(wk)}<small>min</small></div><div class="d">${pl(r7.runs,'run')} in 7 days</div></div>
    <div class="card tap stat" data-nav="lessons"><div class="k">Lessons done</div><div class="v">${doneN}<small>/ ${LESSONS.length}</small></div><div class="bar" style="margin-top:8px"><i style="width:${100*doneN/LESSONS.length}%"></i></div></div>
    <div class="card tap stat" data-nav="progress" data-p='{"mode":"pads"}'><div class="k">Timing · 7 days</div><div class="v">${fmtN(r7.timing)}<small>%</small></div><div class="d">${r7.dyn!=null?'dynamics '+Math.round(r7.dyn)+'%':'within ±'+state.set.tol+' ms'}</div></div>
    <div class="card tap stat" data-nav="progress" data-p='{"mode":"records"}'><div class="k">Total practice</div><div class="v">${Math.round(totalMin)}<small>min</small></div><div class="d">${pl(state.sessions.length,'run')}</div></div>
  </div>
  <h2>Up next</h2>
  <div class="card row"><div style="flex:1;min-width:200px"><span class="idx">${nx.id}</span> <b style="font-size:18px">${esc(nx.t)}</b><div class="mut">Level ${nx.lv}: ${LEVELS[nx.lv]} · ${STRANDS[nx.sd]}</div></div>
    ${last&&last.id!==nx.id?`<button data-open="${last.id}">Resume ${last.id}</button>`:''}
    <button data-open="${nx.id}">Open</button>${nx.type==='play'?`<button class="pri" data-play="${nx.id}">${icon('play',16)} Practise</button>`:''}</div>
  <h2>Coach notes</h2>
  <div class="deck">${notes.map((n,i)=>`<div class="card tap" data-note="${i}"><div class="note-k" style="color:${n.c}">${esc(n.k)}</div><b style="font-size:17px">${esc(n.t)}</b><span class="mut">${esc(n.d)}</span></div>`).join('')}</div>
  <h2>Last 14 days</h2>
  <div class="card" id="h14">${svgBars(days,{h:150,fmt:v=>Math.round(v)+'m',labels:14})}</div>
  <h2>Recent runs</h2>
  ${runList(recent)}`;
  view.querySelectorAll('[data-note]').forEach(el=>el.addEventListener('click',()=>{const n=notes[+el.dataset.note];if(n.open)openLesson(n.open);else if(n.nav)go(n.nav[0],n.nav[1]);}));
  $('#h14').addEventListener('click',e=>{const g=e.target.closest('[data-k]');if(g){const d=pdate(g.dataset.k.slice(1));go('progress',{mode:'calendar',calY:d.getFullYear(),calM:d.getMonth(),day:g.dataset.k.slice(1)});}});
}
function runList(runs,empty){
  if(!runs.length)return `<div class="card mut">${empty||'No runs yet. Connect the kit and start with Level 0, then 1.2.02.'}</div>`;
  return `<div class="list"><table><tr><th>When</th><th>Lesson</th><th class="n">BPM</th><th class="n">Timing</th><th class="n">Dyn.</th><th></th></tr>${runs.map(s=>`<tr class="tap" data-run="${s.ts}"><td>${new Date(s.ts).toLocaleString([],{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td><td><span class="idx">${s.id}</span> ${esc(LBY[s.id]?LBY[s.id].t:'')}</td><td class="n">${s.bpm}</td><td class="n">${s.score}%</td><td class="n">${s.dyn!=null?s.dyn+'%':'–'}</td><td>${runPassed(s)?'<span class="chip ms">Pass</span>':''}</td></tr>`).join('')}</table></div>`;
}
/* ---------- Practise: today's plan ---------- */
function todaysPlan(){
  const plan=[],used=new Set(),add=(id,why,k)=>{if(id&&LBY[id]&&!used.has(id)){used.add(id);plan.push({id,why,k});}};
  const playable=LESSONS.filter(l=>l.type==='play');
  // warm-up: the most recent rudiment lesson touched, else single strokes
  const rud=[...state.sessions].reverse().map(s=>LBY[s.id]).find(l=>l&&l.sd===3);
  add(rud?rud.id:'2.3.01','Warm-up: rudiment, slow → fast → slow','Warm-up');
  const nx=playable.find(l=>statusOf(l)!=='ms');add(nx&&nx.id,'Main: your next lesson','Main');
  const ip=playable.filter(l=>statusOf(l)==='ip'&&!used.has(l.id)).sort((a,b)=>(state.prog[b.id].last||0)-(state.prog[a.id].last||0))[0];add(ip&&ip.id,'Keep going: in progress','In progress');
  const rusty=playable.filter(l=>statusOf(l)==='ms').sort((a,b)=>(state.prog[a.id].last||0)-(state.prog[b.id].last||0))[0];add(rusty&&rusty.id,'Review: mastered, longest since played','Review');
  return plan;
}
function renderPractise(){
  const plan=todaysPlan(), song=state.songs.map(s=>[s,songReady(s)]).filter(([,r])=>r<1).sort((a,b)=>b[1]-a[1])[0];
  const ipl=LESSONS.filter(l=>l.type==='play'&&statusOf(l)==='ip').sort((a,b)=>(state.prog[b.id].last||0)-(state.prog[a.id].last||0));
  view.innerHTML=`<h1>Practise</h1><p class="sub">Today’s plan: about 20–30 minutes. Tap to start; you can change the tempo on the practice screen.</p>
  <div class="grid2">${plan.map(p=>{const l=LBY[p.id],pr=state.prog[p.id];return `<div class="card"><div class="note-k" style="color:var(--accent)">${p.k}</div><div class="row" style="margin-top:4px"><span class="idx">${l.id}</span><b style="font-size:18px">${esc(l.t)}</b></div><div class="mut">${p.why}${pr&&pr.bpm?' · target '+pr.bpm+' BPM':l.bpm?' · from '+l.bpm[0]+' BPM':''}</div><div class="row" style="margin-top:10px"><button class="pri" data-play="${l.id}">${icon('play',16)} Start</button><button class="ghost" data-open="${l.id}">Details</button></div></div>`;}).join('')}
  ${song?`<div class="card"><div class="note-k" style="color:var(--accent)">Song</div><b style="font-size:18px">${esc(song[0].title)}</b><div class="mut">${esc(song[0].artist)} · ${Math.round(song[1]*100)}% ready</div><div class="row" style="margin-top:10px"><button data-nav="songs">Open Songs</button></div></div>`:''}</div>
  <h2>In progress</h2>
  ${ipl.length?`<div class="list">${ipl.map(l=>lessonRow(l)).join('')}</div>`:'<div class="card mut">Nothing in progress yet.</div>'}
  <h2>Tools</h2>
  <div class="row"><button data-act="latency">Latency test</button><button data-nav="kit">Kit &amp; pads</button><button data-act="velcheck">Velocity check</button></div>`;
}
