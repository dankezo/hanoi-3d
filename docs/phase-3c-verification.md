# Hanoi 3D - Phase 3C verification (the info redesign)

- Verifier doc lap, 2026-11-21. Chi doc, chay test, viet bao cao. KHONG sua bat ky file game nao.
- Spec duy nhat: `docs/phase-3-spec.md` muc 2.3 (3C-01..3C-10), muc 3 phase 3C, muc 4 tieu chi 3C, muc 6 trap.
- Manifest cua fixer: `docs/phase-3c-manifest.md` (chi doc de biet fixer tuyen bo gi, moi ket luan duoi day deu do verifier tu kiem lai).
- Quyet dinh Q3/Q4: the chi mo khi BAM, the chi hien 1 NGON NGU.
- Quy tac: chi dung dau gach ngan "-" trong moi file.

## Ket luan: GO

- Phase 3C dat GO. Code the info dung spec 3C-01..3C-09 (bang duoi day), 3C-10 dat theo uoc tinh 240 tu/phut nhung bien do 0 o 8 the VI (xem NIT-1).
- GO KHONG phu thuoc vao viec cap nhat check-2c/check-2d: hanh vi 3C da duoc verify doc lap bang check-3c (do chinh verifier chay, 206 PASS) + 24 test DOM rieng cua verifier + dem tu doc lap. Check-2c/2d do/crash chi vi chung assert hanh vi cu va DOM cu da bi spec 3C xoa (phan 4 duoi day chung minh tung muc, khong co regression that nao).
- Nhung check-2c/2d hien do/crash nen PHAI cap nhat truoc khi dung chung lam cong hoi quy cho phase sau. Danh sach assertion can cap nhat o phan 4.
- Khong co blocker. 6 nit o phan 6, trong do NIT-2 va NIT-3 la loi noi dung nho trong tom tat (nen sua truoc khi user doc that), NIT-1 la rui ro 3C-10.

## 1. Bang PASS/FAIL tung muc 3C-01..3C-10

