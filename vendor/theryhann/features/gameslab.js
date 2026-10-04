/**
 * 🎮 GAMESLAB — 50 game & kuis baru (kategori Games, v6)
 * ------------------------------------------------------------
 *  34 kuis dinamis (soal dibuat dari dataset: 114 surah, 250 negara,
 *  118 unsur, 38 provinsi, 99 Asmaul Husna) + bank soal statis
 *  (nabi, singkatan, logika, sejarah, olahraga, makanan, lirik).
 *  6 game ber-sesi khusus (hangman, kuis beruntun, hitung cepat,
 *  memori angka, sambung kata, urutkan angka) — punya checker sendiri
 *  (checkLabAnswer) yang dipasang di handlers/message.js.
 *  10 game instan + utilitas.
 *
 *  Sesi disimpan di lib/gamestore.js (Map bersama) supaya instance
 *  plugin (dgn cache-buster) dan handler melihat data yang sama.
 */
import { config } from '../config.js'
import { pickRandom, truncate } from '../lib/functions.js'
import { addExp, addMoney } from '../lib/rpg.js'
import { gameSessions, labSessions } from '../lib/gamestore.js'
import { countries, elements, provinces, surahs, asmaulHusna, findCountry } from '../lib/datasets.js'

const P = config.display.prefix
const TTL = 120000

