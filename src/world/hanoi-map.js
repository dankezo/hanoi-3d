// Hanoi static map (owner: hanoi agent). The authored 40x40 page for ?map=hanoi.
// DATA ONLY: one ASCII char per cell, plus a legend and the landmark areas.
// Grid coords x, z in [-20, 19]; row 0 is the north edge (z = -20), col 0 is the west edge (x = -20).
// The traveller spawns at (0, 0), a path_straight on the street just south of Hoan Kiem Lake.
// No long dashes in this file: only short hyphens (-).
//
// Landmark model mapping (Step 3 placeholder models, Hanoi-only registry in src/world/hanoi-models.js):
//   hoankiem  - pond cluster + hanoi_turtletower at (-1, -2) = Turtle Tower, causeway at (-1, -1)
//   ngocson   - hanoi_ngocson at (5, -2) rot 1 (door west) + hanoi_thehuc at (3, -2) over a river channel
//   vanmieu   - hanoi_vanmieu at (-8, 11) = Temple of Literature
//   mausoleum - hanoi_mausoleum at (-12, 3) + hanoi_badinh at (-12, 5) = Ba Dinh Square
//   onepillar - hanoi_onepillar at (-8, 4) beside a pond at (-7, 4)
//   cathedral - hanoi_cathedral at (7, -1) = St Joseph's Cathedral
//   longbien  - hanoi_longbien rot 1 at (17, -6) and (18, -6) over the Red River
//   westlake  - pond cluster NW + hanoi_tranquoc at (-9, -11) rot 0 = Tran Quoc Pagoda on the east shore
//   oldquarter - hanoi_tubehouse / hanoi_tubehouse_b / hanoi_tubehouse_green streets, x -8..2, z -9..-3
//   opera     - hanoi_opera at (9, 7) = Hanoi Opera House
// The Red River (x 17..18) starts in river_source springs at z = -19 and ends in
// river_source sinks at z = 18, so no river socket ever faces off the page.

export const HANOI_SIZE = 40;
export const HANOI_MIN = -20;
export const HANOI_OFFSET = 20;

// Dataset provenance marker (Phase 2D). Same watermark family as
// DATASET_PROVENANCE in src/game/landmark-history.js: if a copy of this map
// shows up elsewhere carrying this string, the copy came from this repo.
// Check: search the copy for HANOI3D-DANKEZO-WM-9Q7K2M. The game never reads
// this export; it changes no cell, no landmark, no discovery.
export const HANOI_DATASET_MARKER = 'HANOI3D-DANKEZO-WM-9Q7K2M';

export const HANOI_ROWS = Object.freeze([
  'HFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFH',
  'FG~~~~~~FFFFHGFFFFHGFFFFHGFFFFHGFFFFHssF',
  'F~~~~~~~~........................FFFF!!F',
  'F~~~~~~~~~.......................FFFF!!F',
  'FF~~~~~~~~~......................FFFF!!F',
  'HF~~~~~~~~~......................FFFF!!H',
  'FH.~~~~~~~~..........................!!F',
  'FG.~~~~~~~...........................!!F',
  'FF..~~~~~~~......................HHH.!!F',
  'FF...~~~~~.M.....................HHH.!!F',
  'HF....~~~~.|..e..e..........,,,,.HHH.!!H',
  'FF.....~~..|TqVqTvq.qTq.....,,,,.....!!F',
  'FH.....,,,.|l.v..V....l.....,,,,.....!!F',
  'FGFFFF.,,,.|.kVkjok.k................!!F',
  'FFFFFF...h-+UiXOiXuQUiO---a-=---=----BBf',
  'HFFFFF.....|Ykoj.Vk..jZ...|..........!!H',
  'FF...~~....|T.V..v.....s..|...GGGG...!!F',
  'FF.........|..D..D.....!..|...GGGG...!!F',
  'FH.........|.....~~W~~hJ-m|...GGGG...!!F',
  'FG.........|.....~~|~~~S..|C..GGGG...!!F',
  'HFGGG..h-a-+-------c-a----+c----f....!!H',
  'FFGGG....|.|.........|....|..........!!F',
  'FFGGG....|.|...,,,,..|,,,,|,,,,...R..!!F',
  'FF......A|.|...,,,,..|,,,,|,,,,.~~...!!F',
  'FH......e|h+p~.,,,,..|,,,,|..........!!F',
  'HG....h-Kb.|...GGG...|GGG.|......R...!!H',
  'FF......||.|...GGG...|GGG.|..........!!F',
  'FF......gg.|...GGG...|GGG.|..r.......!!F',
  'FF....R..h-+--a------+----c--c--f....!!F',
  'FF.........|..|......|...............!!F',
  'HHFFF......|..|......|........GGGFFF.!!H',
  'FGFFF......|t.g......|........GGGFFF.!!F',
  'FFFFF....h-+c-f.R....g.~~.....GGGFFF.!!F',
  'FFFFF......g.............R.......FFF.!!F',
  'FF..............,,,,,..GGGG.GGG...HHH!!F',
  'HFHHH...........,,,,,..GGGG.GGG...HHH!!H',
  'FHHHH...........,,,,,..GGGG.GGG...HHH!!F',
  'FGHHH................................!!F',
  'FFFFFHGFFFFHGFFFFHGFFFFHGFFFFHGFFFFHGSSF',
  'FFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFF',
]);

