/**
 * ============================================================================
 *  🐧 TERMUX KIT — perintah-perintah Termux versi bot (KHUSUS OWNER)
 * ============================================================================
 *  Melengkapi `.bash` (shell sungguhan) dengan versi "aman" yang tidak butuh
 *  mode shell dan tidak bergantung pada binary di HP:
 *
 *    .json   — rapikan / minify / ambil potongan JSON   (ala jq)
 *    .wget   — unduh file dari URL ke folder bot        (ala wget)
 *    .nano   — lihat & edit file baris-per-baris        (ala nano, non-interaktif)
 *    .http   — cek URL: status, header, isi             (ala curl ringkas)
 *    .uname  — info sistem                              (ala uname)
 *    .df     — kapasitas penyimpanan                    (ala df)
 *    .free   — memori                                   (ala free)
 *    .date   — tanggal & waktu                          (ala date)
 *
 *  Untuk perintah Termux sungguhan yang lain (`ls`, `git`, `npm`, `apt`...),
 *  pakai `.bash` — itu shell beneran.
 *  Semua perintah di sini khusus Owner dan dibatasi folder bot.
 * ============================================================================
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { unduhBuffer } from '../lib/ikyyapi.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const P = config.display.prefix

const MAKS_FILE_NANO = 200 * 1024
const MAKS_UNDUH = 30 * 1024 * 1024
const MAKS_TAMPIL = 3500

function tolakBukanOwner (m) {
  return m.reply(
    ` *${(m.command || 'perintah').toUpperCase()}* khusus Owner.\n` +
    `Ini kendali atas HP/server — user biasa tidak diberi akses.`
  )
}

/** anti traversal: hanya di dalam folder bot */
function pathAman (rel, cwd = ROOT) {
  const bersih = String(rel || '').trim().replace(/\\/g, '/').replace(/^["']|["']$/g, '')
  if (!bersih) return { ok: false, sebab: 'kosong' }
  if (/^[a-zA-Z]:[\\/]/.test(bersih)) return { ok: false, sebab: 'absolut Windows' }
  if (bersih.startsWith('/')) return { ok: false, sebab: 'absolut' }
  if (bersih.startsWith('~')) return { ok: false, sebab: 'home' }
  const abs = path.resolve(cwd, bersih)
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return { ok: false, sebab: 'traversal' }
  return { ok: true, abs }
}

function manusiawi (b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 ** 3) return `${(b / 1024 / 1024).toFixed(1)} MB`
  return `${(b / 1024 ** 3).toFixed(2)} GB`
}

/* ============================ .json ============================ */
export const jsonCmd = {
  command: ['json', 'jq'],
  category: 'Owner Menu',
  description: '🧾 Rapikan/minify/ambil potongan JSON — `.json {"a":1}` atau kutip pesan berisi JSON',
  owner: true,
  limit: 0,
  cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    let teks = String(m.q || '').trim()
    if (!teks && m.quoted?.text) teks = String(m.quoted.text).trim()
    if (!teks) {
      return m.reply(
        `🧾 *JSON (ala jq)*\n\n` +
        `\`${P}json {"a":1,"b":[2,3]}\`      rapikan\n` +
        `\`${P}json min {"a": 1}\`          minify\n` +
        `\`${P}json ambil data.0.nama {...}\`  ambil potongan\n\n` +
        `Atau balas (quote) pesan berisi JSON dengan \`${P}json\`.`
      )
    }
    let mode = 'rapikan', ambil = null
    const mm = teks.match(/^(min|ambil)\s+([\s\S]*)$/i)
    if (mm) {
      mode = mm[1].toLowerCase()
      teks = mm[2]
      if (mode === 'ambil') {
        const pj = teks.match(/^(\S+)\s+([\s\S]+)$/)
        if (pj) { ambil = pj[1]; teks = pj[2] }
      }
    }
    let obj
    try { obj = JSON.parse(teks) } catch (e) {
      return m.reply(`❌ Bukan JSON sah:\n\`\`\`${truncate(String(e.message), 300)}\`\`\``)
    }
    let hasil = obj
    if (ambil) {
      for (const k of ambil.split('.')) {
        if (hasil == null) break
        const idx = /^\d+$/.test(k) ? parseInt(k, 10) : k
        hasil = Array.isArray(hasil) ? hasil[idx] : hasil[k]
      }
      if (hasil === undefined) return m.reply(`❌ Jalur \`${ambil}\` tidak ada di JSON itu.`)
    }
    const keluar = mode === 'min' ? JSON.stringify(hasil) : JSON.stringify(hasil, null, 2)
    return m.reply(`🧾 *JSON ${mode === 'min' ? '(minify)' : ambil ? `(jalur: ${ambil})` : '(rapikan)'}*\n\`\`\`json\n${truncate(keluar, MAKS_TAMPIL)}\n\`\`\``)
  }
}

