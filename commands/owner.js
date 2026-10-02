/**
 * commands/owner.js — fitur OWNER ONLY
 *   prefix "/"  → manajemen grup
 *   prefix ","  → manajemen bot
 *   prefix "=>" → tool developer (eval ada di handler utama)
 *
 * Semua command di file ini HANYA bisa dipanggil lewat prefix owner.
 */
const fs = require('fs')
const { wa } = require('../lib/wa')
const db = require('../lib/db')
const ai = require('../lib/ai')
const config = require('../config')
const { boxLines } = require('../lib/menu')
const { sleep, truncate } = require('../lib/util')

/* cache metadata grup (10 detik) */
const metaCache = new Map()
async function getMeta(sock, jid) {
  const c = metaCache.get(jid)
  if (c && Date.now() - c.ts < 10_000) return c.data
  const data = await sock.groupMetadata(jid)
  metaCache.set(jid, { ts: Date.now(), data })
  return data
}

function targetOf(m) {
  return m.mentions[0] || m.quoted?.sender || null
}

function ensureGroup(m) {
  if (!m.isGroup) { m.reply('⚠️ Perintah ini hanya bisa dipakai di grup.'); return false }
  return true
}

async function ensureBotAdmin(sock, m) {
  if (!ensureGroup(m)) return false
  const { jidNormalizedUser } = wa()
  const meta = await getMeta(sock, m.chat)
  const botId = jidNormalizedUser(sock.user?.id || '')
  const me = meta.participants.find(p => jidNormalizedUser(p.id) === botId)
  if (!me || !['admin', 'superadmin'].includes(me.admin)) {
    m.reply('⚠️ Bot bukan admin di grup ini. Jadikan admin dulu.')
    return false
  }
  return true
}

