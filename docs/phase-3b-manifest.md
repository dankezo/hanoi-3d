# Phase 3B - Ho + landmark (Ho Guom, Ho Tay, Tran Quoc, checklist 11)

- Repo: hanoi-3d, map Hanoi 40x40 (1600 o), seed 1.
- Spec duy nhat: docs/phase-3-spec.md (muc 1.2 so lieu ho, muc 2.2 checklist 3B-01..3B-12, muc 3 phase 3B, muc 4 tieu chi 3B, muc 6 trap).
- Quyet dinh Q2 (user duyet): Tran Quoc la landmark RIENG THU 11, checklist 10 -> 11.
- KHONG push, KHONG commit, KHONG upload binary trong phase nay. Build lai GLB local thoi.
- Quy tac: chi dau gach ngang ngan "-" trong moi file.

## 1. So do ASCII map moi (lay tu map that, seed 1)

- Huong: hang la z (bac - o tren, nam + o duoi), cot la x (tay - o trai, dong + o phai).
- Ky tu ho moi: `;` pond_guom (Ho Guom), `*` pond_tay (Ho Tay), `?` lotus (sen), `W` Thap Rua, `#` cau da, `/` Tran Quoc, `$` Thap But, `&` canh lang, `h` cau The Huc, `k` sidewalk (duong dao), `f`/`e` path_end, `b` path_t (nga cuoi pho).
- Cac ky tu khac la tile 3A/stock khong doi - xem day du trong src/world/hanoi-map.js.

### 1a. Ho Guom (x -4..6, z -9..7)

```
z  -9 Tvq.qTq88..
z  -8 .Vkkkkl8T..
z  -7 jo9;;909...
z  -6 ib;;;;$yiQa
z  -5 xV;;;;Z965|
z  -4 .o;;;;TskI|
z  -3 ID;;;;;!k.|
z  -2 ..;;;;hJ-m|
z  -1 ..;W;;;S..|
z   0 -f;;;;h---+
z   1 .7;;;;T7..|
z   2 77;;;;Tj9,|
z   3 ,,;;;;j,9,|
z   4 ,,9;;9j,,,|
z   5 GTkkkejGG.|
z   6 GG..l|jGG.|
z   7 GG...|GGG.|
```

- Ho hinh chu nhat dung x -2..1, z -7..4 (4 rong x 12 dai, ti le 3:1 theo truc z).
- `W` Thap Rua o (-1,-1), giua ho, bon phia la nuoc `;`.
- `$` Thap But o (2,-6), bo dong-bac ho.
- `h` cau The Huc o (3,-2), noi bo dong (2,-2) sang dao Ngoc (4..5,-2).
- Vong dao `k` bao quanh: hang bac z=-8 (x -2..1), hang nam z=5 (x -2..0) + `e` o (1,5).

### 1b. Ho Tay (x -20..-6, z -20..-5)

```
z -20 HFFFFHFFFFHFFFF
z -19 FG*********FHGF
z -18 FF*********.**.
z -17 FF*********.*..
z -16 FF*********....
z -15 HH*********....
z -14 FF***********..
z -13 FF***********..
z -12 FF*****/#f.....
z -11 FF***********..
z -10 HF*********e*.e
z  -9 FF*********|Tq@
z  -8 FH???******|l.v
z  -7 FG??*******|z9V
z  -6 FF*******h-+^iN
z  -5 HFFFFF.....|Y9o
```

- Ho hinh chu nhat x -19..-7, z -19..-6 (13x14), nuoc 130 o (pond_tay 125 + sen 5).
- `/` Tran Quoc o (-13,-12) tren dao giua ho, `#` cau da o (-12,-12), `f` bai dap o (-11,-12).
- `?` dam sen o goc tay-nam: (-18..-16,-8..-6), 5 o.
- Dai cay ven bo giu lai: hang x=-19, hang x=-9..-8 z=-19..-16, va mep dong x=-7 van la dat.

### 1c. Song Hong (x 14..19, z -8..7)

```
z -8 ...!!F
z -7 ...!!F
z -6 ---BBf
z -5 ..s!!H
z -4 ..!!!F
z -3 ..!!!F
z -2 ..!!!F
z -1 ..!!!F
z  0 ..!!!H
z  1 ..!!!F
z  2 R.!!!F
z  3 ..!!!F
z  4 ..!!!F
z  5 ..S!!H
z  6 ...!!F
z  7 ...!!F
```

