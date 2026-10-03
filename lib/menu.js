/**
 * lib/menu.js — menu & box vex1fz (v2: rapi, mudah dibaca, DINAMIS)
 *
 * Daftar fitur diambil langsung dari registry (commands/index.js),
 * jadi setiap command baru otomatis tampil lengkap dengan kegunaannya.
 *
 * Struktur teks:
 *   ▾ KATEGORI — N fitur
 *   1. .perintah <arg>
 *      Kegunaan singkat
 */
const config = require('../config')
// registry di-require LAZY agar aman dari circular dependency
// (commands/index → general.js → lib/menu → commands/index)
let _registry = null
function reg() {
  if (!_registry) _registry = require('../commands/index')
  return _registry
}
const {
  formatUptime, greeting, jakartaTime, jakartaDate,
  uptimeSeconds, sysInfo
} = require('./util')

/* ═══════════ builder box ═══════════ */

function box(title, entries = [], { lineW = 21 } = {}) {
  const top = `┌┈┈┈┈┈┈┈○ 「 ${title} 」`
  const bottom = `└${'┈'.repeat(lineW)}○`
  const rows = entries.map(([label, value]) => {
    const l = String(label).toUpperCase()
    return `│ *${l}* : ${value}`
  })
  return [top, ...rows, bottom].join('\n')
}

function boxLines(title, lines = [], { lineW = 21 } = {}) {
  const top = `┌┈┈┈┈┈┈┈○ 「 ${title} 」`
  const bottom = `└${'┈'.repeat(lineW)}○`
  return [top, ...lines, bottom].join('\n')
}

/* ═══════════ INFO BOT / INFO USER ═══════════ */

function botInfoBox(cmdCount = 0) {
  return box('INFO BOT', [
    ['name', config.botName],
    ['version', config.version],
    ['uptime', formatUptime(uptimeSeconds())],
    ['mode', (require('./db').get().settings.mode || config.mode).toUpperCase()],
    ['server', sysInfo()],
    ['commands', String(cmdCount)]
  ])
}

function userBox(m) {
  const u = m.user || {}
  const owner = m.isOwner
  const limit = owner ? 'UNLIMITED' : `${u.limit ?? config.dailyLimit}/${config.dailyLimit}`
  return box('INFO USER', [
    ['nama', m.pushName || m.sender.split('@')[0]],
    ['akses', owner ? 'OWNER' : 'USER'],
    ['limit', limit],
    ['daftar', u.registered ? 'SUDAH' : 'BELUM']
  ])
}

function prefixBox() {
  return boxLines('CARA PAKAI PREFIX', [
    `│ *USER*   : ${config.userPrefix}contoh ${config.userPrefix}menu`,
    `│ *OWNER*  : / , , =>`,
    `│   /kick  → owner grup`,
    `│   ,bc teks → owner bot`,
    `│   => code → eval owner`,
    `│ *ADMIN*  : .kick .h .promote (di grup)`,
    `│ *PILIH*  : ketuk tombol "Pilih"`
  ])
}

/* ═══════════ kategori menu (dinamis dari registry) ═══════════ */

const CATS = [
  { key: 'downloader', emoji: '⬇️', label: 'DOWNLOADER', cmd: '.menudownloader' },
  { key: 'game', emoji: '🎮', label: 'GAME', cmd: '.menugame' },
  { key: 'minigame', emoji: '🕹️', label: 'MINIGAME', cmd: '.minigame' },
  { key: 'rpg', emoji: '⚔️', label: 'RPG', cmd: '.menurpg' },
  { key: 'islami', emoji: '🕌', label: 'ISLAMI', cmd: '.menuislami' },
  { key: 'profile', emoji: '👤', label: 'PROFILE', cmd: '.menuprofile' },
  { key: 'sticker', emoji: '🖼️', label: 'MENUSTICKER', cmd: '.menusticker' },
  { key: 'group', emoji: '👥', label: 'MENUGROUP', cmd: '.menugroup' },
  { key: 'ai', emoji: '🤖', label: 'AI', cmd: '.menuai' },
  { key: 'owner', emoji: '👑', label: 'OWNER', cmd: '.menuowner' }
]

