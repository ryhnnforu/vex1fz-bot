/**
 * 🔧 ADAPTASI CODE v1.1 — adaptasi kode asing via AI tanpa merusak isinya
 * ------------------------------------------------------------------
 *  .adaptasicode            balas dokumen .js / pesan berisi kode / tulis kode langsung,
 *                           AI mengadaptasi jadi plugin siap pasang (bedah minimal)
 *  alias: .adaptcode .adaptasikode
 *
 *  Hasil: ringkasan + dokumen .js siap dipasang via .>_ (balas dokumen itu).
 *  Mesin: features/buatfitur.js (adaptasiKode) — wajib ada.
 *
 *  Keamanan: khusus OWNER, cooldown 30 detik.
 */
import fs from 'node:fs'
import { builtinModules } from 'node:module'
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { aiKeys } from '../lib/ai.js'
import path from 'node:path'
import { FEATURES_DIR } from '../lib/plugins.js'

const P = config.display.prefix
const MODUL_BAWAAN = new Set(builtinModules.map(s => String(s).replace(/^node:/, '')))
const MAKS_UNDUH = 200000 /* tolak dokumen > 200 KB */

/* daftar import npm telanjang dari kode: from 'x' / require('x') / import('x').
 * Relatif, absolut, node:, dan modul bawaan dilewati. */
