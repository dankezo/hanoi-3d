# Hanoi 3D - Phase 3D manifest (loading % + muot)

Ngay: 2026-11-21. Fixer: Phase 3D agent. Trang thai: da build + verify bang
code, script va build. KHONG push, KHONG commit, KHONG upload binary - moi
thay doi nam trong working tree cua ~/workspace/hanoi-3d/ (repo
https://github.com/dankezo/hanoi-3d).

Co so: Phase 3F-quick vua xong va verify GO (index.html + landmarks.js:
cursor hien, minimap 168px, dia so). Spec duy nhat:
docs/phase-3-spec.md (muc 2.4, muc 3 phase 3D, muc 4 tieu chi 3D, muc 6
trap T1-T10, phu luc A phan Ocean City). Mau cong nghe muon tu Ocean City:
~/workspace/lightwaterworld/source/template.html (say(), man hinh load),
source/src/quality.js (device tier, co crash abyssalLoad),
source/src/main.js (dynamic resolution pix/det, slow-load 8 giay).

Quy tac giu nguyen: chi dau gach ngan "-" trong moi file. KHONG doi preset
QUALITY, KHONG doi scaler EMA, KHONG doi post pass, KHONG doi key luu
hanoi:v1:, KHONG doi file tiles.glb goc. Q12: thanh % don gian tren nen
giay kem, KHONG lam animation mo sach.

## 3D-01 - Man hinh loading co % lon + ten giai doan

- Lam gi: overlay toan man hinh hien ngay khi mo trang (HTML tinh, khong
  doi module JS load xong): nen giay kem #efe0c2, chu nau #5a3a28, so %
  lon 64px, thanh tien trinh chay bang scaleX (transform-origin left,
  transition transform 0.3s - chay tren compositor, khong ket khi main
  thread ban), dong trang thai, dong thiet bi ("Dien thoai - Medium" /
  "May tinh - High"). Ham setLoad(pct, status) trong main.js dat % so,
  thanh bar va dong trang thai tu cung 1 gia tri (muon say() cua Ocean
  City), nen 3 thu khong bao gio lech nhau. Moc giai doan, moi moc gan
  1 job that: 5% "Chuan bi..." (tier + co crash + tao renderer),
  20% "Tai ban do..." (bat dau load GLB), 45% "Dung nha ong..." (bat dau
  load texture), 70% "Ve ho..." (world da dung xong), 90% "Dang gap
  giay..." (frame dau tien), 100% "Xong!" (loop chay, overlay mo dan
  roi an). Overlay an bang class .done (opacity + visibility, 0.45s).
- File doi: index.html (div #load + CSS), src/main.js (setLoad,
  hideLoad, cac moc).

## 3D-02 - DA ROLLBACK - ly do: spec gia dinh sai, 1543/1600 o la model stock; bo tiles.glb se lam 96% map thanh placeholder phang, trai voi yeu cau realism cua user

- Quyet dinh (2026-11-21, coordinator): ROLLBACK 3D-02 cho tiles.glb,
  giu lai moi thu khac cua Phase 3D. Ly do: spec 3D-02 gia dinh Hanoi
  khong dung tile WFC nao, nhung dem that tu HANOI_ROWS + HANOI_LEGEND
  cho thay map Hanoi dung 14 id model stock tren 1543/1600 o, chi 57 o
  dung model Hanoi-only. Bo fetch tiles.glb nghia la 1543 o (96% map)
  ve bang placeholder RECIPES phang don sac trong loader.js, mat art
  GLB cua mat dat / rung / ho / duong. User duyet Phase 3 voi nhan
  manh "cang giong cang realistic, vibe pho co toan map cang tot" -
  realism la uu tien cao nhat, nen danh doi nay KHONG chap nhan duoc.
- Lam gi khi rollback: bo gate `if (!hanoi)` truoc glbJobs.push tiles
  trong src/assets/loader.js (dung 1 dong, theo dung cach lui da ghi
  san o ban truoc) - o che do Hanoi lai fetch tiles.glb nhu truoc
  Phase 3D. GIU NGUYEN gate chan basic-grand.glb o che do Hanoi (dung
  - Hanoi khong dung 6 model grand do, chi non-Hanoi moi dung). Che do
  WFC mac dinh khong doi: van fetch tiles.glb + basic-grand.glb.
