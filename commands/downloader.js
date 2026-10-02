/**
 * commands/downloader.js — fitur download (prefix ".")
 *   .tiktok .ig .fb .mediafire .twitter
 */
const config = require('../config')
const api = require('../lib/api')
const { boxLines } = require('../lib/menu')
const { pickUrl, truncate } = require('../lib/util')

/** kirim hasil download: coba kirim video dulu, fallback link */
async function sendResult(m, url, caption) {
  const isVideo = /\.mp4(\?|$)/i.test(url) || /video/i.test(url)
  if (isVideo) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
      const len = Number(res.headers.get('content-length') || 0)
      if (res.ok && len < 60 * 1024 * 1024) {
        const buf = Buffer.from(await res.arrayBuffer())
        return await m.reply({ video: buf, caption })
      }
    } catch (_) {}
  }
  return m.reply(`${caption}\n\n🔗 ${url}`)
}

function helpDownloader(m) {
  m.reply(
    boxLines('CARA PAKAI', [
      `│ *.tiktok* <link>`,
      `│ *.ig* <link>`,
      `│ *.fb* <link>`,
      `│ *.mediafire* <link>`,
      `│ *.twitter* <link>`,
      ``,
      `│ Contoh:`,
      `│ *.tiktok* https://vt.tiktok.com/xxx`
    ])
  )
}

const commands = [
  {
    name: 'tiktok',
    aliases: ['tt', 'tiktokdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download TikTok tanpa watermark',
    usage: '.tiktok <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return helpDownloader(m)
      await m.react('⏳')
      try {
        const r = await api.tiktok(url)
        const caption =
          boxLines('TIKTOK', [
            `│ *JUDUL*  : ${truncate(r.title, 60)}`,
            `│ *AUTHOR* : ${r.author}`,
            `│ *DURASI* : ${r.duration}s`,
            `│ *STATUS* : ✅ TANPA WATERMARK`
          ])
        await sendResult(m, r.play, caption)
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal memuat TikTok.\n${e.message}\nCoba link lain / ulangi lagi.`)
      }
    }
  },
  {
    name: 'ig',
    aliases: ['instagram', 'igdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download Instagram post/reels',
    usage: '.ig <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return helpDownloader(m)
      await m.react('⏳')
      try {
        const r = await api.instagram(url)
        await sendResult(m, r.url, boxLines('INSTAGRAM', [`│ *STATUS* : ✅ SIAP`, `│ *SUMBER* : instagram`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message === '__CONFIG__') m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat Instagram.\n${e.message}`)
      }
    }
  },
  {
    name: 'fb',
    aliases: ['facebook', 'fbdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download video Facebook',
    usage: '.fb <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return helpDownloader(m)
      await m.react('⏳')
      try {
        const r = await api.facebook(url)
        await sendResult(m, r.url, boxLines('FACEBOOK', [`│ *STATUS* : ✅ SIAP`, `│ *SUMBER* : facebook`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message === '__CONFIG__') m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat Facebook.\n${e.message}`)
      }
    }
  },
  {
    name: 'twitter',
    aliases: ['x', 'xdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download video Twitter/X',
    usage: '.twitter <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return helpDownloader(m)
      await m.react('⏳')
      try {
        const r = await api.twitter(url)
        await sendResult(m, r.url, boxLines('TWITTER/X', [`│ *STATUS* : ✅ SIAP`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message === '__CONFIG__') m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat Twitter/X.\n${e.message}`)
      }
    }
  },
  {
    name: 'mediafire',
    aliases: ['mfdl', 'mf'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download file MediaFire',
    usage: '.mediafire <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return helpDownloader(m)
      if (!/mediafire\.com/i.test(url)) return m.reply('⚠️ Link MediaFire tidak valid.')
      await m.react('⏳')
      try {
        const r = await api.mediafire(url)
        await m.reply(
          boxLines('MEDIAFIRE', [
            `│ *FILE*  : ${truncate(r.fileName, 50)}`,
            `│ *UKURAN*: ${r.size}`,
            `│ *STATUS*: ✅ SIAP`
          ]) + `\n\n🔗 ${r.url}`
        )
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal memuat MediaFire.\n${e.message}`)
      }
    }
  }
]

module.exports = commands
