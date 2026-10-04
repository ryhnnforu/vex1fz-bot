/**
 * 🕌 ISLAMI — submenu baru (v6)
 * ------------------------------------------------------------
 *  Jadwal sholat (Kemenag RI, api.aladhan.com), arah kiblat,
 *  kalender & konversi Hijriah, Al-Qur'an (surah/ayat/tafsir,
 *  api.quran.gading.dev), 99 Asmaul Husna + arti Indonesia,
 *  443 doa + 27 doa harian, 42 hadits Arbain, 25 Nabi,
 *  niat & tata cara ibadah, dzikir + tasbih counter,
 *  kalkulator zakat/waris, countdown Ramadan/Idul Fitri/Idul Adha.
 *
 *  Semua data lokal di-cache dari data/*.json (lib/datasets.js).
 */
import { config } from '../config.js'
import { chunkText, pickRandom, formatDuration } from '../lib/functions.js'
import { getUser, saveDB } from '../lib/database.js'
import {
  prayerTimes, qiblaCity, hijriToday, masehiKeHijri, hijriKeMasehi,
  surahDetail, ayahDetail, puasaSunnahInfo,
  hitungZakatMal, hitungZakatPenghasilan, hitungZakatFitrah, hitungWaris,
  NABI, NIAT, TATACARA, DZIKIR, BULAN_HIJRI,
  surahs, asmaulHusna, duas, duaCategories, doaHarian, haditsArbain, search
} from '../lib/islami.js'
import { compass } from '../lib/datasets.js'

const P = config.display.prefix
const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID')

const err = (m, e) => m.reply(`⚠️ ${String(e?.message || e).slice(0, 160)}\n\nCek koneksi internet, atau coba lagi beberapa saat.`)

/* ------------------------------------------------------------------ */
/*  JADWAL SHOLAT                                                      */
/* ------------------------------------------------------------------ */
async function jadwal (m, fokus) {
  const kota = (m.q || '').trim() || 'Jakarta'
  try {
    const d = await prayerTimes(kota)
    const list = Object.entries(d.times)
    const garis = list.map(([k, v]) => `${k === fokus ? '▶️' : '  '} *${k.padEnd(10)}* : ${v} WIB`).join('\n')
    // hitung waktu terdekat
    const now = new Date()
    const [jamNow, mntNow] = [now.getHours(), now.getMinutes()]
    let terdekat = null
    for (const [k, v] of list) {
      const [h, mi] = v.split(':').map(Number)
      let diff = (h * 60 + mi) - (jamNow * 60 + mntNow)
      if (diff < 0) diff += 24 * 60
      if (!terdekat || diff < terdekat.diff) terdekat = { k, v, diff }
    }
    let txt = `🕌 *JADWAL SHOLAT — ${d.kota}*\n` +
      `📅 ${d.hijri}\n🗓️ ${d.masehi}\n` +
      `📐 Metode: ${d.metode}${d.zona ? ' · ' + d.zona : ''}\n\n${garis}\n`
    if (terdekat) {
      txt += `\n⏳ *${terdekat.k}* ${terdekat.v} — ${Math.floor(terdekat.diff / 60)} jam ${terdekat.diff % 60} menit lagi`
    }
    if (fokus) txt += `\n\n✅ Yang kamu tanyakan: *${fokus}* pukul *${d.times[fokus] || '-'}*`
    return await m.reply(txt)
  } catch (e) { return err(m, e) }
}

export const jadwalSholat = {
  command: ['sholat', 'jadwalsholat', 'waktusholat', 'jadwalshalat', 'sholat5waktu'],
  category: 'Islami',
  description: 'Jadwal sholat 5 waktu + imsak (Kemenag RI) per kota',
  limit: 0,
  run: m => jadwal(m)
}

export const waktuSholatCmds = [
  ['Imsak', ['imsak', 'imsakiyah']],
  ['Subuh', ['subuh', 'fajar', 'sholatsubuh']],
  ['Syuruq', ['syuruq', 'terbit', 'matahariterbit']],
  ['Dzuhur', ['dzuhur', 'zuhur', 'lohor', 'sholatdzuhur']],
  ['Ashar', ['ashar', 'asar', 'sholatasar']],
  ['Maghrib', ['maghrib', 'magrib', 'sholatmaghrib', 'buka']],
  ['Isya', ['isya', 'isyak', 'sholatisya']]
].map(([waktu, alias]) => ({
  command: alias,
  category: 'Islami',
  description: `Waktu ${waktu} hari ini per kota`,
  limit: 0,
  run: m => jadwal(m, waktu)
}))

/* ------------------------------------------------------------------ */
/*  KALENDER HIJRIAH                                                   */
/* ------------------------------------------------------------------ */
export const hijriahHariIni = {
  command: ['hijriah', 'tanggalhijriah', 'hijri', 'kalenderhijriah'],
  category: 'Islami',
  description: 'Tanggal Hijriah hari ini + puasa sunnah yang dianjurkan',
  limit: 0,
  run: async m => {
    try {
      const h = await hijriToday()
      const puasa = puasaSunnahInfo(h.tanggal, h.bulanAngka, h.hari)
      return await m.reply(
        `📅 *KALENDER HIJRIAH*\n\n` +
        `Hijriah : *${h.teks}*\n` +
        `Masehi  : ${h.masehi} (${h.hari})\n\n` +
        `*Bulan ${BULAN_HIJRI[(h.bulanAngka || 1) - 1]}*\n` +
        puasa.map(x => '▸ ' + x).join('\n') +
        `\n\nKonversi tanggal: ${P}hijrike 25-12-2026 · ${P}masehike 01-07-1448`
      )
    } catch (e) { return err(m, e) }
  }
}

