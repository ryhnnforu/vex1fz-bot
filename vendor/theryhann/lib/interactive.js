/**
 * ============================================================
 *  INTERACTIVE MESSAGE / BUTTON / BUTTON LIST / AI RICH
 *  Semua builder pesan interaktif THERYHANN! ada di sini.
 *  Base: @rexxhayanasi/elaina-baileys (MessageBuilder v4.7)
 * ============================================================
 *
 *  Catatan penting dari sisi protokol WhatsApp:
 *  - quick_reply (tombol)      -> tampil di SEMUA device (Android/iOS/Web), maks 10
 *  - single_select (list)      -> HANYA tampil di WhatsApp Android
 *  - quick_reply TIDAK BOLEH dicampur dengan tipe tombol lain
 *  - AI Rich message           -> tampilan "kaya" ala Meta AI (teks, kode, tabel,
 *                                 gambar, saran balasan, dll)
 */

import { Button, ButtonV2, AIRich, Carousel } from '../shims/elaina.mjs'
import { config } from '../config.js'
import { getSettings } from './database.js'
import { resizeImage, sniffMime, saveTmp } from './functions.js'

/* ------------------------------------------------------------------ */
/* 1. INTERACTIVE MESSAGE (native flow: tombol + url + copy + call)    */
/* ------------------------------------------------------------------ */

/**
 * Kirim interactive message bebas.
 * @param {object} sock
 * @param {string} jid
 * @param {object} opt
 *   { title, subtitle, body, footer, image, video, document,
 *     buttons: [{ text, id }], url: [{ text, url }], copy: [{ text, code }],
 *     call: [{ text, number }], list: { title, sections:[{title, rows:[{header,title,description,id}]}] },
 *     quoted }
 */
export async function sendInteractive (sock, jid, opt = {}) {
  const btn = new Button(sock)

  if (opt.title) btn.setTitle(opt.title)
  if (opt.subtitle) btn.setSubtitle(opt.subtitle)
  btn.setBody(opt.body || opt.text || ' ')
  if (opt.footer) btn.setFooter(opt.footer)

  // header media (opsional)
  if (opt.image) {
    try {
      btn.setImage(await normalizeMedia(opt.image, 512))
    } catch {}
  } else if (opt.video) {
    try {
      btn.setVideo(await normalizeMedia(opt.video))
    } catch {}
  }

  // tombol balasan cepat (quick_reply)
  for (const b of opt.buttons || []) btn.addReply(b.text || b.displayText, b.id || b.text)

  // tombol list / single_select (Android only)
  if (opt.list) {
    btn.addSelection(opt.list.title || 'Pilih Menu')
    for (const sec of opt.list.sections || []) {
      btn.makeSection(sec.title || '', sec.highlight || '')
      for (const row of sec.rows || []) {
        btn.makeRow(row.header || '', row.title || '', row.description || '', row.id || row.title)
      }
    }
  }

  // NOTE: quick_reply tidak boleh dicampur tipe tombol lain,
  // jadi tombol tambahan hanya ditambahkan kalau tidak ada quick_reply.
  const hasQuickReply = (opt.buttons || []).length > 0 || !!opt.list
  if (!hasQuickReply) {
    for (const u of opt.url || []) btn.addUrl(u.text, u.url)
    for (const c of opt.copy || []) btn.addCopy(c.text, c.code)
    for (const c of opt.call || []) btn.addCall(c.text, c.number)
  } else if (opt.url?.length || opt.copy?.length) {
    // kalau user tetap minta, tambahkan sebagai cta (resiko ditolak client)
    for (const u of opt.url || []) btn.addUrl(u.text, u.url)
    for (const c of opt.copy || []) btn.addCopy(c.text, c.code)
  }

  if (opt.contextInfo) btn.setContextInfo(opt.contextInfo)

  const options = {}
  if (opt.quoted) options.quoted = opt.quoted
  return await btn.send(jid, options)
}

/**
 * Tombol quick reply murni (paling kompatibel, maks 10 tombol)
 */
/** WhatsApp menolak teks >4096 karakter — potong aman untuk body pesan interaktif */
function potongBody (teks, maks = 3900) {
  const t = String(teks ?? '')
  if (t.length <= maks) return t
  return t.slice(0, maks - 60).replace(/\n[^\n]*$/, '') + `\n\n_…terpotong (${t.length} karakter). Ketik perintah untuk detail lengkap._`
}

export async function sendButtons (
  sock,
  jid,
  { text, title, footer, buttons = [], image, quoted } = {}
) {
  const btn = new Button(sock)
  if (title) btn.setTitle(title)
  btn.setBody(potongBody(text || title || ' '))
  if (footer) btn.setFooter(footer)
  if (image) {
    try {
      btn.setImage(await normalizeMedia(image, 512))
    } catch {}
  }
  for (const b of buttons.slice(0, 10)) {
    btn.addReply(typeof b === 'string' ? b : b.text || b.displayText, typeof b === 'string' ? b : b.id || b.text)
  }
  return await btn.send(jid, quoted ? { quoted } : {})
}