| Muc | Ket qua | Bang chung (verifier tu doc code + tu chay test) |
|---|---|---|
| 3C-01 | PASS | `discover()` trong `src/game/landmarks.js` khong goi `showInfo` (grep: 0 lan goi trong ham discover; chi danh dau visited, toast ngan, emit `game:landmark`). Toast moi: tieu de `Da den {name}` + dong phu `Bam de xem` (EN: `Arrived at {name}` / `Tap to view`), 1 ngon ngu. Dau "!" la `#lm-bang` (index.html:244), chieu tu anchor cao 1.7 (`BANG_HEIGHT = 1.7`) qua camera moi frame (`projectBang`), an khi anchor sau camera (`projV.z >= 1`) hoac ra khoi ban kinh 1, nhap nhay bang interval JS 600ms doi opacity 1 / 0.45 (khong keyframes). Bam "!" mo dung the (`bangEl` click -> `showInfo(bangDef)`). Bam landmark: listener `pointerdown`/`pointerup` rieng tren canvas `#atlas`, tap chi tinh khi < 10px VA < 400ms (`TAP_MAX_PX = 10`, `TAP_MAX_MS = 400`), raycast xuong mat phang y = 0 doi ra o, mo the neu o trong ban kinh 1 cua anchor, goi `controls.clearTarget()` huy di bo. Check-3c (verifier chay): tap mo dung the + huy di bo 1 lan, drag 50px khong mo the, checklist mo lai. Test DOM rieng cua verifier (24 PASS): bam "!" mo the Cau Long Bien, item checklist chua kham pha khong lam gi. |
| 3C-02 | PASS | Vong that bang THREE.js: `new THREE.RingGeometry(1.85, 2.0, 48)` xoay ngang, mau `#b9603f`, opacity 0.35, y = 0.03, 1 mesh duy nhat doi vi tri theo landmark gan nhat. Ban kinh ngoai 2.0 world unit = dung 1 tile (`TILE_SIZE` = 2). Hien khi trong ban kinh 1 (`refreshNear`), bien mat khi ra khoi vung. Check-3c: ring hien o (0,0), tat o (15,15). Khong hien so ban kinh. |
| 3C-03 | PASS | The chi render ngon ngu dang chon: `showInfo` lay ten/tom tat/fun Lich su/fun day du/nguon theo `lang.lang` (VI mac dinh). Markup cu xep chong (`lm-info-title-vi/en`, `lm-info-hist-vi/en`, `lm-info-fun-vi/en`) da xoa khoi index.html (grep: 0 ket qua). Toggle VI/EN TRONG the (`#lm-info-lang`) goi `lang.toggle()` -> re-render the dang mo ngay, giu trang thai mo rong (`showInfo(infoOpen, false)`). Check-3c + test DOM rieng: toggle trong the doi ngay, the van mo, trang thai mo rong con nguyen. |
| 3C-04 | PASS | The co 3 lop dung spec. (a) mac dinh: ten lon + 1 cau tom tat + 1 fun fact ngan (`#lm-info-summary`, `#lm-info-fun-short`). (b) nut `#lm-info-more` ("Doc them" / "Thu gon") mo them 3 dong lich su (`#lm-info-hist`, du 3 dong) + fun fact day du + link nguon cuoi (`#lm-info-src`, dang `Nguon: <hostname>` / `Source: <hostname>`). Chi them 4 truong moi (`summaryVI/EN`, `funShortVI/EN`) vao `landmark-history.js`; lich su/fun day du/nguon khong doi 1 chu (kiem lai doc lap phan 3: 99/99 chuoi co mat nguyen van trong `docs/landmark-history.md`; check-2b do verifier chay: PASS). Dem tu doc lap (phan 2): 22 tom tat 13-19 tu (gioi han 20), 22 fun fact ngan 11-14 tu (gioi han 15). Edge override khong co truong moi: fallback tom tat = dong lich su dau tien, fun ngan = fun day du (test DOM rieng: summary `edge dong`, fun ngan `edge vui`). |
| 3C-05 | PASS | CSS trong index.html, verifier doc truc tiep: tieu de `#lm-info-title` 20px bold; tom tat `#lm-info-summary` 16px/1.6; fun fact ngan `#lm-info-fun-short` 16px/1.6; nut (`#lm-info-more`, tab, toggle trong the, X) 15px; lich su `#lm-info-body ul` 15px/1.6; fun day du `#lm-info-fun-full` 15px/1.6; heading muc `#lm-info-body h3` 12px. The rong toi da 360px (`max-width: 360px`), cao toi da 60vh, noi dung cuon trong the (`#lm-info-body` co `max-height: calc(60vh - 48px)` + `overflow-y: auto`). |
| 3C-06 | PASS | `update()` khong goi `hideInfo` (grep trong ham update: 0 lan; chi `refreshNear`, `projectBang`, `drawMinimap`). The chi dong theo 3 cach: nut X (`#lm-info-x` click -> `hideInfo`), bam ra ngoai the tren canvas (`pointerdown` tren canvas -> `hideInfo`, roi cu bam do van di bo nhu thuong), mo the landmark khac (`showInfo` khac ghi de `infoOpen`). Check-3c: di xa toi (15,15) the van mo; bam goc man hinh trong dong the; X dong. `settle()` (chup anh / reset) van dong the nhu cu - dung quy tac cu, khong phai tu dong khi dang doc. |
| 3C-07 | PASS | Ca hai cach cung lam: toast ngan chi con 2 dong (ten + "Bam de xem"), VA khi the mo thi `body.card-open #lm-toast { bottom: 62vh }`, dong the tro ve 11vh, co transition 0.35s cho bottom. Check-3c: body co class `card-open` khi the mo, het class khi dong. Luu y nho o NIT-4 (desktop). |
| 3C-08 | PASS | `@media (max-width: 500px)`: the o left 8px / right 8px / bottom 8px (rong = 100vw - 16px), `border-radius: 12px 12px 3px 3px` (goc tren 12px), `transition: transform 0.25s ease-out, opacity 0.25s ease-out` (250ms, trong khoang 200-300ms), tay keo `#lm-info-grip` 44x4px hien chi o mobile. Truot chay bang transition + class `.in` them o frame ke tiep qua `requestAnimationFrame` (fallback them ngay neu khong co rAF) - KHONG dung keyframes (kiem tra phan 5). Desktop giu card giua man hinh (bottom 21vh, `translateX(-50%)`). |
| 3C-09 | PASS | `nearby()` = cac landmark DA kham pha trong ban kinh 1 cua o hien tai, theo thu tu checklist. Neu >= 2 thi hang tab `#lm-info-tabs` hien (1 nut moi landmark, nut dang xem co class `on`); neu 1 thi an (`hidden`). Bam tab doi the sang landmark do, ve lop (a). Check-3c (verifier chay): dung o (6,-1) gap Den Ngoc Son + Nha Tho Lon, `nearby()` = `["ngocson", "cathedral"]`, 2 tab, bam tab 2 doi sang Nha Tho Lon Ha Noi. |
| 3C-10 | PASS (co rui ro) | Uoc tinh doc lop (a) o 240 tu/phut do verifier dem doc lap (phan 2): ca 22 the <= 10.0 giay, EN cao nhat 9.5 giay. NHUNG 8 the VI dung o 10.0 giay (bien do 0). Doc that tren dien thoai 390px CHUA lam (viec cua user / may user). Xem NIT-1. |

## 2. Dem tu + uoc tinh doc doc lap (khong dung so cua fixer)

- Cach dem cua verifier (script rieng `/tmp/v-words.mjs`, khong dung check-3c): tach theo khoang trang, dem ca token "-" trong ten "Van Mieu - Quoc Tu Giam".
- Cong thuc doc lop (a) nhu hien thi: ten + tom tat + heading ("Dieu thu vi" 3 tu / "Fun fact" 2 tu) + fun fact ngan + nut ("Doc them" 2 tu / "Read more" 2 tu), o 240 tu/phut (1 tu = 0.25 giay).
- Cot "chat" la cong thuc chat hon: chi ten + tom tat + fun fact ngan (khong tinh heading va nut), de thay phan nao cua 10 giay la chu that va phan nao la nhan.
- Ket qua khop 100% voi bang cua fixer (ca 44 so tu + ca 22 uoc tinh), nen bang cua fixer duoc xac nhan, khong chi tin mu.

