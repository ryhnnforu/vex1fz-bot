/**
 * 👥 GROUP MENU v7.6 — pusat kendali grup
 * ------------------------------------------------------------------
 *  Isi:
 *   • .groupmenu  — daftar lengkap perintah grup (list interaktif)
 *   • .open/.close — buka/tutup grup (admin)
 *   • .sider      — daftar anggota yang tidak pernah terlihat mengirim pesan
 *   • .totalchat  — peringkat jumlah chat (kartu HTML animasi, bisa digeser)
 *   • .kicksider  — keluarkan anggota diam        (OWNER, konfirmasi)
 *   • .kickall    — keluarkan semua non-admin     (OWNER, konfirmasi)
 *   • .demoteall  — turunkan semua admin          (OWNER, konfirmasi)
 *   • .cn         — custom name: ubah nama orang dengan font
 *   • .addall     — tambah banyak nomor sekaligus (admin)
 *   • .resetaktif — mulai ulang jendela pelacakan aktivitas
 *
 *  Catatan "sider": WhatsApp tidak mengirim read-receipt grup ke bot, jadi
 *  yang dihitung adalah anggota yang belum pernah TERLIHAT mengirim pesan
 *  sejak pelacakan dimulai (lib/aktivitasgrup.js). Admin, bot, owner, dan
 *  pemakai perintah tidak pernah ikut dikick.
 */
import { config } from '../config.js'
import { aliasesOf, anyMatch, findParticipant, isAdminParticipant, isOwnerIdentity, learnMapping } from '../lib/identity.js'
import { grupAktivitas, resetAktivitas, ringkasAktivitas, targetSider, lalu } from '../lib/aktivitasgrup.js'
import { kartuTop } from '../lib/kartuanim.js'
import { kirimKartu } from './kartuanim.js'
import { gayaNama, gayaTertentu, daftarGaya } from '../lib/fancyfont.js'
import { getGroup, getUser, saveNow } from '../lib/database.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const JEDA = ms => new Promise(r => setTimeout(r, ms))

/* ------------------------------------------------------------------ */
/*  PEMBANTU                                                            */
/* ------------------------------------------------------------------ */
const pesertaList = m => (m.group?.participants || [])
  .map(p => p.id || p.pn || p.lid)
  .filter(Boolean)

/** semua bentuk identitas sebuah jid (PN + LID + peta yang dipelajari) */
const bentuk = jid => [...new Set([jid, ...aliasesOf(jid)].filter(Boolean))]

/** peta { idUtama: [bentukLain...] } untuk pencocokan aktivitas
 *  (satu orang bisa tercatat sebagai PN di satu pesan dan LID di pesan lain) */
function aliasMap (m) {
  const out = {}
  for (const p of (m.group?.participants || [])) {
    try { learnMapping([p.id, p.pn, p.lid]) } catch {}
    const id = p.id || p.pn || p.lid
    if (!id) continue
    const lain = [...new Set([p.pn, p.lid, ...aliasesOf(id)].filter(Boolean))].filter(x => x !== id)
    if (lain.length) out[id] = lain
  }
  return out
}

const adalahBot = (m, jid) => anyMatch(bentuk(jid), [m.user, ...(m.userAlts || [])])
const adalahOwner = (m, jid) => isOwnerIdentity(bentuk(jid), m.owners || [config.owner.number])
const adalahAku = (m, jid) => anyMatch(bentuk(jid), [m.sender, ...(m.senderAlts || [])])
/* pesertaList() menghasilkan STRING id — untuk cek admin butuh objek participant */
const adalahAdmin = (m, jid) => isAdminParticipant(findParticipant(m.group?.participants || [], bentuk(jid)))

/** yang boleh jadi target operasi berbahaya */
const targetAman = (m, jid) => !adalahBot(m, jid) && !adalahOwner(m, jid) && !adalahAku(m, jid) && !adalahAdmin(m, jid)

