/* DrumPath — small SVG chart helpers and data aggregation (periods, runs, pads, facts for Compare) */
'use strict';
/* ---------- charts ---------- */
const fmtN=(v,d=0)=>v==null||isNaN(v)?'–':Number(v).toFixed(d);
// vertical bars. items: [{l,v,c,k,t}] — k becomes data-k for taps, t is a tooltip
function svgBars(items,o={}){
  const W=o.w||900,H=o.h||200,pl=40,pb=22,pt=10,n=Math.max(1,items.length);
  const mx=o.max!=null?o.max:Math.max(1,...items.map(i=>i.v||0));const bw=(W-pl-6)/n;
  const y=v=>pt+(H-pt-pb)*(1-Math.min(1,(v||0)/mx));
  const ticks=[0,mx/2,mx].map(t=>`<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${pl-4}" y="${y(t)+4}" text-anchor="end">${o.fmt?o.fmt(t):Math.round(t)}</text>`).join('');
  const step=Math.ceil(n/(o.labels||14));
  const bars=items.map((it,i)=>{const x=pl+i*bw+bw*0.15,w=Math.max(1,bw*0.7),yy=y(it.v);
    return `<g ${it.k!=null?`data-k="${esc(it.k)}" style="cursor:pointer"`:''}><title>${esc(it.t||(it.l+': '+(o.fmt?o.fmt(it.v):it.v)))}</title><rect x="${pl+i*bw}" y="${pt}" width="${bw}" height="${H-pt-pb}" fill="transparent"/><rect x="${x}" y="${yy}" width="${w}" height="${Math.max(0,H-pb-yy)}" rx="3" fill="${it.c||'var(--accent)'}"/>${i%step===0?`<text x="${x+w/2}" y="${H-6}" text-anchor="middle">${esc(it.l)}</text>`:''}</g>`;}).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">${ticks}${bars}</svg>`;
}
// lines. series: [{name,c,pts:[v|null,...]}], labels:[..]
function svgLines(series,labels,o={}){
  const W=o.w||900,H=o.h||220,pl=44,pb=22,pt=10,n=Math.max(2,labels.length);
  const vals=series.flatMap(s=>s.pts).filter(v=>v!=null);
  let lo=o.min!=null?o.min:Math.min(...vals,0),hi=o.max!=null?o.max:Math.max(...vals,1);if(hi===lo)hi=lo+1;
  const x=i=>pl+(W-pl-8)*(i/(n-1)),y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  let g=[lo,(lo+hi)/2,hi].map(t=>`<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${pl-4}" y="${y(t)+4}" text-anchor="end">${o.fmt?o.fmt(t):Math.round(t)}</text>`).join('');
  if(o.band)g+=`<rect x="${pl}" width="${W-pl}" y="${y(o.band[1])}" height="${Math.max(0,y(o.band[0])-y(o.band[1]))}" fill="var(--accent-soft)" opacity=".7"/>`;
  if(o.zero&&lo<0&&hi>0)g+=`<line x1="${pl}" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
  const step=Math.ceil(labels.length/(o.labels||10));
  g+=labels.map((l,i)=>i%step===0?`<text x="${x(i)}" y="${H-6}" text-anchor="middle">${esc(l)}</text>`:'').join('');
  series.forEach(s=>{let d='',pen=false;s.pts.forEach((v,i)=>{if(v==null){pen=false;return;}d+=(pen?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' ';pen=true;});
    g+=`<path d="${d}" fill="none" stroke="${s.c||'var(--accent)'}" stroke-width="2.4" stroke-linejoin="round"/>`+s.pts.map((v,i)=>v==null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="${s.dots?s.dots[i]?4:2.5:3}" fill="${s.dots&&s.dots[i]===false?'var(--surface)':s.c||'var(--accent)'}" stroke="${s.c||'var(--accent)'}" stroke-width="1.5"><title>${esc(s.name||'')} ${esc(labels[i])}: ${o.fmt?o.fmt(v):v}</title></circle>`).join('');});
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">${g}</svg>`;
}
function ring(p,sz=54,sw=6,label){
  const r=(sz-sw)/2,c=2*Math.PI*r,v=Math.max(0,Math.min(1,p||0));
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="flex:none"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${sw}"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c*v} ${c}" transform="rotate(-90 ${sz/2} ${sz/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" style="font-family:var(--f-mono);font-size:${sz*0.24}px;font-weight:600;fill:var(--ink)">${label!=null?label:Math.round(v*100)+'%'}</text></svg>`;
}
function spark(vals,w=90,h=26,c='var(--accent)'){
  const v=vals.filter(x=>x!=null);if(v.length<2)return '';const lo=Math.min(...v),hi=Math.max(...v)||1,d=hi-lo||1;
  return `<svg width="${w}" height="${h}"><polyline fill="none" stroke="${c}" stroke-width="2" points="${vals.map((x,i)=>x==null?'':`${(i/(vals.length-1)*(w-4)+2).toFixed(1)},${(h-3-(x-lo)/d*(h-6)).toFixed(1)}`).join(' ')}"/></svg>`;
}
// hit strip: one row per pad, dots = hits in order, y = offset (early above the line, late below)
function hitStrip(hits,o={}){
  const lanes=[...new Set(hits.map(h=>h[0]))].sort((a,b)=>a-b);if(!lanes.length)return '<p class="mut">No per-hit detail for this run.</p>';
  const W=o.w||900,rh=64,pl=80,H=lanes.length*rh+20,lim=Math.max(state.set.win,60),tol=state.set.tol;
  let g='';lanes.forEach((ln,r)=>{const v=LANES[ln],y0=10+r*rh+rh/2,hs=hits.filter(h=>h[0]===ln),n=hs.length;
    const yy=dt=>y0+Math.max(-1,Math.min(1,dt/lim))*(rh/2-6);
    g+=`<rect x="${pl}" y="${yy(-tol)}" width="${W-pl}" height="${yy(tol)-yy(-tol)}" fill="var(--accent-soft)"/><line x1="${pl}" x2="${W}" y1="${y0}" y2="${y0}" stroke="var(--muted)" stroke-dasharray="3 3"/>
      <text x="${pl-8}" y="${y0+4}" text-anchor="end" style="font-family:var(--f-body);font-weight:700;fill:${VOICES[v].c}">${VOICES[v].n}</text>`;
    hs.forEach((h,i)=>{const x=pl+8+(W-pl-16)*(n>1?i/(n-1):0.5),a=Math.abs(h[1]);g+=`<circle cx="${x}" cy="${yy(h[1])}" r="4.5" fill="${a<=tol?'var(--good)':h[1]<0?'var(--blue)':'var(--warn)'}"><title>${h[1]>0?'+':''}${h[1]} ms · vel ${h[2]}</title></circle>`;});
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">${g}</svg><div class="legend"><span><i style="background:var(--good)"></i>on time (±${tol} ms, shaded)</span><span><i style="background:var(--blue)"></i>early (above)</span><span><i style="background:var(--warn)"></i>late (below)</span></div>`;
}

