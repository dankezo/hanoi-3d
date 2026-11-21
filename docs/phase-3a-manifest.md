# Hanoi 3D - Phase 3A manifest: Map + duong pho, vibe Ha Noi that

- Ngay: 2026-11-21
- Pham vi: checklist 3A-01..3A-17 theo spec docs/phase-3-spec.md muc 2.1, muc 3 phase 3A, muc 4 tieu chi 3A, muc 6 trap T1-T10
- Co so: repo local ~/workspace/hanoi-3d, git HEAD 4ec66a3, working tree chua commit (phase 2 + 3D + 3F)
- Anh chuan vibe: A1 Ta Hien, A2 dai lo co do, A3 pho Dang Tat, A4 via he tranh dan gian, A5 ngo hep (5 anh trong ~/workspace/user/media_library/image/)
- Ket luan: HOAN THANH 17/17 muc, toan bo suite check xanh (xem muc 7). Chua nhin thay that tren trinh duyet - may user la decider.

## 1. Tom tat

- 16 model Hanoi-only moi (registry 25 thanh 41), 47 o map doi, 2 shape kind moi (star, sag).
- Pho co: 55 o Hanoi-model tren 77 o rect x -8..2, z -9..-3 (truoc 3A: 30 o duong pho 2B + 15 o nha = 45).
- Lan vibe ra ngoai pho co theo chi dao cua user ("vibe pho co TOAN MAP"): 29/47 o doi nam ngoai rect pho co (xem muc 5).
- Solver van 95/96 (trap T1): moi model moi tai dung signature socket cu, khong them model WFC.
- GLB 2.496.552 byte thanh 3.209.100 byte (3,21 MB, duoi muc 3,5 MB).
- Reachability tu spawn (0,0): 1001 o (baseline 998, khong giam ma tang 3).

## 2. Tung muc 3A-01..3A-17

### 3A-01 - Nha ong vang 3 tang (A1)

- Recipe viet lai: hanoi_tubehouse 9 flap (truoc 7), hanoi_tubehouse_b 8 flap (truoc 6).
- Tubehouse: mai tri terracotta 0,9 x 1,35, than mustard 0,6 x 1,12, cua hang paper 0,5 x 0,4, cua ink 0,12 x 0,32, bien dormer paper 0,45 x 0,6, ong khoi brown, nha phu paperShade + mai rust, cua chop tealDeep 0,14 x 0,28.
- Hero card phong to 0,81 x 1,35 (truoc 0,68 x 1,13), tai dung sprite tubehouse co san (nha vang 3 tang, cua chop xanh, ban cong sat den, mai ngoi do).
- 8 o vang: tubehouse (-3,-8), (-6,-7), (0,-6), (-3,-5), (-6,-4); tubehouse_b (-3,-9), (-6,-8), (-2,-6).
- Tubehouse_b: mai rust 0,88 x 1,3, than ochre, hero 0,78 x 1,3.

### 3A-02 - Nha ong xanh la 2 tang, ti le 1:2 (A1)

- Recipe viet lai: hanoi_tubehouse_green 7 flap (truoc 7 flap cay + cot den - khong con la cay nua, gio la nha that).
- Mai terracotta 0,62 x 1,05, than sage 0,52 x 0,9, cua hang paper, bien dormer, cua chop paper.
- 4 o xanh: (-3,-7), (-5,-6), (-6,-5), (-3,-4). Ti le 4 xanh : 8 vang = 1:2 dung spec.
- 1 o doi duy nhat de dat ti le: (-3,-4) tu vang (v) thanh xanh (o). Cac o vang con lai giu nguyen.

### 3A-03 - Nha goc Ta Hien (A1)

- hanoi_cornerhouse moi, 1 o (-6,-6), thay hanoi_road cu o do.
- Cao 1,40 (cao nhat khu pho, hon mai nha ong 1,35): mai tri terracotta 0,9 x 1,4, mat tien mustard 0,75 x 1,15, cua hang paper 0,62 x 0,42, 2 cua ink.
- 3 bien chong nhau: mustard 0,6 x 1,05 (BIA PHO CO), teal 0,5 x 0,88 (CRYSTAL), paper 0,55 x 0,72 (BOLD & Light).
- Socket tai dung path_cross rot 0 (giong hanoi_road cu).

