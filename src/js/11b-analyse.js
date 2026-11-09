/* DrumPath — Analyse & tag (build/song-intelligence-brief.md §8, §1–§2, §6).
   Three routes end on one review card: 1 MIDI file (on-device midi-analyse.js) · 2 my playing (record the kit, same analyser)
   · 3 DrumPath Studio (import link with songId). Apply merges tags; it never silently overwrites tags set by hand.
   Full MIDI files stay on this device (IndexedDB "files"); songs keep only the analysis summary + short groove patterns. */
'use strict';
const STUDIO_URL=null;              // set once DrumPath Studio is published; until then route 3 shows "Studio not set up yet"
const GM_OUT={K:36,S:38,'S:rim':37,HH:42,'HH:open':46,HP:44,T1:48,T2:45,T3:43,C:49,R:51};
const METERS=['4/4','3/4','6/8','12/8','5/4','7/8'];
const knownTag=id=>!!tagLesson(id);
function validateTags(ids){return ids.filter(knownTag);}
const songHasTags=s=>!!(s&&((s.core||[]).length||(s.support||[]).length));

/* ---------- the sheet ---------- */
function analyseSheet(songId){
  const s=songById(songId);if(!s)return;
  const m=openSheet('Analyse &amp; tag · '+esc(s.title),`<p class="mut" style="margin-top:0">Find which lessons <b>${esc(s.title)}</b> uses. Pick a route; you review everything before it’s applied.</p>
   <div class="list">
    <div class="lrow" style="cursor:pointer" id="an_midi"><span class="idx">1</span><div style="flex:1"><b>From a MIDI file</b><div class="mut" style="font-size:13px">Most accurate. Analysed on this tablet; the file stays here. <a href="#" id="an_help">Where to get MIDI</a></div></div><span>›</span></div>
    <div class="lrow" style="cursor:pointer" id="an_play"><span class="idx">2</span><div style="flex:1"><b>From my playing</b><div class="mut" style="font-size:13px">Play the song once on the kit with the click; the app records and analyses your notes.</div></div><span>›</span></div>
    <div class="lrow dim" id="an_studio" ${STUDIO_URL?'style="cursor:pointer"':''}><span class="idx">3</span><div style="flex:1"><b>Analyse with Studio</b><div class="mut" style="font-size:13px">${STUDIO_URL?'Opens DrumPath Studio with this song filled in; the result comes back to this song.':'Studio not set up yet.'}</div></div><span>${STUDIO_URL?'›':''}</span></div>
   </div>
   <div id="an_body"></div>`);
  const body=$('#an_body',m);
  $('#an_midi',m).onclick=()=>midiRoute(s,body);
  $('#an_play',m).onclick=()=>playRoute(s,body);
  $('#an_help',m).onclick=e=>{e.preventDefault();e.stopPropagation();body.innerHTML=midiHelpHtml();};
  if(STUDIO_URL)$('#an_studio',m).onclick=async()=>{window.open(await studioLink(s),'_blank','noopener');};
}
function midiHelpHtml(){return `<div class="card" style="margin-top:10px"><b>Where to get a MIDI file</b><ul style="margin:6px 0 0;padding-left:20px;line-height:1.5">
  <li><b>Songsterr:</b> sign in → open the song → edit → download the Guitar Pro file → convert it to MIDI in TuxGuitar (free) or a browser Guitar Pro → MIDI converter.</li>
  <li><b>MuseScore:</b> open the score → export the drum part as MIDI.</li>
  <li><b>Lakh MIDI “clean_midi”:</b> files named by artist and title. Fan-made, so quality varies.</li>
  <li><b>Groove MIDI Dataset:</b> short grooves by real drummers (Google Magenta, CC BY 4.0).</li></ul>
  <p class="mut" style="margin-bottom:0;font-size:13px">Don’t use tools that scrape Songsterr. Song files are for your own practice.</p></div>`;}

