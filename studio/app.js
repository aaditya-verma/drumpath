'use strict';
/* DrumPath Studio — Analyse & add, Search, Suggest songs. Talks to DrumPath through codes and links. */
const APP_URL='https://aaditya-verma.github.io/drumpath/';
const LANE_OK=['C','R','HH','HP','S','T1','T2','T3','K'];
const CH_OK=/^[xXgorfd.]+$/;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/^the\s+/,'').replace(/[^a-z0-9]+/g,' ').trim();
const IDX=Object.fromEntries(DP_INDEX.map(l=>[l.id,l]));
const levelOf=id=>+String(id).split('.')[0];
const STRANDS={1:'Theory/Reading',2:'Technique',3:'Rudiments',4:'Independence',5:'Grooves/Styles',6:'Fills/Rhythm',7:'Time/Ears',8:'Songs'};
const strandOf=id=>+String(id).split('.')[1];
const CAT=DP_CAT.map(r=>({id:r[0],title:r[1],artist:r[2],genre:r[3],bpm:r[4],bpmSure:r[5],meter:r[6],core:r[7],support:r[8]}));
const GENRES=[...new Set(CAT.map(s=>s.genre))].sort();

/* ---------- small storage (this browser only) ---------- */
const store={get(k,d){try{const v=localStorage.getItem('dps.'+k);return v?JSON.parse(v):d;}catch(_){return d;}},
  set(k,v){try{localStorage.setItem('dps.'+k,JSON.stringify(v));}catch(_){}}};
let HIST=store.get('hist',[]);
const saveHist=()=>{HIST=HIST.slice(0,60);store.set('hist',HIST);};

