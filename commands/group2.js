/**
 * commands/group2.js — MENUGROUP +30 (lanjutan group.js)
 *   tagadmin bisik warn unwarn warnlist warnreset antitoxic antispam slowmode
 *   welcomeon welcomeoff goodbyeon goodbyeoff antilinkon antilinkoff
 *   closetime setnamegc setppgc listmember listadmin whois tagme absen
 *   rules setrules welcomepreview goodbyepreview cekbacot votekick ppgc
 */
const db = require('../lib/db')
const config = require('../config')
const { getMeta, isBotAdmin, isGroupAdmin } = require('../lib/groupmeta')
const img = require('../lib/img')
const { wa } = require('../lib/wa')
const { fmt, randomInt, pick } = require('../lib/util')

/* ── helper lokal (mirror group.js) ── */
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
function groupCfg(jid) {
  const d = db.load()
  if (!d.settings.groupcfg) d.settings.groupcfg = {}
  if (!d.settings.groupcfg[jid]) d.settings.groupcfg[jid] = { welcome: { on: false, text: '' }, goodbye: { on: false, text: '' }, antilink: false }
  const g = d.settings.groupcfg[jid]
  if (!g.welcome) g.welcome = { on: false, text: '' }
  if (!g.goodbye) g.goodbye = { on: false, text: '' }
  if (!g.warns) g.warns = {}
  if (!g.toxicCount) g.toxicCount = {}
  return g
}
function targetOf(m) {
  if (m.mentions && m.mentions.length) return m.mentions[0]
  if (m.quoted?.sender) return m.quoted.sender
  return null
}
const mention = jid => ({ mentions: [jid] })
function others(meta, jid) { // daftar partisipan non-bot
  return (meta.participants || []).map(p => p.id)
}

