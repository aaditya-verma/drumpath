/* DrumPath — Studio, built into the app (D-021). One app, two homes:
   · claude.ai (the DrumPath artifact): Studio analyses inline with the artifact `sample` capability (Claude). No codes needed
     for songs in this copy; requests pasted from the tablet go back with an import link.
   · GitHub Pages (the tablet app): GitHub Pages can't call Claude, so Studio hands off: copy a request code, open DrumPath on
     claude.ai, analyse there, then "Send to the tablet app ↗" brings the result back for review.
   The artifact can't reach Google (Drive) and may not reach USB-MIDI: practise and sync on the tablet app. */
'use strict';
const TABLET_URL='https://aaditya-verma.github.io/drumpath/';
const ARTIFACT_URL='https://claude.ai/artifact/A4goxQDpCkAaK7wLE81eFx';
const isClaudeHost=()=>!!(window.claude&&window.claude.use);
VP.studio=VP.studio||{tab:'analyse',mode:'one',results:[],req:null,busy:'',sugLesson:'',sugGenre:'',sug:null};
let SAMPLE=null,SAMPLE_IMG=false,sampleState='unknown';   // unknown | ready | off
async function getSample(){
  if(sampleState!=='unknown')return SAMPLE;
  for(let i=0;i<30&&!isClaudeHost();i++)await sleep(100);
  if(!isClaudeHost()){sampleState='off';return null;}
  try{SAMPLE=await window.claude.use('sample');}catch(_){SAMPLE=null;}
  sampleState=SAMPLE?'ready':'off';
  if(SAMPLE){try{const l=await SAMPLE.limits();SAMPLE_IMG=!!(l&&l.images);}catch(_){}}
  return SAMPLE;
}
const studioHist={get(){try{return JSON.parse(localStorage.getItem('drumpath.studio.hist'))||[];}catch(_){return [];}},
  add(r){try{const h=[r,...this.get()].slice(0,60);localStorage.setItem('drumpath.studio.hist',JSON.stringify(h));}catch(_){}}};

/* ---------- Claude call ---------- */
const STUDIO_KIT='Alesis Nitro electronic kit: snare (head + rim), kick (one single pedal), hi-hat with pedal, 3 toms (T1 high, T2 mid, T3 floor), 1 crash, ride. No double pedal, no brushes.';
function lessonLines(){return [...LESSONS,...LATER.filter(l=>!LBY[l.id])].map(l=>`${l.id} | ${l.t}${l.bpm?` | ${l.bpm[0]}→${l.bpm[1]} BPM`:l.type&&l.type!=='play'?' | info':''}${l.later?' | not built yet':''}`).join('\n');}
function studioSchema(){const genres=[...new Set(allSongs().map(s=>s.genre))].sort();return `{
 "known": true|false, "title": "", "artist": "", "year": 0,
 "genre": "one of: ${genres.join(' | ')} (or a new short genre if none fits)", "genre2": "",
 "bpm": 0, "bpmConfidence": 0.0, "meter": "4/4", "feel": "straight | swing | shuffle | half-time | half-time shuffle",
 "level": 1, "difficulty": 1, "sections": [{"name":"Intro","bars":4}],
 "tags": [{"id":"2.5.01","weight":2,"reason":"one short line","confidence":0.0}],
 "grooves": {"main": PATTERN or null, "fill": PATTERN or null},
 "kitNotes": "", "plan": [{"id":"2.5.01","bpm":110}], "notes": ""
}
PATTERN = {"n":"Main groove","sub":2,"bars":1,"v":{"HH":"xxxxxxxx","S":"..x...x.","K":"x...x..."}}
 sub = steps per beat (1,2,3,4,6); each lane string is exactly 4*sub*bars characters in 4/4.
 Lanes: C crash, R ride, HH hi-hat, HP hi-hat pedal, S snare, T1 T2 T3 toms, K kick. Chars: x hit, X accent, g ghost, o open hi-hat, r rim, f flam, d drag, . rest.
 bpm = pulse BPM (quarter note; dotted quarter for 6/8 and 12/8), 0 if unknown; bpmConfidence ≤ 0.6 unless you are sure. weight 2 = core, 1 = support.`;}
