/**
 * 💬 .qc / .iqc / .fakechat / .fakegroup — QUOTE & SCREENSHOT PALSU (v7.17.0)
 *  .qc <teks> [#warna]   → stiker kutipan ala WhatsApp (avatar + nama + bubble + centang)
 *  .iqc <teks>           → gaya iPhone (bubble abu iOS)
 *
 *  .fakechat  → screenshot ruang chat GRUP WhatsApp Android (tema gelap) persis SS referensi:
 *     bubble kiri abu (orang lain, dengan nama berwarna & foto kecil di bubble pertama),
 *     bubble kanan hijau-gelap (diri sendiri, centang ✓✓), KUTIPAN balasan (garis warna +
 *     nama + teks yang dibalas, "Anda" bila membalas diri sendiri), kutipan video (ikon 🎥 +
 *     durasi + thumbnail), reaksi ❤️ di bawah bubble, jam.
 *     Format: .fakechat <nama1>,<nama2>,<nama3>|<siapa>: <pesan>|...
 *       siapa = 1 / 2 / 3 (user ke-1/2/3) atau aku (diri sendiri) ➜ atau langsung nama
 *       balas: "2>aku: kasih warn aja"  = user2 membalas pesan terakhir 'aku'
 *              "3>1: jagok"             = user3 membalas pesan terakhir user1
 *       video: "1: video Seleksi bang 0.11" = pesan video 0:11 dengan caption
 *       reaksi: tambahkan " ❤" di akhir pesan → muncul reaksi
 *  .fakegroup → screenshot HALAMAN INFO GRUP (PP bulat besar, nama, "Grup · N anggota",
 *     deskripsi + "Baca selengkapnya", tombol Obrolan audio/Bagikan/Cari, "Tambah anggota",
 *     daftar anggota dengan foto/inisial, label "Admin grup").
 *     Format: .fakegroup Nama Grup|Deskripsi|Anda*, Nama Admin*, Nama Member, ...
 *       tanda * = admin. Balas/kirim gambar bersama perintah = jadi PP grup.
 *       Foto anggota: nama yang sama dengan member grup asli → pakai PP aslinya (jika terbuka);
 *       selain itu inisial berwarna seperti WhatsApp.
 */
import fs from 'node:fs'
import { Jimp, loadFont } from 'jimp'
import { SANS_32_WHITE, SANS_32_BLACK, SANS_64_WHITE, SANS_16_WHITE } from 'jimp/fonts'
import { config } from '../config.js'
import { getBuffer, truncate, toWebp, saveTmp } from '../lib/functions.js'
import { kirimStikerWm } from './stikerwm.js'

