/**
 * 📄 .cateof + 🪄 .autocat — tulis file gaya `cat <<EOF` dari WhatsApp  v7.37.0
 * ------------------------------------------------------------------
 *  • .cateof <nama file> <<EOF … EOF     tulis file persis gaya heredoc Termux
 *  • .cateof <nama file>                 isi dari pesan/dokumen yang dibalas
 *  • .autocat <nama file>                AI menuliskan isinya otomatis
 *  • .autocat <nama file> | <permintaan> AI menulis sesuai permintaan
 *
 *  Kenapa heredoc perlu di WhatsApp: di Termux `cat <<EOF` dipakai untuk
 *  menulis file multi-baris sekali tempel. Di chat, `m.q` dipertahankan
 *  apa adanya oleh serializer (lib/serializer.js:187), jadi baris baru
 *  tetap utuh — asal argumen dibaca dari `m.q`, BUKAN `m.args` (yang
 *  memecah per spasi dan merusak indentasi kode).
 *
 *  Keamanan (mengikuti .>_ / addplugin):
 *   - nama file disanitasi (namaFileAman) → tidak ada `../`
 *   - NAMA_TERLARANG ditolak mutlak (config.js, index.js, …)
 *   - FILE_DILINDUNGI butuh --paksa
 *   - khusus .js: cek sintaks `node --check` sebelum disimpan; gagal =
 *     tidak ditulis sama sekali
 *   - batas ukuran, dan .js otomatis di-reload sebagai plugin
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { truncate, formatSize } from '../lib/functions.js'
import { loadDB, saveNow } from '../lib/database.js'
import { reloadPlugin } from '../lib/plugins.js'
import { cekSintaks, NAMA_TERLARANG, DIR_CADANGAN } from './devmenu.js'
import { mintaAIBesar } from './buatfitur.js'

const P = config.display.prefix
const DIR_FITUR = path.dirname(fileURLToPath(import.meta.url))
const DIR_ROOT = path.dirname(DIR_FITUR)
const MAKS_ISI = 400 * 1024
const MAKS_BARIS = 4000

/** file bawaan yang tidak boleh ditimpa tanpa --paksa (samakan dengan .>_) */
const FILE_DILINDUNGI = new Set([
  'menu.js', 'owner.js', 'mainlab.js', 'group.js', 'gamerespon.js', 'arcade.js',
  'pastellab.js', 'casinolab.js', 'jadullab.js', 'welcome.js', 'user.js'
])

/** ekstensi yang dikenali (di luar .js tetap boleh, mis. .json .sh .md .txt) */
const EXT_BOLEH = /\.(js|mjs|cjs|json|txt|md|sh|py|html|css|yml|yaml|env|log)$/i

/**
 * Urai argumen gaya heredoc.
 * Bentuk yang diterima:
 *   .cateof nama.js <<EOF
 *   isi
 *   EOF
 * juga: <<-EOF, <<<EOF, <<'EOF', <<"EOF", <<BATAS … BATAS
 * @returns {{nama:string, isi:string, adaHeredoc:boolean, flagPaksa:boolean, sisa:string}}
 */
export function uraiHeredoc (q) {
  const mentah = String(q ?? '')
  const baris = mentah.split('\n')
  const kepala = String(baris[0] || '').trim()
  const flagPaksa = /(^|\s)(--paksa|--force|-f)(\s|$)/i.test(kepala)
  const kepalaBersih = kepala.replace(/(^|\s)(--paksa|--force|-f)(\s|$)/gi, ' ').trim()

  /* cari pembuka heredoc pada baris pertama:
     <<EOF / <<-EOF / <<<EOF / <<<'EOF' / <<BATAS
     Perlu menelan SEMUA '<' beruntun, kalau tidak sisa '<' menempel di nama
     file (mis. "halo.js <" untuk <<<EOF). */
  const m = kepalaBersih.match(/<<[-<]*\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*$/)
  if (!m) {
    const nama = kepalaBersih.replace(/<<.*$/, '').trim()
    return { nama, isi: '', adaHeredoc: false, flagPaksa, sisa: baris.slice(1).join('\n') }
  }

  const penanda = m[1]
  /* nama = semua sebelum tanda '<<' pertama, lalu buang '<' yang tersisa */
  const nama = kepalaBersih.slice(0, m.index).replace(/<+\s*$/, '').trim()
  const rePenutup = new RegExp('^\\s*' + penanda + '\\s*$')
  const isiBaris = []
  let ketemu = false
  for (let i = 1; i < baris.length; i++) {
    if (rePenutup.test(baris[i])) { ketemu = true; break }
    isiBaris.push(baris[i])
  }
  /* kalau penutup tidak ada (user lupa), pakai semua sisa baris apa adanya */
  return {
    nama,
    isi: (ketemu ? isiBaris : baris.slice(1)).join('\n'),
    adaHeredoc: true,
    penutupKetemu: ketemu,
    flagPaksa,
    sisa: ''
  }
}

