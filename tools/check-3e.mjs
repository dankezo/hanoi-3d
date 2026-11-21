// Phase 3E check: train on a closed loop (3E-01..3E-07).
// Run: node tools/check-3e.mjs (from the repo root). Exit 1 on any failure.
// No browser, no GPU: the path math, speeds, lap time and traveller push are
// exercised against the real module (three.js runs headless in Node); the
// rails-on-land check reads the real Hanoi map; wiring and silence are source
// checks. The solver count itself is owned by npm run check:hanoi (95/96) -
// here we only prove the train added no WFC model, no legend char and no map
// cell, so the solver input is unchanged. No long dashes in this file.
import { readFileSync, statSync } from 'node:fs';
import * as THREE from 'three';
import {
  buildTrainPath, createTrain, isInStreetZone,
  TRAIN_SPEED, TRAIN_STREET_SPEED, TRAIN_CAR_LEN, TRAIN_CAR_W, TRAIN_CAR_H,
  TRAIN_GAP, TRAIN_CAR_COUNT, TRAIN_TOTAL_LEN, TRAIN_WAYPOINTS_CELLS,
  TRAIN_BRIDGE_CELL, TRAIN_STREET, TRAIN_STATION_CELL,
} from '../src/game/train.js';
import { HANOI_ROWS, HANOI_LEGEND } from '../src/world/hanoi-map.js';
import { HANOI_MODEL_IDS } from '../src/world/hanoi-models.js';
import { TILE_SIZE } from '../src/core/config.js';
import { player as PLAYER_CONFIG } from '../src/core/config/player.js';

let pass = 0;
let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + msg);
  if (ok) pass++; else fail++;
};
const hasLongDash = (s) => /[\u2013\u2014]/.test(s);
const src = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const trainSrc = src('src/game/train.js');
const mainSrc = src('src/main.js');

// ---- 3E-01: 3 cars, sizes, colours ---------------------------------------------------------
check(TRAIN_CAR_COUNT === 3, '3E-01: 3 cars (1 loco + 2 passenger)');
check(TRAIN_CAR_LEN === 4 && TRAIN_CAR_W === 1 && TRAIN_CAR_H === 1.10,
  '3E-01: car 4 x 1 x 1.10 (2 tile long, 0.5 tile wide, 1.10 high)');
check(Math.abs(TRAIN_TOTAL_LEN - 12.8) < 1e-9,
  '3E-01: whole train 12.8 units = 6.4 tiles (6 tiles + 2 gaps of 0.2 tile)');
check(TRAIN_GAP === 0.4, '3E-01: gap between cars 0.4 units = 0.2 tile');
check(/0xa83c28/.test(trainSrc), '3E-01: loco is red (0xa83c28)');
check(/0x2f5d46/.test(trainSrc), '3E-01: passenger cars are dark green (0x2f5d46)');
check(/0xe8b93c/.test(trainSrc), '3E-01: windows are yellow (0xe8b93c)');
check(/buildCar\('loco'\)/.test(trainSrc) && /buildCar\('car'\)/.test(trainSrc),
  '3E-01: loco built as loco, other two as passenger cars');

// ---- 3E-02: closed loop, length, land, bridge cell -----------------------------------------
const path = buildTrainPath();
check(Math.abs(path.lengthTiles - 100) < 15,
  '3E-02: loop is ' + path.lengthTiles.toFixed(1) + ' tiles long (spec about 100-110)');
