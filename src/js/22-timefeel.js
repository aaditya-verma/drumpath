/* DrumPath — P3 Time feel, beginner-sized (D-041, build/ideas-backlog.md §C items 12, 13, 16 + the P3 row).
   · Gap click ladder: the click drops out for 1, 2, then 4 bars at slow tempos; 2 clean runs in a row move you up a
     step, 2 rough ones move you back one (coach rule D2). Then the sparse-click variants: 2 & 4 only, beat 4 only, the
     “&” (displaced), a quarter click at 40 BPM. Score = where you are when the click comes back (drift, ms). One ladder
     for the kit and one for the screen pads (touch timing differs).
   · Tempo-drift test: 16 bars with no click after the count-in (Pulse = quarter notes, or a Groove); the app follows
     your tempo bar by bar and draws it (do you speed up?). Steadiness = 100 − 5 × the largest bar-to-start change in %.
   · Pocket: where you play (mean offset: ahead / on / behind) apart from how steady you are (spread), in plain words
     (“steady · slightly ahead”); a pocket score that rewards a steady lay-back as much as dead-on. On every lesson,
     tap-drill and time-drill result, per pad and per note position; Time feel page = last 30 days, per pad.
   · Today: a gap click in On the go (screen pads) and after the warm-up at the kit; a drift test in 20/40-min kit
     sessions when none was played in the last 7 days.
   Runs are kind:'time' (id time:gap / time:drift): minutes + streak only, never state.prog, lesson status or readiness.
   Limb-interference map and dynamics trainer come later (Level 3+). New state field state.time only; testing mode saves nothing. */
'use strict';
const TF_GAP=[
  {g:1,bpm:60},{g:1,bpm:72},{g:2,bpm:60},{g:2,bpm:72},{g:4,bpm:60},{g:4,bpm:80},
  {v:'24',bpm:70,n:'Click on 2 and 4 only'},{v:'4',bpm:70,n:'Click on beat 4 only'},{v:'and',bpm:60,n:'Click on the “&” (offbeats)'},{v:'slow',bpm:40,n:'Quarter click at 40 BPM, play 8ths'}];
const TF_RET=40;          // ms: a gap counts as clean when you're within ±40 ms as the click comes back
const TF_PLAYED=0.9;      // …and you kept playing: ≥ 90 % of the gap's notes
const TF_VAR_PASS=80;     // sparse-click variants: ≥ 80 % on time
const TF_UP=2, TF_DOWN=2; // clean runs in a row to move up / rough runs in a row to move back one step
const TF_DRIFT_BARS=16, TF_DRIFT_BPM=70, TF_DRIFT_DUE=7;   // drift test: bars, default tempo, days before Today offers it again
const TF_POCKET_MIN=8;    // hits needed before a pocket line is shown
const TF_REFS={gap:['A1.05.1','A1.09.1'],drift:['A1.09.1','A1.03.1'],pocket:['A1.09.4','A1.09.1']};
const TF={last:null,drift:'pulse'};
const tfS=()=>tfFill(state).time;
const tfSrcNow=()=>p1Kit()?'kit':'touch';
const tfLad=src=>tfS().gap[src==='touch'?'touch':'kit'];
const tfRefs=k=>(TF_REFS[k]||[]).filter(id=>typeof THC!=='undefined'&&THC[id]);
const tfSign=x=>(x>0?'+':x<0?'−':'')+Math.abs(Math.round(x));

/* ---------- state: {gap:{kit:{s,ok,bad,top,at}, touch:{…}}} — synced; merge per ladder: the later change wins, top = max ---------- */
function tfFill(s){let t=s.time;if(!t||typeof t!=='object'||Array.isArray(t))t=s.time={};if(!t.gap||typeof t.gap!=='object'||Array.isArray(t.gap))t.gap={};
  ['kit','touch'].forEach(k=>{const x=t.gap[k];if(!x||typeof x!=='object')t.gap[k]={s:0,ok:0,bad:0,top:0,at:0};else{['s','ok','bad','top','at'].forEach(f=>{if(typeof x[f]!=='number'||!isFinite(x[f]))x[f]=0;});x.s=Math.max(0,Math.min(TF_GAP.length-1,x.s|0));x.top=Math.max(x.top|0,x.s);}});
  return s;}
function tfMerge(A,B){const a=tfFill({time:JSON.parse(JSON.stringify(A||{}))}).time,b=tfFill({time:JSON.parse(JSON.stringify(B||{}))}).time,m={gap:{}};
  ['kit','touch'].forEach(k=>{const x=a.gap[k],y=b.gap[k],w=(y.at||0)>(x.at||0)?y:x;m.gap[k]=Object.assign({},w,{top:Math.max(x.top||0,y.top||0)});});return m;}

/* ---------- drills as lesson-like objects (the normal engine; L.time set) ---------- */
function tfStepName(i){const st=TF_GAP[i];if(!st)return '';return st.v?st.n:(st.g===1?'1-bar gap':st.g+'-bar gaps')+' at '+st.bpm+' BPM';}
function tfGapEx(i){
  const st=TF_GAP[i],Q='x.x.x.x.';
  if(st.v){const bars=8,v=st.v==='slow'?{HH:'xxxxxxxx'.repeat(bars)}:{S:Q.repeat(bars)};
    return X(st.n,2,v,{bars,dyn:false,click:st.v==='slow'?'all':st.v});}
  const cyc={1:4,2:3,4:2}[st.g]||2,bars=cyc*(2+st.g)+1,gap=[],labels=[];
  for(let c=0;c<cyc;c++){labels.push('click','click');for(let j=0;j<st.g;j++){gap.push(c*(2+st.g)+2+j);labels.push('gap · keep going');}}labels.push('click is back');
  return X(tfStepName(i),2,{S:Q.repeat(bars)},{bars,dyn:false,gap,labels});
}
function tfDriftEx(pat){const n=TF_DRIFT_BARS,gap=[...Array(n).keys()];
  const v=pat==='groove'?{HH:'xxxxxxxx'.repeat(n),K:'x...x...'.repeat(n),S:'..x...x.'.repeat(n)}:{S:'x.x.x.x.'.repeat(n)};
  return X(pat==='groove'?'Groove, no click':'Quarter notes, no click',2,v,{bars:n,dyn:false,gap});}
