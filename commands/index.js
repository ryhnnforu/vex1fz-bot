/**
 * commands/index.js — registry semua command
 *
 * access  : 'user'  → prefix "." (semua user)
 *           'owner' → prefix "/", ",", "=>" (hanya owner)
 * prefixes: daftar prefix yang diperbolehkan memanggil command
 */
const general = require('./general')
const downloader = require('./downloader')
const game = require('./game')
const rpg = require('./rpg')
const islami = require('./islami')
const profile = require('./profile')
const owner = require('./owner')
const ai = require('./ai')
const sticker = require('./sticker')
const group = require('./group')
const group2 = require('./group2')
const rpg2 = require('./rpg2')
const game2 = require('./game2')

const all = [
  ...general,
  ...downloader,
  ...game,
  ...rpg,
  ...islami,
  ...profile,
  ...owner,
  ...ai,
  ...sticker,
  ...group,
  ...group2,
  ...rpg2,
  ...game2
]

const byName = new Map()
for (const cmd of all) {
  byName.set(cmd.name.toLowerCase(), cmd)
  for (const a of cmd.aliases || []) byName.set(a.toLowerCase(), cmd)
}

const devtools = require('./devtool')
all.push(...devtools)
for (const cmd of devtools) {
  byName.set(cmd.name.toLowerCase(), cmd)
  for (const a of cmd.aliases || []) byName.set(a.toLowerCase(), cmd)
}

/* ═══════════ PLUGIN LOADER (tool dev .>_) ═══════════ */
const fs = require('fs')
const path = require('path')
const PLUGIN_DIR = path.join(__dirname, '..', 'plugins')
const pluginFiles = new Map() // file → [names]

function indexOne(cmd, source) {
  if (!cmd || typeof cmd.name !== 'string' || typeof cmd.run !== 'function') {
    throw new Error('plugin export tidak valid (butuh { name, run })')
  }
  const key = cmd.name.toLowerCase()
  if (byName.has(key)) throw new Error(`nama .${key} sudah terdaftar`)
  cmd.category = cmd.category || 'plugin'
  cmd.access = cmd.access || 'user'
  cmd.prefixes = Array.isArray(cmd.prefixes) && cmd.prefixes.length ? cmd.prefixes : ['.']
  if (source) cmd.__plugin = source
  all.push(cmd)
  byName.set(key, cmd)
  for (const a of cmd.aliases || []) {
    const ak = String(a).toLowerCase()
    if (!byName.has(ak)) byName.set(ak, cmd)
  }
  if (source) {
    if (!pluginFiles.has(source)) pluginFiles.set(source, [])
    pluginFiles.get(source).push(key)
  }
  return cmd
}

/** daftarkan 1 command (dipakai juga oleh tool dev) */
function register(cmd, source) { return indexOne(cmd, source || null) }

function _freshRequire(file) {
  const abs = path.resolve(file)
  delete require.cache[abs]
  return require(abs)
}

/** scan plugins/*.js → register (export object ATAU array) */
function loadPlugins() {
  const res = { loaded: [], skipped: [], errors: [] }
  if (!fs.existsSync(PLUGIN_DIR)) { fs.mkdirSync(PLUGIN_DIR, { recursive: true }); return res }
  for (const f of fs.readdirSync(PLUGIN_DIR).sort()) {
    if (!f.endsWith('.js')) continue
    try {
      const mod = _freshRequire(path.join(PLUGIN_DIR, f))
      const cmds = Array.isArray(mod) ? mod : (mod && typeof mod === 'object' ? [mod] : [])
      if (!cmds.length) { res.skipped.push(f); continue }
      const names = []
      for (const c of cmds) { indexOne(c, f); names.push(c.name) }
      res.loaded.push(`${f} → ${names.join(', ')}`)
    } catch (e) {
      if (String(e.message).includes('sudah terdaftar')) res.skipped.push(f)
      else res.errors.push(`${f}: ${e.message}`)
    }
  }
  return res
}

/** lepas 1 command (by name) */
function unload(name) {
  const key = String(name || '').toLowerCase()
  const cmd = byName.get(key)
  if (!cmd) return false
  for (const [k, v] of byName) if (v === cmd) byName.delete(k)
  const i = all.indexOf(cmd)
  if (i >= 0) all.splice(i, 1)
  if (cmd.__plugin && pluginFiles.has(cmd.__plugin)) {
    const arr = pluginFiles.get(cmd.__plugin).filter(n => n !== key)
    if (arr.length) pluginFiles.set(cmd.__plugin, arr)
    else pluginFiles.delete(cmd.__plugin)
  }
  return true
}

/** reload SEMUA plugin (unload dulu lalu require ulang) */
function reloadPlugins() {
  const files = [...pluginFiles.keys()]
  for (const f of files) {
    for (const name of [...pluginFiles.get(f)]) unload(name)
  }
  const r = loadPlugins()
  r.reloaded = files
  return r
}

function pluginList() {
  return [...pluginFiles.entries()].map(([f, names]) => ({ file: f, commands: names }))
}
function resolve(name) {
  if (!name) return null
  return byName.get(String(name).toLowerCase()) || null
}

function count() {
  return all.length
}

function list() {
  return all.filter(c => !c.hidden)
}

module.exports = {
  resolve,
  register, loadPlugins, unload, reloadPlugins, pluginList, _freshRequire,
  PLUGIN_DIR, count, list, all: byName }
