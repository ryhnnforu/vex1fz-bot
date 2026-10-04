/**
 * 🩹 .patchcekzip — buat .>_ menolak file arsip dengan pesan jelas (v7.37.0)
 * ------------------------------------------------------------------
 *  Kasus nyata: user mengirim `editfitur-v7.37.0.zip` lalu membalas
 *  `.>_ editfitur`. Fungsi ambilKode() di features/devmenu.js membaca
 *  dokumen apa adanya, jadi byte ZIP (diawali "PK") disimpan sebagai
 *  features/editfitur.js dan Node gagal:
 *
 *      SyntaxError: Invalid or unexpected token   (baris 1: PK)
 *
 *  Patch ini menyisipkan cek magic byte tepat di titik dokumen dibaca,
 *  jadi bot membalas "ini arsip .zip, kirim .js-nya" — bukan menyimpan
 *  sampah biner. Cadangan dibuat otomatis, hasil diverifikasi dengan
 *  `node --check`, dan dikembalikan kalau gagal.
 *
 *  .patchcekzip          terapkan
 *  .patchcekzip cek      lihat status
 *  .patchcekzip batal    kembalikan dari cadangan
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const P = config.display.prefix
const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'devmenu.js')
const CADANGAN = FILE + '.sebelum-patch-cekzip'
const PENANDA = '/* cek-arsip v7.37.0 */'
const BT = '\u0060' /* backtick — ditulis sebagai escape supaya file ini tetap terbaca */

/* ---------- potongan yang disisipkan ---------- */
const HELPER =
  '/** jenis arsip dari magic byte — .>_ tidak bisa mengekstrak arsip (v7.37.0) */\n' +
  'function jenisArsip (buf) {\n' +
  '  if (!buf || buf.length < 4) return \'\'' + '\n' +
  '  if (buf[0] === 0x50 && buf[1] === 0x4b) return \'ZIP (.zip)\'\n' +
  '  if (buf[0] === 0x52 && buf[1] === 0x61 && buf[2] === 0x72) return \'RAR (.rar)\'\n' +
  '  if (buf[0] === 0x1f && buf[1] === 0x8b) return \'GZIP (.gz/.tgz)\'\n' +
  '  if (buf[0] === 0x37 && buf[1] === 0x7a) return \'7Z (.7z)\'\n' +
  '  return \'\'' + '\n' +
  '}\n' +
  'const pesanArsip = a => \'Yang terkirim itu *arsip \' + a + \'*, bukan kode JavaScript.\\n\\n\' +\n' +
  '  \'.' + '>_ tidak bisa mengekstrak arsip — kalau dipaksa, isi arsip tersimpan sebagai file .js dan bot error \' +\n' +
  '  \'' + BT + 'SyntaxError: Invalid or unexpected token' + BT + ' (baris 1: PK).\\n\\n\' +\n' +
  '  \'✅ Cara benar: ekstrak dulu di HP, lalu kirim *file .js tunggal* (mis. ' + BT + 'editfitur.js' + BT + ') \' +\n' +
  '  \'lalu balas dengan ' + BT + '.' + '>_ <nama>' + BT + '.\'\n\n'

const ANCHOR =
  '      if (buf) return { kode: buf.toString(\'utf8\'), sumber: ' + BT + 'dokumen (${formatSize(buf.length)})' + BT + ' }'

const GANTI =
  '      if (buf) {\n' +
  '        ' + PENANDA + '\n' +
  '        const arsip = jenisArsip(buf)\n' +
  '        if (arsip) return { kode: \'\', sumber: \'\', galat: pesanArsip(arsip) }\n' +
  '        return { kode: buf.toString(\'utf8\'), sumber: ' + BT + 'dokumen (${formatSize(buf.length)})' + BT + ' }\n' +
  '      }'

const ANCHOR_HELPER = 'export async function ambilKode (m, kodeInline = \'\') {'

/** terapkan patch ke sebuah string sumber; null bila anchor tidak ketemu */
export function terapkanPatch (sumber) {
  const s = String(sumber || '')
  if (s.includes(PENANDA)) return { hasil: s, berubah: false, alasan: 'sudah-terpasang' }
  if (!s.includes(ANCHOR)) return { hasil: null, berubah: false, alasan: 'anchor-tidak-ketemu' }
  let out = s.replace(ANCHOR, GANTI)
  if (s.includes(ANCHOR_HELPER) && !s.includes('function jenisArsip')) {
    out = out.replace(ANCHOR_HELPER, HELPER + ANCHOR_HELPER)
  }
  return { hasil: out, berubah: true, alasan: 'ok' }
}

