/**
 * 🚫 .bangc + 📂 ls (tanpa prefix) + 📄 .kode  v7.37.0
 * ------------------------------------------------------------------
 *  • .bangc [alasan]     BANNED grup ini: bot berhenti merespons apa pun
 *                        di grup itu. Owner tetap bisa masuk untuk
 *                        membatalkan lewat `.bangc batal`.
 *  • .bangc batal        cabut banned
 *  • .bangc list         daftar grup yang dibanned
 *  • .bangc cek          status grup ini
 *
 *  • ls -la              daftar file di folder bot, TANPA prefix "."
 *    ls                  (gaya Termux: nama file saja, per kolom)
 *    ls -l               panjang (izin, ukuran, tanggal, nama)
 *    ls -a               sertakan file tersembunyi
 *    ls <folder>         masuk subfolder (features, lib, scripts, …)
 *    cd <folder>         pindah folder (disimpan per chat)
 *    pwd                 folder aktif
 *
 *  • .kode <nama>        tampilkan isi file (penampil kode di WhatsApp)
 *
 *  Keamanan: SEMUA path disanitasi. `..`, symlink keluar folder bot, dan
 *  path absolut ditolak — penampil file tidak boleh jadi alat baca
 *  sembarang berkas di server.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { loadDB, saveNow, allGroups } from '../lib/database.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const MAKS_TAMPIL = 3200
const MAKS_BARIS_LS = 60

/** folder yang boleh dijelajahi (relatif terhadap root bot) */
const FOLDER_BOLEH = ['features', 'lib', 'scripts', 'handlers', 'database', 'media', 'tmp', 'tools', 'data']

/* ================================================================== */
/*  util: path aman                                                    */
/* ================================================================== */

/**
 * Selesaikan path relatif terhadap folder aktif, lalu PASTIKAN hasilnya
 * masih di dalam root bot. Menolak `..`, path absolut, dan symlink yang
 * keluar dari folder bot.
 * @returns {{ok:boolean, abs:string, rel:string, galat:string}}
 */
export function pathAman (input, cwdRel = '') {
  const mentah = String(input || '').trim()
  if (!mentah) return { ok: false, abs: '', rel: '', galat: 'path kosong' }

  /* tolak path absolut & skema aneh sejak awal */
  if (/^([a-zA-Z]:[\\/]|\/|~)/.test(mentah)) {
    return { ok: false, abs: '', rel: '', galat: 'path absolut tidak diizinkan' }
  }
  /* tolak traversal di segmen mana pun */
  const segmen = mentah.split(/[\\/]/)
  if (segmen.some(s => s === '..')) {
    return { ok: false, abs: '', rel: '', galat: '`..` tidak diizinkan (anti traversal)' }
  }

  const dasar = path.resolve(ROOT, cwdRel || '')
  const abs = path.resolve(dasar, mentah)

  /* harus tetap di dalam ROOT */
  const rel = path.relative(ROOT, abs)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, abs: '', rel: '', galat: 'di luar folder bot' }
  }

  /* tolak symlink yang menunjuk keluar root */
  try {
    const st = fs.lstatSync(abs)
    if (st.isSymbolicLink()) {
      const tujuan = fs.realpathSync(abs)
      const relTujuan = path.relative(ROOT, tujuan)
      if (relTujuan.startsWith('..') || path.isAbsolute(relTujuan)) {
        return { ok: false, abs: '', rel: '', galat: 'symlink menunjuk ke luar folder bot' }
      }
    }
  } catch { /* tidak ada = biar pemeriksa berikutnya yang menangani */ }

  return { ok: true, abs, rel: rel || '.', galat: '' }
}

