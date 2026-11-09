# RULES — apply in every change

- Never break saved progress: only add state fields, fill missing ones on load, keep lesson ids.
- Every new pattern feature is opt-in; old exercises must score exactly as before.
- Before shipping lesson data: `?test=1` lesson check shows no issues; simulate perfect and faulty runs.
- Bump `?v=` on changed script/style tags; tell the owner to refresh (or re-add the home-screen app).
- Pad colours come from `--p-*` tokens; never hard-code colours in views or the canvas (use `TH`).
- No song audio or lyrics in the app; songs are titles + lesson tags, played along to the owner's own audio.
- Weeks run Sunday to Saturday.