/* ---------- codes ---------- */
const b64u=bytes=>{let s='';const b=new Uint8Array(bytes);for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=str=>{const s=atob(str.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((str.length+3)%4));const b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;};
async function packCode(obj){const raw=new TextEncoder().encode(JSON.stringify(obj));
  if(window.CompressionStream){try{const gz=await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();return 'z'+b64u(gz);}catch(_){}}
  return 'j'+b64u(raw);}
async function readRequest(text){
  let c=String(text||'').trim();if(!c)throw new Error('Paste the code from DrumPath first');
  const m=c.match(/#(?:analyse|import)=([A-Za-z0-9_-]+)/);if(m)c=m[1];
  c=c.replace(/\s+/g,'');
  if((c[0]==='z'||c[0]==='j')&&c.length>2){try{const b=unb64u(c.slice(1));
      const t=c[0]==='z'?await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text():new TextDecoder().decode(b);return JSON.parse(t);}catch(_){}}
  return JSON.parse(new TextDecoder().decode(unb64u(c)));
}

/* ---------- validation ---------- */
function cleanPattern(p){
  if(!p||typeof p!=='object'||!p.v)return null;const sub=+p.sub;if(![1,2,3,4,6].includes(sub))return null;
  const bars=Math.max(1,Math.min(4,+p.bars||1));const steps=+p.steps||4*sub;const len=steps*bars;const v={};
  for(const [k,s] of Object.entries(p.v)){if(!LANE_OK.includes(k)||typeof s!=='string')continue;const t=s.replace(/\s+/g,'');if(t.length!==len||!CH_OK.test(t))return null;if(/[^.]/.test(t))v[k]=t;}
  if(!Object.keys(v).length)return null;
  const o={n:p.n||'Groove',sub,bars,v};if(p.steps&&+p.steps!==4*sub)o.steps=+p.steps;if(p.swing)o.swing=+p.swing;return o;}
function cleanTags(tags){const out=[],bad=[];(tags||[]).forEach(t=>{const id=String(t.id||t).trim();if(!IDX[id]){bad.push(id);return;}
  if(out.find(x=>x.id===id))return;out.push({id,weight:+t.weight===2?2:1,reason:String(t.reason||''),confidence:Math.max(0,Math.min(1,+t.confidence||0.6))});});
  return {tags:out,bad};}
function findDup(title,artist){const t=norm(title),a=norm(artist);return CAT.find(s=>norm(s.title)===t&&(!a||norm(s.artist)===a))||null;}

/* ---------- Claude ---------- */
let SAMPLE=null,IMG=false;
const LESSON_LINES=DP_INDEX.map(l=>`${l.id} | ${l.t}${l.bpm?` | ${l.bpm[0]}→${l.bpm[1]} BPM`:l.info?' | info':''}${l.later?' | not built yet':''}`).join('\n');
const KIT='Alesis Nitro electronic kit: snare (head + rim), kick (one single pedal), hi-hat with pedal, 3 toms (T1 high, T2 mid, T3 floor), 1 crash, ride. No double pedal, no brushes.';
const SCHEMA=`{
 "known": true|false,            // do you actually know this recording?
 "title": "", "artist": "", "year": 0,
 "genre": "one of: ${GENRES.join(' | ')} (or a new short genre if none fits)",
 "genre2": "",
 "bpm": 0,                       // pulse BPM: quarter note; dotted quarter for 6/8 and 12/8. 0 if unknown
 "bpmConfidence": 0.0,           // ≤0.6 unless you are sure of the recorded tempo
 "meter": "4/4", "feel": "straight | swing | shuffle | half-time | half-time shuffle",
 "level": 1, "difficulty": 1,    // difficulty 1–10 for the drum part
 "sections": [{"name":"Intro","bars":4}],
 "tags": [{"id":"2.5.01","weight":2,"reason":"one short line","confidence":0.0}],   // weight 2 = core, 1 = support
 "grooves": {"main": PATTERN or null, "fill": PATTERN or null},
 "kitNotes": "", "plan": [{"id":"2.5.01","bpm":110}], "notes": ""
}
PATTERN = {"n":"Main groove","sub":2,"bars":1,"v":{"HH":"xxxxxxxx","S":"..x...x.","K":"x...x..."}}
 sub = steps per beat (1,2,3,4,6); each lane string is exactly 4*sub*bars characters in 4/4.
 Lanes: C crash, R ride, HH hi-hat, HP hi-hat pedal, S snare, T1 T2 T3 toms, K kick.
 Chars: x hit, X accent, g ghost, o open hi-hat, r rim/cross-stick, f flam, d drag, . rest.`;
const RULES=`Rules:
- Use ONLY lesson ids from the list. Prefer the lowest-level lesson that teaches each skill. 2–5 core tags, 0–5 support tags. Lessons marked "not built yet" are allowed.
- Core = needed to play the main groove and main fills. Support = helps but not essential.
- Never invent a recording. If you don't know the song, set known=false, keep confidences low, and tag only from what the user gave.
- Write the main groove only if you are fairly sure of it; otherwise null.
- You cannot hear audio or browse. Return JSON only.`;

async function askJSON(prompt,opts){
  if(!SAMPLE)throw {code:'not_granted',message:'Analysis is not available here'};
  return await SAMPLE.json(prompt,Object.assign({modelTier:'default'},opts||{}));
}

/* ---------- analyse one song ---------- */
async function analyseSong(inp,onStep){
  let midi=null;
  if(inp.midiBytes){onStep&&onStep('Reading the MIDI file…');
    midi=MidiAnalyse.analyse(inp.midiBytes,{lessons:DP_EX,title:inp.title});}
  const parts=[`You classify songs for DrumPath, a drum-lesson app. Player's kit: ${KIT}`,
    `DrumPath lessons (id | name | start→goal BPM):\n${LESSON_LINES}`,
    `Song to analyse:\nTitle: ${inp.title||'(not given)'}\nArtist: ${inp.artist||'(not given)'}${inp.link?`\nLink: ${inp.link}`:''}${inp.bpm?`\nBPM the player measured: ${inp.bpm}`:''}${inp.meter?`\nMeter given: ${inp.meter}`:''}`];
  if(inp.text)parts.push(`Notes / tab pasted by the player:\n${inp.text.slice(0,6000)}`);
  if(midi){const f=midi.features;parts.push(`A MIDI drum track was analysed on the device. Treat these as facts (tempo, meter, feel, sections come from the file):\n`+
    JSON.stringify({bpm:f.pulseBpm,meter:f.meter,feel:f.feel,shuffle:f.shuffle,halfTime:f.halfTime,timeSub:f.timeSub,timeLane:f.timeLane,hhOpenPerBar:f.hhOpenPerBar,ghostRatio:f.ghostRatio,flams:f.flams,drags:f.drags,fourFloor:f.fourFloor,kick16:f.kick16,xstick:f.xstick,linear:f.linear,doubleBass:f.doubleBass,difficulty:f.difficulty,sections:midi.sections,ruleTags:midi.suggestedTags.map(t=>[t.id,t.weight,t.reason])})+
    `\nMain groove from the file: ${JSON.stringify(midi.patterns.main)}`);}
  if(inp.images&&inp.images.length)parts.push('The attached image is drum notation or a tab for this song. Read the groove from it.');
  parts.push(`Return JSON in this shape:\n${SCHEMA}\n${RULES}`);
  onStep&&onStep('Analysing…');
  const opts={};if(inp.images&&inp.images.length&&IMG)opts.images=inp.images;
  const r=await askJSON(parts.join('\n\n'),opts)||{};
  // merge
  const ct=cleanTags(r.tags);let tags=ct.tags;
  if(midi){midi.suggestedTags.forEach(t=>{const o=tags.find(x=>x.id===t.id);if(o){o.confidence=Math.min(0.95,o.confidence+0.15);o.weight=Math.max(o.weight,t.weight);if(!/MIDI/.test(o.reason))o.reason+=' · also found in the MIDI file';}
    else if(IDX[t.id])tags.push({id:t.id,weight:t.weight,reason:t.reason+' (MIDI)',confidence:t.confidence});});}
  const g=r.grooves||{};
  const grooves=midi?{main:midi.patterns.main,second:midi.patterns.second,fill:midi.patterns.fill}:{main:cleanPattern(g.main),fill:cleanPattern(g.fill)};
  const f=midi&&midi.features;
  const out={songId:inp.songId||'',title:inp.title||r.title||'',artist:inp.artist||r.artist||'',year:+r.year||null,genre:r.genre||(midi?midi.draftSong.genre:'Other'),genre2:r.genre2||'',
    bpm:f?Math.round(f.pulseBpm):(inp.bpm?+inp.bpm:Math.round(+r.bpm||0)),
    bpmSource:f?'midi':inp.bpm?'measured in DrumPath':'estimated by Studio',bpmConfidence:f?0.95:inp.bpm?0.9:Math.min(0.6,+r.bpmConfidence||0.4),
    meter:f?f.meter:(r.meter||inp.meter||'4/4'),feel:f?(f.feel+(f.halfTime?', half-time':'')):(r.feel||''),
    level:tags.filter(t=>t.weight===2).reduce((m,t)=>Math.max(m,levelOf(t.id)),0)||+r.level||null,difficulty:f?f.difficulty:(+r.difficulty||null),
    sections:(midi?midi.sections:(Array.isArray(r.sections)?r.sections:[])).map(s=>({name:String(s.name||''),bars:+s.bars||0})).filter(s=>s.name),
    tags,rejected:ct.bad,grooves,kitNotes:(f&&f.doubleBass?'Fast double kicks thinned for one pedal. ':'')+(r.kitNotes||''),
    plan:(r.plan||[]).filter(p=>IDX[p.id]).slice(0,6),notes:r.notes||'',known:r.known!==false,link:inp.link||'',src:midi?'midi':inp.images&&inp.images.length?'image':'title',when:Date.now()};
  if(!out.songId){const d=findDup(out.title,out.artist);if(d)out.dupOf=d.id;}
  return out;
}

/* ---------- UI: tabs ---------- */
function tab(name){$$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===name));$$('section[data-tab]').forEach(s=>s.hidden=s.dataset.tab!==name);store.set('tab',name);}
const toast=(msg,ms=2600)=>{const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),ms);};

