/**
 * commands/general.js — fitur dasar prefix "."
 *   ping (animasi), menu lengkap, minigame, owner, donasi, help
 */
const fs = require('fs')
const path = require('path')
const config = require('../config')
const db = require('../lib/db')
const menu = require('../lib/menu')
const { sendList, sendButtons, sendGameCard } = require('../lib/sender')
// catatan: require('./index') dilakukan di dalam run() untuk hindari circular deps
const { sleep, jakartaTime } = require('../lib/util')

/** kirim teks menu + list "Pilih" */
async function sendMenu(m, sock, text, sections) {
  await m.reply(text)
  await sleep(350)
  await sendList(sock, m.chat, {
    title: `${config.botName.toUpperCase()} MENU`,
    description: 'Ketuk menu yang ingin dibuka, lalu tekan *Pilih*',
    buttonText: 'Pilih',
    footer: `${config.botName} ${config.version} • prefix ${config.userPrefix}`,
    sections
  }, m)
}

/* ── PING (animasi teks terstruktur) ── */
async function ping(m, sock) {
  const startMsg = m.raw?.messageTimestamp
    ? Date.now() - Number(m.raw.messageTimestamp) * 1000
    : Date.now()
  const sent = await sock.sendMessage(m.chat, { text: menu.pingFrame(0) })
  for (let i = 1; i <= 4; i++) {
    await sleep(380)
    await sock.sendMessage(m.chat, { text: menu.pingFrame(i), edit: sent.key })
  }
  const ms = Math.max(1, Math.round(Date.now() - startMsg))
  await sleep(250)
  await sock.sendMessage(m.chat, { text: menu.pingResult(ms), edit: sent.key })
}

/* ── GAME HTML ── */
const GAMES = {
  dino: { name: 'DINO RUN', desc: 'T-Rex lari • Tema Chrome (desert)', file: 'dino.html' },
  flappybird: { name: 'FLAPPY BIRD', desc: 'Tembok pipa • Tema klasik', file: 'flappy.html' },
  catur: { name: 'CATUR', desc: 'Papan 8×8 • Tema kayu klasik', file: 'catur.html' },
  geometridash: { name: 'GEOMETRY DASH', desc: 'Lompat spike • Tema neon', file: 'geometry.html' }
}

async function playGame(m, sock, key) {
  const g = GAMES[key]
  if (!g) return m.reply('Game tidak ditemukan. Ketik *.minigame* untuk daftarnya.')
  await m.react('🎮')
  await sendGameCard(sock, m.chat, g)
}

