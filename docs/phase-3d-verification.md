# Hanoi 3D - Phase 3D verification (doc lap)

- Ngay: 2026-11-21. Verifier: agent doc lap, KHONG sua file game nao.
- Co so: repo local ~/workspace/hanoi-3d, git HEAD 4ec66a3, working tree chua commit (phase 2 + 3F-quick + 3D lan lon, git khong tach duoc diff theo phase).
- Spec: docs/phase-3-spec.md (muc 2.4, muc 3 phase 3D, muc 4 tieu chi 3D, muc 6 trap).
- Manifest cua fixer: docs/phase-3d-manifest.md (chi doc de biet fixer tuyen bo gi, moi so deu kiem lai bang test rieng).
- Phuong phap: doc code da doi, tu viet script dem rieng (/tmp/verifier-count.mjs, /tmp/verifier-firstload.mjs), tu chay build + toan bo check, grep rollback, kiem tra mtime file.
- File 3D theo mtime (2026-11-21 06:54-07:00): index.html, src/main.js, src/assets/loader.js, src/life/animals.js, src/render/quality-scaler.js, src/render/renderer.js, tools/check-3d.mjs, tools/check-basic.mjs (06:57), docs/phase-3d-manifest.md (07:00). tools/check-2e.mjs mtime 03:40, TRUOC phien 3D, khong bi cham trong phien nay.

## Ket luan chung: NO-GO (1 blocker, sua nho)

- 9/10 muc PASS, 1 muc FAIL mot phan (3D-06), 1 muc chua ket luan duoc trong sandbox (3D-10).
- Blocker duy nhat: 3D-06 ha muc sau crash KHONG duoc luu xuong storage nen khong ben vung, trai voi mau Ocean City ma chinh manifest noi la muon theo. Sua uoc tinh 1-3 dong (luu muc da ha vao hanoi:quality ngay khi ha), sau do chay lai build + check-3d + check-2e la co the GO.
- Khong co loi nao khac chan. Toan bo so build/check/first-load cua fixer deu trung khop khi chay lai.

## 1. Bang PASS/FAIL tung muc 3D-01..3D-10

