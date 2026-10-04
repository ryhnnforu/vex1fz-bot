/**
 * 🎧 PLAYER LAB — ".play2" pemutar musik (v7.4 AIRich → v7.5 HTML app)
 * -------------------------------------------------------------------------
 *  v7.5: `.play2` sekarang berupa **kartu HTML app** seperti game .arcade /
 *  .casino / .pastel — canvas + D-pad ▲▼◀▶ + ● + WebAudio. Kartu memutar
 *  sendiri preview 30 detik (Deezer/iTunes) tanpa perlu live-edit dari bot,
 *  lengkap dengan cover art, visualiser, bilah progress yang bisa di-seek,
 *  antrian yang bisa digulir, dan tombol ⏮ ▶ ⏭ 🔀 🔁 ❤ di dalam kanvas.
 *  Kalau webview menolak jaringan/autoplay, kartu otomatis ke MODE VISUAL
 *  (UI + progress simulasi) dan mengarahkan user ke `.unduhlagu`.
 *
 *  Versi AIRich lama (pill + live edit + kirim audio) tetap ada: `.play2rich`.
 *
 *  Command:
 *    • .play2 <judul>    — cari + buka kartu HTML player
 *    • .play2rich <judul>— player AIRich ala Spotify (versi v7.4)
 *    • .carilagu <judul> — cari saja (tanpa memutar), pilih dari daftar
 *    • .unduhlagu [n]    — kirim audio preview lagu ke-n di antrian
 *    • .heartlagu [n]    — ❤️ simpan/hapus lagu ke-n di profil (database/musik.json)
 *    • .antrianlagu      — tampilkan ulang antrian + kartu player
 *    • .lagusuka         — daftar lagu yang di-❤️ (bisa diputar: .lagusuka 3)
 *    • .riwayatlagu      — 10 lagu terakhir yang diputar
 *    • .statusplayer     — tampilkan ulang kartu player
 *    • .stopplay2        — tutup sesi player AIRich (kartu HTML tidak perlu ditutup)
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import {
  bukaPlayer, bukaPlayerHtml, cariLagu, getSes, clearSes, hentikanTicker, getMusik,
  fmtDur, isSuka, renderPlayer, ambilAntrian, dataKartuMusik, kirimFileLagu, simpanMusik,
  toggleSuka, playerHtml, catatPutar, kontrolPlayerHtml, kirimUlangKartu
} from '../lib/musikplayer.js'
import { ambilLirik, lirikTeks } from '../lib/lirik.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender

/**
 * v7.6 — kartu HTML tidak bisa memutar audio dari internet (webview tanpa jaringan),
 * jadi suara dikirim sebagai **pesan audio WhatsApp** dan ganti lagu lewat perintah chat.
 * Fungsi ini menerjemahkan argumen `.play2` jadi aksi kontrol (bukan kata kunci pencarian).
 * @returns {'next'|'prev'|'ulang'|'acak'|number|null}
 */
export function kendaliPlay2 (teks) {
  const t = String(teks || '').trim().toLowerCase()
  if (!t) return null
  if (/^(next|lanjut|maju|berikutnya|nextlagu|laguberikutnya|⏭|⏭️|>>|>)$/.test(t)) return 'next'
  if (/^(prev|previous|sebelumnya|mundur|prevlagu|lagusebelumnya|⏮|⏮️|<<|<)$/.test(t)) return 'prev'
  if (/^(ulang|ulangi|replay|putarulang|repeat|lagi|ulanglagu|🔁|🔂)$/.test(t)) return 'ulang'
  if (/^(acak|shuffle|kocok|random|acaklagu|🔀)$/.test(t)) return 'acak'
  if (/^(kartu|card|player|tampilkartu|kartulagu)$/.test(t)) return 'kartu'
  const n = /^(\d{1,2})(?:\s*-?\s*(?:lagu|track|nomor)?)?$/.exec(t)
  if (n) return Math.max(1, parseInt(n[1], 10))
  return null
}

