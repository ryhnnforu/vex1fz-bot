/**
 * 🏆 LEADERBOARD GAME — `.lbgame` + `.setorskore` (v7.6)
 * -------------------------------------------------------------------------
 *  Kartu HTML game berjalan di HP user dan **tidak bisa memanggil balik**
 *  ke bot, jadi skor tidak mungkin dikirim otomatis. Karena itu tiap kartu
 *  game kini punya bar "🏆 Papan peringkat" di bawah D-pad yang menampilkan
 *  **kode setor** (skor + hash dari nonce yang dibuat server saat kartu
 *  dikirim). User mengirim `.setorskore <kode>` → server memverifikasi
 *  hash-nya dengan nonce miliknya sendiri → skor masuk papan peringkat.
 *
 *  Game yang hasilnya diacak di server (casino RPG, `.slot`) mencatat skor
 *  otomatis tanpa kode.
 *
 *  Perintah:
 *    • .lbgame [game|kategori]  — kartu HTML papan peringkat
 *    • .lblist [game]           — versi teks
 *    • .setorskore <kode>       — setor skor dari kartu game
 *    • .rankgame                — peringkatmu di semua game
 *    • .lbreset [game]          — (owner) hapus papan peringkat
 */
import { config } from '../config.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { truncate } from '../lib/functions.js'
import {
  dataLb, lbHtml, lbTeks, setorKode, papan, rankOf, daftarGame, statistikUser,
  catatSkor, infoGame, NAMA_GAME, simpanLb
} from '../lib/lbgame.js'
import { loadDB } from '../lib/database.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'
const K = m => m.senderKey || m.sender
const KATEGORI = ['ARCADE', 'PASTEL', 'CASINO', 'JADUL', 'RPG']

/* ================================================================== */
/*  .lbgame [game|kategori] — kartu HTML papan peringkat                */
/* ================================================================== */
export const lbGame = {
  command: ['lbgame', 'papanperingkat', 'rankinggame', 'rankgame2',
    'peringkatgame', 'topscore', 'skortertinggi', 'lbhtml', 'papanrank', 'leaderboardgame'],
  category: 'Games',
  description: '🏆 Papan peringkat semua game sebagai kartu HTML app (medali, rank kamu, pilih game dengan ▲▼) — `.lbgame match3` / `.lbgame pastel`',
  limit: 0,
  cooldown: 3,
  contoh: 'match3',
  run: async m => {
    const user = K(m)
    const arg = String(m.q || m.args?.join(' ') || '').trim().toLowerCase()
    const kategori = KATEGORI.includes(arg.toUpperCase()) ? arg.toUpperCase() : ''
    const game = !kategori && arg ? arg.replace(/[^a-z0-9]/g, '') : ''
    const data = dataLb(user, { game, kategori, nama: m.pushName || 'Kamu' })

    if (!data.games.length) {
      return m.reply(
        `🏆 *PAPAN PERINGKAT* masih kosong.\n\n` +
        `1. Main game apa saja: \`${P}pastel\` · \`${P}arcade\` · \`${P}casino\` · \`${P}jadul\`\n` +
        `2. Di bawah D-pad ada bar *🏆 Papan peringkat* berisi **kode setor**\n` +
        `3. Kirim: \`${P}setorskore <kode>\`\n\n` +
        `Game casino RPG (\`${P}rolet\`, \`${P}dadukoin\`, \`${P}aviator\`, \`${P}keno\`, \`${P}blackjack21\`) dan \`${P}slot\` tercatat **otomatis**.`)
    }

    let kartuGagal = null
    try {
      await m.sock.relayMessage
      const { sendHtmlApp } = await import('../lib/htmlapp.js')
      await sendHtmlApp(m.sock, m.jid, { title: 'Papan Peringkat', html: lbHtml(brand(), data) })
    } catch (e) { kartuGagal = e }

    /* v7.8.0: pendamping DIPERSINGKAT — daftar kecil leaderboard di bawah pesan
       DIHAPUS sesuai permintaan; detail tetap ada lewat .lblist */
    const g = data.games[data.mulai] || data.games[0]
    const rows = g ? (data.papan[g.id] || []).slice(0, 5) : []
    const medali = r => r <= 3 ? ['🥇', '🥈', '🥉'][r - 1] : `#${r}`
    const teks =
      `🏆 *PAPAN PERINGKAT*${g ? ` — ${g.icon} *${g.nama}*` : ''}\n` +
      (kartuGagal
        ? '⚠️ Kartu HTML tidak bisa dimuat di client ini, berikut versi teksnya:\n'
        : 'Kartu interaktifnya ada di pesan di atas ✨ (ketuk kiri/kanan untuk ganti game)\n') +
      (rows.length
        ? '\n' + rows.map(r => `${medali(r.r)} *${r.n}* — ${r.s.toLocaleString('id-ID')}${r.me ? '  ← kamu' : ''}`).join('\n') + '\n'
        : '\n_Belum ada skor di game ini — jadilah yang pertama!_\n') +
      (g?.rankKu ? `\n📍 Peringkatmu: *#${g.rankKu}* dari ${g.jumlah} pemain (skor ${g.skorKu.toLocaleString('id-ID')})\n` : '') +
      `\n📜 Versi teks lengkap: \`${P}lblist${g ? ' ' + g.id : ''}\`\n` +
      `📊 Semua peringkatmu: \`${P}rankgame\`\n` +
      `📥 Setor skor: kirim *kode* dari bar 🏆 di kartu game (otomatis), atau \`${P}setorskore <kode>\`\n` +
      `🧭 Menu leaderboard: \`${P}lbmenu\``
    await m.reply(truncate(teks, 3800))
    return { handled: true }
  }
}

