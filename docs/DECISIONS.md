# DECISIONS — newest last

- 9 Nov 2026 · Web app (Web MIDI in Chrome on the Android tablet); hosted on GitHub Pages because Chrome blocks MIDI/local files from file:// and the Claude artifact frame.
- 9 Nov 2026 · Curriculum indexed `L.S.NN` (level, fixed strand numbers 1–8), ordered after the Drumeo Method, checked against Rockschool/Trinity grades; PAS 40 rudiments complete by Level 9. Every lesson unlocked.
- 9 Nov 2026 · Pass = ≥ 90% notes within ±30 ms, 3 runs in a row → +5 BPM; mastered at the goal tempo.
- 10 Nov 2026 · Dynamics judged relative to the player's own normal-note velocity in each run; score averages marked notes and normal notes so missed accents can't pass (deviation from the brief's plain ratio).
- 10 Nov 2026 · Open hi-hat / rim / flam scoring built before the kit check, with fallbacks (CC 4 pedal, Lenient graces). 2.3.05 accents stay unscored so Levels 0–2 score as before.
- 10 Nov 2026 · Redesign after Level 3: logbook-style structure (tokens, display/body/mono fonts, rail/bottom bar, back stack, drill-downs, crosstab), DrumPath's own green accent and pad colours; build directly, no mockups.
- 10 Nov 2026 · Charts are small hand-written SVG helpers (no d3); weeks run Sunday–Saturday everywhere.
- 10 Nov 2026 · Level 3 starter songs (Folsom Prison Blues, I Will Survive, Le Freak) not added until the owner confirms.
- 10 Nov 2026 · Songs: `curriculum/songs-catalog.md` + `build/songs-build-brief.md` replace the old song-library rules. 62 catalog songs ship (incl. the 3 held Level 3 songs). Readiness is weighted (core ×2, support ×1); skill = 60% tempo reached vs song BPM + 40% recent accuracy. Saved songs are matched to catalog ids by title/artist; their link/notes carry over. `SUGGEST` removed.
- 10 Nov 2026 · Stretch: after passing a lesson's goal, extra runs climb +5 BPM toward the fastest song using it. Stretch runs are logged (`stretch:1`) and count for song readiness but never change the lesson's status, tempo or streak.