function tfOpen(kind,o={}){
  if(run)return;closeSheets();const src=o.src||tfSrcNow();let ex,b,t,idx,step=null;
  if(kind==='drift'){const pat=o.pat||TF.drift;TF.drift=pat;ex=tfDriftEx(pat);b=o.bpm||TF_DRIFT_BPM;t='Tempo-drift test · '+(pat==='groove'?'groove':'quarter notes');idx='Time feel';}
  else{step=o.step!=null?o.step:tfLad(src).s;ex=tfGapEx(step);b=TF_GAP[step].bpm;t='Gap click · '+tfStepName(step);idx='Time feel · step '+(step+1)+' of '+TF_GAP.length;}
  L={id:'time:'+kind,t,time:kind,tstep:step,tsrc:src,padsOn:src==='touch',type:'play',lv:0,sd:7,bpm:[b,b],step:5,loop:1,ex:[ex]};stretchMode=false;exI=0;bpm=b;
  $('#prac').classList.remove('hidden');$('#result').classList.add('hidden');$('#ptitle').innerHTML=`<span class="idx">${esc(idx)}</span>${esc(kind==='drift'?'Tempo-drift test':'Gap click')}`;
  renderPracBar();renderPads(L.ex[0]);sizeCv();makePreview();draw();
}
function tfBarLine(){if(!L||!L.time)return '';
  if(L.time==='drift')return 'Drift test · no click after the count-in · keep your own tempo for '+TF_DRIFT_BARS+' bars · minutes and streak only';
  const st=TF_GAP[L.tstep],ld=tfLad(L.tsrc);return (st.v?'Sparse click · '+TF_VAR_PASS+'% on time = clean':'The click drops out: keep going · clean = back within ±'+TF_RET+' ms')+' · '+(L.tsrc==='touch'?'screen pads':'kit')+(ld.ok?' · '+ld.ok+' of '+TF_UP+' clean':'');}

/* ---------- gap analysis: drift when the click comes back ---------- */
function tfGapStats(R){
  const ex=R.ex,gs=new Set(ex.gap||[]),sc=R.evs.filter(e=>!e.listen&&!e.anchor),blocks=[];
  let curB=null;for(let b=0;b<ex.bars;b++){if(gs.has(b)){if(!curB)blocks.push(curB=[]);curB.push(b);}else curB=null;}
  const inGap=sc.filter(e=>gs.has(e.bar)),played=inGap.length?inGap.filter(e=>e.hitT!=null).length/inGap.length:1;
  const dr=blocks.map(bl=>{const last=bl[bl.length-1],h=sc.filter(e=>e.bar===last&&e.hitT!=null);return h.length?Math.round(h.reduce((a,e)=>a+e.dt,0)/h.length):null;});
  return {blocks:blocks.length,dr,played,n:inGap.length};
}
function tfGapPass(R,score){const st=TF_GAP[R.lesson.tstep];if(st.v)return score>=TF_VAR_PASS;const g=tfGapStats(R);return g.played>=TF_PLAYED&&g.dr.length>0&&g.dr.every(d=>d!=null&&Math.abs(d)<=TF_RET);}
// 2 clean in a row → next step; 2 rough in a row → back one step (never below the first)
function tfLadderAfter(src,step,pass){const ld=tfLad(src),now=Date.now();let msg='';
  if(step!==ld.s){ld.at=now;return pass?'Clean ✓ (a step you chose; your ladder stays at step '+(ld.s+1)+')':'Not clean yet (a step you chose)';}
  if(pass){ld.bad=0;ld.ok++;if(ld.ok>=TF_UP){ld.ok=0;if(ld.s<TF_GAP.length-1){ld.s++;ld.top=Math.max(ld.top,ld.s);msg='Step up! Next: '+tfStepName(ld.s);}else msg='Top of the ladder ✓ Keep it as a warm-up.';}else msg='Clean '+ld.ok+' of '+TF_UP+' at this step';}
  else{ld.ok=0;ld.bad++;if(ld.bad>=TF_DOWN&&ld.s>0){ld.bad=0;ld.s--;msg='Back one step to rebuild (coach rule D2): '+tfStepName(ld.s);}else msg='Not clean yet · try again';}
  ld.at=now;return msg;}

/* ---------- drift analysis: follow the player's tempo note by note, then one tempo per bar ---------- */
function tfOnsets(R){const ts=[];R.evs.forEach(e=>{if(!e.listen&&e.hitT!=null)ts.push(e.hitT);});R.extras.forEach(x=>ts.push(x.t));ts.sort((a,b)=>a-b);
  const out=[];ts.forEach(t=>{if(!out.length||t-out[out.length-1]>40)out.push(t);});return out;}   // pads within 40 ms = one note
