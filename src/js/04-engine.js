/* DrumPath — audio + practice engine (runs, scoring, note lane, results) */
'use strict';
/* ============ AUDIO ============ */
let ac=null, noiseBuf=null;
function audio(){
  if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();
    noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  if(ac.state==='suspended')ac.resume();
  return ac;
}
function env(g,t,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+0.002);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);}
function click(t,kind,nodes){
  const o=ac.createOscillator(),g=ac.createGain();
  o.frequency.value=kind==='acc'?1600:kind==='sub'?900:1100;
  const vol=state.set.vol*(kind==='acc'?1:kind==='sub'?0.3:0.65);
  env(g,t,Math.max(vol,0.0002),0.05);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+0.06);nodes.push(o);
}
function drum(v,t,nodes){
  const g=ac.createGain();g.connect(ac.destination);
  if(v==='K'||v==='T1'||v==='T2'||v==='T3'){
    const o=ac.createOscillator();const f={K:[120,45],T1:[260,170],T2:[200,130],T3:[150,95]}[v];
    o.frequency.setValueAtTime(f[0],t);o.frequency.exponentialRampToValueAtTime(f[1],t+0.15);
    env(g,t,0.9,v==='K'?0.35:0.3);o.connect(g);o.start(t);o.stop(t+0.4);nodes.push(o);
  }else{
    const s=ac.createBufferSource();s.buffer=noiseBuf;const fl=ac.createBiquadFilter();
    if(v==='S'){fl.type='bandpass';fl.frequency.value=1800;env(g,t,0.8,0.18);}
    else if(v==='HH'||v==='HP'){fl.type='highpass';fl.frequency.value=7000;env(g,t,0.45,0.05);}
    else{fl.type='highpass';fl.frequency.value=4500;env(g,t,0.4,v==='C'?1.0:0.4);}
    s.connect(fl).connect(g);s.start(t);s.stop(t+1.1);nodes.push(s);
  }
}

/* ============ PRACTICE ENGINE ============ */
let lastRunTs=0, L=null, exI=0, bpm=60, run=null, preview=null, lastFeed=0, flashes={}, wake=null;
const cv=$('#cv'), cx=cv.getContext('2d');

function beatStepsOf(ex){const sub=ex.sub,spb=ex.steps||4*sub;return ex.clicks?ex.clicks.slice():Array.from({length:Math.ceil(spb/sub)},(_,i)=>i*sub).filter(x=>x<spb);}
function buildRun(lesson,ex,bpmv,base,opts={}){
  const sub=ex.sub, spb=ex.steps||4*sub, patSteps=spb*ex.bars;
  const beatMs=60000/bpmv, stepMs=beatMs/sub, barMs=spb*stepMs;
  const swOff=((ex.swing||0.5)-0.5)*2*stepMs;
  const sw=st=>(st%spb)%2?swOff:0;
  let reps;
  if(lesson.loop===1||opts.calib)reps=1;
  else{const want=Math.max(state.set.bars,ex.bars);reps=Math.ceil(want/ex.bars);if(lesson.call&&reps%2)reps++;}
  const cinBars=opts.calib?1:state.set.countin, cinMs=cinBars*barMs;
  const evs=[];
  for(let r=0;r<reps;r++){
    const listen=lesson.call&&r%2===0;
    for(const v in ex.v){const s=ex.v[v];
      for(let i=0;i<patSteps;i++){const c=s[i];if(!c||c==='.')continue;
        const step=r*patSteps+i;
        evs.push({v,ch:c,art:v==='HH'?(c==='o'?'open':'closed'):v==='S'?(c==='r'?'rim':'head'):undefined,gr:c==='f'?1:c==='d'?2:0,graces:[],t:base+cinMs+step*stepMs+sw(step),acc:c==='X',ghost:c==='g',st:ex.st?ex.st[i%ex.st.length]:'',listen,hide:lesson.call&&!listen,step,bar:Math.floor(step/spb)});
      }}
  }
  evs.sort((a,b)=>a.t-b.t);
  // clicks + grid lines (relative ms from base)
  const beats=beatStepsOf(ex), mode=ex.click||'all';
  const play=mode==='24'?beats.filter((_,i)=>i===1||i===3):mode==='1'?[0]:beats;
  const subOn=opts.subclick!=null?opts.subclick:state.set.subclick;
  const clicks=[], grid=[];
  for(let b=0;b<cinBars;b++)beats.forEach((st,i)=>{const t=b*barMs+st*stepMs;clicks.push({t,k:i===0?'acc':'beat',cin:true,n:i+1});grid.push({t,bar:false});});
  const totalBars=reps*ex.bars;
  for(let b=0;b<totalBars;b++)for(let st=0;st<spb;st++){
    const t=cinMs+b*barMs+st*stepMs+sw(st);
    if(play.includes(st))clicks.push({t,k:st===0?'acc':'beat'});
    else if(subOn&&!beats.includes(st))clicks.push({t,k:'sub'});
    else if(subOn&&mode!=='all'&&beats.includes(st))clicks.push({t,k:'sub'});
    if(beats.includes(st))grid.push({t,bar:st===0});
  }
  grid.push({t:cinMs+totalBars*barMs,bar:true});
  const totalMs=cinMs+totalBars*barMs;
  return{lesson,ex,bpm:bpmv,base,beatMs,stepMs,barMs,sub,spb,cinBars,cinMs,reps,evs,clicks,grid,totalMs,end:base+totalMs,extras:[],nodes:[],calib:!!opts.calib};
}