/* v7.9.1: .play2 dipindah ke features/play2.js (Spotify theresav). Player HTML lama tetap ada sebagai .playerlama */
export const play2 = {
  command: ['playerlama', 'play2lama', 'playerhtmllama'],
  category: 'Downloader',
  description: '🎧 Player musik gaya SPOTIFY + 🎤 LIRIK (HTML app: disc vinyl, tab antrean/lirik, D-pad) — audio preview Deezer/iTunes dikirim sebagai pesan audio WhatsApp',
  limit: 0,
  cooldown: 3,
  contoh: 'perfect ed sheeran',
  run: async m => {
    const q = String(m.q || m.args?.join(' ') || '').trim()
    const adaAntrian = ambilAntrian(K(m)).tracks.length > 0
    if (q) {
      /* argumen bisa berupa perintah kontrol (next/prev/3/acak) kalau sudah ada antrian */
      const kend = kendaliPlay2(q)
      if (kend === 'kartu') return kirimUlangKartu(m)
      if (kend !== null && adaAntrian) return kontrolPlayerHtml(m, kend)
      return bukaPlayerHtml(m, q)
    }
    /* tanpa argumen: kirim ulang kartu + audio antrian terakhir */
    if (adaAntrian) return kirimUlangKartu(m)
    {
      const s = getSes(m.jid)
      if (s) return renderPlayer(m, s, '🎧 Player AIRich masih aktif — tutup: ' + P + 'stopplay2')
      const u = getMusik(K(m))
      const fav = u.suka[0]
      const teks =
        `🎧 *${(config.bot?.name || 'THERYHANN!').toUpperCase()} MUSIC PLAYER* — HTML app\n\n` +
        'Pemutar musik bergaya **Spotify**: satu *kartu HTML app* (sistem yang sama seperti game ' +
        '.arcade/.casino/.pastel) untuk sampul, visualiser & antrian + **pesan audio WhatsApp** untuk ' +
        'suaranya (webview kartu tidak punya akses internet, jadi audio tidak bisa diputar dari dalam ' +
        'kartu — itu sebabnya suaranya dikirim terpisah).\n\n' +
        `*Cara pakai:* \`${P}play2 <judul lagu / artis>\`\n` +
        `*Contoh:* \`${P}play2 hingga tua bersama\` · \`${P}play2 shape of you ed sheeran\`\n\n` +
        `*Kontrol di kartu:* ◀ lagu sebelumnya · ▶ lagu berikutnya · ▲▼ pilih di antrian · ` +
        '● putar/jeda · ketuk sampul = putar/jeda · ketuk baris antrian = putar lagu itu · ' +
        'ketuk bilah = seek\n\n' +
        `*Kontrol:* \`${P}nextlagu\` ⏭ · \`${P}prevlagu\` ⏮ · \`${P}putarlagu 3\` 🔢 · \`${P}ulanglagu\` 🔁 · ` +
        `\`${P}acaklagu\` 🔀 · \`${P}kartulagu\` 🖼\n` +
        `*Perintah pendamping:* \`${P}unduhlagu 1\` (file) · \`${P}heartlagu 1\` (❤️ permanen) · ` +
        `\`${P}antrianlagu\` · \`${P}carilagu <judul>\` · \`${P}lagusuka\` · \`${P}riwayatlagu\`\n` +
        `*Versi AIRich (pill + live edit):* \`${P}play2rich <judul>\`\n\n` +
        (fav ? `Terakhir disukai: *${fav.judul}* — ${fav.artis}\nPutar lagi: \`${P}play2 ${fav.judul} ${fav.artis}\`\n` : '') +
        `Lagu favoritmu (${u.suka.length}): \`${P}lagusuka\` · Riwayat: \`${P}riwayatlagu\`\n` +
        `Total pemutaran: ${u.totalPutar}`
      try {
        return await sendButtons(m.sock, m.jid, {
          text: teks, title: '🎧 MUSIC PLAYER', footer: config.bot?.footer || '',
          buttons: [
            { text: '❤️ Lagu Suka', id: `${P}lagusuka` },
            { text: '🕘 Riwayat', id: `${P}riwayatlagu` },
            { text: '🔍 Cari Lagu', id: `${P}carilagu ` },
            { text: '🧩 Menu Game', id: `${P}gamerespon` }
          ]
        })
      } catch { return m.reply(teks) }
    }
  }
}

