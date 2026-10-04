/**
 * 🤖 .fixbutton — AI merapikan teks fitur jadi BUTTON LIST  v7.37.0
 * ------------------------------------------------------------------
 *  • .fixbutton <nama fitur>          → AI baca kode fitur, tulis ulang
 *                                       balasannya jadi m.sendButtons
 *  • .fixbutton <nama fitur> --pasang → langsung simpan ke features/
 *  • .fixbutton <nama fitur> --list   → hanya overlay .tobutton (tanpa AI)
 *
 *  Alur aman (tidak pernah merusak fitur yang sudah jalan):
 *    1. baca sumber fitur + potong blok plugin-nya
 *    2. kirim ke AI dengan aturan ketat (m.sendButtons, .catch, tanpa
 *       mengubah logika/intent fitur)
 *    3. CEK SINTAKS hasil AI dengan `node --check` — kalau gagal, hasil
 *       DIBUANG dan user diberi tahu (tidak pernah memasang kode rusak)
 *    4. bandingkan nama fungsi lama vs baru — kalau ada yang hilang,
 *       peringatkan sebelum dipasang
 *    5. hanya menyimpan bila user memakai --pasang (atau menekan tombol
 *       konfirmasi); tanpa itu hanya ditampilkan untuk diperiksa
 *
 *  Memakai ulang lib AI yang sudah ada di features/buatfitur.js
 *  (mintaAIBesar / cekSintaks / parseHasil / bandingFungsi).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { findPlugin, loadPlugins } from '../lib/plugins.js'
import { truncate } from '../lib/functions.js'
import { mintaAIBesar, cekSintaks, bandingFungsi } from './buatfitur.js'

const P = config.display.prefix
const DIR_FITUR = path.join(path.dirname(fileURLToPath(import.meta.url)))
const MAKS_KODE = 200 * 1024
const MAKS_SUMBER = 12000

const ATURAN = `Kamu merapikan plugin WhatsApp bot (Node.js ESM).
ATURAN WAJIB:
1. JANGAN mengubah logika, alur, atau hasil fitur. Hanya ubah CARA balasan ditampilkan.
2. Ganti setiap balasan teks polos menjadi m.sendButtons({...}) dengan:
   - title: emoji + nama fitur huruf besar
   - text: teks markdown WhatsApp (*tebal*, _miring_, \`mono\`, \\n)
   - footer: config.bot.footer
   - buttons: 2-4 tombol { text, id } yang relevan dengan fitur itu
3. WAJIB diakhiri .catch(() => m.reply(teks)) supaya client lama tetap dapat teks.
4. JANGAN menambah import baru selain yang sudah ada di file.
5. JANGAN menghapus fungsi, variabel, atau blok kode apa pun.
6. Pertahankan semua flag plugin (command, category, owner, limit, cooldown, contoh).
7. Kalau fitur butuh media/argumen, pertahankan pemeriksaan itu apa adanya.
8. Jangan memakai backtick untuk template literal — pakai penggabungan string + kutip tunggal.
9. Jangan pakai position:fixed, 100vh, aspect-ratio, atau URL CDN.

FORMAT BALASAN (patuhi persis):
JUDUL: <nama fitur>
CATATAN: <satu baris ringkasan perubahan>
\`\`\`js
<SELURUH ISI FILE yang sudah dirapikan>
\`\`\``

/** potong blok `export const X = …` dari sumber untuk dianalisis */
function potongBlok (sumber, nama) {
  const s = String(sumber || '')
  const re = new RegExp('export\\s+const\\s+' + String(nama).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=')
  const m = re.exec(s)
  if (!m) return ''
  const awal = m.index
  const buka = s.indexOf('{', m.index + m[0].length - 1)
  const akhirBaris = s.indexOf('\n', m.index + m[0].length)
  if (buka >= 0 && (akhirBaris < 0 || buka < akhirBaris)) {
    let dalam = 0
    for (let i = buka; i < s.length; i++) {
      if (s[i] === '{') dalam++
      else if (s[i] === '}') { dalam--; if (dalam === 0) return s.slice(awal, i + 1) }
    }
  }
  const berikutnya = s.indexOf('\nexport ', m.index + m[0].length)
  return s.slice(awal, berikutnya > 0 ? berikutnya : Math.min(s.length, awal + 4000)).trim()
}

/** ambil blok ```js ... ``` dari balasan AI */
export function ambilKodeAI (teks) {
  const t = String(teks || '')
  const m = t.match(/```(?:js|javascript)?\s*\n([\s\S]*?)```/)
  if (!m) return { galat: 'AI tidak mengembalikan blok kode.' }
  const kode = m[1].trim()
  const judul = (t.match(/^JUDUL:\s*(.+)$/m) || [])[1]?.trim() || ''
  const catatan = (t.match(/^CATATAN:\s*(.+)$/m) || [])[1]?.trim() || ''
  return { kode, judul, catatan }
}

export const fixButton = {
  command: ['fixbutton', 'perbaikibutton', 'aibutton', 'buttonai', 'rapikanbutton', 'fixfiturbutton'],
  category: 'Owner Menu',
  description: '🤖 AI merapikan teks fitur jadi button list — `.fixbutton toanime`',
  owner: true,
  limit: 0,
  cooldown: 5,
  contoh: 'toanime',
  run: async m => {
    const mentah = String(m.q || (m.args || []).join(' ') || '').trim()
    if (!mentah || /^(help|bantuan|cara|\?)$/i.test(mentah)) {
      const teks =
        `🤖 *FIXBUTTON — AI MERAPIKAN FITUR JADI BUTTON*\\n\\n` +
        `AI membaca kode fiturnya, lalu menulis ulang balasannya memakai \`m.sendButtons\` — logika fitur tidak diubah.\\n\\n` +
        `Cara pakai:\\n` +
        `• \`${P}fixbutton <nama fitur>\` → lihat hasil (belum disimpan)\\n` +
        `• \`${P}fixbutton <nama fitur> --pasang\` → simpan langsung\\n` +
        `• \`${P}fixbutton <nama fitur> --list\` → tanpa AI, pakai overlay tombol\\n\\n` +
        `Contoh: \`${P}fixbutton toanime\`\\n\\n` +
        `🛡️ Hasil AI selalu dicek sintaksnya dulu. Kalau gagal, tidak dipasang.\\n` +
        `💡 Kalau hanya ingin tombol balasan tanpa menyentuh kode: \`${P}tobutton\``
      return m.sendButtons({
        title: '🤖 FIXBUTTON',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          { text: '🎨 Contoh: toanime', id: `${P}fixbutton toanime` },
          { text: '🔘 Pakai .tobutton saja', id: `${P}tobutton` },
          { text: '🛠️ Studio editfitur', id: `${P}editfitur` }
        ]
      }).catch(() => m.reply(teks))
    }

    const args = mentah.split(/\s+/).filter(Boolean)
    const flag = new Set(args.filter(a => a.startsWith('--')).map(a => a.toLowerCase()))
    const nama = String(args.find(a => !a.startsWith('--')) || '').replace(/^\.+/, '').replace(/\.js$/i, '').toLowerCase()
    if (!nama) return m.reply(`❌ Sebutkan nama fiturnya.\\nContoh: \`${P}fixbutton toanime\``)

    const ketemu = findPlugin(nama)
    if (!ketemu?.plugin) return m.reply(`❌ Fitur *${nama}* tidak ditemukan.\\nCek nama: \`${P}carifitur ${nama}\``)

    const pl = ketemu.plugin
    const fileName = pl.fileName || (pl.name + '.js')
    const fileLengkap = pl.file || path.join(DIR_FITUR, fileName)
    if (!fs.existsSync(fileLengkap)) return m.reply(`❌ Berkas \`features/${fileName}\` tidak ditemukan.`)

    /* ---- mode tanpa AI: overlay tombol (.tobutton) ---- */
    if (flag.has('--list') || flag.has('--tobutton')) {
      return m.reply(
        `🔘 Mode tanpa AI.\\n\\n` +
        `Pakai: \`${P}tobutton ${pl.name}: pilih button dibawah ini | button 1: ${pl.name} | button 2: ${P}menu\`\\n\\n` +
        `Cara ini tidak menyentuh kode fiturnya sama sekali.`
      )
    }

    let sumber = ''
    try { sumber = fs.readFileSync(fileLengkap, 'utf8') } catch (e) {
      return m.reply(`❌ Gagal membaca berkas: ${truncate(String(e?.message || e), 120)}`)
    }
    if (!sumber.trim()) return m.reply(`❌ Berkas \`features/${fileName}\` kosong.`)

    const sudahTombol = /sendButtons|sendList|sendInteractive/.test(sumber)
    await m.react?.('🤖').catch(() => {})

    const blok = potongBlok(sumber, pl.name) || sumber.slice(0, MAKS_SUMBER)
    const prompt =
      `${ATURAN}\\n\\n` +
      `NAMA FILE: features/${fileName}\\n` +
      `NAMA PLUGIN: ${pl.name}\\n` +
      `ALIAS: ${(pl.command || []).join(', ')}\\n` +
      `KATEGORI: ${pl.category || 'Lainnya'}\\n` +
      `DESKRIPSI: ${pl.description || '-'}\\n\\n` +
      `BLOK PLUGIN SAAT INI:\\n\`\`\`js\\n${truncate(blok, MAKS_SUMBER)}\\n\`\`\`\\n\\n` +
      `Tulis ulang SELURUH ISI FILE features/${fileName} dengan balasan yang memakai m.sendButtons. ` +
      `Jangan hilangkan plugin lain yang ada di file yang sama.`

    const info =
      `🤖 *AI sedang merapikan* \`${pl.name}\` …\\n` +
      `📁 \`features/${fileName}\`\\n` +
      (sudahTombol ? `⚠️ Fitur ini *sudah* memakai tombol — AI akan merapikannya lagi.\\n` : '') +
      `_Ini bisa makan 10-30 detik._`
    await m.reply(info).catch(() => {})

    let jawaban
    try {
      jawaban = await mintaAIBesar(prompt, [], 4096)
    } catch (e) {
      return m.reply(
        `❌ *AI gagal dipanggil.*\\n\\n\`\`\`${truncate(String(e?.message || e), 250)}\`\`\`\\n\\n` +
        `Cek API key AI di settings, atau pakai cara tanpa AI:\\n\`${P}tobutton ${pl.name}: pilih button dibawah ini | button 1: ${pl.name}\``
      )
    }

    const hasil = ambilKodeAI(jawaban)
    if (hasil.galat) {
      return m.reply(`❌ ${hasil.galat}\\n\\nJawaban AI (dipotong):\\n\`\`\`${truncate(jawaban, 500)}\`\`\``)
    }
    if (!hasil.kode || hasil.kode.length < 80) {
      return m.reply(`❌ Kode dari AI terlalu pendek (${hasil.kode.length} karakter) — dibuang, tidak dipasang.`)
    }
    if (Buffer.byteLength(hasil.kode) > MAKS_KODE) {
      return m.reply(`❌ Kode AI terlalu besar (${(Buffer.byteLength(hasil.kode) / 1024).toFixed(0)} KB) — dibuang.`)
    }

    /* ---- GERBANG 1: cek sintaks. Gagal = tidak pernah dipasang ---- */
    const sintaks = cekSintaks(hasil.kode)
    if (!sintaks.ok) {
      return m.reply(
        `❌ *Hasil AI gagal cek sintaks — TIDAK dipasang.*\\n\\n` +
        `\`\`\`${truncate(sintaks.galat || sintaks.pesan || 'sintaks salah', 500)}\`\`\`\\n\\n` +
        `Fitur lama tetap utuh. Coba lagi atau pakai \`${P}tobutton ${pl.name}\`.`
      )
    }

    /* ---- GERBANG 2: fungsi yang hilang ---- */
    const hilang = bandingFungsi(sumber, hasil.kode)
    /* ---- GERBANG 3: plugin harus tetap ada ---- */
    const adaExport = /export\s+default|export\s+const/.test(hasil.kode)
    const adaCommand = /command\s*:/.test(hasil.kode)
    const adaRun = /\brun\s*:/.test(hasil.kode)
    const pakaiTombol = /sendButtons|sendList|sendInteractive/.test(hasil.kode)

    const masalah = []
    if (!adaExport) masalah.push('tidak ada `export default` / `export const`')
    if (!adaCommand) masalah.push('tidak ada `command:`')
    if (!adaRun) masalah.push('tidak ada `run:`')
    if (!pakaiTombol) masalah.push('AI tidak memakai m.sendButtons')
    if (hilang.length) masalah.push(`fungsi hilang: ${hilang.slice(0, 6).join(', ')}`)

    if (masalah.length) {
      return m.reply(
        `⚠️ *Hasil AI ditolak — fitur lama tetap utuh.*\\n\\n` +
        masalah.map(x => `• ${x}`).join('\\n') +
        `\\n\\nKode AI (dipotong):\\n\`\`\`${truncate(hasil.kode, 700)}\`\`\``
      )
    }

    const ringkas =
      `🤖 *HASIL AI — ${pl.name}*\\n\\n` +
      `📁 \`features/${fileName}\`\\n` +
      `✏️ ${hasil.catatan || 'balasan diubah jadi button list'}\\n` +
      `✅ Cek sintaks: LULUS\\n` +
      `📏 ${hasil.kode.split('\\n').length} baris · ${(Buffer.byteLength(hasil.kode) / 1024).toFixed(1)} KB\\n\\n` +
      `\`\`\`${truncate(hasil.kode, 1800)}\`\`\`` +
      (hasil.kode.length > 1800 ? '\\n…(dipotong)' : '')

    /* ---- tanpa --pasang: tampilkan saja + tombol konfirmasi ---- */
    if (!flag.has('--pasang') && !flag.has('--save')) {
      return m.sendButtons({
        title: `🤖 Hasil AI — ${pl.name}`,
        text: ringkas + `\\n\\n☝️ Ini *belum disimpan*. Fitur lama masih aktif.\\nTekan *PASANG* untuk menyimpan, lalu bot memuat ulang fiturnya.`,
        footer: config.bot.footer,
        buttons: [
          { text: '✅ PASANG sekarang', id: `${P}fixbutton ${pl.name} --pasang` },
          { text: '🔁 Coba lagi', id: `${P}fixbutton ${pl.name}` },
          { text: '🔘 Pakai .tobutton', id: `${P}tobutton ${pl.name}` },
          { text: '❌ Batalkan', id: `${P}editfitur ${pl.name}` }
        ]
      }).catch(() => m.reply(ringkas))
    }

    /* ---- pasang: cadangkan dulu, tulis, muat ulang, verifikasi ---- */
    const cadangan = fileLengkap + '.bak'
    try { fs.writeFileSync(cadangan, sumber) } catch {}
    try {
      fs.writeFileSync(fileLengkap, hasil.kode)
    } catch (e) {
      try { fs.writeFileSync(fileLengkap, sumber) } catch {}
      return m.reply(`❌ Gagal menulis berkas: ${truncate(String(e?.message || e), 150)}\\nFitur lama dipulihkan.`)
    }

    let muatUlang = 'ok'
    let masihAda = false
    try {
      await loadPlugins()
      masihAda = !!findPlugin(pl.name)?.plugin
    } catch (e) { muatUlang = String(e?.message || e) }

    if (!masihAda) {
      try { fs.writeFileSync(fileLengkap, sumber) } catch {}
      try { await loadPlugins() } catch {}
      return m.reply(
        `❌ *Setelah dipasang, \`${pl.name}\` tidak terdaftar lagi — DIPULIHKAN otomatis.*\\n\\n` +
        `Alasan: ${truncate(muatUlang === 'ok' ? 'plugin tidak ditemukan setelah reload' : muatUlang, 200)}\\n\\n` +
        `Fitur lama sudah kembali seperti semula.`
      )
    }

    return m.sendButtons({
      title: `✅ ${pl.name} dirapikan`,
      text:
        `✅ *TERPASANG — ${pl.name}*\\n\\n` +
        `📁 \`features/${fileName}\`\\n` +
        `✏️ ${hasil.catatan || 'balasan diubah jadi button list'}\\n` +
        `✅ Sintaks lulus · plugin terdaftar setelah reload\\n` +
        `💾 Cadangan: \`features/${path.basename(cadangan)}\`\\n\\n` +
        `Coba sekarang: \`${P}${pl.name}\``,
      footer: config.bot.footer,
      buttons: [
        { text: `🎯 Coba ${pl.name}`, id: `${P}${pl.name}` },
        { text: '↩️ Kembalikan cadangan', id: `${P}editfitur ${pl.name}` },
        { text: '🛠️ Fitur lain', id: `${P}editfitur` }
      ]
    }).catch(() => m.reply(`✅ Terpasang: \`${pl.name}\`. Coba: \`${P}${pl.name}\``))
  }
}

export default { fixButton }
