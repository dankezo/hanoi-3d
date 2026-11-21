# Hanoi 3D - Phase 3F-quick manifest (chuot + minimap)

Fixer build, 2026-11-21. Chi 4 muc nhanh cua Phase 3F theo spec
docs/phase-3-spec.md muc 2.6 / muc 3 phase 3F / muc 4 tieu chi 3F.
Khong push, khong commit, khong upload binary, khong sua code ngoai
4 muc duoi day. Chi dung dau gach ngan "-" trong moi file.

## File doi (chi 2 file, chi trong pham vi 3F-quick)

- index.html - 3F-01, 3F-02, 3F-04
- src/game/landmarks.js - 3F-08 (ham drawMinimap)
- Khong doi: discovery, storage hanoi:v1:, tiles.glb, landmarks.js
  ngoai ham drawMinimap, khong them file moi, khong them dependency.
- Luu y: working tree truoc khi lam da co san noi dung phase 2 chua
  commit (HEAD 4ec66a3). Task nay chi sua 2 file tren, khong commit
  bat cu thu gi, khong dong vao phan phase 2.

## 3F-01 - Bo cursor: none toan cuc (lam dau tien)

- Lam gi: xoa `cursor: none` o ca 2 cho duy nhat co no trong repo.
  Con tro mac dinh cua trinh duyet hien lai tren toan bo game, ke ca
  vung di bo (canvas 3D) va moi phan tu UI.
- File: index.html dong 27-28
  - Dong 27: `html, body { cursor: none; ... }` thanh
    `html, body { margin: 0; height: 100%; overflow: hidden; background: #1c130d; }`
  - Dong 28: `canvas#atlas { cursor: none; ... }` thanh
    `canvas#atlas { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; outline: none; }`
- Kiem tra bang grep: khong con `cursor: none` trong index.html va src/.
- Day la fix 2 dong dung nhu spec.

## 3F-02 - Con tro pointer cho moi phan tu bam duoc

- Lam gi: moi phan tu bam duoc hien co deu co `cursor: pointer`.
  Vung di bo giu con tro mac dinh (khong an, khong doi hinh).
