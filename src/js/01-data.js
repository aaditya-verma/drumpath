/* DrumPath — data: pads, levels, strands, later index, starter songs */
'use strict';
/* ============ DATA ============ */
const VOICES={
  C:{n:'Crash',c:'#f5c542'}, R:{n:'Ride',c:'#e8a33d'}, HH:{n:'Hi-hat',c:'#4fd1c5'},
  T1:{n:'Tom 1',c:'#b48cff'}, T2:{n:'Tom 2',c:'#9a7bff'}, S:{n:'Snare',c:'#ff6b8b'},
  T3:{n:'Tom 3',c:'#7f6bff'}, K:{n:'Kick',c:'#6aa8ff'}, HP:{n:'HH pedal',c:'#3fb6a8'}
};
const LANES=['C','R','HH','T1','T2','S','T3','K','HP'];
const LIMB={C:'Right hand',R:'Right hand',HH:'Hands',T1:'Hands',T2:'Hands',S:'Hands',T3:'Hands',K:'Right foot',HP:'Left foot'};
// Alesis Nitro defaults (General MIDI style). Calibrate in Kit to confirm.
const DEFAULT_ART={42:'closed',22:'closed',46:'open',26:'open',38:'head',40:'rim',37:'rim'};
const DEFAULT_MAP={36:'K',35:'K',38:'S',40:'S',37:'S',42:'HH',46:'HH',22:'HH',26:'HH',44:'HP',48:'T1',50:'T1',45:'T2',47:'T2',43:'T3',41:'T3',49:'C',57:'C',55:'C',51:'R',59:'R',53:'R'};
const LEVELS=['Setup','First beats & time','Reading, core rudiments & independence','The motions of drumming','Moeller & essential grooves','Rhythmic groupings & funk','Odd time & finger control','Foot technique & combinations','Texture, articulation & chart reading','Advanced styles & soloing','Go anywhere'];
const STRANDS={1:'Theory / Reading',2:'Technique',3:'Rudiments',4:'Independence',5:'Grooves / Styles',6:'Fills / Rhythm',7:'Time / Ears',8:'Songs'};

const LESSONS=DP_LESSONS;
LESSONS.forEach(l=>{l.type=l.type||'play'; l.lv=+l.id.split('.')[0]; l.sd=+l.id.split('.')[1]; if(l.bpm&&!l.step)l.step=5;});
const LBY=Object.fromEntries(LESSONS.map(l=>[l.id,l]));

