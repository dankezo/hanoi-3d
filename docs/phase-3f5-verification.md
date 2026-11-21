# Hanoi 3D - Phase 3F-05 verification doc lap (icon minimap silhouette giay custom)

- Verifier doc lap, 2026-11-21. KHONG sua file game nao. Moi so trong bao cao nay do verifier tu chay, tu dem, tu xem anh - khong dung lai so cua fixer.
- Spec duy nhat: docs/phase-3-spec.md muc 2.6 (3F-05..3F-10), muc 3 phase 3F, muc 4 tieu chi 3F.
- Quyet dinh Q2/Q8: Tran Quoc la landmark rieng thu 11, minimap 168px, icon ve custom, dia so 1-11 lam fallback.
- Chi dung dau gach ngan "-" trong file nay.
- Ket luan: CONDITIONAL GO (xem muc 7). Code, fallback, build, check deu GO. Dieu kien con lai chi nam tren may user: 3 icon kho nhan + cap icon chong mep can anh duyet bang mat tren dien thoai 390px that.

## 1. Bang PASS/FAIL tung muc 3F-05..3F-10

| Muc | Ket qua | Bang chung |
| --- | --- | --- |
| 3F-05 (11 icon silhouette giay custom 32x32) | PASS | Sheet rieng public/textures/art/minimap_icons.png 1.938 byte, 352x64, 22 rect 32x32. Ve lai bang PIL tu tools/step5/build-minimap-icons.py, khong crop sprite hero. Dem pixel doc lap bang PIL: hang to mau muc 80-340 + dat nung 35-192 moi icon; hang outline muc 144-292, dat nung 0. Khop pham vi fixer khai. Xem bang mat muc 2. |
| 3F-06 (phan biet da/chua kham pha + pin r=3.5) | PASS | Hang 0 to mau, hang 1 outline-only. Harness rieng (muc 5): sau discover, glyph hoankiem doi sang hang to mau (sx=0, sy=0), 10 icon con lai o hang outline. Pin traveller: code arc(px, py, 3.5, ...) + vach huong dai 7px. Trang thai to mau vs outline phan biet duoc bang mat o 14px (to mau nau dam + cam, outline xam-nau nhat). Xem nit N1 ve do mo outline. |
| 3F-07 (tap icon locate + mui ten N) | PASS | Harness rieng chay code that: tap westlake chua kham pha -> toast dung chu "Chua kham pha - di toi do", the khong mo, checklist co .locate; tap hoankiem da kham pha -> infoOpen() = 'hoankiem'; keo 30px -> khong mo the; tap vung trong -> khong mo the; tap dung tam cathedral -> mo cathedral, khong nham ngocson. Tap tren minimap stopPropagation + onPointerUp bo qua target #lm-map, nen khong lam traveller di bo. Mui ten N: tam giac dat nung + chu N 9px o (W-11, y 4-21), cach icon gan nhat (Long Bien, tam y 72.5) 49px. Xem nit N2 ve vung tap cap ngocson/cathedral. |
| 3F-08 (dia so 1-11 fallback) | PASS | Harness rieng, fetch reject: ve dung 11 dia r=6 + so 1-11, 0 drawImage. Harness rieng, fetch ok + Image load: 11 drawImage tu hang outline, 0 so fallback (chi chu N). Loader khong chan boot: createLandmarks tra ve ngay khi fetch con treo, dia so ve truoc o lan drawMinimap dong bo dau tien. Xem nit N3: loader khong co timeout. |
| 3F-09 (khong dung thu vien icon co san) | PASS | 11 icon deu ve bang PIL trong build-minimap-icons.py. Khong co Maki / Material / Font Awesome trong landmarks.js, build script, index.html. Khong can credit them. |
| 3F-10 (Tran Quoc icon rieng, khong chong Ho Tay) | PASS | mm_tranquoc rieng (thap 11 tang, 6 tam mai dai dien), anchor (-13,-12); westlake anchor (-9,-11). Tam cach nhau 20.6px > 14px icon, khong chong. Xem anh mo phong minimap muc 2: 2 icon tach biet ro. |

- 3F-01/02/04 (da xong o 3F-quick, kiem lai nhanh): PASS. index.html khong con "cursor: none" (0 lan xuat hien), #lm-map 168x168 + pointer-events auto + cursor pointer, cac phan tu bam duoc co cursor pointer.
- 3F-03 (con tro giay custom): KHONG LAM. Spec ghi tuy chon, khong bat buoc cho 3F pass. Khong tinh FAIL.