/* ---------- route 1: MIDI file ---------- */
function midiRoute(s,body){
  body.innerHTML=`<div class="card" style="margin-top:10px"><div class="grid"><div><label class="f">MIDI file (.mid)</label><input type="file" id="an_file" accept=".mid,.midi,audio/midi,audio/x-midi"></div>
    <div><label class="f">Where it’s from</label><select id="an_src">${['Songsterr','MuseScore','Lakh','Groove MIDI','Other'].map(x=>`<option>${x}</option>`).join('')}</select></div></div>
    <p class="mut" id="an_msg" style="font-size:13px;margin-bottom:0">The whole file stays on this tablet. Only the result (tags, tempo, short groove patterns) is saved with the song.</p></div>`;
  $('#an_file',body).onchange=async ev=>{const f=ev.target.files[0];if(!f)return;const msg=$('#an_msg',body);msg.textContent='Analysing…';
    try{const buf=new Uint8Array(await f.arrayBuffer());const a=MidiAnalyse.analyse(buf,{lessons:LESSONS.filter(l=>l.ex),title:s.title});
      await putFile('midi:'+s.id,{name:f.name,size:f.size,source:$('#an_src',body).value,date:today(),bytes:buf.buffer}).catch(()=>{});
      closeSheets();reviewSheet(s.id,fromAnalysis(a,'midi',{file:f.name,source:$('#an_src',body).value}));}
    catch(e){msg.innerHTML='<span style="color:var(--bad)">Couldn’t read that file: '+esc(e.message)+'</span>';}};
}
function fromAnalysis(a,src,extra){const F=a.features;
  return Object.assign({src,bpm:Math.round(F.pulseBpm||F.bpm),bpmNote:src==='midi'?(F.tempoSource==='MIDI tempo map'?'from the file’s tempo map':'not in the file (guess)'):'the tempo you played to',
    bpmConf:src==='midi'?a.confidence.bpm:0.7,meter:F.meter,meterConf:a.confidence.meter,feel:F.feel+(F.halfTime?', half-time':'')+(F.shuffle?', shuffle':''),
    genre:a.draftSong.genre,tags:a.suggestedTags.map(t=>({id:t.id,weight:t.weight,reason:t.reason,confidence:t.confidence})),
    level:a.level,difficulty:F.difficulty,sections:a.sections,patterns:a.patterns,doubleBass:F.doubleBass,features:F},extra||{});}

/* ---------- route 2: record my playing ---------- */
let REC=null;   // while set, hit() feeds notes here instead of a scored run (04-engine.js)
function recordHit(v,vel,t,art){if(REC&&REC.on)REC.notes.push({v,vel,t:t-state.lat,art:art||''});}
function playRoute(s,body){
  const bpm0=songBpm(s)||100;
  body.innerHTML=`<div class="card" style="margin-top:10px"><p style="margin-top:0">Put the song on (headphones or speaker), set its tempo, press <b>Record</b>. After one bar of count-in, play along for 8 bars or more, then <b>Stop</b>.</p>
   <div class="grid"><div><label class="f">Tempo (BPM)</label><div class="row" style="flex-wrap:nowrap"><input type="number" id="rc_bpm" value="${bpm0}" style="flex:1"><button class="sm" id="rc_tap">Tap</button></div></div>
    <div><label class="f">Meter</label><select id="rc_m">${METERS.map(x=>`<option ${x===(s.meter||'4/4')?'selected':''}>${x}</option>`).join('')}</select></div>
    <div><label class="f">Click while recording</label><select id="rc_click"><option value="1">On (recommended)</option><option value="0">Count-in only</option></select></div></div>
   <div class="row" style="margin-top:12px"><button class="pri" id="rc_go">● Record</button><span class="big num" id="rc_st"></span></div>
   <p class="mut" id="rc_msg" style="font-size:13px;margin-bottom:0">${inputs.length?'Kit connected.':'Kit not connected: plug it in, or the recording will be empty.'}</p></div>`;
  let taps=[];$('#rc_tap',body).onclick=()=>{const t=performance.now();if(taps.length&&t-taps[taps.length-1]>2500)taps=[];taps.push(t);if(taps.length>=4){const d=[];for(let i=1;i<taps.length;i++)d.push(taps[i]-taps[i-1]);$('#rc_bpm',body).value=Math.round(60000/median(d.slice(-8)));}};
  $('#rc_go',body).onclick=()=>{if(REC&&REC.on){stopRecording(s);return;}if(!midi)connectMidi();
    startRecording(+$('#rc_bpm',body).value||100,$('#rc_m',body).value,$('#rc_click',body).value==='1',body);};
}
function meterInfo(meter){const [num,den]=meter.split('/').map(Number);const comp=den===8&&num%3===0&&num>3;
  return {num,den,comp,beats:comp?num/3:den===8?num/2:num,quarterPerBeat:comp?1.5:den===8?0.5:1};}