### 3A-04 - Bo 4 bien bia (A1)

- 4 model moi, moi model 4 flap (cot ink 0,5 x 1,0, bien 0,6 x 0,95, bien doc 0,18 x 0,6, de brown), moi model 1 o:
  - hanoi_sign_phoco (-4,-5), bien mustard (BIA PHO CO vang).
  - hanoi_sign_biahoi (-8,-7), bien terracotta (BIA HOI HA NOI cam).
  - hanoi_sign_trucbach (2,-7), bien paper (Truc Bach trang).
  - hanoi_sign_paramount (-5,-3), bien rose (PARAMOUNT BEER hong).
- Chi dung 4 bien nay trong toan game. Khong them ten thuong hieu nao khac o dau.

### 3A-05 - Cot dien + day dien chang chit (A5)

- Recipe viet lai: hanoi_pole 6 flap (truoc 2), hanoi_pole_street moi 6 flap (giong he pole, day xoay 90 do).
- Cot lamp ink 0,55 x 1,3, may bien ap paperShade 0,22 x 0,35, 3 day sag 1,9 x 1,25 / 1,9 x 1,3 / 1,7 x 1,28, vong day arch ink 0,3 x 0,45.
- Day vong xuong thap nhat 0,75 (h - 0,5, dung spec).
- 4 o: pole cu (-8,-8), (2,-8) + pole moi (0,-3) + pole_street moi (-6,-9, thay nha ong V).
- Kind moi 'sag': dai day vong, mep tren lom 0,5 so voi 2 dau, day 0,035, khong chan dat.

### 3A-06 - Cay sao den co thu (A2, A3)

- Recipe viet lai: hanoi_tree 5 flap (truoc 2).
- Than brown 0,25 x 1,0, tan pine 1,2 x 1,4 (cao 1,40, cao nhat khu pho), tan phu moss 0,8 x 1,15, ghe da granite paperShade 0,5 x 0,15, bui sage.
- 8 o (3 cu + 5 moi): cu (-8,-9), (-4,-9), (1,-9); moi (4,-8), (2,-4), (2,-3), (2,1), (2,2).
- Ghi chu: nhap truoc tinh 9 cay la sai (dem thua 1); so do that tu map la 8. Cay cu (-8,-4) thanh ganh hang rong (3A-11), bu lai bang cay moi (2,-4).

### 3A-07 - Cay sau + la vang roi (A3)

- hanoi_sautree moi, 5 flap, 4 o tuyen pho phia nam Ho Guom: (-3,1), (3,1), (-4,2), (-3,2).
- Than brown 0,22 x 0,95, tan mustard 1,0 x 1,2, tan phu ochre 0,7 x 1,0, mo la mustard, da paperShade.
- Base print cham mustard (la vang roi tren co).

### 3A-08 - Den duong cau trang cot xanh (A3)

- Recipe viet lai: hanoi_lamp 5 flap (truoc 2).
- Cot tealDeep 0,1 x 1,1, 2 cau paper 0,18 cach nhau 0,26 o cao 1,10, de tealDeep 0,3 x 0,12, bien teal 0,2 x 0,14.
- 7 o: cu (-4,-7), (-5,-5), (1,-5) + 4 moi ven ho MOI (x=2 phia dong): (3,2), (2,3), (2,4), (2,5).
- Den ven ho dat theo mep ho MOI cua 3B (x=2), khong theo ho cu.

### 3A-09 - Co do sao vang + bang ron do (A2, A3, A5)

- Co: hanoi_flag moi, 4 flap, 6 o: (-7,-7), (3,-7), (-7,-5), (3,-5), (4,2), (4,3).
  - Cot ink 0,06 x 1,1, co terracotta 0,3 x 1,1, sao mustard 0,14 (kind star moi), de da paperShade.
- Bang ron: hanoi_banner moi, 4 flap, 3 o: (3,-9), (4,-9), (3,-8).
  - Cot ink 0,06 x 1,15, bien terracotta 0,25 x 0,7, huy hieu mustard dormer, de da.
- 2 o co thay 2 o via he cu (-7,-7), (-7,-5) nhung base van la print granite nen via he van doc duoc.
- Kind moi 'star': sao 5 canh, tam y = h - R, R = w/2, canh trong 0,382 R, noi tren bien co.

