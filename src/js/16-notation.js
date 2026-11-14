/* DrumPath — staff notation on the practice screen (Theory T1, D-028, build/theory-brief.md §5).
   Own SVG renderer, no library: it reads the same pattern data the engine scores (sub, steps, bars, lanes, chars,
   st, meter, labels, swing), so what you read is exactly what is scored. Grid / Notation / Both toggle, a count line
   under the staff, a playhead that moves across both views, and tap-a-note explanations.
   Drawing only: nothing here changes runs, matching or scoring. */
'use strict';
const NT={
  // staff position in half-spaces from the top line (0 = top line, 8 = bottom line); standard drum key
  pos:{C:-2,R:0,HH:-1,T1:1,T2:2,S:3,T3:5,K:7,HP:9},
  xHead:{C:1,R:1,HH:1,HP:1}, feet:{K:1,HP:1},
  where:{C:'an x on the ledger line above the staff',R:'an x on the top line',HH:'an x just above the staff',T1:'the top space',
    T2:'the 2nd line from the top',S:'the 3rd space from the bottom',T3:'the 2nd space from the bottom',K:'the bottom space',HP:'an x below the staff'},
  val:{1:'whole note',2:'half note',4:'quarter note',8:'8th note',16:'16th note',32:'32nd note'},
  rest:{1:'whole rest',2:'half rest',4:'quarter rest',8:'8th rest',16:'16th rest',32:'32nd rest'}
};
const NOTA={key:'',sel:null,lay:null,cls:{},lastPi:-1,lastSys:-1,runRef:null,byRep:null,status:''};
const nvMode=()=>(L&&L.calib)?'grid':(state.set.nview||'both');

