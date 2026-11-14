# DrumPath

Drum practice app for the Alesis Nitro kit (Web MIDI), with scored lessons, progress tracking and a 62-song play-along library with readiness scores and a Song × Lesson matrix.
Live: https://aaditya-verma.github.io/drumpath/

## Files
See `docs/ARCHITECTURE.md` for the file map; `docs/DECISIONS.md` and `docs/RULES.md` for decisions and rules.
- `index.html` + `src/css/app.css` + `src/js/*.js`: the app.
- `lessons/lib.js`: pattern helpers; `lessons/L0-2.js`, `L3.js`, `L4.js`: lesson data; `theory/*.js`: theory course content.
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
**Level 4** (11 Nov 2026, `lessons/L4.js`, 35 lessons / 114 exercises): every exercise simulated at its goal tempo — perfect and
±15 ms jitter score 100%, wrong dynamics fail the dynamics column, wrong sound fails; Levels 0–3 re-simulated with identical
scores. New engine pieces: per-note match window from Level 4 (half the gap to the lane's neighbouring note), `meter` and
`labels` shown on the practice screen, and **routine mode** (`routine:{min:10}`, 4.2.07) — see `build/pattern-spec.md`.

**Testing mode** (v16, D-022): nothing is saved or synced — no IndexedDB/localStorage writes, no Drive sync, no Claude-account
`db` writes, Export backup blocked. It is forced on by `?test=1`, on by default in DrumPath on claude.ai, and can be switched
on/off in Settings › Testing mode (`localStorage drumpath.sandbox`). A yellow banner shows while it's on; Studio import codes
made in it carry `test:1` and the tablet asks before applying them. Checks: `?test=1` › Settings › Run testing-mode checks.
Two tabs of the tablet app no longer overwrite each other: before writing, a tab merges in any newer save from another tab
(`mergeStates`), and tabs refresh each other over `BroadcastChannel('drumpath')`.

## Storage (S1, 10 Nov 2026)

Progress lives in **IndexedDB** (database `drumpath`, stores `state`, `runs`, `files`), not in `localStorage`.

- **First load after the update:** the app copies `localStorage` `drumpath.v1` into IndexedDB, reads it back and compares lesson, run, song and checklist counts. Only if they match does it switch over and set `drumpath.migrated`. If they don't, it keeps using `localStorage` and says so in Settings › Storage; nothing is lost.
- `drumpath.v1` is kept untouched (read-only) for 30 days after migration, then removed.
- Every run is kept with its per-hit detail; the old 600-run cap only applies if IndexedDB is unavailable.
- The app asks Chrome to keep the data (`navigator.storage.persist()`) once you have a passed run. Settings › Storage shows space used, the run count and whether it's protected.
- Export / Import backup work as before (one JSON file with everything).

## Google Drive sync (S2, 10 Nov 2026)

Progress is backed up to, and synced through, a folder in **your own** Google Drive: My Drive › Projects › **DrumPath**. The tablet stays the main copy; practice and saving never wait for Drive.

**Connect (once per device):** Settings › Google Drive › **Connect Google Drive** → sign in with the personal account → **Choose Drive folder** → pick Projects › DrumPath. The app creates:

```
DrumPath/
  backup/drumpath-state.json        everything (settings, lessons, runs, songs); overwritten on each sync
  backup/snapshots/YYYY-MM-DD.json  one per day, last 30 kept
  midi/  songs/                     for the Drive library (S3)
```

- **Scope:** `drive.file` only: the app sees files it created and files you pick, nothing else in your Drive.
- **When it syncs:** 30 s after any change (e.g. a run), when the app goes to the background, when it comes back online, and with **Sync now**. On start it pulls if Drive is newer.
- **Merging two devices:** runs are combined (never deleted by a sync); for each lesson the higher progress wins (mastered beats in progress, then higher tempo), best score/BPM are the max; checklists done on either device stay done; settings and song edits: newer wins; deleted songs stay deleted.
- **Header chip:** "Synced 2 min ago" · "Offline, will sync" · "Reconnect Drive". Google tokens last about an hour and the app gets no refresh token, so after a while the chip may ask you to tap **Reconnect Drive** (one tap, no password if you're signed in to Chrome). Nothing is lost meanwhile; it syncs after the tap.
- **Disconnect** stops syncing on this device; your Drive files and local progress both stay.

### One-time Google Cloud setup (done 10 Nov 2026)

Needed only if you ever recreate it. Use the **personal** Google account that owns the DrumPath folder.

1. https://console.cloud.google.com → **New project** `DrumPath` → select it.
2. **APIs & Services → Library**: enable **Google Drive API** and **Google Picker API**.
3. **OAuth consent screen** (Google Auth Platform → Branding / Audience): External; app name `DrumPath`; support + developer email = personal address; publishing status **Testing**; add the personal address under **Test users**; no scopes needed.
4. **Credentials → Create credentials → OAuth client ID**: Web application `DrumPath web`; **Authorized JavaScript origins** `https://aaditya-verma.github.io` (no path, no trailing slash); no redirect URIs.
5. **Credentials → Create credentials → API key** → edit: Application restrictions **Websites** `https://aaditya-verma.github.io/*`; API restrictions **Google Picker API** only.
6. Put the Client ID, the restricted API key and the **project number** (Picker app id) in `src/js/02c-drive.js` (`GCP`). These three are safe in a public repo. **The client secret is not used and must never be committed.**

While the app is in Testing mode only listed test users can sign in, and Google may ask you to re-approve access about once a week. That's expected for a personal app.

## Notation (Theory T1, 15 Nov 2026, D-028; v21)
`src/js/16-notation.js` draws every exercise as standard drum notation, straight from the pattern format (own SVG renderer,
no library). The practice screen has a **Grid · Notation · Both** switch (`state.set.nview`, default Both). Drum key: kick
bottom space, floor tom 2nd space, snare 3rd space, tom 2 2nd line from the top, tom 1 top space, ride x on the top line,
hi-hat x above, crash x on a ledger line, hi-hat pedal x below. Hands stem up, feet stem down, kick rests left out while the
hands play. Each beat uses the simplest value that holds its notes (8ths on a triplet grid stay 8ths; quarter-note triplets
span two beats under one 3); half and whole notes only in one-voice exercises; meter changes (6/8 → 3/4) get a new time
signature and grouping; accents, ghosts, open hi-hat, cross-stick, flams/drags, tuplet brackets, sticking, bar labels and
repeat signs. The count line under the staff follows what is written ("1 &", "1 e & a", "1 trip let", "1 2 3" in 6/8 and
12/8). During a run a playhead moves across the staff and each note turns green (on time), blue (early), amber (late),
red (wrong sound) or grey (missed). **Tap a note** (on the staff, the count or the grid) to see what it is, where it sits on
the staff, its value, where it falls in the count, and the hand or foot; the same step is ringed in the grid.
Checks: `?test=1` › Settings › **Run notation tests**; `validateNotation()` checks that all 296 Level 0–4 exercises draw
with every note, each voice adds up to the bar, and the count line has a slot per step.

## Theory (T2, 15 Nov 2026, D-030; v22)
More › **Theory** (a tab on wide screens): the course in `build/theory-course-plan.md`. T2 ships the reader and Tier A parts
**A1–A4** (Sound, beat and time · Reading rhythm 1 · The drum chart 1 · Groove basics): 34 chapters, 101 cards, own words.
- Content: `theory/A1.js`…`A4.js` (`DP_THEORY` parts → chapters → cards; card ids like `A2.04.2` are permanent once shipped),
  `theory/concepts.js` (concept tag → cards, `_lessons` hand map, `TX()` pattern helper). Reader: `src/js/17-theory.js`.
- Card = one screen + More: crumbs, “card n of m”, idea, diagram (notation via `ntBuild`, count grid with Western + konnakol
  counts, note-value tree, tempo ruler, drum key, form strip, energy curve, dynamics ladder, hairpins, timing feel, staff,
  one-bar repeat), **Hear it** (kit synth + click; count shown in time, optionally spoken — Settings › Theory),
  **Try it** (practice screen, normal engine; ≥ 85 % = Can play), Remember, More, Check, Where it shows up, Back / Next / swipe.
- Statuses per card: Read → Understood (check right) → Can play. Never blocks a lesson.
- **Remember deck**: reading a card queues its Remember line at 1 day, then 3, 7, 21, 60 days (Again = back to 1 day); due
  count on Home and Theory home.
- Links: lesson pages show “New idea here” chips for unread cards (concept tags from exercise data + hand map); Home shows at
  most one theory nudge a day (✕ = not today).
- Data (new fields only): `state.theory = {cards:{id:{r,u,p,updatedAt}}, review:{id:{due,step,at,done}}, bookmarks, bmAt,
  lastCard, lastAt, nudgeOff}`; `state.set.thVoice`, `thKon`. Theory tries are runs with `kind:'theory'` and id `th:<card>`:
  minutes + streak only, never lesson progress, readiness or status. Drive/tab merge: a status reached on either device is kept;
  the later review wins. Testing mode saves nothing.
Checks: `?test=1` › Settings › **Run theory tests** (34 checks, incl. every Try scored by the engine and the review queue with a
fake clock).

## Drive library (S3, 11 Nov 2026, D-025)
**Library** (More › Library, and a **Files** section on each song page) lists MIDI files, audio and documents from the
Drive folder. With the `drive.file` scope the app sees only files it created or files you pick, so files uploaded to
Drive by hand are added with **Add from Drive** (Google Picker, multi-select; views for DrumPath › midi, › songs, the
DrumPath folder and My Drive). A file whose name contains exactly one song title is linked to that song automatically.
- **Index**: `state.lib` `{fileId: {id,name,size,mime,kind,songs,lessons,tags,pinned,addedAt,updatedAt}}` plus
  `state.libDel` tombstones; synced with the Drive backup (merge by file id, newer `updatedAt` wins).
- **Cache**: IndexedDB `files` store — `drv:<fileId>` holds the bytes, `cache:index` holds size + last use per file
  (per device, never synced). A file downloads the first time it's opened and is kept for offline use. Past the limit
  (Settings › Storage, default 500 MB) the least recently used files are dropped from the tablet (not from Drive);
  pinned files never are; a file bigger than the limit opens but isn't kept.
- **Analyse & tag › From a MIDI file** can pick a library file. Opening an unlinked MIDI offers its songs or a new song
  named from the file ("Queen - Bohemian Rhapsody.mid" → *Bohemian Rhapsody* by *Queen*).
- **Testing mode**: the library is read-only — nothing is added, linked, pinned or cached.
- File contents never go into this repo. Tests: `?test=1` › Settings › **Run library tests** (13 checks, mock Drive +
  throwaway IndexedDB).

## Analyse & tag and Studio — one app, two homes (D-021)

DrumPath runs in two places from the same code:

| Home | Address | What it's for |
|---|---|---|
| **Tablet app** (GitHub Pages) | https://aaditya-verma.github.io/drumpath/ | Practice with the kit (USB-MIDI), Google Drive sync, everything day to day |
| **DrumPath on claude.ai** (artifact) | https://claude.ai/artifact/A4goxQDpCkAaK7wLE81eFx | **Studio** with inline analysis (Claude, via the artifact `sample` capability); browsing your songs and lessons |

GitHub Pages can't call Claude, and a claude.ai page can't reach Google (Drive) and may not reach USB-MIDI, so each home does what it can and they pass songs with codes and links:

- **Every song page → Analyse & tag:** (1) **From a MIDI file**, analysed on the device with `src/js/midi-analyse.js` (the file stays on the device); (2) **From my playing**, which records the kit along to the song; (3) **Analyse with Studio**: on claude.ai it runs right there and opens the review card; on the tablet it copies a request code and opens DrumPath on claude.ai at **Studio** (`#studio`).
- **Studio** (More › Studio): Analyse & add (one song or a list; title, MIDI file, photo of a drum sheet, pasted notes), Suggest songs, Analysed history. Each result: **Send to the tablet app ↗** (an `#import=` link the tablet reviews before applying), **Add here / Review & apply here**, or **Copy import code** (tablet: Songs › Paste import code).
- Free sources only (RULES §F): From my playing, Lakh MIDI, Groove MIDI Dataset, MuseScore Studio (free app) exports, TuxGuitar (free) exports.

**Republish the claude.ai copy** after a change: `node tools/build-artifact.mjs` bundles everything into `dist/drumpath-claude.html`; publish that as the DrumPath artifact's `index.html`. Declared capabilities: `sample` (`images: true`), `db` + `user` (that copy's progress, in your Claude account), `downloads` (Export backup).

**Credits:** Groove MIDI Dataset by Google Magenta (Gillick, Roberts, Engel, Eck, Bamman, "Learning to Groove with Inverse Sequence Transformations", ICML 2019), CC BY 4.0, used at build time for analyser calibration (1,150 / 1,150 files parse; BPM within ±2: 100%; meter: 100%; beat/fill: 93%).
