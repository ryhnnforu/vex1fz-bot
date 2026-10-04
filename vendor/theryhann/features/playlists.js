/**
 * 🟢 .playlists — SPOTIFY LIVE: CARI & PUTAR + DENGERIN BARENG (v7.12.0)
 * -----------------------------------------------------------------------
 *  Kartu HTML meniru screenshot pengguna (lib/playlisthtml.js):
 *   • tab "Cari & Putar": kotak cari, daftar hasil (aktif hijau + equalizer),
 *     mini-player (cover, seek, waktu, ⟲ ⏸ ⟳) — semua lagu ditanam base64
 *   • tab "Dengerin Bareng": Buat ruangan (kode 4 huruf) / Gabung ruangan
 *  Perintah:
 *   .playlists <judul>            → cari 5 lagu, kartu berisi semuanya
 *   .playlists                    → kartu terakhirmu (atau contoh)
 *   .playlists tukar <no> <judul> → GANTI lagu nomor <no> dengan lagu lain
 *   .playlists tambah <judul>     → tambah lagu (maks 6, yang tertua keluar)
 *   .playlists hapus <no>         → hapus lagu nomor <no>
 *   .gabungruang <KODE>           → terima kartu ruangan (playlist host)
 *   .ruanganku                    → info ruanganmu + kode
 *  Lagu yang ditanam = preview 30 dtk (dikecilkan) agar 5–6 lagu muat di
 *  batas kartu WhatsApp; lagu PENUH tetap lewat .play3.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariLagu } from '../lib/musikplayer.js'
import { playlistHtml } from '../lib/playlisthtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { ambil, maksTanam } from '../lib/siapkanlagu.js'
import { kecilkan, kecilkanCover, ambilLaguPenuh, durasiFile } from '../lib/lagupenuh.js'

const P = config.display.prefix
const MAKS_LAGU = 6
const CUPLIK_DTK = 20 // cuplikan dipotong 20 dtk
const PER_LAGU = 44 * 1024 // 20 dtk @16kbps ≈ 40KB
const budgetPenuh = n => Math.max(160 * 1024, maksTanam() - n * PER_LAGU)
export const ruangan = new Map() // KODE → { host, nama, tracks, ts }
const terakhir = new Map() // user → { tracks, kode, query }
const kodeUser = new Map() // user → KODE

export function buatKode (user) {
  if (kodeUser.has(user)) return kodeUser.get(user)
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let k; do { k = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('') } while (ruangan.has(k))
  kodeUser.set(user, k); return k
}

/** unduh preview + cover → track siap tanam (audio ≤ PER_LAGU) */
export async function siapkanTrackKecil (t, target = PER_LAGU, penuh = false) {
  let url = '', cover = '', durasi = 30, isPenuh = false
  try {
    let buf = null, mime = 'audio/mpeg'
    if (penuh) {
      const full = await ambilLaguPenuh(t.judul, t.artis).catch(() => null)
      if (full) { buf = full.buf; mime = full.mime; durasi = full.durasi || t.durasiAsli || await durasiFile(full.buf).catch(() => 0) || 240; isPenuh = true }
    }
    if (!buf) { const a = await ambil(t.preview, 30000); buf = a.buf; mime = a.type || 'audio/mpeg'; durasi = 30 }
    if (isPenuh) {
      if (buf.length > target) { const k = await kecilkan(buf, target, durasi).catch(() => null); if (k) { buf = k.buf; mime = k.mime } }
      if (buf.length > target * 1.3) { /* penuh tidak muat → pakai cuplikan */ const a = await ambil(t.preview, 30000); buf = a.buf; mime = a.type || 'audio/mpeg'; durasi = 30; isPenuh = false }
    }
    if (!isPenuh) {
      const k = await kecilkan(buf, PER_LAGU, 30, { potong: CUPLIK_DTK }).catch(() => null)
      if (k) { buf = k.buf; mime = k.mime; durasi = CUPLIK_DTK }
      /* tanpa ffmpeg: cuplikan asli 30 dtk (~470KB) tetap dipakai; muat() yang membatasi */
    }
    url = `data:${mime};base64,${buf.toString('base64')}`
  } catch (e) { console.error('[playlists] audio:', t.judul, e.message) }
  try {
    if (t.coverKecil || t.cover) {
      const c = await ambil(t.coverKecil || t.cover, 15000)
      const cb = c.buf.length > 9 * 1024 ? await kecilkanCover(c.buf, 96) : c.buf
      if (cb.length < 14 * 1024) cover = `data:image/jpeg;base64,${cb.toString('base64')}`
    }
  } catch {}
  return { judul: t.judul, artis: t.artis, cover, url, durasi, penuh: isPenuh, durasiAsli: t.durasiAsli || 0, preview: t.preview, coverUrl: t.coverKecil || t.cover || '' }
}

