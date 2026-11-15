/* DrumPath Theory — Tier B · Part B7: Harmony and function (thread H). Own words. Card ids are permanent once shipped. */
'use strict';
var DP_THEORY=window.DP_THEORY=window.DP_THEORY||[];
const B7_G=TX('Groove',2,{HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'});
DP_THEORY.push({id:'B7',tier:'B',th:'H',t:'Harmony and function',d:'How chords work together: the seven chords of a key, Roman numerals, home / away / tension, the progressions behind most songs, how phrases end (cadences), and the 12-bar blues in depth.',ch:[
{id:'B7.01',t:'Chords in a key',cards:[
 {id:'B7.01.1',t:'A chord on every note',idea:'Build a triad on each note of the major scale, using only the scale’s notes, and you get the seven chords of the key. In C: C Dm Em F G Am B°.',
  dg:{type:'chart',bars:[['C'],['Dm'],['Em'],['F'],['G'],['Am'],['B°']],per:7,rn:['I','ii','iii','IV','V','vi','vii°']},
  hear:{l:'▶ The seven chords of C',seq:[[60,64,67],[62,65,69],[64,67,71],[65,69,72],[67,71,74],[69,72,76],[71,74,77]],bpm:90,voice:'pad'},
  rem:'Major key chords: I ii iii IV V vi vii°.',
  more:['The pattern of major (I IV V), minor (ii iii vi) and one diminished (vii°) is the same in every major key.'],
  check:[{q:'In a major key, which chords are major?',a:['I, IV and V','ii, iii and vi','all of them'],c:0,why:'Only I, IV and V are major triads.'}]},
 {id:'B7.01.2',t:'Roman numerals',idea:'Numbering chords by their scale note lets one idea work in every key: I–IV–V is C–F–G in C, and G–C–D in G. Upper case = major, lower case = minor.',
  dg:{type:'chart',bars:[['G'],['C'],['D'],['Em']],rn:['I','IV','V','vi']},hear:{l:'▶ I IV V vi in G',chords:['G','C','D','Em'],beats:4,bpm:90},
  rem:'Roman numerals = chords as numbers. Capitals major, small minor.',
  more:['Backline shows Roman numerals on its chord charts, so you can spot the same progression in different songs and keys.'],
  check:[{q:'In the key of G, the V chord is…',a:['D','C','A'],c:0,why:'G A B C D: the 5th note is D.'}]}
]},
{id:'B7.02',t:'Home, away and tension',cards:[
 {id:'B7.02.1',t:'Three jobs for chords',idea:'Chords do three jobs: tonic (home and rest: I, vi), subdominant (moving away: IV, ii) and dominant (tension that wants to go home: V, vii°).',
  dg:{type:'ladder',items:['home: I vi','away: IV ii','tension: V vii°'],note:'chord function'},
  rem:'Tonic = home. Subdominant = away. Dominant = tension → home.',
  more:['Drummers feel this as energy: the band often builds into the V chord and lands on I, which is a natural spot for a crash.'],
  check:[{q:'Which chord creates the most tension towards home?',a:['V','IV','I'],c:0,why:'The dominant wants to resolve to I.'}]},
 {id:'B7.02.2',t:'Tension and release (ear)',idea:'Listen to V going to I: the first chord leans, the second lands. Stop on the V and the music sounds unfinished.',
  dg:{type:'chart',bars:[['G'],['C']],rn:['V','I']},ear:true,hear:[{l:'▶ V → I',chords:['G','C'],beats:4,bpm:80},{l:'▶ Stop on V',chords:['C','G'],beats:4,bpm:80}],
  rem:'V → I = tension, then release.',
  more:['This pull is the engine of most Western harmony, from hymns to pop.'],
  check:[{q:'Does this end at home or leave you hanging?',hear:{chords:['C','F','G'],beats:4,bpm:90},a:['Leaves you hanging','Ends at home'],c:0,why:'It stops on the V chord.'}]}
]},
{id:'B7.03',t:'Common progressions',cards:[
 {id:'B7.03.1',t:'I – IV – V',idea:'Three chords, home → away → tension, then home again. Rock and roll, country and folk are built on it.',
  dg:{type:'chart',bars:[['A'],['D'],['E'],['A']],rn:['I','IV','V','I']},hear:{l:'▶ I IV V I in A',chords:['A','D','E','A'],beats:4,bpm:110,ex:B7_G},
  rem:'I–IV–V–I: the three-chord song.',
  more:['When a band says “it’s just a 1-4-5 in A”, this is what they mean: A, D and E.'],
  check:[{q:'In A major, I–IV–V is…',a:['A–D–E','A–C–E','A–B–C'],c:0,why:'A B C♯ D E: 1, 4 and 5.'}]},
 {id:'B7.03.2',t:'I – V – vi – IV',idea:'The four-chord loop you met in Tier A, now with names: home, tension, the minor relative, away. Huge numbers of pop songs loop it.',
  dg:{type:'chart',bars:[['C'],['G'],['Am'],['F']],rn:['I','V','vi','IV']},hear:{l:'▶ I V vi IV',chords:['C','G','Am','F'],beats:4,bpm:96,ex:B7_G},
  rem:'I–V–vi–IV: the pop loop.',
  more:['Start the same loop on vi (vi–IV–I–V) and it sounds more serious, though it’s the same four chords.'],
  check:[{q:'In I–V–vi–IV, the minor chord is…',a:['vi','V','IV'],c:0,why:'Lower case = minor.'}]},
 {id:'B7.03.3',t:'ii – V – I',idea:'Away, tension, home: the strongest way to land. It’s the backbone of jazz standards and shows up at the ends of many pop phrases.',
  dg:{type:'chart',bars:[['Dm'],['G'],['C'],['C']],rn:['ii','V','I','I']},hear:{l:'▶ ii V I',chords:['Dm','G','C','C'],beats:4,bpm:90},
  rem:'ii–V–I: the jazz landing.',links:{lessons:['4.7.03']},
  more:['In jazz the chords are usually 7th chords: Dm7–G7–Cmaj7 (next part).'],
  check:[{q:'ii–V–I in C is…',a:['Dm–G–C','D–G–C','Dm–Gm–C'],c:0,why:'ii is minor, V and I major.'}]},
 {id:'B7.03.4',t:'vi – IV – I – V',idea:'The same chords as the pop loop, started on the minor chord. It sounds more emotional and is common in modern pop and film music.',
  dg:{type:'chart',bars:[['Am'],['F'],['C'],['G']],rn:['vi','IV','I','V']},hear:{l:'▶ vi IV I V',chords:['Am','F','C','G'],beats:4,bpm:90,ex:B7_G},
  rem:'vi–IV–I–V: the pop loop, started on the minor chord.',
  more:['Where a loop starts changes what feels like home: here the ear treats A minor as the start.'],
  check:[{q:'vi–IV–I–V uses the same chords as…',a:['I–V–vi–IV','I–IV–V','ii–V–I'],c:0,why:'Same four chords, different start.'}]}
]},
{id:'B7.04',t:'Cadences: how phrases end',cards:[
 {id:'B7.04.1',t:'Full stop: V → I',idea:'An authentic cadence (V to I) ends a phrase completely, like a full stop. Songs often finish this way.',
  dg:{type:'chart',bars:[['G'],['C']],rn:['V','I']},hear:{chords:['F','G','C'],beats:4,bpm:80},
  rem:'Authentic cadence V → I = full stop.',links:{lessons:['1.6.04']},
  more:['A good place for a big ending: fill into the V, crash and hold on the I.'],
  check:[{q:'The authentic cadence goes…',a:['V → I','IV → I','I → V'],c:0,why:'Dominant to tonic.'}]},
 {id:'B7.04.2',t:'Amen: IV → I',idea:'A plagal cadence (IV to I) is a softer ending, the “a-men” at the end of a hymn.',
  dg:{type:'chart',bars:[['F'],['C']],rn:['IV','I']},hear:{chords:['C','F','C'],beats:4,bpm:72},
  rem:'Plagal cadence IV → I = the gentle “amen”.',
  more:['Rock uses it a lot too, often as a big final IV → I after the last chorus.'],
  check:[{q:'The plagal cadence goes…',a:['IV → I','V → I','I → IV'],c:0,why:'Subdominant to tonic.'}]},
 {id:'B7.04.3',t:'Comma and surprise',idea:'A half cadence stops on V, like a comma: more is coming. A deceptive cadence goes V → vi: you expect home and get the minor relative instead.',
  dg:{type:'chart',bars:[['G'],['Am']],rn:['V','vi']},hear:[{l:'▶ Half (stop on V)',chords:['C','F','G'],beats:4,bpm:80},{l:'▶ Deceptive (V → vi)',chords:['F','G','Am'],beats:4,bpm:80}],
  rem:'Half cadence = ends on V (comma). Deceptive = V → vi (surprise).',
  more:['Pre-choruses often end on a half cadence: the band holds the V, the drums build, and the chorus lands on I.'],
  check:[{q:'V → vi is called…',a:['a deceptive cadence','a plagal cadence','a full stop'],c:0,why:'It avoids the expected I.'}]}
]},
{id:'B7.05',t:'The 12-bar blues in depth',cards:[
 {id:'B7.05.1',t:'Three chords, twelve bars',idea:'The 12-bar blues uses I, IV and V: four bars of I, two of IV, two of I, then V, IV, I, I. Every part of the form is home, away or tension.',
  dg:{type:'chart',bars:[['A'],['A'],['A'],['A'],['D'],['D'],['A'],['A'],['E'],['D'],['A'],['A']],rn:['I','I','I','I','IV','IV','I','I','V','IV','I','I']},
  hear:{l:'▶ 12-bar in A',chords:['A','A','A','A','D','D','A','A','E','D','A','A'],beats:4,bpm:120},
  rem:'12-bar: I I I I · IV IV I I · V IV I I.',links:{lessons:['4.7.02']},
  more:['Count the bars in threes of four: the first line sets up, the second answers, the third resolves.'],
  check:[{q:'In a 12-bar blues, bar 9 is usually…',a:['V','IV','I'],c:0,why:'The third line starts on the V.'}]},
 {id:'B7.05.2',t:'Quick change and turnaround',idea:'Two common twists: the quick change (IV in bar 2), and the turnaround (V in the last bar), which sends the band back to the top.',
  dg:{type:'chart',bars:[['A'],['D'],['A'],['A'],['D'],['D'],['A'],['A'],['E'],['D'],['A'],['E']],rn:['I','IV','I','I','IV','IV','I','I','V','IV','I','V']},
  hear:{l:'▶ Quick change + turnaround',chords:['A','D','A','A','D','D','A','A','E','D','A','E'],beats:4,bpm:120},
  rem:'Quick change = IV in bar 2. Turnaround = V in bar 12.',links:{lessons:['4.7.02','4.5.08']},
  more:['A drum fill in bar 12 marks the turnaround; on the last time round the band plays I instead and ends.'],
  check:[{q:'A turnaround in bar 12 uses which chord?',a:['V','IV','vi'],c:0,why:'The V sends the form back to the top.'}]}
]}
]});
