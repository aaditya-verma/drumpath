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
/* v35 (fix-queue item 1, D-043): saving is guarded so an older copy can never overwrite a newer one.
   15 Nov 2026 the tablet's stored copy went from rev 103 back to 70: a stale/frozen tab whose pre-write check failed wrote
   its old in-memory state anyway (the check was in a try/catch that only warned). Now:
   · the stored rev is read and the new record written in ONE readwrite transaction (atomic against other tabs);
   · the write only goes ahead if the stored rev is the one this tab last read or wrote; otherwise this tab merges the
     stored copy in first (mergeStates = unions) and tries again; a record whose rev isn't above the stored one is refused;
   · if the check can't run (read error, connection closed), nothing is written: retry, reopen, then warn (banner) and
     stash this tab's changes in localStorage, merged back in on the next start;
   · on resume (visibilitychange / pageshow / focus / resume) the tab refreshes from the store before its next save;
   · a save log (last 20, this device only) under Settings › Storage. */
const SLOG_KEY='drumpath.savelog',SLOG_MAX=20,STASH_KEY='drumpath.v1.emergency';let SLOG_MEM=[];
function slogRead(){if(SANDBOX||STORE.testDb)return SLOG_MEM.slice();try{const l=JSON.parse(localStorage.getItem(SLOG_KEY));return Array.isArray(l)?l:[];}catch(_){return [];}}
function slogCounts(s){const c=((s&&s.theory)||{}).cards||{},v=Object.values(c);return {runs:((s&&s.sessions)||[]).length,cards:v.filter(x=>x&&(x.r||x.u||x.h||x.p)).length,und:v.filter(x=>x&&(x.u||x.h||x.p)).length};}
function slog(ev,o){const e=Object.assign({t:Date.now(),tab:TAB_ID.slice(0,4),app:APP.v,ev},o||{});const l=slogRead();l.push(e);while(l.length>SLOG_MAX)l.shift();
  if(SANDBOX||STORE.testDb){SLOG_MEM=l;return e;}try{localStorage.setItem(SLOG_KEY,JSON.stringify(l));}catch(_){}return e;}
const idbSleep=ms=>new Promise(r=>setTimeout(r,ms));
async function idbReopen(){try{if(STORE.db)STORE.db.close();}catch(_){}STORE.db=null;const db=await idbOpen();idbWatch(db);STORE.db=db;return db;}
function idbWatch(db){db.onclose=()=>{if(STORE.db===db)STORE.db=null;};db.onversionchange=()=>{try{db.close();}catch(_){}if(STORE.db===db)STORE.db=null;};}
// one readwrite transaction: read the stored rev, then write only if nobody else wrote since this tab last read/wrote
function idbPut(db){return new Promise((res,rej)=>{let tx;try{tx=db.transaction(['state','runs'],'readwrite');}catch(e){rej(e);return;}
  let out=null;tx.oncomplete=()=>res(out);tx.onerror=tx.onabort=()=>{if(out&&!out.ok)res(out);else rej(tx.error||new Error('transaction aborted'));};
  const g=tx.objectStore('state').get('main');
  g.onsuccess=()=>{const cur=g.result||null,cr=cur?(cur.rev||0):0;
    if(cur&&cr!==STORE.rev){out={ok:false,why:'changed',cur:cr,curApp:cur.app||0};try{tx.abort();}catch(_){}return;}
    if(cur&&cur.app&&cur.app>APP.v){out={ok:false,why:'newer-app',cur:cr,curApp:cur.app};try{tx.abort();}catch(_){}return;}
    if((state.rev||0)<=cr)state.rev=cr+1;          // stored = what this tab last saw, so this write is the next one
    const rec=Object.assign({},state);delete rec.sessions;rec.app=APP.v;
    if(cur&&(rec.rev||0)<=cr){out={ok:false,why:'lower',cur:cr};try{tx.abort();}catch(_){}return;}   // never a lower/equal rev over a stored one
    const now=new Set(),add=[];state.sessions.forEach(r=>{const k=runKey(r);now.add(k);if(!STORE.keys.has(k)||r._dirty)add.push([k,r]);});
    const del=[...STORE.keys].filter(k=>!now.has(k)),rs=tx.objectStore('runs');
    tx.objectStore('state').put(JSON.parse(JSON.stringify(rec)),'main');add.forEach(([k,r])=>{const c=Object.assign({},r);delete c._dirty;rs.put(c,k);});del.forEach(k=>rs.delete(k));
    out={ok:true,from:cr,to:rec.rev,add,del};};
});}
// the stored copy changed under this tab: merge it into this tab's state (unions; nothing this tab has is dropped)
async function idbMergeIn(db,why){const all=await idbReadAll(db);if(!all.state)return false;const from=STORE.rev;
  const theirs=Object.assign({},all.state,{sessions:all.runs});all.keys.forEach(k=>STORE.keys.add(k));
  state=normaliseState(mergeStates(state,theirs));STORE.rev=all.state.rev||0;STORE.merged=(STORE.merged||0)+1;
  slog('merge',Object.assign({from,to:STORE.rev,why},slogCounts(state)));return true;}