/* ============ v7.6: KONTROL PLAYER LEWAT CHAT (kartu tidak bisa callback) ============ */
const pluginKontrol = (nama, aliases, aksi, description, contoh) => ({
  command: [nama, ...aliases],
  category: 'Downloader',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    if (!ambilAntrian(K(m)).tracks.length) {
      return m.reply(`🎧 Belum ada antrian lagu.\n\nBuka player dulu: \`${P}play2 <judul lagu>\`\nContoh: \`${P}play2 hingga tua bersama rizky febian\``)
    }
    return kontrolPlayerHtml(m, aksi(m))
  }
})

export const nextLagu = pluginKontrol('nextlagu', ['lagunext', 'nextmusic', 'lanjutlagu', 'laguberikut', 'skiplagu', 'nextrpg'],
  () => 'next', '⏭ Lagu berikutnya di antrian .play2 (audio dikirim sebagai pesan WhatsApp)', '')
export const prevLagu = pluginKontrol('prevlagu', ['laguprev', 'prevmusic', 'mundurlagu', 'lagusebelum', 'backlagu'],
  () => 'prev', '⏮ Lagu sebelumnya di antrian .play2', '')
export const ulangLagu = pluginKontrol('ulanglagu', ['replaylagu', 'putarulang', 'lagulagi', 'repeatlagu', 'kirimulangaudio'],
  () => 'ulang', '🔁 Kirim ulang audio lagu yang sedang diputar', '')
export const acakLagu = pluginKontrol('acaklagu', ['shufflelagu', 'kocoklagu', 'randomlagu', 'mixlagu'],
  () => 'acak', '🔀 Kocok antrian .play2 lalu putar dari lagu pertama', '')
export const putarLagu = pluginKontrol('putarlagu', ['mainkanlagu', 'playtrack', 'lagunomor', 'pilihlagu', 'mainnomor'],
  m => {
    const n = parseInt(String(m.args?.[0] || '').replace(/[^\d]/g, ''), 10) || 0
    const antrian = ambilAntrian(K(m))
    if (!n) return 'ulang'
    return Math.max(1, Math.min(antrian.tracks.length || 1, n))
  },
  '🔢 Putar lagu nomor N di antrian .play2 — `.putarlagu 3`', '3')

export const kartuLagu = {
  command: ['kartulagu', 'kartuplayer', 'playercard', 'tampilkartu', 'kartumusik', 'playercard2'],
  category: 'Downloader',
  description: '🖼 Kirim ulang kartu HTML player .play2 (tanpa mengirim audio lagi)',
  limit: 0,
  cooldown: 2,
  run: async m => kirimUlangKartu(m)
}

/* ================= VERSI AIRich (v7.4) — tetap tersedia ================= */
export const play2Rich = {
  command: ['play2rich', 'play2airich', 'playerspotify', 'airichplayer', 'musikairich', 'play2pill'],
  category: 'Downloader',
  description: '🎧 Player musik AIRich ala Spotify (versi v7.4): kartu live-edit + pill kontrol + audio terkirim ke chat',
  limit: 0,
  cooldown: 3,
  contoh: 'perfect ed sheeran',
  run: async m => {
    const q = String(m.q || m.args?.join(' ') || '').trim()
    if (!q) {
      const s = getSes(m.jid)
      if (s) return renderPlayer(m, s, '🎧 Player AIRich masih aktif.')
      return m.reply(`🎧 *PLAYER AIRich (v7.4)*\n\nKartu now-playing yang di-*live edit* + pill kontrol (▶ ⏸ ⏮ ⏭ 🔀 🔁 ❤ 📥 📜 🔍 ⏹) dan audio preview terkirim ke chat.\n\nPakai: \`${P}play2rich <judul lagu>\`\nVersi HTML app (baru): \`${P}play2 <judul>\``)
    }
    return bukaPlayer(m, q)
  }
}