/* ---------- meter of each bar ---------- */
function ntMeters(ex){
  const bars=ex.bars||1;
  const parts=String(ex.meter||'').split('→').map(s=>s.trim()).filter(s=>/^\d+\/\d+$/.test(s));
  const out=[];for(let b=0;b<bars;b++)out.push(ntMeter(ex,parts.length?parts[Math.min(parts.length-1,Math.floor(b*parts.length/bars))]:null));
  return out;
}
function ntMeter(ex,m){
  const sub=ex.sub,spb=ex.steps||4*sub;let num,den;
  if(m)[num,den]=m.split('/').map(Number);
  else if(spb%sub===0){num=spb/sub;den=4;}
  else if(sub===2){num=spb;den=8;}
  else throw new Error('no meter for sub '+sub+' steps '+spb);
  const compound=den===8&&num%3===0&&num>3;
  let stepDen,tup=0;
  if(den===8)stepDen=sub%3===0?8*sub/3:4*sub;
  else if(den===4){if(sub%3===0){stepDen=8*sub/3;tup=sub;}else stepDen=4*sub;}
  else stepDen=den*sub;
  if(stepDen!==Math.round(stepDen)||(stepDen&(stepDen-1)))throw new Error('odd step value '+stepDen);
  const total=spb/stepDen*(tup?2/3:1);
  if(Math.abs(total-num/den)>1e-9)throw new Error(`${spb} steps don’t make a bar of ${num}/${den}`);
  // beat groups (one beam group each)
  let G=compound?3*stepDen/8:den===4?sub:0;const groups=[];
  if(G&&spb%G===0)for(let a=0;a<spb;a+=G)groups.push([a,a+G]);
  else{const b=beatStepsOf(ex).filter(s=>s<spb);if(b[0]!==0)b.unshift(0);b.forEach((s,i)=>groups.push([s,i+1<b.length?b[i+1]:spb]));G=0;}
  const count=[],beatOf=[];
  groups.forEach(([a,b],g)=>{const n=b-a,w=String(g+1);for(let i=0;i<n;i++){let t;
    if(tup===3)t=['','trip','let'][i];else if(tup===6)t=['','la','li','&','la','li'][i];
    else if(compound)t=n===3?['','2','3'][i]:(i%(n/3)?'e':String(i/(n/3)+1));
    else if(n===1)t='';else if(n===2)t=['','&'][i];else if(n===3)t=['','&','a'][i];else if(n===4)t=['','e','&','a'][i];
    else if(n===8)t=['','','e','','&','','a',''][i];else t=i%2?'':'·';
    count.push(i===0?w:t.trim());beatOf.push(g);}});
  const plain=G&&(den===4||compound)?(compound?{den:4,dot:true}:{den:4,dot:false}):null;
  return{num,den,ts:num+'/'+den,compound,stepDen,tup,groups,G,count,beatOf,plain};
}
/* note value of `len` steps: {den, dot} or null */
function ntValOf(len,stepDen,noDot){
  for(const dot of noDot?[false]:[false,true]){const b=dot?len/1.5:len;if(b<1||b!==Math.floor(b)||(b&(b-1)))continue;
    const d=stepDen/b;if(d>=1&&d===Math.floor(d)&&!(d&(d-1)))return{den:d,dot};}
  return null;
}
function ntRests(out,a,from,len,stepDen,tup){ // aligned, undotted rests
  let s=from,left=len;while(left>0){let k=left;while(k>1&&!(ntValOf(k,stepDen,true)&&(s-a)%k===0))k--;
    const v=ntValOf(k,stepDen,true);out.push({rest:1,start:s,len:k,den:v.den,dot:false,tup});s+=k;left-=k;}
}
/* one voice, one bar → entries [{start,len,den,dot,tup,rest?|heads[]}] */
function ntVoiceBar(ex,lanes,off,mt,two){
  const spb=ex.steps||4*ex.sub;
  const at=i=>lanes.filter(v=>{const c=ex.v[v][off+i];return c&&c!=='.';}).map(v=>({v,ch:ex.v[v][off+i]}));
  const ons=[];for(let i=0;i<spb;i++)if(at(i).length)ons.push(i);
  if(!ons.length)return[{rest:1,mrest:1,start:0,len:spb,den:1,dot:false,tup:0}];
  const E=[],gs=mt.groups,ng=gs.length,has=g=>ons.some(i=>i>=gs[g][0]&&i<gs[g][1]);
  for(let g=0;g<ng;g++){
    const [a,b]=gs[g],go=ons.filter(i=>i>=a&&i<b);
    if(mt.plain&&(go.length===0||(go.length===1&&go[0]===a))){
      let m=1;while(g+m<ng&&!has(g+m))m++;
      let s=1;const note=go.length===1;
      // long notes (half, whole) only when one voice is written; in a groove each beat keeps its own note + rest
      if(!mt.compound){if(note&&two);else if(note&&g===0&&m>=4&&ng===4)s=4;else if(note&&g===0&&m>=3&&ng===3)s=3;else if(g%2===0&&m>=2&&(note||ng%2===0))s=2;}
      else if(note&&!two){if(g===0&&m>=4&&ng===4)s=4;else if(g%2===0&&m>=2)s=2;}
      const v=mt.compound?{1:{den:4,dot:true},2:{den:2,dot:true},4:{den:1,dot:true}}[s]:{1:{den:4,dot:false},2:{den:2,dot:false},3:{den:2,dot:true},4:{den:1,dot:false}}[s];
      E.push(Object.assign({start:a,len:s*(b-a),tup:0},v,note?{heads:at(a)}:{rest:1}));g+=s-1;continue;
    }
    let tup=mt.tup;
    // a 16th-triplet beat whose notes all sit on the half-beat is just 8ths: write it without the 6
    if(tup===6&&go.every(i=>(i-a)%3===0)){const sub=[];const go2=go.map(i=>a+(i-a)/3);ntBeat(sub,a,a+2,go2,mt.stepDen/2,0,i=>at(a+(i-a)*3));
      sub.forEach(e=>{e.start=a+(e.start-a)*3;e.len*=3;E.push(e);});continue;}
    ntBeat(E,a,b,go,mt.stepDen,tup,at);
  }
  return E;
}
function ntBeat(E,a,b,go,stepDen,tup,at){
  {const mt={stepDen};
    if(!go.length){ntRests(E,a,a,b-a,mt.stepDen,tup);return;}
    if(go[0]>a)ntRests(E,a,a,go[0]-a,mt.stepDen,tup);
    go.forEach((i,j)=>{const d=(j+1<go.length?go[j+1]:b)-i;let k=d;while(k>1&&!ntValOf(k,mt.stepDen))k--;
      const v=ntValOf(k,mt.stepDen);E.push({start:i,len:k,den:v.den,dot:v.dot,tup,heads:at(i)});if(d>k)ntRests(E,a,i+k,d-k,mt.stepDen,tup);});
  }
}
const ntWhole=e=>(1/e.den)*(e.dot?1.5:1)*(e.tup?2/3:1);
function ntValName(e,mt){
  let s;
  if(e.tup===3&&!e.dot&&e.den===8)s='8th-note triplet';
  else if(e.tup===3&&!e.dot&&e.den===4)s='quarter-note triplet (two triplet 8ths long)';
  else if(e.tup===6&&!e.dot&&e.den===16)s='16th-note triplet';
  else if(e.tup===6&&!e.dot&&e.den===8)s='8th note inside a 16th-note triplet (two of the six)';
  else s=(e.dot?'dotted ':'')+(e.rest?NT.rest:NT.val)[e.den]+(e.tup?' inside a group of '+e.tup:'');
  if(mt.den===4){const beats=ntWhole(e)*4;if(beats>=1&&Math.abs(beats-Math.round(beats))<1e-9)s+=` · lasts ${beats} beat${beats>1?'s':''}`;}
  else if(mt.compound){const p=ntWhole(e)/(3/8);if(p>=1&&Math.abs(p-Math.round(p))<1e-9)s+=` · lasts ${p} big beat${p>1?'s':''}`;}
  return s;
}
function ntWhere(mt,i){const g=mt.beatOf[i],w=mt.count[i],n=g+1;if(i===mt.groups[g][0])return'on beat '+n;
  return w?(mt.compound?`on the “${w}” of beat ${n}`:`on the “${w==='&'?'and':w}” of ${n}`):`between the counts of beat ${n}`;}

