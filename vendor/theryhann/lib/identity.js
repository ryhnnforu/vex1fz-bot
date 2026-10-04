/**
 * ============================================================
 *  IDENTITY RESOLVER — THERYHANN!
 * ============================================================
 *  WhatsApp versi baru memakai "LID addressing": satu akun bisa
 *  muncul sebagai `628xxx@s.whatsapp.net` (PN) ATAU `123456@lid` (LID),
 *  tergantung mode addressing chat/grup-nya.
 *
 *  Akibatnya perbandingan JID biasa (`===` / areJidsSameUser saja)
 *  SALAH menyimpulkan:
 *    • "bot bukan admin" padahal admin  (participant.id = LID bot)
 *    • "khusus owner" padahal owner     (sender = LID owner)
 *
 *  Modul ini mengumpulkan SEMUA bentuk identitas sebuah akun lalu
 *  membandingkannya secara longgar + memakai peta LID<->PN yang
 *  dipelajari dari pesan masuk.
 * ============================================================
 */
import { areJidsSameUser, jidNormalizedUser } from '../shims/elaina.mjs'
import { loadDB, saveDB } from './database.js'

/** peta LID <-> PN yang dipelajari dari traffic (@lid -> @s.whatsapp.net dan sebaliknya) */
let MAP = loadDB('lidmap', {})

export const isLid = jid => String(jid || '').endsWith('@lid')
export const isPn = jid => String(jid || '').endsWith('@s.whatsapp.net')

/** angka nomor saja dari sebuah JID PN (untuk perbandingan tahan-format) */
export function digitsOf (jid) {
  if (!isPn(jid)) return ''
  return String(jid).split('@')[0].replace(/[^0-9]/g, '')
}

function norm (jid) {
  try {
    return jidNormalizedUser(jid) || ''
  } catch {
    return String(jid || '')
  }
}

/* ------------------------------------------------------------------ */
/* 1. MEMPELAJARI PEMETAAN LID <-> PN                                  */
/* ------------------------------------------------------------------ */

/**
 * Simpan pasangan LID<->PN yang terlihat bersamaan.
 * @param {string[]} jids kumpulan JID yang diketahui milik akun YANG SAMA
 */
export function learnMapping (jids) {
  const clean = [...new Set((jids || []).filter(Boolean).map(norm))].filter(Boolean)
  const lids = clean.filter(isLid)
  const pns = clean.filter(isPn)
  if (!lids.length || !pns.length) return false

  let changed = false
  for (const lid of lids) {
    for (const pn of pns) {
      if (MAP[lid] !== pn) {
        MAP[lid] = pn
        changed = true
      }
      if (MAP[pn] !== lid) {
        MAP[pn] = lid
        changed = true
      }
    }
  }
  if (changed) saveDB('lidmap')
  return changed
}

