/**
 * ============================================================
 *  lib/islami.js — DATA & API FITUR ISLAMI
 * ------------------------------------------------------------
 *  Sumber online:
 *   • api.aladhan.com      jadwal sholat (method 20 = Kemenag RI),
 *                           arah kiblat, konversi Hijriah ↔ Masehi
 *   • api.quran.gading.dev  surah, ayat, terjemahan & tafsir Indonesia
 *  Sumber lokal (data/*.json):
 *   asmaulhusna (99 + arti ID), doa (443), doaharian (27),
 *   haditsarbain (42), surah (114)
 *  Data tertanam di file ini: 25 Nabi, niat ibadah, tata cara,
 *  dzikir, nama bulan Hijriah, logika puasa sunnah.
 * ============================================================
 */
import { getJSON } from './functions.js'
import {
  surahs, asmaulHusna, duas, duaCategories, doaHarian, haditsArbain, search
} from './datasets.js'

const ALADHAN = 'https://api.aladhan.com/v1'
const QURAN = 'https://api.quran.gading.dev'

/* ------------------------------------------------------------------ */
/*  NAMA BULAN & HARI                                                  */
/* ------------------------------------------------------------------ */
export const BULAN_HIJRI = [
  'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
  'Rajab', 'Syakban', 'Ramadan', 'Syawal', 'Zulkaidah', 'Zulhijah'
]
export const HARI_ID = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const BULAN_MASEHI = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/* ------------------------------------------------------------------ */
/*  API: JADWAL SHOLAT / KIBLAT / HIJRIAH                              */
/* ------------------------------------------------------------------ */

/** jadwal sholat sebuah kota (default Jakarta, method Kemenag RI) */
export async function prayerTimes (city = 'Jakarta', country = 'Indonesia') {
  const j = await getJSON(
    `${ALADHAN}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=20`
  )
  const d = j?.data
  if (!d?.timings) throw new Error('Kota tidak ditemukan / API jadwal sholat tidak merespons')
  const clean = t => String(t || '').split(' ')[0]
  return {
    kota: String(city).replace(/\b\w/g, c => c.toUpperCase()),
    zona: d.meta?.timezone || '',
    query: city,
    masehi: d.date?.readable || '',
    hijri: hijriText(d.date?.hijri),
    hijriRaw: d.date?.hijri || null,
    lat: d.meta?.latitude,
    lng: d.meta?.longitude,
    metode: d.meta?.method?.name || 'Kemenag RI',
    times: {
      Imsak: clean(d.timings.Imsak),
      Subuh: clean(d.timings.Fajr),
      Syuruq: clean(d.timings.Sunrise),
      Dzuhur: clean(d.timings.Dhuhr),
      Ashar: clean(d.timings.Asr),
      Maghrib: clean(d.timings.Maghrib),
      Isya: clean(d.timings.Isha),
      TengahMalam: clean(d.timings.Midnight)
    }
  }
}

/** arah kiblat dari koordinat */
export async function qiblaFromCoords (lat, lng) {
  const j = await getJSON(`${ALADHAN}/qibla/${lat}/${lng}`)
  if (!j?.data?.direction) throw new Error('Gagal mengambil arah kiblat')
  return Number(j.data.direction)
}

/** arah kiblat sebuah kota (pakai koordinat dari jadwal sholat) */
export async function qiblaCity (city = 'Jakarta') {
  const p = await prayerTimes(city)
  const dir = await qiblaFromCoords(p.lat, p.lng)
  return { kota: city, lat: p.lat, lng: p.lng, direction: dir }
}

/** teks hijriah dari object aladhan */
export function hijriText (h) {
  if (!h) return ''
  const bulan = BULAN_HIJRI[(Number(h.month?.number) || 1) - 1] || h.month?.en || ''
  return `${h.day} ${bulan} ${h.year} H`
}

/** tanggal hari ini dalam Hijriah */
export async function hijriToday () {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const j = await getJSON(`${ALADHAN}/gToH/${dd}-${mm}-${yyyy}`)
  const h = j?.data?.hijri
  return {
    teks: hijriText(h),
    raw: h,
    masehi: `${dd}-${mm}-${yyyy}`,
    hari: HARI_ID[now.getDay()],
    bulanAngka: Number(h?.month?.number) || 0,
    tanggal: Number(h?.day) || 0,
    tahun: Number(h?.year) || 0
  }
}

