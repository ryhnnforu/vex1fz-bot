/**
 * commands/devtool.js — TOOL DEVELOPER `._` / `.>_` (owner only)
 *
 * Subcommand:
 *   .>_ help          bantuan
 *   .>_ status        registry, plugin, uptime, memori
 *   .>_ ls [dir]      daftar file (default: plugins/)
 *   .>_ eval <kode>   jalankan kode JS (hasil di-split biar muat)
 *   .>_ add <nama>    bikin plugins/<nama>.js dari template + auto load
 *   .>_ load <file>   load 1 file plugin (path relatif plugins/)
 *   .>_ unload <cmd>  lepas command dari registry
 *   .>_ reload        unload + load ulang semua plugin
 *   .>_ db [ringkas]  ringkasan database
 *
 * CATATAN: require('./index') dilakukan LAZY di dalam run()
 * (devtool di-require oleh commands/index → circular jika top-level).
 */
const fs = require('fs')
const path = require('path')
const util = require('util')

const CONFIG = require('../config')
const { log, formatUptime, truncate } = require('../lib/util')

function reg() { return require('./index') } // ← LAZY anti-circular

const HELP = [
  '🛠️ *TOOL DEV* `._` *(owner only)*',
  '',
  '• `._ status` — registry & resource',
  '• `._ ls [dir]` — daftar file',
  '• `._ eval <kode>` — eksekusi JS',
  '• `._ add <nama>` — plugin baru dari template',
  '• `._ load <file>` — load plugin',
  '• `._ unload <nama>` — lepas command',
  '• `._ reload` — reload semua plugin',
  '• `._ db` — ringkasan database',
  '',
  'Template plugin: export `{ name, run(m, sock, args) }` ATAU array cmd.'
].join('\n')

function safeEval(code) {
  // eval owner dijalankan dengan Function supaya `await` bisa
  const fn = new Function(`return (async () => { ${code.includes('return') ? code : `return (${code})`} })()`)
  return fn()
}

function dbSummary() {
  const db = require('../lib/db')
  const d = db.load()
  const out = []
  for (const k of Object.keys(d)) {
    const v = d[k]
    const type = Array.isArray(v) ? `array(${v.length})` : v && typeof v === 'object' ? `object(${Object.keys(v).length})` : JSON.stringify(v)
    out.push(`• ${k} : ${type}`)
  }
  const file = CONFIG.dbFile || CONFIG.DB_FILE || 'db.json'
  let size = 0
  try { size = fs.statSync(file).size } catch (_) {}
  out.push('', `file: ${file} (${(size / 1024).toFixed(1)} KB)`)
  return out.join('\n')
}

function templatePlugin(name) {
  return `/**
 * plugins/${name}.js — dibuat oleh tool dev .>_
 * Jalankan: .${name}
 */
module.exports = {
  name: '${name}',
  aliases: [],
  category: 'plugin',
  access: 'user',          // 'user' | 'admin' | 'owner'
  prefixes: ['.'],
  desc: 'Deskripsi fitur ${name}',
  usage: '.${name}',
  async run(m, sock, args) {
    await m.reply('Plugin *${name}* aktif! args: ' + (args.join(' ') || '-'))
  }
}
`
}

