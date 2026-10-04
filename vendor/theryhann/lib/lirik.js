/**
 * ============================================================
 *  lib/lirik.js — MESIN LIRIK (LRCLIB) untuk .play2 v7.7
 * ------------------------------------------------------------
 *  Mengambil lirik lagu dari LRCLIB (gratis, tanpa API key):
 *    1) GET /api/get   (artis+judul+album+durasi → akurat)
 *    2) GET /api/search (fallback pencarian bebas)
 *
 *  • Diinjeksi server-side — kartu HTML player tetap bebas jaringan.
 *  • Non-fatal: lagu tanpa lirik / jaringan mati → null, player tetap jalan.
 *  • Cache memori (maks 300 entri) + timeout bawaan 5 dtk.
 *  • `ambilLirik(t, { fetchImpl })` — fetch bisa disuntik untuk test offline.
 * ============================================================
 */

const CACHE = new Map() /* kunci -> { lirik|null, waktu } */
const CACHE_MAKS = 300
const CACHE_HIDUP = 6 * 3600e3 /* 6 jam */
const TIMEOUT_DEF = 5000

const BASE = 'https://lrclib.net'
const UA = { 'User-Agent': 'THERYHANN-BOT/7.7 (https://theryhann.local; musik-player)' }

/* ---------- util ---------- */
const bersih = s => String(s || '').replace(/\s+/g, ' ').trim()
const kunci = (judul, artis) => (bersih(judul) + '||' + bersih(artis)).toLowerCase()

/** ambil dari cache kalau masih segar; undefined = belum ada */
function bacaCache (k) {
  const c = CACHE.get(k)
  if (!c) return undefined
  if (Date.now() - c.waktu > CACHE_HIDUP) { CACHE.delete(k); return undefined }
  return c.lirik
}
function tulisCache (k, lirik) {
  if (CACHE.size >= CACHE_MAKS) CACHE.delete(CACHE.keys().next().value)
  CACHE.set(k, { lirik, waktu: Date.now() })
}
/** kosongkan cache (test) */
export function resetCacheLirik () { CACHE.clear() }

/* ---------- HTTP kecil dengan timeout ---------- */
async function httpJson (url, { fetchImpl, timeout } = {}) {
  const f = fetchImpl || globalThis.fetch
  if (typeof f !== 'function') throw new Error('fetch tidak tersedia')
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t = setTimeout(() => { try { ctl?.abort() } catch {} }, timeout || TIMEOUT_DEF)
  try {
    const res = await f(url, { headers: UA, signal: ctl?.signal })
    clearTimeout(t)
    if (!res || !res.ok) return null
    return await res.json()
  } catch (e) {
    clearTimeout(t)
    return null
  }
}

/* ---------- parsing format LRC: [mm:ss.xx]teks ---------- */
const RE_LRC = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g

/** parse teks LRC → array [detik, baris] terurut (baris < 90 char, maks 60) */
export function parseLRC (lrc, maks = 60) {
  if (!lrc || typeof lrc !== 'string') return []
  const diAmbil = []
  for (const baris of lrc.split(/\r?\n/)) {
    const teks = baris.replace(/(?:\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\])+/g, '').trim()
    if (!teks) continue
    let m; let detik = null
    RE_LRC.lastIndex = 0
    while ((m = RE_LRC.exec(baris))) {
      const dtk = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0)
      if (detik === null) detik = dtk
    }
    if (detik === null) continue
    diAmbil.push([Number(detik.toFixed(2)), teks.slice(0, 90)])
    if (diAmbil.length >= maks) break
  }
  diAmbil.sort((a, b) => a[0] - b[0])
  return diAmbil
}

/** normalisasi lirik polos: buang baris kosong beruntun, maks 60 baris × 90 char */
function normalPolos (s, maks = 60) {
  if (!s) return null
  const baris = String(s).split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, maks).map(x => x.slice(0, 90))
  return baris.length ? baris.join('\n') : null
}

/**
 * Ambil lirik sebuah lagu.
 * @param {object} t  { judul, artis, album?, durasiAsli? }
 * @returns {Promise<{sumber:string, polos:string|null, sinkron:[[number,string]], baris:number}|null>}
 */
export async function ambilLirik (t = {}, opt = {}) {
  const judul = bersih(t.judul)
  const artis = bersih(t.artis)
  if (!judul) return null

  const k = kunci(judul, artis)
  const hit = bacaCache(k)
  if (hit !== undefined) return hit

  let lirik = null
  const q = new URLSearchParams()
  q.set('track_name', judul)
  if (artis) q.set('artist_name', artis)
  if (t.album && bersih(t.album)) q.set('album_name', bersih(t.album))
  if (Number.isFinite(+t.durasiAsli) && +t.durasiAsli > 0) q.set('duration', String(Math.round(+t.durasiAsli)))

  /* 1) /api/get — pencocokan akurat */
  let data = await httpJson(`${BASE}/api/get?${q}`, opt)
  /* 2) /api/search — bebas, ambil kandidat pertama yang ada liriknya */
  if (!data && judul) {
    const qs = new URLSearchParams({ q: artis ? `${judul} ${artis}` : judul })
    const hasil = await httpJson(`${BASE}/api/search?${qs}`, opt)
    if (Array.isArray(hasil)) {
      data = hasil.find(x => x && (x.plainLyrics || x.syncedLyrics)) || null
    }
  }

  if (data && typeof data === 'object') {
    const sinkron = parseLRC(data.syncedLyrics || '', 60)
    let polos = normalPolos(data.plainLyrics, 60)
    /* kalau cuma ada sinkron, jadikan teks polos dari baris-barisnya */
    if (!polos && sinkron.length) polos = sinkron.map(([, l]) => l).join('\n')
    if (polos || sinkron.length) {
      lirik = {
        sumber: 'lrclib',
        judul: bersih(data.trackName || judul),
        artis: bersih(data.artistName || artis),
        polos,
        sinkron,
        baris: sinkron.length || (polos ? polos.split('\n').length : 0)
      }
    }
  }

  tulisCache(k, lirik)
  return lirik
}

/** lirik → blok teks WhatsApp (untuk .liriklagu), dibatasi agar awet dipotong */
export function lirikTeks (t, lirik, maks = 3400) {
  const judul = bersih(t.judul) || 'Lagu'
  const artis = bersih(t.artis) || '-'
  if (!lirik || !(lirik.polos || lirik.sinkron.length)) {
    return `🎤 *LIRIK — ${judul}*\n${artis}\n\n❌ Lirik tidak ditemukan untuk lagu ini.\n_Coba lagu lain, atau judul/artis yang lebih tepat._`
  }
  const isi = lirik.sinkron.length && !lirik.polos ? lirik.sinkron.map(([, l]) => l).join('\n') : (lirik.polos || '')
  let teks = `🎤 *LIRIK — ${judul}*\n${artis} · _sumber: lrclib.net_\n\n${isi}`
  if (teks.length > maks) teks = teks.slice(0, maks - 30).replace(/\n[^\n]*$/, '') + '\n\n_…(dipotong)_'
  return teks
}

export default { ambilLirik, parseLRC, lirikTeks, resetCacheLirik }
