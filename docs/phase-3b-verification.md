# Hanoi 3D - Phase 3B verification (doc lap)

- Ngay: 2026-11-21
- Verifier: doc lap, KHONG sua file game nao (chi doc, chay test, viet bao cao nay)
- Co so: repo local ~/workspace/hanoi-3d (+ tile Lab 06 trong ~/workspace/3dlabobo/), spec docs/phase-3-spec.md, manifest docs/phase-3b-manifest.md, trang thai 3A truoc 3B trong docs/phase-3a-verification.md
- Script dem rieng cua verifier (khong dung lai code/su cua fixer): /tmp/verify-3b-independent.mjs, /tmp/verify-3b-round2.mjs, /tmp/verify-3b-glb.mjs (parse GLB truc tiep), /tmp/verify-3b-worker.mjs (chay that Worker app trong Node). Crop sprite: /tmp/turtletower-crop.png, /tmp/turtletower-top.png (tu atlas.webp that)
- Ket luan: GO CO DIEU KIEN (xem muc 10). Khong co blocker lam hong game; co 1 muc PARTIAL ve chu khac tren Thap Rua (F1) + 2 muc PARTIAL nho (F2, F3) can sua o dot don dep hoac duoc user chap nhan.

## 1. Bang PASS/FAIL tung muc 3B-01..3B-12

### 3B-01 - Ho Guom mo rong + xoay dung huong: PASS

- Rect that x -2..1, z -7..4 (4 rong x 12 dai, ti le 3:1 theo truc z), dem doc lap tu HANOI_ROWS: 43 o pond trong rect (spec 40-44) + 2 o eo (2,-3), (2,-1) = 45 o nuoc. Khop chinh xac manifest.
- Spawn doi (0,0) -> (0,5): (0,5) la hanoi_sidewalk, walkable; (0,0) cu nay la hanoi_pond_guom. HANOI_SPAWN = [0, 5].
- 4 o trong rect khong phai pond: W Thap Rua (-1,-1) + 3 o goc sidewalk (1,-7), (-2,4), (1,4). Hop ly.

### 3B-02 - Thap Rua GIUA ho: PARTIAL (vi tri/cao/dung, chu khac thieu)

- Vi tri PASS: dao 1 o o (-1,-1). Tam rect that: x = (-2+1)/2 = -0,5, z = (-7+4)/2 = -1,5. Thap lech tam dung 0,5 o ca 2 chieu, tuc la 1 trong 4 o gan tam nhat - gan tam nhat co the tren luoi le. Khong tin toa do fixer ghi, tu tinh lai.
- Dao PASS: 4 o xung quanh N/S/W/E deu la hanoi_pond_guom, khong co cau noi bo.
- Cao + hinh PASS: recipe 13 flap, cao toi da 1,20 (3 tang thap dan + dinh vong lau), moi tang 3 cua vom (3 arch ink o tang tret), reu phong o chan (arch moss 0,55 x 0,1). Anchor hoankiem doi (-1,-2) -> (-1,-1).
- Chu FAIL (xem F1, muc 8): tang 3 KHONG co chu "Quy Son Thap" o ca 2 noi hien thi - sprite hero (da crop va nhin bang mat, muc 5a) va recipe placeholder (tang 3 chi la dormer phang, khong co bang chu). Spec yeu cau "tang 3 co chu 'Quy Son Thap' (chi can net chu mo, khong can doc duoc)" - hien khong co ca net mo.

### 3B-03 - Cau The Huc do cong + den Ngoc Son: PASS (1 chi tiet chi kiem duoc bang mat)

- Cau PASS: path_end (2,-2) + thehuc (3,-2) = dai 2 tile; dap xuong path (4,-2) roi den Ngoc Son (5,-2), anchor giu (5,-2).
- Kenh PASS (bang chung manh hon manifest): cau that su bac qua nuoc - bac (3,-3) la river_straight, nam (3,-1) la river_source, (3,-4) la river_source; eo (2,-3), (2,-1) la pond noi ho voi kenh. Chuoi nuoc lien tuc: ho -> eo -> kenh -> duoi cau.
- Cong + mau PASS: 2 arch terracotta 1,3 rong x 0,34 cao (spec 0,35, lech 0,01), 2 tru do 2 dau + 2 den lamp, deck terracotta.
- Chua kiem duoc: "rong 0,4 tile" - khong do duoc tu recipe (be rong di duoc lay tu deck profile/clearance, khong phai so trong recipe). De may user check bang mat: cau co du rong de nhin ra khong.

### 3B-04 - Ho Tay mo rong gap doi: PASS

- Rect that x -19..-7, z -19..-6 (13x14). Dem doc lap: pond_tay 125 + lotus 5 = 130 o nuoc, tat ca 130 o deu nam trong rect (0 o ngoai rect). Spec "~130" - khop chinh xac.
- Ho Tay (130) la vung nuoc lon nhat map, lon hon Ho Guom (45) gan 3 lan. Nhin minimap phan biet ngay.

### 3B-05 - Chua Tran Quoc tren DAO GIUA Ho Tay: PASS

- Dao 1 o o (-13,-12): 3 mat bac/tay/nam la hanoi_pond_tay, mat dong la cau da hanoi_stonebridge (-12,-12), dap xuong path_end (-11,-12), spit meadow (-10,-12), causeway meadow (-8,-12) noi ve dat lien. Dung nhu mo ta "dao trong nuoc, noi bo bang cau da".
- Cao + hinh PASS: recipe 16 flap, cao toi da 1,40 (11 tang thu nho dan + chop 1,40 + cua vom + gian ben + 1 cay + be da). Anchor tranquoc (-13,-12).
- Cua quay huong dong: PASS bang tinh toan (xem muc 5b).

### 3B-06 - Duong dao ven Ho Guom + pho di bo: PARTIAL (vong dao co, hang co khong nam tren vong)

