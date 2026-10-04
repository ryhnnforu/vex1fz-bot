/**
 * 🔘 TOBUTTON + 👑 TOPREMIUM  v7.37.0
 * ------------------------------------------------------------------
 *  • .tobutton <nama fitur> | <judul> | <label1>: <teks1> | <label2>: <teks2> …
 *      Mengubah teks balasan sebuah fitur menjadi *button list*.
 *      Tidak menulis ulang file fitur: tombol dikirim sebagai BALASAN
 *      atas teks asli lewat overlay `settings.tombolFitur`, jadi fitur
 *      bawaan maupun buatan `.>_` sama-sama bisa dipakai tanpa risiko
 *      merusak kodenya.
 *
 *  • .topremium <nama fitur>
 *      (OWNER) Mengunci sebuah fitur jadi khusus user PREMIUM.
 *      User free yang mengetik fitur itu dapat pesan upgrade.
 *      `.topremium <fitur> reset` membuka kembali.
 *      Gerbang dipasang di handlers/message.js (premiumCmd), mengikuti
 *      pola `cmdMode` yang sudah ada.
 *
 *  Keduanya menyimpan state di database/settings.json (loadDB cache),
 *  sehingga tahan restart dan tidak perlu `.reloadfitur`.
 */
import { config } from '../config.js'
import { getSettings, saveNow } from '../lib/database.js'
import { findPlugin, listPlugins } from '../lib/plugins.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const MAKS_TOMBOL = 6
const MAKS_LABEL = 24
const MAKS_JUDUL = 60
const MAKS_TEKS = 200

/* ================================================================== */
/*  util: urai argumen bentuk `judul | label: teks | label: teks`      */
/* ================================================================== */

/**
 * Urai argumen .tobutton.
 * Format: `<nama fitur> | <judul> | <label1>: <teks1> | <label2>: <teks2> …`
 * Bagian pertama = nama fitur (wajib), sisanya opsional.
 * Kalau judul tidak diisi, judul diambil dari deskripsi plugin.
 * @returns {{fitur:string, judul:string, tombol:Array<{text:string,id:string}>, mentah:string[]}}
 */