/* ---------- layout + SVG ---------- */
function ntBuild(ex,availW,opts={}){
  const sub=ex.sub,spb=ex.steps||4*sub,bars=ex.bars||1,plen=spb*bars;
  const mts=ntMeters(ex);
  const used=v=>ex.v[v]&&/[^.]/.test(ex.v[v]);
  const up=LANES.filter(v=>used(v)&&!NT.feet[v]),dn=LANES.filter(v=>used(v)&&NT.feet[v]);
  const voices=[];if(up.length)voices.push({d:'up',lanes:up});if(dn.length)voices.push({d:'dn',lanes:dn});
  const two=voices.length===2;
  const ent=voices.map(vc=>mts.map((mt,b)=>ntVoiceBar(ex,vc.lanes,b*spb,mt,voices.length>1)));
  const all=s=>Object.values(ex.v).some(x=>s.test(x));
  const hasAccUp=up.some(v=>/X/.test(ex.v[v])),hasAccDn=dn.some(v=>/X/.test(ex.v[v])),hasOpen=/o/.test(ex.v.HH||'');
  const hasTup=v=>ent[v]&&ent[v].some(bar=>bar.some(e=>e.tup&&!e.mrest));
  const tupUp=hasTup(0)&&voices[0].d==='up',tupDn=!tupUp&&voices.some((vc,k)=>vc.d==='dn'&&hasTup(k));
  const hasLab=!!(ex.labels||(ex.swing||0.5)>0.5),hasSt=!!(ex.st&&/[RL]/.test(ex.st)),graces=all(/[fd]/);
  // horizontal: step width from the longest count word; as many bars per line as fit (max 4)
  const maxLen=Math.max(1,...mts.flatMap(m=>m.count).map(s=>s.length));
  const minW=Math.max(sub>=8?14:graces?20:16,5.9*maxLen+6),maxW=46;
  const clefW=24,tsW=24,repW=14,barPad=14,endPad=8;
  const lead=(b,first)=>barPad+(first?clefW:0)+((b===0||mts[b].ts!==mts[b-1].ts)?tsW:0)+(b===0&&!opts.noRepeat?repW:0);
  const W=Math.max(200,availW);
  let per=Math.min(4,bars);
  const need=(b0,k,sw)=>{let w=0;for(let b=b0;b<Math.min(bars,b0+k);b++)w+=lead(b,b===b0)+spb*sw+endPad;return w+2;};
  while(per>1&&[...Array(Math.ceil(bars/per)).keys()].some(s=>need(s*per,per,minW)>W))per--;
  let stepW=minW;{const fixed=need(0,per,0);stepW=Math.max(minW,Math.min(maxW,(W-fixed)/(spb*per)));}
  if(bars>per&&bars%per&&per>2){const p2=Math.ceil(bars/Math.ceil(bars/per));if(p2<per)per=p2;}
  // vertical rows (relative to the staff's top line)
  const topM=(hasLab?70:tupUp?58:hasOpen?48:hasAccUp?40:30)+(graces?0:0);
  const below=two||dn.length?(hasAccDn?84:74)+(tupDn?12:0):46;
  const stRow=below+12,cRow=hasSt?stRow+17:below+14,sysH=topM+cRow+10;
  const yP=(st,p)=>st+p*5;
  const S=[];const steps=new Array(plen);const sys=[];const heads=[];
  const P=(...a)=>S.push(a.join(''));
  const f1=n=>Math.round(n*10)/10;
  let svgW=0;
  for(let s=0,b0=0;b0<bars;s++,b0+=per){
    const sTop=s*sysH,st=sTop+topM;let x=0;const bx=[];
    for(let b=b0;b<Math.min(bars,b0+per);b++){const l=lead(b,b===b0);bx.push({b,x0:x,cx:x+l,xe:x+l+spb*stepW+endPad});x=x+l+spb*stepW+endPad;}
    const sysW=x+2;svgW=Math.max(svgW,sysW);sys.push({top:sTop,h:sysH,st});
    // staff lines
    for(let k=0;k<5;k++)P(`<line class="nsl" x1="0" x2="${f1(sysW-1)}" y1="${st+k*10}" y2="${st+k*10}"/>`);
    // clef
    P(`<rect class="nfill" x="7" y="${st+10}" width="3.5" height="20"/><rect class="nfill" x="13" y="${st+10}" width="3.5" height="20"/>`);
    if(s===0&&(ex.swing||0.5)>0.5)P(`<text class="nlab" x="2" y="${st-topM+12}">Swing: 8ths long–short</text>`);
    bx.forEach(({b,x0,cx,xe},k)=>{
      const mt=mts[b];let lx=x0+(k===0?clefW:0)+4;
      if(b===0||mt.ts!==mts[b-1].ts){P(`<text class="nts" x="${f1(lx+9)}" y="${st+18}">${mt.num}</text><text class="nts" x="${f1(lx+9)}" y="${st+38}">${mt.den}</text>`);lx+=tsW;}
      if(b===0&&!opts.noRepeat){P(`<rect class="nfill" x="${f1(lx)}" y="${st}" width="3.5" height="40"/><line class="nsl" x1="${f1(lx+7)}" x2="${f1(lx+7)}" y1="${st}" y2="${st+40}"/><circle class="nfill" cx="${f1(lx+11.5)}" cy="${st+15}" r="1.9"/><circle class="nfill" cx="${f1(lx+11.5)}" cy="${st+25}" r="1.9"/>`);}
      if(ex.labels&&ex.labels[b])P(`<text class="nlab nbl" x="${f1(cx)}" y="${st-topM+12}">${esc(ex.labels[b])}</text>`);
      const X=i=>cx+(i+0.5)*stepW;
      for(let i=0;i<spb;i++){const pi=b*spb+i;steps[pi]={x:X(i),sys:s,bar:b,i};
        P(`<rect class="ncol" data-ns="${pi}" x="${f1(cx+i*stepW)}" y="${st-topM+(hasLab?16:2)}" width="${f1(stepW)}" height="${f1(cRow+topM-(hasLab?16:2)+6)}"/>`);
        const w=mt.count[i];if(w)P(`<text class="ncnt${i===mt.groups[mt.beatOf[i]][0]?' nbeat':''}" data-ns="${pi}" x="${f1(X(i))}" y="${st+cRow}">${esc(w)}</text>`);
        if(hasSt){const c=ex.st[pi];if(c==='R'||c==='L')P(`<text class="nstk" x="${f1(X(i))}" y="${st+stRow}">${c}</text>`);}
      }
      // barline
      const last=b===bars-1;
      if(last&&!opts.noRepeat)P(`<circle class="nfill" cx="${f1(xe-12)}" cy="${st+15}" r="1.9"/><circle class="nfill" cx="${f1(xe-12)}" cy="${st+25}" r="1.9"/><line class="nsl" x1="${f1(xe-8)}" x2="${f1(xe-8)}" y1="${st}" y2="${st+40}"/><rect class="nfill" x="${f1(xe-4.5)}" y="${st}" width="3.5" height="40"/>`);
      else if(last)P(`<line class="nsl" x1="${f1(xe-7)}" x2="${f1(xe-7)}" y1="${st}" y2="${st+40}"/><rect class="nfill" x="${f1(xe-4.5)}" y="${st}" width="3.5" height="40"/>`);
      else P(`<line class="nsl" x1="${f1(xe-1)}" x2="${f1(xe-1)}" y1="${st}" y2="${st+40}"/>`);
      // voices
      const restKey=e=>e.rest&&!e.mrest?e.start+':'+e.len+':'+e.den:null;
      const shared=two?new Set(ent[0][b].map(restKey).filter(k=>k&&ent[1][b].some(q=>restKey(q)===k))):new Set();
      voices.forEach((vc,vi)=>{
        const E=ent[vi][b],upv=vc.d==='up',dir=upv?-1:1;
        const beamY=upv?st-26:st+70,accY=upv?st-32:st+78,restY=two?(upv?st+9:st+37):(upv?st+19:st+28);
        if(E.length===1&&E[0].mrest){const mx=(cx+cx+spb*stepW)/2,ly=two?(upv?st+10:st+30):st+10;P(`<rect class="nfill" x="${f1(mx-6)}" y="${ly}" width="12" height="5"/>`);return;}
        const stems=[];
        E.forEach(e=>{const x0=e.rest&&e.den<=2?(X(e.start)+X(e.start+e.len-1))/2:X(e.start);
          if(e.rest){const sh=shared.has(restKey(e));if(sh&&!upv)return;   // both voices rest here: one rest, in the middle
            ntRest(P,f1,x0,sh?st+19:restY,e,sh?st+20:two?(upv?st+10:st+30):st+20);return;}
          // heads, lowest first for up-stems (highest first for down-stems)
          const hs=e.heads.slice().sort((p,q)=>upv?NT.pos[q.v]-NT.pos[p.v]:NT.pos[p.v]-NT.pos[q.v]);let prev=null,shift={};
          hs.forEach(h=>{const p=NT.pos[h.v];if(prev!=null&&Math.abs(p-prev)===1&&!shift[prev])shift[p]=1;prev=p;});
          const sx=upv?x0+4.8:x0-4.8;
          hs.forEach(h=>{const p=NT.pos[h.v],y=yP(st,p),hx=x0+(shift[p]?(upv?9.6:-9.6):0);heads.push(h.v+':'+(b*spb+e.start));
            ntHead(P,f1,hx,y,h,e,b*spb+e.start);
            if(p<=-2)P(`<line class="nsl" x1="${f1(hx-8)}" x2="${f1(hx+8)}" y1="${yP(st,-2)}" y2="${yP(st,-2)}"/>`);
            if(e.dot)P(`<circle class="nfill" cx="${f1(hx+(shift[p]&&upv?0:0)+9.5)}" cy="${f1(y-(p%2===0?5:0)+(p%2===0?0:0))}" r="1.8"/>`);
            if(h.ch==='X')ntAccent(P,f1,x0,accY);
            if(h.ch==='o')P(`<circle class="nline" cx="${f1(x0)}" cy="${st-42}" r="3.3"/>`);
            if((h.ch==='f'||h.ch==='d')&&upv)ntGrace(P,f1,x0-(shift[p]?0:0),y,h.ch==='d'?2:1);
          });
          if(e.den>=2){const ys=hs.map(h=>yP(st,NT.pos[h.v]));const yFar=upv?Math.max(...ys):Math.min(...ys);
            P(`<line class="nstem" x1="${f1(sx)}" x2="${f1(sx)}" y1="${f1(yFar)}" y2="${f1(beamY)}"/>`);
            stems.push({x:sx,nb:e.den>=8?Math.log2(e.den)-2:0,g:mt.beatOf[e.start],start:e.start,e});}
        });
        // beams: runs of flagged notes in the same beat with no rest between
        const ordered=E.filter(e=>!e.mrest);const runs=[];let cur=null;
        ordered.forEach(e=>{const sm=stems.find(q=>q.e===e);
          if(!e.rest&&sm&&sm.nb>0){if(cur&&cur.g===sm.g)cur.list.push(sm);else{cur={g:sm.g,list:[sm]};runs.push(cur);}}else cur=null;});
        runs.forEach(r=>{const l=r.list;
          if(l.length===1){const q=l[0];for(let k=0;k<q.nb;k++){const y0=beamY-dir*k*7;
            P(`<path class="nline nflag" d="M${f1(q.x)} ${f1(y0)} C${f1(q.x+1)} ${f1(y0-dir*5)},${f1(q.x+8.5)} ${f1(y0-dir*7)},${f1(q.x+7)} ${f1(y0-dir*15)}"/>`);}return;}
          const maxNb=Math.max(...l.map(q=>q.nb));
          for(let lv=1;lv<=maxNb;lv++){const y0=upv?beamY+(lv-1)*7:beamY-4-(lv-1)*7;
            let k=0;while(k<l.length){if(l[k].nb<lv){k++;continue;}let j=k;while(j+1<l.length&&l[j+1].nb>=lv)j++;
              if(j>k)P(`<rect class="nfill" x="${f1(l[k].x-0.7)}" y="${f1(y0)}" width="${f1(l[j].x-l[k].x+1.4)}" height="4"/>`);
              else{const left=k===l.length-1||(k>0&&l[k-1].nb<l[k].nb&&k+1<l.length&&l[k+1].nb<l[k].nb);const w=Math.min(8,stepW*0.45);
                P(`<rect class="nfill" x="${f1(left?l[k].x-w:l[k].x)}" y="${f1(y0)}" width="${f1(w)}" height="4"/>`);}
              k=j+1;}}
        });
        // tuplet numbers, one per beat that uses them
        if((upv&&tupUp)||(!upv&&tupDn)){mt.groups.forEach(([a,bb],g)=>{const te=E.filter(e=>e.tup&&e.start>=a&&e.start<bb);if(!te.length)return;
          const xa=X(a),xb=X(bb-1),ty=upv?st-48:st+92;
          P(`<path class="nline ntb" d="M${f1(xa-3)} ${f1(ty+dir*4)} V${f1(ty)} H${f1((xa+xb)/2-6)} M${f1((xa+xb)/2+6)} ${f1(ty)} H${f1(xb+3)} V${f1(ty+dir*4)}"/><text class="ntup" x="${f1((xa+xb)/2)}" y="${f1(ty+4)}">${mt.tup}</text>`);});}
      });
    });
  }
  const height=sys.length*sysH;
  const svg=`<svg class="ntsvg" xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(svgW)}" height="${height}" viewBox="0 0 ${Math.ceil(svgW)} ${height}"><rect class="nsel" x="0" y="0" width="0" height="0"/>${S.join('')}<line class="nph" x1="-9" x2="-9" y1="0" y2="0"/></svg>`;
  return{ex,svg,steps,sys,mts,ent,voices,heads,stepW,minW,width:Math.ceil(svgW),height,plen,spb,topM,cRow};
}
function ntHead(P,f1,x,y,h,e,pi){
  const hollow=e.den<=2,k=`${h.v}:${pi}`;let g=`<g class="nh" data-nk="${k}">`;
  if(NT.xHead[h.v]||h.ch==='r'){g+=`<path class="nline nxh" d="M${f1(x-4.3)} ${f1(y-4.3)} L${f1(x+4.3)} ${f1(y+4.3)} M${f1(x-4.3)} ${f1(y+4.3)} L${f1(x+4.3)} ${f1(y-4.3)}"/>`;
    if(h.ch==='r')g+=`<circle class="nline" cx="${f1(x)}" cy="${f1(y)}" r="6.6"/>`;}
  else g+=`<ellipse class="${hollow?'nline nhol':'nfill'}" cx="${f1(x)}" cy="${f1(y)}" rx="5.5" ry="3.9" transform="rotate(-20 ${f1(x)} ${f1(y)})"/>`;
  if(h.ch==='g')g+=`<path class="nline" d="M${f1(x-8)} ${f1(y-6)} Q${f1(x-11)} ${f1(y)} ${f1(x-8)} ${f1(y+6)} M${f1(x+8)} ${f1(y-6)} Q${f1(x+11)} ${f1(y)} ${f1(x+8)} ${f1(y+6)}"/>`;
  P(g+'</g>');
}
function ntAccent(P,f1,x,y){P(`<path class="nline nacc" d="M${f1(x-5)} ${f1(y-3.5)} L${f1(x+5)} ${f1(y)} L${f1(x-5)} ${f1(y+3.5)}"/>`);}
function ntGrace(P,f1,x,y,n){
  const xs=n===2?[x-17,x-11]:[x-11];
  xs.forEach(gx=>P(`<ellipse class="nfill" cx="${f1(gx)}" cy="${f1(y)}" rx="3.3" ry="2.4" transform="rotate(-20 ${f1(gx)} ${f1(y)})"/><line class="nstem" x1="${f1(gx+3)}" x2="${f1(gx+3)}" y1="${f1(y)}" y2="${f1(y-17)}"/>`));
  if(n===1)P(`<path class="nline nflag" d="M${f1(xs[0]+3)} ${f1(y-17)} C${f1(xs[0]+4)} ${f1(y-13)},${f1(xs[0]+8)} ${f1(y-12)},${f1(xs[0]+7)} ${f1(y-7)}"/><line class="nline" x1="${f1(xs[0]-1)}" x2="${f1(xs[0]+7)}" y1="${f1(y-7)}" y2="${f1(y-15)}"/>`);
  else P(`<rect class="nfill" x="${f1(xs[0]+2.5)}" y="${f1(y-18)}" width="${f1(xs[1]-xs[0]+1)}" height="2.5"/><rect class="nfill" x="${f1(xs[0]+2.5)}" y="${f1(y-14.5)}" width="${f1(xs[1]-xs[0]+1)}" height="2.5"/>`);
}
function ntRest(P,f1,x,cy,e,lineY){
  if(e.den===1){P(`<rect class="nfill" x="${f1(x-6)}" y="${lineY}" width="12" height="5"/>`);}
  else if(e.den===2){P(`<rect class="nfill" x="${f1(x-6)}" y="${lineY-5}" width="12" height="5"/>`);}
  else if(e.den===4){P(`<path class="nline nqr" d="M${f1(x-2)} ${f1(cy-11)} L${f1(x+3.5)} ${f1(cy-4)} L${f1(x-1.5)} ${f1(cy+1)} L${f1(x+3.5)} ${f1(cy+7)} C${f1(x-3)} ${f1(cy+4)},${f1(x-3.5)} ${f1(cy+10)},${f1(x+0.5)} ${f1(cy+13)}"/>`);}
  else{const n=Math.log2(e.den)-2;const top=cy-6;
    P(`<line class="nline" x1="${f1(x+3.5)}" y1="${f1(top)}" x2="${f1(x-1.5-n)}" y2="${f1(top+8+n*6)}"/>`);
    for(let k=0;k<n;k++){const yy=top+k*6,xx=x+3.5-k*1.6;P(`<circle class="nfill" cx="${f1(xx-5.5)}" cy="${f1(yy+1.5)}" r="2.2"/><path class="nline" d="M${f1(xx-5.5)} ${f1(yy+2.5)} Q${f1(xx-2)} ${f1(yy+3.5)} ${f1(xx)} ${f1(yy)}"/>`);}}
  if(e.dot)P(`<circle class="nfill" cx="${f1(x+8)}" cy="${f1(cy-3)}" r="1.8"/>`);
}

