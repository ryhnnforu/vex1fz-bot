/**
 * lib/img.js — generator gambar vex1fz
 *  • bratPng / bratAnim / bratVidAnim — stiker brat (+varian warna)
 *  • smemePng — meme stiker (font Anton ala meme)
 *  • kutipanPng / qcPng — quote card & quote bulat
 *  • welcomeCard — kartu sambutan/perpisahan grup aesthetic
 *  • stampWm — tempel watermark "nama user • vex1fz bye ryhn"
 *  • framesToWebp / videoToWebp — animasi via ffmpeg (libwebp_anim)
 *
 * WATERMARK TIDAK lagi ditempel di output stiker (permintaan owner) —
 * wm hanya untuk UI menu. Fungsi wmText/stampWm tetap ada untuk .genimage/UI.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFile } = require('child_process')
const { GlobalFonts, createCanvas, loadImage } = require('@napi-rs/canvas')

const FONT_DIR = path.join(__dirname, '..', 'fonts')
let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  try {
    GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Anton.ttf'), 'Anton')
    GlobalFonts.registerFromPath(path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'), 'VexBold')
    GlobalFonts.registerFromPath(path.join(FONT_DIR, 'DejaVuSans.ttf'), 'Vex')
  } catch (_) {}
  fontsReady = true
}

/* ═══════════ WATERMARK ═══════════ */
function wmText(name) {
  const n = String(name || '').trim().split(/\s+/).slice(0, 3).join(' ') || 'User'
  return `${n} • vex1fz bye ryhn`
}

