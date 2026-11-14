/* DrumPath — drum notation (Theory T1, D-028, build/theory-brief.md §5).
   Own SVG renderer from the pattern format (build/pattern-spec.md): no library.
   Standard drum key: kick bottom space · floor tom 2nd space · snare 3rd space · tom 2 4th line · tom 1 4th space ·
   ride x top line · hi-hat x above the staff · crash x on a ledger line · hi-hat pedal x below the staff.
   Hands = voice 1 (stems up), feet = voice 2 (stems down). Each beat picks the simplest note value that holds all its
   notes (so 8ths written on a 16th-triplet grid are shown as plain 8ths). */
'use strict';
const NOTE_POS={K:1,T3:3,S:5,T2:6,T1:7,R:8,HH:9,C:10,HP:-1};
const NOTE_XHEAD={HH:1,R:1,C:1,HP:1};
const NOTE_VOICE=v=>v==='K'||v==='HP'?2:1;
const VAL_NAME={'-2':'whole note','-1':'half note','0':'quarter note','1':'8th note','2':'16th note','3':'32nd note'};

/* ---------- rhythm model ---------- */
function notMeter(ex){const spb=ex.steps||4*ex.sub;
  if(ex.meter){const m=String(ex.meter).split('→')[0].trim().match(/^(\d+)\/(\d+)/);if(m)return {num:+m[1],den:+m[2],text:m[1]+'/'+m[2],compound:+m[2]===8};}
  return {num:Math.round(spb/ex.sub),den:4,text:Math.round(spb/ex.sub)+'/4',compound:false};}
// beat groups inside one bar: from clicks if given, else every `sub` steps
function notGroups(ex){const spb=ex.steps||4*ex.sub;let starts=ex.clicks&&ex.clicks.length?[...ex.clicks].sort((a,b)=>a-b):null;
  if(!starts){starts=[];for(let i=0;i<spb;i+=ex.sub)starts.push(i);}
  return starts.map((s,i)=>[s,(i+1<starts.length?starts[i+1]:spb)-s]);}
// length of one step, in whole notes (1/4 = quarter). Triplet grids (sub 3/6 in simple time) are written as tuplets.
function notStepLen(ex,meter){const sub=ex.sub;
  if(meter.compound)return sub%3===0?3/(8*sub):1/(4*sub);      // 6/8, 12/8: a step of a 3-step beat is an 8th
  return 1/(4*sub);}
// note value for a duration in whole notes → {lv: 0 quarter / 1 8th / 2 16th / -1 half / -2 whole, dot}
function notVal(d){const n=Math.log2(d);if(Math.abs(n-Math.round(n))<1e-9)return {lv:-Math.round(n)-2,dot:0};
  const n2=Math.log2(d/1.5);if(Math.abs(n2-Math.round(n2))<1e-9)return {lv:-Math.round(n2)-2,dot:1};return null;}
function notValue(d,tupOK,m){let v=notVal(d);if(v)return {...v,tup:0};
  if(tupOK){v=notVal(d*1.5);if(v)return {...v,tup:m===6?6:3};}return null;}
const NOT_PIECES=[8,6,4,3,2,1];
function notSplit(m,k,slot,tupOK){const out=[];let left=k;while(left>0){const p=NOT_PIECES.find(x=>x<=left&&notValue(x*slot,tupOK,m))||1;out.push(p);left-=p;}return out;}
// coarsest even split of a span of g steps that holds every onset
const notCoarse=(ons,g)=>[1,2,3,4,6,8,12,16].find(mm=>Number.isInteger(g/mm*0)&&ons.every(p=>Number.isInteger(p*mm/g)))||g;
/* Build the items of one voice in one bar.
   item = {s: step in bar, rest, lv, dot, tup, heads:[{v,c}], span (steps), beat} */
