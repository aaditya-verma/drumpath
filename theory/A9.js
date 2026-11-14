/* DrumPath Theory — Tier A · Part A9: Listening 1 (thread E). Own words. Card ids are permanent once shipped.
   Listening cards (ear:true): the check plays a sound; all answers right = “Can hear”. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const A9_V=TX('Verse',2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'}),A9_C=TX('Chorus',2,{R:'xxxxxxxx',C:'x.......',K:'x..xx...',S:'..X...X.'});
DP_THEORY.push({id:'A9',tier:'A',th:'E',t:'Listening 1',d:'Ear skills every band drummer uses: finding the beat and beat 1, counting bars by ear, hearing the chorus arrive, hearing chords change, and feeling the backbeat.',ch:[
{id:'A9.01',t:'Find the beat',cards:[
 {id:'A9.01.1',t:'Tap along',idea:'To find the beat of any song, tap your foot and let it settle. Your first taps may drift; within a few seconds they lock to the pulse.',
  dg:{type:'feel',mode:'steady'},hear:[{l:'▶ Slower song',ex:TX('Groove',2,B8,{bars:2}),bpm:76,click:'none'},{l:'▶ Faster song',ex:TX('Groove',2,B8,{bars:2}),bpm:126,click:'none'}],ear:true,
  rem:'Foot first, count second: let your tap settle on the pulse.',links:{lessons:['2.7.01']},
  more:['Tap to the kick and snare, not the hi-hat: the hi-hat often plays twice per beat.'],see:['A1.02.2'],
  check:[{q:'Tap along. About how fast is this?',hear:{ex:TX('Groove',2,B8,{bars:2}),bpm:120,click:'none',reps:2,cin:false},a:['About 120 BPM (two taps a second)','About 60 BPM (one tap a second)'],c:0,why:'Your foot lands twice every second: about 120.'}]},
 {id:'A9.01.2',t:'Find “1”',idea:'Beat 1 is where things happen: chords change, the crash hits, the kick lands with the bass. Listen for those to find the start of the bar.',
  dg:{type:'count',ex:TX('Find 1',1,{C:'x...',K:'x..x',S:'.x.x',HH:'.xxx'})},hear:{ex:TX('Find 1',1,{C:'x.......',K:'x..xx...',S:'.x.x.x.x',HH:'.xxx.xxx'},{bars:2}),bpm:96,click:'none',cin:false},ear:true,
  rem:'Beat 1 = chord change, crash, strongest kick.',
  more:['If you come in on the wrong beat, the snare lands on 1 and 3 and everything feels upside down. Find 1 before you play.'],
  check:[{q:'In this clip, which beat has the crash?',hear:{ex:TX('Crash',1,{C:'x...',K:'x.x.',S:'.x.x',HH:'.xxx'},{bars:2}),bpm:96,click:'none',cin:false},a:['Beat 1','Beat 3','Beat 4'],c:0,why:'The crash marks the top of each bar.'}]}
]},
{id:'A9.02',t:'Count bars by ear',cards:[
 {id:'A9.02.1',t:'Hear the phrase',idea:'While a song plays, count bars: the crash or chord change at the start of a phrase tells you if your count is right.',
  dg:{type:'form',parts:[['Phrase',4],['Phrase',4]],fills:true},
  hear:{l:'▶ 8 bars',ex:TX('Phrases',1,{C:'x...'+'.'.repeat(12),HH:'.xxx'+'xxxx'+'xxxx'+'xx..',K:'x.x.x.x.x.x.x...',S:'.x.x.x.x.x.x.xxx'},{bars:4}),bpm:110,reps:2},ear:true,
  rem:'Count bars while listening; the next crash should land on your “1”.',links:{lessons:['2.7.01','3.7.01']},
  check:[{q:'How many bars until the crash comes back?',hear:{ex:TX('Phrases',1,{C:'x...'+'.'.repeat(12),HH:'.xxx'+'xxxx'+'xxxx'+'xx..',K:'x.x.x.x.x.x.x...',S:'.x.x.x.x.x.x.xxx'},{bars:4}),bpm:110,reps:2,cin:false},a:['4','2','8'],c:0,why:'A fill in bar 4, then the crash on the next 1: a 4-bar phrase.'}]}
]},
{id:'A9.03',t:'Hear the chorus arrive',cards:[
 {id:'A9.03.1',t:'Signs of a chorus',idea:'A chorus usually arrives with more energy: louder drums, a crash, ride or open hi-hat, fuller chords, and the singer’s catchiest line.',
  dg:{type:'energy',parts:[['Verse',0.45],['Chorus',0.85]]},hear:[{l:'▶ Verse',chords:['Am','F','C','G'],beats:4,bpm:96,ex:A9_V,gain:0.55},{l:'▶ Chorus',chords:['F','G','C','Am'],beats:4,bpm:96,ex:A9_C}],ear:true,
  rem:'Chorus = more energy: crash, ride/open hats, fuller sound.',see:['A8.01.2'],
  check:[{q:'Verse or chorus?',hear:{chords:['F','G','C','C'],beats:4,bpm:96,ex:A9_C},a:['Chorus','Verse'],c:0,why:'Crash on 1, ride, accents: chorus energy.'},
   {q:'And this one?',hear:{chords:['Am','F','C','G'],beats:4,bpm:96,ex:A9_V,gain:0.55},a:['Verse','Chorus'],c:0,why:'Cross-stick, closed hats, softer: verse.'}]}
]},
{id:'A9.04',t:'Hear a chord change',cards:[
 {id:'A9.04.1',t:'Did the chord change?',idea:'Listen to the bass note and the colour of the chord on each beat 1. A change sounds like the floor moving under the music.',
  dg:{type:'chart',bars:[['C'],['C'],['F'],['C']]},hear:{chords:['C','C','F','C'],beats:4,bpm:96},ear:true,
  rem:'Listen to the bass on beat 1: new note = new chord.',
  check:[{q:'Does the chord change in the middle of this clip?',hear:{chords:['C','G'],beats:4,bpm:96},a:['Yes','No'],c:0,why:'C, then G.'},
   {q:'And here?',hear:{chords:['Am','Am'],beats:4,bpm:96},a:['No','Yes'],c:0,why:'A minor both times.'}]},
 {id:'A9.04.2',t:'How many chords in the loop?',idea:'Count the changes in a loop: many songs use 4 chords, some just 2. The loop length tells you the phrase length.',
  dg:{type:'chart',bars:[['C'],['G'],['Am'],['F']]},hear:{chords:['C','G','Am','F'],beats:4,bpm:100},ear:true,
  rem:'Count the chords in the loop; it repeats every phrase.',see:['A7.05.2'],
  check:[{q:'How many different chords in this loop?',hear:{chords:['D','A','D','A'],beats:4,bpm:100},a:['2','4','1'],c:0,why:'D and A, twice.'}]}
]},
{id:'A9.05',t:'Feel the backbeat',cards:[
 {id:'A9.05.1',t:'Clap on 2 and 4',idea:'Put on any rock or pop song and clap only on 2 and 4. If your claps line up with the snare, you’ve found the backbeat by ear.',
  dg:{type:'count',ex:TX('Backbeat',1,{K:'x.x.',S:'.x.x'},{bars:2})},hear:{chords:['G','C','G','D'],beats:4,bpm:100,ex:TX('Beat',1,{K:'x.x.',S:'.x.x',HH:'xxxx'})},
  try:{ex:[TX('Snare on 2 and 4',1,{S:'.x.x'},{bars:2})],bpm:90},
  rem:'Clap with the snare: 2 and 4.',see:['A4.02.2'],
  check:[{q:'In a rock song, the snare usually plays on…',a:['2 and 4','1 and 3','every beat'],c:0,why:'That’s the backbeat.'}]}
]}
]});
