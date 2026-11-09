/* DrumPath — Compare: crosstab any measure by lesson / level / strand / pad / exercise / week / month / tempo band */
'use strict';
const DIMS={
  lesson:['Lesson',f=>f.id,k=>k+' '+(LBY[k]?LBY[k].t:''),(a,b)=>a.localeCompare(b,undefined,{numeric:true})],
  level:['Level',f=>String(LBY[f.id].lv),k=>'Level '+k,(a,b)=>a-b],
  strand:['Strand',f=>String(LBY[f.id].sd),k=>k+'. '+STRANDS[k],(a,b)=>a-b],
  pad:['Pad',f=>f.pad,k=>VOICES[k]?VOICES[k].n:k,(a,b)=>LANES.indexOf(a)-LANES.indexOf(b)],
  exercise:['Exercise',f=>f.id+'#'+(f.ex||0),k=>{const [id,i]=k.split('#');const l=LBY[id];return id+' · '+(l&&l.ex&&l.ex[i]?l.ex[i].n:'#'+i);},(a,b)=>a.localeCompare(b,undefined,{numeric:true})],
  week:['Week',f=>weekKeyD(new Date(f.ts)),k=>periodName('W'+k),(a,b)=>a.localeCompare(b)],
  month:['Month',f=>monthKeyD(new Date(f.ts)),k=>periodName('M'+k),(a,b)=>a.localeCompare(b)],
  tempo:['Tempo band',f=>tempoBand(f.bpm),k=>k+' BPM',(a,b)=>TEMPO_BANDS.indexOf(a)-TEMPO_BANDS.indexOf(b)],
};
const MEAS={
  timing:['Timing %',fs=>{const n=fs.reduce((a,f)=>a+f.n,0);return n?100*fs.reduce((a,f)=>a+f.on,0)/n:null;},v=>Math.round(v)+'%',true],
  dyn:['Dynamics %',fs=>{const d=fs.filter(f=>f.dyn!=null);return d.length?d.reduce((a,f)=>a+f.dyn,0)/d.length:null;},v=>Math.round(v)+'%',true],
  offset:['Avg offset (ms)',fs=>{const w=fs.filter(f=>f.off!=null);const n=w.reduce((a,f)=>a+f.hit,0);return n?w.reduce((a,f)=>a+f.off*f.hit,0)/n:null;},v=>(v>0?'+':'')+Math.round(v),false],
  runs:['Runs',fs=>new Set(fs.map(f=>f.ts)).size||null,v=>Math.round(v),true],
  minutes:['Minutes',fs=>fs[0]&&fs[0].pad?null:fs.reduce((a,f)=>a+(f.dur||0),0)/60||null,v=>Math.round(v),true],
  pass:['Pass rate %',fs=>{const r=[...new Map(fs.map(f=>[f.ts,f])).values()];return r.length?100*r.filter(f=>f.passed).length/r.length:null;},v=>Math.round(v)+'%',true],
  bpm:['Best passing BPM',fs=>{const b=fs.filter(f=>f.passed).map(f=>f.bpm);return b.length?Math.max(...b):null;},v=>Math.round(v),true],
};
function cmpFacts(withPad,per){
  const from=per==='all'?0:Date.now()-PERS[per][1]*864e5;
  const runs=runsWhere(s=>s.ts>=from);
  if(!withPad)return runs.map(s=>({ts:s.ts,id:s.id,ex:s.ex,bpm:s.bpm,n:s.n,on:s.on,dyn:s.dyn,off:s.avg,hit:s.n-s.miss,dur:s.dur,passed:runPassed(s)}));
  const out=[];runs.forEach(s=>{if(!s.pads)return;Object.entries(s.pads).forEach(([v,r])=>out.push({ts:s.ts,id:s.id,ex:s.ex,bpm:s.bpm,pad:v,n:r[0],on:r[1],hit:r[0]-r[2],off:r[4],dyn:r[5],dur:s.dur,passed:runPassed(s)}));});return out;
}
let cmpCells={};
function renderCompare(){
  const p=VP.compare,withPad=p.r==='pad'||p.c==='pad';
  const facts=cmpFacts(withPad,p.per),[,rk,rl,rs]=DIMS[p.r],[,ck,cl,cs]=DIMS[p.c],[mn,mf,mfmt,hiGood]=MEAS[p.m];
  const rows=[...new Set(facts.map(rk))].sort(rs),cols=p.r===p.c?['all']:[...new Set(facts.map(ck))].sort(cs);
  cmpCells={};const vals=[];
  rows.forEach(r=>cols.forEach(c=>{const fs=facts.filter(f=>rk(f)===r&&(c==='all'||ck(f)===c));if(!fs.length)return;const v=mf(fs);if(v!=null){cmpCells[r+'|'+c]={v,fs};vals.push(v);}}));
  const lo=Math.min(...vals),hi=Math.max(...vals);
  const shade=v=>{if(vals.length<2||hi===lo)return 'transparent';let t=(v-lo)/(hi-lo);if(p.m==='offset'){t=Math.min(1,Math.abs(v)/Math.max(Math.abs(lo),Math.abs(hi),1));return `color-mix(in srgb,${v<0?'var(--blue)':'var(--warn)'} ${Math.round(t*55)}%,transparent)`;}if(!hiGood)t=1-t;return `color-mix(in srgb,var(--accent) ${Math.round(8+t*60)}%,transparent)`;};
  const sel=(name,cur_,opts)=>`<label class="f">${name}</label><select data-cmp="${name==='Rows'?'r':name==='Columns'?'c':name==='Measure'?'m':'per'}">${opts.map(([k,l])=>`<option value="${k}" ${k===cur_?'selected':''}>${l}</option>`).join('')}</select>`;
  const presets=[['Pad × Week · timing','pad','week','timing'],['Strand × Month · minutes','strand','month','minutes'],['Lesson × Tempo · pass rate','lesson','tempo','pass'],['Pad × Lesson · offset','lesson','pad','offset']];
  view.innerHTML=`<h1>Compare</h1><p class="sub">Pick rows, columns and a measure. Darker = better (for offset: blue early, orange late). Tap a cell for the runs behind it.</p>
   <div class="chips" style="margin-bottom:10px">${presets.map(([n,r,c,m])=>`<button class="sm ${p.r===r&&p.c===c&&p.m===m?'pri':''}" data-preset='${JSON.stringify({r,c,m})}'>${n}</button>`).join('')}</div>
   <div class="card grid" style="margin-bottom:12px">
    <div>${sel('Rows',p.r,Object.entries(DIMS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Columns',p.c,Object.entries(DIMS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Measure',p.m,Object.entries(MEAS).map(([k,d])=>[k,d[0]]))}</div>
    <div>${sel('Period',p.per,Object.entries(PERS).map(([k,d])=>[k,d[0]]))}</div></div>
   ${!facts.length?`<div class="card mut">${withPad?'No runs with per-pad detail in this period yet (recorded from 10 Nov 2026).':'No runs in this period yet.'}</div>`:
   p.m==='minutes'&&withPad?'<div class="card mut">Minutes can’t be split by pad. Choose another measure or dimension.</div>':
   `<div class="pivot"><table><tr><th class="rh">${DIMS[p.r][0]} \\ ${p.r===p.c?mn:DIMS[p.c][0]}</th>${cols.map(c=>`<th>${esc(c==='all'?mn:cl(c))}</th>`).join('')}</tr>
    ${rows.map(r=>`<tr><th class="rh">${esc(rl(r))}</th>${cols.map(c=>{const x=cmpCells[r+'|'+c];return x?`<td class="cell" data-cell2="${esc(r+'|'+c)}" style="background:${shade(x.v)}">${mfmt(x.v)}</td>`:'<td class="mut" style="text-align:center">·</td>';}).join('')}</tr>`).join('')}</table></div>`}`;
  view.querySelectorAll('[data-cell2]').forEach(td=>td.addEventListener('click',()=>{const x=cmpCells[td.dataset.cell2];const [r,c]=td.dataset.cell2.split('|');
    const runs=[...new Set(x.fs.map(f=>f.ts))].map(ts=>state.sessions.find(s=>s.ts===ts)).filter(Boolean).reverse();
    openSheet(esc(rl(r))+(c==='all'?'':' · '+esc(cl(c))),`<p class="mut">${mn}: <b>${mfmt(x.v)}</b> from ${runs.length} run${runs.length===1?'':'s'}. Tap a run for its detail.</p>${runList(runs)}`);}));
}
