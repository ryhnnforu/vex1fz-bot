/**
 * 🎉 FUNLAB — 50 fitur hiburan (kategori Fun Menu, v6)
 * ------------------------------------------------------------
 *  15 "cek-cek" persentase (deterministik per nama+hari),
 *  8 gaya teks (zalgo, bubble, smallcaps, fullwidth, coret, garis
 *  bawah, superscript, cermin), 10 bank kalimat (gombal programmer,
 *  rayuan, sindiran, ucapan, fakta aneh, pepatah, quotes Inggris,
 *  pantun, jokes bapak-bapak, tebak konyol), 17 fitur acak lainnya
 *  (kalkulator cinta, umur mental, ramal nasib, hari baik, generator
 *  nama/alasan/caption/ide, rolet keputusan, kapsul waktu...).
 *
 *  100% LOKAL — tidak butuh internet, jadi selalu jalan di Termux.
 */
import crypto from 'node:crypto'
import { config } from '../config.js'
import { pickRandom, truncate } from '../lib/functions.js'

const P = config.display.prefix

/* ------------------------- helper ------------------------- */
function hashStr (s) {
  const h = crypto.createHash('sha256').update(String(s)).digest()
  return h.readUInt32BE(0)
}
const hariIni = () => new Date().toISOString().slice(0, 10)
const butuh = (m, contoh) => {
  if (!m.q && !m.quoted?.text) { m.reply(`Butuh input.\nContoh: ${P}${m.command} ${contoh}`); return null }
  return (m.q || m.quoted?.text).trim()
}

/* ------------------------- 15 CEK PERSEN ------------------------- */
const CEK_LIST = [
  ['cekwibu', 'wibu', 'Tingkat kewibuan', '🎌', 'Semakin tinggi semakin sering nonton anime tanpa subtitle'],
  ['cekjagoan', 'jagoan', 'Tingkat kejagoan', '🦸', 'Calon pahlawan di chat ini'],
  ['cekpintar', 'pintar', 'Tingkat kepintaran', '🧠', 'Pintar belum tentu benar, tapi yakin dulu saja'],
  ['ceksabar', 'sabar', 'Tingkat kesabaran', '🧘', 'Sabar itu ilmu tingkat tinggi'],
  ['cekdermawan', 'dermawan', 'Tingkat kedermawanan', '🤲', 'Suka traktir teman?'],
  ['cekegois', 'egois', 'Tingkat keegoisan', '😤', 'Jangan tinggi-tinggi ya'],
  ['cekromantis', 'romantis', 'Tingkat keromantisan', '🌹', 'Bisa bikin baper atau tidak?'],
  ['cekgalau', 'galau', 'Tingkat kegalauan', '🥀', 'Galau boleh, jangan lama-lama'],
  ['cekngantuk', 'ngantuk', 'Tingkat kantuk', '😴', 'Butuh kopi atau tidur?'],
  ['ceklaper', 'laper', 'Tingkat kelaparan', '🍜', 'Waktunya makan belum?'],
  ['cekrajin', 'rajin', 'Tingkat kerajinan', '🐝', 'Rajin pangkal pandai'],
  ['cekberuntung', 'beruntung', 'Tingkat keberuntungan', '🍀', 'Semoga hoki hari ini'],
  ['cekimut', 'imut', 'Tingkat keimutan', '🥰', 'Gemas maksimal'],
  ['cekcool', 'cool', 'Tingkat kecool-an', '😎', 'Dingin tapi asik'],
  ['cekcerewet', 'cerewet', 'Tingkat kecerewetan', '📢', 'Banyak omong di grup']
]

export const cekCmds = CEK_LIST.map(([cmd, label, judul, emoji, catatan]) => ({
  command: [cmd, ...(['pintar', 'rajin', 'wibu'].includes(label) ? [] : [`how${label}`]), `cek${label}ku`],
  category: 'Fun Menu',
  description: judul,
  limit: 0,
  cooldown: 1,
  contoh: 'Budi',
  run: m => {
    const nama = (m.q || m.pushName || 'kamu').trim()
    const persen = (hashStr(nama.toLowerCase() + label + hariIni()) % 101)
    const bar = '█'.repeat(Math.round(persen / 10)) + '░'.repeat(10 - Math.round(persen / 10))
    const predikat = persen >= 90 ? 'LEGENDARIS 🏆' : persen >= 75 ? 'Tinggi banget!' : persen >= 50 ? 'Lumayan' : persen >= 25 ? 'Rendah' : 'Hampir nol 😅'
    return m.reply(`${emoji} *${judul.toUpperCase()}*\n\nNama : ${nama}\nSkor : *${persen}%*\n${bar}\n\n${predikat}\n_${catatan}_\n\n💡 Hasil berubah setiap hari & hanya hiburan.`)
  }
}))

/* ------------------------- 8 GAYA TEKS ------------------------- */
const gayaTeks = (cmd, aliases, desc, ubah, contoh = 'Halo Dunia') => ({
  command: [cmd, ...aliases],
  category: 'Fun Menu',
  description: desc,
  limit: 0,
  cooldown: 1,
  contoh,
  run: m => {
    const q = butuh(m, contoh); if (!q) return
    try { return m.reply(`✨ *${desc}*\n\n${ubah(q)}`) } catch (e) { return m.reply('⚠️ ' + e.message) }
  }
})

