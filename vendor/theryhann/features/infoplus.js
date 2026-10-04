/**
 * ℹ️ INFO PLUS — info sistem, database, statistik bot (murni lokal)
 * Kategori "Info Menu".
 */
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { allUsers, allGroups, getStats, getSettings } from '../lib/database.js'
import { cpuInfo, processMemory, formatSize, formatDuration, clockString } from '../lib/functions.js'
import { ROOT } from '../lib/functions.js'
import { listPlugins } from '../lib/plugins.js'
import { activePersona } from '../lib/ai.js'

const P = config.display.prefix

export const osInfo = {
  command: ['osinfo', 'sistem', 'sysinfo', 'os'],
  category: 'Info Menu',
  description: 'Info sistem operasi & host',
  limit: 0,
  run: m => m.reply(
    `🖥️ *INFO SISTEM*\n` +
    `▸ OS: ${os.type()} ${os.release()}\n` +
    `▸ Platform: ${os.platform()} / ${os.arch()}\n` +
    `▸ Hostname: ${os.hostname()}\n` +
    `▸ CPU: ${os.cpus()[0]?.model || '-'} (${os.cpus().length} core)\n` +
    `▸ Uptime OS: ${formatDuration(os.uptime() * 1000)}\n` +
    `▸ Jam: ${clockString()}`
  )
}

export const cpuInfoCmd = {
  command: ['cpuinfo', 'cpu', 'cekcpu'],
  category: 'Info Menu',
  description: 'Info & beban CPU saat ini',
  limit: 0,
  run: m => {
    const c = cpuInfo()
    return m.reply(`⚙️ *CPU*\n\`\`\`${JSON.stringify(c, null, 2)}\`\`\``)
  }
}

export const ramInfo = {
  command: ['raminfo', 'ram', 'meminfo', 'cekram'],
  category: 'Info Menu',
  description: 'Pemakaian memori sistem & proses',
  limit: 0,
  run: m => {
    const pm = processMemory()
    const total = os.totalmem(), free = os.freemem()
    const usedPct = ((total - free) / total * 100).toFixed(1)
    return m.reply(
      `🧠 *MEMORI*\n` +
      `▸ Total: ${formatSize(total)}\n` +
      `▸ Terpakai: ${formatSize(total - free)} (${usedPct}%)\n` +
      `▸ Bebas: ${formatSize(free)}\n` +
      `▸ Proses bot (RSS): ${formatSize(pm.rss || 0)}\n` +
      `▸ Heap terpakai: ${formatSize(pm.heapUsed || 0)} / ${formatSize(pm.heapTotal || 0)}`
    )
  }
}

export const dbInfo = {
  command: ['dbinfo', 'infodb', 'cekdb', 'dbbot'],
  category: 'Info Menu',
  description: 'Info database JSON bot',
  limit: 0,
  run: m => {
    const dir = path.resolve(ROOT, config.databaseFolder)
    let files = []
    try { files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => ({ f, s: fs.statSync(path.join(dir, f)).size })) } catch {}
    return m.reply(
      `💾 *DATABASE*\n` +
      `▸ Folder: ${config.databaseFolder}/\n` +
      `▸ User: ${allUsers().length}\n` +
      `▸ Grup: ${allGroups().length}\n` +
      (files.length ? `▸ File:\n${files.map(x => `   • ${x.f} (${formatSize(x.s)})`).join('\n')}` : '▸ File: (kosong)')
    )
  }
}

