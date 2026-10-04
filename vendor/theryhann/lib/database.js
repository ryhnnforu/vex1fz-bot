/**
 * Database JSON sederhana (aman untuk Termux, tanpa module native)
 * - auto save (debounce)
 * - auto backup kalau file rusak
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DB_DIR = path.resolve(ROOT, config.databaseFolder)

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

const cache = new Map()
const timers = new Map()

const filePath = name => path.join(DB_DIR, `${name}.json`)

function readRaw (name) {
  const file = filePath(name)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch (e) {
    // file korup -> backup lalu mulai ulang
    try {
      fs.copyFileSync(file, file + '.corrupt-' + Date.now())
    } catch {}
    return null
  }
}

function writeNow (name, data) {
  const file = filePath(name)
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

export function loadDB (name, defaults = {}) {
  if (cache.has(name)) return cache.get(name)
  const raw = readRaw(name)
  let data = raw
  // tipe isi file tidak cocok dengan default (mis. file berisi {} padahal harus [])
  const salahTipe = data === null || data === undefined ||
    (Array.isArray(defaults) && !Array.isArray(data)) ||
    (!Array.isArray(defaults) && Array.isArray(data))
  if (salahTipe) {
    data = Array.isArray(defaults) ? defaults.slice() : { ...defaults }
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && !Array.isArray(data)) Object.assign(data, raw)
  }
  // tambal key default yang hilang (mis. file lama / file kosong hasil reset)
  if (!Array.isArray(data) && !Array.isArray(defaults) && defaults && typeof defaults === 'object') {
    for (const k of Object.keys(defaults)) {
      if (data[k] === undefined) data[k] = defaults[k]
    }
  }
  cache.set(name, data)
  return data
}

export function saveDB (name) {
  const data = cache.get(name)
  if (!data) return
  if (timers.has(name)) clearTimeout(timers.get(name))
  const t = setTimeout(() => {
    try {
      writeNow(name, data)
    } catch (e) {
      console.error('[db] gagal simpan', name, e.message)
    }
  }, 400)
  timers.set(name, t)
}

export function saveNow (name) {
  if (timers.has(name)) clearTimeout(timers.get(name))
  const data = cache.get(name)
  if (data) writeNow(name, data)
}

export function listDB () {
  return fs
    .readdirSync(DB_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
}

/* ================= USER ================= */
const defaultUser = jid => ({
  jid,
  name: '',
  limit: config.limits?.default ?? 30,
  premium: false,
  registered: false,
  age: 0,
  exp: 0,
  level: 1,
  banned: false,
  bannedReason: '',
  autoai: false,
  lastClaim: 0,
  lastChat: 0,
  created: Date.now()
})

export function getUser (jid) {
  const db = loadDB('users', {})
  const def = defaultUser(jid)
  if (!db[jid] || typeof db[jid] !== 'object') {
    db[jid] = def
    saveDB('users')
  } else {
    // tambal field yang hilang (data versi lama / hasil import / restore)
    let ditambal = false
    for (const k of Object.keys(def)) {
      if (db[jid][k] === undefined) { db[jid][k] = def[k]; ditambal = true }
    }
    if (ditambal) saveDB('users')
  }
  return db[jid]
}

export function allUsers () {
  return Object.values(loadDB('users', {}))
}

export function addLimit (jid, amount) {
  const u = getUser(jid)
  u.limit = Math.max(0, (u.limit || 0) + amount)
  saveDB('users')
  return u.limit
}

export function useLimit (jid, amount = 1) {
  const u = getUser(jid)
  if (!config.limits.enable || u.premium) return true
  if ((u.limit || 0) < amount) return false
  u.limit -= amount
  u.exp = (u.exp || 0) + 10
  saveDB('users')
  return true
}