## 2. Danh gia tung icon bang mat (doc lap)

- Cach xem: doc truc tiep public/textures/art/minimap_icons.png; xuat crop moi icon phong to 128px (nearest) va thu nho dung 14px (kich thuoc ve that tren minimap 168px, buffer 200px); mo phong minimap 200px dat 11 icon dung anchor that, ca 2 hang to mau va outline. Anh tam luu o /tmp/f5_icons_128.png, /tmp/f5_icons_14.png, /tmp/f5_minimap_filled.png, /tmp/f5_minimap_outline.png (khong dua vao repo).
- Tieu chi: o 14px, khong co nhan, co nhan ra la landmark do khong (chi dua vao hinh, khong dua vao vi tri).

| # | Icon | 14px to mau | Nhan xet |
| --- | --- | --- | --- |
| 1 | hoankiem - Thap Rua | RO | Thap 3 tang xep chong + dinh dat nung doc ngay. |
| 2 | ngocson - Den Ngoc Son | KHO | Mai cong o nho doc thanh khoi toi rong + 2 cot cam; kho phan biet voi cong (vanmieu) neu khong biet truoc. Khop khai bao cua fixer. |
| 3 | westlake - Ho Tay | KHO | Sen + song o 14px chi con chum cam nho tren 3 net song, trong nhu vuong mien/cua. Khong doc ra "ho" neu khong biet vi tri. Icon yeu nhat. Khop khai bao cua fixer. |
| 4 | tranquoc - Tran Quoc | RO | Thap cao hep + 6 tam mai dat nung doc ngay la thap chua. |
| 5 | oldquarter - Pho Co | RO | Nha ong cao hep + mai dat nung + cua so doc duoc. |
| 6 | mausoleum - Lang Bac | RO | Khoi da bac cap + cot co do doc ngay. |
| 7 | vanmieu - Van Mieu | RO | Cong 2 tru + mai cong dat nung doc duoc. |
| 8 | onepillar - Chua Mot Cot | RO (yeu) | Chua nho tren 1 cot don, hinh "cot don" la duy nhat trong bo nen nhan ra; o 14px trong gan nhu so 1 co mai. Chap nhan duoc. |
| 9 | cathedral - Nha Tho Lon | RO | 2 thap nhon + cua vom doc ngay. |
| 10 | opera - Nha Hat Lon | KHO | O 14px chi thay mat tien rong co 3 vach vom - biet la toa nha rong, khong doc ra "nha hat" cu the. Khop khai bao cua fixer. |
| 11 | longbien - Cau Long Bien | RO | Dan thep zigzag + 2 tru + song doc ngay la cau. |

- Tong: 8/11 ro (hoankiem, tranquoc, oldquarter, mausoleum, vanmieu, onepillar, cathedral, longbien), 3/11 kho (ngocson, westlake, opera). KHOP CHINH XAC tuyen bo 8/11 cua fixer, khong them khong bot.
- Tieu chi 3F muc 4: "phan biet duoc it nhat 7/10 landmark bang icon" - o ban to mau dat 8/11, vuot nguong. Nhung luu y: luc moi vao game hau het icon o dang OUTLINE (chua kham pha), va o dang outline o 14px cac icon mo hon nhieu: westlake outline gan nhu chi con net song mo, ngocson outline chi con khung mo, oldquarter outline chi con hinh chu nhat bo tron, opera outline chi con khung + 3 vom mo. Nguoi choi moi vao se kho nhan dien hon con so 8/11 o ban to mau. Day la han che that cua thiet ke outline-only, khong phai loi code.
- Trang thai to mau vs outline: phan biet duoc ro bang mat o 14px (to mau nau dam + cam tuoi, outline xam-nau nhat). 3F-06 dat ve mat phan biet trang thai.

## 3. Cap icon chong mep Ngoc Son - Nha Tho Lon

- Do doc lap tu anchor that trong src/world/hanoi-map.js: ngocson (5,-2), cathedral (7,-1). Tam tren buffer 200px: (125, 90) va (135, 95). Khoang cach tam 11.18px. Icon rong 14px nen hop bao chong nhau 2.82px (khop so ~3px fixer khai).
- Muc thuc: net muc that cua 2 icon hep hon hop bao (ngocson rong net ~12.3px, cathedral ~12.7px o 14px) nen net chi cham nhau khoang 1px o mep. Tren anh mo phong minimap: 2 icon dung sat nhau, van tach thanh 2 hinh rieng, khong dinh thanh 1 khoi. Chap nhan duoc bang mat.
- Phan quyet: NIT, khong phai blocker. Khong doi anchor (spec cam). Ghi de user quyet tren may that: neu thay kho chiu thi thu nho icon xuong 12px hoac dich net icon (khong dich anchor).
- Cap con lai: Tran Quoc - Ho Tay tam cach 20.6px, khong chong. Khong cap nao khac duoi 20px.

