/**
 * features/buatfitur.js — 🤖 BUAT FITUR PAKAI AI (khusus owner)
 * ------------------------------------------------------------------
 *  • .createfitur <deskripsi>            — AI menulis plugin baru (format .>_)
 *  • balas dokumen/kode + .createfitur   — AI mengadaptasi plugin orang ke sistem bot ini
 *  • .createfitur revisi <catatan>       — perbaiki hasil terakhir
 *  • .createfitur file                   — kirim ulang dokumen .js terakhir
 *  • .createfitur cara                   — panduan pasang via .>_
 *  Hasil dikirim sebagai kartu AI Rich + dokumen .js siap pasang.
 *  Kode dicek sintaks otomatis; kalau error, AI disuruh memperbaiki (1x).
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { config } from '../config.js'
import { aiChat, aiKeys, GROQ_MODELS } from '../lib/ai.js'
import { newRich } from '../lib/airichgame.js'

const P = config.display.prefix
const INGAT = new Map() // senderKey -> { kode, file, judul, pakai, ts }
const TTL_INGAT = 15 * 60 * 1000
const NAMA_LARANG = new Set(['config.js', 'index.js', 'plugins.js', 'database.js', 'serializer.js', 'functions.js', 'interactive.js', 'logger.js', 'rpg.js', 'ai.js', 'package.json', 'menu.js', 'owner.js', 'mainlab.js', 'group.js', 'gamerespon.js', 'arcade.js', 'pastellab.js', 'casinolab.js', 'jadullab.js', 'welcome.js', 'user.js'])

const SISTEM = `Kamu GENERATOR PLUGIN untuk bot WhatsApp THERYHANN (Baileys, JavaScript ESM).
Tugas: tulis SATU file plugin lengkap, siap pasang, TANPA penjelasan di luar format.
Tulis kode LENGKAP dari baris pertama sampai terakhir \`\`\` JANGAN PERNAH memotong, menyingkat, atau membuang fungsi dengan alasan panjang.

FORMAT WAJIB (tepat seperti ini):
JUDUL: <nama fitur singkat>
\`\`\`js
<kode>
\`\`\`
PAKAI: <cara pakai, 1 baris>
CATATAN: <opsional, 1 baris: butuh admin? batasan? kalau adaptasi: apa yang diubah?>

BENTUK PLUGIN (selalu export default persis begini):
export default {
  command: ['namafitur', 'aliasopsional'],
  category: 'Fun Menu',
  description: '✨ Apa fungsinya',
  limit: 0,
  cooldown: 3,
  run: async m => {
    return m.reply('...')
  }
}

KATEGORI valid: Fun Menu, Game Menu, RPG Menu, Group Menu, User Menu, Owner Menu, Downloader, Tools, Islami, Sticker, AI.
FLAG opsional: owner:true (owner saja), admin:true, botAdmin:true, group:true, premium:true.

OBJEK m (hafal ini, jangan ngarang API lain):
- m.reply(teks, {mentions:[jid]}) → balas. m.args[] (kata per kata), m.q (teks penuh), m.command
- m.sender, m.senderKey (kunci kanonik user), m.senderAlts[], m.mentioned[] (JID yang ditag)
- m.quoted {text, sender, mtype} (pesan yang dibalas; null kalau tidak ada)
- m.isGroup, m.groupName, m.group.participants [{id,pn,lid,notify,admin}]
- m.isAdmin, m.isBotAdmin, m.isOwner, m.pushName, m.jid
- m.sock.sendMessage(jid, {text}) / {document:Buffer,mimetype:'text/plain',fileName} / {delete:kunci}

IMPORT yang BOLEH (relatif saja, tanpa install apa pun):
- import { config } from '../config.js'
- import { getUser, loadDB, saveDB } from '../lib/database.js'
- import { getRPG, addMoney, addExp, expNeeded } from '../lib/rpg.js'
- import { aliasesOf, canonKey } from '../lib/identity.js'
- import { truncate } from '../lib/functions.js'
- import fs/path/os/child_process dari 'node:...' bila perlu
DILARANG: import dari 'features/...', child_process untuk perintah shell berbahaya, kode placeholder/TODO.
DEPENDENSI NPM: hanya 'cheerio' yang boleh diimpor (installer memasangnya otomatis). Selain itu DILARANG - tulis ulang bagiannya dengan fetch bawaan.
Kalau kode memakai dependensi npm, tulis di CATATAN diawali "DEP: ..." (mis. "DEP: cheerio - untuk parsing HTML").

ATURAN KERAS:
1. Satu blok \`\`\`js, kode utuh bisa jalan. DILARANG KERAS memotong: tidak ada "...", tidak ada "// dst", tidak ada fungsi yang dibuang.
2. command huruf kecil, unik, TANPA spasi. Nama file = command utama + .js (JANGAN pakai: ${[...NAMA_LARANG].join(', ')}).
3. Teks ke user berbahasa Indonesia santai + emoji.
4. Jangan pernah menampilkan/menebak nomor LID mentah ke user.
5. Kalau butuh tombol interaktif, GUNAKAN pesan AI Rich (WAJIB try/catch + fallback m.reply):
   import { newRich } from '../lib/airichgame.js'
   const rich = newRich(m.sock)
   rich.addText('...isi...')
   rich.addSuggest(['.perintah arg', '.perintah2'], { id: 'act' })
   try { await rich.send(m.jid) } catch { await m.reply('...versi teks...') }
   (pill yang diketuk terkirim sebagai teks → tulis pill berupa perintah utuh diawali prefix "${P}")

MODE ADAPTASI (kalau diberi KODE ASING) - PRINSIP BEDAH MINIMAL:
Tujuanmu BUKAN menulis ulang, melainkan MEMINDAHKAN kode asing ke format bot ini dengan perubahan SESedikit mungkin.
a. PERTAHANKAN 100%: semua fungsi, semua command/alias, semua logika, semua teks, semua angka/konstanta. Dilarang menghapus/menyederhanakan fitur apa pun.
b. Yang BOLEH diubah HANYA: (1) bungkus export menjadi export default {command, category, description, run}; (2) API asing menjadi API m setara (conn.reply jadi m.reply, m.chat jadi m.jid, cited jadi m.quoted, sender jadi m.senderKey||m.sender); (3) require menjadi import ESM dengan path ../lib yang benar.
c. Kalau ada dependensi tak dikenal: JANGAN buang fiturnya - tulis ulang HANYA bagian itu dengan fungsi bawaan (fetch/fs) yang perilakunya sama, lalu tulis di CATATAN.
d. Kalau kode asing panjang: tetap kirim SEMUA. Dilarang meringkas. Tulis "diadaptasi penuh X baris" di CATATAN.
e. Jangan mengganti nama command/alias asli. Jangan mengubah makna fitur.`

const PANDUAN_ADAPTASI = `PETA API ASING → BOT (WAJIB dipakai saat adaptasi):
- m.chat / chatId / remoteJid → m.jid
- conn / sock / client / bot (koneksi) → m.sock | cth: conn.sendMessage(m.chat, {text:'x'}) → m.sock.sendMessage(m.jid, {text:'x'})
- m.text / m.body / text (teks penuh) → m.q | args (array kata) → m.args
- command / cmd → tulis literal nama command-nya
- usedPrefix / prefix → config.display.prefix (import { config } from '../config.js')
- m.sender → m.sender (sama); kunci DB → m.senderKey; yang ditag → m.mentioned[]
- cited / quotedMsg → m.quoted (.text/.sender/.isMedia/.download())
- q.download() / downloadMedia → await m.download() atau await m.quoted.download()
- groupMetadata(jid) → m.sock.groupMetadata(m.jid); peserta → m.group.participants
- conn.reply(chat, teks, m) → m.reply(teks)
- handler.command = [...] → command: [...] di export default; handler.group/admin/owner → flag group/admin/owner
- require('x') → import; require('./lib/y') → from '../lib/y.js' (atau tulis ulang dgn fetch/fs)
- __dirname/__filename → hapus/sesuaikan (tak ada di ESM)
CONTOH ADAPTASI:
ASING:
\`\`\`js
let handler = async (m, { conn, text }) => {
  let users = (await conn.groupMetadata(m.chat)).participants.map(u => u.id)
  await conn.sendMessage(m.chat, { text: text || 'halo', mentions: users })
}
handler.command = ['hidetag']
handler.group = true
module.exports = handler
\`\`\`
HASIL:
\`\`\`js
export default {
  command: ['hidetag'],
  category: 'Group Menu',
  description: '📢 Tag semua anggota grup',
  group: true, limit: 0,
  run: async m => {
    const meta = await m.sock.groupMetadata(m.jid)
    const users = (meta?.participants || []).map(u => u.id)
    return m.sock.sendMessage(m.jid, { text: m.q || 'halo', mentions: users })
  }
}
\`\`\`
JANGAN: ubah teks balasan / URL / angka / nama command / urutan logika. Kalau ragu → pertahankan perilaku asli + tulis di CATATAN.
HASIL TIDAK BOLEH mengandung: require(, module.exports, conn., m.chat, __dirname, usedPrefix tak terdefinisi.`

const BANTUAN =
  `🤖 *BUAT FITUR PAKAI AI* (khusus owner)\n\n` +
  `• \`${P}createfitur <deskripsi>\` — tulis plugin baru\n` +
  `  mis: \`${P}createfitur kalkulator sederhana, .kali 3 4\`\n` +
  `• balas *dokumen .js / kode* + \`${P}createfitur\` — adaptasi plugin orang ke sistem bot ini\n` +
  `• \`${P}createfitur revisi <catatan>\` — perbaiki hasil terakhir\n` +
  `• \`${P}createfitur file\` — kirim ulang .js terakhir\n` +
  `• \`${P}createfitur cara\` — panduan pasang\n\n` +
  `_Adaptasi memakai token BESAR (via key Groq) + prinsip bedah minimal: logika asli dipertahankan 100%, bukan ditulis ulang. Tanpa key Groq, file besar bisa disederhanakan AI.
_Hasil: kartu AI Rich + dokumen .js siap pasang via \`${P}>_\`. Cocok untuk fitur kecil–menengah tanpa key; dengan key Groq bisa adaptasi file besar (±400 baris). AI butuh internet + sebaiknya key Groq (\`.setaikey groq gsk_xxx\`)._`

const PANDUAN =
  `📖 *CARA PASANG HASIL AI*\n\n` +
  `1. Dokumen .js sudah dikirim AI ke chat ini (atau ketik \`${P}createfitur file\`)\n` +
  `2. *Balas* dokumen itu dengan:\n   \`${P}>_ <namafile>\`\n   (nama = nama file tanpa .js, mis. \`${P}>_ kalkulator\`)\n` +
  `3. Bot memuat otomatis — langsung coba perintah barunya!\n\n` +
  `_Kalau error saat dimuat, salin pesan errornya lalu: \`${P}createfitur revisi <tempel error>\`_`

/* ---------------- murni (diuji tanpa jaringan) ---------------- */
export function parseHasil (teks) {
  const t = String(teks || '')
  const mKode = t.match(/```(?:js|javascript)?\s*\n([\s\S]*?)```/)
  if (!mKode) return { galat: 'AI tidak mengembalikan blok kode.' }
  const kode = mKode[1].trim()
  if (!/export\s+default/.test(kode)) return { galat: 'Kode tidak mengandung "export default".' }
  if (!/command\s*:/.test(kode) || !/\brun\s*:/.test(kode)) return { galat: 'Kode tidak mengandung "command/run".' }
  const judul = (t.match(/^JUDUL:\s*(.+)$/m) || [])[1]?.trim() || 'Fitur AI'
  const pakai = (t.match(/^PAKAI:\s*(.+)$/m) || [])[1]?.trim() || ''
  const catatan = (t.match(/^CATATAN:\s*(.+)$/m) || [])[1]?.trim() || ''
  return { judul: judul.slice(0, 60), kode, pakai: pakai.slice(0, 200), catatan: catatan.slice(0, 300) }
}

