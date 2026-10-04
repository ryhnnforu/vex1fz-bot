/**
 * 🌟 STIKER + WATERMARK (v7.15.0)
 *  .s / .sticker       → gambar/video/gif → stiker dengan WM pack & author (EXIF)
 *  .brat <teks>        → stiker teks ala "brat" (hijau lime, huruf hitam blur) + WM
 *  .bratvid <teks>     → brat animasi (kata muncul satu per satu) + WM
 *  .smeme atas|bawah   → stiker meme: balas gambar, teks putih outline hitam + WM
 *  .tohitam            → kulit/gambar jadi lebih gelap (efek "tohitam") + WM
 *  .toanime            → ubah foto jadi gaya anime (AI, kontext) + WM
 *  .toputih .tozombie .toghibli .tofigure .tocartoon → varian AI
 *  .setwm pack|author  → atur WM stiker pribadi;  .wm → lihat
 *  .swm                → ganti WM stiker yang dibalas jadi WM kamu
 */
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { Jimp, loadFont } from 'jimp'
import { SANS_64_BLACK, SANS_128_BLACK } from 'jimp/fonts'
import { config } from '../config.js'
import { saveTmp, toWebp, truncate, getBuffer } from '../lib/functions.js'
import { tambahWm, bacaWm } from '../lib/stikerwm.js'
import { getUser, saveNow } from '../lib/database.js'
import { layerTeksMeme } from '../lib/tekstebal.js'

const P = config.display.prefix
const sh = cmd => new Promise((res, rej) => exec(cmd, { maxBuffer: 64 * 1024 * 1024 }, (e, so, se) => (e ? rej(new Error(se || e.message)) : res(so))))

/* ---------------- WM per user ---------------- */
export function wmUser (m) {
  const u = m.userDB || getUser(m.senderKey || m.sender)
  return {
    packname: u.stikerPack || config.display.packname || config.bot.name,
    author: u.stikerAuthor || (m.pushName ? `by ${m.pushName}` : config.display.author || 'WhatsApp Bot')
  }
}
export async function kirimStikerWm (m, webp, wm) {
  const out = tambahWm(webp, wm || wmUser(m))
  return m.sendSticker(out)
}
async function bufDari (m) {
  try {
    if (m.quoted?.isMedia) return { buf: await m.quoted.download(), mime: m.quoted.mimetype || '' }
    if (m.isMedia) { const d = await m.download(); return { buf: d.buffer, mime: d.mime || m.mimetype || '' } }
  } catch {}
  return null
}
async function pngKeStiker (m, pngBuf, wm) {
  const input = saveTmp(pngBuf, 'png'); const output = input.replace(/\.png$/, '.webp')
  try {
    await toWebp(input, output, { animated: false })
    return await kirimStikerWm(m, fs.readFileSync(output), wm)
  } catch (e) {
    if (/ffmpeg/i.test(e.message)) return m.reply('❌ ffmpeg belum terpasang: `pkg install ffmpeg -y`')
    throw e
  } finally { for (const f of [input, output]) fs.existsSync(f) && fs.unlinkSync(f) }
}