function tfDriftCurve(R){
  const ex=R.ex,spb=R.spb,sub=R.sub,len=spb*ex.bars,pos=[];
  for(let i=0;i<len;i++)if(Object.values(ex.v).some(s=>s[i]&&s[i]!=='.'))pos.push(i);
  const on=tfOnsets(R).filter(t=>t>=R.base+R.cinMs-R.stepMs*2);if(on.length<4||!pos.length)return null;
  let P=R.stepMs,pk=0,tl=on[0];const m=[[pos[0],on[0]]];
  for(let j=1;j<on.length;j++){const want=pos[pk]+(on[j]-tl)/P;let best=-1,bd=1e9;
    for(let k=pk+1;k<pos.length&&pos[k]<=want+4;k++){const d=Math.abs(pos[k]-want);if(d<bd){bd=d;best=k;}}
    const gapSteps=best>0?pos[best]-pos[pk]:0;if(best<0||bd>Math.max(0.45,gapSteps*0.35))continue;   // stray extra hit
    m.push([pos[best],on[j]]);pk=best;tl=on[j];
    const w=m.slice(-6);if(w.length>=3){const s=tfSlope(w);if(s>R.stepMs*0.5&&s<R.stepMs*1.6)P=s;}}
  const bars=[];for(let b=0;b<ex.bars;b++){const w=m.filter(x=>x[0]>=b*spb-0.5&&x[0]<(b+1)*spb+0.5);
    const s=w.length>=3?tfSlope(w):null;bars.push(s?Math.round(600000/(s*sub))/10:null);}
  const got=bars.filter(x=>x!=null);if(got.length<Math.min(4,ex.bars))return null;
  const fill=bars.map((x,i)=>x!=null?x:(bars.slice(0,i).reverse().find(y=>y!=null)||got[0]));
  const st=(fill[0]+fill[1])/2,en=(fill[fill.length-1]+fill[fill.length-2])/2,dev=Math.max(...fill.map(x=>Math.abs(x-st)/st*100));
  const steady=Math.max(0,Math.min(100,Math.round(100-5*dev))),ch=Math.round((en-st)*10)/10;
  return {bars:fill,start:Math.round(st*10)/10,end:Math.round(en*10)/10,ch,dev:Math.round(dev*10)/10,steady,matched:m.length,notes:on.length,set:R.bpm};
}
function tfSlope(pts){const n=pts.length,mx=pts.reduce((a,p)=>a+p[0],0)/n,my=pts.reduce((a,p)=>a+p[1],0)/n;let nu=0,de=0;pts.forEach(p=>{nu+=(p[0]-mx)*(p[1]-my);de+=(p[0]-mx)*(p[0]-mx);});return de?nu/de:null;}
function tfDriftWords(c){const pc=Math.abs(c.ch)/c.start*100;
  const way=pc<2?'kept the same tempo':c.ch>0?'sped up '+Math.abs(c.ch)+' BPM':'slowed down '+Math.abs(c.ch)+' BPM';
  const lab=c.dev<=3?'Very steady':c.dev<=5?'Steady':c.dev<=10?'Drifts a little':'Drifts';
  return {lab,line:`You started at ${Math.round(c.start)} BPM (set ${c.set}) and ${way} by the end${pc>=2?' ('+Math.round(c.start)+' → '+Math.round(c.end)+')':''}. Largest change in one bar: ${c.dev}%.`};}
