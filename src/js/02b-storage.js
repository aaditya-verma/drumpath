/* DrumPath — storage S1 (build/storage-plan.md, D-018): IndexedDB "drumpath" with stores state / runs / files.
   In memory `state` keeps the same shape as before (state.sessions = all runs), so views and scoring are unchanged.
   localStorage drumpath.v1 is migrated once, checked by reading back, then kept read-only for 30 days. */
'use strict';
const IDB_NAME='drumpath',IDB_VER=1,MIG_KEY='drumpath.migrated';
const STORE={mode:'ls',db:null,keys:new Set(),writing:false,again:false,err:null,migrated:null,persisted:null,lastWrite:0,rev:0};
const TAB_ID=Math.random().toString(36).slice(2);let BC=null;try{BC=new BroadcastChannel('drumpath');}catch(_){}
const runKey=r=>r.ts+'|'+r.id;
function idbReq(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function idbTx(db,stores,mode){const tx=db.transaction(stores,mode);return {tx,done:new Promise((res,rej)=>{tx.oncomplete=()=>res();tx.onerror=tx.onabort=()=>rej(tx.error||new Error('transaction aborted'));})};}
function idbOpen(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB not available'));
  const r=indexedDB.open(IDB_NAME,IDB_VER);
  r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('state'))db.createObjectStore('state');
    if(!db.objectStoreNames.contains('runs'))db.createObjectStore('runs');if(!db.objectStoreNames.contains('files'))db.createObjectStore('files');};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('IndexedDB blocked by another tab'));});}
