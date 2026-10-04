/**
 * 📋 INFO & UTAMA — rules, donasi, list fitur, allmenu, request fitur
 */
import { config } from '../config.js'
import { sendAllMenu } from '../handlers/message.js'
import { listPlugins } from '../lib/plugins.js'

export default {
  command: ['rules', 'aturan', 'tos'],
  category: 'Main Menu',
  description: 'Aturan pemakaian bot',
  limit: 0,
  run: async (m) => {
    const text = `*📜 RULES — ${config.bot.name}*

1️⃣ Jangan spam command (ada cooldown ${config.limits.cooldown}s).
2️⃣ Jangan telepon bot — otomatis ditolak.
3️⃣ Dilarang pakai bot untuk hal ilegal, SARA, judi, atau hoax.
4️⃣ Dilarang menjual ulang script tanpa izin owner.
5️⃣ Bot kadang lambat/error saat API publik down — coba lagi nanti.
6️⃣ Jangan kirim data pribadi ke AI chat.
7️⃣ Limit habis? Ketik \`${config.display.prefix}claim\` (1x/24 jam).

Melanggar = *BANNED* 🚫`
    return m.sendButtons({
      title: '📜 Rules ' + config.bot.name,
      text,
      buttons: [
        { text: '✅ Setuju', id: '.menu' },
        { text: '👑 Owner', id: '.owner' }
      ]
    }).catch(() => m.reply(text))
  }
}

export const donate = {
  command: ['donate', 'donasi', 'sewa', 'premium'],
  category: 'Main Menu',
  description: 'Donasi / sewa bot / premium',
  limit: 0,
  run: async (m) => {
    return m.sendInteractive({
      title: '💖 Support ' + config.bot.name,
      body: `Bot ini *GRATIS* dipakai siapa saja 🙌\n\n*📦 Harga (bisa nego)*\n▸ Premium User : Rp 5.000 / bulan (limit unlimited)\n▸ Sewa Bot Grup: Rp 15.000 / bulan\n▸ Jadi Owner Bot: Rp 25.000 / permanen\n\n*💳 Pembayaran*\nDANA / OVO / GoPay / QRIS — chat owner ya.\n\nTerima kasih sudah support pengembangan bot ini 💜`,
      footer: config.bot.footer,
      buttons: [{ text: '📱 QRIS (scan)', id: '.qris' }, { text: '👑 Chat Owner', id: '.owner' }],
      url: [{ text: '💳 Link Donasi', url: config.links.donasi }]
    }).catch(() => m.reply(`💖 Donasi / sewa bot: chat owner wa.me/${config.owner.number}`))
  }
}

export const allMenu = {
  command: ['allmenu', 'menuall', 'listmenu', 'fitur', 'commands'],
  category: 'Main Menu',
  description: 'Tampilkan semua fitur bot',
  limit: 0,
  run: async (m) => sendAllMenu(m)
}

export const listCmd = {
  command: ['listcmd', 'cmdlist'],
  category: 'Main Menu',
  description: 'Daftar perintah per kategori (teks)',
  limit: 0,
  run: async (m) => {
    const cat = m.q
    const p = config.display.prefix
    const all = listPlugins()
    if (cat) {
      const list = all.filter(x => x.category.toLowerCase() === cat.toLowerCase())
      if (!list.length) return m.reply(`Kategori *${cat}* tidak ditemukan.`)
      return m.reply(`*${cat.toUpperCase()}*\n\n` + list.map(c => `▸ \`${p}${c.command[0]}\` — ${c.description || '-'}`).join('\n'))
    }
    const groups = {}
    for (const c of all) (groups[c.category] ||= []).push(c)
    let text = `*📋 DAFTAR PERINTAH (${all.length})*\n\n`
    for (const [k, v] of Object.entries(groups)) {
      text += `*${k}*\n${v.map(c => `▸ \`${p}${c.command[0]}\``).join('\n')}\n\n`
    }
    return m.reply(text)
  }
}