/* ================= .unduhlagu — kirim audio preview ================= */
export const unduhLagu = {
  command: ['unduhlagu', 'dllagu', 'downloadlagu', 'kirimlagu', 'unduhmusik', 'savelagu', 'dlsong', 'ambillagu'],
  category: 'Downloader',
  description: '📥 Kirim audio preview (30 detik) lagu dari antrian .play2 — `.unduhlagu 3`, tambah kata `file` untuk dokumen .mp3/.m4a',
  limit: 0,
  cooldown: 5,
  contoh: '2',
  run: async m => {
    const key = K(m)
    const args = (m.args || []).map(String)
    const dokumen = args.some(a => /^(file|dokumen|doc|mp3|m4a|dok)$/i.test(a))
    const n = parseInt(args.find(a => /^\d+$/.test(a)) || '', 10) || 0
    const antrian = ambilAntrian(key)
    if (!antrian.tracks.length) {
      return m.reply(`📥 Belum ada antrian lagu.\n\nBuka player dulu: \`${P}play2 <judul>\`\nCari saja: \`${P}carilagu <judul>\``)
    }
    if (n && (n < 1 || n > antrian.tracks.length)) {
      return m.reply(`❌ Lagu nomor *${n}* tidak ada di antrian (1–${antrian.tracks.length}).\n\nLihat antrian: \`${P}antrianlagu\``)
    }
    const i = n >= 1 ? n - 1 : antrian.idx
    let t = antrian.tracks[i]
    if (!t) return m.reply(`❌ Lagu tidak ditemukan di antrian.\nBuka player: \`${P}play2 <judul>\``)
    if (!t.preview) {
      /* URL preview lama bisa kedaluwarsa → cari ulang */
      try {
        const ulang = await cariLagu(`${t.judul} ${t.artis}`, 3)
        if (ulang[0]?.preview) t = { ...t, ...ulang[0] }
      } catch { /* biarkan, error di bawah */ }
    }
    if (!t.preview) return m.reply(`⚠️ *${t.judul}* tidak punya preview audio.\nCoba cari ulang: \`${P}play2 ${t.judul} ${t.artis}\``)
    try { await m.reply(`📥 Menyiapkan *${truncate(t.judul, 40)}* — ${truncate(t.artis, 30)}…`) } catch {}
    try {
      await kirimFileLagu(m, t, { dokumen })
      return { handled: true }
    } catch (e) {
      return m.reply(`⚠️ Gagal mengunduh audio: ${truncate(String(e?.message || e), 140)}\n\nCoba lagi atau cari ulang: \`${P}play2 ${truncate(t.judul, 30)}\``)
    }
  }
}

/* ================= .heartlagu — ❤️ permanen ================= */
export const heartLagu = {
  command: ['heartlagu', 'lovelagu', 'tandaisuka', 'sukaini', 'likesong', 'heartsong', 'simpanlagu'],
  category: 'Downloader',
  description: '❤️ Simpan/hapus lagu dari antrian .play2 ke daftar lagu suka (database/musik.json) — `.heartlagu 2`',
  limit: 0,
  cooldown: 2,
  contoh: '1',
  run: async m => {
    const key = K(m)
    const n = parseInt(String(m.args?.[0] || '').replace(/[^\d]/g, ''), 10) || 0
    const antrian = ambilAntrian(key)
    if (!antrian.tracks.length) return m.reply(`❤️ Belum ada antrian.\nBuka player: \`${P}play2 <judul>\``)
    const i = n >= 1 && n <= antrian.tracks.length ? n - 1 : antrian.idx
    const t = antrian.tracks[i]
    if (!t) return m.reply(`❌ Lagu nomor ${n} tidak ada (1–${antrian.tracks.length}).`)
    const sebelum = isSuka(key, t)
    const sekarang = toggleSuka(key, t)
    const u = getMusik(key)
    return m.reply(
      `${sekarang ? '💚' : '🤍'} *${t.judul}* — ${t.artis}\n` +
      `${sekarang ? 'Ditambahkan ke' : 'Dihapus dari'} lagu suka (sebelumnya ${sebelum ? 'disukai' : 'belum'}).\n\n` +
      `Total favorit: ${u.suka.length} · Daftar: \`${P}lagusuka\`\n` +
      `Putar favorit: \`${P}lagusuka ${Math.min(u.suka.length || 1, 1)}\``
    )
  }
}

