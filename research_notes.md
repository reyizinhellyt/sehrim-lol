# Asset Research Notes

## Türkiye İlleri SVG Haritası

Ana sayfadaki 81 il haritası için `ali-han/Turkey-SVG-Map` deposundaki MIT lisanslı SVG harita kullanılabilir. Kaynak, her il öğesinde il kodu ve adını taşıyan veri özniteliklerinin bulunduğunu belirtiyor; bu, uygulamadaki günlük puan ve sıralama verilerinin il bölgelerine eşlenmesini destekliyor.

- Kaynak: https://github.com/ali-han/Turkey-SVG-Map
- Lisans: MIT
- Değerlendirilen alternatif: https://github.com/lutfiEmre/turkey-map-react

Harita, bağımsız ve erişilebilir bir React bileşeni olarak projeye uyarlanacak; görsel satır içi SVG kodu küçük olduğundan ek bir medya dosyası olarak paketlenmeyecek.

## Mobil Menü Yerleşim Doğrulaması

375 × 812 mobil Chromium görünümünde hamburger menü açık halde doğrulandı. Akış içi yerleşimde menü panelinin alt sınırı 264 px, hero alanının başlangıcı ise 282 px olarak ölçüldü. Böylece menü, hero metnini kaplamadan önce sayfa akışında gerekli alanı oluşturuyor; animasyon tamamlandığında dört navigasyon bağlantısı görünür ve okunur durumda kalıyor.

## Gündüz Tema Doğrulaması

1280 × 900 Chromium önizlemesinde `localStorage` içindeki `theme=light` tercihi başarıyla uygulandı; belge kökünde `light` sınıfı ve gündüz modundan geri dönüşü sağlayan tema düğmesi doğrulandı. Ana sayfadaki ikincil “Haritayı keşfet” eylemi koyu turkuaz tonuna çekilerek açık zeminde görünürlük artırıldı.

## Mobil Gündüz Yönetim Paneli Doğrulaması

375 × 812 yönetim paneli önizlemesi `admin?theme=light` yolunda yetkili oturumla alındı. Görünümde yönetim özeti başlığı, gündüz modundan karanlık moda dönüş sağlayan tema düğmesi, dört günlük metrik kartı, ilk 10 şehir tablosu, rollover görevi kartı, Hall of Fame kartı ve son katılımlar kartı görünür durumda. Açık zeminlerde koyu metinler; turuncu, turkuaz ve soluk yeşil kart yüzeyleri ile net biçimde ayrışıyor.

Ekran görüntüsü doğrudan incelendi: üstte “Günlük yarış merkezinde.” başlığı ile “Karanlık moda geç” durumundaki güneş/ay kontrolü, ardından 1 günlük katılım, 1 aktif şehir, 2 kayıtlı kullanıcı ve %50 temsil oranı metrikleri yer alıyor. İlk 10 şehir listesi, etkin rollover kartı ve son katılım satırı admin verilerinin render edildiğini; beyaz kart yüzeylerindeki koyu turkuaz metinler ile vurgulu kartlardaki koyu metinler ise mobil kontrastın okunur olduğunu doğruluyor.

## Harita Yoğunluğu ve Tooltip Doğrulaması

Gerçek Chromium harita denetiminde günlük oy alan Ankara koyu turkuaz, oy almayan iller nötr açık tonda render edildi; SVG dolgu renklerinde iki farklı değer ölçüldü. İlk tooltip önizlemesinde genel `.turkey-map > div` genişlik kuralının bilgi baloncuğunu gereğinden fazla genişlettiği ve üst bölgelerde konumu zayıflattığı görüldü. Tooltip bileşenine içerik genişliği ve daha güvenli üst konum sınırı uygulanarak bu görsel çakışma düzeltildi; takip eden önizleme ile tekrar doğrulanacak.

Masaüstü Chromium doğrulamasında Ankara üzerine fareyle gelindiğinde tooltipin açıldığı; il adı, oy sayısı ve Türkiye sırası metinlerinin okunur biçimde gösterildiği görüldü. 375 × 812 dokunmatik Chromium doğrulamasında ise tooltip 148 px genişlikle 335 px genişliğindeki harita alanı içinde kaldı; kırpılma veya yatay taşma oluşmadı.

Zenginleştirilmiş tooltip doğrulamasında günün lideri, lider katkısı, günlük oy, Türkiye sırası ve lider puanı alanları mobil görünümde birlikte incelendi. Tooltip 238 px genişlikle 335 px harita alanında kaldı; üst kenara yapışmadan okunur göründü. İkinci dokunuş ve harita dışına dokunma ile kapanma yolları da gerçek dokunmatik Chromium ortamında doğrulandı.

Admin kullanıcı listesi doğrulamasında ayrı “Kayıtlı kullanıcılar” menüsü üzerinden rol-korumalı kullanıcı listesi masaüstünde tablo düzeniyle, küçük ekranda ise yatay kaydırılabilir alanla erişilebilir kaldı. Liste; ad, e-posta, rol, temsil ili, giriş yöntemi, kayıt zamanı ve son oturum zamanını yalnızca yönetim alanında gösteriyor.

Kullanıcı listesi, erişilebilir tablo rolleri ve boş liste durumu eklendikten sonra admin oturumunda yeniden doğrulandı. Masaüstünde altı sütun tam görünürken, 375 px genişlikte başlıklar ve kayıt satırları okunur kaldı; geniş veri alanı yatay kaydırılabilir kapsayıcıyla korundu.

Kullanıcı listesi rotası, normal kullanıcı bağlamında koruma ekranını gösterdi. Yönetici önizlemesinde ise aynı rota masaüstü ve 375 px görünümde kayıtlı kullanıcı tablosunu render etti; mobilde tüm sütunlar yatay kaydırılabilir kapsayıcı içinde korunarak satırların okunurluğu devam etti.

Word dışa aktarma düğmesi, yönetici kullanıcı listesi araçlarında masaüstünde tema ve siteye dönüş eylemleriyle birlikte; 375 px görünümde ise ayrı, okunur bir satırda doğrulandı. Düğme boş listede devre dışı kalacak şekilde tasarlandı ve yalnızca yönetici kullanıcı listesi ekranında render ediliyor.

## Şehir Valisi Penceresi Doğrulaması

