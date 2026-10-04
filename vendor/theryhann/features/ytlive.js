/**
 * 🎬 .ytlive <kata kunci> — KARTU CARI + PLAYER VIDEO YOUTUBE (v7.36.0)
 * ------------------------------------------------------------------
 *  D1 KARTU CARI: header (Ytlive—bot, hasil, LIVE), kotak cari + Cari,
 *     daftar thumbnail + durasi + judul 2 baris + channel + views·umur,
 *     halaman ▲▼ di kartu (JS). Ketuk = salin perintah + toast.
 *  D2 KARTU PLAYER: .ytplay <token> <no> → video stream /v/<id> di kartu
 *     + pesan video WA + tombol native ▲▼. Gagal video → audio; gagal
 *     audio → link. TIDAK PERNAH crash (semua dibungkus try/catch).
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariYoutube } from '../lib/ytcari.js'
import { simpanPilihan, ambilPilihan } from '../lib/musikplayer.js'
import { ambilVideoPenuh, ambilLaguPenuh, kecilkanCover } from '../lib/lagupenuh.js'
import { siapkanVideo, daftarkanVideo, hostVideo } from '../lib/webvideo.js'
import { ytliveSearchHtml, ytlivePlayerHtml, rasioCari } from '../lib/ytlivehtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { webAktif } from '../lib/webgame.js'

const P = config.display.prefix
const MAKS_HASIL = 12

const BANTUAN = `🎬 *YTLIVE — CARI + PUTAR VIDEO YOUTUBE*

\`${P}ytlive <kata kunci>\` — kartu hasil + ketuk untuk memutar
\`${P}ytplay <token> <no>\` — putar video no-ke dari hasil
\`${P}ytplay <id-video>\` — putar langsung (mis. \`${P}ytplay dQw4w9WgXcQ\`)

Contoh: \`${P}ytlive semangat pagi\``

async function thumbDataUri (url) {
  try {
    if (!url) return ''
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return ''
    let buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > 25000) buf = (await kecilkanCover(buf, 320).catch(() => null)) || buf
    const mime = buf[0] === 0x89 ? 'image/png' : (buf[0] === 0x52 ? 'image/webp' : 'image/jpeg')
    return `data:${mime};base64,` + buf.toString('base64')
  } catch { return '' }
}

/** kirim kartu cari + tombol native untuk 3 teratas */
async function kirimKartuCari (m, q, hasil, token) {
  const thumbs = await Promise.all(hasil.map(v => thumbDataUri(v.cover)))
  const items = hasil.map((v, i) => ({ ...v, thumb: thumbs[i] || '' }))
  const html = ytliveSearchHtml(config.bot.name, { q, hasil: items, token, P })
  let viaHtml = false
  try {
    await sendHtmlApp(m.sock, m.jid, { title: `🎬 Ytlive — ${truncate(q, 40)}`, html, trustedSources: [hostVideo()] })
    viaHtml = true
  } catch (e) { console.error('[ytlive] html:', e.message) }
  const daftar = hasil.map((v, i) => `${i + 1}. ${truncate(v.judul, 45)}`).join('\n')
  const atas = hasil.slice(0, 3).map((v, i) => ({ text: truncate(`${i + 1}. ${v.judul}`, 20), id: `${P}ytplay ${token} ${i + 1}` }))
  const teks = `${viaHtml ? '☝️ Kartu hasil di atas — ketuk video untuk menyalin perintah putar.' : '⚠️ Kartu tidak tampil — pakai daftar di bawah.'}\n\n${daftar}\n\n▶️ Putar: \`${P}ytplay ${token} <no>\``
  try {
    await m.sendButtons({ title: '🎬 Ytlive', text: teks, footer: config.bot.footer, buttons: atas })
  } catch { await m.reply(teks).catch(() => {}) }
  return viaHtml
}

export const ytlive = {
  command: ['ytlive', 'cariyt'],
  category: 'Downloader',
  description: '🎬 Kartu cari + putar video YouTube (thumbnail, halaman, player) — .ytlive kata kunci',
  async run (m) {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(BANTUAN)
    try { await m.react?.('🔎') } catch {}
    try {
      const kembali = q.match(/^#?([A-Z0-9]{6})$/i)
      if (kembali) {
        const simpan = ambilPilihan(kembali[1])
        if (!simpan?.hasil?.length) return m.reply(`⏱️ Hasil kedaluwarsa — ketik \`${P}ytlive <kata kunci>\` lagi.`)
        await kirimKartuCari(m, simpan.q, simpan.hasil, simpan.token || kembali[1].toUpperCase())
        return
      }
      await m.reply(`🔎 Mencari video *"${truncate(q, 50)}"*…`)
      const hasil = await cariYoutube(q, MAKS_HASIL).catch(() => [])
      if (!hasil.length) return m.reply(`❌ Tidak ada video untuk "${truncate(q, 50)}". Coba kata kunci lain.`)
      const token = simpanPilihan({ hasil, q, asal: 'ytlive' })
      await kirimKartuCari(m, q, hasil, token)
    } catch (e) {
      console.error('[ytlive]:', e.message)
      await m.reply(`❌ Gagal mencari: ${e.message}\nCoba lagi nanti.`).catch(() => {})
    }
  }
}

async function infoOembed (id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return null
    const j = await r.json()
    return { judul: j.title || id, artis: j.author_name || '' }
  } catch { return null }
}