| Muc | Ket qua | Bang chung |
| --- | --- | --- |
| 3D-01 | PASS | index.html:153-160 overlay #load tinh (co truoc khi module chay, script o dong 186), nen #efe0c2, chu #5a3a28, #load-pct 64px (>= 48px), #load-fill scaleX(0) + transform-origin left + transition transform 0.3s. main.js:80-87 setLoad() dat % so + bar + status tu cung 1 gia tri. Moc dung spec: 5% "Chuan bi..." (dong 99), 20% "Tai ban do..." (120), 45-65% "Dung nha ong..." (126), 70% "Ve ho..." (133), 90% "Dang gap giay..." (300), 100% "Xong!" (303). Dong thiet bi set tu deviceTierLabel(deviceTier) (dong 97). Overlay an bang class .done opacity + visibility 0.45s (index.html:54). |
| 3D-02 | PASS (theo ban rollback) | loader.js:685 tiles.glb push KHONG dieu kien (ca 2 che do), dong 686 `if (!hanoi)` chi gate basicGrand, dong 687 `if (hanoi)` gate hanoiTiles. JSDoc rollback dong 651-661 ghi ro ly do + so 1543/57. Grep toan repo: chi con 1 `if (!hanoi)` trong src (dong 686), khong con loadGLTF(A.tilesUrl) vo dieu kien. Xem muc 4. |
| 3D-03 | PASS | main.js khong con `await animals.ready` (grep 0 hit); loop.start() chay truoc, animals chi tao o dong 145 roi update moi frame. animals.js:92 fadeK = 0, FADE_IN_S = 2.5 (dong 93), fadeK reset ve 0 khi sheet ve (dong 152), update() return som neu chua loaded (dong 803) roi moi tang fadeK (dong 806), write() nhan scale voi fadeK (dong 789). Spawn table nguyen ven: specsFor van con. |
| 3D-04 | PASS | loader.js: tach Promise.all thanh 3 giai doan noi tiep: GLB (690), texture (698), meta fetchJSON (702). stageTracker (593-606) tinh fraction theo byte co trong so, GLB_BYTES khop o dia (tiles 6147140, basicGrand 704872, hanoiTiles 2496552, traveller 85024). loadGLTF/loadTexture truyen onProgress vao loadAsync (dong 494, 558). main.js map glb 20-45%, texture 45-65% (dong 125-126). Moc gia ghi ro: fetchJSON khong co progress, comment "MOC GIA" o loader.js:587-588, 699-701 va main.js:118-119. Luu y: neu manifest.json mat, giai doan texture khong bao progress va % dung o 45% - dung nhu manifest da ghi. |
| 3D-05 | PASS | quality-scaler.js: resolveDeviceTier (dong 60-79) chi doc deviceMemory + hardwareConcurrency + min(screen) + pointer coarse, grep `userAgent` trong file = 0 hit. Logic dung spec: phone RAM <= 4 hoac cores <= 4 hoac canh nho <= 360 thi low, phone khac med; desktop RAM <= 4 thi med, con lai high; mem undefined khong tinh thap; cores mac dinh 4; canh 0 bo qua; probe loi ve desktop high. Thu tu uu tien giu nguyen tu 2E: forced > stored > tier moi > touch cu (resolveInitialQuality dong 145-151, main.js:47 truyen fallback deviceTier.level). Khac Ocean City 1 cho co chu y: desktop RAM thap ve med (Ocean City ve low) - dung nhu manifest ghi. |
| 3D-06 | FAIL (mot phan, blocker) | Co che co ban dung: CRASH_KEY hanoi:crash, CRASH_SURVIVE_MS 15000, markBootStart truoc moi thu (main.js:55, sau khi doc co o dong 47), markBootSurvived sau 15s (hideLoad) + pagehide (dong 106), downgradeForCrash high -> med -> low, low thi bao loi, hien crashNote tren #load-note (dong 98), khong ghi de ?quality=. NHUNG muc da ha KHONG duoc luu xuong storage. Xem muc 2. |
| 3D-07 | PASS | quality-scaler.js: createPixScale (dong 268-316): 0.5-1.0, buoc 0.1, danh gia 1 giay/lan, rebuild chi khi doi > 15% (tru 2 cuc 1.0/0.5 luon rebuild), chong danh nhau qua msSinceStep < 2000ms (COOLDOWN_MS). renderer.js: cappedDpr nhan pixScale (dong 20), setPixScale clamp 0.5-1.0 (dong 38-43). main.js: tick moi frame voi scaler.emaFps + scaler.msSinceStep (dong 201), onApply goi setRendererPixScale + resize() (dong 278-281). post.js resize() doc drawing buffer size (dong 542) va rebuild target khi doi kich thuoc - duong rebuild co that, khong chi doi CSS. Preset QUALITY, scaler EMA, post pass khong doi. |
| 3D-08 | PASS | main.js:100-105 setTimeout 8000ms, neu loadDone thi bo qua, hien #load-slow "Dang tai cham, vui long doi... (ten file)". Ten file lay tu lastLoadFile do onProgress cap nhat gan nhat (dong 124). Luu y nho: neu chua co progress event nao (ket o request dau tien) thi chi hien cau doi, khong ten file - dung nhu manifest da ghi, khong phai loi. |
| 3D-09 | PASS | main.js:193-207 worstMs theo doi frame te nhat trong cua so 1 giay, reset moi giay. quality-scaler.js createFpsReadout.update nhan extra { worstMs, pixPct }, hien "fps 60 high worst 34ms res 80%" (dong 339-345). Khong extra thi giu format cu "fps 60 high". Chi chay khi ?fps=1, mac dinh tat (createFpsReadout enabled false tra null). |
| 3D-10 | CHUA KET LUAN (can may user) | MB first-load tu tinh lai dung 20.67 -> 16.04 MB (xem muc 5). Thoi gian toi frame dau (giay) va FPS o spawn (?fps=1) KHONG do duoc trong sandbox (khong trinh duyet/GPU that). Rui ro them: tieu chi spec "thoi gian toi frame dau giam it nhat 30%" viet truoc rollback (gia dinh first-load ~9 MB); sau rollback chi tiet kiem 22.4% theo byte nen muc 30% theo thoi gian co kha nang khong dat - can do tren may user roi quyet xem tieu chi co can sua theo rollback hay khong. Khong nhan "muot hon" khi chua co so. |

