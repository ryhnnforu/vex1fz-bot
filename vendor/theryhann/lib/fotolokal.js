/**
 * lib/fotolokal.js — 🖼 REMOVEBG & HD LOKAL (v7.32.0)
 *  Tidak bergantung API pihak ketiga (api.ikyyxd/catbox sering mati):
 *   • hapusLatar(buf)  → PNG transparan. Mesin: @imgly/background-removal-node (ONNX, lokal, model "small")
 *                        dijalankan di PROSES TERPISAH (tools/rbg-worker.js) — kalau mesin kehabisan memori /
 *                        native-crash, yang mati hanya worker, BOT TIDAK RESTART. Input dikecilkan dulu
 *                        (maks 1024px) supaya hemat RAM. Antrean: 1 foto dalam satu waktu.
 *                        Fallback: API remove.bg (butuh REMOVEBG_KEY) → pemanggil (mediahd) lalu coba API ikyyxd.
 *   • perjelas(buf, skala) → JPG HD. Mesin: ffmpeg (lanczos 2x/4x + denoise hqdn3d + unsharp + eq),
 *                        fallback Jimp (bicubic + sharpen ringan) bila ffmpeg tak ada.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile, spawn } from 'node:child_process'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const run = (bin, args, timeout = 120000) => new Promise((res, rej) => execFile(bin, args, { timeout, maxBuffer: 64 * 1024 * 1024 }, (e, so, se) => e ? rej(new Error((se || e.message).split('\n').filter(Boolean).pop())) : res(so)))
const tmpDir = () => { const d = process.env.TMP_DIR || path.join(os.tmpdir(), 'thery'); fs.mkdirSync(d, { recursive: true }); return d }
let _ff = null
export async function ffmpegBin () {
  if (_ff !== null) return _ff
  for (const b of ['ffmpeg', path.join(os.homedir(), 'bin', 'ffmpeg'), '/usr/bin/ffmpeg', '/data/data/com.termux/files/usr/bin/ffmpeg']) { try { await run(b, ['-version'], 8000); _ff = b; return b } catch {} }
  _ff = ''; return ''
}

/* ───────── REMOVE BG ───────── */
/* antrean sederhana: hanya 1 removebg lokal dalam satu waktu (hemat RAM) */
let _antre = Promise.resolve()
const _giliran = fn => { const j = _antre.then(fn, fn); _antre = j.catch(() => {}); return j }
/* pemutus sirkuit: 2 gagal beruntun → lewati mesin lokal 10 menit (langsung API) */
let _gagalBeruntun = 0; let _lepasSampai = 0

/** kecilkan foto ke sisi maks (hemat RAM ONNX) — aman, tidak mengubah rasio */
async function kecilkan (buf, maks = 1024) {
  try {
    const ff = await ffmpegBin()
    if (ff) {
      const d = tmpDir(); const i = path.join(d, `rbk_${Date.now()}.in`); const o = i + '.jpg'; fs.writeFileSync(i, buf)
      try {
        await run(ff, ['-y', '-hide_banner', '-loglevel', 'error', '-i', i, '-vf', `scale='min(iw,${maks})':'min(ih,${maks})':eval=frame:force_original_aspect_ratio=decrease`, '-q:v', '3', o])
        const kecil = fs.readFileSync(o)
        return kecil.length ? kecil : buf
      } finally { for (const f of [i, o]) try { fs.unlinkSync(f) } catch {} }
    }
    const { Jimp } = await import('jimp')
    const img = await Jimp.read(buf)
    const w = img.bitmap.width, h = img.bitmap.height
    if (Math.max(w, h) <= maks) return buf
    const s = maks / Math.max(w, h)
    img.resize({ w: Math.round(w * s), h: Math.round(h * s) })
    return await img.getBuffer('image/jpeg', { quality: 90 })
  } catch { return buf }
}

