/* DrumPath — saved state, cloud sync, helpers */
'use strict';
/* ============ STATE ============ */
const KEY='drumpath.v1';
const DEF_SET={tol:30,win:120,pass:90,dynPass:80,hhMode:'auto',hhOpenCC:40,hhLowOpen:true,graceMode:'scored',scoreArt:true,bars:4,vol:0.7,subclick:false,countin:1,pads:true,cacheMB:500};
let state;
function freshState(){return{v:1,map:{...DEFAULT_MAP},art:{...DEFAULT_ART},lat:0,set:{...DEF_SET},prog:{},done:{},sessions:[],days:{},songs:[],savedAt:0};}
function loadLocal(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
state=Object.assign(freshState(),loadLocal()||{});
state.set=Object.assign({...DEF_SET},state.set);
state.art=Object.assign({...DEFAULT_ART},state.art||{});
if(state.map[37]==null&&!Object.values(state.map).includes('__none'))state.map[37]='S';
/* Testing mode (sandbox): the app runs normally but NOTHING is written — not to this device, not to Google Drive,
   not to the Claude account. Forced by ?test=1; on by default in DrumPath on claude.ai; a switch in Settings on the tablet. */
const HOST_PAGES=/(^|\.)github\.io$/i.test(location.hostname);
const HOST_CLAUDE=location.protocol==='https:'&&!HOST_PAGES;
const SBX_KEY='drumpath.sandbox';
const SANDBOX=(()=>{const forced=/[?&]test=1\b/.test(location.search);let pref=null;try{pref=localStorage.getItem(SBX_KEY);}catch(_){}
  return forced?'test':pref==='1'?'on':pref==='0'?'':HOST_CLAUDE?'on':'';})();
let cloud=null, saveT=null, saving=false, dirty=false;
let bootReady=false,bootPending=false;
function save(){
  if(!bootReady){bootPending=true;return;}      // nothing is written until storage has loaded (02b-storage.js)
  state.savedAt=Date.now();state.rev=(state.rev||0)+1;
  if(SANDBOX)return;                              // testing mode: keep changes in memory only
  if(STORE.mode==='idb')storeSave();
  else try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  if(typeof drivePushSoon==='function')drivePushSoon();
  if(cloud){clearTimeout(saveT);saveT=setTimeout(pushCloud,2500);}
}
async function pushCloud(){
  if(!cloud||SANDBOX)return; if(saving){dirty=true;return;}
  saving=true;
  try{await cloud.set(JSON.parse(JSON.stringify(state)));}catch(e){console.warn('cloud save',e);}
  saving=false; if(dirty){dirty=false;pushCloud();}
}
(async function initCloud(){
  for(let i=0;i<50&&!(window.claude&&window.claude.use);i++) await sleep(100);
  if(!(window.claude&&window.claude.use))return;
  try{
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db||!user)return;
    const id=await user.id(); if(!id)return;
    const d=db.collection('data/users/'+id).doc('drumpath');
    let r=await d.get(); let data=r&&(typeof r.data==='function'?r.data():(r.data!==undefined?r.data:r));
    cloud=d;
    if(data&&data.v&&(data.savedAt||0)>(state.savedAt||0)){state=Object.assign(freshState(),data);state.set=Object.assign({...DEF_SET},state.set);if(typeof songStateFill==='function')songStateFill(state);save();render();}
    else if(!SANDBOX)pushCloud();
  }catch(e){console.warn('cloud',e);}
})();
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function P(id){const l=LBY[id];if(!state.prog[id])state.prog[id]={bpm:l&&l.bpm?l.bpm[0]:0,streak:0,best:0,bestBpm:0,attempts:0,ms:0,status:'new',last:0,ex:0};return state.prog[id];}
function statusOf(l){
  if(l.later)return'later';
  if(l.type!=='play')return state.done[l.id]?'ms':'new';
  const p=state.prog[l.id]; if(!p)return'new'; return p.status==='mastered'?'ms':(p.attempts?'ip':'new');
}
const today=()=>dkey(new Date());
function dkey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function addTime(id,ms){if(ms<=0)return;const p=P(id);p.ms+=ms;const k=today();state.days[k]=(state.days[k]||0)+ms;}

/* ============ UTIL ============ */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mins=ms=>Math.round(ms/60000);
function toast(t,ms=2600){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),ms);}
const chip=s=>s==='ms'?'<span class="chip ms">Done</span>':s==='ip'?'<span class="chip ip">In progress</span>':s==='later'?'<span class="chip">Coming</span>':'<span class="chip">New</span>';

