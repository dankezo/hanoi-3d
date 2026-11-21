# Hanoi 3D - Phase 3F-05 manifest (icon minimap silhouette giay custom)

Fixer build, 2026-11-21. Phase cuoi cua Phase 3, theo spec
docs/phase-3-spec.md muc 2.6 / muc 3 phase 3F / muc 4 tieu chi 3F.
Quyêt đinh Q2/Q8 đa duyêt: Trân Quôc la landmark riêng thư 11
(checklist 11), minimap 168px, icon ve custom, đia sô 1-11 lam fallback.
Khong push, khong commit. Chi dung dâu gach ngan "-" trong moi file.

## File đoi

- src/game/landmarks.js - loader icon, ve icon trong drawMinimap,
  traveller pin r=3.5, mui ten bac N, tap icon đe locate.
- index.html - #lm-map pointer-events auto + cursor pointer,
  style #lm-items li.locate.
- public/textures/art/minimap_icons.png - MƠI, binary, 1.938 byte.
- public/textures/art/minimap_icons.json - MƠI, 22 rect.
- tools/step5/build-minimap-icons.py - MƠI, script ve icon (chay lai đươc).
- tools/check-3f.mjs - MƠI, 150 check.
- docs/phase-3f5-manifest.md - file nay.
- Khong đoi: discovery, storage hanoi:v1:, radius 1, checklist 11,
  logic the info 3C, tiles.glb, solver 95/96, game_icons.png cu.

## 3F-05 - 11 icon silhouette giay custom

- Sheet riêng (không bake vao game_icons.png cu): sheet cu chua sprite
  hero 147-152px dung cho atlas map 3D, thêm icon 32px vao đo dê
  đụng vung đa dung; sheet riêng 352x64 nho, loader theo đung pattern
  atlasmap.js, rui ro thâp hơn. Ghi ro đê parent biêt.
- Môi icon 32x32, ve lai băng PIL (hinh hoc đơn gian: chư nhât, đa giac,
  cung tron), 2 mau mưc #5a3a28 + đât nung #b9603f trên nên trong suôt,
  theo pattern build-sign-atlas.py. KHÔNG crop sprite hero.
- Script: tools/step5/build-minimap-icons.py, chay lai:
  python3 tools/step5/build-minimap-icons.py.
- Danh sach 11 icon (thư tư = checklist):
  1. hoankiem - Thap Rua: 3 tâng xêp chông hep dân + đinh đât nung +
     đương nươc dươi chân.
  2. ngocson - Đên Ngoc Son: mai cong vut 2 đâu + 2 côt đât nung +
     cưa giưa.
  3. westlake - Hô Tây: 3 canh sen đât nung trên 3 gơn song.
  4. tranquoc - Chua Trân Quôc: thap cao hep, 6 tâm mai đât nung
     rông dân vê đay + đinh nhon (6 tâm đai diên 11 tâng ơ 32px:
     11 vach 1px se biên mât ơ cơ 14px).
  5. oldquarter - Phô Cô: nha ông cao hep, mai đât nung, 3 cưa sô
     + cưa hang dươi.
  6. mausoleum - Lăng Bac: khôi đa 3 bâc + côt cơ đo.
  7. vanmieu - Văn Miêu: công 2 tru + xà ngang + mai cong đât nung.
  8. onepillar - Chua Môt Côt: chua nho trên 1 côt giưa + đê đa.
  9. cathedral - Nha Thơ Lơn: 2 thap nhon + đâu hôi giưa + cưa vom.
  10. opera - Nha Hat Lơn: măt tiên rông, 3 cưa vom, tam giac đât
      nung giưa đinh.
  11. longbien - Câu Long Biên: dan thep zigzag trên măt câu + 2 tru
      + gơn nươc.
- Ve băng măt: đa xuât anh crop môi icon phong to 128px + thu nho 14px
  trên nên patchwork va xem lai. Kêt qua: 8/11 nhin ra ngay ơ 14px
  (hoankiem, tranquoc, oldquarter, mausoleum, vanmieu, onepillar,
  cathedral, longbien). Con kho nhân ra ơ 10-14px: westlake (sen +
  song thanh chôm nho, cân đoc kem vi tri Hô Tây), opera (ban tô mau
  chi la khôi chư nhât co 3 vach vom - ơ ban outline chi con khung +
  3 net vom), ngocson (mai cong ơ nho dê đoc thanh mui tên).
  Chưa ve lai lân 2: cac icon nay vân phân biêt đươc nhơ hinh dang
  + vi tri trên ban đô, va user check trên may thât la quyêt đinh.

