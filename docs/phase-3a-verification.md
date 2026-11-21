# Hanoi 3D - Phase 3A verification (doc lap)

- Ngay: 2026-11-21
- Verifier: doc lap, KHONG sua file game nao
- Co so: repo local ~/workspace/hanoi-3d, spec docs/phase-3-spec.md, manifest docs/phase-3a-manifest.md
- Baseline truoc 3A: commit ca3efda5 (lay qua git fetch origin, file /tmp/map-before-3a.js)
- Script dem rieng cua verifier: /tmp/verify-3a-independent.mjs (doc lap, khong dung lai code dem cua fixer)
- Ket luan: GO CO DIEU KIEN (xem muc 9). Khong co blocker lam hong game, nhung co 1 muc FAIL ve kich thuoc (3A-16) va 2 nhom PARTIAL can chot truoc khi goi la xong han.

## 1. So do that do verifier chay tay

| Check | Ket qua verifier chay | Khop manifest fixer |
|---|---|---|
| npm run build | PASS - bundle dist/assets/index-vjz1VmjD.js 1.118.647 byte (1.118,64 kB, gzip 338,52 kB), 65 modules, 728 ms | Khop |
| npm run check:hanoi | 229 PASS, 0 FAIL - ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) | Khop |
| node tools/step5/verify-glb.mjs | 312 PASS, 0 FAIL - ALL GLB CHECKS PASSED | Khop |
| node tools/check-3a.mjs | 130 PASS, 0 FAIL - ALL 3A CHECKS PASSED | Khop |
| node tools/check-2b.mjs | 406 PASS, 0 FAIL | Khop |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL | Khop |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL | Khop |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL | Khop |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL | Khop |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL | Khop |
| node --check (9 file da sua) | PASS het: hanoi-models, hanoi-map, loader, build-hanoi-glb, verify-glb, check-solver-options, check-2b, check-3d, check-3a | Khop |

- GLB doc lap: public/models/hanoi-tiles.glb 3.209.100 byte, 41 root node, 326 node, 285 mesh, 57.332 tris (tinh lai tu index/position accessor, khong dung lai so cua verify-glb). 16 model moi deu co mat trong GLB.
- Registry doc lap: 41 model Hanoi-only (25 cu + 16 moi, dem truc tiep trong src/world/hanoi-models.js). Solver OPTIONS 95/96, src/core/models.js co 0 chu "hanoi" (khong them model WFC).

## 2. Bang PASS/FAIL tung muc 3A-01..3A-17

### 3A-01 - Nha ong vang 3 tang: PASS

- 8 o vang: tubehouse (-3,-8), (-6,-7), (0,-6), (-3,-5), (-6,-4) + tubehouse_b (-3,-9), (-6,-8), (-2,-6). Dem tu map that.
- Recipe loader.js khoang 337-360: tubehouse 9 flap, mai tri terracotta 0,9 x 1,35, than mustard 0,6 x 1,12, cua chop tealDeep 0,14 x 0,28, dormer bien 0,45 x 0,6, ong khoi brown. tubehouse_b 8 flap, mai 0,88 x 1,3.
- Hero card build-hanoi-glb.mjs:640: tubehouse 0,81 x 1,35 dung sprite tubehouse (co san). Ghi chu: ban cong sat den chi co trong sprite, khong co flap rieng - chap nhan duoc vi sprite da ve san, fixer co ghi trong comment loader.js:339.

### 3A-02 - Nha ong xanh la 2 tang, ti le 1:2: PASS

- 4 o xanh (-3,-7), (-5,-6), (-6,-5), (-3,-4). Ti le 4 xanh : 8 vang = 1:2 dung spec.
- Recipe 7 flap, than sage 0,52 x 0,9, mai terracotta 0,62 x 1,05. O (-3,-4) doi tu vang (v) thanh xanh (o) la o doi duy nhat de dat ti le.

### 3A-03 - Nha goc Ta Hien (-6,-6): PARTIAL (hinh hoc dung, chu bien thieu)

- Vi tri dung (-6,-6), thay hanoi_road cu (xac nhan tu git diff ca3efda5). Recipe 8 flap, cao 1,40, 3 bien lamp chong nhau mustard / teal / paper.
- Tru 2 diem:
  - (a) "Cao nhat khu pho" chi la DONG HANG, khong duy nhat: tan cay sao den (hanoi_tree) cung cao 1,40.
  - (b) Chu 3 bien ("Tiger BIA PHO CO", "Tiger CRYSTAL", "Hanoi BOLD & Light") KHONG duoc ve o dau ca, chi co trong comment loader.js:527-528. Bien chi la flap mau phang. Xem muc 7, loi F2.

### 3A-04 - Bo 4 bien bia: PARTIAL (mau + vi tri dung, chu bien thieu)

- 4 o dung vi tri: phoco (-4,-5) mustard, biahoi (-8,-7) terracotta, trucbach (2,-7) paper, paramount (-5,-3) rose. Moi model 4 flap, dung 4 bien, khong co bien thu 5 trong map (dem sign cells = 4).
- Kich thuoc bien DUNG spec nho hinh hoc kind 'lamp': dau bien (head box) 0,6 rong x 0,17 cao (phan tren 18% cua flap 0,95), khop spec "bien ngang 0,6 x 0,18"; bien doc rect 0,18 x 0,6 dung spec.
- Tru 1 diem: chu "BIA PHO CO" / "BIA HOI HA NOI" / "Truc Bach" / "PARAMOUNT BEER" KHONG duoc ve o dau ca. Khong co co che ve chu len flap trong engine (fillText chi co trong src/game/atlasmap.js:443-447 de ve chu len ban do giay UI, khong phai flap 3D). Atlas van 200 sprite, khong them sprite moi. Bien chi doc duoc bang MAU, khong doc duoc bang chu. Tieu chi 3A muc 4 ghi "nhin thay... bien Tiger" - voi ban build nay user se thay tam bien vang/xanh/trang chu khong doc duoc chu Tiger. Xem muc 7, loi F2.

