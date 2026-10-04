/**
 * ============================================================
 *  lib/turnamen.js — TURNAMEN KUIS ANTAR-USER (v7.7.3)
 * ------------------------------------------------------------
 *  Turnamen tebak-tebakan antarmember GRUP, digerakkan oleh alur
 *  pesan (tanpa timer berantai — tahan restart server-side):
 *
 *    • `.turnamen mulai [n]`  → bot menampilkan N soal (bank statis
 *      TEBAK KATA/ASAH OTAK + 12 bank gameslab, diacak sekali)
 *    • member menjawab di chat bebas → yang BENAR pertama dapat poin
 *    • 60 detik tanpa jawaban → jawaban dibuka, lanjut soal berikutnya
 *    • selesai → podium + PNG scorecard (lib/scorecard.js) +
 *      hadiah uang RPG & EXP (terbatas, tanpa inflasi)
 *
 *  Hook: `periksaTurnamen(m)` dipanggil handler untuk pesan NON-perintah
 *  (sudah diteliti hanya bila ada turnamen aktif di chat itu — murah).
 * ============================================================
 */
import { TEBAK_KATA, ASAH_OTAK } from '../features/games.js'
import {
  NABI, SINGKATAN, LOGIKA, HEWAN, GUNUNG, LAUT, MAKANAN,
  SEJARAH, OLAHRAGA, FILM, LIRIK, ILMU
} from '../features/gameslab.js'
import { pickRandom } from './functions.js'
import { addExp, addMoney } from './rpg.js'

/* ------------------------------------------------------------------ */
/*  BANK SOAL TERPADU (~180 entri, jenis dicatat)                      */
/* ------------------------------------------------------------------ */
const bankMentah = []
const dorong = (jenis, arr, petunjuk) => {
  for (const it of arr) {
    if (!it || !it.q || !it.a) continue
    bankMentah.push({ jenis, q: String(it.q), a: String(it.a), petunjuk: petunjuk || '' })
  }
}
dorong('tebak-kata', TEBAK_KATA)
dorong('asah-otak', ASAH_OTAK)
dorong('nabi', NABI)
dorong('singkatan', SINGKATAN, 'jawab bentuk singkatan/kata penuhnya bila slot memerlukan')
dorong('logika', LOGIKA)
dorong('hewan', HEWAN)
dorong('gunung', GUNUNG)
dorong('laut', LAUT)
dorong('makanan', MAKANAN)
dorong('sejarah', SEJARAH)
dorong('olahraga', OLAHRAGA)
dorong('film', FILM)
dorong('lirik', LIRIK)
dorong('ilmu', ILMU)

const NAMA_JENIS = {
  'tebak-kata': '🔤 Tebak Kata', 'asah-otak': '🧠 Asah Otak', nabi: '🕌 Nabi',
  singkatan: '🔠 Singkatan', logika: '🧩 Logika', hewan: '🐘 Hewan',
  gunung: '⛰️ Gunung', laut: '🌊 Laut', makanan: '🍜 Makanan',
  sejarah: '📜 Sejarah', olahraga: '⚽ Olahraga', film: '🎬 Film',
  lirik: '🎵 Lirik', ilmu: '🔬 Ilmu'
}

export function bankSoal () { return bankMentah.slice() }

function norm (s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim() }
function samaJawaban (input, jawaban) {
  input = norm(input); jawaban = norm(jawaban)
  if (!input || !jawaban) return false
  if (input === jawaban) return true
  if (input.length > 2 && jawaban.includes(input)) return true
  /* toleransi jawaban bersambung (mis. "matahari terbit dari timur" vs "timur") */
  const kataInput = input.split(' ')
  const kataJawab = jawaban.split(' ')
  if (kataInput.length === 1 && kataJawab.some(k => k === input)) return true
  return false
}

/* ------------------------------------------------------------------ */
/*  SESI (in-memory; mati bersih saat bot restart)                     */
/* ------------------------------------------------------------------ */
const sesi = new Map() /* jid -> sesi turnamen */
export function sesiOf (jid) { return sesi.get(jid) || null }
export function hapusSesi (jid) { sesi.delete(jid) }

const DURASI_SOAL = 60000
const BATAS_MULAI = 8
const BATAS_SOAL = 15 /* maks soal */

export const HADIAH = {
  koin: { 1: 800, 2: 400, 3: 200 },
  expBenar: 20, expJuara: 100
}

/**
 * Buka turnamen. { total, oleh }
 * @returns {sesi} atau { err }
 */
export function mulaiTurnamen (jid, { total = 7, oleh = '' } = {}) {
  if (sesi.has(jid)) return { err: 'Sedang ada turnamen berjalan di grup ini' }
  total = Math.max(3, Math.min(BATAS_SOAL, Math.round(Number(total) || BATAS_MULAI)))
  const bank = bankSoal()
  const daftar = []
  const dipakai = new Set()
  let guard = 0
  while (daftar.length < total && guard++ < total * 10) {
    const s = pickRandom(bank)
    const kunci = norm(s.q).slice(0, 40)
    if (dipakai.has(kunci)) continue
    dipakai.add(kunci)
    daftar.push(s)
  }
  const s = {
    aktif: true, jid, total: daftar.length, idx: 0,
    daftar, current: daftar[0] || null, batasTs: Date.now() + DURASI_SOAL,
    skor: new Map(), oleh, mulai: Date.now(), nomor4iklan: 1
  }
  sesi.set(jid, s)
  return { sesi: s }
}

