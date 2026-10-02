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

/**
 * Apakah pengirim pesan ini admin grup? (owner selalu dianggap admin)
 */
async function isGroupAdmin(sock, m) {
  if (m.isOwner) return true
  if (!m.isGroup) return false
  try {
    const meta = await getMeta(sock, m.chat)
    const jid = m.sender
    const p = (meta.participants || []).find(x =>
      x.id === jid || (x.id || '').split(':')[0] === jid.split(':')[0]
    )
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
    const botId = (sock.user?.id || '').split(':')[0]
    const p = (meta.participants || []).find(x => (x.id || '').split(':')[0] === botId)
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
