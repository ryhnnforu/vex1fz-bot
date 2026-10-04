/**
 * 🟢 .play2 — HUB SPOTIFY (v7.30.0)
 *  Menggabungkan semua fitur bergaya Spotify ke satu perintah:
 *   .play2 <judul>            → kartu Spotify (mesin Rich Music): 4 lagu + kotak CARI di dalam kartu,
 *                               vinyl berputar, equalizer, bar "Sedang diputar", lirik bersinkron,
 *                               shuffle/repeat, lagu PENUH di-stream dari server bot; audio WA ikut dikirim.
 *   .play2 vibe <judul>       → Spotify Vibe (tema kartu ikut warna cover)          [= .spotifyvibe]
 *   .play2 kartu <judul>      → kartu single ala Spotify + lirik + audio WA          [= .play3]
 *   .play2 live / room        → Spotify Live (ruang dengar bersama)                  [= .spotifylive]
 *   .play2 next|prev|acak|N   → kontrol antrian (playerlab)
 *  Alias lama (.play3, .spotifyvibe, .spotify) tetap hidup.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariLagu, ambilAntrian, kontrolPlayerHtml, simpanAntrian, simpanPilihan, ambilPilihan } from '../lib/musikplayer.js'
import { richMusicHtml } from '../lib/richmusic.js'
import { TRUSTED_LIVE } from '../lib/spotifylive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { siapkanTrackKecil } from './playlists.js'
import { ambilLirik } from '../lib/lirik.js'
import { siapkanStream, hostStream, endpointStream } from '../lib/webaudio.js'
import { siapkanAudio, kirimAudioWA } from '../lib/siapkanlagu.js'
import { kendaliPlay2 } from './playerlab.js'

const P = config.display.prefix
const N_LAGU = 4
const PER_LAGU = 44 * 1024
const K = m => m.senderKey || m.sender

async function siapkan (t, mode = 'auto') {
  const x = await siapkanTrackKecil(t, PER_LAGU, false).catch(() => null)
  if (!x?.url) return null
  const lirik = await ambilLirik({ judul: t.judul, artis: t.artis, durasiAsli: t.durasiAsli }).catch(() => null)
  const st = mode === '30' ? { url: '' } : siapkanStream(t.judul, t.artis)
  const durAsli = Number(t.durasiAsli) || 0
  const offset = durAsli > 60 ? Math.max(0, Math.round(durAsli / 2 - 15)) : 0
  const sinkron = lirik?.sinkron?.length ? lirik.sinkron.filter(([s]) => s >= offset - 5 && s <= offset + (x.durasi || 30) + 20).map(([s, l]) => [Math.max(0, +s.toFixed(2)), l]) : null
  const lirikPenuh = lirik?.sinkron?.length ? lirik.sinkron.slice(0, 80).map(([s, l]) => [+(+s).toFixed(2), l]) : null
  return { ...x, judul: t.judul, artis: t.artis, dur: durAsli, warna: [29, 185, 84], offset: st.url ? 0 : offset, penuh: st.url, durPenuh: durAsli, lirik: st.url ? lirikPenuh : (sinkron?.length ? sinkron : lirikPenuh) }
}

export const play2 = {
  command: ['play2', 'spotifyhub', 'playspot', 'sp2', 'musik2', 'lagu2', 'putar2'],
  category: 'Downloader',
  description: '🟢 HUB SPOTIFY: kartu Spotify animasi (vinyl, equalizer, lirik sinkron, cari lagu DI DALAM kartu, lagu penuh) + audio WA. Sub: vibe · kartu · live · next/prev/acak',
  limit: 1,
  cooldown: 5,
  contoh: 'starboy the weeknd',
  run: async (m, ctx) => {
    let q0 = String(m.q || '').trim()
    let modePilih = 'auto'
    let hasilAwal = null
    const tok = q0.match(/^#([A-Z0-9]{6})\s+(30|full)$/i)
    if (tok) {
      const simpan = ambilPilihan(tok[1])
      if (!simpan?.hasil?.length) return m.reply(`⏱️ Pilihan kedaluwarsa — ketik \`${P}play2 <judul>\` lagi.`)
      q0 = simpan.q
      hasilAwal = simpan.hasil
      modePilih = tok[2].toLowerCase() === '30' ? '30' : 'full'
    }
    if (!q0) {
      return m.sendButtons?.({
        title: '🟢 PLAY2 — SPOTIFY HUB',
        text: `*🟢 PLAY2 — SPOTIFY HUB*\n\n▸ \`${P}play2 <judul>\` — kartu Spotify animasi: 4 lagu, *cari lagu di dalam kartu*, vinyl berputar, equalizer, lirik sinkron, lagu penuh + audio WA\n▸ \`${P}play2 vibe <judul>\` — tema kartu ikut warna cover (Spotify Vibe)\n▸ \`${P}play2 kartu <judul>\` — kartu single + lirik (ex .play3)\n▸ \`${P}play2 live\` — dengar bareng (Spotify Live)\n▸ \`${P}play2 next / prev / acak / 3\` — kontrol antrian\n\nContoh: \`${P}play2 starboy the weeknd\``,
        buttons: [{ text: '🎵 Contoh', id: `${P}play2 starboy the weeknd` }, { text: '🎨 Vibe', id: `${P}play2 vibe blinding lights` }]
      }) || m.reply(`🟢 *PLAY2*\n\`${P}play2 <judul>\``)
    }
    const [sub, ...sisa] = q0.split(/\s+/); const s = sub.toLowerCase(); const rest = sisa.join(' ').trim()
    const jalankan = async (nama, q) => { const { findPlugin } = await import('../lib/plugins.js'); const pl = findPlugin(nama)?.plugin; if (!pl) return m.reply(`❌ modul ${nama} tidak ada`); m.q = q; m.command = nama; return pl.run(m, ctx) }
    if (['vibe', 'tema', 'warna'].includes(s)) return jalankan('spotifyvibe', rest)
    if (['kartu', 'single', 'card', 'play3'].includes(s)) return jalankan('play3', rest)
    if (['live', 'room', 'ruang', 'bareng'].includes(s)) return jalankan('spotifylive', rest)
    const kend = kendaliPlay2(q0)
    if (kend !== null && kend !== 'kartu' && ambilAntrian(K(m)).tracks.length) return kontrolPlayerHtml(m, kend)

    /* ---- mode utama: kartu Spotify hub ---- */
    const q = q0
    try { await m.react?.('🟢') } catch {}
    if (hasilAwal) await m.reply(`🟢 Menyiapkan *PLAY2 · Spotify* untuk "${q}"… ±20 detik`)
    const hasil = hasilAwal || await cariLagu(q, N_LAGU + 2).catch(() => [])
    if (!hasil.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan. Coba judul + artis.`)
    if (!hasilAwal) {
      const token = simpanPilihan({ hasil, q })
      const t0 = hasil[0]
      return m.sendButtons({
        title: '🟢 Pilih durasi',
        text: `🟢 *${t0.judul}*\n${t0.artis} · ${t0.sumber}\n\nPilih durasi audio:`,
        footer: config.bot.footer,
        buttons: [{ text: '⏱️ 30 detik', id: `${P}play2 #${token} 30` }, { text: '🎵 Durasi full', id: `${P}play2 #${token} full` }]
      }).catch(() => m.reply(`🟢 *PILIH DURASI — ${t0.judul}*\n\n\`${P}play2 #${token} 30\` — 30 detik\n\`${P}play2 #${token} full\` — lagu penuh`))
    }
    const tracks = []
    for (const t of hasil) { if (tracks.length >= N_LAGU) break; const x = await siapkan(t, modePilih); if (x) tracks.push(x) }
    if (!tracks.length) return m.reply('❌ Server musik sibuk, coba lagi.')
    try { simpanAntrian(K(m), q, hasil.slice(0, N_LAGU), 0) } catch {}
    const html = richMusicHtml(config.bot.name, { spotify: true, nama: truncate(String(m.pushName || 'kamu'), 20), prefix: P, cmd: 'play2', query: q, tracks, ...endpointStream() })
    let viaHtml = false
    try {
      await sendHtmlApp(m.sock, m.jid, { title: `🟢 PLAY2 · ${truncate(q, 30)}`, html, trustedSources: [...TRUSTED_LIVE, ...(hostStream() ? [hostStream()] : [])] }); viaHtml = true
    } catch (e) { await m.reply(`⚠️ Kartu gagal dikirim (${truncate(String(e.message || e), 80)}) — audio tetap dikirim.`) }
    /* audio WA lagu pertama (penuh bila bisa) — seperti .play3 */
    let viaAudio = false
    try { const t = hasil[0]; const A = await siapkanAudio(t, 'play2', modePilih); viaAudio = await kirimAudioWA(m, t, A.audio, A.mime, 'play2') } catch (e) { console.error('[play2] audio:', e.message) }
    return m.reply(`🟢 *PLAY2 · SPOTIFY* — "${q}"\n\n${tracks.map((t, i) => `${i + 1}. ${t.judul} — ${t.artis}${t.lirik?.length ? ' 🎤' : ''}`).join('\n')}\n\n${viaHtml ? '• Ketuk lagu / ▶ di kartu → vinyl berputar, lirik jalan\n• Ketik judul lain di kotak *"Apa yang ingin kamu putar?"* → ganti lagu tanpa keluar kartu\n' : ''}${viaAudio ? '• Audio lagu #1 dikirim di atas 🎧\n' : ''}• \`${P}play2 next\` · \`${P}play2 vibe ${truncate(q, 20)}\` · \`${P}play2 kartu ${truncate(q, 20)}\``)
  }
}
export default { play2 }
