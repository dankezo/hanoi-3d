// Canary / decoy records (Phase 2D; owner: fixer 2D).
// DO NOT import this module from any game code. No file under src/ imports it
// (the edge Worker imports it only to know which ids are traps). The records
// below look like real Hanoi landmarks and history, but they are NEVER shown
// in the game UI and NEVER reachable by play:
//
//   - their ids start with "canary-" and appear nowhere in HANOI_LANDMARKS,
//     LANDMARKS, LANDMARK_INFO or any map cell, so no game accessor can
//     surface them (discovery, checklist, toast, minimap, info card all read
//     the real datasets only);
//   - their anchors sit outside the 40x40 grid ([99, 99] and [-99, -99]),
//     so even a grid scan can never stand on one;
//   - each record carries canary: true and a unique marker string. If a copy
//     of the Hanoi data ever shows up elsewhere carrying one of these
//     markers, the copy came from this repo. Search for the marker strings
//     to check: HANOI3D-CANARY-MAP-7F3A9D and HANOI3D-CANARY-HIST-2B8E41.
//
// The two markers are also listed in data/provenance.json and in
// docs/antirea-declaration.md, with the owner and license. Do NOT add a
// canary id to the visible checklist, map, or discovery - that would turn
// a trap into a real landmark. No long dashes in this file: only short hyphens (-).

/** Marker string planted in the canary map record. Search a suspected copy for it. */
export const CANARY_MARKER_MAP = 'HANOI3D-CANARY-MAP-7F3A9D';
/** Marker string planted in the canary history records. Search a suspected copy for it. */
export const CANARY_MARKER_HIST = 'HANOI3D-CANARY-HIST-2B8E41';

/**
 * Fake landmark entries. Same shape as the real landmark areas in
 * src/world/hanoi-map.js (anchor + rects + cells) plus canary: true and a
 * marker, but deliberately NOT registered there: createHanoi never sees them.
 */
export const CANARY_LANDMARKS = Object.freeze({
  'canary-ho-guom-bac': Object.freeze({
    id: 'canary-ho-guom-bac',
    nameEN: 'North Ho Guom Pavilion',
    nameVI: 'Dinh Bac Ho Guom',
    anchor: Object.freeze([99, 99]),
    rects: Object.freeze([]),
    cells: Object.freeze([]),
    canary: true,
    marker: CANARY_MARKER_MAP,
  }),
  'canary-thap-dong': Object.freeze({
    id: 'canary-thap-dong',
    nameEN: 'Bronze Drum Tower',
    nameVI: 'Thap Trong Dong',
    anchor: Object.freeze([-99, -99]),
    rects: Object.freeze([]),
    cells: Object.freeze([]),
    canary: true,
    marker: CANARY_MARKER_MAP,
  }),
});

/**
 * Fake history entries. Same shape as LANDMARK_INFO entries
 * (src/game/landmark-history.js) plus canary: true and a marker, but kept
 * out of LANDMARK_INFO: landmarkInfo() returns null for these ids.
 * The marker string sits inside the fun fact, so it survives a copy of the
 * text itself. The facts are invented: no such pavilion or tower exists.
 */
export const CANARY_HISTORY = Object.freeze({
  'canary-ho-guom-bac': Object.freeze({
    id: 'canary-ho-guom-bac',
    nameEN: 'North Ho Guom Pavilion',
    nameVI: 'Dinh Bac Ho Guom',
    histEN: Object.freeze([
      'A small pavilion said to stand on the north shore of Hoan Kiem Lake, built for mandarins watching the morning mist.',
    ]),
    histVI: Object.freeze([
      'Mot dinh nho duoc noi la dung o bo bac ho Hoan Kiem, cho quan lai ngam suong som.',
    ]),
    funEN: 'The pavilion keeper supposedly rang a bell every dawn that only turtles could hear. Marker HANOI3D-CANARY-HIST-2B8E41.',
    funVI: 'Nguoi giu dinh duoc noi la rung chuong moi binh minh ma chi rua moi nghe thay. Marker HANOI3D-CANARY-HIST-2B8E41.',
    source: 'https://dankezo.github.io/hanoi-3d/canary-ho-guom-bac',
    canary: true,
    marker: CANARY_MARKER_HIST,
  }),
  'canary-thap-dong': Object.freeze({
    id: 'canary-thap-dong',
    nameEN: 'Bronze Drum Tower',
    nameVI: 'Thap Trong Dong',
    histEN: Object.freeze([
      'A tower said to hold a bronze drum cast in 1142 that was rung only when the Red River flooded.',
    ]),
    histVI: Object.freeze([
      'Mot thap duoc noi la giu mot chiec trong dong duc nam 1142, chi danh khi song Hong lu.',
    ]),
    funEN: 'The drum was supposedly so large that twelve men stood inside it to polish it. Marker HANOI3D-CANARY-HIST-2B8E41.',
    funVI: 'Trong duoc noi la lon den muc muoi hai nguoi dung vua ben trong de danh bong. Marker HANOI3D-CANARY-HIST-2B8E41.',
    source: 'https://dankezo.github.io/hanoi-3d/canary-thap-dong',
    canary: true,
    marker: CANARY_MARKER_HIST,
  }),
});

/** All canary ids, for the edge API trap list. */
export const CANARY_IDS = Object.freeze(Object.keys(CANARY_LANDMARKS));

/** True when this id is a canary record (never a real landmark). */
export function isCanaryId(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(CANARY_LANDMARKS, id);
}

/** Edge API paths that are canary traps: a request for one is a trap hit, never data. */
export const CANARY_TRAP_PATHS = Object.freeze(CANARY_IDS.map((id) => '/api/landmarks/' + id));