- `!` river_straight chay x=16, z -5..4; `s` river_source o (16,-5); `S` river_source o (16,5).
- Cau Long Bien neo (17,-6) khong doi.

## 2. Tung muc 3B-01..3B-12 (vi tri, kich thuoc - so do that)

- 3B-01 Ho Guom ve lai: rect x -2..1, z -7..4 (4x12), pond_guom 43 o trong rect + 2 o eo (2,-3), (2,-1) = 45 o nuoc. Spawn doi (0,0) -> (0,5), sidewalk tren duong dao phia nam ho. Socket mismatch 0, check:hanoi PASS.
- 3B-02 Thap Rua giua ho: dao 1 o o (-1,-1), thap cao 1.20 (3 tang + vong lau dinh, moi tang thap dan), moi mat 3 cua vom, tang 3 co bang chu mo, reu phong o chan, KHONG co cau noi bo. Recipe 13 flap, hero 0.71x1.20. Anchor hoankiem doi (-1,-2) -> (-1,-1).
- 3B-03 Cau The Huc + den Ngoc Son: cau tu bo dong ho (2,-2) path_end sang dao Ngoc (4..5,-2), tile cau thehuc o (3,-2), dai 2 tile (path_end + thehuc), cong vom 0.35 o giua, rong 0.4 tile, lan can do son 2 ben, 2 tru do 2 dau. Eo nuoc (2,-3) va (2,-1) noi ho voi kenh. Den Ngoc Son giu anchor (5,-2).
- 3B-04 Ho Tay mo rong gap doi: rect x -19..-7, z -19..-6 (13x14), pond_tay 125 + lotus 5 = 130 o nuoc (truoc 74 o). La vung nuoc lon nhat map (130 > 45 Ho Guom), nhin minimap phan biet ngay.
- 3B-05 Chua Tran Quoc tren DAO giua Ho Tay: dao 1 o o (-13,-12), cau da thap 1 o o (-12,-12), bai dap path_end o (-11,-12), spit meadow o (-10,-12), causeway meadow o (-8,-12) noi cum dao ve dat lien, bo meadow o (-9,-12). Chua cao 1.40 (bao thap luc giac 11 tang la diem cao nhat), 16 flap (11 tang thu nho dan + chop + cua vom + gian ben + 1 cay + be da). Cua o mat nam cua recipe, map rot 3 quay ve huong dong, doi dien cau da.
- 3B-06 Duong dao ven Ho Guom + pho di bo: vong sidewalk quanh ho moi - hang bac z=-8 x -2..1, hang nam z=5 x -2..0 + path_end (1,5), 4 goc vong dao la co do `9` o (-2,-7), (1,-7), (-2,4), (1,4) (sau vong sua 3B, xem muc 11; truoc do la `k`). Base print da granite vuong (3A-10), den cau trang (3A-08) dat lai theo mep ho moi, hang co do doc bo.
- 3B-07 Sen Bach Diep Ho Tay: dam sen goc tay-nam Ho Tay x -18..-16, z -8..-6, 5 o lotus (la sen tron 0.3, hoa sen hong 0.25, 1 cey say). Recipe lotus 5 flap.
- 3B-08 Mat nuoc 2 ho khac nhau: Ho Guom xanh luc sam #2f6b5e, Ho Tay xanh lam sau #2456a8 (sen cung #2456a8). Base print co gon song mo (3 cham gon) + phan chieu giu nguyen throttle 2E. Chi doi mau/print theo vung, khong them he thong nuoc moi.
- 3B-09 Bo ho cong mem: base print pond la dia tron ban kinh 0.6 (khong goc vuong 90 do lo ra), them 1 hang da ke bo (vien da xam thap 0.1) o mep ho - vong da paperShade quanh mep dia nuoc, ap cho ca 3 loai o pond (guom, tay, lotus), khong ap cho cau da (sau vong sua 3B, xem muc 11).
- 3B-10 Thap But (landmark phu, KHONG tang checklist): bo dong-bac Ho Guom (2,-6), cao 1.45 (cao nhat quanh ho, van <= 1.5), 5 tang, dinh hinh ngon but, recipe 7 flap. Chi lam diem nhan dien tu xa, KHONG co trong checklist 11.
- 3B-11 Song Hong + cau Long Bien (giu, chi chinh): cau thep truss do nau ro hon, them tru cau xuong nuoc, song rong hon o doan duoi cau (x=16, z -5..5, 11 o). Anchor (17,-6) khong doi. Recipe longbien 8 flap (them 2 pier paperShade).
- 3B-12 Lang Bac + Quang truong Ba Dinh: lang cao 1.30, rong 2 tile (gom 2 o canh nhau, them canh `&` o (-13,3)), khoi da granite xam, bac cap 3 lop, cot co do cao 1.30 truoc lang, quang truong rong co hoa (khong hang rao go, khong dong rom). Recipe mausoleum 11 flap (truoc 10), wing 6 flap.