/** ambil isi dari pesan/dokumen yang dibalas (bila tidak pakai heredoc) */
async function isiDariBalasan (m) {
  if (m.quoted?.isMedia || m.isMedia) {
    try {
      const h = await m.download()
      const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
      if (buf) return { isi: buf.toString('utf8'), sumber: `dokumen (${formatSize(buf.length)})` }
    } catch (e) {
      return { isi: '', sumber: '', galat: 'Gagal mengunduh dokumen: ' + (e?.message || e) }
    }
  }
  const qt = String(m.quoted?.text || '').trim()
  if (qt) return { isi: qt, sumber: 'pesan teks yang dibalas' }
  return { isi: '', sumber: '' }
}

/**
 * Sanitasi nama file TANPA memaksa akhiran .js.
 * (namaFileAman() dari devmenu selalu menambah .js — cocok untuk plugin,
 *  tapi merusak `catatan.json` menjadi `catatanjson.js`.)
 */
export function namaBerkasAman (input = '') {
  let n = String(input || '').trim().toLowerCase()
  n = n.replace(/^\.+\//, '')
  n = path.basename(n)                       // buang path apa pun (../ dsb.)
  if (!n || n === '.' || n === '..') return null
  if (!EXT_BOLEH.test(n)) return null
  const titik = n.lastIndexOf('.')
  const ext = n.slice(titik)
  const dasar = n.slice(0, titik).replace(/[^a-z0-9_-]/g, '')
  if (!dasar) return null
  /* nama modul JS tidak boleh mulai dengan angka/-/_ */
  const aman = /^[-_0-9]/.test(dasar) ? 'dev' + dasar : dasar
  return (aman.length > 40 ? aman.slice(0, 40) : aman) + ext
}

/** tentukan folder tujuan: .js → features/, selain itu → root (tmp/ untuk sementara) */
function lokasiTujuan (namaFile) {
  if (/\.js$|\.mjs$|\.cjs$/i.test(namaFile)) return { dir: DIR_FITUR, label: 'features/' }
  if (/\.(json|txt|md|log)$/i.test(namaFile)) return { dir: DIR_ROOT, label: '' }
  return { dir: path.join(DIR_ROOT, 'tmp'), label: 'tmp/' }
}

/** tulis dengan cadangan + verifikasi */
function tulisAman (target, isi) {
  const sudahAda = fs.existsSync(target)
  const lama = sudahAda ? fs.readFileSync(target, 'utf8') : null
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, isi)
  /* verifikasi benar-benar tertulis */
  const tertulis = fs.readFileSync(target, 'utf8')
  if (tertulis !== isi) {
    if (lama !== null) fs.writeFileSync(target, lama)
    throw new Error('verifikasi gagal: isi tidak cocok setelah ditulis')
  }
  return { sudahAda, lama }
}

/** simpan cadangan ke tmp/devbackup agar bisa dipulihkan */
function cadangkan (namaFile, isi) {
  try {
    fs.mkdirSync(DIR_CADANGAN, { recursive: true })
    const cap = path.join(DIR_CADANGAN, namaFile + '.' + Date.now() + '.bak')
    fs.writeFileSync(cap, isi)
    return path.basename(cap)
  } catch { return '' }
}

