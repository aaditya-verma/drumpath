/* DrumPath — storage S3: Google Drive as the library for big files (build/storage-plan.md §S3, D-024).
   Index  = state.lib {fileId: entry} (+ state.libDel tombstones); synced with the Drive backup like everything else.
   Cache  = IndexedDB `files` store: 'drv:<fileId>' → {bytes,…}; 'cache:index' → {fileId:{size,lastUsed,cachedAt}}
            (per device, never synced). Least-recently-used files are dropped past the limit (Settings › Storage,
            default 500 MB); pinned files never are. File contents live only in Drive and on the device, never in the repo.
   Testing mode (D-022): the library is read-only — nothing is added, linked, pinned or cached; a file that is already
   on the tablet still opens, and one that isn't is read from Drive without being stored. */
'use strict';
const LIB={test:false,offline:null};                 // test hooks: allow writes under ?test=1 · force offline
const LIB_IX='cache:index',LIB_KEY=id=>'drv:'+id;
const libRO=()=>SANDBOX&&!LIB.test;
const libOnline=()=>LIB.offline!=null?!LIB.offline:navigator.onLine!==false;
const libLimit=()=>libLimitOverride||Math.max(50,+state.set.cacheMB||500)*1e6;
const libAll=()=>Object.values(state.lib||{}).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
const libForSong=sid=>libAll().filter(e=>(e.songs||[]).includes(sid));
const mbTxt=b=>!b?'0 MB':b>=1e9?(b/1e9).toFixed(1)+' GB':b>=1e6?(b/1e6).toFixed(1).replace(/\.0$/,'')+' MB':Math.max(1,Math.round(b/1e3))+' KB';
function libKind(name,mime){const n=String(name||'').toLowerCase(),m=String(mime||'');
  if(/\.(mid|midi|kar)$/.test(n)||/midi/.test(m))return 'midi';
  if(/^audio\//.test(m)||/\.(mp3|wav|m4a|aac|ogg|oga|flac|opus)$/.test(n))return 'audio';
  return 'doc';}
const KIND_TXT={midi:'MIDI',audio:'Audio',doc:'Document'};
function libRefuse(){toast('Testing mode: the library is read-only here. Use the tablet app without ?test=1 to add or change files.',4500);}

/* ---------- index (state) ---------- */
function libTouch(e){e.updatedAt=Date.now();state.lib[e.id]=e;}
// guess the song a file belongs to from its name: exactly one song whose title is in the file name
function libGuessSong(name){const n=' '+normT(String(name).replace(/\.[a-z0-9]+$/i,''))+' ';
  const hits=allSongs().filter(s=>{const t=normT(s.title);return t.length>=4&&n.includes(' '+t+' ');});return hits.length===1?hits[0].id:null;}
function libAdd(docs,songId){
  if(libRO()){libRefuse();return [];}
  const added=[];
  docs.forEach(d=>{const id=d.id;if(!id)return;const old=state.lib[id];
    const e=old?Object.assign({},old):{id,name:d.name||'file',size:+(d.sizeBytes||d.size)||0,mime:d.mimeType||'',kind:libKind(d.name,d.mimeType),songs:[],lessons:[],tags:[],pinned:false,addedAt:Date.now()};
    if(d.name)e.name=d.name;if(d.sizeBytes||d.size)e.size=+(d.sizeBytes||d.size);
    const sid=songId||(!old&&libGuessSong(e.name));if(sid&&!e.songs.includes(sid))e.songs=[...e.songs,sid];
    delete state.libDel[id];libTouch(e);added.push(e);});
  if(added.length)save();
  return added;
}
function libLink(id,sid){if(libRO())return libRefuse();const e=state.lib[id];if(!e||!sid||e.songs.includes(sid))return;libTouch(Object.assign({},e,{songs:[...e.songs,sid]}));save();}
function libUnlink(id,sid){if(libRO())return libRefuse();const e=state.lib[id];if(!e)return;libTouch(Object.assign({},e,{songs:e.songs.filter(x=>x!==sid)}));save();}
async function libPin(id,on){if(libRO())return libRefuse();const e=state.lib[id];if(!e)return;libTouch(Object.assign({},e,{pinned:!!on}));save();
  if(on&&libOnline()){try{await libOpen(id);}catch(_){}}else if(!on){await libEvict();}}
async function libRemove(id){if(libRO())return libRefuse();if(!state.lib[id])return;delete state.lib[id];state.libDel[id]=Date.now();save();await cacheDrop(id);}

/* ---------- cache (IndexedDB `files`) ---------- */
async function filesTx(mode,fn){if(!STORE.db)throw new Error('Storage isn’t ready');const {tx,done}=idbTx(STORE.db,['files'],mode);const r=fn(tx.objectStore('files'));const v=r?await idbReq(r):undefined;await done;return v;}
const cacheIndex=async()=>{try{return (await filesTx('readonly',s=>s.get(LIB_IX)))||{};}catch(_){return {};}};
const cacheIndexPut=ix=>filesTx('readwrite',s=>s.put(ix,LIB_IX));
async function cacheDrop(id){const ix=await cacheIndex();if(!ix[id])return;delete ix[id];await filesTx('readwrite',s=>s.delete(LIB_KEY(id)));await cacheIndexPut(ix);}
async function cacheInfo(){const ix=await cacheIndex();const ids=Object.keys(ix);const used=ids.reduce((a,k)=>a+(ix[k].size||0),0);
  return {ix,files:ids.length,used,limit:libLimit(),pinned:ids.filter(k=>state.lib[k]&&state.lib[k].pinned).length,pinnedBytes:ids.filter(k=>state.lib[k]&&state.lib[k].pinned).reduce((a,k)=>a+(ix[k].size||0),0)};}
// drop least-recently-used, unpinned files until the cache fits; never the file in use (keep)
async function libEvict(keep){
  if(libRO())return [];const ix=await cacheIndex(),limit=libLimit();let used=Object.values(ix).reduce((a,x)=>a+(x.size||0),0);const gone=[];
  const cand=Object.keys(ix).filter(k=>k!==keep&&!(state.lib[k]&&state.lib[k].pinned)).sort((a,b)=>(ix[a].lastUsed||0)-(ix[b].lastUsed||0));
  for(const k of cand){if(used<=limit)break;used-=ix[k].size||0;delete ix[k];gone.push(k);await filesTx('readwrite',s=>s.delete(LIB_KEY(k)));}
  // files removed from the library on another device: drop their cached copies too
  Object.keys(ix).forEach(k=>{if(!state.lib[k]){delete ix[k];gone.push(k);filesTx('readwrite',s=>s.delete(LIB_KEY(k))).catch(()=>{});}});
  await cacheIndexPut(ix);return gone;
}
// open a library file: from this tablet if cached, else from Drive (then cached unless testing mode or too big)
async function libOpen(id){
  const e=state.lib[id];if(!e)throw new Error('That file isn’t in the library');
  const ix=await cacheIndex();
  if(ix[id]){const r=await filesTx('readonly',s=>s.get(LIB_KEY(id))).catch(()=>null);
    if(r&&r.bytes){if(!libRO()){ix[id].lastUsed=Date.now();await cacheIndexPut(ix);}return {bytes:r.bytes,cached:true,from:'tablet'};}}
  if(!libOnline())throw new Error('You’re offline and “'+e.name+'” isn’t on this tablet yet. Open it once while online, or pin it.');
  if(!driveOn()&&!LIB.test)throw new Error('Connect Google Drive in Settings first.');
  const bytes=await Drive.readBytes(id);
  if(libRO())return {bytes,cached:false,from:'drive'};
  const size=bytes.byteLength,limit=libLimit();
  if(size>limit&&!e.pinned)return {bytes,cached:false,from:'drive',tooBig:true};
  await filesTx('readwrite',s=>s.put({id,name:e.name,mime:e.mime,size,bytes,cachedAt:Date.now()},LIB_KEY(id)));
  const ix2=await cacheIndex();ix2[id]={size,lastUsed:Date.now(),cachedAt:Date.now()};await cacheIndexPut(ix2);
  if(e.size!==size){libTouch(Object.assign({},e,{size}));save();}
  await libEvict(id);
  return {bytes,cached:true,from:'drive'};
}

/* ---------- Google Picker: Add from Drive (multi-select; picking a file grants drive.file access to it) ---------- */
async function libPick(){
  const tok=await getToken(true);DRV.granted=true;drvSaveCfg();await pickerReady();
  try{await ensureLayout();}catch(_){}
  const mk=(parent,label)=>{const v=new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(false);if(parent)v.setParent(parent);if(v.setLabel&&label)v.setLabel(label);return v;};
  const pb=new google.picker.PickerBuilder().enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .addView(mk(DRV.midiId,'midi')).addView(mk(DRV.songsId,'songs')).addView(mk(DRV.folderId,'DrumPath')).addView(mk(null,'My Drive'))
    .setOAuthToken(tok).setDeveloperKey(GCP.apiKey).setAppId(GCP.appId).setTitle('Add files to the DrumPath library');
  return new Promise(res=>{pb.setCallback(d=>{if(d.action===google.picker.Action.PICKED)res(d.docs||[]);else if(d.action===google.picker.Action.CANCEL)res([]);});pb.build().setVisible(true);});
}
async function libAddFromDrive(songId){
  if(libRO())return libRefuse();
  if(!driveOn()){toast('Connect Google Drive in Settings first');go('settings');return;}
  let docs;try{docs=await libPick();}catch(e){toast('Drive: '+e.message);return;}
  const files=docs.filter(d=>d.type!=='folder'&&d.mimeType!==FOLDER_MIME);if(!files.length)return;
  const added=libAdd(files,songId);
  toast('Added '+added.length+' file'+(added.length===1?'':'s')+' to the library'+(songId?' and linked to this song':''));render();
}

/* ---------- analyse a library MIDI file into a song (Analyse & tag › From a MIDI file) ---------- */
function songTitleFromFile(name){let b=String(name||'').replace(/\.[a-z0-9]+$/i,'').trim();let artist='';
  const m=b.match(/^(.+?)\s+[-–]\s+(.+)$/);if(m){artist=m[1].trim();b=m[2];}
  b=b.replace(/[_]+/g,' ').replace(/(\w)-(?=\w)/g,'$1 ').replace(/\s+\d{1,2}$/,'').replace(/\s+/g,' ').trim();
  return {title:b||'Untitled',artist};}
function newSongFromFile(name){const {title,artist}=songTitleFromFile(name);
  const u={id:'u'+Date.now().toString(36),catId:'',title,artist,genre:'Other',bpm:'',bpmSure:false,meter:'4/4',link:'',notes:'',core:[],support:[],tags:[],updatedAt:Date.now()};
  state.songs.push(u);return u.id;}
async function libAnalyse(fileId,songId,statusEl){
  const e=state.lib[fileId];if(!e)return;const say=t=>{if(statusEl)statusEl.textContent=t;else if(t)toast(t);};
  let created=null;
  if(!songId){if(libRO())return libRefuse();songId=created=newSongFromFile(e.name);}
  const s=songById(songId);if(!s)return;
  try{say('Opening “'+e.name+'”…');const r=await libOpen(fileId);say('Analysing…');
    const a=MidiAnalyse.analyse(new Uint8Array(r.bytes),{lessons:LESSONS.filter(l=>l.ex),title:s.title});
    if(!libRO()&&!e.songs.includes(songId))libLink(fileId,songId);
    closeSheets();const res=await reviewSheet(songId,fromAnalysis(a,'midi',{file:e.name,source:'Drive library'}));
    if(res!=='applied'&&created){const k=state.songs.findIndex(y=>y.id===created);if(k>=0)state.songs.splice(k,1);libUnlink(fileId,created);}
    else if(res==='applied'&&created)go('songs',{id:created},{keep:true});
  }catch(err){if(created){const k=state.songs.findIndex(y=>y.id===created);if(k>=0)state.songs.splice(k,1);}say('');toast(err.message||String(err),5000);}
}
// open audio / documents in the browser from the cached copy
async function libView(id){const e=state.lib[id];if(!e)return;
  try{const r=await libOpen(id);const url=URL.createObjectURL(new Blob([r.bytes],{type:e.mime||'application/octet-stream'}));
    if(e.kind==='audio')openSheet(e.name,`<audio controls autoplay src="${url}" style="width:100%"></audio><p class="mut" style="font-size:13px">${r.from==='tablet'?'Playing from this tablet (works offline).':'Downloaded from Drive'+(r.cached?' and kept on this tablet.':'.')}</p>`);
    else window.open(url,'_blank');
    fillLibStatus();}
  catch(err){toast(err.message||String(err),5000);}}
function libOpenAct(id,sid){const e=state.lib[id];if(!e)return;
  if(e.kind!=='midi')return libView(id);
  const linked=(e.songs||[]).map(songById).filter(Boolean);
  if(sid||linked.length===1)return libAnalyse(id,sid||linked[0].id);
  // choose a song (or make one from the file name)
  const opts=allSongs().slice().sort((a,b)=>a.title.localeCompare(b.title));const guess=songTitleFromFile(e.name);
  const m=openSheet('Analyse “'+e.name+'”',`<p class="mut" style="margin-top:0">Which song is this file for?</p>
    <select id="la_s" style="width:100%"><option value="">New song: ${esc(guess.title)}${guess.artist?' — '+esc(guess.artist):''}</option>${(linked.length?linked:opts).map(s=>`<option value="${esc(s.id)}">${esc(s.title)}${s.artist?' — '+esc(s.artist):''}</option>`).join('')}</select>
    <div class="row" style="margin-top:12px"><button class="pri" id="la_go">Analyse</button><span class="mut" id="la_msg" style="font-size:13px"></span></div>`);
  $('#la_go',m).onclick=()=>libAnalyse(id,$('#la_s',m).value||null,$('#la_msg',m));
}

/* ---------- screens ---------- */
function libRow(e,ctxSong){
  const songs=(e.songs||[]).map(songById).filter(Boolean);
  return `<div class="card libfile" style="margin-top:10px"><div class="row" style="align-items:flex-start;flex-wrap:nowrap;gap:10px">
    <div style="flex:1;min-width:0"><div style="font-weight:700;overflow-wrap:anywhere">${esc(e.name)}</div>
     <div class="mut" style="font-size:13px">${KIND_TXT[e.kind]||'File'} · ${e.size?mbTxt(e.size):'size unknown'} · <span data-libst="${esc(e.id)}">…</span>${e.pinned?' · <b style="color:var(--accent)">pinned</b>':''}</div>
     ${ctxSong?'':`<div class="row" style="gap:6px;margin-top:6px">${songs.map(s=>`<span class="chip"><a href="#" data-libsong="${esc(s.id)}">${esc(s.title)}</a> <a href="#" title="Unlink" data-libact="unlink" data-id="${esc(e.id)}" data-sid="${esc(s.id)}" style="margin-left:4px">×</a></span>`).join('')}
       <select class="sm" data-liblink="${esc(e.id)}" style="max-width:220px"><option value="">${songs.length?'Link another song…':'Link to a song…'}</option>${allSongs().filter(s=>!e.songs.includes(s.id)).sort((a,b)=>a.title.localeCompare(b.title)).map(s=>`<option value="${esc(s.id)}">${esc(s.title)}</option>`).join('')}</select></div>`}</div></div>
   <div class="row" style="gap:8px;margin-top:8px">
    <button class="sm pri" data-libact="open" data-id="${esc(e.id)}"${ctxSong?` data-sid="${esc(ctxSong)}"`:''}>${e.kind==='midi'?'Analyse & tag':e.kind==='audio'?'Play':'Open'}</button>
    <button class="sm" data-libact="${e.pinned?'unpin':'pin'}" data-id="${esc(e.id)}" title="Pinned files stay on this tablet for offline use">${e.pinned?'Unpin':'Pin for offline'}</button>
    ${ctxSong?`<button class="sm ghost" data-libact="unlink" data-id="${esc(e.id)}" data-sid="${esc(ctxSong)}">Unlink</button>`:`<span class="sp"></span><button class="sm ghost" data-libact="remove" data-id="${esc(e.id)}" style="color:var(--bad)">Remove</button>`}</div></div>`;
}
async function fillLibStatus(){const els=document.querySelectorAll('[data-libst]');if(!els.length&&!$('#libuse'))return;const c=await cacheInfo();
  els.forEach(el=>{el.textContent=c.ix[el.dataset.libst]?'on this tablet':'in Drive';});
  const u=$('#libuse');if(u)u.innerHTML=`On this tablet: <b>${mbTxt(c.used)}</b> of ${mbTxt(c.limit)} · ${c.files} file${c.files===1?'':'s'}${c.pinned?' · '+c.pinned+' pinned':''}${c.pinnedBytes>c.limit?' <span style="color:var(--warn)">(pinned files are over the limit)</span>':''}`;}
function renderLibrary(){
  const intro=`<h1>Library</h1><p class="sub">MIDI files, audio and documents from your Google Drive folder. A file downloads the first time you open it and then stays on this tablet, so it works offline.</p>`;
  if(isClaudeHost()){view.innerHTML=intro+`<div class="card"><p style="margin:0">The Library lives in the <a href="${TABLET_URL}" target="_blank" rel="noopener">tablet app</a>: it reads your files from Google Drive, which this claude.ai copy can’t reach. To analyse a MIDI file here, use <a href="#" data-nav="studio">Studio</a> › Analyse & add.</p></div>`;return;}
  const k=VP.library.kind,all=libAll(),list=all.filter(e=>k==='all'||e.kind===k);
  view.innerHTML=intro+
   (libRO()?`<div class="card" style="margin-bottom:10px"><p style="margin:0">Testing mode: the library is read-only on this tab — files already on this tablet open, nothing is added, pinned or stored.</p></div>`:'')+
   (!driveOn()?`<div class="card"><p style="margin-top:0">Connect Google Drive first (Settings › Google Drive), then add files from your DrumPath folder.</p><button class="pri" data-nav="settings">Open Settings</button></div>`:
   `<div class="row" style="align-items:center;gap:10px"><button class="pri" data-libact="add"${libRO()?' disabled':''}>Add from Drive</button>
     <div class="seg">${[['all','All'],['midi','MIDI'],['audio','Audio'],['doc','Docs']].map(([v,l])=>`<button class="${k===v?'on':''}" data-libkind="${v}">${l} ${v==='all'?all.length:all.filter(e=>e.kind===v).length}</button>`).join('')}</div></div>
    <p class="mut" id="libuse" style="font-size:14px;margin:10px 0 0">Checking this tablet…</p>
    ${list.length?list.map(e=>libRow(e)).join(''):`<div class="card" style="margin-top:12px"><p style="margin:0">${all.length?'No files of this kind.':'No files yet. Put MIDI files in <b>DrumPath › midi</b> and audio or documents in <b>DrumPath › songs</b> on Drive, then tap <b>Add from Drive</b> and pick them.'}</p></div>`}`);
  fillLibStatus();
}
// song page: files linked to this song
function libSongCard(song){
  if(isClaudeHost())return '';const fs=libForSong(song.id);
  if(!fs.length&&!driveOn())return '';
  return `<h2>Files</h2>${fs.map(e=>libRow(e,song.id)).join('')}
   <div class="row" style="margin-top:10px">${driveOn()?`<button class="sm" data-libact="add" data-sid="${esc(song.id)}">Add from Drive</button>`:''}${fs.length>1?`<button class="sm" data-libact="pinsong" data-sid="${esc(song.id)}">Pin all for offline</button>`:''}<a href="#" data-nav="library" style="font-size:14px">Library</a></div>`;
}
// Analyse & tag › From a MIDI file: library picker block
function libMidiPicker(song){
  if(isClaudeHost())return '';const mids=libAll().filter(e=>e.kind==='midi');
  if(!mids.length&&!driveOn())return '';
  const mine=mids.filter(e=>e.songs.includes(song.id)),rest=mids.filter(e=>!e.songs.includes(song.id));
  return `<div style="margin-bottom:12px"><label class="f">From your Drive library</label>${mids.length?`<div class="row" style="flex-wrap:nowrap;gap:8px"><select id="an_lib" style="flex:1;min-width:0">${[...mine,...rest].map(e=>`<option value="${esc(e.id)}">${esc(e.name)}${mine.includes(e)?' (this song)':''}</option>`).join('')}</select><button class="sm pri" id="an_libgo">Analyse</button></div>`:''}
    ${driveOn()?`<div style="margin-top:6px"><a href="#" data-libact="add" data-sid="${esc(song.id)}" style="font-size:14px">Add from Drive…</a></div>`:''}</div>`;
}
// Settings › Storage: cache limit
function libCacheCard(){if(isClaudeHost())return '';const v=+state.set.cacheMB||500;
  return `<div class="card" style="margin-top:10px"><div class="row" style="align-items:center"><div style="flex:1;min-width:12em"><b>Library files on this tablet</b><div class="mut" id="libuse" style="font-size:14px">Checking…</div></div>
   <div><label class="f">Keep up to</label><select data-set="cacheMB">${[250,500,1000,2000].map(n=>`<option value="${n}" ${n===v?'selected':''}>${n>=1000?n/1000+' GB':n+' MB'}</option>`).join('')}</select></div></div>
   <p class="mut" style="font-size:13px;margin-bottom:0">Past the limit, the files you opened longest ago are removed from this tablet (they stay in Drive). Pinned files are always kept.</p></div>`;}

/* ---------- events ---------- */
document.addEventListener('click',async ev=>{const t=ev.target.closest('[data-libact],[data-libkind],[data-libsong]');if(!t)return;ev.preventDefault();
  if(t.dataset.libkind){VP.library.kind=t.dataset.libkind;render();return;}
  if(t.dataset.libsong){go('songs',{id:t.dataset.libsong});return;}
  const a=t.dataset.libact,id=t.dataset.id,sid=t.dataset.sid;
  if(a==='add'){closeSheets();await libAddFromDrive(sid||null);return;}
  if(a==='open'){libOpenAct(id,sid);return;}
  if(a==='pin'||a==='unpin'){await libPin(id,a==='pin');render();toast(a==='pin'?'Pinned: kept on this tablet for offline use':'Unpinned');return;}
  if(a==='pinsong'){if(libRO())return libRefuse();for(const e of libForSong(sid))await libPin(e.id,true);render();toast('Pinned this song’s files for offline use');return;}
  if(a==='unlink'){libUnlink(id,sid);render();return;}
  if(a==='remove'){const e=state.lib[id];if(!e)return;const m=openSheet('Remove from the library?',`<p>“${esc(e.name)}” will be removed from the DrumPath library and from this tablet. The file stays in your Google Drive.</p><div class="row"><button class="pri" id="lr_go" style="background:var(--bad)">Remove</button><button id="lr_no">Cancel</button></div>`);
    $('#lr_no',m).onclick=closeSheets;$('#lr_go',m).onclick=async()=>{closeSheets();await libRemove(id);render();};return;}
});
document.addEventListener('change',ev=>{const t=ev.target;if(t.dataset&&t.dataset.liblink!=null&&t.value){libLink(t.dataset.liblink,t.value);render();}});
// Drive sync may bring index changes from the other device: tidy the cache afterwards
addEventListener('drumpath:synced',()=>{libEvict().catch(()=>{});});

/* ---------- tests (mock Drive + throwaway IndexedDB; real data untouched) ---------- */
async function libTests(){
  const out=[],T=(n,ok,d)=>out.push({name:n,pass:!!ok,det:d||''});
  const NAME='drumpath-libtest-'+Date.now();
  const keep={state:JSON.stringify(state),db:STORE.db,drive:Drive,save:window.save,cache:state.set.cacheMB,drv:JSON.stringify(DRV)};
  const db=await new Promise((res,rej)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{['state','runs','files'].forEach(s=>r.result.createObjectStore(s));};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
  // a small real MIDI file (8-bar rock beat) so the analyser runs end to end
  const midi=MidiAnalyse.writeSMF([...Array.from({length:64},(_,i)=>({q:i/2,note:42,vel:80})),...Array.from({length:32},(_,j)=>({q:j,note:j%2?38:36,vel:100}))],{bpm:100}).buffer;
  const blob=(n,fill)=>{const b=new Uint8Array(n);b.fill(fill);return b.buffer;};
  const files={m1:{name:'Test Groove.mid',bytes:midi},a1:{name:'big-a.mp3',bytes:blob(600e3,2)},a2:{name:'big-b.mp3',bytes:blob(600e3,3)},a3:{name:'big-c.mp3',bytes:blob(600e3,4)},a4:{name:'huge.wav',bytes:blob(3e6,5)}};
  let reads=0;
  try{
    STORE.db=db;LIB.test=true;window.save=()=>{};state=normaliseState(JSON.parse(keep.state));state.lib={};state.libDel={};
    Drive=Object.assign({},mockDrive(),{readBytes:async id=>{reads++;if(LIB.offline)throw new Error('Failed to fetch');if(!files[id])throw new Error('Drive: 404');return files[id].bytes.slice(0);}});
    // 1 index
    const sid=allSongs()[0].id;
    libAdd([{id:'m1',name:'Test Groove.mid',mimeType:'audio/midi',sizeBytes:400},{id:'a1',name:'big-a.mp3',mimeType:'audio/mpeg',sizeBytes:600e3}],sid);
    T('Add from Drive: picked files go into the index',state.lib.m1&&state.lib.a1&&state.lib.m1.kind==='midi'&&state.lib.a1.kind==='audio'&&state.lib.m1.songs[0]===sid,Object.keys(state.lib).join(','));
    libUnlink('m1',sid);const ok1=!state.lib.m1.songs.length;libLink('m1',sid);T('Link and unlink a song',ok1&&state.lib.m1.songs.length===1,'');
    const saved=JSON.parse(JSON.stringify(state));const fresh=normaliseState(Object.assign({},saved,{lib:undefined,libDel:undefined}));
    T('Old saves without a library still load',fresh.lib&&typeof fresh.lib==='object'&&fresh.sessions.length===saved.sessions.length,'');
    // 2 open + offline
    const r1=await libOpen('m1');const r2=await libOpen('m1');
    T('A MIDI file opens and is kept on the tablet',r1.from==='drive'&&r1.cached&&r2.from==='tablet'&&reads===1,'reads from Drive: '+reads);
    let anaOk=false,ana='';try{const a=MidiAnalyse.analyse(new Uint8Array(r2.bytes),{lessons:LESSONS.filter(l=>l.ex),title:'Test'});anaOk=a.features&&a.features.bpm>0;ana='≈'+Math.round(a.features.pulseBpm||a.features.bpm)+' BPM';}catch(e){ana=e.message;}
    T('The analyser reads the library copy',anaOk,ana);
    LIB.offline=true;let off=null;try{off=await libOpen('m1');}catch(e){off=e;}
    T('Opens offline after the first open',off&&off.from==='tablet',off&&off.message||'');
    let miss=null;try{await libOpen('a1');}catch(e){miss=e;}T('Offline + not on the tablet: a clear message',miss&&/offline/i.test(miss.message),miss&&miss.message);
    LIB.offline=false;
    // 3 LRU (limit 1.5 MB)
    state.set.cacheMB=1.5;libLimitOverride=1.5e6;
    libAdd([{id:'a2',name:'big-b.mp3',mimeType:'audio/mpeg'},{id:'a3',name:'big-c.mp3',mimeType:'audio/mpeg'}]);
    await libOpen('a1');await sleep(5);await libOpen('a2');await sleep(5);await libOpen('m1');await sleep(5);await libOpen('a3');
    let c=await cacheInfo();T('Least recently used file is dropped past the limit',!c.ix.a1&&c.ix.a2&&c.ix.a3&&c.ix.m1&&c.used<=c.limit,mbTxt(c.used)+' of '+mbTxt(c.limit)+' · kept '+Object.keys(c.ix).join(','));
    // 4 pinning
    await libPin('a2',true);await libOpen('a1');await sleep(5);
    c=await cacheInfo();T('Pinned files are never dropped',c.ix.a2&&c.used<=c.limit&&!c.ix.a3,'kept '+Object.keys(c.ix).join(',')+' · '+mbTxt(c.used));
    // 5 too big
    libAdd([{id:'a4',name:'huge.wav',mimeType:'audio/wav'}]);const big=await libOpen('a4');c=await cacheInfo();
    T('A file bigger than the limit opens but isn’t kept',big.tooBig&&!c.ix.a4&&c.used<=c.limit,mbTxt(c.used));
    // 6 remove
    await libRemove('a1');c=await cacheInfo();T('Remove drops the index entry and the tablet copy (Drive file untouched)',!state.lib.a1&&state.libDel.a1&&!c.ix.a1&&files.a1,'');
    // 7 merge (Drive sync)
    const A=normaliseState({v:1,lib:{x:{id:'x',name:'x.mid',songs:['s1'],updatedAt:10},y:{id:'y',name:'y.mid',songs:[],updatedAt:5}},libDel:{},savedAt:2});
    const B=normaliseState({v:1,lib:{x:{id:'x',name:'x.mid',songs:['s1','s2'],updatedAt:20},z:{id:'z',name:'z.mid',songs:[],updatedAt:7}},libDel:{y:9},savedAt:1});
    const M=mergeStates(A,B);T('Index merges by file id: newer wins, removals carry over',M.lib.x.songs.length===2&&M.lib.z&&!M.lib.y&&M.libDel.y===9,Object.keys(M.lib).join(','));
    // 8 testing mode
    LIB.test=false;const before=JSON.stringify(state.lib);const ro=libAdd([{id:'t9',name:'t.mid'}]);LIB.test=true;
    T('Testing mode: the library is read-only',SANDBOX?ro.length===0&&JSON.stringify(state.lib)===before:true,SANDBOX?'':'(not in testing mode)');
  }catch(e){T('Library tests ran',false,e.message);}
  finally{libLimitOverride=null;LIB.test=false;LIB.offline=null;Drive=keep.drive;window.save=keep.save;STORE.db=keep.db;state=normaliseState(JSON.parse(keep.state));
    try{db.close();indexedDB.deleteDatabase(NAME);}catch(_){}}
  return out;
}
let libLimitOverride=null;