### 3A-10 - Via he da granite + kerb (A4)

- 6 o: (-5,-7), (-2,-7), (0,-7), (-2,-5) (4 o cu) + (4,-4), (4,-3) (2 o moi ven ho).
- Base print moi: da granite 4x4 o (giay paperShade, mach ink, o le dam 0,96), kerb terracotta 2 mep dai.
- Flap kerb 0,5 x 0,08 (truoc 0,12).
- Cung print granite cho co, bang ron, 3 xe may (de da granite).

### 3A-11 - Them 2 ganh hang rong

- Vendor cu (-8,-5) + vendor moi (-8,-4, thay cay cu) + vendor_street moi (2,-6, thay nha ong xanh O).
- Recipe 4 flap (truoc 3): nguoi paper, 2 ganh arch ochre, them ghe nhua teal 0,15 x 0,12.
- Tong 3 ganh hang rong trong map.

### 3A-12 - Nang cap quan pho + them 1 quan

- Phostall cu (2,-5) nang cap + phostall_street moi (-8,-6, thay nha ong U).
- Recipe 10 flap (truoc 4): mai house terracotta 0,9 x 1,0, quay paper 0,5 x 0,4, noi arch ink 0,24 x 0,3, bien PHO mustard 0,34 x 0,18, hoi arch paper, ban thap paperShade 0,5 x 0,3, 4 ghe nhua 0,12 x 0,15 (teal / rose / mustard / teal).
- Tong 2 quan pho trong map.

### 3A-13 - Xe may DAU YEN 5-6 xe (A2, Q7: khong xe chay)

- 3 model moi, moi model 4 flap (than 0,45 x 0,28, 2 banh arch ink 0,16, tay lai ink 0,06 x 0,35), 6 o:
  - Do (rust): (4,-5), (-8,-3).
  - Xanh (tealDeep): (5,-5), (-7,-3).
  - Den (ink): (5,-4), (-4,-3).
- Xe dung yen, tron 2 do + 2 xanh + 2 den, dau doc duong lon x=4..5 va pho co.

### 3A-14 - Bien mot chieu + tuong tranh dan gian (A4)

- Bien mot chieu: gap vao hanoi_trafficlight (5 flap, truoc 3), khong ton them o.
  - Them bien teal 0,25 x 0,8 + dau trang dormer paper 0,12 x 0,8 tren cot den o (-6,-3) (ke ben den giao thong cu).
- Tuong tranh: hanoi_mural moi, 5 flap, 2 o (-10,1), (-10,2) tren tuong phia tay.
  - Tuong paperShade 1,9 x 0,8 chay N-S (ry 90), panel rose 0,5 x 0,6 + teal 0,5 x 0,55, nhan vat mustard 0,3 x 0,6, chan paper 1,9 x 0,12.

### 3A-15 - Audit + xoa moi thu trong giong nong thon

- Bang truoc/sau (dem tren toan bo 1600 o, truoc = audit 2026-11-21 truoc 3A, sau = do that bang check-3a):

| Thu | Truoc (o) | Sau (o) | Ghi chu |
|---|---|---|---|
| barn_farm | 0 | 0 | Khong co o nao |
| windmill | 0 | 0 | Khong co o nao |
| village | 0 | 0 | Khong co o nao |
| village_b | 0 | 0 | Khong co o nao |
| village_green | 0 | 0 | Khong co o nao |
| house (stock y) | 0 | 0 | Khong co o nao, ky tu y tai dung cho vendor_street |
| bridge (stock ^) | 0 | 0 | Khong co o nao, ky tu ^ tai dung cho phostall_street |
| blossom_gazebo (stock P) | 0 | 0 | Khong co o nao, ky tu P tai dung cho sign_paramount |
| hanoi_mausoleum placeholder | 1 khoi nau + bac kraft | 0 khoi nau, 0 kraft | Thanh da granite xam paperShade, bac 1,15 x 0,28 + 1,30 x 0,14 |

