/* DrumPath — G1 tours (build/guide-plan.md §5, D-044). Data only; the player is src/js/24-guide.js.
   A step: k = 'look' (Next moves on) · 'do' (waits until you tap / play the lit thing; "Skip this" after 10 s) · 'go' (opens
   another page; tapping the lit thing or Next both get there). at = the page the step belongs to (a route for guideGo(), or
   'any'); el = the target (selector, list of selectors tried in order, or a function); t = the prompt (≤ 3 short lines;
   may be a function for live numbers); how = one How-it-works page; why = what to say when the target isn't on the screen;
   run = the step starts a run (it is saved and counts, D-044 b); sim = test-only: does what the owner would do.
   RULES C10: a build step that changes a screen updates its tour steps here and bumps GD_CHECKED. */
'use strict';
const GD_CHECKED=36;   // every tour step and How page below was checked against this app version
const gdNav=k=>gdVis(`#bnav [data-nav="${k}"]`)||gdVis(`#tabs [data-nav="${k}"]`);
const gdLessonAt=()=>({v:'lesson',id:gdLesson()});
const gdPracAt=()=>({v:'practice',id:gdPracId()});
const gdRunSim=async()=>{await gdSimRun();};

const GD_TOURS=[
 {id:'welcome',n:1,t:'Welcome',sub:'the app in 2 minutes',from:'More › Guide',steps:[
  {k:'look',at:'home',el:'.brand',t:'DrumPath teaches drums from zero, one small step at a time. This tour shows where everything is.'},
  {k:'look',at:'home',el:'#p1today .p1h',t:'<b>Today</b> gives you a plan for the day: on the go (phone) or at the kit, 10, 20 or 40 min.',how:'today'},
  {k:'look',at:'home',el:()=>gdNav('lessons'),t:'<b>Lessons</b> is the skill map, Level 0 → 10, in order. <b>Practise</b> next to it starts today’s practice.'},
  {k:'look',at:'home',el:()=>gdNav('songs'),t:'<b>Songs</b> shows how ready you are for each song, worked out from the lessons it uses.'},
  {k:'look',at:'home',el:()=>gdNav('progress'),t:'<b>Progress</b> keeps every run: timeline, calendar, pads and records.'},
  {k:'look',at:'home',el:()=>gdVis('#morebtn')||gdVis('.dock .dk-nav'),t:'<b>More</b> has every section: Theory, Library, Time feel, Reflection, Settings and this Guide.'},
  {k:'look',at:'home',el:'#helpbtn',t:'Tap <b>?</b> on any page for help on that page: what’s there, its tour, and how it works.'},
  {k:'look',at:'home',el:'#view .fresh',t:'Everything here is free and saved on this device (and your Google Drive once connected). Export a backup now and then.',how:'data'}],
  end:{lab:'Start Today’s plan ›',fn:()=>{guideGo('home');const b=gdVis('#p1today [data-p1="resume"]')||gdVis('#p1today [data-p1="start"]');if(b)b.click();}}},

 {id:'today',n:2,t:'Today',sub:'your daily plan',from:'Home › Today',steps:[
  {k:'look',at:'home',el:'#p1today .p1h',t:'This is today’s plan. It is built each day from where you are: your lesson, your cards, your reviews.',how:'today'},
  {k:'do',at:'home',el:'#p1today .p1h .seg',t:'Pick where you are. <b>On the go</b> = phone, no kit. <b>At the kit</b> = a full session.',do:'Tap <b>At the kit</b> to try it.',sim:()=>{const b=$('#p1today [data-p1mode="kit"]');if(b)b.click();}},
  {k:'look',at:'home',el:'#p1today .p1opts .seg',t:'10, 20 or 40 minutes. The items scale; the order stays: warm-up, focus, review, some music.',why:'The 10 / 20 / 40-minute choice shows in <b>At the kit</b> mode.'},
  {k:'look',at:'home',el:['#p1today .p1list .p1it','#p1today .p1list'],t:'Each item says what, why and about how long. <b>ⓘ</b> opens a Quick look on the idea behind it.'},
  {k:'look',at:'home',el:'#p1today .p1streak',t:'The gentle streak: any practice day counts, even one theory card read on the phone.'},
  {k:'look',at:'home',el:'#p1today .p1go',t:'<b>Start session</b> runs the items in order; skip or end any time. Runs you play are saved and count.',how:'today'}]},

 {id:'lesson',n:3,t:'Your first lesson',sub:'play, score, pass',from:'Practise',steps:[
  {k:'go',at:'practise',el:()=>gdVis(`#view [data-open="${gdLesson()}"]`)||gdNav('lessons'),to:gdLessonAt,t:()=>`Lessons go in order, L0 → L10. Open your current lesson: <b>${esc(gdLesson()+' '+LBY[gdLesson()].t)}</b>.`},
  {k:'look',at:gdLessonAt,el:'#view .card.stat',how:'pass',t:()=>{const l=LBY[gdLesson()],p=state.prog[l.id]||{};return `Goal: 3 clean runs in a row at the target tempo (${p.bpm||l.bpm[0]} BPM). Then +${l.step} BPM, up to ${l.bpm[1]}.`;}},
  {k:'go',at:gdLessonAt,el:()=>gdVis(`#view [data-play="${gdLesson()}"]`),to:()=>({v:'practice',id:gdLesson()}),t:'<b>Practise</b> opens the practice screen for this lesson.'},
  {k:'look',at:()=>({v:'practice',id:gdLesson()}),el:['#prac .cvbox','#prac #nota'],t:'Notes slide towards the line. Hit each one as it crosses the line.'},
  {k:'look',at:()=>({v:'practice',id:gdLesson()}),el:'#prac .bpmc',how:'pass',t:'Tempo. Start below the goal if you need to: a clean run at 70 beats a sloppy one at 90 (coach rule D1).'},
  {k:'do',at:()=>({v:'practice',id:gdLesson()}),el:'#go',run:true,t:'Press <b>Start</b> (or crash ×2 at the kit). One bar of count-in, then play along.',do:'Play one run.',done:()=>gdPage()==='result',sim:gdRunSim},
  {k:'look',at:'result',el:'#result .score',how:'scoring',why:'This shows on the result, after a run.',t:()=>`On time = within ±${state.set.tol} ms of the note. ${state.set.pass} % or more on time = a clean run.`},
  {k:'look',at:'result',el:'#result [data-act="bpm-"]',how:'pass',why:'This shows on the result, after a run.',t:'Missed twice at one tempo? Drop 10 BPM and rebuild (coach rule D2): −5 BPM, twice.'},
  {k:'look',at:'progress',el:'#view h1',t:'Every run lands in <b>Progress</b>. Tap a day or a lesson to drill down.'}]},

 {id:'prac',n:4,t:'The practice screen',sub:'lane, tempo, click, notation',from:'any lesson',steps:[
  {k:'look',at:gdPracAt,el:'#ptitle',t:'The lesson you’re on. <b>✕</b> on the left closes the practice screen.'},
  {k:'look',at:gdPracAt,el:'#exsel',t:'Exercises: tap one to switch. Each keeps its own tempo record.'},
  {k:'look',at:gdPracAt,el:['#prac .cvbox','#prac #nota'],t:'The lane: notes slide to the line; hit as they cross it. Each colour is a pad.'},
  {k:'look',at:gdPracAt,el:'#nvsel',t:'<b>Grid · Notation · Both</b>: how the pattern is drawn. Notation is real drum notation.'},
  {k:'look',at:gdPracAt,el:'#prac .bpmc',how:'pass',t:'<b>− / +</b> change the tempo in steps of 5. Your target tempo is on the lesson page.'},
  {k:'look',at:gdPracAt,el:'#pdots',why:'The dots fill after your first runs at this tempo.',t:'The dots: clean runs in a row at the target tempo. Three = tempo up.'},
  {k:'look',at:gdPracAt,el:'#go',t:'<b>Start</b> runs the exercise, <b>Stop</b> ends it. No kit? The pads at the bottom play too.'}]},

 {id:'result',n:5,t:'Reading a result',sub:'score, pads, pocket',from:'a result',steps:[
  {k:'look',at:'result',el:'#result .score',how:'scoring',why:'Play one run first: this tour picks up on its result.',miss:{lab:'Open my lesson ›',fn:()=>guideGo('practice',{id:gdLesson()})},t:'Your score: notes on time ÷ all the notes. Green = enough for a clean run.'},
  {k:'look',at:'result',el:'#result table',why:'The per-pad table shows on a lesson result.',t:'Per pad: on time, hits, missed, extra, and average timing (− = early, + = late).'},
  {k:'look',at:'result',el:'#result .tfpk',why:'The pocket shows when the run had enough hits.',t:'Pocket: where you sit against the beat (ahead, on, behind) and how steady. <b>Per pad · per note</b> breaks it down.'},
  {k:'look',at:'result',el:'#result [data-act="again"]',how:'pass',t:'<b>Again</b> plays it once more. Three passes in a row at the target = tempo up.'},
  {k:'look',at:'result',el:'#result [data-run]',why:'Run detail shows for lesson runs.',t:'<b>Run detail</b> opens this run hit by hit. It is in Progress too.'}]},

 {id:'time',n:10,t:'Time feel',sub:'the gap click',from:'Practise › Time feel',kit:true,steps:[
  {k:'look',at:'time',el:'#view .tfc .tfh',how:'gap',t:'The gap click: the click drops out for a while. Keep playing, and land on time when it comes back.'},
  {k:'look',at:'time',el:'#view .tfc .tfh .seg',t:'The kit and the screen pads keep separate ladders (the screen’s tap delay is taken off).'},
  {k:'look',at:'time',el:'#view .tfl',how:'gap',t:()=>{const s=VP.time&&VP.time.src||tfSrcNow(),ld=tfLad(s);return `Ten steps. 2 clean runs in a row → up one; 2 rough → back one. You’re on step ${ld.s+1}.`;}},
  {k:'do',at:'time',el:'#view .tfc .row [data-tf="gap"]',run:true,t:'Play your step now: at the kit, or on the screen pads.',do:'Play the gap click once.',done:()=>gdPage()==='timeresult',sim:async()=>{tfOpen('gap');await gdSimRun({open:false});}},
  {k:'look',at:'timeresult',el:['#result .in > .row ~ *','#result .in'],why:'This shows after the gap click.',t:'Your drift each time the click came back (− = early). Clean runs move the ladder; this one is saved.',how:'gap'}]},

 {id:'atkit',n:11,t:'At the kit, hands-free',sub:'the pads drive the tour',from:'Kit › Kit remote',kit:true,steps:[
  {k:'look',at:'kit',el:'#kpcard',need:()=>kpKit()?'':'The kit isn’t connected: plug it in (tablet app, USB). You can still read on.',t:'Sit at the kit. Once learned, the pads move this tour: <b>high tom = Next</b>, <b>rim click = Back</b>.',how:'kitremote'},
  {k:'do',at:'kit',el:['.kpcard [data-kplearn="all"]','.kpcard [data-kplearn="stop"]'],t:'The kit remote is off until it learns your pads. Tap <b>Learn all</b> and hit each pad it asks for.',do:'Learn all five, or Next if they’re learned.',done:()=>GD.clicked&&KP_ACTS.every(a=>kpMapped(a.k))&&!KP.learn,sim:()=>{[['start',[49]],['again',[37]],['next',[48]],['slower',[43]],['back',[36,44]]].forEach(([k,n])=>{state.remote.map[k]={n,at:Date.now()};});state.remote.on=true;GD.clicked=true;}},
  {k:'do',at:gdPracAt,el:'#go',run:true,t:'<b>Crash ×2</b> starts a run (or tap Start). Try it now.',do:'Start one run.',done:()=>gdPage()==='result',sim:gdRunSim},
  {k:'look',at:'result',el:'#kplg',why:'The kit legend shows when the kit is connected and the remote is on.',t:'During a run the shortcuts are off, so a crash inside a groove never stops it. They come back 1.5 s after the run.',how:'kitremote'},
  {k:'look',at:'result',el:'#result .in > .row',t:'On a result: <b>rim = Again</b>, <b>high tom = Next item</b>, <b>floor tom = −5 BPM</b>. While this tour is open, high tom and rim move the tour.'},
  {k:'look',at:'any',el:()=>gdVis('#prac .ptop [data-act="pexit"]')||gdVis('#backb')||gdVis('.brand'),t:'<b>Kick + hi-hat pedal together</b> closes any sheet, and this tour. Try it to finish.'}]},

 {id:'new36',n:0,t:'What’s new in v36',sub:'the Guide',from:'More › Guide',whatsnew:36,steps:[
  {k:'look',at:'home',el:'#helpbtn',t:'New: <b>?</b> on every page. Help for that page, its tour, and how it works.'},
  {k:'look',at:{v:'guide',tab:'tours'},el:'#view .gdtours',t:'More › <b>Guide</b>: tours you can take any time, and how the app works, with your own numbers.'},
  {k:'look',at:'settings',el:'#gdset',t:'Hints are off. Switch on <b>Show hints</b> for a small “New here? Tour” pill the first time you open a page.'}]},
];
const GD_NEW=[{v:36,date:'16 Nov 2026',tour:'new36',items:[
  'A Guide in More › Guide: tours with on-screen steps, and How it works pages with your own numbers.',
  '“?” on every page (and on the practice screen): what’s here, its tour, how it works.',
  'At the kit, the pads drive a tour: high tom = Next, rim = Back, kick + pedal = close.',
  'Hints are off by default: Settings › Guide › Show hints.']}];