| The | Tom tat VI | Tom tat EN | Fun ngan VI | Fun ngan EN | Doc hien VI (s) | Doc hien EN (s) | Doc chat VI (s) | Doc chat EN (s) |
|---|---|---|---|---|---|---|---|---|
| Ho Hoan Kiem | 19 | 17 | 12 | 14 | 9.8 | 9.5 | 8.5 | 8.5 |
| Den Ngoc Son | 18 | 16 | 14 | 11 | 10.0 | 8.5 | 8.8 | 7.5 |
| Ho Tay | 16 | 15 | 14 | 14 | 9.3 | 8.8 | 8.0 | 7.8 |
| Chua Tran Quoc | 18 | 15 | 14 | 12 | 10.0 | 8.5 | 8.8 | 7.5 |
| Pho Co Ha Noi | 17 | 16 | 14 | 12 | 10.0 | 8.5 | 8.8 | 7.5 |
| Lang Chu tich Ho Chi Minh | 15 | 15 | 14 | 13 | 10.0 | 9.0 | 8.8 | 8.0 |
| Van Mieu - Quoc Tu Giam | 17 | 13 | 12 | 13 | 10.0 | 8.3 | 8.8 | 7.3 |
| Chua Mot Cot | 18 | 15 | 14 | 11 | 10.0 | 8.3 | 8.8 | 7.3 |
| Nha Tho Lon Ha Noi | 17 | 14 | 13 | 13 | 10.0 | 8.5 | 8.8 | 7.5 |
| Nha Hat Lon Ha Noi | 16 | 16 | 14 | 12 | 10.0 | 8.8 | 8.8 | 7.8 |
| Cau Long Bien | 18 | 17 | 13 | 13 | 9.8 | 9.3 | 8.5 | 8.3 |

- Gioi han: tom tat <= 20 tu (cao nhat 19), fun fact ngan <= 15 tu (cao nhat 14). Ca 44 chuoi dat.
- Doc hien: cao nhat VI 10.0 giay (8 the dung moc), cao nhat EN 9.5 giay. Doc chat: cao nhat VI 8.8 giay, EN 8.5 giay.
- Danh gia rui ro 3C-10: 8 the VI dung o 10.0 giay chi nho cong thuc uoc tinh. Neu toc do doc that thap hon 240 tu/phut thi vuot moc ngay: o 200 tu/phut, 40 tu = 12.0 giay; o 180 tu/phut = 13.3 giay. Nguoi doc tren dien thoai thuong cham hon doc tham tren giay. De co bien do an toan, can cat them khoang 2 tu o fun fact ngan VI cua 8 the dang o 10.0 giay (fun ngan hien 12-14 tu, con du cho cat xuong 12 tu) hoac cat tom tat. Neu khong cat, 3C-10 se do user do that quyet dinh - va kha nang vuot 10 giay la co that. Xem NIT-1.

## 3. Kiem noi dung tom tat (22 + 22 chuoi)

- Phuong phap: doc tung cau tom tat va fun fact ngan, doi chieu voi 3 dong lich su + fun fact day du da verify cua cung landmark, cung ngon ngu. Them mot lan quet may: moi so / nam trong 44 chuoi ngan phai xuat hien trong lich su / fun day du cua landmark do (quet chuan hoa dau cau - xem ghi chu duoi).
- Ket qua so lieu: 0 so lieu / nam bi dat ra. Hai token bi quet may danh dau luc dau ("2016" o fun ngan VI Ho Hoan Kiem, "1945" o tom tat VI Nha Hat Lon) deu la manh cua ngay day du da verify ("19/1/2016", "19/8/1945") - khong phai bi dat.
- Ket qua nghia: 20/22 tom tat va 21/22 fun fact ngan trung thanh voi lich su, khong them su kien moi, khong doi nghia. 2 ngoai le nho (nit, khong phai bi dat so lieu):
  - NIT-2 - Fun fact ngan Ho Tay: "Cay bo de san chua moc tu canh chiet o Bodh Gaya, An Do." / "Its bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya." Cay bo de nay la cua chua Tran Quoc (fun day du cua Ho Tay noi ro "cay bo de trong san chua Tran Quoc"), khong phai cua ho. Doc rieng the Ho Tay se hieu nham la ho co cay bo de. De xuat: "Cay bo de o chua Tran Quoc moc tu canh chiet o Bodh Gaya, An Do." / "Tran Quoc's bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya." (can dem lai tu, van trong gioi han).
  - NIT-3 - Tom tat VI Chua Tran Quoc: "Chua co nhat Ha Noi, dung tu the ky 6, doi ra dao giua ho Tay nam 1615." Lich su verify noi chua doi ra "mot dao nho o dau dong nam ho Tay" (dau dong nam), khong phai "giua ho". Ban EN ("moved onto West Lake in 1615") khong mac loi nay. De xuat: "Chua co nhat Ha Noi, dung tu the ky 6, doi ra dao o dau dong nam ho Tay nam 1615." (hien 18 tu, sua xong can dem lai, van <= 20).
- Tieng Viet khong dau: `landmark-history.js` pure ASCII (verifier grep: 0 ky tu non-ASCII trong ca 3 file JS cua 3C). Ca 22 chuoi VI moi deu khong dau. Ten hien thi tren the lay tu `landmark-history.js` (vd "Ho Hoan Kiem", "Lang Chu tich Ho Chi Minh") - khong dau.
- Lich su / fun day du / nguon khong doi: quet doc lap cua verifier (script rieng `/tmp/v-doc.mjs`): ca 66 dong lich su + 22 fun fact day du + 11 link nguon (tong 99 chuoi) deu co mat nguyen van trong `docs/landmark-history.md` (99/99). Check-2b do verifier chay cung PASS (so khop tung chu voi doc). Khong co co so git de diff (file chua commit), nhung doi chieu doc-vs-code nay la bang chung doc lap.

## 4. Phan quyet ve check-2c / check-2d FAIL + CRASH