const commands = [
  /* ═══ INFO ═══ */
  {
    name: 'ping',
    aliases: ['p'],
    category: 'info',
    access: 'user',
    prefixes: ['.'],
    desc: 'Cek respon bot dengan animasi',
    usage: '.ping',
    run: ping
  },
  {
    name: 'owner',
    aliases: ['creator'],
    category: 'info',
    access: 'user',
    prefixes: ['.'],
    desc: 'Info pemilik bot',
    usage: '.owner',
    async run(m) {
      m.reply(
        menu.boxLines('OWNER', [
          `│ *NAMA*  : ${config.author}`,
          `│ *NOMOR* : ${config.ownerNumber}`,
          `│ *LID*   : ${config.ownerLid}`,
          `│ *BOT*   : ${config.botName} ${config.version}`,
          ``,
          `│ Prefix owner: / , , =>`,
          `│ Prefix user : ${config.userPrefix}`
        ])
      )
    }
  },
  {
    name: 'help',
    aliases: ['bantuan'],
    category: 'info',
    access: 'user',
    prefixes: ['.'],
    desc: 'Panduan prefix & cara pakai',
    usage: '.help',
    async run(m) {
      m.reply(
        [
          `*PANDUAN PREFIX ${config.botName.toUpperCase()}*`,
          '',
          menu.prefixBox(),
          '',
          `*Langkah cepat:*`,
          `1. Ketik *${config.userPrefix}menu* → ketuk *Pilih*`,
          `2. Pilih kategori → bot kirim submenu`,
          `3. Owner pakai prefix / , , => (lihat *${config.userPrefix}menuowner*)`
        ].join('\n')
      )
    }
  },

  /* ═══ MENU ═══ */
  {
    name: 'menu',
    aliases: ['listmenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu utama (list button)',
    usage: '.menu',
    async run(m, sock) {
      const registry = require('./index')
      const banner = path.join(__dirname, '..', 'media', 'menu.png')
      const text = menu.mainMenuText(m, registry.count())
      if (fs.existsSync(banner)) {
        await sock.sendMessage(m.chat, {
          image: { url: banner },
          caption: text,
          mentions: [m.sender]
        })
      } else {
        await m.reply(text)
      }
      await sleep(400)
      await sendList(sock, m.chat, {
        title: `${config.botName.toUpperCase()} MENU`,
        description: 'Semua fitur bot — pilih kategori lalu tekan *Pilih*',
        buttonText: 'Pilih',
        footer: `${config.botName} ${config.version} • ${config.userPrefix}help untuk panduan`,
        sections: menu.mainMenuSections()
      }, m)
    }
  },
  {
    name: 'menudownloader',
    aliases: ['downloadermenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu downloader',
    usage: '.menudownloader',
    run: (m, sock) => sendMenu(m, sock, menu.menuDownloaderText(), menu.menuDownloaderSections())
  },
  {
    name: 'menugame',
    aliases: ['gamemenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu game',
    usage: '.menugame',
    run: (m, sock) => sendMenu(m, sock, menu.menuGameText(), menu.menuGameSections())
  },
  {
    name: 'menurpg',
    aliases: ['rpgmenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu RPG (struktur per game)',
    usage: '.menurpg',
    run: (m, sock) => sendMenu(m, sock, menu.menuRpgText(), menu.menuRpgSections())
  },
  {
    name: 'menuislami',
    aliases: ['islamimenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu islami',
    usage: '.menuislami',
    run: (m, sock) => sendMenu(m, sock, menu.menuIslamiText(), menu.menuIslamiSections())
  },
  {
    name: 'menuprofile',
    aliases: ['profilemenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu profile',
    usage: '.menuprofile',
    run: (m, sock) => sendMenu(m, sock, menu.menuProfileText(), menu.menuProfileSections())
  },
  {
    name: 'menuowner',
    aliases: ['ownermenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu owner + panduan prefix owner',
    usage: '.menuowner',
    run: (m, sock) => sendMenu(m, sock, menu.menuOwnerText(), menu.menuOwnerSections())
  },
  {
    name: 'menudonasi',
    aliases: ['donasimenu'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Menu donasi',
    usage: '.menudonasi',
    run: (m, sock) => sendMenu(m, sock, menu.menuDonasiText(), menu.menuDonasiSections())
  },
  {
    name: 'donasi',
    aliases: ['donate'],
    category: 'menu',
    access: 'user',
    prefixes: ['.'],
    desc: 'Info donasi',
    usage: '.donasi [dana|gopay|ovo|saweria]',
    async run(m, sock, args) {
      const d = config.donation
      const key = (args[0] || '').toLowerCase()
      if (key === 'dana' || key === 'gopay' || key === 'ovo') {
        return m.reply(
          menu.boxLines(key.toUpperCase(), [
            `│ *NOMOR* : ${d[key]}`,
            `│ Buka ${key.toUpperCase()} → Bayar`,
            `│ → Transfer → isi nomor di atas`,
            ``,
            `│ Trimakasih 🙏`
          ])
        )
      }
      if (key === 'saweria') {
        return m.reply(`*SAWERIA*\n${d.saweria}\n\nKetuk link untuk donasi 🙏`)
      }
      await sendMenu(m, sock, menu.menuDonasiText(), menu.menuDonasiSections())
    }
  },

  /* ═══ MINIGAME ═══ */
  {
    name: 'minigame',
    aliases: ['mg', 'gamehtml'],
    category: 'minigame',
    access: 'user',
    prefixes: ['.'],
    desc: 'Daftar minigame HTML',
    usage: '.minigame',
    run: (m, sock) => sendMenu(m, sock, menu.minigameText(), menu.minigameSections())
  },
  {
    name: 'dino',
    aliases: ['trex'],
    category: 'minigame',
    access: 'user',
    prefixes: ['.'],
    desc: 'Game Dino T-Rex (Chrome)',
    usage: '.dino',
    run: (m, sock) => playGame(m, sock, 'dino')
  },
  {
    name: 'flappybird',
    aliases: ['flappy'],
    category: 'minigame',
    access: 'user',
    prefixes: ['.'],
    desc: 'Game Flappy Bird',
    usage: '.flappybird',
    run: (m, sock) => playGame(m, sock, 'flappybird')
  },
  {
    name: 'catur',
    aliases: ['chess', 'sakat'],
    category: 'minigame',
    access: 'user',
    prefixes: ['.'],
    desc: 'Game Catur 8×8',
    usage: '.catur',
    run: (m, sock) => playGame(m, sock, 'catur')
  },
  {
    name: 'geometridash',
    aliases: ['gd', 'geometry'],
    category: 'minigame',
    access: 'user',
    prefixes: ['.'],
    desc: 'Game Geometry Dash',
    usage: '.geometridash',
    run: (m, sock) => playGame(m, sock, 'geometridash')
  }
]

module.exports = commands
