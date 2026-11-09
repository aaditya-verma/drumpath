/* DrumPath — song model (build/songs-build-brief.md §1–§4): catalog + own songs, per-skill scores, stretch targets,
   readiness, strand roll-up, next step, daily readiness history, play-along log, library aggregates, biggest unlocks. */
'use strict';
const CAT_SONGS=SONG_CATALOG.map(([id,title,artist,genre,bpm,bpmSure,meter,core,support])=>({id,title,artist,genre,bpm,bpmSure,meter,core,support,cat:true}));
const LATER_BY=Object.fromEntries(LATER.map(l=>[l.id,l]));
const normT=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

/* ---------- state: add fields + migrate saved songs (only adds fields, never removes) ---------- */
function songStateFill(s){
  s.songs=Array.isArray(s.songs)?s.songs:[];
  if(!s.songBpm||typeof s.songBpm!=='object')s.songBpm={};
  if(!s.songHist||typeof s.songHist!=='object')s.songHist={};
  if(!s.songLog||typeof s.songLog!=='object')s.songLog={};
  if(!s.songExtra||typeof s.songExtra!=='object')s.songExtra={};
  let n=0;
  s.songs.forEach(u=>{
    if(!Array.isArray(u.tags))u.tags=[];
    if(!Array.isArray(u.core))u.core=u.tags.slice();          // plain tag list → all core
    if(!Array.isArray(u.support))u.support=[];
    if(!u.genre)u.genre='Other';
    if(!u.meter)u.meter='4/4';
    if(u.bpmSure==null)u.bpmSure=!!(+u.bpm);
    if(u.catId==null){const m=CAT_SONGS.find(c=>normT(c.title)===normT(u.title)&&(!u.artist||normT(c.artist)===normT(u.artist)));u.catId=m?m.id:'';
      if(m&&(u.link||u.notes)&&!s.songExtra[m.id])s.songExtra[m.id]={link:u.link||'',notes:u.notes||''};}
    if(!u.id){n++;u.id='u'+Date.now().toString(36)+n;}
  });
  return s;
}
songStateFill(state);

/* ---------- song list ---------- */
function allSongs(){return [...CAT_SONGS,...state.songs.filter(u=>!u.catId).map(u=>({...u,genre:u.genre||'Other',meter:u.meter||'4/4',core:Array.isArray(u.core)?u.core:(u.tags||[]),support:Array.isArray(u.support)?u.support:[],bpm:+u.bpm||0,cat:false}))];}
const SBY=()=>Object.fromEntries(allSongs().map(s=>[s.id,s]));
function songById(id){return allSongs().find(s=>s.id===id);}
function songTags(s){return [...s.core.map(id=>({id,w:2,core:true})),...s.support.filter(id=>!s.core.includes(id)).map(id=>({id,w:1,core:false}))];}
function songBpm(s){const o=state.songBpm[s.id];return o?+o:(+s.bpm||0);}
function bpmUnsure(s){return !state.songBpm[s.id]&&(!s.bpmSure||!+s.bpm);}
const lessonLevel=id=>+String(id).split('.')[0];
function songLevel(s){const t=s.core.length?s.core:s.support;return t.length?Math.max(...t.map(lessonLevel)):0;}
const tagLesson=id=>LBY[id]||LATER_BY[id]||null;
const isComing=id=>!LBY[id];

