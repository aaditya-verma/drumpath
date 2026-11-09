/* DrumPath — Songs screens (build/songs-build-brief.md §5–§6): library, groups, filters, song page, matrix, tap tempo, add/edit */
'use strict';
VP.songs=VP.songs||{view:'all',st:'',genre:'',level:'',unsure:false,sort:'ready',open:{},id:null,mgroup:'genre'};
const stChip=st=>`<span class="chip" style="color:${SONG_STATE[st][1]};border-color:color-mix(in srgb,${SONG_STATE[st][1]} 45%,var(--line))">${SONG_STATE[st][0]}</span>`;
const skChip=x=>{const c={ready:'var(--good)',passed:'var(--accent)',learning:'var(--warn)',not:'var(--muted)',coming:'var(--muted)'}[x.status];
  return `<span class="chip" style="color:${c};border-color:color-mix(in srgb,${c} 45%,var(--line))">${x.status==='coming'?'Coming in Level '+lessonLevel(x.id):SKILL_LABEL[x.status]}</span>`;};
const bpmTxt=x=>x.T?(x.unsure?'≈':'')+x.T+' BPM':'BPM not set';
const tagName=id=>{const l=tagLesson(id);return l?l.t:id;};
function songCard(x){
  const h=(state.songHist[x.song.id]||[]).map(r=>r[1]);
  return `<div class="card tap" data-song="${esc(x.song.id)}"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">${ring(x.ready/100,56,6)}<div style="flex:1;min-width:0">
   <b style="font-size:17px">${esc(x.song.title)}</b><div class="mut" style="font-size:14px">${esc(x.song.artist)}</div>
   <div class="row" style="gap:6px;margin-top:6px"><span class="chip">${esc(x.song.genre)}</span><span class="chip">${bpmTxt(x)}</span><span class="chip">Level ${x.level}</span>${stChip(x.state)}</div>
   <div class="mut" style="font-size:13px;margin-top:6px">Song-ready ${x.readyCore+x.readySup}/${x.skills.length}${x.next?` · Next: <b>${x.next.id}</b> ${esc(tagName(x.next.id))}${x.next.coming?' (coming)':x.T?' → '+x.T+' BPM':''}`:''}</div></div>${h.length>1?spark(h,70,26):''}</div></div>`;
}
function filtered(stats){
  const p=VP.songs;let a=stats.filter(x=>(!p.st||x.state===p.st)&&(!p.genre||x.song.genre===p.genre)&&(!p.level||x.level===+p.level)&&(!p.unsure||x.unsure));
  if(p.view==='ready')a=a.filter(x=>x.state==='ready');
  const lp=x=>songPlays(x.song.id).last||'';
  const so={ready:(a,b)=>b.ready-a.ready||a.song.title.localeCompare(b.song.title),title:(a,b)=>a.song.title.localeCompare(b.song.title),bpm:(a,b)=>a.T-b.T,played:(a,b)=>lp(b).localeCompare(lp(a))}[p.sort]||(()=>0);
  return a.sort(so);
}
function groupBlock(key,name,items,lib){
  const open=VP.songs.open[key]!==false,avg=lib.avgOf(items),rd=items.filter(x=>x.state==='ready').length;
  return `<div class="card" style="margin-bottom:12px;padding:0;overflow:hidden"><div class="row" data-sgrp="${esc(key)}" style="padding:12px 16px;cursor:pointer;flex-wrap:nowrap">${ring(avg/100,40,5)}<div style="flex:1"><b style="font-size:17px">${esc(name)}</b><div class="mut" style="font-size:13px">${items.length} song${items.length===1?'':'s'} · ${rd} ready · avg ${avg}%</div></div><span class="mut">${open?'▾':'▸'}</span></div>
   ${open?`<div class="grid2" style="padding:0 12px 12px">${items.map(songCard).join('')}</div>`:''}</div>`;
}
function renderSongs(){
  const p=VP.songs;
  if(p.id){const s=songById(p.id);if(s)return renderSong(s);p.id=null;}
  const ctx=songCtx(),stats=allSongStats(ctx),lib=libraryStats(stats),f=filtered(stats);
  const genres=[...new Set(allSongs().map(s=>s.genre))].sort(),levels=[...new Set(stats.map(x=>x.level))].sort((a,b)=>a-b);
  const lvDone=[0,1,2,3].map(lv=>{const ls=LESSONS.filter(l=>l.lv===lv);return [lv,ls.filter(l=>statusOf(l)==='ms').length,ls.length];});
  const seg=`<div class="seg">${[['all','All'],['genre','By genre'],['artist','By artist'],['level','By level'],['ready','Ready now'],['matrix','Matrix']].map(([k,l])=>`<button class="${p.view===k?'on':''}" data-sview="${k}">${l}</button>`).join('')}</div>`;
  const filters=p.view==='matrix'?`<div class="row" style="margin:10px 0"><span class="mut">Rows grouped by</span><div class="seg">${[['genre','Genre'],['artist','Artist']].map(([k,l])=>`<button class="${p.mgroup===k?'on':''}" data-mgroup="${k}">${l}</button>`).join('')}</div></div>`:
   `<div class="row" style="margin:10px 0;gap:6px">${Object.entries(SONG_STATE).map(([k,[l]])=>`<button class="sm ${p.st===k?'pri':''}" data-sst="${k}">${l} · ${lib.counts[k]}</button>`).join('')}
    <select data-sf="genre"><option value="">All genres</option>${genres.map(g=>`<option ${p.genre===g?'selected':''}>${esc(g)}</option>`).join('')}</select>
    <select data-sf="level"><option value="">All levels</option>${levels.map(l=>`<option value="${l}" ${+p.level===l?'selected':''}>Level ${l}</option>`).join('')}</select>
    <label class="row" style="gap:6px;font-size:14px"><input type="checkbox" data-sf="unsure" ${p.unsure?'checked':''}> unsure BPM</label>
    <span class="sp"></span><select data-sf="sort">${[['ready','Sort: readiness'],['title','Sort: title'],['bpm','Sort: BPM'],['played','Sort: last played']].map(([k,l])=>`<option value="${k}" ${p.sort===k?'selected':''}>${l}</option>`).join('')}</select></div>`;
  let body='';
  if(p.view==='matrix')body=`<div class="pivot" id="matrix">${matrixHtml(stats,p.mgroup)}</div><p class="mut" style="font-size:13px">Cells: skill score (darker = higher), outlined = core skill, “·” = coming lesson. Last column = readiness; bottom row = songs each lesson unlocks (core). Tap a cell to open the lesson for that song; tap a song to open it.</p>`;
  else if(!f.length)body='<div class="card mut">No songs match these filters.</div>';
  else if(p.view==='genre'||p.view==='artist'||p.view==='level'){
    const key=p.view==='level'?x=>'Level '+x.level:x=>x.song[p.view];
    const g={};f.forEach(x=>{(g[key(x)]=g[key(x)]||[]).push(x);});
    let ks=Object.keys(g);ks.sort(p.view==='artist'?(a,b)=>artistKey(a).localeCompare(artistKey(b)):p.view==='level'?(a,b)=>parseInt(a.slice(6))-parseInt(b.slice(6)):(a,b)=>a.localeCompare(b));
    body=ks.map(k=>groupBlock(p.view+':'+k,k,g[k],lib)).join('');
  }else body=`<div class="grid2">${f.map(songCard).join('')}</div>`;
  const top3=lib.unlocks.slice(0,3);
  view.innerHTML=`<h1>Songs</h1><p class="sub">${allSongs().length} songs to play along to your own audio. Readiness comes from the lessons each song uses: tempo reached (up to the song’s BPM) and recent accuracy, core skills counting double.</p>
   <div class="hero-stats">
    <div class="card stat"><div class="k">Library readiness</div><div class="row" style="flex-wrap:nowrap">${ring(lib.avg/100,58,7)}<div class="d">${lib.counts.ready} ready · ${lib.counts.reach} in reach<br>${lib.counts.learning} learning · ${lib.counts.locked} locked</div></div></div>
    <div class="card stat"><div class="k">Curriculum</div><div class="v">${LESSONS.filter(l=>statusOf(l)==='ms').length}<small>/ ${LESSONS.length} lessons</small></div><div class="d">${lvDone.map(([lv,d,n])=>`L${lv} ${d}/${n}`).join(' · ')}</div></div>
    <div class="card stat" style="grid-column:span 2"><div class="k">Biggest unlocks</div>${top3.length?top3.map(u=>`<div class="row" style="margin-top:6px;flex-wrap:nowrap;cursor:pointer" data-open="${u.id}"><b>${u.id}</b><span style="flex:1">${esc(tagName(u.id))}</span><span class="mut" style="font-size:13px">raises ${u.songs} song${u.songs===1?'':'s'}</span></div>`).join(''):'<div class="d">Play a few lessons to see which ones open the most songs.</div>'}</div>
   </div>
   <div class="row" style="margin-top:16px">${seg}<span class="sp"></span><button class="pri" data-songedit="">+ Add song</button></div>
   ${filters}${TEST?songTestBanner():''}${body}`;
  view.querySelectorAll('[data-mcell]').forEach(td=>td.addEventListener('click',e=>{e.stopPropagation();const [sid,lid]=td.dataset.mcell.split('|');if(LBY[lid])openLesson(lid,sid);else toast(lid+' is coming in Level '+lessonLevel(lid));}));
  view.querySelectorAll('[data-mrow]').forEach(th=>th.addEventListener('click',()=>go('songs',{id:th.dataset.mrow},{keep:true})));
}
function matrixHtml(stats,group){
  const cols=[...new Set(stats.flatMap(x=>x.skills.map(k=>k.id)))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const lvls=[...new Set(cols.map(lessonLevel))];
  const unlock=id=>allSongs().filter(s=>s.core.includes(id)).length;
  const g={};stats.forEach(x=>{const k=x.song[group]||'Other';(g[k]=g[k]||[]).push(x);});
  const ks=Object.keys(g).sort(group==='artist'?(a,b)=>artistKey(a).localeCompare(artistKey(b)):(a,b)=>a.localeCompare(b));
  let h=`<table class="mtx"><thead><tr><th class="rh"></th>${lvls.map(lv=>`<th colspan="${cols.filter(c=>lessonLevel(c)===lv).length}" style="text-align:center">Level ${lv}</th>`).join('')}<th></th></tr>
   <tr><th class="rh">Song</th>${cols.map(c=>`<th title="${esc(c+' '+tagName(c))}" class="vh"><span>${c}</span></th>`).join('')}<th class="n">Ready</th></tr></thead><tbody>`;
  ks.forEach(k=>{h+=`<tr class="gh"><th class="rh" colspan="1">${esc(k)}</th><td colspan="${cols.length+1}"></td></tr>`;
    g[k].sort((a,b)=>a.song.title.localeCompare(b.song.title)).forEach(x=>{const by=Object.fromEntries(x.skills.map(s=>[s.id,s]));
      h+=`<tr><th class="rh" data-mrow="${esc(x.song.id)}" style="cursor:pointer">${esc(x.song.title)}</th>${cols.map(c=>{const s=by[c];if(!s)return '<td></td>';
        const bg=s.coming?'transparent':`color-mix(in srgb,var(--accent) ${Math.round(6+s.score*0.7)}%,var(--L1))`;
        return `<td class="cell" data-mcell="${esc(x.song.id)}|${c}" title="${esc(x.song.title)} · ${c} ${esc(tagName(c))}: ${s.coming?'coming':s.score}" style="background:${bg};${s.core?'box-shadow:inset 0 0 0 2px var(--ink);':''}color:${s.score>60?'var(--accent-ink)':'var(--ink)'}">${s.coming?'·':s.score}</td>`;}).join('')}<td class="n"><b>${x.ready}%</b></td></tr>`;});});
  h+=`<tr class="foot"><th class="rh">Unlocks</th>${cols.map(c=>`<td class="n">${unlock(c)}</td>`).join('')}<td></td></tr></tbody></table>`;
  return h;
}
function songTestBanner(){const t=songTests();const bad=t.filter(x=>!x.pass);
  return `<div class="card" style="border:1px solid ${bad.length?'var(--warn)':'var(--accent)'};margin:10px 0"><b>Test mode · song checks: ${bad.length?bad.length+' failing':'all '+t.length+' pass ✓'}</b>${t.map(x=>`<div style="font-size:13px">${x.pass?'✓':'✗'} ${esc(x.name)} <span class="mut">${esc(x.det)}</span></div>`).join('')}</div>`;}
/* ---------- song page ---------- */
function renderSong(song){
  const ctx=songCtx(),x=songStats(ctx,song),pl=songPlays(song.id),hist=state.songHist[song.id]||[];
  const ex=song.cat?(state.songExtra[song.id]||{}):song;
  const strandBars=Object.entries(x.strands).sort((a,b)=>a[0]-b[0]).map(([sd,g])=>`<div class="row" style="flex-wrap:nowrap;gap:8px;margin:4px 0"><span style="width:150px;font-size:14px">${sd}. ${STRANDS[sd]}</span><div class="bar" style="flex:1"><i style="width:${g.v}%"></i></div><b class="num" style="width:40px;text-align:right">${g.v}</b></div>`).join('');
  const rows=x.skills.map(k=>{const p5=(ctx.runs[k.id]||[]).slice(-5);const t5=p5.length?Math.round(p5.reduce((a,s)=>a+s.score,0)/p5.length):null;
    const pb=LBY[k.id]&&LBY[k.id].type==='play'?Math.max(LBY[k.id].bpm[0],Math.min(Math.max(x.T||0,LBY[k.id].bpm[1]),(k.best||((state.prog[k.id]||{}).bpm||LBY[k.id].bpm[0]-5))+5)):0;
    return `<tr><td><span class="idx">${k.id}</span> ${k.coming?esc(tagName(k.id)):`<a href="#" data-openctx="${k.id}">${esc(tagName(k.id))}</a>`}</td><td>${k.core?'<b>core</b>':'support'}</td><td>${skChip(k)}</td>
      <td style="min-width:110px"><div class="row" style="flex-wrap:nowrap;gap:6px"><div class="bar" style="flex:1"><i style="width:${k.score}%"></i></div><span class="num">${k.score}</span></div></td>
      <td class="n">${k.coming?'–':(k.best||'–')+' / '+(k.T||'–')}${k.status==='passed'&&k.gap!=null?`<div style="font-size:12px;color:var(--warn)">${k.gap} BPM</div>`:''}</td><td class="n">${t5!=null?t5+'%':'–'}</td><td>${k.trend>0?'<span style="color:var(--good)">▲</span>':k.trend<0?'<span style="color:var(--bad)">▼</span>':'<span class="mut">–</span>'}</td>
      <td>${pb?`<button class="sm" data-splay="${k.id}" data-sbpm="${pb}" data-ssong="${esc(song.id)}">${icon('play',13)} ${pb}</button>`:''}</td></tr>`;}).join('');
  view.innerHTML=crumbs([['Songs',{id:null}],[song.genre,null]]).replace(/data-crumb=/g,'data-scrumb=')+
  `<div class="row" style="align-items:center;flex-wrap:nowrap;gap:16px;margin:6px 0">${ring(x.ready/100,86,9)}<div style="min-width:0"><h1 style="margin:0">${esc(song.title)}</h1><div class="mut">${esc(song.artist)}</div>
    <div class="row" style="gap:6px;margin-top:8px">${stChip(x.state)}<span class="chip">${esc(song.genre)}</span><span class="chip">Level ${x.level}</span><span class="chip">${esc(song.meter||'4/4')}</span><span class="chip">${bpmTxt(x)}</span>${x.unsure||!x.T?`<button class="sm" data-tap="${esc(song.id)}">Tap tempo</button>`:''}${state.songBpm[song.id]?`<button class="sm ghost" data-untap="${esc(song.id)}">Use catalog BPM</button>`:''}</div></div></div>
  <div class="hero-stats" style="margin-top:12px">
   <div class="card stat"><div class="k">Readiness</div><div class="v">${x.ready}<small>%</small></div><div class="d">${hist.length>1?spark(hist.map(r=>r[1]),120,28)+'<br>since '+hist[0][0]:'history builds as you practise'}</div></div>
   <div class="card stat"><div class="k">Song-ready skills</div><div class="v">${x.readyCore+x.readySup}<small>/ ${x.skills.length}</small></div><div class="d">core ${x.readyCore}/${x.nCore} · support ${x.readySup}/${x.nSup}</div></div>
   <div class="card stat"><div class="k">Passed skills</div><div class="v">${x.passCore+x.passSup}<small>/ ${x.skills.length}</small></div><div class="d">core ${x.passCore}/${x.nCore} · support ${x.passSup}/${x.nSup}</div></div>
   <div class="card stat"><div class="k">Played along</div><div class="v">${pl.n}<small>× · ${Math.round(pl.mins)} min</small></div><div class="d">${pl.last?'last '+pl.last+(pl.avg?' · avg '+pl.avg.toFixed(1)+'★':''):'not logged yet'}</div></div>
  </div>
  ${x.next?`<div class="card" style="margin-top:12px"><span class="note-k" style="color:var(--accent)">Next step</span><div style="font-size:17px;margin-top:4px"><b>${x.next.id}</b> ${esc(tagName(x.next.id))}${x.next.coming?' — coming in Level '+lessonLevel(x.next.id):x.T?' → '+x.T+' BPM':''}</div></div>`:''}
  <h2>Skills</h2><div class="list" style="overflow-x:auto"><table><tr><th>Lesson</th><th>Weight</th><th>Status</th><th>Skill</th><th class="n">Best / target</th><th class="n">Last 5</th><th>Trend</th><th></th></tr>${rows}</table></div>
  <h2>By strand</h2><div class="card">${strandBars}</div>
  <h2>Play-along log</h2><div class="card"><p class="mut" style="margin-top:0">Played it along to the record? Log it: plays count separately from readiness.</p>
   <div class="row"><label class="row" style="gap:6px">Minutes <input type="number" id="lgm" value="4" min="1" style="width:80px"></label><span>Rating</span><div class="seg" id="lgr">${[1,2,3,4,5].map(n=>`<button class="${n===3?'on':''}" data-rate="${n}">${n}★</button>`).join('')}</div><button class="pri" data-logplay="${esc(song.id)}">Log a play</button></div>
   ${(state.songLog[song.id]||[]).length?`<table style="margin-top:10px"><tr><th>Date</th><th class="n">Minutes</th><th>Rating</th></tr>${[...state.songLog[song.id]].reverse().slice(0,10).map(r=>`<tr><td>${r[0]}</td><td class="n">${r[1]}</td><td>${'★'.repeat(r[2])}</td></tr>`).join('')}</table>`:''}</div>
  <h2>Notes &amp; link</h2><div class="card">${ex.link?`<a href="${esc(ex.link)}" target="_blank" rel="noopener">Open the track ↗</a>`:'<span class="mut">No link yet.</span>'}${ex.notes?`<p>${esc(ex.notes)}</p>`:''}<div class="row" style="margin-top:8px"><button class="sm" data-songedit="${esc(song.id)}">${song.cat?'Edit link & notes':'Edit song'}</button>${song.cat?'':`<button class="sm ghost" data-songdel="${esc(song.id)}">Delete</button>`}</div></div>`;
}
/* ---------- tap tempo ---------- */
function tapTempo(id){
  const s=songById(id);let taps=[];
  const m=openSheet('Tap tempo',`<p class="mut">Play <b>${esc(s.title)}</b> and tap the big button on every beat (the pulse you count: quarter notes, or dotted quarters in 6/8 and 12/8). 8 taps or more.</p>
   <button id="tapb" class="pri" style="width:100%;font-size:28px;padding:40px">Tap</button><div class="row" style="margin-top:12px"><span class="big num" id="tapv">–</span><span class="mut" id="tapn">0 taps</span><span class="sp"></span><button id="tapr">Reset</button><button class="pri" id="taps" disabled>Save</button></div>`);
  const calc=()=>{if(taps.length<2)return 0;const d=[];for(let i=1;i<taps.length;i++)d.push(taps[i]-taps[i-1]);const md=median(d.slice(-12));return Math.round(60000/md);};
  $('#tapb',m).addEventListener('pointerdown',e=>{e.preventDefault();const t=performance.now();if(taps.length&&t-taps[taps.length-1]>2500)taps=[];taps.push(t);const b=calc();$('#tapv',m).textContent=b||'–';$('#tapn',m).textContent=taps.length+' taps';$('#taps',m).disabled=taps.length<8;});
  $('#tapr',m).onclick=()=>{taps=[];$('#tapv',m).textContent='–';$('#tapn',m).textContent='0 taps';$('#taps',m).disabled=true;};
  $('#taps',m).onclick=()=>{const b=calc();if(b<30||b>320){toast('That tempo looks off; tap again');return;}state.songBpm[id]=b;save();m.remove();updateSongHist();render();toast('Tempo saved: '+b+' BPM');};
}
/* ---------- add / edit ---------- */
function songForm(id){
  const s=id?songById(id):null;
  if(s&&s.cat){const ex=state.songExtra[id]||{};
    const m=openSheet('Link & notes · '+esc(s.title),`<label class="f">Link to the track</label><input id="s_l" value="${esc(ex.link||'')}" placeholder="https://…"><label class="f">Notes</label><textarea id="s_n" rows="3">${esc(ex.notes||'')}</textarea><div class="row" style="margin-top:12px"><button class="pri" id="s_save">Save</button></div>`);
    $('#s_save',m).onclick=()=>{let l=$('#s_l',m).value.trim();if(l&&!/^https?:\/\//.test(l))l='https://'+l;state.songExtra[id]={link:l,notes:$('#s_n',m).value.trim()};save();m.remove();render();};return;}
  const u=s?state.songs.find(x=>x.id===id):{title:'',artist:'',genre:'',bpm:'',meter:'4/4',link:'',notes:'',core:[],support:[]};
  const pick={};(u.core||[]).forEach(t=>pick[t]='core');(u.support||[]).forEach(t=>{if(!pick[t])pick[t]='support';});
  const genres=[...new Set(allSongs().map(x=>x.genre))].sort();
  const all=[...LESSONS.filter(l=>l.type==='play'),...LATER];
  const m=openSheet((s?'Edit':'Add')+' song',`<div class="grid"><div><label class="f">Title</label><input id="s_t" value="${esc(u.title)}"></div><div><label class="f">Artist</label><input id="s_a" value="${esc(u.artist)}"></div>
   <div><label class="f">Genre</label><input id="s_g" list="s_gl" value="${esc(u.genre==='Other'?'':u.genre)}" placeholder="pick or type"><datalist id="s_gl">${genres.map(g=>`<option value="${esc(g)}">`).join('')}</datalist></div>
   <div><label class="f">BPM (the pulse you count)</label><div class="row" style="flex-wrap:nowrap"><input id="s_b" type="number" value="${esc(u.bpm)}" style="flex:1"><button class="sm" id="s_tap">Tap</button></div></div>
   <div><label class="f">Meter / feel</label><input id="s_m" value="${esc(u.meter||'4/4')}"></div><div><label class="f">Link (optional)</label><input id="s_l" value="${esc(u.link||'')}" placeholder="https://…"></div></div>
   <label class="f">Lessons used — tap to cycle: none → core (needed, ×2) → support (×1)</label><input id="s_q" placeholder="Filter lessons, e.g. 2.5 or fill" style="width:100%;margin-bottom:6px">
   <div id="s_tags" style="max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:4px 8px">${all.map(l=>`<div class="row s_tr" data-q="${esc((l.id+' '+l.t).toLowerCase())}" style="padding:4px 0;flex-wrap:nowrap"><button class="sm" data-pick="${l.id}" style="min-width:86px">${pick[l.id]||'—'}</button><span class="idx">${l.id}</span><span>${esc(l.t)}${l.later?' <span class="mut">(coming)</span>':''}</span></div>`).join('')}</div>
   <label class="f">Notes</label><textarea id="s_n" rows="2">${esc(u.notes||'')}</textarea>
   <div class="row" style="margin-top:12px"><button class="pri" id="s_save">Save</button></div>`);
  m.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.pick;pick[k]=!pick[k]?'core':pick[k]==='core'?'support':'';b.textContent=pick[k]||'—';b.classList.toggle('pri',pick[k]==='core');}));
  m.querySelectorAll('[data-pick]').forEach(b=>b.classList.toggle('pri',pick[b.dataset.pick]==='core'));
  $('#s_q',m).addEventListener('input',e=>{const q=e.target.value.toLowerCase();m.querySelectorAll('.s_tr').forEach(r=>r.style.display=!q||r.dataset.q.includes(q)?'':'none');});
  $('#s_tap',m).onclick=()=>{let taps=[];toast('Tap the Tap button on every beat');const b=$('#s_tap',m);b.onclick=null;b.textContent='Tap ●';b.addEventListener('pointerdown',e=>{e.preventDefault();const t=performance.now();if(taps.length&&t-taps[taps.length-1]>2500)taps=[];taps.push(t);if(taps.length>=8){const d=[];for(let i=1;i<taps.length;i++)d.push(taps[i]-taps[i-1]);$('#s_b',m).value=Math.round(60000/median(d.slice(-12)));}b.textContent='Tap ● '+taps.length;});};
  $('#s_save',m).onclick=()=>{const t=$('#s_t',m).value.trim();if(!t){toast('Add a title');return;}
    const core=Object.keys(pick).filter(k=>pick[k]==='core'),sup=Object.keys(pick).filter(k=>pick[k]==='support');
    let l=$('#s_l',m).value.trim();if(l&&!/^https?:\/\//.test(l))l='https://'+l;
    const o=Object.assign(s?u:{id:'u'+Date.now().toString(36),catId:''},{updatedAt:Date.now(),title:t,artist:$('#s_a',m).value.trim(),genre:$('#s_g',m).value.trim()||'Other',bpm:$('#s_b',m).value,bpmSure:!!+$('#s_b',m).value,meter:$('#s_m',m).value.trim()||'4/4',link:l,notes:$('#s_n',m).value.trim(),core,support:sup,tags:[...core,...sup]});
    if(!s)state.songs.push(o);save();m.remove();updateSongHist();if(!s)go('songs',{id:o.id},{keep:true});else render();};
}
