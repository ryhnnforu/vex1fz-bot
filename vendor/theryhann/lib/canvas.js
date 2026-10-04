/**
 * ============================================================
 *  lib/canvas.js — GENERATOR KARTU GAMBAR (pure JS, no native)
 * ------------------------------------------------------------
 *  Dipakai untuk:
 *   • Kartu WELCOME  (member baru masuk grup)
 *   • Kartu GOODBYE  (member keluar / di-kick)
 *   • Kartu PROMOTE / DEMOTE
 *   • Banner MENU yang bisa di-custom
 *
 *  Semua digambar manual pakai `jimp` (sudah jadi dependency) +
 *  font Open Sans BMFont yang DIBUNDLED oleh @jimp/plugin-print.
 *  → Tidak perlu ffmpeg, tidak perlu asset tambahan, aman di Termux.
 * ============================================================
 */

import { Jimp, loadFont } from 'jimp'
import * as FONTS from 'jimp/fonts'
import { getBuffer, pickRandom } from './functions.js'

/* ------------------------------------------------------------------ */
/*  TEMA / WARNA                                                       */
/* ------------------------------------------------------------------ */

/** Tiap tema: warna gradient (from→to) + aksen. Format [r,g,b] */
export const THEMES = {
  ocean:    { from: [15, 32, 68],   to: [32, 96, 158],  accent: [86, 204, 242] },
  sunset:   { from: [58, 12, 44],   to: [198, 74, 60],  accent: [255, 183, 77] },
  forest:   { from: [10, 40, 30],   to: [34, 120, 80],  accent: [144, 238, 144] },
  grape:    { from: [30, 12, 58],   to: [108, 52, 180], accent: [200, 160, 255] },
  crimson:  { from: [40, 8, 16],    to: [150, 30, 52],  accent: [255, 120, 140] },
  midnight: { from: [8, 10, 24],    to: [40, 48, 96],   accent: [130, 160, 255] },
  gold:     { from: [44, 32, 8],    to: [150, 110, 26], accent: [255, 214, 120] },
  cyber:    { from: [6, 24, 34],    to: [16, 88, 104],  accent: [0, 255, 210] },
  sakura:   { from: [48, 18, 38],   to: [168, 82, 132], accent: [255, 190, 220] },
  mono:     { from: [16, 16, 18],   to: [58, 58, 64],   accent: [220, 220, 225] }
}

export const THEME_NAMES = Object.keys(THEMES)

export function getTheme (name) {
  return THEMES[name] || THEMES.ocean
}

export function randomTheme () {
  return pickRandom(THEME_NAMES)
}

/* ------------------------------------------------------------------ */
/*  FONT                                                               */
/* ------------------------------------------------------------------ */

const fontCache = new Map()

/** Font putih bawaan jimp hanya ada ukuran 8/16/32/64/128 */
async function font (size) {
  const key = 'SANS_' + size + '_WHITE'
  if (fontCache.has(key)) return fontCache.get(key)
  const path = FONTS[key]
  if (!path) throw new Error('Font tidak tersedia: ' + key)
  const f = await loadFont(path)
  fontCache.set(key, f)
  return f
}

/**
 * Open Sans BMFont hanya memuat glyph ASCII printable. Emoji / bullet /
 * tanda baca unik akan jadi kotak "?" — jadi kita petakan dulu, sisanya dibuang.
 * (Sinkron & cepat, tidak butuh load font.)
 */
const GLYPH_MAP = {
  '•': '|', '·': '|', '●': '|', '◦': '|', '‧': '|',
  '–': '-', '—': '-', '−': '-', '‐': '-',
  '…': '...', '‘': "'", '’': "'", '“': '"', '”': '"',
  '×': 'x', '→': '>', '←': '<', '↔': '<>', '≈': '~', '≠': '!=',
  '≤': '<=', '≥': '>=', '°': 'o', '½': '1/2', '¼': '1/4', '¾': '3/4',
  '©': '(c)', '®': '(R)', '™': 'TM', '✓': 'v', '✗': 'x', '✔': 'v', '✘': 'x',
  '★': '*', '☆': '*', '♥': '<3', '♦': '*', '♣': '*', '♠': '*',
  '│': '|', '┃': '|', '▸': '>', '▪': '-', '■': '-', '□': '-',
  '\u00a0': ' ', '\t': '    ', '\r': ''
}