/* ---------- dates & periods ---------- */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pdate=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,(m||1)-1,d||1);};
function weekKeyD(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return dkey(x);} // weeks start Sunday
const monthKeyD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
// period keys: 'Y2026', 'M2026-11', 'W2026-11-08' (Sunday), 'D2026-11-10'
function periodName(k){if(!k)return '';const t=k[0],v=k.slice(1);
  if(t==='Y')return v;if(t==='M'){const d=pdate(v);return MON[d.getMonth()]+' '+d.getFullYear();}
  if(t==='W'){const d=pdate(v),e=new Date(d);e.setDate(d.getDate()+6);return d.getDate()+' '+MON[d.getMonth()]+' – '+e.getDate()+' '+MON[e.getMonth()];}
  const d=pdate(v);return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()];}
function keyOf(grain,d){return grain==='Y'?'Y'+d.getFullYear():grain==='M'?'M'+monthKeyD(d):grain==='W'?'W'+weekKeyD(d):'D'+dkey(d);}
function inPeriod(k,d){return keyOf(k[0],d)===k;}
function childGrain(g){return {Y:'M',M:'W',W:'D'}[g];}

/* ---------- runs & stats ---------- */
const lessonOf=s=>LBY[s.id];
const runPassed=s=>s.score>=state.set.pass&&(s.dyn==null||s.dyn>=state.set.dynPass);
const tempoBand=b=>b<=70?'≤ 70':b<=90?'75–90':b<=110?'95–110':'115+';
const TEMPO_BANDS=['≤ 70','75–90','95–110','115+'];
function runsWhere(f){return state.sessions.filter(s=>LBY[s.id]&&(!f||f(s)));}
function dayMinutes(pred){let ms=0;for(const k in state.days){if(!pred||pred(pdate(k)))ms+=state.days[k];}return ms/60000;}
function statsOf(runs,mins){
  const n=runs.reduce((a,s)=>a+s.n,0),on=runs.reduce((a,s)=>a+s.on,0);const dy=runs.filter(s=>s.dyn!=null);
  return{runs:runs.length,mins:mins!=null?mins:runs.reduce((a,s)=>a+(s.dur||0),0)/60,timing:n?100*on/n:null,dyn:dy.length?dy.reduce((a,s)=>a+s.dyn,0)/dy.length:null,
    lessons:new Set(runs.map(s=>s.id)).size,passed:runs.filter(runPassed).length,best:runs.length?Math.max(...runs.map(s=>s.score)):null};
}
function streakDays(){let n=0;const d=new Date();if(!state.days[dkey(d)])d.setDate(d.getDate()-1);while(state.days[dkey(d)]){n++;d.setDate(d.getDate()-1);}return n;}
function longestStreak(){const ks=Object.keys(state.days).filter(k=>state.days[k]>0).sort();let best=0,c=0,prev=null;ks.forEach(k=>{const d=pdate(k);if(prev&&(d-prev)/864e5<1.5)c++;else c=1;best=Math.max(best,c);prev=d;});return best;}
function weekStart(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d;}
// per-pad aggregate over runs that saved per-pad detail
function padAgg(runs){const a={};runs.forEach(s=>{if(!s.pads)return;Object.entries(s.pads).forEach(([v,r])=>{const q=a[v]||(a[v]={n:0,on:0,miss:0,ext:0,offSum:0,offN:0,dynSum:0,dynN:0});
  q.n+=r[0];q.on+=r[1];q.miss+=r[2];q.ext+=r[3];if(r[4]!=null){const hit=r[0]-r[2];q.offSum+=r[4]*hit;q.offN+=hit;}if(r[5]!=null){q.dynSum+=r[5];q.dynN++;}});});
  Object.values(a).forEach(q=>{q.timing=q.n?100*q.on/q.n:null;q.off=q.offN?q.offSum/q.offN:null;q.dyn=q.dynN?q.dynSum/q.dynN:null;});return a;}
const rushTxt=o=>o==null?'':Math.abs(o)<6?'on the beat':o<0?Math.round(-o)+' ms early':Math.round(o)+' ms late';
function nextLesson(){return LESSONS.find(l=>statusOf(l)!=='ms')||LESSONS[LESSONS.length-1];}
