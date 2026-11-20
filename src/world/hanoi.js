// Static Hanoi map provider (owner: hanoi agent). Same interface as src/world/wfc.js createWFC:
//   { seed, get(x, z), peek(x, z), ensureRegion(cx, cz, r), size, stats, chunkSize: 8, chunkInfo(x, z) }
// Differences from WFC: the page is a fixed 40x40 authored grid (src/world/hanoi-map.js),
// there is no origin offset (grid coords ARE world cell coords, spawn (0, 0) is a path tile),
// and every cell record carries an extra `landmarkId` (string id or null).
// Landmark rule: every cell belonging to a landmark's area carries that landmark's id;
// single-building landmarks tag just their one cell. Step 4 (discovery / checklist) reads
// cell.landmarkId from the traveller's current cell.
// Out-of-grid get() returns a frozen forest cell (blocker, biome hanoi, landmarkId null),
// so the page edge reads as a tree border and nothing can walk or route there.
// Biome note: cell.biome is 'hanoi' everywhere (Step 6: its own biomeTint + water palette entries,
// so the Hanoi map reads terracotta roofs / teal lakes while the warm paper base stays). The Voronoi
// biome (core/biomes.js) is still used by game progress + scraps for flavour and may return desert /
// snow at the map edges - cosmetic only, out of scope for this step.
// No long dashes in this file: only short hyphens (-).
import { getTile, socketsOf } from './tiles.js';
import { getHanoiTile, hanoiSocketsOf } from './hanoi-models.js';
import { HANOI_SIZE, HANOI_MIN, HANOI_OFFSET, HANOI_ROWS, HANOI_LEGEND, HANOI_LANDMARKS } from './hanoi-map.js';

const COORD_LIMIT = 1 << 24;
const MAX = HANOI_MIN + HANOI_SIZE - 1; // 19

const sane = (v) => {
  if (!(v >= -COORD_LIMIT && v <= COORD_LIMIT)) v = v > COORD_LIMIT ? COORD_LIMIT : v < -COORD_LIMIT ? -COORD_LIMIT : 0;
  return Math.round(v);
};

const inGrid = (x, z) => x >= HANOI_MIN && x <= MAX && z >= HANOI_MIN && z <= MAX;

export function createHanoi({ seed = 1 } = {}) {
  seed = (Number(seed) || 0) | 0;
  const stats = { chunks: 1, attempts: 0, backtracks: 0, restarts: 0, strictChunks: 0, fallbackChunks: 0, planFails: 0, validateFails: 0, evicted: 0 };

  // landmarkId lookup: "x,z" -> id (a cell belongs to at most one landmark area)
  const landmarkOf = new Map();
  for (const [id, lm] of Object.entries(HANOI_LANDMARKS)) {
    for (const [x0, z0, x1, z1] of lm.rects) {
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) landmarkOf.set(x + ',' + z, id);
    }
    for (const [x, z] of lm.cells) landmarkOf.set(x + ',' + z, id);
  }

  // Precompute all 1600 frozen cell records once at creation.
  const cells = new Array(HANOI_SIZE * HANOI_SIZE);
  for (let z = HANOI_MIN; z <= MAX; z++) {
    const row = HANOI_ROWS[z + HANOI_OFFSET];
    for (let x = HANOI_MIN; x <= MAX; x++) {
      const spec = HANOI_LEGEND[row[x + HANOI_OFFSET]] || HANOI_LEGEND['.'];
      // Step 3: landmark anchors use Hanoi-only models (src/world/hanoi-models.js), never MODELS,
      // so the WFC solver option count stays at 95; every other cell uses the stock catalogue.
      const ht = getHanoiTile(spec.tileId);
      const t = ht || getTile(spec.tileId);
      cells[(z + HANOI_OFFSET) * HANOI_SIZE + (x + HANOI_OFFSET)] = Object.freeze({
        x, z, tileId: t.id, model: t.model, rot: spec.rot,
        sockets: ht ? hanoiSocketsOf(spec.tileId, spec.rot) : socketsOf(t.id, spec.rot), tags: t.tags, biome: 'hanoi',
        landmarkId: landmarkOf.get(x + ',' + z) || null,
      });
    }
  }
  const cellAt = (x, z) => cells[(z + HANOI_OFFSET) * HANOI_SIZE + (x + HANOI_OFFSET)];

  const outTile = getTile('forest');
  const outCell = (x, z) => Object.freeze({
    x, z, tileId: outTile.id, model: outTile.model, rot: 0,
    sockets: socketsOf(outTile.id, 0), tags: outTile.tags, biome: 'hanoi', landmarkId: null,
  });

  return {
    seed,
    /** Collapsed cell. Always returns a valid cell; never throws. */
    get(x, z) {
      if ((x | 0) !== x || (z | 0) !== z || x > COORD_LIMIT || x < -COORD_LIMIT || z > COORD_LIMIT || z < -COORD_LIMIT) { x = sane(+x); z = sane(+z); }
      return inGrid(x, z) ? cellAt(x, z) : outCell(x, z);
    },
    /** Like get() but returns null if the cell is out of the grid (no side effects). */
    peek(x, z) {
      x = sane(+x); z = sane(+z);
      return inGrid(x, z) ? cellAt(x, z) : null;
    },
    /** Static map: every cell already exists, so this is a no-op (kept for provider parity). */
    ensureRegion(cx, cz, r) {
      // No-op: all 1600 cells exist from creation.
    },
    get size() { return HANOI_SIZE * HANOI_SIZE; },
    /** Solver counters (checks / debugging): same shape as the WFC stats, all zero except chunks. */
    stats,
    chunkSize: 8,
    /** Debug: the 8x8 chunk holding cell (x, z). Plain floor division, no origin offset. */
    chunkInfo(x, z) {
      const cx = Math.floor(sane(+x) / 8);
      const cz = Math.floor(sane(+z) / 8);
      return { cx, cz, attempts: 0, fallback: false, crossings: { rivers: [], roads: [] } };
    },
  };
}
