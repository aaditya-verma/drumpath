/* DrumPath — saved state, cloud sync, helpers */
'use strict';
/* ============ STATE ============ */
const KEY='drumpath.v1';
const DEF_SET={tol:30,win:120,pass:90,dynPass:80,hhMode:'auto',hhOpenCC:40,hhLowOpen:true,graceMode:'scored',scoreArt:true,bars:4,vol:0.7,subclick:false,countin:1,pads:true};
let state;
function freshState(){return{v:1,map:{...DEFAULT_MAP},art:{...DEFAULT_ART},lat:0,set:{...DEF_SET},prog:{},done:{},sessions:[],days:{},songs:[],savedAt:0};}
function loadLocal(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s);}catch(e){}return null;}
state=Object.assign(freshState(),loadLocal()||{});
state.set=Object.assign({...DEF_SET},state.set);
state.art=Object.assign({...DEFAULT_ART},state.art||{});
if(state.map[37]==null&&!Object.values(state.map).includes('__none'))state.map[37]='S';
let cloud=null, saveT=null, saving=false, dirty=false;
function save(){
  state.savedAt=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  if(cloud){clearTimeout(saveT);saveT=setTimeout(pushCloud,2500);}
}
async function pushCloud(){
  if(!cloud)return; if(saving){dirty=true;return;}
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
    if(data&&data.v&&(data.savedAt||0)>(state.savedAt||0)){state=Object.assign(freshState(),data);state.set=Object.assign({...DEF_SET},state.set);try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){} render();}
    else pushCloud();
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
function songReady(s){const t=s.tags.filter(id=>LBY[id]);if(!t.length)return 0;return t.filter(id=>statusOf(LBY[id])==='ms').length/t.length;}

