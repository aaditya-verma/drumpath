/* DrumPath — saved state, cloud sync, helpers */
'use strict';
/* ============ STATE ============ */
const KEY='drumpath.v1';
const DEF_SET={tol:30,win:120,pass:90,dynPass:80,hhMode:'auto',hhOpenCC:40,hhLowOpen:true,graceMode:'scored',scoreArt:true,bars:4,vol:0.7,subclick:false,countin:1,pads:true,cacheMB:500,nview:'both',thVoice:false,thKon:false,thPanel:'smart',planMode:'',planMins:20};
let state;
function freshState(){return{v:1,map:{...DEFAULT_MAP},art:{...DEFAULT_ART},lat:0,set:{...DEF_SET},prog:{},done:{},sessions:[],days:{},songs:[],savedAt:0,theory:{cards:{},review:{},bookmarks:[],lastCard:null},plan:{days:{},act:{},rev:{}},journal:{},remote:{on:true,onAt:0,map:{}},time:{gap:{}},reflect:{badges:{},weeks:{},seenAt:0},guide:{tours:{},tips:{},hints:false,hintsAt:0,seenVer:0}};}
/* Theory (T2, D-030): per-card statuses, Remember-deck review queue, bookmarks. Only new fields; back-filled on load. */
function thFill(s){let t=s.theory;if(!t||typeof t!=='object'||Array.isArray(t))t=s.theory={};if(!t.cards||typeof t.cards!=='object')t.cards={};if(!t.review||typeof t.review!=='object')t.review={};if(!Array.isArray(t.bookmarks))t.bookmarks=[];if(!('lastCard' in t))t.lastCard=null;if(!t.skips||typeof t.skips!=='object')t.skips={};if(!t.auto||typeof t.auto!=='object')t.auto={};if(!Array.isArray(t.plog))t.plog=[];if(!t.fails||typeof t.fails!=='object')t.fails={};
  /* P1b (D-038): Quick-look lookups and wrong answers {card:[ts…]} (last 20 each), primers shown once {card:ts} */
  ['look','miss','primed'].forEach(f=>{if(!t[f]||typeof t[f]!=='object'||Array.isArray(t[f]))t[f]={};});return s;}
/* P1 daily plan (D-035): today's plans per mode, activity days for the gentle streak, the lesson review queue (P-2),
   and the one-line journal. Only new fields; back-filled on load (s may be a partial object). */
function p1Fill(s){let p=s.plan;if(!p||typeof p!=='object'||Array.isArray(p))p=s.plan={};if(!p.days||typeof p.days!=='object')p.days={};if(!p.act||typeof p.act!=='object')p.act={};if(!p.rev||typeof p.rev!=='object')p.rev={};
  if(!p.revise||typeof p.revise!=='object'||Array.isArray(p.revise))p.revise={};   // P1b: {day:[card…]} = that day's Revise slot
  if(!s.journal||typeof s.journal!=='object'||Array.isArray(s.journal))s.journal={};kpFill(s);if(typeof tfFill==='function')tfFill(s);if(typeof rfFill==='function')rfFill(s);if(typeof gdFill==='function')gdFill(s);return s;}   // P3 ladders, P4 reflection, G1 guide
/* P2 kit remote (D-040): learned pad shortcuts, synced: {on, onAt, map:{action:{n:[note…], at}}}. Nothing is mapped until it
   is learned on the kit (RULES C4: no pad note is measured yet). Only new fields; back-filled on load (via p1Fill). */
function kpFill(s){let r=s.remote;if(!r||typeof r!=='object'||Array.isArray(r))r=s.remote={on:true,onAt:0,map:{}};if(typeof r.on!=='boolean')r.on=true;if(!r.onAt)r.onAt=0;
  if(!r.map||typeof r.map!=='object'||Array.isArray(r.map))r.map={};Object.keys(r.map).forEach(k=>{const x=r.map[k];if(!x||!Array.isArray(x.n))r.map[k]={n:[],at:(x&&x.at)||0};});return s;}
function loadLocal(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
state=Object.assign(freshState(),loadLocal()||{});
state.set=Object.assign({...DEF_SET},state.set);
state.art=Object.assign({...DEFAULT_ART},state.art||{});
thFill(state);p1Fill(state);
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
  state.savedAt=Date.now();state.rev=Math.max(state.rev||0,(typeof STORE!=='undefined'&&STORE.rev)||0)+1;   // v35: always above the stored copy this tab knows (import / reset included)
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
    if(data&&data.v&&(data.savedAt||0)>(state.savedAt||0)){state=Object.assign(freshState(),data);state.set=Object.assign({...DEF_SET},state.set);thFill(state);p1Fill(state);if(typeof songStateFill==='function')songStateFill(state);save();render();}
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