## 2. Blocker: 3D-06 ha muc sau crash khong ben vung

- Bang chung code: grep `setItem` trong src/main.js + src/render/quality-scaler.js chi co 2 cho - setItem(CRASH_KEY) o markBootStart va setItem(QUALITY_KEY) trong persist() cua scaler, ma persist() CHI goi trong step() (quality-scaler.js:190, goi o step dong 224). main.js sau khi ha muc (dong 50-54) khong goi bat cu ham luu nao; khong ton tai ham writeStoredQuality.
- He qua cu the, kiem bang doc code:
  - (a) Lan 1: stored = high, crash o high -> lan 2 boot o med (dung), choi on, tat sach -> storage VAN la high -> lan 3 lai boot o high. Neu may that su khong chay noi high thi se crash lap lai theo chu ky.
  - (b) Crash lap khong bao gio xuong low: lan 2 crash o med -> lan 3 stored van high -> ha xuong med (khong phai low). Du crash bao nhieu lan cung khong cham low.
- Doi chieu mau Ocean City (~/workspace/lightwaterworld/source/src/quality.js): khi co crash thi `SV = [++LV]; keep('abyssal', LV);` - tuc la LUU NGAY muc da ha xuong localStorage. Hanoi noi "muon tu Ocean City abyssalLoad" nhung thieu chinh dong luu nay.
- Vi sao test cua fixer khong bat duoc: check-3d muc (f) chi test ham thuan downgradeForCrash + flag voi storage gia, khong test main.js co luu muc da ha hay khong. Day la lo hong test, khong phai lo hong logic ham.
- Cach sua de xuat (khong tu sua, chi ghi ra): ngay sau dong ha muc o main.js, luu muc moi vao hanoi:quality (chi khi khong co forced ?quality=, dung quy tac forced cua 2E). Sau sua: chay lai npm run build + node tools/check-3d.mjs + node tools/check-2e.mjs, va them 1 check moi: crash o high voi stored high -> muc luu trong storage phai la med.
- Muc do: blocker vi lam mat dung muc dich cua co crash (bao ve may yeu khoi crash lap), nhung sua nho va khong anh huong cac muc khac.

## 3. Dem doc lap 1543/1600 (khong dung so cua fixer)

- Cach dem rieng: script /tmp/verifier-count.mjs doc HANOI_ROWS + HANOI_LEGEND tu src/world/hanoi-map.js, phan loai tileId theo tu dien: co trong MODELS (src/core/models.js) = stock trong tiles.glb; co trong HANOI_MODELS (src/world/hanoi-models.js) = Hanoi-only. Khong dung lai code dem cua check-3d.mjs (no dem stock = "khong phai Hanoi-only", cach cua toi dem stock = "co mat trong MODELS" - doc lap that su).
- Ket qua: 40 hang x 40 cot = 1600 o, 0 o khong ro, STOCK = 1543, HANOI-ONLY = 57. TRUNG KHOP HOAN TOAN voi fixer.
- Chi tiet stock (14 id): meadow 761, forest 243, grove 90, pond 90, river_straight 71, path_straight 100, meadow_flowers 65, path_end 19, path_cross 7, path_t 10, hills 74, river_source 6, lantern_post 2, rocks 5. Tong: 761+243+90+90+71+100+65+19+7+10+74+6+2+5 = 1543.
- Chi tiet Hanoi-only (25 id, 57 o): hanoi_tubehouse 7, hanoi_sidewalk 6, hanoi_bush 5, hanoi_tubehouse_b 4, hanoi_tubehouse_green 4, hanoi_tree 4, hanoi_pedestrian 3, hanoi_lamp 3, hanoi_road 2, hanoi_longbien 2, hanoi_trafficlight 2, hanoi_pole 2, hanoi_vendor 1, hanoi_phostall 1, hanoi_police 1, hanoi_turtletower 1, hanoi_thehuc 1, hanoi_ngocson 1, hanoi_cathedral 1, hanoi_mausoleum 1, hanoi_onepillar 1, hanoi_badinh 1, hanoi_opera 1, hanoi_vanmieu 1, hanoi_tranquoc 1. Tong = 57.
- Luu y kiem chung them: cac id stock co 0 o trong map (path_corner, river_corner, bridge, house, blossom_gazebo...) khong anh huong phep dem; 'y' (house stock) co 0 o nhu manifest ghi. Ket luan rollback dung: bo tiles.glb se lam 1543/1600 o (96,4%) mat art GLB.

