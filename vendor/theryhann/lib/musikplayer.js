/**
 * ============================================================
 *  lib/musikplayer.js — ENGINE PEMUTAR MUSIK ".play2"  (v7.4)
 * ------------------------------------------------------------
 *  Player musik bergaya **Spotify** di dalam AIRichResponseMessage:
 *  satu kartu "Now Playing" (cover art, judul, artis, progress bar,
 *  antrian) yang di-LIVE-EDIT, dikendalikan dengan mengetuk pill.
 *
 *  Sumber audio (gratis, tanpa API key):
 *    • Deezer  (utama)    → preview MP3 30 detik + cover art
 *    • iTunes  (cadangan) → preview AAC/M4A 30 detik + artwork
 *
 *  PENTING: file ini ada di lib/ (bukan features/) karena loader
 *  fitur memuat features/*.js dengan cache-buster, sehingga Map sesi
 *  harus hidup di module yang selalu di-import tanpa cache-buster.
 * ============================================================
 */
import { AIRich } from '../shims/elaina.mjs'
import { config } from '../config.js'
import { truncate } from './functions.js'
import { loadDB, saveDB } from './database.js'
import { playerSessions, sessSet, sessGet, sessClear } from './gamestore.js'
import { sendHtmlApp } from './htmlapp.js'
import { playerHtml, playerTeks } from './musikhtml.js'
import { ambilLirik } from './lirik.js'

/* teruskan supaya features/ cukup mengimpor dari engine ini */
export { playerHtml, playerTeks }

const P = config.display.prefix
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
const TTL = 30 * 60 * 1000          // sesi player hidup 30 menit
const DURASI_PREVIEW = 30           // detik audio yang tersedia dari Deezer/iTunes
const TICK_MS = 5000                // interval update progress (live-edit)
const MAKS_ANTRIAN = 10

/* ------------------------------------------------------------------ */
/*  SESI                                                                */
/* ------------------------------------------------------------------ */
/**
 * simpan sesi. PENTING: sessSet() menyalin objek ({...data}), jadi fungsi ini
 * MENGEMBALIKAN referensi yang benar-benar tersimpan di Map. Selalu pakai nilai
 * kembaliannya untuk memutasi state, kalau tidak perubahan akan hilang.
 */
export function setSes (jid, data, ttl = TTL) {
  sessSet(playerSessions, jid, data, ttl)
  return playerSessions.get(jid)
}
export const getSes = jid => sessGet(playerSessions, jid)
/** perpanjang masa aktif sesi tiap ada interaksi */
export function sentuh (s) { if (s) s.expires = Date.now() + TTL }
export const clearSes = jid => {
  const s = getSes(jid)
  if (s) hentikanTicker(s)
  return sessClear(playerSessions, jid)
}

/* ---- pilihan durasi (.play/.play2/.play3 → tombol 30 dtk / full) ---- */
const pilihanMap = new Map()
const TOKEN_ABJAD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function simpanPilihan (data, ttl = 10 * 60 * 1000) {
  let token = ''
  for (let i = 0; i < 6; i++) token += TOKEN_ABJAD[Math.floor(Math.random() * TOKEN_ABJAD.length)]
  sessSet(pilihanMap, token, data, ttl)
  return token
}
export const ambilPilihan = t => sessGet(pilihanMap, String(t || '').toUpperCase())
export const hapusPilihan = t => sessClear(pilihanMap, String(t || '').toUpperCase())

/* ------------------------------------------------------------------ */
/*  DATABASE FAVORIT & RIWAYAT  (database/musik.json)                   */
/* ------------------------------------------------------------------ */
export function getMusik (key) {
  const db = loadDB('musik', {})
  if (!db[key]) { db[key] = { suka: [], riwayat: [], terakhir: '', totalPutar: 0 }; saveDB('musik') }
  const u = db[key]
  u.suka = u.suka || []; u.riwayat = u.riwayat || []; u.totalPutar = u.totalPutar || 0
  return u
}
export function simpanMusik () { saveDB('musik') }

function ringkasTrack (t) {
  return {
    id: t.id, judul: t.judul, artis: t.artis, album: t.album || '',
    cover: t.cover || '', coverKecil: t.coverKecil || '', durasiAsli: t.durasiAsli || 0,
    sumber: t.sumber || 'Deezer', link: t.link || '', waktu: Date.now()
  }
}
/** suka / batal suka. URL preview TIDAK disimpan (bisa kedaluwarsa) → dicari ulang saat diputar */
export function toggleSuka (key, t) {
  const u = getMusik(key)
  const i = u.suka.findIndex(x => x.id === t.id || (x.judul === t.judul && x.artis === t.artis))
  if (i >= 0) { u.suka.splice(i, 1); simpanMusik(); return false }
  u.suka.unshift(ringkasTrack(t))
  u.suka = u.suka.slice(0, 100)
  simpanMusik()
  return true
}
export const isSuka = (key, t) => !!t && getMusik(key).suka.some(x => x.id === t.id || (x.judul === t.judul && x.artis === t.artis))
export function catatPutar (key, t, query) {
  const u = getMusik(key)
  u.riwayat.unshift({ ...ringkasTrack(t), query: query || '' })
  u.riwayat = u.riwayat.slice(0, 50)
  u.totalPutar++
  if (query) u.terakhir = query
  simpanMusik()
}

