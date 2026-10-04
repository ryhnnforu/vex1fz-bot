/**
 * ============================================================
 *  SERIALIZER — merapikan pesan masuk jadi object `m` yang enak dipakai
 *  Support: teks, media, sticker, poll, location, contact,
 *           button reply, LIST reply, INTERACTIVE reply, AI Rich reply
 * ============================================================
 */
import {
  getContentType,
  extractMessageContent,
  downloadMediaMessage,
  jidNormalizedUser,
  jidDecode,
  isJidGroup,
  isJidNewsletter,
  areJidsSameUser,
  proto
} from '../shims/elaina.mjs'
import { config } from '../config.js'
import { saveTmp, sniffMime } from './functions.js'
import { senderIdentities, botIdentities, learnMapping, sameIdentity } from './identity.js'

const MEDIA_KEYS = [
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'stickerMessage',
  'documentMessage',
  'ptvMessage'
]

/** ambil id tombol / list / interactive yang di-klik user */
export function getButtonId (msg) {
  if (!msg) return null
  // 1) interactive / native flow (Button, Button List, Carousel)
  const inter = msg.interactiveResponseMessage
  if (inter) {
    const raw = inter.nativeFlowResponseMessage?.paramsJson
    if (raw) {
      try {
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw
        return p.id || p.selectedId || p.native_flow_name || null
      } catch {
        /* ignore */
      }
    }
  }
  // 2) button klasik (buttonsMessage)
  const btn = msg.buttonsResponseMessage
  if (btn) return btn.selectedButtonId || btn.selectedDisplayText || null
  // 3) list message
  const list = msg.listResponseMessage
  if (list) return list.singleSelectReply?.selectedRowId || list.title || null
  // 4) template button
  const tpl = msg.templateButtonReplyMessage
  if (tpl) return tpl.selectedId || null
  return null
}

/** teks tampilan dari tombol yang di-klik */
export function getButtonDisplayText (msg) {
  if (!msg) return ''
  const inter = msg.interactiveResponseMessage
  const raw = inter?.nativeFlowResponseMessage?.paramsJson
  if (raw) {
    try {
      const p = typeof raw === 'string' ? JSON.parse(raw) : raw
      return p.display_text || p.title || p.selectedDisplayText || ''
    } catch {}
  }
  return (
    msg.buttonsResponseMessage?.selectedDisplayText ||
    msg.listResponseMessage?.title ||
    msg.templateButtonReplyMessage?.selectedDisplayText ||
    ''
  )
}