/* ============================ .wget ============================ */
export const wgetCmd = {
  command: ['wget', 'simpanurl'],
  category: 'Owner Menu',
  description: '📥 Unduh file dari URL ke folder bot — `.wget <url> [nama file]`',
  owner: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    const arg = String(m.q || '').trim().split(/\s+/)
    const url = arg[0] || ''
    if (!/^https?:\/\//i.test(url)) {
      return m.reply(`📥 *WGET*\n\n\`${P}wget <url>\` — simpan ke folder bot dengan nama dari URL\n\`${P}wget <url> foto.jpg\` — simpan dengan nama sendiri\n\nContoh: \`${P}wget https://example.com/data.json\``)
    }
    let nama = arg.slice(1).join(' ') || decodeURIComponent(new URL(url).pathname.split('/').pop() || 'unduhan.bin')
    nama = nama.replace(/[^\w.\- ]+/g, '_').trim() || 'unduhan.bin'
    const aman = pathAman(nama)
    if (!aman.ok) return m.reply(`🔒 Nama file ditolak (${aman.sebab}).`)
    await m.react?.('📥').catch(() => {})
    try {
      const buf = await unduhBuffer(url, { timeout: 120000, maks: MAKS_UNDUH })
      fs.writeFileSync(aman.abs, buf)
      return m.reply(
        `📥 *TERSIMPAN*\n\n` +
        `📄 ${path.basename(aman.abs)}\n` +
        `📏 ${manusiawi(buf.length)}\n` +
        `📂 ${path.dirname(aman.abs) === ROOT ? '(root bot)' : path.relative(ROOT, path.dirname(aman.abs))}\n\n` +
        `Lihat: \`${P}nano ${path.relative(ROOT, aman.abs) || path.basename(aman.abs)}\` (file teks)`
      )
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(`❌ Gagal unduh: ${truncate(String(e?.message || e), 150)}`)
    }
  }
}

