/**
 * commands/group.js — MENUGROUP (20 fitur; +30 lagi di group2.js = 50)
 *   Admin grup: .h .swgc .kick .add .promote .demote
 *               .welcome .setwelcome .goodbye .setgoodbye
 *               .bungkam .unbungkam .cekbungkam .tagall
 *               .open .close .linkgc .revoke .antilink
 *   Semua bisa:  .ginfo
 *
 * Prefix "." untuk semua (dicek role admin di handler utama, owner auto-lolos).
 * Sengaja pakai alias .dor/.ewe/.entod sesuai permintaan owner.
 */
const db = require('../lib/db')
const config = require('../config')
const { getMeta, isBotAdmin } = require('../lib/groupmeta')

/* ═══════════ helper ═══════════ */

function ensureGroup(m) {
  if (!m.isGroup) { m.reply('⚠️ Fitur ini hanya bisa dipakai di *grup*.'); return false }
  return true
}

async function ensureBotAdmin(sock, m) {
  if (!ensureGroup(m)) return false
  if (!await isBotAdmin(sock, m)) {
    m.reply('⚠️ Bot bukan admin di grup ini. Jadikan admin dulu ya.')
    return false
  }
  return true
}

function targetOf(m) {
  if (m.mentions && m.mentions.length) return m.mentions[0]
  if (m.quoted?.sender) return m.quoted.sender
  const a = m.args[0]
  if (a && /^\d{5,}$/.test(a.replace(/[^0-9]/g, ''))) {
    return a.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  }
  return null
}

