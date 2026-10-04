/**
 * 🎨 STICKERLAB — 50 fitur stiker & olah gambar (kategori Sticker Menu, v6)
 * ------------------------------------------------------------
 *  22 efek/filter gambar (sepia, duotone, vignette, threshold, hue,
 *     border, rounded, meme text, watermark, mirror 4 arah, ...)
 *  6 konversi & analisis (PNG/JPG/WEBP/base64, info gambar, warna dominan)
 *  12 stiker teks bergaya (gradasi, outline, neon, bayangan, rainbow, ...)
 *  6 stiker otomatis (tanggal, jam, kutipan, nama, peringatan, ucapan)
 *  4 utilitas (info stiker, upscale, downscale, jadikan persegi)
 *
 *  Semua pakai jimp + ffmpeg (lewat toWebp). Kalau ffmpeg tidak ada,
 *  hasil dikirim sebagai gambar biasa agar fitur tetap berguna.
 */
import fs from 'node:fs'
import { Jimp, loadFont } from 'jimp'
import { SANS_64_BLACK } from 'jimp/fonts'
import { config } from '../config.js'
import { saveTmp, toWebp, truncate, formatSize, pickRandom } from '../lib/functions.js'

const P = config.display.prefix
const MAX = 512 // ukuran standar stiker WhatsApp

/* ------------------------- helper dasar ------------------------- */
async function srcBuffer (m) {
  try {
    if (m.quoted?.isMedia) return await m.quoted.toBuffer()
    if (m.isMedia) {
      const p = await m.download()
      return fs.readFileSync(p)
    }
  } catch { /* media tidak bisa diunduh */ }
  return null
}

async function sendAsSticker (m, buf, catatan = '') {
  const input = saveTmp(buf, 'png')
  const output = input.replace(/\.png$/, '.webp')
  try {
    await toWebp(input, output, { animated: false, sticker: true })
    const webp = fs.readFileSync(output)
    return await m.sendSticker(webp)
  } catch {
    return await m.sendImage(buf, `⚠️ ffmpeg tidak tersedia, dikirim sebagai gambar.${catatan ? '\n' + catatan : ''}`)
  }
}

const NUM = (m, def, i = 0) => { const n = Number(m.args[i]); return Number.isFinite(n) ? n : def }
const clamp = (n, a, b) => Math.min(b, Math.max(a, n))
const hexToRgba = (hex, a = 255) => {
  const h = String(hex).replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (!/^[0-9a-f]{6}$/i.test(f)) throw new Error(`Warna hex salah: ${hex} (contoh: 1abc9c)`)
  return ((parseInt(f.slice(0, 2), 16) << 24) | (parseInt(f.slice(2, 4), 16) << 16) | (parseInt(f.slice(4, 6), 16) << 8) | a) >>> 0
}

/** jalankan filter jimp pada gambar dari user, kirim sebagai stiker */
async function edit (m, fn, perlu = true) {
  const buf = await srcBuffer(m)
  if (!buf) {
    return perlu
      ? m.reply(`Kirim atau balas sebuah *gambar*, lalu pakai perintah ini.\nContoh: balas gambar → ${P}${m.command}`)
      : null
  }
  try {
    const img = await Jimp.read(buf)
    await fn(img, m)
    const out = await img.getBuffer('image/png')
    return await sendAsSticker(m, out)
  } catch (e) {
    return m.reply(`⚠️ Gagal mengolah gambar: ${truncate(String(e.message || e), 160)}`)
  }
}

const efek = (command, aliases, description, fn, contoh = '1') => ({
  command: [command, ...aliases],
  category: 'Sticker Menu',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: m => edit(m, fn)
})

/* ------------------------- helper teks (lapisan) ------------------------- */
const fontCache = {}
async function font () {
  if (!fontCache.f) fontCache.f = await loadFont(SANS_64_BLACK)
  return fontCache.f
}
const ukurTeks = (f, teks) => {
  let w = 0
  for (const ch of teks) w += f.chars[ch]?.xadvance || f.chars['?']?.xadvance || 30
  return w
}
/** pecah teks jadi baris agar muat lebar maksimum */
function bungkus (f, teks, maks) {
  const kata = String(teks).split(/\s+/)
  const baris = []
  let cur = ''
  for (const k of kata) {
    const coba = cur ? cur + ' ' + k : k
    if (ukurTeks(f, coba) > maks && cur) { baris.push(cur); cur = k } else cur = coba
    if (ukurTeks(f, cur) > maks * 1.6) { baris.push(cur); cur = '' }
  }
  if (cur) baris.push(cur)
  return baris.slice(0, 6)
}

/**
 * Render teks ke gambar transparan (glyph BMFont hitam → diwarnai ulang).
 * @returns {Promise<Jimp>}
 */