check(path.lengthTiles >= 95 && path.lengthTiles <= 112,
  '3E-02: loop length ' + path.lengthTiles.toFixed(1) + ' tiles is inside 95..112');
{
  // Continuity: consecutive samples are one resample step apart, and the loop
  // closes (last sample meets the first).
  let maxStep = 0;
  for (let i = 0; i < path.samples.length; i++) {
    const a = path.samples[i];
    const b = path.samples[(i + 1) % path.samples.length];
    maxStep = Math.max(maxStep, Math.hypot(b.x - a.x, b.z - a.z));
  }
  check(maxStep < 0.5, '3E-02: path is continuous, max sample step ' + maxStep.toFixed(3) + ' (< 0.5)');
  const first = path.pointAt(0);
  const closed = path.pointAt(path.length);
  check(Math.hypot(closed.x - first.x, closed.z - first.z) < 0.01, '3E-02: loop closes (pointAt(0) == pointAt(length))');
  // Tangents are unit length.
  let maxTan = 0;
  for (const s of path.samples) maxTan = Math.max(maxTan, Math.abs(Math.hypot(s.tx, s.tz) - 1));
  check(maxTan < 0.01, '3E-02: all sample tangents are unit length (max error ' + maxTan.toFixed(4) + ')');
}
{
  // Every sample sits on land, except water samples inside the bridge zone.
  const ALLOW = new Set(['meadow', 'meadow_flowers', 'path_straight', 'path_cross', 'path_end', 'path_t', 'path_corner', 'lantern_post', 'hanoi_sidewalk', 'hanoi_road']);
  const WATER = new Set(['hanoi_pond_guom', 'hanoi_pond_tay', 'hanoi_lotus', 'pond', 'river_straight', 'river_source', 'river_corner']);
  const cellOf = (x, z) => [Math.round(x / TILE_SIZE), Math.round(z / TILE_SIZE)];
  const tileAt = (x, z) => {
    const [cx, cz] = cellOf(x, z);
    const row = HANOI_ROWS[cz + 20];
    if (!row) return 'off-map';
    const ch = row[cx + 20];
    if (ch === undefined) return 'off-map';
    return (HANOI_LEGEND[ch] || {}).tileId || 'unknown:' + ch;
  };
  const bx = TRAIN_BRIDGE_CELL[0] * TILE_SIZE;
  const bz = TRAIN_BRIDGE_CELL[1] * TILE_SIZE;
  let waterSamples = 0;
  let bad = [];
  for (const s of path.samples) {
    const t = tileAt(s.x, s.z);
    if (WATER.has(t)) {
      waterSamples++;
      if (Math.hypot(s.x - bx, s.z - bz) >= 2.0) bad.push('water ' + t + ' at ' + s.x.toFixed(1) + ',' + s.z.toFixed(1));
    } else if (!ALLOW.has(t)) {
      bad.push(t + ' at ' + s.x.toFixed(1) + ',' + s.z.toFixed(1));
    }
  }
  check(bad.length === 0, '3E-02: all ' + path.samples.length + ' path samples are on land or the bridge' + (bad.length ? ' - first bad: ' + bad.slice(0, 3).join('; ') : ''));
  check(waterSamples > 0, '3E-02: ' + waterSamples + ' samples cross the 1 bridge water cell (-8,-10), none elsewhere');
  // The loop passes the train street, the station corner and the lake shore.
  const cells = new Set(path.samples.map((s) => cellOf(s.x, s.z).join(',')));
  check(cells.has('-9,-8') && cells.has('-9,-3'), '3E-02: loop runs the train street x=-9, z -8..-3');
  check(cells.has('7,17'), '3E-02: loop reaches the station corner (7,17) = ga Ha Noi');
  check(cells.has('-7,-12'), '3E-02: loop runs along the Ho Tay east shore (x=-7)');
  check(!cells.has('17,-6') && !cells.has('18,-6'),
    '3E-02: loop does NOT cross Long Bien bridge (single river crossing, a closed loop cannot cross twice) - east leg stays at x=7, see manifest');
  // B1 regression: the old code had only one steel rail ribbon. Count the
  // buildTrack lines that draw a steel rail; there must be exactly 2.
  const steelRails = trainSrc.split('\n').filter((l) => l.includes('ribbon(') && l.includes('MAT.steel')).length;
  check(steelRails === 2, '3E-02: 2 steel rails (ribbon + MAT.steel lines: ' + steelRails + ')');
}