/* ---------- Analyse & add ---------- */
let REQ=null;          // request from DrumPath {songId,...} or {batch:[...]}
let RESULTS=[];        // reviewed results waiting to be sent
let MIDI_FILE=null,IMG_FILES=[];
function fillForm(x){$('#a_title').value=x.title||'';$('#a_artist').value=x.artist||'';$('#a_link').value=x.link||'';$('#a_bpm').value=x.bpm||'';$('#a_meter').value=x.meter||'';
  const rq=$('#a_req');rq.textContent=x.songId?'Linked to your DrumPath song — the result updates that song.':'';rq.style.display=x.songId?'block':'none';rq.dataset.song=x.songId||'';}
async function onPasteRequest(){
  try{const r=await readRequest($('#a_code').value);REQ=r;
    if(Array.isArray(r.batch)){$('#a_batch').value=r.batch.map(x=>`${x.title}${x.artist?' — '+x.artist:''}`).join('\n');$('#a_mode').value='batch';setMode();toast(`${r.batch.length} untagged songs loaded`);}
    else{$('#a_mode').value='one';setMode();fillForm(r);toast('Song loaded from DrumPath');}
    $('#a_code').value='';$('#reqbox').open=false;}
  catch(e){toast('That code didn’t open: '+(e.message||e));}
}
function setMode(){const b=$('#a_mode').value==='batch';$('#one').hidden=b;$('#batch').hidden=!b;}
function inputsFromForm(){return {songId:$('#a_req').dataset.song||'',title:$('#a_title').value.trim(),artist:$('#a_artist').value.trim(),link:$('#a_link').value.trim(),bpm:+$('#a_bpm').value||null,meter:$('#a_meter').value.trim(),text:$('#a_text').value.trim()};}
function parseLink(u){try{const url=new URL(u);const q=url.searchParams.get('q');if(q)return q;}catch(_){}return '';}
async function runOne(){
  const inp=inputsFromForm();
  if(!inp.title&&inp.link){const g=parseLink(inp.link);if(g)inp.title=g;}
  if(!inp.title&&!MIDI_FILE&&!IMG_FILES.length&&!inp.text){toast('Add a title, a MIDI file, a photo or some notes');return;}
  if(MIDI_FILE)inp.midiBytes=new Uint8Array(await MIDI_FILE.arrayBuffer());
  if(IMG_FILES.length)inp.images=IMG_FILES;
  await withBusy(async step=>{const r=await analyseSong(inp,step);RESULTS=[r];HIST.unshift(r);saveHist();renderResults();});
}
async function runBatch(){
  const lines=$('#a_batch').value.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,25);if(!lines.length){toast('Add one song per line');return;}
  const reqBatch=REQ&&Array.isArray(REQ.batch)?REQ.batch:[];RESULTS=[];
  await withBusy(async step=>{for(let i=0;i<lines.length;i++){const [t,a]=lines[i].split(/\s+[—–-]\s+/);
      const fromReq=reqBatch.find(x=>norm(x.title)===norm(t))||{};
      step(`Analysing ${i+1} of ${lines.length}: ${t}`);
      try{const r=await analyseSong({songId:fromReq.songId||'',title:t,artist:a||fromReq.artist||'',bpm:fromReq.bpm||null,meter:fromReq.meter||''});RESULTS.push(r);HIST.unshift(r);saveHist();renderResults();}
      catch(e){if(e&&e.code==='rate_limited'){toast('Paused: too many requests. Try the rest in a minute.');break;}if(e&&e.code==='not_granted')throw e;RESULTS.push({title:t,artist:a||'',error:e.message||String(e)});renderResults();}}});
}
async function withBusy(fn){const btn=$('#a_go'),st=$('#a_status');btn.disabled=true;st.hidden=false;
  try{await fn(m=>{st.textContent=m;});st.hidden=true;}
  catch(e){st.hidden=false;st.textContent=e&&e.code==='not_granted'?'Analysis is turned off for this page. Search still works.':e&&e.code==='rate_limited'?'Too many requests right now — wait a minute and try again.':'Something went wrong: '+(e&&e.message||e);}
  finally{btn.disabled=!SAMPLE;}}

