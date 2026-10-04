/**
 * ============================================================================
 *  🐚 .bash — SHELL TERMUX DI DALAM WHATSAPP (tanpa prefix)
 * ============================================================================
 *  Kegunaannya sama seperti terminal Termux: ketik perintah, dapat keluaran.
 *
 *  Yang membedakan dari `$exec` / `.jalankanperintah` yang sudah ada:
 *    1. BISA TANPA PREFIX. Aktifkan mode shell di satu chat, lalu ketik
 *       `ls -la`, `npm install`, `git status` langsung — persis di Termux.
 *    2. FOLDER KERJA INGAT. `cd features` lalu `ls` = isi features.
 *       (`$exec` selalu mulai dari folder bot.)
 *    3. Ada waktu tunggu + batas keluaran supaya bot tidak macet.
 *
 *  ⚠️ KHUSUS OWNER. Perintah shell = kendali penuh atas HP/server.
 *     Mode shell juga hanya milik owner yang menyalakannya, di chat itu saja.
 *
 *  Perintah:
 *    .bash <perintah>     jalankan sekali (tetap pakai prefix)
 *    .bash on             nyalakan mode tanpa-prefix di chat ini
 *    .bash off            matikan (atau ketik `exit` saat mode nyala)
 *    .bash cd <folder>    pindah folder (ingat antar perintah)
 *    .bash folder         folder kerja sekarang
 *    .bash waktu <dtk>    batas waktu tunggu (1-120, bawaan 15)
 *    .bash status         mode nyala/mati + folder + waktu
 *
 *  Saat mode nyala, ketik tanpa prefix:
 *    ls -la · pwd · cd lib · cat config.js · npm ls · git status · df -h
 *    exit  → keluar dari mode shell
 *    clear → bersihkan
 * ============================================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { loadDB, saveNow } from '../lib/database.js'
import { truncate } from '../lib/functions.js'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const P = config.display.prefix

const WAKTU_BAWAAN = 15          // detik
const WAKTU_MAKS = 120           // detik
const MAKS_BUFFER = 512 * 1024   // 512 KB keluaran mentah
const MAKS_TAMPIL = 3000         // karakter yang dikirim ke WhatsApp

/* Perintah interaktif: tidak punya ujung, pasti menggantung sampai timeout.
   Bukan soal keamanan (ini owner-only), tapi supaya tidak buang waktu 15 detik
   untuk sesuatu yang memang tidak akan pernah selesai di dalam bot. */
const INTERAKTIF = /^(nano|vim|vi|emacs|top|htop|btop|less|more|man|gdb|python3?|node|mysql|psql|sqlite3|ssh|telnet|ftp|nmtui|cfdisk|fdisk|apt|pkg)\b/

/* --------------------------------------------------------------------------
 * State disimpan di globalThis, BUKAN di variabel modul.
 * lib/plugins.js memuat plugin dengan import('file://...?v='+Date.now()), jadi
 * salinan modul plugin BERBEDA dari salinan yang di-import handlers/message.js.
 * Map di level modul akan jadi dua buah dan mode shell tidak pernah terbaca.
 * -------------------------------------------------------------------------- */
const GFOLDER = '__THERYHANN_BASH_CWD__'
if (!globalThis[GFOLDER] || typeof globalThis[GFOLDER].get !== 'function') globalThis[GFOLDER] = new Map()
const folderAktif = globalThis[GFOLDER]

const FILE_MODE = 'bashmode'   // database/bashmode.json — supaya tahan restart

/* Daftar chat yang SHELL-nya DIMATIKAN, dibaca lib/serializer.js.
   Mode shell BAWAANNYA NYALA untuk owner di semua chat, jadi yang perlu dibagikan
   justru pengecualiannya. Kalau chat ada di daftar ini, `ls`/`cd`/`pwd`/`cat`/
   `clear` tanpa prefix kembali jadi perintah bot (.ls/.cd milik bangc.js).
   User biasa tidak terpengaruh: checkBash menolak mereka lebih dulu. */