/** jadikan lagu ke-idx PENUH, sisanya cuplikan (batas kartu WA) */
export async function setPenuh (tracks, idx) {
  const out = []
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i]
    const src = { judul: t.judul, artis: t.artis, preview: t.preview, cover: t.coverUrl, coverKecil: t.coverUrl, durasiAsli: t.durasiAsli }
    if (i === idx) out.push(await siapkanTrackKecil(src, budgetPenuh(tracks.length - 1), true))
    else if (t.penuh) out.push(await siapkanTrackKecil(src, PER_LAGU, false))
    else out.push(t)
  }
  return out
}

async function bangunTracks (q, n = 5) {
  const hasil = await cariLagu(q, n)
  const tr = []
  for (const [i, t] of hasil.slice(0, n).entries()) { const x = await siapkanTrackKecil(t, i === 0 ? budgetPenuh(n - 1) : PER_LAGU, i === 0); if (x.url) tr.push(x) }
  return tr
}

/** potong agar total payload ≤ batas kartu */
function muat (tracks) {
  const batas = Math.max(maksTanam(), 430 * 1024) * 1.4
  const out = []; let total = 0
  for (const t of tracks) { const sz = t.url.length + t.cover.length; if (total + sz > batas) { console.log(`[playlists] lewat batas kartu, ${t.judul} dilewati (${(sz / 1024) | 0}KB)`); continue } out.push(t); total += sz }
  return out
}

export async function kirimKartu (m, { tracks, kode, nama, query, host, mulai = 0 }) {
  const html = playlistHtml(config.bot.name, { nama, kode, prefix: P, tracks, query, host, mulai })
  await sendHtmlApp(m.sock, m.jid, { title: `🟢 Spotify LIVE · ${tracks.length} lagu · ruangan ${kode}`, html })
}

function daftar (tracks) { return tracks.map((t, i) => `${i + 1}. ${t.judul} — ${t.artis}${t.penuh ? ' ✅ penuh' : ' · cuplikan'}`).join('\n') }