const ATURAN_AI = `Kamu menulis isi file untuk bot WhatsApp (Node.js ESM).
ATURAN WAJIB bila file berakhiran .js:
1. Wajib ada "export default { command: [...], category, description, run }".
2. run boleh "m => {...}" atau "async m => {...}". Balasan pakai m.reply / m.sendButtons.
3. Import hanya dari '../config.js', '../lib/functions.js', '../lib/database.js', '../lib/plugins.js'.
4. JANGAN pakai backtick untuk template literal — pakai penggabungan string dengan kutip tunggal.
5. JANGAN pakai require(...). Jangan menambah dependensi npm baru.
6. Jangan memakai position:fixed, 100vh, aspect-ratio, atau URL CDN.
7. Sertakan komentar singkat berbahasa Indonesia di atas.
Untuk file non-.js (json/sh/md/txt): tulis isi yang benar dan siap pakai.

FORMAT BALASAN (patuhi persis):
CATATAN: <satu baris ringkasan>
\`\`\`
<ISI FILE, tanpa pembuka "export default" tambahan di luar blok>
\`\`\``

/** ambil blok kode dari balasan AI (bahasa apa pun) */
export function ambilBlokAI (teks) {
  const t = String(teks || '')
  const m = t.match(/```[A-Za-z0-9_+-]*\s*\n([\s\S]*?)```/)
  if (!m) return { galat: 'AI tidak mengembalikan blok kode.' }
  const catatan = (t.match(/^CATATAN:\s*(.+)$/m) || [])[1]?.trim() || ''
  return { isi: m[1].replace(/\n$/, ''), catatan }
}