/* ---------- practice screen ---------- */
function notaRender(force){
  const pr=$('#prac');if(!pr||!L)return;const mode=nvMode();
  pr.classList.toggle('nv-g',mode==='grid');pr.classList.toggle('nv-n',mode==='notation');pr.classList.toggle('nv-b',mode==='both');
  const sel=$('#nvsel');if(sel){sel.classList.toggle('hidden',!!L.calib);sel.querySelectorAll('[data-nview]').forEach(b=>b.classList.toggle('on',b.dataset.nview===mode));}
  const box=$('#ntsv');if(!box)return;
  const ex=L.ex[exI];
  if(mode==='grid'||!ex){NOTA.key='';NOTA.lay=null;box.innerHTML='';notaSelect(null);sizeCv();return;}
  const w=Math.max(0,$('#nota').clientWidth-20),key=L.id+'|'+exI+'|'+w+'|'+mode;
  if(!force&&key===NOTA.key&&NOTA.lay){sizeCv();return;}
  if(NOTA.lay&&NOTA.lay.ex!==ex)notaSelect(null);
  // bigger on tablets: lay out at a smaller width, then scale the drawing up
  const zoom=w>=1000?1.35:w>=700?1.2:1;
  try{NOTA.lay=ntBuild(ex,w/zoom,{noRepeat:L.loop===1});NOTA.lay.zoom=zoom;
    box.innerHTML=NOTA.lay.svg.replace(/^<svg([^>]*?) width="(\d+)" height="(\d+)"/,(m,a,ww,hh)=>`<svg${a} width="${Math.ceil(ww*zoom)}" height="${Math.ceil(hh*zoom)}"`);}
  catch(err){NOTA.lay=null;box.innerHTML=`<p class="mut" style="padding:10px">Notation can’t show this exercise yet (${esc(err.message)}).</p>`;}
  NOTA.key=key;NOTA.cls={};NOTA.lastPi=-1;NOTA.lastSys=-1;NOTA.runRef=null;
  if(NOTA.sel!=null)notaSelect(NOTA.sel,true);
  sizeCv();
}
function notaSetMode(m){if(run)return;state.set.nview=m;save();notaRender(true);draw();}
function notaSelect(pi,keep){
  NOTA.sel=pi;const box=$('#nexp');const lay=NOTA.lay;const svg=$('#ntsv svg');
  if(svg){const r=svg.querySelector('.nsel');if(pi!=null&&lay&&lay.steps[pi]){const s=lay.steps[pi],sy=lay.sys[s.sys];
      r.setAttribute('x',s.x-lay.stepW/2);r.setAttribute('width',lay.stepW);r.setAttribute('y',sy.top+4);r.setAttribute('height',sy.h-6);}
    else r.setAttribute('width',0);}
  if(!box)return;
  if(pi==null){box.classList.add('hidden');box.innerHTML='';if(!keep&&!run)draw();return;}
  box.innerHTML=`<button class="nxx ghost sm" data-ntclose title="Close">✕</button>${ntExplain(L.ex[exI],pi)}`;box.classList.remove('hidden');
  if(!keep&&!run)draw();
}
function ntExplain(ex,pi){
  const spb=ex.steps||4*ex.sub,bar=Math.floor(pi/spb),i=pi%spb,mts=ntMeters(ex),mt=mts[bar];
  const lay=NOTA.lay&&NOTA.lay.ex===ex?NOTA.lay:ntBuild(ex,800);
  const head=`<div class="nxh1">${esc(ntWhere(mt,i))}${ex.bars>1?` · bar ${bar+1} of ${ex.bars}`:''} · count “${esc(mt.count[i]||'·')}”</div>`;
  const notes=LANES.filter(v=>ex.v[v]&&ex.v[v][pi]&&ex.v[v][pi]!=='.');
  if(!notes.length)return head+`<div>No note here: keep counting through it.</div>`;
  const CH={x:'',X:'accent (>): play it louder',g:'ghost note ( ): very soft',o:'open hi-hat (o): let it ring',r:'cross-stick (circled x): stick across the rim',
    f:'flam: one soft grace note in the other hand just before',d:'drag: two quick soft grace notes just before'};
  const rows=notes.map(v=>{const ch=ex.v[v][pi];const vi=lay.voices.findIndex(vc=>vc.lanes.includes(v));
    const e=vi<0?null:lay.ent[vi][bar].find(q=>!q.rest&&q.start===i);
    const hand=ex.st&&/[RL]/.test(ex.st[pi])&&!NT.feet[v]?(ex.st[pi]==='R'?'right hand':'left hand')+(ch==='f'||ch==='d'?' (main stroke)':''):NT.feet[v]?(v==='K'?'right foot':'left foot'):'';
    return `<div><b style="color:${VOICES[v].c}">${VOICES[v].n}</b> <span class="mut">· ${NT.where[v]}</span>${e?' · '+esc(ntValName(e,mt)):''}${CH[ch]?' · '+CH[ch]:''}${hand?' · '+hand:''}</div>`;}).join('');
  return head+rows;
}
function notaTick(){
  const lay=NOTA.lay,svg=lay&&$('#ntsv svg');const mode=nvMode();
  // status line (Notation-only view: the grid's count-in and bar counter are hidden)
  let st='';
  if(mode==='notation'){
    if(run){const rel=performance.now()-run.base;if(rel<run.cinMs){const c=run.clicks.filter(c=>c.cin&&c.t<=rel).pop();st=c?'Count-in · '+c.n:'Get ready';}
      else{const tb=run.reps*run.ex.bars,bar=Math.min(tb,Math.floor((rel-run.cinMs)/run.barMs)+1);st=(run.ex.meter?run.ex.meter+' · ':'')+'Bar '+bar+' / '+tb;
        if(run.ex.labels){const bl=run.ex.labels[(bar-1)%run.ex.bars];if(bl)st+=' · '+bl;}
        if(ROUTINE.on)st+=' · Routine '+mmss(ROUTINE.endAt-performance.now())+' left';
        if(run.lesson.call)st+=Math.floor((bar-1)/run.ex.bars)%2===0?' · LISTEN':' · YOUR TURN';}}
    else if(L&&L.ex[exI])st=(L.ex[exI].meter?L.ex[exI].meter+' · ':'')+'Tap Start. Count-in: '+state.set.countin+' bar. Tap a note to see what it is.';
  }
  if(st!==NOTA.status){NOTA.status=st;const e=$('#nst');if(e)e.textContent=st;}
  if(!svg)return;
  const ph=svg.querySelector('.nph');
  if(!run||run.ex!==lay.ex){if(NOTA.runRef){NOTA.runRef=null;svg.querySelectorAll('.nh[class*=" "]').forEach(g=>g.setAttribute('class','nh'));NOTA.cls={};
      svg.querySelectorAll('.ncnt.on').forEach(t=>t.classList.remove('on'));NOTA.lastPi=-1;ph.setAttribute('x1',-9);ph.setAttribute('x2',-9);}return;}
  const R=run,plen=lay.plen,patMs=R.barMs*R.ex.bars,now=performance.now(),rel=now-R.base-R.cinMs;
  if(NOTA.runRef!==R){NOTA.runRef=R;NOTA.byRep={};R.evs.forEach(e=>{if(e.listen)return;const r=Math.floor(e.step/plen);(NOTA.byRep[r]=NOTA.byRep[r]||[]).push(e);});NOTA.cls={};}
  if(rel<0||rel>=R.totalMs-R.cinMs){ph.setAttribute('x1',-9);ph.setAttribute('x2',-9);return;}
  const rep=Math.floor(rel/patMs),pos=(rel%patMs)/R.stepMs,pi=Math.min(plen-1,Math.floor(pos)),s=lay.steps[pi],sy=lay.sys[s.sys];
  const x=s.x+(pos-pi-0.5)*lay.stepW;
  ph.setAttribute('x1',x);ph.setAttribute('x2',x);ph.setAttribute('y1',sy.st-30);ph.setAttribute('y2',sy.st+lay.cRow+4);
  if(pi!==NOTA.lastPi){svg.querySelectorAll('.ncnt.on').forEach(t=>t.classList.remove('on'));const t=svg.querySelector(`.ncnt[data-ns="${pi}"]`);if(t)t.classList.add('on');NOTA.lastPi=pi;}
  if(s.sys!==NOTA.lastSys){NOTA.lastSys=s.sys;const n=$('#nota');if(n&&n.scrollHeight>n.clientHeight+4){const z=lay.zoom||1,top=(sy.top-4)*z+$('#ntsv').offsetTop;if(top<n.scrollTop||top+sy.h*z>n.scrollTop+n.clientHeight)n.scrollTo({top,behavior:'smooth'});}}
  // colour the notes of this repeat as they are played: green on time, blue early, amber late, red wrong sound, grey missed
  const want={};const tol=state.set.tol;
  (NOTA.byRep[rep]||[]).forEach(e=>{const k=e.v+':'+(e.step%plen);let c='';
    if(e.hitT!=null)c=e.artOk===false?'bad':Math.abs(e.dt)<=tol?'ok':e.dt<0?'early':'late';else if(now>e.t+(e.win||state.set.win))c='miss';
    if(c)want[k]=c;});
  for(const k in NOTA.cls)if(!want[k]){const g=svg.querySelector(`.nh[data-nk="${k}"]`);if(g)g.setAttribute('class','nh');delete NOTA.cls[k];}
  for(const k in want)if(NOTA.cls[k]!==want[k]){const g=svg.querySelector(`.nh[data-nk="${k}"]`);if(g)g.setAttribute('class','nh '+want[k]);NOTA.cls[k]=want[k];}
}
// grid canvas: tap a note in the preview to select the same step
function notaPickGrid(ev){
  if(run||!preview||L.calib)return;const r=cv.getBoundingClientRect(),px=ev.clientX-r.left,py=ev.clientY-r.top;
  const R=preview,W=cv.clientWidth,H=cv.clientHeight,now=R.base+R.cinMs-R.beatMs*0.6;
  const vs=LANES.filter(v=>R.ex.v[v]),top=34,lh=(H-top-6)/vs.length,hitX=Math.max(110,W*0.17),ppm=(W-hitX)*0.62/Math.max(R.barMs,R.beatMs*3),rad=Math.min(lh*0.32,18);
  let best=null,bd=Math.max(18,rad*1.6);
  R.evs.forEach(e=>{const x=hitX+(e.t-now)*ppm,y=top+vs.indexOf(e.v)*lh+lh/2,d=Math.hypot(px-x,py-y);if(d<bd){bd=d;best=e;}});
  const plen=R.spb*R.ex.bars;
  if(best)notaSelect(NOTA.sel===best.step%plen?null:best.step%plen);else if(NOTA.sel!=null)notaSelect(null);
}
document.addEventListener('click',e=>{
  const nv=e.target.closest('[data-nview]');if(nv){notaSetMode(nv.dataset.nview);return;}
  if(e.target.closest('[data-ntclose]')){notaSelect(null);return;}
  const ns=e.target.closest('#ntsv [data-ns]');if(ns){const pi=+ns.dataset.ns;notaSelect(NOTA.sel===pi?null:pi);return;}
  if(e.target===cv)notaPickGrid(e);
});
addEventListener('resize',()=>{if(L&&!$('#prac').classList.contains('hidden'))notaRender();});