function notVoiceBar(ex,lanes,bar,meter,groups){
  const spb=ex.steps||4*ex.sub,off=bar*spb,step=notStepLen(ex,meter),tupOK=!meter.compound&&ex.sub%3===0;
  const at=i=>lanes.map(v=>({v,c:ex.v[v][off+i]})).filter(h=>h.c&&h.c!=='.');
  const onsIn=(s,g)=>{const o=[];for(let i=0;i<g;i++)if(at(s+i).length)o.push(i);return o;};
  const fill=(s,g,ons,m,bi)=>{const items=[],slot=g/m*step,sl=p=>Math.round(p*m/g),pts=ons.map(sl);let cur=0;
    if(pts[0]>0)notSplit(m,pts[0],slot,tupOK).forEach(k=>{items.push({s:s+cur*g/m,rest:1,...notValue(k*slot,tupOK,m),span:k*g/m,beat:bi});cur+=k;});
    pts.forEach((p,j)=>{const end=j+1<pts.length?pts[j+1]:m;let c=p;notSplit(m,end-p,slot,tupOK).forEach((k,q)=>{
      items.push(Object.assign({s:s+c*g/m,rest:q?1:0,...notValue(k*slot,tupOK,m),span:k*g/m,beat:bi},q?{}:{heads:at(s+c*g/m)}));c+=k;});});
    return items;};
  const beats=[];
  for(let bi=0;bi<groups.length;bi++){const [s,g]=groups[bi];const ons=onsIn(s,g);
    // quarter-note triplets: three even notes across two beats
    if(tupOK&&bi+1<groups.length&&bi%2===0&&groups[bi+1][1]===g){const ons2=onsIn(s,2*g);
      if(ons2.length&&ons2.some(p=>p>=g)&&ons.length&&notCoarse(ons2,2*g)===3){beats.push({bi,s,g:2*g,m:3,items:fill(s,2*g,ons2,3,bi)});beats.push({bi:bi+1,s:s+g,g,items:[],joined:true});bi++;continue;}}
    if(!ons.length){beats.push({bi,s,g,empty:true,items:[{s,rest:1,...notValue(g*step,tupOK,1),span:g,beat:bi,full:true}]});continue;}
    const m=notCoarse(ons,g);beats.push({bi,s,g,m,items:fill(s,g,ons,m,bi),single:ons.length===1&&ons[0]===0&&m===1});
  }
  // join whole beats into half / dotted-half / whole notes and rests (simple meters only)
  if(!meter.compound&&groups.every(([,g])=>g===groups[0][1])){const n=beats.length;
    for(let b=0;b<n;b++){const B=beats[b];if(!(B.single||B.empty)||B.joined)continue;
      let run=1;while(b+run<n&&beats[b+run].empty&&!beats[b+run].joined)run++;
      let take=0,lv=0,dot=0;
      if(b===0&&run>=n&&n===4){take=4;lv=-2;}else if(b===0&&n===3&&run>=3){take=3;lv=-1;dot=1;}
      else if(B.empty&&b===0&&run>=n){take=n;lv=-2;}
      else if(run>=2&&b%2===0&&n!==3){take=2;lv=-1;}
      if(take>1){const it=B.items[0];it.lv=lv;it.dot=dot;it.tup=0;it.span=groups.slice(b,b+take).reduce((a,[,g])=>a+g,0);it.full=true;if(B.empty&&take===n)it.wholeBar=true;
        for(let q=1;q<take;q++){beats[b+q].items=[];beats[b+q].joined=true;}}
    }}
  if(meter.compound&&beats.every(B=>B.empty)){beats.forEach((B,i)=>{B.items=i?[]:[{s:0,rest:1,lv:-2,dot:0,wholeBar:true,span:spb,beat:0}];});}
  return beats;
}
// count syllables per bar: follow what is written (the coarsest split that holds every note in the bar)
function notBarCount(ex,meter,groups,bar){const spb=ex.steps||4*ex.sub,off=bar*spb,lanes=LANES.filter(v=>ex.v[v]);
  const has=i=>lanes.some(v=>{const c=ex.v[v][off+i];return c&&c!=='.';});const out={};
  groups.forEach(([s,g],gi)=>{const ons=[];for(let i=0;i<g;i++)if(has(s+i))ons.push(i);
    const all=groups.every(([,gg])=>gg===g)?groups.flatMap(([ss])=>{const o=[];for(let i=0;i<g;i++)if(has(ss+i))o.push(i);return o;}):ons;
    let m=notCoarse(all,g);if(m===1&&g>1)m=Math.min(g,meter.compound?3:2);
    const lab=notCount(ex,meter,m,gi);for(let j=0;j<m;j++)out[s+j*g/m]=lab[j];});
  return out;}