function confPill(c){const p=Math.round((c||0)*100);return `<span class="conf ${p>=75?'hi':p>=55?'mid':'lo'}">${p}%</span>`;}
function patGrid(p){if(!p)return '';  return `<div class="pat"><div class="pmeta mono">${esc(p.n||'')} · ${p.sub===3||p.sub===6?'triplets':p.sub===4?'16ths':p.sub===2?'8ths':'quarters'}</div>${LANE_OK.filter(l=>p.v[l]).map(l=>`<div class="prow"><span class="pl mono">${l}</span><span class="ps mono">${esc((p.v[l].match(new RegExp('.{1,'+p.sub+'}','g'))||[]).join(' '))}</span></div>`).join('')}</div>`;}
function renderResults(){
  const box=$('#results');if(!RESULTS.length){box.innerHTML='';return;}
  box.innerHTML=RESULTS.map((r,i)=>{if(r.error)return `<div class="card err"><b>${esc(r.title)}</b> — couldn’t analyse: ${esc(r.error)}</div>`;
    const dup=r.dupOf?CAT.find(s=>s.id===r.dupOf):null;
    const byS={};r.tags.forEach(t=>{(byS[strandOf(t.id)]=byS[strandOf(t.id)]||[]).push(t);});
    return `<div class="card res" data-i="${i}">
     <div class="rhead"><div><h3>${esc(r.title||'Untitled')}</h3><div class="mut">${esc(r.artist||'Unknown artist')}${r.year?' · '+r.year:''}</div></div>
      <div class="chips"><span class="chip">L${r.level||'?'}</span>${r.difficulty?`<span class="chip">difficulty ${r.difficulty}/10</span>`:''}<span class="chip">${esc(r.src==='midi'?'from MIDI':r.src==='image'?'from photo':'from title')}</span></div></div>
     ${!r.known&&r.src!=='midi'?'<div class="warn">Studio doesn’t know this recording well, so these tags are a best guess. A MIDI file or your playing will be more accurate.</div>':''}
     ${r.songId?'<div class="ok">Will update your existing DrumPath song.</div>':dup?`<div class="ok">Already in the catalog as <b>${esc(dup.title)}</b> — DrumPath will update it, not add a copy.</div>`:''}
     <div class="grid3">
      <label>Title<input data-f="title" value="${esc(r.title)}"></label><label>Artist<input data-f="artist" value="${esc(r.artist)}"></label>
      <label>Genre<input data-f="genre" list="genres" value="${esc(r.genre)}"></label>
      <label>BPM ${confPill(r.bpmConfidence)}<input data-f="bpm" type="number" value="${r.bpm||''}"><small class="mut">${esc(r.bpmSource)}${r.bpmSource==='estimated by Studio'?' — confirm with Tap tempo':''}</small></label>
      <label>Meter<input data-f="meter" value="${esc(r.meter)}"></label><label>Feel<input data-f="feel" value="${esc(r.feel)}"></label>
     </div>
     <h4>Lessons</h4>
     <table class="tags"><tr><th>Lesson</th><th>Use as</th><th>Why</th><th>Sure</th></tr>${r.tags.slice().sort((a,b)=>b.weight-a.weight||b.confidence-a.confidence).map(t=>`<tr><td><span class="mono idx">${t.id}</span> ${esc(IDX[t.id].t)}${IDX[t.id].later?' <span class="mut">(coming)</span>':''}</td>
       <td><select data-tag="${t.id}">${[['2','Core'],['1','Support'],['0','Skip']].map(([v,n])=>`<option value="${v}" ${String(t.weight)===v?'selected':''}>${n}</option>`).join('')}</select></td><td class="why">${esc(t.reason)}</td><td>${confPill(t.confidence)}</td></tr>`).join('')}</table>
     ${r.rejected&&r.rejected.length?`<div class="mut small">Ignored unknown lesson ids: ${r.rejected.map(esc).join(', ')}</div>`:''}
     <div class="strands">${Object.keys(byS).sort().map(k=>`<span class="chip">${STRANDS[k]||k}: ${byS[k].length}</span>`).join('')}</div>
     ${r.sections&&r.sections.length?`<h4>Sections</h4><div class="mut">${r.sections.map(s=>esc(s.name)+(s.bars?' · '+s.bars+' bars':'')).join(' → ')}</div>`:''}
     ${r.grooves&&(r.grooves.main||r.grooves.fill)?`<h4>Groove</h4><div class="pats">${patGrid(r.grooves.main)}${patGrid(r.grooves.fill)}</div>`:''}
     ${r.plan&&r.plan.length?`<h4>To be ready</h4><ol class="plan">${r.plan.map(p=>`<li><span class="mono idx">${p.id}</span> ${esc(IDX[p.id].t)}${p.bpm?` <span class="mut">→ ${p.bpm} BPM</span>`:''}</li>`).join('')}</ol>`:''}
     ${r.kitNotes?`<div class="mut small">Kit: ${esc(r.kitNotes)}</div>`:''}${r.notes?`<div class="mut small">${esc(r.notes)}</div>`:''}
     <label class="keep"><input type="checkbox" data-keep ${r.skip?'':'checked'}> Send to DrumPath</label>
    </div>`;}).join('')+
   `<div class="card send"><div class="mut">Studio can’t hear audio or browse: tempos are estimates unless they came from a MIDI file. You review everything again in DrumPath before it’s applied.</div>
     <div class="row"><a class="btn pri" id="sendlink" href="#" target="_blank" rel="noopener">Add to DrumPath ↗</a><button id="copycode">Copy import code</button></div>
     <div class="mut small">If the link doesn’t open DrumPath, copy the code and use <b>Paste import code</b> on DrumPath’s Songs screen.</div></div>`;
  $$('.res',box).forEach(card=>{const r=RESULTS[+card.dataset.i];
    $$('[data-f]',card).forEach(inp=>inp.addEventListener('input',()=>{const k=inp.dataset.f;r[k]=k==='bpm'?+inp.value:inp.value;if(k==='bpm')r.bpmSource=r.bpmSource==='midi'?'midi':'set in Studio';refreshSend();}));
    $$('[data-tag]',card).forEach(s=>s.addEventListener('change',()=>{const t=r.tags.find(x=>x.id===s.dataset.tag);t.weight=+s.value;refreshSend();}));
    $('[data-keep]',card).addEventListener('change',e=>{r.skip=!e.target.checked;refreshSend();});});
  $('#copycode').addEventListener('click',async()=>{const c=await buildCode();try{await navigator.clipboard.writeText(c);toast('Import code copied');}catch(_){showCode(c);}});
  refreshSend();
}
function payload(){return {v:1,songs:RESULTS.filter(r=>!r.error&&!r.skip).map(r=>({songId:r.songId||r.dupOf||undefined,title:r.title,artist:r.artist,genre:r.genre,bpm:r.bpm||0,
  bpmSource:r.bpmSource==='midi'?'midi':r.bpmSource,meter:r.meter,feel:r.feel,link:r.link||undefined,level:r.level,difficulty:r.difficulty,
  tags:r.tags.filter(t=>t.weight>0).map(t=>({id:t.id,weight:t.weight,reason:t.reason,confidence:Math.round(t.confidence*100)/100})),
  grooves:r.grooves&&(r.grooves.main||r.grooves.fill)?r.grooves:undefined,sections:r.sections&&r.sections.length?r.sections:undefined}))};}
