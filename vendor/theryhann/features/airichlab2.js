/**
 * 🤖 AIRICH LAB 2 (v7) — 12 game lanjutan + 12 utilitas AI Rich
 * ------------------------------------------------------------
 *  Game lanjutan: Trivia, Tebak Angka, Susun Kata, Tebak Emoji, Rantai Kata,
 *  Tebak Harga, Simon (warna), Panahan, Mancing Kilat, RPG Battle, Dungeon
 *  Crawl, Lelang — semuanya AIRichResponseMessage + live edit + pill.
 *
 *  Tiga game di antaranya TERSAMBUNG ke data RPG (u.rpg): battle memakai
 *  ATK/DEF/HP/energi karakter, dungeon memberi loot item sungguhan, lelang
 *  memasukkan barang ke inventory & memotong koin.
 *
 *  Utilitas: menu, bantuan, statistik, leaderboard, tes device, riwayat,
 *  reset, tanya AI (rich), kartu unsur kimia, kartu negara, tabel custom,
 *  dan snippet kode.
 */
import { config } from '../config.js'
import { truncate, pickRandom } from '../lib/functions.js'
import { getUser, saveDB } from '../lib/database.js'
import { elements, countries, surahs, findElement, findCountry } from '../lib/datasets.js'
import { MONSTERS, getRPG, equipBonus, addItem, addMoney, addExp, bar as barRpg } from '../lib/rpg.js'
import {
  daftarGame, mulaiGame, getS, clearLab, refresh, selesai, hadiah,
  bar, acak, rint, fmtKoin, kepala, getStat, semuaStat, newRich, GAMES
} from '../lib/airichgame.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender

/* ================================================================== */
/*  DATASET KECIL (offline, tanpa API)                                 */
/* ================================================================== */
const KATA = ['kucing', 'sekolah', 'komputer', 'jendela', 'pelangi', 'sepakbola', 'kulkas', 'handuk', 'gunung', 'sungai',
  'kamera', 'payung', 'sepeda', 'timbangan', 'kacamata', 'televisi', 'bantal', 'sapu', 'piring', 'gelas',
  'masjid', 'pasar', 'kereta', 'pesawat', 'kapal', 'durian', 'semangka', 'kentang', 'wortel', 'susu']
const EMOJI_TEBAK = [
  ['🦁👑', 'raja singa'], ['🕷️🕸️🦸', 'spiderman'], ['🧊❄️👸', 'frozen'], ['🐠🔍', 'finding nemo'],
  ['🌧️☔🏠', 'hujan di rumah'], ['🍚🍗🥤', 'nasi ayam minum'], ['🚗💨🌃', 'balapan malam'],
  ['👻🏚️', 'rumah hantu'], ['🐒🍌', 'monyet pisang'], ['🌋🔥', 'gunung meletus'],
  ['🧑‍🚀🚀🌕', 'astronot ke bulan'], ['🏝️🌴🧳', 'liburan pantai'], ['🎂🎉🎈', 'ulang tahun'],
  ['📚✏️🏫', 'sekolah'], ['🕌🌙⭐', 'masjid malam'], ['🥘🌶️🔥', 'makanan pedas'],
  ['🐈🐟', 'kucing ikan'], ['⚽🥅🏆', 'juara sepak bola'], ['🎮🕹️👾', 'main game'],
  ['🧕📖', 'mengaji'], ['🌧️⚡🌩️', 'badai petir'], ['🍜🥢', 'mie'], ['🚴🏔️', 'sepeda gunung'],
  ['🎤🎶', 'karaoke'], ['🐘🌳', 'gajah di hutan']
]
const HARGA = [
  ['Beras 5 kg', 65000], ['Minyak goreng 2 L', 34000], ['Telur 1 kg', 28000], ['Gula 1 kg', 15000],
  ['Kopi sachet (10)', 12000], ['Indomie (1 bungkus)', 3500], ['Ayam 1 kg', 38000], ['Daging sapi 1 kg', 135000],
  ['Susu UHT 1 L', 19000], ['Roti tawar', 14000], ['Sabun mandi', 4500], ['Sampo 170 ml', 22000],
  ['Pasta gigi', 11000], ['Bensin Pertalite 1 L', 10000], ['LPG 3 kg', 21000], ['Air mineral 600 ml', 4000],
  ['Smartphone entry-level', 1500000], ['Headphone bluetooth', 250000], ['Sepatu olahraga', 450000], ['Tas ransel', 180000]
]
const SOAL_UMUM = [
  ['Planet terdekat dengan matahari?', ['Merkurius', 'Venus', 'Bumi', 'Mars'], 0],
  ['Ibu kota Jepang?', ['Kyoto', 'Tokyo', 'Osaka', 'Nagoya'], 1],
  ['Hewan mamalia terbesar?', ['Gajah', 'Paus biru', 'Jerapah', 'Badak'], 1],
  ['Berapa sisi pada kubus?', ['4', '6', '8', '12'], 1],
  ['Warna bendera Indonesia bagian atas?', ['Putih', 'Merah', 'Biru', 'Hijau'], 1],
  ['Alat ukur suhu?', ['Barometer', 'Termometer', 'Higrometer', 'Anemometer'], 1],
  ['Gunung tertinggi di Indonesia?', ['Semeru', 'Kerinci', 'Jaya Wijaya', 'Rinjani'], 2],
  ['Mata uang Thailand?', ['Ringgit', 'Baht', 'Dong', 'Peso'], 1],
  ['Jumlah pemain sepak bola per tim?', ['9', '10', '11', '12'], 2],
  ['Organ pernapasan ikan?', ['Paru-paru', 'Insang', 'Kulit', 'Trakea'], 1]
]

/* ================================================================== */
/*  13. 🧠 TRIVIA CAMPURAN (10 soal dinamis)                           */
/* ================================================================== */
function soalTrivia () {
  const out = []
  try {
    const c = pickRandom(countries().filter(x => x.ibu))
    out.push({ soal: `🌍 Ibu kota *${c.id}* adalah?`, opsi: acak([c.ibu, ...acak(countries().filter(x => x.ibu && x.id !== c.id).map(x => x.ibu)).slice(0, 3)]), jawaban: c.ibu })
  } catch {}
  try {
    const e = pickRandom(elements())
    out.push({ soal: `⚗️ Unsur dengan simbol *${e.simbol}* bernama?`, opsi: acak([e.nama, ...acak(elements().filter(x => x.nama !== e.nama).map(x => x.nama)).slice(0, 3)]), jawaban: e.nama })
  } catch {}
  try {
    const s = pickRandom(surahs())
    out.push({ soal: `📖 Surah *${s.nama}* memiliki berapa ayat?`, opsi: acak([String(s.ayat), String(s.ayat + 3), String(Math.max(1, s.ayat - 4)), String(s.ayat + 7)]), jawaban: String(s.ayat) })
  } catch {}
  for (const [soal, opsi, i] of acak(SOAL_UMUM)) out.push({ soal: `❓ ${soal}`, opsi: opsi.slice(), jawaban: opsi[i] })
  return acak(out).slice(0, 10).map(q => ({ ...q, opsi: acak([...new Set(q.opsi.map(String))]).slice(0, 4) })).filter(q => q.opsi.includes(String(q.jawaban)))
}

