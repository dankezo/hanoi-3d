# Phase 3 spec - Hanoi 3D: Rework toan map theo vibe Ha Noi that

- Ngay: 2026-11-21
- Trang thai: CHO USER DUYET - chua build, chua sua code, chua push
- Co so: Phase 2 da live (text commit ca3efda5 + binary 96d97b4 + 044cbe7, bundle live index-C0ja968t.js, deploy run 44864612602 success)
- Quy tac: chi dung dau gach ngan "-" (khong dung gach dai). Spec la checklist danh so, user duyet TRUOC khi build, theo quality gate da duyet ngay 2026-11-19
- Don vi trong spec: 1 tile = 2 world unit. Traveller cao 0.6. Flap cao toi da hien tai 1.49 (cathedral, phase 2B). Luoi map 40x40, x,z trong [-20,19], spawn (0,0)

## 0. Phan hoi cua user ngay 2026-11-21 va su that kiem chung tu code

User noi (giu nguyen y):

1. The info hien ra vo duyen: chu nhieu va be, khong ro khi nao thi hien.
2. Duong pho cha giong Ha Noi gi ca, kieu van map cu.
3. Ho Tay phai lon hon; Ho Guom phai co Thap Rua o giua ho.
4. Thanh pho sao lai co chuong/trai (farm/barn props trong map thanh pho la sai vibe).
5. Can 1 ban mo ta sieu ky sieu thuc ve duong pho Ha Noi, co anh.
6. Rework nhieu step that ky, dam bao ca map mang vibe Ha Noi.
7. Luc dau vao: trang load phai hien % ro rang; vao hoi do/lag - ap dung cong nghe tu Ocean City de chay muot hon.
8. Thiet ke tau 2-3 toa chay quanh map neu duoc.
9. Khi di chuot lai khong thay con tro chuot.
10. Cac dia diem hoi kho locate: tim thu vien/icon cac dia danh noi tieng cho vao map; map (minimap) cho to hon chut.

Su that kiem chung tu code (audit ngay 2026-11-21, chi doc khong sua):

