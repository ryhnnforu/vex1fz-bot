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
  }
]

module.exports = commands
