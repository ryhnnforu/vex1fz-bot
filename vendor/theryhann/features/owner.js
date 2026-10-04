/**
 * 👑 OWNER / DEVELOPER MENU
 * eval, exec, plugin manager, broadcast, ban, set setting, dll
 */
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { exec as execCB } from 'node:child_process'
import { config } from '../config.js'
import { resolveImageValue, bannerBuffer, clearBannerCache, listThemes } from '../lib/menuimg.js'
import { FEATURES_DIR, loadPlugins, reloadPlugin, unloadPlugin, listPlugins } from '../lib/plugins.js'
import {
  allUsers,
  allGroups,
  getUser,
  getSettings,
  setSetting,
  getStats,
  saveNow
} from '../lib/database.js'
import { truncate, formatSize, chunkText } from '../lib/functions.js'

const exec = util.promisify(execCB)

export default {
  command: ['owner', 'creator'],
  category: 'Main Menu',
  description: 'Menampilkan kontak owner bot',
  limit: 0,
  run: async (m) => {
    const vcard =
      'BEGIN:VCARD\nVERSION:3.0\n' +
      `N:;${config.owner.name};;;\n` +
      `FN:${config.owner.name}\n` +
      `ORG:${config.bot.name};\n` +
      `TEL;type=CELL;type=VOICE;waid=${config.owner.number}:${'+' + config.owner.number}\n` +
      'END:VCARD'
    return m.sock
      .sendMessage(m.jid, {
        contacts: { displayName: config.owner.name, contacts: [{ vcard }] },
        contextInfo: { mentionedJid: [config.owner.number + '@s.whatsapp.net'] }
      }, { quoted: m.raw })
      .then(() =>
        m.sendButtons({
          title: '👑 Owner ' + config.bot.name,
          text: `Itu kontak owner aku *\`${config.owner.name}\`*\nKalau ada bug / mau sewa bot / request fitur, chat langsung ya 🙌`,
          buttons: [{ text: '🏠 Menu', id: 'act:menu:main' }]
        })
      )
      .catch(() => m.reply(`👑 Owner: ${config.owner.name}\n📱 wa.me/${config.owner.number}`))
  }
}

/* ================= EVAL / EXEC (developer) ================= */
export const evalCmd = {
  command: ['>', '=>', 'eval'],
  category: 'Owner Menu',
  description: 'Eval JavaScript (owner only)',
  owner: true,
  limit: 0,
  cooldown: 0,
  run: async (m) => {
    const code = m.q
    if (!code) return m.reply('Contoh: `> return 1+1`')
    let out
    try {
      const fn = new Function(
        'm',
        'sock',
        'conn',
        'config',
        'require',
        'process',
        'fs',
        'path',
        'util',
        'os',
        `return (async () => { ${code.includes('return') ? code : 'return ' + code} })()`
      )
      const res = await fn(m, m.sock, m.sock, config, await importModule, process, fs, path, util, await import('node:os'))
      out = util.inspect(res, { depth: 3 })
    } catch (e) {
      out = '❌ ' + (e?.stack || e?.message || e)
    }
    return m.reply('```' + truncate(out, 3800) + '```')
  }
}

export const execCmd = {
  command: ['$', 'exec', 'run'],
  category: 'Owner Menu',
  description: 'Eksekusi perintah shell/termux (owner only)',
  owner: true,
  limit: 0,
  run: async (m) => {
    if (!m.q) return m.reply('Contoh: `$ ls -la`')
    try {
      const { stdout, stderr } = await exec(m.q, { cwd: path.resolve(FEATURES_DIR, '..') })
      return m.reply('```' + truncate((stdout || '') + (stderr || '') || '(tidak ada output)', 3800) + '```')
    } catch (e) {
      return m.reply('```❌ ' + truncate(e.message + '\n' + (e.stdout || ''), 3500) + '```')
    }
  }
}

async function importModule (name) {
  return await import(name)
}

