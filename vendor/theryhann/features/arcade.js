/**
 * 🕹️ ARCADE HTML — game canvas interaktif di dalam chat WhatsApp
 * ------------------------------------------------------------
 *  Setiap game dikirim sebagai AI Rich response message yang
 *  membawa primitive HTML (GenAIaeacdsnwHtmlPrimitive), jadi
 *  web-app-nya jalan LANGSUNG di dalam chat: tap, swipe, skor,
 *  best score tersimpan, ada efek suara (WebAudio).
 *
 *  Game (semuanya self-contained, tanpa resource eksternal):
 *    • Geometry Dash Mini  — cube double-jump, rintangan, level
 *    • Snake Neon          — swipe/arrow, makan, speed naik
 *    • Flappy Neon         — tap untuk terbang, hindari pipa
 *    • Breakout Neon       — paddle + bola, bata 3 HP, 3 nyawa (v7.1)
 *    • Space Shooter       — auto-tembak, musuh bergelombang (v7.1)
 *    • Dino Run            — endless runner, lompat & menunduk (v7.1)
 *    • Tetris Neon         — 7 tetromino, line clear, level (v7.1)
 *    • Pong Neon           — lawan CPU, first-to-3 (v7.1)
 *    • Neon Jump           — lompat antar platform, layar auto-naik (v7.1)
 *    • Frogger Neon        — seberang jalan & sungai, 4 slot (v7.2)
 *    • Maze Neon           — labirin acak, kumpulkan koin, cari pintu (v7.2)
 *    • Neon Racer          — balap 4 lajur, gas/rem, hindari mobil (v7.2)
 *    • Tank Neon           — tank 4 arah, turret auto-bidik (v7.2)
 *    • Neon Hunt           — bidik 4 arah, tembak drone, kuota ronde (v7.2)
 *    • (v7.33.0: Akinator pindah → game chat tanya-jawab, bukan HTML lagi)
 *    • Block Blast Neon    — papan 8×8, taruh blok, ledakkan baris (v7.3)
 *    • Catur Neon          — catur penuh + AI minimax, jam 90 detik (v7.3)
 *    • Minesweeper Neon    — 4 level, gali aman, pasang bendera (v7.3)
 *    • Asteroids Neon      — putar, dorong, tembak batu, lompat ruang (v7.3)
 *
 *  v7.2: semua game punya D-pad on-screen (▲ ▼ ◀ ▶ + ●) dan ratio
 *  canvas masing-masing (portrait / square / landscape).
 *  v7.3: +5 game "puzzle & papan" (turn-based) dengan mekanisme kalah
 *  berbasis waktu supaya tetap ada GAME OVER.
 *
 *  Lihat lib/htmlapp.js (pengiriman), lib/htmlgames.js (shell + 3 game),
 *  lib/htmlgames2.js & lib/htmlgames3.js (6 game v7.1),
 *  lib/htmlgames4.js (5 game v7.2), lib/htmlgames5.js (5 game v7.3).
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { gdMiniHtml, snakeHtml, flappyHtml } from '../lib/htmlgames.js'
import { breakoutHtml, shooterHtml, dinoHtml } from '../lib/htmlgames2.js'
import { tetrisHtml, pongHtml, jumpHtml } from '../lib/htmlgames3.js'
import { froggerHtml, mazeHtml, racerHtml, tankHtml, huntHtml } from '../lib/htmlgames4.js'
import {
  blockblastHtml, caturHtml, minesweeperHtml, asteroidsHtml
} from '../lib/htmlgames5.js'
import { dua2048Html } from '../lib/htmlgames9.js'
import { fruitninjaHtml } from '../lib/htmlgames10.js'
import { flappyBirdHtml, pacmanHtml, subwayHtml, ARCADE_5 } from '../lib/htmlgames11.js'
import { ARCADE_4 } from '../lib/arcade8.js'
import { candyHtml, templeHtml, angryHtml, marioHtml, ARCADE_6 } from '../lib/htmlgames12.js'
import { beatHtml, menaraHtml, bubbleHtml, cacingHtml, sushiHtml, ARCADE_7 } from '../lib/htmlgames13.js'
import { ARCADE_8 } from '../lib/htmlgames14.js'
import { ARCADE_9 } from '../lib/htmlgames15.js'
import { guitarFlashHtml } from '../lib/htmlgamesguitarflash.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app, dengan fallback kalau relay ditolak client */
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
  '💡 *Cara main:* pakai *D-pad* di bawah kartu game (▲ ▼ ◀ ▶ + ●), ' +
  'atau ketuk/geser di dalam kartu, atau tombol panah & spasi di WA Web. ' +
  'Skor terbaik tersimpan otomatis di perangkatmu.'