/**
 * BUTTON LIST (single_select) -> render di WhatsApp Android
 * sections: [{ title, rows: [{ header, title, description, id }] }]
 */
export async function sendList (
  sock,
  jid,
  { text, title, footer, buttonText = 'Pilih Menu', sections = [], image, quoted } = {}
) {
  const btn = new Button(sock)
  if (title) btn.setTitle(title)
  btn.setBody(potongBody(text || title || ' '))
  if (footer) btn.setFooter(footer)
  if (image) {
    try {
      btn.setImage(await normalizeMedia(image, 512))
    } catch {}
  }
  btn.addSelection(buttonText)
  for (const sec of sections) {
    btn.makeSection(sec.title || '', sec.highlight || '')
    for (const row of sec.rows || []) {
      btn.makeRow(row.header || '', row.title || '', row.description || '', row.id || row.title)
    }
  }
  return await btn.send(jid, quoted ? { quoted } : {})
}

/**
 * Tombol klasik (buttonsMessage / hydrated template style)
 */
export async function sendButtonV2 (
  sock,
  jid,
  { text, title, subtitle, footer, thumbnail, buttons = [], quoted } = {}
) {
  const b = new ButtonV2(sock)
  if (title) b.setTitle(title)
  if (subtitle) b.setSubtitle(subtitle)
  b.setBody(text || ' ')
  if (footer) b.setFooter(footer)
  if (thumbnail) {
    try {
      b.setThumbnail(await normalizeMedia(thumbnail, 300))
    } catch {}
  }
  for (const btn of buttons) {
    b.addButton(typeof btn === 'string' ? btn : btn.text, typeof btn === 'string' ? btn : btn.id)
  }
  return await b.send(jid, quoted ? { quoted } : {})
}

/**
 * CAROUSEL (kartu geser, tiap kartu wajib punya gambar/video)
 * cards: [{ image, title, body, footer, buttons:[{text,id}] }]
 */
export async function sendCarousel (sock, jid, { text, footer, cards = [], quoted } = {}) {
  const built = []
  for (const c of cards) {
    const one = new Button(sock)
    if (c.image) {
      try {
        one.setImage(await normalizeMedia(c.image, 512))
      } catch {}
    }
    if (c.title) one.setTitle(c.title)
    one.setBody(c.body || c.text || ' ')
    if (c.footer) one.setFooter(c.footer)
    for (const b of c.buttons || []) one.addReply(b.text, b.id)
    built.push(await one.toCard())
  }
  const car = new Carousel(sock)
  car.setBody(potongBody(text || ' ', 1500))
  if (footer) car.setFooter(footer)
  car.addCard(built)
  return await car.send(jid, quoted ? { quoted } : {})
}

/* ------------------------------------------------------------------ */
/* 2. AI RICH MESSAGE (tampilan kaya ala Meta AI)                      */
/* ------------------------------------------------------------------ */

/**
 * Kirim AI Rich message.
 * @param {object} opt
 *  { title, footer, text, code: {language, code}, table: [[..],[..]],
 *    image, video, tip, suggest: [], sources: [], metadata }
 *  @returns {AIRich} instance (bisa dipakai untuk sendEdit)
 */
export async function sendAIRich (sock, jid, opt = {}) {
  const rich = new AIRich(sock)
  if (opt.title) rich.setTitle(opt.title)
  if (opt.footer) rich.setFooter(opt.footer)
  if (opt.text) rich.addText(opt.text)
  if (opt.code) rich.addCode(opt.code.language || 'javascript', opt.code.code)
  if (opt.table) rich.addTable(opt.table)
  if (opt.image) {
    try {
      rich.addImage(await toMediaUrl(opt.image))
    } catch {}
  }
  if (opt.tip) rich.addTip(opt.tip)
  if (opt.metadata) rich.addMetadata(opt.metadata)
  if (opt.suggest?.length) rich.addSuggest(opt.suggest)
  await rich.send(jid, opt.quoted ? { quoted: opt.quoted } : {})
  return rich
}

/**
 * AI Rich "streaming": kirim dulu status mikir, lalu edit jadi hasil akhir.
 */
export async function sendAIRichProgressive (sock, jid, { title, thinking = 'Sedang berpikir…', build }) {
  const rich = new AIRich(sock)
  if (title) rich.setTitle(title)
  rich.addText(thinking, { id: 'think' })
  await rich.send(jid)
  try {
    await build(rich)
    rich.delete('think')
    await rich.sendEdit()
  } catch (e) {
    rich.delete('think')
    rich.addText('❌ Gagal: ' + e.message)
    await rich.sendEdit().catch(() => {})
  }
  return rich
}

/* ------------------------------------------------------------------ */
/* 3. SMART MENU (otomatis pilih mode paling aman)                     */
/* ------------------------------------------------------------------ */

export function resolveMenuMode (isGroup) {
  const mode = (getSettings().menuMode || config.display.menuMode || 'auto').toLowerCase()
  if (mode === 'auto' || mode === 'html' || mode === 'menu2' || mode === 'menu3' || mode === 'video') return isGroup ? 'button' : 'list'
  return mode
}

