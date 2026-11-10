/* DrumPath — events, dialogs, backup, boot */
'use strict';
document.addEventListener('click',async e=>{
  const T=e.target;
  const km=T.closest('[data-kitmark]');if(km){kitMark=km.dataset.kitmark;toast('Now: '+kitMark);if(!midi)connectMidi();return;}
  const qz=T.closest('[data-quiz]');if(qz){const id=qz.dataset.quiz,l=LBY[id];const qa=state.done[id+'_qa']=state.done[id+'_qa']||{};qa[qz.dataset.qi]=+qz.dataset.qj;
    if(l.quiz.every((q,i)=>qa[i]===q.c)&&(!l.check||l.check.every((_,i)=>(state.done[id+'_ck']||{})[i]))){state.done[id]=true;toast('Lesson done ✓');}save();render();return;}
  const th=T.closest('[data-themeset]');if(th){try{localStorage.setItem(THEME_KEY,th.dataset.themeset);}catch(_){}applyTheme();render();return;}
  const cr=T.closest('[data-crumb]');if(cr){go('lessons',JSON.parse(cr.dataset.crumb),{keep:true});return;}
  const pc=T.closest('[data-pcrumb]');if(pc){go('progress',JSON.parse(pc.dataset.pcrumb));return;}
  const pm=T.closest('[data-pmode]');if(pm){go('progress',{mode:pm.dataset.pmode},{noPush:true});return;}
  const pp=T.closest('[data-pper]');if(pp){VP.progress.padPer=pp.dataset.pper;render();return;}
  const pt=T.closest('[data-padtrend]');if(pt){openPadTrend(pt.dataset.padtrend);return;}
  const cl=T.closest('[data-cal]');if(cl){const p=VP.progress,k=+cl.dataset.cal;if(!k){const t=new Date();p.calY=t.getFullYear();p.calM=t.getMonth();}else{p.calM+=k;if(p.calM<0){p.calM=11;p.calY--;}if(p.calM>11){p.calM=0;p.calY++;}}render();return;}
  const dy=T.closest('[data-day]');if(dy){const d=pdate(dy.dataset.day);if(cur==='progress'&&VP.progress.mode==='calendar'){VP.progress.day=VP.progress.day===dy.dataset.day?null:dy.dataset.day;render();}else go('progress',{mode:'calendar',calY:d.getFullYear(),calM:d.getMonth(),day:dy.dataset.day});return;}
  const lv=T.closest('[data-lvl]');if(lv){closeSheets();go('lessons',{lv:+lv.dataset.lvl,sd:null,id:null},{keep:true});return;}
  const ce=T.closest('[data-cell]');if(ce){const [a,b]=ce.dataset.cell.split('.').map(Number);go('lessons',{lv:a,sd:b,id:null},{keep:true});return;}
  const pr=T.closest('[data-preset]');if(pr){Object.assign(VP.compare,JSON.parse(pr.dataset.preset));render();return;}
  const rn=T.closest('[data-run]');if(rn){openRun(rn.dataset.run);return;}
  const stt=T.closest('[data-stab]');if(stt){VP.studio.tab=stt.dataset.stab;render();return;}
  const stm=T.closest('[data-smode]');if(stm){VP.studio.mode=stm.dataset.smode;render();return;}
  const sta=T.closest('[data-stapply]');if(sta){await applyResultHere(VP.studio.results[+sta.dataset.stapply]);return;}
  const stc=T.closest('[data-stcopy]');if(stc){const c=await packCode(importPayload([VP.studio.results[+stc.dataset.stcopy]]));try{await navigator.clipboard.writeText(c);toast('Import code copied: Songs › Paste import code in the tablet app');}catch(_){openSheet('Import code',`<textarea rows="6" style="width:100%" readonly>${esc(c)}</textarea>`);}return;}
  const sga=T.closest('[data-sgadd]');if(sga){const g=VP.studio.sug[+sga.dataset.sgadd];Object.assign(VP.studio,{tab:'analyse',mode:'one',req:{title:g.title,artist:g.artist,bpm:g.bpm?Math.round(g.bpm):null}});render();await studioRun();return;}
  const sth=T.closest('[data-sthist]');if(sth){VP.studio.results=[studioHist.get()[+sth.dataset.sthist]];VP.studio.tab='analyse';render();return;}
  const an=T.closest('[data-analyse]');if(an){closeSheets();analyseSheet(an.dataset.analyse);return;}
  const sg=T.closest('[data-song]');if(sg){closeSheets();go('songs',{id:sg.dataset.song});return;}
  const sv=T.closest('[data-sview]');if(sv){VP.songs.view=sv.dataset.sview;render();return;}
  const sst=T.closest('[data-sst]');if(sst){VP.songs.st=VP.songs.st===sst.dataset.sst?'':sst.dataset.sst;render();return;}
  const mg=T.closest('[data-mgroup]');if(mg){VP.songs.mgroup=mg.dataset.mgroup;render();return;}
  const sgr=T.closest('[data-sgrp]');if(sgr){const k=sgr.dataset.sgrp;VP.songs.open[k]=VP.songs.open[k]===false;render();return;}
  const scr=T.closest('[data-scrumb]');if(scr){go('songs',JSON.parse(scr.dataset.scrumb),{keep:true});return;}
  const oc=T.closest('[data-openctx]');if(oc){e.preventDefault();openLesson(oc.dataset.openctx,VP.songs.id);return;}
  const tp=T.closest('[data-tap]');if(tp){tapTempo(tp.dataset.tap);return;}
  const ut=T.closest('[data-untap]');if(ut){delete state.songBpm[ut.dataset.untap];save();updateSongHist();render();return;}
  const rt=T.closest('[data-rate]');if(rt){rt.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===rt));return;}
  const lp=T.closest('[data-logplay]');if(lp){const id=lp.dataset.logplay,mn=Math.max(1,+($('#lgm')||{}).value||4),r=+(($('#lgr .on')||{}).dataset||{}).rate||3;(state.songLog[id]=state.songLog[id]||[]).push([today(),mn,r]);save();render();toast('Play logged');return;}
  const se=T.closest('[data-songedit]');if(se){songForm(se.dataset.songedit||null);return;}
  const sdl=T.closest('[data-songdel]');if(sdl){if(await confirmBox('Delete this song?')){const i=state.songs.findIndex(x=>x.id===sdl.dataset.songdel);if(i>=0)state.songs.splice(i,1);state.songDel[sdl.dataset.songdel]=Date.now();save();VP.songs.id=null;render();}return;}
  const spl=T.closest('[data-splay]');if(spl){const id=spl.dataset.splay,b=+spl.dataset.sbpm,l=LBY[id];closeSheets();openPractice(id);if(b>l.bpm[1]&&canStretch(id)){stretchMode=true;}else{stretchMode=false;}bpm=Math.max(30,Math.min(300,b));$('#bpmv').textContent=bpm;renderPracBar();makePreview();draw();return;}
  const nv=T.closest('[data-nav]');if(nv){const p=nv.dataset.p?JSON.parse(nv.dataset.p):undefined;closeSheets();go(nv.dataset.nav,p);return;}
  const t=T.closest('[data-open],[data-play],[data-act],[data-done],[data-learn],[data-unmap],[data-reset],[data-close]');
  if(!t)return; const d=t.dataset;
  if(d.close!==undefined)closeSheets();
  if(d.open){if(!LBY[d.open])return;closeSheets();openLesson(d.open);return;}
  if(d.play){closeSheets();openPractice(d.play);if(d.ex!=null&&LBY[d.play].ex[+d.ex]){exI=+d.ex;P(L.id).ex=exI;renderPracBar();renderPads(L.ex[exI]);makePreview();draw();}return;}
  if(d.done){state.done[d.done]=!state.done[d.done];save();render();return;}
  if(d.reset){if(await confirmBox('Reset progress for '+d.reset+'?')){delete state.prog[d.reset];save();render();}return;}
  if(d.learn){learnVoice=learnVoice===d.learn?null:d.learn;if(!midi)await connectMidi();if(learnVoice)toast('Hit the '+d.learn.replace(':',' (')+(d.learn.includes(':')?')':'')+' now');render();return;}
  if(d.unmap){Object.keys(state.map).forEach(k=>{if(state.map[k]===d.unmap)delete state.map[k];});save();render();return;}
  const a=d.act;
  if(a==='back'){back();return;}
  if(a==='home'){go('home');return;}
  if(a==='more'){if($('#msheet').classList.contains('hidden'))openMore();else closeMore();return;}
  if(a==='search'){closeMore();openSearch();return;}
  if(a==='theme'){cycleTheme();return;}
  if(a==='ex'){if(run||ROUTINE.on)return;exI=+d.i;P(L.id).ex=exI;renderPracBar();renderPads(L.ex[exI]);makePreview();draw();return;}
  if(a==='stretch'){if(run)return;stretchMode=!stretchMode;const p=P(L.id);bpm=stretchMode?(p.stretchBpm||Math.min(L.bpm[1]+5,stretchMax(L.id)||L.bpm[1]+5)):p.bpm;$('#bpmv').textContent=bpm;renderPracBar();makePreview();draw();return;}
  if(a==='go'){if(run){routineStop();stopRun();}else startRun();return;}
  if(a==='routine'){if(!run)routineStart();return;}
  if(a==='routinestop'){routineStop();if(run)stopRun();return;}
  if(a==='subclick'){if(run)return;state.set.subclick=!state.set.subclick;save();renderPracBar();makePreview();draw();return;}
  if(a==='simulate'){if(run)return;simulate(+$('#simj').value,$('#simm').value);return;}
  if(a==='velcheck'){velCheckStart();return;}
  if(a==='again'){$('#result').classList.add('hidden');startRun();return;}
  if(a==='pexit'){routineStop();stopRun();$('#prac').classList.add('hidden');try{wake&&wake.release();}catch(_){}wake=null;L=null;render();return;}
  if(a==='bpm-'||a==='bpm+'){if(run)return;bpm=Math.max(30,Math.min(300,bpm+(a==='bpm+'?5:-5)));$('#bpmv').textContent=bpm;makePreview();draw();return;}
  if(a==='midi'){connectMidi();return;}
  if(a==='latency'){L={id:'latency',t:'Latency test',calib:true,bpm:[90,90],ex:[X('Snare on the click',1,{S:'x'.repeat(16)},{bars:4})],loop:1};exI=0;bpm=90;
    $('#prac').classList.remove('hidden');$('#result').classList.add('hidden');$('#ptitle').textContent='Latency test: hit the snare exactly on each click';renderPracBar();renderPads(L.ex[0]);sizeCv();makePreview();draw();return;}
  if(a==='lat-'||a==='lat+'){state.lat+=a==='lat+'?5:-5;save();render();return;}
  if(a==='resetmap'){state.map={...DEFAULT_MAP};state.art={...DEFAULT_ART};save();render();return;}
  if(a==='export'){exportData();return;}
  if(a==='drivechip'){if(DS.status==='reconnect'||DS.status==='off')driveConnect();else if(DS.status==='error'||DS.status==='offline')syncNow();else go('settings');return;}
  if(a==='driveconnect'){await driveConnect();render();return;}
  if(a==='drivefolder'){await driveChooseFolder();return;}
  if(a==='sbxon'){setSandbox(true);return;}
  if(a==='sbxoff'){setSandbox(false);return;}
  if(a==='drivesync'){await syncNow({force:true});render();toast(DS.status==='synced'?'Synced with Drive':'Drive: '+(DS.lastErr||DS.status));return;}
  if(a==='drivedisconnect'){if(await confirmBox('Stop syncing this device with Google Drive? Your Drive files and the progress on this device both stay as they are.')){driveDisconnect();render();}return;}
  if(a==='drivetest'){const el=$('#drvtests');el.innerHTML='Running…';const t=await driveTests();el.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='cmptest'){const t=compareTests();render();const el=$('#cmptests');if(el)el.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='batchstudio'){const ut=allSongs().filter(x=>!songHasTags(x));if(isClaudeHost()){VP.studio.mode='batch';VP.studio.tab='analyse';VP.studio.req={batch:ut.map(x=>({songId:x.id,title:x.title,artist:x.artist,bpm:songBpm(x)||null,meter:x.meter||'4/4'}))};go('studio');return;}sendToStudio({batch:allSongs().filter(x=>!songHasTags(x)).map(x=>({songId:x.id,title:x.title,artist:x.artist,bpm:songBpm(x)||null,meter:x.meter||'4/4'}))});return;}
  if(a==='streq'){try{const r=await readRequest($('#st_code').value);VP.studio.req=r;VP.studio.mode=Array.isArray(r.batch)?'batch':'one';VP.studio.results=[];render();toast(Array.isArray(r.batch)?r.batch.length+' songs loaded':'Song loaded from the tablet');}catch(e){toast('That code didn’t open: '+(e.message||e));}return;}
  if(a==='stgo'){await studioRun();return;}
  if(a==='stclear'){Object.assign(VP.studio,{req:null,results:[]});render();return;}
  if(a==='sggo'){await studioSuggest();return;}
  if(a==='stcopyall'){const c=await packCode(importPayload(VP.studio.results.filter(r=>!r.error)));try{await navigator.clipboard.writeText(c);toast('Import code copied: Songs › Paste import code in the tablet app');}catch(_){openSheet('Import code',`<textarea rows="6" style="width:100%" readonly>${esc(c)}</textarea>`);}return;}
  if(a==='sttest'){const el=$('#sttests');el.innerHTML='Running…';const t=await studioTests();render();const e2=$('#sttests');if(e2)e2.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='layouttest'){const r=await layoutSweep();const el=$('#laytests');const bad=r.filter(x=>x[1].length);if(el)el.innerHTML=`<div style="font-size:13px;margin-top:6px"><b>${innerWidth}×${innerHeight}: ${bad.length?bad.length+' screen'+(bad.length>1?'s':'')+' with problems':'all '+r.length+' screens clean ✓'}</b></div>`+r.map(([n,is])=>`<div style="font-size:13px">${is.length?'✗':'✓'} ${esc(n)}${is.length?' <span class="mut">'+is.map(i=>esc(i.kind+' '+i.what)).join(' · ')+'</span>':''}</div>`).join('');return;}
  if(a==='pasteimport'){pasteImportSheet();return;}
  if(a==='antest'){const el=$('#antests');el.innerHTML='Running…';const t=await analyseTests();render();const e2=$('#antests');if(e2)e2.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='persist'){await requestPersist();toast(STORE.persisted?'Chrome will keep your data':'Chrome said not yet: it grants this once the app is used often or added to the home screen');fillStorageCard();return;}
  if(a==='sbxtest'){const el=$('#sbxtests');el.innerHTML='Running…';const t=await sandboxTests();el.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='libtest'){const el=$('#libtests');el.innerHTML='Running…';const t=await libTests();el.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='stortest'){const el=$('#stortests');el.innerHTML='Running…';const t=await storageTests();el.innerHTML=t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('');return;}
  if(a==='kitclear'){kitLog=[];kitLast=0;const el=$('#kitlog');if(el)el.innerHTML=kitLogHtml(40);return;}
  if(a==='kitcopy'){const txt=kitLogText()||'(empty)';try{await navigator.clipboard.writeText(txt);toast('Log copied: paste it to Claude');}catch(_){openSheet('Kit log',`<p class="mut">Select all and copy:</p><textarea rows="12" style="width:100%">${esc(txt)}</textarea>`);}return;}
  if(a==='import'){importData();return;}
  if(a==='wipe'){if(await confirmBox('Erase all progress, sessions and songs? Export a backup first if unsure.')){const m=state.map,ar=state.art,l=state.lat,s=state.set;state=freshState();state.map=m;state.art=ar;state.lat=l;state.set=s;save();render();}return;}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.sf){const k=t.dataset.sf;VP.songs[k]=t.type==='checkbox'?t.checked:t.value;render();return;}
  if(t.dataset.cmp){VP.compare[t.dataset.cmp]=t.value;render();return;}
  if(t.dataset.set){const k=t.dataset.set;let v=t.value;if(['tol','pass','dynPass','bars','countin','win','hhOpenCC','cacheMB'].includes(k))v=+v;else if(k==='vol')v=+v;else if(v==='true'||v==='false')v=v==='true';state.set[k]=v;save();return;}
  if(t.dataset.ck){const id=t.dataset.ck;const ck=state.done[id+'_ck']=state.done[id+'_ck']||{};ck[t.dataset.i]=t.checked;
    const l=LBY[id];if(l.check&&l.check.every((_,i)=>ck[i])&&(!l.quiz||l.quiz.every((q,i)=>(state.done[id+'_qa']||{})[i]===q.c)))state.done[id]=true;save();render();}
});
document.addEventListener('pointerdown',e=>{const p=e.target.closest('[data-pad]');if(p){e.preventDefault();hit(p.dataset.pad,100,performance.now());}});
const KEYS={f:'K',j:'S',k:'HH',d:'HP',u:'T1',i:'T2',l:'T3',o:'C',p:'R'};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;
  if(e.key==='Escape'){if(document.querySelector('.modal')){closeSheets();return;}if(!$('#msheet').classList.contains('hidden')){closeMore();return;}}
  if($('#prac').classList.contains('hidden'))return;
  if(e.code==='Space'){e.preventDefault();if(run){routineStop();stopRun();}else startRun();return;}
  const v=KEYS[e.key];if(v)hit(v,100,performance.now());});
