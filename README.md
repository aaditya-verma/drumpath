# DrumPath

Drum practice app for the Alesis Nitro kit (Web MIDI), with scored lessons, progress tracking and a 62-song play-along library with readiness scores and a Song × Lesson matrix.
Live: https://aaditya-verma.github.io/drumpath/

## Files
See `docs/ARCHITECTURE.md` for the file map; `docs/DECISIONS.md` and `docs/RULES.md` for decisions and rules.
- `index.html` + `src/css/app.css` + `src/js/*.js`: the app.
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

## Analyse & tag and DrumPath Studio

Every song page has **Analyse & tag**: (1) **From a MIDI file**, analysed on the tablet with `src/js/midi-analyse.js` (the file stays on the device);
(2) **From my playing**, which records the kit along to the song and runs the same analyser; (3) **Analyse with Studio**, a claude.ai artifact
(https://claude.ai/artifact/F7ud2c2UJMVNYU4C9Pp67B, source in `studio/`). Free sources only: From my playing, Lakh MIDI, Groove MIDI Dataset,
MuseScore Studio (free app) exports, TuxGuitar (free) exports.

**Credits:** Groove MIDI Dataset by Google Magenta (Gillick, Roberts, Engel, Eck, Bamman, "Learning to Groove with Inverse Sequence Transformations", ICML 2019), CC BY 4.0, used at build time for analyser calibration (1,150 / 1,150 files parse; BPM within ±2: 100%; meter: 100%; beat/fill: 93%).