export const ytplay = {
  command: ['ytplay', 'ytputar', 'putaryt'],
  category: 'Downloader',
  description: '▶️ Putar video YouTube dari hasil .ytlive (kartu player + pesan video) — .ytplay token no',
  async run (m) {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(BANTUAN)
    try { await m.react?.('▶️') } catch {}
    try {
      let hasil = null, idx = 0, token = ''
      const pakai = q.match(/^#?([A-Z0-9]{6})\s+(\d{1,2})$/i)
      const langsung = q.match(/^([A-Za-z0-9_-]{11})$/)
      if (pakai) {
        const simpan = ambilPilihan(pakai[1])
        if (!simpan?.hasil?.length) return m.reply(`⏱️ Hasil kedaluwarsa — ketik \`${P}ytlive <kata kunci>\` lagi.`)
        hasil = simpan.hasil
        idx = parseInt(pakai[2]) - 1
        token = (simpan.token || pakai[1]).toUpperCase()
        if (idx < 0 || idx >= hasil.length) return m.reply(`❌ Nomor 1–${hasil.length}. Contoh: \`${P}ytplay ${token} 1\``)
      } else if (langsung) {
        const info = await infoOembed(langsung[1])
        const id = langsung[1]
        hasil = [{ id, judul: info?.judul || id, artis: info?.artis || '', durasi: 0, durasiAsli: 0, cover: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, url: `https://youtu.be/${id}`, views: '', umur: '' }]
        token = simpanPilihan({ hasil, q: info?.judul || id, asal: 'ytlive' })
        idx = 0
      } else {
        return m.reply(`❌ Format salah.\n\`${P}ytplay <token> <no>\` atau \`${P}ytplay <id-video>\`\nContoh: \`${P}ytlive semangat pagi\` dulu, lalu ketuk hasilnya.`)
      }
      const v = hasil[idx]
      await m.reply(`⏳ Mengambil video *${truncate(v.judul, 60)}*… (±1 menit)`)
      const ambil = ambilVideoPenuh(v.id).catch(() => null)
      const video = await Promise.race([ambil, new Promise(r => setTimeout(() => r(null), 240000))])
      if (video?.buf?.length) {
        const utama = webAktif() ? daftarkanVideo(v.id, video.buf) : { id: '', url: '' }
        const items = await Promise.all(hasil.map(async (x, i) => {
          const st = (i === idx && utama.url) ? utama : (webAktif() ? siapkanVideo(x.id) : { url: '' })
          return { id: x.id, judul: x.judul, artis: x.artis, thumb: i === idx ? (await thumbDataUri(x.cover)) : '', stream: st.url || '', link: x.url || `https://youtu.be/${x.id}` }
        }))
        /* kartu player */
        try {
          const html = ytlivePlayerHtml(config.bot.name, { items, idx, token, P })
          await sendHtmlApp(m.sock, m.jid, { title: `🎬 ${truncate(v.judul, 40)}`, html, trustedSources: [hostVideo()] })
        } catch (e) { console.error('[ytplay] html:', e.message) }
        /* pesan video WA */
        try {
          await m.sock.sendMessage(m.jid, { video: video.buf, mimetype: 'video/mp4', caption: `🎬 *${v.judul}*\n👤 ${v.artis}${v.views ? ` · 👁️ ${v.views}` : ''} · ${video.sumber}`, fileName: `${v.judul.replace(/[\\/:*?"<>|]/g, '').slice(0, 60)}.mp4` }, { quoted: m.raw })
        } catch (e) { console.error('[ytplay] video:', e.message) }
        /* tombol native */
        const tombol = []
        if (idx > 0) tombol.push({ text: `▲ ${idx}/${hasil.length}`, id: `${P}ytplay ${token} ${idx}` })
        if (idx < hasil.length - 1) tombol.push({ text: `▼ ${idx + 2}/${hasil.length}`, id: `${P}ytplay ${token} ${idx + 2}` })
        tombol.push({ text: '🔎 Hasil', id: `${P}ytlive #${token}` })
        await m.sendButtons({ title: '🎬 Memutar', text: `*${truncate(v.judul, 60)}*\n${v.artis}`, footer: config.bot.footer, buttons: tombol }).catch(() => {})
        return
      }
      /* GAGAL video → audio */
      console.error('[ytplay] video gagal, coba audio:', v.id)
      await m.reply('⚠️ Video gagal diambil — mencoba mengirim audionya…')
      const lagu = await ambilLaguPenuh(v.judul, v.artis).catch(() => null)
      if (lagu?.buf?.length) {
        try {
          await m.sock.sendMessage(m.jid, { audio: lagu.buf, mimetype: lagu.mime || 'audio/mpeg', ptt: false, fileName: `${v.judul.replace(/[\\/:*?"<>|]/g, '').slice(0, 60)}.mp3` }, { quoted: m.raw })
          await m.reply(`🎵 Audio *${truncate(v.judul, 60)}* (${lagu.sumber})\n🔗 ${v.url || `https://youtu.be/${v.id}`}`).catch(() => {})
        } catch { await m.reply(`🔗 Tonton di YouTube: ${v.url || `https://youtu.be/${v.id}`}`).catch(() => {}) }
        return
      }
      await m.reply(`❌ Video + audio gagal diambil dari semua sumber.\n🔗 Tonton langsung: ${v.url || `https://youtu.be/${v.id}`}\nCoba lagi nanti.`).catch(() => {})
    } catch (e) {
      console.error('[ytplay]:', e.message)
      await m.reply(`❌ Gagal memutar: ${e.message}\nCoba lagi nanti.`).catch(() => {})
    }
  }
}

export default { ytlive, ytplay }
