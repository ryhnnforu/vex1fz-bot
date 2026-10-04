/**
 * 🧩 GAME RESPON (v7.4) — hub semua game di dalam chat
 * ----------------------------------------------------
 *  Mengumpulkan 5 kategori game dalam satu submenu rapi:
 *    🕹️ ARCADE HTML  — 19 game (aplikasi HTML penuh di dalam chat)   → .arcade
 *    🧸 PASTEL       — 5 game HTML app kulit pastel (v7.5)           → .pastel
 *    🎰 CASINO       — 4 game HTML app (slot, poker, crash, baccarat) → .casino
 *    📱 JADUL/RETRO  — 3 game HTML app (pou, snake nokia, invader)   → .jadul
 *    🧠 LAB AI RICH  — game papan/tebak-tebakan engine airichgame    → .airichgamelab
 *
 *  Pastel, Casino & Jadul memakai SISTEM YANG SAMA dengan arcade (kartu
 *  HTML + canvas + D-pad + WebAudio + rekor di localStorage), jadi
 *  totalnya 30 game HTML app + game lab berbasis pill AIRich.
 *
 *  Daftar lab dibaca langsung dari registry engine (GAMES) supaya
 *  otomatis ikut bertambah kalau ada game baru yang didaftarkan.
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { GAMES } from '../lib/airichgame.js'
import { DAFTAR_ARCADE, DAFTAR_ARCADE2, DAFTAR_ARCADE3, DAFTAR_ARCADE5, DAFTAR_ARCADE6, DAFTAR_ARCADE7, DAFTAR_ARCADE8, DAFTAR_ARCADE9, DAFTAR_ARCADE10, DAFTAR_ARCADE_ALL } from './arcade.js'
import { DAFTAR_ARCADE_4, DAFTAR_ARCADE_ALL2 } from './arcadebaru.js'
import { DAFTAR_CASINO } from './casinolab.js'
import { DAFTAR_CASINO_RPG } from './casinorpg.js'
import { DAFTAR_JADUL } from './jadullab.js'
import { DAFTAR_PASTEL } from './pastellab.js'
import { DAFTAR_PASTEL_2 } from './pastelbaru.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kind milik casino & jadul (sudah punya submenu sendiri) */
const KIND_SUBMENU = new Set([
  ...DAFTAR_CASINO.map(g => g.kind),
  ...DAFTAR_JADUL.map(g => g.kind)
])

/** game AIRich "lab" = semua kind terdaftar selain yang punya submenu sendiri */
export function daftarLab () {
  return [...GAMES.values()]
    .filter(g => g && g.cmd && !KIND_SUBMENU.has(g.kind))
    .map(g => ({
      id: g.kind,
      cmd: g.cmd,
      icon: String(g.nama || '🎮').split(' ')[0] || '🎮',
      nama: String(g.nama || g.kind).replace(/^[^\w]+/, '').trim() || g.kind,
      ket: typeof g.tip === 'string' ? g.tip.split('.')[0].slice(0, 60) : ''
    }))
}

export const jumlahGame = () => ({
  arcade: DAFTAR_ARCADE_ALL2.length,
  pastel: DAFTAR_PASTEL.length + DAFTAR_PASTEL_2.length,
  casino: DAFTAR_CASINO.length + DAFTAR_CASINO_RPG.length,
  kasinoRpg: DAFTAR_CASINO_RPG.length,
  jadul: DAFTAR_JADUL.length,
  lab: daftarLab().length
})

function ringkasan () {
  const n = jumlahGame()
  const total = n.arcade + n.pastel + n.casino + n.jadul + n.lab
  const html = n.arcade + n.pastel + n.casino + n.jadul
  return { ...n, total, html }
}

