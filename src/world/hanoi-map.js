// Hanoi static map (owner: hanoi agent). The authored 40x40 page for ?map=hanoi.
// DATA ONLY: one ASCII char per cell, plus a legend and the landmark areas.
// Grid coords x, z in [-20, 19]; row 0 is the north edge (z = -20), col 0 is the west edge (x = -20).
// The traveller spawns at (0, 5), a sidewalk on the promenade just south of Hoan Kiem Lake
// (Phase 3B: the old spawn (0, 0) is pond now - the lake rect covers it).
// No long dashes in this file: only short hyphens (-).
//
// Landmark model mapping (Step 3 placeholder models, Hanoi-only registry in src/world/hanoi-models.js):
//   hoankiem  - redrawn lake 4x12 (x -2..1, z -7..4) + hanoi_turtletower at (-1, -1) on a 1-cell island mid-lake, no bridge
//   ngocson   - hanoi_ngocson at (5, -2) rot 1 (door west) + hanoi_thehuc at (3, -2) over a river channel
//   vanmieu   - hanoi_vanmieu at (-8, 11) = Temple of Literature
//   mausoleum - hanoi_mausoleum at (-12, 3) + hanoi_badinh at (-12, 5) = Ba Dinh Square
//   onepillar - hanoi_onepillar at (-8, 4) beside a pond at (-7, 4)
//   cathedral - hanoi_cathedral at (7, -1) = St Joseph's Cathedral
//   longbien  - hanoi_longbien rot 1 at (17, -6) and (18, -6) over the Red River
//   westlake  - big lake 13x14 (x -19..-7, z -19..-6), 130 water cells, lotus pond at the SW corner
//   tranquoc  - hanoi_tranquoc at (-13, -12) rot 3 (door east) on a 1-cell island mid-lake + stone bridge to the shore
//   oldquarter - hanoi_tubehouse / hanoi_tubehouse_b / hanoi_tubehouse_green streets, x -8..-3, z -9..-3 (the lake eats the east part)
//   opera     - hanoi_opera at (9, 7) = Hanoi Opera House
// Pen Tower (hanoi_pentower, no checklist) stands at (2, -6) on the north-east shore of Hoan Kiem Lake.
// The Red River (x 16..18 below the bridge, x 17..18 above it) starts in river_source springs at z = -19 and ends in
// river_source sinks at z = 18, so no river socket ever faces off the page.

export const HANOI_SIZE = 40;
export const HANOI_MIN = -20;
export const HANOI_OFFSET = 20;

// Phase 3B: the traveller spawns on the promenade south of Hoan Kiem Lake (sidewalk at
// (0, 5)); the old spawn (0, 0) is lake water now. main.js initialPosition() reads this.
export const HANOI_SPAWN = Object.freeze([0, 5]);

// Dataset provenance marker (Phase 2D). Same watermark family as
// DATASET_PROVENANCE in src/game/landmark-history.js: if a copy of this map
// shows up elsewhere carrying this string, the copy came from this repo.
// Check: search the copy for HANOI3D-DANKEZO-WM-9Q7K2M. The game never reads
// this export; it changes no cell, no landmark, no discovery.
export const HANOI_DATASET_MARKER = 'HANOI3D-DANKEZO-WM-9Q7K2M';