/* ================================================================== */
/*  BANK SOAL STATIS                                                   */
/* ================================================================== */
export const NABI = [
  { q: 'Nabi yang ditelan ikan besar (paus)?', a: ['yunus', 'nabi yunus'] },
  { q: 'Nabi yang kapalnya selamat dari banjir besar?', a: ['nuh', 'nabi nuh'] },
  { q: 'Nabi yang dibakar tapi tidak hangus?', a: ['ibrahim', 'nabi ibrahim'] },
  { q: 'Nabi yang bisa bicara dengan hewan & menundukkan angin?', a: ['sulaiman', 'nabi sulaiman'] },
  { q: 'Nabi yang diberi mukjizat tongkat menjadi ular?', a: ['musa', 'nabi musa'] },
  { q: 'Nabi yang paling sabar, diuji penyakit & kehilangan harta?', a: ['ayub', 'nabi ayub'] },
  { q: 'Nabi yang diangkat ke langit dalam peristiwa Mikraj?', a: ['muhammad', 'nabi muhammad'] },
  { q: 'Nabi yang selamat dari raksasa Jalut bersama Daud?', a: ['talut'] },
  { q: 'Nabi yang dibuatkan baju besi pertama kali?', a: ['daud', 'nabi daud'] },
  { q: 'Nabi yang bisa menghidupkan orang mati atas izin Allah?', a: ['isa', 'nabi isa'] },
  { q: 'Nabi yang ditelan ikan dan berdoa dalam 3 kegelapan?', a: ['yunus'] },
  { q: 'Nabi yang membangun Ka\'bah bersama putranya?', a: ['ibrahim'] }
]
export const SINGKATAN = [
  { q: 'Apa kepanjangan WHO?', a: ['world health organization', 'who'] },
  { q: 'Apa kepanjangan UNESCO?', a: ['united nations educational scientific and cultural organization', 'unesco'] },
  { q: 'Apa kepanjangan BPJS?', a: ['badan penyelenggara jaminan sosial'] },
  { q: 'Apa kepanjangan DPR?', a: ['dewan perwakilan rakyat'] },
  { q: 'Apa kepanjangan KPK?', a: ['komisi pemberantasan korupsi'] },
  { q: 'Apa kepanjangan TNI?', a: ['tentara nasional indonesia'] },
  { q: 'Apa kepanjangan NASA?', a: ['national aeronautics and space administration'] },
  { q: 'Apa kepanjangan PSSI?', a: ['persatuan sepak bola seluruh indonesia'] },
  { q: 'Apa kepanjangan HTML?', a: ['hypertext markup language'] },
  { q: 'Apa kepanjangan API?', a: ['application programming interface'] },
  { q: 'Apa kepanjangan IMB/PBG?', a: ['persetujuan bangunan gedung', 'izin mendirikan bangunan'] },
  { q: 'Apa kepanjangan ASEAN?', a: ['association of southeast asian nations'] }
]
export const LOGIKA = [
  { q: 'Semua kucing bisa berenang. Sebagian yang bisa berenang adalah ikan. Apakah semua kucing adalah ikan?', a: ['tidak', 'bukan'] },
  { q: 'Ayah Rina punya 5 anak: Nana, Nene, Nini, Nono. Siapa nama anak kelima?', a: ['rina'] },
  { q: 'Berapa kali angka 9 muncul dari 1 sampai 100?', a: ['20', 'dua puluh'] },
  { q: 'Kalau 3 baju kering dalam 3 jam, berapa lama 9 baju kering?', a: ['3 jam', '3', 'tiga jam'] },
  { q: 'Apa yang selalu ada di depanmu tapi tidak bisa kamu lihat?', a: ['masa depan'] },
  { q: 'Semakin banyak diambil, semakin besar. Apakah itu?', a: ['lubang', 'galian'] },
  { q: 'Punya leher tapi tidak punya kepala, punya dua lengan tapi tidak punya tangan?', a: ['baju', 'kemeja'] },
  { q: 'Selalu basah saat mengeringkan?', a: ['handuk'] },
  { q: 'Dibuang malah dipakai, disimpan malah dibuang?', a: ['jangkar', 'sauh'] },
  { q: 'Berat mana: 1 kg besi atau 1 kg kapas?', a: ['sama', 'sama saja', 'sama berat'] },
  { q: 'Ada 12 permen, kamu ambil 4. Berapa permen yang kamu punya?', a: ['4', 'empat'] },
  { q: 'Bulan apa yang punya 28 hari?', a: ['semua bulan', 'semua'] }
]
export const HEWAN = [
  { q: 'Hewan mamalia terbesar di dunia?', a: ['paus biru', 'paus'] },
  { q: 'Hewan darat tercepat di dunia?', a: ['cheetah', 'citah'] },
  { q: 'Burung terbesar yang tidak bisa terbang?', a: ['burung unta', 'unta'] },
  { q: 'Hewan yang punya kantung di perutnya?', a: ['kangguru'] },
  { q: 'Reptil terbesar di dunia, asli Indonesia?', a: ['komodo'] },
  { q: 'Hewan yang tidurnya bergantung terbalik?', a: ['kelelawar'] },
  { q: 'Serangga penghasil madu?', a: ['lebah'] },
  { q: 'Hewan berkaki delapan pemakan darah?', a: ['laba-laba', 'laba laba'] },
  { q: 'Ikan yang bisa memanjat pohon?', a: ['ikan gabus', 'gabus', 'tembakang'] },
  { q: 'Hewan dengan leher terpanjang?', a: ['jerapah'] },
  { q: 'Hewan marsupial pemakan eukaliptus?', a: ['koala'] },
  { q: 'Hewan laut bertentakel, cerdas, bisa menyemprot tinta?', a: ['gurita'] }
]
export const GUNUNG = [
  { q: 'Gunung tertinggi di dunia?', a: ['everest'] },
  { q: 'Gunung tertinggi di Indonesia?', a: ['puncak jaya', 'carstensz', 'jaya wijaya'] },
  { q: 'Gunung berapi aktif terkenal di Jawa Timur, punya lautan pasir?', a: ['bromo'] },
  { q: 'Gunung tertinggi di Jawa?', a: ['semeru'] },
  { q: 'Gunung di Sumatera Utara dekat Danau Toba?', a: ['sinabung', 'sibayak'] },
  { q: 'Gunung tertinggi di Afrika?', a: ['kilimanjaro'] },
  { q: 'Gunung tertinggi di Jepang?', a: ['fuji'] },
  { q: 'Gunung di Lombok yang jadi favorit pendaki?', a: ['rinjani'] }
]
export const LAUT = [
  { q: 'Samudra terluas di dunia?', a: ['pasifik'] },
  { q: 'Samudra terkecil di dunia?', a: ['arktik'] },
  { q: 'Laut dengan kadar garam paling tinggi?', a: ['laut mati'] },
  { q: 'Selat yang memisahkan Jawa dan Sumatera?', a: ['sunda'] },
  { q: 'Teluk terbesar di dunia?', a: ['bengal', 'teluk bengal'] },
  { q: 'Palung laut terdalam di dunia?', a: ['mariana'] }
]
export const MAKANAN = [
  { q: 'Makanan khas Padang berbahan daging sapi berkuah santan kental?', a: ['rendang'] },
  { q: 'Makanan khas Yogyakarta dari nangka muda?', a: ['gudeg'] },
  { q: 'Makanan khas Palembang dari ikan dan sagu?', a: ['pempek'] },
  { q: 'Kue khas Betawi berbentuk keranjang?', a: ['kerak telor', 'kerak telor telor'] },
  { q: 'Makanan khas Sulawesi Utara berbahan ayam dan rica-rica?', a: ['ayam rica-rica', 'rica rica', 'woku'] },
  { q: 'Minuman khas Bandung dari alpukat, es, dan susu?', a: ['es alpukat', 'jus alpukat'] },
  { q: 'Makanan khas Sunda dari nasi dibungkus daun pisang dikukus?', a: ['nasi timbel'] },
  { q: 'Kue tradisional berbahan tepung beras & gula merah, dibungkus daun pisang?', a: ['nagasari'] }
]
export const SEJARAH = [
  { q: 'Tanggal proklamasi kemerdekaan Indonesia?', a: ['17 agustus 1945', '17-8-1945', '17 agustus'] },
  { q: 'Siapa pembaca teks proklamasi?', a: ['soekarno', 'ir soekarno', 'bung karno'] },
  { q: 'Siapa perumus teks proklamasi bersama Soekarno?', a: ['hatta', 'mohammad hatta'] },
  { q: 'Nama kapal yang menjatuhkan bom di Hiroshima?', a: ['enola gay'] },
  { q: 'Kerajaan Hindu tertua di Indonesia?', a: ['kutai'] },
  { q: 'Kerajaan Buddha terbesar di Jawa?', a: ['sriwijaya', 'syailendra'] },
  { q: 'Candi Hindu terbesar di Indonesia?', a: ['prambanan'] },
  { q: 'Sumpah yang menyatukan pemuda Indonesia tahun 1928?', a: ['sumpah pemuda'] },
  { q: 'Nama asli Patih Gadjah Mada dari kerajaan?', a: ['majapahit'] },
  { q: 'Peristiwa penculikan Soekarno-Hatta sebelum proklamasi?', a: ['rengasdengklok'] }
]
export const OLAHRAGA = [
  { q: 'Olahraga dengan istilah "smash" dan "net" memakai kok?', a: ['bulu tangkis', 'bulutangkis', 'badminton'] },
  { q: 'Berapa pemain satu tim sepak bola di lapangan?', a: ['11', 'sebelas'] },
  { q: 'Induk organisasi sepak bola dunia?', a: ['fifa'] },
  { q: 'Induk organisasi sepak bola Indonesia?', a: ['pssi'] },
  { q: 'Olahraga asal Jepang dengan teknik bantingan?', a: ['judo'] },
  { q: 'Cabang olahraga yang memperebutkan "ring" dan sarung tinju?', a: ['tinju', 'boxing'] },
  { q: 'Berapa poin servis penuh di bola voli (rally point)?', a: ['25'] },
  { q: 'Olahraga air dengan papan dan ombak?', a: ['selancar', 'surfing'] }
]
export const FILM = [
  { q: 'Film animasi Disney tentang boneka salju yang hidup?', a: ['frozen'] },
  { q: 'Film Indonesia horor tentang keluarga yang pindah ke rumah tua (2017)?', a: ['pengabdi setan'] },
  { q: 'Film animasi tentang ikan badut yang hilang?', a: ['finding nemo'] },
  { q: 'Film superhero dengan jaring laba-laba?', a: ['spider-man', 'spiderman'] },
  { q: 'Film Indonesia tentang Laskar Pelangi diadaptasi dari novel karya?', a: ['andrea hirata'] },
  { q: 'Film animasi tentang mainan yang hidup saat tidak dilihat?', a: ['toy story'] },
  { q: 'Film Titanic disutradarai oleh?', a: ['james cameron'] },
  { q: 'Film Indonesia "Dilan 1990" diperankan oleh?', a: ['iqbaal', 'iqbaal ramadhan'] }
]
export const LIRIK = [
  { q: 'Lengkapi: "Balonku ada lima, rupa-rupa ..."', a: ['warnanya'] },
  { q: 'Lengkapi: "Naik-naik ke puncak gunung, tinggi-tinggi ..."', a: ['sekali'] },
  { q: 'Lengkapi: "Garuda Pancasila, akulah pendukung ..."', a: ['mu', 'setia', 'patriot'] },
  { q: 'Lengkapi: "Indonesia raya, merdeka, ..."', a: ['merdeka', 'tanahku'] },
  { q: 'Lengkapi: "Pelangi-pelangi alangkah ..."', a: ['indahnya'] },
  { q: 'Lengkapi: "Bintang kecil di langit yang ..."', a: ['biru', 'tinggi'] },
  { q: 'Lagu "Halo-Halo Bandung" menyebut kota?', a: ['bandung'] },
  { q: 'Lengkapi: "Hari merdeka, 17 Agustus tahun ..."', a: ['45', 'empat lima'] }
]
export const ILMU = [
  { q: 'Planet terkecil di tata surya?', a: ['merkurius'] },
  { q: 'Gas yang dihirup manusia untuk bernapas?', a: ['oksigen', 'o2'] },
  { q: 'Gas yang dikeluarkan tumbuhan saat fotosintesis?', a: ['oksigen'] },
  { q: 'Satuan SI untuk gaya?', a: ['newton'] },
  { q: 'Organ tubuh yang memproduksi insulin?', a: ['pankreas'] },
  { q: 'Ilmu yang mempelajari cuaca?', a: ['meteorologi'] },
  { q: 'Benda langit yang mengelilingi planet?', a: ['satelit'] },
  { q: 'Proses perubahan air menjadi uap?', a: ['evaporasi', 'penguapan'] },
  { q: 'Hukum "aksi = reaksi" adalah hukum Newton ke?', a: ['3', 'tiga'] },
  { q: 'Sel darah yang melawan infeksi?', a: ['leukosit', 'sel darah putih'] }
]
const GEOGRAFI = [
  { q: 'Danau terbesar di Indonesia?', a: ['toba', 'danau toba'] },
  { q: 'Sungai terpanjang di Indonesia?', a: ['kapuas'] },
  { q: 'Gurun terbesar di dunia?', a: ['sahara'] },
  { q: 'Benua terkecil di dunia?', a: ['australia'] },
  { q: 'Negara dengan penduduk terbanyak di dunia (2024)?', a: ['india', 'tiongkok', 'cina', 'china'] },
  { q: 'Pulau terbesar di Indonesia?', a: ['kalimantan'] },
  { q: 'Negara terkecil di dunia?', a: ['vatikan'] },
  { q: 'Sungai terpanjang di dunia?', a: ['nil', 'amazon'] },
  { q: 'Ibu kota Australia?', a: ['canberra'] },
  { q: 'Ibu kota Kanada?', a: ['ottawa'] },
  { q: 'Negara berbentuk sepatu bot?', a: ['italia'] },
  { q: 'Gunung api terkenal di Italia dekat Napoli?', a: ['vesuvius'] }
]
const KATA_KUNCI = ['sekolah', 'komputer', 'kulkas', 'jendela', 'sepeda', 'kamera', 'televisi', 'kacamata',
  'payung', 'sepatu', 'handuk', 'bantal', 'lemari', 'garpu', 'piring', 'cermin', 'jam dinding', 'kipas angin',
  'pesawat', 'kereta', 'pelabuhan', 'perpustakaan', 'rumah sakit', 'pasar malam', 'gunung berapi', 'pantai indah']