- Ket luan: ca hai file chi fail vi assert hanh vi CU ma spec 3C xoa co chu dich (tu mo the khi discovery, toast 2 ngon ngu, the 2 ngon ngu xep chong) va vi fake-DOM cua chung dung id DOM CU khong con ton tai trong index.html moi. KHONG co regression that nao.
- Bang chung:
  - Check-2c do verifier chay: exit 1, dung 4 FAIL, roi crash o dong 319. Ca 4 FAIL deu nam trong khoi fake-DOM cuoi file; cac muc (a)-(h), dict, banned host, boot deu PASS (khong co FAIL nao khac trong log).
  - Check-2d do verifier chay: exit 1, dung 1 FAIL, roi crash o dong 428. Tat ca cac muc (a)-(e), (f) phan dau, (g) deu PASS.
  - Test DOM rieng cua verifier (24 PASS, fake DOM moi dung id 3C, landmark khac + o khac so voi check-3c): toggle doi ngon ngu toast dang mo (`Da den Cau Long Bien` <-> `Arrived at Long Bien Bridge`), toggle doi ngon ngu the dang mo, bam "!" mo the, item checklist chua kham pha khong lam gi, edge override hien ten EDGE + dong lich su EDGE + fallback tom tat/fun ngan + nhan nguon `Nguon: example.com`, khong override hien ten goc. Tuc la moi hanh vi ma check-2c/2d khong danh gia duoc nua (vi crash) deu van chay dung duoi DOM moi.

### 4.1 Check-2c - assertion nao can cap nhat (file `tools/check-2c.mjs`)

- Dong 315 `dom: toast is EN after discovery` - FAIL. Cu: doi toast `Discovered: Hoan Kiem Lake`. Moi (3C-01): toast la `Arrived at Hoan Kiem Lake`. Cap nhat chuoi ky vong.
- Dong 316 `dom: toast sub is the VI name` - FAIL. Cu: dong phu la ten VI `Ho Hoan Kiem`. Moi (3C-01): dong phu la `Tap to view`. Cap nhat chuoi ky vong.
- Dong 317 `dom: info card opens on discovery` - FAIL. Cu: discovery tu mo the. Moi (3C-01): discovery KHONG mo the. Dao nguoc assertion: the khong co class `show`, `infoOpen()` null.
- Dong 318 `dom: info title EN first` - FAIL. Cu: doc `lm-info-title-vi/en` (id cu, khong con trong index.html). Moi (3C-03): the chi co 1 tieu de `#lm-info-title`. Viet lai: mo the truoc (bam checklist hoac tap), roi assert tieu de = `Hoan Kiem Lake`.
- Dong 319 `dom: info first section is EN History` - CRASH (`Cannot read properties of undefined (reading 'textContent')`). Cu: doc `lm-info-body.children[0]` (the cu xep cac section trong body). Moi: body khong co section con (chi co `#lm-info-summary`, `#lm-info-fun-short`, `#lm-info-more`, `#lm-info-details` co dinh). Viet lai: assert lop (a) - summary = `summaryEN`, fun ngan = `funShortEN`, details an.
- Dong 320 `dom: info source label is EN` - chua chay toi (crash o 319 chan). Cu: doc `#lm-info-src` (id nay van ton tai). Can mo the truoc roi moi assert `Source: ...` (vi the khong tu mo nua nen luc discovery src con trong).
- Dong 322 `dom: toggle back to VI re-words the open toast` - chua chay toi. Cu: doi `Da kham pha: Ho Hoan Kiem`. Moi: `Da den Ho Hoan Kiem`. Cap nhat chuoi (hanh vi re-word toast khi toggle van dung - verifier da kiem rieng).
- Dong 323 `dom: toggle back to VI re-orders the open info card` - chua chay toi, se crash nhu dong 319. Cu: doc `lm-info-body.children[0]` = `Lich su`. Moi: khong con "sap xep lai" 2 ngon ngu; viet lai: assert `#lm-info-title` = `Ho Hoan Kiem` sau khi toggle ve VI.
- Dong 324 `dom: info title VI first after toggle back` - chua chay toi. Cu: doc id cu. Viet lai: assert `#lm-info-title` = `Ho Hoan Kiem`.
- Dong 325 `dom: info source label is VI after toggle back` - chua chay toi. Id `#lm-info-src` van ton tai; can mo the truoc roi assert `Nguon: ...`.
- Khoi fake-DOM cua check-2c (`DOM_IDS`) can them id moi: `lm-info-title`, `lm-info-summary`, `lm-info-fun-h`, `lm-info-fun-short`, `lm-info-more`, `lm-info-details`, `lm-info-hist-h`, `lm-info-hist`, `lm-info-fun-full-h`, `lm-info-fun-full`, `lm-info-tabs`, `lm-info-lang`, `lm-info-lang-vi`, `lm-info-lang-en`, `lm-bang`, `atlas`; bo id cu `lm-info-title-vi/en`, `lm-info-hist-vi/en`, `lm-info-fun-vi/en`, `lm-info-hist-h-vi/en`, `lm-info-fun-h-vi/en` (hoac giu de assert chung khong ton tai). Cac muc (a)-(h) va boot khong can doi.

### 4.2 Check-2d - assertion nao can cap nhat (file `tools/check-2d.mjs`)

