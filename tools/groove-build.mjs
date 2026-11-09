// Build-time: analyse the Groove MIDI Dataset (Google Magenta, CC BY 4.0) with src/js/midi-analyse.js.
// Usage: node tools/groove-build.mjs <dir with info.csv + drummer*/...mid> [outDir]
// Writes data/groove/grooves.json (app data: patterns + tags, no MIDI) and data/groove/calibration.json.
// With DUMP=1 also writes tools/out/features.json (per-file features, for tuning thresholds).
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const M=require(path.join(ROOT,'src/js/midi-analyse.js'));
const src=process.argv[2],out=process.argv[3]||path.join(ROOT,'data/groove');
// lessons (for pattern-similarity tags)
const ctx=vm.createContext({});['lessons/lib.js','lessons/L0-2.js','lessons/L3.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx));
const lessons=vm.runInContext('DP_LESSONS',ctx).filter(l=>l.ex);
// GMD style → DrumPath catalog genre
const GENRE={rock:'Rock',punk:'Punk',pop:'Pop',funk:'Funk & Soul',soul:'Funk & Soul',gospel:'Funk & Soul',neworleans:'Funk & Soul',hiphop:'Hip-hop & R&B',
  jazz:'Jazz',blues:'Blues',country:'Country',reggae:'Reggae',latin:'Latin & Caribbean',afrocuban:'Latin & Caribbean',afrobeat:'Latin & Caribbean',
  highlife:'Latin & Caribbean',middleeastern:'Prog & Odd time',dance:'Disco'};
const csv=fs.readFileSync(path.join(src,'info.csv'),'utf8').trim().split(/\r?\n/);const head=csv.shift().split(',');
const rows=csv.map(l=>{const v=l.split(',');return Object.fromEntries(head.map((h,i)=>[h,v[i]]));});
const grooves=[],dump=[],errors=[];let nBpm=0,nMeter=0,nType=0,nGenre=0,nOk=0;const conf={beat:{beat:0,fill:0},fill:{beat:0,fill:0}};const byStyle={};
for(const r of rows){
  const f=path.join(src,r.midi_filename);let a;
  try{a=M.analyse(fs.readFileSync(f),{lessons});}catch(e){errors.push(r.midi_filename+': '+e.message);continue;}
  nOk++;const F=a.features,bpm=+r.bpm,meter=r.time_signature.replace('-','/'),type=r.beat_type,style=r.style.split('/')[0];
  const okB=Math.abs(F.bpm-bpm)<=2,okM=F.meter===meter,pred=F.isFill?'fill':'beat',okT=pred===type,g=GENRE[style]||'Rock',okG=a.draftSong.genre===g;
  nBpm+=okB;nMeter+=okM;nType+=okT;nGenre+=okG;conf[type][pred]++;const s=byStyle[g]=byStyle[g]||{n:0,ok:0};s.n++;s.ok+=okG;
  dump.push({f:r.midi_filename,bpm,meter,type,style:r.style,dur:+r.duration,okB,okM,okT,okG,F,guess:a.draftSong.genre});
  const id=r.id.replace(/\//g,'-').replace('drummer','d').replace('session','s').replace('eval_s','e');
  const P=a.patterns,pick=P.main||P.fill;if(!pick)continue;
  grooves.push({id,st:r.style,g,bpm,m:meter,t:type,dr:r.drummer.replace('drummer',''),dur:Math.round(+r.duration),
    sub:pick.sub,steps:pick.steps,clicks:pick.clicks,sw:pick.swing,main:P.main?P.main.v:null,fill:P.fill&&type==='beat'?P.fill.v:null,
    tags:a.suggestedTags.map(t=>[t.id,t.weight]),lv:a.level,feel:F.feel,diff:F.difficulty});
}
const n=nOk,pct=x=>Math.round(1000*x/Math.max(1,n))/10;
const cal={files:rows.length,parsed:n,errors,bpmWithin2:pct(nBpm),meterCorrect:pct(nMeter),beatFill:pct(nType),styleGenre:pct(nGenre),
  confusion:conf,byGenre:Object.fromEntries(Object.entries(byStyle).map(([k,v])=>[k,Math.round(100*v.ok/v.n)+'% of '+v.n])),
  targets:{bpmWithin2:95,meterCorrect:98,beatFill:85},analyser:M.version,date:new Date().toISOString().slice(0,10)};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'grooves.json'),JSON.stringify(grooves));
fs.writeFileSync(path.join(out,'calibration.json'),JSON.stringify(cal,null,1));
if(process.env.DUMP){fs.mkdirSync(path.join(ROOT,'tools/out'),{recursive:true});fs.writeFileSync(path.join(ROOT,'tools/out/features.json'),JSON.stringify(dump));}
console.log(JSON.stringify(cal,null,1));
