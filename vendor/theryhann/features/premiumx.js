/**
 * 👑 PREMIUM X (v7.8.0) — paket perks premium diperbanyak
 * ------------------------------------------------------------------
 *  Perintah-perintah TAMBAHAN khusus user premium (flag `premium:true`
 *  ditegakkan handler). Melengkapi premclaim/premcard/premmenu/transferlimit
 *  yang sudah ada di features/premium.js:
 *
 *   1. .premminggu   — klaim MINGGUAN jumbo (limit/uang/EXP jauh lebih besar)
 *   2. .prembulanan  — klaim BULANAN elit (parsel terbatas, tetap < inflasi)
 *   3. .prembuff     — aktifkan buff 24 jam (klaim harian premium ×2)
 *   4. .premtransfer — transfer limit TANPA fee (gratis) — speed premium
 *   5. .premvip      — klaim badge VIP ♛ + .listvip peringkat harga VIP
 *   6. .premfont     — pasang font fancy untuk nama profil sendiri (kartu)
 *   7. .premstyle    — ganti warna aksen kartu member sendiri
 *   8. .premtop      — leaderboard khusus member premium
 *   9. .premhadian   — hadiah kejutan harian premium (roll hadiah aman)
 */
import { config } from '../config.js'
import { getUser, saveNow, allUsers } from '../lib/database.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { kartuMemberHtml, expButuh } from '../lib/kartuuser.js'
import { gayaNama, gayaTertentu } from '../lib/fancyfont.js'
import { formatDuration, truncate } from '../lib/functions.js'
import { aliasesOf, sameIdentity, canonKey } from '../lib/identity.js'

const P = config.display.prefix
const HARI = 86400000

const premStatus = u => {
  if (!u?.premium) return '❌ bukan premium'
  if (!u.premiumUntil) return '👑 permanen'
  const sisa = u.premiumUntil - Date.now()
  return sisa > 0 ? `👑 sisa ${formatDuration(sisa)}` : '⌛ lewat tempo'
}

/* ================================================================== */
/*  1. klaim MINGGUAN (7 hari) jumbo                                   */
/* ================================================================== */
export const premMinggu = {
  command: ['premminggu', 'premweekly', 'klaimpremium mingguan'.replace(/\s+/g, ''), 'premweek', 'weeklyprem'],
  category: 'Premium',
  description: '🗓 Klaim MINGGUAN jumbo khusus premium: +1.000 limit · +500.000 uang · +2.500 EXP',
  premium: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const gap = Date.now() - (u.premLastWeek || 0)
    if (gap < 7 * HARI) {
      return m.reply(`⏳ Klaim mingguanmu berikutnya dalam *${formatDuration(7 * HARI - gap)}*.\n\rDalam waktu bersamaan tetap ambil harian: \`${P}premharian\` itu harian mu.`).catch(() => {})
    }
    u.premLastWeek = Date.now()
    u.limit = (u.limit || 0) + 1000
    u.money = (u.money || 0) + 500000
    u.exp = (u.exp || 0) + 2500
    saveNow('users')
    return m.sendButtons({
      title: '🗓 PREMIUM MINGGUAN',
      text:
        `✅ *KLAIM MINGGUAN BERHASIL!*\n\n` +
        `▸ +1.000 limit → total *${(u.limit || 0).toLocaleString('id-ID')}*\n` +
        `▸ +500.000 uang → total *Rp${(u.money || 0).toLocaleString('id-ID')}*\n` +
        `▸ +2.500 EXP → total *${(u.exp || 0).toLocaleString('id-ID')}*\n\n` +
        `Status: ${premStatus(u)}\nAmbil lagi minggu depan ✨\nBonus harian: \`${P}premclaim\``,
      footer: config.bot.footer,
      buttons: [{ text: '🪪 Kartu Emas', id: `${P}premcard` }, { text: '👑 Hub Premium', id: `${P}premmenu` }]
    }).catch(() => m.reply('✅ Klaim mingguan OK: +1.000 limit, +500rb uang, +2.500 EXP.'))
  }
}

