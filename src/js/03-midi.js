/* DrumPath — MIDI input, kit check log, velocity check, test mode */
'use strict';
/* ============ MIDI ============ */
let midi=null, inputs=[], learnVoice=null, monitor=[];
async function connectMidi(){
  if(!navigator.requestMIDIAccess){setMidiStatus(false,'MIDI not available here');toast(typeof isClaudeHost==='function'&&isClaudeHost()?'The kit can’t connect inside claude.ai. Practise in the tablet app: aaditya-verma.github.io/drumpath':'This browser/page cannot use MIDI. Open DrumPath in Chrome on the tablet.',6000);return;}
  try{
    midi=await navigator.requestMIDIAccess({sysex:false});
    midi.onstatechange=bindInputs; bindInputs();
  }catch(e){setMidiStatus(false,'MIDI blocked');toast(typeof isClaudeHost==='function'&&isClaudeHost()?'The kit can’t connect inside claude.ai. Practise in the tablet app: aaditya-verma.github.io/drumpath':'MIDI permission was blocked: '+e.message,6000);}
}
function bindInputs(){
  inputs=[];midi.inputs.forEach(i=>{i.onmidimessage=onMidi;inputs.push(i);});
  setMidiStatus(inputs.length>0,inputs.length?inputs.map(i=>i.name).join(', '):'No kit found: check the USB cable');
  if(cur==='kit')render();
}
function setMidiStatus(ok,txt){$('#mdot').classList.toggle('ok',ok);$('#mtxt').textContent=txt;}
let kitLog=[], kitLast=0, hhCC=null, seenOpenNote=false;
function artOf(n,v){
  let a=state.art[n];
  if(v==='HH'){
    if(a==='open')seenOpenNote=true;
    const m=state.set.hhMode;
    if(hhCC!=null&&(m==='pedal'||(m==='auto'&&!seenOpenNote))){const low=hhCC<=state.set.hhOpenCC;a=(low===!!state.set.hhLowOpen)?'open':'closed';}
  }
  return a;
}
function logMidi(st,n,vel,t){
  const typ=st&0xf0; if(typ===0x80||(typ===0x90&&!vel))return; // skip note-offs
  if(typ===0xB0&&n===4)hhCC=vel;
  const gap=kitLast?Math.round(t-kitLast):0; kitLast=t;
  const kind=typ===0x90?'Note':typ===0xB0?'CC':typ===0xA0?'Aftertouch':'0x'+st.toString(16);
  kitLog.unshift({gap,kind,n,vel,v:typ===0x90?state.map[n]:null,mark:kitMark});kitMark='';
  if(kitLog.length>400)kitLog.length=400;
  const el=$('#kitlog');if(el)el.innerHTML=kitLogHtml(40);const hc=$('#hhcc');if(hc&&hhCC!=null)hc.textContent=hhCC;
}
let kitMark='';
function kitLogHtml(k){return kitLog.slice(0,k).map(x=>`${x.mark?`<div style="color:var(--warn);margin-top:6px">— ${esc(x.mark)} —</div>`:''}<div>${String('+'+x.gap+' ms').padStart(9)}  ${x.kind.padEnd(10)} ${String(x.n).padStart(3)}  ${x.kind==='Note'?'vel':'val'} ${String(x.vel).padStart(3)}${x.v?'  '+VOICES[x.v].n:x.kind==='Note'?'  (unmapped)':x.kind==='CC'&&x.n===4?'  hi-hat pedal':''}</div>`).join('')||'<span class="mut">Nothing yet: hit a pad.</span>';}
function kitLogText(){return kitLog.slice().reverse().map(x=>(x.mark?'--- '+x.mark+' ---\n':'')+`+${x.gap}ms ${x.kind} ${x.n} ${x.kind==='Note'?'vel':'val'} ${x.vel}${x.v?' '+VOICES[x.v].n:''}`).join('\n');}
let velChk=null;
function velCheckStart(){
  if(!midi)connectMidi();
  velChk={i:0,v:[]};const m=document.createElement('div');m.className='modal';m.id='velm';
  m.innerHTML=`<div class="card"><h2 style="margin-top:0">Velocity check</h2><p id="velp" style="font-size:22px;font-weight:700"></p><p class="mut" id="velv"></p><div class="row"><button id="velx">Cancel</button></div></div>`;
  document.body.appendChild(m);$('#velx',m).onclick=()=>{velChk=null;m.remove();};velPrompt();
}
function velPrompt(){const i=velChk.i,lv=['SOFT','MEDIUM','LOUD'][Math.floor(i/4)];$('#velp').textContent=`Hit the snare ${lv} (${i%4+1} of 4)`;$('#velv').textContent=velChk.v.length?'Last: '+velChk.v[velChk.v.length-1]:'';}
function velHit(vel){velChk.v.push(vel);velChk.i++;
  if(velChk.i<12){velPrompt();return;}
  const g=k=>velChk.v.slice(k*4,k*4+4), avg=a=>Math.round(a.reduce((x,y)=>x+y,0)/a.length);
  const S=g(0),M=g(1),Lo=g(2);const ok=Math.max(...S)<Math.min(...M)&&Math.max(...M)<Math.min(...Lo);
  state.velChk={s:avg(S),m:avg(M),l:avg(Lo),ok,ts:Date.now()};save();
  $('#velp').textContent=`Soft ${avg(S)} · Medium ${avg(M)} · Loud ${avg(Lo)}`;
  $('#velv').innerHTML=ok?'✓ The three levels are clearly apart: dynamics lessons will work well.':'⚠ The levels overlap (soft '+Math.min(...S)+'–'+Math.max(...S)+', medium '+Math.min(...M)+'–'+Math.max(...M)+', loud '+Math.min(...Lo)+'–'+Math.max(...Lo)+'). Raise the snare sensitivity on the module (Utility → trigger settings), then run this again.';
  $('#velx').textContent='Close';velChk=null;if(cur==='kit')render();
}
function onMidi(e){
  const [st,n,vel]=e.data;
  const t=e.timeStamp||performance.now();
  logMidi(st,n,vel,t);
  if((st&0xf0)!==0x90||!vel)return;
  const v=state.map[n];
  monitor.unshift({n,vel,v});monitor=monitor.slice(0,8);
  const m=$('#mon');if(m)m.textContent=monitor.map(x=>`${x.v?VOICES[x.v].n:'?'} (note ${x.n}, vel ${x.vel})`).join('  ·  ');
  if(learnVoice){
    const [lv,la]=learnVoice.split(':');
    Object.keys(state.map).forEach(k=>{if(+k===n)delete state.map[k];});
    state.map[n]=lv; if(la)state.art[n]=la; else delete state.art[n];
    save(); toast(VOICES[lv].n+(la?' ('+la+')':'')+' ← note '+n); learnVoice=null; render(); return;
  }
  if(velChk&&v==='S'){velHit(vel);return;}
  if(v)hit(v,vel,t,artOf(n,v));
}

