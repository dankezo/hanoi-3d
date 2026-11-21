# Hanoi 3D - Phase 3C manifest (the info redesign)

Fixer build, 2026-11-21. Chi UI + logic mo/dong the. KHONG doi discovery radius (van 1),
KHONG doi storage (van `hanoi:v1:<seed>`), KHONG doi noi dung lich su / fun fact day du /
nguon da verify (check-2b van so khop tung chu voi docs/landmark-history.md).
Khong push, khong commit, khong upload binary. Quyet dinh Q3/Q4 da duyet: the chi mo khi
BAM, the chi hien 1 NGON NGU. Chi dung dau gach ngan "-" trong moi file.

## Quy tac mo / dong / bam chinh xac (doc ky truoc khi test)

Mo the - chi 3 cach, khong co cach nao khac:

- Bam vao landmark tren man hinh: bam (tap) vao o anchor cua landmark, hoac vao o trong
  ban kinh 1 cua anchor. Cu bam chi tinh khi di chuyen < 10px VA keo dai < 400ms
  (tap vs drag). Cu bam dat thi mo the cua landmark do VA KHONG di bo cho cu bam do
  (controls.clearTarget() go bo dich di bo vua dat).
- Bam dau "!" vang tren dinh landmark (dau "!" la nut DOM, bam duoc nhu nut thuong).
- Bam item checklist cua landmark DA kham pha (item chua kham pha: khong lam gi).

Dong the - chi 3 cach, khong co cach nao khac:

- Bam nut X tren the.
- Bam (tap that, < 10px va < 400ms) ra ngoai the, tren vung canvas (game). Cu tap
  nay van di bo nhu thuong (di bo khong bi chan khi the mo), chi la the dong truoc
  khi di. Keo (drag) de di bo khong dong the (vong sua sau verify, NIT-5).
- Mo the cua landmark khac (bam landmark khac, dau "!" khac, tab co-discovery, item
  checklist khac).

KHONG tu dong khi dang doc: di ra khoi ban kinh 1 KHONG dong the neu the dang mo.
Quy tac cu "di xa thi dong" da bi xoa hoan toan. The cung khong tu mo: den gan landmark
chi hien toast ngan + dau "!" + vong tron tren dat, khong mo the.

## 3C-01 - Trigger moi: BAM moi mo

- Xoa `showInfo()` khoi `discover()`: discovery chi danh dau visited, hien toast ngan,
  phat event `game:landmark` nhu cu. `infoOpen()` van null sau discovery.
- Toast moi, ngan: tieu de "Da den Ho Hoan Kiem" + dong phu "Bam de xem" (EN:
  "Arrived at Hoan Kiem Lake" / "Tap to view"). Khong con ten ngon ngu thu hai xep
  duoi toast. Toast doi ngon ngu ngay khi toggle, neu dang hien.
- Dau "!" vang: phan tu DOM `#lm-bang` (index.html), landmarks.js chieu toa do 3D cua
  anchor (cao 1.7, tren flap cao nhat 1.49) ra man hinh moi frame qua camera
  (`follow.camera`). Hien khi traveller trong ban kinh 1 cua BAT KY landmark nao
  (ke ca da kham pha, de mo lai khi quay lai); an khi ra khoi vung hoac khi anchor
  o sau camera. Nhap nhay nhe bang interval JS doi opacity 1 / 0.45 moi 600ms
  (khong dung keyframes - xem muc trap o cuoi). Bam dau "!" mo the cua landmark do
  (chi khi da kham pha; thuc te discovery chay ngay khi vao ban kinh 1 nen luc nao
  cung da kham pha).
- Bam landmark tren man hinh: landmarks.js gan listener `pointerdown` / `pointerup`
  rieng tren canvas `#atlas` (sau listener cua controls, nen controls da dat dich di
  bo truoc khi minh go bo). `pointerdown` chi ghi lai diem bat dau; `pointerup` kiem
  tra < 10px va < 400ms, raycast qua camera xuong mat phang y = 0, doi ra o (cell),
  mo the neu o do trong ban kinh 1 cua anchor (dung lai ham `nearLandmark`, ke ca
  dien tich landmark). Tap that ma khong trung landmark thi dong the dang mo. Bam
  trung landmark chua kham pha: khong mo gi (khong the xay ra khi armed, vi discovery
  chay truoc). Keo (drag) >= 10px: khong mo the, di bo nhu thuong, the van mo
  (vong sua sau verify, NIT-5).