async function renderTeks (teks, { fg = 0xffffffff, ukuran = 64, maks = 420, align = 'center', rainbow = false } = {}) {
  const f = await font()
  const baris = bungkus(f, teks, maks)
  const lebar = Math.max(...baris.map(b => ukurTeks(f, b)), 32) + 8
  const tinggi = baris.length * 74 + 8
  const img = new Jimp({ width: Math.ceil(lebar), height: Math.ceil(tinggi), color: 0x00000000 })
  let y = 4
  for (const b of baris) {
    const w = ukurTeks(f, b)
    const x = align === 'left' ? 4 : Math.max(4, Math.round((lebar - w) / 2))
    img.print({ font: f, x, y, text: b })
    y += 74
  }
  // warnai ulang glyph (BMFont hanya hitam)
  const [fr, fg2, fb, fa] = [(fg >>> 24) & 255, (fg >>> 16) & 255, (fg >>> 8) & 255, fg & 255]
  img.scan((x, yy, idx) => {
    const a = img.bitmap.data[idx + 3]
    if (a > 8) {
      let r = fr, g = fg2, bl = fb
      if (rainbow) {
        const hue = (x / Math.max(1, img.bitmap.width)) * 360
        const [rr, gg, bb] = hslToRgb(hue, 90, 60)
        r = rr; g = gg; bl = bb
      }
      img.bitmap.data[idx] = r
      img.bitmap.data[idx + 1] = g
      img.bitmap.data[idx + 2] = bl
      img.bitmap.data[idx + 3] = fa === 255 ? a : Math.round(a * (fa / 255))
    }
  })
  if (ukuran !== 64) {
    const skala = clamp(ukuran / 64, 0.3, 4)
    img.resize({ w: Math.round(img.bitmap.width * skala), h: Math.round(img.bitmap.height * skala) })
  }
  return img
}

function rgbToHsl (r, g, b) {
  r /= 255; g /= 255; b /= 255
  const maks = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (maks + min) / 2
  if (maks !== min) {
    const d = maks - min
    s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min)
    if (maks === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (maks === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, Math.round(s * 100), Math.round(l * 100)]
}
function ubahSaturasi (img, jumlah) {
  img.scan((x, y, i) => {
    const r = img.bitmap.data[i], g = img.bitmap.data[i + 1], b = img.bitmap.data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    img.bitmap.data[i] = clamp(lum + (r - lum) * (1 + jumlah), 0, 255)
    img.bitmap.data[i + 1] = clamp(lum + (g - lum) * (1 + jumlah), 0, 255)
    img.bitmap.data[i + 2] = clamp(lum + (b - lum) * (1 + jumlah), 0, 255)
  })
}

function hslToRgb (h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))]
}

/** kanvas dengan latar: warna polos / gradasi / stripe */
function kanvas (w, h, gaya = {}) {
  const img = new Jimp({ width: w, height: h, color: (gaya.bg ?? 0x00000000) >>> 0 })
  if (gaya.gradasi) {
    const [c1, c2] = gaya.gradasi
    img.scan((x, y, idx) => {
      const t = y / Math.max(1, h - 1)
      for (let i = 0; i < 3; i++) {
        const a = (c1 >>> (24 - i * 8)) & 255
        const b = (c2 >>> (24 - i * 8)) & 255
        img.bitmap.data[idx + i] = Math.round(a + (b - a) * t)
      }
      img.bitmap.data[idx + 3] = 255
    })
  }
  if (gaya.stripe) {
    const lebar = gaya.stripe.lebar || 24
    img.scan((x, y, idx) => {
      if (Math.floor((x + y) / lebar) % 2 === 0) {
        img.bitmap.data[idx] = gaya.stripe.warna[0]
        img.bitmap.data[idx + 1] = gaya.stripe.warna[1]
        img.bitmap.data[idx + 2] = gaya.sticker?.warna?.[2] ?? gaya.stripe.warna[2]
        img.bitmap.data[idx + 3] = 255
      }
    })
  }
  return img
}

/** gabung teks (+outline) ke atas kanvas, hasil akhir PNG */
async function composeStiker (teks, opt = {}) {
  const {
    bg = 0x00000000, gradasi = null, ukuran = 64, fg = 0xffffffff,
    outline = 0, padding = 24, maks = 420, rainbow = false, bayangan = 0
  } = opt
  const teksImg = await renderTeks(teks, { fg, ukuran, maks, rainbow })
  const w = teksImg.bitmap.width + padding * 2 + (outline + bayangan) * 2
  const h = teksImg.bitmap.height + padding * 2 + (outline + bayangan) * 2
  const canvas = kanvas(w, h, { bg, gradasi, stripe: opt.stripe })
  const x0 = padding + outline + bayangan
  const y0 = padding + outline + bayangan
  if (bayangan) {
    const shadow = teksImg.clone()
    shadow.scan((x, y, idx) => {
      if (shadow.bitmap.data[idx + 3] > 8) {
        shadow.bitmap.data[idx] = 0
        shadow.bitmap.data[idx + 1] = 0
        shadow.bitmap.data[idx + 2] = 0
        shadow.bitmap.data[idx + 3] = 130
      }
    })
    canvas.composite(shadow, x0 + bayangan, y0 + bayangan)
  }
  if (outline) {
    const hitam = 0xff000000 >>> 0
    const layerOutline = await renderTeks(teks, { fg: hitam, ukuran, maks, rainbow: false })
    for (let dx = -outline; dx <= outline; dx += Math.max(1, outline)) {
      for (let dy = -outline; dy <= outline; dy += Math.max(1, outline)) {
        if (dx === 0 && dy === 0) continue
        canvas.composite(layerOutline.clone(), x0 + dx, y0 + dy)
      }
    }
    for (let dx = -outline; dx <= outline; dx++) {
      canvas.composite(layerOutline.clone(), x0 + dx, y0)
      canvas.composite(layerOutline.clone(), x0, y0 + dx)
    }
  }
  canvas.composite(teksImg, x0, y0)
  // batasi ke ukuran stiker standar
  if (canvas.bitmap.width > MAX || canvas.bitmap.height > MAX) {
    const skala = Math.min(MAX / canvas.bitmap.width, MAX / canvas.bitmap.height)
    canvas.resize({ w: Math.round(canvas.bitmap.width * skala), h: Math.round(canvas.bitmap.height * skala) })
  }
  return await canvas.getBuffer('image/png')
}

