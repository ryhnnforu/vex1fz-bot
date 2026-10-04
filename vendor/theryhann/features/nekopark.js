/**
 * 🐱 .nekopark — NEKO PARK · SAKURA (v7.11.0) · lib/nekopark.js
 *  Taman kucing online-style ala referensi video: kucing kuning bernama,
 *  bom/tinju/pancing, emote, chat global, koin, bendera jarak pemain lain.
 *  "Pemain lain" = kucing AI bernama member grup (acak) — di private chat
 *  memakai nama bawaan. Koin & rekor tersimpan di perangkat.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { nekoParkHtml } from '../lib/nekopark.js'
import { cacingHtml } from '../lib/htmlgames13.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix

function namaMember (m) {
  const parts = m.group?.participants || []
  const nama = parts.map(p => {
    const jid = p?.id || p?.jid || ''
    if (!jid || jid === m.sender) return null
    const n = p?.notify || p?.name || p?.verifiedName || ''
    return n ? String(n).slice(0, 12) : `+${jid.split('@')[0].slice(-4)}`
  }).filter(Boolean)
  for (let i = nama.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nama[i], nama[j]] = [nama[j], nama[i]] }
  return nama.slice(0, 6)
}

export const nekopark = {
  command: ['nekopark', 'neko', 'tamankucing', 'nekoparkonline', 'sakurapark'],
  category: 'Games',
  description: '🐱 Neko Park · Sakura — taman kucing "online": ◀▶ lompat, 💣 bom jauh/dekat, 🥊 home-run, 🎣 tangkap, emote, chat, koin; pemain lain = nama member grup',
  limit: 1,
  cooldown: 5,
  run: async m => {
    const nama = truncate(String(m.pushName || 'kamu'), 12)
    const pemain = m.isGroup ? namaMember(m) : []
    const taman = m.isGroup ? truncate(String(m.groupName || 'GRUP'), 14).toUpperCase() : 'GLOBAL'
    const seed = m.isGroup ? [...String(m.jid)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7) : 7
    const html = nekoParkHtml(config.bot.name, { nama, pemain, taman, seed })
    try {
      const r = await kirimGameHtml(m, { title: '🐱 NEKO PARK — MODE ONLINE', html, game: 'nekopark' }).catch(e => ({ ok: false, error: e }))
      if (!r?.ok) await sendHtmlApp(m.sock, m.jid, { title: '🐱 NEKO PARK — MODE ONLINE', html })
    } catch (e) { return m.reply(`❌ Gagal memuat Neko Park: ${truncate(String(e.message || e), 120)}`) }
    return m.reply(`🐱 *NEKO PARK — MODE ONLINE*\n\nBuka kartunya, isi nama kucingmu = *${nama}*, lalu main di taman *${taman}* bersama ${pemain.length ? pemain.join(', ') : 'pemain lain'}.\n\n◀ ▶ jalan (2× tap = dash) · ⤒ LOMPAT · ▲JAUH/▼DEKAT jarak lempar · 💣 bom → kena pemain = +2 koin · 🥊 home-run · 🎣 tarik pemain · 👋❤️😂 emote · 💬 chat\n🟡 koin tersimpan di HP-mu. Peringkat: ${P}lbgame`)
  }
}

/* v7.12.0: Cacing.io — lawan = nama member grup, arena = nama grup */
export const cacingio = {
  command: ['cacing', 'cacingio', 'wormio', 'slither', 'ularonline', 'cacingonline'],
  category: 'Games',
  description: '🐛 Cacing.io — arena worm io: joystick 8 arah + BOOST, lawan = member grup, minimap & peringkat; lock screen pilih jumlah lawan',
  limit: 1,
  cooldown: 5,
  run: async m => {
    const nama = truncate(String(m.pushName || 'kamu'), 12)
    const pemain = m.isGroup ? namaMember(m) : []
    const arena = m.isGroup ? truncate(String(m.groupName || 'GRUP'), 14).toUpperCase() : 'GLOBAL'
    const html = cacingHtml(config.bot.name, { nama, pemain, arena })
    try {
      const r = await kirimGameHtml(m, { title: '🐛 CACING.IO — ARENA ' + arena, html, game: 'cacing' }).catch(e => ({ ok: false, error: e }))
      if (!r?.ok) await sendHtmlApp(m.sock, m.jid, { title: '🐛 CACING.IO', html })
    } catch (e) { return m.reply(`❌ Gagal memuat Cacing.io: ${truncate(String(e.message || e), 120)}`) }
    return m.reply(`🐛 *CACING.IO — ARENA ${arena}*\n\nKetuk *MULAI* di lock screen (pilih jumlah lawan). Kamu = *${nama}*, lawan: ${pemain.length ? pemain.join(', ') : 'cacing AI'}.\n\n✥ joystick 8 arah / geser jari · ⚡ BOOST (tahan, memakai panjang) · makan titik cahaya · kepala nabrak badan = mati. Peringkat: ${P}lbgame`)
  }
}

export default { nekopark, cacingio }