- Vong dao PASS: hang bac z=-8 (x -2..1 sidewalk), hang nam z=5 (x -2..0 sidewalk + path_end (1,5)), o goc (1,-7), (-2,4), (1,4) la sidewalk. Base print granite vuong (3A-10) dung chung.
- Den PASS: 3 den o canh dong ho (2,3), (2,4), (2,5) + (2,6) (doi tu (1,-5)).
- Hang co FAIL nhe (xem F2): 0 co do nam sat vong dao. 6 co cua map o (-7,-7), (3,-7), (-7,-5), (3,-5), (4,2), (4,3) - doc duong chinh phia dong, cach vong dao 2-3 o. Spec ghi "hang co do" trong chi tiet duong dao.
- Cuoi tuan them ghe nhua + nguoi dong hon: khong co trong code (spec tu ghi "chi hieu ung mau, khong doi logic") - chap nhan thieu, khong tru diem nang.

### 3B-07 - Sen Bach Diep Ho Tay: PASS

- 5 o lotus, tat ca trong goc tay-nam x -18..-16, z -8..-6: (-18,-8), (-17,-8), (-16,-8), (-18,-7), (-17,-7). Spec 4-6 o - khop.
- Kich thuoc PASS: la sen arch 0,3 x 0,18 (moss), hoa sen arch 0,25 x 0,22 (rose), them 1 reed 0,4 (copy tu pond stock).

### 3B-08 - Mat nuoc 2 ho khac nhau: PASS

- Ho Guom #2f6b5e (xanh luc sam), Ho Tay #2456a8 (xanh lam sau), sen cung #2456a8. Ca 2 cho: baseTexture trong loader.js (chon mau theo id, co 3 cham gon song mo) VA buildBase trong build-hanoi-glb.mjs (dia nuoc + ripple). Minimap cung dung 2 mau nay (landmarks.js WATER).
- Khong them he thong nuoc moi - dung spec.

### 3B-09 - Bo ho cong mem: PARTIAL (dia tron co, hang da ke bo khong co)

- Dia tron PASS: base print pond la dia tron ban kinh 0,6 (loader.js arc 0,6*u + builder buildBase hypot < 0,6), khong goc vuong 90 do lo ra, ca 2 file khop nhau.
- Hang da ke bo FAIL nhe (xem F3): khong co flap da xam nao tren recipe pond (chi co tuft + 2 reed), khong co vong da trong baseTexture. Vien da duy nhat sat ho la kerb cua sidewalk vong dao (0,08, khong phai 0,1 nhu spec) va arch moss 0,55 x 0,1 o chan Thap Rua (moss, khong phai da xam).

### 3B-10 - Thap But (khong tang checklist): PASS

- Vi tri (2,-6) bo dong-bac ho, recipe 7 flap, cao toi da 1,45 (5 tang + dinh but tri terracotta 1,45), dung spec "cao nhat quanh ho, <= 1,5".
- Khong co trong checklist 11 (LANDMARKS khong co pentower). Hero: khong co (HERO pentower = null) - chi hien bang flap placeholder.
- Luu y: dinh 1,45 la flap cao nhat cua phase 3B; flap cao nhat toan GLB van la cathedral 1,49 (co tu Phase 2).

### 3B-11 - Song Hong + cau Long Bien: PASS

- Song x=16, z -5..5: 11 o (9 river_straight + 2 river_source o 2 dau), rong hon doan duoi cau nhu spec.
- Cau Long Bien anchor giu (17,-6). Recipe longbien 8 flap (them 2 pier paperShade so voi truoc - kiem bang dem flap trong builder: longbien 9 flap tong cong gom ca hero, recipe loader 8 flap).

### 3B-12 - Lang Bac + Quang truong Ba Dinh: PASS

- Lang cao 1,30, rong 2 tile: mausoleum (-12,3) + wing (-13,3, 6 flap). Recipe mausoleum 11 flap, toan paperShade/paper/ink, 3 bac cap da granite (1,0 x 0,42; 1,15 x 0,28; 1,3 x 0,14). Khong con mau brown/kraft (quet recipe: 0 chu brown/kraft).
- Cot co PASS: recipe badinh co cot co cao 1,30 (rect ink 0,07 x 1,3 + lamp rust 0,34 x 1,3 + sao vang star 0,14) tren o quang truong (-12,5). Quang truong co hoa (2 arch rose + tuft).
- Khong hang rao go, khong dong rom trong recipe.

## 2. Dem doc lap (khong dung lai so cua fixer)

### (a) So o pond

| Vung | Dem doc lap | Spec | Manifest fixer |
|---|---|---|---|
| Ho Guom trong rect x -2..1, z -7..4 | 43 / 48 o | 40-44 | 43 |
| Ho Guom tong (rect + 2 eo) | 45 | 40-44 + 2 | 45 |
| Ho Tay pond_tay | 125 | ~130 tong | 125 |
| Ho Tay lotus | 5 | 4-6 | 5 |
| Ho Tay tong | 130, 0 o ngoai rect | ~130 | 130 |
| Song Hong x=16, z -5..5 | 11 | 11 | 11 |

### (b) Reachability tu spawn moi (0,5) - BFS rieng, 4 huong

- Spawn (0,5) walkable (sidewalk), khong ket trong ho. (0,0) cu nay la pond.
- Reachable theo luat tile-tag cua check-3a/check-3b (walkable = khong blocker + khong water): 908 o. Khop chinh xac manifest (908).
- Baseline cu: BFS tu (0,0) tren map ca3efda5 (truoc 3A): 998 o. Giai thich chenh lech -90 = mat 100 o + them 10 o:
  - Mat 100: 85 o thanh nuoc ho (35 Ho Guom + 47 Ho Tay + 3 sen) + 11 o thanh song (x=16 mo rong + kenh Ngoc Son x=3) + 3 o thanh landmark blocker moi (Thap Rua, Thap But, canh Lang) + 1 o path_end (2,-2) bi cat lien thong.
  - Them 10: 5 o pond cu thanh dat (doi cau Tran Quoc + spit) + 3 o grove thanh meadow + 1 o tubehouse_b cu + 1 o tubehouse cu thanh o walkable (lamp/tree/phostall/path_end/stonebridge).
  - So o nuoc tang: 90 -> 182 (+92), gan bang so reachable mat (-90); 2 o chenh do 10 o them tru 8 o nuoc cu nam ngoai vung reachable.