daftarGame('trivia', {
  nama: '🧠 Trivia AI Rich',
  cmd: 'airichtrivia',
  init: () => ({ daftar: soalTrivia(), idx: 0, benar: 0, streak: 0, terbaik: 0, taruhan: 0 }),
  render: (rich, s, m) => {
    const q = s.daftar[s.idx]
    rich.addText(kepala(m, s, `🧠 *TRIVIA AIRICH*  ·  soal ${s.idx + 1}/${s.daftar.length}`))
    if (!q) return rich.addText('Selesai.')
    rich.addText(q.soal)
    rich.addTable(q.opsi.map((o, i) => [String.fromCharCode(65 + i), o]))
    rich.addText(`✅ ${s.benar} benar · 🔥 streak ${s.streak} · hadiah per soal naik seiring streak`)
  },
  teks: s => { const q = s.daftar[s.idx]; return q ? `🧠 TRIVIA ${s.idx + 1}/${s.daftar.length}\n${q.soal}\n${q.opsi.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join('\n')}\nBenar ${s.benar} · streak ${s.streak}` : 'Selesai.' },
  pill: s => s.daftar[s.idx]?.opsi.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`) || [],
  tip: 'Jawab dengan mengetuk pill. Streak tinggi = hadiah koin lebih besar.',
  async jawab (m, s, low) {
    const q = s.daftar[s.idx]
    if (!q) return false
    let pick = -1
    const huruf = low.match(/^([a-d])\b/)
    if (huruf) pick = huruf[1].charCodeAt(0) - 97
    else pick = q.opsi.findIndex(o => o.toLowerCase() === low || (low.length > 3 && o.toLowerCase().includes(low)))
    if (pick < 0) return false
    const benar = q.opsi[pick] === String(q.jawaban)
    if (benar) { s.benar++; s.streak++; s.terbaik = Math.max(s.terbaik, s.streak) } else s.streak = 0
    s.idx++
    if (s.idx >= s.daftar.length) {
      const koin = s.benar * 150 + s.terbaik * 100
      await refresh(m, s, s.benar >= 7 ? '🔥 Hebat!' : '👍 Lumayan!')
      return selesai(m, s, { judul: `Trivia — ${s.benar}/${s.daftar.length} benar`, hasil: s.benar >= 5 ? 'menang' : 'kalah', skor: s.benar * 100 + s.terbaik * 25, koin, exp: s.benar * 10, teks: `Streak terbaik: ${s.terbaik}` })
    }
    return refresh(m, s, benar ? `✅ Benar! (streak ${s.streak})` : `❌ Salah. Jawaban: *${q.jawaban}*`)
  }
})

/* ================================================================== */
/*  14. 🔢 TEBAK ANGKA 1-100                                           */
/* ================================================================== */
daftarGame('angka', {
  nama: '🔢 Tebak Angka',
  cmd: 'airichangka',
  init: () => ({ rahasia: rint(1, 100), coba: 0, maks: 7, riwayat: [] }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🔢 *TEBAK ANGKA 1-100*'))
    rich.addText(`Kesempatan: *${s.maks - s.coba}* lagi`)
    rich.addTable([['Percobaan', s.riwayat.length ? s.riwayat.join(' · ') : '-']])
  },
  teks: s => `🔢 TEBAK ANGKA 1-100 · sisa ${s.maks - s.coba} kesempatan\n${s.riwayat.join(' · ') || 'belum ada tebakan'}`,
  pill: () => ['25', '50', '75', '10', '90'],
  tip: 'Ketik angka tebakanmu. Bot memberi petunjuk lebih besar/kecil.',
  async jawab (m, s, low) {
    const n = parseInt(low.replace(/\D/g, ''), 10)
    if (!n || n < 1 || n > 100) return false
    s.coba++
    if (n === s.rahasia) {
      const koin = (s.maks - s.coba + 1) * 250
      return selesai(m, s, { judul: `Tebak Angka — benar di percobaan ${s.coba}!`, hasil: 'menang', skor: (s.maks - s.coba + 1) * 100, koin, exp: 30, teks: `Angkanya memang *${s.rahasia}*.` })
    }
    s.riwayat.push(`${n}${n < s.rahasia ? '⬆️' : '⬇️'}`)
    if (s.coba >= s.maks) {
      await refresh(m, s, `😵 Kesempatan habis. Angkanya *${s.rahasia}*.`)
      return selesai(m, s, { judul: 'Tebak Angka — gagal', hasil: 'kalah', skor: s.coba * 10, teks: `Jawaban: ${s.rahasia}` })
    }
    return refresh(m, s, n < s.rahasia ? `⬆️ *${n}* terlalu KECIL.` : `⬇️ *${n}* terlalu BESAR.`)
  }
})

/* ================================================================== */
/*  15. 🔤 SUSUN KATA                                                  */
/* ================================================================== */
daftarGame('susunkata', {
  nama: '🔤 Susun Kata',
  cmd: 'airichsusunkata',
  init: () => {
    const kata = pickRandom(KATA)
    let acakan = acak([...kata]).join('')
    if (acakan === kata) acakan = acak([...kata]).join('')
    return { kata, acakan, coba: 0, maks: 3 }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🔤 *SUSUN KATA*'))
    rich.addText(`Huruf acak: ## ${s.acakan.split('').join(' ')}`)
    rich.addTable([['Panjang', `${s.kata.length} huruf`], ['Kesempatan', `${s.maks - s.coba}`]])
  },
  teks: s => `🔤 SUSUN KATA\nHuruf: ${s.acakan.split(' ').join(' ')}\nPanjang ${s.kata.length} · sisa ${s.maks - s.coba} kesempatan`,
  pill: s => s.acakan.split('').slice(0, 10),
  tip: 'Ketik kata yang benar dari huruf-huruf acak itu.',
  async jawab (m, s, low) {
    const jwb = low.replace(/[^a-z]/g, '')
    if (jwb.length < 3) return false
    s.coba++
    if (jwb === s.kata) {
      const sisa = s.maks - s.coba
      return selesai(m, s, { judul: 'Susun Kata — BENAR!', hasil: 'menang', skor: 100 + sisa * 50, koin: 300 + sisa * 150, exp: 25, teks: `Katanya: *${s.kata}*` })
    }
    if (s.coba >= s.maks) {
      await refresh(m, s, `😵 Kesempatan habis. Jawaban: *${s.kata}*`)
      return selesai(m, s, { judul: 'Susun Kata — gagal', hasil: 'kalah', teks: `Jawaban: ${s.kata}` })
    }
    const posisiBenar = [...jwb].filter((c, i) => s.kata[i] === c).length
    return refresh(m, s, `❌ Bukan itu. Petunjuk: ${posisiBenar} huruf sudah di posisi benar.`)
  }
})

/* ================================================================== */
/*  16. 😀 TEBAK EMOJI                                                 */
/* ================================================================== */
daftarGame('tebakemoji', {
  nama: '😀 Tebak Emoji',
  cmd: 'airichemoji2',
  init: () => ({ daftar: acak(EMOJI_TEBAK).slice(0, 6), idx: 0, benar: 0 }),
  render: (rich, s, m) => {
    const q = s.daftar[s.idx]
    rich.addText(kepala(m, s, `😀 *TEBAK EMOJI*  ·  ${s.idx + 1}/${s.daftar.length}`))
    rich.addText(`## ${q ? q[0] : '✅'}`)
    rich.addText(`✅ Benar: ${s.benar}`)
  },
  teks: s => `😀 TEBAK EMOJI ${s.idx + 1}/${s.daftar.length}\n${s.daftar[s.idx]?.[0] || 'selesai'}\nBenar ${s.benar}`,
  pill: () => ['Lewati'],
  tip: 'Tebak apa yang digambarkan emoji itu (film/benda/aktivitas).',
  async jawab (m, s, low) {
    const q = s.daftar[s.idx]
    if (!q) return false
    if (/lewati|skip|next/.test(low)) { s.riwayat = 'dilewati'; s.idx++; if (s.idx >= s.daftar.length) return selesai(m, s, { judul: `Tebak Emoji — ${s.benar}/${s.daftar.length}`, hasil: s.benar >= 3 ? 'menang' : 'kalah', skor: s.benar * 80, koin: s.benar * 120, exp: s.benar * 8 }); return refresh(m, s, `⏭️ Dilewati. Jawaban: *${q[1]}*`) }
    const kunci = q[1].toLowerCase()
    const kata = kunci.split(' ')
    const cocok = low.replace(/[^a-z ]/g, '').trim()
    const benar = cocok === kunci || kata.every(k => k.length < 3 || cocok.includes(k))
    if (benar) s.benar++
    s.idx++
    if (s.idx >= s.daftar.length) {
      return selesai(m, s, { judul: `Tebak Emoji — ${s.benar}/${s.daftar.length} benar`, hasil: s.benar >= 3 ? 'menang' : 'kalah', skor: s.benar * 80, koin: s.benar * 120 + 100, exp: s.benar * 8, teks: `Jawaban terakhir: ${kunci}` })
    }
    return refresh(m, s, benar ? `✅ Benar! (${kunci})` : `❌ Salah. Jawaban: *${kunci}*`)
  }
})

