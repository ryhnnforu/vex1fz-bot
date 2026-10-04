/**
 * ============================================================
 *  lib/airichgame.js — MESIN GAME "AIRichResponseMessage" (v7)
 * ------------------------------------------------------------
 *  Satu engine untuk banyak game. Tiap game cukup mendaftarkan:
 *
 *    daftarGame('mine', {
 *      nama   : '💣 Minesweeper',            // label di menu/statistik
 *      init   : (m, opt) => state,           // state awal permainan
 *      render : (rich, s, m) => {...},       // isi pesan AI Rich
 *      teks   : (s) => 'papan versi teks',   // fallback + dipakai test
 *      pill   : (s) => ['A1','A2',...],      // tombol saran (opsional)
 *      tip    : 'Ketuk pill untuk main',     // hint (opsional)
 *      jawab  : async (m, s, text) => true   // true = pesan ditangani
 *    })
 *
 *  Fitur engine:
 *   • kirim sebagai AIRich (richResponseMessage) + LIVE EDIT (sendEdit)
 *     → papan berubah di pesan yang sama, chat tidak banjir
 *   • jawaban bisa lewat PILL (addSuggest) yang diketuk, atau diketik manual
 *   • FALLBACK otomatis ke pesan teks bila device tidak mendukung AIRich
 *   • statistik menang/kalah/skor tertinggi per user (database/airichstat.json)
 *   • hadiah koin + EXP RPG otomatis
 * ============================================================
 */
import { AIRich } from '../shims/elaina.mjs'
import { config } from '../config.js'
import { truncate, pickRandom } from './functions.js'
import { loadDB, saveDB, getUser } from './database.js'
import { addExp, addMoney } from './rpg.js'
import { airichLabSessions as sessions, sessSet, sessGet, sessClear } from './gamestore.js'

const P = config.display.prefix
const TTL = 300000 // 5 menit tanpa aktivitas = sesi habis

/** @type {Map<string, object>} kind -> definisi game */
export const GAMES = new Map()

export function daftarGame (kind, def) {
  GAMES.set(kind, { kind, ...def })
  return def
}

/* ------------------------------------------------------------------ */
/*  SESI                                                               */
/* ------------------------------------------------------------------ */
export const setS = (jid, data, ttl = TTL) => sessSet(sessions, jid, data, ttl)
export const getS = jid => sessGet(sessions, jid)
export const clearLab = jid => sessClear(sessions, jid)

/* ------------------------------------------------------------------ */
/*  AIRich helper                                                      */
/* ------------------------------------------------------------------ */
export function newRich (sock) {
  return new AIRich(sock, { dynamic: true, unsupportedTypeAlert: false })
}

