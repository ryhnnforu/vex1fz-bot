/**
 * commands/profile.js — profile & leaderboard (prefix ".")
 */
const db = require('../lib/db')
const config = require('../config')
const { box, boxLines } = require('../lib/menu')
const { fmt, jakartaDate } = require('../lib/util')

const commands = [
  {
    name: 'daftar',
    aliases: ['register', 'signup'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Daftar / registrasi user',
    usage: '.daftar <nama>',
    async run(m, sock, args) {
      const u = db.getUser(m.sender)
      if (u.registered) return m.reply('Kamu sudah terdaftar ✅ (*.profile* untuk lihat)')
      const nama = args.join(' ').slice(0, 25) || m.pushName || 'User'
      u.name = nama
      u.registered = true
      u.joinedAt = Date.now()
      db.save()
      m.reply(
        box('PENDAFTARAN SUKSES', [
          ['nama', u.name],
          ['nomor', m.chat.split('@')[0]],
          ['tanggal', jakartaDate()],
          ['akses', m.isOwner ? 'OWNER' : 'USER']
        ]) + `\n\nLangkah berikutnya:\n1. *.rpgdaftar <nama>* → buat karakter\n2. *.menurpg* → lihat semua game RPG`
      )
    }
  },
  {
    name: 'profile',
    aliases: ['profil', 'me'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kartu profil kamu',
    usage: '.profile',
    async run(m) {
      const u = db.getUser(m.sender)
      const r = db.getRpg(m.chat)
      m.reply(
        [
          `${box('INFO USER', [
            ['nama', u.name || m.pushName || '-'],
            ['nomor', m.chat.split('@')[0]],
            ['akses', m.isOwner ? 'OWNER' : 'USER'],
            ['limit', m.isOwner ? 'UNLIMITED' : `${u.limit}/${config.dailyLimit}`],
            ['daftar', u.registered ? 'SUDAH' : 'BELUM'],
            ['gabung', u.joinedAt ? new Date(u.joinedAt).toLocaleDateString('id-ID') : '-']
          ])}`,
          '',
          r
            ? box('RPG SINGKAT', [
                ['karakter', r.name],
                ['level', String(r.level)],
                ['hp', `${r.hp}/${r.maxHp}`],
                ['gold', fmt(r.gold)]
              ])
            : boxLines('RPG', ['│ Belum punya karakter', '│ Ketik *.rpgdaftar <nama>*'])
        ].join('\n')
      )
    }
  },
  {
    name: 'leaderboard',
    aliases: ['lb', 'peringkat'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Papan peringkat pemain',
    usage: '.leaderboard',
    async run(m) {
      const rpg = db.load().rpg
      const rows = Object.entries(rpg)
        .filter(([, r]) => r)
        .map(([jid, r]) => ({ jid, ...r }))
        .sort((a, b) => b.level - a.level || b.exp - a.exp || b.gold - a.gold)
        .slice(0, 10)
      if (!rows.length) return m.reply('Belum ada pemain. Jadilah yang pertama: *.rpgdaftar <nama>*')
      const medals = ['🥇', '🥈', '🥉']
      m.reply(
        boxLines('LEADERBOARD', rows.map((r, i) =>
          `│ ${medals[i] || (i + 1) + '.'} ${r.name.slice(0, 14).padEnd(14)} Lv.${r.level} 🪙${fmt(r.gold)}`
        ))
      )
    }
  },

  /* ═══════════ 17 FITUR BARU ═══════════ */

  /* 4. SETNAME */
  {
    name: 'setname',
    aliases: ['gantinama', 'setprofil'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ganti nama profil kamu',
    usage: '.setname Arya',
    async run(m, sock, args) {
      const nama = args.join(' ').trim().slice(0, 25)
      if (!nama) return m.reply('Tulis namanya.\nContoh: *.setname Arya Putra*')
      const u = db.getUser(m.sender)
      const lama = u.name
      u.name = nama
      u.registered = true
      if (!u.joinedAt) u.joinedAt = Date.now()
      db.save()
      m.reply(`✅ Nama profil: *${lama || '-'}* → *${nama}*`)
    }
  },

  /* 5. SETTTL */
  {
    name: 'setttl',
    aliases: ['lahir', 'tanggallahir'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Simpan tanggal lahir (DD-MM-YYYY) untuk fitur umur',
    usage: '.setttl 17-08-2005',
    async run(m, sock, args) {
      const t = (args[0] || '').match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
      if (!t) return m.reply('Format: *.setttl 17-08-2005* (DD-MM-YYYY)')
      const [, dd, mm, yyyy] = t
      const d = new Date(`${yyyy}-${mm}-${dd}`)
      if (isNaN(d.getTime())) return m.reply('Tanggal tidak valid.')
      const u = db.getUser(m.sender)
      u.ttl = `${dd.padStart(2, '0')}-${mm.padStart(2, '0')}-${yyyy}`
      db.save()
      m.reply(`✅ Tanggal lahir tersimpan: *${u.ttl}*\nCek: *.umur* / *.ultah*`)
    }
  },

  /* 6. INTRO */
  {
    name: 'intro',
    aliases: ['bio', 'tentang'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Simpan bio/singkatan intro diri (maks 100 huruf)',
    usage: '.intro anak gasik anti ribet',
    async run(m, sock, args) {
      const t = args.join(' ').trim().slice(0, 100)
      if (!t) {
        const u = db.getUser(m.sender)
        return m.reply(u.intro ? `Bio kamu:\n"${u.intro}"\n\nGanti: *.intro teks baru*` : 'Belum ada bio.\nContoh: *.intro anak gasik anti ribet*')
      }
      const u = db.getUser(m.sender)
      u.intro = t
      db.save()
      m.reply(`✅ Bio tersimpan:\n"${t}"`)
    }
  },

  /* 7. UMUR */
  {
    name: 'umur',
    aliases: ['age'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Hitung umurmu dari tanggal lahir',
    usage: '.umur',
    async run(m) {
      const u = db.getUser(m.sender)
      if (!u.ttl) return m.reply('Set tanggal lahir dulu: *.setttl 17-08-2005*')
      const [dd, mm, yyyy] = u.ttl.split('-').map(Number)
      const lahir = new Date(yyyy, mm - 1, dd)
      const now = new Date()
      let tahun = now.getFullYear() - lahir.getFullYear()
      let bulan = now.getMonth() - lahir.getMonth()
      let hari = now.getDate() - lahir.getDate()
      if (hari < 0) { bulan--; hari += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
      if (bulan < 0) { tahun--; bulan += 12 }
      m.reply(
        box('UMUR', [
          ['nama', u.name || m.pushName || '-'],
          ['lahir', u.ttl],
          ['umur', `${tahun} tahun ${bulan} bulan ${hari} hari`]
        ])
      )
    }
  },

  /* 8. ULTAH */
  {
    name: 'ultah',
    aliases: ['ultahku', 'hitungultah'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Hitung mundur hari jadi kamu',
    usage: '.ultah',
    async run(m) {
      const u = db.getUser(m.sender)
      if (!u.ttl) return m.reply('Set tanggal lahir dulu: *.setttl 17-08-2005*')
      const [dd, mm] = u.ttl.split('-').map(Number)
      const now = new Date()
      let next = new Date(now.getFullYear(), mm - 1, dd)
      if (next < now) next = new Date(now.getFullYear() + 1, mm - 1, dd)
      const sisa = Math.ceil((next - now) / 86_400_000)
      const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      m.reply(
        box('HITUNG MUNDUR ULTAH', [
          ['lahir', u.ttl],
          ['ultah ke', String(next.getFullYear() - Number(u.ttl.split('-')[2]))],
          ['tanggal', `${next.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} (${hari[next.getDay()]})`],
          ['sisa', sisa === 0 ? 'HARI INI! 🎉' : `${sisa} hari lagi`]
        ])
      )
    }
  },

  /* 9. KARTU PROFIL */
  {
    name: 'kartu',
    aliases: ['kartuprofil', 'idcard'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kartu profil estetik (gambar) dengan nama & status',
    usage: '.kartu',
    async run(m, sock) {
      const img = require('../lib/img')
      const u = db.getUser(m.sender)
      const r = db.getRpg(m.chat)
      await m.react('🪪')
      const png = await img.profileCard({
        name: u.name || m.pushName || 'User',
        num: m.sender.split('@')[0],
        status: u.intro || '',
        level: r ? `RPG Lv.${r.level}` : (m.isOwner ? 'OWNER bot ini' : 'Member vex1fz'),
        limit: m.isOwner ? 'UNLIMITED' : `${u.limit ?? config.dailyLimit}/${config.dailyLimit}`
      })
      await sock.sendMessage(m.chat, { image: png, caption: 'Kartu profil kamu • vex1fz bye ryhn' }, { quoted: m.raw })
      await m.react('✅')
    }
  },

  /* 10. SHIP */
  {
    name: 'ship',
    aliases: ['shipping', 'cocokan'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Cocok-cocokan2 orang (tingkat kecocokan %)',
    usage: '.ship @user1 @user2',
    async run(m) {
      const targets = m.mentions || []
      if (targets.length < 2) return m.reply('Tag *2 orang* ya.\nContoh: *.ship @a @b*')
      const a = targets[0].split('@')[0]
      const b = targets[1].split('@')[0]
      let h = 0
      for (const c of a + b) h = (h * 31 + c.charCodeAt(0)) % 101
      const pct = h
      const verdict = pct >= 90 ? '💞 JODOH SEJATI!' : pct >= 70 ? '😍 Cocok banget!' : pct >= 50 ? '🤔 Lumayan lah' : pct >= 30 ? '😬 Waduh...' : '💀 Tidak cocok blas'
      m.reply(
        boxLines('SHIP', [
          `│ 💑 @${a} × @${b}`,
          ``,
          `│ KECOCOKAN: ${pct}% ${pct >= 70 ? '💖' : '💔'}`,
          `│ ${verdict}`
        ]),
        { mentions: targets }
      )
    }
  },

  /* PROFILE BATCH 2 */

  /* 11. AFK */
  {
    name: 'afk',
    aliases: ['away'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Aktifkan AFK — bot bilang ke yang nge-tag kamu (auto-off saat kamu balik chat)',
    usage: '.afk makan dulu | .afk (tanpa alasan)',
    async run(m, sock, args) {
      const st = db.load().settings
      if (!st.afk) st.afk = {}
      const alasan = args.join(' ').slice(0, 80)
      st.afk[m.sender] = { reason: alasan, since: Date.now() }
      db.save()
      m.reply(`🌙 Mode AFK *AKTIF*${alasan ? ` — "${alasan}"` : ''}\nSiapa pun yang nge-tag kamu, bot bakal bilang kamu AFK.\nKetik chat biasa untuk nonaktif otomatis.`)
    }
  },

  /* 12. CEKAFK */
  {
    name: 'cekafk',
    aliases: ['listafk'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Siapa saja yang sedang AFK',
    usage: '.cekafk',
    async run(m) {
      const st = db.load().settings
      const rows = Object.entries(st.afk || {})
      if (!rows.length) return m.reply('Tidak ada yang AFK saat ini 👌')
      const lines = rows.map(([j, a], i) => {
        const menit = Math.round((Date.now() - (a.since || Date.now())) / 60000)
        return `│ ${i + 1}. @${j.split('@')[0]} — ${menit}m${a.reason ? ` ("${a.reason}")` : ''}`
      })
      m.reply(boxLines('DAFTAR AFK', lines), { mentions: rows.map(([j]) => j) })
    }
  },

  /* 13. LIMIT */
  {
    name: 'limit',
    aliases: ['ceklimit', 'sisa'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Cek sisa limit harian kamu',
    usage: '.limit',
    async run(m) {
      const u = db.getUser(m.sender)
      db.resetLimitIfNeeded(u)
      if (m.isOwner) return m.reply('👑 Owner = *UNLIMITED*.')
      m.reply(
        box('LIMIT HARIAN', [
          ['sisa', `${u.limit ?? config.dailyLimit}/${config.dailyLimit}`],
          ['reset', 'setiap jam 00:00 (timezone server)'],
          ['tips', 'limit habis → pakai lagi besok']
        ])
      )
    }
  },

  /* 14. LEVEL */
  {
    name: 'level',
    aliases: ['ceklevel', 'xp'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Level & XP aktivitasmu di bot',
    usage: '.level',
    async run(m) {
      const u = db.getUser(m.sender)
      const cmds = u.stats?.cmds || 0
      const lvl = Math.floor(Math.sqrt(cmds / 5)) + 1
      const cur = Math.pow(lvl - 1, 2) * 5
      const next = Math.pow(lvl, 2) * 5
      const prog = cmds - cur
      const need = next - cur
      const bar = '█'.repeat(Math.round((prog / need) * 8)).padEnd(8, '░')
      m.reply(
        boxLines('LEVEL AKTIVITAS', [
          `│ *NAMA*  : ${u.name || m.pushName || '-'}`,
          `│ *LEVEL* : ${lvl}  [${bar}]`,
          `│ *XP*    : ${prog}/${need} perintah`,
          `│ *TOTAL* : ${cmds} perintah dijalankan`,
          ``,
          `│ Naik level = makin sering pakai bot 📈`
        ])
      )
    }
  },

  /* 15. MEDALI */
  {
    name: 'medali',
    aliases: ['badge', 'achievement'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Medali pencapaian kamu',
    usage: '.medali',
    async run(m) {
      const u = db.getUser(m.sender)
      const d = db.load()
      const r = db.getRpg(m.chat)
      const cmds = u.stats?.cmds || 0
      const meds = [
        [u.registered, '🪪 Langganan', 'Sudah daftar'],
        [cmds >= 1, '👣 Langkah Pertama', 'Pakai 1 perintah'],
        [cmds >= 50, '🔥 Rajin', '50+ perintah'],
        [cmds >= 200, '⚡ Maniak Bot', '200+ perintah'],
        [!!r, '⚔️ Petualang', 'Buat karakter RPG'],
        [(r?.level || 0) >= 5, '🏆 Level 5 RPG', 'RPG level ≥ 5'],
        [(r?.gold || 0) >= 1000, '💰 Konglomerat', '1000+ gold'],
        [!!u.ttl, '🎂 Kenal Ultah', 'Set tanggal lahir'],
        [!!u.intro, '📜 Punya Bio', 'Set intro'],
        [Object.keys(d.aiRel || {}).length > 0, '🤖 Sahabat AI', 'Pernah chat AI']
      ]
      const owned = meds.filter(x => x[0])
      m.reply(
        boxLines(`MEDALI — ${owned.length}/${meds.length}`, [
          ...meds.map(([ok, n, desc]) => `│ ${ok ? '🟡' : '⚪'} ${n} — ${desc}`),
          ``,
          `│ ${owned.length === meds.length ? 'SEMUA MEDALI DAPAT! 🏅' : 'Lengkapi semuanya!'}`
        ])
      )
    }
  },

  /* 16. STATISTIK */
  {
    name: 'statistik',
    aliases: ['stats', 'stat'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Statistik pemakaian bot olehmu',
    usage: '.statistik',
    async run(m) {
      const u = db.getUser(m.sender)
      const cmds = u.stats?.cmds || 0
      const first = u.stats?.firstAt || u.joinedAt
      const hari = first ? Math.max(1, Math.ceil((Date.now() - first) / 86_400_000)) : 0
      m.reply(
        box('STATISTIK KAMU', [
          ['nama', u.name || m.pushName || '-'],
          ['perintah', `${cmds} kali`],
          ['rata2', hari ? `${(cmds / hari).toFixed(1)}/hari` : '-'],
          ['aktif sejak', first ? new Date(first).toLocaleDateString('id-ID') : '-'],
          ['limit sisa', m.isOwner ? 'UNLIMITED' : `${u.limit ?? config.dailyLimit}/${config.dailyLimit}`]
        ])
      )
    }
  },

  /* 17. UNREGISTER */
  {
    name: 'unregister',
    aliases: ['bataldaftar'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Hapus pendaftaran profilmu (data RPG tetap ada)',
    usage: '.unregister',
    async run(m) {
      const u = db.getUser(m.sender)
      if (!u.registered) return m.reply('Kamu belum terdaftar.')
      u.registered = false
      u.name = null
      db.save()
      m.reply('🗑️ Pendaftaran dihapus. Daftar lagi: *.daftar <nama>*')
    }
  },

  /* 18. MYID */
  {
    name: 'myid',
    aliases: ['iduser', 'cekid'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Lihat ID/JID WhatsApp milikmu',
    usage: '.myid',
    async run(m) {
      m.reply(
        box('ID KAMU', [
          ['jid', m.sender],
          ['chat', m.chat],
          ['nomor', m.sender.split('@')[0]],
          ['grup', m.isGroup ? 'YA' : 'tidak']
        ]) + `\n\nSalin ID untuk keperluan admin (*,ban @user* dll).`
      )
    }
  },

  /* 19. SAPA */
  {
    name: 'sapa',
    aliases: ['nickname', 'panggilan'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Set sapaan akrab untuk status AFK & sapaan bot',
    usage: '.sapa Ary',
    async run(m, sock, args) {
      const u = db.getUser(m.sender)
      if (!args.length) return m.reply(u.sapa ? `Sapaan kamu: *${u.sapa}*\nGanti: *.sapa Ary*` : 'Belum ada sapaan.\nContoh: *.sapa Ary*')
      u.sapa = args.join(' ').slice(0, 20)
      db.save()
      m.reply(`✅ Sapaan diatur: *${u.sapa}*`)
    }
  },

  /* 20. CEKGENDER */
  {
    name: 'cekgender',
    aliases: ['gender', 'genderkamu'],
    category: 'profile',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tebak gender dari nama (iseng, 100% ngawur serius)',
    usage: '.cekgender',
    async run(m) {
      const nama = (db.getUser(m.sender).name || m.pushName || '').trim()
      if (!nama) return m.reply('Set nama dulu: *.setname nama*')
      const ends = nama.toLowerCase().slice(-1)
      const fem = ['a', 'i', 'y', 'e'].includes(ends)
      const r = Math.random()
      const gender = r < 0.1 ? '🚁 HELIKOPTER' : fem ? '♀️ WANITA (kemungkinan besar)' : '♂️ PRIA (kemungkinan besar)'
      const conf = Math.round(55 + Math.random() * 44)
      m.reply(
        boxLines('HASIL CEK GENDER 🕵️', [
          `│ *NAMA*  : ${nama}`,
          `│ *HASIL* : ${gender}`,
          `│ *YAKIN* : ${conf}%`,
          ``,
          `│ ⚠️ Ini murni iseng ya...`,
          `│ Nama lebih dari nama.`
        ])
      )
    }
  }
]

module.exports = commands