/** buang emoji/karakter aneh agar aman dirender canvas */
function clean(s) {
  return String(s || '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** gambar → canvas bulat (untuk kartu welcome) */
function drawCircleImage(ctx, img, x, y, d) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(img, x, y, d, d)
  ctx.restore()
}

/** teks ter-bungkus jadi baris2 */
function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > maxWidth && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

/** cari ukuran font pas agar muat di kotak */
function fitText(ctx, text, { family, maxW, maxH, start, min = 16, weight = '' }) {
  let size = start
  while (size > min) {
    ctx.font = `${weight ? weight + ' ' : ''}${size}px ${family}`
    const lines = wrapText(ctx, text, maxW)
    const lh = size * 1.14
    if (lines.length * lh <= maxH && lines.every(l => ctx.measureText(l).width <= maxW)) {
      return { size, lines, lh }
    }
    size -= 2
  }
  ctx.font = `${weight ? weight + ' ' : ''}${min}px ${family}`
  return { size: min, lines: wrapText(ctx, text, maxW), lh: min * 1.14 }
}

/** tempel watermark ke gambar (return buffer PNG) */
async function stampWm(buf, name, { align = 'bottom', size = 22, alpha = 0.9 } = {}) {
  ensureFonts()
  const img = await loadImage(buf)
  const cv = createCanvas(img.width, img.height)
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const t = wmText(name)
  ctx.font = `${size}px VexBold`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  const pad = Math.max(10, Math.round(img.width * 0.02))
  const x = img.width - pad
  const y = align === 'top' ? pad + size : img.height - pad
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.fillText(t, x, y)
  ctx.globalAlpha = 1
  return cv.toBuffer('image/png')
}

/* ═══════════ BRAT ═══════════ */

/**
 * Brat style: teks lowercase besar rata kiri di latar polos.
 * @param {object} opt { bg, fg, name, weight }
 */
async function bratPng(text, { bg = '#ffffff', fg = '#111111', name = '', weight = '' } = {}) {
  ensureFonts()
  const t = clean(text) || 'brat'
  const cv = createCanvas(512, 512)
  const ctx = cv.getContext('2d')
  if (bg === 'gradient' || bg === 'grad') {
    const g = ctx.createLinearGradient(0, 0, 512, 512)
    g.addColorStop(0, '#7f00ff')
    g.addColorStop(1, '#e100ff')
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = bg
  }
  ctx.fillRect(0, 0, 512, 512)
  const pad = 26
  const fit = fitText(ctx, t.toLowerCase(), {
    family: 'Vex', maxW: 512 - pad * 2, maxH: 512 - pad * 2 - 40, start: 92, min: 18, weight
  })
  ctx.font = `${weight ? weight + ' ' : ''}${fit.size}px Vex`
  ctx.fillStyle = fg
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const totalH = fit.lines.length * fit.lh
  let y = (512 - 40 - totalH) / 2
  for (const line of fit.lines) {
    ctx.fillText(line, pad, y)
    y += fit.lh
  }
  return cv.toBuffer('image/png')
}

function luminance(hex) {
  const m = String(hex).replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** frame brat untuk animasi: smooth = fade+zoom; vid = goyang cepat */
function bratFrame(text, i, total, { bg, fg, name, mode = 'smooth' }) {
  ensureFonts()
  if (bg === 'gradient' || bg === 'grad') bg = '#8a2be2'
  const t = clean(text) || 'brat'
  const cv = createCanvas(512, 512)
  const ctx = cv.getContext('2d')
  let frameBg = bg
  if (mode === 'vid' && i % 6 < 2) frameBg = shade(bg, 18) // kilatan warna
  ctx.fillStyle = frameBg
  ctx.fillRect(0, 0, 512, 512)

  const pad = 26
  const fit = fitText(ctx, t.toLowerCase(), {
    family: 'Vex', maxW: 512 - pad * 2, maxH: 512 - pad * 2 - 40, start: 92, min: 18
  })
  const p = i / total
  ctx.save()
  if (mode === 'smooth') {
    // gerakan halus: zoom + goyang halus + rotasi tipis + fade pelan (semua sinus mulus)
    const tau = p * Math.PI * 2
    const scale = 1 + 0.03 * Math.sin(tau)
    const dx = Math.sin(tau * 2) * 4
    const dy = Math.cos(tau * 2) * 3
    const rot = Math.sin(tau) * 0.008            // ±0.46 derajat
    ctx.globalAlpha = 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(tau * 2 - Math.PI / 2))
    ctx.translate(256 + dx, 246 + dy)
    ctx.rotate(rot)
    ctx.scale(scale, scale)
    ctx.translate(-256, -246)
  } else {
    const dx = Math.sin(p * Math.PI * 6) * 7
    const dy = Math.cos(p * Math.PI * 8) * 5
    ctx.translate(dx, dy)
  }
  ctx.font = `${fit.size}px Vex`
  ctx.fillStyle = fg
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const totalH = fit.lines.length * fit.lh
  let y = (512 - 40 - totalH) / 2
  for (const line of fit.lines) {
    ctx.fillText(line, pad, y)
    y += fit.lh
  }
  ctx.restore()
  return cv.toBuffer('image/png')
}

function shade(hex, amt) {
  const m = String(hex).replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  let r = parseInt(full.slice(0, 2), 16)
  let g = parseInt(full.slice(2, 4), 16)
  let b = parseInt(full.slice(4, 6), 16)
  r = Math.max(0, Math.min(255, r + amt))
  g = Math.max(0, Math.min(255, g + amt))
  b = Math.max(0, Math.min(255, b + amt))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

/** rangkai beberapa frame PNG → animated webp (ffmpeg) */
function framesToWebp(frames, fps = 12, quality = 78) {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vxf_'))
    try {
      frames.forEach((buf, i) => {
        fs.writeFileSync(path.join(dir, `f_${String(i).padStart(3, '0')}.png`), buf)
      })
      const out = path.join(dir, 'out.webp')
      execFile(ffmpegPath(), [
        '-y', '-framerate', String(fps), '-i', path.join(dir, 'f_%03d.png'),
        '-c:v', 'libwebp_anim', '-loop', '0', '-q:v', String(quality),
        '-compression_level', '4', '-an', '-vsync', '0', out
      ], { timeout: 45_000 }, (err) => {
        try {
          if (err || !fs.existsSync(out)) return reject(err || new Error('ffmpeg webp gagal'))
          const buf = fs.readFileSync(out)
          fs.rmSync(dir, { recursive: true, force: true })
          resolve(buf)
        } catch (e) { reject(e) }
      })
    } catch (e) {
      try { fs.rmSync(dir, { recursive: true, force: true }) } catch (_) {}
      reject(e)
    }
  })
}

function ffmpegPath() {
  try {
    const installer = require('@ffmpeg-installer/ffmpeg')
    if (installer?.path && fs.existsSync(installer.path)) return installer.path
  } catch (_) {}
  return 'ffmpeg'
}

/** video/stiker-animasi → animated webp sticker 512 + watermark drawtext */
function videoToStickerWebp(videoBuf, name, ext = 'mp4') {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vxv_'))
    const input = path.join(dir, `in.${ext}`)
    const out = path.join(dir, 'out.webp')
    fs.writeFileSync(input, videoBuf)
    const filter = [
      'scale=512:512:force_original_aspect_ratio=increase',
      'crop=512:512',
      'fps=12'
    ].join(',')
    execFile(ffmpegPath(), [
      '-y', '-t', '10', '-i', input,
      '-vf', filter,
      '-c:v', 'libwebp_anim', '-loop', '0', '-q:v', '72',
      '-compression_level', '5', '-an', '-vsync', '0', out
    ], { timeout: 60_000 }, (err) => {
      try {
        if (err || !fs.existsSync(out)) return reject(err || new Error('video → webp gagal'))
        const buf = fs.readFileSync(out)
        fs.rmSync(dir, { recursive: true, force: true })
        resolve(buf)
      } catch (e) { reject(e) }
    })
  })
}