- Neu 2 landmark cung gan: dau "!" chi vao landmark gan nhat theo thu tu checklist.

## 3C-02 - Vong bao hien thi tren dat

- Vong tron that bang THREE.js, khong dung fallback cham "!" + toast: 1 mesh
  `RingGeometry(1.85, 2.0, 48)` nam ngang tai anchor, mau dat nung `#b9603f`,
  opacity 0.35, ban kinh ngoai 2.0 world unit = dung 1 tile. 1 mesh duy nhat, doi
  vi tri theo landmark gan nhat; hien khi trong ban kinh 1, bien mat khi ra khoi
  vung. Khong hien so ban kinh. Mesh chi tao khi co `ctx.scene` (khong chay o
  headless), go khoi scene o `dispose()`.

## 3C-03 - Chi hien 1 ngon ngu 1 luc

- The chi hien ngon ngu dang chon (VI mac dinh, detection + toggle nhu cu). Ten,
  tom tat, fun fact ngan, lich su, fun fact day du, link nguon: tat ca chi 1 ngon
  ngu, khong con xep chong VI + EN. Markup cu (`lm-info-title-vi/en`,
  `lm-info-hist-vi/en`, `lm-info-fun-vi/en`) da xoa khoi index.html.
- Toggle VI | EN TRONG the (`#lm-info-lang` o head the) doi ngay khong can dong the;
  toggle global goc tren-phai van doi duoc. Ca hai deu re-render the dang mo va giu
  nguyen trang thai mo rong / thu gon (xem 3C-04).

## 3C-04 - Tom tat truoc, chi tiet sau

- The mo co 3 lop. (a) mac dinh: ten lon + 1 cau tom tat + 1 fun fact ngan.
  (b) nut "Doc them" mo them: 3 dong lich su + fun fact day du; nut doi thanh
  "Thu gon" de gap lai lop (a). (c) link nguon o cuoi lop (b), dang "Nguon:
  <hostname>" / "Source: <hostname>".
- Them truong moi vao landmark-history.js: `summaryVI`, `summaryEN`,
  `funShortVI`, `funShortEN` cho ca 11 landmark. Chi THEM truong, KHONG sua
  `histEN`, `histVI`, `funEN`, `funVI`, `source` (check-2b van pass).
- Tom tat viet trung thanh voi lich su da verify, khong them su kien / so lieu moi.
  Fun fact ngan rut tu fun fact day du, khong doi nghia. Tieng Viet KHONG dau.
- Edge override (phase 2D, `ctx.historyInfo`) khong co truong moi: fallback tom tat
  = dong lich su dau tien, fun fact ngan = fun fact day du. Chi anh huong ban edge,
  khong anh huong ban thuong.
- 22 cau tom tat da them (so tu dem bang check-3c, tach theo khoang trang):

