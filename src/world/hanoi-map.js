// Hanoi static map (owner: hanoi agent). The authored 40x40 page for ?map=hanoi.
// DATA ONLY: one ASCII char per cell, plus a legend and the landmark areas.
// Grid coords x, z in [-20, 19]; row 0 is the north edge (z = -20), col 0 is the west edge (x = -20).
// The traveller spawns at (0, 0), a path_straight on the street just south of Hoan Kiem Lake.
// No long dashes in this file: only short hyphens (-).
//
// Landmark model mapping (v0 stand-ins, all existing models, no new MODELS entries):
//   hoankiem  - pond cluster + watchtower at (-1, -2) = Turtle Tower, causeway at (-1, -1)
//   ngocson   - manor at (5, -2) rot 1 (door west) + bridge at (3, -2) over a river channel
//   vanmieu   - manor at (-8, 11) = Temple of Literature
//   mausoleum - barn_farm at (-12, 3) + market_square at (-12, 5) = Ba Dinh Square
//   onepillar - blossom_gazebo at (-8, 4) beside a pond at (-7, 4)
//   cathedral - church at (7, -1) = St Joseph's Cathedral
//   longbien  - bridge rot 1 at (17, -6) and (18, -6) over the Red River
//   westlake  - pond cluster NW + manor at (-9, -11) rot 0 = Tran Quoc Pagoda on the east shore
//   oldquarter - village / village_b / village_green streets, x -8..2, z -9..-3
//   opera     - manor at (9, 7) = Hanoi Opera House
// The Red River (x 17..18) starts in river_source springs at z = -19 and ends in
// river_source sinks at z = 18, so no river socket ever faces off the page.

export const HANOI_SIZE = 40;
export const HANOI_MIN = -20;
export const HANOI_OFFSET = 20;

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
  'FF.....~~..|..V..v..........,,,,.....!!F',
  'FH.....,,,.|..v..V..........,,,,.....!!F',
  'FGFFFF.,,,.|..V..o...................!!F',
  'FFFFFF...h-+Uu+OU+uOUuO---a-=---=----BBf',
  'HFFFFF.....|..o..V........|..........!!H',
  'FF...~~....|..V..v.....s..|...GGGG...!!F',
  'FF.........|..g..g.....!..|...GGGG...!!F',
  'FH.........|.....~~W~~hB-m|...GGGG...!!F',
  'FG.........|.....~~|~~~S..|C..GGGG...!!F',
  'HFGGG..h-a-+-------c-a----+c----f....!!H',
  'FFGGG....|.|.........|....|..........!!F',
  'FFGGG....|.|...,,,,..|,,,,|,,,,...R..!!F',
  'FF......A|.|...,,,,..|,,,,|,,,,.~~...!!F',
  'FH......e|h+p~.,,,,..|,,,,|..........!!F',
  'HG....h-Kb.|...GGG...|GGG.|......R...!!H',
  'FF......||.|...GGG...|GGG.|..........!!F',
  'FF......gg.|...GGG...|GGG.|..M.......!!F',
  'FF....R..h-+--a------+----c--c--f....!!F',
  'FF.........|..|......|...............!!F',
  'HHFFF......|..|......|........GGGFFF.!!H',
  'FGFFF......|M.g......|........GGGFFF.!!F',
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
  B: { tileId: 'bridge', rot: 1 },
  '^': { tileId: 'bridge', rot: 0 },
  W: { tileId: 'watchtower', rot: 0 },
  M: { tileId: 'manor', rot: 0 },
  m: { tileId: 'manor', rot: 1 },
  C: { tileId: 'church', rot: 0 },
  K: { tileId: 'market_square', rot: 0 },
  A: { tileId: 'barn_farm', rot: 0 },
  P: { tileId: 'blossom_gazebo', rot: 0 },
  p: { tileId: 'blossom_gazebo', rot: 1 },
  V: { tileId: 'village', rot: 0 },
  v: { tileId: 'village_b', rot: 0 },
  o: { tileId: 'village_green', rot: 0 },
  U: { tileId: 'village', rot: 1 },
  u: { tileId: 'village_b', rot: 1 },
  O: { tileId: 'village_green', rot: 1 },
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
