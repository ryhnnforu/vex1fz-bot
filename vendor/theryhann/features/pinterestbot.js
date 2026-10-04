/**
 * ============================================================================
 *  📌 PINTEREST (.pin) — dibuat ulang persis seperti kartu di video rujukan
 * ============================================================================
 *  Alur:
 *    1. `.pin <kata kunci> [jumlah]`   → cari, kirim ringkasan
 *                                         "✅ Ditemukan X/X hasil"
 *    2. tiap hasil dikirim sebagai kartu:
 *         📌 *judul*
 *         📋 Board: <nama board>
 *         👤 <username>
 *         (footer ⚡ nama bot)
 *       lengkap dengan 2 tombol:
 *         🔗 Lihat Sumber   → membuka link pin
 *         ⬇️ Download HD    → mengirim ulang gambarnya ukuran penuh
 *    3. `.pinsumber <link>` dan `.pinhd <link>` adalah isi tombol itu
 *       (diklik user = perintah bot, jalan otomatis).
 *
 *  `.pinvideo` & `.pininfo` dipertahankan seperti sebelumnya.
 *  Mesin: lib/pinterest.js (scraping internal Pinterest, tanpa key).
 * ============================================================================
 */
import { config } from '../config.js'
import { cariPin, cariVideoPin, detailPin } from '../lib/pinterest.js'
import { unduhBuffer } from '../lib/ikyyapi.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const NAMA = `${config.bot.name} Pinterest`
const MAKS_HASIL = 6

/* caption kartu — format persis seperti video rujukan */
function kartuPin (p) {
  const baris = [`📌 *${truncate(p.judul || 'Tanpa judul', 70)}*`]
  if (p.board) baris.push(`📋 Board: ${truncate(p.board, 40)}`)
  if (p.username || p.kreator) baris.push(`👤 ${p.username ? truncate(p.username, 40) : truncate(p.kreator, 40)}`)
  return baris.join('\n')
}

/* tombol di bawah kartu */
function tombolPin (p) {
  const t = []
  if (p.url) t.push({ text: '🔗 Lihat Sumber', id: `${P}pinsumber ${p.url}` })
  if (p.hd || p.gambar) t.push({ text: '⬇️ Download HD', id: `${P}pinhd ${p.hd || p.gambar}` })
  return t
}

