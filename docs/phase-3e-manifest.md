# Phase 3E manifest - Tau 3 toa chay quanh map Hanoi

- Ngay: 2026-11-21
- Pham vi: checklist 3E-01..3E-07 theo spec docs/phase-3-spec.md muc 2.5, muc 3 phase 3E, muc 4 tieu chi 3E, muc 6 trap T1-T10
- Quyet dinh Q5/Q6: tau chay VONG kin, tau KHONG co tieng (giu im lang)
- Ket luan: HOAN THANH 7/7 muc theo code + check tu dong. Chua nhin thay that tren trinh duyet - may user la decider.
- KHONG push, KHONG commit, KHONG upload binary.

## 1. Tung muc 3E-01..3E-07

### 3E-01 - Tau 3 toa

- 1 dau may + 2 toa hanh khach. Moi toa dai 4 unit (2 tile), rong 1 unit (0.5 tile), cao 1.10. Toan doan 12.8 unit = 6.4 tile (6 tile + 2 khoang noi 0.4 unit = 0.2 tile).
- Mau: dau may do 0xa83c28, toa xanh la dam 0x2f5d46, cua so vang 0xe8b93c (mau tau Ha Noi - Hai Phong).
- File: src/game/train.js (buildCar, MAT).

### 3E-02 - Duong ray vong kin

- Vong hinh chu nhat bo tron (fillet 1 unit), diem moc (cell, theo thu tu chay):
  (7,17) -> (-9,17) -> (-9,-10) -> (-7,-10) -> (-7,-16) -> (7,-16) -> (7,-2) -> (8,-2) -> (8,-1) -> (8,0) -> (7,0) -> (7,17).
- Dai vong that: 196.6 unit = 98.3 tile (spec khoang 100-110; lech 1.7 tile do fillet cat goc).
- Ray: 2 thanh thep + tam go + da balat, ve bang ribbon + InstancedMesh trong train.js (KHONG phai base print - xem muc 4, ly do GLB).
- Ga Ha Noi o goc dong-nam (7,17): san ga + bien "GA HA NOI".
- Ven Ho Tay: canh tay x=-9 chay sat bo dong ho (z -10..-3), doan bac x=-7 chay sat bo dong-bac ho.
- Cau Long Bien: VONG KHONG QUA CAU (xem muc 4). Canh dong chay x=7, cach cau khoang 10 tile ve phia tay.

### 3E-03 - Toc do + lich

- 2.5 unit/giay (1.25 tile/giay), nhanh gap hon 2 lan traveller (1.15). Pho duong tau cham con 1.5 unit/giay.
- Het vong that: 81.6 giay (tich phan tren duong that: 185.6 unit o 2.5 + 11.0 unit pho tau o 1.5). Ghi chu: spec ghi 160-180 giay la sai so hoc - chinh so cua spec (100 tile / 1.25 tile/giay) da cho 80 giay.
- Tau khong dung o ga, chay lien tuc, 1 chieu, khong dao chieu.
- Tau CHI chay o ?map=hanoi (main.js: `hanoi ? createTrain(...) : null`). Che do WFC khong co tau.

### 3E-04 - Pho duong tau

- Doan thang 6 tile o canh tay Pho Co: x=-9, z -8..-3 (toan o path, khong nha nao nam tren ray).
- Nha ong 2 ben cach ray 1 unit (0.5 tile): ben dong la nha/stall co san trong map (cot dien, bien bia, quan pho, ganh hang, xe dap o x=-8); ben tay la 3 mat nha procedural (vang/xanh la/dat) trong train.js.
- Ghe nhua 8 cai xep sat tuong 2 ben ray. Quan ca phe nho + bien "CA PHE DUONG TAU" (chu that, CanvasTexture) o dau nam doan pho.
- Cot bao hieu + den o 2 dau doan pho: den DO khi dau tau cach doan pho duoi 24 unit, xanh la khi xa. Chi hieu ung MAU, KHONG am thanh (Q6).
- Them 2 cot bao hieu trang/do o nga tu ray (-9,0) va (7,0).

### 3E-05 - Tau khong giet traveller

- Neu traveller dung tren ray: tau DAY NHEN ra khoi ray (day ngang 1.15 unit sang ben con cho dung duoc; neu ca 2 ben deu bi chan thi day doc theo ray ra truoc/sau tau).
- Khong co co che chet, khong game over. Ghi ro trong code (train.js pushTraveller + header) va check-3e chay that ca 3 truong hop (ngoai ray, tren ray, 2 ben bi chan).
- Gioi han cu (da sua o vong sua sau verify, muc 6): neu ca day ngang, day truoc va day sau deu khong co cho dung duoc, tau phanh ve 0 va dung lai thay vi chay qua, chi chay lai khi ray phia truoc da trong.

### 3E-06 - Object rieng, an o low

