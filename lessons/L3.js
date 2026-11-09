/* DrumPath lessons: Level 3 — The motions of drumming
   Pattern chars: x normal · X accent · g ghost · o open hi-hat · r rim/cross-stick · f flam · d drag · . rest */
(function(){
// one-bar beat + one-bar fill, fill notes written with a given char per step (e.g. 'f' flams, 'X' accents)
function fill2(sub,base,fill,name,o){
  const n=4*sub, out={};
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
const B8x=B8, B16hat={HH:rep('x.',8),K:'x.......x.......'};

DP_LESSONS.push(
/* ---- 3.1 Theory / Reading ---- */
{id:'3.1.01',t:'Whole & half notes',bpm:[70,100],d:'Long notes: a whole note lasts the full bar (4 beats), a half note lasts 2 beats. Play only on the note and count through the rest out loud.',
 ex:[X('Whole notes',1,{S:'x...'}),X('Half notes',1,{S:'x.x.'}),X('Whole + halves',1,{S:'x...x.x.'},{bars:2}),X('Halves + quarters',1,{S:'x.x.xxxx'},{bars:2})]},
{id:'3.1.02',t:'8th-note triplets',bpm:[60,90],d:'Three even notes per beat: count “1-trip-let, 2-trip-let…”. Turn the sub-click on to hear the triplet grid.',
 ex:[X('Full triplets',3,{S:rep('xxx',4)},{st:rep('RLRLRL',2)}),X('1st + 3rd partial',3,{S:rep('x.x',4)},{st:rep('R.L',4)}),X('1st + 2nd partial',3,{S:rep('xx.',4)},{st:rep('RL.',4)}),
     X('8ths ↔ triplets',6,{S:rep('x..x..',4)+rep('x.x.x.',4)},{bars:2})]},
{id:'3.1.03',t:'16th-note triplets',bpm:[50,75],d:'Six even notes per beat (“1-la-li-&-la-li”). Keep them relaxed and low.',
 ex:[X('Full sextuplets',6,{S:rep('xxxxxx',4)},{st:rep('RLRLRL',4)}),X('Burst + rest',6,{S:'xxxxxx'+'x.....'+'xxxxxx'+'x.....'}),X('Triplets ↔ sextuplets',6,{S:rep('x.x.x.'+'xxxxxx',2)})]},
{id:'3.1.04',t:'Dynamics & articulation',type:'info',d:'How drum music shows volume and touch. Accent (>) = louder. Ghost note (in brackets) = very soft. Flam = one small grace note just before the main note. Drag = two grace notes. Hairpins: < gets louder (crescendo), > gets softer (decrescendo). Hi-hat: o = open, + = closed.',
 check:['I can spot accents and ghost notes in notation','I know the difference between a flam and a drag','I know what o and + mean over the hi-hat'],
 quiz:[{q:'A note in brackets, e.g. (x), means…',a:['Play it loud','Play it very soft (ghost)','Skip it'],c:1,why:'Brackets mark a ghost note: as soft as you can while still sounding.'},
       {q:'A flam has how many grace notes?',a:['One','Two','Three'],c:0,why:'Flam = one grace note; drag = two.'},
       {q:'“o” written above a hi-hat note means…',a:['Closed','Open','Accent'],c:1,why:'o = open hi-hat; + = closed.'},
       {q:'A hairpin opening to the right ( < ) means…',a:['Get louder','Get softer','Slow down'],c:0,why:'Crescendo: gradually louder.'}]},
{id:'3.1.05',t:'Repeats',type:'info',d:'Repeat signs (a thick + thin bar line with two dots) mean play the section again. 1st and 2nd endings: play the 1st ending the first time, then skip it and play the 2nd ending on the repeat. “Play 4×” means play that bar or section four times in total.',
 check:['I can follow a repeat sign','I can read 1st and 2nd endings'],
 quiz:[{q:'With 1st and 2nd endings, the second time through you…',a:['Play both endings','Skip the 1st ending and play the 2nd','Stop at the 1st ending'],c:1,why:'The 1st ending is only for the first pass.'},
       {q:'“4×” over a one-bar repeat means it is played…',a:['4 times in total','4 extra times (5 in total)','Once, 4 times louder'],c:0,why:'The number is the total count.'}]},

/* ---- 3.2 Technique ---- */
{id:'3.2.01',t:'The four strokes',bpm:[60,90],d:'Full stroke: high to high (loud, rebounds). Down stroke: high to low (loud, stop the stick near the head). Tap: low to low (soft). Up stroke: low to high (soft, lift for the next accent). Accents are scored against your own normal notes.',
 ex:[X('Right hand',2,{S:'XxxxXxxx'},{st:rep('R',8),dyn:true}),X('Left hand',2,{S:'XxxxXxxx'},{st:rep('L',8),dyn:true}),X('Alternating 16ths',4,{S:rep('Xxxx',4)},{st:rep('RLRL',4),dyn:true})]},
{id:'3.2.02',t:'Accents in 8ths & 16ths',bpm:[60,100],d:'Move one accent through each position. Keep the unaccented notes low and even.',
 ex:[...['XxxxXxxx','xXxxxXxx','xxXxxxXx','xxxXxxxX'].map((s,i)=>X('8ths · accent '+(i+1),2,{S:s},{st:'RLRLRLRL',dyn:true})),
     ...['Xxxx','xXxx','xxXx','xxxX'].map((s,i)=>X('16ths · accent '+(i+1),4,{S:rep(s,4)},{st:rep('RLRL',4),dyn:true}))]},
{id:'3.2.03',t:'Developing doubles',bpm:[60,100],d:'Two strokes per hand, the second as loud as the first. Scored on evenness: the second stroke must be within 20% of the first.',
 ex:[X('8th doubles',2,{S:rep('x',8)},{st:'RRLLRRLL',dyn:'even'}),X('16th doubles',4,{S:rep('x',16)},{st:rep('RRLL',4),dyn:'even'}),X('Accent the first',4,{S:rep('Xx',8)},{st:rep('RRLL',4),dyn:true})]},
{id:'3.2.04',t:'Cross-stick & rim',bpm:[70,100],d:'Cross-stick: lay the left stick across the snare and click it on the rim. On the Nitro, play the snare’s rim zone. The app checks head vs rim.',
 ex:[X('Rim on 2 & 4',2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'}),X('Head on 2, rim on 4',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...r.'}),X('Rim on 4 only',2,{HH:'xxxxxxxx',K:'x...x...',S:'......r.'})]},
{id:'3.2.05',t:'Hi-hat openings',bpm:[60,100],d:'Open the hi-hat (lift the foot) on the “&”, and close it with the foot exactly on the next beat. Rings = open notes.',
 ex:[X('Open on 4&',2,{HH:'xxxxxxxo',HP:'x.......',K:'x...x...',S:'..x...x.'}),X('Open on 2& and 4&',2,{HH:'xxxoxxxo',HP:'x...x...',K:'x...x...',S:'..x...x.'}),X('Every “&”',2,{HH:'xoxoxoxo',HP:'x.x.x.x.',K:'x...x...',S:'..x...x.'})]},
{id:'3.2.06',t:'Hi-hat barks',bpm:[60,90],d:'A short, sharp open note that the foot closes a 16th later.',
 ex:[X('Bark on 4&',4,{HH:'x.x.x.x.x.x.x.o.',HP:'...............x',K:'x.......x.......',S:'....x.......x...'}),X('Barks on 2& and 4&',4,{HH:'x.x.x.o.x.x.x.o.',HP:'.......x.......x',K:'x.......x.......',S:'....x.......x...'})]},
{id:'3.2.07',t:'Ghost notes intro',bpm:[60,90],d:'Loud backbeat, ghost notes as soft as possible. Ghosts are scored against your accents.',
 ex:[...['....X..g....X..g','..g.X.....g.X...','....X....g..X..g'].map((s,i)=>X('Ghosts '+(i+1),4,Object.assign({},B16hat,{S:s})))]},

/* ---- 3.3 Rudiments (PAS) ---- */
{id:'3.3.01',t:'Five-stroke roll',bpm:[60,100],d:'Two doubles and an accent: R R L L R. Practise open (slow) → closed (fast) → open.',
 ex:[X('Open (16ths)',4,{S:'xxxxX...xxxxX...'},{st:'RRLLR...LLRRL...',dyn:true}),X('Closed (32nds)',8,{S:rep('....xxxxX.......',2)},{st:'....RRLLR.......'+'....LLRRL.......',dyn:true})]},
{id:'3.3.02',t:'Five-stroke: applications',bpm:[60,100],d:'One bar of beat, then a bar with five-stroke rolls on beats 3 and 4, landing on the crash.',
 ex:[X('Beat + five-strokes',8,{
   C:at(64,{0:'x'}),
   HH:at(64,{4:'x',8:'x',12:'x',16:'x',20:'x',24:'x',28:'x',32:'x',36:'x',40:'x',44:'x'}),
   K:at(64,{0:'x',16:'x',32:'x'}),
   S:at(64,{8:'x',24:'x',40:'x',48:'x',49:'x',50:'x',51:'x',52:'X',56:'x',57:'x',58:'x',59:'x',60:'X'})},
  {bars:2,st:at(64,{48:'R',49:'R',50:'L',51:'L',52:'R',56:'L',57:'L',58:'R',59:'R',60:'L'})})]},
{id:'3.3.03',t:'Double paradiddle',bpm:[60,100],d:'R L R L R R  L R L R L L. Six notes per group; accent the first of each.',
 ex:[X('Triplets',3,{S:rep('Xxxxxx',2)},{st:'RLRLRRLRLRLL',dyn:true}),X('16th triplets',6,{S:rep('Xxxxxx',4)},{st:rep('RLRLRRLRLRLL',2),dyn:true})]},
{id:'3.3.04',t:'Double paradiddle: applications',bpm:[60,100],d:'Double-paradiddle fill: the accented notes move round the toms (Tom 1, Tom 1, Tom 2, Tom 3), the rest stay on the snare, then crash on 1.',
 ex:[X('Tom accents fill',6,{
   C:at(48,{0:'x'}),HH:at(48,{3:'x',6:'x',9:'x',12:'x',15:'x',18:'x',21:'x'}),K:at(48,{0:'x',12:'x'}),
   S:at(24,{6:'x',18:'x'})+rep('.xxxxx',4),T1:rep('.',24)+'X.....X.....'+rep('.',12),T2:rep('.',36)+'X.....'+rep('.',6),T3:rep('.',42)+'X.....'},
  {bars:2,st:rep('.',24)+rep('RLRLRRLRLRLL',2)})]},
{id:'3.3.05',t:'Triple paradiddle',bpm:[60,100],d:'R L R L R L R R  L R L R L R L L. Accent the first of each group of eight.',
 ex:[X('16ths',4,{S:rep('Xxxxxxxx',2)},{st:'RLRLRLRRLRLRLRLL',dyn:true})]},
{id:'3.3.06',t:'Triple paradiddle: applications',bpm:[60,100],d:'Right-hand notes on the hi-hat, left-hand notes on the snare, kick on 1 and 3.',
 ex:[X('Groove',4,{HH:'x.x.x.xx.x.x.x..',S:'.x.x.x..x.x.x.xx',K:'x.......x.......'},{st:'RLRLRLRRLRLRLRLL'})]},
{id:'3.3.07',t:'Flam',bpm:[60,100],d:'A soft grace note just before a loud main note, from the other hand. The sticking shows the main hand. Grace notes are checked: present, before the main note, and softer.',
 ex:[X('Quarter flams',1,{S:'ffff'},{st:'RLRL'}),X('8th flams',2,{S:'ffffffff'},{st:'RLRLRLRL'})]},
{id:'3.3.08',t:'Flam: applications',bpm:[60,100],d:'Flams on the backbeat, then an 8th-note flam fill around the kit.',
 ex:[X('Flam backbeat',2,{HH:'xxxxxxxx',K:'x...x...',S:'..f...f.'}),fill2(2,B8x,['S:f','S:f','T1:f','T1:f','T2:f','T2:f','T3:f','T3:f'],'Flam fill → crash')]},
{id:'3.3.09',t:'Drag (ruff)',bpm:[60,90],d:'Two quick soft grace notes from one hand, then the main note from the other.',
 ex:[X('Quarter drags',1,{S:'dddd'},{st:'RLRL'}),X('Drags on 8ths',2,{S:'d.d.d.d.'},{st:'R.L.R.L.'})]},
{id:'3.3.10',t:'Drag: applications',bpm:[60,90],d:'Drags on the backbeat, then a drag fill on snare and toms.',
 ex:[X('Drag backbeat',2,{HH:'xxxxxxxx',K:'x...x...',S:'..d...d.'}),fill2(2,B8x,['S:d','','T1:d','','T2:d','','T3:d',''],'Drag fill → crash')]},

/* ---- 3.4 Independence ---- */
{id:'3.4.01',t:'Right-hand independence',bpm:[60,100],d:'Kick and snare stay fixed; the right hand changes.',
 ex:[X('Quarter hats',2,{HH:'x.x.x.x.',K:'x...x...',S:'..x...x.'}),X('8th hats',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'}),X('Off-beat hats',2,{HH:'.x.x.x.x',K:'x...x...',S:'..x...x.'}),X('Ride 8ths',2,{R:'xxxxxxxx',K:'x...x...',S:'..x...x.'})]},
{id:'3.4.02',t:'Left-hand independence',bpm:[60,100],d:'Hats and kick fixed; the left hand adds ghost notes around the backbeat.',
 ex:['....X.......X..g','....X..g.g..X...','..g.X..g..g.X..g'].map((s,i)=>X('Left hand '+(i+1),4,Object.assign({},B16hat,{S:s})))},
{id:'3.4.03',t:'Bass drum independence',bpm:[60,100],d:'16th-note kick placements under a fixed beat.',
 ex:['x.....x.x.......','x..x....x.....x.','x.x...x...x.....','x......xx.......'].map((k,i)=>X('Kick '+(i+1),4,{HH:rep('x.',8),S:'....x.......x...',K:k}))},
{id:'3.4.04',t:'Hi-hat foot independence',bpm:[60,90],d:'Right hand on the ride; the left foot plays different hi-hat pedal rhythms.',
 ex:[['x.x.x.x.','Foot on beats'],['.x.x.x.x','Foot on the “&”'],['..x...x.','Foot on 2 & 4']].map(([h,n])=>X(n,2,{R:'xxxxxxxx',K:'x...x...',S:'..x...x.',HP:h}))},
{id:'3.4.05',t:'Dynamic independence',bpm:[60,90],d:'One limb loud while another stays soft.',
 ex:[X('Accented hats',2,{HH:'XxXxXxXx',K:'x...x...',S:'..x...x.'}),X('Soft hats, loud snare',2,{HH:rep('g',8),K:'x...x...',S:'..X...X.'})]},
{id:'3.4.06',t:'Unisons',bpm:[60,100],d:'Crash and kick together, exactly at the same moment.',
 ex:[X('Crash + kick',2,{C:'x.....x.',HH:'.xxxxx.x',K:'x...x.x.',S:'..x...x.'})]},

/* ---- 3.5 Grooves / Styles ---- */
{id:'3.5.01',t:'Moving between cymbals',bpm:[70,110],d:'Same beat, the right hand moves: hi-hat, ride, hi-hat, then crash quarters.',
 ex:[X('Hats → ride → hats → crash',2,{HH:'xxxxxxxx'+rep('.',8)+'xxxxxxxx'+rep('.',8),R:rep('.',8)+'xxxxxxxx'+rep('.',16),C:rep('.',24)+'x.x.x.x.',K:rep('x...x...',4),S:rep('..x...x.',4)},{bars:4})]},
{id:'3.5.02',t:'Modern country beats',bpm:[80,120],d:'Country backbeat, often with a cross-stick.',
 ex:[X('Cross-stick country',2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'}),X('Quarter-hat country',2,{HH:'x.x.x.x.',K:'x...x...',S:'..x...x.'})]},
{id:'3.5.03',t:'Train beat',bpm:[70,110],d:'Snare 16ths with accents on 2 and 4, the rest soft: a steam train.',
 ex:[X('Train, accents',4,{K:'x.......x.......',S:'xxxxXxxxxxxxXxxx'},{st:rep('RLRL',4),dyn:true}),X('Train, ghosts',4,{K:'x.......x.......',S:'ggggXgggggggXggg'},{st:rep('RLRL',4),dyn:true})]},
{id:'3.5.04',t:'Two-step',bpm:[80,130],d:'Country two-step: kick on 1 and 3, snare on 2 and 4, then the “boom-chick” 8th version.',
 ex:[X('Two-step',2,{HH:'x.x.x.x.',K:'x...x...',S:'..x...x.'}),X('Boom-chick',2,{K:'x.x.x.x.',S:'.x.x.x.x'})]},
{id:'3.5.05',t:'Country shuffle',bpm:[70,110],d:'Triplet-based shuffle feel: play the 1st and 3rd note of each triplet.',
 ex:[X('Shuffle on hats',3,{HH:rep('x.x',4),K:'x.....x.....',S:'...x.....x..'}),X('Snare shuffle',3,{K:'x.....x.....',S:'x.xX.xx.xX.x'},{st:'R.LR.LR.LR.L'})]},
{id:'3.5.06',t:'Disco',bpm:[90,120],d:'Four on the floor, open hi-hat on every “&”, closed by the foot on the beat.',
 ex:[X('Disco',2,{HH:'xoxoxoxo',HP:'x.x.x.x.',K:'x.x.x.x.',S:'..x...x.'})]},

/* ---- 3.6 Fills / Rhythm ---- */
{id:'3.6.01',t:'Fills for each style',bpm:[80,110],d:'One fill per style. Suggested tempos: country ~80, train ~90, disco ~110.',
 ex:[fill2(2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'},['S','S','S:X','S','S','S','S:X','S'],'Country fill (~80)'),
     fill2(4,{K:'x.......x.......',S:'xxxxXxxxxxxxXxxx'},['S:g','S:g','S:g','S:g','S:g','S:g','S:g','S:g','S','S','S','S','S:X','S:X','S:X','S:X'],'Train build (~90)'),
     fill2(4,{HH:'x.x.x.x.x.x.x.x.',K:'x...x...x...x...',S:'....x.......x...'},['T1','T1','T1','T1','T2','T2','T2','T2','T3','T3','T3','T3','S','S','S','S'],'Disco tom fill (~110)')]},
{id:'3.6.02',t:'Syncopated accents',bpm:[70,110],d:'Crash and kick together on the “&” before the beat (a push).',
 ex:[X('Pushes on 2& and 4&',2,{C:'...x...x',HH:'xxx.xxx.',K:'x..xx..x',S:'..x...x.'}),X('Push at the end of bar 2',2,{C:rep('.',15)+'x',HH:'xxxxxxxx'+'xxxxxxx.',K:'x...x...'+'x...x..x',S:'..x...x.'+'..x...x.'},{bars:2})]},

/* ---- 3.7 Time / Ears ---- */
{id:'3.7.01',t:'Listen & copy 2',bpm:[70,100],call:true,d:'The app plays two bars; you copy them from memory. Now with accents and an open hi-hat.',
 ex:[X('Copy 1',2,{HH:'XxXxXxXx'+'xxxxxxxo',K:'x...x...'+'x...x...',S:'..x...x.'+'..x...x.'},{bars:2}),
     X('Copy 2',2,{HH:'xxxoxxxx'+'xxxoxxxx',K:'x..xx...'+'x..xx...',S:'..x...X.'+'..x...X.'},{bars:2}),
     X('Copy 3',2,{HH:'Xxxxxxxx'+'Xxxxxxxo',K:'x.x.x...'+'x.x.x..x',S:'..x...x.'+'..x...x.'},{bars:2}),
     X('Copy 4',2,{HH:'xxxxxxxx'+'xxxxx...',K:'x...x...'+'x...x...',S:'..x...x.'+'..x..XXX'},{bars:2})]},
{id:'3.7.02',t:'Time feel 102',bpm:[70,100],d:'The click plays only on beats 2 and 4. You hold beats 1 and 3 yourself.',
 ex:[X('8th beat, click on 2 & 4',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'},{click:'24'}),X('Country, click on 2 & 4',2,{HH:'xxxxxxxx',K:'x...x...',S:'..r...r.'},{click:'24'})]},
{id:'3.7.03',t:'Song roadmap',type:'info',d:'Before you play a song, map it: count the bars of the intro, each verse and chorus, and mark where the fills and crashes go. A one-line roadmap like “Intro 4 · V 8 · C 8 · fill · V 8 · C 8 · end” makes the song easy to follow.',
 check:['I wrote a roadmap for one song','I played along following my roadmap']},
/* ---- 3.8 Songs ---- */
{id:'3.8.01',t:'Song checkpoints',type:'song',d:'Pick songs tagged with Level 3 lessons (train beat, disco, country) in Songs and play along to your own audio.'}
);
})();