module.exports = [
  {
    name: '>',
    aliases: ['_', '>_'],
    category: 'owner-dev',
    access: 'owner',
    prefixes: ['.', '/', ',', '=>'],
    desc: 'Tool developer: eval, plugin loader, registry, db',
    usage: '.>_ help',
    async run(m, sock, args) {
      const sub = (args[0] || 'help').toLowerCase()
      const rest = args.slice(1)
      const R = reg()

      /* ── HELP ── */
      if (sub === 'help') return m.reply(HELP)

      /* ── STATUS ── */
      if (sub === 'status') {
        const mem = process.memoryUsage()
        const plugins = R.pluginList()
        return m.reply([
          '📊 *STATUS BOT*',
          `• registry : ${R.count()} command`,
          `• plugin   : ${plugins.length} file`,
          ...(plugins.length ? plugins.map(p => `  └ ${p.file} → ${p.commands.join(', ')}`) : []),
          `• uptime   : ${formatUptime(process.uptime())}`,
          `• node     : ${process.version}`,
          `• rss      : ${(mem.rss / 1048576).toFixed(1)} MB`,
          `• mode     : ${(require('../lib/db').load().settings.mode || CONFIG.mode).toUpperCase()}`
        ].join('\n'))
      }

      /* ── LS ── */
      if (sub === 'ls') {
        const dir = path.resolve(R.PLUGIN_DIR, rest[0] || '.')
        if (!fs.existsSync(dir)) return m.reply(`📁 Tidak ada: ${dir}`)
        const ents = fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => rest[0] ? true : e.name.endsWith('.js'))
          .slice(0, 60)
        if (!ents.length) return m.reply('📂 Folder kosong.')
        return m.reply([
          `📂 *${path.relative(process.cwd(), dir) || '.'}/*`,
          ...ents.map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}${e.isFile() ? ` (${(e.size / 1024).toFixed(1)}KB)` : ''}`)
        ].join('\n'))
      }

      /* ── EVAL ── */
      if (sub === 'eval' || sub === 'e') {
        const code = rest.join(' ')
        if (!code) return m.reply('⚠️ Contoh: `._ eval 1+1`')
        try {
          const out = await safeEval(code)
          const s = util.inspect(out, { depth: 2, maxArrayLength: 20 })
          return m.reply(`✅ *eval*\n\`\`\`\n${truncate(s, 3500)}\n\`\`\``)
        } catch (e) {
          return m.reply(`❌ *eval error*\n\`\`\`\n${truncate(String(e.stack || e), 1200)}\n\`\`\``)
        }
      }

      /* ── ADD plugin ── */
      if (sub === 'add') {
        const name = (rest[0] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '')
        if (!name) return m.reply('⚠️ Nama plugin belum ada. Contoh: `._ add antilink`')
        if (R.resolve(name)) return m.reply(`⚠️ Command *${name}* sudah terdaftar.`)
        const file = path.join(R.PLUGIN_DIR, `${name}.js`)
        if (fs.existsSync(file)) return m.reply(`⚠️ File plugins/${name}.js sudah ada.`)
        fs.mkdirSync(R.PLUGIN_DIR, { recursive: true })
        fs.writeFileSync(file, templatePlugin(name))
        try {
          const mod = R._freshRequire(file) // validate
          const cmds = Array.isArray(mod) ? mod : [mod]
          for (const c of cmds) R.register(c, path.basename(file))
          return m.reply([
            `✅ Plugin dibuat: *plugins/${name}.js*`,
            `• command: \`._${name}\` → test ketik \`.${name}\``,
            `• edit file lalu \`._ reload\` kalau ubahan belum kebaca`
          ].join('\n'))
        } catch (e) {
          return m.reply(`⚠️ File dibuat tapi gagal load: ${e.message}`)
        }
      }

      /* ── LOAD ── */
      if (sub === 'load') {
        const file = (rest[0] || '').replace(/^plugins\//, '')
        if (!file) return m.reply('⚠️ Contoh: `._ load myplugin.js`')
        try {
          const abs = path.join(R.PLUGIN_DIR, path.basename(file))
          if (!fs.existsSync(abs)) return m.reply(`⚠️ Tidak ada: plugins/${path.basename(file)}`)
          const mod = R._freshRequire(abs)
          const cmds = Array.isArray(mod) ? mod : [mod]
          const names = []
          for (const c of cmds) R.register(c, path.basename(abs))
          for (const c of cmds) names.push(c.name)
          return m.reply(`✅ Loaded *${path.basename(abs)}* → ${names.join(', ')}`)
        } catch (e) {
          return m.reply(`❌ Gagal load: ${e.message}`)
        }
      }

      /* ── UNLOAD ── */
      if (sub === 'unload') {
        const name = (rest[0] || '').replace(/^\./, '')
        if (!name) return m.reply('⚠️ Contoh: `._ unload antilink`')
        const ok = R.unload(name)
        return m.reply(ok ? `✅ Command *.${name}* dilepas dari registry.` : `⚠️ *.${name}* tidak ditemukan.`)
      }

      /* ── RELOAD semua plugin ── */
      if (sub === 'reload') {
        const r = R.reloadPlugins()
        return m.reply([
          '♻️ *Reload plugin selesai*',
          `• loaded  : ${r.loaded.length}${r.loaded.length ? `\n  - ${r.loaded.join('\n  - ')}` : ''}`,
          `• skipped : ${r.skipped.length}`,
          `• errors  : ${r.errors.length}${r.errors.length ? `\n  - ${r.errors.join('\n  - ')}` : ''}`
        ].join('\n'))
      }

      /* ── DB ringkas ── */
      if (sub === 'db') {
        try { return m.reply('🗄️ *DATABASE*\n' + dbSummary()) }
        catch (e) { return m.reply('❌ db: ' + e.message) }
      }

      return m.reply(HELP)
    }
  }
]