/* ---------- history context: one pass over runs, reused for every song ---------- */
// bestPass = highest BPM at which the pass rule held: 3 passing runs in a row (in that lesson's own run order), taking the
// lowest BPM of the three; a lesson mastered through the normal ladder counts as passed at its goal.
function songCtx(src){
  src=src||state;const runs={};
  (src.sessions||[]).forEach(s=>{if(LBY[s.id])(runs[s.id]=runs[s.id]||[]).push(s);});
  const ctx={runs,prog:src.prog||{},done:src.done||{},skill:{},pass:{}};
  const passed=s=>s.score>=state.set.pass&&(s.dyn==null||s.dyn>=state.set.dynPass);
  Object.entries(runs).forEach(([id,rs])=>{let best=0;for(let i=2;i<rs.length;i++){if(passed(rs[i])&&passed(rs[i-1])&&passed(rs[i-2]))best=Math.max(best,Math.min(rs[i].bpm,rs[i-1].bpm,rs[i-2].bpm));}
    const p=ctx.prog[id];if(p&&p.status==='mastered'&&LBY[id].bpm)best=Math.max(best,LBY[id].bpm[1]);ctx.pass[id]=best;});
  Object.entries(ctx.prog).forEach(([id,p])=>{if(ctx.pass[id]==null&&p&&p.status==='mastered'&&LBY[id]&&LBY[id].bpm)ctx.pass[id]=LBY[id].bpm[1];});
  return ctx;
}
// accuracy = mean timing % of the latest 5 runs (0.7 × timing + 0.3 × dynamics where dynamics are scored)
function lessonAcc(ctx,id){const rs=(ctx.runs[id]||[]).slice(-5);if(!rs.length)return null;
  return rs.reduce((a,s)=>a+(s.dyn!=null?0.7*s.score+0.3*s.dyn:s.score),0)/rs.length;}
