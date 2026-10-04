/**
 * 👤 USER MENU — profil, limit, claim, leaderboard, register, rules
 */
import { config } from '../config.js'
import {
  getUser,
  allUsers,
  saveNow,
  getSettings,
  setSetting,
  getStats
} from '../lib/database.js'
import { formatDuration } from '../lib/functions.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { expButuh, memberId } from '../lib/kartuuser.js'
import { kartuSkorPng } from '../lib/scorecard.js'
import { getRPG, expNeeded } from '../lib/rpg.js'
import { gelarLevel } from '../lib/kartulevel.js'
import { profilIosHtml } from '../lib/profileios.js'
import { kartuDaftarBaru } from '../lib/kartuanim.js'

/** susun data kartu member HTML (v7.7) */
function dataKartuMember (m, u, opts = {}) {
  return {
    nama: m.pushName || u.name || 'User',
    nomor: (m.sender || '').split('@')[0],
    umur: u.age,
    /* v7.29.0: satu sumber data = RPG (level/exp/uang) */
    level: getRPG(m.senderKey || m.sender).level || 1,
    exp: getRPG(m.senderKey || m.sender).exp || 0,
    butuh: expNeeded(getRPG(m.senderKey || m.sender).level || 1),
    gelar: gelarLevel(getRPG(m.senderKey || m.sender).level || 1),
    limit: u.limit,
    uang: getRPG(m.senderKey || m.sender).money || 0,
    status: m.isOwner ? 'OWNER' : u.premium ? 'PREMIUM' : u.registered ? 'MEMBER' : 'BELUM DAFTAR',
    premium: !!u.premium,
    premiumSisa: u.premium && u.premiumUntil ? `s/d ${new Date(u.premiumUntil).toLocaleDateString('id-ID')}` : '',
    terdaftar: !!u.registered,
    sejak: new Date(u.created || Date.now()).toLocaleDateString('id-ID'),
    bio: u.bio,
    jid: m.senderKey || m.sender,
    ...opts
  }
}

/**
 * Kirim kartu member PINTAR (v7.7.4 — wajib TIDAK KOSONG di semua client):
 *   1) HTML app interaktif (normal)
 *   2) PNG custom card dari lib/scorecard.js (fallback saat client tak bisa HTML app)
 *   3) teks pendamping tetap SELALU dikirim terpisah
 * Mengembalikan 'html' | 'png' | null
 */
export async function kirimKartuPintar (m, u, judul, opts = {}) {
  const data = dataKartuMember(m, u, opts)
  const brandNow = config.bot.name || 'THERYHANN!'

  /* 1) coba HTML app dulu */
  try {
    /* v7.29.0: profil biasa → kartu gaya iOS (animasi spring, Dynamic Island, badge status);
       kartu pendaftaran (baru) tetap memakai kartu member klasik */
    /* v7.31.0: pendaftaran → kartu baru "ID card tercetak + stempel VERIFIED" (lib/kartuanim.js) */
    const html = opts.baru ? kartuDaftarBaru(brandNow, { ...data, memberId: memberId(data.jid), tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }) : profilIosHtml(brandNow, { ...data, memberId: memberId(data.jid) })
    await sendHtmlApp(m.sock, m.jid, { title: judul, html })
    return 'html'
  } catch { /* lanjut ke PNG */ }

  /* 2) fallback PNG custom card */
  try {
    const prem = !!data.premium
    const tema = opts.baru ? ['#34d399', '#22d3ee', '#a3e635'] : prem ? ['#fde047', '#f59e0b', '#d97706'] : ['#38bdf8', '#a78bfa', '#818cf8']
    const rows = [
      { teks: 'Nama', nilai: data.nama },
      { teks: 'Nomor', nilai: '+62' + String(data.nomor || '').replace(/^[0-9]*/, '') },
      { teks: 'Level', nilai: `Lv.${data.level} · ${angka(data.exp)}/${angka(data.butuh)} EXP` },
      { teks: 'Limit', nilai: data.premium && !opts.limitAngka ? 'UNLIMITED' : angka(data.limit) },
      { teks: 'Uang', nilai: 'Rp' + angka(data.uang) },
      { teks: 'Umur', nilai: data.umur ? angka(data.umur) + ' tahun' : '-' },
      { teks: 'Member sejak', nilai: data.sejak || '-' },
      { teks: 'Status', nilai: (data.premium ? 'PREMIUM' : 'GRATIS') + (data.terdaftar ? ' · TERVERIFIKASI' : ' · BELUM VERIFIKASI') + (data.premiumSisa ? ' · ' + data.premiumSisa : '') },
      { teks: 'Member ID', nilai: memberId(data.jid) }
    ]
    if (data.bio) rows.splice(rows.length - 1, 0, { teks: 'Bio', nilai: String(data.bio).slice(0, 34) })
    const png = await kartuSkorPng({
      judul: `${prem ? '♛' : '👤'} ${data.nama || 'Member'} — ${opts.baru ? 'KARTU MEMBER BARU' : judul.includes('Emas') ? 'PREMIUM MEMBER' : 'MEMBER CARD'}`,
      sub: `${brandNow} BOT · kartu custom per-user`,
      baris: rows,
      footer: data.premium && data.premiumSisa ? `aktif sampai ${data.premiumSisa.replace('s/d ', '')}` : 'THERYHANN! BOT',
      tema
    })
    await m.sock.sendMessage(m.jid, {
      image: png,
      caption: `🪪 *${judul}* — versi PNG (menampung client yang tidak bisa memuat kartu HTML)`
    }, { quoted: m.raw })
    return 'png'
  } catch (e) {
    return null
  }
}

