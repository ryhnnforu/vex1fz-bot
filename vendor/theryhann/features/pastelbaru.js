/**
 * 🧸 PASTEL v7.6 — 5 game HTML app baru (kulit pastel, mesin arcade)
 * -----------------------------------------------------------------------
 *  Sistemnya SAMA PERSIS dengan .arcade / .pastel / .casino: satu kartu
 *  **HTML app** di dalam chat berisi canvas + D-pad (▲ ▼ ◀ ▶ + ●) +
 *  WebAudio + rekor di localStorage. Skor bisa disetor ke papan peringkat
 *  lewat `.setorskore <kode>` (kode tampil di kartu saat game over).
 *
 *  Game baru (v7.6):
 *    • .pancing     🎣 Pancing Ikan — perahu bergerak, kail turun/naik, ikan & ubur-ubur
 *    • .ritme       🎵 Irama Pastel — rhythm 4 lajur, penilaian Perfect/Good/Miss
 *    • .kartumemori 🧠 Kartu Memori — 8 pasang kartu, batas waktu + bonus cepat
 *    • .donat       🍩 Donat Susun  — stack tower, ayunan donat, potong presisi
 *    • .susunhuruf  🔤 Susun Kata   — keping huruf acak, susun jadi kata Indonesia
 *
 *  Isi game ada di lib/pastel6..10.js, daftar gabungan di lib/htmlgames8.js.
 *  Menu: .pastel (semua 10) · .pastel2 (batch v7.6) · .pastellist2
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { kirimGameHtml } from '../lib/lbgame.js'
import { PASTEL_ALL, PASTEL_HTML, PASTEL_HTML2 } from '../lib/htmlgames8.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** kirim satu html-app pastel (skor disetor lewat kode di kartu) */
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
  '💡 *Cara main:* pakai *D-pad* di bawah kartu game (▲ ▼ ◀ ▶ + ●), atau ketuk langsung ' +
  'di dalam kartu, atau tombol panah & spasi di WA Web. Rekor terbaik tersimpan otomatis ' +
  'di perangkatmu.\n' +
  `🏆 *Papan peringkat:* saat game over kartu menampilkan **kode setor** — kirim ` +
  `\`${P}setorskore <kode>\` untuk mencatat skormu, lalu lihat peringkat di \`${P}lbgame\`.`

/** deskripsi singkat tiap game baru (untuk menu, daftar & test) */
const KET = {
  pancing: 'pancing dari perahu: ◀▶ geser, ● turunkan/tarik kail, ▲▼ atur kedalaman · 🐟 +10 · ⭐ emas +50 · 🪼 ubur-ubur -1 nyawa · 3 nyawa, tempo naik',
  ritme: 'rhythm 4 lajur: ◀ ▼ ▲ ▶ pukul not tepat di garis penilaian · Perfect/Good/Miss, kombo mengalikan poin · 60 detik, lagu makin rapat',
  kartumemori: 'cari 8 pasang kartu: ▲▼◀▶ pindah kursor, ● buka · salah pasang = kartu tertutup lagi · bonus poin makin cepat selesai',
  donat: 'tumpuk donat selaras: ● jatuhkan saat ayunan tepat · kelebihan dipotong · seimbang ±6px = SEMPURNA (donat melebar lagi) · ▲▼ atur kecepatan, ◀▶ balik arah',
  susunhuruf: 'susun kata Indonesia dari keping huruf acak: ◀▶ pilih keping, ● ambil, ▲ hapus, ▼ lewati (-1 nyawa) · 3 nyawa, kata makin panjang'
}

const ALIAS = {
  pancing: ['pancingikan', 'mancingpastel', 'fishpastel', 'kailikan', 'pancingpastel'],
  ritme: ['irama', 'ritmepastel', 'rhythmgame', 'pukulnot', 'musikkotak'],
  kartumemori: ['kartupasang', 'memorygame', 'pasangkartu', 'memoripastel', 'kartuingat'],
  donat: ['donatsusun', 'susundonat', 'stackdonat', 'donatpastel', 'tumpukdonat'],
  susunhuruf: ['tebakhuruf', 'katakeping', 'acakhuruf', 'susunhurufpastel', 'kepinghuruf']
}

/** daftar 5 game pastel v7.5 (hanya untuk ditampilkan di menu v7.6, tanpa ket panjang) */
export const DAFTAR_PASTEL_1 = PASTEL_HTML.map(g => ({
  id: g.id, cmd: g.cmd || g.id, icon: g.icon, nama: g.nama, ratio: g.ratio
}))

/** daftar 5 game pastel v7.6 (dipakai menu, .gamerespon & test) */
export const DAFTAR_PASTEL_2 = PASTEL_HTML2.map(g => ({
  id: g.id, cmd: g.cmd || g.id, icon: g.icon, nama: g.nama, title: g.title || g.nama,
  ket: KET[g.id] || 'game pastel HTML app', ratio: g.ratio, w: g.w, h: g.h,
  kind: g.id, html: g.html
}))