- Tat ca 11 anchor deu discover duoc theo dung luat landmarks.js: rule (a) anchor trong ban kinh 1 (cathedral, opera, longbien) hoac rule (b) o landmark trong vung 3x3 cua o walkable reachable (8 landmark con lai, gom ca hoankiem - Thap Rua tren dao khong co o ke walkable, nhung dung o (0,5) spawn la phat hien ngay qua rule (b) vi rect ho nam trong 3x3).
- Luu y ve luat BFS (xem W1, muc 8): luat tile-tag coi cau la nuoc, trong khi in-game mat cau di duoc (clearance kind 2). BFS voi cau-walkable cho 913 o (them thehuc (3,-2), path_end (2,-2), 2 o longbien, path_end (19,-6) - dau cau phia dong). Vay 908 la so thap hon that 5 o; spawn khong ket, cau The Huc noi thong that (di bo duoc tu (2,-2) qua cau sang (4,-2)).

### (c) Checklist 11 - quet toan repo

- LANDMARKS.length = 11, LANDMARK_INFO = 11 key, HANOI_LANDMARKS = 11 key, HANOI_MODEL_IDS = 47. Thu tu: hoankiem, ngocson, westlake, tranquoc, oldquarter, mausoleum, vanmieu, onepillar, cathedral, opera, longbien.
- index.html:165 chuoi tinh "0/11", khong con "0/10". Day la nit cua phase 3F da duoc sua luon trong 3B.
- README.md: "11 landmarks" + Tran Quoc Pagoda. Minimap dia so dong theo list (i + 1) -> 1-11, khong hardcode.
- 3dlabobo: index.html (comment + spec "11 landmarks"), README.md ("11 landmarks"), README.vi.md ("11 dia danh" + Chua Tran Quoc) - ca 3 deu 11.
- Quet chuoi "10" sot: 0 hit trong file song (src, index.html, README.md, data, workers/src, tools, docs/landmark-history.md, 3dlabobo). Chi con sot trong docs lich su phase cu (phase-2b/2c/2d manifest + verification - ghi dung so thoi do, giu nguyen) VA 2 doc antiRea mo ta dataset hien tai (xem N1, muc 8).

### (d) Bang o 3A bi doi/xoa - doi chieu map ca3efda5 voi map hien tai

- Gioi han: map truoc 3B (sau vong sua 3A) KHONG duoc commit - ca3efda5 la map truoc 3A. Diff truc tiep cho 265 o doi (gom ca 47 o cua 3A + ~218 o cua 3B). Khong the tach sach 3B chi bang diff; verifier kiem lai bang cach khac (xem duoi).
- 6 o doi cho (manifest muc 3a): vi tri MOI deu dung tile da noi - pole (0,6), lamp (2,6), tree (-3,5), vendor_street (3,-6), police (5,-6), pedestrian (4,-6). Vi tri CU kiem duoc doc lap: lamp (1,-5), police (-1,-6), pedestrian (1,-6) co that tren map ca3efda5; pole (0,-3), tree (2,-3), vendor (2,-6) la o 3A dat moi theo phase-3a-verification.md muc 2/3d (cot dien (0,-3), cay (2,-3), vendor_street (2,-6)) - khop manifest 3B.
- 6 o xoa/ngap (manifest muc 3b): kiem bang tileId (khong tin ky tu): (-2,-6) tubehouse_b (ky tu u, rot 1) -> pond; (0,-6) tubehouse (ky tu U, rot 1) -> pond; (0,-7) sidewalk -> pond; (-2,-5) sidewalk -> pond; (-3,-6) road -> path_t (nga cuoi pho); (-9,-11) Tran Quoc cu -> pond_tay. Ca 6 khop.
- Duong bi cat: z=-6 chi con doan dong x 3..5; z=0 hai dau thanh path_end (-3,0), (2,0); x=1 dau nam path_end (1,5); x=-9 cat o (-9,-10) path_end. Khop manifest muc 3c.
- So lieu phu: meadow 761 -> 650 (manifest noi 731 -> 650; 731 la so SAU 3A, 761 la truoc 3A - ca hai dung o moc cua no), sidewalk 6 -> 14, nha ong vang 11 -> 6 (tinh ca rot 0/1: V 5 + v 3 + U 2 + u 1 = 11 truoc 3A, V 4 + v 2 = 6 nay; manifest noi 8 -> 6 o moc sau 3A chi tinh rot 0: 8 -> 6), nha xanh 4 -> 4, ti le xanh:vang 4:6 = 2:3 dung nhu manifest.

## 3. Ha SEG + GLB (parse doc lap, khong dung verify-glb)