/* ================= PLUGIN MANAGER ================= */
export const pluginManager = {
  command: ['plugin', 'pl', 'plugins'],
  category: 'Owner Menu',
  description: 'List / reload / delete fitur bot',
  owner: true,
  limit: 0,
  run: async (m) => {
    const files = fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.js'))
    const [action, target] = [m.args[0], m.args.slice(1).join(' ')]

    if (action === 'reload' || action === 'refresh') {
      const r = await loadPlugins()
      return m.reply(`🔄 Semua fitur di-reload.\n▸ ${r.files} file\n▸ ${r.total} perintah aktif`)
    }
    if (action === 'delete' || action === 'del' || action === 'rm') {
      if (!target) return m.reply('Contoh: `.plugin delete ai.js`')
      try {
        const name = unloadPlugin(target.endsWith('.js') ? target : target + '.js')
        return m.reply(`🗑️ Plugin \`${name}\` di-unload dari memori.\nFile masih ada di folder features/ (hapus manual bila perlu).`)
      } catch (e) {
        return m.reply('❌ ' + e.message)
      }
    }
    if (action === 'get' && target) {
      const file = path.join(FEATURES_DIR, target.endsWith('.js') ? target : target + '.js')
      if (!fs.existsSync(file)) return m.reply('❌ File tidak ditemukan.')
      const content = fs.readFileSync(file, 'utf-8')
      return m.sendDoc(Buffer.from(content), path.basename(file), 'text/javascript')
    }

    const text = files
      .map(f => `▸ \`${f}\` (${formatSize(fs.statSync(path.join(FEATURES_DIR, f)).size)})`)
      .join('\n')
    return m.sendButtons({
      title: '🧩 Plugin Manager',
      text: `*🧩 DAFTAR FITUR (${files.length} file / ${listPlugins().length} perintah)*\n\n${truncate(text, 2800)}\n\n*Perintah:*\n\`.plugin reload\`\n\`.plugin delete <file>\`\n\`.plugin get <file>\``,
      buttons: [
        { text: '🔄 Reload', id: '.plugin reload' },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    })
  }
}

/* ================= BROADCAST ================= */
export const broadcast = {
  command: ['bc', 'broadcast'],
  category: 'Owner Menu',
  description: 'Broadcast pesan ke semua user/grup',
  owner: true,
  limit: 0,
  run: async (m) => {
    const text = m.q
    if (!text) return m.reply('Contoh: `.bc Halo semua!` (atau reply media dengan caption `.bc teks`)')

    let media = null
    if (m.isMedia || m.quoted?.isMedia) {
      try {
        const d = await m.download()
        media = d
      } catch {}
    }

    const targets = [
      ...allUsers().map(u => u.jid).filter(j => j && j.includes('@s.whatsapp.net')),
      ...allGroups().map(g => g.jid).filter(j => j && j.includes('@g.us'))
    ]
    const unique = [...new Set(targets)]
    if (!unique.length) return m.reply('❌ Belum ada target broadcast (database kosong).')

    await m.reply(`📢 Mengirim broadcast ke *${unique.length}* chat...`)
    let ok = 0
    let fail = 0
    for (const jid of unique) {
      try {
        const content = media?.mime?.startsWith('image/')
          ? { image: media.buffer, caption: `*📢 BROADCAST ${config.bot.name}*\n\n${text}` }
          : media?.mime?.startsWith('video/')
            ? { video: media.buffer, caption: `*📢 BROADCAST ${config.bot.name}*\n\n${text}` }
            : { text: `*📢 BROADCAST ${config.bot.name}*\n\n${text}\n\n_© ${config.owner.name}_` }
        await m.sock.sendMessage(jid, content)
        ok++
      } catch {
        fail++
      }
      await new Promise(r => setTimeout(r, 800))
    }
    return m.reply(`✅ Broadcast selesai.\n▸ Sukses: ${ok}\n▸ Gagal: ${fail}\n▸ Total: ${unique.length}`)
  }
}

/* ================= BAN / UNBAN / PREMIUM ================= */
export const banUser = {
  command: ['ban', 'unban', 'addprem', 'delprem', 'setlimit'],
  category: 'Owner Menu',
  description: 'Banned / premium / limit user',
  owner: true,
  limit: 0,
  run: async (m) => {
    const target =
      m.mentioned[0] ||
      (m.quoted?.sender ? m.quoted.sender : null) ||
      (m.args[0] ? m.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    if (!target) return m.reply('Tag / reply / kirim nomor target.\nContoh: `.ban 628xxx` atau `.ban @user`')

    const u = getUser(target)
    const num = target.split('@')[0]
    switch (m.command) {
      case 'ban':
        u.banned = true
        u.bannedReason = m.arg.replace(/^@?\d+\s*/, '') || 'Melanggar aturan'
        saveNow('users')
        return m.reply(`🚫 @${num} telah di-BANNED.\nAlasan: ${u.bannedReason}`, { mentions: [target] })
      case 'unban':
        u.banned = false
        u.bannedReason = ''
        saveNow('users')
        return m.reply(`✅ @${num} sudah di-unban.`, { mentions: [target] })
      case 'addprem': {
        /* v7.7: .addprem <target> [hari] — tanpa hari = permanen */
        /* hari = angka terakhir yang PENDEK (1–3650); nomor HP (9–15 digit) bukan hari */
        const kandidat = m.args.map(a => String(a).replace(/[^0-9]/g, '')).filter(a => /^\d{1,4}$/.test(a))
        const hari = parseInt(kandidat.pop() || '', 10)
        u.premium = true
        if (Number.isFinite(hari) && hari > 0) {
          u.premiumUntil = Date.now() + Math.min(3650, hari) * 24 * 3600000
        } else {
          u.premiumUntil = null
        }
        saveNow('users')
        return m.reply(
          `💎 @${num} sekarang PREMIUM${u.premiumUntil ? '' : ' (permanen)'}.` +
          (u.premiumUntil ? `\nAktif sampai: *${new Date(u.premiumUntil).toLocaleDateString('id-ID')}* (${hari} hari)` : '') +
          `\n\nCek: \`${config.display.prefix}premcek @${num}\``,
          { mentions: [target] }
        )
      }
      case 'delprem':
        u.premium = false
        u.premiumUntil = null
        saveNow('users')
        return m.reply(`📉 @${num} bukan premium lagi.`, { mentions: [target] })
      case 'setlimit': {
        const val = parseInt(m.args[m.args.length - 1])
        if (isNaN(val)) return m.reply('Contoh: `.setlimit 628xxx 100`')
        u.limit = val
        saveNow('users')
        return m.reply(`💠 Limit @${num} diset jadi *${val}*.`, { mentions: [target] })
      }
    }
  }
}

/* ================= SETTING BOT ================= */
export const setBot = {
  command: ['set', 'setbot'],
  category: 'Owner Menu',
  description: 'Ubah setting bot (public/self, menu, ai, dll)',
  owner: true,
  limit: 0,
  run: async (m) => {
    const [key, ...rest] = m.args
    const value = rest.join(' ')
    const s = getSettings()
    const p = config.display.prefix

    if (!key) {
      const rows = [
        ['public', s.public ? 'true' : 'false', 'mode publik / self'],
        ['menuMode', s.menuMode || config.display.menuMode, 'button | list | text | auto | html (menu2) | menu3 (video)'],
        ['autoReplyAI', s.autoReplyAI ? 'true' : 'false', 'AI balas tanpa prefix'],
        ['readCommand', s.readCommand ? 'true' : 'false', 'centang biru saat command'],
        ['typing', s.typing ? 'true' : 'false', 'efek mengetik'],
        ['antiCall', s.antiCall ? 'true' : 'false', 'tolak panggilan'],
        ['autoBio', s.autoBio ? 'true' : 'false', 'bio realtime'],
        ['botName', s.botName || config.bot.name, 'nama bot'],
        ['footer', s.footer || config.bot.footer, 'footer pesan'],
        ['menuImage', s.menuImage || config.display.menuImage || '(bawaan)', 'gambar header menu'],
        ['menuTheme', s.menuTheme || 'midnight', 'tema banner menu']
      ]
      return m.sendList({
        title: '⚙️ Setting Bot',
        text: '*⚙️ SETTING BOT*\n\n' + rows.map(r => `▸ \`${r[0]}\` = ${r[1]}  _(${r[2]})_`).join('\n') +
          `\n\nCara pakai:\n\`${p}set <key> <value>\`\nContoh: \`${p}set public false\``,
        buttonText: '⚙️ Buka Setting',
        sections: [
          {
            title: 'Mode Bot',
            rows: [
              { title: s.public ? '🔒 Jadikan Self Mode' : '🌐 Jadikan Public', id: `.set public ${!s.public}`, description: '' },
              { title: '📱 Menu: Button', id: '.set menuMode button', description: 'tombol quick reply' },
              { title: '📋 Menu: List', id: '.set menuMode list', description: 'button list (Android)' },
              { title: '📝 Menu: Text', id: '.set menuMode text', description: 'paling aman' },
              { title: '🎯 Menu: Auto', id: '.set menuMode auto', description: 'list di PC, button di grup' }
            ]
          },
          {
            title: 'AI & Lainnya',
            rows: [
              { title: s.autoReplyAI ? '❌ Matikan Auto AI' : '✅ Nyalakan Auto AI', id: `.set autoReplyAI ${!s.autoReplyAI}`, description: '' },
              { title: `📖 Read Command: ${s.readCommand ? 'ON' : 'OFF'}`, id: `.set readCommand ${!s.readCommand}`, description: '' },
              { title: `⌨️ Typing: ${s.typing ? 'ON' : 'OFF'}`, id: `.set typing ${!s.typing}`, description: '' },
              { title: `📵 Anti Call: ${s.antiCall ? 'ON' : 'OFF'}`, id: `.set antiCall ${!s.antiCall}`, description: '' }
            ]
          }
        ]
      }).catch(() => m.reply('⚙️ Gunakan: `' + p + 'set <key> <value>`'))
    }

    const boolKeys = ['public', 'autoReplyAI', 'readCommand', 'typing', 'antiCall', 'autoBio']
    if (boolKeys.includes(key)) {
      const val = ['true', 'on', '1', 'ya'].includes(String(value).toLowerCase())
      setSetting(key, val)
      return m.reply(`✅ \`${key}\` = ${val}`)
    }
    if (['menuMode', 'botName', 'footer', 'menuImage', 'menuTheme'].includes(key)) {
      if (!value) return m.reply(`Contoh: \`${p}set ${key} <value>\``)
      setSetting(key, value)
      if (key === 'menuImage' || key === 'menuTheme') clearBannerCache()
      return m.reply(`✅ \`${key}\` = ${value}`)
    }
    return m.reply(`❌ Key \`${key}\` tidak dikenal.`)
  }
}

/* ================= RESTART / SAVE / DB ================= */
export const systemCmd = {
  command: ['restart', 'save', 'db', 'database', 'leave', 'join', 'getdb'],
  category: 'Owner Menu',
  description: 'Restart bot, simpan DB, kelola grup',
  owner: true,
  limit: 0,
  run: async (m) => {
    switch (m.command) {
      case 'restart':
        await m.reply('🔄 Me-restart bot...')
        for (const f of ['users', 'groups', 'settings', 'stats', 'memory']) saveNow(f)
        setTimeout(() => process.exit(0), 1200)
        break
      case 'save':
        for (const f of ['users', 'groups', 'settings', 'stats', 'memory']) saveNow(f)
        return m.reply('💾 Database tersimpan.')
      case 'db':
      case 'database': {
        const stats = getStats()
        const top = Object.entries(stats.commands || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
        const text = `*🗄️ DATABASE*\n\n▸ User: ${allUsers().length}\n▸ Grup: ${allGroups().length}\n▸ Total hit: ${stats.total || 0}\n▸ Fitur: ${listPlugins().length}\n\n*🔥 TOP COMMAND*\n${top.map((t, i) => `${i + 1}. \`${t[0]}\` — ${t[1]}x`).join('\n') || '-'}`
        return m.sendButtons({ title: '🗄️ Database', text, buttons: [{ text: '💾 Save', id: '.save' }, { text: '📦 Kirim File DB', id: '.getdb' }] })
      }
      case 'getdb': {
        const dir = path.resolve(FEATURES_DIR, '../database')
        for (const f of fs.readdirSync(dir)) {
          if (f.endsWith('.json')) await m.sendDoc(fs.readFileSync(path.join(dir, f)), f, 'application/json')
        }
        return m.reply('✅ Semua file database dikirim.')
      }
      case 'leave': {
        if (!m.isGroup) return m.reply('👥 Hanya di grup.')
        await m.reply('👋 Bot keluar dari grup ini...')
        await m.sock.groupLeave(m.jid)
        break
      }
      case 'join': {
        const link = m.q
        if (!link) return m.reply('Contoh: `.join https://chat.whatsapp.com/XXXX`')
        const code = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{10,30})/)?.[1]
        if (!code) return m.reply('❌ Link tidak valid.')
        try {
          await m.sock.groupAcceptInvite(code)
          return m.reply('✅ Berhasil masuk grup.')
        } catch (e) {
          return m.reply('❌ Gagal join: ' + e.message)
        }
      }
    }
  }
}