/* ================= .s (dengan WM) ================= */
export const stikerWm = {
  command: ['s', 'sticker', 'stiker', 'stickergif', 'sgif', 'stikerimg', 'swm'],
  category: 'Sticker Menu',
  description: '🌟 Gambar/video/gif → stiker dengan watermark pack & author (.setwm untuk mengatur). .swm = ganti WM stiker yang dibalas',
  limit: 1,
  cooldown: 3,
  run: async m => {
    const src = await bufDari(m)
    const q = String(m.q || '').trim()
    if (!src) {
      return m.sendButtons({
        title: '🌟 Sticker Maker',
        text: `Kirim/balas *gambar*, *video* (≤10 dtk) atau *stiker* dengan caption \`${P}s\`\n\nWM sekarang:\n▸ Pack : *${wmUser(m).packname}*\n▸ Author: *${wmUser(m).author}*\nUbah: \`${P}setwm NamaPack|NamaAuthor\`\n\nLainnya: \`${P}brat teks\` · \`${P}bratvid teks\` · \`${P}smeme atas|bawah\` · \`${P}tohitam\` · \`${P}toanime\``,
        buttons: [{ text: '🟩 Brat', id: `${P}brat THERYHANN` }, { text: '⚙️ Set WM', id: `${P}wm` }, { text: '🏠 Menu', id: 'act:menu:main' }]
      })
    }
    await m.typing()
    try {
      let wm = wmUser(m)
      if (q.includes('|')) { const [a, b] = q.split('|').map(x => x.trim()); wm = { packname: a || wm.packname, author: b || wm.author } } else if (q) wm = { ...wm, packname: q }
      const mime = src.mime || ''
      if (mime.includes('webp')) return await kirimStikerWm(m, src.buf, wm) // stiker → ganti WM
      const anim = /gif|mp4|webm|video/.test(mime)
      const input = saveTmp(src.buf, anim ? 'mp4' : 'png'); const output = input.replace(/\.[^.]+$/, '.webp')
      try {
        if (anim) await sh(`ffmpeg -y -i "${input}" -t 10 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=single[p];[b][p]paletteuse" -loop 0 -an -vsync 0 -quality 60 -compression_level 6 "${output}"`)
        else await toWebp(input, output, { animated: false })
        let webp = fs.readFileSync(output)
        if (webp.length > 950 * 1024 && anim) { await sh(`ffmpeg -y -i "${input}" -t 6 -vf "scale=384:384:force_original_aspect_ratio=decrease,fps=8,pad=384:384:-1:-1:color=white@0.0" -loop 0 -an -quality 40 "${output}"`); webp = fs.readFileSync(output) }
        return await kirimStikerWm(m, webp, wm)
      } finally { for (const f of [input, output]) fs.existsSync(f) && fs.unlinkSync(f) }
    } catch (e) {
      if (/ffmpeg/i.test(e.message)) return m.reply('❌ ffmpeg belum terpasang.\n```pkg install ffmpeg -y```')
      return m.reply('❌ Gagal membuat stiker: ' + truncate(e.message, 200))
    }
  }
}

export const setwm = {
  command: ['setwm', 'setpack', 'setauthor', 'wmstiker'],
  category: 'Sticker Menu',
  description: '⚙️ Atur watermark stiker pribadi: .setwm NamaPack|NamaAuthor (reset: .setwm reset)',
  limit: 0,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`⚙️ *WATERMARK STIKER*\nPack : ${wmUser(m).packname}\nAuthor: ${wmUser(m).author}\n\nUbah: \`${P}setwm NamaPack|NamaAuthor\`\nContoh: \`${P}setwm Ryan Stiker|@ryan\`\nReset: \`${P}setwm reset\``)
    if (/^reset$/i.test(q)) { delete u.stikerPack; delete u.stikerAuthor; saveNow('users'); return m.reply('✅ WM stiker kembali ke bawaan bot.') }
    const [a, b] = q.split('|').map(x => x.trim().slice(0, 40))
    if (a) u.stikerPack = a
    if (b) u.stikerAuthor = b
    saveNow('users')
    return m.reply(`✅ WM stiker disimpan\nPack : *${u.stikerPack || wmUser(m).packname}*\nAuthor: *${u.stikerAuthor || wmUser(m).author}*\n\nSemua stiker (${P}s, ${P}brat, ${P}smeme, …) memakai WM ini.`)
  }
}
export const wm = { command: ['wm', 'cekwm', 'lihatwm'], category: 'Sticker Menu', description: '🔎 Lihat WM stiker kamu / WM stiker yang dibalas', limit: 0, run: async m => {
  if (m.quoted?.mtype === 'stickerMessage') { try { const b = await m.quoted.download(); const x = bacaWm(b); return m.reply(x ? `🔎 *WM STIKER*\nPack : ${x['sticker-pack-name'] || '-'}\nAuthor: ${x['sticker-pack-publisher'] || '-'}\n\nGanti jadi WM kamu: balas stiker → \`${P}swm\`` : 'ℹ️ Stiker ini tidak punya WM.') } catch {} }
  return setwm.run({ ...m, q: '' })
} }

