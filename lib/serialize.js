/**
 * lib/serialize.js — serialisasi pesan masuk
 *   • mendukung pesan teks biasa, caption, balasan tombol/list
 *   • deteksi prefix: "." (user) | "/", ",", "=>" (owner)
 *   • deteksi owner via nomor PN + LID
 */
const { wa } = require('./wa')
const config = require('../config')
const db = require('./db')
const { pickUrl } = require('./util')

/* akses laz ke export @japofc/baileys (ESM) — hanya dipanggil di dalam fungsi */
function W() {
  const m = wa()
  return {
    getContentType: m.getContentType,
    normalizeMessageContent: m.normalizeMessageContent,
    jidNormalizedUser: m.jidNormalizedUser,
    areJidsSameUser: m.areJidsSameUser
  }
}

const OWNER_IDS = [
  `${config.ownerNumber}@s.whatsapp.net`,
  config.ownerLid,
  config.ownerNumber,
  config.ownerLid.replace('@lid', '')
].filter(Boolean)

function isOwnerJid(jid = '') {
  if (!jid) return false
  const { jidNormalizedUser } = W()
  const norm = jidNormalizedUser(jid)
  const bare = norm.split('@')[0]
  return OWNER_IDS.some(id => id === norm || id === bare || id.split('@')[0] === bare)
}

function extractText(message) {
  if (!message) return ''
  const { getContentType } = W()
  const type = getContentType(message)
  const m = message[type] || message
  switch (type) {
    case 'conversation': return m || ''
    case 'extendedTextMessage': return m.text || ''
    case 'imageMessage':
    case 'videoMessage':
    case 'documentMessage':
    case 'audioMessage': return m.caption || ''
    case 'buttonsResponseMessage': return m.selectedButtonId || ''
    case 'templateButtonReplyMessage': return m.selectedId || ''
    case 'listResponseMessage': return m.singleSelectReply?.selectedRowId || ''
    case 'interactiveResponseMessage': {
      try {
        const p = JSON.parse(m.nativeFlowResponseMessage?.paramsJson || '{}')
        if (p.id) return p.id
        if (p.command) return p.command
      } catch (_) {}
      return m.body?.text || ''
    }
    case 'messageContextInfo': return ''
    default:
      return m?.text || m?.caption || ''
  }
}

function extractMessageType(message) {
  if (!message) return null
  const { getContentType } = W()
  return getContentType(message)
}

/**
 * Serialisasi satu WAMessage
 * @returns {null|object} m — null jika pesan bisa diabaikan
 */
function serialize(sock, msg) {
  if (!msg?.message) return null
  if (!msg.key) return null

  // buka bungkusan (viewOnce / ephemeral / edited / documentWithCaption)
  const { normalizeMessageContent, jidNormalizedUser, areJidsSameUser } = W()
  let content = normalizeMessageContent(msg.message)
  if (!content) return null

  const type = extractMessageType(content)
  if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage') return null

  const isGroup = msg.key.remoteJid?.endsWith('@g.us') || false
  const fromMe = !!msg.key.fromMe

  // identitas pengirim
  let sender = msg.key.participant || msg.key.remoteJid
  if (isGroup && !sender) sender = msg.key.remoteJid
  sender = jidNormalizedUser(sender || '')
  const chat = jidNormalizedUser(msg.key.remoteJid || '')

  // jangan proses status / broadcast kecuali perlu
  if (chat.includes('status@')) return null

  const rawText = extractText(content)
  const text = typeof rawText === 'string' ? rawText.trim() : ''

  // ── parse prefix & command ──
  let prefix = null
  let command = null
  let args = []
  let body = text

  if (text) {
    if (text.startsWith('=>')) {
      prefix = '=>'
      body = text.slice(2).trim()
    } else if (['.', '/', ','].includes(text[0])) {
      prefix = text[0]
      body = text.slice(1).trim()
    }
    if (prefix !== null) {
      const sp = body.search(/\s/)
      command = (sp === -1 ? body : body.slice(0, sp)).toLowerCase()
      args = sp === -1 ? [] : body.slice(sp + 1).trim().split(/\s+/).filter(Boolean)
      if (!command) { command = null; prefix = prefix } // ".": command kosong
    }
  }

  const isOwner = fromMe || isOwnerJid(sender) || isOwnerJid(chat)

  // contextInfo ringkas
  const inner = content[type] && typeof content[type] === 'object' ? content[type] : {}
  const ctx = inner.contextInfo || {}

  // quoted message (ringkas)
  let quoted = null
  if (ctx.quotedMessage) {
    const qContent = normalizeMessageContent(ctx.quotedMessage)
    const qType = extractMessageType(qContent)
    const qSender = ctx.participant || sender
    quoted = {
      key: {
        id: ctx.stanzaId,
        remoteJid: chat,
        participant: ctx.participant,
        fromMe: areJidsSameUser(qSender, sock.user?.id || '')
      },
      sender: jidNormalizedUser(qSender || ''),
      type: qType,
      message: qContent,
      text: extractText(qContent),
      mentionedJid: ctx.quotedMessage?.[qType]?.contextInfo?.mentionedJid || []
    }
    if (qType === 'imageMessage' || qType === 'videoMessage' || qType === 'documentMessage' || qType === 'stickerMessage') {
      quoted.mediaType = qType
    }
  }

  const user = db.getUser(sender)
  db.resetLimitIfNeeded(user)

  const m = {
    key: msg.key,
    id: msg.key.id,
    chat,
    sender,
    fromMe,
    isGroup,
    isOwner,
    pushName: msg.pushName || '',
    type,
    text,
    body,
    prefix,
    command,
    args,
    mentions: ctx.mentionedJid || [],
    quoted,
    user,
    raw: msg,
    content,

    /** balas pesan */
    reply: async (contentOrText, opts = {}) => {
      const payload = typeof contentOrText === 'string' ? { text: contentOrText } : { ...contentOrText }
      if (opts.mentions) payload.mentions = opts.mentions // mentions harus di PAYLOAD
      const rest = { ...opts }
      delete rest.mentions
      delete rest.quoted
      return sock.sendMessage(chat, payload, {
        quoted: opts.quoted === false ? undefined : msg,
        ...rest
      })
    },
    /** react emoji */
    react: async (emoji) => {
      return sock.sendMessage(chat, { react: { text: emoji, key: msg.key } })
    }
  }

  return m
}

module.exports = { serialize, isOwnerJid }
