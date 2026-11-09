# DrumPath Studio

The **Analyse & tag › Analyse with Studio** half of DrumPath. Published as a claude.ai artifact:
https://claude.ai/artifact/F7ud2c2UJMVNYU4C9Pp67B

GitHub Pages can't call Claude, so DrumPath does everything on the device (MIDI files, your playing) and Studio adds
title-based tagging, photos of drum sheets/tabs, Search and Suggest songs. Free only (RULES §F): no paid sources or services.

## Files
| File | What |
|---|---|
| `shell.html` | Page layout and styles, with three placeholders: `/*__DATA__*/`, `/*__MIDI__*/`, `/*__APP__*/` |
| `app.js` | Studio logic: Analyse & add (one song or a batch), Search, Suggest songs, Analysed history |
| `data.js` | **Generated.** `DP_INDEX` (all lesson ids + names, built and coming), `DP_EX` (built lessons with exercise patterns, for groove matching), `DP_CAT` (the song catalog) |
| `dist/index.html` | **Generated.** The single self-contained page to publish (shell + data + `src/js/midi-analyse.js` + app) |

## Capability to declare when publishing
- **`sample`**, with **`images: true`** (photos of drum notation or tabs). Studio calls it only on a button press; if it's
  refused (`not_granted`) the Analyse and Suggest buttons stay off and Search still works; on `rate_limited` it backs off.
- No other capability is needed: Studio's history lives in the page's own browser storage.

## How DrumPath and Studio talk (no URL data: an artifact can't read its URL hash)
1. **DrumPath → Studio:** Analyse with Studio (or **Analyse untagged songs (n)**) copies a request code and opens Studio.
   Code = base64url of `{songId,title,artist,link,bpm,meter}` or `{batch:[…]}`. Paste it in Studio under
   "From DrumPath: paste the code it copied". If the clipboard is refused, DrumPath shows the code in a sheet with Copy.
2. **Studio → DrumPath:** **Add to DrumPath ↗** opens `https://aaditya-verma.github.io/drumpath/#import=z…`
   (gzip + base64url of `{v:1,songs:[…]}`, `songId` set when the request had one), or **Copy import code** →
   DrumPath › Songs › **Paste import code**. DrumPath shows one review card per song, one after another, and updates the
   song with that `songId` instead of adding a copy. Nothing is applied until **Apply**.

## Republish after lessons or the catalog change
```bash
node tools/build-studio.mjs        # rebuilds studio/data.js from lessons/*.js + lessons/songs.js, and studio/dist/index.html
```
Then publish `studio/dist/index.html` as a new version of the same artifact (from the Drums project chat), declaring
`sample` with `images: true`. Keep the link the same so `STUDIO_URL` in `src/js/11b-analyse.js` stays valid; if the link
changes, update `STUDIO_URL` and bump `?v=` in `index.html`.

## Source of truth
The Drums project holds the original `build/studio/app.js` and `build/studio/shell.html`; this folder is the repo copy.
Edit here, rebuild, publish, and copy changes back to the project.
