/**
 * lib/groupmeta.js — cache metadata grup + cek admin
 */
const { wa } = require('./wa')

const cache = new Map() // jid -> { ts, meta }
const TTL = 60_000

async function getMeta(sock, jid) {
  const hit = cache.get(jid)
  if (hit && Date.now() - hit.ts < TTL) return hit.meta
  const { groupMetadata } = wa()
  const meta = await sock.groupMetadata(jid)
  cache.set(jid, { ts: Date.now(), meta })
  return meta
}


/** cocokkan jid (mendukung @lid / @s.whatsapp.net / device suffix) ke participant */
function matchParticipant(meta, jids) {
  const ids = (meta.participants || [])
  for (const raw of jids) {
    if (!raw) continue
    const norm = String(raw).split(':')[0]
    const num = (norm.split('@')[0] || '').replace(/\D/g, '')
    const hit = ids.find(x => {
      const xid = (x.id || '').split(':')[0]
      if (xid === norm || xid === String(raw)) return true
      // fallback angka (pn vs device) — hanya untuk domain s.whatsapp.net
      if (num && num.length >= 8 && xid.endsWith('@s.whatsapp.net')) {
        const xnum = (xid.split('@')[0] || '').replace(/\D/g, '')
        if (xnum === num) return true
      }
      return false
    })
    if (hit) return hit
  }
  return null
}

/**
 * Apakah pengirim pesan ini admin grup? (owner selalu dianggap admin)
 */
async function isGroupAdmin(sock, m) {
  if (m.isOwner) return true
  if (!m.isGroup) return false
  try {
    const meta = await getMeta(sock, m.chat)
    const p = matchParticipant(meta, [m.sender])
    return !!p && (p.admin === 'admin' || p.admin === 'superadmin')
  } catch (e) {
    return false
  }
}

/** apakah bot admin? */
async function isBotAdmin(sock, m) {
  if (!m.isGroup) return false
  try {
    const meta = await getMeta(sock, m.chat)
    // cocokkan SEMUA identitas bot: id perangkat, lid, dan nomor — anti LID mismatch
    const cands = [sock.user?.id, sock.user?.lid, sock.user?.jid].filter(Boolean)
      .map(s => String(s).split(':')[0])
    const p = matchParticipant(meta, cands)
    return !!p && (p.admin === 'admin' || p.admin === 'superadmin')
  } catch (e) {
    return false
  }
}

/** daftar jid peserta grup */
async function participants(sock, jid) {
  const meta = await getMeta(sock, jid)
  return (meta.participants || []).map(p => p.id)
}

module.exports = { getMeta, isGroupAdmin, isBotAdmin, participants }