- File that: public/models/hanoi-tiles.glb 3.464.792 byte < 3.500.000 (duoi muc tieu 35.208 byte). Khop manifest.
- Parse truc tiep (doc JSON chunk + binary, tu tinh tu accessor): 47 root node, 397 node, 350 mesh, 51.395 dinh, 55.708 tam giac (khop chinh xac 55.708 cua fixer), 0 tam giac degenerate (kiem bang tich co huong, nguong 0).
- 6 model 3B moi deu co mat dang root: hanoi_pond_guom, hanoi_pond_tay, hanoi_lotus, hanoi_stonebridge, hanoi_pentower, hanoi_mausoleum_wing. Khong model nao bi xoa (47 root).
- SEG16 xac nhan TU GLB (khong tin code): base cua ca 10 landmark cu deu 289 dinh (= 17x17, SEG16); sidewalk van 1.089 dinh (SEG32). Tap SEG16 trong build-hanoi-glb.mjs gom dung 10 id cu + 16 id 3A + 6 id 3B = 32 id; khong con SEG24 o dau (grep 0 hit).
- Flap cao nhat (theo dinh nghia cua verify-glb: do cao local cua geometry, khong tinh khoang cach lop 0,004): toan GLB 1,49 (cathedral, co tu Phase 2) <= 1,51; flap cao nhat 3B la pentower 1,45; turtletower 1,20; tranquoc 1,44 (hero). Ghi chu (khong phai loi): dinh the gioi (cong them khoang lop) la cathedral 1,522, tranquoc 1,508 - vuot 1,5 neu doc gioi han theo cao the gioi, nhung dinh nghia chuan tu Phase 2 den nay la cao local, va verify-glb dung dinh nghia do.
- Hero art UV: turtletower uv1 khop rect [16, 2600, 179, 302] sai so 0,0 px; tranquoc khop rect [1006, 2600, 202, 374] sai so 0,0 px (loc bo sentinel -1, tinh doc lap).
- So truoc khi ha SEG (3.678.092 byte, 62.108 tris) khong kiem lai duoc - file GLB cu da bi ghi de, khong con tren dia. Chi kiem duoc so sau (3.464.792 / 55.708), khop manifest.

## 4. Bug Worker antiRea (recordBudgetMax 11 -> 12)

- Code: workers/hanoi-edge/src/index.js - recordBudgetMax mac dinh 12, combinedCoverageFloor 12, coverageRampDenominator 12, "at most 12 ids", RECORD_IDS 12 record (map:grid + 11 landmark, gom tranquoc). DECLARATION_TEXT noi "11 landmark histories". edge.js: validLandmarksData doi length 11, seen.size === 11. data/provenance.json: recordBudgetPerIdentityPer24h 12, checklistOrder 11 id.
- Chay that Worker app trong Node (4 kich ban, identity moi):
  - S1: /api/map (200) roi /api/landmarks (200, tra 11 entry) - tong 12 record distinct vua budget 12.
  - S2: thu tu nguoc (landmarks truoc, map sau) - ca 2 deu 200.
  - S3: app voi budget 11 (gia lap bug cu) - /api/map 200, /api/landmarks 402. Bug cu la that, va 12 sua dung no.
  - S4: 11 lan doc don /api/landmarks/:id + /api/map - ca 12 deu 200; doc lai record da doc van 200 (re-read free); canary id tra trap 404, khong tra data.
- Worker chua deploy - chi kiem code + chay local. Ket luan: bug da sua dung.

## 5. Hai diem fixer ghi chua xac minh

### (a) Chu "Quy Son Thap" tren tang 3 Thap Rua - KHONG CO CHU (FAIL chi tiet)

- Crop sprite atlas rect [16, 2600, 179, 302] (khop atlas.json) phong 4x, nhin bang mat: thap 3 tang, moi tang 3 cua vom, mai cam, reu o chan - tang 3 chi la nen xam phang voi 3 cua vom, KHONG co chu, khong co bang, khong co net chu mo nao. Crop rieng tang 3 phong 6x xac nhan lai: khong co chu.
- Recipe placeholder cung khong co bang chu: tang 3 chi la flap dormer phang 0,3 x 0,9.
- Vay ca 2 duong hien thi (hero sprite la cai user thay, placeholder la fallback) deu thieu chu. Day la F1.

### (b) Cua Tran Quoc quay huong dong (rot 3) - PASS bang tinh toan

- Legend: '/' = hanoi_tranquoc rot 3. Goc: rot = so vong xoay 1/4 theo chieu kim dong ho nhin tu tren (rotateSockets trong core/models.js:104, rotToY = -rot * PI/2, world.js:911 ap dung rotation.y = rotToY(cell.rot)).
- Rot 0: socket path o S (nam), cua o mat nam (quy uoc manor/house: door + path to S). Xoay 3 vong: S -> W -> N -> E. Vay cua quay huong dong.
- Kiem cheo bang phap tuyen: flap cua (arch ink o (0,-0,1), ry 0) co mat +Z (huong nam) o rot 0; rotation.y = -270 do = +90 do dua phap tuyen +Z thanh +X (huong dong). Khop.
- Cau da o phia dong dao (-12,-12) - cua doi dien cau. Khop y do spec.

## 6. So do chay that (verifier tu chay, 2026-11-21)

| Check | Ket qua verifier chay | Khop manifest fixer |
|---|---|---|
| npm run build | PASS - bundle dist/assets/index-BhaX1QHQ.js 1.123.534 byte (1.123,53 kB, gzip 339,80 kB), 65 modules, 776 ms - CUNG hash BhaX1QHQ | Khop |
| npm run check:hanoi | 256 PASS, 0 FAIL - ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) | Khop |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED (55.708 tris, 0 degenerate) | Khop |
| node tools/check-3b.mjs | 69 PASS, 0 FAIL - ALL 3B CHECKS PASSED | Khop |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED | Khop |
| node tools/check-2b.mjs | 446 PASS, 0 FAIL - ALL 2B CHECKS PASSED | Khop |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL - ALL 2C CHECKS PASSED | Khop |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL - ALL 2D CHECKS PASSED | Khop |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL - ALL 2E CHECKS PASSED | Khop |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED | Khop |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL - ALL BASIC CHECKS PASSED | Khop |
| node --check (19 file da sua) | PASS het: loader, hanoi-map, hanoi-models, hanoi, main, landmarks, landmark-history, water, world, edge, worker index, check-3b/2b/2d/3a/3d, check-solver-options, build-hanoi-glb, verify-glb | Khop |
| Script doc lap v1 /tmp/verify-3b-independent.mjs | 84 PASS, 8 FAIL (8 FAIL deu la loi cua script verifier: sai baseline truoc-3B, nham ky tu rot-1, doc sai maxH - da sua o vong 2, khong phai loi game) | - |
| Script doc lap v2 /tmp/verify-3b-round2.mjs | 35 PASS, 1 FAIL (1 FAIL la nguong tu dat qua chat, xem muc 2b) | - |
| Parse GLB doc lap /tmp/verify-3b-glb.mjs | 47 root, 55.708 tris, 0 degenerate, 10 base SEG16 = 289 dinh, UV hero sai so 0,0 px | - |
| Mo phong Worker /tmp/verify-3b-worker.mjs | 9 PASS, 0 FAIL (budget 12 dung, budget 11 that su 402) | - |

