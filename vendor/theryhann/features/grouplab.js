/**
 * 👥 GROUPLAB — 50 fitur manajemen grup (kategori Group Menu, v6)
 * ------------------------------------------------------------
 *  Toggle pengaturan yang BENAR-BENAR ditegakkan handler:
 *    antilink · antitoxic · antidelete · nsfw · mute · welcome · goodbye
 *  Sistem absen, voting/poll, peringatan (warning) + auto-kick,
 *  pengingat (reminder) grup, statistik member, daftar/cari member,
 *  kartu info grup, preview kartu welcome/goodbye, undangan, tag &
 *  pengumuman, aturan grup.
 *
 *  Data disimpan di database (users/groups) supaya tahan restart.
 */
import { config } from '../config.js'
import { getGroup, saveDB, loadDB, getUser, allUsers } from '../lib/database.js'
import { truncate, pickRandom, clockString } from '../lib/functions.js'

const P = config.display.prefix
export const MAX_WARN = 3

/* tambah 1 warn ke user (dipakai perintah .warn & guard otomatis) */
export function tambahWarn (target, alasan) {
  const u = getUser(target)
  u.warn = (u.warn || 0) + 1
  u.warnAlasan = [...(u.warnAlasan || []), `${new Date().toLocaleString('id-ID')}: ${alasan}`].slice(-5)
  saveDB('users')
  return { n: u.warn, max: MAX_WARN }
}
export function resetWarn (target) {
  const u = getUser(target)
  u.warn = 0
  u.warnAlasan = []
  saveDB('users')
}

/* ------------------------- helper ------------------------- */
const butuhGrup = m => {
  if (!m.isGroup) { m.reply('⚠️ Fitur ini hanya bisa dipakai di dalam grup.'); return false }
  return true
}
const butuhAdmin = m => {
  if (!m.isGroup) { m.reply('⚠️ Fitur ini hanya bisa dipakai di dalam grup.'); return false }
  if (!m.isAdmin && !m.isOwner) { m.reply('🛡️ Fitur ini khusus Admin grup.'); return false }
  return true
}
const targetJid = m => {
  const mentions = m.mentionJid?.length ? m.mentionJid[0] : (m.mentioned?.length ? m.mentioned[0] : null)
  const quoted = m.quoted?.sender || m.quoted?.participant || null
  const nomor = (m.args.find(a => /^\d{6,15}$/.test(a.replace(/\D/g, '')) && a.replace(/\D/g, '').length >= 9) || '').replace(/\D/g, '')
  if (mentions) return mentions
  if (quoted) return quoted
  if (nomor) return nomor + '@s.whatsapp.net'
  return m.sender
}
/** target yang HARUS disebut (tag/balas/nomor) — dipakai aksi ke member lain */
const targetEksplisit = m => {
  const mentions = m.mentionJid?.length ? m.mentionJid[0] : (m.mentioned?.length ? m.mentioned[0] : null)
  if (mentions) return mentions
  const quoted = m.quoted?.sender || m.quoted?.participant || null
  if (quoted) return quoted
  const nomor = (m.args.find(a => /^\d{6,15}$/.test(a.replace(/\D/g, '')) && a.replace(/\D/g, '').length >= 9) || '').replace(/\D/g, '')
  return nomor ? nomor + '@s.whatsapp.net' : null
}
const angka = s => String(s).replace(/\D/g, '')
const namaPendek = jid => '@' + String(jid).split('@')[0]

/* data grup tambahan (absen/vote/warn/reminder/aturan) */
function extraGrup (jid) {
  const db = loadDB('groupextra', {})
  if (!db[jid]) db[jid] = {}
  return db[jid]
}
function simpanExtra (jid, data) {
  const db = loadDB('groupextra', {})
  db[jid] = { ...(db[jid] || {}), ...data }
  saveDB('groupextra')
  return db[jid]
}