function cekSintaksFile (file) {
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); return { ok: true } }
  catch (e) { return { ok: false, err: String(e.stderr || e.message).split('\n').slice(0, 4).join(' | ') } }
}

export const patchCekZip = {
  command: ['patchcekzip', 'patchzip', 'fixzipplugin', 'patcharsip'],
  category: 'Owner Menu',
  description: '🩹 Buat .>_ menolak file arsip (.zip/.rar/.gz/.7z) dengan pesan jelas — `.patchcekzip`',
  owner: true,
  limit: 0,
  run: async m => {
    const arg = String(m.q || (m.args || [])[0] || '').toLowerCase().trim()
    if (!fs.existsSync(FILE)) return m.reply('❌ File tidak ditemukan: features/devmenu.js')
    const asli = fs.readFileSync(FILE, 'utf8')
    const sudah = asli.includes(PENANDA)

    if (arg === 'cek' || arg === 'status') {
      return m.reply(
        '🩹 *STATUS PATCH cek-arsip*\n\n' +
        'File: ' + BT + 'features/devmenu.js' + BT + ' (' + Math.round(asli.length / 1024) + ' KB)\n' +
        'Patch: ' + (sudah ? '✅ sudah terpasang' : '⬜ belum') + '\n' +
        'Cadangan: ' + (fs.existsSync(CADANGAN) ? '✅ ada' : '⬜ tidak ada') + '\n\n' +
        'Terapkan: ' + BT + P + 'patchcekzip' + BT + '\nBatalkan: ' + BT + P + 'patchcekzip batal' + BT
      )
    }

    if (arg === 'batal' || arg === 'undo') {
      if (!fs.existsSync(CADANGAN)) return m.reply('❌ Tidak ada cadangan untuk dikembalikan.')
      fs.copyFileSync(CADANGAN, FILE)
      return m.reply('↩️ *features/devmenu.js* dikembalikan dari cadangan.\nMuat ulang: ' + BT + P + 'reloadfitur' + BT + ' atau restart bot.')
    }

    if (sudah) return m.reply('ℹ️ Patch sudah terpasang — tidak ada yang diubah.\nCek: ' + BT + P + 'patchcekzip cek' + BT)

    const { hasil, alasan } = terapkanPatch(asli)
    if (!hasil) {
      return m.reply(
        '⚠️ Anchor tidak ditemukan di ' + BT + 'features/devmenu.js' + BT + ' (' + alasan + ').\n' +
        'File *tidak diubah*. Versi devmenu-mu mungkin berbeda — tambahkan manual cek magic byte ' +
        'di dalam ' + BT + 'ambilKode()' + BT + ' tepat sebelum ' + BT + 'return { kode: buf.toString(...)' + BT + '.'
      )
    }

    fs.copyFileSync(FILE, CADANGAN)
    fs.writeFileSync(FILE, hasil)
    const cek = cekSintaksFile(FILE)
    if (!cek.ok) {
      fs.copyFileSync(CADANGAN, FILE)
      return m.reply('❌ Hasil patch gagal ' + BT + 'node --check' + BT + ' — file *dikembalikan*.\n' + cek.err)
    }

    return m.sendButtons({
      title: '🩹 Patch cek-arsip terpasang',
      text:
        '🩹 *PATCH TERPASANG*\n\n' +
        BT + 'features/devmenu.js' + BT + ' · ' + Math.round(asli.length / 1024) + ' KB → ' + Math.round(hasil.length / 1024) + ' KB\n' +
        'Cadangan: ' + BT + 'features/devmenu.js.sebelum-patch-cekzip' + BT + '\n' +
        'Sintaks: ✅ lolos ' + BT + 'node --check' + BT + '\n\n' +
        'Mulai sekarang, mengirim *.zip/.rar/.gz/.7z* lalu membalas ' + BT + P + '>_ nama' + BT +
        ' akan ditolak dengan pesan jelas — bukan disimpan sebagai file .js.\n\n' +
        '⚠️ Muat ulang dulu: ' + BT + P + 'reloadfitur' + BT + ' (atau restart bot).',
      footer: config.bot.footer,
      buttons: [
        { text: '♻️ Muat ulang', id: P + 'reloadfitur' },
        { text: '🔍 Cek status', id: P + 'patchcekzip cek' },
        { text: '↩️ Batalkan', id: P + 'patchcekzip batal' }
      ]
    }).catch(() => m.reply('🩹 Patch terpasang. Muat ulang: ' + BT + P + 'reloadfitur' + BT))
  }
}

export default { patchCekZip }