- Ket luan audit: trong map khong co san o nao trong giong nong thon; thu duy nhat trong giong nong thon la placeholder lang mac (khoi nau giong chuong bo) - da sua thanh khoi da granite xam co bac cap ro rang (recipe 10 flap, than + mat + dai paperShade/paper, 3 khe ink, 2 canh, 2 bac).
- Ghi nhan follow-up (khong doi o 3A): cuu / tho spawn qua spawns.hanoi (he thong dong vat), khong phai o map - neu muon xoa thi doi o phase sau.

### 3A-16 - Duong pho rong hep khac nhau (A5)

- hanoi_alley moi, 7 flap, 4 o khu dan cu phia tay x -12, z -2..2: (-12,-2), (-12,-1), (-12,1), (-12,2).
- 2 nha 2 ben o x +-0,6: nha tay mai tri terracotta 0,8 x 1,35 + than mustard 0,7 x 1,3; nha dong mai rust 0,8 x 1,3 + than ochre 0,7 x 1,25.
- Khoang giua 0,5 tile (tuong rect 0,7, mep trong +-0,25); mai vo ra 0,05 moi ben nen khoang o cao mai la 0,4.
- Co do terracotta 0,3 x 1,05 + sao mustard 0,12 o x=-0,3, day sag ink 1,9 x 1,2 thap.
- Base print: lan kraft 1 don vi o giua chay N-S, vien toi 2 ben.

### 3A-17 - Mat duong lat gach + vach ke

- hanoi_road 1 o (-3,-6), recipe 2 flap khong doi.
- Base print moi (chi tile hanoi_road): nen gach xam (paperShade x 0,94), mach gach 0,25 so le, vach trang dut doan giua duong, giu zebra 5 vach x 2 dau (nhu 2B).
- Ghi chu: tile path stock van in kraft vi base cua chung nam trong tiles.glb chung voi che do WFC - doi rieng cho Hanoi la follow-up, khong lam o 3A.

## 3. File da doi

| File | Doi gi |
|---|---|
| src/world/hanoi-models.js | Them 16 model moi, registry 25 thanh 41; socket tai dung signature cu |
| src/world/hanoi-map.js | Legend them 16 ky tu moi (N, n, x, z, 0, P, 9, 8, 7, 6, 5, I, y, ^, @, %); 47 o doi |
| src/assets/loader.js | shapeFor them 2 kind moi (star, sag); baseTexture them 4 print (gach, granite, la vang, lan ngo); RECIPES viet lai 8 + them 16; HERO tubehouse phong to |
| tools/step5/build-hanoi-glb.mjs | Mirror day du loader (shapeFor star + sag + dormer, SOCKETS 16 model, RECIPES, HERO); buildBase seg 16/24/32 + print 3A |
| tools/step5/verify-glb.mjs | 41 node, flap counts moi (xem muc 7) |
| tools/check-solver-options.mjs | STAND_IN + EXPECTED_TAGS cho 16 model; tubehouse 15 thanh 12; STREET_CELLS 30 thanh 34 |
| tools/check-2b.mjs | Model 41; STREET_CELLS 34; spillover ngoai rect co ghi chu |
| tools/check-3d.mjs | So o stock 1543 thanh 1504, Hanoi-only 57 thanh 96; tong MB 20,67 thanh 21,38 / 16,04 thanh 16,76 |
| docs/phase-3d-manifest.md | Them addendum 3A o cuoi, khong sua so 3D goc |
| tools/check-3a.mjs | Moi, 197 check cho 3A-01..3A-17 (130 luc 3A + 67 o vong sua: F1 5, F2 57, F3 6) |
| tools/step5/build-sign-atlas.py | Moi o vong sua: ve 6 sprite chu bien bang PIL, them vao atlas.webp + atlas.json |
| src/core/config/animals.js | Vong sua: spawns.hanoi bo sheep/lamb/cow (F3), giu cat/rabbit/songbird |
| tools/step5/verify-glb.mjs | Vong sua: 8 model co hero chu (flap +1, art rect moi) |
| tools/check-2b.mjs, tools/check-basic.mjs | Vong sua: atlas 200 thanh 206 sprite |
| public/models/hanoi-tiles.glb | Build lai local, 3.247.152 byte (binary, parent upload sau; 3A: 3.209.100 byte) |
| docs/phase-3a-manifest.md | File nay |

