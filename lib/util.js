/**
 * lib/util.js — utilitas umum
 */
const os = require('os')

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m'
}

function ts() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' })
}

const log = {
  info: (...a) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.cyan}[INFO]${colors.reset}`, ...a),
  ok: (...a) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.green}[ OK ]${colors.reset}`, ...a),
  warn: (...a) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset}`, ...a),
  err: (...a) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.red}[ERR ]${colors.reset}`, ...a),
  owner: (...a) => console.log(`${colors.gray}[${ts()}]${colors.reset} ${colors.magenta}[OWN ]${colors.reset}`, ...a)
}

/** uptime format: 2d 03h 15m 22s */
function formatUptime(sec) {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

/** sapaan sesuai waktu (Asia/Jakarta) */
function greeting() {
  const hour = parseInt(new Date().toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }), 10)
  if (hour >= 4 && hour < 11) return 'Selamat Pagi'
  if (hour >= 11 && hour < 15) return 'Selamat Siang'
  if (hour >= 15 && hour < 19) return 'Selamat Sore'
  return 'Selamat Malam'
}

function jakartaTime() {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })
}

function jakartaDate() {
  return new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
}

function isUrl(text) {
  return /https?:\/\/\S+/i.test(text || '')
}

function pickUrl(text) {
  const m = (text || '').match(/https?:\/\/\S+/i)
  return m ? m[0].replace(/[),.]+$/, '') : null
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

/** format angka 1000 -> 1.000 */
function fmt(n) { return Number(n || 0).toLocaleString('id-ID') }

/** bar progres sederhana: [██░░░░░░░░] 20% */
function bar(value, max, len = 10) {
  max = max || 1
  const ratio = Math.max(0, Math.min(1, value / max))
  const filled = Math.round(ratio * len)
  return `[${'█'.repeat(filled)}${'░'.repeat(len - filled)}] ${Math.round(ratio * 100)}%`
}

/** potong teks */
function truncate(text, max = 1000) {
  text = String(text ?? '')
  return text.length > max ? text.slice(0, max - 3) + '...' : text
}

function titleCase(s) {
  return String(s || '').replace(/\b\w/g, c => c.toUpperCase())
}

const startTs = Date.now()
function uptimeSeconds() { return Math.floor((Date.now() - startTs) / 1000) }

function sysInfo() {
  return `${os.platform()} ${os.arch()} | node ${process.version}`
}

module.exports = {
  colors, log, formatUptime, greeting, jakartaTime, jakartaDate,
  isUrl, pickUrl, sleep, randomInt, pick, fmt, bar, truncate,
  titleCase, uptimeSeconds, sysInfo
}