export function sanitizeText (text = '') {
  let out = ''
  for (const ch of String(text)) {
    const code = ch.codePointAt(0)
    if (code >= 32 && code <= 126) { out += ch; continue }
    const mapped = GLYPH_MAP[ch]
    if (mapped !== undefined) out += mapped
    // emoji / CJK / arab / dll -> dibuang (bukan jadi kotak '?')
  }
  return out.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

/** lebar teks (px) pada font tertentu */
function measure (f, text) {
  let w = 0
  for (const ch of String(text)) {
    const c = f.chars[ch] || f.chars[ch.charCodeAt(0)]
    w += c ? (c.xadvance || 0) : 0
  }
  return w
}

/** tinggi baris font */
function lineHeight (f) {
  return f.common?.lineHeight || 40
}

/** pecah teks jadi beberapa baris agar muat maxWidth */
function wrapText (f, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (const w of words) {
    const trial = cur ? cur + ' ' + w : w
    if (measure(f, trial) <= maxWidth || !cur) {
      // satu kata terlalu panjang → potong paksa
      if (!cur && measure(f, w) > maxWidth) {
        let part = ''
        for (const ch of w) {
          if (measure(f, part + ch) > maxWidth) { lines.push(part); part = ch } else part += ch
        }
        cur = part
      } else cur = trial
    } else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

/**
 * Render teks ke layer transparan, lalu resize ke tinggi yang diminta.
 * Ini cara dapat UKURAN FONT BEBAS (jimp cuma punya 8/16/32/64/128).
 */
async function textLayer (text, { size = 64, maxHeight = null, maxWidth = null } = {}) {
  const f = await font(128) // render di 128 lalu scale → hasil paling halus
  const w = Math.max(8, Math.ceil(measure(f, text)) + 24)
  const h = Math.ceil(lineHeight(f)) + 24
  const layer = new Jimp({ width: w, height: h, color: 0x00000000 })
  layer.print({ font: f, x: 12, y: 12, text: String(text) })
  if (maxHeight) {
    const ratio = maxHeight / h
    let nw = Math.max(1, Math.round(w * ratio))
    if (maxWidth && nw > maxWidth) {
      const r2 = maxWidth / nw
      nw = maxWidth
      layer.resize({ w: nw, h: Math.max(1, Math.round(h * ratio * r2)) })
    } else {
      layer.resize({ w: nw, h: maxHeight })
    }
  }
  return { img: layer, w: layer.bitmap.width, h: layer.bitmap.height, raw: w, rawH: h }
}

/* ------------------------------------------------------------------ */
/*  PRIMITIF GAMBAR                                                    */
/* ------------------------------------------------------------------ */

const clamp255 = v => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))

function idx (img, x, y) {
  return (y * img.bitmap.width + x) << 2
}

/** gradient diagonal (0 = vertikal, 1 = horizontal, 0.5 = diagonal) */
function gradient (w, h, c1, c2, diagonal = 0.5) {
  const img = new Jimp({ width: w, height: h, color: 0x000000ff })
  const data = img.bitmap.data
  const denom = Math.max(1, (w * diagonal) + (h * (1 - diagonal)))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let t = (x * diagonal + y * (1 - diagonal)) / denom
      t = t < 0 ? 0 : t > 1 ? 1 : t
      const i = (y * w + x) << 2
      data[i] = clamp255(c1[0] + (c2[0] - c1[0]) * t)
      data[i + 1] = clamp255(c1[1] + (c2[1] - c1[1]) * t)
      data[i + 2] = clamp255(c1[2] + (c2[2] - c1[2]) * t)
      data[i + 3] = 255
    }
  }
  return img
}