- File: index.html + src/game/landmarks.js
  - Nut toggle VI/EN (#lm-lang): DA CO SAN `cursor: pointer`,
    index.html dong 91. Khong sua.
  - Header checklist (#lm-head, nut collapse): THEM MOI
    `cursor: pointer`, index.html dong 54.
  - Item checklist (#lm-items li): THEM MOI `cursor: pointer`
    o CSS, index.html dong 62. Dong nay cung co san trong JS
    (`li.style.cursor = 'pointer'`, landmarks.js dong 174) tu
    step 4; CSS them de hanh vi khong phu thuoc vao JS.
  - Nut X the info (#lm-info-x): DA CO SAN `cursor: pointer`,
    index.html dong 120. Khong sua.
  - Header the info (#lm-info-head): DA CO SAN `cursor: pointer`,
    index.html dong 113. Khong sua.
- Tong ket: 2 cho them moi (header checklist, item checklist CSS),
  3 cho da co san tu truoc (toggle, X, header the info). Khong co
  phan tu bam duoc nao hien co con thieu pointer sau muc nay.
- Khong lam dau "!" (chi hien o phase 3C) va icon minimap
  (chi hien o phase icon sau) vi chung chua ton tai.

## 3F-04 - Minimap to hon: 132px thanh 168px

- Lam gi: tang kich thuoc minimap, giu goc duoi-phai, cach mep 12px.
  Moi o = 200/40 = 5px (truoc 160/40 = 4px). Ham drawMinimap tinh
  `s = W / MAP_CELLS` tu `mapEl.width` nen khong can sua JS cho
  muc nay; o tu to theo buffer moi.
- File: index.html
  - Dong 79: CSS `#lm-map` tu `width: 132px; height: 132px` thanh
    `width: 168px; height: 168px`. Vi tri giu nguyen
    `right: 12px; bottom: 12px`.
  - Dong 159: canvas tu `width="160" height="160"` thanh
    `width="200" height="200"`.
- Kiem tra bang grep: khong con `132px` hay `width="160"` /
  `height="160"` trong index.html, src/, tools/.
- So do layout 390px (tinh tu CSS, chua nhin tren may that):
  - Minimap chiem 168/390 = 43.1% chieu rong, mep trai o x = 210,
    mep phai x = 378, cach day x = 12.
  - Nut #fps-readout o goc duoi-trai (left 12px), khong cham
    minimap (minimap bat dau tu x = 210).
  - Checklist rong 200px o goc tren-trai (left 12px, het o x = 212),
    nut toggle VI/EN o goc tren-phai, khong chong nhau.
  - The info mo (bottom 21vh) va minimap: the bat dau tu cach day
    21vh, minimap cao 180px tinh tu day (168 + 12). Tren man hinh
    cao hon 857px thi khong cham nhau; tren man hinh thap hon
    857px thi the dang mo co the che phan tren cua minimap. Day la
    hinh hoc co san tu truoc (voi minimap 132px thi nguong la
    686px), muc nay chi lam rong cua so chong lap them. Khong sua
    vi tri the o day vi thuoc pham vi 3C. Can user check tren may
    that o chieu cao man hinh cua anh.

## 3F-08 - Dia so fallback tren minimap (phuong an du phong)

- Lam gi: thay cham tron r=3px bang dia giay r=6px + so thu tu theo
  checklist. So lay theo index trong danh sach landmark
  (`LANDMARKS[i]`, i + 1), KHONG hardcode 10. Khi phase 3B them
  landmark thu 11 Tran Quoc, dia tu thanh 1-11 ma khong can sua
  code ve. Cung 1 ham ve drawMinimap, chi doi glyph ben trong.
- File: src/game/landmarks.js, dong 339-357 (thay vong lap ve
  cham cu o cung vi tri)
  - Vong lap cu: `for (const def of LANDMARKS)` + `arc(x, y, 3, ...)`.
  - Vong lap moi: `for (let i = 0; i < LANDMARKS.length; i++)`,
    `arc(x, y, 6, ...)`, so ve bang
    `fillText(String(i + 1), x, y + 0.5)`, font
    `700 8px Georgia, serif`, can giua (`textAlign center`,
    `textBaseline middle`).
  - Da kham pha: dia to dac mau dat nung #b9603f (TERRA), so mau
    giay #efe0c2 (PAPER).
  - Chua kham pha: dia nen giay #efe0c2 + vien dat nung #b9603f
    day 1.5px, so mau dat nung #b9603f. Nen giay giup so doc duoc
    tren nen patchwork cua minimap; vien rong phan biet voi dia dac.
  - Thu tu so = thu tu checklist hien tai: 1 Hoan Kiem, 2 Ngoc Son,
    3 Ho Tay, 4 Pho Co, 5 Lang Chu Tich, 6 Van Mieu, 7 Chua Mot Cot,
    8 Nha Tho Lon, 9 Nha Hat Lon, 10 Cau Long Bien.
  - So 2 chu so ("10", sau nay "11") dung font 8px bold, rong
    khoang 9px, vua trong dia duong kinh 12px.
- Traveller pin GIU NGUYEN nhu cu (cham muc r=2.6 + vach huong
  dai 5px, vien giay 1px), chua doi kich thuoc. Doi pin thuoc
  phase icon sau (3F-06).

## Khong lam (theo dung pham vi task)

- 3F-03 con tro giay custom: bo qua, chi lam sau khi user duyet.
- 3F-05 icon silhouette giay custom 10 landmark: phase icon sau.
- 3F-06 icon phan biet da/kham pha + traveller to hon: phase icon sau.
- 3F-07 tap icon de locate + mui ten bac (N): phase icon sau.
- 3F-10 icon Tran Quoc rieng: cho Q2 chot landmark 11, phase icon sau.
- Khong doi logic discovery, khong doi storage hanoi:v1:, khong doi
  tiles.glb, khong them icon hay sprite nao.

## Verification (so that, chay local 2026-11-21)

- node --check src/game/landmarks.js: PASS (1/1).
- npm run build: PASS. 65 modules transformed. Bundle moi
  dist/assets/index-BjGQIBSB.js, 1,106,648 bytes (1,106.64 kB,
  gzip 335.07 kB). Baseline truoc 3F-quick la index-C0ja968t.js.
  dist/index.html 8,047 bytes.
- npm run check:hanoi: 161 PASS, 0 FAIL, ALL CHECKS PASSED
  (chay 2 lan, deu 161 PASS). Solver 95/96, 0 socket mismatch,
  1600 o resolve, 30 street cell dung nhu cu.
- Grep: 0 `cursor: none` trong index.html + src/; 0 `132px` /
  `width="160"` / `height="160"` trong index.html + src/ + tools/;
  0 dau gach dai (U+2013/U+2014) trong index.html va
  src/game/landmarks.js.
- Khong chay Impeccable detect / Hallmark sloplint (loi tool da
  biet, ghi trong WORKFLOW: detect hang, sloplint khong ton tai).

## Cach tu kiem tra bang mat tren trinh duyet

Mo bang tab an danh, link ?map=hanoi (them &v=3f de tranh cache cu),
doi load xong 100%.

- Cursor (3F-01 + 3F-02):
  - Di chuot khap man hinh game: con tro mac dinh hien o moi cho,
    ke ca giua man hinh 3D (truoc day bien mat hoan toan).
  - Re chuot len nut VI/EN (goc tren-phai), header checklist
    (dong "HANOI 0/10"), tung item checklist, header the info,
    nut X cua the info: con tro doi thanh ban tay (pointer).
  - Re chuot len vung di bo (canvas giua man hinh): con tro van
    la mui ten mac dinh, khong doi thanh ban tay.
- Minimap 168px (3F-04):
  - Do bang thuoc tren man hinh hoac devtools: khung minimap rong
    168px, cao 168px, cach mep phai 12px va cach day 12px.
  - Tren dien thoai 390px: minimap chiem gan nua chieu rong
    (43%), mep trai o khoang x = 210. Khong che nut #fps-readout
    o goc duoi-trai, khong che checklist o goc tren-trai.
  - Moi o ban do to hon truoc mot chut (5px thay vi 4px); ho va
    duong nhin ro hon.
- Dia so (3F-08):
  - Tren minimap thay 10 dia tron, moi dia co 1 so tu 1 den 10.
  - So khop thu tu checklist: 1 = Hoan Kiem (giua ban do),
    2 = Ngoc Son (ben phai so 1), 3 = Ho Tay (goc tren-trai),
    10 = Cau Long Bien (meo phai).
  - Dia da kham pha: to dac mau dat nung, so mau giay sang.
    Dia chua kham pha: nen giay, chi vien dat nung, so mau dat nung.
  - Di bo toi 1 landmark de kham pha no, xem dia do doi tu vien
    rong thanh to dac ngay khi toast hien.
  - Pin traveller van la cham muc nho co vach huong, khong doi.

## Diem con thieu / chua xong

- 3F-05 / 3F-06 / 3F-07 / 3F-10: thuoc phase icon sau, chua lam.
  Dia so 3F-08 la fallback tam, se thay dan bang icon silhouette
  khi icon ve xong, khong doi cau truc ham drawMinimap.
- Traveller pin chua doi kich thuoc (van r=2.6 + vach 5px).
- The info dang mo co the che phan tren minimap tren man hinh
  thap hon 857px (xem muc 3F-04). Can user check tren may that.
- Chua verify tren trinh duyet that: khong co headless Chromium /
  Playwright trong sandbox nen khong chup man hinh local. Moi muc
  tren chi moi verify bang code, build, check script va so do tu
  CSS. May cua user la check duy nhat dat.
- Landmark gan nhau tren minimap (Ngoc Son so 2 va Nha Tho Lon
  so 8 cach nhau 2 o = 10px, dia duong kinh 12px) co the cham
  nhau o mep dia. Can user nhin that de quyet co can dich dia
  hay khong; code khong tu dich vi tri dia.