## 3. Bang o 3A bi doi/xoa (ho moi an ~30 o pho co)

### 3a. Doi cho (giu nguyen chuc nang, dat lai theo mep ho MOI)

| Element | Cu | Moi | Ly do |
|---|---|---|---|
| Cot dien (pole) | (0,-3) | (0,6) | (0,-3) thanh pond |
| Den cau (lamp) | (1,-5) | (2,6) | (1,-5) thanh pond |
| Cay (tree) | (2,-3) | (-3,5) | (2,-3) thanh pond (eo) |
| Vendor duong | (2,-6) | (3,-6) | (2,-6) thanh Thap But |
| Cong an (police) | (-1,-6) | (5,-6) | (-1,-6) thanh pond |
| Nguoi di bo (pedestrian) | (1,-6) | (4,-6) | (1,-6) thanh pond |
| Thap Rua | (-1,-2) | (-1,-1) | ra giua ho moi |

### 3b. Xoa (ngap nuoc, khong dat lai)

| O | Cu | Nay la |
|---|---|---|
| (-2,-6) | tubehouse_b (vang) | pond_guom |
| (0,-6) | tubehouse (vang) | pond_guom |
| (0,-7) | sidewalk | pond_guom |
| (-2,-5) | sidewalk | pond_guom |
| (-3,-6) | road junction X | path_t (nga cuoi pho, duong ket thuc o ho) |
| (-9,-11) | Tran Quoc cu (bo dong) | pond_tay |
| (-9,-11) den (-9,-6) | doan bac duong x=-9 | ngap 1 o, con lai thanh duong cut o (-9,-10) path_end |

### 3c. Duong/ngo/tuyen pho bi cat

- Duong chinh z=-6 pho co (x -2..1) ngap, chi con doan dong x 3..5.
- Duong ngang z=0 (x -2..1) ngap, 2 dau thanh path_end o (-3,0) va (2,0).
- Duong doc x=1 (z 0..4) ngap, dau nam thanh path_end o (1,5).
- Duong x=-9 phia bac Ho Tay cat o (-9,-10), thanh nga cuoi.
- Meadow giam 731 -> 650 o (ho an 81 o meadow).
- Nha ong vang giam 8 -> 6 o, ti le xanh:vang 1:2 thanh 2:3 (4:6) - muc tieu tham my 3A nhuong cho ho.
- Sidewalk tang 6 -> 14 o (vong dao moi them 10 o, ngap 2 o cu); sau vong sua 3B con 10 o sidewalk + 4 o co do o 4 goc vong dao (xem muc 11).

## 4. Bang dem 10 -> 11 o moi noi da sua

