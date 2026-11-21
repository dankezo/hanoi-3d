// Landmark history content (Phase 2B info cards; owner: landmarks agent).
// Text copied EXACTLY from docs/landmark-history.md (researched 2026-11-21 from Wikipedia
// and official Vietnamese tourism/heritage sources). Do NOT rewrite history, do NOT invent
// years or facts: any correction belongs in the doc first, then here. Vietnamese is written
// without diacritics, matching the app convention. Language order in the card: VI first, EN
// second (2C language detection lands later). No long dashes in this file: only short hyphens (-).
//
// Shape per landmark: { nameEN, nameVI, histEN[3], histVI[3], funEN, funVI, source }.

export const LANDMARK_INFO = Object.freeze({
  hoankiem: Object.freeze({
    nameEN: 'Hoan Kiem Lake',
    nameVI: 'Ho Hoan Kiem',
    histEN: Object.freeze([
      'Once a branch of the Red River, the lake was first called Luc Thuy ("Green Water"), then Thuy Quan, where kings reviewed naval troops.',
      'Legend: after driving out the Ming in 1428, Emperor Le Loi was boating here when a golden turtle surfaced and asked for his magic sword back; he returned it, and the lake became Hoan Kiem, "Lake of the Returned Sword".',
      'The Turtle Tower (Thap Rua) on its islet was built in 1886; today the lake is Hanoi\'s symbolic heart, ringed by a car-free walking street at weekends.',
    ]),
    histVI: Object.freeze([
      'Ho tung la mot nhanh song Hong, ban dau goi la Luc Thuy ("nuoc xanh"), sau la Thuy Quan, noi vua duyet thuy binh.',
      'Truyen thuyet: sau khi danh duoi quan Minh nam 1428, vua Le Loi dang di thuyen thi rua vang noi len xin lai guom than; vua tra guom, ho doi ten thanh Hoan Kiem - "Ho Guom".',
      'Thap Rua tren dao nho duoc xay nam 1886; ngay nay ho la trai tim bieu tuong cua Ha Noi, cuoi tuan thanh pho di bo quanh ho.',
    ]),
    funEN: 'The Turtle Tower is not ancient at all - it was built in 1886 by a wealthy landowner, Ba Ho Kim, as a family tomb, and only later became the symbol of the sword legend. The lake\'s last giant softshell turtle, "Cu Rua", died on 19 January 2016 and is now preserved on display inside Ngoc Son Temple.',
    funVI: 'Thap Rua khong he co nhu nhieu nguoi tuong - no duoc xay nam 1886 boi mot phu ho ten Ba ho Kim lam mo gia dinh, mai sau moi gan voi truyen thuyet guom than. Cu rua kho lo cuoi cung cua ho chet ngay 19/1/2016, hien duoc bao quan trung bay trong den Ngoc Son.',
    source: 'https://en.wikipedia.org/wiki/Ho%C3%A0n_Ki%E1%BA%BFm_Lake',
  }),
  ngocson: Object.freeze({
    nameEN: 'Ngoc Son Temple',
    nameVI: 'Den Ngoc Son',
    histEN: Object.freeze([
      'The temple stands on Jade Island in the north of Hoan Kiem Lake, reached by the red wooden The Huc Bridge ("where the morning sunlight rests").',
      'The site began as a pagoda in the early 19th century, honouring national hero Tran Hung Dao (who defeated the Mongol invasions in the 13th century) and the scholar-god Van Xuong.',
      'In 1865 scholar Nguyen Van Sieu led a great restoration, adding The Huc Bridge, the Pen Tower, the Ink Slab and Tran Ba Pavilion; in 2013 the temple was recognised as a National Special Relic.',
    ]),
    histVI: Object.freeze([
      'Den nam tren dao Ngoc, phia bac ho Hoan Kiem, qua cau The Huc son do ("noi anh sang ban mai dong lai").',
      'Ban dau day la chua tu dau the ky 19, tho anh hung Tran Hung Dao (danh thang quan Mong Co the ky 13) va Van Xuong De Quan.',
      'Nam 1865, nha nho Nguyen Van Sieu trung tu lon, dung cau The Huc, Thap But, Dai Nghien va dinh Tran Ba; nam 2013 den duoc cong nhan Di tich quoc gia dac biet.',
    ]),
    funEN: 'Inside the temple you can see two preserved giant softshell turtles from Hoan Kiem Lake - one from 1967 and "Cu Rua", the last one, from 2016 - kept in glass cases. The Pen Tower and Ink Slab at the entrance stand for the pen and ink of scholars: knowledge is the temple\'s real treasure.',
    funVI: 'Trong den co hai tieu ban rua kho lo cua ho Hoan Kiem - mot con tu nam 1967 va "Cu Rua" cuoi cung tu nam 2016 - duoc giu trong tu kinh. Thap But va Dai Nghien o cong vao tuong trung cho but va muc cua ke si: tri thuc moi la bau vat that cua den.',
    source: 'https://vietnamtourexpert.com/ngoc-son-temple/',
  }),
  westlake: Object.freeze({
    nameEN: 'West Lake',
    nameVI: 'Ho Tay',
    histEN: Object.freeze([
      'Hanoi\'s largest lake: about 500 hectares with a 17 km shoreline, formed from an old bend of the Red River.',
      'Kings of the Ly and Tran dynasties built palaces and pagodas on its shores; the lake was once called Dam Dam and Lang Bac before taking the name Ho Tay.',
      'On its south-east islet stands Tran Quoc Pagoda, founded in the 6th century under Emperor Ly Nam De and moved to the lake in 1615 - the oldest pagoda in Hanoi.',
    ]),
    histVI: Object.freeze([
      'Ho lon nhat Ha Noi: khoang 500 ha, bo ho dai 17 km, von la mot khuc song Hong cu.',
      'Vua cac trieu Ly, Tran tung xay cung dien, chua chien ven ho; ho tung co ten Dam Dam, Lang Bac truoc khi mang ten Ho Tay.',
      'Tren dao nho phia dong nam la chua Tran Quoc, dung tu the ky 6 duoi thoi Ly Nam De, doi ra ho nam 1615 - ngoi chua co nhat Ha Noi.',
    ]),
    funEN: 'The bodhi tree in Tran Quoc Pagoda\'s courtyard grew from a cutting of the Bodhi tree at Bodh Gaya in India, a gift from President Rajendra Prasad during his visit in 1959. Legend also says a golden buffalo calf trampled the ground to form the lake while chasing its mother\'s call.',
    funVI: 'Cay bo de trong san chua Tran Quoc moc tu mot canh chiet cua cay bo de o Bodh Gaya, An Do - mon qua cua Tong thong Rajendra Prasad khi tham Viet Nam nam 1959. Truyen thuyet con ke mot chu trau vang da giam nat mat dat tao thanh ho khi chay di tim me.',
    source: 'https://en.wikipedia.org/wiki/West_Lake_(Hanoi)',
  }),
  oldquarter: Object.freeze({
    nameEN: 'Old Quarter',
    nameVI: 'Pho Co Ha Noi',
    histEN: Object.freeze([
      'The merchant town that grew east of the Imperial Citadel of Thang Long after King Ly Thai To chose the site as capital in 1010; it became crowded and lively from the 15th century.',
      'Craftsmen from surrounding villages settled street by street, each trade giving its street a name starting with "Hang" (wares): Hang Bac (silver), Hang Ma (votive paper), Hang Thiec (tin).',
      'The "36 streets" counts the guild wards (phuong) of the Le dynasty, not streets - the Tran dynasty had 61 guilds; today the official quarter covers about 100 ha with 76 streets.',
    ]),
    histVI: Object.freeze([
      'Khu pho buon ban moc len phia dong Hoang thanh Thang Long sau khi vua Ly Thai To chon day lam kinh do nam 1010; tu the ky 15 noi nay tro nen dong duc, sam uat.',
      'Tho thu cong tu cac lang quanh vung tu ve tung pho theo nghe, dat ten pho bat dau bang "Hang": Hang Bac (bac), Hang Ma (giay vang ma), Hang Thiec (thiec).',
      '"36 pho phuong" dem cac phuong nghe thoi Le chu khong phai dem duong - thoi Tran co toi 61 phuong; ngay nay khu pho co chinh thuc rong khoang 100 ha voi 76 duong pho.',
    ]),
    funEN: 'The number 36 never matched the map exactly - scholars still cannot agree on the exact list of the 36 guilds, and some streets still sell exactly what their names say: Hang Bac still sells silver, Hang Ma still sells votive paper.',
    funVI: 'Con so 36 chua bao gio khop dung voi ban do - cac nha nghien cuu den nay van chua thong nhat duoc danh sach 36 phuong, va mot so pho van ban dung thu ten minh: Hang Bac van ban bac, Hang Ma van ban vang ma.',
    source: 'https://en.wikipedia.org/wiki/Old_Quarter,_Hanoi',
  }),
  mausoleum: Object.freeze({
    nameEN: 'Ho Chi Minh Mausoleum',
    nameVI: 'Lang Chu tich Ho Chi Minh',
    histEN: Object.freeze([
      'The granite mausoleum on Ba Dinh Square holds the embalmed body of President Ho Chi Minh (1890-1969), on the very spot where he read the Declaration of Independence on 2 September 1945.',
      'Construction began on 2 September 1973 with Soviet help; the building was inaugurated on 29 August 1975, months after reunification.',
      'The design was inspired by Lenin\'s Mausoleum in Moscow but adapted with Vietnamese touches: a sloping roof, grey granite, 21.6 m high and 41.2 m wide.',
    ]),
    histVI: Object.freeze([
      'Lang da hoa cuong tren Quang truong Ba Dinh giu thi hai Chu tich Ho Chi Minh (1890-1969), dung noi Nguoi doc Tuyen ngon Doc lap ngay 2/9/1945.',
      'Khoi cong ngay 2/9/1973 voi su giup do cua Lien Xo; khanh thanh ngay 29/8/1975, chi vai thang sau ngay thong nhat.',
      'Thiet ke lay cam hung tu Lang Lenin o Mat-xco-va nhung mang net Viet: mai doc, da hoa cuong xam, cao 21,6 m, rong 41,2 m.',
    ]),
    funEN: 'Ho Chi Minh\'s own will asked to be cremated, with his ashes scattered over the hills of the north, centre and south - the mausoleum was built against his wishes so people could pay respects. When the design was chosen, 200 proposals were exhibited and 745,487 visitors left 34,022 opinions.',
    funVI: 'Di chuc cua Bac dan hoa tang, tro rai tren doi nui ba mien Bac - Trung - Nam, nhung Lang van duoc xay trai y nguyen de nhan dan den vieng. Khi chon thiet ke, 200 phuong an duoc trung bay va 745.487 luot nguoi xem da de lai 34.022 y kien.',
    source: 'https://en.wikipedia.org/wiki/Ho_Chi_Minh_Mausoleum',
  }),
  vanmieu: Object.freeze({
    nameEN: 'Temple of Literature',
    nameVI: 'Van Mieu - Quoc Tu Giam',
    histEN: Object.freeze([
      'Founded in 1070 by Emperor Ly Thanh Tong as a temple to Confucius, modelled on the temple at Qufu in China.',
      'In 1076 his son Ly Nhan Tong founded the Quoc Tu Giam (Imperial Academy) inside it - Vietnam\'s first national university, which ran until 1779 and graduated 2,313 doctors.',
      'The 82 stone stelae recording the names of royal exam graduates were entered into UNESCO\'s Memory of the World register in 2010 (Asia-Pacific) and 2011 (international); the temple appears on the back of the 100,000 VND banknote.',
    ]),
    histVI: Object.freeze([
      'Dung nam 1070 duoi thoi vua Ly Thanh Tong lam noi tho Khong Tu, phong theo den tho o Khuc Phu, Trung Quoc.',
      'Nam 1076, con trai vua la Ly Nhan Tong lap Quoc Tu Giam ben trong - truong dai hoc dau tien cua Viet Nam, hoat dong den nam 1779 va dao tao 2.313 tien si.',
      '82 tam bia da ghi ten cac tien si do dat duoc UNESCO ghi vao Danh muc Di san Tu lieu The gioi nam 2010 (khu vuc chau A - Thai Binh Duong) va 2011 (quoc te); hinh anh Van Mieu in o mat sau to tien 100.000 dong.',
    ]),
    funEN: 'Each of the 82 doctor stelae stands on the back of a carved stone tortoise, the symbol of longevity and wisdom - the first were erected in 1484 under Emperor Le Thanh Tong. Students used to rub the tortoises\' heads for luck before exams; the stelae are now fenced off to protect them.',
    funVI: 'Moi tam trong 82 tam bia tien si deu dung tren lung mot con rua da cham khac, bieu tuong cua truong tho va tri tue - nhung tam dau tien duoc dung nam 1484 duoi thoi vua Le Thanh Tong. Si tu ngay xua hay so dau rua lay may truoc ky thi; nay bia da duoc rao lai de bao ve.',
    source: 'https://en.wikipedia.org/wiki/Temple_of_Literature,_Hanoi',
  }),
  onepillar: Object.freeze({
    nameEN: 'One Pillar Pagoda',
    nameVI: 'Chua Mot Cot',
    histEN: Object.freeze([
      'Built in 1049 by Emperor Ly Thai Tong, who dreamt the bodhisattva Quan Am handed him a baby son while seated on a lotus; a monk advised him to build a temple on one pillar in a lotus pond, like the lotus in his dream.',
      'The shrine is a small wooden hall on a single stone pillar, shaped like a lotus blossom rising from the water - the Buddhist symbol of purity.',
      'The original was destroyed by French forces in 1954, days before they left Hanoi; it was rebuilt in 1955, smaller than the original (3 m sides instead of about 4.6 m).',
    ]),
    histVI: Object.freeze([
      'Xay nam 1049 duoi thoi vua Ly Thai Tong, sau giac mo Quan Am bo tat trao cho vua mot be trai khi dang ngoi tren dai sen; nha su khuyen vua dung chua tren mot cot giua ho sen, giong dai sen trong mong.',
      'Chua la mot dien go nho tren mot cot da duy nhat, dang nhu doa sen no tren mat nuoc - bieu tuong thanh khiet cua Phat giao.',
      'Chua goc bi quan Phap pha huy nam 1954, vai ngay truoc khi rut khoi Ha Noi; duoc dung lai nam 1955, nho hon ban goc (canh 3 m thay vi khoang 4,6 m).',
    ]),
    funEN: 'In 2012 the Asia Records Organization recognised it as the pagoda with the most unique architecture in Asia. Its formal name, Dien Huu, means "long-lasting blessings".',
    funVI: 'Nam 2012, To chuc Ky luc chau A cong nhan day la ngoi chua co kien truc doc dao nhat chau A. Ten chinh thuc cua chua la Dien Huu, nghia la "phuc lanh dai lau".',
    source: 'https://en.wikipedia.org/wiki/One_Pillar_Pagoda',
  }),
  cathedral: Object.freeze({
    nameEN: 'St. Joseph\'s Cathedral',
    nameVI: 'Nha Tho Lon Ha Noi',
    histEN: Object.freeze([
      'Hanoi\'s oldest church, built 1884-1886 by the French colonial government and consecrated on Christmas Eve, 24 December 1886.',
      'A Neo-Gothic church modelled on Notre Dame de Paris, with twin square bell towers 31.5 m high, each holding five bells; it serves as the cathedral of the Archdiocese of Hanoi.',
      'It stands on the site of Bao Thien Pagoda, the largest Buddhist pagoda of the Ly-Tran era, abandoned by the 16th century.',
    ]),
    histVI: Object.freeze([
      'Nha tho co nhat Ha Noi, xay 1884-1886 duoi thoi Phap thuoc, khanh thanh dem Giang sinh 24/12/1886.',
      'Kien truc Tan Gothic phong theo Nha tho Duc Ba Paris, hai thap chuong vuong cao 31,5 m, moi thap nam qua chuong; la nha tho chinh toa cua Tong giao phan Ha Noi.',
      'Nha tho dung tren nen chua Bao Thien, ngoi chua Phat giao lon nhat thoi Ly - Tran, bi bo hoang tu the ky 16.',
    ]),
    funEN: 'The cathedral was built on the ruins of an 11th-century Buddhist pagoda - so the oldest church in Hanoi stands exactly where the greatest pagoda of old Thang Long once stood. Locals call it "Nha Tho Lon" (the Big Church).',
    funVI: 'Nha tho duoc xay tren nen mot ngoi chua Phat giao tu the ky 11 - tuc la nha tho co nhat Ha Noi dung dung cho ngoi chua lon nhat cua Thang Long xua. Nguoi Ha Noi goi than mat la "Nha Tho Lon".',
    source: 'https://en.wikipedia.org/wiki/St._Joseph%27s_Cathedral,_Hanoi',
  }),
  opera: Object.freeze({
    nameEN: 'Hanoi Opera House',
    nameVI: 'Nha Hat Lon Ha Noi',
    histEN: Object.freeze([
      'Built 1901-1911 by the French colonial administration as the Municipal Theatre, modelled on the Palais Garnier in Paris, with architects Broyer, Harlay and Lagisquet.',
      'On 19 August 1945 a mass rally of hundreds of thousands filled the square in front, launching the August Revolution; the building then housed the first National Assembly until 1963.',
      'Restored in 1995-1997 for the Francophone Summit; closed again on 31 January 2026 for a two-year renovation.',
    ]),
    histVI: Object.freeze([
      'Xay 1901-1911 duoi thoi Phap thuoc lam Nha hat Thanh pho, phong theo nha hat Palais Garnier o Paris, do cac kien truc su Broyer, Harlay va Lagisquet thiet ke.',
      'Ngay 19/8/1945, hang tram nghin nguoi tap trung o quang truong truoc nha hat, mo dau Cach mang thang Tam; sau do noi day la tru so Quoc hoi khoa dau tien den nam 1963.',
      'Trung tu lon nam 1995-1997 nhan Hoi nghi Phap ngu; tu 31/1/2026 lai dong cua de dai tu trong khoang hai nam.',
    ]),
    funEN: 'To build on the swampy ground near the Red River, engineers drove tens of thousands of bamboo stakes into the soil before pouring the foundations (sources say 30,000-35,000). In colonial times the 870-seat hall stood mostly empty outside the winter opera season - the French government paid an opera company to sing each winter at the native taxpayer\'s expense.',
    funVI: 'De xay tren nen dat lay gan song Hong, tho da dong hang chuc nghin coc tre xuong dat roi moi do mong (cac nguon ghi 30.000-35.000 coc). Thoi thuoc dia, khan phong 870 ghe phan lon thoi gian bo trong ngoai mua opera mua dong - chinh quyen Phap thue han mot doan opera hat moi mua dong bang tien thue cua dan ban xu.',
    source: 'https://en.wikipedia.org/wiki/Hanoi_Opera_House',
  }),
  longbien: Object.freeze({
    nameEN: 'Long Bien Bridge',
    nameVI: 'Cau Long Bien',
    histEN: Object.freeze([
      'Built 1899-1902 by the Paris firm Dayde & Pille (over 3,000 Vietnamese workers) and inaugurated in February 1902 as the Paul Doumer Bridge, named after the Governor-General of Indochina.',
      'At 2.4 km it was then one of the longest bridges in Asia and the first steel bridge over the Red River, linking Hanoi to the port of Haiphong.',
      'Heavily bombed in the Vietnam War - first attacked in 1967, with the central span felled on 11 August 1967, and hit again in 1972 - it was repaired each time and still carries trains, motorbikes and pedestrians today.',
    ]),
    histVI: Object.freeze([
      'Xay 1899-1902 boi hang Dayde & Pille o Paris (hon 3.000 cong nhan Viet Nam), khanh thanh thang 2/1902 voi ten cau Paul Doumer, theo ten Toan quyen Dong Duong.',
      'Dai 2,4 km, luc do la mot trong nhung cay cau dai nhat chau A va la cau thep dau tien bac qua song Hong, noi Ha Noi voi cang Hai Phong.',
      'Bi nem bom du doi trong chien tranh - lan dau nam 1967, nhip giua sap ngay 11/8/1967, roi lai bi danh nam 1972 - nhung lan nao cung duoc sua lai va den nay van co tau, xe may va nguoi di bo qua lai.',
    ]),
    funEN: 'It was NOT designed by Gustave Eiffel - Dayde & Pille beat Eiffel\'s firm in the competition. Hanoians nicknamed it "an Eiffel Tower laid on its side". US bombs destroyed 1,500 m of the bridge, 9 spans and 4 pillars, yet after the 1973 peace accords it was repaired in just 41 days for the first train on 4 March 1973.',
    funVI: 'Cau KHONG phai do Gustave Eiffel thiet ke - hang Dayde & Pille da thang thau truoc hang cua Eiffel. Nguoi Ha Noi goi no la "thap Eiffel nam ngang". Bom My pha huy 1.500 m cau, 9 nhip va 4 tru, vay ma sau Hiep dinh Paris 1973, cau duoc sua xong chi trong 41 ngay de chuyen tau dau tien chay ngay 4/3/1973.',
    source: 'https://en.wikipedia.org/wiki/Long_Bi%C3%AAn_Bridge',
  }),
});

/** Info for one landmark id, or null. */
export function landmarkInfo(id) {
  return LANDMARK_INFO[id] || null;
}

// Dataset provenance + value watermark (Phase 2D). This marker is embedded in
// the dataset itself: the checklist order below is the dataset's distinctive
// ordering, and the watermark string is a searchable provenance marker. If a
// copy of this history text shows up elsewhere carrying the marker, the copy
// came from this repo. Check: search the copy for HANOI3D-DANKEZO-WM-9Q7K2M.
// The full declaration (owner, source, license, decoy-record scheme) lives in
// docs/antirea-declaration.md and data/provenance.json. This export is never
// read by the game UI: it changes no displayed text. No long dashes here.
export const DATASET_PROVENANCE = Object.freeze({
  owner: 'dankezo',
  source: 'https://github.com/dankezo/hanoi-3d',
  license: 'MIT',
  watermark: 'HANOI3D-DANKEZO-WM-9Q7K2M',
  order: Object.freeze(['hoankiem', 'ngocson', 'westlake', 'oldquarter', 'mausoleum', 'vanmieu', 'onepillar', 'cathedral', 'opera', 'longbien']),
});