const stikerTeks = (command, aliases, description, optFn, contoh = 'HALO') => ({
  command: [command, ...aliases],
  category: 'Sticker Menu',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    const opt = typeof optFn === 'function' ? optFn(m, (m.q || '').trim()) : optFn
    const teks = (m.q || '').trim() || opt.teksOtomatis
    if (!teks) return m.reply(`Butuh teks.\nContoh: ${P}${command} ${contoh}`)
    try {
      const buf = await composeStiker(teks, opt)
      return await sendAsSticker(m, buf)
    } catch (e) {
      return m.reply(`⚠️ ${truncate(String(e.message || e), 180)}`)
    }
  }
})

/* ================================================================== */
/*  A. EFEK / FILTER GAMBAR (22)                                       */
/* ================================================================== */
export const efekCmds = [
  efek('stikersepia', ['sepia', 'efeksepia'], 'Efek sepia (foto jadul kecokelatan)', img => {
    img.scan((x, y, i) => {
      const r = img.bitmap.data[i], g = img.bitmap.data[i + 1], b = img.bitmap.data[i + 2]
      img.bitmap.data[i] = clamp(0.393 * r + 0.769 * g + 0.189 * b, 0, 255)
      img.bitmap.data[i + 1] = clamp(0.349 * r + 0.686 * g + 0.168 * b, 0, 255)
      img.bitmap.data[i + 2] = clamp(0.272 * r + 0.534 * g + 0.131 * b, 0, 255)
    })
  }),

  efek('stikerpixelate', ['pixelate', 'mosaik'], 'Efek piksel/mosaik (sensor)', (img, m) => {
    const size = clamp(NUM(m, 10), 3, 60)
    img.pixelate(size)
  }, '10'),

  efek('stikerthreshold', ['threshold', 'hitamputihkeras'], 'Hitam-putih keras (threshold)', (img, m) => {
    const t = clamp(NUM(m, 128), 10, 245)
    img.scan((x, y, i) => {
      const gray = (img.bitmap.data[i] * 0.299 + img.bitmap.data[i + 1] * 0.587 + img.bitmap.data[i + 2] * 0.114)
      const v = gray > t ? 255 : 0
      img.bitmap.data[i] = img.bitmap.data[i + 1] = img.bitmap.data[i + 2] = v
    })
  }, '128'),

  efek('stikerduotone', ['duotone'], 'Duotone 2 warna: .stikerduotone 1a1a2e e94560', (img, m) => {
    const c1 = hexToRgba(m.args[0] || '1a1a2e')
    const c2 = hexToRgba(m.args[1] || 'e94560')
    const ch = (c, k) => (c >>> (24 - k * 8)) & 255
    img.scan((x, y, i) => {
      const gray = (img.bitmap.data[i] * 0.299 + img.bitmap.data[i + 1] * 0.587 + img.bitmap.data[i + 2] * 0.114) / 255
      for (let k = 0; k < 3; k++) img.bitmap.data[i + k] = Math.round(ch(c1, k) + (ch(c2, k) - ch(c1, k)) * gray)
    })
  }, '1a1a2e e94560'),

  efek('stikerborder', ['bingkaistiker', 'garispinggir'], 'Tambah bingkai warna: .stikerborder ffcc00 12', (img, m) => {
    const warna = hexToRgba(m.args[0] || 'ffcc00')
    const tebal = clamp(NUM(m, 12, 1), 2, 40)
    img.scan((x, y, i) => {
      if (x < tebal || y < tebal || x >= img.bitmap.width - tebal || y >= img.bitmap.height - tebal) {
        img.bitmap.data[i] = (warna >>> 24) & 255
        img.bitmap.data[i + 1] = (warna >>> 16) & 255
        img.bitmap.data[i + 2] = (warna >>> 8) & 255
        img.bitmap.data[i + 3] = 255
      }
    })
  }, 'ffcc00 12'),

  efek('stikerrounded', ['sudutmembulat', 'rounded'], 'Potong sudut membulat (transparan)', (img, m) => {
    const r = clamp(NUM(m, 40), 8, 200)
    const w = img.bitmap.width, h = img.bitmap.height
    img.scan((x, y, i) => {
      const dx = Math.min(x, w - 1 - x), dy = Math.min(y, h - 1 - y)
      if (dx < r && dy < r) {
        const d = Math.hypot(r - dx, r - dy)
        if (d > r) img.bitmap.data[i + 3] = 0
      }
    })
  }, '40'),

  efek('stikervignette', ['vignette'], 'Efek vignette (sudut gelap)', (img, m) => {
    const kuat = clamp(NUM(m, 60), 10, 100) / 100
    const w = img.bitmap.width, h = img.bitmap.height
    const cx = w / 2, cy = h / 2
    const maks = Math.hypot(cx, cy)
    img.scan((x, y, i) => {
      const d = Math.hypot(x - cx, y - cy) / maks
      const f = 1 - kuat * Math.pow(d, 2.2)
      for (let k = 0; k < 3; k++) img.bitmap.data[i + k] = clamp(img.bitmap.data[i + k] * f, 0, 255)
    })
  }, '60'),

  efek('stikerwarm', ['warm', 'hangat'], 'Nuansa hangat (kuning/oranye naik)', (img, m) => {
    const n = clamp(NUM(m, 25), 5, 80)
    img.scan((x, y, i) => {
      img.bitmap.data[i] = clamp(img.bitmap.data[i] + n, 0, 255)
      img.bitmap.data[i + 1] = clamp(img.bitmap.data[i + 1] + Math.round(n * 0.5), 0, 255)
      img.bitmap.data[i + 2] = clamp(img.bitmap.data[i + 2] - Math.round(n * 0.3), 0, 255)
    })
  }, '25'),

  efek('stikercool', ['cool', 'dingin'], 'Nuansa dingin (biru naik)', (img, m) => {
    const n = clamp(NUM(m, 25), 5, 80)
    img.scan((x, y, i) => {
      img.bitmap.data[i] = clamp(img.bitmap.data[i] - Math.round(n * 0.3), 0, 255)
      img.bitmap.data[i + 1] = clamp(img.bitmap.data[i + 1] + Math.round(n * 0.2), 0, 255)
      img.bitmap.data[i + 2] = clamp(img.bitmap.data[i + 2] + n, 0, 255)
    })
  }, '25'),

  efek('stikerjadul', ['vintage', 'oldphoto'], 'Efek foto jadul (sepia + vignette + noise)', img => {
    img.scan((x, y, i) => {
      const r = img.bitmap.data[i], g = img.bitmap.data[i + 1], b = img.bitmap.data[i + 2]
      const noise = (Math.random() - 0.5) * 22
      img.bitmap.data[i] = clamp(0.393 * r + 0.769 * g + 0.189 * b + noise, 0, 255)
      img.bitmap.data[i + 1] = clamp(0.349 * r + 0.686 * g + 0.168 * b + noise, 0, 255)
      img.bitmap.data[i + 2] = clamp(0.272 * r + 0.534 * g + 0.131 * b + noise, 0, 255)
    })
    const w = img.bitmap.width, h = img.bitmap.height
    img.scan((x, y, i) => {
      const d = Math.hypot(x - w / 2, y - h / 2) / Math.hypot(w / 2, h / 2)
      const f = 1 - 0.55 * Math.pow(d, 2.4)
      for (let k = 0; k < 3; k++) img.bitmap.data[i + k] = clamp(img.bitmap.data[i + k] * f, 0, 255)
    })
  }),

  efek('stikerhue', ['geserwarna', 'hueshift'], 'Geser roda warna (derajat)', (img, m) => {
    const deg = NUM(m, 90)
    img.scan((x, y, i) => {
      const [h, sa, l] = rgbToHsl(img.bitmap.data[i], img.bitmap.data[i + 1], img.bitmap.data[i + 2])
      const [r, g, b] = hslToRgb((h + deg + 360) % 360, sa, l)
      img.bitmap.data[i] = r; img.bitmap.data[i + 1] = g; img.bitmap.data[i + 2] = b
    })
  }, '90'),

  efek('stikersaturasi', ['saturate', 'warnacerah'], 'Naikkan saturasi warna (0..100)', (img, m) => {
    ubahSaturasi(img, clamp(NUM(m, 40), 1, 100) / 100)
  }, '40'),

  efek('stikerdesaturasi', ['desaturate', 'warnapudar'], 'Pudarkan warna (0..100)', (img, m) => {
    ubahSaturasi(img, -clamp(NUM(m, 60), 1, 100) / 100)
  }, '60'),

  efek('stikerresize', ['ubahukuran', 'resize'], 'Ubah ukuran (piksel, default 300)', (img, m) => {
    const s = clamp(NUM(m, 300), 64, 1024)
    img.resize({ w: s, h: s })
  }, '300'),

  {
    command: ['stikerkompres', 'perkecilgambar', 'compress'],
    category: 'Sticker Menu',
    description: 'Perkecil ukuran file gambar (kualitas JPEG turun)',
    limit: 0, cooldown: 2, contoh: '40',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Kirim/balas gambar lalu ketik ${P}stikerkompres [kualitas 10-90]`)
      try {
        const q = clamp(Number(m.args[0]) || 40, 10, 90)
        const img = await Jimp.read(buf)
        if (Math.max(img.bitmap.width, img.bitmap.height) > 480) img.resize({ w: Math.round(img.bitmap.width * 480 / Math.max(img.bitmap.width, img.bitmap.height)), h: Math.round(img.bitmap.height * 480 / Math.max(img.bitmap.width, img.bitmap.height)) })
        const out = await img.getBuffer('image/jpeg', { quality: q })
        return await m.sendImage(out, `🗜️ *DIKOMPRES*\n\n${formatSize(buf.length)} → *${formatSize(out.length)}* (kualitas ${q}%)\nHemat ${Math.max(0, Math.round((1 - out.length / buf.length) * 100))}%`)
      } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 150)}`) }
    }
  },

  efek('stikerpersegi', ['squarepad', 'jadipersegi'], 'Jadikan persegi dengan padding warna', (img, m) => {
    const sisi = Math.max(img.bitmap.width, img.bitmap.height)
    const warna = hexToRgba(m.args[0] || 'ffffff')
    const canvas = new Jimp({ width: sisi, height: sisi, color: warna >>> 0 })
    canvas.composite(img, Math.round((sisi - img.bitmap.width) / 2), Math.round((sisi - img.bitmap.height) / 2))
    img.bitmap = canvas.bitmap
  }, 'ffffff'),

  efek('stikerteksatas', ['textoverlay', 'tulisdigambar'], 'Tulis teks di atas gambar: .stikerteksatas HALO', async (img, m) => {
    const teks = (m.q || '').trim()
    if (!teks) return m.reply(`Contoh: reply gambar → ${P}stikerteksatas Halo Semua`)
    const layer = await renderTeks(teks, { fg: 0xffffffff, ukuran: Math.round(clamp(img.bitmap.width / 8, 20, 64)), maks: img.bitmap.width - 20 })
    img.composite(layer, Math.round((img.bitmap.width - layer.bitmap.width) / 2), Math.round(img.bitmap.height - layer.bitmap.height - 16))
  }, 'Halo Semua'),

  efek('stikerwatermark', ['watermark', 'tandaair'], 'Tambah watermark teks di pojok', async (img, m) => {
    const teks = (m.q || config.bot.name).trim()
    const layer = await renderTeks(teks, { fg: 0xffffffaa, ukuran: Math.round(clamp(img.bitmap.width / 14, 14, 40)), maks: img.bitmap.width - 10 })
    img.composite(layer, img.bitmap.width - layer.bitmap.width - 10, img.bitmap.height - layer.bitmap.height - 10)
  }, 'theryhann!'),

  efek('stikermeme', ['memestiker', 'memeatas'], 'Stiker meme teks atas|bawah', async (img, m) => {
    const [atas, bawah] = String(m.q || '').split('|')
    if (!atas) return m.reply(`Contoh: reply gambar → ${P}stikermeme TEKS ATAS|teks bawah`)
    const ukuran = Math.round(clamp(img.bitmap.width / 9, 22, 56))
    if (atas.trim()) {
      const l = await renderTeks(atas.trim().toUpperCase(), { fg: 0xffffffff, ukuran, maks: img.bitmap.width - 16, outlineWarna: true })
      img.composite(l, Math.round((img.bitmap.width - l.bitmap.width) / 2), 10)
    }
    if (bawah?.trim()) {
      const l = await renderTeks(bawah.trim().toUpperCase(), { fg: 0xffffffff, ukuran, maks: img.bitmap.width - 16 })
      img.composite(l, Math.round((img.bitmap.width - l.bitmap.width) / 2), img.bitmap.height - l.bitmap.height - 10)
    }
  }, 'AKU|JUGA'),

  efek('stikercrop', ['croptengah', 'potongtengah'], 'Potong jadi persegi dari tengah', img => {
    const sisi = Math.min(img.bitmap.width, img.bitmap.height)
    img.crop({ x: Math.round((img.bitmap.width - sisi) / 2), y: Math.round((img.bitmap.height - sisi) / 2), w: sisi, h: sisi })
  }),

  efek('stikerkaleidoskop', ['mirror4', 'kaleidoskop'], 'Cermin 4 arah (kaleidoskop)', img => {
    const w = Math.floor(img.bitmap.width / 2), h = Math.floor(img.bitmap.height / 2)
    const quad = img.clone().crop({ x: 0, y: 0, w, h })
    const canvas = new Jimp({ width: w * 2, height: h * 2, color: 0x00000000 })
    const flipH = quad.clone().flip(true, false)
    const flipV = quad.clone().flip(false, true)
    const flipHV = quad.clone().flip(true, true)
    canvas.composite(quad, 0, 0)
    canvas.composite(flipH, w, 0)
    canvas.composite(flipV, 0, h)
    canvas.composite(flipHV, w, h)
    img.bitmap = canvas.bitmap
  }),

  efek('stikerlatarputih', ['whitebg', 'latarputih'], 'Ganti area transparan jadi putih', img => {
    img.scan((x, y, i) => {
      if (img.bitmap.data[i + 3] < 200) {
        img.bitmap.data[i] = img.bitmap.data[i + 1] = img.bitmap.data[i + 2] = 255
        img.bitmap.data[i + 3] = 255
      }
    })
  })
]

