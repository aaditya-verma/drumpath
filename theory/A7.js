/* DrumPath Theory — Tier A · Part A7: First chords (thread H). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
DP_THEORY.push({id:'A7',tier:'A',th:'H',t:'First chords',d:'What the guitarist and keyboard player are doing: chords, major and minor, power chords, reading chord symbols, and the chord loops songs are built on.',ch:[
{id:'A7.01',t:'What a chord is',cards:[
 {id:'A7.01.1',t:'Notes together',idea:'A chord is three or more notes sounding at the same time. A melody is notes one after another; a chord is notes stacked.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,64,67]},hear:[{l:'▶ One at a time',seq:[60,64,67],bpm:90},{l:'▶ Together (a chord)',seq:[[60,64,67]],beats:3,bpm:60}],
  rem:'Chord = notes played together.',
  more:['Guitarists strum chords; keyboard players press several keys at once. A drummer’s “chord” is a unison: kick, snare and crash together.'],
  check:[{q:'C, E and G played at the same moment are…',a:['a chord','a scale','a rhythm'],c:0,why:'Stacked notes sounding together make a chord.'}]},
 {id:'A7.01.2',t:'The triad: 1, 3, 5',idea:'The basic chord, a triad, takes every other note of a scale: degrees 1, 3 and 5. From C that’s C, E and G.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,64,67],marks:{60:'1',64:'3',67:'5'}},hear:{seq:[60,64,67,[60,64,67]],beats:1,bpm:80},
  rem:'Triad = 1, 3, 5 (skip a note, take a note).',
  more:['The bottom note, the one the chord is named after, is the root. The C chord’s root is C.'],
  check:[{q:'Which notes make the C triad?',a:['C E G','C D E','C F A'],c:0,why:'Every other note from C: C (skip D) E (skip F) G.'}]}
]},
{id:'A7.02',t:'Major and minor',cards:[
 {id:'A7.02.1',t:'Major: bright',idea:'A major chord has a wide gap (4 half steps) from the root to the 3rd. It sounds bright, settled, happy.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,64,67]},hear:{l:'▶ C major',seq:[[60,64,67]],beats:3,bpm:60},
  rem:'Major = bright. Root to 3rd = 4 half steps.',
  more:['“Happy” and “sad” are only rough labels; plenty of sad songs use major chords. Bright vs dark is closer.'],
  check:[{q:'How many half steps from C up to E?',a:['4','3','2'],c:0,why:'C C♯ D D♯ E: four steps.'}]},
 {id:'A7.02.2',t:'Minor: darker',idea:'A minor chord lowers the 3rd by one half step. C minor is C, E♭, G. That one note makes it sound darker.',
  dg:{type:'keys',from:60,oct:1,names:'all',hi:[60,63,67]},hear:[{l:'▶ C major',seq:[[60,64,67]],beats:2,bpm:60},{l:'▶ C minor',seq:[[60,63,67]],beats:2,bpm:60}],
  rem:'Minor = the 3rd one half step lower = darker.',
  more:['A minor (A, C, E) is the minor chord on white keys only, which is why it turns up in so many songs in C.'],
  check:[{q:'What changes between C major and C minor?',a:['The 3rd drops a half step','The root changes','The 5th goes up'],c:0,why:'Only the middle note moves: E → E♭.'}]},
 {id:'A7.02.3',t:'Major or minor?',idea:'Train your ear: listen for bright or dark. Hear both a few times, then try the check.',
  dg:{type:'keys',from:57,oct:1,names:true},hear:[{l:'▶ Major',seq:[[57,61,64]],beats:2,bpm:60},{l:'▶ Minor',seq:[[57,60,64]],beats:2,bpm:60}],ear:true,
  rem:'Bright = major, dark = minor.',
  check:[{q:'Major or minor?',hear:{seq:[[62,65,69]],beats:2,bpm:60},a:['Minor','Major'],c:0,why:'D F A: D minor.'},
   {q:'And this one?',hear:{seq:[[55,59,62]],beats:2,bpm:60},a:['Major','Minor'],c:0,why:'G B D: G major.'}]}
]},
{id:'A7.03',t:'Power chords',cards:[
 {id:'A7.03.1',t:'Root and 5th',idea:'A power chord is just the root and the 5th (often with the root doubled). With no 3rd, it’s neither major nor minor.',
  dg:{type:'neck',strings:['E','A','D'],frets:5,hi:[[0,3,'G'],[1,5,'D'],[2,5,'G']]},hear:{l:'▶ G5',seq:[[43,50,55]],beats:2,bpm:70},
  rem:'Power chord = root + 5th. Written G5.',
  more:['It’s the backbone of rock guitar: one shape that slides up and down the neck.'],
  check:[{q:'A power chord leaves out…',a:['the 3rd','the root','the 5th'],c:0,why:'Root and 5th only, so it’s neither major nor minor.'}]},
 {id:'A7.03.2',t:'Why rock loves them',idea:'With a distorted guitar, full chords turn muddy, but root + 5th stays clear and heavy. That’s why rock and metal riffs use power chords.',
  dg:{type:'chart',bars:[['E5'],['G5'],['A5'],['C5']]},hear:{chords:['E5','G5','A5','C5'],beats:4,bpm:110,ex:TX('Rock',2,B8)},
  rem:'Distortion + power chords = big, clear rock sound.',
  more:['A drummer hears power-chord riffs as rhythm: the guitar often plays the same rhythm as the kick. Lock to it.'],
  check:[{q:'Why do distorted guitars use power chords?',a:['They stay clear when distorted','They’re louder','They’re minor'],c:0,why:'Fewer notes, less mud.'}]}
]},
{id:'A7.04',t:'Chord symbols',cards:[
 {id:'A7.04.1',t:'Reading a chord name',idea:'A letter alone is a major chord (C). A small m means minor (Am). A 5 means a power chord (G5). A 7 adds a fourth note (you’ll meet those in Tier B).',
  dg:{type:'chart',bars:[['C'],['Am'],['G5'],['E7']],per:4},hear:{chords:['C','Am','G5','E7'],beats:4,bpm:90},
  rem:'C = major · Cm = minor · C5 = power · C7 = seventh.',
  more:['Some charts write minor as “min” or “−”: Amin, A−.'],
  check:[{q:'“Dm” means…',a:['D minor','D major','D, play loud'],c:0,why:'Small m = minor.'}]},
 {id:'A7.04.2',t:'A chord chart',idea:'A chord chart shows one box per bar with the chord inside. Two chords in one box share the bar.',
  dg:{type:'chart',bars:[['G'],['D'],['Em'],['C','D']],note:'bar 4: C for two beats, then D'},hear:{chords:['G','D','Em','C','D'],beats:4,bpm:90,ex:TX('Beat',2,B8)},
  rem:'One box = one bar. Chords in a box split the bar.',
  more:['A drummer reads a chord chart for its bars and changes, not its notes: four boxes in a row = a 4-bar phrase.'],
  check:[{q:'A box holds “C D”. That bar has…',a:['C, then D, sharing the bar','C for a whole bar, then D','both at once'],c:0,why:'Two chords in a box split it, usually 2 beats each.'}]},
 {id:'A7.04.3',t:'Chords change on the bar line',idea:'Most chord changes land on beat 1 of a bar. A kick (and sometimes a crash) on that 1 helps the band feel the change.',
  dg:{type:'chart',bars:[['C'],['F'],['C'],['G']]},hear:{chords:['C','F','C','G'],beats:4,bpm:96,ex:TX('Kick on 1',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'})},
  rem:'New chord on 1 → make beat 1 solid.',
  more:['If a chord changes early (on the “&” of 4 of the bar before), it’s a push. Tier B covers pushes and anticipations.'],
  check:[{q:'Where do chords usually change?',a:['On beat 1 of a bar','On the “&” of 2','At random'],c:0,why:'Changes mostly line up with the bar line.'}]}
]},
{id:'A7.05',t:'Chord loops',cards:[
 {id:'A7.05.1',t:'Numbers for chords',idea:'Chords are numbered by the scale degree of their root, in Roman numerals: in C, C is I, F is IV, G is V, A minor is vi (small = minor).',
  dg:{type:'chart',bars:[['C'],['F'],['G'],['Am']],rn:['I','IV','V','vi']},hear:{chords:['C','F','G','Am'],beats:4,bpm:90},
  rem:'I IV V = major chords on degrees 1, 4, 5. Small numerals = minor.',
  more:['With numbers, “I–IV–V” describes thousands of songs in any key. Backline’s song sheets can show chords as numbers too.'],backline:[{l:'Open Backline',h:'search'}],
  check:[{q:'In the key of G, which chord is V?',a:['D','C','A'],c:0,why:'G A B C D: the 5th degree is D.'}]},
 {id:'A7.05.2',t:'The four-chord loop',idea:'I–V–vi–IV (in C: C, G, Am, F) loops under a huge number of pop songs. Four bars, round and round.',
  dg:{type:'chart',bars:[['C'],['G'],['Am'],['F']],rn:['I','V','vi','IV']},hear:{chords:['C','G','Am','F','C','G','Am','F'],beats:4,bpm:100,ex:TX('Pop beat',2,B8)},
  rem:'I–V–vi–IV: the pop loop. Four bars, then again.',
  more:['A loop like this makes the phrase length obvious: every time C comes back, a new 4-bar phrase starts. Fills go in the F bar.'],see:['A8.04.1'],
  check:[{q:'In a 4-chord loop of one bar each, a fill usually goes…',a:['in the bar of the 4th chord','in the first bar','anywhere'],c:0,why:'End of the phrase, before the loop restarts.'}]},
 {id:'A7.05.3',t:'The 12-bar blues',idea:'Twelve bars using I, IV and V in a fixed order: I I I I · IV IV I I · V IV I I. Blues and rock and roll are built on it.',
  dg:{type:'chart',bars:[['A'],['A'],['A'],['A'],['D'],['D'],['A'],['A'],['E'],['D'],['A'],['A']],rn:['I','I','I','I','IV','IV','I','I','V','IV','I','I']},hear:{chords:['A','A','A','A','D','D','A','A','E','D','A','A'],beats:4,bpm:120,ex:TX('Shuffle-ish',2,B8)},
  rem:'12-bar blues: I I I I · IV IV I I · V IV I I.',links:{lessons:['4.7.02']},
  more:['Lesson 4.7.02 plays the 12-bar form with the chord numbers above the bars. Count the lines of 4: the change to V in bar 9 is where the energy peaks.'],
  check:[{q:'In a 12-bar blues, which chord is in bar 9?',a:['V','IV','I'],c:0,why:'Third line starts on V: V IV I I.'}]}
]}
]});