- Tau la 1 object di chuyen (THREE.Group + 3 car Group), khong phai tile WFC: khong nam trong luoi tile, khong tinh vao solver, khong anh huong streaming/fold. Lich trinh doc lap (duong + toc do + toa) trong train.js.
- Ray + tam + do pho la object tinh rieng, khong dung BatchedMesh cua tile. Tong cong them khoang 20 mesh + 1 InstancedMesh (tam go).
- An tau o low: train.setQuality('low') an nhom tau chay (duong ray + do pho van hien, gan nhu khong ton frame). Gan vao scaler 2E qua apply() trong main.js + trang thai khoi tao theo state.quality.

### 3E-07 - Khong am thanh

- Tau hoan toan im lang: khong tieng banh xe, khong coi. train.js khong import audio, khong goi bat ky API am thanh nao (check-3e kiem).

## 2. File da doi (chi phase 3E)

| File | Doi gi |
|---|---|
| src/game/train.js | Moi: duong vong, ray, tau 3 toa, pho duong tau, day traveller, an o low |
| src/main.js | Import createTrain; tao tau chi khi hanoi; tick train.update(dt) sau traveller; hook train.setQuality(next) vao scaler apply() |
| tools/check-3e.mjs | Moi, 65 check cho 3E-01..3E-07 |
| docs/phase-3e-manifest.md | File nay |

- Khong cham: src/world/hanoi-map.js (40x40, 0 o doi), src/world/hanoi-models.js (47 model), src/world/wfc.js, src/world/tiles.js, src/core/models.js, tiles.glb goc, hanoi-tiles.glb (3,464,792 byte, khong doi), key luu hanoi:v1:, discovery radius 1, checklist 11 landmark.

## 3. Ket qua verify (so do that)

| Check | Ket qua |
|---|---|
| npm run build | PASS - bundle dist/assets/index-Bk6Y4sqw.js 1,141,967 byte (1,141.96 kB, gzip 345.89 kB), 66 modules (truoc 3C: index-DWLUT19v.js 1,132.47 kB, +9.5 kB) |
| node tools/check-3e.mjs | 65 PASS, 0 FAIL |
| npm run check:hanoi | ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED (0 degenerate, GLB khong doi) |
| node tools/check-3c.mjs | 206 PASS - ALL 3C CHECKS PASSED |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL |
| node tools/check-3b.mjs | 74 PASS, 0 FAIL |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL |
| node tools/check-2b.mjs | ALL 2B CHECKS PASSED |
| node tools/check-2c.mjs | 91 PASS, 0 FAIL |
| node tools/check-2d.mjs | 144 PASS, 0 FAIL |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL |
| node tools/check-basic.mjs | ALL BASIC CHECKS PASSED |
| node --check | PASS cho train.js, check-3e.mjs, main.js |

- So do that tu check-3e: vong 196.6 unit = 98.3 tile, 786 sample, 8 sample qua o nuoc cau (-8,-10), 0 sample qua nha/cay/da/song; het vong 81.6 giay; day traveller 1.15 unit ngang, 2.83 unit doc khi 2 ben bi chan; toc do dat 2.50 ngoai pho, 1.50 trong pho.
- 0 dau gach dai trong train.js, check-3e.mjs, main.js (check-3d quet pass).

## 4. Leach spec co chu y (da ghi ro, khong giau)

1. Ray khong phai base print: ve bang ribbon + InstancedMesh trong train.js. Ly do: hanoi-tiles.glb dang 3,464,792 / 3,500,000 byte (chi con 35,208 byte); them tile ray + build lai GLB se vuot nut, va tile ray doi hoi doi ~100 o map + socket. Hinh anh giong nhau (2 thanh thep + tam go + balat); doi lai la 0 tac dong len solver/map/GLB.
2. Vong khong qua cau Long Bien: song Hong chi co 1 cau; vong kin khong the qua song 2 lan ma khong di lui. Canh dong chay x=7, cach cau khoang 10 tile. Neu user muon tau qua cau thi phai doi Q5 (tau chay thang + quay dau) hoac them cau thu 2 - can user chot.
3. Vong vuot 1 o nuoc (-8,-10) bang cau go ngan: khong co duong tren can nao quanh mui ho nay (loi di bo bi cay, bui, nha ong chan). Toan bo vong con lai tren can.
4. Het vong 81.6 giay, khong phai 160-180 giay nhu spec ghi (sai so hoc cua spec, xem 3E-03).
5. Nha ben tay pho duong tau la object procedural (khong phai tile map) nen traveller di xuyen qua duoc - chi la loi my thuat, khong chan loi di that. Da sua o vong sua sau verify (muc 6): tau day traveller ra khoi footprint nha.

## 5. Diem con thieu / chua xong

