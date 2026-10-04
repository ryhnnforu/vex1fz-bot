/**
 * 🟢 .play3 <judul> — PEMUTAR ALA SPOTIFY + LIRIK, LAGU PENUH (v7.10.0)
 * ------------------------------------------------------------------
 *  Menggantikan .play2 lama (nama .play3 sejak v7.10.1) (theresav-only). Sekarang:
 *   • metadata + cover : Deezer/iTunes (lib/musikplayer.js)
 *   • audio PENUH      : theresav (Spotify) → yt-dlp → fallback preview
 *   • lirik            : LRCLIB (sinkron per baris bila ada)
 *   • kartu            : lib/spotifyhtml.js — "PLAYING FROM SEARCH", cover
 *                        besar, ♥, seekbar, ⇄ ⏮ ⏯ ⏭ ↻; ketuk cover → lirik
 *   • file audio WA kualitas asli ikut dikirim
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariLagu, simpanPilihan, ambilPilihan } from '../lib/musikplayer.js'
import { ambilLirik, lirikTeks } from '../lib/lirik.js'
import { spotifyHtml } from '../lib/spotifyhtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { siapkanAudio, kirimAudioWA } from '../lib/siapkanlagu.js'
import { getSettings, setSetting } from '../lib/database.js'

const P = config.display.prefix
const fmt = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '-'

async function kirimSpotify (m, t, mode = 'auto') {
  const [A, lirik] = await Promise.all([siapkanAudio(t, 'play3', mode), ambilLirik(t).catch(() => null)])
  const html = spotifyHtml(config.bot.name, { judul: t.judul, artis: t.artis, cover: A.cover || '', url: A.urlAudio, cadangan: A.urlCadangan || '', durasi: t.durasiAsli, lirik, sumber: A.penuh ? 'FULL' : 'PREVIEW' })
  let viaHtml = false
  try { await sendHtmlApp(m.sock, m.jid, { title: `🟢 ${truncate(t.judul, 40)} — ${truncate(t.artis, 30)}`, html, trustedSources: ['hirara.dev', ...(A.streamHost ? [A.streamHost] : [])] }); viaHtml = true } catch (e) { console.error('[play3] html:', e.message) }
  const viaAudio = await kirimAudioWA(m, t, A.audio, A.mime, 'play3')
  return { viaHtml, viaAudio, lirik, penuh: A.penuh }
}

export const play3 = {
  command: ['play3', 'spotify', 'splay', 'playspotify', 'lagu3', 'putar3', 'musik3', 'playlirik', 'playermusik', 'nowplaying', 'play3html', 'musikhtml', 'spotdl', 'spotifydl', 'spotifplay'],
  category: 'Downloader',
  description: '🟢 Pemutar ala Spotify (kartu HTML) + LIRIK sinkron + lagu PENUH — .play3 judul lagu',
  limit: 1,
  cooldown: 5,
  contoh: 'misery pupsies',
  run: async m => {
    let q = String(m.q || '').trim()
    let modePilih = 'auto'
    let hasilAwal = null
    const tok = q.match(/^#([A-Z0-9]{6})\s+(30|full)$/i)
    if (tok) {
      const simpan = ambilPilihan(tok[1])
      if (!simpan?.hasil?.length) return m.reply(`⏱️ Pilihan kedaluwarsa — ketik \`${P}play3 <judul>\` lagi.`)
      q = simpan.q
      hasilAwal = simpan.hasil
      modePilih = tok[2].toLowerCase() === '30' ? '30' : 'full'
    }
    if (!q) return m.reply(`🟢 *PLAY3 — SPOTIFY STYLE*\n\n\`${P}play3 misery pupsies\`\n\nKartu ala Spotify: cover besar, ♥, seek, ⇄ ⏮ ⏯ ⏭ ↻. Ketuk cover → *lirik* (sinkron bila tersedia). Lagu diputar *penuh* + file audio dikirim.`)
    try { await m.react?.('🟢') } catch {}
    try {
      const hasil = hasilAwal || await cariLagu(q, 5)
      if (!hasil.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan. Coba tulis judul + artis.`)
      if (!hasilAwal) {
        const token = simpanPilihan({ hasil, q })
        const t0 = hasil[0]
        return m.sendButtons({
          title: '🟢 Pilih durasi',
          text: `🟢 *${t0.judul}*\n${t0.artis} · ⏱️ ${fmt(t0.durasiAsli)} · ${t0.sumber}\n\nPilih durasi audio:`,
          footer: config.bot.footer,
          buttons: [{ text: '⏱️ 30 detik', id: `${P}play3 #${token} 30` }, { text: '🎵 Durasi full', id: `${P}play3 #${token} full` }]
        }).catch(() => m.reply(`🟢 *PILIH DURASI — ${t0.judul}*\n\n\`${P}play3 #${token} 30\` — 30 detik\n\`${P}play3 #${token} full\` — lagu penuh`))
      }
      const t = hasil[0]; const lain = hasil.slice(1, 4)
      const r = await kirimSpotify(m, t, modePilih)
      const teks =
        `🟢 *${t.judul}*\n${t.artis}${t.album ? ` · _${t.album}_` : ''}\n⏱️ ${fmt(t.durasiAsli)} · ${t.sumber}\n\n` +
        `${r.viaHtml ? 'Pemutar ada di atas ☝️ — ketuk ▶, ketuk cover untuk lirik.' : '⚠️ Kartu HTML tidak terkirim.'}` +
        `${r.viaAudio ? `\n🎵 File audio${r.penuh ? ' penuh' : ''} juga dikirim.` : '\n❌ File audio gagal dikirim.'}` +
        `${modePilih === '30' ? '\n⏱️ Mode 30 detik (sesuai pilihan).' : (r.penuh ? '' : `\n⚠️ Lagu penuh gagal diambil dari semua sumber — coba lagi nanti.`)}` +
        `${r.lirik ? `\n📝 Lirik: ${r.lirik.baris} baris${r.lirik.sinkron?.length ? ' (sinkron)' : ''}` : '\n📝 Lirik tidak ditemukan di LRCLIB'}` +
        `${lain.length ? `\n\n*Hasil lain:*\n${lain.map((x, i) => `${i + 2}. ${x.judul} — ${x.artis}`).join('\n')}` : ''}`
      return m.sendButtons({
        title: '🟢 Spotify Player',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          ...lain.slice(0, 2).map((x, i) => ({ text: truncate(`${i + 2}. ${x.judul}`, 20), id: `${P}play3 ${x.judul} ${x.artis}` })),
          { text: '📝 Lirik teks', id: `${P}liriklagu3 ${t.judul} ${t.artis}` },
          { text: '🎧 Versi Now Playing', id: `${P}play ${t.judul} ${t.artis}` }
        ]
      }).catch(() => m.reply(teks))
    } catch (e) {
      console.error('[play3]', e)
      return m.reply(`❌ Gagal: ${truncate(String(e.message || e), 200)}`)
    }
  }
}

export const lirikLagu2 = {
  command: ['liriklagu3', 'lirik2', 'lyrics2', 'liriklagu2'],
  category: 'Downloader',
  description: '📝 Lirik lagu sebagai teks (LRCLIB) — .liriklagu3 judul artis',
  limit: 0,
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`📝 \`${P}liriklagu3 judul artis\``)
    const hasil = await cariLagu(q, 1).catch(() => [])
    const t = hasil[0] || { judul: q, artis: '' }
    const l = await ambilLirik(t).catch(() => null)
    if (!l) return m.reply(`❌ Lirik "${q}" tidak ditemukan.`)
    return m.reply(lirikTeks(t, l))
  }
}

export const setApiKeySpotify = {
  command: ['setapikeyspotify', 'setkeytheresav', 'apikeyspotify'],
  category: 'Owner',
  owner: true,
  description: '🔑 Simpan API key api.theresav.eu (sumber lagu penuh Spotify untuk .play/.play3)',
  run: async m => {
    const key = String(m.q || '').trim()
    const now = String(getSettings().theresavKey || '')
    if (!key) return m.reply(`🔑 \`${P}setapikeyspotify <key>\`\nStatus: ${now ? '✅ terpasang (' + now.slice(0, 4) + '…)' : '❌ belum ada'}\nKey didapat dari https://api.theresav.eu\nTanpa key, bot memakai yt-dlp (kalau terpasang) untuk lagu penuh.`)
    if (key === 'hapus') { setSetting('theresavKey', ''); return m.reply('🗑️ API key dihapus.') }
    setSetting('theresavKey', key)
    return m.reply(`✅ API key theresav tersimpan (${key.slice(0, 4)}…${key.slice(-3)}).\nCoba: ${P}play3 misery pupsies`)
  }
}

export default { play3, lirikLagu2, setApiKeySpotify }