export function uraiTombol (q) {
  const mentah = String(q || '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)

  /* Bagian pertama bisa dua bentuk:
     1. `toanime: pilih button dibawah ini`  → nama + judul menempel
     2. `toanime`                            → nama saja, judul di bagian berikutnya */
  const kepala = String(mentah.shift() || '')
  let fitur = kepala
  let judul = ''
  const pisahKepala = kepala.indexOf(':')
  if (pisahKepala > 0) {
    fitur = kepala.slice(0, pisahKepala)
    judul = kepala.slice(pisahKepala + 1).trim()
  }
  fitur = fitur.trim().replace(/^\.+/, '').toLowerCase()

  /* `.tobutton menu reset` → kata terakhir bisa perintah (reset/hapus),
     bukan bagian dari nama fitur. Pisahkan sebelum dipakai mencari plugin. */
  const KATA_AKSI = /^(reset|hapus|buka|off|mati|status|cek|info|lihat)$/i
  const potonganFitur = fitur.split(/\s+/)
  let aksi = ''
  if (potonganFitur.length > 1 && KATA_AKSI.test(potonganFitur[potonganFitur.length - 1])) {
    aksi = potonganFitur.pop().toLowerCase()
    fitur = potonganFitur.join(' ').trim()
  }

  const tombol = []

  for (const bagian of mentah) {
    /* `label: teks` → tombol. Tanpa `:` → dianggap judul (bagian pertama saja). */
    const pisah = bagian.indexOf(':')
    if (pisah > 0) {
      const label = bagian.slice(0, pisah).trim()
      const teks = bagian.slice(pisah + 1).trim()
      if (!label) continue
      /* `button 1: Nama teks` → labelnya "Nama teks"? Tidak: yang dimaksud
         user adalah "button 1" sebagai NOMOR, dan teks setelah ":" sebagai
         ISI perintah. Jadi label tampil = "Button 1", isi = perintah.
         Kalau label bebas (mis. `play: play lagu`) dipakai apa adanya. */
      const nomor = String(bagian.slice(0, pisah)).match(/\d+/)
      const nama = /^(button|btn|tombol)\s*\d*$/i.test(label)
        ? ((label.match(/^(button|btn|tombol)/i)[0]).replace(/^./, c => c.toUpperCase()) +
           (nomor ? ' ' + nomor[0] : ''))
        : label
      tombol.push({
        text: truncate(nama || `Opsi ${tombol.length + 1}`, MAKS_LABEL),
        /* teks jadi perintah yang dikirim: kalau sudah berawalan prefix dipakai apa adanya */
        id: teks.startsWith(P) ? teks : (teks ? P + teks.replace(/^\.+/, '') : P + fitur)
      })
    } else if (!judul) {
      judul = bagian
    }
  }
  return { fitur, judul: truncate(judul, MAKS_JUDUL), tombol: tombol.slice(0, MAKS_TOMBOL), mentah, aksi }
}

/** daftar fitur premium aktif dari settings */
export function daftarPremiumCmd () {
  try {
    const s = getSettings()
    return Object.keys(s.premiumCmd || {}).filter(k => findPlugin(k))
  } catch { return [] }
}

/** daftar fitur yang punya overlay tombol */
export function daftarTombolFitur () {
  try {
    const s = getSettings()
    return Object.keys(s.tombolFitur || {}).filter(k => findPlugin(k))
  } catch { return [] }
}

/**
 * Cari nama plugin dari masukan bebas (perintah/alias/berkas).
 * @returns {{name:string, plugin:object}|null}
 */
function cariFitur (q) {
  const nama = String(q || '').replace(/^\.+/, '').replace(/\.js$/i, '').trim().toLowerCase()
  if (!nama) return null
  const ketemu = findPlugin(nama)
  if (ketemu?.plugin) return ketemu
  /* coba cocokkan dengan nama berkas: `tiktokdl` -> plugin di tiktokdl.js */
  for (const p of listPlugins()) {
    if (String(p.fileName || '').replace(/\.js$/i, '').toLowerCase() === nama) {
      const byName = findPlugin(p.name)
      if (byName?.plugin) return byName
    }
  }
  return null
}

/* ================================================================== */
/*  1. .tobutton                                                       */
/* ================================================================== */
export const toButton = {
  command: ['tobutton', 'jadibutton', 'buttonfitur', 'fiturbutton', 'ubahbutton', 'buttonlist'],
  category: 'Owner Menu',
  description: '🔘 Ubah teks balasan sebuah fitur jadi button list — `.tobutton toanime | Pilih gaya | Anime: toanime`',
  owner: true,
  limit: 0,
  cooldown: 3,
  contoh: 'toanime | pilih button dibawah ini | button 1: toanime | button 2: menu',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const settings = getSettings()
    if (!settings.tombolFitur) settings.tombolFitur = {}

    /* ---- tanpa argumen / perintah bantu ---- */
    const sub = String(q.split('|')[0] || '').trim().toLowerCase()
    if (!q || /^(list|daftar|semua|help|bantuan|cara|\?)$/.test(sub)) {
      const aktif = daftarTombolFitur()
      const contoh = ['toanime', 'tiktok', 'play', 'menu'].filter(x => findPlugin(x))
      const teks =
        `🔘 *TOBUTTON — TEKS FITUR JADI BUTTON LIST*\\n\\n` +
        `Cara pakai:\\n` +
        `\`${P}tobutton <nama fitur> | <judul> | button 1: <teks> | button 2: <teks>\`\\n\\n` +
        `Contoh:\\n` +
        `\`${P}tobutton ${contoh[0] || 'toanime'}: pilih button dibawah ini| button 1: Nama teks | button 2: nama teks | button 3: nama teks\`\\n\\n` +
        `Bagian setelah \`:\` adalah *perintah yang dikirim* saat tombol ditekan.\\n` +
        `Maksimal *${MAKS_TOMBOL} tombol*. Teks asli fitur tetap tampil, tombolnya menyusul di bawah.\\n\\n` +
        (aktif.length
          ? `*Sudah dipasang (${aktif.length}):*\\n${aktif.slice(0, 15).map(c => `▸ \`${P}${c}\``).join('\\n')}${aktif.length > 15 ? '\\n…' : ''}\\n\\n`
          : `Belum ada fitur yang dipasang tombol.\\n\\n`) +
        `Hapus: \`${P}tobutton <fitur> reset\` · Semua: \`${P}tobutton resetsemua\``
      return m.sendButtons({
        title: '🔘 TOBUTTON',
        text: teks,
        footer: config.bot.footer,
        buttons: contoh.slice(0, 3).map(c => ({ text: `🎨 Coba ${c}`, id: `${P}tobutton ${c}: pilih button dibawah ini | button 1: ${c} | button 2: ${P}menu` }))
          .concat([{ text: '📋 Yang terpasang', id: `${P}tobutton list` }])
      }).catch(() => m.reply(teks))
    }

    /* ---- reset semua ---- */
    if (/^(resetsemua|hapussemua|clear)$/.test(sub)) {
      const n = Object.keys(settings.tombolFitur).length
      settings.tombolFitur = {}
      saveNow('settings')
      return m.reply(`✅ *${n} overlay tombol* dihapus. Semua fitur kembali tanpa tombol tambahan.`)
    }

    /* ---- reset satu fitur ---- */
    const urai = uraiTombol(q)
    if (!urai.fitur) return m.reply(`❌ Sebutkan nama fiturnya.\\nContoh: \`${P}tobutton toanime | pilih | button 1: toanime\``)

    const ketemu = cariFitur(urai.fitur)
    if (!ketemu?.plugin) return m.reply(`❌ Fitur *${urai.fitur}* tidak ditemukan.\\nCek nama: \`${P}carifitur ${urai.fitur}\``)

    const nama = ketemu.name
    const alias = (ketemu.plugin.command || [nama]).map(c => `${P}${c}`).join(' ')

    if (/^(reset|hapus|buka|off|mati)$/.test(urai.aksi)) {
      if (!settings.tombolFitur[nama]) return m.reply(`ℹ️ \`${P}${nama}\` memang belum punya tombol tambahan.`)
      delete settings.tombolFitur[nama]
      saveNow('settings')
      return m.reply(`✅ Tombol tambahan \`${P}${nama}\` dihapus. Teks fitur tampil seperti semula.`)
    }

    /* ---- pasang ---- */
    if (!urai.tombol.length) {
      return m.reply(
        `❌ Belum ada tombolnya.\\n\\n` +
        `Format: \`${P}tobutton ${nama}: <judul> | button 1: <teks> | button 2: <teks>\`\\n` +
        `Contoh: \`${P}tobutton ${nama}: pilih button dibawah ini | button 1: ${nama} | button 2: ${P}menu\``
      )
    }

    const judul = urai.judul || truncate(ketemu.plugin.description || `Pilihan ${nama}`, MAKS_JUDUL)
    settings.tombolFitur[nama] = { judul, tombol: urai.tombol, oleh: m.sender, waktu: Date.now() }
    saveNow('settings')

    await m.react?.('🔘').catch(() => {})
    const teks =
      `🔘 *BUTTON LIST TERPASANG — ${nama.toUpperCase()}*\\n` +
      `📁 \`${ketemu.plugin.fileName || '-'}\`\\n` +
      `🔗 ${alias}\\n\\n` +
      `*Judul:* ${judul}\\n` +
      `*Tombol (${urai.tombol.length}):*\\n` +
      urai.tombol.map((b, i) => `${i + 1}. *${b.text}* → \`${b.id}\``).join('\\n') +
      `\\n\\n✅ Setiap kali ada yang memakai \`${P}${nama}\`, teks asli fitur tampil lalu tombol ini menyusul di bawahnya.\\n` +
      `Hapus: \`${P}tobutton ${nama} reset\``

    /* pratinjau sungguhan: kirim tombol yang baru dipasang */
    await m.sendButtons({
      title: '👁️ Pratinjau tombol',
      text: `*PRATINJAU — ${nama}*\\n\\n` + judul + '\\n\\n_Teks asli fitur akan tampil di sini, tombol menyusul di bawahnya._',
      footer: config.bot.footer,
      buttons: urai.tombol.concat([{ text: '🔄 Ulangi', id: `${P}${nama}` }]).slice(0, MAKS_TOMBOL)
    }).catch(() => {})

    return m.reply(teks)
  }
}

