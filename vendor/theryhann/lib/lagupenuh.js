/**
 * lib/lagupenuh.js — ambil LAGU PENUH (bukan preview 30 dtk) untuk .play (v7.36.0)
 * Urutan sumber audio:
 *   1) theresav (key) → 2) Audius (tanpa key) → 3) yt-dlp (self-update + anti-blokir)
 *   4) Invidious (tanpa key) → 5) Piped (tanpa key)
 *   6) gagal semua → pemanggil memakai preview 30 dtk
 * Video: ambilVideoPenuh (Invidious → Piped → yt-dlp).
 * Bila hasil > batas tanam, ffmpeg (jika ada) mengecilkan bitrate agar
 * tetap bisa ditanam ke kartu HTML (webview WA memblokir URL luar).
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { config } from '../config.js'
import { getSettings } from './database.js'

const run = promisify(execFile)
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
const apiKey = () => String(getSettings().theresavKey || process.env.THERESAV_APIKEY || config.apikeys?.theresav || '').trim()

async function adaBin (b) { try { await run(b, [b === 'ffmpeg' ? '-version' : '--version'], { timeout: 8000 }); return true } catch { return false } }

/* ---- 1) theresav / spotify ---- */
export async function viaTheresav (judul, artis) {
  const key = apiKey(); if (!key) throw new Error('tanpa key')
  const H = { 'x-apikey': key, Authorization: `Bearer ${key}`, 'User-Agent': UA, Accept: 'application/json' }
  const s = new URL('/api/search/spotify', 'https://api.theresav.eu'); s.searchParams.set('query', `${judul} ${artis}`)
  const sj = await (await fetch(s, { headers: H, signal: AbortSignal.timeout(30000) })).json()
  const list = sj.result?.tracks || sj.result || sj.data || []
  const t = (Array.isArray(list) ? list : [])[0]
  const url = t?.spotifyUrl || t?.spotify_url || t?.url || t?.external_urls?.spotify
  if (!url) throw new Error('spotify tidak ketemu')
  const d = new URL('/api/download/spotify', 'https://api.theresav.eu'); d.searchParams.set('url', url)
  const dj = await (await fetch(d, { headers: H, signal: AbortSignal.timeout(60000) })).json()
  const r = dj.result || {}
  const dl = r.downloadUrl || r.download_url || r.url || r.audio
  if (!dl) throw new Error('link download kosong')
  const a = await fetch(dl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180000) })
  if (!a.ok) throw new Error(`HTTP ${a.status}`)
  const buf = Buffer.from(await a.arrayBuffer()); if (buf.length < 50000) throw new Error('file kecil')
  const n = await normalisasiMp3(buf)
  return { buf: n.buf, mime: 'audio/mpeg', sumber: 'Spotify', durasi: Math.round((r.duration_ms || r.durationMs || 0) / 1000) || 0 }
}

/* ---- 2) yt-dlp ---- */
export async function viaYtdlp (judul, artis) {
  if (!(await adaBin('yt-dlp'))) throw new Error('yt-dlp tidak terpasang')
  const out = path.join(os.tmpdir(), `thery_${Date.now()}`)
  await run('yt-dlp', ['-x', '--audio-format', 'mp3', '--audio-quality', '6', '--no-playlist', '--max-filesize', '25m', ...YT_ARGS, '-o', `${out}.%(ext)s`, `ytsearch1:${judul} ${artis} audio`], { timeout: 180000, maxBuffer: 1 << 24 })
  const f = `${out}.mp3`; if (!fs.existsSync(f)) throw new Error('unduhan kosong')
  const buf = fs.readFileSync(f); fs.rmSync(f, { force: true })
  return { buf, mime: 'audio/mpeg', sumber: 'YouTube', durasi: 0 }
}

/* ---- yt-dlp: argumen anti-blokir + update mandiri 1x per proses ---- */
const YT_ARGS = ['--socket-timeout', '30', '--retries', '2', '--no-cache-dir', '--extractor-args', 'youtube:player_client=android,web']
let _ytdlpUpdate = false
export async function pastikanYtdlp () {
  if (_ytdlpUpdate) return
  _ytdlpUpdate = true
  try { await run('yt-dlp', ['-U'], { timeout: 120000 }) } catch {}
}