/** format ukuran gaya `ls -l` (manusiawi) */
export function ukuranManusiawi (n) {
  const b = Number(n) || 0
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

/** bit izin -> rwxr-xr-x */
export function izinKeRwx (mode) {
  const bit = (mode & 0o777)
  const rwx = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
  return rwx[(bit >> 6) & 7] + rwx[(bit >> 3) & 7] + rwx[bit & 7]
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function tanggalLs (ms) {
  const d = new Date(ms)
  return `${String(d.getDate()).padStart(2, '0')} ${BULAN[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Bangun keluaran `ls`.
 * @returns {{teks:string, galat:string}}
 */
export function buatLs (absDir, { panjang = false, semua = false, rel = '.' } = {}) {
  let entri
  try { entri = fs.readdirSync(absDir, { withFileTypes: true }) } catch (e) {
    return { teks: '', galat: `Tidak bisa membaca folder: ${truncate(String(e?.message || e), 120)}` }
  }

  let daftar = entri
  if (!semua) daftar = daftar.filter(e => !e.name.startsWith('.'))
  if (!daftar.length) return { teks: `(folder ${rel} kosong)`, galat: '' }

  /* urutkan: folder dulu, lalu file, masing-masing alfabetis */
  daftar.sort((a, b) => {
    const af = a.isDirectory() ? 0 : 1
    const bf = b.isDirectory() ? 0 : 1
    if (af !== bf) return af - bf
    return a.name.localeCompare(b.name)
  })

  const total = daftar.length
  const dipotong = total > MAKS_BARIS_LS
  const tampil = dipotong ? daftar.slice(0, MAKS_BARIS_LS) : daftar

  if (!panjang) {
    const lebar = tampil.reduce((m, e) => Math.max(m, e.name.length), 0) + (1)
    const kolom = 3
    const baris = []
    for (let i = 0; i < tampil.length; i += kolom) {
      baris.push(tampil.slice(i, i + kolom)
        .map(e => (e.name + (e.isDirectory() ? '/' : '')).padEnd(lebar))
        .join(''))
    }
    const header = `📂 ${rel} — ${total} entri\n\n`
    return { teks: header + baris.join('\n') + (dipotong ? `\n… ${total - MAKS_BARIS_LS} entri lagi` : ''), galat: '' }
  }

  const baris = tampil.map(e => {
    const p = path.join(absDir, e.name)
    let st
    try { st = fs.statSync(p) } catch { st = null }
    const tipe = e.isDirectory() ? 'd' : e.isSymbolicLink() ? 'l' : '-'
    const izin = st ? izinKeRwx(st.mode) : '---------'
    const ukuran = st ? ukuranManusiawi(st.size) : '-'
    const waktu = st ? tanggalLs(st.mtimeMs) : '-'
    return `${tipe}${izin} ${ukuran.padStart(9)} ${waktu}  ${e.name}${e.isDirectory() ? '/' : ''}`
  })
  const jumlahFolder = daftar.filter(e => e.isDirectory()).length
  const header =
    `📂 ${rel} — ${total} entri (${jumlahFolder} folder, ${total - jumlahFolder} file)\n\n`
  return { teks: header + baris.join('\n') + (dipotong ? `\n… ${total - MAKS_BARIS_LS} entri lagi` : ''), galat: '' }
}

/* folder aktif per chat (tidak persisten antar restart — memang ringan) */
const folderAktif = new Map()

/** urai argumen ls: `ls -la folder` -> {flag, target} */
export function uraiLs (teks) {
  const bagian = String(teks || '').trim().split(/\s+/).filter(Boolean)
  bagian.shift() // buang kata "ls"
  const flag = { panjang: false, semua: false }
  const target = []
  for (const b of bagian) {
    if (/^-{1,2}[a-zA-Z]+$/.test(b)) {
      const huruf = b.replace(/^-+/, '').toLowerCase()
      if (huruf.includes('l')) flag.panjang = true
      if (huruf.includes('a')) flag.semua = true
    } else {
      target.push(b)
    }
  }
  return { flag, target: target.join('/') }
}

/* ================================================================== */
/*  1. .bangc — banned grup                                            */
/* ================================================================== */
function dbGrupBan () {
  const d = loadDB('groupban', { grup: {} })
  if (!d.grup) d.grup = {}
  return d
}

export const banGrup = {
  command: ['bangc', 'bangrup', 'bannedgrup', 'groupban', 'blokirgrup', 'bangroup'],
  category: 'Owner Menu',
  description: '🚫 Banned grup agar bot tidak bisa dipakai di sana — `.bangc [alasan]`',
  owner: true,
  limit: 0,
  cooldown: 2,
  contoh: 'spam perintah',
  run: async m => {
    if (!m.isGroup) {
      return m.reply(`❌ \`${P}bangc\` hanya bisa dipakai *di dalam grup* yang mau dibanned.\n\nLihat daftar: \`${P}bangc list\``)
    }

    const d = dbGrupBan()
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const sub = q.split(/\s+/)[0]?.toLowerCase() || ''
    const namaGrup = m.groupName || m.jid
    const sudah = !!d.grup[m.jid]

    /* ---- batal ---- */
    if (/^(batal|cabut|unban|buka|reset)$/i.test(sub)) {
      if (!sudah) return m.reply(`ℹ️ Grup *${namaGrup}* memang tidak dibanned.`)
      delete d.grup[m.jid]
      saveNow('groupban')
      await m.react?.('✅').catch(() => {})
      return m.sendButtons({
        title: '✅ Banned dicabut',
        text:
          `✅ *BANNED DICABUT* — ${namaGrup}\\n\\n` +
          `Bot kembali aktif di grup ini. Semua perintah bisa dipakai lagi.\\n\\n` +
          `Banned lagi: \`${P}bangc <alasan>\``,
        footer: config.bot.footer,
        buttons: [
          { text: '🏠 Menu', id: `${P}menu` },
          { text: '📋 Daftar banned', id: `${P}bangc list` }
        ]
      }).catch(() => m.reply(`✅ Banned dicabut untuk *${namaGrup}*.`))
    }

    /* ---- cek ---- */
    if (/^(cek|status|info)$/i.test(sub)) {
      return m.reply(
        `🚫 *STATUS GRUP* — ${namaGrup}\\n\\n` +
        `Banned: ${sudah ? '✅ YA' : '❌ tidak'}\\n` +
        (sudah
          ? `Alasan: ${d.grup[m.jid].alasan || '-'}\\nOleh: ${(d.grup[m.jid].oleh || '').split('@')[0]}\\nSejak: ${new Date(d.grup[m.jid].waktu).toLocaleString('id-ID')}\\n\\nCabut: \`${P}bangc batal\``
          : `Bot aktif normal di grup ini.\\n\\nBanned: \`${P}bangc <alasan>\``)
      )
    }

    /* ---- list ---- */
    if (/^(list|daftar|semua)$/i.test(sub) || (!q && false)) {
      const entri = Object.entries(d.grup)
      if (!entri.length) return m.reply(`📋 *Belum ada grup yang dibanned.*\n\nBanned grup ini: \`${P}bangc <alasan>\``)
      const teks =
        `🚫 *GRUP DIBANNED* (${entri.length})\\n\\n` +
        entri.slice(0, 25).map(([jid, r], i) =>
          `${i + 1}. \`${jid.split('@')[0]}\`\n   ${r.nama || '-'} · ${r.alasan || 'tanpa alasan'}\n   ${new Date(r.waktu).toLocaleDateString('id-ID')}`
        ).join('\n\n') +
        (entri.length > 25 ? `\n\n… ${entri.length - 25} grup lagi` : '') +
        `\n\nCabut di grup itu: \`${P}bangc batal\``
      return m.reply(teks)
    }

    /* ---- list tanpa argumen? tidak: tanpa argumen = banned ---- */
    if (!q) {
      return m.sendButtons({
        title: '🚫 Banned grup ini?',
        text:
          `🚫 *BANNED GRUP* — ${namaGrup}\\n\\n` +
          `Grup ini akan *berhenti dilayani bot*: semua perintah diabaikan, ` +
          `tidak ada balasan apa pun (kecuali owner membatalkan).\\n\\n` +
          `Sudah dibanned: ${sudah ? '✅ YA' : '❌ belum'}\\n\\n` +
          `Tekan *BANNED* untuk melanjutkan, atau sertakan alasan:\\n` +
          `\`${P}bangc spam perintah\``,
        footer: config.bot.footer,
        buttons: [
          { text: '🚫 BANNED sekarang', id: `${P}bangc tanpa alasan` },
          ...(sudah ? [{ text: '✅ Cabut banned', id: `${P}bangc batal` }] : []),
          { text: '📋 Daftar banned', id: `${P}bangc list` }
        ]
      }).catch(() => m.reply(`🚫 Banned grup ini: \`${P}bangc <alasan>\`\nCabut: \`${P}bangc batal\``))
    }

    /* ---- banned ---- */
    const alasan = /^(tanpa alasan|banned)$/i.test(q) ? '' : truncate(q, 120)
    d.grup[m.jid] = { jid: m.jid, nama: namaGrup, alasan, oleh: m.senderKey || m.sender, waktu: Date.now() }
    saveNow('groupban')

    await m.react?.('🚫').catch(() => {})
    const teks =
      `🚫 *GRUP DIBANNED* — ${namaGrup}\\n\\n` +
      (alasan ? `*Alasan:* ${alasan}\\n` : '') +
      `Mulai sekarang bot *tidak akan merespons apa pun* di grup ini.\\n` +
      `Semua perintah diabaikan diam-diam (tidak ada balasan, tidak ada error).\\n\\n` +
      `Owner tetap bisa membatalkan kapan saja:\\n\`${P}bangc batal\``

    return m.sendButtons({
      title: `🚫 ${truncate(namaGrup, 24)} dibanned`,
      text: teks,
      footer: config.bot.footer,
      buttons: [
        { text: '✅ Cabut banned', id: `${P}bangc batal` },
        { text: '📋 Daftar banned', id: `${P}bangc list` }
      ]
    }).catch(() => m.reply(teks))
  }
}

