/**
 * 🕹️ JADUL / RETRO HTML — 3 game rasa jaman dulu sebagai HTML app (v7.4)
 * -----------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan .arcade: kartu HTML di dalam chat berisi
 *  canvas + D-pad (▲ ▼ ◀ ▶ + ●) + WebAudio + skor terbaik di localStorage.
 *  Bukan papan pill AIRich.
 *
 *  Game:
 *    • .poujump      🐸 Pou Jump        — doodle-jump: Pou memantul otomatis,
 *                                        naik setinggi mungkin (480×720)
 *    • .snakenokia   📟 Snake Nokia     — LCD monokrom hijau ala Nokia 3310,
 *                                        font piksel, dinding = mati (480×480)
 *    • .spaceinvader 👾 Space Invader   — sprite piksel 11×8 asli, armada
 *                                        5×9 turun, 3 nyawa (560×640)
 *
 *  Lihat lib/htmlgames7.js (isi game) dan lib/htmlapp.js (pengiriman).
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { pouHtml, snakeNokiaHtml, invaderHtml } from '../lib/htmlgames7.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app jadul, dengan fallback kalau relay ditolak client */
async function play (m, title, htmlFn, game) {
  const html = htmlFn(brand())
  try {
    /* v7.6: kirim lewat helper leaderboard supaya kartu dapat nonce kode setor skor */
    if (game) {
      const r = await kirimGameHtml(m, { title, html, game })
      if (!r.ok) throw r.error
    } else {
      await sendHtmlApp(m.sock, m.jid, { title, html })
    }
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
  'di dalam kartu, atau tombol panah & spasi di WA Web. Rekor terbaik tersimpan otomatis ' +
  'di perangkatmu.\n' +
  '📟 Nuansa jadul: Pou Jump memakai fisika pantul ala Doodle Jump, Snake Nokia dirender ' +
  'sepenuhnya sebagai LCD hijau monokrom (termasuk angka piksel 3×5), dan Space Invader ' +
  'memakai sprite piksel 2 frame yang beranimasi tiap langkah armada.'

/** factory plugin jadul */
const game = (command, aliases, title, htmlFn, desc) => ({
  command: [command, ...aliases],
  category: 'Games',
  description: desc || `${title} — HTML game retro (canvas) di dalam chat`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, title, htmlFn, command)
})

export const pouJump = game('poujump', ['pou', 'poulompat', 'jumpou', 'poujadul', 'doodlejumpou'],
  'Pou Jump Retro', pouHtml,
  'Pou Jump — doodle-jump: ◀▶ geser Pou · ▲/● lompat turbo (3×, isi ulang tiap level) · ▼ terjun · hindari monster')
export const snakeNokia = game('snakenokia', ['snakenokia3310', 'nokiasnake', 'snakejadul', 'snakelcd', 'ularnokia'],
  'Snake Nokia 3310', snakeNokiaHtml,
  'Snake Nokia 3310 — LCD monokrom: ▲▼◀▶ belok · ● mulai/ulang · 22×21 sel, makin cepat tiap 5 makanan')
export const spaceInvader = game('spaceinvader', ['invaders', 'spaceinvadersjadul', 'tembakalien', 'alienjadul', 'invader'],
  'Space Invader Retro', invaderHtml,
  'Space Invader — ◀▶ geser kapal · ●/▲ tembak · habiskan 45 invader per wave sebelum mereka mendarat (3 nyawa)')

/** daftar 3 game jadul (dipakai menu, .gamerespon & test) */
export const DAFTAR_JADUL = [
  {
    id: 'poujump', cmd: 'poujump', icon: '🐸', nama: 'Pou Jump',
    ket: 'doodle-jump: pantul otomatis, per emas, platform geser & rapuh, monster',
    ratio: '480×720', kind: 'poujump', html: pouHtml
  },
  {
    id: 'snakenokia', cmd: 'snakenokia', icon: '📟', nama: 'Snake Nokia 3310',
    ket: 'LCD hijau monokrom, angka piksel, dinding = mati, level tiap 5 makanan',
    ratio: '480×480', kind: 'snakenokia', html: snakeNokiaHtml
  },
  {
    id: 'spaceinvader', cmd: 'spaceinvader', icon: '👾', nama: 'Space Invader',
    ket: 'sprite piksel 2 frame, armada 5×9 turun, bom musuh membidik, 3 nyawa',
    ratio: '560×640', kind: 'invaders', html: invaderHtml
  }
]

export const jadulMenu = {
  command: ['jadul', 'retro', 'gamejadul', 'jadulmenu', 'retrogame'],
  category: 'Games',
  description: 'Submenu 3 game jadul/retro HTML app (Pou Jump, Snake Nokia, Space Invader)',
  limit: 0,
  run: async m => {
    const text =
      `🕹️ *${brand().toUpperCase()} JADUL ARCADE* — 3 game HTML app\n\n` +
      'Tiga game rasa jaman dulu, tapi memakai sistem yang sama dengan *.arcade*: ' +
      'satu kartu **HTML app** di dalam chat berisi canvas, *D-pad* ▲ ▼ ◀ ▶ + ●, ' +
      'efek suara, dan rekor yang tersimpan di perangkatmu.\n\n' +
      DAFTAR_JADUL.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n${NOTE}\n\nSemua kategori game: ${P}gamerespon  ·  Versi list: ${P}jadullist`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '🕹️ GAME JADUL', footer: brand(),
        buttons: [
          { text: '🐸 Pou Jump', id: `${P}poujump` },
          { text: '📟 Snake Nokia', id: `${P}snakenokia` },
          { text: '👾 Invader', id: `${P}spaceinvader` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const jadulList = {
  command: ['jadullist', 'daftargamejadul', 'listjadul'],
  category: 'Games',
  description: 'Daftar 3 game jadul HTML app dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: '🕹️ JADUL',
        text: '3 game retro HTML app (canvas + D-pad). Pilih satu untuk langsung main.',
        footer: brand(),
        buttonText: '🕹️ Pilih Game',
        sections: [{
          title: 'Jadul (v7.4)',
          rows: DAFTAR_JADUL.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }]
      })
    } catch {
      await m.reply(
        `🕹️ *JADUL — 3 game HTML app*\n\n` +
        DAFTAR_JADUL.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default { pouJump, snakeNokia, spaceInvader, jadulMenu, jadulList, DAFTAR_JADUL }
