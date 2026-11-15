/* DrumPath Theory — Tier B · Part B12: Playing with others 2 (thread B). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
DP_THEORY.push({id:'B12',tier:'B',th:'B',t:'Playing with others 2',d:'The working band musician’s toolkit: lead sheets, Nashville numbers, transposing and the capo, locking with the bass, playing dynamics as a band, and running a setlist with segues.',ch:[
{id:'B12.01',t:'Lead sheets',cards:[
 {id:'B12.01.1',t:'What a lead sheet is',idea:'A lead sheet is one page with the melody, the chord symbols and the form (repeats, endings). There’s no drum part: you read the form and the chords and make your own part.',
  dg:{type:'chart',bars:[['C'],['Am'],['F'],['G7']],note:'a lead sheet line: chords above the melody'},
  rem:'Lead sheet = melody + chords + form. You invent the drum part.',links:{lessons:['3.7.03']},
  more:['Jazz musicians share tunes this way; pop bands use chord charts, which are lead sheets without the melody.'],
  check:[{q:'A lead sheet shows…',a:['melody, chords and form','only the drum part','only the lyrics'],c:0,why:'It’s a one-page map of the song.'}]},
 {id:'B12.01.2',t:'Reading one as a drummer',idea:'From a lead sheet, take the tempo and style, count the form (bars per section), note the road map and any rhythmic hits in the melody, then decide where your fills and changes go.',
  dg:{type:'ladder',items:['style','form','road map','hits','your plan'],note:'what to take from a lead sheet'},
  rem:'Lead sheet → style, form, road map, hits → your plan.',links:{lessons:['3.8.01']},
  more:['Pencil your plan above the chords: “ride”, “fill”, “half-time”, “stop”.'],
  check:[{q:'The most important thing a drummer takes from a lead sheet is…',a:['the form and road map','the melody notes','the chord colours'],c:0,why:'Knowing where you are keeps the band together.'}]}
]},
{id:'B12.02',t:'Nashville numbers',cards:[
 {id:'B12.02.1',t:'Chords as numbers',idea:'The Nashville number system writes chords as scale numbers: 1 4 5 6- in place of C F G Am. The same chart works in any key; the band just agrees the key.',
  dg:{type:'chart',bars:[['1'],['5'],['6-'],['4']],note:'= C G Am F in C, or D A Bm G in D'},
  hear:[{l:'▶ in C',chords:['C','G','Am','F'],beats:4,bpm:96},{l:'▶ in D',chords:['D','A','Bm','G'],beats:4,bpm:96}],
  rem:'Nashville: 1 4 5 6- … one chart, any key.',
  more:['A minus sign means minor (6-); a diamond around a number means hit it and let it ring.'],
  check:[{q:'In the key of G, a Nashville “4” is…',a:['C','D','A'],c:0,why:'G A B C: the 4th note is C.'}]}
]},
{id:'B12.03',t:'Transposing and the capo',cards:[
 {id:'B12.03.1',t:'Transposing',idea:'Transposing moves every chord up or down by the same distance, so a song fits a singer’s voice. C G Am F up two half steps becomes D A Bm G.',
  dg:{type:'chart',bars:[['C → D'],['G → A'],['Am → Bm'],['F → G']]},
  hear:[{l:'▶ original (C)',chords:['C','G','Am','F'],beats:4,bpm:96},{l:'▶ up 2 (D)',chords:['D','A','Bm','G'],beats:4,bpm:96}],
  rem:'Transpose = move every chord the same distance.',
  more:['For the drummer nothing changes except tom tuning, if you tune to the key. Backline can transpose its chord charts ±6.'],
  check:[{q:'Transposing a song changes…',a:['the key of every chord','the tempo','the form'],c:0,why:'Only the pitch moves.'}]},
 {id:'B12.03.2',t:'The capo',idea:'A capo clamps across a guitar neck so open-chord shapes sound higher. With a capo on fret 2, a G shape sounds as A.',
  dg:{type:'neck',strings:['E','A','D','G','B','E'],frets:5,hi:[[0,2,''],[1,2,''],[2,2,''],[3,2,''],[4,2,''],[5,2,'']]},
  rem:'Capo up n frets = everything n half steps higher. (Dots: the capo across fret 2.)',
  more:['Backline’s song sheets show a capo hint when a song’s chords are easier with one.'],
  check:[{q:'Capo on fret 3, playing a C shape, sounds as…',a:['E♭','C','D'],c:0,why:'Three half steps above C is E♭.'}]}
]},
{id:'B12.04',t:'Locking with the bass',cards:[
 {id:'B12.04.1',t:'Kick and bass together',idea:'The kick and the bass guitar are the band’s foundation. When the kick plays where the bass notes start, the groove sounds tight and powerful.',
  dg:{type:'count',ex:TX('Kick with the bass',2,{HH:'xxxxxxxx',K:'x..x..x.',S:'..x...x.'})},
  hear:{l:'▶ Kick with the bass line',chords:['A','A','D','E'],beats:4,bpm:96,ex:TX('Groove',2,{HH:'xxxxxxxx',K:'x..x..x.',S:'..x...x.'})},
  rem:'Kick where the bass plays = a tight band.',links:{lessons:['2.4.05','3.4.03']},
  more:['At rehearsal, ask the bassist to play their line alone and copy its rhythm with your kick.'],
  check:[{q:'For a tight groove, the kick usually lines up with…',a:['the bass','the vocal','the crash'],c:0,why:'Kick and bass form the foundation.'}]},
 {id:'B12.04.2',t:'Leave space',idea:'Groove comes from what you leave out as much as what you play. If the bass is busy, simplify the kick; if the vocal is busy, simplify the fills.',
  dg:{type:'energy',parts:[['busy bass',0.8],['your kick',0.3]]},
  rem:'Busy band → simpler drums. Space is part of the groove.',
  more:['Listen to the whole band, not just yourself: the best drummers are the best listeners.'],
  check:[{q:'If the bassist plays a busy line, the kick should usually…',a:['simplify','get busier','stop'],c:0,why:'Two busy parts fight each other.'}]}
]},
{id:'B12.05',t:'Dynamics as a band',cards:[
 {id:'B12.05.1',t:'Follow the singer',idea:'The whole band rises and falls together, and the singer usually leads. When the vocal drops, everyone drops; the drummer is the volume knob the band follows.',
  dg:{type:'energy',parts:[['Verse',0.35],['Chorus',0.85],['Quiet verse',0.25],['Last chorus',1]]},
  rem:'Band dynamics: follow the singer; the drums lead the volume.',links:{lessons:['3.4.05','4.4.03']},
  more:['Practise playing a whole groove at three levels: soft, medium, loud. It’s harder (and more useful) than it sounds.'],
  check:[{q:'When the singer gets quieter, the band should…',a:['get quieter too','stay the same','get louder'],c:0,why:'The band supports the vocal.'}]}
]},
{id:'B12.06',t:'Setlists and segues',cards:[
 {id:'B12.06.1',t:'Planning a setlist',idea:'A good setlist varies tempo, feel and key so the set flows: open strong, put slower songs in the middle, finish with energy. Note each song’s tempo and count-in.',
  dg:{type:'energy',parts:[['Opener',0.85],['2',0.7],['Ballad',0.3],['4',0.6],['5',0.75],['Closer',1]]},
  rem:'Setlist: vary tempo and feel; strong start, strong finish.',
  more:['Backline’s setlists save each song with its tempo and transpose, and can be shared with the band as a link.'],
  check:[{q:'Slower songs usually go…',a:['in the middle of the set','first','last'],c:0,why:'Start and end with energy.'}]},
 {id:'B12.06.2',t:'Segues',idea:'A segue goes straight from one song into the next without stopping. Either keep the same tempo and change the groove, or hold the last chord and count the new tempo off.',
  dg:{type:'form',parts:[['Song 1 end',4],['segue',1],['Song 2',8]]},
  rem:'Segue = no gap: keep the tempo, or hold and count off.',
  more:['Practise the transition itself at rehearsal; it’s where most mistakes happen live.'],
  check:[{q:'In a segue, the band…',a:['goes straight into the next song','stops and tunes','plays a drum solo'],c:0,why:'No gap between songs.'}]}
]}
]});