/** timpa rectangle semi-transparan (untuk panel teks biar kontras) */
function fillRect (img, x, y, w, h, [r, g, b], alpha = 0.45) {
  const X0 = Math.max(0, x | 0), Y0 = Math.max(0, y | 0)
  const X1 = Math.min(img.bitmap.width, (x + w) | 0), Y1 = Math.min(img.bitmap.height, (y + h) | 0)
  const data = img.bitmap.data
  const iw = img.bitmap.width
  for (let py = Y0; py < Y1; py++) {
    for (let px = X0; px < X1; px++) {
      const i = (py * iw + px) << 2
      data[i] = clamp255(data[i] * (1 - alpha) + r * alpha)
      data[i + 1] = clamp255(data[i + 1] * (1 - alpha) + g * alpha)
      data[i + 2] = clamp255(data[i + 2] * (1 - alpha) + b * alpha)
      data[i + 3] = 255
    }
  }
}

/** rounded rect semi-transparan */
function roundRect (img, x, y, w, h, color, alpha = 0.45, radius = 24) {
  const X0 = Math.max(0, x | 0), Y0 = Math.max(0, y | 0)
  const X1 = Math.min(img.bitmap.width, (x + w) | 0), Y1 = Math.min(img.bitmap.height, (y + h) | 0)
  const data = img.bitmap.data
  const iw = img.bitmap.width
  const r = Math.min(radius, w / 2, h / 2)
  for (let py = Y0; py < Y1; py++) {
    for (let px = X0; px < X1; px++) {
      // cek sudut
      let dx = 0, dy = 0
      if (px < X0 + r && py < Y0 + r) { dx = X0 + r - px; dy = Y0 + r - py } else
      if (px > X1 - r && py < Y0 + r) { dx = px - (X1 - r); dy = Y0 + r - py } else
      if (px < X0 + r && py > Y1 - r) { dx = X0 + r - px; dy = py - (Y1 - r) } else
      if (px > X1 - r && py > Y1 - r) { dx = px - (X1 - r); dy = py - (Y1 - r) }
      if (dx || dy) { if (Math.sqrt(dx * dx + dy * dy) > r) continue }
      const i = (py * iw + px) << 2
      data[i] = clamp255(data[i] * (1 - alpha) + color[0] * alpha)
      data[i + 1] = clamp255(data[i + 1] * (1 - alpha) + color[1] * alpha)
      data[i + 2] = clamp255(data[i + 2] * (1 - alpha) + color[2] * alpha)
      data[i + 3] = 255
    }
  }
}

/** garis / bar aksen */
function bar (img, x, y, w, h, color) {
  fillRect(img, x, y, w, h, color, 1)
}

/** lingkaran berisi */
function disc (img, cx, cy, radius, [r, g, b], alpha = 1) {
  const data = img.bitmap.data
  const iw = img.bitmap.width, ih = img.bitmap.height
  const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(iw - 1, Math.ceil(cx + radius))
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(ih - 1, Math.ceil(cy + radius))
  const r2 = radius * radius
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = px - cx, dy = py - cy
      if (dx * dx + dy * dy > r2) continue
      const i = (py * iw + px) << 2
      data[i] = clamp255(data[i] * (1 - alpha) + r * alpha)
      data[i + 1] = clamp255(data[i + 1] * (1 - alpha) + g * alpha)
      data[i + 2] = clamp255(data[i + 2] * (1 - alpha) + b * alpha)
      data[i + 3] = 255
    }
  }
}

