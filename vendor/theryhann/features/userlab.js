/**
 * 👤 USERLAB — 50 fitur menu user/personal (kategori User Menu, v6)
 * ----------------------------------------------------------------
 *  Profil & identitas, kartu profil/level bergambar,
 *  limit & ekonomi (klaim mingguan/bulanan, tukar EXP, transfer),
 *  statistik pemakaian per user (riwayat, top command, ranking),
 *  AI personal (auto-reply, gaya bahasa, memori),
 *  pengingat & catatan pribadi (reminder, notes, bookmark link),
 *  premium (info, beli, kode promo) serta laporan/banding.
 *
 *  Data per-user disimpan di database/users.json (getUser) dan
 *  data tambahan (reminder/catatan/link/gaya AI) di database/userdata.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { truncate, formatDuration, formatSize } from '../lib/functions.js'
import {
  loadDB, saveDB, getUser, allUsers, getUserStats, getStats, saveNow
} from '../lib/database.js'
import { findPlugin, plugins as pluginMap } from '../lib/plugins.js'

const P = config.display.prefix
const OWNER_JID = config.owner.number + '@s.whatsapp.net'

/* ------------------------- helper ------------------------- */
const user = (command, aliases, description, run, contoh = '', opt = {}) => ({
  command: [command, ...aliases],
  category: 'User Menu',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 220)}`) }
  }
})
/** data tambahan per user (reminder/catatan/link/preferensi) */
function dataku (jid) {
  const db = loadDB('userdata', {})
  if (!db[jid]) db[jid] = { pengingat: [], catatan: [], link: [], gayaAI: '', bahasaAI: '', bio: '', lastLimit: 0 }
  for (const k of ['pengingat', 'catatan', 'link']) if (!Array.isArray(db[jid][k])) db[jid][k] = []
  return { db, me: db[jid] }
}
const simpan = () => saveDB('userdata')
const keOwner = async (m, judul, isi) => {
  try {
    await m.sock.sendMessage(OWNER_JID, {
      text: `${judul}\nDari: @${m.sender.split('@')[0]}\nNama: ${m.pushName || '-'}\nChat: ${m.isGroup ? m.groupName : 'Private'}\n\n${isi}`,
      mentions: [m.sender]
    })
    return true
  } catch { return false }
}
const targetJid = m => {
  const q = String(m.args[0] || '').replace(/\D/g, '')
  if (q.length >= 9) return q + '@s.whatsapp.net'
  if (m.mentionJid?.length) return m.mentionJid[0]
  return null
}
const bar = (now, max, len = 10) => {
  const n = Math.max(0, Math.min(len, Math.round((now / (max || 1)) * len)))
  return '▓'.repeat(n) + '░'.repeat(len - n)
}
const expButuh = level => config.leveling?.expPerLevel ? config.leveling.expPerLevel(level) : level * level * 100 + 100

/* ================================================================== */
/*  A. PROFIL & IDENTITAS (10)                                         */
/* ================================================================== */
export const userProfilCmds = [
  user('profilkartu', ['kartuprofil', 'cardprofile'], 'Kartu profil HTML (sistem sama dengan .profile): level, EXP, limit, uang, bio', async m => {
    const u = m.userDB
    const { me } = dataku(m.senderKey)
    const { kirimKartuPintar } = await import('./user.js')
    const butuh = expButuh(u.level || 1)
    const via = await kirimKartuPintar(m, u, u.premium ? 'Kartu Emas' : 'Kartu Profil', { bio: me.bio || u.bio, judulKartu: 'KARTU PROFIL' })
    return m.sendButtons({
      title: `👤 KARTU PROFIL — ${m.pushName || 'Kamu'}`,
      text: `${via ? '🪪 Kartu profilmu sudah dikirim di atas ☝️' : '⚠️ Kartu tidak bisa ditampilkan di perangkat ini.'}\n\n*Level* ${u.level || 1} · *EXP* ${u.exp || 0}/${butuh} ${bar(u.exp || 0, butuh, 10)}\n*Limit* ${u.premium ? '∞' : u.limit} · *Uang* ${u.money ?? 0}\n*Status* ${u.premium ? '💎 Premium' : '🆓 Gratis'} · *Verifikasi* ${u.registered ? '✅' : '❌'}${me.bio ? `\n*Bio* ${truncate(me.bio, 90)}` : ''}`,
      footer: config.bot.footer,
      buttons: [
        { text: '📈 Level Card', id: `${P}levelcard` },
        { text: '🏆 Rank Saya', id: `${P}rankku` },
        { text: '✏️ Ganti Bio', id: `${P}setbio` }
      ]
    })
  }),

  user('levelcard', ['kartulevel', 'progresslevel'], 'Kartu progres level HTML (sistem sama dengan .profile) ke level berikutnya', async m => {
    const u = m.userDB
    const butuh = expButuh(u.level || 1)
    const persen = Math.min(100, Math.round(((u.exp || 0) / butuh) * 100))
    const kurang = Math.max(0, butuh - (u.exp || 0))
    const { kirimKartuPintar } = await import('./user.js')
    const via = await kirimKartuPintar(m, u, 'Kartu Level', { judulKartu: `LEVEL ${u.level || 1} → ${(u.level || 1) + 1}`, bio: `${persen}% menuju Level ${(u.level || 1) + 1} · kurang ${kurang} EXP` })
    return m.sendButtons({
      title: '📈 PROGRES LEVEL',
      text: `${via ? '🪪 Kartu levelmu sudah dikirim di atas ☝️\n\n' : ''}${bar(u.exp || 0, butuh, 20)} ${persen}%\n\nLevel sekarang: *${u.level || 1}*\nEXP: ${u.exp || 0} / ${butuh}\nKurang: *${kurang} EXP* untuk naik ke Level ${(u.level || 1) + 1}\n\n💡 EXP bertambah tiap memakai command (lihat ${P}progresdetail).`,
      footer: config.bot.footer,
      buttons: [{ text: '🏆 Leaderboard', id: `${P}rankexp` }, { text: '👤 Profil', id: `${P}profilkartu` }]
    })
  }),

  user('progresdetail', ['rumuslevel', 'detaillevel'], 'Penjelasan sistem level & cara cepat naik', m => {
    const u = m.userDB
    const butuh = expButuh(u.level || 1)
    return m.reply(`📚 *SISTEM LEVEL*\n\nLevel kamu: *${u.level || 1}* (${u.exp || 0} EXP)\nButuh untuk level berikut: *${butuh} EXP*\n\n*Cara menambah EXP:*\n▸ Memakai command: +${config.leveling?.expPerCommand ?? 10} EXP\n▸ Main mini games (tebak-tebakan, RPG): +20-150 EXP\n▸ Chat di grup (auto-AI): +5 EXP\n▸ Klaim harian: +${config.limits?.claimExp ?? 100} EXP\n\n*Manfaat level:*\n▸ Limit harian bertambah tiap 5 level\n▸ Gelar di profil & leaderboard\n▸ Item RPG terbuka (Lv.5 toko, Lv.10 dungeon)\n\nSimulasi: ${(u.exp || 0)} → ${butuh} = ${Math.max(1, Math.ceil((butuh - (u.exp || 0)) / 10))} command biasa`)
  }),

  user('setbio', ['gantibio', 'bioku'], 'Pasang bio singkat yang tampil di kartu profil', m => {
    const teks = truncate(m.q || '', 90)
    if (!teks) return m.reply(`Contoh: ${P}setbio Suka ngopi sambil ngoding ☕`)
    const { db, me } = dataku(m.senderKey)
    me.bio = teks
    db[m.senderKey] = me
    simpan()
    return m.reply(`✅ Bio tersimpan:\n\n"${teks}"\n\nLihat kartu: ${P}profilkartu`)
  }, 'Suka ngopi ☕'),

  user('biodataku', ['lihatbio', 'infoprofil'], 'Lihat bio & identitas tersimpan', m => {
    const u = m.userDB
    const { me } = dataku(m.senderKey)
    return m.reply(`📇 *BIODATA*\n\nNama   : ${m.pushName || u.name || '-'}\nBio    : ${me.bio || '(belum diisi — ' + P + 'setbio)'}\nNomor  : ${m.senderKey.split('@')[0]}\nUmur   : ${u.age || (u.registered ? '-' : 'belum verifikasi')}\nGabung : ${u.created ? new Date(u.created).toLocaleDateString('id-ID') : '-'}\nStatus : ${u.premium ? '💎 Premium' : '🆓 Gratis'}\nLevel  : ${u.level || 1} (${u.exp || 0} EXP)\nAuto-AI: ${u.autoai ? '✅ aktif' : '❌ mati'}`)
  }),

  user('setumur', ['ganti umur'.replace(' ', ''), 'umurku'], 'Ubah umur tersimpan (untuk verifikasi)', m => {
    const umur = Number(m.args[0])
    if (!umur || umur < 5 || umur > 100) return m.reply(`Contoh: ${P}setumur 17\n\nUmur sekarang: ${m.userDB.age || '-'}`)
    const u = m.userDB
    u.age = umur
    u.registered = true
    saveNow('users')
    return m.reply(`✅ Umur diubah ke *${umur}* tahun dan status verifikasi jadi aktif.\n\nLihat: ${P}biodataku`)
  }, '17'),

  user('verifikasiulang', ['daftarulang', 'registerulang'], 'Daftar ulang (kalau data verifikasi rusak)', m => {
    const [nama, umur] = [(m.args[0] || m.pushName || 'User'), Number(m.args[1]) || m.userDB.age || 0]
    const u = m.userDB
    u.name = nama
    if (umur) u.age = umur
    u.registered = true
    saveNow('users')
    return m.reply(`✅ *VERIFIKASI ULANG BERHASIL*\n\nNama: ${nama}\nUmur: ${umur || '(tidak diisi)'}\nNomor: ${m.senderKey.split('@')[0]}\nSerial: SN-${(m.senderKey.replace(/\D/g, '').slice(-8))}${Date.now().toString(36).slice(-4).toUpperCase()}\n\nSelamat memakai ${config.bot.name}!`)
  }, 'Budi 17'),

  user('cekverifikasi', ['statusdaftar', 'sudahdaftar'], 'Cek apakah kamu sudah terverifikasi', m => {
    const u = m.userDB
    return m.reply(u.registered
      ? `✅ Kamu sudah terverifikasi.\n\nNama: ${u.name || m.pushName}\nUmur: ${u.age || '-'}\nSejak: ${u.created ? new Date(u.created).toLocaleDateString('id-ID') : '-'}`
      : `❌ Kamu belum terverifikasi.\n\nDaftar: ${P}daftar nama|umur\nContoh: ${P}daftar Budi|17`)
  }),

  user('ekspordataku', ['unduhdataku', 'dataku'], 'Unduh seluruh data kamu di database bot', m => {
    const u = m.userDB
    const { me } = dataku(m.senderKey)
    const st = getUserStats(m.senderKey)
    const rpg = loadDB('rpg', {})[m.senderKey] || {}
    const isi = Buffer.from(JSON.stringify({ jid: m.senderKey, user: u, tambahan: me, statistik: st, rpg, diekspor: new Date().toISOString() }, null, 2))
    return m.sendDoc(isi, `data-${m.senderKey.split('@')[0]}.json`, 'application/json', { caption: `📦 Data kamu di ${config.bot.name} (${formatSize(isi.length)}).\n\nHapus data: ${P}resetdataku` })
  }),

  user('resetdataku', ['hapusdataku'], 'Hapus data kamu sendiri (perlu konfirmasi)', m => {
    if (String(m.args[0]).toLowerCase() !== 'ya') {
      return m.reply(`⚠️ Ini menghapus data kamu: level, EXP, limit, catatan, pengingat, RPG.\n\nLanjutkan: ${P}resetdataku ya`)
    }
    const db = loadDB('users', {})
    delete db[m.senderKey]
    saveDB('users')
    const ud = loadDB('userdata', {})
    delete ud[m.senderKey]
    saveDB('userdata')
    const rp = loadDB('rpg', {})
    if (rp[m.senderKey]) { delete rp[m.senderKey]; saveDB('rpg') }
    return m.reply('🧹 Data kamu dihapus. Semua mulai dari nol — ketik ' + P + 'daftar untuk verifikasi ulang.')
  }, 'ya')
]

/* ================================================================== */
/*  B. LIMIT & EKONOMI (10)                                            */
/* ================================================================== */
export const userLimitCmds = [
  user('limitku', ['ceklimit', 'sisa limit'.replace(' ', '')], 'Lihat sisa limit & cara menambahnya', m => {
    const u = m.userDB
    const stats = getUserStats(m.senderKey)
    return m.sendButtons({
      title: '💠 LIMIT KAMU',
      text: `Sisa limit: *${u.limit}* / ${config.limits.default}\nTerpakai hari ini: ${stats.total || 0} perintah\n\n*Cara menambah limit:*\n▸ ${P}claim — klaim harian (1×/hari)\n▸ ${P}klaimmingguan — bonus mingguan\n▸ ${P}klaimbulanan — bonus bulanan\n▸ ${P}tukarlimit — tukar EXP jadi limit\n▸ Naik level (+5 limit tiap 5 level)\n▸ Jadi premium (limit ${config.limits?.premium ?? 9999})\n\n*Biaya command:* lihat ${P}biayaperintah <cmd>`,
      footer: config.bot.footer,
      buttons: [{ text: '🎁 Klaim Harian', id: `${P}claim` }, { text: '🔄 Tukar EXP', id: `${P}tukarlimit` }, { text: '📊 Statistik', id: `${P}statistikku` }]
    })
  }),

  user('klaimmingguan', ['weekly', 'mingguan'], 'Klaim bonus mingguan (7 hari sekali)', m => {
    const u = m.userDB
    const terakhir = u.lastWeekly || 0
    const sisa = 7 * 24 * 3600000 - (Date.now() - terakhir)
    if (sisa > 0) return m.reply(`⏳ Klaim mingguan sudah dipakai.\n\nBisa lagi: ${formatDuration(sisa)} (${new Date(terakhir + 7 * 24 * 3600000).toLocaleString('id-ID')})`)
    const bonus = u.premium ? 60 : 35
    u.limit += bonus
    u.exp = (u.exp || 0) + 500
    u.lastWeekly = Date.now()
    saveNow('users')
    return m.reply(`🎁 *BONUS MINGGUAN*\n\n+${bonus} limit\n+500 EXP\n\nSisa limit: ${u.limit}\nEXP: ${u.exp}\n\nKlaim harian: ${P}claim\nKlaim bulanan: ${P}klaimbulanan`)
  }),

  user('klaimbulanan', ['monthly', 'bulanan'], 'Klaim bonus bulanan (30 hari sekali)', m => {
    const u = m.userDB
    const terakhir = u.lastMonthly || 0
    const sisa = 30 * 24 * 3600000 - (Date.now() - terakhir)
    if (sisa > 0) return m.reply(`⏳ Klaim bulanan sudah dipakai.\n\nBisa lagi: ${formatDuration(sisa)} (${new Date(terakhir + 30 * 24 * 3600000).toLocaleString('id-ID')})`)
    const bonus = u.premium ? 200 : 120
    u.limit += bonus
    u.exp = (u.exp || 0) + 2500
    u.lastMonthly = Date.now()
    saveNow('users')
    return m.reply(`🗓️ *BONUS BULANAN*\n\n+${bonus} limit\n+2.500 EXP\n\nSisa limit: ${u.limit}\nEXP: ${u.exp} (Level ${u.level || 1})`)
  }),

  user('tukarlimit', ['belilimit', 'exp2limit'], 'Tukar 500 EXP jadi 5 limit', m => {
    const kali = Math.max(1, Number(m.args[0]) || 1)
    const u = m.userDB
    const butuh = 500 * kali
    if ((u.exp || 0) < butuh) return m.reply(`❌ EXP tidak cukup.\n\nButuh: ${butuh} EXP (untuk ${5 * kali} limit)\nKamu : ${u.exp || 0} EXP\n\nTambah EXP: main game (${P}menugames) atau pakai command.`)
    u.exp -= butuh
    u.limit += 5 * kali
    saveNow('users')
    return m.reply(`🔄 *TUKAR BERHASIL*\n\n-${butuh} EXP\n+${5 * kali} limit\n\nSisa EXP: ${u.exp}\nSisa limit: ${u.limit}\n\nTukar lebih banyak: ${P}tukarlimit 3`)
  }, '2'),

  user('transferlimit', ['kirlimit', 'bagilimit', 'tflimit', 'kirimlimit'], 'Kirim limit ke user lain (khusus premium, fee 10%, min 5)', m => {
    if (!m.isPremium) return m.reply(`💎 Transfer limit khusus user *PREMIUM*.\n\nPaket: ${P}hargapremium · ajukan: ${P}belipremium 30 hari`)
    const jid = targetJid(m)
    const jumlah = Number(m.args[m.args.length - 1])
    if (jid && (jid === m.senderKey || m.sender?.startsWith(jid.split('@')[0] + '@') || m.senderAlts?.includes(jid))) return m.reply('❌ Tidak bisa transfer ke diri sendiri.')
    if (!jid) return m.reply(`💸 *TRANSFER LIMIT* (khusus premium)\n\nContoh: ${P}transferlimit 6281234567890 5\natau tag orangnya: ${P}transferlimit @user 5\n\n• minimal 5 · fee 10% dibayar pengirim\n• kirim 50 → kamu dipotong 55, dia terima 50\n\nLimit kamu sekarang: *${(m.userDB.limit || 0).toLocaleString('id-ID')}*`)
    if (!jumlah || jumlah < 5) return m.reply(`⚠️ Minimal transfer 5 limit.\nContoh: ${P}transferlimit 6281234567890 5`)
    const u = m.userDB
    const fee = Math.ceil(jumlah * 0.1)
    const total = jumlah + fee
    if ((u.limit || 0) < total) return m.reply(`❌ Limit kurang. Butuh *${total}* (${jumlah} + fee ${fee}), kamu punya *${u.limit || 0}*.\n\nIsi: ${P}premclaim atau ${P}claim`)
    const t = getUser(jid)
    u.limit -= total
    t.limit = (t.limit || 0) + jumlah
    t.name = t.name || jid.split('@')[0]
    saveNow('users')
    m.sock.sendMessage(jid, { text: `💠 Kamu menerima *${jumlah} limit* dari @${m.senderKey.split('@')[0]}.\nSisa limit kamu: ${t.limit}`, mentions: [m.senderKey] }).catch(() => {})
    return m.reply(`💸 *TRANSFER BERHASIL*\n\n▸ Ke: @${jid.split('@')[0]}\n▸ Jumlah: *${jumlah}* limit (fee ${fee})\n▸ Sisa limit kamu: *${u.limit}*\n▸ Limit dia sekarang: *${t.limit}*`, { mentions: [jid] })
  }, '6281234567890 5'),

  user('riwayatlimit', ['loglimit', 'limitlog'], 'Riwayat pemakaian limit kamu', m => {
    const { db, me } = dataku(m.senderKey)
    const log = me.limitLog || []
    if (!log.length) return m.reply(`ℹ️ Belum ada riwayat.\n\nRiwayat terisi otomatis tiap kamu memakai command berbayar.\nRiwayat command: ${P}riwayatku`)
    db[m.senderKey] = me
    return m.reply(`📜 *RIWAYAT LIMIT* (${log.length} entri terakhir)\n\n${log.slice(0, 20).map((x, i) => `${i + 1}. ${x.waktu} — ${x.cmd} (${x.delta > 0 ? '+' : ''}${x.delta})`).join('\n')}\n\nSisa sekarang: ${m.userDB.limit}`)
  }),

  user('biayaperintah', ['hargacommand', 'costcmd'], 'Lihat biaya limit sebuah command', m => {
    const q = (m.args[0] || '').toLowerCase().replace(new RegExp('^\\' + P), '')
    if (!q) {
      const mahal = [...pluginMap.entries()].filter(([, p]) => (p.limit || 0) > 0).sort((a, b) => b[1].limit - a[1].limit).slice(0, 12)
      const gratis = [...pluginMap.values()].filter(p => !(p.limit || 0)).length
      return m.reply(`💠 *BIAYA PERINTAH*\n\nLimit kamu: ${m.userDB.limit}\nCommand gratis: ${gratis}/${pluginMap.size}\n\n*Yang paling mahal:*\n${mahal.map(([k, p]) => `▸ ${P}${k} — ${p.limit} limit`).join('\n') || '(semua gratis)'}\n\nCek satu command: ${P}biayaperintah <cmd>`)
    }
    const hasil = findPlugin(q)
    const pl = hasil?.plugin
    if (!pl) return m.reply(`❌ Command "${q}" tidak ditemukan.\n\nCari: ${P}carifitur ${q}`)
    return m.reply(`💠 *${P}${pl.name}*\n\nBiaya limit : ${pl.limit || 0}${(pl.limit || 0) === 0 ? ' (gratis)' : ''}\nCooldown    : ${pl.cooldown ?? config.limits.cooldown} detik\nKategori    : ${pl.category}\nKhusus      : ${[pl.owner && 'owner', pl.group && 'grup', pl.admin && 'admin', pl.premium && 'premium', pl.private && 'chat pribadi'].filter(Boolean).join(', ') || 'semua orang'}\nDeskripsi   : ${pl.description}\n\nSisa limit kamu: ${m.userDB.limit}`)
  }, 'tiktok'),

  user('hematmode', ['modehemat'], 'Daftar command gratis (limit 0) yang paling berguna', m => {
    const list = allUsers().length ? [] : []
    return m.reply(`💡 *TIPS HEMAT LIMIT*\n\n*Selalu gratis (limit 0):*\n▸ Menu & info: ${P}menu, ${P}allmenu, ${P}listcmd\n▸ Islami: ${P}jadwalsholat, ${P}arahkiblat, ${P}doa\n▸ AI dasar: ${P}ai, ${P}tanya\n▸ Profil: ${P}profilku, ${P}limitku, ${P}claim\n▸ Grup (admin): ${P}antilink, ${P}welcome, ${P}absen\n\n*Berbayar biasanya:* downloader (video/gambar), stiker massal, AI gambar.\n\nCek biaya: ${P}biayaperintah <cmd>\nIsi limit: ${P}claim · ${P}klaimmingguan · ${P}tukarlimit`)
  }),

  user('mintalimit', ['reqlimit', 'minta limit'.replace(' ', '')], 'Minta tambahan limit ke owner', m => {
    const alasan = m.q || 'limit habis'
    keOwner(m, '💠 *PERMINTAAN LIMIT*', `Alasan: ${alasan}\nLimit sekarang: ${m.userDB.limit}\nLevel: ${m.userDB.level || 1}`)
    return m.reply(`✅ Permintaan limit dikirim ke owner.\n\nAlasan: ${truncate(alasan, 120)}\nLimit kamu: ${m.userDB.limit}\n\nSambil menunggu: ${P}claim · ${P}klaimmingguan · ${P}tukarlimit`)
  }, 'limit habis buat tugas'),

  user('saldoexp', ['expsaya', 'jumlahexp'], 'Lihat total EXP & perbandingan dengan user lain', m => {
    const users = allUsers().map(u => ({ jid: u.jid, exp: u.exp || 0, level: u.level || 1 })).sort((a, b) => b.exp - a.exp)
    const rank = users.findIndex(u => u.jid === m.senderKey) + 1
    const rata = users.length ? Math.round(users.reduce((a, b) => a + b.exp, 0) / users.length) : 0
    return m.reply(`✨ *EXP KAMU*\n\nTotal EXP : ${(m.userDB.exp || 0).toLocaleString('id-ID')}\nLevel     : ${m.userDB.level || 1}\nRank      : ${rank || '-'} dari ${users.length} user\nRata-rata : ${rata.toLocaleString('id-ID')} EXP\n\n${rank === 1 ? '🥇 Kamu peringkat 1!' : rank && rank <= 3 ? `🏅 Top ${rank}!` : `Butuh ${(users[rank - 2]?.exp || 0) - (m.userDB.exp || 0)} EXP untuk naik 1 peringkat.`}\n\nLeaderboard: ${P}rankexp`)
  })
]

/* ================================================================== */
/*  C. STATISTIK & RIWAYAT (8)                                         */
/* ================================================================== */
export const userStatCmds = [
  user('statistikku', ['statsku', 'pemakaianku'], 'Statistik pemakaian kamu di bot ini', m => {
    const s = getUserStats(m.senderKey)
    const u = m.userDB
    const unik = Object.keys(s.commands || {}).length
    const total = getStats().total || 0
    const top = Object.entries(s.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return m.reply(`📊 *STATISTIK KAMU*\n\nPerintah dipakai : ${(s.total || 0).toLocaleString('id-ID')}\nFitur unik dicoba: ${unik}\nAktif terakhir   : ${s.last ? new Date(s.last).toLocaleString('id-ID') : '-'}\nPorsi dari total : ${total ? ((s.total / total) * 100).toFixed(1) : 0}% (${total.toLocaleString('id-ID')} perintah semua user)\n\n*Command favorit:*\n${top.map(([k, v], i) => `${i + 1}. ${P}${k} — ${v}×`).join('\n') || '(belum ada)'}\n\n*Akun:* Level ${u.level || 1} · ${u.exp || 0} EXP · limit ${u.limit}${u.premium ? ' · 💎 premium' : ''}\n\nRiwayat: ${P}riwayatku`)
  }),

  user('riwayatku', ['historiku', 'commandterakhir'], '30 command terakhir yang kamu pakai', m => {
    const s = getUserStats(m.senderKey)
    const r = s.riwayat || []
    if (!r.length) return m.reply('ℹ️ Belum ada riwayat. Pakai beberapa command dulu, misalnya ' + P + 'menu')
    const hitung = {}
    for (const c of r) hitung[c] = (hitung[c] || 0) + 1
    return m.reply(`🕒 *RIWAYAT COMMAND* (${r.length} terakhir)\n\n${r.map((c, i) => `${String(i + 1).padStart(2)}. ${P}${c}`).join('\n')}\n\n*Paling sering di riwayat ini:*\n${Object.entries(hitung).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `▸ ${P}${k} — ${v}×`).join('\n')}`)
  }),

  user('topcmdku', ['favoritku', 'commandfavorit'], '5 command yang paling sering kamu pakai', m => {
    const s = getUserStats(m.senderKey)
    const top = Object.entries(s.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (!top.length) return m.reply('ℹ️ Belum ada data. Pakai bot dulu ya!')
    const maks = top[0][1]
    return m.reply(`⭐ *COMMAND FAVORIT KAMU*\n\n${top.map(([k, v], i) => `${i + 1}. ${P}${k.padEnd(16)} ${'█'.repeat(Math.max(1, Math.round(v / maks * 12)))} ${v}×`).join('\n')}\n\nTotal pemakaian: ${(s.total || 0).toLocaleString('id-ID')}\nFitur unik: ${Object.keys(s.commands).length}`)
  }),

  user('rankku', ['peringkatku', 'posisiku'], 'Peringkat kamu di leaderboard', m => {
    const users = allUsers().map(u => ({ ...u, exp: u.exp || 0 })).sort((a, b) => b.exp - a.exp)
    const i = users.findIndex(u => u.jid === m.senderKey)
    if (i < 0) return m.reply('ℹ️ Data kamu belum ada. Coba ' + P + 'daftar dulu.')
    const atas = users[i - 1], bawah = users[i + 1]
    return m.reply(`🏅 *PERINGKAT #${i + 1} dari ${users.length}*\n\n${atas ? `▲ Di atas: ${truncate(atas.name || atas.jid.split('@')[0], 24)} — ${atas.exp} EXP (selisih ${atas.exp - users[i].exp})` : '▲ Kamu di puncak! 🥇'}\n👤 *Kamu* — ${users[i].exp} EXP · Level ${users[i].level || 1}\n${bawah ? `▼ Di bawah: ${truncate(bawah.name || bawah.jid.split('@')[0], 24)} — ${bawah.exp} EXP` : '▼ Tidak ada di bawahmu'}\n\nLeaderboard lengkap: ${P}rankexp`)
  }),

  user('rankexp', ['leaderboardexp', 'topexp'], 'Leaderboard EXP top 20', m => {
    const users = allUsers().map(u => ({ ...u, exp: u.exp || 0 })).sort((a, b) => b.exp - a.exp).slice(0, 20)
    if (!users.length) return m.reply('ℹ️ Belum ada data user.')
    const medali = ['🥇', '🥈', '🥉']
    const aku = m.senderKey
    return m.sendButtons({
      title: '🏆 LEADERBOARD EXP',
      text: `${users.map((u, i) => `${medali[i] || (i + 1) + '.'} ${truncate(u.name || u.jid.split('@')[0], 22)} — Lv.${u.level || 1} · ${u.exp.toLocaleString('id-ID')} EXP${u.jid === aku ? ' ← kamu' : ''}`).join('\n')}\n\nTotal user terdaftar: ${allUsers().length}`,
      footer: config.bot.footer,
      buttons: [{ text: '📈 Rank Saya', id: `${P}rankku` }, { text: '💠 Limit Saya', id: `${P}limitku` }, { text: '🎮 Menu Game', id: `${P}menugames` }]
    })
  }),

  user('waktuku', ['aktifku', 'lastseenku'], 'Kapan kamu pertama & terakhir aktif', m => {
    const u = m.userDB
    const s = getUserStats(m.senderKey)
    const sejak = u.created || u.lastChat || Date.now()
    return m.reply(`⏱️ *AKTIVITAS KAMU*\n\nTerdaftar pertama : ${new Date(sejak).toLocaleString('id-ID')}\nChat terakhir     : ${u.lastChat ? new Date(u.lastChat).toLocaleString('id-ID') : '-'}\nCommand terakhir  : ${s.last ? new Date(s.last).toLocaleString('id-ID') : '-'}\nUmur akun         : ${formatDuration(Date.now() - sejak)}\nTotal command     : ${(s.total || 0).toLocaleString('id-ID')}\n\nRata-rata: ${formatDuration(Math.max(1, Math.floor((Date.now() - sejak) / Math.max(1, s.total || 1))))} per command`)
  }),

  user('bandingkan', ['vs', 'aduuser'], 'Bandingkan statistik kamu dengan user lain', m => {
    const jid = targetJid(m)
    if (!jid) return m.reply(`Contoh: ${P}bandingkan 6281234567890\natau tag: ${P}bandingkan @user`)
    const a = m.userDB, b = getUser(jid)
    const sa = getUserStats(m.senderKey), sb = getUserStats(jid)
    const rows = [
      ['Level', a.level || 1, b.level || 1],
      ['EXP', a.exp || 0, b.exp || 0],
      ['Limit', a.limit, b.limit],
      ['Command dipakai', sa.total || 0, sb.total || 0],
      ['Fitur unik', Object.keys(sa.commands || {}).length, Object.keys(sb.commands || {}).length]
    ]
    let menangA = 0, menangB = 0
    const garis = rows.map(([n, x, y]) => {
      if (x > y) menangA++; else if (y > x) menangB++
      return `${n.padEnd(18)} ${String(x).padStart(10)} ${x > y ? '◀' : x === y ? '=' : '▶'} ${String(y).padEnd(10)}`
    })
    return m.reply(`⚔️ *PERBANDINGAN*\n\n${'KAMU'.padEnd(29)}@${jid.split('@')[0]}\n\n\`\`\`\n${garis.join('\n')}\n\`\`\`\n\nSkor: kamu ${menangA} — ${menangB} lawan\n${menangA > menangB ? '🏆 Kamu unggul!' : menangB > menangA ? '😅 Lawan unggul.' : '🤝 Seimbang.'}`)
  }, '6281234567890'),

  user('aktifkanstatistik', ['staton'], 'Nyalakan pencatatan statistik kamu', m => {
    const { db, me } = dataku(m.senderKey)
    me.statOff = false
    db[m.senderKey] = me
    simpan()
    return m.reply(`✅ Pencatatan statistik kamu DINYALAKAN.\n\nLihat: ${P}statistikku\nMatikan: ${P}matikanstatistik`)
  })
]