const STUDIO_RULES=`Rules:
- Use ONLY lesson ids from the list. Prefer the lowest-level lesson that teaches each skill. 2–5 core tags, 0–5 support tags. "not built yet" lessons are allowed.
- Core = needed to play the main groove and main fills. Support = helps but not essential.
- Never invent a recording. If you don't know the song, set known=false, keep confidences low, and tag only from what the user gave.
- Write the main groove only if you are fairly sure of it; otherwise null.
- If you mention where to get a song file, name free sources only (Lakh MIDI, Groove MIDI Dataset, MuseScore Studio exports, TuxGuitar exports, or playing along in DrumPath). Never paid services.
- You cannot hear audio or browse. Return JSON only.`;
const LANE_SET=['C','R','HH','HP','S','T1','T2','T3','K'];
function cleanPattern(p){if(!p||typeof p!=='object'||!p.v)return null;const sub=+p.sub;if(![1,2,3,4,6].includes(sub))return null;
  const bars=Math.max(1,Math.min(4,+p.bars||1)),steps=+p.steps||4*sub,len=steps*bars,v={};
  for(const [k,s] of Object.entries(p.v)){if(!LANE_SET.includes(k)||typeof s!=='string')continue;const t=s.replace(/\s+/g,'');if(t.length!==len||!/^[xXgorfd.]+$/.test(t))return null;if(/[^.]/.test(t))v[k]=t;}
  if(!Object.keys(v).length)return null;const o={n:p.n||'Groove',sub,bars,v};if(p.steps&&+p.steps!==4*sub)o.steps=+p.steps;if(p.swing)o.swing=+p.swing;return o;}
function cleanTags(tags){const out=[],bad=[];(tags||[]).forEach(t=>{const id=String(t&&t.id||t).trim();if(!knownTag(id)){bad.push(id);return;}if(out.find(x=>x.id===id))return;
  out.push({id,weight:+t.weight===2?2:1,reason:String(t.reason||''),confidence:Math.max(0,Math.min(1,+t.confidence||0.6))});});return {tags:out,bad};}