const MAP_BUBBLE = 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'
const MAP_SMALL = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'
const MAP_FULL = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'
const MAP_STRIKE = 'a̶b̶c̶d̶e̶f̶g̶h̶i̶j̶k̶l̶m̶n̶o̶p̶q̶r̶s̶t̶u̶v̶w̶x̶y̶z̶'
const MAP_UNDER = 'a̲b̲c̲d̲e̲f̲g̲h̲i̲j̲k̲l̲m̲n̲o̲p̲q̲r̲s̲t̲u̲v̲w̲x̲y̲z̲'
const MAP_SUPER = 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖ۹ʳˢᵗᵘᵛʷˣʸᶻ'
function petaHuruf (teks, peta, offset = 97) {
  return [...teks.toLowerCase()].map(c => {
    const i = c.charCodeAt(0) - offset
    return i >= 0 && i < 26 ? peta[i] : c
  }).join('')
}
const ZALGO = ['̴', '̵', '̶', '̷', '̸', '̡', '̢', '̧', '̨', '̛', '̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '͓', '͔', '͕', '͖', '͙', '͚', '͛', '͜', '͝']

export const gayaCmds = [
  gayaTeks('zalgo', ['tekszalgo', 'glitch'], 'Teks zalgo/glitch', t => {
    if (t.length > 200) return '⚠️ Teks terlalu panjang (maks 200 karakter).'
    return [...t].map(c => c + Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pickRandom(ZALGO)).join('')).join('')
  }),
  gayaTeks('bubbletext', ['teksbubble', 'hurufbulat'], 'Teks huruf bubble (ⓐⓑⓒ)', t => petaHuruf(t, [...MAP_BUBBLE])),
  gayaTeks('smallcaps', ['smallcapteks', 'smallcap'], 'Teks small caps (ᴀʙᴄ)', t => petaHuruf(t, [...MAP_SMALL])),
  gayaTeks('fullwidth', ['tekslebar', 'aesthetic'], 'Teks fullwidth (ａｂｃ)', t => petaHuruf(t, [...MAP_FULL])),
  gayaTeks('coretteks', ['tekscoret', 'strike'], 'Teks tercoret (a̶b̶c̶)', t => petaHuruf(t, [...MAP_STRIKE])),
  gayaTeks('garisbawah', ['teksunderline', 'underline'], 'Teks bergaris bawah (a̲b̲c̲)', t => petaHuruf(t, [...MAP_UNDER])),
  gayaTeks('superscript', ['teksatas', 'superskrip'], 'Teks superscript (ᵃᵇᶜ)', t => petaHuruf(t, [...MAP_SUPER])),
  gayaTeks('mirrorteks', ['tekscermin', 'flip'], 'Teks terbalik (uʍop əpᴉsdn)', t => {
    const FLIP = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z', '?': '¿', '!': '¡', '.': '˙', ',': "'", '(': ')', ')': '(' }
    return [...t.toLowerCase()].map(c => FLIP[c] ?? c).reverse().join('')
  })
]