const angka = n => Math.max(0, Math.floor(n || 0)).toLocaleString('id-ID')

/** compat helper lama (dipakai test-kartuuser) */
async function kirimKartuMember (m, u, judul, opts = {}) {
  const via = await kirimKartuPintar(m, u, judul, opts)
  return via === 'html' || via === 'png'
}


export default {
  command: ['profile', 'me', 'cek', 'checklimit'],
  category: 'User Menu',
  description: 'Cek profil & limit kamu',
  limit: 0,
  run: async (m) => {
    const u = getUser(m.senderKey || m.sender)
    const stats = getStats()
    const text = `*👤 PROFIL KAMU*

▸ *Nama:* ${m.pushName || u.name || '-'}
▸ *Nomor:* ${m.sender.split('@')[0]}
▸ *Limit:* ${u.premium ? '♾️ Unlimited' : u.limit}
▸ *EXP:* ${u.exp || 0}
▸ *Premium:* ${u.premium ? '💎 Ya' : '❌ Tidak'}
▸ *Terdaftar:* ${u.registered ? `✅ (${u.name || '-'}, ${u.age || 0}th)` : '❌ Belum'}
▸ *Auto AI:* ${u.autoai ? '✅ ON' : '❌ OFF'}
▸ *Member sejak:* ${new Date(u.created || Date.now()).toLocaleDateString('id-ID')}`
    /* v7.7.4: custom card pintar — HTML app bila bisa, PNG custom bila tidak */
    const via = await kirimKartuPintar(m, u, '👤 Kartu Member')
    const catatan = via === 'html' ? text + '\n\n_🪪 Kartu member interaktifmu ada di pesan di atas ✨_'
      : via === 'png' ? text + '\n\n_🪪 Kartu member PNG-nya ada di pesan di atas ✨ (client-mu tidak memuat kartu HTML — ini versi siap-tempelnya)_'
      : text
    /* v7.31.0: tombol LIST → tiap pilihan membuka kartu HTML animasi berbeda dengan data user ini */
    const P = config.display.prefix
    return m.sendList({
      title: '👤 Profile', text: catatan, buttonText: '📊 Detail Profil',
      sections: [
        { title: 'KARTU DETAIL (HTML animasi)', rows: [
          { title: '💰 Money', description: `${(getRPG(m.senderKey || m.sender).money || 0).toLocaleString('id-ID')} koin · kartu dompet`, id: `${P}money` },
          { title: '✨ XP', description: `${getRPG(m.senderKey || m.sender).exp || 0} EXP · bar progres level`, id: `${P}xp` },
          { title: '🔋 Limit', description: `${u.premium ? 'unlimited' : u.limit} limit · kartu baterai`, id: `${P}limit` },
          { title: '🏅 Level', description: `Lv.${getRPG(m.senderKey || m.sender).level || 1} · ${gelarLevel(getRPG(m.senderKey || m.sender).level || 1)}`, id: `${P}level` }
        ] },
        { title: 'LAINNYA', rows: [
          { title: '🎁 Claim Limit', description: 'ambil limit harian', id: `${P}claim` },
          { title: '🏆 Leaderboard', description: 'hub papan peringkat', id: `${P}lbmenu` },
          { title: '🏠 Menu', description: 'kembali ke menu', id: `${P}menu` }
        ] }
      ]
    }).catch(() => m.sendButtons({ title: '👤 Profile', text: catatan, buttons: [{ text: '💰 Money', id: `${P}money` }, { text: '✨ XP', id: `${P}xp` }, { text: '🏅 Level', id: `${P}level` }] }).catch(() => m.reply(catatan)))
  }
}

export const claim = {
  command: ['claim', 'daily', 'klaim'],
  category: 'User Menu',
  description: 'Klaim limit harian (1x / 24 jam)',
  limit: 0,
  run: async (m) => {
    const u = getUser(m.senderKey || m.sender)
    const now = Date.now()
    const gap = now - (u.lastClaim || 0)
    if (gap < 1000 * 60 * 60 * 24) {
      return m.reply(`⏳ Kamu sudah claim hari ini.\nTunggu *${formatDuration(1000 * 60 * 60 * 24 - gap)}* lagi.`)
    }
    const bonus = u.premium ? 100 : 30
    u.limit = (u.limit || 0) + bonus
    u.lastClaim = now
    saveNow('users')
    return m.sendButtons({
      title: '🎁 Daily Claim',
      text: `✅ Claim berhasil!\n\n▸ +${bonus} limit\n▸ Total limit: *${u.limit}*\n\nKembali lagi 24 jam kedepan ya 🙌`,
      buttons: [{ text: '👤 Profile', id: '.profile' }, { text: '🏠 Menu', id: 'act:menu:main' }]
    }).catch(() => m.reply(`✅ +${bonus} limit. Total: ${u.limit}`))
  }
}

