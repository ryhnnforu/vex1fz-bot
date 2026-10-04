/**
 * ⏰ PENJADWAL PESAN (v7.7.3) — pengingat per chat, tahan restart
 * ------------------------------------------------------------------
 *  • `.jadwalkan <waktu> <teks>`   — jadwalkan pengingat
 *    Format waktu (semua WIB): `30 menit` · `2 jam` · `3 hari` ·
 *    `17:30` · `17:30 09/09` · `17:30 09/09/2026`
 *    Awalan `harian` → pengingat berulang tiap 24 jam.
 *  • `.jadwalkan list`            — daftar pengingat di chat ini
 *  • `.jadwalkan batal <nomor>`   — batalkan (staff own/owner)
 *
 *  Mesin: lib/scheduler.js (persisten di database/jadwal.json,
 *  dipulihkan saat bot hidup kembali; dipanggil .tick() dari handler).
 */
import { config } from '../config.js'
import { parseWaktu, tampilWaktu, formatTanggal, tambahTugas, daftarTugas, batalTugas } from '../lib/scheduler.js'
import { sameIdentity } from '../lib/identity.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const MAKS_PER_CHAT = 10

export const jadwalkanCmd = {
  command: ['jadwalkan', 'remindme', 'jadwalkansaya', 'ingatpada', 'schedulemsg', 'jadwalpesan'],
  category: 'Tools',
  description: '⏰ Jadwalkan pesan pengingat (WIB): `.jadwalkan 30 menit bayar utang` · `.jadwalkan 17:30 jumatan` · `.jadwalkan harian 07:00 morning routine`',
  limit: 0,
  cooldown: 4,
  run: async m => {
    const teks = String(m.q || '').trim()
    const args = teks.split(/\s+/).filter(Boolean)

    /* ---- `list` / `daftar` ---- */
    if (!args.length || /^(list|daftar|semua)$/.test(args[0])) {
      const semua = daftarTugas(m.jid)
      if (!semua.length) {
        return m.reply(
          `⏰ *PENJADWAL PESAN* — belum ada pengingat di chat ini.\n\nCara pakai:\n` +
          `• ${P}jadwalkan 30 menit jemput adik\n` +
          `• ${P}jadwalkan 2 jam rapat proyek\n` +
          `• ${P}jadwalkan harian 07:00 morning routine\n` +
          `• ${P}jadwalkan 17:30 09/09 deadline sketcher\n\n` +
          `Dikelola: ${P}jadwalkan list · batal: ${P}jadwalkan batal <nomor>`
        )
      }
      const item = semua.map(t =>
        `*#${t.id}* · ${formatTanggal(t.waktu)} (${tampilWaktu(t.waktu)} lagi)${t.tipe === 'harian' ? ' 🔁 harian' : ''}\n` +
        `   ▸ ${truncate(t.teks, 46)}  _oleh_ @${(t.oleh || '').split('@')[0]}`
      ).join('\n')
      return m.sendButtons({
        title: '⏰ Pengingat',
        text: `⏰ *PENGINGAT DI CHAT INI* (${semua.length}/${MAKS_PER_CHAT})\n\n${item}\n\nBatal: ${P}jadwalkan batal <#nomor>`,
        footer: config.bot.footer,
        buttons: [{ text: '🗑 Batalkan #1', id: `${P}jadwalkan batal ${semua[0].id}` }, { text: '➕ Buat Pengingat', id: `${P}jadwalkan` }]
      }).catch(() => m.reply('⏰ ' + item))
    }

    /* ---- `batal <#>` ---- */
    if (/^batal$/i.test(args[0]) || /^batal\s*#?\d+/i.test(teks)) {
      const mId = parseInt((args[1] || args[0].replace(/[^\d]/g, '')), 10)
      if (!mId) return m.reply(`Contoh: ${P}jadwalkan batal 3`)
      const ada = daftarTugas(m.jid).find(x => x.id === mId)
      if (!ada) return m.reply(`❌ Pengingat *#${mId}* tidak ada di chat ini. Lihat: ${P}jadwalkan list`)
      const pemilik = sameIdentity(ada.oleh, m.sender) || (Array.isArray(m.senderAlts) && m.senderAlts.some(a => sameIdentity(ada.oleh, a)))
      if (!(pemilik || m.isOwner || m.isAdmin)) {
        return m.reply('🛡️ Hanya pembuatnya, admin, atau owner bot yang boleh membatalkan.')
      }
      batalTugas(mId, m.jid)
      return m.reply(`🗑 Pengingat *#${mId}* dibatalkan: _${truncate(ada.teks, 60)}_`)
    }

    /* ---- buat baru: [harian] <waktu> <teks> ---- */
    const semua = daftarTugas(m.jid)
    if (semua.length >= MAKS_PER_CHAT) {
      return m.reply(`❌ Sudah ada ${MAKS_PER_CHAT} pengingat di chat ini (batas anti-spam).\nBatalkan dulu yang selesai: ${P}jadwalkan list`)
    }
    let tipe = 'sekali'
    if (/^harian$/i.test(args[0]) || /^setiaphari$/i.test(args[0])) { tipe = 'harian'; args.shift() }

    /* konsumsi potongan waktu di awal*/
    let sisa = args.join(' ')
    let ts = null, dipakai = ''
    for (const pola of [
      /^(\d{1,4}\s*(?:menit|mnt|min|m|jam|j|hari|hr|d))\s*(.*)$/i,
      /^(\d{1,2}[.:]\d{2}\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*(.*)$/,
      /^(\d{1,2}[.:]\d{2})\s*(.*)$/
    ]) {
      const cocok = sisa.match(pola)
      if (cocok) { ts = parseWaktu(cocok[1]); sisa = cocok[2] || ''; dipakai = cocok[1]; break }
    }
    if (!ts) {
      return m.reply(
        `⏰ Format waktu tidak dimengerti.\nYang bisa:\n• \`30 menit\` · \`2 jam\` · \`3 hari\`\n• \`17:30\` (hari inibila masih lewat; lainnya besok)\n• \`17:30 09/09\` · \`17:30 09/09/2026\`\n\nContoh: ${P}jadwalkan 45 menit makan siang`
      )
    }
    if (!sisa.trim()) return m.reply('⏰ Isi pengingatnya apa? Ketik pesannya juga setelah waktunya.')
    if (ts - Date.now() < 60000) return m.reply('❌ Paling cepat 1 menit dari sekarang.')

    tambahTugas(m.jid, {
      teks: truncate(sisa.trim(), 400),
      waktu: ts,
      oleh: m.senderKey || m.sender,
      tipe
    })

    return m.sendButtons({
      title: '⏰ Pengingat Disimpan',
      text:
        `✅ *PENGINGAT DISIMPAN!*\n\n` +
        `▸ Waktu: *${formatTanggal(ts)}* (${tampilWaktu(ts)} lagi)\n` +
        `▸ Tipe: ${tipe === 'harian' ? '🔁 berulang tiap 24 jam' : 'sekali'}\n` +
        `▸ Isi: ${truncate(sisa.trim(), 80)}\n\n` +
        `Tetap tersimpan walau bot restart. Kelola: ${P}jadwalkan list`,
      footer: config.bot.footer,
      buttons: [{ text: '📋 Lihat Pengingat', id: `${P}jadwalkan list` }, { text: '➕ Tambah Lagi', id: `${P}jadwalkan ${dipakai} ` }],
      mentions: [m.sender]
    }).catch(() => m.reply('✅ Pengingat disimpan.'))
  }
}

export default { jadwalkanCmd }
