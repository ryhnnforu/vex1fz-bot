/**
 * ============================================================
 *  lib/scheduler.js — PENJADWAL PESAN (v7.7.3)
 * ------------------------------------------------------------
 *  Tugas terjadwal per chat (pengingat), tahan restart:
 *    • tersimpan di database/jadwal.json
 *    • ujung waktu WIB (Asia/Jakarta) diparse fleksibel:
 *        - "30 menit" / "2 jam" / "3 hari"        → relatif
 *        - "17:30"                                 → hari ini/besok
 *        - "17:30 09/09"  /  "17:30 09/09/2026"    → tanggal fix
 *    • tipe 'sekali' (dipakai-habis) atau 'harian' (berulang tiap 24 jam)
 *    • kirimnya lewat sock yang diberi saat mulai (handler meng-inject)
 *    • ARSITEKTUR push+interval: handler memanggil tick() setiap pesan
 *      masuk, plus setInterval sekali di initHandler — tidak bocor
 *      saat bot restart (rehydrate dari file).
 * ============================================================
 */
import { loadDB, saveNow } from './database.js'

const db = () => loadDB('jadwal', { nextId: 1, tugas: [] })
const simpan = () => saveNow('jadwal')

/* ---------------- parsing waktu (semua input = WIB, UTC+7) ---------------- */
const WIB_OFFSET = 7 * 3600000

/** Date.now() bergeser ke frame WIB untuk parsing teks jam menit */
function sekarangWIB () { return new Date(Date.now() + WIB_OFFSET) }

/**
 * Parse string waktu → detik epoch atau null.
 *  "30 menit", "2 jam", "3 hari"
 *  "17:30", "9:05", "17.30"
 *  "17:30 09/09", "17:30 9/9/2026"
 */
export function parseWaktu (s) {
  s = String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!s) return null

  let m = String(s ?? '').match(/^(\d{1,4})\s*(menit|mnt|min|m)$/)
  if (m) return Date.now() + Math.max(1, parseInt(m[1], 10)) * 60000
  m = s.match(/^(\d{1,3})\s*(jam|j)$/)
  if (m) return Date.now() + Math.max(1, parseInt(m[1], 10)) * 3600000
  m = s.match(/^(\d{1,3})\s*(hari|hr|d)$/)
  if (m) return Date.now() + Math.max(1, parseInt(m[1], 10)) * 86400000

  /* jam menit (hari ini/besok WIB) */
  m = s.match(/^(\d{1,2})[.:](\d{2})(?:\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?)?$/)
  if (m) {
    const thn = sekarangWIB()
    const j = parseInt(m[1], 10), mnt = parseInt(m[2], 10)
    if (j > 23 || mnt > 59) return null
    if (m[3]) {
      /* dd/mm atau dd/mm/yy(-yyyy) */
      let y = m[5] ? parseInt(m[5], 10) : thn.getUTCFullYear()
      if (y < 100) y += 2000
      const mo = parseInt(m[4], 10), d = parseInt(m[3], 10)
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
      const t = Date.UTC(y, mo - 1, d, j, mnt) - WIB_OFFSET
      return t > Date.now() - 60000 ? t : m[5] ? null : Date.UTC(y + 1, mo - 1, d, j, mnt) - WIB_OFFSET
    }
    let target = Date.UTC(thn.getUTCFullYear(), thn.getUTCMonth(), thn.getUTCDate(), j, mnt) - WIB_OFFSET
    if (target <= Date.now() + 20000) {
      target += 86400000 /* besok */
    }
    return target
  }
  return null
}

/** format otw untuk tampilan: → "12 menit lagi", "Selasa 09/09 18.30" */
export function tampilWaktu (ts, sekarang = Date.now()) {
  const selisih = ts - sekarang
  const jam = Math.round(selisih / 360000) / 10
  if (selisih < -59400000) return 'terlewat'
  if (selisih < 60000) return 'kurang dari 1 menit'
  if (selisih < 3600000) return (selisih / 60000).toFixed(selisih < 360000 ? 0 : 1).replace('.0', '') + ' menit'
  if (selisih < 86400000) return (selisih / 3600000).toFixed(1).replace('.0', '') + ' jam'
  return (selisih / 86400000).toFixed(1).replace('.0', '') + ' hari'
}

export function formatTanggal (ts) {
  const d = new Date(ts + WIB_OFFSET)
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getUTCDay()]
  const pad = n => String(n).padStart(2, '0')
  return `${hari}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())} WIB`
}

/* ---------------- registry ---------------- */
export function tambahTugas (jid, { teks, waktu, oleh, tipe = 'sekali' }) {
  const d = db()
  const id = d.nextId++
  const tugas = { id, jid, teks: String(teks || '').slice(0, 500), waktu, oleh, tipe, dibuat: Date.now() }
  d.tugas.push(tugas)
  simpan()
  return tugas
}

export function daftarTugas (jid = null) {
  let t = db().tugas.slice()
  if (jid) t = t.filter(x => x.jid === jid)
  return t.sort((a, b) => a.waktu - b.waktu)
}

export function batalTugas (id, jid = null) {
  const d = db()
  const i = d.tugas.findIndex(x => x.id === id && (!jid || x.jid === jid))
  if (i < 0) return false
  d.tugas.splice(i, 1)
  simpan()
  return true
}

/* ---------------- penjadwal ---------------- */
let sockAktif = null
let timer = null

/**
 * Jalankan penjadwal: panggil sekali (mis. saat initHandler).
 * Idempoten — panggilan berikutnya hanya memperbarui sock.
 */
export function mulaiPenjadwal (sock) {
  if (sock) sockAktif = sock
  if (!timer && typeof setInterval === 'function') {
    timer = setInterval(() => { tick().catch(() => {}) }, 45000)
    timer.unref?.()
  }
  return { aktif: true }
}

/**
 * Periksa tugas yang jatuh tempo → kirim.
 * 'sekali': hapus setelah terkirim. 'harian': geser +24 jam.
 */
export async function tick () {
  if (!sockAktif) return 0
  const d = db()
  const now = Date.now()
  let terkirim = 0
  const sisa = []
  for (const t of d.tugas) {
    if (t.waktu > now) { sisa.push(t); continue }
    terkirim++
    try {
      const stempel = formatTanggal(t.waktu)
      await sockAktif.sendMessage(t.jid, {
        text: `🔔 *PENGINGAT* _(${stempel})_\n\n${t.teks}\n\n_oleh_ @${String(t.oleh || '').split('@')[0]}${t.tipe === 'harian' ? '\n⏰ pengingat harian (otomatis setting ulang besok sama jam)' : ''}`,
        mentions: t.oleh ? [t.oleh] : []
      })
    } catch (e) {
      console.error('[scheduler] gagal kirim tugas', t.id, e?.message || e)
    }
    if (t.tipe === 'harian') {
      sisa.push({ ...t, waktu: t.waktu + 86400000, dibuat: now })
    }
  }
  if (terkirim || sisa.length !== d.tugas.length) {
    d.tugas = sisa
    simpan()
  }
  return terkirim
}

/* untuk test: bersihkan timer */
export function resetScheduler ({ nolla = false } = {}) {
  if (timer) { clearInterval(timer); timer = null }
  sockAktif = null
  if (nolla) { db().tugas = []; simpan() }
}

export default { parseWaktu, tampilWaktu, formatTanggal, tambahTugas, daftarTugas, batalTugas, mulaiPenjadwal, tick, resetScheduler }