| Landmark | Tom tat VI (so tu) | Tom tat EN (so tu) |
|---|---|---|
| Ho Hoan Kiem | Ho giua long Ha Noi, gan voi truyen thuyet vua Le Loi tra guom cho rua vang nam 1428. (19) | A central Hanoi lake tied to the legend of King Le Loi returning his sword in 1428. (17) |
| Den Ngoc Son | Den tren dao Ngoc giua ho Hoan Kiem, tho Tran Hung Dao, noi bang cau The Huc do. (18) | A temple on Jade Island in Hoan Kiem Lake, reached by the red The Huc Bridge. (16) |
| Ho Tay | Ho lon nhat Ha Noi, rong khoang 500 ha, tung la mot khuc song Hong cu. (16) | Hanoi's largest lake, about 500 hectares, formed from an old bend of the Red River. (15) |
| Chua Tran Quoc | Chua co nhat Ha Noi, dung tu the ky 6, doi ra dao giua ho Tay nam 1615. (18) | Hanoi's oldest pagoda, founded in the 6th century and moved onto West Lake in 1615. (15) |
| Pho Co Ha Noi | Khu pho buon tu nam 1010, moi pho mang ten mot nghe, bat dau bang chu Hang. (17) | A merchant quarter from 1010, where each street still bears the name of its old trade. (16) |
| Lang Chu tich Ho Chi Minh | Lang da tren Quang truong Ba Dinh, giu thi hai Chu tich Ho Chi Minh. (15) | A granite mausoleum on Ba Dinh Square holding the body of President Ho Chi Minh. (15) |
| Van Mieu - Quoc Tu Giam | Van Mieu dung nam 1070 tho Khong Tu, Quoc Tu Giam la truong dai hoc dau tien. (17) | A Confucian temple from 1070 housing Quoc Tu Giam, Vietnam's first national university. (13) |
| Chua Mot Cot | Chua nho tren mot cot da giua ho sen, xay nam 1049 tu giac mo Ly Thai Tong. (18) | A small shrine on a single stone pillar in a lotus pond, built in 1049. (15) |
| Nha Tho Lon Ha Noi | Nha tho co nhat Ha Noi, xay 1884-1886 theo kieu Tan Gothic, hai thap chuong 31,5 m. (17) | Hanoi's oldest church, built 1884-1886 in Neo-Gothic style with twin 31.5 m bell towers. (14) |
| Nha Hat Lon Ha Noi | Nha hat xay 1901-1911 mau Palais Garnier, noi mo dau Cach mang thang Tam nam 1945. (16) | An opera house built 1901-1911 after the Palais Garnier, where the August Revolution began in 1945. (16) |
| Cau Long Bien | Cau thep dau tien bac qua song Hong, xay 1899-1902, dai 2,4 km, van co tau chay qua. (18) | The first steel bridge over the Red River, built 1899-1902, 2.4 km long and still in use. (17) |

- 22 fun fact ngan da them (so tu):

| Landmark | Fun fact ngan VI (so tu) | Fun fact ngan EN (so tu) |
|---|---|---|
| Ho Hoan Kiem | Thap Rua tung la mo gia dinh; Cu Rua chet nam 2016. (12) | The tower was once a family tomb; the last giant turtle died in 2016. (14) |
| Den Ngoc Son | Trong den co hai tieu ban rua kho lo, tu nam 1967 va 2016. (14) | Two preserved giant turtles are kept inside, from 1967 and 2016. (11) |
| Ho Tay | Cay bo de san chua moc tu canh chiet o Bodh Gaya, An Do. (14) | Its bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya. (14) |
| Chua Tran Quoc | Cay bo de san chua la qua cua Tong thong An Do nam 1959. (14) | The courtyard bodhi tree was a gift from India's president in 1959. (12) |
| Pho Co Ha Noi | Con so 36 chua bao gio khop ban do; Hang Bac van ban bac. (14) | The number 36 never matched the map; Hang Bac still sells silver. (12) |
| Lang Chu tich Ho Chi Minh | Di chuc Bac dan hoa tang, nhung Lang van duoc xay de dan vieng. (14) | His will asked for cremation, yet the mausoleum was built for public respects. (13) |
| Van Mieu - Quoc Tu Giam | Bia tien si tren lung rua da, tam dau tien nam 1484. (12) | The 82 doctor stelae stand on stone tortoises, the first raised in 1484. (13) |
| Chua Mot Cot | Nam 2012 chua duoc cong nhan co kien truc doc dao nhat chau A. (14) | In 2012 it was recognised as Asia's most uniquely designed pagoda. (11) |
| Nha Tho Lon Ha Noi | Nha tho tren nen chua the ky 11, goi la Nha Tho Lon. (13) | It stands on an 11th-century pagoda site; locals call it the Big Church. (13) |
| Nha Hat Lon Ha Noi | Tho dong hang chuc nghin coc tre lam mong truoc khi xay nha hat. (14) | Workers drove tens of thousands of bamboo stakes to found the theatre. (12) |
| Cau Long Bien | Cau khong do Eiffel thiet ke, dan goi la thap Eiffel nam ngang. (13) | Not designed by Eiffel; Hanoians call it an Eiffel Tower on its side. (13) |

## 3C-05 - Chu lon gap doi

- Tieu de ten 20px bold; tom tat 16px/1.6; fun fact ngan 16px/1.6; nut (Doc them,
  tab, toggle ngon ngu, X) 15px; chu lich su + fun fact day du 15px/1.6; heading
  muc 12px. Tren 390px: the rong toi da 360px (giu), cao toi da 60vh (truoc 52vh),
  noi dung cuon trong the (`#lm-info-body` co `max-height: calc(60vh - 48px)` va
  `overflow-y: auto`). Trang khong bao gio cuon.

