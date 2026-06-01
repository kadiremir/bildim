export type Hint =
  | { type: 'text'; content: string }
  | { type: 'image'; uri: string; caption?: string };

export interface Country {
  id: string;
  answer: string; // Türkçe ülke adı, küçük harf
  hints: Hint[];
}

export const countries: Country[] = [
  {
    id: 'bhutan',
    answer: 'bhutan',
    hints: [
      { type: 'text', content: 'Bu ülke, GSYİH yerine Gayri Safi Milli Mutluluk endeksiyle başarısını ölçer.' },
      { type: 'text', content: '1999 yılında televizyonu kabul eden son ülkeydi.' },
      { type: 'text', content: 'Tütün satışı burada yasak — dünyanın sigarasız sayılı ülkelerinden biridir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Flag_of_Bhutan.svg/320px-Flag_of_Bhutan.svg.png', caption: 'Ulusal bayrak, Druk adlı ejderhayı içerir.' },
      { type: 'text', content: 'Himalayaların doğusunda yer alan küçük ve kara ile çevrili bir krallıktır.' },
    ],
  },
  {
    id: 'izlanda',
    answer: 'izlanda',
    hints: [
      { type: 'text', content: 'Bu ülkede sivrisinek yoktur — iklim onların yaşamasına izin vermez.' },
      { type: 'text', content: 'Neredeyse tümüyle yenilenebilir jeotermal ve hidroelektrik enerjiyle çalışır.' },
      { type: 'text', content: 'Düzenli ordusu yoktur ve modern tarihte hiçbir savaşa girmemiştir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Iceland.svg/320px-Flag_of_Iceland.svg.png', caption: 'Bayrak kırmızı, beyaz ve mavi renklerden oluşur; ateşi, buzu ve dağları temsil eder.' },
      { type: 'text', content: 'Adına rağmen oldukça yeşildir; komşusu "Grönland" ise çoğunlukla buzla kaplıdır.' },
    ],
  },
  {
    id: 'moğolistan',
    answer: 'moğolistan',
    hints: [
      { type: 'text', content: 'Bu ülkede insandan çok at vardır — her 10 kişiye yaklaşık 13 at düşer.' },
      { type: 'text', content: 'Dünyanın en seyrek nüfuslu bağımsız devletidir.' },
      { type: 'text', content: 'Geleneksel konutlar ger adı verilen dairesel keçe çadırlardır; bugün hâlâ yaygın biçimde kullanılmaktadır.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Mongolia.svg/320px-Flag_of_Mongolia.svg.png', caption: 'Bayrak, benzersiz ulusal sembol olan Soyombo simgesini taşır.' },
      { type: 'text', content: 'Rusya ile Çin arasına sıkışmış, denize çıkışı olmayan bir ülkedir.' },
    ],
  },
  {
    id: 'slovenya',
    answer: 'slovenya',
    hints: [
      { type: 'text', content: 'Bu ülkenin yüzde altmışından fazlası ormanla kaplıdır — Avrupa\'nın en yeşil ülkelerinden biridir.' },
      { type: 'text', content: 'Dünyanın en eski tekerleği burada bulundu: bir bataklıkta ortaya çıkan 5.000 yıllık ahşap tekerlek.' },
      { type: 'text', content: 'Bu küçük ülke dört farklı komşusuyla sınır paylaşır ve küçük ama etkileyici bir kıyı şeridine sahiptir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Flag_of_Slovenia.svg/320px-Flag_of_Slovenia.svg.png', caption: 'Bayrak, ülkenin en yüksek zirvesi Triglav Dağı\'nı içerir.' },
      { type: 'text', content: 'Başkenti Orta Avrupa\'da yer alır ve L harfiyle başlar.' },
    ],
  },
  {
    id: 'surinam',
    answer: 'surinam',
    hints: [
      { type: 'text', content: 'Yüzölçümü bakımından Güney Amerika\'nın en küçük egemen devletidir.' },
      { type: 'text', content: 'Sömürge tarihinin şaşırtıcı bir mirası olarak resmi dil Felemenkçedir.' },
      { type: 'text', content: 'Ülkenin yaklaşık yüzde doksanı tropikal yağmur ormanıyla kaplıdır.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Flag_of_Suriname.svg/320px-Flag_of_Suriname.svg.png', caption: 'Bayrakta ortada büyük yeşil bir yıldız yer alır.' },
      { type: 'text', content: 'Başkenti Paramaribo, Güney Amerika\'da UNESCO Dünya Mirası listesindeki bir şehirdir.' },
    ],
  },
  {
    id: 'vanuatu',
    answer: 'vanuatu',
    hints: [
      { type: 'text', content: 'Bu ada ülkesi, kişi başına düşen dil sayısında dünyada birinci sıradadır — 300.000\'den az nüfusla 100\'den fazla dil konuşulur.' },
      { type: 'text', content: 'Tanna adası, dünyanın en kolay erişilebilir aktif volkanlarından birine ev sahipliği yapar.' },
      { type: 'text', content: 'Bungee jumping\'in atası olan asma atlama, yüzyıllar önce burada bir ritüel olarak icat edilmiştir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Vanuatu.svg/320px-Flag_of_Vanuatu.svg.png', caption: 'Bayrak, bereketin simgesi olan bir domuz dişini içerir.' },
      { type: 'text', content: 'Güney Pasifik Okyanusu\'nda 80 adadan oluşan bir takımadadır.' },
    ],
  },
  {
    id: 'lihtenştayn',
    answer: 'lihtenştayn',
    hints: [
      { type: 'text', content: 'Dünyanın yalnızca iki "çift kara içi" ülkesinden biridir; yani kara ülkeleriyle çevrili bir kara ülkesidir.' },
      { type: 'text', content: 'Küçücük boyutuna karşın kişi başı gelirde dünyanın en zengin ülkelerinden biridir.' },
      { type: 'text', content: '1866\'da bir askeri tatbikata 80 asker gönderip 81 askerle geri döndüğü ortaya çıktı; yolda bir dost kazanmışlardı.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Flag_of_Liechtenstein.svg/320px-Flag_of_Liechtenstein.svg.png', caption: '1936 Olimpiyatları\'ndaki bir karışıklığın ardından altın taç eklenen bayrak.' },
      { type: 'text', content: 'Bu küçük ülke İsviçre ile Avusturya arasında yer alır.' },
    ],
  },
  {
    id: 'cibuti',
    answer: 'cibuti',
    hints: [
      { type: 'text', content: 'Bu ülke, Afrika\'nın en tuzlu ve en alçak noktalarından biri olan Assal Gölü\'ne ev sahipliği yapar.' },
      { type: 'text', content: 'Küçücük topraklarında Fransa, ABD, Çin ve Japonya\'nın askeri üsleri aynı anda bulunmaktadır.' },
      { type: 'text', content: 'Kızıldeniz\'in girişinde yer alır ve küresel deniz taşımacılığı için kritik bir geçiş noktasıdır.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Flag_of_Djibouti.svg/320px-Flag_of_Djibouti.svg.png', caption: 'Bayrakta mavi ve yeşil üçgenlerin ortasında kırmızı bir yıldız yer alır.' },
      { type: 'text', content: 'Pek çok şehirden küçük olmasına karşın hem ülkenin hem de başkentin adı aynıdır.' },
    ],
  },
  {
    id: 'nauru',
    answer: 'nauru',
    hints: [
      { type: 'text', content: 'Yüzölçümü bakımından dünyanın en küçük ada devleti ve üçüncü en küçük ülkesidir.' },
      { type: 'text', content: 'Fosfat madenciliği sayesinde bir zamanlar dünyanın kişi başı en yüksek gelirli ülkelerinden biriydi; sonra fosfat bitti.' },
      { type: 'text', content: 'Resmi başkenti olmayan dünyadaki tek ülkedir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Flag_of_Nauru.svg/320px-Flag_of_Nauru.svg.png', caption: 'Bayraktaki sarı şerit ekvatoru; yıldız ise adanın tam güneyindeki konumunu temsil eder.' },
      { type: 'text', content: 'Orta Pasifik Okyanusu\'nda küçük oval bir adadır.' },
    ],
  },
  {
    id: 'andorra',
    answer: 'andorra',
    hints: [
      { type: 'text', content: 'Bu küçük ülke iki ayrı lider tarafından ortaklaşa yönetilir: Fransa Cumhurbaşkanı ve İspanya\'daki Urgell Piskoposu.' },
      { type: 'text', content: 'Havalimanı ve tren istasyonu yoktur; ulaşım tümüyle dağ yollarına bağımlıdır.' },
      { type: 'text', content: 'Küçük boyutuna rağmen dünyanın en yüksek yaşam beklentisi ortalamalarından birine sahiptir.' },
      { type: 'image', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Flag_of_Andorra.svg/320px-Flag_of_Andorra.svg.png', caption: 'Armasında hem Fransa\'dan hem İspanya\'dan semboller bulunur.' },
      { type: 'text', content: 'Fransa ile İspanya arasındaki Pireneler\'e sıkışmış bir ülkedir.' },
    ],
  },
];