/* ------------------------------------------------------------------ */
/*  PENCARIAN LAGU                                                      */
/* ------------------------------------------------------------------ */
async function getJSON (url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

/** Deezer: preview MP3 30 detik + cover art */
export async function cariDeezer (q, limit = MAKS_ANTRIAN) {
  const j = await getJSON(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`)
  return (j.data || []).filter(t => t.preview).map(t => ({
    id: 'dz' + t.id,
    judul: t.title_short || t.title || 'Tanpa judul',
    artis: t.artist?.name || 'Artis tidak diketahui',
    album: t.album?.title || '',
    cover: t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || '',
    coverKecil: t.album?.cover_medium || t.album?.cover || '',
    durasiAsli: t.duration || 0,
    preview: t.preview,
    mime: 'audio/mpeg',
    sumber: 'Deezer',
    explicit: !!t.explicit_lyrics,
    link: t.link || ''
  }))
}

/** iTunes: preview AAC/M4A 30 detik (cadangan kalau Deezer kosong/gagal) */
export async function cariItunes (q, limit = MAKS_ANTRIAN) {
  const j = await getJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=${limit}`)
  return (j.results || []).filter(t => t.previewUrl).map(t => ({
    id: 'it' + t.trackId,
    judul: t.trackName || 'Tanpa judul',
    artis: t.artistName || 'Artis tidak diketahui',
    album: t.collectionName || '',
    cover: (t.artworkUrl100 || '').replace('100x100', '600x600'),
    coverKecil: t.artworkUrl100 || '',
    durasiAsli: Math.round((t.trackTimeMillis || 0) / 1000),
    preview: t.previewUrl,
    mime: 'audio/mp4',
    sumber: 'iTunes',
    explicit: t.trackExplicitness === 'explicit',
    link: t.trackViewUrl || ''
  }))
}

/** cari dengan fallback otomatis */
export async function cariLagu (q, limit = MAKS_ANTRIAN) {
  let galat = null
  try {
    const d = await cariDeezer(q, limit)
    if (d.length) return d
  } catch (e) { galat = e }
  try {
    const i = await cariItunes(q, limit)
    if (i.length) return i
  } catch (e) { galat = galat || e }
  if (galat) throw galat
  return []
}

/* ------------------------------------------------------------------ */
/*  UNDUH AUDIO PREVIEW (dengan cache kecil)                            */
/* ------------------------------------------------------------------ */
const cacheAudio = new Map()
export async function unduhPreview (t) {
  if (!t?.preview) throw new Error('lagu ini tidak punya preview audio')
  if (cacheAudio.has(t.id)) return cacheAudio.get(t.id)
  const r = await fetch(t.preview, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) })
  if (!r.ok) throw new Error(`gagal unduh audio (HTTP ${r.status})`)
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 20000) throw new Error('audio preview tidak valid (terlalu kecil)')
  cacheAudio.set(t.id, buf)
  while (cacheAudio.size > 12) cacheAudio.delete(cacheAudio.keys().next().value)
  return buf
}
export function bersihCacheAudio () { cacheAudio.clear() }

/* ------------------------------------------------------------------ */
/*  TAMPILAN KARTU (gaya Spotify)                                       */
/* ------------------------------------------------------------------ */
export const fmtDur = d => {
  d = Math.max(0, Math.floor(d || 0))
  return `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`
}
/** garis progress ala Spotify: 0:12 ━━━━━●━━━━━━ 0:30 */
export function garisProgress (posisi, total, lebar = 14) {
  const r = Math.max(0, Math.min(1, (posisi || 0) / (total || 1)))
  const isi = Math.round(r * lebar)
  return '━'.repeat(isi) + '●' + '━'.repeat(Math.max(0, lebar - isi))
}
const LABEL_STATUS = {
  main: '▶️  SEDANG DIPUTAR',
  jeda: '⏸️  DIJEDA',
  siap: '🎧  SIAP DIPUTAR',
  unduh: '📥  MENGUNDUH AUDIO…',
  cari: '🔍  MENCARI LAGU…',
  habis: '🏁  ANTRIAN SELESAI'
}

export function pillPlayer (s) {
  const putar = s.status === 'main' ? '⏸️ Jeda' : '▶️ Putar'
  const suka = s.queue[s.idx] && isSuka(s.userKey, s.queue[s.idx]) ? '💚 Disukai' : '❤️ Suka'
  return [
    putar, '⏮️ Mundur', '⏭️ Lanjut',
    `🔀 Acak ${s.acak ? 'ON' : 'OFF'}`, `🔁 Repeat ${s.ulang ? 'ON' : 'OFF'}`,
    suka, '📥 Unduh', '📜 Antrian', '🔍 Cari', '⏹️ Tutup'
  ]
}