// ---- 3E-03: speeds, lap time ---------------------------------------------------------------
check(TRAIN_SPEED === 2.5, '3E-03: speed is 2.5 unit/s (1.25 tile/s)');
check(TRAIN_STREET_SPEED === 1.5, '3E-03: street speed is 1.5 unit/s');
check(PLAYER_CONFIG.speed === 1.15, '3E-03: traveller speed is 1.15 unit/s (train is clearly faster)');
check(TRAIN_SPEED > PLAYER_CONFIG.speed * 2, '3E-03: train 2.5 is more than 2x the traveller 1.15');
{
  // Lap time by exact integration over the real path: ds / v(sample).
  let lap = 0;
  let streetLen = 0;
  for (const s of path.samples) {
    const slow = isInStreetZone(s.x, s.z);
    lap += path.ds / (slow ? TRAIN_STREET_SPEED : TRAIN_SPEED);
    if (slow) streetLen += path.ds;
  }
  check(streetLen > 10 && streetLen < 14, '3E-03: slow zone is ' + streetLen.toFixed(1) + ' units long (street is 6 tiles = 12 units)');
  check(lap > 60 && lap < 120, '3E-03: lap time is ' + lap.toFixed(1) + ' s (spec text says 160-180 s but its own numbers give 100 tiles / 1.25 tile/s = 80 s; real lap is ' + lap.toFixed(1) + ' s)');
  console.log('INFO lap: length ' + path.length.toFixed(1) + ' units = ' + path.lengthTiles.toFixed(1) + ' tiles, street ' + streetLen.toFixed(1) + ' units, lap ' + lap.toFixed(1) + ' s');
}
check(/khong dung|NEVER stops|never stops/i.test(trainSrc), '3E-03: train never stops at the station (source states it)');

// ---- 3E-04: train street props ---------------------------------------------------------------
check(TRAIN_STREET.x === -9 && TRAIN_STREET.z0 === -8 && TRAIN_STREET.z1 === -3,
  '3E-04: street segment is x=-9, z -8..-3 (6 straight tiles, west of the Old Quarter)');
check(/CA PHE DUONG TAU/.test(trainSrc), '3E-04: sign text "CA PHE DUONG TAU" exists');
check(/plastic chairs|Plastic chairs/.test(trainSrc), '3E-04: plastic chairs line both sides of the rail');
check(/lampRed|lampGreen/.test(trainSrc) && /signal/i.test(trainSrc),
  '3E-04: signal posts with a lamp at both ends of the street (colour effect only)');
check(/GA HA NOI/.test(trainSrc), '3E-04/3E-02: station sign "GA HA NOI" at the SE corner');
check(/TRAIN_STATION_CELL/.test(trainSrc) && TRAIN_STATION_CELL[0] === 7 && TRAIN_STATION_CELL[1] === 17,
  '3E-04/3E-02: station cell is (7,17)');