/* ================= .antrianlagu ================= */
/* ================================================================== */
/*  .liriklagu — kirim lirik lagu antrian sebagai teks (LRCLIB, v7.7)   */
/* ================================================================== */
export const lirikLagu = {
  command: ['liriklagu', 'lirik', 'lyric', 'lyrics', 'lirikmusik', 'textlirik', 'tekslirik'],
  category: 'Downloader',
  description: '🎤 Kirim lirik lagu dari antrian .play2 sebagai teks (LRCLIB) — `.liriklagu 3`',
  limit: 0,
  cooldown: 3,
  contoh: '2',
  run: async m => {
    const key = K(m)
    const n = parseInt(String(m.args?.[0] || '').replace(/[^\d]/g, ''), 10) || 0
    const antrian = ambilAntrian(key)
    if (!antrian.tracks.length) {
      return m.reply(`🎤 Belum ada antrian lagu.\nCari dulu: \`${P}play2 <judul lagu>\` — kartu Spotify-nya membawa tab LIRIK, perintah ini mengirim liriknya sebagai teks.`)
    }
    if (n && (n < 1 || n > antrian.tracks.length)) {
      return m.reply(`❌ Lagu nomor ${n} tidak ada di antrian (1–${antrian.tracks.length}).\nLihat antrian: \`${P}antrianlagu\``)
    }
    const i = n ? n - 1 : antrian.idx
    const t = antrian.tracks[i]
    if (!t) return m.reply(`❌ Lagu nomor ${n} tidak ada (1–${antrian.tracks.length}).`)

    /* pakai hasil cache bila ada; kalau belum, ambil dari LRCLIB sekarang */
    if (t.lirik === undefined) {
      await m.react?.('🎤').catch(() => {})
      try { t.lirik = (await ambilLirik(t, { timeout: 6000 })) || null } catch { t.lirik = null }
      if (t.lirik) {
        const u = getMusik(key)
        u.antrian = antrian.tracks
        simpanMusik()
      }
    }
    const tambahan = !t.lirik ? '' : `\n\n📖 Di kartu Spotify (.play2): ketuk tab *LIRIK* lalu ▲▼ untuk menggulir.`
    return m.reply(lirikTeks(t, t.lirik) + tambahan)
  }
}

export const antrianLagu = {
  command: ['antrianlagu', 'queuelagu', 'daftarantrian', 'antrianmusik', 'queueplay2', 'listantrian'],
  category: 'Downloader',
  description: '📜 Antrian lagu .play2 saat ini + buka ulang kartu HTML player-nya',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const key = K(m)
    const antrian = ambilAntrian(key)
    if (!antrian.tracks.length) {
      return m.reply(`📜 Antrian kosong.\n\nBuka player: \`${P}play2 <judul>\` · Cari: \`${P}carilagu <judul>\``)
    }
    const teks =
      `📜 *ANTRIAN PLAYER* — "${truncate(antrian.query, 40)}"\n\n` +
      antrian.tracks.map((t, i) =>
        `${i === antrian.idx ? '▶' : i + 1 + '.'} *${truncate(t.judul, 34)}*${t.explicit ? ' 🅴' : ''}\n    ${truncate(t.artis, 30)} · ${fmtDur(t.durasiAsli)} · ${t.sumber}${isSuka(key, t) ? ' · 💚' : ''}`).join('\n') +
      `\n\n📥 Audio: \`${P}unduhlagu <nomor>\` · ❤️ \`${P}heartlagu <nomor>\`\n` +
      `Putar dari awal: \`${P}play2 ${truncate(antrian.query, 30)}\``
    /* coba kirim ulang kartunya juga */
    try {
      const data = dataKartuMusik(key, antrian.query, antrian.tracks, antrian.idx)
      await sendHtmlApp(m.sock, m.jid, { title: 'Music Player', html: playerHtml(config.bot?.name || 'theryhann!', data) })
    } catch { /* teks saja cukup */ }
    return m.reply(truncate(teks, 3800))
  }
}

