/**
 * 📡 .ping2 — KARTU DIAGNOSTIK HTML 9:16 + SPEEDTEST NYATA (v7.10.1)
 *  Data dari sistem bot: latency (waktu respons pesan), uptime & PID proses,
 *  RAM (os), disk (df), OS/CPU, speedtest download+upload ke Cloudflare
 *  (speed.cloudflare.com, diukur langsung dari server bot), stream latency
 *  (ping HTTP ke Cloudflare beberapa kali).
 */
import os from 'node:os'
import fs from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { pingHtml } from '../lib/pinghtml.js'
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

export const ping2 = {
  command: ['ping2', 'speedtest2', 'diagnostik', 'diagnostics', 'pinghtml', 'statushtml'],
  category: 'Info',
  description: '📡 Kartu diagnostik HTML 9:16: latency, uptime, RAM, disk, OS, CPU, speedtest download/upload nyata (Cloudflare) + grafik latency real-time',
  limit: 0,
  cooldown: 15,
  run: async m => {
    const t0 = Date.now()
    const tPesan = m.raw?.messageTimestamp ? Number(m.raw.messageTimestamp) * 1000 : 0
    try { await m.react?.('📡') } catch {}
    const [dsk, down, up, stream] = await Promise.all([disk(), ukurDownload().catch(() => 0), ukurUpload().catch(() => 0), streamLatency().catch(() => [])])
    const latency = tPesan ? Math.max(1, Math.min(9999, t0 - tPesan)) : (stream[0] || Date.now() - t0)
    const cpu = os.cpus()?.[0]?.model?.trim() || 'unknown'
    const d = {
      nama: config.bot.name, latency, uptime: process.uptime(), pid: process.pid,
      ramUsed: (os.totalmem() - os.freemem()) / 1073741824, ramTotal: os.totalmem() / 1073741824,
      diskUsed: dsk.used, diskTotal: dsk.total,
      os: truncate(namaOS().replace(/GNU\/Linux/, ''), 26), platform: os.platform(), arch: os.arch(), cpu: truncate(cpu.replace(/\(R\)|\(TM\)|CPU|Processor|@.*$/gi, '').replace(/\s+/g, ' ').trim() || 'unknown', 24), cores: os.cpus()?.length || 1,
      down, up, stream: stream.length ? stream : undefined, versi: config.bot.version,
      waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false })
    }
    let viaHtml = false
    try { await sendHtmlApp(m.sock, m.jid, { title: `📡 Diagnostik ${config.bot.name}`, html: pingHtml(config.bot.name, d), trustedSources: ['hirara.dev'] }); viaHtml = true } catch (e) { console.error('[ping2] html:', e.message) }
    if (viaHtml) return
    return m.reply(
      `📡 *DIAGNOSTIK ${config.bot.name}*\n\n⚡ Latency: ${Math.round(latency)} ms\n⏱️ Uptime: ${Math.floor(process.uptime() / 3600)}j ${Math.floor(process.uptime() % 3600 / 60)}m · PID ${process.pid}\n🧠 RAM: ${d.ramUsed.toFixed(2)} / ${d.ramTotal.toFixed(2)} GB\n💾 Disk: ${d.diskUsed.toFixed(1)} / ${d.diskTotal.toFixed(0)} GB\n🖥️ ${namaOS()} · ${os.arch()}\n🔩 ${cpu} · ${d.cores} core\n⬇️ ${down.toFixed(2)} Mbps · ⬆️ ${up.toFixed(2)} Mbps\n📈 Latency stream: ${stream.join(', ')} ms`
    )
  }
}

export default { ping2 }
