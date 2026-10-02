/**
 * lib/sticker.js — konversi gambar/video → stiker WhatsApp (webp)
 * pakai sharp (utama) + fallback ffmpeg untuk video frame
 */
const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const config = require('../config')
const { log } = require('./util')

/** path binary ffmpeg: @ffmpeg-installer dulu, fallback binary system */
function ffmpegPath() {
  try {
    const installer = require('@ffmpeg-installer/ffmpeg')
    if (installer?.path && fs.existsSync(installer.path)) return installer.path
  } catch (_) {}
  return 'ffmpeg'
}

/** buffer (jpg/png/webp) → webp sticker buffer 512x512 */
async function toWebp(buffer) {
  const sharp = require('sharp')
  return sharp(buffer)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer()
}

/** video buffer → ambil 1 frame → jpg buffer */
function videoFrame(videoBuf) {
  return new Promise((resolve, reject) => {
    const tmpIn = path.join(require('os').tmpdir(), `vx_in_${Date.now()}.mp4`)
    const tmpOut = path.join(require('os').tmpdir(), `vx_out_${Date.now()}.jpg`)
    fs.writeFileSync(tmpIn, videoBuf)
    execFile(ffmpegPath(), [
      '-y', '-ss', '0.8', '-i', tmpIn,
      '-frames:v', '1', '-q:v', '4', tmpOut
    ], { timeout: 30_000 }, (err) => {
      try {
        if (err || !fs.existsSync(tmpOut)) return reject(err || new Error('ffmpeg gagal'))
        const out = fs.readFileSync(tmpOut)
        fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut)
        resolve(out)
      } catch (e) {
        reject(e)
      }
    })
  })
}

/** kirim stiker ke chat (buffer apa pun yang bisa jadi webp) */
async function sendSticker(sock, jid, buffer, quoted) {
  const webp = await toWebp(buffer)
  return sock.sendMessage(jid, { sticker: webp }, quoted ? { quoted } : undefined)
}

/** kirim stiker emosi dari aset bundel */
async function sendEmoteSticker(sock, jid, file, quoted) {
  const full = path.join(__dirname, '..', 'media', 'stickers', file)
  if (!fs.existsSync(full)) return null
  try {
    return await sendSticker(sock, jid, fs.readFileSync(full), quoted)
  } catch (e) {
    log.warn('stiker emosi gagal:', e.message)
    return null
  }
}

/** deteksi tipe media dari pesan yang di-quote */
function mediaTypeOf(quoted) {
  if (!quoted) return null
  if (quoted.type === 'imageMessage') return 'image'
  if (quoted.type === 'videoMessage') return 'video'
  return null
}

module.exports = { toWebp, videoFrame, sendSticker, sendEmoteSticker, mediaTypeOf, ffmpegPath }