/* ================================================================== */
/*  2. ls / cd / pwd — dijalankan TANPA prefix                         */
/* ================================================================== */
export const lsTanpaPrefix = {
  command: ['ls', 'lsl', 'lsdir'],
  category: 'Owner Menu',
  description: '📂 Daftar file folder bot gaya Termux — bisa tanpa titik: `ls -la`',
  noPrefix: true,
  owner: true,
  limit: 0,
  cooldown: 1,
  contoh: '-la',
  run: async m => {
    const teks = String(m.text || m.q || '')
    const { flag, target } = uraiLs(teks)
    const cwd = folderAktif.get(m.jid) || ''

    const tujuan = target ? pathAman(target, cwd) : { ok: true, abs: path.resolve(ROOT, cwd), rel: cwd || '.' }
    if (!tujuan.ok) return m.reply(`❌ ${tujuan.galat}`)

    let st
    try { st = fs.statSync(tujuan.abs) } catch {
      return m.reply(`❌ Tidak ada: \`${tujuan.rel}\`\n\nCoba: \`ls -la\``)
    }
    if (!st.isDirectory()) {
      /* `ls file.js` -> tampilkan info file itu */
      return m.reply(
        `📄 *${path.basename(tujuan.abs)}*\\n\\n` +
        `${izinKeRwx(st.mode)} · ${ukuranManusiawi(st.size)}\\n` +
        `Diubah: ${new Date(st.mtimeMs).toLocaleString('id-ID')}\\n\\n` +
        `Lihat isinya: \`${P}kode ${tujuan.rel}\``
      )
    }

    const hasil = buatLs(tujuan.abs, { panjang: flag.panjang, semua: flag.semua, rel: tujuan.rel })
    if (hasil.galat) return m.reply(`❌ ${hasil.galat}`)
    /* PENTING: `ls` TIDAK memindahkan folder aktif — sama seperti Termux.
       Kalau `ls features` ikut pindah, `cd lib` berikutnya jadi
       `features/lib` dan membingungkan. Hanya `cd` yang boleh pindah. */

    const kaki =
      `\n\n▸ \`ls -l\` detail · \`ls -a\` file tersembunyi\n` +
      `▸ \`cd <folder>\` masuk · \`pwd\` folder aktif\n` +
      `▸ \`${P}kode <nama>\` lihat isi file`

    return m.reply('```\n' + hasil.teks + '\n```' + kaki).catch(() => m.reply(hasil.teks))
  }
}