/* ================================================================== */
/*  2. .topremium                                                      */
/* ================================================================== */
export const toPremium = {
  command: ['topremium', 'premiumfitur', 'fiturpremium', 'kuncipremium', 'premiumlock'],
  category: 'Owner Menu',
  description: '👑 Kunci sebuah fitur jadi khusus user premium — `.topremium play`',
  owner: true,
  limit: 0,
  cooldown: 3,
  contoh: 'play',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()
    const settings = getSettings()
    if (!settings.premiumCmd) settings.premiumCmd = {}

    const args = q.split(/\s+/).filter(Boolean)
    const sub = String(args[0] || '').toLowerCase()

    /* ---- daftar / bantuan ---- */
    if (!q || /^(list|daftar|semua|help|bantuan|cara|\?)$/.test(sub)) {
      const aktif = daftarPremiumCmd()
      const contoh = ['play', 'tiktok', 'toanime'].filter(x => findPlugin(x))
      const teks =
        `👑 *TOPREMIUM — KUNCI FITUR JADI PREMIUM*\\n\\n` +
        `Fitur yang dikunci hanya bisa dipakai *user premium*.\\n` +
        `User free yang mengetiknya dapat pesan upgrade (bukan error).\\n\\n` +
        `Cara pakai:\\n` +
        `• \`${P}topremium <nama fitur>\` → kunci jadi premium\\n` +
        `• \`${P}topremium <nama fitur> reset\` → buka kembali\\n` +
        `• \`${P}topremium list\` → daftar yang dikunci\\n\\n` +
        `Contoh: \`${P}topremium ${contoh[0] || 'play'}\`\\n\\n` +
        (aktif.length
          ? `*Terkunci (${aktif.length}):*\\n${aktif.slice(0, 20).map(c => `▸ \`${P}${c}\` 💎`).join('\\n')}${aktif.length > 20 ? '\\n…' : ''}\\n\\n`
          : `Belum ada fitur premium tambahan.\\n\\n`) +
        `_Catatan: kamu (owner) selalu bisa memakai fitur apa pun._`
      return m.sendButtons({
        title: '👑 TOPREMIUM',
        text: teks,
        footer: config.bot.footer,
        buttons: contoh.slice(0, 3).map(c => ({ text: `👑 Kunci ${c}`, id: `${P}topremium ${c}` }))
          .concat([{ text: '📋 Daftar terkunci', id: `${P}topremium list` }])
      }).catch(() => m.reply(teks))
    }

    /* ---- reset semua ---- */
    if (/^(resetsemua|hapussemua|clear)$/.test(sub)) {
      const n = Object.keys(settings.premiumCmd).length
      settings.premiumCmd = {}
      saveNow('settings')
      return m.reply(`✅ *${n} fitur* dibuka kembali untuk semua user.`)
    }

    const ketemu = cariFitur(args[0])
    if (!ketemu?.plugin) return m.reply(`❌ Fitur *${args[0]}* tidak ditemukan.\\nCek nama: \`${P}carifitur ${args[0]}\``)

    const nama = ketemu.name
    const pl = ketemu.plugin
    const alias = (pl.command || [nama]).map(c => `${P}${c}`).join(' ')
    const mode = String(args[1] || '').toLowerCase()

    /* ---- buka kembali ---- */
    if (/^(reset|buka|hapus|off|normal|public|free|mati)$/i.test(mode)) {
      const bawaan = !!pl.premium
      if (!settings.premiumCmd[nama] && !bawaan) {
        return m.reply(`ℹ️ \`${P}${nama}\` memang tidak dikunci premium.`)
      }
      delete settings.premiumCmd[nama]
      saveNow('settings')
      return m.reply(
        bawaan
          ? `⚠️ Overlay dihapus, tapi \`${P}${nama}\` *tetap premium* karena memang dikunci di kode fiturnya (\`premium: true\`).`
          : `✅ \`${P}${nama}\` dibuka lagi — semua user bisa memakainya.`
      )
    }

    /* ---- status satu fitur: `.topremium <fitur> status` ----
       Tanpa kata kedua, perintah LANGSUNG MENGUNCI (sesuai maksud
       `.topremium <nama fitur>`), jadi status harus diminta eksplisit. */
    if (/^(status|cek|info|lihat)$/i.test(mode)) {
      const overlay = !!settings.premiumCmd[nama]
      const bawaan = !!pl.premium
      return m.reply(
        `👑 *STATUS PREMIUM — ${nama}*\\n\\n` +
        `🔗 ${alias}\\n` +
        `📁 \`${pl.fileName || '-'}\`\\n\\n` +
        `Kunci bawaan kode: ${bawaan ? '✅ ya (\`premium: true\`)' : '❌ tidak'}\\n` +
        `Kunci \`${P}topremium\`: ${overlay ? '✅ aktif' : '❌ tidak'}\\n` +
        `*Efektif:* ${(bawaan || overlay) ? '💎 khusus premium' : '👤 semua user'}\\n\\n` +
        `${(bawaan || overlay) ? `Buka: \`${P}topremium ${nama} reset\`` : `Kunci: \`${P}topremium ${nama}\``}`
      )
    }

    if (mode && !/^(kunci|premium|on|ya|set|1|lock)$/i.test(mode)) {
      return m.reply(`❌ Pilihan tidak dikenal: \`${mode}\`\\nPakai: \`${P}topremium ${nama}\` atau \`${P}topremium ${nama} reset\``)
    }

    /* ---- kunci ---- */
    if (pl.owner) {
      return m.reply(`⚠️ \`${P}${nama}\` sudah khusus *owner* — menguncinya jadi premium tidak perlu.`)
    }
    settings.premiumCmd[nama] = { oleh: m.sender, waktu: Date.now() }
    saveNow('settings')

    await m.react?.('👑').catch(() => {})
    const teks =
      `👑 *FITUR DIKUNCI JADI PREMIUM*\\n\\n` +
      `*${nama}* · 📁 \`${pl.fileName || '-'}\`\\n` +
      `🔗 ${alias}\\n\\n` +
      `Mulai sekarang hanya *user premium* yang bisa memakainya.\\n` +
      `User free yang mengetik \`${P}${nama}\` akan melihat pesan upgrade.\\n\\n` +
      `Kamu (owner) tetap bisa memakainya tanpa batas.\\n` +
      `Buka lagi: \`${P}topremium ${nama} reset\`\\n` +
      `Lihat semua: \`${P}topremium list\``

    await m.sendButtons({
      title: `👑 ${nama} → premium`,
      text: teks,
      footer: config.bot.footer,
      buttons: [
        { text: '📋 Daftar terkunci', id: `${P}topremium list` },
        { text: '↩️ Buka lagi', id: `${P}topremium ${nama} reset` },
        { text: '🛠️ Edit fitur', id: `${P}editfitur ${nama}` }
      ]
    }).catch(() => {})

    return m.reply(teks)
  }
}

export default { toButton, toPremium }