/** factory plugin arcade */
const game = (command, aliases, title, htmlFn, desc) => ({
  command: [command, ...aliases],
  category: 'Games',
  description: desc || `${title} — HTML game (canvas) di dalam chat`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, title, htmlFn, command)
})

/* ---------------- 3 game lama (v5) ---------------- */
export const gdMini = game('gd', ['gdmini', 'geometrydash', 'geometry'], 'Geometry Dash Mini', gdMiniHtml)
export const snakeNeon = game('snake', ['snakeneon', 'neonsnake'], 'Snake Neon', snakeHtml)
export const flappyNeon = game('flappy', ['flappyneon', 'neonflappy'], 'Flappy Neon', flappyHtml)

/* ---------------- 6 game baru (v7.1) ---------------- */
export const breakoutNeon = game('breakout', ['breakoutneon', 'brickbreaker', 'hancurkanbata', 'pantulkanbola'],
  'Breakout Neon', breakoutHtml, 'Breakout Neon — pantulkan bola, hancurkan bata (3 nyawa, level makin cepat)')
export const spaceShooter = game('spaceshooter', ['shooterneon', 'tembakmusuh', 'pesawattempur', 'galaxwar'],
  'Space Shooter', shooterHtml, 'Space Shooter — pesawat auto-tembak, musuh bergelombang + peluru musuh')
export const dinoRun = game('dino', ['dinorun', 'laridino', 'runnerneon', 'dinolompat'],
  'Dino Run', dinoHtml, 'Dino Run — endless runner: lompat kaktus, menunduk hindari burung')
export const tetrisNeon = game('tetris', ['tetrisneon', 'susunbalok', 'blokneon'],
  'Tetris Neon', tetrisHtml, 'Tetris Neon — 7 tetromino, putar/jatuhkan, bersihkan baris')
export const pongNeon = game('pong', ['pongneon', 'pingpong', 'vs cpu'.replace(' ', ''), 'rebound'],
  'Pong Neon', pongHtml, 'Pong Neon — lawan CPU, first-to-3, bola makin cepat tiap pukulan')
export const neonJump = game('neonjump', ['jumpneon', 'lompatneon', 'jumphero', 'lompatplatform'],
  'Neon Jump', jumpHtml, 'Neon Jump — lompat antar platform, layar terus naik, jangan jatuh')

/* ---------------- 5 game baru (v7.2) — D-pad 4 arah ---------------- */
export const froggerNeon = game('frogger', ['froggerneon', 'katakneon', 'kodoklompat', 'seberangjalan', 'seberangsungai'],
  'Frogger Neon', froggerHtml,
  'Frogger Neon — seberangi 4 lajur mobil & 3 sungai pakai log, isi 4 slot (▲▼◀▶)')
export const mazeNeon = game('maze', ['mazeneon', 'labirin', 'labirinneon', 'carikoin', 'jelajahlabirin'],
  'Maze Neon', mazeHtml,
  'Maze Neon — labirin acak 15×15: ambil semua koin lalu keluar lewat pintu (▲▼◀▶)')
export const neonRacer = game('racing', ['neonracer', 'racerneon', 'balapmobil', 'balapan', 'touringneon'],
  'Neon Racer', racerHtml,
  'Neon Racer — balap 4 lajur: ◀▶ pindah lajur, ▲ gas, ▼ rem, hindari mobil & truk')
export const tankNeon = game('tank', ['tankneon', 'perangtank', 'tankbattle', 'tankperang', 'neontank'],
  'Tank Neon', tankHtml,
  'Tank Neon — gerak 4 arah di arena, turret membidik otomatis, berlindung di balik blok')
export const neonHunt = game('neonhunt', ['huntneon', 'berburudrone', 'tembakdrone', 'bidikneon', 'huntgame'],
  'Neon Hunt', huntHtml,
  'Neon Hunt — geser bidikan 4 arah, tekan ● untuk menembak drone, penuhi kuota ronde')

/* ---------------- 5 game baru (v7.3) — puzzle & papan ---------------- */
export const blockBlastNeon = game('blockblast', ['blockblastneon', 'susunblok', 'blastblok', 'blok8x8', 'ledakbaris'],
  'Block Blast Neon', blockblastHtml,
  'Block Blast Neon — papan 8×8: taruh 3 blok per ronde, isi baris/kolom penuh supaya meledak')
export const caturNeon = game('catur', ['caturneon', 'chess', 'chessneon', 'caturname', 'skakmat'],
  'Catur Neon', caturHtml,
  'Catur Neon — catur lengkap (rokade, promosi, skak, skakmat) melawan AI minimax, jam 90 detik')