/* ---------- drawing ---------- */
const NOT_HS=5;                                  // half a staff space
function notSvg(ex,opts){
  opts=opts||{};const spb=ex.steps||4*ex.sub,meter=notMeter(ex),groups=notGroups(ex);
  const lanes=LANES.filter(v=>ex.v[v]&&NOTE_POS[v]!=null);
  const up=lanes.filter(v=>NOTE_VOICE(v)===1),dn=lanes.filter(v=>NOTE_VOICE(v)===2);
  const beatW=ex.sub>=6?96:ex.sub===1?64:76,colW=Math.max(11,beatW/ex.sub),barPad=16,barW=barPad+spb*colW+6;
  const W=Math.max(320,opts.width||720),head=58,perLine=Math.max(1,Math.floor((W-head-8)/barW));
  const lines=Math.ceil(ex.bars/perLine),sysH=ex.st?172:158,vw=head+barW*Math.min(perLine,ex.bars)+10,maxW=Math.round(Math.min(W,vw*(opts.maxScale||1.6)));
  const o=[],stepX={},ink='var(--ink)',mut='var(--muted)';
  const P=(t)=>o.push(t);
  for(let L=0;L<lines;L++){
    const top=L*sysH,y0=top+56,yB=y0+8*NOT_HS,yy=p=>yB-p*NOT_HS;const b0=L*perLine,b1=Math.min(ex.bars,b0+perLine);
    const x0=8,xEnd=head+(b1-b0)*barW;
    for(let k=0;k<5;k++)P(`<line x1="${x0}" x2="${xEnd}" y1="${yy(k*2)}" y2="${yy(k*2)}" stroke="${mut}" stroke-width="0.8"/>`);
    P(`<rect x="${x0+6}" y="${yy(6)}" width="3.2" height="${4*NOT_HS}" fill="${ink}"/><rect x="${x0+12}" y="${yy(6)}" width="3.2" height="${4*NOT_HS}" fill="${ink}"/>`);
    if(L===0){const [a,b]=meter.text.split('/');P(`<text x="${x0+30}" y="${yy(4)-2}" font-size="19" font-weight="700" text-anchor="middle" fill="${ink}">${a}</text><text x="${x0+30}" y="${yy(0)-2}" font-size="19" font-weight="700" text-anchor="middle" fill="${ink}">${b}</text>`);
      if(ex.swing&&ex.swing>0.5)P(`<text x="${x0}" y="${top+14}" font-size="12" fill="${mut}">Swing (8ths long–short)</text>`);}
    P(`<line x1="${xEnd}" x2="${xEnd}" y1="${yy(8)}" y2="${yy(0)}" stroke="${ink}" stroke-width="${b1===ex.bars?3:1}"/>`);
    if(b1===ex.bars){P(`<line x1="${xEnd-5}" x2="${xEnd-5}" y1="${yy(8)}" y2="${yy(0)}" stroke="${ink}" stroke-width="1"/><circle cx="${xEnd-11}" cy="${yy(5)}" r="1.8" fill="${ink}"/><circle cx="${xEnd-11}" cy="${yy(3)}" r="1.8" fill="${ink}"/>`);}
    for(let b=b0;b<b1;b++){
      const bx=head+(b-b0)*barW,X=i=>bx+barPad+i*colW+colW/2;
      if(b>b0)P(`<line x1="${bx}" x2="${bx}" y1="${yy(8)}" y2="${yy(0)}" stroke="${ink}" stroke-width="1"/>`);
      if(ex.labels&&ex.labels[b])P(`<text x="${bx+6}" y="${top+16}" font-size="12" font-weight="700" fill="var(--accent)">${esc(ex.labels[b])}</text>`);
      for(let i=0;i<spb;i++)stepX[b*spb+i]={x:X(i),line:L,top,w:colW};
      // count line + sticking
      {const lab=notBarCount(ex,meter,groups,b),gs=new Set(groups.map(([s])=>s));Object.keys(lab).forEach(k=>{const i=+k,t=lab[k],big=gs.has(i);
        P(`<text x="${X(i)}" y="${yB+46}" font-size="${big?12:10}" ${big?'font-weight="700"':''} text-anchor="middle" fill="${big?ink:mut}">${t}</text>`);});}
      if(ex.st)for(let i=0;i<spb;i++){const c=ex.st[(b*spb+i)%ex.st.length];if(c&&c!=='.')P(`<text x="${X(i)}" y="${yB+62}" font-size="11" text-anchor="middle" fill="var(--accent)">${c}</text>`);}
      const both=up.length&&dn.length;
      [[1,up],[2,dn]].forEach(([vo,vl])=>{if(!vl.length)return;
        const beats=notVoiceBar(ex,vl,b,meter,groups);
        if(vo===2&&beats.every(B=>B.empty))return;          // feet silent this bar: no rests drawn
        const restsOK=!(vo===2&&up.length);                 // drum charts leave out kick rests when the hands play
        beats.forEach(B=>{
          const notes=B.items.filter(it=>!it.rest);const beamable=notes.filter(it=>it.lv>=1);
          const isUp=vo===1;
          const ys=it=>it.heads.map(h=>yy(NOTE_POS[h.v]));
          const stemEnd=beamable.length>=2?(isUp?Math.min(...beamable.flatMap(ys))-30:Math.max(...beamable.flatMap(ys))+30):null;
          B.items.forEach(it=>{
            const x=X(it.s);
            if(it.rest&&!restsOK)return;
            if(it.rest){const ry=it.wholeBar?yy(both?(vo===1?6:2):6):yy(both?(vo===1?6:2):4);P(notRest(it.wholeBar?bx+barW/2:x,ry,it.wholeBar?-2:it.lv,it.dot,ink));return;}
            const hy=ys(it),hi=Math.min(...hy),lo=Math.max(...hy);
            it.heads.forEach(h=>{const y=yy(NOTE_POS[h.v]);P(notHead(x,y,h,it.lv,ink,b*spb+it.s));
              if(NOTE_POS[h.v]>=10)P(`<line x1="${x-8}" x2="${x+8}" y1="${yy(10)}" y2="${yy(10)}" stroke="${ink}" stroke-width="1"/>`);
              if(it.dot)P(`<circle cx="${x+9}" cy="${y-(NOTE_POS[h.v]%2?0:NOT_HS)}" r="1.6" fill="${ink}"/>`);});
            if(it.lv>=-1){const sx=isUp?x+5:x-5,end=stemEnd!=null&&it.lv>=1?stemEnd:(isUp?hi-30:lo+30);
              P(`<line x1="${sx}" x2="${sx}" y1="${isUp?lo:hi}" y2="${end}" stroke="${ink}" stroke-width="1.3"/>`);
              if(it.lv>=1&&!(beamable.length>=2))for(let f=0;f<it.lv;f++){const fy=end+(isUp?f*6:-f*6);P(`<path d="M${sx} ${fy} q 9 ${isUp?7:-7} 7 ${isUp?17:-17}" fill="none" stroke="${ink}" stroke-width="1.6"/>`);}
              it._sx=sx;it._end=end;}
            // articulations
            const acc=it.heads.some(h=>h.c==='X');if(acc){const se=it._end!=null?it._end:(isUp?hi:lo);const ay=isUp?Math.min(se,yy(9))-8:Math.max(se,yy(-1))+12;P(`<path d="M${x-5} ${ay-4} L${x+5} ${ay} L${x-5} ${ay+4}" fill="none" stroke="${ink}" stroke-width="1.4"/>`);}
            if(it.heads.some(h=>h.c==='o'))P(`<circle cx="${x}" cy="${yy(13)}" r="3.4" fill="none" stroke="${ink}" stroke-width="1.2"/>`);
          });
          // beams
          if(beamable.length>=2){const xs=beamable.map(it=>it._sx);const by=stemEnd,dir=isUp?1:-1;
            P(`<rect x="${xs[0]-0.6}" y="${isUp?by:by-4}" width="${xs[xs.length-1]-xs[0]+1.2}" height="4" fill="${ink}"/>`);
            for(let lv=2;lv<=4;lv++)beamable.forEach((it,j)=>{if(it.lv<lv)return;const ny=by+dir*(lv-1)*6,yb=isUp?ny:ny-4;
              const nx=beamable[j+1];if(nx&&nx.lv>=lv){P(`<rect x="${it._sx-0.6}" y="${yb}" width="${nx._sx-it._sx+1.2}" height="4" fill="${ink}"/>`);return;}
              const pv=beamable[j-1];if(pv&&pv.lv>=lv)return;const stub=Math.min(9,colW*0.8);const sx0=pv?it._sx-stub:it._sx;P(`<rect x="${sx0-0.6}" y="${yb}" width="${stub+1.2}" height="4" fill="${ink}"/>`);});}
          // tuplet number (3 / 6) over the beat
          const tup=B.items.find(it=>it.tup&&!it.full);if(tup&&notes.length){const xs=B.items.map(it=>X(it.s));const mx=(Math.min(...xs)+Math.max(...xs))/2+(isUp?5:-5);
            const ty=isUp?(stemEnd!=null?stemEnd-6:yy(8)-38):(stemEnd!=null?stemEnd+16:yy(0)+46);P(`<text x="${mx}" y="${ty}" font-size="11" font-style="italic" font-weight="700" text-anchor="middle" fill="${ink}">${tup.tup}</text>`);}
        });
      });
    }
  }
  const H=lines*sysH;
  return {svg:`<svg viewBox="0 0 ${vw} ${H}" width="100%" style="max-width:${maxW}px;display:block" class="notsvg" role="img" aria-label="Drum notation, ${meter.text}">${o.join('')}<rect id="nph" x="0" y="0" width="0" height="0" fill="var(--accent)" opacity="0.18" rx="3"/></svg>`,stepX,sysH,lines,spb};
}
function notHead(x,y,h,lv,ink,step){
  const da=`data-nstep="${step}" data-nv="${h.v}" data-nc="${h.c}"`;const out=[];
  const g=h.c==='g',hollow=lv<=-1;
  if(NOTE_XHEAD[h.v]||h.c==='r'){out.push(`<path ${da} d="M${x-4} ${y-4} L${x+4} ${y+4} M${x+4} ${y-4} L${x-4} ${y+4}" stroke="${ink}" stroke-width="1.8" style="cursor:pointer"/>`);
    if(h.c==='r')out.push(`<circle cx="${x}" cy="${y}" r="6.2" fill="none" stroke="${ink}" stroke-width="1"/>`);
    out.push(`<rect ${da} x="${x-7}" y="${y-7}" width="14" height="14" fill="transparent" style="cursor:pointer"/>`);}
  else out.push(`<ellipse ${da} cx="${x}" cy="${y}" rx="5.4" ry="3.9" transform="rotate(-20 ${x} ${y})" fill="${hollow?'none':ink}" stroke="${ink}" stroke-width="${hollow?1.5:0.6}" style="cursor:pointer"/>`);
  if(g)out.push(`<text x="${x-10}" y="${y+4}" font-size="13" fill="${ink}" text-anchor="middle">(</text><text x="${x+10}" y="${y+4}" font-size="13" fill="${ink}" text-anchor="middle">)</text>`);
  if(h.c==='f'||h.c==='d'){const n=h.c==='d'?2:1;for(let k=0;k<n;k++){const gx=x-12-k*6;out.push(`<ellipse cx="${gx}" cy="${y}" rx="3" ry="2.2" transform="rotate(-20 ${gx} ${y})" fill="${ink}"/><line x1="${gx+2.6}" x2="${gx+2.6}" y1="${y}" y2="${y-16}" stroke="${ink}" stroke-width="0.9"/>`);}
    out.push(`<line x1="${x-14-(n-1)*6}" x2="${x-6}" y1="${y-6}" y2="${y-13}" stroke="${ink}" stroke-width="0.9"/>`);}
  return out.join('');
}
function notRest(x,y,lv,dot,ink){
  let s='';
  if(lv<=-2)s=`<rect x="${x-6}" y="${y}" width="12" height="5" fill="${ink}"/>`;           // whole: hangs from the 4th line
  else if(lv===-1)s=`<rect x="${x-6}" y="${y-5}" width="12" height="5" fill="${ink}"/>`;            // half: sits on the middle line
  else if(lv===0)s=`<path d="M${x-2} ${y-12} l5 6 l-5 5 l5 6 q-6 -2 -3 5" fill="none" stroke="${ink}" stroke-width="1.8"/>`;
  else{s=`<line x1="${x+4}" y1="${y-7}" x2="${x-1}" y2="${y+9}" stroke="${ink}" stroke-width="1.3"/>`;
    for(let f=0;f<lv;f++){const fy=y-7+f*6;s+=`<circle cx="${x-3+f*-1}" cy="${fy+1}" r="2" fill="${ink}"/><path d="M${x-3+f*-1} ${fy+2} q4 1 7 -3" fill="none" stroke="${ink}" stroke-width="1.2"/>`;}}
  if(dot)s+=`<circle cx="${x+9}" cy="${y-3}" r="1.6" fill="${ink}"/>`;
  return s;
}
// count syllables for one beat group
function notCount(ex,meter,m,gi){const n=String(gi+1);
  if(m===1)return [n];if(m===2)return [n,'&'];if(m===3)return meter.compound?[n,'&','a']:[n,'trip','let'];
  if(m===4)return [n,'e','&','a'];if(m===6)return meter.compound?[n,'·','&','·','a','·']:[n,'la','li','&','la','li'];if(m===8)return [n,'·','e','·','&','·','a','·'];
  return [n,...Array(m-1).fill('·')];}