## 3C-06 - Khong tu dong khi dang doc

- Da xoa hoan toan dong `hideInfo()` trong `update()` khi di ra khoi ban kinh 1.
  The chi dong theo 3 cach o muc quy tac tren. Bam vao canvas de di bo cung dong the
  (do la "bam ra ngoai the"), nhung di bo bang phim WASD thi the van mo.
- `settle()` (chup anh / reset) van dong the nhu cu.

## 3C-07 - Tach the khoi toast

- Ca hai cach cung lam: toast da ngan chi con 2 dong (ten + "Bam de xem"), VA khi the
  mo thi toast doi len tren: `body.card-open #lm-toast { bottom: 62vh }`, dong the
  thi tro ve 11vh, co transition 0.35s cho bottom. Khong con 2 lop chu chong nhau
  o giua-duoi man hinh.

## 3C-08 - The dang bottom sheet tren dien thoai

- Man hinh <= 500px (`@media (max-width: 500px)`): the truot tu duoi len trong 250ms
  ease-out, rong 100vw - 16px (left/right 8px, bottom 8px), goc tren bo tron 12px,
  co tay keo `#lm-info-grip` (thanh 44x4px) o dinh. Tren desktop: giu kieu card
  giua man hinh (bottom 21vh, translateX(-50%)) nhu cu.
- Truot chay bang transition + class `.in` duoc them o frame ke tiep (landmarks.js
  dung `requestAnimationFrame`, fallback them ngay neu khong co rAF), KHONG dung
  keyframes - ly do o muc trap.
- Bottom sheet che minimap khi dang mo (chap nhan duoc khi dang doc); dong the thi
  minimap hien day du tro lai (minimap khong bi doi vi tri, chi bi the che). The
  chi che dung hinh chu nhat cua no o day man hinh: bam ra ngoai the van di bo duoc
  (va dong the theo 3C-06). Khong co joystick / nut di bo rieng trong game nen khong
  co nut nao bi che vinh vien.

## 3C-09 - Co-discovery: hien ca 2 the dang list

- Khi mo the, landmarks.js tinh `nearby()` = cac landmark DA kham pha trong ban kinh
  1 cua o hien tai. Neu >= 2 thi hien hang tab o dinh the (`#lm-info-tabs`), 1 nut
  moi landmark (ten theo ngon ngu dang chon); nut dang xem co class `on`. Bam nut
  nao doi the sang landmark do (ve lop (a), giu nguyen hang tab). Neu chi 1
  landmark gan thi khong hien hang tab.
- Vi du da test: dung o (6,-1) gap Den Ngoc Son + Nha Tho Lon cung luc, the hien 2
  tab, bam tab thu hai doi sang Nha Tho Lon Ha Noi.

## 3C-10 - Kiem tra doc hieu

- check-3c dem tu lop (a) cho ca 11 the x 2 ngon ngu: tom tat <= 20 tu, fun fact
  ngan <= 15 tu (xem bang o 3C-04). Uoc tinh thoi gian doc lop (a) o toc do doc tham
  240 tu/phut, tinh ca ten + tom tat + heading "Dieu thu vi" + fun fact ngan +
  nut "Doc them":

| The | VI | EN |
|---|---|---|
| Ho Hoan Kiem | 9.8 s | 9.5 s |
| Den Ngoc Son | 10.0 s | 8.5 s |
| Ho Tay | 9.3 s | 8.8 s |
| Chua Tran Quoc | 10.0 s | 8.5 s |
| Pho Co Ha Noi | 10.0 s | 8.5 s |
| Lang Chu tich Ho Chi Minh | 10.0 s | 9.0 s |
| Van Mieu - Quoc Tu Giam | 10.0 s | 8.3 s |
| Chua Mot Cot | 10.0 s | 8.3 s |
| Nha Tho Lon Ha Noi | 10.0 s | 8.5 s |
| Nha Hat Lon Ha Noi | 10.0 s | 8.8 s |
| Cau Long Bien | 9.8 s | 9.3 s |

