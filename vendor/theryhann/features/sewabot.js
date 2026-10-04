/**
 * ============================================================
 *  features/sewabot.js — SEWA BOT PER GRUP (v7.23.0)
 * ------------------------------------------------------------
 *  .sewabot <hari>                     (owner, di dalam grup)  → grup ini disewa N hari
 *  .sewabot add <link/jid> <hari>      (owner, di mana saja)   → bot join via link lalu catat sewa
 *  .sewabot tambah <hari>              (owner, di grup)        → perpanjang
 *  .sewabot hapus [jid]                (owner)                 → cabut sewa (bot langsung keluar)
 *  .sewabot list                       (owner)                 → daftar grup sewa & sisa waktu
 *  .sewabot cek | .ceksewa             (semua)                 → sisa masa sewa grup ini
 *  .sewabot mode on/off                (owner) → mode ketat: bot hanya melayani grup yang punya sewa aktif
 *
 *  Auto: setiap 60 detik cek; H-1 kirim peringatan; habis → pesan pamit → bot keluar grup.
 * ============================================================
 */
import { config } from '../config.js'
import { loadDB, saveDB, getSettings, setSetting } from '../lib/database.js'

const P = config.display.prefix
const DBN = 'sewa'
const db = () => loadDB(DBN, { grup: {} })
const HARI = 86400e3
const brand = () => config.bot?.name || 'THERYHANN!'

export function sewaGrup (jid) { return db().grup[jid] || null }
export function sewaAktif (jid) { const s = sewaGrup(jid); return !!s && s.habis > Date.now() }
export function modeKetat () { return getSettings().sewaKetat === true }

function sisaTeks (ms) {
  if (ms <= 0) return 'habis'
  const d = Math.floor(ms / HARI), h = Math.floor((ms % HARI) / 3600e3), mnt = Math.floor((ms % 3600e3) / 60000)
  return (d ? d + ' hari ' : '') + (h ? h + ' jam ' : '') + (mnt + ' menit')
}
function tgl (ts) { return new Date(ts + 7 * 3600e3).toISOString().replace('T', ' ').slice(0, 16) + ' WIB' }

function setSewa (jid, hari, oleh, nama = '') {
  const d = db(); const now = Date.now()
  const s = d.grup[jid] || { mulai: now, habis: now, nama, oleh, warned: false }
  s.habis = Math.max(s.habis, now) + hari * HARI; s.warned = false; s.nama = nama || s.nama; s.oleh = oleh
  d.grup[jid] = s; saveDB(DBN); return s
}

async function namaGrup (sock, jid) { try { return (await sock.groupMetadata(jid)).subject } catch { return jid } }

/* ---------------- pemeriksa berkala ---------------- */
let timer = null
export function mulaiSewa (sock) {
  if (timer) return
  timer = setInterval(() => cekSewa(sock).catch(() => {}), 60000)
}
export async function cekSewa (sock) {
  const d = db(); const now = Date.now(); let ubah = false
  for (const [jid, s] of Object.entries(d.grup)) {
    const sisa = s.habis - now
    if (sisa > 0 && sisa < HARI && !s.warned) {
      s.warned = true; ubah = true
      try { await sock.sendMessage(jid, { text: `⏳ *MASA SEWA ${brand()} HAMPIR HABIS*\n\nSisa: *${sisaTeks(sisa)}* (berakhir ${tgl(s.habis)}).\nBot akan otomatis keluar saat masa sewa habis. Hubungi owner untuk perpanjang: wa.me/${config.owner.number}` }) } catch {}
    }
    if (sisa <= 0) {
      try { await sock.sendMessage(jid, { text: `👋 *MASA SEWA ${brand()} TELAH HABIS*\n\nTerima kasih sudah memakai ${brand()} di grup ini. Bot pamit undur diri.\nIngin sewa lagi? Hubungi owner: wa.me/${config.owner.number}` }) } catch {}
      try { await sock.groupLeave(jid) } catch {}
      delete d.grup[jid]; ubah = true
    }
  }
  if (ubah) saveDB(DBN)
}

/* ---------------- gate: mode ketat (dipanggil handler) ---------------- */
export function bolehLayani (m) {
  if (!m.isGroup || !modeKetat() || m.isOwner) return true
  return sewaAktif(m.jid)
}

