/**
 * 🤖 AIRICH GAMES — game yang disajikan lewat AIRichResponseMessage
 * ------------------------------------------------------------
 *  • Soal/papan ditampilkan sebagai pesan AI Rich (richResponseMessage):
 *    addText + addTable + addCode + addTip
 *  • JAWABAN berupa suggestion pills (addSuggest) yang bisa DIKETUK
 *    (ketukan pill masuk sebagai pesan teks -> dicocokkan sesi)
 *  • Hasil & langkah berikutnya dipakai LIVE EDIT (sendEdit) pada
 *    pesan yang SAMA, jadi tidak spam chat.
 */
import { AIRich } from '../shims/elaina.mjs'
import { config } from '../config.js'
import { pickRandom } from '../lib/functions.js'
import { addExp, addMoney } from '../lib/rpg.js'

const P = config.display.prefix
const TTL = 180000 // 3 menit

import { airichSessions as sessions, sessSet, sessGet, sessClear } from '../lib/gamestore.js'

function setS (jid, data) { sessSet(sessions, jid, data, TTL) }
function getS (jid) { return sessGet(sessions, jid) }
export function clearAirich (jid) { return sessClear(sessions, jid) }

/* ================= DATA KUIS ================= */
const QUIZ = [
  ['Ibu kota Indonesia?', ['Jakarta', 'Bandung', 'Surabaya', 'Medan'], 0],
  ['Planet terbesar di tata surya?', ['Bumi', 'Jupiter', 'Saturnus', 'Mars'], 1],
  ['9 x 7 = ?', ['56', '61', '63', '67'], 2],
  ['Bahasa Inggrisnya "kucing"?', ['Dog', 'Cat', 'Cow', 'Bird'], 1],
  ['Gunung tertinggi di dunia?', ['K2', 'Everest', 'Fuji', 'Rinjani'], 1],
  ['1 KB = berapa byte?', ['100', '512', '1000', '1024'], 3],
  ['Lukisan Mona Lisa karya?', ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'], 1],
  ['Organ pemompa darah?', ['Paru', 'Hati', 'Jantung', 'Ginjal'], 2],
  ['Bendera Jepang berwarna?', ['Merah-putih', 'Biru-putih', 'Hijau-putih', 'Kuning-putih'], 0],
  ['2^10 = ?', ['512', '1000', '1024', '2048'], 2],
  ['Hewan tercepat di darat?', ['Singa', 'Cheetah', 'Kuda', 'Elang'], 1],
  ['Nama lain AI Rich message?', ['richResponseMessage', 'simpleMessage', 'protocolMessage', 'ephemeralMessage'], 0]
]

const HAND = ['🪨 Batu', '✌️ Gunting', '📄 Kertas']
const HAND_KEY = ['batu', 'gunting', 'kertas']

/* ================= UTIL RENDER ================= */
function newRich (sock) {
  return new AIRich(sock, { dynamic: true, unsupportedTypeAlert: false })
}

async function editOrReply (m, s, build) {
  const rich = newRich(m.sock)
  build(rich)
  try {
    await rich.sendEdit(m.jid, s.msgId)
    return true
  } catch {
    // fallback: kirim baru
    try {
      const sent = await rich.send(m.jid)
      s.msgId = sent.key.id
      return true
    } catch (e) {
      await m.reply('⚠️ Gagal memperbarui pesan AI Rich.').catch(() => {})
      return false
    }
  }
}

function reward (m, coins, exp) {
  try {
    addMoney(m.senderKey || m.sender, coins)
    addExp(m.senderKey || m.sender, exp)
  } catch {}
}

/* ================= KUIS ================= */
const TOTAL_ROUND = 5

function renderQuiz (rich, s) {
  const [q, opts] = [s.question, s.options]
  rich.addText(`🧠 *KUIS AIRICH*  •  ronde ${s.round}/${TOTAL_ROUND}  •  skor ${s.score}`)
  if (s.lastResult) rich.addText(s.lastResult)
  rich.addText(q)
  rich.addTable(opts.map((o, i) => [String.fromCharCode(65 + i), o]))
  rich.addTip('Ketuk pilihan di bawah, atau ketik huruf/jawabannya.')
  rich.addSuggest(opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`), { id: 'act' })
}

async function startQuiz (m) {
  clearAirich(m.jid)
  const pool = [...QUIZ].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUND)
  const s = { kind: 'quiz', pool, idx: 0, round: 1, score: 0, sock: m.sock, lastResult: '' }
  const [q, opts, ans] = pool[0]
  Object.assign(s, { question: q, options: opts, answer: ans })
  const rich = newRich(m.sock)
  renderQuiz(rich, s)
  const sent = await rich.send(m.jid)
  s.msgId = sent.key.id
  setS(m.jid, s)
  return m.reply(`🎮 Kuis AI Rich dimulai! Jawab dengan mengetuk pilihan pada pesan di atas.\nBatal: \`${P}batalairich\``).catch(() => {})
}

async function quizAnswer (m, s, text) {
  let pick = -1
  const letter = text.match(/^([a-d])\b/)
  if (letter) pick = letter[1].charCodeAt(0) - 97
  else {
    pick = s.options.findIndex(o => o.toLowerCase() === text)
    if (pick < 0) pick = s.options.findIndex(o => o.toLowerCase().includes(text) && text.length > 2)
  }
  if (pick < 0) return null

  const benar = pick === s.answer
  if (benar) { s.score++; reward(m, 300, 25) }
  s.lastResult = `${benar ? '✅ *BENAR!*' : `❌ *SALAH* — jawaban: ${String.fromCharCode(65 + s.answer)}. ${s.options[s.answer]}`}  (skor ${s.score})`

  s.idx++
  if (s.idx >= s.pool.length) {
    // selesai
    clearAirich(m.jid)
    const win = s.score >= 3
    if (win) reward(m, 500, 40)
    const rich = newRich(m.sock)
    rich.addText(`🏁 *KUIS SELESAI*  —  skor akhir *${s.score}/${TOTAL_ROUND}*`)
    rich.addTable([['Ronde', 'Skor'], ['Total', `${s.score}/${TOTAL_ROUND}`], ['Hadiah', win ? '+500 koin, +40 EXP' : '-']])
    rich.addTip(win ? 'Keren! Main lagi?' : 'Semangat, coba lagi!')
    rich.addSuggest([' Ulang', '🛑 Selesai'], { id: 'act' })
    try { await rich.sendEdit(m.jid, s.msgId) } catch { await rich.send(m.jid).catch(() => {}) }
    return { handled: true }
  }

  s.round = s.idx + 1
  const [q, opts, ans] = s.pool[s.idx]
  Object.assign(s, { question: q, options: opts, answer: ans })
  setS(m.jid, s)
  await editOrReply(m, s, r => renderQuiz(r, s))
  return { handled: true }
}

/* ================= SUIT ================= */
function renderSuit (rich, s) {
  rich.addText('✂️ *SUIT AIRICH* vs bot')
  if (s.lastResult) rich.addText(s.lastResult)
  rich.addText('Pilih senjatamu:')
  rich.addTable([['Pilihan', 'Kalah oleh'], ['🪨 Batu', '📄 Kertas'], ['✌️ Gunting', '🪨 Batu'], ['📄 Kertas', '✌️ Gunting']])
  rich.addSuggest(HAND, { id: 'act' })
}

async function startSuit (m) {
  clearAirich(m.jid)
  const s = { kind: 'suit', sock: m.sock, lastResult: '', score: [0, 0] }
  const rich = newRich(m.sock)
  renderSuit(rich, s)
  const sent = await rich.send(m.jid)
  s.msgId = sent.key.id
  setS(m.jid, s)
  return m.reply('✂️ Suit AI Rich siap! Ketuk 🪨/✌️/📄 pada pesan di atas.').catch(() => {})
}

async function suitAnswer (m, s, text) {
  const pi = HAND_KEY.findIndex(k => text.includes(k))
  if (pi < 0) return null
  const bi = Math.floor(Math.random() * 3)
  const win = (pi === 0 && bi === 1) || (pi === 1 && bi === 2) || (pi === 2 && bi === 0)
  const draw = pi === bi
  if (win) { s.score[0]++; reward(m, 200, 15) } else if (!draw) s.score[1]++
  s.lastResult = `Kamu ${HAND[pi]}  vs  Bot ${HAND[bi]}  →  ${win ? '✅ MENANG' : draw ? '🤝 SERI' : '❌ KALAH'}  (${s.score[0]}-${s.score[1]})`
  setS(m.jid, s)
  await editOrReply(m, s, r => renderSuit(r, s))
  return { handled: true }
}

/* ================= TIC TAC TOE ================= */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
const tttWin = b => { for (const [x, y, z] of LINES) if (b[x] && b[x] === b[y] && b[x] === b[z]) return b[x]; return b.every(c => c) ? 'draw' : null }
const tttBoard = b => {
  const sym = c => c === 'X' ? '❌' : c === 'O' ? '⭕' : '⬜'
  let out = ''
  for (let r = 0; r < 3; r++) out += b.slice(r * 3, r * 3 + 3).map((c, i) => `${sym(c)}${r * 3 + i + 1}`).join(' ') + '\n'
  return out
}
function tttBot (b) {
  const empty = b.map((c, i) => c ? -1 : i).filter(i => i >= 0)
  if (!empty.length) return -1
  const tryWin = mk => { for (const i of empty) { const t = [...b]; t[i] = mk; if (tttWin(t) === mk) return i } return -1 }
  let mv = tryWin('O'); if (mv >= 0) return mv
  mv = tryWin('X'); if (mv >= 0) return mv
  if (b[4] === '') return 4
  const cor = [0, 2, 6, 8].filter(i => b[i] === '')
  return cor.length ? pickRandom(cor) : pickRandom(empty)
}

function renderTtt (rich, s) {
  rich.addText(`⭕ *TTT AIRICH*  —  ${s.over ? 'SELESAI' : 'giliranmu (❌)'}`)
  if (s.lastResult) rich.addText(s.lastResult)
  rich.addCode('txt', tttBoard(s.b))
  rich.addTip('Ketuk nomor kotak kosong di bawah.')
  if (!s.over) rich.addSuggest(s.b.map((c, i) => c ? null : String(i + 1)).filter(Boolean), { id: 'act' })
  else rich.addSuggest(['🔁 Ulang', '🛑 Selesai'], { id: 'act' })
}

async function startTtt (m) {
  clearAirich(m.jid)
  const s = { kind: 'ttt', b: Array(9).fill(''), sock: m.sock, lastResult: '', over: false }
  const rich = newRich(m.sock)
  renderTtt(rich, s)
  const sent = await rich.send(m.jid)
  s.msgId = sent.key.id
  setS(m.jid, s)
  return m.reply('⭕ Tic-tac-toe AI Rich dimulai! Ketuk nomor kotak pada pesan di atas.').catch(() => {})
}

async function tttAnswer (m, s, text) {
  const i = parseInt(text) - 1
  if (isNaN(i) || i < 0 || i > 8 || s.b[i]) return null
  s.b[i] = 'X'
  let w = tttWin(s.b)
  if (!w) {
    const bm = tttBot(s.b)
    if (bm >= 0) s.b[bm] = 'O'
    w = tttWin(s.b)
  }
  if (w) {
    s.over = true
    s.lastResult = w === 'draw' ? '🤝 *SERI!*' : w === 'X' ? '🎉 *KAMU MENANG!* (+500 koin, +40 EXP)' : '🤖 *BOT MENANG!*'
    if (w === 'X') reward(m, 500, 40)
    clearAirich(m.jid)
    await editOrReply(m, s, r => renderTtt(r, s))
    return { handled: true }
  }
  setS(m.jid, s)
  await editOrReply(m, s, r => renderTtt(r, s))
  return { handled: true }
}

/* ================= NAVIGASI (pill menu / ulang / selesai) ================= */
const NAV = {
  'kuis': startQuiz, 'quiz': startQuiz, 'kuisairich': startQuiz,
  'suit': startSuit, 'suitairich': startSuit,
  'tic-tac-toe': startTtt, 'ttt': startTtt, 'tttairich': startTtt,
  '🔁 ulang': null, '🛑 selesai': null
}

async function handleNav (m, text) {
  const t = text.toLowerCase()
  if (t === '🛑 selesai') { clearAirich(m.jid); return { handled: true, silent: true } }
  if (t === '🔁 ulang') { clearAirich(m.jid); return { handled: true, restart: true } }
  return null
}

/* ================= CHECKER (dipanggil handler) ================= */
export async function checkAirichGame (m) {
  const s = getS(m.jid)
  if (!s) return null
  if (m.isCommand) return null // pesan ber-prefix biar jadi command biasa
  const text = String(m.text || '').trim().toLowerCase()
  if (!text) return null

  const nav = await handleNav(m, text)
  if (nav) {
    if (nav.restart) {
      const kind = s.kind
      clearAirich(m.jid)
      if (kind === 'quiz') await startQuiz(m)
      else if (kind === 'suit') await startSuit(m)
      else await startTtt(m)
    }
    return { handled: true }
  }

  if (s.kind === 'menu') {
    if (text.includes('kuis') || text.includes('quiz')) { clearAirich(m.jid); await startQuiz(m); return { handled: true } }
    if (text.includes('suit')) { clearAirich(m.jid); await startSuit(m); return { handled: true } }
    if (text.includes('tic') || text.includes('ttt') || text.includes('xo')) { clearAirich(m.jid); await startTtt(m); return { handled: true } }
    return null
  }

  if (s.kind === 'quiz') return await quizAnswer(m, s, text)
  if (s.kind === 'suit') return await suitAnswer(m, s, text)
  if (s.kind === 'ttt') return await tttAnswer(m, s, text)
  return null
}

/* ================= COMMANDS ================= */
export const kuisAirich = {
  command: ['kuisairich', 'kuisair', 'airichquiz', 'quizairich'],
  category: 'Games',
  description: 'Kuis pilihan ganda via AI Rich (jawab dengan ketuk pill)',
  limit: 0,
  run: m => startQuiz(m)
}

export const suitAirich = {
  command: ['suitairich', 'suitai', 'airichsuit'],
  category: 'Games',
  description: 'Suit batu-gunting-kertas via AI Rich',
  limit: 0,
  run: m => startSuit(m)
}

export const tttAirich = {
  command: ['tttairich', 'tttai', 'airichttt', 'xoairich'],
  category: 'Games',
  description: 'Tic-tac-toe via AI Rich (papan live-edit)',
  limit: 0,
  run: m => startTtt(m)
}

export const batalAirich = {
  command: ['batalairich', 'stopairich', 'airichstop'],
  category: 'Games',
  description: 'Hentikan game AI Rich yang berjalan',
  limit: 0,
  run: async (m) => {
    const s = getS(m.jid)
    clearAirich(m.jid)
    return m.reply(s ? '🛑 Game AI Rich dihentikan.' : 'Tidak ada game AI Rich yang berjalan.')
  }
}

export const airichGameMenu = {
  command: ['gameairich', 'airichgame', 'airichgames', 'gameair'],
  category: 'Games',
  description: 'Menu game berbasis AI Rich response message',
  limit: 0,
  run: async (m) => {
    const rich = newRich(m.sock)
    rich.addText('🎮 *GAME AIRICH*\nGame yang memakai AI Rich response message: soal tampil kaya (teks+tabel+kode), jawaban berupa pill yang bisa diketuk, dan hasil di-update langsung di pesan yang sama (live edit).')
    rich.addTable([
      ['Game', 'Perintah', 'Cara jawab'],
      ['🧠 Kuis', `${P}kuisairich`, 'ketuk pill A/B/C/D'],
      ['✂️ Suit', `${P}suitairich`, 'ketuk 🪨/✌️/📄'],
      ['⭕ TTT', `${P}tttairich`, 'ketuk nomor 1-9']
    ])
    rich.addTip('Pilih game dengan mengetuk pill di bawah.')
    rich.addSuggest(['Kuis', 'Suit', 'Tic-Tac-Toe'], { id: 'act' })
    const sent = await rich.send(m.jid).catch(() => null)
    if (!sent) return m.reply(`🎮 Game AI Rich:\n▸ \`${P}kuisairich\`\n▸ \`${P}suitairich\`\n▸ \`${P}tttairich\``)
    // pill menu tidak memulai sesi; ketukan pill ditangani checker lewat nav khusus
    setS(m.jid, { kind: 'menu', msgId: sent.key.id, sock: m.sock })
    return null
  }
}