export const minesweeperNeon = game('minesweeper', ['minesweeperneon', 'sapuranjau', 'ranjau', 'minesneon', 'ladangranjau'],
  'Minesweeper Neon', minesweeperHtml,
  'Minesweeper Neon — 4 level (9×9 s/d 13×13): gali sel aman, tahan ● untuk bendera, hindari ranjau')
/* ---------------- game baru (v7.7.3+) ---------------- */
export const fruitNinja = game('fruitninja', ['fruitslice', 'ninja buah'.replace(' ', ''), 'slicefruit', 'sapufruma'], 'Fruit Ninja', fruitninjaHtml,
  'Fruit Ninja — iris buah yang melempar: tap langsung di buahnya atau ▲▼◀▶ gerakin kursor lalu ● = iris. Kombo ×3+ momen! 💣 hilang nyawa.')
/* ---------------- v7.8.3: 3 game RUPA ASLI, D-pad menyesuaikan game ---------------- */
export const flappyBird = game('flappybird', ['flappyasli', 'flappyoriginal', 'burungflappy', 'fb'], 'Flappy Bird', flappyBirdHtml,
  'Flappy Bird — tampilan persis aslinya: burung kuning, pipa hijau, tanah bergaris, medali. Kontrol cuma ● / tap')
export const pacMan = game('pacman', ['pacmanasli', 'pakman', 'pacmen', 'hantukuning'], 'Pac-Man', pacmanHtml,
  'Pac-Man — labirin biru klasik 28×31, 4 hantu (Blinky/Pinky/Inky/Clyde), power-pellet, buah bonus. D-pad ▲▼◀▶')
export const subwaySurf = game('subway', ['subwaysurf', 'subwaysurfers', 'surfers', 'larikereta', 'subwayrun'], 'Subway Surf', subwayHtml,
  'Subway Surf — lari 3 jalur perspektif: kereta, palang, koin, hoverboard. ◀▶ jalur · ▲ lompat · ▼ guling · ● hoverboard')
/* ---------------- v7.12.0: 5 game baru + LOCK SCREEN ---------------- */
export const beatDrop = game('beatdrop', ['beat', 'rhythm', 'beatgame', 'pianotiles', 'beatdropgame'], 'Beat Drop', beatHtml,
  'Beat Drop — game ritme 4 lajur neon: ketuk pad D F J K saat balok menyentuh lingkaran. PERFECT/GOOD, combo & HP. Lock screen pilih BPM')
export const menaraLangit = game('menara', ['menaralangit', 'stack', 'tumpukbalok', 'towerstack', 'menaragame'], 'Menara Langit', menaraHtml,
  'Menara Langit — tumpuk balok dari crane berayun dengan satu tombol JATUHKAN; pas sempurna = PERFECT +5, meleset = terpotong, jauh = runtuh')
export const bubblePop = game('gelembung', ['bubblepop', 'tembakgelembung', 'gelembungpop', 'bubblepopgame', 'popgelembung'], 'Bubble Pop', bubbleHtml,
  'Bubble Pop — bubble shooter permen pastel: slider bidik + ◀▶, TEMBAK, TUKAR; 3 warna = pop, yang menggantung ikut jatuh')
export const sushiMaster = game('sushi', ['sushimaster', 'dapursushi', 'sushigame', 'masaksushi', 'kokisushi'], 'Sushi Master', sushiHtml,
  'Sushi Master — kelola bar sushi: baca pesanan, ketuk 8 tombol bahan, SAJIKAN sebelum kesabaran habis; omzet & tip')
/* ---------------- v7.9.0: 4 game RUPA ASLI batch 2 ---------------- */
export const candyCrush = game('candycrush', ['candy', 'candysaga', 'permen3', 'candycrushsaga'], 'Candy Crush', candyHtml,
  'Candy Crush — match-3 permen warna-warni: 4 sejajar = permen bergaris, 5 = bom warna. Target skor per level, gerakan terbatas. ▲▼◀▶ + ●')
export const templeRun = game('templerun', ['temple', 'larikuil', 'templerun2', 'kuilrun'], 'Temple Run', templeHtml,
  'Temple Run — lari di lorong kuil: belok di tikungan, lompat akar & jurang, slide di bawah api, jangan sampai monyet iblis menangkapmu')
export const angryBirds = game('angrybirds', ['angrybird', 'burungmarah', 'ketapel', 'angry'], 'Angry Birds', angryHtml,
  'Angry Birds — ketapel burung merah/kuning/hitam ke benteng babi hijau (kayu, es, batu). ◀▶ sudut · ▲▼ tenaga · ● tembak & kekuatan')