## 4. JSON rect + kich thuoc sheet

- minimap_icons.json: size [352, 64] khop PNG 352x64. 22 rect, moi rect 32x32, 0 rect tran/vuot bien, 0 rect chong nhau, du 11 id mm_<id> + 11 mm_<id>_outline theo dung thu tu checklist (hoankiem, ngocson, westlake, tranquoc, oldquarter, mausoleum, vanmieu, onepillar, cathedral, opera, longbien), khong thieu, khong trung.
- game_icons.png cu KHONG doi (mtime 2026-11-20, git status khong list file nay). Sheet rieng la lua chon hop ly nhu manifest giai thich.

## 5. Harness test rieng cua verifier (khong dung test cua fixer)

- File tam: /tmp/f5_verify_harness.mjs (khong dua vao repo). Chay code that src/game/landmarks.js voi DOM/fetch/Image stub.
- Scenario A (fetch reject - gia lap load loi): 12/12 PASS. 11 dia r=6 + so 1-11, 0 drawImage; tap westlake chua kham pha -> toast dung chu "Chua kham pha - di toi do", the khong mo, checklist co .locate; tap hoankiem da kham pha -> mo the; keo 30px -> khong mo; tap vung trong -> khong mo; tap dung tam cathedral -> mo cathedral.
- Scenario B (fetch ok + Image load): 6/6 PASS. 11 drawImage tu hang outline (y=32), 0 so fallback; sau discover hoankiem -> glyph chuyen sang hang to mau (sx=0, sy=0), 10 icon con lai o outline.
- Luu y: 2 FAIL ban dau o scenario B la loi harness (dem cong don ca lan ve dia truoc khi sheet load), khong phai loi game; da sua harness dem rieng lan ve sau khi load va chay lai PASS het.
- Loader: khong co AbortController/timeout (grep 0 ket qua). Nhung khong chan boot: createLandmarks tra ve dong bo, dia so hien ngay. Neu fetch treo vinh vien thi dia so o lai vinh vien - chap nhan duoc vi fallback van choi duoc.

## 6. So do build/check do verifier tu chay

- npm run build: PASS. Bundle dist/assets/index-DWjKJcvv.js, 1.145.681 byte (khop fixer). minimap_icons.png + .json da co trong dist/textures/art/.
- Chay lai script ve: python3 tools/step5/build-minimap-icons.py -> PNG sha256 0d5234d70b70db8a50d3ecfc1104a8969cd96c605af5ce4bc09d799b2d7ac18b, JSON sha256 5f2113f58509b52c7fe9f2b6526b0770cad4efb9796e5163f4fd35fb9dbd9445, cmp IDENTICAL voi file da nop (PNG + JSON). Build lai duoc va khop.
- node --check src/game/landmarks.js: PASS. node --check tools/check-3f.mjs: PASS. python3 -m py_compile tools/step5/build-minimap-icons.py: PASS.
- node tools/check-3f.mjs: 150 PASS, 0 FAIL (tu dem bang grep: 150 dong PASS, 0 dong FAIL).
- npm run check:hanoi: 256 PASS, 0 FAIL. Solver 95/96 (dong PASS "solver options 95 <= 96 (cap)"), 1600 o resolve, 0 mismatch.
- node tools/check-3e.mjs: 73 PASS, 0 FAIL. check-3c: 206 PASS. check-3a: 197 PASS. check-3b: 74 PASS. check-3d: 115 PASS. check-2b: PASS. check-2c: 91 PASS. check-2d: 144 PASS. check-2e: 104 PASS. check-basic: PASS (atlas 206 sprite).
- 0 dau gach dai (U+2013/U+2014) trong 4 file moi/sua: src/game/landmarks.js, tools/check-3f.mjs, tools/step5/build-minimap-icons.py, docs/phase-3f5-manifest.md. 0 chuoi "@keyframes" trong index.html. 0 "cursor: none" trong index.html.

## 7. Danh sach loi

