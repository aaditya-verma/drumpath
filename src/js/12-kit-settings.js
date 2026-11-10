/* DrumPath — Kit (top-down drawing of this kit, live pad lights, tap-to-learn, kit check, latency, velocity) and Settings */
'use strict';
// layout of the owner's Alesis Nitro: crash, ride, hi-hat + pedal, snare, 3 toms, kick (drummer sits at the bottom)
const KITPOS={C:{x:150,y:88,r:62,cym:1},R:{x:540,y:150,r:70,cym:1},HH:{x:105,y:222,r:50,cym:1},T1:{x:262,y:150,r:40},T2:{x:382,y:150,r:42},
  S:{x:215,y:255,r:46},T3:{x:470,y:282,r:56},K:{x:345,y:352,r:58,kick:1},HP:{x:112,y:372,r:26,ped:1}};
function kitSvg(){
  const byV={};Object.entries(state.map).forEach(([n,v])=>{(byV[v]=byV[v]||[]).push(n);});
  const order=['K','HP','T3','S','T1','T2','HH','C','R'];
  return `<svg class="kitsvg" viewBox="0 0 660 450">${order.map(v=>{const p=KITPOS[v];const notes=(byV[v]||[]).map(n=>n+(state.art[n]&&(v==='HH'||v==='S')?(state.art[n]==='open'?'o':state.art[n]==='rim'?'r':''):'')).join(' ');
    const shape=p.kick?`<rect x="${p.x-p.r*1.25}" y="${p.y-p.r*0.55}" width="${p.r*2.5}" height="${p.r*1.1}" rx="18" fill="color-mix(in srgb,currentColor 22%,var(--surface))" stroke="currentColor" stroke-width="3"/>`
      :p.ped?`<rect x="${p.x-p.r*0.7}" y="${p.y-p.r*1.3}" width="${p.r*1.4}" height="${p.r*2.6}" rx="8" fill="color-mix(in srgb,currentColor 22%,var(--surface))" stroke="currentColor" stroke-width="3"/>`
      :`<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="color-mix(in srgb,currentColor ${p.cym?14:24}%,var(--surface))" stroke="currentColor" stroke-width="${p.cym?2:3}" ${p.cym?'stroke-dasharray="2 5"':''}/>`;
    return `<g class="pad" data-kpad="${v}" style="color:${VOICES[v].c}">${shape}<text x="${p.x}" y="${p.y+(p.ped?p.r*1.3+16:4)}" text-anchor="middle">${VOICES[v].n}</text><text class="nn" x="${p.x}" y="${p.y+(p.ped?p.r*1.3+30:20)}" text-anchor="middle">${notes?'note '+notes:'not mapped'}</text></g>`;}).join('')}</svg>`;
}
let kitRaf=0;
function kitLoop(){kitRaf=0;if(cur!=='kit')return;const now=performance.now();document.querySelectorAll('.kitsvg .pad').forEach(g=>g.classList.toggle('lit',!!flashes[g.dataset.kpad]&&now-flashes[g.dataset.kpad]<160));kitRaf=requestAnimationFrame(kitLoop);}
function padSheet(v){
  const byV=Object.entries(state.map).filter(([,x])=>x===v).map(([n])=>n);
  const opts=v==='HH'?[['HH:closed','Learn closed'],['HH:open','Learn open']]:v==='S'?[['S:head','Learn head'],['S:rim','Learn rim']]:[[v,'Learn']];
  openSheet(VOICES[v].n,`<p class="mut">Mapped notes: ${byV.length?byV.map(n=>'<b class="num">'+n+'</b>'+(state.art[n]?' ('+state.art[n]+')':'')).join(', '):'none'}.</p><p>Tap a Learn button, then hit the pad${v==='HH'?' (closed: pedal down; open: pedal up)':v==='S'?' (head: centre; rim: the rim zone or a cross-stick)':''}. The next note the kit sends is mapped here.</p>
   <div class="row">${opts.map(([k,l])=>`<button class="pri" data-close data-learn="${k}">${l}</button>`).join('')}<button class="ghost" data-close data-unmap="${v}">Clear notes</button></div>`);
}
function renderKit(){
  const byV={};Object.entries(state.map).forEach(([n,v])=>{(byV[v]=byV[v]||[]).push(n);});
  view.innerHTML=`<h1>Kit</h1>
  <div class="card row"><span class="dot ${inputs.length?'ok':''}"></span><div style="flex:1;min-width:200px"><b>${inputs.length?esc(inputs.map(i=>i.name).join(', ')):'Kit not connected'}</b><div class="mut" style="font-size:14px">Plug the Nitro’s USB port into the tablet (USB-B to USB-C cable or adapter), switch the module on, tap Connect and allow MIDI.</div></div><button class="pri" data-act="midi">${inputs.length?'Reconnect':'Connect kit'}</button></div>
  <h2>Your kit</h2><p class="sub">Hit a pad: it lights up. Tap a pad to map (learn) it.${learnVoice?` <b style="color:var(--warn)">Waiting for a hit to learn ${esc(learnVoice)}…</b>`:''}</p>
  <div class="card">${kitSvg()}<div class="mon" id="mon" style="text-align:center">${monitor.length?monitor.map(x=>`${x.v?VOICES[x.v].n:'?'} (note ${x.n}, vel ${x.vel})`).join('  ·  '):'Hit a pad to see it here.'}</div></div>
  <div class="grid2" style="margin-top:12px">
   <div class="card"><h3>Latency</h3><div class="row"><span class="big num">${state.lat}<small class="mut" style="font-size:14px"> ms</small></span><span class="sp"></span><button data-act="lat-">−5</button><button data-act="lat+">+5</button></div><p class="mut" style="font-size:14px">Subtracted from every hit.</p><button class="pri" data-act="latency">Run latency test</button></div>
   <div class="card"><h3>Velocity check</h3><p class="mut" style="font-size:14px">Snare soft, medium and loud, 4× each. If they overlap, raise the snare sensitivity on the module before dynamics lessons.</p>${state.velChk?`<p><b class="num">${state.velChk.s} · ${state.velChk.m} · ${state.velChk.l}</b> ${state.velChk.ok?'<span class="chip ms">well separated</span>':'<span class="chip ip">overlapping</span>'}</p>`:''}<button class="pri" data-act="velcheck">Run velocity check</button></div>
  </div>
  <h2>Pad mapping</h2>
  <div class="list"><table>${LANES.map(v=>`<tr class="${learnVoice&&learnVoice.split(':')[0]===v?'learn':''}"><td><b style="color:${VOICES[v].c}">${VOICES[v].n}</b></td><td class="mut num" style="font-size:13px">${(byV[v]||[]).map(n=>n+(state.art[n]&&(v==='HH'||v==='S')?' ('+state.art[n]+')':'')).join(', ')||'–'}</td><td style="text-align:right">${(v==='HH'?[['HH:closed','Learn closed'],['HH:open','Learn open']]:v==='S'?[['S:head','Learn head'],['S:rim','Learn rim']]:[[v,'Learn']]).map(([k,lab])=>`<button class="sm" data-learn="${k}">${learnVoice===k?'Hit the pad…':lab}</button>`).join(' ')} <button class="sm ghost" data-unmap="${v}">Clear</button></td></tr>`).join('')}</table></div>
  <div class="row" style="margin-top:10px"><button class="sm" data-act="resetmap">Restore default mapping</button></div>
  <h2>Kit check</h2>
  <div class="card"><p class="mut" style="margin-top:0">Every message the kit sends, newest first, with the gap since the one before. Tap a step, play it, then the next step. Then <b>Copy log</b> and paste it to Claude to tune open hi-hat, rim and flam detection.</p>
   <div class="row" style="margin-bottom:8px">${['HH pedal UP: hit hi-hat 4×','HH pedal DOWN: hit hi-hat 4×','HH half open: hit 4×','Press & lift HH pedal slowly','Snare head 4×','Snare rim / cross-stick 4×','Flams on snare 4× (slow)','Drags on snare 4×'].map((m,i)=>`<button class="sm" data-kitmark="${esc(m)}">${i+1}. ${esc(m)}</button>`).join('')}</div>
   <div class="row" style="margin-bottom:8px"><button class="sm pri" data-act="kitcopy">Copy log</button><button class="sm ghost" data-act="kitclear">Clear</button><span class="mut">Hi-hat pedal (CC 4): <b id="hhcc">${hhCC==null?'not seen yet':hhCC}</b></span></div>
   <div id="kitlog" class="pat" style="max-height:320px;overflow:auto;white-space:pre">${kitLogHtml(40)}</div></div>`;
  view.querySelectorAll('[data-kpad]').forEach(g=>g.addEventListener('click',()=>padSheet(g.dataset.kpad)));
  if(!kitRaf)kitRaf=requestAnimationFrame(kitLoop);
}
function renderSettings(){
  const st=state.set,tm=themeMode();
  const sel=(k,opts)=>`<select data-set="${k}">${opts.map(([v,l])=>`<option value="${v}" ${String(st[k])===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
  view.innerHTML=`<h1>Settings</h1>
  <h2>Testing mode</h2>${sandboxCard()}${TEST?'<div class="card" style="margin-top:10px"><button class="sm" data-act="sbxtest">Run testing-mode checks</button><div id="sbxtests"></div></div>':''}
  <h2>Scoring</h2><div class="card grid">
   <div><label class="f">On-time window (± ms)</label><input type="number" data-set="tol" value="${st.tol}"></div>
   <div><label class="f">Match window (± ms)</label><input type="number" data-set="win" value="${st.win}"></div>
   <div><label class="f">Pass: timing (%)</label><input type="number" data-set="pass" value="${st.pass}"></div>
   <div><label class="f">Pass: dynamics (%)</label><input type="number" data-set="dynPass" value="${st.dynPass}"></div>
   <div><label class="f">Check open/closed hi-hat &amp; rim</label>${sel('scoreArt',[['true','Yes'],['false','No']])}</div>
   <div><label class="f">Grace notes (flams, drags)</label>${sel('graceMode',[['scored','Scored'],['lenient','Lenient (main note only)']])}</div></div>
  <h2>Practice screen</h2><div class="card grid">
   <div><label class="f">Bars per run</label>${sel('bars',[[2,'2'],[4,'4'],[8,'8'],[16,'16']])}</div>
   <div><label class="f">Count-in bars</label>${sel('countin',[[1,'1'],[2,'2']])}</div>
   <div><label class="f">Click volume</label><input type="range" min="0" max="1" step="0.05" data-set="vol" value="${st.vol}"></div>
   <div><label class="f">Subdivision clicks</label>${sel('subclick',[['false','Off'],['true','On']])}</div>
   <div><label class="f">On-screen pads</label>${sel('pads',[['true','Show'],['false','Hide']])}</div></div>
  <h2>Hi-hat detection</h2><div class="card grid">
   <div><label class="f">Open hi-hat detected from</label>${sel('hhMode',[['auto','Auto (note, else pedal)'],['note','Note number only'],['pedal','Pedal position (CC 4)']])}</div>
   <div><label class="f">Pedal counts as open when CC 4 is</label>${sel('hhLowOpen',[['true','≤ threshold (low = open)'],['false','> threshold (high = open)']])}</div>
   <div><label class="f">Pedal threshold (0–127)</label><input type="number" data-set="hhOpenCC" value="${st.hhOpenCC}"></div></div>
  <h2>Appearance</h2><div class="card row"><span>Theme</span><div class="seg">${[['system','Device'],['light','Light'],['dark','Dark']].map(([k,l])=>`<button class="${tm===k?'on':''}" data-themeset="${k}">${l}</button>`).join('')}</div></div>
  <h2>Google Drive</h2>${driveCard()}${TEST?'<div class="card" style="margin-top:10px"><button class="sm" data-act="layouttest">Check layout on every screen</button><span class="mut" style="font-size:13px"> (this device, current orientation; rotate and run again)</span><div id="laytests"></div></div>':''}${TEST?'<div class="card" style="margin-top:10px"><button class="sm" data-act="drivetest">Run Drive sync tests</button><div id="drvtests"></div></div>':''}
  <h2>Storage</h2>${storageCard()}${TEST?'<div class="card" style="margin-top:10px"><button class="sm" data-act="stortest">Run storage tests</button><div id="stortests"></div></div>':''}
  <h2>Backup</h2><div class="card row"><button data-act="export">Export backup</button><button data-act="import">Import backup</button><span class="sp"></span><button class="ghost" data-act="wipe" style="color:var(--bad)">Reset all progress</button></div>
  <p class="mut" style="font-size:13px">${cloud?'Progress is saved to your Claude account and on this device.':'Progress is saved on this device'+(driveOn()?' and synced to Google Drive.':' (in this browser). Connect Google Drive above, or export a backup now and then.')+''}</p>`;
  fillStorageCard();
}

/* Testing mode card (02-state.js SANDBOX) */
function sandboxCard(){
  const host=HOST_CLAUDE?'DrumPath on claude.ai':'this tab';
  if(SANDBOX==='test')return `<div class="card"><p style="margin:0 0 6px"><b>On</b> — forced by <code>?test=1</code> in the address.</p><p class="mut" style="margin:0;font-size:14px">Runs, progress, streaks, song tags and settings changed here are kept only until you reload. Nothing is written to this device, Google Drive or your Claude account. Open the app without <code>?test=1</code> to practise for real.</p></div>`;
  if(SANDBOX)return `<div class="card"><p style="margin:0 0 6px"><b>On</b> in ${host}.</p><p class="mut" style="margin:0 0 10px;font-size:14px">Runs, progress, streaks, song tags and settings changed here are kept only until you reload. Nothing is written to this device, Google Drive or your Claude account, so the tablet’s progress is never touched.</p><button data-act="sbxoff">Turn off and save from now on</button></div>`;
  return `<div class="card"><p style="margin:0 0 10px;font-size:14px">${HOST_CLAUDE?'Off: runs here are saved to DrumPath on claude.ai (never to the tablet or Drive).':'Off: runs count towards your progress as normal.'} Turn it on to try features without anything being saved or synced.</p><button data-act="sbxon">Turn on testing mode</button></div>`;
}
function sandboxBar(){if(!SANDBOX||$('#sbxbar'))return;const h=document.querySelector('header.top');if(!h)return;
  h.insertAdjacentHTML('afterend',`<div id="sbxbar" class="sbxbar" role="status"><b>Testing mode</b><span>Runs, progress and changes here aren’t saved or synced.</span><button class="sm" data-nav="settings">${SANDBOX==='test'?'Details':'Turn off'}</button></div>`);}
function setSandbox(on){try{localStorage.setItem(SBX_KEY,on?'1':'0');}catch(_){toast('This browser blocked the setting');return;}location.reload();}
async function sandboxTests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  T('Testing mode is on in this tab',!!SANDBOX,SANDBOX||'off');
  const readRev=async()=>{if(!STORE.db)return null;const {tx,done}=idbTx(STORE.db,['state'],'readonly');const r=await idbReq(tx.objectStore('state').get('main'));await done;return r?{rev:r.rev||0,saved:r.savedAt||0}:null;};
  const ls0=(()=>{try{return localStorage.getItem(KEY);}catch(_){return null;}})(),db0=await readRev();
  const keep=JSON.stringify({prog:state.prog,done:state.done,days:state.days,n:state.sessions.length});
  const id='0.2.01';state.sessions.push({ts:Date.now(),id,bpm:60,score:100,sbx:1});state.prog[id]=Object.assign({},state.prog[id],{bestBpm:999});save();
  const dirty0=typeof DS!=='undefined'?DS.dirty:false;drivePushSoon();
  await new Promise(r=>setTimeout(r,600));
  const db1=await readRev(),ls1=(()=>{try{return localStorage.getItem(KEY);}catch(_){return null;}})();
  T('A run and a progress change are not written to this device',JSON.stringify(db0)===JSON.stringify(db1),db0?('stored rev '+db0.rev+' → '+(db1&&db1.rev)):'no stored copy');
  T('Old browser storage untouched',ls0===ls1,'');
  T('Nothing queued for Google Drive',typeof DS==='undefined'||DS.dirty===dirty0,'');
  T('Nothing sent to the Claude account',!cloud||!saveT,'');
  let threw=false;try{await idbWrite();}catch(_){threw=true;}T('Direct device writes are refused',threw,'');
  const ip=importPayload([{title:'T',artist:'',genre:'Other',bpm:100,bpmSource:'midi',meter:'4/4',feel:'',tags:[]}]);T('Studio import codes are marked as test data',ip.test===1,'');
  // undo the in-memory test change
  const k=JSON.parse(keep);state.sessions=state.sessions.filter(r=>!r.sbx);state.prog=k.prog;
  return out;
}