export function teksPlayer (s, pesan = '') {
  const t = s.queue[s.idx]
  if (!t) return `${pesan ? pesan + '\n\n' : ''}🎧 Antrian kosong. Cari lagu: \`${P}play3 <judul>\``
  const baris = [
    `${LABEL_STATUS[s.status] || '🎧'}  ·  *${(config.bot?.name || 'THERYHANN!').toUpperCase()} MUSIC*`,
    '',
    `*${t.judul}*`,
    `${t.artis}${t.album ? `\n💿 ${t.album}` : ''}`,
    '',
    `${fmtDur(s.posisi)} ${garisProgress(s.posisi, s.durasiPreview)} ${fmtDur(s.durasiPreview)}`,
    '',
    `${isSuka(s.userKey, t) ? '💚 Disukai' : '🤍 Belum disukai'} · 🔀 Acak ${s.acak ? 'ON' : 'OFF'} · 🔁 Repeat ${s.ulang ? 'ON' : 'OFF'}`,
    `Antrian ${s.idx + 1}/${s.queue.length} · sumber ${t.sumber} · durasi asli ${fmtDur(t.durasiAsli)}`
  ]
  return `${pesan ? pesan + '\n\n' : ''}${baris.join('\n')}`
}

export function buildPlayer (rich, s, pesan = '') {
  const t = s.queue[s.idx]
  if (!t) { rich.addText(`🎧 Antrian kosong.\nCari lagu: \`${P}play3 <judul>\``); return rich }
  const berikut = s.queue[s.idx + 1]
  if (pesan) rich.addText(pesan)
  try {
    if (t.cover) rich.addImage(t.cover, { width: 480, height: 480 })
  } catch {}
  rich.addText([
    `${LABEL_STATUS[s.status] || '▶️  SEDANG DIPUTAR'}`,
    '',
    `🎵 *${t.judul}*${t.explicit ? '  🅴' : ''}`,
    `🎤 ${t.artis}`,
    t.album ? `💿 ${t.album}` : '',
    '',
    `${fmtDur(s.posisi)}  ${garisProgress(s.posisi, s.durasiPreview)}  ${fmtDur(s.durasiPreview)}`,
    '',
    `${isSuka(s.userKey, t) ? '💚 Disukai' : '🤍 Suka'}   ·   🔀 Acak ${s.acak ? 'ON' : 'OFF'}   ·   🔁 Repeat ${s.ulang ? 'ON' : 'OFF'}`,
    `📃 Antrian *${s.idx + 1}/${s.queue.length}*   ·   ${t.sumber}`
  ].filter(x => x !== '').join('\n'))
  rich.addTable([
    ['⏱️ Durasi lagu asli', fmtDur(t.durasiAsli)],
    ['🔊 Yang diputar', `preview ${s.durasiPreview} detik (resmi dari ${t.sumber})`],
    ['⏭️ Berikutnya', berikut ? `${berikut.judul} — ${berikut.artis}` : '— akhir antrian —'],
    ['🔎 Kata kunci', truncate(s.query || '—', 40)]
  ])
  rich.addTip(`Ketuk pill di bawah untuk mengontrol player. Cari lagu lain: pill 🔍 Cari lalu ketik judul, atau \`${P}play3 <judul>\`. Progress diperbarui tiap ${TICK_MS / 1000} detik.`)
  rich.addSuggest(pillPlayer(s), { id: 'player' })
  return rich
}

/* ------------------------------------------------------------------ */
/*  RENDER / LIVE-EDIT                                                  */
/* ------------------------------------------------------------------ */
export async function renderPlayer (m, s, pesan = '') {
  const rich = new AIRich(m.sock, { dynamic: true, unsupportedTypeAlert: false })
  try { buildPlayer(rich, s, pesan) } catch (e) { rich.addText('⚠️ Render error: ' + truncate(String(e?.message || e), 120)) }
  if (s.msgId) {
    try { await rich.sendEdit(m.jid, s.msgId); return true } catch { /* kirim baru */ }
  }
  try {
    const sent = await rich.send(m.jid)
    if (sent?.key?.id) s.msgId = sent.key.id
    return true
  } catch {}
  await m.reply(teksPlayer(s, pesan)).catch(() => {})
  return false
}

/* ------------------------------------------------------------------ */
/*  PEMUTARAN                                                           */
/* ------------------------------------------------------------------ */
export function hentikanTicker (s) {
  if (s?.ticker) { clearInterval(s.ticker); s.ticker = null }
}
const masihSesi = (m, s) => { try { return getSes(m.jid) === s } catch { return false } }

/** kirim file audionya ke chat (dengan kartu "now playing" ala Spotify) */
export async function kirimAudio (m, t, buf) {
  /* v7.7.1: kirim audio POLOS (tanpa externalAdReply) — di sebagian besar
     client, metadata kartu yang menarik thumbnail remote menyebabkan pesan
     audio tampil "loading terus". Pendamping info lagu tetap dikirim sebagai
     teks/struknya sendiri. Sifatnya dicoba ulang dengan mimetype alternatif
     kalau percobaan pertama gagal. */
  const dasarBerhasil = {}
  const kirimPertama = () => m.sock.sendMessage(m.jid, {
    audio: buf,
    mimetype: 'audio/mpeg',
    ptt: false,
    fileName: `${(t.judul || 'lagu').slice(0, 60)}.mp3`
  }, { quoted: m.raw })
  try {
    dasarBerhasil.sent = await kirimPertama()
  } catch (e) {
    /* fallback mimetype (sebagian receiver menolak audio/mpeg langsung) */
    dasarBerhasil.sent = await m.sock.sendMessage(m.jid, {
      audio: buf,
      mimetype: t.mime && /^audio\//.test(t.mime) ? t.mime : 'audio/mp4',
      ptt: false,
      fileName: `${(t.judul || 'lagu').slice(0, 60)}.m4a`
    }, { quoted: m.raw })
  }
  return dasarBerhasil.sent
}