function openPractice(id){
  L=LBY[id]; const p=P(id); exI=Math.min(p.ex||0,L.ex.length-1); bpm=p.bpm||L.bpm[0];
  $('#prac').classList.remove('hidden'); $('#result').classList.add('hidden');
  $('#ptitle').innerHTML=`<span class="idx">${L.id}</span>${esc(L.t)}`;
  renderPracBar(); renderPads(L.ex[exI]); sizeCv(); makePreview(); draw();
}
function renderPracBar(){
  const sb=$('#subbtn');if(sb)sb.textContent='Sub-click: '+(state.set.subclick?'On':'Off');
  const sw=$('#simwrap');if(sw)sw.innerHTML=TEST&&!L.calib?`<select id="simj" class="sm"><option value="0">jitter 0</option><option value="15">jitter 15</option><option value="40">jitter 40</option></select><select id="simm"><option value="ok">all correct</option><option value="dyn">wrong dynamics</option><option value="art">wrong sound</option><option value="nograce">no graces</option></select><button class="sm" data-act="simulate">Simulate</button>`:'';
  $('#exsel').innerHTML=L.ex.length>1?L.ex.map((e,i)=>`<button class="${i===exI?'on':''}" data-act="ex" data-i="${i}">${esc(e.n)}</button>`).join(''):`<span class="mut">${esc(L.ex[0].n)}</span>`;
  $('#bpmv').textContent=bpm;
  if(L.calib){$('#pdots').innerHTML='<span>Latency test</span>';return;}
  const p=P(L.id);
  $('#pdots').innerHTML=`<span>${p.status==='mastered'?'Mastered':'Passes'}</span>`+[0,1,2].map(i=>`<i class="${i<p.streak||p.status==='mastered'?'f':''}"></i>`).join('')+`<span>@ ${p.bpm} · goal ${L.bpm[1]}</span>`;
}
function renderPads(ex){
  const vs=LANES.filter(v=>ex.v[v]);
  $('#pads').classList.toggle('hidden',!state.set.pads);
  $('#pads').innerHTML=vs.map(v=>`<button data-pad="${v}" style="border-color:${VOICES[v].c};color:${VOICES[v].c}">${VOICES[v].n}</button>`).join('');
}
function sizeCv(){const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;cv.width=Math.max(1,r.width*d);cv.height=Math.max(1,r.height*d);cx.setTransform(d,0,0,d,0,0);}
function makePreview(){preview=buildRun(L,L.ex[exI],bpm,0,{calib:L.calib});}

