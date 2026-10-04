/**
 * lib/thbbridge.js — jembatan THERYHANN-BOT (vendor/theryhann) ke vex1fz
 *
 * Arsitektur:
 *   • Seluruh runtime THB (handlers + 119 features + 107 lib) di-vendor utuh
 *     sebagai ESM (vendor/theryhann, package.json type:module).
 *   • Shim elaina → @japofc/baileys (vendor/theryhann/shims/elaina.mjs).
 *   • Partisi pesan (anti-dobel):
 *       - perintah "." milik THB & BUKAN milik vex1fz  → pump ke THB
 *       - perintah milik vex1fz / tak dikenal          → pipeline vex1fz
 *       - teks polos → trigger vex1fz dulu, lalu THB
 *         (pump berhitung: kalau THB membalas → selesai; kalau tidak → AI vex1fz)
 *   • initHandler(sock, owners) sekali saat koneksi terbuka:
 *     scheduler + sewa + penyimpanan sock THB ikut hidup.
 */
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const config = require('../config')
const { log } = require('./util')

const V = path.join(__dirname, '..', 'vendor', 'theryhann')

let ready = false
let H = null // { handlers, plugins }

/** direktori tulis THB: hormati env, fallback /data (Railway) lalu folder vendor */
function rwDir (envKey, fallbackName) {
  if (process.env[envKey]) return process.env[envKey]
  try {
    if (fs.existsSync('/data') && fs.accessSync('/data', fs.constants.W_OK) === undefined) {
      const d = path.join('/data', fallbackName)
      fs.mkdirSync(d, { recursive: true })
      return d
    }
  } catch (_) {}
  const d = path.join(V, fallbackName)
  try { fs.mkdirSync(d, { recursive: true }) } catch (_) {}
  return d
}

async function init (sock) {
  if (ready) return true
  if (!fs.existsSync(path.join(V, 'handlers', 'message.js'))) {
    log.warn('vendor/theryhann tidak ada — engine THERYHANN nonaktif')
    return false
  }
  process.env.DATABASE_DIR = rwDir('DATABASE_DIR', 'database-rt')
  process.env.TMP_DIR = rwDir('TMP_DIR', 'tmp')
  try {
    const handlers = await import(pathToFileURL(path.join(V, 'handlers', 'message.js')).href)
    const plugins = await import(pathToFileURL(path.join(V, 'lib', 'plugins.js')).href)
    await plugins.loadPlugins()
    handlers.initHandler(sock, [config.ownerNumber])
    globalThis.__sockAktif = sock
    H = { handlers, plugins }
    ready = true
    log.ok(`THERYHANN engine ON — ${plugins.plugins.size} perintah terpasang`)
  } catch (e) {
    log.err('THERYHANN engine gagal init:', e)
    return false
  }
  return true
}

function readyQ () { return ready }
function count () { return ready ? H.plugins.plugins.size : 0 }

/** apakah nama perintah milik registry THB? */
function hasCommand (name) {
  if (!ready || !name) return false
  try { return !!H.plugins.findPlugin(String(name).toLowerCase()) } catch (_) { return false }
}

/** pump mentah ke handler THB (tanpa penghitung) */
async function pump (messages, type = 'notify') {
  if (!ready) return false
  try { await H.handlers.messageHandler(messages, type) } catch (e) { log.warn('THB pump:', e.message) }
  return true
}

/** pump dengan penghitung balasan: true = THB membalas sesuatu */
async function pumpCounted (sock, messages, type = 'notify') {
  if (!ready) return false
  let n = 0
  const origSend = sock.sendMessage
  const origRelay = sock.relayMessage
  sock.sendMessage = function (...a) { n++; return origSend.apply(this, a) }
  if (typeof origRelay === 'function') {
    sock.relayMessage = function (...a) { n++; return origRelay.apply(this, a) }
  }
  try {
    await H.handlers.messageHandler(messages, type)
  } catch (e) {
    log.warn('THB pumpCounted:', e.message)
  } finally {
    sock.sendMessage = origSend
    if (origRelay) sock.relayMessage = origRelay
  }
  return n > 0
}

/**
 * Kirim perintah sintetis ke engine THB (dipakai .thbmenu → .menu THB).
 * Mengembalikan true kalau handler memprosesnya.
 */
async function pumpSynthetic (sock, jid, text, { sender = '', pushName = '', isGroup = false } = {}) {
  if (!ready) return false
  const raw = {
    key: {
      remoteJid: jid,
      fromMe: false,
      id: 'THB' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase(),
      ...(isGroup ? { participant: sender } : {})
    },
    message: { extendedTextMessage: { text: String(text) } },
    pushName: pushName || 'Member',
    messageTimestamp: Math.floor(Date.now() / 1000)
  }
  return pumpCounted(sock, [raw], 'notify')
}

/** event grup (welcome/goodbye/promote THB) — dipanggil dari index.js */
async function onGroupUpdate (update) {
  if (!ready) return
  try { await H.handlers.groupParticipantsHandler(update) } catch (e) { log.warn('THB group evt:', e.message) }
}

/** event pesan dihapus (antidelete THB) */
async function onDelete (update) {
  if (!ready) return
  try { await H.handlers.messageDeleteHandler(update) } catch (e) { log.warn('THB delete evt:', e.message) }
}

/** ringkas menu THB per kategori untuk ditampilkan di menu vex1fz */
function menuSummary () {
  if (!ready) return []
  const cats = new Map()
  for (const p of H.plugins.plugins.values()) {
    const c = p.category || 'Lain'
    if (!cats.has(c)) cats.set(c, 0)
    cats.set(c, cats.get(c) + 1)
  }
  return [...cats.entries()].sort((a, b) => b[1] - a[1])
}

module.exports = { init, ready: readyQ, count, hasCommand, pump, pumpCounted, pumpSynthetic, onGroupUpdate, onDelete, menuSummary, V }