const P = config.display.prefix
const F = {}
const FONTS = { w32: SANS_32_WHITE, b32: SANS_32_BLACK, w64: SANS_64_WHITE, w16: SANS_16_WHITE }
async function font (k) { if (!F[k]) F[k] = await loadFont(FONTS[k]); return F[k] }
const lebar = (f, t) => [...String(t)].reduce((a, c) => a + (f.chars[c]?.xadvance || f.chars['?']?.xadvance || 16), 0)
const bersihGlyph = (f, t) => [...String(t)].filter(c => f.chars[c] || c === ' ' || c === '\n').join('').replace(/ {2,}/g, ' ')
function bungkus (f, teks, maks) { teks = bersihGlyph(f, teks); const o = []; for (const par of String(teks).split(/\n/)) { let cur = ''; for (const k of par.split(/\s+/)) { const c = cur ? cur + ' ' + k : k; if (lebar(f, c) > maks && cur) { o.push(cur); cur = k } else cur = c } o.push(cur) } return o.filter((x, i, a) => x || i < a.length - 1) }
function rounded (w, h, r, color) {
  w = Math.max(2, w | 0); h = Math.max(2, h | 0); r = Math.min(r, w / 2, h / 2)
  const img = new Jimp({ width: w, height: h, color })
  img.scan((x, y, i) => { const cx = x < r ? r - x : x >= w - r ? x - (w - r - 1) : 0; const cy = y < r ? r - y : y >= h - r ? y - (h - r - 1) : 0; if (cx && cy && cx * cx + cy * cy > r * r) img.bitmap.data[i + 3] = 0 })
  return img
}
function tint (img, r, g, b) { img.scan((x, y, i) => { if (img.bitmap.data[i + 3] > 0) { img.bitmap.data[i] = r; img.bitmap.data[i + 1] = g; img.bitmap.data[i + 2] = b } }) }
/** teks satu baris dengan skala (font 32 → skala) */
async function T (teks, rgb, skala = 1, fk = 'w32') {
  const f = await font(fk); const t = bersihGlyph(f, teks) || ' '
  const w = Math.ceil(lebar(f, t)) + 6, h = fk === 'w64' ? 76 : 40
  const l = new Jimp({ width: w, height: h, color: 0x00000000 }); l.print({ font: f, x: 0, y: 0, text: t })
  if (rgb) tint(l, ...rgb)
  if (skala !== 1) l.resize({ w: Math.max(2, Math.round(w * skala)), h: Math.max(2, Math.round(h * skala)) })
  return l
}
/** paragraf multi-baris */
async function Par (teks, rgb, maksW, skala = 1, lh = 38) {
  const f = await font('w32'); const baris = bungkus(f, teks, maksW / skala)
  const l = new Jimp({ width: Math.ceil(maksW / skala) + 8, height: Math.max(2, baris.length * lh + 6), color: 0x00000000 })
  baris.forEach((b, i) => l.print({ font: f, x: 0, y: i * lh, text: b })); tint(l, ...rgb)
  if (skala !== 1) l.resize({ w: Math.max(2, Math.round(l.bitmap.width * skala)), h: Math.max(2, Math.round(l.bitmap.height * skala)) })
  return { img: l, n: baris.length, w: Math.max(...baris.map(b => lebar(f, b)), 10) * skala }
}
const WARNA_NAMA = [0x35cd96, 0x6bcbef, 0xe542a3, 0x91ab01, 0xfe7c7f, 0x5ecc75, 0xff9a1f, 0xb56bff, 0xd4a373, 0x00a884].map(c => [(c >> 16) & 255, (c >> 8) & 255, c & 255])
const WARNA_AV = [0x6a5acd, 0x2e86de, 0x10ac84, 0xee5253, 0xf39c12, 0x8e44ad, 0x16a085, 0xc0392b, 0x2980b9, 0x27ae60]
const hashN = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
const warnaNama = n => WARNA_NAMA[hashN(n) % WARNA_NAMA.length]
async function avatarBulat (buf, nama, d) {
  let av = null
  try { if (buf) { av = await Jimp.read(buf); if (av.bitmap.width > 700) av.scaleToFit({ w: 700, h: 700 }) } } catch { av = null }
  if (!av) {
    const c = WARNA_AV[hashN(nama) % WARNA_AV.length]
    av = new Jimp({ width: d, height: d, color: ((c << 8) | 0xff) >>> 0 })
    const ini = (String(nama).trim().replace(/^[^a-z0-9]+/i, '')[0] || String(nama)[0] || '?').toUpperCase()
    const t = await T(ini, [255, 255, 255], d / 100, 'w64'); av.composite(t, Math.round((d - t.bitmap.width) / 2), Math.round((d - t.bitmap.height) / 2))
  }
  av.cover({ w: d, h: d })
  const mask = new Jimp({ width: d, height: d, color: 0x000000ff }); mask.scan((x, y, i) => { const dx = x - d / 2 + .5, dy = y - d / 2 + .5; const v = dx * dx + dy * dy <= (d / 2) * (d / 2) ? 255 : 0; mask.bitmap.data[i] = mask.bitmap.data[i + 1] = mask.bitmap.data[i + 2] = v })
  av.mask(mask, 0, 0)
  return av
}
const jamSkr = (ofs = 0) => { const d = new Date(Date.now() + 7 * 3600e3 + ofs * 60e3); return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}` }
function centang (col = 0x53bdebff, dobel = true) { const c = new Jimp({ width: 30, height: 16, color: 0x00000000 }); for (let x = 0; x < 30; x++) for (let y = 0; y < 16; y++) { const a = Math.abs((x - 3) - (y - 6)) < 1.6 && x >= 3 && x <= 9 && y >= 6 && y <= 13; const b = Math.abs((x - 9) + (y - 13)) < 1.6 && x >= 9 && x <= 20 && y >= 2 && y <= 13; const a2 = dobel && Math.abs((x - 16) + (y - 13)) < 1.6 && x >= 16 && x <= 27 && y >= 2 && y <= 13; if (a || b || a2) c.setPixelColor(col, x, y) } return c }
function hati (s) { const e = new Jimp({ width: s, height: s, color: 0x00000000 }); const c = s / 2, r = s / 2 - 1; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const X = (x - c) / (r * .95), Y = -(y - c) / (r * .95) + .25; if ((X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y <= 0) e.setPixelColor(0xff3040ff, x, y) } return e }
function ikonVideo () { const v = new Jimp({ width: 30, height: 22, color: 0x00000000 }); v.composite(rounded(18, 16, 3, 0xaebac1ff), 0, 3); for (let y = 0; y < 22; y++) for (let x = 18; x < 30; x++) if (Math.abs(y - 11) <= (x - 16) * .55 && x < 29) v.setPixelColor(0xaebac1ff, x, y); return v }

/* ================= QC & IQC ================= */
export async function qcImage ({ nama, teks, avatar, warna = 0x202c33ff, ios = false, waktu }) {
  const W = 720, f = await font('w32')
  const baris = bungkus(f, teks, 470).slice(0, 12)
  const bw = Math.min(560, Math.max(220, Math.max(lebar(f, nama) * .7, ...baris.map(b => lebar(f, b))) + 60)), bh = 62 + baris.length * 38 + 34
  const H = Math.max(150, bh + 40)
  const bg = new Jimp({ width: W, height: H, color: 0x00000000 })
  bg.composite(await avatarBulat(avatar, nama, 96), 20, 20)
  bg.composite(rounded(bw, bh, ios ? 34 : 22, ios ? 0xe9e9ebff : warna), 130, 20)
  if (!ios) for (let y = 20; y < 44; y++) for (let x = 112; x < 132; x++) if (x - 112 > (y - 20) * .8) bg.setPixelColor(warna, x, y)
  bg.composite(await T(truncate(nama, 28), ios ? [110, 110, 115] : warnaNama(nama), .72), 154, 34)
  const p = await Par(teks, ios ? [0, 0, 0] : [233, 237, 239], bw - 40); bg.composite(p.img, 154, 70)
  const jam = await T(waktu || jamSkr(), ios ? [140, 140, 145] : [134, 150, 160], .5); bg.composite(jam, 130 + bw - jam.bitmap.width - (ios ? 20 : 52), 20 + bh - 30)
  if (!ios) bg.composite(centang(), 130 + bw - 44, 20 + bh - 30)
  return bg
}
async function kirimStikerDariPng (m, png, judul) {
  const input = saveTmp(png, 'png'); const output = input.replace(/\.png$/, '.webp')
  try { await toWebp(input, output, { animated: false }); return await kirimStikerWm(m, fs.readFileSync(output)) } catch { return await m.sendImage(png, judul) } finally { for (const f of [input, output]) fs.existsSync(f) && fs.unlinkSync(f) }
}
async function ppDari (m, jid) { try { const url = await m.sock.profilePictureUrl(jid, 'image'); return await getBuffer(url, { timeout: 12000 }, 0) } catch { return null } }
async function infoTarget (m) {
  const target = m.quoted?.sender || m.sender
  const nama = m.quoted?.sender ? (m.group?.participants?.find(p => p.id === target || p.lid === target)?.notify || m.quoted.pushName || '+' + target.split('@')[0]) : (m.pushName || 'kamu')
  return { target, nama, avatar: await ppDari(m, target) }
}
const HEX = { hitam: 0x202c33ff, hijau: 0x005c4bff, putih: 0xffffffff, biru: 0x1e3a8aff, ungu: 0x4c1d95ff, merah: 0x7f1d1dff, pink: 0x9d174dff }
function qcPlugin (cmd, aliases, ios) {
  return {
    command: [cmd, ...aliases], category: 'Sticker Menu', limit: 1, cooldown: 3, contoh: 'halo semua',
    description: ios ? '📱 Quote chat gaya iPhone (bubble abu iOS + jam) → stiker +WM; balas pesan = pakai nama/foto orang itu' : '💬 Quote chat ala WhatsApp (avatar + nama + bubble, centang biru) → stiker +WM; .qc teks #hijau/#putih/#ungu; balas pesan = pakai orang itu',
    run: async m => {
      let q = String(m.q || '').trim(); let warna = ios ? 0xe9e9ebff : 0x202c33ff
      const mw = q.match(/#(\w+)\s*$/); if (mw && HEX[mw[1].toLowerCase()]) { warna = HEX[mw[1].toLowerCase()]; q = q.replace(/#\w+\s*$/, '').trim() } else if (mw && /^[0-9a-f]{6}$/i.test(mw[1])) { warna = (parseInt(mw[1], 16) * 256 + 255) >>> 0; q = q.replace(/#\w+\s*$/, '').trim() }
      const teks = q || m.quoted?.text || ''
      if (!teks) return m.reply(`Contoh: \`${P}${cmd} halo semua\`\nBalas pesan seseorang → \`${P}${cmd}\`\nWarna: \`${P}${cmd} teks #hijau\` (${Object.keys(HEX).join('/')} atau #hex)`)
      await m.typing()
      try {
        const { nama, avatar } = await infoTarget(m)
        const img = await qcImage({ nama, teks: teks.slice(0, 400), avatar, warna, ios })
        return await kirimStikerDariPng(m, await img.getBuffer('image/png'), `💬 ${nama}`)
      } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
    }
  }
}
export const qc = qcPlugin('qc', ['quotechat', 'quotly', 'qchat', 'kutipchat'], false)
export const iqc = qcPlugin('iqc', ['iphoneqc', 'qciphone', 'iosqc'], true)

