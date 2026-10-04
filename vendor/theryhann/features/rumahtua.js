/**
 * 👁️ .rumahtua — RUMAH TUA DI UJUNG DESA (v7.14.0) · lib/horror.js
 *  Game horor HTML cerita penuh: 5 bab, 12 ruangan, benda & kunci, dialog
 *  pilihan, meter kewarasan, sosok "Ibu" pemburu, jumpscare, 3 akhir.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { horrorHtml } from '../lib/horror.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

export const rumahtua = {
  command: ['rumahtua', 'horror', 'horor', 'gamehoror', 'gamehorror', 'rumahhantu', 'hororcerita'],
  category: 'Games',
  description: '👁️ Rumah Tua di Ujung Desa — game horor HTML cerita penuh: 5 bab, 12 ruangan, senter & baterai, catatan, sosok Ibu pemburu, jumpscare, 3 akhir',
  limit: 1,
  cooldown: 5,
  run: async m => {
    const html = horrorHtml(config.bot.name)
    try {
      const r = await kirimGameHtml(m, { title: '👁️ RUMAH TUA — HOROR CERITA', html, game: 'rumahtua' }).catch(e => ({ ok: false, error: e }))
      if (!r?.ok) await sendHtmlApp(m.sock, m.jid, { title: '👁️ RUMAH TUA — HOROR CERITA', html })
    } catch (e) { return m.reply(`❌ Gagal memuat game: ${truncate(String(e.message || e), 120)}`) }
    return m.reply('👁️ *RUMAH TUA DI UJUNG DESA*\n\nPakai headset. Motormu mogok di depan rumah yang menyanyi…\n\n✚ jalan · ◆ INTERAKSI (benda/pintu/pilihan) · 🔦 senter (baterai) · 🎒 tas\n\n📜 Baca 5 catatan untuk tahu NAMA ASLI-nya. Garam menolak, pisau menunda. Lilin + garam + nama = akhir sejati. 3 akhir berbeda!')
  }
}
export default { rumahtua }