/* ================================================================== */
/*  2. klaim BULANAN elit (30 hari)                                    */
/* ================================================================== */
export const premBulanan = {
  command: ['prembulanan', 'premmonthly', 'premmonth', 'monthlyprem', 'premmonthcl'],
  category: 'Premium',
  description: '🗓 Klaim BULANAN elit premium: +3.000 limit · +2.000.000 uang · +10.000 EXP',
  premium: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const gap = Date.now() - (u.premLastMonth || 0)
    if (gap < 30 * HARI) {
      return m.reply(`⏳ Klaim bulananmu berikutnya dalam *${formatDuration(30 * HARI - gap)}*.`)
    }
    u.premLastMonth = Date.now()
    u.limit = (u.limit || 0) + 3000
    u.money = (u.money || 0) + 2000000
    u.exp = (u.exp || 0) + 10000
    saveNow('users')
    return m.reply(
      `🤩 *KLAIM BULANAN MENGALA SURGE!*\n\n` +
      `▸ +3.000 limit → total *${(u.limit || 0).toLocaleString('id-ID')}*\n` +
      `▸ +2.000.000 uang → total *Rp${(u.money || 0).toLocaleString('id-ID')}*\n` +
      `▸ +10.000 EXP → total *${(u.exp || 0).toLocaleString('id-ID')}*\n\n` +
      `Terima kasih menjadi member premium setia 👑`
    )
  }
}

/* ================================================================== */
/*  3. buff harian premium ×2 (24 jam)                                  */
/* ================================================================== */
export const premBuff = {
  command: ['prembuff', 'buffprem', 'premx2', 'prem2x', 'buffharian'],
  category: 'Premium',
  description: '⚡ Buff 24 jam: klaim harian premium dibayar ×2 — `.prembuff on/off`',
  premium: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const opsi = String(m.q || '').trim().toLowerCase()
    if (!opsi) {
      const am = u.premBuffUntil && u.premBuffUntil > Date.now()
      return m.reply(
        `⚡ *PREMIUM BUFF*\n\nStatus saat ini: *${am ? 'AKTIF ×2 (' + formatDuration(u.premBuffUntil - Date.now()) + ' tersisa)' : 'NONAKTIF'}*\n\n` +
        `Saat aktif: \`${P}premclaim\` harian membayar ×2.\n• biaya: 500 limit sekali pakai/aktivasi\n\nPakai: \`${P}prembuff on\` · matikan: \`${P}prembuff off\``
      )
    }
    if (/on|aktif|nyala|true|1/.test(opsi)) {
      const BIAYA = 500
      if ((u.limit || 0) < BIAYA) return m.reply(`❌ Limit kurang. Aktivasi buff butuh *${BIAYA}* limit, kamu punya *${u.limit || 0}*. Isi: ${P}premharian`)
      u.limit -= BIAYA
      u.premBuffUntil = Date.now() + HARI
      saveNow('users')
      return m.reply(`⚡ *BUFF ×2 AKTIF 24 JAM!* (-${BIAYA} limit)\n\nSelama buff: \`${P}premclaim\` dibayar ×2 sebagai extra premium.`)
    }
    if (/off|mati|false|0/.test(opsi)) {
      u.premBuffUntil = null
      saveNow('users')
      return m.reply('Buff dinonaktifkan (biaya tidak dikembalikan).')
    }
    return m.reply('Pakai: `' + P + 'prembuff on|off`')
  }
}