/* ============================ .nano ============================ */
export const nanoCmd = {
  command: ['nano', 'editfile', 'fileeditor'],
  category: 'Owner Menu',
  description: '✏️ Lihat & edit file baris-per-baris ala nano (non-interaktif)',
  owner: true,
  limit: 0,
  cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    const q = String(m.q || '').trim()
    if (!q) {
      return m.reply(
        `✏️ *NANO (non-interaktif)*\n\n` +
        `\`${P}nano config.js\`                lihat isi (bernomor)\n` +
        `\`${P}nano config.js tambah baris\`   tambah baris di akhir\n` +
        `\`${P}nano config.js ganti 5 teks\`   ganti baris ke-5\n` +
        `\`${P}nano config.js hapus 5\`        hapus baris ke-5\n\n` +
        `Maks file ${manusiawi(MAKS_FILE_NANO)}. Hanya di dalam folder bot.`
      )
    }
    const mm = q.match(/^(\S+)\s+(tambah|ganti|hapus)\s+([\s\S]*)$/i)
    const rel = mm ? mm[1] : q.split(/\s+/)[0]
    const aksi = mm ? mm[2].toLowerCase() : 'lihat'
    const sisa = mm ? mm[3] : ''
    const aman = pathAman(rel)
    if (!aman.ok) return m.reply(`🔒 Ditolak: ${aman.sebab}. Hanya di dalam folder bot.`)
    let st
    try { st = fs.statSync(aman.abs) } catch { return m.reply(`❌ Tidak ada: ${rel}`) }
    if (st.isDirectory()) return m.reply(`❌ Itu folder. Pakai \`${P}ls\` / \`.bash ls\`.`)
    if (st.size > MAKS_FILE_NANO) return m.reply(`❌ File terlalu besar (${manusiawi(st.size)}) — maks ${manusiawi(MAKS_FILE_NANO)}.`)

    const isi = fs.readFileSync(aman.abs, 'utf8')
    const baris = isi.split('\n')
    if (isi.endsWith('\n')) baris.pop()

    if (aksi === 'lihat') {
      const tampil = baris.slice(0, 60).map((b, i) => `${String(i + 1).padStart(4)} │ ${b}`).join('\n')
      return m.reply(
        `✏️ *${rel}* — ${baris.length} baris · ${manusiawi(st.size)}\n\`\`\`\n${truncate(tampil, MAKS_TAMPIL)}\n\`\`\`` +
        (baris.length > 60 ? `\n_… ${baris.length - 60} baris lagi_` : '')
      )
    }
    if (aksi === 'tambah') {
      if (!sisa) return m.reply(`Contoh: \`${P}nano ${rel} tambah // catatan baru\``)
      baris.push(sisa)
    } else if (aksi === 'ganti') {
      const g = sisa.match(/^(\d+)\s+([\s\S]*)$/)
      if (!g) return m.reply(`Contoh: \`${P}nano ${rel} ganti 5 isi baris baru\``)
      const n = parseInt(g[1], 10)
      if (n < 1 || n > baris.length) return m.reply(`❌ Baris ${n} tidak ada (file ${baris.length} baris).`)
      baris[n - 1] = g[2]
    } else if (aksi === 'hapus') {
      const n = parseInt(sisa, 10)
      if (!n || n < 1 || n > baris.length) return m.reply(`❌ Baris ${sisa} tidak ada (file ${baris.length} baris).`)
      baris.splice(n - 1, 1)
    }
    fs.writeFileSync(aman.abs, baris.join('\n') + '\n')
    await m.react?.('✅').catch(() => {})
    return m.reply(`✏️ *${rel}* disimpan — sekarang ${baris.length} baris.\n\`${aksi}\` baris: ${aksi === 'tambah' ? 'ditambahkan di akhir' : aksi === 'ganti' ? 'diganti' : 'dihapus'}`)
  }
}

/* ============================ .http ============================ */
export const httpCmd = {
  command: ['http', 'httpreq', 'reqhttp'],
  category: 'Owner Menu',
  description: '🌐 Cek URL: status, ukuran, header, cuplikan isi (ala curl ringkas)',
  owner: true,
  limit: 0,
  cooldown: 3,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    const q = String(m.q || '').trim()
    const mx = q.match(/-X\s+(GET|POST|HEAD|PUT|DELETE)\s+([\s\S]*)/i) || q.match(/^(\S+)$/)
    let metode = 'GET', arg = q
    if (mx && mx.length === 3) { metode = mx[1].toUpperCase(); arg = mx[2] }
    const dm = arg.match(/^(\S+)\s+-d\s+([\s\S]+)$/)
    let body = null
    if (dm) { arg = dm[1]; body = dm[2]; if (!mx) metode = 'POST' }
    if (!/^https?:\/\//i.test(arg)) {
      return m.reply(`🌐 *HTTP*\n\n\`${P}http https://example.com\`\n\`${P}http -X POST https://api.x.com/v1 -d {"a":1}\`\n\`${P}http -X HEAD https://example.com\``)
    }
    await m.react?.('🌐').catch(() => {})
    const t0 = Date.now()
    try {
      const res = await fetch(arg, {
        method: metode,
        headers: { 'user-agent': 'Mozilla/5.0 (THERYHANN-BOT)' },
        body: body ?? undefined,
        signal: AbortSignal.timeout(30000)
      })
      const lama = Date.now() - t0
      const ct = res.headers.get('content-type') || '-'
      const cl = res.headers.get('content-length')
      let cuplikan = ''
      if (metode !== 'HEAD') {
        const buf = Buffer.from(await res.arrayBuffer())
        cuplikan = /json|text|html|xml/.test(ct) ? truncate(buf.toString('utf8'), 900) : `_(biner ${manusiawi(buf.length)})_`
      }
      return m.reply(
        `🌐 *${metode} ${truncate(arg, 60)}*\n\n` +
        `▸ Status: *${res.status} ${res.statusText || ''}*\n` +
        `▸ Waktu: ${lama} ms\n` +
        `▸ Tipe: ${truncate(ct, 50)}\n` +
        `▸ Ukuran: ${cl ? manusiawi(parseInt(cl, 10)) : '-'}\n` +
        (cuplikan ? `\n\`\`\`\n${cuplikan}\n\`\`\`` : '')
      )
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply(`❌ Gagal ${metode} ${truncate(arg, 50)}: ${truncate(String(e?.message || e), 150)}`)
    }
  }
}

