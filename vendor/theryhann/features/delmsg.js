/**
 * features/delmsg.js — 🗑️ HAPUS PESAN
 * ------------------------------------------------------------------
 *  • .del   — balas pesan → hapus untuk semua orang (ada jejak "telah dihapus").
 *             Grup: pesan MEMBER butuh pemakai admin + bot admin;
 *             pesan BOT SENDIRI bisa dihapus siapa saja (tanpa perlu admin).
 *             Chat pribadi: hanya bisa hapus pesan bot sendiri.
 *  • .dmsg  — pesan sementara: LENYAP TOTAL TANPA BEKAS ⏳
 *             `.dmsg on|24jam|7hari|90hari|off` — tanpa argumen = lihat status.
 *             Grup: khusus admin + bot harus admin.
 */
import { config } from '../config.js'

const P = config.display.prefix

const DUR = {
  on: 86400, '24': 86400, '24jam': 86400, '1hari': 86400, sehari: 86400,
  '7': 604800, '7hari': 604800, seminggu: 604800, '1minggu': 604800,
  '90': 7776000, '90hari': 7776000, '3bulan': 7776000,
  off: 0, mati: 0, matikan: 0, nonaktif: 0
}
const NAMA_DUR = { 0: 'mati', 86400: '24 jam', 604800: '7 hari', 7776000: '90 hari' }
const namaDur = d => NAMA_DUR[d] || (d ? `${d} detik` : 'mati')

const BANTUAN_DMSG =
  `⏳ *PESAN MENGHILANG (TANPA BEKAS)*\n\n` +
  `• \`${P}dmsg on\` — nyalakan (24 jam)\n` +
  `• \`${P}dmsg 24jam\` — lenyap setelah 24 jam\n` +
  `• \`${P}dmsg 7hari\` — lenyap setelah 7 hari\n` +
  `• \`${P}dmsg 90hari\` — lenyap setelah 90 hari\n` +
  `• \`${P}dmsg off\` — matikan\n` +
  `• \`${P}dmsg\` — lihat status\n\n` +
  `_Berbeda dengan ${P}del (menyisakan tulisan "telah dihapus"), pesan sementara LENYAP TOTAL tanpa bekas setelah timer habis — berlaku untuk pesan BARU sesudah dinyalakan._`

/* ================================================================== */
/*  .del — hapus pesan (balas pesan target)                             */
/* ================================================================== */
export const del = {
  command: ['del', 'delete', 'hapus', 'hapuspesan', 'deletemsg'],
  category: 'Group Menu',
  description: `🗑️ Hapus pesan (balas pesan target) — ada jejak "telah dihapus". Pesan bot bisa dihapus siapa saja; pesan member khusus admin`,
  limit: 0,
  cooldown: 3,
  run: async m => {
    const q = m.quoted
    if (!q?.key?.id) {
      return m.reply(
        `🗑️ *HAPUS PESAN*\n\nBalas pesan yang mau dihapus, lalu ketik \`${P}del\`.\n\n` +
        `• Pesan *bot sendiri* → bisa dihapus siapa saja (tak perlu admin)\n` +
        `• Pesan *member lain* → khusus admin + bot harus admin\n` +
        `• Hasilnya ada jejak _"pesan ini telah dihapus"_\n\n` +
        `Mau yang lenyap TANPA bekas? pakai \`${P}dmsg on\` (pesan sementara ⏳)`
      )
    }
    const dariBot = !!q.key.fromMe
    if (!m.isGroup && !dariBot) {
      return m.reply('❌ Di chat pribadi bot hanya bisa menghapus pesannya sendiri (WhatsApp tidak mengizinkan bot menghapus pesan orang lain untuk semua orang).')
    }
    if (m.isGroup && !dariBot) {
      if (!m.isAdmin) return m.reply(`❌ Khusus admin grup. (Pesan bot sendiri boleh dihapus siapa saja — balas pesan bot + \`${P}del\`)`)
      if (!m.isBotAdmin) return m.reply('❌ Bot harus jadi admin dulu supaya bisa menghapus pesan member.')
    }
    const qk = q.key || {}
    const kunci = {
      remoteJid: m.jid,
      id: qk.id,
      participant: qk.participant || (dariBot ? m.user : q.sender),
      fromMe: dariBot
    }
    try {
      await m.sock.sendMessage(m.jid, { delete: kunci })
      return m.reply('🗑️ Pesan dihapus.')
    } catch (e) {
      const sebab = String(e?.message || e)
      if (/not.*admin|admin/i.test(sebab)) return m.reply('❌ Gagal: bot bukan admin (jadikan admin dulu).')
      if (/too old|expired|time/i.test(sebab)) return m.reply('❌ Gagal: pesan sudah terlalu lama, WhatsApp menolak menghapusnya.')
      return m.reply(`❌ Gagal menghapus pesan: ${sebab.slice(0, 120)}`)
    }
  }
}

/* ================================================================== */
/*  .dmsg — pesan sementara (lenyap tanpa bekas)                        */
/* ================================================================== */
export const dmsg = {
  command: ['dmsg', 'pesansementara', 'menghilang', 'lenyap', 'ephemeral', 'disappearing'],
  category: 'Group Menu',
  description: '⏳ Pesan sementara: pesan LENYAP TOTAL tanpa bekas (`on/24jam/7hari/90hari/off`)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const arg = String(m.args[0] || '').toLowerCase().trim()
    if (!arg) {
      const cur = m.isGroup ? m.group?.ephemeralDuration : undefined
      const status = cur === undefined
        ? 'tidak diketahui'
        : (+cur > 0 ? `NYALA (${namaDur(+cur)})` : 'MATI')
      return m.reply(`⏳ *STATUS PESAN MENGHILANG*\n\nStatus chat ini: *${status}*\n\n` + BANTUAN_DMSG)
    }
    if (!(arg in DUR)) return m.reply(`❌ Pilihan tidak dikenal: *${arg}*\n\n` + BANTUAN_DMSG)
    if (m.isGroup) {
      if (!m.isAdmin) return m.reply('❌ Khusus admin grup.')
      if (!m.isBotAdmin) return m.reply('❌ Bot harus jadi admin dulu supaya bisa mengubah pengaturan ini.')
    }
    const dur = DUR[arg]
    try {
      await m.sock.sendMessage(m.jid, { disappearingMessagesInChat: dur })
      return m.reply(
        dur > 0
          ? `⏳ *PESAN MENGHILANG: NYALA (${namaDur(dur).toUpperCase()})*\n\nPesan BARU di chat ini akan LENYAP TOTAL tanpa bekas setelah ${namaDur(dur)}.\nMatikan: \`${P}dmsg off\``
          : `⏳ *PESAN MENGHILANG: MATI*\n\nPesan baru tidak akan lenyap lagi.\nNyalakan: \`${P}dmsg on\``
      )
    } catch (e) {
      return m.reply(`❌ Gagal mengubah pengaturan: ${String(e?.message || e).slice(0, 150)}`)
    }
  }
}

export default { del, dmsg }