/** brat di atas gambar (reply foto) + watermark */
async function bratOnImagePng(imgBuf, text, { name = '' } = {}) {
  ensureFonts()
  const W = 512, H = 512
  const cv = createCanvas(W, H)
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, W, H)
  try {
    const img = await loadImage(imgBuf)
    const scale = Math.max(W / img.width, H / img.height)
    ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale)
  } catch (_) {}
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, W, H)
  const t = clean(text) || 'brat'
  const pad = 26
  const fit = fitText(ctx, t.toLowerCase(), { family: 'Vex', maxW: W - pad * 2, maxH: H - pad * 2 - 40, start: 84, min: 18 })
  ctx.font = `${fit.size}px Vex`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const totalH = fit.lines.length * fit.lh
  let y = (H - 40 - totalH) / 2
  for (const line of fit.lines) {
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 6
    ctx.fillText(line, pad, y)
    y += fit.lh
  }
  ctx.shadowBlur = 0
  return cv.toBuffer('image/png')
}

/** video/stiker animasi → mp4 gif-like + watermark (untuk .togif) */
function mediaToGifMp4(mediaBuf, name, ext = 'mp4') {
  return new Promise((resolve, reject) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vxg_'))
    const input = path.join(dir, `in.${ext}`)
    const out = path.join(dir, 'out.mp4')
    fs.writeFileSync(input, mediaBuf)
    const wm = wmText(name).replace(/'/g, '').replace(/:/g, '').replace(/\\/g, '')
    const font = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf')
    const filter = [
      'scale=480:-2:force_original_aspect_ratio=decrease',
      'fps=12',
      `drawtext=fontfile='${font}':text='${wm}':fontcolor=white@0.9:fontsize=18:x=w-tw-10:y=h-th-8:box=1:boxcolor=black@0.3:boxborderw=5`
    ].join(',')
    execFile(ffmpegPath(), [
      '-y', '-t', '10', '-i', input, '-vf', filter,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
      '-movflags', '+faststart', '-an', out
    ], { timeout: 60_000 }, (err) => {
      try {
        if (err || !fs.existsSync(out)) return reject(err || new Error('gif gagal'))
        const buf = fs.readFileSync(out)
        fs.rmSync(dir, { recursive: true, force: true })
        resolve(buf)
      } catch (e) { reject(e) }
    })
  })
}

/** gambar + teks → stiker webp statis dengan watermark (dipakai .s gambar) */
async function imageToStickerWebp(imgBuf, name) {
  // tanpa watermark (permintaan owner) — name dibiarkan agar kompatibel
  const stamped = imgBuf
  const sharp = require('sharp')
  return sharp(stamped)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 84, effort: 4 })
    .toBuffer()
}

/* ═══════════ SMEME ═══════════ */

/**
 * Meme stiker ala "smeme": teks atas|bawah font Anton, stroke hitam.
 * imgBuf opsional (pakai gambar yang di-reply).
 */