const HANGMAN = ['indonesia', 'merdeka', 'perpustakaan', 'teknologi', 'komunikasi', 'kebudayaan',
  'matematika', 'fotografi', 'lingkungan', 'kemerdekaan', 'petualangan', 'pengetahuan', 'kesempatan',
  'persahabatan', 'perjuangan', 'kebersihan', 'keselamatan', 'perdagangan', 'pembangunan', 'kesejahteraan']

/* ================================================================== */
/*  MESIN KUIS UMUM (memakai checker checkGameAnswer di games.js)      */
/* ================================================================== */
function startQuiz (m, { game, question, answer, reward = 300, exp = 35, extra = '' }) {
  if (!question || answer === undefined || answer === null) return m.reply('⚠️ Soal tidak tersedia. Coba lagi sebentar.')
  const s = gameSessions.get(m.jid)
  if (s && Date.now() < s.expires) {
    return m.reply(`⏳ Masih ada game *${s.game}* berjalan di chat ini.\nJawab dulu, atau tunggu ${Math.ceil((s.expires - Date.now()) / 1000)} detik.\nBatal: ${P}batalgame`)
  }
  gameSessions.set(m.jid, { game, cmd: game, answer, reward, exp, host: m.senderKey || m.sender, expires: Date.now() + TTL })
  const text = `${question}\n\n${extra}⏱️ Waktu: *${TTL / 1000} detik*\n💰 Hadiah: ${reward.toLocaleString('id-ID')} koin + ${exp} EXP\n\nKetik jawabanmu di chat ini!`
  return m.sendButtons({
    title: `🎮 ${game.toUpperCase()}`,
    text,
    footer: `${config.bot.name} · Games v6`,
    buttons: [{ text: '🚫 Batalkan', id: `${P}batalgame` }, { text: '🎮 Daftar Game', id: `${P}daftargame` }]
  }).catch(() => m.reply(text))
}

const quiz = (command, aliases, description, buat, contoh = '1') => ({
  command: [command, ...aliases],
  category: 'Games',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    try {
      const soal = await buat(m)
      if (!soal) return
      // dataset bank soal memakai {q,a}; mesin kuis memakai {question,answer}
      const question = soal.question ?? soal.q ?? soal.soal
      const answer = soal.answer ?? soal.a ?? soal.jawaban
      if (!question || answer === undefined || answer === null) {
        return m.reply(`⚠️ Soal ${command} tidak tersedia. Coba lagi atau laporkan: ${P}laporbug`)
      }
      return startQuiz(m, { game: command, ...soal, question, answer })
    } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 160)}`) }
  }
})

const acak = (s) => [...String(s)].sort(() => Math.random() - 0.5).join('')
const normal = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/* ================================================================== */
/*  GAME BER-SESI KHUSUS (checker: checkLabAnswer)                     */
/* ================================================================== */
function startLab (m, game, state, intro, ttl = TTL) {
  const s = gameSessions.get(m.jid)
  if (s && Date.now() < s.expires) return m.reply(`⏳ Masih ada game *${s.game}* berjalan. Batal: ${P}batalgame`)
  const l = labSessions.get(m.jid)
  if (l && Date.now() < l.expires) return m.reply(`⏳ Masih ada game *${l.game}* berjalan di chat ini. Batal: ${P}batalgamelab`)
  labSessions.set(m.jid, { game, state, host: m.senderKey || m.sender, expires: Date.now() + ttl })
  return m.sendButtons({
    title: `🎮 ${game.toUpperCase()}`,
    text: intro,
    footer: `${config.bot.name} · Games v6`,
    buttons: [{ text: '🚫 Batalkan', id: `${P}batalgamelab` }]
  }).catch(() => m.reply(intro))
}

const lab = (command, aliases, description, run, contoh = '1') => ({
  command: [command, ...aliases],
  category: 'Games',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 160)}`) }
  }
})

const menang = (m, teks, lagi) => ({
  type: 'win',
  title: '🎉 Menang!',
  text: teks,
  buttons: [{ text: '🔄 Main Lagi', id: `${P}${lagi}` }, { text: '🎮 Daftar Game', id: `${P}daftargame` }, { text: '🏠 Menu', id: 'act:menu:main' }]
})
const kalah = (m, teks, lagi) => ({
  type: 'lose',
  title: '😢 Kalah',
  text: teks,
  buttons: [{ text: '🔄 Coba Lagi', id: `${P}${lagi}` }, { text: '🎮 Daftar Game', id: `${P}daftargame` }]
})
const beriHadiah = (m, koin, exp) => {
  const key = m.senderKey || m.sender
  try { addMoney(key, koin); addExp(key, exp) } catch { /* rpg opsional */ }
  return `\n\n💰 +${koin.toLocaleString('id-ID')} koin\n✨ +${exp} EXP`
}