/** cincin (outline lingkaran) */
function ring (img, cx, cy, radius, thickness, color, alpha = 1) {
  const data = img.bitmap.data
  const iw = img.bitmap.width, ih = img.bitmap.height
  const outer = radius, inner = radius - thickness
  const x0 = Math.max(0, Math.floor(cx - outer)), x1 = Math.min(iw - 1, Math.ceil(cx + outer))
  const y0 = Math.max(0, Math.floor(cy - outer)), y1 = Math.min(ih - 1, Math.ceil(cy + outer))
  const o2 = outer * outer, i2 = inner * inner
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const dx = px - cx, dy = py - cy
      const d = dx * dx + dy * dy
      if (d > o2 || d < i2) continue
      const i = (py * iw + px) << 2
      data[i] = clamp255(data[i] * (1 - alpha) + color[0] * alpha)
      data[i + 1] = clamp255(data[i + 1] * (1 - alpha) + color[1] * alpha)
      data[i + 2] = clamp255(data[i + 2] * (1 - alpha) + color[2] * alpha)
      data[i + 3] = 255
    }
  }
}

/** bintik dekoratif acak tapi deterministik (seed dari nama) */
function speckles (img, seed, color, count = 46) {
  let s = 0
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  const w = img.bitmap.width, h = img.bitmap.height
  for (let i = 0; i < count; i++) {
    const x = rnd() * w, y = rnd() * h, r = 1 + rnd() * 3.5
    disc(img, x, y, r, color, 0.10 + rnd() * 0.22)
  }
}

/** cover-fit: isi penuh area w×h tanpa gepeng, tengah di-crop */
function cover (img, w, h) {
  const sw = img.bitmap.width, sh = img.bitmap.height
  const scale = Math.max(w / sw, h / sh)
  const nw = Math.max(1, Math.round(sw * scale)), nh = Math.max(1, Math.round(sh * scale))
  img.resize({ w: nw, h: nh })
  const x = Math.max(0, Math.round((nw - w) / 2)), y = Math.max(0, Math.round((nh - h) / 2))
  return img.crop({ x, y, w, h })
}

/* ------------------------------------------------------------------ */
/*  AVATAR                                                             */
/* ------------------------------------------------------------------ */

/** inisial dari nama (maks 2 huruf) */
export function initials (name = '?') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Ambil buffer avatar. `src` bisa buffer / url / path.
 * Gagal → null (pemanggil bikin fallback inisial).
 */
async function fetchAvatar (src) {
  if (!src) return null
  try {
    if (Buffer.isBuffer(src)) return src
    if (typeof src === 'string') return await getBuffer(src)
  } catch {}
  return null
}

/**
 * Avatar bulat + cincin aksen. Selalu berhasil (fallback inisial).
 * @returns {Promise<{img:Jimp, size:number}>}
 */
export async function roundAvatar (src, { size = 200, accent = [255, 255, 255], name = '?', ringWidth = 6 } = {}) {
  const total = size + ringWidth * 2 + 4
  const out = new Jimp({ width: total, height: total, color: 0x00000000 })

  let av = null
  const buf = await fetchAvatar(src)
  if (buf) {
    try {
      const j = await Jimp.read(buf)
      cover(j, size, size)
      av = j
    } catch { av = null }
  }

  if (!av) {
    // fallback: lingkaran aksen + inisial
    av = new Jimp({ width: size, height: size, color: 0x00000000 })
    disc(av, size / 2, size / 2, size / 2, accent, 1)
    const ini = initials(name)
    const f = await font(128)
    const tw = measure(f, ini)
    const layer = new Jimp({ width: Math.ceil(tw) + 20, height: Math.ceil(lineHeight(f)) + 20, color: 0x00000000 })
    layer.print({ font: f, x: 10, y: 10, text: ini })
    const targetH = Math.round(size * (ini.length > 1 ? 0.34 : 0.46))
    layer.resize({ h: targetH })
    av.composite(layer, Math.round((size - layer.bitmap.width) / 2), Math.round((size - targetH) / 2))
  }

  // mask bulat: pixel di luar radius → transparan
  const cx = size / 2, cy = size / 2, r2 = (size / 2) * (size / 2)
  const data = av.bitmap.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const i = (y * size + x) << 2
      const d = dx * dx + dy * dy
      if (d > r2) { data[i + 3] = 0; continue }
      // anti-alias tipis di tepi
      const edge = Math.sqrt(d) - size / 2
      if (edge > -1.6) data[i + 3] = clamp255(255 * Math.max(0, Math.min(1, (1.6 + edge) / -1.6 + 1)))
    }
  }

  const pad = ringWidth + 2
  ring(out, total / 2, total / 2, size / 2 + ringWidth, ringWidth, accent, 1)
  out.composite(av, pad, pad)
  return { img: out, size: total }
}

