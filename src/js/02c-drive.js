/* DrumPath — storage S2: Google Drive sync (build/storage-plan.md §S2, D-018).
   Google Identity Services token model, scope drive.file only. The folder (My Drive › Projects › DrumPath) is chosen once
   with Google Picker; the app creates backup/ (drumpath-state.json + snapshots/YYYY-MM-DD.json, last 30), midi/, songs/.
   Offline first: practice and saving never wait for Drive. Merge: runs = union, lesson progress = higher, settings/songs = newer. */
'use strict';
const GCP={clientId:'982976301414-p3kd1v4glurcukirsado3jjl8l3jlcke.apps.googleusercontent.com',apiKey:'AIzaSyDSZXZtuKWEHcSWQI5DZ4oM9NisId9SnU8',
  appId:'982976301414',scope:'https://www.googleapis.com/auth/drive.file'};
const DRV_KEY='drumpath.drive',TOK_KEY='drumpath.drive.token',STATE_FILE='drumpath-state.json',KEEP_SNAPS=30,PUSH_DELAY=30000;
const FOLDER_MIME='application/vnd.google-apps.folder';
// per-device config (never synced): folder ids, file ids, last sync
let DRV=(()=>{try{return JSON.parse(localStorage.getItem(DRV_KEY))||{};}catch(_){return {};}})();
const DS={status:'off',msg:'',token:null,exp:0,timer:null,busy:false,again:false,dirty:false,lastErr:''};
function drvSaveCfg(){try{localStorage.setItem(DRV_KEY,JSON.stringify(DRV));}catch(_){}}
const driveOn=()=>!!DRV.folderId;
(()=>{try{const t=JSON.parse(localStorage.getItem(TOK_KEY));if(t&&t.exp>Date.now()+60000){DS.token=t.token;DS.exp=t.exp;}}catch(_){}})();