/* ------------------------- 10 BANK KALIMAT ------------------------- */
const GOMBAL_KODE = [
  'Kamu itu seperti bug di production — muncul tiba-tiba dan bikin aku nggak bisa tidur.',
  'Cintaku ke kamu itu infinite loop, nggak ada break-nya.',
  'Aku rela jadi backend-mu: kerja keras di belakang layar, asal kamu tampil cantik di depan.',
  'Kamu itu seperti CSS: tanpa kamu, hidupku berantakan.',
  'Hatiku ini JavaScript — kadang undefined kalau kamu nggak ada.',
  'Kalau kamu variabel, aku mau jadi const-nya: nggak akan pernah berubah.',
  'Aku nggak butuh Google, karena semua yang kucari ada di kamu.',
  'Kamu itu seperti WiFi gratis: bikin aku betah berlama-lama.',
  'Cinta kita seperti Git — commit terus, jangan pernah reset.',
  'Aku rela debugging seharian, asal error-nya cuma di hatiku karena kamu.'
]
const RAYUAN = [
  'Kamu capek ya? Soalnya dari tadi kamu lari-lari di pikiranku.',
  'Aku nggak tahu cara jadi penyair, tapi sejak kenal kamu, semua kata jadi indah.',
  'Bapak kamu tukang parkir ya? Soalnya kamu berhasil memarkir hatiku.',
  'Kalau kamu jadi hujan, aku rela jadi payung yang bocor — biar basah bareng.',
  'Aku nggak butuh kopi, cukup kamu yang bikin aku melek semalaman.',
  'Kamu itu seperti lagu favorit: diulang-ulang nggak pernah bosan.',
  'Aku rela jadi kasir, asal bisa menghitung senyummu setiap hari.',
  'Sejak kenal kamu, GPS-ku error — semua arah menuju kamu.'
]
const SINDIRAN = [
  'Santai aja, dunia nggak akan kiamat cuma karena kamu telat bales chat.',
  'Hebat ya, sibuk terus... sibuk scroll doang sih.',
  'Nggak apa-apa kalah, yang penting jangan lupa alasan-alasannya.',
  'Kamu itu seperti notifikasi: muncul terus, tapi nggak penting.',
  'Rajin banget ngomentarin hidup orang, hidup sendiri udah beres?',
  'Maaf ya, aku nggak bisa pura-pura setuju terus.',
  'Janji sih gampang, yang susah itu nepatin — bener kan?',
  'Kamu selalu benar... di dunia khayalanmu.'
]
const UCAPAN = [
  ['Selamat pagi', 'Semoga harimu secerah senyummu dan sehangat kopi pertama. ☀️'],
  ['Selamat siang', 'Jangan lupa makan & istirahat sebentar ya. 🍱'],
  ['Selamat sore', 'Waktu terbaik buat bersyukur atas hari ini. 🌇'],
  ['Selamat malam', 'Tidurlah yang nyenyak, besok masih ada harapan baru. 🌙'],
  ['Selamat ulang tahun', 'Semoga panjang umur, sehat, dan semua doa baikmu terkabul. 🎂'],
  ['Selamat wisuda', 'Perjuanganmu terbayar. Ini baru awal dari cerita besar. 🎓'],
  ['Selamat menikah', 'Semoga jadi keluarga yang sakinah, penuh cinta dan sabar. 💍'],
  ['Semoga cepat sembuh', 'Istirahat yang cukup ya, kami tunggu sehatmu. 🤒'],
  ['Selamat atas prestasinya', 'Kerja kerasmu nggak pernah bohong. Bangga! 🏆'],
  ['Turut berduka cita', 'Semoga diberi ketabahan, dan almarhum/almarhumah husnul khatimah. 🕊️']
]
const FAKTA_ANEH = [
  'Madu tidak pernah basi — arkeolog menemukan madu 3000 tahun yang masih bisa dimakan.',
  'Gurita punya 3 jantung dan darahnya berwarna biru.',
  'Pisang secara botani adalah buah beri, sedangkan stroberi bukan.',
  'Sapi punya sahabat dan akan stres kalau dipisahkan dari sahabatnya.',
  'Ada lebih banyak bintang di alam semesta daripada butiran pasir di seluruh pantai Bumi.',
  'Otak manusia memakai sekitar 20% energi tubuh meski beratnya cuma 2%.',
  'Kucing tidak bisa merasakan rasa manis karena gen reseptornya rusak.',
  'Petir bisa memanaskan udara di sekitarnya hingga 5x lebih panas dari permukaan Matahari.',
  'Semut tidak punya paru-paru; mereka bernapas lewat lubang kecil di tubuhnya.',
  'Sidik jari koala sangat mirip manusia sampai bisa mengacaukan TKP.',
  'Air panas bisa membeku lebih cepat daripada air dingin (efek Mpemba).',
  'Hiu sudah ada lebih dulu daripada pohon.'
]
const PEPAATAH = [
  ['Berakit-rakit ke hulu, berenang-renang ke tepian', 'Bersakit-sakit dahulu, bersenang-senang kemudian.'],
  ['Sedikit demi sedikit, lama-lama menjadi bukit', 'Usaha kecil yang konsisten akan jadi hasil besar.'],
  ['Air tenang menghanyutkan', 'Orang pendiam belum tentu tidak berbahaya/berisi.'],
  ['Bagai air di daun talas', 'Orang yang tidak punya pendirian tetap.'],
  ['Berat sama dipikul, ringan sama dijinjing', 'Kerja sama membuat beban terasa ringan.'],
  ['Sambil menyelam minum air', 'Sekali kerja, selesaikan beberapa hal sekaligus.'],
  ['Sepandai-pandainya tupai melompat, sekali waktu jatuh juga', 'Sepintar apa pun orang, bisa salah juga.'],
  ['Ada gula ada semut', 'Di mana ada kesenangan, di situ banyak orang datang.'],
  ['Berguru kepalang ajar, bagai bunga kembang tak jadi', 'Belajar setengah-setengah tidak akan menghasilkan apa-apa.'],
  ['Tak ada rotan, akar pun jadi', 'Kalau tidak ada yang terbaik, yang ada pun dimanfaatkan.']
]
const QUOTES_EN = [
  ['The only way to do great work is to love what you do.', 'Satu-satunya cara melakukan pekerjaan hebat adalah mencintai apa yang kamu kerjakan. — Steve Jobs'],
  ['Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Sukses bukan akhir, gagal bukan mematikan: keberanian melanjutkanlah yang berarti. — Winston Churchill'],
  ['It always seems impossible until it is done.', 'Semuanya terlihat mustahil sampai hal itu selesai. — Nelson Mandela'],
  ['Do not watch the clock. Do what it does: keep going.', 'Jangan hanya melihat jam. Lakukan seperti jam: terus berjalan. — Sam Levenson'],
  ['The best time to plant a tree was 20 years ago. The second best time is now.', 'Waktu terbaik menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang.'],
  ['Be yourself; everyone else is already taken.', 'Jadilah dirimu sendiri; orang lain sudah ada yang jadi. — Oscar Wilde'],
  ['In the middle of difficulty lies opportunity.', 'Di tengah kesulitan terdapat kesempatan. — Albert Einstein'],
  ['What we think, we become.', 'Apa yang kita pikirkan, itulah kita menjadi. — Buddha']
]
const PANTUN_JENAKA = [
  ['Jalan-jalan ke kota Medan\nJangan lupa beli bolu', 'Kalau kamu kebanyakan pikiran\nNanti cepat tumbuh uban lho'],
  ['Burung pipit di atas dahan\nTerbang tinggi ke awan biru', 'Aku ini orangnya sabar\nCuma kadang suka kebablasan'],
  ['Pergi ke pasar beli duku\nPulangnya mampir beli roti', 'Kamu bilang cuma teman\nKok hatiku yang deg-degan sendiri'],
  ['Anak kecil main layangan\nLayangan putus nyangkut di dahan', 'Niatnya mau tidur cepat\nMalah scrolling sampai subuh'],
  ['Makan nasi pakai teri\nMinumnya es kelapa muda', 'Dompet tipis bukan masalah\nYang masalah kalau gaya selangit'],
  ['Bunga melati di taman kota\nHarum semerbak di pagi hari', 'Jangan suka janji-janji\nKalau cuma bikin sakit hati']
]
const JOKES_BAPAK = [
  ['Kenapa ayam kalau berkokok matanya merem?', 'Karena sudah hafal teksnya.'],
  ['Apa bedanya soto sama coto?', 'Soto dari daging sapi, coto dari daging capi.'],
  ['Kenapa zombie suka makan otak?', 'Karena mereka mau pinter.'],
  ['Ikan apa yang bisa terbang?', 'Ikan lele-lawar.'],
  ['Kenapa lampu lalu lintas warnanya tiga?', 'Kalau empat, nanti bingung milihnya.'],
  ['Apa bahasa Inggrisnya "orang ganteng lewat"?', 'Handsome, tapi lewatnya nggak pamit.'],
  ['Sayur apa yang dingin?', 'Kembang cool.'],
  ['Buah apa yang paling rajin?', 'Buah apel pagi.'],
  ['Kenapa air laut asin?', 'Karena ikannya pada berkeringat dikejar nelayan.'],
  ['Hewan apa yang paling kaya?', 'Ber-uang (beruang).']
]
const TEBAK_KONYOL = [
  ['Apa yang naik tapi nggak pernah turun?', 'Umur.'],
  ['Apa yang punya kaki tapi nggak bisa jalan?', 'Meja.'],
  ['Apa yang selalu di depan mata tapi nggak terlihat?', 'Masa depan.'],
  ['Apa yang bertambah banyak kalau dibagi?', 'Ilmu.'],
  ['Apa yang punya gigi tapi nggak bisa menggigit?', 'Sisir.'],
  ['Apa yang bisa dipegang tapi nggak bisa dilihat?', 'Janji.'],
  ['Apa yang kalau dipanggil malah menjauh?', 'Bayangan.'],
  ['Apa yang masuk kering keluar basah?', 'Kantong teh.']
]