/* ================================================================== */
/*  4. .premtransfer — transfer limit TANPA fee                         */
/* ================================================================== */
export const premTransfree = {
  command: ['premtransfer', 'premtflimit', 'premtf', 'transfree', 'tflimitpremium'],
  category: 'Premium',
  description: '💸 Transfer limit ke teman TANPA fee (premium) — `.premtransfer @user 100`',
  premium: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const dari = m.userDB || getUser(m.senderKey || m.sender)
    const args = m.args.map(a => String(a))
    const nomor = args.map(a => a.replace(/[^0-9]/g, '')).filter(a => a.length >= 9 && a.length <= 15)
    const jumlahKecil = args.map(a => parseInt(a, 10)).filter(n => Number.isFinite(n) && n > 0 && n < 1000000)
    const tujuanMentah = m.mentioned?.[0] || m.quoted?.sender || (nomor.length ? nomor[0] + '@s.whatsapp.net' : null)
    const jumlah = jumlahKecil.find(n => !nomor.includes(String(n))) ?? jumlahKecil[0]

    if (!tujuanMentah || !jumlah) {
      return m.reply(
        `💸 *PREMIUM TRANSFER — TANPA FEE*\n\n` +
        `• \`${P}premtransfer @user 100\` — kirim 100 limit, tanpa fee sama sekali\n` +
        `• minimal 5 limit per kiriman\n\n` +
        `Limit kamu: *${(dari.limit || 0).toLocaleString('id-ID')}*`
      )
    }
    if (jumlah < 5) return m.reply('❌ Minimal transfer 5 limit.')
    const kandidat = [tujuanMentah, ...aliasesOf(tujuanMentah)]
    if (kandidat.some(k => sameIdentity(k, m.sender) || sameIdentity(k, m.senderKey))) {
      return m.reply('❌ Tidak bisa transfer ke diri sendiri.')
    }
    if (kandidat.some(k => sameIdentity(k, m.user))) return m.reply('❌ Bot tidak butuh limit, abang 😄')
    if ((dari.limit || 0) < jumlah) {
      return m.reply(`❌ Limit kurang. Butuh *${jumlah}*, kamu punya *${dari.limit || 0}*.\nIsi: ${P}premharian`)
    }
    const ke = getUser(canonKey(tujuanMentah, aliasesOf(tujuanMentah)) || tujuanMentah)
    dari.limit -= jumlah
    ke.limit = (ke.limit || 0) + jumlah
    saveNow('users')
    return m.reply(
      `💸 *TRANSFER BERHASIL (premium — fee 0 silmka juta;)jumlah) jumlah:***\n\n` +
      `▸ Ke: @${tujuanMentah.split('@')[0]}\n` +
      `▸ Jumlah: *${jumlah}* limit — UTUH tanpa fee\n` +
      `▸ Sisa kamu: *${(dari.limit || 0).toLocaleString('id-ID')}* · dia: *${(ke.limit || 0).toLocaleString('id-ID')}*`,
      { mentions: [tujuanMentah] }
    )
  }
}

/* ================================================================== */
/*  5. badge VIP (harga hidup)                                          */
/* ================================================================== */
export const premVip = {
  command: ['premvip', 'vipclaim', 'jadiVIP', 'prembadge', 'badgevip'],
  category: 'Premium',
  description: '♛ Klaim badge VIP (harga hidup) namamu ada di leaderboard VIP premium',
  premium: true,
  limit: 0,
  cooldown: 6,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    if (u.premVip) {
      return m.reply(`♛ Kamu sudah pemegang badge VIP. Lihat peringkat: \`${P}listvip\``)
    }
    const BIAYA_UANG = 200000
    if ((u.money || 0) < BIAYA_UANG) return m.reply(`🗒 Uang kamu belum cukup (badge butuh dana *Rp${BIAYA_UANG.toLocaleString('id-ID')}*).\n\nKlaim dulu untuk menambah: ${P}premharian (harian) · ${P}premminggu (mingguan jumbo) · ${P}prembulanan (bulanan elit)`)
    u.money -= BIAYA_UANG
    u.premVip = Date.now()
    saveNow('users')
    return m.sendButtons({
      title: '♛ VIP UNLOCK',
      text: `🎉 *SELAMAT KAKAK — BADGE VIP RESMI KAMU PEGANG!*\n\n` +
        `▸ Bayar: -Rp200.000 → sisa *Rp${(u.money || 0).toLocaleString('id-ID')}*\n` +
        `▸ Badge: ♛ VIP aktif permanen\n\n` +
        `Tier elit yang punya: namamu ikut leaderboard VIP · profile/kartu bertema VIP.`,
      footer: config.bot.footer,
      buttons: [{ text: '📜 Leaderboard VIP', id: `${P}listvip` }, { text: '🪪 Kartu Emas', id: `${P}premcard` }]
    }).catch(() => m.reply('🎉 Badge VIP aktif!'))
  }
}

