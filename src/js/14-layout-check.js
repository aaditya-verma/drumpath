/* DrumPath — layout check (?test=1 › Settings › Check layout, and the headless build check).
   Finds, on the current screen: text that overlaps other text, text cut off or spilling out of its box,
   and anything that makes the page wider than the screen (outside areas meant to scroll sideways). */
'use strict';
function layoutAudit(root){
  root=root||document.body;const issues=[],W=document.documentElement.clientWidth;
  const vis=el=>{const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
  const scrollsX=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll')return p;}return null;};
  const name=el=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;const c=[...el.classList].slice(0,2).join('.');if(c)s+='.'+c;const t=(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,28);return s+(t?' “'+t+'”':'');};
  // text boxes: one rect per text node line
  const boxes=[];const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  // clip each text box to every scrolling/clipping ancestor, so text scrolled out of sight doesn't count
  const clipTo=(el,r)=>{let L=r.left,T=r.top,R=r.right,B=r.bottom;for(let p=el;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);
      if(s.overflowX!=='visible'||s.overflowY!=='visible'){const q=p.getBoundingClientRect();L=Math.max(L,q.left);T=Math.max(T,q.top);R=Math.min(R,q.right);B=Math.min(B,q.bottom);}}
    return R-L>1&&B-T>1?{left:L,top:T,right:R,bottom:B}:null;};
  let n;while((n=tw.nextNode())){const el=n.parentElement;if(!el||!vis(el)||el.closest('svg,textarea,select,.pat,[data-layout-skip]'))continue;
    const rg=document.createRange();rg.selectNodeContents(n);for(const r0 of rg.getClientRects()){if(r0.width<2||r0.height<2)continue;const r=clipTo(el,r0);if(r)boxes.push({el,r,clip:scrollsX(el)});}}
  // 1. text overlapping other text (different elements, not nested)
  const seen=new Set();
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el))continue;
    const x=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),y=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
    if(x>2&&y>3){const pa=getComputedStyle(a.el).position,pb=getComputedStyle(b.el).position;if(pa==='fixed'||pb==='fixed'||pa==='sticky'||pb==='sticky')continue;
      const k=name(a.el)+'|'+name(b.el);if(!seen.has(k)){seen.add(k);issues.push({kind:'overlap',what:name(a.el)+'  ⟷  '+name(b.el)});}}}
  // 2. text spilling out of its own box (no wrapping, not ellipsised, not inside a sideways-scroll area)
  root.querySelectorAll('*').forEach(el=>{if(!vis(el)||el.closest('svg,textarea,select,input,.pat,[data-layout-skip]'))return;const s=getComputedStyle(el);
    if(![...el.childNodes].some(c=>c.nodeType===3&&c.textContent.trim()))return;
    if(el.scrollWidth>el.clientWidth+2&&s.overflowX==='visible'&&s.textOverflow!=='ellipsis'&&el.clientWidth>0&&s.display!=='inline')issues.push({kind:'spill',what:name(el)+' needs '+el.scrollWidth+'px, has '+el.clientWidth+'px'});});
  // 3. page wider than the screen
  if(document.documentElement.scrollWidth>W+1){const wide=[...root.querySelectorAll('*')].filter(el=>vis(el)&&!scrollsX(el)&&el.getBoundingClientRect().right>W+1&&getComputedStyle(el).position!=='fixed');
    const top=wide.filter(el=>!wide.some(o=>o!==el&&o.contains(el))).slice(0,4);issues.push({kind:'page-wider',what:'page is '+document.documentElement.scrollWidth+'px on a '+W+'px screen: '+top.map(name).join(', ')});}
  // 4. content cut off at the screen edge inside a card that doesn't scroll
  root.querySelectorAll('.card').forEach(c=>{if(!vis(c))return;const r=c.getBoundingClientRect();if(r.right>W+1&&!scrollsX(c))issues.push({kind:'cut',what:name(c)+' runs past the screen edge'});});
  return issues;
}
function layoutReport(){const is=layoutAudit(view);const box=openSheet('Layout check',is.length?`<p class="mut">${is.length} problem${is.length===1?'':'s'} on this screen at ${innerWidth}×${innerHeight}:</p>${is.map(i=>`<div style="font-size:13px;margin:4px 0"><b>${i.kind}</b> ${esc(i.what)}</div>`).join('')}`:`<p>No overlaps or cut-off text on this screen at ${innerWidth}×${innerHeight}. ✓</p>`);return is;}

// every screen on this device, at its current size and orientation
async function layoutSweep(){
  const keep={cur,vp:JSON.stringify({lessons:VP.lessons,songs:VP.songs,progress:VP.progress})};const out=[];const wait=()=>new Promise(r=>setTimeout(r,120));
  const firstSong=allSongs()[0],lesson=LESSONS.find(l=>l.type==='play');
  const screens=[['Home',()=>go('home')],['Practise',()=>go('practise')],['Skill map',()=>go('lessons',{lv:null,sd:null,id:null})],['Level 3',()=>go('lessons',{lv:3,sd:null,id:null},{keep:true})],
    ['A lesson',()=>openLesson(lesson.id)],['Progress',()=>go('progress')],['Songs',()=>go('songs',{view:'all',id:null})],['Song matrix',()=>go('songs',{view:'matrix',id:null})],
    ['A song',()=>go('songs',{id:firstSong.id})],['Compare',()=>go('compare')],['Studio',()=>go('studio')],['Kit',()=>go('kit')],['Settings',()=>go('settings')]];
  for(const [n,f] of screens){try{f();await wait();out.push([n,layoutAudit(view)]);}catch(e){out.push([n,[{kind:'error',what:e.message}]]);}}
  // header: everything in the brand row must stay on one line
  {const row=document.querySelector('.brand-row');const kids=row?[...row.children].filter(e=>e.offsetParent&&e.getBoundingClientRect().width>0):[];
   const tops=kids.map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2;});const bad=tops.length&&Math.max(...tops)-Math.min(...tops)>8;
   out.push(['Header',bad?[{kind:'wrap',what:'header buttons wrap onto a second line'}]:[]]);}
  try{openPractice(lesson.id);await wait();out.push(['Practice screen',layoutAudit($('#prac'))]);}catch(e){}
  $('#prac').classList.add('hidden');
  const v=JSON.parse(keep.vp);Object.assign(VP.lessons,v.lessons);Object.assign(VP.songs,v.songs);Object.assign(VP.progress,v.progress);go(keep.cur==='practise'?'settings':'settings');
  return out;
}