// write the state record and any new / removed runs (runs are only ever appended, except wipe/import)
async function idbWrite(){
  if(SANDBOX&&!STORE.testDb)throw new Error('testing mode: writes are off');
  let lastErr=null;
  for(let i=0;i<6;i++){
    let db=STORE.db;
    try{if(!db)db=STORE.testDb?null:await idbReopen();if(!db)throw new Error('no database connection');
      const r=await idbPut(db);
      if(r.ok){r.add.forEach(([k,x])=>{delete x._dirty;STORE.keys.add(k);});r.del.forEach(k=>STORE.keys.delete(k));STORE.lastWrite=Date.now();STORE.rev=r.to;
        if(STORE.failed){STORE.failed=false;STORE.err=null;try{localStorage.removeItem(STASH_KEY);}catch(_){}storeBarSync();}
        slog('save',Object.assign({from:r.from,to:r.to},slogCounts(state)));
        try{BC&&BC.postMessage({t:'saved',rev:STORE.rev,from:TAB_ID});}catch(_){}return r;}
      if(r.why==='newer-app'){STORE.oldApp=r.curApp;slog('refuse',Object.assign({from:STORE.rev,cur:r.cur,why:'saved by v'+r.curApp},slogCounts(state)));
        throw Object.assign(new Error('DrumPath v'+r.curApp+' saved here from another tab; this tab runs v'+APP.v+'. Reload this tab — nothing was overwritten.'),{noRetry:true});}
      slog('refuse',Object.assign({from:STORE.rev,cur:r.cur,why:r.why},slogCounts(state)));
      lastErr=new Error('the stored copy kept changing');
      if(!await idbMergeIn(db,r.why))throw new Error('the stored copy could not be read for merging');
    }catch(e){if(e&&e.noRetry)throw e;lastErr=e;slog('retry',{from:STORE.rev,msg:String(e&&e.message||e).slice(0,120)});
      if(!STORE.testDb){try{await idbSleep(120*(i+1));if(i>=1)await idbReopen();}catch(_){}}else await idbSleep(20);}
  }
  throw lastErr||new Error('save failed');
}
let storeWaitT=null;
function storeSave(){ // coalescing queue: never two writes at once, never a lost update; waits for a refresh on resume
  if(STORE.mode!=='idb'||SANDBOX)return;
  if(STORE.writing){STORE.again=true;return;}
  if(STORE.refreshing||STORE.stale){STORE.again=true;if(!storeWaitT)storeWaitT=(STORE.refreshing||refreshFromStore()).finally(()=>{storeWaitT=null;if(STORE.again){STORE.again=false;storeSave();}});return;}
  STORE.writing=true;
  idbWrite().catch(e=>{STORE.err=e.message||String(e);STORE.failed=true;console.warn('idb save',e);
      try{localStorage.setItem(STASH_KEY,JSON.stringify(Object.assign({},state,{_stash:{at:Date.now(),tab:TAB_ID,stored:STORE.rev}})));}catch(_){}
      slog('fail',Object.assign({from:STORE.rev,to:state.rev,msg:String(STORE.err).slice(0,120)},slogCounts(state)));storeBarSync();})
    .finally(()=>{STORE.writing=false;if(STORE.again){STORE.again=false;storeSave();}});
}
// Warning banner under the header when saving isn't safe: browser-storage fallback, a failed save, or a newer app in another tab
function storeBarSync(force){if(typeof document==='undefined')return;const old=$('#stbar');let msg='';const sb=SANDBOX&&!force;   // force: layout check only
  if(force==='ls'||!sb&&bootReady&&STORE.mode!=='idb'&&!force)msg=`<b>Not saving to this device’s database.</b><span>${esc(STORE.err||'IndexedDB couldn’t open.')} Changes go to browser storage only and may show older data. Export a backup, then reload.</span>`;
  else if(force==='app'||!sb&&!force&&STORE.oldApp)msg=`<b>DrumPath was updated in another tab.</b><span>This tab can’t save until you reload it (nothing was overwritten; your changes here are kept and merged in after the reload).</span><button class="sm" data-act="streload">Reload</button>`;
  else if(force==='fail'||!sb&&!force&&STORE.failed)msg=`<b>Your last change wasn’t saved yet.</b><span>${esc(STORE.err||'')} It’s kept on this device and will be merged in; the app keeps trying. Export a backup if this stays.</span><button class="sm" data-act="stretry">Try again</button>`;
  if(!msg){if(old)old.remove();return;}
  if(old){old.innerHTML=msg;return;}const h=document.querySelector('header.top');if(!h)return;
  (document.querySelector('#sbxbar')||h).insertAdjacentHTML('afterend',`<div id="stbar" class="sbxbar stbar" role="alert">${msg}</div>`);}
