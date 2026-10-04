/**
 * 🏆 TURNAMEN KUIS ANTAR-USER (v7.7.3)
 * ------------------------------------------------------------------
 *  Turnamen tebak-tebakan antar member GRUP, digerakkan oleh alur pesan:
 *    • Punya bank statis ±180 soal (tebak kata/asah otak + 12 bank gameslab)
 *    • 60 detik per soal · jawaban pertama yang benar dapat poin
 *    • Berakhir → podium + kartu PNG (lib/scorecard.js) + hadiah RPG
 *
 *  Perintah:
 *    .turnamen mulai [n] — buka turnamen (3–15 soal, bawaan 7)
 *    .turnamen skor      — papan sementara
 *    .turnamen stop      — berhenti paksa (pengerjaan/pemain/admin/owner)
 *  Hook: periksaTurnamen(m) dipanggil handler untuk pesan NON-perintah.
 */
import { config } from '../config.js'
import {
  mulaiTurnamen, sesiOf, hapusSesi, jawabMasuk, selesaiTurnamen,
  batalTurnamen, ringkasSkor, HADIAH
} from '../lib/turnamen.js'
import { sameIdentity } from '../lib/identity.js'
import { kartuSkorPng } from '../lib/scorecard.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix

export const turnamenCmd = {
  command: ['turnamen', 'turney', 'quizbattle', 'tournamen', 'lombakuis', 'tantangankuis'],
  category: 'Group Menu',
  description: '🏆 Buka/kelola turnamen kuis antarmember grup — 60 detik per soal, podium+hadiah RPG',
  group: true,
  limit: 0,
  cooldown: 5,
  run: async m => {
    const args = (m.q || '').trim().split(/\s+/).filter(Boolean)
    const aksi = (args[0] || 'tanya').toLowerCase()

    if (aksi === 'mulai' || aksi === 'start' || aksi === 'buka' || /^\d{1,2}$/.test(args[0] || '')) {
      const jumlah = /^\d{1,2}$/.test(args[0]) ? parseInt(args[0], 10) : parseInt(args[1] || '7', 10)
      if (sesiOf(m.jid)) return m.reply('🏆 Sudah ada turnamen berjalan di grup ini. Selesaikan: ' + P + 'turnamen stop · cek skor: ' + P + 'turnamen skor')
      const hasil = mulaiTurnamen(m.jid, { total: jumlah, oleh: m.senderKey || m.sender })
      if (hasil.err) return m.reply('⚠️ ' + hasil.err)
      const s = hasil.sesi
      return m.sendButtons({
        title: '🏆 Turnamen Kuis',
        text:
          `🏆 *TURNAMEN KUIS DIMULAI — ${s.total} soal!* 🏆\n\n` +
          `Siapa cepat & benar menang!\n` +
          `• Poin: 100 dasar + bonus cepat (maks ~+120)\n` +
          `• 60 detik per soal, lanjut otomatis\n` +
          `• Podium 🥇🥈🥉 dapat hadiah koin & EXP RPG\n\n` +
          `Dimulai oleh @${(m.sender || '').split('@')[0]} · ${P}turnamen skor · ${P}turnamen stop\n\n` +
          s.daftar[0] ? `🏆 *TURNAMEN KUIS* (soal 1/${s.total})\n\n*${s.current.q}*\n\n_Jawab di chat ini — waktu ±60 detik_` : '',
        footer: config.bot.footer,
        buttons: [{ text: '📊 Skor Sementara', id: `${P}turnamen skor` }, { text: '🛑 Stop Turnamen', id: `${P}turnamen stop` }],
        mentions: [m.sender]
      }).catch(() => m.reply('🏆 Turnamen dimulai!'))
    }

    if (aksi === 'skor' || aksi === 'status' || aksi === 'podium') {
      const s = sesiOf(m.jid)
      if (!s) return m.reply('🏆 Belum ada turnamen berjalan. Buka: ' + P + 'turnamen mulai')
      return m.reply(ringkasSkor(s, { judul: `🏆 TURNAMEN — skor sementara (soal ${s.idx + 1}/${s.total})\n` }) + `\n\nSoal aktif: *${s.current.q}*`)
    }

    if (aksi === 'stop' || aksi === 'tutup' || aksi === 'akhiri' || aksi === 'batal' || aksi === 'batalkan') {
      const s = sesiOf(m.jid)
      if (!s) return m.reply('🏆 Tidak ada turnamen yang sedang berjalan di grup ini.')
      const podeidis = sameIdentity(s.oleh || '', m.sender) || sameIdentity(s.oleh || '', m.senderKey)
      if (!podeidis && !m.isAdmin && !m.isOwner) {
        return m.reply('🛡️ Hanya pembuka turnamen/admin/owner yang boleh menghentikan.')
      }
      batalTurnamen(m.jid)
      return m.reply(`🏁 *TURNAMEN DIHENTIKAN*${s.skor.size ? '' : ''}\n\n` + ringkasSkor(s, { judul: 'SKOR AKHIR SEMENTARA\n' }))
    }

    /* `tanya` default → penjelasan/faqs */
    const s = sesiOf(m.jid)
    return m.sendButtons({
      title: '🏆 Turnamen Kuis',
      text:
        `🏆 *TURNAMEN KUIS ANTARUSER* — berebut jawab soal TEBAK di chat grup!\n\n` +
        (s ? `Sedang berjalan (${s.idx + 1}/${s.total}) — soal: *${s.current.q}*\nJawab di chat ini!\n\n` : '') +
        `Mulai: ${P}turnamen mulai\nAtur jumlah soal: ${P}turnamen mulai 10\nSkor: ${P}turnamen skor · Stop: ${P}turnamen stop`,
      footer: config.bot.footer,
      buttons: [{ text: '🏆 Mulai', id: `${P}turnamen mulai` }, { text: '📊 Skor', id: `${P}turnamen skor` }, { text: '🛑 Stop', id: `${P}turnamen stop` }]
    }).catch(() => m.reply('🏆 turnamen: mulai | skor | stop'))
  }
}

