/**
 * 📸 .igqc — QUOTE CHAT ALA INSTAGRAM DM (v7.15.0)
 *  Meniru tampilan pesan IG: baris reaksi ❤️😂😮😢😡👍 +, kartu gelap berisi
 *  FOTO PROFIL pengirim (besar, sudut membulat), teks pesan di bawahnya,
 *  lalu menu konteks "Balas / Teruskan / Salin" dengan waktu (SAB 15.28).
 *  Digambar dengan jimp (tanpa canvas native). Hasil = stiker (+WM) atau gambar.
 *  .igqc <teks>            → pakai foto profil & nama kamu
 *  balas pesan + .igqc     → pakai teks & foto profil orang yang dibalas
 *  .igqc img <teks>        → kirim sebagai gambar (bukan stiker)
 */
import { Jimp, loadFont } from 'jimp'
import { SANS_32_WHITE, SANS_64_WHITE, SANS_32_BLACK } from 'jimp/fonts'
import { config } from '../config.js'
import { getBuffer, truncate } from '../lib/functions.js'
import { kirimStikerWm } from './stikerwm.js'
import { toWebp, saveTmp } from '../lib/functions.js'
import fs from 'node:fs'

const P = config.display.prefix
const F = {}
async function font (k) { if (!F[k]) F[k] = await loadFont({ w32: SANS_32_WHITE, w64: SANS_64_WHITE, b32: SANS_32_BLACK }[k]); return F[k] }
const lebar = (f, t) => [...t].reduce((a, c) => a + (f.chars[c]?.xadvance || f.chars['?']?.xadvance || 16), 0)
const bersihGlyph = (f, t) => [...String(t)].filter(c => f.chars[c] || c === ' ').join('').replace(/ {2,}/g, ' ') || ' '
function bungkus (f, teks, maks) { teks = bersihGlyph(f, teks); const o = []; let cur = ''; for (const k of String(teks).split(/\s+/)) { const c = cur ? cur + ' ' + k : k; if (lebar(f, c) > maks && cur) { o.push(cur); cur = k } else cur = c } if (cur) o.push(cur); return o }
function rounded (w, h, r, color) {
  const img = new Jimp({ width: w, height: h, color })
  img.scan((x, y, i) => {
    const cx = x < r ? r - x : x >= w - r ? x - (w - r - 1) : 0
    const cy = y < r ? r - y : y >= h - r ? y - (h - r - 1) : 0
    if (cx && cy && cx * cx + cy * cy > r * r) img.bitmap.data[i + 3] = 0
  })
  return img
}
function tintText (img, r, g, b) { img.scan((x, y, i) => { if (img.bitmap.data[i + 3] > 0) { img.bitmap.data[i] = r; img.bitmap.data[i + 1] = g; img.bitmap.data[i + 2] = b } }) }
const EMO = [[0xff3040ff, 'heart'], [0xffd54fff, 'laugh'], [0xffd54fff, 'wow'], [0x64b5f6ff, 'sad'], [0xff7043ff, 'angry'], [0x42a5f5ff, 'thumb']]
function gambarEmoji (jenis, warna, s) {
  const e = new Jimp({ width: s, height: s, color: 0x00000000 })
  const c = s / 2, r = s / 2 - 2
  const px = (x, y, col) => { if (x >= 0 && y >= 0 && x < s && y < s) e.setPixelColor(col, x | 0, y | 0) }
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = x - c, dy = y - c
    if (jenis === 'heart') { const X = dx / (r * 0.95), Y = -dy / (r * 0.95) + 0.25; const v = (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y; if (v <= 0) px(x, y, warna) } else if (jenis === 'thumb') { if (dx > -r * 0.25 && dx < r * 0.75 && dy > -r * 0.05 && dy < r * 0.8) px(x, y, warna); if (dx > -r * 0.75 && dx < -r * 0.35 && dy > r * 0.05 && dy < r * 0.8) px(x, y, warna); if ((dx + r * 0.05) ** 2 / (r * 0.28) ** 2 + (dy + r * 0.5) ** 2 / (r * 0.4) ** 2 <= 1) px(x, y, warna) } else if (dx * dx + dy * dy <= r * r) px(x, y, warna)
  }
  if (!['heart', 'thumb'].includes(jenis)) { // wajah
    const eye = (ex) => { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) px(c + ex + x, c - r * 0.25 + y, 0x3e2723ff) }
    eye(-r * 0.35); eye(r * 0.35)
    for (let x = -r * 0.45; x <= r * 0.45; x++) { const y = jenis === 'sad' || jenis === 'angry' ? r * 0.25 + (x * x) / (r * 1.6) : jenis === 'wow' ? r * 0.35 : r * 0.5 - (x * x) / (r * 1.6); for (let t = 0; t < 3; t++) px(c + x, c + y + t, 0x3e2723ff) }
    if (jenis === 'wow') for (let y = -r * 0.15; y <= r * 0.15; y++) for (let x = -r * 0.12; x <= r * 0.12; x++) px(c + x, c + r * 0.4 + y, 0x3e2723ff)
  }
  return e
}