async function buildCode(){return await packCode(payload());}
async function refreshSend(){const a=$('#sendlink');if(!a)return;const n=payload().songs.length;
  if(!n){a.classList.add('dis');a.removeAttribute('href');a.textContent='Nothing selected';return;}
  const c=await buildCode();a.classList.remove('dis');a.href=APP_URL+'#import='+c;a.textContent=`Add ${n>1?n+' songs':'to DrumPath'} ↗`;}
function showCode(c){const d=$('#codedlg');$('#codetxt').value=c;d.hidden=false;$('#codetxt').select();}

/* ---------- Search ---------- */
function renderSearch(){
  const q=norm($('#q').value);const out=$('#s_out');if(!q){out.innerHTML='<div class="mut">Search songs, artists, genres, lesson ids or names.</div>';return;}
  const songs=CAT.filter(s=>norm(s.title+' '+s.artist+' '+s.genre).includes(q)).slice(0,30);
  const hist=HIST.filter(h=>!h.error&&!CAT.find(s=>s.id===h.dupOf)&&norm(h.title+' '+h.artist).includes(q)).slice(0,10);
  const les=DP_INDEX.filter(l=>norm(l.id+' '+l.t).includes(q)||l.id.startsWith($('#q').value.trim())).slice(0,20);
  const songRow=s=>`<div class="lrow"><div style="flex:1"><b>${esc(s.title)}</b> <span class="mut">${esc(s.artist)} · ${esc(s.genre)} · ${s.bpm?(s.bpmSure?'':'≈')+s.bpm+' BPM':'BPM not set'}</span><div class="small">${s.core.map(id=>`<span class="mono idx">★${id}</span>`).join(' ')} ${s.support.map(id=>`<span class="mono idx">${id}</span>`).join(' ')}</div></div><button data-re="${esc(s.title)}|${esc(s.artist)}">Re-analyse</button></div>`;
  out.innerHTML=(songs.length?`<h4>Catalog songs</h4>${songs.map(songRow).join('')}`:'')+
   (hist.length?`<h4>Analysed here</h4>${hist.map(h=>`<div class="lrow"><div style="flex:1"><b>${esc(h.title)}</b> <span class="mut">${esc(h.artist)} · ${esc(h.genre)}</span></div><button data-re="${esc(h.title)}|${esc(h.artist)}">Re-analyse</button></div>`).join('')}`:'')+
   (les.length?`<h4>Lessons</h4>${les.map(l=>{const us=CAT.filter(s=>s.core.includes(l.id)||s.support.includes(l.id));return `<div class="lrow"><div style="flex:1"><span class="mono idx">${l.id}</span> ${esc(l.t)}${l.later?' <span class="mut">(coming)</span>':''}<div class="small mut">${us.length?us.map(s=>(s.core.includes(l.id)?'★':'')+esc(s.title)).join(' · '):'No songs yet'}</div></div><button data-sug="${l.id}">Suggest songs</button></div>`;}).join('')}`:'')+
   (!songs.length&&!les.length&&!hist.length?'':'')+
   `<div class="card"><button class="pri" data-new="${esc($('#q').value.trim())}">Analyse and add “${esc($('#q').value.trim())}”</button></div>`;
}
function startAnalyse(title,artist){tab('analyse');$('#a_mode').value='one';setMode();REQ=null;fillForm({title,artist});$('#a_text').value='';clearFiles();if(SAMPLE)runOne();}