/* ================================================================== */
/*  17. 🔗 RANTAI KATA (vs bot)                                        */
/* ================================================================== */
daftarGame('rantai', {
  nama: '🔗 Rantai Kata',
  cmd: 'airichrantai',
  init: () => {
    const awal = pickRandom(KATA)
    return { terakhir: awal, dipakai: [awal], giliran: 'kamu', ronde: 0, kataBot: awal }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🔗 *RANTAI KATA*'))
    rich.addText(`Kata terakhir: ## ${s.terakhir}`)
    rich.addTable([['Giliran', s.giliran === 'kamu' ? '👤 kamu' : '🤖 bot'], ['Ronde', String(s.ronde)], ['Harus diawali huruf', `"${s.terakhir.slice(-1).toUpperCase()}"`]])
  },
  teks: s => `🔗 RANTAI KATA\nKata terakhir: ${s.terakhir} (harus mulai huruf "${s.terakhir.slice(-1)}")\nRonde ${s.ronde} · giliran ${s.giliran}`,
  pill: s => acak(KATA.filter(k => k.startsWith(s.terakhir.slice(-1)))).slice(0, 3),
  tip: 'Balas dengan kata yang diawali huruf terakhir kata sebelumnya.',
  async jawab (m, s, low) {
    const kata = low.replace(/[^a-z]/g, '')
    if (kata.length < 3) return false
    if (!kata.startsWith(s.terakhir.slice(-1))) return refresh(m, s, `❌ Harus diawali huruf *${s.terakhir.slice(-1).toUpperCase()}*.`)
    if (s.dipakai.includes(kata)) return refresh(m, s, `❌ Kata *${kata}* sudah dipakai.`)
    s.dipakai.push(kata); s.terakhir = kata; s.ronde++; s.giliran = 'bot'
    const kandidat = KATA.filter(k => k.startsWith(kata.slice(-1)) && !s.dipakai.includes(k))
    if (!kandidat.length) {
      await refresh(m, s, `🤖 Bot tidak punya kata berawalan "${kata.slice(-1)}".`)
      return selesai(m, s, { judul: `Rantai Kata — bot menyerah (ronde ${s.ronde})`, hasil: 'menang', skor: s.ronde * 60, koin: 300 + s.ronde * 80, exp: 20 + s.ronde * 4 })
    }
    const balasan = pickRandom(kandidat)
    s.dipakai.push(balasan); s.terakhir = balasan; s.giliran = 'kamu'
    if (s.ronde >= 8) {
      return selesai(m, s, { judul: 'Rantai Kata — 8 ronde bertahan!', hasil: 'menang', skor: s.ronde * 60, koin: 700, exp: 45, teks: `Rantai: ${s.dipakai.slice(-6).join(' → ')}` })
    }
    return refresh(m, s, `🤖 Bot membalas: *${balasan}* — sekarang giliranmu (awalan "${balasan.slice(-1).toUpperCase()}").`)
  }
})

/* ================================================================== */
/*  18. 💵 TEBAK HARGA                                                 */
/* ================================================================== */
daftarGame('harga', {
  nama: '💵 Tebak Harga',
  cmd: 'airichharga',
  init: () => ({ daftar: acak(HARGA).slice(0, 5), idx: 0, benar: 0, coba: 0 }),
  render: (rich, s, m) => {
    const q = s.daftar[s.idx]
    rich.addText(kepala(m, s, `💵 *TEBAK HARGA*  ·  ${s.idx + 1}/${s.daftar.length}`))
    rich.addText(`Barang: ## 🛒 ${q ? q[0] : '-'}`)
    rich.addTable([['Tebakan terakhir', s.terakhir ? `Rp${fmtKoin(s.terakhir)}` : '-'], ['Status', s.petunjuk || 'tebak harga dalam rupiah'], ['Skor', String(s.benar)]])
  },
  teks: s => `💵 TEBAK HARGA ${s.idx + 1}/${s.daftar.length}\n🛒 ${s.daftar[s.idx]?.[0]}\n${s.petunjuk || 'tebak harga (rupiah)'} · skor ${s.benar}`,
  pill: () => ['10.000', '50.000', '100.000', '200.000'],
  tip: 'Tebak harga barang dalam rupiah. Selisih ≤15% dianggap benar.',
  async jawab (m, s, low) {
    const q = s.daftar[s.idx]
    if (!q) return false
    const n = parseInt(low.replace(/[^\d]/g, ''), 10)
    if (!n || n < 500) return false
    s.coba++
    s.terakhir = n
    const selisih = Math.abs(n - q[1]) / q[1]
    if (selisih <= 0.15) {
      s.benar++; s.petunjuk = `✅ benar (Rp${fmtKoin(q[1])})`
      s.idx++
      if (s.idx >= s.daftar.length) return selesai(m, s, { judul: `Tebak Harga — ${s.benar}/${s.daftar.length}`, hasil: s.benar >= 3 ? 'menang' : 'kalah', skor: s.benar * 120, koin: s.benar * 200, exp: s.benar * 10 })
      return refresh(m, s, `✅ Tepat! Harga ${q[0]} = Rp${fmtKoin(q[1])}.`)
    }
    if (s.coba >= 12) {
      await refresh(m, s, `😵 Kebanyakan nebak. Harga ${q[0]} = Rp${fmtKoin(q[1])}.`)
      return selesai(m, s, { judul: `Tebak Harga — ${s.benar}/${s.daftar.length}`, hasil: 'kalah', skor: s.benar * 100 })
    }
    s.petunjuk = n < q[1] ? '⬆️ lebih mahal dari itu' : '⬇️ lebih murah dari itu'
    return refresh(m, s, n < q[1] ? `⬆️ Rp${fmtKoin(n)} terlalu MURAH.` : `⬇️ Rp${fmtKoin(n)} terlalu MAHAL.`)
  }
})

/* ================================================================== */
/*  19. 🎨 SIMON (ingat urutan warna)                                  */
/* ================================================================== */
const WARNA = [['🔴', 'merah'], ['🟢', 'hijau'], ['🔵', 'biru'], ['🟡', 'kuning']]
daftarGame('simon', {
  nama: '🎨 Simon Warna',
  cmd: 'airichsimon',
  init: () => ({ urutan: [rint(0, 3)], langkah: 0, level: 1 }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🎨 *SIMON*  ·  level ${s.level}`))
    rich.addText(`Urutan: ## ${s.urutan.map(i => WARNA[i][0]).join(' ')}`)
    rich.addTable([['Panjang urutan', String(s.urutan.length)], ['Progres', `${s.langkah}/${s.urutan.length}`]])
  },
  teks: s => `🎨 SIMON level ${s.level}\nUrutan: ${s.urutan.map(i => WARNA[i][0]).join(' ')}\nProgres ${s.langkah}/${s.urutan.length}`,
  pill: () => WARNA.map(w => `${w[0]} ${w[1]}`),
  tip: 'Ulangi urutan warna dengan mengetuknya satu per satu. Tiap level tambah 1 warna.',
  async jawab (m, s, low) {
    const idx = WARNA.findIndex(w => low.includes(w[1]) || low.includes(w[0]))
    if (idx < 0) return false
    if (idx !== s.urutan[s.langkah]) {
      await refresh(m, s, `❌ Salah! Urutan benar: ${s.urutan.map(i => WARNA[i][0]).join(' ')}`)
      return selesai(m, s, { judul: `Simon — gugur di level ${s.level}`, hasil: s.level > 2 ? 'menang' : 'kalah', skor: (s.level - 1) * 100, koin: (s.level - 1) * 200, exp: (s.level - 1) * 12 })
    }
    s.langkah++
    if (s.langkah < s.urutan.length) return refresh(m, s, `✅ ${WARNA[idx][0]} benar (${s.langkah}/${s.urutan.length}).`)
    s.level++; s.urutan.push(rint(0, 3)); s.langkah = 0
    if (s.level > 8) {
      return selesai(m, s, { judul: 'Simon — level 8 tamat!', hasil: 'menang', skor: 800, koin: 2000, exp: 90, teks: 'Ingatanmu luar biasa 🔥' })
    }
    return refresh(m, s, `🎉 Level ${s.level}! Urutan bertambah: ${s.urutan.map(i => WARNA[i][0]).join(' ')}`)
  }
})

