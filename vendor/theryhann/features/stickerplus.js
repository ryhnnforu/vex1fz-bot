/**
 * 🎨 STICKER PLUS — filter & efek stiker (jimp, lokal)
 * Kategori "Sticker Menu". Butuh gambar: reply gambar atau kirim gambar.
 * Konversi ke webp memakai ffmpeg (sama seperti .sticker bawaan).
 */
import fs from 'node:fs'
import { Jimp, loadFont } from 'jimp'
import { SANS_64_BLACK } from 'jimp/fonts'
import { config } from '../config.js'
import { saveTmp, toWebp } from '../lib/functions.js'

const P = config.display.prefix

async function srcBuffer (m) {
  try {
    if (m.quoted?.isMedia) return await m.quoted.toBuffer()
    if (m.isMedia) {
      const p = await m.download()
      return fs.readFileSync(p)
    }
  } catch {}
  return null
}

async function sendAsSticker (m, buf) {
  const input = saveTmp(buf, 'png')
  const output = input.replace(/\.png$/, '.webp')
  try {
    await toWebp(input, output, { animated: false, sticker: true })
    const webp = fs.readFileSync(output)
    return await m.sendSticker(webp)
  } catch {
    // ffmpeg tidak ada -> kirim sebagai gambar biasa
    return await m.sendImage(buf, '⚠️ ffmpeg tidak tersedia, dikirim sebagai gambar.')
  }
}

async function edit (m, fn) {
  const buf = await srcBuffer(m)
  if (!buf) return m.reply(`Kirim atau reply sebuah gambar, lalu pakai perintah ini.\nContoh: reply gambar → \`${P}${m.command}\``)
  try {
    const img = await Jimp.read(buf)
    await fn(img)
    const out = await img.getBuffer('image/png')
    return await sendAsSticker(m, out)
  } catch (e) {
    return m.fail(e)
  }
}

const NUM = (m, def) => { const n = parseInt(m.args[0]); return isNaN(n) ? def : n }

export const sGray = { command: ['sgray', 'stikergray', 'grayscale', 'hitamputih'], category: 'Sticker Menu', description: 'Stiker jadi hitam-putih', limit: 0, run: m => edit(m, img => img.greyscale()) }
export const sInvert = { command: ['sinvert', 'stikerinvert', 'negatif', 'negative'], category: 'Sticker Menu', description: 'Stiker negatif (warna terbalik)', limit: 0, run: m => edit(m, img => img.invert()) }
export const sBlur = { command: ['sblur', 'stikerblur', 'blur'], category: 'Sticker Menu', description: 'Stiker blur (default 4)', limit: 0, run: m => edit(m, img => img.blur(NUM(m, 4))) }
export const sGaussian = { command: ['sgaussian', 'stikergaussian'], category: 'Sticker Menu', description: 'Stiker gaussian blur halus', limit: 0, run: m => edit(m, img => img.gaussian(NUM(m, 6))) }
export const sRotate = { command: ['srotate', 'stikerputar', 'putar'], category: 'Sticker Menu', description: 'Putar stiker (derajat, default 90)', limit: 0, run: m => edit(m, img => img.rotate(NUM(m, 90))) }
export const sFlipH = { command: ['sflip', 'stikerflip', 'mirror', 'cermin'], category: 'Sticker Menu', description: 'Cerminkan stiker horizontal', limit: 0, run: m => edit(m, img => img.flip(true, false)) }
export const sFlipV = { command: ['sflipv', 'stikerflipv', 'balikvertikal'], category: 'Sticker Menu', description: 'Balik stiker vertikal', limit: 0, run: m => edit(m, img => img.flip(false, true)) }
export const sCircle = { command: ['scircle', 'stikerbulat', 'bulat', 'lingkaran'], category: 'Sticker Menu', description: 'Potong stiker jadi lingkaran', limit: 0, run: m => edit(m, img => img.circle()) }
export const sBright = { command: ['sbright', 'stikerterang', 'cerahkan'], category: 'Sticker Menu', description: 'Atur terang (-100..100, default 20)', limit: 0, run: m => edit(m, img => img.brightness(NUM(m, 20) / 100)) }
export const sContrast = { command: ['scontrast', 'stikerkontras', 'kontras'], category: 'Sticker Menu', description: 'Atur kontras (-100..100, default 30)', limit: 0, run: m => edit(m, img => img.contrast(NUM(m, 30) / 100)) }
export const sPoster = { command: ['sposter', 'stikerposter', 'posterize'], category: 'Sticker Menu', description: 'Efek poster (default 4 level)', limit: 0, run: m => edit(m, img => img.posterize(NUM(m, 4))) }
export const sOpacity = { command: ['sopacity', 'stikertransparan', 'transparan'], category: 'Sticker Menu', description: 'Atur transparansi (0-100, default 50)', limit: 0, run: m => edit(m, img => img.opacity(NUM(m, 50) / 100)) }

export const attp = {
  command: ['attp', 'stikerteks', 'textsticker', 'ttpwarna'],
  category: 'Sticker Menu',
  description: 'Buat stiker teks berwarna (format: teks|warnahex)',
  limit: 0,
  run: async (m) => {
    const [text, color] = String(m.q || '').split('|')
    if (!text?.trim()) return m.reply(`Contoh: \`${P}attp HALO|ffcc00\` (warna opsional)`)
    const bg = /^([0-9a-f]{6})$/i.test((color || '').trim()) ? parseInt(color.trim(), 16) : 0xffcc00
    try {
      const font = await loadFont(SANS_64_BLACK)
      const lines = String(text).split('\n').slice(0, 4)
      let maxw = 0
      for (const l of lines) { let w = 0; for (const ch of l) w += font.chars[ch]?.xadvance || 0; maxw = Math.max(maxw, w) }
      const w = Math.max(64, maxw + 40)
      const h = Math.max(64, lines.length * 80 + 40)
      const img = new Jimp({ width: w, height: h, color: ((bg << 8) | 0xff) >>> 0 })
      let y = 20
      for (const l of lines) { img.print({ font, x: 20, y, text: l }); y += 80 }
      const out = await img.getBuffer('image/png')
      return await sendAsSticker(m, out)
    } catch (e) {
      return m.fail(e)
    }
  }
}
