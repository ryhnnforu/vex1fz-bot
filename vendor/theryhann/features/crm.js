/**
 * 🗂️ .crm — kumpulkan data yang dikirim user  v7.37.0
 * ------------------------------------------------------------------
 *  OWNER:
 *   • .crm                    dashboard: jumlah data, terakhir masuk
 *   • .crm buat <Nama|pertanyaan>   bikin form: field dipisah "|"
 *   • .crm aktif              aktifkan form di chat ini
 *   • .crm mati               nonaktifkan (user tidak ditanya lagi)
 *   • .crm data [n]           lihat data terkumpul
 *   • .crm cari <teks>        cari data yang mengandung teks
 *   • .crm hapus <n>          hapus satu data
 *   • .crm kosongkan          hapus semua data (minta konfirmasi)
 *   • .crm ekspor             kirim semua data sebagai file JSON/CSV
 *
 *  USER:
 *   • .crm                    isi form (dipandu satu per satu)
 *   • setelah itu cukup kirim pesan biasa — bot menangkap jawabannya
 *     berurutan sampai form selesai (lewat checkCrm di handler)
 *
 *  Data disimpan di database/crm.json (per jid chat). Tidak ada data yang
 *  dikirim keluar server — murni penyimpanan lokal bot.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { loadDB, saveNow } from '../lib/database.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const MAKS_FIELD = 12
const MAKS_DATA = 500
const MAKS_JAWAB = 1500
const TTL_SESI = 10 * 60 * 1000   // sesi pengisian kedaluwarsa 10 menit
const MAKS_TAMPIL = 3000

/* sesi pengisian aktif (per user): Map<userKey, {jid, idx, form, jawaban[], since}> */
/* Sesi pengisian disimpan di globalThis, BUKAN di variabel modul.
 * lib/plugins.js memuat plugin dengan import('file://...?v='+Date.now()) sehingga
 * salinan modul plugin BERBEDA dari salinan yang di-import statis oleh
 * handlers/message.js. Map di level modul akan jadi dua buah dan sesi tidak
 * pernah ketemu. globalThis menjamin satu sumber kebenaran. */
const GSESI = '__THERYHANN_CRM_SESI__'
if (!globalThis[GSESI] || typeof globalThis[GSESI].get !== 'function') globalThis[GSESI] = new Map()
const sesiIsi = globalThis[GSESI]

/* ================================================================== */
/*  util database                                                      */
/* ================================================================== */
function db () {
  const d = loadDB('crm', { chat: {} })
  if (!d.chat) d.chat = {}
  return d
}
function chatRec (jid) {
  const d = db()
  if (!d.chat[jid]) d.chat[jid] = { jid, aktif: false, form: [], data: [], dibuat: Date.now() }
  const r = d.chat[jid]
  if (!Array.isArray(r.form)) r.form = []
  if (!Array.isArray(r.data)) r.data = []
  return r
}
function simpan () { saveNow('crm') }

/** bersihkan sesi kedaluwarsa */
function sapuSesi () {
  const kini = Date.now()
  for (const [k, s] of sesiIsi) if (kini - s.since > TTL_SESI) sesiIsi.delete(k)
}

/** ringkas satu entri data jadi satu baris */
export function barisData (entri, form) {
  const waktu = new Date(entri.waktu).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  const oleh = String(entri.oleh || '').split('@')[0]
  const isi = (form.length ? form : entri.form || [])
    .map((f, i) => `${f}: ${truncate(String(entri.jawaban?.[i] ?? '-'), 40)}`)
    .join(' · ')
  return `#${entri.no} · ${waktu} · @${oleh}\n   ${isi}`
}

/** ubah data jadi CSV (untuk ekspor) */
export function keCsv (form, data) {
  const esc = v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const kepala = ['no', 'waktu', 'pengirim', ...form]
  const baris = data.map(d => [
    d.no,
    new Date(d.waktu).toISOString(),
    String(d.oleh || '').split('@')[0],
    ...(form.map((_, i) => d.jawaban?.[i] ?? ''))
  ])
  return [kepala, ...baris].map(r => r.map(esc).join(',')).join('\n')
}

