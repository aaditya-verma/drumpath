/* DrumPath — app shell: theme, navigation (rail / bottom bar / More sheet), back stack, header, sheets, search */
'use strict';
/* ---------- theme ---------- */
const TH={};
const THEME_KEY='drumpath-theme';
function themeMode(){try{return localStorage.getItem(THEME_KEY)||'system';}catch(e){return 'system';}}
function applyTheme(){
  const m=themeMode(); const dark=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme=dark?'dark':'light';
  const cs=getComputedStyle(document.documentElement), g=k=>cs.getPropertyValue(k).trim();
  Object.assign(TH,{bg:g('--bg'),surface:g('--surface'),ink:g('--ink'),muted:g('--muted'),line:g('--line'),accent:g('--accent'),good:g('--good'),warn:g('--warn'),bad:g('--bad'),blue:g('--blue'),
    lane1:g('--lane1'),lane2:g('--lane2'),grid:g('--grid'),gridBar:g('--grid-bar'),hitline:g('--hitline'),missed:g('--missed'),
    body:'"Figtree",system-ui,sans-serif',display:'"Big Shoulders Display","Arial Narrow",sans-serif',dark});
  LANES.forEach(v=>{VOICES[v].c=g('--p-'+v)||VOICES[v].c;});
  const b=$('#themebtn');if(b)b.innerHTML=icon(dark?'sun':'moon',16)+'<span class="lb">'+(dark?'Light':'Dark')+'</span>';
  if(b)b.title='Theme: '+({system:'follow device',light:'light',dark:'dark'}[m]);
}
function cycleTheme(){const dark=document.documentElement.dataset.theme==='dark';try{localStorage.setItem(THEME_KEY,dark?'light':'dark');}catch(e){}applyTheme();render();if(typeof draw==='function'&&L)draw();}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(themeMode()==='system'){applyTheme();render();}});}catch(e){}

/* ---------- icons ---------- */
const ICONS={
  studio:'<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.5L12 15l-1.8-4.5L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  practise:'<circle cx="12" cy="13" r="7"/><path d="M5 13h14M12 6v14"/><path d="M4 4l4 3M20 4l-4 3"/>',
  lessons:'<path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3"/><path d="M20 5v13h-7"/>',
  progress:'<path d="M3 20h18"/><path d="M6 16v-5M11 16V7M16 16v-8M21 16V4"/>',
  songs:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  compare:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M15 9v12"/>',
  kit:'<ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9"/><path d="M2 3l6 5M22 3l-6 5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  back:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16z" fill="currentColor"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  play:'<path d="M7 4l13 8-13 8z"/>'
};
const icon=(k,sz=22)=>`<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]||''}</svg>`;
const NAVI={
  home:['Home','Streak, coach notes, recent runs'],
  practise:['Practise','Today’s plan and quick start'],
  lessons:['Lessons','Skill map, levels, every lesson'],
  progress:['Progress','Timeline, calendar, pads, records'],
  songs:['Songs','Song library, readiness and matrix'],
  compare:['Compare','Crosstab any measure'],
  kit:['Kit','Your kit, pads, kit check, latency'],
  studio:['Studio','Tag songs with lessons (Claude)'],
  settings:['Settings','Scoring, theme, backup'],
};
const PRIMARY=['home','practise','lessons','progress','songs'];
const ALLNAV=['home','practise','lessons','progress','songs','compare','studio','kit','settings'];

/* ---------- view state + back stack ---------- */
let cur='home';
const VP={
  lessons:{lv:null,sd:null,id:null},
  progress:{mode:'timeline',path:[],calY:null,calM:null,day:null,padPer:'8w'},
  compare:{r:'strand',c:'month',m:'timing',per:'all'},
  songs:{view:'all',st:'',genre:'',level:'',unsure:false,sort:'ready',open:{},id:null,mgroup:'genre'},
};
const NAV={stack:[]};
function navSnap(){return{cur,vp:VP[cur]?JSON.parse(JSON.stringify(VP[cur])):null,y:scrollY,label:viewLabel()};}
function viewLabel(){
  if(cur==='lessons'){const p=VP.lessons;if(p.id)return p.id;if(p.lv!=null)return 'Level '+p.lv+(p.sd?' · '+STRANDS[p.sd]:'');return 'Skill map';}
  if(cur==='songs'&&VP.songs.id){const s=songById(VP.songs.id);if(s)return s.title;}
  if(cur==='progress'){const p=VP.progress;return 'Progress'+(p.path.length?' · '+periodName(p.path[p.path.length-1]):'');}
  return NAVI[cur]?NAVI[cur][0]:cur;
}
function go(view,params,opts={}){
  if(!opts.noPush){const sn=navSnap();const top=NAV.stack[NAV.stack.length-1];if(!top||top.cur!==sn.cur||JSON.stringify(top.vp)!==JSON.stringify(sn.vp))NAV.stack.push(sn);if(NAV.stack.length>20)NAV.stack.shift();}
  if(view==='lessons'&&!params&&!opts.keep)VP.lessons={lv:null,sd:null,id:null};
  if(view==='lessons'&&!(params&&params.ctx))VP.lessons.ctx=null;
  if(view==='songs'&&(params?!('id' in params):!opts.keep))VP.songs.id=null;
  if(params)Object.assign(VP[view]||(VP[view]={}),params);
  cur=view;closeMore();render();if(!opts.keepScroll)scrollTo(0,0);
}
function back(){
  const sn=NAV.stack.pop();
  if(!sn){if(cur!=='home'){cur='home';render();scrollTo(0,0);}return;}
  cur=sn.cur;if(sn.vp)VP[cur]=sn.vp;render();requestAnimationFrame(()=>scrollTo(0,sn.y||0));
}
// open a lesson from anywhere
function openLesson(id,ctx){if(!LBY[id])return;const l=LBY[id];go('lessons',{lv:l.lv,sd:l.sd,id,ctx:ctx||null},{keep:true});}