## 7. Trap T1-T10

- T1 solver: OPTIONS 95/96, 0 model WFC moi (0 chu "hanoi" them vao core/models.js - 47 model deu o registry Hanoi-only), 0 mismatch, 1600 o resolve. PASS.
- T2 GLB: hanoi-tiles.glb 3.464.792 byte < 3,5 MB. PASS. tiles.glb goc khong doi (6.147.140 byte). atlas.webp 2.541.108 byte, khop so N7 trong manifest.
- T3 lazy-load: tiles.glb van fetch o Hanoi mode (check-3d PASS), basic-grand.glb van gate o NOT Hanoi. PASS.
- T4 cau: deck profile stock giu nguyen; cau Hanoi dung clearance tu flap rieng. Khong vi pham.
- T5 save cu: key hanoi:v1: giu nguyen, visited theo danh sach (khong hardcode 10). PASS.
- T6 Pages deploy flake: khong push trong phase nay, khong ap dung.
- T7 cache cu: khong kiem live; user mo tab an danh + &v=3 theo quality gate.
- T8: dung - khong co headless browser trong sandbox, khong chup man hinh local. Cac muc nhin that de muc 9.
- T9: Impeccable detect / Hallmark sloplint khong chay (loi tool da biet tu truoc). Ghi nhan, khong phai verdict.
- T10 dau gach: quet bang node cho 13 file da doi: 0 ky tu gach dai (U+2013/U+2014). PASS.
- File la: git status 45 entry, toan file cua phase 2/3A/3B da biet; file moi cua 3B chi la tools/check-3b.mjs + docs/phase-3b-manifest.md (dung manifest). Khong co file la. Script + crop cua verifier chi nam o /tmp, khong vao repo.

## 8. Danh sach loi

- F1 - PARTIAL (3B-02, chu Thap Rua): tang 3 Thap Rua khong co chu "Quy Son Thap" o ca sprite hero lan recipe placeholder (da nhin bang mat, muc 5a). Spec yeu cau co, du chi la net mo. Huong sua: ve them bang chu mo nho vao sprite hanoi_turtletower (tang 3) hoac them 1 flap dormer/bang o tang 3 trong recipe + hero; sau do crop lai kiem tra. Neu user chap nhan thap khong chu thi sua spec, khong tu y bo.
- F2 - PARTIAL NHE (3B-06, hang co): 0 co do nam sat vong dao ven Ho Guom; 6 co hien co nam doc duong chinh phia dong (x=3-4), cach vong 2-3 o. Huong sua: them 3-4 co o mep vong dao (vd (2,-8) hoac doc hang nam z=5) hoac sua spec thanh "co doc duong chinh canh ho".
- F3 - PARTIAL NHE (3B-09, hang da ke bo): khong co flap/vong da xam tren o pond; chi co kerb sidewalk 0,08 (spec ghi 0,1) va arch moss o chan thap. Huong sua: them vong da mo vao base print pond hoac 1 flap da thap quanh mep ho, hoac sua spec bo chi tiet nay (dia tron da dat yeu cau chinh "het goc vuong").
- N1 - Nit tai lieu: docs/antirea-plan.md:14 va docs/antirea-declaration.md:16,52,58 van ghi "10 landmarks / 10 landmark histories / 10 landmark anchors" trong khi dataset nay la 11 (Worker DECLARATION_TEXT da la 11). Sua 4 cho nay thanh 11. Cac file phase-2b/2c/2d cu giu nguyen (lich su).
- N2 - Nit manifest: muc 3c ghi "nha ong vang giam 8 -> 6" va "meadow giam 731 -> 650" - dung o moc SAU 3A (8 vang gom tubehouse_b, 731 meadow sau 3A); moc truoc 3A la 7 vang / 761 meadow. Khong sai code, chi can ghi ro moc khi doc.
- W1 - Diem yeu cua check (khong phai loi game): check-3a/check-3b dem reachability bang luat tile-tag (cau = nuoc) nen bao 908, thap hon that in-game 913 (them 3 mat cau + 2 o dau cau). He qua: (2,-2) va (19,-6) hien nhu bi cat trong check nhung that ra di duoc qua cau. Nen sua luat walkable trong check thanh "bridge thi walkable" de so khop game.
- W2 - Diem yeu cua check (khong phai loi game): check-3b kiem "rong 0,4 tile" cua cau The Huc khong co trong script (khong assert nao ve be rong cau). Verifier cung khong do duoc tu recipe - de muc 9 cho may user.
- O1 - Quan sat (khong phai loi): dinh flap the gioi (cong khoang lop 0,004) la cathedral 1,522 va tranquoc 1,508, vuot 1,5 neu doc gioi han theo cao the gioi. Dinh nghia chuan tu Phase 2 la cao local (1,49 / 1,44) va verify-glb dung dinh nghia do - ghi ro de sau nay khong ai doc nham.
- Khong co loi nao lam hong game, khong co hoi quy so voi 3A (toan bo suite 3A/2B/2C/2D/2E/3D/basic deu xanh khi chay lai).

## 9. Nhung gi KHONG the verify trong sandbox (may user la decider)