/**
 * Kirim menu pintar:
 *  - mode 'button' : quick_reply (max 10, semua device)
 *  - mode 'list'   : single_select (Android)
 *  - mode 'text'   : teks biasa
 *  - otomatis fallback ke teks kalau interactive ditolak WhatsApp
 *
 * items: [{ title, description, id }]
 */
export async function sendSmartMenu (sock, jid, { text, title, footer, items = [], image, isGroup = false, quoted } = {}) {
  const mode = resolveMenuMode(isGroup)

  if (mode === 'text') {
    return await sendTextMenu(sock, jid, { text, title, footer, items })
  }

  const maxBtn = mode === 'button' ? 10 : Math.min(items.length, 100)
  const used = items.slice(0, maxBtn)

  const build = (withImage) => {
    const payload = { text, title, footer, quoted, image: withImage ? image : undefined }
    if (mode === 'button') {
      return sendButtons(sock, jid, {
        ...payload,
        buttons: used.map(i => ({ text: trim(i.title, 24), id: i.id }))
      })
    }
    // WhatsApp membatasi ±10 baris per section & ±10 section (maks 100 baris)
    const PER_SECTION = 10
    const MAX_SECTION = 10
    const rows = used.map(i => ({
      header: '',
      title: trim(i.title, 60),
      description: trim(i.description || '', 72),
      id: i.id
    }))
    const sections = []
    for (let i = 0; i < Math.min(rows.length, PER_SECTION * MAX_SECTION); i += PER_SECTION) {
      sections.push({
        title: trim(title || 'Menu', 40) + (rows.length > PER_SECTION ? ` (${Math.floor(i / PER_SECTION) + 1})` : ''),
        rows: rows.slice(i, i + PER_SECTION)
      })
    }
    return sendList(sock, jid, {
      ...payload,
      buttonText: '📋 Buka Menu',
      sections
    })
  }

  try {
    return await build(!!image)
  } catch (e) {
    // gagal karena header gambar (butuh upload media / ffmpeg) -> coba tanpa gambar
    if (image) {
      try {
        return await build(false)
      } catch (e2) {
        if (process.env.DEBUG_MENU) console.error('[menu fallback]', e2)
        return await sendTextMenu(sock, jid, { text, title, footer, items, error: e2.message })
      }
    }
    if (process.env.DEBUG_MENU) console.error('[menu fallback]', e)
    return await sendTextMenu(sock, jid, { text, title, footer, items, error: e.message })
  }
}

export async function sendTextMenu (sock, jid, { text, title, footer, items = [], error } = {}) {
  let out = ''
  if (title) out += `*${title}*\n\n`
  if (text) out += text + '\n\n'
  items.forEach((i, n) => {
    out += `${n + 1}. ${i.title}\n   » \`${i.id}\`${i.description ? ' — ' + i.description : ''}\n`
  })
  if (error) out += `\n_(menu interaktif gagal: ${error}, ditampilkan sebagai teks)_`
  if (footer) out += `\n\n${footer}`
  out = out.trim()
  // menu teks bisa sangat panjang -> pecah jadi beberapa pesan
  if (out.length <= 3900) return await sock.sendMessage(jid, { text: out })
  const { chunkText } = await import('./functions.js')
  const bagian = chunkText(out, 3800)
  let hasil = null
  for (let i = 0; i < bagian.length; i++) {
    hasil = await sock.sendMessage(jid, { text: bagian[i] + `\n\n_(${i + 1}/${bagian.length})_` })
  }
  return hasil
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function trim (s, n) {
  s = String(s || '')
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

/** pastikan media jadi buffer (dari url / path / buffer) + resize biar ringan */
async function normalizeMedia (media, size = 512) {
  const buf = await toBuffer(media)
  const mime = sniffMime(buf)
  if (mime.startsWith('image/')) {
    const small = await resizeImage(buf, size, size)
    return small
  }
  return buf
}

async function toBuffer (media) {
  if (Buffer.isBuffer(media)) return media
  if (typeof media === 'string') {
    if (/^https?:\/\//.test(media)) {
      const { getBuffer } = await import('./functions.js')
      return await getBuffer(media)
    }
    const fs = await import('node:fs')
    return fs.readFileSync(media)
  }
  if (media?.buffer) return Buffer.isBuffer(media.buffer) ? media.buffer : Buffer.from(media.buffer)
  throw new Error('Media tidak dikenali')
}

/** AI Rich butuh URL gambar publik -> upload buffer tidak didukung, jadi pakai url apa adanya */
async function toMediaUrl (media) {
  if (typeof media === 'string') return media
  const buf = await toBuffer(media)
  // simpan lokal lalu kirim sebagai url? AI Rich hanya menerima URL publik,
  // jadi kalau berupa buffer kita lewati saja (tidak fatal).
  return saveTmp(buf, 'jpg')
}

export default {
  sendInteractive,
  sendButtons,
  sendList,
  sendButtonV2,
  sendCarousel,
  sendAIRich,
  sendAIRichProgressive,
  sendSmartMenu
}