/* ================================================================== */
/*  B. KONVERSI & ANALISIS (6)                                         */
/* ================================================================== */
const konv = (command, aliases, description, mime, ext, contoh) => ({
  command: [command, ...aliases],
  category: 'Sticker Menu',
  description,
  limit: 0,
  cooldown: 2,
  contoh: contoh || '1',
  run: async m => {
    const buf = await srcBuffer(m)
    if (!buf) return m.reply(`Kirim/balas gambar atau stiker lalu ketik ${P}${command}`)
    try {
      const img = await Jimp.read(buf)
      const out = await img.getBuffer(mime)
      if (mime === 'image/webp' || ext === 'webp') return await sendAsSticker(m, out)
      return await m.sendImage(out, `✅ Dikonversi ke ${ext.toUpperCase()} (${formatSize(out.length)})`)
    } catch (e) {
      return m.reply(`⚠️ ${truncate(String(e.message || e), 160)}`)
    }
  }
})

export const konversiCmds = [
  konv('topng', ['konversipng', 'jadipng'], 'Konversi gambar/stiker ke PNG', 'image/png', 'png'),
  konv('tojpg', ['konversijpg', 'jadijpeg'], 'Konversi ke JPG (ukuran lebih kecil)', 'image/jpeg', 'jpg'),
  konv('towebp', ['konversiwebp', 'jadiwebp'], 'Konversi ke WEBP (stiker)', 'image/webp', 'webp'),

  {
    command: ['tobase64img', 'imgbase64', 'datauri'],
    category: 'Sticker Menu',
    description: 'Ubah gambar jadi data URI base64',
    limit: 0, cooldown: 2, contoh: '1',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Kirim/balas gambar lalu ketik ${P}tobase64img`)
      const b64 = buf.toString('base64')
      return m.reply(`🔤 *DATA URI* (${formatSize(buf.length)} → ${formatSize(b64.length)})\n\n\`\`\`\ndata:image/png;base64,${b64.slice(0, 3000)}${b64.length > 3000 ? '...' : ''}\n\`\`\`\n\nPanjang total: ${b64.length.toLocaleString('id-ID')} karakter`)
    }
  },

  {
    command: ['infoimg', 'infogambar', 'imageinfo'],
    category: 'Sticker Menu',
    description: 'Info gambar: ukuran, dimensi, mode warna',
    limit: 0, cooldown: 2, contoh: '1',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Kirim/balas gambar atau stiker lalu ketik ${P}infoimg`)
      try {
        const img = await Jimp.read(buf)
        let transparan = 0, total = 0
        img.scan((x, y, i) => { total++; if (img.bitmap.data[i + 3] < 255) transparan++ })
        return m.reply(`🖼️ *INFO GAMBAR*\n\nUkuran file : ${formatSize(buf.length)}\nDimensi     : ${img.bitmap.width} × ${img.bitmap.height} px\nRasio       : ${(img.bitmap.width / img.bitmap.height).toFixed(2)}:1\nMegapiksel  : ${((img.bitmap.width * img.bitmap.height) / 1e6).toFixed(2)} MP\nPiksel transparan: ${((transparan / total) * 100).toFixed(1)}%\nMIME tebakan: ${buf.slice(0, 4).toString('hex').startsWith('89504e47') ? 'image/png' : buf.slice(0, 3).toString('hex').startsWith('ffd8ff') ? 'image/jpeg' : buf.slice(0, 4).toString('ascii').startsWith('RIFF') ? 'image/webp' : 'lainnya'}\n\nCocok untuk stiker: ${img.bitmap.width >= 200 && img.bitmap.height >= 200 ? '✅ ya' : '⚠️ terlalu kecil'}`)
      } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 150)}`) }
    }
  },

  {
    command: ['warnadominan', 'dominantcolor', 'warnautama'],
    category: 'Sticker Menu',
    description: 'Deteksi 5 warna dominan sebuah gambar',
    limit: 0, cooldown: 2, contoh: '1',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Kirim/balas gambar lalu ketik ${P}warnadominan`)
      try {
        const img = await Jimp.read(buf)
        const peta = {}
        img.scan((x, y, i) => {
          if (img.bitmap.data[i + 3] < 128) return
          const r = img.bitmap.data[i] >> 5 << 5
          const g = img.bitmap.data[i + 1] >> 5 << 5
          const b = img.bitmap.data[i + 2] >> 5 << 5
          const k = `${r},${g},${b}`
          peta[k] = (peta[k] || 0) + 1
        })
        const top = Object.entries(peta).sort((a, b) => b[1] - a[1]).slice(0, 5)
        const total = Object.values(peta).reduce((a, b) => a + b, 0) || 1
        return m.reply(`🎨 *WARNA DOMINAN*\n\n${top.map(([k, n], i) => {
          const [r, g, b] = k.split(',').map(Number)
          const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
          return `${i + 1}. ${hex.toUpperCase()} — rgb(${r},${g},${b}) · ${((n / total) * 100).toFixed(1)}%`
        }).join('\n')}\n\nPakai untuk duotone: ${P}stikerduotone ${top[0]?.[0].split(',').map(v => Number(v).toString(16).padStart(2, '0')).join('') || '1a1a2e'} ${top[1]?.[0].split(',').map(v => Number(v).toString(16).padStart(2, '0')).join('') || 'e94560'}`)
      } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 150)}`) }
    }
  }
]