- Dong 427 `(f) historyInfo override: info card shows the EDGE name, not bundled` - FAIL. Cu: doc `lm-info-title-vi/en`. Moi: 1 tieu de `#lm-info-title`. Viet lai: sau `openInfo('hoankiem')`, assert tieu de = `EDGE TEN` (VI mac dinh). Verifier da kiem rieng: dung.
- Dong 428 `(f) historyInfo override: info card shows the EDGE history line` - CRASH (`Cannot read properties of undefined (reading 'textContent')`). Cu: doc `lm-info-hist-vi.children[0]` (id cu, khong co con). Moi: dong lich su nam trong `#lm-info-hist` ben trong `#lm-info-details` (an mac dinh). Viet lai: bam `#lm-info-more` truoc, roi assert `#lm-info-hist.children[0]` = `edge dong`. Them assert fallback: summary = dong lich su dau tien khi edge khong co truong summary.
- Dong 429 `(f) historyInfo override: info card opens` - chua chay toi. Se PASS khi viet lai (class `show` van duoc set), nhung phai chay sau `openInfo` chu khong phai sau `debugDiscover` (discovery khong mo the nua).
- Dong 442 `(f) no override: info card shows the bundled name` - chua chay toi. Cu: doc `lm-info-title-vi`. Viet lai: goi `openInfo('hoankiem')` truoc, roi assert `#lm-info-title` = `Ho Hoan Kiem`.
- Khoi fake-DOM cua check-2d (`DOM_IDS`) can them id moi nhu muc 4.1. Cac muc (a)-(e), (f) phan dau, (g) khong can doi.

## 5. So do build / check that do verifier tu chay

- `npm run build`: PASS. Bundle `dist/assets/index-DWqoL7lf.js`, 1,132.52 kB (gzip 342.30 kB), `dist/index.html` 11.37 kB, build trong 882ms. Khop hash + so byte fixer bao. Muc tang +8.89 kB so baseline `index-C5CARRqL.js` 1,123.63 kB la so cua fixer (verifier khong co baseline de tu build lai, chi xac nhan bundle moi).
- `npm run check:hanoi`: ALL CHECKS PASSED (verifier chay).
- `node tools/check-3c.mjs`: ALL 3C CHECKS PASSED (206 PASS, 0 FAIL) (verifier chay; dong uoc tinh doc khop bang phan 2).
- `node tools/check-2b.mjs`: ALL 2B CHECKS PASSED (verifier chay; lich su / fun / nguon khop doc, discovery ban kinh 1, store key `hanoi:v1:1`).
- `node tools/check-3a.mjs`: 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED (verifier chay).
- `node tools/check-3b.mjs`: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED (verifier chay).
- `node tools/check-3d.mjs`: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED (verifier chay).
- `node tools/check-basic.mjs`: ALL BASIC CHECKS PASSED (verifier chay).
- `node tools/check-2c.mjs`: exit 1. 4 FAIL (dong 315, 316, 317, 318) roi CRASH o dong 319: `TypeError: Cannot read properties of undefined (reading 'textContent')` tai `ids['lm-info-body'].children[0].textContent`. Xem phan 4.1.
- `node tools/check-2d.mjs`: exit 1. 1 FAIL (dong 427) roi CRASH o dong 428: `TypeError: Cannot read properties of undefined (reading 'textContent')` tai `ids['lm-info-hist-vi'].children[0].textContent`. Xem phan 4.2.
- `node --check`: `src/game/landmarks.js` OK, `src/game/landmark-history.js` OK, `tools/check-3c.mjs` OK.
- Test rieng cua verifier (khong dung test/so cua fixer): dem tu `/tmp/v-words.mjs` (khop 100% bang fixer), quet so lieu `/tmp/v-nums.mjs` (0 so bi dat sau khi chuan hoa), doi chieu doc `/tmp/v-doc.mjs` (99/99 chuoi nguyen van), test DOM `/tmp/v-dom.mjs` (24 PASS). File tam trong repo (`.v-dom-tmp.mjs`) da xoa sau khi chay; `git status` khong con dau vet.

## 6. Danh sach loi

- Blocker: khong co.
- NIT-1 (3C-10, rui ro chinh): 8 the VI uoc tinh dung 10.0 giay o 240 tu/phut, bien do 0. O 200 tu/phut se la 12.0 giay. De xuat: cat them khoang 2 tu o fun fact ngan VI cua 8 the do truoc khi user do that, hoac chap nhan de user do that quyet dinh.
- NIT-2 (noi dung): fun fact ngan Ho Tay ghi nham cay bo de la cua ho (that ra cua chua Tran Quoc). Xem phan 3.
- NIT-3 (noi dung): tom tat VI Chua Tran Quoc noi "dao giua ho Tay" trong khi su lieu la dao o dau dong nam ho. Xem phan 3.
- NIT-4 (desktop, nho): toast 62vh khi the mo - tren mobile bottom sheet (cao toi da 60vh) thi toast nam ngay tren mep sheet, dung y do; tren desktop the cao toi da 60vh tu day 21vh (mep tren toi 81vh) nen toast o 62vh co the nam sau the (z-index 6 < 7) khi the mo rong. Spec chi dinh 62vh nen day khong phai loi spec, chi ghi nhan.
- NIT-5 (hanh vi, theo chu spec): `pointerdown` tren canvas dong the ngay ca khi do la dau mot cu keo de di bo - nghia la bat cu lan nao bat dau keo di bo cung dong the. Khop "bam ra ngoai the" theo chu, ghi nhan de coordinator biet.
- NIT-6 (hanh vi, theo chu spec): bam vao landmark tren man hinh mo the cua landmark DA kham pha du traveller dang dung xa (raycast theo o duoc bam, khong theo vi tri traveller). Nam trong chu spec ("bam vao landmark tren man hinh"), ghi nhan.