function tfDriftSvg(bars,set,o={}){
  const W=o.w||560,H=o.h||150,pl=34,pr=8,pt=10,pb=20,lo=Math.min(set*0.9,...bars)-1,hi=Math.max(set*1.1,...bars)+1;
  const x=i=>pl+(bars.length>1?i*(W-pl-pr)/(bars.length-1):0),y=v=>pt+(hi-v)*(H-pt-pb)/(hi-lo);
  const band=`<rect x="${pl}" y="${y(set*1.05).toFixed(1)}" width="${W-pl-pr}" height="${(y(set*0.95)-y(set*1.05)).toFixed(1)}" fill="var(--accent)" opacity="0.10"/>`;
  const ref=`<line x1="${pl}" x2="${W-pr}" y1="${y(set).toFixed(1)}" y2="${y(set).toFixed(1)}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
  const path=bars.map((v,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)).join(' ');
  const ticks=[Math.round(lo+1),set,Math.round(hi-1)].map(v=>`<text x="${pl-5}" y="${(y(v)+4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`).join('');
  const bx=[0,Math.floor((bars.length-1)/2),bars.length-1].map(i=>`<text x="${x(i).toFixed(1)}" y="${H-5}" text-anchor="middle" font-size="11" fill="var(--muted)">bar ${i+1}</text>`).join('');
  return `<svg class="tfsvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Tempo bar by bar">${band}${ref}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${bars.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3" fill="var(--accent)"/>`).join('')}${ticks}${bx}</svg>`;}

/* ---------- pocket: where (mean offset) and how steady (spread), in plain words ---------- */
function tfPocket(dts){const a=(dts||[]).filter(x=>x!=null&&isFinite(x));if(a.length<TF_POCKET_MIN)return null;
  const n=a.length,m=a.reduce((s,x)=>s+x,0)/n,sd=Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/n);
  const score=Math.max(0,Math.min(100,Math.round(100-3*Math.max(0,sd-8)-1.5*Math.max(0,Math.abs(m)-30))));
  const am=Math.abs(m),where=am<8?'on the beat':(am<20?'slightly ':'')+(m<0?'ahead':'behind');
  const cons=sd<10?'very steady':sd<18?'steady':sd<28?'a bit uneven':'uneven';
  return {n,m:Math.round(m),sd:Math.round(sd),score,where,cons,line:cons+' · '+where};}
const TF_POSN={1:['beat'],2:['beat','&'],3:['beat','trip 2','trip 3'],4:['beat','e','&','a'],6:['beat','sx 2','sx 3','sx 4','sx 5','sx 6']};
function tfPosName(sub,k){const a=TF_POSN[sub];return a&&a[k]?a[k]:'step '+(k+1);}
function tfRunPocket(R){const sc=R.evs.filter(e=>!e.listen&&!e.anchor&&e.hitT!=null);const all=tfPocket(sc.map(e=>e.dt));if(!all)return null;
  const pads={},pos={};sc.forEach(e=>{(pads[e.v]=pads[e.v]||[]).push(e.dt);const k=((e.step%R.spb)%R.sub);(pos[k]=pos[k]||[]).push(e.dt);});
  const P={};Object.entries(pads).forEach(([v,a])=>{const p=tfPocket(a);if(p)P[v]=p;});
  const Q={};Object.entries(pos).forEach(([k,a])=>{const p=tfPocket(a);if(p)Q[k]=p;});
  return {all,pads:P,pos:Q,sub:R.sub,swing:!!(R.ex.swing&&R.ex.swing!==0.5)};}
function tfPocketHtml(R){const pk=tfRunPocket(R);TF.last=pk;if(!pk)return '';const a=pk.all;
  return `<div class="tfpk"><span class="note-k">Pocket</span><b>${a.score}</b><span>${esc(a.line)} (${tfSign(a.m)} ms, spread ±${a.sd} ms)</span><button class="sm ghost" data-tf="pocket">Per pad · per note</button></div>`;}
function tfPocketTable(rows){return `<table class="tftab"><tr><th></th><th>Where</th><th>Steady</th><th>Pocket</th></tr>${rows.map(([n,p,c])=>`<tr><td><b${c?` style="color:${c}"`:''}>${esc(n)}</b></td><td>${esc(p.where)} <span class="mut">${tfSign(p.m)}</span></td><td>${esc(p.cons)} <span class="mut">±${p.sd}</span></td><td>${p.score}</td></tr>`).join('')}</table>`;}
function tfPocketSheet(pk){pk=pk||TF.last;if(!pk)return null;
  const pads=LANES.filter(v=>pk.pads[v]).map(v=>[VOICES[v].n,pk.pads[v],VOICES[v].c]),pos=Object.keys(pk.pos).sort((a,b)=>a-b).map(k=>[tfPosName(pk.sub,+k),pk.pos[k]]);
  return openSheet('Pocket',`<p>Two different things: <b>where</b> you play (ahead of the beat, on it, or laid back behind it) and <b>how steady</b> you are (how much your notes spread). A steady lay-back scores as well as dead-on.</p>
   <h3>Per pad</h3>${tfPocketTable(pads)}${pos.length>1?`<h3>Per note position</h3>${tfPocketTable(pos)}`:''}
   <p class="mut" style="font-size:13px">Pocket = 100 − 3 per ms of spread above 8 − 1.5 per ms of offset beyond ±30. Rows need ${TF_POCKET_MIN}+ notes.${pk.swing?' Swung notes are measured where the swing puts them.':''}</p>${typeof qlI==='function'?`<div class="row">${qlI(tfRefs('pocket'),'Pocket')}<span class="mut">What rushing and dragging mean</span></div>`:''}`);}
// the last 30 days on the kit (lesson runs + time drills on the kit), overall and per pad, from stored run hits
function tfPocket30(now){now=now||Date.now();const from=now-30*DAY,by={},all=[];let runs=0;
  state.sessions.forEach(s=>{if(s.ts<from||s.ts>now||!Array.isArray(s.hits)||!s.hits.length)return;if(!(LBY[s.id]&&!s.kind)&&!(s.kind==='time'&&s.src==='kit'))return;runs++;
    s.hits.forEach(h=>{const v=LANES[h[0]];if(!v||h[1]==null)return;all.push(h[1]);(by[v]=by[v]||[]).push(h[1]);});});
  const P={};Object.entries(by).forEach(([v,a])=>{const p=tfPocket(a);if(p)P[v]=p;});return {all:tfPocket(all),pads:P,runs};}

/* ---------- after a time run (from finish()): minutes + streak, the ladder, the result ---------- */
function tfDone(R,res){
  thAddTime(res.elapsed);lastRunTs=0;if(typeof p1Act==='function')p1Act();
  const src=R.touchN&&!R.kitN?'touch':R.kitN?'kit':L.tsrc,kind=L.time;
  const hitRec=R.evs.filter(e=>!e.listen&&!e.anchor&&e.hitT!=null).slice(0,256).map(e=>[LANES.indexOf(e.v),Math.round(e.dt),e.vel||0]);
  const rec={ts:Date.now(),id:L.id,kind:'time',src,ex:0,bpm:R.bpm,score:res.score,on:res.on,n:res.n,ext:res.ext,miss:res.miss,avg:Math.round(res.avg),dur:Math.round(res.elapsed/1000)};
  let head='',body='',ok=false;
  if(kind==='drift'){const c=tfDriftCurve(R);
    if(!c){rec.tf={pat:TF.drift,none:1};head=`<div style="font-weight:700;font-size:20px">Not enough notes</div><div class="mut">Keep playing for all ${TF_DRIFT_BARS} bars after the count-in, so the app can follow your tempo.</div>`;}
    else{const w=tfDriftWords(c);ok=c.dev<=5;rec.score=c.steady;rec.tf={pat:TF.drift,bars:c.bars,start:c.start,end:c.end,dev:c.dev,st:c.steady};
      head=`<div class="score" style="color:${ok?'var(--good)':'var(--warn)'}">${c.steady}</div><div style="margin-left:18px"><div style="font-weight:700;font-size:20px">${w.lab}</div><div class="mut">Steadiness · ${esc(w.line)}</div></div>`;
      body=`<div class="tfchart">${tfDriftSvg(c.bars,c.set)}</div><p class="mut" style="font-size:13px">The line is your tempo in each bar; the shaded band is the set tempo ±5 %. ${c.ch>0&&Math.abs(c.ch)/c.start>=0.02?'Speeding up is the most common drift: breathe, and let the pedal and the backbeat sit a little wider.':c.ch<0&&Math.abs(c.ch)/c.start>=0.02?'Slowing down often means you’re listening to each note: keep counting out loud (coach rule D3).':''}</p>`;}}
  else{const st=TF_GAP[L.tstep],g=st.v?null:tfGapStats(R);ok=tfGapPass(R,res.score);const msg=tfLadderAfter(L.tsrc,L.tstep,ok);
    rec.tf={step:L.tstep,ok:ok?1:0};if(g){rec.tf.dr=g.dr;rec.tf.pl=Math.round(g.played*100);}
    const drl=g?g.dr.map(d=>d==null?'—':tfSign(d)+' ms').join(' · '):'';
    head=`<div class="score" style="color:${ok?'var(--good)':'var(--warn)'}">${res.score}%</div><div style="margin-left:18px"><div style="font-weight:700;font-size:20px">${ok?'Clean ✓':'Not yet'}</div><div class="mut">${esc(msg)}</div></div>`;
    body=g?`<p>When the click came back: <b>${drl}</b> <span class="mut">(− = ahead, + = behind; clean = within ±${TF_RET} ms)</span> · ${Math.round(g.played*100)}% of the gap notes played</p>`:`<p>${res.on} of ${res.n} notes on time (±${state.set.tol} ms) · need ${TF_VAR_PASS}% for clean</p>`;}
  rec.hits=hitRec;state.sessions.push(rec);
  const it=typeof p1Cur==='function'&&p1Cur();if(it&&it.k==='time'&&('time:'+it.drill)===L.id)p1Mark(it,'done');save();renderPracBar();
  showResult(`<div class="row">${head}</div>${body}${kind==='drift'?'':tfPocketHtml(R)}<p class="mut" style="font-size:13px">Time drills count for practice minutes and your streak, never for lesson progress or song readiness.${src==='touch'?' Played on the screen pads (this device’s screen delay is subtracted).':''}</p>${typeof p1NextBox==='function'?p1NextBox():''}`);
}

/* ---------- Today items ---------- */
function tfGapItem(src){const ld=tfLad(src);return {k:'time',key:'time:gap',drill:'gap',src,mins:1,t:'Gap click · '+tfStepName(ld.s),why:(src==='touch'?'Screen pads · ':'')+'The click drops out: keep the beat yourself until it comes back · step '+(ld.s+1)+' of '+TF_GAP.length};}
function tfDriftDue(now){now=now||Date.now();return !state.sessions.some(s=>s.id==='time:drift'&&s.ts>now-TF_DRIFT_DUE*DAY);}
function tfDriftItem(){return {k:'time',key:'time:drift',drill:'drift',src:'kit',mins:1,t:'Tempo-drift test',why:TF_DRIFT_BARS+' bars with no click: does your tempo stay put? · about once a week'};}

/* ---------- Time feel page ---------- */
VP.time=VP.time||{};
function tfLadderHtml(src){const ld=tfLad(src);
  return `<ol class="tfl">${TF_GAP.map((st,i)=>{const s=i<ld.s||i<=ld.top&&i!==ld.s?'done':i===ld.s?'here':'';const open=i<=ld.top;
    return `<li class="tfli ${s}"><span class="p1n">${s==='done'?'✓':i+1}</span><span class="tfln">${esc(tfStepName(i))}</span>${open?`<button class="sm ${i===ld.s?'pri':'ghost'}" data-tf="gap" data-step="${i}" data-src="${src}">${i===ld.s?'Play':'Again'}</button>`:'<span class="mut tflk">later</span>'}</li>`;}).join('')}</ol>`;}
function renderTime(){
  const src=VP.time.src||tfSrcNow(),ld=tfLad(src),dr=state.sessions.filter(s=>s.id==='time:drift'&&s.tf&&s.tf.bars).slice(-5).reverse(),p30=tfPocket30();
  const gaps=state.sessions.filter(s=>s.id==='time:gap'&&s.src===src).slice(-1)[0];
  view.innerHTML=`<h1>Time feel</h1><p class="sub">Your own internal clock: keep the beat when the click goes quiet, hold a tempo with no click at all, and see where you sit against the beat. Minutes and streak only; lessons are untouched.</p>
  <section class="card tfc"><div class="tfh"><div style="min-width:0"><div class="note-k">Gap click</div><div class="h2" style="margin:0">Step ${ld.s+1} of ${TF_GAP.length} · ${esc(tfStepName(ld.s))}</div></div>
    <div class="seg" role="group" aria-label="Played on"><button class="${src==='kit'?'on':''}" data-tfsrc="kit">Kit</button><button class="${src==='touch'?'on':''}" data-tfsrc="touch">Screen pads</button></div></div>
   <p class="mut">The click drops out for 1, then 2, then 4 bars. Clean = you keep playing and are within ±${TF_RET} ms when it comes back; ${TF_UP} clean runs in a row move you up, ${TF_DOWN} rough ones move you back a step.${ld.ok?' <b>'+ld.ok+' of '+TF_UP+' clean</b> at this step.':''}${gaps&&gaps.tf&&gaps.tf.dr?' Last time: '+gaps.tf.dr.map(d=>d==null?'—':tfSign(d)+' ms').join(' · ')+'.':''}</p>
   <div class="row"><button class="pri" data-tf="gap" data-src="${src}">${icon('play',16)} Play step ${ld.s+1}</button>${typeof qlI==='function'?qlI(tfRefs('gap'),'Gap click'):''}</div>${tfLadderHtml(src)}</section>
  <section class="card tfc"><div class="note-k">Tempo-drift test</div><div class="h2" style="margin:0">${TF_DRIFT_BARS} bars, no click</div>
   <p class="mut">After a 1-bar count-in the click stops. Keep the tempo for ${TF_DRIFT_BARS} bars; the app follows you bar by bar. About once a week is plenty.</p>
   <div class="row"><div class="seg" role="group" aria-label="Pattern"><button class="${TF.drift==='pulse'?'on':''}" data-tfpat="pulse">Quarter notes</button><button class="${TF.drift==='groove'?'on':''}" data-tfpat="groove">Rock groove</button></div><button class="pri" data-tf="drift">${icon('play',16)} Start at ${TF_DRIFT_BPM} BPM</button></div>
   ${dr.length?`<div class="tfchart">${tfDriftSvg(dr[0].tf.bars,dr[0].bpm)}</div><div class="list">${dr.map(s=>`<div class="lrow"><span class="idx">${esc(periodName('D'+dkey(new Date(s.ts))))}</span><span style="flex:1;min-width:0">${Math.round(s.tf.start)} → ${Math.round(s.tf.end)} BPM · ${s.tf.pat==='groove'?'groove':'quarters'}</span><b>${s.tf.st}</b></div>`).join('')}</div>`:'<p class="mut">No drift test yet.</p>'}</section>
  <section class="card tfc"><div class="note-k">Pocket · last 30 days on the kit</div>
   ${p30.all?`<div class="tfpk tfpk-big"><b>${p30.all.score}</b><span>${esc(p30.all.line)} (${tfSign(p30.all.m)} ms, spread ±${p30.all.sd} ms) · ${p1Pl(p30.runs,'run')}</span></div>${tfPocketTable(LANES.filter(v=>p30.pads[v]).map(v=>[VOICES[v].n,p30.pads[v],VOICES[v].c]))}`:'<p class="mut">Play a few lessons on the kit and your pocket shows here: where you sit against the beat and how steady you are, per pad.</p>'}
   <p class="mut" style="font-size:13px">Every result screen shows the pocket of that run, per pad and per note position. Limb interference and a dynamics trainer come later (Level 3+).</p></section>`;
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{const T=e.target;let b;
  if((b=T.closest('[data-tf]'))){const a=b.dataset.tf;
    if(a==='gap'){tfOpen('gap',{step:b.dataset.step!=null?+b.dataset.step:undefined,src:b.dataset.src||undefined});return;}
    if(a==='drift'){tfOpen('drift');return;}
    if(a==='pocket'){tfPocketSheet();return;}
    if(a==='page'){go('time');return;}}
  if((b=T.closest('[data-tftest]'))){(async()=>{const el=$('#tftests');el.innerHTML='Running…';const t=await p3Tests();go('practise');const e2=$('#tftests');if(e2)e2.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>Time feel: ${t.filter(x=>x.pass).length}/${t.length} pass</b></div>`+t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');})();return;}
  if((b=T.closest('[data-tfsrc]'))){VP.time.src=b.dataset.tfsrc;render();return;}
  if((b=T.closest('[data-tfpat]'))){TF.drift=b.dataset.tfpat;render();return;}
});