function startRecording(bpm,meter,clickOn,body){
  const a=audio(),mi=meterInfo(meter),beatMs=60000/bpm,now=performance.now(),t0=now+300,cin=mi.beats*beatMs;
  REC={on:true,bpm,meter,notes:[],t0:t0+cin,nodes:[],stopAt:0,body};
  const toAc=pt=>a.currentTime+(pt-performance.now())/1000;let nb=0;
  const sched=()=>{if(!REC||!REC.on)return;const horizon=performance.now()+400;
    while(true){const bt=t0+nb*beatMs;if(bt>horizon)break;if(nb<mi.beats||clickOn)click(toAc(bt),nb%mi.beats===0?'acc':'beat',REC.nodes);nb++;}
    const el=$('#rc_st',body);if(el){const since=performance.now()-REC.t0;el.textContent=since<0?'Count-in '+Math.ceil(-since/beatMs):'Bar '+(Math.floor(since/(beatMs*mi.beats))+1)+' · '+REC.notes.length+' notes';}
    REC.timer=setTimeout(sched,100);};
  sched();const b=$('#rc_go',body);if(b){b.textContent='■ Stop';}
}
function stopRecording(s){if(!REC)return;REC.on=false;clearTimeout(REC.timer);REC.nodes.forEach(n=>{try{n.stop();}catch(_){}});
  const r=REC;REC=null;const body=r.body;
  try{const a=analyseRecording(r.notes,r.bpm,r.meter,r.t0);closeSheets();reviewSheet(s.id,fromAnalysis(a,'playing',{bpm:r.bpm}));}
  catch(e){const msg=body&&$('#rc_msg',body);if(msg)msg.innerHTML='<span style="color:var(--bad)">'+esc(e.message)+'</span>';const b=body&&$('#rc_go',body);if(b)b.textContent='● Record';}}
// recorded hits → a Standard MIDI File on the beat grid of the click → the same analyser as route 1
function analyseRecording(notes,bpm,meter,t0){
  const mi=meterInfo(meter),qBpm=bpm*mi.quarterPerBeat,qMs=60000/qBpm;
  const ev=notes.map(n=>({q:(n.t-t0)/qMs,note:GM_OUT[n.v+(n.art==='open'||n.art==='rim'?':'+n.art:'')]||GM_OUT[n.v],vel:Math.max(1,Math.min(127,n.vel||90))})).filter(e=>e.q>=-0.2&&e.note);
  if(ev.length<8)throw new Error('Only '+ev.length+' notes were recorded. Play at least a few bars after the count-in.');
  ev.forEach(e=>{if(e.q<0)e.q=0;});
  return MidiAnalyse.analyse(MidiAnalyse.writeSMF(ev,{bpm:qBpm,num:mi.num,den:mi.den}),{lessons:LESSONS.filter(l=>l.ex)});
}