| File | Cho cu | Cho moi |
|---|---|---|
| src/game/landmarks.js | ORDER + NAMES 10 id | 11 id (them tranquoc sau westlake), dia minimap 1-11 (dong theo list) |
| src/game/landmark-history.js | LANDMARK_INFO + DATASET_PROVENANCE 10 id | 11 id, them entry tranquoc (lich su da verify, xem docs/landmark-history.md) |
| docs/landmark-history.md | 10 muc | 11 muc, them muc tranquoc |
| index.html:165 | chuoi tinh "0/10" | "0/11" |
| README.md | "10 landmarks" | "11 landmarks" + Tran Quoc Pagoda |
| src/core/config/edge.js | comment 10 id, validLandmarksData 10, seen.size === 10 | 11, 11, 11 |
| data/provenance.json | checklistOrder 10, "10 landmark histories", recordBudgetPerIdentityPer24h 11 | 11, "11 landmark histories", 12 (1 map + 11 landmark) |
| workers/hanoi-edge/src/index.js | DECLARATION_TEXT 10, recordBudgetMax mac dinh 11, combinedCoverageFloor 11, coverageRampDenominator 11, "at most 11 ids" | 11, 12, 12, 12, "at most 12 ids"; RECORD_IDS 11 -> 12 record phuc vu, watermarkRecords 11 -> 12 total |
| tools/check-2b.mjs | LANDMARKS 10, doc 10, count() 10, ANCHORS 10, street 34, model 41 | 11, 11, 11, 11 (+tranquoc), 35, 47 |
| tools/check-2d.mjs | LANDMARKS 10, checklist 10, DATASET_PROVENANCE 10, /api/landmarks 10 entry, herd C 3 id, coverage 11, watermark totals 11, RECORD_IDS 11, list 10 | 11, 11, 11, 11 entry, C 4 id (+tranquoc), 12, 12, 12, 11 |
| tools/check-3a.mjs | model 41, GLB node 41, mausoleum 10 flap, reachability baseline 998 tu (0,0), meadow 731, nha vang 8, ti le 1:2, sidewalk 6 | 47, 47, 11 flap, baseline 913 tu (0,5) (sau vong sua 3B, cau tinh la di duoc; luc 3B la 908), meadow 650, nha vang 6, ti le 2:3, sidewalk 10 + co 10 |
| tools/check-3d.mjs | stock 1504, Hanoi cell 96, first-load 21.40 / 16.77 MB | stock 1321, Hanoi cell 279, first-load 21.61 / 16.98 MB (sau vong sua 3B; luc 3B la 16.99 MB) |
| tools/check-solver-options.mjs | HANOI_MODEL_IDS 41, tubehouse 12, street 34, ANCHOR_MODEL westlake | 47, 10, 35, +tranquoc |
| src/assets/loader.js | RECIPES 41 model | 47 model (6 moi: pond_guom, pond_tay, lotus, stonebridge, pentower, wing) |
| 3dlabobo/index.html + README.md + README.vi.md | "10 landmarks" | "11 landmarks" + Chua Tran Quoc |
| src/world/hanoi.js + hanoi-map.js | spawn (0,0), tower (-1,-2) | spawn (0,5), tower (-1,-1) |

- Storage: visited tu theo danh sach (khong hardcode 10), key luu van hanoi:v1:.
- Minimap: dia so dong theo danh sach tu 3F-08, kiem lai thanh 1-11.
- 3D-02 ROLLBACK van giu: tiles.glb VAN duoc fetch o che do Hanoi - 1321 trong 1600 o dung 14 stock tile id (forest, grove, hills, lantern_post, meadow, meadow_flowers, path_cross, path_end, path_straight, path_t, pond, river_source, river_straight, rocks) nen bo tiles.glb se lam 83% map thanh placeholder. Chi basic-grand.glb van gate o NOT Hanoi.

## 5. Ket qua build + check (so do that)

- npm run build: bundle dist/assets/index-C5CARRqL.js 1,123,634 bytes (1,123.63 kB, gzip 339.82 kB), dist/index.html 9.24 kB. Build PASS. (Hash cu luc 3B la BhaX1QHQ, 1,123,534 byte; tang 100 byte do code vong da F3 + TEXTURE_BYTES_FALLBACK moi.)
- GLB moi: public/models/hanoi-tiles.glb 3,464,792 bytes, 47 tile, 55,708 triangle (truoc 62,108), 0 degenerate.
- npm run check:hanoi: ALL CHECKS PASSED (solver 95/96, 0 socket mismatch).
- node tools/step5/verify-glb.mjs: ALL GLB CHECKS PASSED (0 degenerate, flap cao nhat 1.45 Thap But <= 1.5).
- node tools/check-3b.mjs: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED.
- node tools/check-3a.mjs: 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED (muc kich thuoc GLB da PASS sau khi ha SEG, xem muc 6).
- node tools/check-2b.mjs: 446 PASS, 0 FAIL - ALL 2B CHECKS PASSED.
- node tools/check-2d.mjs: 139 PASS, 0 FAIL - ALL 2D CHECKS PASSED.
- node tools/check-3d.mjs: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED (sau khi viet manifest; truoc do 112 PASS, 3 FAIL, ca 3 deu la "manifest records X").
- node tools/check-basic.mjs: 64 PASS, 0 FAIL - ALL BASIC CHECKS PASSED.
- node --check cac file JS da sua: PASS (loader.js, check-2b, check-2d, check-3a, check-3d, check-3b, worker index.js, check-solver-options.mjs, verify-glb.mjs, build-hanoi-glb.mjs, hanoi-map.js, hanoi.js, main.js, landmarks.js, water.js, world.js, edge.js).

