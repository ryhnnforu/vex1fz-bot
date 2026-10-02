/**
 * lib/greet.js — sambutan welcome & goodbye grup (kartu canvas aesthetic)
 * Teks custom pakai placeholder: {name} {group} {date} {num} {total}
 */
const db = require('./db')
const img = require('./img')
const { getMeta } = require('./groupmeta')
const { groupCfg } = require('../commands/group')
const { log } = require('./util')

async function getName(sock, jid) {
  try {
    if (sock.getName) {
      const n = await sock.getName(jid)
      if (n && n !== jid && !/@/.test(n)) return n
    }
  } catch (_) {}
  return jid.split('@')[0]
}

async function fetchPp(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch (_) {
    return null
  }
}

function fill(text, vars) {
  return String(text)
    .replaceAll('{name}', vars.name || '')
    .replaceAll('{group}', vars.group || '')
    .replaceAll('{date}', vars.date || '')
    .replaceAll('{num}', vars.num || '')
    .replaceAll('{total}', String(vars.total ?? ''))
}

async function greet(sock, jid, participant, joining = true) {
  const cfg = groupCfg(jid)
  const state = joining ? cfg.welcome : cfg.goodbye
  if (!state?.on) return

  const num = participant.split('@')[0]
  const name = await getName(sock, participant)
  let group = jid
  let total = 0
  try {
    const meta = await getMeta(sock, jid)
    group = meta.subject || jid
    total = (meta.participants || []).length
  } catch (_) {}

  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const ppBuf = joining ? await fetchPp(sock, participant) : null

  const card = await img.welcomeCard({
    name, num, group, date, ppBuf, joining, members: total
  })

  const defaults = joining
    ? `Selamat datang @${num} di *${group}* 🎉\nJangan lupa kenalan ya!`
    : `@${num} keluar dari *${group}* 👋\nSemoga sukses selalu!`
  const caption = fill(state.text || defaults, { name, group, date, num, total })

  await sock.sendMessage(jid, {
    image: card,
    caption,
    mentions: [participant]
  })
}

function sendWelcome(sock, jid, participant) {
  return greet(sock, jid, participant, true)
    .catch(e => log.warn('welcome gagal:', e.message))
}

function sendGoodbye(sock, jid, participant) {
  return greet(sock, jid, participant, false)
    .catch(e => log.warn('goodbye gagal:', e.message))
}

module.exports = { sendWelcome, sendGoodbye, fill }