- Ca 22 the uoc tinh <= 10.0 giay o 240 tu/phut, NHUNG 8 the VI dung o 10.0 giay
  (bien do 0). Day chi la uoc tinh tren giay: phan do that tren dien thoai 390px
  (mo tung the, bam gio doc lop (a)) la viec cua user / verifier, CHUA lam. Neu doc
  that vuot 10 giay thi cach sua la cat ngan them fun fact ngan (con du cho, hien
  11-14 tu) hoac tom tat, khong doi cau truc.

## File da doi / them

- `src/game/landmarks.js` - trigger bam-moi-mo, dau "!", vong tron, 1 ngon ngu,
  3 lop, khong tu dong, toast tach, bottom sheet, tab co-discovery, API moi
  `nearby()`, `bangTarget()`, `ringVisible()`, `infoExpanded()`. API cu giu nguyen
  (`visited`, `count`, `list`, `debugDiscover`, `openInfo`, `closeInfo`, `infoOpen`,
  `lang`, `setLang`, `detectLang`, `nearLandmark`, `storeKey`, `defs`).
- `index.html` - DOM the moi (1 tieu de, tom tat, fun fact ngan, nut Doc them,
  chi tiet an, tab, toggle ngon ngu trong the, tay keo), phan tu `#lm-bang`, CSS
  the + toast + bottom sheet. Khong doi man hinh loading, khong doi checklist /
  minimap / toggle global.
- `src/game/landmark-history.js` - CHI them 4 truong moi moi landmark
  (`summaryVI`, `summaryEN`, `funShortVI`, `funShortEN`). Lich su, fun fact day du,
  nguon khong doi 1 chu.
- `tools/check-3c.mjs` (moi) - check 3C, xem muc verification.
- `docs/phase-3c-manifest.md` (moi) - file nay.
- KHONG doi: `src/game/i18n.js` (chuoi moi cua the nam trong landmarks.js,
  `CARD_STRINGS`), `src/player/controls.js` (bam landmark xu ly bang listener
  rieng tren canvas, go bo dich di bo qua `controls.clearTarget()` co san),
  discovery radius, storage key, map, GLB, atlas.

## Verification (so that, chay sau khi sua xong)

- `npm run build`: PASS. Bundle `dist/assets/index-DWqoL7lf.js`, 1,132.52 kB
  (gzip 342.30 kB). Truoc 3C (baseline): `index-C5CARRqL.js`, 1,123.63 kB
  (gzip 339.82 kB). Tang 8.89 kB. `dist/index.html` 11.37 kB.
- `npm run check:hanoi`: ALL CHECKS PASSED.
- `node tools/check-3c.mjs`: ALL 3C CHECKS PASSED (206 PASS, 0 FAIL). Bao gom:
  dem tu 22 tom tat + 22 fun fact ngan, uoc tinh doc 22 the, khong tu mo trong
  `discover()`, khong tu dong trong `update()`, tap < 10px / < 400ms, vong tron
  RingGeometry, toast 62vh khi the mo, CSS chu 20/16/15/12px, the 60vh / 360px,
  bottom sheet <= 500px + 250ms + goc 12px + tay keo, DOM "!" + tab + nut Doc them
  + toggle trong the, va fake-DOM chay that: discovery khong mo the, toast dung
  chu, "!" + vong hien/an theo ban kinh, tap len landmark mo dung the + huy di bo,
  drag 50px khong mo the, Doc them / Thu gon, toggle ngon ngu trong the giu trang
  thai mo rong, di xa khong dong the, bam ra ngoai dong the, co-discovery 2 tab
  o (6,-1) va doi tab, X dong, checklist mo lai.
- Hoi quy, tat ca PASS:
  - `node tools/check-2b.mjs`: ALL 2B CHECKS PASSED (lich su / fun fact / nguon
    khop doc tung chu, discovery ban kinh 1, store key).
  - `node tools/check-3a.mjs`: 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED.
  - `node tools/check-3b.mjs`: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED.
  - `node tools/check-3d.mjs`: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED.
  - `node tools/check-basic.mjs`: ALL BASIC CHECKS PASSED.
- `node --check` cho `src/game/landmarks.js`, `src/game/landmark-history.js`,
  `tools/check-3c.mjs`: tat ca OK.
- Khong co dau gach dai trong 4 file doi/moi (landmarks.js, landmark-history.js,
  index.html, check-3c.mjs). landmark-history.js + landmarks.js pure ASCII.
  index.html chi co 1 dong non-ASCII co san tu truoc (hint div, khong phai 3C).