export const playlists = {
  command: ['playlists', 'playlist', 'splive', 'spotifylist', 'dengerinbareng'],
  category: 'Downloader',
  description: '🟢 Spotify LIVE — kartu Cari & Putar + Dengerin Bareng (ruangan kode); .playlists <judul> · tukar <no> <judul> · tambah · hapus',
  limit: 1,
  cooldown: 6,
  contoh: 'about you',
  run: async m => {
    const user = m.senderKey || m.sender
    const nama = truncate(String(m.pushName || 'Kamu'), 20)
    const kode = buatKode(user)
    const args = String(m.q || '').trim()
    const [sub, ...sisa] = args.split(/\s+/)
    const s = (sub || '').toLowerCase()
    let sesi = terakhir.get(user)
    try { await m.react?.('🟢') } catch {}
    try {
      if (['tukar', 'ganti', 'swap'].includes(s)) {
        const no = parseInt(sisa[0]); const judul = sisa.slice(1).join(' ')
        if (!sesi?.tracks?.length) return m.reply(`❌ Belum ada playlist. Buat dulu: \`${P}playlists judul lagu\``)
        if (!(no >= 1 && no <= sesi.tracks.length) || !judul) return m.reply(`🔁 *TUKAR LAGU*\n\`${P}playlists tukar <no> <judul>\`\n\n${daftar(sesi.tracks)}`)
        const hasil = await cariLagu(judul, 1); if (!hasil.length) return m.reply(`❌ "${judul}" tidak ditemukan.`)
        const baru = await siapkanTrackKecil(hasil[0]); if (!baru.url) return m.reply('❌ Audio lagu itu tidak bisa diambil.')
        const lama = sesi.tracks[no - 1]; sesi.tracks[no - 1] = baru
        await kirimKartu(m, { tracks: sesi.tracks, kode, nama, query: '' , host: true })
        if (ruangan.has(kode)) ruangan.get(kode).tracks = sesi.tracks
        return m.reply(`🔁 Lagu #${no} ditukar:\n~${lama.judul}~ → *${baru.judul}* — ${baru.artis}\n\n${daftar(sesi.tracks)}\n\nRuangan *${kode}* ikut diperbarui — teman kirim \`${P}gabungruang ${kode}\` untuk kartu terbaru.`)
      }
      if (['putar', 'play', 'penuh', 'full'].includes(s)) {
        const no = parseInt(sisa[0])
        if (!sesi?.tracks?.length) return m.reply(`❌ Belum ada playlist. Buat dulu: \`${P}playlists judul lagu\``)
        if (!(no >= 1 && no <= sesi.tracks.length)) return m.reply(`▶ *PUTAR PENUH*\n\`${P}playlists putar <no>\` — lagu itu dijadikan versi penuh di kartu\n\n${daftar(sesi.tracks)}`)
        await m.reply(`🟢 Menyiapkan *${sesi.tracks[no - 1].judul}* versi penuh… ±30 detik`)
        sesi.tracks = await setPenuh(sesi.tracks, no - 1); terakhir.set(user, sesi); if (ruangan.has(kode)) ruangan.get(kode).tracks = sesi.tracks
        await kirimKartu(m, { tracks: sesi.tracks, kode, nama, host: true, mulai: no - 1 })
        return m.reply(`${sesi.tracks[no - 1].penuh ? '✅' : '⚠️'} *${sesi.tracks[no - 1].judul}* ${sesi.tracks[no - 1].penuh ? 'sekarang penuh' : 'hanya cuplikan (sumber penuh tidak tersedia — pasang yt-dlp atau `' + P + 'setapikeyspotify`)'}\n\n${daftar(sesi.tracks)}`)
      }
      if (['tambah', 'add'].includes(s)) {
        const judul = sisa.join(' '); if (!judul) return m.reply(`➕ \`${P}playlists tambah <judul>\``)
        if (!sesi) sesi = { tracks: [], kode }
        const hasil = await cariLagu(judul, 1); if (!hasil.length) return m.reply(`❌ "${judul}" tidak ditemukan.`)
        const baru = await siapkanTrackKecil(hasil[0]); if (!baru.url) return m.reply('❌ Audio lagu itu tidak bisa diambil.')
        sesi.tracks.push(baru); while (sesi.tracks.length > MAKS_LAGU) sesi.tracks.shift(); sesi.tracks = muat(sesi.tracks)
        terakhir.set(user, sesi); if (ruangan.has(kode)) ruangan.get(kode).tracks = sesi.tracks
        await kirimKartu(m, { tracks: sesi.tracks, kode, nama, host: true })
        return m.reply(`➕ *${baru.judul}* — ${baru.artis} ditambahkan.\n\n${daftar(sesi.tracks)}`)
      }
      if (['hapus', 'del', 'remove'].includes(s)) {
        const no = parseInt(sisa[0]); if (!sesi?.tracks?.length || !(no >= 1 && no <= sesi.tracks.length)) return m.reply(`🗑️ \`${P}playlists hapus <no>\`\n\n${sesi?.tracks?.length ? daftar(sesi.tracks) : 'playlist kosong'}`)
        const [x] = sesi.tracks.splice(no - 1, 1); if (ruangan.has(kode)) ruangan.get(kode).tracks = sesi.tracks
        if (sesi.tracks.length) await kirimKartu(m, { tracks: sesi.tracks, kode, nama, host: true })
        return m.reply(`🗑️ *${x.judul}* dihapus.\n\n${sesi.tracks.length ? daftar(sesi.tracks) : 'playlist kosong'}`)
      }
      // cari / tampilkan
      let tracks = sesi?.tracks || []
      const q = args
      if (q) {
        await m.reply(`🟢 Mencari *${q}* dan menyiapkan playlist (lagu 1 penuh + 4 cuplikan)… ±40 detik`)
        tracks = muat(await bangunTracks(q, 5))
        if (!tracks.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan / audio tidak bisa diambil.`)
        sesi = { tracks, kode, query: q }; terakhir.set(user, sesi)
      } else if (!tracks.length) {
        return m.reply(`🟢 *SPOTIFY LIVE — PLAYLISTS*\n\n\`${P}playlists about you\` → kartu Cari & Putar berisi 5 lagu + tab Dengerin Bareng (kode ruangan).\n\n🔁 \`${P}playlists tukar 2 judul baru\` — ganti lagu no 2\n➕ \`${P}playlists tambah judul\`\n🗑️ \`${P}playlists hapus 3\`\n👥 \`${P}gabungruang KODE\` — teman terima playlist yang sama\n\nKode ruanganmu: *${kode}*`)
      }
      ruangan.set(kode, { host: user, nama, tracks, ts: Date.now() })
      await kirimKartu(m, { tracks, kode, nama, query: q, host: true })
      return m.sendButtons({
        title: '🟢 Spotify LIVE',
        text: `*${nama}* · ruangan *${kode}*\n\n${daftar(tracks)}\n\nKartu di atas ☝️ — lagu 1 diputar *penuh sampai habis*; lagu lain cuplikan → \`${P}playlists putar <no>\` untuk versi penuhnya. Tab *Dengerin Bareng* untuk ruangan. Teman gabung: \`${P}gabungruang ${kode}\`\n🔁 Tukar lagu: \`${P}playlists tukar <no> <judul>\``,
        footer: config.bot.footer,
        buttons: [
          { text: '▶ Putar penuh no 2', id: `${P}playlists putar 2` },
          { text: '🔁 Cara tukar lagu', id: `${P}playlists tukar` },
          { text: '👥 Info ruangan', id: `${P}ruanganku` },
          { text: '🟢 Lagu penuh (.play3)', id: `${P}play3 ${tracks[0].judul} ${tracks[0].artis}` }
        ]
      })
    } catch (e) {
      console.error('[playlists]', e)
      return m.reply(`❌ Gagal: ${e.message}`)
    }
  }
}