function cmdsOf(categories) {
  const cats = Array.isArray(categories) ? categories : [categories]
  return reg().list().filter(c => cats.includes(c.category))
}

/** format baris fitur: "1. .cmd <arg>\n   Kegunaan" */
function featureLines(cmds) {
  const lines = []
  cmds.forEach((c, i) => {
    const usage = c.usage && c.usage !== c.name ? c.usage : `${config.userPrefix}${c.name}`
    lines.push(`${i + 1}. *${usage}*`)
    lines.push(`   ${c.desc || '-'}`)
  })
  return lines
}

/** sections list WA dari daftar command (chunk ≤8 baris per section) */
function sectionsOf(cmds, { emoji = '📋', label = 'Fitur' } = {}) {
  const CHUNK = 8
  const out = []
  for (let i = 0; i < cmds.length; i += CHUNK) {
    const part = cmds.slice(i, i + CHUNK)
    out.push({
      title: `${emoji} ${label} • ${i + 1}–${i + part.length}`,
      rows: part.map(c => ({
        title: c.usage && c.usage !== c.name ? c.usage : `${config.userPrefix}${c.name}`,
        description: c.desc || '-',
        rowId: c.usage ? c.usage.split(/\s+/)[0] : `${config.userPrefix}${c.name}`
      }))
    })
  }
  if (!out.length) {
    out.push({ title: `${emoji} ${label}`, rows: [{ title: 'Belum ada fitur', description: '-', rowId: '.menu' }] })
  }
  return out
}

/** teks menu kategori generik */
function catMenuText(categories, title, emoji) {
  const cmds = cmdsOf(categories)
  return [
    `${emoji} *${title}* — ${cmds.length} fitur`,
    '',
    ...featureLines(cmds),
    '',
    `────────────────`,
    `Ketuk tombol *Pilih* untuk membuka fitur 👇`
  ].join('\n')
}

function catMenuSections(categories, title, emoji) {
  return sectionsOf(cmdsOf(categories), { emoji, label: title })
}

/* ═══════════ MENU UTAMA ═══════════ */

function mainMenuText(m, cmdCount) {
  const infoLines = [
    `Hai, *${m.pushName || 'teman'}*! 👋`,
    '',
    `*${config.botName.toUpperCase()} ${config.version}*`,
    `Uptime : ${formatUptime(uptimeSeconds())}`,
    `Mode   : ${((require('./db').get().settings.mode) || config.mode).toUpperCase()}`,
    `Fitur  : ${cmdCount} terdaftar`,
    `Waktu  : ${jakartaTime()} WIB`,
    '',
    `*Cara pakai prefix*`,
    `• User    → ${config.userPrefix}menu • ${config.userPrefix}tiktok <link>`,
    `• Owner   → /kick • ,bc teks • => code`,
    `• Admin   → ${config.userPrefix}kick • ${config.userPrefix}h (di grup)`,
    '',
    `*Kategori fitur*`
  ]
  for (const c of CATS) {
    const n = c.key === 'owner'
      ? cmdsOf(['owner-bot', 'owner-grup', 'owner-dev']).length
      : cmdsOf(c.key).length
    infoLines.push(`${c.emoji} ${c.label} — ${n} fitur → *${c.cmd}*`)
  }
  infoLines.push('')
  infoLines.push(`*vex1fz bye ryhn*`)
  infoLines.push(`Ketuk *List Menu* untuk daftar fitur 🗕 • *Info Dev* 🏷️ untuk kredit`)
  return infoLines.join('\n')
}

/** sheet "List Menu" (2 langkah: tombol List Menu → sheet ini) — desain sesuai referensi */
function listMenuSections() {
  const rows = [
    { title: 'menu ai', description: 'LIHAT MENU AI', rowId: '.menuai' },
    { title: 'menu sticker', description: 'LIHAT MENU STICKER', rowId: '.menusticker' },
    { title: 'menu group', description: 'LIHAT MENU GROUP', rowId: '.menugroup' },
    { title: 'menu game', description: 'LIHAT MENU GAME', rowId: '.menugame' },
    { title: 'menu rpg', description: 'LIHAT MENU RPG', rowId: '.menurpg' },
    { title: 'menu islami', description: 'LIHAT MENU ISLAMI', rowId: '.menuislami' },
    { title: 'menu profile', description: 'LIHAT MENU PROFILE', rowId: '.menuprofile' },
    { title: 'menu downloader', description: 'LIHAT MENU DOWNLOADER', rowId: '.menudownloader' },
    { title: 'menu info', description: 'INFO & BANTUAN', rowId: '.help' },
    { title: 'menu owner', description: 'LIHAT MENU OWNER', rowId: '.menuowner' }
  ]
  return [{ title: 'Pilih Kategori', rows }]
}

