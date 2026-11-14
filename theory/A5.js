/* DrumPath Theory — Tier A · Part A5: Notes and the keyboard (thread H). Own words. Card ids are permanent once shipped.
   Pitch cards use the shared tone synth (lib/tone.x.y.z.js): hear specs with seq (MIDI notes) or chords. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
DP_THEORY.push({id:'A5',tier:'A',th:'H',t:'Notes and the keyboard',d:'The names your band mates use for notes: the seven letters, octaves, the keyboard map, sharps and flats, half and whole steps, and how a guitar neck lines up with all of it.',ch:[
{id:'A5.01',t:'The musical alphabet',cards:[
 {id:'A5.01.1',t:'Seven letters',idea:'Notes are named with just seven letters, A B C D E F G. After G the letters start again at A.',
  dg:{type:'keys',from:57,oct:1,names:true},hear:{l:'▶ A to A',seq:[57,59,60,62,64,65,67,69],bpm:100},
  rem:'Seven note names: A B C D E F G, then round again.',
  more:['Music only needs seven letters because the pattern repeats: after G comes another A, a bit higher.','Most music starts lists from C rather than A, because of the way the piano is laid out (you’ll see why in two cards).'],
  check:[{q:'Which letter comes after G?',a:['A','H','G again'],c:0,why:'The alphabet wraps round: … F G A B …'}]},
 {id:'A5.01.2',t:'Higher and lower',idea:'Pitch is how high or low a note sounds. Going up the alphabet goes up in pitch; going down goes down.',
  dg:{type:'keys',from:60,oct:1,names:true},hear:[{l:'▶ Up',seq:[60,62,64,65,67,69,71,72],bpm:110},{l:'▶ Down',seq:[72,71,69,67,65,64,62,60],bpm:110}],
  rem:'Pitch = how high or low. Right on a keyboard = higher.',
  more:['Drums have pitch too: a small tom sounds higher than a floor tom, and a kick lower still. You tune drums by changing their pitch.'],
  check:[{q:'On a keyboard, keys further to the right sound…',a:['higher','lower','louder'],c:0,why:'Pitch rises from left to right.'},
   {q:'Listen: does this go up or down?',hear:{seq:[67,65,64,62,60],bpm:110},a:['Down','Up'],c:0,why:'Each note is lower than the one before.'}],ear:true}
]},
{id:'A5.02',t:'Octaves',cards:[
 {id:'A5.02.1',t:'Same letter, higher',idea:'From one C to the next C is an octave. The two notes sound like the same note, one higher than the other.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,72]},hear:{l:'▶ C, then the C above',seq:[60,72,[60,72]],beats:2,bpm:80},
  rem:'Octave = from a note to the next one with the same letter.',
  more:['When a man and a woman sing “the same” melody, they’re usually an octave apart.'],
  check:[{q:'How far is it from one C to the next C up?',a:['An octave','A half step','A bar'],c:0,why:'Same letter, next one up = an octave.'}]},
 {id:'A5.02.2',t:'Why octaves sound alike',idea:'A note an octave higher shakes exactly twice as fast. Their vibrations line up so well that the ear hears them as the same note.',
  dg:{type:'wave'},hear:[{l:'▶ Octave (fits)',seq:[[60,72]],beats:3,bpm:60},{l:'▶ Not an octave',seq:[[60,71]],beats:3,bpm:60}],
  rem:'One octave up = twice as fast = “the same note, higher”.',
  more:['This is also why the bass player and the guitarist can play the same chord an octave or two apart and it still fits.'],
  check:[{q:'A note an octave higher vibrates…',a:['twice as fast','half as fast','at the same speed'],c:0,why:'Doubling the speed of vibration gives the octave.'}]}
]},
{id:'A5.03',t:'The piano keyboard',cards:[
 {id:'A5.03.1',t:'White and black keys',idea:'The keyboard repeats one pattern: black keys in groups of two and three, with white keys under and between them.',
  dg:{type:'keys',from:60,oct:2,names:false},
  rem:'Black keys come in 2s and 3s. That pattern repeats every octave.',
  more:['The groups are your map: you never need to count from the end of the keyboard, just find a group of two or three black keys.'],
  check:[{q:'Black keys are grouped in…',a:['twos and threes','fours','ones'],c:0,why:'Two, then three, then two again in the next octave.'}]},
 {id:'A5.03.2',t:'Finding C',idea:'C is always the white key just left of a group of two black keys. Every other note can be found from there.',
  dg:{type:'keys',from:60,oct:2,names:true,hi:[60,72,84]},hear:{l:'▶ The Cs',seq:[60,72,84],bpm:90},
  rem:'C = the white key left of the two black keys.',
  more:['F is just left of the three black keys, the other easy landmark.'],
  check:[{q:'Where is C?',a:['Just left of a group of two black keys','Just left of three black keys','On a black key'],c:0,why:'Two black keys → the white key to their left is C.'}]},
 {id:'A5.03.3',t:'Middle C',idea:'The C nearest the middle of a piano is middle C. It’s the usual starting point for pitch examples, and in DrumPath it’s the first key on most keyboards.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60],marks:{60:'C4'}},hear:{l:'▶ Middle C',seq:[60],beats:2,bpm:60},
  rem:'Middle C is also called C4.',
  more:['Octaves are numbered from C: C4 is middle C, C5 the next one up, C3 the one below. Guitar and bass sit mostly below middle C.'],
  check:[{q:'Middle C is also written as…',a:['C4','C1','C0'],c:0,why:'The octave number of middle C is 4.'}]}
]},
{id:'A5.04',t:'Sharps and flats',cards:[
 {id:'A5.04.1',t:'Sharp and flat',idea:'A sharp (♯) raises a note to the very next key up; a flat (♭) lowers it to the very next key down. Usually that’s a black key.',
  dg:{type:'keys',from:60,oct:1,names:'all',hi:[61,63]},hear:[{l:'▶ C then C♯',seq:[60,61],bpm:70},{l:'▶ E then E♭',seq:[64,63],bpm:70}],
  rem:'♯ = one key up. ♭ = one key down.',
  more:['The black keys get their names from their neighbours: the one between C and D is C♯ or D♭.'],
  check:[{q:'F♯ is…',a:['the key just above F','the key just below F','the same as F'],c:0,why:'Sharp = one key up.'}]},
 {id:'A5.04.2',t:'One key, two names',idea:'Each black key has two names: the one between C and D is both C♯ and D♭. Which name is used depends on the key of the song.',
  dg:{type:'keys',from:60,oct:1,marks:{61:'C♯ D♭',63:'D♯ E♭',66:'F♯ G♭',68:'G♯ A♭',70:'A♯ B♭'},names:true},
  rem:'C♯ = D♭ (same key, two names).',
  more:['Guitarists often say “B flat” rather than “A sharp”; both mean the same key.'],
  check:[{q:'Another name for G♯ is…',a:['A♭','G♭','A♯'],c:0,why:'The key between G and A is G♯ or A♭.'}]},
 {id:'A5.04.3',t:'No black key between E–F and B–C',idea:'Between E and F, and between B and C, there is no black key. Those white keys sit right next to each other.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[64,65,71,72]},hear:[{l:'▶ E to F',seq:[64,65],bpm:70},{l:'▶ B to C',seq:[71,72],bpm:70}],
  rem:'E–F and B–C are neighbours with nothing in between.',
  more:['That’s why the black keys come in groups of two and three, and it shapes every scale you’ll meet next.'],
  check:[{q:'Which pair has no black key between them?',a:['E and F','C and D','G and A'],c:0,why:'E–F (and B–C) are already next to each other.'}]}
]},
{id:'A5.05',t:'Half steps and whole steps',cards:[
 {id:'A5.05.1',t:'The half step',idea:'A half step (or semitone) is the distance from one key to the very next key, black or white. It’s the smallest step in Western music.',
  dg:{type:'keys',from:60,oct:1,names:true,steps:[[60,61,'H'],[64,65,'H'],[71,72,'H']]},hear:{seq:[60,61,64,65,71,72],bpm:80},
  rem:'Half step = next key (black or white).',
  more:['E–F and B–C are half steps even though both are white keys.'],
  check:[{q:'From E up to F is…',a:['a half step','a whole step','an octave'],c:0,why:'They’re next to each other, with no key between.'}]},
 {id:'A5.05.2',t:'The whole step',idea:'A whole step (or tone) is two half steps: skip one key. C to D is a whole step, because C♯ sits between them.',
  dg:{type:'keys',from:60,oct:1,names:true,steps:[[60,62,'W'],[62,64,'W'],[65,67,'W']]},hear:{seq:[60,62,64,65,67],bpm:80},
  rem:'Whole step = two half steps (skip one key).',
  more:['Steps are the building blocks of scales: the major scale is a set order of whole and half steps (next part).'],
  check:[{q:'How many half steps make a whole step?',a:['2','1','4'],c:0,why:'Whole = two halves.'}]},
 {id:'A5.05.3',t:'Hear the difference',idea:'A half step sounds tight and tense, a whole step more open. Listen and decide which you hear.',
  dg:{type:'keys',from:60,oct:1,names:true},hear:[{l:'▶ Half step',seq:[64,65],bpm:70},{l:'▶ Whole step',seq:[64,66],bpm:70}],ear:true,
  rem:'Half step = tight. Whole step = wider.',
  check:[{q:'Half or whole step?',hear:{seq:[60,61],bpm:70},a:['Half step','Whole step'],c:0,why:'C to C♯: next key.'},
   {q:'And this one?',hear:{seq:[67,69],bpm:70},a:['Whole step','Half step'],c:0,why:'G to A skips G♯.'}]}
]},
{id:'A5.06',t:'The guitar neck',cards:[
 {id:'A5.06.1',t:'Every fret is a half step',idea:'On a guitar or bass, moving up one fret raises the note by one half step, exactly like moving one key to the right.',
  dg:{type:'neck',strings:['E'],frets:12,hi:[[0,0,'E'],[0,1,'F'],[0,3,'G'],[0,5,'A']]},hear:{seq:[40,41,42,43,44,45],bpm:90},
  rem:'One fret = one half step.',
  more:['That’s why guitarists talk about “up two frets” for a whole step.'],
  check:[{q:'Up three frets is how many half steps?',a:['3','6','1.5'],c:0,why:'One fret = one half step.'}]},
 {id:'A5.06.2',t:'Twelve frets = an octave',idea:'Twelve half steps make an octave, so the 12th fret plays the same note as the open string, one octave higher. It’s marked with two dots.',
  dg:{type:'neck',strings:['E'],frets:12,hi:[[0,0,'E'],[0,12,'E']]},hear:{seq:[40,52,[40,52]],beats:2,bpm:80},
  rem:'12 half steps = 1 octave = the 12th fret.',
  more:['On a keyboard, count the keys from one C to the next: 12 including the black ones.'],
  check:[{q:'How many half steps in an octave?',a:['12','8','7'],c:0,why:'7 white + 5 black keys.'}]},
 {id:'A5.06.3',t:'The open strings',idea:'A guitar’s six strings, low to high, are E A D G B E. A bass has the lowest four: E A D G.',
  dg:{type:'neck',frets:5,hi:[[0,0,'E'],[1,0,'A'],[2,0,'D'],[3,0,'G'],[4,0,'B'],[5,0,'E']]},hear:{l:'▶ The six strings',seq:[40,45,50,55,59,64],bpm:90},
  rem:'Guitar: E A D G B E. Bass: E A D G.',
  more:['Knowing this helps you talk to your guitarist: “the riff starts on the open E” tells you the song is likely in E.'],
  check:[{q:'The lowest string on a standard guitar is…',a:['E','A','G'],c:0,why:'E A D G B E, from low to high.'}]}
]}
]});