/* ================================================================== */
/*  .lblist [game|kategori] — versi teks                                */
/* ================================================================== */
export const lbList = {
  command: ['lblist', 'lbteks', 'daftarrank', 'listleaderboard', 'peringkatlist', 'lbsemua'],
  category: 'Games',
  description: '📜 Papan peringkat versi teks (semua game / satu game / satu kategori) — `.lblist match3`',
  limit: 0,
  cooldown: 2,
  contoh: 'pastel',
  run: async m => {
    const arg = String(m.q || m.args?.join(' ') || '').trim().toLowerCase()
    const kategori = KATEGORI.includes(arg.toUpperCase()) ? arg.toUpperCase() : ''
    const game = !kategori && arg ? arg.replace(/[^a-z0-9]/g, '') : ''
    const teks = lbTeks(K(m), { game, kategori })
    try {
      return await sendButtons(m.sock, m.jid, {
        text: teks, title: '🏆 PAPAN PERINGKAT', footer: brand(),
        buttons: [
          { text: '🖼 Kartu HTML', id: `${P}lbgame${game ? ' ' + game : ''}` },
          { text: '📊 Peringkatku', id: `${P}rankgame` },
          { text: '🧩 Menu Game', id: `${P}gamerespon` },
          { text: '🧸 Game Pastel', id: `${P}pastel` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

/* ================================================================== */
/*  .setorskore <kode> — setor skor dari kartu game                     */
/* ================================================================== */
/* ------------------------------------------------------------------ */
/*  v7.8.1: OTOMATIS SETOR SKOR — kirim kodenya saja (tanpa .setorskore) */
/*  Teks berisi persis kode (mis. `by-rpqhl` / `1a2-x9f3k`) ini langsung */
/*  diverifikasi signature nonce → langsung masuk lbgame (sesuai request) */
/* ------------------------------------------------------------------ */
export async function cekSetorOtomatis (m) {
  if (m.isCommand) return null
  const teks = String(m.text || '').trim()
  /* pola kode: aaa-bbbbb pendek (dengan huruf/angka, tidak lebih dari 14 total) */
  const cocok = /^([0-9A-Za-z]{2,5})-([0-9A-Za-z]{3,7})$/.exec(teks)
  if (!cocok) return null
  const Pec = setorKode(m.senderKey || m.sender, m.pushName || (m.sender || '').split('@')[0], teks)
  if (!Pec?.ok) return null   /* bukan kode aktif → biarkan jadi pesan biasa (AI-handler) */
  const g = infoGame(Pec.game)
  const over = Pec.rankBaru || Pec.rank
  return m.reply(
    `✅ *SKOR OTOMATIS TERCATAT!* (kode: \`${teks}\`)\n` +
    `▸ Game: ${g.icon} *${g.nama}*\n` +
    `▸ Skor kamu: *${(Pec.skorTotal || Pec.skor || Pec.skorAkhir || Pec.total || '-').toString()}*\n` +
    `▸ Peringkat kamu sekarang: *#${over}* di *${g.kategori}*\n\n` +
    `Papan peringkat update langsung: \`${P}lbgame ${Pec.game}\` · peringkatmu: \`${P}rankgame\``,
    { mentions: [m.sender] }
  ).then(() => ({ handled: true }))
}

export const setorSkor = {
  command: ['setorskore', 'skor', 'simpanskor', 'submitSkor', 'kodeskor', 'setor',
    'kirimskor', 'skorgame', 'lbsetor', 'setscore'],
  category: 'Games',
  description: '📥 Setor skor dari kartu game ke papan peringkat — salin kode di bar 🏆 bawah kartu: `.setorskore 1a2-x9f3k`',
  limit: 0,
  cooldown: 2,
  contoh: '1a2-x9f3k',
  run: async m => {
    const user = K(m)
    const kode = String(m.q || m.args?.join(' ') || '').trim()
    if (!kode) {
      const games = daftarGame()
      return m.reply(
        `📥 *SETOR SKOR GAME*\n\n` +
        `Di setiap kartu game (arcade/pastel/casino/jadul) ada bar *🏆 Papan peringkat* di bawah D-pad:\n` +
        `\`SKOR 1234 · KODE 1a2-x9f3k\`\n\n` +
        `Kirim kodenya ke bot:\n\`${P}setorskore 1a2-x9f3k\`\n\n` +
        `• Kode berlaku **12 jam** & hanya untuk kartu yang dikirim ke kamu\n` +
        `• Satu kode = satu kali setor (kode baru muncul tiap kartu dibuka)\n` +
        `• Game casino RPG & \`${P}slot\` tercatat **otomatis** tanpa kode\n` +
        `• Papan peringkat: \`${P}lbgame\`${games.length ? `\n• Sudah ada ${games.length} game & ${games.reduce((a, g) => a + g.jumlah, 0)} pemain terdaftar` : ''}`)
    }
    const h = setorKode(user, m.pushName || 'Kamu', kode)
    if (!h.ok) return m.reply(`❌ ${h.pesan}`)
    const rows = papan(h.game, 5)
    return m.reply(
      `✅ *SKOR TERCATAT*\n\n` +
      `${h.icon} *${h.nama}* (${h.kategori})\n` +
      `Skor: *${h.skor.toLocaleString('id-ID')}*${h.terbaikBaru ? '  🎉 **REKOR BARU!**' : ` (terbaikmu ${h.terbaikLama.toLocaleString('id-ID')})`}\n` +
      `Peringkat: *#${h.rank}* dari ${h.total} pemain\n\n` +
      (rows.length ? rows.map(r => `${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : '#' + r.rank} ${r.nama}${r.user === user ? ' *(KAMU)*' : ''} — ${r.skor.toLocaleString('id-ID')}`).join('\n') + '\n\n' : '') +
      `🏆 Papan lengkap: \`${P}lbgame ${h.game}\` · main lagi: \`${P}${h.game}\``)
  }
}

/* ================================================================== */
/*  .rankgame — peringkatku di semua game                               */
/* ================================================================== */
export const rankGame = {
  command: ['rankgame', 'skorku', 'myscore', 'statistikgame', 'profilgame', 'peringkatgamemu', 'rankgameku'],
  category: 'Games',
  description: '📊 Peringkat & skor terbaikmu di semua game + total setoran',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const user = K(m)
    const st = statistikUser(user)
    if (!st.length) {
      return m.reply(`📊 Kamu belum punya skor tercatat.\n\nMain game lalu setor kodenya: \`${P}setorskore <kode>\`\nPapan peringkat: \`${P}lbgame\``)
    }
    const medali = st.filter(x => x.rank === 1).length
    const tiga = st.filter(x => x.rank <= 3).length
    const teks =
      `📊 *PERINGKATMU* — ${m.pushName || 'Kamu'}\n\n` +
      `🎮 ${st.length} game dimainkan · 🥇 ${medali} juara 1 · 🏅 ${tiga} masuk 3 besar\n` +
      `📥 Total setoran skor: ${st.reduce((a, x) => a + (x.setor || 0), 0)}\n\n` +
      st.slice(0, 18).map(x =>
        `${x.icon} *${x.nama}* — ${x.rank ? `#${x.rank}` : '-'} · terbaik *${(x.terbaik || 0).toLocaleString('id-ID')}* · ${x.setor || 0}× setor`).join('\n') +
      `\n\n🏆 Papan peringkat: \`${P}lbgame\` · setor skor: \`${P}setorskore <kode>\``
    try {
      return await sendButtons(m.sock, m.jid, {
        text: truncate(teks, 3800), title: '📊 PERINGKATKU', footer: brand(),
        buttons: [
          { text: '🏆 Papan Peringkat', id: `${P}lbgame` },
          { text: '🧸 Game Pastel', id: `${P}pastel` },
          { text: '🕹️ Arcade', id: `${P}arcade` },
          { text: '🧩 Semua Game', id: `${P}gamerespon` }
        ]
      })
    } catch { return m.reply(truncate(teks, 3800)) }
  }
}

/* ================================================================== */
/*  .lbreset [game] — owner                                             */
/* ================================================================== */
export const lbReset = {
  command: ['lbreset', 'resetlb', 'hapuslb', 'resetleaderboard', 'clearlb', 'resetrank'],
  category: 'Owner Menu',
  description: '🧹 (Owner) Hapus papan peringkat — `.lbreset match3` atau `.lbreset semua`',
  owner: true,
  limit: 0,
  cooldown: 2,
  contoh: 'match3',
  run: async m => {
    const arg = String(m.q || m.args?.join(' ') || '').trim().toLowerCase()
    const d = loadDB('lbgame', { token: {}, skor: {}, stat: {}, meta: { totalSetor: 0 } })
    if (!arg) {
      const games = Object.keys(d.skor || {})
      return m.reply(
        `🧹 *RESET PAPAN PERINGKAT*\n\n` +
        `Ada ${games.length} game dengan skor, total ${d.meta?.totalSetor || 0} setoran.\n\n` +
        `• Satu game: \`${P}lbreset <game>\` (mis. \`${P}lbreset match3\`)\n` +
        `• Semua: \`${P}lbreset semua\`\n` +
        `• Statistik user saja: \`${P}lbreset stat\``)
    }
    if (arg === 'semua' || arg === 'all') {
      d.skor = {}; d.stat = {}; d.token = {}; d.meta = { totalSetor: 0 }
      simpanLb()
      return m.reply('🧹 Semua papan peringkat + statistik + token dihapus.')
    }
    if (arg === 'stat') {
      d.stat = {}
      simpanLb()
      return m.reply('🧹 Statistik per-user dihapus (papan peringkat tetap ada).')
    }
    if (arg === 'token') {
      d.token = {}
      simpanLb()
      return m.reply('🧹 Semua token/kode setor dibatalkan.')
    }
    const id = arg.replace(/[^a-z0-9]/g, '')
    if (!d.skor[id]) return m.reply(`❌ Game *${id}* tidak ada di papan peringkat.\n\nGame terdaftar: ${Object.keys(d.skor).slice(0, 20).join(', ') || '-'}`)
    const n = (d.skor[id] || []).length
    delete d.skor[id]
    for (const u of Object.keys(d.stat || {})) if (d.stat[u][id]) delete d.stat[u][id]
    simpanLb()
    const info = infoGame(id)
    return m.reply(`🧹 Papan *${info.icon} ${info.nama}* dihapus (${n} entri).`)
  }
}

/* ================================================================== */
/*  .lbinfo — cara kerja leaderboard                                    */
/* ================================================================== */
export const lbInfo = {
  command: ['lbinfo', 'infolb', 'caralb', 'infoperingkat', 'bantulb', 'lbbantuan'],
  category: 'Games',
  description: 'ℹ️ Cara kerja papan peringkat & kode setor skor',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const games = daftarGame()
    const teks =
      `🏆 *PAPAN PERINGKAT GAME*\n\n` +
      `*Kenapa pakai kode?*\nKartu game HTML berjalan di HP-mu dan tidak bisa mengirim data balik ke bot. ` +
      `Jadi tiap kartu diberi *kunci rahasia* dari server; kartu menghitung kode dari skor + kunci itu ` +
      `dan menampilkannya di bar 🏆 di bawah D-pad. Bot memverifikasi kode saat kamu setor — ` +
      `kode dari kartu orang lain atau karangan sendiri akan ditolak.\n\n` +
      `*Cara setor skor:*\n1. Buka game: \`${P}pastel\` · \`${P}arcade\` · \`${P}casino\` · \`${P}jadul\`\n` +
      `2. Main, lihat bar 🏆 di bawah D-pad: \`SKOR 1234 · KODE 1a2-x9f3k\`\n` +
      `3. Kirim kodenya saja (\`1a2-x9f3k\`) — otomatis tercatat. Bisa juga \`${P}setorskore 1a2-x9f3k\`\n\n` +
      `*Otomatis (tanpa kode):* casino RPG (\`${P}rolet\` \`${P}dadukoin\` \`${P}aviator\` \`${P}keno\` \`${P}blackjack21\`) & \`${P}slot\` — skor = keuntungan koin, dicatat server tiap ronde.\n\n` +
      `*Aturan:* 1 entri per user per game (diambil skor terbaik) · kode berlaku 12 jam · 1 kode = 1× setor.\n\n` +
      `*Perintah:* \`${P}lbmenu\` (menu) · \`${P}lbgame [game]\` (kartu HTML) · \`${P}lblist\` (teks) · \`${P}rankgame\` (peringkatmu) · \`${P}lbreset\` (owner)\n\n` +
      (games.length
        ? `*Sudah terdaftar (${games.length} game):*\n` + games.slice(0, 14).map(g => `${g.icon} ${g.nama} — 🥇 ${g.juara} (${g.terbaik.toLocaleString('id-ID')})`).join('\n')
        : '_Belum ada skor. Jadilah yang pertama!_')
    return m.reply(truncate(teks, 3900))
  }
}

/* ================================================================== */
/*  .lbmenu — hub papan peringkat (v7.8.3, teks rapi & mudah dibaca)    */
/* ================================================================== */
/* v7.31.0: .lbmenu dipindah ke features/kartuanim.js (kartu HTML animasi) */

export const LB_KATEGORI = KATEGORI
export const LB_NAMA_GAME = NAMA_GAME
export { catatSkor }
