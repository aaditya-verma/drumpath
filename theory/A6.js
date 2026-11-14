/* DrumPath Theory — Tier A · Part A6: Major scale and keys (thread H). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const A6_C=[60,62,64,65,67,69,71,72],A6_G=[67,69,71,72,74,76,78,79];
DP_THEORY.push({id:'A6',tier:'A',th:'H',t:'Major scale and keys',d:'The pattern behind most melodies and chords: the major scale, numbering its notes, what “in the key of G” means, and the home note every song wants to land on.',ch:[
{id:'A6.01',t:'The major scale',cards:[
 {id:'A6.01.1',t:'What a scale is',idea:'A scale is a set of notes played in order of pitch, from one note up to the same letter an octave higher.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:A6_C},hear:{l:'▶ C major scale',seq:A6_C,bpm:100},
  rem:'Scale = a set of notes in step order, octave to octave.',
  more:['Most songs only use the notes of one scale for long stretches. Knowing which scale tells you which notes and chords will fit.'],
  check:[{q:'A scale goes from a note up to…',a:['the same letter an octave higher','the next black key','any note you like'],c:0,why:'It spans one octave, in step order.'}]},
 {id:'A6.01.2',t:'Whole, whole, half, whole, whole, whole, half',idea:'Every major scale uses the same pattern of steps: W W H W W W H. On a keyboard, C to C on the white keys follows it exactly.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:A6_C,steps:[[60,62,'W'],[62,64,'W'],[64,65,'H'],[65,67,'W'],[67,69,'W'],[69,71,'W'],[71,72,'H']]},hear:{seq:A6_C,bpm:90},
  rem:'Major scale = W W H W W W H.',
  more:['The two half steps fall between notes 3–4 and 7–8. On the white keys from C, that’s E–F and B–C, the pairs with no black key between.'],see:['A5.04.3'],
  check:[{q:'Where are the half steps in a major scale?',a:['Between notes 3–4 and 7–8','Between 1–2 and 5–6','There are none'],c:0,why:'W W H W W W H: the halves are the 3rd and 7th steps.'}]},
 {id:'A6.01.3',t:'Do re mi',idea:'Singers name the scale’s notes do re mi fa sol la ti do. If you can sing it, you know the sound of the major scale.',
  dg:{type:'keys',from:60,oct:1,hi:A6_C,marks:{60:'do',62:'re',64:'mi',65:'fa',67:'sol',69:'la',71:'ti',72:'do'}},hear:{l:'▶ Sing along',seq:A6_C.concat(A6_C.slice(0,-1).reverse()),bpm:100},
  rem:'do re mi fa sol la ti do = the major scale.',
  more:['Indian music has the same idea with sa re ga ma pa dha ni sa (the sargam): its major-scale version matches do re mi exactly.'],
  check:[{q:'Which syllable is the 5th note of the scale?',a:['sol','fa','la'],c:0,why:'do re mi fa sol: the 5th is sol.'}]}
]},
{id:'A6.02',t:'Scale degrees',cards:[
 {id:'A6.02.1',t:'Numbering the notes',idea:'The notes of a scale are numbered 1 to 7; the top note, an octave above 1, is 1 again (sometimes called 8).',
  dg:{type:'keys',from:60,oct:1,hi:A6_C,marks:{60:'1',62:'2',64:'3',65:'4',67:'5',69:'6',71:'7',72:'1'}},hear:{seq:A6_C,bpm:90},
  rem:'Scale degrees: 1 2 3 4 5 6 7 (1).',
  more:['Numbers let musicians talk about a song in any key: “the chorus starts on the 4 chord” makes sense whatever the key.'],
  check:[{q:'In C major, which note is degree 5?',a:['G','F','A'],c:0,why:'C D E F G: G is the 5th.'}]},
 {id:'A6.02.2',t:'Same numbers in every key',idea:'Start the W W H W W W H pattern on any note and you get that note’s major scale. The numbers stay the same; only the letters change.',
  dg:{type:'keys',from:67,oct:1,hi:A6_G,marks:{67:'1',69:'2',71:'3',72:'4',74:'5',76:'6',78:'7',79:'1'}},hear:[{l:'▶ C major',seq:A6_C,bpm:100},{l:'▶ G major',seq:A6_G,bpm:100}],
  rem:'Any note + W W H W W W H = its major scale.',
  more:['Both scales sound the same shape, just higher or lower. That’s why a singer can ask for a song “in a lower key”.'],
  check:[{q:'G major starts on G. What is degree 3?',a:['B','A','C'],c:0,why:'G A B: B is the 3rd.'}]}
]},
{id:'A6.03',t:'Keys',cards:[
 {id:'A6.03.1',t:'“In the key of G”',idea:'A song in the key of G uses mostly the notes of the G major scale, and G feels like its home.',
  dg:{type:'keys',from:67,oct:1,names:true,hi:A6_G},hear:{l:'▶ A tune in G',seq:[67,71,74,71,72,69,66,67],beats:1,bpm:96},
  rem:'Key of G = the G major scale’s notes, with G as home.',
  more:['Backline shows the key of every song in its index, so you can see which songs share a key.'],backline:[{l:'Browse songs by key',h:'browse=key'}],
  check:[{q:'A song is “in D”. Its home note is…',a:['D','C','A'],c:0,why:'The key names the home note.'}]},
 {id:'A6.03.2',t:'G major needs F♯',idea:'Following W W H W W W H from G, the 7th note has to be F♯, not F. Each key has its own set of sharps or flats.',
  dg:{type:'keys',from:67,oct:1,names:'all',hi:A6_G,steps:[[76,78,'W'],[78,79,'H']]},hear:[{l:'▶ With F♯ (right)',seq:A6_G,bpm:100},{l:'▶ With F (wrong)',seq:[67,69,71,72,74,76,77,79],bpm:100}],
  rem:'G major has one sharp: F♯.',
  more:['A key signature at the start of the music lists those sharps or flats once, so they don’t have to be written on every note (Tier B).'],
  check:[{q:'Which note does G major use instead of F?',a:['F♯','F♭','E'],c:0,why:'The pattern needs a whole step from E, then a half step to G: F♯.'}]},
 {id:'A6.03.3',t:'Changing key',idea:'Moving a whole song up or down to another key is called transposing. The numbers (degrees, chords) stay the same.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,64,67]},hear:[{l:'▶ Tune in C',seq:[60,64,67,64,65,62,59,60],bpm:96},{l:'▶ Same tune in D',seq:[62,66,69,66,67,64,61,62],bpm:96}],
  rem:'Transpose = same song, another key.',
  more:['For a drummer, changing key changes nothing you play, but you should know when a band will do it (often for a singer, or for a last chorus).'],
  check:[{q:'The band transposes a song from C to D. What changes for the drums?',a:['Nothing in the pattern','Every fill','The tempo'],c:0,why:'Key is about pitch; drum parts don’t change.'}]}
]},
{id:'A6.04',t:'Home: the tonic',cards:[
 {id:'A6.04.1',t:'The tonic',idea:'The tonic is note 1 of the key, the home note. Melodies and chord loops pull back towards it, and most songs end on it.',
  dg:{type:'keys',from:60,oct:1,names:true,hi:[60,72]},hear:{l:'▶ Back home',seq:[67,65,64,62,71,72],bpm:90},
  rem:'Tonic = note 1 = home.',
  more:['The chord built on the tonic (the I chord) is home too. You’ll hear it at the end of choruses and songs.'],
  check:[{q:'In the key of A, the tonic is…',a:['A','E','D'],c:0,why:'The tonic is the note the key is named after.'}]},
 {id:'A6.04.2',t:'Home or away?',idea:'Listen to how a phrase ends: on the tonic it sounds finished; anywhere else it sounds like a question that wants an answer.',
  dg:{type:'keys',from:60,oct:1,names:true},hear:[{l:'▶ Ends home',seq:[64,62,67,71,72],bpm:90},{l:'▶ Ends away',seq:[64,62,67,71,69],bpm:90}],ear:true,
  rem:'Finished = home. Hanging = away.',
  check:[{q:'Does this phrase end at home?',hear:{seq:[60,64,67,65,62,60],bpm:96},a:['Yes, it sounds finished','No, it hangs'],c:0,why:'It falls back to C, the tonic.'},
   {q:'And this one?',hear:{seq:[60,64,67,65,64,62],bpm:96},a:['No, it hangs','Yes, it sounds finished'],c:0,why:'It stops on D, degree 2, so it wants to go on.'}]},
 {id:'A6.04.3',t:'Why home matters to a drummer',idea:'Sections often end by returning home, and the band lands together there. Hearing home tells you a phrase or song is ending, before anyone gives a cue.',
  dg:{type:'chart',bars:[['C'],['F'],['G'],['C']],rn:['I','IV','V','I']},hear:{chords:['C','F','G','C'],beats:4,bpm:90,ex:TX('Beat',2,B8)},
  rem:'Home chord coming back = the phrase is ending. Get ready to land.',
  more:['In the loop above, G pulls hard back to C. That pull is the strongest one in music (Tier B: dominant to tonic).'],
  check:[{q:'The band reaches the home chord at the end of 8 bars. That’s usually…',a:['the end of a phrase','the middle of a bar','a mistake'],c:0,why:'Home arrives where phrases finish.'}]}
]}
]});
