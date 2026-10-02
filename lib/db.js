/**
 * lib/db.js — database JSON sederhana (tanpa dependensi)
 */
const fs = require('fs')
const path = require('path')
const config = require('../config')

const DEFAULT = {
  users: {},     // jid -> { name, registered, limit, limitDate, banned, ... }
  rpg: {},       // jid -> data RPG
  chats: {},     // jid -> { lastSeen, type } (untuk broadcast)
  games: {},     // sesi game (math/tebak)
  aiRel: {},     // jid -> relasi AI { affection, kasar, nag, ... }
  aiHist: {},    // jid -> riwayat chat AI (8 msg terakhir)
  settings: { mode: config.mode, ai: undefined }
}

let data = null
let saveTimer = null

function load() {
  if (data) return data
  try {
    if (fs.existsSync(config.dbFile)) {
      data = JSON.parse(fs.readFileSync(config.dbFile, 'utf8'))
      // merge aman
      for (const k of Object.keys(DEFAULT)) {
        if (data[k] === undefined) data[k] = JSON.parse(JSON.stringify(DEFAULT[k]))
      }
      return data
    }
  } catch (e) {
    console.error('[db] gagal membuka db, pakai data baru:', e.message)
  }
  data = JSON.parse(JSON.stringify(DEFAULT))
  return data
}

function save() {
  if (!data) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(config.dbFile), { recursive: true })
      fs.writeFileSync(config.dbFile, JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('[db] gagal simpan:', e.message)
    }
  }, 300)
}

function get() { return load() }

function getUser(jid, create = true) {
  const d = load()
  if (!d.users[jid] && create) {
    d.users[jid] = {
      name: null,
      registered: false,
      limit: config.dailyLimit,
      limitDate: new Date().toLocaleDateString('id-ID'),
      banned: false,
      joinedAt: Date.now()
    }
    save()
  }
  return d.users[jid] || null
}

function getRpg(jid, create = true) {
  const d = load()
  if (!d.rpg[jid] && create) {
    d.rpg[jid] = null // hanya dibuat saat .rpgdaftar
  }
  return d.rpg[jid] || null
}

function setRpg(jid, value) {
  const d = load()
  d.rpg[jid] = value
  save()
  return value
}

function resetLimitIfNeeded(user) {
  if (!user) return
  const today = new Date().toLocaleDateString('id-ID')
  if (user.limitDate !== today) {
    user.limitDate = today
    user.limit = config.dailyLimit
    save()
  }
}

function touchChat(jid, type = 'chat') {
  const d = load()
  d.chats[jid] = { lastSeen: Date.now(), type }
  save()
}

function resetAll() {
  data = JSON.parse(JSON.stringify(DEFAULT))
  save()
}

module.exports = { get, load, save, getUser, getRpg, setRpg, resetLimitIfNeeded, touchChat, resetAll }
