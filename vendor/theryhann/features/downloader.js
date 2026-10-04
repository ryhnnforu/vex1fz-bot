/**
 * ⬇️ DOWNLOADER — TikTok, screenshot web, media dari URL
 * Kalau API publik mati, tinggal ganti URL di lib/scraper.js
 */
import { config } from '../config.js'
import { tiktok, ssweb } from '../lib/scraper.js'
import { getBuffer, formatSize, isUrl, truncate } from '../lib/functions.js'

export default {
  command: ['tiktok', 'tt', 'ttdown'],
  category: 'Downloader',
  description: 'Download video TikTok tanpa watermark',
  limit: 1,
  cooldown: 4,
  run: async (m) => {
    if (!m.q || !isUrl(m.q))
      return m.sendButtons({
        title: '⬇️ TikTok Downloader',
        text: `Kirim link TikTok dengan caption:\n\`${config.display.prefix}tiktok https://vt.tiktok.com/xxxx\`\n\nAtau pakai tombol di bawah 👇`,
        buttons: [
          { text: '🎵 Audio Only', id: '.ttaudio https://vt.tiktok.com/' },
          { text: '🏠 Menu', id: 'act:menu:main' }
        ]
      })

    await m.typing()
    await m.react('⏳')
    try {
      const data = await tiktok(m.q)
      const videoUrl = data.nowm || data.wm
      if (!videoUrl) throw new Error('Video tidak ditemukan')
      const buf = await getBuffer(videoUrl, { timeout: 120000 })
      await m.sock.sendMessage(
        m.jid,
        {
          video: buf,
          caption: `*⬇️ TIKTOK DOWNLOADER*\n\n▸ *Judul:* ${truncate(data.title || '-', 300)}\n▸ *Author:* ${data.author || '-'}\n▸ *Ukuran:* ${formatSize(buf.length)}\n\n© ${config.bot.name}`
        },
        { quoted: m.raw }
      )
      if (data.audio) {
        try {
          const a = await getBuffer(data.audio, { timeout: 90000 })
          await m.sock.sendMessage(m.jid, { audio: a, mimetype: 'audio/mpeg' }, { quoted: m.raw })
        } catch {}
      }
      await m.react('✅')
    } catch (e) {
      await m.react('❌')
      return m.reply(
        `❌ Gagal download TikTok.\n\`${truncate(e.message, 200)}\`\n\nKemungkinan API publik sedang down — coba lagi nanti atau ganti API di \`lib/scraper.js\`.`
      )
    }
  }
}

export const ttAudio = {
  command: ['ttaudio', 'tiktokmp3', 'ttmp3'],
  category: 'Downloader',
  description: 'Download audio TikTok (mp3)',
  limit: 1,
  cooldown: 4,
  run: async (m) => {
    if (!m.q || !isUrl(m.q)) return m.reply(`Contoh: \`${config.display.prefix}ttaudio https://vt.tiktok.com/xxxx\``)
    await m.typing()
    try {
      const data = await tiktok(m.q)
      const url = data.audio || data.nowm
      if (!url) throw new Error('Audio tidak ditemukan')
      const buf = await getBuffer(url, { timeout: 120000 })
      await m.sock.sendMessage(m.jid, { audio: buf, mimetype: 'audio/mpeg' }, { quoted: m.raw })
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

export const sswebCmd = {
  command: ['ss', 'ssweb', 'screenshot', 'webshot'],
  category: 'Downloader',
  description: 'Screenshot tampilan website',
  limit: 1,
  cooldown: 3,
  run: async (m) => {
    let url = m.q
    if (!url) return m.reply(`Contoh: \`${config.display.prefix}ss https://github.com\``)
    if (!/^https?:\/\//.test(url)) url = 'https://' + url
    await m.typing()
    try {
      const buf = await ssweb(url)
      await m.sendImage(buf, `📸 *Screenshot*\n${url}`)
    } catch (e) {
      return m.reply('❌ Gagal screenshot: ' + truncate(e.message, 200))
    }
  }
}

export const mediaUrl = {
  command: ['get', 'fetch', 'media'],
  category: 'Downloader',
  description: 'Ambil media/file dari URL langsung',
  limit: 1,
  run: async (m) => {
    if (!m.q || !isUrl(m.q)) return m.reply(`Contoh: \`${config.display.prefix}get https://example.com/foto.jpg\``)
    await m.typing()
    try {
      const res = await fetch(m.q)
      const mime = res.headers.get('content-type') || 'application/octet-stream'
      const buf = Buffer.from(await res.arrayBuffer())
      const name = decodeURIComponent(m.q.split('/').pop().split('?')[0]) || 'file'
      if (mime.startsWith('image/')) return await m.sendImage(buf, `🖼️ ${name}`)
      if (mime.startsWith('video/')) return await m.sendVideo(buf, `🎬 ${name}`)
      if (mime.startsWith('audio/')) return await m.sendAudio(buf)
      return await m.sendDoc(buf, name.slice(0, 60), mime)
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}
