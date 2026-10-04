/**
 * 🕹️ ARCADE v7.6 — 5 game HTML app neon baru
 * -----------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan batch sebelumnya (.arcade, .arcade2,
 *  .arcade3): kartu **HTML app** berisi canvas + D-pad (▲ ▼ ◀ ▶ + ●) +
 *  WebAudio + rekor di localStorage, tema neon gelap.
 *
 *  Game baru (v7.6):
 *    • .missile 🛰️ Missile Command — lindungi 3 kota dari hujan rudal
 *    • .lukis   🧊 Lukis Neon       — cat 75% grid, hindari percik api
 *    • .lander  🌙 Lunar Lander     — fisika roket, mendarat presisi
 *    • .spiral  🌀 Spiral Neon      — geser menara, bola lewat celah cincin
 *    • .bomber  💣 Bomber Neon      — pasang bom, ledakkan grid & musuh
 *
 *  Isi game ada di lib/arcade6.js & lib/arcade7.js.
 *  Menu: .arcade4 (batch v7.6) · .arcadelist4 (semua 24 arcade)
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { ARCADE_4 } from '../lib/arcade8.js'
import {
  DAFTAR_ARCADE, DAFTAR_ARCADE2, DAFTAR_ARCADE3, DAFTAR_ARCADE5, DAFTAR_ARCADE6, DAFTAR_ARCADE7, DAFTAR_ARCADE8, DAFTAR_ARCADE9, DAFTAR_ARCADE_ALL
} from './arcade.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app arcade (skor disetor lewat kode di kartu) */
async function play (m, title, htmlFn, game) {
  const html = htmlFn(brand())
  try {
    const r = await kirimGameHtml(m, { title, html, game })
    if (!r.ok) throw r.error
  } catch (e) {
    await m.reply(
      `⚠️ Gagal memuat *${title}* sebagai HTML app.\n` +
      'Kemungkinan versi WhatsApp kamu belum mendukung richResponse HTML ' +
      '(butuh WA Android/iOS terbaru atau WA Web).\n' +
      `Error: ${String(e?.message || e).slice(0, 120)}`
    )
  }
  return { handled: true }
}

const NOTE =
  '💡 *Cara main:* pakai *D-pad* di bawah kartu game (▲ ▼ ◀ ▶ + ●), atau ketuk/geser ' +
  'di dalam kartu, atau tombol panah & spasi di WA Web. Skor terbaik tersimpan otomatis ' +
  'di perangkatmu.\n' +
  `🏆 *Papan peringkat:* saat game over kartu menampilkan **kode setor** — kirim ` +
  `\`${P}setorskore <kode>\` untuk mencatat skormu, lalu lihat peringkat di \`${P}lbgame\`.`

/** alias perintah tiap game (sudah dicek tidak bentrok dengan plugin lain) */
const ALIAS = {
  missile: ['missilecommand', 'rudalneon', 'cegatrudal', 'pertahanankota', 'misilneon'],
  lukis: ['lukisneon', 'catneon', 'painter', 'qix', 'warnagrid'],
  lander: ['lunarlander', 'landerneon', 'mendaratbulan', 'gravitasineon', 'kapalbulan'],
  spiral: ['spiralneon', 'helixneon', 'celahcincin', 'menarabola', 'celahspiral'],
  bomber: ['bomberneon', 'pasangbom', 'ledakgrid', 'bomneon', 'bomberman']
}

/** daftar 5 game arcade v7.6 (id/cmd/icon/nama/ket/ratio/html dari lib/arcade8.js) */
export const DAFTAR_ARCADE_4 = ARCADE_4

/** semua 24 game arcade (9 klasik + 5 v7.2 + 5 v7.3 + 5 v7.6) */
export const DAFTAR_ARCADE_ALL2 = [...DAFTAR_ARCADE_ALL, ...DAFTAR_ARCADE_4]

/** plugin game (didaftarkan otomatis oleh loader) */
export const PLUGIN_ARCADE_4 = DAFTAR_ARCADE_4.map(g => ({
  command: [g.cmd, ...(ALIAS[g.id] || [])],
  category: 'Games',
  description: `${g.icon} ${g.nama} — game arcade neon HTML app: ${g.ket}`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, g.title, g.html, g.cmd)
}))