/* ================================================================== */
/*  DAFTAR COMMAND                                                     */
/* ================================================================== */
export const gameslabCmds = [
  /* ---------- KUIS DARI DATASET (dinamis) ---------- */
  quiz('kuissurah', ['quizzsurah'], 'Kuis: nama/arti/jumlah ayat surah Al-Quran', () => {
    const s = pickRandom(surahs())
    const mode = pickRandom(['nama', 'arti', 'ayat', 'tipe'])
    if (mode === 'nama') return { question: `*📖 KUIS SURAH*\n\nSurah nomor *${s.no}* artinya "${s.arti}" dan memiliki ${s.ayat} ayat.\n\nApa nama surah tersebut?`, answer: [normal(s.nama), s.nama.toLowerCase()] }
    if (mode === 'arti') return { question: `*📖 KUIS SURAH*\n\nSurah *${s.nama}* (${s.tipe}, ${s.ayat} ayat).\n\nApa arti nama surah tersebut?`, answer: normal(s.arti).split(' ').slice(0, 3).join(' ') }
    if (mode === 'ayat') return { question: `*📖 KUIS SURAH*\n\nBerapa jumlah ayat surah *${s.nama}* (${s.tipe})?`, answer: [String(s.ayat)] }
    return { question: `*📖 KUIS SURAH*\n\nSurah *${s.nama}* diturunkan di kota mana (${s.tipe})?`, answer: [s.tipe.toLowerCase()] }
  }),

  quiz('kuisayat', ['tebakayat'], 'Kuis: nomor surah dari potongan informasi ayat', () => {
    const s = pickRandom(surahs())
    return {
      question: `*🔢 KUIS NOMOR SURAH*\n\n"${s.nama}" — ${s.arti} (${s.tipe}, ${s.ayat} ayat)\n\nBerapa nomor urut surah ini dalam mushaf?`,
      answer: [String(s.no)]
    }
  }),

  quiz('kuisnegara', ['tebaknegara'], 'Kuis: nama negara dari petunjuk', () => {
    const c = pickRandom(countries().filter(x => x.area > 10000))
    return {
      question: `*🌍 KUIS NEGARA*\n\n▸ Ibu kota: ${c.ibu}\n▸ Wilayah: ${c.regionId || c.region} — ${c.sub}\n▸ Mata uang: ${(c.matauang || '-').split(' ')[0]}\n▸ Kode panggil: ${c.kode}\n▸ Luas: ${c.area.toLocaleString('id-ID')} km²\n\nNegara apa ini?`,
      answer: [normal(c.id), c.id.toLowerCase(), normal(c.nama), c.nama.toLowerCase()]
    }
  }),

  quiz('kuisibukota', ['tebakibukota'], 'Kuis: ibu kota sebuah negara', () => {
    const c = pickRandom(countries().filter(x => x.ibu))
    return { question: `*🏛️ KUIS IBU KOTA*\n\nApa ibu kota negara *${c.id}* ${c.bendera}?`, answer: normal(c.ibu) }
  }),

  quiz('kuisbendera', ['tebakkibendera2'], 'Kuis: tebak negara dari emoji bendera', () => {
    const c = pickRandom(countries().filter(x => x.bendera))
    return { question: `*🚩 KUIS BENDERA*\n\nBendera: ${c.bendera}\n\nNegara apa ini?`, answer: [normal(c.id), c.id.toLowerCase(), normal(c.nama), c.nama.toLowerCase()] }
  }),

  quiz('kuisuang', ['tebakmatauang'], 'Kuis: mata uang sebuah negara', () => {
    const c = pickRandom(countries().filter(x => x.matauang))
    const kode = c.matauang.split(' ')[0]
    return { question: `*💵 KUIS MATA UANG*\n\nApa kode mata uang negara *${c.id}* ${c.bendera}?\n\n(Jawab dengan kode 3 huruf)`, answer: [kode.toLowerCase(), kode] }
  }),

  quiz('kuisbahasa', ['tebakbahasa'], 'Kuis: bahasa resmi sebuah negara', () => {
    const c = pickRandom(countries().filter(x => x.bahasa))
    const b = c.bahasa.split(',')[0].trim()
    return { question: `*🗣️ KUIS BAHASA*\n\nApa bahasa utama yang dipakai di *${c.id}* ${c.bendera}?`, answer: normal(b) }
  }),

  quiz('kuisunsur', ['tebakunsur'], 'Kuis: nama unsur dari simbol kimia', () => {
    const e = pickRandom(elements())
    return { question: `*⚗️ KUIS KIMIA*\n\nSimbol *${e.simbol}* adalah unsur apa?\n\n(Golongan: ${e.golongan})`, answer: [normal(e.nama), e.nama.toLowerCase(), e.simbol.toLowerCase()] }
  }),

  quiz('kuisatom', ['tebakatom'], 'Kuis: nomor atom sebuah unsur', () => {
    const e = pickRandom(elements())
    return { question: `*🔬 KUIS NOMOR ATOM*\n\nBerapa nomor atom unsur *${e.nama}* (${e.simbol})?`, answer: [String(e.atom)] }
  }),

  quiz('kuisgolongan', ['tebakgolongan'], 'Kuis: golongan unsur kimia', () => {
    const e = pickRandom(elements())
    return { question: `*🧪 KUIS GOLONGAN*\n\nUnsur *${e.nama}* (${e.simbol}) termasuk golongan apa?`, answer: normal(e.golongan) }
  }),

  quiz('kuisprovinsi', ['tebakprovinsi'], 'Kuis: ibu kota provinsi Indonesia', () => {
    const p = pickRandom(provinces())
    const mode = pickRandom(['ibu', 'pulau'])
    return mode === 'ibu'
      ? { question: `*🏞️ KUIS PROVINSI*\n\nApa ibu kota provinsi *${p.nama}*?`, answer: normal(p.ibu) }
      : { question: `*🏝️ KUIS PROVINSI*\n\nProvinsi *${p.nama}* (ibu kota ${p.ibu}) berada di pulau apa?`, answer: normal(p.pulau) }
  }),

  quiz('kuisasmaul', ['tebakasmaul'], 'Kuis: arti Asmaul Husna', () => {
    const a = pickRandom(asmaulHusna())
    return { question: `*🕌 KUIS ASMAUL HUSNA*\n\nApa arti *${a.ar || a.latin}* (${a.latin})?`, answer: normal(a.id) }
  }),

  quiz('kuisnabi', ['tebaknabi'], 'Kuis: kisah para nabi', () => pickRandom(NABI)),
  quiz('kuissingkatan', ['tebaksingkatan'], 'Kuis: kepanjangan singkatan', () => pickRandom(SINGKATAN)),
  quiz('kuislogika', ['tebaklogika'], 'Kuis: teka-teki logika', () => pickRandom(LOGIKA)),
  quiz('kuishewan', ['tebakhewan2'], 'Kuis: dunia hewan', () => pickRandom(HEWAN)),
  quiz('kuisgunung', ['tebakgunung'], 'Kuis: gunung & pendakian', () => pickRandom(GUNUNG)),
  quiz('kuislaut', ['tebaklaut'], 'Kuis: laut & samudra', () => pickRandom(LAUT)),
  quiz('kuismakanan', ['tebakmakanan'], 'Kuis: kuliner nusantara', () => pickRandom(MAKANAN)),
  quiz('kuissejarah', ['tebaksejarah'], 'Kuis: sejarah Indonesia & dunia', () => pickRandom(SEJARAH)),
  quiz('kuisolahraga', ['tebakolahraga'], 'Kuis: dunia olahraga', () => pickRandom(OLAHRAGA)),
  quiz('kuisfilm', ['tebakfilm'], 'Kuis: film & animasi', () => pickRandom(FILM)),
  quiz('kuislirik', ['tebaklirik'], 'Kuis: lengkapi lirik lagu', () => pickRandom(LIRIK)),
  quiz('kuisilmu', ['tebakilmu'], 'Kuis: sains & pengetahuan umum', () => pickRandom(ILMU)),
  quiz('kuisgeografi', ['tebakgeografi'], 'Kuis: geografi dunia', () => pickRandom(GEOGRAFI)),

  quiz('kuisaritmatika', ['hitungcepatkuis'], 'Kuis: hitung cepat (penjumlahan/perkalian)', () => {
    const ops = ['+', '-', '×']
    const op = pickRandom(ops)
    let a, b, hasil
    if (op === '+') { a = 12 + Math.floor(Math.random() * 88); b = 12 + Math.floor(Math.random() * 88); hasil = a + b }
    else if (op === '-') { a = 50 + Math.floor(Math.random() * 150); b = Math.floor(Math.random() * a); hasil = a - b }
    else { a = 3 + Math.floor(Math.random() * 17); b = 3 + Math.floor(Math.random() * 17); hasil = a * b }
    return { question: `*🧮 KUIS ARITMATIKA*\n\nBerapa hasil dari:\n\n  ${a} ${op} ${b} = ?`, answer: [String(hasil)] }
  }),

  quiz('kuispecahan', ['tebakpecahan'], 'Kuis: pecahan & desimal', () => {
    const penyebut = pickRandom([2, 4, 5, 8, 10, 20, 25, 50])
    const persen = pickRandom([10, 20, 25, 30, 40, 50, 60, 75, 80])
    const mode = pickRandom(['pecahan', 'persen'])
    if (mode === 'pecahan') {
      const total = penyebut * (1 + Math.floor(Math.random() * 5))
      const ambil = total / penyebut
      return { question: `*➗ KUIS PECAHAN*\n\n1/${penyebut} dari ${total} = ?`, answer: [String(ambil)] }
    }
    const angka = pickRandom([100, 200, 400, 500, 800, 1000, 1500])
    const hasil = angka * persen / 100
    return { question: `*💯 KUIS PERSEN*\n\n${persen}% dari ${angka} = ?`, answer: [String(hasil), String(hasil).replace('.', ',')] }
  }),

  quiz('kuisanagram', ['susunkata'], 'Kuis: susun huruf acak jadi kata', () => {
    const kata = pickRandom(KATA_KUNCI).toLowerCase()
    let acakKata = acak(kata.replace(/\s/g, ''))
    let guard = 0
    while (acakKata === kata.replace(/\s/g, '') && guard++ < 10) acakKata = acak(kata.replace(/\s/g, ''))
    return {
      question: `*🔤 KUIS ANAGRAM*\n\nSusun huruf ini menjadi kata yang bermakna:\n\n\`${acakKata.split('').join(' ')}\`\n\nPetunjuk: ${kata.length} huruf${kata.includes(' ') ? ', terdiri 2 kata' : ''}`,
      answer: [normal(kata), kata.replace(/\s/g, '')]
    }
  }),

  quiz('kuiskode', ['tebakkode'], 'Kuis: output kode JavaScript sederhana', () => {
    const soal = [
      { q: 'console.log(2 + "2")', a: ['22'] },
      { q: 'console.log(typeof [])', a: ['object'] },
      { q: 'console.log(10 % 3)', a: ['1'] },
      { q: 'console.log("5" - 2)', a: ['3'] },
      { q: 'console.log(Boolean(""))', a: ['false'] },
      { q: 'console.log([1,2,3].length)', a: ['3'] },
      { q: 'console.log(Math.max(3, 9, 2))', a: ['9'] },
      { q: 'console.log("abc".toUpperCase())', a: ['abc'.toUpperCase()] },
      { q: 'console.log(0.1 + 0.2 === 0.3)', a: ['false'] },
      { q: 'console.log(typeof null)', a: ['object'] },
      { q: 'console.log([..."hai"].length)', a: ['3'] },
      { q: 'console.log(2 ** 10)', a: ['1024'] }
    ]
    const s = pickRandom(soal)
    return { question: `*💻 KUIS KODE JS*\n\nApa output dari:\n\n\`\`\`js\n${s.q}\n\`\`\``, answer: s.a }
  }),

  /* ---------- GAME BER-SESI KHUSUS ---------- */
  lab('gantungman', ['hangman', 'tebakkatahuruf'], 'Hangman: tebak kata huruf demi huruf (6 nyawa)', m => {
    const kata = pickRandom(HANGMAN).toUpperCase()
    const state = { kata, terbuka: [], nyawa: 6, huruf: [], soal: Math.ceil(kata.length / 3) }
    const tampil = kata.split('').map(c => (c === ' ' ? '  ' : state.terbuka.includes(c) ? c : '_')).join(' ')
    return startLab(m, 'gantungman', state,
      `*☠️ GANTUNG MAN*\n\nKata rahasia (${kata.length} huruf):\n\n\`${tampil}\`\n\nNyawa: ${'❤️'.repeat(state.nyawa)}\n\nCara main:\n▸ Kirim 1 huruf, misal: \`a\`\n▸ Atau tebak katanya langsung\n\n💰 Hadiah: ${200 + kata.length * 30} koin + ${40 + kata.length * 2} EXP`)
  }),

  lab('hitungcepat', ['speedmath'], 'Hitung cepat: 5 soal beruntun, skor + bonus waktu', m => {
    const buat = () => {
      const op = pickRandom(['+', '-', '×'])
      let a, b, h
      if (op === '+') { a = 10 + Math.floor(Math.random() * 90); b = 10 + Math.floor(Math.random() * 90); h = a + b }
      else if (op === '-') { a = 50 + Math.floor(Math.random() * 100); b = Math.floor(Math.random() * a); h = a - b }
      else { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12); h = a * b }
      return { teks: `${a} ${op} ${b}`, h }
    }
    const soal = buat()
    const state = { n: 1, total: 5, benar: 0, soal, mulai: Date.now() }
    return startLab(m, 'hitungcepat', state,
      `*⚡ HITUNG CEPAT*\n\nSelesaikan *5 soal* secepat mungkin!\n\nSoal 1/5:\n\n  ${soal.teks} = ?\n\nKirim jawabannya (angka). Bonus waktu untuk jawaban cepat!`, 180000)
  }),

  lab('memoriangka', ['memorynumber'], 'Uji memori: hafal deret angka lalu tulis ulang', m => {
    const panjang = Math.min(9, 4 + Math.floor(Math.random() * 4) + Number(m.args[0] || 0))
    const deret = Array.from({ length: panjang }, () => Math.floor(Math.random() * 10)).join('')
    return startLab(m, 'memoriangka', { deret },
      `*🧠 MEMORI ANGKA*\n\nHafalkan deret ini lalu tulis ulang dari awal:\n\n#️⃣ ${deret.split('').join(' ')}\n\nPanjang: ${panjang} digit\nHadiah: ${panjang * 80} koin + ${panjang * 12} EXP\n\n⚠️ Tulis ulang sekarang (sekali kesempatan)!`, 90000)
  }),

  lab('kuisberuntun', ['paketkuis', 'kuis5'], 'Paket 5 kuis campur semua kategori', m => {
    const banks = [LOGIKA, HEWAN, GUNUNG, MAKANAN, SEJARAH, OLAHRAGA, ILMU, GEOGRAFI, SINGKATAN, NABI, LIRIK, FILM]
    const daftar = Array.from({ length: 5 }, () => pickRandom(pickRandom(banks)))
    const s0 = daftar[0]
    return startLab(m, 'kuisberuntun', { daftar, n: 0, benar: 0, mulai: Date.now() },
      `*📚 PAKET KUIS (5 soal campur)*\n\nKategori: logika, hewan, geografi, sejarah, sains, dll.\n\nSoal 1/5:\n${s0.q}\n\nJawab langsung di chat!`, 240000)
  }),

  lab('sambungkata', ['wordchain'], 'Sambung kata: kata baru harus diawali huruf terakhir kata sebelumnya', m => {
    const awal = pickRandom(['sekolah', 'rumah', 'buku', 'matahari', 'komputer', 'sepak bola'])
    const huruf = awal.replace(/\s/g, '').slice(-1)
    return startLab(m, 'sambungkata', { terakhir: awal, huruf, rantai: [awal], giliran: 'user' },
      `*🔗 SAMBUNG KATA*\n\nAturan: kirim satu kata yang diawali huruf *"${huruf.toUpperCase()}"* (huruf terakhir dari kata sebelumnya), minimal 3 huruf, bukan kata yang sudah dipakai.\n\nKata pertama: *${awal}*\n\nGiliranmu! Contoh: \`${huruf}...\``, 120000)
  }),

  lab('tebakurutan', ['urutangka'], 'Urutkan 5 angka acak dari kecil ke besar', m => {
    const angka = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1)
    return startLab(m, 'tebakurutan', { angka, urut: [...angka].sort((a, b) => a - b) },
      `*🔢 URUTKAN ANGKA*\n\nUrutkan dari yang terkecil ke terbesar, pisahkan dengan spasi:\n\n\`${angka.join(' · ')}\`\n\nContoh jawaban: \`3 17 25 48 90\``, 90000)
  }),

  /* ---------- UTILITAS & PEMBATAL ---------- */
  lab('batalgamelab', ['cancelab', 'stopgamelab'], 'Batalkan game sesi khusus yang sedang berjalan', m => {
    const s = labSessions.get(m.jid)
    if (!s) return m.reply('ℹ️ Tidak ada game khusus yang berjalan di chat ini.')
    labSessions.delete(m.jid)
    return m.reply(`🚫 Game *${s.game}* dibatalkan.\n\nMain lagi: ${P}daftargame`)
  }),

  lab('daftargame', ['listgame', 'semuagame'], 'Daftar semua game & kuis yang tersedia', m => {
    const daftar = [
      ['🧠 Kuis Dinamis (soal dari database)', 'kuissurah · kuisnegara · kuisibukota · kuisbendera · kuisuang · kuisbahasa · kuisunsur · kuisatom · kuisgolongan · kuisprovinsi · kuisasmaul · kuisayat'],
      ['📚 Kuis Bank Soal', 'kuisnabi · kuissingkatan · kuislogika · kuishewan · kuisgunung · kuislaut · kuismakanan · kuissejarah · kuisolahraga · kuisfilm · kuislirik · kuisilmu · kuisgeografi · kuiskode'],
      ['🔢 Kuis Angka', 'kuisaritmatika · kuispecahan · kuisanagram · hitungcepat · memoriangka · tebakurutan · tebaknomor'],
      ['🎯 Game Sesi', 'gantungman · kuisberuntun · sambungkata · benarsalah'],
      ['🎲 Game Instan', 'dadudouble · dadutiga · lemparkoin3 · pilikartu · acakkata generator · roletgrup · tebakkarakter · kocoknama · angka hoki · gunting batu kertas grup'],
      ['🎮 Game Lama', 'tebakkata · asahotak · tebakbendera · tebakangka · family100 · suit · tictactoe · mathquiz']
    ]
    return m.sendButtons({
      title: '🎮 DAFTAR GAME',
      text: `${daftar.map(([k, v]) => `*${k}*\n${v}`).join('\n\n')}\n\n💡 Semua game memberi koin & EXP (masuk ke RPG).`,
      buttons: [{ text: '🧠 Kuis Acak', id: `${P}kuisacak` }, { text: '🎲 Game Instan', id: `${P}dadudouble` }, { text: '🏠 Menu', id: 'act:menu:main' }]
    }).catch(() => m.reply(daftar.map(([k, v]) => `*${k}*\n${v}`).join('\n\n')))
  }),

  quiz('kuisacak', ['randomquiz'], 'Kuis acak dari semua kategori', () => {
    const dinamis = [LOGIKA, HEWAN, GUNUNG, LAUT, MAKANAN, SEJARAH, OLAHRAGA, FILM, LIRIK, ILMU, GEOGRAFI, SINGKATAN, NABI]
    return pickRandom(pickRandom(dinamis))
  }),

  /* ---------- GAME INSTAN ---------- */
  lab('dadudouble', ['dadu2', 'roll2'], 'Lempar 2 dadu sekaligus', m => {
    const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6)
    const sisi = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    const total = a + b
    const pesan = total === 12 ? '🎉 Double enam! Jackpot!' : total === 2 ? '😅 Snake eyes!' : a === b ? '✨ Double!' : ''
    return m.reply(`🎲 *DADU DOUBLE*\n\n${sisi[a]} ${sisi[b]}\n\nDadu 1: *${a}*\nDadu 2: *${b}*\nTotal : *${total}* ${pesan}`)
  }),

  lab('dadutiga', ['dadu3', 'roll3'], 'Lempar 3 dadu (permainan Sic Bo sederhana)', m => {
    const sisi = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    const d = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6))
    const total = d.reduce((a, b) => a + b, 0)
    const triple = d[0] === d[1] && d[1] === d[2]
    const pasangan = d[0] === d[1] || d[1] === d[2] || d[0] === d[2]
    return m.reply(`🎲 *DADU TIGA*\n\n${d.map(x => sisi[x]).join(' ')}\n\nAngka: ${d.join(' · ')}\nTotal: *${total}* (${total >= 11 ? 'Besar' : 'Kecil'})\n${triple ? '💥 TRIPLE! Langka banget' : pasangan ? '✨ Ada pasangan' : 'Tidak ada pasangan'}`)
  }),

  lab('lemparkoin3', ['koin3', 'flip3'], 'Lempar 3 koin sekaligus', m => {
    const k = [1, 2, 3].map(() => Math.random() < 0.5 ? 'A' : 'G')
    const gambar = k.filter(x => x === 'G').length
    return m.reply(`🪙 *LEMPAR 3 KOIN*\n\n${k.map(x => (x === 'G' ? '🖼️ GAMBAR' : '🔢 ANGKA')).join(' · ')}\n\nHasil: ${gambar} gambar, ${3 - gambar} angka\n${gambar === 3 || gambar === 0 ? '💥 Seragam semua!' : ''}`)
  }),

  lab('pilikartu', ['kartuacak', 'drawcard'], 'Ambil 1 kartu dari dek remi 52 lembar', m => {
    const jenis = ['♠ Sekop', '♥ Hati', '♦ Wajik', '♣ Keriting']
    const angka = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King']
    const j = pickRandom(jenis), a = pickRandom(angka)
    const emoji = { '♠ Sekop': '♠️', '♥ Hati': '♥️', '♦ Wajik': '♦️', '♣ Keriting': '♣️' }[j]
    const nilai = a === 'As' ? 11 : ['Jack', 'Queen', 'King'].includes(a) ? 10 : Number(a)
    const merah = /Hati|Wajik/.test(j)
    return m.reply(`🃏 *KARTU KAMU*\n\n${emoji} *${a} ${j}*\n\nNilai blackjack: ${nilai}\nWarna: ${merah ? '🔴 Merah' : '⚫ Hitam'}\nSisa dek: 51 kartu\n\nAmbil lagi: ${P}pilikartu`)
  }),

  lab('roletgrup', ['randommember', 'pilihmember'], 'Acak 1 member grup secara adil', async m => {
    let participants = (m.groupSet?.participants || []).map(p => p.id || p)
    if (participants.length < 2) {
      try {
        const meta = await m.sock.groupMetadata(m.jid)
        participants = (meta?.participants || []).map(p => p.id || p)
      } catch { /* biarkan kosong */ }
    }
    const list = participants.length ? participants : [m.sender]
    if (list.length < 2) return m.reply('⚠️ Fitur ini butuh grup dengan minimal 2 member.')
    const terpilih = pickRandom(list)
    return m.reply(`🎰 *ROLET GRUP*\n\nDari *${list.length}* member, yang terpilih:\n\n👉 @${terpilih.split('@')[0]}\n\nSelamat! 🎉`, { mentions: [terpilih] })
  }, '1', { group: true }),

  lab('acakkata', ['kocokkata', 'anagram'], 'Acak huruf sebuah kata (untuk tebak-tebakan)', m => {
    const q = m.q || pickRandom(KATA_KUNCI)
    const bersih = String(q).toLowerCase().replace(/\s+/g, '')
    let hasil = acak(bersih)
    let guard = 0
    while (hasil === bersih && guard++ < 10) hasil = acak(bersih)
    return m.reply(`🔀 *KATA DIACAK*\n\nAsli   : ${q}\nAcak   : \`${hasil.split('').join(' ')}\`\nJumlah : ${bersih.length} huruf\n\nAjak teman menebak, lalu main: ${P}kuisanagram`)
  }, 'sekolah'),

  lab('tebakkarakter', ['randomkarakter', 'siapaaku'], 'Bot mendeskripsikan tokoh, kamu tebak', m => {
    const TOKOH = [
      { d: 'Presiden pertama Indonesia, proklamator, dijuluki Bung.', a: 'soekarno' },
      { d: 'Penemu lampu pijar yang gagal ribuan kali sebelum berhasil.', a: 'thomas alva edison' },
      { d: 'Ilmuwan fisika dengan teori relativitas E=mc².', a: 'albert einstein' },
      { d: 'Nabi terakhir dalam Islam, lahir di Makkah tahun 570 M.', a: 'nabi muhammad' },
      { d: 'Pahlawan nasional wanita dari Aceh yang memimpin perang melawan Belanda.', a: 'cut nyak dhien' },
      { d: 'Karakter fiksi superhero asal Gotham City, manusia kelelawar.', a: 'batman' },
      { d: 'Penulis Harry Potter.', a: 'jk rowling' },
      { d: 'Pendiri Microsoft.', a: 'bill gates' },
      { d: 'Pahlawan emansipasi wanita Indonesia, surat-suratnya dibukukan "Habis Gelap Terbitlah Terang".', a: 'ra kartini' },
      { d: 'Pesepak bola Portugal berjuluk CR7.', a: 'cristiano ronaldo' }
    ]
    const t = pickRandom(TOKOH)
    labSessions.set(`tokoh:${m.jid}`, { game: 'tebakkarakter', jawaban: t.a, expires: Date.now() + TTL })
    return m.reply(`🕵️ *SIAPA AKU?*\n\n${t.d}\n\nKetik jawabanmu... (petunjuk: ${t.a.length} huruf)\n\nBocoran: ${P}bocoran`)
  }),

  lab('bocoran', ['hint', 'petunjuk'], 'Bocoran huruf untuk game "Siapa Aku?"', m => {
    const s = labSessions.get(`tokoh:${m.jid}`)
    if (!s || Date.now() > s.expires) return m.reply('ℹ️ Tidak ada tebak karakter aktif. Mulai: ' + P + 'tebakkarakter')
    const j = s.jawaban
    const tampil = j.split('').map((c, i) => (i % 3 === 0 || c === ' ' ? c : '_')).join(' ')
    return m.reply(`💡 Bocoran: \`${tampil}\` (${j.length} huruf)`)
  }),

  lab('kocoknama', ['acaknama'], 'Acak huruf namamu jadi nickname unik', m => {
    const q = m.q || (m.pushName || 'theryhann')
    const gaya = [
      n => acak(n),
      n => [...n].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''),
      n => n.split('').reverse().join(''),
      n => '★' + n + '★',
      n => n.replace(/[aiueo]/gi, 'x'),
      n => `${n}${Math.floor(Math.random() * 99)}${pickRandom(['ID', 'YT', 'GG', 'OP', 'PRO'])}`
    ]
    return m.reply(`✨ *NICKNAME DARI "${q}"*\n\n${gaya.map((f, i) => `${i + 1}. \`${f(String(q))}\``).join('\n')}\n\nCocok untuk nickname game/username.`)
  }, 'budi'),

  lab('angkahoki2', ['hoki2'], 'Angka & warna hoki acak hari ini', m => {
    const angka = Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 9))
    const warna = pickRandom(['Merah', 'Biru', 'Hijau', 'Kuning', 'Ungu', 'Hitam', 'Putih', 'Oranye', 'Pink'])
    const arah = pickRandom(['Utara', 'Timur', 'Selatan', 'Barat', 'Timur Laut', 'Tenggara', 'Barat Daya', 'Barat Laut'])
    const jam = `${String(6 + Math.floor(Math.random() * 15)).padStart(2, '0')}.${pickRandom(['00', '15', '30', '45'])}`
    return m.reply(`🍀 *HOKI KAMU HARI INI*\n\nAngka : ${angka.join(' · ')}\nWarna : ${warna}\nArah  : ${arah}\nJam   : ${jam}\n\n⚠️ Hiburan saja — jangan dipakai judi!`)
  }),

  lab('guntinggrup', ['rpsgrup'], 'Suit gunting-batu-kertas melawan bot (skor tersimpan)', m => {
    const pilihan = ['batu', 'gunting', 'kertas']
    const user = (m.args[0] || pickRandom(pilihan)).toLowerCase()
    if (!pilihan.includes(user)) return m.reply(`Pilih salah satu: ${pilihan.join(', ')}\nContoh: ${P}guntinggrup batu`)
    const bot = pickRandom(pilihan)
    const emoji = { batu: '✊', gunting: '✌️', kertas: '✋' }
    let hasil, poin = 0
    if (user === bot) { hasil = '🤝 SERI'; poin = 5 }
    else if ((user === 'batu' && bot === 'gunting') || (user === 'gunting' && bot === 'kertas') || (user === 'kertas' && bot === 'batu')) { hasil = '🎉 KAMU MENANG'; poin = 50 }
    else { hasil = '😢 KAMU KALAH'; poin = 0 }
    const bonus = beriHadiah(m, poin, Math.round(poin / 5))
    return m.reply(`✂️ *SUIT GRUP*\n\nKamu : ${emoji[user]} ${user}\nBot  : ${emoji[bot]} ${bot}\n\n${hasil}${bonus}`)
  }, 'batu')
]

/* ---------- benarsalah (dibangun manual karena butuh state) ---------- */
const BS_BANK = [
  { s: 'Matahari adalah sebuah planet.', j: false },
  { s: 'Ibu kota Australia adalah Canberra.', j: true },
  { s: 'Air mendidih pada suhu 100°C di tekanan 1 atm.', j: true },
  { s: 'Gunung Everest terletak di Afrika.', j: false },
  { s: 'Bahasa resmi Brasil adalah Spanyol.', j: false },
  { s: 'Jantung manusia memiliki 4 ruang.', j: true },
  { s: 'Komodo adalah hewan endemik Indonesia.', j: true },
  { s: 'Planet terdekat dari Matahari adalah Venus.', j: false },
  { s: 'Candi Borobudur adalah candi Buddha.', j: true },
  { s: 'Indonesia memiliki 3 zona waktu.', j: true },
  { s: 'Sungai Nil adalah sungai terpanjang di dunia.', j: true },
  { s: 'Manusia dewasa memiliki 206 tulang.', j: true },
  { s: 'Paus adalah ikan.', j: false },
  { s: 'Jakarta terletak di Pulau Jawa.', j: true },
  { s: 'Bulan memancarkan cahayanya sendiri.', j: false }
]
export const benarSalah = {
  command: ['benarsalah', 'kuisbenar', 'truesfalse'],
  category: 'Games',
  description: 'Kuis benar/salah (5 pernyataan)',
  limit: 0,
  cooldown: 2,
  contoh: '1',
  run: m => {
    const daftar = [...BS_BANK].sort(() => Math.random() - 0.5).slice(0, 5)
    return startLab(m, 'benarsalah', { daftar, n: 0, benar: 0 },
      `*✅❌ BENAR ATAU SALAH*\n\nJawab 5 pernyataan dengan \`benar\` atau \`salah\`.\n\n1/5. ${daftar[0].s}`, 180000)
  }
}
gameslabCmds.push(benarSalah)

