/* DrumPath Theory — Tier B · Part B8: 7th chords (thread H). Own words. Card ids are permanent once shipped.
   Half-diminished and diminished 7ths play exact notes (seq), not chord names. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const B8_MAJ7=[60,64,67,71],B8_DOM7=[60,64,67,70],B8_MIN7=[60,63,67,70],B8_HD=[60,63,66,70],B8_DIM7=[60,63,66,69];
DP_THEORY.push({id:'B8',tier:'B',th:'H',t:'7th chords',d:'Four-note chords: major 7, dominant 7, minor 7 and half-diminished, why the dominant 7 wants to resolve, and how to read the chord symbols on a lead sheet.',ch:[
{id:'B8.01',t:'Adding the 7th',cards:[
 {id:'B8.01.1',t:'Stack one more 3rd',idea:'A triad is three notes stacked in 3rds. Stack one more 3rd on top and you have a 7th chord: root, 3rd, 5th and 7th.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:B8_MAJ7,marks:{60:'1',64:'3',67:'5',71:'7'}},hear:[{l:'▶ Triad',seq:[[60,64,67]],beats:3,bpm:60,voice:'pad'},{l:'▶ 7th chord',seq:[B8_MAJ7],beats:3,bpm:60,voice:'pad'}],
  rem:'7th chord = triad + one more 3rd (1 3 5 7).',
  more:['The extra note adds colour: richer, softer or more restless depending on which 7th it is.'],
  check:[{q:'A 7th chord has how many different notes?',a:['4','3','7'],c:0,why:'Root, 3rd, 5th and 7th.'}]}
]},
{id:'B8.02',t:'The four types',cards:[
 {id:'B8.02.1',t:'Major 7: dreamy',idea:'A major triad with a major 7th (a half step below the octave). Soft, dreamy and a little bittersweet: soul ballads, bossa nova and lo-fi love it.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:B8_MAJ7},hear:{seq:[B8_MAJ7],beats:4,bpm:60,voice:'pad'},
  rem:'Cmaj7 = C E G B: dreamy.',
  more:['Written Cmaj7, CM7 or C with a small triangle.'],
  check:[{q:'Cmaj7 contains…',a:['C E G B','C E G B♭','C E♭ G B♭'],c:0,why:'Major triad + major 7th (B).'}]},
 {id:'B8.02.2',t:'Dominant 7: bluesy and restless',idea:'A major triad with a minor 7th (a whole step below the octave). It sounds bluesy and unfinished: it wants to move.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:B8_DOM7},hear:{seq:[B8_DOM7],beats:4,bpm:60,voice:'pad',flats:true},
  rem:'C7 = C E G B♭: bluesy, wants to move.',links:{lessons:['4.7.02']},
  more:['In a blues, every chord is often played as a dominant 7: A7, D7, E7. That’s a big part of the blues sound.'],
  check:[{q:'C7 (dominant 7) contains…',a:['C E G B♭','C E G B','C E♭ G B♭'],c:0,why:'Major triad + minor 7th (B♭).'}]},
 {id:'B8.02.3',t:'Minor 7: smooth',idea:'A minor triad with a minor 7th. Smooth and mellow: funk vamps, R&B and jazz use it everywhere.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:B8_MIN7},hear:{seq:[B8_MIN7],beats:4,bpm:60,voice:'pad',flats:true},
  rem:'Cm7 = C E♭ G B♭: smooth.',
  more:['A one-chord funk groove is often just a minor 7 chord held while the drums and bass do the work.'],
  check:[{q:'Cm7 contains…',a:['C E♭ G B♭','C E G B','C E♭ G♭ B♭'],c:0,why:'Minor triad + minor 7th.'}]},
 {id:'B8.02.4',t:'Half-diminished: tense',idea:'A diminished triad with a minor 7th (written ø, or m7♭5). Dark and tense: it’s the ii chord of a minor key, and leads strongly to V.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:B8_HD},hear:[{l:'▶ Cø',seq:[B8_HD],beats:4,bpm:60,voice:'pad',flats:true},{l:'▶ Cdim7 (all minor 3rds)',seq:[B8_DIM7],beats:4,bpm:60,voice:'pad',flats:true}],
  rem:'Cø = C E♭ G♭ B♭: tense, leads to V.',
  more:['Its cousin the full diminished 7 (C°7) stacks only minor 3rds; it sounds like suspense music in old films.'],
  check:[{q:'The symbol ø (or m7♭5) means…',a:['half-diminished','major 7','dominant 7'],c:0,why:'Diminished triad + minor 7th.'}]}
]},
{id:'B8.03',t:'Why the dominant 7 resolves',cards:[
 {id:'B8.03.1',t:'The tritone inside',idea:'G7 contains B and F, a tritone apart. Both notes lean into C major: B up to C, F down to E. That double pull is why V7 → I sounds so final.',
  dg:{type:'keys',from:53,oct:2,names:true,hi:[55,59,62,65],marks:{59:'B',65:'F'}},hear:{l:'▶ G7 → C',seq:[[55,59,62,65],[60,64,67,72]],beats:3,bpm:60,voice:'pad'},
  rem:'V7 holds a tritone that pulls straight into I.',
  more:['Jazz harmony is full of tricks built on this one tritone (Tier C: tritone substitution).'],
  check:[{q:'In G7 → C, the note B moves to…',a:['C','A','G'],c:0,why:'Up a half step to the home note.'}]},
 {id:'B8.03.2',t:'Hear the pull (ear)',idea:'Compare a V7 that resolves with one that doesn’t. Without the resolution the music feels stuck in mid-air.',
  dg:{type:'chart',bars:[['G7'],['C']],rn:['V7','I']},ear:true,
  rem:'V7 → I resolves. V7 alone hangs.',
  more:['A drummer often holds the tension too: build on the V7, then crash on the I.'],
  check:[{q:'Does this resolve?',hear:{chords:['Dm7','G7','C'],beats:4,bpm:80},a:['Yes, it lands home','No, it hangs'],c:0,why:'It ends V7 → I.'},
         {q:'And this?',hear:{chords:['C','Dm7','G7'],beats:4,bpm:80},a:['No, it hangs','Yes, it lands home'],c:0,why:'It stops on G7.'}]}
]},
{id:'B8.04',t:'Reading chord symbols',cards:[
 {id:'B8.04.1',t:'One letter, many symbols',idea:'C, Cm, C7, Cmaj7, Cm7, Cø and C°7 are all different chords on C. The letter is the root; everything after it is the chord type.',
  dg:{type:'chart',bars:[['C'],['C7'],['Cmaj7'],['Cm7']],note:'same root, four chord types'},
  hear:{seq:[[60,64,67],B8_DOM7,B8_MAJ7,B8_MIN7],beats:2,bpm:60,voice:'pad'},
  rem:'Letter = root. The rest = type (7, maj7, m7, ø, °7).',
  more:['A plain “7” always means the dominant 7 (minor 7th on a major triad). “maj7” is the one with the major 7th.'],
  check:[{q:'G7 is a…',a:['dominant 7 chord','major 7 chord','minor 7 chord'],c:0,why:'A plain 7 = dominant 7.'}]},
 {id:'B8.04.2',t:'ii–V–I in 7ths',idea:'The jazz landing written as it usually appears: Dm7 – G7 – Cmaj7. Minor 7, dominant 7, major 7: the three main types in a row.',
  dg:{type:'chart',bars:[['Dm7'],['G7'],['Cmaj7'],['Cmaj7']],rn:['ii7','V7','Imaj7','']},
  hear:{l:'▶ Dm7 G7 Cmaj7',chords:['Dm7','G7','Cmaj7','Cmaj7'],beats:4,bpm:100,ex:TX('Swing',2,{R:'x.xxx.xx',HP:'..x...x.'},{swing:0.67})},
  rem:'ii7–V7–Imaj7: m7 → 7 → maj7.',links:{lessons:['4.7.03','4.5.07']},
  more:['Under this the drums usually play a swing ride pattern with the hi-hat on 2 and 4.'],
  check:[{q:'In Dm7–G7–Cmaj7, which chord is the dominant 7?',a:['G7','Dm7','Cmaj7'],c:0,why:'A plain 7 on the V chord.'}]}
]}
]});