async function idbReadAll(db){
  const {tx,done}=idbTx(db,['state','runs'],'readonly');
  const st=idbReq(tx.objectStore('state').get('main')),rk=idbReq(tx.objectStore('runs').getAllKeys()),rv=idbReq(tx.objectStore('runs').getAll());
  const [s,keys,vals]=await Promise.all([st,rk,rv]);await done;
  return {state:s||null,runs:vals||[],keys:keys||[]};
}
// write the state record and any new / removed runs (runs are only ever appended, except wipe/import)
async function idbWrite(){
  if(SANDBOX&&!STORE.testDb)throw new Error('testing mode: writes are off');
  const db=STORE.db;
  // another DrumPath tab wrote since we last loaded/wrote: merge its data in first, so neither tab overwrites the other
  try{const {tx,done}=idbTx(db,['state'],'readonly');const cur=await idbReq(tx.objectStore('state').get('main'));await done;
    if(cur&&(cur.rev||0)>STORE.rev&&typeof mergeStates==='function'){const all=await idbReadAll(db);const theirs=Object.assign({},all.state,{sessions:all.runs});
      all.keys.forEach(k=>STORE.keys.add(k));state=normaliseState(mergeStates(state,theirs));STORE.merged=(STORE.merged||0)+1;}}catch(e){console.warn('pre-write check',e);}
  const rec=Object.assign({},state);delete rec.sessions;
  const now=new Set(),add=[];state.sessions.forEach(r=>{const k=runKey(r);now.add(k);if(!STORE.keys.has(k)||r._dirty)add.push([k,r]);});
  const del=[...STORE.keys].filter(k=>!now.has(k));
  const {tx,done}=idbTx(db,['state','runs'],'readwrite');const rs=tx.objectStore('runs');
  tx.objectStore('state').put(JSON.parse(JSON.stringify(rec)),'main');
  add.forEach(([k,r])=>{delete r._dirty;rs.put(r,k);});del.forEach(k=>rs.delete(k));
  await done;add.forEach(([k])=>STORE.keys.add(k));del.forEach(k=>STORE.keys.delete(k));STORE.lastWrite=Date.now();STORE.rev=rec.rev||0;
  try{BC&&BC.postMessage({t:'saved',rev:STORE.rev,from:TAB_ID});}catch(_){}
}
function storeSave(){ // coalescing queue: never two writes at once, never a lost update
  if(STORE.mode!=='idb'||SANDBOX)return;
  if(STORE.writing){STORE.again=true;return;}
  STORE.writing=true;
  idbWrite().catch(e=>{STORE.err=e.message||String(e);console.warn('idb save',e);try{localStorage.setItem('drumpath.v1.emergency',JSON.stringify(state));}catch(_){} })
    .finally(()=>{STORE.writing=false;if(STORE.again){STORE.again=false;storeSave();}});
}
function normaliseState(s){
  s=Object.assign(freshState(),s||{});s.set=Object.assign({...DEF_SET},s.set);s.art=Object.assign({...DEFAULT_ART},s.art||{});
  if(!Array.isArray(s.sessions))s.sessions=[];if(!s.songDel||typeof s.songDel!=='object')s.songDel={};if(typeof s.rev!=='number')s.rev=0;
  if(typeof songStateFill==='function')songStateFill(s);return s;
}
async function storageInit(){
  let db;try{db=await idbOpen();}catch(e){STORE.err='IndexedDB unavailable: '+(e.message||e)+'. Saving to browser storage as before.';return;}
  STORE.db=db;STORE.migrated=localStorage.getItem(MIG_KEY);
  let got;try{got=await idbReadAll(db);}catch(e){STORE.err='Could not read IndexedDB: '+e.message;return;}
  const ls=loadLocal();
  if(got.state){
    // normal start from IndexedDB
    const s=got.state;s.sessions=got.runs.sort((a,b)=>a.ts-b.ts);got.keys.forEach(k=>STORE.keys.add(k));
    // safety: if an old cached copy of the app kept writing localStorage after migration, fold its extra runs in
    if(ls&&(ls.savedAt||0)>(s.savedAt||0)){const have=new Set(s.sessions.map(runKey));(ls.sessions||[]).forEach(r=>{if(!have.has(runKey(r)))s.sessions.push(r);});
      s.sessions.sort((a,b)=>a.ts-b.ts);Object.assign(s,{prog:ls.prog,done:ls.done,days:ls.days,songs:ls.songs,set:ls.set,map:ls.map,art:ls.art,lat:ls.lat,savedAt:ls.savedAt});}
    state=normaliseState(s);STORE.mode='idb';STORE.rev=s.rev||0;
  }else if(SANDBOX){state=normaliseState(ls||state);STORE.mode='idb';
  }else if(ls){
    // first run: migrate localStorage → IndexedDB, read back, compare counts
    const src=normaliseState(ls);state=src;STORE.mode='idb';
    await idbWrite();
    const back=await idbReadAll(db);
    const want={prog:Object.keys(src.prog).length,runs:src.sessions.length,songs:src.songs.length,done:Object.keys(src.done).length};
    const have=back.state?{prog:Object.keys(back.state.prog||{}).length,runs:back.runs.length,songs:(back.state.songs||[]).length,done:Object.keys(back.state.done||{}).length}:{};
    if(JSON.stringify(want)!==JSON.stringify(have)){STORE.mode='ls';STORE.err='Migration check failed ('+JSON.stringify(want)+' vs '+JSON.stringify(have)+'). Still using browser storage; nothing was lost.';return;}
    STORE.migrated=today();try{localStorage.setItem(MIG_KEY,STORE.migrated);}catch(_){}
  }else{state=normaliseState(state);STORE.mode='idb';await idbWrite();STORE.migrated=STORE.migrated||today();try{localStorage.setItem(MIG_KEY,STORE.migrated);}catch(_){}}
  if(SANDBOX)return;
  // keep drumpath.v1 read-only for 30 days after migration, then remove it
  if(STORE.migrated&&ls&&Date.now()-pdate(STORE.migrated).getTime()>30*864e5){try{localStorage.removeItem(KEY);}catch(_){}}
  if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{STORE.persisted=p;if(!p&&hasPassed())requestPersist();}).catch(()=>{});
}
const hasPassed=()=>Object.values(state.prog).some(p=>p&&(p.bestBpm>0||p.status==='mastered'));
async function requestPersist(){try{if(navigator.storage&&navigator.storage.persist){STORE.persisted=await navigator.storage.persist();}}catch(_){}return STORE.persisted;}
async function storageInfo(){let est={};try{if(navigator.storage&&navigator.storage.estimate)est=await navigator.storage.estimate();}catch(_){}
  return {mode:STORE.mode,usage:est.usage||0,quota:est.quota||0,persisted:STORE.persisted,runs:state.sessions.length,withHits:state.sessions.filter(r=>r.hits).length,migrated:STORE.migrated,err:STORE.err};}
function storageCard(){return `<div class="card" id="storagecard"><span class="mut">Checking storage…</span></div>`;}
async function fillStorageCard(){const el=$('#storagecard');if(!el)return;const s=await storageInfo();const mb=b=>b>=1e9?(b/1e9).toFixed(1)+' GB':(b/1e6).toFixed(1)+' MB';
  const pct=s.quota?Math.round(1000*s.usage/s.quota)/10:0;
  el.innerHTML=`<div class="grid">
   <div class="stat"><div class="k">Saved in</div><div class="v" style="font-size:22px">${s.mode==='idb'?'IndexedDB':'Browser storage (old)'}</div><div class="d">${s.migrated?'moved from browser storage '+s.migrated:''}</div></div>
   <div class="stat"><div class="k">Space used</div><div class="v" style="font-size:22px">${mb(s.usage)}<small>/ ${s.quota?mb(s.quota):'?'}</small></div><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100,Math.max(1,pct))}%"></i></div><div class="d">${pct}% of what Chrome allows this site</div></div>
   <div class="stat"><div class="k">Runs kept</div><div class="v" style="font-size:22px">${s.runs}</div><div class="d">${s.withHits} with per-hit detail · no cap</div></div>
   <div class="stat"><div class="k">Protected from clean-up</div><div class="v" style="font-size:22px">${s.persisted==null?'?':s.persisted?'Yes':'Not yet'}</div><div class="d">${s.persisted?'Chrome won’t clear it when space is low':'<button class="sm" data-act="persist">Ask Chrome to keep it</button>'}</div></div></div>
   ${s.err?`<p style="color:var(--warn);margin-bottom:0">${esc(s.err)}</p>`:''}`;}
