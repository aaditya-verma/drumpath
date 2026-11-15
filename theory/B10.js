/* DrumPath Theory — Tier B · Part B10: Styles 1 (thread G). Own words; grooves are generic style patterns. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const B10={
  rock:TX('Rock',2,{HH:'xxxxxxxx',K:'x..xx...',S:'..x...x.'}),
  pop:TX('Pop',4,{HH:'x.x.x.x.x.x.x.x.',K:'x.....x.x.......',S:'....x.......x...'}),
  funk:TX('Funk',4,{HH:'xxxxxxxxxxxxxxxx',K:'x.x...x...x.....',S:'....X..g.g..X..g'}),
  disco:TX('Disco',2,{HH:'xoxoxoxo',K:'x.x.x.x.',S:'..x...x.'}),
  motown:TX('Motown',2,{HH:'xxxxxxxx',K:'x..x..x.',S:'x.x.x.x.'}),
  reggae:TX('One drop',3,{HH:'x.x',K:'......x.....',S:'......r.....'}),
  train:TX('Train beat',4,{S:'ggggXgggggggXggg',K:'x.......x.......'}),
  twostep:TX('Two-step',1,{K:'x.x.',S:'.x.x'}),
  jazz:TX('Jazz ride',3,{R:'x..x.xx..x.x',HP:'...x.....x..'})};
const B10_try=(ex,bpm)=>({ex:[TX(ex.n,ex.sub,ex.v,{bars:2,steps:ex.steps})],bpm});
DP_THEORY.push({id:'B10',tier:'B',th:'G',t:'Styles 1',d:'What defines the core band styles: rock, pop, funk, disco, Motown, reggae, country, blues and a first jazz ride pattern. For each, the feel, the parts that matter and where you meet it in your lessons.',ch:[
{id:'B10.01',t:'Rock and pop',cards:[
 {id:'B10.01.1',t:'Rock',idea:'Rock sits on a strong backbeat (2 and 4), steady 8ths on hi-hat or ride, and a kick that locks with the bass and guitar riff. Played with weight, slightly on top of the beat.',
  dg:{type:'nt',ex:B10.rock},hear:{ex:TX('Rock',2,B10.rock.v,{bars:2}),bpm:120},try:B10_try(B10.rock,100),
  rem:'Rock = big backbeat + 8ths + kick with the riff.',links:{lessons:['2.5.01','4.5.04']},
  more:['Rock choruses often move to the ride or a crash-ride; fills tend to be strong tom figures leading into crashes on “1”.'],
  check:[{q:'The defining sound of rock drumming is…',a:['a strong backbeat on 2 and 4','swung ride cymbal','four-on-the-floor kick'],c:0,why:'The backbeat drives rock.'}]},
 {id:'B10.01.2',t:'Pop',idea:'Pop drums serve the vocal: clean, simple, very steady patterns, often lighter than rock, with the kick shaped around the hook and lots of space.',
  dg:{type:'count',ex:B10.pop},hear:{ex:TX('Pop',4,B10.pop.v,{bars:2}),bpm:100},try:B10_try(B10.pop,90),
  rem:'Pop = simple, steady, leave room for the voice.',links:{lessons:['1.5.03','2.5.02']},
  more:['Modern pop often borrows programmed beats; a drummer copies them by playing very evenly and keeping fills short.'],
  check:[{q:'In pop, the drums mainly…',a:['support the vocal with steady, simple parts','solo between lines','play as many fills as possible'],c:0,why:'The song and singer come first.'}]}
]},
{id:'B10.02',t:'Funk and disco',cards:[
 {id:'B10.02.1',t:'Funk',idea:'Funk lives on 16ths: a busy hi-hat, a syncopated kick, a crisp backbeat and quiet ghost notes in between. Tight and locked with the bass.',
  dg:{type:'nt',ex:B10.funk},hear:{ex:TX('Funk',4,B10.funk.v,{bars:2}),bpm:96},try:B10_try(B10.funk,80),
  rem:'Funk = 16ths, syncopated kick, ghosts, tight backbeat.',links:{lessons:['3.2.07','4.2.05']},
  more:['The ghost notes should be barely heard; the contrast with the loud backbeat is the whole point.'],
  check:[{q:'Funk grooves are usually built on…',a:['16th notes with ghost notes','triplets','whole notes'],c:0,why:'16ths and ghosts create the funk feel.'}]},
 {id:'B10.02.2',t:'Disco',idea:'Disco puts the kick on every beat (four on the floor), the snare on 2 and 4, and opens the hi-hat on every “&”: “tss” between the kicks.',
  dg:{type:'count',ex:B10.disco},hear:{ex:TX('Disco',2,B10.disco.v,{bars:2}),bpm:118},try:B10_try(B10.disco,110),
  rem:'Disco = four on the floor + open hi-hat on the “&”.',links:{lessons:['3.5.06']},
  more:['House and dance music took the four-on-the-floor kick straight from disco.'],
  check:[{q:'“Four on the floor” means the kick plays…',a:['every beat','2 and 4','only on 1'],c:0,why:'One kick per beat.'}]}
]},
{id:'B10.03',t:'Motown and soul',cards:[
 {id:'B10.03.1',t:'Motown',idea:'Classic Motown records often have the snare (or tambourine) on every beat, not just 2 and 4, giving a driving, danceable pulse under the singer.',
  dg:{type:'count',ex:B10.motown},hear:{ex:TX('Motown',2,B10.motown.v,{bars:2}),bpm:120},try:B10_try(B10.motown,100),
  rem:'Motown = snare on every beat; driving and danceable.',
  more:['Soul ballads go the other way: slow 12/8 or half-time grooves with lots of space.'],
  check:[{q:'A classic Motown feel puts the snare on…',a:['every beat','only beat 3','the “a”s'],c:0,why:'Quarter-note snare drives the groove.'}]}
]},
{id:'B10.04',t:'Reggae',cards:[
 {id:'B10.04.1',t:'One drop',idea:'Reggae’s one drop leaves beat 1 empty: kick and rim click land together only on beat 3, over a lazy, swung hi-hat. Space is the groove.',
  dg:{type:'count',ex:B10.reggae},hear:{ex:TX('One drop',3,B10.reggae.v,{bars:2}),bpm:76},try:B10_try(B10.reggae,72),
  rem:'One drop = kick + rim on 3 only, nothing on 1.',
  more:['Two cousins: “rockers” adds the kick on every beat, “steppers” plays four on the floor. All keep the guitar chop on the off-beats.'],
  check:[{q:'In a one-drop groove, the kick plays on…',a:['beat 3','beat 1','every beat'],c:0,why:'The “drop” is on 3.'}]}
]},
{id:'B10.05',t:'Country',cards:[
 {id:'B10.05.1',t:'Train beat',idea:'The train beat runs continuous 16ths on the snare (soft, often with brushes) with accents on 2 and 4: the sound of a train on the rails.',
  dg:{type:'count',ex:B10.train},hear:{ex:TX('Train beat',4,B10.train.v,{bars:2}),bpm:110},try:B10_try(B10.train,90),
  rem:'Train beat = soft 16ths with accents on 2 and 4.',links:{lessons:['3.5.03']},
  more:['On the kit with sticks, keep the unaccented notes very low so the accents stand out.'],
  check:[{q:'In a train beat, the accents fall on…',a:['2 and 4','every 16th','1 and 3'],c:0,why:'Like a backbeat, inside steady 16ths.'}]},
 {id:'B10.05.2',t:'Two-step',idea:'The country two-step is “boom-chick”: kick on 1 and 3, snare (or cross-stick) on 2 and 4, light and bouncy, often at quick tempos.',
  dg:{type:'count',ex:B10.twostep},hear:{ex:TX('Two-step',1,B10.twostep.v,{bars:2}),bpm:150},try:B10_try(B10.twostep,120),
  rem:'Two-step = boom-chick: kick 1 & 3, snare 2 & 4.',links:{lessons:['3.5.04','3.5.02']},
  more:['Many country songs switch to a train beat or a shuffle for the chorus.'],
  check:[{q:'“Boom-chick” means…',a:['kick on 1 and 3, snare on 2 and 4','snare on every beat','kick on every beat'],c:0,why:'Boom = kick, chick = snare.'}]}
]},
{id:'B10.06',t:'Blues and jazz',cards:[
 {id:'B10.06.1',t:'Blues',idea:'Blues drumming is mostly shuffles (fast or slow), slow 12/8 grooves and straight rock-blues, always following the 12-bar form and the soloist.',
  dg:{type:'count',ex:TX('Slow 12/8',3,{HH:'xxx',K:'x.....x.....',S:'...x.....x..'},{steps:12,meter:'12/8'})},
  hear:{ex:TX('Slow 12/8',3,{HH:'xxx',K:'x.....x.....',S:'...x.....x..'},{steps:12,meter:'12/8',bars:2}),bpm:56},
  rem:'Blues = shuffle or slow 12/8, always inside the 12-bar form.',links:{lessons:['4.5.08','4.5.09','4.7.02']},
  more:['Listen for the turnaround in bar 12: a small fill there keeps the band together.'],
  check:[{q:'The most common blues drum feels are…',a:['shuffles and slow 12/8','four on the floor','one drop'],c:0,why:'Swing-based feels fit the blues.'}]},
 {id:'B10.06.2',t:'The jazz ride pattern',idea:'Jazz time lives on the ride cymbal: “ding, ding-a, ding, ding-a”, swung, with the hi-hat pedal on 2 and 4. The kick and snare comment rather than keep a backbeat.',
  dg:{type:'count',ex:B10.jazz},hear:{ex:TX('Jazz ride',3,B10.jazz.v,{bars:2}),bpm:140},try:B10_try(B10.jazz,110),
  rem:'Jazz = swung ride (ding ding-a) + hi-hat foot on 2 and 4.',links:{lessons:['4.5.07','4.7.03']},
  more:['The snare and kick “comp”: short, quiet accents that answer the soloist (Tier C: Jazz language).'],
  check:[{q:'In jazz, the main timekeeping happens on…',a:['the ride cymbal','the snare','the kick'],c:0,why:'The ride carries jazz time.'}]}
]}
]});
