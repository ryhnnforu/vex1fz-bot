/**
 * 👤 USER PLUS — utilitas akun/user tambahan
 * Kategori "User Menu".
 */
import { config } from '../config.js'
import { getUser } from '../lib/database.js'
import { getRPG } from '../lib/rpg.js'

export const setName = {
  command: ['gantinama', 'namaku', 'ubahnama'],
  category: 'User Menu',
  description: 'Simpan nama kamu di database bot (ganti nama grup: .setname)',
  limit: 0,
  run: async (m) => {
    const name = String(m.q || '').trim()
    if (!name) return m.reply(`Contoh: \`${config.display.prefix}gantinama Budi\``)
    const u = getUser(m.senderKey || m.sender)
    u.name = name.slice(0, 40)
    return m.reply(`✅ Nama disimpan: *${u.name}*`)
  }
}

export const myId = {
  command: ['myid', 'idku', 'nomorku'],
  category: 'User Menu',
  description: 'Tampilkan nomor & JID kamu',
  limit: 0,
  run: m => m.reply(`🆔 *Identitas kamu*\n▸ Nomor: ${m.sender.split('@')[0]}\n▸ JID: \`${m.sender}\`\n▸ Key DB: \`${m.senderKey || m.sender}\``)
}

export const waLink = {
  command: ['wame', 'walink', 'linkwa'],
  category: 'User Menu',
  description: 'Link wa.me kamu atau orang yang ditag',
  limit: 0,
  run: m => {
    const target = m.mentionJid?.[0] || m.sender
    const num = target.split('@')[0]
    return m.reply(`🔗 https://wa.me/${num}`)
  }
}

export const myBalance = {
  command: ['cekuang', 'balance'],
  category: 'User Menu',
  description: 'Cek koin RPG kamu',
  limit: 0,
  run: m => {
    const r = getRPG(m.senderKey || m.sender)
    return m.reply(`💰 Koin kamu: *${(r.money || 0).toLocaleString('id-ID')}*`)
  }
}

export const myLevel = {
  command: ['ceklevel'],
  category: 'User Menu',
  description: 'Cek level & EXP RPG kamu',
  limit: 0,
  run: m => {
    const r = getRPG(m.senderKey || m.sender)
    return m.reply(`🎮 *Level ${r.level || 1}*\n▸ EXP: ${r.exp || 0}\n▸ HP: ${r.health}/${r.maxHealth}\n▸ Energi: ${r.energy}/${r.maxEnergy}`)
  }
}

export const premCheck = {
  command: ['premcek', 'cekpremium', 'premiumcek'],
  category: 'User Menu',
  description: 'Cek status premium kamu',
  limit: 0,
  run: m => m.reply(m.isPremium ? '💎 Kamu user *PREMIUM*.' : '👤 Kamu user *biasa*.\nMinta owner untuk upgrade premium.')
}

export const report = {
  command: ['req', 'request', 'lapor', 'report'],
  category: 'User Menu',
  description: 'Kirim permintaan/laporan ke owner',
  limit: 0,
  run: async (m) => {
    const text = String(m.q || '').trim()
    if (!text) return m.reply(`Contoh: \`${config.display.prefix}req tolong tambah fitur X\``)
    const ownerJid = config.owner.number + '@s.whatsapp.net'
    await m.sock.sendMessage(ownerJid, { text: `📩 *LAPORAN USER*\nDari: @${m.sender.split('@')[0]}\nChat: ${m.isGroup ? m.groupName : 'Private'}\n\n${text}`, mentions: [m.sender] }).catch(() => {})
    return m.reply('✅ Laporan terkirim ke owner. Terima kasih!')
  }
}