/** putar lagu di indeks saat ini: unduh → kirim audio → jalankan progress */
export async function putarSekarang (m, s, opt = {}) {
  const t = s.queue[s.idx]
  if (!t) { s.status = 'habis'; return renderPlayer(m, s, '🏁 Antrian selesai.') }
  hentikanTicker(s)
  s.status = 'unduh'
  s.posisi = 0
  s.durasiPreview = DURASI_PREVIEW
  if (!opt.senyap) await renderPlayer(m, s, '📥 Mengunduh audio…')
  let buf
  try { buf = await unduhPreview(t) } catch (e) {
    s.status = 'siap'
    return renderPlayer(m, s, `⚠️ Gagal memutar "${t.judul}": ${truncate(String(e?.message || e), 120)}\n\nCoba ⏭️ Lanjut ke lagu berikutnya.`)
  }
  try { await kirimAudio(m, t, buf) } catch (e) {
    s.status = 'siap'
    return renderPlayer(m, s, `⚠️ Audio gagal dikirim: ${truncate(String(e?.message || e), 120)}`)
  }
  s.status = 'main'
  catatPutar(s.userKey, t, s.query)
  await renderPlayer(m, s)
  mulaiTicker(m, s)
  return true
}

function mulaiTicker (m, s) {
  hentikanTicker(s)
  s.ticker = setInterval(async () => {
    if (!masihSesi(m, s) || s.status !== 'main') return hentikanTicker(s)
    s.posisi = Math.min(s.durasiPreview, s.posisi + Math.round(TICK_MS / 1000))
    if (s.posisi >= s.durasiPreview) {
      hentikanTicker(s)
      try { await laguBerikutnya(m, s, { otomatis: true }) } catch {}
      return
    }
    await renderPlayer(m, s).catch(() => {})
  }, TICK_MS)
  if (s.ticker?.unref) s.ticker.unref()
}

/** pindah lagu: ⏭️ berikutnya / ⏮️ mundur */
export async function laguBerikutnya (m, s, { otomatis = false, mundur = false } = {}) {
  hentikanTicker(s)
  const n = s.queue.length
  if (mundur) {
    if (s.posisi > 3) { s.posisi = 0; return putarSekarang(m, s) }   // ulang lagu sekarang
    s.idx = (s.idx - 1 + n) % n
  } else if (s.ulang) {
    s.posisi = 0
    return putarSekarang(m, s)
  } else if (s.idx + 1 < n) s.idx++
  else if (s.acak) s.idx = Math.floor(Math.random() * n)
  else {
    s.status = 'habis'
    s.posisi = s.durasiPreview
    return renderPlayer(m, s, otomatis ? '🏁 Antrian selesai — semua lagu sudah diputar.' : '🏁 Sudah lagu terakhir.')
  }
  return putarSekarang(m, s)
}

/* ------------------------------------------------------------------ */
/*  BUKA PLAYER                                                         */
/* ------------------------------------------------------------------ */
/** buka player dari hasil pencarian; autoPlay = langsung putar lagu pertama */
export async function bukaPlayer (m, query, { autoPlay = true, paksa = false } = {}) {
  const key = m.senderKey || m.sender
  const q = String(query || '').trim()
  if (!q) return m.reply(`🎧 Sebutkan judul/artis lagu.\n\nContoh: \`${P}play2 perfect ed sheeran\`\nLagu favoritmu: \`${P}lagusuka\``)

  const lama = getSes(m.jid)
  if (lama) hentikanTicker(lama)
  clearSes(m.jid)

  let hasil = []
  try { hasil = await cariLagu(q, MAKS_ANTRIAN) } catch (e) {
    return m.reply(`⚠️ Gagal mencari lagu: ${truncate(String(e?.message || e), 140)}\n\nCoba lagi beberapa saat, atau pakai \`${P}carilagu <judul>\` untuk melihat daftar tanpa memutar.`)
  }
  if (!hasil.length) {
    return m.reply(`😕 Tidak ada hasil untuk "*${truncate(q, 60)}*".\n\nCoba tulis judul + artis, contoh: \`${P}play2 hingga tua bersama rizky febian\``)
  }

  const s = setSes(m.jid, {
    jid: m.jid, sock: m.sock, userKey: key, query: q,
    queue: hasil, idx: 0, status: 'siap', posisi: 0, durasiPreview: DURASI_PREVIEW,
    acak: false, ulang: false, ticker: null, mode: null, msgId: null, mulai: Date.now()
  })
  if (!s) return m.reply('⚠️ Gagal menyiapkan sesi player.')
  void paksa

  if (autoPlay) {
    await renderPlayer(m, s, `🔎 Ditemukan *${hasil.length}* lagu untuk "${truncate(q, 40)}" — memutar yang teratas…`)
    return putarSekarang(m, s)
  }
  await renderPlayer(m, s, `🔎 Ditemukan *${hasil.length}* lagu untuk "${truncate(q, 40)}". Ketuk ▶️ Putar.`)
  return { handled: true }
}