/* ---------- explanations (tap a note) ---------- */
function notExplain(ex,step,v,c){
  const spb=ex.steps||4*ex.sub,meter=notMeter(ex),groups=notGroups(ex),bar=Math.floor(step/spb),i=step%spb;
  const gi=groups.findIndex(([s,g])=>i>=s&&i<s+g),[gs]=groups[gi],syl=notBarCount(ex,meter,groups,bar)[i]||'·';
  const where=i===gs?'on beat '+(gi+1):'on the “'+syl+'” of '+(gi+1);
  const beats=notVoiceBar(ex,LANES.filter(x=>ex.v[x]&&NOTE_VOICE(x)===NOTE_VOICE(v)),bar,meter,groups);
  const it=beats.flatMap(B=>B.items).find(t=>!t.rest&&t.s===i);
  let val=it?VAL_NAME[it.lv]||'note':'note';if(it&&it.dot)val='dotted '+val;if(it&&it.tup===3)val=(it.lv===0?'quarter-note':it.lv===-1?'half-note':'8th-note')+' triplet';if(it&&it.tup===6)val='16th-note sextuplet';
  const extra={X:'accent (play louder)',g:'ghost note (play very soft)',o:'open hi-hat',r:'cross-stick / rim',f:'flam (soft grace note just before)',d:'drag (two quick grace notes before)'}[c];
  const st=ex.st?ex.st[step%ex.st.length]:'';
  return `${VOICES[v]?VOICES[v].n:v} · ${val} · ${where}${ex.bars>1?' (bar '+(bar+1)+')':''}${extra?' · '+extra:''}${st&&st!=='.'?' · '+(st==='R'?'right hand':st==='L'?'left hand':st):''}`;
}