## Cach tu kiem tra bang mat (tren may user, ?map=hanoi, tab an danh)

1. Di bo toi gan Ho Guom: thay dau "!" vang nhap nhay tren Thap Rua + vong tron
   dat nung tren dat quanh ho + toast ngan "Da den Ho Hoan Kiem - Bam de xem".
   THE KHONG TU MO. Di ra khoi vung: "!" + vong bien mat.
2. Bam vao Thap Rua tren man hinh: the mo, chi hien tieng Viet: ten lon, 1 cau tom
   tat, 1 fun fact ngan, nut "Doc them". Doc xong lop (a), bam gio.
3. Bam "Doc them": hien 3 dong lich su + fun fact day du + link Nguon. Bam
   "Thu gon": gap lai lop (a).
4. Bam toggle VI | EN trong the: the doi sang tieng Anh ngay, khong dong the.
5. Khi the dang mo, di bo ra xa (WASD): the VAN MO. Bam X hoac bam ra ngoai the
   tren man hinh game: the dong.
6. Dung o (6,-1) (giua Den Ngoc Son va Nha Tho Lon): the hien 2 tab o dinh; bam
   tab thu hai doi the.
7. Tren dien thoai 390px: the truot tu duoi len dang bottom sheet, co tay keo o
   dinh; dong the thi minimap hien day du tro lai. Chu du lon de doc khong can zoom.
8. Mo checklist, bam 1 item da kham pha: the cua landmark do mo.

## Diem con thieu / chua xong / can chu y

- 3C-10 that: chua do thoi gian doc that tren dien thoai 390px. Uoc tinh 8.3-10.0
  giay, 8 the VI dung o 10.0 giay (bien do 0 o 240 tu/phut). User / verifier bam gio
  doc that moi the; neu vuot 10 giay thi cat ngan them fun fact ngan / tom tat.
- Khong co render that o sandbox (khong co headless Chromium): hinh dang dau "!",
  vong tron, bottom sheet, co chu tren 390px chi duoc kiem bang code + fake-DOM,
  chua thay bang mat. User check tren may anh la buoc quyet dinh.
- check-2c / check-2d HIEN FAIL + CRASH (co chu dich, khong phai do 3C hong):
  2 check nay assert hanh vi CU ma spec 3C xoa co chu dich - tu mo the khi discovery,
  toast 2 ngon ngu ("Discovered: ..." + ten VI), the 2 ngon ngu xep chong. Cu the:
  check-2c fail 4 muc (toast EN, toast sub VI, the mo khi discovery, title EN
  first) roi crash o dong 319 vi fake-DOM cua no doc `lm-info-body.children[0]`
  (the moi khong sap xep lai section trong body); check-2d fail 1 muc (historyInfo
  override hien ten EDGE) roi crash o dong 428 cung ly do. Khong sua 2 file nay
  vi ngoai pham vi file duoc cham - coordinator cap nhat check-2c / check-2d theo
  hanh vi 3C moi, hoac bo cac assert ve hanh vi cu.
- Trap gap khi build (da xu ly, ghi lai de lan sau khoi vap): check-3d (a) cam
  BAT KY chuoi `@keyframes` nao trong toan bo index.html (ke ca trong comment),
  nen ban dau them keyframes cho dau "!" + bottom sheet lam check-3d fail 1 muc.
  Da doi ca hai sang dang khong dung keyframes: "!" nhap nhay bang interval JS
  (600ms), bottom sheet truot bang transition + class `.in`. Chu y: dung bao gio
  viet chu `@keyframes` trong comment o index.html.
- Vong tron tren dat: trien khai that bang ring mesh (khong dung fallback), nhung
  chua thay bang mat tren nuoc (Thap Rua dung tren dao giua ho - vong nam o muc
  y = 0.03 tren mat nuoc). Can nhin that o Ho Guom.
- Dau "!" chieu tu anchor cao 1.7: o landmark co flap cao (Nha Tho Lon 1.49) thi
  dau "!" nam sat dinh thap; o landmark thap thi dau "!" troi cao hon dinh kha
  nhieu. Can nhin that.
- The bottom sheet khi mo che minimap + vung bam di bo o day man hinh (chi trong
  luc doc). Bam ra ngoai the dong the va di bo tiep binh thuong.