- Khong cham: src/world/wfc.js, src/world/tiles.js, src/world/world.js, src/core/models.js, src/game/landmarks.js, tiles.glb goc. Atlas 200 sprite luc 3A, them 6 sprite chu o vong sua (thanh 206).
- Ky tu tai dung (stock co 0 o): P (blossom_gazebo thanh sign_paramount), y (house thanh vendor_street), ^ (bridge thanh phostall_street). Model stock van nam trong MODELS cho che do WFC mac dinh.

## 4. Ky thuat can nho

- Socket (trap T1): cornerhouse = path_cross rot 0; vendor_street / phostall_street = village rot 1; pole_street = village rot 0; 13 model con lai = meadow rot 0. Tags: vendor/pho street ['path','village'], pole_street ['path','house','village','blocker'], sign/flag/banner/bike ['village'], sautree/mural/alley [] (giong meadow), cornerhouse ['path'].
- 2 kind moi: 'star' (sao 5 canh, noi tren bien co) va 'sag' (day vong, mep tren lom 0,5). Ca 2 co mat giong het o loader.js va build-hanoi-glb.mjs.
- Sua them trong builder: kind 'dormer' truoc day chi co o loader, builder thieu nen GLB se ve nham thanh rect - 3A them dormer vao builder (bien nha ong, huy hieu bang ron, dau mot chieu dung dormer).
- GLB giu duoi 3,5 MB bang seg: model moi 16 (moi base ~21 KB thay vi ~80 KB), 10 base landmark cu 24 (chi co vet path/river, van net), con lai 32. Luc dau build ra 3.504.388 byte (sat nut 3,5 MB), sau khi ha seg 10 base cu con 3.209.100 byte.
- Footprint: verify-glb bat flap tran tile +-1,01 - da sua 3 cho: tuong mural ve z 0 (truoc -0,1), nha ngo ve x +-0,6 (truoc +-0,62), day pole_street ve z -0,05 (truoc -0,1). Ca 3 sua dong bo loader + builder.
- Palette khong doi: co do dung terracotta (#b9603f), khong do tuoi; da granite dung paperShade (#e8d3ac).

## 5. Nhung cho da lan vibe ra ngoai pho co

- Rect pho co la x -8..2, z -9..-3. Trong 47 o doi, 29 o nam ngoai rect:
- Ven ho MOI (x 2..4, z 2..5, theo mep ho moi cua 3B): 4 den (3,2), (2,3), (2,4), (2,5); 2 co (4,2), (4,3); 2 via he (4,-4), (4,-3); 3 cay sao den (2,1), (2,2), (4,-8).
- Duong lon phia dong (x 3..5): 3 bang ron (3,-9), (4,-9), (3,-8); 2 co (3,-7), (3,-5); 3 xe may (4,-5), (5,-5), (5,-4).
- Khu dan cu phia tay (x -12..-10): ngo hep 4 o + tuong tranh 2 o (-10,1), (-10,2).
- Tuyen pho phia nam Ho Guom (z 1..2): 4 cay sau (-3,1), (3,1), (-4,2), (-3,2) + la vang tren base.
- Cay sao den ven ho cu huong dong: (2,-4), (2,-3) nam tren bien rect (x=2) - doc duoc nhu hang cay ven ho.

## 6. Muc nam trong vung 3B se doi

- Vung 3B tuong lai: rect x -2..1, z -7..4 (Ho Guom moi, an ~30 o pho co). Hien vung nay co 10 o Hanoi-model.
- Chi 1 o MOI cua 3A nam trong vung: cot dien (0,-3) (3A-05, spec bat buoc). 3B ve lai ho se phu o nay - 3B phai dat lai 1 cot o mep ho moi.
- 6 o CU co recipe nang cap o 3A nam trong vung, se doi vi tri nhung recipe (theo model) thi giu nguyen:
  - Nha ong (-2,-6) tubehouse_b, (0,-6) tubehouse (recipe 3A-01/02).
  - Den (1,-5) (recipe 3A-08).
  - Via he (-2,-7), (0,-7), (-2,-5) (kerb + print 3A-10).
- Khong phai 3A, cung nam trong vung (de 3B biet): canh sat (-1,-6), nguoi di bo (1,-6) (2B); thap Rua (-1,-2) (step 3, anchor landmark - spec 3B giu thap giua ho).
- 3A co tinh dat cay/den ven ho theo mep ho MOI (x=2) nen cac o do KHONG can doi o 3B.

## 7. Ket qua verify (so do that)

| Check | Ket qua |
|---|---|
| npm run build | PASS - bundle dist/assets/index-vjz1VmjD.js 1.118.647 byte (1.118,64 kB, gzip 338,52 kB), dist/index.html 9,24 kB, 65 modules, 845 ms |
| npm run check:hanoi | 229 PASS, 0 FAIL - ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) |
| node tools/step5/verify-glb.mjs | 312 PASS, 0 FAIL - ALL GLB CHECKS PASSED (41 node, 57.332 tris, 0 degenerate, flap cao nhat 1,40) |
| node tools/check-3a.mjs | 130 PASS, 0 FAIL - ALL 3A CHECKS PASSED |
| node tools/check-2b.mjs | 406 PASS, 0 FAIL - ALL 2B CHECKS PASSED |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL - ALL BASIC CHECKS PASSED |
| node --check | PASS cho moi file JS da sua (hanoi-models, hanoi-map, loader, build-hanoi-glb, verify-glb, check-solver-options, check-2b, check-3d, check-3a) |