/* ================================================================== */
/*  C. STIKER TEKS BERGAYA (12)                                        */
/* ================================================================== */
export const teksCmds = [
  stikerTeks('ttpgradasi', ['textgradient', 'stikergradasi'], 'Stiker teks dengan latar gradasi', (m, t) => {
    const [a, b] = (m.args.slice(-2).length === 2 && /^[0-9a-f]{6}$/i.test(m.args.at(-1)) && /^[0-9a-f]{6}$/i.test(m.args.at(-2))) ? [m.args.at(-2), m.args.at(-1)] : ['6a11cb', '2575fc']
    return { gradasi: [hexToRgba(a), hexToRgba(b)], fg: 0xffffffff, outline: 2, padding: 30 }
  }, 'HALO 6a11cb 2575fc'),

  stikerTeks('ttpoutline', ['textoutline', 'teks garis'.replace(' ', '')], 'Stiker teks dengan garis tepi tebal', () => ({ fg: 0xffcc00ff, outline: 6, padding: 26 }), 'HALO'),

  stikerTeks('ttpkotak', ['textbox', 'tekskotak'], 'Stiker teks dalam kotak berwarna', (m) => ({
    bg: hexToRgba((m.args.at(-1) || '').match(/^[0-9a-f]{6}$/i) ? m.args.at(-1) : '222831'),
    fg: 0x00adb5ff, padding: 34, outline: 0
  }), 'HALO 222831'),

  stikerTeks('ttpbulat', ['textcircle', 'teksbulat'], 'Stiker teks dengan latar lingkaran', (m) => {
    const warna = hexToRgba((m.args.at(-1) || '').match(/^[0-9a-f]{6}$/i) ? m.args.at(-1) : 'e94560')
    return { bg: warna, fg: 0xffffffff, padding: 46, outline: 3 }
  }, 'HALO e94560'),

  stikerTeks('ttpneon', ['neontext', 'teksneon'], 'Stiker teks efek neon (glow)', (m) => ({
    bg: 0xff0a0a1a >>> 0, fg: 0xff00ff9d >>> 0, outline: 5, padding: 34
  }), 'NEON'),

  stikerTeks('ttpbayangan', ['textshadow', 'teksbayangan'], 'Stiker teks dengan bayangan', (m) => ({
    bg: 0xfff5f5f5 >>> 0, fg: 0xff1a1a1a >>> 0, bayangan: 5, padding: 30
  }), 'BAYANGAN'),

  stikerTeks('ttpbesar', ['bigtext', 'teksbesar'], 'Stiker teks ukuran besar', () => ({ fg: 0xffffffff, outline: 6, ukuran: 96, padding: 20 }), 'BESAR'),

  stikerTeks('ttpkecil', ['smalltext', 'tekskecil'], 'Stiker teks ukuran kecil', () => ({ fg: 0xffffffff, outline: 3, ukuran: 34, padding: 18 }), 'kecil'),

  stikerTeks('ttprainbow', ['rainbowtext', 'tekspelangi'], 'Stiker teks warna pelangi', () => ({ rainbow: true, outline: 4, padding: 26 }), 'PELANGI'),

  stikerTeks('ttpstrip', ['stripedtext', 'teksloreng'], 'Stiker teks latar loreng', () => ({
    stripe: { lebar: 20, warna: [255, 204, 0] }, fg: 0xff1a1a1a >>> 0, outline: 3, padding: 28
  }), 'LORENG'),

  stikerTeks('stikerhari', ['stikertanggal', 'tanggalstiker'], 'Stiker otomatis bertuliskan tanggal hari ini', () => {
    const d = new Date()
    return { teksOtomatis: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }), gradasi: [hexToRgba('11998e'), hexToRgba('38ef7d')], fg: 0xffffffff, outline: 2, padding: 28 }
  }, '1'),

  stikerTeks('stikerjam', ['jamstiker', 'clockstiker'], 'Stiker otomatis bertuliskan jam sekarang', () => {
    const d = new Date()
    return { teksOtomatis: d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB', bg: 0xff101820 >>> 0, fg: 0xff00e5ffff, outline: 3, padding: 30 }
  }, '1')
]


