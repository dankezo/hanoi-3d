# Hanoi 3D - Phase 3F-quick verification (doc lap)

- Ngay: 2026-11-21
- Verifier: doc lap, chi doc + chay test, khong sua bat ky file game nao
- Pham vi: chi 4 muc nhanh 3F-01 / 3F-02 / 3F-04 / 3F-08 theo spec docs/phase-3-spec.md muc 2.6, muc 4 tieu chi 3F, muc 6 trap
- Co so: repo local ~/workspace/hanoi-3d, git HEAD 4ec66a3, working tree = remote ca3efda5 + phase 2 (chua commit)
- Manifest cua fixer: docs/phase-3f-manifest.md - doc de biet fixer tuyen bo gi, moi so duoi day la do verifier tu chay lai
- Ket luan: GO (xem muc 8) - 4/4 muc PASS, 0 blocker, 3 nit

## 1. Bang PASS/FAIL tung muc

| Muc | Spec yeu cau | Ket qua | Bang chung |
|---|---|---|---|
| 3F-01 | Xoa cursor: none o index.html:27-28 | PASS | index.html dong 27-28 khong con cursor, chi con margin/height/overflow/background va position cho canvas#atlas. Grep toan repo (tru node_modules, dist, .git): 0 cursor: none trong code, chi con cau chu trong docs/phase-3-spec.md va docs/phase-3f-manifest.md mo ta muc nay |
| 3F-02 | Moi phan tu bam duoc co cursor: pointer | PASS | 5/5 phan tu hien co co pointer (xem muc 3). 2 cho them moi dung nhu manifest: #lm-head dong 54, #lm-items li dong 62. 3 cho da co san: #lm-lang dong 91, #lm-info-head dong 113, #lm-info-x dong 120 |
| 3F-04 | Minimap CSS 132px thanh 168px, buffer 200x200, giu goc duoi-phai cach mep 12px | PASS | index.html dong 79: width 168px, height 168px, right 12px, bottom 12px. Dong 159: canvas width="200" height="200". Grep toan repo: 0 "132px", 0 width="160" / height="160" trong code, chi con trong docs mo ta. Moi o = 200/40 = 5px, tinh tu s = W / MAP_CELLS trong drawMinimap |
| 3F-08 | Dia giay r=6 + so 1-10 theo thu tu checklist, khong hardcode 10 | PASS | landmarks.js dong 339-357: vong lap for (let i = 0; i < LANDMARKS.length; i++), arc r=6, fillText(String(i + 1)), font 700 8px Georgia. Grep so "10" trong landmarks.js: 0 ket qua - khong co hardcode nao. Mau dung spec: da kham pha dia dac #b9603f + so #efe0c2, chua kham pha nen #efe0c2 + vien #b9603f day 1.5px + so #b9603f |

## 2. So do that do verifier tu chay

- node --check src/game/landmarks.js: PASS
- npm run build: PASS, 65 modules transformed, build trong 946ms
  - Bundle moi: dist/assets/index-BjGQIBSB.js, 1,106,648 bytes (1,106.65 kB, gzip 335.07 kB)
  - dist/index.html 8.04 kB (gzip 2.45 kB)
  - Baseline theo brief: index-C0ja968t.js 1,106.47 kB - bundle moi lon hon khoang 0.18 kB, dung muc tang cua 1 ham ve nho
  - Hash bundle trung khop hoan toan voi manifest cua fixer (BjGQIBSB) - chung to working tree khong doi tu luc fixer build
- npm run check:hanoi: 161 PASS, 0 FAIL, ALL CHECKS PASSED (chay 3 lan, deu 161/0)
- Khong chay Impeccable detect / Hallmark sloplint (loi tool da biet theo spec muc 6 trap T9: detect hang, sloplint khong ton tai)

## 3. Kiem tra 3F-02 day du khong - danh sach moi phan tu bam duoc