- GLB moi: public/models/hanoi-tiles.glb 3.209.100 byte (3,21 MB), 41 tile, 57.332 tris, 0 degenerate. Cu: 2.496.552 byte (2,50 MB), 25 tile, 54.632 tris. Tang 712.548 byte.
- Ghi chu: check-3d phai cap nhat so live sau 3A (o stock 1543 thanh 1504, tong MB 20,67/16,04 thanh 21,38/16,76) - xem addendum o docs/phase-3d-manifest.md.
- 3F khong co file check tu dong (chi co doc lap verify o docs/phase-3f-verification.md) nen khong chay lai duoc bang script.

## 8. Cach tu kiem tra bang mat

- Chay dev hoac mo ban build, vao ?map=hanoi. Hard reload de chac bundle moi (index-vjz1VmjD.js).
- Goc Ta Hien (-6,-6): nha vang cao nhat khu pho, 3 bien chong nhau; 4 bien bia o (-4,-5), (-8,-7), (2,-7), (-5,-3).
- Doc duong x=3 tu z=-9 xuong z=3: bang ron do, co do sao vang, xe may dau ven duong x=4..5.
- Ngo tay: di toi x=-12, z -2..2 (hep, 2 day nha sat nhau, co do + day dien); tuong tranh o (-10,1), (-10,2).
- Ven ho moi x=2: den cau trang 2 bong, cay sao den cao, tuyen sau z=1..2 co la vang tren dat.
- Quan pho (2,-5) co 4 ghe nhua + noi + bien PHO; ganh hang rong (-8,-5), (-8,-4), (2,-6).
- Cot dien (-6,-9) va (0,-3): day dien vong xuong thap, thay ro 3 dai day.
- Lang mac (-12,3): khoi da granite xam co 2 bac cap, khong con khoi nau.
- Mat duong (-3,-6): gach xam + vach trang dut doan + zebra 2 dau.

## 9. Diem con thieu / chua xong

- Chua nhin thay that tren trinh duyet: sandbox khong co headless browser; mau co/bien/day dien, do rong that cua ngo, do doc cua co tren man hinh that chua verify - may user la decider.
- Nha goc + 4 bien bia + bang ron + quan pho DA CO chu tren bien o vong sua (8 hero art card, xem muc 10). Co do + xe may van chi co flap mau phang (khong co chu can ve).
- Tile path stock van in kraft (khong phai gach xam) vi base nam trong tiles.glb chung voi che do WFC - gioi han ghi ro o muc 10 (3A-17), khong sua tiles.glb goc.
- Dong vat nong thon: cuu/cuu non/bo DA XOA khoi spawns.hanoi o vong sua (xem muc 10, F3).
- Impeccable detect / Hallmark sloplint khong chay (loi tool da biet theo trap T9: detect hang, sloplint khong ton tai tren npm).
- KHONG push, KHONG commit, KHONG upload binary theo nhiem vu - GLB moi chi nam o local, parent upload sau.

## 10. Vong sua sau verify doc lap (2026-11-21)