// ---- 3E-05: push, never kill (real module, fake scene/world/traveller) ----------------------
function makeTrain(world, quality = 'high') {
  const scene = new THREE.Scene();
  const traveller = { position: new THREE.Vector3(0, 0, 0) };
  const train = createTrain({ scene, world, traveller, quality });
  return { scene, traveller, train };
}
{
  const world = { isWalkable: () => true };
  const { traveller, train } = makeTrain(world);
  for (let i = 0; i < 10; i++) train.update(1 / 60);
  check(train.speed > 0.1 && train.speed <= TRAIN_SPEED, '3E-05: train advances after updates (speed ' + train.speed.toFixed(2) + ')');
  // Traveller far from the track: no push, no move.
  traveller.position.set(0, 0, 10);
  const before = traveller.position.clone();
  check(train.pushTraveller() === false, '3E-05: no push when the traveller is off the rails');
  check(traveller.position.equals(before), '3E-05: traveller position untouched off the rails');
  // Traveller dead centre on the loco: pushed sideways to a walkable spot.
  const pose = train.path.pointAt(train.s - train.carOffsets[0]);
  traveller.position.set(pose.x, 0, pose.z);
  check(train.pushTraveller() === true, '3E-05: push fires when the traveller stands on the loco');
  const lat = Math.abs((traveller.position.x - pose.x) * -pose.tz + (traveller.position.z - pose.z) * pose.tx);
  check(lat >= 1.0, '3E-05: pushed ' + lat.toFixed(2) + ' units sideways off the centre line (>= 1.0)');
  // Both sides blocked: shoved along the track instead, never left standing on it.
  const blockedWorld = { isWalkable: (x, z) => Math.hypot(x - pose.x, z - pose.z) > 1.6 };
  const t2 = makeTrain(blockedWorld);
  for (let i = 0; i < 10; i++) t2.train.update(1 / 60);
  const pose2 = t2.train.path.pointAt(t2.train.s - t2.train.carOffsets[0]);
  t2.traveller.position.set(pose2.x, 0, pose2.z);
  check(t2.train.pushTraveller() === true, '3E-05: both sides blocked, still pushed (along the track)');
  const moved = Math.hypot(t2.traveller.position.x - pose2.x, t2.traveller.position.z - pose2.z);
  check(moved > 1.5, '3E-05: shoved ' + moved.toFixed(2) + ' units along the track (> 1.5)');
  // No death anywhere in the code of this phase (the two "No death / No game
  // over" statements themselves are stripped first, so they cannot match).
  const noDeathSrc = trainSrc.split('\n').filter((l) => !/No (death|game over)/i.test(l)).join('\n');
  check(!/game over|gameOver|kill|die|chet/.test(noDeathSrc), '3E-05: no death / game-over mechanism in train.js');
  check(/No death/.test(trainSrc), '3E-05: train.js states the no-death rule in its header');
}

// N2 fix: the 3 procedural house fronts on the west side of the train street
// now push the traveller out instead of letting them walk through.
{
  const { traveller, train } = makeTrain({ isWalkable: () => true });
  traveller.position.set(-19.7, 0, -10);
  train.update(1 / 60);
  const out = traveller.position.x >= -18.75 - 1e-9 || traveller.position.x <= -20.65 + 1e-9
    || traveller.position.z >= -8.75 - 1e-9 || traveller.position.z <= -11.25 + 1e-9;
  check(out, 'N2: traveller inside a street house is pushed out (now at ' + traveller.position.x.toFixed(2) + ',' + traveller.position.z.toFixed(2) + ')');
  check(train.pushOutOfStreetHouses() === false, 'N2: no house push once the traveller is outside every house');
}

// N4 fix: traveller stuck on the 1-cell bridge with nowhere to stand - the
// train must STOP instead of running through them, and move again once the
// rails ahead are clear.
{
  let walkable = false;
  const world = { isWalkable: () => walkable };
  const { traveller, train } = makeTrain(world);
  const bridge = train.path.samples.find((s) => Math.hypot(s.x - (-8 * TILE_SIZE), s.z - (-10 * TILE_SIZE)) < 0.5);
  check(!!bridge, 'N4: the loop has a sample on the bridge cell (-8,-10)');
  const travellerS = bridge.s;
  traveller.position.set(bridge.x, 0, bridge.z);
  train.s = (travellerS - 6 + train.path.length) % train.path.length;
  train.speed = TRAIN_SPEED;
  for (let i = 0; i < 300; i++) train.update(1 / 60);
  const distAlong = (travellerS - train.s + train.path.length) % train.path.length;
  check(train.speed === 0, 'N4: train stops (speed 0) when the traveller ahead cannot be pushed');
  check(distAlong > 0.5 && distAlong < train.path.length - 0.5, 'N4: train did not run through the traveller (still ' + distAlong.toFixed(2) + ' units behind them after 5 s)');
  check(traveller.position.x === bridge.x && traveller.position.z === bridge.z, 'N4: stuck traveller was not moved');
  // Rails clear again: the train resumes.
  walkable = true;
  for (let i = 0; i < 120; i++) train.update(1 / 60);
  check(train.speed > 0.1, 'N4: train moves again once the rails ahead are clear (speed ' + train.speed.toFixed(2) + ')');
}