// inp: {songId?,title,artist,link?,bpm?,meter?,text?,midiBytes?,images?}; ask = (prompt,opts)=>json (injectable for tests)
async function analyseSong(inp,onStep,ask){
  ask=ask||(async(p,o)=>{const s=await getSample();if(!s)throw {code:'not_granted',message:'Analysis is only available in DrumPath on claude.ai'};return s.json(p,Object.assign({modelTier:'default'},o||{}));});
  let midi=null;if(inp.midiBytes){onStep&&onStep('Reading the MIDI file…');midi=MidiAnalyse.analyse(inp.midiBytes,{lessons:LESSONS.filter(l=>l.ex),title:inp.title});}
  const parts=[`You classify songs for DrumPath, a drum-lesson app. Player's kit: ${STUDIO_KIT}`,`DrumPath lessons (id | name | start→goal BPM):\n${lessonLines()}`,
    `Song to analyse:\nTitle: ${inp.title||'(not given)'}\nArtist: ${inp.artist||'(not given)'}${inp.link?`\nLink: ${inp.link}`:''}${inp.bpm?`\nBPM the player measured: ${inp.bpm}`:''}${inp.meter?`\nMeter given: ${inp.meter}`:''}`];
  if(inp.text)parts.push(`Notes / tab pasted by the player:\n${String(inp.text).slice(0,6000)}`);
  if(midi){const f=midi.features;parts.push('A MIDI drum track was analysed on the device. Treat these as facts (tempo, meter, feel, sections come from the file):\n'+
    JSON.stringify({bpm:f.pulseBpm,meter:f.meter,feel:f.feel,shuffle:f.shuffle,halfTime:f.halfTime,timeSub:f.timeSub,timeLane:f.timeLane,hhOpenPerBar:f.hhOpenPerBar,ghostRatio:f.ghostRatio,flams:f.flams,drags:f.drags,fourFloor:f.fourFloor,kick16:f.kick16,xstick:f.xstick,linear:f.linear,doubleBass:f.doubleBass,difficulty:f.difficulty,sections:midi.sections,ruleTags:midi.suggestedTags.map(t=>[t.id,t.weight,t.reason])})+
    `\nMain groove from the file: ${JSON.stringify(midi.patterns.main)}`);}
  if(inp.images&&inp.images.length)parts.push('The attached image is drum notation or a tab for this song. Read the groove from it.');
  parts.push(`Return JSON in this shape:\n${studioSchema()}\n${STUDIO_RULES}`);
  onStep&&onStep('Analysing…');
  const r=await ask(parts.join('\n\n'),inp.images&&inp.images.length&&SAMPLE_IMG?{images:inp.images}:{})||{};
  const ct=cleanTags(r.tags);const tags=ct.tags;
  if(midi)midi.suggestedTags.forEach(t=>{const o=tags.find(x=>x.id===t.id);if(o){o.confidence=Math.min(0.95,o.confidence+0.15);o.weight=Math.max(o.weight,t.weight);if(!/MIDI/.test(o.reason))o.reason+=' · also found in the MIDI file';}
    else if(knownTag(t.id))tags.push({id:t.id,weight:t.weight,reason:t.reason+' (MIDI)',confidence:t.confidence});});
  const g=r.grooves||{},f=midi&&midi.features;
  const out={songId:inp.songId||'',title:inp.title||r.title||'',artist:inp.artist||r.artist||'',year:+r.year||null,genre:r.genre||(midi?midi.draftSong.genre:'Other'),
    bpm:f?Math.round(f.pulseBpm):(inp.bpm?+inp.bpm:Math.round(+r.bpm||0)),bpmSource:f?'midi':inp.bpm?'measured in DrumPath':'estimated by Studio',
    bpmConfidence:f?0.95:inp.bpm?0.9:Math.min(0.6,+r.bpmConfidence||0.4),meter:f?f.meter:(r.meter||inp.meter||'4/4'),feel:f?(f.feel+(f.halfTime?', half-time':'')):(r.feel||''),
    level:tags.filter(t=>t.weight===2).reduce((m,t)=>Math.max(m,+t.id.split('.')[0]),0)||+r.level||null,difficulty:f?f.difficulty:(+r.difficulty||null),
    sections:(midi?midi.sections:(Array.isArray(r.sections)?r.sections:[])).map(s=>({name:String(s.name||''),bars:+s.bars||0})).filter(s=>s.name),
    tags,rejected:ct.bad,grooves:midi?{main:midi.patterns.main,second:midi.patterns.second,fill:midi.patterns.fill}:{main:cleanPattern(g.main),fill:cleanPattern(g.fill)},
    kitNotes:(f&&f.doubleBass?'Fast double kicks thinned for one pedal. ':'')+(r.kitNotes||''),plan:(r.plan||[]).filter(p=>p&&knownTag(p.id)).slice(0,6),notes:r.notes||'',
    known:r.known!==false,link:inp.link||'',src:midi?'midi':inp.images&&inp.images.length?'image':'title',when:Date.now()};
  // 'To be ready' targets = the song's tempo, exactly as the tablet scores readiness (11a songScore: T = song BPM, else the lesson goal)
  out.plan=out.plan.map(p=>({id:p.id,bpm:out.bpm||(LBY[p.id]&&LBY[p.id].bpm?LBY[p.id].bpm[1]:+p.bpm||0)}));
  return out;
}
// readiness line: use this device's tempo for the song when it has one (same number the tablet's song page uses)
function planTarget(r){const loc=localTarget(r);return (loc&&songBpm(loc))||r.bpm||0;}
function planLine(r){const T=planTarget(r);const ids=r.plan.map(x=>x.id);
  return `<p class="mut" style="font-size:13px">To be ready: ${T?`play ${ids.join(' · ')} at ${T} BPM (the song’s tempo)`:r.plan.map(x=>x.id+(x.bpm?' → '+x.bpm:'')).join(' · ')}</p>`;}
// Studio result → the shared review card's input (11b-analyse.js)
function resultToReview(r){return {src:'studio',bpm:r.bpm||0,bpmNote:r.bpmSource+(r.bpmSource==='estimated by Studio'?' (Studio can’t hear audio — confirm with Tap tempo)':''),
  bpmConf:r.bpmConfidence,meter:r.meter,meterConf:r.src==='midi'?0.95:0.6,feel:r.feel,genre:r.genre,level:r.level,difficulty:r.difficulty,sections:r.sections,
  tags:r.tags.map(t=>Object.assign({},t)),patterns:r.grooves&&(r.grooves.main||r.grooves.fill)?r.grooves:null};}