const grup = (command, aliases, description, run, opt = {}) => ({
  command: [command, ...aliases],
  category: 'Group Menu',
  description,
  limit: 0,
  cooldown: 2,
  group: opt.group !== false,
  admin: !!opt.admin,
  botAdmin: !!opt.botAdmin,
  owner: !!opt.owner,
  contoh: opt.contoh || '1',
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 180)}`) }
  }
})

/* toggle pengaturan grup yang ditegakkan handler */
const toggle = (command, aliases, field, label, nilai, penjelasan) =>
  grup(command, aliases, `${nilai ? 'Menyalakan' : 'Mematikan'} ${label}`, m => {
    if (!butuhAdmin(m)) return
    const g = getGroup(m.jid)
    g[field] = nilai
    saveDB('groups')
    return m.sendButtons({
      title: `${nilai ? '✅' : '🚫'} ${label.toUpperCase()}`,
      text: `*${label}* sekarang ${nilai ? '*AKTIF*' : '*NONAKTIF*'} di grup ini.\n\n${penjelasan}`,
      buttons: [
        { text: '⚙️ Setting Grup', id: `${P}settinggrup` },
        { text: nilai ? `🚫 Matikan` : `✅ Nyalakan`, id: `${P}${nilai ? command.replace(/on$/, 'off') : command.replace(/off$/, 'on')}` },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    }).catch(() => m.reply(`${label}: ${nilai ? 'AKTIF' : 'NONAKTIF'}`))
  })

/* ================================================================== */
/*  DAFTAR COMMAND                                                     */
/* ================================================================== */
export const grouplabCmds = [
  /* ---------- A. TOGGLE PENGATURAN (14) ---------- */
  toggle('antilinkon', ['nyalaantilink'], 'antilink', 'Anti Link', true,
    'Pesan berisi link (http/wa.me/chat.whatsapp.com) dari non-admin akan dihapus otomatis.\nButuh bot sebagai admin.'),
  toggle('antilinkoff', ['matiantilink'], 'antilink', 'Anti Link', false,
    'Link bebas dikirim semua member.'),
  toggle('antitoxicon', ['nyalaantitoxic'], 'antitoxic', 'Anti Toxic', true,
    'Kata kasar akan ditegur otomatis (daftar kata ada di handlers/message.js).'),
  toggle('antitoxicoff', ['matiantitoxic'], 'antitoxic', 'Anti Toxic', false,
    'Filter kata kasar dimatikan.'),
  toggle('antideleteon', ['nyalaantidelete'], 'antidelete', 'Anti Delete', true,
    'Pesan yang dihapus akan dikirim ulang oleh bot lengkap dengan pengirimnya.'),
  toggle('antideleteoff', ['matiantidelete'], 'antidelete', 'Anti Delete', false,
    'Pesan terhapus tidak lagi diumumkan.'),
  toggle('nsfwon', ['izinnsfw'], 'nsfw', 'Konten Dewasa (NSFW)', true,
    '⚠️ Filter kata dewasa DINONAKTIFKAN. Gunakan hanya untuk grup khusus dewasa.'),
  toggle('nsfwoff', ['bloknsfw'], 'nsfw', 'Konten Dewasa (NSFW)', false,
    'Kata berbau pornografi akan dihapus otomatis (default aman).'),
  toggle('muteon', ['mute grup'.replace(' ', ''), 'bisugrup'], 'mute', 'Mute Grup (non-admin)', true,
    'Bot hanya merespons admin/owner di grup ini.'),
  toggle('muteoff', ['unmute', 'bukaanadmin'], 'mute', 'Mute Grup (non-admin)', false,
    'Semua member bisa memakai bot lagi.'),
  toggle('antitagswon', ['tagswon', 'nyalaantitagsw'], 'antitagsw', 'Anti Tag SW', true,
    'Pesan yang men-tag orang + berisi kata "SW" otomatis dihapus & pengirim kena warn (3× = kick).'),
  toggle('antitagswoff', ['tagswoff', 'matiantitagsw'], 'antitagsw', 'Anti Tag SW', false,
    'Tag SW dibiarkan (tidak dihapus / tidak kena warn).'),
  toggle('welcomenyalakan', ['welcomeon', 'nyalawelcome'], 'welcome', 'Sambutan Member Baru', true,
    'Kartu/pesan selamat datang dikirim saat ada member masuk.'),
  toggle('welcomematikan', ['welcomeoff', 'matiwelcome'], 'welcome', 'Sambutan Member Baru', false,
    'Tidak ada sambutan untuk member baru.'),
  toggle('goodbyenyalakan', ['goodbyeon', 'nyalagoodbye'], 'goodbye', 'Pesan Member Keluar', true,
    'Kartu/pesan perpisahan dikirim saat member keluar/di-kick.'),
  toggle('goodbyematikan', ['goodbyeoff', 'matigoodbye'], 'goodbye', 'Pesan Member Keluar', false,
    'Tidak ada pesan perpisahan.'),

  /* ---------- B. LIHAT SETTING ---------- */
  grup('settinggrup', ['setelangrup', 'grupsetting'], 'Lihat semua pengaturan bot di grup ini', m => {
    if (!butuhGrup(m)) return
    const g = getGroup(m.jid)
    const on = v => (v ? '✅ AKTIF' : '❌ mati')
    return m.sendButtons({
      title: '⚙️ PENGATURAN GRUP',
      text: `*${m.groupName || 'Grup ini'}*\n\n` +
        `▸ Anti Link      : ${on(g.antilink)}\n▸ Anti Toxic     : ${on(g.antitoxic)}\n` +
        `▸ Anti Delete    : ${on(g.antidelete)}\n▸ Filter NSFW    : ${g.nsfw ? '❌ diizinkan' : '✅ aktif'}\n` +
        `▸ Mute non-admin : ${on(g.mute)}\n▸ Welcome        : ${on(g.welcome)} (mode: ${g.welcomeMode || 'card'})\n` +
        `▸ Goodbye        : ${on(g.goodbye)}\n▸ Auto-reply AI  : ${on(g.autoai)}\n` +
        `▸ Tema kartu     : ${g.welcomeTheme || 'random'}\n▸ Member tercatat: ${g.members || 0}`,
      buttons: [
        { text: '👥 Statistik Grup', id: `${P}grupstat` },
        { text: '🖼️ Kartu Grup', id: `${P}kartugrup` },
        { text: '📜 Aturan Grup', id: `${P}aturangrup` }
      ]
    }).catch(() => m.reply('⚙️ Setting: ' + JSON.stringify(g)))
  }),

  /* ---------- C. ABSEN (6) ---------- */
  grup('mulaiabsen', ['absenmulai', 'openabsen'], 'Mulai sesi absen di grup', m => {
    if (!butuhAdmin(m)) return
    const ex = extraGrup(m.jid)
    if (ex.absen?.aktif) return m.reply(`⏳ Absen masih berjalan sejak ${new Date(ex.absen.mulai).toLocaleTimeString('id-ID')}.\nSelesaikan: ${P}selesaiabsen`)
    const judul = m.q || 'Absen kehadiran'
    simpanExtra(m.jid, { absen: { aktif: true, judul, mulai: Date.now(), hadir: [], izin: [], alpa: [] } })
    return m.sendButtons({
      title: '📋 ABSEN DIBUKA',
      text: `*${judul}*\n\nDibuka: ${new Date().toLocaleTimeString('id-ID')}\n\nSilakan absen dengan tombol di bawah atau ketik:\n▸ ${P}hadir\n▸ ${P}izin <alasan>`,
      buttons: [
        { text: '🙋 Hadir', id: `${P}hadir` },
        { text: '📝 Izin', id: `${P}izin` },
        { text: '📊 Cek Absen', id: `${P}cekabsen` }
      ]
    }).catch(() => m.reply('📋 Absen dibuka. Ketik ' + P + 'hadir'))
  }, 'Kegiatan pagi'),

  grup('hadir', ['absenhadir', 'present'], 'Absen hadir', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.absen?.aktif) return m.reply(`ℹ️ Belum ada sesi absen. Admin bisa membuka: ${P}mulaiabsen`)
    const key = m.senderKey || m.sender
    if (ex.absen.hadir.includes(key)) return m.reply('✅ Kamu sudah tercatat *hadir*.')
    ex.absen.izin = ex.absen.izin.filter(x => x !== key)
    ex.absen.hadir.push(key)
    simpanExtra(m.jid, { absen: ex.absen })
    return m.reply(`🙋 *Hadir* tercatat untuk @${key.split('@')[0]}.\n\nTotal hadir: ${ex.absen.hadir.length} · izin: ${ex.absen.izin.length}`, { mentions: [key] })
  }),

  grup('izin', ['absenizin', 'tidakhadir'], 'Absen izin (dengan alasan)', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.absen?.aktif) return m.reply(`ℹ️ Belum ada sesi absen. Admin: ${P}mulaiabsen`)
    const key = m.senderKey || m.sender
    const alasan = m.q || 'ada keperluan'
    ex.absen.hadir = ex.absen.hadir.filter(x => x !== key)
    if (ex.absen.izin.some(x => x.startsWith(key))) return m.reply('📝 Kamu sudah tercatat *izin*.')
    ex.absen.izin.push(`${key}|${alasan}`)
    simpanExtra(m.jid, { absen: ex.absen })
    return m.reply(`📝 *Izin* tercatat untuk @${key.split('@')[0]}.\nAlasan: ${truncate(alasan, 120)}\n\nTotal izin: ${ex.absen.izin.length}`, { mentions: [key] })
  }, 'sakit demam'),

  grup('cekabsen', ['absencek', 'rekapabsen'], 'Lihat rekap absen yang sedang berjalan', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.absen?.aktif) return m.reply(`ℹ️ Tidak ada sesi absen berjalan.\nMulai: ${P}mulaiabsen`)
    const a = ex.absen
    const total = (m.group?.participants || []).length || (a.hadir.length + a.izin.length)
    return m.reply(`📋 *${a.judul}*\n\nDibuka: ${new Date(a.mulai).toLocaleTimeString('id-ID')} · berlangsung ${clockString(Date.now() - a.mulai)}\n\n🙋 *Hadir (${a.hadir.length})*\n${a.hadir.map(j => `▸ ${namaPendek(j)}`).join('\n') || '(belum ada)'}\n\n📝 *Izin (${a.izin.length})*\n${a.izin.map(x => { const [j, alasan] = x.split('|'); return `▸ ${namaPendek(j)} — ${alasan || '-'}` }).join('\n') || '(belum ada)'}\n\n👥 Total member: ${total}\nBelum absen: ${Math.max(0, total - a.hadir.length - a.izin.length)} orang`)
  }),

  grup('selesaiabsen', ['tutupabsen', 'stopabsen'], 'Tutup sesi absen + tampilkan yang alpa', m => {
    if (!butuhAdmin(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.absen?.aktif) return m.reply('ℹ️ Tidak ada sesi absen berjalan.')
    const a = ex.absen
    const semua = (m.group?.participants || []).map(p => p.id || p)
    const sudah = [...a.hadir, ...a.izin.map(x => x.split('|')[0])]
    const alpa = semua.filter(j => !sudah.includes(j))
    const rekap = `🏁 *ABSEN SELESAI*\n\n${a.judul}\nDurasi: ${clockString(Date.now() - a.mulai)}\n\n🙋 Hadir : ${a.hadir.length}\n📝 Izin   : ${a.izin.length}\n❌ Alpa   : ${alpa.length}${alpa.length ? `\n${alpa.slice(0, 20).map(namaPendek).join(' ')}` : ''}`
    simpanExtra(m.jid, { absen: { ...a, aktif: false, selesai: Date.now(), alpa } })
    return m.reply(rekap, { mentions: alpa.slice(0, 20) })
  }),

  grup('hapusabsen', ['resetabsen', 'clearabsen'], 'Hapus data absen grup ini', m => {
    if (!butuhAdmin(m)) return
    simpanExtra(m.jid, { absen: null })
    return m.reply('🗑️ Data absen grup ini dihapus.')
  }),

  /* ---------- D. VOTING / POLL (4) ---------- */
  grup('mulaivoting', ['voting', 'buatpoll'], 'Buat voting: .mulaivoting Pertanyaan|Opsi1|Opsi2', m => {
    if (!butuhAdmin(m)) return
    const bagian = (m.q || '').split('|').map(x => x.trim()).filter(Boolean)
    if (bagian.length < 3) return m.reply(`Format: ${P}mulaivoting Makanan favorit?|Nasi goreng|Mie ayam|Bakso\n(minimal 1 pertanyaan + 2 opsi, maksimal 6 opsi)`)
    const [pertanyaan, ...opsi] = bagian
    if (opsi.length > 6) return m.reply('⚠️ Maksimal 6 opsi.')
    simpanExtra(m.jid, { vote: { pertanyaan, opsi, suara: {}, oleh: m.senderKey || m.sender, mulai: Date.now(), pemilih: [] } })
    return m.sendButtons({
      title: '🗳️ VOTING DIMULAI',
      text: `*${pertanyaan}*\n\n${opsi.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nPilih lewat tombol atau ketik ${P}vote <nomor>\nLihat hasil: ${P}cekvote`,
      buttons: opsi.slice(0, 5).map((o, i) => ({ text: `${i + 1}. ${truncate(o, 18)}`, id: `${P}vote ${i + 1}` }))
    }).catch(() => m.reply(`🗳️ Voting: ${pertanyaan}\n${opsi.map((o, i) => `${i + 1}. ${o}`).join('\n')}`))
  }, 'Makan favorit?|Nasi|Mie'),

  grup('vote', ['pilihvote', 'coblos'], 'Beri suara: .vote 1', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.vote) return m.reply(`ℹ️ Tidak ada voting aktif. Admin: ${P}mulaivoting`)
    const n = Number(m.args[0])
    if (!n || n < 1 || n > ex.vote.opsi.length) return m.reply(`⚠️ Pilih nomor 1-${ex.vote.opsi.length}\nContoh: ${P}vote 1`)
    const key = m.senderKey || m.sender
    if (ex.vote.pemilih.includes(key)) {
      const lama = ex.vote.suara[key]
      if (lama === n) return m.reply(`ℹ️ Kamu sudah memilih *${ex.vote.opsi[n - 1]}*.`)
      delete ex.vote.suara[lama]
    } else ex.vote.pemilih.push(key)
    ex.vote.suara[key] = n
    simpanExtra(m.jid, { vote: ex.vote })
    const total = ex.vote.pemilih.length
    return m.reply(`✅ Suara tercatat: *${ex.vote.opsi[n - 1]}*\n\nTotal pemilih: ${total}\nLihat hasil: ${P}cekvote`)
  }, '1'),

  grup('cekvote', ['hasilvote', 'lihatpoll'], 'Lihat hasil voting berjalan', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.vote) return m.reply('ℹ️ Tidak ada voting aktif.')
    const v = ex.vote
    const hitung = {}
    for (const n of Object.values(v.suara)) hitung[n] = (hitung[n] || 0) + 1
    const total = v.pemilih.length || 1
    const bar = n => '█'.repeat(Math.round(((hitung[n] || 0) / total) * 10)) || '░'
    return m.reply(`🗳️ *${v.pertanyaan}*\n\n${v.opsi.map((o, i) => `${i + 1}. ${o}\n   ${bar(i + 1)} ${hitung[i + 1] || 0} suara (${Math.round(((hitung[i + 1] || 0) / total) * 100)}%)`).join('\n\n')}\n\n👥 Pemilih: ${v.pemilih.length}\nDibuka: ${clockString(Date.now() - v.mulai)} lalu`)
  }),

  grup('resetvote', ['hapusvote', 'tutupvoting'], 'Tutup & hapus voting', m => {
    if (!butuhAdmin(m)) return
    const ex = extraGrup(m.jid)
    if (!ex.vote) return m.reply('ℹ️ Tidak ada voting aktif.')
    const v = ex.vote
    const hitung = {}
    for (const n of Object.values(v.suara)) hitung[n] = (hitung[n] || 0) + 1
    const pemenang = Object.entries(hitung).sort((a, b) => b[1] - a[1])[0]
    simpanExtra(m.jid, { vote: null })
    return m.reply(`🏁 *VOTING DITUTUP*\n\n${v.pertanyaan}\n\n${v.opsi.map((o, i) => `${i + 1}. ${o} — ${hitung[i + 1] || 0} suara`).join('\n')}\n\n🏆 Hasil: *${pemenang ? v.opsi[pemenang[0] - 1] : 'tidak ada suara'}*`)
  }),

  /* ---------- E. WARNING (4) ---------- */
  grup('warn', ['peringatkan', 'tegur'], 'Beri peringatan ke member (3× = kick)', async m => {
    if (!butuhAdmin(m)) return
    const target = targetEksplisit(m)
    if (!target) return m.reply(`Tag member atau tulis nomornya.\n\nContoh:\n▸ ${P}warn @628xxx spam\n▸ ${P}warn 6281234567890 promosi di grup\n\nLihat peringatan: ${P}cekwarn`)
    if (target === m.user) return m.reply('⚠️ Tidak bisa memperingatkan bot sendiri.')
    const alasan = m.q.replace(/@\d+/g, '').trim() || 'melanggar aturan grup'
    const u = getUser(target)
    u.warn = (u.warn || 0) + 1
    u.warnAlasan = [...(u.warnAlasan || []), `${new Date().toLocaleString('id-ID')}: ${alasan}`].slice(-5)
    saveDB('users')
    const sisa = MAX_WARN - u.warn
    let teks = `⚠️ *PERINGATAN KE-${u.warn}*\n\nUntuk: @${target.split('@')[0]}\nAlasan: ${truncate(alasan, 120)}\nOleh  : @${(m.senderKey || m.sender).split('@')[0]}\n\n${sisa > 0 ? `Sisa ${sisa} peringatan sebelum di-kick.` : '🚫 Peringatan penuh — dikeluarkan dari grup.'}`
    if (u.warn >= MAX_WARN && m.isBotAdmin) {
      try {
        await m.sock.groupParticipantsUpdate(m.jid, [target], 'remove')
        getUser(target).warn = 0
        saveDB('users')
      } catch { teks += '\n\n(Gagal mengeluarkan — bot mungkin bukan admin.)' }
    }
    return m.reply(teks, { mentions: [target, m.senderKey || m.sender] })
  }, '@628xxx spam'),

  grup('unwarn', ['hapuswarn', 'cabutwarn'], 'Cabut 1 peringatan dari member', m => {
    if (!butuhAdmin(m)) return
    const target = targetEksplisit(m)
    if (!target) return m.reply(`Tag member atau tulis nomornya.\nContoh: ${P}unwarn @628xxx`)
    const u = getUser(target)
    if (!u.warn) return m.reply(`ℹ️ @${target.split('@')[0]} tidak punya peringatan.`, { mentions: [target] })
    u.warn = Math.max(0, u.warn - 1)
    saveDB('users')
    return m.reply(`✅ 1 peringatan dicabut.\n@${target.split('@')[0]} sekarang punya *${u.warn}* peringatan.`, { mentions: [target] })
  }, '@628xxx'),

  grup('cekwarn', ['warningku', 'lihatwarn'], 'Cek jumlah peringatan seorang member', m => {
    if (!butuhGrup(m)) return
    const target = m.q ? targetJid(m) : (m.senderKey || m.sender)
    const u = getUser(target)
    return m.reply(`⚠️ *PERINGATAN*\n\nUser: @${target.split('@')[0]}\nJumlah: *${u.warn || 0}/${MAX_WARN}*\n\n${(u.warnAlasan || []).length ? 'Riwayat:\n' + u.warnAlasan.map(x => `▸ ${x}`).join('\n') : '(belum ada riwayat)'}\n\n${MAX_WARN - (u.warn || 0)} peringatan lagi sebelum kick.`, { mentions: [target] })
  }, '@628xxx'),

  grup('resetwarnall', ['hapussemuawarn'], 'Reset semua peringatan member grup ini', m => {
    if (!butuhAdmin(m)) return
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    let n = 0
    for (const j of peserta) { const u = getUser(j); if (u.warn) { u.warn = 0; u.warnAlasan = []; n++ } }
    saveDB('users')
    return m.reply(`🧹 Peringatan direset untuk *${n}* member (dari ${peserta.length} peserta).`)
  }),

  /* ---------- F. REMINDER GRUP (3) ---------- */
  grup('ingatkan', ['remindergrup', 'pengingat'], 'Pengingat otomatis: .ingatkan 10 rapat malam', m => {
    if (!butuhAdmin(m)) return
    const menit = Number(m.args[0])
    const pesan = m.args.slice(1).join(' ')
    if (!menit || menit < 1 || menit > 720 || !pesan) return m.reply(`Format: ${P}ingatkan <menit> <pesan>\nContoh: ${P}ingatkan 10 waktunya istirahat\nMaksimal 720 menit (12 jam).`)
    const ex = extraGrup(m.jid)
    const id = Date.now().toString(36)
    const list = [...(ex.reminder || []), { id, pesan, pada: Date.now() + menit * 60000, oleh: m.senderKey || m.sender }]
    simpanExtra(m.jid, { reminder: list })
    const jid = m.jid
    const sock = m.sock
    setTimeout(async () => {
      try {
        await sock.sendMessage(jid, {
          text: `⏰ *PENGINGAT*\n\n${pesan}\n\nDiminta oleh @${(m.senderKey || m.sender).split('@')[0]} ${menit} menit lalu.`,
          mentions: [m.senderKey || m.sender]
        })
        const now = loadDB('groupextra', {})[jid]
        if (now?.reminder) { now.reminder = now.reminder.filter(r => r.id !== id); saveDB('groupextra') }
      } catch { /* grup mungkin sudah tidak ada */ }
    }, menit * 60000).unref?.()
    return m.reply(`⏰ Pengingat dipasang.\n\nPesan: "${truncate(pesan, 100)}"\nWaktu: ${new Date(Date.now() + menit * 60000).toLocaleTimeString('id-ID')} (${menit} menit lagi)\nID: ${id}\n\nLihat semua: ${P}listreminder`)
  }, '10 waktunya rapat'),

  grup('listreminder', ['reminderlist', 'daftarpengingat'], 'Lihat daftar pengingat grup', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    const list = (ex.reminder || []).filter(r => r.pada > Date.now())
    if (!list.length) return m.reply(`ℹ️ Tidak ada pengingat aktif.\nBuat: ${P}ingatkan 10 <pesan>`)
    return m.reply(`⏰ *PENGINGAT GRUP* (${list.length})\n\n${list.map(r => `▸ ${new Date(r.pada).toLocaleTimeString('id-ID')} — ${truncate(r.pesan, 60)} (id: ${r.id})`).join('\n')}`)
  }),

  grup('hapusreminder', ['delreminder'], 'Hapus pengingat berdasarkan ID', m => {
    if (!butuhAdmin(m)) return
    const id = (m.args[0] || '').trim()
    const ex = extraGrup(m.jid)
    const list = ex.reminder || []
    const sisa = id ? list.filter(r => r.id !== id) : []
    if (id && sisa.length === list.length) return m.reply(`❌ ID "${id}" tidak ditemukan.\nLihat: ${P}listreminder`)
    simpanExtra(m.jid, { reminder: sisa })
    return m.reply(`🗑️ ${id ? `Pengingat ${id} dihapus.` : 'Semua pengingat dihapus.'}\nSisa: ${sisa.length}`)
  }, 'id'),

  /* ---------- G. INFO & MEDIA GRUP (11) ---------- */
  grup('grupstat', ['statistikgrup', 'infostatgrup'], 'Statistik member, admin & aktivitas grup', m => {
    if (!butuhGrup(m)) return
    const peserta = m.group?.participants || []
    const admin = peserta.filter(p => p.admin)
    const users = allUsers()
    const anggotaTerdaftar = peserta.filter(p => users.some(u => (u.jid || u.id) === (p.id || p))).length
    const ex = extraGrup(m.jid)
    return m.reply(`📊 *STATISTIK GRUP*\n\nNama       : ${m.groupName}\nID         : ${m.jid}\nTotal member: *${peserta.length}*\nAdmin      : ${admin.length} (${admin.map(p => namaPendek(p.id || p)).join(' ') || '-'})\nOwner grup : ${namaPendek(m.group?.owner || m.jid.split('-')[0] + '@s.whatsapp.net')}\nDibuat     : ${m.group?.creation ? new Date(m.group.creation * 1000).toLocaleDateString('id-ID') : '-'}\n\nTerdaftar di bot: ${anggotaTerdaftar} member\nAbsen aktif     : ${ex.absen?.aktif ? 'ya' : 'tidak'}\nVoting aktif    : ${ex.vote ? 'ya' : 'tidak'}\nPengingat       : ${(ex.reminder || []).filter(r => r.pada > Date.now()).length}\n\nDeskripsi:\n${truncate(m.group?.desc || '(kosong)', 300)}`)
  }),

  grup('daftarmember', ['semuamember', 'listmembergrup'], 'Daftar semua member (dengan nomor)', m => {
    if (!butuhGrup(m)) return
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    const halaman = Number(m.args[0]) || 1
    const PER = 25
    const total = Math.ceil(peserta.length / PER)
    const potong = peserta.slice((halaman - 1) * PER, halaman * PER)
    if (!potong.length) return m.reply(`ℹ️ Halaman ${halaman} kosong. Total ${total} halaman.`)
    return m.sendButtons({
      title: `👥 MEMBER GRUP (${halaman}/${total})`,
      text: `${potong.map((j, i) => `${(halaman - 1) * PER + i + 1}. ${namaPendek(j)}${(m.group.participants.find(p => (p.id || p) === j)?.admin) ? ' 🛡️' : ''}`).join('\n')}\n\nTotal: ${peserta.length} member`,
      buttons: [
        ...(halaman > 1 ? [{ text: '⬅️ Sebelumnya', id: `${P}daftarmember ${halaman - 1}` }] : []),
        ...(halaman < total ? [{ text: 'Selanjutnya ➡️', id: `${P}daftarmember ${halaman + 1}` }] : []),
        { text: '📊 Statistik', id: `${P}grupstat` }
      ].slice(0, 3)
    }).catch(() => m.reply(potong.map(namaPendek).join('\n')))
  }, '1'),

  grup('carimember', ['carianggota', 'findmember'], 'Cari member berdasarkan nomor/nama tersimpan', m => {
    if (!butuhGrup(m)) return
    const q = (m.q || '').toLowerCase()
    if (!q) return m.reply(`Contoh: ${P}carimember 62812 atau ${P}carimember budi`)
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    const hasil = peserta.filter(j => {
      const u = getUser(j)
      return j.includes(q.replace(/\D/g, '')) || (u.name || u.pushName || '').toLowerCase().includes(q)
    })
    if (!hasil.length) return m.reply(`❌ Tidak ada member cocok dengan "${q}".\nLihat semua: ${P}daftarmember`)
    return m.reply(`🔎 *HASIL: "${q}"* (${hasil.length})\n\n${hasil.slice(0, 20).map(j => { const u = getUser(j); return `▸ ${namaPendek(j)}${u.name ? ' — ' + u.name : ''}` }).join('\n')}`)
  }, '62812'),

  grup('cekadmin', ['siapaadmin', 'adminnya'], 'Cek apakah seseorang admin grup', m => {
    if (!butuhGrup(m)) return
    const target = m.q ? targetJid(m) : null
    const peserta = m.group?.participants || []
    if (target) {
      const p = peserta.find(x => (x.id || x) === target)
      return m.reply(`${namaPendek(target)} → ${p?.admin === 'superadmin' ? '👑 Super Admin' : p?.admin ? '🛡️ Admin' : p ? '👤 Member biasa' : '❓ Bukan member grup ini'}`)
    }
    const admin = peserta.filter(p => p.admin)
    return m.reply(`🛡️ *ADMIN GRUP* (${admin.length})\n\n${admin.map(p => `▸ ${namaPendek(p.id || p)}${p.admin === 'superadmin' ? ' 👑 (pembuat grup)' : ''}`).join('\n')}`)
  }),

  grup('fotogrup', ['ppgrup', 'fotoprofilgrup'], 'Ambil foto profil grup', m => {
    if (!butuhGrup(m)) return
    return (async () => {
      try {
        const url = await m.sock.profilePictureUrl(m.jid, 'image')
        const { getBuffer } = await import('../lib/functions.js')
        const buf = await getBuffer(url)
        return await m.sendImage(buf, `🖼️ Foto profil grup *${m.groupName}*`)
      } catch {
        return m.reply('❌ Grup ini tidak memasang foto profil (atau privasi dibatasi).')
      }
    })()
  }),

  grup('deskripsigrup', ['descgrup', 'deskripsigroup'], 'Tampilkan deskripsi lengkap grup', m => {
    if (!butuhGrup(m)) return
    return m.reply(`📄 *DESKRIPSI ${m.groupName}*\n\n${m.group?.desc || '(grup ini belum punya deskripsi)'}\n\nUbah: ${P}setdesc <teks> (admin)`)
  }),

  grup('kartugrup', ['infokartu', 'groupcard'], 'Kartu gambar berisi info grup', m => {
    if (!butuhGrup(m)) return
    return (async () => {
      try {
        const { makeBanner } = await import('../lib/canvas.js')
        const peserta = m.group?.participants || []
        const buf = await makeBanner({
          title: truncate(m.groupName || 'Grup', 32),
          subtitle: `${peserta.length} member · ${peserta.filter(p => p.admin).length} admin · dibuat ${m.group?.creation ? new Date(m.group.creation * 1000).toLocaleDateString('id-ID') : '-'}`,
          footer: truncate(m.group?.desc || 'Grup tanpa deskripsi', 90),
          theme: (getGroup(m.jid).welcomeTheme || 'random') === 'random' ? 'ocean' : getGroup(m.jid).welcomeTheme
        })
        return await m.sendImage(buf, `🪪 *KARTU GRUP* — ${m.groupName}`)
      } catch (e) {
        return m.reply(`ℹ️ *${m.groupName}*\n\nMember: ${(m.group?.participants || []).length}\nAdmin: ${(m.group?.participants || []).filter(p => p.admin).length}\nDibuat: ${m.group?.creation ? new Date(m.group.creation * 1000).toLocaleDateString('id-ID') : '-'}\n\n(Kartu gambar gagal dibuat: ${truncate(e.message, 100)})`)
      }
    })()
  }),

  grup('cekundangan', ['infoundangan', 'ceklinkgrup'], 'Cek isi link undangan grup WhatsApp', async m => {
    const link = (m.q || '').match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)
    if (!link) return m.reply(`Contoh: ${P}cekundangan https://chat.whatsapp.com/XXXXXX`)
    try {
      const info = await m.sock.groupGetInviteInfo(link[1])
      return m.reply(`🎟️ *INFO UNDANGAN*\n\nNama    : ${info.subject}\nID      : ${info.id}\nDibuat  : ${info.creation ? new Date(info.creation * 1000).toLocaleDateString('id-ID') : '-'}\nOleh    : ${namaPendek(info.owner || info.subjectOwner || '-')}\nMember  : ${info.participants?.length || info.size || '?'}\nDesc    : ${truncate(info.desc || '-', 200)}`)
    } catch (e) {
      return m.reply(`❌ Gagal mengambil info undangan: ${truncate(e.message, 140)}\n(Link mungkin sudah dicabut.)`)
    }
  }, 'https://chat.whatsapp.com/XXXX', { group: false }),

  grup('previewwelcome', ['contohwelcome', 'teswelcome'], 'Pratinjau kartu sambutan member baru', m => {
    if (!butuhGrup(m)) return
    return (async () => {
      try {
        const { makeCard, randomTheme } = await import('../lib/canvas.js')
        const g = getGroup(m.jid)
        const peserta = m.group?.participants || []
        const tema = (g.welcomeTheme || 'random') === 'random' ? randomTheme() : g.welcomeTheme
        const avatar = await m.sock.profilePictureUrl(m.sender, 'image').catch(() => null)
        const buf = await makeCard({
          type: 'welcome',
          name: m.pushName || 'Member Baru',
          group: m.groupName,
          memberCount: peserta.length,
          footer: config.bot.footer,
          avatar,
          background: null,
          theme: tema
        })
        return await m.sendImage(buf, `👋 *PREVIEW KARTU WELCOME*\nMode: ${g.welcomeMode || 'card'} · Tema: ${g.welcomeTheme || 'random'}\n\nUbah tema: ${P}settheme <nama>`)
      } catch (e) {
        return m.reply(`⚠️ Preview gagal: ${truncate(e.message, 150)}\nCoba mode teks: ${P}setwelcomemode text`)
      }
    })()
  }),

  grup('previewgoodbye', ['contohgoodbye', 'tesgoodbye'], 'Pratinjau kartu perpisahan member', m => {
    if (!butuhGrup(m)) return
    return (async () => {
      try {
        const { makeCard, randomTheme } = await import('../lib/canvas.js')
        const g = getGroup(m.jid)
        const tema = (g.welcomeTheme || 'random') === 'random' ? randomTheme() : g.welcomeTheme
        const avatar = await m.sock.profilePictureUrl(m.sender, 'image').catch(() => null)
        const buf = await makeCard({
          type: 'leave',
          name: m.pushName || 'Member',
          group: m.groupName,
          memberCount: (m.group?.participants || []).length,
          footer: config.bot.footer,
          avatar,
          background: null,
          theme: tema
        })
        return await m.sendImage(buf, '👋 *PREVIEW KARTU GOODBYE*')
      } catch (e) {
        return m.reply(`⚠️ Preview gagal: ${truncate(e.message, 150)}`)
      }
    })()
  }),

  /* ---------- H. TAG & PENGUMUMAN (6) ---------- */
  grup('tagallcustom', ['hidetagall', 'tagsemua'], 'Tag semua member dengan pesan sendiri', m => {
    if (!butuhAdmin(m)) return
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    const pesan = m.q || 'Perhatian untuk semua member 📢'
    return m.reply(`📢 *PENGUMUMAN*\n\n${pesan}\n\n${peserta.map(namaPendek).join(' ')}\n\n_Dari admin @${(m.senderKey || m.sender).split('@')[0]}_`, { mentions: peserta })
  }, 'Rapat jam 8 malam'),

  grup('tagadmin', ['panggiladmin', 'mentionadmin'], 'Tag semua admin grup', m => {
    if (!butuhGrup(m)) return
    const admin = (m.group?.participants || []).filter(p => p.admin).map(p => p.id || p)
    if (!admin.length) return m.reply('❌ Tidak ada admin terdeteksi.')
    return m.reply(`🛡️ *MEMANGGIL ADMIN*\n\n${m.q || 'Mohon perhatiannya.'}\n\n${admin.map(namaPendek).join(' ')}\n\nDiminta oleh: ${namaPendek(m.senderKey || m.sender)}`, { mentions: [...admin, m.senderKey || m.sender] })
  }, 'mohon bantuannya'),

  grup('pengumuman', ['announce', 'broadcastgrup'], 'Pengumuman resmi dengan tombol konfirmasi', m => {
    if (!butuhAdmin(m)) return
    const teks = m.q || 'Pengumuman dari admin grup.'
    return m.sendButtons({
      title: '📢 PENGUMUMAN GRUP',
      text: `${teks}\n\n_Dari admin @${(m.senderKey || m.sender).split('@')[0]} · ${new Date().toLocaleString('id-ID')}_`,
      buttons: [
        { text: '✅ Sudah Baca', id: `${P}sudahbaca` },
        { text: '📋 Cek Absen Baca', id: `${P}cekpengumuman` }
      ]
    }).catch(() => m.reply(`📢 *PENGUMUMAN*\n\n${teks}`, { mentions: [m.senderKey || m.sender] }))
  }, 'Besok kerja bakti jam 07.00'),

  grup('sudahbaca', ['konfirmasi'], 'Konfirmasi sudah membaca pengumuman', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    const key = m.senderKey || m.sender
    const list = [...new Set([...(ex.sudahBaca || []), key])]
    simpanExtra(m.jid, { sudahBaca: list })
    return m.reply(`✅ Terima kasih, @${key.split('@')[0]} tercatat sudah membaca pengumuman.\n\nTotal: ${list.length} orang. Lihat: ${P}cekpengumuman`, { mentions: [key] })
  }),

  grup('cekpengumuman', ['siapasudahbaca'], 'Lihat siapa saja yang sudah konfirmasi pengumuman', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    const list = ex.sudahBaca || []
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    const belum = peserta.filter(j => !list.includes(j))
    return m.reply(`📋 *KONFIRMASI PENGUMUMAN*\n\nSudah baca : ${list.length}\nBelum      : ${belum.length}\n\n${belum.length ? 'Belum konfirmasi:\n' + belum.slice(0, 25).map(namaPendek).join(' ') : '🎉 Semua sudah konfirmasi!'}`)
  }),

  grup('hidetagmedia', ['forwardmedia'], 'Teruskan media ke semua member (hidetag)', m => {
    if (!butuhAdmin(m)) return
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    return (async () => {
      let buf = null
      try {
        if (m.quoted?.isMedia) buf = await m.quoted.toBuffer()
        else if (m.isMedia) buf = await (await import('node:fs')).promises.readFile(await m.download())
      } catch { buf = null }
      if (!buf) return m.reply(`Balas sebuah *gambar/video/dokumen* dengan caption ${P}hidetagmedia <pesan>`)
      const caption = m.q || `Pesan dari admin ${namaPendek(m.senderKey || m.sender)}`
      try {
        return await m.sendImage(buf, `${caption}\n\n${peserta.map(namaPendek).join(' ')}`, { mentions: peserta })
      } catch {
        return await m.reply(`${caption}\n\n${peserta.map(namaPendek).join(' ')}`, { mentions: peserta })
      }
    })()
  }, 'Lihat poster ini'),

  /* ---------- I. ATURAN & LAINNYA (6) ---------- */
  grup('setaturan', ['setrules', 'aturanbaru'], 'Simpan aturan grup (dibaca lewat .aturangrup)', m => {
    if (!butuhAdmin(m)) return
    const teks = (m.q || '').trim()
    if (!teks) return m.reply(`Contoh: ${P}setaturan 1. Dilarang spam\n2. Hormati sesama member`)
    simpanExtra(m.jid, { aturan: teks, aturanOleh: m.senderKey || m.sender, aturanPada: Date.now() })
    return m.reply(`📜 Aturan grup disimpan (${teks.length} karakter).\n\nLihat: ${P}aturangrup`)
  }, '1. Dilarang spam'),

  grup('aturangrup', ['rulesgrup', 'bacaaturan'], 'Tampilkan aturan grup', m => {
    if (!butuhGrup(m)) return
    const ex = extraGrup(m.jid)
    return m.reply(`📜 *ATURAN ${m.groupName}*\n\n${ex.aturan || '(belum ada aturan tersimpan)'}\n\n${ex.aturan ? `_Dibuat ${new Date(ex.aturanPada).toLocaleDateString('id-ID')} oleh ${namaPendek(ex.aturanOleh)}_` : `Admin bisa membuat: ${P}setaturan <teks>`}`)
  }),

  grup('resetgrup', ['resetsetting', 'hapussetting'], 'Reset semua pengaturan bot di grup ini', m => {
    if (!butuhAdmin(m)) return
    const db = loadDB('groups', {})
    delete db[m.jid]
    saveDB('groups')
    simpanExtra(m.jid, { absen: null, vote: null, reminder: [], aturan: null, sudahBaca: [] })
    const g = getGroup(m.jid)
    return m.reply(`♻️ Pengaturan grup dikembalikan ke default.\n\nWelcome: ${g.welcome} · Antilink: ${g.antilink} · Antitoxic: ${g.antitoxic} · Mute: ${g.mute}`)
  }),

  grup('tagme', ['tagaku'], 'Tag dirimu sendiri (uji coba mention)', m => {
    if (!butuhGrup(m)) return
    return m.reply(`👋 ${namaPendek(m.senderKey || m.sender)} — ini kamu.`, { mentions: [m.senderKey || m.sender] })
  }),

  grup('hitungaktif', ['memberaktif', 'siapaaktif'], 'Hitung member yang tercatat aktif memakai bot', m => {
    if (!butuhGrup(m)) return
    const peserta = (m.group?.participants || []).map(p => p.id || p)
    const rows = peserta.map(j => {
      const u = getUser(j)
      return { j, hit: u.hit || 0, exp: u.exp || 0, level: u.level || 1, last: u.lastChat || u.created || 0 }
    }).sort((a, b) => (b.hit + b.exp) - (a.hit + a.exp))
    const aktif = rows.filter(r => r.hit > 0 || r.exp > 0)
    return m.reply(`📈 *AKTIVITAS MEMBER*\n\nTercatat aktif: ${aktif.length}/${peserta.length}\n\n${rows.slice(0, 10).map((r, i) => `${i + 1}. ${namaPendek(r.j)} — ${r.hit} perintah · ${r.exp} EXP (Lv.${r.level})${r.last ? ` · ${new Date(r.last).toLocaleDateString('id-ID')}` : ''}`).join('\n')}\n\n💡 Tercatat sejak member memakai perintah bot.`)
  }),

  grup('kuisgrup', ['kuisbareng', 'mainkuis'], 'Mulai kuis acak untuk seluruh grup', m => {
    if (!butuhGrup(m)) return
    const jenis = pickRandom(['kuisnegara', 'kuislogika', 'kuisilmu', 'kuissurah', 'kuisanagram', 'kuisgeografi', 'asahotak', 'tebakkata'])
    return m.sendButtons({
      title: '🎮 KUIS GRUP',
      text: `Siapa cepat dia dapat! 💰\n\nKuis yang dipilih: *${jenis}*\n\nSemua member boleh menjawab langsung di chat.`,
      buttons: [
        { text: '🎲 Mulai Kuis', id: `${P}${jenis}` },
        { text: '📚 Kuis Acak Lain', id: `${P}kuisgrup` },
        { text: '🎮 Daftar Game', id: `${P}daftargame` }
      ]
    }).catch(() => m.reply(`🎮 Kuis grup: ketik ${P}${jenis}`))
  }),

  /* ---------- G. BUNGKAM (3) ---------- */
  grup('bungkam', ['bisukan', 'diamkan', 'silent'], 'Bungkam member: semua pesannya otomatis dihapus', m => {
    if (!butuhAdmin(m)) return
    const target = targetEksplisit(m)
    if (!target) return m.reply(`Tag/balas member atau tulis nomornya.\n\nContoh:\n▸ ${P}bungkam @628xxx spam\n▸ ${P}bungkam 6281234567890 toxic\n\nBuka: ${P}bukabungkam @628xxx · Daftar: ${P}listbungkam`)
    if (target === m.user) return m.reply('⚠️ Tidak bisa membungkam bot sendiri.')
    const part = (m.group?.participants || []).find(p => (p.id || p) === target || p?.jid === target)
    if (part && part.admin) return m.reply('⚠️ Tidak bisa membungkam admin/owner grup.')
    const alasan = m.q.replace(/@\d+/g, '').replace(/^\d{9,15}\s*/, '').trim() || 'melanggar aturan grup'
    const g = getGroup(m.jid)
    g.bungkam = g.bungkam || {}
    const sudah = !!g.bungkam[target]
    g.bungkam[target] = { sejak: Date.now(), oleh: m.senderKey || m.sender, alasan: truncate(alasan, 120) }
    saveDB('groups')
    return m.reply(`🔇 *MEMBER DIBUNGKAM*${sudah ? ' (diperbarui)' : ''}\n\n@${target.split('@')[0]} — semua pesannya akan *otomatis dihapus* sampai dibuka.\nAlasan: ${truncate(alasan, 120)}\n\nBuka: \`${P}bukabungkam @${target.split('@')[0]}\`${m.isBotAdmin ? '' : '\n\n⚠️ Bot bukan admin — pesan tidak bisa dihapus sampai bot jadi admin.'}`, { mentions: [target] })
  }, '@628xxx spam'),

  grup('bukabungkam', ['bukamute', 'bebaskan', 'unbungkam', 'suarakan'], 'Buka bungkam member', m => {
    if (!butuhAdmin(m)) return
    const target = targetEksplisit(m)
    if (!target) return m.reply(`Tag/balas member atau tulis nomornya.\nContoh: ${P}bukabungkam @628xxx`)
    const g = getGroup(m.jid)
    if (!g.bungkam || !g.bungkam[target]) return m.reply(`ℹ️ @${target.split('@')[0]} tidak sedang dibungkam.`, { mentions: [target] })
    delete g.bungkam[target]
    saveDB('groups')
    return m.reply(`🔊 *BUNGKAM DIBUKA*\n\n@${target.split('@')[0]} bisa mengirim pesan lagi. Jangan diulangi ya! 🙂`, { mentions: [target] })
  }, '@628xxx'),

  grup('listbungkam', ['daftarbungkam', 'cekbungkam'], 'Daftar member yang sedang dibungkam', m => {
    if (!butuhGrup(m)) return
    const g = getGroup(m.jid)
    const list = Object.entries(g.bungkam || {})
    if (!list.length) return m.reply('🔊 Tidak ada member yang dibungkam di grup ini.')
    return m.reply(`🔇 *DAFTAR BUNGKAM* (${list.length})\n\n${list.map(([j, b], i) => `${i + 1}. @${j.split('@')[0]}\n   ▸ Sejak: ${new Date(b.sejak).toLocaleString('id-ID')}\n   ▸ Alasan: ${b.alasan || '-'}`).join('\n')}\n\nBuka: \`${P}bukabungkam @nomor\``, { mentions: list.map(([j]) => j) })
  }),

  /* ---------- H. ANTI TAG SW ---------- */
  grup('antitagsw', ['tagsw', 'cekantitagsw'], 'Status Anti Tag SW (hapus + warn pengetag SW)', m => {
    if (!butuhGrup(m)) return
    const g = getGroup(m.jid)
    return m.sendButtons({
      title: '📵 ANTI TAG SW',
      text: `Status: ${g.antitagsw ? '✅ AKTIF' : '❌ NONAKTIF'}\n\nCara kerja: pesan yang *men-tag orang* dan berisi kata *"SW"* (minta tag status / promosi SW) otomatis *dihapus* dan pengirim kena *warn* (${MAX_WARN}× = kick).\n\nAdmin/owner kebal. Bot harus admin agar bisa menghapus.`,
      buttons: [
        { text: '✅ Nyalakan', id: `${P}antitagswon` },
        { text: '🚫 Matikan', id: `${P}antitagswoff` },
        { text: '⚙️ Setting Grup', id: `${P}settinggrup` }
      ]
    }).catch(() => m.reply(`📵 Anti Tag SW: ${g.antitagsw ? 'AKTIF' : 'NONAKTIF'}\nNyalakan: ${P}antitagswon · Matikan: ${P}antitagswoff`))
  })
]

export default { grouplabCmds }