/** konversi Masehi -> Hijriah (dd-mm-yyyy) */
export async function masehiKeHijri (tgl) {
  const j = await getJSON(`${ALADHAN}/gToH/${tgl}`)
  if (!j?.data?.hijri) throw new Error('Format tanggal salah (contoh: 03-09-2026)')
  return { hijri: hijriText(j.data.hijri), masehi: tgl, raw: j.data.hijri }
}

/** konversi Hijriah -> Masehi (dd-mm-yyyy, mis. 01-09-1448) */
export async function hijriKeMasehi (tgl) {
  const j = await getJSON(`${ALADHAN}/hToG/${tgl}`)
  if (!j?.data?.gregorian) throw new Error('Format tanggal hijriah salah (contoh: 01-09-1448)')
  const g = j.data.gregorian
  const [dd, mm, yyyy] = String(g.date).split('-').map(Number)
  const HARI_EN = { Sunday: 'Ahad', Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu' }
  const hariId = HARI_EN[g.weekday?.en] || g.weekday?.en || ''
  return {
    masehi: g.date,
    masehiPanjang: `${dd} ${BULAN_MASEHI[(mm || 1) - 1]} ${yyyy}`,
    hijri: tgl,
    hijriPanjang: hijriText(j.data.hijri),
    hari: hariId,
    hariEn: g.weekday?.en || ''
  }
}

/* ------------------------------------------------------------------ */
/*  API: AL-QURAN                                                      */
/* ------------------------------------------------------------------ */

/** detail satu surah (ayat + terjemahan + tafsir) */
export async function surahDetail (no) {
  const j = await getJSON(`${QURAN}/surah/${no}`)
  if (!j?.data) throw new Error(`Surah ${no} tidak ditemukan`)
  const d = j.data
  return {
    no: d.number?.sequence || no,
    nama: d.name?.transliteration?.id || '',
    arab: d.name?.short || '',
    arti: d.name?.translation?.id || '',
    ayat: d.numberOfVerses || 0,
    tipe: d.revelation?.id || '',
    tafsir: d.tafsir?.id || '',
    verses: (d.verses || []).map(v => ({
      no: v.number?.inSurah,
      ar: v.text?.arab || '',
      id: v.translation?.id || '',
      latin: v.text?.transliteration?.en || ''
    }))
  }
}

/** satu ayat + tafsir */
export async function ayahDetail (surah, ayat) {
  const j = await getJSON(`${QURAN}/surah/${surah}/${ayat}`)
  const d = j?.data
  if (!d) throw new Error(`Ayat ${surah}:${ayat} tidak ditemukan`)
  return {
    surah: d.surah?.number?.sequence || surah,
    namaSurah: d.surah?.name?.transliteration?.id || '',
    no: d.number?.inSurah || ayat,
    ar: d.text?.arab || '',
    latin: d.text?.transliteration?.en || '',
    id: d.translation?.id || '',
    tafsir: d.tafsir?.id?.short || d.tafsir?.id || ''
  }
}

/* ------------------------------------------------------------------ */
/*  25 NABI & RASUL                                                    */
/* ------------------------------------------------------------------ */
export const NABI = [
  { nama: 'Adam', gelar: 'Abul Basyar (Bapak Manusia)', kaum: '-', kisah: 'Nabi pertama, diciptakan dari tanah, diturunkan ke bumi setelah memakan buah khuldi.', ululAzmi: false },
  { nama: 'Idris', gelar: 'Nabi yang rajin belajar', kaum: 'Babilonia', kisah: 'Nabi pertama yang menulis dengan pena, pandai ilmu falak dan menjahit.', ululAzmi: false },
  { nama: 'Nuh', gelar: 'Ulul Azmi', kaum: 'Babilonia', kisah: 'Berdakwah ±950 tahun, membuat bahtera besar untuk menyelamatkan umat dari banjir besar.', ululAzmi: true },
  { nama: 'Hud', gelar: 'Nabi kaum Ad', kaum: 'Ad (Ahqaf)', kisah: 'Diutus kepada kaum Ad yang sombong; mereka dibinasakan angin kencang tujuh malam.', ululAzmi: false },
  { nama: 'Shaleh', gelar: 'Nabi kaum Tsamud', kaum: 'Tsamud (Hijr)', kisah: 'Mukjizat unta betina dari batu; kaum Tsamud dibinasakan petir dan gempa.', ululAzmi: false },
  { nama: 'Ibrahim', gelar: 'Khalilullah (Kekasih Allah), Ulul Azmi', kaum: 'Babilonia', kisah: 'Dicoba dibakar Namrud namun api menjadi dingin; membangun Kakbah bersama Ismail.', ululAzmi: true },
  { nama: 'Luth', gelar: 'Nabi kaum Sodom', kaum: 'Sodom', kisah: 'Dakwah kepada kaum yang menyimpang; kota dibalik dan dihujani batu.', ululAzmi: false },
  { nama: 'Ismail', gelar: 'Dzabihullah (yang disembelih)', kaum: 'Makkah', kisah: 'Rela dikurbankan atas perintah Allah, diganti dengan domba; membantu membangun Kakbah.', ululAzmi: false },
  { nama: 'Ishaq', gelar: 'Nabi Bani Israil', kaum: 'Kanaan', kisah: 'Putra Ibrahim dari Sarah, ayah Nabi Yaqub, meneruskan dakwah di Palestina.', ululAzmi: false },
  { nama: 'Yaqub', gelar: 'Isra\u2019il', kaum: 'Kanaan/Mesir', kisah: 'Ayah 12 putra (cikal bakal 12 suku Bani Israil), diuji kehilangan Yusuf.', ululAzmi: false },
  { nama: 'Yusuf', gelar: 'Nabi yang paling tampan', kaum: 'Mesir', kisah: 'Dibuang saudaranya ke sumur, dipenjara karena fitnah, akhirnya jadi bendahara Mesir dan menafsirkan mimpi raja.', ululAzmi: false },
  { nama: 'Ayub', gelar: 'Simbol kesabaran', kaum: 'Hauran', kisah: 'Diuji penyakit, kehilangan harta dan anak, tetap sabar hingga disembuhkan Allah.', ululAzmi: false },
  { nama: 'Syuaib', gelar: 'Khatibul Anbiya', kaum: 'Madyan', kisah: 'Dakwah menentang kecurangan timbangan; kaum Madyan dibinasakan gempa dan awan panas.', ululAzmi: false },
  { nama: 'Musa', gelar: 'Kalimullah, Ulul Azmi', kaum: 'Mesir/Bani Israil', kisah: 'Tongkat jadi ular, membelah Laut Merah, menerima Taurat di Bukit Tursina, menghadapi Fir\u2019aun.', ululAzmi: true },
  { nama: 'Harun', gelar: 'Pendamping Musa', kaum: 'Mesir/Bani Israil', kisah: 'Fasih berbicara, diangkat Allah membantu dakwah Musa kepada Bani Israil.', ululAzmi: false },
  { nama: 'Zulkifli', gelar: 'Nabi yang teguh janji', kaum: 'Damaskus', kisah: 'Dikenal sangat sabar dan selalu menepati janji; memimpin kaumnya setelah wafatnya nabi sebelumnya.', ululAzmi: false },
  { nama: 'Daud', gelar: 'Penerima Zabur', kaum: 'Bani Israil', kisah: 'Melunakkan besi dengan tangan, suara merdu, mengalahkan Jalut, menjadi raja dan nabi.', ululAzmi: false },
  { nama: 'Sulaiman', gelar: 'Raja para nabi', kaum: 'Bani Israil', kisah: 'Menundukkan angin, jin, dan memahami bahasa binatang; membangun kerajaan besar dan Baitul Maqdis.', ululAzmi: false },
  { nama: 'Ilyas', gelar: 'Nabi Bani Israil', kaum: 'Ba\u2019labak', kisah: 'Dakwah menentang penyembahan berhala Ba\u2019al pada masa kekeringan panjang.', ululAzmi: false },
  { nama: 'Ilyasa', gelar: 'Penerus Ilyas', kaum: 'Bani Israil', kisah: 'Melanjutkan dakwah Ilyas kepada Bani Israil yang berpaling.', ululAzmi: false },
  { nama: 'Yunus', gelar: 'Dzun Nun (pemilik ikan)', kaum: 'Ninawa', kisah: 'Ditelan ikan besar setelah meninggalkan kaumnya, bertasbih dalam kegelapan lalu diselamatkan.', ululAzmi: false },
  { nama: 'Zakaria', gelar: 'Nabi Bani Israil', kaum: 'Palestina', kisah: 'Doa minta keturunan di usia senja, dikaruniai Yahya; pengasuh Maryam.', ululAzmi: false },
  { nama: 'Yahya', gelar: 'Nabi yang syahid', kaum: 'Palestina', kisah: 'Hidup zuhud dan tegas membela kebenaran hingga mati syahid dibunuh penguasa.', ululAzmi: false },
  { nama: 'Isa', gelar: 'Ruhullah, Ulul Azmi', kaum: 'Bani Israil', kisah: 'Lahir tanpa ayah dari Maryam, menyembuhkan orang buta & kusta, menghidupkan burung tanah liat, menerima Injil.', ululAzmi: true },
  { nama: 'Muhammad', gelar: 'Khatamul Anbiya, Ulul Azmi', kaum: 'Quraisy Makkah', kisah: 'Nabi penutup, menerima Al-Qur\u2019an, Isra\u2019 Mi\u2019raj, membangun umat Islam di Madinah.', ululAzmi: true }
]

/* ------------------------------------------------------------------ */
/*  NIAT IBADAH (arab + latin + arti)                                  */
/* ------------------------------------------------------------------ */
export const NIAT = {
  wudhu: {
    judul: 'Niat Wudhu',
    arab: 'نَوَيْتُ الْوُضُوءَ لِرَفْعِ الْحَدَثِ الأَصْغَرِ فَرْضًا لِلَّهِ تَعَالَى',
    latin: 'Nawaitul wudhuu-a liraf\u2019il hadatsil ashghari fardhal lillaahi ta\u2019aalaa',
    arti: 'Aku berniat wudhu untuk menghilangkan hadats kecil, fardhu karena Allah Ta\u2019ala.'
  },
  tayamum: {
    judul: 'Niat Tayamum',
    arab: 'نَوَيْتُ التَّيَمُّمَ لاِسْتِبَاحَةِ الصَّلاَةِ فَرْضًا لِلَّهِ تَعَالَى',
    latin: 'Nawaitut tayammuma listibaahatish shalaati fardhal lillaahi ta\u2019aalaa',
    arti: 'Aku berniat tayamum agar diperbolehkan sholat, fardhu karena Allah Ta\u2019ala.'
  },
  mandi: {
    judul: 'Niat Mandi Wajib (Junub)',
    arab: 'نَوَيْتُ الْغُسْلَ لِرَفْعِ الْحَدَثِ الأَكْبَرِ فَرْضًا لِلَّهِ تَعَالَى',
    latin: 'Nawaitul ghusla liraf\u2019il hadatsil akbari fardhal lillaahi ta\u2019aalaa',
    arti: 'Aku berniat mandi untuk menghilangkan hadats besar, fardhu karena Allah Ta\u2019ala.'
  },
  subuh: {
    judul: 'Niat Sholat Subuh',
    arab: 'أُصَلِّى فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhash shubhi rak\u2019ataini mustaqbilal qiblati adaa-an lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Subuh dua rakaat menghadap kiblat, tunai karena Allah Ta\u2019ala.'
  },
  dzuhur: {
    judul: 'Niat Sholat Dzuhur',
    arab: 'أُصَلِّى فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhazh zhuhri arba\u2019a raka\u2019aatin mustaqbilal qiblati adaa-an lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Dzuhur empat rakaat menghadap kiblat, tunai karena Allah Ta\u2019ala.'
  },
  ashar: {
    judul: 'Niat Sholat Ashar',
    arab: 'أُصَلِّى فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhal \u2018ashri arba\u2019a raka\u2019aatin mustaqbilal qiblati adaa-an lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Ashar empat rakaat menghadap kiblat, tunai karena Allah Ta\u2019ala.'
  },
  maghrib: {
    judul: 'Niat Sholat Maghrib',
    arab: 'أُصَلِّى فَرْضَ الْمَغْرِبِ ثَلاَثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhal maghribi tsalaatsa raka\u2019aatin mustaqbilal qiblati adaa-an lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Maghrib tiga rakaat menghadap kiblat, tunai karena Allah Ta\u2019ala.'
  },
  isya: {
    judul: 'Niat Sholat Isya',
    arab: 'أُصَلِّى فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhal \u2018isyaa-i arba\u2019a raka\u2019aatin mustaqbilal qiblati adaa-an lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Isya empat rakaat menghadap kiblat, tunai karena Allah Ta\u2019ala.'
  },
  jumat: {
    judul: 'Niat Sholat Jumat (makmum)',
    arab: 'أُصَلِّى فَرْضَ الْجُمْعَةِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ مَأْمُومًا لِلَّهِ تَعَالَى',
    latin: 'Ushallii fardhal jum\u2019ati rak\u2019ataini mustaqbilal qiblati ma-muuman lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat fardhu Jumat dua rakaat menghadap kiblat sebagai makmum karena Allah Ta\u2019ala.'
  },
  dhuha: {
    judul: 'Niat Sholat Dhuha',
    arab: 'أُصَلِّى سُنَّةَ الضُّحَى رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushallii sunnatadh dhuhaa rak\u2019ataini mustaqbilal qiblati lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat sunnah Dhuha dua rakaat menghadap kiblat karena Allah Ta\u2019ala.'
  },
  tahajud: {
    judul: 'Niat Sholat Tahajud',
    arab: 'أُصَلِّى سُنَّةَ التَّهَجُّدِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushallii sunnatat tahajjudi rak\u2019ataini mustaqbilal qiblati lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat sunnah Tahajud dua rakaat menghadap kiblat karena Allah Ta\u2019ala.'
  },
  witir: {
    judul: 'Niat Sholat Witir',
    arab: 'أُصَلِّى سُنَّةَ الْوِتْرِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushallii sunnatal witri rak\u2019ataini mustaqbilal qiblati lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat sunnah Witir dua rakaat menghadap kiblat karena Allah Ta\u2019ala.'
  },
  tarawih: {
    judul: 'Niat Sholat Tarawih (makmum)',
    arab: 'أُصَلِّى سُنَّةَ التَّرَاوِيحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ مَأْمُومًا لِلَّهِ تَعَالَى',
    latin: 'Ushallii sunnatat taraawiihi rak\u2019ataini mustaqbilal qiblati ma-muuman lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat sunnah Tarawih dua rakaat menghadap kiblat sebagai makmum karena Allah Ta\u2019ala.'
  },
  puasa: {
    judul: 'Niat Puasa Ramadan',
    arab: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma ghadin \u2018an adaa-i fardhi syahri ramadhaana haadzihis sanati lillaahi ta\u2019aalaa',
    arti: 'Aku berniat puasa esok hari untuk menunaikan fardhu bulan Ramadan tahun ini karena Allah Ta\u2019ala.'
  },
  senin: {
    judul: 'Niat Puasa Senin',
    arab: 'نَوَيْتُ صَوْمَ يَوْمِ الاِثْنَيْنِ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma yaumil itsnaini sunnatan lillaahi ta\u2019aalaa',
    arti: 'Aku berniat puasa hari Senin, sunnah karena Allah Ta\u2019ala.'
  },
  kamis: {
    judul: 'Niat Puasa Kamis',
    arab: 'نَوَيْتُ صَوْمَ يَوْمِ الْخَمِيْسِ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma yaumil khamiisi sunnatan lillaahi ta\u2019aalaa',
    arti: 'Aku berniat puasa hari Kamis, sunnah karena Allah Ta\u2019ala.'
  },
  qadha: {
    judul: 'Niat Puasa Qadha Ramadan',
    arab: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ قَضَاءِ فَرْضِ رَمَضَانَ لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma ghadin \u2018an qadhaa-i fardhi ramadhaana lillaahi ta\u2019aalaa',
    arti: 'Aku berniat puasa esok hari untuk mengqadha fardhu Ramadan karena Allah Ta\u2019ala.'
  },
  buka: {
    judul: 'Doa Berbuka Puasa',
    arab: 'اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    latin: 'Allaahumma laka shumtu wa bika aamantu wa \u2018alaa rizqika afthartu',
    arti: 'Ya Allah, karena-Mu aku berpuasa, kepada-Mu aku beriman, dan dengan rezeki-Mu aku berbuka.'
  },
  zakatfitrah: {
    judul: 'Niat Zakat Fitrah (untuk diri sendiri)',
    arab: 'نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ نَفْسِى فَرْضًا لِلَّهِ تَعَالَى',
    latin: 'Nawaitu an ukhrija zakaatal fithri \u2018an nafsii fardhal lillaahi ta\u2019aalaa',
    arti: 'Aku niat mengeluarkan zakat fitrah untuk diriku sendiri, fardhu karena Allah Ta\u2019ala.'
  },
  zakatmal: {
    judul: 'Niat Zakat Mal',
    arab: 'نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ مَالِى فَرْضًا لِلَّهِ تَعَالَى',
    latin: 'Nawaitu an ukhrija zakaata maalii fardhal lillaahi ta\u2019aalaa',
    arti: 'Aku niat mengeluarkan zakat hartaku, fardhu karena Allah Ta\u2019ala.'
  },
  qurban: {
    judul: 'Niat Berkurban',
    arab: 'نَوَيْتُ التَّقَرُّبَ إِلَى اللَّهِ بِذَبْحِ هَذِهِ الأُضْحِيَّةِ لِلَّهِ تَعَالَى',
    latin: 'Nawaitut taqarruba ilallaahi bidzabhi haadzihil udh-hiyati lillaahi ta\u2019aalaa',
    arti: 'Aku niat mendekatkan diri kepada Allah dengan menyembelih hewan kurban ini karena Allah Ta\u2019ala.'
  },
  istikharah: {
    judul: 'Niat Sholat Istikharah',
    arab: 'أُصَلِّى سُنَّةَ الاِسْتِخَارَةِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ لِلَّهِ تَعَالَى',
    latin: 'Ushallii sunnatal istikhaarati rak\u2019ataini mustaqbilal qiblati lillaahi ta\u2019aalaa',
    arti: 'Aku berniat sholat sunnah Istikharah dua rakaat menghadap kiblat karena Allah Ta\u2019ala.'
  }
}

/* ------------------------------------------------------------------ */
/*  TATA CARA IBADAH                                                   */
/* ------------------------------------------------------------------ */
export const TATACARA = {
  wudhu: {
    judul: 'Tata Cara Wudhu',
    langkah: [
      'Niat wudhu di dalam hati (sunnah dilafalkan).',
      'Membaca basmalah lalu mencuci kedua telapak tangan 3 kali.',
      'Berkumur-kumur dan menghirup air ke hidung 3 kali.',
      'Membasuh seluruh wajah 3 kali (batas: tempat tumbuh rambut sampai dagu, telinga ke telinga).',
      'Membasuh kedua tangan sampai siku, dimulai kanan lalu kiri, 3 kali.',
      'Mengusap sebagian kepala/rambut dan kedua telinga 1 kali.',
      'Membasuh kedua kaki sampai mata kaki, kanan lalu kiri, 3 kali.',
      'Tertib (berurutan) lalu membaca doa sesudah wudhu.'
    ]
  },
  tayamum: {
    judul: 'Tata Cara Tayamum',
    syarat: 'Tidak ada air / air membahayakan / sakit / air hanya cukup untuk minum.',
    langkah: [
      'Siapkan debu yang suci (bisa dinding, kaca, atau tanah bersih).',
      'Niat tayamum di dalam hati.',
      'Tepukkan kedua telapak tangan ke debu sekali, lalu tiup tipis.',
      'Usapkan ke seluruh wajah satu kali.',
      'Tepukkan tangan ke bagian debu yang lain, lalu usap kedua tangan sampai pergelangan/siku.',
      'Tertib; satu kali tayamum hanya untuk satu sholat fardhu.'
    ]
  },
  mandi: {
    judul: 'Tata Cara Mandi Wajib',
    penyebab: 'Junub, haid/nifas berakhir, masuk Islam, meninggal.',
    langkah: [
      'Niat mandi wajib di dalam hati.',
      'Mencuci kedua telapak tangan 3 kali.',
      'Membersihkan kemaluan dan kotoran dengan tangan kiri.',
      'Berwudhu seperti wudhu untuk sholat.',
      'Menyiram kepala 3 kali sampai ke pangkal rambut.',
      'Menyiram seluruh tubuh, dimulai sisi kanan lalu kiri.',
      'Memastikan air merata ke seluruh kulit & rambut, termasuk lipatan tubuh.'
    ]
  },
  sholat: {
    judul: 'Tata Cara Sholat (ringkas)',
    langkah: [
      'Berdiri menghadap kiblat, suci badan/pakaian/tempat, menutup aurat, masuk waktu.',
      'Takbiratul ihram sambil niat di dalam hati.',
      'Membaca doa iftitah, lalu Al-Fatihah dan surah pendek.',
      'Rukuk dengan tuma\u2019ninah, lalu i\u2019tidal.',
      'Sujud dua kali, duduk di antara dua sujud.',
      'Bangkit ke rakaat berikutnya; tasyahud awal pada rakaat kedua (sholat 3/4 rakaat).',
      'Tasyahud akhir + sholawat, lalu salam ke kanan dan ke kiri.'
    ]
  },
  puasa: {
    judul: 'Tata Cara & Syarat Puasa',
    langkah: [
      'Niat puasa (untuk Ramadan dilakukan malam hari sebelum terbit fajar).',
      'Menahan makan, minum, dan hal yang membatalkan sejak terbit fajar sampai maghrib.',
      'Menjaga lisan, penglihatan, dan perbuatan dari maksiat.',
      'Menyegerakan berbuka ketika maghrib tiba dan mengakhirkan sahur.',
      'Yang membatalkan: makan/minum sengaja, muntah disengaja, haid/nifas, murtad, berjimak.'
    ]
  },
  zakatfitrah: {
    judul: 'Zakat Fitrah',
    langkah: [
      'Wajib bagi setiap muslim (termasuk bayi) yang menjumpai akhir Ramadan.',
      'Besaran: 1 sha\u2019 = ±2,5 kg atau 3,5 liter makanan pokok (beras).',
      'Waktu utama: setelah sholat Subuh 1 Syawal sebelum sholat Idul Fitri.',
      'Boleh dibayar sejak awal Ramadan; jika setelah sholat Id hukumnya sedekah biasa.',
      'Diberikan kepada 8 golongan penerima zakat (asnaf).'
    ]
  }
}

/* ------------------------------------------------------------------ */
/*  DZIKIR                                                             */
/* ------------------------------------------------------------------ */
export const DZIKIR = {
  shalat: [
    { bacaan: 'Istighfar', arab: 'أَسْتَغْفِرُ اللَّهَ', latin: 'Astaghfirullaah', arti: 'Aku memohon ampun kepada Allah', jumlah: 3 },
    { bacaan: 'Tasbih', arab: 'سُبْحَانَ اللَّهِ', latin: 'Subhaanallaah', arti: 'Maha Suci Allah', jumlah: 33 },
    { bacaan: 'Tahmid', arab: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillaah', arti: 'Segala puji bagi Allah', jumlah: 33 },
    { bacaan: 'Takbir', arab: 'اللَّهُ أَكْبَرُ', latin: 'Allaahu akbar', arti: 'Allah Maha Besar', jumlah: 33 },
    { bacaan: 'Tahlil', arab: 'لاَ إِلَهَ إِلاَّ اللَّهُ', latin: 'Laa ilaaha illallaah', arti: 'Tidak ada tuhan selain Allah', jumlah: 1 },
    { bacaan: 'Ayat Kursi', arab: '', latin: '', arti: 'Dibaca sekali setelah sholat fardhu', jumlah: 1 }
  ],
  pagi: [
    'Membaca Ayat Kursi (1x) — perlindungan sepanjang hari.',
    'Al-Ikhlas, Al-Falaq, An-Nas (masing-masing 3x).',
    'Sayyidul Istighfar (1x).',
    'Subhanallah wa bihamdih (100x).',
    'Laa ilaaha illallaah wahdahu laa syariika lah (10x).',
    'Doa memohon ilmu bermanfaat, rezeki halal, dan amal yang diterima.'
  ],
  petang: [
    'Membaca Ayat Kursi (1x) — perlindungan sepanjang malam.',
    'Al-Ikhlas, Al-Falaq, An-Nas (masing-masing 3x).',
    'Sayyidul Istighfar (1x).',
    'Allaahumma bika amsainaa wa bika ashbahnaa (1x).',
    'Subhanallah wa bihamdih (100x).',
    'Doa berlindung dari keburukan malam dan gangguan makhluk.'
  ]
}

/* ------------------------------------------------------------------ */
/*  PUASA SUNNAH & MOMEN PENTING                                       */
/* ------------------------------------------------------------------ */
/** puasa sunnah yang dianjurkan berdasar tanggal hijriah & hari */
export function puasaSunnahInfo (hijriTanggal, hijriBulan, hari) {
  const out = []
  if (hari === 'Senin') out.push('✅ **Hari ini Senin** — dianjurkan puasa sunnah Senin.')
  if (hari === 'Kamis') out.push('✅ **Hari ini Kamis** — dianjurkan puasa sunnah Kamis.')
  if ([13, 14, 15].includes(hijriTanggal)) out.push(`✅ **Ayyamul Bidh** (tanggal ${hijriTanggal} Hijriah) — sangat dianjurkan puasa.`)
  if (hijriTanggal === 10 && hijriBulan === 1) out.push('✅ **10 Muharram (Asyura)** — puasa Asyura, dianjurkan juga 9 Muharram (Tasua).')
  if (hijriBulan === 9) out.push('✅ **Bulan Ramadan** — wajib puasa sebulan penuh.')
  if (hijriTanggal === 9 && hijriBulan === 12) out.push('✅ **9 Zulhijah (Arafah)** — puasa Arafah (bagi yang tidak berhaji).')
  if (hijriBulan === 12 && hijriTanggal <= 13) out.push('ℹ️ **Hari Tasyrik** (11-13 Zulhijah) — dilarang puasa.')
  if (!out.length) out.push('Tidak ada puasa sunnah khusus hari ini. Anjuran rutin: Senin, Kamis, dan Ayyamul Bidh (13-15 Hijriah).')
  return out
}

/* ------------------------------------------------------------------ */
/*  KALKULATOR IBADAH                                                  */
/* ------------------------------------------------------------------ */
const NISAB_GRAM_EMAS = 85
const KADAR_ZAKAT = 0.025

/** zakat mal: harta (Rp) & harga emas per gram (Rp) */
export function hitungZakatMal (harta, hargaEmasPerGram) {
  const nisab = NISAB_GRAM_EMAS * hargaEmasPerGram
  const wajib = harta >= nisab
  return {
    harta, nisab, wajib,
    zakat: wajib ? Math.round(harta * KADAR_ZAKAT) : 0,
    hargaEmasPerGram, gramNisab: NISAB_GRAM_EMAS
  }
}

/** zakat penghasilan bulanan (analogi zakat mal, nisab setahun) */
export function hitungZakatPenghasilan (gajiBulanan, hargaEmasPerGram) {
  const penghasilanSetahun = gajiBulanan * 12
  return hitungZakatMal(penghasilanSetahun, hargaEmasPerGram)
}

/** zakat fitrah: jumlah jiwa x harga beras per kg */
export function hitungZakatFitrah (jiwa, hargaBerasPerKg = 13000) {
  return {
    jiwa,
    kg: jiwa * 2.5,
    liter: jiwa * 3.5,
    rupiah: Math.round(jiwa * 2.5 * hargaBerasPerKg),
    hargaBerasPerKg
  }
}

/** waris (faraidh) sederhana — kasus umum, bukan fatwa */
export function hitungWaris (totalHarta, ahli = {}) {
  // ahli: { suami/istri, anakL, anakP, ayah, ibu }
  const a = { suami: 0, istri: 0, anakL: 0, anakP: 0, ayah: 0, ibu: 0, ...ahli }
  const adaAnak = a.anakL > 0 || a.anakP > 0
  const hasil = []
  let sisa = totalHarta
  const bagi = (nama, porsi, catatan) => {
    const nilai = Math.round(totalHarta * porsi)
    hasil.push({ nama, porsi, nilai, catatan })
    sisa -= nilai
    return nilai
  }
  if (a.suami > 0) bagi('Suami', adaAnak ? 0.25 : 0.5, adaAnak ? '1/4 karena ada anak' : '1/2 karena tidak ada anak')
  if (a.istri > 0) bagi(`Istri (${a.istri} orang)`, (adaAnak ? 0.125 : 0.25), adaAnak ? '1/8 karena ada anak (dibagi rata antar istri)' : '1/4 karena tidak ada anak')
  if (a.ibu > 0) bagi('Ibu', (a.anakL + a.anakP > 1) ? 1 / 6 : (0.1667), '1/6 jika ada anak/saudara lebih dari satu, selain itu 1/3')
  if (a.ayah > 0 && !adaAnak) bagi('Ayah', 1 / 6, '1/6 (jika ada anak, ayah mendapat sisanya)')
  if (adaAnak) {
    const bagianAnak = Math.max(0, sisa)
    const unit = a.anakL * 2 + a.anakP
    if (unit > 0) {
      const perUnit = bagianAnak / unit
      if (a.anakL) hasil.push({ nama: `Anak laki-laki (${a.anakL})`, porsi: '2 bagian', nilai: Math.round(perUnit * 2 * a.anakL), catatan: 'ashabah, 2x bagian anak perempuan' })
      if (a.anakP) hasil.push({ nama: `Anak perempuan (${a.anakP})`, porsi: '1 bagian', nilai: Math.round(perUnit * a.anakP), catatan: 'ashabah bersama saudara laki-laki' })
      sisa = 0 // seluruh sisa habis dibagi ke anak (ashabah)
    }
  } else if (a.ayah > 0) {
    hasil.push({ nama: 'Ayah', porsi: 'sisa', nilai: Math.max(0, Math.round(sisa)), catatan: 'ashabah (sisa harta)' })
  }
  const sisaAkhir = Math.max(0, Math.round(sisa))
  return { totalHarta, hasil, sisa: sisaAkhir < 1000 ? 0 : sisaAkhir, totalDibagi: hasil.reduce((a, b) => a + b.nilai, 0) }
}

/* ------------------------------------------------------------------ */
/*  AKSES DATASET (diteruskan agar fitur cukup import 1 modul)         */
/* ------------------------------------------------------------------ */
export { surahs, asmaulHusna, duas, duaCategories, doaHarian, haditsArbain, search }

export default {
  prayerTimes, qiblaFromCoords, qiblaCity, hijriToday, masehiKeHijri, hijriKeMasehi, hijriText,
  surahDetail, ayahDetail, surahs, asmaulHusna, duas, duaCategories, doaHarian, haditsArbain,
  NABI, NIAT, TATACARA, DZIKIR, BULAN_HIJRI, puasaSunnahInfo,
  hitungZakatMal, hitungZakatPenghasilan, hitungZakatFitrah, hitungWaris, search
}