const commands = [
  /* ══════════════ PREFIX "," — OWNER BOT ══════════════ */
  {
    name: 'bc',
    aliases: ['broadcast', 'siaran'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Broadcast pesan ke semua chat & grup',
    usage: ',bc teks',
    async run(m, sock, args) {
      if (!args.length) return m.reply('Contoh: *,bc Selamat pagi semua*')
      const teks = args.join(' ')
      const chats = new Set(Object.keys(db.load().chats))
      try {
        const groups = await sock.groupFetchAllParticipating()
        for (const g of Object.values(groups)) chats.add(g.id)
      } catch (_) {}
      chats.delete(m.chat)
      let sukses = 0, gagal = 0
      await m.reply(`📡 Mulai broadcast ke *${chats.size}* chat...`)
      for (const jid of chats) {
        try {
          await sock.sendMessage(jid, { text: `📢 *BROADCAST ${config.botName.toUpperCase()}*\n\n${teks}` })
          sukses++
        } catch (_) { gagal++ }
        await sleep(1.2)
      }
      m.reply(
        boxLines('BROADCAST SELESAI', [
          `│ *SUKSES* : ${sukses}`,
          `│ *GAGAL*  : ${gagal}`,
          `│ *TOTAL*  : ${chats.size}`
        ])
      )
    }
  },
  {
    name: 'ban',
    aliases: ['blockuser'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Ban user (berhenti dilayani)',
    usage: ',ban @user atau ,ban 628xxx',
    async run(m, sock, args) {
      let jid = targetOf(m)
      if (!jid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '')
        if (num) jid = `${num}@s.whatsapp.net`
      }
      if (!jid) return m.reply('Contoh: *,ban @user* atau *,ban 6281234567890*')
      const u = db.getUser(jid, true)
      u.banned = true
      db.save()
      m.reply(`🚫 @${jid.split('@')[0]} *DIBANNED*`, { mentions: [jid] })
    }
  },
  {
    name: 'unban',
    aliases: ['unblockuser'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Buka ban user',
    usage: ',unban @user atau ,unban 628xxx',
    async run(m, sock, args) {
      let jid = targetOf(m)
      if (!jid && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '')
        if (num) jid = `${num}@s.whatsapp.net`
      }
      if (!jid) return m.reply('Contoh: *,unban @user*')
      const u = db.getUser(jid, true)
      u.banned = false
      db.save()
      m.reply(`✅ @${jid.split('@')[0]} dibuka dari ban`, { mentions: [jid] })
    }
  },
  {
    name: 'self',
    aliases: [],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Mode self (hanya owner)',
    usage: ',self',
    async run(m) {
      db.load().settings.mode = 'self'
      db.save()
      m.reply('🔒 Mode *SELF* — hanya owner yang bisa pakai bot.')
    }
  },
  {
    name: 'public',
    aliases: ['publik'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Mode public (semua user)',
    usage: ',public',
    async run(m) {
      db.load().settings.mode = 'public'
      db.save()
      m.reply('🌐 Mode *PUBLIC* — semua user bisa pakai bot.')
    }
  },
  {
    name: 'join',
    aliases: ['masukgrup'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Bot masuk grup via link',
    usage: ',join https://chat.whatsapp.com/xxx',
    async run(m, sock, args) {
      const link = args.find(a => a.includes('chat.whatsapp.com'))
      if (!link) return m.reply('Contoh: *,join https://chat.whatsapp.com/XXXX*')
      const code = link.split('/').pop()
      const jid = await sock.groupAcceptInvite(code)
      m.reply(`✅ Bot masuk grup: ${jid}`)
    }
  },
  {
    name: 'leave',
    aliases: ['keluar'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Bot keluar dari grup ini',
    usage: ',leave',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      await m.reply('👋 Bot keluar dari grup...')
      await sock.groupLeave(m.chat)
    }
  },
  {
    name: 'setbio',
    aliases: [],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Ganti bio bot',
    usage: ',setbio teks bio',
    async run(m, sock, args) {
      if (!args.length) return m.reply('Contoh: *,setbio Bot vex1fz online 24 jam*')
      await sock.updateProfileStatus(args.join(' '))
      m.reply('✅ Bio diperbarui.')
    }
  },
  {
    name: 'setpp',
    aliases: ['setavatar'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Ganti foto profil bot (reply foto)',
    usage: ',setpp (reply/kirim foto)',
    async run(m, sock) {
      const q = m.quoted
      if (!q || !['imageMessage', 'stickerMessage'].includes(q.type)) {
        return m.reply('Reply/kirim foto dulu, lalu *,setpp*')
      }
      const { downloadMediaMessage } = wa()
      const buffer = await downloadMediaMessage(q.message, 'buffer', {}, {
        logger: require('pino')({ level: 'silent' }),
        reuploadRequest: sock.updateMediaMessage
      })
      await sock.updateProfilePicture(sock.user.id, buffer)
      m.reply('✅ Foto profil bot diperbarui.')
    }
  },
  {
    name: 'block',
    aliases: ['blokir'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Block nomor di WhatsApp',
    usage: ',block 628xxx',
    async run(m, sock, args) {
      const num = (args[0] || '').replace(/[^0-9]/g, '')
      if (!num) return m.reply('Contoh: *,block 6281234567890*')
      await sock.updateBlockStatus(`${num}@s.whatsapp.net`, 'block')
      m.reply(`🚫 ${num} diblokir.`)
    }
  },
  {
    name: 'unblock',
    aliases: ['unblokir'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Buka block nomor',
    usage: ',unblock 628xxx',
    async run(m, sock, args) {
      const num = (args[0] || '').replace(/[^0-9]/g, '')
      if (!num) return m.reply('Contoh: *,unblock 6281234567890*')
      await sock.updateBlockStatus(`${num}@s.whatsapp.net`, 'unblock')
      m.reply(`✅ ${num} dibuka.`)
    }
  },
  {
    name: 'resetdb',
    aliases: ['reset'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Hapus seluruh database',
    usage: ',resetdb',
    async run(m) {
      db.resetAll()
      m.reply('♻️ Database direset. Semua data user/RPG terhapus.')
    }
  },
  {
    name: 'restart',
    aliases: ['mulaiulang'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Nyalakan ulang bot',
    usage: ',restart',
    async run(m, sock) {
      await m.reply('♻️ Bot akan *restart* sekarang...')
      await sleep(800)
      process.exit(0) // panel/pm2 akan menyalakan ulang otomatis
    }
  },
  {
    name: 'aiset',
    aliases: ['aiconfig', 'aiatur'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Atur karakteristik AI chatbot',
    usage: ',aiset <gender|nama|sifat|on|off|auto|apikey|baseurl|model|lihat|reset> [nilai]',
    async run(m, sock, args) {
      const sub = (args[0] || 'lihat').toLowerCase()
      const val = args.slice(1).join(' ').trim()

      const show = () => {
        const c = ai.getAiCfg()
        return boxLines('AI SETTING', [
          `│ *STATUS* : ${c.enabled ? 'ON ✅' : 'OFF ❌'}${c.auto ? ' + AUTO REPLY' : ''}`,
          `│ *GENDER* : ${ai.PERSONA[c.gender]?.label || c.gender}`,
          `│ *NAMA*   : ${c.nama}`,
          `│ *SIFAT*  : ${c.sifat || '(bawaan karakter)'}`,
          `│ *VISION* : ${c.apiKey ? 'AKTIF (' + (c.baseUrl || 'groq') + ')' : 'mati (tanpa API key)'}`,
          `│ *MODEL*  : ${c.model || '(default)'}`,
          ``,
          `│ Perintah:`,
          `│ ,aiset gender perempuan|laki`,
          `│ ,aiset nama Vexa`,
          `│ ,aiset sifat suka ngecap orang`,
          `│ ,aiset on / off / auto on|off`,
          `│ ,aiset apikey <key>  ← vision`,
          `│ ,aiset baseurl <url>`,
          `│ ,aiset model <nama>`,
          `│ ,aiset reset`
        ])
      }

      switch (sub) {
        case 'lihat': case 'status': case 'info':
          return m.reply(show())

        case 'gender': case 'jk': case 'jenis': {
          const g = val.toLowerCase()
          let gender
          if (['perempuan', 'p', 'cewek', 'cewe', 'female', 'f', 'wanita'].includes(g)) gender = 'perempuan'
          else if (['laki', 'laki-laki', 'l', 'cowok', 'pria', 'male', 'm', 'jomok'].includes(g)) gender = 'laki-laki'
          else return m.reply('Format: *,aiset gender perempuan* atau *,aiset gender laki*')
          const c = ai.setAiCfg({ gender })
          // reset nama default jika masih pakai default lama
          if (c.nama === 'Vexa' || c.nama === 'Vandro') c.nama = gender === 'laki-laki' ? 'Vandro' : 'Vexa'
          db.save()
          return m.reply(`✅ Karakter AI → *${ai.PERSONA[gender].label}*\nNama: ${c.nama}\n\n${ai.PERSONA[gender].traits}`)
        }

        case 'nama': case 'name':
          if (!val) return m.reply('Format: *,aiset nama Vexa*')
          ai.setAiCfg({ nama: val.slice(0, 24) })
          return m.reply(`✅ Nama AI → *${val.slice(0, 24)}*`)

        case 'sifat': case 'karakter': case 'trait':
          if (val === '-' || val === 'reset') {
            ai.setAiCfg({ sifat: '' })
            return m.reply('✅ Sifat tambahan dihapus (kembali bawaan).')
          }
          if (!val) return m.reply('Format: *,aiset sifat suka marah-marah dikit* (atau *-* untuk hapus)')
          ai.setAiCfg({ sifat: val.slice(0, 300) })
          return m.reply(`✅ Sifat tambahan:\n*"${val.slice(0, 300)}"*`)

        case 'on': case 'aktif':
          ai.setAiCfg({ enabled: true })
          return m.reply('✅ AI *AKTIF* — akan membalas saat user membalas chat bot.')

        case 'off': case 'nonaktif': case 'mati':
          ai.setAiCfg({ enabled: false })
          return m.reply('✅ AI *DIMATIKAN*.')

        case 'auto': {
          const on = ['on', 'aktif', 'true'].includes(val.toLowerCase())
          const off = ['off', 'mati', 'false'].includes(val.toLowerCase())
          if (!on && !off) return m.reply('Format: *,aiset auto on* atau *,aiset auto off*')
          ai.setAiCfg({ auto: on })
          return m.reply(on
            ? '✅ AUTO REPLY *ON* — AI membalas semua chat di private (tanpa reply).'
            : '✅ AUTO REPLY *OFF*.')
        }

        case 'apikey': case 'key':
          if (val === '-' || val === 'reset') {
            ai.setAiCfg({ apiKey: '' })
            return m.reply('✅ API key dihapus (vision nonaktif, chat tetap jalan).')
          }
          if (!val) return m.reply('Format: *,aiset apikey gsk_xxx*\n\nDapatkan key gratis di console.groq.com → API Keys (untuk AI melihat gambar/video).')
          ai.setAiCfg({ apiKey: val })
          return m.reply('✅ API key tersimpan.\nSekarang AI bisa *melihat gambar/video* yang dikirim user.')

        case 'baseurl': case 'url':
          if (val === '-') { ai.setAiCfg({ baseUrl: '' }); return m.reply('✅ Base URL dihapus (default groq).') }
          if (!val) return m.reply('Format: *,aiset baseurl https://api.groq.com/openai/v1*')
          ai.setAiCfg({ baseUrl: val.replace(/\/+$/, '') })
          return m.reply(`✅ Base URL → ${val}`)

        case 'model':
          if (val === '-') { ai.setAiCfg({ model: '' }); return m.reply('✅ Model direset ke default.') }
          if (!val) return m.reply('Format: *,aiset model meta-llama/llama-4-scout-17b-16e-instruct*')
          ai.setAiCfg({ model: val })
          return m.reply(`✅ Model → ${val}`)

        case 'reset': {
          const d = db.load()
          d.aiRel = {}
          d.aiHist = {}
          db.save()
          return m.reply('♻️ Relasi & riwayat AI semua user direset.')
        }

        default:
          return m.reply('Option tidak dikenal. Lihat: *,aiset lihat*')
      }
    }
  },

  /* ══════════════ OWNER BOT — STIKER EMOT (.setstc) ══════════════ */
  {
    name: 'setstc',
    aliases: ['setemo', 'setstiker'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Atur stiker emote AI (reply stiker): marah/senang/bingung/random/default',
    usage: 'reply stiker lalu: .setstc marah | .setstc list',
    async run(m, sock, args) {
      const sub = (args[0] || '').toLowerCase()
      const valid = ['marah', 'senang', 'bingung', 'sayang', 'ngambek', 'netral', 'random', 'default']

      if (!sub || sub === 'list' || sub === 'lihat') {
        const stc = ai.stcCfg()
        const rows = Object.keys(stc).length
          ? Object.entries(stc).map(([k, v]) => `│ *${k}* → ${v}`).join('\n')
          : '│ (belum ada pengaturan — semua bawaan)'
        return m.reply(
          boxLines('SETSTC — STIKER EMOTE AI', [
            rows,
            ``,
            `│ Reply *stiker* lalu *.setstc marah*`,
            `│ untuk mengatur emote kondisi itu.`,
            `│ Kondisi: ${valid.join(' / ')}`,
            `│ *random* = acak dari pack bawaan`,
            `│ *default* = reset ke bawaan`
          ])
        )
      }
      if (!valid.includes(sub)) {
        return m.reply(`Kondisi tidak dikenal.\nPilihan: ${valid.join(' / ')}\nContoh: *.setstc marah* (sambil reply stiker)`)
      }

      // mode tanpa reply
      if (!m.quoted) {
        if (sub === 'random') {
          ai.setStcSource('default', 'random')
          return m.reply('✅ Semua emote AI sekarang diacak dari pack bawaan.')
        }
        if (sub === 'default') {
          const stc = ai.stcCfg()
          for (const k of Object.keys(stc)) delete stc[k]
          db.save()
          return m.reply('♻️ Stiker emote dikembalikan ke bawaan.')
        }
        // tanpa reply utk kondisi tertentu → pakai pack bawaan untuk kondisi itu
        ai.setStcSource(sub, 'default')
        return m.reply(`✅ Emote *${sub}* memakai pack bawaan.\n(kirim juga reply *stiker* + *.setstc ${sub}* untuk pakai stiker custom)`)
      }

      // dengan reply → wajib stiker
      if (m.quoted.type !== 'stickerMessage') {
        return m.reply('Reply harus *stiker*.\nContoh: kirim/reply stiker → *.setstc marah*')
      }
      try {
        const { downloadMediaMessage } = wa()
        const buf = await downloadMediaMessage(m.quoted.message, 'buffer', {}, {
          logger: require('pino')({ level: 'silent' }),
          reuploadRequest: sock.updateMediaMessage
        })
        const file = await ai.setStcCustom(sub, buf)
        await m.react('✅')
        m.reply(`✅ Stiker emote *${sub}* tersimpan → ${file}\nAI akan mengirimnya saat kondisi *${sub}.`)
      } catch (e) {
        m.reply('⚠️ Gagal menyimpan stiker: ' + e.message)
      }
    }
  },

  /* ══════════════ OWNER BOT — UTIL LAIN ══════════════ */
  {
    name: 'getpp',
    aliases: ['photoprofile'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Ambil foto profil WhatsApp seseorang',
    usage: ',getpp @user | ,getpp 628xxx | reply pesan lalu ,getpp',
    async run(m, sock, args) {
      const target = m.mentions?.[0] || m.quoted?.sender ||
        (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
      if (!target) return m.reply('Tag/mention nomor atau reply pesan orangnya.\nContoh: *,getpp @user*')
      try {
        const url = await sock.profilePictureUrl(target, 'image')
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
        const buf = Buffer.from(await res.arrayBuffer())
        await sock.sendMessage(m.chat, { image: buf, caption: `PP @${target.split('@')[0]}` }, { quoted: m.raw })
      } catch (e) {
        m.reply('⚠️ Foto profil tidak tersedia (private/tersimpan).')
      }
    }
  },
  {
    name: 'react',
    aliases: ['reaksi'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Kirim reaksi emoji ke sebuah pesan',
    usage: 'reply pesan lalu: ,react 😂',
    async run(m, sock, args) {
      const emoji = args[0]
      if (!emoji) return m.reply('Contoh: reply pesan → *,react 😂*')
      if (!m.quoted) return m.reply('Reply dulu pesan yang mau direaksi.')
      await sock.sendMessage(m.chat, { react: { text: emoji, key: m.quoted.key } })
    }
  },
  {
    name: 'idmsg',
    aliases: ['msgid', 'idpesan'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Lihat ID pesan (reply pesan) — untuk keperluan developer',
    usage: 'reply pesan lalu: ,idmsg',
    async run(m) {
      const q = m.quoted
      if (!q) return m.reply('Reply pesan dulu → *,idmsg*')
      m.reply(
        boxLines('MESSAGE ID', [
          `│ *CHAT*      : ${m.chat}`,
          `│ *ID*        : ${q.key?.id || '-'}`,
          `│ *PARTICIPANT*: ${q.key?.participant || '-'}`,
          `│ *FROMME*    : ${!!q.key?.fromMe}`
        ])
      )
    }
  },
  {
    name: 'hapusbot',
    aliases: ['delbot', 'deletebot'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Hapus pesan milik bot (reply pesan bot)',
    usage: 'reply pesan bot lalu: ,hapusbot',
    async run(m, sock) {
      if (!m.quoted) return m.reply('Reply pesan *bot* yang mau dihapus → *,hapusbot*')
      if (!m.quoted.key?.fromMe && !m.quoted.sender) return m.reply('Itu bukan pesan bot.')
      try {
        await sock.sendMessage(m.chat, { delete: m.quoted.key })
        m.reply('✅ Pesan dihapus.')
      } catch (e) {
        m.reply('⚠️ Gagal hapus: ' + e.message)
      }
    }
  },
  {
    name: 'backup',
    aliases: ['backupdb'],
    category: 'owner-bot',
    access: 'owner',
    prefixes: [','],
    desc: 'Backup database bot jadi file zip',
    usage: ',backup',
    async run(m, sock) {
      await m.react('📦')
      try {
        const AdmZip = require('adm-zip')
        const zip = new AdmZip()
        const dbFile = require('../config').dbFile
        if (fs.existsSync(dbFile)) zip.addLocalFile(dbFile)
        const pkg = require('path').join(__dirname, '..', 'package.json')
        if (fs.existsSync(pkg)) zip.addLocalFile(pkg)
        const buf = zip.toBuffer()
        await sock.sendMessage(m.chat, {
          document: buf,
          fileName: `vex1fz-backup-${Date.now()}.zip`,
          mimetype: 'application/zip',
          caption: '📦 Backup database vex1fz'
        }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply('⚠️ Backup gagal: ' + e.message)
      }
    }
  },

  /* ══════════════ PREFIX "=>" — OWNER DEV ══════════════ */
  {
    name: 'shell',
    aliases: ['exec', '$'],
    category: 'owner-dev',
    access: 'owner',
    prefixes: ['=>'],
    desc: 'Eksekusi perintah shell',
    usage: '=> shell ls -la',
    async run(m, sock, args) {
      if (!args.length) return m.reply('Contoh: `=> shell ls -la`')
      const { exec } = require('child_process')
      exec(args.join(' '), { timeout: 20_000, cwd: require('path').join(__dirname, '..') }, (err, stdout, stderr) => {
        const out = [stdout, stderr].filter(Boolean).join('\n') || (err ? err.message : '(kosong)')
        m.reply('```' + truncate(out, 3500) + '```')
      })
    }
  }
]

module.exports = commands
