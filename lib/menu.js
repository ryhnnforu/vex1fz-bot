/**
 * lib/menu.js — struktur menu & box (meniru gaya video contoh)
 *
 * Gaya box:
 *   ┌┈┈┈┈┈┈┈○ 「 INFO BOT 」
 *   │ *NAME* : vex1fz
 *   └┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈○
 */
const config = require('../config')
const {
  formatUptime, greeting, jakartaTime, jakartaDate,
  uptimeSeconds, sysInfo, fmt, titleCase
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
    `│ *OWNER*  : / , , , =>`,
    `│   /kick  → owner grup`,
    `│   ,bc teks → owner bot`,
    `│   => code → eval owner`,
    `│ *PILIH*  : ketuk tombol "Pilih"`
  ])
}

/* ═══════════ MENU UTAMA ═══════════ */

function mainMenuText(m, cmdCount) {
  return [
    `*${greeting()}, ${m.pushName || 'teman'}!* 👋`,
    '',
    botInfoBox(cmdCount),
    '',
    userBox(m),
    '',
    `Waktu: ${jakartaTime()} WIB`,
    `Ketik *${config.userPrefix}menu* kapan saja atau ketuk tombol *Pilih* di bawah 👇`
  ].join('\n')
}

function mainMenuSections() {
  return [
    {
      title: '📌 INFORMASI',
      rows: [
        { title: 'PING', description: 'Cek respon & ping bot', rowId: '.ping' },
        { title: 'OWNER', description: 'Info pemilik bot', rowId: '.owner' },
        { title: 'DONASI', description: 'Dukung bot ini', rowId: '.menudonasi' }
      ]
    },
    {
      title: '📂 KATEGORI MENU',
      rows: [
        { title: 'DOWNLOADER', description: '4 COMMAND', rowId: '.menudownloader' },
        { title: 'GAME', description: '5 COMMAND', rowId: '.menugame' },
        { title: 'MINIGAME', description: '4 GAME HTML', rowId: '.minigame' },
        { title: 'RPG', description: '9 COMMAND', rowId: '.menurpg' },
        { title: 'ISLAMI', description: '4 COMMAND', rowId: '.menuislami' },
        { title: 'PROFILE', description: '4 COMMAND', rowId: '.menuprofile' },
        { title: 'OWNER', description: 'Menu khusus owner', rowId: '.menuowner' }
      ]
    },
    {
      title: '❔ BANTUAN',
      rows: [
        { title: 'CARA PAKAI PREFIX', description: 'Panduan prefix user & owner', rowId: '.help' },
        { title: 'MENU LAGI', description: 'Muat ulang menu', rowId: '.menu' }
      ]
    }
  ]
}

/* ═══════════ MENU DOWNLOADER ═══════════ */

function menuDownloaderText() {
  return [
    boxLines('DOWNLOADER', [
      `│ *.tiktok* <link>`,
      `│   ↓ TikTok tanpa watermark ✅`,
      `│ *.ig* / *.instagram* <link>`,
      `│   ↓ Instagram post/reels`,
      `│ *.fb* / *.facebook* <link>`,
      `│   ↓ Facebook video`,
      `│ *.mediafire* <link>`,
      `│   ↓ File MediaFire ✅`
    ]),
    '',
    `✅ = langsung jalan tanpa API key`,
    `Untuk IG/FB isi endpoint dulu → lihat *README*`,
    `Ketuk tombol *Pilih* untuk membuka perintah 👇`
  ].join('\n')
}

function menuDownloaderSections() {
  return [
    {
      title: '⬇️ DOWNLOADER',
      rows: [
        { title: 'TIKTOK', description: 'Tanpa watermark • .tiktok <link>', rowId: '.tiktok' },
        { title: 'INSTAGRAM', description: 'Post/Reels • .ig <link>', rowId: '.ig' },
        { title: 'FACEBOOK', description: 'Video • .fb <link>', rowId: '.fb' },
        { title: 'MEDIAFIRE', description: 'File • .mediafire <link>', rowId: '.mediafire' }
      ]
    }
  ]
}

/* ═══════════ MENU GAME ═══════════ */