- So o giu nguyen (dem bang script, check-3d muc (c) giu lai lam tai
  lieu giai thich vi sao phai fetch): meadow 761, forest 243, grove 90,
  pond 90, river_straight 71, path_straight 100, meadow_flowers 65,
  path_end 19, path_cross 7, path_t 10, hills 74, river_source 6,
  lantern_post 2, rocks 5 - tong 1543 o stock; 57 o Hanoi-only (25
  model, GLB art tu hanoi-tiles.glb). Cell 'y' (house stock) co 0 o
  trong map hien tai nen khong anh huong.
- Phuong an tuong lai (KHONG lam o day): lazy-load tiles.glb sau frame
  dau - frame dau ve nhanh bang placeholder roi doi art GLB khi file
  ve, giu duoc ca first-frame nhanh va du art. Can thiet ke rieng
  (doi prototype sau khi BatchedMesh da dung, tranh pop) truoc khi lam.
- File doi: src/assets/loader.js (bo gate hanoi cua tiles.glb, giu gate
  cua basic-grand.glb), tools/check-3d.mjs (muc (c) + (j) doi theo),
  file nay (muc 3D-02 + bang 3D-10 + ket qua build/check).

## 3D-03 - Hoan animals.png 4.5 MB sau frame dau

- Lam gi: main.js KHONG await animals.ready truoc loop.start() nua -
  loop chay truoc, animals.json + animals.png (4.63 MB) load nen sau.
  Khi sheet ve, dong vat hien dan trong 2.5 giay (fadeK trong
  animals.js: 0 -> 1, nhan vao scale moi card o write()). Spawn table
  (specsFor, CONFIG.animals.spawns) khong doi 1 dong.
- File doi: src/main.js (bo await, them comment), src/life/animals.js
  (fadeK, FADE_IN_S = 2.5).

## 3D-04 - Tien trinh that cho GLB

- Lam gi: Promise.all cu trong loadAssets tach thanh 3 giai doan chay
  noi tiep (job trong 1 giai doan van song song): (1) GLB - main.js map
  20-45%, (2) texture - map 45-65%, (3) meta assets_meta.json. Moi job
  co onProgress that tu GLTFLoader.loadAsync / TextureLoader.loadAsync
  (loaded/total theo byte, fallback loaded / kich thuoc du kien khi
  server khong gui Content-Length). Stage fraction = tong co trong so
  theo byte (GLB_BYTES do tu public/models; texture lay truong bytes
  trong manifest.json, rieng atlas.webp dung 2568020). onProgress bao
  { stage, file, fileLabel, loaded, total, stageFraction } ve main.js.
- Moc gia (ghi ro): (a) fetchJSON assets_meta.json (105 KB) khong co
  progress event - main.js nhay % khi no ve, comment "MOC GIA" o ca
  loader.js va main.js; (b) cac moc bien 5/70/90/100 la bien job (khong
  co byte de do) nhung moi moc gan 1 job that da xong, khong phai timer
  tu chay; (c) neu manifest.json mat, giai doan texture khong bao
  progress va % dung o 45% cho toi khi xong.
- File doi: src/assets/loader.js (stageTracker, GLB_BYTES, loadGLTF /
  loadTexture / loadTextures nhan onProgress), src/main.js (onProgress
  map %).

## 3D-05 - Tier truoc load theo thiet bi that

- Lam gi: resolveDeviceTier() trong quality-scaler.js, muon Ocean City
  quality.js, KHONG dung user-agent sniffing: chi doc
  navigator.deviceMemory + navigator.hardwareConcurrency +
  min(screen.width, screen.height) + pointer coarse (isTouchDevice cu).
  Dien thoai: RAM <= 4 GB hoac <= 4 nhan hoac canh man hinh nho nhat
  <= 360px thi bat dau o low, dien thoai con lai bat dau o med.
  Desktop: RAM <= 4 GB bat dau o med, con lai high. Khac Ocean City
  1 cho theo task: desktop RAM thap ve med (Ocean City ve low).
  Mem undefined khong tinh la thap; cores mac dinh 4 khi khong biet
  (giong Ocean City); canh man hinh 0 (khong biet) thi bo qua, khong
  tinh la thap; probe loi thi ve desktop high, khong crash.
- Thu tu uu tien giu nguyen tu 2E, chi thay nhanh fallback cuoi:
  explicit ?quality= > stored hanoi:quality > tier thiet bi moi > (neu
  khong co tier) quy tac touch cu (phone med, desktop high).
