/**
 * 🧰 DEV MENU v7.7 — bikin & kelola plugin langsung dari chat
 * ------------------------------------------------------------------
 *  .>_            buat/timpa plugin dari chat (balas dokumen .js ATAU teks kode),
 *                 langsung aktif tanpa restart (hot-reload)
 *  .getcode       kirim kode sumber plugin/file apa pun ke chat
 *  .devmenu       pusat perintah developer
 *  .plugindev     daftar plugin yang dibuat lewat .>_
 *  .hapusplugindev  hapus permanen plugin buatan .>_
 *  .restoreplugin kembalikan versi sebelumnya (cadangan otomatis)
 *  .cekplugin     periksa sintaks + isi export tanpa memuat plugin
 *
 *  Keamanan:
 *   • semua perintah khusus OWNER
 *   • nama file disanitasi (hanya a-z 0-9 _ -), selalu di dalam features/
 *   • file inti (config, index, serializer, …) tidak bisa ditimpa tanpa --paksa
 *   • setiap penimpaan dicadangkan ke tmp/devbackup/ dulu
 *   • kode dicek `node --check` sebelum dimuat; kalau gagal → rollback otomatis
 *   • gagal dimuat karena bentuk export asing → AI otomatis mengadaptasi (matikan: --tanpa-ai)
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { config } from '../config.js'
import { ROOT, truncate, formatSize } from '../lib/functions.js'
import { loadDB, saveDB } from '../lib/database.js'
import { FEATURES_DIR, findPlugin, listPlugins, reloadPlugin, unloadPlugin, plugins as pluginMap } from '../lib/plugins.js'

const execFileAsync = promisify(execFile)

const P = config.display.prefix
const NAMA_DB = 'devplugin'
export const DIR_CADANGAN = path.join(ROOT, 'tmp', 'devbackup')
const MAKS_KODE = 400 * 1024          // 400 KB
const MAKS_CADANGAN = 5               // cadangan terakhir per file

/** nama yang tidak boleh dipakai sama sekali (membingungkan / bentrok dengan modul inti) */
export const NAMA_TERLARANG = new Set([
  'config.js', 'index.js', 'plugins.js', 'database.js', 'serializer.js', 'functions.js',
  'interactive.js', 'logger.js', 'rpg.js', 'ai.js', 'package.json'
])

/** file yang tidak boleh ditimpa tanpa --paksa */
const FILE_DILINDUNGI = new Set([
  'menu.js', 'owner.js', 'mainlab.js', 'group.js', 'gamerespon.js', 'arcade.js',
  'pastellab.js', 'casinolab.js', 'jadullab.js', 'welcome.js', 'user.js'
])

/* ------------------------------------------------------------------ */
/*  PEMBANTU                                                            */
/* ------------------------------------------------------------------ */
function db () {
  return loadDB(NAMA_DB, { file: {}, meta: { total: 0 } })
}