export const KUNCI_MATI = '__THERYHANN_BASH_MATI__'
if (!globalThis[KUNCI_MATI] || typeof globalThis[KUNCI_MATI].has !== 'function') globalThis[KUNCI_MATI] = new Set()
const chatMati = globalThis[KUNCI_MATI]

/* ---- mode shell DISIMPAN, bukan cuma di memori ----
   Sebelumnya mode hilang setiap bot restart, jadi owner harus `.bash on`
   lagi tiap kali. Sekarang disimpan di database/bashmode.json. */
function dbMode () {
  const d = loadDB(FILE_MODE, { chat: {} })
  if (!d.chat) d.chat = {}
  return d
}
function bacaMode (jid) { return dbMode().chat[jid] || null }
/** null = pakai bawaan (NYALA). {mati:true} = dimatikan. selain itu = setelan. */
function tulisMode (jid, mode) {
  const d = dbMode()
  if (mode) d.chat[jid] = mode
  else delete d.chat[jid]
  try { saveNow(FILE_MODE) } catch {}
  if (mode?.mati) chatMati.add(jid)
  else chatMati.delete(jid)
}

/* ---- MUAT ULANG saat bot dinyalakan ---- */
export function muatModeShell () {
  try {
    const d = dbMode()
    let n = 0
    chatMati.clear()
    for (const [jid, r] of Object.entries(d.chat || {})) {
      if (r?.mati) { chatMati.add(jid); n++ }
    }
    return n
  } catch { return 0 }
}
try { muatModeShell() } catch {}

/** setelan chat ini: null hanya kalau chat itu dimatikan lewat .bash off */
function modeChat (jid) {
  const r = bacaMode(jid)
  if (r?.mati) return null
  return { oleh: r?.oleh || '', detik: Number(r?.detik) || WAKTU_BAWAAN, mati: false }
}

/* ============================ util ============================ */

/** nama folder untuk tampilan: ROOT jadi '~' */
export function tampilFolder (abs) {
  if (abs === ROOT) return '~'
  if (abs.startsWith(ROOT + path.sep)) return '~/' + abs.slice(ROOT.length + 1).split(path.sep).join('/')
  return abs
}

/** folder kerja chat ini (selalu di dalam ROOT) */
export function folderChat (jid) {
  const f = folderAktif.get(jid)
  if (f && fs.existsSync(f) && fs.statSync(f).isDirectory()) return f
  return ROOT
}

/**
 * Amankan path: tolak keluar dari folder bot.
 * @returns {{ok:true, abs:string}|{ok:false, sebab:string}}
 */