## 4. Ket luan ve 2 cho fixer 3D sua test de pass

### (a) tools/check-2e.mjs - catch line: KHONG noi long, that ra test khong bi sua

- Su that: check-2e.mjs mtime 2026-11-21 03:40, truoc phien 3D (06:54+), file KHONG bi cham trong phien 3D. Cho sua la o CODE (main.js), khong phai o test: fixer dua catch ve dung chu cu `} catch (err) { scaler = null; fpsReadout = null; }` de khop check cu.
- Chung minh code dung: pixScale khai bao `let pixScale = null;` truoc try (main.js:255); trong try, lenh gan `pixScale = createPixScale(...)` la lenh cuoi cung; neu createPixScale throw thi lenh gan khong hoan tat nen pixScale van null; neu cac lenh truoc throw thi pixScale cung chua duoc gan. Nen catch khong reset pixScale la an toan mot cach chung minh duoc, khong phai doan mo.
- Phong thu sau: neu pixScale co bi cu thi cung khong lo ra ngoai, vi render() chi dung pixScale khi `scaler` khac null (`if (pixScale && scaler)`, main.js:201) va readout chi chay khi `fpsReadout && scaler` (dong 207) - catch da dat scaler = null.
- Ket luan: KHONG noi long. Test van assert dung chu catch cu nhu tu phase 2E, hanh vi code khong doi.

### (b) tools/check-basic.mjs - 1 assertion: KHONG noi long ve hanh vi

- Cu (theo manifest): `!hanoi ? loadGLTF(A.basicGrandUrl)`; moi: regex `/if \(!hanoi\) glbJobs\.push\(\{ key: 'basicGrand'/` (check-basic.mjs dong 58-60).
- Chung minh tuong duong hanh vi: trong loader.js hien tai, duong duy nhat load basic-grand la qua glbJobs - push co dieu kien o dong 686, nap bang Promise.all o dong 690 (`glbJobs.map((job, i) => loadGLTF(job.url, ...))`), khong con cho nao khac push/load basicGrand (grep toan src). O Hanoi: khong push -> khong fetch; o non-Hanoi: push -> fetch. Dung hanh vi cu.
- Nit hep (khong chan): regex moi chi khop den `'basicGrand'` ma khong khop phan `url: A.basicGrandUrl` tren cung dong 686. Do che bao phu URL trong cung 1 assertion co hep lai chut it, nhung van duoc bu boi check ke ben (`/basicGrandUrl/` o dong 56) va check assets.js co basicGrandUrl + file ton tai. De xuat: mo rong regex toi `url: A.basicGrandUrl` o lan sua sau, khong can chan GO vi chuyen nay.
- Ket luan: test duoc cap nhat theo hinh thuc code moi (tach Promise.all thanh job list), khong noi long hanh vi.

## 5. So do that do chinh toi chay (khong lay so cua fixer)

- npm run build: PASS, vite 8.3.8, 65 modules, dist/assets/index-CpTtoqEt.js 1.111.824 byte, gzip 337.08 kB, build 751ms. Hash + byte TRUNG KHOP manifest (index-CpTtoqEt.js, 1.111.824 byte).
- npm run check:hanoi: ALL CHECKS PASSED, 1600 o resolve, 0 unresolved.
- node tools/check-3d.mjs: 107 PASS, 0 FAIL, ALL 3D CHECKS PASSED (in first-load truoc 20.67 MB, sau 16.04 MB, deferred 4.63 MB, texture 7.03 MB).
- node tools/check-2b.mjs: ALL 2B CHECKS PASSED.
- node tools/check-2c.mjs: 89 PASS, 0 FAIL.
- node tools/check-2d.mjs: 139 PASS, 0 FAIL.
- node tools/check-2e.mjs: 104 PASS, 0 FAIL.
- node tools/check-basic.mjs: ALL BASIC CHECKS PASSED (atlas 200 sprite).
- node --check: 6/6 OK (src/main.js, src/assets/loader.js, src/life/animals.js, src/render/quality-scaler.js, src/render/renderer.js, tools/check-3d.mjs).