/* ================================================================== */
/*  D. AI PERSONAL (7)                                                 */
/* ================================================================== */
export const userAiCmds = [
  user('autoaion', ['nyalaai', 'aiotomatis'], 'Bot membalas chat kamu tanpa prefix (di chat ini)', m => {
    const u = m.userDB
    u.autoai = true
    saveNow('users')
    return m.sendButtons({
      title: '🤖 AUTO-AI DINYALAKAN',
      text: `Sekarang setiap pesan kamu di *${m.isGroup ? 'grup ini' : 'chat ini'}* dijawab AI tanpa perlu prefix.\n\nContoh: tulis "jelaskan fotosintesis" langsung.\n\n▸ Matikan: ${P}autoaioff\n▸ Gaya jawaban: ${P}setgayaai santai\n▸ Hapus memori: ${P}hapusmemoriai`,
      footer: config.bot.footer,
      buttons: [{ text: '🎨 Gaya Santai', id: `${P}setgayaai santai` }, { text: '🧠 Lihat Memori', id: `${P}lihatmemoriai` }, { text: '🚫 Matikan', id: `${P}autoaioff` }]
    })
  }),

  user('autoaioff', ['matiai', 'matiautoai'], 'Matikan auto-reply AI untuk kamu', m => {
    const u = m.userDB
    u.autoai = false
    saveNow('users')
    return m.reply('🚫 Auto-AI dimatikan. AI hanya menjawab lewat perintah seperti ' + P + 'ai <pertanyaan>.')
  }),

  user('setgayaai', ['gayaai', 'styleai'], 'Atur gaya jawaban AI (santai/formal/lucu/singkat)', m => {
    const pilihan = ['santai', 'formal', 'lucu', 'singkat', 'detail', 'gaul']
    const q = String(m.args[0] || '').toLowerCase()
    const { db, me } = dataku(m.senderKey)
    if (!q) return m.reply(`Gaya kamu sekarang: *${me.gayaAI || 'default'}*\n\nPilihan: ${pilihan.map(x => `\`${x}\``).join(' ')}\n\nUbah: ${P}setgayaai lucu`)
    if (!pilihan.includes(q)) return m.reply(`⚠️ Gaya tidak dikenal: "${q}"\nPilihan: ${pilihan.join(', ')}`)
    me.gayaAI = q
    db[m.senderKey] = me
    simpan()
    const contoh = { santai: 'Sip! Aku jelasin santai aja ya.', formal: 'Baik, berikut penjelasan secara formal.', lucu: 'Wkwk oke siap, aku jawab sambil bercanda 😆', singkat: 'Oke. Jawaban pendek.', detail: 'Baik, aku jelaskan selengkap-lengkapnya.', gaul: 'Gasss, aku jawab pake bahasa gaul ya bestie.' }
    return m.reply(`🎨 Gaya AI kamu: *${q}*\n\nContoh nada jawaban:\n"${contoh[q]}"\n\nUji: ${P}ai jelaskan gravitasi`)
  }, 'lucu'),

  user('lihatmemoriai', ['memoriai', 'ingatanai'], 'Lihat konteks yang diingat AI tentang kamu', m => {
    const mem = loadDB('memory', {})[m.senderKey] || loadDB('memory', {})[m.sender] || []
    if (!mem.length) return m.reply(`🧠 Memori AI kamu masih kosong.\n\nAI menyimpan percakapan terakhir agar nyambung.\nIsi dengan mengobrol: ${P}ai halo, nama aku Budi`)
    return m.reply(`🧠 *MEMORI AI* (${mem.length} entri)\n\n${mem.slice(-12).map((x, i) => `${i + 1}. *${x.role}*: ${truncate(x.content, 140)}`).join('\n')}\n\nHapus semua: ${P}hapusmemoriai`)
  }),

  user('hapusmemoriai', ['clearmemoriai', 'resetmemori'], 'Hapus ingatan AI tentang kamu', m => {
    const db = loadDB('memory', {})
    const ada = db[m.senderKey] || db[m.sender]
    delete db[m.senderKey]
    delete db[m.sender]
    saveDB('memory')
    return m.reply(ada ? `🗑️ ${Array.isArray(ada) ? ada.length : 0} entri memori dihapus. AI mulai dari nol.\n\nCek: ${P}lihatmemoriai` : 'ℹ️ Memori AI kamu memang sudah kosong.')
  }),

  user('setbahasaai', ['bahasaai'], 'Pilih bahasa jawaban AI (id/en)', m => {
    const q = String(m.args[0] || '').toLowerCase()
    if (!['id', 'en', 'arab', 'jawa'].includes(q)) {
      const { me } = dataku(m.senderKey)
      return m.reply(`Bahasa AI kamu: *${me.bahasaAI || 'id (Indonesia)'}*\n\nPilihan: \`id\` \`en\` \`arab\` \`jawa\`\nUbah: ${P}setbahasaai en`)
    }
    const { db, me } = dataku(m.senderKey)
    me.bahasaAI = q
    db[m.senderKey] = me
    simpan()
    return m.reply(`🌐 Bahasa AI: *${q}*\n\nUji: ${P}ai apa kabar?`)
  }, 'en'),

  user('aiprivasi', ['privasiai'], 'Lihat & atur data AI yang tersimpan tentang kamu', m => {
    const { me } = dataku(m.senderKey)
    const mem = (loadDB('memory', {})[m.senderKey] || []).length
    return m.sendButtons({
      title: '🔐 PRIVASI AI KAMU',
      text: `*Yang disimpan bot:*\n▸ Riwayat chat AI: ${mem} entri (potongan terakhir saja)\n▸ Gaya bahasa: ${me.gayaAI || 'default'} · Bahasa: ${me.bahasaAI || 'id'}\n▸ Statistik pemakaian: ${getUserStats(m.senderKey).total || 0} perintah\n▸ Profil dasar: nama, level, limit\n\n*Tidak disimpan:* isi chat pribadi non-perintah, nomor kontak, lokasi.\n\nData dikirim ke model AI hanya saat kamu memakai fitur AI.`,
      footer: config.bot.footer,
      buttons: [{ text: '🗑️ Hapus Memori', id: `${P}hapusmemoriai` }, { text: '📦 Unduh Data', id: `${P}ekspordataku` }, { text: '🧹 Reset Semua', id: `${P}resetdataku` }]
    })
  })
]

