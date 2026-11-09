# DrumPath

Drum practice app for the Alesis Nitro kit (Web MIDI), with scored lessons, progress tracking and song tagging.
Live: https://aaditya-verma.github.io/drumpath/

## Files
- `index.html`: the app (styles, engine, views).
- `lessons/lib.js`: pattern helpers; `lessons/L0-2.js`, `lessons/L3.js`: lesson data.
- Progress is stored in the browser (`localStorage` key `drumpath.v1`). Use **Kit & Settings → Export backup**.

## Pattern format
`X(name, sub, lanes, opts)`. Lanes: `C R HH T1 T2 S T3 K HP`. One char per step:
`x` normal · `X` accent · `g` ghost · `o` open hi-hat · `r` rim / cross-stick · `f` flam · `d` drag · `.` rest.
Options: `bars`, `st` (sticking, one letter per step), `steps` (steps per bar, default 4×sub), `clicks` (click steps),
`click` (`all` / `24` / `1`), `swing` (0.5 straight … 0.67 triplet), `dyn` (`true`, `'even'` for doubles, `false` to switch off).

## Scoring
- Timing: a note is on time within ±30 ms (Settings), and with the right sound (open/closed hi-hat, head/rim).
- Dynamics (accent/ghost exercises): judged against the player's own normal-note velocity in each run. Score = average of
  "accents & ghosts right" and "normal notes right". Doubles (`dyn:'even'`): 2nd stroke within 20% of the 1st.
  Flams/drags: grace present, 12–90 ms before the main note, and ≤ 80% of its velocity.
- Pass: timing ≥ 90% and dynamics ≥ 80%, 3 runs in a row → +5 BPM.

## Kit checks (Nitro) — status
Not run yet (10 Nov 2026). Defaults until then:
- Hi-hat: note 46/26 = open, 42/22 = closed. If the kit never sends an open note, open/closed comes from the pedal (CC 4):
  ≤ 40 counts as open (Settings: source, threshold and direction).
- Snare: 38 = head, 40/37 = rim.
- Flams/drags: scored; if no grace notes arrive, the result screen says so — switch **Grace notes → Lenient** in Settings.
Run **Kit & Settings → Kit check**, copy the log and record the results here.

## Testing
Open `?test=1`: lesson-data check on the Lessons page and a **Simulate** button on the practice screen
(jitter, wrong dynamics, wrong sound, no graces). Every Level 3 exercise passed perfect / wrong-dynamics / wrong-sound /
missing-grace simulations on 10 Nov 2026; Levels 0–2 still score 100% on perfect runs.