export const HANOI_ROWS = Object.freeze([
  'HFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFFHFFFH',
  'FG*********FHGFFFFHGFFFFHGFFFFHGFFFFHssF',
  'FF*********.**...................FFFF!!F',
  'FF*********.*....................FFFF!!F',
  'FF*********......................FFFF!!F',
  'HH*********......................FFFF!!H',
  'FF***********........................!!F',
  'FF***********........................!!F',
  'FF*****/#f.......................HHH.!!F',
  'FF***********....................HHH.!!F',
  'HF*********e*.e..e..........,,,,.HHH.!!H',
  'FF*********|Tq@qTvq.qTq88...,,,,.....!!F',
  'FH???******|l.v..Vkkkkl8T...,,,,.....!!F',
  'FG??*******|z9Vkjo9;;909.............!!F',
  'FF*******h-+^iNOib;;;;$yiQa-=---=----BBf',
  'HFFFFF.....|Y9ojxV;;;;Z965|.........s!!H',
  'FF...~~....|Y.V..o;;;;TskI|...GGGG..!!!F',
  'FF.........|65DPID;;;;;!k.|...GGGG..!!!F',
  'FH......n..|......;;;;hJ-m|...GGGG..!!!F',
  'FG......n..|......;W;;;S..|C..GGGG..!!!F',
  'HFGGG..h-a-+-----f;;;;h---+c----f...!!!H',
  'FFGGG...n|%|.....7;;;;T7..|.........!!!F',
  'FFGGG...n|%|...,77;;;;Tj9,|,,,,...R.!!!F',
  'FF.....&A|.|...,,,;;;;j,9,|,,,,.~~..!!!F',
  'FH......e|h+p~.,,,9;;9j,,,|.........!!!F',
  'HG....h-Kb.|...GGTkkkejGG.|......R..S!!H',
  'FF......||.|...GGG..l|jGG.|..........!!F',
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
  // Phase 3A street elements (vibe Ha Noi that). New chars are previously free letters,
  // digits and symbols, except P, y and ^: those three mapped to stock models with ZERO
  // cells in this map (blossom_gazebo, house, bridge) and are repurposed here; the stock
  // models stay in MODELS for the default WFC path, only their legend chars move.
  // N corner house (path_cross sockets), n west alley, x/z/0/P the 4 beer signs,
  // 9 flag, 8 banner, 7 sau tree, 6/5/I parked bikes red/blue/black, % mural wall,
  // y street vendor (village rot 1 sockets), ^ street pho stall (village rot 1),
  // @ pole on the house row (village rot 0 sockets, blocker like a tubehouse).
  N: { tileId: 'hanoi_cornerhouse', rot: 0 },
  n: { tileId: 'hanoi_alley', rot: 0 },
  x: { tileId: 'hanoi_sign_phoco', rot: 0 },
  z: { tileId: 'hanoi_sign_biahoi', rot: 0 },
  0: { tileId: 'hanoi_sign_trucbach', rot: 0 },
  P: { tileId: 'hanoi_sign_paramount', rot: 0 },
  9: { tileId: 'hanoi_flag', rot: 0 },
  8: { tileId: 'hanoi_banner', rot: 0 },
  7: { tileId: 'hanoi_sautree', rot: 0 },
  6: { tileId: 'hanoi_bike_red', rot: 0 },
  5: { tileId: 'hanoi_bike_blue', rot: 0 },
  I: { tileId: 'hanoi_bike_black', rot: 0 },
  y: { tileId: 'hanoi_vendor_street', rot: 1 },
  '^': { tileId: 'hanoi_phostall_street', rot: 1 },
  '@': { tileId: 'hanoi_pole_street', rot: 0 },
  '%': { tileId: 'hanoi_mural', rot: 0 },
  // Phase 3B lake chars. ';' Ho Guom pond (dark green water), '*' Ho Tay pond (deep blue
  // water), '?' lotus pond, '#' low stone bridge to the Tran Quoc islet (E-W path sockets
  // written in the model, so rot 0), '$' Pen Tower (watchtower rot 3 sockets, path east),
  // '&' mausoleum side wing, '/' Tran Quoc Pagoda rot 3 (door east, toward the bridge).
  ';': { tileId: 'hanoi_pond_guom', rot: 0 },
  '*': { tileId: 'hanoi_pond_tay', rot: 0 },
  '?': { tileId: 'hanoi_lotus', rot: 0 },
  '#': { tileId: 'hanoi_stonebridge', rot: 1 },
  '$': { tileId: 'hanoi_pentower', rot: 3 },
  '&': { tileId: 'hanoi_mausoleum_wing', rot: 0 },
  '/': { tileId: 'hanoi_tranquoc', rot: 3 },
});

// Landmark areas. Rule: every cell belonging to a landmark's area carries that landmark's id
// on the cell record (landmarkId); single-building landmarks tag just their one cell.
// anchor = the cell Step 4 (discovery / checklist) walks to; it is on or adjacent to a path tile.
// rects are [x0, z0, x1, z1] inclusive; cells are explicit [x, z] pairs.
export const HANOI_LANDMARKS = Object.freeze({
  hoankiem: Object.freeze({ anchor: Object.freeze([-1, -1]), rects: Object.freeze([Object.freeze([-2, -7, 1, 4])]), cells: Object.freeze([Object.freeze([2, -1]), Object.freeze([2, -3])]) }),
  ngocson: Object.freeze({ anchor: Object.freeze([5, -2]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([2, -2]), Object.freeze([3, -4]), Object.freeze([3, -3]), Object.freeze([3, -2]), Object.freeze([3, -1]), Object.freeze([4, -2]), Object.freeze([5, -2])]) }),
  westlake: Object.freeze({ anchor: Object.freeze([-9, -11]), rects: Object.freeze([Object.freeze([-19, -19, -7, -6])]), cells: Object.freeze([]) }),
  tranquoc: Object.freeze({ anchor: Object.freeze([-13, -12]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([-13, -12]), Object.freeze([-12, -12]), Object.freeze([-11, -12])]) }),
  oldquarter: Object.freeze({ anchor: Object.freeze([-6, -6]), rects: Object.freeze([Object.freeze([-8, -9, -3, -3])]), cells: Object.freeze([]) }),
  mausoleum: Object.freeze({ anchor: Object.freeze([-12, 3]), rects: Object.freeze([Object.freeze([-14, 3, -11, 7])]), cells: Object.freeze([]) }),
  vanmieu: Object.freeze({ anchor: Object.freeze([-8, 11]), rects: Object.freeze([Object.freeze([-10, 9, -6, 13])]), cells: Object.freeze([]) }),
  onepillar: Object.freeze({ anchor: Object.freeze([-8, 4]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([-8, 4]), Object.freeze([-7, 4])]) }),
  cathedral: Object.freeze({ anchor: Object.freeze([7, -1]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([7, -1])]) }),
  opera: Object.freeze({ anchor: Object.freeze([9, 7]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([9, 7])]) }),
  longbien: Object.freeze({ anchor: Object.freeze([17, -6]), rects: Object.freeze([]), cells: Object.freeze([Object.freeze([17, -6]), Object.freeze([18, -6])]) }),
});