- File doi: src/render/quality-scaler.js (resolveDeviceTier,
  deviceTierLabel, resolveInitialQuality them fallback),
  src/main.js (goi resolveDeviceTier, truyen fallback).

## 3D-06 - Co crash: tu xuong 1 muc sau lan sap truoc

- Lam gi: muon Ocean City abyssalLoad, key localStorage hanoi:crash.
  markBootStart() set co khi module main.js load (truoc moi thu);
  markBootSurvived() xoa co sau 15 giay chay on (setTimeout sau
  loop.start) va khi pagehide sach (dong tab binh thuong khong tinh
  la crash). Lan vao sau ma co van con thi tu dong xuong 1 muc
  (high -> med -> low). O muc low roi thi khong xuong duoc nua, hien
  loi tren man hinh load: "Lan truoc game bi sap o muc Low, thu dong
  bot tab khac roi tai lai." Truong hop ha muc cung hien ro tren man
  hinh load: "Lan truoc game bi sap nen giam xuong muc Medium."
  (hoac Low). Khong am tham doi muc. Co KHONG ghi de ?quality= (giong
  quy tac forced cua 2E). Boot loi truoc 15 giay cung de lai co (giong
  Ocean City) - lan sau se ha muc.
- Sua B1 (2026-11-21, sau verify NO-GO cua verifier doc lap): muc da ha
  gio duoc luu NGAY vao hanoi:quality bang ham moi
  persistDowngradedQuality(storage, down.level) trong quality-scaler.js
  (cung key QUALITY_KEY nhu persist() cua scaler, khong throw bao gio),
  goi ngay sau khi ha muc trong main.js, chi trong nhanh crash (nhanh
  nay khong chay khi ?quality= ep, nen khong ghi de lua chon ep).
  Truoc sua: stored high, crash o high, lan sau boot o med nhung storage
  van high, lan sau nua lai boot o high, crash lap theo chu ky va khong
  bao gio xuong low. Sau sua: lan 2 boot o med va storage la med, crash
  nua thi lan 3 boot o low va storage la low. Check moi trong check-3d
  muc (f/B1) test dung chuoi nay bang storage gia + kiem tra tinh trong
  main.js rang lenh luu nam trong nhanh ha muc (check tinh nay FAIL
  tren code cu, theo thiet ke).