/* ---------- practice screen panel ---------- */
let NOT={ex:null,r:null};
function nview(){return state.set.nview||'both';}
function renderNotationPanel(){
  const w=$('#notewrap');if(!w)return;const mode=nview();
  const P=$('#prac');P.classList.toggle('nv-grid',mode==='grid');P.classList.toggle('nv-both',mode==='both');P.classList.toggle('nv-notation',mode==='notation');
  const b=$('#nvbtn');if(b)b.textContent={grid:'View: Grid',both:'View: Both',notation:'View: Notation'}[mode];
  if(mode==='grid'||!L||!L.ex||!L.ex[exI]){w.innerHTML='';NOT={ex:null,r:null,mode};if(typeof sizeCv==='function')requestAnimationFrame(()=>{sizeCv();draw();});return;}
  const ex=L.ex[exI];const width=Math.max(320,Math.round(w.clientWidth||innerWidth)-8);
  try{const r=notSvg(ex,{width,maxScale:mode==='notation'?2:1.6});NOT={ex,r,mode};
    w.innerHTML=`<div class="notsvgw">${r.svg}</div><div class="nexp mut" id="nexp">Tap a note to see what it is. Count out loud with the line under the staff.</div>`;
    // fit the height: at least one full line (staff + count) must show without scrolling
    const P=$('#prac'),top=P.querySelector('.ptop'),pads=$('#pads'),expH=($('#nexp')||{}).offsetHeight||20;
    const avail=(mode==='notation'?P.clientHeight-top.offsetHeight-140-(pads?pads.offsetHeight:0):innerHeight*0.42)-expH-12;
    const svg=w.querySelector('svg');const vb=svg.viewBox.baseVal,need=(r.lines>1?r.sysH:vb.height);
    const scale=svg.getBoundingClientRect().width/vb.width;
    if(avail>60&&need*scale>avail)svg.style.maxWidth=Math.max(Math.min(vb.width,w.clientWidth),Math.floor(vb.width*avail/need))+'px';}
  catch(e){console.error(e);w.innerHTML='<div class="mut" style="padding:8px">Couldn’t draw this exercise as notation.</div>';NOT={ex:null,r:null};}
  if(typeof sizeCv==='function')requestAnimationFrame(()=>{sizeCv();if(typeof draw==='function')draw();});
}
// called from draw(): move the highlight to the step being played
function notPlayhead(R,now){
  if(!NOT.r||!R||R.ex!==NOT.ex)return;const ph=document.getElementById('nph');if(!ph)return;
  const t=now-(R.base+R.cinMs);if(!run||t<0){ph.setAttribute('width',0);return;}
  const total=NOT.r.spb*R.ex.bars,stepMs=R.barMs/NOT.r.spb,st=Math.floor(t/stepMs)%total,p=NOT.r.stepX[st];if(!p)return;
  ph.setAttribute('x',p.x-p.w/2);ph.setAttribute('width',p.w);ph.setAttribute('y',p.top+8);ph.setAttribute('height',NOT.r.sysH-16);
}
document.addEventListener('click',ev=>{const h=ev.target.closest('[data-nstep]');if(!h||!NOT.ex)return;
  const e=$('#nexp');if(e)e.textContent=notExplain(NOT.ex,+h.dataset.nstep,h.dataset.nv,h.dataset.nc);});