function lessonTrend(ctx,id){const rs=ctx.runs[id]||[];if(rs.length<6)return 0;const m=a=>a.reduce((x,s)=>x+s.score,0)/a.length;const d=m(rs.slice(-5))-m(rs.slice(-10,-5));return Math.abs(d)<2?0:d>0?1:-1;}
/* ---------- per-skill score (§2) ---------- */
function skillOf(ctx,song,tag){
  const id=tag.id,l=tagLesson(id),T=songBpm(song)||(LBY[id]&&LBY[id].bpm?LBY[id].bpm[1]:0);
  const r={id,w:tag.w,core:tag.core,T,lesson:l,coming:isComing(id),score:0,status:'not',best:0,acc:null,gap:null,trend:0};
  if(r.coming){r.status='coming';return r;}
  const L_=LBY[id];
  if(L_.type!=='play'){const d=!!ctx.done[id];r.score=d?100:0;r.status=d?'ready':'not';return r;}
  const played=(ctx.runs[id]||[]).length>0;r.best=ctx.pass[id]||0;r.acc=lessonAcc(ctx,id);r.trend=lessonTrend(ctx,id);
  if(!played&&!r.best){r.status='not';return r;}
  const tempo=r.best?Math.min(1,r.best/T):0;
  r.score=Math.round(100*(0.6*tempo+0.4*((r.acc||0)/100)));
  const goal=L_.bpm[1],mastered=(ctx.prog[id]||{}).status==='mastered';
  if(r.best&&r.best>=T)r.status='ready';
  else if(mastered||r.best>=goal){r.status='passed';r.gap=r.best-T;}
  else r.status='learning';
  return r;
}
const SKILL_LABEL={ready:'Song-ready',passed:'Passed',learning:'Learning',not:'Not started',coming:'Coming'};
/* ---------- song aggregates (§4) ---------- */
function songStats(ctx,song){
  const sk=songTags(song).map(t=>skillOf(ctx,song,t));
  const W=sk.reduce((a,x)=>a+x.w,0)||1,ready=Math.round(sk.reduce((a,x)=>a+x.w*x.score,0)/W);
  const cnt=(f,core)=>sk.filter(x=>x.core===core&&f(x)).length;
  const strands={};sk.forEach(x=>{const sd=+String(x.id).split('.')[1];const g=strands[sd]||(strands[sd]={w:0,s:0});g.w+=x.w;g.s+=x.w*x.score;});
  Object.values(strands).forEach(g=>g.v=Math.round(g.s/g.w));
  let state_='learning';
  if(sk.every(x=>x.status==='not'||x.status==='coming'))state_='locked';
  else if(sk.filter(x=>x.core).every(x=>x.status==='ready')&&ready>=90)state_='ready';
  else if(ready>=60)state_='reach';
  const nx=sk.filter(x=>x.score<100).sort((a,b)=>b.w*(100-b.score)-a.w*(100-a.score)||(a.coming-b.coming))[0]||null;
  return{song,skills:sk,ready,state:state_,next:nx,W,strands,
    readyCore:cnt(x=>x.status==='ready',true),readySup:cnt(x=>x.status==='ready',false),passCore:cnt(x=>x.status==='ready'||x.status==='passed',true),passSup:cnt(x=>x.status==='ready'||x.status==='passed',false),
    nCore:sk.filter(x=>x.core).length,nSup:sk.filter(x=>!x.core).length,level:songLevel(song),unsure:bpmUnsure(song),T:songBpm(song)};
}
const SONG_STATE={ready:['Ready','var(--good)'],reach:['In reach','var(--accent)'],learning:['Learning','var(--warn)'],locked:['Locked','var(--muted)']};
function allSongStats(ctx){ctx=ctx||songCtx();return allSongs().map(s=>songStats(ctx,s));}
// stretch target for a lesson: the highest song tempo above the lesson's goal among songs tagged with it
function stretchMax(id){const l=LBY[id];if(!l||!l.bpm)return 0;let m=0;allSongs().forEach(s=>{if(songTags(s).some(t=>t.id===id)){const T=songBpm(s);if(T>l.bpm[1])m=Math.max(m,T);}});return m;}
function songsUsing(id){return allSongs().filter(s=>songTags(s).some(t=>t.id===id));}
/* ---------- library aggregates + biggest unlocks ---------- */
function libraryStats(stats){
  const by=(k)=>{const g={};stats.forEach(x=>{const key=x.song[k];(g[key]=g[key]||[]).push(x);});return g;};
  const avg=a=>a.length?Math.round(a.reduce((s,x)=>s+x.ready,0)/a.length):0;
  const counts={ready:0,reach:0,learning:0,locked:0};stats.forEach(x=>counts[x.state]++);
  const gains={};stats.forEach(x=>x.skills.forEach(k=>{if(k.coming||k.score>=100)return;const g=gains[k.id]||(gains[k.id]={id:k.id,pts:0,songs:0,core:0});g.pts+=k.w*(100-k.score)/x.W;g.songs++;if(k.core)g.core++;}));
  const unlocks=Object.values(gains).filter(g=>LBY[g.id]&&LBY[g.id].type==='play').sort((a,b)=>b.pts-a.pts);
  return{counts,avg:avg(stats),byGenre:by('genre'),byArtist:by('artist'),avgOf:avg,unlocks};
}
/* ---------- readiness history (one value per song per day it changes) ---------- */
function updateSongHist(stats){
  stats=stats||allSongStats();const d=today();let ch=false;
  stats.forEach(x=>{const h=state.songHist[x.song.id]||(state.songHist[x.song.id]=[]);const last=h[h.length-1];
    if(last&&last[1]===x.ready)return;if(!last&&x.ready===0)return;
    if(last&&last[0]===d)last[1]=x.ready;else h.push([d,x.ready]);if(h.length>365)h.splice(0,h.length-365);ch=true;});
  if(ch)save();
}
/* ---------- play-along log ---------- */
function songPlays(id){const a=state.songLog[id]||[];return{n:a.length,mins:a.reduce((s,x)=>s+(+x[1]||0),0),last:a.length?a[a.length-1][0]:null,avg:a.length?a.reduce((s,x)=>s+(+x[2]||0),0)/a.length:null};}
const artistKey=a=>String(a).replace(/^the\s+/i,'').toLowerCase();