export const cdFolder = {
  /* 'cd' wajib ada: serializer mengirim kata apa adanya untuk perintah
     tanpa prefix, jadi `cd lib` harus cocok dengan nama plugin 'cd'. */
  command: ['cd', 'cdfolder', 'pindahfolder', 'chdir'],
  category: 'Owner Menu',
  description: '📂 Pindah folder untuk `ls` — `cdfolder features`',
  noPrefix: true,
  owner: true,
  limit: 0,
  cooldown: 1,
  contoh: 'features',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const cwd = folderAktif.get(m.jid) || ''
    if (!q || q === '~' || q === '/') {
      folderAktif.set(m.jid, '')
      return m.reply(`📂 Kembali ke folder utama bot.\n\n\`ls -la\` untuk melihat isinya.`)
    }
    const tujuan = pathAman(q, cwd)
    if (!tujuan.ok) return m.reply(`❌ ${tujuan.galat}`)
    try {
      if (!fs.statSync(tujuan.abs).isDirectory()) return m.reply(`❌ \`${tujuan.rel}\` bukan folder.`)
    } catch { return m.reply(`❌ Tidak ada folder: \`${tujuan.rel}\``) }
    folderAktif.set(m.jid, tujuan.rel === '.' ? '' : tujuan.rel)
    return m.reply(`📂 Sekarang di: \`${tujuan.rel}\`\n\n\`ls -la\` untuk melihat isinya.`)
  }
}