- A. Trong map Hanoi KHONG co tile farm/barn nao. Legend hanoi-map.js khong co ky tu nao map toi barn_farm; dem 1600 o: 0 o farm. Cai gan nhat la Lang Bac: hanoi_mausoleum muon nguyen socket S(g,g,g,g) va tag cua barn_farm (src/core/models.js:95), vi tri (-12,3). Placeholder cua no la khoi nau/kraft + cua den, khong co silo/rom/hang rao. Dong vat farm cung khong spawn o Hanoi vi key theo tile id barn_farm. "Great barn" cua phase 2A chi load khi KHONG phai Hanoi mode (loader.js:631). Ket luan: thu user thay giong chuong/trai kha nang la placeholder Lang Bac hoac nha Pho Co dang generic - spec 3A co muc audit lai toan bo model trong map de doi ten/xoa moi thu trong giong nong thon, va Q11 hoi user chi ro toa nao.
- B. Ho Guom hien chi 11 o: rect [-3,-2,1,-1] = 5x2, trong do 9 o pond, 1 o W (Thap Rua) tai (-1,-2), 1 o causeway (-1,-1). Thap Rua dung cot giua theo chieu ngang nhung lech ve bo bac vi ho chi cao 2 hang. Ho Tay 112 o, 74 o pond, chua Tran Quoc M tai (-9,-11) o mep dong cua rect, tuc o tren bo chu khong nam trong nuoc.
- C. The info (#lm-info): tu mo ngay khi discovery (ban kinh 1 o Chebyshev, vo hinh, khong co vong bao tren dat, khong co icon "!" tren landmark); tu dong khi di ra khoi ban kinh 1 (dang doc do buoc 1 o la mat); noi dung ca 2 ngon ngu xep chong (3 bullet lich su VI + 3 bullet EN + 1 fun fact VI + 1 fun fact EN + link nguon = 8 khoi, ~9-11 cau); chu 12.5px trong hop cao toi da 52vh, phai cuon trong; toast o bottom 11vh hien 3.4 giay chong len the o bottom 21vh. Day la goc cua ca 4 loi user che.
- D. Loading: KHONG co man hinh loading, KHONG co %, KHONG co spinner. index.html chi co nen nau toi #1c130d trong suot luc await loadAssets. First-load ~19-20 MB: tiles.glb 5.9 MB (file don lon nhat, LUON load ca o che do Hanoi du Hanoi khong dung tile WFC), hanoi-tiles.glb 2.4 MB, textures ~7 MB (atlas.webp 2.5 MB), animals.png 4.5 MB (chan frame dau vi main.js await animals.ready).
- E. Chuot: BI AN TOAN CUC. index.html:27-28 dat cursor: none cho html, body va canvas#atlas (ke thua tu Papertrails goc). Chi 4 cho hien lai con tro pointer: nut toggle ngon ngu, head the info, nut X, item checklist. Day la bug UX, khong phai loi render.
- F. Minimap: canvas 160x160 noi bo, CSS 132x132 goc duoi-phai, moi o = 4px. Landmark chi la cham tron r=3px mau dat nung #b9603f (da kham pha to dac, chua chi vien). Khong icon, khong ten, khong so, 10 landmark giong het nhau. Khong la ban, khong zoom, khong tap de di chuyen.
- G. Chat luong/scaler (phase 2E): level low/med/high, xuong khi EMA FPS < 45 giu 2 giay, len khi > 58 giu 3 giay, cooldown 2 giay; dien thoai bat dau o med, DPR cap 1.5 khi touch; ?fps=1 hien "fps <so> <muc>" goc duoi-trai. Da co, giu nguyen lam vong ngoai.
- H. Trap cung: solver option WFC dang 95/96, chi con 1 slot trong. Them 1 signature socket moi = 96 (vua du), them 2 = crash toan bo solver. Mọi tile moi phase 3 phai tai dung signature socket da co hoac thay the tile cu. Hanoi model nam ngoai MODELS (registry rieng hanoi-models.js, hien 25 model) nen khong tinh vao 95.

## 1. Chuan vibe Ha Noi - anh tham chieu cua user + nghien cuu web

### 1.1 Nam anh user gui (chuan vibe, dung lam goc doi chieu khi duyet build)

- Anh 1 - image-ccda9c01.png: goc Pho Co (Ta Hien). Nha ong vang 3-4 tang, mat tien hep, ban cong sat, cua chop xanh, bien "Tiger BIA PHO CO", "Tiger CRYSTAL" neon xanh, "Hanoi BOLD & Light" chu xanh, "Truc Bach PARAMOUNT BEER" bang hong, bien do "27 TA HIEN", xe o to trang, duong lat gach.
- Anh 2 - image-d53ec7d2.png: dai lo rop cay, 2 hang co do sao vang doc 2 ben duong, xe may dong, duong nhua rong, cay xanh cao, bang ron do.
- Anh 3 - image-851b976c.png: pho Dang Tat. Cay co thu than to, tan khum kin, la vang roi day via he, den duong cau trang cot xanh, bien ten pho xanh "PHO DANG TAT", bang ron do "30-4 1975-2020" chu vang, o to do, duong uot sau mua.
- Anh 4 - image-4cc4c4c1.png: via he rong, tuong ve tranh dan gian (chu Tieu, dong ho), bien mot chieu xanh, cay xanh 2 ben, duong vang, it xe.
- Anh 5 - image.jpg: ngo hep. Co do sao vang treo day 2 ben, day dien chang chit nhu mang nhen, nha ong san sat, o to den, xe may, bien tron vang, thung hong.

### 1.2 So lieu that dung lam chuan (nguon o Phu luc A)

- Nha ong: mat tien 2-4 m (nha cu truoc 1954: 2-5 m), sau 50-70 m (co nha toi 100 m), 1-2 tang dang co truyen, 3-8 tang dang pho bien hien nay, nha moi toi 12 tang van giu mat tien hep. Tang tret ban hang, tren de o. Mai ngoi do cong dang co; biet thu Phap 2-3 tang co lan can gang, cua chop, mai vom. Pho Co con 1.153 nha ong truyen thong. Nguon: en.wikipedia.org/wiki/Tube_house, kientrucvietnam.org.vn.
- Bien hieu that: "Tiger BIA PHO CO" (bien vang, lap lai nhieu anh nhat), "Tiger CRYSTAL" neon xanh duong, "BIA HOI HA NOI" chu noi cam, "Truc Bach" chu thao trang, "PARAMOUNT BEER" bang hong, "Hanoi BOLD & Light" chu xanh, bang ron vang HABECO. Bia hoi ~15.000 VND/coc. Pho Ta Hien ban dem: ghe nhua xanh/vang + ban vuong xep doc pho, khong xe co.
- Day dien: giang nhu mang nhen, hang tram soi bam 1 cot, bui day vong xuong thap chi cach dau nguoi vai chuc cm; day men theo tuong, lan can, mai nha; co nha dung day lam cho phoi do. Da ha ngam >450 tuyen pho, ti le 77% quan noi thanh - khu pho co/ngo nho la noi day noi con day nhat, rat hop lam diem nhan dien. Nguon: tienphong.vn, laodong.vn.
- Cay: danh muc chinh thuc 33 loai (hieu luc 22/10/2026). Sao den: pho Lo Duc >130 cay, phan lon ~120 nam tuoi, goc duong kinh gan 1 m. Sau: pho Phan Dinh Phung 3 hang sau trong tu nhung nam 1920, nhieu cay >100 tuoi, tan khep gan kin mat duong. Bang lang hoa tim dau he; phuong hoa do cam cuoi thang 5 - dau thang 6; hoa sua thang 10 (sap thay bang sao den). La vang mua thu: com nguoi vang mo, la sau vang, bang lang chuyen vang cam, loc vung rung hoa do xuong Ho Guom. Goc cay ven Ho Guom bo via da granite lam ghe ngoi.
- Den duong: cot den nhieu qua cau trang tri ven Ho Guom ("ornate multi-globe streetlamp", kieu Phap); qua cau PMMA duong kinh 200/250/300 mm (thong so san pham tham khao, khong phai so do that cua Ha Noi). Chieu sang Ho Guom 2025-2026: >3.000 den LED, 4 lop anh sang (Thap Rua - den Ngoc Son - cau The Huc; ke bo + cay sat nuoc; cay/loi di/Thap But; mat duong pho di bo).
- Co/bang ron: co do treo doc 2 ben duong, tren tru den, truoc co quan/truong hoc/nha dan; dip 2/9/2025 treo tu 18/8 den het 3/9; bang ron do tham chu vang tren cot den va dai phan cach; pano lon o Van Cao, Nguyen Van Huyen.
- Via he: duong dao quanh Ho Guom lat da hoa cuong day 10 cm, vien vuong 10x10 cm nang 3 kg/vien; gach terrazzo 400x400 mm va 500x500 mm pho bien; pho am thuc Tong Duy Tan lat gach luc lang mau xanh reu, dai ~200 m + ngo Cam Chi ~70 m, 25 quan an. Pho bung Hang Trong: khong ban, chi vai ghe nhua sieu thap, 25.000-30.000 VND/to, ban 17h-19h. Ganh banh da cua Ly Thuong Kiet chi 2 thung. Tra chanh via he 10.000 VND/ly.
- Xe may: Ha Noi ~8,8 trieu dan, >9,3 trieu phuong tien, xe may >86% (~8 trieu xe, so lieu chinh phu 2025); 95% ho o 4 quan trung tam co it nhat 1 xe may; binh quan 1 km duong "ganh" ~80 o to + 800 xe may. Xe may vua la phuong tien, vua la quay hang di dong, vua do dac dau kin via he. Luu y: lo trinh cam xe may xang trong Vanh dai 1 tu 1/7/2026 - game nen dat boi canh truoc moc nay hoac ghi chu.
- Pho duong tau (Train Street): doan Phung Hung - Tran Phu (gan ga Ha Noi) va ngo 224 Le Duan; ray co tu 1902; nha cach ray chi 1-2 m; doan Phung Hung nha sat ray dai ~200 m, toan tuyen noi tieng ~500 m, >30 quan ca phe; tau chay cham nhu toc do di bo qua hem, dan thu ban ghe truoc khi tau toi; tan suat 2-8 luot/ngay (cuoi tuan 8 doan khach + 4 luot dau may); tuyen Ha Noi - Hai Phong chuan 8 toa/doan, cuoi tuan/le noi 13-15 toa. User muon tau game 2-3 toa (ngan hon that, de doc hinh tren map nho).
- Ho Guom: dien tich ~12 ha, dai toi da 700 m (Nam-Bac), rong toi da 200-250 m (Dong-Tay), chu vi ~1.750 m, sau trung binh 1-1,4 m. Thap Rua tren go Rua (dao nho giua ho, khong noi bo, chi di thuyen moi toi), xay 1884-1886, hinh chu nhat, 3 tang + dinh vong lau vuong moi be 2 m, moi mat 3 cua vom, tang 3 khac "Quy Son Thap". Den Ngoc Son o phia Bac ho tren dao Ngoc; cau The Huc bang go son do son, cong nhu con tom, noi bo voi den, xay khoang 1865-1886 (2 nguon venh nhau). Thap But cao 28 m, 5 tang, dinh hinh ngon but. Hai dao tren ho: dao Ngoc va dao Rua.
- Ho Tay: ho tu nhien lon nhat Ha Noi, dien tich ~500 ha (1 nguon ghi 527,17 ha), chu vi 17-18 km, dai ~2,8 km, rong trung binh 1,2 km, sau trung binh 4 m. Cach Ho Guom ~3 km ve Tay Bac. Chua Tran Quoc tren dao nho o bo Dong ho Tay, doi ve vi tri hien tai nam 1615, bao thap luc giac 11 tang. Phan biet: Phu Tay Ho nam tren ban dao Quang An o bo Bac (tho Chua Lieu Hanh) - khong nham voi Tran Quoc. Sen Bach Diep (sen tram canh, dac trung doc nhat Ho Tay) no thang 5-7 o dam sen Quang Ba va Nhat Tan. Duong Thanh Nien (Co Ngu xua) ngan cach Ho Tay voi ho Truc Bach; pho di bo Trinh Cong Son dai 900 m ven ho.

### 1.3 Ti le ban do game (tuyen bo ro de tranh hieu lam)

- Map game la diorama nen, KHONG theo ti le that. Ca map 40 tile dai dien cho khu trung tam Ha Noi tu Ho Tay toi song Hong (~4 km that) nen 1 tile ~50-100 m tuy vung.
- Vi vay Ho Tay that (2,8 km) khong the ve dung ti le trong map 40 tile (can 28-56 tile). Spec chon cach: Ho Tay la vung nuoc LON NHAT map mot cach ro ret (gap 2 lan Ho Guom ve so o), chu khong co gang dung ti le that.
- Ho Guom that dai 700 m, rong 200-250 m (ti le dai/rong ~3:1, huong Nam-Bac). Map hien tai ve 5x2 (ti le 2,5:1 nhung huong sai: rong theo x, hep theo z). Phase 3B xoay dung huong: dai theo truc z (Nam-Bac), hep theo truc x.

## 2. Checklist tong - tung element danh so (ten, vi tri, kich thuoc, anh tham chieu)

Quy uoc: vi tri dung toa do cell (x,z) tren luoi 40x40 hien tai, hoac vung neu chua chot o. Kich thuoc dung world unit (1 tile = 2 unit) va chieu cao flap. Anh tham chieu: A1 = image-ccda9c01.png (goc Ta Hien), A2 = image-d53ec7d2.png (dai lo co do), A3 = image-851b976c.png (pho Dang Tat), A4 = image-4cc4c4c1.png (via he tranh dan gian), A5 = image.jpg (ngo hep day dien co do). Moi muc deu phai co anh doi chieu khi duyet tren may user.

### 2.1 Phase 3A - Map + duong pho (vibe Ha Noi that)

Muc tieu: di bo trong Pho Co phai thay ngay la Ha Noi, khong phai lang giay generic. Thay the toan bo tile "lang" bang tile pho Ha Noi; khong them model kieu WFC moi (trap 96-option, xem muc 4).

- 3A-01. Nha ong vang 3 tang (thay the hinh anh nha generic o Pho Co). Vi tri: cac o tubehouse hien tai, x -8..2, z -9..-3 (15 o). Kich thuoc: mat tien 1 tile (2 unit), cao 1.30-1.40 (3 tang giay), mai ngoi do cong o dinh. Chi tiet bat buoc: tuong vang, cua chop xanh la 2 tang tren, ban cong sat den o tang 2, tang tret la cua hang (bien nho), ong khoi/tum mai. Anh: A1, A5.
- 3A-02. Nha ong xanh la 2 tang (bien the, de pho khong don dieu). Vi tri: xen ke 3A-01, ti le khoang 1 xanh : 2 vang. Kich thuoc: cao 1.00-1.10. Chi tiet: tuong xanh la, cua chop trang, ban cong nho, bien hieu doc. Anh: A1.
- 3A-03. Nha goc pho Ta Hien (landmark nho cua Pho Co, khong phai 1 trong 10 landmark lon). Vi tri: goc giao 2 duong chinh cua Pho Co, o (-6,-6) (nga tu hien tai la hanoi_road). Kich thuoc: 1 tile, cao 1.40 (cao nhat khu pho). Chi tiet: mat tien vang 2 mat duong, bien "Tiger BIA PHO CO" vang o tang tret, bien "Tiger CRYSTAL" neon xanh o tang 2, bien "Hanoi BOLD & Light" chu xanh o mat ben. Anh: A1.
- 3A-04. Bien hieu bia hoi (bo 4 mau bien dung lai). Vi tri: gan tren cac o tubehouse mat duong chinh z=-6 va z=-3. Kich thuoc: bien ngang 0.6 x 0.18, bien doc 0.18 x 0.6, gan o do cao 0.5-0.9. Noi dung: "BIA PHO CO" vang, "BIA HOI HA NOI" cam, "Truc Bach" trang, "PARAMOUNT BEER" hong. Khong dung ten thuong hieu that nao khac ngoai 4 bien nay (da co trong anh user gui). Anh: A1.
- 3A-05. Cot dien + day dien chang chit (diem nhan dien so 1 cua Ha Noi). Vi tri: doc 2 duong chinh Pho Co, cot tai (-8,-8), (2,-8) (da co 2 cot hanoi_pole), them 2 cot tai (-6,-9) va (0,-3); day noi giua cac cot tren khong. Kich thuoc: cot cao 1.30, day vong xuong thap nhat 0.75 (gan tam mat nguoi choi). Chi tiet: day den ve thanh 3-5 duong cong mem giua 2 cot (khong phai duong thang), 1 bui day quan quanh than cot, 1 doan day sa thap qua via he. Anh: A5.
- 3A-06. Cay sao den co thu (thay cay generic). Vi tri: doc dai lo phia dong map va quanh Ho Guom, thay 4 cay hanoi_tree hien tai + them 4 cay moi o bien dong Ho Guom. Kich thuoc: than 0.25 rong, cao 1.35-1.45 (cao nhat khu pho, vuot mai nha), tan rong 1.2 o dinh. Chi tiet: than nau xam thang, tan xanh dam tap trung o cao, goc bo via da granite lam ghe ngoi (khoi da thap 0.15). Anh: A3.
- 3A-07. Cay sau + la vang roi (mua thu Ha Noi). Vi tri: tuyen pho phia nam Ho Guom (z 0..3) va pho Dang Tat (dat ten theo anh A3). Kich thuoc: cao 1.20, tan 1.0. Chi tiet: la vang cam tren tan + lop la roi tren via he (cham vang nho tren base print), 1-2 cay co tan khum kin che het mat duong. Anh: A3.
- 3A-08. Den duong cau trang cot xanh (thay den hanoi_lamp generic). Vi tri: 3 den hien tai (-5,-5), (1,-5), (-4,-7) + them 4 den ven Ho Guom. Kich thuoc: cot cao 1.10, 2 qua cau trang duong kinh 0.18 o dinh (cach nhau 0.25), cot son xanh la dam. Chi tiet: qua cau co glowtop vang nhat khi dem (phim N), cot co de tron. Anh: A3.
- 3A-09. Co do sao vang + bang ron do (doc tuyen pho chinh). Vi tri: doc duong chinh z=-6 (2 ben), dai lo phia dong, quanh Ho Guom; bang ron tren cot den o duong lon. Kich thuoc: co 0.30 x 0.20 tren can 0.45, treo o cao 0.9-1.1; bang ron doc 0.25 x 0.70 chu vang "30-4" (chi dung chu so va dau gach, khong them khau hieu dai). Chi tiet: co do tuoi, sao vang 5 canh o giua, co hoi nghieng theo gio (goc co dinh, khong can animation). Anh: A2, A5.
- 3A-10. Via he da granite + kerb (thay base print hien tai). Vi tri: tat ca o sidewalk (6 o hien tai) + via he moi ven Ho Guom. Kich thuoc: via he rong 0.5 tile (1 unit) doc theo duong, kerb cao 0.08. Chi tiet: base print vien da vuong 10x10 cm ti le (ke o vuong mo), vien kerb terracotta, goc cay bo da lam ghe. Anh: A3, A4.
- 3A-11. Ganh hang rong (co ban rong tinh hien tai chi co 1). Vi tri: them 2 ganh o goc pho (-8,-5) canh vendor hien tai va (2,-6). Kich thuoc: nguoi 0.30 x 0.90, 2 thung 0.5 x 0.32 hai dau ganh. Chi tiet: ganh tre cong, 1 thung noi nuoc dung (hoi bay khi dem?), 1 thung do; ghe nhua nho 0.15 ben canh. Anh: A1 (ghe nhua xanh/vang pho Ta Hien).
- 3A-12. Quan pho via he (nang cap hanoi_phostall). Vi tri: (2,-5) hien tai, them 1 quan o (-8,-6). Kich thuoc: quan 0.9 x 1.0, ban thap 0.5 x 0.30, ghe nhua sieu thap 0.12 x 0.15 xep 4 cai. Chi tiet: mai hien terracotta, noi pho co nap, bien "PHO" chu do, khoi hoi trang mo tren noi (chi hieu ung mau, khong can particle moi). Anh: A1.
- 3A-13. Xe may dau via he (thieu hoan toan hien tai). Vi tri: 5-6 xe doc via he duong chinh va truoc cac quan. Kich thuoc: moi xe 0.45 dai x 0.25 rong x 0.35 cao (ti le voi nguoi 0.9). Chi tiet: silhouette xe ga/xe so don gian (than + 2 banh + tay lai), mau do/xanh/den xen ke, dung nghiem (khong chay). Xe chay se them o 3E neu co duong tau; rieng 3A chi xe dau. Anh: A2, A5.
- 3A-14. Bien mot chieu + tuong tranh dan gian (diem nhan dien pho). Vi tri: bien mot chieu tai (-6,-3) canh den do; buc tuong tranh tai via he phia tay map (x -10..-8, z 0..2). Kich thuoc: bien 0.25 x 0.25 tren cot 0.8, nen xanh mui ten trang; buc tuong dai 2 tile, cao 0.8. Chi tiet: tranh chu Tieu va dong ho dan gian ve dang sprite don gian (mat cuoi, ao dai), khong can chi tiet nhu anh goc. Anh: A4.
- 3A-15. Audit + xoa moi thu trong giong nong thon trong map Hanoi (tra loi truc tiep y 4 cua user). Vi tri: toan bo 1600 o. Noi dung: liet ke moi model co chi tiet nong thon (silô, dong rom, hang rao go, xe bo, chuong, coi, hang cay an qua) con sot trong map Hanoi; thay bang chi tiet thanh pho tuong duong (cung socket, xem muc 4). Rieng hanoi_mausoleum: doi placeholder khoi nau hien tai thanh khoi da granite xam co bac cap ro rang, het trong giong barn. Ket qua audit phai co bang liet ke truoc/sau, user duyet tung muc.
- 3A-16. Duong pho co do rong khac nhau (pho lon vs ngo hep). Vi tri: duong chinh z=-6 rong 1 tile; ngo hep moi o khu dan cu phia tay (x -14..-10, z -2..2) rong 0.5 tile (chi di bo, khong co xe). Chi tiet: ngo co co do treo day 2 ben (nhu A5), day dien thap, nha ong sat nhau 2 ben. Kich thuoc: chieu rong long ngo 1 unit.
- 3A-17. Mat duong: duong chinh lat gach + vach ke (thay base print kraft don). Vi tri: tat ca o road. Chi tiet: base print gach xam, vach trang dut doan giua duong, zebra o nga tu (da co, giu), vet banh xe mo. Anh: A1, A2.

### 2.2 Phase 3B - Ho + landmark (Ho Tay lon hon, Thap Rua giua ho)

Muc tieu: nhin minimap la thay ngay 2 ho lon, Thap Rua dung giua Ho Guom, Tran Quoc dung tren dao giua Ho Tay.

- 3B-01. Ho Guom mo rong + xoay dung huong. Vi tri: rect moi x -2..1, z -7..4 (4 rong x 12 dai), thay rect cu [-3,-2,1,-1] (5x2). Kich thuoc: ~40-44 o pond (hien 9 o). Huong: dai theo truc z (Nam-Bac), hep theo truc x (Dong-Tay), ti le dai/rong ~3:1 nhu that. He qua: an khoang 30 o Pho Co/phia nam hien tai - map phai ve lai vung nay, spawn (0,0) doi xuong phia nam ho (z 5..6). Can sketch map moi de user duyet truoc khi sua hanoi-map.js.
- 3B-02. Thap Rua GIUA ho (sua loi lech bac hien tai). Vi tri: o trung tam ho moi, khoang (-1,-1) (giua rect 3B-01 ca 2 chieu). Kich thuoc: dao go 1 tile, thap cao 1.20 (3 tang + vong lau dinh, moi tang thap dan). Chi tiet: thap hinh chu nhat, moi mat 3 cua vom, tang 3 co chu "Quy Son Thap" (chi can net chu mo, khong can doc duoc), reu phong mau xanh mo o chan, khong co cau noi bo (chi di thuyen moi toi - dung nhu that). Anh: khong co trong 5 anh user gui, dung anh chuan Ho Guom (can user gui them hoac lay tu landmark-history.md).
- 3B-03. Cau The Huc do cong + den Ngoc Son. Vi tri: cau tu bo dong ho (x 2, z -2) sang dao Ngoc (x 4..5, z -2); den Ngoc Son giu anchor (5,-2). Kich thuoc: cau dai 2 tile, cong vom len 0.35 o giua (cao hon deck profile hien tai 0.2), rong 0.4 tile, lan can do son 2 ben. Chi tiet: cau son do tuoi (khong phai rust), 2 tru do o 2 dau, den co mai cong + cot do. Hien tai cau chi la tile bridge 1 o bac qua kenh 1 o - phai mo rong kenh thanh eo nuoc noi ho voi song nho.
- 3B-04. Ho Tay mo rong gap doi. Vi tri: rect moi x -19..-7, z -19..-6 (13 rong x 14 dai), thay rect cu [-19,-19,-10,-9] (10x11). Kich thuoc: ~150-160 o, trong do pond ~130 o (hien 74 o). He qua: an vao vung rung phia tay-bac hien tai - doi cac o forest thanh meadow/pond, giu 1 dai cay ven bo. Ho Tay phai la vung nuoc lon nhat map, nhin minimap la phan biet ngay voi Ho Guom.
- 3B-05. Chua Tran Quoc tren DAO GIUA Ho Tay (sua loi dang o bo dong). Vi tri: dao 1 o tai khoang (-13,-12) (giua vung dong cua Ho Tay moi), noi voi bo bang cau da thap 1 o. Kich thuoc: dao 1 tile, chua cao 1.40 (bao thap luc giac 11 tang la diem cao nhat), cay xanh quanh. Chi tiet: thap 11 tang thu nho theo tang (moi tang 1 cua vom), mai cong, cay xanh 4 goc dao. Day la landmark de nhan dien Ho Tay tu xa.
- 3B-06. Duong dao ven Ho Guom + pho di bo cuoi tuan. Vi tri: vong quanh Ho Guom moi (3B-01), rong 0.5 tile. Chi tiet: base print da granite vuong, ghe da bo goc cay, den cau trang (3A-08), hang co do; cuoi tuan (chi hieu ung mau, khong doi logic) them ghe nhua + nguoi di bo dong hon.
- 3B-07. Sen Bach Diep Ho Tay (diem mau rieng). Vi tri: dam sen o goc tay-nam Ho Tay (x -18..-16, z -8..-6), 4-6 o pond co sen. Kich thuoc: la sen tron 0.3, hoa sen hong 0.25. Chi tiet: la xanh dam noi tren mat nuoc, hoa hong no thang 5-7 (mac dinh hien hoa, khong can theo mua that).
- 3B-08. Mat nuoc 2 ho khac nhau (het tron teal giong nhau). Vi tri: Ho Guom + Ho Tay. Chi tiet: Ho Guom nuoc xanh luc sau hon (giong that, ho nong 1-1,4 m, nuoc duc xanh), Ho Tay nuoc xanh lam sau hon; them gorn song mo tren base print + phan chieu (reflection throttle cua 2E giu nguyen). Khong them he thong nuoc moi, chi doi mau/print theo vung.
- 3B-09. Bo ho cong mem (het o vuong goc canh). Vi tri: vien Ho Guom + Ho Tay. Chi tiet: cac o pond o me duoc ve base print tron/cong (nhu loader baseTexture hien tai ve vong tron teal), khong de goc vuong 90 do lo ra; them 1 hang da ke bo (vien da xam thap 0.1).
- 3B-10. Thap But (landmark phu ven Ho Guom, khong tang checklist). Vi tri: bo dong-bac Ho Guom (x 2, z -6). Kich thuoc: cao 1.45 (cao nhat quanh ho), 5 tang, dinh hinh ngon but. Chi tiet: than da xam, dinh but nghieng, chu "Ta Thanh Thien" mo. Chi lam diem nhan dien tu xa, khong them vao checklist 10 (tranh doi so 10 thanh 11 neu user khong muon - xem Q2).
- 3B-11. Song Hong + cau Long Bien (giu, chi chinh). Vi tri: x 17..18 hien tai. Chi tiet: cau thep truss do nau ro hon (hien chi 2 o bridge), them tru cau xuong nuoc, song rong hon o doan duoi cau. Khong doi anchor (17,-6).
- 3B-12. Lang Bac + Quang truong Ba Dinh (sua placeholder giong barn). Vi tri: rect Lang [-14,3,-11,7] hien tai. Kich thuoc: lang cao 1.30, rong 2 tile (gom 2 o canh nhau). Chi tiet: khoi da granite xam, bac cap 3 lop, cot co do cao 1.30 truoc lang, quang truong rong co hoa (khong co hang rao go, khong co dong rom). Day la muc tra loi y 4 cua user truc tiep nhat.

### 2.3 Phase 3C - The info redesign (het "vo duyen", het "chu be", biet ro khi nao hien)

Muc tieu: the chi hien khi user MUON doc; doc 10 giay la hieu; chu du lon tren dien thoai 390px.

- 3C-01. Trigger moi: BAM moi mo (khong tu mo). Khi traveller den gan landmark (ban kinh 1 nhu cu), tren dinh landmark hien dau "!" vang nhap nhay nhe + toast ngan "Da den Ho Guom - bam de xem". The CHI mo khi user bam vao landmark tren man hinh, bam dau "!", hoac bam item checklist. Xoa hanh vi tu mo trong discover().
- 3C-02. Vong bao hien thi tren dat. Khi trong ban kinh 1, ve 1 vong tron mo mau dat nung tren mat dat quanh landmark (ban kinh 1 tile), de user thay ro "dung trong vung nay thi bam duoc". Vong bien mat khi ra khoi vung. Khong can the hien ban kinh bang so.
- 3C-03. Chi hien 1 ngon ngu 1 luc. The chi hien ngon ngu dang chon (VI mac dinh, toggle doi). Ngon ngu kia KHONG xep chong ben duoi nua. Toggle VI/EN trong the doi duoc ngay khong can dong the. Giam 1 nua luong chu ngay lap tuc.
- 3C-04. Tom tat truoc, chi tiet sau. The mo co 3 lop: (a) ten lon + 1 cau tom tat (<= 20 tu) + 1 fun fact ngan (<= 15 tu); (b) nut "Doc them" mo them 3 dong lich su; (c) link nguon o cuoi. Mac dinh chi lop (a). User doc xong trong 10 giay neu khong muon doc them.
- 3C-05. Chu lon gap doi. Tieu de ten 20px bold, tom tat 16px/1.6, nut 15px, chu lich su 15px/1.6, heading muc 12px. (Hien tai: tieu de 14px, body 12.5px, heading 11px.) Tren 390px: the rong toi da 360px (giu), cao toi da 60vh, noi dung cuon trong the.
- 3C-06. Khong tu dong khi dang doc. The khong dong khi user di ra khoi ban kinh 1 neu the dang mo (chi dong khi user bam X, bam ra ngoai the, hoac bam landmark khac). Giu quy tac cu "di xa thi dong" CHI khi the dang collapse. User khong bao gio bi mat bai dang doc do.
- 3C-07. Tach the khoi toast. Toast doi len tren (bottom 62vh khi the mo, bottom 11vh khi the dong) hoac doi toast chi hien ten landmark + dau "!" ma khong hien dong chu dai. Khong de 2 lop chu chong nhau o giua-duoi man hinh nhu hien tai.
- 3C-08. The dang bottom sheet tren dien thoai. Tren man hinh <= 500px: the truot tu duoi len (animation 200-300ms ease-out), rong 100vw - 16px, goc tren bo tron 12px, co tay keo o dinh. Tren desktop: giu kieu card giua man hinh hien tai.
- 3C-09. Co-discovery: hien ca 2 the dang list. Khi 1 cho phat hien 2 landmark cung luc (vd dung o (6,-1) gap Ngoc Son + Nha Tho Lon), the hien ten ca 2 dang 2 nut chon o dinh the, bam nut nao xem the do. Khong chi hien landmark cuoi nhu hien tai.
- 3C-10. Kiem tra doc hieu: sau khi build, doc toan bo 10 the tren dien thoai 390px that, moi the <= 10 giay doc lop (a). Ghi lai thoi gian doc thuc te vao verification.

### 2.4 Phase 3D - Loading % + muot (muon cong nghe Ocean City)

Muc tieu: mo game la thay ngay % chay, biet dang load cai gi; vao game khong do; dien thoai yeu tu xuong muc thap truoc khi lag.

- 3D-01. Man hinh loading co % lon + ten giai doan. Vi tri: toan man hinh, nen giay kem #efe0c2, chu muc #5a3a28. Phan tu: so % lon (co chu >= 48px), thanh tien trinh (scaleX chay tren compositor, khong bi ket khi main thread ban), dong trang thai (vd "Dang mo sach...", "Dang dung Ho Guom..."), dong thiet bi ("Dien thoai - Medium"). % theo moc giai doan nhu Ocean City (say()): 5% "Chuan bi...", 20% "Tai ban do...", 45% "Dung nha ong...", 70% "Ve ho...", 90% "Dang gap giay...", 100% "Xong!". Moi moc gan voi 1 job that, khong phai % gia chay tu dong.
- 3D-02. Bo qua tiles.glb 5.9 MB o che do Hanoi (tien lon nhat, re nhat). Hien tai loadAssets luon fetch tiles.glb du Hanoi khong dung tile WFC nao. Sua loader: khi hanoi=true thi KHONG fetch tiles.glb va KHONG fetch basic-grand.glb, chi fetch hanoi-tiles.glb (2.4 MB) + traveller.glb + texture can. First-load truoc frame dau giam tu ~19-20 MB xuong ~9 MB (neu them 3D-03) hoac ~13-14 MB (neu khong).
  - GHI CHU SUPERSEDED 2026-11-21 (coordinator, sau khi build): muc nay SAI gia dinh - map Hanoi dung 1543/1600 o la model stock trong tiles.glb, chi 57 o la model Hanoi-only. Bo fetch tiles.glb se lam 96% map thanh placeholder phang, trai voi yeu cau realism cua user. Da ROLLBACK: tiles.glb lai fetch o Hanoi mode; chi giu gate basic-grand.glb va hoan animals (3D-03). First-load thuc te sau rollback ~16.04 MB truoc frame dau (xem phase-3d-manifest.md). Khong ap dung ban goc cua 3D-02 nua.
- 3D-03. Hoan animals.png 4.5 MB sau frame dau. Hien tai main.js await animals.ready truoc khi loop.start() nen chan frame dau. Doi thanh: start loop truoc, animals load nen sau, dong vat hien dan trong 2-3 giay dau (fade-in). Khong doi spawn table, chi doi thu tu load.
- 3D-04. Tien trinh that cho GLB (khong chi moc gia). Dung onProgress cua GLTFLoader/TextureLoader de cap nhat % trong tung giai doan (vd giai doan "Tai ban do" chay 20-45% theo byte that). Neu loader khong cho progress, giu moc gia nhu 3D-01 va ghi ro trong code cho nao la moc gia.
- 3D-05. Tier truoc load theo thiet bi that (muon tu Ocean City quality.js). Truoc khi load bat cu thu gi, doc navigator.deviceMemory + navigator.hardwareConcurrency + min(screen.width, screen.height): dien thoai RAM <= 4 GB hoac <= 4 nhan hoac man hinh nho <= 360px thi bat dau o low; dien thoai con lai bat dau o med; desktop RAM <= 4 GB bat dau o med, con lai high. Hien tai Hanoi chi biet touch hay khong. Khong dung user-agent sniffing.
- 3D-06. Co crash: tu xuong 1 muc sau lan sap truoc (muon tu Ocean City abyssalLoad). Set co localStorage khi bat dau boot, xoa co sau 15 giay chay on; lan vao sau ma co van con (lan truoc sap/crash tab) thi tu dong xuong 1 level (high -> med -> low, low thi bao loi). Ghi ro trong code, khong am tham doi muc ma khong noi.
- 3D-07. Dynamic resolution lien tuc (muon tu Ocean City pix/det, ban don gian). Them bien pixScale lien tuc dieu khien renderer.setPixelRatio / kich thuoc render target cua post, thay doi theo frame-time EMA (da co trong scaler 2E): cham thi giam pixScale truoc (buoc 0.1, doi >15% moi rebuild target de tranh hitch), nhanh thi tang lai. Giua nguyen scaler EMA lam vong ngoai (doi preset roi rac), pixScale la vong trong muot hon. Khong muon: reload toan trang de doi tier (Hanoi doi live da tot hon), timestamp-query cua WebGPU (WebGL khong co tuong duong tin cay).
- 3D-08. Dong "Still loading..." sau 8 giay. Neu load qua 8 giay chua xong, hien them dong "Dang tai cham, vui long doi..." + ten file dang doi (vd "hanoi-tiles.glb 2.4 MB"). Khong de man hinh dung im khong giai thich.
- 3D-09. ?fps=1 them worst-frame + % resolution. Readout hien tai chi "fps <so> <muc>". Them frame te nhat trong 1 giay qua + % resolution hien tai (kieu Ocean City HUD phim H). Chi khi ?fps=1, mac dinh tat.
- 3D-10. Do truoc/sau bang so that tren may user. Truoc khi build ghi lai: first-load MB, thoi gian toi frame dau (giay), FPS o spawn (?fps=1). Sau build do lai cung 3 so tren cung may, cung mang. Khong nhan "muot hon" neu khong co so.

### 2.5 Phase 3E - Tau 2-3 toa chay quanh map

Muc tieu: tau chay lien tuc, nhin la biet pho duong tau Ha Noi, khong lam lag game.

- 3E-01. Tau 3 toa (2 toa hanh khach + 1 dau may, dung so user muon 2-3 toa). Kich thuoc: moi toa dai 2 tile (4 unit), rong 0.5 tile (1 unit), cao 1.10; toan doan dai 6 tile + khoang noi 0.2/toa. Mau: dau may do, toa xanh la dam + cua so vang (mau tau Ha Noi - Hai Phong). Khong dung so that 8 toa (dai qua, khong doc duoc tren map 40 tile).
- 3E-02. Duong ray vong quanh map (loop kin). Vi tri: vong ray hinh chu nhat bo tron, cach mep map 2 tile, di qua: ga Ha Noi (goc dong-nam), Pho Co, ven Ho Tay, cau Long Bien. Tong dai vong ~100-110 tile. Ray gom 2 thanh thep + tam go (base print) + cot den bao hieu o nga tu ray. Tau chay 1 chieu tren vong, khong dao chieu.
- 3E-03. Toc do + lich. Tau chay 2.5 unit/giay (1.25 tile/giay) - nhanh hon traveller (1.15 unit/giay) mot cach ro ret nhung van xem duoc. Het vong ~100 tile = 160-180 giay. Tau khong dung o ga (chay lien tuc); neu user muon co ga dung thi them o Q5. Tau chi chay khi nguoi choi o trong map Hanoi (khong chay o che do WFC).
- 3E-04. Pho duong tau (doan pho sat ray, kieu Phung Hung). Vi tri: 1 doan thang dai 6 tile o canh tay Pho Co, nha ong 2 ben cach ray 0.5 tile (1 unit) - sat nhu that (1-2 m). Chi tiet: ghe nhua xep sat tuong 2 ben ray, quan ca phe nho, bien "CA PHE DUONG TAU", cot bao hieu + chuong truoc khi tau toi (chi hieu ung mau/am thanh nhe neu co). Tau qua doan nay cham lai con 1.5 unit/giay.
- 3E-05. Tau khong can chet traveller. Tau chay tren ray rieng; neu traveller dung tren ray thi day nhe traveller ra khoi ray (khong cho tau xuyen qua nguoi, khong game over). Ghi ro trong spec: khong co co che chet.
- 3E-06. Tau la 1 object di chuyen, khong phai tile WFC. Tau khong nam trong luoi tile, khong tinh vao solver 95/96, khong anh huong streaming/fold. Tau co lich trinh doc lap (tuyen duong + toc do + toa), ve bang BatchedMesh rieng hoac object rieng, khong dung BatchedMesh cua tile. Neu FPS giam, tau la thu giam dau tien (an tau khi o low).
- 3E-07. Am thanh tau (neu co): tieng banh xe nhe + coi xa khi vao doan pho duong tau. Chi them neu khong pha vo thiet ke am thanh hien tai (nhac felt-piano + tieng giay). Neu user thay on thi bo am tau, giu im lang. Xem Q6.

### 2.6 Phase 3F - Chuot + minimap icon (de locate dia diem)

Muc tieu: di chuot thay chuot; nhin minimap la biet dau la Thap Rua, dau la chua Mot Cot.

- 3F-01. Bo cursor: none toan cuc. Xoa cursor: none o index.html:27-28 (html, body, canvas#atlas). Con tro mac dinh cua trinh duyet hien lai tren toan bo game. Day la fix 2 dong, lam dau tien trong 3F.
- 3F-02. Con tro pointer dung cho. Tat ca phan tu bam duoc (nut toggle, item checklist, nut X, dau "!", icon minimap) co cursor: pointer. Vung di bo co cursor mac dinh (khong an, khong doi hinh).
- 3F-03. (Tuy chon, neu user thich) Con tro giay custom: cham tron giay nho 10px mau muc, phong to nhe khi hover phan tu bam duoc. Chi lam sau khi 3F-01 xong va user duyet; khong bat buoc cho 3F pass.
- 3F-04. Minimap to hon: CSS 132px -> 168px (buffer ve 200x200), giu goc duoi-phai, cach mep 12px. Moi o = 200/40 = 5px (hien 4px). Tren 390px: minimap 168px chiem 43% chieu rong - chap nhan duoc vi chi hien o Hanoi mode; neu user thay to thi giam xuong 152px (xem Q8).
- 3F-05. Icon landmark dang silhouette giay custom (phuong an chinh). Moi landmark 1 icon silhouette don gian 32x32px, ve theo style atlas hien co (muc + dat nung tren nen giay), bake vao game_icons.png (da co loader + JSON rect + fallback procedural trong atlasmap.js) hoac sheet minimap rieng. Danh sach icon: Thap Rua (thap 3 tang), Ngoc Son (den mai cong), Ho Tay (song nuoc + sen), Pho Co (nha ong), Lang Bac (khoi da + cot co), Van Mieu (cong), Mot Cot (chua tren cot), Nha Tho Lon (2 thap), Nha Hat Lon (mat tien vom), Long Bien (cau thep). Khong crop nguyen sprite hero (179-432px, xuong 10px se nat) - ve lai silhouette toi gian theo mau hero.
- 3F-06. Icon phan biet da/kham pha. Da kham pha: icon to mau (muc + dat nung). Chua kham pha: icon chi vien mo (outline), khong to mau. Traveller giu cham muc + vach huong nhu cu, nhung to hon (r=3.5px).
- 3F-07. Tap icon de locate. Tap vao icon tren minimap: checklist highlight item do + the info mo o che do tom tat (neu da kham pha) hoac toast "Chua kham pha - di toi do" (neu chua). Them mui ten bac (N) o goc tren minimap.
- 3F-08. Phuong an du phong: dia so 1-10. Neu khong kip ve 10 icon truoc deadline, dung dia giay r=6px + so 1-10 theo thu tu checklist (cung la fallback bat buoc khi sheet icon chua load xong hoac load loi). So phai doc ro o 168px. Lam (c) truoc de choi duoc ngay, thay dan bang (a) ma khong doi cau truc code (cung 1 ham ve, chi doi nguon glyph).
- 3F-09. Khong dung thu vien icon co san lam chinh. Maki (CC0) va Material Symbols (Apache 2.0) deu khong co icon rieng Ha Noi (khong Thap Rua, khong Mot Cot, khong cau Long Bien kieu vom thep); 4 diem Phat giao phai dung chung 1 icon. Font Awesome Free doi ghi credit (CC BY 4.0). Chi dung Maki neu doi khong co nguoi ve va chap nhan 4 chua dung chung 1 icon.
- 3F-10. Tran Quoc tren minimap: neu Q2 chot Tran Quoc la landmark rieng (11) thi ve icon rieng (thap 11 tang); neu gop vao Ho Tay thi icon Ho Tay dung o vi tri Tran Quoc. Khong ve 2 icon chong nhau.

## 3. Ke hoach chia phase 3A-3F (thu tu build, moi phase 1 push)

Thu tu: 3F-01 + 3F-04 truoc (fix nhanh, it rui ro) -> 3D (nen tang load) -> 3A (pho) -> 3B (ho) -> 3C (the) -> 3E (tau) -> 3F-05 icon (ve sau cung). Moi phase: fixer build + verifier doc lap + fresh-browser check + user check tren may anh truoc khi sang phase sau. Mot phase = 1 push co ten.

### 3A - Map + duong pho (checklist 3A-01..3A-17)

- Pham vi: chi doi hinh anh + legend + base print trong khu Pho Co va duong chinh; khong doi kich thuoc luoi, khong doi anchor landmark, khong doi discovery.
- File cham: src/world/hanoi-map.js (legend + o), src/world/hanoi-models.js (model moi/tai dung socket cu), src/assets/loader.js (RECIPES + shape kind moi neu can, toi da 1-2 kind), tools/step5/build-hanoi-glb.mjs + verify-glb.mjs, public/models/hanoi-tiles.glb (build lai), atlas chi them sprite khi that can (uu tien tai dung sprite cu).
- File KHONG cham: src/world/wfc.js, src/world/tiles.js, src/world/world.js, src/core/models.js (khong them model WFC), src/game/landmarks.js (tru khi audit 3A-15 doi anchor).
- Kiem tra: npm run build; npm run check:hanoi (solver 95/96, 0 mismatch, 1600 o resolve); verify-glb (0 degenerate, flap <= 1.5); check-3a moi (dem o Pho Co, audit nong thon 3A-15 co bang truoc/sau); fresh-browser 1440/1024/768/390; user check 390px.
- Rui ro: them signature socket moi vuot 96 (chi con 1 slot) - moi tile moi phai tai dung signature cu; GLB tang kich thuoc (hien 2.50 MB, muc tieu < 3.5 MB); nha ong cao 1.40 che khuat landmark ben canh o 1 so goc camera.

### 3B - Ho + landmark (checklist 3B-01..3B-12)

- Pham vi: ve lai rect Ho Guom + Ho Tay, doi anchor Thap Rua/Tran Quoc, doi base print nuoc, doi placeholder Lang Bac. Day la phase doi map nhieu nhat.
- File cham: src/world/hanoi-map.js (rect + anchor), src/world/hanoi-models.js, src/world/hanoi.js (neu doi spawn), src/game/landmarks.js (anchor moi), src/assets/loader.js (RECIPES), tools/step5/build-hanoi-glb.mjs + verify-glb.mjs, public/models/hanoi-tiles.glb, docs/landmark-history.md (chi khi doi noi dung lich su, khong doi so lieu da verify).
- Can sketch truoc: ve so do map moi tren giay (rect ho, vi tri landmark, spawn, duong chinh) de user duyet TRUOC khi sua hanoi-map.js. Sau 2 lan sua sai cung sketch thi dung lai va hoi 1 cau pinpointed (theo quality gate).
- Kiem tra: check:hanoi (reachability tu spawn toi moi anchor >= 1 o walkable, 0 mismatch); check-3b moi (dem o pond Ho Guom 40-44, Ho Tay ~130, Thap Rua o trung tam ho, Tran Quoc tren dao trong nuoc); fresh-browser; user check 390px.
- Rui ro: Ho Guom moi an 30 o Pho Co - duong di bo doi, 1 so cell walkable cu mat; spawn phai doi; discovery radius-1 co the cham them landmark lan can; GLB tang.

### 3C - The info redesign (checklist 3C-01..3C-10)

- Pham vi: chi UI + logic mo/dong the; KHONG doi noi dung lich su (landmark-history.js giu nguyen, chi cat lop hien thi), KHONG doi discovery radius, KHONG doi storage.
- File cham: src/game/landmarks.js (trigger, vong bao, lop tom tat, co-discovery), index.html (CSS the + toast + bottom sheet), src/game/landmark-history.js (chi them truong summary 1 cau neu chua co, khong sua lich su).
- Kiem tra: check-3c moi (mo/dong/bam/vong bao/2 ngon ngu/2 the cung luc); do thoi gian doc lop (a) tren 390px (muc tieu <= 10 giay/the); fresh-browser 390px (the khong che nut di, khong che toast); user check.
- Rui ro: vong bao tren dat can ve them (shader hoac decal) - neu kho thi dung cham "!" + toast thay the o ban dau, ghi ro trong verification.

### 3D - Loading % + muot (checklist 3D-01..3D-10)

- Pham vi: man hinh load, thu tu load asset, tier truoc load, co crash, dynamic resolution, ?fps=1 mo rong. KHONG doi preset QUALITY, KHONG doi scaler EMA, KHONG doi post pass.
- File cham: index.html (man hinh load + CSS), src/main.js (boot sequence, tier, co crash, say()), src/assets/loader.js (KHONG bo fetch tiles.glb nua - xem GHI CHU SUPERSEDED o 3D-02; chi progress that, tach Promise.all thanh giai doan), src/life/animals.js (defer animals.ready), src/render/quality-scaler.js (them pixScale + deviceMemory/cores), src/render/renderer.js (pixScale).
- Kiem tra: check-3d moi (tung giai doan % dat moc, tiles.glb DUOC fetch o Hanoi mode sau rollback, co crash ha muc, pixScale doi theo FPS); do 3 so truoc/sau (MB first-load, giay toi frame dau, FPS o spawn) tren may user; fresh-browser.
- Rui ro: (3D-02 da rollback, khong bo tiles.glb nua) pixScale + scaler doi cung luc co the danh nhau (quy tac: pixScale chi doi khi scaler khong doi preset trong 2 giay gan nhat).

### 3E - Tau 2-3 toa (checklist 3E-01..3E-07)

- Pham vi: he thong tau doc lap (tuyen, toa, toc do, pho duong tau), khong dung luoi tile, khong dung solver.
- File cham: file moi src/game/train.js (tuyen + cap nhat vi tri + va cham nhe), src/main.js (khoi tao + tick), src/assets/loader.js (RECIPES toa tau + ray base print) hoac GLB rieng train.glb (quyet dinh khi build), tools/step5/build-train-glb.mjs neu dung GLB rieng.
- Kiem tra: check-3e moi (tau chay tron vong khong lac ray, toc do dung, khong xuyen traveller, FPS khong giam qua 5 o spawn khi tau chay qua); fresh-browser; user check (tau co dep khong, co giong pho duong tau khong).
- Rui ro: tau la object di chuyen dau tien trong game (truoc gio chi co traveller + dong vat) - can co che cap nhat vi tri moi frame khong lam hong fold/streaming; ray vong dai ~100 tile can ve base print doc tuyen (khong phai 1 tile).

### 3F - Chuot + minimap icon (checklist 3F-01..3F-10)

- Pham vi: 3F-01..3F-04 + 3F-06..3F-07 lam truoc (khong can ve); 3F-05 ve icon lam sau (can nguoi ve).
- File cham: index.html (xoa cursor:none, CSS minimap 168px), src/game/landmarks.js (drawMinimap: icon, tap, mui ten bac), public/textures/art/game_icons.png + game_icons.json (them 10 icon), tools/step5/build-atlas.py (neu bake icon vao atlas).
- Kiem tra: check-3f moi (cursor hien, minimap 168px, icon dung vi tri, tap mo dung the); user check 390px (icon co doc duoc khong, co bi chong nhau khong).
- Rui ro: icon 10-12px co the mo - phai test that o 168px truoc khi chot; landmark gan nhau (Ngoc Son + Nha Tho) van chong icon - giai phap: chi hien icon day du cho landmark da kham pha, chua thi giu cham vien.

## 4. Tieu chi nghiem thu tren may user (390px, moi phase)

Chung cho moi phase: mo bang tab an danh (tranh cache cu), link ?map=hanoi&v=3 (tang so version moi phase), doi load xong 100%, chup man hinh.

- 3A pass khi: di bo 1 vong Pho Co, nhin thay it nhat 5 trong 7 diem: nha ong vang + bien Tiger, day dien, cay co thu, co do, ghe nhua quan pho, xe may dau. Khong con thu gi trong giong nong thon trong khung hinh. User noi "nhin la biet Ha Noi" ma khong can giai thich.
- 3B pass khi: mo minimap thay Ho Tay lon gap doi Ho Guom; dung giua Ho Guom thay Thap Rua o giua ho (khong lech bo); dung o bo dong thay cau The Huc do cong dan vao den Ngoc Son; dung o Ho Tay thay Tran Quoc tren dao giua nuoc. Spawn khong bi ket trong ho.
- 3C pass khi: den gan landmark thay dau "!" + toast ngan, KHONG thay the tu mo; bam vao doc xong lop tom tat trong <= 10 giay; chu du lon de doc khong can zoom; dong the bang X hoac bam ra ngoai; di xa the khong tu bien mat khi dang doc.
- 3D pass khi: mo game thay % chay tu 0 len 100 kem ten giai doan; thoi gian toi frame dau giam it nhat 30% so voi truoc (do bang dong ho, cung mang); choi 2 phut o spawn FPS on dinh hon truoc (so ?fps=1); dien thoai yeu khong do o man hinh nau toi.
- 3E pass khi: tau 3 toa chay tron vong, thay tau it nhat 1 lan trong 3 phut choi; doan pho duong tau nhin sat nhu that (nha 2 ben gan ray); tau khong xuyen qua traveller; FPS khong tut khi tau chay qua.
- 3F pass khi: di chuot thay con tro tren toan bo man hinh; minimap 168px doc duoc; nhin minimap phan biet duoc it nhat 7/10 landmark bang icon (khong can mo checklist); tap icon mo dung the.

## 5. Cau hoi mo can user quyet (tra loi truoc khi build tung phase lien quan)

- Q1 (3B). Ho Tay lon len trong luoi 40x40 hien tai (an vao o rung phia tay-bac) hay mo rong luoi len 48x48 (doi provider + minimap + spawn)? De xuat: giu 40x40.
- Q2 (3B/3F). Tran Quoc la landmark rieng thu 11 (checklist 10 -> 11) hay van gop vao Ho Tay? De xuat: landmark rieng vi co dao + thap 11 tang de nhan dien; nhung can user chot vi doi so 10.
- Q3 (3C). The info mo khi BAM (de xuat) hay van tu mo khi den gan? Neu tu mo thi giu ban kinh 1 hay doi ban kinh 0 (chi mo khi dung sat)?
- Q4 (3C). The chi hien 1 ngon ngu (de xuat) hay van hien ca 2 nhu hien tai?
- Q5 (3E). Tau chay vong quanh map (de xuat) hay chay thang doan pho duong tau roi quay dau? Vong thi luon thay tau; thang thi giong that hon nhung tau chi o 1 doan.
- Q6 (3E). Tau co tieng khong (tieng banh xe nhe + coi xa) hay giu im lang nhu thiet ke am thanh hien tai?
- Q7 (3A). Xe may chi dau yen (de xuat 3A) hay co them 2-3 xe may chay cham tren duong chinh? Xe chay can them logic di chuyen.
- Q8 (3F). Minimap 168px (de xuat) hay 152px neu user thay 168px to? Icon ve custom (can thoi gian ve) hay dung dia so 1-10 truoc roi thay dan?
- Q9 (3B). Chap nhan map la diorama nen khong dung ti le that (Ho Tay bi nen ~4 lan) hay user muon map rong hon de Ho Tay dung ti le hon?
- Q10 (poster). Poster Lab 06 dung 1 trong 5 anh that user vua gui hay anh chup gameplay o Ho Guom? Anh that dep hon nhung khong phai hinh game.
- Q11 (3A). Toa nao user thay giong chuong/trai? Chup man hinh khoanh tron giup em, vi audit code khong tim thay tile farm nao trong map Hanoi - kha nang la placeholder Lang Bac.
- Q12 (3D). Man hinh loading kieu mo sach giay (animation gap) hay chi thanh % don gian tren nen giay kem? Sach giay dep hon nhung ton cong hon.

## 6. Tai dung duoc vs phai lam lai + trap (tom tat tu audit)

Tai dung duoc:

- Map provider src/world/hanoi.js (cung interface createWFC, chi them o/tile vao HANOI_ROWS/LEGEND/LANDMARKS).
- Loader + lazy-load + placeholder fallback src/assets/loader.js (GLB thieu thi placeholder, khong crash).
- Atlas pipeline tools/step5/ (build-hanoi-glb.mjs, build-atlas.py, verify-glb.mjs, sprites/ co 11 sprite Hanoi mau) + check scripts (check-solver-options, check-2b..2e).
- Data + i18n: landmark-history.js (shape lich su), i18n.js (VI mac dinh + toggle), landmarks.js (discovery radius 1, checklist, toast, minimap) - giu logic, chi sua UI.
- Quality scaler + FPS readout (2E) - giu nguyen lam vong ngoai; preset QUALITY khong doi.
- Bridge/water config (deck profile, lantern post) - giu lam nen cho cau/nuoc 3B.
- game_icons.png + game_icons.json + loader/fallback trong atlasmap.js - tai dung cho icon minimap 3F.

Phai lam lai / lam moi:

- Man hinh loading + % (hien khong co gi) + tach Promise.all thanh giai doan co bao cao.
- Con tro chuot (bo cursor: none toan cuc).
- The info UX (trigger, 1 ngon ngu, tom tat, khong tu dong, tach toast).
- Minimap icon (hien chi cham tron).
- Hinh hoc ho/song (Ho Guom 9 o + Ho Tay 74 o deu la tile vuong phang - muon ho that phai lam lai geometry/print nuoc, khong chi doi texture).
- Tau (he thong di chuyen moi, khong co san).

Trap cung (khong duoc quen khi build):

- T1. Solver 95/96, chi con 1 slot. Moi tile moi tai dung signature socket cu hoac thay tile cu.
- T2. GLB + atlas: tiles.glb 5.9 MB, hanoi-tiles.glb 2.4 MB (25 node), basic-grand.glb 689 KB (chi non-Hanoi), traveller.glb 84 KB, atlas.webp 2.5 MB (4096x4096, 200 sprite), animals.png 4.5 MB. Khong bao gio sua tiles.glb goc.
- T3. Lazy-load: hanoi-tiles.glb chi khi ?map=hanoi; basic-grand.glb chi khi khong Hanoi; thieu GLB thi fallback placeholder, khong throw.
- T4. Cau: chieu cao di duoc lay tu deck profile (config/assets.js:bridge), khong phai tu mesh.
- T5. Save cu: dung key hanoi:v1:<seed> + section visited; khong dung lai section landmarks cu (bi drop).
- T6. Pages deploy flake: run co the FAIL o Deploy step ("no github-pages artifact") trong khi build xanh - re-run 1 lan, khong coi code hong.
- T7. Cache cu: cloud browser va dien thoai user deu co the phuc vu bundle cu du da hard reload - live check phai verify bundle hash (hien tai index-C0ja968t.js) truoc khi ket luan; user mo bang tab an danh hoac them &v=N.
- T8. Khong co headless Chromium/Playwright trong sandbox - khong chup man hinh local; render that chi user check duoc tren may anh.
- T9. Impeccable detect hang 6/6 lan (180 giay, zero output) - lo hong cua quality gate, khong phai verdict ve code. Hallmark sloplint khong ton tai tren npm.
- T10. Chi dung dau gach ngan "-" trong moi file (UI, code comment, commit message, doc). Khong dung gach dai.

## Phu luc A - Nguon nghien cuu (chi nguon da mo, khong che so)

- Nha ong: en.wikipedia.org/wiki/Tube_house; kientrucvietnam.org.vn/nha-pho-ha-noi
- Bien bia Ta Hien: sg.trip.com/moments/poi-ta-hien-beer-street-137196482
- Day dien: tienphong.vn (cap-dien-vien-thong-giang-mang-nhen); laodong.vn (day-cap-dien-chang-chit)
- Cay: vnexpress.net (cac-tuyen-pho-chinh-o-thu-do-duoc-trong-cay-gi-5134811; nhung-hang-co-thu-giua-long-ha-noi-5132176); dantri.com.vn (dac-diem-cac-loai-cay-sap-lam-thay-doi-dien-mao-cac-tuyen-pho-ha-noi)
- Chieu sang Ho Guom: vietnam.vn (ho-hoan-kiem-len-den-moi); dtinews.dantri.com.vn (lighting-technology-gives-hanoi-lake-a-dazzling-night-time-look)
- Co/bang ron: baotintuc.vn (thieng-lieng-mau-co-to-quoc-tren-cac-ngo-pho-thu-do); congly.vn (duong-pho-ha-noi-ruc-ro-mau-co-mung-tet-doc-lap)
- Via he/ganh rong: afamily.vn (8-quan-via-he-chang-bao-gio-can-quang-cao); tuoitre.vn (mieng-thuong-mieng-nho-ha-noi-ve-dem); cafef.vn (dien-mao-ho-guom-ra-sao-sau-khi-ke-be-tong-truong-ton-lat-da-hoa-cuong)
- Xe may: hanoicapital.chinhphu.vn (ha-noi-targets-30-public-transport-use); thanglong.chinhphu.vn (lo-trinh-cho-mot-ha-noi-khong-xe-may)
- Train Street: 22places.com/hanoi-train-street; southeastasiatrains.com/hanoi-train-street; vetauhoa.vn/ga-ha-noi
- Ho Guom: thuthuat.taimienphi.vn (thuyet-minh-ve-ho-guom); mytour.vn (mieu-ta-ve-ho-guom)
- Ho Tay: vietnamtourexpert.com/hanoi-west-lake; hanoidep.vn/ho-tay-quan-tay-ho; tuoitre.vn (saigontimes/van-canh-tay-ho)
- Ocean City load/tier: ~/workspace/lightwaterworld/source/template.html, source/src/quality.js, source/src/main.js (say(), device tier, co crash abyssalLoad, dynamic resolution pix/det)
- Icon minimap: Mapbox Maki v7 (CC0, SVG 15x15); Material Symbols (Apache 2.0); Font Awesome Free (icon CC BY 4.0, bat buoc credit); game_icons.png + game_icons.json co san trong repo

## Phu luc B - Diem CHUA xac minh duoc, can anh that truoc khi chot khi build

- Mau son nha ong (vang/xanh la...): nguon chi noi chung "son mau sang". Chot palette theo 5 anh user gui, khong theo nguon chu.
- Bon nuoc inox, cuc nong dieu hoa, mai ton tren mai nha ong: khong co nguon dinh luong. Them vao 3A chi khi doi chieu duoc anh that.
- Den cau doi 2 qua cau trang + cot den xanh + den long: khong co nguon van ban, chi co bang chung anh (cot den nhieu qua cau ven Ho Guom) + thong so catalogue tham khao.
- Bien doc pho co: chi co 1 nhac toi bang menu doc. Kich thuoc bien doc trong spec la uoc luong theo anh A1.
- So lieu venh nhau, da chot 1 so trong spec nay: xe may Ha Noi ~8 trieu (nguon chinh phu 2025, khong dung so cu 5-6 trieu); Thap Rua 3 tang + vong lau dinh; cau The Huc xay khoang 1865-1886; Ho Tay ~500 ha (khong dung 527,17 ha); chu vi 17-18 km.