### Bang first-load tu tinh lai tu o dia (script rieng)

- Truoc frame dau, che do Hanoi: tiles.glb 6.147.140 + hanoi-tiles.glb 2.496.552 + traveller.glb 85.024 + texture rieng biet 7.033.841 + manifest.json 7.723 + assets_meta.json 105.222 + atlas.json 169.008 = 16.044.510 byte = 16,04 MB (sau 3D). Cong animals.png 4.619.400 + animals.json 6.822 = 4.626.222 byte thi tong truoc 3D = 20.670.732 byte = 20,67 MB. Tiet kiem truoc frame dau 4.626.222 byte = 4,63 MB (-22,4%), chi tu 3D-03.
- Texture rieng biet (10 file, 11 key manifest - pagePaperRough trung file paper_rough.png nen tinh 1 lan): card_albedo.png 667.665, card_normal.jpg 656.249, paper_rough.png 36.637, page_albedo.png 618.366, page_normal.jpg 640.580, edge_strip.png 176.235, print_atlas.png 1.543.614, table_wood.jpg 77.122, blue_noise.png 49.353, art/atlas.webp 2.568.020. Tong 7.033.841. So `bytes` trong manifest.json khop o dia 0 lech (kiem tung file).
- GLB_BYTES trong loader.js khop o dia ca 4 file. Khong tinh: manifest.json lan 2 (cache hit), game_icons.png (chi fetch khi mo atlas), country.is (vai tram byte), edge API (mac dinh tat).

## 6. Rollback + git status + file la + dau gach

- Rollback: loader.js:685 tiles.glb fetch khong dieu kien ca 2 che do; dong 686 basic-grand van gate `if (!hanoi)`; dong 687 hanoi-tiles gate `if (hanoi)`. Grep toan repo khong con cho nao noi "bo tiles.glb o Hanoi" ngoai: (1) JSDoc giai thich rollback o loader.js:651-661 (duoc phep), (2) van ban spec goc o docs/phase-3-spec.md:128, 197, 198 - day la spec viet truoc rollback, chua cap nhat theo quyet dinh rollback (nit doc, xem muc 7).
- Git status: HEAD 4ec66a3, working tree chua commit, gom phase 2 + 3F-quick + 3D nen khong tach diff theo phase bang git; phan biet phien 3D bang mtime 06:54-07:00 nhu mo dau bao cao.
- File la: dist/ la output cua npm run build (co trong .gitignore, hash trung manifest, khong phai file la). tools/step5/raw/ (2026-11-20 21:36) va tools/step5/__pycache__/ (2026-11-21 02:22) deu co truoc phien 3D, khong phai do phien 3D sinh ra. Khong co file la moi trong phien 3D.
- Dau gach dai: 0 hit (U+2013/U+2014) trong ca 10 file 3D (index.html, src/main.js, src/assets/loader.js, src/life/animals.js, src/render/quality-scaler.js, src/render/renderer.js, tools/check-3d.mjs, tools/check-2e.mjs, tools/check-basic.mjs, docs/phase-3d-manifest.md), kiem bang python.

## 7. Danh sach loi

### Blocker (1)

- B1 - 3D-06: muc da ha sau crash khong duoc luu vao hanoi:quality nen khong ben vung (xem muc 2). Sua: luu muc moi ngay khi ha (tru truong hop forced ?quality=), them check moi vao check-3d, chay lai build + check-3d + check-2e.

### Nit (khong chan GO sau khi sua B1)