/** edit pesan AI Rich yang sama; kalau gagal → kirim baru; kalau gagal juga → teks */
export async function editOrSend (m, s, build) {
  const rich = newRich(m.sock)
  try { build(rich) } catch (e) { rich.addText('⚠️ Render error: ' + truncate(e.message, 120)) }
  if (s.msgId) {
    try { await rich.sendEdit(m.jid, s.msgId); return true } catch { /* lanjut kirim baru */ }
  }
  try {
    const sent = await rich.send(m.jid)
    if (sent?.key?.id) s.msgId = sent.key.id
    return true
  } catch {
    // device tidak mendukung AIRich → fallback teks
    const def = GAMES.get(s.kind)
    const teks = def?.teks ? def.teks(s) : ''
    await m.reply(teks || '⚠️ AI Rich tidak didukung device ini.').catch(() => {})
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  STATISTIK & HADIAH                                                 */
/* ------------------------------------------------------------------ */
const statDB = () => loadDB('airichstat', {})

export function getStat (jid) {
  const db = statDB()
  if (!db[jid]) {
    db[jid] = { main: 0, menang: 0, kalah: 0, seri: 0, skor: {}, per: {}, terakhir: 0, terakhirKind: '' }
    saveDB('airichstat')
  }
  const u = db[jid]
  u.skor = u.skor || {}; u.per = u.per || {}
  return u
}

/** catat satu ronde selesai. hasil: 'menang' | 'kalah' | 'seri' */
export function catatHasil (jid, kind, hasil, skor = 0) {
  const u = getStat(jid)
  u.main++
  u.terakhir = Date.now()
  if (hasil === 'menang') u.menang++
  else if (hasil === 'kalah') u.kalah++
  else u.seri++
  u.terakhirKind = kind
  u.per[kind] = u.per[kind] || { main: 0, menang: 0 }
  u.per[kind].main++
  if (hasil === 'menang') u.per[kind].menang++
  if (skor > 0) u.skor[kind] = Math.max(u.skor[kind] || 0, skor)
  saveDB('airichstat')
  return u
}

export function semuaStat () {
  const db = statDB()
  return Object.entries(db).map(([jid, u]) => ({ jid, ...(u || {}) }))
}

/** hadiah koin + EXP (pakai engine RPG biar satu ekonomi) */
export function hadiah (m, koin = 0, exp = 0) {
  const key = m.senderKey || m.sender
  try { if (koin) addMoney(key, koin) } catch {}
  try { if (exp) addExp(key, exp) } catch {}
  return { koin, exp }
}

export const fmtKoin = n => Math.round(n || 0).toLocaleString('id-ID')

/** susun isi pesan AI Rich dari definisi game */
export function buildRich (def, s, m, rich) {
  if (s.pesan) rich.addText(s.pesan)
  def.render(rich, s, m)
  const tip = typeof def.tip === 'function' ? def.tip(s) : def.tip
  if (tip) rich.addTip(tip)
  const pills = typeof def.pill === 'function' ? def.pill(s) : def.pill
  if (pills?.length) rich.addSuggest(pills.slice(0, 12).map(String), { id: 'act' })
  return rich
}

/** render ulang papan di pesan yang sama (live edit) */
export async function refresh (m, s, pesan = '') {
  const def = GAMES.get(s.kind)
  if (!def) return false
  s.pesan = pesan || ''
  return editOrSend(m, s, rich => buildRich(def, s, m, rich))
}

/** akhiri game: catat statistik, hadiah, kirim ringkasan */
export async function selesai (m, s, { judul = '🏁 Selesai', teks = '', hasil = 'seri', skor = 0, koin = 0, exp = 0 } = {}) {
  const def = GAMES.get(s.kind) || {}
  const key = m.senderKey || m.sender
  const u = catatHasil(key, s.kind, hasil, skor)
  if (koin || exp) hadiah(m, koin, exp)
  clearLab(m.jid)
  const emoji = hasil === 'menang' ? '🏆' : hasil === 'kalah' ? '💀' : '🤝'
  const ringkas = [
    `${emoji} *${judul}*`,
    teks,
    `Hasil: *${hasil.toUpperCase()}*${skor ? ` · skor ${skor}` : ''}${koin ? ` · +${fmtKoin(koin)} koin` : ''}${exp ? ` · +${exp} EXP` : ''}`,
    `📊 Total: ${u.main} main · ${u.menang} menang · ${u.kalah} kalah`
  ].filter(Boolean).join('\n\n')
  const rich = newRich(m.sock)
  rich.addText(ringkas)
  rich.addTip('Ketik "lagi" untuk main ulang, atau buka menu game AI Rich.')
  rich.addSuggest([`${P}mainlagi`, `${P}airichgamelab`, `${P}airichstatistik`], { id: 'act' })
  try {
    if (s.msgId) await rich.sendEdit(m.jid, s.msgId)
    else await rich.send(m.jid)
    return true
  } catch {
    await m.reply(ringkas).catch(() => {})
    return false
  }
}

/* ------------------------------------------------------------------ */
/*  MULAI GAME                                                         */
/* ------------------------------------------------------------------ */
export async function mulaiGame (m, kind, opt = {}) {
  const def = GAMES.get(kind)
  if (!def) return m.reply(`⚠️ Game "${kind}" tidak terdaftar.`)

  const lama = getS(m.jid)
  if (lama && lama.kind !== kind && !opt.paksa) {
    return m.reply(`⏳ Masih ada *${GAMES.get(lama.kind)?.nama || lama.kind}* berjalan di chat ini.\n\nSelesaikan dulu, atau ketik \`${P}batalairichlab\` / \`batal\` untuk berhenti.`)
  }

  clearLab(m.jid)
  let s
  try { s = { kind, sock: m.sock, mulai: Date.now(), ...(def.init ? def.init(m, opt) : {}) } }
  catch (e) { return m.reply(`⚠️ Gagal menyiapkan game: ${truncate(e.message, 140)}`) }

  const build = rich => buildRich(def, s, m, rich)

  const rich = newRich(m.sock)
  let sent = null
  try { build(rich); sent = await rich.send(m.jid) } catch { sent = null }

  if (sent?.key?.id) {
    s.msgId = sent.key.id
    setS(m.jid, s)
    if (opt.senyap) return null
    return null // pesan AI Rich sudah tampil, tidak perlu reply tambahan
  }

  // FALLBACK: device tidak mendukung AIRich → tetap bisa main lewat teks
  setS(m.jid, s)
  const teks = def.teks ? def.teks(s) : '(papan tidak tersedia)'
  return m.reply(`${teks}\n\n_Jawab dengan mengetik (device kamu belum mendukung AI Rich)._`).catch(() => {})
}

/** ulangi game yang sama */
export async function ulangGame (m, s) {
  const kind = s.kind
  const opt = s.opt || {}
  clearLab(m.jid)
  return mulaiGame(m, kind, { ...opt, paksa: true })
}

/* ------------------------------------------------------------------ */
/*  CHECKER (dipanggil handlers/message.js untuk pesan non-command)     */
/* ------------------------------------------------------------------ */
const RE_BATAL = /^(batal|stop|keluar|berhenti|batalairichlab|batalairich|stopairich|cancel)$/
const RE_ULANG = /^(ulang|lagi|restart|mainlagi|sekali lagi|rematch)$/i

export async function checkAirichLab (m) {
  const s = getS(m.jid)
  if (!s) return null
  if (m.isCommand) return null
  const text = String(m.text || '').trim()
  if (!text) return null
  const low = text.toLowerCase()
  const def = GAMES.get(s.kind)
  if (!def) { clearLab(m.jid); return null }

  if (RE_BATAL.test(low)) {
    clearLab(m.jid)
    await m.reply(`🛑 *${def.nama || s.kind}* dihentikan.\n\nMain lagi: \`${P}${def.cmd || s.kind}\` · Daftar game: \`${P}airichgamelab\``).catch(() => {})
    return { handled: true }
  }
  if (RE_ULANG.test(low)) {
    await ulangGame(m, s)
    return { handled: true }
  }

  try {
    const handled = await def.jawab(m, s, low, text)
    if (handled) return { handled: true }
  } catch (e) {
    clearLab(m.jid)
    await m.reply(`⚠️ Game berhenti karena error: ${truncate(String(e.message || e), 160)}`).catch(() => {})
    return { handled: true }
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  UTIL UMUM UNTUK GAME                                               */
/* ------------------------------------------------------------------ */
export const acak = arr => [...arr].sort(() => Math.random() - 0.5)
export const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export { pickRandom, truncate }

/** progress bar teks */
export function bar (nilai, maks, ukuran = 10, isi = '█', kosong = '░') {
  const n = Math.max(0, Math.min(ukuran, Math.round((nilai / (maks || 1)) * ukuran)))
  return isi.repeat(n) + kosong.repeat(ukuran - n)
}

/** header statistik pemain (dipakai banyak game) */
export function kepala (m, s, judul) {
  const rpg = (() => { try { return getUser(m.senderKey || m.sender).rpg } catch { return null } })()
  const uang = rpg?.money || 0
  return `${judul}\n👤 ${m.pushName || 'kamu'} · 💰 ${fmtKoin(uang)}`
}

export default {
  GAMES, daftarGame, mulaiGame, checkAirichLab, clearLab, getS, setS,
  newRich, editOrSend, hadiah, catatHasil, getStat, semuaStat, bar, acak, rint, fmtKoin, kepala, ulangGame
}
