/**
 * commands/ai.js — fitur AI & stiker (prefix ".")
 *   .ai [teks]     — ngobrol sama AI (boleh reply media/balasan bot)
 *   .sticker       — ubah gambar/video jadi stiker (reply media)
 *   .aireset       — reset relasimu dengan AI
 */
const ai = require('../lib/ai')
const db = require('../lib/db')
const { boxLines } = require('../lib/menu')
const { toWebp, videoFrame, mediaTypeOf } = require('../lib/sticker')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function downloadQuoted(sock, m) {
  if (!m.quoted || !mediaTypeOf(m.quoted)) return null
  return downloadMediaMessage(m.quoted.message, 'buffer', {}, {
    logger: pino({ level: 'silent' }),
    reuploadRequest: sock.updateMediaMessage
  })
}

const commands = [
  {
    name: 'ai',
    aliases: ['chat', 'aichat'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Chat dengan AI (reply pesan/media untuk AI melihatnya)',
    usage: '.ai halo! | reply gambar + .ai apa ini?',
    async run(m, sock, args) {
      const cfg = ai.getAiCfg()
      if (cfg.enabled === false) return m.reply('AI sedang dimatikan owner.')
      const text = args.join(' ')
      if (!text && !m.quoted) {
        return m.reply(
          boxLines('AI CHATBOT', [
            `│ *KARAKTER* : ${cfg.nama} (${ai.PERSONA[cfg.gender]?.label || cfg.gender})`,
            `│ *STATUS*   : ${cfg.enabled ? 'ON' : 'OFF'}${cfg.auto ? ' • AUTO' : ''}`,
            ``,
            `│ Cara pakai:`,
            `│ 1. Balas chat bot → langsung ngobrol`,
            `│ 2. *.ai halo* → tanya apa saja`,
            `│ 3. Reply gambar/video + *.ai*`,
            `│    → AI melihat media kamu`,
            ``,
            `│ Owner: *.menuowner* → ,aiset`
          ])
        )
      }
      await m.react('🤖')
      await ai.handleAI(sock, m, { force: true, text })
    }
  },
  {
    name: 'sticker',
    aliases: ['stiker', 's', 'stick'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Ubah gambar/video jadi stiker WhatsApp',
    usage: 'reply gambar/video lalu: .sticker',
    async run(m, sock) {
      const type = mediaTypeOf(m.quoted)
      if (!type) {
        return m.reply(
          boxLines('STICKER', [
            `│ Reply/kirim *gambar* atau *video*`,
            `│ lalu ketik *.sticker*`,
            ``,
            `│ Contoh:`,
            `│ kirim foto → balas dengan *.s*`
          ])
        )
      }
      await m.react('⏳')
      try {
        let buf = await downloadQuoted(sock, m)
        if (!buf) throw new Error('media tidak bisa diunduh')
        if (type === 'videoMessage') {
          buf = await videoFrame(buf) // ambil frame pertama
        }
        const webp = await toWebp(buf)
        await sock.sendMessage(m.chat, { sticker: webp }, { quoted: m.raw })
        await m.react('✅')
      } catch (e) {
        await m.react('❌')
        m.reply(`⚠️ Gagal membuat stiker: ${e.message}\n\nTips: pakai gambar PNG/JPG, video maksimal 10 detik.`)
      }
    }
  },
  {
    name: 'aireset',
    aliases: ['resetai'],
    category: 'ai',
    access: 'user',
    prefixes: ['.'],
    desc: 'Reset hubungan/mood kamu dengan AI',
    usage: '.aireset',
    async run(m) {
      const d = db.load()
      if (d.aiRel) delete d.aiRel[m.chat]
      if (d.aiHist) delete d.aiHist[m.chat]
      db.save()
      const cfg = ai.getAiCfg()
      m.reply(
        boxLines('AI RELASI RESET', [
          `│ Mood & riwayat dengan *${cfg.nama}*,`,
          `│ di-reset ke awal.`,
          ``,
          `│ Dia bakal netral lagi ke kamu 🙃`
        ])
      )
    }
  }
]

module.exports = commands