- N1 - Manifest muc "Cach tu kiem tra bang mat" buoc 5 sai quy trinh: tat tab binh thuong giua luc load SE KHONG hien dong ha muc, vi pagehide (main.js:106) goi markBootSurvived va xoa co truoc khi tab dong. Chi crash/kill that (khong chay pagehide) hoac seed tay localStorage hanoi:crash=1 moi thay duoc dong do. Can sua buoc 5 trong manifest truoc khi dua cho user test.
- N2 - Spec docs/phase-3-spec.md muc 3D-02 (dong 128) va muc kiem tra 3D (dong 197-198) van viet theo ban cu "bo tiles.glb o Hanoi / first-load ~9 MB". Spec la tai lieu goc truoc rollback, can them 1 dong chu thich tro toi quyet dinh rollback trong manifest de nguoi doc sau khong lam theo ban cu.
- N3 - check-basic.mjs regex moi khong khop phan `url: A.basicGrandUrl` tren cung dong (xem muc 4b). Mo rong regex o lan sua sau.
- N4 - 3D-08: neu load ket truoc progress event dau tien thi dong slow-load khong co ten file (chi cau doi). Da ghi trong manifest, hanh vi chap nhan duoc.
- N5 - 3D-10: tieu chi "frame dau giam it nhat 30%" co kha nang khong dat sau rollback (chi tiet kiem 22,4% byte). Can do tren may user roi quyet co sua tieu chi theo rollback hay khong; khong phai loi code.

## 8. Nhung gi KHONG the verify trong sandbox (viec cua may user sau)

- Thoi gian toi frame dau truoc/sau (giay) tren cung may, cung mang; FPS o spawn (?fps=1) truoc/sau; thoi gian load that tren mang that.
- Man hinh load nhin that: % chay 0 -> 100 kem ten giai doan, dong thiet bi, dong slow-load sau 8 giay tren mang cham, dong crash sau lan sap that.
- Dong vat fade-in 2,5 giay bang mat (khong pop 1 phat), map du art GLB o 1543 o stock (khong placeholder phang).
- Co crash tat tab that: chi kill/crash that (khong phai dong tab binh thuong) moi de lai co; dong tab binh thuong se xoa co qua pagehide (xem N1).
- pixScale tren may that: co tranh duoc step preset khong, co hitch khi rebuild target khong; worst-frame + res% trong readout ?fps=1.
- Tier khoi dong tren dien thoai that (RAM <= 4 GB / <= 4 nhan / man hinh <= 360px ve low) va desktop RAM thap ve med.

## 9. Ket luan GO / NO-GO

- NO-GO cho Phase 3D o trang thai hien tai, chi vi 1 blocker B1 (3D-06 khong luu muc ha sau crash).
- Moi thu khac PASS voi bang chung code + so do chay that: 3D-01, 3D-02 rollback, 3D-03, 3D-04, 3D-05, 3D-07, 3D-08, 3D-09; dem 1543/57 trung khop tuyet doi; 2 cho sua test khong noi long; build + 7 bo check deu xanh; first-load 20,67 -> 16,04 MB dung so.
- Dieu kien GO: sua B1 (luu muc da ha), them check moi cho hanh vi luu, chay lai npm run build + node tools/check-3d.mjs + node tools/check-2e.mjs xanh, sua N1 (buoc test crash trong manifest) truoc khi dua user test. Sau do can do 3 so 3D-10 tren may user (giay toi frame dau, FPS spawn, % res) de ket luan muc 3D-10.

## 10. Verify lai B1 - 2026-11-21

- Ngay: 2026-11-21. Verifier: agent verify lai doc lap, KHONG sua bat ky file game nao. Chi doc, chay test rieng, viet bao cao.
- Co so: repo local ~/workspace/hanoi-3d, git HEAD 4ec66a3 (khong doi), bao cao cua fixer trong file nay (muc 2, 7) + docs/phase-3d-manifest.md (muc 3D-06, buoc 5 test co crash) + spec docs/phase-3-spec.md muc 2.4 (3D-06). Moi so duoi day do chinh verifier chay, khong lay so cua fixer.
- Phuong phap: doc code sua (main.js dong 43-63, quality-scaler.js dong 108-119), doc 8 check moi trong check-3d.mjs, tu viet script mo phong revert (/tmp/b1-revert-proof.mjs), tu chay build + toan bo check, grep moi cho ghi quality trong src/.

### 10.1 Bang PASS/FAIL tung diem kiem

