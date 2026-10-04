/**
 * lib/tekstebal.js — 🅰 TEKS TEBAL ala MEME (Impact-like) tanpa modul native (v7.30.0)
 *  Font Anton (OFL, media/fonts/Anton.ttf) dibaca opentype.js → path glyph →
 *  dirasterisasi (scanline even-odd, 3× supersampling) ke Jimp. Outline hitam +
 *  isi putih seperti meme klasik. Dipakai .smeme (dan bisa untuk fitur lain).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from '../shims/opentype.mjs'
import { Jimp } from 'jimp'

const __dir = path.dirname(fileURLToPath(import.meta.url))
let FONT = null
export function fontMeme () {
  if (FONT) return FONT
  const p = path.join(__dir, '..', 'media', 'fonts', 'Anton.ttf')
  FONT = opentype.parse(fs.readFileSync(p).buffer.slice(0)) // ArrayBuffer
  return FONT
}

/* path → segmen garis (kurva didatarkan) → daftar edge per kontur */
function flatten (pathCmds, skala, ox, oy) {
  const polys = []; let cur = []; let x0 = 0, y0 = 0
  const pt = (x, y) => [ox + x * skala, oy + y * skala] /* getPath sudah y-ke-bawah */
  for (const c of pathCmds) {
    if (c.type === 'M') { if (cur.length > 2) polys.push(cur); cur = [pt(c.x, c.y)]; x0 = c.x; y0 = c.y } else if (c.type === 'L') { cur.push(pt(c.x, c.y)); x0 = c.x; y0 = c.y } else if (c.type === 'Q') {
      for (let i = 1; i <= 8; i++) { const t = i / 8; const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * c.x1 + t * t * c.x; const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * c.y1 + t * t * c.y; cur.push(pt(x, y)) } x0 = c.x; y0 = c.y
    } else if (c.type === 'C') {
      for (let i = 1; i <= 10; i++) { const t = i / 10; const x = (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * c.x1 + 3 * (1 - t) * t * t * c.x2 + t ** 3 * c.x; const y = (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * c.y1 + 3 * (1 - t) * t * t * c.y2 + t ** 3 * c.y; cur.push(pt(x, y)) } x0 = c.x; y0 = c.y
    } else if (c.type === 'Z') { if (cur.length > 2) polys.push(cur); cur = [] }
  }
  if (cur.length > 2) polys.push(cur)
  return polys
}

/** rasterisasi poligon (even-odd) ke mask Uint8 (0..255) ukuran w×h dengan supersampling ss */
function raster (polys, w, h, ss = 3) {
  const W = w * ss, H = h * ss; const cov = new Uint8Array(w * h); const acc = new Uint16Array(w * h)
  const edges = []
  for (const poly of polys) for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if (a[1] !== b[1]) edges.push([a[0] * ss, a[1] * ss, b[0] * ss, b[1] * ss]) }
  for (let sy = 0; sy < H; sy++) {
    const y = sy + 0.5; const xs = []
    for (const [x1, y1, x2, y2] of edges) { if ((y >= y1 && y < y2) || (y >= y2 && y < y1)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)) }
    if (!xs.length) continue
    xs.sort((a, b) => a - b)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.max(0, Math.round(xs[i])), xb = Math.min(W, Math.round(xs[i + 1]))
      const row = Math.floor(sy / ss) * w
      for (let sx = xa; sx < xb; sx++) acc[row + Math.floor(sx / ss)]++
    }
  }
  const maks = ss * ss
  for (let i = 0; i < acc.length; i++) cov[i] = Math.min(255, Math.round(acc[i] * 255 / maks))
  return cov
}

function lebar (font, teks, size) { return font.getAdvanceWidth(teks, size) }
function bungkus (font, teks, size, maksW) {
  const kata = teks.split(/\s+/).filter(Boolean); const baris = []; let cur = ''
  for (const k of kata) { const uji = cur ? cur + ' ' + k : k; if (lebar(font, uji, size) <= maksW || !cur) cur = uji; else { baris.push(cur); cur = k } }
  if (cur) baris.push(cur); return baris
}

/**
 * Buat layer Jimp transparan berisi teks meme (putih, outline hitam tebal, huruf kapital).
 * @param {string} teks
 * @param {object} o { w=512, maxLines=3, size=auto, outline=auto, warna=0xffffffff, ol=0x000000ff }
 */
export async function layerTeksMeme (teks, o = {}) {
  const font = fontMeme(); const w = o.w || 512
  teks = String(teks || '').toUpperCase().trim(); if (!teks) return null
  let size = o.size || 72; let baris
  /* ukuran adaptif: turun sampai ≤ maxLines baris */
  for (; size >= 26; size -= 4) { baris = bungkus(font, teks, size, w - 40); if (baris.length <= (o.maxLines || 3)) break }
  const lh = Math.round(size * 1.08); const ol = o.outline || Math.max(2, Math.round(size / 14))
  const h = baris.length * lh + ol * 2 + 6
  const polys = []
  baris.forEach((b, i) => { const bw = lebar(font, b, size); const ox = Math.round((w - bw) / 2); const oy = ol + 3 + i * lh + Math.round(size * 0.86); polys.push(...flatten(font.getPath(b, 0, 0, size).commands, 1, ox, oy)) })
  const isi = raster(polys, w, h)
  /* outline = dilasi mask isi sebesar ol piksel (jarak euclid) */
  const out = new Uint8Array(w * h)
  const r2 = ol * ol
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = isi[y * w + x]; if (!v) continue
    for (let dy = -ol; dy <= ol; dy++) for (let dx = -ol; dx <= ol; dx++) { if (dx * dx + dy * dy > r2) continue; const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue; const i = yy * w + xx; if (v > out[i]) out[i] = v }
  }
  const img = new Jimp({ width: w, height: h, color: 0x00000000 }); const d = img.bitmap.data
  const [fr, fg, fb] = [(o.warna ?? 0xffffffff) >>> 24, ((o.warna ?? 0xffffffff) >>> 16) & 255, ((o.warna ?? 0xffffffff) >>> 8) & 255]
  for (let i = 0; i < w * h; i++) {
    const a = out[i], f = isi[i]; if (!a) continue
    const t = f / 255 // 1 = isi putih, 0 = outline hitam
    d[i * 4] = Math.round(fr * t); d[i * 4 + 1] = Math.round(fg * t); d[i * 4 + 2] = Math.round(fb * t); d[i * 4 + 3] = a
  }
  return img
}
export default { layerTeksMeme, fontMeme }