export const pinCmd = {
  command: ['pin', 'pinterest', 'pinter', 'pinsearch', 'caripin', 'pinterestdl', 'carpin'],
  category: 'Downloader',
  description: '📌 Cari gambar Pinterest — kartu + tombol Lihat Sumber / Download HD',
  limit: 0,
  cooldown: 6,
  contoh: 'erupsi anak krakatau 5',
  run: async m => {
    let q = String(m.q || '').trim()
    let jml = 5
    const mm = q.match(/^(\d{1,2})\s+(.+)$/) || q.match(/(.+?)\s+(\d{1,2})$/)
    if (mm) {
      const depan = /^\d+$/.test(mm[1])
      const angka = parseInt(depan ? mm[1] : mm[2], 10)
      if (angka >= 1 && angka <= MAKS_HASIL) { jml = angka; q = (depan ? mm[2] : mm[1]).trim() }
    }
    if (!q) {
      return m.reply(
        `📌 *PINTEREST — ${config.bot.name}*\n\n` +
        `• \`${P}pin <kata kunci>\` — kirim s/d ${MAKS_HASIL} kartu pin\n` +
        `• \`${P}pin <kata kunci> 3\` — kirim 3 kartu\n` +
        `• \`${P}pinvideo <kata kunci>\` — video pin\n` +
        `• \`${P}pininfo <link/id pin>\` — detail satu pin\n\n` +
        `Tiap kartu punya tombol *🔗 Lihat Sumber* dan *⬇️ Download HD*.\n` +
        `Contoh: \`${P}pin erupsi anak krakatau 5\``
      )
    }
    await m.react?.('📌').catch(() => {})

    let pin
    try {
      pin = await cariPin(q, Math.max(jml, 4))
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(
        `⚠️ Gagal cari "${truncate(q, 30)}": ${truncate(String(e?.message || e), 120)}\n\n` +
        `Coba kata kunci lain atau beberapa menit lagi (Pinterest kadang membatasi).`
      )
    }
    const ambil = pin.filter(p => p.gambar).slice(0, jml)
    if (!ambil.length) {
      return m.reply(`❌ Tidak ada hasil gambar untuk "${truncate(q, 40)}". Coba kata kunci lain.`)
    }

    /* ringkasan dulu, persis seperti video: ✅ Ditemukan X/X hasil */
    await m.sendInteractive({
      title: '📌 Pinterest',
      text: `✅ Ditemukan ${ambil.length}/${jml} hasil`,
      footer: `⚡ ${NAMA}`,
      buttons: []
    }).catch(() => m.reply(`✅ Ditemukan ${ambil.length}/${jml} hasil`))

    let terkirim = 0
    for (const p of ambil) {
      try {
        const buf = await unduhBuffer(p.gambar, { timeout: 90000, maks: 20e6 })
        await m.sendInteractive({
          image: buf,
          text: kartuPin(p),
          footer: `⚡ ${NAMA}`,
          buttons: tombolPin(p)
        }).catch(async () => {
          /* fallback: gambar + caption polos kalau tombol tidak tampil */
          await m.sock.sendMessage(m.jid, {
            image: buf,
            caption: `${kartuPin(p)}\n\n⚡ ${NAMA}${p.url ? `\n🔗 ${p.url}` : ''}`
          }, { quoted: m.raw })
        })
        terkirim++
      } catch (e) {
        console.warn('[pin] unduh gagal:', p.url, e?.message || e)
      }
    }

    await m.react?.(terkirim ? '✅' : '⚠️').catch(() => {})
    if (!terkirim) return m.reply('❌ Kartu pin-nya ada tapi semuanya gagal diunduh dari server Pinterest. Coba kata kunci lain.')
    if (terkirim < ambil.length) return m.reply(`_Terkirim ${terkirim}/${ambil.length} kartu — sisanya ditolak server unduhan._`)
  }
}

/* ================= tombol: lihat sumber ================= */
export const pinSumberCmd = {
  command: ['pinsumber', 'sumberpin', 'pinlink'],
  category: 'Downloader',
  description: '🔗 Kirim link sumber sebuah pin (isi tombol Lihat Sumber)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const url = String(m.q || '').trim()
    if (!/^https?:\/\//i.test(url)) return m.reply(`Contoh: \`${P}pinsumber https://www.pinterest.com/pin/123/\``)
    return m.reply(`🔗 *Lihat Sumber*\n\n${url}\n\nBuka di browser untuk melihat pin aslinya.`)
  }
}