/* ================================================================== */
/*  20. 🏹 PANAHAN                                                     */
/* ================================================================== */
daftarGame('panah', {
  nama: '🏹 Panahan',
  cmd: 'airichpanah',
  init: () => ({ anak: 5, skor: 0, angin: rint(-2, 2), detail: [] }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🏹 *PANAHAN*  ·  sisa ${s.anak} anak panah`))
    rich.addTable([['🎯 Target', 'jarak 30 m'], ['💨 Angin', `${s.angin > 0 ? '→' : s.angin < 0 ? '←' : '—'} ${Math.abs(s.angin)}`], ['Skor', String(s.skor)]])
    if (s.detail.length) rich.addText(s.detail.slice(0, 4).join('\n'))
  },
  teks: s => `🏹 PANAHAN — sisa ${s.anak} panah, angin ${s.angin}, skor ${s.skor}\n${s.detail.slice(0, 4).join('\n')}`,
  pill: () => ['⬆️ Tinggi', '🎯 Tengah', '⬇️ Rendah'],
  tip: 'Pilih ketinggian bidikan. Angin memengaruhi hasil — sesuaikan!',
  async jawab (m, s, low) {
    const arah = /tinggi|⬆|atas/.test(low) ? 2 : /tengah|🎯|sedang/.test(low) ? 1 : /rendah|⬇|bawah/.test(low) ? 0 : -1
    if (arah < 0) return false
    const target = rint(0, 2)
    const geser = s.angin > 0 ? 1 : s.angin < 0 ? -1 : 0
    const kena = Math.abs((arah + geser) - target)
    const poin = kena === 0 ? 10 : kena === 1 ? 5 : 0
    s.skor += poin; s.anak--
    s.detail.unshift(`🏹 bidik ${['⬇️', '🎯', '⬆️'][arah]} → target ${['⬇️', '🎯', '⬆️'][target]} = ${poin} poin`)
    s.angin = rint(-2, 2)
    if (s.anak <= 0) {
      await refresh(m, s, '🏁 Anak panah habis.')
      const max = 50
      return selesai(m, s, { judul: `Panahan — ${s.skor}/${max} poin`, hasil: s.skor >= 30 ? 'menang' : 'kalah', skor: s.skor * 10, koin: s.skor * 60, exp: Math.floor(s.skor * 1.5), teks: s.detail.join('\n') })
    }
    return refresh(m, s, poin ? `🎯 Kena! +${poin} poin.` : '💨 Meleset.')
  }
})

/* ================================================================== */
/*  21. 🎣 MANCING KILAT (timing, hadiah item RPG)                     */
/* ================================================================== */
const IKAN = [['🐟 Ikan teri', 'ikan', 1], ['🐠 Ikan nila', 'ikan', 2], ['🐡 Buntal', 'ikan', 3], ['🦈 Hiu kecil', 'sisik', 1], ['👢 Sepatu bekas', null, 0]]
daftarGame('mancing', {
  nama: '🎣 Mancing Kilat',
  cmd: 'airichmancing',
  init: m => {
    const s = { gigit: 0, dapat: [], ronde: 0, maks: 3 }
    const jeda = rint(2500, 6000)
    setTimeout(async () => {
      const cur = getS(m.jid)
      if (!cur || cur.kind !== 'mancing' || cur.gigit) return
      cur.gigit = Date.now()
      await refresh(m, cur, '🐟 *IKAN MENGGIGIT! TARIK SEKARANG!*').catch(() => {})
    }, jeda)
    return s
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🎣 *MANCING KILAT*  ·  ronde ${s.ronde + 1}/${s.maks}`))
    rich.addText(s.gigit ? '## 🟢 TARIK!' : '## 🔴 Tunggu ikan menggigit...')
    rich.addTable([['Tangkapan', s.dapat.length ? s.dapat.join(', ') : '-']])
  },
  teks: s => `🎣 MANCING KILAT ronde ${s.ronde + 1}/${s.maks} — ${s.gigit ? 'TARIK SEKARANG!' : 'tunggu...'}\nTangkapan: ${s.dapat.join(', ') || '-'}`,
  pill: () => ['🎣 TARIK!'],
  tip: 'Tunggu pesan berubah jadi 🟢 lalu ketuk TARIK. Cepat = dapat ikan bagus.',
  async jawab (m, s, low) {
    if (!/tarik|🎣|pull|gigit/.test(low)) return false
    if (!s.gigit) {
      const jeda = rint(2500, 6000)
      setTimeout(async () => {
        const cur = getS(m.jid)
        if (!cur || cur.kind !== 'mancing' || cur.gigit) return
        cur.gigit = Date.now()
        await refresh(m, cur, '🐟 *IKAN MENGGIGIT! TARIK SEKARANG!*').catch(() => {})
      }, jeda)
      return refresh(m, s, '❌ Terlalu cepat, ikannya kabur. Tunggu 🟢.')
    }
    const ms = Date.now() - s.gigit
    const [nama, item, qty] = ms < 1500 ? IKAN[rint(0, 1)] : ms < 3000 ? IKAN[rint(1, 2)] : IKAN[rint(2, 4)]
    s.dapat.push(nama)
    if (item) { try { addItem(K(m), item, qty) } catch {} }
    s.ronde++; s.gigit = 0
    if (s.ronde >= s.maks) {
      await refresh(m, s, '🏁 Selesai memancing.')
      return selesai(m, s, { judul: `Mancing Kilat — ${s.dapat.length} tangkapan`, hasil: 'menang', skor: s.dapat.length * 50, koin: 250 * s.dapat.length, exp: 30, teks: `Dapat: ${s.dapat.join(', ')} (item masuk inventory RPG)` })
    }
    const jeda = rint(2500, 6000)
    setTimeout(async () => {
      const cur = getS(m.jid)
      if (!cur || cur.kind !== 'mancing' || cur.gigit) return
      cur.gigit = Date.now()
      await refresh(m, cur, '🐟 *IKAN MENGGIGIT! TARIK SEKARANG!*').catch(() => {})
    }, jeda)
    return refresh(m, s, `✅ Dapat ${nama} (${ms} ms)! Ronde berikutnya...`)
  }
})

/* ================================================================== */
/*  22. ⚔️ RPG BATTLE (tersambung data RPG)                            */
/* ================================================================== */
const statRpg = m => {
  const r = getRPG(K(m))
  let atkW = 0, defA = 0
  try { atkW = equipBonus(K(m), 'weapon') } catch {}
  try { defA = equipBonus(K(m), 'armor') } catch {}
  return {
    r,
    atk: Math.round((10 + r.level * 3) * (1 + atkW)),
    def: Math.round((5 + r.level * 2) * (1 + defA)),
    luk: 1 + (r.pet?.level || 0) * 0.01
  }
}
daftarGame('battle', {
  nama: '⚔️ RPG Battle',
  cmd: 'airichbattle',
  init: (m, opt) => {
    const st = statRpg(m)
    const idx = parseInt(opt.args?.[0], 10)
    const mon = (idx >= 0 && MONSTERS[idx]) ? MONSTERS[idx] : pickRandom(MONSTERS.filter(x => x.minLevel <= st.r.level) || MONSTERS)
    const skala = 1 + (mon.minLevel || 1) * 0.15
    return {
      nama: mon.name || mon.nama, icon: mon.icon || '👹',
      hpMon: Math.round((mon.hp || 60) * skala), hpMax: Math.round((mon.hp || 60) * skala),
      atkMon: Math.round((mon.attack || mon.atk || 12) * skala), defMon: Math.round((mon.defense || mon.def || 4) * skala),
      expMon: mon.exp || 40, moneyMon: mon.money || 200,
      hpKu: st.r.health, atk: st.atk, def: st.def, luk: st.luk, ronde: 1, log: [], bertahan: false
    }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `⚔️ *RPG BATTLE* — ronde ${s.ronde}`))
    rich.addTable([
      [`${s.icon} ${s.nama}`, `❤️ ${s.hpMon}/${s.hpMax}`, bar(s.hpMon, s.hpMax)],
      ['👤 Kamu', `❤️ ${Math.max(0, s.hpKu)}`, bar(Math.max(0, s.hpKu), getRPG(K(m)).maxHealth)],
      ['Statistik', `⚔️ ${s.atk} · 🛡️ ${s.def} · 🍀 ${s.luk.toFixed(2)}`, `musuh ⚔️ ${s.atkMon} 🛡️ ${s.defMon}`]
    ])
    if (s.log.length) rich.addText(s.log.slice(0, 4).join('\n'))
  },
  teks: s => `⚔️ RPG BATTLE ronde ${s.ronde}\n${s.icon} ${s.nama}: HP ${s.hpMon}/${s.hpMax}\n👤 Kamu: HP ${Math.max(0, s.hpKu)}\n${s.log.slice(0, 3).join('\n')}`,
  pill: () => ['⚔️ Serang', '🛡️ Bertahan', '🧪 Ramuan', '🏃 Kabur'],
  tip: 'Battle ini memakai HP & statistik RPG kamu (tersambung .rpg).',
  async jawab (m, s, low) {
    const aksi = /serang|⚔|attack/.test(low) ? 'serang' : /bertahan|🛡|defend|tahan/.test(low) ? 'tahan'
      : /ramuan|🧪|potion|heal/.test(low) ? 'heal' : /kabur|🏃|lari|run/.test(low) ? 'kabur' : null
    if (!aksi) return false
    const r = getRPG(K(m))
    if (aksi === 'kabur') {
      s.log.unshift('🏃 Kamu kabur dari pertarungan.')
      r.health = Math.max(1, s.hpKu); saveDB('users')
      return selesai(m, s, { judul: 'RPG Battle — kabur', hasil: 'seri', teks: 'Kamu selamat, tanpa hadiah.' })
    }
    if (aksi === 'heal') {
      const punya = (r.inventory?.ramuan || 0) + (r.inventory?.ramuanbesar || 0)
      if (!punya) { return refresh(m, s, '❌ Tidak punya ramuan. Beli: ' + P + 'tokoramuan') }
      const jenis = r.inventory?.ramuanbesar ? 'ramuanbesar' : 'ramuan'
      r.inventory[jenis]--; if (r.inventory[jenis] <= 0) delete r.inventory[jenis]
      const pulih = jenis === 'ramuanbesar' ? 120 : 60
      s.hpKu = Math.min(r.maxHealth, s.hpKu + pulih); saveDB('users')
      s.log.unshift(`🧪 Minum ${jenis} → +${pulih} HP`)
    } else if (aksi === 'tahan') {
      s.bertahan = true
      s.log.unshift('🛡️ Kamu memasang kuda-kuda bertahan (damage -60%).')
    } else {
      const crit = Math.random() < 0.12 * s.luk
      let dmg = Math.max(3, Math.round(s.atk * (0.85 + Math.random() * 0.4) - s.defMon * 0.5))
      if (crit) dmg = Math.round(dmg * 1.8)
      s.hpMon -= dmg
      s.log.unshift(`⚔️ Kamu menyerang ${crit ? '*CRIT*' : ''} → -${dmg} HP`)
      if (s.hpMon <= 0) {
        r.health = Math.max(1, s.hpKu); saveDB('users')
        const koin = Math.round(s.moneyMon * s.luk)
        const exp = Math.round(s.expMon * s.luk)
        r.kills = (r.kills || 0) + 1; saveDB('users')
        await refresh(m, s, `💀 *${s.nama}* tumbang!`)
        return selesai(m, s, { judul: `RPG Battle — ${s.nama} dikalahkan!`, hasil: 'menang', skor: s.ronde * 50, koin, exp, teks: `Selesai dalam ${s.ronde} ronde. HP tersisa ${Math.max(1, s.hpKu)}/${r.maxHealth}.` })
      }
    }
    // giliran musuh
    let dmgM = Math.max(2, Math.round(s.atkMon * (0.8 + Math.random() * 0.5) - s.def * 0.4))
    if (s.bertahan) { dmgM = Math.round(dmgM * 0.4); s.bertahan = false }
    s.hpKu -= dmgM
    s.log.unshift(`${s.icon} ${s.nama} menyerang → -${dmgM} HP`)
    s.ronde++
    if (s.hpKu <= 0) {
      r.health = 1; r.energy = Math.max(0, (r.energy || 0) - 10); saveDB('users')
      await refresh(m, s, '💀 Kamu kalah...')
      return selesai(m, s, { judul: 'RPG Battle — kalah', hasil: 'kalah', teks: `HP habis di ronde ${s.ronde}. HP dipulihkan jadi 1, energi -10.` })
    }
    r.health = Math.max(1, Math.round(s.hpKu)); saveDB('users')
    return refresh(m, s, '')
  }
})