/* ---------- test mode: every exercise must render (Theory T1 validator) ---------- */
function validateNotation(maxLv){
  const out=[];
  LESSONS.filter(l=>l.ex&&l.ex.length&&(maxLv==null||l.lv<=maxLv)).forEach(l=>l.ex.forEach((ex,i)=>{const tag=l.id+' · '+(i+1)+' '+ex.n;
    try{[900,360].forEach(w=>{const lay=ntBuild(ex,w,{});
      if(/NaN|undefined|Infinity/.test(lay.svg))out.push(tag+': bad number in drawing ('+w+'px)');
      const spb=lay.spb;
      lay.ent.forEach((vb,vi)=>vb.forEach((E,b)=>{const mt=lay.mts[b];
        const st=E.reduce((a,e)=>a+e.len,0);if(st!==spb)out.push(`${tag}: bar ${b+1} ${lay.voices[vi].d} voice covers ${st} of ${spb} steps`);
        const wh=E.reduce((a,e)=>a+(e.mrest?mt.num/mt.den:ntWhole(e)),0);if(Math.abs(wh-mt.num/mt.den)>1e-9)out.push(`${tag}: bar ${b+1} ${lay.voices[vi].d} voice adds up to ${wh} not ${mt.ts}`);
        let pos=0;E.forEach(e=>{if(e.start!==pos)out.push(`${tag}: bar ${b+1} gap at step ${pos}`);pos=e.start+e.len;});}));
      const want=[];Object.entries(ex.v).forEach(([v,s])=>{for(let k=0;k<s.length;k++)if(s[k]!=='.')want.push(v+':'+k);});
      const got=new Set(lay.heads);const miss=want.filter(k=>!got.has(k));if(miss.length)out.push(`${tag}: ${miss.length} note(s) not drawn (${miss.slice(0,3).join(', ')})`);
      if(lay.heads.length!==want.length)out.push(`${tag}: ${lay.heads.length} heads for ${want.length} notes`);
      const nc=lay.mts.reduce((a,m)=>a+m.count.length,0);if(nc!==lay.plen)out.push(`${tag}: count line has ${nc} slots for ${lay.plen} steps`);
      if(lay.stepW+1e-9<lay.minW)out.push(`${tag}: steps squeezed (${lay.stepW})`);
    });}catch(err){out.push(tag+': '+err.message);}
  }));
  return out;
}
window.validateNotation=validateNotation;window.ntBuild=ntBuild;
function notationTests(){
  const T=[],ok=(n,c)=>T.push({n,ok:!!c});
  ok('every Level 0–4 exercise draws (296+)',validateNotation(4).length===0);
  const rock=LBY['1.5.03'].ex[0],lay=ntBuild(rock,900);
  ok('rock beat: hands up, feet down',lay.voices.map(v=>v.d).join()==='up,dn');
  ok('rock beat: kick written as quarter notes in a groove',lay.ent[1][0].filter(e=>!e.rest).every(e=>e.den===4));
  ok('drum key: snare 3rd space, kick bottom space, hi-hat above, pedal below',NT.pos.S===3&&NT.pos.K===7&&NT.pos.HH===-1&&NT.pos.HP===9&&NT.pos.R===0&&NT.pos.C===-2);
  ok('count line 1 & 2 &',ntMeter(rock).count.join(' ')==='1 & 2 & 3 & 4 &');
  ok('16ths count 1 e & a',ntMeter(LBY['2.1.04'].ex[0]).count.slice(0,4).join(' ')==='1 e & a');
  ok('triplets count 1 trip let, bracket 3',ntMeter(LBY['3.1.02'].ex[0]).count.slice(0,3).join(' ')==='1 trip let'&&ntMeter(LBY['3.1.02'].ex[0]).tup===3);
  {const m=ntMeters(LBY['4.1.05'].ex[0])[0];ok('12/8 groups of three',m.groups.length===4&&m.ts==='12/8'&&m.G===3);}
  const m68=ntMeters(LBY['4.1.04'].ex[2]);ok('6/8 → 3/4 changes meter in bar 2',m68[0].ts==='6/8'&&m68[1].ts==='3/4');
  const wh=ntBuild(LBY['3.1.01'].ex[0],900);ok('whole note on its own',wh.ent[0][0].length===1&&wh.ent[0][0][0].den===1);
  const sx=ntBuild(LBY['3.1.02'].ex[3],900);ok('even 8ths in a 16th-triplet grid are written as plain 8ths',sx.ent[0][0].every(e=>e.den===8&&!e.tup));
  const ex=ntExplain(rock,2);ok('tap: “on beat 2”, hi-hat + snare, 8th note',/on beat 2/.test(ex)&&/Hi-hat/.test(ex)&&/Snare/.test(ex)&&/8th note/.test(ex));
  const gh=ntExplain(LBY['3.2.07'].ex[0],7);ok('tap: ghost on the “a” of 2',/“a” of 2/.test(gh)&&/ghost/.test(gh));
  return T;
}
window.notationTests=notationTests;