function menuGameText() {
  return [
    boxLines('GAME', [
      `│ *.suit* <batu|kertas|gunting>`,
      `│   ↓ Suit vs bot 🗿📄✂️`,
      `│ *.math* [jawaban]`,
      `│   ↓ Kuis matematika 🧮`,
      `│ *.tebak* [angka]`,
      `│   ↓ Tebak angka 1-100 🎯`,
      `│ *.slot*`,
      `│   ↓ Mesin slot 🍒`,
      `│ *.minigame*`,
      `│   ↓ Game HTML (dino, dll)`
    ]),
    '',
    `Ketuk tombol *Pilih* untuk membuka perintah 👇`
  ].join('\n')
}

function menuGameSections() {
  return [
    {
      title: '🎮 GAMES',
      rows: [
        { title: 'SUIT', description: 'Batu kertas gunting vs bot', rowId: '.suit' },
        { title: 'MATH', description: 'Kuis hitungan cepat', rowId: '.math' },
        { title: 'TEBAK', description: 'Tebak angka 1-100', rowId: '.tebak' },
        { title: 'SLOT', description: 'Mesin slot berhadiah limit', rowId: '.slot' },
        { title: 'MINIGAME', description: 'Dino • Flappy • Catur • GD', rowId: '.minigame' }
      ]
    }
  ]
}

/* ═══════════ MENU RPG (struktur sendiri tiap game) ═══════════ */