### 3A-05 - Cot dien + day dien: PASS

- 4 o: pole cu (-8,-8), (2,-8) + pole moi (0,-3) + pole_street moi (-6,-9, thay nha ong). Dem tu map that.
- Recipe 6 flap moi loai, cot lamp ink 0,55 x 1,3, may bien ap paperShade, 3 day 'sag', vong day arch.
- Day vong thap nhat 0,75: kiem chung bang toan, khong tin mu. shapeFor 'sag' (loader.js:172-180) ve Bezier bac 2 voi diem dieu khien o h - 1,0 nen diem giua vong xuong dung h - 0,5. Day h = 1,25 cho 1,25 - 0,5 = 0,75 dung spec.
- Ghi chu: day chi keo trong 1 tile (span 1,9), khong noi that giua 2 cot o 2 cell khac nhau. Day la gioi han cua he tile, hinh anh tuong duong.

### 3A-06 - Cay sao den co thu: PASS

- 8 o: cu (-8,-9), (-4,-9), (1,-9) + moi (4,-8), (2,-4), (2,-3), (2,1), (2,2). Dem tu map that.
- Recipe 5 flap: than brown 0,25 x 1,0, tan pine 1,2 x 1,4, tan phu moss 0,8 x 1,15, ghe da paperShade 0,5 x 0,15. Cao 1,40 trong khoang spec 1,35-1,45.

### 3A-07 - Cay sau + la vang roi: PASS

- 4 o dung vi tri spec (-3,1), (3,1), (-4,2), (-3,2). Recipe 5 flap, tan mustard 1,0 x 1,2, than 0,22 x 0,95.
- La roi tren dat la CODE THAT, khong phai comment: baseTexture loader.js:88-97 ve 22 cham mustard (seeded) tren base cua hanoi_sautree. (Check-3a chi kiem bang includes('Phase 3A-07') - check yeu, xem muc 4.)

### 3A-08 - Den duong cau trang cot xanh: PASS

- 7 o: cu (-4,-7), (-5,-5), (1,-5) + 4 moi ven ho MOI (3,2), (2,3), (2,4), (2,5) - dat theo mep ho moi 3B (x = 2), dung nhu manifest noi.
- Recipe 5 flap: cot tealDeep 0,1 x 1,1, 2 glowtop paper 0,18 tai x +-0,13 (tam cach nhau 0,26, spec ghi 0,25 - lech 0,01, khong dang ke), de tealDeep 0,3 x 0,12.

### 3A-09 - Co do + bang ron do: PARTIAL (hinh hoc dung, chu "30-4" thieu)

- 6 co: (-7,-7), (3,-7), (-7,-5), (3,-5), (4,2), (4,3). 3 bang ron: (3,-9), (4,-9), (3,-8). Spec khong chot toa do tuong o, vi tri phu hop mo ta (doc z = -6, dai lo dong, ven Ho Guom).
- Kind 'star' moi (loader.js:160-171) ve sao 5 canh dung cong thuc: R = w/2, canh trong 0,382 R, tam y = h - R. Co terracotta 0,3 x 1,1 + sao mustard 0,14. Bang ron rect terracotta 0,25 x 0,7 + dormer mustard.
- Tru 1 diem: chu "30-4" tren bang ron KHONG duoc ve (chi co huy hieu dormer vang). Cung goc loi F2.

### 3A-10 - Via he da granite + kerb: PASS

