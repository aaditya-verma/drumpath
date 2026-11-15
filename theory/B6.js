/* DrumPath Theory — Tier B · Part B6: Intervals (threads H/E). Own words. Songs are named only (no melodies or lyrics). Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
DP_THEORY.push({id:'B6',tier:'B',th:'H',t:'Intervals',d:'The distance between two notes: how to count and name intervals, how they sound, a few song openings to remember them by, why the 5th is so strong, and tuning toms in intervals.',ch:[
{id:'B6.01',t:'What an interval is',cards:[
 {id:'B6.01.1',t:'Counting letter names',idea:'An interval is the distance between two notes. Count the letter names from one to the other, including both: C to E is C D E, a 3rd; C to G is a 5th.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,64],steps:[[60,64,'3rd']]},hear:{l:'▶ C to E',seq:[60,64,[60,64]],bpm:80},
  rem:'Interval = distance. Count letters, including both ends.',
  more:['Played one after the other it’s a melodic interval; played together it’s a harmonic interval. Same name either way.'],
  check:[{q:'C up to F is a…',a:['4th','3rd','5th'],c:0,why:'C D E F: four letter names.'}]},
 {id:'B6.01.2',t:'Half steps give the exact size',idea:'Letter counting gives the number (3rd, 5th…); counting half steps gives the exact size. C to E is 4 half steps; C to E♭ is 3: both 3rds, different sounds.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:[60,63,64],steps:[[60,63,'3'],[60,64,'4']]},hear:[{l:'▶ C–E♭ (3)',seq:[[60,63]],beats:2,bpm:60,flats:true},{l:'▶ C–E (4)',seq:[[60,64]],beats:2,bpm:60}],
  rem:'Number from letters; exact size from half steps.',
  more:['That’s why intervals get a second word: minor 3rd (3 half steps) and major 3rd (4 half steps).'],
  check:[{q:'C to E♭ and C to E are both…',a:['3rds, of different sizes','the same interval','a 4th and a 3rd'],c:0,why:'Same letter count, different half steps.'}]}
]},
{id:'B6.02',t:'Major, minor and perfect',cards:[
 {id:'B6.02.1',t:'Which intervals are which',idea:'2nds, 3rds, 6ths and 7ths come in major and minor sizes. Unisons, 4ths, 5ths and octaves are called perfect. Count up from the root in the major scale: every interval you land on is major or perfect.',
  dg:{type:'ladder',items:['2 M/m','3 M/m','4 P','5 P','6 M/m','7 M/m','8 P'],note:'M = major · m = minor · P = perfect'},
  rem:'2 3 6 7: major or minor. 1 4 5 8: perfect.',
  more:['A minor interval is one half step smaller than the major one. The interval between the 4th and 5th sizes, six half steps, is the tritone.'],
  check:[{q:'A 5th is normally called…',a:['perfect','major','minor'],c:0,why:'4ths, 5ths and octaves are perfect.'}]},
 {id:'B6.02.2',t:'The half-step table',idea:'Every interval inside an octave, by half steps: m2 1 · M2 2 · m3 3 · M3 4 · P4 5 · tritone 6 · P5 7 · m6 8 · M6 9 · m7 10 · M7 11 · octave 12.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,65,67,72],marks:{65:'P4',67:'P5',72:'P8'}},hear:{l:'▶ C up the intervals',seq:[[60,62],[60,64],[60,65],[60,67],[60,69],[60,71],[60,72]],bpm:70},
  rem:'Half steps: 1 m2 · 2 M2 · 3 m3 · 4 M3 · 5 P4 · 6 TT · 7 P5 · 12 P8.',
  more:['You don’t have to memorise all of them now. The octave, 5th, 4th and the two 3rds cover most of what a drummer meets.'],
  check:[{q:'A perfect 5th is how many half steps?',a:['7','5','4'],c:0,why:'C to G = 7 half steps.'}]}
]},
{id:'B6.03',t:'Hearing intervals',cards:[
 {id:'B6.03.1',t:'The octave',idea:'An octave is the same note, higher: the two sound so alike that they share a letter name. Men and women singing “the same” tune are usually an octave apart.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,72]},hear:{l:'▶ Octave',seq:[60,72,[60,72]],bpm:80},
  rem:'Octave = same note, higher (12 half steps).',
  more:['Song anchor: the first two notes of “Somewhere Over the Rainbow” jump an octave.'],
  check:[{q:'Two notes an octave apart have…',a:['the same letter name','letter names a 5th apart','no relation'],c:0,why:'An octave is the same note, higher.'}]},
 {id:'B6.03.2',t:'The perfect 5th',idea:'The 5th sounds open, strong and stable. It’s the sound of a power chord and of the opening leap of the Star Wars main theme.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,67]},hear:{l:'▶ Perfect 5th',seq:[60,67,[60,67]],bpm:80},
  rem:'5th = open and strong (7 half steps). Power chord sound.',
  more:['Song anchor for the perfect 4th (one step smaller): the start of the wedding march “Here Comes the Bride”.'],
  check:[{q:'A power chord is built from the root and…',a:['the 5th','the 3rd','the 7th'],c:0,why:'Root + 5th (often + octave).'}]},
 {id:'B6.03.3',t:'Major 3rd vs minor 3rd',idea:'The major 3rd sounds bright and the minor 3rd darker: the same difference as major and minor chords, in just two notes.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:[60,63,64]},hear:[{l:'▶ Major 3rd',seq:[60,64,[60,64]],bpm:80},{l:'▶ Minor 3rd',seq:[60,63,[60,63]],bpm:80,flats:true}],
  rem:'Major 3rd = bright (4). Minor 3rd = dark (3).',
  more:['Song anchors: “When the Saints Go Marching In” opens with a major 3rd; the “Smoke on the Water” riff starts with a minor 3rd.'],
  check:[{q:'Which sounds darker?',a:['the minor 3rd','the major 3rd','they sound the same'],c:0,why:'The smaller 3rd gives the minor colour.'}]},
 {id:'B6.03.4',t:'The major 2nd',idea:'A major 2nd is one whole step: the next note of a scale. It sounds like a melody moving on, not a leap.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,62]},hear:{l:'▶ Major 2nd',seq:[60,62,[60,62]],bpm:80},
  rem:'Major 2nd = one whole step: “moving on”.',
  more:['Song anchor: in “Happy Birthday” the step from “-py” to “Birth-” is a major 2nd.'],
  check:[{q:'A major 2nd is…',a:['one whole step','one half step','three half steps'],c:0,why:'Two half steps = one whole step.'}]}
]},
{id:'B6.04',t:'Why the 5th sounds strong',cards:[
 {id:'B6.04.1',t:'Simple ratios',idea:'Notes are vibrations. In an octave the top note vibrates exactly twice as fast; in a 5th, three times for every two. Simple ratios blend smoothly, so the ear hears them as stable.',
  dg:{type:'ladder',items:['octave 2:1','5th 3:2','4th 4:3','M3 5:4'],note:'simpler ratio = smoother, more stable sound'},
  rem:'Octave 2:1, 5th 3:2: the simplest, most stable intervals.',
  more:['That’s also why distorted guitars use power chords: the 3rd would sound muddy with distortion, the 5th stays clean.'],
  check:[{q:'Why do distorted guitars favour power chords?',a:['root and 5th stay clear with distortion','they are louder','they have more notes'],c:0,why:'Simple ratios survive distortion.'}]}
]},
{id:'B6.05',t:'Tuning toms in intervals',cards:[
 {id:'B6.05.1',t:'Toms a 3rd or 4th apart',idea:'Many drummers tune their toms a 3rd or a 4th apart, so a fill around the kit sounds like a little melody stepping down, not random thuds.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:[57,62,65],marks:{65:'T1',62:'T2',57:'T3'}},hear:{l:'▶ Toms: a 3rd, then a 4th',seq:[65,62,57],bpm:100},
  rem:'Tune toms in 3rds or 4ths so fills sound melodic.',
  more:['On the Nitro you can change each tom’s pitch in the module’s settings. Try making the toms a 4th apart and play a fill down them; then try them closer together.'],
  check:[{q:'Toms tuned a 4th apart make a fill sound…',a:['more melodic','louder','faster'],c:0,why:'The pitches form a clear step pattern.'}]}
]},
{id:'B6.06',t:'Interval ear tasks',cards:[
 {id:'B6.06.1',t:'Higher or lower?',idea:'The first ear skill is direction: does the second note go up or down? Hum both notes if it helps.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,67]},ear:true,
  rem:'First listen for direction: up or down.',
  more:['Even a big interval can fool you when the sounds are very different; keep listening to the pitch, not the loudness.'],
  check:[{q:'Does the second note go up or down?',hear:{seq:[67,60],bpm:70},a:['Down','Up'],c:0,why:'G down to C.'},
         {q:'And here?',hear:{seq:[62,69],bpm:70},a:['Up','Down'],c:0,why:'D up to A.'}]},
 {id:'B6.06.2',t:'Octave or 5th?',idea:'Both are open and strong. The octave sounds like the same note again; the 5th sounds like a different, related note.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,67,72]},ear:true,
  rem:'Octave = same note again. 5th = a strong, different note.',
  more:['Sing the first note back after the second: if it matches the second note an octave lower, it was an octave.'],
  check:[{q:'Octave or 5th?',hear:{seq:[60,72],bpm:70},a:['Octave','5th'],c:0,why:'C to C: the same note, higher.'},
         {q:'Octave or 5th?',hear:{seq:[62,69],bpm:70},a:['5th','Octave'],c:0,why:'D to A: a perfect 5th.'}]},
 {id:'B6.06.3',t:'Major or minor 3rd?',idea:'Played together, a major 3rd sounds bright and happy, a minor 3rd darker and sadder.',
  dg:{type:'keys',from:60,oct:1,names:'all',flats:true,hi:[60,63,64]},ear:true,
  rem:'Bright = major 3rd. Dark = minor 3rd.',
  more:['This is the most useful interval to hear, because it decides whether a chord is major or minor.'],
  check:[{q:'Major or minor 3rd?',hear:{seq:[[62,66]],beats:2,bpm:60},a:['Major','Minor'],c:0,why:'D–F♯: 4 half steps.'},
         {q:'Major or minor 3rd?',hear:{seq:[[64,67]],beats:2,bpm:60},a:['Minor','Major'],c:0,why:'E–G: 3 half steps.'}]}
]}
]});