function menuRpgText() {
  return [
    boxLines('RPG — PROFIL & DAFTAR', [
      `│ *.rpgdaftar* <nama>`,
      `│   ↓ Buat karakter RPG baru`,
      `│ *.rpgprofile*`,
      `│   ↓ Kartu karakter + bar HP/EXP`,
      `│ *.leaderboard*`,
      `│   ↓ Peringkat pemain`
    ]),
    '',
    boxLines('RPG — PETUALANGAN', [
      `│ *.adventure*`,
      `│   ↓ Jelajah dungeon (exp + gold)`,
      `│ *.boss*`,
      `│   ↓ Lawan boss (bar HP boss)`
    ]),
    '',
    boxLines('RPG — EKONOMI & HARIAN', [
      `│ *.shop*`,
      `│   ↓ Toko senjata & item`,
      `│ *.beli <item> [qty]`,
      `│   ↓ Beli item`,
      `│ *.inventory* / *.inv*`,
      `│   ↓ Tas & perlengkapan`,
      `│ *.daily*`,
      `│   ↓ Bonus harian (24 jam)`
    ]),
    '',
    `Tiap game RPG punya tampilan struktur sendiri ✨`,
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function menuRpgSections() {
  return [
    {
      title: '📜 PROFIL RPG',
      rows: [
        { title: 'RPGBUAT KARAKTER', description: '.rpgdaftar <nama>', rowId: '.rpgdaftar' },
        { title: 'KARTU KARAKTER', description: 'Status HP/EXP/level', rowId: '.rpgprofile' },
        { title: 'LEADERBOARD', description: 'Peringkat pemain', rowId: '.leaderboard' }
      ]
    },
    {
      title: '⚔️ PETUALANGAN',
      rows: [
        { title: 'DUNGEON', description: 'Jelajah & dapat loot', rowId: '.adventure' },
        { title: 'BOSS BATTLE', description: 'Lawan boss berlevel', rowId: '.boss' }
      ]
    },
    {
      title: '🏪 EKONOMI & HARIAN',
      rows: [
        { title: 'TOKO', description: 'Belanja senjata/item', rowId: '.shop' },
        { title: 'BELI', description: '.beli <item> [qty]', rowId: '.beli' },
        { title: 'TAS', description: 'Lihat inventory', rowId: '.inventory' },
        { title: 'DAILY', description: 'Bonus tiap 24 jam', rowId: '.daily' }
      ]
    }
  ]
}

/* ═══════════ MENU ISLAMI ═══════════ */

function menuIslamiText() {
  return [
    boxLines('ISLAMI', [
      `│ *.quran* <surah> [ayat]`,
      `│   ↓ Baca Al-Qur'an (teks Arab)`,
      `│ *.shalat* <kota>`,
      `│   ↓ Jadwal sholat (Kemenag)`,
      `│ *.doa* [no]`,
      `│   ↓ Kumpulan doa harian`,
      `│ *.asmaulhusna* [no]`,
      `│   ↓ Asmaul Husna 99`
    ]),
    '',
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function menuIslamiSections() {
  return [
    {
      title: '🕌 ISLAMI',
      rows: [
        { title: 'AL-QURAN', description: '.quran <surah> [ayat]', rowId: '.quran' },
        { title: 'JADWAL SHOLAT', description: '.shalat <kota>', rowId: '.shalat' },
        { title: 'DOA HARIAN', description: 'Kumpulan doa sehari-hari', rowId: '.doa' },
        { title: 'ASMAUL HUSNA', description: '99 nama Allah', rowId: '.asmaulhusna' }
      ]
    }
  ]
}

/* ═══════════ MENU PROFILE ═══════════ */

function menuProfileText() {
  return [
    boxLines('PROFILE', [
      `│ *.daftar* <nama>`,
      `│   ↓ Daftar (wajib untuk RPG)`,
      `│ *.profile*`,
      `│   ↓ Kartu profil kamu`,
      `│ *.leaderboard*`,
      `│   ↓ Papan peringkat`,
      `│ *.ping*`,
      `│   ↓ Cek respon bot`
    ]),
    '',
    `Ketuk tombol *Pilih* 👇`
  ].join('\n')
}

function menuProfileSections() {
  return [
    {
      title: '👤 PROFILE',
      rows: [
        { title: 'DAFTAR', description: 'Registrasi .daftar <nama>', rowId: '.daftar' },
        { title: 'PROFIL SAYA', description: 'Lihat kartu profil', rowId: '.profile' },
        { title: 'LEADERBOARD', description: 'Top pemain', rowId: '.leaderboard' },
        { title: 'PING', description: 'Cek respon bot', rowId: '.ping' }
      ]
    }
  ]
}

/* ═══════════ MENU OWNER ═══════════ */

function menuOwnerText() {
  return [
    `🔒 *MENU OWNER — KHUSUS PEMILIK BOT*`,
    '',
    boxLines('PANDUAN PREFIX OWNER', [
      `│ 1. Nomor owner: ${config.ownerNumber}`,
      `│ 2. Prefix user  : *.* (semua orang)`,
      `│ 3. Prefix owner : */* *,* *=>*`,
      `│ 4. Pakai prefix`,
      `│    di atas → bot cek nomor kamu`,
      `│ 5. Bukan owner? → ditolak otomatis`
    ]),
    '',
    boxLines('/ — OWNER GRUP', [
      `│ /kick /promote /demote`,
      `│ /hidetag /tagall`,
      `│ /open /close /linkgc /revoke`
    ]),
    '',
    boxLines(', — OWNER BOT', [
      `│ ,bc <teks>   → siaran`,
      `│ ,ban / ,unban @user`,
      `│ ,self / ,public → mode bot`,
      `│ ,join <link> / ,leave`,
      `│ ,setbio / ,setpp / ,resetdb`,
      `│ ,block / ,unblock / ,restart`
    ]),
    '',
    boxLines('=> — OWNER DEV', [
      `│ => <javascript> → eval`,
      `│ => shell <perintah> → exec`
    ]),
    '',
    `Langkah lengkap ada di file *README.md*`,
    `Ketuk tombol *Pilih* untuk contoh perintah 👇`
  ].join('\n')
}

function menuOwnerSections() {
  return [
    {
      title: '👑 OWNER — / (grup)',
      rows: [
        { title: 'KICK', description: '/kick @user — keluarkan member', rowId: '/kick' },
        { title: 'PROMOTE', description: '/promote @user — jadi admin', rowId: '/promote' },
        { title: 'DEMOTE', description: '/demote @user — cabut admin', rowId: '/demote' },
        { title: 'HIDETAG', description: '/hidetag teks — tag tersembunyi', rowId: '/hidetag' },
        { title: 'TAGALL', description: '/tagall teks — tag semua', rowId: '/tagall' },
        { title: 'OPEN/CLOSE', description: '/open • /close grup', rowId: '/open' },
        { title: 'LINK GC', description: '/linkgc — salin link grup', rowId: '/linkgc' },
        { title: 'REVOKE', description: '/revoke — reset link grup', rowId: '/revoke' }
      ]
    },
    {
      title: '👑 OWNER — , (bot)',
      rows: [
        { title: 'BC', description: ',bc <teks> — broadcast', rowId: ',bc' },
        { title: 'BAN', description: ',ban @user — blokir user', rowId: ',ban' },
        { title: 'UNBAN', description: ',unban @user — buka blokir', rowId: ',unban' },
        { title: 'SELF', description: ',self — mode self', rowId: ',self' },
        { title: 'PUBLIC', description: ',public — mode public', rowId: ',public' },
        { title: 'JOIN', description: ',join <link> — masuk grup', rowId: ',join' },
        { title: 'LEAVE', description: ',leave — keluar grup', rowId: ',leave' },
        { title: 'SETBIO', description: ',setbio <teks>', rowId: ',setbio' },
        { title: 'SET PP', description: ',setpp (reply foto)', rowId: ',setpp' },
        { title: 'BLOCK', description: ',block <nomor>', rowId: ',block' },
        { title: 'RESTART', description: ',restart — nyalakan ulang', rowId: ',restart' },
        { title: 'RESET DB', description: ',resetdb — hapus database', rowId: ',resetdb' }
      ]
    },
    {
      title: '👑 OWNER — => (dev)',
      rows: [
        { title: 'EVAL', description: '=> 1+1 — eksekusi JS', rowId: '=> 1+1' },
        { title: 'SHELL', description: '=> shell ls — exec shell', rowId: '=> shell ls' }
      ]
    }
  ]
}

/* ═══════════ MENU DONASI ═══════════ */

function menuDonasiText() {
  const d = config.donation
  return [
    boxLines('DONASI', [
      `│ Dukung bot *${config.botName}* agar`,
      `│ tetap hidup & update 🙏`,
      ``,
      `│ *.donasi dana* → ${d.dana}`,
      `│ *.donasi gopay* → ${d.gopay}`,
      `│ *.donasi ovo* → ${d.ovo}`,
      `│ *.donasi saweria* → link`
    ]),
    '',
    `Ketuk tombol *Pilih* untuk lihat 👇`
  ].join('\n')
}

function menuDonasiSections() {
  const d = config.donation
  return [
    {
      title: '💚 DONASI',
      rows: [
        { title: 'DANA', description: `Ketuk untuk lihat nomor`, rowId: '.donasi dana' },
        { title: 'GOPAY', description: `Ketuk untuk lihat nomor`, rowId: '.donasi gopay' },
        { title: 'OVO', description: `Ketuk untuk lihat nomor`, rowId: '.donasi ovo' },
        { title: 'SAWERIA', description: `Donasi via Saweria`, rowId: '.donasi saweria' }
      ]
    }
  ]
}

/* ═══════════ MINIGAME ═══════════ */

function minigameText() {
  return [
    boxLines('MINIGAME — HTML', [
      `│ *.dino*`,
      `│   ↓ T-Rex lari (tema Chrome)`,
      `│ *.flappybird* / *.flappy*`,
      `│   ↓ Flappy Bird (tema klasik)`,
      `│ *.catur*`,
      `│   ↓ Chess 8×8 (tema kayu)`,
      `│ *.geometridash* / *.gd*`,
      `│   ↓ Geometry Dash (tema neon)`
    ]),
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
        { title: 'DINO', description: 'T-Rex Chrome • Tema desert', rowId: '.dino' },
        { title: 'FLAPPY BIRD', description: 'Tembok pipa • Tema klasik', rowId: '.flappybird' },
        { title: 'CATUR', description: 'Papan 8×8 • Tema kayu', rowId: '.catur' },
        { title: 'GEOMETRY DASH', description: 'Lompat spike • Tema neon', rowId: '.geometridash' }
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
  menuOwnerText, menuOwnerSections,
  menuDonasiText, menuDonasiSections,
  minigameText, minigameSections,
  pingFrame, pingResult
}