const commands = [
  /* 1. TAG ADMIN */
  {
    name: 'tagadmin', aliases: ['tagadmins'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Tag semua admin grup', usage: '.tagadmin',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const admins = (meta.participants || []).filter(p => p.admin)
      if (!admins.length) return m.reply('Tidak ada admin?aneh.')
      await sock.sendMessage(m.chat, {
        text: `📣 Tag semua admin:\n${admins.map(a => `@${a.id.split('@')[0].split(':')[0]}`).join(' ')}`,
        mentions: admins.map(a => a.id)
      })
    }
  },

  /* 2. BISIK (PV diam-diam) */
  {
    name: 'bisik', aliases: ['pv', 'secretpm'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Kirim pesan privat ke target (tanpa ketahuan grup)', usage: '.bisik @user halo',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const t = targetOf(m)
      if (!t) return m.reply('⚠️ Reply/mention orang yang mau dibisik.\nContoh: `.bisik @user jangan bilang siapa-siapa`')
      const text = args.join(' ').trim()
      if (!text) return m.reply('⚠️ Tulis pesannya. Contoh: `.bisik @user kita menang nanti`')
      try {
        await sock.sendMessage(t, { text: `🤫 *Bisikan dari grup*\n\n${text}` })
        await m.reply(`✅ Sudah kubisikkan ke @${t.split('@')[0].split(':')[0]}`, mention(t))
      } catch (e) {
        m.reply('❌ Gagal mengirim bisikan (target mungkin belum chat bot).')
      }
    }
  },

  /* 3. WARN */
  {
    name: 'warn', aliases: ['peringatan'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Kasih peringatan ke member (3x warn = kick otomatis)', usage: '.warn @user spam',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const t = targetOf(m)
      if (!t) return m.reply('⚠️ Mention/reply member yang mau di-warn.')
      const g = groupCfg(m.chat)
      g.warns[t] = (g.warns[t] || 0) + 1
      const alasan = args.filter(a => !a.startsWith('@')).join(' ') || 'tanpa alasan'
      db.save()
      if (g.warns[t] >= 3) {
        g.warns[t] = 0
        db.save()
        if (await ensureBotAdmin(sock, m)) {
          try {
            await sock.groupParticipantsUpdate(m.chat, [t], 'remove')
            return m.reply(`🚨 @${t.split('@')[0].split(':')[0]} kena *3 warn* → *DIKICK*.`, mention(t))
          } catch (e) { m.reply('⚠️ Gagal kick (mungkin target admin).') }
        }
        return
      }
      m.reply(
        `⚠️ *WARN* ${g.warns[t]}/3 untuk @${t.split('@')[0].split(':')[0]}\nAlasan: ${alasan}\n` +
        (g.warns[t] === 2 ? '*Peringatan terakhir!* sekali lagi di-kick.' : ''),
        mention(t)
      )
    }
  },

  /* 4. UNWARN */
  {
    name: 'unwarn', aliases: ['nowarn'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Hapus 1 peringatan member', usage: '.unwarn @user',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const t = targetOf(m)
      if (!t) return m.reply('⚠️ Mention/reply member.')
      const g = groupCfg(m.chat)
      if (!g.warns[t]) return m.reply('Member itu tidak punya warn.')
      g.warns[t]--
      db.save()
      m.reply(`✅ Warn @${t.split('@')[0].split(':')[0]} sekarang *${g.warns[t]}/3*.`, mention(t))
    }
  },

  /* 5. WARNLIST */
  {
    name: 'warnlist', aliases: ['daftarwarn'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Daftar member yang kena warn', usage: '.warnlist',
    async run(m) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const rows = Object.entries(g.warns).filter(([, v]) => v > 0)
      if (!rows.length) return m.reply('🎉 Tidak ada yang kena warn.')
      m.reply(['⚠️ *DAFTAR WARN*', ''].concat(rows.map(([j, v]) => `• @${j.split('@')[0].split(':')[0]} — ${v}/3`)).join('\n'),
        { mentions: rows.map(([j]) => j) })
    }
  },

  /* 6. WARNRESET */
  {
    name: 'warnreset', aliases: ['resetwarn'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Reset warn semua member / 1 member', usage: '.warnreset [@user|all]',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const t = targetOf(m)
      if (t) { g.warns[t] = 0; db.save(); return m.reply(`✅ Warn @${t.split('@')[0].split(':')[0]} direset.`, mention(t)) }
      g.warns = {}
      db.save()
      m.reply('✅ Semua warn direset.')
    }
  },

  /* 7. ANTITOXIC */
  {
    name: 'antitoxic', aliases: ['antikasar'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Auto-deteksi kata kasar → pesan dihapus + warn', usage: '.antitoxic on | off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const st = (args[0] || '').toLowerCase()
      if (!['on', 'off', 'enable', 'disable'].includes(st)) {
        return m.reply(`Status antitoxic: *${g.antitoxic ? 'ON ✅' : 'OFF ❌'}*\nKetik *.antitoxic on/off*`)
      }
      g.antitoxic = st === 'on' || st === 'enable'
      db.save()
      m.reply(`✅ Antitoxic *${g.antitoxic ? 'DINYALAKAN' : 'DIMATIKAN'}*.`)
    }
  },

  /* 8. ANTISPAM */
  {
    name: 'antispam', aliases: ['antiflood'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Deteksi spam (≥5 pesan/5 detik) → pesan dihapus', usage: '.antispam on | off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const st = (args[0] || '').toLowerCase()
      if (!['on', 'off', 'enable', 'disable'].includes(st)) {
        return m.reply(`Status antispam: *${g.antispam ? 'ON ✅' : 'OFF ❌'}*\nKetik *.antispam on/off*`)
      }
      g.antispam = st === 'on' || st === 'enable'
      db.save()
      m.reply(`✅ Antispam *${g.antispam ? 'DINYALAKAN' : 'DIMATIKAN'}*.`)
    }
  },

  /* 9. SLOWMODE (chat pace) */
  {
    name: 'slowmode', aliases: ['slow'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Batas 1 pesan per X detik per orang (slow chat)', usage: '.slowmode 5 | .slowmode off',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const a = (args[0] || '').toLowerCase()
      if (!a) return m.reply(`Slowmode sekarang: *${g.slow ? g.slow + ' detik' : 'OFF'}*\nAtur: *.slowmode 5* / *.slowmode off*`)
      if (['off', '0'].includes(a)) { g.slow = 0; db.save(); return m.reply('✅ Slowmode dimatikan.') }
      const n = parseInt(a, 10)
      if (!n || n < 2 || n > 300) return m.reply('Durasi 2–300 detik. Contoh: *.slowmode 5*')
      g.slow = n
      db.save()
      m.reply(`✅ Slowmode *${n} detik* — pesan lebih cepat dari itu akan dihapus.`)
    }
  },

  /* 10–11. WELCOME ON/OFF */
  {
    name: 'welcomeon', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Nyalakan sambutan member baru', usage: '.welcomeon',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.welcome.on = true; db.save(); m.reply('✅ Welcome *DINYALAKAN*.') }
  },
  {
    name: 'welcomeoff', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Matikan sambutan member baru', usage: '.welcomeoff',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.welcome.on = false; db.save(); m.reply('✅ Welcome *DIMATIKAN*.') }
  },

  /* 12–13. GOODBYE ON/OFF */
  {
    name: 'goodbyeon', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Nyalakan pesan member keluar', usage: '.goodbyeon',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.goodbye.on = true; db.save(); m.reply('✅ Goodbye *DINYALAKAN*.') }
  },
  {
    name: 'goodbyeoff', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Matikan pesan member keluar', usage: '.goodbyeoff',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.goodbye.on = false; db.save(); m.reply('✅ Goodbye *DIMATIKAN*.') }
  },

  /* 14–15. ANTILINK ON/OFF */
  {
    name: 'antilinkon', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Nyalakan auto-hapus link grup/channel', usage: '.antilinkon',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.antilink = true; db.save(); m.reply('✅ Antilink *DINYALAKAN*.') }
  },
  {
    name: 'antilinkoff', category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Matikan auto-hapus link grup/channel', usage: '.antilinkoff',
    run: (m) => { if (!ensureGroup(m)) return; const g = groupCfg(m.chat); g.antilink = false; db.save(); m.reply('✅ Antilink *DIMATIKAN*.') }
  },

  /* 16. CLOSETIME */
  {
    name: 'closetime', aliases: ['jadwaltutup'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Tutup grup otomatis setelah durasi', usage: '.closetime 10menit',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      if (!await ensureBotAdmin(sock, m)) return
      const s = (args.join('') || '').toLowerCase()
      const mm = s.match(/^(\d+)(detik|menit|jam)$/)
      if (!mm) return m.reply('⚠️ Contoh: `.closetime 10menit` (detik/menit/jam)')
      const n = parseInt(mm[1], 10)
      const ms = mm[2] === 'detik' ? n * 1000 : mm[2] === 'menit' ? n * 60000 : n * 3600000
      if (ms < 10000 || ms > 6 * 3600000) return m.reply('Durasi 10 detik – 6 jam.')
      m.reply(`🔒 Grup akan *DITUTUP* dalam ${mm[1]}${mm[2]} lagi.`)
      setTimeout(async () => {
        try {
          await sock.groupSettingUpdate(m.chat, 'announcement')
          await sock.sendMessage(m.chat, { text: '🔒 Grup ditutup sesuai *closetime*. Buka lagi: *.open*' })
        } catch (e) { console.warn('closetime gagal:', e.message) }
      }, ms)
    }
  },

  /* 17. SETNAMEGC */
  {
    name: 'setnamegc', aliases: ['setsubject'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Ganti nama grup', usage: '.setnamegc Nama Baru',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      if (!await ensureBotAdmin(sock, m)) return
      const nama = args.join(' ').trim()
      if (!nama) return m.reply('⚠️ Contoh: `.setnamegc Grup Keren`')
      await sock.groupUpdateSubject(m.chat, nama.slice(0, 100))
      m.reply(`✅ Nama grup diganti jadi *${nama.slice(0, 100)}*`)
    }
  },

  /* 18. SETPPGC */
  {
    name: 'setppgc', aliases: ['setfotogrup'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Ganti foto grup (reply foto)', usage: 'reply foto → .setppgc',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      if (!await ensureBotAdmin(sock, m)) return
      if (!m.quoted || m.quoted.mtype !== 'imageMessage') return m.reply('⚠️ Reply foto dulu, lalu ketik `.setppgc`')
      try {
        const { downloadMediaMessage } = wa()
        const buf = await downloadMediaMessage(m.quoted.message, 'buffer', {}, {
          reuploadRequest: sock.updateMediaMessage
        })
        await sock.groupUpdatePicture(m.chat, buf)
        m.reply('✅ Foto grup diganti! 🖼️')
      } catch (e) {
        m.reply('❌ Gagal mengganti foto: ' + (e.message || e))
      }
    }
  },

  /* 19. LISTMEMBER */
  {
    name: 'listmember', aliases: ['memberlist'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Daftar semua member grup', usage: '.listmember',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const ids = others(meta)
      const lines = ids.map((j, i) => `${i + 1}. @${j.split('@')[0].split(':')[0]}`)
      const chunk = 40
      for (let i = 0; i < lines.length; i += chunk) {
        await sock.sendMessage(m.chat, {
          text: `${i === 0 ? `👥 *MEMBER (${ids.length})*\n` : ''}${lines.slice(i, i + chunk).join('\n')}`,
          mentions: ids.slice(i, i + chunk)
        })
        await new Promise(r => setTimeout(r, 400))
      }
    }
  },

  /* 20. LISTADMIN */
  {
    name: 'listadmin', aliases: ['adminlist'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Daftar admin grup', usage: '.listadmin',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const admins = (meta.participants || []).filter(p => p.admin)
      const superadmin = admins.filter(p => p.admin === 'superadmin').map(p => p.id)
      const normal = admins.filter(p => p.admin === 'admin').map(p => p.id)
      const fmt2 = arr => arr.length ? arr.map(j => `@${j.split('@')[0].split(':')[0]}`).join('\n') : '—'
      await sock.sendMessage(m.chat, {
        text: `👑 *ADMIN GRUP*\n\n*Owner/Superadmin:*\n${fmt2(superadmin)}\n\n*Admin:*\n${fmt2(normal)}`,
        mentions: admins.map(p => p.id)
      })
    }
  },

  /* 21. WHOIS */
  {
    name: 'whois', aliases: ['cekuser'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Info profil member (mention/reply)', usage: '.whois @user',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const t = targetOf(m) || m.sender
      const meta = await getMeta(sock, m.chat)
      const p = (meta.participants || []).find(x => x.id === t)
      const isAdmin = p ? !!p.admin : false
      let pp = ''
      try { pp = await sock.profilePictureUrl(t, 'image') } catch (_) {}
      const nick = m.mentions?.length ? (m.quoted?.pushName || t.split('@')[0].split(':')[0]) : (m.quoted?.pushName || m.pushName || t.split('@')[0])
      await sock.sendMessage(m.chat, {
        image: { url: pp || 'https://i.imgur.com/6PpsHYd.png' },
        caption: [
          `🕵️ *WHOIS*`,
          `• Nama : ${nick}`,
          `• Jid  : ${t}`,
          `• Admin: ${isAdmin ? (p.admin === 'superadmin' ? 'Owner Grup 👑' : 'Admin ✅') : 'Member'}`,
          `• Grup : ${meta.subject || '-'} (${(meta.participants || []).length} member)`
        ].join('\n')
      })
    }
  },

  /* 22. TAGME */
  {
    name: 'tagme', category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Tag diri sendiri', usage: '.tagme',
    run: (m, sock) => {
      if (!ensureGroup(m)) return
      sock.sendMessage(m.chat, { text: `👋 ${m.pushName} memanggil kamu semua~`, mentions: [m.sender] })
    }
  },

  /* 23. ABSEN */
  {
    name: 'absen', aliases: ['absensi'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Absensi: .absen (ikut) | .absen cek | .absen reset (admin)', usage: '.absen',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const sub = (args[0] || '').toLowerCase()
      if (sub === 'cek') {
        const l = g.absen?.list || []
        if (!l.length) return m.reply('Belum ada yang absen. Ketik *.absen*')
        return m.reply([`📋 *ABSEN — ${l.length} orang*`, ''].concat(l.map((j, i) => `${i + 1}. @${j.split('@')[0].split(':')[0]}`)).join('\n'), { mentions: l })
      }
      if (sub === 'reset') {
        if (!(await isGroupAdmin(sock, m))) return m.reply('⚠️ Khusus admin.')
        g.absen = { list: [] }
        db.save()
        return m.reply('✅ Absen direset.')
      }
      if (!g.absen) g.absen = { list: [] }
      if (g.absen.list.includes(m.sender)) return m.reply('Kamu sudah absen ✅')
      g.absen.list.push(m.sender)
      db.save()
      m.reply(`✅ Absen tercatat (*${g.absen.list.length}* peserta). Cek: *.absen cek*`)
    }
  },

  /* 24. RULES */
  {
    name: 'rules', aliases: ['peraturan'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Lihat peraturan grup', usage: '.rules',
    run: (m) => {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const txt = g.rules || 'Belum ada peraturan khusus.\nOwner grup bisa set: *.setrules <teks>*'
      m.reply(`📜 *PERATURAN GRUP*\n\n${txt}`)
    }
  },

  /* 25. SETRULES */
  {
    name: 'setrules', aliases: ['setperaturan'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Atur peraturan grup', usage: '.setrules Dilarang spam...',
    run: (m, sock, args) => {
      if (!ensureGroup(m)) return
      const txt = args.join(' ').trim()
      if (!txt) return m.reply('⚠️ Contoh: `.setrules Dilarang promo. Wajib sopan.`')
      if (txt.toLowerCase() === 'off') { groupCfg(m.chat).rules = ''; db.save(); return m.reply('✅ Peraturan dihapus.') }
      groupCfg(m.chat).rules = txt.slice(0, 1500)
      db.save()
      m.reply('✅ Peraturan disimpan. Cek: *.rules*')
    }
  },

  /* 26. WELCOMEPREVIEW */
  {
    name: 'welcomepreview', aliases: ['previewwelcome'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Preview kartu welcome', usage: '.welcomepreview',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      let pp = null
      try {
        const { downloadMediaMessage } = wa()
        const url = await sock.profilePictureUrl(m.sender, 'image')
        pp = await downloadMediaMessage({ imageMessage: { url } }, 'buffer', {}, {})
      } catch (_) {}
      const card = await img.welcomeCard({
        name: m.pushName || 'Member',
        num: m.sender.split('@')[0].split(':')[0],
        group: meta.subject || 'Grup',
        date: new Date().toLocaleDateString('id-ID'),
        joining: true,
        members: (meta.participants || []).length + 1,
        ppBuf: pp
      })
      await sock.sendMessage(m.chat, { image: card, caption: '👀 Preview *welcome* (kartu selalu tampil, wm tidak ada di gambar)' })
    }
  },

  /* 27. GOODBYEPREVIEW */
  {
    name: 'goodbyepreview', aliases: ['previewgoodbye'], category: 'group', access: 'admin', prefixes: ['.'],
    desc: 'Preview kartu goodbye', usage: '.goodbyepreview',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      const meta = await getMeta(sock, m.chat)
      const card = await img.welcomeCard({
        name: m.pushName || 'Member',
        num: m.sender.split('@')[0].split(':')[0],
        group: meta.subject || 'Grup',
        date: new Date().toLocaleDateString('id-ID'),
        joining: false,
        members: Math.max(1, (meta.participants || []).length - 1),
        ppBuf: null
      })
      await sock.sendMessage(m.chat, { image: card, caption: '👀 Preview *goodbye*' })
    }
  },

  /* 28. CEKBACOT */
  {
    name: 'cekbacot', aliases: ['cektotoxic'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Cek berapa kali kena deteksi kata kasar', usage: '.cekbacot [@user]',
    async run(m) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const t = targetOf(m) || m.sender
      const n = g.toxicCount[t] || 0
      m.reply(
        n === 0
          ? `✅ @${t.split('@')[0].split(':')[0]} belum pernah kena deteksi kata kasar. Bersih!`
          : `🤨 @${t.split('@')[0].split(':')[0]} pernah kena *${n}x* deteksi antitoxic.${n >= 5 ? ' Sering banget 🗿' : ''}`,
        mention(t)
      )
    }
  },

  /* 29. VOTEKICK */
  {
    name: 'votekick', aliases: ['votingkick'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Vote kick member: .votekick @user | .votekick ya/tidak', usage: '.votekick @user alasan',
    async run(m, sock, args) {
      if (!ensureGroup(m)) return
      const g = groupCfg(m.chat)
      const sub = (args[0] || '').toLowerCase()

      // vote ya/tidak
      if (sub === 'ya' || sub === 'tidak') {
        if (!g.vote || g.vote.end < Date.now()) return m.reply('Tidak ada vote aktif. Mulai: *.votekick @user*')
        const arr = sub === 'ya' ? g.vote.yes : g.vote.no
        const other = sub === 'ya' ? g.vote.no : g.vote.yes
        if (arr.includes(m.sender) || other.includes(m.sender)) return m.reply('Kamu sudah vote.')
        arr.push(m.sender)
        db.save()
        const meta = await getMeta(sock, m.chat)
        const need = Math.max(3, Math.ceil((meta.participants || []).length / 4))
        await m.reply(`🗳️ Vote *${sub.toUpperCase()}* diterima (${g.vote.yes.length} ya / ${g.vote.no.length} tidak — butuh ${need} YA)`)
        if (g.vote.yes.length >= need) {
          const target = g.vote.target
          g.vote = null
          db.save()
          if (await ensureBotAdmin(sock, m)) {
            try {
              await sock.groupParticipantsUpdate(m.chat, [target], 'remove')
              return m.reply(`✅ Vote kick *disetujui* → @${target.split('@')[0].split(':')[0]} dikeluarkan.`, mention(target))
            } catch (_) { return m.reply('⚠️ Gagal kick (target admin/kick gagal).') }
          }
        }
        return
      }

      // start vote
      const t = targetOf(m)
      if (!t) return m.reply('⚠️ Contoh: `.votekick @user tawuran`\nLalu yang lain: `.votekick ya` / `.votekick tidak`')
      if (g.vote && g.vote.end > Date.now()) return m.reply('Masih ada vote berjalan. Vote: *.votekick ya/tidak*')
      const alasan = args.filter(a => !a.startsWith('@')).slice(1).join(' ') || 'tanpa alasan'
      g.vote = { target: t, reason: alasan, yes: [m.sender], no: [], end: Date.now() + 10 * 60000, creator: m.sender }
      db.save()
      const meta = await getMeta(sock, m.chat)
      const need = Math.max(3, Math.ceil((meta.participants || []).length / 4))
      m.reply(
        `🗳️ *VOTE KICK* @${t.split('@')[0].split(':')[0]}\nAlasan: ${alasan}\nButuh *${need}* vote YA (10 menit)\nVote: *.votekick ya* / *.votekick tidak*`,
        mention(t)
      )
    }
  },

  /* 30. PPGC */
  {
    name: 'ppgc', aliases: ['fotogrup'], category: 'group', access: 'user', prefixes: ['.'],
    desc: 'Lihat foto profil grup', usage: '.ppgc',
    async run(m, sock) {
      if (!ensureGroup(m)) return
      try {
        const url = await sock.profilePictureUrl(m.chat, 'image')
        const meta = await getMeta(sock, m.chat)
        await sock.sendMessage(m.chat, { image: { url }, caption: `🖼️ Foto grup *${meta.subject || ''}*` })
      } catch (e) {
        m.reply('⚠️ Foto grup tidak tersedia (privat/disetel admin).')
      }
    }
  }
]

module.exports = commands
module.exports.groupCfg = groupCfg
