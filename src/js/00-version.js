/* DrumPath — build version (v35 fix-queue item 2; v36). Shown at the bottom of Settings and in Search.
   `commit` is the code commit this build was made from (stamped in a follow-up commit, since a commit can't hold its own id). */
'use strict';
const APP={v:36,commit:'fc7b2a2',date:'16 Nov 2026'};
const appVerLine=()=>`DrumPath v${APP.v} · commit ${APP.commit} · ${APP.date}`;