/* ------------------------------------------------------------------ */
/*  Hook handler (pesan non-perintah): dipanggil dari handlers/message.js
 *  segera SETELAH pemeriksaan kuis biasa, hanya kalau grup ada turnamen. */
export async function periksaTurnamen (m) {
  if (!m.isGroup) return null
  const s = sesiOf(m.jid)
  if (!s) return null
  const hasil = await jawabMasuk(m)
  if (!hasil) return null

  /* akhir? */
  const balasanTeks = hasil.teks || ''
  const balasan = await m.reply(balasanTeks).catch(() => null)

  if (hasil.tamat) {
    /* tambahkan kartu PNG podium */
    try {
      const rows = hasil.tamat.podium.map((x, i) => ({
        teks: `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'}  ${x.nama} · ${x.benar} benar`,
        nilai: x.poin + ' pt' + (x.koin ? ' · +Rp' + x.koin : '')
      }))
      if (rows.length) {
        const png = await kartuSkorPng({
          judul: '🏆 TURNAMEN — PODIUM',
          sub: `${hasil.tamat.totalSoal} soal · ${hasil.tamat.partisipan} partisipan`,
          baris: rows,
          footer: `${config.bot.name} · ${P}turnamen mulai`,
          tema: ['#fbbf24', '#f59e0b', '#d97706']
        })
        await m.sock.sendMessage(m.jid, { image: png, caption: '🏆 Podium akhir turnamen — main lagi: ' + P + 'turnamen mulai' })
      }
    } catch (e) {
      console.warn('[turnamen] kartu PNG gagal:', e?.message || e)
    }
  }
  return hasil.tipe === 'gagal' && !balasanTeks.trim() ? null : { handled: true }
}

export default { turnamenCmd, periksaTurnamen }