- N1 (nit) - Outline mo hon thiet ke: hang outline ve bang muc alpha 170 nhung khi paste tile len sheet bang chinh tile lam mask thi alpha ap 2 lan, pixel that chi con RGB (60,39,27) alpha 113/255. Tren nen giay, outline hien ra chi khoang 44% dam - nhat hon y do ban dau. Van phan biet duoc voi ban to mau, nhung gop phan lam outline kho doc o 14px (muc 2). Sua (neu muon): paste khong dung mask hoac ve outline truc tiep len sheet. Khong chan GO.
- N2 (nit) - Vung tap cap ngocson/cathedral chong nhau: MM_TAP_R = 11px, tam cach nhau chi 11.18px nen 2 vung tap tron chong nhau phan lon. Code chon icon gan tam tap nhat nen tap dung tam thi dung, nhung tap lech ve phia doi phuong trong vung chong co the mo nham the. Harness da kiem tap dung tam cathedral thi dung. User kiem bang tay tren cam ung.
- N3 (nit) - Loader icon khong co timeout: fetch khong AbortController, khong gioi han thoi gian. Neu mang treo, dia so fallback o lai vinh vien thay vi thu lai. Khong chan boot, khong chan choi, chi la thieu co che thu lai. Co the them timeout o phase sau neu muon.
- N4 (can ve lai, khong phai loi code) - 3 icon kho nhan o 14px: westlake (yeu nhat, khong doc ra ho), ngocson (doc thanh khoi mai), opera (chi biet la nha rong). De nghi ve lai 3 icon nay o vong sau: westlake can them mat nuoc rong + sen to hon (bot net song mo); ngocson can mai cong dam net hon, bot cot cam; opera can vom trung tam cao hon de khac biet voi nha thuong. Quyet dinh ve lai hay giu nguyen thuoc ve user sau khi xem tren may that.

## 8. Nhung gi KHONG the verify trong sandbox

- Icon that tren minimap 168px o trinh duyet 390px: chi mo phong bang anh tinh (buffer 200px + icon 14px). Mau nen that (nuoc Ho Guom xanh luc, Ho Tay xanh lam, patchwork) co the lam icon noi/chim khac voi nen giay don sac trong mo phong.
- Tap icon tren man hinh cam ung that: chi kiem logic tap bang harness (tap vs keo < 10px / < 400ms, vung tap r=11px). Cam giac ngon tay that, do chinh xac khi tap cap ngocson/cathedral, va viec the info co che minimap hay khong chi user kiem duoc.
- Cap icon chong mep nhin that: do so chi 2.82px hop bao, net cham ~1px; co kho chiu that khong thi phai nhin tren man hinh that.
- Dia so co hien trong 1-2 giay dau truoc khi sheet load khong: logic thi co (dia ve truoc, icon ve sau khi onload), nhung toc do that tuy mang/may.
- Tieu chi 3F muc 4 ("phan biet duoc it nhat 7/10 landmark bang icon") tren may user: ban to mau dat 8/11 trong mo phong, nhung o trang thai outline luc moi vao se thap hon - can user dem that.

## 9. Ket luan

- CONDITIONAL GO cho Phase 3F-05.
- Dieu kien: user check tren may that (tab an danh, ?map=hanoi) 3 diem: (a) nhin minimap 168px phan biet duoc it nhat 7/11 landmark bang icon; (b) 3 icon westlake/ngocson/opera co chap nhan duoc hay can ve lai (N4); (c) cap ngocson/cathedral chong mep co kho chiu khong, tap icon mo dung the/toast dung chu khong.
- Neu user duyet 3 diem tren thi doi thanh GO FINAL, khong can sua code. Neu user muon ve lai 3 icon thi chi sua tools/step5/build-minimap-icons.py + chay lai script, khong dong den logic game.
- Phase 3F-05 dong lai Phase 3 ve mat code. Khong co blocker.

## 10. Re-verify vong sua sau verify (2026-11-21, verifier doc lap thu 2)

- Re-verifier doc lap, KHONG sua file game nao. Moi so duoi day do re-verifier tu chay, tu dem, tu xem anh - khong dung lai so cua fixer. Harness rieng moi: /tmp/f5f_reverify_harness.mjs (N2 tam that + trung diem, N3 fetch treo + fetch nhanh). Anh xem rieng: /tmp/f5f_reverify_3icons.png, /tmp/f5f_reverify_all14.png, /tmp/f5f_reverify_oldnew14.png (khong dua vao repo).
- Co so so sanh N4: ban PNG cu cua verifier goc van con o /tmp/f5_png_before.png (1.938 byte, sha khong nam trong repo) + /tmp/f5_json_before.json, nen so pixel cu/moi lam duoc that.