/** putar ulang dari lagu favorit / riwayat */
export async function putarTrack (m, t, opt = {}) {
  return bukaPlayer(m, `${t.judul} ${t.artis}`, opt)
}

/* ------------------------------------------------------------------ */
/*  AKSI-AKSI PLAYER                                                    */
/* ------------------------------------------------------------------ */
async function aksiAntrian (m, s) {
  s.mode = 'pilih'
  s.modeUntil = Date.now() + 90000
  const daftar = s.queue.map((t, i) => [
    `${i === s.idx ? '▶️' : `${i + 1}.`} ${truncate(t.judul, 28)}`,
    truncate(t.artis, 22),
    fmtDur(t.durasiAsli)
  ])
  const rich = new AIRich(m.sock, { dynamic: true, unsupportedTypeAlert: false })
  rich.addText(`📜 *ANTRIAN* — ${s.queue.length} lagu (kata kunci: "${truncate(s.query, 30)}")\n\nKetuk nomor lagu untuk langsung memutar.`)
  try { rich.addTable(daftar) } catch { rich.addText(daftar.map(r => r.join(' · ')).join('\n')) }
  rich.addTip('Balas dengan angka 1–10 untuk memilih lagu, atau ketuk pill di bawah.')
  const nomor = s.queue.slice(0, 9).map((t, i) => `${i + 1}️⃣ ${truncate(t.judul, 18)}`)
  rich.addSuggest([...nomor, ...pillPlayer(s)].slice(0, 12), { id: 'player' })
  try {
    if (s.msgId) await rich.sendEdit(m.jid, s.msgId)
    else { const sent = await rich.send(m.jid); if (sent?.key?.id) s.msgId = sent.key.id }
  } catch { await m.reply(teksPlayer(s, '📜 Antrian')).catch(() => {}) }
  return true
}

async function aksiUnduh (m, s) {
  const t = s.queue[s.idx]
  if (!t) return false
  await renderPlayer(m, s, '📥 Menyiapkan file audio…')
  try {
    const buf = await unduhPreview(t)
    const nama = `${t.judul} - ${t.artis}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 60) + (t.mime === 'audio/mp4' ? '.m4a' : '.mp3')
    await m.sock.sendMessage(m.jid, {
      document: buf, mimetype: t.mime || 'audio/mpeg', fileName: nama,
      caption: `📥 *${t.judul}* — ${t.artis}\n\nPreview ${DURASI_PREVIEW} detik dari ${t.sumber}.`
    }, { quoted: m.raw })
    await renderPlayer(m, s, `📥 File *${nama}* terkirim.`)
  } catch (e) {
    await renderPlayer(m, s, `⚠️ Gagal mengunduh: ${truncate(String(e?.message || e), 140)}`)
  }
  return true
}

/* ------------------------------------------------------------------ */
/*  CHECKER — dipanggil handlers/message.js untuk pesan non-command     */
/* ------------------------------------------------------------------ */
const ANGKA_PILIH = { '1️⃣': 1, '2️⃣': 2, '3️⃣': 3, '4️⃣': 4, '5️⃣': 5, '6️⃣': 6, '7️⃣': 7, '8️⃣': 8, '9️⃣': 9 }

export async function checkPlayer (m) {
  const s = getSes(m.jid)
  if (!s || m.isCommand) return null
  const text = String(m.text || '').trim()
  if (!text) return null
  const low = text.toLowerCase()
  sentuh(s)
  if (s.mode && s.modeUntil && Date.now() > s.modeUntil) s.mode = null   // mode input kedaluwarsa

  /* mode tunggu input: cari lagu baru */
  if (s.mode === 'cari') {
    s.mode = null
    await bukaPlayer(m, text)
    return { handled: true }
  }
  /* mode pilih nomor lagu */
  if (s.mode === 'pilih') {
    let n = 0
    for (const [e, v] of Object.entries(ANGKA_PILIH)) if (text.includes(e)) n = v
    if (!n) n = parseInt(low.replace(/[^\d]/g, ''), 10) || 0
    if (n >= 1 && n <= s.queue.length) {
      s.mode = null
      s.idx = n - 1
      await putarSekarang(m, s)
      return { handled: true }
    }
    s.mode = null   // bukan nomor → lanjut ke pencocokan pill
  }

  /* ---- kontrol player ---- */
  if (/^(⏹|tutup|close|matikan|stopplay)/.test(low) || /^(stop|tutup player|matikan musik)$/.test(low)) {
    clearSes(m.jid)
    await m.reply(`⏹️ Player ditutup.\n\nBuka lagi: \`${P}play3 <judul>\` · favorit: \`${P}lagusuka\``).catch(() => {})
    return { handled: true }
  }
  if (/^(⏸|jeda|pause)/.test(low) || /^pause$/.test(low)) {
    if (s.status !== 'main') return null
    hentikanTicker(s)
    s.status = 'jeda'
    await renderPlayer(m, s, '⏸️ Dijeda. Ketuk ▶️ Putar untuk mengirim ulang audionya.')
    return { handled: true }
  }
  if (/^(▶|putar|play|mainkan|gas)/.test(low) || /^(play|putar)$/.test(low)) {
    await putarSekarang(m, s)
    return { handled: true }
  }
  if (/^(⏭|lanjut|next|skip)/.test(low)) { await laguBerikutnya(m, s); return { handled: true } }
  if (/^(⏮|mundur|prev|sebelumnya|back)/.test(low)) { await laguBerikutnya(m, s, { mundur: true }); return { handled: true } }
  if (/^(🔀|acak|shuffle)/.test(low)) {
    s.acak = !s.acak
    if (s.acak && s.queue.length > 1) {
      const sekarang = s.queue[s.idx]
      const sisa = s.queue.filter((_, i) => i !== s.idx)
      for (let i = sisa.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[sisa[i], sisa[j]] = [sisa[j], sisa[i]] }
      s.queue = [sekarang, ...sisa]
      s.idx = 0
    }
    await renderPlayer(m, s, `🔀 Acak ${s.acak ? 'AKTIF — antrian diacak' : 'MATI'}.`)
    return { handled: true }
  }
  if (/^(🔁|repeat|ulang)/.test(low)) {
    s.ulang = !s.ulang
    await renderPlayer(m, s, `🔁 Repeat ${s.ulang ? 'AKTIF — lagu diulang terus' : 'MATI'}.`)
    return { handled: true }
  }
  if (/^(❤|💚|suka|like|love|favorit)/.test(low)) {
    const t = s.queue[s.idx]
    if (!t) return null
    const jadi = toggleSuka(s.userKey, t)
    await renderPlayer(m, s, jadi
      ? `❤️ *${t.judul}* ditambahkan ke lagu suka.\nLihat daftar: \`${P}lagusuka\``
      : `🤍 *${t.judul}* dihapus dari lagu suka.`)
    return { handled: true }
  }
  if (/^(📥|unduh|download|simpan|dl)/.test(low)) { await aksiUnduh(m, s); return { handled: true } }
  if (/^(📜|antrian|queue|daftar lagu|list)/.test(low)) { await aksiAntrian(m, s); return { handled: true } }
  if (/^(🔍|cari|search|cari lagu)/.test(low)) {
    s.mode = 'cari'
    s.modeUntil = Date.now() + 90000
    await renderPlayer(m, s, `🔍 Ketik judul/artis lagu yang mau dicari (pesan berikutnya akan dipakai sebagai kata kunci).\nAtau langsung: \`${P}play3 <judul>\``)
    return { handled: true }
  }
  /* teks lain → biarkan diproses fitur lain (AI chat dsb.) */
  return null
}