// Legend: char -> { tileId, rot }. rot = clockwise quarter turns (see core/models.js).
// Path / river rotation cheatsheet (rot 0 sockets in core/models.js):
//   path_straight rot 0 = N-S, rot 1 = E-W. path_corner rot 0 = N-E, 1 = E-S, 2 = S-W, 3 = W-N.
//   path_t rot 0 = E-S-W (no N), 1 = S-W-N (no E), 2 = W-N-E (no S), 3 = N-E-S (no W).
//   path_end rot 0 = socket at S, 1 = at W, 2 = at N, 3 = at E (the socket faces the street it ends).
//   river_source rot 0 = river at S, 1 = at W, 2 = at N, 3 = at E. bridge rot 1 = path E-W over N-S river.
//   manor / church / watchtower / blossom_gazebo rot 0 = path socket at S, rot 1 = at W.
//   The Step 3 Hanoi placeholders keep the same sockets at the same rot, so this still holds.
//   Hanoi legend chars: W turtletower, M tranquoc, m ngocson, r opera, t vanmieu, C cathedral,
//   K badinh, A mausoleum, p onepillar, B longbien, J thehuc, V/v/o/U/u/O tubehouse family.
export const HANOI_LEGEND = Object.freeze({
  '.': { tileId: 'meadow', rot: 0 },
  ',': { tileId: 'meadow_flowers', rot: 0 },
  F: { tileId: 'forest', rot: 0 },
  G: { tileId: 'grove', rot: 0 },
  H: { tileId: 'hills', rot: 0 },
  R: { tileId: 'rocks', rot: 0 },
  '~': { tileId: 'pond', rot: 0 },
  '|': { tileId: 'path_straight', rot: 0 },
  '-': { tileId: 'path_straight', rot: 1 },
  '+': { tileId: 'path_cross', rot: 0 },
  1: { tileId: 'path_corner', rot: 0 },
  2: { tileId: 'path_corner', rot: 1 },
  3: { tileId: 'path_corner', rot: 2 },
  4: { tileId: 'path_corner', rot: 3 },
  a: { tileId: 'path_t', rot: 0 },
  b: { tileId: 'path_t', rot: 1 },
  c: { tileId: 'path_t', rot: 2 },
  d: { tileId: 'path_t', rot: 3 },
  e: { tileId: 'path_end', rot: 0 },
  f: { tileId: 'path_end', rot: 1 },
  g: { tileId: 'path_end', rot: 2 },
  h: { tileId: 'path_end', rot: 3 },
  L: { tileId: 'lantern_post', rot: 0 },
  '=': { tileId: 'lantern_post', rot: 1 },
  '!': { tileId: 'river_straight', rot: 0 },
  ':': { tileId: 'river_straight', rot: 1 },
  '(': { tileId: 'river_corner', rot: 0 },
  ')': { tileId: 'river_corner', rot: 1 },
  ']': { tileId: 'river_corner', rot: 2 },
  '[': { tileId: 'river_corner', rot: 3 },
  s: { tileId: 'river_source', rot: 0 },
  S: { tileId: 'river_source', rot: 2 },
  w: { tileId: 'river_source', rot: 1 },
  E: { tileId: 'river_source', rot: 3 },
  B: { tileId: 'hanoi_longbien', rot: 1 },
  J: { tileId: 'hanoi_thehuc', rot: 1 },
  '^': { tileId: 'bridge', rot: 0 },
  W: { tileId: 'hanoi_turtletower', rot: 0 },
  M: { tileId: 'hanoi_tranquoc', rot: 0 },
  m: { tileId: 'hanoi_ngocson', rot: 1 },
  r: { tileId: 'hanoi_opera', rot: 0 },
  t: { tileId: 'hanoi_vanmieu', rot: 0 },
  C: { tileId: 'hanoi_cathedral', rot: 0 },
  K: { tileId: 'hanoi_badinh', rot: 0 },
  A: { tileId: 'hanoi_mausoleum', rot: 0 },
  P: { tileId: 'blossom_gazebo', rot: 0 },
  p: { tileId: 'hanoi_onepillar', rot: 1 },
  V: { tileId: 'hanoi_tubehouse', rot: 0 },
  v: { tileId: 'hanoi_tubehouse_b', rot: 0 },
  o: { tileId: 'hanoi_tubehouse_green', rot: 0 },
  U: { tileId: 'hanoi_tubehouse', rot: 1 },
  u: { tileId: 'hanoi_tubehouse_b', rot: 1 },
  O: { tileId: 'hanoi_tubehouse_green', rot: 1 },
  // Phase 2B street elements (Old Quarter only, Hanoi-only registry).
  // X road junction (path_cross sockets), k sidewalk, T tree, q bush, D traffic light
  // (path_end sockets, rot 2 = socket at N), Q traffic police, i pedestrian (tubehouse
  // rot 1 sockets, path E-W), Y street vendor, Z pho stall, l electric pole, j street lamp.
  X: { tileId: 'hanoi_road', rot: 0 },
  k: { tileId: 'hanoi_sidewalk', rot: 0 },
  T: { tileId: 'hanoi_tree', rot: 0 },
  q: { tileId: 'hanoi_bush', rot: 0 },
  D: { tileId: 'hanoi_trafficlight', rot: 2 },
  Q: { tileId: 'hanoi_police', rot: 1 },
  i: { tileId: 'hanoi_pedestrian', rot: 1 },
  Y: { tileId: 'hanoi_vendor', rot: 0 },
  Z: { tileId: 'hanoi_phostall', rot: 0 },
  l: { tileId: 'hanoi_pole', rot: 0 },
  j: { tileId: 'hanoi_lamp', rot: 0 },
  y: { tileId: 'house', rot: 0 },
});