export const superJump = game('superjump', ['mario', 'supermario', 'platformer', 'jumpman', 'marioasli'], 'Super Jump', marioHtml,
  'Super Jump — platformer ala Mario: bata, kotak ?, koin, kura-kura, jamur besar, pipa hijau, bendera akhir. ◀▶ jalan · ▲/● lompat')
/* ---------------- game baru (v7.7.3) ---------------- */
export const d2048 = game('2048', ['d2048', 'twenty48', 'gabung angka'.replace(' ', '')], '2048', dua2048Html,
  '2048 — geser semua tile ke satu sisi, gabungkan yang sama, raih 2048. Penampilan seperti game aslinya')
export const asteroidsNeon = game('asteroids', ['asteroidsneon', 'batuangkasa', 'hancurkanbatu', 'asteroidgame', 'neonroids'],
  'Asteroids Neon', asteroidsHtml,
  'Asteroids Neon — putar & dorong pesawat, tembak batu sampai pecah, ▼ lompat ruang (3 nyawa)')

/* ---------------- game ritme (v7.37.0) ---------------- */
export const guitarFlash = game('guitarflash',
  ['guitarhero', 'guitar', 'gitarflash', 'gitarhero', 'mainigitar', 'pianohero', 'gitarritme', 'gitarneon'],
  'Guitar Flash', guitarFlashHtml,
  'Guitar Flash — game ritme 4 lajur: pilih lagu & tingkat, pukul note (D F J K / tap) ' +
  'tepat di garis pukul, kumpulkan combo + STAR POWER 2×')

/** daftar semua game arcade (dipakai menu & test) */
export const DAFTAR_ARCADE = [
  { id: 'gd', cmd: 'gd', icon: '🟦', nama: 'Geometry Dash Mini', ket: 'cube double-jump hindari rintangan', html: gdMiniHtml },
  { id: 'snake', cmd: 'snake', icon: '🐍', nama: 'Snake Neon', ket: 'swipe/panah, makan, makin cepat', html: snakeHtml },
  { id: 'flappy', cmd: 'flappy', icon: '🐤', nama: 'Flappy Neon', ket: 'tap untuk terbang, hindari pipa', html: flappyHtml },
  { id: 'breakout', cmd: 'breakout', icon: '🧱', nama: 'Breakout Neon', ket: 'pantulkan bola, hancurkan bata 3 HP', html: breakoutHtml },
  { id: 'shooter', cmd: 'spaceshooter', icon: '🚀', nama: 'Space Shooter', ket: 'auto-tembak pesawat musuh ber-gelombang', html: shooterHtml },
  { id: 'dino', cmd: 'dino', icon: '🦖', nama: 'Dino Run', ket: 'lompat kaktus, menunduk hindari burung', html: dinoHtml },
  { id: 'tetris', cmd: 'tetris', icon: '🟪', nama: 'Tetris Neon', ket: 'susun balok, bersihkan baris, naik level', html: tetrisHtml },
  { id: 'pong', cmd: 'pong', icon: '🏓', nama: 'Pong Neon', ket: 'lawan CPU, first-to-3', html: pongHtml },
  { id: 'jump', cmd: 'neonjump', icon: '⬆️', nama: 'Neon Jump', ket: 'lompat platform, layar auto-naik', html: jumpHtml }
]

/** 5 game batch v7.2 (D-pad 4 arah, ratio canvas masing-masing) */
export const DAFTAR_ARCADE2 = [
  { id: 'frogger', cmd: 'frogger', icon: '🐸', nama: 'Frogger Neon', ket: '4 arah: hindari mobil, naik log, isi 4 slot', ratio: '560×620', html: froggerHtml },
  { id: 'maze', cmd: 'maze', icon: '🌀', nama: 'Maze Neon', ket: 'labirin acak: kumpulkan koin, cari pintu keluar', ratio: '620×620', html: mazeHtml },
  { id: 'racing', cmd: 'racing', icon: '🏎️', nama: 'Neon Racer', ket: '◀▶ lajur · ▲ gas · ▼ rem · hindari mobil', ratio: '460×740', html: racerHtml },
  { id: 'tank', cmd: 'tank', icon: '🛡️', nama: 'Tank Neon', ket: 'gerak 4 arah, turret auto-bidik musuh', ratio: '740×520', html: tankHtml },
  { id: 'hunt', cmd: 'neonhunt', icon: '🎯', nama: 'Neon Hunt', ket: 'bidik 4 arah, ● tembak drone, kejar kuota', ratio: '660×500', html: huntHtml }
]

