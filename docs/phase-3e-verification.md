# Phase 3E verification - Tau 3 toa chay quanh map Hanoi (verifier doc lap)

- Ngay: 2026-11-21
- Vai tro: verifier doc lap, KHONG sua file game. Moi so duoi day do verifier tu chay, khong lay lai so cua fixer.
- Co so: spec docs/phase-3-spec.md muc 2.5 (3E-01..3E-07), muc 3 phase 3E, muc 4 tieu chi 3E, muc 6 trap; manifest docs/phase-3e-manifest.md; quyet dinh Q5 vong kin, Q6 khong tieng.
- Phuong phap: doc code train.js + main.js; script kiem tra RIENG tools/verify-3e-own.mjs (viet moi, chay xong da xoa khoi repo, ban goc con o /tmp/verify-3e-own.mjs); tu tinh lai do dai vong, thoi gian het vong, danh sach o vong, o nuoc, day traveller; tu chay build + toan bo check hoi quy.
- Ket luan: CONDITIONAL GO - chi 1 loi blocker (B1, sua 1 dong) + 4 nit. Sua xong B1, chay lai check-3e + dem ray thep, la GO, khong can verify lai toan bo.

## 1. Bang PASS/FAIL tung muc 3E-01..3E-07

| Muc | Ket qua | Bang chung (verifier tu do) |
|---|---|---|
| 3E-01 Tau 3 toa | PASS (nit N1) | Hang so: TRAIN_CAR_COUNT 3, CAR_LEN 4, CAR_W 1, CAR_H 1.10, GAP 0.4, TOTAL_LEN 12.8; tam toa cach nhau 4.4 unit (do that tu train that sau 10 s chay). Mau: dau may 0xa83c28 do, toa 0x2f5d46 xanh la dam, cua so 0xe8b93c vang. Dau may buildCar('loco'), 2 toa buildCar('car'). |
| 3E-02 Vong ray kin | FAIL (blocker B1) | Vong kin that: pointAt(0) == pointAt(length), buoc sample toi da 0.250, 786 sample, dai 196.59 unit = 98.29 tile (spec khoang 100-110). 100 o vong, 0 o nha/cay/da/landmark, 0 anchor landmark nam tren vong. Qua ga (7,17), pho tau x=-9 z -8..-3, ven Ho Tay x=-7, KHONG cham cau Long Bien (17,-6)/(18,-6). NHUNG: chi co 1 thanh thep thay vi 2 (xem B1). Ballast ribbon 1.5 rong co, tam go InstancedMesh co (218 tam). |
| 3E-03 Toc do + lich | PASS | Toc do that voi dt=1/60: dat 2.50 unit/s ngoai pho sau 10 s; trong pho min 1.50. Traveller 1.15 (src/core/config/player.js:3), tau nhanh gap 2.17 lan. Het vong tu tich phan rieng: 81.57 s (duong cham 11.00 unit o 1.5, con lai o 2.5). Tau khong dung o ga, 1 chieu, khong dao chieu (code + check-3e). |
| 3E-04 Pho duong tau | PASS | Doan x=-9, z -8..-3 (6 tile) dung. Nha tay o x=-19.7, mat nha o -19.05, cach tam ray (-18) 1.05 unit = dung 0.5 tile nhu spec. Bien "CA PHE DUONG TAU" chu that (CanvasTexture), bien "GA HA NOI" o ga (7,17). Ghe nhua 8 cai 2 ben ray, z -15..-7 (theo toa do world, nam trong doan pho). Cot bao hieu + den o 2 dau pho (z=-17 va z=-5 world, kep dung doan pho world z -16..-6), den DO khi dau tau cach tam pho duoi 24 unit, xanh la khi xa, chi hieu ung mau. Cot bao hieu trang/do o nga tu ray (-9,0) va (7,0). |
| 3E-05 Day traveller | PASS (gioi han N4) | Test rieng 5 truong hop: xa ray thi khong day, khong doi vi tri; dung truoc mui tau chay 2 s thi bi day ra, khong bao gio nam trong hinh chu nhat toa o cuoi tick nao; dung giua toa giua thi day dung 1.15 unit ngang; 2 ben bi chan thi day doc ray; khong co co che chet/game over (grep da loai cau ghi chu). Gioi han: khong con cho dung nao thi push tra false, tau chay xuyen qua (xem N4). |
| 3E-06 Object rieng, an o low | PASS | main.js:158 `hanoi ? createTrain(...) : null` (chi Hanoi, WFC khong co tau); main.js:186 tick train.update(dt) sau traveller; main.js:289 hook train.setQuality(next) trong scaler apply(). Test that: low thi an + dung yen (s khong doi), med/high thi hien lai. train.js khong cham wfc/tiles/world/MODELS/GLB. Map van 40x40, legend 85 ky tu, registry Hanoi 47 model, hanoi-tiles.glb 3.464.792 byte khong doi, solver 95/96. |
| 3E-07 Khong tieng | PASS | Grep train.js: 0 token Audio, AudioContext, Oscillator, GainNode, .play(, createPaperAudio, createMusic, audio/. Chi co chu ghi "No sound at all (Q6)" trong comment. Tau im lang dung Q6. |

- Script kiem tra rieng cua verifier: 49 PASS, 1 FAIL (chi FAIL la dem ray thep).
- Check-3e cua fixer chay lai: 65 PASS, 0 FAIL - NHUNG no khong dem ray thep (xem B1), nen 65/65 khong phat hien duoc loi nay.

## 2. Loi

### B1 - BLOCKER: ray chi co 1 thanh thep thay vi 2 (3E-02)

- Spec: "Ray gom 2 thanh thep + tam go (base print)".
- Code src/game/train.js buildTrack (dong 263-268): comment ghi "Two steel rails, one ribbon each, offset sideways from the centre line", ham off(dx) da viet san, nhung chi co 1 dong goi: `g.add(ribbon(off(0.35), path.length, 0.09, 0.035, MAT.steel));`. Dong `ribbon(off(-0.35), ...)` bi thieu.
- Dem rieng cua verifier (dem dong co ca `ribbon(` va `MAT.steel`): 1. Ballast 1 ribbon, tam go InstancedMesh 218 tam: dung.
- He qua: ray lech 1 ben (+0.35), nhin gan se thay ro chi co 1 thanh thep; hinh anh duong ray khong dung spec.
- Vi sao check-3e khong bat duoc: grep tools/check-3e.mjs cho thay khong co check nao dem ray thep (chi co check "on the rails" cho day traveller). 65/65 PASS la dung voi nhung gi no kiem, khong phai bang chung ray du 2 thanh.
- Sua: them 1 dong `g.add(ribbon(off(-0.35), path.length, 0.09, 0.035, MAT.steel));` trong buildTrack. Sau sua: chay lai node tools/check-3e.mjs + dem ray thep = 2.

### N1 - Nit: cua so truoc dau may bi chet (khong nhin thay)

- buildCar('loco'): cua so truoc box(0.5, 0.34, 0.7) tai x=1.72 nam HOAN TOAN trong than dau may (than x +-2.0, z +-0.5; cua so z +-0.35, x 1.47..1.97) nen bi than che, khong bao gio thay duoc. Mat truoc dau may se chi la mau do tron. Nha den (headlamp) chi tho ra 0.08 unit.
- Muc do: nit my thuat, chi doc code (chua nhin that tren trinh duyet). Sua goi y: cho cua so truoc rong z 1.04 nhu dai cua so ben, hoac dich ra x=2.01.

### N2 - Nit: nha tay pho duong tau khong co va cham (leeh spec 5, fixer da khai)

- 3 mat nha procedural o x=-19.7 chi la mesh them vao scene, khong co collider nao dang ky (grep train.js: 0 tu khoa collid/obstacle; va cham traveller theo tile map nen khong thay nha nay).
- Traveller di xuyen qua duoc 3 mat nha nay. Day la vat trang tri moi, khong chan loi di that, nhung trai voi chuan cua user (khong vat nao duoc di xuyen).
- Muc do: nit, chap nhan duoc cho phase nay neu user dong y; neu muon sua thi can co che va cham cho object procedural (nam ngoai pham vi 1 dong).

### N3 - Nit: manifest ghi sai khoang cach toi cau (chi sai chu, khong sai code)

- Manifest muc 4.2: "canh dong chay x=7, cach cau khoang 6 tile". Do that: cau o x=17, vong o x=7, cach 10 tile; mep tay song o x=16, cach 9 tile.
- Khong anh huong code. Sua chu trong manifest khi sua B1.

### N4 - Nit: gioi han day traveller khi khong con cho dung (fixer da khai)

- pushTraveller tra false khi day ngang, day truoc va day sau deu khong dung duoc; luc do tau chay xuyen qua traveller.
- Test rieng cua verifier tai hien duoc: world isWalkable tra false khop noi thi push tra false.
- Truong hop duy nhat theo manifest: traveller dung tren cau 1 o nuoc (-8,-10). Rat hep, khong co game over, khong phai blocker.

## 3. Pham quyet tung diem lech spec 1-5 (doc lap)

### Lech 1 - Ray ribbon + InstancedMesh thay vi base print: CHAP NHAN DUOC

- Kiem lai: ballast ribbon rong 1.5 o y=0.012, 1 thanh thep (thieu 1, xem B1), tam go InstancedMesh 218 tam, cau go o (-8,-10). Ribbon dung theo path.samples nen bam dung tuyen vong, ke ca doan cong fillet 1.0 va doan jog quanh nha tho (7,-2)-(8,-2)-(8,-1)-(8,0)-(7,0).
- Ly do GLB dung: hanoi-tiles.glb 3.464.792 / 3.500.000 byte (con 35.208 byte headroom), them tile ray + build lai GLB co nguy co vuot nut; them tile ray doi hoi doi ~100 o map + socket. Da xac nhan GLB khong doi (3.464.792 byte) va solver van 95/96.
- Anh huong streaming/fold: khong. Ray + tam + do pho la mesh tinh them 1 lan vao scene, khong dung BatchedMesh cua tile, khong nam trong luoi tile, khong cham loader. Tau la 1 THREE.Group rieng, cap nhat vi tri moi frame, khong anh huong fold.
- Luu y: lech nay dung ve phuong phap, nhung B1 (thieu 1 thanh thep) la loi rieng nam trong cach ve nay, phai sua.

### Lech 2 - Vong KHONG qua cau Long Bien: CHAP NHAN DUOC (bat buoc ve hinh hoc)

- Tu kiem chung tu map that: song Hong chay doc x 16..18, z -19..18 (88 o river), chi co 1 cau o (17,-6)/(18,-6). Hai dau song ket o z=-19 va z=18 bang river_source; hang z=-20 va z=19 tai x 16..18 la rung (forest), khong phai dat di duoc.
- Vay vong kin 1 chieu khong the qua song 2 lan: qua cau 1 lan thi muon ve phai qua lai dung cau do (di lui, trai 1 chieu) hoac vong qua dau song (phai chay tren hang mep map day rung, trai "cach mep 2 tile" va ray khong chay qua rung duoc).
- Spec 3E-02 co ghi cau Long Bien la diem vong qua, nen day la vi pham chu spec, nhung la vi pham bat buoc ve hinh hoc, khong phai do fixer luoi. Can user chot chi khi muon tau qua cau that (doi Q5 sang chay thang + quay dau, hoac them cau thu 2) - khong phai blocker cua phase nay.
- Ghi chu them: vong hien cach mep map 2 tile CHI o canh nam (z=17, cach 2); canh bac 4 tile, canh dong/tay 11 tile. Canh tay bi Ho Tay chan (x=-10 la nuoc), canh dong la lua chon thiet ke (vong chu nhat tron, di qua ga + Pho Co + ven Ho Tay). Do dai vong 98.29 tile, gan muc spec 100-110 (lech 1.7 tile do fillet cat goc). Tat ca diem vong qua co ten trong spec deu co that (ga, Pho Co, ven Ho Tay), tru cau Long Bien. Chap nhan duoc.

### Lech 3 - Vong vuot 1 o nuoc (-8,-10) bang cau go: CHAP NHAN DUOC

- Tu kiem chung: vong di qua DUNG 1 o nuoc, (-8,-10) = hanoi_pond_tay, trong 100 o vong. 0 o nuoc nao khac.
- Khong co duong can vong qua mui ho nay (tu kiem tra map, khong lay loi fixer): phia bac hang z=-11 la nuoc o x -10..-8; phia nam bi cay (-8,-9) + bui (-7,-9) chan; cot x=-10 toan nuoc tu z -16..-8 (tru o meadow z=-12 bi kot giua 2 hang nuoc, chi vao duoc tu phia dong); duong (-9,-9) la cuoi cut.
- Cau go co that trong code: box(3.0, 0.12, 1.7, MAT.wood) tai (-16,-20) world = dung o (-8,-10), + 2 lan can go 2 ben. Che duoc o nuoc (rong 3.0 unit che het o rong 2 unit).
- Chap nhan duoc, khong can ve lai map.

### Lech 4 - Het vong 81.6 giay, khong phai 160-180 giay: CHAP NHAN DUOC (spec sai so hoc)

- Tu tinh lai bang tich phan rieng tren duong that: 185.6 unit o 2.5 + 11.0 unit pho tau o 1.5 = 81.57 giay. Script rieng cho 81.57 s, trung so fixer 81.6 s.
- So hoc cua chinh spec: 100 tile / 1.25 tile/giay = 80 giay. Spec ghi 160-180 giay la sai gap doi (co le nhan doi nham). Fixer dung, spec sai.
- Khong can doi toc do tau. Ghi chu: toc do 2.5 van dung spec (nhanh gap 2.17 lan traveller 1.15, nhin duoc).

### Lech 5 - Nha tay pho duong tau di xuyen duoc: CHAP NHAN DUOC (nit N2)

- Xac nhan bang doc code: 3 mat nha o x=-19.7 khong co collider (xem N2). Ben dong pho la nha/stall co san trong map nen co va cham tile binh thuong.
- Muc do: nit my thuat, khong chan loi di that, khong anh huong gameplay. Trai chuan "khong vat nao di xuyen" cua user ve nguyen tac, nhung vat nay nam ngoai he va cham tile; sua can co che moi. Ghi nhan, khong blocker.

## 4. So do build/check that do verifier tu chay

| Check | Ket qua that |
|---|---|
| npm run build | PASS - dist/assets/index-Bk6Y4sqw.js 1.141.967 byte (1.141,96 kB, gzip 345,89 kB), 66 modules, build 900 ms. Trung hash + bytes cua fixer. |
| node tools/check-3e.mjs | 65 PASS, 0 FAIL (nhung khong kiem ray thep - xem B1) |
| npm run check:hanoi | ALL CHECKS PASSED - solver 95/96, 0 mismatch, 1600 o resolve |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED - 0 degenerate, 55.708 triangle |
| node tools/check-3c.mjs | 206 PASS - ALL 3C CHECKS PASSED |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL |
| node tools/check-3b.mjs | 74 PASS, 0 FAIL |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL |
| node tools/check-2b.mjs | ALL 2B CHECKS PASSED |
| node tools/check-2c.mjs | 91 PASS, 0 FAIL |
| node tools/check-2d.mjs | 144 PASS, 0 FAIL |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL |
| node tools/check-basic.mjs | ALL BASIC CHECKS PASSED |
| node --check src/game/train.js, tools/check-3e.mjs, src/main.js | PASS ca 3 |
| Script kiem tra rieng cua verifier (49+1 check) | 49 PASS, 1 FAIL (FAIL duy nhat: 2 thanh thep) |
| hanoi-tiles.glb | 3.464.792 byte, khong doi |
| Dau gach dai | 0 trong train.js, check-3e.mjs, main.js |
| @keyframes trong index.html | 0 (chi co 2 dong comment nhac toi keyframes; index.html khong bi phase 3E cham) |

- So do rieng (tu tinh, khong lay so fixer): vong 196.59 unit = 98.29 tile, 786 sample, 100 o vong; het vong 81.57 giay; doan cham pho tau 11.00 unit; day traveller dung 1.15 unit ngang; tam go 218; tau xuat phat o ga (7,17), cach spawn (0,5) khoang 37 unit.

## 5. Nhung gi KHONG the verify trong sandbox (may user la decider)

- Nhin thay tau chay that tren trinh duyet: mau do/xanh la + cua so vang co doc khong, ray 1 thanh hien tai nhin ra sao, cau go co che nuoc khong, bien "CA PHE DUONG TAU" / "GA HA NOI" co doc duoc o 390px khong, den bao hieu do/xanh co thay ro khong, nha 2 ben ray co sat nhu that khong.
- FPS that khi tau chay qua spawn (?fps=1): uoc tinh them ~20 mesh + 1 InstancedMesh la nhe, nhung so that chi co tren may user. Tieu chi 3E: FPS khong tut khi tau chay qua.
- Cam giac toc do 2.5 so voi traveller 1.15 tren man hinh that; tau co dep, co giong pho duong tau Ha Noi khong.
- Cua so truoc dau may (N1) va mat nha xuyen duoc (N2) chi la suy luan tu code, can nhin that moi chot.
- Sandbox khong co headless Chromium/Playwright (trap T8).

## 6. Ket luan: CONDITIONAL GO

- 3E-01 PASS, 3E-02 FAIL (chi o diem 2 thanh thep), 3E-03 PASS, 3E-04 PASS, 3E-05 PASS, 3E-06 PASS, 3E-07 PASS.
- 5 diem lech spec: ca 5 chap nhan duoc (lech 2 va 3 da tu chung minh bat buoc ve hinh hoc/map; lech 4 la loi so hoc cua spec; lech 1 dung ve phuong phap; lech 5 la nit).
- Dieu kien de GO: sua B1 - them 1 dong ribbon ray thep off(-0.35) trong buildTrack; chay lai node tools/check-3e.mjs (phai 65/65) + dem ray thep = 2 bang script rieng. Khuyen them: sua N1 (cua so truoc dau may) cung luc vi cung la 1 dong; sua chu "6 tile" thanh "10 tile" trong manifest muc 4.2.
- Khong can verify lai toan bo sau sua B1 (chi la them 1 ribbon tinh, khong doi logic, toc do, day, solver, GLB).
- Sau khi GO, may user check: thay tau it nhat 1 lan trong 3 phut choi; doan pho duong tau nhin sat nhu that; tau khong xuyen traveller; FPS khong tut khi tau chay qua.

## Re-verify vong sua sau verify (2026-11-21)

- Vai tro: re-verifier doc lap, KHONG sua file game. Moi so duoi day do re-verifier tu chay, khong lay lai so cua fixer.
- Co so: bao cao verify goc tren (blocker B1 + 4 nit N1-N4), manifest muc 6 "Vong sua sau verify", code src/game/train.js + tools/check-3e.mjs sau sua.
- Phuong phap: script kiem tra RIENG tools/reverify-own.mjs (viet moi, chay xong da xoa khoi repo, ban goc con o /tmp/reverify-3e.mjs); dem ray thep bang 3 cach doc lap (dong source, doi xung offset, scene graph); mo phong N2/N4 rieng bang case khac fixer; tu chay build + toan bo check hoi quy.
- Luu y ve lan chay dau: script rieng chay lan 1 ra 31 PASS, 6 FAIL, ca 6 deu la loi assertion cua chinh script (so sanh float 1.99, bien footprint tinh kieu <= thay vi <, dem chu "10 tile" khong tru muc fix log trich lai cau cu). Da sua assertion, chay lai: 37 PASS, 0 FAIL. Khong co loi that nao trong 6 FAIL do.

### 1. Bang PASS/FAIL tung loi B1/N1/N2/N3/N4

| Loi | Ket qua | Bang chung (re-verifier tu do) |
|---|---|---|
| B1 (blocker) 2 thanh thep | PASS | 3 cach dem doc lap deu = 2: (a) dong source co ca `ribbon(off(` va `MAT.steel` = 2; (b) offset doi xung +0.35 / -0.35; (c) scene graph co dung 2 mesh mau thep 0x8f9aa3. Ribbon-like mesh trong scene = 3 (2 thep + 1 balat). Check-3e moi co assertion that `steelRails === 2` doc tu source train.js, khong phai assert luon dung (da doc assertion). |
| N1 cua so truoc dau may | PASS | Scene graph: dung 1 tam mong 0.04 x 0.34 x 0.7, mau vang 0xe8b93c, tai x=2.01, nam ngoai mat truoc dau may (mat truoc o x=2.0, tam trai dai 1.99..2.03 nen tho ra 0.03). Than dau may dai 4, tam giua, mat truoc x=+2.0. Khong con box cua so 0.5 day tai x=1.72 chìm trong than. |
| N2 day khoi nha pho tau | PASS | Mo phong rieng ca 3 nha (z=-10/-8/-6, tam -19.7): traveller dat giua nha bi day ra mep dong (-18.75, giu nguyen z), goi lai tra false, vi tri on dinh sau 2 tick tiep (khong giat, khong ket). Traveller sat mep dong (-18.9) thoat ve dong (-18.75). Tat ca mep khong walkable thi traveller dung yen, khong bi ep vao o xau. Traveller ngoai footprint (-18.5) khong bi dong den. Chi train.js co `pushOutOfStreetHouses()`; grep toan repo khong thay ham nay o traveller.js/world.js/map. |
| N3 manifest "10 tile" | PASS | Manifest ghi "cach cau khoang 10 tile" o ca 2 cho thuc chat (muc 3E-02 va muc 4 item 2); lan xuat hien thu 3 la trich dan cau cu trong muc 6 fix log ("6 tile" thanh "10 tile"), khong phai cau sai. Ngoai muc 6, khong con "cach cau khoang 6 tile". Comment train.js ghi "about 10 tiles west of the bridge". 3 chu "6 tile" con lai trong manifest deu hop le (do dai doan tau 6 tile, doan pho 6 tile), khong phai khoang cach toi cau. |
| N4 phanh khi ket | PASS | Mo phong rieng: traveller dung yen tren cau (-8,-10), isWalkable=false khap noi, tau chay toi tu 6 unit sau o toc do 2.5. Sau 5 s tick (300 tick): toc do tau = 0, dung cach traveller 4.98 unit (gap nho nhat trong luc phanh cung 4.98, khong bao gio <= 0), traveller khong bi dich chuyen, khong nam trong hinh chu nhat toa nao, khong vuot toc do trong luc phanh (max 2.45). Mo lai walkable: sau 2 s tau chay lai dung 2.50. Toc do trong pho sau sua van 1.50. Khong tieng, khong game over (code cu da co, khong doi). |

### 2. Pham vi sua N2 (traveller.js / world.js / map co bi cham khong)

- Git khong co baseline cho vong sua nay: train.js, check-3e.mjs, docs/ deu untracked (chua commit), nen git diff khong chung minh duoc file nao doi trong vong sua. Bang chung thay the:
- Mtime: traveller.js 2026-11-20 21:56, hanoi-map.js 2026-11-21 08:35, main.js 09:21, deu truoc file vong sua (train.js 09:30, check-3e.mjs 09:30, manifest 09:31).
- Grep: `pushOutOfStreetHouses`, `travellerAheadBlocked`, `tryPushFromPose` chi co trong src/game/train.js (check-3e.mjs chi goi `pushOutOfStreetHouses()` trong test).
- Ket luan: trong pham vi sandbox chung minh duoc, traveller.js / world.js / map khong bi sua o vong nay; N2 nam tron trong train.js.

### 3. So do build/check that do re-verifier tu chay

| Check | Ket qua that |
|---|---|
| npm run build | PASS - dist/assets/index-CBAsYfkx.js 1,143,398 byte (1,143.39 kB, gzip 346.40 kB), 66 modules, build 1.03 s. Trung hash + bytes cua fixer. |
| node tools/check-3e.mjs | 73 PASS, 0 FAIL (gom dem ray thep = 2, test N2, test N4) |
| npm run check:hanoi | ALL CHECKS PASSED - solver 95/96, 0 mismatch, 1600 o resolve |
| node tools/step5/verify-glb.mjs | ALL GLB CHECKS PASSED - 0 degenerate, 55,708 triangle |
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
| Script kiem tra rieng cua re-verifier (37 check) | 37 PASS, 0 FAIL |
| hanoi-tiles.glb | 3,464,792 byte, khong doi |
| Dau gach dai (U+2013/U+2014, dem bang Python) | 0 trong train.js, check-3e.mjs, manifest |
| @keyframes trong index.html | 0 |

- So do rieng (tu tinh, khong lay so fixer): tau phanh dung cach traveller 4.98 unit (lookahead 5 unit, ramp phanh 3 unit/s/s, quang dung ly thuyet 2.5^2/(2*3) = 1.04 unit tu 6 unit sau); toc do chay lai 2.50 ngoai pho, 1.50 trong pho; day khoi nha ra (-18.75, z giu nguyen).

### 4. Quan sat con lai (khong chan GO, ghi de may user / vong sau biet)

- N2 day ra mep dong dat traveller o x=-18.75, chi cach tam ray (-18) 0.75 unit, nam trong vung day cua tau (nua rong toa 0.5 + 0.45 = 0.95). Nghia la khi tau dang chay trong pho, traveller vua bi day khoi nha se bi pushTraveller day tiep (ngang 1.15) hoac N4 phanh neu khong con cho. Khong giat, khong ket trong test (tau luc do o xa), nhung mep tay (-20.65) moi la cho dung that su ngoai ray. Neu muon gon, vong sau co the uu tien mep tay khi ca 2 mep deu walkable; khong bat buoc cho phase nay.
- Tam cua so truoc N1 chi tho ra 0.03 unit khoi mat truoc (1.99..2.03 so voi mat 2.0); tren trinh duyet that can nhin moi biet co du ro khong.
- N4 chi duoc kiem o truong hop cau (-8,-10) walkable=false khap noi; truong hop ket that ngoai doi (traveller dung giua 2 toa, 2 ben deu bi chan that) chua duoc mo phong rieng, nhung logic dung chung helper tryPushFromPose/pushTraveller da co tu truoc.

### 5. Nhung gi VAN chua verify duoc trong sandbox (may user la decider)

- Nhin thay that tren trinh duyet: tau 3 toa + 2 ray thep + cua so truoc vang co doc khong, pho duong tau co sat nhu that khong, bien "CA PHE DUONG TAU" / "GA HA NOI" o 390px, den bao hieu do/xanh co thay ro khong, nha tay pho co con thay xuyen qua khong.
- FPS that khi tau chay qua spawn (?fps=1); cam giac toc do 2.5 so voi traveller 1.15; cam giac phanh/dung khi traveller ket tren ray (co dot ngot khong, tau dung co xa traveller qua khong).
- Sandbox khong co headless Chromium/Playwright (trap T8).

### 6. Ket luan: GO FINAL cho Phase 3E

- B1 PASS, N1 PASS, N2 PASS, N3 PASS, N4 PASS. Khong con loi nao tu vong verify goc.
- Hoi quy day du PASS, trung het so cua fixer (build hash + bytes, 73/73 check-3e, solver 95/96, GLB khong doi).
- Dieu kien duy nhat con lai la may user check tren trinh duyet that: thay tau it nhat 1 lan trong 3 phut choi; doan pho duong tau nhin sat nhu that; tau khong xuyen traveller; FPS khong tut khi tau chay qua.