- File doi: src/render/quality-scaler.js (CRASH_KEY, CRASH_SURVIVE_MS,
  markBootStart, markBootSurvived, hadCrash, downgradeForCrash),
  src/main.js (doc co truoc khi set, tinh crashNote, setTimeout 15s,
  pagehide listener, hien crashNote o #load-note).

## 3D-07 - Dynamic resolution lien tuc (pixScale)

- Lam gi: vong trong muot hon ben canh scaler 2E (vong ngoai, doi preset
  roi rac). createPixScale() trong quality-scaler.js: bien pixScale
  0.5-1.0, nhan vao pixel ratio cap theo level trong renderer.js
  (cappedDpr x pixScale) nen doi ca renderer.setPixelRatio va kich
  thuoc render target cua post (post.setSize doc drawing buffer size,
  rebuild target khi doi). Doc EMA FPS san co tu scaler: cham (EMA
  < 45) thi target giam buoc 0.1, nhanh (EMA > 58) thi target tang
  buoc 0.1, danh gia 1 giay/lan. Rebuild chi khi doi tu gia tri dang
  render vuot 15% - buoc 0.1 don le khong gay hitch; ngoai le: 2 cuc
  1.0 va 0.5 luon rebuild de may nhanh that su ve duoc full resolution
  (buoc cuoi len 1.0 chi 11% nen khong co ngoai le nay se ket o 0.9
  mai). Quy tac chong danh nhau: pixScale khong doi khi scaler doi
  preset trong 2 giay gan nhat (doc scaler.msSinceStep, reset ve 0
  moi step). KHONG muon: reload toan trang de doi tier, timestamp
  query cua WebGPU.
- File doi: src/render/quality-scaler.js (createPixScale, PIXSCALE_*,
  scaler.msSinceStep), src/render/renderer.js (pixScale, setPixScale,
  getPixScale), src/main.js (tao pixScale, tick moi frame, onApply
  goi setRendererPixScale + resize()).

## 3D-08 - Dong "Still loading..." sau 8 giay

- Lam gi: setTimeout 8000 ms trong boot(): neu load chua xong thi hien
  #load-slow: "Dang tai cham, vui long doi... (hanoi-tiles.glb 2.4 MB)"
  - ten file lay tu bao cao onProgress gan nhat (lastLoadFile). Neu
  chua co bao cao file nao thi chi hien cau doi, khong ten file.
  Muon Ocean City (slow line sau 8 giay, tuy theo tier).
- File doi: index.html (p #load-slow), src/main.js (timer 8s).

## 3D-09 - ?fps=1 them worst-frame + % resolution

- Lam gi: chi khi ?fps=1, mac dinh tat (khong doi hanh vi mac dinh).
  main.js theo doi frame te nhat (ms) trong cua so 1 giay truoc
  (worstMs, reset moi giay). createFpsReadout.update() nhan them
  extra { worstMs, pixPct } va hien: "fps 60 high worst 34ms res 80%".
  Khong co extra thi giu format cu "fps 60 high" (check-2e khong vo).
- File doi: src/render/quality-scaler.js (update them extra),
  src/main.js (worstMs, truyen pixScale.percent).

## 3D-10 - Do truoc/sau bang so that

- Bang first-load o che do Hanoi (byte do that tu o dia, 1 MB =
  1.000.000 byte; tong do tools/check-3d.mjs tu tinnh lai moi lan
  chay, khong phai so chep tay):

| File (che do Hanoi) | Truoc (byte) | Sau (byte) |
| --- | --- | --- |
| tiles.glb | 6.147.140 | 6.147.140 (fetch lai sau rollback 3D-02) |
| hanoi-tiles.glb | 2.496.552 | 2.496.552 |
| traveller.glb | 85.024 | 85.024 |
| texture rieng biet (10 file, xem duoi) | 7.033.841 | 7.033.841 |
| textures/manifest.json | 7.723 | 7.723 |
| models/assets_meta.json | 105.222 | 105.222 |
| textures/art/atlas.json | 169.008 | 169.008 |
| animals.png + animals.json | 4.626.222 (truoc frame dau) | 0 truoc frame dau, 4.626.222 sau frame dau |
| TONG truoc frame dau | 20.670.732 = 20.67 MB | 16.044.510 = 16.04 MB |
| TONG cong (ke ca sau frame dau) | 20.67 MB | 20.67 MB |

- Texture rieng biet (7.03 MB): card_albedo.png 667.665,
  card_normal.jpg 656.249, paper_rough.png 36.637, page_albedo.png
  618.366, page_normal.jpg 640.580, edge_strip.png 176.235,
  print_atlas.png 1.543.614, table_wood.jpg 77.122, blue_noise.png
  49.353, art/atlas.webp 2.568.020. pagePaperRough trung file
  paper_rough.png nen chi tinh 1 lan (browser cache hit lan 2).
  Khong tinh: manifest.json lan 2 (materials.js selfLoad, cache hit,
  0 byte moi), game_icons.png (chi fetch khi mo atlas, khong phai
  first-load), country.is (lookup IP 2C, fire-and-forget, vai tram
  byte), edge API (mac dinh tat, 0 call).
- Tiet kiem truoc frame dau: 20.67 - 16.04 = 4.63 MB (-22.4%), chi tu
  3D-03 (hoan animals sau frame dau). Rollback 3D-02 tra lai 6.15 MB
  tiles.glb vao first-load de giu art GLB cho 1543 o stock - danh doi
  lay realism theo yeu cau cua user.
  Che do WFC khong doi: ~18.88 MB (tiles 6.15 + basic-grand 0.70 +
  traveller 0.09 + texture 7.03 + manifest 0.01 + meta 0.11 +
  atlas.json 0.17 + animals 4.63).
- So KHONG do duoc trong sandbox (khong co trinh duyet that, khong
  GPU): thoi gian toi frame dau (giay), FPS o spawn (?fps=1), thoi
  gian load that tren mang that. Ghi ro: CAN DO TREN MAY USER - xem
  muc "Diem con thieu" ben duoi. Khong nhan "muot hon" neu khong co so.

## File doi (day du)

- index.html - overlay #load + CSS (3D-01, 3D-08). KHONG cham dong
  "0/10" (verifier 3F dan: se do 3B sua khi them landmark thu 11).
- src/main.js - boot sequence, setLoad/hideLoad, milestone, onProgress,
  device tier + co crash, pixScale wiring, worst frame, bo await
  animals.ready, loi boot hien len man load (3D-01..3D-09).
- src/assets/loader.js - gate hanoi chi cho basic-grand.glb (tiles.glb
  fetch ca 2 che do sau rollback 3D-02), tach Promise.all thanh giai
  doan GLB/texture/meta, onProgress that (3D-02, 3D-04).
- src/life/animals.js - fadeK fade-in 2.5s (3D-03).
- src/render/quality-scaler.js - resolveDeviceTier, co crash,
  createPixScale, msSinceStep, fps readout them worst/res (3D-05,
  3D-06, 3D-07, 3D-09).
- src/render/renderer.js - pixScale x pixel ratio, setPixScale /
  getPixScale (3D-07).
- tools/check-3d.mjs - MOI, check script 3D (xem duoi); lan sua B1 them
  8 muc (f/B1) ve luu muc ha sau crash.
- tools/check-basic.mjs - lan sua B1 (nit N3): regex basic-grand mo
  rong toi `url: A.basicGrandUrl` tren cung dong.
- docs/phase-3d-manifest.md - file nay.
- KHONG doi: preset QUALITY, scaler EMA, post pass, key hanoi:v1:,
  file tiles.glb goc, spawn table animals, hanoi-map.js, landmarks.js.

## Ket qua build + check

- npm run build (sau sua B1, 2026-11-21): PASS, vite 8.3.8, 65 modules,
  bundle cuoi dist/assets/index-DAAKMfNl.js (1.111.875 byte, gzip
  337.09 kB), build 809ms. (Truoc sua B1: index-CpTtoqEt.js,
  1.111.824 byte.)
- node --check: 4/4 file JS sua o lan B1 deu pass (main.js,
  quality-scaler.js, check-3d.mjs, check-basic.mjs).
- npm run check:hanoi: ALL CHECKS PASSED (1600 o resolve, 0 unresolved).
- node tools/check-3d.mjs: 115 PASS, 0 FAIL - ALL 3D CHECKS PASSED
  (107 cu + 8 muc moi (f/B1) ve luu muc ha sau crash).
  In: first-load truoc 20.67 MB, sau 16.04 MB, deferred 4.63 MB,
  texture 7.03 MB (so do that tu o dia moi lan chay).
- Chung minh check moi bat duoc loi cu: chay slice-check tren nhanh
  crash cua code cu (khong co lenh luu) thi FAIL, tren code moi thi
  PASS (script tam /tmp/b1-regression-proof.mjs, da xoa sau khi chay).
- Hoi quy (khong co phase nao vo vi 3D): check-2b ALL 2B CHECKS
  PASSED, check-2c 89 PASS 0 FAIL, check-2d 139 PASS 0 FAIL,
  check-2e 104 PASS 0 FAIL, check-basic ALL BASIC CHECKS PASSED.
- 2 sua trong luc verify (khong doi hanh vi, chi sua cho check cu
  khop dang moi): (1) catch line trong main.js ve dung chu cu
  "scaler = null; fpsReadout = null;" vi pixScale da la null san khi
  try loi (check-2e tung FAIL 1 muc vi chu nay, gio 104/104);
  (2) 1 assertion trong tools/check-basic.mjs doi tu dang cu
  "!hanoi ? loadGLTF(A.basicGrandUrl)" sang dang moi
  "if (!hanoi) glbJobs.push({ key: 'basicGrand'" (cung hanh vi, chi
  khac hinh thuc sau khi tach Promise.all); lan sua B1 (nit N3) mo
  rong regex nay toi `url: A.basicGrandUrl` tren cung dong.
- Long dash: 0 dau trong moi file 3D (check-3d co muc dash rieng;
  1 hit grep "u2013" trong check-3d.mjs chi la chu escape trong regex
  cua chinh test do, giong truong hop check-2e da ghi nhan).
- KHONG commit, KHONG push, KHONG upload binary (theo task).

## Cach tu kiem tra bang mat (tren may user)

1. Mo tab an danh ?map=hanoi: thay ngay man hinh giay kem, % lon chay
   0 -> 100 kem ten giai doan (Chuan bi, Tai ban do, Dung nha ong,
   Ve ho, Dang gap giay, Xong!), dong thiet bi (vd "Dien thoai -
   Medium"). Khong con man hinh nau toi dung im.
2. Mang cham (hoac load lan dau, chua cache): sau 8 giay thay dong
   "Dang tai cham, vui long doi... (ten file + MB)".
3. Vao game: dong vat (meo, cuu...) hien dan trong 2-3 giay dau, khong
   pop 1 phat. Map van du o, khong o trong, khong loi.
4. ?fps=1: goc duoi-trai hien "fps <so> <muc> worst <ms>ms res <%>".
   Cho 2 phut o spawn, ghi 3 so: fps, worst, res%.
5. Cach thay dong ha muc (sua theo nit N1 cua verifier - buoc cu sai):
   tat tab BINH THUONG giua luc load se KHONG hien dong do, vi pagehide
   xoa co crash truoc khi tab dong. Muon thay dong do, lam 1 trong 2
   cach: (a) kill tab / crash that giua luc load (truoc 15 giay), khong
   dong tab binh thuong; (b) seed tay: mo DevTools console, chay
   localStorage.setItem('hanoi:crash', '1'), roi tai lai trang. Lan sau
   thay dong "Lan truoc game bi sap nen giam xuong muc ..." va muc thap
   hon 1 nac. Kiem tra muc da luu ben: localStorage hanoi:quality phai
   la muc thap hon (vd med khi truoc la high). Mo binh thuong, choi qua
   15 giay, tat mo lai: khong co dong do.
6. Dien thoai RAM <= 4 GB / <= 4 nhan: dong thiet bi ghi Low, game bat
   dau o low (khong lag o man hinh load).
7. So sanh mat (sau rollback 3D-02): cay / rung / duong / ao phai co art
   GLB nhu truoc Phase 3D, khong don gian dang placeholder. Neu thay
   placeholder phang o dau, bao lai ngay.

## Diem con thieu / chua xong

- Chua do duoc: thoi gian toi frame dau truoc/sau (giay), FPS o spawn
  truoc/sau (?fps=1), thoi gian load that tren mang that. CAN DO TREN
  MAY USER, cung may, cung mang, do ca truoc (bundle cu) va sau
  (bundle moi) roi dien vao bang 3D-10. Tieu chi pass 3D theo spec:
  thoi gian toi frame dau giam it nhat 30%.
- Chua nhin thay that: man hinh load, fade-in dong vat, readout moi,
  dong slow-load, dong crash - tat ca moi chi verify bang code +
  script, khong co render that trong sandbox (khong co headless
  Chromium/Playwright, giong trap T8).
- 3D-02 DA ROLLBACK (2026-11-21): tiles.glb lai fetch o che do Hanoi,
  1504 o giu art GLB. Phuong an lazy-load tiles.glb sau frame dau la
  viec tuong lai, chua thiet ke (xem muc 3D-02).
- pixScale chua co so that: tren may that moi biet no co tranh duoc
  step preset khong, va co hitch khi rebuild target khong.
- Co crash: chua test that ki nang tat tab giua load (chi test logic
  bang fake storage trong check-3d).
- Impeccable detect hang 6/6 lan truoc (trap T9) - khong chay lai o
  phase nay vi biet truoc se hang; ghi nhan, khong phai verdict.

## Cap nhat Phase 3A (2026-11-21, khong sua so 3D goc o tren)

- Phase 3A them 16 model Hanoi-only (25 thanh 41) va doi 47 o map: o stock
  1543 thanh 1504, o Hanoi-only 57 thanh 96. Ly do 3D-02 rollback van dung:
  1504/1600 o (94% map) van can tiles.glb de giu art GLB.
- hanoi-tiles.glb 2.496.552 byte thanh 3.209.100 byte (3,21 MB, duoi muc 3,5 MB).
- Tong first-load: truoc 20.67 MB thanh 21.38 MB, sau 16.04 MB thanh 16.76 MB,
  deferred van 4.63 MB (chi rieng dong vat, khong doi).
- Vong sua 3A (2026-11-21, sau verify doc lap): GLB them 8 hero card chu bien
  (+38.052 byte, thanh 3.247.152 byte), atlas.webp them 6 sprite chu (nen lai
  nho hon 26.912 byte, thanh 2.541.108 byte), atlas.json +2.924 byte. Tong
  first-load doi thanh truoc 21.40 MB, sau 16.77 MB (check-3d (j) cap nhat
  theo so do that; so 3D goc 20.67 / 16.04 o tren khong doi).