async function startRun(){
  const a=audio(); if(a.state!=='running'){try{await a.resume();}catch(e){}}
  const t0=a.currentTime+0.3; const pNow=performance.now(), cNow=a.currentTime;
  const outLat=((a.outputLatency||0)+(a.baseLatency||0))*1000;
  const base=pNow+(t0-cNow)*1000+outLat;
  run=buildRun(L,L.ex[exI],bpm,base,{calib:L.calib});
  run.t0=t0; run.startPerf=performance.now();
  run.clicks.forEach(c=>click(t0+c.t/1000,c.k,run.nodes));
  run.evs.forEach(e=>{if(e.listen)drum(e.v,t0+(e.t-base)/1000,run.nodes);});
  flashes={}; $('#pfeed').textContent=''; $('#go').textContent='Stop'; $('#result').classList.add('hidden');
  requestAnimationFrame(loop);
  try{if(navigator.wakeLock&&!wake)navigator.wakeLock.request('screen').then(w=>{wake=w;w.addEventListener('release',()=>{if(wake===w)wake=null;});}).catch(()=>{});}catch(e){}
}
function stopRun(save_=true){
  if(!run)return; run.nodes.forEach(n=>{try{n.stop(0);}catch(e){}});
  if(save_&&!run.calib){addTime(L.id,performance.now()-run.startPerf);save();}
  run=null; $('#go').textContent='Start'; draw();
}
function loop(){
  if(!run)return; draw(); const now=performance.now();
  if(now>run.end+350){finish();return;}
  requestAnimationFrame(loop);
}
function hit(v,vel,tp,art){
  flashes[v]=performance.now();
  if(!run||$('#prac').classList.contains('hidden'))return;
  const lat=run.calib?0:state.lat;
  const t=tp-lat;
  const start=run.base+run.cinMs;
  if(t<start-state.set.win)return; // ignore count-in
  if(run.lesson.call){const repMs=run.barMs*run.ex.bars;const r=Math.floor((t-start)/repMs);if(r%2===0&&t<start+(r+1)*repMs-state.set.win)return;} // listening bars
  // grace notes: a later hit within 90 ms on a flam/drag note becomes the main stroke; the earlier one turns into a grace
  for(const e of run.evs){if(e.listen||e.v!==v||!e.gr||e.hitT==null)continue;const gap=t-e.hitT;
    if(gap>=0&&gap<=90&&e.graces.length<e.gr&&Math.abs(t-e.t)<=state.set.win){e.graces.push({t:e.hitT,vel:e.vel});e.hitT=t;e.dt=t-e.t;e.vel=vel;e.hitArt=art;
      const g=e.graces[e.graces.length-1];feed(e.dt,state.set.graceMode==='lenient'?'':(t-g.t<12?'flat flam':g.vel>vel*0.8?'grace too loud':'grace ✓'));return;}}
  let best=null,bd=1e9;
  for(const e of run.evs){if(e.listen||e.v!==v||e.hitT!=null)continue;const d=Math.abs(t-e.t);if(d<bd&&d<=state.set.win){bd=d;best=e;}}
  if(best){best.hitT=t;best.dt=t-best.t;best.vel=vel;best.hitArt=art;
    let extra='';
    if(best.art&&art&&state.set.scoreArt!==false&&best.art!==art){best.artOk=false;feed(best.dt,art+', should be '+best.art);return;}
    if(best.art&&art)best.artOk=true;
    if(isDyn(run.ex)&&run.ex.dyn!=='even')extra=dynVerdict(best,laneBase(run.evs,v));
    feed(best.dt,extra);}
  else{run.extras.push({v,t});feedTxt('Extra '+VOICES[v].n,TH.bad);}
}
function isDyn(ex){if(!ex||ex.dyn===false)return false;if(ex.dyn)return true;return Object.values(ex.v).some(s=>/[Xg]/.test(s))||(hasGraces(ex)&&state.set.graceMode!=='lenient');}
const hasGraces=ex=>Object.values(ex.v).some(s=>/[fd]/.test(s));
const hasArt=ex=>Object.values(ex.v).some(s=>/[or]/.test(s));
function median(a){if(!a.length)return null;const b=[...a].sort((x,y)=>x-y),m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2;}
const XLIKE=c=>c==='x'||c==='o'||c==='r';
function baseOf(h){
  const mx=median(h.filter(e=>XLIKE(e.ch)).map(e=>e.vel)); if(mx!=null)return {b:mx,x:true};
  const mX=median(h.filter(e=>e.ch==='X').map(e=>e.vel)), mg=median(h.filter(e=>e.ch==='g').map(e=>e.vel));
  return mX!=null&&mg!=null?{b:(mX+mg)/2}:null;
}
function laneBase(evs,v){
  const all=evs.filter(e=>!e.listen&&e.hitT!=null&&e.vel!=null);
  const own=baseOf(all.filter(e=>e.v===v)); if(own)return own.b;
  // lane has only accents or only ghosts: fall back to the whole run (accents vs ghosts across pads)
  const h=all.filter(e=>e.v!==v), mX=median(all.filter(e=>e.ch==='X').map(e=>e.vel)), mg=median(all.filter(e=>e.ch==='g').map(e=>e.vel));
  if(mX!=null&&mg!=null)return (mX+mg)/2;
  const ox=baseOf(h); return ox?ox.b:null;
}
const isLoud=(vel,b)=>vel>=Math.max(b*1.2,b+10), isSoft=(vel,b)=>vel<=b*0.6;
function dynVerdict(e,b){ // returns '' if correct, else a message
  if(b==null||e.ch==='f'||e.ch==='d')return '';
  if(e.ch==='X')return isLoud(e.vel,b)?'':'accent not loud enough';
  if(e.ch==='g')return isSoft(e.vel,b)?'':'ghost too loud';
  return isLoud(e.vel,b)?'too loud':isSoft(e.vel,b)?'too soft':'';
}
function feed(dt,extra){
  const a=Math.abs(dt),tol=state.set.tol;
  const x=extra?' · '+extra:'';
  if(a<=tol)feedTxt('On time '+(dt>=0?'+':'')+Math.round(dt)+' ms'+x,extra?TH.warn:TH.good);
  else feedTxt((dt<0?'Early ':'Late ')+Math.round(a)+' ms'+x,dt<0?TH.blue:TH.warn);
}
function feedTxt(t,c){const f=$('#pfeed');f.textContent=t;f.style.color=c;lastFeed=performance.now();}