Gerçek Chromium masaüstü doğrulamasında Ankara SVG bölgesine tıklandığında şehir ayrıntı penceresi açıldı. Pencere 1280 × 720 görünümde 370 × 367 px ölçüldü ve ekranın ortasında tamamen görünür kaldı. Ankara şehir ayrıntısı başlığı, Türkiye sırası, günlük puan, şehir seçimi/oy çağrısı, kapatma düğmesi ve **Şehir Valisi** alanı okunur durumdadır. Şehir Valisi alanı kişisel lider adı ya da bireysel katkı göstermeden yalnızca şehir bazlı gizlilik açıklaması sunar.

375 × 812 mobil Chromium doğrulamasında aynı Ankara harita tıklaması 347 × 358 px boyutunda pencere açtı. Sol ve sağda 14 px boşluk kaldı; pencerenin alt sınırı 585 px olduğundan viewport içinde tamamen göründü. Başlık, sıra/puan satırı, kırmızı katılım çağrısı, Şehir Valisi kartı ve kapatma düğmesi çakışmadan okunur kaldı.

## Harita Renk Kararlılığı Doğrulaması

İlk harita yüklemesinde seçili il sınıfı uygulanmadığı doğrulandı. Ankara tıklaması sonrasında altı ardışık Chromium örneklemesinde seçili sınıf, yoğunluk rengi (`hsl(182 62% 28%)`) ve turuncu sınır rengi (`rgb(238, 159, 68)`) hem 1280 × 720 masaüstünde hem 375 × 812 mobilde değişmeden kaldı. Renk ve seçili durum artık SVG üretim aşamasında işlendiğinden etkileşim dinleyicilerinin yeniden bağlanması sırasında oluşan görsel sıçrama engellendi.

Ekran görüntüsü incelemesinde masaüstünde Ankara yalnızca ince, sabit turuncu sınırla vurgulanırken puan yoğunluğu rengi korunuyor; diğer illerin renkleri yerinde kalıyor. 375 × 812 mobilde Ankara harita alanı içinde kalıyor, tooltip haritanın üst kısmında okunuyor ve seçili il ayrıntı kartı haritanın altında sayfa akışında devam ediyor. Yatay taşma veya titreşim oluşturan animasyon gözlenmedi.

## Şehir Valisi Reklam Alanı Doğrulaması

Ankara harita tıklamasıyla açılan şehir penceresinde Şehir Valisi bölümü artık açıkça **REKLAM** etiketi taşıyan sponsor alanı olarak gösteriliyor. Masaüstü 1280 × 720 Chromium görünümünde pencere 370 × 435 px ölçüldü; şehir adı, sıra/puan satırı, oy çağrısı, “Bu alan reklama açık” metni, sponsor alanı açıklaması, reklam alanı eylemi ve şeffaf etiketleme notu okunur kaldı. 375 × 812 mobilde pencere 347 × 426 px ölçüldü ve tamamen viewport içinde kaldı; başvuru eylemi ile kapatma düğmesi çakışmadı. Gerçek reklamveren veya kullanıcı verisi kullanılmadı.

## Şehir Valisi Başvuru Popup Doğrulaması

Şehir Valisi Ol eylemiyle açılan başvuru popup’ı masaüstü 1280 × 720 görünümde tek ekranda şehir, marka/kurum, e-posta, web adresi ve başvuru notu alanlarıyla birlikte okunur kaldı. 375 × 812 mobil önizlemede de tüm alanlar, bilgilendirme metni, gönderim düğmesi ve kapatma kontrolü dikey taşma olmadan görünür kaldı. Bu doğrulama yalnızca geliştirme önizlemesinde geçici durum tetikleyicisiyle yapıldı; tetikleyici üretim kodundan kaldırıldı.

Oturum açılmış gerçek kullanıcı bağlamında Ankara harita tıklamasıyla şehir ayrıntı penceresi açıldı; ardından **Şehir Valisi Ol** eylemi başvuru popup’ını açtı. Popup içinde seçili şehir, marka/kurum, e-posta, web adresi ve başvuru notu alanları; açıklama metni, kapatma düğmesi ve gönderim çağrısı masaüstü görünümde aynı anda erişilebilir kaldı. Doğrulama sırasında herhangi bir başvuru gönderilmedi.

## Şehir Valisi Başvuru Popup Tema Doğrulaması

Oturum açılmış gerçek kullanıcıda Ankara → Şehir Valisi Ol akışında popup, gündüz temasında açık krem/yeşil yüzey, koyu metin, görünür alan sınırları ve mercan gönderim çağrısıyla doğrulandı. Popup açıkken tema düğmesi koyu temaya geçirildiğinde aynı popup anında koyu mavi-yeşil yüzeye, açık metne ve mevcut yüksek kontrastlı CTA’ya döndü; form alanları, kapatma düğmesi ve gönderim çağrısı okunur kaldı. Başvuru gönderilmedi.

375 × 812 mobil önizlemede popup gündüz temasında açık yüzey, koyu etiketler, belirgin odak sınırı ve mercan CTA ile viewport içinde kaldı. Aynı mobil popup koyu temada koyu mavi-yeşil yüzeye, açık metne ve görünür alan sınırlarına geçti; kapatma düğmesi ile CTA çakışmadı. Tema görsel doğrulamasından sonra kullanılan geçici geliştirme önizleme tetikleyicisi üretim kodundan kaldırıldı.

## Şehir Valisi Başvuru Yönetimi Doğrulaması

Oturumlu masaüstü kullanıcı görünümünde **Başvurularım** sayfası şehir, marka, inceleme durumu, güncelleme zamanı, web adresi ve başvuru notunu tek kartta gösterdi. Yönetici oturumunda **Şehir Valisi başvuruları** ekranı sidebar menüsünde görünürken, başvuru sahibi/iletişim bilgileri, şehir, karar notu alanı ve ayrı Reddet/Onayla eylemleri kullanılabilir kaldı. 375 × 812 mobil doğrulamada Başvurularım kartı ve admin inceleme formu tek sütunda, taşmadan; karar düğmeleri aynı satırda erişilebilir göründü. Bu doğrulamada gerçek karar veya başvuru gönderimi yapılmadı.

## Canlı Dosya ve Karar Akışı Doğrulaması

23 Ağustos 2026 tarihinde, yetkili ve oturumlu kullanıcı bağlamında Ankara için açıkça test amaçlı bir **sehrim.lol Doğrulama Markası** başvurusu gönderildi. Başvuru formunda 1 × 1 PNG test dosyası seçildi; seçili dosya adı formda görünür kaldı, gönderim sonrasında başarı bildirimi gösterildi ve form kapandı. Başvurularım ekranında kayıt **İnceleniyor** durumunda, ek dosya eylemiyle birlikte görüntülendi. Dosya eylemi yalnızca sahibi adına imzalı geçici erişim bağlantısı üretti; test PNG’si 1 × 1 çözünürlükte açıldı.