/* ---------- Suggest songs ---------- */
function gapLessons(){return DP_INDEX.filter(l=>!l.info&&[5,6].includes(strandOf(l.id))&&levelOf(l.id)>=1&&!CAT.some(s=>s.core.includes(l.id)||s.support.includes(l.id)));}
function fillSuggestSelect(){const sel=$('#g_lesson');
  sel.innerHTML=`<option value="">Lessons with no songs yet (${gapLessons().length})</option>`+[...new Set(DP_INDEX.map(l=>levelOf(l.id)))].filter(n=>n>=1).map(L=>`<optgroup label="Level ${L}">${DP_INDEX.filter(l=>levelOf(l.id)===L&&!l.info).map(l=>`<option value="${l.id}">${l.id} ${esc(l.t)}</option>`).join('')}</optgroup>`).join('');}
async function runSuggest(id){
  if(id!=null)$('#g_lesson').value=id;tab('suggest');const lid=$('#g_lesson').value;const genre=$('#g_genre').value.trim();
  const targets=lid?[IDX[lid]]:gapLessons().slice(0,10);
  const have=CAT.map(s=>`${s.title} — ${s.artist}`).join('; ')+'; '+HIST.filter(h=>!h.error).map(h=>`${h.title} — ${h.artist}`).join('; ');
  const prompt=`You recommend play-along songs for DrumPath, a drum-lesson app. Kit: ${KIT}
Recommend well-known songs whose DRUM PART clearly uses these lessons:\n${targets.map(l=>`${l.id} | ${l.t}`).join('\n')}
${genre?`Prefer this genre or mood: ${genre}.`:''}
Avoid songs already in the library: ${have}
Pick recordings where the lesson's groove is the main feature, playable on one kick pedal. ${lid?'Give 6 songs.':'Give 1–2 songs per lesson.'}
Lesson list for tags:\n${LESSON_LINES}
Return JSON only: {"songs":[{"title":"","artist":"","genre":"","bpm":0,"bpmConfidence":0.0,"forLesson":"id","why":"one short line","tags":[{"id":"","weight":2}]}]}
Use only lesson ids from the list. bpm = pulse BPM, 0 if unsure.`;
  const out=$('#g_out');out.innerHTML='<div class="mut">Finding songs…</div>';$('#g_go').disabled=true;
  try{const r=await askJSON(prompt);const list=(r&&r.songs||[]).filter(s=>s.title);
    out.innerHTML=list.length?list.map((s,i)=>{const ct=cleanTags(s.tags).tags;return `<div class="lrow"><div style="flex:1"><b>${esc(s.title)}</b> <span class="mut">${esc(s.artist)} · ${esc(s.genre||'')}${s.bpm?' · ≈'+Math.round(s.bpm)+' BPM':''}</span>
      <div class="small">${IDX[s.forLesson]?`<span class="mono idx">${s.forLesson}</span> `:''}${esc(s.why||'')}</div><div class="small">${ct.map(t=>`<span class="mono idx">${t.weight===2?'★':''}${t.id}</span>`).join(' ')}</div></div>
      <button class="pri" data-new="${esc(s.title)}" data-artist="${esc(s.artist)}">Analyse &amp; add</button></div>`;}).join(''):'<div class="mut">No suggestions came back. Try another lesson.</div>';}
  catch(e){out.innerHTML=`<div class="mut">${e&&e.code==='not_granted'?'Suggestions are turned off for this page.':e&&e.code==='rate_limited'?'Too many requests — try again in a minute.':'Couldn’t get suggestions: '+esc(e&&e.message||e)}</div>`;}
  finally{$('#g_go').disabled=!SAMPLE;}
}

