/**
 * 👑 OWNER PLUS — utilitas developer tambahan
 * Kategori "Owner Menu".
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { allUsers, saveNow } from '../lib/database.js'
import { ROOT, formatSize } from '../lib/functions.js'

export const clearTmp = {
  command: ['cleartmp', 'bersihkantmp', 'clean'],
  category: 'Owner Menu',
  description: 'Bersihkan folder tmp',
  owner: true,
  limit: 0,
  run: async (m) => {
    const dir = path.resolve(ROOT, config.tmpFolder)
    let n = 0, bytes = 0
    try {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f)
        if (f === '.gitkeep') continue
        const s = fs.statSync(p)
        if (s.isFile()) { bytes += s.size; fs.unlinkSync(p); n++ }
      }
    } catch {}
    return m.reply(`🧹 Dibersihkan ${n} file (${formatSize(bytes)}) dari tmp/`)
  }
}

export const banList = {
  command: ['banlist', 'listban', 'daftban'],
  category: 'Owner Menu',
  description: 'Daftar user yang di-ban',
  owner: true,
  limit: 0,
  run: async (m) => {
    const banned = allUsers().filter(u => u.banned)
    if (!banned.length) return m.reply('Tidak ada user yang di-ban.')
    return m.reply(`🚫 *USER DI-BAN* (${banned.length})\n` + banned.map(u => `▸ ${u.jid}${u.bannedReason ? ' — ' + u.bannedReason : ''}`).join('\n'))
  }
}

export const premList = {
  command: ['premlist', 'listprem', 'daftpremium'],
  category: 'Owner Menu',
  description: 'Daftar user premium',
  owner: true,
  limit: 0,
  run: async (m) => {
    const prem = allUsers().filter(u => u.premium)
    if (!prem.length) return m.reply('Belum ada user premium.')
    return m.reply(`💎 *USER PREMIUM* (${prem.length})\n` + prem.map(u => `▸ ${u.jid}${u.name ? ' (' + u.name + ')' : ''}`).join('\n'))
  }
}

export const resetLimit = {
  command: ['resetlimit', 'resetlimitall'],
  category: 'Owner Menu',
  description: 'Reset limit semua user ke default',
  owner: true,
  limit: 0,
  run: async (m) => {
    const users = allUsers()
    for (const u of users) u.limit = config.limits.default
    saveNow()
    return m.reply(`✅ Limit ${users.length} user direset ke ${config.limits.default}.`)
  }
}

export const setPpBot = {
  command: ['setppbot', 'ppbot', 'gantipp'],
  category: 'Owner Menu',
  description: 'Ganti foto profil bot (reply gambar)',
  owner: true,
  limit: 0,
  run: async (m) => {
    if (!m.quoted?.isMedia) return m.reply('Reply sebuah gambar lalu pakai perintah ini.')
    try {
      const buf = await m.quoted.toBuffer()
      await m.sock.updateProfilePicture(m.user, buf)
      return m.reply('✅ Foto profil bot diganti.')
    } catch (e) {
      return m.fail(e)
    }
  }
}