Yetkili yönetici ekranında aynı kayıt, ek dosyası ve kullanıcı iletişim alanlarıyla listelendi. `Test doğrulaması: dosya ve karar akışı kontrol edildi.` notuyla **Reddet** eylemi uygulandı. Yönetim ekranı gecikmeden **Reddedildi** durumunu, karar notunu ve karar zamanını gösterdi. Başvurularım ekranına dönüldüğünde kullanıcı tarafında da **Reddedildi** durumu ve yönetici notu göründü. Masaüstü ile 375 × 812 mobil tam sayfa ekran görüntülerinde her iki görünümde de durum, dosya eylemi ve karar notu yatay taşma olmadan okunur kaldı.

## Onaylı Şehir Valisi Sponsor Kartı Doğrulaması

Onaylı başvurular için public sorgu yalnızca şehir kodu, marka adı, web adresi ve kampanya metnini döndürecek şekilde sınırlandı; başvuru sahibi, e-posta, ek dosya anahtarı ve karar verisi bu görünümün dışında tutuldu. Bir şehirde birden fazla onaylı kayıt bulunursa en güncel kayıt görünür sponsor olarak seçiliyor.

Canlı Ankara şehir penceresinde aktif onaylı kayıtla pembe-krem sponsor kartı; şehir valisi etiketi, **AKTİF** rozeti, marka adı, iki satırlık kampanya metni, dış sitede açılan `Markayı ziyaret et` eylemi ve ikincil başvuru eylemiyle doğrulandı. Kartın erişilebilir adı şehir bazlıdır. Tarayıcı denetiminde kartta e-posta ve başvuru sahibi adı bulunmadığı görüldü.

Gerçek 375 × 812 Chromium doğrulamasında popup 375 px viewportta açıldı; sponsor kartı 305 px genişlikte, sol 35 px ve sağ 35 px boşlukla kaldı. Belge genişliği de 375 px olarak ölçüldü; yatay taşma oluşmadı. `Markayı ziyaret et` ve `Şehir Valiliğine başvur` eylemleri ayrı tam genişlik satırlarda, görünür ve dokunulabilir kaldı. 61 Vitest testi, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Canlı Platform Durum Şeridi Doğrulaması

Ana sayfa hero açıklamasının altına örnek hiyerarşisini izleyen **ONLINE / ZİYARET / OY** şeridi eklendi. Çevrimiçi değer, son 75 saniyede heartbeat gönderen anonim tarayıcı oturumlarının yalnızca toplam sayısıdır; oturum anahtarları, adlar veya e-posta adresleri public API’ye dönmez. Ziyaret değeri yeni bir tarayıcı oturumunda bir kez artırılır; oy değeri ise `participations` tablosundaki toplam puanların agregasyonudur.

1280 × 720 masaüstü görünümünde şerit hero metniyle CTA arasında tek satırda kaldı. 375 × 812 mobil görünümünde yeşil online noktası ve üç özet sayı okunur biçimde tek satırda kaldı; yatay taşma veya CTA ile çakışma görülmedi. Özet doğrulama sorgusu, yalnızca toplamları okuyarak 5 ziyaret, 5 aktif oturum ve 2 toplam oy değeriyle UI’nin çalışma akışını doğruladı. 19 test dosyasında 64 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Onaylı Sponsor Logo Kartı Doğrulaması

Onaylı sponsor public sorgusu artık yalnızca PNG, JPEG ve WEBP ek dosyaları için public görsel yolu üretir. PDF ve görseli olmayan başvurularda kart; marka baş harfini taşıyan, erişilebilir adı bulunan renkli bir logo yedeği gösterir. Ek dosya anahtarı, başvuru sahibi, iletişim bilgileri ve karar verileri sponsor verisinde yer almaz.

Canlı Ankara sponsor kartında onaylı PNG logo başarıyla yüklendi; görselin doğal genişliği 1887 px olarak doğrulandı. Gündüz ve koyu tema masaüstü görünümünde logo, marka adı, kampanya metni, `Markayı ziyaret et` ve `Şehir Valiliğine başvur` eylemleri okunur kaldı. Gerçek 375 × 812 Chromium görünümünde sponsor alanı 305 px genişlikte, viewport içinde sol ve sağ 35 px boşlukla konumlandı; belge genişliği 375 px kaldı, yatay taşma olmadı ve iki eylem görünür/dokunulabilir durumdaydı. 19 test dosyasında 65 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

Koyu tema URL önizlemesiyle tekrarlanan gerçek 375 × 812 Chromium doğrulamasında da aynı 305 px sponsor kartı genişliği ve 375 px belge genişliği ölçüldü. PNG logo yüklü, `Markayı ziyaret et` mercan yüzeyi ile ikincil başvuru eylemi koyu yüzeyde yeterli ayrışmayla görünür kaldı; yatay taşma ya da CTA çakışması gözlenmedi.

## Valiliği Devral Eylemi Doğrulaması

Onaylı sponsor kartındaki ikincil eylem `Şehir Valiliğine başvur` yerine **Valiliği Devral** olarak güncellendi. Metnin solunda yalnızca dekoratif kabul edilen küçük kalkan/doğrulama simgesi yer alır; butonun erişilebilir adı yalnızca eylem metnidir. Gerçek koyu tema 375 × 812 Chromium doğrulamasında buton 275 px genişlikte, 50–325 px aralığında kaldı; belge genişliği 375 px idi. Simge bulundu, metin tam göründü ve yatay taşma oluşmadı. 19 test dosyasında 65 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Yeni Wordmark Logo Tema Önizlemesi

Kullanıcının sağladığı altın-beyaz Sehrim.lol wordmark varlığı proje depolamasına `/manus-storage/sehrim-lol-wordmark-logo_e2e34c27.png` olarak alındı. Gerçek tarayıcıda hem koyu tema hem gündüz teması URL önizlemelerinde üst navigasyonda koyu teal yüzey üzerinde ölçülü bir çerçeveyle görünür kaldı. Bu sabit koyu logo yüzeyi, beyaz ve altın wordmarkın açık tema arka planında da kaybolmasını engelledi.