/** 5 game batch v7.3 (puzzle & papan, turn-based, D-pad) */
export const DAFTAR_ARCADE3 = [
  { id: 'blockblast', cmd: 'blockblast', icon: '🟫', nama: 'Block Blast Neon', ket: 'taruh blok 8×8, ledakkan baris penuh', ratio: '560×700', html: blockblastHtml },
  { id: 'catur', cmd: 'catur', icon: '♟️', nama: 'Catur Neon', ket: 'catur penuh vs AI minimax, jam 90 detik', ratio: '600×700', html: caturHtml },
  { id: 'minesweeper', cmd: 'minesweeper', icon: '💣', nama: 'Minesweeper Neon', ket: 'gali sel aman, benderai ranjau, 4 level', ratio: '560×620', html: minesweeperHtml },
  { id: 'fruitninja', cmd: 'fruitninja', icon: '🍉', nama: 'Fruit Ninja', ket: 'slice buah terbang \(tap; ● iris kursor\)', ratio: '640×820', html: fruitninjaHtml },
  { id: 'd2048', cmd: '2048', icon: '2️⃣', nama: '2048 (Klasik)', ket: 'geser & gabungkan tile mencari 2048', ratio: '560×780', html: dua2048Html },
  { id: 'asteroids', cmd: 'asteroids', icon: '☄️', nama: 'Asteroids Neon', ket: 'tembak batu raksasa, hindari tabrakan', ratio: '700×520', html: asteroidsHtml }
]

/** v7.8.3: 3 game rupa asli (Flappy Bird · Pac-Man · Subway Surf) */
export const DAFTAR_ARCADE5 = ARCADE_5
/** v7.9.0: 4 game rupa asli batch 2 (Candy Crush · Temple Run · Angry Birds · Super Jump) + v7.11 Neko Park */
export const DAFTAR_ARCADE6 = ARCADE_6
/** v7.12.0: 5 game sistem & UI berbeda + lock screen (Beat Drop · Menara Langit · Bubble Pop · Cacing.io · Sushi Master) */
export const DAFTAR_ARCADE7 = ARCADE_7
/** v7.13.0: 10 game multiplayer-arena (lawan = member grup) */
export const DAFTAR_ARCADE8 = ARCADE_8
/** v7.17.0: 10 game bergaya game asli (splash · cerita · menu · pengaturan · simpan) */
export const DAFTAR_ARCADE9 = ARCADE_9

/** semua game (9 klasik + 5 v7.2 + 7 v7.3 + 3 v7.8.3) — dipakai .arcadelist & test */
/** v7.37.0: game ritme — Guitar Flash (4 lajur, pilih lagu, note sesuai ketukan) */
export const DAFTAR_ARCADE10 = [
  {
    id: 'guitarflash', cmd: 'guitarflash', icon: '🎸', nama: 'Guitar Flash',
    ket: 'pilih lagu · pukul note 4 lajur sesuai ritme · combo & STAR POWER',
    ratio: '480×760', html: guitarFlashHtml
  }
]

export const DAFTAR_ARCADE_ALL = [...DAFTAR_ARCADE, ...DAFTAR_ARCADE2, ...DAFTAR_ARCADE3, ...DAFTAR_ARCADE5, ...DAFTAR_ARCADE6, ...DAFTAR_ARCADE7, ...DAFTAR_ARCADE8, ...DAFTAR_ARCADE9, ...DAFTAR_ARCADE10]

