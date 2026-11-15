/* DrumPath Theory — Tier B · Part B9: Song form 2 (thread F). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
// tihai: a 5-note phrase (ta ka ta ki ta) + one-step gap, three times; the last note lands on the next bar's "1"
const B9_TIH=(()=>{const n=32,S=Array(n).fill('.'),syl=Array(n).fill('');[0,6,12].forEach(st=>{for(let i=0;i<5;i++){S[st+i]=i===0?'X':'x';syl[st+i]=TH_KON[5][i];}});
  const C=Array(n).fill('.');C[16]='x';const K=Array(n).fill('.');K[16]='x';return{S:S.join(''),C:C.join(''),K:K.join(''),syl};})();
DP_THEORY.push({id:'B9',tier:'B',th:'F',t:'Song form 2',d:'How whole songs are built: verse–chorus, AABA and strophic forms, pre-choruses, breakdowns and drops, the energy curve, how the drums shape each section, set-ups and endings, and the tihai.',ch:[
{id:'B9.01',t:'Common song forms',cards:[
 {id:'B9.01.1',t:'Verse–chorus',idea:'Most pop and rock songs alternate verses (the story, new words each time) with a chorus (the hook, same words each time), often with a bridge before the last chorus.',
  dg:{type:'form',parts:[['Intro',4],['Verse',8],['Chorus',8],['Verse',8],['Chorus',8],['Bridge',8],['Chorus',8],['Outro',4]]},
  rem:'Verse–chorus: V C V C B C. The chorus is the hook.',links:{lessons:['3.7.03']},
  more:['Backline’s song pages draw each song as a form strip like this one, from its MIDI file.'],
  check:[{q:'Which section usually repeats the same words each time?',a:['the chorus','the verse','the bridge'],c:0,why:'The chorus carries the hook.'}]},
 {id:'B9.01.2',t:'AABA (32 bars)',idea:'Four 8-bar sections: a main tune (A) twice, a contrasting bridge (B), then A again. It’s the form of most jazz standards and many older pop songs.',
  dg:{type:'form',parts:[['A',8],['A',8],['B',8],['A',8]]},
  rem:'AABA = 4 × 8 bars: A A, contrast B, A.',links:{lessons:['4.7.03']},
  more:['Jazz musicians call one pass through the form a “chorus”, even though there’s no chorus section in it.'],
  check:[{q:'In AABA, the B section is…',a:['the contrasting bridge','the chorus','the intro'],c:0,why:'B contrasts with the repeated A.'}]},
 {id:'B9.01.3',t:'Strophic: one section, many verses',idea:'Some songs repeat one section over and over with new words each time: many folk songs, hymns and blues. The drums create variety with dynamics and fills.',
  dg:{type:'form',parts:[['Verse 1',12],['Verse 2',12],['Verse 3',12],['Verse 4',12]]},
  rem:'Strophic = the same section again and again, new words.',links:{lessons:['4.7.02']},
  more:['A 12-bar blues is usually strophic: twelve bars, repeated, with solos taking some of the turns.'],
  check:[{q:'A strophic song mostly repeats…',a:['one section','two sections in turn','nothing'],c:0,why:'One section, new words each time.'}]}
]},
{id:'B9.02',t:'Extra sections',cards:[
 {id:'B9.02.1',t:'Pre-chorus',idea:'A short section between verse and chorus that builds tension: the harmony often stops on V, and the drums build (more cymbal, a roll, a fill) so the chorus lands with a bang.',
  dg:{type:'energy',parts:[['Verse',0.35],['Pre',0.6],['Chorus',0.9]]},
  rem:'Pre-chorus = the build-up. Drums grow into the chorus.',
  more:['A favourite build: 8ths on the snare in the last bar of the pre-chorus, getting louder, into a crash on the chorus.'],
  check:[{q:'The pre-chorus mainly…',a:['builds into the chorus','ends the song','starts the song'],c:0,why:'It raises tension.'}]},
 {id:'B9.02.2',t:'Post-chorus and tag',idea:'A post-chorus is a short repeated hook after the chorus (often just a chant or riff). A tag repeats the last line of a chorus to end it.',
  dg:{type:'form',parts:[['Chorus',8],['Post',4],['Verse',8]]},
  rem:'Post-chorus = extra hook after the chorus. Tag = last line again.',
  more:['Drum parts for post-choruses are often stripped back or more dance-like than the chorus itself.'],
  check:[{q:'A tag at the end of a chorus…',a:['repeats its last line','starts a new verse','is a drum solo'],c:0,why:'It extends the ending.'}]},
 {id:'B9.02.3',t:'Breakdown and drop',idea:'A breakdown strips the band back (sometimes to almost nothing); the drop brings everything back in at once. Electronic and modern pop music depend on it.',
  dg:{type:'energy',parts:[['Chorus',0.85],['Breakdown',0.2],['Build',0.55],['Drop',1]]},
  rem:'Breakdown = strip back. Drop = everything back at once.',
  more:['In a band the drummer usually controls the build: a snare roll that speeds up from quarters to 8ths to 16ths into the drop.'],
  check:[{q:'The drop is when…',a:['everything comes back in','the band stops','the tempo halves'],c:0,why:'Full energy returns at once.'}]}
]},
{id:'B9.03',t:'The energy curve',cards:[
 {id:'B9.03.1',t:'A song’s energy map',idea:'Most songs rise and fall: quieter verses, bigger choruses, a dip in the bridge, the biggest last chorus. Draw the curve before you play and you know where to save and where to spend.',
  dg:{type:'energy',parts:[['Intro',0.3],['V1',0.4],['C1',0.75],['V2',0.5],['C2',0.8],['Bridge',0.35],['C3',1],['Outro',0.4]]},
  rem:'Sketch the energy: save in verses, spend in the last chorus.',links:{lessons:['3.1.04']},
  more:['A common mistake is playing the first chorus at full power: there’s nowhere left to go.'],
  check:[{q:'Which chorus is usually the biggest?',a:['the last one','the first one','they are all equal'],c:0,why:'Songs build toward the end.'}]},
 {id:'B9.03.2',t:'How drums shape sections',idea:'Drummers mark sections with a few tools: hi-hat closed → open or ride, side-stick → snare, sparse kick → busier kick, softer → louder, and a fill or crash at each change.',
  dg:{type:'count',ex:TX('Verse → chorus',2,{HH:'xxxxxxxx'+'........',R:'........'+'xxxxxxxx',K:'x...x...'+'x..xx.x.',S:'..r...r.'+'..X...X.',C:'........'+'x.......'},{bars:2})},
  hear:{ex:TX('Verse → chorus',2,{HH:'xxxxxxxx'+'........',R:'........'+'xxxxxxxx',K:'x...x...'+'x..xx.x.',S:'..r...r.'+'..X...X.',C:'........'+'x.......'},{bars:2}),bpm:96},
  rem:'Section changes: change the cymbal, the snare sound, the kick, the volume.',links:{lessons:['3.5.01','3.2.04']},
  more:['Pick one or two changes per section, not all of them. Contrast is what the listener hears.'],
  check:[{q:'A common way to lift a chorus is to move from hi-hat to…',a:['ride or open hi-hat','a quieter hi-hat','no cymbal'],c:0,why:'A bigger cymbal sound lifts the section.'}]}
]},
{id:'B9.04',t:'Set-ups, fills and endings',cards:[
 {id:'B9.04.1',t:'Fill size matches the change',idea:'A small change (verse 1 → verse 2) gets a small fill or none; a big one (into the last chorus) gets a bigger fill. Fills are punctuation, not decoration.',
  dg:{type:'ladder',items:['none','1 beat','2 beats','1 bar'],note:'bigger change → bigger fill'},
  rem:'Small change, small fill. Big change, big fill.',links:{lessons:['2.6.01','3.6.01']},
  more:['A useful rule: the fill should end exactly on the next “1”, where the new section starts.'],
  check:[{q:'Into the final chorus, a fill is usually…',a:['bigger','smaller','left out'],c:0,why:'The biggest change gets the biggest fill.'}]},
 {id:'B9.04.2',t:'Endings',idea:'Songs end in a few ways: a cold stop (everyone stops on one hit), a ring-out (last chord held, drums roll or swell), or a fade. Agree the ending before you start.',
  dg:{type:'ladder',items:['cold stop','ring-out','fade'],note:'common endings'},
  rem:'Endings: cold stop · ring-out · fade. Agree it first.',links:{lessons:['1.6.04']},
  more:['For a ring-out, a cymbal swell or a snare/tom roll under the held chord, then a final hit when the leader cues it.'],
  check:[{q:'A cold stop means…',a:['everyone stops together on one hit','the music fades out','the band keeps playing'],c:0,why:'A sudden, shared stop.'}]}
]},
{id:'B9.05',t:'Konnakol 4: tihai',cards:[
 {id:'B9.05.1',t:'Three times, landing on 1',idea:'A tihai is a phrase played three times so that its last note lands exactly on the next “1”. It’s the classic Indian way to end a piece or section, and it makes a great fill.',
  dg:{type:'count',ex:TX('Tihai',4,{S:B9_TIH.S,C:B9_TIH.C,K:B9_TIH.K},{bars:2}),syl:B9_TIH.syl},
  hear:{ex:TX('Tihai',4,{S:B9_TIH.S,C:B9_TIH.C,K:B9_TIH.K},{bars:2}),bpm:60,syl:B9_TIH.syl,reps:1},
  try:{ex:[TX('Tihai',4,{S:B9_TIH.S,C:B9_TIH.C,K:B9_TIH.K},{bars:2})],bpm:56},
  rem:'Tihai = phrase × 3, the last note on “1”.',
  more:['This one is ta ka ta ki ta (5) + a one-16th gap, three times: 5 + 1 + 5 + 1 + 5 = 17 steps, so the 17th lands on the next bar’s “1”.'],
  check:[{q:'A tihai repeats its phrase…',a:['three times','twice','four times'],c:0,why:'Tihai = three.'}]},
 {id:'B9.05.2',t:'Building your own tihai',idea:'Pick a phrase length p and a gap g. Three phrases and two gaps take 3p + 2g steps; make that one more than the space you have, and the last note lands on “1”.',
  dg:{type:'ladder',items:['3p + 2g','= space + 1'],note:'p = phrase length · g = gap'},
  rem:'3 × phrase + 2 × gap = space + 1.',
  more:['For a 1-bar fill of 16 sixteenths: p = 5, g = 1 gives 17. For three beats (12 sixteenths): p = 3, g = 2 gives 13. Working them out is great practice in counting groups.','On the kit, move each repeat to a different drum (snare, high tom, floor tom) so the three are easy to hear.'],
  check:[{q:'With a phrase of 5 and gaps of 1, a tihai covers how many 16ths?',a:['17','15','16'],c:0,why:'3 × 5 + 2 × 1 = 17.'}]}
]}
]});