## 7. Kiem tra khac (theo muc 5 + 7 cua nhiem vu)

- Trap check-3d: grep toan bo `index.html`: 0 chuoi `@keyframes` (ke ca comment). Co che thay the co that trong code: "!" nhap nhay bang `setInterval` 600ms doi opacity 1 / 0.45 trong `landmarks.js` (`startBangBlink` / `stopBangBlink`, dung timer khi hien, xoa khi an va o `dispose()`); bottom sheet truot bang `transition: transform 0.25s ease-out, opacity 0.25s ease-out` + class `.in` them qua `requestAnimationFrame` trong `showInfo`. Chuoi `@keyframes` duy nhat trong repo 3C nam trong chinh dong test cua check-3c (regex kiem tra), khong phai trong `index.html`.
- 0 dau gach dai: grep `[\u2013\u2014]` tren `src/game/landmarks.js`, `src/game/landmark-history.js`, `index.html`, `tools/check-3c.mjs`: 0 ket qua. `landmark-history.js` + `landmarks.js` pure ASCII. `index.html` chi co 1 dong non-ASCII co san tu truoc (hint div, ky tu `·`, khong phai 3C).
- Git / file la: repo hien chua commit bat ky file 3C nao (toan bo file dang untracked/modified, chi co 3 commit cu). File 3C deu la file da biet: `src/game/landmarks.js`, `src/game/landmark-history.js`, `index.html` (doi), `tools/check-3c.mjs`, `docs/phase-3c-manifest.md` (moi). Khong co file la nao khac; mtime cac file 3C deu 2026-11-21 08:51-08:54, khop buoi build cua fixer.
- Discovery radius van 1 (`const RADIUS = 1`, Chebyshev). Storage khong doi (`STORE_PREFIX = 'hanoi:v1:'`, check-2b xac nhan key `hanoi:v1:1`).
- Tab doi the ve lop (a): `showInfo(id)` khi bam tab dat lai `infoExpanded = false` - dung nhu manifest mo ta, khong phai loi.

## 8. Nhung gi KHONG the verify trong sandbox (viec cua may user sau)

- Doc 10 giay that lop (a) tren 390px: chua do that tung the bang dong ho. Uoc tinh 8.3-10.0 giay (phan 2) chi la uoc tinh; 8 the VI o dung moc 10.0 giay la rui ro that.
- Hinh dang dau "!" vang + vong tron dat nung tren mat nuoc o Thap Rua (vong o y = 0.03 tren mat nuoc, chua thay bang mat).
- Bottom sheet truot tu duoi len tren 390px that, tay keo, chu 20/16/15px doc co du lon khong, the co che nut di bo / minimap the nao khi mo.
- Dau "!" chieu tu anchor cao 1.7: o landmark thap thi "!" troi cao hon dinh kha nhieu; o landmark cao (Nha Tho Lon flap 1.49) thi "!" nam sat dinh. Can nhin that.
- Toast 62vh khi the mo tren man hinh that (co chong the khong, dac biet o desktop).
- Cam giac bam: tap < 10px / < 400ms tren man hinh cam ung that co de bam trung landmark khong, keo di bo co vo tinh mo the khong.

## Re-verify vong sua sau verify (2026-11-21, re-verifier doc lap)

- Re-verifier doc lap, KHONG sua bat ky file game nao. Chi doc code, chay test rieng, viet muc nay.
- Phuong phap: script dem tu rieng `/tmp/rv-words.mjs` (khong dung so cua fixer, khong dung check-3c), script doi chieu doc rieng `/tmp/rv-doc.mjs` (99 chuoi lich su / fun day du / nguon so voi `docs/landmark-history.md`), doc truc tiep logic pointerdown / pointerup + CSS z-index, doc tung assertion da viet lai trong check-2c / check-2d, chay tay toan bo build + 9 check + node --check.
- Ket luan: GO FINAL. Ca 5 nit da sua dung, check-2c / check-2d viet lai assert dung hanh vi moi va khong bi lam rong, toan bo so do fixer bao khop 100% voi so re-verifier tu chay.

### Bang PASS/FAIL tung nit NIT-1..NIT-5