/* ---------- tests (?test=1 › Practise › Time feel › Run time-feel tests) ---------- */
async function p3Tests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det===undefined?'':String(det)});
  const keep=JSON.stringify({time:state.time,set:state.set,lat:state.lat,plan:state.plan,days:state.days,prog:state.prog,journal:state.journal}),keepN=state.sessions.length,keepSES=typeof SES!=='undefined'?SES:null,keepMem=JSON.stringify(P1_MEM),keepTF=TF.drift;
  const reset=()=>{closeSheets();if(run)stopRun(false);routineStop();SES=null;$('#prac').classList.add('hidden');$('#result').classList.add('hidden');L=null;};
  const last=()=>state.sessions[state.sessions.length-1];
  // play the run R without timers: f(e,i) → offset in ms (null = not played); extra = [t] raw hits
  const play=(f,extra)=>{const R=run;R.evs.forEach((e,i)=>{if(e.listen||e.anchor)return;const d=f(e,i);if(d==null)return;hit(e.v,80,e.t+d+state.lat,e.art,'kit');});(extra||[]).forEach(t=>hit('S',80,t,undefined,'kit'));R.end=performance.now()-1e4;finish();return R;};
  const go0=async(kind,o)=>{tfOpen(kind,o);await startRun();return run;};
  try{
    reset();state.lat=0;P1_MEM.touchlat={ms:0,at:1};
    // state
    {const s={};tfFill(s);T('Back-fill: an old backup gets two gap ladders at step 1',s.time&&s.time.gap.kit.s===0&&s.time.gap.touch.s===0);
     const s2={time:{gap:{kit:{s:99,ok:'x'}}}};tfFill(s2);T('Back-fill clamps a broken ladder',s2.time.gap.kit.s===TF_GAP.length-1&&s2.time.gap.kit.ok===0&&s2.time.gap.touch.s===0);
     const m=tfMerge({gap:{kit:{s:2,ok:1,bad:0,top:3,at:5}}},{gap:{kit:{s:1,ok:0,bad:1,top:1,at:9},touch:{s:4,ok:0,bad:0,top:4,at:2}}});
     T('Merge: per ladder the later change wins, the highest step reached is kept',m.gap.kit.s===1&&m.gap.kit.top===3&&m.gap.touch.s===4);
     const fs=freshState();tfFill(fs);T('A fresh state has state.time',fs.time&&fs.time.gap&&fs.time.gap.kit);
     const ms=mergeStates(Object.assign(freshState(),{time:{gap:{kit:{s:3,ok:0,bad:0,top:3,at:4}}}}),freshState());T('mergeStates carries state.time',ms.time&&ms.time.gap.kit.s===3);}
    // exercises
    {let okL=true,det='';TF_GAP.forEach((st,i)=>{const ex=tfGapEx(i),spb=ex.steps||4*ex.sub;Object.values(ex.v).forEach(s=>{if(s.length!==spb*ex.bars){okL=false;det+=i+' ';}});
       if(!st.v&&(ex.gap.length!==({1:4,2:3,4:2}[st.g]*st.g)||ex.gap.includes(ex.bars-1)||ex.labels.length!==ex.bars)){okL=false;det+='g'+i+' ';}});
     T('Every ladder step: pattern length = steps × bars; gaps never in the last bar (the click comes back)',okL,det);
     const d=tfDriftEx('groove');T('Drift test: 16 bars, no click in any bar',d.bars===16&&d.gap.length===16&&d.v.HH.length===128);}
    // engine: click modes
    {const mk=c=>buildRun({lv:0,loop:1},X('c',2,{S:'x.x.x.x.'},{bars:2,click:c}),60,0,{cin:0,subclick:false});
     const k4=mk('4').clicks.map(c=>Math.round(c.t)),ka=mk('and').clicks.map(c=>Math.round(c.t)),kall=mk('all').clicks.length;
     T('Click on beat 4 only (new opt-in click mode)',k4.join()==='3000,7000',k4.join());
     T('Click on the “&” (new opt-in click mode)',ka.join()==='500,1500,2500,3500,4500,5500,6500,7500',ka.join());
     T('Other click modes unchanged (all = 8 clicks over 2 bars)',kall===8&&mk('24').clicks.length===4&&mk('1').clicks.length===2);
     const g=buildRun({lv:0,loop:1},tfGapEx(0),60,0,{cin:0,subclick:false});const bars=new Set(g.clicks.map(c=>Math.floor(c.t/4000)));
     T('Gap step 1: no click in the gap bars',tfGapEx(0).gap.every(b=>!bars.has(b))&&bars.has(0)&&bars.has(12),[...bars].join());}
    // gap ladder: clean / rough runs
    state.time={gap:{kit:{s:0,ok:0,bad:0,top:0,at:0},touch:{s:0,ok:0,bad:0,top:0,at:0}}};
    await go0('gap',{src:'kit'});play(()=>0);
    {const s=last();T('A perfect gap run: kind time, id time:gap, 100 %, clean',s.kind==='time'&&s.id==='time:gap'&&s.score===100&&s.tf.ok===1&&s.tf.dr.every(d=>d===0),JSON.stringify(s.tf));
     T('…saved with its hits and the kit as source',Array.isArray(s.hits)&&s.hits.length>10&&s.src==='kit');
     T('…never touches lesson progress or lesson views',!state.prog['time:gap']&&runsWhere().every(x=>x.kind!=='time'));
     T('…result shows the drift when the click came back and the pocket',/When the click came back/.test($('#result').textContent)&&$('#result .tfpk'));
     T('One clean run: 1 of 2, still step 1',tfLad('kit').s===0&&tfLad('kit').ok===1);}
    await go0('gap',{src:'kit'});play(()=>0);T('Two clean in a row: step up to 2',tfLad('kit').s===1&&tfLad('kit').top===1&&/Step up/.test($('#result').textContent));
    await go0('gap',{src:'kit'});play(e=>tfGapEx(1).gap.includes(e.bar)?-60:0);{const s=last();T('Rushing 60 ms in the gaps: not clean (drift −60)',s.tf.ok===0&&s.tf.dr.every(d=>d===-60),JSON.stringify(s.tf.dr));}
    await go0('gap',{src:'kit'});play(e=>tfGapEx(1).gap.includes(e.bar)?null:0);{const s=last();T('Stopping in the gaps: not clean (gap notes played 0 %)',s.tf.ok===0&&s.tf.pl===0);}
    T('Two rough in a row: back one step (coach rule D2)',tfLad('kit').s===0&&tfLad('kit').top===1);
    await go0('gap',{src:'kit'});play(e=>tfGapEx(0).gap.includes(e.bar)?25:0);T('Behind 25 ms when the click returns: still clean (±40)',last().tf.ok===1);
    await go0('gap',{src:'kit',step:3});play(()=>0);T('Playing a step you chose never moves the ladder',tfLad('kit').s===0&&last().tf.step===3&&/a step you chose/.test($('#result').textContent));
    state.time.gap.kit={s:6,ok:0,bad:0,top:6,at:1};await go0('gap',{src:'kit'});
    T('Variant step: click on 2 & 4, no gaps',run.ex.click==='24'&&!run.ex.gap);play((e,i)=>i%8===0?60:0);{const s=last();T('Variant: clean needs '+TF_VAR_PASS+' % on time',s.tf.ok===1&&s.score>=80&&s.score<100,s.score);}
    state.time.gap.kit={s:TF_GAP.length-1,ok:1,bad:0,top:TF_GAP.length-1,at:1};await go0('gap',{src:'kit'});T('40-BPM step plays 8ths on the hi-hat',run.bpm===40&&run.ex.v.HH);play(()=>0);T('Top of the ladder stays at the top',tfLad('kit').s===TF_GAP.length-1&&/Top of the ladder/.test($('#result').textContent));
    // screen pads
    state.time.gap.touch={s:0,ok:0,bad:0,top:0,at:0};tfOpen('gap',{src:'touch'});T('Screen-pads ladder shows the pads',!$('#pads').classList.contains('hidden')&&$('#prac').classList.contains('tapmode'));
    await startRun();{const R=run;R.evs.forEach(e=>{if(!e.listen)hit(e.v,80,e.t+20,undefined,'touch');});P1_MEM.touchlat={ms:20,at:1};R.end=performance.now()-1e4;finish();}
    {const s=last();T('Touch run: the screen delay is subtracted, its own ladder moves',s.src==='touch'&&s.score===100&&tfLad('touch').ok===1&&tfLad('kit').s===TF_GAP.length-1,s.score+' '+JSON.stringify(state.time.gap.touch));}
    P1_MEM.touchlat={ms:0,at:1};
    // drift test
    {const sim=async(f,pat)=>{tfOpen('drift',{pat:pat||'pulse',src:'kit'});await startRun();const R=run,start=R.base+R.cinMs;
       // f(beat index) → ms per beat at that point; notes placed by integrating the player's own tempo
       let t=start;const ons=[];for(let i=0;i<R.ex.bars*R.spb;i++){if(Object.values(R.ex.v).some(s=>s[i]!=='.'))ons.push({i,t});t+=f(i/R.sub)/R.sub;}
       ons.forEach(o=>Object.keys(R.ex.v).forEach(v=>{if(R.ex.v[v][o.i]!=='.')hit(v,80,o.t+state.lat,undefined,'kit');}));R.end=performance.now()-1e4;finish();return last();};
     let s=await sim(()=>60000/70);T('Drift test, perfectly steady: 16 bars at 70, steadiness 100',s.id==='time:drift'&&s.tf.bars.length===16&&s.tf.bars.every(b=>Math.abs(b-70)<0.3)&&s.tf.st===100,JSON.stringify(s.tf.bars));
     T('…a tempo chart is drawn',$('#result .tfchart svg'));
     s=await sim(b=>60000/(70+b*10/64));T('Speeding up 70 → 80 over 16 bars: found, “sped up”',s.tf.end>s.tf.start+7&&s.tf.end<s.tf.start+11&&/sped up/.test($('#result').textContent)&&s.tf.st<60,s.tf.start+'→'+s.tf.end+' st '+s.tf.st);
     s=await sim(b=>60000/(66-b*6/64));T('Slowing down 66 → 60: found, “slowed down”',s.tf.end<s.tf.start-4&&/slowed down/.test($('#result').textContent),s.tf.start+'→'+s.tf.end);
     s=await sim(()=>60000/80);T('Steady but faster than set (80 vs 70): started at 80, steadiness 100',Math.abs(s.tf.start-80)<0.5&&s.tf.st===100,s.tf.start);
     s=await sim(b=>60000/(70+b*6/64),'groove');T('Groove pattern (3 pads, 8ths) also tracked: 70 → 76',Math.abs(s.tf.start-70.2)<1.2&&Math.abs(s.tf.end-75.7)<1.5,s.tf.start+'→'+s.tf.end);
     tfOpen('drift',{pat:'pulse',src:'kit'});await startRun();{const R=run;R.evs.slice(0,3).forEach(e=>hit(e.v,80,e.t,undefined,'kit'));R.end=performance.now()-1e4;finish();}
     T('Too few notes: “Not enough notes”, nothing breaks',/Not enough notes/.test($('#result').textContent)&&last().tf.none===1);
     // jittered steady run with a stray extra hit
     tfOpen('drift',{pat:'pulse',src:'kit'});await startRun();{const R=run;let k=7;const rnd=()=>{k=(k*16807)%2147483647;return k/2147483647;};R.evs.forEach(e=>hit(e.v,80,e.t+(rnd()*2-1)*12,undefined,'kit'));hit('S',80,R.evs[20].t+300,undefined,'kit');R.end=performance.now()-1e4;finish();}
     T('Human jitter ±12 ms + one stray hit: still read as steady (≥ 85)',last().tf.st>=85&&last().tf.bars.every(b=>Math.abs(b-70)<3),last().tf.st);}
    // pocket
    {T('Pocket needs '+TF_POCKET_MIN+'+ notes',tfPocket([1,2,3])===null);
     const a=tfPocket(Array(20).fill(0).map((_,i)=>i%2?4:-4)),b=tfPocket(Array(20).fill(0).map((_,i)=>25+(i%2?4:-4))),c=tfPocket(Array(20).fill(0).map((_,i)=>i%2?30:-30));
     T('Dead-on and steady: on the beat · very steady, 100',a.where==='on the beat'&&a.cons==='very steady'&&a.score===100,JSON.stringify(a));
     T('A steady lay-back (+25 ms) scores as well as dead-on',b.score===a.score&&b.where==='behind'&&b.line==='very steady · behind',JSON.stringify(b));
     T('Centred but spread ±30 ms: uneven, a low pocket',c.where==='on the beat'&&c.cons==='uneven'&&c.score<40,JSON.stringify(c));
     const d=tfPocket(Array(20).fill(-12));T('12 ms early: “slightly ahead”',d.where==='slightly ahead',d.where);
     const e=tfPocket(Array(20).fill(-55));T('55 ms early: ahead, and the pocket drops beyond ±30',e.where==='ahead'&&e.score<70,e.score);}
    // lesson results: pocket line, sheet; lesson scoring unchanged
    {const id='1.5.03';const before=JSON.stringify(state.prog[id]||null);openPractice(id);await startRun();play(e=>e.v==='K'?18:-6);const s=last();
     T('A lesson result shows the pocket line',$('#result .tfpk')&&/Pocket/.test($('#result').textContent));
     T('…the run is a normal lesson run (no kind)',!s.kind&&s.id===id&&s.score===100,s.score);
     T('…per-pad pocket: kick behind, the rest slightly ahead',TF.last&&TF.last.pads.K.where==='slightly behind'&&TF.last.pads.HH.where==='on the beat'||TF.last.pads.K.m===18,JSON.stringify(TF.last&&TF.last.pads.K));
     const m=tfPocketSheet();T('Per pad · per note sheet opens with both tables',m&&m.querySelectorAll('.tftab').length===2,m&&m.querySelectorAll('.tftab').length);closeSheets();
     state.prog[id]=before==='null'?undefined:JSON.parse(before);if(before==='null')delete state.prog[id];}
    // last 30 days
    {const now=Date.now();const keepS=state.sessions;state.sessions=[{ts:now-DAY,id:'1.5.03',bpm:80,score:90,hits:Array(12).fill(0).map((_,i)=>[2,10+(i%2),80])},{ts:now-2*DAY,id:'time:gap',kind:'time',src:'touch',hits:Array(12).fill([2,-80,80])},{ts:now-40*DAY,id:'1.5.03',hits:Array(12).fill([2,-80,80])},{ts:now-DAY,id:'tap:1.5.03',kind:'tap',hits:Array(12).fill([2,-80,80])}];
     const p=tfPocket30(now);T('Pocket, last 30 days: kit runs only (touch, tap and old runs left out)',p.runs===1&&p.all&&p.all.m===11,JSON.stringify(p.all));state.sessions=keepS;}
    // Today
    {p1Dev('planMode','go');const pl=p1Plan('go',p1Mins(),{rebuild:true}),ks=pl.items.map(x=>x.k);
     T('On the go: a gap click on the screen pads after the tap drill',ks.includes('time')&&pl.items.find(x=>x.k==='time').src==='touch'&&(ks.indexOf('tap')<0||ks.indexOf('time')===ks.indexOf('tap')+1),ks.join(','));
     state.sessions=state.sessions.filter(s=>s.id!=='time:drift');
     const k10=p1Plan('kit',10,{rebuild:true}).items,k20=p1Plan('kit',20,{rebuild:true}).items;
     T('At the kit: a gap click right after the warm-up',k10[1]&&k10[1].k==='time'&&k10[1].drill==='gap'&&k20[1].k==='time',k10.map(x=>x.k).join(','));
     T('Drift test in 20/40-min sessions only, when none in the last 7 days',!k10.some(x=>x.key==='time:drift')&&k20.some(x=>x.key==='time:drift'));
     state.sessions.push({ts:Date.now()-2*DAY,id:'time:drift',kind:'time',score:90});T('…not when one was played 2 days ago',!p1Plan('kit',20,{rebuild:true}).items.some(x=>x.key==='time:drift'));state.sessions.pop();
     const pg=p1Plan('go',p1Mins()),ti=pg.items.findIndex(x=>x.k==='time');p1Start(ti);
     T('Opening the item opens the gap drill on the practice screen',L&&L.time==='gap'&&!$('#prac').classList.contains('hidden')&&!$('#sesbar').classList.contains('hidden'));
     await startRun();play(()=>0);T('Finishing it marks the item done and offers the next one',pg.done['time:gap']&&$('#result .p1next'),Object.keys(pg.done).join());
     T('Quick look on the item points at the click and steady-time cards',typeof qlItemRefs!=='function'||qlItemRefs(pg.items[ti]).length>0);
     SES=null;}
    // page
    {go('time');T('Time feel page: ladder, drift test, pocket',$('#view .tfl')&&$('#view').textContent.includes('Tempo-drift test')&&$('#view').textContent.includes('Pocket'));
     $('#view [data-tfsrc="touch"]').click();T('…switch to the screen-pads ladder',VP.time.src==='touch'&&$('#view [data-tfsrc="touch"]').classList.contains('on'));VP.time.src=null;}
    // minutes + streak
    T('Time runs add practice minutes for today',(state.days[today()]||0)>0);
  }catch(e){T('No errors',false,e.message+' '+(e.stack||'').split('\n')[1]);}
  reset();const k=JSON.parse(keep);Object.assign(state,{time:k.time,set:k.set,lat:k.lat,plan:k.plan,days:k.days,prog:k.prog,journal:k.journal});state.sessions=state.sessions.slice(0,keepN);tfFill(state);p1Fill(state);
  SES=keepSES;Object.keys(P1_MEM).forEach(x=>delete P1_MEM[x]);Object.assign(P1_MEM,JSON.parse(keepMem));TF.drift=keepTF;
  return out;
}
window.p3Tests=p3Tests;