/* ============================ .uname / .df / .free / .date ============================ */
export const unameCmd = {
  command: ['uname', 'infosis'],
  category: 'Owner Menu',
  description: '🖥️ Info sistem ala `uname -a`',
  owner: true, limit: 0, cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    return m.reply(
      `🖥️ *UNAME*\n\`\`\`\n${os.type()} ${os.hostname()} ${os.release()} ${os.arch()}\nNode ${process.version} · ${process.platform}\nUptime: ${Math.floor(os.uptime() / 3600)} jam ${Math.floor((os.uptime() % 3600) / 60)} menit\nCPU: ${os.cpus()[0]?.model || '-'} (${os.cpus().length} inti)\n\`\`\``
    )
  }
}

export const dfCmd = {
  command: ['df', 'diskinfo', 'infodisk'],
  category: 'Owner Menu',
  description: '💾 Kapasitas penyimpanan ala `df -h` (folder bot)',
  owner: true, limit: 0, cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    try {
      const s = fs.statfsSync(ROOT)
      const total = s.blocks * s.bsize
      const bebas = s.bfree * s.bsize
      const dipakai = total - bebas
      const persen = total ? Math.round((dipakai / total) * 100) : 0
      return m.reply(
        `💾 *DF — folder bot*\n\`\`\`\nSistem file : ${ROOT}\nTotal      : ${manusiawi(total)}\nDipakai    : ${manusiawi(dipakai)} (${persen}%)\nTersedia   : ${manusiawi(bebas)}\n\`\`\``
      )
    } catch (e) { return m.reply(`❌ ${truncate(String(e?.message || e), 150)}`) }
  }
}

export const freeCmd = {
  command: ['free', 'infomem'],
  category: 'Owner Menu',
  description: '🧠 Memori ala `free -h`',
  owner: true, limit: 0, cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    const total = os.totalmem(), bebas = os.freemem(), pakai = total - bebas
    const heap = process.memoryUsage()
    return m.reply(
      `🧠 *FREE*\n\`\`\`\n             total        dipakai       bebas\nMemori   : ${manusiawi(total).padEnd(12)} ${manusiawi(pakai).padEnd(13)} ${manusiawi(bebas)}\nHeap bot : rss ${manusiawi(heap.rss)} · heap ${manusiawi(heap.heapUsed)}/${manusiawi(heap.heapTotal)}\n\`\`\``
    )
  }
}

export const dateCmd = {
  command: ['date', 'tanggal'],
  category: 'Owner Menu',
  description: '📅 Tanggal & waktu ala `date` (WIB + UTC + epoch)',
  owner: true, limit: 0, cooldown: 2,
  run: async m => {
    if (!m.isOwner) return tolakBukanOwner(m)
    const kini = new Date()
    return m.reply(
      `📅 *DATE*\n\`\`\`\nWIB   : ${kini.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}\nUTC   : ${kini.toUTCString()}\nISO   : ${kini.toISOString()}\nEpoch : ${Math.floor(kini.getTime() / 1000)}\n\`\`\``
    )
  }
}

export default { jsonCmd, wgetCmd, nanoCmd, httpCmd, unameCmd, dfCmd, freeCmd, dateCmd }
