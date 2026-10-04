/**
 * ============================================================
 *  lib/webaudio.js — STREAM LAGU PENUH untuk kartu HTML (v7.25.0)
 * ------------------------------------------------------------
 *  Kartu WA hanya muat ±0.5 MB, jadi lagu penuh (3–5 menit, 3–5 MB)
 *  tidak bisa ditanam. Solusi: bot menyajikan audionya lewat server web
 *  yang sama dengan web game (Railway PUBLIC_URL):  GET /a/<id>
 *  • id dibuat saat kartu disiapkan (judul+artis) → unduhan lagu penuh
 *    dimulai di latar (ambilLaguPenuh: theresav → yt-dlp).
 *  • Saat kartu meminta /a/<id>: kalau sudah siap → kirim MP3 (dukung
 *    Range agar seekbar bisa loncat); kalau masih diunduh → tunggu maks
 *    90 dtk lalu kirim; gagal → 404 (kartu otomatis pakai cuplikan 30 dtk).
 *  • Cache disk di TMP_DIR/audio, dibersihkan setelah 6 jam.
 * ============================================================
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { config } from '../config.js'
import { baseUrl, webAktif } from './webgame.js'
import { ambilLaguPenuh, durasiFile } from './lagupenuh.js'

const DIR = path.join(config.tmpFolder || 'tmp', 'audio')
const HIDUP = 6 * 3600e3
const JOB = new Map() /* id -> Promise<{file,durasi}|null> */
const META = new Map() /* id -> { judul, artis, file, durasi, ts } */

const idLagu = (judul, artis) => crypto.createHash('md5').update(`${judul}||${artis}`.toLowerCase()).digest('hex').slice(0, 12)

function bersihkan () {
  try {
    if (!fs.existsSync(DIR)) return
    for (const f of fs.readdirSync(DIR)) { const p = path.join(DIR, f); try { if (Date.now() - fs.statSync(p).mtimeMs > HIDUP) fs.rmSync(p, { force: true }) } catch {} }
    for (const [id, m] of META) if (Date.now() - m.ts > HIDUP) { META.delete(id); JOB.delete(id) }
  } catch {}
}

/** daftarkan lagu → mulai unduh di latar; kembalikan URL publik (atau '' kalau web tidak aktif) */
export function siapkanStream (judul, artis = '') {
  if (!webAktif()) return { id: '', url: '' }
  const id = idLagu(judul, artis)
  fs.mkdirSync(DIR, { recursive: true })
  const file = path.join(DIR, id + '.mp3')
  if (!JOB.has(id)) {
    if (fs.existsSync(file)) {
      META.set(id, { judul, artis, file, durasi: 0, ts: Date.now() }); JOB.set(id, Promise.resolve({ file, durasi: 0 }))
    } else {
      META.set(id, { judul, artis, file, durasi: 0, ts: Date.now() })
      const p = (async () => {
        const full = await ambilLaguPenuh(judul, artis).catch(() => null)
        if (!full?.buf) return null
        fs.writeFileSync(file, full.buf)
        const durasi = full.durasi || await durasiFile(full.buf).catch(() => 0) || 0
        const m = META.get(id); if (m) m.durasi = durasi
        return { file, durasi }
      })()
      p.catch(() => null)
      JOB.set(id, p)
    }
  }
  bersihkan()
  return { id, url: `${baseUrl()}/a/${id}` }
}

/** daftarkan buffer lagu penuh yang SUDAH diunduh (dipakai .play/.play3) → URL stream */
export function daftarkanBuffer (judul, artis, buf, durasi = 0) {
  if (!webAktif() || !buf?.length) return { id: '', url: '' }
  const id = idLagu(judul, artis)
  fs.mkdirSync(DIR, { recursive: true })
  const file = path.join(DIR, id + '.mp3')
  try { fs.writeFileSync(file, buf) } catch { return { id: '', url: '' } }
  META.set(id, { judul, artis, file, durasi, ts: Date.now() }); JOB.set(id, Promise.resolve({ file, durasi }))
  return { id, url: `${baseUrl()}/a/${id}` }
}
/** durasi lagu penuh kalau sudah diketahui (detik) */
export function durasiStream (id) { return META.get(id)?.durasi || 0 }

/** host publik untuk trusted_sources kartu */
export function hostStream () { try { return new URL(baseUrl()).hostname } catch { return '' } }
/** endpoint untuk kartu: stream on-the-fly & pencarian */
export function endpointStream () { return webAktif() ? { stream: baseUrl() + '/a', cari: baseUrl() + '/cari' } : { stream: '', cari: '' } }

