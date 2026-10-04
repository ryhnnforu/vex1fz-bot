/**
 * ============================================================
 *  lib/webvideo.js — STREAM VIDEO untuk kartu .ytlive (v7.36.0)
 * ------------------------------------------------------------
 *  Cerminan lib/webaudio.js untuk video: GET /v/<youtubeId>
 *  • siapkanVideo(id) → { id, url } (unduhan malas: dimulai saat
 *    URL pertama diminta kartu, ambilVideoPenuh: Invidious → Piped
 *    → yt-dlp; pemutar menunggu maks 150 dtk lalu 503).
 *  • daftarkanVideo(id, buf) → simpan buffer yang sudah diunduh
 *    (mis. untuk pesan video WA) agar kartu memakai file sama.
 *  • Cache disk TMP_DIR/video: TTL 6 jam, maks 8 file / 400 MB (LRU).
 * ============================================================
 */
import fs from 'fs'
import path from 'path'
import { config } from '../config.js'
import { baseUrl, webAktif } from './webgame.js'
import { ambilVideoPenuh } from './lagupenuh.js'

const DIR = path.join(config.tmpFolder || 'tmp', 'video')
const HIDUP = 6 * 3600e3
const MAKS_FILE = 8
const MAKS_BYTE = 400 * 1048576
const ID_RE = /^[A-Za-z0-9_-]{11}$/
const JOB = new Map() /* id -> Promise<{file}|null> */
const META = new Map() /* id -> { ts } */

function bersihkan () {
  try {
    if (!fs.existsSync(DIR)) return
    const files = fs.readdirSync(DIR).map(f => {
      const p = path.join(DIR, f)
      try { const s = fs.statSync(p); return { p, mtime: s.mtimeMs, size: s.size } } catch { return null }
    }).filter(Boolean).sort((a, b) => a.mtime - b.mtime)
    let total = files.reduce((a, f) => a + f.size, 0)
    for (const f of files) {
      const kedaluwarsa = Date.now() - f.mtime > HIDUP
      if (kedaluwarsa || files.length > MAKS_FILE || total > MAKS_BYTE) {
        try { fs.rmSync(f.p, { force: true }) } catch {}
        total -= f.size
      }
    }
    for (const [id, m] of META) if (Date.now() - m.ts > HIDUP) { META.delete(id); JOB.delete(id) }
  } catch {}
}

/** daftarkan video YT → URL stream (unduhan malas saat diminta) */
export function siapkanVideo (ytId) {
  if (!webAktif()) return { id: '', url: '' }
  const id = String(ytId || '')
  if (!ID_RE.test(id)) return { id: '', url: '' }
  fs.mkdirSync(DIR, { recursive: true })
  const file = path.join(DIR, id + '.mp4')
  if (!JOB.has(id)) {
    if (fs.existsSync(file)) {
      META.set(id, { ts: Date.now() })
      JOB.set(id, Promise.resolve({ file }))
    } else {
      META.set(id, { ts: Date.now() })
      const p = (async () => {
        const v = await ambilVideoPenuh(id).catch(() => null)
        if (!v?.buf?.length) return null
        fs.writeFileSync(file, v.buf)
        const m = META.get(id); if (m) m.ts = Date.now()
        return { file }
      })()
      p.catch(() => null)
      JOB.set(id, p)
    }
  }
  bersihkan()
  return { id, url: `${baseUrl()}/v/${id}` }
}

/** simpan buffer video yang SUDAH diunduh → URL stream */
export function daftarkanVideo (ytId, buf) {
  if (!webAktif() || !buf?.length) return { id: '', url: '' }
  const id = String(ytId || '')
  if (!ID_RE.test(id)) return { id: '', url: '' }
  fs.mkdirSync(DIR, { recursive: true })
  const file = path.join(DIR, id + '.mp4')
  try { fs.writeFileSync(file, buf) } catch { return { id: '', url: '' } }
  META.set(id, { ts: Date.now() })
  JOB.set(id, Promise.resolve({ file }))
  bersihkan()
  return { id, url: `${baseUrl()}/v/${id}` }
}

export function hostVideo () {
  try { return new URL(baseUrl()).host } catch { return '' }
}

export async function handleVideo (req, res) {
  const url = String(req.url || '')
  const m = url.match(/^\/v\/([A-Za-z0-9_-]{11})(\?|$)/)
  if (!m) return false
  const id = m[1]
  const hdr = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600', 'Accept-Ranges': 'bytes' }
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...hdr, 'Access-Control-Allow-Headers': 'Range' }); res.end(); return true }
  const job = JOB.get(id)
  if (!job) { res.writeHead(404, hdr); res.end('video tidak terdaftar'); return true }
  let hasil = null
  try { hasil = await Promise.race([job, new Promise(r => setTimeout(() => r('timeout'), 150000))]) } catch {}
  if (!hasil || hasil === 'timeout' || !fs.existsSync(hasil.file)) { res.writeHead(hasil === 'timeout' ? 503 : 404, hdr); res.end('video belum tersedia'); return true }
  const size = fs.statSync(hasil.file).size
  const range = String(req.headers.range || '').match(/bytes=(\d*)-(\d*)/)
  if (range && (range[1] || range[2])) {
    const start = range[1] ? parseInt(range[1]) : Math.max(0, size - parseInt(range[2]))
    const end = range[1] && range[2] ? Math.min(parseInt(range[2]), size - 1) : size - 1
    if (start >= size) { res.writeHead(416, { ...hdr, 'Content-Range': `bytes */${size}` }); res.end(); return true }
    res.writeHead(206, { ...hdr, 'Content-Type': 'video/mp4', 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` })
    if (req.method === 'HEAD') { res.end(); return true }
    fs.createReadStream(hasil.file, { start, end }).pipe(res); return true
  }
  res.writeHead(200, { ...hdr, 'Content-Type': 'video/mp4', 'Content-Length': size })
  if (req.method === 'HEAD') { res.end(); return true }
  fs.createReadStream(hasil.file).pipe(res)
  return true
}

export default { siapkanVideo, daftarkanVideo, hostVideo, handleVideo }