/* ================================================================== */
/*  .cateof                                                            */
/* ================================================================== */
export const catEof = {
  command: ['cateof', 'catheredoc', 'heredoc', 'tulisfile', 'buatfile', 'cateoffile'],
  category: 'Owner Menu',
  description: '📄 Tulis file gaya `cat <<EOF` dari chat — `.cateof halo.js <<EOF … EOF`',
  owner: true,
  limit: 0,
  cooldown: 3,
  contoh: 'halo.js <<EOF',
  run: async m => {
    const q = String(m.q ?? (m.args || []).join(' ') ?? '')
    const u = uraiHeredoc(q)

    if (!u.nama && !u.isi) {
      const teks =
        `📄 *CATEOF — TULIS FILE GAYA \`cat <<EOF\`*\\n\\n` +
        `Sama seperti di Termux, tapi dari WhatsApp.\\n\\n` +
        `*Cara 1 — heredoc:*\\n` +
        `\`\`\`${P}cateof halo.js <<EOF\\nconsole.log('hai')\\nEOF\`\`\`\\n\\n` +
        `*Cara 2 — balas pesan/dokumen:*\\n` +
        `Balas pesan berisi kode, lalu ketik \`${P}cateof halo.js\`\\n\\n` +
        `*Penanda bebas:* \`<<EOF\` \`<<-EOF\` \`<<<EOF\` \`<<'EOF'\` \`<<BATAS … BATAS\`\\n\\n` +
        `*Aturan:*\\n` +
        `• \`.js\` disimpan ke \`features/\` lalu otomatis dimuat sebagai plugin\\n` +
        `• selain \`.js\` disimpan ke folder bot (\`tmp/\` untuk sementara)\\n` +
        `• file \`.js\` dicek sintaksnya dulu — gagal = tidak ditulis\\n` +
        `• \`${P}cateof <file> --paksa\` untuk menimpa file bawaan yang dilindungi\\n\\n` +
        `⚠️ Jangan pakai \`m.args\` untuk kode multi-baris — perintah ini membaca \`m.q\` supaya baris baru tetap utuh.`
      return m.sendButtons({
        title: '📄 CATEOF',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          { text: '🪄 Coba .autocat', id: `${P}autocat` },
          { text: '🧩 Lihat .>_', id: `${P}devmenu` },
          { text: '📂 Plugin dev', id: `${P}plugindev` }
        ]
      }).catch(() => m.reply(teks))
    }

    /* ---- sanitasi nama ---- */
    if (/[\\/]/.test(u.nama) || /\.\./.test(u.nama)) {
      return m.reply(`❌ Nama file tidak boleh mengandung garis miring atau \`..\`: \`${truncate(u.nama, 60)}\``)
    }
    const namaFile = namaBerkasAman(u.nama)
    if (!namaFile) return m.reply(`❌ Nama file tidak sah: \`${truncate(u.nama, 60)}\`\\nContoh: \`${P}cateof halo.js <<EOF\``)
    if (!EXT_BOLEH.test(namaFile)) {
      return m.reply(`❌ Ekstensi \`${namaFile}\` tidak dikenali.\\nBoleh: .js .mjs .cjs .json .txt .md .sh .py .html .css .yml .yaml .env .log`)
    }
    if (NAMA_TERLARANG.has(namaFile)) {
      return m.reply(`🚫 *${namaFile}* adalah file inti bot — tidak boleh ditulis lewat perintah ini.`)
    }

    /* ---- ambil isi ---- */
    let isi = u.isi
    let sumber = u.adaHeredoc ? 'heredoc di perintah' : ''
    if (!isi.trim()) {
      const dariBalasan = await isiDariBalasan(m)
      if (dariBalasan.galat) return m.reply(`❌ ${dariBalasan.galat}`)
      isi = dariBalasan.isi
      sumber = dariBalasan.sumber
    }
    if (!isi.trim()) {
      return m.reply(
        `❌ Belum ada isinya.\\n\\n` +
        `Contoh:\\n\`\`\`${P}cateof ${namaFile} <<EOF\\nconsole.log('hai')\\nEOF\`\`\`\\n\\n` +
        `Atau balas pesan berisi kode lalu ketik \`${P}cateof ${namaFile}\``
      )
    }
    if (u.adaHeredoc && u.penutupKetemu === false) {
      sumber += ' (penanda EOF tidak ditemukan — semua baris sisa dipakai)'
    }

    /* ---- batas ---- */
    const byte = Buffer.byteLength(isi)
    if (byte > MAKS_ISI) return m.reply(`❌ Isi terlalu besar: ${formatSize(byte)} (maks ${formatSize(MAKS_ISI)}).`)
    const jumlahBaris = isi.split('\n').length
    if (jumlahBaris > MAKS_BARIS) return m.reply(`❌ Terlalu banyak baris: ${jumlahBaris} (maks ${MAKS_BARIS}).`)

    const { dir, label } = lokasiTujuan(namaFile)
    const target = path.join(dir, namaFile)
    const dilindungi = label === 'features/' && FILE_DILINDUNGI.has(namaFile)
    const sudahAda = fs.existsSync(target)

    if (dilindungi && !u.flagPaksa) {
      return m.reply(
        `🛡️ *${namaFile}* adalah file bawaan yang dilindungi.\\n\\n` +
        `Kalau yakin, ulangi dengan \`--paksa\`:\\n\`${P}cateof ${namaFile} --paksa <<EOF\`\\n\\n` +
        `Sangat disarankan mencadangkan dulu: \`${P}getcode ${namaFile.replace(/\.js$/, '')}\``
      )
    }

    /* ---- .js: cek sintaks SEBELUM ditulis ---- */
    const isJS = /\.(js|mjs|cjs)$/i.test(namaFile)
    if (isJS) {
      const tmpCek = path.join(DIR_ROOT, 'tmp', `cek-${Date.now()}.mjs`)
      try {
        fs.mkdirSync(path.dirname(tmpCek), { recursive: true })
        fs.writeFileSync(tmpCek, isi)
        const cek = cekSintaks(tmpCek)
        if (!cek.ok) {
          return m.reply(
            `❌ *SINTAKS SALAH — file tidak ditulis.*\\n\\n` +
            `\`\`\`${truncate(cek.pesan || cek.galat || 'sintaks salah', 600)}\`\`\`\\n\\n` +
            `Perbaiki lalu ulangi. File lama (kalau ada) tetap utuh.`
          )
        }
      } finally { try { fs.unlinkSync(tmpCek) } catch {} }
    }

    /* ---- tulis ---- */
    let lama = null
    try {
      const h = tulisAman(target, isi)
      lama = h.lama
    } catch (e) {
      return m.reply(`❌ Gagal menulis file: ${truncate(String(e?.message || e), 160)}`)
    }
    const namaCadangan = lama !== null ? cadangkan(namaFile, lama) : ''

    /* ---- .js: muat sebagai plugin, pulihkan bila ditolak ---- */
    let perintah = []
    if (isJS) {
      try {
        perintah = await reloadPlugin(namaFile)
      } catch (e) {
        if (lama !== null) fs.writeFileSync(target, lama)
        else try { fs.unlinkSync(target) } catch {}
        try { await reloadPlugin(namaFile) } catch {}
        return m.reply(
          `❌ *Plugin ditolak loader — file dikembalikan.*\\n\\n` +
          `\`\`\`${truncate(String(e?.message || e), 250)}\`\`\`\\n\\n` +
          `Periksa: sudah ada \`export default { command, run }\`?`
        )
      }
      try {
        const d = loadDB('devplugin', { file: {}, meta: { total: 0 } })
        d.file[namaFile] = { oleh: m.senderKey || m.sender, waktu: Date.now(), sumber: 'cateof', jumlahPerintah: perintah.length }
        saveNow('devplugin')
      } catch {}
    }

    await m.react?.('📄').catch(() => {})
    const ringkas =
      `📄 *FILE DITULIS — ${label}${namaFile}*\\n\\n` +
      `▸ Sumber: ${sumber || 'inline'}\\n` +
      `▸ Ukuran: ${formatSize(byte)} · ${jumlahBaris} baris\\n` +
      `▸ Status: ${sudahAda ? 'ditimpa (versi lama dicadangkan)' : 'baru dibuat'}\\n` +
      (namaCadangan ? `▸ Cadangan: \`tmp/devbackup/${namaCadangan}\`\\n` : '') +
      (isJS
        ? `▸ Perintah aktif: ${perintah.length ? perintah.map(c => `\`${P}${c}\``).join(' ') : '⚠️ tidak ada (periksa `command:`)'}\\n`
        : `▸ Lokasi: \`${label}${namaFile}\`\\n`) +
      `\\n*Isi:*\\n\`\`\`${truncate(isi, 1200)}\`\`\`${isi.length > 1200 ? '\\n…(dipotong)' : ''}`

    return m.sendButtons({
      title: `📄 ${namaFile}`,
      text: ringkas,
      footer: config.bot.footer,
      buttons: isJS
        ? [
            { text: perintah[0] ? `🎯 Coba ${P}${perintah[0]}` : '🔍 Cek plugin', id: perintah[0] ? `${P}${perintah[0]}` : `${P}cekplugin ${namaFile.replace(/\.js$/, '')}` },
            { text: '📦 Lihat kode', id: `${P}getcode ${namaFile.replace(/\.js$/, '')}` },
            { text: '🗑️ Hapus', id: `${P}hapusplugin ${namaFile.replace(/\.js$/, '')}` }
          ]
        : [
            { text: '🪄 Tulis otomatis', id: `${P}autocat ${namaFile}` },
            { text: '📄 Tulis lagi', id: `${P}cateof ${namaFile} <<EOF` },
            { text: '🛠️ Menu dev', id: `${P}devmenu` }
          ]
    }).catch(() => m.reply(ringkas))
  }
}

