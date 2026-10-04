/**
 * 🧩 .interaktifmenu — HUB SEMUA FITUR HTML / INTERAKTIF (v7.32.0)
 * ------------------------------------------------------------------
 *  v7.32.0: memakai sections berurutan dari features/submenu.js —
 *   🎮 hub game · 🎧 musik & video · 🪪 kartu · 😈 prank · 🏆 rank & kasino.
 *  Argumen lama tetap jalan: .interaktifmenu musik|kartu|prank|rank|semua
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { DAFTAR_ARCADE, DAFTAR_ARCADE2, DAFTAR_ARCADE3, DAFTAR_ARCADE5, DAFTAR_ARCADE6, DAFTAR_ARCADE7, DAFTAR_ARCADE8, DAFTAR_ARCADE9 } from './arcade.js'
import { DAFTAR_ARCADE_4 } from './arcadebaru.js'
import { DAFTAR_CASINO } from './casinolab.js'
import { DAFTAR_CASINO_RPG } from './casinorpg.js'
import { DAFTAR_JADUL } from './jadullab.js'
import { DAFTAR_PASTEL } from './pastellab.js'
import { DAFTAR_PASTEL_2 } from './pastelbaru.js'
import { sectionsInteraktif } from './submenu.js'

const P = config.display.prefix
const brand = () => config.bot.name || 'THERYHANN!'
const row = (icon, title, desc, cmd) => ({ title: `${icon} ${title}`, description: desc, id: `${P}${cmd}` })
const rowG = g => row(g.icon, g.nama, g.ket || '', g.cmd)

/* ---------- daftar fitur HTML non-game (semua yang memakai kartu HTML) ---------- */
export const HTML_MUSIK = [
  row('🎧', 'play <judul>', 'Now Playing: cover, seek, ⏮⏸⏭, sleep timer, panel stream · lagu penuh', 'play'),
  row('🟢', 'play3 <judul>', 'Pemutar ala Spotify + LIRIK sinkron · lagu penuh', 'play3'),
  row('🎬', 'playvid <judul/link>', 'Pemutar video VM: seek, ⏸, VOL, ↻ (YouTube/TikTok)', 'playvid'),
  row('📝', 'liriklagu3 <judul>', 'Lirik lagu sebagai teks (LRCLIB)', 'liriklagu3'),
  row('🎚️', 'playkb', 'Owner: batas ukuran audio kartu (kejernihan)', 'playkb')
]
export const HTML_KARTU = [
  row('🪪', 'profile', 'Kartu member HTML (tema per status)', 'profile'),
  row('👑', 'premcard', 'Kartu Premium Member', 'premcard'),
  row('🎉', 'welcome', 'Kartu welcome/goodbye HTML ala .profile (grup)', 'welcome'),
  row('📱', 'menuapp', 'Menu bot sebagai aplikasi HTML (cari & filter)', 'menuapp'),
  row('📡', 'ping2', 'Kartu diagnostik + speedtest nyata', 'ping2')
]
export const HTML_FUN = [
  row('💀', 'hack [pesan | password]', 'Prank "kamu telah di-hack" — dialog JavaScript minta password', 'hack')
]
export const HTML_INFO = [
  row('📡', 'ping2', 'Kartu diagnostik 9:16: latency, uptime, RAM, disk, OS, CPU, speedtest nyata', 'ping2')
]
export const HTML_RANK = [
  row('🏆', 'lbgame', 'Papan peringkat semua game (kartu HTML)', 'lbgame'),
  row('🎰', 'slot 500', 'Slot Mesin RPG — uang RPG asli', 'slot'),
  ...DAFTAR_CASINO_RPG.map(rowG)
]
const GAME_SEMUA = () => [
  ...DAFTAR_ARCADE9, ...DAFTAR_ARCADE8, ...DAFTAR_ARCADE7, ...DAFTAR_ARCADE6, ...DAFTAR_ARCADE5, ...DAFTAR_ARCADE, ...DAFTAR_ARCADE2, ...DAFTAR_ARCADE3, ...DAFTAR_ARCADE_4,
  ...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2, ...DAFTAR_CASINO, ...DAFTAR_JADUL
]
const jumlahGame = () => GAME_SEMUA().length