const importPayload=list=>({v:1,...(SANDBOX?{test:1}:{}),songs:list.map(r=>({songId:r.songId||undefined,title:r.title,artist:r.artist,genre:r.genre,bpm:r.bpm||0,bpmSource:r.bpmSource==='midi'?'midi':r.bpmSource,
  meter:r.meter,feel:r.feel,link:r.link||undefined,tags:r.tags.filter(t=>t.weight>0).map(t=>({id:t.id,weight:t.weight,reason:t.reason,confidence:Math.round(t.confidence*100)/100})),
  grooves:r.grooves&&(r.grooves.main||r.grooves.fill)?r.grooves:undefined,sections:r.sections&&r.sections.length?r.sections:undefined}))});
// local target for a result: same song id, or the same title + artist, or none (→ new song)
const localTarget=r=>(r.songId&&songById(r.songId))||allSongs().find(s=>normT(s.title)===normT(r.title)&&(!r.artist||normT(s.artist)===normT(r.artist)))||null;
async function applyResultHere(r){
  let s=localTarget(r);
  if(!s){const u={id:'u'+Date.now().toString(36),catId:'',title:r.title||'Untitled',artist:r.artist||'',genre:r.genre||'Other',bpm:'',bpmSure:false,meter:r.meter||'4/4',link:r.link||'',notes:'',core:[],support:[],tags:[],updatedAt:Date.now()};
    state.songs.push(u);s=songById(u.id);const res=await reviewSheet(s.id,resultToReview(r));if(res!=='applied'){const k=state.songs.findIndex(y=>y.id===u.id);if(k>=0)state.songs.splice(k,1);}return res;}
  return reviewSheet(s.id,resultToReview(r));
}
// request codes from the tablet app: plain base64url JSON, or z/j import-style codes
async function readRequest(text){let c=String(text||'').trim();if(!c)throw new Error('Paste the code first');
  const m=c.match(/#(?:analyse|import)=([A-Za-z0-9_-]+)/);if(m)c=m[1];c=c.replace(/\s+/g,'');
  if((c[0]==='z'||c[0]==='j')&&c.length>2){try{return await unpackCode(c);}catch(_){}}
  return JSON.parse(new TextDecoder().decode(unb64u(c)));}

/* ---------- inline route (Analyse & tag › Analyse with Studio, on claude.ai) ---------- */
async function studioInline(songId,statusEl){
  const s=songById(songId);if(!s)return;const set=t=>{if(statusEl)statusEl.textContent=t;};
  try{const r=await analyseSong({songId:s.id,title:s.title,artist:s.artist,link:(s.cat?(state.songExtra[s.id]||{}).link:s.link)||'',bpm:bpmUnsure(s)?null:songBpm(s)||null,meter:s.meter||''},set);
    studioHist.add(r);closeSheets();await reviewSheet(s.id,resultToReview(r));}
  catch(e){set(studioErr(e));}
}
const studioErr=e=>e&&e.code==='not_granted'?'Analysis isn’t allowed in this view. Open DrumPath on claude.ai and allow it when asked.':e&&e.code==='rate_limited'?'Too many requests right now: wait a minute and try again.':'Couldn’t analyse: '+(e&&e.message||e);

/* ---------- Studio screen ---------- */
function renderStudio(){
  const p=VP.studio,claudeHost=isClaudeHost();
  const untagged=allSongs().filter(x=>!songHasTags(x));
  if(!claudeHost){
    view.innerHTML=`<h1>Studio</h1><p class="sub">Studio tags songs with lessons using Claude: from a title, a MIDI file, a photo of a drum sheet, or pasted notes. It runs in DrumPath on claude.ai; this tablet app hands the request over and takes the result back.</p>
     <div class="card"><h2 style="margin-top:0">How it works from here</h2><ol style="margin:0;padding-left:20px;line-height:1.7">
      <li>On a song page tap <b>Analyse &amp; tag › Analyse with Studio</b> (or use the button below for every song without lessons). DrumPath copies a code.</li>
      <li>DrumPath on claude.ai opens at Studio. Paste the code under <b>Paste a code from the tablet</b>, then <b>Analyse</b>.</li>
      <li>Tap <b>Send to the tablet app ↗</b>. You review every lesson here before anything is applied.</li></ol>
      <div class="row" style="margin-top:14px">${untagged.length?`<button class="pri" data-act="batchstudio">Analyse untagged songs (${untagged.length})</button>`:''}<a class="btn" href="${ARTIFACT_URL}#studio" target="_blank" rel="noopener">Open DrumPath on claude.ai ↗</a><button data-act="pasteimport">Paste import code</button></div></div>
     <p class="mut" style="font-size:13px">No-cost routes that work right here: Analyse &amp; tag › <b>From my playing</b> and <b>From a MIDI file</b> (free sources only).</p>`;
    return;}
  if(sampleState==='unknown'){getSample().then(()=>{if(cur==='studio')render();});}
  const off=sampleState==='off';
  const seg=`<div class="seg">${[['analyse','Analyse & add'],['suggest','Suggest songs'],['history','Analysed']].map(([k,l])=>`<button class="${p.tab===k?'on':''}" data-stab="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(p.tab==='analyse'){
    body=`<details class="card" ${p.req?'':''} style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">Paste a code from the tablet</summary>
      <p class="mut" style="font-size:13px">On the tablet app, Analyse &amp; tag › Analyse with Studio (or Analyse untagged songs) copies a code. Paste it here so the result goes back to the same song.</p>
      <textarea id="st_code" rows="3" style="width:100%" placeholder="Paste the code"></textarea><div class="row" style="margin-top:8px"><button class="pri" data-act="streq">Load</button></div></details>
     <div class="card"><div class="row" style="margin-top:0"><b style="font-size:18px">Analyse &amp; add</b><span class="sp"></span><div class="seg">${[['one','One song'],['batch','A list']].map(([k,l])=>`<button class="${p.mode===k?'on':''}" data-smode="${k}">${l}</button>`).join('')}</div></div>
      ${p.req&&p.req.songId?`<div class="mut" style="font-size:13px;margin-top:6px;color:var(--accent)">Linked to a song on the tablet: the result goes back to that song.</div>`:''}
      ${p.mode==='one'?`<div class="grid" style="margin-top:10px"><div><label class="f">Title</label><input id="st_t" value="${esc(p.req&&p.req.title||'')}"></div><div><label class="f">Artist</label><input id="st_a" value="${esc(p.req&&p.req.artist||'')}"></div>
        <div><label class="f">Link (optional)</label><input id="st_l" value="${esc(p.req&&p.req.link||'')}"></div><div><label class="f">BPM if you know it</label><input id="st_b" type="number" value="${p.req&&p.req.bpm||''}"></div>
        <div><label class="f">MIDI file (most accurate)</label><input id="st_m" type="file" accept=".mid,.midi,audio/midi,audio/x-midi"></div>
        ${SAMPLE_IMG?'<div><label class="f">Photo of drum sheet or tab</label><input id="st_i" type="file" accept="image/*" multiple></div>':''}</div>
        <label class="f">Notes or drum tab (optional)</label><textarea id="st_x" rows="2" style="width:100%"></textarea>`
       :`<label class="f" style="margin-top:10px">One song per line: Title — Artist (up to 25)</label><textarea id="st_batch" rows="7" style="width:100%">${esc(p.req&&p.req.batch?p.req.batch.map(x=>x.title+(x.artist?' — '+x.artist:'')).join('\n'):'')}</textarea>`}
      <div class="row" style="margin-top:12px"><button class="pri" data-act="stgo" ${off||p.busy?'disabled':''}>Analyse</button><button data-act="stclear">Clear</button><span class="mut" id="st_busy">${esc(p.busy||'')}</span></div>
      ${off?'<p style="color:var(--warn);margin-bottom:0">Analysis isn’t allowed in this view. Open DrumPath on claude.ai and allow it when asked.</p>':''}</div>
     ${p.results.map((r,i)=>resultCard(r,i,'res')).join('')}
     ${p.results.filter(r=>!r.error).length>1?`<div class="card"><div class="row" style="margin-top:0"><b>All ${p.results.filter(r=>!r.error).length} songs</b><span class="sp"></span><a class="btn pri" data-sendall href="#" target="drumpath-tablet">Send all to the tablet app ↗</a><button data-act="stcopyall">Copy import code</button></div></div>`:''}`;
  }else if(p.tab==='suggest'){
    const opts=[1,2,3,4,5,6,7,8,9,10].map(L=>{const ls=[...LESSONS,...LATER.filter(l=>!LBY[l.id])].filter(l=>l.lv===L&&(!l.type||l.type==='play'));return ls.length?`<optgroup label="Level ${L}">${ls.map(l=>`<option value="${l.id}" ${p.sugLesson===l.id?'selected':''}>${l.id} ${esc(l.t)}</option>`).join('')}</optgroup>`:'';}).join('');
    body=`<div class="card" style="margin-top:12px"><div class="grid"><div><label class="f">For lesson</label><select id="sg_l"><option value="">Lessons with no songs yet</option>${opts}</select></div><div><label class="f">Genre or mood (optional)</label><input id="sg_g" value="${esc(p.sugGenre)}" placeholder="e.g. 80s pop, Bollywood, funk"></div></div>
      <div class="row" style="margin-top:10px"><button class="pri" data-act="sggo" ${off||p.busy?'disabled':''}>Suggest songs</button><span class="mut">${esc(p.busy||'')}</span></div></div>
     ${p.sug?`<div class="card">${p.sug.length?p.sug.map((s,i)=>`<div class="row" style="flex-wrap:nowrap;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1"><b>${esc(s.title)}</b> <span class="mut">${esc(s.artist)} · ${esc(s.genre||'')}${s.bpm?' · ≈'+Math.round(s.bpm)+' BPM':''}</span><div class="mut" style="font-size:13px">${knownTag(s.forLesson)?`<span class="idx">${s.forLesson}</span> `:''}${esc(s.why||'')}</div></div><button class="sm pri" data-sgadd="${i}">Analyse &amp; add</button></div>`).join(''):'<span class="mut">No suggestions came back. Try another lesson.</span>'}</div>`:''}`;
  }else{const h=studioHist.get();
    body=`<div class="card" style="margin-top:12px">${h.length?h.map((r,i)=>`<div class="row" style="flex-wrap:nowrap;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1"><b>${esc(r.title)}</b> <span class="mut">${esc(r.artist)} · ${esc(r.genre)} · L${r.level||'?'} · ${new Date(r.when).toLocaleDateString()}</span></div><button class="sm" data-sthist="${i}">Open</button></div>`).join(''):'<span class="mut">Songs you analyse appear here (kept in this browser).</span>'}</div>`;}
  view.innerHTML=`<h1>Studio</h1><p class="sub">Tag songs with DrumPath lessons from a title, a MIDI file${SAMPLE_IMG?', a photo of a drum sheet':''} or pasted notes. You review every lesson before it’s applied. Studio can’t hear audio or browse the web: tempos are estimates unless they come from a MIDI file.</p>
   <div class="card" style="border:1px solid var(--line)"><span class="mut" style="font-size:13px">This is DrumPath on claude.ai. Practise, the kit and Google Drive sync live in the <a href="${TABLET_URL}" target="_blank" rel="noopener">tablet app</a>; results go there with <b>Send to the tablet app ↗</b>.</span></div>
   ${seg}${body}`;
  view.querySelectorAll('[data-sendlink]').forEach(async a=>{const r=VP.studio.results[+a.dataset.sendlink];a.href=TABLET_URL+'#import='+await packCode(importPayload([r]));});
  const all=view.querySelector('[data-sendall]');if(all)packCode(importPayload(VP.studio.results.filter(r=>!r.error))).then(c=>{all.href=TABLET_URL+'#import='+c;});
}
function resultCard(r,i){
  if(r.error)return `<div class="card" style="border:1px solid var(--bad)"><b>${esc(r.title)}</b> <span class="mut">couldn’t analyse: ${esc(r.error)}</span></div>`;
  const here=localTarget(r);
  return `<div class="card"><div class="row" style="margin-top:0;align-items:flex-start"><div style="flex:1;min-width:0"><b style="font-size:18px">${esc(r.title||'Untitled')}</b><div class="mut">${esc(r.artist||'Unknown artist')}${r.year?' · '+r.year:''}</div></div>
     <span class="chip">${esc(r.genre||'')}</span><span class="chip">${r.bpm?(r.bpmSource==='midi'?'':'≈')+r.bpm+' BPM':'BPM ?'}</span><span class="chip">L${r.level||'?'}</span><span class="chip">${esc(r.src==='midi'?'from MIDI':r.src==='image'?'from photo':'from title')}</span></div>
    ${!r.known&&r.src!=='midi'?'<p style="color:var(--warn);font-size:14px">Studio doesn’t know this recording well, so these lessons are a best guess. A MIDI file or your playing will be more accurate.</p>':''}
    <div class="chips" style="margin-top:8px">${r.tags.slice().sort((a,b)=>b.weight-a.weight).map(t=>`<span class="chip" title="${esc(t.reason)}" style="${t.weight===2?'border-color:var(--accent);color:var(--accent)':''}">${t.weight===2?'★ ':''}${t.id} ${esc((tagLesson(t.id)||{}).t||'')}</span>`).join('')}</div>
    ${r.rejected&&r.rejected.length?`<p class="mut" style="font-size:12px">Ignored unknown lesson ids: ${r.rejected.map(esc).join(', ')}</p>`:''}
    ${r.grooves&&r.grooves.main?`<div class="pat" style="margin-top:8px">${esc(patText(Object.assign({bars:1},r.grooves.main)))}</div>`:''}
    ${r.plan&&r.plan.length?planLine(r):''}
    <div class="row" style="margin-top:10px"><a class="btn pri" data-sendlink="${i}" href="#" target="drumpath-tablet">Send to the tablet app ↗</a>
     <button data-stapply="${i}">${here?'Review &amp; apply here':'Add here'}</button><button data-stcopy="${i}">Copy import code</button></div></div>`;
}
async function studioRun(){
  const p=VP.studio;const busy=t=>{p.busy=t;const el=$('#st_busy');if(el)el.textContent=t;};
  if(p.mode==='one'){
    const inp={songId:p.req&&p.req.songId||'',title:($('#st_t')||{}).value||'',artist:($('#st_a')||{}).value||'',link:($('#st_l')||{}).value||'',bpm:+($('#st_b')||{}).value||null,meter:p.req&&p.req.meter||'',text:($('#st_x')||{}).value||''};
    const mf=$('#st_m')&&$('#st_m').files[0],imgs=$('#st_i')?[...$('#st_i').files].slice(0,3):[];
    if(!inp.title&&!mf&&!imgs.length&&!inp.text){toast('Add a title, a MIDI file, a photo or some notes');return;}
    if(mf)inp.midiBytes=new Uint8Array(await mf.arrayBuffer());if(imgs.length)inp.images=imgs;
    try{const r=await analyseSong(inp,busy);studioHist.add(r);p.results=[r];}catch(e){toast(studioErr(e),5000);}
  }else{
    const lines=(($('#st_batch')||{}).value||'').split('\n').map(s=>s.trim()).filter(Boolean).slice(0,25);if(!lines.length){toast('Add one song per line');return;}
    const reqB=p.req&&Array.isArray(p.req.batch)?p.req.batch:[];p.results=[];
    for(let i=0;i<lines.length;i++){const [t,a]=lines[i].split(/\s+[—–-]\s+/);const fr=reqB.find(x=>normT(x.title)===normT(t))||{};busy(`Analysing ${i+1} of ${lines.length}: ${t}`);
      try{const r=await analyseSong({songId:fr.songId||'',title:t,artist:a||fr.artist||'',bpm:fr.bpm||null,meter:fr.meter||''});studioHist.add(r);p.results.push(r);}
      catch(e){if(e&&e.code==='rate_limited'){toast('Paused: too many requests. Try the rest in a minute.',5000);break;}if(e&&e.code==='not_granted'){toast(studioErr(e),5000);break;}p.results.push({title:t,artist:a||'',error:e.message||String(e)});}
      if(cur==='studio')render();}
  }
  busy('');if(cur==='studio')render();
}
async function studioSuggest(){
  const p=VP.studio;p.sugLesson=($('#sg_l')||{}).value||'';p.sugGenre=($('#sg_g')||{}).value||'';
  const used=new Set(allSongs().flatMap(s=>[...s.core,...s.support]));
  const targets=p.sugLesson?[tagLesson(p.sugLesson)]:[...LESSONS,...LATER.filter(l=>!LBY[l.id])].filter(l=>l.lv>=1&&[5,6].includes(l.sd)&&(!l.type||l.type==='play')&&!used.has(l.id)).slice(0,10);
  const have=allSongs().map(s=>`${s.title} — ${s.artist}`).join('; ');
  const prompt=`You recommend play-along songs for DrumPath, a drum-lesson app. Kit: ${STUDIO_KIT}
Recommend well-known songs whose DRUM PART clearly uses these lessons:\n${targets.map(l=>`${l.id} | ${l.t}`).join('\n')}
${p.sugGenre?`Prefer this genre or mood: ${p.sugGenre}.`:''}
Avoid songs already in the library: ${have}
Pick recordings where the lesson's groove is the main feature, playable on one kick pedal. ${p.sugLesson?'Give 6 songs.':'Give 1–2 songs per lesson.'}
Lesson list for tags:\n${lessonLines()}
Return JSON only: {"songs":[{"title":"","artist":"","genre":"","bpm":0,"forLesson":"id","why":"one short line","tags":[{"id":"","weight":2}]}]}
Use only lesson ids from the list. bpm = pulse BPM, 0 if unsure.`;
  p.busy='Finding songs…';render();
  try{const s=await getSample();if(!s)throw {code:'not_granted'};const r=await s.json(prompt,{modelTier:'default'});p.sug=(r&&r.songs||[]).filter(x=>x&&x.title);}
  catch(e){toast(studioErr(e),5000);}
  p.busy='';render();
}
// open the Studio screen from the claude.ai address (#studio)
function studioHash(){if(location.hash==='#studio'&&cur!=='studio')go('studio');}