/* ---- kecocokan judul (0..1) untuk memilih hasil terbaik ---- */
export function skorJudul (a, b) {
  const tok = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 1))
  const A = tok(a), B = tok(b)
  if (!A.size || !B.size) return 0
  let sama = 0
  for (const w of A) if (B.has(w)) sama++
  return sama / Math.max(A.size, B.size)
}

/* ---- 3) Audius (resmi, gratis, tanpa key — full track + stream) ---- */
export async function viaAudius (judul, artis = '') {
  const q = encodeURIComponent(`${judul} ${artis}`.trim())
  const r = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${q}&app_name=THERYHANNBOT`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const j = await r.json()
  const daftar = (j.data || []).filter(t => (t.duration || 0) >= 45 && !t.is_delete)
  if (!daftar.length) throw new Error('tidak ketemu')
  const target = `${judul} ${artis}`
  daftar.sort((x, y) => skorJudul(target, `${y.title} ${y.user?.handle || y.user?.name || ''}`) - skorJudul(target, `${x.title} ${x.user?.handle || x.user?.name || ''}`))
  const t = daftar[0]
  if (skorJudul(target, `${t.title} ${t.user?.handle || t.user?.name || ''}`) < 0.3) throw new Error('tidak cocok')
  const s = await fetch(`https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=THERYHANNBOT`, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(120000) })
  if (!s.ok) throw new Error(`stream HTTP ${s.status}`)
  const buf = Buffer.from(await s.arrayBuffer())
  if (buf.length < 80000) throw new Error('file kecil')
  const n = await normalisasiMp3(buf)
  return { buf: n.buf, mime: 'audio/mpeg', sumber: 'Audius', durasi: Math.round(t.duration || 0) }
}

/* ---- daftar instance Invidious segar (cache 6 jam) + bawaan ---- */
let _invCache = { ts: 0, list: [] }
const INV_BAWAAN = ['inv.nadeko.net', 'inv.tux.pizza', 'vid.puffyan.us', 'invidious.nerdvpn.de', 'iv.melmac.space']
export async function daftarInv () {
  if (Date.now() - _invCache.ts < 6 * 3600e3 && _invCache.list.length) return _invCache.list
  try {
    const r = await fetch('https://api.invidious.io/instances.json', { signal: AbortSignal.timeout(15000) })
    const j = await r.json()
    const segar = (Array.isArray(j) ? j : []).filter(([d, o]) => d && o && typeof o === 'object' && o.api === true && o.type === 'https' && !/\.(onion|i2p|ygg|loki)$/i.test(d)).map(([d]) => String(d)).slice(0, 10)
    if (segar.length >= 2) { _invCache = { ts: Date.now(), list: segar }; return segar }
  } catch {}
  return _invCache.list.length ? _invCache.list : INV_BAWAAN
}

async function idYoutube (judul, artis) {
  const { cariYoutube } = await import('./ytcari.js')
  const hasil = await cariYoutube(`${judul} ${artis}`, 3)
  if (!hasil[0]?.id) throw new Error('video tidak ketemu')
  return hasil[0]
}

/* ---- 4) Invidious: audio YT via latest_version (itag 140/139 m4a, 251 opus) ---- */
export async function viaInvidious (judul, artis = '', videoId = '') {
  let id = videoId, dur = 0
  if (!id) { const v = await idYoutube(judul, artis); id = v.id; dur = v.durasi || 0 }
  const hosts = await daftarInv()
  let err = null
  for (const h of hosts.slice(0, 3)) {
    for (const itag of ['140', '139', '251']) {
      try {
        const r = await fetch(`https://${h}/latest_version?id=${id}&itag=${itag}`, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60000) })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const buf = Buffer.from(await r.arrayBuffer())
        if (buf.length < 80000) throw new Error('file kecil')
        const n = await normalisasiMp3(buf)
        return { buf: n.buf, mime: 'audio/mpeg', sumber: 'YouTube', durasi: dur }
      } catch (e) { err = e }
    }
  }
  throw err || new Error('semua instance gagal')
}