/** semua bentuk identitas yang diketahui untuk satu JID */
export function aliasesOf (jid) {
  const base = norm(jid)
  const out = new Set([base].filter(Boolean))
  const mapped = MAP[base]
  if (mapped) out.add(norm(mapped))
  // transitif satu tingkat (PN -> LID -> PN lain, jaga-jaga)
  for (const x of [...out]) {
    const m2 = MAP[x]
    if (m2) out.add(norm(m2))
  }
  return [...out].filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* 2. PERBANDINGAN IDENTITAS                                           */
/* ------------------------------------------------------------------ */

/**
 * Apakah dua JID merujuk ke akun yang sama?
 * Memakai: areJidsSameUser + peta LID<->PN + perbandingan angka nomor.
 */
export function sameIdentity (a, b) {
  if (!a || !b) return false
  const na = norm(a)
  const nb = norm(b)
  if (na === nb) return true
  try {
    if (areJidsSameUser(na, nb)) return true
  } catch {}

  // bandingkan semua alias
  const aa = new Set(aliasesOf(na))
  const bb = new Set(aliasesOf(nb))
  for (const x of aa) {
    if (bb.has(x)) return true
    try {
      if (areJidsSameUser(x, nb)) return true
    } catch {}
  }
  for (const y of bb) {
    try {
      if (areJidsSameUser(na, y)) return true
    } catch {}
  }

  // terakhir: sama-sama PN dengan angka sama
  const da = digitsOf(na)
  const db = digitsOf(nb)
  return !!da && da === db
}

/** apakah salah satu dari `candidates` cocok dengan salah satu `targets` */
export function anyMatch (candidates, targets) {
  const cs = (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean)
  const ts = (Array.isArray(targets) ? targets : [targets]).filter(Boolean)
  return cs.some(c => ts.some(t => sameIdentity(c, t)))
}

/* ------------------------------------------------------------------ */
/* 3. MENGUMPULKAN IDENTITAS DARI KEY PESAN                            */
/* ------------------------------------------------------------------ */

/**
 * Semua identitas pengirim pesan (PN dan/atau LID).
 * WhatsApp menyediakan `participantAlt` / `remoteJidAlt` sebagai bentuk alternatif.
 */
export function senderIdentities (key = {}) {
  const raw = [
    key.participant,
    key.participantAlt,
    key.remoteJid,
    key.remoteJidAlt
  ]
    .filter(Boolean)
    .map(norm)

  // kalau pesan dari chat pribadi, participant sering kosong -> pakai remoteJid
  const out = new Set(raw)
  for (const j of raw) for (const a of aliasesOf(j)) out.add(a)
  return [...out].filter(Boolean)
}

/**
 * Semua identitas BOT sendiri.
 * PENTING: di grup mode LID, participant list berisi LID bot — bukan PN-nya.
 */
export function botIdentities (sock) {
  const out = new Set()
  const add = j => {
    if (!j) return
    const n = norm(j)
    if (n) out.add(n)
    for (const a of aliasesOf(n)) out.add(a)
  }

  add(sock?.user?.id)
  add(sock?.user?.jid)
  add(sock?.user?.lid)
  add(sock?.authState?.creds?.me?.id)
  add(sock?.authState?.creds?.me?.lid)
  add(sock?.authState?.creds?.lid)

  // bentuk device (628xxx:12@...) -> normalisasi ke user
  for (const j of [...out]) add(String(j).replace(/:\d+@/, '@'))

  return [...out].filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* 4. MENCARI PARTICIPANT DI GRUP                                      */
/* ------------------------------------------------------------------ */

/**
 * Cari participant yang cocok dengan salah satu identitas.
 * Participant punya `id` DAN (kadang) `lid` — keduanya dicek.
 */
export function findParticipant (participants, candidates) {
  if (!Array.isArray(participants) || !participants?.length) return null
  const cs = (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean)
  if (!cs.length) return null

  // 1) pencocokan cepat persis
  for (const p of participants) {
    for (const c of cs) {
      if (p.id === c || p.lid === c || p.pn === c) return p
    }
  }
  // 2) pencocokan longgar (LID<->PN, device suffix, angka)
  for (const p of participants) {
    const pids = [p.id, p.lid, p.pn, ...(p.id ? aliasesOf(p.id) : []), ...(p.lid ? aliasesOf(p.lid) : [])].filter(Boolean)
    if (cs.some(c => pids.some(pid => sameIdentity(pid, c)))) return p
  }
  return null
}

/** apakah peserta tsb admin (admin / superadmin) */
export function isAdminParticipant (p) {
  return !!(p && (p.admin === 'admin' || p.admin === 'superadmin' || p.admin === true))
}

/* ------------------------------------------------------------------ */
/* 5. CEK OWNER                                                        */
/* ------------------------------------------------------------------ */

/**
 * Cek owner yang TAHAN terhadap LID addressing.
 * @param {string[]} candidates semua identitas pengirim
 * @param {string[]} owners daftar nomor/jid owner dari config
 */
export function isOwnerIdentity (candidates, owners) {
  const cs = (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean)
  const os = (Array.isArray(owners) ? owners : [owners]).filter(Boolean)
  if (!cs.length || !os.length) return false

  // perluas owner: nomor -> @s.whatsapp.net + alias LID yang pernah terlihat
  const ownerForms = new Set()
  for (const o of os) {
    const digits = String(o).replace(/[^0-9]/g, '')
    if (digits) ownerForms.add(digits + '@s.whatsapp.net')
    if (String(o).includes('@')) ownerForms.add(norm(o))
  }
  for (const f of [...ownerForms]) for (const a of aliasesOf(f)) ownerForms.add(a)

  return cs.some(c => {
    if (ownerForms.has(norm(c))) return true
    const d = digitsOf(c)
    if (d) {
      for (const o of os) {
        const od = String(o).replace(/[^0-9]/g, '')
        if (od && od === d) return true
      }
    }
    return [...ownerForms].some(of => sameIdentity(of, c))
  })
}

/** jumlah pemetaan yang sudah dipelajari (buat debug) */
export function mappingCount () {
  return Object.keys(MAP).length
}

export function reloadMap () {
  MAP = loadDB('lidmap', {})
  return MAP
}

export default {
  canonKey,
  sameIdentity,
  anyMatch,
  aliasesOf,
  learnMapping,
  senderIdentities,
  botIdentities,
  findParticipant,
  isAdminParticipant,
  isOwnerIdentity,
  digitsOf,
  isLid,
  isPn,
  mappingCount
}

/**
 * Kunci kanonik untuk database: pakai bentuk PN kalau diketahui,
 * supaya satu orang tidak punya 2 profil (satu LID, satu PN).
 */
export function canonKey (jid, alts) {
  const list = [jid, ...(alts || [])].filter(Boolean).map(norm)
  const pn = list.find(isPn)
  return pn || norm(jid) || ''
}