/* ================= GAMBAR MENU CUSTOM ================= */
export const setMenuImg = {
  command: ['setmenuimg', 'setmenuimage', 'menuimg', 'setbgmenu'],
  category: 'Owner Menu',
  description: 'Custom gambar header menu (url / reply gambar / banner)',
  owner: true,
  limit: 0,
  run: async (m) => {
    const s = getSettings()
    const p = config.display.prefix
    const arg = String(m.q || '').trim()

    const applyAndPreview = async (val, label) => {
      setSetting('menuImage', val)
      clearBannerCache()
      const img = await resolveImageValue(val).catch(() => null)
      if (!img) return m.reply(`✅ Gambar menu diset: *${label}* (tanpa gambar — menu jadi paling cepat).`)
      return m.sendImage(img, `✅ Gambar header menu diset: *${label}*\nSemua menu sekarang pakai gambar ini.`)
        .catch(() => m.reply(`✅ Gambar menu diset: *${label}*`))
    }

    if (!arg && !m.quoted?.isMedia) {
      return m.sendInteractive({
        title: '🖼️ Gambar Menu',
        body: `*Gambar header menu saat ini:* ${s.menuImage || '(bawaan config)'}\n\n` +
          'Pilihan:\n' +
          `▸ \`${p}setmenuimg none\` — tanpa gambar (paling cepat)\n` +
          `▸ \`${p}setmenuimg banner\` — banner gradient buatan bot\n` +
          `▸ \`${p}setmenuimg banner:<tema>\` — banner tema tertentu\n` +
          `▸ \`${p}setmenuimg random\` — banner tema acak\n` +
          `▸ \`${p}setmenuimg <url>\` — gambar dari internet\n` +
          `▸ reply gambar lalu \`${p}setmenuimg\` — simpan gambar itu\n\n` +
          `Tema banner: ${listThemes().join(', ')}`,
        footer: config.bot.footer,
        buttons: [
          { text: '🎨 Banner Bot', id: `${p}setmenuimg banner` },
          { text: '🎲 Random', id: `${p}setmenuimg random` },
          { text: '🚫 Tanpa Gambar', id: `${p}setmenuimg none` }
        ]
      }).catch(() => m.reply(`🖼️ Gunakan: \`${p}setmenuimg none|banner|random|<url>\` atau reply gambar.`))
    }

    if (['none', 'off', 'reset', 'hapus', ''].includes(arg.toLowerCase())) {
      return await applyAndPreview('', 'none')
    }

    // reply gambar -> simpan lokal
    if (m.quoted?.isMedia) {
      try {
        const buf = await m.quoted.toBuffer()
        const fs = await import('node:fs')
        const path = await import('node:path')
        const { ROOT } = await import('../lib/functions.js')
        const dir = path.join(ROOT, 'media')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        const file = path.join(dir, 'menuimg.jpg')
        fs.writeFileSync(file, buf)
        return await applyAndPreview(file, 'gambar custom (media/menuimg.jpg)')
      } catch (e) {
        return m.fail(e)
      }
    }

    return await applyAndPreview(arg, arg)
  }
}