/** handler HTTP: GET /a/<id>  → audio/mpeg (Range OK) */
/** v7.29.0 — daftarkan lagu YouTube (by videoId) → unduh audio via yt-dlp di latar; URL /a/<id> */
export function siapkanStreamYt (videoId, judul = '', artis = '') {
  if (!webAktif()) return { id: '', url: '' }
  const id = idLagu('yt:' + videoId, '')
  fs.mkdirSync(DIR, { recursive: true })
  const file = path.join(DIR, id + '.mp3')
  if (!JOB.has(id)) {
    META.set(id, { judul, artis, file, durasi: 0, ts: Date.now() })
    if (fs.existsSync(file)) JOB.set(id, Promise.resolve({ file, durasi: 0 }))
    else {
      const p = (async () => {
        const { execFile } = await import('node:child_process'); const { promisify } = await import('node:util'); const run = promisify(execFile)
        const out = file.replace(/\.mp3$/, '')
        await run('yt-dlp', ['-x', '--audio-format', 'mp3', '--audio-quality', '6', '--no-playlist', '--max-filesize', '30m', '-o', `${out}.%(ext)s`, `https://www.youtube.com/watch?v=${videoId}`], { timeout: 240000, maxBuffer: 1 << 24 }).catch(() => null)
        if (!fs.existsSync(file)) {
          /* post-processing yt-dlp gagal (mis. ffprobe tidak ada) → konversi manual pakai ffmpeg */
          const mentah = fs.readdirSync(DIR).find(f => f.startsWith(id + '.') && !f.endsWith('.mp3'))
          if (!mentah) return null
          await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(DIR, mentah), '-vn', '-ac', '2', '-b:a', '128k', file], { timeout: 240000 }).catch(() => null)
          fs.rmSync(path.join(DIR, mentah), { force: true })
          if (!fs.existsSync(file)) return null
        }
        const durasi = await durasiFile(fs.readFileSync(file)).catch(() => 0) || 0
        const m = META.get(id); if (m) m.durasi = durasi
        return { file, durasi }
      })()
      p.catch(e => console.log('[ytrich] unduh gagal', videoId, e.message))
      JOB.set(id, p)
    }
  }
  bersihkan()
  return { id, url: `${baseUrl()}/a/${id}` }
}

export async function handleAudio (req, res) {
  const url = String(req.url || '')
  /* /ycari?q=  → pencarian YouTube untuk kartu .ytrich (v7.29.0) */
  if (/^\/ycari\?/.test(url)) {
    const q = String(new URL(url, 'http://x').searchParams.get('q') || '').slice(0, 80)
    const { cariYoutube } = await import('./ytcari.js')
    const hasil = q ? await cariYoutube(q, 6).catch(() => []) : []
    const tracks = hasil.map(t => { const st = siapkanStreamYt(t.id, t.judul, t.artis); return { judul: t.judul, artis: t.artis, cover: t.cover, url: '', durasi: t.durasi, dur: t.durasi, penuh: st.url, durPenuh: t.durasi, isPenuh: true } })
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ ok: true, tracks })); return true
  }
  /* /cari?q=  → pencarian lagu untuk kartu (kalau JSONP Deezer diblokir webview) */
  if (/^\/cari\?/.test(url)) {
    const q = String(new URL(url, 'http://x').searchParams.get('q') || '').slice(0, 80)
    const { cariLagu } = await import('./musikplayer.js')
    const hasil = q ? await cariLagu(q, 6).catch(() => []) : []
    const tracks = hasil.map(t => { const st = siapkanStream(t.judul, t.artis); return { judul: t.judul, artis: t.artis, cover: t.coverKecil || t.cover, url: t.preview, durasi: 30, dur: t.durasiAsli || 0, penuh: st.url, durPenuh: t.durasiAsli || 0 } })
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ ok: true, tracks })); return true
  }
  let m = url.match(/^\/a\/([a-f0-9]{12})(\?|$)/)
  if (!m && /^\/a\?/.test(url)) {
    /* /a?judul=&artis=  → daftarkan on-the-fly (hasil pencarian di kartu) */
    const sp = new URL(url, 'http://x').searchParams
    const judul = String(sp.get('judul') || '').slice(0, 120), artis = String(sp.get('artis') || '').slice(0, 80)
    if (!judul) { res.writeHead(400); res.end('judul kosong'); return true }
    const st = siapkanStream(judul, artis)
    m = [null, st.id]
  }
  if (!m) return false
  const id = m[1]
  const hdr = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600', 'Accept-Ranges': 'bytes' }
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...hdr, 'Access-Control-Allow-Headers': 'Range' }); res.end(); return true }
  const job = JOB.get(id)
  if (!job) { res.writeHead(404, hdr); res.end('lagu tidak terdaftar'); return true }
  let hasil = null
  try { hasil = await Promise.race([job, new Promise(r => setTimeout(() => r('timeout'), 90000))]) } catch {}
  if (!hasil || hasil === 'timeout' || !fs.existsSync(hasil.file)) { res.writeHead(hasil === 'timeout' ? 503 : 404, hdr); res.end('lagu penuh belum tersedia'); return true }
  const size = fs.statSync(hasil.file).size
  const range = String(req.headers.range || '').match(/bytes=(\d*)-(\d*)/)
  if (range && (range[1] || range[2])) {
    const start = range[1] ? parseInt(range[1]) : Math.max(0, size - parseInt(range[2]))
    const end = range[1] && range[2] ? Math.min(parseInt(range[2]), size - 1) : size - 1
    if (start >= size) { res.writeHead(416, { ...hdr, 'Content-Range': `bytes */${size}` }); res.end(); return true }
    res.writeHead(206, { ...hdr, 'Content-Type': 'audio/mpeg', 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` })
    if (req.method === 'HEAD') return res.end(), true
    fs.createReadStream(hasil.file, { start, end }).pipe(res); return true
  }
  res.writeHead(200, { ...hdr, 'Content-Type': 'audio/mpeg', 'Content-Length': size })
  if (req.method === 'HEAD') return res.end(), true
  fs.createReadStream(hasil.file).pipe(res)
  return true
}

export default { siapkanStream, durasiStream, hostStream, handleAudio }