/* ================================================================== */
/*  CHECKER GAME KHUSUS (dipanggil handlers/message.js)                */
/* ================================================================== */
export function checkLabAnswer (m) {
  const teks = (m.text || '').toLowerCase().trim()
  if (!teks) return null

  /* --- tebak karakter (kunci terpisah) --- */
  const tok = labSessions.get(`tokoh:${m.jid}`)
  if (tok && Date.now() < tok.expires) {
    if (normal(teks) === normal(tok.jawaban) || tok.jawaban.includes(teks) && teks.length > 3) {
      labSessions.delete(`tokoh:${m.jid}`)
      const bonus = beriHadiah(m, 250, 40)
      return menang(m, `🎯 *BENAR!* Jawabannya: *${tok.jawaban}*${bonus}`, 'tebakkarakter')
    }
    return null
  }

  const s = labSessions.get(m.jid)
  if (!s || Date.now() > s.expires) { if (s) labSessions.delete(m.jid); return null }
  if (s.host && s.host !== (m.senderKey || m.sender)) return null

  const sisa = Math.ceil((s.expires - Date.now()) / 1000)

  switch (s.game) {
    /* ---------- HANGMAN ---------- */
    case 'gantungman': {
      const st = s.state
      const tebakan = teks.replace(/[^a-z ]/g, '').trim()
      if (!tebakan) return null
      if (tebakan.length === 1) {
        if (st.huruf.includes(tebakan)) return { type: 'hint', text: `ℹ️ Huruf *${tebakan.toUpperCase()}* sudah pernah ditebak.\n\n\`${st.kata.split('').map(c => (c === ' ' ? '  ' : st.terbuka.includes(c) ? c : '_')).join(' ')}\`\nNyawa: ${'❤️'.repeat(st.nyawa)}` }
        st.huruf.push(tebakan)
        const huruf = st.kata.toUpperCase()
        if (huruf.includes(tebakan.toUpperCase())) {
          st.terbuka.push(tebakan.toUpperCase())
        } else st.nyawa--
        const tampil = huruf.split('').map(c => (c === ' ' ? '  ' : st.terbuka.includes(c) ? c : '_')).join(' ')
        const selesai = !tampil.includes('_')
        if (selesai) {
          labSessions.delete(m.jid)
          const koin = 200 + st.kata.length * 30
          return menang(m, `🎉 *KAMU MENANG!*\n\nKata: *${st.kata}*\nSisa nyawa: ${st.nyawa}${beriHadiah(m, koin, 40 + st.kata.length * 2)}`, 'gantungman')
        }
        if (st.nyawa <= 0) {
          labSessions.delete(m.jid)
          return kalah(m, `☠️ *GAME OVER*\n\nKata rahasia: *${st.kata}*\nNyawa habis.`, 'gantungman')
        }
        labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + TTL })
        return { type: 'hint', text: `${st.terbuka.includes(tebakan.toUpperCase()) ? '✅ Ada!' : '❌ Tidak ada.'}\n\n\`${tampil}\`\nNyawa: ${'❤️'.repeat(st.nyawa)}${'🖤'.repeat(6 - st.nyawa)}\nHuruf dipakai: ${st.huruf.join(' ').toUpperCase()}` }
      }
      // tebak kata penuh
      if (normal(tebakan) === normal(st.kata)) {
        labSessions.delete(m.jid)
        return menang(m, `🎉 *TEPAT!* Kata: *${st.kata}*${beriHadiah(m, 400 + st.kata.length * 20, 60)}`, 'gantungman')
      }
      st.nyawa -= 2
      if (st.nyawa <= 0) { labSessions.delete(m.jid); return kalah(m, `☠️ *GAME OVER*\n\nJawabanmu salah & nyawa habis.\nKata rahasia: *${st.kata}*`, 'gantungman') }
      labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + TTL })
      return { type: 'hint', text: `❌ Bukan itu. Nyawa berkurang 2 → ${'❤️'.repeat(st.nyawa)}` }
    }

    /* ---------- HITUNG CEPAT ---------- */
    case 'hitungcepat': {
      const st = s.state
      const n = Number(teks.replace(/[^\d-]/g, ''))
      if (isNaN(n)) return null
      const tepat = n === st.soal.h
      const jawabanBenar = st.soal.h
      if (tepat) st.benar++
      const lewat = st.n >= st.total
      if (lewat) {
        labSessions.delete(m.jid)
        const waktu = Math.max(0, 180 - Math.round((Date.now() - st.mulai) / 1000))
        const koin = st.benar * 150 + waktu * 2
        return menang(m, `⚡ *SELESAI!*\n\nBenar: *${st.benar}/${st.total}*\nWaktu: ${Math.round((Date.now() - st.mulai) / 1000)} detik\nBonus waktu: ${waktu} poin${beriHadiah(m, koin, st.benar * 25)}`, 'hitungcepat')
      }
      const baru = (() => {
        const op = pickRandom(['+', '-', '×'])
        let a, b, h
        if (op === '+') { a = 10 + Math.floor(Math.random() * 90); b = 10 + Math.floor(Math.random() * 90); h = a + b }
        else if (op === '-') { a = 50 + Math.floor(Math.random() * 100); b = Math.floor(Math.random() * a); h = a - b }
        else { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12); h = a * b }
        return { teks: `${a} ${op} ${b}`, h }
      })()
      st.n++; st.soal = baru
      labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + 60000 })
      return { type: 'hint', text: `${tepat ? '✅ Benar!' : `❌ Salah, jawabannya ${jawabanBenar}`}\n\nSoal ${st.n}/${st.total}:\n\n  ${baru.teks} = ?\n\nSkor sementara: ${st.benar} benar · sisa ${sisa}s` }
    }

    /* ---------- MEMORI ANGKA ---------- */
    case 'memoriangka': {
      const jawab = teks.replace(/\D/g, '')
      labSessions.delete(m.jid)
      if (jawab === s.state.deret) {
        const koin = s.state.deret.length * 80
        return menang(m, `🧠 *SEMPURNA!*\n\nDeret: ${s.state.deret.split('').join(' ')}\nKamu mengingat semua ${s.state.deret.length} digit!${beriHadiah(m, koin, s.state.deret.length * 12)}`, 'memoriangka')
      }
      const benar = [...jawab].filter((c, i) => s.state.deret[i] === c).length
      return kalah(m, `😵 *MELESET*\n\nBenar  : ${s.state.deret.split('').join(' ')}\nKamu   : ${jawab.split('').join(' ') || '(kosong)'}\nCocok  : ${benar}/${s.state.deret.length} posisi`, 'memoriangka')
    }

    /* ---------- KUIS BERUNTUN ---------- */
    case 'kuisberuntun': {
      const st = s.state
      const soal = st.daftar[st.n]
      const jawaban = Array.isArray(soal.a) ? soal.a : [soal.a]
      const benar = jawaban.some(a => normal(teks) === normal(a) || normal(a).includes(normal(teks)) && normal(teks).length > 2)
      if (benar) st.benar++
      if (st.n + 1 >= st.daftar.length) {
        labSessions.delete(m.jid)
        const koin = st.benar * 250
        return menang(m, `📚 *PAKET KUIS SELESAI*\n\nBenar: *${st.benar}/${st.daftar.length}*\nWaktu: ${Math.round((Date.now() - st.mulai) / 1000)} detik\n\nJawaban terakhir: ${jawaban[0]}${beriHadiah(m, koin, st.benar * 30)}`, 'kuisberuntun')
      }
      st.n++
      labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + 120000 })
      return { type: 'hint', text: `${benar ? '✅ Benar!' : `❌ Salah. Jawaban: *${jawaban[0]}*`}\n\nSkor: ${st.benar}/${st.n}\n\nSoal ${st.n + 1}/${st.daftar.length}:\n${st.daftar[st.n].q}` }
    }

    /* ---------- SAMBUNG KATA ---------- */
    case 'sambungkata': {
      const st = s.state
      const kata = teks.replace(/[^a-z ]/g, '').trim()
      if (!kata) return null
      if (kata.length < 3) return { type: 'hint', text: `⚠️ Kata minimal 3 huruf. Harus diawali huruf *${st.huruf.toUpperCase()}*` }
      const awalKata = kata.replace(/\s/g, '')[0]
      if (awalKata !== st.huruf) return { type: 'hint', text: `❌ Kata harus diawali huruf *${st.huruf.toUpperCase()}*.\n\nTerakhir: ${st.terakhir}\nRantai: ${st.rantai.length} kata` }
      if (st.rantai.includes(kata)) return { type: 'hint', text: `⚠️ Kata *${kata}* sudah dipakai. Cari yang lain!` }
      st.rantai.push(kata)
      st.terakhir = kata
      st.huruf = kata.replace(/\s/g, '').slice(-1)
      const bonus = beriHadiah(m, 60, 10)
      if (st.rantai.length >= 8) {
        labSessions.delete(m.jid)
        return menang(m, `🔗 *LUAR BIASA!*\n\nRantai ${st.rantai.length} kata:\n${st.rantai.join(' → ')}${bonus}`, 'sambungkata')
      }
      labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + 60000 })
      return { type: 'hint', text: `✅ *${kata}* diterima! (rantai ke-${st.rantai.length})\n\nSelanjutnya harus diawali huruf *${st.huruf.toUpperCase()}*\nSisa waktu: ${Math.ceil((labSessions.get(m.jid).expires - Date.now()) / 1000)}s` }
    }

    /* ---------- URUTKAN ANGKA ---------- */
    case 'tebakurutan': {
      const nums = teks.split(/[\s,;]+/).filter(Boolean).map(Number)
      if (nums.length !== s.state.angka.length || nums.some(isNaN)) return { type: 'hint', text: `⚠️ Tulis ${s.state.angka.length} angka dipisah spasi.\n\nSoal: ${s.state.angka.join(' · ')}` }
      labSessions.delete(m.jid)
      const cocok = nums.every((n, i) => n === s.state.urut[i])
      return cocok
        ? menang(m, `🔢 *BENAR!*\n\nUrutan: ${s.state.urut.join(' < ')}${beriHadiah(m, 300, 45)}`, 'tebakurutan')
        : kalah(m, `❌ Belum tepat.\n\nJawabanmu: ${nums.join(' < ')}\nSeharusnya: ${s.state.urut.join(' < ')}`, 'tebakurutan')
    }

    /* ---------- BENAR/SALAH ---------- */
    case 'benarsalah': {
      const st = s.state
      const jawab = /^(benar|b|betul|ya|true|y)$/.test(teks) ? true : /^(salah|s|bukan|tidak|false|n)$/.test(teks) ? false : null
      if (jawab === null) return null
      const soal = st.daftar[st.n]
      if (jawab === soal.j) st.benar++
      if (st.n + 1 >= st.daftar.length) {
        labSessions.delete(m.jid)
        const koin = st.benar * 120
        return menang(m, `✅❌ *KUIS SELESAI*\n\nBenar: *${st.benar}/${st.daftar.length}*\n\nPernyataan terakhir: "${soal.s}" → ${soal.j ? 'BENAR' : 'SALAH'}${beriHadiah(m, koin, st.benar * 20)}`, 'benarsalah')
      }
      st.n++
      labSessions.set(m.jid, { ...s, state: st, expires: Date.now() + 120000 })
      return { type: 'hint', text: `${jawab === soal.j ? '✅ Benar!' : `❌ Salah, jawabannya: *${soal.j ? 'BENAR' : 'SALAH'}*`}\n\nSkor: ${st.benar}/${st.n}\n\n${st.n + 1}/5. ${st.daftar[st.n].s}\n\nJawab: \`benar\` atau \`salah\`` }
    }

    default:
      return null
  }
}

export default { gameslabCmds }
