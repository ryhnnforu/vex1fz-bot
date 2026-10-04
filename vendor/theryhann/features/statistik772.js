/**
 * 📊 STATISTIK + MODE + EKSPORT SKOR v7.7.2
 * ------------------------------------------------------------------
 *  • .statfitur    — dashboard statistik PERINTAH bot (top dipakai,
 *                    total hit, kategori paling ramai, data stats.json)
 *  • .hitsaya      — statistik personal kamu (total + top 5 + 10 terakhir)
 *  • .cmdmode      — (OWNER) atur mode per-perintah: `self` = hanya
 *                    owner/bot yang bisa pakai; `reset` = kembalikan normal
 *                    → gerbang dipasang di handlers/message.js
 *  • .kartuskor    — EKSPORT SKOR KE GAMBAR: PNG leaderboard sebuah game
 *  • .skorimg      — PNG kartu peringkat PRIBADI (semua game kamu)
 *
 *  Ekspor PNG diolah server-side (jimp murni via lib/scorecard.js),
 *  dikirim sebagai pesan WhatsApp, bukan webview.
 */
import { config } from '../config.js'
import { getStats, getSettings, saveNow } from '../lib/database.js'
import { findPlugin } from '../lib/plugins.js'
import { papan, daftarGame, statistikUser, rankOf, infoGame } from '../lib/lbgame.js'
import { kartuSkorPng } from '../lib/scorecard.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const TEMA_KAT = { ARCADE: ['#00f3ff', '#ff0055'], PASTEL: ['#ff8fb1', '#8ee0c8'], JADUL: ['#fbbf24', '#fb923c'], CASINO: ['#fde047', '#f472b6'], RPG: ['#fde047', '#fb923c'], LAIN: ['#38bdf8', '#a78bfa'] }
const ANGKA = n => Math.max(0, Math.floor(n || 0)).toLocaleString('id-ID')

/* ================================================================== */
/*  1. .statfitur — dashboard statistik perintah (Info Menu)           */
/* ================================================================== */
export const statFitur = {
  command: ['statfitur', 'statperintah', 'perintahstat', 'featurestats', 'cmdstat', 'statfiturkarni'],
  category: 'Info Menu',
  description: '📈 Dashboard statistik pemakaian perintah bot (top dipaksi, kategori paling ramai, total hit)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const s = getStats()
    const total = s.total || 0
    const cmds = s.commands || {}
    const entri = Object.entries(cmds).sort((a, b) => b[1] - a[1])
    const top = entri.slice(0, 10)
    /* kategori paling ramai */
    const perKat = {}
    for (const [cmd, n] of entri) {
      const pl = findPlugin(cmd)
      const kat = pl?.plugin?.category || 'Lainnya'
      perKat[kat] = (perKat[kat] || 0) + n
    }
    const katTeratas = Object.entries(perKat).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const unikUser = Object.keys(s.users || {}).length

    const teks =
      `📈 *STATISTIK FITUR — ${config.bot.name}*\n\n` +
      `▸ Total perintah diproses: *${ANGKA(total)}*\n` +
      `▸ Perintah aktif yang pernah dipakai: *${ANGKA(entri.length)}*\n` +
      `▸ Pengguna terdaftar di statistik: *${ANGKA(unikUser)}*\n\n` +
      `*🏆 10 PERINTAH PALING LARIS:*\n` +
      (top.length ? top.map(([c, n], i) => `${i + 1}. \`${P}${c}\` — ${ANGKA(n)}×`).join('\n') : '(belum ada data — statistik mulai tercatat sejak bot jalan)') +
      `\n\n*🗂 KATEGORI PALING RAMAI:*\n` +
      (katTeratas.length ? katTeratas.map(([k, n], i) => `${['🥇', '🥈', '🥉', '▸', '▸', '▸'][i]} ${k} — ${ANGKA(n)}×`).join('\n') : '-') +
      `\n\nStatistik milikmu: \`${P}hitsaya\` · ekspor skor game: \`${P}kartuskor <game>\``
    return m.sendButtons({
      title: '📈 Statistik Fitur',
      text: teks,
      footer: config.bot.footer,
      buttons: [
        { text: '👤 Statistik Saya', id: `${P}hitsaya` },
        { text: '🏆 Ekspor Skor Snake', id: `${P}kartuskor snake` },
        { text: '🎮 Leaderboard', id: `${P}lbgame` }
      ]
    }).catch(() => m.reply(teks))
  }
}

