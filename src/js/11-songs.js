/* DrumPath — Songs: tagged with the lessons they use, readiness from lessons done */
'use strict';
function renderSongs(){
  const list=state.songs.map((s,i)=>{const r=songReady(s);return `<div class="card" style="margin-bottom:10px">
   <div class="row">${ring(r,52,6)}<div><b style="font-size:18px">${esc(s.title)}</b> <span class="mut">${esc(s.artist)}${s.bpm?' · ~'+esc(s.bpm)+' BPM':''}</span></div><span class="sp"></span>
   ${s.link?`<a href="${esc(s.link)}" target="_blank" rel="noopener" style="color:var(--blue)">Open track</a>`:''}
   <button class="sm" data-edit="${i}">Edit</button><button class="sm ghost" data-del="${i}">Delete</button></div>
   <div class="row" style="margin:8px 0">${s.tags.map(t=>`<span class="chip tag" data-open="${esc(t)}">${esc(t)} ${LBY[t]?esc(LBY[t].t):''} ${LBY[t]&&statusOf(LBY[t])==='ms'?'✓':''}</span>`).join('')}</div>
   <div class="mut" style="font-size:14px">${s.tags.filter(t=>LBY[t]&&statusOf(LBY[t])==='ms').length} of ${s.tags.length} tagged lessons done</div>
   ${s.notes?`<div class="mut" style="margin-top:6px">${esc(s.notes)}</div>`:''}</div>`;}).join('');
  const have=new Set(state.songs.map(s=>s.title.toLowerCase()));
  const sug=SUGGEST.filter(s=>!have.has(s.title.toLowerCase()));
  view.innerHTML=`<h1>Songs</h1><p class="sub">Each song is tagged with the lessons it uses. Readiness = share of those lessons you’ve finished. Play along to your own audio (Spotify, YouTube…).</p>
   <div class="row" style="margin-bottom:14px"><button class="pri" data-edit="-1">+ Add song</button></div>
   ${list||'<div class="card mut">No songs yet. Add your own, or pick from the starter list below.</div>'}
   ${sug.length?`<h2>Starter suggestions</h2><div class="card">${sug.map(s=>`<div class="lrow" style="cursor:default"><div><b>${esc(s.title)}</b> <span class="mut">${esc(s.artist)} · ~${s.bpm} BPM</span><div class="mut" style="font-size:14px">${esc(s.notes)} Tags: ${s.tags.join(', ')}</div></div><span class="sp"></span><button class="sm" data-addsug="${esc(s.title)}">Add</button></div>`).join('')}</div><p class="mut" style="font-size:13px">Tempos are approximate; tags are a starting point, edit them as you learn the songs.</p>`:''}`;
}
function songModal(i){
  const s=i>=0?state.songs[i]:{title:'',artist:'',bpm:'',link:'',tags:[],notes:''};
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="card sheet"><h2 style="margin-top:0">${i>=0?'Edit':'Add'} song</h2>
   <label class="f">Title</label><input id="s_t" value="${esc(s.title)}">
   <label class="f">Artist</label><input id="s_a" value="${esc(s.artist)}">
   <label class="f">Approx. BPM</label><input id="s_b" type="number" value="${esc(s.bpm)}">
   <label class="f">Link to the track (optional)</label><input id="s_l" value="${esc(s.link)}" placeholder="https://…">
   <label class="f">Lessons used (tap to toggle)</label>
   <div id="s_tags" style="max-height:220px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:6px">${LESSONS.filter(l=>l.type==='play').map(l=>`<label class="row" style="padding:3px 0"><input type="checkbox" value="${l.id}" ${s.tags.includes(l.id)?'checked':''}> <span class="idx">${l.id}</span> ${esc(l.t)}</label>`).join('')}</div>
   <label class="f">Notes</label><textarea id="s_n" rows="2">${esc(s.notes)}</textarea>
   <div class="row" style="margin-top:14px"><button class="pri" id="s_save">Save</button><button id="s_x">Cancel</button></div></div>`;
  document.body.appendChild(m);
  $('#s_x',m).onclick=()=>m.remove();
  $('#s_save',m).onclick=()=>{const t=$('#s_t',m).value.trim();if(!t){toast('Add a title');return;}
    const o={title:t,artist:$('#s_a',m).value.trim(),bpm:$('#s_b',m).value,link:$('#s_l',m).value.trim(),notes:$('#s_n',m).value.trim(),tags:[...m.querySelectorAll('#s_tags input:checked')].map(x=>x.value)};
    if(o.link&&!/^https?:\/\//.test(o.link))o.link='https://'+o.link;
    if(i>=0)state.songs[i]=o;else state.songs.push(o);save();m.remove();render();};
}
