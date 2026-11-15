/* DrumPath Theory — Tier B · Part B11: Listening 2 (thread E). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const B11_G=TX('Groove',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'});
DP_THEORY.push({id:'B11',tier:'B',th:'E',t:'Listening 2',d:'Ear training for band playing: hearing where a section changes, major vs minor chords, I/IV/V moves, half-time vs normal feel, and writing down a simple groove you hear.',ch:[
{id:'B11.01',t:'Hear the form',cards:[
 {id:'B11.01.1',t:'When does the section change?',idea:'Count bars while you listen and notice when the chord pattern stops repeating: that’s where a new section starts. Most sections are 4 or 8 bars.',
  dg:{type:'chart',bars:[['C'],['G'],['Am'],['F'],['F'],['G'],['C'],['C']],note:'a 4-bar loop, then something new'},ear:true,
  hear:{l:'▶ 8 bars',chords:['C','G','Am','F','F','G','C','C'],beats:4,bpm:120,ex:B11_G},
  rem:'Count bars; a new chord pattern = a new section.',links:{lessons:['3.7.01','3.7.03']},
  more:['Count “1 2 3 4, 2 2 3 4, 3 2 3 4…” so you always know which bar you’re in.'],
  check:[{q:'After how many bars does the pattern change?',hear:{chords:['G','D','Em','C','Am','Am','D','D'],beats:4,bpm:120,ex:B11_G},a:['4','8','2'],c:0,why:'Four bars loop, then the chords move somewhere new.'}]}
]},
{id:'B11.02',t:'Major or minor?',cards:[
 {id:'B11.02.1',t:'Chord colour (ear)',idea:'A major chord sounds bright and open, a minor chord darker and softer. Listen to the whole chord, not one note.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:[57,60,64]},ear:true,
  hear:[{l:'▶ C major',seq:[[60,64,67]],beats:3,bpm:60,voice:'pad'},{l:'▶ A minor',seq:[[57,60,64]],beats:3,bpm:60,voice:'pad'}],
  rem:'Bright = major. Dark = minor.',
  more:['Songs in minor keys often feel serious or sad; the band and the drums tend to play them with more weight.'],
  check:[{q:'Major or minor?',hear:{seq:[[62,65,69]],beats:3,bpm:60,voice:'pad'},a:['Minor','Major'],c:0,why:'D–F–A: D minor.'},
         {q:'Major or minor?',hear:{seq:[[65,69,72]],beats:3,bpm:60,voice:'pad'},a:['Major','Minor'],c:0,why:'F–A–C: F major.'}]}
]},
{id:'B11.03',t:'Hearing I, IV and V',cards:[
 {id:'B11.03.1',t:'Away or tension?',idea:'From the home chord, IV sounds like stepping away to somewhere calm; V sounds like a question that wants an answer.',
  dg:{type:'chart',bars:[['C'],['F'],['C'],['G']],rn:['I','IV','I','V']},ear:true,
  hear:[{l:'▶ I → IV',chords:['C','F'],beats:4,bpm:90},{l:'▶ I → V',chords:['C','G'],beats:4,bpm:90}],
  rem:'I → IV: stepping away. I → V: a question.',links:{lessons:['4.7.02']},
  more:['In a 12-bar blues, listen for bar 5 (IV) and bar 9 (V): the two big moves.'],
  check:[{q:'From home, does the chord go to IV or V?',hear:{chords:['G','D'],beats:4,bpm:90},a:['V','IV'],c:0,why:'G → D is I → V.'},
         {q:'And here?',hear:{chords:['A','D'],beats:4,bpm:90},a:['IV','V'],c:0,why:'A → D is I → IV.'}]}
]},
{id:'B11.04',t:'Feel changes',cards:[
 {id:'B11.04.1',t:'Normal or half-time?',idea:'In half-time the snare drops to beat 3 only and the song feels twice as slow, though the tempo hasn’t changed. Listen to where the snare falls.',
  dg:{type:'count',ex:TX('Half-time',2,{HH:'xxxxxxxx',K:'x.......',S:'....x...'})},ear:true,
  rem:'Snare on 2 and 4 = normal. Snare on 3 only = half-time.',links:{lessons:['4.5.01']},
  more:['Bridges and big last choruses often switch to half-time; hearing it on a recording tells you where to change.'],
  check:[{q:'Normal or half-time?',hear:{ex:TX('Clip',2,{HH:'xxxxxxxx',K:'x.......',S:'....x...'},{bars:2}),bpm:110,cin:false,click:'none'},a:['Half-time','Normal'],c:0,why:'One snare per bar, on 3.'},
         {q:'And this one?',hear:{ex:TX('Clip',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},{bars:2}),bpm:110,cin:false,click:'none'},a:['Normal','Half-time'],c:0,why:'Snare on 2 and 4.'}]}
]},
{id:'B11.05',t:'Write down what you hear',cards:[
 {id:'B11.05.1',t:'Transcribing a groove',idea:'To copy a groove by ear, take one voice at a time: hi-hat first (8ths or 16ths?), then the snare (where are the backbeats?), then the kick, the hardest.',
  dg:{type:'count',ex:TX('Grid',2,{HH:'xxxxxxxx',S:'..x...x.'})},ear:true,
  hear:{ex:TX('Groove',2,{HH:'xxxxxxxx',K:'x..x.x..',S:'..x...x.'},{bars:2}),bpm:90,click:'none',cin:false},
  rem:'Transcribe: hi-hat → snare → kick, one at a time.',links:{lessons:['2.7.01','3.7.01']},
  more:['Loop a short bit (Backline and the coming stem mixer can do that) and slow it down if you need to.'],
  check:[{q:'Hi-hat and snare are shown in the grid. Where does the kick play?',hear:{ex:TX('Groove',2,{HH:'xxxxxxxx',K:'x..x.x..',S:'..x...x.'},{bars:2}),bpm:90,click:'none',cin:false},a:['1, & of 2, & of 3','1 and 3','every beat'],c:0,why:'Kick on 1, the “&” of 2 and the “&” of 3.'}]}
]}
]});