function mainMenuSections() {
  const info = [
    { title: 'PING', description: 'Cek respon & ping bot', rowId: '.ping' },
    { title: 'OWNER', description: 'Info pemilik bot', rowId: '.owner' },
    { title: 'DONASI', description: 'Dukung bot ini', rowId: '.menudonasi' },
    { title: 'HELP', description: 'Panduan prefix & cara pakai', rowId: '.help' }
  ]
  const catRows = CATS.map(c => ({
    title: c.label,
    description: `${cmdsOf(c.key === 'owner' ? ['owner-bot', 'owner-grup', 'owner-dev'] : c.key).length} fitur`,
    rowId: c.cmd
  }))
  return [
    { title: '📌 INFO & BANTUAN', rows: info },
    { title: '📂 KATEGORI MENU', rows: catRows }
  ]
}

/* ═══════════ MENU PER KATEGORI ═══════════ */

function menuDownloaderText() { return catMenuText(['downloader'], 'DOWNLOADER', '⬇️') }
function menuDownloaderSections() { return catMenuSections(['downloader'], 'DOWNLOADER', '⬇️') }

function menuGameText() { return catMenuText(['game'], 'GAME', '🎮') }
function menuGameSections() { return catMenuSections(['game'], 'GAME', '🎮') }

function menuRpgText() { return catMenuText(['rpg'], 'RPG', '⚔️') }
function menuRpgSections() { return catMenuSections(['rpg'], 'RPG', '⚔️') }

function menuIslamiText() { return catMenuText(['islami'], 'ISLAMI', '🕌') }
function menuIslamiSections() { return catMenuSections(['islami'], 'ISLAMI', '🕌') }

function menuProfileText() { return catMenuText(['profile'], 'PROFILE', '👤') }
function menuProfileSections() { return catMenuSections(['profile'], 'PROFILE', '👤') }

function menuStickerText() { return catMenuText(['sticker'], 'MENUSTICKER', '🖼️') }
function menuStickerSections() { return catMenuSections(['sticker'], 'MENUSTICKER', '🖼️') }

function menuGroupText() { return catMenuText(['group'], 'MENUGROUP', '👥') }
function menuGroupSections() { return catMenuSections(['group'], 'MENUGROUP', '👥') }

function menuAiText() { return catMenuText(['ai'], 'AI', '🤖') }
function menuAiSections() { return catMenuSections(['ai'], 'AI', '🤖') }

/* ═══════════ MENU OWNER ═══════════ */

