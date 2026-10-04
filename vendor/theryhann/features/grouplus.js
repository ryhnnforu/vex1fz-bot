/**
 * 👥 GROUP PLUS — utilitas grup tambahan
 * Kategori "Group Menu".
 */
import { config } from '../config.js'
import { getGroup } from '../lib/database.js'


export const listAdmin = {
  command: ['listadmin', 'adminlist', 'daftadmin'],
  category: 'Group Menu',
  description: 'Daftar admin grup',
  group: true,
  limit: 0,
  run: async (m) => {
    const admins = (m.group?.participants || []).filter(p => p.admin)
    if (!admins.length) return m.reply('Tidak ada admin terdeteksi.')
    return m.reply(`🛡️ *ADMIN GRUP* (${admins.length})\n` + admins.map((p, i) => `${i + 1}. @${(p.id || '').split('@')[0]}${p.admin === 'superadmin' ? ' (owner)' : ''}`).join('\n'), { mentions: admins.map(p => p.id) })
  }
}

export const revokeLink = {
  command: ['revoke', 'resetlink', 'gantilink'],
  category: 'Group Menu',
  description: 'Reset link invite grup',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async (m) => {
    await m.sock.groupRevokeInvite(m.jid)
    const code = await m.sock.groupInviteCode(m.jid)
    return m.reply('✅ Link grup direset.\nLink baru: https://chat.whatsapp.com/' + code)
  }
}

export const kickMe = {
  command: ['kickme', 'keluarkanaku', 'out'],
  category: 'Group Menu',
  description: 'Keluarkan diri sendiri dari grup (serius!)',
  group: true,
  limit: 0,
  run: async (m) => {
    if (String(m.args[0] || '').toLowerCase() !== 'yes') {
      return m.reply(`⚠️ Yakin mau keluar dari grup ini?\nKetik \`${config.display.prefix}kickme yes\` untuk konfirmasi.`)
    }
    await m.sock.groupParticipantsUpdate(m.jid, [m.sender], 'remove')
    return m.reply('👋 Okay, sampai jumpa!')
  }
}

export const gcId = {
  command: ['gcid', 'idgrup', 'idgc'],
  category: 'Group Menu',
  description: 'Tampilkan JID grup ini',
  group: true,
  limit: 0,
  run: m => m.reply(`🆔 JID grup:\n\`${m.jid}\``)
}

export const totalMember = {
  command: ['totalmember', 'membercount', 'jumlahmember'],
  category: 'Group Menu',
  description: 'Jumlah member grup ini',
  group: true,
  limit: 0,
  run: m => {
    const g = getGroup(m.jid)
    const n = m.group?.participants?.length || g.members || 0
    return m.reply(`👥 Member grup *${m.groupName}*: *${n}* orang`)
  }
}