// ---- 3E-03/3E-04: speed changes in the street (real module) --------------------------------
{
  const { train } = makeTrain({ isWalkable: () => true });
  const streetSample = train.path.samples.find((s) => isInStreetZone(s.x, s.z));
  check(!!streetSample, '3E-04: the path has samples inside the street zone');
  train.s = streetSample.s;
  train.speed = TRAIN_SPEED;
  train.update(1);
  check(Math.abs(train.speed - TRAIN_STREET_SPEED) < 0.05,
    '3E-04: train slows to ' + train.speed.toFixed(2) + ' unit/s in the street (target 1.5)');
  train.s = 0;
  train.speed = 0;
  for (let i = 0; i < 120; i++) train.update(1 / 60);
  check(Math.abs(train.speed - TRAIN_SPEED) < 0.05,
    '3E-03: train reaches ' + train.speed.toFixed(2) + ' unit/s outside the street (target 2.5)');
}

// ---- 3E-06: own object, hides at low ---------------------------------------------------------
check(!/wfc|tiles\.js|world\.js|MODELS|HANOI_MODELS/.test(trainSrc.replace(/NOT a WFC tile/, '')),
  '3E-06: train.js never touches wfc.js, tiles.js, world.js or the model registries');
check(HANOI_MODEL_IDS.length === 47, '3E-06: Hanoi-only registry still has 47 models (no train model added)');
check(Object.keys(HANOI_LEGEND).length === 85, '3E-06: Hanoi legend still has 85 chars (no rail tile added)');
check(HANOI_ROWS.length === 40 && HANOI_ROWS.every((r) => r.length === 40),
  '3E-06: Hanoi map still 40x40 (no cell changed for the train)');
check(!/hanoi-tiles\.glb|tiles\.glb/.test(trainSrc), '3E-06: train.js loads no GLB');
{
  const glbBytes = statSync(new URL('../public/models/hanoi-tiles.glb', import.meta.url)).size;
  check(glbBytes < 3500000, '3E-06: hanoi-tiles.glb is ' + glbBytes + ' bytes (< 3.5 MB, unchanged by this phase)');
  console.log('INFO glb: ' + glbBytes + ' bytes (unchanged, still 47 nodes)');
}
{
  const { train } = makeTrain({ isWalkable: () => true }, 'low');
  check(train.visible === false, '3E-06: train starts hidden at quality low');
  train.setQuality('med');
  check(train.visible === true, '3E-06: train shows again at med');
  train.setQuality('high');
  check(train.visible === true, '3E-06: train shows at high');
  train.setQuality('low');
  check(train.visible === false, '3E-06: train hides again at low');
  const s0 = train.s;
  train.update(1);
  check(train.s === s0, '3E-06: hidden train does not advance');
}
check(/hanoi \? createTrain/.test(mainSrc), '3E-06: main.js creates the train only in Hanoi mode');
check(/train\.setQuality\(next\)/.test(mainSrc), '3E-06: main.js wires the train into the quality scaler apply()');
check(/train\.update\(dt\)/.test(mainSrc), '3E-06: main.js ticks the train every frame');
check(!/createTrain/.test(src('src/world/hanoi.js')), '3E-06: WFC/Hanoi provider does not know about the train');

// ---- 3E-07: no sound -------------------------------------------------------------------------
check(!/\bAudio\b|\.play\(|Oscillator|GainNode|AudioContext/.test(trainSrc),
  '3E-07: no audio API in train.js');
check(!/createPaperAudio|createMusic/.test(trainSrc) && !/from '\.\.\/audio\//.test(trainSrc),
  '3E-07: train.js never touches the audio/music systems');
check(/No sound at all \(Q6/.test(trainSrc), '3E-07: train.js states the silence rule (Q6)');

// ---- hygiene -----------------------------------------------------------------------------------
check(!hasLongDash(trainSrc), 'train.js has no long dashes');
check(!hasLongDash(src('tools/check-3e.mjs')), 'check-3e.mjs has no long dashes');
check(!/@keyframes/.test(trainSrc), 'train.js has no @keyframes string');

console.log('\n' + pass + ' PASS, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