/* ---------- shell DOM ---------- */
function buildShell(){
  $('#tabs').innerHTML=ALLNAV.map(k=>`<button class="tab" data-nav="${k}" title="${NAVI[k][1]}">${NAVI[k][0]}</button>`).join('');
  $('#bnav').innerHTML=PRIMARY.map(k=>`<button class="bbtn" data-nav="${k}"><span class="nic">${icon(k)}</span>${NAVI[k][0]}</button>`).join('')+`<button class="bbtn" id="morebtn" data-act="more"><span class="nic">${icon('more')}</span>More</button>`;
  $('#searchbtn').innerHTML=icon('search',16)+'<span class="lb">Search</span>';
  document.querySelector('.dk-nav').innerHTML=icon('more',22);
}
function syncNav(){
  document.querySelectorAll('[data-nav]').forEach(b=>{if(b.classList.contains('tab')||b.classList.contains('bbtn'))b.classList.toggle('on',b.dataset.nav===cur);});
  const m=$('#morebtn');if(m)m.classList.toggle('on',!PRIMARY.includes(cur));
  const bb=$('#backb'),top=NAV.stack[NAV.stack.length-1];
  bb.innerHTML=icon('back',22);bb.title=top?'Back to '+top.label:'Home';bb.classList.toggle('dim',!top&&cur==='home');
}
function openMore(){
  const s=$('#msheet');s.innerHTML=`<div class="grip"><span></span></div><div class="h2" style="margin:0 0 12px">All sections</div><div class="mgrid">${[...ALLNAV.map(k=>`<button class="mtile" data-nav="${k}">${icon(k)}<b>${NAVI[k][0]}</b><span>${NAVI[k][1]}</span></button>`),`<button class="mtile" data-act="search">${icon('search')}<b>Search</b><span>Lessons, rudiments, songs</span></button>`].join('')}</div>`;
  s.classList.remove('hidden');$('#scrim').classList.remove('hidden');
}
function closeMore(){const s=$('#msheet');if(s){s.classList.add('hidden');$('#scrim').classList.add('hidden');}}

/* ---------- sheets ---------- */
function openSheet(title,html,opts={}){
  const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="card sheet"><div class="sheet-h"><h2>${title}</h2><span class="sp"></span><button class="icon ghost" data-close>${icon('close')}</button></div><div class="sbody">${html}</div></div>`;
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]')){m.remove();}});
  document.body.appendChild(m);if(opts.mount)opts.mount(m);return m;
}
function closeSheets(){document.querySelectorAll('.modal').forEach(m=>m.remove());}

/* ---------- search ---------- */
function openSearch(){
  const m=openSheet('Search',`<input id="sq" placeholder="Lesson, rudiment, song, e.g. “flam” or “2.3”" style="width:100%;font-size:18px;padding:12px"><div id="sres" style="margin-top:10px"></div>`);
  const q=$('#sq',m);const run_=()=>{const t=q.value.trim().toLowerCase();const r=$('#sres',m);if(!t){r.innerHTML='<p class="mut">Type to search.</p>';return;}
    const ls=[...LESSONS,...LATER].filter(l=>(l.id+' '+l.t+' '+(l.d||'')).toLowerCase().includes(t)).slice(0,30);
    const ss=allSongs().filter(s=>(s.title+' '+s.artist+' '+s.genre).toLowerCase().includes(t)).slice(0,20);
    r.innerHTML=(ls.length?`<div class="list">${ls.map(l=>`<div class="lrow ${l.later?'dim':''}" ${l.later?'':`data-open="${l.id}"`}><span class="idx">${l.id}</span><span>${esc(l.t)}</span><span class="sp"></span>${chip(statusOf(l))}</div>`).join('')}</div>`:'')+
      (ss.length?`<h2>Songs</h2><div class="list">${ss.map(s=>`<div class="lrow" data-song="${esc(s.id)}"><b>${esc(s.title)}</b><span class="mut">${esc(s.artist)}</span></div>`).join('')}</div>`:'')||'<p class="mut">Nothing found.</p>';};
  q.addEventListener('input',run_);run_();setTimeout(()=>q.focus(),50);
}

/* ---------- render ---------- */
const view=$('#view');
function render(){
  const f={home:renderHome,practise:renderPractise,lessons:renderLessons,progress:renderProgress,songs:renderSongs,compare:renderCompare,studio:renderStudio,kit:renderKit,settings:renderSettings}[cur]||renderHome;
  try{f();}catch(e){console.error(e);view.innerHTML=`<div class="card"><b>Something went wrong drawing this page.</b><p class="mut">${esc(e.message)}</p></div>`;}
  syncNav();
}
