/**
 * ℹ️ INFO BOT — ping, runtime, status, source code
 */
import os from 'node:os'
import { config } from '../config.js'
import { getStats, allUsers, allGroups, getSettings } from '../lib/database.js'
import { processMemory, cpuInfo, truncate } from '../lib/functions.js'

export default {
  command: ['ping', 'speed', 'runtime', 'botstatus', 'status', 'sc', 'script', 'infobot'],
  category: 'Info Menu',
  description: 'Kecepatan, runtime & status bot',
  limit: 0,
  cooldown: 1,
  run: async (m) => {
    const stats = getStats()

    if (m.command === 'ping' || m.command === 'speed') {
      const start = Date.now()
      await m.reply('🏓 Pinging...')
      const latency = Date.now() - start
      try {
        return await m.sendAIRich({
          title: '⚡ Speed Test — ' + config.bot.name,
          text: `Respon bot terukur *${latency} ms*`,
          table: [
            ['Item', 'Hasil'],
            ['Latency', latency + ' ms'],
            ['Uptime', m.runtime()],
            ['Heap Node', processMemory()],
            ['Total Hit', String(stats.total || 0)],
            ['Fitur Aktif', m.plugins.length + ' perintah']
          ],
          tip: latency < 900 ? 'Bot dalam kondisi sehat 🟢' : 'Bot agak lambat 🟡 (cek koneksi HP)',
          suggest: ['.menu', '.botstatus', '.owner']
        })
      } catch {
        return m.reply(`🏓 Pong! *${latency}ms*`)
      }
    }

    if (m.command === 'runtime') {
      return m.reply(`⏱️ *Runtime Bot*\n\n${config.bot.name} sudah online selama:\n*${m.runtime()}*`)
    }

    if (m.command === 'sc' || m.command === 'script') {
      return m
        .sendInteractive({
          title: '📦 Source Code ' + config.bot.name,
          body: `*${config.bot.name}* v${config.bot.version}\n\nDibangun dengan:\n▸ @rexxhayanasi/elaina-baileys (Baileys fork aktif)\n▸ Interactive Message (quick reply, url, copy)\n▸ Button List / single_select\n▸ AI Rich Message (gaya Meta AI)\n▸ Carousel & ButtonV2\n▸ AI Chat + AI Image + TTS (gratis)\n▸ Database JSON (ramah Termux)\n\n© ${config.owner.name}`,
          footer: config.bot.footer,
          buttons: [{ text: '🏠 Menu Utama', id: 'act:menu:main' }],
          url: [{ text: '🔗 Channel WhatsApp', url: config.links.channel }]
        })
        .catch(() => m.reply(`📦 ${config.bot.name} v${config.bot.version}`))
    }

    // botstatus / status / infobot
    const sys = cpuInfo()
    const s = getSettings()
    const text = `*📊 STATUS ${config.bot.name.toUpperCase()}*

▸ *Mode:* ${s.public ? '🌐 Public' : '🔒 Self (owner only)'}
▸ *Auto AI:* ${s.autoReplyAI ? '✅ ON' : '❌ OFF'}
▸ *Menu Mode:* ${s.menuMode || config.display.menuMode}
▸ *Prefix:* ${config.display.prefix}
▸ *Runtime:* ${m.runtime()}
▸ *Jam:* ${m.clock()} WIB

*🗄️ DATABASE*
▸ User terdaftar: ${allUsers().length}
▸ Grup aktif: ${allGroups().length}
▸ Command dipakai: ${stats.total || 0}
▸ Fitur: ${m.plugins.length} perintah

*🖥️ SISTEM*
▸ Platform: ${sys.platform} / ${sys.arch}
▸ CPU Core: ${sys.cpus}
▸ RAM bebas: ${sys.freeMem} / ${sys.totalMem}
▸ Heap Node: ${processMemory()}
▸ Uptime device: ${sys.uptime}`

    return m
      .sendButtons({
        title: '📊 Bot Status',
        text,
        image: config.display.thumbnail,
        buttons: [
          { text: '⚡ Ping', id: '.ping' },
          { text: '🏠 Menu', id: 'act:menu:main' },
          { text: '👑 Owner', id: '.owner' }
        ]
      })
      .catch(() => m.reply(text))
  }
}