export const listVip = {
  command: ['listvip', 'vipboard', 'vipleaderboard', 'premviplist'],
  category: 'Premium',
  description: '📜 Leaderboard member VIP premium (uang+exp bagi semua premVip)',
  premium: true,
  limit: 0,
  run: m => {
    const vip = allUsers().filter(u => u.premVip)
      .sort((a, b) => ((b.exp || 0) + (b.money || 0)) - ((a.exp || 0) + (a.money || 0)))
      .slice(0, 15)
    if (!vip.length) return m.reply('Belum ada member VIP lain 🙋 klaim dulu: ' + P + 'premvip')
    return m.reply(
      `📜 *LEADERBOARD VIP* (${vip.length})\n\n` +
      vip.map((u, i) => `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} @${u.jid.split('@')[0]} · ${((u.exp || 0) + (u.money || 0)).toLocaleString('id-ID')} pt`).join('\n')
    )
  }
}

/* ================================================================== */
/*  6. font premium untuk nama profil (kartu member)                    */
/* ================================================================== */
export const premFont = {
  command: ['premfont', 'fontprem', 'premnamafont', 'premnick', 'fontnamaprem'],
  category: 'Premium',
  description: '✏️ Pasang font fancy untuk nama sendiri di kartu member — `.premfont gotik` · list: `.premfont list`',
  premium: true,
  limit: 0,
  cooldown: 3,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const q = String(m.q || '').trim()
    if (!q || /^list$/i.test(q)) {
      const gaya = gayaNama('Nama', 34)
      return m.reply(
        `✏️ *PREMIUM FONT — nama kamu di kartu member*\n\n` +
        `Sekarang: *${u.premFont ? u.premFont : 'standar (tanpa font)'}*\n\n` +
        `Pilihan gaya (tokokggu font premium-friendly):\n` +
        gaya.slice(0, 12).map((g, i) => `${i + 1}. ${g.nama} — ${g.teks}`).join('\n') +
        `\n\nPasang: \`${P}premfont gotik\` — sentuhannya terlihat di kartu member/premium-card.\n` +
        `hapus: \`${P}premfont reset\``
      )
    }
    if (/reset|hapus|default/i.test(q)) {
      u.premFont = null
      saveNow('users')
      return m.reply('✅ Font profil direset ke standar.')
    }
    const gaya = gayaTertentu('Nama', q)
    if (!gaya) return m.reply('❌ Gaya tidak dikenal. Lihat daftar: ' + P + 'premfont list')
    u.premFont = q
    saveNow('users')
    return m.reply(`✏️ Font profil diubah jadi *${q}*.\nContoh tampilan: ${gayaNama(m.pushName || m.userDB?.name || 'Nama', 4)[0]?.teks || gayaNama('Nama', 4)[0].teks}\n\nLihat di kartu member: ${P}profile`)
  }
}

/* ================================================================== */
/*  7. style/aksen kartu member sendiri                                 */
/* ================================================================== */
const STYLE_PREM = {
  matahari: ['#fde047', '#f59e0b'],
  laut: ['#38bdf8', '#22d3ee'],
  hutan: ['#4ade80', '#a3e635'],
  senja: ['#fb923c', '#f43f5e'],
  ungu: ['#a78bfa', '#818cf8'],
  emas: ['#facc15', '#eab308']
}
export const premStyle = {
  command: ['premstyle', 'styleprem', 'premcardstyle', 'premwarna', 'premtheme'],
  category: 'Premium',
  description: '🎨 Ubah warna aksen kartu membermu (per per pengguna) — `.premstyle laut` · daftar warna: `.premstyle list`',
  premium: true,
  limit: 0,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const q = String(m.q || '').trim().toLowerCase()
    const daftar = Object.keys(STYLE_PREM)
    if (!q || /^list$/.test(q)) {
      return m.reply(
        `🎨 *PREMIUM STYLE — aksen kartu member*\n\n` +
        `Aksen kamu sekarang: *${u.premStyle || '(default emas/standar)'}*\n\n` +
        `Pilihan aksen:\n` +
        daftar.map((k, i) => `${i + 1}. ${k} — ${STYLE_PREM[k].map(x => '▪' + x).join(' ')}`).join('\n') +
        `\n\nPasang: \`${P}premstyle ungu\` · defaultkan kembali: \`${P}premstyle reset\``
      )
    }
    if (/reset|default|normal/.test(q)) {
      u.premStyle = null
      saveNow('users')
      return m.reply('✅ Style kartu direset.')
    }
    if (!STYLE_PREM[q]) return m.reply('❌ Nama aksen tidak dikenal: ' + P + 'premstyle list')
    u.premStyle = q
    saveNow('users')
    return m.reply(`🎨 Aksen kartu member kamu jadi *${q}* (${STYLE_PREM[q].join(' · ')})\nLihat hasilnya: ${P}premcard`)
  }
}