| Nit | Ket qua | Bang chung (re-verifier tu dem / tu doc / tu chay) |
|---|---|---|
| NIT-1 | PASS | Script dem rieng: 8 the da cat deu dung 38 tu lop (a) VI = 9.5 giay o 240 tu/phut; khong con the VI nao o 10.0 giay; cao nhat VI 9.75 giay (Ho Hoan Kiem, Cau Long Bien, 39 tu), cao nhat EN 9.5 giay (Ho Hoan Kiem, 38 tu). Ho Tay 38 tu / 9.5 giay (tang 1 tu do NIT-2). Tom tat cao nhat 19 tu (gioi han 20), fun ngan cao nhat 15 tu (gioi han 15), 0 vuot gioi han. Bang day du o muc duoi. |
| NIT-2 | PASS | VI moi "Cay bo de chua Tran Quoc moc tu canh chiet o Bodh Gaya, An Do." - dem rieng 15 tu (dung gioi han 15); EN moi "Tran Quoc's bodhi tree grew from a cutting of the Bodhi tree at Bodh Gaya." - dem rieng 15 tu. Doi chieu doc: fun day du Ho Tay ghi ro "cay bo de trong san chua Tran Quoc" - cau moi gan dung chu, khong con hieu nham la cay cua ho. Khong them so lieu moi. |
| NIT-3 | PASS | VI moi "Chua co nhat Ha Noi, dung the ky 6, doi ra dao dau dong nam ho Tay nam 1615." - dem rieng 19 tu (khong phai 21 tu nhu de xuat goc cua verifier; fixer da rut them 2 tu ma van giu nghia), gioi han 20. Doi chieu doc: lich su verify "mot dao nho o dau dong nam ho Tay" - khop. Ban EN khong doi. |
| NIT-4 | PASS | `index.html`: `#lm-toast` z-index 8, `#lm-info.show` z-index 7, `#lm-bang` z-index 7. Toast cao hon the 1 bac, van `pointer-events: none`, van bottom 62vh khi the mo (`body.card-open`). Tren desktop the cao toi da 60vh tu day 21vh (mep tren toi 81vh) nen toast o 62vh nam trong khoang doc cua the nhung ve tren nho z-index. Chi kiem bang code, chua render that. |
| NIT-5 | PASS | `landmarks.js`: `onCanvasDown` chi ghi `{x, y, t, id}`, khong dong the. `onPointerUp`: neu `Math.hypot(dx, dy) >= 10` hoac `dt >= 400ms` thi return ngay - keo di bo khong dong the, khong mo the. Chi tap that (< 10px VA < 400ms) moi quyet dinh: `pickLandmark` raycast xuong mat phang y = 0, trung landmark da kham pha thi `showInfo` + `clearTarget` (huy di bo); tap vao cho trong thi `hideInfo` neu the dang mo. Tap landmark van mo the nhu truoc (check-3c: tap mo dung the + huy di bo PASS). |

### Bang dem tu doc lap (script rieng /tmp/rv-words.mjs, tach theo khoang trang, tinh ca token "-" trong ten)

| The | Tom tat VI | Fun ngan VI | Lop (a) VI (tu / giay) | Lop (a) EN (tu / giay) |
|---|---|---|---|---|
| Ho Hoan Kiem | 19 | 12 | 39 / 9.75 | 38 / 9.50 |
| Den Ngoc Son | 18 | 12 | 38 / 9.50 | 34 / 8.50 |
| Ho Tay | 16 | 15 | 38 / 9.50 | 36 / 9.00 |
| Chua Tran Quoc | 19 | 11 | 38 / 9.50 | 34 / 8.50 |
| Pho Co Ha Noi | 17 | 12 | 38 / 9.50 | 34 / 8.50 |
| Lang Chu tich Ho Chi Minh | 15 | 12 | 38 / 9.50 | 36 / 9.00 |
| Van Mieu - Quoc Tu Giam | 17 | 10 | 38 / 9.50 | 33 / 8.25 |
| Chua Mot Cot | 18 | 12 | 38 / 9.50 | 33 / 8.25 |
| Nha Tho Lon Ha Noi | 17 | 11 | 38 / 9.50 | 34 / 8.50 |
| Nha Hat Lon Ha Noi | 16 | 12 | 38 / 9.50 | 35 / 8.75 |
| Cau Long Bien | 18 | 13 | 39 / 9.75 | 37 / 9.25 |

- 8 the da cat (Den Ngoc Son, Chua Tran Quoc, Pho Co, Lang, Van Mieu, Chua Mot Cot, Nha Tho Lon, Nha Hat Lon) deu 38 tu / 9.5 giay VI. Ho Tay cung 38 tu / 9.5 giay sau khi sua NIT-2. Ho Hoan Kiem va Cau Long Bien khong cat, 39 tu / 9.75 giay, duoi 10.0 giay. Fixer bao 9.8 giay cho 2 the nay la lam tron 9.75 len 1 chu so thap phan, khop.
- Kiem nghia 8 fun ngan da cat (doi chieu fun day du + lich su cua tung landmark): tat ca trung thanh, khong doi nghia, khong them so lieu. Vi du: Van Mieu "dau nam 1484" khop "the first were erected in 1484"; Nha Tho Lon "tren nen chua the ky 11" khop "built on the ruins of an 11th-century Buddhist pagoda"; Nha Hat Lon "hang chuc nghin coc tre" khop "tens of thousands of bamboo stakes"; Lang "dan vieng" khop "so people could pay respects".

### Phan quyet ve check-2c / check-2d da viet lai: KHONG bi lam rong

- Check-2c: `DOM_IDS` moi dung id 3C, 0 id cu con sot (grep 0 ket qua cho `lm-info-title-vi/en`, `lm-info-hist-vi/en`, `lm-info-fun-vi/en`, `lm-info-hist-h-vi/en`, `lm-info-fun-h-vi/en`). Assertion moi assert dung hanh vi moi: toast EN "Arrived at Hoan Kiem Lake" + "Tap to view"; discovery KHONG mo the (`!class show` VA `infoOpen()` null); mo the bang `openInfo` roi moi assert tieu de 1 ngon ngu, lop (a) summary / fun ngan EN khop tung chu `LANDMARK_INFO`, lop (b) an mac dinh (`details.hidden === true`), nguon "Source: ..."; toggle ve VI doi toast "Da den Ho Hoan Kiem" + the "Ho Hoan Kiem" + nguon "Nguon: ...".
- Khong vacuous: toast `children[0]` / `children[1]` la 2 nut that do `showToast` tao (`landmarks.js:243-245` append `b` + `span` vao toastEl, dong 498-499 gan textContent) - assert so sanh chuoi that, doi gia tri sai se FAIL. Summary / fun ngan so sanh tung chu voi `LANDMARK_INFO`. `details.hidden` do `showInfo` gan tu `infoExpanded` (dong 389). Khong co assert luon dung, khong co assert DOM khong ton tai, khong co assert bi bo qua.
- Check-2d: assertion moi muc (f): discovery KHONG mo the; `openInfo` roi assert tieu de EDGE "EDGE TEN", the mo (class `show`), summary fallback = dong lich su EDGE dau tien ("edge dong"), fun ngan fallback = fun day du EDGE ("edge vui"); bam `#lm-info-more` roi assert `#lm-info-hist.children[0]` = "edge dong" (`fillList` that su them `li`, dong 391); nguon "Nguon: example.com" khop chinh xac. Khong override: discovery KHONG mo the, `openInfo` roi assert ten goc "Ho Hoan Kiem". Ca hai deu la hanh vi that cua code, khong phai stub.
- Ghi nhan nho (khong phai loi): check-2c co 2 assertion trung nhau ve tieu de VI sau khi toggle ve (dong 328 "re-words the open info card" va dong 329 "title is VI after toggle back", cung assert title === 'Ho Hoan Kiem'). Trung lap vo hai, khong anh huong do tin cay.