export function namaFileDariKode (kode) {
  const mCmd = String(kode).match(/command\s*:\s*\[\s*['"]([^'"]+)['"]/)
  let dasar = (mCmd?.[1] || 'fiturai').toLowerCase().replace(/[^a-z0-9_$>-]/g, '').slice(0, 24) || 'fiturai'
  let file = dasar + '.js'
  if (NAMA_LARANG.has(file)) file = 'ku' + file
  return file
}

export function cekSintaks (kode) {
  const tmp = path.join(os.tmpdir(), `cf-${Date.now()}-${Math.floor(Math.random() * 1e6)}.mjs`) // .mjs = cek ketat mode ESM
  try {
    fs.writeFileSync(tmp, kode)
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe', timeout: 15000 })
    return { ok: true }
  } catch (e) {
    const err = String(e?.stderr || e?.stdout || e?.message || e).split('\n').slice(0, 4).join(' ').slice(0, 300)
    return { ok: false, err }
  } finally {
    try { fs.unlinkSync(tmp) } catch {}
  }
}

const ingatAmbil = k => {
  const s = INGAT.get(k)
  if (!s || Date.now() - s.ts > TTL_INGAT) { INGAT.delete(k); return null }
  return s
}

async function kirimDokumen (m, file, kode) {
  const buf = Buffer.from(kode, 'utf8')
  try {
    await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/javascript', fileName: file }, { quoted: m.raw })
  } catch {
    await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/javascript', fileName: file })
  }
}

async function kirimHasil (m, h, file, mode) {
  INGAT.set(m.senderKey || m.sender, { kode: h.kode, file, judul: h.judul, pakai: h.pakai, ts: Date.now() })
  const ringkas =
    `🤖 *${h.judul}*\n(${mode === 'adapt' ? 'adaptasi plugin' : 'plugin baru'} · ${h.kode.split('\n').length} baris · ✅ sintaks OK)\n\n` +
    (h.pakai ? `📦 Pakai: ${h.pakai}\n` : '') +
    (h.catatan ? `📝 Catatan AI: ${h.catatan}\n` : '') +
    `\nDokumen \`${file}\` dikirim di bawah — balas dokumen itu dengan \`${P}>_ ${file.replace(/\.js$/, '')}\``
  const tip = `Ketuk pill, atau ketik ${P}createfitur revisi <catatan> untuk memperbaiki`
  try {
    const rich = newRich(m.sock)
    rich.addText(ringkas)
    rich.addTip(tip)
    rich.addSuggest([`${P}createfitur file`, `${P}createfitur cara`], { id: 'act' })
    await rich.send(m.jid)
  } catch {
    await m.reply(ringkas + `\n\n_${tip}_`).catch(() => {})
  }
  await kirimDokumen(m, file, h.kode)
}

/* panggil Groq LANGSUNG dengan token besar (adaptasi file besar tidak kepotong).
 * temperature rendah = presisi kode. Melempar error kalau tanpa key / semua model gagal. */
export async function mintaAIBesar (prompt, history = [], maxTokens = 4096) {
  const key = (aiKeys().groq || '').trim()
  if (!key) throw new Error('tanpa-key-groq')
  const messages = [{ role: 'system', content: SISTEM }, ...(history || []), { role: 'user', content: prompt }]
  const models = [...new Set([config.ai.groqModel, ...(GROQ_MODELS || [])].filter(Boolean))]
  let lastErr = null
  for (const model of models.slice(0, 3)) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), (config.ai.timeout || 20000) + 15000)
      let res
      try {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: maxTokens }),
          signal: ctrl.signal
        })
      } finally { clearTimeout(t) }
      if (!res.ok) {
        let ps = ''
        try { const j = await res.json(); ps = j?.error?.message || JSON.stringify(j).slice(0, 120) } catch { ps = await res.text().catch(() => '') }
        throw new Error(`HTTP ${res.status} ${model}: ${String(ps).slice(0, 120)}`)
      }
      const j = await res.json()
      const txt = j?.choices?.[0]?.message?.content?.trim()
      if (txt) return txt
      throw new Error('respon kosong')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('groq-gagal')
}