/** jalankan worker terisolasi; resolve path output / reject dengan pesan */
function jalanWorker (masuk, keluar, model, timeoutMs = 240000) {
  return new Promise((res, rej) => {
    const worker = path.join(__dir, '..', 'tools', 'rbg-worker.js')
    if (!fs.existsSync(worker)) return rej(new Error('worker rbg tidak ada'))
    const ps = spawn(process.execPath, [worker, masuk, keluar, model], { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    ps.stderr.on('data', d => { err += d; if (err.length > 2000) err = err.slice(-2000) })
    const t = setTimeout(() => { try { ps.kill('SIGKILL') } catch {}; rej(new Error('mesin lokal timeout (>4 menit) — foto mungkin terlalu besar')) }, timeoutMs)
    ps.on('error', e => { clearTimeout(t); rej(new Error('worker gagal jalan: ' + e.message)) })
    ps.on('close', kode => {
      clearTimeout(t)
      if (kode === 0 && fs.existsSync(keluar)) return res(keluar)
      const psn = (err.split('\n').filter(Boolean).pop() || '').replace(/^worker (gagal: )?/, '').slice(0, 160)
      rej(new Error(psn || `worker keluar kode ${kode}`))
    })
  })
}

export async function hapusLatar (buf, { model = 'small' } = {}) {
  if (Date.now() < _lepasSampai) throw new Error('mesin lokal istirahat sebentar (2x gagal) — memakai API cadangan')
  return _giliran(async () => {
    const siap = await kecilkan(buf, 1024)
    const d = tmpDir(); const tag = `rbw_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    const masuk = path.join(d, tag + '.jpg'); const keluar = path.join(d, tag + '.png')
    fs.writeFileSync(masuk, siap)
    try {
      await jalanWorker(masuk, keluar, model)
      const hasil = fs.readFileSync(keluar)
      if (!hasil.length || hasil.readUInt32BE(0) !== 0x89504e47) throw new Error('worker menghasilkan berkas rusak')
      _gagalBeruntun = 0
      return { buf: hasil, mesin: 'imgly-onnx (lokal, terisolasi)' }
    } catch (e) {
      _gagalBeruntun++
      if (_gagalBeruntun >= 2) { _lepasSampai = Date.now() + 10 * 60 * 1000; _gagalBeruntun = 0 }
      console.error('[fotolokal] lokal gagal → API cadangan:', e.message)
      /* fallback: API remove.bg (butuh key gratis) sebelum menyerah ke API ikyyxd */
      if (process.env.REMOVEBG_KEY) {
        try {
          const fd = new FormData(); fd.append('image_file', new Blob([siap], { type: 'image/jpeg' }), 'foto.jpg'); fd.append('size', 'auto')
          const r = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', body: fd, headers: { 'X-Api-Key': process.env.REMOVEBG_KEY }, signal: AbortSignal.timeout(60000) })
          if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), mesin: 'remove.bg' }
        } catch {}
      }
      throw new Error('mesin lokal gagal (' + String(e.message).slice(0, 120) + ') — mencoba API cadangan…')
    } finally {
      for (const f of [masuk, keluar]) try { fs.unlinkSync(f) } catch {}
    }
  })
}

/* ───────── HD / UPSCALE ───────── */
export async function perjelas (buf, skala = 2) {
  skala = [2, 4].includes(+skala) ? +skala : 2
  const ff = await ffmpegBin()
  if (ff) {
    const d = tmpDir(); const i = path.join(d, `hd_${Date.now()}.in`); const o = i.replace(/\.in$/, '.jpg'); fs.writeFileSync(i, buf)
    try {
      /* batas sisi maksimal 4096 px agar WA tidak menolak */
      const vf = `scale='min(iw*${skala},4096)':'min(ih*${skala},4096)':flags=lanczos:force_original_aspect_ratio=decrease,hqdn3d=1.5:1.5:6:6,unsharp=5:5:0.9:5:5:0.0,eq=contrast=1.04:saturation=1.06`
      await run(ff, ['-y', '-hide_banner', '-loglevel', 'error', '-i', i, '-vf', vf, '-q:v', '2', o])
      return { buf: fs.readFileSync(o), mesin: `ffmpeg lanczos ${skala}x + denoise + sharpen` }
    } finally { for (const f of [i, o]) try { fs.unlinkSync(f) } catch {} }
  }
  const { Jimp } = await import('jimp')
  const img = await Jimp.read(buf); const w = Math.min(4096, img.bitmap.width * skala)
  img.resize({ w, mode: 'bicubicInterpolation' }); img.convolute([[0, -0.25, 0], [-0.25, 2, -0.25], [0, -0.25, 0]])
  return { buf: await img.getBuffer('image/jpeg', { quality: 92 }), mesin: `jimp bicubic ${skala}x` }
}
export default { hapusLatar, perjelas, ffmpegBin }