export const gabungruang = {
  command: ['gabungruang', 'joinroom', 'gabungruangan', 'joinruang'],
  category: 'Downloader',
  description: '👥 Gabung ruangan Spotify LIVE dengan kode 4 huruf — terima kartu playlist host',
  limit: 0,
  cooldown: 5,
  contoh: 'ABCD',
  run: async m => {
    const k = String(m.q || '').trim().toUpperCase().slice(0, 4)
    if (!k) return m.reply(`👥 \`${P}gabungruang KODE\` — kode ada di kartu host (tab Dengerin Bareng → Buat ruangan).`)
    const r = ruangan.get(k)
    if (!r || !r.tracks?.length) return m.reply(`❌ Ruangan *${k}* tidak ada / sudah kosong. Minta host kirim \`${P}playlists judul\` lagi.`)
    const nama = truncate(String(m.pushName || 'Kamu'), 20)
    try {
      await kirimKartu(m, { tracks: r.tracks, kode: k, nama: `${nama} · host ${r.nama}`, host: false })
      return m.reply(`👥 Kamu bergabung ke ruangan *${k}* (host: ${r.nama}). ${r.tracks.length} lagu — kartu di atas ☝️`)
    } catch (e) { return m.reply(`❌ Gagal kirim kartu: ${e.message}`) }
  }
}

export const ruanganku = {
  command: ['ruanganku', 'myroom', 'inforuang'],
  category: 'Downloader',
  description: '👥 Info ruangan Spotify LIVE milikmu (kode + daftar lagu)',
  limit: 0,
  run: async m => {
    const user = m.senderKey || m.sender
    const kode = buatKode(user); const r = ruangan.get(kode)
    return m.reply(`👥 *RUANGANMU: ${kode}*\n${r?.tracks?.length ? daftar(r.tracks) : 'belum ada lagu — `' + P + 'playlists judul`'}\n\nTeman gabung: \`${P}gabungruang ${kode}\``)
  }
}

export default { playlists, gabungruang, ruanganku }
