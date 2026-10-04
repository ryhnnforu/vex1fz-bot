/**
 * 🎨 .spotifyvibe — kartu Spotify yang TEMANYA BERUBAH mengikuti lagu (v7.24.0)
 *  Sesuai video referensi: daftar lagu + cover besar; ketuk lagu lain →
 *  seluruh kartu berganti warna sesuai cover lagu itu (merah → biru → hijau),
 *  cover memakai placeholder ♪ saat memuat. Ketuk cover → layar pemutar:
 *  seekbar, ⏮ ⏸ ⏭, panel "LIRIK · REALTIME" (baris menyala mengikuti lagu,
 *  dari LRCLIB) + log "[jam] Menghubungkan stream audio… / Buffering xx%".
 *  Warna dominan cover dihitung bot (jimp, cover 96px) saat menanam lagu;
 *  hasil pencarian online di kartu dihitung lewat canvas.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariLagu } from '../lib/musikplayer.js'
import { spotifyVibeHtml } from '../lib/spotifyvibe.js'
import { richMusicHtml } from '../lib/richmusic.js'
import { TRUSTED_LIVE } from '../lib/spotifylive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { siapkanTrackKecil } from './playlists.js'
import { ambilLirik } from '../lib/lirik.js'
import { siapkanStream, hostStream, endpointStream } from '../lib/webaudio.js'

const P = config.display.prefix
const N_LAGU = 4
const PER_LAGU = 44 * 1024

/** warna dominan (rata-rata piksel berwarna) dari data-URI cover → [r,g,b] */
async function warnaDominan (dataUri) {
  try {
    if (!dataUri?.startsWith('data:image')) return null
    const { Jimp } = await import('jimp')
    const buf = Buffer.from(dataUri.split(',')[1], 'base64')
    const img = await Jimp.read(buf)
    img.resize({ w: 24, h: 24 })
    let r = 0, g = 0, b = 0, n = 0
    const d = img.bitmap.data
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3
      const sat = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])
      if (l < 20 || l > 240) continue
      const w = 1 + sat / 64 /* piksel berwarna lebih berbobot → tema tidak abu-abu */
      r += d[i] * w; g += d[i + 1] * w; b += d[i + 2] * w; n += w
    }
    if (n < 5) return null
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
  } catch { return null }
}

async function siapkan (t) {
  const x = await siapkanTrackKecil(t, PER_LAGU, false).catch(() => null)
  if (!x?.url) return null
  const [warna, lirik] = await Promise.all([
    warnaDominan(x.cover),
    ambilLirik({ judul: t.judul, artis: t.artis, durasiAsli: t.durasiAsli }).catch(() => null)
  ])
  /* cuplikan Deezer biasanya mulai ~ tengah lagu → geser lirik supaya nyambung (offset perkiraan) */
  const durAsli = Number(t.durasiAsli) || 0
  const offset = durAsli > 60 ? Math.max(0, Math.round(durAsli / 2 - 15)) : 0
  const sinkron = lirik?.sinkron?.length ? lirik.sinkron.filter(([s]) => s >= offset - 5 && s <= offset + (x.durasi || 30) + 20).map(([s, l]) => [Math.max(0, +s.toFixed(2)), l]) : null
  /* lagu penuh: di-stream dari server bot (Railway) kalau web aktif → durasi sampai habis; lirik lengkap */
  const st = siapkanStream(t.judul, t.artis)
  const lirikPenuh = lirik?.sinkron?.length ? lirik.sinkron.slice(0, 80).map(([s, l]) => [+(+s).toFixed(2), l]) : null
  return { ...x, judul: t.judul, artis: t.artis, dur: durAsli, warna, offset: st.url ? 0 : offset, penuh: st.url, durPenuh: durAsli, lirik: st.url ? lirikPenuh : (sinkron && sinkron.length ? sinkron : (lirik?.sinkron?.slice(0, 40) || null)) }
}

