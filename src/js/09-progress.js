/* DrumPath — Progress: Timeline (year → month → week → day → run), Calendar, Pads, Records; run detail & trend sheets */
'use strict';
function dataDays(){const s=new Set(Object.keys(state.days).filter(k=>state.days[k]>0));runsWhere().forEach(r=>s.add(dkey(new Date(r.ts))));return [...s].sort();}
function periodData(k){const runs=runsWhere(s=>inPeriod(k,new Date(s.ts)));return statsOf(runs,dayMinutes(d=>inPeriod(k,d)));}
function childrenOf(k){
  const days=dataDays().map(pdate);
  if(!k){return [...new Set(days.map(d=>'Y'+d.getFullYear()))];}
  const cg=childGrain(k[0]);if(!cg)return [];
  if(k[0]==='Y'){const y=+k.slice(1);return Array.from({length:12},(_,m)=>'M'+y+'-'+String(m+1).padStart(2,'0'));}
  if(k[0]==='M'){const d0=pdate(k.slice(1)),out=new Set();for(let d=new Date(d0);d.getMonth()===d0.getMonth();d.setDate(d.getDate()+1))out.add('W'+weekKeyD(d));return [...out];}
  if(k[0]==='W'){const d0=pdate(k.slice(1));return Array.from({length:7},(_,i)=>{const d=new Date(d0);d.setDate(d0.getDate()+i);return 'D'+dkey(d);});}
  return [];
}
function snapCard(k,st){
  return `<div class="card tap snap" data-pk="${k}" data-when="${esc(periodName(k))}"><div class="when">${esc(periodName(k))}</div>
   <div class="kv"><div><span class="mut">Minutes</span><b>${Math.round(st.mins)}</b></div><div><span class="mut">Runs</span><b>${st.runs}</b></div>
   <div><span class="mut">Timing</span><b>${fmtN(st.timing)}%</b></div><div><span class="mut">${st.dyn!=null?'Dynamics':'Passed'}</span><b>${st.dyn!=null?fmtN(st.dyn)+'%':st.passed}</b></div>
   <div><span class="mut">Lessons</span><b>${st.lessons}</b></div><div><span class="mut">Best</span><b>${st.best!=null?st.best+'%':'–'}</b></div></div></div>`;
}
function renderProgress(){
  const p=VP.progress;
  const seg=`<div class="seg" style="margin-bottom:14px">${[['timeline','Timeline'],['calendar','Calendar'],['pads','Pads & limbs'],['records','Records']].map(([k,l])=>`<button class="${p.mode===k?'on':''}" data-pmode="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(!state.sessions.length&&!Object.keys(state.days).length)body='<div class="card mut">No practice logged yet. Play a lesson and your timeline, calendar and pad stats will fill in here.</div>';
  else body=({timeline:progTimeline,calendar:progCalendar,pads:progPads,records:progRecords}[p.mode]||progTimeline)();
  view.innerHTML=`<h1>Progress</h1>${seg}${body}`;
  view.querySelectorAll('[data-pk]').forEach(el=>el.addEventListener('click',()=>{const k=el.dataset.pk;if(k[0]==='D'){const d=pdate(k.slice(1));go('progress',{mode:'calendar',calY:d.getFullYear(),calM:d.getMonth(),day:k.slice(1)});}else go('progress',{path:[...p.path,k]});}));
  const ch=$('#pchart');if(ch)ch.addEventListener('click',e=>{const g=e.target.closest('[data-k]');if(!g)return;const k=g.dataset.k;if(k[0]==='D'){const d=pdate(k.slice(1));go('progress',{mode:'calendar',calY:d.getFullYear(),calM:d.getMonth(),day:k.slice(1)});}else go('progress',{path:[...p.path,k]});});
}
function progTimeline(){
  const p=VP.progress,k=p.path[p.path.length-1]||null;
  const kids=childrenOf(k).map(c=>[c,periodData(c)]);
  const withData=kids.filter(([,s])=>s.runs||s.mins>=0.5);
  const cr=crumbs([['All time',{path:[]}],...p.path.map((x,i)=>[periodName(x),i===p.path.length-1?null:{path:p.path.slice(0,i+1)}])].map((c,i,a)=>i===a.length-1?[c[0],null]:c)).replace(/data-crumb=/g,'data-pcrumb=');
  const head=k?(()=>{const st=periodData(k);return `<div class="grid" style="margin:10px 0">
    <div class="card stat"><div class="k">Minutes</div><div class="v">${Math.round(st.mins)}</div></div><div class="card stat"><div class="k">Runs</div><div class="v">${st.runs}</div><div class="d">${st.passed} passed</div></div>
    <div class="card stat"><div class="k">Timing</div><div class="v">${fmtN(st.timing)}<small>%</small></div></div><div class="card stat"><div class="k">Lessons touched</div><div class="v">${st.lessons}</div></div></div>`;})():'';
  const chart=kids.length>1?`<div class="card" id="pchart">${svgBars(kids.map(([c,s])=>({l:c[0]==='M'?MON[pdate(c.slice(1)).getMonth()]:c[0]==='W'?pdate(c.slice(1)).getDate()+' '+MON[pdate(c.slice(1)).getMonth()]:c[0]==='D'?'SMTWTFS'[pdate(c.slice(1)).getDay()]:c.slice(1),v:s.mins,k:c,t:periodName(c)+': '+Math.round(s.mins)+' min · '+s.runs+' runs'})),{h:170,fmt:v=>Math.round(v)+'m'})}<div class="mut" style="font-size:13px">Minutes practised. Tap a bar to drill in.</div></div>`:'';
  const grainName=k?{Y:'Months',M:'Weeks (Sun–Sat)',W:'Days'}[k[0]]:'Years';
  return cr+head+chart+`<h2>${grainName}</h2><div class="snaps">${withData.length?withData.map(([c,s])=>snapCard(c,s)).join(''):'<div class="card mut">No practice in this period.</div>'}</div>`;
}
function progCalendar(){
  const p=VP.progress,t=new Date();if(p.calY==null){p.calY=t.getFullYear();p.calM=t.getMonth();}
  const first=new Date(p.calY,p.calM,1),start=new Date(first);start.setDate(1-first.getDay());
  const mx=Math.max(20,...Object.values(state.days).map(v=>v/60000));
  let cells=['S','M','T','W','T','F','S'].map(x=>`<div class="h">${x}</div>`).join('');
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=dkey(d),m=(state.days[k]||0)/60000,rn=runsWhere(s=>dkey(new Date(s.ts))===k).length;
    if(i>=35&&d.getMonth()!==p.calM)break;
    cells+=`<div class="d ${d.getMonth()!==p.calM?'o':''} ${p.day===k?'sel':''} ${k===dkey(t)?'t':''}" data-day="${k}" style="${m?`background:color-mix(in srgb,var(--accent) ${Math.round(15+75*Math.min(1,m/mx))}%,var(--surface));color:${m/mx>0.55?'var(--accent-ink)':'var(--ink)'}`:''}"><span>${d.getDate()}</span>${m?`<b>${Math.round(m)}m</b>`:rn?'<b>·</b>':''}</div>`;}
  const ms=statsOf(runsWhere(s=>{const d=new Date(s.ts);return d.getFullYear()===p.calY&&d.getMonth()===p.calM;}),dayMinutes(d=>d.getFullYear()===p.calY&&d.getMonth()===p.calM));
  let dayHtml='';
  if(p.day){const dr=runsWhere(s=>dkey(new Date(s.ts))===p.day),st=statsOf(dr,(state.days[p.day]||0)/60000);
    dayHtml=`<h2>${esc(periodName('D'+p.day))}</h2><div class="grid" style="margin-bottom:10px"><div class="card stat"><div class="k">Minutes</div><div class="v">${Math.round(st.mins)}</div></div><div class="card stat"><div class="k">Runs</div><div class="v">${st.runs}</div><div class="d">${st.passed} passed</div></div><div class="card stat"><div class="k">Timing</div><div class="v">${fmtN(st.timing)}<small>%</small></div></div></div>${runList([...dr].reverse(),'No scored runs this day.')}`;}
  return `<div class="row" style="margin-bottom:10px"><button data-cal="-1">‹</button><div class="h2" style="margin:0;min-width:200px;text-align:center">${MON[p.calM]} ${p.calY}</div><button data-cal="1">›</button><button class="ghost" data-cal="0">Today</button><span class="sp"></span><span class="mut">${Math.round(ms.mins)} min · ${ms.runs} runs · ${new Set(Object.keys(state.days).filter(k=>{const d=pdate(k);return d.getFullYear()===p.calY&&d.getMonth()===p.calM&&state.days[k]>0;})).size} days</span></div>
   <div class="card"><div class="cal">${cells}</div></div>${dayHtml}`;
}
const PERS={'4w':['4 weeks',28],'8w':['8 weeks',56],'6m':['6 months',182],'all':['All time',99999]};
function progPads(){
  const p=VP.progress,days=PERS[p.padPer][1],from=Date.now()-days*864e5;
  const runs=runsWhere(s=>s.ts>=from&&s.pads),pa=padAgg(runs);
  const seg=`<div class="chips" style="margin-bottom:12px">${Object.entries(PERS).map(([k,[l]])=>`<button class="sm ${p.padPer===k?'pri':''}" data-pper="${k}">${l}</button>`).join('')}</div>`;
  if(!Object.keys(pa).length)return seg+'<div class="card mut">No per-pad data in this period yet. Runs saved from 10 Nov 2026 onwards carry pad detail.</div>';
  // weekly timing per pad
  const wks=[...new Set(runs.map(s=>weekKeyD(new Date(s.ts))))].sort();
  const series=LANES.filter(v=>pa[v]&&pa[v].n>=8).map(v=>({name:VOICES[v].n,c:VOICES[v].c,pts:wks.map(w=>{const q=padAgg(runs.filter(s=>weekKeyD(new Date(s.ts))===w))[v];return q&&q.n?Math.round(q.timing):null;})}));
  const lim=Math.max(20,...Object.values(pa).map(q=>Math.abs(q.off||0)));
  const off=LANES.filter(v=>pa[v]&&pa[v].off!=null).map(v=>{const q=pa[v],w=Math.min(50,Math.abs(q.off)/lim*50);return `<div class="row" style="gap:8px;margin:5px 0"><b style="width:80px;color:${VOICES[v].c}">${VOICES[v].n}</b><div style="flex:1;position:relative;height:16px;background:var(--surface-2);border-radius:4px"><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--muted)"></div><div style="position:absolute;top:2px;bottom:2px;border-radius:3px;background:${q.off<0?'var(--blue)':'var(--warn)'};${q.off<0?`right:50%;width:${w}%`:`left:50%;width:${w}%`}"></div></div><span class="num" style="width:120px;font-size:13px">${rushTxt(q.off)}</span></div>`;}).join('');
  return seg+`<div class="grid">${LANES.filter(v=>pa[v]).map(v=>{const q=pa[v];return `<div class="card tap stat" data-padtrend="${v}" style="border-top:4px solid ${VOICES[v].c}"><div class="k" style="color:${VOICES[v].c}">${VOICES[v].n}</div><div class="v">${fmtN(q.timing)}<small>% on time</small></div><div class="d">${rushTxt(q.off)} · ${q.n} notes${q.dyn!=null?' · dyn '+Math.round(q.dyn)+'%':''}</div></div>`;}).join('')}</div>
   ${wks.length>1?`<h2>Timing by week</h2><div class="card">${svgLines(series,wks.map(w=>pdate(w).getDate()+' '+MON[pdate(w).getMonth()]),{h:210,min:0,max:100,fmt:v=>Math.round(v)+'%',labels:10})}<div class="legend">${series.map(s=>`<span><i style="background:${s.c}"></i>${s.name}</span>`).join('')}</div></div>`:''}
   <h2>Rushing ← → dragging</h2><div class="card">${off}<p class="mut" style="font-size:13px;margin-bottom:0">Average offset of hits from the click (after latency). Blue = ahead of the beat, orange = behind.</p></div>
   <h2>Limbs</h2><div class="grid">${[['Right hand',['HH','R','C']],['Hands on drums',['S','T1','T2','T3']],['Right foot',['K']],['Left foot',['HP']]].map(([n,vs])=>{const q=vs.map(v=>pa[v]).filter(Boolean);if(!q.length)return '';const N=q.reduce((a,x)=>a+x.n,0),O=q.reduce((a,x)=>a+x.on,0),oN=q.reduce((a,x)=>a+x.offN,0),oS=q.reduce((a,x)=>a+x.offSum,0);return `<div class="card stat"><div class="k">${n}</div><div class="v">${fmtN(N?100*O/N:null)}<small>%</small></div><div class="d">${rushTxt(oN?oS/oN:null)} · ${vs.filter(v=>pa[v]).map(v=>VOICES[v].n).join(', ')}</div></div>`;}).join('')}</div>`;
}
function progRecords(){
  const runs=runsWhere(),st=statsOf(runs,dayMinutes());
  const bestDay=Object.entries(state.days).sort((a,b)=>b[1]-a[1])[0];
  const byL={};runs.forEach(s=>{(byL[s.id]=byL[s.id]||[]).push(s);});
  const most=Object.entries(byL).sort((a,b)=>b[1].length-a[1].length)[0];
  const tops=Object.entries(state.prog).filter(([id,p])=>LBY[id]&&p.bestBpm).map(([id,p])=>[id,p]).sort((a,b)=>b[1].bestBpm-a[1].bestBpm).slice(0,10);
  const mastered=Object.entries(state.prog).filter(([id,p])=>LBY[id]&&p.masteredAt).sort((a,b)=>b[1].masteredAt-a[1].masteredAt).slice(0,12);
  const first=runs[0];
  return `<div class="grid">
   <div class="card stat"><div class="k">Total practice</div><div class="v">${Math.round(st.mins)}<small>min</small></div><div class="d">${(st.mins/60).toFixed(1)} hours</div></div>
   <div class="card stat"><div class="k">Runs</div><div class="v">${st.runs}</div><div class="d">${st.passed} passed</div></div>
   <div class="card stat"><div class="k">Longest streak</div><div class="v">${longestStreak()}<small>days</small></div><div class="d">current ${streakDays()}</div></div>
   <div class="card stat tap" ${bestDay?`data-day="${bestDay[0]}"`:''}><div class="k">Best day</div><div class="v">${bestDay?Math.round(bestDay[1]/60000):0}<small>min</small></div><div class="d">${bestDay?esc(periodName('D'+bestDay[0])):'–'}</div></div>
   <div class="card stat tap" ${most?`data-open="${most[0]}"`:''}><div class="k">Most practised</div><div class="v" style="font-size:28px">${most?most[0]:'–'}</div><div class="d">${most?esc(LBY[most[0]].t)+' · '+most[1].length+' runs':''}</div></div>
   <div class="card stat"><div class="k">Lessons done</div><div class="v">${LESSONS.filter(l=>statusOf(l)==='ms').length}<small>/ ${LESSONS.length}</small></div><div class="d">${first?'since '+new Date(first.ts).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):''}</div></div></div>
   <h2>Fastest passing tempos</h2>${tops.length?`<div class="list">${tops.map(([id,p])=>`<div class="lrow" data-open="${id}"><span class="idx">${id}</span><span style="flex:1">${esc(LBY[id].t)}</span><span class="num"><b>${p.bestBpm}</b> BPM</span><span class="mut num" style="font-size:13px">goal ${LBY[id].bpm[1]}</span></div>`).join('')}</div>`:'<div class="card mut">Pass a run to set a tempo record.</div>'}
   <h2>Recently mastered</h2>${mastered.length?`<div class="list">${mastered.map(([id,p])=>`<div class="lrow" data-open="${id}"><span class="idx">${id}</span><span style="flex:1">${esc(LBY[id].t)}</span><span class="mut">${new Date(p.masteredAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</span></div>`).join('')}</div>`:'<div class="card mut">Mastery dates are recorded from 10 Nov 2026 onwards.</div>'}`;
}
/* ---------- run detail ---------- */
function openRun(ts){
  const s=state.sessions.find(x=>x.ts===+ts);if(!s)return;const l=LBY[s.id];const ex=l&&l.ex?l.ex[s.ex||0]:null;
  const pads=s.pads||{};
  openSheet(`<span class="idx" style="font-size:.6em">${s.id}</span> ${esc(l?l.t:'Run')}`,`
   <div class="mut">${new Date(s.ts).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} · ${ex?esc(ex.n)+' · ':''}${s.bpm} BPM${s.dur?' · '+Math.round(s.dur)+' s':''}</div>
   <div class="grid" style="margin:12px 0">
    <div class="card stat"><div class="k">Timing</div><div class="v" style="color:${s.score>=state.set.pass?'var(--good)':'var(--warn)'}">${s.score}<small>%</small></div><div class="d">${s.on}/${s.n} on time</div></div>
    ${s.dyn!=null?`<div class="card stat"><div class="k">Dynamics</div><div class="v" style="color:${s.dyn>=state.set.dynPass?'var(--good)':'var(--warn)'}">${s.dyn}<small>%</small></div></div>`:''}
    <div class="card stat"><div class="k">Missed · extra</div><div class="v">${s.miss} · ${s.ext}</div></div>
    <div class="card stat"><div class="k">Average</div><div class="v" style="font-size:28px">${rushTxt(s.avg)||'–'}</div></div></div>
   ${Object.keys(pads).length?`<table><tr><th>Pad</th><th class="n">On time</th><th class="n">Notes</th><th class="n">Missed</th><th class="n">Extra</th><th>Timing</th><th class="n">Dyn.</th></tr>${LANES.filter(v=>pads[v]).map(v=>{const r=pads[v];return `<tr><td><b style="color:${VOICES[v].c}">${VOICES[v].n}</b></td><td class="n">${r[0]?Math.round(100*r[1]/r[0]):'–'}%</td><td class="n">${r[0]}</td><td class="n">${r[2]}</td><td class="n">${r[3]}</td><td>${rushTxt(r[4])}</td><td class="n">${r[5]!=null?r[5]+'%':'–'}</td></tr>`;}).join('')}</table>`:'<p class="mut">This run was saved before per-pad detail was recorded.</p>'}
   <h2>Every hit</h2>${s.hits?hitStrip(s.hits):'<p class="mut">No per-hit detail for this run (kept for the latest 600 runs).</p>'}
   <div class="row" style="margin-top:14px">${l&&l.type==='play'?`<button class="pri" data-close data-play="${s.id}" data-ex="${s.ex||0}">${icon('play',16)} Practise again</button>`:''}${l?`<button data-close data-open="${s.id}">Open lesson</button>`:''}</div>`);
}
function openPadTrend(v){
  const runs=runsWhere(s=>s.pads&&s.pads[v]),wks=[...new Set(runs.map(s=>weekKeyD(new Date(s.ts))))].sort().slice(-26);
  const rows=wks.map(w=>{const q=padAgg(runs.filter(s=>weekKeyD(new Date(s.ts))===w))[v];return {w,q};});
  openSheet(VOICES[v].n+' over time',`<p class="mut">Weekly, from runs with per-pad detail.</p>
   <h2 style="font-size:18px">On time %</h2><div class="card">${svgBars(rows.map(r=>({l:pdate(r.w).getDate()+' '+MON[pdate(r.w).getMonth()],v:r.q?r.q.timing:0,c:VOICES[v].c,t:periodName('W'+r.w)+': '+fmtN(r.q&&r.q.timing)+'%'})),{h:160,max:100,fmt:x=>Math.round(x)+'%'})}</div>
   <h2 style="font-size:18px">Average offset (ms)</h2><div class="card">${svgLines([{name:'offset',c:VOICES[v].c,pts:rows.map(r=>r.q&&r.q.off!=null?Math.round(r.q.off):null)}],rows.map(r=>pdate(r.w).getDate()+' '+MON[pdate(r.w).getMonth()]),{h:160,zero:true,fmt:x=>Math.round(x)+'',band:[-state.set.tol,state.set.tol]})}<p class="mut" style="font-size:13px">Below 0 = early, above = late; shaded = on-time window.</p></div>
   <table><tr><th>Week</th><th class="n">Notes</th><th class="n">On time</th><th>Timing</th>${rows.some(r=>r.q&&r.q.dyn!=null)?'<th class="n">Dyn.</th>':''}</tr>${[...rows].reverse().map(r=>`<tr><td>${esc(periodName('W'+r.w))}</td><td class="n">${r.q?r.q.n:0}</td><td class="n">${fmtN(r.q&&r.q.timing)}%</td><td>${rushTxt(r.q&&r.q.off)}</td>${rows.some(x=>x.q&&x.q.dyn!=null)?`<td class="n">${fmtN(r.q&&r.q.dyn)}%</td>`:''}</tr>`).join('')}</table>`);
}