const LATER=`3.1.01|Whole & half notes
3.1.02|8th-note triplets
3.1.03|16th-note triplets
3.1.04|Dynamics & articulation
3.1.05|Repeats
3.2.01|The four strokes
3.2.02|Accents in 8ths and 16ths
3.2.03|Developing doubles
3.2.04|Cross-sticking & rim
3.2.05|Hi-hat openings
3.2.06|Hi-hat barks
3.2.07|Ghost notes intro
3.3.01|Five-stroke roll
3.3.02|Five-stroke: applications
3.3.03|Double paradiddle
3.3.04|Double paradiddle: applications
3.3.05|Triple paradiddle
3.3.06|Triple paradiddle: applications
3.3.07|Flam
3.3.08|Flam: applications
3.3.09|Drag (ruff)
3.3.10|Drag: applications
3.4.01|Right-hand independence
3.4.02|Left-hand independence
3.4.03|Bass drum independence
3.4.04|Hi-hat foot independence
3.4.05|Dynamic independence
3.4.06|Unisons
3.5.01|Moving between cymbals
3.5.02|Modern country beats
3.5.03|Train beat
3.5.04|Two-step
3.5.05|Country shuffle
3.5.06|Disco beats
3.6.01|Fills for each style
3.6.02|Syncopated accents
3.7.01|Listen & copy 2
3.7.02|Time feel 102
3.7.03|Song roadmap
3.8.01|Song checkpoints
4.1.01|Quarter-note triplets
4.1.02|Dotted notes
4.1.03|Reading in 3/4
4.1.04|Reading in 6/8 vs 3/4
4.1.05|Reading in 12/8
4.2.01|Moeller method intro
4.2.02|2-, 3- and 4-stroke Moeller
4.2.03|Applying Moeller
4.2.04|Developing speed
4.2.05|Ghost notes 2
4.2.06|Bass drum doubles
4.2.07|Daily bass drum challenge
4.3.01|Single stroke four
4.3.02|Single stroke seven
4.3.03|Six-stroke roll
4.3.04|Seven-stroke roll
4.3.05|Nine-stroke roll
4.3.06|Single paradiddle-diddle
4.3.07|Rudiment applications
4.4.01|Coordination drills
4.4.02|RH / LH / kick / hi-hat foot
4.4.03|Dynamic independence 2
4.5.01|Half-time feel
4.5.02|Filling over the barline
4.5.03|Pushing the beat
4.5.04|Rock ballad grooves & fills
4.5.05|3/4 rock beats & fills
4.5.06|6/8 rock beats & fills
4.5.07|Swing pattern
4.5.08|Blues shuffles
4.5.09|12/8 blues grooves & fills
4.7.01|Time feel 103
4.7.02|12-bar blues form
4.7.03|Comping in swing
4.8.01|Song checkpoints
5.1.01|Dynamic & tempo markings
5.1.02|Pickups, ties, cut time, double time
5.1.03|Buzz notation
5.1.04|Switching time signatures
5.2.01|Moeller development
5.2.02|Developing your feet
5.2.03|Hi-hat splashes
5.2.04|Cymbal chokes (if your crash supports it)
5.2.05|Daily doubles challenge
5.3.01|Multiple bounce roll
5.3.02|Triple stroke roll
5.3.03|Flam accent
5.3.04|Flam tap
5.3.05|Swiss army triplet
5.3.06|Rudiment applications
5.4.01|Snare comping
5.4.02|Kick comping
5.4.03|Hi-hat foot comping
5.4.04|Ride comping
5.5.01|Funk beats & fills
5.5.02|Linear beats & fills
5.5.03|Motown beats & fills
5.5.04|Reggae beats & fills
5.5.05|Bossa nova
5.5.06|Half-time shuffle
5.6.01|4-, 6- and 3-note groupings
5.6.02|Combining groupings
5.6.03|Swing vs straight
5.6.04|Tension & release / endings
5.7.01|Musical phrasing
5.8.01|Song checkpoints
6.1.01|Odd time: quarter-note meters
6.1.02|Odd time: 8th-note meters
6.2.01|Finger control: singles
6.2.02|Daily paradiddle challenge
6.3.01|Ten-stroke roll
6.3.02|Flam paradiddle
6.3.03|Single dragadiddle
6.3.04|Rudiment applications
6.4.01|Independence in rock / bossa / swing / shuffle
6.5.01|5/4 and 5/8 rock beats & fills
6.5.02|7/4 and 7/8 rock beats & fills
6.5.03|Hip-hop & R&B beats & fills
6.5.04|Cha-cha-chá
6.5.05|Calypso & soca
6.5.06|3/4 jazz waltz
6.5.07|New Orleans second line
6.6.01|5- and 7-note groupings
6.7.01|Time awareness & trading 2s
6.8.01|Song checkpoints
7.2.01|Inverted doubles
7.2.02|Daily finger-control challenge
7.2.03|Heel-toe technique
7.2.04|Slide technique
7.2.05|Single-pedal speed
7.3.01|Eleven-stroke roll
7.3.02|Single ratamacue
7.3.03|Herta (optional, non-PAS)
7.3.04|Rudiment applications
7.4.01|Independence: swing 4/4 & 3/4
7.4.02|Independence: rock
7.5.01|Punk rock beats & fills
7.5.02|Metal beats (single pedal)
7.6.01|Hand-foot combinations
7.6.02|Triplet hand-foot combos
7.6.03|Playing shots
7.7.01|Time vs time feel / trading 4s
7.8.01|Song checkpoints
8.1.01|Navigation markings
8.1.02|Chart reading challenge
8.1.03|Lead sheets & song forms
8.2.01|Technique check-in
8.3.01|Flamacue
8.3.02|Single flammed mill
8.3.03|Double ratamacue
8.3.04|Flam paradiddle-diddle
8.3.05|Pataflafla
8.3.06|Lesson 25
8.3.07|Triple ratamacue
8.3.08|Rudiment applications
8.4.01|Interpreting stickings
8.4.02|Interpreting rhythms & layering
8.5.01|Samba
8.5.02|The clave
8.5.03|Mozambique
8.7.01|Trading 8s & subdivision awareness
8.8.01|Song checkpoints
9.2.01|Technique check-in
9.3.01|Single drag tap
9.3.02|Double drag tap
9.3.03|Inverted flam tap
9.3.04|Flam drag
9.3.05|Drag paradiddle #1
9.3.06|Drag paradiddle #2
9.3.07|Thirteen-stroke roll
9.3.08|Fifteen-stroke roll
9.3.09|Seventeen-stroke roll
9.3.10|Rudiment applications
9.4.01|Swing / samba / tumbao: interpreting
9.5.01|Mambo, songo, ñañigo
9.6.01|Intro to soloing
9.6.02|Soloing over a vamp
9.7.01|Background vs foreground drumming
9.8.01|Song checkpoints
10.1.01|Odd time: 16th-note meters
10.1.02|Half-note triplets, quintuplets, septuplets
10.4.01|Melodic ostinatos
10.5.01|Advanced odd-time beats
10.5.02|Quintuplet & septuplet grooves/fills
10.5.03|Advanced Afro-Cuban & Latin jazz
10.5.04|Up-tempo swing
10.6.01|Polyrhythms 3:2, 4:3, 5:4
10.6.02|Polyrhythmic beats & fills
10.6.03|Polymeters
10.6.04|Metric modulation
10.6.05|Soloing over an ostinato / open solo / trading
10.8.01|Song checkpoints`.split('\n').map(s=>{const[id,t]=s.split('|');return{id,t,lv:+id.split('.')[0],sd:+id.split('.')[1],later:true};}).filter(l=>!LBY[l.id]);

const SUGGEST=[
 {title:'We Will Rock You',artist:'Queen',bpm:81,tags:['1.2.03','1.5.02'],notes:'Stomp-stomp-clap idea: kick, kick, snare.'},
 {title:'Seven Nation Army',artist:'The White Stripes',bpm:124,tags:['1.2.02','1.5.01'],notes:'Steady quarter-note pulse.'},
 {title:'Another One Bites the Dust',artist:'Queen',bpm:110,tags:['1.5.02','1.5.03'],notes:'Four-on-the-floor kick, snare on 2 & 4.'},
 {title:'Billie Jean',artist:'Michael Jackson',bpm:117,tags:['1.5.03','2.4.03'],notes:'Steady 8th hi-hat, kick 1 & 3, snare 2 & 4.'},
 {title:'Back in Black',artist:'AC/DC',bpm:94,tags:['1.5.03','2.5.01','1.6.04'],notes:'8th-note rock beat with clear start/stop hits.'},
 {title:'Highway to Hell',artist:'AC/DC',bpm:116,tags:['1.5.03','2.5.01','1.6.01'],notes:'8th-note rock beat with simple fills.'},
 {title:'Smells Like Teen Spirit',artist:'Nirvana',bpm:117,tags:['2.5.01','2.6.02','1.6.03'],notes:'Harder: 16th-note tom fills.'}
];