Gündüz tema Ankara sponsor penceresinde onaylı Sehrim.lol kaydı için aynı wordmark sponsor kartında da kullanıldı; marka metni ve iki eylem görünür kaldı. Gerçek 375 × 812 Chromium doğrulamasında belge genişliği 375 px, sponsor alanı 305 px kaldı ve yatay taşma oluşmadı. Üst marka logosu 108 × 24 px, sponsor wordmarkı 255 × 24 px doğal oranını koruyarak yüklendi. Koyu teal yüzey, açık tema arka planında beyaz-altın görselin kontrastını korudu. Zamanlama hassasiyetli harita tıklama testi de dinleyici hazır durumunu bekleyecek biçimde güçlendirildi; 19 test dosyasında 66 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Tekil Wordmark Kullanımı

Kullanıcı isteği doğrultusunda sağlanan Sehrim.lol wordmark yalnızca üst navigasyonun marka alanında bırakıldı. Mobilde 108 × 24 px doğal oranını koruyan üst wordmark, mevcut koyu teal yüzey ve kenarlıkla açık/koyu tema kontrastını korur. Şehir Valisi sponsor kartı, tekrar eden wordmark yerine her onaylı başvurunun kendi yüklediği logoyu; logo yoksa erişilebilir marka baş harfi yedeğini göstermeye döndü. Tekil kullanım, sponsor kartındaki özgün logo beklentisiyle test edildi; 19 test dosyasında 66 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Sade Üst Marka Görünümüne Dönüş

Kullanıcı geri bildirimi üzerine geniş wordmark görseli üst navigasyondan kaldırıldı ve önceki sade görünüm geri yüklendi: turuncu `tr` rozetinin yanında `sehrim.lol` metni bulunuyor. 1280 × 720 masaüstü ekran görüntüsünde marka, ana menü ve hesap eylemleriyle dengeli kaldı. 375 × 812 mobil görünümünde rozet ve metin ilk satırda taşmadan görünür kaldı; ikinci satırda hesap eylemleri ve hamburger düğmesi düzgün hizalandı. 19 test dosyasında 66 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Harita Üzeri Şehir Valisi Logo Rozetleri

Public onaylı sponsor çıktısındaki yalnızca görsel logolar, şehir koduyla eşleştirilerek harita rozet verisine dönüştürüldü. PDF ve logosuz başvurular rozet oluşturmaz; başvuru sahibi, iletişim, dosya anahtarı veya karar verisi harita bileşenine iletilmez. Her rozet şehir geometrisinin merkezine göre hesaplanır; beyaz-gold çerçeve, küçük taç işareti ve açık-koyu tema uyumuyla sunulur.

Rozetler erişilebilir şehir/marka adı taşır ve tıklandığında aynı şehir ayrıntı penceresini açar. Yeni birim testi, görsel URL’li Ankara sponsor rozeti ile tıklama yönlendirmesini doğruladı. Sıfır rozet durumunda boş konum nesnesinin tekrar yazılmasını engelleyerek mevcut harita tooltip/tıklama dinleyicilerinin kararlılığı korundu. 1280 × 720 tam sayfa ve 375 × 812 mobil tam sayfa doğrulamalarında rozetler harita alanı içinde kaldı; yatay taşma veya şehir ayrıntı kartıyla çakışma gözlenmedi. 19 test dosyasında 67 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Sponsor Rozeti Tooltipi ve Kompakt Boyut

Şehir Valisi rozetleri, önceki 25–40 px aralığından hafifçe küçültülerek 23–36 px aralığına alındı; rozet tacı da bu ölçüyle dengelendi. Rozetin üzerine gelindiğinde veya klavye odağı verildiğinde, şehir adı ve public sponsor marka adıyla **ŞEHİR VALİSİ** bilgi kutucuğu görünür. Tooltip yalnızca `cityName` ile onaylı başvurunun `brandName` alanını kullanır; başvuru sahibi, e-posta, web adresi ve karar notu göstermez.

Canlı tarayıcı doğrulamasında Adana rozeti hover edildiğinde koyu tema haritasında `ŞEHİR VALİSİ / Adana / Sehrim.lol` tooltipi görünür kaldı. Tooltip rozetin üstünde, gold kenarlık ve işaretçiyle göründü; rozet tıklama eylemi korundu. Birim testi hover açılışı, kapatılması ve kişisel lider adının yokluğunu doğruladı. 19 test dosyasında 67 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Yönetici Sponsor Kaldırma ve Yeniden İnceleme

`city_governor_applications.status` enumuna `removed` durumu eklendi ve `0005_bent_ulik.sql` migrasyonu veritabanına uygulandı. Yönetici; yalnız **Onaylandı** durumundaki bir başvuruyu `Yayından kaldır` eylemiyle `removed` durumuna taşıyabilir. Bu işlem dosyayı veya başvuru kaydını silmez; kaldırma notu, karar veren yönetici ve karar zamanı kayıt üzerinde kalır. Public sponsor sorgusu yalnız `approved` durumunu döndürdüğü için kaldırılan kayıt şehir ayrıntı kartından ve harita rozetinden otomatik olarak kaybolur.

Kaldırılan karttaki `Yeniden incelemeye al` eylemi başvuruyu `pending` durumuna döndürerek yeniden onay/ret sürecine açar. Her iki endpoint `adminProcedure` ile sınırlıdır; normal kullanıcı arayüzünde gerçek tarayıcı doğrulamasında yönetim ekranının erişim engeli gösterildi. Router yetki sınırları, kaldırma/yeniden inceleme mutasyonları, admin kart eylemleri ve status görünümü testlerle doğrulandı. Harita tooltip testi de dinleyicinin hazır olmasını bekleyecek şekilde güçlendirildi. 19 test dosyasında 70 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Geçmiş Şampiyonlar Önizlemesi ve Tam Arşiv

Ana sayfadaki Hall of Fame alanı artık yalnız ilk beş arşiv kaydını gösterir. Listenin altındaki `Tüm Şampiyonlar` eylemi `/sampiyonlar` sayfasına yönlenir. Yeni sayfa aynı arşiv sorgusundaki tüm sonuçları; sıra, şehir adı, günlük toplam puan ve kayıt tarihiyle listeler; arşiv boşsa yarışa dönüş eylemi sunar.

Canlı tarayıcı doğrulamasında ana sayfa önizlemesi Adana, Adıyaman, Ankara, Afyonkarahisar ve Ağrı olmak üzere beş kayıtta durdu; Tüm Şampiyonlar bağlantısı görünür kaldı. `/sampiyonlar` sayfasında 30 arşiv kaydı sıralı biçimde yüklendi. 1280 × 720 masaüstü görünümünde tablo sütunları dengeli kaldı; 375 × 812 mobil görünümünde tarih ikinci satıra taşınarak satırlar yatay taşma olmadan okundu. 20 test dosyasında 73 test, tür denetimi ve üretim derlemesi başarılı tamamlandı.