export function daftarDependensi (kode) {
  const temu = new Set()
  for (const m of String(kode || '').matchAll(/(?:from|require\(|import\()\s*['"]([^'"]+)['"]/g)) {
    const s = String(m[1] || '').trim()
    if (!s || s.startsWith('.') || s.startsWith('/') || s.startsWith('node:')) continue
    const dasar = s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0]
    if (!dasar || MODUL_BAWAAN.has(dasar)) continue
    temu.add(dasar)
  }
  return [...temu]
}

async function kirimDokumen (m, file, kode) {
  const buf = Buffer.from(kode, 'utf8')
  try {
    await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/javascript', fileName: file }, { quoted: m.raw })
  } catch {
    await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/javascript', fileName: file })
  }
}

const BANTUAN =
  `🔧 *ADAPTASI CODE*\n\n` +
  `Kirim kode asing → terima plugin siap pasang, isi dipertahankan (bedah minimal).\n\n` +
  `*Cara 1 — balas dokumen .js*\n` +
  `Kirim dokumen kode ke chat bot, lalu balas dengan:\n` +
  `${P}adaptasicode\n\n` +
  `*Cara 2 — balas pesan berisi kode*\n` +
  `${P}adaptasicode [catatan, mis. pertahankan command .toanime]\n\n` +
  `*Cara 3 — tulis langsung*\n` +
  `${P}adaptasicode <tempel kode di sini>\n\n` +
  `Hasil berupa dokumen .js — balas dokumen itu dengan \`${P}>_ <nama>\` untuk memasang. ` +
  `Untuk file besar (±250 baris ke atas), pasang key Groq gratis: \`${P}setaikey groq gsk_xxx\`.`

/* Periksa mesin adaptasi (features/buatfitur.js). Parameter jalur untuk uji. */
export async function cekMesin (jalur = path.join(FEATURES_DIR, 'buatfitur.js')) {
  if (!fs.existsSync(jalur)) return { ok: false, status: 'belum dipasang', detail: 'file features/buatfitur.js tidak ada' }
  try {
    const mesin = await import(jalur)
    const ada = ['adaptasiKode', 'sisaAsing', 'mintaAIBesar', 'bandingFungsi'].filter(f => typeof mesin[f] === 'function')
    if (!ada.includes('adaptasiKode')) return { ok: false, status: 'versi lama', detail: 'tanpa adaptasiKode — update file' }
    return { ok: true, status: 'ok', detail: ada.join(', ') }
  } catch (e) {
    return { ok: false, status: 'gagal dimuat', detail: String(e?.message || e).slice(0, 160) }
  }
}

async function laporMesin (m) {
  const c = await cekMesin()
  if (c.ok) return m.reply(`🔧 *STATUS MESIN ADAPTASI*\n\nbuatfitur.js: ✅ OK (${c.detail})\nSiap dipakai — balas kode/dokumen dengan \`${P}adaptasicode\`.`)
  const saran = c.status === 'versi lama' ? `\`${P}>_ buatfitur --paksa\`` : `\`${P}>_ buatfitur\``
  return m.reply(`🔧 *STATUS MESIN ADAPTASI*\n\nbuatfitur.js: ❌ ${c.status} (${c.detail})\nPerbaiki: ${saran}`)
}

export const adaptasiCode = {
  command: ['adaptasicode', 'adaptcode', 'adaptasikode'],
  category: 'Owner Menu',
  description: `🔧 (owner) Adaptasi kode asing via AI tanpa merusak isi ${P}adaptasicode (balas kode)`,
  owner: true,
  limit: 0,
  cooldown: 30,
  run: async m => {
    /* --- ambil kode sumber --- */
    const q = m.quoted
    if (!q && String(m.q || '').trim().toLowerCase() === 'cek') return laporMesin(m)
    let kodeAsing = ''
    let sumber = ''
    if (q?.isMedia) {
      try {
        const h = await m.download()
        const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
        if (buf) {
          if (buf.length > MAKS_UNDUH) return m.reply(`❌ Dokumen terlalu besar (${buf.length} byte, maks ${MAKS_UNDUH}).`)
          kodeAsing = buf.toString('utf8')
        }
      } catch {}
      if (!kodeAsing) return m.reply('❌ Gagal mengunduh dokumen yang dibalas. Coba lagi.')
      sumber = 'dokumen yang dibalas'
    } else if (q?.text && q.text.trim().length > 50) {
      kodeAsing = q.text.trim()
      sumber = 'pesan yang dibalas'
    } else if (!q && String(m.q || '').trim().length > 50) {
      kodeAsing = String(m.q).trim()
      sumber = 'teks perintah'
    }
    if (!kodeAsing) return m.reply(BANTUAN)
    const catatan = (q && String(m.q || '').trim().length <= 500) ? String(m.q || '').trim() : ''

    /* --- peringatan file besar tanpa key --- */
    const barisAsing = kodeAsing.split('\n').length
    if (barisAsing > 250 && !(aiKeys().groq || '').trim()) {
      await m.reply(`⚠️ Kode besar (${barisAsing} baris) tapi TANPA key Groq — AI cadangan (token kecil) kemungkinan menyederhanakan kode.\nPasang key gratis untuk adaptasi penuh: \`${P}setaikey groq gsk_xxx\`.\n\nTetap dicoba…`)
    }

    /* --- mesin adaptasi --- */
    const cek = await cekMesin()
    if (!cek.ok) {
      const saran = cek.status === 'versi lama' ? `\`${P}>_ buatfitur --paksa\`` : `\`${P}>_ buatfitur\``
      return m.reply(`❌ Mesin adaptasi tidak tersedia (${cek.status}: ${cek.detail}).\nPasang/update dulu ${saran}, lalu ulangi.`)
    }
    const mesin = await import('./buatfitur.js')
    await m.reply('🔧 AI mengadaptasi kode (bedah minimal, isi dipertahankan) — tunggu 1-3 menit…')
    let h = null
    try {
      h = await mesin.adaptasiKode(kodeAsing, catatan || ('sumber: ' + sumber))
    } catch (e) {
      return m.reply(`❌ Adaptasi AI gagal: ${truncate(String(e?.message || e), 400)}\n\n_Tips: pasang key Groq gratis → \`${P}setaikey groq gsk_xxx\` (console.groq.com)_`)
    }

    /* --- siapkan hasil --- */
    let file = 'hasil-adaptasi.js'
    try { file = mesin.namaFileDariKode(h.kode) || file } catch {}
    const barisHasil = String(h.kode).split('\n').length
    const deps = daftarDependensi(h.kode)
    const ringkas =
      `🔧 *ADAPTASI SELESAI* — \`${file}\`\n\n` +
      `Asal: ${sumber} (${barisAsing} baris → ${barisHasil} baris)\n` +
      `${truncate(String(h.catatan || ''), 400)}\n` +
      (deps.length ? `Dependensi: ${deps.join(', ')} (dipasang otomatis oleh \`${P}>_\`)\n` : '') +
      `\nPasang: balas dokumen ini dengan \`${P}>_ ${file.replace(/\.js$/, '')}\`` +
      (String(h.kode).length <= 2500 ? `\n\n\`\`\`js\n${h.kode}\n\`\`\`` : '')
    await m.reply(ringkas)
    try {
      await kirimDokumen(m, file, h.kode)
    } catch (e) {
      if (String(h.kode).length > 3500) return m.reply(`❌ Dokumen gagal dikirim: ${e?.message || e}`)
    }
  }
}

export default { adaptasiCode }