async function smemePng(top, bottom, imgBuf = null, { name = '' } = {}) {
  ensureFonts()
  const W = 512, H = 512
  const cv = createCanvas(W, H)
  const ctx = cv.getContext('2d')
  // latar TERANG (bukan hitam) — gradient cerah ala meme
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#ffd76e')
  g.addColorStop(1, '#ff8fab')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  if (imgBuf) {
    let drawn = false
    try {
      const img = await loadImage(imgBuf)
      const scale = Math.max(W / img.width, H / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
      drawn = true
    } catch (_) {}
    if (!drawn) {
      try { // fallback: normalisasi via sharp lalu coba lagi
        const sharp = require('sharp')
        const png = await sharp(imgBuf).resize(W, H, { fit: 'cover' }).png().toBuffer()
        const img = await loadImage(png)
        ctx.drawImage(img, 0, 0, W, H)
        drawn = true
      } catch (_) {}
    }
  }

  const pad = 18
  const drawMeme = (text, yStart, yEnd, upper = true) => {
    if (!text) return
    const t = upper ? text.toUpperCase() : text
    const fit = fitText(ctx, t, { family: 'Anton', maxW: W - pad * 2, maxH: (yEnd - yStart), start: 72, min: 22 })
    ctx.font = `${fit.size}px Anton`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const cy = (yStart + yEnd) / 2
    const totalH = fit.lines.length * fit.lh
    let y = cy - totalH / 2 + fit.lh / 2
    for (const line of fit.lines) {
      ctx.lineJoin = 'round'
      ctx.miterLimit = 2
      ctx.strokeStyle = 'rgba(0,0,0,0.95)'
      ctx.lineWidth = Math.max(3, fit.size * 0.06)
      ctx.strokeText(line, W / 2, y)
      ctx.lineWidth = Math.max(6, fit.size * 0.14)
      ctx.strokeStyle = '#000000'
      ctx.strokeText(line, W / 2, y)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(line, W / 2, y)
      y += fit.lh
    }
  }
  drawMeme(top, 6, H * 0.46, true)
  drawMeme(bottom, H * 0.54, H - 42, true)

  // watermark kecil pojok
  ctx.font = `15px VexBold`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'
  ctx.strokeText(wmText(name), W - 12, H - 10)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(wmText(name), W - 12, H - 10)

  return cv.toBuffer('image/png')
}

/* ═══════════ KUTIPAN & QC ═══════════ */

async function kutipanPng(text, author = '', { name = '' } = {}) {
  ensureFonts()
  const cv = createCanvas(512, 512)
  const ctx = cv.getContext('2d')
  // latar gradasi gelap
  const g = ctx.createLinearGradient(0, 0, 512, 512)
  g.addColorStop(0, '#141e30')
  g.addColorStop(1, '#243b55')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  // dekorasi kutip besar
  ctx.font = '220px Anton'
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.textAlign = 'left'
  ctx.fillText('"', 20, 190)

  const t = clean(text)
  const fit = fitText(ctx, t, { family: 'VexBold', maxW: 420, maxH: 240, start: 40, min: 18, weight: 'bold' })
  ctx.font = `bold ${fit.size}px VexBold`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let y = 200 - (fit.lines.length * fit.lh) / 2 + fit.lh / 2
  for (const line of fit.lines) {
    ctx.fillText(line, 256, y)
    y += fit.lh
  }
  if (author) {
    ctx.font = '24px Vex'
    ctx.fillStyle = '#9fd3ff'
    ctx.fillText('— ' + clean(author).slice(0, 40), 256, 400)
  }
  ctx.font = '17px VexBold'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(wmText(name), 256, 498)
  return cv.toBuffer('image/png')
}

async function qcPng(text, { name = '', color = '#7c4dff' } = {}) {
  ensureFonts()
  const cv = createCanvas(512, 512)
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 512)
  // lingkaran
  ctx.beginPath()
  ctx.arc(256, 246, 210, 0, Math.PI * 2)
  ctx.lineWidth = 12
  ctx.strokeStyle = color
  ctx.stroke()

  const t = clean(text)
  const fit = fitText(ctx, t, { family: 'VexBold', maxW: 330, maxH: 220, start: 44, min: 16, weight: 'bold' })
  ctx.font = `bold ${fit.size}px VexBold`
  ctx.fillStyle = '#222222'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let y = 220 - (fit.lines.length * fit.lh) / 2 + fit.lh / 2
  for (const line of fit.lines) {
    ctx.fillText(line, 256, y)
    y += fit.lh
  }
  ctx.font = 'bold 22px VexBold'
  ctx.fillStyle = color
  ctx.fillText(clean(name).slice(0, 24) || 'anon', 256, 344)
  ctx.font = '15px VexBold'
  ctx.fillStyle = '#888888'
  ctx.textBaseline = 'bottom'
  ctx.fillText(wmText(name), 256, 500)
  return cv.toBuffer('image/png')
}

/* ═══════════ KARTU WELCOME / GOODBYE ═══════════ */

/**
 * Kartu sambutan/perpisahan aesthetic.
 * @param {object} o { name, num, group, date, ppBuf, joining: bool, members: number }
 */
