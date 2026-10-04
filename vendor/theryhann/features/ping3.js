/**
 * 📡 .ping3 — KARTU DIAGNOSTIK DARK DELUXE + SPEEDTEST NYATA (v7.36.0)
 *  Kontras ping2 (putih): tema gelap + neon, gauge latency animasi,
 *  count-up, grafik bercahaya. Detail maksimal: latency, loop-lag,
 *  uptime, PID, Node, RAM, heap/RSS, disk, OS, CPU+load, down/up
 *  (Cloudflare), stream latency, jumlah plugin, lingkungan, waktu.
 */
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { ping3Html } from '../lib/ping3html.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const run = promisify(execFile)

async function disk () {
  try {
    const { stdout } = await run('df', ['-k', process.cwd()], { timeout: 5000 })
    const b = stdout.trim().split('\n').pop().split(/\s+/)
    return { total: +b[1] / 1048576, used: +b[2] / 1048576 }
  } catch { return { total: 0, used: 0 } }
}
function namaOS () {
  try {
    const r = fs.readFileSync('/etc/os-release', 'utf8').match(/PRETTY_NAME="([^"]+)"/)
    if (r) return r[1]
  } catch {}
  if (process.env.PREFIX?.includes('com.termux')) return `Termux (Android ${os.release().split('-')[0]})`
  return `${os.type()} ${os.release()}`
}
function lingkungan () {
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) return 'RAILWAY'
  if (process.env.PREFIX?.includes('com.termux')) return 'TERMUX'
  if (process.env.KOYEB_RUN_ID || process.env.RENDER) return 'CLOUD'
  return 'LOKAL'
}
async function ukurDownload (bytes = 6_000_000) {
  const t = Date.now()
  const r = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}`, { signal: AbortSignal.timeout(20000) })
  const buf = await r.arrayBuffer()
  return buf.byteLength * 8 / ((Date.now() - t) / 1000) / 1e6
}
async function ukurUpload (bytes = 1_500_000) {
  const body = Buffer.alloc(bytes, 97); const t = Date.now()
  await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body, signal: AbortSignal.timeout(20000) })
  return bytes * 8 / ((Date.now() - t) / 1000) / 1e6
}
async function streamLatency (n = 6) {
  const out = []
  for (let i = 0; i < n; i++) { const t = Date.now(); try { await fetch('https://speed.cloudflare.com/__down?bytes=0', { signal: AbortSignal.timeout(5000) }) } catch {} out.push(Date.now() - t) }
  return out
}
/** lag event-loop: rata-rata selisih timer 100ms (3 sampel) */
async function loopLag () {
  const out = []
  for (let i = 0; i < 3; i++) {
    const t = Date.now()
    await new Promise(r => setTimeout(r, 100))
    out.push(Math.max(0, Date.now() - t - 100))
  }
  return (out.reduce((a, b) => a + b, 0) / out.length).toFixed(1)
}
function jumlahPlugin () {
  try { return fs.readdirSync(path.join(process.cwd(), 'features')).filter(f => f.endsWith('.js')).length } catch { return 0 }
}

export const ping3 = {
  command: ['ping3', 'speedtest3', 'diagnostik3'],
  category: 'Info',
  description: '📡 Kartu diagnostik DARK deluxe: gauge latency animasi, loop-lag, heap/RSS, CPU load, speedtest nyata + grafik neon',
  limit: 0,
  cooldown: 15,
  run: async m => {
    const t0 = Date.now()
    const tPesan = m.raw?.messageTimestamp ? Number(m.raw.messageTimestamp) * 1000 : 0
    try { await m.react?.('📡') } catch {}
    await m.reply('📡 Mengukur… (±15 detik)').catch(() => {})
    const [dsk, down, up, stream, lag] = await Promise.all([disk(), ukurDownload().catch(() => 0), ukurUpload().catch(() => 0), streamLatency().catch(() => []), loopLag()])
    const latency = tPesan ? Math.max(1, Math.min(9999, t0 - tPesan)) : (stream[0] || Date.now() - t0)
    const cpus = os.cpus() || []
    const cpu = cpus[0]?.model?.trim() || 'unknown'
    const heap = process.memoryUsage()
    const d = {
      nama: config.bot.name, latency, loopLag: lag, uptime: process.uptime(), pid: process.pid, node: process.version,
      ramUsed: (os.totalmem() - os.freemem()) / 1073741824, ramTotal: os.totalmem() / 1073741824,
      heapUsed: heap.heapUsed / 1048576, heapTotal: heap.heapTotal / 1048576, rss: heap.rss / 1048576,
      diskUsed: dsk.used, diskTotal: dsk.total,
      os: truncate(namaOS().replace(/GNU\/Linux/, ''), 30), platform: os.platform(), arch: os.arch(),
      cpu: truncate(cpu.replace(/\(R\)|\(TM\)|CPU|Processor|@.*$/gi, '').replace(/\s+/g, ' ').trim() || 'unknown', 30),
      cores: cpus.length || 1, cpuSpeed: cpus[0]?.speed || 0, load: os.loadavg(),
      down, up, stream: stream.length ? stream : undefined,
      versi: config.bot.version, env: lingkungan(), plugins: jumlahPlugin(),
      waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })
    }
    let viaHtml = false
    try { await sendHtmlApp(m.sock, m.jid, { title: `📡 Diagnostik ${config.bot.name}`, html: ping3Html(config.bot.name, d), trustedSources: ['hirara.dev'] }); viaHtml = true } catch (e) { console.error('[ping3] html:', e.message) }
    if (viaHtml) return
    return m.reply(
      `📡 *DIAGNOSTIK ${config.bot.name}*\n\n⚡ ${Math.round(latency)} ms · 🔁 loop ${lag} ms\n⏱️ ${Math.floor(process.uptime() / 3600)}j ${Math.floor(process.uptime() % 3600 / 60)}m · PID ${process.pid} · Node ${process.version}\n🧠 RAM: ${d.ramUsed.toFixed(2)} / ${d.ramTotal.toFixed(2)} GB · heap ${d.heapUsed.toFixed(0)}/${d.heapTotal.toFixed(0)} MB\n💾 Disk: ${d.diskUsed.toFixed(1)} / ${d.diskTotal.toFixed(0)} GB\n🔩 ${cpu} · load ${d.load.map(x => x.toFixed(2)).join('/')}\n⬇️ ${down.toFixed(2)} Mbps · ⬆️ ${up.toFixed(2)} Mbps\n🔌 ${d.env} · 🧩 ${d.plugins} plugin`
    )
  }
}

export default { ping3 }