- Co so: docs/phase-3a-verification.md (verifier doc lap, ket luan GO CO DIEU KIEN voi F1/F2/F3 + nits). Khong push, khong commit, khong upload binary theo nhiem vu.

### F1 - Ngo hep 3A-16: long ngo 0.5 unit thanh 1 unit dung spec

- Nha 2 ben thu hep: rect/tri tu 0.7/0.8 rong tai x +-0.6 thanh 0.5 rong tai x +-0.75 (mep trong +-0.5); mai phang voi tuong (khong vo ra). Co do + sao doi tu x -0.3 sang x -0.62 (tren tuong nha tay, dau bien tho ra ngo 0.03). Day sag giu nguyen.
- Base print lan: loader.js (0.25N..0.75N, rong 0.5N) + buildBase GLB (|x| < 0.5) - truoc day ca 2 chi ve 0.5 unit.
- Check-3a sua bug don vi: assert cu gap === 0.5 goi la "0.5 tile" (thuc ra 0.5 world unit = 0.25 tile) thanh assert gap === 1 world unit (0.5 tile), ghi ro don vi; them check mai (tri) cung gap 1 unit, check mirror ben builder, check print lan 1 unit o ca 2 file.
- Ket qua: check-3a PASS "lane gap 1 world unit (0.5 tile)" (loader + builder), reachability van 1001 o.

### F2 - Chu tren bien: them 6 sprite chu + hero art card

- Script moi tools/step5/build-sign-atlas.py (PIL, DejaVu Sans Bold; "Truc Bach" dung DejaVu Serif Bold): ve 6 sprite o dai trong y=2990 (x tu 2104, cach longbien 16 px, duoi hang basic y=3395), 288 px/unit, assert khong chong lan:
  - sign_biaphoco [2104, 2990, 173, 274]: "BIA PHO CO" chu muc tren nen vang (mustard).
  - sign_biahoi [2293, 2990, 173, 274]: "BIA HOI" / "HA NOI" chu giay tren nen cam (terracotta).
  - sign_trucbach [2482, 2990, 173, 274]: "Truc Bach" chu muc tren nen trang (paper).
  - sign_paramount [2671, 2990, 173, 274]: "PARAMOUNT" / "BEER" chu kem tren nen hong (rose).
  - sign_banner304 [2860, 2990, 72, 202]: nen do, sao vang + "30-4" chu vang doc doc.
  - sign_pho [2948, 2990, 98, 52]: "PHO" chu do (rust) tren nen vang.
- Co che gan: hero art card trong build-hanoi-glb.mjs HERO - flap hero copy y het hinh hoc flap bien goc (cung kind/w/h/x/z), sprite map len mat truoc qua uv1; vung trong suot cua sprite bi discard (materials.js) nen flap bien phang sau van hien. Bien lamp chi ve mau + chu trong dau bien (18% tren cua flap, dung vi tri dau bien lamp); bang ron + bien PHO la flap rect nen sprite phu kin mat bien.
- Gan vao 8 model: hanoi_cornerhouse (tai dung sprite BIA PHO CO cho bien vang tang tret; 2 bien CRYSTAL / BOLD & Light van mau phang), 4 bien bia, hanoi_banner, hanoi_phostall + hanoi_phostall_street (chung sprite PHO).
- Atlas: 200 thanh 206 sprite; atlas.webp 2.568.020 thanh 2.541.108 byte (nen lai nho hon 26.912 byte), atlas.json 169.008 thanh 171.932 byte.
- Kiem chung chu doc duoc: xem truoc sprite phong to (kiem tra local, khong dua vao repo): ca 6 chu doc ro; do bang pixel: 0 pixel mo duoi bang bien (18% tren) o ca 4 bien lamp; "30-4" nam gon trong bang ron (ban ve dau bi cat chan duoi da sua). Gioi han that: chu tren bien 0.6 unit, doc duoc khi lai gan; o xa chi doc duoc mau + hinh chu - may user la decider.
- GLB: 3.209.100 thanh 3.247.152 byte (+38.052, van duoi 3,5 MB), 41 node, 57.508 tris (truoc 57.332), 0 degenerate. verify-glb cap nhat 8 model (flap +1, art rect moi) va PASS, ke ca uv1 range khop rect tung sprite.
- Check-3a them 57 check F2: 6 sprite ton tai trong atlas.json, dung rect, nam trong atlas 4096, 0 chong lan, tong 206 sprite; hero wiring doc tu HERO + SPRITES trong build-hanoi-glb.mjs: dung model, dung sprite, flap hero trung hinh hoc flap bien trong loader recipe, rect sprite trung atlas.json.