- Liet ke tu grep addEventListener('click') trong src/ + the HTML trong index.html. Chi landmarks.js co click handler (5 cho), khong co click handler nao khac trong src/.
- Toggle VI/EN (#lm-lang): cursor: pointer o CSS index.html dong 91 - PASS (co san tu truoc)
- Header checklist (#lm-head, nut collapse): cursor: pointer o CSS dong 54 - PASS (them moi)
- Item checklist (#lm-items li): cursor: pointer o CSS dong 62 + JS inline li.style.cursor = 'pointer' landmarks.js dong 174 - PASS (them moi o CSS, JS da co tu step 4)
- Header the info (#lm-info-head): cursor: pointer o CSS dong 113 - PASS (co san tu truoc)
- Nut X the info (#lm-info-x): cursor: pointer o CSS dong 120 - PASS (co san tu truoc)
- Link nguon trong the (#lm-info-src, the a co href): khong co rule cursor rieng, nhung the a co href duoc trinh duyet cho pointer theo mac dinh - khong tinh la thieu, spec 3F-02 cung khong liet ke link nay
- Vung di bo (canvas#atlas): khong co rule cursor nao - giu con tro mac dinh, dung spec
- Minimap (#lm-map): pointer-events: none - khong bam duoc, dung vi 3F-07 (tap icon) thuoc phase icon sau, chua lam
- Dau "!" va icon minimap: chua ton tai trong code, dung nhu manifest noi - khong co gi de kiem

## 4. Kiem tra 3F-08 - so thu tu, mau, hinh hoc

- So theo index that: LANDMARKS duoc build tu ORDER.map (landmarks.js dong 53-56), vong lap ve dung LANDMARKS.length va i + 1. Them landmark thu 11 (them 1 id vao ORDER + NAMES + HANOI_LANDMARKS) thi dia tu thanh 1-11 ma khong sua code ve - PASS. So hien thi trong checklist (renderList) cung dung LANDMARKS.length nen dong bo.
- Thu tu so = thu tu checklist hien tai: 1 Hoan Kiem, 2 Ngoc Son, 3 Ho Tay, 4 Pho Co, 5 Lang Chu Tich, 6 Van Mieu, 7 Chua Mot Cot, 8 Nha Tho Lon, 9 Nha Hat Lon, 10 Cau Long Bien - khop manifest.
- Mau da/kham pha dung spec (xem bang muc 1). Traveller pin giu nguyen nhu cu (cham muc r=2.6 + vach huong dai 5px, vien giay 1px) - dung pham vi, doi pin thuoc 3F-06 sau.
- Hinh hoc cap gan nhau nhat (tinh tu anchor trong src/world/hanoi-map.js, s = 5px/o, tam dia = tam o + 2.5px):
  - Ngoc Son (5,-2) tam (127.5, 92.5) - Nha Tho Lon (7,-1) tam (137.5, 97.5): khoang cach tam 11.18px (can 2 o ngang, 1 o doc: can bac 2 cua 10 + 5)
  - 2 dia r=6 co tong ban kinh 12px - 2 dia cham nhau o mep 0.82px (tinh theo buffer 200px; theo CSS 168px thi cham 0.69px, duoi 1px vat ly)
  - Cap gan thu 2: Lang Chu Tich - Chua Mot Cot 20.62px, khong cham. Cac cap con lai deu tren 29px
  - Chu so khong cham nhau: chu so 8px bold Georgia rong khoang 4.5px, 2 tam so cach nhau 11.18px nen mep chu cach nhau khoang 6.7px - so van doc duoc rieng biet
  - So 2 chu so ("10", sau nay "11") rong khoang 8.9px, vua trong dia duong kinh 12px, le moi ben khoang 1.5px
- Dinh chinh manifest: fixer viet "Ngoc Son + Nha Tho Lon cach 10px" - chua chinh xac. 10px chi la khoang cach theo truc x (2 o x 5px), bo qua truc z (1 o = 5px). Khoang cach that la 11.18px. Ket luan van dung (dia co cham nhau), chi sai so do.

## 5. Grep toan repo

- cursor: none: 0 trong index.html, src/, tools/ va toan bo code. Chi xuat hien trong van ban docs/phase-3-spec.md va docs/phase-3f-manifest.md (mo ta muc lam) - PASS
- 132px / width="160" / height="160": 0 trong code. Chi xuat hien trong van ban 2 file docs tren - PASS
- Dau gach dai U+2013 / U+2014 trong 2 file da doi: index.html 0/0, src/game/landmarks.js 0/0 - PASS (trap T10)

## 6. Git status / pham vi file doi

- git status: 23 file modified + nhieu file untracked (data/, docs/, workers/, tools/step5/, public/models/*.glb...) - day la noi dung phase 2 chua commit tu truoc, theo dung manifest ("working tree truoc khi lam da co san noi dung phase 2 chua commit"). Khong the tach rieng diff 3F khoi phase 2 bang git diff vs HEAD.
- Kiem chung bang mtime thay the: cac file game chi co index.html va src/game/landmarks.js duoc sua sau 06:00 ngay 2026-11-21 (06:48:24 va 06:48:26), cac file phase 2 khac deu o 03:xx. Hai file docs cung khung gio nay la phase-3-spec.md va phase-3f-manifest.md (spec + manifest, khong phai code game).
- Khong co file la trong working tree: khong co raw/, sprites/, __pycache__/. dist/ va node_modules/ co ton tai nhung nam trong .gitignore (build output + dependency), khong phai file fixer them.
- public/models/hanoi-tiles.glb khong doi (mtime 02:36:22, truoc phien 3F). Discovery (RADIUS = 1, ham discover/checkCell) va storage (STORE_PREFIX 'hanoi:v1:') doc lai nguyen ven trong landmarks.js, khong doi.
- Ket luan pham vi: chi 2 file game doi, dung nhu fixer tuyen bo - PASS (voi luu y gioi han git o tren)

## 7. Layout 390px - tinh tu CSS, chua phai render that

- Minimap 168px chiem 168/390 = 43.1% chieu rong. Mep trai x = 210, mep phai x = 378, cach mep phai va day 12px - dung spec 3F-04.
- Checklist rong 200px o goc tren-trai (left 12px, het o x = 212). Minimap o duoi-phai (bat dau x = 210) - 2 vung chong nhau theo chieu ngang 2px nhung cach nhau theo chieu doc hoan toan (checklist o tren, minimap o duoi) nen khong che nhau.
- Nut toggle VI/EN o goc tren-phai, khong cham checklist (checklist het o x = 212, toggle bat dau khoang x = 318).
- Nut #fps-readout o goc duoi-trai (left 12px), rong khoang 90px, het khoang x = 102 - khong cham minimap (bat dau x = 210).
- Toast o bottom 11vh, giua man hinh: o cao 844px thi day toast cach day 92.8px, dinh toast khoang 138px cach day, thap hon dinh minimap (180px cach day) nen khong che minimap.
- The info dang mo (bottom 21vh) co the che phan tren minimap khi man hinh thap: nguong chong lap la chieu cao man hinh 857px (voi minimap 132px cu thi nguong la 686px). O cao 844px (iPhone 14): the che khoang 2.8px dinh minimap. O cao 740px: che 24.6px. O cao 667px (iPhone SE): che 39.9px. Day la hinh hoc co san tu truoc, 3F-04 chi lam rong cua so chong lap them; sua vi tri the thuoc pham vi 3C, khong phai 3F-quick.
- Hint chu o bottom 4.5vh (pointer-events none) co the bi minimap che phan chu ben phai khi hint hien - co san tu truoc, 3F-04 lam rong them khoang 36px (minimap bat dau x = 210 thay vi 246).
- Chu so tren minimap khi hien thi that: dia 12px buffer ve 10.1px CSS, chu 8px buffer ve 6.7px CSS - nho nhung dung spec 3F-08 theo dung so lieu spec dua. Kha nang doc that chi user moi xac nhan tren may anh.

## 8. Danh sach loi

- Nit 1 - Dia Ngoc Son (so 2) va Nha Tho Lon (so 8) cham nhau o mep 0.82px (buffer) / 0.69px (CSS). Chu so van tach biet, doc duoc. Muc do: nit. Can user nhin that tren may anh de quyet co dich dia hay khong; khong can sua code truoc khi user noi.
- Nit 2 - The info dang mo che dinh minimap tren man hinh cao duoi 857px (2.8px o 844px, 39.9px o 667px). Nguyen nhan la 3F-04 tang minimap tu 132px len 168px trong khi vi tri the khong doi. Muc do: nit, thuoc pham vi 3C sua vi tri the. Fixer da khai bao truoc trong manifest.
- Nit 3 - Chuoi khoi tao "0/10" trong index.html dong 147 (the b#lm-count) la text tinh, chi duoc renderList() ghi de thanh n/LANDMARKS.length khi JS chay. Neu phase 3B them landmark thu 11 thi lan paint dau tien van hien 0/10 trong tich tac. Muc do: nit, khong anh huong chuc nang.
- Dinh chinh so lieu (khong phai loi code): manifest viet cap Ngoc Son - Nha Tho Lon "cach 10px" - so dung la 11.18px (xem muc 4).
- Khong lam (dung pham vi): 3F-03, 3F-05, 3F-06, 3F-07, 3F-10 chua lam, theo dung pham vi 3F-quick. Dia so 3F-08 la fallback tam.

## 9. Ket luan

- GO cho phase 3F-quick: 3F-01, 3F-02, 3F-04, 3F-08 deu PASS voi bang chung code + so do chay that. Build moi (index-BjGQIBSB.js, 1,106,648 bytes) va check:hanoi (161 PASS / 0 FAIL) deu xanh, trung khop so cua fixer. Chi 2 file game doi, khong dong vao discovery, storage, tiles.glb. 3 nit o muc 8 khong chan.
- Dieu kien con lai theo quality gate: chua co render that (sandbox khong co headless Chromium/Playwright, spec trap T8). User can check tren may anh bang tab an danh, link ?map=hanoi (them &v=3f): con tro hien khap man hinh va doi thanh ban tay tren 5 phan tu muc 3, minimap 168px o goc duoi-phai, 10 dia so doc duoc, rieng dia so 2 va so 8 co cham mep nhau khong, va the info mo co che minimap tren chieu cao man hinh cua anh khong.