- 6 o: cu (-5,-7), (-2,-7), (0,-7), (-2,-5) + moi (4,-4), (4,-3). Kerb flap 0,08 (truoc 0,12) dung spec.
- Print la CODE THAT: baseTexture loader.js:69-87 ve 4x4 o da (paperShade / #e3cda3 xen ke), mach ink, kerb terracotta 2 mep. Cung print cho co, bang ron, 3 xe may. (Check-3a chi kiem comment - xem muc 4.)

### 3A-11 - Ganh hang rong: PASS

- 3 ganh: cu (-8,-5) + moi (-8,-4, thay cay cu) + vendor_street (2,-6, thay nha ong xanh). Recipe 4 flap: nguoi paper 0,3 x 0,9, 2 ganh arch ochre 0,5 x 0,32, ghe nhua teal 0,15 x 0,12.

### 3A-12 - Quan pho via he: PARTIAL (hinh hoc dung, chu "PHO" thieu)

- 2 quan: cu (2,-5) + moi phostall_street (-8,-6). Recipe 10 flap: mai terracotta 0,9 x 1,0, ban thap paperShade 0,5 x 0,3, 4 ghe nhua 0,12 x 0,15 (teal / rose / mustard / teal), noi arch ink, hoi paper. Tat ca khop spec.
- Tru 1 diem: bien mustard 0,34 x 0,18 KHONG co chu "PHO" (chi la tam mau vang). Cung goc loi F2.

### 3A-13 - Xe may dau yen: PASS

- 6 xe, tron 2 do + 2 xanh + 2 den: do (4,-5), (-8,-3); xanh (5,-5), (-7,-3); den (5,-4), (-4,-3). Moi model 4 flap, than 0,45 x 0,28, 2 banh arch 0,16, tay lai 0,06 x 0,35.
- KHONG co logic xe chay: grep 'hanoi_bike' trong src/ chi ra map + models + recipes, khong co file game nao nhac toi xe chay. Q7 duoc ton trong (chi xe dau, xe chay de 3E).

### 3A-14 - Bien mot chieu + tuong tranh: PASS (nit nho)

- Bien mot chieu gap vao hanoi_trafficlight (5 flap, truoc 3): bien teal lamp 0,25 x 0,8 + dau trang dormer paper 0,12 tai (-6,-3) canh den do. Nit: dau bien thuc te chi cao khoang 0,14 (head box cua kind lamp) thay vi 0,25 x 0,25 nhu spec, va "mui ten" chi la vet dormer trang chu khong phai hinh mui ten.
- Tuong tranh 2 o dung vi tri (-10,1), (-10,2), 5 flap, tuong paperShade 1,9 x 0,8 chay N-S (ry 90), panel rose + teal, nhan vat mustard.

### 3A-15 - Audit + xoa thu nong thon: PARTIAL (map sach that, dong vat van con)

- Map sach: quet doc lap 1600 o (ca map truoc 3A tu ca3efda5 va map hien tai) cho 8 id barn_farm, windmill, village, village_b, village_green, house, bridge, blossom_gazebo: TRUOC 0, SAU 0, tat ca. Xem muc 3.
- Lang Bac: recipe 10 flap, KHONG con mau brown/kraft (toan paperShade/paper/ink), 2 bac cap 1,15 x 0,28 va 1,30 x 0,14 dung manifest.
- Tru 1 diem lon: DONG VAT nong thon van spawn o Hanoi. src/core/config/animals.js:192-195 (spawns.hanoi) cho meadow: sheep 0,6 (2-4 con), lamb 0,1, cow 0,09; meadow_flowers: sheep 0,15; hills: sheep 0,22. Map co 731 o meadow + 57 meadow_flowers + 74 hills nen cuu/bo se xuat hien trong thanh pho khi choi. Dieu nay trai voi tieu chi 3A muc 4 ("Khong con thu gi trong giong nong thon trong khung hinh"). Fixer co ghi nhan la follow-up trong manifest muc 9, nhung pham vi audit cua spec la "toan bo 1600 o" - dong vat khong phai o map, nhung van la thu user nhin thay. Xem muc 7, loi F3.

### 3A-16 - Ngo hep tay: FAIL (chieu rong chi bang mot nua spec)

- 4 o dung vi tri (-12,-2), (-12,-1), (-12,1), (-12,2). Recipe 7 flap, co do + sao, day sag thap, base print lan dung code that (loader.js:97-105).
- FAIL ve kich thuoc: spec yeu cau "rong 0,5 tile... chieu rong long ngo 1 unit". TILE_SIZE = 2 (src/core/config/shared.js:4), toa do recipe tinh bang world unit, tile rong 2 unit (x tu -1 den 1). Nha 2 ben: rect 0,7 rong tai x +-0,6 nen mep trong o +-0,25. Khoang giua = 0,5 world unit = 0,25 tile, CHI BANG MOT NUA spec (1 unit = 0,5 tile). Print lan cung rong 0,5 unit (fillRect 0,375N rong 0,25N). Mai vo ra thi khoang o cao mai chi con 0,4 unit.
- Check-3a ghi sai don vi: no assert gap === 0,5 va goi la "0.5 tile" trong thong bao, trong khi 0,5 world unit = 0,25 tile. Check nay se PASS mai du ngo hep gap doi spec. Xem muc 4.
- Ghi chu: o z = 0 trong cot x = -12 la nga tu path ('a') nen ngo bi cat lam 2 doan 2 o - chap nhan duoc, spec chi neu vung chu khong bat buoc 5 o lien nhau.
- Huong sua: muon long 1 unit thi nha phai hep lai (vd rect 0,5 rong tai x +-0,75, mep trong +-0,5) chu khong the chi dich nha ra ngoai vi se tran tile.

### 3A-17 - Mat duong lat gach + vach ke: PARTIAL (dung tren 1 o, duong stock van kraft)

- hanoi_road (-3,-6): print la CODE THAT (loader.js:48-66): nen paperShade, mach gach ink, vach trang dut doan giua duong, giu zebra 2 dau. Builder mirror co 'Phase 3A-17'.
- Nhung spec ghi "tat ca o road": mang duong that cua map la tile path stock (100 path_straight + path_t/corner/cross/end, tong hon 130 o) van in kraft vi base cua chung nam trong tiles.glb chung voi che do WFC. Chi 1/137 o duong co print gach. Fixer co ghi nhan la follow-up trong manifest muc 9. Neu doc "o road" la "o hanoi_road" thi PASS; neu doc la "toan bo duong" thi FAIL. Verifier ghi PARTIAL: dung tren pham vi hep nhat cua spec, hieu ung nhin thay rat nho khi di bo.

## 3. Dem doc lap (khong dung lai so cua fixer)

### (a) 29/47 o doi nam ngoai rect pho co: XAC NHAN DUNG

- So sanh tung cell giua HANOI_ROWS ca3efda5 va HANOI_ROWS hien tai (script rieng /tmp/verify-3a-independent.mjs): tong 47 o doi, 29 o ngoai rect x -8..2, z -9..-3, 18 o trong rect. Khop chinh xac manifest.
- Danh sach 29 o ngoai rect: (3,-9), (4,-9), (3,-8), (4,-8), (3,-7), (3,-5), (4,-5), (5,-5), (5,-4), (4,-4), (4,-3), (-12,-2), (-12,-1), (-12,1), (-10,1), (-3,1), (2,1), (3,1), (-12,2), (-10,2), (-4,2), (-3,2), (2,2), (3,2), (4,2), (2,3), (4,3), (2,4), (2,5).
- 18 o trong rect: (-6,-9), (-8,-7), (-7,-7), (2,-7), (-8,-6), (-6,-6), (2,-6), (-7,-5), (-4,-5), (-8,-4), (-3,-4), (2,-4), (-8,-3), (-7,-3), (-5,-3), (-4,-3), (0,-3), (2,-3).
- Pho Co sau 3A: 55 o Hanoi-model / 77 o (dem doc lap). TRUOC 3A: 45 o (30 o duong pho 2B + 15 o nha). Manifest ghi "truoc 3A: 30 + 19" la SAI SO: 19 la so nha o buoc Step 3 goc, khong phai truoc 3A. Dem truoc 3A that: tubehouse 7 + tubehouse_b 4 + tubehouse_green 4 = 15 nha; duong pho 2B = 30. Tong 45, khop 45 -> 55. Chi la loi so hoc trong manifest, code khong sai.

### (b) Audit 3A-15: XAC NHAN DUNG (ca truoc va sau)

- Quet doc lap ca 1600 o tren map ca3efda5 va map hien tai, 8 id nong thon: barn_farm 0 -> 0, windmill 0 -> 0, village 0 -> 0, village_b 0 -> 0, village_green 0 -> 0, house 0 -> 0, bridge 0 -> 0, blossom_gazebo 0 -> 0. Tong 1600 o ca 2 ban.
- Luu y: check-3a.mjs KHONG do truoc ma ghi cung BEFORE = 0 (xem muc 4). Verifier do lai thi so truoc dung la 0, nen bang audit cua fixer dung ve du lieu, yeu ve phuong phap.
- Ngoai le nam ngoai pham vi o map: dong vat cuu/bo van spawn (xem 3A-15 o muc 2).

### (c) Reachability 1001 o tu spawn: XAC NHAN DUNG

- BFS 4 huong rieng cua verifier tu (0,0): 1001 o walkable lien thong (baseline 998, tang 3). Spawn (0,0) la path_straight, walkable.
- Ghi chu: 9/10 anchor landmark cho reachable=false trong BFS cua verifier vi anchor la chinh o landmark (tag blocker) - do la hanh vi dung tu truoc, discovery dung ban kinh 1 o ke ben chu khong dung len anchor. Chi anchor oldquarter (-6,-6) reachable=true vi cornerhouse co tag path (walkable). Khong phai loi.

### (d) Vung 3B tuong lai (rect x -2..1, z -7..4): XAC NHAN DUNG

- 10 o Hanoi-model trong vung, chi 1 o MOI cua 3A: cot dien (0,-3) (meadow -> hanoi_pole). 9 o con lai da co tu truoc, gom ca 6 o recipe 3A nang cap ma manifest liet ke: (-2,-6) tubehouse_b, (0,-6) tubehouse, (1,-5) lamp, (-2,-7), (0,-7), (-2,-5) sidewalk. Khop manifest.

## 4. Danh gia check-3a.mjs (130 check)

- Da so check la THAT: vi tri cell, so flap, mau, chieu cao, mirror loader/builder, GLB magic/root/node, BFS reachability, dem o Pho Co. 130/130 PASS khi verifier chay lai.
- 4 loi yeu cua script (check yeu, khong phai game sai):
  - W1. Check bang chuoi comment: includes('Phase 3A-07'), includes('Phase 3A-10'), includes('Phase 3A-17') (loader + builder, tong 4 check). Chi can comment ton tai la PASS du xoa het code ve. Verifier da doc code that ben duoi comment va xac nhan print co that (muc 2), nen tinh nang dung, chi check yeu. Can doi thanh kiem tra hanh vi (vd goi baseTexture va dem pixel, hoac kiem tra doan code ve chu khong phai comment).
  - W2. Audit 3A-15 ghi cung BEFORE = 0, khong do. Neu map truoc 3A co o nong thon thi script khong phat hien. Verifier do lai thi truoc dung la 0, nen khong co hau qua lan nay.
  - W3. Check 3A-16 sai don vi (nghiem trong nhat): assert gap === 0,5 va bao la "0.5 tile", trong khi 0,5 world unit = 0,25 tile, spec yeu cau 1 unit. Check nay ma hoa sai gia tri dung va che di loi FAIL cua 3A-16. Phai sua thanh gap === 1,0 (world unit) kem don vi ro rang.
  - W4. Check flap cao nhat tinh tu LOADER recipes, khong phai tu GLB; mirror loader/builder chi so sanh SO LUONG flap, khong so chieu cao. Verifier bu bang parser rieng: 41/41 recipe khop ca so flap lan maxH, flap cao nhat 1,40. Neu builder lech chieu cao thi check-3a khong bat duoc.
  - W5 (nhe). Check 3A-04 "khong co thuong hieu khac" chi dem sign cells = 4, khong quet text thuong hieu (hien khong co text nao o dau nen vo hai).
- Ve "4 loi FAIL dau tien la bug cua script check": khong the kiem chung tu repo vi check-3a.mjs la file untracked, khong co lich su git. Verifier chi danh gia script o trang thai hien tai: 130/130 PASS, voi 4 diem yeu W1-W4 o tren. Khong co bang chung game da bi sua de doi pho check.

## 5. Danh gia viec sua check-3d.mjs + phase-3d-manifest.md

- So moi KIEM CHUNG DUNG bang tinh lai doc lap tu kich thuoc file tren o dia:
  - O stock 1504 / Hanoi-only 96: dem doc lap tu map (tong cac cell hanoi_* = 96, 1600 - 96 = 1504). Khop.
  - Tong first-load truoc 21,38 MB / sau 16,76 MB / deferred 4,63 MB: tinh lai tu disk (tiles.glb 6.147.140 + hanoi-tiles.glb 3.209.100 + traveller 85.024 + textures 7.033.841 + manifest.json + assets_meta.json + atlas.json 169.008 + animals.png 4.619.400 + animals.json 6.822) = 21,38 / 16,76 / 4,63 MB chinh xac. Khop.
  - GLB tang 712.548 byte so voi 2.496.552 cu. Khop.
- Ket luan GO cua 3D KHONG bi sai lech: addendum ghi ro so moi, KHONG sua so 3D goc; ly do rollback 3D-02 van dung (1504/1600 = 94% map van can tiles.glb). Phan tang 0,71 MB truoc frame dau la he qua trung thuc cua GLB lon hon, khong phai loi 3D.
- Nit ve tai lieu: check-3d.mjs dong 7 (header comment) van ghi "1543 of 1600 cells", va than bai phase-3d-manifest.md muc "Diem con thieu" van ghi "1543 o giu art GLB". So moi chi co trong addendum cuoi file. Nguoi doc chi doc than bai se thay so cu. Nen sua header comment + them chu thich tai cho so cu, hoac doi so cu thanh so moi kem ghi chu.
- Check-3d tu no (115 check) van la check that: phan (j) tinh MB tu file that tren dia roi moi assert chuoi, phan (c) dem cell that tu map. Khong phai check cung.

## 6. Trap T1-T10

- T1 solver: OPTIONS 95/96, 0 model WFC moi, 0 mismatch, 1600 o resolve. PASS.
- T2 GLB: hanoi-tiles.glb 3.209.100 byte < 3,5 MB. PASS. tiles.glb goc khong bi sua (6.147.140 byte, theo manifest 3D).
- T3 lazy-load: khong doi logic load, check-3d (c) PASS. PASS.
- T4-T7: khong thuoc pham vi 3A, khong co dau hieu vi pham.
- T8: dung - khong co headless browser trong sandbox, khong chup man hinh local. Cac muc nhin that de muc 8.
- T9: Impeccable detect / Hallmark sloplint khong chay (loi tool da biet). Ghi nhan, khong phai verdict.
- T10 dau gach: quet bang node cho 11 file 3A da doi + index.html + hanoi.js + landmarks.js: 0 ky tu gach dai (U+2013/U+2014). PASS. (Luu y: lenh grep shell cua verifier lan dau bi loi escape nen dem sai - da quet lai bang node, ket qua 0 la dung.)
- File la: khong co file moi nao do 3A tao ra ngoai danh sach 12 file cua manifest. tools/step5/raw/ (2026-11-20 21:36), tools/step5/__pycache__/ (2026-11-21 02:22), data/provenance.json (2026-11-21 03:19) deu co truoc gio lam 3A (07:16). Khong co sprites/ moi hay file la trong vung 3A.

## 7. Danh sach loi

- F1 - BLOCKER NHE (3A-16): long ngo chi rong 0,5 unit thay vi 1 unit theo spec (bang mot nua). Check-3a ma hoa sai don vi (W3) nen khong bat duoc. Huong sua: thu hep nha 2 ben (vd rect 0,5 rong tai x +-0,75) de long dat 1 unit ma khong tran tile; dong thoi sua check-3a thanh gap === 1,0 world unit.
- F2 - PARTIAL LON (3A-03, 3A-04, 3A-09, 3A-12): chu tren bien/bang ron khong duoc ve: "Tiger BIA PHO CO", "Tiger CRYSTAL", "Hanoi BOLD & Light", 4 ten bia, "30-4", "PHO". Bien chi la flap mau phang. Can quyet dinh: (a) them sprite chu nho vao atlas (can ve them, tang atlas), hoac (b) sua spec thanh "bien mau phang, nhan dien bang mau" va chap nhan tieu chi "bien Tiger" chi dat o muc mau sac. O ti le diorama, chu 0,6 unit tren dien thoai 390px gan nhu khong doc duoc du co ve, nen phuong an (b) co ly, nhung phai do user chot, khong tu y.
- F3 - PARTIAL (3A-15): cuu/cuu non/bo van spawn o Hanoi qua spawns.hanoi (meadow 0,6 sheep, 0,1 lamb, 0,09 cow). Can quyet dinh: xoa 3 dong nay khoi spawns.hanoi o phase sau, hoac ghi ro spec la audit chi tinh o map.
- N1 - Nit: manifest 3A muc 1 ghi sai so truoc 3A ("30 + 19" - dung la 30 + 15 = 45). Sua so trong manifest.
- N2 - Nit: check-solver-options.mjs comment giai thich 19 - 4 - 3 = 12 ghi sai ten o bi thay o 3A ("corner house + pho + vendor tren z = -6" - thuc te 3 o mat khoi ho nha ong la (-6,-9) pole_street, (-8,-6) phostall_street, (2,-6) vendor_street; corner house thay o road). Tong 12 van dung.
- N3 - Nit: 3A-03 "cao nhat khu pho" dong hang 1,40 voi cay sao den. Neu muon duy nhat thi ha tan cay xuong 1,35 hoac nang nha goc len 1,45 (vuot gioi han hien tai, can can nhac flap <= 1,5 van du).
- N4 - Nit: 3A-08 khoang cach 2 qua cau 0,26 thay vi 0,25; 3A-14 dau mui ten chi la vet dormer trang, bien chi cao khoang 0,14 thay vi 0,25. Khong dang ke.
- N5 - Nit: so cu 1543 con sot trong header comment check-3d.mjs va than bai phase-3d-manifest.md (xem muc 5).
- N6 - Nit: 3A-17 chi 1 o duong co print gach, duong stock van kraft (da ghi PARTIAL o muc 2).

## 8. Nhung gi KHONG the verify trong sandbox (may user la decider)

- Mau sac that tren trinh duyet: co do terracotta co du do tuoi khong, bien vang/xanh/hong co doc duoc tren nen giay khong, day dien den co nhin ra "mang nhen" khong, la vang co du ro khong.
- Do doc o 390px: bien 0,6 unit, co 0,3 unit, xe may 0,45 unit co nhin ra hinh khong, hay chi la vet mau.
- Do rong that cua ngo khi di bo: long 0,5 unit (F1) co cam giac hep nhu ngo Ha Noi that khong, hay bi ket goc nhin.
- Nha goc Ta Hien co bi cay sao den 1,40 che khuat o mot so goc camera khong (risc spec da neu).
- Cam giac tong the: di 1 vong Pho Co co "nhin la biet Ha Noi" khong (tieu chi muc 4), can mo tab an danh ?map=hanoi&v=3, doi load 100%, chup man hinh.
- Khong co headless browser trong sandbox nen khong chup man hinh, khong do FPS that, khong do thoi gian load that.

## 9. Ket luan: GO CO DIEU KIEN

- GO cho viec dua Phase 3A len may user de check bang mat: toan bo nen tang dung (build, solver 95/96, 0 mismatch, GLB 41 node 57.332 tris 0 degenerate, reachability 1001, audit map sach, so lieu check-3d dung that). Khong co loi nao lam hong game hoac pha vo gate.
- DIEU KIEN truoc khi goi 3A la xong han:
  1. Sua F1 (3A-16): long ngo len 1 unit, va sua check-3a W3 (gap === 1,0 world unit, ghi dung don vi).
  2. Chot F2 voi user: them chu bien hay sua spec thanh bien mau phang.
  3. Chot F3: xoa cuu/bo khoi spawns.hanoi hoac ghi ro pham vi audit.
  4. Cung check-3a: thay 4 check chuoi comment (W1) bang check hanh vi, do BEFORE that cho audit (W2), them so sanh chieu cao builder (W4).
  5. Sua 5 nit N1-N5 trong manifest va comment.
- Neu ap dung luat cung "moi kich thuoc trong spec phai khop" thi F1 mot minh da du de NO-GO - coordinator co the nang len NO-GO neu muon fix F1 truoc khi user check. Verifier de GO co dieu kien vi F1 khong anh huong gate nao khac va user check van la buoc bat buoc tiep theo.
- Khong push, khong commit theo nhiem vu. GLB moi chi o local.

## Verify lai vong sua 3A - 2026-11-21

- Verifier: doc lap, KHONG sua file game nao (chi doc, chay test, viet bao cao nay)
- Co so: bao cao verify goc o tren (F1/F2/F3 + nits N1-N5, W1-W4), manifest muc 10 vong sua, spec muc 2.1 (1 tile = 2 unit)
- Script dem rieng cua verifier vong nay: /tmp/verify-fixround.mjs (viet moi, khong dung lai code cua fixer, khong import check-3a hay verify-glb); crop sprite: /tmp/sign-crops/ (PIL, tu atlas.webp that)
- Ket luan: GO CUOI CUNG cho Phase 3A. Ca 3 loi F1/F2/F3 da sua dung, co bang chung doc lap. Chi con nit tai lieu + nit code cosmetic (N5b, N7, N3, N4) va 3 diem yeu cua script check (W1/W2/W4) - khong chan GO.

### 1. Bang PASS/FAIL vong sua

| Loi | Ket qua | Bang chung tom tat |
|---|---|---|
| F1 (3A-16 long ngo) | PASS | Long dung 1 world unit (rect + mai), ca loader lan builder; print lan 1 unit ca 2 file; mau dinh GLB chung minh lan kraft dung \|x\| < 0,5; reachability 1001 |
| F2 (chu tren bien) | PASS | Nhin that 6 sprite: ca 6 chu doc duoc; 0 chong lan tren 206 sprite; hero wiring 8 model khop hinh hoc flap goc; uv1 GLB trung rect tung sprite den 0,1 px |
| F3 (cuu/bo spawn Hanoi) | PASS | spawns.hanoi khong con sheep/lamb/cow o ca 4 biome; heartland van co cuu; check-3a doc truc tiep object animals |
| N1 manifest "30+19" | PASS | Manifest muc 1 nay ghi "30 + 15 = 45" |
| N2 comment check-solver-options | PASS | Comment ghi dung 3 o: (-6,-9) pole_street, (-8,-6) phostall_street, (2,-6) vendor_street; nha goc (-6,-6) thay o road |
| N5 so 1543 | PASS MOT PHAN | Header check-3d.mjs + muc "Diem con thieu" phase-3d-manifest.md da thanh 1504; con sot 1543 o JSDoc loader.js:902 (xem N5b) va cac cho lich su hop le |
| 3A-17 gioi han duong gach | XAC NHAN | Dem that 1/137 o duong co print gach; ly do stock kraft dung (path_* nuong trong tiles.glb chung, khong sua) |

### 2. F1 - long ngo (do lai doc lap)

- Recipe loader.js:628-636 + builder build-hanoi-glb.mjs:607-615: nha 2 ben rect 0,5 rong tai x +-0,75 (mep trong +-0,5), mai tri cung 0,5 tai x +-0,75 (phang voi tuong, khong vo ra). Script rieng tinh gap rect = 1, gap tri = 1 (world unit, tile = 2). Nha nam gon trong tile [-1, 1], khong tran.
- Check-3a moi (dong 340-354): laneGap tinh tu recipe (min mep trong dong - max mep trong tay), assert gap === 1, ghi ro "1 world unit (0.5 tile)". Khong vacuous: voi so cu (nha 0,7 tai +-0,6) ham nay tra 0,5 va check se FAIL. Them assert mai tri gap 1, mirror builder gap 1, print lan 1 unit o ca 2 file (loader fillRect(0.25*N, 0, 0.5*N, N); builder |x| < 0.5).
- Bang chung tu GLB that (khong qua comment): parse truc tiep hanoi_alley__base, mau dinh: 119 dinh mau kraft (tan) deu nam trong |x| < 0,5, 0 dinh ngoai; 170 dinh xanh co deu ngoai lan, 0 dinh trong lan. Lan kraft 1 unit co that trong GLB.
- Reachability tu dem lai (BFS 4 huong rieng, walkable = khong blocker + khong water): 1001 o tu spawn (0,0); 4 o ngo (-12,-2), (-12,-1), (-12,1), (-12,2) deu di toi duoc.
- Quan sat O1 (khong phai loi): bien co lamp tai x=-0,62, rong 0,3 nen mep trong o -0,47, tho 0,03 vao long ngo tai mat z=0. Chi anh huong hinh anh (va cham tinh theo tag cua o, khong tinh theo flap), long di bo o mat dat van 1 unit.

### 3. F2 - chu tren bien (kiem manh bang mat)

- Crop 6 sprite tu public/textures/art/atlas.webp theo rect trong atlas.json, phong 3x, doc bang mat - ca 6 deu DOC DUOC:
  - sign_biaphoco: "BIA PHO CO" chu muc tren nen vang (mustard), 1 dong.
  - sign_biahoi: "BIA HOI" / "HA NOI" chu giay tren nen cam (terracotta), 2 dong.
  - sign_trucbach: "Truc Bach" chu muc tren nen trang (paper), serif bold.
  - sign_paramount: "PARAMOUNT" / "BEER" chu kem tren nen hong (rose), 2 dong.
  - sign_banner304: sao vang + "30-4" chu vang doc doc tren nen do, doc duoc.
  - sign_pho: "PHO" chu do (rust) tren nen vang.
- Do bang pixel (doc lap, khong tin loi fixer): 4 sprite bien lamp chi co pixel duc o 17,9% tren cua rect (dung dau bien lamp 18%); banner + PHO duc toan rect. Rect khop chinh xac manifest va atlas.json.
- Chong lan: quet cap doi toan bo 206 sprite trong atlas.json - 0 cap chong lan, 0 rect vuot khoi atlas 4096x4096. Tong 206 sprite (200 + 6).
- Wiring HERO trong build-hanoi-glb.mjs:678-695: 8 model (cornerhouse tai dung sprite BIA PHO CO; 4 bien bia; banner; 2 quan pho chung sprite PHO). Tung flap hero copy chinh xac flap bien trong loader recipe (cung kind/w/h/x/z/mau) - verifier so tung truong: cornerhouse lamp 0,6x1,05 tai (0,-0,16); 4 bien lamp 0,6x0,95 tai (0,-0,08); banner rect 0,25x0,7 tai (0,12,-0,06); pho rect 0,34x0,18 tai (0,2,-0,05).
- Parse GLB doc lap (khong dung verify-glb): ca 8 node __art deu co; uv1 (TEXCOORD_1) cua dinh mat truoc cho bbox px trung rect sprite den 0,1 px (vd cornerhouse [2104,0, 2990,0, 173,0, 274,0]); vi tri node qua matrix: cornerhouse z=-0,16, 4 bien z=-0,08, banner x=0,12/z=-0,06, pho x=0,2/z=-0,05 - deu khop recipe.
- Co che hien thi da kiem chung bang code: paper shader (src/render/materials.js:491-503) lay mau tu atlas theo uv1, va discard dinh co alpha < ~0,4 (gPaperCov < 0,5, nguong uPaperArt.w=0,4) - vung trong suot cua sprite that su lo ra flap bien phang phia sau. Pixel trong suot trong atlas mang mau kem do bleed chong vien mip, nhung bi discard nen khong hien. Day la co che hero card co san tu Phase 2, khong phai co che moi.
- Gioi han con lai (may user la decider): chu tren bien 0,6 unit co doc duoc tren man hinh 390px that khong, va cam giac tong the khi lai gan - sandbox khong co trinh duyet that nen khong do duoc. Sprite goc 288 px/unit, chu "BIA PHO CO" ~17 px/ky tu o atlas, la co so tot de doc khi lai gan.

### 4. F3 - dong vat nong thon (doc truc tiep object)

- src/core/config/animals.js: spawns.hanoi hien chi co meadow cat/rabbit, meadow_flowers rabbit/songbird, hills rabbit, rocks rabbit/fox. Khong con sheep/lamb/cow o bat ky biome nao cua hanoi.
- spawns.heartland khong doi: meadow van sheep 0,6 (2-4 con), lamb 0,1, cow 0,09; meadow_flowers sheep 0,15; hills sheep 0,22. spawns.all van co vit o pond.
- Check-3a moi (dong 317-332): import truc tiep animals, quet toan bo spawns.hanoi tim 3 loai farm, assert meadow van co cat + rabbit, meadow_flowers van co songbird, pond van co duck, heartland meadow van co sheep. Day la check that doc object, khong phai check chuoi.

### 5. Nits va so 1543 con sot

- N1, N2: PASS (xem bang muc 1).
- N5: header check-3d.mjs dong 7 nay ghi "1504 of 1600 cells" - da sua. Muc "Diem con thieu" phase-3d-manifest.md (dong 321+) nay ghi "1504 o giu art GLB" - da sua.
- So 1543 con lai (grep toan repo, tru dist/ va node_modules):
  - Lich su hop le, giu nguyen: phase-3d-manifest.md dong 39/44/45/60 (muc 3D-02 goc, so thoi Phase 3D) va dong 226 (muc 3D-03, so thoi Phase 3D); addendum dong 345 ("1543 thanh 1504"); phase-3d-verification.md (bao cao verify 3D goc); phase-3-spec.md:129 (da ghi chu SUPERSEDED); check-3d.mjs:105 ("was 1543 stock / 57 Hanoi" - ghi ro la so cu); phase-3a-manifest.md dong 166/225/285 ("1543 thanh 1504").
  - N5b - SOT THAT (nit moi, ngoai pham vi N5 goc): src/assets/loader.js:902 JSDoc van ghi "the Hanoi map uses 14 stock tile ids on 1543 of 1600 cells" va dong 906 "The 25 Hanoi-only models (57 cells)" - ca hai deu sai so voi hien tai (1504 o, 41 model, 96 o). Chi la comment trong code, khong anh huong chay, nen sua o dot don dep sau.
- N7 - SOT THAT (nit moi, code that, khong co check nao bat): GLB_BYTES.hanoiTiles trong loader.js:839 van 2.496.552 byte trong khi file that nay la 3.247.152 byte (+30%); label dong 936 van "hanoi-tiles.glb 2.4 MB" (that 3,25 MB); TEXTURE_BYTES_FALLBACK atlas.webp 2.568.020 (that 2.541.108). Anh huong: trong so tien trinh man hinh load (stageTracker uutien evTotal that khi server bao, nhung trong so job dung bytes cu) va nhan MB hien thi. Chi cosmetic, khong hong load. Khong co check nao kiem gia tri GLB_BYTES (check-3d.mjs:134 chi kiem su ton tai cua stageTracker + GLB_BYTES). Nen sua thanh 3.247.152 / "3.3 MB" / 2.541.108 o dot sau.
- N3 con nguyen (ngoai pham vi vong sua): nha goc 1,40 van dong hang cao nhat voi tan cay sao den 1,40 (GLB: flap cao nhat 1,400 la hanoi_tree__flap_1). Neu muon duy nhat thi ha tan cay hoac nang nha goc - do user chot, khong chan GO.
- N4 con nguyen (ngoai pham vi): 2 qua cau den 0,26 thay vi 0,25; dau mui ten mot chieu chi la vet dormer trang. Khong dang ke.
- 3A-17: dem that tu map: 137 o duong = 100 path_straight + 10 path_t + 7 path_cross + 19 path_end + 1 hanoi_road. Chi hanoi_road (-3,-6) co print gach. Ly do dung: path_* co art nuong san trong tiles.glb chung (856 node, 48 root, co ca path_straight/path_t/path_cross/path_end; file 6.147.140 byte, khong doi tu 2026-11-20) - doi rieng cho Hanoi doi hoac sua tiles.glb goc hoac thay ~136 o bang model Hanoi-only moi. Ghi ro gioi han, khong phai loi vong sua.

### 6. Phan quyet W1/W2/W4 (diem yeu check-3a con lai)

- W1 - 4 check comment van con (check-3a.mjs:164, 194, 360, 361: includes('Phase 3A-07'/'3A-10'/'3A-17')): KHONG CHAN GO. Su that dang sau chung da duoc verifier doc lap chung minh vong nay: print lan ngo + vach gach co that trong GLB qua mau dinh (muc 2, muc 5), print la vang / granite doc that trong code loader + builder o vong truoc. Yeu la o script check, khong phai o game.
- W2 - audit BEFORE van ghi cung 0 (check-3a.mjs:307 auditRows.push([id, 0, after])): KHONG CHAN GO. Vong truoc verifier da do map truoc 3A tu commit ca3efda5: 0 o nong thon that. So truoc dung, chi phuong phap ghi cung la yeu.
- W4 - mirror loader/builder van chi so so flap, khong so chieu cao: KHONG CHAN GO, vi verifier vong nay da bu bang bang chung doc lap: so toan bo 41 recipe loader vs builder theo kind/w/h/x/z/ry/color - 0 lech; parse GLB truc tiep: uv1 8 model hero trung rect, vi tri node trung recipe, flap recipe cao nhat 1,400 (hanoi_tree__flap_1), tong tris 57.508, 0 degenerate. Luu y: flap cao nhat trong GLB neu tinh ca hero card la 1,49 (cathedral, hero co san tu Phase 2), van duoi nguong verify-glb 1,51 - khong phai hoi quy cua vong sua.
- Khuyen nghi (khong phai dieu kien GO): dot sau thay 4 check comment bang check hanh vi (doc mau dinh base nhu muc 2), do BEFORE that tu git, them so chieu cao vao mirror. Khong can lam truoc khi user check bang mat.

### 7. So do chay lai that (verifier tu chay, 2026-11-21)

| Check | Ket qua verifier chay | Khop manifest fixer |
|---|---|---|
| npm run build | PASS - bundle dist/assets/index-CJRHsEzg.js 1.118.520 byte (1.118,52 kB, gzip 338,52 kB), 65 modules, 757 ms | Khop (cung hash CJRHsEzg) |
| npm run check:hanoi | 229 PASS, 0 FAIL - ALL CHECKS PASSED | Khop |
| node tools/step5/verify-glb.mjs | 328 PASS, 0 FAIL - ALL GLB CHECKS PASSED (57.508 tris, 0 degenerate) | Khop |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED | Khop |
| node tools/check-2b.mjs | 406 PASS, 0 FAIL | Khop |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL | Khop |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL | Khop |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL | Khop |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED | Khop |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL | Khop |
| node --check (9 file da sua) | PASS het: loader, animals, build-hanoi-glb, verify-glb, check-solver-options, check-2b, check-3d, check-3a, check-basic | Khop |
| Script doc lap /tmp/verify-fixround.mjs | 45 PASS, 0 FAIL (GLB 3.247.152 byte, 334 node, 293 mesh, 57.508 tris, 41 root; map 1504/96; BFS 1001; 41 recipe khop loader-builder; 8 uv1 hero trung rect) | - |
| 0 dau gach dai | 0 ky tu U+2013/U+2014 trong 12 file da doi (quet bang node) | Khop |
| Kich thuoc file moi | GLB 3.247.152 byte, atlas.webp 2.541.108 byte, atlas.json 171.932 byte (206 sprite) | Khop |

- Git status: working tree van co nhieu file sua tu truoc (phase 2 + 3D + 3F chua commit); khong co file la nao do vong sua tao ra ngoai danh sach manifest (build-sign-atlas.py, GLB, atlas). Script va crop cua verifier chi nam o /tmp, khong vao repo. Build chay lai cho cung bundle hash CJRHsEzg nen dist khong doi.

### 8. Loi con lai

- N5b: JSDoc loader.js:902/906 van ghi 1543 o / 25 model / 57 o (sai so voi 1504 / 41 / 96). Nit tai lieu trong code.
- N7: GLB_BYTES.hanoiTiles 2.496.552 (that 3.247.152), label "2.4 MB" (that 3,25 MB), TEXTURE_BYTES_FALLBACK atlas.webp 2.568.020 (that 2.541.108). Chi lech tien trinh + nhan man hinh load. Khong co check nao bat gia tri nay.
- N3: nha goc 1,40 dong hang cao nhat voi cay sao den 1,40.
- N4: khoang cach 2 qua cau den 0,26 thay vi 0,25; mui ten mot chieu chi la vet dormer trang.
- W1/W2/W4: 3 diem yeu cua script check-3a van con (xem muc 6) - su that dang sau da duoc chung minh doc lap, chi script yeu.
- Khong co loi nao lam hong game, khong co hoi quy so voi vong truoc.

### 9. Ket luan: GO CUOI CUNG cho Phase 3A

- GO: F1/F2/F3 deu da sua dung va co bang chung doc lap (so do, mau dinh GLB, doc sprite bang mat, parse GLB, BFS). Toan bo suite xanh khi verifier chay lai. Khong push, khong commit theo nhiem vu.
- Buoc tiep theo la may user check bang mat: chu bien 0,6 unit co doc duoc tren 390px khong, long ngo 1 unit co cam giac dung khong, tong the Pho Co co "nhin la biet Ha Noi" khong.
- Dot don dep sau (khong chan GO): sua N5b + N7, quyet N3 (cao nhat duy nhat hay dong hang), cung check-3a theo W1/W2/W4.