/** sanitasi nama file plugin: hanya huruf kecil, angka, strip, garis bawah */
export function namaFileAman (input = '') {
  let n = String(input || '').trim().toLowerCase()
  n = n.replace(/^\.?\//, '').replace(/\.js$/, '')
  n = path.basename(n)                       // buang path apa pun (../ dsb.)
  n = n.replace(/[^a-z0-9_-]/g, '')
  if (!n) return null
  if (n.length > 40) n = n.slice(0, 40)
  if (/^[-_0-9]/.test(n)) n = 'dev' + n      // nama file JS tidak boleh mulai dengan angka/-/_
  return n + '.js'
}

/** nama file yang boleh ditimpa tanpa --paksa */
const bolehTulis = nama => !FILE_DILINDUNGI.has(nama)

/** cek sintaks tanpa mengeksekusi (ESM: package.json punya "type":"module") */
export function cekSintaks (file) {
  try {
    execFileSync(process.execPath, ['--check', file], { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true, pesan: '' }
  } catch (e) {
    const out = String(e?.stderr || e?.stdout || e?.message || '').trim()
    return { ok: false, pesan: out.slice(0, 700) }
  }
}

function cadangkan (file) {
  try {
    fs.mkdirSync(DIR_CADANGAN, { recursive: true })
    const nama = path.basename(file)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const tujuan = path.join(DIR_CADANGAN, `${stamp}__${nama}`)
    fs.copyFileSync(file, tujuan)
    /* batasi jumlah cadangan per file */
    const semua = fs.readdirSync(DIR_CADANGAN).filter(f => f.endsWith('__' + nama)).sort()
    while (semua.length > MAKS_CADANGAN) fs.unlinkSync(path.join(DIR_CADANGAN, semua.shift()))
    return tujuan
  } catch { return null }
}

export function daftarCadangan (nama) {
  try {
    if (!fs.existsSync(DIR_CADANGAN)) return []
    return fs.readdirSync(DIR_CADANGAN)
      .filter(f => f.endsWith('__' + nama))
      .sort()
      .reverse()
      .map(f => ({ file: f, path: path.join(DIR_CADANGAN, f), stamp: f.split('__')[0] }))
  } catch { return [] }
}

/**
 * Ambil kode dari pesan: dokumen/media yang dibalas, media di pesan ini,
 * teks yang dibalas, atau teks setelah nama file.
 */
export async function ambilKode (m, kodeInline = '') {
  /* 1) dokumen / media */
  if (m.quoted?.isMedia || m.isMedia) {
    try {
      const h = await m.download()
      const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
      if (buf) return { kode: buf.toString('utf8'), sumber: `dokumen (${formatSize(buf.length)})` }
    } catch (e) {
      return { kode: '', sumber: '', galat: 'Gagal mengunduh dokumen: ' + (e?.message || e) }
    }
  }
  /* 2) kode ditulis langsung setelah nama file */
  if (kodeInline && kodeInline.length > 20) return { kode: kodeInline, sumber: 'teks perintah' }
  /* 3) balas pesan teks berisi kode */
  const qt = String(m.quoted?.text || '').trim()
  if (qt.length > 20) return { kode: qt, sumber: 'pesan teks yang dibalas' }
  if (kodeInline) return { kode: kodeInline, sumber: 'teks perintah' }
  return { kode: '', sumber: '' }
}

/**
 * Urai argumen .>_ dari m.q (bukan m.args) supaya spasi/baris baru di dalam
 * kode TIDAK dirusak. Bentuk:
 *   .>_ nama <kode…>            .>_ nama --paksa <kode…>
 *   .>_ nama --paksa            (kode dari dokumen/pesan yang dibalas)
 */
export function namaDariPesan (m) {
  const FLAG = ['--paksa', '--force', '-f']
  const q = String(m?.q || m?.arg || (m?.args || []).join(' ') || '')
  const cocok = q.trim().match(/^(\S+)([\s\S]*)$/)
  let nama = cocok ? cocok[1] : ''
  let sisa = cocok ? cocok[2] : ''
  let paksa = false
  const awal = sisa.replace(/^\s+/, '')
  for (const f of FLAG) {
    if (awal.toLowerCase() === f) { paksa = true; sisa = ''; break }
    if (awal.toLowerCase().startsWith(f + ' ') || awal.toLowerCase().startsWith(f + '\n')) {
      paksa = true; sisa = awal.slice(f.length); break
    }
  }
  if (!nama) nama = m?.quoted?.fileName || m?.fileName || ''
  return { nama, paksa, sisa: sisa.replace(/^\s+/, '') }
}

function ringkasPlugin (nama) {
  const cmds = listPlugins().filter(p => (p.fileName || '') === nama)
  return cmds.map(c => ({ cmd: c.name, alias: c.command, category: c.category, description: c.description }))
}

const judul = (m, s) => `🧰 *DEV — ${s}*\n`

/* ekstrak nama package npm yang hilang dari pesan error Node.
 * 'Cannot find package 'cheerio' ...' -> 'cheerio'; subpath dipotong. */
export function paketHilang (teks) {
  const t = String(teks || '')
  const m = t.match(/Cannot find package '([^']+)'/) || t.match(/Failed to resolve module '([^']+)'/)
  if (!m) return null
  let mentah = m[1]
  /* bentuk path-absolut: cheerio -> cheerio */
  const pot = mentah.match(/\/node_modules\/(@[^\/'"]+\/[^\/'"]+|[^\/'"]+)/)
  if (pot) mentah = pot[1]
  let nama = mentah.startsWith('@') ? mentah.split('/').slice(0, 2).join('/') : mentah.split('/')[0]
  if (!nama || nama === '.' || nama === '..' || nama.startsWith('.') || nama.startsWith('/') || nama.startsWith('node:')) return null
  if (!/^[a-z0-9@][a-z0-9@._/-]*$/i.test(nama)) return null
  return nama
}

/* Bersihkan impor 'node_modules' path-absolut menjadi nama paket murni:
 *  from 'cheerio' -> from 'cheerio'
 *  require('/x/node_modules/@a/b/lib/y.js')  -> require('@a/b')
 * Berlaku untuk from / require() / import(). */
export function bersihkanImpor (kode) {
  const berubah = []
  const hasil = String(kode || '').replace(
    /((?:from|require\(|import\()\s*['"])[^'"]*?node_modules\/(@[^\/'"]+\/[^\/'"]+|[^\/'"]+)[^'"]*(['"])/g,
    (cocok, awal, paket, akhir) => { berubah.push(paket); return awal + paket + akhir }
  )
  return { kode: hasil, berubah: [...new Set(berubah)] }
}

/* pasang 1 package npm (async agar bot tidak beku). --save agar permanen di package.json. */
export async function pasangPaket (nama, ms = 180000) {
  try {
    await execFileAsync('npm', ['install', nama, '--silent', '--no-audit', '--no-fund'], { cwd: ROOT, timeout: ms })
    return { ok: true }
  } catch (e) {
    return { ok: false, err: String(e?.message || e).slice(0, 200) }
  }
}

/* ================================================================== */
/*  1. .>_  —  buat plugin dari chat + hot reload                       */
/* ================================================================== */
export const buatPluginChat = {
  command: ['>_', 'buatplugin', 'pluginbaru', 'newplugin', 'createplugin', 'tulisplugin', 'devbuat'],
  category: 'Owner Menu',
  description: '🧰 Buat plugin baru dari chat (balas dokumen .js atau kirim kodenya) — langsung aktif tanpa restart',
  owner: true,
  limit: 0,
  run: async m => {
    const { nama: namaInput, paksa, sisa } = namaDariPesan(m)
    const sisaKode = sisa.replace(/^\s*--tanpa-ai\b\s*|\s--tanpa-ai\s*$/g, '')
    const nama = namaFileAman(namaInput)

    if (!nama) {
      return m.reply(
        judul(m, 'BUAT PLUGIN') +
        `\nBikin file di *features/* lalu langsung aktif tanpa restart.\n\n` +
        `*Cara 1 — balas dokumen .js*\nKirim dokumen plugin.js ke chat bot, lalu balas dengan:\n${P}>_ namaplugin\n(nama boleh dikosongkan: ikut nama dokumen)\n\n` +
        `*Cara 2 — tulis kodenya*\n${P}>_ namaplugin export default { command: ['halo'], category: 'Fun', description: 'sapa', run: async m => m.reply('halo!') }\n\n` +
        `*Cara 3 — balas pesan teks berisi kode*\n${P}>_ namaplugin\n\n` +
        `Aturan nama: huruf kecil/angka/strip, maks 40 karakter, disimpan sebagai features/<nama>.js\n` +
        `Menimpa file yang sudah ada butuh tambahan *--paksa*\n\nKode asing (module.exports/handler/…) otomatis diadaptasi AI saat gagal dimuat — tambah --tanpa-ai untuk menonaktifkan\n\n` +
        `Setelah jadi: ${P}getcode <nama> · ${P}cekplugin <nama> · ${P}hapusplugindev <nama>`
      )
    }

    const target = path.join(FEATURES_DIR, nama)
    if (!target.startsWith(FEATURES_DIR)) return m.reply('⚠️ Nama file tidak diizinkan.')
    if (NAMA_TERLARANG.has(nama)) return m.reply(`❌ Nama *${nama}* dipakai modul inti bot — pilih nama lain (mis. ${nama.replace('.js', 'ku.js')}).`)
    const sudahAda = fs.existsSync(target)
    const d = db()
    const buatanDev = !!d.file?.[nama]

    if (sudahAda && !buatanDev && !paksa) {
      return m.reply(
        `⚠️ *features/${nama}* sudah ada dan BUKAN buatan ${P}>_.\n\n` +
        `Menimpa file bawaan bisa merusak bot. Kalau memang mau, ulangi dengan tambahan *--paksa*:\n${P}>_ ${nama.replace(/\.js$/, '')} --paksa\n\n` +
        `Isi file sekarang: ${P}getcode ${nama.replace(/\.js$/, '')}`
      )
    }
    if (FILE_DILINDUNGI.has(nama) && !paksa) {
      return m.reply(`⚠️ *${nama}* adalah file menu inti. Tambahkan *--paksa* kalau benar-benar mau menimpa.`)
    }

    const { kode, sumber, galat } = await ambilKode(m, sisaKode)
    if (galat) return m.reply(`❌ ${galat}`)
    if (!kode || !kode.trim()) {
      return m.reply(
        `❌ Kodenya belum ada.\n\nKirim plugin dengan salah satu cara:\n` +
        `• balas *dokumen .js* dengan caption ${P}>_ ${nama.replace(/\.js$/, '')}\n` +
        `• tulis kodenya: ${P}>_ ${nama.replace(/\.js$/, '')} export default { … }\n` +
        `• balas *pesan teks* berisi kode dengan ${P}>_ ${nama.replace(/\.js$/, '')}`
      )
    }
    /* --- bersihkan impor path-absolut node_modules -> nama paket --- */
    const bersih = bersihkanImpor(kode)
    const kodePasang = bersih.kode
    if (Buffer.byteLength(kodePasang) > MAKS_KODE) return m.reply(`❌ Kode terlalu besar (${formatSize(Buffer.byteLength(kodePasang))}, maks ${formatSize(MAKS_KODE)}).`)

    /* --- cadangkan versi lama --- */
    const lama = sudahAda ? fs.readFileSync(target, 'utf8') : null
    const cadangan = sudahAda ? cadangkan(target) : null

    /* --- tulis & cek sintaks --- */
    try {
      fs.writeFileSync(target, kodePasang.endsWith('\n') ? kodePasang : kodePasang + '\n')
    } catch (e) {
      return m.reply(`❌ Gagal menulis file: ${e?.message || e}`)
    }
    const cek = cekSintaks(target)
    if (!cek.ok) {
      if (lama !== null) fs.writeFileSync(target, lama)
      else fs.unlinkSync(target)
      return m.reply(`❌ *SINTAKS SALAH* — file tidak jadi disimpan.\n\n\`\`\`\n${truncate(cek.pesan, 700)}\n\`\`\`\n\nPerbaiki lalu kirim ulang: ${P}>_ ${nama.replace(/\.js$/, '')}`)
    }

    /* --- muat panas (hot reload) --- */
    let terdaftar = []
    let paketBaru = ''
    let adaptasiNote = ''
    const kembalikan = async () => {
      if (lama !== null) {
        fs.writeFileSync(target, lama)
        try { await reloadPlugin(nama) } catch {}
      } else {
        try { unloadPlugin(nama) } catch {}
        try { fs.unlinkSync(target) } catch {}
      }
    }
    const muatDenganPaket = async () => {
      try {
        return await reloadPlugin(nama)
      } catch (e) {
        /* package npm kurang? pasang otomatis lalu coba muat sekali lagi */
        const kurang = paketHilang(String(e?.message || e))
        if (!kurang) throw e
        await m.reply(`📦 Package *${kurang}* belum terinstal — memasang otomatis, tunggu 1-2 menit…`)
        const pasang = await pasangPaket(kurang)
        if (!pasang.ok) {
          const g = new Error('gagal-pasang-paket')
          g.kode = 'paket'
          g.paket = kurang
          g.alasan = pasang.err
          throw g
        }
        paketBaru = kurang
        return reloadPlugin(nama)
      }
    }
    try {
      terdaftar = await muatDenganPaket()
    } catch (e) {
      if (e?.kode === 'paket') {
        await kembalikan()
        return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\nPackage *${e.paket}* belum terinstal dan gagal dipasang otomatis:\n${e.alasan}\n\nPasang manual di Termux/Railway:\n\`cd ${ROOT} && npm install ${e.paket}\`\nlalu ulangi: \`${P}>_ ${nama.replace(/\.js$/, '')}\``)
      }
      /* --- bentuk export tak dikenali → adaptasi AI otomatis --- */
      const tanpaAI = /(?:^|\s)--tanpa-ai(?:\s|$)/.test(' ' + String(m?.q || m?.arg || (m?.args || []).join(' ') || '') + ' ')
      let mesin = null
      let mesinInfo = ''
      if (!tanpaAI) {
        const jalurMesin = path.join(FEATURES_DIR, 'buatfitur.js')
        if (!fs.existsSync(jalurMesin)) {
          mesinInfo = 'file features/buatfitur.js belum dipasang (pasang: ' + P + '>_ buatfitur)'
        } else {
          try {
            mesin = await import('./buatfitur.js')
            if (!mesin?.adaptasiKode) mesinInfo = 'buatfitur.js versi LAMA (update: ' + P + '>_ buatfitur --paksa)'
          } catch (eImpor) {
            mesinInfo = 'buatfitur.js gagal dimuat: ' + truncate(String(eImpor?.message || eImpor), 160)
          }
        }
      }
      if (tanpaAI || !mesin?.adaptasiKode) {
        await kembalikan()
        return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\n\`\`\`\n${truncate(e?.message || String(e), 500)}\n\`\`\`\n\nPastikan file meng-export plugin berbentuk:\n\`export default { command: [...], category: '...', description: '...', run: async m => {...} }\`` + ((mesinInfo) ? `\n\n_Adaptasi AI otomatis dilewati: ${mesinInfo}_` : ''))
      }
      await m.reply('🔧 Bentuk plugin tidak dikenali — meminta AI mengadaptasi otomatis, tunggu 1-3 menit…')
      let hasil = null
      try {
        hasil = await mesin.adaptasiKode(kodePasang, 'nama file target: ' + nama)
      } catch (eAI) {
        await kembalikan()
        return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\nBentuk export tak dikenali dan adaptasi AI gagal:\n${truncate(String(eAI?.message || eAI), 400)}\n\nCoba manual: balas file/kode ini dengan \`${P}createfitur\`.`)
      }
      /* simpan kode asing asli sebelum ditimpa hasil adaptasi */
      try {
        if (!fs.existsSync(DIR_CADANGAN)) fs.mkdirSync(DIR_CADANGAN, { recursive: true })
        fs.writeFileSync(path.join(DIR_CADANGAN, nama.replace(/\.js$/, '') + '.asing-' + Date.now() + '.js'), kodePasang)
      } catch {}
      const bersihAI = bersihkanImpor(hasil.kode)
      bersih.berubah = [...new Set([...bersih.berubah, ...bersihAI.berubah])]
      try {
        fs.writeFileSync(target, bersihAI.kode.endsWith('\n') ? bersihAI.kode : bersihAI.kode + '\n')
      } catch (eT) {
        await kembalikan()
        return m.reply(`❌ Gagal menulis hasil adaptasi AI: ${eT?.message || eT}`)
      }
      const cekAI = cekSintaks(target)
      if (!cekAI.ok || !/export\s+default/.test(bersihAI.kode)) {
        await kembalikan()
        return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\nHasil adaptasi AI tidak valid: ${truncate(cekAI.ok ? 'tidak ada export default' : cekAI.pesan, 400)}\n\nKode asing asli tersimpan di tmp/devbackup/ (nama .asing-).`)
      }
      try {
        terdaftar = await muatDenganPaket()
        adaptasiNote = hasil.catatan || 'diadaptasi AI otomatis.'
      } catch (e2) {
        await kembalikan()
        if (e2?.kode === 'paket') {
          return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\nHasil adaptasi AI butuh package *${e2.paket}* yang gagal dipasang:\n${e2.alasan}\n\nPasang manual: \`cd ${ROOT} && npm install ${e2.paket}\` lalu ulangi.`)
        }
        return m.reply(`❌ *GAGAL DIMUAT* — dikembalikan ke versi semula.\n\nHasil adaptasi AI tetap gagal dimuat:\n\`\`\`\n${truncate(e2?.message || String(e2), 500)}\n\`\`\``)
      }
    }

    /* --- bentrok alias? --- */
    const bentrok = []
    for (const c of terdaftar) {
      const p = findPlugin(c)
      if (p && p.plugin.fileName !== nama) bentrok.push(`${P}${c} → ${p.plugin.fileName}`)
    }

    /* --- catat di manifest --- */
    if (!d.file) d.file = {}
    const rec = d.file[nama] || { dibuat: Date.now(), cadangan: [] }
    rec.diubah = Date.now()
    rec.versi = (rec.versi || 0) + 1
    rec.ukuran = fs.statSync(target).size
    rec.perintah = terdaftar
    rec.sumber = sumber
    if (cadangan) rec.cadangan = [cadangan, ...(rec.cadangan || [])].slice(0, MAKS_CADANGAN)
    d.file[nama] = rec
    d.meta.total = Object.keys(d.file).length
    saveDB(NAMA_DB)

    const baris = fs.readFileSync(target, 'utf8').split('\n').length
    return m.reply(
      `🧩 *PLUGIN ${sudahAda ? 'DIPERBARUI' : 'BARU'} AKTIF* — features/${nama}\n\n` +
      `Perintah (${terdaftar.length}): ${terdaftar.slice(0, 14).map(c => P + c).join(', ')}${terdaftar.length > 14 ? ` +${terdaftar.length - 14}` : ''}\n` +
      `Ukuran: ${formatSize(rec.ukuran)} · ${baris} baris · versi ${rec.versi}\n` +
      `Sumber kode: ${sumber}\n` +
      `Sintaks: ✅ node --check lulus\n` +
      (paketBaru ? `Package: 📦 ${paketBaru} dipasang otomatis\n` : '') +
      (bersih.berubah.length ? `Impor: 🧹 path absolut dibersihkan → ${bersih.berubah.map(p => `'${p}'`).join(', ')}\n` : '') +
      (adaptasiNote ? `Adaptasi AI: 🤖 otomatis — ${truncate(adaptasiNote, 250)}\n` : '') +
      (adaptasiNote ? `Kode asing asli: 💾 tmp/devbackup/${nama.replace(/\.js$/, '')}.asing-*.js\n` : '') +
      `Hot-reload: ✅ aktif tanpa restart (total ${pluginMap.size} plugin)\n` +
      (cadangan ? `Cadangan: ✅ ${path.basename(cadangan)}\n` : '') +
      (bentrok.length ? `\n⚠️ Alias direbut plugin lain (periksa): ${bentrok.join(', ')}\n` : '') +
      `\nUji coba: ${terdaftar[0] ? P + terdaftar[0] : '-'}\n` +
      `Lihat kode: ${P}getcode ${nama.replace(/\.js$/, '')}\n` +
      `Hapus: ${P}hapusplugindev ${nama.replace(/\.js$/, '')}`
    )
  }
}

/* ================================================================== */
/*  2. .getcode — kirim kode sumber plugin/file                          */
/* ================================================================== */
export const getCode = {
  command: ['getcode', 'ambilkode', 'lihatsumber', 'sumberplugin', 'kodefitur', 'getplugin'],
  category: 'Owner Menu',
  description: '📄 Kirim kode sumber plugin (atau file apa pun di folder bot) ke chat',
  owner: true,
  limit: 0,
  run: async m => {
    const q = (m.q || m.args[0] || '').trim()
    if (!q) {
      return m.reply(
        judul(m, 'GETCODE') +
        `\nKirim kode sumber sebuah plugin/file.\n\n` +
        `• dari perintah: ${P}getcode tiktok\n` +
        `• dari nama file: ${P}getcode downloaderlab\n` +
        `• file lain di folder bot: ${P}getcode lib/lbgame.js · ${P}getcode config.js\n\n` +
        `Daftar file fitur: ${P}pluginberkas`
      )
    }

    /* cari file: perintah → plugin → file; kalau bukan, coba path relatif */
    let file = null, label = ''
    const plug = findPlugin(q.replace(/^\W+/, ''))
    if (plug?.plugin?.file && fs.existsSync(plug.plugin.file)) {
      file = plug.plugin.file
      label = `perintah ${P}${plug.name} → ${plug.plugin.fileName}`
    } else {
      const calon = [
        path.join(FEATURES_DIR, q.replace(/\.js$/, '') + '.js'),
        path.join(FEATURES_DIR, q),
        path.resolve(ROOT, q),
        path.resolve(ROOT, q.endsWith('.js') ? q : q + '.js')
      ]
      for (const c of calon) {
        if (c.startsWith(ROOT) && fs.existsSync(c) && fs.statSync(c).isFile()) { file = c; label = path.relative(ROOT, c); break }
      }
      if (!file && !q.startsWith(ROOT)) {
        const seret = fs.readdirSync(FEATURES_DIR).find(f => f.toLowerCase().includes(q.toLowerCase()))
        if (seret) { file = path.join(FEATURES_DIR, seret); label = 'features/' + seret + ' (dicari dari nama)' }
      }
    }
    if (!file) return m.reply(`❌ Tidak menemukan plugin/file untuk *"${q}"*.\n\nCoba: ${P}getcode downloaderlab · ${P}pluginberkas · ${P}carifitur ${q}`)
    if (!file.startsWith(ROOT)) return m.reply('⚠️ File di luar folder bot tidak diizinkan.')

    const stat = fs.statSync(file)
    const isi = fs.readFileSync(file, 'utf8')
    const namaFile = path.basename(file)
    const cmds = ringkasPlugin(namaFile)
    const info =
      `📄 *KODE SUMBER* — ${label}\n\n` +
      `File: ${path.relative(ROOT, file)}\n` +
      `Ukuran: ${formatSize(stat.size)} · ${isi.split('\n').length} baris\n` +
      `Diubah: ${stat.mtime.toLocaleString('id-ID')}\n` +
      (cmds.length ? `Plugin (${cmds.length}): ${cmds.slice(0, 20).map(c => P + c.cmd).join(', ')}${cmds.length > 20 ? ` +${cmds.length - 20}` : ''}\n` : 'Plugin: - (bukan file fitur)\n')

    /* file kecil → tampilkan langsung; besar → kirim dokumen */
    if (isi.length <= 3600) {
      return m.reply(`${info}\n\`\`\`js\n${isi}\n\`\`\``)
    }
    try {
      await m.reply(info + `\nFile dikirim sebagai dokumen 👇`)
      return await m.sendDoc(Buffer.from(isi, 'utf8'), namaFile, 'application/javascript', { caption: `${info}` })
    } catch (e) {
      return m.reply(info + `\n\n\`\`\`js\n${truncate(isi, 3000)}\n\`\`\`\n\n_…terpotong (${isi.length} karakter)_`)
    }
  }
}

/* ================================================================== */
/*  3. .devmenu — pusat perintah developer                              */
/* ================================================================== */
export const devMenu = {
  command: ['devmenu', 'menupengembang', 'menudeveloper', 'devtools', 'alatdev', 'menukode', 'devpanel'],
  category: 'Owner Menu',
  description: '🧰 Menu developer: buat plugin dari chat, ambil kode, reload, cek sintaks, cadangan',
  owner: true,
  limit: 0,
  run: async m => {
    const d = db()
    const n = Object.keys(d.file || {}).length
    const text =
      judul(m, 'DEVELOPER') +
      `\nBikin & rawat plugin tanpa menyentuh Termux.\n\n` +
      `🧩 Plugin buatan chat: *${n}*\n` +
      `📦 Total plugin aktif: *${pluginMap.size}*\n` +
      `📂 Folder fitur: features/ (${fs.readdirSync(FEATURES_DIR).filter(f => f.endsWith('.js')).length} file)\n\n` +
      `*Bikin plugin*\n` +
      `▸ ${P}>_ nama  ← balas dokumen .js / tulis kodenya\n` +
      `▸ ${P}cekplugin nama — cek sintaks & export\n` +
      `▸ ${P}getcode nama — ambil kode sumber\n` +
      `▸ ${P}restoreplugin nama — kembalikan cadangan\n` +
      `▸ ${P}hapusplugindev nama — hapus permanen\n\n` +
      `*Rawat fitur*\n` +
      `▸ ${P}reloadfitur <file> — muat ulang tanpa restart\n` +
      `▸ ${P}hapusfitur <file> — lepas dari memori\n` +
      `▸ ${P}matikanfitur / ${P}nyalakanfitur <cmd>\n` +
      `▸ ${P}pluginberkas · ${P}pluginrinci <file> · ${P}carifitur <kata>\n\n` +
      `*Sistem*\n` +
      `▸ ${P}bacafile <path> · ${P}listfolder <path> · ${P}kirimfile <path>\n` +
      `▸ ${P}jalankanperintah <shell> · ${P}logbot 10 · ${P}dbstat\n` +
      `▸ ${P}backupdb · ${P}restartsafe`

    try {
      return await m.sendButtons({
        title: '🧰 DEV MENU',
        text,
        buttons: [
          { text: '🧩 Plugin buatan chat', id: `${P}plugindev` },
          { text: '📂 Daftar file fitur', id: `${P}pluginberkas` },
          { text: '🔎 Cari fitur', id: `${P}carifitur` },
          { text: '📄 Ambil kode', id: `${P}getcode` },
          { text: '👑 Menu Owner', id: `${P}menuowner` }
        ]
      })
    } catch { return m.reply(text) }
  }
}

/* ================================================================== */
/*  4. .plugindev — daftar plugin buatan .>_                            */
/* ================================================================== */
export const pluginDev = {
  command: ['plugindev', 'listplugindev', 'pluginbuatan', 'daftarplugindev', 'pluginchat'],
  category: 'Owner Menu',
  description: '🧩 Daftar plugin yang dibuat/diubah lewat .>_',
  owner: true,
  limit: 0,
  run: async m => {
    const d = db()
    const entri = Object.entries(d.file || {})
    if (!entri.length) return m.reply(`ℹ️ Belum ada plugin buatan chat.\n\nBikin sekarang: balas dokumen .js dengan ${P}>_ namaplugin`)
    entri.sort((a, b) => (b[1].diubah || 0) - (a[1].diubah || 0))
    const baris = entri.map(([nama, r], i) => {
      const aktif = listPlugins().some(p => p.fileName === nama)
      return `${i + 1}. *${nama}* ${aktif ? '🟢' : '🔴 tidak aktif'}\n   v${r.versi || 1} · ${formatSize(r.ukuran || 0)} · ${new Date(r.diubah || r.dibuat).toLocaleString('id-ID')}\n   ${(r.perintah || []).slice(0, 8).map(c => P + c).join(', ') || '-'}${r.sumber ? `\n   sumber: ${r.sumber}` : ''}`
    })
    return m.reply(
      judul(m, 'PLUGIN BUATAN CHAT') +
      `\n${entri.length} file · ${entri.filter(([nama]) => listPlugins().some(p => p.fileName === nama)).length} di antaranya aktif\n\n` +
      baris.join('\n\n') +
      `\n\nAmbil kode: ${P}getcode <nama>\nCadangan: ${P}restoreplugin <nama>\nHapus: ${P}hapusplugindev <nama>`
    )
  }
}

/* ================================================================== */
/*  5. .hapusplugindev                                                  */
/* ================================================================== */
export const hapusPluginDev = {
  command: ['hapusplugindev', 'deleteplugindev', 'buangplugindev', 'hapuspluginchat', 'delplugindev'],
  category: 'Owner Menu',
  description: '🗑️ Hapus permanen plugin buatan .>_ (file + dari memori)',
  owner: true,
  limit: 0,
  run: async m => {
    const nama = namaFileAman(m.args[0] || '')
    if (!nama) return m.reply(`Contoh: ${P}hapusplugindev halo\nDaftar: ${P}plugindev`)
    const d = db()
    const target = path.join(FEATURES_DIR, nama)
    const tercatat = !!d.file?.[nama]
    if (!tercatat && !fs.existsSync(target)) return m.reply(`❌ Tidak ada plugin *${nama}*.\nDaftar: ${P}plugindev`)
    if (!tercatat) {
      return m.reply(`⚠️ *${nama}* bukan buatan ${P}>_ (file bawaan bot).\n\nLepas dari memori saja: ${P}hapusfitur ${nama.replace(/\.js$/, '')}`)
    }
    let dilepas = '-'
    try { dilepas = unloadPlugin(nama) } catch { /* memang belum dimuat */ }
    try { if (fs.existsSync(target)) fs.unlinkSync(target) } catch (e) { return m.reply(`❌ Gagal menghapus file: ${e.message}`) }
    delete d.file[nama]
    d.meta.total = Object.keys(d.file).length
    saveDB(NAMA_DB)
    return m.reply(
      `🗑️ *PLUGIN DIHAPUS* — features/${nama}\n\n` +
      `Dilepas dari memori: ${truncate(dilepas, 200)}\n` +
      `Sisa plugin: ${pluginMap.size}\n` +
      `Cadangan masih ada: ${daftarCadangan(nama).length} file di tmp/devbackup/\n` +
      `Kembalikan: ${P}restoreplugin ${nama.replace(/\.js$/, '')}`
    )
  }
}

/* ================================================================== */
/*  6. .restoreplugin                                                   */
/* ================================================================== */
export const restorePlugin = {
  command: ['restoreplugin', 'kembalikanplugin', 'batalplugin', 'rollbackplugin', 'undoplugin'],
  category: 'Owner Menu',
  description: '↩️ Kembalikan plugin ke versi cadangan sebelumnya',
  owner: true,
  limit: 0,
  run: async m => {
    const nama = namaFileAman(m.args[0] || '')
    if (!nama) return m.reply(`Contoh: ${P}restoreplugin halo\nDaftar plugin: ${P}plugindev`)
    const target = path.join(FEATURES_DIR, nama)
    const semua = daftarCadangan(nama)
    if (!semua.length) return m.reply(`❌ Tidak ada cadangan untuk *${nama}*.\n(Cadangan dibuat otomatis setiap ${P}>_ menimpa file.)`)

    const pilih = parseInt(String(m.args[1] || '').replace(/[^0-9]/g, ''), 10)
    if (!pilih) {
      return m.reply(
        `↩️ *CADANGAN ${nama}* (${semua.length})\n\n` +
        semua.map((c, i) => `${i + 1}. ${c.stamp} · ${formatSize(fs.statSync(c.path).size)}`).join('\n') +
        `\n\nKembalikan: ${P}restoreplugin ${nama.replace(/\.js$/, '')} <nomor>\n(default 1 = cadangan terbaru)`
      )
    }
    const c = semua[Math.min(Math.max(1, pilih), semua.length) - 1]
    fs.copyFileSync(c.path, target)
    const cek = cekSintaks(target)
    if (!cek.ok) {
      fs.unlinkSync(target)
      return m.reply(`❌ Cadangan itu rusak sintaksnya, tidak jadi dipasang.\n\`\`\`\n${truncate(cek.pesan, 400)}\n\`\`\``)
    }
    let reg = []
    try { reg = await reloadPlugin(nama) } catch (e) { return m.reply(`⚠️ File dipasang tapi gagal dimuat: ${e.message}`) }
    const d = db()
    if (d.file?.[nama]) { d.file[nama].versi = (d.file[nama].versi || 1) + 1; d.file[nama].diubah = Date.now(); d.file[nama].ukuran = fs.statSync(target).size; saveDB(NAMA_DB) }
    return m.reply(`↩️ *${nama}* dikembalikan ke cadangan ${c.stamp}\n\nPerintah aktif: ${reg.map(x => P + x).join(', ') || '-'}`)
  }
}

/* ================================================================== */
/*  7. .cekplugin                                                       */
/* ================================================================== */
export const cekPlugin = {
  command: ['cekplugin', 'checkplugin', 'ujiplugin', 'sintaksplugin', 'cekfitur'],
  category: 'Owner Menu',
  description: '🔍 Periksa sintaks + export sebuah file plugin tanpa memuatnya',
  owner: true,
  limit: 0,
  run: async m => {
    const q = (m.args[0] || '').trim()
    if (!q) return m.reply(`Contoh: ${P}cekplugin downloaderlab\nAtau balas dokumen .js dengan ${P}cekplugin`)

    let file = path.join(FEATURES_DIR, q.replace(/\.js$/, '') + '.js')
    let kode = null, asalKode = ''
    if (!fs.existsSync(file)) {
      const alt = path.resolve(ROOT, q)
      if (alt.startsWith(ROOT) && fs.existsSync(alt)) file = alt
    }
    if (!fs.existsSync(file) && (m.quoted?.isMedia || m.isMedia)) {
      /* periksa kode dari dokumen tanpa menyimpannya */
      const { kode: k, sumber, galat } = await ambilKode(m, '')
      if (galat) return m.reply('❌ ' + galat)
      if (k) {
        kode = k; asalKode = sumber
        file = path.join(ROOT, 'tmp', `cek-${Date.now()}.mjs`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, kode)
      }
    }
    if (!fs.existsSync(file)) return m.reply(`❌ File tidak ditemukan: ${q}\nDaftar: ${P}pluginberkas`)

    const isi = kode !== null ? kode : fs.readFileSync(file, 'utf8')
    const cek = cekSintaks(file)
    const namaFile = path.basename(file)
    const cmds = kode === null ? ringkasPlugin(namaFile) : []
    const hitung = (isi.match(/command:\s*\[/g) || []).length
    const punyaRun = /run:\s*(async)?\s*\(/.test(isi) || /run:\s*(async)?\s*m\s*=>/.test(isi)
    const punyaExport = /export\s+(default|const|function)/.test(isi)

    const hasil =
      judul(m, 'CEK PLUGIN') +
      `\nFile: ${path.relative(ROOT, file)}${asalKode ? ` (dari ${asalKode})` : ''}\n` +
      `Ukuran: ${formatSize(Buffer.byteLength(isi))} · ${isi.split('\n').length} baris\n\n` +
      `${cek.ok ? '✅ Sintaks: lulus (node --check)' : '❌ Sintaks: SALAH'}\n` +
      `${cek.ok ? '' : '```\n' + truncate(cek.pesan, 600) + '\n```\n'}` +
      `${punyaExport ? '✅' : '⚠️'} Export: ${punyaExport ? 'ada' : 'tidak ditemukan (plugin tidak akan terbaca)'}\n` +
      `${punyaRun ? '✅' : '⚠️'} Fungsi run: ${punyaRun ? 'ada' : 'tidak ditemukan'}\n` +
      `🔢 Blok command: ${hitung}\n` +
      (cmds.length ? `🟢 Terdaftar sekarang: ${cmds.map(c => P + c.cmd).join(', ')}\n` : '') +
      (cek.ok ? `\nMuat/reload: ${P}reloadfitur ${namaFile.replace(/\.js$/, '')}` : '')

    if (kode !== null) { try { fs.unlinkSync(file) } catch {} }
    return m.reply(hasil)
  }
}

export const DAFTAR_DEV = [
  { cmd: '>_', icon: '🧩', nama: 'Buat Plugin', ket: 'bikin plugin dari dokumen/teks chat, langsung aktif' },
  { cmd: 'getcode', icon: '📄', nama: 'Get Code', ket: 'kirim kode sumber plugin/file' },
  { cmd: 'devmenu', icon: '🧰', nama: 'Dev Menu', ket: 'pusat perintah developer' },
  { cmd: 'plugindev', icon: '📋', nama: 'Plugin Dev', ket: 'daftar plugin buatan chat' },
  { cmd: 'cekplugin', icon: '🔍', nama: 'Cek Plugin', ket: 'periksa sintaks & export' },
  { cmd: 'restoreplugin', icon: '↩️', nama: 'Restore Plugin', ket: 'kembalikan cadangan' },
  { cmd: 'hapusplugindev', icon: '🗑️', nama: 'Hapus Plugin', ket: 'hapus plugin buatan chat' }
]

export default {
  buatPluginChat, getCode, devMenu, pluginDev,
  hapusPluginDev, restorePlugin, cekPlugin,
  /* diekspor untuk pengujian (bukan plugin: tidak punya command+run) */
  namaFileAman, cekSintaks, ambilKode, namaDariPesan, daftarCadangan, FEATURES_DIR, DIR_CADANGAN
}