const bank = (cmd, aliases, desc, data, emoji, format) => ({
  command: [cmd, ...aliases],
  category: 'Fun Menu',
  description: desc,
  limit: 0,
  cooldown: 1,
  contoh: '1',
  run: m => {
    const item = pickRandom(data)
    return m.reply(`${emoji} *${desc.toUpperCase()}*\n\n${format(item)}`)
  }
})

export const bankCmds = [
  bank('gombalkode', ['gombalprogrammer', 'pickupline'], 'Gombalan ala programmer', GOMBAL_KODE, '💻', t => `"${t}"`),
  bank('rayuanmakan', ['rayuanhalus', 'gombalhalus'], 'Rayuan halus bikin senyum', RAYUAN, '💐', t => `"${t}"`),
  bank('sindiranhalus', ['sindiran', 'nyindir'], 'Sindiran halus untuk teman', SINDIRAN, '🫠', t => `"${t}"`),
  bank('ucapanbagus', ['ucapan', 'kataucapan'], 'Ucapan untuk momen spesial', UCAPAN, '💌', ([j, i]) => `*${j}*\n\n${i}`),
  bank('faktaaneh', ['faktamenarik', 'tahukahkamu'], 'Fakta aneh yang jarang diketahui', FAKTA_ANEH, '🤯', t => `${t}`),
  bank('pepatahlama', ['peribahasa', 'pepatah'], 'Peribahasa + maknanya', PEPAATAH, '📜', ([p, m]) => `_"${p}"_\n\nArtinya: ${m}`),
  bank('quotesinggris', ['katabahasainggris', 'quoteen'], 'Quotes Inggris + terjemahan', QUOTES_EN, '🌎', ([en, id]) => `"${en}"\n\n🇮🇩 ${id}`),
  bank('pantunlucu', ['pantunjenaka', 'pantunkocak'], 'Pantun jenaka', PANTUN_JENAKA, '🎭', ([s, i]) => `${s}\n\n${i}`),
  bank('jokesbapak', ['jokesbapak2', 'bapack'], 'Jokes bapak-bapak', JOKES_BAPAK, '👨', ([q, j]) => `Q: ${q}\nA: *${j}*`),
  bank('tebakkonyol', ['tebakanlucu', 'riddle'], 'Tebakan konyol + jawaban', TEBAK_KONYOL, '❓', ([q, j]) => `${q}\n\nJawaban: ||${j.split('').reverse().join('')}|| (baca terbalik)`)
]