/* ================================================================== */
/*  23. 🏰 DUNGEON CRAWL (loot item RPG sungguhan)                     */
/* ================================================================== */
const RUANG = ['🚪 Lorong gelap', '🕸️ Ruang laba-laba', '💎 Gudang kristal', '🔥 Ruang api', '🗝️ Pintu boss']
daftarGame('dungeon', {
  nama: '🏰 Dungeon Crawl',
  cmd: 'airichdungeon',
  init: m => {
    const st = statRpg(m)
    return { ruang: 0, hp: st.r.health, atk: st.atk, def: st.def, loot: [], koin: 0, exp: 0, log: [], maks: 5 }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🏰 *DUNGEON CRAWL*  ·  ruang ${s.ruang + 1}/${s.maks}`))
    rich.addTable([
      ['Ruangan', RUANG[s.ruang] || '🏁'],
      ['❤️ HP', `${Math.max(0, s.hp)} ${bar(Math.max(0, s.hp), getRPG(K(m)).maxHealth)}`],
      ['Loot', s.loot.length ? s.loot.join(', ') : '-'],
      ['💰 / ✨', `${fmtKoin(s.koin)} / ${s.exp}`]
    ])
    if (s.log.length) rich.addText(s.log.slice(0, 4).join('\n'))
  },
  teks: s => `🏰 DUNGEON ruang ${s.ruang + 1}/${s.maks} (${RUANG[s.ruang] || 'selesai'})\nHP ${Math.max(0, s.hp)} · loot ${s.loot.join(', ') || '-'} · 💰${fmtKoin(s.koin)} ✨${s.exp}\n${s.log.slice(0, 3).join('\n')}`,
  pill: () => ['⬅️ Jalan kiri', '➡️ Jalan kanan', '🏃 Keluar dungeon'],
  tip: 'Tiap ruang bisa berisi monster, harta, atau jebakan. HP habis = gagal.',
  async jawab (m, s, low) {
    if (/keluar|🏃|pulang|exit/.test(low)) {
      if (s.koin) hadiah(m, s.koin, s.exp)
      for (const l of s.loot) { try { addItem(K(m), l, 1) } catch {} }
      getRPG(K(m)).health = Math.max(1, s.hp); saveDB('users')
      return selesai(m, s, { judul: 'Dungeon — keluar dengan selamat', hasil: s.koin > 0 ? 'menang' : 'seri', skor: s.ruang * 40, koin: 0, exp: 0, teks: `Loot dibawa pulang: ${s.loot.join(', ') || '-'}` })
    }
    const arah = /kiri|⬅|left/.test(low) ? 'kiri' : /kanan|➡|right/.test(low) ? 'kanan' : null
    if (!arah) return false
    const undian = Math.random()
    if (s.ruang === s.maks - 1) {
      // ruang boss
      const bossHp = 60 + s.ruang * 20
      const dmg = Math.max(10, s.atk * 2 - s.def)
      if (dmg >= bossHp * 0.6) {
        s.koin += 3000; s.exp += 400; s.loot.push('kuncidungeon')
        s.log.unshift(`🗝️ Boss tumbang! +3.000 koin, +400 EXP, dapat kunci dungeon`)
        s.ruang++
      } else {
        s.hp -= Math.round(bossHp * 0.4)
        s.log.unshift(`😈 Boss memukul balik! -${Math.round(bossHp * 0.4)} HP`)
        s.ruang++
      }
    } else if (undian < 0.45) {
      const dmgMusuh = rint(5, 15) + s.ruang * 3
      const dmg = Math.max(2, Math.round(dmgMusuh - s.def * 0.3))
      s.hp -= dmg
      const balas = Math.max(5, Math.round(s.atk - dmgMusuh * 0.2))
      s.koin += balas * 5; s.exp += balas
      s.log.unshift(`👹 Monster di ${arah}! Kamu -${dmg} HP, mengalahkan → +${fmtKoin(balas * 5)} koin`)
      s.ruang++
    } else if (undian < 0.75) {
      const item = pickRandom(['besi', 'kayu', 'batu', 'emas', 'ramuan'])
      s.loot.push(item)
      s.koin += rint(100, 500)
      s.log.unshift(`💎 Peti harta di ${arah}! Dapat ${item} + koin`)
      s.ruang++
    } else {
      const jebakan = rint(3, 12)
      s.hp -= jebakan
      s.log.unshift(`🪤 Jebakan di ${arah}! -${jebakan} HP`)
      s.ruang++
    }
    if (s.hp <= 0) {
      getRPG(K(m)).health = 1; saveDB('users')
      await refresh(m, s, '💀 HP habis di dalam dungeon...')
      return selesai(m, s, { judul: 'Dungeon — gugur', hasil: 'kalah', skor: s.ruang * 30, teks: 'Loot hilang. HP dipulihkan jadi 1.' })
    }
    if (s.ruang >= s.maks) {
      hadiah(m, s.koin, s.exp)
      for (const l of s.loot) { try { addItem(K(m), l, 1) } catch {} }
      getRPG(K(m)).health = Math.max(1, s.hp); saveDB('users')
      await refresh(m, s, '🏁 Dungeon selesai!')
      return selesai(m, s, { judul: 'Dungeon Crawl — TAMAT!', hasil: 'menang', skor: 300 + s.koin / 10, koin: 0, exp: 0, teks: `💰 ${fmtKoin(s.koin)} + ✨ ${s.exp} EXP sudah masuk.\nLoot: ${s.loot.join(', ') || '-'} (masuk inventory)` })
    }
    return refresh(m, s, '')
  }
})

/* ================================================================== */
/*  24. 🏷️ LELANG (item masuk inventory RPG)                          */
/* ================================================================== */
const ITEM_LELANG = [['pedangemas', 9000], ['armoremas', 12000], ['telurpet', 3500], ['ramuanbesar', 900], ['kuncidungeon', 2200], ['peta', 1800], ['berlian', 6000]]
daftarGame('lelang', {
  nama: '🏷️ Lelang',
  cmd: 'airichlelang',
  init: (m, opt) => {
    const [item, dasar] = pickRandom(ITEM_LELANG)
    return { item, dasar, harga: dasar, npc: dasar, ronde: 0, maks: 6, log: [], ikut: false }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🏷️ *LELANG AIRICH*  ·  ronde ${s.ronde}/${s.maks}`))
    rich.addTable([
      ['Barang', s.item],
      ['Harga dasar', fmtKoin(s.dasar)],
      ['Penawaran tertinggi', `${fmtKoin(s.harga)} ${s.pemegang === 'kamu' ? '(👤 kamu)' : '(🤖 NPC)'}`]
    ])
    if (s.log.length) rich.addText(s.log.slice(0, 4).join('\n'))
  },
  teks: s => `🏷️ LELANG ${s.item}\nDasar ${fmtKoin(s.dasar)} · tertinggi ${fmtKoin(s.harga)} ${s.pemegang === 'kamu' ? '(kamu)' : '(NPC)'}\nRonde ${s.ronde}/${s.maks}`,
  pill: s => [`💰 Tawar ${fmtKoin(Math.round(s.harga * 1.15))}`, `💰 Tawar ${fmtKoin(Math.round(s.harga * 1.4))}`, '✅ Diam (lewati)'],
  tip: 'Tawar lebih tinggi dari penawaran sekarang. Lelang ditutup setelah 6 ronde atau 2× diam beruntun.',
  async jawab (m, s, low) {
    if (/diam|lewat|pass|skip|✅/.test(low)) {
      s.diam = (s.diam || 0) + 1
      s.ronde++
      if (s.diam >= 2 || s.ronde >= s.maks) return tutupLelang(m, s)
      return refresh(m, s, '🤐 Kamu diam. NPC menunggu...')
    }
    const n = parseInt(low.replace(/[^\d]/g, ''), 10)
    if (!n) return false
    if (n <= s.harga) return refresh(m, s, `❌ Tawaran harus lebih dari ${fmtKoin(s.harga)}.`)
    const r = getRPG(K(m))
    if (n > (r.money || 0)) return refresh(m, s, `❌ Koin kurang: punya ${fmtKoin(r.money)}.`)
    s.harga = n; s.pemegang = 'kamu'; s.ikut = true; s.diam = 0; s.ronde++
    s.log.unshift(`👤 Kamu menawar ${fmtKoin(n)}`)
    // NPC bisa menaikkan
    if (Math.random() < 0.55 && s.ronde < s.maks) {
      const naik = Math.round(s.harga * (1.05 + Math.random() * 0.12))
      if (naik <= s.dasar * 2.2) {
        s.harga = naik; s.pemegang = 'npc'
        s.log.unshift(`🤖 NPC menawar ${fmtKoin(naik)}`)
      }
    }
    if (s.ronde >= s.maks) return tutupLelang(m, s)
    return refresh(m, s, '')
  }
})
async function tutupLelang (m, s) {
  if (s.pemegang === 'kamu' && s.ikut) {
    const r = getRPG(K(m))
    r.money = Math.max(0, (r.money || 0) - s.harga)
    try { addItem(K(m), s.item, 1) } catch {}
    saveDB('users')
    await refresh(m, s, `🔨 *TERJUAL!* ${s.item} jadi milikmu.`)
    return selesai(m, s, { judul: `Lelang — menang: ${s.item}`, hasil: 'menang', skor: Math.max(0, Math.round(s.dasar * 2 - s.harga)), exp: 20, teks: `Kamu bayar ${fmtKoin(s.harga)} koin. Item masuk inventory (.inv).` })
  }
  await refresh(m, s, '🔨 Palu jatuh ke NPC.')
  return selesai(m, s, { judul: 'Lelang — tidak dapat barang', hasil: 'kalah', teks: 'Coba tawar lebih agresif ronde depan.' })
}