addEventListener('resize',()=>{if(!$('#prac')||$('#prac').classList.contains('hidden'))return;clearTimeout(NOT._rt);NOT._rt=setTimeout(renderNotationPanel,150);});

/* ---------- checks (test mode): every exercise renders, one head per note ---------- */
function notationTests(){
  const out=[],T=(n,ok,d)=>out.push({name:n,pass:!!ok,det:d||''});let n=0,bad=[];
  LESSONS.forEach(l=>(l.ex||[]).forEach((ex,i)=>{n++;try{const r=notSvg(ex,{width:720});const heads=(r.svg.match(/data-nstep=/g)||[]).length;
      const xh=LANES.filter(v=>ex.v[v]&&NOTE_XHEAD[v]).reduce((a,v)=>a+[...ex.v[v]].filter(c=>c!=='.').length,0)+LANES.filter(v=>ex.v[v]&&!NOTE_XHEAD[v]).reduce((a,v)=>a+[...ex.v[v]].filter(c=>c==='r').length,0);
      const notes=LANES.filter(v=>ex.v[v]).reduce((a,v)=>a+[...ex.v[v]].filter(c=>c!=='.').length,0);
      if(heads!==notes+xh)bad.push(l.id+'#'+(i+1)+' '+heads+'≠'+(notes+xh));if(/NaN|undefined/.test(r.svg))bad.push(l.id+'#'+(i+1)+' NaN');}
    catch(e){bad.push(l.id+'#'+(i+1)+' '+e.message);}}));
  T('Every exercise draws as notation (one head per note)',!bad.length,n+' exercises'+(bad.length?' · '+bad.slice(0,6).join(' | '):''));
  const ex1=X('t',2,{HH:'xxxxxxxx',S:'..x...x.',K:'x...x...'});const b=notVoiceBar(ex1,['HH','S'],0,notMeter(ex1),notGroups(ex1));
  T('Rock beat: hi-hat 8ths beamed in pairs',b.length===4&&b.every(B=>B.items.length===2&&B.items.every(it=>it.lv===1)),'');
  const kb=notVoiceBar(ex1,['K'],0,notMeter(ex1),notGroups(ex1)).flatMap(B=>B.items);T('Kick on 1 and 3 written as half notes',kb.length===2&&kb.every(it=>it.lv===-1&&!it.rest),kb.map(i=>i.lv).join(','));
  const wn=notVoiceBar(X('t',1,{S:'x...'}),['S'],0,notMeter(X('t',1,{S:'x...'})),notGroups(X('t',1,{S:'x...'}))).flatMap(B=>B.items);T('Whole note',wn.length===1&&wn[0].lv===-2,'');
  const e6=X('t',6,{S:rep('x..x..',4)});const s6=notVoiceBar(e6,['S'],0,notMeter(e6),notGroups(e6)).flatMap(B=>B.items);T('8ths on a 16th-triplet grid are plain 8ths',s6.every(it=>it.lv===1&&!it.tup),'');
  const e3=X('t',3,{S:rep('x.x',4)});const s3=notVoiceBar(e3,['S'],0,notMeter(e3),notGroups(e3)).flatMap(B=>B.items);T('Shuffle: triplet quarter + triplet 8th',s3[0].lv===0&&s3[0].tup===3&&s3[1].lv===1,'');
  const ed=X('t',4,{S:rep('x..x',4)});const sd=notVoiceBar(ed,['S'],0,notMeter(ed),notGroups(ed)).flatMap(B=>B.items);T('Dotted 8th + 16th',sd[0].lv===1&&sd[0].dot&&sd[1].lv===2,'');
  const e68=X('t',3,{S:'x..x..'},{steps:6,meter:'6/8'});const s68=notVoiceBar(e68,['S'],0,notMeter(e68),notGroups(e68)).flatMap(B=>B.items);T('6/8: dotted quarters',s68.length===2&&s68.every(it=>it.lv===0&&it.dot),'');
  const eq=X('t',3,{S:rep('x.x.x.',2)});const sq=notVoiceBar(eq,['S'],0,notMeter(eq),notGroups(eq)).flatMap(B=>B.items);T('Quarter-note triplets: 3 notes over 2 beats',sq.length===6&&sq.every(it=>it.lv===0&&it.tup===3&&!it.rest),sq.map(i=>i.lv+'/'+i.tup).join(','));
  const e64=X('t',2,{S:'XxxXxx'},{steps:6,clicks:[0,2,4],meter:'6/8'});const s64=notVoiceBar(e64,['S'],0,notMeter(e64),notGroups(e64)).flatMap(B=>B.items);T('6/8 written in 8ths: no false tuplets',s64.every(it=>it.lv===1&&!it.tup),'');
  const c6=notBarCount(X('t',6,{S:rep('x..x..',4)}),notMeter(X('t',6,{S:''.padEnd(24,'.')})),notGroups(X('t',6,{S:''.padEnd(24,'.')})),0);T('Count follows what is written (8ths on a triplet grid → “1 &”)',Object.values(c6).join(' ')==='1 & 2 & 3 & 4 &',Object.values(c6).join(' '));
  T('Tap a note: plain explanation',/Snare · 8th note · on the “&” of 2/.test(notExplain(X('t',2,{S:'...x....'}),3,'S','x')),notExplain(X('t',2,{S:'...x....'}),3,'S','x'));
  return out;
}