export const spotifyvibe = {
  command: ['spotifyvibe', 'spvibe', 'spotifytema', 'musikvibe', 'vibeplayer', 'spotifywarna'],
  category: 'Downloader',
  description: '🎨 Kartu Spotify yang tema/warnanya berubah mengikuti lagu — ganti lagu di dalam kartu, lirik realtime, seekbar & log buffering',
  limit: 1,
  cooldown: 6,
  contoh: 'starboy the weeknd',
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`🎨 *SPOTIFY VIBE*\n\nContoh: *${P}spotifyvibe starboy*\n\nKartu Spotify yang WARNANYA ikut lagu: ketuk lagu lain → seluruh kartu berganti tema sesuai cover, ketuk cover → pemutar + LIRIK REALTIME.`)
    try { await m.react?.('🎨') } catch {}
    await m.reply(`🎨 Menyiapkan *SPOTIFY VIBE* untuk "${q}"… (${N_LAGU} lagu + warna cover + lirik) ±20 detik`)
    const hasil = await cariLagu(q, N_LAGU + 2).catch(() => [])
    const tracks = []
    for (const t of hasil) { if (tracks.length >= N_LAGU) break; const x = await siapkan(t); if (x) tracks.push(x) }
    if (!tracks.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan / server musik sibuk. Coba judul lain.`)
    const html = spotifyVibeHtml(config.bot.name, { nama: truncate(String(m.pushName || 'kamu'), 20), prefix: P, cmd: 'spotifyvibe', query: q, tracks, ...endpointStream() })
    try {
      await sendHtmlApp(m.sock, m.jid, { title: `🎨 Spotify Vibe · ${truncate(q, 30)}`, html, trustedSources: [...TRUSTED_LIVE, ...(hostStream() ? [hostStream()] : [])] })
    } catch (e) { return m.reply(`❌ Kartu gagal dikirim: ${truncate(String(e.message || e), 120)}`) }
    const adaLirik = tracks.filter(t => t.lirik?.length).length
    return m.reply(`🎨 *SPOTIFY VIBE* — "${q}"\n\n${tracks.map((t, i) => `${i + 1}. ${t.judul} — ${t.artis}${t.lirik?.length ? ' 🎤' : ''}`).join('\n')}\n\n• Ketuk lagu → *warna kartu berubah* mengikuti cover-nya\n• Ketuk cover → pemutar: seekbar · ⏮ ⏸ ⏭ · *LIRIK REALTIME* (${adaLirik}/${tracks.length} lagu ada lirik) · log buffering\n• Kolom cari di kartu: lagu lain langsung dari Deezer${tracks[0]?.penuh ? '\n• 🎧 *Lagu diputar PENUH* sampai habis (di-stream dari server bot; kalau belum siap otomatis cuplikan 30 dtk)' : '\n• ℹ️ Web bot belum aktif (PUBLIC_URL/Railway) → hanya cuplikan 30 dtk'}`)
  }
}


/* 🍎 .richmusic — kartu Apple Music (screenshot pengguna) */
export const richmusic = {
  command: ['richmusic', 'applemusic', 'amusic', 'musicrich', 'richplay'],
  category: 'Downloader',
  description: '🍎 Kartu Apple Music: cari & ganti lagu di kartu, lagu penuh (LOSSLESS) sampai habis, shuffle/repeat, Lirik Bersinkron, log buffering',
  limit: 1,
  cooldown: 6,
  contoh: 'aespa lemonade',
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`🍎 *RICH MUSIC*\n\nContoh: *${P}richmusic aespa lemonade*\n\nKartu ala Apple Music: cari lagu di kartu, putar penuh sampai habis, Lirik Bersinkron, shuffle/repeat.`)
    try { await m.react?.('🍎') } catch {}
    await m.reply(`🍎 Menyiapkan *RICH MUSIC* untuk "${q}"… ±20 detik`)
    const hasil = await cariLagu(q, N_LAGU + 2).catch(() => [])
    const tracks = []
    for (const t of hasil) { if (tracks.length >= N_LAGU) break; const x = await siapkan(t); if (x) tracks.push(x) }
    if (!tracks.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan / server musik sibuk. Coba judul lain.`)
    const html = richMusicHtml(config.bot.name, { nama: truncate(String(m.pushName || 'kamu'), 20), prefix: P, cmd: 'richmusic', query: q, tracks, ...endpointStream() })
    try {
      await sendHtmlApp(m.sock, m.jid, { title: `🍎 Rich Music · ${truncate(q, 30)}`, html, trustedSources: [...TRUSTED_LIVE, ...(hostStream() ? [hostStream()] : [])] })
    } catch (e) { return m.reply(`❌ Kartu gagal dikirim: ${truncate(String(e.message || e), 120)}`) }
    return m.reply(`🍎 *RICH MUSIC* — "${q}"\n\n${tracks.map((t, i) => `${i + 1}. ${t.judul} — ${t.artis}${t.lirik?.length ? ' 🎤' : ''}`).join('\n')}\n\n• Ketuk lagu / ▶ untuk memutar${tracks[0]?.penuh ? ' · *lagu penuh (LOSSLESS) sampai habis*' : ' · cuplikan 30 dtk (web bot belum aktif)'}\n• 🔀 shuffle · 🔁 repeat · *Lirik Bersinkron* · *Kualitas Audio*\n• Kolom cari di kartu untuk lagu lain`)
  }
}

export default { spotifyvibe, richmusic }