## Şehir Ayrıntısı Öne Çıkan Özellik Kartı

Canlı açık tema tarayıcı doğrulamasında Yozgat şehri seçildiğinde şehir ayrıntısı popupında puan satırının altında `ŞEHRİN İZİ` bilgi kartı göründü. Kart, `Çamlık Milli Parkı ve bozok kültürüyle öne çıkar.` metnini kısa biçimde sundu; oy ve sponsor eylemleriyle çakışmadı. Kartın gold-tonlu ikonu, açık temadaki krem/yeşil yüzeyde okunur kaldı.

Koyu tema canlı doğrulamasında da aynı Yozgat kartı koyu teal popup yüzeyinde, gold etiket ve açık metin kontrastıyla görünür kaldı. Bilgi alanı oy CTA'sı ile sponsor kartı arasında dengeli kaldı; popup taşması gözlenmedi.

Gerçek 375 × 812 mobil Chromium doğrulamasında Yozgat popupı 347 px genişlikte kaldı; belge genişliği 375 px ile eşleşti ve yatay taşma oluşmadı. `ŞEHRİN İZİ` kartı, kısa metin, oy CTA'sı ve Şehir Valisi kartı viewport içinde okunur biçimde sıralandı. Son kalite doğrulamasında 21 test dosyası / 75 test geçti; `pnpm check` ve `pnpm build` başarıyla tamamlandı. Vite'ın 500 kB üzeri chunk uyarısı mevcut üretim yapılandırmasında engelleyici değildir.

## Şehrin Valileri Liste Alanı

Ana sayfadaki `SEÇİLİ İL` özeti kaldırılarak yerine yalnızca onaylı public sponsor çıktısına dayanan `Şehrin Valileri` alanı yerleştirildi. Kartlar şehir kodu, şehir adı, marka adı, onaylı kampanya metni ve izinli logo/baş harfi yedeğini gösterir; başvuru sahibi, iletişim bilgisi, karar meta verisi veya bireysel yarış katkısı görünmez. Şehir adı eylemi ilgili ayrıntı popupını açar, `Valiliği Devral` eylemi seçili şehirle mevcut başvuru akışına yönlendirir.

Tam sayfa masaüstü 1280 × 720 ve mobil 375 × 812 önizlemelerinde liste harita yanında/sırasında dengeli kaldı; mobilde tek sütunda, yatay taşma olmadan ilerledi. Onaylı üç sponsor kartı görünür kaldı; kartların logo, kampanya ve eylem hiyerarşisi erişilebilir biçimde ayrıştı.

## Kompakt Vali Önizlemesi ve Tam Liste

Ana sayfadaki Şehrin Valileri paneli ilk altı onaylı sponsorla sınırlandırıldı; kartlarda şehir kodu, şehir/marka adı, tek satıra indirgenen kampanya metni ve kompakt `Devral` eylemi korundu. Panel sonunda `/valiler` rotasına giden `Tüm Vali Listesi` bağlantısı eklendi. Ayrı sayfa tüm onaylı sponsorları şehir adı, marka, kampanya, izinli logo ve ana sayfadaki şehir ayrıntısına geri bağlanan eylemle gösterir.

1280 × 720 açık tema doğrulamasında ana sayfa yanında altı kompakt kart ve alt bağlantı düzenli kaldı. `/valiler` tam liste sayfası aynı görünümde altı gerçek onaylı kayıtla açıldı; satırlar dengeli, logo/metin hiyerarşisi okunur ve geri dönüş eylemi görünür kaldı.

375 × 812 mobil doğrulamasında ana sayfa önizlemesi altı kartı tek sütunda kısa satırlarla gösterdi; `Tüm Vali Listesi` eylemi kartlardan sonra görünür kaldı. `/valiler` sayfasında şehir/marka bilgisi ve `Şehri aç` eylemi her satırda sığdı, yatay taşma gözlenmedi. Açık tema yüzeyleri ile metin/eylem kontrastı okunur kaldı.

Canlı yönlendirme doğrulamasında `/valiler` listesindeki Ankara eyleminin hedeflediği `/?il=06#yaris` adresi ana sayfadaki Ankara şehir ayrıntısı popupını doğrudan açtı. Son kalite çalıştırmasında 22 test dosyasında 77 test geçti; `pnpm check` ve `pnpm build` başarılı tamamlandı. Vite'ın 500 kB üstü üretim chunk uyarısı engelleyici değildir.

## Vali Kartı Web Sitesi Yönlendirmesi

Tüm Vali Listesi'ndeki her satır artık onaylı başvurunun public web adresine giden tek bir dış bağlantıdır. Kartta görünen `Siteyi ziyaret et` ibaresi, kartın tamamının tıklanabildiğini açıklar; bağlantı yeni sekmede `noopener noreferrer` korumasıyla açılır.

1280 × 720 masaüstü ve 375 × 812 mobil doğrulamalarında altı kartın tamamında dış bağlantı eylemi görünür kaldı; kompakt satır hiyerarşisi ve yatay taşmasız yerleşim korundu.

Kart bağlantılarının `href`, yeni sekme hedefi ve `noopener noreferrer` koruması birim testle doğrulandı. Harita tıklama testi de dinleyiciler hazır olduktan sonra yürütülecek biçimde güçlendirildi. Son kalite kontrolünde 22 test dosyasındaki 77 test, tür denetimi ve üretim derlemesi başarıyla tamamlandı.

## Butonsuz Tıklanabilir Vali Kartları

Ana sayfadaki altılı vali önizlemesi ile `/valiler` tam liste sayfasındaki tüm kartlar, onaylı web adreslerine giden tek bir dış bağlantı olarak düzenlendi. Ayrı `Devral` ve `Siteyi ziyaret et` eylemleri kaldırıldı; şehir, marka, kampanya ve logo alanının tamamı tıklanabilir kaldı.

1280 × 720 masaüstü ve 375 × 812 mobil doğrulamasında her iki liste, ek eylem butonu olmadan dengeli ve yatay taşmasız göründü. Mobil tam liste kartlarında marka/kampanya hiyerarşisi okunur kaldı.

## Tekrarlanan Şehir Adının Kaldırılması

