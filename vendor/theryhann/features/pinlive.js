/**
 * 📌 .pinlive <kata kunci> — KARTU CARI + UNDUH PINTEREST LIVE (v7.36.0)
 * ------------------------------------------------------------------
 *  Kartu TERANG: logo P, LIVE, Tersambung, kotak cari + Cari, grid
 *  gambar 2 kolom + halaman ▲▼ (JS), ketuk = pratinjau + salin perintah.
 *  `.pinlive <token> <no>` → kirim gambar/video penuh via WA + tombol ▲▼.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariPin } from '../lib/pinterest.js'
import { unduhBuffer } from '../lib/ikyyapi.js'
import { simpanPilihan, ambilPilihan } from '../lib/musikplayer.js'
import { kecilkanCover } from '../lib/lagupenuh.js'
import { pinliveSearchHtml } from '../lib/pinlivehtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix
const MAKS_HASIL = 10

const BANTUAN = `📌 *PINLIVE — CARI GAMBAR PINTEREST LIVE*

\`${P}pinlive <kata kunci>\` — kartu hasil + ketuk untuk pratinjau
\`${P}pinlive <token> <no>\` — unduh gambar/video no-ke

Contoh: \`${P}pinlive wallpaper aesthetic\``

async function thumbPin (url) {
  try {
    if (!url) return ''
    const buf0 = await unduhBuffer(url, { timeout: 15000, maks: 4e6 })
    let buf = Buffer.isBuffer(buf0) ? buf0 : Buffer.from(buf0)
    if (buf.length > 30000) buf = (await kecilkanCover(buf, 400).catch(() => null)) || buf
    const mime = buf[0] === 0x89 ? 'image/png' : (buf[0] === 0x52 ? 'image/webp' : 'image/jpeg')
    return `data:${mime};base64,` + buf.toString('base64')
  } catch { return '' }
}

async function kirimKartu (m, q, hasil, token) {
  const thumbs = await Promise.all(hasil.map(v => thumbPin(v.gambar)))
  const items = hasil.map((v, i) => ({ ...v, thumb: thumbs[i] || '' }))
  const html = pinliveSearchHtml(config.bot.name, { q, hasil: items, token, P })
  let viaHtml = false
  try {
    await sendHtmlApp(m.sock, m.jid, { title: `📌 Pinlive — ${truncate(q, 40)}`, html, trustedSources: ['pinimg.com', 'i.pinimg.com'] })
    viaHtml = true
  } catch (e) { console.error('[pinlive] html:', e.message) }
  const daftar = hasil.map((v, i) => `${i + 1}. ${truncate(v.judul || 'Tanpa judul', 40)}${v.video ? ' ▶' : ''}`).join('\n')
  const atas = hasil.slice(0, 3).map((v, i) => ({ text: truncate(`${i + 1}. ${v.judul || 'gambar'}`, 20), id: `${P}pinlive ${token} ${i + 1}` }))
  const teks = `${viaHtml ? '☝️ Kartu hasil di atas — ketuk gambar untuk pratinjau + salin perintah unduh.' : '⚠️ Kartu tidak tampil — pakai daftar di bawah.'}\n\n${daftar}\n\n📥 Unduh: \`${P}pinlive ${token} <no>\``
  try {
    await m.sendButtons({ title: '📌 Pinlive', text: teks, footer: config.bot.footer, buttons: atas })
  } catch { await m.reply(teks).catch(() => {}) }
}

export const pinlive = {
  command: ['pinlive', 'pinl'],
  category: 'Downloader',
  description: '📌 Kartu cari + unduh gambar Pinterest live (grid, pratinjau) — .pinlive kata kunci',
  async run (m) {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(BANTUAN)
    try { await m.react?.('📌') } catch {}
    try {
      const kembali = q.match(/^#?([A-Z0-9]{6})$/i)
      if (kembali) {
        const simpan = ambilPilihan(kembali[1])
        if (!simpan?.hasil?.length) return m.reply(`⏱️ Hasil kedaluwarsa — ketik \`${P}pinlive <kata kunci>\` lagi.`)
        await kirimKartu(m, simpan.q, simpan.hasil, (simpan.token || kembali[1]).toUpperCase())
        return
      }
      const ambil = q.match(/^#?([A-Z0-9]{6})\s+(\d{1,2})$/i)
      if (ambil) {
        const simpan = ambilPilihan(ambil[1])
        if (!simpan?.hasil?.length) return m.reply(`⏱️ Hasil kedaluwarsa — ketik \`${P}pinlive <kata kunci>\` lagi.`)
        const hasil = simpan.hasil
        const idx = parseInt(ambil[2]) - 1
        const token = (simpan.token || ambil[1]).toUpperCase()
        if (idx < 0 || idx >= hasil.length) return m.reply(`❌ Nomor 1–${hasil.length}. Contoh: \`${P}pinlive ${token} 1\``)
        const v = hasil[idx]
        await m.reply(`⏳ Mengunduh *${truncate(v.judul || 'gambar', 60)}*…`)
        const cap = `📌 *${v.judul || 'Tanpa judul'}*${v.kreator ? `\n👤 ${v.kreator}` : ''}${v.suka || v.simpan ? `\n♥ ${v.suka || 0} · 📌 ${v.simpan || 0}` : ''}${v.url ? `\n🔗 ${v.url}` : ''}`
        try {
          if (v.video) {
            const buf = await unduhBuffer(v.video, { timeout: 120000, maks: 60e6 })
            await m.sock.sendMessage(m.jid, { video: buf, mimetype: 'video/mp4', caption: cap }, { quoted: m.raw })
          } else if (v.gambar) {
            const buf = await unduhBuffer(v.gambar, { timeout: 90000, maks: 20e6 })
            await m.sock.sendMessage(m.jid, { image: buf, caption: cap }, { quoted: m.raw })
          } else {
            return m.reply('❌ Pin ini tanpa gambar/video.')
          }
        } catch (e) {
          console.error('[pinlive] unduh:', e.message)
          return m.reply(`❌ Gagal mengunduh.${v.url ? `\n🔗 Buka langsung: ${v.url}` : ''}\nCoba lagi nanti.`)
        }
        const tombol = []
        if (idx > 0) tombol.push({ text: `▲ ${idx}/${hasil.length}`, id: `${P}pinlive ${token} ${idx}` })
        if (idx < hasil.length - 1) tombol.push({ text: `▼ ${idx + 2}/${hasil.length}`, id: `${P}pinlive ${token} ${idx + 2}` })
        tombol.push({ text: '🔎 Hasil', id: `${P}pinlive #${token}` })
        await m.sendButtons({ title: '📌 Pinlive', text: `*${truncate(v.judul || 'gambar', 60)}*`, footer: config.bot.footer, buttons: tombol }).catch(() => {})
        return
      }
      await m.reply(`🔎 Mencari pin *"${truncate(q, 50)}"*…`)
      const hasil = await cariPin(q, MAKS_HASIL).catch(e => { console.error('[pinlive] cari:', e.message); return [] })
      if (!hasil.length) return m.reply(`❌ Tidak ada pin untuk "${truncate(q, 50)}". Coba kata kunci lain.`)
      const token = simpanPilihan({ hasil, q, asal: 'pinlive' })
      await kirimKartu(m, q, hasil, token)
    } catch (e) {
      console.error('[pinlive]:', e.message)
      await m.reply(`❌ Gagal: ${e.message}\nCoba lagi nanti.`).catch(() => {})
    }
  }
}

export default { pinlive }