/** parse durasi: 30detik / 5menit / 2jam / 1hari / 1minggu / 1bulan */
function parseDur(str) {
  const s = String(str || '').toLowerCase().trim()
  const m = s.match(/^(\d+)\s*(detik|dtk|second|seconds?|menit|mnt|minute|minutes?|jam|hour|hours?|hari|day|days?|minggu|week|weeks?|bulan|month|months?)$/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const u = m[2]
  const ms =
    /^(detik|dtk|second)/.test(u) ? n * 1000 :
    /^(menit|mnt|minute)/.test(u) ? n * 60_000 :
    /^(jam|hour)/.test(u) ? n * 3_600_000 :
    /^(hari|day)/.test(u) ? n * 86_400_000 :
    /^(minggu|week)/.test(u) ? n * 604_800_000 :
    /^(bulan|month)/.test(u) ? n * 2_592_000_000 : 0
  return ms || null
}

function mutedMap() {
  const d = db.load()
  if (!d.settings.muted) d.settings.muted = {}
  return d.settings.muted
}

function groupCfg(jid) {
  const d = db.load()
  if (!d.settings.groupcfg) d.settings.groupcfg = {}
  if (!d.settings.groupcfg[jid]) d.settings.groupcfg[jid] = { welcome: { on: false, text: '' }, goodbye: { on: false, text: '' }, antilink: false }
  const g = d.settings.groupcfg[jid]
  if (!g.welcome) g.welcome = { on: false, text: '' }
  if (!g.goodbye) g.goodbye = { on: false, text: '' }
  return g
}

const mentionsOf = jid => ({ mentions: [jid] })

/* ═══════════ 20 FITUR ═══════════ */
const commands = [
  /* 1. HIDETAG */
  {
    name: 'h',
    aliases: ['hidetag', 'htag'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Tag semua member tanpa terlihat (tersembunyi)',
    usage: '.h halo semua',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const jids = meta.participants.map(p => p.id)
      await sock.sendMessage(m.chat, { text: args.join(' ') || 'Halo semua 👋', mentions: jids })
    }
  },

  /* 2. STATUS GROUP (deskripsi) */
  {
    name: 'swgc',
    aliases: ['setdeskripsi', 'setdesc', 'statusgc'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Buat/ubah status (deskripsi) grup',
    usage: '.swgc selamat datang di grup ini',
    async run(m, sock, args) {
      if (!await ensureBotAdmin(sock, m)) return
      const teks = args.join(' ').trim()
      if (!teks) return m.reply('Tulis status grup dulu.\nContoh: *.swgc Grup kumpul anak gasik*')
      await sock.groupUpdateDescription(m.chat, teks)
      m.reply('✅ Status (deskripsi) grup sudah diperbarui.')
    }
  },

  /* 3. KICK — alias .dor .ewe .entod */
  {
    name: 'kick',
    aliases: ['dor', 'ewe', 'entod', 'keluarkan', 'remove'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Keluarkan member dari grup (reply/tag/numor)',
    usage: '.kick @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag/reply member yang mau dikeluarkan: *.kick @user*')
      if (target === m.sender || target.split('@')[0] === m.sender.split('@')[0]) return m.reply('Ga bisa keluarin diri sendiri 😅')
      try {
        await sock.groupParticipantsUpdate(m.chat, [target], 'remove')
        m.reply(`✅ @${target.split('@')[0]} sudah dikeluarkan dari grup.`, mentionsOf(target))
      } catch (e) {
        const msg = String(e?.message || e)
        if (/403|not-allowed|forbidden|admin/i.test(msg)) {
          m.reply('⚠️ Gagal — bot bukan admin, atau target adalah *admin/pemilik grup* yang dilindungi.')
        } else {
          m.reply('⚠️ Gagal kick: ' + msg.slice(0, 200))
        }
      }
    }
  },

  /* 4. ADD */
  {
    name: 'add',
    aliases: ['tambah', 'invite'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Tambahkan nomor ke grup',
    usage: '.add 6281234567890',
    async run(m, sock, args) {
      if (!await ensureBotAdmin(sock, m)) return
      const num = (args[0] || '').replace(/[^0-9]/g, '')
      if (num.length < 8) return m.reply('Tulis nomornya dulu.\nContoh: *.add 6281234567890*')
      const jid = num + '@s.whatsapp.net'
      try {
        await sock.groupParticipantsUpdate(m.chat, [jid], 'add')
        m.reply(`✅ @${num} berhasil ditambahkan.`, mentionsOf(jid))
      } catch (e) {
        m.reply(`⚠️ Gagal menambahkan. Mungkin nomor private/keluar dari kontak.\n${e.message || ''}`)
      }
    }
  },

  /* 5. PROMOTE */
  {
    name: 'promote',
    aliases: ['naikkan', 'jdadmin'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Jadikan member sebagai admin grup',
    usage: '.promote @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag member: *.promote @user*')
      await sock.groupParticipantsUpdate(m.chat, [target], 'promote')
      m.reply(`✅ @${target.split('@')[0]} sekarang *ADMIN* grup.`, mentionsOf(target))
    }
  },

  /* 6. DEMOTE */
  {
    name: 'demote',
    aliases: ['turunkan', 'cabutadmin'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Cabut status admin member',
    usage: '.demote @user',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag member: *.demote @user*')
      await sock.groupParticipantsUpdate(m.chat, [target], 'demote')
      m.reply(`✅ @${target.split('@')[0]} bukan admin lagi.`, mentionsOf(target))
    }
  },

  /* 7. WELCOME toggle */
  {
    name: 'welcome',
    aliases: ['sambutan'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Nyalakan/matikan sambutan member baru',
    usage: '.welcome on | .welcome off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const st = (args[0] || '').toLowerCase()
      if (!['on', 'off', 'enable', 'disable'].includes(st)) {
        return m.reply(`Status welcome: *${g.welcome.on ? 'ON ✅' : 'OFF ❌'}*\nKetik *.welcome on* atau *.welcome off*`)
      }
      g.welcome.on = st === 'on' || st === 'enable'
      db.save()
      m.reply(`✅ Welcome *${g.welcome.on ? 'DINYALAKAN' : 'DIMATIKAN'}*.${g.welcome.on ? '' : ''}`)
    }
  },

  /* 8. SET WELCOME teks */
  {
    name: 'setwelcome',
    aliases: ['setsw'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Atur teks sambutan custom (placeholder {name} {group} {date} {num})',
    usage: '.setwelcome Selamat datang {name} di {group}! | .setwelcome off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const teks = args.join(' ').trim()
      if (!teks) {
        return m.reply(
          `Teks welcome sekarang:\n${g.welcome.text || '(bawaan bot)'}\n\n` +
          `Contoh: *.setwelcome Halo {name}, selamat bergabung di {group}! 🎉*\n` +
          `Placeholder: {name} {group} {date} {num}\n` +
          `Matikan: *.setwelcome off*`
        )
      }
      if (teks.toLowerCase() === 'off') {
        g.welcome.on = false
        db.save()
        return m.reply('✅ Welcome dimatikan.')
      }
      g.welcome.text = teks
      g.welcome.on = true
      db.save()
      m.reply('✅ Teks welcome disimpan & welcome dinyalakan.')
    }
  },

  /* 9. GOODBYE toggle */
  {
    name: 'goodbye',
    aliases: ['permisi'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Nyalakan/matikan pesan keluar member',
    usage: '.goodbye on | .goodbye off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const st = (args[0] || '').toLowerCase()
      if (!['on', 'off', 'enable', 'disable'].includes(st)) {
        return m.reply(`Status goodbye: *${g.goodbye.on ? 'ON ✅' : 'OFF ❌'}*\nKetik *.goodbye on* atau *.goodbye off*`)
      }
      g.goodbye.on = st === 'on' || st === 'enable'
      db.save()
      m.reply(`✅ Goodbye *${g.goodbye.on ? 'DINYALAKAN' : 'DIMATIKAN'}*.`)
    }
  },

  /* 10. SET GOODBYE teks */
  {
    name: 'setgoodbye',
    aliases: ['setgb'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Atur teks perpisahan custom (placeholder {name} {group} {date} {num})',
    usage: '.setgoodbye Selamat tinggal {name}! | .setgoodbye off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const teks = args.join(' ').trim()
      if (!teks) {
        return m.reply(
          `Teks goodbye sekarang:\n${g.goodbye.text || '(bawaan bot)'}\n\n` +
          `Contoh: *.setgoodbye Dadah {name}, jaga diri ya! 👋*\n` +
          `Placeholder: {name} {group} {date} {num}\n` +
          `Matikan: *.setgoodbye off*`
        )
      }
      if (teks.toLowerCase() === 'off') {
        g.goodbye.on = false
        db.save()
        return m.reply('✅ Goodbye dimatikan.')
      }
      g.goodbye.text = teks
      g.goodbye.on = true
      db.save()
      m.reply('✅ Teks goodbye disimpan & goodbye dinyalakan.')
    }
  },

  /* 11. BUNGKAM */
  {
    name: 'bungkam',
    aliases: ['mute', 'bisukan'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Bungkam member — bot hapus semua pesannya selama durasi',
    usage: '.bungkam 1jam @user | .bungkam 1hari (reply)',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const durStr = args[0]
      const ms = parseDur(durStr)
      if (!ms) {
        return m.reply(
          'Format durasi belum benar.\n' +
          'Contoh: *.bungkam 30menit @user*\n' +
          'Satuan: detik, menit, jam, hari, minggu, bulan'
        )
      }
      const target = targetOf(m) || (args[1] ? args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
      if (!target) return m.reply('Tag/reply member yang mau dibungkam: *.bungkam 1jam @user*')
      if (target === m.sender) return m.reply('Ga bisa bungkam diri sendiri 😅')
      const map = mutedMap()
      map[target] = { until: Date.now() + ms, by: m.sender, chat: m.chat }
      db.save()
      const durTxt = durStr
      await sock.sendMessage(m.chat, {
        text: `🔇 @${target.split('@')[0]} dibungkam *${durTxt}*.\nSemua pesannya akan bot hapus selama durasi itu.`,
        mentions: [target]
      })
    }
  },

  /* 12. UNBUNGKAM */
  {
    name: 'unbungkam',
    aliases: ['unmute', 'lepas'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Buka pembungkaman member lebih awal',
    usage: '.unbungkam @user',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const target = targetOf(m)
      if (!target) return m.reply('Tag/reply member: *.unbungkam @user*')
      const map = mutedMap()
      if (!map[target]) return m.reply('Member itu sedang tidak dibungkam.')
      delete map[target]
      db.save()
      m.reply(`✅ @${target.split('@')[0]} boleh bicara lagi.`, mentionsOf(target))
    }
  },

  /* 13. CEK BUNGKAM */
  {
    name: 'cekbungkam',
    aliases: ['listmute'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Daftar member yang sedang dibungkam',
    usage: '.cekbungkam',
    async run(m) {
      if (!ensureGroup(m)) return
      const map = mutedMap()
      const now = Date.now()
      const rows = Object.entries(map).filter(([, v]) => v.until > now && v.chat === m.chat)
      if (!rows.length) return m.reply('Tidak ada member yang dibungkam di grup ini 👌')
      const lines = rows.map(([jid, v], i) => {
        const sisa = Math.ceil((v.until - now) / 60000)
        return `${i + 1}. @${jid.split('@')[0]} — sisa ${sisa} menit`
      })
      const jids = rows.map(([j]) => j)
      await m.reply(`🔇 *DAFTAR BUNGKAM*\n\n${lines.join('\n')}`, { mentions: jids })
    }
  },

  /* 14. TAGALL */
  {
    name: 'tagall',
    aliases: ['everyone', 'all'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Tag semua member (terlihat)',
    usage: '.tagall ada rapat?',
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

  /* 15. OPEN */
  {
    name: 'open',
    aliases: ['bukagc'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Buka grup (semua member bisa kirim pesan)',
    usage: '.open',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      await sock.groupSettingUpdate(m.chat, 'not_announcement')
      m.reply('✅ Grup *DIBUKA* — semua member bisa kirim pesan.')
    }
  },

  /* 16. CLOSE */
  {
    name: 'close',
    aliases: ['tutup', 'tutupgc'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Tutup grup (hanya admin yang bisa kirim)',
    usage: '.close',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      await sock.groupSettingUpdate(m.chat, 'announcement')
      m.reply('🔒 Grup *DITUTUP* — hanya admin yang bisa kirim pesan.')
    }
  },

  /* 17. LINK GC */
  {
    name: 'linkgc',
    aliases: ['linkgroup', 'tautangrup'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Lihat link undangan grup',
    usage: '.linkgc',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const code = await sock.groupInviteCode(m.chat)
      m.reply(`🔗 https://chat.whatsapp.com/${code}`)
    }
  },

  /* 18. REVOKE */
  {
    name: 'revoke',
    aliases: ['resetlink'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Reset link undangan grup (link lama mati)',
    usage: '.revoke',
    async run(m, sock) {
      if (!await ensureBotAdmin(sock, m)) return
      const code = await sock.groupRevokeInvite(m.chat)
      m.reply(`♻️ Link di-reset.\nLink baru: https://chat.whatsapp.com/${code}`)
    }
  },

  /* 19. INFO GRUP */
  {
    name: 'ginfo',
    aliases: ['grupinfo', 'infogroup'],
    category: 'group',
    access: 'user',
    prefixes: ['.'],
    desc: 'Info lengkap grup (nama, jumlah member, admin, deskripsi)',
    usage: '.ginfo',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const admins = (meta.participants || []).filter(p => p.admin)
      const d = meta.desc || '(tidak ada deskripsi)'
      const created = meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : '-'
      await m.reply(
        `┌┈┈┈┈┈┈┈○ 「 INFO GRUP 」\n` +
        `│ *NAMA*     : ${meta.subject}\n` +
        `│ *OWNER*    : @${(meta.subjectOwner || '').split('@')[0] || '-'}\n` +
        `│ *MEMBER*   : ${(meta.participants || []).length} orang\n` +
        `│ *ADMIN*    : ${admins.length} orang\n` +
        `│ *DIBUAT*   : ${created}\n` +
        `│ *DESKRIPSI*:\n${String(d).slice(0, 300)}\n` +
        `└${'┈'.repeat(21)}○`,
        meta.subjectOwner ? { mentions: [meta.subjectOwner] } : undefined
      )
    }
  },

  /* 20. ANTILINK */
  {
    name: 'antilink',
    aliases: ['tolaklink'],
    category: 'group',
    access: 'admin',
    prefixes: ['.'],
    desc: 'Auto-hapus pesan berisi link grup/channel di grup ini',
    usage: '.antilink on | .antilink off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const st = (args[0] || '').toLowerCase()
      if (!['on', 'off', 'enable', 'disable'].includes(st)) {
        return m.reply(`Status antilink: *${g.antilink ? 'ON ✅' : 'OFF ❌'}*\nKetik *.antilink on* / *.antilink off*`)
      }
      g.antilink = st === 'on' || st === 'enable'
      db.save()
      m.reply(`✅ Antilink *${g.antilink ? 'DINYALAKAN' : 'DIMATIKAN'}*.${g.antilink ? '\nBot akan hapus pesan link grup/channel.' : ''}`)
    }
  }
]

module.exports = commands
module.exports.groupCfg = groupCfg
module.exports.mutedMap = mutedMap
module.exports.parseDur = parseDur