/* ================= GROUP ================= */
export function getGroup (jid) {
  const db = loadDB('groups', {})
  if (!db[jid]) {
    db[jid] = {
      jid,
      welcome: true,
      goodbye: true,
      // mode kartu: 'html' = kartu HTML interaktif (v7.9.1), 'card' = gambar canvas, 'text' = teks+tombol
      welcomeMode: 'html',
      // tema kartu: nama tema di lib/canvas.js atau 'random'
      welcomeTheme: 'random',
      // gambar latar custom kartu (url / path). '' = gradient tema
      welcomeBg: '',
      // template teks. Placeholder: {tag} {name} {group} {desc} {member} {time} {date}
      welcomeText: '',
      leaveText: '',
      antilink: false,
      antidelete: false,
      antitoxic: false,
      antitagsw: false,
      nsfw: false,
      autoai: false,
      mute: false,
      members: 0
    }
    saveDB('groups')
  }
  return db[jid]
}

export function allGroups () {
  return Object.values(loadDB('groups', {}))
}

/* ================= SETTINGS ================= */
export function getSettings () {
  const db = loadDB('settings', {})
  const def = {
    public: config.display.public,
    autoReplyAI: config.ai.autoReply,
    menuMode: config.display.menuMode,
    // gambar header menu. '' = pakai config.display.menuImage/thumbnail
    // nilai khusus: 'banner' / 'banner:<tema>' = banner gradient buatan canvas
    menuImage: '',
    menuTheme: 'midnight',
    readCommand: config.display.readCommand,
    typing: config.display.typing,
    antiCall: config.display.antiCall,
    autoBio: config.display.autoBio,
    botName: config.bot.name,
    footer: config.bot.footer,
    hits: 0,
    uptimeStart: Date.now()
  }
  let changed = false
  for (const k of Object.keys(def)) {
    if (db[k] === undefined) {
      db[k] = def[k]
      changed = true
    }
  }
  if (changed) saveDB('settings')
  return db
}

export function setSetting (key, value) {
  const db = getSettings()
  db[key] = value
  saveDB('settings')
  return value
}

/* ================= STATISTIK ================= */
export function addHit (cmd, jid = null) {
  const db = loadDB('stats', { total: 0, commands: {}, users: {} })
  db.commands = db.commands || {}
  db.users = db.users || {}
  db.total = (db.total || 0) + 1
  db.commands[cmd] = (db.commands[cmd] || 0) + 1
  db.users = db.users || {}
  if (jid) {
    const u = (db.users[jid] = db.users[jid] || { total: 0, commands: {}, last: 0, riwayat: [] })
    u.total = (u.total || 0) + 1
    u.commands = u.commands || {}
    u.commands[cmd] = (u.commands[cmd] || 0) + 1
    u.last = Date.now()
    u.riwayat = [cmd, ...(u.riwayat || [])].slice(0, 30)
    db.users[jid] = u
  }
  saveDB('stats')
  return db
}

/** statistik pemakaian milik satu user (untuk .statistikku / .riwayatku) */
export function getUserStats (jid) {
  const db = loadDB('stats', { total: 0, commands: {}, users: {} })
  return db.users?.[jid] || { total: 0, commands: {}, last: 0, riwayat: [] }
}

export function getStats () {
  const db = loadDB('stats', { total: 0, commands: {}, users: {} })
  db.commands = db.commands || {}
  db.users = db.users || {}
  db.total = db.total || 0
  return db
}

/* ================= AI MEMORY ================= */
export function getMemory (jid) {
  const db = loadDB('memory', {})
  return db[jid] || []
}

export function pushMemory (jid, role, content) {
  const db = loadDB('memory', {})
  if (!db[jid]) db[jid] = []
  db[jid].push({ role, content: String(content).slice(0, 4000) })
  const max = config.ai.memoryLength * 2
  if (db[jid].length > max) db[jid] = db[jid].slice(db[jid].length - max)
  saveDB('memory')
  return db[jid]
}

export function clearMemory (jid) {
  const db = loadDB('memory', {})
  delete db[jid]
  saveDB('memory')
}

export default {
  loadDB,
  saveDB,
  saveNow,
  getUser,
  getGroup,
  getSettings,
  setSetting
}
