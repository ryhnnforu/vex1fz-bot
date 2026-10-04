/**
 * 🤖 AI PLUS — kendali memori & persona AI
 * Kategori "AI Menu".
 */
import { config } from '../config.js'
import { getMemory, clearMemory, getSettings, setSetting } from '../lib/database.js'
import { activePersona } from '../lib/ai.js'

export const aiClear = {
  command: ['aiclear', 'clearmemory', 'resetmemory', 'lupamemory'],
  category: 'AI Menu',
  description: 'Hapus ingatan AI untuk chat ini',
  limit: 0,
  run: async (m) => {
    clearMemory(m.jid)
    return m.reply('🧹 Ingatan AI untuk chat ini dihapus. AI mulai dari nol.')
  }
}

export const aiMemory = {
  command: ['aimemory', 'lihatmemory', 'memoryai'],
  category: 'AI Menu',
  description: 'Lihat ingatan AI chat ini',
  limit: 0,
  run: async (m) => {
    const mem = getMemory(m.jid)
    if (!mem.length) return m.reply('Belum ada ingatan AI di chat ini.')
    const tail = mem.slice(-8)
    return m.reply(`🧠 *MEMORY AI* (${mem.length} pesan, tampil ${tail.length} terakhir)\n` + tail.map(x => `▸ *${x.role}*: ${String(x.content).slice(0, 80)}`).join('\n'))
  }
}

export const aiOn = {
  command: ['aion', 'aionn', 'nyalakanai'],
  category: 'AI Menu',
  description: 'Nyalakan auto-reply AI (global)',
  owner: true,
  limit: 0,
  run: async (m) => { setSetting('autoReplyAI', true); return m.reply('✅ Auto-reply AI *DINYALAKAN* (semua chat).') }
}

export const aiOff = {
  command: ['aioff', 'matikanai'],
  category: 'AI Menu',
  description: 'Matikan auto-reply AI (global)',
  owner: true,
  limit: 0,
  run: async (m) => { setSetting('autoReplyAI', false); return m.reply('🔕 Auto-reply AI *DIMATIKAN*.') }
}