export const cariLaguCmd = {
  command: ['carilagu', 'carimusik', 'searchlagu', 'cari2', 'searchmusik'],
  category: 'Downloader',
  description: '🔎 Cari lagu (Deezer + iTunes) dan tampilkan daftarnya tanpa memutar — pilih nomor untuk memutar',
  limit: 0,
  cooldown: 3,
  contoh: 'lagu indonesia terbaru',
  run: async m => {
    const q = String(m.q || m.args?.join(' ') || '').trim()
    if (!q) return m.reply(`🔎 Contoh: \`${P}carilagu tiara andini\``)
    try { await m.reply(`🔎 Mencari "*${truncate(q, 50)}*"…`) } catch {}
    let hasil
    try { hasil = await cariLagu(q, 10) } catch (e) { return m.reply(`⚠️ Gagal mencari: ${truncate(String(e?.message || e), 150)}`) }
    if (!hasil.length) return m.reply(`😕 Tidak ada hasil untuk "*${truncate(q, 50)}*".`)
    const daftar = hasil.map((t, i) => `${i + 1}. 🎵 *${t.judul}*\n    ${t.artis}${t.album ? ' · ' + t.album : ''} · ${fmtDur(t.durasiAsli)} · ${t.sumber}${t.explicit ? ' · 🅴' : ''}`).join('\n\n')
    const teks = `🔎 *HASIL PENCARIAN: ${truncate(q.toUpperCase(), 40)}*\n\n${daftar}\n\n*Putar semua (jadi antrian):* \`${P}play2 ${truncate(q, 40)}\`\n*Putar satu:* \`${P}play2 <judul> <artis>\``
    try {
      return await sendList(m.sock, m.jid, {
        title: '🔎 HASIL CARI', text: truncate(teks, 900), footer: config.bot?.footer || '',
        buttonText: '🎧 Pilih Lagu',
        sections: [{
          title: truncate(q, 30),
          rows: hasil.map((t, i) => ({ title: `${i + 1}. ${truncate(t.judul, 30)}`, description: `${t.artis} · ${fmtDur(t.durasiAsli)}`, id: `${P}play2 ${t.judul} ${t.artis}`.slice(0, 90) }))
        }, {
          title: 'Lainnya',
          rows: [{ title: '▶️ Putar semua sebagai antrian', description: `10 lagu dari "${truncate(q, 30)}"`, id: `${P}play2 ${truncate(q, 40)}` }]
        }]
      })
    } catch { return m.reply(teks) }
  }
}