addEventListener('resize',()=>{if(!$('#prac').classList.contains('hidden')){sizeCv();draw();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(run||ROUTINE.on)){routineStop();if(run)stopRun();}});

function confirmBox(msg){return new Promise(res=>{const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="card sheet" style="max-width:480px"><p style="font-size:17px">${esc(msg)}</p><div class="row"><button class="pri" id="cy">Yes</button><button id="cn">Cancel</button></div></div>`;
  document.body.appendChild(m);$('#cy',m).onclick=()=>{m.remove();res(true);};$('#cn',m).onclick=()=>{m.remove();res(false);};});}
async function exportData(){
  if(SANDBOX){toast('Testing mode: nothing to back up — test runs aren’t saved. Export from the tablet app.',4500);return;}
  state.lastBackup=Date.now();save();
  const json=JSON.stringify(state);const name='drumpath-backup-'+today()+'.json';
  const framed=window.self!==window.top;
  if(framed&&isClaudeHost()){try{const dl=await window.claude.use('downloads');if(dl){await dl.save({filename:name,data:new Blob([json],{type:'application/json'})});toast('Backup saved');return;}}catch(_){}}
  if(!framed){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Backup downloaded');return;}
  const m=openSheet('Backup',`<p class="mut">Copy this text and keep it somewhere safe.</p><textarea rows="8" style="width:100%" readonly>${esc(json)}</textarea><div class="row" style="margin-top:10px"><button class="pri" id="bc">Copy</button></div>`);
  $('#bc',m).onclick=async()=>{try{await navigator.clipboard.writeText(json);toast('Copied');}catch(_){$('textarea',m).select();toast('Select all and copy');}};
}
function importData(){
  const m=openSheet('Import backup',`<p class="mut">Choose a backup file or paste its text. This replaces current progress.</p><input type="file" accept=".json,application/json" id="if"><textarea id="it" rows="6" style="width:100%;margin-top:10px" placeholder="…or paste backup text"></textarea><div class="row" style="margin-top:10px"><button class="pri" id="ig">Import</button></div>`);
  $('#if',m).onchange=async ev=>{const f=ev.target.files[0];if(f)$('#it',m).value=await f.text();};
  $('#ig',m).onclick=()=>{try{const d=JSON.parse($('#it',m).value);if(!d.v)throw 0;state=Object.assign(freshState(),d);state.set=Object.assign({...DEF_SET},state.set);state.art=Object.assign({...DEFAULT_ART},state.art||{});songStateFill(state);updateSongHist();save();m.remove();render();toast('Backup restored');}catch(_){toast('That doesn’t look like a DrumPath backup');}};
}
/* ---------- boot ---------- */
buildShell();applyTheme();view.innerHTML='<p class="mut">Loading your logbook…</p>';
sandboxBar();
// name the tablet tab so Studio's 'Send to the tablet app' links can reuse it where the browser allows (best effort; other tabs merge anyway)
if(HOST_PAGES&&!window.name)try{window.name='drumpath-tablet';}catch(_){}
storageInit().catch(e=>{STORE.err=String(e&&e.message||e);}).finally(()=>{bootReady=true;if(bootPending){bootPending=false;save();}render();if(!isClaudeHost())driveStart();checkImportHash();studioHash();setTimeout(studioHash,1500);});
addEventListener('hashchange',()=>{if(bootReady){checkImportHash();studioHash();}});
addEventListener('pagehide',()=>{if(STORE.mode==='idb')storeSave();});
if(navigator.permissions&&navigator.requestMIDIAccess){navigator.permissions.query({name:'midi'}).then(p=>{if(p.state==='granted')connectMidi();}).catch(()=>{});}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(L)draw();});