export const pwdFolder = {
  command: ['pwd'],
  category: 'Owner Menu',
  description: '📂 Tunjukkan folder aktif untuk `ls`',
  noPrefix: true,
  owner: true,
  limit: 0,
  cooldown: 1,
  run: async m => {
    const cwd = folderAktif.get(m.jid) || ''
    return m.reply(`📂 Folder aktif: \`${cwd || '(root bot)'}\`\n\nPindah: \`cd <folder>\` · Kembali: \`cd ~\``)
  }
}

/* ================================================================== */
/*  3. .kode — penampil isi file                                       */
/* ================================================================== */
export const lihatKode = {
  command: ['kode', 'lihatkode', 'catkode', 'viewfile', 'isifile', 'kodefile'],
  category: 'Owner Menu',
  description: '📄 Lihat isi file bot di chat — `.kode features/uno.js`',
  owner: true,
  limit: 0,
  cooldown: 2,
  contoh: 'features/cateof.js',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    if (!q) {
      return m.reply(
        `📄 *LIHAT ISI FILE*\\n\\n` +
        `Cara: \`${P}kode <path file>\`\\n\\n` +
        `Contoh:\\n` +
        `\`${P}kode features/cateof.js\`\\n` +
        `\`${P}kode VERSION\`\\n` +
        `\`${P}kode lib/plugins.js\`\\n\\n` +
        `Jelajahi dulu dengan \`ls -la\` (tanpa titik).\\n` +
        `🔒 Hanya file di dalam folder bot — path absolut & \`..\` ditolak.`
      )
    }

    const cwd = folderAktif.get(m.jid) || ''
    let tujuan = pathAman(q, cwd)
    if (!tujuan.ok) return m.reply(`🔒 Ditolak: ${tujuan.galat}`)

    let st = null
    try { st = fs.statSync(tujuan.abs) } catch { st = null }
    /* kalau tidak ketemu di folder aktif, coba dari root bot — supaya
       `.kode VERSION` tetap jalan walau tadi sempat `cd features`. */
    if (!st && cwd) {
      const dariRoot = pathAman(q, '')
      if (dariRoot.ok) {
        try { st = fs.statSync(dariRoot.abs); tujuan = dariRoot } catch { st = null }
      }
    }
    if (!st) {
      return m.reply(`❌ Tidak ada: \`${tujuan.rel}\`\n\nCari dengan \`ls -la\`.`)
    }
    if (st.isDirectory()) {
      return m.reply(`📂 \`${tujuan.rel}\` adalah folder.\n\nLihat isinya: \`ls -la ${tujuan.rel}\``)
    }
    if (st.size > 512 * 1024) {
      return m.reply(`❌ File terlalu besar: ${ukuranManusiawi(st.size)} (maks 512 KB).`)
    }

    let isi
    try { isi = fs.readFileSync(tujuan.abs, 'utf8') } catch (e) {
      return m.reply(`❌ Gagal membaca: ${truncate(String(e?.message || e), 120)}`)
    }
    if (!isi.trim()) return m.reply(`📄 \`${tujuan.rel}\` kosong (0 baris).`)

    const baris = isi.split('\n')
    const nomorBaris = !/^off$|^nonomor$/i.test(String(m.args?.[1] || ''))
    const bernomor = nomorBaris
      ? baris.map((b, i) => String(i + 1).padStart(4, ' ') + ' | ' + b).join('\n')
      : isi

    const kepala =
      `📄 *${path.basename(tujuan.rel)}*\\n` +
      `📁 \`${path.dirname(tujuan.rel)}\`\\n` +
      `📏 ${ukuranManusiawi(st.size)} · ${baris.length} baris\\n\\n`

    if (Buffer.byteLength(bernomor) <= MAKS_TAMPIL) {
      return m.reply(kepala + '```' + bernomor + '```').catch(() => m.reply(kepala + truncate(isi, 1500)))
    }

    /* kepanjangan -> potong di batas baris utuh */
    let potong = 0
    let panjang = 0
    const bagian = nomorBaris ? bernomor.split('\n') : baris
    for (let i = 0; i < bagian.length; i++) {
      panjang += bagian[i].length + 1
      if (panjang > MAKS_TAMPIL) break
      potong = i + 1
    }
    const tampil = bagian.slice(0, Math.max(potong, 20)).join('\n')
    return m.reply(
      kepala + '```' + tampil + '```' +
      `\n\n⚠️ Ditampilkan ${Math.max(potong, 20)} dari ${baris.length} baris.\n` +
      `Sisanya: \`${P}kode ${tujuan.rel} ${Math.max(potong, 20) + 1}\``
    ).catch(() => m.reply(kepala + truncate(isi, 1500)))
  }
}

/* ================================================================== */
/*  Gerbang: diperiksa handlers/message.js sebelum routing              */
/* ================================================================== */
/**
 * Apakah grup ini dibanned? Owner dikecualikan supaya bisa `.bangc batal`.
 * @param {string} jid
 * @param {boolean} isOwner
 */
export function grupDibanned (jid, isOwner = false) {
  try {
    if (!jid || !String(jid).endsWith('@g.us')) return false
    const d = loadDB('groupban', { grup: {} })
    const rec = d?.grup?.[jid]
    if (!rec) return false
    if (isOwner) {
      /* owner boleh, TAPI hanya untuk membatalkan / cek / list */
      return false
    }
    return true
  } catch { return false }
}

/** apakah perintah ini boleh jalan di grup yang dibanned (khusus owner) */
export function bolehDiGrupBan (command) {
  const bebas = ['bangc', 'bangrup', 'bannedgrup', 'bangrup', 'groupban', 'blokirgrup']
  return bebas.includes(String(command || '').toLowerCase())
}

export default { banGrup, lsTanpaPrefix, cdFolder, pwdFolder, lihatKode }
