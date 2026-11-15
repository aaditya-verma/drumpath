/* DrumPath Theory — concept tags → cards (theory-brief §B). Lessons are tagged automatically from their exercise
   data (17-theory.js thTagsOf); `_lessons` is the small hand map for what the data can't show.
   A tag whose cards aren't written yet names the part that will teach it (`later`).
   Tags are instrument-neutral (rhythm, feel, form ideas, not pads), so other instruments (e.g. cajon, build/cajon-brief.md)
   can later map their own exercises to the same cards. */
'use strict';
/* TX = X() for theory cards: a lane or sticking written for one bar is repeated to fill every bar (never changes the lesson helpers' objects) */
var TX=(n,sub,v,o={})=>{const e=Object.assign({n,sub,bars:1},o,{v:Object.assign({},v)}),len=(e.steps||4*sub)*e.bars,fill=x=>x.length<len?x.repeat(Math.ceil(len/x.length)).slice(0,len):x;
  for(const k in e.v)e.v[k]=fill(e.v[k]);if(e.st)e.st=fill(e.st);return e;};
/* Konnakol (Tier B on, D-037): syllables per jathi (group size). 2 = ta ka, 3 = tisra, 4 = chatusra, 5 = khanda, 7 = misra. */
var TH_KON={1:['ta'],2:['ta','ka'],3:['ta','ki','ta'],4:['ta','ka','di','mi'],5:['ta','ka','ta','ki','ta'],6:['ta','ka','di','mi','ta','ka'],7:['ta','ki','ta','ta','ka','di','mi'],8:['ta','ka','di','mi','ta','ka','ju','na']};
// syllables for a run of groups, e.g. thKonRun([3,3,2]) → ta ki ta ta ki ta ta ka ; 0 = a one-step gap ('-')
var thKonRun=gs=>gs.flatMap(g=>g?TH_KON[g]:['-']);
// accent pattern for a run of groups: X on the first note of each group, x on the rest, . for a gap
var thKonAcc=gs=>gs.map(g=>g?'X'+'x'.repeat(g-1):'.').join('');
var DP_CONCEPTS={
  pulse:{t:'Pulse and beat',cards:['A1.02.1','A1.02.2']},
  tempo:{t:'Tempo and BPM',cards:['A1.03.1','A1.03.2','A1.03.4']},
  count:{t:'Counting out loud',cards:['A1.04.1','A1.04.2']},
  click:{t:'Playing with the click',cards:['A1.05.1','A1.05.2']},
  click24:{t:'A click that ticks less',cards:['A1.05.3']},
  bars:{t:'Bars and barlines',cards:['A1.06.1','A1.06.4']},
  meter44:{t:'4/4 time',cards:['A1.07.1','A1.07.2']},
  meter34:{t:'3/4 time',cards:['A1.07.3','B3.02.1','B3.02.2']},
  timefeel:{t:'Steady, rushing, dragging',cards:['A1.09.1','A1.09.2','A1.09.3','A1.09.4']},
  quarter:{t:'Quarter notes',cards:['A2.02.2']},
  wholehalf:{t:'Half and whole notes',cards:['A2.02.3','A2.02.4']},
  eighth:{t:'8th notes',cards:['A1.08.2','A2.04.1','A2.04.2']},
  sixteenth:{t:'16th notes',cards:['A1.08.3','A2.05.1','A2.05.2']},
  rests:{t:'Rests',cards:['A2.03.1','A2.03.2','A2.04.3']},
  mixed:{t:'Counting mixed bars',cards:['A2.07.1','A2.07.2','A2.07.3']},
  groove:{t:'Reading a groove',cards:['A2.08.1','A2.08.2','A4.01.1']},
  backbeat:{t:'The backbeat',cards:['A4.02.1']},
  rockbeat:{t:'The 8th-note rock beat',cards:['A4.04.1','A4.04.3']},
  fill:{t:'Fills',cards:['A4.05.1','A4.05.2','A4.05.4','B9.04.1']},
  crash1:{t:'Crash on 1',cards:['A4.06.1']},
  sticking:{t:'Sticking letters',cards:['A3.03.1','A3.03.2']},
  accent:{t:'Accents',cards:['A3.04.1','A3.04.2']},
  ghost:{t:'Ghost notes',cards:['A3.05.1','A3.05.2']},
  openhh:{t:'Open and closed hi-hat',cards:['A3.06.1','A3.06.2']},
  rim:{t:'Rim and cross-stick',cards:['A3.07.1','A3.07.2']},
  dynamics:{t:'Dynamics',cards:['A3.08.1','A3.08.3','A4.07.1','B12.05.1']},
  drumkey:{t:'The drum key',cards:['A2.01.1','A3.01.1']},
  repeat:{t:'Repeat signs',cards:['A2.09.1','A2.09.2']},
  form:{t:'Song form',cards:['A8.01.1','A8.05.1','A4.05.2','B9.01.1','B9.03.2']},
  phrase:{t:'Phrases',cards:['A8.03.1','A8.04.1']},
  blues:{t:'12-bar blues',cards:['A7.05.3','A8.05.2','B7.05.1','B7.05.2','B5.05.1']},
  progressions:{t:'Chord progressions and cadences',cards:['B7.01.2','B7.03.1','B7.03.3','B7.04.1']},
  seventh:{t:'7th chords',cards:['B8.02.2','B8.04.1','B8.04.2']},
  chords:{t:'Chords and chord charts',cards:['A7.01.1','A7.04.2','A7.04.3']},
  listen:{t:'Listening',cards:['A9.01.1','A9.01.2','A9.02.1','B11.01.1','B11.05.1']},
  countin:{t:'Count-ins',cards:['A10.01.1','A10.02.1']},
  ending:{t:'Endings',cards:['A10.02.2','A4.07.3','B9.04.2']},
  cues:{t:'Cues',cards:['A10.04.1','A10.04.2']},
  mistakes:{t:'Keeping going',cards:['A10.05.1','A10.05.3']},
  triplet:{t:'Triplets',cards:['B2.01.1','B2.01.2','B2.01.3','B2.02.1','B2.03.1']},
  swing:{t:'Swing and shuffle',cards:['B2.04.1','B2.04.2','B2.05.1','B2.05.2']},
  compound:{t:'6/8 and 12/8',cards:['B3.01.1','B3.01.2','B3.03.1','B3.03.2']},
  flam:{t:'Flams',cards:['B4.01.1']},drag:{t:'Drags',cards:['B4.01.2']},roll32:{t:'Rolls on the page',cards:['B4.02.1','B4.02.2']},
  dotted:{t:'Dotted notes',cards:['B1.01.1','B1.01.2']},ties:{t:'Ties',cards:['B1.02.1','B1.02.2']},
  syncopation:{t:'Syncopation and pushes',cards:['B1.03.1','B1.03.2','B1.03.3']},
  shapes16:{t:'16th-note shapes',cards:['B1.04.2','B1.05.1','B1.05.3','B1.05.4']},
  twovoice:{t:'Two-voice drum music',cards:['B1.06.1','B1.06.2']},
  konnakol:{t:'Konnakol',cards:['B1.07.1','B1.07.2','B1.07.3','B2.06.1','B3.07.1','B9.05.1']},
  groupings:{t:'Groupings (jathis)',cards:['B3.07.1','B3.07.2','B3.07.3']},
  halftime:{t:'Half-time and double-time',cards:['B3.05.1','B3.05.2','B11.04.1']},
  cuttime:{t:'2/4 and cut time',cards:['B3.04.1','B3.04.2']},pickup:{t:'Pick-ups',cards:['B3.06.1']},
  roadmap:{t:'Road maps (D.C., D.S., coda, endings)',cards:['B4.03.1','B4.03.2','B4.03.3','B4.03.4']},
  hits:{t:'Band hits',cards:['B4.06.1','B4.06.2']},rudiments:{t:'The rudiments',cards:['B4.01.3']},
  tihai:{t:'Tihai',cards:['B9.05.1','B9.05.2']},
  rock:{t:'Rock and pop',cards:['B10.01.1','B10.01.2']},funk:{t:'Funk',cards:['B10.02.1']},disco:{t:'Disco',cards:['B10.02.2']},
  reggae:{t:'Reggae',cards:['B10.04.1']},country:{t:'Country',cards:['B10.05.1','B10.05.2']},
  bluesfeel:{t:'Blues feels',cards:['B10.06.1','B2.05.2']},jazzride:{t:'The jazz ride pattern',cards:['B10.06.2','B2.04.2']},
  leadsheet:{t:'Lead sheets and numbers',cards:['B12.01.1','B12.02.1']},lockbass:{t:'Locking with the bass',cards:['B12.04.1','B12.04.2']},
  chart:{t:'Reading a real chart',cards:['B4.04.1','B4.07.1','B4.07.2']},
  _lessons:{'0.1.01':['drumkey'],'2.1.01':['drumkey'],'1.2.02':['pulse','count'],'1.7.01':['click','timefeel'],'2.1.05':['bars','meter44'],'2.1.06':['tempo'],
    '1.6.02':['bars','fill','phrase'],'1.6.04':['crash1','countin','ending','cues'],'2.1.07':['mixed'],'2.7.01':['count','listen'],'3.7.01':['listen'],'3.7.03':['form','phrase','roadmap','chart'],'4.7.02':['form','blues','chords','progressions','seventh'],'2.6.01':['phrase'],'4.5.02':['phrase','groupings'],'3.1.01':['wholehalf'],'3.1.04':['dynamics','accent','ghost'],'3.1.05':['repeat','chart'],
    '3.4.05':['dynamics'],'3.7.02':['click24','timefeel'],'4.4.03':['dynamics'],'4.7.01':['click24','timefeel'],
    '4.1.02':['dotted'],'2.4.05':['syncopation','lockbass'],'3.6.02':['syncopation','groupings'],'4.5.03':['syncopation'],'4.5.01':['halftime'],
    '3.4.01':['twovoice'],'3.4.03':['twovoice','lockbass'],'3.8.01':['chart'],'4.1.01':['triplet'],'4.7.03':['progressions','seventh','jazzride'],'2.3.05':['rudiments'],'3.3.03':['rudiments'],'3.5.06':['disco'],'3.5.03':['country'],'3.5.04':['country'],'3.5.02':['country'],'4.5.07':['jazzride'],'4.5.08':['bluesfeel'],'4.5.09':['bluesfeel'],'3.2.07':['funk'],'4.2.05':['funk'],'2.5.01':['rock'],'4.5.04':['rock']}
};