### 5b. Ket qua chay cuoi (sau khi viet manifest)

- node tools/check-3b.mjs: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED.
- node tools/check-3d.mjs: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED.
- node tools/check-basic.mjs: 64 PASS, 0 FAIL - ALL BASIC CHECKS PASSED.

## 6. Kich thuoc GLB vuot muc tieu - DA SUA (ha SEG24 -> SEG16)

- GLB truoc khi sua: 3,678,092 bytes, vuot muc tieu 3,500,000 la 178,092 bytes (+5.1%).
- Da ap dung de xuat cua fixer 3B (coordinator duyet): ha 10 base SEG24 cua landmark xuong SEG16 trong tools/step5/build-hanoi-glb.mjs (xoa tap SEG24, them 10 id vao tap SEG16; buildBase gio chi chon 16 hoac 32). 10 model doi: hanoi_turtletower, hanoi_ngocson, hanoi_thehuc, hanoi_tranquoc, hanoi_vanmieu, hanoi_onepillar, hanoi_cathedral, hanoi_opera, hanoi_longbien, hanoi_badinh. Model moi 3A giu SEG16, cac model con lai giu SEG32, khong doi hinh hoc flap hay so luong model.
- GLB sau khi sua: 3,464,792 bytes, DUOI muc tieu 3,500,000 la 35,208 bytes (-1.0%). Giam that 213,300 bytes (uoc ~240 KB), tam giac 62,108 -> 55,708.
- Danh doi: base print cua 10 landmark mem hon mot chut (duong vien 0.125 thay vi 0.083, strip 0.5 rong con 4 dinh thay vi 6 dinh). Khong xoa model nao, khong doi hinh hoc flap.
- He qua so lieu: first-load Hanoi 21.83 / 17.20 MB -> 21.61 / 16.99 MB (giam 213,300 byte ca hai moc, check-3d.mjs cap nhat theo so that tren o dia); sau vong sua 3B la 21.61 / 16.98 MB vi atlas.webp nhe hon 8,584 byte (xem muc 11).
- Nhan man hinh load van khop so that sau khi sua N7: "hanoi-tiles.glb 3.5 MB" (3,464,792 byte = 3.46 MB, lam tron 1 chu so thap phan la 3.5 MB), GLB_BYTES.hanoiTiles 3,464,792, atlas.webp 2,541,108.

## 7. Sua 2 nit ton tu 3A (lam luon trong phase nay vi 3B build lai GLB)

- N5b - JSDoc loader.js (khoi 3D-02 ROLLBACK): 1543 o / 25 model / 57 o -> 1321 o / 47 model / 279 o; "96% map" -> "83% map". Dung so that sau 3B.
- N7 - hang kich thuoc: GLB_BYTES.hanoiTiles 2,496,552 -> 3,464,792 (sau khi ha SEG, xem muc 6), label "2.4 MB" -> "3.5 MB"; TEXTURE_BYTES_FALLBACK atlas.webp 2,568,020 -> 2,541,108. Kiem tra nhan man hinh load khop so that.

## 8. Cach tu kiem tra bang mat (tren trinh duyet, ?map=hanoi)

- Mo map, nhin minimap: Ho Tay (trai-tren) la vung xanh lam lon nhat, Ho Guom (giua) la vung xanh luc nho hon, phan biet ngay.
- Spawn o duong dao phia nam Ho Guom (0,5). Di bo vong quanh ho: thay duong dao `k` bao tron ho, den cau trang, hang co do.
- Dung o bo tay ho (-3,-1) nhin sang: Thap Rua dung giua ho tren dao 1 o, khong co cau noi bo.
- Di ve dong: qua cau The Huc do cong sang dao Ngoc, den Ngoc Son o (5,-2).
- Sang Ho Tay: di ve tay-bac, thay dam sen hong o goc tay-nam, di tiep len dao Tran Quoc qua cau da thap o (-12,-12) - chua 11 tang cao nhat, cua quay ve huong dong (phia cau).
- Checklist mo len: dem 0/11, di het 11 landmark (them Tran Quoc), dia minimap danh so 1-11.
- Lang Bac: dung truoc lang thay 3 bac cap da xam + cot co do, khong con khoi nau + bac kraft.
- Song Hong: di xuong cau Long Bien, thay song rong hon o doan duoi cau (x=16, z -5..5).

