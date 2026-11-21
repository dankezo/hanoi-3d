# Hanoi 3D - Map Basic grand structures (Phase 2A design)

Prepared 2026-11-21 from reading src/core/models.js. No code changed yet.

## Requirement

Replace the current small building cards in the Basic (WFC, default) map with LARGE, beautiful, randomly placed, self-designed structures.

## Engine constraint (read from the code, not guessed)

- Basic mode runs on WFC. WFC has NO fixed multi-tile placement. Every model is ONE tile (2 units wide).
- "Large" therefore means TALLER + more layered + more detailed, not multi-tile. Precedent: hanoi_cathedral's tallest flap is 1.35 (step 3). Grand models target flap height up to ~1.5, with 3-5 layered flaps (roof tiers, towers, awnings) and a full printed art card.
- Solver cap is HARD: 48 models -> 95 options, cap 96 (wfc.js:47-48 throws above 96). A new model adds ~1-2 options. So replacements must be 1:1 with the SAME socket signatures as the model they replace, keeping the option count at 95. Adding 2 extra models without removing 2 would risk 97-99 -> throw. (Same trick as step 3's Hanoi-only registry does NOT apply here - Basic IS the WFC path.)
- Multi-tile monuments (a 2x2 castle, a 3-tile market hall) would need a new WFC feature (fixed multi-cell placement with socket pre-decision). Flag as a possible follow-up, NOT the default plan.

## Current small buildings to replace (6)

From src/core/models.js (sockets S(N,E,S,W), g=grass, p=path, r=river):

- house S(g,g,p,g) tags path/house/blocker - small house, north half, door + path to S
- manor S(g,g,p,g) tags path/house/landmark/blocker - small manor
- barn_farm S(g,g,g,g) tags landmark/blocker - small barn
- village S(p,g,p,g) tags path/house/village/blocker - N-S street, houses both sides
- village_b S(p,g,p,g) tags path/house/village/blocker - one large cottage east + flower garden
- village_green S(p,g,p,g) tags path/village - well, bench, lamp post, two trees (no house)

Kept as-is (already read as landmarks): windmill, watchtower, church, market_square, desert_market, desert_ruin, snow_cabin, snow_hamlet, blossom_gazebo.

## 6 grand replacements (same sockets, same tags, taller + layered)

1. basic_townhouse (replaces house, S(g,g,p,g)): 3-storey paper townhouse, steep gabled roof, dormer window, shutters, flower boxes, chimney with smoke wisp. Height ~1.3. Palette: cream walls, terracotta roof, sage shutters.
2. basic_grandmanor (replaces manor, S(g,g,p,g)): manor house with a side tower, arched windows, garden wall + gate, two cypress trees. Height ~1.4 (tower). Palette: ochre walls, dusty rose roof, dark pine trees.
3. basic_greatbarn (replaces barn_farm, S(g,g,g,g)): great barn with a round silo, haystacks, cart, fence run. Height ~1.2 (silo 1.4). Palette: kraft timber, rust roof, straw gold.
4. basic_marketstreet (replaces village, S(p,g,p,g)): market street - houses both sides + striped awnings, stalls with fruit, hanging lanterns, bunting across the lane. Height ~1.1 (awnings layer). Palette: terracotta + teal awnings, lantern gold.
5. basic_gardencottage (replaces village_b, S(p,g,p,g)): large cottage + walled flower garden, pond with reeds, stone lantern. Height ~1.0. Palette: blossom pink, sage, cream.
6. basic_townsquare (replaces village_green, S(p,g,p,g)): town square - central fountain with water, four lamp posts, benches, two large trees, pigeon flock. Height ~1.1 (fountain tier). Palette: stone grey-cream, teal water, lantern gold.

## Implementation (same route as step 5, proven)

- Scripted GLB nodes (no Blender in sandbox) in a new public/models/basic-grand.glb, adopted by the loader; Step-3-style RECIPES placeholders kept as fallback.
- One atlas art card per model (uv1 = new atlas rect), white vertex colours.
- Solver check: npm run check:hanoi (or a check:basic equivalent) must still print 95 <= 96, MODELS still 48, 0 socket mismatches.
- Build + verify-glb pass, then QA team + his device check, then push (one named build).

## Open decision for the user

- Multi-tile monuments (2x2 castle etc.) as a follow-up? It needs a WFC extension (fixed multi-cell placement) - a medium job, not included in 2A as drafted.
- Biome weighting: grand models appear in heartland/blossom mainly (like manor/church); desert/snow/pinewood keep their own buildings. Confirm or change.
