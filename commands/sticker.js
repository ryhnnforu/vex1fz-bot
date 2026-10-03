/**
 * commands/sticker.js — MENUSTICKER (20 fitur)
 *   .brat .bratvid .bratanimasi .brathijau .bratmerah .brathitam
 *   .bratkuning .bratpink .bratbiru .bratgradasi .bratimg
 *   .s .sv .smeme .iqc .toimg .togif .take .kutipan .qc
 *
 * WATERMARK tidak ditempel di output stiker (permintaan owner) — wm khusus UI menu.
 */
const ai = require('../lib/ai')
const img = require('../lib/img')
const { toWebp, mediaTypeOf } = require('../lib/sticker')
const { wa } = require('../lib/wa')
const pino = require('pino')

async function downloadQuoted(sock, m) {
  if (!m.quoted || !mediaTypeOf(m.quoted)) return null
  const { downloadMediaMessage } = wa()
  return downloadMediaMessage(m.quoted.message, 'buffer', {}, {
    logger: pino({ level: 'silent' }),
    reuploadRequest: sock.updateMediaMessage
  })
}

const wmName = m => (m.pushName || m.sender.split('@')[0] || 'User')

function needText(m, usage) {
  if (!m.args.length) {
    m.reply(`Tulis teksnya dulu.\nContoh: *${usage}*`)
    return false
  }
  return true
}

/** render brat polos + kirim sebagai stiker */
async function sendBrat(m, sock, opts = {}) {
  const text = m.args.join(' ')
  if (!needText(m, `.brat halo dunia`)) return
  await m.react('🖼️')
  const png = await img.bratPng(text, { ...opts, name: wmName(m) })
  const webp = await toWebp(png)
  await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
  await m.react('✅')
}

/** render brat animasi + kirim stiker animasi */
async function sendBratAnim(m, sock, { bg, fg, mode, fps = 10, frames = 14 } = {}) {
  const text = m.args.join(' ')
  if (!needText(m, `.bratanimasi halo dunia`)) return
  await m.react('🎬')
  const name = wmName(m)
  const bufs = []
  for (let i = 0; i < frames; i++) {
    bufs.push(img.bratFrame(text, i, frames, { bg, fg, name, mode }))
  }
  const webp = await img.framesToWebp(await Promise.all(bufs), fps)
  await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
  await m.react('✅')
}

async function sendBratImageBg(m, sock) {
  const text = m.args.join(' ')
  if (!needText(m, `.bratimg lucu banget (reply foto)`)) return
  const buf = await downloadQuoted(sock, m)
  if (!buf || mediaTypeOf(m.quoted) !== 'imageMessage') {
    return m.reply('Reply *foto* dulu, lalu tulis teksnya.\nContoh: *.bratimg santuy (reply foto)*')
  }
  await m.react('🖼️')
  const png = await img.bratOnImagePng(buf, text, { name: wmName(m) })
  const webp = await toWebp(png)
  await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
  await m.react('✅')
}

const BRAT_VARIANTS = {
  brathijau: { bg: '#88d992', fg: '#000000', label: 'hijau khas brat' },
  bratmerah: { bg: '#e63946', fg: '#ffffff', label: 'merah' },
  brathitam: { bg: '#111111', fg: '#ffffff', label: 'hitam' },
  bratkuning: { bg: '#ffe135', fg: '#111111', label: 'kuning' },
  bratpink: { bg: '#ff69b4', fg: '#111111', label: 'pink' },
  bratbiru: { bg: '#4cc9f0', fg: '#111111', label: 'biru' },
  bratgradasi: { bg: 'gradient', fg: '#ffffff', label: 'gradasi ungu' }
}

