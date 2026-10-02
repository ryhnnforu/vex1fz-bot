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
  },

  /* ═══════════ 15 FITUR BARU ═══════════ */

  /* 6. YTMP3 */
  {
    name: 'ytmp3',
    aliases: ['ytdlmp3', 'yta'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download audio YouTube jadi MP3',
    usage: '.ytmp3 <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.ytmp3 https://youtube.com/watch?v=xxx*')
      await m.react('⏳')
      try {
        const r = await api.youtube(url, 'mp3')
        await sendResult(m, r.url, boxLines('YOUTUBE MP3', [`│ *STATUS* : ✅ AUDIO SIAP`, `│ *SUMBER* : youtube`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat MP3.\n${e.message}`)
      }
    }
  },

  /* 7. YTMP4 */
  {
    name: 'ytmp4',
    aliases: ['ytdl', 'ytv'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download video YouTube jadi MP4',
    usage: '.ytmp4 <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.ytmp4 https://youtube.com/watch?v=xxx*')
      await m.react('⏳')
      try {
        const r = await api.youtube(url, 'mp4')
        await sendResult(m, r.url, boxLines('YOUTUBE MP4', [`│ *STATUS* : ✅ VIDEO SIAP`, `│ *SUMBER* : youtube`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat video.\n${e.message}`)
      }
    }
  },

  /* 8. PLAY (cari judul → mp3) */
  {
    name: 'play',
    aliases: ['ytplay', 'music'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Cari lagu dari judul → unduh MP3',
    usage: '.play dangdut koplo enak',
    async run(m, sock, args) {
      const q = args.join(' ').trim()
      if (!q) return m.reply('Tulis judul lagunya.\nContoh: *.play tenggelamnya cinta*')
      await m.react('🔍')
      try {
        const url = await api.ytSearch(q)
        await m.react('⏳')
        const r = await api.youtube(url, 'mp3')
        await sendResult(m, r.url, boxLines('PLAY — MP3', [
          `│ *JUDUL* : ${truncate(q, 50)}`,
          `│ *LINK*  : ${truncate(url, 60)}`,
          `│ *STATUS*: ✅ SIAP`
        ]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 9. GITCLONE */
  {
    name: 'gitclone',
    aliases: ['repoclone', 'ghdownload'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download source code repo GitHub (zip)',
    usage: '.gitclone user/repo',
    async run(m, sock, args) {
      const repo = (args[0] || '').trim()
      if (!repo || !repo.includes('/')) return m.reply('Tulis *user/repo*.\nContoh: *.gitclone whatsapp/whatsapp-webjs*')
      await m.react('⏳')
      try {
        const info = await api.githubRepo(repo)
        await sock.sendMessage(m.chat, {
          document: { url: info.zip },
          fileName: `${info.name.replace('/', '-')}.zip`,
          mimetype: 'application/zip',
          caption: boxLines('GITCLONE', [
            `│ *REPO*   : ${info.name}`,
            `│ *DESKRIP*: ${truncate(info.desc, 45)}`,
            `│ *BAHASA* : ${info.lang} • ⭐ ${info.stars}`,
            `│ *UKURAN* : ±${info.size} MB (zip)`
          ])
        }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal mengunduh repo.\n${e.message}`)
      }
    }
  },

  /* 10. GHREPO */
  {
    name: 'ghrepo',
    aliases: ['repoinfo', 'github'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Info repository GitHub (bintang, bahasa, deskripsi)',
    usage: '.ghrepo user/repo',
    async run(m, sock, args) {
      const repo = (args[0] || '').trim()
      if (!repo || !repo.includes('/')) return m.reply('Contoh: *.ghrepo nodejs/node*')
      await m.react('⏳')
      try {
        const r = await api.githubRepo(repo)
        await m.reply(
          boxLines('GITHUB REPO', [
            `│ *NAMA*   : ${r.name}`,
            `│ *DESKRIP*: ${truncate(r.desc, 70)}`,
            `│ *BAHASA* : ${r.lang}`,
            `│ *BINTANG*: ⭐ ${r.stars} • 🍴 ${r.forks}`,
            `│ *UKURAN* : ±${r.size} MB`
          ]) + `\n\n🔗 ${r.url}`
        )
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ ' + e.message)
      }
    }
  },

  /* 11. PIN (Pinterest) */
  {
    name: 'pin',
    aliases: ['pinterest', 'pindl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download gambar/video dari Pinterest',
    usage: '.pin <link pin>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.pin https://id.pinterest.com/pin/xxx*')
      if (!/pin|pinterest/i.test(url)) return m.reply('⚠️ Itu bukan link Pinterest.')
      await m.react('⏳')
      try {
        const r = await api.ogMedia(url, ['image', 'video:secure_url', 'video'])
        const isVideo = /\.(mp4|webm)/i.test(r.url)
        if (isVideo) {
          await sendResult(m, r.url, `📌 Pinterest • vex1fz bye ryhn\n${truncate(r.title, 80)}`)
        } else {
          const f = await api.fetchBuffer(r.url)
          await sock.sendMessage(m.chat, { image: f.buf, caption: `📌 Pinterest • vex1fz bye ryhn\n${truncate(r.title, 80)}` }, { quoted: m.raw })
        }
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal memuat pin.\n${e.message}`)
      }
    }
  },

  /* 12. DOUYIN */
  {
    name: 'douyin',
    aliases: ['dydl', 'tiktokcn'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download video Douyin (TikTok China) tanpa watermark',
    usage: '.douyin <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.douyin https://v.douyin.com/xxx*')
      await m.react('⏳')
      try {
        const r = await api.tiktok(url)
        await sendResult(m, r.play, boxLines('DOUYIN', [`│ *JUDUL* : ${truncate(r.title, 55)}`, `│ *STATUS*: ✅ SIAP`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 13. THREADS */
  {
    name: 'threads',
    aliases: ['threadsdl', 'metathreads'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download postingan Threads (gambar/video)',
    usage: '.threads <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.threads https://www.threads.net/@user/post/xxx*')
      await m.react('⏳')
      try {
        let r
        try {
          r = await api.ogMedia(url, ['video:secure_url', 'video', 'image'])
        } catch (e1) {
          const dl = await dlLolhuman('threads', url)
          r = { url: dl, title: '' }
        }
        if (/\.(mp4|webm)/i.test(r.url)) await sendResult(m, r.url, '🧵 Threads • vex1fz bye ryhn')
        else {
          const f = await api.fetchBuffer(r.url)
          await sock.sendMessage(m.chat, { image: f.buf, caption: '🧵 Threads • vex1fz bye ryhn' }, { quoted: m.raw })
        }
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat Threads.\n${e.message}`)
      }
    }
  },

  /* 14. SPOTIFY */
  {
    name: 'spotify',
    aliases: ['spotifydl', 'spdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download lagu dari link Spotify',
    usage: '.spotify <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.spotify https://open.spotify.com/track/xxx*')
      await m.react('⏳')
      try {
        const dl = await dlLolhuman('spotify', url)
        await sendResult(m, dl, boxLines('SPOTIFY', [`│ *STATUS* : ✅ AUDIO SIAP`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal memuat Spotify.\n${e.message}`)
      }
    }
  },

  /* 15. SOUNDCLOUD */
  {
    name: 'soundcloud',
    aliases: ['scdl', 'sound'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download audio dari SoundCloud',
    usage: '.soundcloud <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.soundcloud https://soundcloud.com/user/track*')
      await m.react('⏳')
      try {
        let r
        try {
          r = await api.ogMedia(url, ['audio', 'video', 'image'])
        } catch (e1) {
          const dl = await dlLolhuman('soundcloud', url)
          r = { url: dl }
        }
        await sendResult(m, r.url, boxLines('SOUNDCLOUD', [`│ *STATUS* : ✅ AUDIO SIAP`]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 16. TUMBLR */
  {
    name: 'tumblr',
    aliases: ['tumblrdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download gambar/video dari Tumblr',
    usage: '.tumblr <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.tumblr https://www.tumblr.com/blog/post/xxx*')
      await m.react('⏳')
      try {
        const r = await api.ogMedia(url, ['video:secure_url', 'video', 'image'])
        if (/\.(mp4|webm)/i.test(r.url)) await sendResult(m, r.url, '🎬 Tumblr • vex1fz bye ryhn')
        else {
          const f = await api.fetchBuffer(r.url)
          await sock.sendMessage(m.chat, { image: f.buf, caption: '🖼️ Tumblr • vex1fz bye ryhn' }, { quoted: m.raw })
        }
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 17. REDDIT */
  {
    name: 'reddit',
    aliases: ['redditsave', 'reddl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download video/gambar dari Reddit (tanpa API key)',
    usage: '.reddit <link post>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.reddit https://www.reddit.com/r/xxx/comments/...*')
      await m.react('⏳')
      try {
        const r = await api.reddit(url)
        if (/\.(mp4|gif)/i.test(r.url)) await sendResult(m, r.url, `🎬 ${truncate(r.title, 70)}\nvia vex1fz bye ryhn`)
        else {
          const f = await api.fetchBuffer(r.url)
          await sock.sendMessage(m.chat, { image: f.buf, caption: `🖼️ ${truncate(r.title, 70)}\nvia vex1fz bye ryhn` }, { quoted: m.raw })
        }
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal memuat Reddit.\n${e.message}`)
      }
    }
  },

  /* 18. GIF */
  {
    name: 'gif',
    aliases: ['giphy', 'gifdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download GIF dari link (giphy/tenor/halaman web)',
    usage: '.gif <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.gif https://giphy.com/gifs/xxx*')
      await m.react('⏳')
      try {
        let r
        try {
          r = await api.ogMedia(url, ['video:secure_url', 'video', 'image'])
        } catch (e1) {
          const dl = await dlLolhuman('gif', url)
          r = { url: dl }
        }
        await sendResult(m, r.url, '🎞️ GIF • vex1fz bye ryhn')
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 19. CAPCUT */
  {
    name: 'capcut',
    aliases: ['capcutdl'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Download template/video dari Capcut',
    usage: '.capcut <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.capcut https://www.capcut.com/template/xxx*')
      await m.react('⏳')
      try {
        let r
        try {
          r = await api.ogMedia(url, ['video:secure_url', 'video', 'image'])
        } catch (e1) {
          const dl = await dlLolhuman('capcut', url)
          r = { url: dl }
        }
        await sendResult(m, r.url, '✂️ Capcut • vex1fz bye ryhn')
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        if (e.message.includes('__CONFIG__')) m.reply(api.CONFIG_HELP)
        else m.reply(`⚠️ Gagal.\n${e.message}`)
      }
    }
  },

  /* 20. TIKTOK AUDIO */
  {
    name: 'tiktokaudio',
    aliases: ['ttmp3', 'tiktokmusic'],
    category: 'downloader',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ambil audio/musik dari TikTok (tanpa watermark)',
    usage: '.tiktokaudio <link>',
    async run(m, sock, args) {
      const url = pickUrl(args.join(' '))
      if (!url) return m.reply('Contoh: *.tiktokaudio https://vt.tiktok.com/xxx*')
      await m.react('⏳')
      try {
        const r = await api.tiktokMusic(url)
        await sendResult(m, r.url, boxLines('TIKTOK AUDIO', [
          `│ *JUDUL* : ${truncate(r.title, 55)}`,
          `│ *STATUS*: ✅ MP3 SIAP`
        ]))
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal memuat audio.\n${e.message}`)
      }
    }
  }
]

/** helper: download via lolhuman (butuh apikey) */
async function dlLolhuman(kind, url) {
  const key = config.apiKeys.lolhuman
  if (!key) throw new Error('__CONFIG__')
  const j = await api.getJson(`https://api.lolhuman.xyz/api/download/${kind}?apikey=${encodeURIComponent(key)}&url=${encodeURIComponent(url)}`)
  const found = api.deepFindUrl(j)
  if (!found) throw new Error('Media tidak ditemukan')
  return found
}

module.exports = commands
