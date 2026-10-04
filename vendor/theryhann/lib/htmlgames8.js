/**
 * 🧸 PASTEL — 10 game HTML app v7.5 + v7.6 (tema visual baru)
 * ------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan .arcade / .casino / .jadul:
 *  kartu HTML berisi canvas + D-pad (▲ ▼ ◀ ▶ + ●) + WebAudio + rekor
 *  di localStorage. Yang dibedakan hanya *penampilannya*: shell dipanggil
 *  dengan { skin: 'pastel', sub: 'PASTEL' } sehingga kulit kartunya
 *  krem/pink/mint membulat, bukan neon gelap.
 *
 *  Game:
 *    • .match3    🍬 Permen Pastel  — match-3, 25 langkah, cascade & kombo
 *    • .bubble    🫧 Balon Sabun    — bubble shooter, bidik & tembak
 *    • .pinball   🪩 Pinball Pastel — fisika bola, flipper, 3 bumper
 *    • .tikus     🐹 Tikus Tanah    — whack-a-mole 60 detik, 3 nyawa
 *    • .pipa      🚰 Pipa Bocor     — puzzle putar pipa, anggaran adaptif
 *
 *  v7.6 (5 game baru):
 *    • .pancing     🎣 Pancing Ikan  — perahu, kail, kedalaman, ikan & ubur-ubur
 *    • .ritme       🎵 Irama Pastel  — rhythm game 4 lajur, penilaian tepat waktu
 *    • .kartumemori 🧠 Kartu Memori  — 8 pasang kartu, batas waktu & bonus cepat
 *    • .donat       🍩 Donat Susun   — stack/tower: jatuhkan donat selaras
 *    • .susunhuruf  🔤 Susun Kata    — keping huruf acak, susun jadi kata
 *
 *  Isi tiap game ada di lib/pastel1..10.js (satu file per game supaya mudah
 *  dibaca & diuji terpisah).
 */
import { match3Html, PASTEL1 } from './pastel1.js'
import { bubbleHtml, PASTEL2 } from './pastel2.js'
import { pinballHtml, PASTEL3 } from './pastel3.js'
import { moleHtml, PASTEL4 } from './pastel4.js'
import { pipesHtml, PASTEL5 } from './pastel5.js'
/* v7.6 — 5 game pastel baru */
import { fishingHtml, PASTEL6 } from './pastel6.js'
import { rhythmHtml, PASTEL7 } from './pastel7.js'
import { memoryHtml, PASTEL8 } from './pastel8.js'
import { donatHtml, PASTEL9 } from './pastel9.js'
import { wordHtml, PASTEL10 } from './pastel10.js'

export {
  match3Html, bubbleHtml, pinballHtml, moleHtml, pipesHtml,
  fishingHtml, rhythmHtml, memoryHtml, donatHtml, wordHtml
}

/** 5 game pastel v7.5 */
export const PASTEL_HTML = [...PASTEL1, ...PASTEL2, ...PASTEL3, ...PASTEL4, ...PASTEL5]

/** 5 game pastel v7.6 */
export const PASTEL_HTML2 = [...PASTEL6, ...PASTEL7, ...PASTEL8, ...PASTEL9, ...PASTEL10]

/** semua 10 game pastel */
export const PASTEL_ALL = [...PASTEL_HTML, ...PASTEL_HTML2]

export default PASTEL_ALL