export function pathAman (rel, cwd = ROOT) {
  const bersih = String(rel || '').trim().replace(/\\/g, '/').replace(/^["']|["']$/g, '')
  if (!bersih) return { ok: false, sebab: 'kosong' }
  if (/^[a-zA-Z]:[\\/]/.test(bersih)) return { ok: false, sebab: 'absolut Windows' }
  if (bersih.startsWith('/')) return { ok: false, sebab: 'absolut' }
  if (bersih.startsWith('~')) return { ok: false, sebab: 'home' }
  const abs = path.resolve(cwd, bersih)
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return { ok: false, sebab: 'traversal' }
  return { ok: true, abs }
}

/** potong keluaran: simpan kepala + ekor, buang tengahnya */
export function potongTengah (teks, maks = MAKS_TAMPIL) {
  const s = String(teks ?? '')
  if (s.length <= maks) return s
  const kepala = Math.floor(maks * 0.7)
  const ekor = maks - kepala
  const buang = s.length - kepala - ekor
  return `${s.slice(0, kepala)}\n\n... (${buang.toLocaleString('id-ID')} karakter dibuang) ...\n\n${s.slice(-ekor)}`
}

/** jalankan satu perintah shell di folder tertentu */
export function jalanPerintah (perintah, cwd, detik = WAKTU_BAWAAN) {
  return new Promise(res => {
    exec(String(perintah), {
      cwd,
      timeout: Math.max(1, Math.min(WAKTU_MAKS, Number(detik) || WAKTU_BAWAAN)) * 1000,
      maxBuffer: MAKS_BUFFER,
      env: { ...process.env, TERM: 'dumb', FORCE_COLOR: '0', NO_COLOR: '1' }
    }, (err, stdout, stderr) => {
      res({
        keluar: String(stdout || ''),
        galat: String(stderr || ''),
        kode: err ? (typeof err.code === 'number' ? err.code : 1) : 0,
        pesanErr: err?.killed ? 'waktu habis' : (err?.message || ''),
        waktuHabis: !!err?.killed
      })
    })
  })
}

/** format hasil jadi pesan ala terminal */
export function formatHasil (perintah, h) {
  const kepala = `🐚 \`\`\`$ ${truncate(String(perintah), 160)}\`\`\``
  const keluar = h.keluar.replace(/\s+$/, '')
  const galat = h.galat.replace(/\s+$/, '')
  let isi = ''
  if (keluar) isi += `\`\`\`\n${potongTengah(keluar)}\n\`\`\``
  if (galat) isi += `${isi ? '\n' : ''}⚠️ \`\`\`\n${potongTengah(galat, 900)}\n\`\`\``
  if (h.waktuHabis) isi += `\n⏱️ *Waktu habis* — perintah dihentikan. Naikkan batas: \`${P}bash waktu 60\``
  if (!keluar && !galat && !h.waktuHabis) isi = '_(tidak ada keluaran)_'
  const ekor = h.kode ? `\n❌ kode keluar: *${h.kode}*${h.pesanErr && !h.waktuHabis ? ' — ' + truncate(h.pesanErr, 120) : ''}` : ''
  return `${kepala}\n\n${isi}${ekor}`
}

/**
 * Tangani `cd` ala Termux: ~ = folder bot, .. = naik, - = folder sebelumnya.
 * @returns {string} pesan balasan
 */
export async function pindahFolder (jid, arg) {
  const cwd = folderChat(jid)
  const tujuan = String(arg || '').trim()
  if (!tujuan || tujuan === '~') {
    folderAktif.set(jid, ROOT)
    return `📂 ${tampilFolder(ROOT)}`
  }
  const aman = pathAman(tujuan, cwd)
  if (!aman.ok) return `🔒 Ditolak: ${aman.sebab}. Tetap di dalam folder bot ya.`
  let st
  try { st = fs.statSync(aman.abs) } catch { return `❌ Tidak ada: ${tampilFolder(aman.abs)}` }
  if (!st.isDirectory()) return `❌ Bukan folder: ${tampilFolder(aman.abs)}`
  folderAktif.set(jid, aman.abs)
  return `📂 ${tampilFolder(aman.abs)}`
}

/* ==================================================================
 *  checkBash — dipanggil handlers/message.js sebelum routing
 * ================================================================== */
/**
 * Tangkap pesan TANPA prefix saat mode shell menyala.
 * Mengembalikan { handled: true } bila pesan sudah dipakai sebagai perintah.
 */
export async function checkBash (m) {
  try {
    if (!m?.jid) return null
    if (!m.isOwner) return null            // mode shell milik owner saja
    if (m.isCommand) return null           // perintah bot tetap jalan normal
    const mode = modeChat(m.jid)
    if (!mode) return null
  
    const perintah = String(m.text || '').trim()
    if (!perintah) return null

    /* keluar dari mode shell */
    if (/^(exit|keluar|quit)$/i.test(perintah)) {
      tulisMode(m.jid, { mati: true })
      await m.reply(`🐚 Mode shell *dimatikan* di chat ini.\nNyalakan lagi: \`${P}bash on\``).catch(() => {})
      return { handled: true }
    }

    /* bersihkan layar */
    if (/^clear$/i.test(perintah)) {
      await m.react?.('🧹').catch(() => {})
      return { handled: true }
    }

    /* cd — harus ditangani sendiri supaya foldernya ingat */
    const mCd = perintah.match(/^cd(?:\s+([\s\S]*))?$/i)
    if (mCd) {
      const balas = await pindahFolder(m.jid, mCd[1] || '~')
      await m.reply(balas).catch(() => {})
      return { handled: true }
    }

    if (INTERAKTIF.test(perintah)) {
      await m.reply(
        `⛔ \`${perintah.split(/\s+/)[0]}\` adalah perintah *interaktif* — dia menunggu ketikan ` +
        `dan tidak akan pernah selesai di dalam bot.\nJalankan langsung di Termux ya.`
      ).catch(() => {})
      return { handled: true }
    }

    const cwd = folderChat(m.jid)
    await m.react?.('🐚').catch(() => {})
    const h = await jalanPerintah(perintah, cwd, mode.detik)
    await m.reply(formatHasil(perintah, h)).catch(() => {})
    return { handled: true }
  } catch { return null }
}

/* ==================================================================
 *  plugin .bash
 * ================================================================== */
export const bashCmd = {
  command: ['bash', 'sh', 'termux', 'terminal', 'konsol'],
  category: 'Owner Menu',
  description: '🐚 Shell Termux di WhatsApp — bisa tanpa prefix, foldernya ingat',
  owner: false,          // dijaga di dalam run; user biasa dapat penjelasan
  limit: 0,
  cooldown: 1,
  contoh: 'ls -la',
  run: async m => {
    if (!m.isOwner) {
      return m.reply(
        `🐚 *BASH*\n\nFitur ini *khusus Owner* — isinya kendali penuh atas HP/server.\n` +
        `Kamu bisa pakai fitur lain lewat \`${P}menu\`.`
      )
    }

    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const sub = (q.split(/\s+/)[0] || '').toLowerCase()
    const sisa = q.slice(sub.length).trim()
    const cwd = folderChat(m.jid)
    const mode = modeChat(m.jid)   // null = chat ini dimatikan lewat .bash off

    /* ---- mode tanpa prefix ---- */
    if (/^(on|aktif|nyala|mulai|start)$/i.test(sub)) {
      const detik = mode?.detik || WAKTU_BAWAAN
      tulisMode(m.jid, { oleh: m.senderKey || m.sender, sejak: Date.now(), detik })
      await m.react?.('🐚').catch(() => {})
      return m.reply(
        `🐚 *MODE SHELL NYALA* di chat ini — dan *tersimpan*, jadi tetap nyala setelah bot restart.\n\n` +
        `Ketik perintah *tanpa* \`${P}\` — persis di Termux:\n` +
        `\`\`\`ls -la\npwd\ncd features\ncat config.js\nnpm ls\ngit status\ndf -h\nuptime\`\`\`\n\n` +
        `📂 Folder: \`${tampilFolder(cwd)}\` · ⏱️ Batas: ${detik} detik\n` +
        `Matikan: \`${P}bash off\`\n\n` +
        `ℹ️ Pesan yang berawalan \`${P}\` tetap jadi perintah bot biasa.`
      )
    }
    if (/^(off|mati|nonaktif|stop|exit|keluar)$/i.test(sub)) {
      const ada = !bacaMode(m.jid)?.mati
      tulisMode(m.jid, { mati: true })
      return m.reply(ada
        ? `🐚 Mode shell *dimatikan* di chat ini.\nPesan biasamu tidak lagi dianggap perintah shell.\nNyalakan lagi: \`${P}bash on\``
        : `ℹ️ Mode shell memang belum nyala di chat ini.`)
    }

    /* ---- cd / folder ---- */
    if (sub === 'cd' || sub === 'pindah') return m.reply(await pindahFolder(m.jid, sisa))
    /* catatan: `pwd` SENGAJA tidak jadi sub-perintah — biar `.bash pwd`
       menjalankan pwd sungguhan seperti di Termux. Pakai `.bash folder`. */
    if (/^(folder|dimana|where)$/i.test(sub)) {
      const daftar = (() => {
        try {
          return fs.readdirSync(cwd, { withFileTypes: true })
            .filter(e => e.name !== 'node_modules')
            .slice(0, 30)
            .map(e => (e.isDirectory() ? '📂 ' : '📄 ') + e.name)
            .join('\n')
        } catch { return '(tidak bisa dibaca)' }
      })()
      return m.reply(`📂 *${tampilFolder(cwd)}*\n\n${daftar || '(folder kosong)'}`)
    }

    /* ---- waktu tunggu ---- */
    if (/^(waktu|timeout|batas)$/i.test(sub)) {
      const d = parseInt(sisa, 10)
      if (!d || d < 1 || d > WAKTU_MAKS) {
        return m.reply(`⏱️ Batas waktu sekarang: *${mode?.detik || WAKTU_BAWAAN} detik*\n\nUbah: \`${P}bash waktu 1-${WAKTU_MAKS}\`\nContoh: \`${P}bash waktu 60\``)
      }
      tulisMode(m.jid, { oleh: m.senderKey || m.sender, sejak: Date.now(), detik: d })
      return m.reply(`⏱️ Batas waktu jadi *${d} detik* di chat ini.`)
    }

    /* ---- status ---- */
    if (/^(status|cek|info)$/i.test(sub)) {
      return m.reply(
        `🐚 *STATUS SHELL*\n\n` +
        `Mode tanpa prefix: ${mode ? '✅ NYALA (bawaan)' : '⏸️ MATI'} — tersimpan, tahan restart\n` +
        `📂 Folder: \`${tampilFolder(cwd)}\`\n` +
        `⏱️ Batas waktu: ${mode?.detik || WAKTU_BAWAAN} detik\n` +
        `💻 Node ${process.version} · ${process.platform}\n\n` +
        `${mode ? `Matikan: \`${P}bash off\`` : `Nyalakan: \`${P}bash on\``}`
      )
    }

    /* ---- panduan ---- */
    if (!q || /^(help|bantuan|\?)$/i.test(sub)) {
      return m.reply(
        `🐚 *BASH — TERMUX DI WHATSAPP*\n\n` +
        `*Jalankan sekali (pakai prefix):*\n` +
        `\`${P}bash ls -la\`\n\`${P}bash df -h\`\n\`${P}bash npm ls\`\n\n` +
        `*Mode tanpa prefix (persis Termux):*\n` +
        `\`${P}bash on\`  → chat ini jadi terminal: ketik \`ls -la\`, \`cd lib\`, \`cat config.js\` tanpa \`${P}\`\n` +
        `\`${P}bash off\` → kembali jadi chat biasa\n` +
        `Setelannya *tersimpan*, jadi tetap nyala setelah bot restart.\n\n` +
        `*Lainnya:*\n` +
        `\`${P}bash cd <folder>\` pindah folder (ingat antar perintah)\n` +
        `\`${P}bash folder\`    folder sekarang + isinya\n` +
        `\`${P}bash waktu 60\`  batas waktu tunggu (1-${WAKTU_MAKS} dtk)\n` +
        `\`${P}bash status\`    mode / folder / versi Node\n\n` +
        `⚠️ Khusus Owner. Perintah interaktif (\`nano\`, \`top\`, \`apt\`) ditolak\n` +
        `karena tidak akan pernah selesai di dalam bot.`
      )
    }

    /* ---- jalankan perintah ---- */
    if (INTERAKTIF.test(q)) {
      return m.reply(
        `⛔ \`${q.split(/\s+/)[0]}\` adalah perintah *interaktif* — dia menunggu ketikan ` +
        `dan tidak akan pernah selesai di dalam bot.\nJalankan langsung di Termux ya.`
      )
    }
    const mCd = q.match(/^cd(?:\s+([\s\S]*))?$/i)
    if (mCd) return m.reply(await pindahFolder(m.jid, mCd[1] || '~'))

    await m.react?.('🐚').catch(() => {})
    const h = await jalanPerintah(q, cwd, mode?.detik || WAKTU_BAWAAN)
    return m.reply(formatHasil(q, h))
  }
}

export default { bashCmd }