/* ---------- test mode checks (brief §7) ---------- */
function songTests(){
  const out=[],ok=(name,pass,det)=>out.push({name,pass:!!pass,det:det||''});
  const empty={sessions:[],prog:{},done:{}};
  // 1. empty history → all Locked at 0; matrix renders every song
  const e=allSongStats(songCtx(empty)).filter(x=>x.song.cat);
  ok('Empty history: every song Locked at 0%',e.length===62&&e.every(x=>x.state==='locked'&&x.ready===0),e.length+' catalog songs');
  const mx=matrixHtml(allSongStats(songCtx(empty)),'genre');const rows=(mx.match(/data-mrow=/g)||[]).length;
  ok('Matrix renders a row per song',rows===allSongs().length,rows+' rows');
  // 2. pass of 1.5.03 at 100 → Billie Jean skill = 0.6×100/117 + 0.4×acc, Passed, −17 BPM
  const mk=(bpm,score,ts,extra)=>Object.assign({ts,id:'1.5.03',ex:0,bpm,score,on:score,n:100,ext:0,miss:0,avg:0},extra||{});
  const runs=[mk(100,95,1),mk(100,95,2),mk(100,95,3)];
  const bj=CAT_SONGS.find(s=>s.id==='s003');
  const k1=skillOf(songCtx({sessions:runs,prog:{},done:{}}),bj,{id:'1.5.03',w:2,core:true});
  const want=Math.round(100*(0.6*100/117+0.4*95/100));
  ok('1.5.03 passed at 100 → Billie Jean skill = 0.6×100/117 + 0.4×acc',k1.score===want,`score ${k1.score}, expected ${want}`);
  ok('…state Passed, gap −17 BPM',k1.status==='passed'&&k1.gap===-17,`${k1.status}, gap ${k1.gap}`);
  // 3. stretch runs up to 117 → Song-ready, lesson status unchanged
  const prog={'1.5.03':{status:'mastered',bpm:100}};const progBefore=JSON.stringify(prog);
  const st=[...runs];let t=10;for(let b=105;b<=120;b+=5)for(let i=0;i<3;i++)st.push(mk(b,95,t++,{stretch:1}));
  const k2=skillOf(songCtx({sessions:st,prog,done:{}}),bj,{id:'1.5.03',w:2,core:true});
  ok('Stretch runs to 117+ → Song-ready',k2.status==='ready',`${k2.status}, best ${k2.best}`);
  ok('…lesson status unchanged',JSON.stringify(prog)===progBefore&&prog['1.5.03'].status==='mastered');
  // 4. every tag resolves; unbuilt lessons show Coming and score 0
  const bad=[];CAT_SONGS.forEach(s=>songTags(s).forEach(t=>{if(!tagLesson(t.id))bad.push(s.id+':'+t.id);}));
  ok('Every catalog tag is a real lesson id',!bad.length,bad.join(', ')||'all resolve');
  const comingTags=e.flatMap(x=>x.skills.filter(k=>k.coming));
  ok('Unbuilt lessons show “Coming” and score 0',comingTags.length>0&&comingTags.every(k=>k.score===0&&k.status==='coming'),comingTags.length+' coming tags');
  // 5. old saved songs and progress load unchanged (migration only adds fields)
  const old={v:1,prog:{'1.2.02':{bpm:65,streak:1,best:92,bestBpm:60,attempts:4,ms:120000,status:'progress',last:5,ex:0}},sessions:[{ts:1,id:'1.2.02',ex:0,bpm:60,score:92,on:11,n:12,ext:0,miss:1,avg:-3}],
    songs:[{title:'Billie Jean',artist:'Michael Jackson',bpm:117,link:'https://x.y',tags:['1.5.03','2.4.03'],notes:'mine'},{title:'My own groove',artist:'Me',bpm:'',link:'',tags:['2.5.01'],notes:''}]};
  const before=JSON.parse(JSON.stringify(old)),mig=songStateFill(JSON.parse(JSON.stringify(old)));
  const keep=JSON.stringify(mig.prog)===JSON.stringify(before.prog)&&JSON.stringify(mig.sessions)===JSON.stringify(before.sessions)&&mig.songs.length===2&&
    mig.songs.every((u,i)=>Object.entries(before.songs[i]).every(([k,v])=>JSON.stringify(u[k])===JSON.stringify(v)));
  ok('Old saved songs and progress load unchanged (fields only added)',keep);
  ok('…plain tag lists become core, ids added, catalog matches linked',mig.songs[1].core.join()==='2.5.01'&&mig.songs.every(u=>u.id)&&mig.songs[0].catId==='s003'&&mig.songs[1].catId==='',`catIds: ${mig.songs.map(u=>u.catId||'–').join(', ')}`);
  return out;
}
window.songTests=songTests;