/* ================= FAKECHAT — ruang chat grup Android gelap ================= */
const BG = 0x0b141aff, BUB_L = 0x202c33ff, BUB_R = 0x005c4bff, TXT = [233, 237, 239], MUTED = [134, 150, 160], QUOTE_L = 0x1a252cff, QUOTE_R = 0x025144ff
const AKU = /^(aku|saya|me|gue|gw|i|anda|saya sendiri)$/i
/**
 * pesan: [{ dari, teks, balas:{dari,teks,video?}, video:{durasi}, reaksi, jam }]
 * nama: [n1,n2,n3]; pp: {nama:buffer}
 */
export async function fakeChatImage ({ pesan, pp = {}, jam }) {
  const W = 720
  const isAku = d => AKU.test(d)
  const fontW = await font('w32')
  // pra-hitung tiap bubble
  const items = []
  let prev = null
  for (const p of pesan.slice(0, 16)) {
    const aku = isAku(p.dari)
    const maksTeks = 430
    const par = p.teks ? await Par(p.teks, TXT, maksTeks) : null
    let w = 100, h = 22
    const tampilNama = !aku && p.dari !== prev
    if (tampilNama) { w = Math.max(w, lebar(fontW, p.dari) * .75 + 60); h += 30 }
    let q = null
    if (p.balas) {
      const qn = isAku(p.balas.dari) ? 'Anda' : p.balas.dari
      const qt = p.balas.video ? `Seleksi bang (${p.balas.video})`.replace('Seleksi bang', p.balas.teks || 'Video') : (p.balas.teks || '')
      const qpar = await Par(qt, [160, 172, 180], p.balas.video ? 300 : maksTeks - 30, .95, 36)
      q = { nama: qn, par: qpar, video: !!p.balas.video, thumb: p.balas.thumb }
      w = Math.max(w, Math.max(lebar(fontW, qn) * .75, qpar.w) + 70 + (q.video ? 110 : 0)); h += 30 + qpar.img.bitmap.height + 26
    }
    if (p.video) { w = Math.max(w, 470); h += 250 }
    if (par) { w = Math.max(w, par.w + 60); h += par.img.bitmap.height + 4 }
    // ruang jam di baris terakhir
    const lastLineW = par ? lebar(fontW, bungkus(fontW, p.teks, maksTeks).slice(-1)[0] || '') : 0
    const jamW = aku ? 96 : 66
    if (par && lastLineW + jamW + 40 > w) { if (lastLineW + jamW + 40 <= maksTeks + 60) w = lastLineW + jamW + 40; else h += 24 }
    if (!par) h += 24
    h += 16
    w = Math.min(W - 130, Math.max(140, Math.round(w)))
    items.push({ ...p, aku, par, q, w: Math.round(w), h: Math.round(h), tampilNama, reaksi: p.reaksi })
    prev = p.dari
  }
  const H = 30 + items.reduce((a, it) => a + it.h + (it.reaksi ? 30 : 8) + (it.tampilNama ? 6 : 0), 0) + 120
  const bg = new Jimp({ width: W, height: H, color: BG })
  // doodle halus
  bg.scan((x, y, i) => { if (((x * 7 + y * 13) % 89) === 0) { bg.bitmap.data[i] += 9; bg.bitmap.data[i + 1] += 9; bg.bitmap.data[i + 2] += 9 } })
  let y = 24
  for (const it of items) {
    const x = it.aku ? W - it.w - 24 : (it.tampilNama ? 92 : 92)
    const col = it.aku ? BUB_R : BUB_L
    if (it.tampilNama || (it.aku && (items.indexOf(it) === 0 || !items[items.indexOf(it) - 1].aku))) { // ekor
      for (let yy = 0; yy < 14; yy++) for (let xx = 0; xx < 14; xx++) if (xx <= 14 - yy) bg.setPixelColor(col, it.aku ? x + it.w - 1 + xx : x - xx, y + yy)
    }
    bg.composite(rounded(it.w, it.h, 16, col), x, y)
    if (it.tampilNama) { bg.composite(await avatarBulat(pp[it.dari], it.dari, 56), 20, y); }
    let ty = y + 12
    if (it.tampilNama) { bg.composite(await T(truncate(it.dari, 30), warnaNama(it.dari), .78), x + 20, ty); ty += 32 }
    if (it.q) {
      const qh = 30 + it.q.par.img.bitmap.height + 12
      const qw = it.w - 32
      bg.composite(rounded(qw, qh, 10, it.aku ? QUOTE_R : QUOTE_L), x + 16, ty)
      const wc = isAku(it.q.nama === 'Anda' ? 'aku' : it.q.nama) ? [180, 190, 200] : warnaNama(it.q.nama)
      bg.composite(rounded(6, qh, 3, ((wc[0] << 24) | (wc[1] << 16) | (wc[2] << 8) | 255) >>> 0), x + 16, ty)
      bg.composite(await T(truncate(it.q.nama, 26), it.q.nama === 'Anda' ? [233, 237, 239] : warnaNama(it.q.nama), .72), x + 34, ty + 8)
      if (it.q.video) { bg.composite(ikonVideo(), x + 34, ty + 38); bg.composite(it.q.par.img, x + 72, ty + 34); bg.composite(rounded(96, qh, 10, 0xffffffff), x + 16 + qw - 96, ty); if (it.q.thumb) { try { const th = await Jimp.read(it.q.thumb); th.cover({ w: 96, h: qh }); bg.composite(th, x + 16 + qw - 96, ty) } catch {} } } else bg.composite(it.q.par.img, x + 34, ty + 34)
      ty += qh + 10
    }
    if (it.video) {
      bg.composite(rounded(it.w - 32, 240, 12, 0xd9dee2ff), x + 16, ty)
      bg.composite(rounded(70, 70, 35, 0x1f2c33ddff >>> 0), x + it.w / 2 - 35, ty + 85)
      for (let yy = 0; yy < 30; yy++) for (let xx = 0; xx < 26; xx++) if (Math.abs(yy - 15) <= (26 - xx) * .58) bg.setPixelColor(0xffffffff, x + it.w / 2 - 8 + xx, ty + 105 + yy)
      bg.composite(rounded(92, 30, 15, 0x00000099), x + 26, ty + 200); bg.composite(ikonVideo(), x + 34, ty + 204); bg.composite(await T(it.video, [255, 255, 255], .55), x + 68, ty + 207)
      ty += 250
    }
    if (it.par) { bg.composite(it.par.img, x + 20, ty); }
    const jm = await T(it.jam || jam || jamSkr(), MUTED, .55); bg.composite(jm, x + it.w - jm.bitmap.width - (it.aku ? 46 : 18), y + it.h - 30)
    if (it.aku) bg.composite(centang(), x + it.w - 42, y + it.h - 30)
    y += it.h
    if (it.reaksi) { bg.composite(rounded(56, 34, 17, BUB_L), it.aku ? x + it.w - 70 : x + 4, y - 8); bg.composite(hati(24), it.aku ? x + it.w - 54 : x + 20, y - 3); y += 30 }
    y += 8 + (it.tampilNama ? 6 : 0)
  }
  // input bar
  const iy = H - 92
  bg.composite(rounded(W - 120, 64, 32, 0x2a3942ff), 16, iy)
  bg.composite(rounded(30, 30, 15, 0x00000000), 36, iy + 17); const em = new Jimp({ width: 30, height: 30, color: 0x00000000 }); em.scan((xx, yy, i) => { const dx = xx - 15, dy = yy - 15, d = Math.hypot(dx, dy); if (d < 14 && d > 11) { em.bitmap.data[i] = 134; em.bitmap.data[i + 1] = 150; em.bitmap.data[i + 2] = 160; em.bitmap.data[i + 3] = 255 } }); bg.composite(em, 36, iy + 17)
  bg.composite(await T('Ketik pesan', MUTED, .8), 84, iy + 16)
  bg.composite(rounded(4, 34, 2, 0xffffffff), 80, iy + 15)
  bg.composite(rounded(26, 30, 6, 0x8696a0ff), W - 190, iy + 17); bg.composite(rounded(30, 24, 6, 0x8696a0ff), W - 150, iy + 20)
  bg.composite(rounded(64, 64, 32, 0x00a884ff), W - 84, iy); bg.composite(rounded(16, 30, 8, 0xffffffff), W - 60, iy + 14); bg.composite(rounded(4, 12, 2, 0xffffffff), W - 54, iy + 44)
  return bg
}
/** parser: nama1,nama2,nama3|1: halo|aku: hai|2>aku: kasih warn|1: video Seleksi bang 0.11|3>1: jagok ❤ */
function parseFake (q) {
  const bag = String(q).split('|').map(s => s.trim()).filter(Boolean)
  if (bag.length < 2) return null
  const nama = bag.shift().split(',').map(s => s.trim()).filter(Boolean)
  const who = k => { k = k.trim(); if (/^\d+$/.test(k)) return nama[+k - 1] || ('User ' + k); return k }
  const pesan = []
  const terakhir = {}
  for (const s of bag) {
    const i = s.indexOf(':'); if (i < 0) continue
    let kiri = s.slice(0, i).trim(), teks = s.slice(i + 1).trim()
    let balas = null
    if (kiri.includes('>')) { const [a, b] = kiri.split('>'); kiri = a; const target = who(b); const t = terakhir[AKU.test(target) ? 'aku' : target]; balas = t ? { dari: AKU.test(target) ? 'aku' : target, teks: t.teks, video: t.video } : { dari: target, teks: '…' } }
    const dari = AKU.test(kiri) ? 'aku' : who(kiri)
    let reaksi = false; if (/\s(❤|<3|love|hati)$/i.test(teks)) { reaksi = true; teks = teks.replace(/\s(❤|<3|love|hati)$/i, '') }
    let video = null; const mv = teks.match(/^video\s+(.*?)\s*(\d{1,2}[.:]\d{2})?$/i); if (mv) { video = mv[2] || '0.11'; teks = mv[1] || '' }
    const p = { dari, teks, balas, video, reaksi }
    pesan.push(p); terakhir[dari] = p
  }
  return { nama, pesan }
}
export const fakechat = {
  command: ['fakechat', 'fakegc', 'sschat', 'sschatpalsu', 'fakewa', 'fakegrupchat'],
  category: 'Sticker Menu', limit: 1, cooldown: 5,
  contoh: 'kelepert,anjasyaa,dodo|1: Seleksi bang ❤|1: video Seleksi bang 0.11|1: Ngapain lu selek pas klos?|aku>1: beel aja|2>aku: Kasih warn aja|3>1: Jagok',
  description: '📱 Screenshot ruang chat GRUP WhatsApp (Android gelap) palsu: bubble kiri/kanan, kutipan balasan, kutipan video, reaksi ❤. Format: nama1,nama2,nama3|1: pesan|aku: pesan|2>aku: balas|…',
  run: async m => {
    const d = parseFake(m.q || '')
    if (!d || !d.pesan.length) {
      return m.reply(`📱 *FAKECHAT — ruang chat grup palsu*\n\nFormat:\n\`${P}fakechat nama1,nama2,nama3|siapa: pesan|siapa: pesan|…\`\n\n*siapa* = \`1\` \`2\` \`3\` (user ke-1/2/3) atau \`aku\` (diri sendiri, bubble hijau kanan)\n• *Balas pesan*: \`2>aku: teks\` = user 2 membalas pesan terakhir *aku* (muncul kutipan "Anda")\n  \`3>1: teks\` = user 3 membalas pesan terakhir user 1\n• *Video*: \`1: video Seleksi bang 0.11\` = pesan video durasi 0:11 dengan caption\n• *Reaksi*: tambah \`❤\` di akhir pesan\n• Foto profil: nama yang sama dengan member grup ini otomatis pakai PP aslinya\n\nContoh (seperti SS):\n\`${P}fakechat kelepert,anjasyaa,dodo|1: video Seleksi bang 0.11|1: Ini klos ngntd|1: Ngapain lu selek pas klos?|1: Okelah jeje lu bagus, tapi lu liat lah ajg|aku>1: beel aja|2>aku: Kasih warn aja|3>1: Jagok\`\n\n🔵 user 1 · 🟢 user 2 · 🔴 user 3 · ⚪ aku`)
    }
    await m.typing()
    try {
      // pp: cocokkan nama dengan member grup
      const pp = {}
      const parts = m.group?.participants || []
      for (const n of d.nama.slice(0, 6)) {
        const p = parts.find(x => String(x.notify || x.name || '').toLowerCase() === n.toLowerCase())
        if (p) pp[n] = await ppDari(m, p.id)
      }
      const img = await fakeChatImage({ pesan: d.pesan, pp })
      const png = await img.getBuffer('image/png')
      return await m.sendImage(png, `📱 fakechat · ${d.nama.join(', ')} · ${config.bot.name}`)
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}

/* ================= FAKEGROUP — halaman info grup ================= */
export async function fakeGroupImage ({ nama, deskripsi, anggota, ppGrup, pp = {}, total }) {
  const W = 720
  const list = anggota.slice(0, 12)
  const H = 1010 + list.length * 130 + 40
  const bg = new Jimp({ width: W, height: H, color: 0x0b141aff })
  // status bar + back/qr/menu
  bg.composite(await T(jamSkr(), [255, 255, 255], .55), 20, 10)
  for (let k = 0; k < 4; k++) bg.composite(rounded(5, 6 + k * 4, 1, 0xffffffff), W - 150 + k * 8, 30 - k * 4)
  bg.composite(rounded(40, 20, 4, 0xffffffff), W - 68, 12); bg.composite(rounded(30, 14, 2, 0x0b141aff), W - 63, 15); bg.composite(await T('33', [255, 255, 255], .35), W - 60, 15)
  for (let y = -14; y <= 14; y++) for (let x = 0; x < 4; x++) bg.setPixelColor(0xffffffff, 30 + Math.abs(y) + x, 80 + y); bg.composite(rounded(30, 4, 2, 0xffffffff), 30, 78)
  for (const [dx, dy] of [[0, 0], [16, 0], [0, 16]]) bg.composite(rounded(12, 12, 2, 0xffffffff), W - 120 + dx, 70 + dy); bg.composite(rounded(12, 12, 2, 0x0b141aff), W - 116 + 16, 86); for (let k = 0; k < 3; k++) bg.composite(rounded(6, 6, 3, 0xffffffff), W - 40, 66 + k * 12)
  // PP grup besar
  bg.composite(await avatarBulat(ppGrup, nama, 230), W / 2 - 115, 60)
  // nama & info
  const nm = await T(truncate(nama, 26), [233, 237, 239], 1.15); bg.composite(nm, Math.round(W / 2 - nm.bitmap.width / 2), 318)
  const info = await T(`Grup · ${total} anggota`, MUTED, .7); bg.composite(info, Math.round(W / 2 - info.bitmap.width / 2), 372)
  // deskripsi + Baca selengkapnya
  const f32 = await font('w32'); const dsk = bersihGlyph(f32, deskripsi || 'Selamat datang di grup ' + nama)
  const cut = truncate(dsk, 20).replace(/…$/, '…')
  const d1 = await T(cut, [233, 237, 239], .8); const d2 = await T('Baca selengkapnya', [0, 168, 132], .8)
  const tw = d1.bitmap.width + 12 + d2.bitmap.width; bg.composite(d1, Math.round(W / 2 - tw / 2), 412); bg.composite(d2, Math.round(W / 2 - tw / 2) + d1.bitmap.width + 12, 412)
  // tombol aksi
  const aksi = [['Obrolan aud…', 'chat'], ['Bagikan', 'share'], ['Cari', 'search']]
  aksi.forEach(async ([lbl, ic], i) => {
    const cx = 130 + i * 230
    bg.composite(rounded(120, 84, 42, 0x202c33ff), cx - 60, 470)
    const ik = new Jimp({ width: 40, height: 40, color: 0x00000000 })
    ik.scan((x, y, k) => { const dx = x - 20, dy = y - 20, d = Math.hypot(dx, dy); let on = false; if (ic === 'chat') on = (d < 17 && d > 14) || (Math.abs(dx) < 2 && Math.abs(dy) < 8) || (Math.abs(dx - 6) < 2 && Math.abs(dy) < 5) || (Math.abs(dx + 6) < 2 && Math.abs(dy) < 5); else if (ic === 'search') on = (d < 14 && d > 11) || (dx > 8 && dy > 8 && Math.abs(dx - dy) < 3 && dx < 19); else on = Math.hypot(dx + 10, dy) < 5 || Math.hypot(dx - 8, dy - 10) < 5 || Math.hypot(dx - 8, dy + 10) < 5 || (Math.abs(dy - (-(dx + 10)) * .55) < 2 && dx > -10 && dx < 8) || (Math.abs(dy - (dx + 10) * .55) < 2 && dx > -10 && dx < 8); if (on) ik.setPixelColor(0xffffffff, x, y) })
    bg.composite(ik, cx - 20, 492)
    const t = await T(lbl, [233, 237, 239], .7); bg.composite(t, Math.round(cx - t.bitmap.width / 2), 566)
  })
  await new Promise(r => setTimeout(r, 30))
  bg.composite(rounded(W, 12, 0, 0x101b21ff), 0, 620)
  // "N anggota" + cari
  bg.composite(await T(`${total} anggota`, MUTED, .75), 30, 656)
  const sr = new Jimp({ width: 34, height: 34, color: 0x00000000 }); sr.scan((x, y, k) => { const dx = x - 14, dy = y - 14, d = Math.hypot(dx, dy); if ((d < 12 && d > 9) || (dx > 7 && dy > 7 && Math.abs(dx - dy) < 3 && dx < 18)) sr.setPixelColor(0x8696a0ff, x, y) }); bg.composite(sr, W - 60, 652)
  // Tambah anggota
  bg.composite(rounded(84, 84, 42, 0x00a884ff), 30, 720)
  const pa = new Jimp({ width: 84, height: 84, color: 0x00000000 }); pa.scan((x, y, k) => { const on = Math.hypot(x - 36, y - 32) < 10 || (y > 44 && y < 60 && x > 18 && x < 54 && Math.hypot(x - 36, y - 62) < 20) || (Math.abs(x - 58) < 2.5 && y > 26 && y < 44) || (Math.abs(y - 35) < 2.5 && x > 49 && x < 67); if (on) pa.setPixelColor(0xffffffff, x, y) }); bg.composite(pa, 30, 720)
  bg.composite(await T('Tambah anggota', [233, 237, 239], .95), 140, 738)
  // daftar anggota
  let y = 830
  for (const a of list) {
    bg.composite(await avatarBulat(pp[a.nama], a.nama, 84), 30, y)
    bg.composite(await T(truncate(a.nama, 24), [233, 237, 239], .95), 140, y + (a.sub ? 6 : 22))
    if (a.sub) bg.composite(await T(truncate(a.sub, 34), a.subHijau ? [0, 168, 132] : MUTED, .68), 140, y + 50)
    if (a.admin) { const lbl = await T('Admin grup', [0, 168, 132], .62); bg.composite(rounded(lbl.bitmap.width + 28, 44, 8, 0x1d3a35ff), W - lbl.bitmap.width - 62, y + 20); bg.composite(lbl, W - lbl.bitmap.width - 48, y + 30) }
    y += 130
  }
  return bg
}
function parseGroup (q) {
  const bag = String(q).split('|').map(s => s.trim())
  const nama = bag[0] || 'Grup Baru'
  const deskripsi = bag[1] || ''
  const raw = (bag[2] || '').split(',').map(s => s.trim()).filter(Boolean)
  return { nama, deskripsi, raw }
}
export const fakegroup = {
  command: ['fakegroup', 'fakegrup', 'ssgrup', 'infogruppalsu', 'ssgrouppalsu'],
  category: 'Sticker Menu', limit: 1, cooldown: 5,
  contoh: "je'3s close|Open 1 sept, dilarang toxic|Anda*, Andriana guguq*, adul egix*, akun kedua*, budi, sinta",
  description: '📱 Screenshot HALAMAN INFO GRUP WhatsApp palsu: PP grup (balas/kirim gambar), nama, deskripsi, tombol, Tambah anggota, daftar anggota + label Admin grup (tanda * = admin). Format: Nama Grup|Deskripsi|Anda*, Nama*, Nama, …',
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`📱 *FAKEGROUP — halaman info grup palsu*\n\nFormat:\n\`${P}fakegroup Nama Grup|Deskripsi|Anda*, Nama Admin*, Nama Member, …\`\n• tanda \`*\` di belakang nama = *Admin grup*\n• *PP grup*: kirim/balas gambar bersama perintah (tidak ada → inisial nama grup, kuning seperti SS)\n• PP anggota: nama yang sama dengan member grup ini → PP aslinya; lainnya inisial berwarna\n• "Anda" = kamu (otomatis pakai PP kamu, sub "Tambah tag anggota")\n• Jumlah anggota bisa dipaksa: tambah \`|54\` di akhir\n\nContoh:\n\`${P}fakegroup je'3s close|Open 1 sept, no toxic|Anda*, Andriana guguq*, adul egix*, akun kedua*, budi, sinta|54\``)
    await m.typing()
    try {
      const bag = q.split('|').map(s => s.trim())
      const { nama, deskripsi, raw } = parseGroup(q)
      const total = /^\d+$/.test(bag[3] || '') ? +bag[3] : Math.max(raw.length, 3)
      const anggota = (raw.length ? raw : ['Anda*', 'Member 1', 'Member 2']).map(s => { const admin = /\*$/.test(s); const n = s.replace(/\*$/, '').trim(); const anda = /^anda$/i.test(n); return { nama: anda ? 'Anda' : n, admin, sub: anda ? 'Tambah tag anggota' : '', subHijau: anda } })
      let ppGrup = null
      try { if (m.quoted?.isMedia) ppGrup = await m.quoted.download(); else if (m.isMedia) ppGrup = (await m.download()).buffer } catch {}
      if (!ppGrup) { // kuning ala SS dengan inisial hitam
        const im = new Jimp({ width: 230, height: 230, color: 0xf5d547ff }); const ini = (nama.replace(/^[^a-z0-9]+/i, '')[0] || 'G').toLowerCase(); const t = await T(ini, [20, 20, 20], 2.2, 'w64'); im.composite(t, Math.round(115 - t.bitmap.width / 2), Math.round(115 - t.bitmap.height / 2)); ppGrup = await im.getBuffer('image/png')
      }
      const pp = {}
      const parts = m.group?.participants || []
      pp.Anda = await ppDari(m, m.sender)
      for (const a of anggota.slice(0, 12)) { if (a.nama === 'Anda') continue; const p = parts.find(x => String(x.notify || x.name || '').toLowerCase() === a.nama.toLowerCase()); if (p) pp[a.nama] = await ppDari(m, p.id) }
      const img = await fakeGroupImage({ nama, deskripsi, anggota, ppGrup, pp, total })
      return await m.sendImage(await img.getBuffer('image/png'), `📱 fakegroup · ${nama} · ${config.bot.name}`)
    } catch (e) { return m.reply('❌ ' + truncate(e.message, 160)) }
  }
}
export default { qc, iqc, fakechat, fakegroup }