/** parse pesan jadi object m */
export function smsg (sock, raw) {
  if (!raw) return null
  const m = {}

  m.raw = raw
  m.key = raw.key || {}
  m.jid = m.key.remoteJid || ''
  m.id = m.key.id
  m.isGroup = isJidGroup(m.jid)
  m.isNewsletter = isJidNewsletter(m.jid)
  m.isStatus = m.jid === 'status@broadcast'
  m.fromMe = !!m.key.fromMe
  m.sender = m.isGroup
    ? m.key.participant || m.key.remoteJid
    : m.key.remoteJid || m.key.participant || ''
  m.sender = jidNormalizedUser(m.sender || '')
  /* nama tampilan pengirim (dipakai leaderboard game, profil, AI) */
  m.pushName = raw.pushName || raw.notifyName || raw.verifiedBizName || ''

  /* ---- LID / PN addressing ----
     WhatsApp bisa mengirim identitas sebagai `xxx@lid` ATAU `628xxx@s.whatsapp.net`.
     `remoteJidAlt` / `participantAlt` adalah bentuk alternatifnya.
     Pelajari pemetaannya + simpan SEMUA bentuk untuk perbandingan yang benar. */
  learnMapping([m.key.participant, m.key.participantAlt, m.key.remoteJid, m.key.remoteJidAlt])
  m.senderAlts = senderIdentities(m.key)
  m.senderAlt = m.key.participantAlt || m.key.remoteJidAlt || ''
  m.senderNumber =
    m.senderAlts.map(a => (a.endsWith('@s.whatsapp.net') ? a.split('@')[0] : '')).find(Boolean) || ''

  m.user = jidNormalizedUser(sock?.user?.id?.replace(/:\d+@/, '@') || sock?.user?.id || '')
  m.userAlts = botIdentities(sock)
  m.botNumber = m.user ? m.user.split('@')[0] : ''
  m.botLid = m.userAlts.find(j => j.endsWith('@lid')) || ''
  m.timestamp = raw.messageTimestamp

  let msg = raw.message || null
  // pesan hasil forward / ephemeral
  if (msg?.ephemeralMessage?.message) msg = msg.ephemeralMessage.message
  if (msg?.viewOnceMessage?.message) msg = msg.viewOnceMessage.message
  if (msg?.viewOnceMessageV2?.message) msg = msg.viewOnceMessageV2.message
  if (msg?.documentWithCaptionMessage?.message) msg = msg.documentWithCaptionMessage.message
  if (msg?.editedMessage?.message) msg = msg.editedMessage.message || msg
  if (msg?.messageContextInfo?.stanzaId && !m.id) m.id = msg.messageContextInfo.stanzaId

  m.msg = msg
  m.mtype = getContentType(msg) || ''
  m.isBot = !!(
    msg?.messageContextInfo?.botMetadata ||
    raw.messageContextInfo?.botMetadata ||
    msg?.botForwardedMessage
  )

  const content = extractMessageContent(msg) || msg || {}
  m.content = content

  // ---------- TEKS ----------
  let text =
    content?.conversation ||
    content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption ||
    content?.videoMessage?.caption ||
    content?.documentMessage?.caption ||
    content?.ptvMessage?.caption ||
    content?.buttonsResponseMessage?.selectedDisplayText ||
    content?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    content?.templateButtonReplyMessage?.selectedDisplayText ||
    ''

  // klik tombol / list -> jadikan teks command
  const btnId = getButtonId(msg)
  m.buttonId = btnId
  m.buttonText = getButtonDisplayText(msg)
  if (btnId && !text) text = String(btnId)
  else if (btnId && text && text !== String(btnId)) text = String(btnId)

  m.text = String(text || '').replace(/\u200e+/g, '').trim()
  m.body = m.text

  // ---------- COMMAND ----------
  const prefixes = Array.isArray(config.display.prefix) ? config.display.prefix : [config.display.prefix]

  // "symbol command": command-nya adalah simbol itu sendiri (eval/exec),
  // misal "> return 1+1" -> command '>', arg 'return 1+1'
  const symbolCmds = Array.isArray(config.display.symbolPrefix)
    ? config.display.symbolPrefix
    : ['=>', '>', '$']
  const sym = symbolCmds.find(s => m.body === s || m.body.startsWith(s + ' ') || m.body.startsWith(s + '\n'))

  const single = sym || prefixes.find(p => m.body.startsWith(p))

  /* v7.37.0: perintah TANPA prefix (mis. `ls -la` gaya Termux).
     Hanya untuk kata perintah yang benar-benar terdaftar di daftar ini,
     supaya pesan biasa tidak tiba-tiba dianggap perintah. */
  const PERINTAH_TANPA_PREFIX = new Set(['ls', 'cd', 'pwd', 'cat', 'clear'])
  let tanpaPrefix = ''
  if (!single) {
    const kataPertama = (m.body.trim().split(/[\s\n]+/)[0] || '').toLowerCase()
    /* patch .bash (v-bash-shell): mode shell BAWAANNYA NYALA untuk owner,
       jadi `ls`/`cd`/`pwd`/`cat`/`clear` tanpa prefix dibiarkan jadi pesan
       biasa supaya ditangkap checkBash sebagai perintah shell. Hanya chat
       yang dimatikan lewat `.bash off` yang kembali ke perintah bot.
       (User biasa tidak terpengaruh: checkBash menolak mereka lebih dulu.) */
    if (PERINTAH_TANPA_PREFIX.has(kataPertama) && globalThis.__THERYHANN_BASH_MATI__?.has?.(m.jid)) tanpaPrefix = kataPertama
  }

  m.isCommand = !!single || !!tanpaPrefix
  m.prefix = single || ''
  m.noPrefix = !!tanpaPrefix

  let command, arg, args
  if (sym) {
    // command = simbol, arg = sisa teks
    command = sym
    arg = m.body.slice(sym.length).trim()
    args = arg.split(/[\s\n]+/).filter(Boolean)
  } else {
    const bodyNoPrefix = single ? m.body.slice(single.length) : m.body
    command = (bodyNoPrefix.trim().split(/[\s\n]+/)[0] || '').toLowerCase()
    arg = bodyNoPrefix.trim().slice(command.length).trim()
    args = bodyNoPrefix.trim().split(/[\s\n]+/).slice(1)
  }
  m.command = String(command).toLowerCase()
  m.arg = arg
  m.args = args
  m.q = arg
  m.isMedia = MEDIA_KEYS.includes(m.mtype)

  // ---------- QUOTED ----------
  m.quoted = null
  m.mentionJid = content?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const ctx = content?.extendedTextMessage?.contextInfo || msg?.imageMessage?.contextInfo || msg?.videoMessage?.contextInfo || {}
  m.mentioned = m.mentionJid.concat(ctx.groupMentions?.map(g => g.groupJid) || [])
  const quotedMsg = ctx?.quotedMessage
  if (quotedMsg) {
    const qType = getContentType(quotedMsg)
    const qContent = extractMessageContent(quotedMsg) || {}
    m.quoted = {
      mtype: qType,
      msg: quotedMsg,
      text:
        qContent?.conversation ||
        qContent?.extendedTextMessage?.text ||
        qContent?.imageMessage?.caption ||
        qContent?.videoMessage?.caption ||
        getButtonId(quotedMsg) ||
        '',
      sender: jidNormalizedUser(ctx.participant || ''),
      key: {
        remoteJid: ctx.remoteJid || m.jid,
        fromMe: areJidsSameUser(ctx.participant || '', m.user) || false,
        id: ctx.stanzaId,
        participant: ctx.participant
      },
      isMedia: MEDIA_KEYS.includes(qType),
      /* identitas media yang dibalas — dipakai .>_ (nama file plugin dari dokumen) */
      mimetype: qContent?.[qType]?.mimetype || qContent?.documentMessage?.mimetype || '',
      fileName: qContent?.[qType]?.fileName || qContent?.documentMessage?.fileName || '',
      size: Number(qContent?.[qType]?.fileLength || qContent?.documentMessage?.fileLength || 0),
      isDocument: qType === 'documentMessage',
      download: () => downloadQuoted(sock, quotedMsg, qType),
      toBuffer: () => downloadQuoted(sock, quotedMsg, qType),
      delete: () =>
        sock.sendMessage(m.jid, { delete: { remoteJid: m.jid, fromMe: m.fromMe, id: ctx.stanzaId, participant: ctx.participant } })
    }
    // klik tombol dari pesan yang di-reply
    const qBtn = getButtonId(quotedMsg)
    if (qBtn && !m.text) {
      m.text = String(qBtn)
      m.isCommand = prefixes.some(p => m.text.startsWith(p))
    }
  }

  // ---------- MEDIA ----------
  m.mediaKey = MEDIA_KEYS.find(k => msg?.[k]) || null
  m.download = () => downloadAny(sock, raw, msg, m.mtype)
  m.toBuffer = m.download
  m.mimetype = msg?.[m.mediaKey]?.mimetype || ''
  m.fileName = msg?.[m.mediaKey]?.fileName || ''
  m.isDocument = m.mtype === 'documentMessage'
  m.size = msg?.[m.mediaKey]?.fileLength || 0
  m.seconds = msg?.[m.mediaKey]?.seconds || msg?.[m.mediaKey]?.duration || 0
  m.isImage = m.mtype === 'imageMessage'
  m.isVideo = m.mtype === 'videoMessage' || m.mtype === 'ptvMessage'
  m.isAudio = m.mtype === 'audioMessage'
  m.isSticker = m.mtype === 'stickerMessage'
  m.isDocument = m.mtype === 'documentMessage'
  m.isContact = m.mtype === 'contactMessage' || m.mtype === 'contactsArrayMessage'
  m.isLocation = m.mtype === 'locationMessage'
  m.isPoll = !!msg?.pollCreationMessage || !!msg?.pollCreationMessageV2 || !!msg?.pollCreationMessageV3
  m.isOnce = !!raw.message?.viewOnceMessage || !!raw.message?.viewOnceMessageV2

  m.mentionsBot =
    m.mentioned.some(j => m.userAlts.some(u => sameIdentity(j, u))) ||
    new RegExp(`@${(m.user || '').split('@')[0]}`, 'i').test(m.text)

  return m
}

async function downloadAny (sock, raw, msg, mtype) {
  const target = { ...raw, message: msg || raw.message }
  const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage })
  return buf
}

async function downloadQuoted (sock, quotedMsg, qType) {
  const fake = { key: { remoteJid: '', id: '', fromMe: false }, message: quotedMsg }
  return await downloadMediaMessage(fake, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage })
}

/** download media -> simpan ke tmp -> return { path, mime, buffer } */
export async function downloadToFile (m) {
  const buf = await (m.quoted?.isMedia ? m.quoted.download() : m.download())
  const mime = m.mimetype || sniffMime(buf)
  const ext =
    mime.split('/')[1]?.split(';')[0] ||
    (mime.includes('webp') ? 'webp' : mime.includes('mp4') ? 'mp4' : 'bin')
  const file = saveTmp(buf, ext === 'jpeg' ? 'jpg' : ext)
  return { buffer: buf, path: file, mime }
}

export { jidNormalizedUser, jidDecode, isJidGroup, isJidNewsletter, areJidsSameUser, proto }
export default { smsg, getButtonId, downloadToFile }
