/**
 * Kumpulan fungsi pembantu (fetch, format, media, dll)
 * Semua berbasis Node 20+ (fetch native) -> ringan di Termux
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { exec, execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')
export const TMP = path.join(ROOT, 'tmp')
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true })

const UA =
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'

/** fetch JSON dengan timeout + retry */
export async function getJSON (url, options = {}, retry = 2) {
  let lastErr
  for (let i = 0; i <= retry; i++) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json', ...(options.headers || {}) },
        ...options
      }, options.timeout || 45000)
      const text = await res.text()
      try {
        return JSON.parse(text)
      } catch {
        throw new Error('Respon bukan JSON: ' + text.slice(0, 120))
      }
    } catch (e) {
      lastErr = e
      await sleep(700 * (i + 1))
    }
  }
  throw lastErr
}

/** fetch buffer (gambar/video/audio/stiker) */
export async function getBuffer (url, options = {}, retry = 2) {
  let lastErr
  for (let i = 0; i <= retry; i++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { headers: { 'User-Agent': UA, ...(options.headers || {}) }, ...options },
        options.timeout || 60000
      )
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      if (!buf.length) throw new Error('Buffer kosong')
      return buf
    } catch (e) {
      lastErr = e
      await sleep(800 * (i + 1))
    }
  }
  throw lastErr
}

export async function fetchWithTimeout (url, options = {}, timeout = 30000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export const sleep = ms => new Promise(r => setTimeout(r, ms))

/** simpan buffer ke tmp, return path */
export function saveTmp (buffer, ext = 'jpg') {
  const file = path.join(TMP, crypto.randomBytes(6).toString('hex') + '.' + ext)
  fs.writeFileSync(file, buffer)
  return file
}

export function cleanTmp (maxAgeMs = 1000 * 60 * 30) {
  try {
    for (const f of fs.readdirSync(TMP)) {
      const p = path.join(TMP, f)
      const st = fs.statSync(p)
      if (Date.now() - st.mtimeMs > maxAgeMs) fs.unlinkSync(p)
    }
  } catch {}
}

/* ------------------------- FORMAT ------------------------- */
export function formatSize (bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i ? 2 : 0) + ' ' + u[i]
}

export function formatDuration (ms) {
  ms = Math.max(0, Math.floor(ms))
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (d) return `${d} hari ${h} jam ${m} menit`
  if (h) return `${h} jam ${m} menit ${s} detik`
  if (m) return `${m} menit ${s} detik`
  return `${s} detik`
}

export function clockString () {
  const d = new Date()
  return d.toLocaleTimeString('id-ID', { hour12: false })
}

export function dateString () {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function tanggalWIB () {
  return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
}

export function pickRandom (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function capitalize (s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function truncate (s = '', n = 4000) {
  s = String(s)
  if (s.length <= n) return s
  // batas pendek (judul/baris menu) → elipsis rapi; batas panjang → catatan terpotong
  if (n <= 300) return s.slice(0, Math.max(1, n - 1)).replace(/\s+\S*$/, '').trim() + '…'
  return s.slice(0, n) + '\n\n...*(terpotong)*'
}

export function escapeRegex (s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isUrl (s = '') {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(String(s).trim())
}

/** potong teks jadi beberapa bagian (buat broadcast panjang) */
export function chunkText (text, size = 3800) {
  const out = []
  let cur = ''
  for (const line of String(text).split('\n')) {
    if ((cur + '\n' + line).length > size) {
      out.push(cur)
      cur = line
    } else {
      cur = cur ? cur + '\n' + line : line
    }
  }
  if (cur) out.push(cur)
  return out.length ? out : ['']
}

/* ------------------------- MEDIA ------------------------- */
/** deteksi mime dari buffer */
export function sniffMime (buffer) {
  if (!buffer || buffer.length < 12) return 'application/octet-stream'
  const head = buffer.subarray(0, 12)
  if (head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp'
  if (head.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif'
  if (head.subarray(4, 8).toString('latin1') === 'ftyp') return 'video/mp4'
  if (head.subarray(0, 3).toString('latin1') === 'ID3') return 'audio/mpeg'
  if (head.subarray(0, 4).toString('latin1') === 'OggS') return 'audio/ogg'
  if (head.subarray(0, 4).toString('latin1') === '%PDF') return 'application/pdf'
  return 'application/octet-stream'
}

/** konversi gambar ke webp pakai ffmpeg (butuh: pkg install ffmpeg) */
export function toWebp (inputFile, outputFile, { animated = false, sticker = true } = {}) {
  return new Promise((resolve, reject) => {
    const args = animated
      ? ['-i', inputFile, '-vf', "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=single[p];[b][p]paletteuse", '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', outputFile]
      : ['-i', inputFile, '-vf', "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse", '-loop', '0', '-preset', 'default', '-an', '-vsync', '0', outputFile]
    /* v7.15: execFile tanpa shell — filter berisi ';' & ',' tidak lagi dipecah shell (penyebab .s gagal) */
    execFile('ffmpeg', ['-y', ...args], { maxBuffer: 32 * 1024 * 1024 }, (err, so, se) => {
      if (err) return reject(new Error('ffmpeg gagal: ' + (String(se || '').split('\n').filter(Boolean).slice(-2).join(' ') || err.message)))
      if (!fs.existsSync(outputFile)) return reject(new Error('Output webp tidak dibuat'))
      resolve(outputFile)
    })
  })
}

/**
 * Resize gambar pakai jimp (pure JS, aman di Termux tanpa compile)
 * Mendukung jimp v1 (default) dan v0 (fallback)
 */
export async function resizeImage (buffer, w = 300, h = 300) {
  try {
    const mod = await import('jimp')
    const Jimp = mod.Jimp || mod.default
    const img = await Jimp.read(buffer)
    // jimp v1
    if (typeof img.getBuffer === 'function' && Jimp.MIME_JPEG) {
      img.resize({ w, h })
      return await img.getBuffer(Jimp.MIME_JPEG, { quality: 80 })
    }
    // jimp v1 tanpa konstanta mime
    if (typeof img.getBuffer === 'function') {
      img.resize({ w, h })
      return await img.getBuffer('image/jpeg', { quality: 80 })
    }
    // jimp v0
    if (typeof img.getBufferAsync === 'function') {
      img.resize(w, h)
      return await img.getBufferAsync(Jimp.MIME_JPEG || 'image/jpeg')
    }
    return buffer
  } catch (e) {
    return buffer
  }
}

/* ------------------------- LAIN ------------------------- */
export function jsonFormat (obj) {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

export function runtime () {
  return formatDuration(process.uptime() * 1000)
}

export function cpuInfo () {
  try {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus()?.length || 1,
      totalMem: formatSize(os.totalmem()),
      freeMem: formatSize(os.freemem()),
      uptime: formatDuration(os.uptime() * 1000)
    }
  } catch {
    return { platform: '?', arch: '?', cpus: 1, totalMem: '?', freeMem: '?', uptime: '?' }
  }
}

export function processMemory () {
  return formatSize(process.memoryUsage().heapUsed)
}