/* ================= BRAT ================= */
const fontCache = {}
async function fontBrat (besar) { const k = besar ? 'b' : 'k'; if (!fontCache[k]) fontCache[k] = await loadFont(besar ? SANS_128_BLACK : SANS_64_BLACK); return fontCache[k] }
const lebarTeks = (f, t) => [...t].reduce((a, ch) => a + (f.chars[ch]?.xadvance || f.chars['?']?.xadvance || 30), 0)
function bungkus (f, teks, maks) {
  const out = []; let cur = ''
  for (const k of String(teks).split(/\s+/)) { const c = cur ? cur + ' ' + k : k; if (lebarTeks(f, c) > maks && cur) { out.push(cur); cur = k } else cur = c }
  if (cur) out.push(cur); return out
}
/** render satu frame brat (kanvas 512, hijau #8ACF00, teks hitam rata kiri, blur ringan) */
async function frameBrat (teks, { warna = 0xffffffff, tinta = 0x000000ff, blur = 2, tetap = null } = {}) {
  const img = new Jimp({ width: 512, height: 512, color: warna })
  const t = String(teks).toLowerCase().trim() || 'brat'
  const fBesar = await fontBrat(true); const fKecil = await fontBrat(false)
  /* ukuran adaptif: teks pendek → font besar (128), sedang → 96, panjang → 64/48 (dibungkus, turun ke bawah) */
  const n = t.length
  let f = fBesar, skala = 1, maks = 440
  if (tetap) { f = tetap.f; skala = tetap.skala } else if (n <= 12) { f = fBesar; skala = 1 } else if (n <= 30) { f = fBesar; skala = 0.75 } else if (n <= 70) { f = fKecil; skala = 1 } else if (n <= 120) { f = fKecil; skala = 0.8 } else { f = fKecil; skala = 0.62 }
  const lhBase = f === fBesar ? 128 : 72
  const maksW = maks / skala
  let baris = bungkus(f, t, maksW)
  while (baris.length * lhBase * skala > 470 && skala > 0.4) { skala -= 0.06; baris = bungkus(f, t, maks / skala) }
  baris = baris.slice(0, 10)
  const lh = Math.round(lhBase * skala)
  const layer0 = new Jimp({ width: Math.ceil(maksW) + 20, height: baris.length * lhBase + 10, color: 0x00000000 })
  baris.forEach((b, i) => layer0.print({ font: f, x: 4, y: i * lhBase, text: b }))
  const layer = layer0.clone(); layer.resize({ w: Math.max(2, Math.round(layer0.bitmap.width * skala)), h: Math.max(2, Math.round(layer0.bitmap.height * skala)) })
  const [r, g, bl] = [(tinta >>> 24) & 255, (tinta >>> 16) & 255, (tinta >>> 8) & 255]
  layer.scan((x, yy, i) => { if (layer.bitmap.data[i + 3] > 0) { layer.bitmap.data[i] = r; layer.bitmap.data[i + 1] = g; layer.bitmap.data[i + 2] = bl } })
  if (blur > 0) layer.blur(blur)
  /* pendek → tengah vertikal; panjang → mulai dari atas, turun ke bawah */
  const totalH = baris.length * lh
  const y = totalH < 300 ? Math.round((512 - totalH) / 2) : 28
  img.composite(layer, 30, y)
  return { img, cfg: { f, skala } }
}
export const brat = {
  command: ['brat', 'bratgen', 'bratstiker', 'bratputih', 'bratpink', 'brathijau'],
  category: 'Sticker Menu',
  description: '⬜ Stiker teks ala brat (latar PUTIH, teks hitam blur) + WM. Varian: .brathijau .bratpink',
  limit: 1, cooldown: 3, contoh: 'aku sayang kamu',
  run: async m => {
    const teks = String(m.q || '').trim()
    if (!teks) return m.reply(`🟩 Contoh: \`${P}brat aku sayang kamu\`\nVarian: \`${P}brathijau teks\` · \`${P}bratpink teks\` · animasi: \`${P}bratvid teks\``)
    await m.typing()
    try {
      const warna = m.command === 'brathijau' ? 0x8acf00ff : m.command === 'bratpink' ? 0xffb3d9ff : 0xffffffff
      const { img } = await frameBrat(teks.slice(0, 200), { warna })
      return await pngKeStiker(m, await img.getBuffer('image/png'))
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}
export const bratvid = {
  command: ['bratvid', 'bratvideo', 'bratanim', 'bratgif'],
  category: 'Sticker Menu',
  description: '🎞️ Brat animasi — kata muncul satu per satu (stiker bergerak) + WM',
  limit: 1, cooldown: 5, contoh: 'kamu lucu banget sih',
  run: async m => {
    const teks = String(m.q || '').trim()
    if (!teks) return m.reply(`🎞️ Contoh: \`${P}bratvid kamu lucu banget sih\``)
    await m.typing()
    const kata = teks.slice(0, 160).split(/\s+/).slice(0, 16)
    const dir = path.join(path.dirname(saveTmp(Buffer.alloc(1), 'tmp')), 'brat_' + Date.now())
    fs.mkdirSync(dir, { recursive: true })
    try {
      /* ukuran font ditentukan dari teks LENGKAP supaya tidak lompat-lompat antar frame */
      const penuh = await frameBrat(kata.join(' '))
      const cfg = penuh.cfg
      for (let i = 0; i < kata.length; i++) {
        const { img } = await frameBrat(kata.slice(0, i + 1).join(' '), { tetap: cfg })
        fs.writeFileSync(path.join(dir, `f${String(i).padStart(3, '0')}.png`), await img.getBuffer('image/png'))
      }
      const lb = await penuh.img.getBuffer('image/png')
      for (let j = 0; j < 2; j++) fs.writeFileSync(path.join(dir, `f${String(kata.length + j).padStart(3, '0')}.png`), lb)
      const out = path.join(dir, 'out.webp')
      /* 4 kata/detik → total ≈ jumlah kata/4 + 0.5 dtk (cepat) */
      await sh(`ffmpeg -y -framerate 4 -i "${dir}/f%03d.png" -vf "scale=512:512,fps=4" -loop 0 -an -vsync 0 -quality 50 "${out}"`)
      return await kirimStikerWm(m, fs.readFileSync(out))
    } catch (e) {
      if (/ffmpeg/i.test(e.message)) return m.reply('❌ ffmpeg belum terpasang: `pkg install ffmpeg -y`')
      return m.reply('❌ ' + truncate(e.message, 160))
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }) } catch {} }
  }
}