### So do build / check do re-verifier tu chay

- `npm run build`: PASS. Bundle `dist/assets/index-DWLUT19v.js`, 1,132.47 kB (gzip 342.30 kB), `dist/index.html` 11.37 kB, build 829ms. Khop dung hash + so byte fixer bao.
- `npm run check:hanoi`: ALL CHECKS PASSED.
- `node tools/check-3c.mjs`: ALL 3C CHECKS PASSED (206 PASS, 0 FAIL).
- `node tools/check-2c.mjs`: ALL 2C CHECKS PASSED (91 PASS, 0 FAIL).
- `node tools/check-2d.mjs`: ALL 2D CHECKS PASSED (144 PASS, 0 FAIL).
- `node tools/check-2b.mjs`: ALL 2B CHECKS PASSED (store key `hanoi:v1:1`).
- `node tools/check-3a.mjs`: 197 PASS, 0 FAIL - ALL 3A CHECKS PASSED.
- `node tools/check-3b.mjs`: 74 PASS, 0 FAIL - ALL 3B CHECKS PASSED.
- `node tools/check-3d.mjs`: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED.
- `node tools/check-basic.mjs`: ALL BASIC CHECKS PASSED.
- `node --check`: `landmark-history.js`, `landmarks.js`, `check-2c.mjs`, `check-2d.mjs`, `check-3c.mjs`: tat ca OK.
- 0 dau gach dai trong 6 file da cham (kiem bang python, U+2013 / U+2014): `landmark-history.js`, `landmarks.js`, `index.html`, `check-2c.mjs`, `check-2d.mjs`, `phase-3c-manifest.md` (ca `check-3c.mjs` cung 0). 0 chuoi `@keyframes` trong `index.html`. `index.html` chi co 1 dong non-ASCII co san tu truoc (hint div).
- Lich su / fun day du / nguon khong doi: script doi chieu rieng 99/99 chuoi co mat nguyen van trong `docs/landmark-history.md`; check-2b PASS.
- Storage `hanoi:v1:` khong doi (`STORE_PREFIX = 'hanoi:v1:'`, check-2b xac nhan key `hanoi:v1:1`). Discovery radius van 1 (`RADIUS = 1`, Chebyshev).

### Danh sach loi con lai

- Blocker: khong co.
- Luu y 1 (bien do mong, khong phai loi): cao nhat lop (a) VI 39 tu / 9.75 giay, chi cach moc 10.0 giay dung 1 tu (0.25 giay). O 240 tu/phut thi PASS, nhung neu doc that cham hon (200 tu/phut) thi 39 tu = 11.7 giay. Day la gioi han cua phuong phap uoc tinh theo spec, khong phai loi cua vong sua - vong sua da cat het muc co the ma khong lam mat nghia (fun ngan ngan nhat con 10 tu). Quyet dinh cuoi cung thuoc ve do that cua user tren 390px.
- Luu y 2: check-2c dong 328 / 329 trung lap (xem muc tren).
- Luu y 3: tap vao landmark CHUA kham pha khong dong the dang mo (code: chi `showInfo` neu `seen[hitId]`, khong co nhanh `hideInfo`). Khop manifest ("khong mo gi") va gan nhu khong xay ra khi armed (discovery chay truoc), ghi nhan de biet.

### Nhung gi van chua verify duoc trong sandbox (viec cua may user sau)

- Doc 10 giay that lop (a) tren 390px: chua do that tung the bang dong ho; uoc tinh chi la uoc tinh.
- Hinh dang dau "!" vang + vong tron dat nung tren mat nuoc o Thap Rua, bottom sheet truot that tren 390px, co chu 20 / 16 / 15px doc co du lon khong, toast 62vh co chong the khong tren man hinh that (dac biet desktop).
- Cam giac tap < 10px / < 400ms tren man hinh cam ung that: co de bam trung landmark khong, keo di bo co vo tinh mo / dong the khong.

### Ket luan: GO FINAL cho Phase 3C

- Ca 5 nit da sua dung va co bang chung doc lap. Check-2c / check-2d viet lai dung hanh vi moi, khong bi lam rong. Toan bo build + 9 check PASS do re-verifier tu chay, khop 100% so fixer bao. Khong con blocker. Buoc tiep theo la user check tren may that (doc that, nhin that) nhu muc 8 cua bao cao goc.