/* ================================================================== */
/*  8. leaderboard khusus member premium                                */
/* ================================================================== */
export const premTop = {
  command: ['premtop', 'premleaderboard', 'lbprem', 'topprem', 'premtop3anggap'],
  category: 'Premium',
  description: '🏆 Top 50 member premium teraktif (EXP + uang, premium-gated)',
  premium: true,
  limit: 0,
  cooldown: 3,
  run: m => {
    const top = allUsers().filter(u => u.premium)
      .sort((a, b) => ((b.exp || 0) + (b.money || 0)) - ((a.exp || 0) + (a.money || 0)))
      .slice(0, 15)
    if (!top.length) return m.reply('Belum ada member premium terdata (cek ).premlist: ' + P + 'premlist')
    return m.reply(
      `🏆 *TOP ${top.length} MEMBER PREMIUM*\n\n` +
      top.map((u, i) => {
        const jaw = ((u.exp || 0) + (u.money || 0)).toLocaleString('id-ID')
        return `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} @${u.jid.split('@')[0]} · ${jaw} pt${u.premVip ? ' ♛VIP' : ''}`
      }).join('\n')
    )
  }
}

/* ================================================================== */
/*  9. hadiah kejutan harian premium                                    */
/* ================================================================== */
export const premHadian = {
  command: ['premhadian', 'premjutan', 'premsurprise', 'premgift', 'premkecil'],
  category: 'Premium',
  description: '🎁 Hadiah kejutan harian khusus member premium (roll dengan hadiah terbatas, ekonomi tetap Aman)',
  premium: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const u = m.userDB || getUser(m.senderKey || m.sender)
    const gap = Date.now() - (u.premLastHadian || 0)
    if (gap < HARI) return m.reply(`⏳ Hadiah berikutnya dalam *${formatDuration(HARI - gap)}*.`)
    const hadiah = [
      ['+250 limit', () => { u.limit = (u.limit || 0) + 250 }],
      ['+500 limit', () => { u.limit = (u.limit || 0) + 500 }],
      ['+100.000 uang', () => { u.money = (u.money || 0) + 100000 }],
      ['+250.000 uang', () => { u.money = (u.money || 0) + 250000 }],
      ['+500 EXP', () => { u.exp = (u.exp || 0) + 500 }],
      ['+2.000 EXP', () => { u.exp = (u.exp || 0) + 2000 }],
      ['+1.000 limit', () => { u.limit = (u.limit || 0) + 1000 }]
    ]
    const pilih = hadiah[Math.floor(Math.random() * hadiah.length)]
    const label = pilih[0], efek = pilih[1]
    u.premLastHadian = Date.now()
    efek()
    saveNow('users')
    return m.sendButtons({
      title: '🎁 HADIAH PREMIUM',
      text: `🎉 *KAMU MENDAPATKAN: ${label}!*\n\nStatus: ${premStatus(u)}\nKembali besok untuk roll hadiah harian berikutnya ✨`,
      footer: config.bot.footer,
      buttons: [{ text: '🪪 Kartu Emas', id: `${P}premcard` }, { text: '👑 Hub Premium', id: `${P}premmenu` }]
    }).catch(() => m.reply('🎁 Hadiah premium: ' + label))
  }
}

export default { premMinggu, premBulanan, premBuff, premTransfree, premVip, listVip, premFont, premStyle, premTop, premHadian, STYLE_PREM }
