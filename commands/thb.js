/**
 * commands/thb.js — akses engine THERYHANN (vendor/theryhann)
 *   .thbmenu  → menu utama THERYHANN (1655+ perintah, tombol interaktif mereka)
 *   .thb      → ringkasan engine + kategori
 */
const thb = require('../lib/thbbridge')

const commands = [
  {
    name: 'thbmenu',
    aliases: ['thb', 'theryhann', 'menutheryhann'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu THERYHANN engine (1655+ perintah: games, RPG, AI, tools…)',
    usage: '.thbmenu',
    async run (m, sock) {
      if (!thb.ready()) {
        return m.reply('⚠️ Engine THERYHANN belum aktif di bot ini.\n(Pasang folder `vendor/theryhann` lalu restart bot.)')
      }
      const ok = await thb.pumpSynthetic(sock, m.chat, '.menu', {
        sender: m.sender,
        pushName: m.pushName || '',
        isGroup: !!m.isGroup
      })
      if (!ok) m.reply('⚠️ Menu THB gagal dikirim. Coba lagi sebentar.')
    }
  },
  {
    name: 'thbinfo',
    aliases: ['thbstatus'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Status engine THERYHANN + daftar kategori',
    usage: '.thbinfo',
    run (m) {
      if (!thb.ready()) return m.reply('❌ Engine THERYHANN nonaktif.')
      const rows = thb.menuSummary()
        .slice(0, 12)
        .map(([c, n]) => `│ ${c} — *${n}*`)
      m.reply([
        '🕹️ *THERYHANN ENGINE*',
        `│ Perintah : *${thb.count()}*`,
        `│ Vendor   : vendor/theryhann (v7.37.1)`,
        `│ Library  : @japofc/baileys (via shim)`,
        '',
        ...rows,
        '',
        'Buka menu: *.thbmenu*'
      ].join('\n'))
    }
  }
]

module.exports = commands
