/**
 * 🧸 PASTEL — 5 game HTML app dengan tema visual baru (v7.5)
 * -----------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan .arcade / .casino / .jadul: satu kartu
 *  **HTML app** di dalam chat berisi canvas + D-pad (▲ ▼ ◀ ▶ + ●) +
 *  WebAudio + rekor di localStorage. Bukan papan pill AIRich.
 *
 *  Yang membedakan: shell dipanggil dengan { skin: 'pastel' } sehingga
 *  kulit kartunya krem/pink/mint membulat dengan huruf Comic Sans,
 *  bukan neon gelap seperti arcade.
 *
 *  Game:
 *    • .match3   🍬 Permen Pastel  — match-3 8×8, 25 langkah, cascade + kombo
 *    • .bubble   🫧 Balon Sabun    — bubble shooter, bidik ◀▶, 3+ sewarna pecah
 *    • .pinball  🪩 Pinball Pastel — fisika bola, 2 flipper, 3 bumper, 3 bola
 *    • .tikus    🐹 Tikus Tanah    — whack-a-mole 3×3, 60 detik, 3 nyawa, bom
 *    • .pipa     🚰 Pipa Bocor     — puzzle putar pipa 6×6, anggaran adaptif
 *
 *  Lihat lib/pastel1..5.js (isi game), lib/htmlgames8.js (daftar),
 *  dan lib/htmlapp.js (pengiriman).
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import {
  match3Html, bubbleHtml, pinballHtml, moleHtml, pipesHtml
} from '../lib/htmlgames8.js'
import { DAFTAR_PASTEL_2 } from './pastelbaru.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app pastel, dengan fallback kalau relay ditolak client */
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
  '💡 *Cara main:* pakai *D-pad* di bawah kartu game (▲ ▼ ◀ ▶ + ●), atau ketuk langsung ' +
  'di dalam kartu, atau tombol panah & spasi di WA Web. Rekor terbaik tersimpan otomatis ' +
  'di perangkatmu.\n' +
  '🧸 *Bedanya dengan .arcade:* mesinnya sama persis (canvas + D-pad + WebAudio + ' +
  'localStorage), tapi kulitnya **pastel** — latar krem, tombol membulat, karakter ' +
  'berwajah. Tanpa lampu neon, tanpa latar gelap.'

/** factory plugin pastel */
const game = (command, aliases, title, htmlFn, desc) => ({
  command: [command, ...aliases],
  category: 'Games',
  description: desc || `${title} — HTML game pastel (canvas) di dalam chat`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, title, htmlFn, command)
})

export const match3 = game('match3', ['permen', 'permenpastel', 'cocokpermen', 'matchthree', 'candypastel'],
  'Permen Pastel', match3Html,
  'Permen Pastel — match-3: ▲▼◀▶ geser kursor · ● pilih lalu tukar dua permen bersebelahan · 3+ sewarna meletus, cascade = kombo berlipat · 25 langkah')
export const bubble = game('bubble', ['balon', 'balonsabun', 'tembakbalon', 'bubbleshooter', 'soapbubble'],
  'Balon Sabun', bubbleHtml,
  'Balon Sabun — bubble shooter: ◀▶ bidik kasar, ▲▼ bidik halus, ● tembak · 3+ balon sewarna bersentuhan pecah · gugusan lepas ikut jatuh · tiap 8 tembakan langit-langit turun')
export const pinball = game('pinball', ['flipper', 'pinballpastel', 'bolapinball', 'mesinpinball', 'pinballcute'],
  'Pinball Pastel', pinballHtml,
  'Pinball Pastel — ● luncurkan bola · ◀ flipper kiri · ▶ flipper kanan · 3 bumper membal & memberi poin · 3 bola, jangan sampai jatuh ke lubang')
export const tikus = game('tikus', ['tikustanah', 'whackamole', 'pukultikus', 'tikuslubang', 'molepastel'],
  'Tikus Tanah', moleHtml,
  'Tikus Tanah — whack-a-mole: ▲▼◀▶ pindah lubang · ● pukul · 🐹 +10 · ⭐ emas +50 · 💣 bom -1 nyawa · 60 detik, tempo naik tiap 8 detik')
export const pipa = game('pipa', ['pipabocor', 'sambungpipa', 'putarpipa', 'airpipa', 'pipepuzzle'],
  'Pipa Bocor', pipesHtml,
  'Pipa Bocor — puzzle: ▲▼◀▶ pindah sel · ● putar pipa 90° · alirkan air dari sumber kiri ke bintang kanan · tiap putaran memakan 1 langkah, anggaran disesuaikan tingkat kesulitan')

/** semua 10 game pastel (v7.5 + v7.6) — dipakai menu & .gamerespon */
export const DAFTAR_PASTEL_ALL = () => [...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2]