const commands = [
  /* 1. BRAT */
  {
    name: 'brat',
    aliases: ['bratputih'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Stiker teks ala brat (latar putih, huruf besar rapat)',
    usage: '.brat halo dunia',
    run: (m, sock) => sendBrat(m, sock, { bg: '#ffffff', fg: '#111111' })
  },

  /* 2. BRAT VID (goyang + kilatan) */
  {
    name: 'bratvid',
    aliases: ['bratvideo'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Brat animasi gaya video (goyang + kilatan warna)',
    usage: '.bratvid lagi viral nih',
    run: (m, sock) => sendBratAnim(m, sock, { bg: '#88d992', fg: '#000000', mode: 'vid', fps: 12, frames: 16 })
  },

  /* 3. BRAT ANIMASI (smooth) */
  {
    name: 'bratanimasi',
    aliases: ['bratsmooth'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Brat animasi smooth — 24 frame, zoom+goyang+rotasi halus',
    usage: '.bratanimasi santai aja',
    run: (m, sock) => sendBratAnim(m, sock, { bg: '#ffffff', fg: '#111111', mode: 'smooth', fps: 14, frames: 24 })
  },

  /* 4–10. VARIAN BRAT */
  ...Object.entries(BRAT_VARIANTS).map(([name, v]) => ({
    name,
    aliases: [],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: `Stiker brat latar ${v.label}`,
    usage: `.${name} teks kamu`,
    run: (m, sock) => sendBrat(m, sock, { bg: v.bg, fg: v.fg })
  })),

  /* 11. BRAT ATAS GAMBAR */
  {
    name: 'bratimg',
    aliases: ['bratfoto'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Teks brat di atas foto yang kamu reply',
    usage: 'reply foto lalu: .bratimg lucu banget',
    run: sendBratImageBg
  },

  /* 12. .s — stiker gambar/video (SUPPORT KEDUANYA + watermark) */
  {
    name: 'sticker',
    aliases: ['stiker', 's', 'stick'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ubah gambar/video jadi stiker (video jadi animasi) + watermark',
    usage: 'reply gambar/video lalu: .s',
    async run(m, sock) {
      const type = mediaTypeOf(m.quoted)
      if (!type) {
        return m.reply(
          'Reply/kirim *gambar* atau *video* lalu ketik *.s*\n\n' +
          '• Gambar → stiker biasa\n' +
          '• Video → stiker animasi (maks 10 detik)\n' +
          'Semua stiker otomatis diberi watermark.'
        )
      }
      await m.react('⏳')
      try {
        const buf = await downloadQuoted(sock, m)
        if (!buf) throw new Error('media tidak bisa diunduh')
        let webp
        if (type === 'videoMessage') {
          webp = await img.videoToStickerWebp(buf, wmName(m), 'mp4')
        } else {
          webp = await img.imageToStickerWebp(buf, wmName(m))
        }
        await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal membuat stiker: ${e.message}\nTips: video maksimal 10 detik.`)
      }
    }
  },

  /* 13. SV — khusus video stiker */
  {
    name: 'sv',
    aliases: ['stikervid', 'videosticker'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Khusus video → stiker animasi + watermark',
    usage: 'reply video lalu: .sv',
    async run(m, sock) {
      if (mediaTypeOf(m.quoted) !== 'videoMessage') {
        return m.reply('Reply *video* dulu, lalu ketik *.sv*\n(video maks 10 detik, otomatis ada watermark)')
      }
      await m.react('⏳')
      try {
        const buf = await downloadQuoted(sock, m)
        const webp = await img.videoToStickerWebp(buf, wmName(m), 'mp4')
        await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal: ${e.message}`)
      }
    }
  },

  /* 14. SMEME */
  {
    name: 'smeme',
    aliases: ['meme'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Stiker meme font khas meme (teks atas | teks bawah)',
    usage: '.smeme teks atas | teks bawah  (reply foto opsional)',
    async run(m, sock) {
      const raw = m.args.join(' ')
      if (!raw) return m.reply('Tulis teksnya.\nContoh: *.smeme kalau ga mikir | diam saja*\nBagian atas dan bawah dipisah "|".')
      const [top, bottom = ''] = raw.split('|').map(s => s.trim())
      await m.react('🗿')
      try {
        let imgBuf = null
        if (mediaTypeOf(m.quoted) === 'imageMessage') imgBuf = await downloadQuoted(sock, m)
        const png = await img.smemePng(top, bottom, imgBuf, { name: wmName(m) })
        const webp = await toWebp(png)
        await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal bikin smeme: ' + e.message)
      }
    }
  },

  /* 15. IQC */
  {
    name: 'iqc',
    aliases: ['sschat', 'instagramchat'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Screenshot chat ala Instagram DM + emoji reaksi',
    usage: '.iqc halo gaes 🔥',
    async run(m, sock) {
      const text = m.args.join(' ')
      if (!text) return m.reply('Tulis isi chatnya.\nContoh: *.iqc halo gaes, apa kabar? 😂*')
      await m.react('📸')
      try {
        const { generateIQC } = require('iqc-canvas')
        const now = new Date()
        const time = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`
        const r = await generateIQC(text, time)
        if (!r || !r.success || !r.image) throw new Error('generator gagal')
        const stamped = Buffer.from(r.image)
        await sock.sendMessage(m.chat, { image: stamped, caption: `IQC by vex1fz • ${wmName(m)}` }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal membuat IQC: ' + e.message)
      }
    }
  },

  /* 16. TOIMG */
  {
    name: 'toimg',
    aliases: ['kegambar', 'stiker2img'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ubah stiker menjadi gambar PNG',
    usage: 'reply stiker lalu: .toimg',
    async run(m, sock) {
      if (m.quoted?.type !== 'stickerMessage') return m.reply('Reply *stiker* dulu, lalu ketik *.toimg*')
      await m.react('⏳')
      try {
        const { downloadMediaMessage } = wa()
        const buf = await downloadMediaMessage(m.quoted.message, 'buffer', {}, {
          logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage
        })
        const sharp = require('sharp')
        const meta = await sharp(buf, { animated: true }).metadata()
        const png = await sharp(buf, { animated: true })
          .png({ compressionLevel: 6 })
          .toBuffer()
        await sock.sendMessage(m.chat, {
          image: png,
          caption: `✅ ${meta.width}x${meta.height} • ${wmName(m)} • vex1fz bye ryhn`
        }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 17. TOGIF */
  {
    name: 'togif',
    aliases: ['kegif'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ubah stiker/video menjadi GIF (mp4 playback) + watermark',
    usage: 'reply stiker animasi/video lalu: .togif',
    async run(m, sock) {
      const t = m.quoted?.type
      if (!['stickerMessage', 'videoMessage'].includes(t)) {
        return m.reply('Reply *stiker animasi* atau *video* lalu ketik *.togif*')
      }
      await m.react('⏳')
      try {
        const { downloadMediaMessage } = wa()
        const buf = await downloadMediaMessage(m.quoted.message, 'buffer', {}, {
          logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage
        })
        const ext = t === 'videoMessage' ? 'mp4' : 'webp'
        const mp4 = await img.mediaToGifMp4(buf, wmName(m), ext)
        await sock.sendMessage(m.chat, { video: mp4, gifPlayback: true, caption: `vex1fz bye ryhn` }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 18. TAKE (stiker jadi milikmu + watermark) */
  {
    name: 'take',
    aliases: ['colongstiker', 'ambilstiker'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ambil stiker orang → stikermu + watermark vex1fz',
    usage: 'reply stiker lalu: .take',
    async run(m, sock) {
      if (m.quoted?.type !== 'stickerMessage') return m.reply('Reply *stiker* dulu, lalu ketik *.take*')
      await m.react('⏳')
      try {
        const { downloadMediaMessage } = wa()
        const buf = await downloadMediaMessage(m.quoted.message, 'buffer', {}, {
          logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage
        })
        const sharp = require('sharp')
        const meta = await sharp(buf, { animated: true }).metadata()
        let out
        if (meta.pages && meta.pages > 1) {
          out = await img.videoToStickerWebp(buf, wmName(m), 'webp')
        } else {
          const stamped = buf
          out = await toWebp(stamped)
        }
        await sock.sendMessage(m.chat, { sticker: out }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Gagal: ' + e.message)
      }
    }
  },

  /* 19. KUTIPAN */
  {
    name: 'kutipan',
    aliases: ['quote', 'kata2'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kartu kutipan estetik → stiker + watermark',
    usage: '.kutipan hidup itu indah | vvex',
    async run(m, sock) {
      const raw = m.args.join(' ')
      if (!raw) return m.reply('Tulis kutipannya.\nContoh: *.kutipan jangan menyerah | vex1fz*')
      const [text, author = ''] = raw.split('|').map(s => s.trim())
      await m.react('💬')
      const png = await img.kutipanPng(text, author, { name: wmName(m) })
      const webp = await toWebp(png)
      await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
      await m.react('✅')
    }
  },

  /* 20. QC (quote bulat) */
  {
    name: 'qc',
    aliases: ['quotecircle', 'bulat'],
    category: 'sticker',
    access: 'user',
    prefixes: ['.'],
    desc: 'Quote bulat ala Telegram → stiker + watermark',
    usage: '.qc semangat pagi!',
    async run(m, sock) {
      const text = m.args.join(' ')
      if (!text) return m.reply('Tulis teksnya.\nContoh: *.qc semangat pagi semua!*')
      await m.react('💬')
      const png = await img.qcPng(text, { name: wmName(m) })
      const webp = await toWebp(png)
      await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
      await m.react('✅')
    }
  }
]

module.exports = commands