/* ================================================================== */
/*  checkCrm — dipanggil handlers/message.js sebelum routing           */
/* ================================================================== */
/**
 * Tangkap balasan user yang sedang mengisi form CRM.
 * Mengembalikan { handled: true } bila pesan sudah dipakai sebagai jawaban.
 */
export async function checkCrm (m) {
  try {
    sapuSesi()
    const key = m.senderKey || m.sender
    const s = sesiIsi.get(key)
    if (!s) return null
    if (m.isCommand) return null              // perintah tetap jalan normal
    const teks = String(m.text || '').trim()
    if (!teks && !(m.quoted?.isMedia || m.isMedia)) return null

    /* batal */
    if (/^(batal|cancel|stop)$/i.test(teks)) {
      sesiIsi.delete(key)
      await m.reply(`❌ Pengisian data dibatalkan.`).catch(() => {})
      return { handled: true }
    }

    /* ambil jawaban: teks, atau dokumen/media yang dibalas */
    let jawab = teks
    if (!jawab && (m.quoted?.isMedia || m.isMedia)) {
      try {
        const h = await m.download()
        const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
        if (buf) jawab = '[lampiran] ' + truncate(buf.toString('utf8'), 300)
      } catch { jawab = '[lampiran tidak bisa dibaca]' }
    }
    jawab = truncate(String(jawab), MAKS_JAWAB)

    s.jawaban.push(jawab)
    s.since = Date.now()
    const idx = s.jawaban.length
    const form = s.form

    if (idx < form.length) {
      await m.reply(
        `🗂️ *${form[idx]}*  (${idx + 1}/${form.length})\n\n` +
        `Kirim jawabannya. Ketik \`batal\` untuk berhenti.`
      ).catch(() => {})
      return { handled: true }
    }

    /* selesai -> simpan */
    const rec = chatRec(s.jid)
    const no = (rec.data.length ? Math.max(...rec.data.map(d => d.no || 0)) : 0) + 1
    rec.data.push({
      no,
      waktu: Date.now(),
      oleh: key,
      nama: m.pushName || '',
      form: form.slice(),
      jawaban: s.jawaban.slice()
    })
    /* batasi jumlah data tersimpan */
    if (rec.data.length > MAKS_DATA) rec.data = rec.data.slice(-MAKS_DATA)
    simpan()
    sesiIsi.delete(key)

    const ringkas = form.map((f, i) => `▸ *${f}:* ${truncate(String(s.jawaban[i] ?? '-'), 80)}`).join('\n')
    await m.reply(
      `✅ *DATA TERKIRIM — #${no}*\n\n${ringkas}\n\n` +
      `Terima kasih! Data sudah diterima.\n` +
      `Isi lagi kapan saja: \`${P}crm\``
    ).catch(() => {})

    /* kabari owner (kalau pengisi bukan owner) */
    if (!m.isOwner) {
      try {
        const ownerJid = (config.owner?.number || '') + '@s.whatsapp.net'
        if (config.owner?.number && m.sock?.sendMessage) {
          await m.sock.sendMessage(ownerJid, {
            text: `🗂️ *DATA CRM BARU — #${no}*\n\nDari: @${key.split('@')[0]}\n${ringkas}\n\nLihat semua: \`${P}crm data\``
          }).catch(() => {})
        }
      } catch {}
    }
    return { handled: true }
  } catch { return null }
}