### 10.1 Bang PASS/FAIL tung nit N1..N4

| Nit | Ket qua | Bang chung doc lap |
| --- | --- | --- |
| N1 (outline alpha ap 2 lan) | PASS | Dem pixel doc lap bang PIL tren PNG moi: hang outline 2.690 pixel muc alpha dung 170, 0 pixel alpha 113; hang to mau alpha 255 (3.675 pixel, 0 pixel 113). Khop dung so fixer khai (2.690 / 0). Code: sheet.paste(tile, (col * CELL, row * CELL)) khong dung mask (build-minimap-icons.py dong 232). |
| N2 (vung tap cap ngocson/cathedral) | PASS | Code: MM_TAP_R = 8 (landmarks.js dong 82), vong lap lay tam gan nhat, so sanh `d < bestD` (dong 326, strict <, hoa thi icon truoc thang). Harness rieng 6/6 PASS: tap dung tam that ngocson (127,5, 92,5) -> ngocson; dung tam that cathedral (137,5, 97,5) -> cathedral; (131, 94,5) gan ngocson hon -> ngocson; (134, 95,5) gan cathedral hon -> cathedral; dung trung diem (132,5, 95) -> ngocson; lap lai tam ngocson -> ngocson. Tam that tu anchor trong hanoi-map.js: ngocson (5,-2) -> (127,5, 92,5), cathedral (7,-1) -> (137,5, 97,5), cach nhau 11,18px. Luu y: so (125, 90) / (135, 95) trong bao cao goc la goc o, khong phai tam - ghi chu cua fixer ve diem nay la dung. Luu y them: r=8 van chong nhau (11,18 < 16) nhung nearest-centre + tie-break xu ly dung, harness chung minh o ca 3 diem. |
| N3 (loader khong timeout) | PASS | Code: AbortController + setTimeout 5.000ms abort (landmarks.js dong 605-607), catch giu iconImg null, `.then` cuoi clear timer khi fetch settle (dong 629), co guard khi AbortController khong co, boot khong doi (createLandmarks tra ve ngay). Harness rieng: fetch treo - signal duoc truyen, aborted dung sau 5.064ms, 11 dia r=6 + so 1-11 van ve, 0 drawImage (6/6 PASS). Fetch nhanh - sau 5,7 giay signal VAN chua aborted (timer da clear), 11 drawImage icon load du (3/3 PASS). |
| N4 (ve lai 3 icon kho nhan) | PASS | Xem bang mat doc lap o 14px (co that) + 32px phong to, so cu/moi canh nhau. westlake: CAI THIEN RO - cu la chum cam nho tren net song (trong nhu vuong mien/lua), moi la sen dat nung TO 3 canh tren 3 gon song ngang thang, doc ra sen tren mat nuoc. ngocson: CAI THIEN RO - cu la khoi toi dac mai + than dinh nhau, moi la mai cong mong 2-3px TACH khoi than bang khoang giay, 2 cot dat nung mong, doc ra den/mai cong. opera: CAI THIEN NHE - cu la mat tien rong 3 vom deu, moi co vom giua cao han ro + dinh dat nung cao hon, van la nha rong nhung khac nha thuong ro hon cu. Hang outline cua 3 icon moi o 14px van doc duoc (sen + song, mai tach than, 3 vom + dinh). 8 icon con lai GIU NGUYEN ve hinh: so pixel cu/moi hang to mau diff 0/1024 ca 8 icon; hang outline cua 8 icon chi doi alpha (diff px bang dung so pixel muc moi, vi du hoankiem 276 = 276, cathedral 292 = 292), hinh khong doi. JSON rect khong doi: sha 5f2113f58509b52c7fe9f2b6526b0770cad4efb9796e5163f4fd35fb9dbd9445 giong het ban goc. |

- Tong ket N4 o 14px ban to mau sau ve lai: 11/11 icon deu doc duoc o muc chap nhan tro len (8 ro tu truoc + ngocson/westlake nay ro + opera yeu nhung khac biet hon). Tieu chi 3F muc 4 (phan biet it nhat 7/10) dat trong mo phong. Luu y van con: o dang OUTLINE luc moi vao, cac icon mo hon ban to mau (alpha 170 nay dam hon truoc 44% -> 67% do mo, nhung van nhat hon to mau); nguoi choi moi vao se kho nhan dien hon con so 11/11 o ban to mau.

