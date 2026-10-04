/**
 * 💀 .hack — PRANK "KAMU TELAH DI-HACK" (v7.10.0) · lib/prankhtml.js
 *  .hack                          → prank default (password: maaf)
 *  .hack pesan | password         → pesan & password sendiri
 *  .hack pesan | password | petunjuk | pesan sukses
 *  Hanya kartu HTML di dalam chat — tidak ada yang benar-benar diretas.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { hackHtml } from '../lib/prankhtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix

export const hack = {
  command: ['hack', 'prankhack', 'hackprank', 'kenahack', 'lockprank'],
  category: 'Fun',
  description: '💀 Prank "kamu telah di-hack": terminal hacker + dialog JavaScript minta password untuk membuka — .hack pesan | password | petunjuk',
  limit: 1,
  cooldown: 5,
  contoh: 'kamuh terkenax hecks ☠️, apah katax-katax terahir mu😈 | maaf | 4 huruf',
  run: async m => {
    const bag = String(m.q || '').split('|').map(s => s.trim())
    const pesan = bag[0] || 'kamuh terkenax hecks ☠️, apah katax-katax terahir mu😈'
    const pass = bag[1] || 'maaf'
    const petunjuk = bag[2] || ''
    const sukses = bag[3] || ''
    const target = m.isGroup ? (m.pushName ? `HP ${truncate(m.pushName, 20)}` : 'perangkat ini') : 'perangkat ini'
    try { await m.react?.('💀') } catch {}
    const html = hackHtml(config.bot.name, { pesan, pass, petunjuk, sukses, target })
    try {
      await sendHtmlApp(m.sock, m.jid, { title: '⚠️ SYSTEM ALERT — JavaScript', html, trustedSources: ['hirara.dev'] })
    } catch (e) {
      return m.reply(`❌ Kartu prank gagal dikirim: ${truncate(e.message, 120)}`)
    }
    return m.reply(
      `💀 *PRANK HACK terkirim!*\n` +
      `🔑 Password: \`${pass}\`${petunjuk ? `\n💡 Petunjuk (muncul setelah 3x salah): ${petunjuk}` : ''}\n\n` +
      `Kustom: \`${P}hack pesan | password | petunjuk | pesan saat terbuka\`\n_Hanya prank — tidak ada yang diretas._`
    )
  }
}

export default { hack }