`/valiler` kartlarında `Şehir Valisi` başlığının altındaki ikinci şehir satırı kaldırıldı. Şehir kodu, tek satırlık vali başlığı, marka logosu/ismi ve kampanya metni korunarak kart hiyerarşisi sadeleştirildi.

1280 × 720 masaüstü ve 375 × 812 mobil görünümünde tekrar eden konum satırı görünmedi; kartların yüksekliği daha dengeli kaldı ve yatay taşma oluşmadı.

## Şehrin Valileri Canlı Durum Noktası

Şehrin Valileri başlığındaki yeşil durum noktası, canlı listeyi işaretleyecek şekilde yumuşak opaklık/ölçek nabız animasyonu alır. Animasyon yalnız `prefers-reduced-motion: no-preference` ortamında etkin olduğundan hareket azaltma tercihi olan kullanıcılar sabit durum noktasını görür.

1280 × 720 masaüstü ile 375 × 812 mobil önizlemelerinde durum noktası başlık hizasını korudu ve kart listesiyle çakışmadı.

## 81 İlin Valileri Araçları

Ana sayfadaki `Tüm Vali Listesi` bağlantısı sol hizaya taşındı; üst ayırıcı çizgisi kaldırıldı. Tam liste sayfası `81 İlin Valileri` başlığıyla güncellendi ve liste kartlarının üstüne Aktif Valiler, Taht Tarihçesi ve Tüm Şehirler hızlı filtreleri ile şehir/vali/plaka arama alanı eklendi.

Taht Tarihçesi için public tarihsel veri bulunmadığından açık bir boş durum sunuldu; örnek veya kişisel kayıt üretilmedi. Tüm Şehirler görünümü, 81 ilin mevcut aktif valilik veya açık alan durumunu gösterir. 1280 × 720 ve 375 × 812 önizlemelerinde filtre çubukları, arama alanı ve aktif liste taşmadan okunur kaldı.

Aktif Valiler, Taht Tarihçesi ve Tüm Şehirler filtreleri düğme durumu ile erişilebilir biçimde işaretlendi. Arama; şehir adı, marka/vali adı, kampanya metni ve iki haneli plaka kodunu karşılaştırır; sonuç ve boş durumlar görünür metinle açıklanır. Son kalite kontrolünde 23 test dosyasında 79 test, tür denetimi ve üretim derlemesi başarıyla tamamlandı.

## Eski Valiler Geçmişi

`city_governor_history` tablosu, aktif bir şehir valisi başka bir onayla değiştirildiğinde, yayından kaldırıldığında veya onayı geri çekildiğinde önceki public kart bilgilerini saklamak için eklendi. Public sorgu yalnız şehir kodu, marka, site, kampanya, izinli logo, değişiklik türü ve tarih döndürür; başvuru sahibi, e-posta, karar notu ve ek dosya meta verisi paylaşılmaz.

`Taht Tarihçesi` filtresi `Eski Valiler` olarak güncellendi. Görsel doğrulamada 1280 × 720 ve 375 × 812 görünümde yeni filtre adı, araç çubuğu ve aktif kartlar taşmadan görünür kaldı. Yeni geçmiş tablosu önceki kayıtları uydurmadan yalnız bundan sonraki gerçek vali değişikliklerini gösterecektir.

## Şehir Sıralaması Bölge Eşlemesi