/* ---------- menu utama: sections berurutan ---------- */
export const interaktifMenu = {
  command: ['interaktifmenu', 'menuinteraktif', 'htmlmenu', 'menuhtmlapp', 'hubhtml', 'interactivemenu'],
  category: 'Main Menu',
  description: '🧩 SEMUA fitur HTML berurutan: hub game · musik & video · kartu · prank · peringkat',
  limit: 0,
  run: async m => {
    const arg = String(m.q || '').trim().toLowerCase()
    const semua = sectionsInteraktif()
    const pilih = { musik: 1, video: 1, kartu: 2, prank: 3, fun: 3, rank: 4, kasino: 4 }[arg]
    const sections = pilih !== undefined ? [semua[pilih]] : semua
    if (arg === 'semua' || arg === 'all') return kirimSemua(m)
    const total = sections.reduce((a, s) => a + s.rows.length, 0)
    const text = `🧩 *MENU INTERAKTIF — ${total} fitur HTML*\nSemua fitur yang tampil sebagai *aplikasi HTML di dalam chat*, diurutkan sesuai kegunaan:\n\n🎮 hub game → semua game HTML dari satu pintu\n🎧 musik & video → .play · .play3 (Spotify + lirik) · .playvid\n🪪 kartu → .profile · welcome · .menuapp · 📡 .ping2\n💀 prank → .hack\n🏆 rank & kasino → .lbgame · .slot · papan top\n\nPilih untuk langsung menjalankan:`
    try {
      await sendList(m.sock, m.jid, { title: '🧩 MENU INTERAKTIF', text, footer: brand(), buttonText: '🧩 Pilih Fitur HTML', sections })
    } catch {
      try {
        await sendButtons(m.sock, m.jid, {
          title: '🧩 MENU INTERAKTIF', text, footer: brand(),
          buttons: [
            { text: '🎮 gamerespon', id: `${P}gamerespon` },
            { text: '🎧 musik & video', id: `${P}interaktifmenu musik` },
            { text: '🪪 kartu', id: `${P}interaktifmenu kartu` },
            { text: '🏆 rank & kasino', id: `${P}interaktifmenu rank` }
          ]
        })
      } catch { await m.reply(text) }
    }
    return { handled: true }
  }
}

async function kirimList (m, title, text, sections) {
  try {
    await sendList(m.sock, m.jid, { title, text, footer: brand(), buttonText: '📂 Pilih', sections: [...sections, { title: '⬅️ Kembali', rows: [row('🧩', 'interaktifmenu', 'kembali ke hub', 'interaktifmenu')] }] })
  } catch {
    await m.reply(`*${title}*\n${text}\n\n` + sections.flatMap(s => s.rows).map(r => `${r.title}\n   ${r.description}\n   → ${r.id}`).join('\n'))
  }
  return { handled: true }
}

async function kirimSemua (m) {
  const sections = [
    { title: `🎮 Multiplayer-arena (${DAFTAR_ARCADE8.length})`, rows: DAFTAR_ARCADE8.map(rowG) },
    { title: `📖 Game cerita v7.17.0 (${DAFTAR_ARCADE9.length})`, rows: DAFTAR_ARCADE9.map(rowG) },
    { title: `🆕 Baru v7.12.0 (${DAFTAR_ARCADE7.length})`, rows: DAFTAR_ARCADE7.map(rowG) },
    { title: `✨ Rupa asli (${DAFTAR_ARCADE6.length + DAFTAR_ARCADE5.length})`, rows: [...DAFTAR_ARCADE6, ...DAFTAR_ARCADE5].map(rowG) },
    { title: `🕹️ Arcade (${DAFTAR_ARCADE.length + DAFTAR_ARCADE2.length + DAFTAR_ARCADE3.length + DAFTAR_ARCADE_4.length})`, rows: [...DAFTAR_ARCADE, ...DAFTAR_ARCADE2, ...DAFTAR_ARCADE3, ...DAFTAR_ARCADE_4].map(rowG) },
    { title: `🧸 Pastel (${DAFTAR_PASTEL.length + DAFTAR_PASTEL_2.length})`, rows: [...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2].map(rowG) },
    { title: `🎰 Casino (${DAFTAR_CASINO.length})`, rows: DAFTAR_CASINO.map(rowG) },
    { title: `📱 Jadul (${DAFTAR_JADUL.length})`, rows: DAFTAR_JADUL.map(rowG) },
    { title: `🎧 Musik & video (${HTML_MUSIK.length})`, rows: HTML_MUSIK },
    { title: `🪪 Kartu & profil (${HTML_KARTU.length})`, rows: HTML_KARTU },
    { title: `💀 Prank & fun (${HTML_FUN.length})`, rows: HTML_FUN },
    { title: `🏆 Peringkat & kasino (${HTML_RANK.length})`, rows: HTML_RANK },
    { title: `📡 Info (${HTML_INFO.length})`, rows: HTML_INFO }
  ]
  const total = sections.reduce((a, s) => a + s.rows.length, 0)
  return kirimList(m, `📜 ${total} FITUR HTML`, 'Semua fitur HTML/interaktif dalam satu daftar — ketuk untuk langsung jalan.', sections)
}

export default { interaktifMenu }
