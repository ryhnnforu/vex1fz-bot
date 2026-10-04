/**
 * 🎮 10 GAME MULTIPLAYER-ARENA (v7.13.0) — lib/htmlgames14.js
 *  Lawan/rekan = nama member grup (acak), arena = nama grup. Lock screen
 *  pilih jumlah lawan. Skor masuk .lbgame.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { ARCADE_8, HTML_BY_ID } from '../lib/htmlgames14.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix
function namaMember (m) {
  const parts = m.group?.participants || []
  const nama = parts.map(p => { const jid = p?.id || p?.jid || ''; if (!jid || jid === m.sender) return null; const n = p?.notify || p?.name || p?.verifiedName || ''; return n ? String(n).slice(0, 12) : `+${jid.split('@')[0].slice(-4)}` }).filter(Boolean)
  for (let i = nama.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nama[i], nama[j]] = [nama[j], nama[i]] }
  return nama.slice(0, 8)
}
const ALIAS = {
  agario: ['agar', 'agararena', 'selarena', 'agarioonline'], tankroyale: ['tankbr', 'tankarena', 'royaletank'], hexa: ['hexawars', 'paperio', 'rebutwilayah', 'wilayah'],
  balapan: ['balapanmp', 'racing2', 'sirkuit'], tinju: ['sumo', 'tinjuarena', 'dorong', 'sumoarena'], zombie: ['zombiebareng', 'zombiecoop', 'zombies', 'bertahanzombie'],
  pesawat: ['pesawat', 'perangudara', 'dogfight2', 'pesawatgrup'], bomber: ['bombergrup', 'bomberman', 'bomarena', 'bomber2'], lari: ['lari', 'fallrace', 'laririntangan2', 'rintangan'], tagteam: ['kejarkejaran', 'tag', 'petakumpet', 'kejaran']
}
export const PLUGIN_MULTI = {}
for (const g of ARCADE_8) {
  PLUGIN_MULTI['mp_' + g.id] = {
    command: [g.cmd, ...(ALIAS[g.id] || [])],
    category: 'Games',
    description: `${g.icon} ${g.title} — ${g.ket} (multiplayer-arena, pemain lain = member grup)`,
    limit: 1, cooldown: 5,
    run: async m => {
      const nama = truncate(String(m.pushName || 'kamu'), 12)
      const pemain = m.isGroup ? namaMember(m) : []
      const arena = m.isGroup ? truncate(String(m.groupName || 'GRUP'), 14).toUpperCase() : 'GLOBAL'
      const html = HTML_BY_ID[g.id](config.bot.name, { nama, pemain, arena })
      try {
        const r = await kirimGameHtml(m, { title: `${g.icon} ${g.title.toUpperCase()} — ARENA ${arena}`, html, game: g.id }).catch(e => ({ ok: false, error: e }))
        if (!r?.ok) await sendHtmlApp(m.sock, m.jid, { title: `${g.icon} ${g.title.toUpperCase()}`, html })
      } catch (e) { return m.reply(`❌ Gagal memuat ${g.title}: ${truncate(String(e.message || e), 120)}`) }
      return m.reply(`${g.icon} *${g.title.toUpperCase()} — ARENA ${arena}*\n\nKetuk *MULAI* di lock screen (pilih jumlah lawan). Kamu = *${nama}*; pemain lain: ${pemain.length ? pemain.join(', ') : 'bot bernama default (main di grup agar pakai nama member)'}.\n\n${g.ket}. Peringkat: ${P}lbgame`)
    }
  }
}
export const multiplayermenu = {
  command: ['multiplayer', 'mpgames', 'gamegrup', 'arenagrup', 'gamemultiplayer'],
  category: 'Games',
  description: '🎮 Menu 10 game multiplayer-arena (lawan = member grup): agar, tank, hexa, balapan, sumo, zombie, dogfight, bomber, lari, kejar',
  limit: 0,
  run: async m => m.reply(`🎮 *GAME MULTIPLAYER-ARENA (${ARCADE_8.length})*\n_pemain lain = nama member grup, arena = nama grup_\n\n${ARCADE_8.map(g => `${g.icon} *${P}${g.cmd}* — ${g.title}\n   ${g.ket}`).join('\n')}\n\n🐛 ${P}cacing — Cacing.io (v7.12)\nSemua game: ${P}gamerespon`)
}
export default { ...PLUGIN_MULTI, multiplayermenu }
