/**
 * 🎰 CASINO HTML — 4 game kasino sebagai aplikasi HTML di dalam chat (v7.4)
 * -------------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan .arcade: kartu HTML (GenAIaeacdsnwHtmlPrimitive)
 *  berisi canvas + D-pad (▲ ▼ ◀ ▶ + ●) + efek suara WebAudio + skor terbaik
 *  tersimpan di localStorage perangkat. Bukan papan pill AIRich.
 *
 *  Game:
 *    • .slotchip  🎰 Casino Slot     — 3 gulungan, animasi putar, auto-spin
 *                 (v7.5: nama lama `.slot` sekarang dipakai Slot Mesin RPG
 *                  bertaruhan uang asli — lihat features/slotrpg.js)
 *    • .poker     🃏 Poker 5-Card    — draw vs CPU: tahan kartu, tukar, adu
 *    • .crash     🚀 Crash/Aviator   — pengali naik real-time, cash out!
 *    • .baccarat  🂡 Baccarat        — Player 2× · Banker 1,95× · Tie 9×
 *
 *  Karena HTML app berjalan sepenuhnya di dalam chat (tidak bisa memanggil
 *  balik ke bot), meja di file ini memakai *chip lokal*: mulai 2000 chip, tersimpan
 *  per game di localStorage (arc_chips_*). Chip habis = GAME OVER, tap untuk
 *  isi ulang. Rekor chip tertinggi disimpan sebagai BEST.
 *
 *  Lihat lib/htmlgames6.js (isi game) dan lib/htmlapp.js (pengiriman).
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { slotHtml, pokerHtml, crashHtml, baccaratHtml } from '../lib/htmlgames6.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app kasino, dengan fallback kalau relay ditolak client */
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
  '💡 *Cara main:* pakai *D-pad* di bawah kartu game (▲ ▼ ◀ ▶ + ●), atau ketuk ' +
  'langsung di dalam kartu. Chip & rekor tersimpan otomatis di perangkatmu.\n' +
  '🪙 *Chip:* mulai 2000 per game. Chip habis = GAME OVER, tap/● untuk isi ulang. ' +
  'Kalau meja ditinggal AFK ±15 detik, meja ditutup otomatis.\n' +
  '⚠️ Ini **hiburan saja** — chip tidak bernilai uang asli dan tidak bisa ditarik.'

/** factory plugin kasino */
const game = (command, aliases, title, htmlFn, desc) => ({
  command: [command, ...aliases],
  category: 'Games',
  description: desc || `${title} — HTML game kasino (canvas) di dalam chat`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, title, htmlFn, command)
})

/* v7.5: `.slot` sekarang = slot uang RPG asli (features/slotrpg.js).
   Versi chip lokal ini pindah ke `.slotchip` supaya keduanya tetap ada. */
export const casinoSlot = game('slotchip', ['slotcasino', 'slotarcade', 'slotdemo', 'chipslot', 'slotmesinchip', 'slothtml'],
  'Casino Slot (Chip)', slotHtml,
  'Casino Slot versi CHIP lokal (hiburan, tanpa uang RPG) — 3 gulungan beranimasi: ◀▶ taruhan · ▲ max · ▼ auto-spin · ● putar. Uang asli: .slot')
export const casinoPoker = game('poker', ['poker5', 'fivecard', 'pokerdraw', 'kartupoker', 'fivecarddraw'],
  'Poker 5-Card Draw', pokerHtml,
  'Poker 5-Card Draw — vs CPU: ◀▶ pilih kartu · ● tahan · ▲ tukar, adu kombinasi (Royal Flush s/d High Card)')
export const casinoCrash = game('crash', ['aviator', 'crashgame', 'roketcrash', 'crashmultiplier', 'roket'],
  'Crash / Aviator', crashHtml,
  'Crash/Aviator — roket meluncur, pengali naik real-time: ▲▼ taruhan · ▼ auto cash-out · ● luncur/tarik')
export const casinoBaccarat = game('baccarat', ['bakarat', 'baccaratgame', 'playerbanker', 'bacarat'],
  'Baccarat', baccaratHtml,
  'Baccarat — ◀▶ pilih PLAYER/BANKER/TIE · ▲▼ taruhan · ● deal, lengkap dengan aturan kartu ketiga')

import { DAFTAR_CASINO_RPG } from './casinorpg.js'

/** daftar 4 game kasino chip (dipakai menu, .gamerespon & test) */
export const DAFTAR_CASINO = [
  {
    id: 'slot', cmd: 'slotchip', icon: '🎰', nama: 'Casino Slot (Chip)',
    ket: '3 gulungan beranimasi, auto-spin, chip lokal — versi uang RPG: .slot',
    ratio: '560×520', chip: 'arc_chips_slot', kind: 'slotcasino', html: slotHtml
  },
  {
    id: 'poker', cmd: 'poker', icon: '🃏', nama: 'Poker 5-Card Draw',
    ket: 'vs CPU: tahan & tukar kartu, adu kombinasi, jam 12 detik',
    ratio: '600×700', chip: 'arc_chips_poker', kind: 'poker5', html: pokerHtml
  },
  {
    id: 'crash', cmd: 'crash', icon: '🚀', nama: 'Crash / Aviator',
    ket: 'pengali naik real-time — cash out sebelum roket meledak',
    ratio: '700×480', chip: 'arc_chips_crash', kind: 'crash', html: crashHtml
  },
  {
    id: 'baccarat', cmd: 'baccarat', icon: '🂡', nama: 'Baccarat',
    ket: 'Player 2× · Banker 1,95× · Tie 9× + aturan kartu ketiga',
    ratio: '600×560', chip: 'arc_chips_baccarat', kind: 'baccarat', html: baccaratHtml
  }
]