function lingkaran (s, color) { const im = new Jimp({ width: s, height: s, color: 0x00000000 }); const c = (s - 1) / 2, r = s / 2; im.scan((x, y, i) => { if ((x - c) ** 2 + (y - c) ** 2 <= r * r) im.bitmap.data.writeUInt32BE(color, i) }); return im }
function ikon (jenis, s = 36, col = 0xffffffff) {
  const im = new Jimp({ width: s, height: s, color: 0x00000000 }); const c = s / 2
  im.scan((x, y, i) => {
    const dx = x - c, dy = y - c; let on = false
    if (jenis === 'back') on = Math.abs(dx + 4 - Math.abs(dy)) < 2.2 && Math.abs(dy) < s * 0.3 // <
    else if (jenis === 'phone') { const d = Math.hypot(dx, dy); on = (d > s * 0.26 && d < s * 0.36 && dx < 0 && dy > 0) || (Math.hypot(dx + s * 0.22, dy + s * 0.12) < s * 0.09) || (Math.hypot(dx - s * 0.12, dy - s * 0.22) < s * 0.09) } // gagang sederhana
    else if (jenis === 'video') on = (Math.abs(dx + 3) < s * 0.25 && Math.abs(dy) < s * 0.18) || (dx > s * 0.2 && dx < s * 0.36 && Math.abs(dy) < s * 0.28 - (dx - s * 0.2))
    else if (jenis === 'cam') { const d = Math.hypot(dx, dy); on = (Math.abs(dx) < s * 0.36 && Math.abs(dy) < s * 0.26 && !(Math.abs(dx) < s * 0.31 && Math.abs(dy) < s * 0.21)) || (d > s * 0.09 && d < s * 0.15) }
    else if (jenis === 'mic') on = (Math.abs(dx) < s * 0.11 && dy < s * 0.1 && dy > -s * 0.32) || (Math.abs(Math.hypot(dx, dy - s * 0.02) - s * 0.22) < 2 && dy > 0) || (Math.abs(dx) < 1.5 && dy > s * 0.2 && dy < s * 0.36)
    else if (jenis === 'img') on = (Math.abs(dx) < s * 0.34 && Math.abs(dy) < s * 0.3 && !(Math.abs(dx) < s * 0.29 && Math.abs(dy) < s * 0.25)) || (dy > s * 0.05 && dy < s * 0.25 && Math.abs(dx) < s * 0.29 && dy > Math.abs(dx + s * 0.1) - s * 0.1)
    else if (jenis === 'plus') on = (Math.abs(dx) < 1.6 && Math.abs(dy) < s * 0.25) || (Math.abs(dy) < 1.6 && Math.abs(dx) < s * 0.25)
    else if (jenis === 'sticker') { const d = Math.hypot(dx, dy); on = Math.abs(d - s * 0.34) < 2 || (Math.hypot(dx + s * 0.12, dy + s * 0.08) < 2.5) || (Math.hypot(dx - s * 0.12, dy + s * 0.08) < 2.5) || (Math.abs(Math.hypot(dx, dy - s * 0.02) - s * 0.18) < 1.8 && dy > s * 0.08) }
    if (on) im.bitmap.data.writeUInt32BE(col, i)
  })
  return im
}
function teksKecil (f, text, w, h, skala, rgb) { const t = new Jimp({ width: w, height: h, color: 0x00000000 }); t.print({ font: f, x: 0, y: 0, text }); t.resize({ w: Math.max(1, Math.round(w * skala)), h: Math.max(1, Math.round(h * skala)) }); if (rgb) tintText(t, ...rgb); return t }