/* ================================================================== */
/*  plugin .crm                                                        */
/* ================================================================== */
export const crmCmd = {
  command: ['crm', 'formdata', 'kumpuldata', 'ambidata', 'datapelanggan'],
  category: 'Owner Menu',
  description: '🗂️ Kumpulkan data dari user lewat form bertahap — `.crm buat Nama|Umur|Alamat`',
  owner: false,          // user boleh mengisi; perintah owner dijaga di dalam run
  limit: 0,
  cooldown: 2,
  contoh: 'buat Nama|Umur|Alamat',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const rec = chatRec(m.jid)
    const sub = q.split(/\s+/)[0]?.toLowerCase() || ''
    const sisa = q.slice(sub.length).trim()

    /* ============ PERINTAH OWNER ============ */
    if (m.isOwner) {
      /* ---- buat form ---- */
      if (/^(buat|create|setform|form|atur)$/i.test(sub)) {
        if (!sisa) {
          return m.reply(
            `🗂️ *BUAT FORM CRM*\n\n` +
            `Pisahkan tiap kolom dengan \`|\` (maks ${MAKS_FIELD}):\n` +
            `\`${P}crm buat Nama|Umur|Alamat|Catatan\`\n\n` +
            `Contoh siap pakai:\n` +
            `\`${P}crm buat Nama|No HP|Alamat|Pesanan\`\n` +
            `\`${P}crm buat Nama|Keluhan|Saran\`\n` +
            `\`${P}crm buat Nama|Asal Sekolah|Jurusan\``
          )
        }
        const field = sisa.split('|').map(s => truncate(s.trim(), 40)).filter(Boolean).slice(0, MAKS_FIELD)
        if (field.length < 1) return m.reply(`❌ Sebutkan minimal 1 kolom. Contoh: \`${P}crm buat Nama|Umur\``)
        rec.form = field
        rec.aktif = true
        simpan()
        await m.react?.('🗂️').catch(() => {})
        return m.sendButtons({
          title: '✅ Form CRM dibuat',
          text:
            `🗂️ *FORM CRM SIAP*\n\n` +
            `*Kolom (${field.length}):*\n${field.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n` +
            `Status: *AKTIF* — setiap user yang mengetik \`${P}crm\` di chat ini akan dipandu mengisi.\n\n` +
            `Data masuk: \`${P}crm data\` · Ekspor: \`${P}crm ekspor\``,
          footer: config.bot.footer,
          buttons: [
            { text: '🧪 Coba isi', id: `${P}crm` },
            { text: '📋 Lihat data', id: `${P}crm data` },
            { text: '⏸️ Nonaktifkan', id: `${P}crm mati` }
          ]
        }).catch(() => m.reply(`✅ Form dibuat: ${field.join(' | ')}`))
      }

      /* ---- aktif / mati ---- */
      if (/^(aktif|on|nyala)$/i.test(sub)) {
        if (!rec.form.length) return m.reply(`❌ Belum ada form. Buat dulu: \`${P}crm buat Nama|Umur\``)
        rec.aktif = true; simpan()
        return m.reply(`✅ CRM *AKTIF* di chat ini.\nKolom: ${rec.form.join(' | ')}\n\nUser mengisi lewat: \`${P}crm\``)
      }
      if (/^(mati|off|nonaktif|pause)$/i.test(sub)) {
        rec.aktif = false; simpan()
        return m.reply(`⏸️ CRM *NONAKTIF* di chat ini. Form tetap tersimpan.\nAktifkan lagi: \`${P}crm aktif\``)
      }

      /* ---- data ---- */
      if (/^(data|list|lihat|semua)$/i.test(sub)) {
        if (!rec.data.length) {
          return m.reply(
            `📋 *Belum ada data.*\n\n` +
            (rec.form.length
              ? `Form aktif: ${rec.form.join(' | ')}\nStatus: ${rec.aktif ? 'AKTIF' : 'nonaktif'}\n\nUser mengisi lewat \`${P}crm\`.`
              : `Buat form dulu: \`${P}crm buat Nama|Umur\``)
          )
        }
        const n = parseInt(sisa, 10)
        const tampil = Number.isFinite(n) && n > 0 ? rec.data.slice(-n) : rec.data.slice(-8)
        const teks =
          `📋 *DATA CRM* — ${rec.data.length} entri${n ? ` (menampilkan ${tampil.length} terakhir)` : ' (8 terakhir)'}\n\n` +
          tampil.map(d => barisData(d, rec.form)).join('\n\n') +
          (rec.data.length > tampil.length ? `\n\n… ${rec.data.length - tampil.length} entri lagi` : '') +
          `\n\nCari: \`${P}crm cari <teks>\` · Ekspor: \`${P}crm ekspor\``
        return m.reply(truncate(teks, MAKS_TAMPIL))
      }

      /* ---- cari ---- */
      if (/^(cari|search|filter)$/i.test(sub)) {
        if (!sisa) return m.reply(`❌ Sebutkan kata kunci: \`${P}crm cari budi\``)
        if (!rec.data.length) return m.reply(`📋 Belum ada data untuk dicari.`)
        const k = sisa.toLowerCase()
        const kena = rec.data.filter(d =>
          (d.jawaban || []).some(j => String(j).toLowerCase().includes(k)) ||
          String(d.nama || '').toLowerCase().includes(k)
        )
        if (!kena.length) return m.reply(`🔍 Tidak ada data yang cocok dengan *${truncate(sisa, 40)}* (dari ${rec.data.length} entri).`)
        return m.reply(truncate(
          `🔍 *HASIL CARI "${truncate(sisa, 30)}"* — ${kena.length} dari ${rec.data.length}\n\n` +
          kena.slice(0, 12).map(d => barisData(d, rec.form)).join('\n\n') +
          (kena.length > 12 ? `\n\n… ${kena.length - 12} lagi` : ''), MAKS_TAMPIL))
      }

      /* ---- hapus satu ---- */
      if (/^(hapus|del|delete)$/i.test(sub)) {
        const no = parseInt(sisa, 10)
        if (!Number.isFinite(no)) return m.reply(`❌ Sebutkan nomor data: \`${P}crm hapus 3\``)
        const i = rec.data.findIndex(d => d.no === no)
        if (i < 0) return m.reply(`❌ Data #${no} tidak ditemukan.`)
        rec.data.splice(i, 1); simpan()
        return m.reply(`🗑️ Data *#${no}* dihapus. Sisa ${rec.data.length} entri.`)
      }

      /* ---- kosongkan ---- */
      if (/^(kosongkan|clear|reset|hapussemua)$/i.test(sub)) {
        if (!/^ya$|^yakin$|^confirm$/i.test(sisa)) {
          if (!rec.data.length) return m.reply(`📋 Data memang sudah kosong.`)
          return m.sendButtons({
            title: '⚠️ Hapus semua data CRM?',
            text: `⚠️ *${rec.data.length} data* akan dihapus permanen di chat ini.\n\nForm tidak dihapus.\n\nTekan *HAPUS SEMUA* untuk konfirmasi.`,
            footer: config.bot.footer,
            buttons: [
              { text: '🗑️ HAPUS SEMUA', id: `${P}crm kosongkan ya` },
              { text: '↩️ Batalkan', id: `${P}crm` }
            ]
          }).catch(() => m.reply(`Ketik \`${P}crm kosongkan ya\` untuk konfirmasi.`))
        }
        const n = rec.data.length
        rec.data = []; simpan()
        return m.reply(`🗑️ *${n} data* dihapus. Form tetap tersimpan.`)
      }

      /* ---- ekspor ---- */
      if (/^(ekspor|export|unduh|csv|json)$/i.test(sub)) {
        if (!rec.data.length) return m.reply(`📋 Belum ada data untuk diekspor.`)
        const pakaiCsv = /csv/i.test(sisa)
        const isi = pakaiCsv ? keCsv(rec.form, rec.data) : JSON.stringify({ form: rec.form, total: rec.data.length, data: rec.data }, null, 2)
        const nama = `crm-${new Date().toISOString().slice(0, 10)}.${pakaiCsv ? 'csv' : 'json'}`
        return m.sock.sendMessage(m.jid, {
          document: Buffer.from(isi, 'utf8'),
          mimetype: pakaiCsv ? 'text/csv' : 'application/json',
          fileName: nama,
          caption: `🗂️ *EKSPOR CRM* — ${rec.data.length} data · ${rec.form.length} kolom`
        }).catch(() => m.reply('❌ Gagal mengirim file.'))
      }

      /* ---- dashboard owner (tanpa sub) ---- */
      if (!sub) {
        const total = Object.values(db().chat).reduce((a, c) => a + (c.data?.length || 0), 0)
        const chatAktif = Object.values(db().chat).filter(c => c.aktif).length
        const terakhir = rec.data.length ? new Date(rec.data[rec.data.length - 1].waktu).toLocaleString('id-ID') : 'belum ada'
        return m.sendButtons({
          title: '🗂️ CRM — Dashboard',
          text:
            `🗂️ *CRM — DATA DARI USER*\n\n` +
            `*Chat ini:*\n` +
            `▸ Status: ${rec.aktif ? '✅ AKTIF' : '⏸️ nonaktif'}\n` +
            `▸ Kolom: ${rec.form.length ? rec.form.join(' | ') : '(belum dibuat)'}\n` +
            `▸ Data: *${rec.data.length}* entri\n` +
            `▸ Terakhir masuk: ${terakhir}\n\n` +
            `*Semua chat:* ${total} data di ${chatAktif} chat aktif\n\n` +
            `Cara pakai:\n` +
            `• \`${P}crm buat Nama|Umur|Alamat\`\n` +
            `• \`${P}crm aktif\` / \`${P}crm mati\`\n` +
            `• \`${P}crm data\` · \`${P}crm cari <teks>\`\n` +
            `• \`${P}crm ekspor\` (json) · \`${P}crm ekspor csv\``,
          footer: config.bot.footer,
          buttons: [
            { text: '📋 Lihat data', id: `${P}crm data` },
            { text: '🧪 Coba isi form', id: `${P}crm isi` },
            { text: '📤 Ekspor', id: `${P}crm ekspor` },
            ...(rec.form.length ? [{ text: rec.aktif ? '⏸️ Nonaktifkan' : '▶️ Aktifkan', id: `${P}crm ${rec.aktif ? 'mati' : 'aktif'}` }] : [])
          ]
        }).catch(() => m.reply(`🗂️ CRM: ${rec.data.length} data, form ${rec.form.join('|') || '-'}`))
      }
    }

    /* ============ JAGA PERINTAH OWNER ============
       Tanpa ini, user yang mengetik `.crm hapus 1` atau `.crm kosongkan ya`
       akan jatuh ke alur "isi form" dan diam-diam memulai sesi pengisian
       — membingungkan, dan seolah perintahnya diterima. */
    const PERINTAH_OWNER = /^(buat|create|setform|form|atur|aktif|on|nyala|mati|off|nonaktif|pause|data|list|lihat|semua|cari|search|filter|hapus|del|kosongkan|clear|reset|ekspor|export|csv|json)$/i
    if (!m.isOwner && sub && PERINTAH_OWNER.test(sub) && !/^(isi|mulai|kirim|daftar)$/i.test(sub)) {
      await m.react?.('🔒').catch(() => {})
      return m.reply(
        `🔒 *${sub}* adalah perintah *khusus Owner*.\n\n` +
        `Kamu cukup ketik \`${P}crm\` untuk mengisi data.`
      )
    }

    /* ============ ISI FORM (owner & user) ============ */
    if (/^(isi|mulai|kirim|daftar)$/i.test(sub) || !sub || !m.isOwner) {
      if (!rec.form.length) {
        return m.reply(
          m.isOwner
            ? `❌ Belum ada form di chat ini.\nBuat dulu: \`${P}crm buat Nama|Umur|Alamat\``
            : `ℹ️ Belum ada form data di chat ini.`
        )
      }
      if (!rec.aktif && !m.isOwner) {
        return m.reply(`⏸️ Pengisian data sedang *ditutup*. Coba lagi nanti ya.`)
      }

      const key = m.senderKey || m.sender
      sesiIsi.set(key, { jid: m.jid, form: rec.form.slice(), jawaban: [], since: Date.now() })
      await m.react?.('🗂️').catch(() => {})
      return m.reply(
        `🗂️ *ISI DATA* — ${rec.form.length} pertanyaan\n\n` +
        `Jawab satu per satu. Ketik \`batal\` untuk berhenti.\n\n` +
        `**1. ${rec.form[0]}**`
      )
    }

    return m.reply(
      `🗂️ *CRM*\n\n` +
      `Owner: \`${P}crm buat Nama|Umur\` · \`${P}crm data\` · \`${P}crm cari <teks>\` · \`${P}crm ekspor\`\n` +
      `User: \`${P}crm\` untuk mengisi data.`
    )
  }
}

export default { crmCmd }
