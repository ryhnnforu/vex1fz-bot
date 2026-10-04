/**
 * Plugin loader — semua file .js di folder features/ otomatis jadi command.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { ensureConfig } from './config-defaults.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const FEATURES_DIR = path.resolve(__dirname, '../features')

/** @type {Map<string, object>} command -> plugin */
export const plugins = new Map()
/** @type {Map<string, string>} alias/command -> command utama */
export const aliases = new Map()
/** @type {Map<string, number>} */
export const cooldowns = new Map()

/* ---------- v7.37.1: log startup yang ringkas ----------
 * Saat loadPlugins (apalagi di server tanpa terminal), baris-baris
 * skip/alias-dipindah dikumpulkan dan dicetak SATU ringkasan, dan
 * console/stdout fitur saat import DISENYAPKAN supaya banner/prompt
 * fitur custom tidak menyampah log Railway. */
let SENYAP_MUAT = false
const muatPindah = []
const muatSkipped = []
const muatError = []
function jalanSenyap (fn) {
  const restore = mulaiSenyap()
  return Promise.resolve(fn()).finally(restore)
}
function mulaiSenyap () {
  const cl = console.log, cw = console.warn, ce = console.error, cd = console.dir
  const sw = process.stdout.write.bind(process.stdout)
  const se = process.stderr.write.bind(process.stderr)
  console.log = () => {}; console.warn = () => {}; console.error = () => {}; console.dir = () => {}
  process.stdout.write = () => true
  process.stderr.write = () => true
  return () => {
    console.log = cl; console.warn = cw; console.error = ce; console.dir = cd
    process.stdout.write = sw; process.stderr.write = se
  }
}

function walk (dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  /* v7.8.3: urutkan nama file supaya urutan pemuatan (dan pemenang alias
     yang bentrok) selalu sama di semua perangkat/filesystem */
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const f of entries) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) out.push(...walk(p))
    else if (f.isFile() && f.name.endsWith('.js')) out.push(p)
  }
  return out
}

/** daftarkan satu objek plugin ke memori */
/**
 * Kumpulkan plugin dari satu export.
 * Mendukung: 1 plugin | array plugin | object berisi banyak plugin (bertingkat).
 * Ini memungkinkan fitur membuat puluhan command lewat factory/tabel.
 */
export function collectPlugins (value, exportName, out = [], seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return out
  if (typeof value.run === 'function' && value.command) {
    // objek plugin yang sama bisa diekspor beberapa kali (mis. array gabungan + default)
    // → daftar sekali saja biar hitungan reload akurat & load lebih cepat
    if (seen.has(value)) return out
    seen.add(value)
    out.push({ exportName, plug: value })
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectPlugins(v, `${exportName}[${i}]`, out, seen))
    return out
  }
  for (const [k, v] of Object.entries(value)) {
    if (k === 'default' && exportName === 'module') continue
    collectPlugins(v, `${exportName}.${k}`, out, seen)
  }
  return out
}

export function registerPlugin (plug, file, fileName, exportName = 'default') {
  const cmds = (Array.isArray(plug.command) ? plug.command : [plug.command])
    .map(c => String(c).toLowerCase())
  const main = cmds[0]
  // hapus alias lama milik command ini
  for (const c of cmds) {
    const old = aliases.get(c)
    if (old && old !== main) {
      if (SENYAP_MUAT) muatPindah.push(`${c}: ${old}->${main}`)
      else console.log(`  ⚠ command "${c}" dipindah dari ${old} -> ${main}`)
      for (const oc of plugins.get(old)?.command || []) aliases.delete(oc)
      plugins.delete(old)
    }
  }
  plugins.set(main, {
    ...plug,
    command: cmds,
    file,
    fileName,
    exportName,
    name: main
  })
  for (const c of cmds) aliases.set(c, main)
  return main
}