// Landmark areas. Rule: every cell belonging to a landmark's area carries that landmark's id
// on the cell record (landmarkId); single-building landmarks tag just their one cell.
// anchor = the cell Step 4 (discovery / checklist) walks to; it is on or adjacent to a path tile.
// rects are [x0, z0, x1, z1] inclusive; cells are explicit [x, z] pairs.
export const HANOI_LANDMARKS = Object.freeze({
  hoankiem: Object.freeze({ anchor: Object.freeze([-1, -2]), rects: Object.freeze([Object.freeze([-3, -2, 1, -1])]), cells: Object.freeze([Object.freeze([2, -1])]) }),
  ngocson: Object.freeze({ anchor: Object.freeze([5, -2]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([2, -2]), Object.freeze([3, -4]), Object.freeze([3, -3]), Object.freeze([3, -2]), Object.freeze([3, -1]), Object.freeze([4, -2]), Object.freeze([5, -2])]) }),
  westlake: Object.freeze({ anchor: Object.freeze([-9, -11]), rects: Object.freeze([Object.freeze([-19, -19, -10, -9])]), cells: Object.freeze([Object.freeze([-9, -11]), Object.freeze([-9, -10])]) }),
  oldquarter: Object.freeze({ anchor: Object.freeze([-6, -6]), rects: Object.freeze([Object.freeze([-8, -9, 2, -3])]), cells: Object.freeze([]) }),
  mausoleum: Object.freeze({ anchor: Object.freeze([-12, 3]), rects: Object.freeze([Object.freeze([-14, 3, -11, 7])]), cells: Object.freeze([]) }),
  vanmieu: Object.freeze({ anchor: Object.freeze([-8, 11]), rects: Object.freeze([Object.freeze([-10, 9, -6, 13])]), cells: Object.freeze([]) }),
  onepillar: Object.freeze({ anchor: Object.freeze([-8, 4]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([-8, 4]), Object.freeze([-7, 4])]) }),
  cathedral: Object.freeze({ anchor: Object.freeze([7, -1]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([7, -1])]) }),
  opera: Object.freeze({ anchor: Object.freeze([9, 7]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([9, 7])]) }),
  longbien: Object.freeze({ anchor: Object.freeze([17, -6]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([17, -6]), Object.freeze([18, -6])]) }),
});