/* ================= SMEME ================= */
async function teksOutline (teks, maksW) {
  const f = await fontBrat(false)
  const baris = bungkus(f, String(teks).toUpperCase(), maksW - 24).slice(0, 3)
  const h = baris.length * 70 + 12
  const layer = new Jimp({ width: maksW, height: h, color: 0x00000000 })
  let y = 6
  for (const b of baris) { const w = lebarTeks(f, b); layer.print({ font: f, x: Math.max(0, Math.round((maksW - w) / 2)), y, text: b }); y += 70 }
  // outline: salinan hitam digeser 8 arah + isi putih
  const isi = layer.clone(); isi.scan((x, yy, i) => { if (isi.bitmap.data[i + 3] > 0) { isi.bitmap.data[i] = 255; isi.bitmap.data[i + 1] = 255; isi.bitmap.data[i + 2] = 255 } })
  const out = new Jimp({ width: maksW, height: h, color: 0x00000000 })
  for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, 2], [-2, 2], [2, -2]]) out.composite(layer, dx, dy)
  out.composite(isi, 0, 0)
  return out
}
export const smeme = {
  command: ['smeme', 'memes', 'stikermemewm'],
  category: 'Sticker Menu',
  description: '🖼️ Stiker meme FOTO/VIDEO: balas gambar/video/gif → .smeme teks atas|teks bawah — font TEBAL ala meme (Impact) putih outline hitam + WM',
  limit: 1, cooldown: 3, contoh: 'ketika|bot jalan',
  run: async m => {
    const src = await bufDari(m)
    const q = String(m.q || '').trim()
    if (!src || !q) return m.reply(`🖼️ Balas/kirim *gambar / video / gif* dengan caption:\n\`${P}smeme teks atas|teks bawah\`\nContoh: \`${P}smeme ketika|bot akhirnya jalan\`\n(satu teks saja = ditaruh di bawah · video ≤10 dtk)`)
    await m.typing()
    try {
      const [a, b] = q.includes('|') ? q.split('|').map(x => x.trim()) : ['', q]
      /* v7.30.0: font meme TEBAL (Anton/Impact-like) via lib/tekstebal.js; fallback font lama bila gagal */
      const buatTeks = async t => { try { return await layerTeksMeme(t, { w: 512, maxLines: 3 }) } catch { return teksOutline(t, 512) } }
      /* ── v7.32.0: VIDEO/GIF → teks di-overlay via ffmpeg (stiker bergerak) ── */
      if (/video|gif|webm|mp4/i.test(src.mime || '')) {
        const inV = saveTmp(src.buf, 'mp4')
        const lapis = []
        if (a) lapis.push(['atas', await buatTeks(a)])
        if (b) lapis.push(['bawah', await buatTeks(b)])
        const pngs = []
        for (const [nm, layer] of lapis) { const f = inV + '.' + nm + '.png'; fs.writeFileSync(f, await layer.getBuffer('image/png')); pngs.push(f) }
        const out = inV + '.meme.webp'
        const ins = pngs.map(f => `-i "${f}"`).join(' ')
        let fc = '[0:v]scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:-1:-1:color=white@0.0[bg]'
        let cur = 'bg'
        pngs.forEach((f, i) => { const nx = 'o' + i; fc += `;[${cur}][${i + 1}:v]overlay=(W-w)/2:${lapis[i][0] === 'atas' ? 8 : 'H-h-8'}[${nx}]`; cur = nx })
        fc += `;[${cur}]split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=single[p];[b][p]paletteuse`
        const bersih = () => { for (const f of [inV, out, ...pngs]) try { fs.existsSync(f) && fs.unlinkSync(f) } catch {} }
        try {
          await sh(`ffmpeg -y -i "${inV}" ${ins} -filter_complex "${fc}" -t 10 -loop 0 -an -vsync 0 -quality 60 -compression_level 6 "${out}"`)
          let webp = fs.readFileSync(out)
          if (webp.length > 950 * 1024) {
            await sh(`ffmpeg -y -i "${inV}" ${ins} -filter_complex "${fc.replace(/scale=512:512/, 'scale=384:384').replace(/fps=12/, 'fps=8')}" -t 6 -loop 0 -an -quality 40 "${out}"`)
            webp = fs.readFileSync(out)
          }
          const hasil = await kirimStikerWm(m, webp)
          bersih()
          return hasil
        } catch (e) { bersih(); if (/ffmpeg/i.test(e.message)) return m.reply('❌ ffmpeg belum terpasang: `pkg install ffmpeg -y`'); throw e }
      }
      const img = await Jimp.read(src.buf); img.cover({ w: 512, h: 512 })
      if (a) img.composite(await buatTeks(a), 0, 8)
      if (b) { const t = await buatTeks(b); img.composite(t, 0, 512 - t.bitmap.height - 8) }
      return await pngKeStiker(m, await img.getBuffer('image/png'))
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}

/* ================= TOHITAM (lokal, jimp) ================= */
export const tohitam = {
  command: ['tohitam', 'hitamkan', 'gelapkan', 'negro'],
  category: 'Sticker Menu',
  description: '🖤 Efek "tohitam": kulit/gambar jadi gelap (balas gambar; angka 1-5 = tingkat) → stiker + WM',
  limit: 1, cooldown: 3, contoh: '3',
  run: async m => {
    const src = await bufDari(m)
    if (!src) return m.reply(`🖤 Balas/kirim foto → \`${P}tohitam\` (tambah angka 1-5 untuk tingkat, contoh \`${P}tohitam 4\`)`)
    await m.typing()
    try {
      const lvl = Math.min(5, Math.max(1, parseInt(m.args?.[0]) || 3))
      const img = await Jimp.read(src.buf); img.cover({ w: 512, h: 512 })
      const k = 0.45 + lvl * 0.1 // kekuatan (0.55 - 0.95)
      img.scan((x, y, i) => {
        const d = img.bitmap.data; const r = d[i], g = d[i + 1], b = d[i + 2]
        const cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const kulit = cb > 77 && cb < 127 && cr > 133 && cr < 173 && lum > 60
        if (kulit) {
          // campur ke cokelat sangat gelap (48,30,22), sisakan sedikit tekstur asli
          const t = k
          const tr = 48 + (lum / 255) * 40, tg = 30 + (lum / 255) * 22, tb = 22 + (lum / 255) * 14
          d[i] = r * (1 - t) + tr * t; d[i + 1] = g * (1 - t) + tg * t; d[i + 2] = b * (1 - t) + tb * t
        } else {
          const f = 1 - k * 0.25
          d[i] = r * f; d[i + 1] = g * f; d[i + 2] = b * f
        }
      })
      img.contrast(0.08)
      return await pngKeStiker(m, await img.getBuffer('image/png'))
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}

/* ================= AI IMAGE → IMAGE (toanime dkk) ================= */
const GAYA = {
  toanime: 'convert this exact photo into high quality anime illustration style, keep the same face, pose, clothes and background, clean line art, vibrant anime shading',
  toputih: 'make the skin of the person in this exact photo much lighter and fairer, keep everything else identical',
  tozombie: 'turn the person in this exact photo into a scary realistic zombie, rotten skin, keep pose and background',
  toghibli: 'redraw this exact photo in Studio Ghibli hand-painted anime style, keep the same composition',
  tofigure: 'turn the subject of this photo into a realistic collectible PVC figure on a desk with its box behind it',
  tocartoon: 'redraw this exact photo as a 3D Pixar style cartoon character, keep the same face and pose',
  tolego: 'rebuild this exact photo as LEGO minifigures and bricks, same composition',
  tochibi: 'redraw the person in this photo as a cute chibi sticker with thick white outline',
  tosketsa: 'redraw this exact photo as a detailed pencil sketch on white paper',
  topixel: 'convert this exact photo into 16-bit pixel art, same composition'
}
async function uploadSementara (buf) {
  const hosts = [
    async () => { const fd = new FormData(); fd.append('file', new Blob([buf]), 'a.jpg'); const r = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd }); const j = await r.json(); return j?.data?.url?.replace('tmpfiles.org/', 'tmpfiles.org/dl/') },
    async () => { const fd = new FormData(); fd.append('files[]', new Blob([buf]), 'a.jpg'); const r = await fetch('https://uguu.se/upload', { method: 'POST', body: fd }); const j = await r.json(); return j?.files?.[0]?.url },
    async () => { const fd = new FormData(); fd.append('reqtype', 'fileupload'); fd.append('fileToUpload', new Blob([buf]), 'a.jpg'); const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd }); const t = await r.text(); return /^https?:/.test(t) ? t.trim() : null }
  ]
  for (const h of hosts) { try { const u = await h(); if (u) return u } catch {} }
  throw new Error('gagal mengunggah gambar sementara')
}
export async function gambarKeGambar (buf, prompt) {
  const url = await uploadSementara(buf)
  const seed = Math.floor(Math.random() * 1e9)
  const u = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=kontext&image=${encodeURIComponent(url)}&width=768&height=768&nologo=true&seed=${seed}&referrer=THERYHANN`
  const out = await getBuffer(u, { timeout: 150000 }, 1)
  if (!out || out.length < 2000) throw new Error('AI tidak mengembalikan gambar')
  return out
}
function buatAI (cmd, aliases, desc) {
  return {
    command: [cmd, ...aliases], category: 'Sticker Menu', description: desc, limit: 2, cooldown: 10,
    run: async m => {
      const src = await bufDari(m)
      if (!src) return m.reply(`🎨 Balas/kirim foto → \`${P}${cmd}\` (tambah kata *img* untuk hasil gambar, bukan stiker)`)
      await m.react?.('🎨')
      await m.reply('🎨 Mengubah foto dengan AI… ±20-40 detik')
      try {
        const out = await gambarKeGambar(src.buf, GAYA[cmd])
        if (/\bimg\b|gambar/i.test(m.q || '')) return await m.sendImage(out, `✨ ${cmd} · ${config.bot.name}`)
        return await pngKeStiker(m, out)
      } catch (e) { return m.reply('❌ AI gagal: ' + truncate(e.message, 160) + `\nCoba lagi atau pakai \`${P}${cmd} img\``) }
    }
  }
}
export const toanime = buatAI('toanime', ['jadianime', 'animefy', 'anime'], '🎨 Ubah foto jadi gaya anime (AI, wajah tetap) → stiker + WM; tambah "img" untuk gambar')
export const toputih = buatAI('toputih', ['putihkan', 'jadiputih'], '🤍 Cerahkan kulit di foto (AI) → stiker + WM')
export const tozombie = buatAI('tozombie', ['jadizombie', 'zombiefy'], '🧟 Ubah orang di foto jadi zombie (AI) → stiker + WM')
export const toghibli = buatAI('toghibli', ['ghibli', 'jadighibli'], '🍃 Gaya Studio Ghibli (AI) → stiker + WM')
export const tofigure = buatAI('tofigure', ['figure', 'jadifigure', 'actionfigure'], '🧸 Jadikan action figure PVC + boks (AI) → stiker + WM')
export const tocartoon = buatAI('tocartoon', ['kartun3d', 'jadikartun', 'topixar'], '🎬 Gaya kartun 3D Pixar (AI) → stiker + WM')
export const tolego = buatAI('tolego', ['lego', 'jadilego'], '🧱 Gaya LEGO (AI) → stiker + WM')
export const tochibi = buatAI('tochibi', ['chibi', 'jadichibi'], '🐣 Chibi stiker outline putih (AI) → stiker + WM')
export const tosketsa = buatAI('tosketsa', ['sketsa', 'sketch', 'jadisketsa'], '✏️ Sketsa pensil (AI) → stiker + WM')
export const topixel = buatAI('topixel', ['pixelart', 'jadipixel'], '👾 Pixel art 16-bit (AI) → stiker + WM')

export default { stikerWm, setwm, wm, brat, bratvid, smeme, tohitam, toanime, toputih, tozombie, toghibli, tofigure, tocartoon, tolego, tochibi, tosketsa, topixel }
