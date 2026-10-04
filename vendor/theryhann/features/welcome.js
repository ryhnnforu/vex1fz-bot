/**
 * 💳 WELCOME / GOODBYE CARD — custom kartu member masuk & keluar
 * Semua perintah ini khusus GRUP dan butuh status ADMIN.
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { getGroup, saveNow } from '../lib/database.js'
import { makeCard, THEMES, THEME_NAMES, randomTheme } from '../lib/canvas.js'
import { resolveImageValue } from '../lib/menuimg.js'
import { ROOT } from '../lib/functions.js'

const MEDIA_DIR = path.join(ROOT, 'media')

const HELP = `*💳 CUSTOM WELCOME CARD*

▸ \`${config.display.prefix}welcome on|off\` — aktif/matikan sambutan member baru
▸ \`${config.display.prefix}goodbye on|off\` — aktif/matikan kartu member keluar
▸ \`${config.display.prefix}welcomecard\` — preview kartu sekarang
▸ \`${config.display.prefix}setwelcomemode card|text\` — kartu gambar atau teks+tombol
▸ \`${config.display.prefix}settheme <nama|random>\` — tema gradient kartu
▸ \`${config.display.prefix}listtheme\` — daftar semua tema
▸ \`${config.display.prefix}setwelcomebg <url>\` — latar custom (atau reply gambar)
▸ \`${config.display.prefix}setwelcomebg off\` — kembali ke gradient tema
▸ \`${config.display.prefix}setwelcometext <teks>\` — template pesan sambutan
▸ \`${config.display.prefix}setleavetext <teks>\` — template pesan perpisahan
▸ \`${config.display.prefix}resetwelcometext\` — kembalikan template bawaan
▸ \`${config.display.prefix}welcomeinfo\` — lihat pengaturan saat ini

*Placeholder template:* {tag} {name} {group} {desc} {member} {time} {date}`

function onOff (v) {
  const s = String(v || '').toLowerCase()
  if (['on', 'true', '1', 'enable', 'aktif'].includes(s)) return true
  if (['off', 'false', '0', 'disable', 'mati'].includes(s)) return false
  return null
}

async function buildPreview (m, g, type = 'welcome') {
  const meta = m.group
  const target = m.mentionJid?.[0] || m.sender
  const num = target.split('@')[0]
  const pname = meta?.participants?.find(p => p.id === target)?.notify ||
    meta?.participants?.find(p => p.lid === target)?.notify || num
  const theme = (g.welcomeTheme || 'random') === 'random' ? randomTheme() : (g.welcomeTheme || 'ocean')
  const avatar = await m.sock.profilePictureUrl(target, 'image').catch(() => null)
  const bg = g.welcomeBg ? await resolveImageValue(g.welcomeBg).catch(() => null) : null
  return await makeCard({
    type,
    name: pname,
    group: meta?.subject || m.groupName || '',
    memberCount: meta?.participants?.length || g.members || 0,
    footer: config.bot.footer,
    avatar,
    background: Buffer.isBuffer(bg) ? bg : null,
    theme
  })
}

export default {
  command: ['welcomecard', 'kartuwelcome', 'customcard'],
  category: 'Group Menu',
  description: 'Preview kartu welcome custom',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    if ((g.welcomeMode || 'html') !== 'text') {
      const { kartuWelcomeHtml } = await import('../lib/kartuwelcome.js')
      const { sendHtmlApp } = await import('../lib/htmlapp.js')
      const html = kartuWelcomeHtml(config.bot.name, { jenis: 'welcome', nama: m.pushName || 'Member Baru', nomor: (m.sender || '').split('@')[0], grup: m.groupName || 'Grup', member: 0, waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), tanggal: new Date().toLocaleDateString('id-ID'), pesan: g.welcomeText || 'Selamat datang! Jangan lupa baca deskripsi grup ya.' })
      await sendHtmlApp(m.sock, m.jid, { title: '👋 Preview kartu welcome', html })
      return m.reply(`💳 *Preview kartu welcome (HTML)*\nMode: html · Welcome: ${g.welcome ? '✅' : '❌'} · Goodbye: ${g.goodbye ? '✅' : '❌'}\n\nUbah mode: ${config.display.prefix}setwelcomemode html|card|text\nUbah teks: ${config.display.prefix}setwelcometext`)
    }
    const buf = await buildPreview(m, g, 'welcome')
    return m.sendImage(buf, `💳 *Preview kartu welcome*\nTema: ${g.welcomeTheme || 'random'} | Mode: ${g.welcomeMode || 'card'}\n\nKalau sudah oke, aktifkan dengan \`${config.display.prefix}welcome on\``)
  }
}

export const welcomeToggle = {
  command: ['welcome', 'setwelcome'],
  category: 'Group Menu',
  description: 'Aktif/matikan sambutan member baru',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const v = onOff(m.args[0])
    if (v === null) {
      g.welcome = !g.welcome
    } else g.welcome = v
    saveNow()
    return m.reply(`${g.welcome ? '✅ Welcome *DIANYALAKAN*' : '❌ Welcome *DIMATIKAN'} di grup ini.\nMode kartu: ${g.welcomeMode || 'card'} | Tema: ${g.welcomeTheme || 'random'}`)
  }
}

export const goodbyeToggle = {
  command: ['goodbye', 'setgoodbye', 'kartukeluar'],
  category: 'Group Menu',
  description: 'Aktif/matikan kartu member keluar',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const v = onOff(m.args[0])
    if (v === null) g.goodbye = !g.goodbye
    else g.goodbye = v
    saveNow()
    return m.reply(`${g.goodbye ? '✅ Goodbye *DIANYALAKAN*' : '❌ Goodbye *DIMATIKAN'} — kartu akan dikirim saat member keluar/di-kick.`)
  }
}

export const setWelcomeMode = {
  command: ['setwelcomemode', 'welcomemode'],
  category: 'Group Menu',
  description: 'Pilih mode kartu: gambar atau teks',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const v = String(m.args[0] || '').toLowerCase()
    if (!['html', 'card', 'text', 'gambar', 'teks'].includes(v)) {
      return m.reply(`Gunakan: \`${config.display.prefix}setwelcomemode html\` / \`card\` / \`text\`\n\n▸ *html* = kartu HTML interaktif ala .profile (default, animasi confetti)\n▸ *card* = sama dengan html (kartu foto lama sudah tidak dipakai)\n▸ *text* = teks + tombol (paling ringan)`)
    }
    g.welcomeMode = (v === 'text' || v === 'teks') ? 'text' : 'html'
    saveNow()
    return m.reply(`✅ Mode welcome diset ke *${g.welcomeMode}*.`)
  }
}

export const setTheme = {
  command: ['settheme', 'setwelcometheme', 'themecard'],
  category: 'Group Menu',
  description: 'Set tema gradient kartu welcome',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const v = String(m.args[0] || '').toLowerCase()
    if (!v) return m.reply(`Tema tersedia:\n${THEME_NAMES.map(t => '▸ ' + t).join('\n')}\n\nGunakan: \`${config.display.prefix}settheme <nama>\` atau \`${config.display.prefix}settheme random\``)
    if (v !== 'random' && !THEMES[v]) return m.reply(`❌ Tema *${v}* tidak ada.\nTersedia: ${THEME_NAMES.join(', ')}, random`)
    g.welcomeTheme = v
    saveNow()
    const buf = await buildPreview(m, g, 'welcome')
    return m.sendImage(buf, `✅ Tema kartu diset ke *${v}*${v === 'random' ? ' (acak tiap event)' : ''}.`)
  }
}

export const listTheme = {
  command: ['listtheme', 'themelist', 'daftartema'],
  category: 'Group Menu',
  description: 'Daftar tema kartu welcome',
  group: true,
  limit: 0,
  run: async (m) => {
    return m.sendButtons({
      title: '🎨 Tema Kartu',
      text: `Pilih tema gradient untuk kartu welcome/goodbye:\n\n${THEME_NAMES.map((t, i) => `${i + 1}. *${t}*`).join('\n')}\n\nSet dengan \`${config.display.prefix}settheme <nama>\``,
      buttons: THEME_NAMES.slice(0, 10).map(t => ({ text: t, id: `${config.display.prefix}settheme ${t}` }))
    })
  }
}

export const setWelcomeBg = {
  command: ['setwelcomebg', 'setbgwelcome', 'welcomebg'],
  category: 'Group Menu',
  description: 'Set latar custom kartu (url / reply gambar)',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const arg = String(m.q || '').trim()

    if (['off', 'none', 'reset', 'hapus'].includes(arg.toLowerCase())) {
      g.welcomeBg = ''
      saveNow()
      return m.reply('✅ Latar custom dihapus — kartu kembali pakai gradient tema.')
    }

    // reply gambar -> simpan ke media/
    if (m.quoted?.isMedia) {
      try {
        const buf = await m.quoted.toBuffer()
        if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })
        const safe = m.jid.replace(/[^a-zA-Z0-9]/g, '_')
        const file = path.join(MEDIA_DIR, `welcomebg_${safe}.jpg`)
        fs.writeFileSync(file, buf)
        g.welcomeBg = file
        saveNow()
        const prev = await buildPreview(m, g, 'welcome')
        return m.sendImage(prev, '✅ Latar kartu diset dari gambar yang kamu reply.')
      } catch (e) {
        return m.fail(e)
      }
    }

    if (/^https?:\/\//i.test(arg)) {
      g.welcomeBg = arg
      saveNow()
      const prev = await buildPreview(m, g, 'welcome')
      return m.sendImage(prev, '✅ Latar kartu diset dari URL.')
    }

    return m.reply(`Gunakan:\n▸ \`${config.display.prefix}setwelcomebg <url gambar>\`\n▸ reply sebuah gambar lalu \`${config.display.prefix}setwelcomebg\`\n▸ \`${config.display.prefix}setwelcomebg off\` untuk reset`)
  }
}

export const setWelcomeText = {
  command: ['setwelcometext', 'setleavetext', 'setwelcomepesan'],
  category: 'Group Menu',
  description: 'Set template pesan welcome/goodbye',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const isLeave = m.command === 'setleavetext'
    const text = String(m.q || '').trim()
    if (!text) {
      return m.reply(`Kirim template setelah perintah.\nContoh:\n\`${config.display.prefix}setwelcometext Halo {name}, selamat datang di {group}! Member ke-{member}.\`\n\nPlaceholder: {tag} {name} {group} {desc} {member} {time} {date}`)
    }
    if (isLeave) g.leaveText = text
    else g.welcomeText = text
    saveNow()
    return m.reply(`✅ Template ${isLeave ? 'goodbye' : 'welcome'} disimpan:\n\n${text}`)
  }
}

export const resetWelcomeText = {
  command: ['resetwelcometext', 'resetleavetext'],
  category: 'Group Menu',
  description: 'Kembalikan template bawaan',
  group: true,
  admin: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    const isLeave = m.command === 'resetleavetext'
    if (isLeave) g.leaveText = ''
    else g.welcomeText = ''
    saveNow()
    return m.reply(`✅ Template ${isLeave ? 'goodbye' : 'welcome'} dikembalikan ke bawaan.`)
  }
}

export const welcomeInfo = {
  command: ['welcomeinfo', 'infowelcome', 'welcomecek'],
  category: 'Group Menu',
  description: 'Lihat pengaturan welcome grup ini',
  group: true,
  limit: 0,
  run: async (m) => {
    const g = getGroup(m.jid)
    return m.sendInteractive({
      title: '💳 Welcome Setting',
      body: `*Grup:* ${m.groupName}\n\n` +
        `▸ Welcome: ${g.welcome ? '✅ aktif' : '❌ mati'}\n` +
        `▸ Goodbye: ${g.goodbye ? '✅ aktif' : '❌ mati'}\n` +
        `▸ Mode: *${g.welcomeMode || 'card'}*\n` +
        `▸ Tema: *${g.welcomeTheme || 'random'}*\n` +
        `▸ Latar custom: ${g.welcomeBg ? '✅ ada' : '➖ gradient'}\n` +
        `▸ Template welcome: ${g.welcomeText ? '✏️ custom' : '📄 bawaan'}\n` +
        `▸ Template leave: ${g.leaveText ? '✏️ custom' : '📄 bawaan'}`,
      footer: config.bot.footer,
      buttons: [
        { text: '💳 Preview', id: `${config.display.prefix}welcomecard` },
        { text: '🎨 Tema', id: `${config.display.prefix}listtheme` },
        { text: g.welcome ? '❌ Matikan' : '✅ Nyalakan', id: `${config.display.prefix}welcome` }
      ]
    }).catch(() => m.reply('Info welcome tidak bisa ditampilkan.'))
  }
}
