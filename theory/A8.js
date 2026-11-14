/* DrumPath Theory — Tier A · Part A8: Song form 1 (thread F). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const A8_POP=[['Intro',4],['Verse',8],['Chorus',8],['Verse',8],['Chorus',8],['Bridge',8],['Chorus',8],['Outro',4]];
DP_THEORY.push({id:'A8',tier:'A',th:'F',t:'Song form 1',d:'How songs are put together: sections, counting the bars in each one, 4- and 8-bar phrases, why fills land where they do, and writing a song map.',ch:[
{id:'A8.01',t:'Sections',cards:[
 {id:'A8.01.1',t:'The parts of a song',idea:'Most songs are built from a few sections: intro, verse, chorus, sometimes a bridge, and an outro. The order is the song’s form.',
  dg:{type:'form',parts:A8_POP},
  rem:'Intro · verse · chorus · bridge · outro. Their order = the form.',
  more:['Many sections repeat: verse–chorus–verse–chorus is the common pop shape. Knowing the form means you always know what comes next.'],backline:[{l:'Song sheets with form strips',h:'search'}],
  check:[{q:'What is a song’s “form”?',a:['The order of its sections','Its tempo','Its key'],c:0,why:'Form = which sections come in which order.'}]},
 {id:'A8.01.2',t:'Verse and chorus',idea:'Verses usually have new words each time and lower energy; the chorus repeats with the same words and is the big, catchy part.',
  dg:{type:'energy',parts:[['Intro',0.35],['Verse',0.45],['Chorus',0.85],['Verse',0.5],['Chorus',0.9],['Outro',0.4]]},
  hear:[{l:'▶ Verse feel',chords:['Am','F','C','G'],beats:4,bpm:92,ex:TX('Verse',2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'}),gain:0.6},{l:'▶ Chorus feel',chords:['F','G','C','Am'],beats:4,bpm:92,ex:TX('Chorus',2,{R:'xxxxxxxx',K:'x..xx...',S:'..X...X.'})}],
  rem:'Verse = story, lower energy. Chorus = the hook, bigger.',
  more:['Drummers mark the difference: hi-hat or cross-stick in the verse, ride or open hats and a full backbeat in the chorus.'],see:['A4.07.1'],
  check:[{q:'Which section usually repeats the same words?',a:['Chorus','Verse','Intro'],c:0,why:'The chorus is the repeated hook.'}]},
 {id:'A8.01.3',t:'The bridge',idea:'A bridge is a section that sounds different from both verse and chorus, often once, before the last chorus. It gives the ear a break.',
  dg:{type:'form',parts:[['Chorus',8],['Bridge',8],['Chorus',8]]},hear:{l:'▶ Bridge chords',chords:['Dm','Em','F','G'],beats:4,bpm:92,ex:TX('Bridge',2,{HH:'x.x.x.x.',K:'x.......',S:'....x...'})},
  rem:'Bridge = something different, usually once, before the last chorus.',
  more:['Drummers often change the groove in the bridge: half-time, toms, or dropping out. Then a big fill back into the chorus.'],
  check:[{q:'Where does a bridge usually come?',a:['Before the last chorus','At the very start','After the outro'],c:0,why:'It sets up the final chorus.'}]}
]},
{id:'A8.02',t:'Counting bars in a section',cards:[
 {id:'A8.02.1',t:'Sections come in 4, 8 and 16',idea:'Most sections are 4, 8 or 16 bars long. Verses and choruses are often 8 or 16; intros and outros often 4.',
  dg:{type:'form',parts:[['Intro',4],['Verse',8],['Chorus',8]]},
  rem:'Sections are usually 4, 8 or 16 bars.',
  more:['Odd lengths happen (a 6-bar intro, a 2-bar break) and they’re exactly the spots where bands come in wrong. Count them.'],
  check:[{q:'A typical chorus is how long?',a:['8 bars','3 bars','20 bars'],c:0,why:'8 (or 16) is most common.'}]},
 {id:'A8.02.2',t:'Know where you are',idea:'Count bars through each section the way you learnt in Sound, beat and time: 1 2 3 4, 2 2 3 4… up to 8, then start again for the next section.',
  dg:{type:'count',ex:TX('Eight bars',1,{K:'x.x.',S:'.x.x',HH:'xxxx'},{bars:8})},hear:{ex:TX('Eight bars',1,{K:'x.x.',S:'.x.x',HH:'xxxx',C:'x...'+'.'.repeat(28)},{bars:8}),bpm:110,reps:1},
  rem:'Count bars in every section. Restart the count when the section changes.',see:['A1.06.4'],
  more:['Lesson 1.6.02 practises 3 bars of groove + 1 bar of fill: that’s counting bars in action.'],links:{lessons:['1.6.02']},
  check:[{q:'You say “5 2 3 4”. You are in…',a:['bar 5 of the section','beat 5','the 5th section'],c:0,why:'The first number is the bar number.'}]}
]},
{id:'A8.03',t:'Phrases',cards:[
 {id:'A8.03.1',t:'A phrase is a musical sentence',idea:'Music talks in phrases, usually 4 bars long. At the end of a phrase the music breathes before the next one starts.',
  dg:{type:'form',parts:[['Phrase 1',4],['Phrase 2',4]],fills:true},hear:{chords:['C','G','Am','F','C','G','F','C'],beats:4,bpm:100,ex:TX('Beat',2,B8)},
  rem:'Phrase = a musical sentence, usually 4 bars.',
  more:['An 8-bar verse is normally two 4-bar phrases. You can hear the breath in the singing and the chords.'],
  check:[{q:'An 8-bar verse is usually…',a:['two 4-bar phrases','eight 1-bar phrases','one 8-bar note'],c:0,why:'Phrases come in 4s.'}]},
 {id:'A8.03.2',t:'Question and answer',idea:'Often the first phrase ends “open” (away from home) and the second ends “closed” (back home), like a question and its answer.',
  dg:{type:'chart',bars:[['C'],['F'],['G'],['G'],['C'],['F'],['G'],['C']],rn:['I','IV','V','V','I','IV','V','I'],note:'phrase 1 ends on V (open) · phrase 2 ends on I (closed)'},hear:{chords:['C','F','G','G','C','F','G','C'],beats:4,bpm:100},
  rem:'Phrase 1 asks (ends away), phrase 2 answers (ends home).',see:['A6.04.2'],
  more:['When the answer phrase lands home, a section is often ending: get ready for a change.'],
  check:[{q:'A phrase that ends on the home chord sounds…',a:['finished','unfinished','faster'],c:0,why:'Home = resolved.'}]}
]},
{id:'A8.04',t:'Fills and phrases',cards:[
 {id:'A8.04.1',t:'Why fills land in bars 4 and 8',idea:'A fill marks the end of a phrase and leads into the next. So small fills go in bar 4, and a bigger one in bar 8, just before a new section.',
  dg:{type:'form',parts:[['Verse',8],['Chorus',8]],fills:true},
  hear:{ex:TX('4 bars + fill',2,{C:'x.......'+'.'.repeat(24),HH:'.xxxxxxx'+'xxxxxxxx'+'xxxxxxxx'+'xxxx....',K:'x...x...'+'x...x...'+'x...x...'+'x...x...',S:'..x...x.'+'..x...x.'+'..x...x.'+'..x.xxxx'},{bars:4}),bpm:100,reps:2},
  try:{ex:[TX('3 bars + a fill',2,{C:'x.......'+'.'.repeat(24),HH:'.xxxxxxx'+'xxxxxxxx'+'xxxxxxxx'+'xxxx....',K:'x...x...'+'x...x...'+'x...x...'+'x...x...',S:'..x...x.'+'..x...x.'+'..x...x.'+'..x.xxxx'},{bars:4})],bpm:80},
  rem:'Small fill at bar 4, bigger fill at bar 8 (before a new section).',links:{lessons:['1.6.02']},see:['A4.05.2'],
  more:['If you play a big fill in bar 4 of an 8-bar verse, the band may think the section is ending. Size the fill to the change coming.'],
  check:[{q:'Where does the biggest fill of a section usually go?',a:['Its last bar, before a new section','Its first bar','Bar 3'],c:0,why:'The end of the section, leading into the next one.'}]},
 {id:'A8.04.2',t:'Matching the fill to the change',idea:'The bigger the change coming, the bigger the set-up: a short fill between phrases, a longer one into the chorus, the biggest into the last chorus.',
  dg:{type:'energy',parts:[['Verse',0.45],['fill',0.6],['Chorus',0.85],['Bridge',0.55],['big fill',0.8],['Last chorus',1]]},
  rem:'Fill size ∝ size of the change.',
  more:['Sometimes the strongest set-up is silence: stopping for a beat before the chorus.'],
  check:[{q:'Which needs the biggest fill?',a:['Into the last chorus','Between two verse phrases','In the middle of a bar'],c:0,why:'The biggest change gets the biggest set-up.'}]}
]},
{id:'A8.05',t:'A song map',cards:[
 {id:'A8.05.1',t:'Write a road map',idea:'Before playing a song, write its map: each section with its length, e.g. Intro 4 · Verse 8 · Chorus 8 · Verse 8 · Chorus 8 · Bridge 8 · Chorus 8 · Outro 4.',
  dg:{type:'form',parts:A8_POP,fills:true},
  rem:'Song map = sections + bar counts, in order.',links:{lessons:['3.7.03']},
  more:['A map on a small card next to the kit beats memorising. Lesson 3.7.03 is about exactly this.','Backline’s song sheets show a form strip for each song; check it against your own map.'],backline:[{l:'Find a song and its form',h:'search'}],
  check:[{q:'What does a song map list?',a:['Sections and their lengths, in order','Every note','The lyrics'],c:0,why:'It’s the route through the song.'}]},
 {id:'A8.05.2',t:'Sections in a 12-bar song',idea:'In a blues, one section is one 12-bar round (a chorus). The song is several rounds: intro, a few choruses, maybe a solo round, an ending.',
  dg:{type:'form',parts:[['Intro',4],['Round 1',12],['Round 2',12],['Solo',12],['Round 3',12],['End',2]]},
  rem:'Blues form: the 12 bars repeat; each round is one chorus.',links:{lessons:['4.7.02']},see:['A7.05.3'],
  more:['Count 12s, not 8s: the turnaround in bars 11–12 tells everyone a new round is coming.'],
  check:[{q:'In a blues, one “chorus” is…',a:['one 12-bar round','8 bars','the last 2 bars'],c:0,why:'Each 12-bar cycle is a chorus.'}]}
]}
]});
