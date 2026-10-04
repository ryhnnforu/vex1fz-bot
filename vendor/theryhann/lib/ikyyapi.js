/**
 * ============================================================
 *  lib/ikyyapi.js — PEMBANTU API MEDIA (v7.7.1)
 * ------------------------------------------------------------
 *  Kumpulan helper untuk fitur media jarak jauh:
 *    • unggahLitter(buf, ekst)  → URL publik (litter.catbox, 24 jam)
 *    • removebg(url)            → URL hasil PNG (tanpa background)
 *    • upscale(url, scale)      → URL JPG hasil HD 4x
 *    • jadihitam(url)           → URL hasil "jadi hitam"
 *    • toHD(buf)                → { ... } (delegasi ke upscale)
 *
 *  Semua menerima `fetchImpl` opsional (test offline). Non-fatal
 *  style: melempar Error berpesan jelas supaya pemanggil bisa
 *  menjawab pengguna dengan sopan.
 * ============================================================
 */
/* Blob & FormData: pakai bawaan global Node 18+ (bukan dari node:buffer) */

const UA = 'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Mobile Safari/537.36'
const LITTER = 'https://litterbox.catbox.moe/resources/internals/api.php'
const API = 'https://api.ikyyxd.my.id'

/* ---------- HTTP kecil ---------- */
async function httpJson (url, { fetchImpl, timeout = 120000 } = {}) {
  const f = fetchImpl || globalThis.fetch
  if (typeof f !== 'function') throw new Error('fetch tidak tersedia')
  const ctl = new AbortController()
  const t = setTimeout(() => { try { ctl.abort() } catch {} }, timeout)
  try {
    const res = await f(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctl.signal })
    clearTimeout(t)
    if (!res || !res.ok) throw new Error(`HTTP ${res ? res.status : '???'} dari ${new URL(url).host}`)
    return await res.json()
  } catch (e) {
    clearTimeout(t)
    throw e
  }
}

const ucap = u => encodeURIComponent(String(u || ''))

/* ---------- upload buffer → URL publik ---------- */
/**
 * Unggah buffer ke litter.catbox (file publik sementara).
 * @param {Buffer} buf
 * @param {string} ekst  ekstensi tanpa titik ('jpg', 'png', 'mp4', …)
 * @param {string} [masa] umur file (def. '24h')
 */
export async function unggahLitter (buf, ekst = 'jpg', { masa = '24h', fetchImpl } = {}) {
  if (!Buffer.isBuffer(buf) || !buf.length) throw new Error('buffer kosong — tidak ada yang diunggah')
  const f = fetchImpl || globalThis.fetch
  const fd = new FormData()
  fd.append('reqtype', 'fileupload')
  fd.append('time', String(masa))
  fd.append('fileToUpload', new Blob([buf]), `media.${String(ekst).replace(/[^a-z0-9]/gi, '') || 'jpg'}`)
  const ctl = new AbortController()
  const t = setTimeout(() => { try { ctl.abort() } catch {} }, 120000)
  try {
    const res = await f(LITTER, { method: 'POST', body: fd, headers: { 'User-Agent': UA }, signal: ctl.signal })
    clearTimeout(t)
    if (!res || !res.ok) throw new Error(`unggah gagal (HTTP ${res ? res.status : '???'})`)
    const url = String(await res.text()).trim()
    if (!/^https:\/\/.+\..+/i.test(url)) throw new Error('jawaban unggah tidak berisi URL')
    return url
  } catch (e) {
    clearTimeout(t)
    throw e
  }
}

/* ---------- util respons API ikyyxd ---------- */
function pastelOk (j, ambil) {
  if (!j || j.status === false) {
    const psn = (j?.message && typeof j.message === 'string' ? j.message : '') ||
      (j?.error && typeof j.error === 'string' ? j.error : '') ||
      (j?.error?.message ? String(j.error.message) : '') ||
      (j?.message?.error ? String(j.message.error) : '') ||
      'server menolak permintaan ini'
    throw new Error(psn.replace(/\s+/g, ' ').slice(0, 140))
  }
  const url = ambil ? ambil(j) : null
  if (!url || !/^https?:\/\//i.test(url)) throw new Error('hasilnya tidak mengandung URL media')
  return url
}

/* ---------- API ---------- */
/** Hapus background foto. url → PNG URL */
export async function removebg (url, opt = {}) {
  const j = await httpJson(`${API}/tools/removebg?url=${ucap(url)}`, opt)
  return pastelOk(j, x => x.resultsImage || x.url || x.result?.url)
}

/** Upscale foto menjadi HD (4x). url → JPG URL */
export async function upscale (url, opt = {}) {
  const j = await httpJson(`${API}/tools/upscale?url=${ucap(url)}`, opt)
  return pastelOk(j, x => x.result?.downloadUrl || x.result || x.resultsImage || x.url)
}

/** Edit "jadi hitam" (hitam putih artistik). url → URL hasil */
export async function jadihitam (url, opt = {}) {
  const j = await httpJson(`${API}/edit/jadihitam?url=${ucap(url)}`, opt)
  return pastelOk(j, x => (typeof x.result === 'string' ? x.result : null) || x.resultsImage || x.url)
}

/** toHD — alias .hd yang menerima buffer langsung (upload + upscale) */
export async function toHD (buf, ekst = 'jpg', opt = {}) {
  const url = await unggahLitter(buf, ekst, opt)
  return upscale(url, opt)
}

/** toRBG — buffer langsung lalu removebg */
export async function toRBG (buf, ekst = 'jpg', opt = {}) {
  const url = await unggahLitter(buf, ekst, opt)
  return removebg(url, opt)
}

/** unduh URL menjadi Buffer (maks ukuran dijaga) */
export async function unduhBuffer (url, { fetchImpl, timeout = 120000, maks = 30e6 } = {}) {
  const f = fetchImpl || globalThis.fetch
  const ctl = new AbortController()
  const t = setTimeout(() => { try { ctl.abort() } catch {} }, timeout)
  try {
    const res = await f(String(url), { headers: { 'User-Agent': UA }, signal: ctl.signal })
    clearTimeout(t)
    if (!res || !res.ok) throw new Error(`gagal unduh hasil (HTTP ${res ? res.status : '???'})`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (!buf.length) throw new Error('hasil unduhan kosong')
    if (buf.length > maks) throw new Error(`hasil terlalu besar (${(buf.length / 1e6).toFixed(1)} MB)`)
    return buf
  } catch (e) {
    clearTimeout(t)
    throw e
  }
}

export default { unggahLitter, removebg, upscale, jadihitam, toHD, toRBG, unduhBuffer }