/* ------------------------------------------------------------------ */
/*  PLAYER HTML APP (v7.5) — .play2 sebagai kartu HTML                  */
/* ------------------------------------------------------------------ */
/**
 * Versi HTML tidak butuh sesi live-edit (kartunya mandiri), tetapi antrian
 * tetap disimpan di database/musik.json supaya perintah pendamping
 * (.unduhlagu / .heartlagu / .antrianlagu / .statusplayer) tahu lagu apa
 * yang sedang dibuka pengguna.
 */
export function simpanAntrian (key, query, tracks, idx = 0) {
  const u = getMusik(key)
  u.antrian = (tracks || []).slice(0, MAKS_ANTRIAN).map(t => ({
    ...ringkasTrack(t),
    preview: t.preview || '',
    mime: t.mime || 'audio/mpeg',
    explicit: !!t.explicit
  }))
  u.antrianQuery = String(query || '').slice(0, 60)
  u.antrianIdx = Math.max(0, Math.min(u.antrian.length - 1, idx | 0))
  u.antrianWaktu = Date.now()
  simpanMusik()
  return u.antrian
}

export function ambilAntrian (key) {
  const u = getMusik(key)
  return { tracks: u.antrian || [], query: u.antrianQuery || '', idx: u.antrianIdx || 0, waktu: u.antrianWaktu || 0 }
}

/** susun data untuk kartu HTML (termasuk tanda ❤ dari profil user) */
export function dataKartuMusik (key, query, tracks, idx = 0) {
  const u = getMusik(key)
  return {
    query: String(query || ''),
    totalPutar: u.totalPutar || 0,
    mulai: idx,
    tracks: (tracks || []).map(t => ({
      id: t.id, judul: t.judul, artis: t.artis, album: t.album || '',
      durasi: t.durasiAsli || t.durasi || 0,
      cover: t.cover || '', coverKecil: t.coverKecil || '',
      preview: t.preview || '', sumber: t.sumber || 'Deezer',
      explicit: !!t.explicit, suka: isSuka(key, t),
      /* v7.7: lirik Spotify — diinjeksi server saat lagu diputar (boleh null) */
      lirik: (t.lirik && (t.lirik.polos || (t.lirik.sinkron || []).length))
        ? {
            polos: String(t.lirik.polos || '').slice(0, 2800),
            sinkron: (t.lirik.sinkron || []).slice(0, 60).map(x => [Number(x[0]) || 0, String(x[1] || '').slice(0, 90)])
          }
        : null
    }))
  }
}