/** daftar 5 game pastel (dipakai menu, .gamerespon & test) */
export const DAFTAR_PASTEL = [
  {
    id: 'match3', cmd: 'match3', icon: '🍬', nama: 'Permen Pastel',
    ket: 'match-3 8×8: tukar dua permen bersebelahan, 3+ sewarna meletus, cascade = kombo berlipat, 25 langkah',
    ratio: '520×620', kind: 'match3', html: match3Html
  },
  {
    id: 'bubble', cmd: 'bubble', icon: '🫧', nama: 'Balon Sabun',
    ket: 'bubble shooter: bidik & tembak, 3+ balon sewarna pecah, gugusan lepas jatuh, langit-langit turun tiap 8 tembakan',
    ratio: '520×640', kind: 'bubble', html: bubbleHtml
  },
  {
    id: 'pinball', cmd: 'pinball', icon: '🪩', nama: 'Pinball Pastel',
    ket: 'fisika bola sungguhan: 2 flipper, 3 bumper, dinding corongan, 3 bola per sesi',
    ratio: '480×700', kind: 'pinball', html: pinballHtml
  },
  {
    id: 'tikus', cmd: 'tikus', icon: '🐹', nama: 'Tikus Tanah',
    ket: 'whack-a-mole 3×3: 60 detik, 3 nyawa, tikus +10 / emas +50 / bom -1 nyawa, kombo mengalikan poin',
    ratio: '520×560', kind: 'tikus', html: moleHtml
  },
  {
    id: 'pipa', cmd: 'pipa', icon: '🚰', nama: 'Pipa Bocor',
    ket: 'puzzle putar pipa 6×6: sambungkan air dari sumber ke keluaran, anggaran langkah dijamin cukup',
    ratio: '560×560', kind: 'pipa', html: pipesHtml
  }
]

export const pastelMenu = {
  command: ['pastel', 'pastelmenu', 'gamepastel', 'kawaii', 'pastelgame'],
  category: 'Games',
  description: 'Submenu 10 game pastel HTML app (v7.5: Permen, Balon, Pinball, Tikus, Pipa · v7.6: Pancing, Irama, Kartu Memori, Donat, Susun Kata)',
  limit: 0,
  run: async m => {
    const text =
      `🧸 *${brand().toUpperCase()} PASTEL ARCADE* — 10 game HTML app\n\n` +
      'Mesinnya **sama persis** dengan *.arcade*: satu kartu **HTML app** di dalam chat ' +
      'berisi canvas, *D-pad* ▲ ▼ ◀ ▶ + ●, efek suara, dan rekor yang tersimpan di ' +
      'perangkatmu. Yang beda **kulitnya** — pastel krem/pink/mint, membulat, berkarakter lucu.\n\n' +
      '*Batch v7.5*\n' +
      DAFTAR_PASTEL.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n*Batch v7.6 (baru)*\n` +
      DAFTAR_PASTEL_2.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n${NOTE}\n\nSemua kategori game: ${P}gamerespon  ·  Versi list: ${P}pastellist2  ·  Hanya batch baru: ${P}pastel2`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '🧸 GAME PASTEL', footer: brand(),
        buttons: [
          { text: '🎣 Pancing Ikan', id: `${P}pancing` },
          { text: '🎵 Irama Pastel', id: `${P}ritme` },
          { text: '🧠 Kartu Memori', id: `${P}kartumemori` },
          { text: '🍩 Donat Susun', id: `${P}donat` },
          { text: '🔤 Susun Kata', id: `${P}susunhuruf` },
          { text: '🧸 Daftar lengkap (10)', id: `${P}pastellist2` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const pastelList = {
  command: ['pastellist', 'daftargamepastel', 'listpastel'],
  category: 'Games',
  description: 'Daftar 10 game pastel HTML app (v7.5 + v7.6) dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: '🧸 PASTEL',
        text: '10 game HTML app berkulit pastel (canvas + D-pad). Pilih satu untuk langsung main.',
        footer: brand(),
        buttonText: '🧸 Pilih Game',
        sections: [{
          title: 'Pastel baru (v7.6)',
          rows: DAFTAR_PASTEL_2.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }, {
          title: 'Pastel (v7.5)',
          rows: DAFTAR_PASTEL.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }, {
          title: 'Kategori lain',
          rows: [
            { title: '🕹️ Arcade (19 game neon)', description: 'Canvas + D-pad, tema neon gelap', id: `${P}arcade` },
            { title: '🎰 Casino chip (4 game)', description: 'Slot, poker, crash, baccarat — chip lokal', id: `${P}casino` },
            { title: '🎰 Kasino RPG (5 game)', description: 'Rolet, dadu, aviator, keno, blackjack — uang RPG asli', id: `${P}kasinorpg` },
            { title: '📱 Jadul (3 game)', description: 'Pou Jump, Snake Nokia, Space Invader', id: `${P}jadul` },
            { title: '🧩 Semua game', description: '70 game lintas kategori HTML + lab AIRich', id: `${P}gamerespon` }
          ]
        }]
      })
    } catch {
      await m.reply(
        `🧸 *PASTEL — 10 game HTML app*\n\n` +
        [...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2].map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default { match3, bubble, pinball, tikus, pipa, pastelMenu, pastelList, DAFTAR_PASTEL }
