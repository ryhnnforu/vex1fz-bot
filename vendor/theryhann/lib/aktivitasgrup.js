/**
 * lib/aktivitasgrup.js — pelacakan aktivitas pesan per grup (dipakai .sider / .kicksider / .totalchat)
 * v7.35.0: hitungan JENDELA akurat via bucket harian + rincian tipe pesan.
 *
 * Skema per grup (database/aktivitasgrup.json):
 *   { mulai, anggota: { [key]: { n, first, last, harian: { 'YYYY-MM-DD': n }, tipe: { teks, media, stiker, perintah } } } }
 * Entri lama { n, first, last } tetap dibaca (fallback last-seen).
 */
import { loadDB, saveDB } from './database.js'

const NAMA_DB = 'aktivitasgrup'
const MAKS_HARIAN = 45 // retensi bucket harian per anggota
const JENIS_OK = ['teks', 'media', 'stiker', 'perintah']

const kunciHari = (ts = Date.now()) => {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function grupAktivitas (jid) {
  const db = loadDB(NAMA_DB, {})
  if (!db[jid]) { db[jid] = { mulai: Date.now(), anggota: {} }; saveDB(NAMA_DB, db) }
  const g = db[jid]
  if (!g.anggota) g.anggota = {}
  return g
}

function simpanGrup (jid, g) {
  const db = loadDB(NAMA_DB, {})
  db[jid] = g
  saveDB(NAMA_DB, db)
}

/** catat n pesan dari key pada grup jid; jenis: teks|media|stiker|perintah */
export function catatPesan (jid, key, n = 1, jenis = 'teks') {
  if (!jid || !key) return
  const g = grupAktivitas(jid)
  const now = Date.now()
  const a = g.anggota[key] || { n: 0, first: now, last: 0 }
  a.n = (a.n || 0) + n
  if (!a.first) a.first = now
  a.last = now
  /* bucket harian */
  a.harian = a.harian || {}
  const hk = kunciHari(now)
  a.harian[hk] = (a.harian[hk] || 0) + n
  const daftar = Object.keys(a.harian).sort()
  while (daftar.length > MAKS_HARIAN) delete a.harian[daftar.shift()]
  /* rincian tipe */
  if (JENIS_OK.includes(jenis)) {
    a.tipe = a.tipe || {}
    a.tipe[jenis] = (a.tipe[jenis] || 0) + n
  }
  g.anggota[key] = a
  simpanGrup(jid, g)
}

/** jumlah pesan dalam jendela hari terakhir dari bucket harian */
function hitungJendela (a, hari) {
  if (!a?.harian) return -1 // -1 = tidak ada bucket (data lama)
  let total = 0
  const now = Date.now()
  for (let h = 0; h < hari; h++) total += a.harian[kunciHari(now - h * 86400e3)] || 0
  return total
}

function gabungTipe (daftar) {
  const out = { teks: 0, media: 0, stiker: 0, perintah: 0 }
  for (const a of daftar) {
    if (!a?.tipe) continue
    for (const j of JENIS_OK) out[j] += a.tipe[j] || 0
  }
  return out
}

/**
 * Ringkas aktivitas anggota grup.
 * @returns { baris:[{key,n,nWin,perHari,first,last,diam,tipe,akurat}], total, tercatat, diam,
 *            totalPesan, jendelaPesan, jendelaHari, mulai, matang, cakupan }
 * - n = sepanjang masa; nWin = dalam jendela (akurat bila akurat=true)
 * - cakupan: 'penuh' bila pelacakan mencakup seluruh jendela, else 'X/Y hari'
 */
export function ringkasAktivitas (jid, peserta = [], { hari = 7, alias = {}, maks = 50 } = {}) {
  const g = grupAktivitas(jid)
  const jendelaHari = Math.max(1, Math.min(365, hari || 7))
  const mulai = g.mulai || Date.now()
  const umurHari = (Date.now() - mulai) / 86400e3
  const matang = umurHari >= jendelaHari
  const cakupan = matang ? 'penuh' : `${Math.max(1, Math.floor(umurHari))}/${jendelaHari} hari`

  const kunci = peserta.map(p => (typeof p === 'string' ? p : (p?.id || p?.pn || p?.lid))).filter(Boolean)
  const baris = kunci.map(key => {
    const semua = [g.anggota[key], ...(alias[key] || []).map(a => g.anggota[a]).filter(Boolean)]
    const ada = semua.filter(Boolean)
    const n = ada.reduce((s, a) => s + (a.n || 0), 0)
    const first = ada.length ? Math.min(...ada.map(a => a.first || Infinity)) : 0
    const last = ada.length ? Math.max(...ada.map(a => a.last || 0)) : 0
    const punyaBucket = ada.some(a => a.harian && Object.keys(a.harian).length)
    const nWin = punyaBucket ? ada.reduce((s, a) => s + Math.max(0, hitungJendela(a, jendelaHari)), 0) : -1
    const sejak = Date.now() - jendelaHari * 86400e3
    const diam = punyaBucket ? nWin === 0 : (n === 0 || last < sejak)
    return {
      key, n, nWin, perHari: nWin >= 0 ? +(nWin / jendelaHari).toFixed(1) : -1,
      first: first === Infinity ? 0 : first, last, diam,
      tipe: gabungTipe(ada), akurat: punyaBucket
    }
  })
  /* aktif dulu (nWin desc), lalu diam (last desc) */
  baris.sort((a, b) => ((a.diam ? 1 : 0) - (b.diam ? 1 : 0)) || ((b.nWin < 0 ? b.n : b.nWin) - (a.nWin < 0 ? a.n : a.nWin)) || (b.last - a.last))
  const totalPesan = Object.values(g.anggota).reduce((s, a) => s + (a.n || 0), 0)
  const jendelaPesan = baris.reduce((s, b) => s + Math.max(0, b.nWin), 0)
  return {
    baris: baris.slice(0, Math.max(1, maks)), total: kunci.length,
    tercatat: baris.filter(b => b.n > 0).length, diam: baris.filter(b => b.diam).length,
    totalPesan, jendelaPesan, jendelaHari, mulai, matang, cakupan
  }
}

/** kandidat kick: diam + bukan admin/bot/owner (penyaringan peran di pemanggil via targetAman) */
export function targetSider (jid, peserta = [], { hari = 7, maks = 25, alias = {} } = {}) {
  const r = ringkasAktivitas(jid, peserta, { hari, alias, maks: 1000 })
  const daftarDiam = r.baris.filter(b => b.diam)
  return { ...r, daftarDiam: daftarDiam.slice(0, maks), dibatasi: daftarDiam.length > maks }
}

export function resetAktivitas (jid) {
  const db = loadDB(NAMA_DB, {})
  delete db[jid]
  saveDB(NAMA_DB, db)
}

/** "3 mnt lalu" / "2 jam lalu" / "5 hari lalu" / tanggal */
export function lalu (ts) {
  if (!ts) return 'belum pernah'
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return 'baru saja'
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID')
}

export default { grupAktivitas, catatPesan, ringkasAktivitas, targetSider, resetAktivitas, lalu }