## 3F-06 - Phân biêt đa / chưa kham pha + traveller to hơn

- Sheet co 2 hang: hang 0 (y 0-31) icon tô mau, hang 1 (y 32-63) cung
  hinh chi ve băng net mưc mơ (alpha 170), không tô, không đât nung.
- Đa kham pha: hang tô mau. Chưa: hang outline. Cung 1 ham ve
  drawIconGlyph, chi đoi tên rect (mm_<id> / mm_<id>_outline).
- Traveller: đa lam r=3.5 (trươc 2.6), vach hương dai 7px (trươc 5px).
  3F-quick chưa lam muc nay, phase nay lam luôn.

## 3F-07 - Tap icon đe locate + mui tên băc

- #lm-map la canvas riêng, trươc co pointer-events: none nên tap
  không tơi. Nay: pointer-events auto + cursor pointer.
- Tap (dich < 10px, < 400ms, như tap-vs-drag cua canvas chinh) trong
  vong 11px quanh tâm icon: checklist highlight item đo (outline
  đât nung 2px, 2.5 giay) + mơ the info ơ chê đô tom tăt nêu đa kham
  pha, hoăc toast "Chua kham pha - di toi do" (EN: "Not discovered
  yet - go there") nêu chưa.
- Tap icon KHÔNG đi bô tơi đo: pointerup trên minimap stopPropagation,
  va handler tap cua canvas chinh bo qua target trong #lm-map.
- Mui tên băc: tam giac đât nung chi lên + chư N 9px ơ goc trên-phai
  minimap (x = W-11, y 4-21). Không đụng icon Long Biên (ơ y 70).

## 3F-08 - Đia sô 1-11 giư lam fallback

- Đia sô 3F-quick GIƯ NGUYÊN trong drawMinimap: nêu sheet chưa load
  xong hoăc load lôi (fetch/anh lôi), ham ve rơi vê đia sô. Cung 1 ham
  ve, chi đoi nguôn glyph (icon -> đia sô khi fallback).
- Loader: fetch minimap_icons.json (parse kiêu game_icons.json),
  Image load xong mơi set iconTable/iconImg + ve lai; onload lôi thi
  xoa sheet, đia sô ơ lai.

## 3F-09 - Không dung thư viên icon co săn

- 11 icon đêu tư ve. Không Maki / Material / Font Awesome. Không
  credit cân thêm.

## 3F-10 - Trân Quôc co icon riêng

- mm_tranquoc riêng (thap 11 tâng), ơ anchor (-13,-12) giưa Hô Tây.
  Hô Tây (westlake, sen + song) ơ anchor (-9,-11). 2 icon không
  chông nhau (cach nhau 4 ô = 20px).

## Chông nhau con lai (ghi nhân, chưa sư)

- Ngoc Son (5,-2) va Nha Thơ Lơn (7,-1): tâm cach nhau ~11px, icon
  rông 14px nên mep icon chông nhau ~3px. Đia sô trươc cung chông
  (đia 12px, tâm cach 10px). Chưa dich vi tri vi spec câm đoi anchor.
  User nhin trên may thât rôi quyêt co cân dich icon hay thu nho
  xuông 12px không.

## Verification (sô thât, chay local 2026-11-21)

- node --check src/game/landmarks.js: PASS. node --check
  tools/check-3f.mjs: PASS.
- npm run build: PASS. Bundle mơi dist/assets/index-DWjKJcvv.js,
  1.145.681 byte (trươc 3F-05: index-CBAsYfkx.js, 1.143.398 byte,
  +2.283 byte). minimap_icons.png + .json đa copy vao dist.
- node tools/check-3f.mjs: 150 PASS, 0 FAIL, ALL 3F CHECKS PASSED.
  Giai ma PNG băng node:zlib, đêm pixel thât môi icon: ban tô mau
  mưc 80-340 + đât nung 35-192; ban outline mưc 144-292, đât nung 0.
- npm run check:hanoi: 256 PASS, ALL CHECKS PASSED (solver 95/96,
  1600 ô resolve).
- check-3e: 73 PASS. check-3c: 206 PASS. check-3a: 197 PASS.
  check-3b: 74 PASS. check-3d: 115 PASS. check-2b: PASS.
  check-2c: 91 PASS. check-2d: 144 PASS. check-2e: 104 PASS.
  check-basic: PASS (atlas 206 sprite, không đụng).
- 0 dâu gach dai trong 4 file đoi/mơi (kiêm băng python, kiêm ca
  ki tư thât U+2013/U+2014). 0 "@keyframes" trong index.html.
- Sô đo sheet: minimap_icons.png 1.938 byte, 352x64, 22 rect 32x32,
  0 chông nhau.

## Binary cân upload qua browser (push-files không nhân binary)

- public/textures/art/minimap_icons.png - MƠI, 1.938 byte.
- public/textures/art/minimap_icons.json - MƠI, 1.696 byte (text,
  push thương đươc; kê ca 2 cho chăc).

## Vong sua sau verify (fixer, 2026-11-21, khong push, khong commit)

- Verifier ket luan CONDITIONAL GO, 0 blocker, 4 nit (N1-N4).
  Vong nay sua ca 4 nit, chi cham 2 file code + sheet icon + file nay.
- N1 - outline mo do alpha ap 2 lan: sua tools/step5/build-minimap-icons.py,
  ham main() paste tile len sheet KHONG dung tile lam mask nua
  (sheet.paste(tile, (col * CELL, row * CELL))). Sheet bat dau trong
  suot nen paste khong mask copy RGBA nguyen ven. Kiem lai bang PIL:
  pixel muc hang outline alpha dung 170 (2.690 pixel, 0 pixel 113),
  hang to mau alpha 255. PNG moi 1.917 byte (truoc 1.938).
- N2 - vung tap cap ngocson/cathedral chong nhau: MM_TAP_R 11 -> 8 trong
  src/game/landmarks.js (tam cach nhau 11,18px, r=8 thu nho vung chong
  nhieu, van du cham: duong kinh 16px tren buffer 200px, tuong duong
  khoang 13,4px tren minimap 168px man hinh). Logic chon icon GIU
  nearest-centre (da co tu truoc, khong phai hit-truoc): vong lap lay
  tam gan nhat, doi so sanh <= thanh < de tap dung trung diem thi thang
  icon dung truoc trong checklist (ngocson). Khong doi vi tri icon.
  Kiem bang harness that (bien the harness verifier, tam /tmp, khong
  dua vao repo): tap (131, 94,5) gan ngocson hon -> mo ngocson;
  tap (134, 95,5) gan cathedral hon -> mo cathedral; tap dung trung
  diem (132,5, 95) -> mo ngocson. Ca 3 PASS. Luu y: tam that tren
  buffer la ngocson (127,5, 92,5), cathedral (137,5, 97,5); so
  (125, 90) / (135, 95) trong bao cao verifier la goc o, khong phai tam.
- N3 - loader icon khong timeout: loadMinimapIcons() trong
  src/game/landmarks.js them AbortController + setTimeout 5 giay,
  het 5 giay thi ctrl.abort() lam fetch reject, catch giu iconImg null
  nen dia so fallback o lai va van choi duoc. Timer duoc clear khi
  fetch settle (then cuoi sau catch). Neu AbortController khong co
  (trinh duyet cu) thi fetch chay nhu truoc, khong vo. Boot khong doi:
  createLandmarks tra ve ngay. Kiem bang harness that (fetch treo
  vinh vien): signal duoc truyen, aborted dung sau 5 giay, dia so
  fallback van ve du 11 dia. PASS.
- N4 - ve lai 3 icon kho nhan, chi sua 3 icon nay, 8 icon con lai GIU
  NGUYEN (khong ve lai, khong doi rect, JSON rect khong doi):
  - westlake: sen TO gap doi (3 canh dat nung rong, chiem nua tren
    tile, dinh y=2 thay vi y=5) + 3 gon song ngang thang ro (hline
    y=21, 25, 28) thay cho 3 cung tron mo. Bo chi tiet nho.
  - ngocson: mai cong thanh dai mong 2-3px (cong nhe hon, y=6-11 thay
    vi khoi dac y=5-13) + khoang trong giay y=12-15 giua mai va than
    (than bat dau y=16 thay vi y=12) + 2 cot dat nung mong hon.
  - opera: vom giua CAO han ro (cut y=14-28 thay vi y=18-28) + 2 vom
    ben thap (y=19-28) + cot dung muc giua cac vom + dinh dat nung
    cao hon (y=4 thay vi y=6). Bo chi tiet ria.
  - Danh gia bang mat cua fixer o 14px (crop phong to 128px + thu nho
    dung 14px, so cu/moi canh nhau, anh tam /tmp/f5f_redraw_compare.png):
    westlake CAI THIEN RO - ban moi doc ra sen tren mat nuoc, ban cu
    chi la chum nho; ngocson CAI THIEN RO - ban moi thay ro mai cong
    mong tach khoi than, ban cu la khoi toi; opera CAI THIEN NHE -
    ban moi co vom giua cao noi bat hon, van la nha rong nhung khac
    biet voi nha thuong ro hon ban cu. Ca 3 GIU BAN MOI, khong icon
    nao phai giu ban cu. Hang outline cua 3 icon cung xem lai o 14px:
    westlake outline sen + 3 song van doc duoc, ngocson outline mai
    va than tach biet, opera outline 3 vom + dinh ro.
- File doi vong nay: src/game/landmarks.js (N2, N3),
  tools/step5/build-minimap-icons.py (N1, N4),
  public/textures/art/minimap_icons.png + .json (sinh lai, JSON rect
  khong doi), docs/phase-3f5-manifest.md (muc nay).

## Verification vong sua (so that, chay local 2026-11-21)

- node --check src/game/landmarks.js: PASS. python3 -m py_compile
  tools/step5/build-minimap-icons.py: PASS.
- npm run build: PASS. Bundle moi dist/assets/index-BLOjV665.js,
  1.145.899 byte. minimap_icons.png + .json moi da copy vao dist.
- node tools/check-3f.mjs: 150 PASS, 0 FAIL, ALL 3F CHECKS PASSED.
- npm run check:hanoi: 256 PASS, ALL CHECKS PASSED (solver 95/96,
  1600 o resolve, 0 mismatch).
- check-3e: 73 PASS. check-3c: 206 PASS. check-3a: 197 PASS.
  check-3b: 74 PASS. check-3d: 115 PASS. check-2b: PASS.
  check-2c: 91 PASS. check-2d: 144 PASS. check-2e: 104 PASS.
  check-basic: PASS (atlas 206 sprite, khong dung).
- Harness verifier chay lai tren code moi (tam /tmp): scenario A
  12/12 PASS (fallback dia so 1-11, tap, keo, tap tam cathedral),
  scenario B 6/6 PASS (icon load, doi hang to mau sau discover).
  Them: N2 3/3 PASS, N3 timeout 3/3 PASS (xem chi tiet o muc tren).
- 0 dau gach dai trong 3 file da cham (landmarks.js, build script,
  manifest). 0 "@keyframes" trong index.html. 0 "cursor: none".
- Dia so fallback van hoat dong: scenario A + test timeout deu ve
  du 11 dia r=6 + so 1-11 khi sheet chua load / load loi / fetch treo.
- Binary can upload qua browser (push-files khong nhan binary):
  public/textures/art/minimap_icons.png - MOI, 1.917 byte.

## Điêm chưa xong / chưa verify băng tay trên may thât

- Chưa verify trên trinh duyêt thât: không co headless Chromium /
  Playwright trong sandbox. Icon chi mơi xem qua anh crop phong to
  + thu nho, chưa xem trên minimap 168px thât ơ 390px.
- User cân check: 7/10 landmark phân biêt đươc băng icon không
  (tiêu chi 3F); westlake / opera / ngocson ơ cơ 10-14px co nhân ra
  không; căp Ngoc Son - Nha Thơ Lơn chông mep co kho chiu không;
  tap icon mơ đung the / toast đung chư không; đia sô co hiên trong
  1-2 giây đâu trươc khi sheet load không.
- The info đang mơ co thê che phân trên minimap trên man hinh thâp
  (điêm đa ghi ơ 3F-quick, thuôc 3C, không sư ơ đây).