/* ---------- route 3: Studio link + import codes ---------- */
const b64u=bytes=>{let s='';const b=new Uint8Array(bytes);for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=str=>{const s=atob(str.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((str.length+3)%4));const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;};
async function packCode(obj){const raw=new TextEncoder().encode(JSON.stringify(obj));
  if(window.CompressionStream){const gz=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();return 'z'+b64u(gz);}
  return 'j'+b64u(raw);}
async function unpackCode(code){code=String(code).trim().replace(/^.*#import=/,'');const kind=code[0],b=unb64u(code.slice(1));
  if(kind==='z'){const out=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();return JSON.parse(out);}
  if(kind==='j')return JSON.parse(new TextDecoder().decode(b));throw new Error('Not a DrumPath import code');}
async function studioLink(s){const p={songId:s.id,title:s.title,artist:s.artist,link:(s.cat?(state.songExtra[s.id]||{}).link:s.link)||'',bpm:songBpm(s)||null,meter:s.meter||'4/4'};
  return STUDIO_URL+'#analyse='+b64u(new TextEncoder().encode(JSON.stringify(p)));}
// incoming: {v:1, songs:[{songId?, title, artist, genre, bpm, bpmSource, meter, feel, tags:[{id,weight,reason,confidence}], grooves?, sections?}]}
function importTarget(x){if(x.songId&&songById(x.songId))return songById(x.songId);
  return allSongs().find(s=>normT(s.title)===normT(x.title)&&(!x.artist||normT(s.artist)===normT(x.artist)))||null;}
async function handleImport(code,opts={}){
  let p;try{p=await unpackCode(code);}catch(e){if(!opts.quiet)toast('That import code didn’t open: '+e.message);throw e;}
  const list=Array.isArray(p.songs)?p.songs:[p];const done=[];
  for(const x of list){let s=importTarget(x);
    if(!s){const u={id:'u'+Date.now().toString(36)+done.length,catId:'',title:x.title||'Untitled',artist:x.artist||'',genre:x.genre||'Other',bpm:x.bpm||'',bpmSure:false,meter:x.meter||'4/4',link:x.link||'',notes:'',core:[],support:[],tags:[],updatedAt:Date.now()};
      state.songs.push(u);s=songById(u.id);}
    const R={src:'studio',bpm:x.bpm||0,bpmNote:x.bpmSource||'estimated (Studio can’t hear audio)',bpmConf:x.bpmSource==='midi'?0.95:0.5,meter:x.meter||'',meterConf:0.6,feel:x.feel||'',genre:x.genre||'',
      tags:(x.tags||[]).map(t=>typeof t==='string'?{id:t,weight:1,reason:'',confidence:0.6}:t),patterns:x.grooves||null,sections:x.sections||null};
    if(opts.apply)applyReview(s.id,R,opts.apply);else{reviewSheet(s.id,R);}
    done.push(s.id);}
  return done;
}
function checkImportHash(){const h=location.hash;if(!/^#import=/.test(h))return;history.replaceState(null,'',location.pathname+location.search);
  handleImport(h.slice(8)).catch(()=>{});}
function pasteImportSheet(){const m=openSheet('Paste import code',`<p class="mut">Paste a code or link from DrumPath Studio.</p><textarea id="pi_t" rows="5" style="width:100%"></textarea><div class="row" style="margin-top:10px"><button class="pri" id="pi_go">Open</button></div>`);
  $('#pi_go',m).onclick=async()=>{const v=$('#pi_t',m).value;closeSheets();try{await handleImport(v);}catch(_){}};}

/* ---------- review card (shared by every route) ---------- */
function reviewSheet(songId,R){
  const s=songById(songId);if(!s)return;
  const have=Object.fromEntries(songTags(s).map(t=>[t.id,t.core?'core':'support']));
  R.tags=R.tags.filter(t=>{if(!knownTag(t.id)){(R.rejected=R.rejected||[]).push(t.id);return false;}return true;});
  const genres=[...new Set(allSongs().map(x=>x.genre))].sort();
  const srcTxt={midi:'from the MIDI file'+(R.file?' ('+esc(R.file)+')':''),playing:'based on your playing',studio:'from DrumPath Studio'}[R.src];
  const conf=c=>c==null?'':`<span class="mut" style="font-size:12px">${Math.round(c*100)}%</span>`;
  const rows=R.tags.slice().sort((a,b)=>b.weight-a.weight||b.confidence-a.confidence).map((t,i)=>{const l=tagLesson(t.id),mine=have[t.id];
    return `<tr><td><span class="idx">${t.id}</span> ${esc(l.t)}${l.later?' <span class="mut">(coming)</span>':''}${mine?`<div style="font-size:12px;color:var(--accent)">already tagged ${mine}</div>`:''}</td>
      <td><select data-rt="${t.id}">${[['2','Core'],['1','Support'],['0','Skip']].map(([v,n])=>`<option value="${v}" ${String(t.weight)===v?'selected':''}>${n}</option>`).join('')}</select></td>
      <td style="font-size:13px">${esc(t.reason||'')}</td><td class="n">${conf(t.confidence)}</td></tr>`;}).join('');
  const pat=R.patterns&&(R.patterns.main||R.patterns.fill);
  const m=openSheet('Review · '+esc(s.title),`<p class="mut" style="margin-top:0">Suggestions ${srcTxt}. Nothing changes until you tap <b>Apply</b>. Tags you set yourself are never replaced without asking.</p>
   <div class="grid">
    <div><label class="f"><input type="checkbox" id="rv_b" ${R.bpm&&(!songBpm(s)||bpmUnsure(s))?'checked':''}> Tempo ${conf(R.bpmConf)}</label><input type="number" id="rv_bv" value="${R.bpm||''}"><div class="mut" style="font-size:12px">${esc(R.bpmNote||'')}${songBpm(s)?' · now '+songBpm(s):''}</div></div>
    <div><label class="f"><input type="checkbox" id="rv_m" ${R.meter&&R.meter!==(s.meter||'4/4')?'checked':''}> Meter ${conf(R.meterConf)}</label><input id="rv_mv" value="${esc(R.meter||'')}"><div class="mut" style="font-size:12px">${R.feel?'feel: '+esc(R.feel):''}${s.meter?' · now '+esc(s.meter):''}</div></div>
    <div><label class="f"><input type="checkbox" id="rv_g" ${R.genre&&(s.genre==='Other'||!s.genre)?'checked':''}> Genre</label><input id="rv_gv" list="rv_gl" value="${esc(R.genre||'')}"><datalist id="rv_gl">${genres.map(g=>`<option value="${esc(g)}">`).join('')}</datalist><div class="mut" style="font-size:12px">now ${esc(s.genre||'–')}</div></div>
   </div>
   ${R.level?`<p class="mut" style="font-size:13px">Level ${R.level}${R.difficulty?' · difficulty '+R.difficulty+'/10':''}${R.sections&&R.sections.length?' · sections '+R.sections.map(x=>x.name+' '+x.bars+' bars').join(', '):''}${R.doubleBass?' · fast kicks thinned for one pedal':''}</p>`:''}
   <h2 style="margin-top:10px">Lessons (${R.tags.length})</h2>
   ${R.tags.length?`<div class="list" style="overflow-x:auto"><table><tr><th>Lesson</th><th>Use as</th><th>Why</th><th class="n">Sure</th></tr>${rows}</table></div>`:'<div class="card mut">No lessons matched. Try another route, or pick lessons in Edit song.</div>'}
   ${R.rejected&&R.rejected.length?`<p class="mut" style="font-size:12px">Ignored unknown lesson ids: ${R.rejected.map(esc).join(', ')}</p>`:''}
   ${pat?`<h2>Main groove</h2><div class="pat">${esc(patText(Object.assign({bars:1},pat)))}</div>`:''}
   ${R.src==='studio'?'<p class="mut" style="font-size:12px">Studio estimates tempo unless it came from a MIDI file; it can’t browse or hear audio.</p>':''}
   <div class="row" style="margin-top:14px"><button class="pri" id="rv_ok">Apply</button><button class="ghost" data-close>Cancel</button></div>`);
  $('#rv_ok',m).onclick=async()=>{
    R.tags.forEach(t=>{const sel=m.querySelector(`[data-rt="${t.id}"]`);if(sel)t.weight=+sel.value;});
    const pick={bpm:$('#rv_b',m).checked?+$('#rv_bv',m).value:null,meter:$('#rv_m',m).checked?$('#rv_mv',m).value.trim():null,genre:$('#rv_g',m).checked?$('#rv_gv',m).value.trim():null};
    const conflicts=R.tags.filter(t=>t.weight&&have[t.id]&&have[t.id]!==(t.weight===2?'core':'support'));
    let policy='keep';
    if(conflicts.length)policy=await confirmBox('You already tagged '+conflicts.map(t=>t.id+' as '+have[t.id]).join(', ')+'. Use the suggested weight'+(conflicts.length>1?'s':'')+' instead? (Cancel keeps yours; new lessons are still added.)')?'replace':'keep';
    closeSheets();applyReview(songId,R,{policy,pick});
  };
}
// merge into the song. Hand-set tags are never removed; their weight changes only with policy 'replace'.
function applyReview(songId,R,o){
  o=o||{};const pick=o.pick||{bpm:R.bpm||null,meter:null,genre:null},policy=o.policy||'keep';
  const s=songById(songId);if(!s)return null;
  const core=new Set(s.core||[]),sup=new Set((s.support||[]).filter(x=>!core.has(x)));let added=0,changed=0;
  R.tags.filter(t=>t.weight&&knownTag(t.id)).forEach(t=>{const cur=core.has(t.id)?2:sup.has(t.id)?1:0;
    if(!cur){(t.weight===2?core:sup).add(t.id);added++;}
    else if(cur!==t.weight&&policy==='replace'){core.delete(t.id);sup.delete(t.id);(t.weight===2?core:sup).add(t.id);changed++;}});
  const analysis={src:R.src,date:today(),bpm:R.bpm||null,meter:R.meter||null,feel:R.feel||null,level:R.level||null,difficulty:R.difficulty||null,sections:R.sections||null,
    tags:R.tags.map(t=>[t.id,t.weight,t.reason||'',t.confidence==null?null:Math.round(t.confidence*100)/100])};
  const grooves=R.patterns?Object.fromEntries(Object.entries(R.patterns).filter(([,v])=>v)):null;
  const coreA=[...core],supA=[...sup];
  if(s.cat){const ov=state.songTagOv[s.id]=Object.assign({},state.songTagOv[s.id]||{},{core:coreA,support:supA,updatedAt:Date.now()});
    if(pick.genre)ov.genre=pick.genre;if(pick.meter)ov.meter=pick.meter;
    if(pick.bpm)state.songBpm[s.id]=pick.bpm;
    const ex=state.songExtra[s.id]=Object.assign({},state.songExtra[s.id]||{});ex.analysis=analysis;if(grooves)ex.grooves=grooves;}
  else{const u=state.songs.find(x=>x.id===s.id);Object.assign(u,{core:coreA,support:supA,tags:[...coreA,...supA],updatedAt:Date.now(),analysis});
    if(grooves)u.grooves=grooves;if(pick.genre)u.genre=pick.genre;if(pick.meter)u.meter=pick.meter;
    if(pick.bpm){u.bpm=pick.bpm;u.bpmSure=R.src==='midi'&&R.bpmConf>=0.9;delete state.songBpm[s.id];}}
  save();updateSongHist();
  if(!o.quiet){render();toast(added||changed?`Applied: ${added} lesson${added===1?'':'s'} added${changed?', '+changed+' changed':''}`:'Saved. No new lessons to add.');}
  return {added,changed};
}

/* ---------- on-device file store (IndexedDB "files"; S3 adds the Drive library + cache limit) ---------- */
async function putFile(key,rec){if(!STORE.db)throw new Error('no db');const {tx,done}=idbTx(STORE.db,['files'],'readwrite');tx.objectStore('files').put(rec,key);await done;}

/* ---------- tests (§8) ---------- */
async function analyseTests(){
  const out=[],T=(n,ok,d)=>out.push({name:n,pass:!!ok,det:d||''});
  const keep=JSON.stringify(state),vp=JSON.stringify(VP.songs),keepSave=window.storeSave,keepPush=window.drivePushSoon;
  window.storeSave=()=>{};window.drivePushSoon=()=>{};
  try{
    // 1. banner on an untagged song
    const u={id:'utest',catId:'',title:'Love Me Again',artist:'John Newman',genre:'Other',bpm:'',meter:'4/4',core:[],support:[],tags:[]};state.songs.push(u);
    go('songs',{id:'utest'},{noPush:true});T('A song with no tags shows the banner',/has no lessons yet/.test(view.textContent)&&!!view.querySelector('[data-analyse]'),'');
    // 2. MIDI of a straight 8th-note rock beat
    const n=[];for(let b=0;b<8;b++){for(let i=0;i<8;i++)n.push({q:b*4+i/2,note:42,vel:80});n.push({q:b*4,note:36},{q:b*4+2,note:36},{q:b*4+1,note:38,vel:110},{q:b*4+3,note:38,vel:110});}
    const a1=MidiAnalyse.analyse(MidiAnalyse.writeSMF(n,{bpm:120}),{lessons:LESSONS.filter(l=>l.ex)});const ids1=a1.suggestedTags.map(t=>t.id);
    T('MIDI of a straight 8th rock beat suggests 1.5.03 / 2.5.01',ids1.includes('1.5.03')&&ids1.includes('2.5.01'),ids1.join(' '));
    // 3. a recorded play of the 3.5.06 disco exercise (simulated kit hits with human timing)
    const ex=LBY['3.5.06'].ex[0],bpm=110,stepMs=60000/bpm/ex.sub,t0=1000,notes=[];let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-0.5;};
    for(let bar=0;bar<8;bar++)Object.entries(ex.v).forEach(([v,str])=>[...str].forEach((c,k)=>{if(c==='.')return;notes.push({v,vel:c==='g'?40:90,t:t0+(bar*str.length+k)*stepMs+rnd()*16,art:c==='o'?'open':v==='HH'?'closed':''});}));
    const a2=analyseRecording(notes,bpm,'4/4',t0);const t356=a2.suggestedTags.find(t=>t.id==='3.5.06');
    T('A recorded play of the 3.5.06 disco exercise suggests 3.5.06',!!t356,t356?(t356.weight===2?'core':'support')+' · '+t356.reason:a2.suggestedTags.map(t=>t.id).join(' '));
    // 4. import link with songId updates that song, no duplicate
    const before=state.songs.length;
    const code=await packCode({v:1,songs:[{songId:'utest',title:'Love Me Again',artist:'John Newman',genre:'Pop',bpm:126,meter:'4/4',tags:[{id:'2.5.01',weight:2,reason:'test',confidence:0.8},{id:'9.9.99',weight:1}]}]});
    await handleImport(code,{apply:{policy:'keep',pick:{bpm:126,genre:'Pop',meter:null},quiet:true}});
    const after=state.songs.find(x=>x.id==='utest');
    T('An import link with a songId updates that song (no duplicate)',state.songs.length===before&&after.core.includes('2.5.01')&&after.genre==='Pop'&&+after.bpm===126,state.songs.length+' songs, core '+after.core.join(' '));
    T('Unknown lesson ids are rejected',!after.core.includes('9.9.99')&&!after.support.includes('9.9.99')&&validateTags(['9.9.99','1.5.03']).join()==='1.5.03','');
    // 5. hand-set tags are never overwritten without asking
    after.core=['1.5.03'];after.support=[];applyReview('utest',{src:'midi',tags:[{id:'1.5.03',weight:1,reason:'',confidence:0.5},{id:'3.2.05',weight:1,reason:'',confidence:0.5}]},{policy:'keep',pick:{},quiet:true});
    T('Apply keeps a hand-set tag’s weight unless you say replace',after.core.includes('1.5.03')&&after.support.includes('3.2.05'),'core '+after.core.join(' ')+' · support '+after.support.join(' '));
    // 6. catalog song: tags go to an override, catalog data untouched
    const cat=CAT_SONGS.find(x=>x.id==='s003'),c0=cat.core.join();
    applyReview('s003',{src:'midi',tags:[{id:'3.2.07',weight:1,reason:'',confidence:0.5}]},{policy:'keep',pick:{},quiet:true});
    T('Catalog songs keep their catalog tags; additions go to an override',cat.core.join()===c0&&songById('s003').support.includes('3.2.07'),'');
    // 7. existing saved data unchanged by loading this module
    T('Saved songs load unchanged (fields only added)',JSON.parse(keep).songs.every(x=>state.songs.some(y=>y.id===x.id)),'');
  }catch(e){T('Analyse & tag tests',false,e.message);}
  finally{state=JSON.parse(keep);VP.songs=JSON.parse(vp);window.storeSave=keepSave;window.drivePushSoon=keepPush;}
  return out;
}