/* ------------------------------------------------------------------ */
/*  BACKGROUND                                                         */
/* ------------------------------------------------------------------ */

async function buildBackground (w, h, theme, bgSource) {
  let base
  if (bgSource) {
    try {
      const buf = typeof bgSource === 'string' ? await getBuffer(bgSource) : bgSource
      const j = await Jimp.read(buf)
      cover(j, w, h)
      j.blur(6)
      base = j
      // gelapkan biar teks kebaca
      fillRect(base, 0, 0, w, h, theme.from, 0.55)
    } catch { base = null }
  }
  if (!base) {
    base = gradient(w, h, theme.from, theme.to, 0.42)
    speckles(base, 'theryhann' + w + h, theme.accent, 50)
  }
  return base
}

/* ------------------------------------------------------------------ */
/*  KARTU UTAMA                                                        */
/* ------------------------------------------------------------------ */

const LABELS = {
  welcome: 'SELAMAT DATANG',
  leave: 'SAMPAI JUMPA',
  promote: 'NAIK JABATAN',
  demote: 'TURUN JABATAN'
}

const EMOJI = { welcome: '👋', leave: '👋', promote: '🎉', demote: '📉' }

/**
 * Buat kartu (PNG buffer).
 *
 * @param {object} o
 * @param {'welcome'|'leave'|'promote'|'demote'} o.type
 * @param {string} o.name        nama member
 * @param {string} [o.group]     nama grup
 * @param {number} [o.memberCount]
 * @param {string} [o.subtitle]  teks baris ke-3 (default otomatis)
 * @param {string} [o.footer]    teks kecil pojok kanan bawah
 * @param {string|Buffer} [o.avatar]  url/buffer foto profil
 * @param {string|Buffer} [o.background] url/buffer gambar latar custom
 * @param {string} [o.theme]     nama tema (lihat THEMES)
 * @param {number} [o.width=1080] @param {number} [o.height=540]
 * @returns {Promise<Buffer>} PNG
 */