export const casinoMenu = {
  command: ['casino', 'kasino', 'casinogame', 'judikoin', 'casinomenu'],
  category: 'Games',
  description: 'Submenu kasino HTML app: slot/poker/crash/baccarat (chip lokal) + .slot uang RPG asli',
  limit: 0,
  run: async m => {
    const text =
      `🎰 *${brand().toUpperCase()} CASINO* — 10 meja HTML app\n\n` +
      'Sistemnya sama seperti *.arcade*: satu kartu **HTML app** di dalam chat berisi ' +
      'canvas, *D-pad* ▲ ▼ ◀ ▶ + ●, efek suara, dan rekor yang tersimpan di perangkatmu.\n\n' +
      `💵 *MEJA UANG RPG ASLI* (koin di ${P}rpg benar-benar dipotong/dibayarkan)\n` +
      `• ${P}slot — 🎰 *Slot Mesin RPG*  \`600×640\`\n` +
      `   3 gulungan, taruhan bisa diatur: ${P}slot 500 · ${P}slot 2.5k · ${P}slot all · ${P}slot min\n` +
      `   Hasil diacak di server · peluang ikut *luck* RPG · bonus koin dari rumah/dekorasi\n` +
      `   Tabel hadiah: ${P}slotinfo · taruhan bawaan: ${P}slotbet · riwayat: ${P}slotriwayat\n\n` +
      `🎰 *KASINO RPG v7.6* — 5 meja baru, uang asli, hasil diacak server (menu: ${P}kasinorpg)\n` +
      DAFTAR_CASINO_RPG.map(g => `• ${P}${g.cmd} — ${g.icon} *${g.nama}*\n   ${g.ket}`).join('\n') +
      `   Pembayaran terbesar otomatis masuk papan peringkat ${P}lbgame · statistik: ${P}kasinoinfo\n\n` +
      `🪙 *MEJA CHIP LOKAL* (hiburan saja, chip tidak bernilai uang)\n` +
      DAFTAR_CASINO.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n${NOTE}\n\nSemua kategori game: ${P}gamerespon  ·  Versi list: ${P}casinolist`
    try {
      await sendButtons(m.sock, m.jid, {
        text,
        title: '🎰 CASINO',
        footer: brand(),
        buttons: [
          { text: '🎰 Menu Kasino RPG', id: `${P}kasinorpg` },
          { text: '🎡 Rolet uang asli', id: `${P}rolet 500 merah` },
          { text: '🎰 Slot Uang RPG', id: `${P}slot 500` },
          { text: '🃏 Poker (chip)', id: `${P}poker` },
          { text: '🚀 Crash (chip)', id: `${P}crash` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const casinoList = {
  command: ['casinolist', 'daftarcasino', 'listcasino'],
  category: 'Games',
  description: 'Daftar 10 meja kasino HTML app (5 uang RPG asli + 4 chip lokal) dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: '🎰 CASINO',
        text: '10 meja kasino HTML app (canvas + D-pad). Pilih satu untuk langsung main.',
        footer: brand(),
        buttonText: '🎰 Pilih Game',
        sections: [{
          title: 'Kasino RPG v7.6 — uang asli',
          rows: DAFTAR_CASINO_RPG.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: g.ket.slice(0, 90),
            id: `${P}${g.cmd} 500`
          })).concat([
            { title: '🎰 Menu semua kasino RPG', description: 'rolet, dadu, aviator, keno, blackjack + statistik', id: `${P}kasinorpg` },
            { title: '📊 Statistik kasino RPG', description: 'ronde, menang, untung/rugi, RTP pribadi', id: `${P}kasinoinfo` }
          ])
        }, {
          title: 'Uang RPG asli (v7.5)',
          rows: [
            { title: '🎰 Slot Mesin RPG — taruhan uang asli', description: '.slot 500 · 3 gulungan, hasil diacak server', id: `${P}slot 500` },
            { title: '📊 Tabel hadiah & statistik slot', description: 'peluang dihitung dari luck kamu', id: `${P}slotinfo` },
            { title: '📜 Riwayat putaran slot', description: '8 putaran terakhir + untung/rugi', id: `${P}slotriwayat` }
          ]
        }, {
          title: 'Chip lokal (hiburan)',
          rows: DAFTAR_CASINO.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }]
      })
    } catch {
      await m.reply(
        `🎰 *CASINO — 10 meja HTML app*\n\n` +
        `💵 *Uang RPG asli*\n▸ 🎰 Slot Mesin RPG — ${P}slot 500  \`600×640\`\n` +
        `   taruhan bisa diatur, hasil diacak server, peluang ikut luck RPG\n` +
        `   ${P}slotinfo · ${P}slotbet · ${P}slotriwayat\n\n` +
        `🎰 *Kasino RPG v7.6 (uang asli)*\n` +
        DAFTAR_CASINO_RPG.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd} 500\n   ${g.ket}`).join('\n') +
        `\n   Menu: ${P}kasinorpg · Statistik: ${P}kasinoinfo\n\n` +
        `🪙 *Chip lokal*\n` +
        DAFTAR_CASINO.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default { casinoSlot, casinoPoker, casinoCrash, casinoBaccarat, casinoMenu, casinoList, DAFTAR_CASINO, DAFTAR_CASINO_RPG }
