/**
 * 👑 PREMIUM HUB v7.7 — menu & fitur eksklusif premium
 * ------------------------------------------------------------------
 *  Melengkapi ekosistem premium yang sudah ada (addprem/delprem,
 *  premlist, premcek, hargapremium, belipremium, kodepromo):
 *
 *   • .premmenu        — hub premium: status + benefit + semua
 *                        perintah premium dalam satu list interaktif
 *   • .premclaim       — klaim harian JUMBO khusus premium (premium)
 *   • .transferlimit   — (ditingkatkan di userlab.js) premium-only + fee 10%
 *   • .premcard        — kartu member EMAS (HTML app) (premium)
 *
 *  Premium sendiri diaktifkan owner: .addprem <nomor> [hari]
 *  (tanpa hari = permanen). Kedaluwarsa otomatis ditangani handler.
 */
import { config } from '../config.js'
import { getUser, saveNow } from '../lib/database.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kartuMemberHtml, expButuh } from '../lib/kartuuser.js'
import { truncate, formatDuration } from '../lib/functions.js'

const P = config.display.prefix
const HARI_MS = 24 * 3600 * 1000

/** status premium + sisa waktu (teks) */
const statusPrem = u => {
  if (!u?.premium) return { aktif: false, teks: '❌ bukan premium' }
  if (!u.premiumUntil) return { aktif: true, teks: '👑 PREMIUM permanen' }
  const sisa = u.premiumUntil - Date.now()
  if (sisa <= 0) return { aktif: false, teks: '⌛ premium kedaluwarsa' }
  return { aktif: true, teks: `👑 PREMIUM aktif — sisa *${formatDuration(sisa)}* (sampai ${new Date(u.premiumUntil).toLocaleDateString('id-ID')})` }
}

const BENEFIT =
  '▸ ♾️ Semua fitur *tanpa potong limit*\n' +
  '▸ 🎁 `.premclaim` harian jumbo (+150 limit, +100.000 uang, +250 EXP)\n' +
  '▸ 💸 `.transferlimit` kirim limit ke teman\n' +
  '▸ 🪪 `.premcard` kartu member emas eksklusif\n' +
  '▸ 🎁 `.claim` harian 100 limit (gratis cuma 30)\n' +
  '▸ 💎 Badge premium di profil, kartu & leaderboard\n' +
  '▸ 🔓 Akses semua perintah bertanda premium'

/* ================================================================== */
/*  1. .premmenu — hub premium                                         */
/* ================================================================== */
export const premiumMenu = {
  command: ['premmenu', 'menupremium', 'menuprem', 'premiumhub', 'premhub', 'premiummenu'],
  category: 'Premium',
  description: '👑 Menu premium: status, benefit & semua fitur eksklusif premium',
  limit: 0,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const st = statusPrem(u)
    const teks =
      `👑 *PREMIUM HUB — ${config.bot.name}*\n\n` +
      `Status kamu: ${st.teks}\n\n` +
      `*Benefit premium:*\n${BENEFIT}\n\n` +
      (st.aktif
        ? `Cek detail: \`${P}premcek\` · kartu emas: \`${P}premcard\``
        : `Mau jadi premium?\n▸ Paket & harga: \`${P}hargapremium\`\n▸ Ajukan: \`${P}belipremium 30 hari\`\n▸ Punya kode promo: \`${P}kodepromo <kode>\``)

    const rows = [
      { title: '🎁 Klaim Harian (premium)', description: '+150 limit · +100rb uang · +250 EXP (buff ×2 aktif tombol)', id: `${P}premclaim` },
      { title: '🗓 Klaim Mingguan', description: 'JATLIM: +1.000 limit · +500rb · +2.500 EXP', id: `${P}premminggu` },
      { title: '🗓 Klaim Bulanan Elit', description: 'JUMBO: +3.000 limit · +2jt · +10.000 EXP', id: `${P}prembulanan` },
      { title: '🎁 Hadiah Kejutan STD', description: 'roll harian: limit · uang · EXP', id: `${P}premhadian` },
      { title: '🪪 Kartu Member Emas', description: 'Kartu identitas premium (HTML app)', id: `${P}premcard` },
      { title: '💸 Transfer Limit (fee 10%)', description: 'Kirim limit ke user lain ba tohawa', id: `${P}transferlimit` },
      { title: '💸 Transfer TANPA Fee', description: 'premium perk — kirim utuh utuh', id: `${P}premtransfer` },
      { title: '⚡ Buff Harian ×2', description: 'aktifkan buff premclaim 24 jam', id: `${P}prembuff` },
      { title: '♛ Badge VIP', description: 'klaim badge VIP hidup permanen + lihat .listvip', id: `${P}premvip` },
      { title: '✏️ Font Nama (profil)', description: 'font fancy sendiri di kartu member, 34 gaya', id: `${P}premfont` },
      { title: '🎨 Style Aksen Kartu', description: 'warna aksen kartu member milikmu saja', id: `${P}premstyle` },
      { title: '🏆 Top Member Premium', description: 'setter EXP+uangg premium dari pool premium', id: `${P}premtop` },
      { title: '🔍 Cek Status Premium', description: 'Status & tanggal kedaluwarsa', id: `${P}premcek` },
      { title: '💎 Daftar Paket & Harga', description: '7/30/90 hari · permanen', id: `${P}hargapremium` },
      { title: '🎟️ Tukar Kode Promo', description: 'Aktifkan premium/limit dari kode', id: `${P}kodepromo` },
      { title: '👤 Profil Saya (Kartu)', description: 'Kartu member interaktif', id: `${P}profile` },
      { title: '🎁 Claim Harian Biasa', description: st.aktif ? '100 limit (premium)' : '30 limit', id: `${P}claim` }
    ]
    try {
      return await m.sendList({
        title: '👑 PREMIUM',
        text: teks,
        footer: config.bot.footer,
        buttonText: '👑 Fitur Premium',
        sections: [{ title: st.aktif ? 'Fitur premium kamu' : 'Premium & cara mendapatkannya', rows }]
      })
    } catch {
      return m.reply(teks)
    }
  }
}