- Khong push, khong commit. Build nam o `dist/` local (bundle moi
  `index-DWqoL7lf.js`); day len Pages la viec cua buoc deploy sau khi user duyet.

## Vong sua sau verify (2026-11-21, fixer)

- Sua theo bao cao verifier `docs/phase-3c-verification.md` (GO, 0 blocker, 6 nit).
  Chi sua 5 file: `src/game/landmark-history.js`, `src/game/landmarks.js`,
  `index.html`, `tools/check-2c.mjs`, `tools/check-2d.mjs`. Khong push, khong commit.
  Lich su day du / fun fact day du / nguon KHONG doi 1 chu (check-2b van pass),
  storage van `hanoi:v1:`, discovery radius van 1. Bang 3C-04 / 3C-10 o tren la so
  truoc khi sua; so moi la so o muc nay.

### NIT-1 - cat 2 tu o fun ngan VI cua 8 the dang o 10.0 giay

- Ca 8 the gio dung 38 tu lop (a) VI, uoc tinh 9.5 giay o 240 tu/phut (truoc: 40 tu,
  10.0 giay). Ho Hoan Kiem va Cau Long Bien khong cat (da duoi moc, 39 tu, 9.8 giay).
- Den Ngoc Son (14 -> 12 tu): "Trong den co hai tieu ban rua kho lo, 1967 va 2016."
- Chua Tran Quoc (14 -> 11 tu): "Bo de san chua la qua Tong thong An Do 1959." (xem them NIT-3)
- Pho Co Ha Noi (14 -> 12 tu): "Con so 36 chua khop ban do; Hang Bac van ban bac."
- Lang Chu tich Ho Chi Minh (14 -> 12 tu): "Di chuc Bac dan hoa tang, Lang duoc xay de dan vieng."
- Van Mieu - Quoc Tu Giam (12 -> 10 tu): "Bia tien si tren lung rua da, dau nam 1484."
- Chua Mot Cot (14 -> 12 tu): "Nam 2012 chua duoc cong nhan kien truc doc dao chau A."
- Nha Tho Lon Ha Noi (13 -> 11 tu): "Nha tho tren nen chua the ky 11, Nha Tho Lon."
- Nha Hat Lon Ha Noi (14 -> 12 tu): "Tho dong hang chuc nghin coc tre lam mong truoc khi xay."
- Uoc tinh doc lop (a) VI moi (240 tu/phut, dem lai bang script rieng + check-3c):
  8 the tren 9.5 giay; Ho Hoan Kiem 9.8 giay; Ho Tay 9.5 giay (do NIT-2 them 1 tu);
  Cau Long Bien 9.8 giay. EN cao nhat 9.5 giay (Ho Hoan Kiem). Tat ca tom tat van
  <= 20 tu, fun ngan van <= 15 tu.

### NIT-2 - fun ngan Ho Tay ghi nham cay bo de la cua ho

- VI cu: "Cay bo de san chua moc tu canh chiet o Bodh Gaya, An Do." (14 tu)
  VI moi: "Cay bo de chua Tran Quoc moc tu canh chiet o Bodh Gaya, An Do." (15 tu, dung gioi han 15)
- EN cu: "Its bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya." (14 tu)
  EN moi: "Tran Quoc's bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya." (15 tu)
- Can cu: fun day du cua Ho Tay noi ro "cay bo de trong san chua Tran Quoc"
  (`docs/landmark-history.md`, lich su / fun day du khong doi).

### NIT-3 - tom tat VI Chua Tran Quoc noi sai vi tri dao

- Cu: "Chua co nhat Ha Noi, dung tu the ky 6, doi ra dao giua ho Tay nam 1615." (18 tu)
  Moi: "Chua co nhat Ha Noi, dung the ky 6, doi ra dao dau dong nam ho Tay nam 1615." (19 tu, dung gioi han 20)
- Can cu: lich su verify "mot dao nho o dau dong nam ho Tay". Ban EN khong doi (khong mac loi).

### NIT-4 - toast co the nam sau the tren desktop

- `index.html`: `#lm-toast` z-index 6 -> 8 (cao hon the z-index 7), van
  `pointer-events: none`, van bottom 62vh khi the mo (`body.card-open`).

### NIT-5 - keo di bo khong dong the nua

