/**
 * ============================================================
 *  lib/pluginconvert.js — KONVERSI KODE BOT TELEGRAM → PLUGIN (v7.7.1)
 * ------------------------------------------------------------
 *  Dipakai perintah owner `.addplugin`: kode gaya Bot Telegraf
 *  (`bot.command("nama", async (ctx) => { ... })`) diekstrak,
 *  lalu dibungkus ke format plugin THERYHANN! Bot:
 *
 *      export default { command:[...], category, description, run }
 *
 *  + adapter ctx (lib/ctxtg.js) disuntik, sehingga kode asli
 *  (ctx.reply, ctx.replyWithPhoto, ctx.telegram.getFileLink, dst)
 *  jalan TANPA perlu diubah manual satu per satu.
 *
 *  API:
 *    ekstrakPerintahTelegraf(kode) → [{ nama, body }]
 *    konversiTelegraf(kode, { namaFile }) → { nama, kodeHasil, perintah, ringkasan }
 * ============================================================
 */

const MAKS_BODI = 40000

/** lewati string literal ' " ` (termasuk ${} di dalamnya) dari posisi i */
function lewatiString (kode, i) {
  const q = kode[i]
  if (q !== "'" && q !== '"' && q !== '`') return i
  i++
  while (i < kode.length && kode[i] !== q) {
    if (kode[i] === '\\') i++
    i++
  }
  return i /* di posisi penutup */
}

/** lewati komentar // sampai akhir baris dan / * ... */
function lewatiKomentar (kode, i) {
  if (kode[i] === '/' && kode[i + 1] === '/') {
    while (i < kode.length && kode[i] !== '\n') i++
    return i
  }
  if (kode[i] === '/' && kode[i + 1] === '*') {
    const j = kode.indexOf('*/', i + 2)
    return j < 0 ? kode.length : j + 2
  }
  return i
}

/**
 * Petik semua blok `.command("nama", async (ctx) => { ... })`.
 * Mengembalikan [{ nama, body }] dalam urutan kemunculan.
 */
export function ekstrakPerintahTelegraf (kode = '') {
  const out = []
  const re = /\.command\s*\(\s*["'`]([a-zA-Z0-9_\-]{1,32})["'`]\s*,/g
  let m
  while ((m = re.exec(kode))) {
    const nama = String(m[1]).toLowerCase()

    /* dari posisi setelah comma: cari '{' pembuka isi fungsi.
       Hindari salah baca objek literal di argumen (biasanya langsung "async (ctx) => {"
       atau "function(ctx) {") — cari token '=>' / 'function' / async dulu. */
    const jendela = kode.slice(re.lastIndex, re.lastIndex + 300)
    let pembuka = -1
    {
      let i = 0
      while (i < jendela.length) {
        const ch = jendela[i]
        i = lewatiKomentar(jendela, i)
        if (jendela[i] === "'" || jendela[i] === '"' || jendela[i] === '`') { i = lewatiString(jendela, i) + 1; continue }
        if (ch === '{') { pembuka = i; break }
        if (ch === '(') {
          /* parameter list — lewati balanced parentheses */
          let d = 1; i++
          while (i < jendela.length && d) {
            if (jendela[i] === "'" || jendela[i] === '"' || jendela[i] === '`') { i = lewatiString(jendela, i) + 1; continue }
            if (jendela[i] === '(') d++
            if (jendela[i] === ')') d--
            i++
          }
          continue
        }
        /* jika ketemu ')' penutup pemanggil .command() lebih dulu → bukan fungsi */
        if (ch === ')' && pembuka < 0) { pembuka = -2; break }
        i++
      }
    }
    if (pembuka < 0) { console.warn('[konversi] lambang { untuk command', nama, 'tidak ketemu'); continue }
    const mulai = re.lastIndex + pembuka

    /* petik sampai kurung penutup yang sepadan */
    let depth = 0, akhir = -1
    for (let j = mulai; j < kode.length; j++) {
      const ch = kode[j]
      if (ch === "'" || ch === '"' || ch === '`') { j = lewatiString(kode, j); continue }
      const nk = lewatiKomentar(kode, j)
      if (nk !== j) { j = nk - 1; continue }
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { akhir = j; break }
      }
    }
    if (akhir < 0) break
    let body = kode.slice(mulai + 1, akhir).trim()
    if (body.length > MAKS_BODI) { console.warn('[konversi] body terlalu besar dipotong:', nama) }
    body = body.slice(0, MAKS_BODI)
    out.push({ nama, body })
    re.lastIndex = akhir + 1
  }
  return out
}

const INDEN = '    '

/** bungkus hasil ekstraksi jadi kode siap ditulis ke features/<nama>.js */
export function konversiTelegraf (kode = '', { namaFile = '' } = {}) {
  const perintah = ekstrakPerintahTelegraf(kode)
  if (!perintah.length) {
    return {
      ok: false,
      alasan: 'tidak menemukan blok `bot.command("nama", async (ctx) => { ... })` di kode ini.\n' +
        'Pola yang dikenali: `.command("<nama>", async (ctx) => { … })` atau sfdiv.classic Telegraf.'
    }
  }
  const nama = namaFile || perintah[0].nama
  const aliasUnik = []
  for (const p of perintah) {
    if (!aliasUnik.includes(p.nama)) aliasUnik.push(p.nama)
  }
  /* reset() arahkan alias perintah ke fungsi yang benar */
  const fungsiTeks = perintah.map(p => {
    /* anti bentrok nama kunci objek aman utk thorax nama biasa */
    return `${INDEN}${JSON.stringify(p.nama)}: async (ctx) => {\n${p.body}\n${INDEN}}`
  }).join(',\n')

  const kodeHasil = `/**
 * ================================================================
 *  features/${nama} — dibuat oleh .addplugin (KONVERSI OTOMATIS)
 *  Sumber: kode gaya Bot Telegram/Telegraf dari chat.
 *  Perintah: ${aliasUnik.map(x => '.' + x).join(', ')}
 *  ⚠️ Ditulis otomatis — cek kasus tepi (media, ukuran berkas) bila ada.
 * ================================================================
 */
import axios from '../lib/axios-shim.js'
import { FormData } from '../lib/axios-shim.js'
import { config } from '../config.js'
import { buatCtx } from '../lib/ctxtg.js'

const P = config.display.prefix

/* --- fungsi perintah asli (dari kode kamu, ctx = adapter WhatsApp) --- */
const FUNGSI = {
${fungsiTeks}
}

export default {
  command: ${JSON.stringify(aliasUnik)},
  category: 'Custom',
  description: 'Plugin .addplugin (konversi otomatis: Bot Telegram → THERYHANN!)',
  limit: 0,
  /* kompatibel handler: m = objek pesan bot ini */
  run: async (m) => {
    const fn = FUNGSI[m.command]
    if (!fn) return m.reply('⚠️ Perintah ini tidak dikenali plugin ini.')
    const ctx = buatCtx(m)
    return fn(ctx)
  }
}
`
  return {
    ok: true,
    nama,
    kodeHasil,
    perintah: aliasUnik,
    ringkasan: [`${perintah.length} blok command diekstrak`, `perintah: ${aliasUnik.map(x => '.' + x).join(', ')}`]
  }
}

export default { ekstrakPerintahTelegraf, konversiTelegraf }