## 9. Diem con thieu / chua xong

- GLB vuot 3.5 MB (muc 6): DA SUA - ha SEG24 -> SEG16, GLB nay 3,464,792 bytes, duoi muc tieu, check-3a 197 PASS 0 FAIL.
- Chu "Quy Son Thap" mo tren tang 3 Thap Rua: DA SUA o vong sua 3B (muc 11) - chu co tren sprite hero, da crop va nhin bang mat. Recipe placeholder van khong co chu (flat-colour fallback khong ve duoc chu; chi sprite moi la duong hien thi that trong game).
- Cua Tran Quoc quay ve huong dong (rot 3): tinh theo ly thuyet xoay (rot 1 = 90 do theo chieu kim dong ho nhin tu tren), chua kiem tra bang mat.
- Khong co kiem tra live-browser / thiet bi that tu subagent nay. Thiet bi cua user moi la check cuoi cung theo quality gate.
- So lieu muc 5b da dien day du sau khi chay lai (check-3b 69/0, check-3d 115/0, check-basic 64/0).
- 3A-17: chi con 0 o road tren map (nga (-3,-6) da thanh path_t) nen brick print khong con o nao hien - code print van giu nguyen, model van trong registry.

## 10. File da doi (chi trong ~/workspace/hanoi-3d va ~/workspace/3dlabobo)

- src/world/hanoi-map.js (40 hang map moi, 7 ky tu legend moi, landmark + spawn)
- src/world/hanoi-models.js (6 model moi, socket Thap Rua doi all-grass)
- src/world/hanoi.js (spawn tra ve tu createHanoi)
- src/main.js (initialPosition dung wfc.spawn)
- src/game/landmarks.js (NAMES + ORDER 11, minimap to mau nuoc theo tileId)
- src/game/landmark-history.js (entry tranquoc + DATASET_PROVENANCE 11)
- docs/landmark-history.md (muc tranquoc)
- src/assets/loader.js (RECIPES 6 model moi + sua thap/chua/lang + N5b JSDoc + N7 hang kich thuoc)
- tools/step5/build-hanoi-glb.mjs (mirror RECIPES + SOCKETS + SEG16 + HERO)
- tools/step5/verify-glb.mjs (hinge count + node 47)
- src/render/water.js (waterKind them HANOI_MODELS)
- src/core/config/world.js (ponds them 3 id ho)
- src/core/config/edge.js (comment + validLandmarksData + seen.size 10 -> 11)
- data/provenance.json (checklistOrder + budget 11 -> 12)
- workers/hanoi-edge/src/index.js (DECLARATION_TEXT + budget mac dinh 11 -> 12 + herd floor 11 -> 12)
- index.html (0/10 -> 0/11)
- README.md (10 -> 11 landmarks + Tran Quoc)
- public/models/hanoi-tiles.glb (build lai local, 3,464,792 bytes)
- tools/check-3b.mjs (moi)
- tools/check-2b.mjs, tools/check-2d.mjs, tools/check-3a.mjs, tools/check-3d.mjs, tools/check-solver-options.mjs (cap nhat so 3B)
- docs/phase-3b-manifest.md (file nay)
- ~/workspace/3dlabobo/index.html + README.md + README.vi.md (tile Lab 06: 10 -> 11 landmarks)
- KHONG cham: src/world/wfc.js, src/world/tiles.js, src/core/models.js, key luu hanoi:v1:, tiles.glb goc.

## 11. Vong sua 3B (fix F1/F2/F3/N1/W1/O1 theo docs/phase-3b-verification.md)

- Ngay: 2026-11-21. KHONG push, KHONG commit. Chi sua file trong ~/workspace/hanoi-3d.

### F1 - Chu "Quy Son Thap" tren tang 3 Thap Rua: DA SUA, chon cach (a) ve vao sprite