/* ============ TEST MODE ============ */
const TEST=/[?&]test=1\b/.test(location.search);
function simVel(e,mode,even){
  if(even)return mode==='dyn'?(e.step%2?50:95):80;
  if(mode==='dyn')return e.ch==='X'?80:e.ch==='g'?82:80;
  if(e.gr)return 90;
  return e.ch==='X'?112:e.ch==='g'?34:80;
}
async function simulate(jit,mode){
  await startRun();const R=run;const even=R.ex.dyn==='even';
  R.evs.forEach(e=>{if(e.listen)return;
    const j=jit?(Math.random()*2-1)*jit:0, tt=e.t+j+state.lat;
    if(e.gr&&mode!=='nograce')for(let k=e.gr;k>=1;k--){const gt=tt-30*k;setTimeout(()=>{if(run===R)hit(e.v,mode==='dyn'?95:45,gt,e.art);},Math.max(0,gt-performance.now()));}
    setTimeout(()=>{if(run===R)hit(e.v,simVel(e,mode,even),tt,e.art?(mode==='art'?(e.art==='open'?'closed':e.art==='closed'?'open':e.art==='rim'?'head':'rim'):e.art):undefined);},Math.max(0,tt-performance.now()));
  });
}
function validateLessons(){
  const out=[];
  LESSONS.filter(l=>l.type==='play').forEach(l=>l.ex.forEach((ex,i)=>{
    const spb=ex.steps||4*ex.sub, n=spb*ex.bars, tag=l.id+' · '+(i+1)+' '+ex.n;
    Object.entries(ex.v).forEach(([v,str])=>{if(!LANES.includes(v))out.push(tag+': unknown lane '+v);if(str.length!==n)out.push(`${tag}: ${v} has ${str.length} steps, needs ${n}`);if(/[^.xXgorfd]/.test(str))out.push(tag+': odd char in '+v);});
    if(ex.st&&ex.st.length!==n)out.push(`${tag}: sticking has ${ex.st.length}, pattern ${n}`);
    if(ex.clicks&&ex.clicks.some(c=>c>=spb))out.push(tag+': click step beyond bar');
  }));
  return out;
}
window.validateLessons=validateLessons;