/* ---- v7.8.3: submenu 3 game rupa asli ---- */
export const arcadeMenu5 = {
  command: ['arcade5', 'arcadeasli', 'gameasli', 'rupaasli', 'arcadeoriginal'],
  category: 'Games',
  description: '✨ Submenu 7 game HTML rupa asli: Flappy Bird · Pac-Man · Subway Surf 3D · Candy Crush · Temple Run · Angry Birds · Super Jump',
  limit: 0,
  run: async m => {
    const text =
      `✨ *${brand().toUpperCase()} ARCADE — RUPA ASLI* (v7.8.3)\n\n` +
      'Tujuh game legendaris dibuat ulang semirip mungkin dengan aslinya, dan *tombol kontrolnya menyesuaikan game*:\n\n' +
      `🐦 *${P}flappybird* — Flappy Bird \`400×700\`\n   burung kuning, pipa hijau, tanah bergaris, papan medali. Tombol: *● saja* (tap juga bisa)\n\n` +
      `🟡 *${P}pacman* — Pac-Man \`560×740\`\n   labirin biru klasik 28×31, 4 hantu, power-pellet, buah bonus, READY!. Tombol: *▲▼◀▶* bulat kuning-biru\n\n` +
      `🏃 *${P}subway* — Subway Surf 3D \`480×780\`\n   kamera belakang Jake, kereta besar warna-warni, ramp ke atap, terowongan, jetpack, polisi & anjing. Tombol: *◀▶ jalur · ▲ lompat · ▼ guling · ● hoverboard*\n\n` +
      `*— Batch 2 (v7.9.0) —*\n` +
      `🍬 *${P}candycrush* — Candy Crush \`480×640\`\n   match-3 permen, permen bergaris & bom warna, target per level. Tombol: *▲▼◀▶ + ●*\n\n` +
      `🏛️ *${P}templerun* — Temple Run \`480×760\`\n   lorong kuil, tikungan, akar, api, jurang, monyet iblis. Tombol: *◀▶ belok · ▲ lompat · ▼ slide*\n\n` +
      `🐦 *${P}angrybirds* — Angry Birds \`720×440\`\n   ketapel 3 jenis burung ke babi hijau, kayu/es/batu. Tombol: *◀▶ sudut · ▲▼ tenaga · ● tembak*\n\n` +
      `🍄 *${P}superjump* — Super Jump (Mario) \`640×416\`\n   bata, kotak ?, koin, kura-kura, jamur, pipa, bendera. Tombol: *◀▶ jalan · ▲/● lompat*\n\n` +
      `🏆 Skor semua game bisa masuk papan peringkat: kirim kode dari bar 🏆 di kartu.\n` +
      `🕹️ Arcade lain: ${P}arcade · 🧩 semua game: ${P}gamerespon`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '✨ ARCADE RUPA ASLI', footer: brand(),
        buttons: [
          { text: '🐦 Flappy Bird', id: `${P}flappybird` },
          { text: '🟡 Pac-Man', id: `${P}pacman` },
          { text: '🏃 Subway Surf 3D', id: `${P}subway` },
          { text: '🍬 Candy Crush', id: `${P}candycrush` },
          { text: '🏛️ Temple Run', id: `${P}templerun` },
          { text: '🐦 Angry Birds', id: `${P}angrybirds` },
          { text: '🍄 Super Jump', id: `${P}superjump` },
          { text: '🏆 Papan peringkat', id: `${P}lbgame` },
          { text: '🕹️ Semua arcade', id: `${P}arcade` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const arcadeMenu = {
  command: ['arcade', 'htmlgame', 'htmlgames', 'webgame', 'arcadehub'],
  category: 'Games',
  description: 'Menu game HTML interaktif (jalan di dalam chat)',
  limit: 0,
  run: async m => {
    const baris = g => `• ${P}${g.cmd} — ${g.icon} ${g.nama}`
    const text =
      `🕹️ *${brand().toUpperCase()} ARCADE — ${DAFTAR_ARCADE_ALL.length + ARCADE_4.length} HTML GAMES*\n\n` +
      'Game di bawah ini bukan video/gambar: seluruh aplikasi HTML-nya dikirim ' +
      'lewat *AI Rich message* dan berjalan langsung di dalam chat.\n' +
      `🧸 Pastel (10) · 🎰 Casino chip (4) · 💵 Kasino RPG (5) · 📱 Jadul (3): ${P}pastel · ${P}casino · ${P}kasinorpg · ${P}jadul\n\n` +
      `*— ✨ RUPA ASLI (D-pad menyesuaikan game) — ${P}arcade5 —*\n` +
      [...DAFTAR_ARCADE5, ...DAFTAR_ARCADE6, ...DAFTAR_ARCADE7, ...DAFTAR_ARCADE8].map(g => `${baris(g)} (${g.ket})`).join('\n') +
      '\n\n*— Batch klasik (9 game) —*\n' +
      DAFTAR_ARCADE.map(baris).join('\n') +
      `\n\n*— Batch v7.2 · D-pad 4 arah (5 game) — ${P}arcade2 —*\n` +
      DAFTAR_ARCADE2.map(baris).join('\n') +
      `\n\n*— Batch v7.3 · puzzle & papan (7 game) — ${P}arcade3 —*\n` +
      DAFTAR_ARCADE3.map(baris).join('\n') +
      `\n\n*— Batch v7.6 · aksi & fisika (5 game) — ${P}arcade4 —*\n` +
      ARCADE_4.map(baris).join('\n') +
      `\n\n🧩 Semua kategori game: ${P}gamerespon · 📜 versi list 1-klik: ${P}arcadelist4\n\n` +
      NOTE
    try {
      await sendButtons(m.sock, m.jid, {
        text,
        title: `🕹️ ARCADE · ${DAFTAR_ARCADE_ALL.length + ARCADE_4.length} GAME`,
        footer: brand(),
        buttons: [
          { text: `✨ Rupa asli (${DAFTAR_ARCADE5.length + DAFTAR_ARCADE6.length + DAFTAR_ARCADE7.length + DAFTAR_ARCADE8.length})`, id: `${P}arcade5` },
          { text: `🚀 Aksi & fisika (${ARCADE_4.length})`, id: `${P}arcade4` },
          { text: `🧩 Puzzle (${DAFTAR_ARCADE3.length})`, id: `${P}arcade3` },
          { text: `🎮 D-pad (${DAFTAR_ARCADE2.length})`, id: `${P}arcade2` },
          { text: `🕹️ Klasik (${DAFTAR_ARCADE.length})`, id: `${P}arcadelist` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch {
      await m.reply(text)
    }
    return { handled: true }
  }
}

export const arcadeList = {
  command: ['arcadelist', 'daftararcade', 'listarcade', 'arcademenu'],
  category: 'Games',
  description: 'Daftar game arcade HTML dalam bentuk list (klik langsung main)',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: `🕹️ ARCADE ${brand().toUpperCase()}`,
        text: `${DAFTAR_ARCADE_ALL.length + ARCADE_4.length} game HTML yang jalan langsung di dalam chat.\n\nPilih game untuk mulai main — semua game punya D-pad (▲▼◀▶ + ●) dan skor terbaik tersimpan di perangkatmu.`,
        footer: brand(),
        buttonText: '🕹️ Pilih Game',
        sections: [
          {
            title: '✨ Rupa asli v7.8.3',
            rows: [...DAFTAR_ARCADE5, ...DAFTAR_ARCADE6, ...DAFTAR_ARCADE7, ...DAFTAR_ARCADE8].map(g => ({
              title: `${g.icon} ${g.nama}`,
              description: `${g.ket} · ${g.ratio}`,
              id: `${P}${g.cmd}`
            }))
          },
          {
            title: 'Batch v7.6 — aksi & fisika',
            rows: ARCADE_4.map(g => ({
              title: `${g.icon} ${g.nama}`,
              description: `${g.ket} · ${g.ratio}`,
              id: `${P}${g.cmd}`
            }))
          },
          {
            title: 'Batch v7.3 — puzzle & papan',
            rows: DAFTAR_ARCADE3.map(g => ({
              title: `${g.icon} ${g.nama}`,
              description: `${g.ket} · ${g.ratio}`,
              id: `${P}${g.cmd}`
            }))
          },
          {
            title: 'Batch v7.2 — D-pad 4 arah',
            rows: DAFTAR_ARCADE2.map(g => ({
              title: `${g.icon} ${g.nama}`,
              description: `${g.ket} · ${g.ratio}`,
              id: `${P}${g.cmd}`
            }))
          },
          {
            title: 'Batch klasik (v5–v7.1)',
            rows: DAFTAR_ARCADE.map(g => ({
              title: `${g.icon} ${g.nama}`,
              description: g.ket,
              id: `${P}${g.cmd}`
            }))
          }
        ]
      })
    } catch (e) {
      await m.reply(
        `🕹️ *ARCADE — ${DAFTAR_ARCADE_ALL.length + ARCADE_4.length} GAME HTML*\n\n` +
        [...ARCADE_4, ...DAFTAR_ARCADE_ALL].map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

/** submenu khusus 5 game baru (D-pad 4 arah) */
export const arcadeMenu2 = {
  command: ['arcade2', 'arcadeneon2', 'arcadedpad', 'dpadgame', 'dpadgames', 'arcadebaru', 'arcadev2', 'gamedpad'],
  category: 'Games',
  description: 'Submenu 5 game HTML baru (v7.2) — kontrol D-pad ▲▼◀▶ + ●, ratio canvas tiap game beda',
  limit: 0,
  run: async m => {
    const text =
      `🎮 *${brand().toUpperCase()} ARCADE 2 — 5 GAME D-PAD*\n\n` +
      'Batch baru ini dibuat khusus untuk *D-pad on-screen*: setiap kartu game punya tombol ' +
      '▲ ▼ ◀ ▶ dan ● di bawah canvas, plus *ratio canvas sendiri-sendiri* ' +
      '(portrait, square, landscape) supaya lapangan mainnya pas.\n\n' +
      DAFTAR_ARCADE2.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n${NOTE}\n\nSemua ${DAFTAR_ARCADE_ALL.length} game: ${P}arcadelist  ·  Batch puzzle v7.3: ${P}arcade3  ·  Batch klasik: ${P}arcade`
    try {
      await sendButtons(m.sock, m.jid, {
        text,
        title: '🎮 ARCADE 2 · D-PAD',
        footer: brand(),
        buttons: [
          { text: '🐸 Frogger', id: `${P}frogger` },
          { text: '🌀 Maze', id: `${P}maze` },
          { text: '🏎️ Racer', id: `${P}racing` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch {
      await m.reply(text)
    }
    return { handled: true }
  }
}

/** versi list dari submenu arcade2 (1x klik langsung main) */
export const arcadeList2 = {
  command: ['arcadelist2', 'daftararcade2', 'listarcade2', 'arcadedpadlist'],
  category: 'Games',
  description: 'Daftar 5 game arcade baru (v7.2) dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: `🎮 ARCADE 2 ${brand().toUpperCase()}`,
        text: '5 game HTML baru dengan D-pad ▲▼◀▶ + ●.\nPilih satu untuk langsung main.',
        footer: brand(),
        buttonText: '🎮 Pilih Game',
        sections: [{
          title: 'Game D-pad (v7.2)',
          rows: DAFTAR_ARCADE2.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }]
      })
    } catch (e) {
      await m.reply(
        `🎮 *ARCADE 2 — 5 GAME D-PAD*\n\n` +
        DAFTAR_ARCADE2.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

/** submenu khusus 5 game v7.3 (puzzle & papan) */
export const arcadeMenu3 = {
  command: ['arcade3', 'arcadepuzzle', 'arcadepapan', 'puzzlegame', 'puzzlegames', 'arcadeneon3', 'arcadev3', 'gamepuzzle', 'boardgame'],
  category: 'Games',
  description: 'Submenu 4 game HTML (v7.3) — puzzle & papan: block blast, catur, minesweeper, asteroids',
  limit: 0,
  run: async m => {
    const text =
      `🧩 *${brand().toUpperCase()} ARCADE 3 — 4 GAME PUZZLE & PAPAN*\n\n` +
      'Batch v7.3 berisi game *berbasis giliran/puzzle* yang tetap memakai sistem sama: ' +
      'kartu HTML di dalam chat, D-pad ▲ ▼ ◀ ▶ + ●, skor terbaik tersimpan, dan ' +
      '*ratio canvas sendiri* untuk tiap game.\n\n' +
      'Karena game puzzle tidak punya "mati alami", tiap game punya batas waktu supaya ' +
      'tetap bisa tamat: block blast 15 detik/blok, ' +
      'catur jam 90 detik, minesweeper 75 detik.\n\n' +
      DAFTAR_ARCADE3.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n${NOTE}\n\nSemua ${DAFTAR_ARCADE_ALL.length} game: ${P}arcadelist  ·  Batch D-pad v7.2: ${P}arcade2  ·  Batch klasik: ${P}arcade`
    try {
      await sendButtons(m.sock, m.jid, {
        text,
        title: '🧩 ARCADE 3 · PUZZLE & PAPAN',
        footer: brand(),
        buttons: [
          { text: '♟️ Catur Neon', id: `${P}catur` },
          { text: '🧞 Akinator (chat)', id: `${P}akinator` },
          { text: '💣 Minesweeper', id: `${P}minesweeper` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch {
      await m.reply(text)
    }
    return { handled: true }
  }
}

/** versi list dari submenu arcade3 (1x klik langsung main) */
export const arcadeList3 = {
  command: ['arcadelist3', 'daftararcade3', 'listarcade3', 'arcadepuzzlelist', 'listpuzzle'],
  category: 'Games',
  description: 'Daftar 5 game arcade puzzle (v7.3) dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    try {
      await sendList(m.sock, m.jid, {
        title: `🧩 ARCADE 3 ${brand().toUpperCase()}`,
        text: '5 game puzzle & papan (v7.3) dengan D-pad ▲▼◀▶ + ●.\nPilih satu untuk langsung main.',
        footer: brand(),
        buttonText: '🧩 Pilih Game',
        sections: [{
          title: 'Game puzzle & papan (v7.3)',
          rows: DAFTAR_ARCADE3.map(g => ({
            title: `${g.icon} ${g.nama}`,
            description: `${g.ket} · ${g.ratio}`,
            id: `${P}${g.cmd}`
          }))
        }]
      })
    } catch (e) {
      await m.reply(
        `🧩 *ARCADE 3 — 5 GAME PUZZLE & PAPAN*\n\n` +
        DAFTAR_ARCADE3.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default {
  gdMini, snakeNeon, flappyNeon,
  breakoutNeon, spaceShooter, dinoRun, tetrisNeon, pongNeon, neonJump,
  froggerNeon, mazeNeon, neonRacer, tankNeon, neonHunt,
  blockBlastNeon, caturNeon, minesweeperNeon, asteroidsNeon,
  guitarFlash, DAFTAR_ARCADE10,
  arcadeMenu, arcadeList, arcadeMenu2, arcadeList2, arcadeMenu3, arcadeList3
}