/* which tour and How pages belong to which page (the "?" sheet) */
const GD_PAGES={
  home:{t:'Home',what:'Today’s plan, your streak, and quick links to your kit, latency and backup.',tours:['welcome','today'],how:['today','data'],words:['Beat','BPM']},
  practise:{t:'Practise',what:'Today’s plan again, the song you’re closest to, lessons in progress, time feel and tools.',tours:['lesson'],how:['today','pass'],words:['Beat']},
  lessons:{t:'Lessons',what:'The skill map: Levels 0–10, each split into strands, each strand into lessons, in order.',tours:['lesson'],how:['pass']},
  lesson:{t:'A lesson',what:'Its target tempo, best score, practice time, tempo ladder, pads, songs that use it and every run.',tours:['lesson','prac'],how:['pass','scoring']},
  practice:{t:'Practice screen',what:'The lane (or notation), tempo, exercises and Start. Hit the notes as they cross the line.',tours:['prac','lesson'],how:['scoring','pass'],words:['Beat','BPM']},
  result:{t:'Result',what:'Your score for this run: notes on time, dynamics, pocket, and what to do next.',tours:['result'],how:['scoring','pass']},
  tapdrill:{t:'Tap drill',what:'Your current lesson on the screen pads, timing only; the click drops out for a bar.',tours:['today'],how:['today']},
  timedrill:{t:'Time feel drill',what:'Keep the beat while the click is quiet; land on time when it comes back.',tours:['time'],how:['gap']},
  timeresult:{t:'Time feel result',what:'How far off you were each time the click came back, and whether the ladder moved.',tours:['time'],how:['gap']},
  today:{t:'Today',what:'The screen for this item of your session: answer, play or write, then Next.',tours:['today'],how:['today']},
  time:{t:'Time feel',what:'The gap-click ladder, the tempo-drift test and your pocket over the last 30 days.',tours:['time'],how:['gap']},
  kit:{t:'Kit',what:'Your kit drawing, pad mapping, the kit remote, latency and the kit check.',tours:['atkit'],how:['kitremote']},
  settings:{t:'Settings',what:'Scoring, theme, testing mode, Google Drive, storage, backups and the Guide’s hints.',tours:['new36'],how:['data']},
  progress:{t:'Progress',what:'Every run: timeline, calendar, pads and limbs, records. Tap anything to drill down.',tours:[],how:['scoring']},
  songs:{t:'Songs',what:'Your song library and how ready you are for each, from the lessons it uses.',tours:[],how:[]},
  compare:{t:'Compare',what:'A crosstab of any measure: rows × columns × period. Tap a cell for its runs.',tours:[],how:[]},
  theory:{t:'Theory',what:'The music theory course: one-screen cards, Hear it, Try it, the Remember deck.',tours:[],how:[]},
  library:{t:'Library',what:'MIDI, audio and docs from your Google Drive, kept on this device for offline use.',tours:[],how:['data']},
  studio:{t:'Studio',what:'Tag songs with lessons using Claude (the claude.ai home).',tours:[],how:['data']},
  reflect:{t:'Reflection',what:'Your weekly review, pain notes and badges.',tours:[],how:[]},
  guide:{t:'Guide',what:'Tours you can take any time, How it works pages, and what’s new in each version.',tours:['welcome','new36'],how:[]},
};
