/**
 * 🧰 EXTRA MENU — toimg, fancy text, translate, ringkas, cek nomor, getpp, afk
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { saveTmp, toWebp, truncate, getBuffer, resizeImage } from '../lib/functions.js'
import { aiChat } from '../lib/ai.js'

const P = config.display.prefix

/* ================= STIKER -> GAMBAR ================= */
export default {
  command: ['toimg', 'toimage', 'sticker2img', 'tofoto'],
  category: 'Tools',
  description: 'Ubah stiker jadi gambar/foto',
  limit: 1,
  run: async (m) => {
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage')
      return m.reply(`📎 Reply *stiker* dengan caption \`${P}toimg\`\n\n⚠️ Stiker GIF/animasi tidak bisa diubah jadi gambar.`)
    await m.typing()
    try {
      const d = await m.download()
      const input = saveTmp(d.buffer, 'webp')
      const output = input.replace('.webp', '.png')
      try {
        await toWebp(input, output, { animated: false }) // tidak dipakai, placeholder
      } catch {}
      // konversi webp -> png pakai ffmpeg
      const { execSync } = await import('node:child_process')
      let png = null
      try {
        execSync(`ffmpeg -y -i "${input}" "${output}"`, { stdio: 'ignore' })
        if (fs.existsSync(output)) png = fs.readFileSync(output)
      } catch {}
      for (const f of [input, output]) { try { fs.existsSync(f) && fs.unlinkSync(f) } catch {} }

      const buf = png || (await resizeImage(d.buffer, 512, 512))
      return await m.sendImage(buf, `✅ Stiker berhasil diubah jadi gambar\n\n© ${config.bot.name}`)
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

/* ================= FANCY TEXT ================= */
const FANCY_MAP = {
  bold: c => String.fromCodePoint(...[...c].map(x => (x >= 'a' && x <= 'z' ? 0x1d5ee + x.charCodeAt(0) - 97 : x >= 'A' && x <= 'Z' ? 0x1d5c4 + x.charCodeAt(0) - 65 : x >= '0' && x <= '9' ? 0x1d7ec + x.charCodeAt(0) - 48 : x.codePointAt(0)))),
  italic: c => String.fromCodePoint(...[...c].map(x => (x >= 'a' && x <= 'z' ? 0x1d622 + x.charCodeAt(0) - 97 : x >= 'A' && x <= 'Z' ? 0x1d5f8 + x.charCodeAt(0) - 65 : x.codePointAt(0)))),
  script: c => String.fromCodePoint(...[...c].map(x => (x >= 'a' && x <= 'z' ? 0x1d4b6 + x.charCodeAt(0) - 97 : x >= 'A' && x <= 'Z' ? 0x1d49c + x.charCodeAt(0) - 65 : x.codePointAt(0)))),
  mono: c => String.fromCodePoint(...[...c].map(x => (x >= 'a' && x <= 'z' ? 0x1d68a + x.charCodeAt(0) - 97 : x >= 'A' && x <= 'Z' ? 0x1d670 + x.charCodeAt(0) - 65 : x >= '0' && x <= '9' ? 0x1d7f6 + x.charCodeAt(0) - 48 : x.codePointAt(0)))),
  double: c => String.fromCodePoint(...[...c].map(x => (x >= 'a' && x <= 'z' ? 0x1d532 + x.charCodeAt(0) - 97 : x >= 'A' && x <= 'Z' ? 0x1d508 + x.charCodeAt(0) - 65 : x.codePointAt(0)))),
  strike: c => [...c].map(x => x + '\u0336').join(''),
  underline: c => [...c].map(x => x + '\u0332').join(''),
  bubble: c => {
    const map = { a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ' }
    return [...c.toLowerCase()].map(x => map[x] || x).join('')
  },
  smallcaps: c => {
    const map = { a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ' }
    return [...c.toLowerCase()].map(x => map[x] || x).join('')
  },
  upside: c => {
    const map = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' }
    return [...c.toLowerCase()].map(x => map[x] || x).reverse().join('')
  }
}

export const fancy = {
  command: ['fancy', 'style', 'fancytext', 'gaya'],
  category: 'Tools',
  description: 'Ubah teks jadi berbagai gaya font',
  limit: 0,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh: \`${P}fancy THERYHANN\`\natau \`${P}fancy bold THERYHANN\``)
    const [first, ...rest] = m.args
    const style = FANCY_MAP[first.toLowerCase()] ? first.toLowerCase() : null
    const text = style ? rest.join(' ') : m.q

    if (style) {
      let out
      try { out = FANCY_MAP[style](text) } catch { out = text }
      return m.reply(`*✒️ ${style.toUpperCase()}*\n\n${out}`)
    }

    let out = `*✒️ FANCY TEXT — ${truncate(text, 40)}*\n\n`
    for (const [name, fn] of Object.entries(FANCY_MAP)) {
      try { out += `*${name}*\n${fn(text)}\n\n` } catch {}
    }
    return m.reply(truncate(out, 3800))
  }
}

/* ================= TRANSLATE ================= */
export const translate = {
  command: ['translate', 'tr', 'terjemah'],
  category: 'AI Menu',
  description: 'Terjemahkan teks (format: .tr id|teks)',
  limit: 1,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh:\n▸ \`${P}tr en|halo apa kabar\`\n▸ \`${P}tr id|hello how are you\`\n▸ \`${P}tr hello\` (auto → Indonesia)`)
    let [lang, ...rest] = m.q.split('|')
    let text
    if (rest.length) { text = rest.join('|').trim(); lang = lang.trim().toLowerCase() }
    else { text = m.q.trim(); lang = 'id' }
    if (!text) return m.reply('❌ Teks kosong.')
    if (!/^[a-z]{2}$/.test(lang)) lang = 'id'

    await m.typing()
    try {
      const out = await aiChat(
        `Terjemahkan teks berikut ke bahasa dengan kode "${lang}".\nBalas HANYA dengan hasil terjemahan, tanpa penjelasan, tanpa tanda kutip.\n\nTeks:\n${truncate(text, 2000)}`,
        [],
        { system: 'Kamu penerjemah profesional. Balas hanya hasil terjemahan.' }
      )
      return m.sendButtons({
        title: '🌐 Translate',
        text: `*🌐 TERJEMAHAN*\n\n▸ *Asal:* ${truncate(text, 400)}\n▸ *Tujuan:* ${lang.toUpperCase()}\n\n${truncate(out, 2500)}`,
        buttons: [{ text: '🏠 Menu', id: 'act:menu:main' }]
      }).catch(() => m.reply(out))
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

/* ================= RINGKAS / PARAHRASE ================= */
export const summarize = {
  command: ['ringkas', 'summarize', 'tl;dr', 'paraphrase', 'parafrase'],
  category: 'AI Menu',
  description: 'Ringkas atau tulis ulang teks',
  limit: 1,
  run: async (m) => {
    const text = m.q || m.quoted?.text || ''
    if (!text) return m.reply(`Contoh: \`${P}ringkas <teks panjang>\`\nAtau reply pesan lalu ketik \`${P}ringkas\``)
    if (text.length < 40) return m.reply('ℹ️ Teksnya terlalu pendek untuk diringkas (min. 40 karakter).')

    await m.typing()
    try {
      const isPara = m.command === 'paraphrase' || m.command === 'parafrase'
      const prompt = isPara
        ? `Tulis ulang teks berikut dengan kalimat berbeda tapi makna sama, dalam Bahasa Indonesia yang natural:\n\n${truncate(text, 3000)}`
        : `Ringkas teks berikut jadi poin-poin singkat dalam Bahasa Indonesia (maks 5 poin):\n\n${truncate(text, 3000)}`
      const out = await aiChat(prompt, [], {
        system: isPara ? 'Kamu editor profesional.' : 'Kamu peringkas teks profesional. Balas ringkas.'
      })
      return m.sendAIRich({
        title: isPara ? '✍️ Parafrase' : '📝 Ringkasan',
        text: truncate(out, 1100),
        suggest: [`${P}parafrase`, `${P}ai jelaskan lebih detail`]
      }).catch(() => m.reply(truncate(out, 3500)))
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

/* ================= CEK NOMOR WHATSAPP ================= */
export const nowa = {
  command: ['nowa', 'cekwa', 'onwa'],
  category: 'Tools',
  description: 'Cek apakah nomor terdaftar di WhatsApp',
  limit: 1,
  run: async (m) => {
    const raw = (m.q || '').replace(/[^0-9]/g, '')
    if (!raw || raw.length < 8) return m.reply(`Contoh: \`${P}nowa 6283199329104\`\natau \`${P}nowa 6283199329104 6281234567890\``)
    const numbers = m.q.split(/[\s,]+/).map(n => n.replace(/[^0-9]/g, '')).filter(n => n.length >= 8)
    if (!numbers.length) return m.reply('❌ Nomor tidak valid.')

    await m.typing()
    try {
      const res = await m.sock.onWhatsApp(...numbers.slice(0, 10))
      if (!res?.length) return m.reply('❌ Tidak ada hasil.')
      const text = `*🔎 CEK NOMOR WHATSAPP*\n\n` +
        res.map(r => `${r.exists ? '✅' : '❌'} \`${r.jid || r.lid || '-'}\`${r.lid ? `\n    LID: ${r.lid}` : ''}`).join('\n')
      return m.reply(text)
    } catch (e) {
      return m.reply('❌ Gagal: ' + truncate(e.message, 200))
    }
  }
}

/* ================= GET PROFILE PICTURE ================= */
export const getpp = {
  command: ['getpp', 'pp', 'profilepic'],
  category: 'Tools',
  description: 'Ambil foto profil (tag/reply, default: kamu)',
  limit: 0,
  run: async (m) => {
    const target = m.mentioned[0] || m.quoted?.sender || m.sender
    await m.typing()
    try {
      const url = await m.sock.profilePictureUrl(target, 'image')
      const buf = await getBuffer(url, { timeout: 30000 }, 1)
      return await m.sendImage(buf, `📷 Foto profil @${target.split('@')[0]}`, { mentions: [target] })
    } catch {
      return m.reply('❌ Foto profil tidak tersedia (privasi dikunci / belum pasang foto).')
    }
  }
}

/* ================= AFK ================= */
const afkUsers = new Map()
export const afk = {
  command: ['afk'],
  category: 'User Menu',
  description: 'Tandai diri sedang AFK',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const reason = m.q || 'tidak ada alasan'
    afkUsers.set(key, { since: Date.now(), reason, name: m.pushName || 'User' })
    return m.reply(`💤 *AFK diaktifkan*\n\n@${key.split('@')[0]} sekarang AFK.\nAlasan: ${reason}\n\nKetik \`${P}afk off\` untuk menonaktifkan.`, { mentions: [key] })
  }
}

export function checkAfk (m) {
  const key = m.senderKey || m.sender
  if (afkUsers.has(key)) {
    const d = afkUsers.get(key)
    const mins = Math.floor((Date.now() - d.since) / 60000)
    afkUsers.delete(key)
    return `🟢 @${key.split('@')[0]} sudah kembali dari AFK (selama ${mins} menit).`
  }
  // cek apakah ada yang di-mention sedang AFK
  for (const jid of m.mentioned || []) {
    const k = String(jid)
    if (afkUsers.has(k)) {
      const d = afkUsers.get(k)
      const mins = Math.floor((Date.now() - d.since) / 60000)
      return `💤 *${d.name}* sedang AFK sejak ${mins} menit lalu.\nAlasan: ${d.reason}`
    }
  }
  return null
}