/* ---- 5) Piped: audio YT via /streams/<id> ---- */
const PIPED = ['pipedapi.r4fo.com', 'api-piped.mha.fi', 'pipedapi.reallyaweso.me', 'pipedapi.leptons.xyz', 'pipedapi.adminforge.de', 'pipedapi.nosebs.ru']
export async function viaPiped (judul, artis = '', videoId = '') {
  let id = videoId
  if (!id) id = (await idYoutube(judul, artis)).id
  let err = null
  for (const h of PIPED) {
    try {
      const r = await fetch(`https://${h}/streams/${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      const aud = (j.audioStreams || []).filter(s => s.url).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      if (!aud?.url) throw new Error('tanpa audio')
      const d = await fetch(aud.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) })
      if (!d.ok) throw new Error(`dl HTTP ${d.status}`)
      const buf = Buffer.from(await d.arrayBuffer())
      if (buf.length < 80000) throw new Error('file kecil')
      const n = await normalisasiMp3(buf)
      return { buf: n.buf, mime: 'audio/mpeg', sumber: 'YouTube', durasi: Math.round(j.duration || 0) }
    } catch (e) { err = e }
  }
  throw err || new Error('semua piped gagal')
}

/* ---- video penuh utk .ytlive: Invidious (itag 18 = 360p mp4) → Piped → yt-dlp ---- */
export async function viaInvidiousVideo (id) {
  const hosts = await daftarInv()
  let err = null
  for (const h of hosts.slice(0, 3)) {
    try {
      const r = await fetch(`https://${h}/latest_version?id=${id}&itag=18`, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(120000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length < 100000) throw new Error('file kecil')
      if (buf.length > 60 * 1048576) throw new Error('terlalu besar')
      return { buf, mime: 'video/mp4', sumber: 'YouTube' }
    } catch (e) { err = e }
  }
  throw err || new Error('semua instance gagal')
}
export async function viaPipedVideo (id) {
  let err = null
  for (const h of PIPED) {
    try {
      const r = await fetch(`https://${h}/streams/${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      const v = (j.videoStreams || []).filter(s => s.url && !s.videoOnly && (s.codec || '').includes('avc')).sort((a, b) => (a.height || 9999) - (b.height || 9999))[0]
        || (j.videoStreams || []).filter(s => s.url && !s.videoOnly)[0]
      if (!v?.url) throw new Error('tanpa video+audio')
      const d = await fetch(v.url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) })
      if (!d.ok) throw new Error(`dl HTTP ${d.status}`)
      const buf = Buffer.from(await d.arrayBuffer())
      if (buf.length < 100000) throw new Error('file kecil')
      if (buf.length > 60 * 1048576) throw new Error('terlalu besar')
      return { buf, mime: 'video/mp4', sumber: 'YouTube' }
    } catch (e) { err = e }
  }
  throw err || new Error('semua piped gagal')
}
export async function ambilVideoPenuh (id) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(id || ''))) throw new Error('id video salah')
  pastikanYtdlp().catch(() => {})
  const catat = []
  try { return await viaInvidiousVideo(id) } catch (e) { catat.push('inv: ' + String(e.message || e).slice(0, 60)) }
  try { return await viaPipedVideo(id) } catch (e) { catat.push('piped: ' + String(e.message || e).slice(0, 60)) }
  try { return await ambilVideo(`https://youtu.be/${id}`, { max: '45m' }) } catch (e) { catat.push('ytdlp: ' + String(e.message || e).slice(0, 60)) }
  console.log('[ytlive] video gagal →', catat.join(' | '))
  return null
}

/* ---- kecilkan agar bisa ditanam ---- */
export async function durasiFile (buf) {
  if (!(await adaBin('ffprobe'))) return 0
  const i = path.join(os.tmpdir(), `pr_${Date.now()}.bin`); fs.writeFileSync(i, buf)
  try { const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', i], { timeout: 20000 }); return Math.round(parseFloat(stdout) || 0) } catch { return 0 } finally { fs.rmSync(i, { force: true }) }
}
let _opus = null
async function adaOpus () { if (_opus !== null) return _opus; try { const { stdout } = await run('ffmpeg', ['-hide_banner', '-encoders'], { timeout: 15000 }); _opus = /libopus/.test(stdout) } catch { _opus = false } return _opus }
/**
 * Kecilkan audio agar muat di kartu HTML WhatsApp (payload dibatasi ±0,7 MB, terbukti lapangan).
 * Prioritas Opus (ogg) — 12–32 kbps masih enak didengar; fallback MP3 mono kalau libopus tak ada.
 */
export async function kecilkan (buf, targetBytes, durasi = 0, opt = {}) {
  if ((buf.length <= targetBytes && !opt.potong) || !(await adaBin('ffmpeg'))) return null
  if (!durasi) durasi = await durasiFile(buf)
  let dur = durasi || 240
  if (opt.potong && opt.potong < dur) dur = opt.potong
  const opus = await adaOpus()
  const kbps = Math.max(opus ? 10 : 16, Math.min(opus ? 48 : 48, Math.floor((targetBytes * 8 * 0.94) / (dur * 1000))))
  const i = path.join(os.tmpdir(), `in_${Date.now()}.bin`), o = i.replace('.bin', opus ? '.ogg' : '.mp3')
  fs.writeFileSync(i, buf)
  try {
    const args = opus
      ? ['-y', '-loglevel', 'error', '-i', i, ...(opt.potong ? ['-t', String(opt.potong)] : []), '-vn', '-ac', kbps >= 32 ? '2' : '1', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,lowpass=f=' + (kbps >= 24 ? 12000 : kbps >= 16 ? 9000 : 7000), '-c:a', 'libopus', '-b:a', `${kbps}k`, '-vbr', 'on', '-compression_level', '10', '-frame_duration', '60', '-application', 'audio', '-map_metadata', '-1', o]
      : ['-y', '-loglevel', 'error', '-i', i, ...(opt.potong ? ['-t', String(opt.potong)] : []), '-vn', '-ac', '1', '-ar', kbps >= 32 ? '32000' : kbps >= 24 ? '22050' : '16000', '-b:a', `${kbps}k`, '-map_metadata', '-1', o]
    await run('ffmpeg', args, { timeout: 240000 })
    const r = fs.readFileSync(o); return r.length <= targetBytes * 1.08 ? { buf: r, mime: opus ? 'audio/ogg' : 'audio/mpeg', kbps, codec: opus ? 'opus' : 'mp3' } : null
  } catch { return null } finally { fs.rmSync(i, { force: true }); fs.rmSync(o, { force: true }) }
}
/** pastikan file benar-benar MP3 valid (WhatsApp menolak file rusak/format lain) */
export async function normalisasiMp3 (buf) {
  const isMp3 = buf.slice(0, 3).toString() === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
  if (isMp3 || !(await adaBin('ffmpeg'))) return { buf, mime: 'audio/mpeg' }
  const i = path.join(os.tmpdir(), `nm_${Date.now()}.bin`), o = i.replace('.bin', '.mp3'); fs.writeFileSync(i, buf)
  try { await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', i, '-vn', '-ac', '2', '-b:a', '128k', o], { timeout: 180000 }); return { buf: fs.readFileSync(o), mime: 'audio/mpeg' } } catch { return { buf, mime: 'audio/mpeg' } } finally { fs.rmSync(i, { force: true }); fs.rmSync(o, { force: true }) }
}

/** @returns {Promise<{buf:Buffer,mime:string,sumber:string,durasi:number}|null>} */
export async function ambilLaguPenuh (judul, artis = '') {
  pastikanYtdlp().catch(() => {})
  const catat = []
  for (const f of [viaTheresav, viaAudius, viaYtdlp, viaInvidious, viaPiped]) {
    try { return await f(judul, artis) } catch (e) { catat.push(`${f.name}: ${String(e.message || e).slice(0, 80)}`) }
  }
  console.log('[play] lagu penuh tidak tersedia →', catat.join(' | '))
  return null
}

/** kecilkan cover jadi JPEG ≤ ukuran px (ffmpeg) — agar payload kartu ringan */
export async function kecilkanCover (buf, px = 320) {
  if (!(await adaBin('ffmpeg'))) return buf
  const i = path.join(os.tmpdir(), `cv_${Date.now()}.img`), o = i.replace('.img', '.jpg'); fs.writeFileSync(i, buf)
  try { await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', i, '-vf', `scale=${px}:${px}:force_original_aspect_ratio=increase,crop=${px}:${px}`, '-q:v', '8', o], { timeout: 30000 }); const r = fs.readFileSync(o); return r.length < buf.length ? r : buf } catch { return buf } finally { fs.rmSync(i, { force: true }); fs.rmSync(o, { force: true }) }
}

/* ======================= VIDEO (.playvid) ======================= */
/**
 * Ambil video (mp4) dari judul / link: yt-dlp (YouTube search, TikTok, IG, dll).
 * @returns {Promise<{buf:Buffer,judul:string,artis:string,durasi:number,thumb:string,sumber:string}|null>}
 */
export async function ambilVideo (q, opt = {}) {
  pastikanYtdlp().catch(() => {})
  const maxSize = opt.max || '80m'
  if (!(await adaBin('yt-dlp'))) throw new Error('yt-dlp tidak terpasang — Termux: pkg install python ffmpeg && pip install -U yt-dlp')
  const out = path.join(os.tmpdir(), `vid_${Date.now()}`)
  const target = /^https?:\/\//i.test(q) ? q : `ytsearch1:${q}`
  const { stdout } = await run('yt-dlp', [...YT_ARGS, '-f', 'bv*[height<=480][ext=mp4]+ba[ext=m4a]/b[height<=480][ext=mp4]/b[ext=mp4]/b', '--merge-output-format', 'mp4', '--no-playlist', '--max-filesize', maxSize, '--print', 'after_move:%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s\t%(extractor)s', '-o', `${out}.%(ext)s`, target], { timeout: 300000, maxBuffer: 1 << 24 })
  const f = fs.existsSync(`${out}.mp4`) ? `${out}.mp4` : fs.readdirSync(os.tmpdir()).map(x => path.join(os.tmpdir(), x)).find(x => x.startsWith(out))
  if (!f) throw new Error('unduhan video kosong')
  const [judul = 'Video', artis = '-', durasi = '0', thumb = '', ext = 'yt'] = String(stdout).trim().split('\n').pop().split('\t')
  const buf = fs.readFileSync(f); fs.rmSync(f, { force: true })
  /* URL streaming langsung (mp4 progresif) untuk dicoba webview; bisa kedaluwarsa ±6 jam */
  let url = ''
  try { const r = await run('yt-dlp', [...YT_ARGS, '-f', 'b[height<=360][ext=mp4][protocol^=http]/b[ext=mp4][protocol^=http]/b[protocol^=http]', '--no-playlist', '-g', target], { timeout: 60000 }); url = String(r.stdout).trim().split('\n')[0] || '' } catch {}
  return { buf, url, judul, artis, durasi: Math.round(+durasi) || 0, thumb, sumber: /youtube/i.test(ext) ? 'YouTube' : /tiktok/i.test(ext) ? 'TikTok' : ext }
}
/** kecilkan video agar muat di kartu: 240p, h264 baseline, audio opus/aac rendah; bitrate dari durasi */
export async function kecilkanVideo (buf, targetBytes, durasi = 0, opt = {}) {
  if (!(await adaBin('ffmpeg'))) return null
  if (!durasi) durasi = await durasiFile(buf)
  let dur = durasi || 60, potong = 0
  let totalKbps = Math.floor((targetBytes * 8 * 0.9) / (dur * 1000))
  if (totalKbps < 56) { /* terlalu panjang → tanam KLIP awal saja (min 56 kbps @144p) */
    if (opt.klip === false) return null
    dur = Math.max(20, Math.floor((targetBytes * 8 * 0.9) / 56000)); potong = dur; totalKbps = 56
  }
  const aKbps = Math.min(32, Math.max(16, Math.floor(totalKbps * 0.2)))
  const vKbps = Math.max(24, totalKbps - aKbps)
  const h = vKbps >= 300 ? 360 : vKbps >= 120 ? 240 : 144
  const i = path.join(os.tmpdir(), `vi_${Date.now()}.bin`), o = i.replace('.bin', '.mp4'); fs.writeFileSync(i, buf)
  try {
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', i, ...(potong ? ['-t', String(potong)] : []), '-vf', `scale=-2:${h},fps=${h <= 144 ? 15 : 20}`, '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0', '-preset', 'veryfast', '-b:v', `${vKbps}k`, '-maxrate', `${vKbps * 1.3 | 0}k`, '-bufsize', `${vKbps * 2}k`, '-c:a', 'aac', '-ac', '1', '-ar', '22050', '-b:a', `${aKbps}k`, '-movflags', '+faststart', '-map_metadata', '-1', o], { timeout: 600000 })
    const r = fs.readFileSync(o); return r.length <= targetBytes * 1.1 ? { buf: r, h, vKbps, aKbps, klip: potong } : null
  } catch (e) { console.error('[playvid] ffmpeg:', e.message); return null } finally { fs.rmSync(i, { force: true }); fs.rmSync(o, { force: true }) }
}