- Chua nhin thay that tren trinh duyet: sandbox khong co headless browser. Mau tau, do doc bien "CA PHE DUONG TAU" / "GA HA NOI" o 390px, do sat cua nha 2 ben ray, den bao hieu co thay ro khong - may user la decider.
- Chua do FPS that khi tau chay qua spawn (?fps=1): uoc tinh them ~20 mesh + 1 InstancedMesh la nhe, nhung so that chi co tren may user.
- Tau xuat phat o ga (7,17), cach spawn (0,5) khoang 37 unit; lan dau thay tau sau toi da 81.6 giay choi (tieu chi 3E: thay tau it nhat 1 lan trong 3 phut - dat).
- Impeccable detect / Hallmark sloplint khong chay (loi tool da biet theo trap T9).

## 6. Vong sua sau verify (2026-11-21, fixer, KHONG push, KHONG commit)

Verifier doc lap ket luan CONDITIONAL GO (docs/phase-3e-verification.md): 1 blocker B1 + 4 nit N1-N4. Vong sua nay sua het ca 5, chi trong src/game/train.js, tools/check-3e.mjs va file manifest nay.

- B1 (blocker, da sua): them dong `g.add(ribbon(off(-0.35), path.length, 0.09, 0.035, MAT.steel));` trong buildTrack. Ray gio co du 2 thanh thep, doi xung +-0.35 quanh tim ray.
- N1 (da sua): cua so truoc dau may doi tu box day 0.5 nam chìm trong than xe thanh tam mong 0.04 dat tai x=2.01, ngay tren mat truoc dau may (mat truoc o x=2.0) nen nhin thay duoc. Van mau vang 0xe8b93c, cao 0.34, rong z 0.7 nhu cu.
- N3 (da sua): "cach cau khoang 6 tile" thanh "cach cau khoang 10 tile" o ca 2 cho trong manifest (muc 3E-02 va muc 4 item 2), va comment tuong ung trong train.js ("about 10 tiles west of the bridge").
- N2 (da sua, giu lai): them `pushOutOfStreetHouses()` trong train.js, chi dung pattern day traveller da co. Khi traveller lot vao footprint 1 trong 3 mat nha pho tau (x=-19.7, z -10/-8/-6, cong them margin 0.3), tau day ra mep gan nhat trong 4 mep, chi nhan mep nao canStand tra walkable. Gọi moi tick trong update(), truoc pushTraveller. Khong sua traveller.js, world.js hay map. Test rieng trong check-3e: traveller dat giua nha (-19.7, -10) bi day ra (-18.75, -10), goi lai tra false (khong day giat, khong ket).
- N4 (da sua, giu lai): them fallback phanh trong train.js, khong doi toc do binh thuong 2.5/1.5, khong am thanh, khong game over. Moi tick, truoc khi chay, tau kiem tra: traveller con nam trong hinh chu nhat toa nao khong, va traveller co dung tren ray phia truoc dau may trong 5 unit khong. Neu co, tau thu day (day ngang roi day doc ray, dung lai helper tryPushFromPose); day duoc thi chay tiep, day khong duoc thi target speed = 0 va tau phanh dan ve 0 theo ramp 3 unit/s/s co san (khong dung dot ngot), dung yen cho toi khi ray phia truoc trong (traveller tu di ra hoac day duoc) thi chay lai. Test rieng trong check-3e: traveller dung yen tren cau (-8,-10), world tra isWalkable false khap noi (gia lap khong con cho dung): sau 5 s tick, toc do tau = 0, tau con cach traveller 4.98 unit (khong xuyen qua), traveller khong bi dich chuyen; mo lai isWalkable thi sau 2 s tau chay lai toc do 2.50.
- Check dem ray thep (bat buoc, bo sung vao tools/check-3e.mjs): dem dong co ca `ribbon(` va `MAT.steel` trong train.js, phai = 2. Day la check da thieu nen B1 lot qua; check-3e gio co 73 check (65 cu + 1 dem ray + 2 N2 + 5 N4).

Ket qua check moi (chay that sau sua):

| Check | Ket qua |
|---|---|
| npm run build | PASS - bundle dist/assets/index-CBAsYfkx.js 1,143,398 byte (1,143.39 kB, gzip 346.40 kB), 66 modules |
| node tools/check-3e.mjs | 73 PASS, 0 FAIL (gom dem ray thep = 2, test N2, test N4) |
| npm run check:hanoi | ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED (GLB khong doi, 3,464,792 byte) |
| node tools/check-3c.mjs | 206 PASS - ALL 3C CHECKS PASSED |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL |
| node tools/check-3b.mjs | 74 PASS, 0 FAIL |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL |
| node tools/check-2b.mjs | ALL 2B CHECKS PASSED |
| node tools/check-2c.mjs | 91 PASS, 0 FAIL |
| node tools/check-2d.mjs | 144 PASS, 0 FAIL |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL |
| node tools/check-basic.mjs | ALL BASIC CHECKS PASSED |
| node --check src/game/train.js, tools/check-3e.mjs | PASS ca 2 |

- Khong doi GLB, khong doi map, khong doi key hanoi:v1:, storage visited, discovery radius 1, checklist 11; solver giu 95/96; tau van khong tieng.
- File doi o vong sua: src/game/train.js, tools/check-3e.mjs, docs/phase-3e-manifest.md.