- Chon cach (a) ve them vao sprite thap hien co, khong chon cach (b) flap bang moi: flap bang se nam sau hero art card trong GLB nen khong bao gio hien, va recipe placeholder flat-colour khong ve duoc chu, nen chi sprite moi la duong hien thi that trong game.
- Script moi: tools/step5/fix-turtletower-sign.py (PIL, DejaVuSerif-Bold 9 px). Ve 1 bang giay (paper #efe0c2, vien muc, x 44..135, y 84..98 trong sprite) treo duoi mai tang 3, chu muc "QUY SON THAP" giua bang.
- Ly do co bang giay: tuong tang 3 chi co dai xam hep y 84..92 tren dau 3 cua vom; chu tran co 10-11 px o dai do tran ra ngoai tuong va cat qua duong mai (da thu tren ban copy truoc, loai bo). Bang giay lam chu doc duoc ma khong pha sprite.
- Sprite khong doi rect: atlas.json giu nguyen [16, 2600, 179, 302]; chi pixel trong rect doi. Atlas.webp 2,541,108 -> 2,532,524 byte (giam 8,584 byte do luu lai WEBP quality 90 / method 6 nhu build-atlas.py). TEXTURE_BYTES_FALLBACK trong src/assets/loader.js cap nhat theo so that moi.
- Kiem tra bang mat (da xem, khong phai doan): crop sprite tu atlas that sau khi sua, phong 4x va 6x - chu "QUY SON THAP" doc ro tren bang giay o tang 3; mai, cua vom, reu chan thap khong doi. Crop truoc/sau luu o /tmp (turtletower-before.png, turtletower-after.png).
- Recipe placeholder van 13 flap, khong co chu: day la gioi han cua fallback flat-colour, ghi ro chu khong gia vo da sua.

### F2 - Hang co do sat vong dao Ho Guom: DA SUA, 4 co o 4 goc vong dao

- Doi 4 o sidewalk goc vong dao thanh co do (tai dung model hanoi_flag 3A-09, khong model moi): (-2,-7), (1,-7), (-2,4), (1,4). Moi o ke 2 mat nuoc, nam tren nen granite giong sidewalk, tag village (khong blocker, khong chan loi di).
- So dem moi: co 6 -> 10, sidewalk 14 -> 10. Socket khong doi (co va sidewalk deu all-grass), socket mismatch van 0. Hang bac/nam vong dao giu nguyen sidewalk nen check 3B-06 cu khong doi.
- Check cap nhat: check-3a.mjs (co 10, sidewalk 10), check-2b.mjs + check-solver-options.mjs (o (-2,-7) chuyen tu danh sach sidewalk sang danh sach flag, tong street cell van 35), check-3b.mjs them 2 check F2.

### F3 - Hang da ke bo tren o pond: DA SUA, bang base print (khong flap)

- Chon base print vi re va chac: them vong da (paperShade, toi hon mot chut x 0.88 trong GLB) rong 0.1 quanh mep dia nuoc, o ca src/assets/loader.js (baseTexture: stroke arc ban kinh 0.55, lineWidth 0.1) va tools/step5/build-hanoi-glb.mjs (buildBase: dinh co hypot 0.47..0.6 doi mau da). Ap cho ca 3 loai o pond (guom, tay, lotus), khong ap cho o cau da.
- Kiem tra trong GLB that (parse truc tiep, mau linear): moi base pond co dung 24 dinh vong da (khop mo phong SEG16), 45 dinh nuoc ben trong; cau da co 0 dinh vong da. GLB build lai: 3,464,792 byte, khong doi kich thuoc, van duoi 3.5 MB.
- Check cap nhat: check-3b.mjs them 2 check F3 (chuoi "stone bank ring" co o ca loader va builder).

### N1 - Nit doc "10 landmarks": DA SUA, 5 cho (verifier liet ke 4, tim them 1)

- docs/antirea-plan.md:14: "10 landmarks" -> "11 landmarks".
- docs/antirea-declaration.md:16: "the 10 landmark histories" -> "the 11 landmark histories"; :52: "the 10 landmarks always" -> "the 11 landmarks always" va them tranquoc vao danh sach thu tu (sau westlake, dung thu tu checklist); :58: "(10 landmark anchors + cell count)" -> "(11 landmark anchors + cell count)".
- Cho thu 5 verifier chua liet ke, cung trang: :68 "the whole dataset is 11 records (1 map + 10 histories)" -> "12 records (1 map + 11 histories)" (khop budget Worker 12 da sua o 3B).
- Cac file lich su phase 2b/2c/2d giu nguyen (ghi dung so thoi do).
- N1b - Sot trong workers/hanoi-edge/README.md: DA SUA, 6 cho (10 -> 11 histories; budget 11 -> 12 records; herd floor 11 -> 12; check live 10 -> 11 landmarks) + them file vao countedFiles cua check-3b.mjs (11 -> 12 file quet stale "10", check-3b PASS 74/0).

### W1 - Luat walkable trong check coi cau la nuoc: DA SUA, chi sua check, khong sua game

- Luat moi trong tools/check-3b.mjs, tools/check-3a.mjs, tools/check-2b.mjs: o co tag 'bridge' thi walkable, ke ca khi tag co 'water' (khop in-game: world.js deck clearance kind 2, "bridge decks are free"). tools/check-solver-options.mjs khong co dinh nghia walkable/BFS nao (chi 1 comment) nen khong co gi de sua o do.
- Ket qua chay lai: reachable tu spawn (0,5) = 913 o (khop so verifier dem doc lap), thay vi 908 duoi luat cu. +5 o: thehuc (3,-2), path_end (2,-2), 2 o longbien (17,-6) (18,-6), path_end (19,-6). Baseline check-3a doi 908 -> 913 (check chinh xac === 913), check-3b them check === 913. Moi anchor van discover duoc.

### O1 - Dinh flap the gioi vuot 1.5: CHI GHI CHU, khong doi code

- Dinh flap the gioi (cong khoang lop 0.004) la cathedral 1.522 va tranquoc 1.508, vuot 1.5 neu doc gioi han theo cao the gioi. Dinh nghia chuan tu Phase 2 la cao local (cathedral 1.49, tranquoc 1.44) va verify-glb dung dinh nghia do, nen khong tinh la loi. Ghi chu nay de sau nay khong ai doc nham gioi han.

### He qua so lieu sau vong sua

- Atlas nhe hon 8,584 byte nen first-load Hanoi doi: truoc 21.61 MB (21,606,400 byte), sau 16.98 MB (16,980,178 byte) thay vi 16.99 MB luc 3B; deferred animals van 4.63 MB. check-3d.mjs cap nhat (j) theo so that tren o dia.
- GLB khong doi kich thuoc (3,464,792 byte); bundle sau vong sua: dist/assets/index-C5CARRqL.js 1,123,634 byte (1,123.63 kB, gzip 339.82 kB), xem muc 5.
- Check moi: check-3b 69 -> 74 PASS (them 5 check: 913, 2 check F2, 2 check F3); cac suite khac giu so luong check, chi doi gia tri ky vong (co 10, sidewalk 10, baseline 913, after 16.98 MB).

### File doi them o vong sua (ngoai muc 10)

- tools/step5/fix-turtletower-sign.py (moi)
- public/textures/art/atlas.webp (ve chu vao sprite turtletower, 2,541,108 -> 2,532,524 byte)
- public/models/hanoi-tiles.glb (build lai cho vong da F3, 3,464,792 byte, khong doi kich thuoc)
- src/world/hanoi-map.js (4 o goc vong dao k -> 9)
- src/assets/loader.js (vong da baseTexture + TEXTURE_BYTES_FALLBACK moi)
- tools/step5/build-hanoi-glb.mjs (vong da buildBase)
- tools/check-3b.mjs (luat bridge-walkable, check 913, check F2/F3, ghi chu F1)
- tools/check-3a.mjs (luat bridge-walkable, baseline 913, co 10, sidewalk 10)
- tools/check-2b.mjs (luat bridge-walkable, o (-2,-7) sidewalk -> flag)
- tools/check-solver-options.mjs (o (-2,-7) sidewalk -> flag)
- tools/check-3d.mjs ((j) after 16.99 -> 16.98 MB)
- docs/antirea-plan.md, docs/antirea-declaration.md (N1, 5 cho)
- docs/phase-3b-manifest.md (file nay: muc 11 + cap nhat ASCII, 3B-06/3B-09/3c/bang muc 4/muc 6)