/** plugin game (didaftarkan otomatis oleh loader) */
export const PLUGIN_PASTEL_2 = DAFTAR_PASTEL_2.map(g => ({
  command: [g.cmd, ...(ALIAS[g.id] || [])],
  category: 'Games',
  description: `${g.icon} ${g.nama} — game pastel HTML app: ${g.ket}`,
  limit: 0,
  cooldown: 2,
  run: m => play(m, g.title, g.html, g.cmd)
}))

/* ---- submenu batch v7.6 ---- */
export const pastelMenu2 = {
  command: ['pastel2', 'pastelbaru', 'pastelmenu2', 'gamepastel2', 'pastelv2'],
  category: 'Games',
  description: 'Submenu 5 game pastel HTML app baru v7.6 (Pancing, Irama, Kartu Memori, Donat Susun, Susun Kata)',
  limit: 0,
  run: async m => {
    const text =
      `🧸 *${brand().toUpperCase()} PASTEL — 5 GAME BARU* (v7.6)\n\n` +
      'Mesin sama dengan *.arcade*: kartu **HTML app** berisi canvas, *D-pad* ▲ ▼ ◀ ▶ + ●, ' +
      'efek suara, dan rekor tersimpan di perangkat. Kulitnya pastel krem/pink/mint.\n\n' +
      DAFTAR_PASTEL_2.map(g =>
        `• ${P}${g.cmd} — ${g.icon} *${g.nama}*  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
      `\n\n🧸 *Batch v7.5:* ${DAFTAR_PASTEL_1.map(g => `${g.icon} ${P}${g.cmd}`).join('  ')}\n\n` +
      `${NOTE}\n\nSemua kategori game: ${P}gamerespon  ·  Versi list: ${P}pastellist2  ·  Semua pastel: ${P}pastel`
    try {
      await sendButtons(m.sock, m.jid, {
        text, title: '🧸 PASTEL BARU', footer: brand(),
        buttons: [
          { text: '🎣 Pancing Ikan', id: `${P}pancing` },
          { text: '🎵 Irama Pastel', id: `${P}ritme` },
          { text: '🧠 Kartu Memori', id: `${P}kartumemori` },
          { text: '🍩 Donat Susun', id: `${P}donat` },
          { text: '🔤 Susun Kata', id: `${P}susunhuruf` },
          { text: '🧸 Semua 10 pastel', id: `${P}pastel` }
        ]
      })
    } catch { await m.reply(text) }
    return { handled: true }
  }
}

export const pastelList2 = {
  command: ['pastellist2', 'daftarpastel2', 'listpastel2', 'pastelbaru2'],
  category: 'Games',
  description: 'Daftar 10 game pastel HTML app (v7.5 + v7.6) dalam bentuk list interaktif',
  limit: 0,
  run: async m => {
    const row = g => ({ title: `${g.icon} ${g.nama}`, description: `${g.ket} · ${g.ratio}`, id: `${P}${g.cmd}` })
    try {
      await sendList(m.sock, m.jid, {
        title: '🧸 PASTEL',
        text: `${PASTEL_ALL.length} game HTML app berkulit pastel (canvas + D-pad). Pilih satu untuk langsung main.`,
        footer: brand(),
        buttonText: '🧸 Pilih Game',
        sections: [
          { title: 'Pastel baru (v7.6)', rows: DAFTAR_PASTEL_2.map(row) },
          { title: 'Pastel (v7.5)', rows: DAFTAR_PASTEL_1.map(g => ({ title: `${g.icon} ${g.nama}`, description: g.ratio, id: `${P}${g.cmd}` })) },
          {
            title: 'Kategori lain',
            rows: [
              { title: '🕹️ Arcade neon', description: 'Canvas + D-pad, tema neon gelap', id: `${P}arcade` },
              { title: '🎰 Kasino RPG (uang asli)', description: 'Rolet, dadu, aviator, keno, blackjack', id: `${P}kasinorpg` },
              { title: '🎰 Casino chip', description: 'Slot, poker, crash, baccarat — chip lokal', id: `${P}casino` },
              { title: '📱 Jadul', description: 'Pou Jump, Snake Nokia, Space Invader', id: `${P}jadul` },
              { title: '🏆 Papan peringkat game', description: 'Ranking skor semua game', id: `${P}lbgame` },
              { title: '🧩 Semua game', description: 'Semua kategori HTML + lab AIRich', id: `${P}gamerespon` }
            ]
          }
        ]
      })
    } catch {
      await m.reply(
        `🧸 *PASTEL — ${PASTEL_ALL.length} game HTML app*\n\n` +
        `*Baru (v7.6)*\n` + DAFTAR_PASTEL_2.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\`\n   ${g.ket}`).join('\n') +
        `\n\n*v7.5*\n` + DAFTAR_PASTEL_1.map(g => `▸ ${g.icon} *${g.nama}* — ${P}${g.cmd}  \`${g.ratio}\``).join('\n') +
        `\n\n${NOTE}`
      )
    }
    return { handled: true }
  }
}

export default {
  PLUGIN_PASTEL_2, pastelMenu2, pastelList2, DAFTAR_PASTEL_1, DAFTAR_PASTEL_2
}