/* ================================================================== */
/*  D. STIKER OTOMATIS (6)                                             */
/* ================================================================== */
export const autoCmds = [
  {
    command: ['stikerkutipan', 'quotestiker', 'kutipanstiker'],
    category: 'Sticker Menu',
    description: 'Stiker berisi kutipan acak dari bank lokal',
    limit: 0, cooldown: 2, contoh: 'motivasi',
    run: async m => {
      const { randomQuote } = await import('../lib/datasets.js')
      const q = randomQuote(m.q || undefined)
      const teks = truncate(typeof q === 'string' ? q : (q?.teks || q?.q || 'Semangat!'), 90)
      const buf = await composeStiker(teks, { gradasi: [hexToRgba('41295a'), hexToRgba('2f0743')], fg: 0xffffd700ff, outline: 2, padding: 32 })
      return await sendAsSticker(m, buf)
    }
  },
  {
    command: ['stikernama', 'namestiker', 'badgenama'],
    category: 'Sticker Menu',
    description: 'Stiker name-tag dengan namamu',
    limit: 0, cooldown: 2, contoh: 'Budi',
    run: async m => {
      const nama = truncate((m.q || m.pushName || 'theryhann').trim(), 24)
      const buf = await composeStiker(`Halo, aku\n${nama}`, { bg: 0xfffff200ff >>> 0, fg: 0xff1a1a1aff >>> 0, padding: 34, ukuran: 56 })
      return await sendAsSticker(m, buf)
    }
  },
  {
    command: ['stikerperingatan', 'warningstiker', 'stikerwarning'],
    category: 'Sticker Menu',
    description: 'Stiker tanda peringatan dengan teksmu',
    limit: 0, cooldown: 2, contoh: 'JANGAN BERISIK',
    run: async m => {
      const teks = (m.q || 'PERHATIAN').trim().toUpperCase()
      const buf = await composeStiker(`⚠\n${truncate(teks, 30)}`, { bg: 0xffffcc00ff >>> 0, fg: 0xff111111ff >>> 0, outline: 0, padding: 30, stripe: null })
      return await sendAsSticker(m, buf)
    }
  },
  {
    command: ['stikerucapan', 'greetingstiker', 'stikerselamat'],
    category: 'Sticker Menu',
    description: 'Stiker ucapan (pagi/siang/malam/ultah/dll)',
    limit: 0, cooldown: 2, contoh: 'selamat pagi',
    run: async m => {
      const jenis = (m.q || 'selamat pagi').toLowerCase()
      const peta = {
        pagi: ['Selamat Pagi ☀', '1e3c72', '2a5298'], siang: ['Selamat Siang 🌤', 'f7971e', 'ffd200'],
        sore: ['Selamat Sore 🌇', 'ff5f6d', 'ffc371'], malam: ['Selamat Malam 🌙', '0f2027', '2c5364'],
        tidur: ['Selamat Tidur 😴', '232526', '414345'], ulang: ['Selamat Ulang Tahun 🎂', 'ff416c', 'ff4b2b'],
        tahun: ['Selamat Tahun Baru 🎉', '1a2980', '26d0ce'], lebaran: ['Selamat Idul Fitri 🕌', '134e5e', '71b280'],
        merdeka: ['Dirgahayu RI 🇮🇩', 'b31217', 'e52d27'], semangat: ['Semangat! 🔥', 'f12711', 'f5af19']
      }
      const key = Object.keys(peta).find(k => jenis.includes(k)) || 'pagi'
      const [teks, a, b] = peta[key]
      const buf = await composeStiker(teks, { gradasi: [hexToRgba(a), hexToRgba(b)], fg: 0xffffffff, outline: 3, padding: 32 })
      return await sendAsSticker(m, buf)
    }
  },
  {
    command: ['infostiker', ['stickerinfo', 'cekstiker']],
    category: 'Sticker Menu',
    description: 'Cek detail sebuah stiker/gambar',
    limit: 0, cooldown: 2, contoh: '1',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Balas sebuah *stiker* lalu ketik ${P}infostiker`)
      try {
        const img = await Jimp.read(buf)
        const px = img.bitmap.width * img.bitmap.height
        let nonTransparan = 0
        img.scan((x, y, i) => { if (img.bitmap.data[i + 3] > 8) nonTransparan++ })
        return m.reply(`🧾 *INFO STIKER*\n\nUkuran file : ${formatSize(buf.length)}\nDimensi     : ${img.bitmap.width} × ${img.bitmap.height}\nStandar WA  : 512×512 → ${img.bitmap.width === 512 && img.bitmap.height === 512 ? '✅ sesuai' : '⚠️ tidak standar'}\nIsi gambar  : ${((nonTransparan / px) * 100).toFixed(1)}% (sisanya transparan)\nFormat      : ${buf.slice(0, 4).toString('ascii').startsWith('RIFF') ? 'WEBP' : buf.slice(0, 3).toString('hex') === 'ffd8ff' ? 'JPEG' : buf.slice(0, 4).toString('hex') === '89504e47' ? 'PNG' : 'lainnya'}\n\nPerbaiki ukuran: ${P}stikerresize 512`)
      } catch (e) { return m.reply(`⚠️ Bukan gambar/stiker valid: ${truncate(e.message, 120)}`) }
    }
  },
  {
    command: ['stikerupscale', ['perbesarstiker', 'upscale']],
    category: 'Sticker Menu',
    description: 'Perbesar stiker/gambar ke 512px (upscale halus)',
    limit: 0, cooldown: 2, contoh: '512',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Balas stiker/gambar lalu ketik ${P}stikerupscale [ukuran]`)
      try {
        const img = await Jimp.read(buf)
        const target = clamp(NUM(m, 512), 256, 1024)
        const skala = target / Math.max(img.bitmap.width, img.bitmap.height)
        img.resize({ w: Math.round(img.bitmap.width * skala), h: Math.round(img.bitmap.height * skala) })
        const out = await img.getBuffer('image/png')
        return await sendAsSticker(m, out, `Diubah ke ${img.bitmap.width}×${img.bitmap.height}`)
      } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 150)}`) }
    }
  },
  {
    command: ['stikerdownscale', ['perkecilstiker', 'downscale']],
    category: 'Sticker Menu',
    description: 'Perkecil stiker/gambar (hemat kuota)',
    limit: 0, cooldown: 2, contoh: '256',
    run: async m => {
      const buf = await srcBuffer(m)
      if (!buf) return m.reply(`Balas stiker/gambar lalu ketik ${P}stikerdownscale [ukuran]`)
      try {
        const img = await Jimp.read(buf)
        const target = clamp(NUM(m, 256), 96, 512)
        const skala = target / Math.max(img.bitmap.width, img.bitmap.height)
        img.resize({ w: Math.round(img.bitmap.width * skala), h: Math.round(img.bitmap.height * skala) })
        const out = await img.getBuffer('image/png')
        return await sendAsSticker(m, out, `${formatSize(buf.length)} → ${formatSize(out.length)}`)
      } catch (e) { return m.reply(`⚠️ ${truncate(e.message, 150)}`) }
    }
  },
  {
    command: ['stikeracak', 'randomstiker', 'stikerrandomteks'],
    category: 'Sticker Menu',
    description: 'Stiker teks acak lucu (tanpa input)',
    limit: 0, cooldown: 2, contoh: '1',
    run: async m => {
      const KATA = ['SABAR', 'NGOPI DULU', 'WKWK', 'GAS!', 'OTW', 'BAPER', 'SANTUY', 'SEMOGAT', 'MANTAP', 'SIP', 'BOBO AH', 'LAPER', 'RECEH', 'GEMBIRA']
      const palet = [['6a11cb', '2575fc'], ['ff416c', 'ff4b2b'], ['11998e', '38ef7d'], ['f7971e', 'ffd200'], ['232526', '414345'], ['e94560', '0f3443']]
      const [a, b] = pickRandom(palet)
      const buf = await composeStiker(pickRandom(KATA), { gradasi: [hexToRgba(a), hexToRgba(b)], fg: 0xffffffff, outline: 3, padding: 32, ukuran: 72 })
      return await sendAsSticker(m, buf)
    }
  }
]

export const stickerlabCmds = [...efekCmds, ...konversiCmds, ...teksCmds, ...autoCmds]
export default { stickerlabCmds }