### 10.2 So do build/check do re-verifier tu chay

- Chay lai script ve: python3 tools/step5/build-minimap-icons.py -> PNG sha256 8979094a3c99f2c3035b809d1325192591750385df85e8dadf1675ed51df60f1, JSON sha256 5f2113f58509b52c7fe9f2b6526b0770cad4efb9796e5163f4fd35fb9dbd9445, IDENTICAL voi file da nop (PNG 1.917 byte, JSON 1.696 byte). Build lai duoc va khop.
- npm run build: PASS. Bundle dist/assets/index-BLOjV665.js, 1.145.899 byte (khop fixer). minimap_icons.png + .json moi da co trong dist.
- npm run check:hanoi: 256 PASS, 0 FAIL. Solver 95/96 (dong PASS "solver options 95 <= 96 (cap)"), 1600 o resolve, 0 mismatch.
- node tools/check-3f.mjs: 150 PASS, 0 FAIL. check-3e: 73 PASS, 0 FAIL. check-3c: 206 PASS, 0 FAIL. check-3a: 197 PASS, 0 FAIL. check-3b: 74 PASS, 0 FAIL. check-3d: 115 PASS, 0 FAIL. check-2b: PASS (0 FAIL). check-2c: 91 PASS, 0 FAIL. check-2d: 144 PASS, 0 FAIL. check-2e: 104 PASS, 0 FAIL. check-basic: PASS (0 FAIL).
- Harness verifier goc chay lai tren code moi: scenario A 12/12 PASS, scenario B 6/6 PASS (khong hoi quy).
- node --check src/game/landmarks.js: PASS. node --check tools/check-3f.mjs: PASS. python3 -m py_compile tools/step5/build-minimap-icons.py: PASS.
- 0 dau gach dai (U+2013/U+2014) trong 4 file da cham: src/game/landmarks.js, tools/step5/build-minimap-icons.py, docs/phase-3f5-manifest.md, docs/phase-3f5-verification.md. 0 chuoi "@keyframes" trong index.html. 0 "cursor: none" trong index.html.

### 10.3 Danh sach loi con lai

- Khong co loi moi, khong co hoi quy. Ca 4 nit N1..N4 da dong.
- Ghi chu khong phai loi: (a) vung tap r=8 cua cap ngocson/cathedral van chong nhau ve hinh hoc (tam cach 11,18px < 16px duong kinh), chi duoc giai quyet bang nearest-centre + tie-break - da chung minh dung bang harness, nhung cam giac ngon tay that van can user kiem; (b) outline luc moi vao van mo hon to mau theo thiet ke (alpha 170), khong phai loi.

### 10.4 Nhung gi VAN chua verify duoc trong sandbox

- Icon that tren minimap 168px o trinh duyet 390px: chi xem anh tinh tren nen giay don sac. Mau nen that (Ho Guom xanh luc, Ho Tay xanh lam, patchwork) co the lam 3 icon moi noi/chim khac.
- Tap cam ung that cap ngocson/cathedral: chi kiem logic bang harness. Do chinh xac ngon tay that va viec the info co che minimap hay khong chi user kiem duoc.
- Dia so co hien trong 1-2 giay dau truoc khi sheet load khong: logic thi co (dia ve truoc, icon ve sau khi onload; fetch treo thi dia o lai sau abort 5 giay), toc do that tuy mang/may.
- Tieu chi 3F muc 4 tren may user: mo phong dat 11/11 o ban to mau, nhung o trang thai outline luc moi vao se thap hon - can user dem that.

### 10.5 Ket luan re-verify

- CONDITIONAL GO cho Phase 3F-05, dieu kien thu hep chi con 1 diem duy nhat tren may user (khong can sua code them).
- Dieu kien: user check tren may that (tab an danh, ?map=hanoi): (a) nhin minimap 168px phan biet duoc it nhat 7/11 landmark bang icon; (b) 3 icon westlake/ngocson/opera moi co chap nhan duoc khong; (c) tap cap ngocson/cathedral mo dung the/toast dung chu khong, cap chong mep co kho chiu khong.
- Neu user duyet 3 diem tren thi doi thanh GO FINAL, khong can sua code. Neu user muon ve lai them thi chi sua tools/step5/build-minimap-icons.py + chay lai script, khong dong den logic game.
- Ca 4 nit cua vong verify goc da duoc sua dung va kiem chung doc lap. Khong co blocker.