/* ================================================================== */
/*  E. PENGINGAT & CATATAN (9)                                         */
/* ================================================================== */
export const userNoteCmds = [
  user('ingatkan', ['reminder', 'pengingat'], 'Pengingat pribadi: .ingatkan <menit> <teks>', m => {
    const menit = Number(m.args[0])
    const teks = m.args.slice(1).join(' ')
    if (!menit || menit < 1 || menit > 10080 || !teks) return m.reply(`Format: ${P}ingatkan <menit> <teks>\n\nContoh:\n▸ ${P}ingatkan 30 angkat jemuran\n▸ ${P}ingatkan 1440 bayar listrik (24 jam)\n\nLihat daftar: ${P}pengingatku`)
    const { db, me } = dataku(m.senderKey)
    const id = me.pengingat.length + 1
    me.pengingat.push({ id, teks, waktu: Date.now() + menit * 60000, jid: m.jid, menit })
    db[m.senderKey] = me
    simpan()
    const sock = m.sock, jidKirim = m.jid, tag = m.sender
    setTimeout(() => {
      sock.sendMessage(jidKirim, { text: `⏰ *PENGINGAT*\n\n@${tag.split('@')[0]}: ${teks}\n\n(Dibuat ${menit} menit lalu)`, mentions: [tag] }).catch(() => {})
      try {
        const d2 = loadDB('userdata', {})
        if (d2[tag]) { d2[tag].pengingat = (d2[tag].pengingat || []).filter(p => p.id !== id); saveDB('userdata') }
      } catch { /* abaikan */ }
    }, menit * 60000).unref?.()
    return m.reply(`⏰ Pengingat #${id} dibuat.\n\nIsi: ${truncate(teks, 120)}\nWaktu: ${new Date(Date.now() + menit * 60000).toLocaleString('id-ID')} (${formatDuration(menit * 60000)})\n\n⚠️ Hanya berbunyi selama bot hidup.\nDaftar: ${P}pengingatku`)
  }, '30 angkat jemuran'),

  user('pengingatku', ['pengingatlist', 'lihatpengingat'], 'Daftar pengingat aktif kamu', m => {
    const { me } = dataku(m.senderKey)
    const list = me.pengingat.filter(p => p.waktu > Date.now())
    if (!list.length) return m.reply(`ℹ️ Tidak ada pengingat aktif.\n\nBuat: ${P}ingatkan 30 minum obat`)
    return m.reply(`⏰ *PENGINGAT AKTIF* (${list.length})\n\n${list.map(p => `${p.id}. ${truncate(p.teks, 60)}\n   ⤷ ${new Date(p.waktu).toLocaleString('id-ID')} (lagi ${formatDuration(p.waktu - Date.now())})`).join('\n\n')}\n\nHapus: ${P}hapuspengingat <nomor>`)
  }),

  user('hapuspengingat', ['hapusreminderku', 'batalkanpengingat'], 'Hapus pengingat berdasarkan nomor', m => {
    const id = Number(m.args[0])
    const { db, me } = dataku(m.senderKey)
    if (!id) return m.reply(`Contoh: ${P}hapuspengingat 1\n\nDaftar: ${P}pengingatku`)
    const idx = me.pengingat.findIndex(p => p.id === id)
    if (idx < 0) return m.reply(`❌ Pengingat #${id} tidak ditemukan.`)
    const [hapus] = me.pengingat.splice(idx, 1)
    db[m.senderKey] = me
    simpan()
    return m.reply(`🗑️ Pengingat #${id} dihapus:\n"${truncate(hapus.teks, 100)}"\n\n⚠️ Kalau timer-nya sudah berjalan, notifikasi tetap bisa muncul sekali.`)
  }, '1'),

  user('catat', ['tambahcatatan', 'note'], 'Simpan catatan pribadi', m => {
    const teks = truncate(m.q || '', 500)
    if (!teks) return m.reply(`Contoh: ${P}catat WiFi rumah: indih0me/12345\n\nLihat: ${P}catatanku`)
    const { db, me } = dataku(m.senderKey)
    if (me.catatan.length >= 50) return m.reply('⚠️ Maksimal 50 catatan. Hapus dulu: ' + P + 'hapuscatatan <nomor>')
    me.catatan.push({ id: me.catatan.length + 1, teks, waktu: Date.now() })
    db[m.senderKey] = me
    simpan()
    return m.reply(`📝 Catatan #${me.catatan.length} tersimpan.\n\n"${truncate(teks, 200)}"\n\nLihat semua: ${P}catatanku\nCari: ${P}caricatatan <kata>`)
  }, 'WiFi: indih0me/12345'),

  user('catatanku', ['listcatatan', 'noteku'], 'Lihat semua catatan pribadi', m => {
    const { me } = dataku(m.senderKey)
    if (!me.catatan.length) return m.reply(`📭 Belum ada catatan.\n\nBuat: ${P}catat belanja bulanan: beras, telur, minyak`)
    return m.reply(`📝 *CATATAN KAMU* (${me.catatan.length})\n\n${me.catatan.map(c => `${c.id}. ${truncate(c.teks, 120)}\n   ⤷ ${new Date(c.waktu).toLocaleString('id-ID')}`).join('\n\n').slice(0, 3000)}\n\nHapus: ${P}hapuscatatan <nomor>\nCari: ${P}caricatatan <kata>`)
  }),

  user('caricatatan', ['searchcatatan', 'carinote'], 'Cari di catatan kamu', m => {
    const q = (m.q || '').toLowerCase()
    if (!q) return m.reply(`Contoh: ${P}caricatatan wifi`)
    const { me } = dataku(m.senderKey)
    const hasil = me.catatan.filter(c => c.teks.toLowerCase().includes(q))
    if (!hasil.length) return m.reply(`❌ Tidak ada catatan yang mengandung "${q}".\n\nSemua catatan: ${P}catatanku`)
    return m.reply(`🔎 *HASIL "${q}"* (${hasil.length})\n\n${hasil.map(c => `${c.id}. ${truncate(c.teks, 200)}`).join('\n\n')}`)
  }, 'wifi'),

  user('hapuscatatan', ['delcatatan', 'hapusnote'], 'Hapus catatan berdasarkan nomor', m => {
    const id = Number(m.args[0])
    const { db, me } = dataku(m.senderKey)
    if (!id) return m.reply(`Contoh: ${P}hapuscatatan 2\n\nDaftar: ${P}catatanku`)
    const idx = me.catatan.findIndex(c => c.id === id)
    if (idx < 0) return m.reply(`❌ Catatan #${id} tidak ada.`)
    const [hapus] = me.catatan.splice(idx, 1)
    me.catatan.forEach((c, i) => { c.id = i + 1 })
    db[m.senderKey] = me
    simpan()
    return m.reply(`🗑️ Catatan dihapus: "${truncate(hapus.teks, 120)}"\n\nSisa: ${me.catatan.length} catatan`)
  }, '2'),

  user('simpanlink', ['bookmark', 'savelink'], 'Simpan link penting', m => {
    const url = (m.args[0] || '').trim()
    const judul = truncate(m.args.slice(1).join(' ') || url, 60)
    if (!/^https?:\/\//i.test(url)) return m.reply(`Contoh: ${P}simpanlink https://github.com Tampilan repo\n\nLihat: ${P}linkku`)
    const { db, me } = dataku(m.senderKey)
    if (me.link.length >= 40) return m.reply('⚠️ Maksimal 40 link. Hapus dulu: ' + P + 'hapuslink <nomor>')
    me.link.push({ id: me.link.length + 1, url, judul, waktu: Date.now() })
    db[m.senderKey] = me
    simpan()
    return m.reply(`🔖 Link #${me.link.length} disimpan.\n\n${judul}\n${url}\n\nLihat: ${P}linkku`)
  }, 'https://github.com Repo saya'),

  user('linkku', ['listlink', 'bookmarkku'], 'Lihat semua link tersimpan', m => {
    const { me } = dataku(m.senderKey)
    if (!me.link.length) return m.reply('🔖 Belum ada link tersimpan.\n\nSimpan: ' + P + 'simpanlink https://example.com Judulnya')
    return m.reply(`🔖 *LINK TERSIMPAN* (${me.link.length})\n\n${me.link.map(l => `${l.id}. ${truncate(l.judul, 40)}\n   ${l.url}`).join('\n').slice(0, 3000)}\n\nHapus: ${P}hapuslink <nomor>`)
  })
]

/* ================================================================== */
/*  F. PREMIUM & LAPORAN (8)                                           */
/* ================================================================== */
export const userPremCmds = [
  user('hargapremium', ['paketpremium', 'listpremium'], 'Daftar paket premium & keuntungannya', m => {
    const u = m.userDB
    const paket = [
      ['7 hari', 5000], ['30 hari', 15000], ['90 hari', 35000], ['Permanen', 80000]
    ]
    return m.sendButtons({
      title: u.premium ? '💎 KAMU SUDAH PREMIUM' : '💎 PAKET PREMIUM',
      text: `*Keuntungan premium:*\n▸ Limit ${config.limits?.premium ?? 9999}/hari (gratis: ${config.limits.default})\n▸ Bonus klaim mingguan & bulanan 2× lipat\n▸ Akses semua fitur berbayar tanpa limit\n▸ Prioritas balasan AI + model lebih bagus\n▸ Badge 💎 di profil & leaderboard\n\n*Paket:*\n${paket.map(([n, h]) => `▸ ${n.padEnd(10)} Rp${h.toLocaleString('id-ID')}`).join('\n')}\n\nBeli: ${P}belipremium 30 hari\nKode promo: ${P}kodepromo <kode>\nCek status: ${P}premcek`,
      footer: config.bot.footer,
      buttons: [{ text: '🛒 Beli 30 Hari', id: `${P}belipremium 30 hari` }, { text: '🎟️ Pakai Kode', id: `${P}kodepromo` }, { text: '👑 Hubungi Owner', id: `${P}owner` }]
    })
  }),

  user('belipremium', ['orderpremium', 'upgradepremium'], 'Ajukan pembelian premium ke owner', async m => {
    const paket = m.q || '30 hari'
    const ok = await keOwner(m, '💎 *PENGAJUAN PREMIUM*', `Paket diminta: ${paket}\nLevel user: ${m.userDB.level || 1}\nEXP: ${m.userDB.exp || 0}\n\nOwner: balas user ini, lalu aktifkan dengan ${P}addprem ${m.senderKey.split('@')[0]} <hari>`)
    return m.reply(ok
      ? `✅ Pengajuan premium "*${truncate(paket, 40)}*" terkirim ke owner.\n\nOwner akan menghubungimu untuk pembayaran & aktivasi.\nCek status: ${P}premcek`
      : '⚠️ Gagal mengirim ke owner (mungkin bot tidak bisa chat ke nomor owner). Hubungi langsung: ' + P + 'owner')
  }, '30 hari'),

  user('kodepromo', ['redeem', 'tukarkode'], 'Tukarkan kode promo premium/limit', m => {
    const kode = String(m.args[0] || '').trim().toUpperCase()
    const db = loadDB('promokode', {})
    if (!kode) {
      const aktif = Object.entries(db).filter(([, v]) => !v.dipakai)
      return m.reply(`🎟️ *KODE PROMO*\n\nFormat: ${P}kodepromo <KODE>\n\nKode aktif di server: ${aktif.length}${aktif.length ? '\n' + aktif.slice(0, 10).map(([k, v]) => `▸ ${k} — ${v.jenis} (${v.nilai})`).join('\n') : '\n\nMinta kode ke owner: ' + P + 'owner'}`)
    }
    const item = db[kode]
    if (!item) return m.reply(`❌ Kode "${kode}" tidak dikenal.`)
    if (item.dipakai) return m.reply(`⚠️ Kode "${kode}" sudah dipakai oleh ${item.dipakai} pada ${new Date(item.waktuPakai || 0).toLocaleString('id-ID')}.`)
    const u = m.userDB
    if (item.jenis === 'premium') {
      u.premium = true
      u.premiumUntil = Date.now() + (item.nilai || 30) * 24 * 3600000
      u.limit = config.limits?.premium ?? 9999
      item.dipakai = m.senderKey.split('@')[0]
      item.waktuPakai = Date.now()
      saveDB('promokode')
      saveNow('users')
      return m.reply(`🎉 *KODE DITERIMA!*\n\n💎 Premium ${item.nilai} hari aktif sampai ${new Date(u.premiumUntil).toLocaleDateString('id-ID')}\nLimit jadi ${u.limit}/hari\n\nTerima kasih! Cek: ${P}premcek`)
    }
    if (item.jenis === 'limit') {
      u.limit += (item.nilai || 20)
      item.dipakai = m.senderKey.split('@')[0]
      item.waktuPakai = Date.now()
      saveDB('promokode')
      saveNow('users')
      return m.reply(`🎉 *+${item.nilai} LIMIT*\n\nSisa limit kamu: ${u.limit}\n\nKode lain: ${P}kodepromo`)
    }
    return m.reply(`⚠️ Jenis kode "${item.jenis}" tidak dikenal. Lapor: ${P}laporbug`)
  }, 'HEMAT20'),

  user('buatpromo', ['createpromo', 'kodediskon'], 'Owner: buat kode promo', m => {
    const [kode, jenis, nilai, jumlah] = [(m.args[0] || '').toUpperCase(), (m.args[1] || 'limit').toLowerCase(), Number(m.args[2]) || 20, Number(m.args[3]) || 1]
    if (!kode || !['premium', 'limit'].includes(jenis)) return m.reply(`Format: ${P}buatpromo <KODE> <premium|limit> <nilai> [jumlah]\n\nContoh:\n▸ ${P}buatpromo HEMAT20 limit 20\n▸ ${P}buatpromo VIP7 premium 7`)
    const db = loadDB('promokode', {})
    db[kode] = { jenis, nilai, jumlah: jumlah || 1, dibuat: Date.now(), oleh: m.senderKey.split('@')[0], dipakai: null }
    saveDB('promokode')
    return m.reply(`🎟️ Kode dibuat.\n\nKode  : ${kode}\nJenis : ${jenis}\nNilai : ${nilai} ${jenis === 'premium' ? 'hari premium' : 'limit'}\n\nSebarkan, user tukar dengan: ${P}kodepromo ${kode}\nDaftar semua: ${P}kodepromo`)
  }, 'HEMAT20 limit 20'),

  user('cekban', ['diban', 'statusban'], 'Cek apakah akun kamu sedang dibanned', m => {
    const u = m.userDB
    if (!u.banned) return m.reply(`✅ Akun kamu *tidak* dibanned.\n\nLevel ${u.level || 1} · limit ${u.limit} · ${u.premium ? '💎 premium' : '🆓 gratis'}\n\nKalau merasa dibanned padahal tidak bisa pakai bot, coba: ${P}bandingban <alasan>`)
    return m.reply(`🚫 Akun kamu *DIBANNED*.\n\nAlasan: ${u.bannedReason || 'tidak disebutkan'}\n\nAjukan banding: ${P}bandingban saya tidak merasa melanggar\nOwner: ${P}owner`)
  }),

  user('bandingban', ['appeal', 'ajukanbanding'], 'Ajukan banding kalau merasa salah banned', async m => {
    const alasan = m.q || 'saya merasa tidak melanggar aturan'
    const u = m.userDB
    const ok = await keOwner(m, '⚖️ *BANDING USER*', `Status ban: ${u.banned ? 'DIBANNED' : 'tidak dibanned'}\nAlasan ban  : ${u.bannedReason || '-'}\nPembelaan   : ${alasan}\n\nCabut ban: ${P}unban ${m.senderKey.split('@')[0]}`)
    return m.reply(ok ? `✅ Banding terkirim ke owner.\n\nPembelaan: "${truncate(alasan, 200)}"\n\nOwner akan meninjau. Kamu bisa cek status: ${P}cekban` : '⚠️ Gagal mengirim. Hubungi owner langsung: ' + P + 'owner')
  }, 'saya tidak merasa melanggar'),

  user('laporbug', ['bugreport', 'laporerror'], 'Laporkan error/bug lengkap dengan info sistem', async m => {
    const teks = m.q
    if (!teks) return m.reply(`Contoh: ${P}laporbug ${P}tiktok error "media tidak ditemukan"\n\nSertakan: command yang dipakai, pesan error, waktu kejadian.`)
    const os = await import('node:os')
    const info = `Bug: ${teks}\nWaktu: ${new Date().toLocaleString('id-ID')}\nChat : ${m.isGroup ? m.groupName : 'Private'}\nNode : ${process.version} / ${os.default.platform()}\nUptime: ${formatDuration(process.uptime() * 1000)}\nRAM  : ${formatSize(process.memoryUsage().rss)}`
    const ok = await keOwner(m, '🐞 *LAPORAN BUG*', info)
    return m.reply(ok ? `✅ Laporan bug terkirim.\n\n\`\`\`\n${truncate(info, 600)}\n\`\`\`\n\nTerima kasih sudah membantu memperbaiki ${config.bot.name}! 🙏` : '⚠️ Gagal mengirim laporan. Coba lagi atau hubungi owner: ' + P + 'owner')
  }, '.tiktok error media tidak ditemukan'),

  user('saran', ['usulan', 'feedback'], 'Kirim saran fitur ke owner', async m => {
    const teks = m.q
    if (!teks) return m.reply(`Contoh: ${P}saran tambah fitur download story Instagram`)
    const db = loadDB('saran', [])
    db.push({ dari: m.senderKey.split('@')[0], teks: truncate(teks, 400), waktu: Date.now() })
    saveDB('saran')
    const ok = await keOwner(m, '💡 *SARAN USER*', teks)
    return m.reply(`${ok ? '✅' : '📝'} Saran tersimpan (${db.length} total).\n\n"${truncate(teks, 200)}"\n\n${ok ? 'Sudah diteruskan ke owner.' : 'Akan dibaca owner lewat ' + P + 'list saran'}`)
  }, 'tambah fitur download story IG')
]

/* ================================================================== */
/*  G. LAIN-LAIN (2)                                                   */
/* ================================================================== */
export const userLainCmds = [
  user('matikanstatistik', ['statoff'], 'Hentikan pencatatan riwayat command kamu', m => {
    const { db, me } = dataku(m.senderKey)
    me.statOff = true
    db[m.senderKey] = me
    simpan()
    return m.reply(`🚫 Pencatatan statistik kamu DIMATIKAN.\n\nRiwayat lama tetap tersimpan sampai kamu hapus: ${P}ekspordataku lalu ${P}resetdataku\nNyalakan lagi: ${P}aktifkanstatistik`)
  }),

  user('menuuser', ['usermenu', 'menupersonal'], 'Buka menu user/personal lengkap', m => {
    const u = m.userDB
    const s = getUserStats(m.senderKey)
    return m.sendList({
      title: `👤 MENU USER — ${m.pushName || 'Kamu'}`,
      text: `Level ${u.level || 1} · ${u.exp || 0} EXP · limit ${u.limit} · ${(s.total || 0).toLocaleString('id-ID')} perintah dipakai\n\nPilih bagian yang mau dibuka:`,
      footer: config.bot.footer,
      buttonText: '📋 Buka Menu User',
      sections: [
        {
          title: '👤 Profil & Identitas',
          rows: [
            { title: '🃏 Kartu Profil', id: `${P}profilkartu` },
            { title: '📈 Kartu Level', id: `${P}levelcard` },
            { title: '📚 Sistem Level', id: `${P}progresdetail` },
            { title: '✏️ Ganti Bio', id: `${P}setbio` },
            { title: '📇 Biodata Saya', id: `${P}biodataku` },
            { title: '🎂 Ganti Umur', id: `${P}setumur` },
            { title: '🔁 Verifikasi Ulang', id: `${P}verifikasiulang` },
            { title: '✅ Cek Verifikasi', id: `${P}cekverifikasi` },
            { title: '📦 Unduh Data Saya', id: `${P}ekspordataku` },
            { title: '🧹 Reset Data Saya', id: `${P}resetdataku` }
          ]
        },
        {
          title: '💠 Limit & Ekonomi',
          rows: [
            { title: '💠 Limit Saya', id: `${P}limitku` },
            { title: '🎁 Klaim Mingguan', id: `${P}klaimmingguan` },
            { title: '🗓️ Klaim Bulanan', id: `${P}klaimbulanan` },
            { title: '🔄 Tukar EXP → Limit', id: `${P}tukarlimit` },
            { title: '📤 Transfer Limit', id: `${P}transferlimit` },
            { title: '📜 Riwayat Limit', id: `${P}riwayatlimit` },
            { title: '💡 Tips Hemat', id: `${P}hematmode` },
            { title: '🙏 Minta Limit', id: `${P}mintalimit` },
            { title: '✨ Saldo EXP', id: `${P}saldoexp` }
          ]
        },
        {
          title: '📊 Statistik',
          rows: [
            { title: '📊 Statistik Saya', id: `${P}statistikku` },
            { title: '🕒 Riwayat Command', id: `${P}riwayatku` },
            { title: '⭐ Command Favorit', id: `${P}topcmdku` },
            { title: '🏅 Peringkat Saya', id: `${P}rankku` },
            { title: '🏆 Leaderboard', id: `${P}rankexp` },
            { title: '⏱️ Waktu Aktif', id: `${P}waktuku` },
            { title: '⚔️ Bandingkan User', id: `${P}bandingkan` }
          ]
        },
        {
          title: '🤖 AI Personal',
          rows: [
            { title: '✅ Auto-AI ON', id: `${P}autoaion` },
            { title: '🚫 Auto-AI OFF', id: `${P}autoaioff` },
            { title: '🎨 Gaya Jawaban AI', id: `${P}setgayaai` },
            { title: '🌐 Bahasa AI', id: `${P}setbahasaai` },
            { title: '🧠 Lihat Memori AI', id: `${P}lihatmemoriai` },
            { title: '🗑️ Hapus Memori AI', id: `${P}hapusmemoriai` },
            { title: '🔐 Privasi AI', id: `${P}aiprivasi` }
          ]
        },
        {
          title: '📝 Pengingat & Catatan',
          rows: [
            { title: '⏰ Buat Pengingat', id: `${P}ingatkan` },
            { title: '📋 Pengingat Saya', id: `${P}pengingatku` },
            { title: '🗑️ Hapus Pengingat', id: `${P}hapuspengingat` },
            { title: '📝 Buat Catatan', id: `${P}catat` },
            { title: '📚 Catatan Saya', id: `${P}catatanku` },
            { title: '🔎 Cari Catatan', id: `${P}caricatatan` },
            { title: '🔖 Simpan Link', id: `${P}simpanlink` },
            { title: '📑 Link Saya', id: `${P}linkku` }
          ]
        },
        {
          title: '💎 Premium & Bantuan',
          rows: [
            { title: '💎 Paket Premium', id: `${P}hargapremium` },
            { title: '🛒 Ajukan Beli', id: `${P}belipremium` },
            { title: '🎟️ Kode Promo', id: `${P}kodepromo` },
            { title: '🚫 Cek Status Ban', id: `${P}cekban` },
            { title: '⚖️ Banding Ban', id: `${P}bandingban` },
            { title: '🐞 Lapor Bug', id: `${P}laporbug` },
            { title: '💡 Kirim Saran', id: `${P}saran` },
            { title: '🏠 Menu Utama', id: `${P}menu` }
          ]
        }
      ]
    })
  })
]

export const userlabCmds = [
  ...userProfilCmds, ...userLimitCmds, ...userStatCmds,
  ...userAiCmds, ...userNoteCmds, ...userPremCmds, ...userLainCmds
]

export default { userlabCmds }