/* ---------- tests (?test=1, Settings) ---------- */
async function studioTests(){
  const out=[],T=(n,ok,d)=>out.push({name:n,pass:!!ok,det:d||''});
  try{
    const fake=async()=>({known:true,genre:'Pop',bpm:126,bpmConfidence:0.5,meter:'4/4',feel:'straight',tags:[{id:'2.5.01',weight:2,reason:'8th hats + backbeat',confidence:0.7},{id:'9.9.99',weight:1},{id:'3.2.05',weight:1,reason:'open hats',confidence:0.6}],grooves:{main:{n:'Main',sub:2,bars:1,v:{HH:'xxxxxxxx',S:'..x...x.',K:'x...x...'}},fill:{sub:2,v:{S:'bad'}}}});
    const r=await analyseSong({title:'Love Me Again',artist:'John Newman'},null,fake);
    T('Studio result keeps known lessons and rejects unknown ids',r.tags.length===2&&r.rejected.includes('9.9.99'),r.tags.map(t=>t.id).join(' '));
    T('Studio marks a tempo without MIDI as an estimate',r.bpmSource==='estimated by Studio'&&r.bpmConfidence<=0.6,r.bpmSource);
    T('Invalid groove patterns are dropped, valid ones kept',r.grooves.main&&!r.grooves.fill,'');
    const n=[];for(let b=0;b<8;b++){for(let i=0;i<8;i++)n.push({q:b*4+i/2,note:42});n.push({q:b*4,note:36},{q:b*4+2,note:36},{q:b*4+1,note:38,vel:110},{q:b*4+3,note:38,vel:110});}
    const r2=await analyseSong({title:'X',midiBytes:MidiAnalyse.writeSMF(n,{bpm:120})},null,fake);const t2=r2.tags.find(t=>t.id==='2.5.01');
    T('With a MIDI file, tempo comes from the file and shared lessons gain confidence',r2.bpm===120&&r2.bpmSource==='midi'&&t2&&t2.confidence>0.7&&r2.tags.some(t=>t.id==='1.5.03'),'2.5.01 '+(t2&&t2.confidence));
    const code=await packCode(importPayload([Object.assign({},r,{songId:'u123'})]));const back=await unpackCode(code);
    T('“Send to the tablet app” carries songId and lessons in the import format',back.v===1&&back.songs[0].songId==='u123'&&back.songs[0].tags.length===2,'');
    const req=await readRequest(requestCode({songId:'u9',title:'A',artist:'B'}));T('Studio reads a request code from the tablet',req.songId==='u9'&&req.title==='A','');
    const keep=VP.studio.tab;renderStudio();
    T('Studio screen renders for this host',isClaudeHost()?!!view.querySelector('[data-stab]'):/claude\.ai/.test(view.textContent)&&!!view.querySelector('[data-act="batchstudio"]')||/claude\.ai/.test(view.textContent),isClaudeHost()?'claude.ai copy: inline analysis':'tablet app: hand-off');
    VP.studio.tab=keep;
  }catch(e){T('Studio tests',false,e.message||String(e));}
  return out;
}