function menuOwnerText() {
  const grup = cmdsOf('owner-grup')
  const bot = cmdsOf('owner-bot')
  const dev = cmdsOf('owner-dev')
  return [
    `👑 *MENU OWNER — KHUSUS PEMILIK*`,
    `Nomor owner: ${config.ownerNumber}`,
    '',
    `*Prefix / — manajemen grup*`,
    ...featureLines(grup),
    '',
    `*Prefix , — manajemen bot*`,
    ...featureLines(bot),
    '',
    `*Prefix => — developer*`,
    ...featureLines(dev),
    '',
    `Owner juga bisa memakai prefix *${config.userPrefix}* untuk SEMUA fitur.`,
    `Langkah lengkap ada di file *README.md*.`,
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function menuOwnerSections() {
  return [
    ...sectionsOf(cmdsOf('owner-grup'), { emoji: '👑', label: '/ grup' }),
    ...sectionsOf(cmdsOf('owner-bot'), { emoji: '⚙️', label: ', bot' }),
    ...sectionsOf(cmdsOf('owner-dev'), { emoji: '💻', label: '=> dev' })
  ]
}

/* ═══════════ MENU DONASI ═══════════ */

function menuDonasiText() {
  const d = config.donation
  return [
    `💚 *DONASI*`,
    '',
    `Dukung bot *${config.botName}* agar tetap hidup & update 🙏`,
    '',
    `• *.donasi dana* → ${d.dana}`,
    `• *.donasi gopay* → ${d.gopay}`,
    `• *.donasi ovo* → ${d.ovo}`,
    `• *.donasi saweria* → link`,
    '',
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function menuDonasiSections() {
  return [
    {
      title: '💚 DONASI',
      rows: [
        { title: 'DANA', description: 'Ketuk untuk lihat nomor', rowId: '.donasi dana' },
        { title: 'GOPAY', description: 'Ketuk untuk lihat nomor', rowId: '.donasi gopay' },
        { title: 'OVO', description: 'Ketuk untuk lihat nomor', rowId: '.donasi ovo' },
        { title: 'SAWERIA', description: 'Donasi via Saweria', rowId: '.donasi saweria' }
      ]
    }
  ]
}

/* ═══════════ MINIGAME ═══════════ */

function minigameText() {
  return [
    `🕹️ *MINIGAME — HTML*`,
    '',
    `• *.dino* — T-Rex lari (tema Chrome desert)`,
    `• *.flappybird* — Flappy Bird (tema klasik)`,
    `• *.catur* — Catur 8×8 (tema kayu)`,
    `• *.geometridash* — Geometry Dash (tema neon)`,
    '',
    `🎮 Semua game dikirim via`,
    `*InteractiveResponseMessage + HTML*`,
    `+ tombol *MAIN SEKARANG*.`,
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function minigameSections() {
  return [
    {
      title: '🕹️ PILIH GAME',
      rows: [
        { title: '.dino', description: 'T-Rex Chrome • Tema desert', rowId: '.dino' },
        { title: '.flappybird', description: 'Tembok pipa • Tema klasik', rowId: '.flappybird' },
        { title: '.catur', description: 'Papan 8×8 • Tema kayu', rowId: '.catur' },
        { title: '.geometridash', description: 'Lompat spike • Tema neon', rowId: '.geometridash' }
      ]
    }
  ]
}

/* ═══════════ PING (animasi) ═══════════ */

function pingFrame(step, total = 4) {
  const bars = '▰'.repeat(step) + '▱'.repeat(total - step)
  const dots = '.'.repeat((step % 3) + 1)
  return [
    `┌┈┈┈┈┈┈┈○ 「 PING 」`,
    `│ *STATUS*  : ⏳ MENGHUBUNGI SERVER${dots}`,
    `│ *PROGRES* : [${bars}] ${Math.round((step / total) * 100)}%`,
    `│ *BOT*     : ${config.botName} ${config.version}`,
    `└${'┈'.repeat(21)}○`
  ].join('\n')
}

function pingResult(ms) {
  const status = ms < 400 ? '🟢 SANGAT CEPAT' : ms < 900 ? '🟡 CEPAT' : '🟠 NORMAL'
  return [
    `┌┈┈┈┈┈┈┈○ 「 PING 」`,
    `│ *STATUS*  : ✅ ONLINE`,
    `│ *RESPON*  : ${ms} ms`,
    `│ *KUALITAS*: ${status}`,
    `│ *SERVER*  : ${sysInfo()}`,
    `│ *WAKTU*   : ${jakartaTime()} WIB`,
    `│ *TANGGAL* : ${jakartaDate()}`,
    `└${'┈'.repeat(21)}○`
  ].join('\n')
}

module.exports = {
  box, boxLines,
  botInfoBox, userBox, prefixBox,
  mainMenuText, mainMenuSections,
  menuDownloaderText, menuDownloaderSections,
  menuGameText, menuGameSections,
  menuRpgText, menuRpgSections,
  menuIslamiText, menuIslamiSections,
  menuProfileText, menuProfileSections,
  menuStickerText, menuStickerSections,
  menuGroupText, menuGroupSections,
  menuAiText, menuAiSections,
  menuOwnerText, menuOwnerSections,
  menuDonasiText, menuDonasiSections,
  minigameText, minigameSections,
  pingFrame, pingResult,
  featureLines, sectionsOf, cmdsOf, CATS, listMenuSections
}
