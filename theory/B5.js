/* DrumPath Theory — Tier B · Part B5: Minor keys and more scales (thread H). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const B5_AM=[57,59,60,62,64,65,67,69],B5_AH=[57,59,60,62,64,65,68,69],B5_AMEL=[57,59,60,62,64,66,68,69],
  B5_CP=[60,62,64,67,69,72],B5_AP=[57,60,62,64,67,69],B5_BL=[57,60,62,63,64,67,69],B5_C=[60,62,64,65,67,69,71,72];
DP_THEORY.push({id:'B5',tier:'B',th:'H',t:'Minor keys and more scales',d:'The darker side of the scale family: natural, harmonic and melodic minor, relative keys, the pentatonic and blues scales that guitarists live on, key signatures and the circle of fifths.',ch:[
{id:'B5.01',t:'The natural minor scale',cards:[
 {id:'B5.01.1',t:'A minor: the white keys from A',idea:'Play the white keys from A to A and you get the natural minor scale. Its step pattern is W H W W H W W.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:B5_AM},hear:{l:'▶ A natural minor',seq:B5_AM,bpm:100},
  rem:'Natural minor = W H W W H W W (A to A on white keys).',
  more:['The half steps sit in different places from the major scale (2–3 and 5–6 instead of 3–4 and 7–8). That shift is what makes it sound darker.'],
  check:[{q:'The natural minor step pattern is…',a:['W H W W H W W','W W H W W W H','all whole steps'],c:0,why:'Major is W W H W W W H; minor starts with W H.'}]},
 {id:'B5.01.2',t:'Major vs minor (ear)',idea:'Same starting note, different scale: major sounds bright and settled, minor sounds darker, sadder or more serious.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:[57,61,64]},ear:true,
  hear:[{l:'▶ A major',seq:[57,59,61,62,64,66,68,69],bpm:110},{l:'▶ A minor',seq:B5_AM,bpm:110}],
  rem:'Major = bright. Minor = dark. Listen to the 3rd note.',
  more:['The biggest difference is the 3rd note: C♯ in A major, C in A minor. You’ll meet that same note again in major and minor chords.'],
  check:[{q:'Listen: major or minor scale?',hear:{seq:B5_AM,bpm:120},a:['Minor','Major'],c:0,why:'The low 3rd gives it the darker colour.'},
         {q:'And this one?',hear:{seq:[57,59,61,62,64,66,68,69],bpm:120},a:['Major','Minor'],c:0,why:'Bright 3rd, 6th and 7th: major.'}]}
]},
{id:'B5.02',t:'Relative major and minor',cards:[
 {id:'B5.02.1',t:'Same notes, different home',idea:'C major and A minor use exactly the same seven notes. They are relatives: the same family of notes with a different home note.',
  dg:{type:'keys',from:57,oct:2,names:true,hi:[57,60]},hear:[{l:'▶ C major',seq:B5_C,bpm:110},{l:'▶ A minor',seq:B5_AM,bpm:110}],
  rem:'Relative keys share all their notes; only the home note differs.',
  more:['A song can move between relatives without any new notes, so verses in A minor and a chorus in C major are a very common pairing.'],
  check:[{q:'C major and A minor share…',a:['all seven notes','no notes','only C'],c:0,why:'They are relative keys.'}]},
 {id:'B5.02.2',t:'Finding the relative minor',idea:'Count down three half steps from the major key’s home note (or up to its 6th note) and you reach its relative minor: C → A, G → E, F → D.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:[57,60],steps:[[57,60,'3 half steps']]},
  rem:'Relative minor = 6th note of the major scale = 3 half steps down.',
  more:['Backline’s song pages show a song’s key; if it says “E minor”, the relative major is G, and the chords will mostly come from that family.'],
  check:[{q:'The relative minor of G major is…',a:['E minor','D minor','G minor'],c:0,why:'Three half steps down from G is E.'}]}
]},
{id:'B5.03',t:'Harmonic and melodic minor',cards:[
 {id:'B5.03.1',t:'Harmonic minor: a raised 7th',idea:'Harmonic minor raises the 7th note by a half step (G → G♯ in A minor). The new note leans hard into home, and makes the V chord major (E instead of Em).',
  dg:{type:'keys',from:57,oct:1,names:'all',hi:B5_AH},hear:{l:'▶ A harmonic minor',seq:B5_AH,bpm:100},
  rem:'Harmonic minor = natural minor with a raised 7th: a strong pull home.',
  more:['The gap between F and G♯ (three half steps) gives harmonic minor its exotic, Middle-Eastern or classical sound.'],
  check:[{q:'Harmonic minor changes which note of natural minor?',a:['the 7th (raised)','the 3rd (raised)','the 5th (lowered)'],c:0,why:'Raising the 7th creates a leading note.'}]},
 {id:'B5.03.2',t:'Melodic minor',idea:'Melodic minor raises both the 6th and 7th going up, to smooth out that big gap. Classical music lowers them again coming down; jazz keeps them raised.',
  dg:{type:'keys',from:57,oct:1,names:'all',hi:B5_AMEL},hear:{l:'▶ A melodic minor (up)',seq:B5_AMEL,bpm:100},
  rem:'Melodic minor (up) = raised 6th and 7th.',
  more:['You won’t need to play it, but knowing the name helps when a chart says “melodic minor” or a jazz player talks about it.'],
  check:[{q:'Going up, melodic minor raises…',a:['the 6th and 7th','only the 3rd','nothing'],c:0,why:'Both to make the climb smooth.'}]}
]},
{id:'B5.04',t:'Pentatonic scales',cards:[
 {id:'B5.04.1',t:'Five notes, no clashes',idea:'A pentatonic scale has five notes and no half steps, so every note sounds fine against the others. Major pentatonic: C D E G A.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:B5_CP},hear:{l:'▶ C major pentatonic',seq:B5_CP,bpm:110},
  rem:'Pentatonic = 5 notes, no half steps. Major: 1 2 3 5 6.',
  more:['Folk songs, many pop hooks and countless melodies around the world use only these five notes.'],
  check:[{q:'How many notes are in a pentatonic scale?',a:['5','7','12'],c:0,why:'Penta = five.'}]},
 {id:'B5.04.2',t:'Minor pentatonic',idea:'Start the same notes from A and you get A minor pentatonic: A C D E G. It’s the scale most rock and blues guitar solos are built on.',
  dg:{type:'keys',from:57,oct:1,names:true,hi:B5_AP},hear:{l:'▶ A minor pentatonic',seq:B5_AP,bpm:110},
  rem:'Minor pentatonic = 1 ♭3 4 5 ♭7. The rock solo scale.',
  more:['On guitar it fits in one “box” shape under the fingers, which is why it’s usually the first scale guitarists learn.'],
  check:[{q:'Most rock and blues guitar solos use…',a:['the minor pentatonic','the harmonic minor','the chromatic scale'],c:0,why:'Five notes, easy shape, bluesy sound.'}]}
]},
{id:'B5.05',t:'The blues scale',cards:[
 {id:'B5.05.1',t:'Minor pentatonic + one note',idea:'Add one note between the 4th and 5th of the minor pentatonic (E♭ in A) and you have the blues scale. That extra “blue note” gives the bite.',
  dg:{type:'keys',from:57,oct:1,names:'all',flats:true,hi:B5_BL},hear:{l:'▶ A blues scale',seq:B5_BL,bpm:110,flats:true},
  rem:'Blues scale = minor pentatonic + ♭5 (the blue note).',links:{lessons:['4.7.02','4.5.08']},
  more:['Over a 12-bar blues, the guitar or keys lean on this scale; the drums’ shuffle and the blue note together give the blues its feel.'],
  check:[{q:'The blues scale adds which note to the minor pentatonic?',a:['the ♭5','the 2nd','the major 7th'],c:0,why:'The flattened 5th is the blue note.'}]}
]},
{id:'B5.06',t:'Key signatures',cards:[
 {id:'B5.06.1',t:'Sharps or flats at the start',idea:'A key signature is the set of sharps or flats written at the start of each line. It tells you which notes are changed for the whole song, and so which key you’re in.',
  dg:{type:'keys',from:67,oct:1,names:'all',hi:[67,69,71,72,74,76,78,79]},
  rem:'Key signature = the sharps/flats for the whole piece → the key.',
  more:['G major needs one sharp (F♯); F major needs one flat (B♭). Drum charts have no key signature, but band charts and lead sheets do.'],
  check:[{q:'One sharp (F♯) in the key signature usually means…',a:['G major or E minor','C major','F major'],c:0,why:'G major and its relative E minor both have F♯.'}]},
 {id:'B5.06.2',t:'The order of sharps and flats',idea:'Sharps are always added in the order F C G D A E B; flats in the reverse, B E A D G C F. One sharp is always F♯, one flat always B♭.',
  dg:{type:'ladder',items:['F♯','C♯','G♯','D♯','A♯','E♯','B♯'],note:'sharps in order (flats: B♭ E♭ A♭ D♭ G♭ C♭ F♭)'},
  rem:'Sharps: F C G D A E B. Flats: B E A D G C F (backwards).',
  more:['A memory line for sharps: “Father Charles Goes Down And Ends Battle”; read it backwards for flats.'],
  check:[{q:'A key with two sharps has…',a:['F♯ and C♯','F♯ and G♯','C♯ and D♯'],c:0,why:'Sharps are always added F, then C.'}]}
]},
{id:'B5.07',t:'The circle of fifths',cards:[
 {id:'B5.07.1',t:'The circle',idea:'Arrange the 12 keys so each step clockwise is a 5th higher and adds one sharp; anticlockwise adds one flat. C sits at the top with none.',
  dg:{type:'c5',hi:['C','G','F']},
  rem:'Clockwise = up a 5th, +1 sharp. Anticlockwise = +1 flat.',
  more:['The circle is a map of how closely keys are related: neighbours share six of their seven notes.'],
  check:[{q:'One step clockwise from C is…',a:['G (one sharp)','F (one flat)','D (two sharps)'],c:0,why:'Up a 5th: C → G.'}]},
 {id:'B5.07.2',t:'Neighbours on the circle',idea:'A key’s two neighbours on the circle are its IV and V: that’s why songs in C so often use F and G.',
  dg:{type:'c5',hi:['C','G','F'],small:true},hear:{l:'▶ C · F · G · C',chords:['C','F','G','C'],beats:4,bpm:90},
  rem:'Neighbours on the circle = the IV and V of a key.',
  more:['Key changes to a neighbour sound smooth for the same reason: only one note changes.','Inside the circle sit the relative minors, so the same map works for minor keys: A minor’s neighbours are D minor and E minor.'],
  check:[{q:'In the key of G, the neighbour keys/chords are…',a:['C and D','F and A','E and B'],c:0,why:'G’s neighbours on the circle are C (IV) and D (V).'}]}
]}
]});