function draw(){
  const W=cv.clientWidth,H=cv.clientHeight; if(!W||!H)return;
  cx.clearRect(0,0,W,H);
  const R=run||preview; if(!R)return;
  const now=run?performance.now():(R.base+R.cinMs-R.beatMs*0.6);
  const vs=LANES.filter(v=>R.ex.v[v]); const n=vs.length; const top=34, lh=(H-top-6)/n;
  const hitX=Math.max(110,W*0.17); const ppm=(W-hitX)*0.62/Math.max(R.barMs,R.beatMs*3);
  // lanes
  vs.forEach((v,i)=>{const y=top+i*lh;cx.fillStyle=i%2?TH.lane1:TH.lane2;cx.fillRect(0,y,W,lh);
    const fl=flashes[v]&&performance.now()-flashes[v]<140;
    cx.fillStyle=fl?VOICES[v].c:TH.muted;cx.font='700 14px '+TH.body;cx.textBaseline='middle';cx.fillText(VOICES[v].n,10,y+lh/2);
    if(fl){cx.fillStyle=VOICES[v].c+'55';cx.fillRect(hitX-30,y,60,lh);}
  });
  // beat lines
  for(const g of R.grid){const x=hitX+(R.base+g.t-now)*ppm;if(x<hitX-200||x>W)continue;
    const isBar=g.bar;cx.strokeStyle=isBar?TH.gridBar:TH.grid;cx.lineWidth=isBar?2:1;cx.beginPath();cx.moveTo(x,top);cx.lineTo(x,H);cx.stroke();}
  // hit line
  cx.strokeStyle=TH.hitline;cx.lineWidth=3;cx.beginPath();cx.moveTo(hitX,top-4);cx.lineTo(hitX,H);cx.stroke();
  // notes
  const rad=Math.min(lh*0.32,18);
  for(const e of R.evs){
    const x=hitX+(e.t-now)*ppm; if(x<hitX-120||x>W+30)continue;
    const i=vs.indexOf(e.v); const y=top+i*lh+lh/2;
    if(e.hide&&run&&e.hitT==null){ if(x>hitX){cx.strokeStyle=TH.grid;cx.setLineDash([4,4]);cx.beginPath();cx.arc(x,y,rad*0.7,0,7);cx.stroke();cx.setLineDash([]);} continue; }
    let col=VOICES[e.v].c, alpha=e.listen?0.35:1;
    if(e.hitT!=null){const a=Math.abs(e.dt);col=a<=state.set.tol&&e.artOk!==false?TH.good:e.artOk===false?TH.bad:(e.dt<0?TH.blue:TH.warn);}
    else if(run&&!e.listen&&x<hitX-state.set.win*ppm)col=TH.missed;
    cx.globalAlpha=alpha;cx.fillStyle=col;cx.strokeStyle=col;
    if(e.ch==='o'){cx.lineWidth=4;cx.beginPath();cx.arc(x,y,rad*0.85,0,7);cx.stroke();}
    else if(e.ch==='r'){const q=rad*0.75;cx.fillRect(x-q,y-q,q*2,q*2);}
    else{cx.beginPath();cx.arc(x,y,e.acc?rad*1.15:e.ghost?rad*0.6:rad,0,7);cx.fill();}
    if(e.gr){for(let k=1;k<=e.gr;k++){cx.beginPath();cx.arc(x-k*30*ppm-rad*0.6,y,rad*0.35,0,7);cx.fill();}}
    if(e.st&&e.st!=='.'){cx.fillStyle=TH.bg;cx.font='700 13px '+TH.body;cx.textAlign='center';cx.fillText(e.st,x,y+1);cx.textAlign='left';}
    cx.globalAlpha=1;
  }
  // header info
  cx.fillStyle=TH.muted;cx.font='600 13px '+TH.body;cx.textBaseline='middle';
  if(run){
    const rel=now-R.base;
    if(rel>=0&&rel<R.cinMs){const c=R.clicks.filter(c=>c.cin&&c.t<=rel).pop();if(c){cx.fillStyle=TH.ink;cx.font='800 90px '+TH.display;cx.textAlign='center';cx.fillText(String(c.n),W/2,H/2);cx.textAlign='left';}}
    else if(rel>=R.cinMs){const bar=Math.floor((rel-R.cinMs)/R.barMs);const totalBars=R.reps*R.ex.bars;
      let lab='Bar '+Math.min(bar+1,totalBars)+' / '+totalBars;
      if(R.lesson.call){lab+=Math.floor(bar/R.ex.bars)%2===0?'   ·   LISTEN':'   ·   YOUR TURN';}
      cx.fillText(lab,hitX,16);}
  }else{cx.fillText(L&&L.calib?'Play the snare on every click':'Tap Start (or hit any pad and then Start). Count-in: '+(state.set.countin)+' bar.',hitX,16);}
  if(performance.now()-lastFeed>900)$('#pfeed').textContent='';
}