// tests for ?test=1 (run against a throwaway database, never the real one)
async function storageTests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const NAME='drumpath-test-'+Date.now();
  try{
    const db=await new Promise((res,rej)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{['state','runs','files'].forEach(s=>r.result.createObjectStore(s));};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
    const fake=normaliseState({v:1,prog:{'1.5.03':{bpm:80,streak:1,best:95,bestBpm:75,attempts:9,ms:1,status:'progress'}},done:{'0.2.01':true},
      sessions:Array.from({length:700},(_,i)=>({ts:1e12+i*1000,id:'1.5.03',bpm:70,score:90,hits:[[0,1,90]]})),songs:[{title:'X',artist:'Y',tags:['1.5.03']}],savedAt:5});
    const keep=state,keys=STORE.keys,sdb=STORE.db,srev=STORE.rev;state=fake;STORE.keys=new Set();STORE.db=db;STORE.testDb=true;STORE.rev=0;
    try{await idbWrite();const back=await idbReadAll(db);
      T('Migration copies every run and lesson',back.runs.length===700&&Object.keys(back.state.prog).length===1&&back.state.done['0.2.01'],back.runs.length+' runs, '+Object.keys(back.state.prog).length+' lesson');
      T('No 600-run cap on per-hit detail',back.runs.filter(r=>r.hits).length===700,back.runs.filter(r=>r.hits).length+' of 700 runs keep hits');
      T('Runs live in the runs store, not in the state record',!('sessions' in back.state),'');
      state.sessions.push({ts:2e12,id:'2.5.01',bpm:90,score:100});await idbWrite();const b2=await idbReadAll(db);
      T('A new run is appended, nothing rewritten',b2.runs.length===701,b2.runs.length+' runs');
      const ex=JSON.stringify(state);const imp=normaliseState(JSON.parse(ex));T('Export → Import round trip unchanged',imp.sessions.length===701&&JSON.stringify(imp.prog)===JSON.stringify(state.prog),'');
      state.sessions=[];await idbWrite();const b3=await idbReadAll(db);T('Reset all progress clears stored runs',b3.runs.length===0,'');
      // two tabs: another tab saved newer data (higher rev) after this tab loaded — this tab must merge, not overwrite
      {const {tx,done}=idbTx(db,['state','runs'],'readwrite');const other=Object.assign({},state,{rev:STORE.rev+5,prog:{'2.1.01':{bpm:90,best:96,bestBpm:90,status:'mastered'}}});delete other.sessions;
       tx.objectStore('state').put(other,'main');tx.objectStore('runs').put({ts:3e12,id:'2.1.01',bpm:90,score:96},'3000000000000|2.1.01');await done;}
      state.sessions=[{ts:4e12,id:'1.5.03',bpm:80,score:92}];state.rev=STORE.rev+1;await idbWrite();const b4=await idbReadAll(db);
      T('Second tab: newer data from the other tab is merged, not overwritten',b4.runs.length===2&&b4.state.prog['2.1.01']&&b4.state.prog['1.5.03'],b4.runs.length+' runs, lessons '+Object.keys(b4.state.prog).join(','));
    }finally{state=keep;STORE.keys=keys;STORE.db=sdb;STORE.testDb=false;STORE.rev=srev;db.close();indexedDB.deleteDatabase(NAME);}
  }catch(e){T('IndexedDB test database',false,e.message);}
  T('Real data is in IndexedDB',STORE.mode==='idb',STORE.mode+(STORE.err?' · '+STORE.err:''));
  return out;
}

/* another tab saved: refresh this tab's copy (after the current run, if one is playing) */
let refreshPending=false;
async function refreshFromStore(){if(SANDBOX||STORE.mode!=='idb'||!STORE.db)return;
  if(typeof run!=='undefined'&&run){refreshPending=true;return;}
  try{const all=await idbReadAll(STORE.db);if(!all.state||(all.state.rev||0)<=STORE.rev)return;
    const s=Object.assign({},all.state,{sessions:all.runs.sort((a,b)=>a.ts-b.ts)});all.keys.forEach(k=>STORE.keys.add(k));
    state=normaliseState(s);STORE.rev=s.rev||0;if(typeof render==='function'&&!document.querySelector('.modal'))render();
    if(typeof toast==='function')toast('Updated from your other DrumPath tab');}catch(e){console.warn('refresh',e);}}
if(BC)BC.onmessage=e=>{const m=e.data||{};if(m.t==='saved'&&m.from!==TAB_ID&&(m.rev||0)>STORE.rev)refreshFromStore();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFromStore();});