| Diem | Ket qua | Bang chung |
| --- | --- | --- |
| B1-1 Loi goi persist nam dung nhanh ha muc do crash | PASS | main.js:50 `if (crashedLastTime && forcedQuality === null) {`, dong 51 `downgradeForCrash(quality)`, dong 52-59 `if (down.downgraded) { quality = down.level; ... persistDowngradedQuality(storage, down.level); }`. Loi goi nam trong ca 2 dieu kien (co crash + khong ep), truoc dong 63 `markBootStart(storage)`. Khong nam trong nhanh ?quality= ep, khong nam ngoai dieu kien. |
| B1-2 Ham persist dung key + guard hop le + khong throw | PASS | quality-scaler.js:117-119 `persistDowngradedQuality(storage, level) { try { if (storage && isLevel(level)) storage.setItem(QUALITY_KEY, level); } catch (err) { } }`. QUALITY_KEY = 'hanoi:quality' (dong 25), cung key voi persist() cua scaler (dong 203). Guard isLevel chan 'ultra' va cac muc la (check B1 so 5 PASS). try/catch + kiem storage null nen khong throw bao gio. |
| B1-3 Khong co duong nao khac ghi de muc da ep | PASS | Grep `setItem` toan src/: chi 3 cho ghi QUALITY_KEY - persistDowngradedQuality (dong 118), persist() trong scaler step() (dong 203). persist() chi chay qua step(), ma tick() tra ve som khi `forced` (khong step khi ?quality= ep). markBootStart chi ghi CRASH_KEY, khong ghi quality. progress.js / landmarks.js / i18n.js ghi key rieng cua chung, khong cham hanoi:quality. Nhanh at-low (down.downgraded false) khong goi persist - dung, vi storage luc do da la low, khong co gi can luu. |
| B1-4 8 check moi that su bat duoc loi cu | PASS co luu y | Dem dung 8 check (f/B1) trong check-3d.mjs dong 193-216. Mo phong revert bang script rieng: xoa dong persist khoi slice main.js thi check tinh so 7 FAIL, tren code moi thi PASS - da xac nhan bang chay that. Luu y (xem 10.2): chi check so 7 bat duoc revert loi goi o main.js; check 1-6 goi thang helper nen khong bat duoc revert nay. |
| B1-5 Chuoi end-to-end high -> med -> low dung | PASS | Check 1-4 dung storage gia Mem: stored high -> downgrade + persist -> storage med, boot 2 doc lai ra med; crash tiep -> storage low, boot 3 doc lai ra low. Khong con vong lap med nhu code cu. Day la dung chuoi ma muc 2 mo ta la loi cu. |
| N1 Buoc 5 manifest viet dung | PASS | Manifest buoc 5 ghi ro: tat tab BINH THUONG giua luc load se KHONG hien dong ha muc (pagehide xoa co), chi (a) kill/crash that truoc 15 giay hoac (b) seed tay `localStorage.setItem('hanoi:crash', '1')` roi tai lai moi thay dong do; va kiem tra them `localStorage hanoi:quality` phai la muc thap hon. Dung ca 2 yeu cau cua N1. Nit nho khong chan: neu stored da la low thi seed crash cung khong ha them duoc (at-low), manifest khong ghi ro truong hop nay. |
| N3 Regex moi khop url: A.basicGrandUrl | PASS | check-basic.mjs dong 46 regex `/if \(!hanoi\) glbJobs\.push\(\{ key: 'basicGrand', url: A\.basicGrandUrl/` - loader.js dong 686 ghi dung chu do: `if (!hanoi) glbJobs.push({ key: 'basicGrand', url: A.basicGrandUrl, ...`. Chay that: check-basic ALL BASIC CHECKS PASSED. |
| Hoi quy: khong con dang B1 nao khac | PASS | Grep `QUALITY_KEY\|hanoi:quality` trong src/ ngoai quality-scaler.js chi co comment o main.js:37 va comment B1 o main.js:55 - khong co cho ghi nao khac. Moi cho ghi quality deu da doi chieu o B1-3. |
| 0 dau gach dai trong file da doi o lan sua nay | PASS | Python dem ky tu that U+2013/U+2014: src/main.js 0/0, src/render/quality-scaler.js 0/0, tools/check-3d.mjs 0/0, tools/check-basic.mjs 0/0, docs/phase-3d-manifest.md 0/0, docs/phase-3d-verification.md 0/0. 1 hit grep "u2013" trong check-3d.mjs dong 38 chi la chu escape `\u2013` trong regex cua chinh test do, khong phai dau gach that (da ghi nhan tu lan verify truoc). |

### 10.2 Luu y ve do bao phu cua 8 check moi (khong chan GO)