/** kirim file/audio preview sebuah track (dipakai .unduhlagu) */
export async function kirimFileLagu (m, t, { dokumen = false } = {}) {
  const buf = await unduhPreview(t)
  const nama = `${t.judul} - ${t.artis}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 60) + (t.mime === 'audio/mp4' ? '.m4a' : '.mp3')
  if (dokumen) {
    return m.sock.sendMessage(m.jid, {
      document: buf, mimetype: t.mime || 'audio/mpeg', fileName: nama,
      caption: `📥 *${t.judul}* — ${t.artis}\n\nPreview ${DURASI_PREVIEW} detik dari ${t.sumber}.`
    }, { quoted: m.raw })
  }
  return kirimAudio(m, { ...t, coverKecil: t.coverKecil || t.cover }, buf)
}

/**
 * .play2 versi HTML app: cari lagu → simpan antrian → kirim kartu HTML +
 * struk teks berisi daftar lagu & perintah pendamping.
 */
/* ------------------------------------------------------------------ */
/*  v7.6 — PLAYER HTML + AUDIO WHATSAPP                                 */
/* ------------------------------------------------------------------
 *  Webview kartu HTML **tidak punya akses jaringan**, jadi audio dari
 *  Deezer/iTunes tidak bisa diputar dari dalam kartu (gejala: kartu
 *  muncul tapi tidak ada suara). Solusinya:
 *     • kartu HTML  = tampilan (sampul, antrian, visualiser simulasi)
 *     • pesan audio WhatsApp = suaranya (preview resmi 30 detik)
 *  Kontrol ganti lagu lewat perintah chat: .nextlagu .prevlagu .putarlagu 3
 *  .ulanglagu .acaklagu — karena kartu tidak bisa memanggil balik ke bot.
 * ------------------------------------------------------------------ */

/** kirim kartu HTML player saja (tanpa audio) */
export async function kirimKartuHtml (m, data) {
  const html = playerHtml(config.bot?.name || 'theryhann!', data)
  try {
    await sendHtmlApp(m.sock, m.jid, { title: 'Music Player', html })
    return { ok: true }
  } catch (e) { return { ok: false, error: e } }
}

/** teks struk pemutaran (dipakai semua jalur HTML) */
function strukPutar (t, idx, n, query, errAudio, kartu, strukTrackList = []) {
  const nomor = `${idx + 1}/${n}`
  let s = `🎧 *SEDANG DIPUTAR* (${nomor}) — "${truncate(query, 30)}"\n\n` +
    `▶ *${truncate(t.judul, 40)}*${t.explicit ? ' 🅴' : ''}\n` +
    `   ${truncate(t.artis, 32)}${t.album ? ' · ' + truncate(t.album, 26) : ''}\n` +
    `   ${fmtDur(t.durasiAsli || t.durasi)} · ${t.sumber || 'Deezer'} · preview 30 detik\n\n`
  if (errAudio) {
    s += `⚠️ Audio gagal dikirim: ${truncate(String(errAudio?.message || errAudio), 110)}\n` +
      `   Coba lagi: \`${P}ulanglagu\` · atau unduh file: \`${P}unduhlagu ${idx + 1} file\`\n\n`
  } else {
    s += `🔊 Suaranya ada di **pesan audio** di bawah/atas kartu ini (webview kartu tidak bisa memutar audio dari internet).\n\n`
  }
  s += `*Antrian (${n} lagu):*\n`
  for (let k = 0; k < n; k++) {
    const tr = strukTrackList[k]
    if (!tr) continue
    s += `${k === idx ? '▶' : (k + 1) + '.'} ${truncate(tr.judul, 30)}${tr.explicit ? ' 🅴' : ''} — ${truncate(tr.artis, 24)}\n`
  }
  s += '\n'
  if (kartu && kartu.ok === false) {
    s += `ℹ️ Kartu HTML tidak bisa dimuat di WhatsApp-mu (${truncate(String(kartu.error?.message || kartu.error), 80)}) — semua kontrol lewat perintah tetap jalan.\n\n`
  }
  s += '*Kontrol (kirim sebagai pesan):*\n' +
    `⏭ \`${P}nextlagu\`   ⏮ \`${P}prevlagu\`   🔢 \`${P}putarlagu 1-${n}\`\n` +
    `🔁 \`${P}ulanglagu\`   🔀 \`${P}acaklagu\`   🖼 \`${P}kartulagu\`\n` +
    `📥 \`${P}unduhlagu ${idx + 1}\`   ❤ \`${P}heartlagu ${idx + 1}\`   📜 \`${P}antrianlagu\`\n` +
    `🔎 Cari lagi: \`${P}play3 <judul>\` · versi AIRich: \`${P}play2rich ${truncate(query, 20)}\``
  return truncate(s, 3800)
}

