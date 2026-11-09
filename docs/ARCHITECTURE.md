# DrumPath — architecture

Static site on GitHub Pages (repo `aaditya-verma/drumpath`, live at https://aaditya-verma.github.io/drumpath/).
No build step: `index.html` loads plain scripts in order; all share one global scope. Bump the `?v=` query on every
script/style tag when files change so tablets pick up the new version.

| File | Owns |
|---|---|
| `index.html` | Page shell: header (back, brand, kit chip, search, theme), rail, bottom bar, More sheet, practice overlay |
| `src/css/app.css` | Design tokens (light/dark), pad colours `--p-*`, fonts, all component styles |
| `lessons/lib.js` | Pattern helpers (`X`, `rep`, `withFill`, `B8`, `B8_16`), `DP_LESSONS` |
| `lessons/L0-2.js`, `lessons/L3.js` | Lesson data, one file per level band |
| `src/js/01-data.js` | Pads (`VOICES`, `LANES`), default MIDI map + articulations, levels, strands, `LATER` index |
| `src/js/02-state.js` | Saved state (`localStorage` `drumpath.v1`, Claude account sync when framed), helpers |
| `src/js/03-midi.js` | Web MIDI, articulation (open hi-hat / rim, CC 4 fallback), kit-check log, velocity check, test mode |
| `src/js/04-engine.js` | Audio click + synth, `buildRun` (meters, clicks, swing, graces), `hit` matching, scoring (`finish`), note-lane canvas |
| `src/js/05-shell.js` | Theme (`TH`), icons, navigation + back stack (`go`, `back`, `VP`), More sheet, sheets, search, `render` |
| `src/js/06-charts-agg.js` | SVG charts (bars, lines, ring, sparkline, hit strip), periods (weeks Sun–Sat), run/pad aggregation |
| `src/js/07-home.js` | Home (hero, stats, coach notes, recent runs), Practise (today's plan) |
| `src/js/08-lessons.js` | Skill map → level → strand → lesson (tempo ladder, by-pad table, exercises, runs) |
| `src/js/09-progress.js` | Progress: timeline drill-down, calendar, pads & limbs, records; run detail; pad trend sheet |
| `src/js/10-compare.js` | Compare: crosstab (rows × columns × measure × period), cell → runs → run detail |
| `lessons/songs.js` | `SONG_CATALOG`: 62 songs from `curriculum/songs-catalog.md` §5 (id, title, artist, genre, BPM, sure?, meter, core tags, support tags) |
| `src/js/11a-songs-model.js` | Song model: save-state fill/migration, per-skill score, stretch target, readiness, strand roll-up, next step, daily history, play log, library totals, biggest unlocks, `songTests()` |
| `src/js/11-songs.js` | Songs screens: library (All / genre / artist / level / Ready now, filters, sort), song page, tap tempo, add/edit, Song × Lesson matrix |
| `src/js/12-kit-settings.js` | Kit drawing (live lights, tap to learn), latency/velocity/kit check, Settings |
| `src/js/99-events.js` | Event delegation, dialogs, backup import/export, boot |

## Data per run (`state.sessions[]`)
`{ts, id, ex, bpm, score, on, n, ext, miss, avg, dyn?, dur, pads:{lane:[notes,on,missed,extra,avgOffset,dyn%]}, hits:[[laneIdx,offsetMs,vel],…]}`.
`hits` kept for the latest 600 runs. Runs before 10 Nov 2026 have no `pads`/`hits`.

## Testing
`?test=1` adds Simulate on the practice screen and a lesson-data check on Lessons. Headless checks used:
perfect / wrong-dynamics / wrong-sound / no-grace simulations for every Level 3 exercise; perfect runs for Levels 0–2;
screenshots of every view in light and dark at 1280×800, 800×1280 and 400×860.