- 8 check chia 2 lop: lop hanh vi (so 1-6) test helper persistDowngradedQuality + downgradeForCrash + readStoredQuality tren storage gia; lop tinh (so 7-8) test main.js co goi persist trong nhanh crash va nhanh do co dieu kien forced.
- Han che da chung minh bang mo phong revert: neu chi revert loi goi `persistDowngradedQuality(storage, down.level)` trong main.js ma giu nguyen helper, thi check 1-6 VAN PASS (vi chung goi thang helper, khong di qua main.js); chi check tinh so 7 FAIL. Nguoc lai, neu helper bi hong (vd ghi sai key) thi check 1-6 FAIL. Hai lop bo cho nhau, to hop lai bao phu du ca 2 dang hong. Chi co check so 7 la tuyen phong thu duy nhat cho viec noi day main.js, nhung no co that va dang PASS, nen du dieu kien.
- De xuat cho lan sau (khong bat buoc): them 1 check chay that boot sequence cua main.js (neu tach duoc logic boot khoi DOM) de lop hanh vi cung di qua duong day that, thay vi chi qua helper.

### 10.3 So do chay lai that do verifier chay (khong lay so fixer)

- npm run build: PASS, vite 8.3.8, 65 modules, bundle dist/assets/index-DAAKMfNl.js 1.111.875 byte, gzip 337.09 kB, build 901ms. Hash + byte TRUNG KHOP tuyet doi voi fixer tuyen bo (index-DAAKMfNl.js, 1.111.875 byte).
- npm run check:hanoi: ALL CHECKS PASSED, 1600 o resolve, 0 unresolved.
- node tools/check-3d.mjs: 115 PASS, 0 FAIL, ALL 3D CHECKS PASSED (107 cu + 8 moi (f/B1)). In: first-load truoc 20.67 MB, sau 16.04 MB, deferred 4.63 MB, texture 7.03 MB - trung so lan verify truoc.
- node tools/check-2e.mjs: 104 PASS, 0 FAIL.
- node tools/check-basic.mjs: ALL BASIC CHECKS PASSED (atlas 200 sprite).
- node tools/check-2b.mjs: ALL 2B CHECKS PASSED. check-2c: ALL 2C CHECKS PASSED. check-2d: ALL 2D CHECKS PASSED.
- node --check: 4/4 OK (src/main.js, src/render/quality-scaler.js, tools/check-3d.mjs, tools/check-basic.mjs).
- Script revert rieng /tmp/b1-revert-proof.mjs: slice moi chua persist = true, slice cu (revert) chua persist = false, check tinh so 7 FAIL tren code cu / PASS tren code moi - CONFIRMED.

### 10.4 Loi con lai

- Khong con blocker. Khong con loi moi.
- Nit nho (khong chan GO): manifest buoc 5 khong ghi ro truong hop stored da la low thi seed crash se khong ha them (hien dong bao loi at-low thay vi dong ha muc). User test theo buoc 5 nen bat dau tu stored high hoac med de thay duoc dong ha muc.
- Van chua ket luan duoc trong sandbox (giong muc 8): 3D-10 - thoi gian toi frame dau (giay), FPS o spawn (?fps=1), dong ha muc nhin that tren may user. Can do tren may user sau khi GO.

### 10.5 Ket luan GO / NO-GO CUOI CUNG cho Phase 3D

- GO cho Phase 3D (phien ban code). Blocker B1 da duoc sua dung va du: muc ha sau crash gio duoc luu ngay vao hanoi:quality trong dung nhanh crash, co guard + khong throw, khong ghi de ?quality= ep; 8 check moi co that, bao phu du ca 2 dang hong (helper hong + loi goi main.js bi revert), 115/115 PASS; N1 + N3 deu da sua dung; build + 7 bo check deu xanh voi so do chay lai trung khop tuyet doi.
- Dieu kien truoc khi dua user test: chi can test buoc 5 theo manifest moi (kill/crash that hoac seed tay hanoi:crash=1, kiem tra hanoi:quality ha 1 nac). Sau do van can do 3 so 3D-10 tren may user (giay toi frame dau, FPS spawn, % res) de ket luan muc 3D-10 - day la viec do, khong phai loi code, khong chan GO.