export const keHijriah = {
  command: ['hijrike', 'gtohijri', 'masehikehijri', 'tomasehi'],
  category: 'Islami',
  description: 'Konversi tanggal Masehi → Hijriah (dd-mm-yyyy)',
  limit: 0,
  run: async m => {
    const tgl = (m.args[0] || '').trim()
    if (!/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return m.reply(`Format: ${P}hijrike 25-12-2026`)
    try {
      const h = await masehiKeHijri(tgl)
      return m.reply(`🗓️ ${h.masehi} (Masehi)\n🕌 = *${h.hijri}*`)
    } catch (e) { return err(m, e) }
  }
}

export const keMasehi = {
  command: ['masehike', 'htog', 'hijritomasehi', 'kemasehi'],
  category: 'Islami',
  description: 'Konversi tanggal Hijriah → Masehi (dd-mm-yyyy)',
  limit: 0,
  run: async m => {
    const tgl = (m.args[0] || '').trim()
    if (!/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return m.reply(`Format: ${P}masehike 01-09-1447`)
    try {
      const g = await hijriKeMasehi(tgl)
      return m.reply(`🕌 ${g.hijriPanjang || g.hijri} (Hijriah)\n🗓️ = *${g.masehiPanjang || g.masehi}*${g.hari ? ' — hari ' + g.hari : ''}`)
    } catch (e) { return err(m, e) }
  }
}

export const arahKiblat = {
  command: ['kiblat', 'arahkiblat', 'qibla'],
  category: 'Islami',
  description: 'Arah kiblat dari kota tertentu (derajat dari utara)',
  limit: 0,
  run: async m => {
    const kota = (m.q || '').trim() || 'Jakarta'
    try {
      const q = await qiblaCity(kota)
      return m.reply(
        `🧭 *ARAH KIBLAT — ${kota.toUpperCase()}*\n\n` +
        `Arah   : *${q.direction.toFixed(1)}°* dari Utara (searah jarum jam)\n` +
        `Kompas : ${compass(q.direction)}\n` +
        `Koordinat: ${q.lat}, ${q.lng}\n\n` +
        `💡 Putar badan/kompas ke ${q.direction.toFixed(0)}° — itulah arah Kakbah.`
      )
    } catch (e) { return err(m, e) }
  }
}

/* ------------------------------------------------------------------ */
/*  AL-QUR'AN                                                          */
/* ------------------------------------------------------------------ */
export const daftarSurah = {
  command: ['surah', 'daftarsurah', 'listsurah', 'surat'],
  category: 'Islami',
  description: 'Daftar 114 surah / detail satu surah (.surah 18)',
  limit: 0,
  run: async m => {
    const q = (m.args[0] || '').trim()
    if (!q) {
      const list = surahs()
      const txt = list.map(s => `${String(s.no).padStart(3)}. ${s.nama} (${s.arti}) — ${s.ayat} ayat, ${s.tipe}`)
      const out = `📖 *114 SURAH AL-QUR'AN*\n\n${txt.join('\n')}\n\nBaca detail: ${P}surah 18\nBaca ayat: ${P}ayat 18:1`
      const parts = chunkText(out, 3800)
      for (const p of parts.slice(0, 3)) await m.reply(p)
      return { handled: true }
    }
    try {
      const s = await surahDetail(isNaN(Number(q)) ? (search(surahs(), q, ['nama', 'arti'], 1)[0]?.no || q) : Number(q))
      let txt = `📖 *SURAH ${s.nama.toUpperCase()}* (${s.arab})\n` +
        `Arti: ${s.arti} · ${s.ayat} ayat · ${s.tipe}\n\n` +
        (s.verses || []).slice(0, 10).map(v => `*${v.no}.* ${v.ar}\n_${v.id}_`).join('\n\n')
      if (s.ayat > 10) txt += `\n\n… ${s.ayat - 10} ayat lagi → ${P}quran ${s.no}`
      const parts = chunkText(txt, 3800)
      for (const p of parts) await m.reply(p)
      return { handled: true }
    } catch (e) { return err(m, e) }
  }
}

export const bacaQuran = {
  command: ['quran', 'bacaquran', 'bacasurah'],
  category: 'Islami',
  description: 'Baca satu surah penuh (arab + terjemahan)',
  limit: 1,
  run: async m => {
    const no = Number(m.args[0])
    if (!no || no < 1 || no > 114) return m.reply(`Format: ${P}quran 36  (nomor surah 1-114)`)
    try {
      const s = await surahDetail(no)
      const head = `📖 *SURAH ${s.nama.toUpperCase()}* — ${s.arti} (${s.ayat} ayat)\n\n`
      const body = (s.verses || []).map(v => `*${v.no}.* ${v.ar}\n${v.id}`).join('\n\n')
      const parts = chunkText(head + body, 3800)
      await m.reply(`Mengirim surah ${s.nama} (${s.ayat} ayat) dalam ${parts.length} bagian…`)
      for (const p of parts.slice(0, 8)) await m.reply(p)
      if (parts.length > 8) await m.reply(`…sisa ${parts.length - 8} bagian tidak dikirim (surah terlalu panjang).`)
      return { handled: true }
    } catch (e) { return err(m, e) }
  }
}

export const bacaAyat = {
  command: ['ayat', 'ayatalquran', 'verse'],
  category: 'Islami',
  description: 'Satu ayat + terjemahan (format 2:255)',
  limit: 0,
  run: async m => {
    const [s, a] = String(m.args[0] || '').split(/[:.\-/]/).map(Number)
    if (!s || !a) return m.reply(`Format: ${P}ayat 2:255  (surah:ayat)`)
    try {
      const v = await ayahDetail(s, a)
      return m.reply(`📖 *QS. ${v.namaSurah}: ${v.no}*\n\n${v.ar}\n\n${v.latin ? '_' + v.latin + '_\n\n' : ''}${v.id}`)
    } catch (e) { return err(m, e) }
  }
}

export const tafsirAyat = {
  command: ['tafsir', 'tafsirayat'],
  category: 'Islami',
  description: 'Tafsir ringkas satu ayat (format 17:32)',
  limit: 1,
  run: async m => {
    const [s, a] = String(m.args[0] || '').split(/[:.\-/]/).map(Number)
    if (!s || !a) return m.reply(`Format: ${P}tafsir 17:32`)
    try {
      const v = await ayahDetail(s, a)
      const t = String(v.tafsir || '').replace(/<[^>]+>/g, '')
      const out = `📚 *TAFSIR QS. ${v.namaSurah}: ${v.no}*\n\n${v.ar}\n\n*Terjemahan:*\n${v.id}\n\n*Tafsir:*\n${t || '(tafsir tidak tersedia)'}`
      const parts = chunkText(out, 3800)
      for (const p of parts.slice(0, 3)) await m.reply(p)
      return { handled: true }
    } catch (e) { return err(m, e) }
  }
}

export const surahAcak = {
  command: ['surahacak', 'randomsurah', 'ayatacak', 'randomayat'],
  category: 'Islami',
  description: 'Surah & ayat acak beserta terjemahannya',
  limit: 0,
  run: async m => {
    try {
      const list = surahs()
      const s = pickRandom(list)
      const ayat = Math.floor(Math.random() * s.ayat) + 1
      const v = await ayahDetail(s.no, ayat)
      return m.reply(`🎲 *AYAT ACAK — QS. ${v.namaSurah}: ${v.no}*\n\n${v.ar}\n\n${v.id}\n\nTafsir: ${P}tafsir ${s.no}:${ayat}`)
    } catch (e) { return err(m, e) }
  }
}

// surah-surah populer (pintasan)
export const surahPopulerCmds = [
  [['alfatihah', 'alfathiah'], 1, 'Al-Fatihah'],
  [['ayatkursi'], null, 'Ayat Kursi (Al-Baqarah 255)'],
  [['alikhlas', 'ikhlas'], 112, 'Al-Ikhlas'],
  [['alfalaq', 'falaq'], 113, 'Al-Falaq'],
  [['annas', 'naas'], 114, 'An-Nas'],
  [['yasin', 'yasinan'], 36, 'Yasin'],
  [['almulk', 'mulk'], 67, 'Al-Mulk'],
  [['arrahman', 'rahman'], 55, 'Ar-Rahman'],
  [['alkahfi', 'kahfi'], 18, 'Al-Kahfi'],
  [['alwaqiah', 'waqiah'], 56, 'Al-Waqiah'],
  [['albaqarah'], 2, 'Al-Baqarah'],
  [['aliimran'], 3, 'Ali Imran'],
  [['attaubah'], 9, 'At-Taubah'],
  [['maryam'], 19, 'Maryam'],
  [['assajdah'], 32, 'As-Sajdah']
].map(([alias, no, nama]) => ({
  command: alias,
  category: 'Islami',
  description: `Baca ${nama}`,
  limit: 1,
  run: async m => {
    try {
      if (no === null) {
        const v = await ayahDetail(2, 255)
        return m.reply(`📖 *AYAT KURSI — QS. Al-Baqarah: 255*\n\n${v.ar}\n\n${v.latin ? '_' + v.latin + '_\n\n' : ''}${v.id}`)
      }
      const s2 = await surahDetail(no)
      const body = (s2.verses || []).map(v => `*${v.no}.* ${v.ar}\n${v.id}`).join('\n\n')
      const parts = chunkText(`📖 *SURAH ${s2.nama.toUpperCase()}* (${s2.arti}, ${s2.ayat} ayat)\n\n` + body, 3800)
      await m.reply(`📖 ${s2.nama} — ${parts.length} bagian`)
      for (const p of parts.slice(0, 5)) await m.reply(p)
      if (parts.length > 5) await m.reply(`…${parts.length - 5} bagian berikutnya tidak dikirim (surah panjang). Pakai ${P}ayat ${no}:<no ayat>`)
      return { handled: true }
    } catch (e) { return err(m, e) }
  }
}))

/* ------------------------------------------------------------------ */
/*  ASMAUL HUSNA                                                       */
/* ------------------------------------------------------------------ */
export const asmaulHusnaCmd = {
  command: ['asmaulhusna', 'asmaul', 'asmaallah', '99nama'],
  category: 'Islami',
  description: 'Asmaul Husna acak / nomor tertentu (.asmaul 55)',
  limit: 0,
  run: m => {
    const list = asmaulHusna()
    const q = (m.args[0] || '').trim()
    let a = null
    if (/^\d+$/.test(q)) a = list.find(x => x.no === Number(q))
    else if (q) a = search(list, q, ['latin', 'id', 'en'], 1)[0]
    if (!a) a = pickRandom(list)
    if (!a) return m.reply('Data Asmaul Husna tidak ditemukan.')
    return m.reply(
      `✨ *ASMAUL HUSNA #${a.no}*\n\n${a.ar}\n*${a.latin}*\n\n` +
      `Arti (ID): ${a.id}\nArti (EN): ${a.en}\n` +
      (a.desc ? `\n💭 ${a.desc}` : '') +
      `\n\nBerikutnya: ${P}asmaul ${a.no >= 99 ? 1 : a.no + 1}`
    )
  }
}

export const daftarAsmaul = {
  command: ['daftarasmaulhusna', 'asmaulall', 'listasmaul'],
  category: 'Islami',
  description: 'Daftar lengkap 99 Asmaul Husna + arti Indonesia',
  limit: 1,
  run: async m => {
    const txt = asmaulHusna().map(a => `${String(a.no).padStart(2)}. *${a.latin}* — ${a.id}`).join('\n')
    const parts = chunkText(`🕌 *99 ASMAUL HUSNA*\n\n${txt}`, 3800)
    for (const p of parts) await m.reply(p)
    return { handled: true }
  }
}

/* ------------------------------------------------------------------ */
/*  DOA                                                                */
/* ------------------------------------------------------------------ */
export const doaCmd = {
  command: ['doa', 'caridoа', 'caridoa', 'doapencarian'],
  category: 'Islami',
  description: 'Cari 443 doa (.doa rezeki / .doa untuk orang sakit)',
  limit: 0,
  run: m => {
    const q = (m.q || '').trim()
    const list = duas()
    if (!q) {
      const d = pickRandom(list)
      return m.reply(`🤲 *DOA — ${d.nama}*\n\n${d.ar}\n\n${d.latin ? '_' + d.latin + '_\n\n' : ''}${d.en}\n\n_Kategori: ${d.kat}_\nCari doa lain: ${P}doa <kata kunci>`)
    }
    const hit = search(list, q, ['nama', 'kat'], 5)
    if (!hit.length) {
      const kat = duaCategories()
      return m.reply(`Doa "${q}" tidak ditemukan.\n\nKategori tersedia:\n${kat.map(c => `▸ ${c.slug} (${c.jumlah})`).join('\n')}\n\nContoh: ${P}doa travel · ${P}doa exam · ${P}doakategori gratitude`)
    }
    return m.reply(hit.map(d =>
      `🤲 *${d.nama}*\n${d.ar}\n${d.latin ? '_' + d.latin + '_\n' : ''}${d.en}\n_(kategori: ${d.kat})_`
    ).join('\n\n──────────\n\n'))
  }
}

export const doaKategori = {
  command: ['doakategori', 'kategoridoa', 'listdoa'],
  category: 'Islami',
  description: 'Daftar 29 kategori doa (.doakategori travel)',
  limit: 0,
  run: m => {
    const q = (m.args[0] || '').trim().toLowerCase()
    const kat = duaCategories()
    if (!q) {
      return m.reply(`📚 *29 KATEGORI DOA*\n\n${kat.map(c => `▸ *${c.slug}* — ${c.nama} (${c.jumlah})`).join('\n')}\n\nLihat isi: ${P}doakategori travel`)
    }
    const c = kat.find(k => k.slug === q || k.nama.toLowerCase().includes(q))
    if (!c) return m.reply(`Kategori "${q}" tidak ada. Ketik ${P}doakategori`)
    const list = duas().filter(d => d.kat === c.slug).slice(0, 5)
    return m.reply(`📚 *${c.nama.toUpperCase()}* (${c.slug})\n${c.desc}\n\n` +
      list.map(d => `🤲 ${d.nama}\n${d.ar}\n${d.en}`).join('\n\n') +
      (duas().filter(d => d.kat === c.slug).length > 5 ? `\n\n…dan ${duas().filter(d => d.kat === c.slug).length - 5} doa lainnya (cari: ${P}doa <kata>)` : ''))
  }
}

export const doaHarianCmd = {
  command: ['doaharian', 'doaseharihari', 'doapopuler'],
  category: 'Islami',
  description: '27 doa harian (makan, tidur, keluar rumah, dll) + detail per nomor',
  limit: 0,
  run: m => {
    const list = doaHarian()
    const no = Number(m.args[0])
    if (no >= 1 && no <= list.length) {
      const d = list[no - 1]
      return m.reply(`🤲 *${d.judul.toUpperCase()}*\n\n${d.arab}\n\n_${d.latin}_\n\n*Artinya:*\n${d.arti}`)
    }
    return m.reply(
      `🤲 *DOA HARIAN (27)*\n\n` +
      list.map(d => `${String(d.no).padStart(2)}. ${d.judul}`).join('\n') +
      `\n\nLihat isi: ${P}doaharian 1`
    )
  }
}

/* ------------------------------------------------------------------ */
/*  HADITS                                                             */
/* ------------------------------------------------------------------ */
export const haditsCmd = {
  command: ['hadits', 'hadis', 'haditsarbain', 'arbain'],
  category: 'Islami',
  description: 'Hadits Arbain Nawawi acak / per nomor (.hadits 5)',
  limit: 0,
  run: m => {
    const list = haditsArbain()
    const no = Number(m.args[0])
    let h = null
    if (no >= 1 && no <= list.length) h = list[no - 1]
    else if (m.q) h = search(list, m.q, ['title', 'id'], 1)[0]
    if (!h) h = pickRandom(list)
    if (!h) return m.reply('Data hadits tidak ditemukan.')
    const terjemahan = h.id || h.translation || h.arti || ''
    return m.reply(
      `📜 *HADITS ARBAIN #${h.no}* — ${h.title || ''}\n\n${h.ar || ''}\n\n` +
      (h.id_text || h.terjemahan ? `_${h.id_text || h.terjemahan}_\n\n` : '') +
      (typeof terjemahan === 'string' && terjemahan ? `*Terjemahan:*\n${terjemahan.slice(0, 1200)}` : '')
    )
  }
}

export const daftarHadits = {
  command: ['daftarhadits', 'listhadits', 'haditslist'],
  category: 'Islami',
  description: 'Daftar 42 judul hadits Arbain Nawawi',
  limit: 0,
  run: m => {
    const list = haditsArbain()
    return m.reply(`📜 *42 HADITS ARBAIN NAWAWI*\n\n${list.map(h => `${String(h.no).padStart(2)}. ${h.title}`).join('\n')}\n\nBaca: ${P}hadits 1`)
  }
}

/* ------------------------------------------------------------------ */
/*  NIAT & TATA CARA                                                   */
/* ------------------------------------------------------------------ */
const tampilNiat = (m, key) => {
  const n = NIAT[key]
  if (!n) {
    return m.reply(`Tidak ada niat "${key}".\n\nTersedia:\n${Object.keys(NIAT).join(', ')}\n\nContoh: ${P}niat wudhu`)
  }
  return m.reply(`🤲 *${n.judul.toUpperCase()}*\n\n${n.arab}\n\n_${n.latin}_\n\n*Artinya:*\n${n.arti}`)
}

export const niatCmd = {
  command: ['niat', 'bacaanniat'],
  category: 'Islami',
  description: 'Niat ibadah (wudhu, tayamum, mandi, sholat, puasa, zakat, kurban)',
  limit: 0,
  run: m => {
    const key = String(m.args[0] || '').toLowerCase()
    if (!key || !NIAT[key]) {
      return m.reply(`🤲 *DAFTAR NIAT*\n\n${Object.entries(NIAT).map(([k, v]) => `▸ ${P}niat *${k}* — ${v.judul}`).join('\n')}`)
    }
    return tampilNiat(m, key)
  }
}

export const niatCmds = [
  ['niatwudhu', 'wudhu'], ['niattayamum', 'tayamum'], ['niatmandi', 'mandi'],
  ['niatmandiwajib', 'mandi'], ['niatmandijunub', 'mandi'],
  ['niatsholatsubuh', 'subuh'], ['niatsholatdzuhur', 'dzuhur'], ['niatsholatasar', 'ashar'],
  ['niatsholatmaghrib', 'maghrib'], ['niatsholatisya', 'isya'], ['niatsholatjumat', 'jumat'],
  ['niatdhuha', 'dhuha'], ['niattahajud', 'tahajud'], ['niatwitir', 'witir'], ['niattarawih', 'tarawih'],
  ['niatpuasa', 'puasa'], ['niatpuasaramadhan', 'puasa'], ['niatpuasasenin', 'senin'],
  ['niatpuasakamis', 'kamis'], ['niatpuasaqadha', 'qadha'], ['niatpuasaayyamulbidh', 'senin'],
  ['niatbuka', 'buka'], ['doabuka', 'buka'], ['doabukapuasa', 'buka'],
  ['niatzakatfitrah', 'zakatfitrah'], ['niatzakatmal', 'zakatmal'], ['niatqurban', 'qurban'],
  ['niatistikharah', 'istikharah']
].map(([alias, key]) => ({
  command: [alias],
  category: 'Islami',
  description: NIAT[key].judul,
  limit: 0,
  run: m => tampilNiat(m, key)
}))

const tampilCara = (m, key) => {
  const t = TATACARA[key]
  if (!t) return m.reply(`Tersedia: ${Object.keys(TATACARA).join(', ')}`)
  let out = `📘 *${t.judul.toUpperCase()}*\n`
  if (t.syarat) out += `\n*Syarat:* ${t.syarat}\n`
  if (t.penyebab) out += `\n*Sebab:* ${t.penyebab}\n`
  out += `\n${t.langkah.map((l, i) => `*${i + 1}.* ${l}`).join('\n')}`
  return m.reply(out)
}

export const tataCara = {
  command: ['tatacara', 'caraberibadah'],
  category: 'Islami',
  description: 'Tata cara ibadah (wudhu, tayamum, mandi wajib, sholat, puasa, zakat)',
  limit: 0,
  run: m => {
    const key = String(m.args[0] || '').toLowerCase()
    if (!key || !TATACARA[key]) {
      return m.reply(`📘 *TATA CARA IBADAH*\n\n${Object.entries(TATACARA).map(([k, v]) => `▸ ${P}tatacara *${k}* — ${v.judul}`).join('\n')}`)
    }
    return tampilCara(m, key)
  }
}

export const tatacaraCmds = [
  ['carawudhu', 'wudhu'], ['caratayamum', 'tayamum'], ['caramandiwajib', 'mandi'],
  ['carasholat', 'sholat'], ['carapuasa', 'puasa'], ['carazakatfitrah', 'zakatfitrah']
].map(([alias, key]) => ({
  command: [alias],
  category: 'Islami',
  description: TATACARA[key].judul,
  limit: 0,
  run: m => tampilCara(m, key)
}))

/* ------------------------------------------------------------------ */
/*  DZIKIR & TASBIH COUNTER                                            */
/* ------------------------------------------------------------------ */
export const dzikirCmd = {
  command: ['dzikir', 'zikir', 'dzikirlist'],
  category: 'Islami',
  description: 'Panduan dzikir (setelah sholat, pagi, petang) + tasbih counter',
  limit: 0,
  run: m => m.reply(
    `📿 *DZIKIR & TASBIH*\n\n` +
    `▸ ${P}dzikirshalat — dzikir setelah sholat fardhu\n` +
    `▸ ${P}dzikirpagi — dzikir pagi\n` +
    `▸ ${P}dzikirpetang — dzikir petang\n` +
    `▸ ${P}tasbih — penghitung dzikir (tombol +1 / +10 / reset)\n\n` +
    `Total dzikir kamu tersimpan di profil.`
  )
}

export const dzikirShalat = {
  command: ['dzikirshalat', 'dzikirsholat', 'dzikirsetelahsholat', 'wirid'],
  category: 'Islami',
  description: 'Bacaan dzikir setelah sholat fardhu + jumlah hitungannya',
  limit: 0,
  run: m => m.reply(
    `📿 *DZIKIR SETELAH SHOLAT*\n\n` +
    DZIKIR.shalat.map(d =>
      `*${d.bacaan}* ×${d.jumlah}\n${d.arab ? d.arab + '\n' : ''}${d.latin ? '_' + d.latin + '_\n' : ''}${d.arti}`
    ).join('\n\n')
  )
}

export const dzikirPagi = {
  command: ['dzikirpagi', 'zikirpagi'],
  category: 'Islami',
  description: 'Panduan dzikir pagi',
  limit: 0,
  run: m => m.reply(`🌅 *DZIKIR PAGI*\n\n${DZIKIR.pagi.map((d, i) => `${i + 1}. ${d}`).join('\n')}`)
}

export const dzikirPetang = {
  command: ['dzikirpetang', 'zikirpetang'],
  category: 'Islami',
  description: 'Panduan dzikir petang',
  limit: 0,
  run: m => m.reply(`🌆 *DZIKIR PETANG*\n\n${DZIKIR.petang.map((d, i) => `${i + 1}. ${d}`).join('\n')}`)
}

function dzikirDB (m) {
  const u = getUser(m.senderKey || m.sender)
  if (!u.dzikir) { u.dzikir = { total: 0, tasbih: 0, istighfar: 0, sholawat: 0, tahmid: 0, takbir: 0 }; saveDB('users') }
  return u.dzikir
}

export const tasbih = {
  command: ['tasbih', 'dzikirhitung', 'hitungdzikir'],
  category: 'Islami',
  description: 'Penghitung dzikir: .tasbih [+jumlah | reset | jenis]',
  limit: 0,
  run: async m => {
    const d = dzikirDB(m)
    const arg = String(m.args[0] || '').toLowerCase()
    const jenis = ['tasbih', 'istighfar', 'sholawat', 'tahmid', 'takbir'].includes(arg) ? arg : 'tasbih'
    const n = Number(String(arg).replace(/[^0-9]/g, ''))

    if (arg === 'reset') {
      d.tasbih = d.istighfar = d.sholawat = d.tahmid = d.takbir = 0; d.total = 0
      saveDB('users')
      return m.reply('🧹 Semua hitungan dzikir direset.')
    }
    if (n > 0) {
      d[jenis] = (d[jenis] || 0) + n
      d.total = (d.total || 0) + n
      saveDB('users')
    }
    const teks =
      `📿 *TASBIH — ${m.sender.split('@')[0]}*\n\n` +
      `Subhanallah (tasbih) : ${d.tasbih}\nIstighfar            : ${d.istighfar}\nSholawat             : ${d.sholawat}\nTahmid               : ${d.tahmid}\nTakbir               : ${d.takbir}\n` +
      `────────────────\n*TOTAL: ${d.total}*\n\n` +
      `Tambah: ${P}tasbih 33 · Reset: ${P}tasbih reset`
    try {
      return await m.sendButtons({
        title: '📿 Tasbih',
        text: teks,
        buttons: [
          { text: '+1', id: `${P}tasbih 1` },
          { text: '+10', id: `${P}tasbih 10` },
          { text: '+33', id: `${P}tasbih 33` },
          { text: 'Reset', id: `${P}tasbih reset` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

export const istighfar = {
  command: ['istighfar', 'sholawat', 'tahlil'],
  category: 'Islami',
  description: 'Hitung dzikir tertentu: .istighfar 100 / .sholawat 50',
  limit: 0,
  run: m => {
    const d = dzikirDB(m)
    const jenis = m.command === 'sholawat' ? 'sholawat' : m.command === 'tahlil' ? 'tahmid' : 'istighfar'
    const n = Math.max(1, Number(String(m.args[0] || '1').replace(/[^0-9]/g, '')) || 1)
    d[jenis] = (d[jenis] || 0) + n
    d.total = (d.total || 0) + n
    saveDB('users')
    return m.reply(`✅ +${n} ${jenis} — total ${jenis} kamu: *${d[jenis]}* (grand total ${d.total})\nLihat: ${P}tasbih`)
  }
}

/* ------------------------------------------------------------------ */
/*  NABI & RASUL                                                       */
/* ------------------------------------------------------------------ */
export const nabiCmd = {
  command: ['nabi', 'rasul', 'kisahnabi', '25nabi'],
  category: 'Islami',
  description: 'Daftar 25 Nabi & Rasul / kisah satu nabi (.nabi musa)',
  limit: 0,
  run: m => {
    const q = (m.q || '').trim()
    if (!q) {
      return m.reply(`🕋 *25 NABI & RASUL*\n\n${NABI.map((n, i) => `${String(i + 1).padStart(2)}. *${n.nama}*${n.ululAzmi ? ' ⭐' : ''} — ${n.gelar}`).join('\n')}\n\n⭐ = Ulul Azmi\nKisah: ${P}nabi Musa`)
    }
    const n = NABI.find(x => x.nama.toLowerCase() === q.toLowerCase()) ||
      search(NABI, q, ['nama', 'gelar', 'kaum'], 1)[0]
    if (!n) return m.reply(`Nabi "${q}" tidak ditemukan. Ketik ${P}nabi untuk daftar 25 nabi.`)
    return m.reply(
      `🕋 *NABI ${n.nama.toUpperCase()}*${n.ululAzmi ? ' ⭐ (Ulul Azmi)' : ''}\n\n` +
      `Gelar  : ${n.gelar}\nKaum   : ${n.kaum}\n\n*Kisah ringkas:*\n${n.kisah}`
    )
  }
}

export const ululAzmi = {
  command: ['ululazmi', 'nabiululazmi'],
  category: 'Islami',
  description: '5 Nabi Ulul Azmi dan keistimewaannya',
  limit: 0,
  run: m => m.reply(
    `⭐ *5 NABI ULUL AZMI*\n\n` +
    NABI.filter(n => n.ululAzmi).map(n => `*${n.nama}* (${n.kaum})\n${n.kisah}`).join('\n\n') +
    `\n\nUlul Azmi = rasul dengan ketabahan luar biasa dalam dakwah.`
  )
}

/* ------------------------------------------------------------------ */
/*  KALKULATOR ZAKAT & WARIS                                           */
/* ------------------------------------------------------------------ */
export const zakatMal = {
  command: ['zakatmal', 'zakatharta', 'hitungzakat'],
  category: 'Islami',
  description: 'Hitung zakat mal: .zakatmal <harta> [hargaEmas/gram]',
  limit: 0,
  run: m => {
    const harta = Number(String(m.args[0] || '').replace(/[^0-9]/g, ''))
    const emas = Number(String(m.args[1] || '1500000').replace(/[^0-9]/g, '')) || 1500000
    if (!harta) return m.reply(`Format: ${P}zakatmal 200000000 1500000\n(harta total, harga emas per gram — default 1,5 juta)`)
    const h = hitungZakatMal(harta, emas)
    return m.reply(
      `💰 *KALKULATOR ZAKAT MAL*\n\nHarta        : ${rp(h.harta)}\nNisab (85 gr emas) : ${rp(h.nisab)}\nHarga emas/gram : ${rp(h.hargaEmasPerGram)}\n\n` +
      `Status : ${h.wajib ? '✅ WAJIB zakat (harta ≥ nisab, dimiliki 1 tahun)' : '❌ Belum wajib (harta di bawah nisab)'}\n` +
      `Zakat 2,5% : *${rp(h.zakat)}*`
    )
  }
}

export const zakatPenghasilan = {
  command: ['zakatpenghasilan', 'zakatgaji', 'zakatprofesi'],
  category: 'Islami',
  description: 'Hitung zakat penghasilan: .zakatpenghasilan <gaji/bulan> [hargaEmas]',
  limit: 0,
  run: m => {
    const gaji = Number(String(m.args[0] || '').replace(/[^0-9]/g, ''))
    const emas = Number(String(m.args[1] || '1500000').replace(/[^0-9]/g, '')) || 1500000
    if (!gaji) return m.reply(`Format: ${P}zakatpenghasilan 8000000 1500000`)
    const h = hitungZakatPenghasilan(gaji, emas)
    return m.reply(
      `💰 *ZAKAT PENGHASILAN*\n\nGaji/bulan   : ${rp(gaji)}\nSetahun      : ${rp(h.harta)}\nNisab        : ${rp(h.nisab)}\n\n` +
      `Status : ${h.wajib ? '✅ Wajib' : '❌ Belum wajib (di bawah nisab setahun)'}\n` +
      `Zakat 2,5% : *${rp(h.zakat)}* (≈ ${rp(Math.round(h.zakat / 12))}/bulan)`
    )
  }
}

export const zakatFitrah = {
  command: ['zakatfitrah', 'hitungfitrah'],
  category: 'Islami',
  description: 'Hitung zakat fitrah: .zakatfitrah <jiwa> [hargaBeras/kg]',
  limit: 0,
  run: m => {
    const jiwa = Number(String(m.args[0] || '1').replace(/[^0-9]/g, '')) || 1
    const harga = Number(String(m.args[1] || '13000').replace(/[^0-9]/g, '')) || 13000
    const z = hitungZakatFitrah(jiwa, harga)
    return m.reply(
      `🌾 *ZAKAT FITRAH*\n\nJiwa     : ${z.jiwa}\nBeras    : *${z.kg} kg* (atau ${z.liter} liter)\n` +
      `Uang     : *${rp(z.rupiah)}* (asumsi ${rp(z.hargaBerasPerKg)}/kg)\n\n${TATACARA.zakatfitrah.langkah.slice(0, 4).map((l, i) => `${i + 1}. ${l}`).join('\n')}`
    )
  }
}

export const warisCmd = {
  command: ['waris', 'faraidh', 'hitungwaris'],
  category: 'Islami',
  description: 'Hitung waris sederhana: .waris <harta> istri1 anakl2 anakp1',
  limit: 0,
  run: m => {
    const harta = Number(String(m.args[0] || '').replace(/[^0-9]/g, ''))
    if (!harta) {
      return m.reply(
        `⚖️ *KALKULATOR WARIS (faraidh sederhana)*\n\nFormat:\n${P}waris <totalHarta> <ahli...>\n\n` +
        `Kode ahli: suami · istri[n] · anakl[n] (laki) · anakp[n] (perempuan) · ayah · ibu\n\n` +
        `Contoh:\n${P}waris 240000000 istri1 anakl2 anakp1\n${P}waris 100000000 suami ayah ibu\n\n` +
        `⚠️ Hasil perhitungan kasar — untuk pembagian resmi hubungi KUA/ahli faraidh.`
      )
    }
    const ahli = { suami: 0, istri: 0, anakL: 0, anakP: 0, ayah: 0, ibu: 0 }
    for (const tok of m.args.slice(1)) {
      const t = String(tok).toLowerCase()
      const n = Number(t.replace(/[^0-9]/g, '')) || 1
      if (t.startsWith('suami')) ahli.suami = n
      else if (t.startsWith('istri')) ahli.istri = n
      else if (t.startsWith('anakl') || t.startsWith('anaklaki')) ahli.anakL = n
      else if (t.startsWith('anakp') || t.startsWith('anakper')) ahli.anakP = n
      else if (t.startsWith('ayah') || t.startsWith('bapak')) ahli.ayah = n
      else if (t.startsWith('ibu')) ahli.ibu = n
    }
    if (!Object.values(ahli).some(v => v > 0)) return m.reply('Sebutkan minimal satu ahli waris. Contoh: ' + P + 'waris 240000000 istri1 anakl2')
    const h = hitungWaris(harta, ahli)
    return m.reply(
      `⚖️ *PERHITUNGAN WARIS*\n\nHarta: *${rp(h.totalHarta)}*\n\n` +
      h.hasil.map(x => `▸ *${x.nama}* (${x.porsi}) = ${rp(x.nilai)}\n   ${x.catatan}`).join('\n') +
      (h.sisa > 1000 ? `\n\nSisa (untuk ashabah/kerabat): ${rp(h.sisa)}` : '') +
      `\n\n⚠️ Perhitungan sederhana; kasus khusus (utang, wasiat, saudara, kakek/nenek) konsultasikan ke KUA.`
    )
  }
}

/* ------------------------------------------------------------------ */
/*  PUASA SUNNAH & COUNTDOWN HARI BESAR                                */
/* ------------------------------------------------------------------ */
export const puasaSunnah = {
  command: ['puasasunnah', 'jadwalpuasa', 'puasahariini'],
  category: 'Islami',
  description: 'Puasa sunnah yang dianjurkan hari ini + jadwal sepekan',
  limit: 0,
  run: async m => {
    try {
      const h = await hijriToday()
      const info = puasaSunnahInfo(h.tanggal, h.bulanAngka, h.hari)
      return m.reply(
        `🌙 *PUASA SUNNAH — ${h.teks}*\n\n` + info.map(x => '▸ ' + x).join('\n') +
        `\n\n*Rutinan:*\n▸ Senin & Kamis\n▸ Ayyamul Bidh: 13, 14, 15 setiap bulan Hijriah\n▸ Pertengahan Syakban, Arafah (9 Zulhijah), Asyura (10 Muharram)\n\nNiat: ${P}niatpuasasenin · ${P}niatpuasakamis`
      )
    } catch (e) { return err(m, e) }
  }
}

async function countdownHijri (m, bulan, tanggal, judul, emoji) {
  try {
    const h = await hijriToday()
    const now = new Date()
    let target = null
    for (const tahun of [h.tahun, h.tahun + 1]) {
      const tgl = `${String(tanggal).padStart(2, '0')}-${String(bulan).padStart(2, '0')}-${tahun}`
      try {
        const g = await hijriKeMasehi(tgl)
        const [dd, mm, yyyy] = g.masehi.split('-').map(Number)
        const d = new Date(yyyy, mm - 1, dd)
        if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          target = { date: d, teks: g.masehi, tahun }
          break
        }
      } catch {}
    }
    if (!target) throw new Error('Tidak bisa menghitung tanggal')
    const selisih = Math.round((target.date - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
    return m.reply(
      `${emoji} *COUNTDOWN ${judul}*\n\n` +
      `${tanggal} ${BULAN_HIJRI[bulan - 1]} ${target.tahun} H\n= *${target.teks}* (Masehi)\n\n` +
      `⏳ *${selisih} hari lagi*${selisih === 0 ? ' — HARI INI! 🎉' : ''} (${formatDuration(selisih * 86400000)})`
    )
  } catch (e) { return err(m, e) }
}

export const countRamadhan = {
  command: ['ramadhan', 'countdownramadhan', 'puasaramadhan', 'hitungramadhan'],
  category: 'Islami',
  description: 'Hitung mundur menuju 1 Ramadan',
  limit: 0,
  run: m => countdownHijri(m, 9, 1, 'RAMADHAN', '🌙')
}

export const countIdulFitri = {
  command: ['lebaran', 'idulfitri', 'idulfitiri', 'countdownlebaran'],
  category: 'Islami',
  description: 'Hitung mundur menuju 1 Syawal (Idul Fitri)',
  limit: 0,
  run: m => countdownHijri(m, 10, 1, 'IDUL FITRI', '🎉')
}

export const countIdulAdha = {
  command: ['iduladha', 'qurban', 'countdownqurban', 'hajiraya'],
  category: 'Islami',
  description: 'Hitung mundur menuju 10 Zulhijah (Idul Adha)',
  limit: 0,
  run: m => countdownHijri(m, 12, 10, 'IDUL ADHA', '🐑')
}

export const countMaulid = {
  command: ['maulid', 'maulidnabi', 'countdownmaulid'],
  category: 'Islami',
  description: 'Hitung mundur menuju 12 Rabiul Awal (Maulid Nabi)',
  limit: 0,
  run: m => countdownHijri(m, 3, 12, 'MAULID NABI', '🕌')
}

export const countTahunBaru = {
  command: ['tahunbaruislam', '1muharram', 'muharram'],
  category: 'Islami',
  description: 'Hitung mundur menuju 1 Muharram (Tahun Baru Islam)',
  limit: 0,
  run: m => countdownHijri(m, 1, 1, 'TAHUN BARU ISLAM', '📅')
}

/* ------------------------------------------------------------------ */
/*  MENU ISLAMI                                                        */
/* ------------------------------------------------------------------ */
export const menuIslami = {
  command: ['menuislami', 'islami', 'islam'],
  category: 'Islami',
  description: 'Menu lengkap fitur Islami',
  limit: 0,
  run: async m => {
    const teks =
      `🕌 *MENU ISLAMI — ${config.bot.name}*\n\n` +
      `*Jadwal & Waktu*\n` +
      `▸ ${P}sholat [kota] — 5 waktu + imsak\n▸ ${P}subuh / ${P}dzuhur / ${P}ashar / ${P}maghrib / ${P}isya\n` +
      `▸ ${P}kiblat [kota] · ${P}hijriah · ${P}puasasunnah\n\n` +
      `*Al-Qur'an*\n▸ ${P}surah [no] · ${P}quran 36 · ${P}ayat 2:255 · ${P}tafsir 17:32\n` +
      `▸ ${P}alfatihah ${P}yasin ${P}almulk ${P}arrahman ${P}alkahfi ${P}ayatkursi\n\n` +
      `*Doa, Dzikir, Hadits*\n▸ ${P}doaharian · ${P}doa <kata> · ${P}doakategori\n` +
      `▸ ${P}asmaulhusna · ${P}hadits · ${P}dzikir · ${P}tasbih\n\n` +
      `*Ibadah*\n▸ ${P}niat <wudhu|puasa|sholat…> · ${P}tatacara <wudhu|mandi…>\n` +
      `▸ ${P}nabi <nama> · ${P}ululazmi\n\n` +
      `*Hitungan*\n▸ ${P}zakatmal · ${P}zakatpenghasilan · ${P}zakatfitrah · ${P}waris\n` +
      `▸ ${P}ramadhan · ${P}lebaran · ${P}iduladha · ${P}maulid\n\n` +
      `*Audio Al-Qur'an (per ayat)*\n▸ ${P}audiomurottal 2:74 — bacaan murottal (Alafasy)\n` +
      `▸ ${P}audiotilawah 2:74 — bacaan tilawah (Al-Husaree)`
    try {
      return await m.sendButtons({
        title: '🕌 Menu Islami',
        text: teks,
        buttons: [
          { text: '🕐 Jadwal Sholat', id: `${P}sholat` },
          { text: '📖 Daftar Surah', id: `${P}surah` },
          { text: '🤲 Doa Harian', id: `${P}doaharian` },
          { text: '📿 Dzikir', id: `${P}dzikir` },
          { text: '🏠 Menu Utama', id: 'act:menu:main' }
        ]
      })
    } catch { return m.reply(teks) }
  }
}