export async function makeCard (o = {}) {
  const {
    type = 'welcome',
    name = 'Member',
    group = '',
    memberCount = null,
    subtitle = '',
    footer = '',
    avatar = null,
    background = null,
    theme: themeName = 'ocean',
    width = 1080,
    height = 540
  } = o

  const theme = getTheme(themeName)
  const img = await buildBackground(width, height, theme, background)

  // sanitasi semua teks agar glyph-nya ada di font
  const _name = sanitizeText(name) || 'Member'
  const _group = sanitizeText(group)
  const _sub = sanitizeText(subtitle)
  const _footer = sanitizeText(footer)

  // ── dekorasi: bar aksen kiri + sudut
  bar(img, 0, 0, 14, height, theme.accent)
  bar(img, 0, height - 10, width, 10, theme.accent)
  disc(img, width - 60, 70, 130, theme.accent, 0.10)
  disc(img, width - 30, height - 40, 80, theme.accent, 0.08)

  // ── panel teks (kontras)
  const avatarSize = Math.round(height * 0.40)
  const padX = 56
  const av = await roundAvatar(avatar, { size: avatarSize, accent: theme.accent, name: _name })
  const avX = padX
  const avY = Math.round((height - av.size) / 2)
  img.composite(av.img, avX, avY)

  const textX = avX + av.size + 46
  const textW = width - textX - 60
  roundRect(img, textX - 30, Math.round(height * 0.16), textW + 44, Math.round(height * 0.68), [0, 0, 0], 0.30, 30)

  // ── label kecil
  let y = Math.round(height * 0.20)
  const fSmall = await font(32)
  const label = LABELS[type] || LABELS.welcome
  img.print({ font: fSmall, x: textX, y, text: label })
  y += 46
  bar(img, textX, y, Math.min(150, measure(fSmall, label) + 10), 5, theme.accent)
  y += 30

  // ── nama (besar, auto-fit)
  const nameLayer = await textLayer(_name, { maxHeight: Math.round(height * 0.145), maxWidth: textW - 10 })
  img.composite(nameLayer.img, textX, y)
  y += nameLayer.h + 14

  // ── subtitle
  const sub = _sub || (type === 'welcome'
    ? 'Semoga betah & jangan lupa baca deskripsi grup ya!'
    : type === 'leave'
      ? 'Terima kasih sudah pernah jadi bagian dari kita.'
      : type === 'promote'
        ? 'Sekarang kamu punya wewenang admin. Gunakan dengan bijak!'
        : 'Wewenang admin telah dicabut.')
  const fBody = await font(16)
  let sy = y
  for (const line of wrapText(fBody, sub, textW - 10).slice(0, 3)) {
    img.print({ font: fBody, x: textX, y: sy, text: line })
    sy += 26
  }
  y = sy + 10

  // ── nama grup + jumlah member
  if (group) {
    const fGrp = await font(32)
    const grpLine = memberCount != null ? `${_group}  |  ${memberCount} member` : _group
    const gl = wrapText(fGrp, grpLine, textW - 10)[0] || ''
    img.print({ font: fGrp, x: textX, y: Math.min(y, height - 96), text: gl })
  }

  // ── footer pojok kanan bawah
  if (_footer) {
    const fFoot = await font(16)
    const fw = measure(fFoot, _footer)
    img.print({ font: fFoot, x: Math.max(20, width - fw - 40), y: height - 52, text: _footer })
  }

  return await img.getBuffer('image/png')
}

/* ------------------------------------------------------------------ */
/*  BANNER MENU (customizable)                                         */
/* ------------------------------------------------------------------ */

/**
 * Banner header menu. Bisa pakai gambar custom (background) atau
 * gradient tema + judul bot.
 * @returns {Promise<Buffer>} PNG
 */
export async function makeBanner (o = {}) {
  const {
    title = 'THERYHANN!',
    subtitle = 'WhatsApp Bot • Interactive • AI Rich',
    footer = '',
    background = null,
    theme: themeName = 'midnight',
    width = 900,
    height = 420
  } = o

  const theme = getTheme(themeName)
  const img = await buildBackground(width, height, theme, background)

  const _title = sanitizeText(title) || 'MENU'
  const _subtitle = sanitizeText(subtitle)
  const _footer = sanitizeText(footer)

  bar(img, 0, 0, width, 8, theme.accent)
  bar(img, 0, height - 8, width, 8, theme.accent)
  disc(img, width - 50, 60, 120, theme.accent, 0.10)
  speckles(img, _title + width, theme.accent, 34)

  roundRect(img, 40, Math.round(height * 0.22), width - 80, Math.round(height * 0.52), [0, 0, 0], 0.32, 26)

  let y = Math.round(height * 0.28)
  const t = await textLayer(_title, { maxHeight: Math.round(height * 0.17), maxWidth: width - 150 })
  img.composite(t.img, Math.round((width - t.w) / 2), y)
  y += t.h + 16

  const fBody = await font(16)
  const sw = measure(fBody, _subtitle)
  img.print({ font: fBody, x: Math.round((width - sw) / 2), y, text: _subtitle })
  y += 34

  bar(img, Math.round(width / 2 - 60), y, 120, 4, theme.accent)

  if (_footer) {
    const fFoot = await font(16)
    const fw = measure(fFoot, _footer)
    img.print({ font: fFoot, x: Math.round((width - fw) / 2), y: height - 56, text: _footer })
  }

  return await img.getBuffer('image/png')
}

export default { makeCard, makeBanner, roundAvatar, THEMES, THEME_NAMES, getTheme, randomTheme, initials, sanitizeText }
