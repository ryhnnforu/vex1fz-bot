/**
 * ============================================================
 *  lib/scorecard.js — "EKSPORT SKOR KE GAMBAR" (v7.7.2)
 * ------------------------------------------------------------
 *  Menghasilkan PNG kartu skor (leaderboard / profil game pribadi)
 *  memakai `jimp` murni (tanpa ffmpeg/network) — sejalan aturan
 *  proyek: media diolah server-side lalu dikirim sebagai pesan WA.
 *
 *    kartuSkorPng({ judul, sub, baris, footer, tema })
 *      → Buffer PNG
 *
 *  baris: [{ teks, nilai?, warna?: [r,g,b], tebal? }]
 * ============================================================
 */
import { Jimp, loadFont, measureText as m } from 'jimp'
import * as FONTS from 'jimp/fonts'
import { sanitizeText } from './canvas.js'

const cacheFont = new Map()
async function font (size) {
  const key = 'SANS_' + size + '_WHITE'
  if (cacheFont.has(key)) return cacheFont.get(key)
  const path = FONTS[key]
  if (!path) throw new Error('Font tidak tersedia: ' + key)
  const f = await loadFont(path)
  cacheFont.set(key, f)
  return f
}

const rgba8 = (r, g, b, a = 255) => ((a << 24 >>> 0) | (b << 16) | (g << 8) | r) >>> 0

function lapis (img, x, y, w, h, [r, g, b], a = 1) {
  const lap = new Jimp({ width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)), color: rgba8(r, g, b, Math.round(a * 255)) })
  img.composite(lap, Math.round(x), Math.round(y))
}

/** buat latar solid gelap + strip aksen (tanpa gradient berat) */
async function buatLatar (w, h, a1, a2, a3) {
  const img = new Jimp({ width: w, height: h, color: rgba8(11, 13, 12) })
  lapis(img, 0, 0, w, 8, a1, 1)
  lapis(img, 0, h - 8, w, 8, a2, 1)
  lapis(img, 0, 8, 6, h - 16, a3 !== a1 ? a3 : a1, 0.35)
  return img
}

function ukur (teks, f) {
  try { return m(f, String(teks)) } catch { return String(teks).length * 9 }
}

/** render PNG kartu skor, return Buffer */
export async function kartuSkorPng ({
  judul = 'LEADERBOARD',
  sub = '',
  baris = [],
  footer = '',
  tema = ['#1db954', '#1ed760', '#17a34a'],
  lebar = 900
} = {}) {
  const RGB = hx => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]
  const A1 = RGB(tema[0]), A2 = RGB(tema[1] || tema[0]), A3 = RGB(tema[2] || tema[0])

  const fT = await font(32)
  const fB = await font(16)
  /* estimasi tinggi: banner atas + 26px per baris + footer */
  const hAtas = 148, hBaris = 30, hBawah = 64
  const tinggi = Math.max(340, hAtas + baris.length * hBaris + hBawah)
  const img = await buatLatar(lebar, tinggi, A1, A2, A3)

  /* header */
  const print = (f, x, y, text, maxWidth) => {
    const o = { font: f, x: Math.round(x), y: Math.round(y), text: String(text) }
    if (maxWidth) o.maxWidth = Math.round(maxWidth)
    img.print(o)
  }

  const tJudul = sanitizeText(String(judul || '').slice(0, 64)).toUpperCase()
  print(fT, 52, 26, tJudul, lebar - 110)
  if (sub) print(fB, 52, 78, sanitizeText(String(sub).slice(0, 90)), lebar - 110)
  /* garis pemisah */
  lapis(img, 40, 116, lebar - 44, 2, A1, 0.5)

  /* baris */
  let y = hAtas - 10
  for (let i = 0; i < baris.length; i++) {
    const br = baris[i]
    const w = br.warna || (i === 0 ? A2 : null)
    if (w) lapis(img, 40, y - 3, lebar - 80, hBaris - 4, w, i === 0 ? 0.28 : 0.12)
    const kiri = sanitizeText(String(br.teks || '').slice(0, 40))
    const kanan = br.nilai != null ? sanitizeText(String(br.nilai).slice(0, 24)) : ''
    print(fB, 52, y + 2, kiri)
    if (kanan) {
      const wkt = ukur(kanan, fB)
      print(fB, lebar - 52 - wkt, y + 2, kanan)
    }
    y += hBaris
  }

  /* pemisah + footer */
  lapis(img, 40, y - 4, lebar - 44, 2, A1, 0.35)
  if (footer) print(fB, 52, y + 12, sanitizeText(String(footer).slice(0, 92)), lebar - 110)

  return await img.getBuffer('image/png')
}

export default { kartuSkorPng }