function normaliseState(s){
  s=Object.assign(freshState(),s||{});s.set=Object.assign({...DEF_SET},s.set);s.art=Object.assign({...DEFAULT_ART},s.art||{});
  if(!Array.isArray(s.sessions))s.sessions=[];if(!s.songDel||typeof s.songDel!=='object')s.songDel={};if(typeof s.rev!=='number')s.rev=0;if(!s.lib||typeof s.lib!=='object')s.lib={};if(!s.libDel||typeof s.libDel!=='object')s.libDel={};
  thFill(s);p1Fill(s);if(typeof songStateFill==='function')songStateFill(s);return s;
}
async function storageInit(){
  let db;try{db=await idbOpen();}catch(e){try{await idbSleep(400);db=await idbOpen();}catch(e2){STORE.err='IndexedDB unavailable: '+(e2.message||e2)+'.';if(!SANDBOX)slog('fallback',{msg:STORE.err});return;}}
  idbWatch(db);STORE.db=db;STORE.migrated=localStorage.getItem(MIG_KEY);
  let got;try{got=await idbReadAll(db);}catch(e){STORE.err='Could not read IndexedDB: '+e.message;if(!SANDBOX)slog('fallback',{msg:STORE.err});return;}
  const ls=loadLocal();
  if(got.state){
    // normal start from IndexedDB
    const s=got.state;s.sessions=got.runs.sort((a,b)=>a.ts-b.ts);got.keys.forEach(k=>STORE.keys.add(k));
    // safety: if an old cached copy of the app kept writing localStorage after migration, fold its extra runs in
    // (v35: merged, never copied over: a fallback session can't roll lesson progress or settings back)
    STORE.rev=s.rev||0;let st=normaliseState(s);
    if(!SANDBOX&&ls&&(ls.savedAt||0)>(s.savedAt||0)){st=normaliseState(mergeStates(st,normaliseState(ls)));slog('fold',Object.assign({from:STORE.rev,to:st.rev,why:'browser-storage copy'},slogCounts(st)));bootPending=true;}
    // v35: changes a tab couldn't save (stashed by storeSave) are merged back in
    if(!SANDBOX){let sh=null;try{sh=JSON.parse(localStorage.getItem(STASH_KEY));}catch(_){}
      if(sh&&sh.v){const info=sh._stash||{};delete sh._stash;st=normaliseState(mergeStates(st,normaliseState(sh)));STORE.stashMerged=info.at||1;bootPending=true;
        slog('stash',Object.assign({from:STORE.rev,to:st.rev,why:'unsaved changes from tab '+String(info.tab||'?').slice(0,4)},slogCounts(st)));
        try{localStorage.removeItem(STASH_KEY);}catch(_){}}}
    state=st;STORE.mode='idb';
    if(!SANDBOX)slog('boot',Object.assign({from:STORE.rev,to:STORE.rev},slogCounts(state)));
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
   ${s.err?`<p style="color:var(--warn);margin-bottom:0">${esc(s.err)}</p>`:''}${slogHtml()}`;}
/* v35: the save log (last 20 saves, merges, refusals, failures, refreshes; this device, every tab) */
const SLOG_EV={save:'saved',merge:'merged the stored copy in',refuse:'not written (stored copy changed)',retry:'retry',fail:'NOT SAVED',refresh:'refreshed from the store',boot:'opened',fold:'merged a browser-storage copy',stash:'merged unsaved changes back',fallback:'database unavailable'};
function slogLine(e){const d=new Date(e.t),hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');
  const rv=e.from!=null&&e.to!=null&&e.from!==e.to?` rev ${e.from} → ${e.to}`:e.from!=null?` rev ${e.from}${e.cur!=null?' (stored '+e.cur+')':''}`:'';
  const c=e.runs!=null?` · ${e.runs} runs · ${e.cards} cards (${e.und} understood)`:'';
  return `${dkey(d).slice(5)} ${hm} · tab ${e.tab} · v${e.app||'?'} · ${SLOG_EV[e.ev]||e.ev}${rv}${c}${e.why?' · '+e.why:''}${e.msg?' · '+e.msg:''}`;}
const slogWarn=e=>['refuse','fail','fallback','stash','fold','retry'].includes(e.ev)||(e.ev==='merge')||(e.ev==='refresh'&&e.merged);
function slogText(){return slogRead().map(slogLine).join('\n');}
function slogHtml(){const l=slogRead().slice().reverse(),w=l.filter(e=>['refuse','fail','fallback'].includes(e.ev)).length;   // a button, not <details>, so the layout check sees only what's visible (D-031 g)
  return `<div class="slog"><button class="sm ghost slogbtn" data-act="slogtoggle" aria-expanded="false">Save log · last ${l.length}${w?` · ${w} warning${w===1?'':'s'}`:''} ▾</button><div class="slogbody" hidden>${l.length?l.map(e=>`<div class="sl${slogWarn(e)?' w':''}">${esc(slogLine(e))}</div>`).join('')+`<div class="row" style="margin-top:8px"><button class="sm" data-act="slogcopy">Copy log</button></div>`:'<p class="mut" style="font-size:13px">Nothing yet.</p>'}<p class="mut" style="font-size:13px;margin-bottom:0">Kept on this device only${SANDBOX?' (testing mode: in memory until reload)':''}. If progress ever looks older than it should, copy this log before doing anything else.</p></div></div>`;}
function slogToggle(btn){const b=btn.parentElement.querySelector('.slogbody');if(!b)return;b.hidden=!b.hidden;btn.setAttribute('aria-expanded',String(!b.hidden));btn.textContent=btn.textContent.replace(/[▾▴]$/,b.hidden?'▾':'▴');}
// tests for ?test=1 (run against a throwaway database, never the real one)
async function storageTests(){
  const save0=()=>{state.savedAt=Date.now();state.rev=Math.max(state.rev||0,STORE.rev||0)+1;};
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const NAME='drumpath-test-'+Date.now();
  try{
    const db=await new Promise((res,rej)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>{['state','runs','files'].forEach(s=>r.result.createObjectStore(s));};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
    const fake=normaliseState({v:1,prog:{'1.5.03':{bpm:80,streak:1,best:95,bestBpm:75,attempts:9,ms:1,status:'progress'}},done:{'0.2.01':true},
      sessions:Array.from({length:700},(_,i)=>({ts:1e12+i*1000,id:'1.5.03',bpm:70,score:90,hits:[[0,1,90]]})),songs:[{title:'X',artist:'Y',tags:['1.5.03']}],savedAt:5});
    const keep=state,keys=STORE.keys,sdb=STORE.db,srev=STORE.rev,slog0=SLOG_MEM.slice();state=fake;STORE.keys=new Set();STORE.db=db;STORE.testDb=true;STORE.rev=0;
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
      // v35 (D-043): an older copy written over the store (rev went down) is merged in, never trusted or overwritten blindly
      {const {tx,done}=idbTx(db,['state'],'readwrite');const st=tx.objectStore('state');const r=await idbReq(st.get('main'));r.rev=1;r.prog={'3.1.01':{bpm:70,status:'progress',attempts:1}};st.put(r,'main');await done;}
      const r5=STORE.rev;state.prog['1.5.03']={bpm:85,status:'progress',attempts:2};save0();await idbWrite();const b5=await idbReadAll(db);
      T('v35: a lower-rev copy in the store is merged, then a higher rev is written',b5.state.rev>r5&&b5.state.prog['3.1.01']&&b5.state.prog['1.5.03']&&b5.state.prog['2.1.01'],'rev '+r5+' → '+b5.state.rev);
      // v35: when the check can't run, nothing is written (the old code warned and wrote anyway)
      {const o=db.transaction;let n=0;db.transaction=function(...a){n++;throw new DOMException('The database connection is closing.','InvalidStateError');};
       const before=(await (async()=>{db.transaction=o;const x=await idbReadAll(db);db.transaction=function(){n++;throw new DOMException('closing','InvalidStateError');};return x;})()).state.rev;
       state.prog['4.1.01']={bpm:60,status:'progress',attempts:1};save0();let threw=false;try{await idbWrite();}catch(_){threw=true;}db.transaction=o;const b6=await idbReadAll(db);
       T('v35: if the pre-write check fails, nothing is written',threw&&b6.state.rev===before&&!b6.state.prog['4.1.01'],'stored rev '+before+' → '+b6.state.rev+', '+n+' attempts');}
      T('v35: every write is in the save log',slogRead().some(e=>e.ev==='merge')&&slogRead().some(e=>e.ev==='retry'),slogRead().slice(-3).map(e=>e.ev).join(','));
    }finally{state=keep;STORE.keys=keys;STORE.db=sdb;STORE.testDb=false;STORE.rev=srev;SLOG_MEM=slog0;db.close();indexedDB.deleteDatabase(NAME);}
  }catch(e){T('IndexedDB test database',false,e.message);}
  T('Real data is in IndexedDB',STORE.mode==='idb',STORE.mode+(STORE.err?' · '+STORE.err:''));
  return out;
}

/* another tab saved, or this tab is coming back from the background: catch up with the stored copy before the next save.
   v35: also on pageshow / focus / resume (Android freezes background tabs); saves wait for it (storeSave). If this tab has
   changes the store doesn't have yet, or the store went *down* (an older copy was written), merge instead of replacing. */
let refreshPending=false;
function refreshFromStore(o){if(SANDBOX||STORE.mode!=='idb'||!STORE.db&&!o){STORE.stale=false;return Promise.resolve(false);}
  if(typeof run!=='undefined'&&run&&!(o&&o.force)){refreshPending=true;STORE.stale=false;return Promise.resolve(false);}   // after the run (storeSave merges atomically anyway)
  if(STORE.refreshing)return STORE.refreshing;
  return STORE.refreshing=(async()=>{try{
      while(STORE.writing)await idbSleep(30);
      const db=STORE.db||await idbReopen();
      const head=await(async()=>{const {tx,done}=idbTx(db,['state'],'readonly');const r=await idbReq(tx.objectStore('state').get('main'));await done;return r;})();   // cheap: just the rev
      if(!head||(head.rev||0)===STORE.rev){STORE.stale=false;refreshPending=false;return false;}
      const all=await idbReadAll(db);STORE.stale=false;refreshPending=false;
      if(!all.state)return false;const sr=all.state.rev||0,from=STORE.rev;if(sr===STORE.rev)return false;
      const theirs=Object.assign({},all.state,{sessions:all.runs.sort((a,b)=>a.ts-b.ts)});all.keys.forEach(k=>STORE.keys.add(k));
      const mine=(state.rev||0)>STORE.rev||STORE.failed||sr<STORE.rev;
      state=normaliseState(mine?mergeStates(state,theirs):theirs);STORE.rev=sr;
      slog('refresh',Object.assign({from,to:sr,why:(o&&o.why)||'',merged:mine?1:0},slogCounts(state)));
      if(mine)setTimeout(storeSave,0);
      if(typeof render==='function'&&!document.querySelector('.modal')&&!(o&&o.quiet))render();
      if(typeof toast==='function'&&!(o&&o.quiet))toast('Updated from your other DrumPath tab');return true;
    }catch(e){console.warn('refresh',e);STORE.stale=false;slog('retry',{from:STORE.rev,msg:'refresh: '+String(e&&e.message||e).slice(0,100)});return false;}
    finally{STORE.refreshing=null;}})();}
function storeResume(why){if(SANDBOX||STORE.mode!=='idb')return;if(document.hidden)return;STORE.stale=true;refreshFromStore({why});}
if(BC)BC.onmessage=e=>{const m=e.data||{};if(m.t==='saved'&&m.from!==TAB_ID&&(m.rev||0)!==STORE.rev)refreshFromStore({why:'other tab'});};
document.addEventListener('visibilitychange',()=>{if(document.hidden){STORE.hiddenAt=Date.now();}else storeResume('visible');});
addEventListener('pageshow',e=>storeResume(e.persisted?'pageshow (bfcache)':'pageshow'));
addEventListener('focus',()=>storeResume('focus'));
document.addEventListener('resume',()=>storeResume('resume'));
document.addEventListener('freeze',()=>{STORE.hiddenAt=Date.now();STORE.stale=true;});