const fmtSoal = (s, satu = false) =>
  (satu ? '' : `🏆 *TURNAMEN KUIS* (soal ${s.idx + 1}/${s.total})\n\n`) +
  `${NAMA_JENIS[s.current.jenis] || '❓'} *${s.current.q}*\n` +
  `_Jawab di chat ini · waktu ±${Math.max(0, Math.round((s.batasTs - Date.now()) / 1000))} detik_` +
  (s.current.petunjuk ? `\n_${s.current.petunjuk}_` : '')

/** teks memulai turnamen (yang dikirim feature-nya) */
export function pembukaan (s) {
  return `🏆 *TURNAMEN KUIS DIMULAI!*' — ${s.total} soal\n\n` +
    `Siapa cepat dan benar menang!\n` +
    `• Points: 100 dasar + bonus cepat (maks ~+120)\n` +
    `• 60 detik per soal\n` +
    `• Podium dapat hadiah koin & EXP\n\n` +
    fmtSoal(s, true)
}


/** periksa batas waktu soal saat ini; kalau lewat, buka jawaban + lanjut */
function cekBatas (s) {
  if (!s || Date.now() <= s.batasTs) return null
  const jawaban = s.current.a
  let teks = `⏰ *WAKTU HABIS* — jawabannya: *${jawaban}*\n\n`
  if (!lanjut(s)) {
    teks += ringkasAkhir(s)
    const tamat = selesaiTurnamen(s.jid)
    return { tipe: 'habis-waktu', teks, tamat }
  }
  teks += fmtSoal(s, true)
  return { tipe: 'habis-waktu', teks }
}

/** maju ke soal berikutnya; false kalau habis */
function lanjut (s) {
  s.idx++
  if (s.idx >= s.total) return false
  s.current = s.daftar[s.idx]
  s.batasTs = Date.now() + DURASI_SOAL
  return true
}

function arrSkor (s) {
  return [...s.skor.entries()]
    .map(([kunci, d]) => ({ kunci, ...d }))
    .sort((a, b) => b.poin - a.poin || a.kunci.localeCompare(b.kunci))
    .slice(0, 12)
}

/** teks papan skor akhir (dipakai di akhir & .turnamen skor) */
export function ringkasSkor (s, { judul = 'STANDING' } = {}) {
  const arr = arrSkor(s)
  if (!arr.length) return '📊 Belum ada yang dapat poin.'
  const podium = ['🥇', '🥈', '🥉']
  return `${judul}\n` + arr.map((x, i) =>
    `${podium[i] || (i + 1) + '.'} @${x.kunci.split('@')[0]} — *${x.poin}* pt (${x.benar} benar)`.trim()
  ).join('\n')
}

/**
 * Jika benar: catat poin, tambahkan EXP per jawaban, lanjutkan soal,
 * dan kalau habis → tutup turnamen dengan hadiah.
 * Mengembalikan objek respons atau null (bukan jawaban benar).
 */
export async function jawabMasuk (m, opts = {}) {
  const s = sesi.get(m.jid)
  if (!s) return null
  /* cek waktu habis dulu */
  const habis = cekBatas(s)
  let teks = ''
  if (habis) teks = habis.teks + '\n\n'
  if (habis?.tamat) return { tipe: 'habis-waktu', teks, tamat: habis.tamat, skor: arrSkor(s) }

  const kunci = m.senderKey || m.sender
  if (!samaJawaban(m.text, s.current.a)) return teks ? { tipe: 'gagal', teks } : null

  /* benar! */
  const sisaDetik = Math.max(0, Math.round((s.batasTs - Date.now()) / 1000))
  const poin = 100 + Math.min(120, sisaDetik * 2)
  const rec = s.skor.get(kunci) || { poin: 0, benar: 0 }
  rec.poin += poin
  rec.benar += 1
  s.skor.set(kunci, rec)
  try { addExp(kunci, HADIAH.expBenar) } catch {}

  teks += `✅ *JAWABAN BENAR!* @${(m.sender || '').split('@')[0]} +${poin} pt ⚡\n` +
    `_(${rec.benar} benar · total ${rec.poin} pt)_\n\n`
  if (!lanjut(s)) {
    teks += ringkasAkhir(s)
    const tamat = selesaiTurnamen(s.jid)
    return { tipe: 'selesai', teks, tamat, skor: arrSkor(s) }
  }
  teks += fmtSoal(s, true)
  return { tipe: 'benar-lanjut', teks, skor: arrSkor(s) }
}

function ringkasAkhir (s) {
  return `🏁 *TURNAMEN SELESAI!* 🏁\n\n` + ringkasSkor(s, { judul: '🏆 PODIUM AKHIR\n' }) + '\n\n'
}

/**
 * Tutup turnamen: beri hadiah (koin & EXP juara), hapus sesi.
 * @returns { podiumGhifBaris, juara, recap }
 */
export function selesaiTurnamen (jid) {
  const s = sesi.get(jid)
  if (!s) return null
  const arr = arrSkor(s)
  const podium = []
  for (let i = 0; i < Math.min(3, arr.length); i++) {
    const x = arr[i]
    const koin = HADIAH.koin[i + 1] || 0
    try {
      if (koin) addMoney(x.kunci, koin)
      if (i === 0) addExp(x.kunci, HADIAH.expJuara)
    } catch {}
    podium.push({ nama: '@' + x.kunci.split('@')[0], poin: x.poin, benar: x.benar, koin })
  }
  sesi.delete(jid)
  return {
    podium,
    totalSoal: s.total,
    partisipan: s.skor.size
  }
}

/** batal tanpa hadiah */
export function batalTurnamen (jid) {
  const ada = sesi.delete(jid)
  return ada
}
