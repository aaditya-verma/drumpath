/* DrumPath lessons: Level 4 — Moeller & essential grooves
   Pattern chars: x normal · X accent · g ghost · o open hi-hat · r rim/cross-stick · f flam · d drag · . rest
   New exercise fields (Level 4): meter (shown on the practice screen), labels (one per bar, e.g. chord names).
   Compound meters (6/8, 12/8) use sub 3: the BPM is the dotted-quarter pulse. */
(function(){
// one-bar beat + one-bar fill (same helper as Level 3)
function fill2(sub,base,fill,name,o){
  const n=(o&&o.steps)||4*sub, out={};
  const vs=new Set([...Object.keys(base),'C',...fill.filter(Boolean).map(f=>f.split(':')[0])]);
  vs.forEach(v=>{
    const b1=(base[v]||rep('.',n)).split(''), b2=(base[v]||rep('.',n)).split('');
    if(v==='HH'||v==='R')b1[0]='.';
    if(v==='C')b1[0]='x';
    for(let k=0;k<fill.length;k++){const i=n-fill.length+k;const [fv,fc]=(fill[k]||'').split(':');b2[i]=fv===v?(fc||'x'):'.';}
    const s=b1.join('')+b2.join(''); if(/[^.]/.test(s))out[v]=s;
  });
  return Object.assign({n:name,sub,bars:2,v:out},o||{});
}
// place chars at step positions: at(16,{0:'x',4:'X'})
function at(len,map){const a=rep('.',len).split('');Object.keys(map).forEach(k=>a[+k]=map[k]);return a.join('');}
// join bars: seq(16,[{HH:..,K:..},{...}]) → lanes over all bars (missing lanes = rests)
function seq(n,list){const vs=new Set();list.forEach(b=>Object.keys(b).forEach(v=>vs.add(v)));const out={};
  vs.forEach(v=>{out[v]=list.map(b=>b[v]||rep('.',n)).join('');});return out;}
const G16={HH:rep('x.',8),K:'x.......x.......',S:'....x.......x...'};          // 8th rock beat on a 16th grid
const SH={HH:rep('x.x',4),K:'x.....x.....',S:'...x.....x..'};                   // shuffle / 12/8 grid (12 steps)

DP_LESSONS.push(
/* ---- 4.1 Theory / Reading ---- */
{id:'4.1.01',t:'Quarter-note triplets',bpm:[60,90],d:'Three even notes across two beats. Feel the 8th-note triplets underneath (sub-click on) and play every second one.',
 ex:[X('Quarter triplets',3,{S:rep('x.x.x.',2)},{st:rep('R.L.R.',2)}),
     X('Quarters ↔ quarter triplets',3,{S:'x..x..x..x..'+rep('x.x.x.',2)},{bars:2}),
     X('Over a kick pulse',3,{K:'x..x..x..x..',S:rep('x.x.x.',2)}),
     X('Half bar each',3,{S:'x.x.x.'+'xxxxxx'},{st:'R.L.R.RLRLRL'})]},
{id:'4.1.02',t:'Dotted notes',bpm:[60,90],d:'A dot adds half the note’s value: a dotted 8th lasts three 16ths. Count “1 e & a” and play only the written notes.',
 ex:[X('Dotted 8th + 16th',4,{S:rep('x..x',4)}),
     X('16th + dotted 8th',4,{S:rep('xx..',4)}),
     X('Dotted quarters',2,{S:'x..x..x..x..x...'},{bars:2}),
     X('Dotted kick groove',4,{HH:rep('x.',8),K:'x..x....x..x....',S:'....x.......x...'})]},
{id:'4.1.03',t:'Reading in 3/4',bpm:[60,100],d:'Three beats per bar: count “1 & 2 & 3 &”. Short charts on snare and kick.',
 ex:[X('Quarters & 8ths',2,{S:'x.x.xx'+'xxx.x.'},{steps:6,bars:2,meter:'3/4'}),
     X('Kick & snare',2,{HH:'xxxxxx',K:'x.....',S:'..x.x.'},{steps:6,meter:'3/4'}),
     X('4-bar chart',2,{K:'x.....'+'x.....'+'x.....'+'x.....',S:'..x.x.'+'xxx.x.'+'..xxx.'+'x.....'},{steps:6,bars:4,meter:'3/4'})]},
{id:'4.1.04',t:'6/8 vs 3/4',bpm:[60,100],d:'Both bars hold six 8th notes. 3/4 groups them 2+2+2 (three beats); 6/8 groups them 3+3 (two beats). The accents show the difference and are scored.',
 ex:[X('3/4 feel',2,{S:'XxXxXx'},{steps:6,meter:'3/4',st:'RLRLRL',dyn:true}),
     X('6/8 feel',2,{S:'XxxXxx'},{steps:6,clicks:[0,3],meter:'6/8',st:'RLRLRL',dyn:true}),
     X('6/8 then 3/4',2,{S:'XxxXxx'+'XxXxXx'},{steps:6,bars:2,clicks:[0,2,4],click:'1',meter:'6/8 → 3/4',st:rep('RLRLRL',2),dyn:true}),
     X('Grooves: 6/8 then 3/4',2,{HH:rep('xxxxxx',2),K:'x.....'+'x.....',S:'...x..'+'..x.x.'},{steps:6,bars:2,clicks:[0,2,4],click:'1',meter:'6/8 → 3/4'})]},
{id:'4.1.05',t:'Reading in 12/8',bpm:[50,80],d:'Four beats per bar, each split into three 8th notes: “1-2-3, 2-2-3, 3-2-3, 4-2-3”. The tempo counts the four big beats.',
 ex:[X('Shuffle notes',3,{S:rep('x.x',4)},{steps:12,meter:'12/8'}),
     X('Triplets with accents',3,{S:rep('Xxx',4)},{steps:12,meter:'12/8',st:rep('RLR',4),dyn:true}),
     X('Blues chart',3,{S:'x..x..x.xx.x'+'x.xx.xx..x..'},{steps:12,bars:2,meter:'12/8'}),
     X('12/8 groove',3,{HH:rep('xxx',4),K:'x.....x.....',S:'...x.....x..'},{steps:12,meter:'12/8'})]},

/* ---- 4.2 Technique ---- */
{id:'4.2.01',t:'Moeller method intro',bpm:[60,90],d:'One whip motion gives a loud down stroke and soft taps: lift from the forearm, let the wrist and stick follow. The kit can’t see the motion, so the accents are scored.',
 ex:[X('Right hand: accent + 2 taps',3,{S:rep('Xxx',4)},{st:rep('R',12),dyn:true}),
     X('Left hand: accent + 2 taps',3,{S:rep('Xxx',4)},{st:rep('L',12),dyn:true}),
     X('One hand, 16ths',4,{S:rep('Xxxx',4)},{st:rep('R',16),dyn:true}),
     X('Alternating, accents on beats',4,{S:rep('Xxxx',4)},{st:rep('RLRL',4),dyn:true})]},
{id:'4.2.02',t:'2-, 3- and 4-stroke Moeller',bpm:[60,100],d:'One motion per group: the accent, then soft taps from the same hand. Accents must be clearly louder than the taps.',
 ex:[X('2-stroke',2,{S:rep('Xx',4)},{st:'RRLLRRLL',dyn:true}),
     X('3-stroke',3,{S:rep('Xxx',4)},{st:rep('RRRLLL',2),dyn:true}),
     X('4-stroke',4,{S:rep('Xxxx',4)},{st:rep('RRRRLLLL',2),dyn:true})]},
{id:'4.2.03',t:'Applying Moeller',bpm:[70,110],d:'Accented hi-hat grooves: the Moeller accent on the hats, taps in between.',
 ex:[X('8ths, accents on beats',2,{HH:'XxXxXxXx',K:'x...x...',S:'..x...x.'},{dyn:true}),
     X('8ths, accents on “&”',2,{HH:'xXxXxXxX',K:'x...x...',S:'..x...x.'},{dyn:true}),
     X('16ths, accents on beats',4,{HH:rep('Xxxx',4),K:'x.......x.......',S:'....x.......x...'},{dyn:true})]},
{id:'4.2.04',t:'Developing speed',bpm:[80,140],d:'Short bursts of singles, relaxed and low. At fast tempos a hit only counts for the note it’s nearest to.',
 ex:[X('8ths → 16ths',4,{S:'x.x.x.x.'+'xxxxxxxx'},{st:'R.L.R.L.RLRLRLRL'}),
     X('5-note bursts',4,{S:'xxxxx...xxxxx...'},{st:'RLRLR...LRLRL...'}),
     X('Full bar of 16ths',4,{S:rep('x',16)},{st:rep('RL',8)}),
     X('Two bars of 16ths',4,{S:rep('x',32)},{bars:2,st:rep('RL',16)})]},
{id:'4.2.05',t:'Ghost notes 2',bpm:[60,100],d:'Ghost-note snare grooves: the backbeat loud, the ghosts as soft as you can.',
 ex:[X('Ghost before the backbeat',4,{HH:rep('x.',8),K:'x.......x.x.....',S:'...gX......gX...'}),
     X('Ghosts after the backbeat',4,{HH:rep('x.',8),K:'x.......x.......',S:'....Xg.g....Xg.g'}),
     X('Ghosts on “e” and “a”',4,{HH:rep('x.',8),K:'x.......x.x.....',S:'.g..X..g.g..X..g'})]},
{id:'4.2.06',t:'Bass drum doubles',bpm:[60,100],d:'Two quick 16th-note kicks with one pedal. Keep the second as clear as the first.',
 ex:[X('Double on beat 1',4,Object.assign({},G16,{K:'xx......x.......'})),
     X('Doubles on 1 and 3',4,Object.assign({},G16,{K:'xx......xx......'})),
     X('Double on “& a”',4,Object.assign({},G16,{K:'x.xx....x.......'})),
     X('Doubles on the “a”',4,Object.assign({},G16,{K:'x..xx......xx...'}))]},
{id:'4.2.07',t:'Daily bass drum challenge',bpm:[60,120],routine:{min:10},d:'A 10-minute kick routine. Tap “Start 10-min routine”: the exercises play one after another with a short break, until the timer runs out. Every run counts as normal.',
 ex:[X('Quarters',4,{K:'x...x...x...x...'}),
     X('8ths',4,{K:rep('x.',8)}),
     X('Doubles',4,{K:rep('xx..',4)}),
     X('Gallop',4,{K:rep('x.xx',4)}),
     X('16th bursts',4,{K:'xxxx....xxxx....'})]},

/* ---- 4.3 Rudiments (PAS) ---- */
{id:'4.3.01',t:'Single stroke four',bpm:[60,100],d:'Three quick singles leading into a fourth, accented note: R L R L. Practise as 8th-note triplets, then 16th-note triplets.',
 ex:[X('Triplet pick-up',3,{S:'xxxX..xxxX..'},{st:'RLRL..LRLR..',dyn:true}),
     X('16th-triplet pick-up',6,{S:rep('...xxx'+'X.....',2)},{st:'...RLR'+'L.....'+'...LRL'+'R.....',dyn:true})]},
{id:'4.3.02',t:'Single stroke seven',bpm:[60,100],d:'Seven singles, the last one accented. Start with either hand.',
 ex:[X('Right-hand lead',6,{S:'xxxxxxX.....'+rep('.',12)},{st:'RLRLRLR.....'+rep('.',12),dyn:true}),
     X('Left-hand lead',6,{S:'xxxxxxX.....'+rep('.',12)},{st:'LRLRLRL.....'+rep('.',12),dyn:true}),
     X('As 16ths',4,{S:'xxxxxxX.........'},{st:'RLRLRLR.........',dyn:true})]},
{id:'4.3.03',t:'Six-stroke roll',bpm:[60,100],d:'R LL RR L: accents on the first and last notes, doubles in the middle.',
 ex:[X('Open (16ths)',4,{S:'XxxxxX..XxxxxX..'},{st:'RLLRRL..LRRLLR..',dyn:true}),
     X('As 16th-note triplets',6,{S:rep('XxxxxX',4)},{st:rep('RLLRRL',4),dyn:true})]},
{id:'4.3.04',t:'Seven-stroke roll',bpm:[60,100],d:'Three doubles into an accent: RR LL RR L. Open (slow) → closed (fast) → open.',
 ex:[X('Open (16ths)',4,{S:'xxxxxxX.xxxxxxX.'},{st:'RRLLRRL.LLRRLLR.',dyn:true}),
     X('Closed (32nds)',8,{S:rep('..xxxxxx'+'X.......',2)},{st:'..RRLLRR'+'L.......'+'..LLRRLL'+'R.......',dyn:true})]},
{id:'4.3.05',t:'Nine-stroke roll',bpm:[60,100],d:'Four doubles into an accent: RR LL RR LL R.',
 ex:[X('Open (16ths)',4,{S:'xxxxxxxxX.......'},{st:'RRLLRRLLR.......',dyn:true}),
     X('Closed (32nds)',8,{S:rep('xxxxxxxx'+'X.......',2)},{st:'RRLLRRLL'+'R.......'+'LLRRLLRR'+'L.......',dyn:true})]},
{id:'4.3.06',t:'Single paradiddle-diddle',bpm:[60,100],d:'R L RR LL in 16th-note triplets. First with an accent, then all even: the doubles are scored for evenness.',
 ex:[X('Accent the first',6,{S:rep('Xxxxxx',4)},{st:rep('RLRRLL',4),dyn:true}),
     X('Even doubles',6,{S:rep('xxxxxx',4)},{st:rep('RLRRLL',4),dyn:'even'})]},
{id:'4.3.07',t:'Rudiment applications',bpm:[60,100],d:'Each Level 4 rudiment as a fill after a bar of groove, landing on the crash.',
 ex:[fill2(4,G16,['S:X','S','S','S','S','S:X','T1','T1','T1:X','S','S','T2','T2','T3','T3','T3:X'],'Six-stroke fill'),
     fill2(4,G16,['','','','','','','','','S','S','S','S','S','S','S:X',''],'Seven-stroke into the crash'),
     fill2(6,{HH:rep('x..',8),K:at(24,{0:'x',12:'x'}),S:at(24,{6:'x',18:'x'})},['S:X','S','T1','T1','S','S','T2:X','S','T3','T3','S','S'],'Paradiddle-diddle around the toms'),
     fill2(6,{HH:rep('x..',8),K:at(24,{0:'x',12:'x'}),S:at(24,{6:'x',18:'x'})},['','','','','','','S','S','S','T1','T2','T3'],'Single stroke seven fill')]},

/* ---- 4.4 Independence ---- */
{id:'4.4.01',t:'Coordination drills',bpm:[60,100],d:'Hands and feet in turn. Keep every note even, whichever limb plays it.',
 ex:[X('Hand–foot 8ths',4,{S:'x...x...x...x...',K:'..x...x...x...x.'}),
     X('Ride, snare offbeats, kick quarters',4,{R:rep('x.',8),K:'x...x...x...x...',S:'..x...x...x...x.'}),
     X('Hand-hand-foot triplets',3,{S:rep('xx.',4),K:rep('..x',4)},{st:rep('RL.',4)}),
     X('Hand-foot-foot triplets',3,{S:rep('x..',4),K:rep('.xx',4)},{st:rep('R..',4)})]},
{id:'4.4.02',t:'RH / LH / kick / hi-hat foot',bpm:[60,100],d:'All four limbs: ride, backbeat, kick and the hi-hat pedal each keep their own part.',
 ex:[X('Foot on the “&”',2,{R:'xxxxxxxx',HP:'.x.x.x.x',K:'x...x...',S:'..x...x.'}),
     X('Foot on beats, kick on “&”',2,{R:'xxxxxxxx',HP:'x.x.x.x.',K:'.x...x..',S:'..x...x.'}),
     X('16th kicks with foot on 2 & 4',4,{R:rep('x.',8),HP:'....x.......x...',K:'x..x..x...x.....',S:'....x.......x...'})]},
{id:'4.4.03',t:'Dynamic independence 2',bpm:[60,90],d:'Two volume levels on different limbs at once. Accents and ghosts are scored per pad.',
 ex:[X('Accented hats, ghosted snare',2,{HH:'XxXxXxXx',K:'x...x...',S:'.gXg.gXg'},{dyn:true}),
     X('16ths: hat accents on “&”',4,{HH:rep('x.X.',4),K:'x.......x.......',S:'..g.X..g..g.X...'},{dyn:true}),
     X('Soft hats, loud backbeat',2,{HH:'xgxgxgxg',K:'x...x...',S:'..X.g.X.'},{dyn:true})]},

/* ---- 4.5 Grooves / Styles ---- */
{id:'4.5.01',t:'Half-time feel',bpm:[70,120],d:'The snare moves to beat 3, so the groove feels half as fast while the hats keep moving.',
 ex:[X('Half-time',4,{HH:rep('x.',8),K:'x.........x.....',S:'........x.......'}),
     X('Half-time, 16th hats',4,{HH:rep('x',16),K:'x......x..x.....',S:'........x.......'}),
     X('Half-time with ghosts',4,{HH:rep('x.',8),K:'x.........x.....',S:'...g....x....g..'}),
     X('Normal ↔ half-time',4,{HH:rep('x.',16),K:'x.......x.......'+'x.........x.....',S:'....x.......x...'+'........x.......'},{bars:2})]},
{id:'4.5.02',t:'Filling over the barline',bpm:[70,110],d:'The fill doesn’t stop at beat 1: it carries into the next bar and lands later, on the crash.',
 ex:[X('Fill into beat 1, crash on 2',4,Object.assign(seq(16,[
        {C:'x...............',HH:'..x.x.x.x.x.x.x.',K:'x.......x.......',S:'....x.......x...'},
        {HH:'x.x.x.x.x.x.....',K:'x.......x.......',S:'....x.......xxxx'},
        {T1:'xx..............',T3:'..xx............',C:'....x...........',K:'....x...x.......',HH:'......x.x.x.x.x.',S:'............x...'},
        G16])),{bars:4}),
     X('Fill to the “&” of 1',4,Object.assign(seq(16,[
        G16,
        {HH:'x.x.x.x.x.x.x.x.',K:'x.......x.......',S:'....x.......x...'},
        {HH:'x.x.x.x.x.......',K:'x.......x.......',S:'....x...xxxx....',T1:'............xx..',T2:'..............xx'},
        {T3:'xx..............',C:'..x.............',K:'..x.....x.......',HH:'....x.x.x.x.x.x.',S:'....x.......x...'}])),{bars:4}),
     X('Two-beat fill over the line',4,Object.assign(seq(16,[
        G16,
        {HH:'x.x.x.x.x.x.x.x.',K:'x.......x.......',S:'....x.......x...'},
        {HH:'x.x.x.x.x.x.x.x.',K:'x.......x.......',S:'....x.......x.xx'},
        {T1:'xx..............',T2:'..xx............',T3:'....xx..........',C:'........x.......',K:'........x.......',HH:'..........x.x.x.',S:'............x...'}])),{bars:4})]},
{id:'4.5.03',t:'Pushing the beat',bpm:[70,110],d:'Crash and kick land early, on the “&” of 4, and nothing plays on the next beat 1: the band pushes the chord.',
 ex:[X('Push on “& 4”',2,seq(8,[
        {HH:'.xxxxxxx',K:'....x...',S:'..x...x.'},{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},
        {HH:'xxxxxxx.',K:'x...x..x',S:'..x...x.',C:'.......x'}]),{bars:4}),
     X('Push with the snare',2,seq(8,[
        {HH:'.xxxxxxx',K:'....x...',S:'..x...x.'},{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},
        {HH:'xxxxxx..',K:'x...x...',S:'..x...xx',C:'.......x'}]),{bars:4}),
     X('16th push on the “a” of 4',4,seq(16,[
        {HH:'..x.x.x.x.x.x.x.',K:'........x.......',S:'....x.......x...'},G16,G16,
        {HH:'x.x.x.x.x.x.x...',K:'x.......x......x',S:'....x.......x...',C:'...............x'}]),{bars:4})]},
{id:'4.5.04',t:'Rock ballad grooves & fills',bpm:[60,80],d:'Slow tempos need control: let every note sit exactly on the grid. Fills in 16ths and 16th-note triplets.',
 ex:[X('Ballad 8ths',4,{HH:rep('x.',8),K:'x......x..x.....',S:'....x.......x...'}),
     X('Ride + cross-stick',4,{R:rep('x.',8),K:'x.........x.....',S:'....r.......r...'}),
     fill2(4,{HH:rep('x.',8),K:'x......x..x.....',S:'....x.......x...'},['S','S','T1','T1','T2','T2','T3','T3'],'Ballad 16th fill'),
     fill2(6,{HH:rep('x..',8),K:at(24,{0:'x',15:'x'}),S:at(24,{6:'x',18:'x'})},['S','S','S','T1','T1','T1','T2','T2','T2','T3','T3','T3'],'Ballad triplet fill')]},
{id:'4.5.05',t:'3/4 rock beats & fills',bpm:[80,120],d:'Rock in three: kick on 1, snare on 2 and 3, or the backbeat on 2 only.',
 ex:[X('3/4 rock',2,{HH:'xxxxxx',K:'x.....',S:'..x.x.'},{steps:6,meter:'3/4'}),
     X('Kick on 1 and 3',2,{HH:'xxxxxx',K:'x...x.',S:'..x...'},{steps:6,meter:'3/4'}),
     X('3/4 with 16th kicks',4,{HH:rep('x.',6),K:'x......x....',S:'....x...x...'},{steps:12,meter:'3/4'}),
     X('3/4 fill',2,{C:'x.....'+'......',HH:'.xxxxx'+'xx....',K:'x.....'+'x.....',S:'..x.x.'+'..xx..',T1:'......'+'....x.',T3:'......'+'.....x'},{steps:6,bars:2,meter:'3/4'})]},
{id:'4.5.06',t:'6/8 rock beats & fills',bpm:[50,80],d:'Two big beats per bar, three 8ths in each. The snare lands on beat 2 (the 4th 8th note). The tempo counts the big beats.',
 ex:[X('6/8 rock',3,{HH:'xxxxxx',K:'x.....',S:'...x..'},{steps:6,meter:'6/8'}),
     X('Kick on the 6',3,{HH:'xxxxxx',K:'x....x',S:'...x..'},{steps:6,meter:'6/8'}),
     X('Ride on the big beats',3,{R:'x..x..',K:'x....x',S:'...x..'},{steps:6,meter:'6/8'}),
     X('6/8 fill',3,{C:'x.....'+'......',HH:'.xxxxx'+'xxx...',K:'x.....'+'x.....',S:'...x..'+'...xx.',T3:'......'+'.....x'},{steps:6,bars:2,meter:'6/8'})]},
{id:'4.5.07',t:'Swing pattern',bpm:[80,140],d:'Ride “ding, ding-a, ding, ding-a” with the hi-hat foot on 2 and 4. The 8ths are swung (long-short).',
 ex:[X('Ride + foot',2,{R:'x.xxx.xx',HP:'..x...x.'},{swing:0.67}),
     X('Add a soft kick on beats',2,{R:'x.xxx.xx',HP:'..x...x.',K:'x.x.x.x.'},{swing:0.67}),
     X('Snare on the “&” of 4',2,{R:'x.xxx.xx',HP:'..x...x.',S:'.......x'},{swing:0.67})]},
{id:'4.5.08',t:'Blues shuffles',bpm:[70,120],d:'The shuffle: 1st and 3rd note of each triplet. Hats, then ride with the foot, then the double shuffle with both hands.',
 ex:[X('Hat shuffle',3,SH),
     X('Kick on the shuffle',3,Object.assign({},SH,{K:'x.x...x.x...'})),
     X('Ride shuffle + foot',3,{R:rep('x.x',4),HP:'...x.....x..',K:'x.....x.....',S:'...x.....x..'}),
     X('Double shuffle',3,{HH:rep('x.x',4),K:'x.....x.....',S:'x.xX.xx.xX.x'},{dyn:true})]},
{id:'4.5.09',t:'12/8 blues grooves & fills',bpm:[50,80],d:'Slow blues in 12/8: every 8th note on the hats or ride, backbeat on 2 and 4. Fills in triplets.',
 ex:[X('12/8 hats',3,{HH:rep('xxx',4),K:'x.....x.....',S:'...x.....x..'},{steps:12,meter:'12/8'}),
     X('Ride + foot',3,{R:rep('xxx',4),HP:'...x.....x..',K:'x.....x.....',S:'...x.....x..'},{steps:12,meter:'12/8'}),
     X('Kick pick-up',3,{HH:rep('xxx',4),K:'x.....x....x',S:'...x.....x..'},{steps:12,meter:'12/8'}),
     X('12/8 fill',3,{C:'x...........'+'............',HH:'.xxxxxxxxxxx'+'xxxxxx......',K:'x.....x.....'+'x.....x.....',S:'...x.....x..'+'...x..xxx...',T1:'............'+'.........xx.',T3:'............'+'...........x'},{steps:12,bars:2,meter:'12/8'})]},

/* ---- 4.7 Time / Ears ---- */
{id:'4.7.01',t:'Time feel 103',bpm:[70,100],d:'The click plays only on beat 1. You hold beats 2, 3 and 4 yourself.',
 ex:[X('8th beat, click on 1',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},{click:'1'}),
     X('Half-time, click on 1',4,{HH:rep('x.',8),K:'x.........x.....',S:'........x.......'},{click:'1'}),
     X('Shuffle, click on 1',3,SH,{click:'1'})]},
{id:'4.7.02',t:'12-bar blues form',bpm:[50,80],d:'Twelve bars: I I I I · IV IV I I · V IV I V. The practice screen shows each bar’s chord. Crash at the top of the form, fill in bar 12.',
 ex:[X('12/8 slow blues',3,seq(12,Array.from({length:12},(_,i)=>i===0?{C:'x...........',HH:'.xxxxxxxxxxx',K:'x.....x.....',S:'...x.....x..'}
        :i===11?{HH:'xxxxxx......',K:'x.....x.....',S:'...x..xxx...',T1:'.........xx.',T3:'...........x'}:{HH:rep('xxx',4),K:'x.....x.....',S:'...x.....x..'})),
       {steps:12,bars:12,meter:'12/8',labels:['I','I','I','I','IV','IV','I','I','V','IV','I','V · fill']}),
     X('Shuffle blues',3,seq(12,Array.from({length:12},(_,i)=>i===0?{C:'x...........',HH:'..x..xx.xx.x',K:'x.....x.....',S:'...x.....x..'}
        :i===11?{HH:'x.xx.x......',K:'x.....x.....',S:'...x..x.xx.x'}:SH)),
       {bars:12,labels:['I','I','I','I','IV','IV','I','I','V','IV','I','V · fill']})]},
{id:'4.7.03',t:'Comping in swing',bpm:[80,120],d:'Keep the ride and foot steady while the snare and kick answer with short accents (“comping”).',
 ex:[X('Snare on the “&” of 2',2,{R:rep('x.xxx.xx',2),HP:rep('..x...x.',2),S:'...x....'+'........'},{bars:2,swing:0.67}),
     X('Charleston',2,{R:rep('x.xxx.xx',2),HP:rep('..x...x.',2),S:'x..x....'+'x..x....'},{bars:2,swing:0.67}),
     X('Snare & kick answers',2,{R:rep('x.xxx.xx',2),HP:rep('..x...x.',2),S:'...x....'+'.....x..',K:'......x.'+'x.......'},{bars:2,swing:0.67}),
     X('Two-bar comp',2,{R:rep('x.xxx.xx',2),HP:rep('..x...x.',2),S:'.x.....x'+'...x....',K:'....x...'+'......x.'},{bars:2,swing:0.67})]},

/* ---- 4.8 Songs ---- */
{id:'4.8.01',t:'Song checkpoints',type:'song',d:'Pick songs tagged with Level 4 lessons (ballad, 6/8, blues shuffle, swing) in Songs and play along to your own audio.'}
);
})();