### F3 - Cuu/bo spawn o Hanoi: xoa khoi spawns.hanoi

- src/core/config/animals.js: spawns.hanoi meadow/meadow_flowers/hills bo sheep/lamb/cow; giu cat/rabbit/songbird; rocks giu rabbit/fox. spawns.heartland + spawns.all khong doi (cuu van spawn o che do WFC, vit van spawn o pond).
- Check-3a them 6 check: khong con sheep/lamb/cow trong spawns.hanoi (doc truc tiep object animals), meadow van co cat + rabbit, meadow_flowers van co songbird, pond van co duck, heartland meadow van co sheep.

### Nits

- N1: manifest muc 1 "30 + 19" thanh "30 + 15 = 45" (15 o nha truoc 3A: 7 tubehouse + 4 tubehouse_b + 4 tubehouse_green).
- N2: check-solver-options.mjs comment: 3 o mat khoi ho nha ong o 3A la (-6,-9) pole_street, (-8,-6) phostall_street, (2,-6) vendor_street; nha goc (-6,-6) thay o road, khong phai nha ong. Tong 12 van dung.
- N5: 1543 thanh 1504 trong header tools/check-3d.mjs (dong 7) va than docs/phase-3d-manifest.md (muc "Diem con thieu"). So 1543 trong muc 3D-02 goc + addendum ("1543 thanh 1504") la so lich su, giu nguyen.
- 3A-17 (gioi han, khong sua duoc): chi 1/137 o duong co print gach (hanoi_road (-3,-6)); 136 o duong stock (100 path_straight + 10 path_t + 7 path_cross + 19 path_end) van in kraft vi base cua chung nuong san trong tiles.glb chung voi che do WFC - doi rieng cho Hanoi doi hoac sua tiles.glb (cam) hoac thay ~136 o bang model Hanoi-only moi (vuot trap solver 95/96 + doi socket). Ghi ro gioi han nay, khong doi tiles.glb goc.

### Ket qua chay lai (so that, 2026-11-21)

| Check | Ket qua |
|---|---|
| npm run build | PASS - bundle dist/assets/index-CJRHsEzg.js 1.118.520 byte (1.118,52 kB, gzip 338,52 kB), 65 modules, 1.05 s |
| npm run check:hanoi | 229 PASS, 0 FAIL - ALL CHECKS PASSED (solver 95/96, 0 mismatch, 1600 o resolve) |
| node tools/step5/verify-glb.mjs | 328 PASS, 0 FAIL - ALL GLB CHECKS PASSED (41 node, 57.508 tris, 0 degenerate, flap cao nhat 1,40) |
| node tools/check-3a.mjs | 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED (truoc 130) |
| node tools/check-2b.mjs | 406 PASS, 0 FAIL |
| node tools/check-2c.mjs | 89 PASS, 0 FAIL |
| node tools/check-2d.mjs | 139 PASS, 0 FAIL |
| node tools/check-2e.mjs | 104 PASS, 0 FAIL |
| node tools/check-3d.mjs | 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED (first-load truoc 21.40 MB / sau 16.77 MB, deferred 4.63 MB) |
| node tools/check-basic.mjs | 64 PASS, 0 FAIL |
| node --check | PASS cho moi file JS da sua (loader, animals, build-hanoi-glb, verify-glb, check-solver-options, check-2b, check-3d, check-3a, check-basic) |

- GLB moi: public/models/hanoi-tiles.glb 3.247.152 byte (3,25 MB), 41 tile, 57.508 tris, 0 degenerate. Cu (3A): 3.209.100 byte, 57.332 tris. Tang 38.052 byte.
- Atlas moi: 206 sprite, atlas.webp 2.541.108 byte, atlas.json 171.932 byte.
- 0 dau gach dai trong moi file da doi (quet bang node).
- Chua nhin thay that tren trinh duyet: mau/chu bien that, do doc chu 0.6 unit o 390px, do rong that cua ngo khi di bo - may user la decider.