/* ---- submenu batch v7.6 ---- */
export const arcadeMenu4 = {
  command: ['arcade4', 'arcadeneon4', 'arcadev4', 'gamearcade4', 'arcadeaksi'],
  category: 'Games',
  description: 'Submenu 5 game arcade neon HTML app baru v7.6 (Missile Command, Lukis, Lunar Lander, Spiral, Bomber)',
  limit: 0,
  run: async m => {
    const text =
      `🕹️ *${brand().toUpperCase()} ARCADE — 5 GAME BARU* (v7.6)\n\n` +
      'Kartu **HTML app** berisi canvas, *D-pad* ▲ ▼ ◀ ▶ + ●, efek suara, dan rekor ' +
      'tersimpan di perangkat. Tema neon gelap seperti batch sebelumnya.\n\n' +
      DAFTAR_ARCADE_4.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n🕹️ *Batch sebelumnya:* ${P}arcade (${DAFTAR_ARCADE.length} klasik) · ${P}arcade2 (${DAFTAR_ARCADE2.length} D-pad) · ${P}arcade3 (${DAFTAR_ARCADE3.length} puzzle)\n` +
      `Total arcade: *${DAFTAR_ARCADE_ALL2.length} game*\n\n` +
      `${NOTE}\n\nSemua kategori game: ${P}gamerespon  ·  Versi list: ${P}arcadelist4`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '🕹️ ARCADE BARU', footer: brand(),
        buttons: [
          { text: '🛰️ Missile Command', id: `${P}missile` },
          { text: '🧊 Lukis Neon', id: `${P}lukis` },
          { text: '🌙 Lunar Lander', id: `${P}lander` },
          { text: '🌀 Spiral Neon', id: `${P}spiral` },
          { text: '💣 Bomber Neon', id: `${P}bomber` },
          { text: '🕹️ Semua arcade', id: `${P}arcadelist4` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const arcadeList4 = {
  command: ['arcadelist4', 'daftararcade4', 'listarcade4', 'semuaarcade'],
  category: 'Games',
  description: `Daftar semua ${DAFTAR_ARCADE_ALL2.length} game arcade neon HTML app dalam bentuk list interaktif`,
  limit: 0,
  run: async m => {
    const row = g => ({
      title: `${g.icon} ${g.nama}`,
      description: `${g.ket || ''}${g.ratio ? ` · ${g.ratio}` : ''}`.slice(0, 90),
      id: `${P}${g.cmd}`
    })
    try {
      await sendList(m.sock, m.jid, {
        title: '🕹️ ARCADE',
        text: `${DAFTAR_ARCADE_ALL2.length} game HTML app neon (canvas + D-pad). Pilih satu untuk langsung main.`,
        footer: brand(),
        buttonText: '🕹️ Pilih Game',
        sections: [
          { title: 'Arcade baru (v7.6)', rows: DAFTAR_ARCADE_4.map(row) },
          { title: '📖 Game cerita v7.17.0', rows: DAFTAR_ARCADE9.map(row) },
          { title: '🎮 Multiplayer-arena v7.13.0', rows: DAFTAR_ARCADE8.map(row) },
          { title: '🆕 Baru v7.12.0 · lock screen', rows: DAFTAR_ARCADE7.map(row) },
          { title: '✨ Rupa asli batch 2 (v7.9.0)', rows: DAFTAR_ARCADE6.map(row) },
          { title: '✨ Rupa asli (v7.8.3)', rows: DAFTAR_ARCADE5.map(row) },
          { title: 'Arcade puzzle (v7.3)', rows: DAFTAR_ARCADE3.map(row) },
          { title: 'Arcade D-pad (v7.2)', rows: DAFTAR_ARCADE2.map(row) },
          { title: 'Arcade klasik', rows: DAFTAR_ARCADE.map(row) },
          {
            title: 'Kategori lain',
            rows: [
              { title: '🧸 Pastel (10 game)', description: 'Kulit pastel krem/pink/mint', id: `${P}pastel` },
              { title: '🎰 Kasino RPG (uang asli)', description: 'Rolet, dadu, aviator, keno, blackjack', id: `${P}kasinorpg` },
              { title: '🎰 Casino chip', description: 'Slot, poker, crash, baccarat', id: `${P}casino` },
              { title: '📱 Jadul', description: 'Pou Jump, Snake Nokia, Space Invader', id: `${P}jadul` },
              { title: '🏆 Papan peringkat game', description: 'Ranking skor semua game', id: `${P}lbgame` }
            ]
          }
        ]
      })
    } catch {
      await m.reply(
        `🕹️ *ARCADE — ${DAFTAR_ARCADE_ALL2.length} game HTML app*\n\n` +
        `*Baru (v7.6)*\n` + DAFTAR_ARCADE_4.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n*Sebelumnya*\n` + DAFTAR_ARCADE_ALL.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default { PLUGIN_ARCADE_4, arcadeMenu4, arcadeList4, DAFTAR_ARCADE_4, DAFTAR_ARCADE_ALL2 }
