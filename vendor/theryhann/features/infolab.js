/**
 * ℹ️ INFOLAB — 52 fitur informasi (kategori Info Menu, v6)
 * ------------------------------------------------------------
 *  Negara (250), provinsi Indonesia (38), unsur kimia (118),
 *  jam dunia & zona waktu, kalender ASCII, weton Jawa, shio,
 *  zodiak detail, hari libur nasional, konversi satuan
 *  (panjang/berat/data/waktu/kecepatan), serta info sistem bot.
 *
 *  Sumber data: folder data/*.json + modul bawaan Node (os/fs).
 */
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import {
  countries, provinces, elements, findCountry, findProvince, findElement,
  search, haversine, bearing, compass, randomQuote, quotesBank
} from '../lib/datasets.js'
import { pickRandom, truncate, formatSize } from '../lib/functions.js'

const P = config.display.prefix

/* ------------------------- helper ------------------------- */
const need = (m, contoh) => {
  if (!m.q) { m.reply(`Butuh input.\nContoh: ${P}${m.command} ${contoh}`); return null }
  return m.q.trim()
}
const info = (command, aliases, description, run, contoh, opt = {}) => ({
  command: [command, ...aliases],
  category: 'Info Menu',
  description,
  limit: 0,
  cooldown: 1,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 180)}`) }
  }
})

const REGION_ID = { Africa: 'Afrika', Americas: 'Amerika', Asia: 'Asia', Europe: 'Eropa', Oceania: 'Oseania', Antarctic: 'Antartika' }
const GOLONGAN_KIMIA = ['Alkali', 'Alkali tanah', 'Logam transisi', 'Nonlogam', 'Metaloid', 'Halogen', 'Gas mulia', 'Lantanida', 'Aktinida']

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const NEPTU_HARI = { Minggu: 5, Senin: 4, Selasa: 3, Rabu: 7, Kamis: 8, Jumat: 6, Sabtu: 9 }
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon']
const NEPTU_PASARAN = { Legi: 5, Pahing: 9, Pon: 7, Wage: 4, Kliwon: 8 }
const WETON_SIFAT = {
  3: 'Tegas tapi mudah tersinggung', 4: 'Pendiam, banyak berpikir', 5: 'Sabar & dermawan',
  6: 'Pandai bergaul, rezeki lancar', 7: 'Berwibawa, cocok jadi pemimpin',
  8: 'Kreatif dan suka keindahan', 9: 'Cerdas, ambisius', 10: 'Kuat pendirian, pekerja keras',
  11: 'Ramah, mudah dapat teman', 12: 'Suka menolong, rezeki cukup',
  13: 'Berani, sering bepergian', 14: 'Tenang, pandai menyimpan rahasia',
  15: 'Beruntung, disegani', 16: 'Pandai bicara, cocok di bidang sosial',
  17: 'Idealis, perfeksionis', 18: 'Kuat mental, tahan banting'
}
const SHIO = ['Tikus', 'Kerbau', 'Macan', 'Kelinci', 'Naga', 'Ular', 'Kuda', 'Kambing', 'Monyet', 'Ayam', 'Anjing', 'Babi']
const SHIO_SIFAT = {
  Tikus: 'Cerdik, pandai mengatur uang', Kerbau: 'Pekerja keras, sabar', Macan: 'Berani, karismatik',
  Kelinci: 'Lembut, diplomatis', Naga: 'Ambisius, berenergi besar', Ular: 'Bijaksana, misterius',
  Kuda: 'Aktif, suka kebebasan', Kambing: 'Artistik, sensitif', Monyet: 'Kreatif, humoris',
  Ayam: 'Teliti, jujur', Anjing: 'Setia, protektif', Babi: 'Ramah, dermawan'
}
const SHIO_ELEMEN = ['Logam', 'Logam', 'Air', 'Air', 'Kayu', 'Kayu', 'Api', 'Api', 'Tanah', 'Tanah']
const ZODIAK = [
  { n: 'Capricorn', from: [12, 22], to: [1, 19], el: 'Tanah', sifat: 'Disiplin, ambisius, realistis' },
  { n: 'Aquarius', from: [1, 20], to: [2, 18], el: 'Udara', sifat: 'Independen, visioner, unik' },
  { n: 'Pisces', from: [2, 19], to: [3, 20], el: 'Air', sifat: 'Empatis, imajinatif, sensitif' },
  { n: 'Aries', from: [3, 21], to: [4, 19], el: 'Api', sifat: 'Berani, spontan, kompetitif' },
  { n: 'Taurus', from: [4, 20], to: [5, 20], el: 'Tanah', sifat: 'Sabar, setia, menyukai kenyamanan' },
  { n: 'Gemini', from: [5, 21], to: [6, 20], el: 'Udara', sifat: 'Komunikatif, ingin tahu, fleksibel' },
  { n: 'Cancer', from: [6, 21], to: [7, 22], el: 'Air', sifat: 'Peduli, protektif, intuitif' },
  { n: 'Leo', from: [7, 23], to: [8, 22], el: 'Api', sifat: 'Percaya diri, hangat, suka memimpin' },
  { n: 'Virgo', from: [8, 23], to: [9, 22], el: 'Tanah', sifat: 'Teliti, analitis, pekerja keras' },
  { n: 'Libra', from: [9, 23], to: [10, 22], el: 'Udara', sifat: 'Adil, sosial, menyukai harmoni' },
  { n: 'Scorpio', from: [10, 23], to: [11, 21], el: 'Air', sifat: 'Intens, setia, misterius' },
  { n: 'Sagittarius', from: [11, 22], to: [12, 21], el: 'Api', sifat: 'Optimis, jujur, suka petualangan' }
]
const LIBUR_TETAP = [
  [1, 1, 'Tahun Baru Masehi'], [5, 1, 'Hari Buruh Internasional'],
  [6, 1, 'Hari Lahir Pancasila'], [8, 17, 'Hari Kemerdekaan RI'],
  [12, 25, 'Hari Raya Natal']
]
const LIBUR_ISLAM = [
  [1, 10, 'Hari Raya Idul Adha (10 Dzulhijjah)', 'Idul Adha'],
  [1, 1, 'Tahun Baru Islam (1 Muharram)', 'Tahun Baru Islam'],
  [3, 12, 'Maulid Nabi Muhammad SAW', 'Maulid Nabi'],
  [10, 1, 'Hari Raya Idul Fitri (1 Syawal)', 'Idul Fitri']
]
const HARI_DUNIA = [
  [1, 1, 'Hari Perdamaian Dunia'], [1, 26, 'Hari Kepabeanan Internasional'], [2, 4, 'Hari Kanker Sedunia'],
  [2, 14, "Hari Valentine (bukan hari libur)"], [3, 8, 'Hari Perempuan Internasional'], [3, 21, 'Hari Puisi Sedunia'],
  [3, 22, 'Hari Air Sedunia'], [4, 7, 'Hari Kesehatan Sedunia'], [4, 22, 'Hari Bumi'], [4, 23, 'Hari Buku Sedunia'],
  [5, 1, 'Hari Buruh'], [5, 2, 'Hari Pendidikan Nasional (Indonesia)'], [5, 17, 'Hari Telekomunikasi Sedunia'],
  [5, 31, 'Hari Tanpa Tembakau Sedunia'], [6, 5, 'Hari Lingkungan Hidup Sedunia'], [6, 8, 'Hari Laut Sedunia'],
  [6, 14, 'Hari Donor Darah Sedunia'], [7, 11, 'Hari Populasi Sedunia'], [8, 12, 'Hari Remaja Internasional'],
  [8, 17, 'HUT Kemerdekaan RI'], [9, 8, 'Hari Aksara Internasional'], [9, 15, 'Hari Demokrasi Internasional'],
  [9, 21, 'Hari Perdamaian Internasional'], [9, 28, 'Hari Hak Untuk Mendapatkan Informasi'], [10, 1, 'Hari Kesaktian Pancasila'],
  [10, 5, 'Hari Guru Sedunia'], [10, 10, 'Hari Kesehatan Jiwa Sedunia'], [10, 16, 'Hari Pangan Sedunia'],
  [10, 28, 'Hari Sumpah Pemuda'], [11, 10, 'Hari Pahlawan'], [11, 12, 'Hari Kesehatan Nasional'],
  [11, 20, 'Hari Anak Sedunia'], [11, 21, 'Hari Pohon Sedunia'], [12, 1, 'Hari AIDS Sedunia'],
  [12, 3, 'Hari Disabilitas Internasional'], [12, 9, 'Hari Anti Korupsi Sedunia'], [12, 10, 'Hari Hak Asasi Manusia'],
  [12, 12, 'Hari Transmigrasi'], [12, 22, 'Hari Ibu (Indonesia)']
]

const PANJANG = { mm: 0.001, cm: 0.01, m: 1, km: 1000, inci: 0.0254, inchi: 0.0254, kaki: 0.3048, ft: 0.3048, yard: 0.9144, mil: 1609.344, hm: 100, dam: 10, dm: 0.1 }
const BERAT = { mg: 1e-6, g: 0.001, gram: 0.001, kg: 1, kuintal: 100, ton: 1000, ons: 0.1, pon: 0.453592, pound: 0.453592, lb: 0.453592, ounce: 0.0283495, oz: 0.0283495 }
const DATA = { bit: 1 / 8, byte: 1, b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4, pb: 1024 ** 5 }
const WAKTU = { ms: 1 / 1000, milidetik: 1 / 1000, detik: 1, sekon: 1, menit: 60, jam: 3600, hari: 86400, minggu: 604800, bulan: 2629800, tahun: 31557600, dekade: 315576000, abad: 3155760000 }
const KECEPATAN = { 'km/jam': 1 / 3.6, kmh: 1 / 3.6, 'm/s': 1, ms: 1, mph: 0.44704, knot: 0.514444, knotn: 0.514444, mach: 340.29, 'ft/s': 0.3048 }

function konversi (tabel, nilai, dari, ke) {
  const a = tabel[String(dari).toLowerCase()]
  const b = tabel[String(ke).toLowerCase()]
  if (a === undefined) throw new Error(`Satuan "${dari}" tidak dikenal. Tersedia: ${Object.keys(tabel).join(', ')}`)
  if (b === undefined) throw new Error(`Satuan "${ke}" tidak dikenal. Tersedia: ${Object.keys(tabel).join(', ')}`)
  const hasil = nilai * a / b
  return { hasil, dari, ke }
}
const fmtNum = n => {
  const abs = Math.abs(n)
  if (abs !== 0 && (abs < 0.0001 || abs > 1e12)) return n.toExponential(6)
  return String(Number(n.toPrecision(10)))
}
function parseDate (s) {
  const t = String(s || '').trim()
  const m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const d = new Date(t)
  if (isNaN(d)) throw new Error(`Format tanggal tidak dikenali: ${t}\nPakai: ${P}contoh 2000-08-17 atau 17-08-1945`)
  return d
}
function kalenderASCII (tahun, bulan) {
  const nama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const first = new Date(tahun, bulan, 1)
  const total = new Date(tahun, bulan + 1, 0).getDate()
  let out = `   ${nama[bulan]} ${tahun}\nSn Se Ra Ka Ju Sa Mg\n`
  const start = (first.getDay() + 6) % 7 // Senin di kiri
  let line = '   '.repeat(start)
  for (let d = 1; d <= total; d++) {
    line += String(d).padStart(2) + ' '
    if ((start + d) % 7 === 0) { out += line + '\n'; line = '' }
  }
  if (line.trim()) out += line
  return out
}

export const infolabCmds = [
  /* ================= NEGARA ================= */
  info('negara', ['infonegara', 'countryinfo'], 'Info lengkap sebuah negara', m => {
    const q = need(m, 'Jepang'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.\nCoba: ${P}carinegara ${q}`)
    return m.reply(`${c.bendera} *${c.nama.toUpperCase()}*\n${c.resmi && c.resmi !== c.nama ? c.resmi : ''}\n\n` +
      `▸ Ibu kota   : ${c.ibu || '-'}\n▸ Wilayah    : ${REGION_ID[c.region] || c.region} — ${c.sub || '-'}\n` +
      `▸ Mata uang  : ${c.matauang || '-'}\n▸ Bahasa     : ${c.bahasa || '-'}\n` +
      `▸ Luas       : ${c.area ? c.area.toLocaleString('id-ID') + ' km²' : '-'}\n` +
      `▸ Populasi relatif: ${c.daratan ? 'negara daratan' : c.grup ? 'kepulauan' : '-'}\n` +
      `▸ Kode       : ${c.kode || '-'} · TLD ${c.tld || '-'} · ISO ${c.cca2}/${c.cca3}\n` +
      `▸ Koordinat  : ${c.lat?.toFixed(3)}, ${c.lng?.toFixed(3)}\n` +
      `▸ Tetangga   : ${c.tetangga || '-'}\n▸ Anggota PBB: ${c.anggotaPBB ? 'ya' : 'tidak'}\n▸ Sebutan warga: ${c.sebutan || '-'}\n\n` +
      `🗺️ Peta: https://www.google.com/maps?q=${c.lat},${c.lng}\n🔗 Terkait: ${P}benderanegara ${c.nama} · ${P}jaraknegara ${c.nama} Indonesia`)
  }, 'Jepang'),

  info('carinegara', ['searchnegara', 'negaracari'], 'Cari negara berdasarkan nama/ibukota/mata uang', m => {
    const q = need(m, 'indo'); if (!q) return
    const list = countries()
    const hasil = search(list, q, ['nama', 'resmi', 'id', 'ibu', 'matauang', 'bahasa', 'cca2', 'cca3'], 10)
    if (!hasil.length) return m.reply(`❌ Tidak ada negara yang cocok dengan "${q}".`)
    return m.reply(`🔎 *HASIL PENCARIAN "${q}"* (${hasil.length})\n\n${hasil.map(c => `${c.bendera} ${c.nama} — ${c.ibu || '?'} (${REGION_ID[c.region] || c.region})`).join('\n')}\n\nDetail: ${P}negara <nama>`)
  }, 'indo'),

  info('negararandom', ['randomnegara', 'negaracak'], 'Negara acak (untuk kuis/belajar)', m => {
    const c = pickRandom(countries())
    return m.reply(`${c.bendera} *${c.nama}*\n\nIbu kota: ${c.ibu || '?'}\nWilayah: ${REGION_ID[c.region] || c.region} — ${c.sub || '-'}\nMata uang: ${c.matauang || '-'}\nKode panggil: ${c.kode || '-'}\n\nLihat lengkap: ${P}negara ${c.nama}`)
  }, '1'),

  info('benderanegara', ['flagcountry', 'bendera'], 'Bendera sebuah negara (emoji + gambar)', async m => {
    const q = need(m, 'Indonesia'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    const code = (c.cca2 || '').toLowerCase()
    try {
      const r = await fetch(`https://flagcdn.com/w640/${code}.png`)
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        return await m.sendImage(buf, `${c.bendera} *Bendera ${c.nama}*\nISO: ${c.cca2.toUpperCase()} · flagcdn.com/w640/${code}.png`)
      }
    } catch { /* fallback ke emoji */ }
    return m.reply(`${c.bendera} *Bendera ${c.nama}*\n\nEmoji: ${c.bendera}\nKode ISO: ${c.cca2.toUpperCase()}\n\n(Gambar tidak dapat dimuat — jaringan terbatas)`)
  }, 'Indonesia'),

  info('ibukotadunia', ['capital', 'ibukota'], 'Ibu kota sebuah negara', m => {
    const q = need(m, 'Kanada'); if (!q) return
    const c = findCountry(q)
    return c
      ? m.reply(`🏛️ Ibu kota *${c.nama}* ${c.bendera} adalah *${c.ibu || '-'}*.\n\nWilayah: ${REGION_ID[c.region] || c.region}\nKoordinat: ${c.lat?.toFixed(2)}, ${c.lng?.toFixed(2)}`)
      : m.reply(`❌ Negara "${q}" tidak ditemukan. Coba: ${P}carinegara ${q}`)
  }, 'Kanada'),

  info('matauangdunia', ['currencycountry', 'uangnegara'], 'Mata uang sebuah negara', m => {
    const q = need(m, 'Thailand'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    return m.reply(`💵 *${c.nama}* ${c.bendera}\n\nMata uang: *${c.matauang || '-'}*\n\nCek kursnya: ${P}kurs ${(c.matauang || 'USD').split(' ')[0]}`)
  }, 'Thailand'),

  info('kodenegara', ['countrycode', 'kodepanggil'], 'Kode panggil, TLD & ISO sebuah negara', m => {
    const q = need(m, 'Indonesia'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    return m.reply(`🔢 *KODE ${c.nama.toUpperCase()}* ${c.bendera}\n\nPanggilan : ${c.kode || '-'}\nTLD       : ${c.tld || '-'}\nISO 3166-1: ${c.cca2} / ${c.cca3}\n\nContoh nomor: ${c.kode || '+62'}8xxxxxxxxxx → wa.me/${(c.kode || '+62').replace('+', '')}81234567890`)
  }, 'Indonesia'),

  info('luasnegara', ['countryarea', 'areanegara'], 'Luas wilayah sebuah negara + peringkat', m => {
    const q = need(m, 'Brasil'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    const list = countries().filter(x => x.area).sort((a, b) => b.area - a.area)
    const rank = list.findIndex(x => x.cca3 === c.cca3) + 1
    const indo = list.find(x => x.cca2 === 'ID')?.area || 1904569
    return m.reply(`🌍 *LUAS ${c.nama.toUpperCase()}* ${c.bendera}\n\nLuas     : *${(c.area || 0).toLocaleString('id-ID')} km²*\nPeringkat: ${rank ? '#' + rank + ' dunia' : '-'} (dari ${list.length} negara)\nBanding Indonesia: ${(c.area / indo).toFixed(2)}× luas Indonesia (${indo.toLocaleString('id-ID')} km²)`)
  }, 'Brasil'),

  info('bahasadunia', ['countrylanguage', 'bahasanegara'], 'Bahasa resmi sebuah negara', m => {
    const q = need(m, 'Belanda'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    return m.reply(`🗣️ *BAHASA ${c.nama.toUpperCase()}* ${c.bendera}\n\n${(c.bahasa || '-').split(',').map(b => `▸ ${b.trim()}`).join('\n')}\n\nIbu kota: ${c.ibu || '-'}`)
  }, 'Belanda'),

  info('tetanggaan', ['neighbour', 'batasnegara'], 'Negara-negara yang berbatasan darat', m => {
    const q = need(m, 'Indonesia'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    if (!c.tetangga) return m.reply(`🏝️ *${c.nama}* ${c.bendera} tidak punya perbatasan darat (negara pulau/kepulauan).`)
    const names = c.tetangga.split(',').map(x => x.trim()).filter(Boolean)
    const detail = names.map(n => { const x = findCountry(n); return x ? `${x.bendera} ${x.nama} (${x.ibu || '?'})` : `▸ ${n}` })
    return m.reply(`🤝 *TETANGGA ${c.nama.toUpperCase()}* (${names.length})\n\n${detail.join('\n')}`)
  }, 'Indonesia'),

  info('negararegion', ['regioncountry', 'listregion'], 'Daftar negara per wilayah: .negararegion Asia', m => {
    const q = (m.q || 'Asia').trim()
    const map = Object.entries(REGION_ID).find(([k, v]) => k.toLowerCase() === q.toLowerCase() || v.toLowerCase() === q.toLowerCase())
    if (!map) return m.reply(`Wilayah tersedia: ${Object.values(REGION_ID).join(', ')}\nContoh: ${P}negararegion Asia`)
    const list = countries().filter(c => c.region === map[0])
    const sub = [...new Set(list.map(c => c.sub).filter(Boolean))]
    return m.reply(`🌏 *NEGARA ${map[1].toUpperCase()}* (${list.length})\n\nSub-wilayah: ${sub.join(', ')}\n\n${truncate(list.map(c => `${c.bendera} ${c.nama} — ${c.ibu || '?'}`).join('\n'), 3000)}`)
  }, 'Asia'),

  info('koordinatnegara', ['mapnegara', 'lokasinegara'], 'Koordinat + link peta sebuah negara', m => {
    const q = need(m, 'Mesir'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    return m.reply(`📍 *KOORDINAT ${c.nama.toUpperCase()}* ${c.bendera}\n\nLintang : ${c.lat?.toFixed(4)}°\nBujur   : ${c.lng?.toFixed(4)}°\n\nGoogle Maps: https://www.google.com/maps?q=${c.lat},${c.lng}\nOpenStreetMap: https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=6/${c.lat}/${c.lng}`)
  }, 'Mesir'),

  info('jaraknegara', ['jarakibu', 'jarak2negara'], 'Jarak & arah antar ibu kota dua negara', m => {
    const a = findCountry(m.args[0] || '')
    const b = findCountry(m.args[1] || '')
    if (!a || !b) return m.reply(`Contoh: ${P}jaraknegara Indonesia Jepang`)
    const km = haversine(a.lat, a.lng, b.lat, b.lng)
    const br = bearing(a.lat, a.lng, b.lat, b.lng)
    const jamTerbang = (km / 850).toFixed(1)
    return m.reply(`✈️ *JARAK ${a.nama.toUpperCase()} ↔ ${b.nama.toUpperCase()}*\n\n${a.bendera} ${a.ibu} → ${b.bendera} ${b.ibu}\n\nJarak   : *${km.toLocaleString('id-ID', { maximumFractionDigits: 0 })} km*\nArah    : ${br.toFixed(1)}° (${compass(br)})\nPerkiraan terbang: ±${jamTerbang} jam (850 km/jam)\n\nBandingkan: ${P}luasnegara ${a.nama}`)
  }, 'Indonesia Jepang'),

  info('negarapbb', ['pbb', 'anggotapbb'], 'Statistik anggota PBB dalam dataset', m => {
    const list = countries()
    const pbb = list.filter(c => c.anggotaPBB)
    const non = list.filter(c => !c.anggotaPBB)
    return m.reply(`🇺🇳 *ANGGOTA PBB*\n\nTotal entitas dataset : ${list.length}\nAnggota PBB           : *${pbb.length}*\nBukan anggota/pengamat: ${non.length}${non.length ? `\n${non.slice(0, 12).map(c => `▸ ${c.bendera} ${c.nama}`).join('\n')}` : ''}`)
  }, '1'),

  info('sebutannegara', ['demonym', 'warganegara'], 'Sebutan warga sebuah negara', m => {
    const q = need(m, 'Prancis'); if (!q) return
    const c = findCountry(q)
    if (!c) return m.reply(`❌ Negara "${q}" tidak ditemukan.`)
    return m.reply(`👥 Warga negara *${c.nama}* ${c.bendera} disebut *${c.sebutan || '-'}*.\n\nBahasa: ${c.bahasa || '-'}\nIbu kota: ${c.ibu || '-'}`)
  }, 'Prancis'),

  /* ================= PROVINSI ================= */
  info('provinsi', ['infoprovinsi'], 'Info provinsi Indonesia', m => {
    const q = need(m, 'Sumatera Utara'); if (!q) return
    const p = findProvince(q)
    if (!p) return m.reply(`❌ Provinsi "${q}" tidak ditemukan.\nDaftar: ${P}provinsilist`)
    const idx = provinces().findIndex(x => x.nama === p.nama) + 1
    return m.reply(`🏞️ *PROVINSI ${p.nama.toUpperCase()}*\n\nIbu kota : ${p.ibu}\nPulau    : ${p.pulau}\nUrutan   : #${idx} dari ${provinces().length}\n\nLihat semua: ${P}provinsipulau ${p.pulau}`)
  }, 'Sumatera Utara'),

  info('cariprovinsi', ['searchprovinsi'], 'Cari provinsi berdasarkan nama/ibukota', m => {
    const q = need(m, 'medan'); if (!q) return
    const hasil = search(provinces(), q, ['nama', 'ibu', 'pulau'], 10)
    return hasil.length
      ? m.reply(`🔎 *Provinsi cocok "${q}"*\n\n${hasil.map(p => `▸ ${p.nama} — ${p.ibu} (${p.pulau})`).join('\n')}`)
      : m.reply(`❌ Tidak ditemukan provinsi untuk "${q}".`)
  }, 'medan'),

  info('provinsirandom', ['randomprovinsi'], 'Provinsi acak', m => {
    const p = pickRandom(provinces())
    return m.reply(`🎲 *${p.nama}*\n\nIbu kota: ${p.ibu}\nPulau: ${p.pulau}`)
  }, '1'),

  info('provinsipulau', ['listpulau', 'pulau'], 'Daftar provinsi per pulau', m => {
    const q = (m.q || '').trim()
    const pulau = [...new Set(provinces().map(p => p.pulau))]
    if (!q) return m.reply(`Pulau tersedia: ${pulau.join(', ')}\nContoh: ${P}provinsipulau Sumatera`)
    const list = provinces().filter(p => p.pulau.toLowerCase() === q.toLowerCase() || p.pulau.toLowerCase().includes(q.toLowerCase()))
    if (!list.length) return m.reply(`❌ Pulau "${q}" tidak ditemukan. Tersedia: ${pulau.join(', ')}`)
    return m.reply(`🏝️ *PROVINSI DI ${list[0].pulau.toUpperCase()}* (${list.length})\n\n${list.map((p, i) => `${i + 1}. ${p.nama} — ${p.ibu}`).join('\n')}`)
  }, 'Sumatera'),

  info('ibukotaprovinsi', ['capitalprovinsi'], 'Ibu kota sebuah provinsi', m => {
    const q = need(m, 'Jawa Barat'); if (!q) return
    const p = findProvince(q)
    return p ? m.reply(`🏛️ Ibu kota *${p.nama}* adalah *${p.ibu}* (${p.pulau}).`) : m.reply(`❌ Provinsi "${q}" tidak ditemukan.`)
  }, 'Jawa Barat'),

  info('jumlahprovinsi', ['statprovinsi'], 'Statistik provinsi Indonesia per pulau', m => {
    const map = {}
    for (const p of provinces()) map[p.pulau] = (map[p.pulau] || 0) + 1
    return m.reply(`🇮🇩 *PROVINSI INDONESIA*\n\nTotal: *${provinces().length} provinsi*\n\n${Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => `▸ ${k}: ${v}`).join('\n')}`)
  }, '1'),

  /* ================= KIMIA ================= */
  info('unsur', ['infounsur', 'kimia'], 'Info unsur kimia (simbol/nama/nomor atom)', m => {
    const q = need(m, 'O'); if (!q) return
    const e = findElement(q)
    if (!e) return m.reply(`❌ Unsur "${q}" tidak ditemukan.\nCari: ${P}carikimia ${q}`)
    return m.reply(`⚗️ *${e.nama.toUpperCase()} (${e.simbol})*\n\nNomor atom : ${e.atom}\nGolongan   : ${e.golongan}\n\nNomor ${e.atom} → posisi ke-${e.atom} di tabel periodik\nLihat golongan: ${P}golongankimia ${e.golongan}`)
  }, 'O'),

  info('atomnomor', ['nomoratom'], 'Unsur berdasarkan nomor atom', m => {
    const q = need(m, '26'); if (!q) return
    const n = Number(q)
    const e = elements().find(x => x.atom === n)
    return e ? m.reply(`🔬 Nomor atom *${n}* = *${e.nama}* (${e.simbol}) — ${e.golongan}`) : m.reply(`❌ Nomor atom ${n} tidak ada (1-118).`)
  }, '26'),

  info('golongankimia', ['listgolongan'], 'Daftar unsur dalam satu golongan', m => {
    const q = need(m, 'Gas mulia'); if (!q) return
    const list = elements().filter(e => e.golongan.toLowerCase().includes(q.toLowerCase()))
    if (!list.length) return m.reply(`❌ Golongan "${q}" tidak ada.\nTersedia: ${GOLONGAN_KIMIA.join(', ')}`)
    return m.reply(`⚗️ *GOLONGAN ${list[0].golongan.toUpperCase()}* (${list.length})\n\n${list.map(e => `▸ ${e.simbol.padEnd(3)} ${e.nama} (${e.atom})`).join('\n')}`)
  }, 'Gas mulia'),

  info('unsurrandom', ['randomunsur'], 'Unsur kimia acak', m => {
    const e = pickRandom(elements())
    return m.reply(`🎲 *${e.nama}* (${e.simbol})\n\nNomor atom: ${e.atom}\nGolongan: ${e.golongan}`)
  }, '1'),

  info('carikimia', ['searchkimia', 'cariunsur'], 'Cari unsur kimia', m => {
    const q = need(m, 'besi'); if (!q) return
    const hasil = search(elements(), q, ['nama', 'simbol', 'golongan'], 10)
    return hasil.length
      ? m.reply(`🔎 *Unsur cocok "${q}"*\n\n${hasil.map(e => `▸ ${e.simbol} — ${e.nama} (${e.atom}, ${e.golongan})`).join('\n')}`)
      : m.reply(`❌ Tidak ada unsur untuk "${q}".`)
  }, 'besi'),

  info('tabelperiodik', ['periodik'], 'Ringkasan tabel periodik per golongan', m => {
    const map = {}
    for (const e of elements()) (map[e.golongan] = map[e.golongan] || []).push(e.simbol)
    return m.reply(`🧪 *TABEL PERIODIK* (${elements().length} unsur)\n\n${Object.entries(map).map(([g, l]) => `▸ *${g}* (${l.length}): ${l.join(' ')}`).join('\n')}\n\nDetail unsur: ${P}unsur <simbol>`)
  }, '1'),

  /* ================= WAKTU & KALENDER ================= */
  info('jamberapa', ['jamsekarang', 'jamdunia'], 'Jam sekarang di berbagai zona waktu', m => {
    const zona = [['Asia/Jakarta', 'WIB'], ['Asia/Makassar', 'WITA'], ['Asia/Jayapura', 'WIT'], ['UTC', 'UTC'], ['Asia/Singapore', 'Singapura'], ['Asia/Tokyo', 'Tokyo'], ['Europe/London', 'London'], ['America/New_York', 'New York']]
    const now = new Date()
    return m.reply(`🕐 *JAM DUNIA*\n${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n${zona.map(([tz, label]) => `▸ ${label.padEnd(9)}: ${now.toLocaleTimeString('id-ID', { timeZone: tz, hour12: false })}`).join('\n')}`)
  }, '1'),

  info('zonawaktu', ['wib'], 'Penjelasan zona waktu Indonesia', m => {
    return m.reply(`🌏 *ZONA WAKTU INDONESIA*\n\n*WIB (UTC+7)* — Sumatera, Jawa, Madura, Kalbar, Kalteng\n  Kota: Jakarta, Medan, Bandung, Surabaya, Semarang, Palembang, Pekanbaru, ${config.owner.city || 'Pontianak'}\n\n*WITA (UTC+8)* — Bali, NTB, NTT, Kalsel, Kaltim, Kaltara, Sulawesi\n  Kota: Denpasar, Makassar, Manado, Balikpapan, Banjarmasin\n\n*WIT (UTC+9)* — Maluku, Maluku Utara, Papua, Papua Barat\n  Kota: Jayapura, Ambon, Ternate, Sorong\n\nSelisih WIB↔WIT: 2 jam\nJam sekarang: ${P}jamberapa`)
  }, '1'),

  info('tanggalsekarang', ['hariini', 'tanggalnow'], 'Info tanggal hari ini', m => {
    const now = new Date()
    const awal = new Date(now.getFullYear(), 0, 1)
    const akhir = new Date(now.getFullYear(), 11, 31)
    const minggu = Math.ceil(((now - awal) / 86400000 + awal.getDay() + 1) / 7)
    const hariKe = Math.ceil((now - awal) / 86400000) + 1
    return m.reply(`📅 *HARI INI*\n\n${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\nHari ke-${hariKe} dari 365 · Minggu ke-${minggu}\nSisa tahun: ${Math.ceil((akhir - now) / 86400000)} hari\nISO: ${now.toISOString().slice(0, 10)}\nWaktu lokal: ${now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB\n\nKalender bulan ini: ${P}kalender`)
  }, '1'),

  info('kalender', ['kalenderbulan'], 'Kalender ASCII: .kalender [bulan] [tahun]', m => {
    const now = new Date()
    let bulan = Number(m.args[0]) - 1
    let tahun = Number(m.args[1] ?? m.args[0])
    if (isNaN(bulan) || bulan < 0 || bulan > 11) { bulan = now.getMonth(); tahun = Number(m.args[0]) || now.getFullYear() }
    if (isNaN(tahun) || tahun < 1900 || tahun > 2200) tahun = now.getFullYear()
    const hariIni = now.getDate() === new Date(tahun, bulan, now.getDate()).getDate() && tahun === now.getFullYear() && bulan === now.getMonth() ? now.getDate() : null
    return m.reply(`🗓️ *KALENDER*\n\n\`\`\`\n${kalenderASCII(tahun, bulan)}\n\`\`\`${hariIni ? `\nHari ini: tanggal ${hariIni}` : ''}\nBulan: ${bulan + 1} · Tahun: ${tahun}`)
  }, '9 2026'),

  info('weton', ['wetonjawa', 'neptu'], 'Hitung weton Jawa + neptu dari tanggal lahir', m => {
    const q = need(m, '1998-05-20'); if (!q) return
    const d = parseDate(q)
    const hari = HARI[d.getDay()]
    const dEpoch = Math.floor(d.getTime() / 86400000) + (d.getTimezoneOffset() ? 0 : 0)
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    const dd = Math.floor(local.getTime() / 86400000)
    const pasaran = PASARAN[((3 + dd) % 5 + 5) % 5]
    const neptu = NEPTU_HARI[hari] + NEPTU_PASARAN[pasaran]
    return m.reply(`☯️ *WETON JAWA*\n\nTanggal : ${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\nWeton   : *${hari} ${pasaran}*\nNeptu   : *${neptu}* (${NEPTU_HARI[hari]} + ${NEPTU_PASARAN[pasaran]})\n\nWatak umum: ${WETON_SIFAT[neptu] || 'Seimbang, tergantung pengalaman hidup'}\n\n💡 Neptu sering dipakai untuk mencari hari baik & kecocokan jodoh (tradisi Jawa — bukan ramalan pasti).`)
  }, '1998-05-20'),

  info('shio', ['shiochina', 'zodiakcina'], 'Shio & elemen dari tahun/tanggal lahir', m => {
    const q = need(m, '1998'); if (!q) return
    const d = /^\d{4}$/.test(q) ? new Date(Number(q), 5, 1) : parseDate(q)
    const tahun = d.getFullYear()
    const shio = SHIO[((tahun - 1900) % 12 + 12) % 12]
    const elemen = SHIO_ELEMEN[((tahun - 1900) % 10 + 10) % 10]
    const emoji = { Tikus: '🐀', Kerbau: '🐂', Macan: '🐅', Kelinci: '🐇', Naga: '🐉', Ular: '🐍', Kuda: '🐎', Kambing: '🐐', Monyet: '🐒', Ayam: '🐓', Anjing: '🐕', Babi: '🐖' }[shio]
    return m.reply(`${emoji} *SHIO ${tahun}*\n\nShio   : *${shio}*\nElemen : ${elemen}\nSiklus : ${((tahun - 1900) % 12 + 12) % 12 + 1}/12\n\nSifat umum: ${SHIO_SIFAT[shio]}\n\n⚠️ Perhitungan memakai tahun Masehi; tahun baru Imlek jatuh antara 21 Jan–20 Feb, jadi kelahiran Januari–pertengahan Februari bisa ikut shio tahun sebelumnya.`)
  }, '1998'),

  info('zodiakdetail', ['bintangdetail', 'zodiak'], 'Zodiak + elemen + sifat dari tanggal lahir', m => {
    const q = need(m, '2000-08-17'); if (!q) return
    const d = parseDate(q)
    const md = [d.getMonth() + 1, d.getDate()]
    let z = null
    for (const x of ZODIAK) {
      const [fm, fd] = x.from, [tm, td] = x.to
      const inRange = fm <= tm
        ? (md[0] > fm || (md[0] === fm && md[1] >= fd)) && (md[0] < tm || (md[0] === tm && md[1] <= td))
        : (md[0] > fm || (md[0] === fm && md[1] >= fd)) || (md[0] < tm || (md[0] === tm && md[1] <= td))
      if (inRange) { z = x; break }
    }
    z = z || ZODIAK[0]
    return m.reply(`♈ *ZODIAK ${z.n.toUpperCase()}*\n\nLahir  : ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\nElemen : ${z.el}\nSifat  : ${z.sifat}\n\nRentang: ${z.from.join('/')} – ${z.to.join('/')}\n\nLihat juga: ${P}shio ${d.getFullYear()} · ${P}weton ${q}`)
  }, '2000-08-17'),

  info('harikerja', ['hari kerja'], 'Hitung hari kerja di antara dua tanggal', m => {
    const [a, b] = [parseDate(m.args[0]), parseDate(m.args[1])]
    if (isNaN(a) || isNaN(b)) return m.reply(`Contoh: ${P}harikerja 2026-01-01 2026-01-31`)
    const [mulai, akhir] = a < b ? [a, b] : [b, a]
    let kerja = 0, libur = 0, sabtu = 0
    for (let d = new Date(mulai); d <= akhir; d.setDate(d.getDate() + 1)) {
      const h = d.getDay()
      if (h === 0) libur++
      else if (h === 6) { sabtu++; kerja++ }
      else kerja++
    }
    const total = Math.round((akhir - mulai) / 86400000) + 1
    return m.reply(`📆 *HARI KERJA*\n\n${mulai.toLocaleDateString('id-ID')} → ${akhir.toLocaleDateString('id-ID')}\n\nTotal hari      : ${total}\nHari kerja (Sen-Sab): *${kerja}*\nMinggu/libur    : ${libur}\nSabtu           : ${sabtu}\nHari kerja murni (Sen-Jum): ${kerja - sabtu}\n\n⚠️ Belum memperhitungkan cuti bersama. Cek: ${P}harilibur`)
  }, '2026-01-01 2026-01-31'),

  info('detiksejaklahir', ['detikhidup', 'lama hidup'], 'Hitung detik/menit/jam sejak tanggal lahir', m => {
    const q = need(m, '2000-08-17'); if (!q) return
    const d = parseDate(q)
    const ms = Date.now() - d.getTime()
    if (ms < 0) return m.reply('⚠️ Tanggalnya di masa depan.')
    return m.reply(`⏱️ *SEJAK ${d.toLocaleDateString('id-ID')}*\n\nDetik  : ${Math.floor(ms / 1000).toLocaleString('id-ID')}\nMenit  : ${Math.floor(ms / 60000).toLocaleString('id-ID')}\nJam    : ${Math.floor(ms / 3600000).toLocaleString('id-ID')}\nHari   : ${Math.floor(ms / 86400000).toLocaleString('id-ID')}\nBulan  : ${Math.floor(ms / 2629800000).toLocaleString('id-ID')}\nTahun  : ${(ms / 31557600000).toFixed(2)}`)
  }, '2000-08-17'),

  info('kutipanhari', ['quoteday', 'kutipan'], 'Kutipan hari ini (tetap sepanjang hari)', m => {
    const bank = quotesBank()
    const cats = Object.keys(bank)
    const now = new Date()
    const seed = now.getFullYear() * 1000 + Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
    const cat = cats[seed % cats.length]
    const arr = bank[cat] || []
    const q = arr[seed % Math.max(1, arr.length)] || randomQuote()
    return m.reply(`💬 *KUTIPAN HARI INI*\n${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n"${typeof q === 'string' ? q : q.teks || q.q || JSON.stringify(q)}"\n\n— kategori: ${cat}\nLainnya: ${P}quote ${pickRandom(cats)}`)
  }, '1'),

  info('harilibur', ['liburnasional', 'harinasional'], 'Hari libur nasional Indonesia (tanggal tetap + Islam)', async m => {
    const tahun = Number(m.args[0]) || new Date().getFullYear()
    const tetap = LIBUR_TETAP.map(([b, t, n]) => ({ d: new Date(tahun, b - 1, t), n, tipe: 'Tetap' }))
    let islam = []
    try {
      const { hijriKeMasehi } = await import('../lib/islami.js')
      for (const [bl, tg, nama] of LIBUR_ISLAM) {
        const r = await hijriKeMasehi(1, tg, 1447 + (tahun - 2026)).catch(() => null)
        if (r?.masehi) islam.push({ d: new Date(r.masehi), n: nama, tipe: 'Hijriah (hisab)' })
      }
    } catch { /* offline: lewati libur Islam */ }
    const semua = [...tetap, ...islam].sort((a, b) => a.d - b.d)
    return m.reply(`🎉 *HARI LIBUR NASIONAL ${tahun}*\n\n${semua.map(x => `▸ ${x.d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} — ${x.n} ${x.tipe === 'Tetap' ? '' : '⚠️'}`).join('\n')}\n\n⚠️ Tanggal Hijriah hasil hisab (bisa bergeser 1 hari). Keputusan resmi: SKB 3 Menteri.\nKonversi tanggal: ${P}hijri · ${P}masehikehijri\nHari besar dunia: ${P}haridunia`)
  }, '2026'),

  info('haridunia', ['hariinternasional'], 'Peringatan/hari besar dunia untuk tanggal tertentu', m => {
    const now = new Date()
    const d = m.q ? parseDate(m.q) : now
    const list = HARI_DUNIA.filter(([b, t]) => b === d.getMonth() + 1 && t === d.getDate())
    const bulanIni = HARI_DUNIA.filter(([b]) => b === d.getMonth() + 1)
    return m.reply(`🌐 *HARI BESAR*\n${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n*Hari ini:* ${list.length ? '\n' + list.map(x => `▸ ${x[2]}`).join('\n') : ' (tidak ada peringatan internasional)'}\n\n*Bulan ${d.toLocaleDateString('id-ID', { month: 'long' })}:*\n${bulanIni.map(x => `▸ ${String(x[1]).padStart(2, '0')}/${String(x[0]).padStart(2, '0')} — ${x[2]}`).join('\n') || '-'}`)
  }, '2026-08-17'),

  /* ================= KONVERSI SATUAN ================= */
  info('konversipanjang', ['panjang', 'satuanpanjang'], 'Konversi panjang: .konversipanjang 5 km m', m => {
    const [v, dari, ke] = m.args
    if (!dari || !ke) return m.reply(`Contoh: ${P}konversipanjang 5 km m\nSatuan: ${Object.keys(PANJANG).join(', ')}`)
    const r = konversi(PANJANG, Number(v), dari, ke)
    return m.reply(`📏 ${fmtNum(Number(v))} ${r.dari} = *${fmtNum(r.hasil)} ${r.ke}*`)
  }, '5 km m'),

  info('konversiberat', ['berat', 'satuanberat'], 'Konversi berat: .konversiberat 2 kg ons', m => {
    const [v, dari, ke] = m.args
    if (!dari || !ke) return m.reply(`Contoh: ${P}konversiberat 2 kg ons\nSatuan: ${Object.keys(BERAT).join(', ')}\n(catatan: 1 ons Indonesia = 100 gram)`)
    const r = konversi(BERAT, Number(v), dari, ke)
    return m.reply(`⚖️ ${fmtNum(Number(v))} ${r.dari} = *${fmtNum(r.hasil)} ${r.ke}*`)
  }, '2 kg ons'),

  info('konversidata', ['data', 'ukurandata'], 'Konversi ukuran data: .konversidata 1500 mb gb', m => {
    const [v, dari, ke] = m.args
    if (!dari || !ke) return m.reply(`Contoh: ${P}konversidata 1500 mb gb\nSatuan: bit, byte, kb, mb, gb, tb, pb (biner 1024)`)
    const r = konversi(DATA, Number(v), dari, ke)
    const bytes = Number(v) * DATA[String(dari).toLowerCase()]
    const desimal = bytes / Math.pow(1000, { bit: 0, byte: 0, b: 0, kb: 1, mb: 2, gb: 3, tb: 4, pb: 5 }[String(ke).toLowerCase()] || 1)
    return m.reply(`💾 ${fmtNum(Number(v))} ${r.dari} = *${fmtNum(r.hasil)} ${r.ke}*\n\nBasis biner (1024) = ${formatSize(bytes)}\nBasis desimal (1000) ≈ ${fmtNum(desimal)} ${r.ke}`)
  }, '1500 mb gb'),

  info('konversiwaktu', ['waktu', 'satuanwaktu'], 'Konversi waktu: .konversiwaktu 3 jam menit', m => {
    const [v, dari, ke] = m.args
    if (!dari || !ke) return m.reply(`Contoh: ${P}konversiwaktu 3 jam menit\nSatuan: ms, detik, menit, jam, hari, minggu, bulan, tahun, dekade, abad`)
    const r = konversi(WAKTU, Number(v), dari, ke)
    return m.reply(`⏳ ${fmtNum(Number(v))} ${r.dari} = *${fmtNum(r.hasil)} ${r.ke}*`)
  }, '3 jam menit'),

  info('konversikecepatan', ['kecepatan', 'satuankecepatan'], 'Konversi kecepatan: .konversikecepatan 100 km/jam mph', m => {
    const [v, dariRaw, keRaw] = m.args
    const dari = dariRaw, ke = keRaw
    if (!dari || !ke) return m.reply(`Contoh: ${P}konversikecepatan 100 km/jam mph\nSatuan: km/jam, m/s, mph, knot, mach, ft/s`)
    const r = konversi(KECEPATAN, Number(v), dari, ke)
    return m.reply(`🚀 ${fmtNum(Number(v))} ${r.dari} = *${fmtNum(r.hasil)} ${r.ke}*`)
  }, '100 km/jam mph'),

  /* ================= INFO SISTEM & BOT ================= */
  info('infoversi', ['versi', 'version'], 'Versi bot, Node.js & platform', m => {
    let ver = '6.0.0'
    try { ver = fs.readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim() } catch { /* default */ }
    return m.reply(`📦 *${config.bot.name}*\n\nVersi bot   : v${ver}\nNode.js     : ${process.version}\nPlatform    : ${os.platform()} ${os.release()} (${os.arch()})\nBaileys     : elaina-baileys\nMode menu   : ${config.display.menuMode || 'auto'}\nPrefix      : ${config.display.prefix}\n\nUpdate: bash update.sh`)
  }, '1'),

  info('infomemori', ['memori', 'ramusage'], 'Pemakaian memori proses bot', m => {
    const mu = process.memoryUsage()
    const tot = os.totalmem(), free = os.freemem()
    return m.reply(`🧠 *MEMORI*\n\n*Proses bot:*\n▸ RSS      : ${formatSize(mu.rss)}\n▸ Heap total: ${formatSize(mu.heapTotal)}\n▸ Heap used : ${formatSize(mu.heapUsed)}\n▸ External : ${formatSize(mu.external)}\n▸ ArrayBuffers: ${formatSize(mu.arrayBuffers || 0)}\n\n*Sistem:*\n▸ Total RAM: ${formatSize(tot)}\n▸ Tersedia : ${formatSize(free)} (${((free / tot) * 100).toFixed(1)}%)\n▸ CPU      : ${os.cpus().length} core (${os.cpus()[0]?.model?.slice(0, 40) || '-'})\n▸ Load avg : ${os.loadavg().map(x => x.toFixed(2)).join(' · ')}`)
  }, '1'),

  info('infosesi', ['uptime', 'runtime2'], 'Uptime bot & sistem', m => {
    const up = process.uptime()
    const sysUp = os.uptime()
    const f = s => `${Math.floor(s / 86400)}h ${Math.floor(s / 3600) % 24}j ${Math.floor(s / 60) % 60}m ${Math.floor(s) % 60}d`
    return m.reply(`⏱️ *UPTIME*\n\nBot    : ${f(up)}\nSistem : ${f(sysUp)}\nHostname: ${os.hostname()}\nUser   : ${os.userInfo().username}\nTemp   : ${os.tmpdir()}\n\nPing: ${P}ping`)
  }, '1'),

  info('datasetinfo', ['infodata', 'datainfo'], 'Jumlah data tiap file dataset bot', m => {
    const dir = new URL('../data/', import.meta.url)
    const rows = []
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) {
      try {
        const j = JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'))
        const n = Array.isArray(j) ? j.length : Object.values(j).reduce((a, v) => a + (Array.isArray(v) ? v.length : 1), 0)
        const size = fs.statSync(new URL(f, dir)).size
        rows.push({ f: f.replace('.json', ''), n, size })
      } catch { /* lewati file rusak */ }
    }
    return m.reply(`🗂️ *DATASET BOT* (${rows.length} file)\n\n${rows.sort((a, b) => b.n - a.n).map(r => `▸ ${r.f.padEnd(16)} ${String(r.n).padStart(5)} data · ${formatSize(r.size)}`).join('\n')}\n\nTotal ukuran: ${formatSize(rows.reduce((a, b) => a + b.size, 0))}`)
  }, '1'),

  info('kategorimenu', ['infokategori', 'statkategori'], 'Statistik jumlah command per kategori', m => {
    return import('../lib/plugins.js').then(({ categories }) => {
      const cats = [...categories()].sort((a, b) => b[1].length - a[1].length)
      const total = cats.reduce((a, b) => a + b[1].length, 0)
      return m.reply(`📚 *KATEGORI FITUR* (${cats.length} kategori · ${total} command)\n\n${cats.map(([k, v]) => `▸ ${k.padEnd(16)} ${String(v.length).padStart(4)} fitur ${'█'.repeat(Math.round(v.length / cats[0][1].length * 10))}`).join('\n')}\n\nBuka submenu: ${P}menu`)
    })
  }, '1'),

  info('fiturterpopuler', ['cmdterpopuler', 'topcommand'], 'Command paling sering dipakai', m => {
    return import('../lib/database.js').then(({ getStats }) => {
      const s = getStats()
      const hits = Object.entries(s.commands || s.commandHits || s.hits || {}).sort((a, b) => b[1] - a[1]).slice(0, 12)
      return m.reply(`📈 *COMMAND TERPOPULER*\n\nTotal pesan diproses: ${(s.total || 0).toLocaleString('id-ID')}\n\n${hits.length ? hits.map(([k, v], i) => `${i + 1}. ${P}${k} — ${v}×`).join('\n') : '(belum ada data pemakaian)'}`)
    })
  }, '1'),

  info('infostorage', ['diskusage', 'storage'], 'Pemakaian disk folder bot & database', m => {
    const sizeOf = dir => {
      let total = 0
      const walk = d => {
        let entries = []
        try { entries = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
        for (const e of entries) {
          if (['node_modules', '.git', 'tmp', 'session'].includes(e.name)) continue
          const p = path.join(d, e.name)
          try { if (e.isDirectory()) walk(p); else total += fs.statSync(p).size } catch { /* lewati */ }
        }
      }
      walk(dir)
      return total
    }
    const root = path.resolve(new URL('../', import.meta.url).pathname)
    const dbDir = path.resolve(root, config.databaseFolder || 'database')
    const stats = fs.statfsSync ? fs.statfsSync(root) : null
    return m.reply(`💽 *STORAGE*\n\nFolder bot   : ${formatSize(sizeOf(root))}\nDatabase     : ${formatSize(sizeOf(dbDir))}\n${stats ? `Disk total   : ${formatSize(stats.blocks * stats.bsize)}\nDisk bebas   : ${formatSize(stats.bavail * stats.bsize)}\n` : ''}\nFolder diabaikan: node_modules, .git, tmp`)
  }, '1'),

  info('infoconfig', ['konfigurasi', 'setting'], 'Lihat konfigurasi bot (aman, tanpa rahasia)', m => {
    const mask = n => String(n).slice(0, 4) + '****' + String(n).slice(-2)
    return m.reply(`⚙️ *KONFIGURASI*\n\nNama bot   : ${config.bot.name}\nPrefix     : ${config.display.prefix}\nOwner      : ${mask(config.owner.number)}\nMode menu  : ${config.display.menuMode || 'auto'}\nMode login : ${config.bot.usePairingCode === null ? 'tanya saat start' : config.bot.usePairingCode ? 'pairing code' : 'QR'}\nLimit      : ${config.limits.default}/hari · cooldown ${config.limits.cooldown}s\nAI model   : ${config.ai.model}\nAuto-reply AI: ${config.ai.autoReply ? 'aktif' : 'nonaktif'}\nFolder sesi: ${config.sessionFolder || 'session'}\n\nGanti setting: ${P}setmenu · ${P}aion/${P}aioff`)
  }, '1'),

  info('infouser', ['statistikuser'], 'Statistik pengguna & grup (owner)', m => {
    return import('../lib/database.js').then(({ allUsers, allGroups }) => {
      const u = allUsers(), g = allGroups()
      const prem = u.filter(x => x.premium).length
      const banned = u.filter(x => x.banned).length
      const reg = u.filter(x => x.registered).length
      const totalLimit = u.reduce((a, b) => a + (b.limit || 0), 0)
      const totalKoin = u.reduce((a, b) => a + (b.koin || b.coin || 0), 0)
      return m.reply(`👥 *STATISTIK PENGGUNA*\n\nUser tersimpan : ${u.length}\nGrup aktif     : ${g.length}\nTerdaftar      : ${reg}\nPremium        : ${prem}\nDibanned       : ${banned}\n\nTotal limit beredar: ${totalLimit.toLocaleString('id-ID')}\nTotal koin beredar : ${totalKoin.toLocaleString('id-ID')}\nRata-rata level    : ${u.length ? (u.reduce((a, b) => a + (b.level || 1), 0) / u.length).toFixed(1) : 0}`)
    })
  }, '1', { owner: true })
]

export default { infolabCmds }
