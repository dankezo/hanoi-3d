// Hanoi-only landmark models (owner: hanoi agent). Step 3 placeholder tiles for ?map=hanoi.
// These models live ONLY here, never in core/models.js: src/world/tiles.js derives one WFC solver
// option per model in MODELS, and src/world/wfc.js throws above 96 options (95 are used). A
// Hanoi-only registry keeps OPTIONS at 95 and the default WFC path byte-identical, while the Hanoi
// provider (src/world/hanoi.js) and the placeholder builder (src/assets/loader.js) resolve them.
// Socket rule: every Hanoi model copies the rot 0 sockets of the v0 stand-in it replaces, at the
// same rot, so the authored grid stays socket-consistent (0 mismatches) by construction.
// Tags also copy the stand-in, so walkability, the book bake and the atlas map behave the same.
// No long dashes in this file: only short hyphens (-).
import { rotateSockets } from '../core/models.js';

const g = 'grass';
const p = 'path';
const r = 'river';
const S = (n, e, s, w) => ({ n, e, s, w });

/** id -> { sockets (rot 0), tags }. Same shape as MODELS entries, Hanoi-only. */
export const HANOI_MODELS = Object.freeze({
  // Turtle Tower on Hoan Kiem Lake (was watchtower, rot 0). Phase 3B: the tower now
  // stands on a 1-cell island mid-lake, so its sockets are the all-grass sockets of
  // the pond cell it replaces (the old south path socket met the shore path, which
  // the new lake floods). Tags unchanged.
  hanoi_turtletower: { sockets: S(g, g, g, g), tags: ['path', 'landmark', 'blocker'] },
  // Ngoc Son Temple (was manor, rot 1, door west).
  hanoi_ngocson: { sockets: S(g, g, p, g), tags: ['path', 'house', 'landmark', 'blocker'] },
  // The Huc Bridge, red (was bridge, rot 1, path E-W over river N-S).
  hanoi_thehuc: { sockets: S(p, r, p, r), tags: ['path', 'water', 'bridge'] },
  // Tran Quoc Pagoda on West Lake (was manor, rot 0).
  hanoi_tranquoc: { sockets: S(g, g, p, g), tags: ['path', 'house', 'landmark', 'blocker'] },
  // Old Quarter tube houses (was village, rot 0/1, N-S street, houses both sides).
  hanoi_tubehouse: { sockets: S(p, g, p, g), tags: ['path', 'house', 'village', 'blocker'] },
  // Old Quarter large house + garden (was village_b, rot 0/1).
  hanoi_tubehouse_b: { sockets: S(p, g, p, g), tags: ['path', 'house', 'village', 'blocker'] },
  // Old Quarter green (was village_green, rot 0/1: well, bench, lamp post, two trees, no house).
  hanoi_tubehouse_green: { sockets: S(p, g, p, g), tags: ['path', 'village'] },
  // Ho Chi Minh Mausoleum (was barn_farm, rot 0).
  hanoi_mausoleum: { sockets: S(g, g, g, g), tags: ['landmark', 'blocker'] },
  // Ba Dinh Square (was market_square, rot 0).
  hanoi_badinh: { sockets: S(p, p, p, p), tags: ['path', 'landmark'] },
  // Temple of Literature (was manor, rot 0).
  hanoi_vanmieu: { sockets: S(g, g, p, g), tags: ['path', 'house', 'landmark', 'blocker'] },
  // One Pillar Pagoda (was blossom_gazebo, rot 1).
  hanoi_onepillar: { sockets: S(g, g, p, g), tags: ['path', 'landmark', 'blocker'] },
  // St Joseph's Cathedral (was church, rot 0).
  hanoi_cathedral: { sockets: S(g, g, p, g), tags: ['path', 'landmark', 'blocker'] },
  // Hanoi Opera House (was manor, rot 0).
  hanoi_opera: { sockets: S(g, g, p, g), tags: ['path', 'house', 'landmark', 'blocker'] },
  // Long Bien Bridge, steel truss (was bridge, rot 1, path E-W over river N-S).
  hanoi_longbien: { sockets: S(p, r, p, r), tags: ['path', 'water', 'bridge'] },
  // ---- Phase 2B street elements (Old Quarter only). Each copies the sockets + tags of the
  // cell it replaces, so the authored grid stays socket-consistent (0 mismatches) by
  // construction. All 11 are Hanoi-only: the WFC solver option count stays at 95.
  // Road junction with zebra crossing (was path_cross, rot 0, all path).
  hanoi_road: { sockets: S(p, p, p, p), tags: ['path'] },
  // Sidewalk slab (was meadow, all grass; pavement print on the base, kerb flap).
  hanoi_sidewalk: { sockets: S(g, g, g, g), tags: [] },
  // Street tree (was meadow, all grass).
  hanoi_tree: { sockets: S(g, g, g, g), tags: [] },
  // Bush (was meadow, all grass).
  hanoi_bush: { sockets: S(g, g, g, g), tags: [] },
  // Traffic light (was path_end, rot 2, socket at N).
  hanoi_trafficlight: { sockets: S(g, g, p, g), tags: ['path'] },
  // Traffic police standing in the street (was village_green rot 1, path E-W).
  hanoi_police: { sockets: S(p, g, p, g), tags: ['path', 'village'] },
  // Pedestrians, static paper figures (was village rot 1, path E-W).
  hanoi_pedestrian: { sockets: S(p, g, p, g), tags: ['path', 'village'] },
  // Street vendor with baskets (was meadow, all grass).
  hanoi_vendor: { sockets: S(g, g, g, g), tags: ['village'] },
  // Pho stall (was meadow, all grass).
  hanoi_phostall: { sockets: S(g, g, g, g), tags: ['village'] },
  // Electric pole with crossarm (was meadow, all grass).
  hanoi_pole: { sockets: S(g, g, g, g), tags: ['village'] },
  // Street lamp (was meadow, all grass).
  hanoi_lamp: { sockets: S(g, g, g, g), tags: ['village'] },
  // ---- Phase 3A street elements (vibe Ha Noi that). Each copies the sockets + tags of the
  // cell it replaces, so the authored grid stays socket-consistent (0 mismatches) by
  // construction. All 16 are Hanoi-only: the WFC solver option count stays at 95.
  // Corner house at the Ta Hien junction (was path_cross, rot 0, all path, walkable).
  hanoi_cornerhouse: { sockets: S(p, p, p, p), tags: ['path'] },
  // Beer signs, the 4-sign set from photo A1 (was meadow, all grass).
  hanoi_sign_phoco: { sockets: S(g, g, g, g), tags: ['village'] },
  hanoi_sign_biahoi: { sockets: S(g, g, g, g), tags: ['village'] },
  hanoi_sign_trucbach: { sockets: S(g, g, g, g), tags: ['village'] },
  hanoi_sign_paramount: { sockets: S(g, g, g, g), tags: ['village'] },
  // Red flag with yellow star (was meadow, all grass; base print is granite like a sidewalk).
  hanoi_flag: { sockets: S(g, g, g, g), tags: ['village'] },
  // Red vertical banner "30-4" (was meadow, all grass; granite base print).
  hanoi_banner: { sockets: S(g, g, g, g), tags: ['village'] },
  // Sau tree with golden leaves (was meadow, all grass).
  hanoi_sautree: { sockets: S(g, g, g, g), tags: [] },
  // Parked motorbikes, one model per colour (was meadow, all grass; granite base print).
  hanoi_bike_red: { sockets: S(g, g, g, g), tags: ['village'] },
  hanoi_bike_blue: { sockets: S(g, g, g, g), tags: ['village'] },
  hanoi_bike_black: { sockets: S(g, g, g, g), tags: ['village'] },
  // Folk-painting mural wall, 2 tiles long (was meadow, all grass).
  hanoi_mural: { sockets: S(g, g, g, g), tags: [] },
  // Narrow west alley, houses tight on both sides (was meadow, all grass).
  hanoi_alley: { sockets: S(g, g, g, g), tags: [] },
  // Street vendor on the main street (was village_green rot 1, path E-W, walkable).
  hanoi_vendor_street: { sockets: S(p, g, p, g), tags: ['path', 'village'] },
  // Pho stall on the main street (was village rot 1, path E-W, walkable).
  hanoi_phostall_street: { sockets: S(p, g, p, g), tags: ['path', 'village'] },
  // Electric pole on the house row (was village rot 0, path N-S, blocker like a tubehouse).
  hanoi_pole_street: { sockets: S(p, g, p, g), tags: ['path', 'house', 'village', 'blocker'] },
  // ---- Phase 3B lake models (Ho Guom + Ho Tay). Each copies the sockets + tags of the
  // cell it replaces, so the authored grid stays socket-consistent (0 mismatches) by
  // construction. All 6 are Hanoi-only: the WFC solver option count stays at 95.
  // Ho Guom pond, dark green water (was pond, all grass, water + blocker).
  hanoi_pond_guom: { sockets: S(g, g, g, g), tags: ['water', 'blocker'] },
  // Ho Tay pond, deep blue water (was pond, all grass, water + blocker).
  hanoi_pond_tay: { sockets: S(g, g, g, g), tags: ['water', 'blocker'] },
  // Lotus pond in the south-west corner of Ho Tay (was pond, all grass, water + blocker).
  hanoi_lotus: { sockets: S(g, g, g, g), tags: ['water', 'blocker'] },
  // Low stone bridge to the Tran Quoc islet (was pond; sockets copy path_straight
  // rot 0, walkable - the traveller crosses it to reach the pagoda). The legend rot 1
  // turns it E-W at placement, like the stock bridge it replaces.
  hanoi_stonebridge: { sockets: S(p, g, p, g), tags: ['path'] },
  // Pen Tower on the north-east shore of Ho Guom (was village rot 1 on the main
  // street; sockets copy watchtower rot 3, path socket east toward the street).
  hanoi_pentower: { sockets: S(g, g, p, g), tags: ['path', 'landmark', 'blocker'] },
  // Mausoleum side wing, second tile of the 2-tile mausoleum (was meadow, all grass).
  hanoi_mausoleum_wing: { sockets: S(g, g, g, g), tags: ['landmark', 'blocker'] },
});

export const HANOI_MODEL_IDS = Object.freeze(Object.keys(HANOI_MODELS));

const HANOI_TILES = new Map(Object.entries(HANOI_MODELS).map(([id, m]) => [id, Object.freeze({
  id,
  model: id,
  sockets: Object.freeze({ ...m.sockets }),
  tags: Object.freeze(m.tags.slice()),
})]));

/** Tile record for a Hanoi model id (same shape as tiles.js getTile), or null when not Hanoi-only. */
export function getHanoiTile(id) {
  return HANOI_TILES.get(id) || null;
}

/** Sockets of a Hanoi model after `rot` clockwise quarter turns (shared frozen object), or null. */
const HANOI_SOCKET_CACHE = new Map();
export function hanoiSocketsOf(id, rot = 0) {
  const m = HANOI_MODELS[id];
  if (!m) return null;
  const r = ((rot % 4) + 4) % 4;
  const key = id + ':' + r;
  let s = HANOI_SOCKET_CACHE.get(key);
  if (!s) { s = Object.freeze(rotateSockets(m.sockets, r)); HANOI_SOCKET_CACHE.set(key, s); }
  return s;
}