export async function loadPlugins () {
  // tambal config lama yang kekurangan key versi baru
  ensureConfig(config)
  plugins.clear()
  aliases.clear()
  muatPindah.length = 0; muatSkipped.length = 0; muatError.length = 0
  SENYAP_MUAT = true
  const senyapImport = !process.stdin.isTTY // server/Railway/test: tanpa terminal
  // senyapkan SELURUH proses muat (import + onLoad) supaya banner/prompt/dump
  // JSON fitur custom tidak menyampah log server
  const pulihkan = senyapImport ? mulaiSenyap() : null
  const files = walk(FEATURES_DIR)
  for (const file of files) {
    const name = path.basename(file)
    try {
      const mod = await import('file://' + file + '?v=' + Date.now())
      // satu file boleh punya banyak plugin (default export + named export)
      const found = []
      const seen = new WeakSet()
      for (const [exportName, value] of Object.entries(mod)) collectPlugins(value, exportName, found, seen)
      if (!found.length) {
        muatSkipped.push(name)
        continue
      }
      for (const { exportName, plug } of found) {
        registerPlugin(plug, file, name, exportName)
        if (typeof plug.onLoad === 'function') await plug.onLoad()
      }
    } catch (e) {
      muatError.push(`${name}: ${e.message}`)
    }
  }
  SENYAP_MUAT = false
  pulihkan?.()
  /* satu ringkasan instead of puluhan baris */
  if (muatSkipped.length) console.log(`  • [skip] ${muatSkipped.length} file tanpa command: ${muatSkipped.join(', ')}`)
  for (const er of muatError) console.log(`  ✗ [error] ${er}`)
  if (muatPindah.length) console.log(`  ⚠ ${muatPindah.length} alias dipindah: ${muatPindah.slice(0, 6).join(', ')}${muatPindah.length > 6 ? ', …' : ''}`)
  return { total: plugins.size, files: files.length }
}

/** reload satu file plugin saja (support banyak export dalam 1 file) */
export async function reloadPlugin (fileName) {
  const file = path.join(FEATURES_DIR, fileName)
  if (!fs.existsSync(file)) throw new Error('File plugin tidak ditemukan: ' + fileName)
  // kalau sebelumnya sudah di-unload (.hapusfitur), reload tetap harus jalan
  try { unloadPlugin(fileName) } catch { /* belum/tidak terdaftar — abaikan */ }
  const mod = await import('file://' + file + '?v=' + Date.now())
  const registered = []
  const found = []
  const seen = new WeakSet()
  for (const [exportName, value] of Object.entries(mod)) collectPlugins(value, exportName, found, seen)
  for (const { exportName, plug } of found) {
    registered.push(registerPlugin(plug, file, fileName, exportName))
  }
  if (!registered.length) throw new Error('Tidak ada plugin valid di ' + fileName)
  return registered
}

/** hapus plugin */
export function unloadPlugin (fileName) {
  const file = path.join(FEATURES_DIR, fileName)
  if (!fs.existsSync(file)) throw new Error('File plugin tidak ditemukan: ' + fileName)
  const removed = []
  for (const [main, p] of [...plugins]) {
    if (path.basename(p.file) === fileName) {
      removed.push(main)
      plugins.delete(main)
      for (const c of p.command) aliases.delete(c)
    }
  }
  if (!removed.length) throw new Error('Plugin tidak terdaftar: ' + fileName)
  return removed.join(', ')
}

export function findPlugin (command) {
  const c = String(command || '').toLowerCase()
  const main = aliases.get(c)
  return main ? { name: main, plugin: plugins.get(main) } : null
}

export function listPlugins () {
  return [...plugins.values()].map(p => ({
    name: p.name,
    command: p.command,
    category: p.category || 'Lainnya',
    description: p.description || '',
    owner: !!p.owner,
    admin: !!p.admin,
    group: !!p.group,
    private: !!p.private,
    premium: !!p.premium,
    limit: p.limit ?? 0,
    cooldown: p.cooldown ?? 0,
    disabled: !!p.disabled,
    fileName: p.fileName || ''
  }))
}

export function categories () {
  const map = new Map()
  for (const p of plugins.values()) {
    if (p.disabled || p.noMenu) continue
    const cat = p.category || 'Lainnya'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(p)
  }
  return map
}

/** cooldown check */
export function isCooldown (key, seconds) {
  if (!seconds) return false
  const now = Date.now()
  const last = cooldowns.get(key) || 0
  if (now - last < seconds * 1000) return Math.ceil((seconds * 1000 - (now - last)) / 1000)
  cooldowns.set(key, now)
  setTimeout(() => cooldowns.delete(key), seconds * 1000 + 100).unref?.()
  return false
}

export default { plugins, aliases, loadPlugins, reloadPlugin, unloadPlugin, findPlugin, listPlugins, categories, isCooldown }