/* ================================================================== */
/*  .gamerespon — submenu tombol                                        */
/* ================================================================== */
export const gameRespon = {
  command: ['gamerespon', 'gameresponmenu', 'respongame', 'gamehub', 'pusatgame', 'gameairichsemua'],
  category: 'Games',
  description: '🧩 Hub semua game: Arcade HTML, Pastel HTML, Casino HTML (+ .slot uang RPG), Jadul HTML, dan Lab AI Rich',
  limit: 0,
  run: async m => {
    const n = ringkasan()
    const lab = daftarLab()
    const text =
      `🧩 *${brand().toUpperCase()} GAME RESPON* — ${n.total} game\n\n` +
      `Semua game di bawah dikirim sebagai **AIRichResponseMessage**. ${n.html} game berupa ` +
      '*HTML app* (canvas + D-pad ▲▼◀▶ + ●, efek suara, rekor tersimpan di perangkat), sisanya ' +
      'game lab berbasis papan pill yang di-live-edit. Skor semua HTML app bisa disetor ke ' +
      `papan peringkat \`${P}lbgame\`.\n\n` +
      `🕹️ *ARCADE HTML — ${n.arcade} game*  ·  ${P}arcade\n` +
      '   Aplikasi HTML penuh (canvas + skor + D-pad) di dalam chat.\n' +
      `   ${DAFTAR_ARCADE.map(g => g.icon).join('')} klasik ${DAFTAR_ARCADE.length} · ${P}arcade2\n` +
      `   ${DAFTAR_ARCADE2.map(g => g.icon).join('')} D-pad ${DAFTAR_ARCADE2.length} · ${P}arcade2\n` +
      `   ${DAFTAR_ARCADE3.map(g => g.icon).join('')} puzzle ${DAFTAR_ARCADE3.length} · ${P}arcade3\n` +
      `   ${DAFTAR_ARCADE_4.map(g => g.icon).join('')} aksi & fisika ${DAFTAR_ARCADE_4.length} (v7.6) · ${P}arcade4\n` +
      `   ✨ *RUPA ASLI:* ${DAFTAR_ARCADE5.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')} · ${P}arcade5\n` +
      `   ✨ *RUPA ASLI batch 2 (v7.9.0):* ${DAFTAR_ARCADE6.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')}\n` +
      `   🆕 *BARU v7.12.0 (lock screen):* ${DAFTAR_ARCADE7.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')}\n` +
      `   📖 *GAME CERITA v7.17.0 (menu · pengaturan · simpan):* ${DAFTAR_ARCADE9.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')} · ${P}arcadecerita\n` +
      `   🎮 *MULTIPLAYER-ARENA v7.13.0 (lawan = member grup):* ${DAFTAR_ARCADE8.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')}\n` +
      `   🎸 *RITME v7.37.0 (pilih lagu · note sesuai ketukan):* ${DAFTAR_ARCADE10.map(g => `${g.icon} ${P}${g.cmd}`).join(' · ')}\n` +
      `   🃏 *KARTU MULTIPLAYER v7.37.0 (2-8 member, giliran di chat):* ${P}uno → ${P}unoikut → ${P}unomulai → ${P}unomain <n> [warna]\n` +
      `   🎴 *UNO HTML (1 pemain vs 3 AI, kartu interaktif):* ${P}unohtml\n\n` +
      `🧸 *PASTEL — ${n.pastel} game HTML app (kulit pastel)*  ·  ${P}pastel\n` +
      [...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2].map(g => `   ${g.icon} ${P}${g.cmd} — ${g.nama}  \`${g.ratio}\``).join('\n') + '\n\n' +
      `🎰 *CASINO — ${n.casino} game HTML app*  ·  ${P}casino\n` +
      DAFTAR_CASINO.map(g => `   ${g.icon} ${P}${g.cmd} — ${g.nama}  \`${g.ratio}\``).join('\n') + '\n' +
      `   💵 *Uang RPG asli (v7.6, menu: ${P}kasinorpg):*\n` +
      DAFTAR_CASINO_RPG.map(g => `   ${g.icon} ${P}${g.cmd} — ${g.nama}`).join('\n') + '\n' +
      `      ${P}slot 500 — Slot Mesin RPG · ${P}slot all · ${P}slotbet 1000 · ${P}slotinfo · ${P}slotriwayat\n` +
      `      ${P}kasinoinfo — statistik & RTP pribadi semua meja kasino RPG\n` +
      `      hasil diacak server, koin sungguhan, bayar otomatis masuk ${P}lbgame\n\n` +
      `📱 *JADUL / RETRO — ${n.jadul} game HTML app*  ·  ${P}jadul\n` +
      DAFTAR_JADUL.map(g => `   ${g.icon} ${P}${g.cmd} — ${g.nama}  \`${g.ratio}\``).join('\n') + '\n\n' +
      `🧠 *LAB AI RICH — ${n.lab} game*  ·  ${P}airichgamelab\n` +
      `   ${lab.slice(0, 24).map(g => `${g.icon} ${P}${g.cmd}`).join('  ·  ')}\n\n` +
      `📜 Daftar lengkap (sekali klik langsung main): ${P}gameresponlist\n` +
      `🧩 Fitur HTML lain: ${P}interaktifmenu · 🎧 musik ${P}play3 <judul> · 🎬 ${P}playvid`

    try {
      await sendButtons(m.sock, m.jid, {
        text,
        title: `🧩 GAME · ${n.total}`,
        footer: brand(),
        buttons: [
          { text: `🕹️ Arcade (${n.arcade})`, id: `${P}arcade` },
          { text: `✨ Rupa asli (${DAFTAR_ARCADE5.length + DAFTAR_ARCADE6.length + DAFTAR_ARCADE7.length + DAFTAR_ARCADE8.length})`, id: `${P}arcade5` },
          { text: `🧸 Pastel (${n.pastel})`, id: `${P}pastel` },
          { text: `🎰 Casino chip (${n.casino - n.kasinoRpg})`, id: `${P}casino` },
          { text: `💵 Kasino RPG (${n.kasinoRpg})`, id: `${P}kasinorpg` },
          { text: `📜 Semua + Jadul & Lab (${n.total})`, id: `${P}gameresponlist` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

/* ================================================================== */
/*  .gameresponlist — versi list (1× klik langsung main)                */
/* ================================================================== */
export const gameResponList = {
  command: ['gameresponlist', 'listgamerespon', 'daftargamerespon', 'listsemuagameairich', 'gameresponsemua'],
  category: 'Games',
  description: 'Daftar lengkap semua game dalam list interaktif (Arcade + Casino + Jadul + Lab)',
  limit: 0,
  run: async m => {
    const n = ringkasan()
    const row = g => ({ title: `${g.icon} ${g.nama}`, description: g.ket || '', id: `${P}${g.cmd}` })
    try {
      await sendList(m.sock, m.jid, {
        title: `🧩 ${n.total} GAME`,
        text: 'Pilih game untuk langsung main. Arcade/Pastel/Casino/Jadul = HTML app (canvas + D-pad), Lab = papan pill live-edit. Skor bisa disetor ke papan peringkat (.setorskore <kode>).',
        footer: brand(),
        buttonText: '🎮 Pilih Game',
        sections: [
          { title: `🎮 Multiplayer-arena v7.13.0 (${DAFTAR_ARCADE8.length})`, rows: DAFTAR_ARCADE8.map(row) },
          { title: `📖 Game cerita v7.17.0 (${DAFTAR_ARCADE9.length})`, rows: DAFTAR_ARCADE9.map(row) },
          { title: `🆕 Baru v7.12.0 — lock screen (${DAFTAR_ARCADE7.length})`, rows: DAFTAR_ARCADE7.map(row) },
          { title: `✨ Rupa asli batch 2 — v7.9.0 (${DAFTAR_ARCADE6.length})`, rows: DAFTAR_ARCADE6.map(row) },
          { title: `✨ Rupa asli v7.8.3 (${DAFTAR_ARCADE5.length})`, rows: DAFTAR_ARCADE5.map(row) },
          { title: `💵 Kasino RPG — uang asli (${n.kasinoRpg})`, rows: DAFTAR_CASINO_RPG.map(row) },
          { title: `🧸 Pastel baru v7.6 (${DAFTAR_PASTEL_2.length})`, rows: DAFTAR_PASTEL_2.map(row) },
          { title: `🕹️ Arcade baru v7.6 (${DAFTAR_ARCADE_4.length})`, rows: DAFTAR_ARCADE_4.map(row) },
          { title: `🧸 Pastel HTML (${DAFTAR_PASTEL.length})`, rows: DAFTAR_PASTEL.map(row) },
          { title: `🎰 Casino HTML — chip lokal (${DAFTAR_CASINO.length})`, rows: DAFTAR_CASINO.map(row) },
          { title: `📱 Jadul / Retro HTML (${n.jadul})`, rows: DAFTAR_JADUL.map(row) },
          { title: `🕹️ Arcade HTML v7.3 (${DAFTAR_ARCADE3.length})`, rows: DAFTAR_ARCADE3.map(row) },
          { title: `🕹️ Arcade D-pad v7.2 (${DAFTAR_ARCADE2.length})`, rows: DAFTAR_ARCADE2.map(row) },
          { title: `🕹️ Arcade Klasik (${DAFTAR_ARCADE.length})`, rows: DAFTAR_ARCADE.map(row) },
          { title: `🧠 Lab AI Rich (${n.lab})`, rows: daftarLab().map(row) }
        ]
      })
    } catch {
      const teks =
        `🧩 *SEMUA GAME (${n.total})*\n\n` +
        `💵 KASINO RPG (uang asli)\n${DAFTAR_CASINO_RPG.map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}\n\n` +
        `🧸 PASTEL\n${[...DAFTAR_PASTEL, ...DAFTAR_PASTEL_2].map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}\n\n` +
        `🎰 CASINO CHIP\n${DAFTAR_CASINO.map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}\n\n` +
        `📱 JADUL\n${DAFTAR_JADUL.map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}\n\n` +
        `🕹️ ARCADE HTML\n${DAFTAR_ARCADE_ALL2.map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}\n\n` +
        `🧠 LAB AI RICH\n${daftarLab().map(g => `▸ ${g.icon} ${g.nama} — ${P}${g.cmd}`).join('\n')}`
      await m.reply(teks)
    }
    return { handled: true }
  }
}

/* ================================================================== */
/*  .gameresponbaru — game baru v7.4 (casino + jadul) & v7.5 (pastel)    */
/* ================================================================== */
/** satu baris ringkas per game (hemat karakter: body interaktif dipotong di 3000) */
const baris = g => `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\``

export const gameResponBaru = {
  command: ['gameresponbaru', 'gamev74', 'gamebaru74', 'gamenew', 'gamev75', 'gamev76', 'gamebaru76'],
  category: 'Games',
  description: '27 game HTML app baru: 4 casino + 3 jadul (v7.4), 5 pastel (v7.5), 5 pastel + 5 arcade + 5 kasino RPG uang asli (v7.6)',
  limit: 0,
  run: async m => {
    const text =
      /* WhatsApp memotong body interaktif di 3000 karakter → daftar ringkas satu baris
       *  per game; penjelasan lengkap & cara main ada di submenu tiap kategori */
      `✨ *GAME BARU v7.4 – v7.6* — ${DAFTAR_CASINO.length + DAFTAR_JADUL.length + DAFTAR_PASTEL.length + DAFTAR_PASTEL_2.length + DAFTAR_ARCADE_4.length + DAFTAR_CASINO_RPG.length} game HTML app (sistem .arcade)\n` +
      `🏆 Skor bisa masuk papan peringkat: setor kode dari kartu → ${P}setorskore <kode>, ranking → ${P}lbgame\n` +
      `ℹ️ Cara main & kontrol tiap game: buka submenu kategorinya\n\n` +
      `💵 *KASINO RPG v7.6* → ${P}kasinorpg (uang RPG asli, hasil diacak server)\n` +
      DAFTAR_CASINO_RPG.map(baris).join('\n') +
      `\n\n🕹️ *ARCADE BARU v7.6* → ${P}arcade4\n` +
      DAFTAR_ARCADE_4.map(baris).join('\n') +
      `\n\n🧸 *PASTEL BARU v7.6* → ${P}pastel2\n` +
      DAFTAR_PASTEL_2.map(baris).join('\n') +
      `\n\n🧸 *PASTEL v7.5* → ${P}pastel (kulit krem/pink/mint)\n` +
      DAFTAR_PASTEL.map(baris).join('\n') +
      `\n\n🎰 *CASINO v7.4* → ${P}casino (chip lokal, bukan uang asli)\n` +
      DAFTAR_CASINO.map(baris).join('\n') +
      `\n\n📱 *JADUL v7.4* → ${P}jadul\n` +
      DAFTAR_JADUL.map(baris).join('\n') +
      `\n\n🎧 Musik: ${P}play3 <judul> (Spotify + lirik) · ${P}play · 🎬 ${P}playvid\n` +
      `🧩 Semua game (${ringkasan().total}): ${P}gamerespon`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '✨ GAME v7.4 – v7.6', footer: brand(),
        buttons: [
          { text: '💵 Kasino RPG (uang asli)', id: `${P}kasinorpg` },
          { text: '🕹️ Arcade baru v7.6', id: `${P}arcade4` },
          { text: '🧸 Pastel baru v7.6', id: `${P}pastel2` },
          { text: '🏆 Papan peringkat', id: `${P}lbgame` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export default { gameRespon, gameResponList, gameResponBaru, daftarLab, jumlahGame }