export const statBot = {
  command: ['statbot', 'statistik', 'stats'],
  category: 'Info Menu',
  description: 'Statistik pemakaian bot',
  limit: 0,
  run: m => {
    const st = getStats()
    const s = getSettings()
    const top = Object.entries(st.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return m.reply(
      `📊 *STATISTIK BOT*\n` +
      `▸ Total hit: ${st.total || 0}\n` +
      `▸ Hits sesi ini: ${s.hits || 0}\n` +
      `▸ Uptime bot: ${m.runtime()}\n` +
      (top.length ? `▸ Command terpopuler:\n${top.map(([c, n], i) => `   ${i + 1}. ${c} (${n}x)`).join('\n')}` : '')
    )
  }
}

export const topCmd = {
  command: ['topcmd', 'commandtop', 'perintahpopuler'],
  category: 'Info Menu',
  description: '10 command paling sering dipakai',
  limit: 0,
  run: m => {
    const st = getStats()
    const top = Object.entries(st.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
    if (!top.length) return m.reply('Belum ada data pemakaian.')
    return m.reply('🏆 *TOP COMMAND*\n' + top.map(([c, n], i) => `${i + 1}. \`${c}\` — ${n}x`).join('\n'))
  }
}

export const listGc = {
  command: ['listgc', 'listgrup', 'grupbot', 'grouplist'],
  category: 'Info Menu',
  description: 'Daftar grup yang dimasuki bot',
  limit: 0,
  run: m => {
    const gs = allGroups()
    if (!gs.length) return m.reply('Bot belum ada di grup mana pun (tercatat).')
    return m.reply(`👥 *GRUP TERDAFTAR* (${gs.length})\n` + gs.map((g, i) => `${i + 1}. ${g.id || '?'}\n   member: ${g.members || 0} | welcome: ${g.welcome ? '✅' : '❌'}`).join('\n'))
  }
}

export const totalUser = {
  command: ['totaluser', 'usercount', 'jumlahuser'],
  category: 'Info Menu',
  description: 'Jumlah user terdaftar di database',
  limit: 0,
  run: m => m.reply(`👤 Total user terdaftar: *${allUsers().length}*`)
}

export const nodeInfo = {
  command: ['nodeinfo', 'nodever', 'ceknode'],
  category: 'Info Menu',
  description: 'Versi Node.js & path proses',
  limit: 0,
  run: m => m.reply(`🟢 *NODE.JS*\n▸ Versi: ${process.version}\n▸ Path: ${process.execPath}\n▸ PID: ${process.pid}\n▸ Arg: ${process.argv.slice(2).join(' ') || '(none)'}`)
}

export const creditInfo = {
  command: ['credit', 'kredit', 'thanks', 'terimakasih'],
  category: 'Info Menu',
  description: 'Credit & ucapan terima kasih',
  limit: 0,
  run: m => m.reply(`🙏 *CREDIT*\n▸ Base: @rexxhayanasi/elaina-baileys\n▸ Engine: Node.js ${process.version}\n▸ Gambar: jimp (pure JS)\n▸ AI: Pollinations (gratis)\n▸ Dibuat dengan ❤️ oleh ${config.owner.name}`)
}


export const channelInfo = {
  command: ['channel', 'follow', 'saluran'],
  category: 'Info Menu',
  description: 'Link channel WhatsApp bot',
  limit: 0,
  run: m => m.reply(`📢 *CHANNEL*\nIkuti channel resmi:\n${config.links.channel}`)
}

export const repoInfo = {
  command: ['repo', 'githubrepo', 'source'],
  category: 'Info Menu',
  description: 'Link repository / source',
  limit: 0,
  run: m => m.reply(`🐙 *REPOSITORY*\n${config.links.github}`)
}

export const aiInfo = {
  command: ['aistatus', 'cekai', 'infai'],
  category: 'Info Menu',
  description: 'Status & konfigurasi AI saat ini',
  limit: 0,
  run: m => {
    const s = getSettings()
    let persona = ''
    try { persona = activePersona(m.jid) } catch {}
    return m.reply(
      `🤖 *STATUS AI*\n` +
      `▸ Provider: ${config.ai.provider}\n` +
      `▸ Model: ${config.ai.model}\n` +
      `▸ Auto-reply: ${s.autoReplyAI ? '✅ aktif' : '❌ mati'}\n` +
      `▸ Memory: ${config.ai.memoryLength} pesan\n` +
      (persona ? `▸ Persona aktif: ${String(persona).slice(0, 60)}...` : '')
    )
  }
}

export const totalFitur = {
  command: ['totalfitur', 'fiturcount', 'jumlahfitur'],
  category: 'Info Menu',
  description: 'Hitung total perintah & kategori',
  limit: 0,
  run: m => {
    const all = listPlugins()
    const cats = [...new Set(all.map(p => p.category))]
    return m.reply(`🧩 *TOTAL FITUR*\n▸ Perintah: *${all.length}*\n▸ Kategori: *${cats.length}*\n▸ Alias gabungan: *${all.reduce((n, p) => n + p.command.length, 0)}*`)
  }
}