/* ---------- files ---------- */
function clearFiles(){MIDI_FILE=null;IMG_FILES=[];$('#a_midi').value='';$('#a_img').value='';$('#a_files').textContent='';}
function showFiles(){$('#a_files').textContent=[MIDI_FILE?'MIDI: '+MIDI_FILE.name:'',IMG_FILES.length?IMG_FILES.length+' image'+(IMG_FILES.length>1?'s':''):''].filter(Boolean).join(' · ');}

/* ---------- history ---------- */
function renderHist(){const box=$('#h_out');const h=HIST.filter(x=>!x.error);
  box.innerHTML=h.length?h.map((r,i)=>`<div class="lrow"><div style="flex:1"><b>${esc(r.title)}</b> <span class="mut">${esc(r.artist)} · ${esc(r.genre)} · L${r.level||'?'} · ${new Date(r.when).toLocaleDateString()}</span><div class="small">${r.tags.filter(t=>t.weight===2).map(t=>`<span class="mono idx">★${t.id}</span>`).join(' ')}</div></div><button data-open="${i}">Open</button></div>`).join(''):'<div class="mut">Songs you analyse appear here (saved in this browser).</div>';}

/* ---------- boot ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('button,a,[data-tab]');if(!t)return;
  if(t.dataset.tab&&t.classList.contains('tab')){tab(t.dataset.tab);if(t.dataset.tab==='history')renderHist();return;}
  if(t.dataset.re){const [a,b]=t.dataset.re.split('|');startAnalyse(a,b);return;}
  if(t.dataset.new!=null&&t.dataset.new!==undefined&&t.hasAttribute('data-new')){startAnalyse(t.dataset.new,t.dataset.artist||'');return;}
  if(t.dataset.sug){runSuggest(t.dataset.sug);return;}
  if(t.dataset.open){const r=HIST.filter(x=>!x.error)[+t.dataset.open];RESULTS=[r];tab('analyse');renderResults();return;}
  if(t.id==='sendlink'&&t.classList.contains('dis')){e.preventDefault();}
});
window.addEventListener('DOMContentLoaded',()=>{
  $('#genres').innerHTML=GENRES.map(g=>`<option value="${esc(g)}">`).join('');
  $('#a_paste').addEventListener('click',onPasteRequest);$('#a_mode').addEventListener('change',setMode);
  $('#a_go').addEventListener('click',()=>$('#a_mode').value==='batch'?runBatch():runOne());
  $('#a_clear').addEventListener('click',()=>{REQ=null;fillForm({});$('#a_text').value='';$('#a_batch').value='';clearFiles();RESULTS=[];renderResults();});
  $('#a_midi').addEventListener('change',e=>{MIDI_FILE=e.target.files[0]||null;showFiles();});
  $('#a_img').addEventListener('change',e=>{IMG_FILES=[...e.target.files].slice(0,3);showFiles();});
  $('#q').addEventListener('input',renderSearch);$('#g_go').addEventListener('click',()=>runSuggest());
  $('#codeclose').addEventListener('click',()=>$('#codedlg').hidden=true);
  fillSuggestSelect();renderSearch();setMode();tab(store.get('tab','analyse'));
  $('#stat').textContent=`${CAT.length} catalog songs · ${DP_INDEX.length} lessons`;
  // a plain hash can't carry data here, but try in case it does
  if(/^#(analyse|import)=/.test(location.hash)){$('#a_code').value=location.hash;onPasteRequest();}
  $('#a_go').disabled=true;$('#g_go').disabled=true;
  (window.claude&&claude.use?claude.use('sample'):Promise.resolve(null)).then(async s=>{SAMPLE=s;
    if(!s){$('#off').hidden=false;return;}
    try{const lim=await s.limits();IMG=!!(lim&&lim.images);}catch(_){}
    $('#a_imgwrap').hidden=!IMG;$('#a_go').disabled=false;$('#g_go').disabled=false;}).catch(()=>{$('#off').hidden=false;});
});