/* ---------------- perintah ---------------- */
export const sewabot = {
  command: ['sewabot', 'rentbot', 'addsewa', 'ceksewa', 'sewagrup'],
  category: 'Owner Menu',
  description: '💼 Sewa bot per grup: .sewabot <hari> (di grup) | add <link/jid> <hari> | tambah <hari> | hapus | list | cek | mode on/off — bot auto keluar saat habis',
  limit: 0, cooldown: 2, contoh: '30',
  run: async m => {
    const a = (m.args[0] || '').toLowerCase()
    const d = db()
    if (m.command === 'ceksewa' || a === 'cek' || (!a && !m.isOwner)) {
      if (!m.isGroup) return m.reply('Ketik di dalam grup untuk melihat masa sewa.')
      const s = d.grup[m.jid]
      if (!s) return m.reply(modeKetat() ? `❌ Grup ini *belum menyewa* ${brand()}.\nHubungi owner: wa.me/${config.owner.number}` : `ℹ️ Grup ini tidak memakai sistem sewa (bot gratis di sini).`)
      return m.reply(`💼 *MASA SEWA ${brand()}*\n\nGrup   : ${s.nama || m.jid}\nMulai  : ${tgl(s.mulai)}\nHabis  : ${tgl(s.habis)}\nSisa   : *${sisaTeks(s.habis - Date.now())}*\n\nPerpanjang: hubungi owner wa.me/${config.owner.number}`)
    }
    if (!m.isOwner) return m.reply('Perintah ini khusus owner.')

    if (a === 'list') {
      const rows = Object.entries(d.grup)
      if (!rows.length) return m.reply('📭 Belum ada grup sewa.')
      const now = Date.now()
      return m.reply(`💼 *DAFTAR SEWA (${rows.length})* · mode ketat: ${modeKetat() ? 'ON' : 'OFF'}\n\n` + rows.sort((x, y) => x[1].habis - y[1].habis).map(([j, s], i) => `${i + 1}. ${s.nama || j}\n   ${j}\n   sisa ${sisaTeks(s.habis - now)} · habis ${tgl(s.habis)}`).join('\n\n'))
    }
    if (a === 'mode') {
      const v = (m.args[1] || '').toLowerCase()
      if (!['on', 'off'].includes(v)) return m.reply(`Mode ketat sekarang: *${modeKetat() ? 'ON' : 'OFF'}*\n\`${P}sewabot mode on\` → bot hanya merespons di grup yang sewanya aktif (chat pribadi & owner tetap bisa).\n\`${P}sewabot mode off\` → semua grup dilayani; sewa hanya menentukan kapan bot keluar.`)
      setSetting('sewaKetat', v === 'on'); return m.reply(`✅ Mode ketat sewa: *${v.toUpperCase()}*`)
    }
    if (a === 'hapus' || a === 'del' || a === 'cabut') {
      const jid = (m.args[1] || '').endsWith('@g.us') ? m.args[1] : m.jid
      if (!d.grup[jid]) return m.reply('Grup itu tidak ada di daftar sewa.')
      const nama = d.grup[jid].nama || jid
      try { await m.sock.sendMessage(jid, { text: `👋 Sewa ${brand()} di grup ini dicabut oleh owner. Bot pamit.` }) } catch {}
      delete d.grup[jid]; saveDB(DBN)
      try { await m.sock.groupLeave(jid) } catch {}
      return m.reply(`✅ Sewa *${nama}* dicabut, bot keluar dari grup.`)
    }
    if (a === 'add' || a === 'tambahgrup' || a === 'join') {
      const target = m.args[1] || ''; const hari = parseFloat(m.args[2])
      if (!target || !(hari > 0)) return m.reply(`Contoh:\n\`${P}sewabot add https://chat.whatsapp.com/xxxx 30\`\n\`${P}sewabot add 1203630xxxx@g.us 7\``)
      let jid = target
      if (!target.endsWith('@g.us')) {
        const code = target.replace(/.*chat\.whatsapp\.com\//, '').replace(/[^0-9A-Za-z]/g, '')
        if (!code) return m.reply('Link undangan tidak valid.')
        try { jid = await m.sock.groupAcceptInvite(code) } catch (e) {
          const msg = String(e?.message || e)
          if (/already|conflict|409/i.test(msg)) { try { jid = (await m.sock.groupGetInviteInfo(code)).id } catch { return m.reply('❌ Gagal membaca grup: ' + msg.slice(0, 120)) } } else return m.reply('❌ Gagal join grup: ' + msg.slice(0, 160) + '\n(link kadaluarsa / grup butuh persetujuan admin / bot diblokir)')
        }
        if (!jid) return m.reply('❌ Bot belum bisa masuk (mungkin menunggu persetujuan admin). Setelah masuk, ketik `.sewabot ' + hari + '` di grup itu.')
      }
      const nama = await namaGrup(m.sock, jid)
      const s = setSewa(jid, hari, m.sender, nama)
      try { await m.sock.sendMessage(jid, { text: `🤖 *${brand()} AKTIF DI GRUP INI*\n\nMasa sewa: *${hari} hari* (sampai ${tgl(s.habis)}).\nKetik \`${P}menu\` untuk mulai · \`${P}ceksewa\` untuk sisa waktu.` }) } catch {}
      return m.reply(`✅ Bot masuk & sewa dicatat.\nGrup  : ${nama}\nJID   : ${jid}\nHabis : ${tgl(s.habis)}`)
    }
    if (a === 'tambah' || a === 'perpanjang' || /^\d+(\.\d+)?$/.test(a)) {
      const hari = parseFloat(a === 'tambah' || a === 'perpanjang' ? m.args[1] : a)
      if (!(hari > 0)) return m.reply(`Contoh: \`${P}sewabot 30\` (di dalam grup) atau \`${P}sewabot tambah 7\``)
      if (!m.isGroup) return m.reply(`Ketik di dalam grup, atau pakai \`${P}sewabot add <link> ${hari}\`.`)
      const s = setSewa(m.jid, hari, m.sender, await namaGrup(m.sock, m.jid))
      return m.reply(`✅ *SEWA DICATAT*\nGrup  : ${s.nama}\nDurasi: +${hari} hari\nHabis : ${tgl(s.habis)}\nSisa  : ${sisaTeks(s.habis - Date.now())}\n\nBot otomatis pamit & keluar saat masa sewa habis (peringatan H-1).`)
    }
    return m.reply(`💼 *SEWABOT*\n\n\`${P}sewabot 30\` — sewa grup ini 30 hari\n\`${P}sewabot add <link/jid> 30\` — bot join via link + catat sewa\n\`${P}sewabot tambah 7\` — perpanjang\n\`${P}sewabot hapus [jid]\` — cabut (bot keluar)\n\`${P}sewabot list\` — daftar sewa\n\`${P}sewabot mode on/off\` — hanya layani grup sewa aktif\n\`${P}ceksewa\` — sisa waktu (semua user)\n\nMode ketat: ${modeKetat() ? 'ON' : 'OFF'} · Grup sewa: ${Object.keys(d.grup).length}`)
  }
}

export default { sewabot }