const angkaSingkat = jid => '@' + String(jid).split('@')[0]
const konfirmasi = m => ['ya', 'y', 'gas', 'ok', 'oke', 'konfirmasi', 'lanjut', 'yaudah'].includes(String(m.args[0] || '').toLowerCase())
const hariArg = m => {
  const n = parseInt(String(m.args[0] || '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? Math.min(365, n) : 7
}

/** jalankan groupParticipantsUpdate per batch kecil supaya tidak kena limit WhatsApp */
async function aksiBatch (m, daftar, aksi, ukuran = 5, jeda = 1200) {
  const hasil = { ok: [], gagal: [] }
  for (let i = 0; i < daftar.length; i += ukuran) {
    const potong = daftar.slice(i, i + ukuran)
    try {
      const r = await m.sock.groupParticipantsUpdate(m.jid, potong, aksi)
      const arr = Array.isArray(r) ? r : []
      potong.forEach((jid, k) => {
        const status = arr[k]?.status
        if (!status || String(status) === '200') hasil.ok.push(jid)
        else hasil.gagal.push({ jid, status })
      })
    } catch (e) {
      potong.forEach(jid => hasil.gagal.push({ jid, status: e?.message || 'error' }))
    }
    if (i + ukuran < daftar.length) await JEDA(jeda)
  }
  return hasil
}

/* ================================================================== */
/*  1. .groupmenu — hub perintah grup                                   */
/* ================================================================== */
export const groupMenu = {
  command: ['groupmenu', 'grupmenu', 'menugc', 'kelolagrup', 'groupadmin', 'pusatgrup', 'groupmenuv76'],
  category: 'Group Menu',
  description: '👥 Menu lengkap kelola grup: buka/tutup, anggota, sider, identitas, welcome, proteksi, statistik',
  limit: 0,
  run: async m => {
    const diGrup = !!m.isGroup
    const g = diGrup ? grupAktivitas(m.jid) : null
    const info = diGrup
      ? `*Grup:* ${m.groupName || '-'}\n*Anggota:* ${pesertaList(m).length}\n*Status:* ${m.group?.announce ? '🔒 Tertutup (hanya admin)' : '🌐 Terbuka'}\n*Kamu:* ${m.isOwner ? '👑 Owner bot' : m.isAdmin ? '🛡️ Admin' : '👤 Member'}\n*Bot:* ${m.isBotAdmin ? '🛡️ Admin' : '⚠️ BUKAN admin — fitur kick/add tidak jalan'}\n*Lacak aktivitas sejak:* ${new Date(g.mulai).toLocaleDateString('id-ID')}`
      : `_Buka di dalam grup untuk melihat keadaan grup ini._`

    const text =
      `👥 *GROUP MENU* — semua perintah kelola grup\n\n${info}\n\n` +
      `🔐 Tanda: 🛡️ = admin grup · 👑 = owner bot (${P}kickall, ${P}kicksider, ${P}demoteall)\n` +
      `⚠️ Operasi massal selalu minta konfirmasi: tambah kata *ya* di belakang perintah.`

    const sections = [
      {
        title: '🔒 Buka / Tutup Grup',
        rows: [
          { title: '🌐 Buka Grup', description: 'Semua member boleh kirim pesan', id: `${P}open` },
          { title: '🔒 Tutup Grup', description: 'Hanya admin yang boleh kirim pesan', id: `${P}close` },
          { title: '⚙️ Setting Grup', description: 'Tombol buka/tutup + status', id: `${P}group` },
          { title: 'ℹ️ Info Grup', description: 'Nama, deskripsi, jumlah anggota', id: `${P}groupinfo` }
        ]
      },
      {
        title: '👥 Anggota',
        rows: [
          { title: '➖ Kick', description: 'Keluarkan 1 member (tag/reply/nomor)', id: `${P}kick` },
          { title: '➕ Add', description: 'Tambah 1 member lewat nomor', id: `${P}add` },
          { title: '➕ Add Massal', description: `${P}addall 628xx 628yy (maks 10)`, id: `${P}addall` },
          { title: '⬆️ Promote', description: 'Jadikan admin', id: `${P}promote` },
          { title: '⬇️ Demote', description: 'Turunkan dari admin', id: `${P}demote` },
          { title: '⬇️ Demote Semua', description: '👑 Turunkan semua admin sekaligus', id: `${P}demoteall` },
          { title: '📜 Daftar Member', description: 'Semua anggota grup', id: `${P}listmember` },
          { title: '🛡️ Daftar Admin', description: 'Siapa saja adminnya', id: `${P}listadmin` }
        ]
      },
      {
        title: '🔇 Sider — Anggota Diam',
        rows: [
          { title: '👀 Lihat Sider', description: 'Daftar yang tak pernah terlihat mengirim pesan', id: `${P}sider` },
          { title: '💬 Total Chat', description: 'Peringkat jumlah chat (kartu animasi)', id: `${P}totalchat` },
          { title: '🧹 Kick Sider', description: '👑 Keluarkan anggota diam (konfirmasi)', id: `${P}kicksider` },
          { title: '💥 Kick Semua', description: '👑 Keluarkan semua non-admin (konfirmasi)', id: `${P}kickall` },
          { title: '🔄 Reset Pelacakan', description: 'Mulai hitung aktivitas dari sekarang', id: `${P}resetaktif` }
        ]
      },
      {
        title: '✏️ Identitas Grup',
        rows: [
          { title: '📛 Ganti Nama (Admin)', description: `${P}setname Nama Baru`, id: `${P}setname` },
          { title: '✒️ Custom Name (Font)', description: `${P}cn Arif — ubah nama orang dengan font`, id: `${P}cn` },
          { title: '📄 Ganti Deskripsi', description: `${P}setdesc teks`, id: `${P}setdesc` },
          { title: '🖼️ Ganti Foto Grup', description: 'Reply gambar + caption setppgc', id: `${P}setppgc` },
          { title: '🔗 Link Grup', description: 'Ambil link invite', id: `${P}linkgroup` },
          { title: '♻️ Reset Link', description: 'Cabut link lama', id: `${P}revoke` }
        ]
      },
      {
        title: '👋 Welcome & Goodbye',
        rows: [
          { title: '👋 Kartu Welcome', description: 'Nyala/mati + contoh', id: `${P}welcome` },
          { title: '⚙️ Set Welcome', description: 'Atur kartu ucapan masuk', id: `${P}setwelcome` },
          { title: '🚪 Set Goodbye', description: 'Atur kartu ucapan keluar', id: `${P}goodbye` },
          { title: '📝 Teks Welcome', description: 'Ganti kalimat sambutan', id: `${P}setwelcometext` },
          { title: '🎨 Tema Kartu', description: 'Daftar tema kartu', id: `${P}listtheme` }
        ]
      },
      {
        title: '🛡️ Proteksi Grup',
        rows: [
          { title: '🔗 Anti Link — NYALA', description: 'Hapus + tindak pengirim link grup lain', id: `${P}antilinkon` },
          { title: '🔗 Anti Link — MATI', description: 'Matikan filter link', id: `${P}antilinkoff` },
          { title: '🤬 Anti Toxic — NYALA', description: 'Peringatan kata kasar', id: `${P}antitoxicon` },
          { title: '🤬 Anti Toxic — MATI', description: 'Matikan filter kata kasar', id: `${P}antitoxicoff` },
          { title: '📵 Anti Tag SW — NYALA', description: 'Hapus + warn pengetag SW', id: `${P}antitagswon` },
          { title: '📵 Anti Tag SW — MATI', description: 'Biarkan tag SW', id: `${P}antitagswoff` },
          { title: '🗑️ Anti Delete — NYALA', description: 'Tampilkan pesan yang dihapus', id: `${P}antideleteon` },
          { title: '🔞 Blok NSFW', description: 'Blokir konten dewasa', id: `${P}bloknsfw` },
          { title: '🔇 Mute Non-Admin', description: 'Member tidak bisa kirim pesan', id: `${P}muteon` },
          { title: '🔊 Unmute', description: 'Buka lagi untuk semua member', id: `${P}muteoff` },
          { title: '⚠️ Warn', description: 'Beri peringatan ke member (3× = kick)', id: `${P}warn` },
          { title: '✅ Cabut Warn', description: 'Hapus peringatan member', id: `${P}cabutwarn` }
        ]
      },
      {
        title: '📊 Statistik & Alat',
        rows: [
          { title: '📈 Member Aktif', description: 'Peringkat pemakaian bot', id: `${P}memberaktif` },
          { title: '📊 Statistik Grup', description: 'Rekap aktivitas & setting', id: `${P}grupstat` },
          { title: '🔢 Total Member', description: 'Jumlah anggota', id: `${P}totalmember` },
          { title: '📣 Hidetag', description: 'Tag semua tanpa terlihat', id: `${P}hidetag` },
          { title: '🗳️ Buat Poll', description: 'Voting grup', id: `${P}buatpoll` },
          { title: '🙋 Absen', description: 'Mulai absen kehadiran', id: `${P}mulaiabsen` }
        ]
      },
      {
        title: 'ℹ️ Bantuan',
        rows: [
          { title: '📋 Semua Perintah Grup', description: 'Daftar lengkap kategori Group Menu', id: `${P}menugrup` },
          { title: '📚 Menu Utama', description: 'Semua fitur bot', id: `${P}menu` },
          { title: '👑 Owner', description: 'Kontak owner bot', id: `${P}owner` },
          { title: '🎮 Daftar Game', description: '70 game HTML app', id: `${P}gamerespon` }
        ]
      }
    ]

    try {
      await m.sendList({ text, title: '👥 GROUP MENU', buttonText: '📂 Buka Daftar', sections })
    } catch {
      await m.sendButtons({
        title: '👥 GROUP MENU',
        text: text + '\n\n_Pilih kelompok perintah:_',
        buttons: [
          { text: '🔒 Buka / Tutup', id: `${P}group` },
          { text: '🔇 Sider', id: `${P}sider` },
          { text: '✏️ Identitas', id: `${P}setname` },
          { text: '👋 Welcome', id: `${P}welcome` },
          { text: '🛡️ Proteksi', id: `${P}antilinkon` },
          { text: '📊 Statistik', id: `${P}grupstat` }
        ]
      }).catch(() => m.reply(text))
    }
    return { handled: true }
  }
}

/* ================================================================== */
/*  2. .open / .close                                                   */
/* ================================================================== */
export const bukaTutupGrup = {
  command: ['open', 'close', 'bukagrup', 'tutupgrup', 'gopen', 'gclose'],
  category: 'Group Menu',
  description: '🌐 Buka / 🔒 tutup grup (hanya admin yang boleh kirim pesan)',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async m => {
    const buka = ['open', 'bukagrup', 'gopen'].includes(m.command)
    const alasan = (m.q || '').trim()
    try {
      await m.sock.groupSettingUpdate(m.jid, buka ? 'not_announcement' : 'announcement')
    } catch (e) {
      return m.reply(`❌ Gagal mengubah setting grup: ${e?.message || e}`)
    }
    return m.reply(
      buka
        ? `🌐 *GRUP DIBUKA* — semua member boleh kirim pesan.${alasan ? `\n📝 ${alasan}` : ''}`
        : `🔒 *GRUP DITUTUP* — hanya admin yang boleh kirim pesan.${alasan ? `\n📝 ${alasan}` : ''}\n\nBuka lagi: ${P}open`
    )
  }
}

/* ================================================================== */
/*  3. .sider                                                           */
/* ================================================================== */
export const siderList = {
  command: ['sider', 'listider', 'anggotadiam', 'memberdiam', 'siderview', 'ceksider'],
  category: 'Group Menu',
  description: '👀 Daftar anggota diam (tag @nomor + nama, akurat untuk grup besar)',
  group: true,
  admin: true,
  limit: 0,
  run: async m => {
    const hari = hariArg(m)
    const semua = pesertaList(m)
    const petaAlias = aliasMap(m)
    /* maks besar: daftar diam JANGAN kepotong di grup besar (bug lama: maks 50) */
    const r = ringkasAktivitas(m.jid, semua, { hari, alias: petaAlias, maks: 2000 })
    const modeLid = m.addressingMode === 'lid'

    const baris = r.baris.map(b => ({ ...b, admin: adalahAdmin(m, b.key), bot: adalahBot(m, b.key), owner: adalahOwner(m, b.key) }))
    const diam = baris.filter(b => b.diam)
    const aktif = baris.filter(b => !b.diam)
    /* hitungan persis sama dengan filter .kicksider (aman = non-admin/bot/owner/bukan pemakai) */
    const diamBiasa = diam.filter(b => targetAman(m, b.key))
    /* paling lama diam (belum pernah terlihat) di atas */
    const urut = [...diam].sort((a, b) => (a.last || 0) - (b.last || 0))
    const tampil = urut.slice(0, 40)
    const hitung = b => b.nWin >= 0 ? `${b.nWin} pesan/${r.jendelaHari}hr` : `${b.n} pesan (total)`
    const bentuk = b => [...new Set([b.key, ...(petaAlias[b.key] || [])])]
    const notify = petaNotify(m)

    const teks =
      `🔇 *SIDER — ANGGOTA DIAM*\n` +
      `*${m.groupName}*\n\n` +
      `Jendela: *${r.jendelaHari} hari* terakhir · cakupan data: *${r.cakupan}*${r.matang ? '' : ' (pelacakan baru — hasil makin akurat tiap hari)'}\n` +
      `Anggota: ${r.total} (tercatat ${r.tercatat}) · aktif: ${aktif.length} · diam: ${r.diam}\n` +
      `Pesan ${r.jendelaHari} hari: ${r.jendelaPesan} · total tercatat: ${r.totalPesan}\n\n` +
      (tampil.length
        ? tampil.map((b, i) => {
          const tag = nomorTag(b.key, bentuk(b), modeLid)
          const nm = namaTampil(b.key, bentuk(b), notify).replace(/^@/, '')
          const peran = `${b.admin ? ' 🛡️admin' : ''}${b.bot ? ' 🤖bot' : ''}${b.owner ? ' 👑owner' : ''}`
          /* @nomor = TAG BENERAN (biru, tampil sebagai @nama); nama ditulis juga biar jelas */
          return `${i + 1}. @${tag} *${nm}*${peran}${b.n ? ` — ${hitung(b)}, terakhir ${lalu(b.last)}` : ' — belum pernah terlihat'}`
        }).join('\n')
        : '✅ Tidak ada anggota diam dalam jendela ini.') +
      (diam.length > tampil.length ? `\n…dan ${diam.length - tampil.length} lainnya.` : '') +
      `\n\n🧹 Layak dikick (non-admin/bot/owner): *${diamBiasa.length}*\n` +
      `Keluarkan: ${P}kicksider ${hari} → cek daftarnya, lalu ${P}kicksider ya\n` +
      `📊 Peringkat chat: ${P}totalchat ${hari}\n` +
      `ℹ️ WhatsApp tidak mengirim read-receipt grup ke bot, jadi "diam" = 0 pesan terlihat dalam jendela.`
    const sebut = [...new Set(tampil.flatMap(b => bentuk(b)))]
    const potong = teks.length > 3800 ? teks.slice(0, 3800) + '\n…' : teks
    await m.reply(potong, { mentions: sebut })
    return { handled: true }
  }
}

/*  3b. .totalchat — peringkat jumlah chat (kartu HTML animasi + geser)  */
/* ================================================================== */
/* peta nama WA asli dari metadata peserta: id/PN/LID -> notify */
const petaNotify = m => {
  const out = {}
  for (const p of (m.group?.participants || [])) {
    const nm = p.notify || p.pushName
    if (!nm) continue
    for (const id of [p.id, p.pn, p.lid]) if (id) out[id] = nm
  }
  return out
}
/* nomor untuk TAG BENERAN (@nomor + mentions = tag biru, tampil sebagai @nama di WA).
 * grup mode LID -> pakai nomor LID; selain itu pakai nomor PN; fallback bentuk lain. */
const nomorTag = (key, bentuk, modeLid) => {
  const semua = [key, ...(bentuk || [])].filter(Boolean)
  const cari = sfx => semua.find(k => String(k).endsWith(sfx))
  const utama = modeLid
    ? (cari('@lid') || cari('@s.whatsapp.net'))
    : (cari('@s.whatsapp.net') || cari('@lid'))
  return String(utama || key || '').split('@')[0]
}
/* nama tampil SELALU nama user (bukan LID/JID/angka) — format @namauser */
const namaTampil = (key, bentuk, notify) => {
  const bersih = v => {
    v = String(v || '').trim()
    return (v && !/^[0-9]+$/.test(v)) ? '@' + v.slice(0, 24) : ''
  }
  for (const k of [key, ...bentuk]) {
    const nm = bersih(notify[k])
    if (nm) return nm
  }
  try {
    for (const k of [key, ...bentuk]) {
      const u = getUser(k)
      const nm = bersih(u?.name) || bersih(u?.pushName)
      if (nm) return nm
    }
  } catch {}
  const semua = [key, ...bentuk]
  const pn = semua.find(k => /@s\.whatsapp\.net$/.test(k)) || semua.find(k => !/@lid$/.test(k)) || key
  return '@' + String(pn).split('@')[0]
}
const rincianTipe = t => {
  const p = []
  if (t.teks) p.push(`${t.teks} teks`)
  if (t.media) p.push(`${t.media} media`)
  if (t.stiker) p.push(`${t.stiker} stiker`)
  if (t.perintah) p.push(`${t.perintah} perintah`)
  return p.slice(0, 3).join(' · ') || 'belum ada rincian'
}
export const totalChat = {
  command: ['totalchat', 'topchat', 'totalpesan', 'peringkatchat', 'chatranking'],
  category: 'Group Menu',
  description: '💬 Peringkat chat grup: TAG @user + nama + kartu HTML top 15 (`.totalchat [hari]`)',
  group: true,
  limit: 0,
  cooldown: 5,
  run: async m => {
    const hari = hariArg(m)
    const petaAlias = aliasMap(m)
    const r = ringkasAktivitas(m.jid, pesertaList(m), { hari, alias: petaAlias, maks: 200 })
    const aktif = r.baris.filter(b => !b.diam)
    const saya = m.senderKey || m.sender
    const notify = petaNotify(m)
    const modeLid = m.addressingMode === 'lid'
    const list = aktif.map(b => {
      const nilai = b.nWin >= 0 ? b.nWin : b.n
      const bentuk = [...new Set([b.key, ...(petaAlias[b.key] || [])])]
      /* kartu HTML: @namauser (kartu tidak bisa nge-tag, jadi nama ditulis) */
      return { nama: namaTampil(b.key, bentuk, notify), nilai, ket: `${rincianTipe(b.tipe)} · terakhir ${lalu(b.last)}`, me: anyMatch(saya, bentuk), tag: bentuk }
    })
    const meIdx = list.findIndex(x => x.me)
    const top = list.slice(0, 15)
    const html = kartuTop(config.bot.name, {
      icon: '💬', nama: 'Total Chat', label: 'TOTAL CHAT', satuan: 'pesan',
      warna: '#67e8f9', bg1: '#164e63', bg2: '#0f172a',
      judul: 'Total Chat', sub: `${m.groupName || 'Grup'} · ${r.jendelaHari} hari · cakupan ${r.cakupan}`,
      list: top, me: meIdx >= 0 ? { rank: meIdx + 1, nilai: list[meIdx].nilai } : null
    })
    /* teks: @nomor = TAG BENERAN (biru, tampil sebagai @nama) + nama ditulis biar jelas */
    const baris = (x, head) => `@${nomorTag(x.tag[0], x.tag, modeLid)} *${x.nama.replace(/^@/, '')}* — ${x.nilai} pesan${x.me ? ' ← kamu' : ''}`
    const papanTop3 = top.slice(0, 3).map((x, i) => `${['🥇', '🥈', '🥉'][i]} ${baris(x)}`)
    const papanBawah = top.slice(3).map((x, i) => `${i + 4}. ${baris(x)}`)
    const teks =
      `💬 *TOTAL CHAT — ${m.groupName || 'GRUP'}*\n\n` +
      `Jendela: *${r.jendelaHari} hari* · cakupan: ${r.cakupan}\n` +
      `Total pesan jendela: *${r.jendelaPesan}* dari ${aktif.length} anggota aktif\n\n` +
      (top.length ? papanTop3.join('\n') + (papanBawah.length ? '\n———————————\n' + papanBawah.join('\n') : '') : 'Belum ada chat tercatat.') +
      (meIdx >= 15 ? `\n…\n#${meIdx + 1} kamu — ${list[meIdx].nilai} pesan` : '') +
      `\n\n🔇 Anggota diam: ${r.diam} → ${P}sider ${hari}`
    const sebut = [...new Set(top.flatMap(x => x.tag || []))]
    const ok = await kirimKartu(m, '💬 Total Chat', html, '')
    await m.reply(ok ? teks : teks + '\n\n_(kartu HTML tidak dapat dimuat di client ini)_', { mentions: sebut })
    return { handled: true }
  }
}

/*  4. .kicksider  (OWNER)                                              */
/* ================================================================== */
export const kickSider = {
  command: ['kicksider', 'tendangsider', 'hapussider', 'kickersider', 'buangsider'],
  category: 'Group Menu',
  description: '🧹 Keluarkan anggota yang tidak pernah terlihat mengirim pesan (owner, konfirmasi)',
  group: true,
  owner: true,
  botAdmin: true,
  limit: 0,
  run: async m => {
    const MAKS = 25
    const hari = konfirmasi(m) ? 7 : hariArg(m)
    const t = targetSider(m.jid, pesertaList(m), { hari, maks: MAKS, alias: aliasMap(m) })
    const layak = t.daftarDiam.filter(b => targetAman(m, b.key)).map(b => b.key)

    if (!layak.length) {
      return m.reply(`✅ Tidak ada anggota diam yang layak dikick (jendela ${t.jendelaHari} hari, ${t.diam} diam tapi semuanya admin/bot/owner).`)
    }

    if (!konfirmasi(m)) {
      return m.sendButtons({
        title: '🧹 KICK SIDER',
        text:
          `*${m.groupName}*\n\n` +
          `Jendela: ${t.jendelaHari} hari · anggota diam: ${t.diam}\n` +
          `Layak dikick (bukan admin/bot/owner): *${layak.length}*\n` +
          (t.dibatasi ? `⚠️ Dibatasi ${MAKS} orang per perintah supaya tidak kena limit WhatsApp.\n` : '') +
          `\n${layak.slice(0, 30).map((k, i) => `${i + 1}. ${angkaSingkat(k)}`).join('\n')}\n\n` +
          `Lanjutkan? ketik *${P}kicksider ya*\nBatal: jangan kirim apa-apa.`,
        buttons: [
          { text: '🧹 Ya, kick', id: `${P}kicksider ya` },
          { text: '👀 Lihat daftar lengkap', id: `${P}sider ${hari}` },
          { text: '❌ Batal', id: `${P}groupmenu` }
        ]
      }).catch(() => m.reply(`Konfirmasi: ${P}kicksider ya`))
    }

    const potong = layak.slice(0, MAKS)
    await m.reply(`🧹 Mengeluarkan ${potong.length} anggota diam… mohon tunggu.`)
    const h = await aksiBatch(m, potong, 'remove')
    return m.reply(
      `🧹 *KICK SIDER SELESAI*\n\n` +
      `✅ Berhasil: ${h.ok.length}\n` +
      `❌ Gagal: ${h.gagal.length}${h.gagal.length ? `\n${h.gagal.slice(0, 10).map(x => `• ${angkaSingkat(x.jid)} — ${x.status}`).join('\n')}` : ''}\n` +
      (layak.length > potong.length ? `\nSisa ${layak.length - potong.length} orang: jalankan ${P}kicksider lagi.\n` : '') +
      `\nJendela pelacakan: ${t.jendelaHari} hari.`
    )
  }
}

/* ================================================================== */
/*  5. .kickall  (OWNER)                                                */
/* ================================================================== */
export const kickAll = {
  command: ['kickall', 'tendangsemua', 'kikall', 'bersihkangrup', 'kicksemua'],
  category: 'Group Menu',
  description: '💥 Keluarkan SEMUA anggota non-admin dari grup (owner, konfirmasi)',
  group: true,
  owner: true,
  botAdmin: true,
  limit: 0,
  run: async m => {
    const MAKS = 60
    const semua = pesertaList(m).filter(j => targetAman(m, j))

    if (!semua.length) return m.reply('✅ Tidak ada anggota non-admin yang bisa dikeluarkan.')

    if (!konfirmasi(m)) {
      return m.sendButtons({
        title: '💥 KICK SEMUA',
        text:
          `⚠️ *OPERASI BERBAHAYA*\n\n*${m.groupName}*\n` +
          `Anggota yang akan dikeluarkan: *${Math.min(semua.length, MAKS)}* dari ${semua.length} non-admin.\n` +
          `Admin, bot, owner, dan kamu sendiri TIDAK ikut.\n\n` +
          (semua.length > MAKS ? `Dibatasi ${MAKS} orang per perintah — jalankan lagi untuk sisanya.\n\n` : '') +
          `Lanjutkan? ketik *${P}kickall ya*`,
        buttons: [
          { text: '💥 Ya, kick semua', id: `${P}kickall ya` },
          { text: '🧹 Hanya sider', id: `${P}kicksider` },
          { text: '❌ Batal', id: `${P}groupmenu` }
        ]
      }).catch(() => m.reply(`Konfirmasi: ${P}kickall ya`))
    }

    const potong = semua.slice(0, MAKS)
    await m.reply(`💥 Mengeluarkan ${potong.length} anggota… ini bisa makan waktu ~${Math.round(potong.length / 5) * 2} detik.`)
    const h = await aksiBatch(m, potong, 'remove', 5, 1500)
    return m.reply(
      `💥 *KICKALL SELESAI*\n\n✅ Berhasil: ${h.ok.length}\n❌ Gagal: ${h.gagal.length}` +
      `${h.gagal.length ? `\n${h.gagal.slice(0, 10).map(x => `• ${angkaSingkat(x.jid)} — ${x.status}`).join('\n')}` : ''}` +
      `${semua.length > potong.length ? `\n\nSisa ${semua.length - potong.length} orang: ${P}kickall ya` : ''}`
    )
  }
}

/* ================================================================== */
/*  6. .demoteall  (OWNER)                                              */
/* ================================================================== */
export const demoteAll = {
  command: ['demoteall', 'turunkansemua', 'demotesemua', 'copotadmin'],
  category: 'Group Menu',
  description: '⬇️ Turunkan semua admin jadi member biasa (owner, konfirmasi)',
  group: true,
  owner: true,
  botAdmin: true,
  limit: 0,
  run: async m => {
    const admin = pesertaList(m).filter(j => adalahAdmin(m, j) && !adalahBot(m, j) && !adalahOwner(m, j) && !adalahAku(m, j))
    if (!admin.length) return m.reply('✅ Tidak ada admin lain yang bisa diturunkan.')

    if (!konfirmasi(m)) {
      return m.sendButtons({
        title: '⬇️ DEMOTE SEMUA ADMIN',
        text: `Admin yang akan diturunkan: *${admin.length}*\n\n${admin.map((j, i) => `${i + 1}. ${angkaSingkat(j)}`).join('\n')}\n\nBot, owner, dan kamu tidak ikut.\nLanjutkan? *${P}demoteall ya*`,
        buttons: [
          { text: '⬇️ Ya, demote', id: `${P}demoteall ya` },
          { text: '❌ Batal', id: `${P}groupmenu` }
        ]
      }).catch(() => m.reply(`Konfirmasi: ${P}demoteall ya`))
    }

    const h = await aksiBatch(m, admin.slice(0, 25), 'demote', 5, 1200)
    return m.reply(`⬇️ *DEMOTEALL*\n\n✅ Berhasil: ${h.ok.length}\n❌ Gagal: ${h.gagal.length}`)
  }
}

/* ================================================================== */
/*  7. .cn — "costum name": ubah NAMA ORANG dengan FONT unicode         */
/* ------------------------------------------------------------------ */
/*  BUKAN untuk mengganti nama grup (itu perintah .setname).            */
/*  .cn <nama>            → semua gaya font untuk nama itu              */
/*  .cn <nomor> <nama>    → satu gaya tertentu (lihat .cn list)         */
/*  .cn <gaya> <nama>     → cari gaya dari namanya                      */
/*  .cn (balas pesan)     → pakai teks pesan yang dibalas sebagai nama  */
/* ================================================================== */
export const costumName = {
  command: ['cn', 'costumname', 'customname', 'fontnama', 'namafont', 'stylenama', 'namakfont', 'namaestetik'],
  category: 'Group Menu',
  description: '📛 Ubah nama orang dengan font keren (siap salin) — `.cn Arif` atau `.cn 5 Arif`. Ganti nama grup: .setname',
  limit: 0,
  run: async m => {
    const P2 = P
    const mentah = (m.q || m.args.join(' ') || '').trim()
    const dariBalasan = String(m.quoted?.text || m.quoted?.caption || '').trim()

    /* .cn list → daftar nama gaya + nomornya */
    if (/^(list|daftar|gaya)$/.test(mentah.toLowerCase())) {
      const gaya = daftarGaya()
      return m.reply(
        `📛 *DAFTAR GAYA FONT .cn* — ${gaya.length} gaya\n\n` +
        gaya.map((g, i) => `${i + 1}. ${g.nama} — ${g.fn('Nama')}`).join('\n') +
        `\n\nPakai: \`${P2}cn <nomor> <nama>\` — contoh: \`${P2}cn 8 Arif\``
      )
    }

    let nama = mentah
    let satuGaya = null

    /* bentuk: .cn <nomor> <nama> */
    let cocok = /^(\d{1,2})\s+(.+)$/.exec(mentah)
    if (cocok) {
      const gaya = daftarGaya()
      const n = parseInt(cocok[1], 10)
      if (n < 1 || n > gaya.length) return m.reply(`❌ Gaya nomor ${n} tidak ada (1–${gaya.length}). Lihat: \`${P2}cn list\``)
      satuGaya = gaya[n - 1]
      nama = cocok[2].trim()
    } else {
      /* bentuk: .cn <gaya> <nama> — kata pertama cocok dengan nama gaya */
      const kata = mentah.split(/\s+/)
      if (kata.length > 1) {
        const g = gayaTertentu('_', kata[0]) /* uji: gayaTertentu butuh nama, di bawah dipakai terbalik */
        void g
        const ketemu = daftarGaya().find(x => x.nama.toLowerCase().includes(kata[0].toLowerCase()))
        if (ketemu && kata.slice(1).join(' ').trim()) {
          satuGaya = ketemu
          nama = kata.slice(1).join(' ').trim()
        }
      }
    }

    /* tanpa teks: pakai pesan yang dibalas */
    if (!nama && dariBalasan) nama = dariBalasan

    if (!nama) {
      return m.reply(
        '📛 *CUSTOM NAME — ubah nama orang dengan font*\n\n' +
        `• \`${P2}cn Arif\` → semua gaya\n` +
        `• \`${P2}cn 8 Arif\` → satu gaya (nomor dari \`${P2}cn list\`)\n` +
        `• \`${P2}cn gotik Arif\` → cari gaya dari namanya\n` +
        `• balas pesan orang lalu \`${P2}cn\` → pakai teksnya\n\n` +
        'Hasilnya tinggal *ditahan lalu salin* ✂️\n' +
        `_(Kalau mau ganti NAMA GRUP, pakai \`${P2}setname\`)_`
      )
    }
    if (nama.length > 30) return m.reply(`❌ Nama kepanjangan (${nama.length}/30 karakter) — font hias jadi berantakan kalau terlalu panjang.`)

    /* satu gaya */
    if (satuGaya) {
      const t = satuGaya.fn(nama)
      return m.reply(`📛 *CUSTOM NAME* — ${satuGaya.nama}\n\n${t}\n\n_Tahan teks ini untuk menyalin_ ✂️\nSemua gaya: \`${P2}cn ${nama}\``)
    }

    /* semua gaya */
    const hasil = gayaNama(nama)
    const teks =
      `📛 *CUSTOM NAME — “${nama.length > 22 ? nama.slice(0, 22) + '…' : nama}”* (${hasil.length} gaya)\n\n` +
      hasil.map((g, i) => `*${i + 1}.* ${g.teks}  _(${g.nama})_`).join('\n\n') +
      `\n\n✂️ Tahan salah satu teks di atas untuk *menyalin*.\nSatu gaya saja: \`${P2}cn <nomor> ${nama}\` · daftar: \`${P2}cn list\``
    return m.reply(truncate(teks, 3800))
  }
}

/* ================================================================== */
/*  8. .addall — tambah banyak nomor                                    */
/* ================================================================== */
export const addAll = {
  command: ['addall', 'tambahsemua', 'addmassal', 'undangbanyak', 'addbatch'],
  category: 'Group Menu',
  description: '➕ Tambah beberapa nomor sekaligus ke grup (maks 10 per perintah)',
  group: true,
  admin: true,
  botAdmin: true,
  limit: 0,
  run: async m => {
    const MAKS = 10
    const teks = (m.q || m.args.join(' ') || '').trim()
    if (!teks) return m.reply(`➕ *ADD MASSAL*\n\nCara pakai: ${P}addall 628111111 628222222\nPisahkan dengan spasi/koma, maksimal ${MAKS} nomor.\n\nNomor yang mengunci privasi "hanya admin" tidak bisa ditambahkan — kirim link: ${P}linkgroup`)

    const angka = [...new Set(
      teks.split(/[\s,;|]+/).map(x => x.replace(/[^0-9]/g, '')).filter(x => x.length >= 9 && x.length <= 15)
    )]
    if (!angka.length) return m.reply('❌ Tidak ada nomor yang valid. Contoh: ' + P + 'addall 628111111 628222222')

    const daftar = angka.slice(0, MAKS).map(x => (x.startsWith('0') ? '62' + x.slice(1) : x) + '@s.whatsapp.net')
    const sudah = new Set(pesertaList(m).map(j => String(j).split('@')[0]))
    const baru = daftar.filter(j => !sudah.has(String(j).split('@')[0]))
    if (!baru.length) return m.reply('ℹ️ Semua nomor itu sudah jadi anggota grup.')

    const h = await aksiBatch(m, baru, 'add', 3, 1500)
    const kode = h.gagal.length ? await m.sock.groupInviteCode(m.jid).catch(() => null) : null
    return m.reply(
      `➕ *ADD MASSAL*\n\nDiminta: ${daftar.length} · sudah anggota: ${daftar.length - baru.length}\n` +
      `✅ Berhasil: ${h.ok.length}${h.ok.length ? '\n' + h.ok.map(j => `• ${angkaSingkat(j)}`).join('\n') : ''}\n` +
      `❌ Gagal: ${h.gagal.length}${h.gagal.length ? `\n${h.gagal.map(x => `• ${angkaSingkat(x.jid)} — ${x.status}`).join('\n')}` : ''}` +
      (angka.length > MAKS ? `\n\nSisa ${angka.length - MAKS} nomor: jalankan lagi.` : '') +
      (kode ? `\n\nPrivasi nomor terkunci? kirim link ini ke mereka:\nhttps://chat.whatsapp.com/${kode}` : ''),
      { mentions: h.ok }
    )
  }
}

/* ================================================================== */
/*  9. .resetaktif — mulai ulang pelacakan                              */
/* ================================================================== */
export const resetAktif = {
  command: ['resetaktif', 'resetaktivitas', 'mulaillacak', 'resetlacasider', 'resetpelacakan'],
  category: 'Group Menu',
  description: '🔄 Mulai ulang pencatatan aktivitas grup (dipakai .sider)',
  group: true,
  admin: true,
  limit: 0,
  run: async m => {
    const sebelum = grupAktivitas(m.jid)
    const n = Object.keys(sebelum.anggota || {}).length
    const pesan = ringkasAktivitas(m.jid, pesertaList(m), { hari: 30, alias: aliasMap(m) }).totalPesan
    resetAktivitas(m.jid)
    return m.reply(
      `🔄 *PELACAKAN AKTIVITAS DIRESET*\n\n` +
      `Terhapus: ${n} catatan anggota · ${pesan} pesan tercatat\n` +
      `Mulai sekarang: ${new Date().toLocaleString('id-ID')}\n\n` +
      `Daftar sider baru akurat setelah beberapa hari: ${P}sider 7`
    )
  }
}

/* ================================================================== */
/*  8. .tagall & .catatan — utilitas panggilan & catatan grup (v7.7.1)  */
/* ================================================================== */
export const catatanGrup = {
  command: ['catatan', 'notegroup', 'catatangrup', 'noteresmi', 'catatanresmi'],
  category: 'Group Menu',
  description: '📝 Catatan bersama grup — `.catatan <isi>` simpan, `.catatan` daftar, `.catatan baca 2`, `.catatan hapus 2`',
  group: true,
  limit: 0,
  cooldown: 3,
  run: m => {
    const g = getGroup(m.jid)
    if (!g.catatan) g.catatan = []
    const q = String(m.q || '').trim()
    const MAKS = 15

    if (!q || /^(list|daftar|semua)$/i.test(q)) {
      if (!g.catatan.length) return m.reply(`📝 *CATATAN GRUP*\n\nBelum ada catatan.\nSimpan: \`${P}catatan besok libur tanggal merah\``)
      return m.sendButtons({
        title: '📝 Catatan Grup',
        text: `📝 *CATATAN GRUP* (${g.catatan.length}/${MAKS})\n\n` +
          g.catatan.map((c, i) => `*${i + 1}.* ${truncate(c.isi, 34)}\n   _@${c.oleh.split('@')[0]} · ${new Date(c.waktu).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}_`).join('\n') +
          `\n\nDetail: \`${P}catatan <nomor>\` · simpan: \`${P}catatan <teks>\``,
        footer: config.bot.footer,
        buttons: [
          { text: '📜 Baca No. 1', id: `${P}catatan 1` },
          { text: '🗑 Hapus (admin)', id: `${P}catatan hapus 1` }
        ]
      }).catch(() => m.reply('📝 ' + g.catatan.map((c, i) => (i + 1) + '. ' + truncate(c.isi, 40)).join('\n')))
    }

    const hapus = /^hapus\s+(\d{1,2})$/.exec(q)
    if (hapus) {
      const n = parseInt(hapus[1], 10)
      const no = n - 1
      if (no < 0 || no >= g.catatan.length) return m.reply(`❌ Catatan nomor ${n} tidak ada (1–${g.catatan.length}).`)
      const target = g.catatan[no]
      const penulis = target.oleh === (m.senderKey || m.sender) || anyMatch([target.oleh], [m.sender, ...(m.senderAlts || [])])
      if (!(m.isAdmin || m.isOwner || penulis)) return m.reply('🛡️ Hanya admin atau penulis catatannya yang boleh menghapus.')
      g.catatan.splice(no, 1)
      saveNow('groups')
      return m.reply(`🗑️ Catatan #${n} dihapus: _${truncate(target.isi, 60)}_`)
    }

    const baca = /^(\d{1,2})$/.exec(q)
    if (baca) {
      const no = parseInt(baca[1], 10) - 1
      const c = g.catatan[no]
      if (!c) return m.reply(`❌ Catatan nomor ${baca[1]} tidak ada (1–${g.catatan.length}).`)
      return m.reply(`📝 *CATATAN #${no + 1}*\n\n${c.isi}\n\n_@${c.oleh.split('@')[0]} · ${new Date(c.waktu).toLocaleString('id-ID')}_`, { mentions: [c.oleh] })
    }

    /* simpan catatan baru */
    if (g.catatan.length >= MAKS) return m.reply(`❌ Catatan penuh (${MAKS}). Hapus dulu: \`${P}catatan hapus <nomor>\``)
    if (q.length > 500) return m.reply(`❌ Catatan maksimal 500 karakter (${q.length}).`)
    g.catatan.push({ isi: truncate(q, 500), oleh: m.senderKey || m.sender, waktu: Date.now() })
    saveNow('groups')
    return m.reply(`✅ *CATATAN DISIMPAN (#${g.catatan.length})*\n\n${truncate(q, 120)}\n\nLihat semua: \`${P}catatan\``)
  }
}

/* ================================================================== */
/*  9. .totag — ping 1 anggota dengan tandanya (admin)  (v7.8.0)      */
/* ================================================================== */
export const toTag = {
  command: ['totag', 'tagmember', 'pingmember', 'sebutmember', 'panggilmber', 'mentionmember'],
  category: 'Group Menu',
  description: '📣 Panggil/tag 1 anggota utk yang balas/nomor/pilih — `.totag` (balas = kalimat ping) · `.totag 628xxx halo bob` atau tag orangnya',
  group: true,
  admin: true,
  limit: 0,
  cooldown: 4,
  run: async m => {
    const partisipan = m.group?.participants || []
    const mentah =
      m.mentioned?.[0] ||
      (m.quoted?.sender) ||
      (m.args[0] ? (String(m.args[0]).replace(/[^0-9]/g, '') + '@s.whatsapp.net') : null)

    if (!mentah) {
      return m.reply(
        `📣 *TO-TAG — ping 1 anggota dgn tanda_ tapi TIDAK terlihat di antara ramai_*

` +
        `Cara:
` +
        `• balas pesannya lalu \`${P}totag <teks ping-nya>\`
` +
        `• \`${P}totag 628202 chang jangan lupa mendaftar skripsi!\`

` +
        `Untuk seluruh anggota: \`${P}hidetag\` / \`${P}tagall\``
      )
    }

    const kandidat = [...new Set([mentah, ...aliasesOf(mentah)].filter(Boolean))]
    const p = findParticipant(partisipan, kandidat) || null
    const jidPing = p ? (p.id || p.pn || p.lid) : mentah
    const target = [jidPing, p?.pn, p?.lid, ...kandidat].filter(Boolean)
    const jidAman = [...new Set(target)]
    const TAMPIL = jidPing.split('@')[0]

    const teks = truncate(String((m.q || '').replace(mentah.split('@')[0], '').trim() || m.quoted?.text || ''), 400) || 'halo'
    return m.reply(
      `📣 @${TAMPIL}

“${teks}”

_— dari @${m.sender.split('@')[0]} (totag)_`,
      { mentions: [...new Set([...jidAman, m.sender])] }
    )
  }
}

export const DAFTAR_GROUPMENU = [
  { cmd: 'groupmenu', icon: '👥', nama: 'Group Menu', ket: 'hub semua perintah kelola grup' },
  { cmd: 'open', icon: '🌐', nama: 'Buka Grup', ket: 'semua member boleh kirim pesan' },
  { cmd: 'close', icon: '🔒', nama: 'Tutup Grup', ket: 'hanya admin yang boleh kirim pesan' },
  { cmd: 'sider', icon: '👀', nama: 'Sider', ket: 'daftar anggota yang tak pernah terlihat mengirim pesan' },
  { cmd: 'kicksider', icon: '🧹', nama: 'Kick Sider', ket: 'keluarkan anggota diam (owner, konfirmasi)' },
  { cmd: 'kickall', icon: '💥', nama: 'Kick All', ket: 'keluarkan semua non-admin (owner, konfirmasi)' },
  { cmd: 'demoteall', icon: '⬇️', nama: 'Demote All', ket: 'turunkan semua admin (owner, konfirmasi)' },
  { cmd: 'setname', icon: '📝', nama: 'Set Name', ket: 'ganti nama grup (admin, maks 25 karakter)' },
  { cmd: 'cn', icon: '✒️', nama: 'Custom Name', ket: 'ubah nama orang dengan font keren (siap salin)' },
  { cmd: 'addall', icon: '➕', nama: 'Add Massal', ket: 'tambah sampai 10 nomor sekaligus' },
  { cmd: 'resetaktif', icon: '🔄', nama: 'Reset Aktivitas', ket: 'mulai ulang pencatatan untuk .sider' },
  { cmd: 'catatan', icon: '📝', nama: 'Catatan', ket: 'catatan bersama grup (simpan/baca/hapus)' },
  { cmd: 'totag', icon: '📣', nama: 'To-Tag', ket: 'ping 1 anggota spesifik, tanpa tagall (admin)' }
]

export default {
  groupMenu, bukaTutupGrup, siderList, kickSider, kickAll,
  demoteAll, costumName, addAll, resetAktif,
  catatanGrup, toTag
}