/** Screenshot DM Instagram (Android, dark) : header · bubble lawan + avatar · jam · bar input */
export async function igqcImage ({ nama = 'kamu', teks = '', avatar = null, waktu = '', username = '' }) {
  const W = 720
  const f32 = await font('w32'); const fB = await font('w64')
  nama = bersihGlyph(f32, nama); username = bersihGlyph(f32, username || nama.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20) || 'pengguna')
  const maxTeks = 430
  const baris = bungkus(f32, teks || ' ', maxTeks - 40).slice(0, 12)
  const lineH = 40, pad = 22
  const bubW = Math.min(maxTeks, Math.max(...baris.map(b => lebar(f32, b))) + pad * 2 + 4), bubH = baris.length * lineH + pad * 2 - 6
  const top = 150, H = 1280
  const bg = new Jimp({ width: W, height: H, color: 0x000000ff })
  // status bar
  bg.composite(teksKecil(f32, waktu.split(' ')[1] || '15.28', 200, 36, 0.62, [255, 255, 255]), 34, 14)
  const sb = teksKecil(f32, 'LTE 4G  ||||  100%', 320, 36, 0.6, [255, 255, 255]); bg.composite(sb, W - 34 - sb.bitmap.width, 15)
  // avatar
  let av; try { av = avatar ? await Jimp.read(avatar) : null } catch { av = null }
  const buatAv = (s) => { let a; if (av) { a = av.clone(); a.cover({ w: s, h: s }) } else { a = new Jimp({ width: s, height: s, color: 0x3a3a48ff }); const t = (nama[0] || '?').toUpperCase(); const ini = new Jimp({ width: s, height: s, color: 0x00000000 }); const fh = s >= 80 ? fB : f32; ini.print({ font: fh, x: s / 2 - lebar(fh, t) / 2, y: s / 2 - (s >= 80 ? 34 : 18), text: t }); a.composite(ini, 0, 0) } a.mask(lingkaran(s, 0xffffffff), 0, 0); return a }
  // header
  bg.composite(ikon('back', 44), 22, 62)
  bg.composite(buatAv(72), 84, 48)
  const nm = new Jimp({ width: 420, height: 40, color: 0x00000000 }); nm.print({ font: f32, x: 0, y: 0, text: truncate(nama, 22) }); nm.resize({ w: 336, h: 32 }); bg.composite(nm, 172, 54)
  bg.composite(teksKecil(f32, username + ' - Aktif sekarang', 500, 36, 0.6, [160, 160, 170]), 172, 92)
  bg.composite(ikon('phone', 44), W - 140, 62); bg.composite(ikon('video', 46), W - 78, 61)
  // header profil kecil di tengah (ala IG saat chat masih pendek)
  bg.composite(buatAv(160), W / 2 - 80, top + 10)
  const nb = new Jimp({ width: 500, height: 40, color: 0x00000000 }); nb.print({ font: f32, x: 0, y: 0, text: truncate(nama, 24) }); const nbw = Math.min(500, lebar(f32, truncate(nama, 24)) + 4); bg.composite(nb, W / 2 - nbw / 2, top + 186)
  const un = teksKecil(f32, username + ' - Instagram', 500, 36, 0.62, [160, 160, 170]); bg.composite(un, W / 2 - Math.round(lebar(f32, username + ' - Instagram') * 0.62) / 2, top + 232)
  const lp = 'Lihat profil'; bg.composite(rounded(200, 56, 12, 0x262630ff), W / 2 - 100, top + 280); const lpt = teksKecil(f32, lp, 200, 40, 0.72, [255, 255, 255]); bg.composite(lpt, W / 2 - Math.round(lebar(f32, lp) * 0.72) / 2, top + 292)
  // jam pemisah
  const jam = teksKecil(f32, waktu || 'SAB 15.28', 300, 36, 0.58, [150, 150, 160]); bg.composite(jam, W / 2 - jam.bitmap.width / 2 + 40, top + 380)
  // bubble lawan (kiri) + avatar mini
  const bx = 96, by = top + 430
  bg.composite(buatAv(56), 26, by + bubH - 56)
  const bub = rounded(bubW, bubH, 34, 0x262626ff)
  // sudut kiri-bawah lebih lancip
  bg.composite(bub, bx, by)
  const tl = new Jimp({ width: bubW, height: bubH, color: 0x00000000 })
  baris.forEach((b, i) => tl.print({ font: f32, x: pad, y: pad - 6 + i * lineH, text: b }))
  bg.composite(tl, bx, by)
  bg.composite(teksKecil(f32, 'Dilihat', 200, 36, 0.56, [140, 140, 150]), bx, by + bubH + 8)
  // bar input bawah
  const iy = H - 130
  bg.composite(rounded(W - 40, 92, 46, 0x262626ff), 20, iy)
  bg.composite(lingkaran(66, 0x3797f0ff), 34, iy + 13); bg.composite(ikon('cam', 40), 47, iy + 26)
  bg.composite(teksKecil(f32, 'Kirim pesan...', 400, 40, 0.8, [150, 150, 160]), 120, iy + 32)
  ;[['mic', W - 250], ['img', W - 190], ['sticker', W - 130], ['plus', W - 70]].forEach(([k, x]) => bg.composite(ikon(k, 40), x, iy + 26))
  // gesture bar
  bg.composite(rounded(200, 6, 3, 0xffffffff), W / 2 - 100, H - 16)
  // WM tipis
  const wm = teksKecil(f32, config.display?.packname || 'THERYHANN!', 300, 36, 0.5, [70, 70, 80]); bg.composite(wm, W - 34 - wm.bitmap.width, H - 60)
  return bg
}

