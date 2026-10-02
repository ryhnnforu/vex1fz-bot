/**
 * commands/owner.js — fitur OWNER ONLY
 *   prefix "/"  → manajemen grup
 *   prefix ","  → manajemen bot
 *   prefix "=>" → tool developer (eval ada di handler utama)
 *
 * Semua command di file ini HANYA bisa dipanggil lewat prefix owner.
 */
const { jidNormalizedUser, downloadMediaMessage } = require('@whiskeysockets/baileys')
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
  /* ══════════════ PREFIX "/" — OWNER GRUP ══════════════ */
  {
    name: 'kick',
    aliases: ['keluarkan'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Keluarkan member dari grup',
    usage: '/kick @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag member yang mau dikeluarkan: */kick @user*')
      await sock.groupParticipantsUpdate(m.chat, [target], 'remove')
      m.reply(`✅ Berhasil mengeluarkan @${target.split('@')[0]}`, { mentions: [target] })
    }
  },
  {
    name: 'promote',
    aliases: ['naikkan'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Jadikan admin grup',
    usage: '/promote @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag member: */promote @user*')
      await sock.groupParticipantsUpdate(m.chat, [target], 'promote')
      m.reply(`✅ @${target.split('@')[0]} sekarang *ADMIN*`, { mentions: [target] })
    }
  },
  {
    name: 'demote',
    aliases: ['turunkan'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Cabut admin grup',
    usage: '/demote @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag member: */demote @user*')
      await sock.groupParticipantsUpdate(m.chat, [target], 'demote')
      m.reply(`✅ @${target.split('@')[0]} bukan admin lagi`, { mentions: [target] })
    }
  },
  {
    name: 'hidetag',
    aliases: ['htag'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Tag semua member (tersembunyi)',
    usage: '/hidetag teks',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const jids = meta.participants.map(p => p.id)
      await sock.sendMessage(m.chat, {
        text: args.join(' ') || 'Halo semua 👋',
        mentions: jids
      })
    }
  },
  {
    name: 'tagall',
    aliases: ['everyone'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Tag semua member (terlihat)',
    usage: '/tagall teks',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const teks = args.join(' ') || 'Panggilan semua member'
      const list = meta.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join('\n')
      await sock.sendMessage(m.chat, {
        text: `📢 *${teks}*\n\n${list}`,
        mentions: meta.participants.map(p => p.id)
      })
    }
  },
  {
    name: 'open',
    aliases: ['buka'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Buka grup (semua bisa kirim pesan)',
    usage: '/open',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      await sock.groupSettingUpdate(m.chat, 'not_announcement')
      m.reply('✅ Grup *DIBUKA* — semua member bisa kirim pesan.')
    }
  },
  {
    name: 'close',
    aliases: ['tutup'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Tutup grup (hanya admin)',
    usage: '/close',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      await sock.groupSettingUpdate(m.chat, 'announcement')
      m.reply('🔒 Grup *DITUTUP* — hanya admin yang bisa kirim pesan.')
    }
  },
  {
    name: 'linkgc',
    aliases: ['linkgroup'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Lihat link grup',
    usage: '/linkgc',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const code = await sock.groupInviteCode(m.chat)
      m.reply(`🔗 https://chat.whatsapp.com/${code}`)
    }
  },
  {
    name: 'revoke',
    aliases: ['resetlink'],
    category: 'owner-grup',
    access: 'owner',
    prefixes: ['/'],
    desc: 'Reset link grup',
    usage: '/revoke',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const code = await sock.groupRevokeInvite(m.chat)
      m.reply(`♻️ Link di-reset.\nLink baru: https://chat.whatsapp.com/${code}`)
    }
  },

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