/* ------------------------- 17 FITUR LAIN ------------------------- */
const fun = (cmd, aliases, desc, run, contoh = '1', opt = {}) => ({
  command: [cmd, ...aliases],
  category: 'Fun Menu',
  description: desc,
  limit: 0,
  cooldown: 1,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply('⚠️ ' + truncate(String(e.message || e), 180)) }
  }
})

const NAMA_DEPAN_L = ['Budi', 'Andi', 'Rizky', 'Dimas', 'Fajar', 'Yoga', 'Bayu', 'Gilang', 'Reza', 'Ilham', 'Adit', 'Rangga']
const NAMA_DEPAN_P = ['Sari', 'Dewi', 'Putri', 'Ayu', 'Citra', 'Nadia', 'Rani', 'Fitri', 'Lestari', 'Indah', 'Maya', 'Tasya']
const NAMA_BELAKANG = ['Pratama', 'Wijaya', 'Saputra', 'Nugroho', 'Hidayat', 'Ramadhan', 'Setiawan', 'Kurniawan', 'Anggara', 'Mahendra']

export const funMiscCmds = [
  fun('kapalcinta', ['lovecalc', 'hitungcinta'], 'Kalkulator cinta 2 nama', m => {
    const [a, b] = (m.q || '').split(/[|,&]/).map(x => x.trim()).filter(Boolean)
    if (!a || !b) return m.reply(`Contoh: ${P}kapalcinta Budi | Sari`)
    const skor = hashStr(a.toLowerCase() + '❤' + b.toLowerCase()) % 101
    const bar = '❤️'.repeat(Math.round(skor / 10)) || '💔'
    const vonis = skor >= 85 ? 'Jodoh banget! Buruan halal-kan 😍' : skor >= 65 ? 'Cocok, tinggal komunikasi' : skor >= 45 ? 'Bisa jadi teman dekat dulu' : skor >= 25 ? 'Perlu usaha ekstra' : 'Sepertinya cuma teman 😅'
    return m.reply(`💘 *KALKULATOR CINTA*\n\n${a} ❤️ ${b}\n\nKecocokan: *${skor}%*\n${bar}\n\n${vonis}\n\n_ Hiburan semata, jodoh tetap urusan Tuhan._`)
  }, 'Budi | Sari'),

  fun('hitungkecocokan', ['cocokmeter', 'matchmeter'], 'Kecocokan 2 hal apa saja (nama/hobi/tim)', m => {
    const [a, b] = (m.q || '').split(/[|,&]/).map(x => x.trim()).filter(Boolean)
    if (!a || !b) return m.reply(`Contoh: ${P}hitungkecocokan kopi | teh`)
    const skor = hashStr(a.toLowerCase() + '#' + b.toLowerCase()) % 101
    return m.reply(`🔗 *KECOCOKAN*\n\n${a} ↔ ${b}\n\nSkor: *${skor}%*\n${'▰'.repeat(Math.round(skor / 10))}${'▱'.repeat(10 - Math.round(skor / 10))}\n\n${skor >= 70 ? 'Kombinasi yang bagus! 👌' : skor >= 40 ? 'Lumayan, ada ruang perbaikan.' : 'Kurang cocok sih... 🤔'}`)
  }, 'kopi | teh'),

  fun('umurmental', ['mentalage'], 'Umur mental berdasarkan nama', m => {
    const nama = (m.q || m.pushName || 'kamu').trim()
    const umur = 8 + (hashStr(nama.toLowerCase() + 'mental') % 52)
    const komentar = umur < 15 ? 'Masih playful banget 🎈' : umur < 25 ? 'Jiwa muda, semangat tinggi 🔥' : umur < 40 ? 'Dewasa & stabil 🧘' : umur < 55 ? 'Bijaksana, banyak pengalaman 📚' : 'Jiwa sepuh, penuh ketenangan 🍵'
    return m.reply(`🧠 *UMUR MENTAL*\n\nNama: ${nama}\nUmur mental: *${umur} tahun*\n\n${komentar}\n\n_Hiburan saja ya 😄_`)
  }, 'Budi'),

  fun('ramalnasib', ['nasib', 'ramalan'], 'Ramalan nasib hari ini (hiburan)', m => {
    const nama = (m.q || m.pushName || 'kamu').trim()
    const h = hashStr(nama.toLowerCase() + hariIni() + 'nasib')
    const ASPEK = [
      ['💰 Rezeki', ['Ada rezeki tak terduga', 'Hemat dulu, jangan boros', 'Lancar, cocok buat jualan', 'Biasa saja, tetap bersyukur']],
      ['❤️ Asmara', ['Ada yang memperhatikanmu', 'Jangan baper berlebihan', 'Waktunya ungkapkan perasaan', 'Tenang, fokus diri sendiri dulu']],
      ['💼 Karier', ['Peluang baru muncul', 'Kerjaan menumpuk, sabar', 'Ide kamu akan dihargai', 'Jangan ambil keputusan besar hari ini']],
      ['🩺 Kesehatan', ['Perbanyak minum air', 'Tidur lebih awal ya', 'Cocok buat olahraga ringan', 'Jaga pola makan']],
      ['🍀 Keberuntungan', ['Angka 7 membawa hoki', 'Warna biru menguntungkan', 'Bertemu orang baru = rezeki', 'Jangan lupa sedekah']]
    ]
    return m.reply(`🔮 *RAMALAN HARI INI*\nUntuk: ${nama}\n\n${ASPEK.map(([k, list], i) => `${k}: ${list[Math.abs(h >> (i * 2)) % list.length]}`).join('\n')}\n\n⚠️ Hiburan semata — jangan dijadikan patokan hidup.`)
  }, 'Budi'),

  fun('haribaik', ['haribagus', 'harihoki'], 'Cari hari baik minggu ini dari tanggal lahir (weton)', m => {
    const q = butuh(m, '2000-08-17'); if (!q) return
    const d = new Date(q)
    if (isNaN(d)) return m.reply(`Format tanggal: ${P}haribaik 2000-08-17`)
    const NEPTU = [5, 4, 3, 7, 8, 6, 9] // Minggu..Sabtu
    const base = NEPTU[d.getDay()] + (hashStr(q) % 5)
    const now = new Date()
    const hari = Array.from({ length: 7 }, (_, i) => {
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
      const skor = ((NEPTU[t.getDay()] + base + i) % 9) + 1
      return { t, skor }
    }).sort((a, b) => b.skor - a.skor)
    return m.reply(`📆 *HARI BAIK MINGGU INI*\n(Lahir: ${d.toLocaleDateString('id-ID')})\n\n${hari.map((h, i) => `${i + 1}. ${h.t.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} — skor ${h.skor}/9 ${i === 0 ? '⭐ terbaik' : ''}`).join('\n')}\n\n⚠️ Tradisi/hiburan, bukan kepastian.`)
  }, '2000-08-17'),

  fun('nomercantik', ['nomorhoki2', 'nomorindah'], 'Cari pola nomor cantik/hoki dari nomormu', m => {
    const q = butuh(m, '6281234567890'); if (!q) return
    const angka = q.replace(/\D/g, '')
    const jumlah = [...angka].reduce((a, b) => a + Number(b), 0)
    const angkaJiwa = jumlah % 9 === 0 ? 9 : jumlah % 9
    const pola = []
    if (/(\d)\1{2,}/.test(angka)) pola.push('ada angka kembar 3+')
    if (/0123|1234|2345|3456|4567|5678|6789/.test(angka)) pola.push('ada urutan naik')
    if (/9876|8765|7654|6543|5432|4321/.test(angka)) pola.push('ada urutan turun')
    if ((angka.match(/8/g) || []).length >= 2) pola.push('banyak angka 8 (hoki versi Tionghoa)')
    if ((angka.match(/0/g) || []).length >= 2) pola.push('banyak angka 0 (netral)')
    return m.reply(`🔢 *ANALISIS NOMOR*\n\nNomor: ${angka}\nPanjang: ${angka.length} digit\nJumlah digit: ${jumlah}\nAngka jiwa: *${angkaJiwa}*\n\nPola cantik:\n${pola.length ? pola.map(p => `▸ ✨ ${p}`).join('\n') : '▸ (belum ada pola istimewa)'}\n\n💡 Nomor cantik = mudah diingat, bukan jaminan rezeki.`)
  }, '6281234567890'),

  fun('generatoralasan', ['alasanku', 'excuse'], 'Generator alasan lucu (untuk telat/bolos)', m => {
    const ALASAN = [
      'Maaf telat, tadi ada kucing melahirkan di depan pintu dan aku jadi saksi.',
      'Motor aku mogok, padahal udah aku ajak bicara baik-baik.',
      'Tadi sinyal hilang, jadi chat kamu nyangkut di dimensi lain.',
      'Aku ketiduran karena mimpi lagi ngerjain tugas, saking rajinnya.',
      'Jalan ditutup karena ada pawai, aku nggak mau ikut-ikutan.',
      'HP aku kehabisan baterai tepat saat mau balas, kebetulan yang menyakitkan.',
      'Tadi bantu nenek nyebrang, terus neneknya cerita panjang lebar.',
      'Aku udah siap dari jam 6, cuma bumi berputarnya agak lambat.'
    ]
    return m.reply(`🎭 *ALASAN HARI INI*\n\n"${pickRandom(ALASAN)}"\n\n⚠️ Pakai bijak — bohong tetap nggak baik ya!`)
  }),

  fun('kalimatbucin', ['bucinhari', 'katamabuk'], 'Kalimat bucin siap kirim', m => {
    const KALIMAT = [
      'Aku nggak butuh filter, karena kamu udah bikin duniaku lebih cerah.',
      'Kalau kamu jadi kopi, aku rela jadi gula — biar hidupmu manis terus.',
      'Aku belajar sabar dari nungguin balasan chat kamu.',
      'Kamu itu seperti rumah: sejauh apa pun aku pergi, tetap ingin pulang.',
      'Nggak apa-apa kamu sibuk, asal jangan sibuk mikirin yang lain.',
      'Aku simpan namamu di hati, bukan di story — biar nggak hilang 24 jam.',
      'Dunia boleh ramai, tapi cuma kamu yang bikin aku tenang.',
      'Kalau cinta itu butuh bukti, aku buktikan setiap hari dengan tetap ada.'
    ]
    return m.reply(`💕 *KALIMAT BUCIN*\n\n"${pickRandom(KALIMAT)}"\n\nKirim ke dia sekarang 👀`)
  }),

  fun('generatornama', ['namarandom', 'buatnama'], 'Generator nama Indonesia (cowok/cewek)', m => {
    const tipe = (m.args[0] || 'acak').toLowerCase()
    const jumlah = Math.min(8, Math.max(1, Number(m.args[1] || 5)))
    const buat = () => {
      if (tipe === 'cowok' || tipe === 'l' || tipe === 'male') return `${pickRandom(NAMA_DEPAN_L)} ${pickRandom(NAMA_BELAKANG)}`
      if (tipe === 'cewek' || tipe === 'p' || tipe === 'female') return `${pickRandom(NAMA_DEPAN_P)} ${pickRandom(NAMA_BELAKANG)}`
      return Math.random() < 0.5 ? `${pickRandom(NAMA_DEPAN_L)} ${pickRandom(NAMA_BELAKANG)}` : `${pickRandom(NAMA_DEPAN_P)} ${pickRandom(NAMA_BELAKANG)}`
    }
    return m.reply(`👤 *GENERATOR NAMA* (${tipe})\n\n${Array.from({ length: jumlah }, (_, i) => `${i + 1}. ${buat()}`).join('\n')}\n\nPakai: ${P}generatornama cowok 5`)
  }, 'cowok 5'),

  fun('kapsulkata', ['kapsulwaktu', 'timecapsule'], 'Tulis pesan untuk dirimu di masa depan (tersimpan di DB)', async m => {
    const teks = butuh(m, 'Semoga kamu sudah jadi orang sukses'); if (!teks) return
    const { getUser, saveDB } = await import('../lib/database.js')
    const u = getUser(m.senderKey || m.sender)
    u.kapsul = u.kapsul || []
    u.kapsul.push({ teks: truncate(teks, 400), tgl: Date.now(), buka: Date.now() + 7 * 86400000 })
    if (u.kapsul.length > 10) u.kapsul = u.kapsul.slice(-10)
    saveDB('users')
    return m.reply(`📮 *KAPSUL WAKTU DISIMPAN*\n\n"${truncate(teks, 200)}"\n\nBisa dibuka: ${new Date(u.kapsul.at(-1).buka).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\nTotal kapsul: ${u.kapsul.length}\n\nBuka: ${P}bukakapsul`)
  }, 'Semoga kamu sudah sukses'),

  fun('bukakapsul', ['kapsulku'], 'Buka kapsul waktu yang sudah jatuh tempo', async m => {
    const { getUser } = await import('../lib/database.js')
    const u = getUser(m.senderKey || m.sender)
    const list = u.kapsul || []
    if (!list.length) return m.reply(`ℹ️ Kamu belum punya kapsul waktu.\nBuat: ${P}kapsulkata <pesan>`)
    const siap = list.filter(k => k.buka <= Date.now())
    return m.reply(`📮 *KAPSUL WAKTUMU* (${list.length})\n\n${list.map((k, i) => `${i + 1}. ${k.buka <= Date.now() ? '✅' : '🔒'} "${truncate(k.teks, 120)}"\n   Ditulis: ${new Date(k.tgl).toLocaleDateString('id-ID')} · ${k.buka <= Date.now() ? 'sudah bisa dibuka' : 'buka ' + new Date(k.buka).toLocaleDateString('id-ID')}`).join('\n\n')}\n\n${siap.length ? `\n🎉 ${siap.length} kapsul sudah jatuh tempo — pesan dari dirimu di masa lalu:\n\n"${siap.at(-1).teks}"` : ''}`)
  }),

  fun('roletkeputusan', ['decisionmaker', 'putuskan'], 'Bantu ambil keputusan: bot memilih untukmu', m => {
    const opsi = (m.q || '').split(/[|;,]/).map(x => x.trim()).filter(Boolean)
    if (opsi.length < 2) return m.reply(`Beri minimal 2 pilihan, pisahkan "|".\nContoh: ${P}roletkeputusan nonton | tidur | belajar`)
    const pilih = pickRandom(opsi)
    const alasan = ['Karena alam semesta mendukung', 'Insting bot mengatakan begitu', 'Opsi ini paling rendah risikonya', 'Kadang yang sederhana justru terbaik', 'Sudah tertulis di bintang-bintang', 'Biar nggak nyesel nanti']
    return m.reply(`🎯 *KEPUTUSAN*\n\nPilihan: ${opsi.map((o, i) => o === pilih ? `👉 *${i + 1}. ${o}* ✅` : `   ${i + 1}. ${o}`).join('\n')}\n\nBot memilih: *${pilih}*\nAlasan: ${pickRandom(alasan)}\n\n_${opsi.length} pilihan dipertimbangkan_`)
  }, 'nonton | tidur | belajar'),

  fun('generatorcaption', ['captionig', 'bikincaption'], 'Generator caption sosmed dari kata kunci', m => {
    const q = butuh(m, 'senja di pantai'); if (!q) return
    const pola = [
      t => `${t} — dan hari ini terasa cukup. 🌿`,
      t => `Tidak semua ${t} harus dijelaskan, sebagian cukup dirasakan. ✨`,
      t => `${t.charAt(0).toUpperCase() + t.slice(1)}, terima kasih sudah ada hari ini. 🤍`,
      t => `Definisi bahagia sederhana: ${t}. 😌`,
      t => `Catatan kecil tentang ${t} yang nggak mau aku lupa. 📓`,
      t => `${t} mengajarkan aku untuk pelan-pelan saja. 🍃`
    ]
    const hashtags = q.toLowerCase().split(/\s+/).filter(w => w.length > 2).map(w => '#' + w.replace(/[^a-z0-9]/g, '')).join(' ')
    return m.reply(`📸 *CAPTION SIAP PAKAI*\n\n${pola.map(f => `▸ ${f(q)}`).join('\n\n')}\n\nHashtag: ${hashtags} #moodhariini #dailyvibes\n\nButuh versi AI: ${P}aicaption ${q}`)
  }, 'senja di pantai'),

  fun('generatoride', ['idegiatan', 'bosan'], 'Ide kegiatan saat bosan', m => {
    const IDE = [
      'Belajar 1 skill baru 15 menit (misal: editing foto)',
      'Bersih-bersih galeri HP, hapus 100 foto tidak penting',
      'Masak resep baru dari bahan yang ada di kulkas',
      'Jalan kaki 20 menit tanpa HP, perhatikan sekitar',
      'Tulis 3 hal yang kamu syukuri hari ini',
      'Telepon orang tua atau teman lama yang sudah jarang kabar',
      'Rapikan meja kerja/kamar selama 10 menit',
      'Baca 10 halaman buku yang belum selesai',
      'Bikin playlist lagu mood hari ini',
      'Coba olahraga ringan: push-up 3×10, plank 1 menit',
      'Sedekah kecil-kecilan, misalnya beli dagangan tetangga',
      'Bikin daftar target bulan ini (3 hal saja)'
    ]
    const pilih = [...IDE].sort(() => Math.random() - 0.5).slice(0, 4)
    return m.reply(`💡 *IDE ANTI BOSAN*\n\n${pilih.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\nMau ide lain? Ketik ${P}generatoride lagi.`)
  }),

  fun('acakteman', ['randomteman', 'pasanganteman'], 'Acak pasangan member grup (untuk game/kegiatan)', async m => {
    {
      let peserta = []
      try {
        const meta = await m.sock.groupMetadata(m.jid)
        peserta = (meta?.participants || []).map(p => p.id || p).filter(Boolean)
      } catch { peserta = [] }
      if (peserta.length < 2) return m.reply('⚠️ Fitur ini butuh grup dengan minimal 2 member.')
      const acakList = [...peserta].sort(() => Math.random() - 0.5)
      const pasangan = []
      for (let i = 0; i + 1 < acakList.length && pasangan.length < 6; i += 2) pasangan.push([acakList[i], acakList[i + 1]])
      return m.reply(`🎲 *ACAK PASANGAN*\n\nDari ${peserta.length} member:\n\n${pasangan.map((p, i) => `${i + 1}. @${p[0].split('@')[0]} ↔ @${p[1].split('@')[0]}`).join('\n')}${acakList.length % 2 ? `\n\nSisa (tanpa pasangan): @${acakList.at(-1).split('@')[0]}` : ''}`, { mentions: acakList.slice(0, 13) })
    }
  }, '1', { group: true }),

  fun('moodhari', ['moodku', 'perasaanku'], 'Deteksi mood berdasarkan nama + jam sekarang', m => {
    const nama = (m.q || m.pushName || 'kamu').trim()
    const jam = new Date().getHours()
    const h = hashStr(nama + jam + hariIni() + 'mood') % 8
    const MOOD = [['😄 Senang', 'Mood lagi bagus — manfaatkan buat hal produktif!'], ['😌 Tenang', 'Waktu yang tepat untuk fokus dan refleksi.'], ['😴 Mengantuk', 'Coba jalan sebentar atau minum air dingin.'], ['🔥 Bersemangat', 'Energi penuh! Sikat tugas yang paling berat.'], ['🥲 Sendu', 'Nggak apa-apa, istirahat dulu atau dengerin lagu favorit.'], ['😤 Kesal', 'Tarik napas 4 detik, tahan 4, buang 4. Ulangi 3×.'], ['🤔 Penasaran', 'Otak lagi aktif — coba belajar hal baru.'], ['🫠 Lelah', 'Kurangi layar, tidur lebih awal malam ini.']]
    const [mood, saran] = MOOD[h]
    return m.reply(`🎭 *MOOD HARI INI*\n\nNama: ${nama}\nJam : ${String(jam).padStart(2, '0')}.00\n\nMood: *${mood}*\n\n💬 ${saran}`)
  }, 'Budi'),

  fun('tebakwajah', ['siapadia'], 'Bot memberi ciri-ciri, tebak siapa di grup', m => {
    const CIRI = ['suka pakai emoji 😂', 'paling rajin bales chat malam', 'jarang muncul tapi sekali muncul rame', 'suka kirim stiker', 'admin yang paling sabar', 'paling sering telat janji', 'jago bikin ketawa', 'pendiam tapi sekali ngomong nyelekit']
    return m.reply(`🕵️ *TEBAK SIAPA*\n\nCiri-cirinya: *${pickRandom(CIRI)}*\n\nSiapa di grup ini yang cocok? Tag orangnya ya! 😆`)
  }, '1', { group: true })
]

export const funlabCmds = [...cekCmds, ...gayaCmds, ...bankCmds, ...funMiscCmds]
export default { funlabCmds }