export const igqc = {
  command: ['igqc', 'qcig', 'igquote', 'quoteig', 'instaqc'],
  category: 'Sticker Menu',
  description: '📸 Screenshot chat ala Instagram DM (foto, bukan stiker): header nama+username, bubble pesan + foto profil, jam, bar Kirim pesan. Balas pesan orang = pakai foto & teksnya. Tambah `stiker` untuk versi stiker',
  limit: 1, cooldown: 4, contoh: 'p',
  run: async m => {
    let q = String(m.q || '').trim()
    const asStk = /^(stiker|sticker|stk)\b/i.test(q); if (asStk) q = q.replace(/^(stiker|sticker|stk)\s*/i, ''); q = q.replace(/^img\s*/i, '')
    const target = m.quoted?.sender || m.sender
    const teks = q || m.quoted?.text || ''
    if (!teks) return m.reply(`📸 Contoh: \`${P}igqc halo semua\`\nAtau balas pesan seseorang → \`${P}igqc\` (pakai foto profil & teksnya)\nVersi stiker: \`${P}igqc stiker teks\``)
    await m.typing()
    try {
      const nama = m.quoted?.sender ? (m.group?.participants?.find(p => p.id === target)?.notify || m.quoted.pushName || target.split('@')[0]) : (m.pushName || 'kamu')
      let avatar = null
      try { const url = await m.sock.profilePictureUrl(target, 'image'); avatar = await getBuffer(url, { timeout: 20000 }, 1) } catch {}
      const d = new Date(Date.now() + 7 * 3600e3)
      const hari = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'][d.getUTCDay()]
      const waktu = `${hari} ${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`
      const img = await igqcImage({ nama, teks: teks.slice(0, 300), avatar, waktu })
      const png = await img.getBuffer('image/png')
      if (!asStk) return await m.sendImage(png, `📸 IG DM · ${nama}`)
      const input = saveTmp(png, 'png'); const output = input.replace(/\.png$/, '.webp')
      try { await toWebp(input, output, { animated: false }); return await kirimStikerWm(m, fs.readFileSync(output)) } catch { return await m.sendImage(png, `📸 IG quote · ${nama} (ffmpeg tidak ada → gambar)`) } finally { for (const f of [input, output]) fs.existsSync(f) && fs.unlinkSync(f) }
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}
export default { igqc }