81 ilin yedi coğrafi bölge eşlemesi, il kodu ve bölge adlarını birlikte veren [Türkiye Şehirler Bölgeler veri seti](https://github.com/yigith/TurkiyeSehirlerBolgeler) ile kontrol edildi. Yedi ana bölgenin kapsamı, [Türkiye Bölgeler Haritası](https://bujuyollarda.com/turkiye-bolgeler-haritasi/) kaynağındaki Marmara, Ege, Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu ve Güneydoğu Anadolu sınıflamasıyla çapraz doğrulandı. Uygulama, yalnız bu statik coğrafi sınıflamayı kullanır; kullanıcı verisi veya kişisel katkı bilgisi eklemez.

Şehir Sıralaması alanı 1280 × 720 görünümde başlık, geniş arama alanı, yatay bölge filtreleri ve sıralama tablosuyla okunur kaldı. 375 × 812 mobil görünümde bölge menüsü yatay kaydırılabilir biçimde taşmasız kaldı; arama alanı ve üç sütunlu satırlar okunur biçimde korundu.

Tüm Bölgeler görünümü 1280 × 720 ve 375 × 812 doğrulamalarında gerçek toplam oy ve yüzde verisini kullanan ayrıntılı şehir kartlarını gösterdi. Kart içindeki ilerleme çubuğu, onaylı Şehir Valisi markasının güvenli yeni sekme bağlantısı ve şehir bazlı Eski Valiler özeti aynı hiyerarşide taşmadan kaldı. Geçmişi veya aktif valisi olmayan şehirlerde uydurma marka yerine açıklanabilir boş durum sunuldu; bireysel oy veren verisi görünmedi.

Tüm yedi bölge hızlı filtresi, artık günlük tabloya dönmeden aynı tüm zamanlar şehir kartı düzenini kullanır. Masaüstü ve 375 × 812 mobil doğrulamasında ortak arama, yatay filtre menüsü, oy yüzdesi ilerleme göstergesi ve vali özetleri yerleşim açısından korunmuştur.

Şehir Sıralaması aktif vali kartında dış web sitesi yönlendirmesi korunurken sağdaki ok simgesi kaldırıldı. Kartın altındaki Valiliği Devral eylemi, anonim kullanıcıyı mevcut güvenli giriş akışına; oturumlu kullanıcıyı ilgili şehrin mevcut başvuru popupına taşır. Masaüstü ve 375 × 812 mobil kart yapısı taşmasız kaldı; etkileşim birim testleriyle doğrulandı.

## Bedavaya Vali Ol! Akışı

Valisi olmayan şehirlerin tüm zamanlar sıralama kartları artık `Şehir Valiliği / BOŞTA` etiketi, `Bu şehrin valisi henüz yok.` açıklaması ve **Bedavaya Vali Ol!** eylemini birlikte gösterir. Aynı eylem, haritada açılan boş Şehir Valisi alanında da kullanılır. Anonim kullanıcı eyleme bastığında mevcut güvenli giriş akışı korunur; oturumlu kullanıcıya ilgili şehir bilgisi önceden seçilmiş **Bedavaya Şehir Valisi Ol** popupı açılır. Başvuru formu mevcut onay süreci, dosya doğrulaması ve hassas public veri sınırlarını değiştirmez.

1280 × 720 masaüstü ve 375 × 812 mobil tam sayfa önizlemelerinde kartlar sayfa akışında taşmasız kaldı. Arayüz testleri, anonim giriş yönlendirmesi ile oturumlu kullanıcının Ankara için ücretsiz popupını ve gönderim çağrısını doğruladı. Son kalite çalıştırmasında 25 test dosyasında 89 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite'ın 500 kB üzeri chunk uyarısı engelleyici değildir.

## Ücretsiz Valilik Davet ve Trafik Akışı

Ücretsiz başvuru popupına, marka bilgileri tamamlandıktan sonra gösterilen üç adımlı davet akışı eklendi. Başvuru kaydı benzersiz, tahmin edilmesi zor bir davet kodu üretir; kullanıcı bu kodu içeren şehir bağlantısını kopyalayabilir. Bağlantıdan gelen yeni bir kullanıcı, ilgili şehri seçip ilk günlük oyunu verdiğinde yalnız toplam nitelikli destek sayısına eklenir. Sistem destekçi adı, e-posta, oturum anahtarı veya bireysel oy bilgisini hiçbir public alanda göstermez.

Sayaç için beş yeni destekçi ilk hedef olarak gösterilir; bu hedefin otomatik onay sağlamadığı popup içinde açıkça belirtilir. Kod sahibi kendisini sayaca ekleyemez; aynı kullanıcı aynı başvuru için yalnız bir kez sayılır ve desteklenen şehir davet bağlantısındaki şehirle eşleşmelidir. `0007_fantastic_drax.sql` migrasyonu davet kodu ile tekil dönüşüm kayıtlarını ekledi ve veritabanına uygulandı. Son kalite çalıştırmasında 25 test dosyasında 92 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Yerel Paylaşım ve Yönetici Davet Performansı

Ücretsiz valilik popupındaki davet bağlantısı hazır ekranında, Web Share API destekleyen mobil tarayıcılarda **Telefonda paylaş** eylemi görünür. Eylem şehir odaklı başlık, kısa açıklama ve benzersiz davet URL’sini cihazın yerel paylaşım menüsüne gönderir; desteklenmeyen tarayıcılarda mevcut bağlantı kopyalama eylemi kullanılmaya devam eder. Kullanıcının paylaşımı iptal etmesi hata bildirimi üretmez.

Yönetim özet ekranında eklenen **Davet performansları** alanı; aktif davet bağlantısı, nitelikli yeni destek toplamı ve başvuru bazında şehir, marka, karar durumu, toplam destek ile oluşturulma zamanını gösterir. E-posta, kullanıcı adı, oturum verisi ve bireysel destekçi/oy bilgisi bu alana dahil edilmez; sorgu yalnız yönetici rolüyle erişilebilir. Masaüstü ve 375 × 812 mobil görünüm doğrulandı. Son kalite çalıştırmasında 26 test dosyasında 95 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Davet İlerlemesi, Yönetim Sayfası ve Anonim Oy

Ücretsiz valilik davet ekranındaki ilk beş nitelikli destek hedefi artık erişilebilir bir ilerleme çubuğu ile gösterilir. Çubuk, başarılı davet sayısına göre dolar; kalan destek miktarını açıkça belirtir ve hedef tamamlandığında kutlama yerine devam eden paylaşım çağrısı verir. Hedef, valilik başvurusunu otomatik onaylamaz.

Davet performansı, yönetim ana özetinden çıkarılarak sol menüdeki **Davet performansları** bağlantısından açılan ayrı `/admin/davet-performanslari` sayfasına taşındı. Sayfa yalnız yöneticilere toplam bağlantı, nitelikli destek, şehir, marka ve başvuru durumu verisini gösterir; bireysel destekçi, e-posta ve ham oturum verisi gösterilmez.

Şehir oyları artık hesap gerektirmez. Ziyaretçi şehri seçerek anonim oy verir; ters vekilden alınan istemci adresi ham biçimde saklanmadan sunucu tarafında HMAC-SHA-256 parmak izine dönüştürülür. `participations` tablosundaki gün + parmak izi tekil indeksi, aynı IP adresinden Türkiye gününde yalnız bir oy kaydedilmesini sağlar. Şehir Valisi başvuruları ise `protectedProcedure` ile giriş zorunlu kalır. `0008_parched_the_enforcers.sql` migrasyonu veritabanına uygulandı. Masaüstü 1280 × 720 ve mobil 375 × 812 genel yerleşimleri taşmasız doğrulandı. Son kalite çalıştırmasında 27 test dosyasında 98 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## IP Oy Kuralı Bilgilendirmesi

Ana sayfadaki **Şehrine oy ver** çağrısının hemen altında, açık renkli bir bilgi alanı eklendi. Alan; hesabın gerekmediğini, aynı IP adresi için Türkiye gününde tek oyun kabul edildiğini ve ham IP adresinin saklanmadığını sade biçimde açıklar. **Detaylar** bağlantısı kullanıcıyı Hakkımızda sayfasındaki güncel kurallara götürür. 1280 × 720 ve 375 × 812 görünümünde metin, bağlantı ve kalkan simgesi taşmasız kaldı. Son kalite çalıştırmasında 27 test dosyasında 99 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Hakkımızda Sayfası Referans Uyarlaması

`memleket.lol/about` referansındaki sade açıklama yapısı, öne çıkan dört yetenek ve açık kural akışı; sehrim.lol’un mevcut koyu deniz yeşili, turuncu vurgu, ızgara dokusu ve tipografi sistemiyle yeniden yorumlandı. Yeni sayfa, **81 şehrin sesi, aynı yarışta** başlığıyla başlar; canlı harita, ücretsiz oy, Şehir Valisi alanı ve adil yarış ilkelerini ayrı kartlarda açıklar. Ardından hesap gerektirmeyen oy, günlük IP sınırı ve giriş gerektiren Valilik başvuruları için kısa açık kural listesi sunar.

Referans sayfaya tarayıcı erişimi zaman aşımına uğradı; metinsel içerik alternatif çıkarım üzerinden incelendi. Referansın uygulanmamış Cloudflare Turnstile iddiası kopyalanmadı; yalnız mevcut uygulama davranışları anlatıldı. Masaüstü 1280 × 720 ve 375 × 812 mobil görünümde içerik hiyerarşisi, kartlar ve yönlendirmeler doğrulandı. Son kalite çalıştırmasında 27 test dosyasında 101 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Tekrar Oy Bilgi Mesajı ve Teknik Hata Gizliliği

Aynı IP parmak iziyle Türkiye gününde tekrar oy verildiğinde, sistem artık `participations` benzersiz kayıt hatısına düşmeden mevcut oyu önceden denetler. Yarış arayüzü ikinci oyu **Bugünkü oy hakkın bu internet bağlantısı için zaten kullanıldı. Yeni tur gece Türkiye saatine göre başlar.** bilgisiyle kapatır. Bu akışta başarı bildirimi gösterilmez.

Veritabanı sürücüsünün hata kodunu kaybettiği veya hata ayrıntısını `cause` altında taşıdığı durumlar için benzersiz kayıt tanıma genişletildi. Oyun routerı yalnız önceden onaylanmış kullanıcı mesajlarını iletir; SQL, sorgu parametreleri ve IP parmak izi içeren tüm diğer hata metinleri genel güvenli mesajla değiştirilir. Son kalite çalıştırmasında 27 test dosyasında 103 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Ortak Wi‑Fi ve Yeni Tur Geri Sayımı

Hakkımızda sayfasındaki açık kurallar listesine **Ortak Wi‑Fi notu** eklendi. Metin; okul, iş yeri ve misafir ağlarında aynı IP bağlantısının paylaşılabileceğini, ağdan daha önce oy kullanılmışsa yeni turun gece yarısında beklenmesi gerektiğini açıklar. Bireysel kullanıcı verisi veya ağ ayrıntısı gösterilmez.

İkinci oyda gösterilen bilgi mesajı artık sabit bir gece yarısı ifadesi yerine Türkiye saatine göre kalan süreyi `SS:DD:SS` biçiminde hesaplar: **Yeni tura 07:01:59 kaldı.** Süre mesaj her gösterildiğinde güncel olarak hesaplanır. Hakkımızda sayfasının 375 × 812 mobil görünümünde yeni kural kartı taşmasız doğrulandı. Son kalite çalıştırmasında 27 test dosyasında 103 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Şehir Ayrıntısından Doğrudan Oy

Haritada bir şehre tıklanınca açılan şehir ayrıntısı penceresindeki **[Şehir] için oy ver** eylemi artık ikinci bir şehir seçme penceresi göstermeden mevcut şehre doğrudan anonim oy isteğini gönderir. Oy başarılı olduğunda ayrıntı penceresi kapanır ve başarı bildirimi görünür; günlük hak zaten kullanılmışsa güvenli mevcut bilgi mesajı gösterilir. Hero alanındaki genel **Şehrine oy ver** eylemi, şehir seçimi gereken durumlar için aynı şekilde korunur.

Doğrudan oy akışı, seçili Ankara için gönderilen mutasyon, ayrıntı penceresinin kapanması ve şehir seçim penceresinin açılmaması üzerinden Vitest ile doğrulandı. Ana sayfa 1280 × 720 masaüstü ve 375 × 812 mobil görünümlerinde taşmasız kaldı. Son kalite çalıştırmasında 27 test dosyasında 103 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Başarılı Oy Sonucu Paylaşımı

Başarılı anonim oy bildiriminde artık **Paylaş** eylemi yer alır. Destekleyen tarayıcılarda eylem, şehir adı, kısa katılım metni ve seçili şehrin bağlantısıyla cihazın yerel paylaşım menüsünü açar. Yerel paylaşım bulunmadığında aynı metin ve bağlantı kopyalanır; desteklenmeyen veya başarısız durumlarda kullanıcıya açık hata bildirimi verilir. Paylaşım URL’si yalnız şehir kodunu içerir; IP, parmak izi veya bireysel oy verisi içermez.

Yerel paylaşım çağrısı, bağlantı kopyalama yedeği ve başarılı oy bildirimindeki eylem Vitest ile doğrulandı. Son kalite çalıştırmasında 27 test dosyasında 105 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Yenileme Sonrası Günlük Oy Kilidi

Anonim ziyaretçi sayfayı yenilediğinde, istemci artık günlük oy hakkını varsayılan olarak açık kabul etmez. Yeni public durum sorgusu, yalnız sunucuda üretilen HMAC IP parmak izini kullanarak o Türkiye gününde bir katılım olup olmadığını kontrol eder ve yalnız `recordDate` ile `hasParticipated` bilgisini döndürür. Parmak izinin kendisi, ham IP adresi veya bireysel oy kaydı istemciye dönmez.

Durum `hasParticipated: true` ise hero, alt banner ve şehir ayrıntısı penceresindeki oy eylemleri devre dışı kalır; böylece yenileme sonrası ikinci oy arayüzden başlatılamaz. Başarılı oy veya tekrar oy cevabının ardından durum sorgusu önbelleği geçersizleştirilir. Router ve ana sayfa regresyon testleri yenileme sonrası kilidi doğrular. Son kalite çalıştırmasında 27 test dosyasında 107 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Günün Podyumunun Kaldırılması

Ana sayfadaki **GÜNÜN PODYUMU** bölümü ve ilk üç şehir kartları kaldırıldı. Hero alanından sonra sayfa doğrudan canlı harita ve Şehrin Valileri alanına ilerler; günlük sıralama ve Şeref Tablosu bölümleri korunur. Masaüstü 1280 × 720 ve mobil 375 × 812 önizlemelerinde yeni akışın boşlukları dengeli, okunur ve taşmasız doğrulandı. Ana sayfa testi, podyum başlığının ve bileşeninin render edilmediğini doğrular. Son kalite çalıştırmasında 27 test dosyasında 108 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.

## Yenileme Sonrası Yerel Oy Kilidi

Başarılı ya da tekrar edilen anonim oy sonucunda Türkiye gününün tarihi tarayıcı yerel depolamasına kaydedilir. Sayfa yenilendiğinde bu tarih hâlâ geçerli Türkiye günüyle eşleşiyorsa, sunucu durum sorgusu tamamlanmadan bile oy eylemleri kilitli kalır. Sunucunun HMAC parmak izi tabanlı günlük durum sorgusu ikinci savunma katmanı olarak korunur; sorgu yükleniyor, sonuçsuz veya hatalı olduğunda arayüz oy düğmelerini etkinleştirmez. Yeni gün geldiğinde eski yerel tarih eşleşmediğinden yeni tur normal biçimde açılır.

Yerel kilit, sunucu sorgusu gecikmesi ve ikinci oy engeli Vitest ile doğrulandı. Son kalite çalıştırmasında 27 test dosyasında 110 test, `pnpm check` ve `pnpm build` başarılı tamamlandı; Vite’ın büyük chunk uyarısı engelleyici değildir.