/* ================================================================== */
/*  2. .premclaim — klaim harian jumbo (premium only)                  */
/* ================================================================== */
export const premClaim = {
  command: ['premclaim', 'claimpremium', 'premdaily', 'klaimpremium', 'premharian'],
  category: 'Premium',
  description: '🎁 Klaim harian JUMBO khusus premium: +150 limit, +100.000 uang, +250 EXP',
  premium: true,
  limit: 0,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const now = Date.now()
    const gap = now - (u.premLastClaim || 0)
    if (gap < HARI_MS) {
      return m.reply(`⏳ Klaim premium harianmu sudah dipakai.\nTunggu *${formatDuration(HARI_MS - gap)}* lagi.`)
    }
    u.premLastClaim = now
    const buff = !!(u.premBuffUntil && u.premBuffUntil > now)
    const kali = buff ? 2 : 1
    u.limit = (u.limit || 0) + 150 * kali
    u.money = (u.money || 0) + 100000 * kali
    u.exp = (u.exp || 0) + 250 * kali
    saveNow('users')
    const st = statusPrem(u)
    return m.sendButtons({
      title: '🎁 PREMIUM DAILY',
      text:
        `✅ *KLAIM PREMIUM BERHASIL!*\n\n` +
        `▸ +${150 * kali} limit → total *${(u.limit || 0).toLocaleString('id-ID')}* (buff x${kali})\n` +
        `▸ +${(100000 * kali).toLocaleString('id-ID')} uang → total *Rp${(u.money || 0).toLocaleString('id-ID')}* (buff x${kali})\n` +
        `▸ +${250 * kali} EXP → total *${(u.exp || 0).toLocaleString('id-ID')}* (buff x${kali})\n\n` +
        `Status: ${st.teks}\nKembali lagi besok ya 👑`,
      footer: config.bot.footer,
      buttons: [
        { text: '🪪 Kartu Emas', id: `${P}premcard` },
        { text: '👑 Premium Hub', id: `${P}premmenu` }
      ]
    }).catch(() => m.reply('✅ Klaim premium berhasil: +150 limit, +100.000 uang, +250 EXP.'))
  }
}

/* ================================================================== */
/*  3. .premcard — kartu member emas (premium only)                    */
/* ================================================================== */
export const premCard = {
  command: ['premcard', 'kartupremium', 'premiumcard', 'goldcard', 'kartuemas', 'kartugold'],
  category: 'Premium',
  description: '🪪 Kartu member EMAS eksklusif premium (HTML app interaktif)',
  premium: true,
  limit: 0,
  cooldown: 5,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const st = statusPrem(u)
    const html = kartuMemberHtml(config.bot.name || 'THERYHANN!', {
      nama: m.pushName || u.name || 'Premium User',
      nomor: m.sender.split('@')[0],
      umur: u.age, level: u.level || 1, exp: u.exp || 0,
      butuh: expButuh(u.level || 1, config),
      limit: u.limit, uang: u.money ?? u.exp ?? 0,
      premium: true, premiumSisa: u.premiumUntil ? `⏳ s/d ${new Date(u.premiumUntil).toLocaleDateString('id-ID')}` : '',
      terdaftar: !!u.registered,
      sejak: new Date(u.created || Date.now()).toLocaleDateString('id-ID'),
      bio: u.bio, jid: m.senderKey || m.sender
    })
    try {
      await sendHtmlApp(m.sock, m.jid, { title: '👑 Premium Member Card', html })
    } catch (e) {
      return m.reply(`⚠️ Kartu emas tidak bisa dimuat di WhatsApp-mu (${truncate(String(e?.message || e), 80)}).\n\nStatus: ${st.teks}`)
    }
    return m.reply(
      `🪪 *KARTU MEMBER EMAS* — ${st.teks}\n\n` +
      `Tunjukkan kartunya ke temanmu ✨ · klaim harian: \`${P}premclaim\``
    )
  }
}

export default { premiumMenu, premClaim, premCard }