/** inti: putar lagu ke-`idx` (0-based) dari antrian tersimpan */
async function putarIndeks (m, key, idx, opt = {}) {
  const a = ambilAntrian(key)
  const n = a.tracks.length
  if (!n) return null
  const i = ((Math.round(idx) % n) + n) % n
  const t = a.tracks[i]
  if (!t) return null
  const u = getMusik(key)
  u.antrianIdx = i
  simpanMusik()
  catatPutar(key, t, a.query)

  /* v7.7: ambil lirik (LRCLIB) PARALEL dengan unduhan preview; non-fatal */
  const janjiLirik = (t.lirik === undefined && opt.lirik !== false)
    ? ambilLirik(t, { timeout: 4500 }).catch(() => null)
    : Promise.resolve(t.lirik || null)

  let buf = null, errAudio = null
  try { buf = await unduhPreview(t) } catch (e) { errAudio = e }
  if (buf) { try { await kirimAudio(m, t, buf) } catch (e) { errAudio = errAudio || e } }

  if (t.lirik === undefined && opt.lirik !== false) {
    t.lirik = (await janjiLirik) || null
    if (t.lirik) { u.antrian = a.tracks; simpanMusik() }
  }

  const data = dataKartuMusik(key, a.query, a.tracks, i)
  const kartu = opt.kartu === false ? { ok: true } : await kirimKartuHtml(m, data)
  if (opt.teks !== false) await m.reply(strukPutar(t, i, n, a.query, errAudio, kartu, a.tracks))
  return { handled: true, track: t, idx: i, audio: !!buf, kartu, errAudio }
}

/**
 * Kontrol player HTML dari perintah chat.
 * @param {'next'|'prev'|'ulang'|'acak'|number} tujuan
 */
export async function kontrolPlayerHtml (m, tujuan = 'ulang', opt = {}) {
  const key = m.senderKey || m.sender
  const a = ambilAntrian(key)
  if (!a.tracks.length) {
    return m.reply(`🎧 Belum ada antrian lagu.\nMulai: \`${P}play2 <judul lagu>\`\nContoh: \`${P}play2 hingga tua bersama rizky febian\``)
  }
  const n = a.tracks.length
  if (tujuan === 'acak') {
    const tracks = a.tracks.slice()
    for (let k = tracks.length - 1; k > 0; k--) {
      const j = (Math.random() * (k + 1)) | 0
      const tmp = tracks[k]; tracks[k] = tracks[j]; tracks[j] = tmp
    }
    const u = getMusik(key)
    u.antrian = tracks
    simpanMusik()
    await m.reply(`🔀 Antrian dikocok (${n} lagu). Memutar dari lagu pertama…`).catch(() => {})
    return putarIndeks(m, key, 0, opt)
  }
  let idx = a.idx
  if (tujuan === 'next') idx = (a.idx + 1) % n
  else if (tujuan === 'prev') idx = (a.idx - 1 + n) % n
  else if (tujuan === 'ulang') idx = a.idx
  else if (Number.isFinite(Number(tujuan))) idx = Number(tujuan) - 1   /* 1-based dari user */
  return putarIndeks(m, key, idx, opt)
}

/** kirim ulang kartu HTML saja (tanpa audio) */
export async function kirimUlangKartu (m) {
  const key = m.senderKey || m.sender
  const a = ambilAntrian(key)
  if (!a.tracks.length) {
    return m.reply(`🎧 Belum ada antrian lagu.\nMulai: \`${P}play2 <judul lagu>\``)
  }
  const data = dataKartuMusik(key, a.query, a.tracks, Math.min(a.idx, a.tracks.length - 1))
  const kartu = await kirimKartuHtml(m, data)
  const t = a.tracks[Math.min(a.idx, a.tracks.length - 1)]
  return m.reply(
    (kartu.ok
      ? `🖼 Kartu player dikirim ulang — *${truncate(t.judul, 34)}* (${a.idx + 1}/${a.tracks.length}).\n\n`
      : `⚠️ Kartu HTML gagal dimuat (${truncate(String(kartu.error?.message || kartu.error), 90)}).\n\n`) +
    `🔊 Audio: \`${P}ulanglagu\` · ⏭ \`${P}nextlagu\` · ⏮ \`${P}prevlagu\` · 📜 \`${P}antrianlagu\``)
}

export async function bukaPlayerHtml (m, query, opt = {}) {
  const key = m.senderKey || m.sender
  const q = String(query || '').trim()
  if (!q) return null

  let hasil = []
  try { hasil = await cariLagu(q, MAKS_ANTRIAN) } catch (e) {
    return m.reply(`⚠️ Gagal mencari lagu: ${truncate(String(e?.message || e), 140)}\n\nCoba lagi beberapa saat, atau pakai \`${P}carilagu <judul>\` untuk melihat daftar tanpa memutar.`)
  }
  if (!hasil.length) {
    return m.reply(`😕 Tidak ada hasil untuk "*${truncate(q, 60)}*".\n\nCoba tulis judul + artis, contoh: \`${P}play2 hingga tua bersama rizky febian\``)
  }

  const idx = Math.max(0, Math.min(hasil.length - 1, opt.idx || 0))
  simpanAntrian(key, q, hasil, idx)
  return putarIndeks(m, key, idx, opt)
}


export default {
  bukaPlayer, bukaPlayerHtml, simpanAntrian, ambilAntrian, dataKartuMusik, kirimFileLagu, playerHtml, playerTeks,
  kontrolPlayerHtml, kirimKartuHtml, kirimUlangKartu,
  putarSekarang, putarTrack, laguBerikutnya, renderPlayer, checkPlayer,
  cariLagu, cariDeezer, cariItunes, unduhPreview, toggleSuka, isSuka, getMusik,
  getSes, setSes, clearSes, sentuh, pillPlayer, teksPlayer, buildPlayer, fmtDur,
  garisProgress, hentikanTicker, kirimAudio, catatPutar, simpanMusik
}