- Thap Rua dung giua ho co dep khong, co lech mat nhin khong (so do noi o giua, mat nhin thi chua biet).
- Cau The Huc do cong co dep khong, co du rong 0,4 tile khong, co noi thi giac tu bo sang dao Ngoc khong.
- Nuoc 2 ho co phan biet duoc bang mat khong (xanh luc #2f6b5e vs xanh lam #2456a8 tren nen giay, duoi anh sang game).
- Thap But 1,45 co bi cay/nha che khuat o goc nao khong; sen Hong co nhin ra hoa sen khong o ti le diorama.
- Chu "Quy Son Thap" sau khi them (F1) co doc duoc net mo tren 390px khong.
- Tong the: mo minimap co thay Ho Tay lon gap doi Ho Guom khong; spawn (0,5) co cam giac dung o pho di bo ven ho khong; FPS o spawn sau khi GLB len 3,46 MB.
- Khong co headless browser trong sandbox nen khong chup man hinh, khong do FPS that, khong do thoi gian load that.

## 10. Ket luan: GO CO DIEU KIEN

- GO cho viec dua Phase 3B len may user de check bang mat: toan bo nen tang dung (build cung hash BhaX1QHQ, solver 95/96, 0 mismatch, GLB 47 node 55.708 tris 0 degenerate duoi 3,5 MB, reachability 908 dung luat check / 913 dung luat game, 11/11 landmark discover duoc, bug Worker da sua dung va chung minh bang chay that, moi so trong manifest deu tai hien chinh xac khi verifier chay lai). Khong co loi nao lam hong game hoac pha vo gate.
- DIEU KIEN truoc khi goi 3B la xong han:
  1. Sua F1 (3B-02): them net chu "Quy Son Thap" mo o tang 3 Thap Rua (sprite hoac flap), roi crop lai kiem tra; hoac user chot bo chi tiet chu khoi spec.
  2. Sua F2 (3B-06): them hang co sat vong dao, hoac sua spec thanh co doc duong chinh canh ho.
  3. Sua F3 (3B-09): them hang da ke bo, hoac sua spec bo chi tiet nay (dia tron da dat).
  4. Sua N1 (4 cho "10" trong docs/antirea-plan.md + docs/antirea-declaration.md) va W1 (luat walkable trong check tinh cau la di duoc).
- Neu ap dung luat cung "moi chi tiet trong spec phai khop" thi F1 mot minh da du de NO-GO - coordinator co the nang len NO-GO neu muon fix F1 truoc khi user check. Verifier de GO co dieu kien vi F1 chi la 1 chi tiet trang tri tren 1 thap (vi tri/cao/dung deu dung), khong anh huong gate nao khac, va user check bang mat van la buoc bat buoc tiep theo.
- Khong push, khong commit theo nhiem vu. GLB moi chi o local.

## Verify lai vong sua 3B - 2026-11-21

- Verifier: doc lap vong 2, KHONG sua file game nao (chi doc, chay test, viet muc nay).
- Co so: bao cao goc o tren (F1/F2/F3/N1/W1/O1), manifest docs/phase-3b-manifest.md muc 11, spec docs/phase-3-spec.md muc 2.2 (3B-02, 3B-06, 3B-09).
- Script dem rieng cua verifier vong 2 (khong dung lai so cua fixer): /tmp/r2-map.mjs (F2 + W1, BFS rieng), /tmp/r2-glb.mjs (F3 + GLB, parse truc tiep). Crop sprite: /tmp/r2-turtle-1x.png, /tmp/r2-turtle-4x.png, /tmp/r2-turtle-6x.png, /tmp/r2-turtle-top6x.png (tu atlas.webp that).
- Ket luan: GO CO DIEU KIEN (1 dieu kien nho con lai, xem muc 10). F1/F2/F3/W1 deu PASS; N1 chi xong 1 nua - 2 doc da chi dinh sach, nhung con sot 6 cho cung loai trong workers/hanoi-edge/README.md.

### 1. Bang PASS/FAIL tung loi vong sua

| Loi | Ket luan vong 2 | Bang chung tom tat |
|---|---|---|
| F1 - chu Thap Rua | PASS | Nhin bang mat tren crop that: "QUY SON THAP" doc ro tren bang giay tang 3; rect atlas.json van [16, 2600, 179, 302]; UV hero TEXCOORD_1 khop rect sai so 0,00 px |
| F2 - hang co vong dao | PASS | 4 o (-2,-7), (1,-7), (-2,4), (1,4) deu la hanoi_flag, moi o ke dung 2 mat nuoc, tag village, khong blocker, deu reachable tu spawn; co 10, sidewalk 10 |
| F3 - vong da ke bo | PASS | Parse GLB doc lap: moi base pond dung 24 dinh vong da + 45 dinh nuoc, ban kinh da 0,500..0,559 (rong hien thi dung 0,1); cau da 0 dinh vong da; code ap cho ca 3 loai pond, loai tru cau da |
| N1 - nit doc "10" | PARTIAL | 2 doc da chi dinh (antirea-plan.md, antirea-declaration.md) sach 0 cho sot; nhung workers/hanoi-edge/README.md con 6 cho sot, gom ca muc budget ghi sai 11 thay vi 12 |
| W1 - luat walkable | PASS | Luat bridge-walkable co o ca 3 file check-3b/check-3a/check-2b; BFS rieng: 913 (luat moi) vs 908 (luat cu), 5 o tang them dung nhu fixer noi |
| O1 - dinh flap the gioi | GHI CHU | Khong doi code, dung nhu manifest; do lai: flap local cao nhat 1,450 (pentower), dinh Y cao nhat toan GLB 1,490 (cathedral art card) |

### 2. F1 - Kiem manh bang mat (PASS)

- Crop sprite hanoi_turtletower tu public/textures/art/atlas.webp theo rect [16, 2600, 179, 302] doc tu atlas.json (sprites.hanoi_turtletower.rect, khop chinh xac con so fixer noi).
- Nhin bang mat tren crop 4x va crop rieng tang 3 phong 6x: chu "QUY SON THAP" doc ro, chu muc kieu serif tren bang giay mau kem. Bang nam ngay duoi mai cam tang 3, ngay tren 3 cua vom tang 3 - dung vi tri fixer mo ta.
- Mai cam, 3 cua vom moi tang, reu phong o chan thap deu nguyen ven, khong bi ve de hong. Khong thay vet cat qua duong mai hay tran ra ngoai tuong.
- Kiem bang pixel (ho tro mat nhin, khong thay the): hang y=91 trong sprite co 41/92 pixel mau giay (#efe0c2, sai so 12) + 14 pixel chu muc toi; hang y=80 va y=100 co 0 pixel mau giay - bang giay nam gon trong dai y 84..98 nhu fixer noi.
- UV hero trong GLB: TEXCOORD_1 cua node hanoi_turtletower__art (bo sentinel -1,-1) cho x 16,00..195,00 va y 2600,00..2902,00 - khop rect [16, 2600, 179, 302] sai so 0,00 px. Kiem cheo: tranquoc cung khop rect [1006, 2600, 202, 374] sai so 0,00 px.
- Ghi chu ve loi do cua chinh verifier: lan doc UV dau tien cua verifier doc nham TEXCOORD_0 (UV cuc bo cua tam card, khong phai UV atlas) nen bao FAIL; doc lai dung TEXCOORD_1 thi PASS tuyet doi. Loi do thuoc script verifier, khong phai loi game.
- Recipe placeholder van khong co chu (13 flap, flat-colour) - fixer da ghi ro day la gioi han fallback, khong gia vo da sua. Chap nhan vi sprite moi la duong hien thi that trong game.

### 3. F2 - Hang co do sat vong dao (PASS)

- Doc map that qua createHanoi seed 1: at(-2,-7), at(1,-7), at(-2,4), at(1,4) deu la hanoi_flag.
- Moi o ke dung 2 mat nuoc (dem tu tag water cua 4 o ke): (-2,-7) ke (-1,-7) va (-2,-6); (1,-7) ke (0,-7) va (1,-6); (-2,4) ke (-1,4) va (-2,3); (1,4) ke (0,4) va (1,3).
- Moi o tag chi co village, khong co blocker; ca 4 o deu nam trong tap reachable tu spawn (0,5) - khong chan loi di.
- Dem toan map: co 10 (6 -> 10), sidewalk 10 (14 -> 10), tong street cell van 35 (check:hanoi PASS).
- Script rieng /tmp/r2-map.mjs: 30 PASS, 0 FAIL.

### 4. F3 - Vong da ke bo (PASS)

- Doc code: src/assets/loader.js baseTexture - vong da chi nam trong nhanh 3 id pond (hanoi_pond_guom / hanoi_pond_tay / hanoi_lotus), stroke arc ban kinh 0,55u, lineWidth 0,1u (dai 0,5..0,6, rong dung 0,1); nhanh hanoi_stonebridge chi to nuoc #2456a8, khong co vong da.
- tools/step5/build-hanoi-glb.mjs buildBase - dieu kien vong da liet ke dung 3 id pond, dai hypot 0,47..0,6, mau paperShade x 0,88; cau da khong nam trong dieu kien.
- Parse GLB doc lap (mau linear, dung sai 0,03): moi base pond co dung 24 dinh mau da + 45 dinh nuoc ben trong, base 289 dinh (SEG16). Ban kinh thuc cua 24 dinh da: 0,500, 0,515, 0,530, 0,559 - tuc vong hien thi rong 0,5..0,6 = dung 0,1 (nguong 0,47 trong code chi de bat tron vong dinh, khong lam vong rong them).
- Cau da: base 289 dinh, 0 dinh vong da.
- GLB build lai 3.464.792 byte, khong doi kich thuoc so voi truoc vong sua, van duoi 3,5 MB.
- Script rieng /tmp/r2-glb.mjs: 18 PASS, 1 FAIL (1 FAIL la loi doc UV nham thuoc tinh cua verifier, xem muc 2; sau khi sua thi PASS).

### 5. N1 - Nit doc "10 landmarks" (PARTIAL - con sot 1 file)

- 2 doc da chi dinh sach: grep "10 landmark / 10 histories / 10 records / 1 map + 10 / 10 landmark anchors" trong docs/antirea-plan.md va docs/antirea-declaration.md cho 0 hit. 5 cho da sua deu co mat dang 11/12: antirea-plan.md:14 "11 landmarks"; antirea-declaration.md:16 "the 11 landmark histories", :52 "the 11 landmarks always", :58 "(11 landmark anchors + cell count)", :68 "12 records (1 map + 11 histories)".
- So 11/12 nhat quan voi code Worker: recordBudgetMax mac dinh 12, combinedCoverageFloor 12, coverageRampDenominator 12, RECORD_IDS 12 record (workers/hanoi-edge/src/index.js:104-139, :132-133).
- Con sot - workers/hanoi-edge/README.md (fixer khong sua, verifier vong 1 khong liet ke): 6 cho cung loai "10/11" cu:
  - :3 "(40x40 map + 10 landmark histories)" - nen la 11.
  - :11 "serves the 10 histories" - nen la 11.
  - :12 "whole dataset = 11 records per 24h" - nen la 12.
  - :45 bang Limits: "Record budget | 11 distinct records / 24h ... whole dataset is 11 records (1 map + 10 histories)" - nen la 12 / 11 histories. Cho nay ghi sai budget that (code la 12).
  - :46 "Herd detection | combined floor 11 ... rescaled to 11 records" - code la floor 12.
  - :110 huong dan check live: "checklist still shows 10 landmarks" - nen la 11; neu lam theo dung chu se tuong 11 la sai.
- Ly do check khong bat duoc: check-3b.mjs chi quet stale "10" trong 11 file countedFiles, khong gom workers/hanoi-edge/README.md (cung khong gom 2 doc antirea - 2 doc do sach nho sua tay, khong nho check).
- Cac file lich su phase 2b/2c/2d van ghi 10 - dung so thoi do, giu nguyen theo quyet dinh cu.
- Day la loi doc-only, khong anh huong code game hay Worker (code dung 12), Worker chua deploy. Nhung muc :45 va :110 co the gay hieu lam khi deploy hoac check live.

### 6. W1 - Luat walkable trong check (PASS)

- Luat moi co mat o ca 3 file: tools/check-3b.mjs:35-37, tools/check-3a.mjs:372-378, tools/check-2b.mjs:213-215 - "o co tag bridge thi walkable, ke ca khi tag co water". tools/check-solver-options.mjs khong co dinh nghia walkable/BFS nao, khong co gi de sua - khop nhan xet cua fixer.
- BFS rieng cua verifier (4 huong, tu spawn (0,5), tu viet lai): luat bridge-walkable cho 913 o; luat cu (tile-tag) cho 908 o. 5 o tang them dung la thehuc (3,-2), path_end (2,-2), longbien (17,-6), longbien (18,-6), path_end (19,-6).
- Baseline check-3a doi 908 -> 913, check-3b them check === 913 - ca 2 deu PASS khi chay lai (muc 7).

### 7. So do chay that (verifier vong 2 tu chay, 2026-11-21)

| Check | Ket qua verifier chay | Khop manifest fixer |
|---|---|---|
| npm run build | PASS - bundle dist/assets/index-C5CARRqL.js 1.123.634 byte (1.123,63 kB, gzip 339,82 kB), 65 modules, 822 ms - CUNG hash C5CARRqL | Khop |
| npm run check:hanoi | 256 PASS, 0 FAIL - ALL CHECKS PASSED | Khop |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED (55.708 tris, 0 degenerate) | Khop |
| node tools/check-3b.mjs | 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED | Khop |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED (reachability 913) | Khop |
| node tools/check-2b.mjs | 446 PASS, 0 FAIL - ALL 2B CHECKS PASSED | Khop |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL - ALL 2C CHECKS PASSED | Khop |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL - ALL 2D CHECKS PASSED | Khop |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL - ALL 2E CHECKS PASSED | Khop |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED | Khop |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL - ALL BASIC CHECKS PASSED | Khop |
| node --check (8 file JS da sua) | PASS het: loader.js, hanoi-map.js, build-hanoi-glb.mjs, check-3b/3a/2b/3d, check-solver-options.mjs | Khop |
| python3 -m py_compile tools/step5/fix-turtletower-sign.py | OK (node --check khong ap dung cho file .py) | Bo sung |
| Script doc lap /tmp/r2-map.mjs | 30 PASS, 0 FAIL | - |
| Script doc lap /tmp/r2-glb.mjs | 18 PASS, 1 FAIL (1 FAIL la loi doc UV cua verifier, da sua va PASS lai, xem muc 2) | - |

### 8. Ha SEG + GLB + flap (do lai doc lap)

- public/models/hanoi-tiles.glb 3.464.792 byte < 3.500.000 (duoi muc tieu 35.208 byte). Khong doi so voi truoc vong sua.
- Parse truc tiep: 397 node, 350 mesh, 55.708 tam giac, 0 tam giac degenerate, 47 root node.
- Flap local cao nhat 1,450 (hanoi_pentower__flap_5) <= 1,5. Dinh Y cao nhat toan GLB 1,490 (hanoi_cathedral__art card) - khop so 1,49 cua verifier vong 1 theo dinh nghia cao local.
- O1 (ghi chu, khong doi code): dinh flap the gioi cong khoang lop 0,004 van la cathedral 1,522 va tranquoc 1,508 neu doc theo cao the gioi; dinh nghia chuan tu Phase 2 la cao local va verify-glb dung dinh nghia do - khong tinh la loi.
- Atlas.webp 2.532.524 byte (giam 8.584 byte so voi 2.541.108 truoc vong sua) - khop fixer.
- First-load sau 16,98 MB (check-3d PASS) - khop fixer.

### 9. Trap + ve sinh repo

- 0 dau gach dai (U+2013/U+2014) trong ca 12 file doi o vong sua nay (loader.js, hanoi-map.js, build-hanoi-glb.mjs, fix-turtletower-sign.py, check-3b/3a/2b/3d, check-solver-options.mjs, antirea-plan.md, antirea-declaration.md, phase-3b-manifest.md) - quet bang node.
- git status: repo van o trang thai uncommitted lon tu phase 2/3A/3B (da biet tu vong 1). File doi hom nay (2026-11-21) toan la file 3B da biet trong manifest muc 10 + 11; khong co file la. File moi duy nhat cua vong sua la tools/step5/fix-turtletower-sign.py.
- Ghi chu: verifier vong 2 co tao tools/step5/__pycache__/fix-turtletower-sign.cpython-312.pyc khi chay python3 -m py_compile, da xoa ngay sau do; repo tra lai trang thai truoc khi verify.
- Khong push, khong commit theo nhiem vu.

### 10. Loi con lai + ket luan

- Loi con lai duy nhat: N1b - 6 cho sot "10/11" trong workers/hanoi-edge/README.md (:3, :11, :12, :45, :46, :110), trong do :45 ghi sai budget (11 thay vi 12) va :110 huong dan check live sai so landmark (10 thay vi 11). Huong sua: sua 6 cho do thanh 11/12 theo code Worker hien tai, va them workers/hanoi-edge/README.md vao danh sach countedFiles cua check-3b.mjs de khong sot lai.
- Khong co loi game nao con lai. F1/F2/F3/W1 deu duoc kiem chung doc lap bang mat, bang parse GLB truc tiep va BFS rieng, khong dung lai so cua fixer.
- Ket luan: GO CO DIEU KIEN - Phase 3B duoc dua len may user de check bang mat. Dieu kien duy nhat con lai la sua N1b (doc-only, khoang 5 phut, khong doi code game): sua 6 cho trong workers/hanoi-edge/README.md thanh 11/12 va them file do vao quet stale "10" cua check-3b.mjs. Neu coordinator muon goi 3B la xong han truoc khi user check thi sua N1b truoc; neu khong, N1b co the di kem dot don dep tiep theo vi no khong anh huong game, check nao, hay Worker chua deploy.
