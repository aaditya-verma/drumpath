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

## Google Drive sync (S2): one-time Google Cloud setup

DrumPath syncs to a folder in **your own** Google Drive. Google needs a free "OAuth client" for that. About 15 minutes, once. Use your **personal** Google account (the one that owns My Drive › Projects › DrumPath).

1. **Create a project.** Open https://console.cloud.google.com, signed in with the personal account. Top bar → project picker → **New project** → name it `DrumPath` → **Create**, then select it.
2. **Turn on the two APIs.** Menu → **APIs & Services → Library**. Search **Google Drive API** → **Enable**. Back to Library, search **Google Picker API** → **Enable**.
3. **Consent screen.** Menu → **APIs & Services → OAuth consent screen** (may be called **Google Auth Platform → Branding / Audience**).
   - User type **External**. App name `DrumPath`, support email and developer email = your personal address. Save.
   - Under **Audience** (or **Test users**), leave publishing status as **Testing** and **Add users** → your personal address.
   - Scopes: you can skip this page; the app asks only for `drive.file` (files it creates or that you pick).
4. **OAuth client id.** **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type **Web application**, name `DrumPath web`.
   - **Authorized JavaScript origins** → Add URI → `https://aaditya-verma.github.io` (exactly that: no path, no trailing slash).
   - Leave redirect URIs empty. **Create**, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).
5. **Picker API key.** **Credentials → Create credentials → API key**. Then **Edit API key**:
   - Application restrictions → **Websites** → add `https://aaditya-verma.github.io/*`.
   - API restrictions → **Restrict key** → tick **Google Picker API** only. Save, and copy the key.
6. **Send both to the build chat:** the Client ID and the restricted Picker API key. Both are safe in a public repo: the client id is public by design, and the key only works for the Picker on this site. Also note the **project number** (Dashboard → Project info); the Picker needs it as the app id.

Testing mode is fine for a personal app: only listed test users can sign in. Google may ask you to re-approve access about once a week while the app stays in Testing; that's expected.
