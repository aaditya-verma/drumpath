/* DrumPath Theory — Tier A · Part A10: Playing with others 1 (thread B). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
DP_THEORY.push({id:'A10',tier:'A',th:'B',t:'Playing with others 1',d:'What changes when other people play with you: counting the band in, starting and stopping together, who leads, simple cues, and keeping going through a mistake.',ch:[
{id:'A10.01',t:'Count-ins',cards:[
 {id:'A10.01.1',t:'The count-in',idea:'Before a song starts, the drummer counts the band in at the song’s tempo, usually “1 … 2 … 1 2 3 4”, then everyone starts together on the next 1.',
  dg:{type:'count',ex:TX('Count-in',1,{S:'x.x.xxxx'},{bars:2})},hear:{l:'▶ 1 … 2 … 1 2 3 4, go',ex:TX('Count-in then play',1,{S:'x.x.xxxx........',K:'........x.x.x.x.',HH:'........xxxxxxxx'},{bars:4}),bpm:100,click:'none',cin:false,reps:1},
  try:{ex:[TX('Count-in, then the beat',1,{S:'x.x.xxxx.x.x.x.x',K:'........x.x.x.x.',HH:'........xxxxxxxx'},{bars:4})],bpm:90,loop:1},
  rem:'“1 … 2 … 1 2 3 4” at the song’s tempo, then everyone in on 1.',links:{lessons:['1.6.04']},
  more:['Click your sticks or tap the hi-hat while you count, so the band hears the tempo even if they can’t hear your voice.','The count-in sets the tempo of the whole song. Get it right before you start (next card).'],
  check:[{q:'Who usually counts the band in?',a:['The drummer','The singer','The audience'],c:0,why:'The drummer sets and shows the tempo.'}]},
 {id:'A10.01.2',t:'Think the song first',idea:'Before counting, hear the chorus in your head for a few seconds and tap it. Then count at that speed. A count-in that’s too fast or slow sets the whole song wrong.',
  dg:{type:'tempo',marks:[90,100]},
  rem:'Hear the chorus in your head → find its tempo → then count.',
  more:['Nerves make count-ins fast. If you know the BPM, check it with a metronome app or DrumPath’s Songs › Tap tempo before you start.'],
  check:[{q:'Why hum the chorus before counting in?',a:['To find the right tempo','To warm up your voice','To decide the key'],c:0,why:'The count-in has to match the song’s speed.'}]}
]},
{id:'A10.02',t:'Starting and stopping together',cards:[
 {id:'A10.02.1',t:'Land the first 1',idea:'After the count-in, the most important note of the song is the first 1: everyone plays it at the same moment. Make it strong and clear.',
  dg:{type:'nt',ex:TX('First bar',2,{C:'x.......',HH:'.xxxxxxx',K:'x...x...',S:'..x...x.'})},hear:{chords:['C','G'],beats:4,bpm:100,ex:TX('In',2,{C:'x...............',HH:'.xxxxxxxxxxxxxxx',K:'x...x...x...x...',S:'..x...x...x...x.'},{bars:2}),click:true},
  rem:'The first 1 after a count-in: together, clear, confident.',
  check:[{q:'After “1 2 3 4”, the band comes in on…',a:['the next 1','the “&” of 4','beat 2'],c:0,why:'The count-in leads straight into the first beat of the song.'}]},
 {id:'A10.02.2',t:'Stopping together',idea:'For an ending, everyone hits the last note together and lets it ring, or cuts it off at the same moment. The drummer usually shows when.',
  dg:{type:'nt',ex:TX('Ending',2,{C:'........x.......',HH:'xxxxxxxx........',K:'x...x...x.......',S:'..x...x.........'},{bars:2})},hear:{chords:['G','C'],beats:4,bpm:90,ex:TX('End',2,{C:'........x.......',HH:'xxxxxxxx........',K:'x...x...x.......',S:'..x...x.........'},{bars:2})},
  rem:'Last hit together; let it ring or cut it off together.',links:{lessons:['1.6.04']},see:['A4.07.3'],
  more:['To cut off a ringing ending, lift a stick high and bring it down sharply, or grab the cymbal: everyone stops on that motion.'],
  check:[{q:'How does a band usually end a song cleanly?',a:['Everyone hits the last note together','Each person stops when they like','The drummer plays a long fill alone'],c:0,why:'A shared last hit (and a shared cut-off) sounds finished.'}]}
]},
{id:'A10.03',t:'Who leads',cards:[
 {id:'A10.03.1',t:'The drummer keeps the time',idea:'In most bands the drummer is the timekeeper: everyone listens to your hi-hat and backbeat for the tempo, so steady time is your first job.',
  dg:{type:'feel',mode:'steady'},mine:'timing',
  rem:'The band follows your time. Steady beats fancy.',see:['A1.09.1'],
  more:['If the band rushes, don’t chase it; hold the tempo firmly and they’ll come back to you.'],
  check:[{q:'The band starts rushing in the chorus. Your job is to…',a:['hold the tempo steady','speed up with them','stop playing'],c:0,why:'You are the time; keep it.'}]},
 {id:'A10.03.2',t:'Following the singer',idea:'For the shape of the song (how long, how loud, when to end) the singer or bandleader often decides. Watch them and follow their energy.',
  dg:{type:'energy',parts:[['Verse',0.45],['Chorus',0.85],['Quiet bit',0.3],['Chorus',0.95]]},
  rem:'You lead the time; the singer/leader often leads the shape.',
  more:['Keep your eyes up from the kit: most cues come from faces and hands, not sounds.'],
  check:[{q:'Who usually decides to repeat a chorus one more time?',a:['The singer or bandleader','The bass player’s amp','Nobody'],c:0,why:'They lead the form; you follow and mark it.'}]}
]},
{id:'A10.04',t:'Cues',cards:[
 {id:'A10.04.1',t:'Simple cues',idea:'Bands use small signals: a nod means “change on the next 1”, a look means “get ready”, a raised hand or stick means “last hit” or “stop”.',
  dg:{type:'form',parts:[['Verse',8],['nod',1],['Chorus',8]]},
  rem:'Nod = change next 1 · look = get ready · hand/stick up = last hit or stop.',links:{lessons:['1.6.04']},
  more:['Give cues a bar early: a nod in bar 7 for a change at bar 9 (the next section).'],
  check:[{q:'A nod usually means…',a:['change on the next 1','play louder','tune your drums'],c:0,why:'It signals the change is coming.'}]},
 {id:'A10.04.2',t:'Agree before you play',idea:'Before the song, agree on the form and the cues: how many choruses, who ends it, how. Two minutes of talking saves a messy ending.',
  dg:{type:'form',parts:[['Intro',4],['Verse',8],['Chorus',8],['Verse',8],['Chorus',8],['Chorus',8],['End',1]],fills:true},
  rem:'Agree the map and the ending before you start.',see:['A8.05.1'],
  more:['Backline setlists can hold each song’s tempo and key; add the map to your own notes.'],backline:[{l:'Setlists',h:'sets'}],
  check:[{q:'What should a band agree before playing a new song?',a:['The form and the ending','The colour of the drums','Nothing'],c:0,why:'Shared map + shared ending = a clean performance.'}]}
]},
{id:'A10.05',t:'Keep going through a mistake',cards:[
 {id:'A10.05.1',t:'Never stop',idea:'If you make a mistake, keep the time going. Drop the fill, keep the hi-hat and backbeat, and get back in step. The audience notices stopping far more than a wrong note.',
  dg:{type:'nt',ex:TX('Safe groove',2,B8)},hear:{ex:TX('Safe groove',2,B8,{bars:2}),bpm:100},
  rem:'Mistake? Keep the time. Never stop.',
  more:['Practise this on purpose: during a run, miss a fill and come straight back to the groove on the next 1.'],
  check:[{q:'You mess up a fill. What now?',a:['Keep the groove going and land the next 1','Stop and restart the song','Play the fill again'],c:0,why:'Keeping time saves the song.'}]},
 {id:'A10.05.2',t:'Find 1 again',idea:'Lost your place? Listen for the next chord change or crash: that’s 1. Join there with a simple beat.',
  dg:{type:'count',ex:TX('Find 1',1,{C:'x...',K:'x.x.',S:'.x.x',HH:'.xxx'})},hear:{chords:['C','F','G','C'],beats:4,bpm:100,ex:TX('Groove',1,{C:'x...',K:'x.x.',S:'.x.x',HH:'.xxx'})},
  rem:'Lost? Wait for the next chord change or crash = 1, and join.',see:['A9.01.2'],
  check:[{q:'You lost the count. The best signal for the next 1 is…',a:['a chord change or crash','the hi-hat','the singer breathing'],c:0,why:'Big changes happen on 1.'}]},
 {id:'A10.05.3',t:'Simplify to survive',idea:'When things get shaky, play less: hi-hat or ride, kick on 1 and 3, snare on 2 and 4. The simplest groove is the easiest to keep steady.',
  dg:{type:'nt',ex:TX('Simplest',1,{HH:'xxxx',K:'x.x.',S:'.x.x'})},hear:{ex:TX('Simplest',1,{HH:'xxxx',K:'x.x.',S:'.x.x'},{bars:2}),bpm:100},
  try:{ex:[TX('The safe groove',1,{HH:'xxxx',K:'x.x.',S:'.x.x'},{bars:2})],bpm:90},
  rem:'Shaky? Strip it back to the basic beat.',links:{lessons:['1.5.01']},
  check:[{q:'The band falls apart in a jam. Your best move is…',a:['play the simplest groove, steadily','play a big fill','speed up'],c:0,why:'A simple steady beat gives everyone something to hold on to.'}]}
]}
]});