/* ================================================================== */
/*  PLUGIN: 12 GAME LANJUTAN                                           */
/* ================================================================== */
const ag = (cmd, aliases, desc, kind, contoh = '') => ({
  command: [cmd, ...aliases],
  category: 'Games',
  description: desc,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    try { return await mulaiGame(m, kind, { args: m.args, q: m.q }) }
    catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 180)}`) }
  }
})

export const airichLabGames2 = [
  ag('airichtrivia', ['triviaairich', 'airichquiz2', 'kuisairich2'], '🧠 Trivia campuran (negara/kimia/surah/umum) via AI Rich', 'trivia'),
  ag('airichangka', ['tebakangkaairich', 'airichtebakangka'], '🔢 Tebak angka 1-100 (7 kesempatan) via AI Rich', 'angka'),
  ag('airichsusunkata', ['susunkataairich', 'airichkata'], '🔤 Susun huruf acak jadi kata via AI Rich', 'susunkata'),
  ag('airichemoji2', ['tebakemojiairich', 'emojiairich'], '😀 Tebak arti rangkaian emoji via AI Rich', 'tebakemoji'),
  ag('airichrantai', ['rantaikataairich', 'airichkata2'], '🔗 Rantai kata vs bot via AI Rich', 'rantai'),
  ag('airichharga', ['tebaharga', 'tebakaharga', 'airichprice'], '💵 Tebak harga barang (selisih ≤15%) via AI Rich', 'harga'),
  ag('airichsimon', ['simonairich', 'airichwarna', 'warnamemory'], '🎨 Simon: ingat urutan warna, 8 level, via AI Rich', 'simon'),
  ag('airichpanah', ['panahanairich', 'airicharchery'], '🏹 Panahan: bidik dengan memperhitungkan angin via AI Rich', 'panah'),
  ag('airichmancing', ['mancingairich', 'airichfishing'], '🎣 Mancing kilat (timing) — ikan masuk inventory RPG', 'mancing'),
  ag('airichbattle', ['battlerpg', 'airichfight', 'pertarunganairich'], '⚔️ Battle RPG turn-based via AI Rich (pakai HP/ATK/DEF karaktermu)', 'battle', '1'),
  ag('airichdungeon', ['dungeonairich', 'airichcrawl'], '🏰 Dungeon crawl 5 ruang via AI Rich — loot masuk inventory', 'dungeon'),
  ag('airichlelang', ['lelangairich', 'airichauction', 'auctionairich'], '🏷️ Lelang item langka vs NPC via AI Rich (koin RPG)', 'lelang')
]

/* ================================================================== */
/*  UTILITAS AI RICH                                                   */
/* ================================================================== */
async function kirimRich (m, opt) {
  const rich = newRich(m.sock)
  if (opt.title) rich.setTitle?.(opt.title)
  if (opt.text) rich.addText(opt.text)
  if (opt.table) rich.addTable(opt.table)
  if (opt.code) rich.addCode(opt.code.language || 'javascript', opt.code.code)
  if (opt.tip) rich.addTip(opt.tip)
  if (opt.suggest?.length) rich.addSuggest(opt.suggest.map(String), { id: 'act' })
  try { await rich.send(m.jid); return true }
  catch {
    const teks = [opt.text, opt.table ? opt.table.map(r => r.join(' | ')).join('\n') : '', opt.code ? '```\n' + opt.code.code + '\n```' : '', opt.tip ? '💡 ' + opt.tip : ''].filter(Boolean).join('\n\n')
    await m.reply(teks || '⚠️ Gagal mengirim AI Rich.').catch(() => {})
    return false
  }
}

export const airichLabUtils = [
  {
    command: ['airichgamelab', 'gameairich2', 'airichgames2', 'daftargameairich', 'menuairichgame'],
    category: 'Games',
    description: 'Menu 24 game AI Rich v7 (pill bisa diketuk)',
    limit: 0,
    run: m => kirimRich(m, {
      title: '🤖 GAME AIRICH v7',
      text: '*24 GAME PILL AI RICH + 30 GAME HTML APP = 54 GAME*\n*(HTML app: 18 arcade + 5 pastel + 4 casino + 3 jadul)*\n\nPapan/soal tampil kaya (teks + tabel + gambar), jawaban berupa **pill yang bisa diketuk**, dan tiap langkah di-*live edit* di pesan yang sama. Taruhan & hadiah pakai koin RPG.\n\n✨ *BARU v7.5* — 🧸 PASTEL (5 game) kulit krem/pink/mint, mesin sama dengan arcade: ' + P + 'pastel\n✨ *v7.4* — 🎰 Casino (4) & 📱 Jadul (3) juga **HTML app** (canvas + D-pad ▲▼◀▶ + ●), bukan papan pill: ' + P + 'casino · ' + P + 'jadul\n🎧 Player musik ala Spotify sekarang **HTML app** (v7.5): ' + P + 'play2 <judul> · versi AIRich: ' + P + 'play2rich <judul>\n🧩 Semua kategori game: ' + P + 'gamerespon',
      table: [
        ['Game', 'Perintah'],
        ['💣 Minesweeper', `${P}airichmine`], ['🔢 2048', `${P}airich2048`], ['🃏 Memory', `${P}airichmemory`],
        ['🐍 Ular tangga', `${P}airichular`], ['🔴 Connect Four', `${P}airichconnect`], ['🂡 Blackjack', `${P}airichblackjack 1000`],
        ['🎡 Roulette', `${P}airichroulette merah 500`], ['🎰 Slot', `${P}airichslot 300`], ['🎲 Dadu duel', `${P}airichdadu 400`],
        ['⬆️ Higher-Lower', `${P}airichhighlow 500`], ['➗ Math sprint', `${P}airichmath`], ['⚡ Reaction', `${P}airichreaction`],
        ['🧠 Trivia', `${P}airichtrivia`], ['🔢 Tebak angka', `${P}airichangka`], ['🔤 Susun kata', `${P}airichsusunkata`],
        ['😀 Tebak emoji', `${P}airichemoji2`], ['🔗 Rantai kata', `${P}airichrantai`], ['💵 Tebak harga', `${P}airichharga`],
        ['🎨 Simon warna', `${P}airichsimon`], ['🏹 Panahan', `${P}airichpanah`], ['🎣 Mancing kilat', `${P}airichmancing`],
        ['⚔️ RPG Battle', `${P}airichbattle`], ['🏰 Dungeon crawl', `${P}airichdungeon`], ['🏷️ Lelang', `${P}airichlelang`],
        ['🎰 Casino Slot (HTML app)', `${P}slot`], ['🃏 Poker 5-Card (HTML app)', `${P}poker`],
        ['🚀 Crash/Aviator (HTML app)', `${P}crash`], ['🂡 Baccarat (HTML app)', `${P}baccarat`],
        ['🐸 Pou Jump (HTML app)', `${P}poujump`], ['📟 Snake Nokia (HTML app)', `${P}snakenokia`],
        ['👾 Space Invader (HTML app)', `${P}spaceinvader`],
        ['🍬 Permen Pastel (HTML app)', `${P}match3`], ['🫧 Balon Sabun (HTML app)', `${P}bubble`],
        ['🪩 Pinball Pastel (HTML app)', `${P}pinball`], ['🐹 Tikus Tanah (HTML app)', `${P}tikus`],
        ['🚰 Pipa Bocor (HTML app)', `${P}pipa`], ['🎧 Player musik Spotify + lirik', `${P}play3`],
        ['🧩 Semua game (54)', `${P}gamerespon`]
      ],
      tip: 'Ketuk salah satu pill untuk langsung main.',
      suggest: [`${P}gamerespon`, `${P}casino`, `${P}jadul`, `${P}airichmine`, `${P}airichbattle`, `${P}airichstatistik`]
    })
  },

  {
    command: ['airichbantuan', 'bantuanairich', 'airichhelp', 'panduanairich'],
    category: 'Games',
    description: 'Panduan fitur AI Rich: cara kerja pill, live edit, fallback',
    limit: 0,
    run: m => kirimRich(m, {
      title: '📖 PANDUAN AI RICH',
      text: '*CARA KERJA GAME AI RICH*\n\n1️⃣ Soal/papan dikirim sebagai **AIRichResponseMessage** (richResponseMessage).\n2️⃣ Jawaban berupa **pill** (`suggest`) yang bisa diketuk — ketukan masuk sebagai pesan teks lalu dicocokkan ke sesi game.\n3️⃣ Setiap langkah **memperbarui pesan yang sama** (`sendEdit`), jadi chat tidak banjir.\n4️⃣ Kalau device tidak mendukung AI Rich, bot otomatis mengirim **versi teks** — game tetap bisa dimainkan dengan mengetik.\n5️⃣ Taruhan & hadiah memakai **koin + EXP RPG**, jadi game ini tersambung ke progres karaktermu.',
      table: [
        ['Situasi', 'Yang harus dilakukan'],
        ['Mau berhenti di tengah game', `ketik "batal" atau ${P}batalairichlab`],
        ['Mau ulang game yang sama', 'ketik "lagi" / "ulang"'],
        ['Mau ulang game terakhir', `${P}mainlagi`],
        ['Lihat statistik menang/kalah', `${P}airichstatistik`],
        ['Cek device dukung AI Rich?', `${P}airichtes`]
      ],
      tip: 'Game AI Rich bisa dimainkan di grup maupun chat pribadi.',
      suggest: [`${P}airichgamelab`, `${P}airichtes`, `${P}airichstatistik`]
    })
  },

  {
    command: ['airichstatistik', 'statairich', 'airichstat'],
    category: 'Games',
    description: 'Statistik game AI Rich kamu (main/menang/kalah/skor terbaik)',
    limit: 0,
    run: m => {
      const u = getStat(K(m))
      const per = Object.entries(u.per || {}).map(([k, v]) => [GAMES.get(k)?.nama || k, `${v.main} main`, `${v.menang} menang`, v.main ? Math.round(v.menang / v.main * 100) + '%' : '-'])
      return kirimRich(m, {
        title: '📊 STATISTIK AIRICH',
        text: `*${m.pushName || 'Kamu'}*\n\nTotal main: *${u.main}* · 🏆 ${u.menang} menang · 💀 ${u.kalah} kalah · 🤝 ${u.seri} seri\nWin rate: *${u.main ? Math.round(u.menang / u.main * 100) : 0}%*`,
        table: [['Game', 'Main', 'Menang', 'WR'], ...(per.length ? per : [['-', '-', '-', '-']])],
        tip: `Skor terbaik: ${Object.entries(u.skor || {}).map(([k, v]) => `${GAMES.get(k)?.nama || k} ${v}`).join(', ') || 'belum ada'}`,
        suggest: [`${P}airichleaderboard`, `${P}airichgamelab`, `${P}mainlagi`]
      })
    }
  },

  {
    command: ['airichleaderboard', 'lbairich', 'rankairich', 'topairich'],
    category: 'Games',
    description: 'Peringkat pemain game AI Rich (berdasarkan kemenangan & skor)',
    limit: 0,
    run: m => {
      const list = semuaStat()
        .map(u => ({ ...u, poin: (u.menang || 0) * 100 + Object.values(u.skor || {}).reduce((a, b) => a + (b || 0), 0) }))
        .sort((a, b) => b.poin - a.poin).slice(0, 10)
      if (!list.length) return m.reply('Belum ada yang main game AI Rich. Mulai: ' + P + 'airichgamelab')
      const nama = jid => { try { return getUser(jid).name || jid.split('@')[0].slice(-6) } catch { return jid.split('@')[0].slice(-6) } }
      return kirimRich(m, {
        title: '🏆 LEADERBOARD AIRICH',
        text: '10 pemain terbaik game AI Rich:',
        table: [['#', 'Pemain', 'Menang', 'Poin'], ...list.map((u, i) => [String(i + 1), nama(u.jid), String(u.menang || 0), String(u.poin)])],
        tip: 'Poin = kemenangan ×100 + total skor terbaik.',
        suggest: [`${P}airichgamelab`, `${P}airichstatistik`]
      })
    }
  },

  {
    command: ['airichtes', 'tesairich', 'cekairich', 'dukungairich'],
    category: 'Games',
    description: 'Tes apakah device kamu mendukung AI Rich message',
    limit: 0,
    run: async m => {
      const ok = await kirimRich(m, {
        title: '🧪 TES AI RICH',
        text: 'Kalau kamu melihat pesan ini sebagai **kartu AI Rich** (ada judul, tabel, dan pill saran di bawah), berarti device kamu **mendukung** AIRichResponseMessage ✅\n\nKalau yang tampil hanya teks biasa, device kamu pakai *fallback* — semua fitur tetap jalan, cuma tampilannya sederhana.',
        table: [['Komponen', 'Status'], ['Teks kaya (bold/heading)', '✔'], ['Tabel', '✔'], ['Tip', '✔'], ['Pill saran (suggest)', '✔'], ['Live edit (sendEdit)', '✔ diuji saat main game']],
        tip: 'Lanjutkan tes nyata: main satu game AI Rich.',
        suggest: [`${P}airichmine`, `${P}airichgamelab`, `${P}airichbantuan`]
      })
      return ok ? null : null
    }
  },

  {
    command: ['airichriwayat', 'riwayatairich', 'historyairich'],
    category: 'Games',
    description: 'Riwayat game AI Rich yang pernah kamu mainkan',
    limit: 0,
    run: m => {
      const u = getStat(K(m))
      const rows = Object.entries(u.per || {}).map(([k, v]) => [GAMES.get(k)?.nama || k, `${v.main}×`, `${v.menang}×`, u.skor?.[k] ? String(u.skor[k]) : '-'])
      return kirimRich(m, {
        title: '📜 RIWAYAT AIRICH',
        text: `Terakhir main: ${u.terakhir ? new Date(u.terakhir).toLocaleString('id-ID') : 'belum pernah'}\nGame terakhir: *${GAMES.get(u.terakhirKind)?.nama || '-'}*`,
        table: [['Game', 'Dimainkan', 'Menang', 'Skor terbaik'], ...(rows.length ? rows : [['-', '-', '-', '-']])],
        tip: 'Main lagi: ' + P + 'mainlagi',
        suggest: [`${P}mainlagi`, `${P}airichgamelab`]
      })
    }
  },

  {
    command: ['airichreset', 'resetairich', 'hapusstatairich'],
    category: 'Games',
    description: 'Reset statistik game AI Rich kamu (minta konfirmasi)',
    limit: 0,
    run: async m => {
      if (!/ya|yakin|konfirmasi|confirm/i.test(m.q || '')) {
        return m.reply(`⚠️ Yakin mau hapus statistik AI Rich kamu?\n\nKonfirmasi: \`${P}airichreset ya\``)
      }
      const { loadDB, saveDB: save } = await import('../lib/database.js')
      const db = loadDB('airichstat', {})
      delete db[K(m)]
      save('airichstat')
      return m.reply('🗑️ Statistik AI Rich kamu sudah direset.')
    }
  },

  {
    command: ['airichtanya', 'tanyaairich', 'airichai', 'aiairich'],
    category: 'AI Menu',
    description: 'Tanya AI, jawaban dirender sebagai kartu AI Rich + pill lanjutan',
    limit: 1,
    contoh: 'jelaskan fotosintesis',
    run: async m => {
      const q = m.q || m.quoted?.text
      if (!q) return m.reply(`Contoh: ${P}airichtanya jelaskan fotosintesis`)
      const { aiChat, cleanAIText } = await import('../lib/ai.js')
      const jwb = cleanAIText(await aiChat(q, [], { system: 'Jawab singkat, padat, dan pakai bahasa Indonesia.' }))
      if (!jwb) return m.reply('⚠️ AI tidak menjawab (mungkin rate-limit). Coba lagi beberapa detik.')
      const paragraf = jwb.split(/\n{2,}/).slice(0, 4)
      return kirimRich(m, {
        title: '🤖 TANYA AI (RICH)',
        text: `*Tanya:* ${q}\n\n${paragraf.join('\n\n')}`,
        tip: 'Jawaban dirender sebagai AI Rich message.',
        suggest: [`${P}airichtanya jelaskan lebih detail`, `${P}ringkas ${q.slice(0, 40)}`, `${P}airichgamelab`]
      })
    }
  },

  {
    command: ['airichunsur', 'unsurairich', 'airichkimia', 'kartuunsur'],
    category: 'Info Menu',
    description: 'Kartu AI Rich info unsur kimia (nama, simbol, golongan)',
    limit: 0,
    contoh: 'O',
    run: m => {
      const q = m.q || m.args?.[0] || ''
      const list = elements()
      const e = q ? (findElement(q) || list.find(x => String(x.simbol).toLowerCase() === q.toLowerCase() || String(x.nama).toLowerCase().includes(q.toLowerCase()))) : pickRandom(list)
      if (!e) return m.reply(`❌ Unsur tidak ditemukan: ${q}\nContoh: ${P}airichunsur O`)
      return kirimRich(m, {
        title: `⚗️ UNSUR ${e.simbol}`,
        text: `## ${e.nama}\nSimbol: *${e.simbol}* · Nomor atom: *${e.atom || e.nomor || '-'}*`,
        table: Object.entries(e).filter(([k]) => !['nama', 'simbol'].includes(k)).slice(0, 8).map(([k, v]) => [String(k), String(v)]),
        tip: 'Unsur lain: ' + P + 'airichunsur Fe',
        suggest: [`${P}airichunsur Fe`, `${P}kuisunsur`, `${P}airichgamelab`]
      })
    }
  },

  {
    command: ['airichnegara', 'negaraairich', 'airichcountry', 'kartunegara'],
    category: 'Info Menu',
    description: 'Kartu AI Rich info negara (ibu kota, mata uang, wilayah)',
    limit: 0,
    contoh: 'Jepang',
    run: m => {
      const q = m.q || ''
      const c = q ? findCountry(q) : pickRandom(countries())
      if (!c) return m.reply(`❌ Negara tidak ditemukan: ${q}\nContoh: ${P}airichnegara Jepang`)
      return kirimRich(m, {
        title: `${c.bendera || '🏳️'} ${c.id || c.nama}`,
        text: `## ${c.id || c.nama}`,
        table: [
          ['Ibu kota', c.ibu || '-'],
          ['Wilayah', `${c.region || '-'} — ${c.sub || '-'}`],
          ['Mata uang', c.matauang || '-'],
          ['Kode panggil', c.kode || '-'],
          ['Luas', c.area ? c.area.toLocaleString('id-ID') + ' km²' : '-'],
          ['Bahasa', c.bahasa || '-']
        ],
        tip: 'Negara lain: ' + P + 'airichnegara Brazil',
        suggest: [`${P}airichnegara Brazil`, `${P}kuisnegara`, `${P}airichgamelab`]
      })
    }
  },

  {
    command: ['airichtabel', 'tabelairich', 'buattabelairich', 'airichtable'],
    category: 'Tools',
    description: 'Ubah teks jadi tabel AI Rich (pisahkan kolom dengan "|", baris dengan ";")',
    limit: 0,
    contoh: 'Nama|Umur;Budi|17;Siti|16',
    run: m => {
      const q = m.q || ''
      if (!q.includes('|')) return m.reply(`Format: ${P}airichtabel Kolom1|Kolom2;baris1a|baris1b;baris2a|baris2b\n\nContoh: ${P}airichtabel Nama|Umur;Budi|17;Siti|16`)
      const rows = q.split(';').map(r => r.split('|').map(c => c.trim())).filter(r => r.length > 1).slice(0, 20)
      if (rows.length < 2) return m.reply('❌ Minimal 2 baris (header + isi).')
      return kirimRich(m, {
        title: '📋 TABEL AIRICH',
        text: `Tabel dari teks (${rows.length} baris):`,
        table: rows,
        tip: 'Kolom dipisah "|", baris dipisah ";".',
        suggest: [`${P}airichtabel Kota|Populasi;Medan|2,5 jt;Jakarta|10 jt`]
      })
    }
  },

  {
    command: ['airichkode', 'kodeairich', 'airichcode', 'snippetairich'],
    category: 'Tools',
    description: 'Tampilkan snippet kode sebagai blok kode AI Rich',
    limit: 0,
    contoh: 'javascript',
    run: m => {
      const bahasa = (m.q || m.args?.[0] || 'javascript').toLowerCase().replace(/[^a-z+#]/g, '') || 'javascript'
      const CONTOH = {
        javascript: "// Plugin fitur bot sederhana\nexport default {\n  command: ['halo', 'hai'],\n  category: 'Fun Menu',\n  description: 'Sapa user',\n  run: m => m.reply('Halo ' + (m.pushName || 'kamu') + '!')\n}",
        python: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint([fib(i) for i in range(10)])",
        bash: "#!/data/data/com.termux/files/usr/bin/bash\ncd ~/theryhann-bot || exit 1\nnpm install --no-audit --no-fund\nnode index.js --pairing 628xxx",
        html: "<!doctype html>\n<html lang='id'>\n<head><meta charset='utf-8'><title>Halo</title></head>\n<body><h1>Halo dunia</h1></body>\n</html>",
        css: ":root { --utama: #a855f7; }\nbody { font-family: system-ui; background: #0b0b12; color: #fff; }\n.kartu { border-radius: 12px; padding: 1rem; }",
        json: '{\n  "nama": "theryhann!",\n  "versi": "7.0.0",\n  "fitur": 1000\n}'
      }
      const kode = CONTOH[bahasa] || CONTOH.javascript
      return kirimRich(m, {
        title: `💻 SNIPPET ${bahasa.toUpperCase()}`,
        text: `Contoh kode *${bahasa}* (blok kode AI Rich):`,
        code: { language: bahasa in CONTOH ? bahasa : 'javascript', code: kode },
        tip: `Bahasa tersedia: ${Object.keys(CONTOH).join(', ')}`,
        suggest: Object.keys(CONTOH).slice(0, 4).map(b => `${P}airichkode ${b}`)
      })
    }
  }
]

export default { airichLabGames2, airichLabUtils }