- `landmarks.js`: `pointerdown` tren canvas chi ghi lai diem bat dau, khong dong the
  nua. Chi TAP that (< 10px va < 400ms) moi quyet dinh o `pointerup`: tap trung
  landmark thi mo the (va huy di bo), tap vao cho trong thi dong the dang mo.
  Keo (drag) chi di bo, the van mo.

### NIT-6 - KHONG sua

- Bam landmark da kham pha tu xa van mo the: do la hanh vi tap-to-open theo spec
  3C-01 ("bam vao landmark tren man hinh"), khong phai loi. Giu nguyen.

### Cap nhat check-2c / check-2d theo hanh vi 3C moi

- check-2c: `DOM_IDS` doi sang id DOM moi cua the 3C (`lm-info-title`,
  `lm-info-summary`, `lm-info-fun-h`, `lm-info-fun-short`, `lm-info-more`,
  `lm-info-details`, `lm-info-hist-h`, `lm-info-hist`, `lm-info-fun-full-h`,
  `lm-info-fun-full`, `lm-info-tabs`, `lm-info-lang`, `lm-info-lang-vi`,
  `lm-info-lang-en`, `lm-bang`, `atlas`), bo id cu (`lm-info-title-vi/en`,
  `lm-info-hist-vi/en`, `lm-info-fun-vi/en`, `lm-info-hist-h-vi/en`,
  `lm-info-fun-h-vi/en`). Assertion moi: toast EN "Arrived at Hoan Kiem Lake" +
  "Tap to view"; discovery KHONG mo the (`infoOpen()` null); mo the bang `openInfo`
  roi moi assert tieu de 1 ngon ngu, lop (a) summary/fun ngan EN, lop (b) an mac dinh,
  nguon "Source: ..."; toggle ve VI doi toast thanh "Da den Ho Hoan Kiem" va the
  thanh "Ho Hoan Kiem" + nguon "Nguon: ...".
- check-2d: `DOM_IDS` doi nhu tren. Assertion moi muc (f): discovery KHONG mo the;
  `openInfo` roi assert tieu de EDGE "EDGE TEN", the mo, summary fallback = dong lich
  su EDGE dau tien ("edge dong"), fun ngan fallback = fun day du EDGE ("edge vui");
  bam "Doc them" roi assert dong lich su EDGE trong `#lm-info-hist`; nguon
  "Nguon: example.com". Khong override: discovery KHONG mo the, `openInfo` roi moi
  assert ten goc "Ho Hoan Kiem".
- Khong co assertion nao khong dam sua: moi FAIL/CRASH verifier liet ke deu la hanh vi
  cu da bi spec 3C xoa, da cap nhat het; cac check khac giu nguyen va van PASS.

### Ket qua check moi (chay sau khi sua, 2026-11-21)

- `npm run build`: PASS. Bundle `dist/assets/index-DWLUT19v.js`, 1,132.47 kB
  (gzip 342.30 kB), `dist/index.html` 11.37 kB. (Truoc vong sua: `index-DWqoL7lf.js`,
  1,132.52 kB.)
- `npm run check:hanoi`: ALL CHECKS PASSED.
- `node tools/check-3c.mjs`: ALL 3C CHECKS PASSED (206 PASS, 0 FAIL). Uoc tinh doc
  lop (a) VI cao nhat 9.8 giay (Ho Hoan Kiem, Cau Long Bien), 8 the da cat dung 9.5 giay.
- `node tools/check-2c.mjs`: ALL 2C CHECKS PASSED (91 PASS, 0 FAIL).
- `node tools/check-2d.mjs`: ALL 2D CHECKS PASSED (144 PASS, 0 FAIL).
- `node tools/check-2b.mjs`: ALL 2B CHECKS PASSED.
- `node tools/check-3a.mjs`: 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED.
- `node tools/check-3b.mjs`: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED.
- `node tools/check-3d.mjs`: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED.
- `node tools/check-basic.mjs`: ALL BASIC CHECKS PASSED.
- `node --check`: `landmark-history.js`, `landmarks.js`, `check-2c.mjs`,
  `check-2d.mjs`: tat ca OK.
- Khong co dau gach dai trong 5 file doi. `index.html`: 0 chuoi `@keyframes`
  (ke ca comment). Khong push, khong commit.