/* ================= tombol: download hd ================= */
export const pinHdCmd = {
  command: ['pinhd', 'downloadpin', 'pinfull'],
  category: 'Downloader',
  description: '⬇️ Kirim ulang gambar pin ukuran penuh (isi tombol Download HD)',
  limit: 0,
  cooldown: 4,
  run: async m => {
    const url = String(m.q || '').trim()
    if (!/^https?:\/\//i.test(url)) return m.reply(`Contoh: \`${P}pinhd https://i.pinimg.com/originals/xx.jpg\``)
    await m.react?.('⬇️').catch(() => {})
    try {
      const buf = await unduhBuffer(url, { timeout: 90000, maks: 20e6 })
      await m.sock.sendMessage(m.jid, {
        image: buf,
        caption: `⬇️ *HD* — ukuran penuh\n⚡ ${NAMA}`
      }, { quoted: m.raw })
      return m.react?.('✅').catch(() => {})
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(`❌ Gagal mengunduh HD: ${truncate(String(e?.message || e), 120)}`)
    }
  }
}

/* ================= video pin (dipertahankan) ================= */
export const pinVideoCmd = {
  command: ['pinvideo', 'pinvid', 'videopin', 'videopinterest', 'pinvideodl'],
  category: 'Downloader',
  description: '🎬 Cari & unduh video dari Pinterest — `.pinvideo kucing lucu 2`',
  limit: 0,
  cooldown: 6,
  run: async m => {
    let q = String(m.q || '').trim()
    let jml = 1
    const mm = q.match(/^(\d{1,2})\s+(.+)$/) || q.match(/(.+?)\s+(\d{1,2})$/)
    if (mm) {
      const depan = /^\d+$/.test(mm[1])
      const angka = parseInt(depan ? mm[1] : mm[2], 10)
      if (angka >= 1 && angka <= 3) { jml = angka; q = (depan ? mm[2] : mm[1]).trim() }
    }
    if (!q) return m.reply(`Contoh: \`${P}pinvideo kucing lucu\` (maks 3 video)`)
    await m.react?.('🎬').catch(() => {})
    let pin
    try { pin = await cariVideoPin(q, Math.max(jml, 2)) } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(`⚠️ Gagal cari video: ${truncate(String(e?.message || e), 120)}`)
    }
    const ambil = pin.filter(p => p.video).slice(0, jml)
    if (!ambil.length) return m.reply(`❌ Tidak ada video untuk "${truncate(q, 40)}".`)
    let terkirim = 0
    for (const p of ambil) {
      try {
        const buf = await unduhBuffer(p.video, { timeout: 120000, maks: 60e6 })
        await m.sock.sendMessage(m.jid, {
          video: buf,
          caption: `🎬 *${truncate(p.judul || 'Video Pinterest', 60)}*\n👤 ${p.username || p.kreator || '-'}\n⚡ ${NAMA}`
        }, { quoted: m.raw })
        terkirim++
      } catch (e) { console.warn('[pinvideo] gagal:', p.url, e?.message || e) }
    }
    if (!terkirim) return m.reply('❌ Videonya ada tapi gagal diunduh. Coba lagi.')
  }
}

/* ================= detail satu pin (dipertahankan) ================= */
export const pinInfoCmd = {
  command: ['pininfo', 'infopin', 'detailpin'],
  category: 'Downloader',
  description: 'ℹ️ Detail satu pin + kirim medianya — `.pininfo <link/id>`',
  limit: 0,
  cooldown: 4,
  run: async m => {
    let id = String(m.q || '').trim()
    const mm = id.match(/pin\/(\d+)/i) || id.match(/^(\d{6,})$/)
    if (!mm) return m.reply(`Contoh: \`${P}pininfo https://www.pinterest.com/pin/123456789/\` atau \`${P}pininfo 123456789\``)
    id = mm[1]
    await m.react?.('ℹ️').catch(() => {})
    let d
    try { d = await detailPin(id) } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(`⚠️ Gagal ambil detail: ${truncate(String(e?.message || e), 120)}`)
    }
    const teks =
      `📌 *${truncate(d.judul || 'Tanpa judul', 70)}*\n` +
      (d.board ? `📋 Board: ${truncate(d.board, 40)}\n` : '') +
      (d.kreator ? `👤 ${d.kreator}${d.username ? ` (@${truncate(d.username, 30)})` : ''}\n` : '') +
      `❤️ ${(d.suka || 0).toLocaleString('id-ID')} · 📥 ${(d.simpan || 0).toLocaleString('id-ID')} · 💬 ${d.komentar || 0}\n` +
      (d.deskripsi ? `\n_${truncate(d.deskripsi, 200)}_\n` : '') +
      (d.url ? `\n🔗 ${d.url}` : '')
    const media = d.video || d.gambar
    if (media) {
      try {
        const buf = await unduhBuffer(media, { timeout: 120000, maks: 60e6 })
        const pesan = d.video ? { video: buf, caption: teks } : { image: buf, caption: teks }
        return m.sock.sendMessage(m.jid, pesan, { quoted: m.raw })
      } catch {}
    }
    return m.reply(teks)
  }
}

export default { pinCmd, pinSumberCmd, pinHdCmd, pinVideoCmd, pinInfoCmd }