/* ================================================================== */
/*  2. .hitsaya — statistik personal                                   */
/* ================================================================== */
export const hitSaya = {
  command: ['hitsaya', 'hitku', 'mystats', 'statkuu', 'perintahku', 'lihatstat saya'.replace(' ', '')],
  category: 'User Menu',
  description: '👤 Statistik pemakaian perintah milikmu (total, favorit, 10 perintah terakhir)',
  limit: 0,
  cooldown: 3,
  run: m => {
    const s = getStats()
    const u = (s.users || {})[m.senderKey || m.sender]
    /* addHit tercatat DULU → kalau satu-satunya catatan ya perintah ini sendiri,
       hitung itu sebagai "belum ada data" (jujur ke pemakai perintah) */
    const selainIni = u && Object.entries(u.commands || {}).some(([c, n]) => c !== 'hitsaya' && n > 0)
    if (!u || !selainIni) {
      return m.reply(`👤 *STATISTIK KAMU*\n\nBelum ada catatan perintah dari akunmu sejak bot jalan/terdata.\nMulai main-main dulu: \`${P}menu\` lalu pakai perintahnya.`)
    }
    const top = Object.entries(u.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const riwayat = (u.riwayat || []).slice(0, 10)
    return m.reply(
      `👤 *STATISTIK KAMU* — @${(m.senderKey || m.sender).split('@')[0]}\n\n` +
      `▸ Total perintah dipakai: *${ANGKA(u.total)}*\n` +
      `▸ Terakhir aktif: ${u.last ? new Date(u.last).toLocaleString('id-ID') : '-'}\n\n` +
      `*⭐ Perintah favoritmu:*\n` +
      (top.length ? top.map(([c, n], i) => `${i + 1}. \`${P}${c}\` — ${ANGKA(n)}×`).join('\n') : '-') +
      `\n\n*🕘 10 perintah terakhir:*\n` +
      (riwayat.length ? riwayat.map(c => '`' + P + c + '`').join(' · ') : '-') +
      `\n\nStatistik bot: \`${P}statfitur\``,
      { mentions: [m.senderKey || m.sender] }
    )
  }
}

/* ================================================================== */
/*  3. .cmdmode — mode public/self per perintah (OWNER)                */
/* ================================================================== */
export const cmdMode = {
  command: ['cmdmode', 'modeperintah', 'setcmdmode', 'commandmode', 'modefitur'],
  category: 'Owner Menu',
  description: '🔐 Atur mode per-perintah: `.cmdmode <perintah> self|reset` — self = hanya owner/bot yang bisa memakai',
  owner: true,
  limit: 0,
  run: m => {
    const settings = getSettings()
    if (!settings.cmdMode) settings.cmdMode = {}

    /* daftar */
    const args = (m.q || '').trim().split(/\s+/).filter(Boolean)
    if (!args.length || /^list|daftar|semua$/.test(args[0])) {
      const entri = Object.entries(settings.cmdMode).filter(([k]) => findPlugin(k))
      if (!entri.length) {
        return m.reply(
          `🔐 *MODE PER PERINTAH*\n\nBelum ada perintah yang dikunci khusus.\n\n` +
          `Cara pakai:\n• ${P}cmdmode play self — \`${P}play\` cuma bisa dipakai owner/bot\n` +
          `• ${P}cmdmode play reset — kembali normal\n• ${P}cmdmode list — daftar yang dikunci\n\n` +
          `\"self\" menyembunyikan perintah dari user lain (seperti mode self global, tapi per-perintah) — berguna untuk fitur berat/berisiko.`
        )
      }
      return m.reply(
        `🔐 *PERINTAH KUNCI SAAT INI* (${entri.length})\n\n` +
        entri.map(([c, mode]) => `▸ \`${P}${c}\` — *${mode}*${mode === 'self' ? ' (hanya owner/bot)' : ''}`).join('\n') +
        `\n\nBukakan: ${P}cmdmode <perintah> reset`
      )
    }

    const cmd = findPlugin(String(args[0]).replace(/^\.+/, '').toLowerCase())
    if (!cmd) return m.reply(`❌ Perintah \`${args[0]}\` tidak dikenal. Cek di ${P}carimenu.`)
    const nama = cmd.name || cmd.plugin?.name || String(args[0]).toLowerCase()
    const mode = String(args[1] || '').toLowerCase()

    if (!mode) {
      const sekarang = settings.cmdMode[nama]
      return m.reply(
        `🔐 Mode \`${P}${nama}\` saat ini: *${sekarang || 'normal'}*\n\n` +
        `Ubah: \`${P}cmdmode ${nama} self\` (hanya owner/bot) · \`${P}cmdmode ${nama} reset\``
      )
    }
    if (mode === 'reset' || mode === 'public' || mode === 'normal' || mode === 'buka') {
      delete settings.cmdMode[nama]
      saveNow('settings')
      return m.reply(`✅ Mode \`${P}${nama}\` dikembalikan *NORMAL* (mengikuti aturan biasa).`)
    }
    if (mode === 'self') {
      settings.cmdMode[nama] = 'self'
      saveNow('settings')
      return m.reply(`🔐 \`${P}${nama}\` kini mode *SELF* — hanya kamu (owner/bot) yang bisa memakainya.\nBuka lagi: \`${P}cmdmode ${nama} reset\``)
    }
    return m.reply(`❌ Mode tidak dikenal: \`${mode}\`.\nPakai: \`${P}cmdmode ${nama} self\` atau \`${P}cmdmode ${nama} reset\``)
  }
}

/* ================================================================== */
/*  4. .kartuskor — ekspor leaderboard game ke PNG                     */
/* ================================================================== */
export const kartuskorCmd = {
  command: ['kartuskor', 'eksporskor', 'scorecard', 'lbimage', 'kartulb', 'leaderboardimg'],
  category: 'Games',
  description: '🖼 Ekspor leaderboard game ke GAMBAR (PNG siap tempel) — `.kartuskor snake`',
  limit: 0,
  cooldown: 8,
  run: async m => {
    const q = String(m.q || '').trim().toLowerCase()
    if (!q || q === 'list') {
      const games = daftarGame()
      return m.reply(
        `🖼 *EKSPORT SKOR KE GAMBAR*\n\nPilih gamenya: \`${P}kartuskor snake\`\n\n` +
        (games.length
          ? `Game berperingkat sekarang (${games.length}):\n` + games.slice(0, 14).map(g => `▸ ${g.icon} \`${g.id}\` — ${g.nama}`).join('\n')
          : 'Belum ada skor tercatat. Main dulu: ' + P + 'playground') +
        `\n\nKartu peringkat pribadi: \`${P}skorimg\``
      )
    }
    const info = infoGame(q)
    if (!info || info.nama === q) {
      const games = daftarGame()
      const cocok = games.find(g => g.nama.toLowerCase().includes(q) || g.id.includes(q))
      if (cocok) return m.reply(`🤔 Maksudnya \`${cocok.id}\` (${cocok.nama})? Kirim ulang: \`${P}kartuskor ${cocok.id}\``)
      return m.reply(`❌ Game \`${truncate(q, 20)}\` tidak dikenal. Lihat: \`${P}kartuskor list\``)
    }
    const rows = papan(q, 10)
    if (!rows.length) {
      return m.reply(`ℹ️ Belum ada skor di *${info.nama}*. Main dulu: \`${P}${q}\` lalu setor kan skor (${P}setorskore).`)
    }
    await m.react?.('🖼').catch(() => {})
    try {
      const kati = TEMA_KAT[info.kategori] || TEMA_KAT.LAIN
      const png = await kartuSkorPng({
        judul: `${info.icon} ${info.nama} — LEADERBOARD`,
        sub: `${config.bot.name} BOT · ${rows.length} teratas${info.kategori ? ' · ' + info.kategori : ''}`,
        baris: rows.map(r => ({
          teks: `${['🥇', '🥈', '🥉'][r.rank - 1] || r.rank + '.'}  ${r.nama.slice(0, 26)}`,
          nilai: ANGKA(r.skor),
          warna: r.rank === 1 ? null : undefined
        })),
        footer: `cek: ${P}lbgame · setor: ${P}setorskore <kode>`,
        tema: kati
      })
      await m.sock.sendMessage(m.jid, {
        image: png,
        caption: `🏆 *${info.nama}* — leaderboard ${rows.length} teratas\nJuara: *${rows[0].nama}* (${ANGKA(rows[0].skor)})`
      }, { quoted: m.raw })
      await m.react?.('✅').catch(() => {})
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply('⚠️ Gagal membuat kartu: ' + truncate(String(e?.message || e), 100))
    }
  }
}

/* ================================================================== */
/*  5. .skorimg — kartu peringkat PRIBADI (semua game)                 */
/* ================================================================== */
export const skorImg = {
  command: ['skorimg', 'kartuskorku', 'skorcard', 'myratingimg', 'skorcardku'],
  category: 'Games',
  description: '🪪 Kartu PNG peringkat milikmu di semua game yang kamu mainkan',
  limit: 0,
  cooldown: 8,
  run: async m => {
    const kunci = m.senderKey || m.sender
    const stats = statistikUser(kunci)
    if (!stats.length) {
      return m.reply(`🪪 Belum ada skor tercatat atas akunmu.\nMain dulu: \`${P}playground\` lalu setor skornya dengan \`${P}setorskore <kode>\`, atau main kasino RPG yang auto-setor.`)
    }
    await m.react?.('🪪').catch(() => {})
    const milik = (m.pushName || (getStats().users?.[kunci]?.commands ? '' : '') || 'Kamu').slice(0, 24)
    try {
      const baris = stats.slice(0, 8).map((s, i) => ({
        teks: `${s.icon} ${s.nama.slice(0, 22)} · #${s.rank || '-'}`,
        nilai: ANGKA(s.terbaik || s.main || 0) + (s.main ? ' pt' : ''),
        warna: i === 0 ? undefined : undefined
      }))
      const png = await kartuSkorPng({
        judul: `🪪 ${milik} — SCORECARD`,
        sub: `${stats.length} game dimainkan · ${config.bot.name} BOT`,
        baris,
        footer: `total main: ${ANGKA(stats.reduce((a, x) => a + (x.main || 0), 0))} ronde · terbaik: ${ANGKA(stats[0].terbaik || 0)} di ${stats[0].nama}`,
        tema: ['#a78bfa', '#38bdf8', '#818cf8']
      })
      await m.sock.sendMessage(m.jid, {
        image: png,
        caption: `🪪 *SCORECARD* @${(kunci).split('@')[0]} — ${stats.length} game\nMain lagi: ${P}playground · sembahkan rincian: ${P}skorku`,
        mentions: [kunci]
      }, { quoted: m.raw })
      await m.react?.('✅').catch(() => {})
    } catch (e) {
      await m.react?.('❌').catch(() => {})
      return m.reply('⚠️ Gagal membuat kartu: ' + truncate(String(e?.message || e), 100))
    }
  }
}

export default { statFitur, hitSaya, cmdMode, kartuskorCmd, skorImg }
