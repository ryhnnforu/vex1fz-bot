/**
 * 🛠️ TOOLS MENU — stiker, upload, qrcode, encode, quote, readmore
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { toWebp, saveTmp, getBuffer, sniffMime, truncate, resizeImage } from '../lib/functions.js'
import { aiChat } from '../lib/ai.js'

/* ================= STIKER ================= */
export default {
  command: ['stikerlama', 'slama'],
  category: 'Sticker Menu',
  description: 'Ubah gambar/video jadi stiker (reply/kirim media)',
  limit: 1,
  cooldown: 3,
  run: async (m) => {
    const isQ = m.quoted?.isMedia || m.quoted?.mtype === 'stickerMessage'
    if (!m.isMedia && !isQ)
      return m.sendButtons({
        title: '🌟 Sticker Maker',
        text: `Kirim/reply *gambar* atau *video pendek* dengan caption:\n\`${config.display.prefix}s\`\n\nAtau pakai:\n▸ \`${config.display.prefix}stiker <teks>\` — stiker teks\n▸ \`${config.display.prefix}smeme\` — stiker dari gambar AI\n\n⚠️ Butuh ffmpeg:\n\`pkg install ffmpeg -y\``,
        buttons: [
          { text: '📝 Stiker Teks', id: '.stiker THERYHANN!' },
          { text: '🏠 Menu', id: 'act:menu:main' }
        ]
      })

    await m.typing()
    try {
      const d = await m.download()
      const isAnimated = d.mime.includes('gif') || d.mime.includes('mp4') || d.mime.includes('webm')
      const ext = d.mime.includes('mp4') ? 'mp4' : d.mime.includes('webp') ? 'webp' : 'png'
      const input = saveTmp(d.buffer, ext)
      const output = path.join(path.dirname(input), path.basename(input).replace(/\.[^.]+$/, '') + '.webp')

      if (d.mime === 'image/webp' || ext === 'webp') {
        // sudah webp -> kirim langsung
        return await m.sendSticker(d.buffer)
      }

      await toWebp(input, output, { animated: isAnimated })
      const webp = fs.readFileSync(output)
      fs.unlinkSync(input)
      fs.unlinkSync(output)
      return await m.sendSticker(webp, {
        packname: config.display.packname,
        author: config.display.author
      })
    } catch (e) {
      if (/ffmpeg/i.test(e.message))
        return m.reply('❌ ffmpeg belum terpasang.\nJalankan di Termux:\n```pkg install ffmpeg -y```')
      return m.reply('❌ Gagal membuat stiker: ' + truncate(e.message, 250))
    }
  }
}

/* ================= STIKER TEKS ================= */
export const stickerText = {
  command: ['stickertext', 'ttp', 'stikerai'],
  category: 'Sticker Menu',
  description: 'Buat stiker dari teks',
  limit: 1,
  run: async (m) => {
    const text = m.q
    if (!text) return m.reply(`Contoh: \`${config.display.prefix}stiker THERYHANN!\``)
    await m.typing()
    try {
      // gambar teks lewat AI image API (gratis)
      const buf = await getBuffer(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(
          `text "${text}" as a sticker, bold white text with black outline, transparent background, no extra elements`
        )}?width=512&height=512&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e6)}`,
        { timeout: 120000 },
        1
      )
      const input = saveTmp(buf, 'png')
      const output = input.replace('.png', '.webp')
      try {
        await toWebp(input, output, { animated: false })
        const webp = fs.readFileSync(output)
        return await m.sendSticker(webp)
      } catch (e) {
        // fallback: kirim sebagai gambar
        return await m.sendImage(buf, `🌟 Stiker teks: ${text}`)
      } finally {
        for (const f of [input, output]) fs.existsSync(f) && fs.unlinkSync(f)
      }
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 250))
    }
  }
}

/* ================= UPLOAD / TOURL ================= */
export const tourl = {
  command: ['tourl', 'upload', 'tolink'],
  category: 'Tools',
  description: 'Upload media jadi link (reply/kirim media)',
  limit: 1,
  run: async (m) => {
    if (!m.isMedia && !m.quoted?.isMedia) return m.reply('📎 Kirim/reply media dengan caption `.tourl`')
    await m.typing()
    try {
      const d = await m.download()
      const file = saveTmp(d.buffer, (d.mime.split('/')[1] || 'bin').split(';')[0])
      const url = await uploadFile(file)
      fs.unlinkSync(file)
      if (!url) throw new Error('Semua host upload gagal')
      return m.sendInteractive({
        title: '🔗 Upload Berhasil',
        body: `▸ *Ukuran:* ${(d.buffer.length / 1024 / 1024).toFixed(2)} MB\n▸ *Mime:* ${d.mime}\n\n${url}`,
        footer: config.bot.footer,
        copy: [{ text: '📋 Salin Link', code: url }],
      }).catch(() => m.reply('🔗 ' + url))
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 250))
    }
  }
}

async function uploadFile (filePath) {
  const buffer = fs.readFileSync(filePath)
  const name = path.basename(filePath)
  const hosts = [
    async () => {
      const fd = new FormData()
      fd.append('file', new Blob([buffer]), name)
      const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd })
      const j = await res.json()
      return j?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    },
    async () => {
      const fd = new FormData()
      fd.append('files[]', new Blob([buffer]), name)
      const res = await fetch('https://uguu.se/upload', { method: 'POST', body: fd })
      const j = await res.json()
      return j?.files?.[0]?.url
    }
  ]
  for (const h of hosts) {
    try {
      const u = await h()
      if (u) return u
    } catch {}
  }
  return null
}

/* ================= QRCODE ================= */
export const qrcode = {
  command: ['qrcode', 'qr', 'buatqr'],
  category: 'Tools',
  description: 'Buat QR code dari teks/link',
  limit: 1,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh: \`${config.display.prefix}qr https://wa.me/6283199329104\``)
    await m.typing()
    try {
      const buf = await getBuffer(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(m.q)}`, {}, 1)
      return await m.sendImage(buf, `🔳 *QR Code*\n\nIsi: ${truncate(m.q, 200)}`)
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

/* ================= ENCODE / DECODE ================= */
export const encodeCmd = {
  command: ['base64', 'hex', 'b64', 'encode', 'decode', 'reverse', 'hitung', 'calc'],
  category: 'Tools',
  description: 'Encode/decode teks & kalkulator',
  limit: 0,
  run: async (m) => {
    const q = m.q
    if (!q) return m.reply('Contoh: `.base64 halo` | `.decode aGFsbw==` | `.hitung 25*4+10`')
    try {
      switch (m.command) {
        case 'base64':
        case 'b64':
        case 'encode':
          return m.reply(`*🔐 Base64*\n\`\`\`${Buffer.from(q, 'utf-8').toString('base64')}\`\`\``)
        case 'decode':
          return m.reply(`*🔓 Decode*\n\`\`\`${Buffer.from(q, 'base64').toString('utf-8')}\`\`\``)
        case 'hex':
          return m.reply(`*#️⃣ Hex*\n\`\`\`${Buffer.from(q, 'utf-8').toString('hex')}\`\`\``)
        case 'reverse':
          return m.reply(`*🔁 Reverse*\n\`\`\`${q.split('').reverse().join('')}\`\`\``)
        case 'hitung':
        case 'calc': {
          if (!/^[\d+\-*/().%\s^]+$/.test(q)) return m.reply('❌ Hanya angka & operator + - * / ( ) % ^')
          const expr = q.replace(/\^/g, '**')
          // eslint-disable-next-line no-new-func
          const val = Function('"use strict";return (' + expr + ')')()
          return m.reply(`*🧮 Kalkulator*\n\`${q}\` = *${val}*`)
        }
      }
    } catch (e) {
      return m.reply('❌ ' + e.message)
    }
  }
}