/* ---------- script loading ---------- */
const loadJs=src=>new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`)){const w=()=>res();setTimeout(w,0);return;}
  const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>res();s.onerror=()=>rej(new Error('Could not load '+src+' (offline?)'));document.head.appendChild(s);});
async function gisReady(){if(!(window.google&&google.accounts&&google.accounts.oauth2))await loadJs('https://accounts.google.com/gsi/client');
  for(let i=0;i<50&&!(window.google&&google.accounts&&google.accounts.oauth2);i++)await sleep(100);if(!(window.google&&google.accounts&&google.accounts.oauth2))throw new Error('Google sign-in did not load');}
async function pickerReady(){if(!(window.google&&google.picker)){await loadJs('https://apis.google.com/js/api.js');await new Promise((res,rej)=>gapi.load('picker',{callback:res,onerror:()=>rej(new Error('Picker did not load'))}));}}

/* ---------- token (GIS token model; no refresh tokens, ~1 h) ---------- */
let tokenClient=null,tokenWait=null;
async function getToken(interactive){
  if(DS.token&&DS.exp>Date.now()+60000)return DS.token;
  await gisReady();
  if(!tokenClient)tokenClient=google.accounts.oauth2.initTokenClient({client_id:GCP.clientId,scope:GCP.scope,callback:()=>{},error_callback:()=>{}});
  return new Promise((res,rej)=>{
    tokenClient.callback=r=>{if(r&&r.access_token&&google.accounts.oauth2.hasGrantedAllScopes(r,GCP.scope)){DS.token=r.access_token;DS.exp=Date.now()+(+r.expires_in||3500)*1000;
        try{localStorage.setItem(TOK_KEY,JSON.stringify({token:DS.token,exp:DS.exp}));}catch(_){}res(DS.token);}else rej(new Error(r&&r.error||'Drive access was not granted'));};
    tokenClient.error_callback=e=>rej(new Error(e&&e.type==='popup_failed_to_open'?'needs a tap':e&&e.type==='popup_closed'?'sign-in window closed':(e&&e.message)||'sign-in failed'));
    tokenClient.requestAccessToken({prompt:interactive&&!DRV.granted?'consent':'',hint:DRV.hint||undefined});
  });
}
function dropToken(){DS.token=null;DS.exp=0;try{localStorage.removeItem(TOK_KEY);}catch(_){}}

/* ---------- Drive REST (fetch + bearer token). Swappable for tests. ---------- */
async function gfetch(url,opt={},retry=true){
  const t=await getToken(false);const r=await fetch(url,Object.assign({},opt,{headers:Object.assign({Authorization:'Bearer '+t},opt.headers||{})}));
  if(r.status===401&&retry){dropToken();return gfetch(url,opt,false);}
  if(!r.ok){let m=r.status+'';try{const j=await r.json();m+=' '+(j.error&&j.error.message||'');}catch(_){}throw new Error('Drive: '+m);}
  return r;
}
const API_D='https://www.googleapis.com/drive/v3/files',API_U='https://www.googleapis.com/upload/drive/v3/files';
const q=s=>encodeURIComponent(s);
const DriveReal={
  async find(parent,name,folder){const qq=`'${parent}' in parents and name='${name.replace(/'/g,"\\'")}' and trashed=false`+(folder?` and mimeType='${FOLDER_MIME}'`:'');
    const j=await (await gfetch(`${API_D}?q=${q(qq)}&fields=files(id,name,modifiedTime,size)&spaces=drive`)).json();return j.files[0]||null;},
  async list(parent){const j=await (await gfetch(`${API_D}?q=${q(`'${parent}' in parents and trashed=false`)}&fields=files(id,name,modifiedTime)&pageSize=200&orderBy=name`)).json();return j.files;},
  async mkdir(parent,name){return (await gfetch(API_D+'?fields=id,name',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:FOLDER_MIME,parents:[parent]})})).json();},
  async create(parent,name,text){const b='dp'+Date.now();const body=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,parents:[parent],mimeType:'application/json'})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${b}--`;
    return (await gfetch(API_U+'?uploadType=multipart&fields=id,name,modifiedTime',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body})).json();},
  async update(id,text){return (await gfetch(`${API_U}/${id}?uploadType=media&fields=id,modifiedTime`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:text})).json();},
  async meta(id){return (await gfetch(`${API_D}/${id}?fields=id,name,modifiedTime,trashed`)).json();},
  async read(id){return (await gfetch(`${API_D}/${id}?alt=media`)).text();},
  async del(id){await gfetch(`${API_D}/${id}`,{method:'DELETE'});},
};
let Drive=DriveReal;

/* ---------- merge (pure; tested in ?test=1) ---------- */
const rk=r=>r.ts+'|'+r.id;
function progRank(p){return p?[p.status==='mastered'?1:0,p.bpm||0,p.attempts||0]:[ -1,0,0];}
function higher(a,b){const x=progRank(a),y=progRank(b);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]?a:b;}return a;}
function mergeStates(A,B){
  // A = local, B = remote. Returns a new state; neither input is changed.
  const a=JSON.parse(JSON.stringify(A)),b=JSON.parse(JSON.stringify(B));
  const newer=(a.savedAt||0)>=(b.savedAt||0)?a:b,older=newer===a?b:a;
  const m=Object.assign({},newer);
  // runs: union by run id (start time + lesson); never deleted by a sync
  const runs=new Map();[...(older.sessions||[]),...(newer.sessions||[])].forEach(r=>{const k=rk(r),o=runs.get(k);runs.set(k,o&&o.hits&&!r.hits?o:r);});
  m.sessions=[...runs.values()].sort((x,y)=>x.ts-y.ts);
  // lesson progress: keep the higher progress, then recompute what the merged runs can tell us
  m.prog={};new Set([...Object.keys(a.prog||{}),...Object.keys(b.prog||{})]).forEach(id=>{const pa=(a.prog||{})[id],pb=(b.prog||{})[id];
    const w=JSON.parse(JSON.stringify(pa&&pb?higher(pa,pb):pa||pb)),o=pa&&pb?(w===pa?pb:pa):null;
    const mx=(k,x)=>{if(w[k]!=null||x!=null)w[k]=Math.max(w[k]||0,x||0);};
    if(o){['best','bestBpm','ms','last'].forEach(k=>mx(k,o[k]));
      if(o.masteredAt&&(!w.masteredAt||o.masteredAt<w.masteredAt)&&w.status==='mastered')w.masteredAt=o.masteredAt;
      if((o.stretchBpm||0)>(w.stretchBpm||0)){w.stretchBpm=o.stretchBpm;w.sStreak=o.sStreak||0;}}
    const rs=m.sessions.filter(r=>r.id===id);if(rs.length){mx('attempts',rs.length);mx('best',Math.max(...rs.map(r=>r.score||0)));mx('last',Math.max(...rs.map(r=>r.ts)));}
    m.prog[id]=w;});
  // checklists / done: a lesson done on either device stays done; quiz answers from the newer copy
  m.done=Object.assign({},older.done||{},newer.done||{});Object.keys(older.done||{}).forEach(k=>{if(older.done[k]===true&&!k.includes('_'))m.done[k]=true;});
  // practice minutes per day: the larger figure (both devices count their own runs)
  m.days={};new Set([...Object.keys(a.days||{}),...Object.keys(b.days||{})]).forEach(d=>{m.days[d]=Math.max((a.days||{})[d]||0,(b.days||{})[d]||0);});
  // settings, kit map, latency, theme-free prefs: newer copy wins (already in m)
  // songs: by id, newer updatedAt wins; deletions are kept as tombstones
  m.songDel=Object.assign({},older.songDel||{},newer.songDel||{});
  const songs=new Map();[...(older.songs||[]),...(newer.songs||[])].forEach(s=>{const o=songs.get(s.id);if(!o||(s.updatedAt||0)>=(o.updatedAt||0))songs.set(s.id,s);});
  m.songs=[...songs.values()].filter(s=>!(m.songDel[s.id]&&m.songDel[s.id]>=(s.updatedAt||0)));
  m.songTagOv={};[older.songTagOv||{},newer.songTagOv||{}].forEach(o=>Object.entries(o).forEach(([k,v])=>{if(!m.songTagOv[k]||(v.updatedAt||0)>=(m.songTagOv[k].updatedAt||0))m.songTagOv[k]=v;}));
  m.songBpm=Object.assign({},older.songBpm||{},newer.songBpm||{});m.songExtra=Object.assign({},older.songExtra||{},newer.songExtra||{});
  m.songLog={};new Set([...Object.keys(a.songLog||{}),...Object.keys(b.songLog||{})]).forEach(id=>{const seen=new Set(),out=[];
    [...((a.songLog||{})[id]||[]),...((b.songLog||{})[id]||[])].forEach(r=>{const k=JSON.stringify(r);if(!seen.has(k)){seen.add(k);out.push(r);}});m.songLog[id]=out.sort((x,y)=>String(x[0]).localeCompare(String(y[0])));});
  m.songHist={};new Set([...Object.keys(a.songHist||{}),...Object.keys(b.songHist||{})]).forEach(id=>{const by={};
    [...((a.songHist||{})[id]||[]),...((b.songHist||{})[id]||[])].forEach(([d,v])=>{by[d]=Math.max(by[d]||0,v);});m.songHist[id]=Object.entries(by).sort().slice(-365);});
  m.lastBackup=Math.max(a.lastBackup||0,b.lastBackup||0)||undefined;
  m.rev=Math.max(a.rev||0,b.rev||0)+1;m.savedAt=Math.max(a.savedAt||0,b.savedAt||0);
  return m;
}
const sameData=(x,y)=>x.sessions.length===y.sessions.length&&JSON.stringify(x.prog)===JSON.stringify(y.prog)&&JSON.stringify(x.done)===JSON.stringify(y.done)&&JSON.stringify(x.songs)===JSON.stringify(y.songs);

/* ---------- folder layout ---------- */
async function ensureLayout(){
  const sub=async(parent,name,key)=>{if(DRV[key])return DRV[key];const f=await Drive.find(parent,name,true)||await Drive.mkdir(parent,name);DRV[key]=f.id;drvSaveCfg();return f.id;};
  const backup=await sub(DRV.folderId,'backup','backupId');await sub(backup,'snapshots','snapId');await sub(DRV.folderId,'midi','midiId');await sub(DRV.folderId,'songs','songsId');
  if(!DRV.stateId){const f=await Drive.find(backup,STATE_FILE,false);if(f)DRV.stateId=f.id;drvSaveCfg();}
}
/* ---------- sync ---------- */
function setDrive(status,msg){DS.status=status;DS.msg=msg||'';renderDriveChip();}
async function syncNow(opts={}){
  if(!driveOn())return;
  if(DS.busy){DS.again=true;return;}
  if(!navigator.onLine&&!opts.test){setDrive('offline');return;}
  DS.busy=true;clearTimeout(DS.timer);setDrive('syncing');
  try{
    await ensureLayout();
    let remote=null,rmod=null;
    if(DRV.stateId){const mt=await Drive.meta(DRV.stateId).catch(()=>null);if(mt&&!mt.trashed){rmod=mt.modifiedTime;
        if(!DRV.lastRemote||rmod>DRV.lastRemote||opts.pull)remote=JSON.parse(await Drive.read(DRV.stateId));}else DRV.stateId=null;}
    if(remote&&remote.v){const merged=normaliseState(mergeStates(state,remote));const changedLocal=!sameData(merged,state);
      state=merged;bootReady&&(STORE.mode==='idb'?storeSave():save());if(changedLocal&&typeof render==='function'&&!opts.test)render();
      DS.dirty=DS.dirty||!sameData(merged,normaliseState(remote));}
    else if(!DRV.stateId)DS.dirty=true;
    if(DS.dirty||opts.force){const text=JSON.stringify(Object.assign({},state,{syncedAt:Date.now()}));
      const f=DRV.stateId?await Drive.update(DRV.stateId,text):await Drive.create(DRV.backupId,STATE_FILE,text);DRV.stateId=f.id;rmod=f.modifiedTime||rmod;
      // daily snapshot, keep the last 30
      const name=today()+'.json',snap=await Drive.find(DRV.snapId,name,false);if(snap)await Drive.update(snap.id,text);else await Drive.create(DRV.snapId,name,text);
      if(DRV.lastSnapDay!==today()){DRV.lastSnapDay=today();const all=(await Drive.list(DRV.snapId)).filter(f=>/^\d{4}-\d\d-\d\d\.json$/.test(f.name)).sort((x,y)=>x.name.localeCompare(y.name));
        for(const f of all.slice(0,Math.max(0,all.length-KEEP_SNAPS)))await Drive.del(f.id);}
      DS.dirty=false;}
    if(rmod)DRV.lastRemote=rmod;DRV.lastSync=Date.now();drvSaveCfg();setDrive('synced');
  }catch(e){DS.lastErr=e.message||String(e);
    if(/needs a tap|not granted|closed|sign-in|401/.test(DS.lastErr))setDrive('reconnect',DS.lastErr);
    else if(!navigator.onLine||/Failed to fetch|NetworkError|offline/i.test(DS.lastErr))setDrive('offline');
    else setDrive('error',DS.lastErr);DS.dirty=true;}
  finally{DS.busy=false;if(DS.again){DS.again=false;syncNow();}}
}
// called from save(): push 30 s after the last change
function drivePushSoon(){if(!driveOn())return;DS.dirty=true;if(DS.status==='synced')setDrive('pending');clearTimeout(DS.timer);DS.timer=setTimeout(()=>syncNow(),PUSH_DELAY);}
async function driveStart(){if(!driveOn()){renderDriveChip();return;}
  if(!DS.token){try{await getToken(false);}catch(e){setDrive('reconnect',e.message);return;}}
  syncNow();}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&driveOn()&&DS.dirty){clearTimeout(DS.timer);syncNow();}
  else if(!document.hidden&&driveOn()&&DRV.lastSync&&Date.now()-DRV.lastSync>5*60000)syncNow();});
addEventListener('online',()=>{if(driveOn())syncNow();});
addEventListener('offline',()=>{if(driveOn())setDrive('offline');});

/* ---------- connect, choose folder, disconnect ---------- */
async function driveConnect(){
  try{await getToken(true);DRV.granted=true;drvSaveCfg();}catch(e){toast('Drive: '+e.message);setDrive('reconnect',e.message);return false;}
  if(!driveOn())return driveChooseFolder();
  syncNow({pull:true});return true;
}
async function driveChooseFolder(){
  try{const tok=await getToken(true);DRV.granted=true;await pickerReady();
    const view=new google.picker.DocsView(google.picker.ViewId.FOLDERS).setSelectFolderEnabled(true).setIncludeFolders(true).setMimeTypes(FOLDER_MIME).setParent('root');
    const picked=await new Promise(res=>{new google.picker.PickerBuilder().addView(view).setOAuthToken(tok).setDeveloperKey(GCP.apiKey).setAppId(GCP.appId)
      .setTitle('Choose the DrumPath folder (My Drive › Projects › DrumPath)').setCallback(d=>{if(d.action===google.picker.Action.PICKED)res(d.docs[0]);else if(d.action===google.picker.Action.CANCEL)res(null);}).build().setVisible(true);});
    if(!picked)return false;
    DRV={folderId:picked.id,folderName:picked.name,granted:true,hint:DRV.hint};drvSaveCfg();
    toast('Drive folder: '+picked.name);await syncNow({pull:true});render();return true;
  }catch(e){toast('Drive: '+e.message);setDrive('error',e.message);return false;}
}
function driveDisconnect(){try{if(DS.token&&window.google&&google.accounts)google.accounts.oauth2.revoke(DS.token,()=>{});}catch(_){}
  dropToken();DRV={};drvSaveCfg();setDrive('off');}

/* ---------- UI ---------- */
function agoTxt(ts){if(!ts)return 'never';const s=(Date.now()-ts)/1000;return s<60?'just now':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' d ago';}
function renderDriveChip(){const c=$('#dchip');if(!c)return;if(!driveOn()){c.classList.add('hidden');return;}c.classList.remove('hidden');
  const [ok,txt]={synced:[1,'Synced '+agoTxt(DRV.lastSync)],pending:[1,'Synced '+agoTxt(DRV.lastSync)+' · changes waiting'],syncing:[1,'Syncing…'],
    offline:[0,'Offline, will sync'],reconnect:[0,'Reconnect Drive'],error:[0,'Drive sync error'],off:[0,'Drive']}[DS.status]||[0,'Drive'];
  $('#ddot').classList.toggle('ok',!!ok);$('#dtxt').textContent=txt;c.title=DS.msg||'Google Drive sync';}
setInterval(()=>{if(driveOn()&&(DS.status==='synced'||DS.status==='pending'))renderDriveChip();},60000);
function driveCard(){
  if(!driveOn())return `<div class="card"><p style="margin-top:0">Back up and sync your progress to your own Google Drive. Pick the folder <b>My Drive › Projects › DrumPath</b>; the app only sees files it creates there (and files you pick).</p><button class="pri" data-act="driveconnect">Connect Google Drive</button></div>`;
  return `<div class="card"><div class="grid">
   <div class="stat"><div class="k">Folder</div><div class="v" style="font-size:20px">${esc(DRV.folderName||'DrumPath')}</div><div class="d">backup/ · midi/ · songs/</div></div>
   <div class="stat"><div class="k">Status</div><div class="v" style="font-size:20px">${esc({synced:'Synced',pending:'Changes waiting',syncing:'Syncing…',offline:'Offline',reconnect:'Needs sign-in',error:'Error',off:'Not started'}[DS.status]||DS.status)}</div><div class="d">last sync ${agoTxt(DRV.lastSync)}</div></div>
   <div class="stat"><div class="k">Snapshots</div><div class="v" style="font-size:20px">daily</div><div class="d">last 30 kept · today’s ${DRV.lastSnapDay===today()?'saved':'not yet'}</div></div></div>
   ${DS.lastErr&&DS.status!=='synced'?`<p class="mut" style="font-size:13px">${esc(DS.lastErr)}</p>`:''}
   <div class="row" style="margin-top:10px"><button class="pri" data-act="drivesync">Sync now</button>${DS.status==='reconnect'?'<button data-act="driveconnect">Reconnect Drive</button>':''}<button data-act="drivefolder">Choose Drive folder</button><span class="sp"></span><button class="ghost" data-act="drivedisconnect">Disconnect</button></div></div>`;
}
/* ---------- tests (in-memory Drive; the real one is never touched) ---------- */
function mockDrive(){const files={},kids={};let n=0,clock=Date.parse('2026-11-10T00:00:00Z');const now=()=>new Date(clock+=1000).toISOString();
  const mk=(parent,name,mime,text)=>{const id='f'+(++n);files[id]={id,name,mimeType:mime,text,modifiedTime:now(),parent};(kids[parent]=kids[parent]||[]).push(id);return {id,name,modifiedTime:files[id].modifiedTime};};
  return {files,find:async(p,nm,folder)=>{const id=(kids[p]||[]).find(i=>files[i]&&files[i].name===nm&&(!folder||files[i].mimeType===FOLDER_MIME));return id?{id,name:nm,modifiedTime:files[id].modifiedTime}:null;},
    list:async p=>(kids[p]||[]).filter(i=>files[i]).map(i=>({id:i,name:files[i].name,modifiedTime:files[i].modifiedTime})),
    mkdir:async(p,nm)=>mk(p,nm,FOLDER_MIME),create:async(p,nm,t)=>mk(p,nm,'application/json',t),
    update:async(id,t)=>{files[id].text=t;files[id].modifiedTime=now();return {id,modifiedTime:files[id].modifiedTime};},
    meta:async id=>({id,modifiedTime:files[id].modifiedTime,trashed:false}),read:async id=>files[id].text,del:async id=>{delete files[id];}};}
async function driveTests(){
  const out=[],T=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const run=(ts,id,score,bpm)=>({ts,id,score,bpm:bpm||70,ex:0});
  const base=()=>normaliseState({v:1,prog:{},done:{},sessions:[],songs:[],savedAt:1});
  // merge rules
  const A=base(),B=base();A.sessions=[run(1,'1.5.03',95),run(2,'1.5.03',96)];B.sessions=[run(2,'1.5.03',96),run(3,'2.5.01',91)];
  A.prog={'1.5.03':{bpm:85,streak:1,best:96,bestBpm:80,attempts:2,ms:5,status:'progress'}};B.prog={'1.5.03':{bpm:100,streak:0,best:90,bestBpm:100,attempts:1,ms:3,status:'mastered',masteredAt:9},'2.5.01':{bpm:70,attempts:1,status:'progress'}};
  A.set.tol=30;A.savedAt=10;B.set.tol=25;B.savedAt=20;A.done={'0.2.01':true};B.done={'0.2.02':true};
  A.songs=[{id:'u1',title:'Mine',core:[],support:[],tags:[],updatedAt:5},{id:'u2',title:'Gone',core:[],support:[],tags:[],updatedAt:1}];B.songs=[{id:'u1',title:'Mine (edited)',core:[],support:[],tags:[],updatedAt:8}];B.songDel={u2:3};
  const M=mergeStates(A,B);
  T('Runs: union by run id, no duplicates',M.sessions.length===3,M.sessions.length+' runs');
  T('Lesson progress: the higher one wins (mastered beats in progress)',M.prog['1.5.03'].status==='mastered'&&M.prog['1.5.03'].bpm===100&&M.prog['1.5.03'].best===96&&M.prog['2.5.01'],JSON.stringify(M.prog['1.5.03']));
  T('Settings: the newer copy wins',M.set.tol===25,'tol '+M.set.tol);
  T('Checklists done on either device stay done',M.done['0.2.01']&&M.done['0.2.02'],'');
  T('Songs: newer edit wins; deleted songs stay deleted',M.songs.length===1&&M.songs[0].title==='Mine (edited)','');
  const M2=mergeStates(M,M);T('Merging twice changes nothing (idempotent)',sameData(M2,M),'');
  // full sync flow against an in-memory Drive: device 1 pushes, device 2 pulls, offline run on device 1 syncs later
  const keep={state,DRV,Drive,ds:Object.assign({},DS)};const savedSave=window.storeSave,savedCfg=window.drvSaveCfg,savedChip=window.renderDriveChip;
  let cfgRaw=null;try{cfgRaw=localStorage.getItem(DRV_KEY);}catch(_){}
  window.drvSaveCfg=()=>{};window.renderDriveChip=()=>{};
  try{const mock=mockDrive();Drive=mock;window.storeSave=()=>{};
    const root=(await mock.mkdir('root','DrumPath')).id;
    DRV={folderId:root};state=normaliseState(JSON.parse(JSON.stringify(A)));DS.dirty=true;DS.busy=false;await syncNow({test:true});
    const fnames=Object.values(mock.files).map(f=>f.name);
    T('Creates backup/, snapshots/, midi/, songs/ and drumpath-state.json',['backup','snapshots','midi','songs',STATE_FILE].every(x=>fnames.includes(x)),fnames.join(', '));
    T('Writes a dated snapshot',fnames.includes(today()+'.json'),'');
    const dev1=DRV;
    DRV={folderId:root};state=base();DS.dirty=false;await syncNow({test:true,pull:true});
    T('Second device after choosing the folder shows the same progress',state.sessions.length===2&&state.prog['1.5.03']&&state.prog['1.5.03'].bpm===85,state.sessions.length+' runs');
    const dev2=DRV,s2=state;
    DRV=dev1;state=normaliseState(JSON.parse(JSON.stringify(A)));state.sessions.push(run(50,'2.3.01',100));state.savedAt=30;DS.dirty=true;await syncNow({test:true});
    DRV=dev2;state=s2;await syncNow({test:true});
    T('A run played on one device reaches the other',state.sessions.some(r=>r.ts===50),state.sessions.length+' runs');
    for(let i=0;i<35;i++)await mock.create(dev1.snapId,'2025-01-'+String(i+1).padStart(2,'0')+'.json','{}');DRV=dev1;DRV.lastSnapDay='';DS.dirty=true;await syncNow({test:true});
    T('Keeps only the last 30 snapshots',(await mock.list(dev1.snapId)).length===30,(await mock.list(dev1.snapId)).length+' snapshots');
  }catch(e){T('Sync flow',false,e.message);}
  finally{state=keep.state;DRV=keep.DRV;Drive=keep.Drive;Object.assign(DS,keep.ds);window.storeSave=savedSave;window.drvSaveCfg=savedCfg;window.renderDriveChip=savedChip;
    try{if(cfgRaw==null)localStorage.removeItem(DRV_KEY);else localStorage.setItem(DRV_KEY,cfgRaw);}catch(_){}renderDriveChip();}
  return out;
}