export const laguSuka = {
  command: ['lagusuka', 'favoritmusik', 'musikfavorit', 'sukalagu', 'lagufavorit', 'playlistku'],
  category: 'Downloader',
  description: '❤️ Daftar lagu yang disukai dari player .play2 — balas dengan nomor untuk memutar',
  limit: 0,
  cooldown: 2,
  contoh: '3',
  run: async m => {
    const u = getMusik(K(m))
    const angka = parseInt(String(m.args?.[0] || '').replace(/[^\d]/g, ''), 10)
    if (angka) {
      const t = u.suka[angka - 1]
      if (!t) return m.reply(`❌ Tidak ada lagu favorit nomor ${angka}.`)
      return bukaPlayer(m, `${t.judul} ${t.artis}`)
    }
    if (!u.suka.length) {
      return m.reply(`🤍 Belum ada lagu yang disukai.\n\nPutar lagu dulu: \`${P}play2 <judul>\`, lalu ketuk pill *❤️ Suka* di kartunya.\nContoh: \`${P}play2 sempurna andra and the backbone\``)
    }
    const daftar = u.suka.slice(0, 25).map((t, i) => `${i + 1}. 🎵 *${t.judul}* — ${t.artis}${t.album ? `\n    💿 ${truncate(t.album, 32)}` : ''}`).join('\n')
    const teks = `❤️ *LAGU SUKA KAMU* (${u.suka.length} lagu)\n\n${daftar}\n\n*Putar:* \`${P}lagusuka <nomor>\` — contoh \`${P}lagusuka 1\`\n*Hapus satu:* putar lagunya lalu ketuk ❤️ Suka lagi.`
    try {
      return await sendButtons(m.sock, m.jid, {
        text: teks, title: '❤️ LAGU SUKA', footer: config.bot?.footer || '',
        buttons: [
          { text: '▶️ Putar #1', id: `${P}lagusuka 1` },
          { text: '▶️ Putar #2', id: u.suka[1] ? `${P}lagusuka 2` : `${P}lagusuka 1` },
          { text: '🎧 Player', id: `${P}play2` },
          { text: '🕘 Riwayat', id: `${P}riwayatlagu` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

export const riwayatLagu = {
  command: ['riwayatlagu', 'historylagu', 'laguterakhir', 'riwayatmusik', 'terakhirputar'],
  category: 'Downloader',
  description: '🕘 10 lagu terakhir yang diputar lewat .play2 — balas dengan nomor untuk memutar ulang',
  limit: 0,
  cooldown: 2,
  contoh: '2',
  run: async m => {
    const u = getMusik(K(m))
    const angka = parseInt(String(m.args?.[0] || '').replace(/[^\d]/g, ''), 10)
    if (angka) {
      const t = u.riwayat[angka - 1]
      if (!t) return m.reply(`❌ Tidak ada riwayat nomor ${angka}.`)
      return bukaPlayer(m, `${t.judul} ${t.artis}`)
    }
    if (!u.riwayat.length) return m.reply(`🕘 Belum ada riwayat.\nPutar lagu: \`${P}play2 <judul>\``)
    const daftar = u.riwayat.slice(0, 10).map((t, i) => `${i + 1}. 🎵 *${t.judul}* — ${t.artis}\n    ${t.sumber} · ${fmtDur(t.durasiAsli)} · ${new Date(t.waktu).toLocaleString('id-ID')}`).join('\n')
    const teks = `🕘 *RIWAYAT PEMUTARAN* (total ${u.totalPutar} kali putar)\n\n${daftar}\n\n*Putar ulang:* \`${P}riwayatlagu <nomor>\``
    try {
      return await sendButtons(m.sock, m.jid, {
        text: teks, title: '🕘 RIWAYAT', footer: config.bot?.footer || '',
        buttons: [
          { text: '▶️ Putar #1', id: `${P}riwayatlagu 1` },
          { text: '❤️ Lagu Suka', id: `${P}lagusuka` },
          { text: '🎧 Player', id: `${P}play2` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

export const stopPlay2 = {
  command: ['stopplay2', 'tutupplayer', 'matikanmusik', 'closeplayer', 'stopmusik2'],
  category: 'Downloader',
  description: '⏹️ Tutup player musik .play2 di chat ini',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const s = getSes(m.jid)
    if (!s) {
      return m.reply(`🎧 Tidak ada sesi player AIRich di chat ini.\n\nKartu HTML \`${P}play2\` tidak butuh ditutup — cukup jangan ditekan.\nBuka lagi: \`${P}play2 <judul>\``)
    }
    hentikanTicker(s)
    clearSes(m.jid)
    return m.reply(`⏹️ Player AIRich ditutup.\n\nBuka lagi: \`${P}play2 <judul>\` (HTML) · \`${P}play2rich <judul>\` (AIRich) · favorit: \`${P}lagusuka\``)
  }
}

export const playerStatus = {
  command: ['statusplayer', 'nowplay', 'sedangputar', 'playerinfo'],
  category: 'Downloader',
  description: '📊 Tampilkan ulang kartu player: HTML app (antrian terakhir) atau AIRich bila sesi live masih aktif',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const s = getSes(m.jid)
    if (s) {
      const t = s.queue[s.idx]
      return renderPlayer(m, s, `📊 Status: ${s.status} · ${t ? `${t.judul} — ${t.artis}` : 'antrian kosong'} · ${isSuka(s.userKey, t) ? '💚 disukai' : '🤍'}`)
    }
    const antrian = ambilAntrian(K(m))
    if (!antrian.tracks.length) return m.reply(`🎧 Player tidak aktif.\nMulai: \`${P}play2 <judul>\``)
    const t = antrian.tracks[antrian.idx]
    const data = dataKartuMusik(K(m), antrian.query, antrian.tracks, antrian.idx)
    try {
      await sendHtmlApp(m.sock, m.jid, { title: 'Music Player', html: playerHtml(config.bot?.name || 'theryhann!', data) })
      return m.reply(`📊 Antrian terakhir: *${t ? t.judul : '-'}* — ${t ? t.artis : ''} (${antrian.idx + 1}/${antrian.tracks.length}) · ${isSuka(K(m), t) ? '💚 disukai' : '🤍'}\n\nKartu player dibuka ulang di atas.`)
    } catch {
      return m.reply(`📊 Antrian terakhir: *${t ? t.judul : '-'}* — ${t ? t.artis : ''} (${antrian.idx + 1}/${antrian.tracks.length})\nBuka kartu: \`${P}play2 ${truncate(antrian.query, 30)}\``)
    }
  }
}

export default {
  play2, play2Rich, cariLaguCmd, unduhLagu, heartLagu, antrianLagu,
  laguSuka, riwayatLagu, stopPlay2, playerStatus
}