/* rantai: token-besar dulu (kalau ada key), lalu aiChat standar */
async function mintaAI (prompt, history = [], maxTokens = 4096) {
  try {
    return await mintaAIBesar(prompt, history, maxTokens)
  } catch (e) {
    if (String(e?.message || '').includes('401')) throw new Error('Key Groq DITOLAK (401) — buat baru di console.groq.com lalu `.setaikey groq gsk_xxx`.')
  }
  return aiChat(prompt, history, { system: SISTEM })
}

/* bandingkan daftar fungsi kode asing vs hasil: laporkan yang HILANG (indikasi dirusak) */
export function bandingFungsi (asing, baru) {
  const ambil = t => {
    const s = new Set()
    for (const m of String(t).matchAll(/function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(|\b([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function\s*)?\(/g)) {
      s.add(m[1] || m[2] || m[3])
    }
    return s
  }
  const a = ambil(asing), b = ambil(baru)
  return [...a].filter(x => x && !b.has(x))
}

/* kupas string & komentar agar detektor pola tidak tertipu teks biasa */
function kupasKode (kode) {
  return String(kode || '')
    .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''")
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^\w$:'"\/])\/\/[^\n]*/g, '$1')
}

/* deteksi sisa pola asing / struktur salah pada kode hasil adaptasi.
 * Kembalikan daftar masalah (kosong = bersih). */
export function sisaAsing (kode) {
  const k = kupasKode(kode)
  const ada = re => re.test(k)
  const temu = []
  if (ada(/(?<![\w$.])require\s*\(/)) temu.push('masih ada require(...) — ubah ke import ESM')
  if (ada(/module\.exports|(?<![\w$.])exports\s*\./)) temu.push('masih ada module.exports — ubah ke export default')
  if (ada(/handler\s*\.\s*command\s*=/)) temu.push('masih ada handler.command — pindah ke export default')
  if (ada(/(?<!\w)conn\s*\??\./) && !ada(/(?:const|let|var)\s+conn\s*=/)) temu.push('masih ada conn.* — ubah ke m.sock.*')
  if (ada(/(?<!\w)m\.chat\b/)) temu.push('masih ada m.chat — ubah ke m.jid')
  if (ada(/(?<!\w)cited\b/) && !ada(/(?:const|let|var)\s+cited\s*=/)) temu.push('masih ada cited — ubah ke m.quoted')
  if (ada(/(?<!\w)usedPrefix\b/) && !ada(/(?:const|let|var)\s+usedPrefix\s*=/)) temu.push('masih ada usedPrefix — pakai config.display.prefix')
  if (ada(/__dirname|__filename/)) temu.push('masih ada __dirname/__filename — tak tersedia di ESM')
  if (!ada(/export\s+default/)) temu.push('tidak ada export default')
  if (!ada(/(?<!\w)command\s*:/)) temu.push('tidak ada command: [...]')
  if (!ada(/(?<!\w)run\s*[:\(]/)) temu.push('tidak ada run: ...')
  return temu
}

async function hasilkan (m, prompt, history, mode, kodeAsing = '') {
  await m.reply(mode === 'adapt' ? '⏳ AI mengadaptasi kode (bedah minimal, logika dipertahankan)…' : '⏳ AI sedang menulis kode, tunggu sebentar…')
  const MAKS = mode === 'baru' ? 2048 : 4096
  let akhir = null
  let mentah = ''
  for (let coba = 1; coba <= 2; coba++) {
    try {
      mentah = await mintaAI(coba === 1 ? prompt : `${prompt}\n\nRESPONMU SEBELUMNYA BERMASALAH: ${akhir}\nPerbaiki dan kirim ULANG full sesuai FORMAT WAJIB (JUDUL + blok js + PAKAI).`, history, MAKS)
    } catch (e) {
      return m.reply(`❌ AI gagal menjawab: ${String(e?.message || e).slice(0, 400)}\n\n_Tips: pasang key Groq gratis → \`${P}setaikey groq gsk_xxx\` (console.groq.com)_`)
    }
    const h = parseHasil(mentah)
    if (h.galat) { akhir = h.galat; continue }
    const cek = cekSintaks(h.kode)
    if (!cek.ok) { akhir = 'sintaks error: ' + cek.err; continue }
    if (mode === 'adapt') {
      const sisa = sisaAsing(h.kode)
      if (sisa.length && coba === 1) { akhir = 'KODE MASIH SALAH: ' + sisa.join(' | ') + '. Perbaiki SEMUA itu'; continue }
      if (sisa.length) h.catatan = (h.catatan ? h.catatan + ' ' : '') + `⚠️ Perlu cek manual: ${sisa.join(' | ')}.`
    }
    if (mode === 'adapt' && kodeAsing) {
      const hilang = bandingFungsi(kodeAsing, h.kode)
      if (hilang.length) {
        h.catatan = (h.catatan ? h.catatan + ' ' : '') + `⚠️ ${hilang.length} fungsi asli tak terdeteksi (${hilang.slice(0, 5).join(', ')}${hilang.length > 5 ? '…' : ''}) — cek manual, atau \`${P}createfitur revisi kembalikan fungsi X\`.`
      } else {
        h.catatan = (h.catatan ? h.catatan + ' ' : '') + '✅ Semua fungsi asli terdeteksi utuh.'
      }
    }
    return kirimHasil(m, h, namaFileDariKode(h.kode), mode)
  }
  return m.reply(`❌ AI 2x gagal memberi kode valid (terakhir: ${akhir}).\nCoba deskripsikan lebih sederhana, atau tulis manual via \`${P}>_\`.`)
}

/* Adaptasi kode asing -> plugin bot (dipakai .>_ untuk auto-adapt).
 * Kembalikan { kode, judul, pakai, catatan }. Throw kalau AI gagal / hasil tak valid. */
export async function adaptasiKode (kodeAsing, catatan = '') {
  const MAKS_ASING = (aiKeys().groq || '').trim() ? 20000 : 12000
  const asing = String(kodeAsing || '').slice(0, MAKS_ASING)
  if (!asing.trim()) throw new Error('kode kosong')
  const prompt = `MODE ADAPTASI: ubah KODE ASING berikut menjadi plugin THERYHANN sesuai FORMAT WAJIB (bedah minimal, JANGAN buang logika/fitur apa pun).${catatan ? ` Catatan: ${catatan}` : ''}\nKODE ASING:\n${asing}\n\n${PANDUAN_ADAPTASI}`
  let akhir = ''
  for (let coba = 1; coba <= 2; coba++) {
    const mentah = await mintaAI(coba === 1 ? prompt : `${prompt}\n\nRESPONMU SEBELUMNYA BERMASALAH: ${akhir}\nPerbaiki dan kirim ULANG full sesuai FORMAT WAJIB (JUDUL + blok js + PAKAI).`, [], 4096)
    const h = parseHasil(mentah)
    if (h.galat) { akhir = h.galat; continue }
    const cek = cekSintaks(h.kode)
    if (!cek.ok) { akhir = 'sintaks error: ' + cek.err; continue }
    const sisa = sisaAsing(h.kode)
    if (sisa.length && coba === 1) { akhir = 'KODE MASIH SALAH: ' + sisa.join(' | ') + '. Perbaiki SEMUA itu'; continue }
    if (sisa.length) h.catatan = (h.catatan ? h.catatan + ' ' : '') + `⚠️ Perlu cek manual: ${sisa.join(' | ')}.`
    const hilang = bandingFungsi(asing, h.kode)
    h.catatan = (h.catatan ? h.catatan + ' ' : '') + (hilang.length
      ? `⚠️ ${hilang.length} fungsi asli tak terdeteksi (${hilang.slice(0, 5).join(', ')}${hilang.length > 5 ? '…' : ''}).`
      : '✅ Semua fungsi asli terdeteksi utuh.')
    return h
  }
  throw new Error('AI 2x gagal memberi kode valid (terakhir: ' + akhir + ')')
}

/* ---------------- perintah ---------------- */
export const createFitur = {
  command: ['createfitur', 'buatfitur', 'bikinfitur'],
  category: 'Owner Menu',
  description: '🤖 (owner) AI menulis/adaptasi plugin siap pasang `.createfitur <deskripsi>`',
  owner: true,
  limit: 0,
  cooldown: 30,
  run: async m => {
    const sub = String(m.args[0] || '').toLowerCase()
    const kunci = m.senderKey || m.sender
    if (sub === 'file') {
      const s = ingatAmbil(kunci)
      if (!s) return m.reply(`❌ Belum ada hasil tersimpan (atau sudah kedaluwarsa 15 menit). Buat dulu: \`${P}createfitur <deskripsi>\``)
      await kirimDokumen(m, s.file, s.kode)
      return m.reply(`📄 \`${s.file}\` dikirim ulang — balas dokumen itu dengan \`${P}>_ ${s.file.replace(/\.js$/, '')}\``)
    }
    if (sub === 'cara') return m.reply(PANDUAN)
    if (sub === 'revisi') {
      const s = ingatAmbil(kunci)
      if (!s) return m.reply(`❌ Tidak ada hasil untuk direvisi. Buat dulu: \`${P}createfitur <deskripsi>\``)
      const catatan = String(m.q || '').replace(/^\s*revisi\s*/i, '').trim()
      if (!catatan) return m.reply(`✏️ *REVISI*\n\nPakai: \`${P}createfitur revisi <catatan>\`\nContoh: \`${P}createfitur revisi tambah alias .k2 dan ubah kategori ke Tools\``)
      return hasilkan(m, `REVISI plugin ini sesuai catatan: ${catatan}\nKirim ULANG full sesuai FORMAT WAJIB.`, [{ role: 'user', content: `KODE SAAT INI (${s.file}):\n${s.kode}` }], 'revisi')
    }
    /* mode adaptasi: balas dokumen/kode */
    const q = m.quoted
    let kodeAsing = ''
    if (q?.isMedia) {
      try {
        const h = await m.download()
        const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
        if (buf) kodeAsing = buf.toString('utf8')
      } catch {}
      if (!kodeAsing) return m.reply('❌ Gagal mengunduh dokumen yang dibalas. Coba lagi.')
    } else if (q?.text && q.text.trim().length > 50) {
      kodeAsing = q.text.trim()
    }
    if (kodeAsing) {
      const catatan = String(m.q || '').trim()
      const MAKS_ADAPT = (aiKeys().groq || '').trim() ? 20000 : 12000
      const baris = kodeAsing.split('\n').length
      const dipotong = kodeAsing.length > MAKS_ADAPT ? kodeAsing.slice(0, MAKS_ADAPT) + '\n// ...(sisa dipotong karena sangat panjang)' : kodeAsing
      if (baris > 250 && !(aiKeys().groq || '').trim()) {
        await m.reply(`⚠️ File besar (${baris} baris) tapi TANPA key Groq — AI cadangan (token kecil) kemungkinan menyederhanakan kode.\nPasang key gratis untuk adaptasi penuh: \`${P}setaikey groq gsk_xxx\`.\n\nTetap dicoba…`)
      }
      return hasilkan(m,
        `MODE ADAPTASI: ubah KODE ASING berikut menjadi plugin THERYHANN sesuai FORMAT WAJIB (bedah minimal, JANGAN buang logika/fitur apa pun).\n${PANDUAN_ADAPTASI}${catatan ? ` Catatan user: ${catatan}` : ''}`,
        [{ role: 'user', content: `KODE ASING (${baris} baris):\n${dipotong}` }], 'adapt', kodeAsing)
    }
    /* mode buat baru */
    const deskripsi = String(m.q || '').trim()
    if (!deskripsi) return m.reply(BANTUAN)
    return hasilkan(m, `Buat plugin baru: ${deskripsi}`, [], 'baru')
  }
}

/* hook uji (diabaikan loader: bukan plugin) */
export const __ujiCf = { kirimHasil, ingatAmbil, bandingFungsi, mintaAIBesar, adaptasiKode, sisaAsing }

export default { createFitur }