/* ================= QUOTE / KATA ================= */
export const quoteCmd = {
  command: ['quote', 'quotes', 'kata', 'bucin'],
  category: 'Fun Menu',
  description: 'Quote random / dibuatkan AI (ada cadangan offline)',
  limit: 0,
  contoh: 'motivasi',
  run: async (m) => {
    await m.typing()
    const topic = m.q || ''
    // 1) coba bank lokal dulu (cepat & selalu jalan)
    const { randomQuote, quoteCategories } = await import('../lib/datasets.js')
    const cat = quoteCategories().find(c => topic.toLowerCase().includes(c)) || (topic ? null : null)
    const lokal = randomQuote(cat)
    const lokalTeks = typeof lokal === 'string' ? lokal : (lokal?.teks || lokal?.q || '')
    // 2) kalau AI hidup, minta versi AI yang lebih personal
    try {
      const q = await aiChat(
        `Buatkan 1 quote singkat dan powerful tentang "${topic || 'motivasi hidup'}" dalam Bahasa Indonesia. Balas HANYA dengan teks quote-nya, tanpa tanda kutip tambahan, tanpa penjelasan.`,
        [],
        { system: 'Kamu adalah penulis quote profesional.', timeout: 25000 }
      )
      const teks = q.replace(/^["']|["']$/g, '')
      return m.sendInteractive({
        title: '💬 Quote AI',
        body: teks,
        footer: `© ${config.bot.name}`,
        buttons: [{ text: '🔁 Quote Lain', id: `${config.display.prefix}quote ${topic}`.trim() }, { text: '🎉 Fun Menu', id: 'act:menu:Fun Menu' }]
      }).catch(() => m.reply(`💬 *QUOTE*\n\n"${teks}"`))
    } catch (e) {
      if (lokalTeks) {
        return m.sendInteractive({
          title: '💬 Quote (offline)',
          body: lokalTeks,
          footer: `${cat ? 'kategori: ' + cat + ' · ' : ''}AI sedang sibuk, ini dari bank quote bot`,
          buttons: [{ text: '🔁 Quote Lain', id: `${config.display.prefix}quote ${topic}`.trim() }, { text: '🎉 Fun Menu', id: 'act:menu:Fun Menu' }]
        }).catch(() => m.reply(`💬 *QUOTE*\n\n"${lokalTeks}"`))
      }
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

/* ================= READMORE ================= */
export const readmore = {
  command: ['readmore', 'rm'],
  category: 'Tools',
  description: 'Buat teks tersembunyi (readmore)',
  limit: 0,
  run: async (m) => {
    if (!m.q) return m.reply('Contoh: `.readmore teks depan|teks tersembunyi`')
    const [a, b] = m.q.split('|')
    return m.reply(`${a || ''}\n\n${String.fromCharCode(8206).repeat(4001)}\n\n${b || ''}`)
  }
}