export const register = {
  command: ['daftar', 'reg', 'register'],
  category: 'User Menu',
  description: 'Daftar database bot (format: nama|umur)',
  limit: 0,
  run: async (m) => {
    const u = getUser(m.senderKey || m.sender)
    if (u.registered) return m.reply('✅ Kamu sudah terdaftar di database bot.')
    const [name, age] = (m.q || '').split('|')
    if (!name || !age) return m.reply(`Contoh: \`${config.display.prefix}daftar ${m.pushName || 'Nama'}|18\``)
    u.name = name.trim()
    u.age = parseInt(age) || 0
    u.registered = true
    u.limit = (u.limit || 0) + 10
    saveNow('users')
    /* v7.7.4: custom card perayaan — HTML app bila bisa, PNG custom bila tidak */
    const via = await kirimKartuPintar(m, u, '🎉 Member Baru', { baru: true, bonusLimit: 10, judulKartu: 'PENDAFTARAN BERHASIL' })
    const catatan = via === 'html' ? '\n\n_🎊 Kartu member barumu ada di pesan di atas — simpan baik-baik ✨_'
      : via === 'png' ? '\n\n_🪪 Kartu member PNG-nya ada di pesan di atas ✨ (client-mu tidak memuat kartu HTML — ini versi siap-tempelnya)_'
      : ''
    return m.sendButtons({
      title: '📝 Registrasi Berhasil',
      text: `*✅ TERDAFTAR*\n\n▸ Nama: ${u.name}\n▸ Umur: ${u.age}\n▸ Nomor: ${m.sender.split('@')[0]}\n▸ Bonus: +10 limit\n\nTerima kasih sudah mendaftar di *${config.bot.name}* 🎉${catatan}`,
      buttons: [{ text: '👤 Profile', id: '.profile' }, { text: '🏠 Menu', id: 'act:menu:main' }]
    })
  }
}

export const leaderboard = {
  command: ['leaderboard', 'lb', 'rank'],
  category: 'User Menu',
  description: 'Papan peringkat user',
  limit: 0,
  run: async (m) => {
    const users = allUsers().sort((a, b) => (b.exp || 0) - (a.exp || 0))
    if (!users.length) return m.reply('Belum ada data user.')
    const me = users.findIndex(u => u.jid === m.sender) + 1
    const top = users
      .slice(0, 10)
      .map((u, i) => `${i + 1}. @${u.jid.split('@')[0]} — ${u.exp || 0} EXP${u.premium ? ' 💎' : ''}`)
      .join('\n')
    const text = `*🏆 LEADERBOARD*\n\n${top}\n\n*Peringkat kamu:* #${me || '-'} dari ${users.length} user`
    return m.sendButtons({
      title: '🏆 Leaderboard',
      text,
      buttons: [{ text: '👤 Profile', id: '.profile' }, { text: '🎁 Claim', id: '.claim' }]
    }).catch(() => m.reply(text))
  }
}

export const toggleAI = {
  command: ['autoai', 'toggleai', 'aichat'],
  category: 'AI Menu',
  description: 'Nyalakan/matikan AI auto reply di chat ini',
  limit: 0,
  run: async (m) => {
    if (m.isGroup) {
      return m.reply(`ℹ️ Di grup, pakai \`${config.display.prefix}setgrup autoai\` (khusus admin).`)
    }
    const u = getUser(m.senderKey || m.sender)
    u.autoai = !u.autoai
    saveNow('users')
    return m.sendButtons({
      title: '🤖 Auto AI Chat',
      text: u.autoai
        ? '✅ *AUTO AI AKTIF*\n\nSekarang semua pesan kamu (tanpa prefix) akan dijawab AI.\nMatikan lagi dengan `.autoai`.'
        : '🚫 *AUTO AI NONAKTIF*\n\nBot hanya menjawab kalau pakai prefix `' + config.display.prefix + '` atau command `.ai`.',
      buttons: [
        { text: '🤖 AI Menu', id: 'act:menu:ai' },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    })
  }
}

export const setBotGlobal = {
  command: ['public', 'self'],
  category: 'Owner Menu',
  description: 'Ganti mode bot public / self',
  owner: true,
  limit: 0,
  run: async (m) => {
    const mode = m.command === 'public'
    setSetting('public', mode)
    return m.reply(mode ? '🌐 Mode *PUBLIC* — semua orang bisa pakai bot.' : '🔒 Mode *SELF* — hanya owner yang bisa pakai bot.')
  }
}
