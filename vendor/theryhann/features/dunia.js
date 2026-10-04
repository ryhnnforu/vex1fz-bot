/**
 * features/dunia.js — DUNIA VOXEL (game web jangka panjang) v7.23.0
 *  .dunia [slot 1-3]  → kartu DETAIL + tombol ▶ Mainkan Sekarang (game web WebGL, save otomatis)
 *  .dunia list        → ringkasan 3 slot dunia milikmu
 *  .dunia hapus <slot>
 */
import { config } from '../config.js'
import { baseUrl, webAktif } from '../lib/webgame.js'
import { buatTokenDunia, ringkasDunia, hapusDunia, setOnQuest } from '../lib/webdunia.js'
import { sendInteractive, sendButtons } from '../lib/interactive.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'THERYHANN!'

setOnQuest(async ({ info, quest, p }) => {
  const sock = globalThis.__sockAktif || global.sock; if (!sock || !quest) return
  const tag = String(info.user).split('@')[0]
  try { await sock.sendMessage(info.jid, { text: `🏗️ *DUNIA VOXEL* — @${tag} menyelesaikan quest *${quest.no}/12: ${quest.t}* (Level ${p?.lv || 1}) 🎉${quest.no >= 12 ? '\n🏆 SEMUA QUEST TAMAT! Raja Bandit tumbang.' : ''}`, mentions: [info.user] }) } catch {}
})

export const dunia = {
  command: ['dunia', 'voxel', 'duniavoxel', 'minecraftweb', 'craftworld', 'survival'],
  category: 'Games',
  description: '🧱 Dunia Voxel — game web 3D jangka panjang: bangun dunia, craft, 12 quest, NPC bicara/barter/duel, zombie malam; dunia tersimpan di bot (3 slot). .dunia [1-3] | list | hapus <slot>',
  limit: 0, cooldown: 3, contoh: '1',
  run: async m => {
    const user = m.senderKey || m.sender
    const a = (m.args[0] || '').toLowerCase()
    if (a === 'list' || a === 'slot') {
      const r = ringkasDunia(user)
      return m.reply(`🧱 *DUNIA VOXEL — slot milikmu*\n\n` + r.map(x => x.kosong ? `${x.slot}. (kosong) → \`${P}dunia ${x.slot}\`` : `${x.slot}. *${x.nama}* — Lv ${x.level} · Hari ${x.hari} · Quest ${x.quest}/12 · ${x.blok} balok · ${x.main} menit\n   terakhir: ${new Date(x.t + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} WIB`).join('\n') + `\n\nHapus: \`${P}dunia hapus <slot>\``)
    }
    if (a === 'hapus' || a === 'reset') {
      const s = +m.args[1]; if (![1, 2, 3].includes(s)) return m.reply(`Contoh: \`${P}dunia hapus 2\``)
      return m.reply(hapusDunia(user, s) ? `🗑️ Dunia slot ${s} dihapus.` : 'Slot itu kosong.')
    }
    const slot = [1, 2, 3].includes(+a) ? +a : 1
    if (!webAktif()) return m.reply(`⚠️ Game web butuh server publik (Railway). Owner: \`${P}setwebgame url https://domain-bot\``)
    const tok = buatTokenDunia({ user, jid: m.jid, nama: m.pushName || 'Pemain', slot })
    const url = `${baseUrl()}/w/${tok}`
    const r = ringkasDunia(user).find(x => x.slot === slot)
    const text = `*Dunia Voxel*\n\n🎮 *DETAIL MINIGAME*\n\n• *Judul:* Dunia Voxel — Slot ${slot}${r && !r.kosong ? ` (${r.nama})` : ' (dunia baru)'}\n• *Kategori:* SURVIVAL · CRAFT · 3D OPEN WORLD\n• *Author:* ${config.owner?.name || brand()}\n• *Credits:* -\n• *Deskripsi:* Dunia voxel 3D tanpa batas: gali & bangun, craft alat, siklus siang-malam, zombie & creeper, desa dengan NPC yang bisa diajak bicara, barter, dan duel (bandit & Raja Bandit), 12 quest berantai. Progres, bangunan, inventori & quest *tersimpan otomatis di bot* — main berhari-hari.\n• *Progres:* ${r && !r.kosong ? `Lv ${r.level} · Hari ${r.hari} · Quest ${r.quest}/12 · ${r.blok} balok · ${r.main} menit` : 'belum ada — mulai petualangan!'}\n\n_Link pribadi @${String(m.sender).split('@')[0]} · 7 hari · 3 slot dunia: \`${P}dunia 1/2/3\`_`
    try {
      await sendInteractive(m.sock, m.jid, { title: `🧱 Dunia Voxel`, body: text, footer: brand(), url: [{ text: '▶ Mainkan Sekarang', url }], contextInfo: { mentionedJid: [m.sender] } })
    } catch { await m.reply(text + `\n\n▶ *Mainkan Sekarang:* ${url}`) }
    return { handled: true }
  }
}
export default { dunia }