/* ================================================================== */
/*  .autocat                                                           */
/* ================================================================== */
export const autoCat = {
  command: ['autocat', 'catotomatis', 'buatfileotomatis', 'aifile', 'fileai', 'generatefile'],
  category: 'Owner Menu',
  description: '🪄 AI menulis isi file otomatis — `.autocat halo.js | sapa user tiap pagi`',
  owner: true,
  limit: 0,
  cooldown: 5,
  contoh: 'sapa.js | balas salam sesuai waktu',
  run: async m => {
    const q = String(m.q ?? (m.args || []).join(' ') ?? '').trim()
    if (!q) {
      const teks =
        `🪄 *AUTOCAT — AI MENULIS FILE OTOMATIS*\\n\\n` +
        `Seperti \`${P}cateof\`, tapi isinya dibuatkan AI.\\n\\n` +
        `Cara pakai:\\n` +
        `• \`${P}autocat <nama file> | <permintaan>\`\\n` +
        `• \`${P}autocat <nama file>\` — AI menebak dari nama file\\n\\n` +
        `Contoh:\\n` +
        `\`${P}autocat sapa.js | balas salam sesuai waktu (pagi/siang/malam)\`\\n` +
        `\`${P}autocat catatan.json | daftar 5 kata mutiara\`\\n\\n` +
        `🛡️ Hasil AI selalu dicek sintaksnya (untuk .js) sebelum disimpan.\\n` +
        `Tanpa \`--pasang\`, hasilnya hanya ditampilkan dulu.`
      return m.sendButtons({
        title: '🪄 AUTOCAT',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          { text: '📄 Pakai .cateof', id: `${P}cateof` },
          { text: '🎨 Contoh: sapa.js', id: `${P}autocat sapa.js | balas salam sesuai waktu` },
          { text: '🤖 .fixbutton', id: `${P}fixbutton` }
        ]
      }).catch(() => m.reply(teks))
    }

    const flagPaksa = /(^|\s)(--paksa|--force|-f)(\s|$)/i.test(q)
    const pasang = /(^|\s)--pasang(\s|$)/i.test(q)
    const bersih = q.replace(/(^|\s)(--paksa|--force|-f|--pasang)(\s|$)/gi, ' ').trim()
    const pisah = bersih.indexOf('|')
    const namaMentah = (pisah > 0 ? bersih.slice(0, pisah) : bersih).trim()
    const permintaan = (pisah > 0 ? bersih.slice(pisah + 1) : '').trim()

    const namaFile = namaBerkasAman(namaMentah)
    if (!namaFile) return m.reply(`❌ Nama file tidak sah: \`${truncate(namaMentah, 60)}\`\\nContoh: \`${P}autocat sapa.js | balas salam\``)
    if (!EXT_BOLEH.test(namaFile)) return m.reply(`❌ Ekstensi \`${namaFile}\` tidak dikenali.`)
    if (NAMA_TERLARANG.has(namaFile)) return m.reply(`🚫 *${namaFile}* adalah file inti bot — tidak boleh ditulis lewat perintah ini.`)

    await m.react?.('🪄').catch(() => {})
    await m.reply(
      `🪄 *AI sedang menulis* \`${namaFile}\` …\\n` +
      (permintaan ? `📝 Permintaan: ${truncate(permintaan, 120)}\\n` : '') +
      `_Ini bisa makan 10-30 detik._`
    ).catch(() => {})

    const prompt =
      `${ATURAN_AI}\\n\\n` +
      `NAMA FILE: ${namaFile}\\n` +
      `PERMINTAAN USER: ${permintaan || '(tidak ada — tebak dari nama file dan buat yang berguna)'}\\n\\n` +
      `Tulis ISI FILE ${namaFile} saja, lengkap dan siap dipakai.`

    let jawaban
    try {
      jawaban = await mintaAIBesar(prompt, [], 4096)
    } catch (e) {
      return m.reply(
        `❌ *AI gagal dipanggil.*\\n\\n\`\`\`${truncate(String(e?.message || e), 250)}\`\`\`\\n\\n` +
        `Cek API key AI di settings, atau tulis manual:\\n\`${P}cateof ${namaFile} <<EOF\``
      )
    }

    const hasil = ambilBlokAI(jawaban)
    if (hasil.galat) return m.reply(`❌ ${hasil.galat}\\n\\nJawaban AI:\\n\`\`\`${truncate(jawaban, 500)}\`\`\``)
    if (!hasil.isi.trim() || hasil.isi.length < 30) {
      return m.reply(`❌ Isi dari AI terlalu pendek (${hasil.isi.length} karakter) — dibuang.`)
    }
    if (Buffer.byteLength(hasil.isi) > MAKS_ISI) {
      return m.reply(`❌ Isi AI terlalu besar (${formatSize(Buffer.byteLength(hasil.isi))}) — dibuang.`)
    }

    const isJS = /\.(js|mjs|cjs)$/i.test(namaFile)
    if (isJS) {
      const tmpCek = path.join(DIR_ROOT, 'tmp', `cek-${Date.now()}.mjs`)
      try {
        fs.mkdirSync(path.dirname(tmpCek), { recursive: true })
        fs.writeFileSync(tmpCek, hasil.isi)
        const cek = cekSintaks(tmpCek)
        if (!cek.ok) {
          return m.reply(
            `❌ *Hasil AI gagal cek sintaks — TIDAK disimpan.*\\n\\n` +
            `\`\`\`${truncate(cek.pesan || 'sintaks salah', 500)}\`\`\`\\n\\n` +
            `Coba lagi dengan permintaan lebih jelas, atau tulis manual: \`${P}cateof ${namaFile} <<EOF\``
          )
        }
      } finally { try { fs.unlinkSync(tmpCek) } catch {} }
      if (!/command\s*:/.test(hasil.isi) || !/\brun\s*:/.test(hasil.isi)) {
        return m.reply(
          `⚠️ *Hasil AI ditolak*: tidak ada \`command:\` / \`run:\` — bukan plugin yang sah.\\n\\n` +
          `\`\`\`${truncate(hasil.isi, 600)}\`\`\``
        )
      }
    }

    const { dir, label } = lokasiTujuan(namaFile)
    const target = path.join(dir, namaFile)
    const ringkas =
      `🪄 *HASIL AI — ${label}${namaFile}*\\n\\n` +
      `✏️ ${hasil.catatan || 'isi dibuat otomatis oleh AI'}\\n` +
      `📏 ${hasil.isi.split('\n').length} baris · ${formatSize(Buffer.byteLength(hasil.isi))}\\n` +
      `✅ ${isJS ? 'Cek sintaks: LULUS' : 'Siap ditulis'}\\n\\n` +
      `\`\`\`${truncate(hasil.isi, 1800)}\`\`\`${hasil.isi.length > 1800 ? '\\n…(dipotong)' : ''}`

    if (!pasang) {
      return m.sendButtons({
        title: `🪄 Hasil AI — ${namaFile}`,
        text: ringkas + `\\n\\n☝️ *Belum disimpan.* Tekan SIMPAN untuk menulisnya.`,
        footer: config.bot.footer,
        buttons: [
          { text: '✅ SIMPAN sekarang', id: `${P}autocat ${namaFile}${permintaan ? ' | ' + truncate(permintaan, 40) : ''} --pasang${flagPaksa ? ' --paksa' : ''}` },
          { text: '🔁 Buat ulang', id: `${P}autocat ${namaFile}${permintaan ? ' | ' + truncate(permintaan, 40) : ''}` },
          { text: '📄 Tulis manual', id: `${P}cateof ${namaFile} <<EOF` }
        ]
      }).catch(() => m.reply(ringkas))
    }

    const dilindungi = label === 'features/' && FILE_DILINDUNGI.has(namaFile)
    if (dilindungi && !flagPaksa) {
      return m.reply(`🛡️ *${namaFile}* dilindungi. Ulangi dengan \`--paksa\` kalau yakin.`)
    }

    const sudahAda = fs.existsSync(target)
    const lama = sudahAda ? fs.readFileSync(target, 'utf8') : null
    try { tulisAman(target, hasil.isi) } catch (e) {
      return m.reply(`❌ Gagal menulis file: ${truncate(String(e?.message || e), 160)}`)
    }
    const namaCadangan = lama !== null ? cadangkan(namaFile, lama) : ''

    let perintah = []
    if (isJS) {
      try {
        perintah = await reloadPlugin(namaFile)
      } catch (e) {
        if (lama !== null) fs.writeFileSync(target, lama)
        else try { fs.unlinkSync(target) } catch {}
        try { await reloadPlugin(namaFile) } catch {}
        return m.reply(
          `❌ *Plugin ditolak loader — DIPULIHKAN otomatis.*\\n\\n\`\`\`${truncate(String(e?.message || e), 250)}\`\`\``
        )
      }
      try {
        const d = loadDB('devplugin', { file: {}, meta: { total: 0 } })
        d.file[namaFile] = { oleh: m.senderKey || m.sender, waktu: Date.now(), sumber: 'autocat', jumlahPerintah: perintah.length }
        saveNow('devplugin')
      } catch {}
    }

    const final =
      `✅ *TERSIMPAN — ${label}${namaFile}*\\n\\n` +
      `✏️ ${hasil.catatan || 'isi dibuat otomatis oleh AI'}\\n` +
      `📏 ${hasil.isi.split('\n').length} baris · ${formatSize(Buffer.byteLength(hasil.isi))}\\n` +
      `▸ Status: ${sudahAda ? 'ditimpa' : 'baru dibuat'}\\n` +
      (namaCadangan ? `▸ Cadangan: \`tmp/devbackup/${namaCadangan}\`\\n` : '') +
      (isJS ? `▸ Perintah aktif: ${perintah.length ? perintah.map(c => `\`${P}${c}\``).join(' ') : '⚠️ tidak ada'}\\n` : '')

    return m.sendButtons({
      title: `✅ ${namaFile} tersimpan`,
      text: final + `\\nCoba sekarang: \`${P}${perintah[0] || namaFile.replace(/\.\w+$/, '')}\``,
      footer: config.bot.footer,
      buttons: [
        { text: perintah[0] ? `🎯 Coba ${P}${perintah[0]}` : '🛠️ Menu dev', id: perintah[0] ? `${P}${perintah[0]}` : `${P}devmenu` },
        { text: '📦 Lihat kode', id: `${P}getcode ${namaFile.replace(/\.\w+$/, '')}` },
        { text: '🪄 Buat file lain', id: `${P}autocat` }
      ]
    }).catch(() => m.reply(final))
  }
}

export default { catEof, autoCat }