function finish(){
  const R=run; R.nodes.forEach(n=>{try{n.stop(0);}catch(e){}});
  const elapsed=performance.now()-R.startPerf; run=null; $('#go').textContent='Start';
  const sc=R.evs.filter(e=>!e.listen);
  if(R.calib){
    const ds=sc.filter(e=>e.hitT!=null).map(e=>e.dt).sort((a,b)=>a-b);
    if(ds.length<8){showResult(`<h2>Not enough hits</h2><p class="mut">Hit the snare on every click (got ${ds.length} of ${sc.length}).</p>`);return;}
    const med=ds[Math.floor(ds.length/2)]; state.lat=Math.round(med); state.done['0.7.01']=true; save();
    showResult(`<h2>Latency set: ${state.lat} ms</h2><p class="mut">Median offset of ${ds.length} hits. Scores now subtract this. Spread: ${Math.round(ds[0])} to ${Math.round(ds[ds.length-1])} ms.</p>`,true);return;
  }
  const tol=state.set.tol;
  const okT=e=>Math.abs(e.dt)<=tol&&e.artOk!==false;
  const hits=sc.filter(e=>e.hitT!=null), on=hits.filter(okT);
  const miss=sc.length-hits.length, ext=R.extras.length;
  const score=Math.round(100*on.length/Math.max(1,sc.length+ext));
  const avg=hits.length?hits.reduce((a,e)=>a+e.dt,0)/hits.length:0;
  const per={};sc.forEach(e=>{const p=per[e.v]||(per[e.v]={n:0,on:0,hit:0,sum:0});p.n++;if(e.hitT!=null){p.hit++;p.sum+=e.dt;if(okT(e))p.on++;if(e.artOk===false)p.snd=(p.snd||0)+1;}});
  R.extras.forEach(x=>{const p=per[x.v]||(per[x.v]={n:0,on:0,hit:0,sum:0});p.ext=(p.ext||0)+1;});
  // ---- dynamics (step A) ----
  const dynOn=isDyn(R.ex); let dynScore=null;
  if(dynOn){
    let ok=0,tot=0;
    if(R.ex.dyn==='even'){
      const seq=hits.filter(e=>e.st&&e.st!=='.').sort((a,b)=>a.t-b.t);
      for(let i=0;i+1<seq.length;){const a=seq[i],b=seq[i+1];
        if(a.st===b.st&&a.vel&&Math.abs(b.step-a.step)===1){tot++;const good=Math.abs(b.vel-a.vel)/a.vel<=0.2;if(good)ok++;
          [a,b].forEach(e=>{e.dynOk=good;const q=per[e.v];q.dn=(q.dn||0)+1;if(good)q.dok=(q.dok||0)+1;});i+=2;}else i++;}
    }else{
      const base={};LANES.forEach(v=>base[v]=laneBase(sc,v));
      // two parts, averaged: marked notes (accents/ghosts) right, and normal notes right — so skipping every accent can't pass
      let mOk=0,mTot=0,nOk=0,nTot=0;
      hits.forEach(e=>{if(e.ch==='f'||e.ch==='d')return;const b=base[e.v];if(b==null)return;if(!/[Xg]/.test(Object.values(R.ex.v).join(''))&&!R.ex.dyn)return;
        const good=!dynVerdict(e,b);e.dynOk=good;if(e.ch==='X'||e.ch==='g'){mTot++;if(good)mOk++;}else{nTot++;if(good)nOk++;}
        const q=per[e.v];q.dn=(q.dn||0)+1;if(good)q.dok=(q.dok||0)+1;});
      const parts=[mTot?mOk/mTot:null,nTot?nOk/nTot:null].filter(x=>x!=null);
      if(parts.length){const avgP=parts.reduce((a,b)=>a+b,0)/parts.length;const w=mTot+nTot;tot+=w;ok+=avgP*w;}
    }
    // grace notes (flams, drags) count inside Dynamics
    if(hasGraces(R.ex)&&state.set.graceMode!=='lenient'){
      hits.filter(e=>e.gr).forEach(e=>{const g=e.graces;const good=g.length>=e.gr&&g.every(x=>e.hitT-x.t>=12&&e.hitT-x.t<=90&&x.vel<=e.vel*0.8);
        e.grOk=good;tot++;if(good)ok++;const q=per[e.v];q.gn=(q.gn||0)+1;if(good)q.gok=(q.gok||0)+1;});
      const grHits=hits.filter(e=>e.gr), anyG=grHits.some(e=>e.graces.length);
      if(grHits.length>=4&&!anyG)R.graceWarn=true;
    }
    dynScore=tot?Math.round(100*ok/tot):null;
  }
  const p=P(L.id); p.attempts++; p.last=Date.now(); p.ex=exI; addTime(L.id,elapsed);
  if(p.status==='new')p.status='progress';
  let msg='';
  const passed=score>=state.set.pass&&(dynScore==null||dynScore>=state.set.dynPass);
  if(passed){p.bestBpm=Math.max(p.bestBpm,R.bpm);
    if(R.bpm>=p.bpm){p.streak++;
      if(p.streak>=3){p.streak=0;
        if(p.bpm>=L.bpm[1]){if(p.status!=='mastered'){p.status='mastered';p.masteredAt=Date.now();msg='🎉 Lesson mastered at '+p.bpm+' BPM!';}else msg='Still mastered. Nice.';}
        else{p.bpm=Math.min(L.bpm[1],p.bpm+L.step);msg='Tempo up! Next target: '+p.bpm+' BPM';bpm=p.bpm;}
      }else msg='Pass '+p.streak+' of 3 at '+p.bpm+' BPM';
    }else msg='Passed, but below your current target ('+p.bpm+' BPM), so it doesn’t count toward the streak.';
  }else{if(R.bpm>=p.bpm)p.streak=0;msg=(score<state.set.pass?'Need '+state.set.pass+'% timing':'Need '+state.set.dynPass+'% dynamics')+' to pass. Streak reset.';}
  p.best=Math.max(p.best,score);
  const padRec={};LANES.forEach(v=>{const q=per[v];if(!q)return;padRec[v]=[q.n,q.on,q.n-q.hit,q.ext||0,q.hit?Math.round(q.sum/q.hit):null,q.dn?Math.round(100*(q.dok||0)/q.dn):null];});
  const hitRec=sc.filter(e=>e.hitT!=null).slice(0,256).map(e=>[LANES.indexOf(e.v),Math.round(e.dt),e.vel||0]);
  lastRunTs=Date.now();
  state.sessions.push(Object.assign({ts:lastRunTs,id:L.id,ex:exI,bpm:R.bpm,score,on:on.length,n:sc.length,ext,miss,avg:Math.round(avg),pads:padRec,hits:hitRec,dur:Math.round(elapsed/1000)},dynScore!=null?{dyn:dynScore}:{}));
  if(state.sessions.length>3000)state.sessions=state.sessions.slice(-3000);
  if(state.sessions.length>600)state.sessions.slice(0,-600).forEach(x=>{delete x.hits;}); // keep per-hit detail for the latest 600 runs only
  save(); renderPracBar();
  const tend=Math.abs(avg)<8?'Centred on the beat':avg<0?'Rushing: '+Math.round(-avg)+' ms ahead on average':'Dragging: '+Math.round(avg)+' ms behind on average';
  const grCol=hasGraces(R.ex)&&state.set.graceMode!=='lenient', sndCol=hasArt(R.ex)&&state.set.scoreArt!==false;
  const rows=LANES.filter(v=>per[v]).map(v=>{const q=per[v];const a=q.hit?Math.round(q.sum/q.hit):0;
    return `<tr><td><b style="color:${VOICES[v].c}">${VOICES[v].n}</b></td><td>${q.n?Math.round(100*q.on/q.n)+'%':'–'}</td><td>${q.on}/${q.n}</td><td>${q.n-q.hit}</td><td>${q.ext||0}</td><td>${q.hit?(a>0?'+':'')+a+' ms':'–'}</td>${dynOn?`<td>${q.dn?Math.round(100*(q.dok||0)/q.dn)+'%':'–'}</td>`:''}${grCol?`<td>${q.gn?Math.round(100*(q.gok||0)/q.gn)+'%':'–'}</td>`:''}${sndCol?`<td>${q.snd?q.snd+' wrong':'✓'}</td>`:''}</tr>`;}).join('');
  const dynBlock=dynScore!=null?`<div style="margin-left:18px"><div class="score" style="font-size:44px;color:${dynScore>=state.set.dynPass?'var(--good)':'var(--warn)'}">${dynScore}%</div><div class="mut">Dynamics (need ${state.set.dynPass}%)</div></div>`:'';
  showResult(`<div class="row"><div><div class="score" style="color:${score>=state.set.pass?'var(--good)':'var(--warn)'}">${score}%</div>${dynScore!=null?`<div class="mut">Timing (need ${state.set.pass}%)</div>`:''}</div>${dynBlock}<div style="margin-left:18px"><div style="font-weight:700;font-size:20px">${passed?'Pass':'Not yet'}</div><div class="mut">${esc(msg)}</div></div></div>
   <p>${on.length} of ${sc.length} notes on time (±${tol} ms) · ${miss} missed · ${ext} extra · ${tend}</p>
   <table><tr><th>Pad</th><th>On time</th><th>Hits</th><th>Missed</th><th>Extra</th><th>Avg timing</th>${dynOn?'<th>Dynamics</th>':''}${grCol?'<th>Graces</th>':''}${sndCol?'<th>Sound</th>':''}</tr>${rows}</table>
   ${R.graceWarn?'<p style="color:var(--warn)">No grace notes arrived from the kit in this run. If you did play them, the module may be merging the two hits: set <b>Grace notes</b> to <b>Lenient</b> in Kit &amp; Settings, or lower the snare’s retrigger/mask time on the module.</p>':''}
   ${sndCol&&!R.evs.some(e=>e.hitArt)?'<p class="mut">Open/closed and rim/head weren’t reported for these hits (on-screen pads), so they weren’t checked.</p>':''}
   ${dynOn&&R.ex.dyn==='even'?'<p class="mut">Dynamics here = how even each double is (2nd stroke within 20% of the 1st).</p>':dynOn?'<p class="mut">Dynamics are judged against your own normal-note volume in this run: accents clearly louder, ghosts clearly softer.</p>':''}`);
}
function showResult(html,calib){
  const r=$('#result');r.classList.remove('hidden');
  r.innerHTML=`<div class="in"><div class="row" style="margin-bottom:18px"><button class="pri" data-act="again" style="font-size:20px;padding:14px 30px">${calib?'Run again':'Again'}</button>${calib?'':'<button data-act="bpm-">−5 BPM</button><button data-act="bpm+">+5 BPM</button>'+(lastRunTs?`<button data-run="${lastRunTs}">Run detail</button>`:'')}<span class="sp"></span><button data-act="pexit">Done</button></div>${html}</div>`;
  makePreview();draw();
}

