/* DrumPath Theory — concept tags → cards (theory-brief §B). Lessons are tagged automatically from their exercise
   data (17-theory.js thTagsOf); `_lessons` is the small hand map for what the data can't show.
   A tag whose cards aren't written yet names the part that will teach it (`later`). */
'use strict';
/* TX = X() for theory cards: a lane or sticking written for one bar is repeated to fill every bar (never changes the lesson helpers' objects) */
var TX=(n,sub,v,o={})=>{const e=Object.assign({n,sub,bars:1},o,{v:Object.assign({},v)}),len=(e.steps||4*sub)*e.bars,fill=x=>x.length<len?x.repeat(Math.ceil(len/x.length)).slice(0,len):x;
  for(const k in e.v)e.v[k]=fill(e.v[k]);if(e.st)e.st=fill(e.st);return e;};
var DP_CONCEPTS={
  pulse:{t:'Pulse and beat',cards:['A1.02.1','A1.02.2']},
  tempo:{t:'Tempo and BPM',cards:['A1.03.1','A1.03.2','A1.03.4']},
  count:{t:'Counting out loud',cards:['A1.04.1','A1.04.2']},
  click:{t:'Playing with the click',cards:['A1.05.1','A1.05.2']},
  click24:{t:'A click that ticks less',cards:['A1.05.3']},
  bars:{t:'Bars and barlines',cards:['A1.06.1','A1.06.4']},
  meter44:{t:'4/4 time',cards:['A1.07.1','A1.07.2']},
  meter34:{t:'3/4 time',cards:['A1.07.3'],later:'B3'},
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
  fill:{t:'Fills',cards:['A4.05.1','A4.05.2','A4.05.4']},
  crash1:{t:'Crash on 1',cards:['A4.06.1']},
  sticking:{t:'Sticking letters',cards:['A3.03.1','A3.03.2']},
  accent:{t:'Accents',cards:['A3.04.1','A3.04.2']},
  ghost:{t:'Ghost notes',cards:['A3.05.1','A3.05.2']},
  openhh:{t:'Open and closed hi-hat',cards:['A3.06.1','A3.06.2']},
  rim:{t:'Rim and cross-stick',cards:['A3.07.1','A3.07.2']},
  dynamics:{t:'Dynamics',cards:['A3.08.1','A3.08.3','A4.07.1']},
  drumkey:{t:'The drum key',cards:['A2.01.1','A3.01.1']},
  repeat:{t:'Repeat signs',cards:['A2.09.1','A2.09.2']},
  form:{t:'Song form',cards:['A4.05.2'],later:'A8'},
  triplet:{t:'Triplets',cards:[],later:'B2'},swing:{t:'Swing and shuffle',cards:[],later:'B2'},compound:{t:'6/8 and 12/8',cards:[],later:'B3'},
  flam:{t:'Flams',cards:[],later:'B4'},drag:{t:'Drags',cards:[],later:'B4'},roll32:{t:'Rolls and 32nds',cards:[],later:'B4'},
  _lessons:{'0.1.01':['drumkey'],'2.1.01':['drumkey'],'1.2.02':['pulse','count'],'1.7.01':['click','timefeel'],'2.1.05':['bars','meter44'],'2.1.06':['tempo'],
    '1.6.02':['bars','fill'],'1.6.04':['crash1'],'2.1.07':['mixed'],'2.7.01':['count'],'3.1.01':['wholehalf'],'3.1.04':['dynamics','accent','ghost'],'3.1.05':['repeat'],
    '3.4.05':['dynamics'],'3.7.02':['click24','timefeel'],'4.4.03':['dynamics'],'4.7.01':['click24','timefeel']}
};
