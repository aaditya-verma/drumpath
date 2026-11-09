/* DrumPath — Compare: crosstab any measure by lesson / level / strand / pad / exercise / week / month / tempo band */
'use strict';
const DIMS={
  lesson:['Lesson',f=>f.id,k=>{const l=tagLesson(k);return k+' '+(l?l.t:'');},(a,b)=>a.localeCompare(b,undefined,{numeric:true})],
  level:['Level',f=>String(f.lv!=null?f.lv:lessonLevel(f.id)),k=>'Level '+k,(a,b)=>a-b],
  strand:['Strand',f=>String(+String(f.id).split('.')[1]),k=>k+'. '+STRANDS[k],(a,b)=>a-b],
  song:['Song',f=>f.song,k=>{const s=songById(k);return s?s.title:k;},(a,b)=>{const x=songById(a),y=songById(b);return (x?x.title:a).localeCompare(y?y.title:b);}],
  artist:['Artist',f=>f.artist,k=>k,(a,b)=>artistKey(a).localeCompare(artistKey(b))],
  genre:['Genre',f=>f.genre,k=>k,(a,b)=>a.localeCompare(b)],
  pad:['Pad',f=>f.pad,k=>VOICES[k]?VOICES[k].n:k,(a,b)=>LANES.indexOf(a)-LANES.indexOf(b)],
  exercise:['Exercise',f=>f.id+'#'+(f.ex||0),k=>{const [id,i]=k.split('#');const l=LBY[id];return id+' · '+(l&&l.ex&&l.ex[i]?l.ex[i].n:'#'+i);},(a,b)=>a.localeCompare(b,undefined,{numeric:true})],
  week:['Week',f=>weekKeyD(new Date(f.ts)),k=>periodName('W'+k),(a,b)=>a.localeCompare(b)],
  month:['Month',f=>monthKeyD(new Date(f.ts)),k=>periodName('M'+k),(a,b)=>a.localeCompare(b)],
  tempo:['Tempo band',f=>tempoBand(f.bpm),k=>k+' BPM',(a,b)=>TEMPO_BANDS.indexOf(a)-TEMPO_BANDS.indexOf(b)],
};
// which fact table each dimension can split (runs = practice runs; skill = one per song × lesson tag; song = one per song; hist = readiness changes)
const DIM_SRC={lesson:'runs skill',level:'runs skill song',strand:'runs skill',pad:'runs',exercise:'runs',week:'runs hist',month:'runs hist',tempo:'runs',song:'skill song hist',artist:'skill song hist',genre:'skill song hist'};
const SONG_DIMS=['song','artist','genre'];
const MEAS={
  timing:['Timing %',fs=>{const n=fs.reduce((a,f)=>a+f.n,0);return n?100*fs.reduce((a,f)=>a+f.on,0)/n:null;},v=>Math.round(v)+'%',true],
  dyn:['Dynamics %',fs=>{const d=fs.filter(f=>f.dyn!=null);return d.length?d.reduce((a,f)=>a+f.dyn,0)/d.length:null;},v=>Math.round(v)+'%',true],
  offset:['Avg offset (ms)',fs=>{const w=fs.filter(f=>f.off!=null);const n=w.reduce((a,f)=>a+f.hit,0);return n?w.reduce((a,f)=>a+f.off*f.hit,0)/n:null;},v=>(v>0?'+':'')+Math.round(v),false],
  runs:['Runs',fs=>new Set(fs.map(f=>f.ts)).size||null,v=>Math.round(v),true],
  minutes:['Minutes',fs=>fs[0]&&fs[0].pad?null:fs.reduce((a,f)=>a+(f.dur||0),0)/60||null,v=>Math.round(v),true],
  pass:['Pass rate %',fs=>{const r=[...new Map(fs.map(f=>[f.ts,f])).values()];return r.length?100*r.filter(f=>f.passed).length/r.length:null;},v=>Math.round(v)+'%',true],
  skill:['Song skill score (avg)',fs=>{const w=fs.reduce((a,f)=>a+f.w,0);return w?fs.reduce((a,f)=>a+f.w*f.score,0)/w:null;},v=>Math.round(v),true,'skill'],
  gap:['Skill gap to song tempo (BPM)',fs=>{const g=fs.filter(f=>f.gap!=null);return g.length?g.reduce((a,f)=>a+f.gap,0)/g.length:null;},v=>Math.round(v),false,'skill'],
  songs:['Songs that use it',fs=>new Set(fs.map(f=>f.song)).size||null,v=>Math.round(v),true,'skill'],
  ready:['Song readiness % (avg)',fs=>fs.length?fs.reduce((a,f)=>a+f.ready,0)/fs.length:null,v=>Math.round(v)+'%',true,'song'],
  rchange:['Readiness change (points)',fs=>fs.length?fs.reduce((a,f)=>a+f.delta,0):null,v=>(v>0?'+':'')+Math.round(v),true,'hist'],
  bpm:['Best passing BPM',fs=>{const b=fs.filter(f=>f.passed).map(f=>f.bpm);return b.length?Math.max(...b):null;},v=>Math.round(v),true],
};
function songFacts(src,per){
  const from=per==='all'?0:Date.now()-PERS[per][1]*864e5;
  const stats=allSongStats(songCtx());
  if(src==='skill')return stats.flatMap(x=>x.skills.map(k=>({song:x.song.id,artist:x.song.artist,genre:x.song.genre,id:k.id,w:k.w,core:k.core,score:k.score,
    gap:!k.coming&&k.T&&k.best?Math.max(0,k.T-k.best):null,ready:x.ready})));
  if(src==='song')return stats.map(x=>({song:x.song.id,artist:x.song.artist,genre:x.song.genre,lv:x.level,ready:x.ready}));
  // hist: one fact per day the readiness moved, delta vs the previous value (first value counts from 0)
  const out=[];stats.forEach(x=>{let prev=0;(state.songHist[x.song.id]||[]).forEach(([d,v])=>{const ts=pdate(d).getTime();if(ts>=from&&v!==prev)out.push({song:x.song.id,artist:x.song.artist,genre:x.song.genre,ts,delta:v-prev});prev=v;});});
  return out;
}
function cmpFacts(withPad,per){
  const from=per==='all'?0:Date.now()-PERS[per][1]*864e5;
  const runs=runsWhere(s=>s.ts>=from);
  if(!withPad)return runs.map(s=>({ts:s.ts,id:s.id,ex:s.ex,bpm:s.bpm,n:s.n,on:s.on,dyn:s.dyn,off:s.avg,hit:s.n-s.miss,dur:s.dur,passed:runPassed(s)}));
  const out=[];runs.forEach(s=>{if(!s.pads)return;Object.entries(s.pads).forEach(([v,r])=>out.push({ts:s.ts,id:s.id,ex:s.ex,bpm:s.bpm,pad:v,n:r[0],on:r[1],hit:r[0]-r[2],off:r[4],dyn:r[5],dur:s.dur,passed:runPassed(s)}));});return out;
}
let cmpCells={};
function renderCompare(){
  const p=VP.compare,withPad=p.r==='pad'||p.c==='pad';
  const src=MEAS[p.m][4]||'runs',ok=k=>DIM_SRC[k].split(' ').includes(src);
  const bad=[p.r,p.c].filter(k=>!ok(k));
  const facts=bad.length?[]:src==='runs'?cmpFacts(withPad,p.per):songFacts(src,p.per),[,rk,rl,rs]=DIMS[p.r],[,ck,cl,cs]=DIMS[p.c],[mn,mf,mfmt,hiGood]=MEAS[p.m];
  const rows=[...new Set(facts.map(rk))].sort(rs),cols=p.r===p.c?['all']:[...new Set(facts.map(ck))].sort(cs);
  cmpCells={};const vals=[];
  rows.forEach(r=>cols.forEach(c=>{const fs=facts.filter(f=>rk(f)===r&&(c==='all'||ck(f)===c));if(!fs.length)return;const v=mf(fs);if(v!=null){cmpCells[r+'|'+c]={v,fs};vals.push(v);}}));
  const lo=Math.min(...vals),hi=Math.max(...vals);
  const shade=v=>{if(vals.length<2||hi===lo)return 'transparent';let t=(v-lo)/(hi-lo);if(p.m==='offset'){t=Math.min(1,Math.abs(v)/Math.max(Math.abs(lo),Math.abs(hi),1));return `color-mix(in srgb,${v<0?'var(--blue)':'var(--warn)'} ${Math.round(t*55)}%,transparent)`;}if(!hiGood)t=1-t;return `color-mix(in srgb,var(--accent) ${Math.round(8+t*60)}%,transparent)`;};
  const sel=(name,cur_,opts)=>`<label class="f">${name}</label><select data-cmp="${name==='Rows'?'r':name==='Columns'?'c':name==='Measure'?'m':'per'}">${opts.map(([k,l])=>`<option value="${k}" ${k===cur_?'selected':''}>${l}</option>`).join('')}</select>`;
  const presets=[['Pad × Week · timing','pad','week','timing'],['Strand × Month · minutes','strand','month','minutes'],['Lesson × Tempo · pass rate','lesson','tempo','pass'],['Pad × Lesson · offset','lesson','pad','offset'],
    ['Genre × Strand · skill score','genre','strand','skill'],['Artist × Level · readiness','artist','level','ready'],['Lesson × Genre · songs using it','lesson','genre','songs'],['Song × Week · readiness change','song','week','rchange'],['Genre × Level · gap to song tempo','genre','level','gap']];
  const fix=bad.length?(()=>{const opts=Object.entries(MEAS).filter(([,d])=>[p.r,p.c].every(k=>DIM_SRC[k].split(' ').includes(d[4]||'runs')));
    return `<div class="card mut">${esc(MEAS[p.m][0])} can’t be split by ${bad.map(k=>DIMS[k][0]).join(' or ')}.${opts.length?' Try: '+opts.map(([k,d])=>`<button class="sm" data-preset='${JSON.stringify({m:k})}'>${esc(d[0])}</button>`).join(' '):''}</div>`;})():'';
  const same=sameViewLinks(p);
  view.innerHTML=`<h1>Compare</h1><p class="sub">Pick rows, columns and a measure. Darker = better (for offset: blue early, orange late). Tap a cell for the runs behind it.</p>
   <div class="chips" style="margin-bottom:10px">${presets.map(([n,r,c,m])=>`<button class="sm ${p.r===r&&p.c===c&&p.m===m?'pri':''}" data-preset='${JSON.stringify({r,c,m})}'>${n}</button>`).join('')}</div>
   <div class="card grid" style="margin-bottom:12px">
    <div>${sel('Rows',p.r,Object.entries(DIMS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Columns',p.c,Object.entries(DIMS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Measure',p.m,Object.entries(MEAS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Period',p.per,Object.entries(PERS).map(([k,d])=>[k,d[0]]))}</div></div>
   ${fix||(!facts.length?`<div class="card mut">${src==='hist'?'No readiness changes in this period yet. They appear as you practise lessons that songs use.':withPad?'No runs with per-pad detail in this period yet (recorded from 10 Nov 2026).':'No runs in this period yet.'}</div>`:
   p.m==='minutes'&&withPad?'<div class="card mut">Minutes can’t be split by pad. Choose another measure or dimension.</div>':
   `<div class="pivot"><table><tr><th class="rh">${DIMS[p.r][0]} \\ ${p.r===p.c?mn:DIMS[p.c][0]}</th>${cols.map(c=>`<th>${esc(c==='all'?mn:cl(c))}</th>`).join('')}</tr>
    ${rows.map(r=>`<tr><th class="rh">${esc(rl(r))}</th>${cols.map(c=>{const x=cmpCells[r+'|'+c];return x?`<td class="cell" data-cell2="${esc(r+'|'+c)}" style="background:${shade(x.v)}">${mfmt(x.v)}</td>`:'<td class="mut" style="text-align:center">·</td>';}).join('')}</tr>`).join('')}</table></div>`)}
   ${same?`<div class="row" style="margin-top:12px;gap:6px"><span class="mut" style="font-size:13px">Same view in</span>${same}</div>`:''}
   ${TEST?'<div class="card" style="margin-top:12px"><button class="sm" data-act="cmptest">Run Compare tests</button><div id="cmptests"></div></div>':''}`;
  view.querySelectorAll('[data-cell2]').forEach(td=>td.addEventListener('click',()=>cellSheet(td.dataset.cell2,src,rl,cl,mn,mfmt)));
}
// tap a cell: the songs behind it (song measures) and the runs behind it, plus links into Songs / Lessons / Progress
function cellSheet(key,src,rl,cl,mn,mfmt){
  const x=cmpCells[key];const [r,c]=key.split('|'),p=VP.compare;
  let runs,songsHtml='';
  if(src==='runs')runs=[...new Set(x.fs.map(f=>f.ts))].map(ts=>state.sessions.find(s=>s.ts===ts)).filter(Boolean).reverse();
  else{const ids=new Set(x.fs.map(f=>f.id).filter(Boolean));runs=state.sessions.filter(s=>ids.has(s.id)).slice().reverse();
    const st=allSongStats(songCtx()),by=Object.fromEntries(st.map(s=>[s.song.id,s]));const sids=[...new Set(x.fs.map(f=>f.song))].map(id=>by[id]).filter(Boolean).sort((a,b)=>b.ready-a.ready);
    songsHtml=`<h2 style="margin-top:6px">Songs (${sids.length})</h2><div class="list">${sids.slice(0,30).map(s=>`<div class="lrow" data-song="${esc(s.song.id)}">${ring(s.ready/100,30,4)}<b>${esc(s.song.title)}</b><span class="mut">${esc(s.song.artist)}</span><span class="sp"></span>${stChip(s.state)}</div>`).join('')}</div>`;
    if(ids.size)songsHtml+=`<h2>Lessons</h2><div class="chips">${[...ids].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(id=>LBY[id]?`<button class="sm" data-open="${id}">${id} ${esc(LBY[id].t)}</button>`:`<span class="chip">${id} (coming)</span>`).join('')}</div>`;}
  const jump=[];const add=(dim,k)=>{if(dim==='genre')jump.push(`<button class="sm" data-nav="songs" data-p='${JSON.stringify({view:'all',genre:k,id:null})}'>Songs · ${esc(k)}</button>`);
    if(dim==='artist')jump.push(`<button class="sm" data-nav="songs" data-p='${JSON.stringify({view:'artist',id:null})}'>Songs by artist</button>`);
    if(dim==='song')jump.push(`<button class="sm" data-song="${esc(k)}">Open song</button>`);
    if(dim==='level')jump.push(`<button class="sm" data-lvl="${k}">Level ${k} in Lessons</button>`);
    if(dim==='strand')jump.push(`<button class="sm" data-nav="lessons" data-p='${JSON.stringify({lv:null,sd:null,id:null})}'>Skill map</button>`);
    if(dim==='lesson'&&LBY[k])jump.push(`<button class="sm" data-open="${k}">Open ${k}</button>`);
    if(dim==='week'||dim==='month')jump.push(`<button class="sm" data-nav="progress" data-p='${JSON.stringify({mode:'timeline',path:[(dim==='week'?'W':'M')+k]})}'>${esc(periodName((dim==='week'?'W':'M')+k))} in Progress</button>`);};
  add(p.r,r);if(c!=='all')add(p.c,c);
  openSheet(esc(rl(r))+(c==='all'?'':' · '+esc(cl(c))),`<p class="mut">${esc(mn)}: <b>${mfmt(x.v)}</b>${src==='runs'?` from ${runs.length} run${runs.length===1?'':'s'}`:''}. Tap a run for its detail.</p>
    ${jump.length?`<div class="chips" style="margin-bottom:8px">${jump.join('')}</div>`:''}${songsHtml}<h2>Runs${src!=='runs'?' on these lessons':''} (${runs.length})</h2>${runList(runs.slice(0,40),'No runs yet.')}`);
}
// "Same view in…": jump to the matching screen with the same grouping
function sameViewLinks(p){const d=[p.r,p.c],o=[];
  if(d.includes('song')&&d.includes('lesson'))o.push(`<button class="sm" data-nav="songs" data-p='{"view":"matrix","mgroup":"genre","id":null}'>Songs matrix</button>`);
  if(d.includes('genre'))o.push(`<button class="sm" data-nav="songs" data-p='{"view":"genre","id":null}'>Songs by genre</button>`);
  if(d.includes('artist'))o.push(`<button class="sm" data-nav="songs" data-p='{"view":"artist","id":null}'>Songs by artist</button>`);
  if(d.includes('level')||d.includes('strand'))o.push(`<button class="sm" data-nav="lessons" data-p='{"lv":null,"sd":null,"id":null}'>Lessons skill map</button>`);
  if(d.includes('week')||d.includes('month'))o.push(`<button class="sm" data-nav="progress" data-p='{"mode":"timeline","path":[]}'>Progress timeline</button>`);
  if(d.includes('pad'))o.push(`<button class="sm" data-nav="progress" data-p='{"mode":"pads"}'>Progress · limbs &amp; pads</button>`);
  return o.join('');
}
/* tests (?test=1) */
function compareTests(){const out=[],T=(n,ok,d)=>out.push({name:n,pass:!!ok,det:d||''});const keep=JSON.stringify(VP.compare);
  try{const st=allSongStats(songCtx());
    const sk=songFacts('skill','all');T('Skill facts: one per song × tag',sk.length===st.reduce((a,x)=>a+x.skills.length,0),sk.length+' facts');
    const L=sk.filter(f=>f.id==='1.5.03');T('Lesson × Genre · songs using it matches the catalog',new Set(L.map(f=>f.song)).size===allSongs().filter(s=>s.core.includes('1.5.03')||s.support.includes('1.5.03')).length,new Set(L.map(f=>f.song)).size+' songs use 1.5.03');
    const g=st.filter(x=>x.song.genre==='Rock');const avg=g.reduce((a,x)=>a+x.ready,0)/g.length;const sf=songFacts('song','all').filter(f=>f.genre==='Rock');
    T('Genre readiness equals the mean of its songs',Math.abs(MEAS.ready[1](sf)-avg)<1e-9,Math.round(avg)+'%');
    for(const [n,r,c,m] of [['Genre × Strand','genre','strand','skill'],['Artist × Level','artist','level','ready'],['Lesson × Genre','lesson','genre','songs'],['Song × Week','song','week','rchange']]){
      Object.assign(VP.compare,{r,c,m,per:'all'});renderCompare();const ok=!!view.querySelector('.pivot')||/No readiness changes/.test(view.textContent);T('Preset renders: '+n,ok,Object.keys(cmpCells).length+' cells');}
    Object.assign(VP.compare,{r:'pad',c:'week',m:'skill'});renderCompare();T('Unsupported pair explains itself',/can’t be split by/.test(view.textContent),'');
  }catch(e){T('Compare tests',false,e.message);}
  VP.compare=JSON.parse(keep);return out;}