async function welcomeCard({ name = 'Member', num = '', group = '', date = '', ppBuf = null, joining = true, members = 0 }) {
  ensureFonts()
  const W = 1000, H = 420
  const cv = createCanvas(W, H)
  const ctx = cv.getContext('2d')

  // latar gradasi
  const g = joining
    ? ctx.createLinearGradient(0, 0, W, H)
    : ctx.createLinearGradient(0, 0, W, H)
  if (joining) { g.addColorStop(0, '#0f2027'); g.addColorStop(0.5, '#203a43'); g.addColorStop(1, '#2c5364') }
  else { g.addColorStop(0, '#2b1055'); g.addColorStop(1, '#41295a') }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // lingkaran dekoratif
  ctx.globalAlpha = 0.10
  ctx.fillStyle = joining ? '#7fffd4' : '#ff7eb3'
  ctx.beginPath(); ctx.arc(920, 60, 130, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(90, 380, 110, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // aksen atas
  ctx.fillStyle = joining ? '#43e97b' : '#f857a6'
  ctx.fillRect(0, 0, W, 8)

  // foto profil bulat
  const d = 190
  const px = 60, py = (H - d) / 2
  try {
    if (ppBuf) {
      const img = await loadImage(ppBuf)
      ctx.save()
      ctx.beginPath()
      ctx.arc(px + d / 2, py + d / 2, d / 2 + 8, 0, Math.PI * 2)
      ctx.fillStyle = joining ? '#43e97b' : '#f857a6'
      ctx.fill()
      drawCircleImage(ctx, img, px, py, d)
      ctx.restore()
    } else throw new Error('no pp')
  } catch (_) {
    // fallback: inisial
    ctx.beginPath()
    ctx.arc(px + d / 2, py + d / 2, d / 2, 0, Math.PI * 2)
    ctx.fillStyle = joining ? '#43e97b' : '#f857a6'
    ctx.fill()
    ctx.font = '96px Anton'
    ctx.fillStyle = '#0f2027'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((clean(name)[0] || 'V').toUpperCase(), px + d / 2, py + d / 2 + 6)
  }

  const X = 300
  // header
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '30px VexBold'
  ctx.fillStyle = joining ? '#43e97b' : '#f857a6'
  ctx.fillText(joining ? 'WELCOME  •  SELAMAT DATANG' : 'GOODBYE  •  SELAMAT TINGGAL', X, 78)

  // nama besar
  const fitName = fitText(ctx, clean(name) || 'Member', { family: 'Anton', maxW: 640, maxH: 80, start: 64, min: 30 })
  ctx.font = `${fitName.size}px Anton`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(fitName.lines[0], X, 150)

  // detail (tanpa emoji — font canvas tidak punya emoji color)
  ctx.font = '24px Vex'
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  let y = 205
  if (num) { ctx.fillText(`NOMOR   : ${num}`, X, y); y += 40 }
  if (group) { ctx.fillText(`GRUP    : ${group}`.slice(0, 64), X, y); y += 40 }
  ctx.fillText(`TANGGAL : ${date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, X, y); y += 40
  if (members) { ctx.fillText(`MEMBER  : ${members} orang`, X, y) }

  // footer watermark
  ctx.font = '20px VexBold'
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText('vex1fz bye ryhn', W - 24, H - 18)
  ctx.textAlign = 'left'

  return cv.toBuffer('image/png')
}

/* ═══════════ KARTU PROFIL ═══════════ */

async function profileCard({ name = 'User', num = '', status = '', level = '', limit = '', accent = '#43e97b' }) {
  ensureFonts()
  const W = 1000, H = 380
  const cv = createCanvas(W, H)
  const ctx = cv.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1a1a2e')
  g.addColorStop(1, '#16213e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 0.12
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.arc(900, 70, 140, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(80, 340, 100, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 8)

  // lingkaran inisial
  ctx.beginPath()
  ctx.arc(150, H / 2, 95, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.fill()
  ctx.font = '84px Anton'
  ctx.fillStyle = '#16213e'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText((clean(name)[0] || 'V').toUpperCase(), 150, H / 2 + 6)

  const X = 290
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '52px Anton'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(clean(name).slice(0, 24), X, 120)
  ctx.font = '24px Vex'
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  let y = 170
  if (num) { ctx.fillText(`NOMOR : ${num}`, X, y); y += 42 }
  if (level) { ctx.fillText(`STATUS: ${level}`, X, y); y += 42 }
  if (limit) { ctx.fillText(`LIMIT : ${limit}`, X, y); y += 42 }
  if (status) { ctx.fillText(status.slice(0, 52), X, y) }

  ctx.font = '20px VexBold'
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText('vex1fz bye ryhn', W - 24, H - 18)
  return cv.toBuffer('image/png')
}

module.exports = {
  ensureFonts, wmText, clean, wrapText, fitText, stampWm,
  bratPng, bratFrame, bratOnImagePng, framesToWebp, videoToStickerWebp, mediaToGifMp4, imageToStickerWebp,
  smemePng, kutipanPng, qcPng, welcomeCard, profileCard, ffmpegPath, shade, luminance
}
