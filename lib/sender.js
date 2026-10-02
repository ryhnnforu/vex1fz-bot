/**
 * lib/sender.js — pengirim pesan khusus:
 *   • sendList   → interactiveMessage single_select (ourin-baileys, patch <biz>)
 *                  fallback: relay listMessage proto mentah
 *   • sendButtons→ interactiveMessage quick_reply (ourin) → relay → legacy → teks
 *   • sendGameCard → InteractiveResponseMessage + html + kartu game
 *   • sendRaw    → kirim proto mentah lewat relayMessage
 *
 * ourin-baileys memproses content.interactiveMessage langsung lewat
 * sendMessage (lib/Socket/dugong.js) + node <biz> di message_builder —
 * inilah perbaikan agar list/button TAMPIL di WhatsApp.
 */
const fs = require('fs')
const path = require('path')
const { wa } = require('./wa')
const config = require('../config')
const { log } = require('./util')

/** kirim proto mentah */
async function sendRaw(sock, jid, protoMsg, options = {}) {
  const { generateWAMessageFromContent, proto, generateMessageIDV2 } = wa()
  const msg = generateWAMessageFromContent(jid, proto.Message.fromObject(protoMsg), {
    messageId: options.messageId || generateMessageIDV2(sock.user?.id),
    ...options
  })
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/** contextInfo untuk membalas/mengutip pesan */
function quoteCtx(quoted) {
  if (!quoted) return undefined
  return {
    mentionedJid: quoted.mentionedJid || [quoted.sender].filter(Boolean),
    stanzaId: quoted.key?.id,
    participant: quoted.key?.participant || quoted.sender,
    quotedMessage: quoted.message
  }
}

/**
 * Kirim ListMessage (sheet "Pilih")
 * @param {Array<{title:string, rows:Array<{title:string, description:string, rowId:string}>}>} sections
 */
async function sendList(sock, jid, { title = '', description = '', buttonText = 'Pilih', footer = '', sections = [] }, quoted) {
  // ── 1) jalur ourin: interactiveMessage + single_select (recommended) ──
  try {
    const payload = {
      title: title || buttonText,
      sections: sections.map(s => ({
        title: s.title,
        rows: s.rows.map(r => ({
          title: r.title,
          description: r.description || '',
          id: r.rowId
        }))
      }))
    }
    const msg = {
      interactiveMessage: {
        title: description || 'Pilih menu di bawah ini',
        header: title || '',
        footer: footer || config.botName,
        buttons: [
          {
            name: 'single_select',
            buttonParamsJson: JSON.stringify(payload)
          }
        ]
      }
    }
    const ctx = quoteCtx(quoted)
    if (ctx) msg.interactiveMessage.contextInfo = ctx
    await sock.sendMessage(jid, msg)
    return
  } catch (e) {
    log.warn('interactive list gagal → fallback relay legacy:', e.message)
  }

  // ── 2) fallback: relay listMessage proto mentah ──
  const listMessage = {
    title,
    description,
    buttonText,
    listType: 1,
    footerText: footer,
    sections: sections.map(s => ({
      title: s.title,
      rows: s.rows.map(r => ({
        title: r.title,
        description: r.description || '',
        rowId: r.rowId
      }))
    }))
  }
  const ctx = quoteCtx(quoted)
  if (ctx) listMessage.contextInfo = ctx
  try {
    return await sendRaw(sock, jid, { listMessage })
  } catch (e2) {
    log.warn('relay list juga gagal → teks biasa:', e2.message)
    const lines = sections.map(s => `▸ ${s.title}\n` + s.rows.map(r => `  • ${r.title} — ${r.description || ''}`).join('\n')).join('\n')
    await sock.sendMessage(jid, { text: `${title}\n${description}\n\n${lines}\n\n(prefix ${config.userPrefix})` }, quoted ? { quoted: quoted.raw || undefined } : undefined)
  }
}

/**
 * Kirim tombol (native flow quick_reply lewat ourin → fallback relay → legacy → teks)
 */
async function sendButtons(sock, jid, { text = '', footer = config.botName, title = '', buttons = [] }, quoted) {
  const nativeButtons = buttons.map(b => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: b.displayText || b.text, id: b.id || b.buttonId })
  }))

  // 1) ourin interactiveMessage
  try {
    const msg = {
      interactiveMessage: {
        title: text,
        header: title || '',
        footer,
        buttons: nativeButtons
      }
    }
    const ctx = quoteCtx(quoted)
    if (ctx) msg.interactiveMessage.contextInfo = ctx
    await sock.sendMessage(jid, msg)
    return
  } catch (e) {
    log.warn('ourin buttons gagal → relay:', e.message)
  }

  // 2) relay viewOnce + nativeFlow (jalur lama)
  try {
    await sendRaw(sock, jid, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text },
            footer: { text: footer },
            nativeFlowMessage: { buttons: nativeButtons, messageParamsJson: '', messageVersion: 1 },
            contextInfo: quoteCtx(quoted)
          }
        }
      }
    })
    return
  } catch (e) {
    log.warn('native flow relay gagal, fallback legacy buttons:', e.message)
  }

  // 3) legacy buttonsMessage
  try {
    await sendRaw(sock, jid, {
      buttonsMessage: {
        contentText: text,
        footerText: footer,
        headerType: 1,
        buttons: buttons.map(b => ({
          buttonId: b.id || b.buttonId,
          buttonText: { displayText: b.displayText || b.text },
          type: 1
        }))
      }
    })
  } catch (e2) {
    log.warn('legacy buttons gagal, fallback teks biasa:', e2.message)
    await sock.sendMessage(jid, { text: `${text}\n\n${buttons.map(b => `• ${b.displayText || b.text}`).join('\n')}` }, quoted ? { quoted } : undefined)
  }
}

/** teks kartu game (dipakai sebagai jaminan selalu terbaca) */
function gameCardText({ name, desc, url }) {
  return (
    `┌┈┈┈┈┈┈┈○ 「 ${name.toUpperCase()} 」\n` +
    `│ *GAME*  : ${name}\n` +
    `│ *TEMA*  : ${desc}\n` +
    `│ *STATUS*: ✅ SIAP DIMAINKAN\n` +
    `└┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈○\n\n` +
    `🕹️ Buka game:\n${url}\n\n` +
    `*Cara main:* ketuk link di atas → mainkan di browser.`
  )
}

/**
 * Kirim kartu minigame:
 *  1. InteractiveResponseMessage + html  (sesuai permintaan)
 *  2. Kartu native flow (open_webview + quick reply)
 *  3. Teks kartu (jaminan selalu terbaca)
 */
async function sendGameCard(sock, jid, { name, desc, file }) {
  const url = `${config.publicUrl || `http://localhost:${config.port}`}/games/${file}`
  let html = ''
  try {
    html = fs.readFileSync(path.join(config.gamesDir, file), 'utf8')
  } catch (_) {}

  // ── 1. InteractiveResponseMessage + html ──
  if (html) {
    try {
      await sendRaw(sock, jid, {
        interactiveResponseMessage: {
          body: { text: html, format: 'EXTENSIONS_1' },
          nativeFlowResponseMessage: {
            name: 'html_content',
            paramsJson: JSON.stringify({ html, title: name, url }),
            version: 1
          }
        }
      })
    } catch (e) {
      log.warn('interactiveResponseMessage gagal (dilanjutkan):', e.message)
    }
  }

  // ── 2. Kartu native flow (open_webview + quick reply) — via ourin ──
  let cardOk = false
  try {
    await sock.sendMessage(jid, {
      interactiveMessage: {
        title: `${desc}\n\n▶ Mainkan sekarang:\n${url}`,
        header: `🎮 ${name}`,
        footer: `${config.botName} • minigame`,
        buttons: [
          { name: 'open_webview', buttonParamsJson: JSON.stringify({ display_text: '▶ MAIN SEKARANG', url }) },
          { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📁 MINIGAME', id: '.minigame' }) }
        ]
      }
    })
    cardOk = true
  } catch (e) {
    log.warn('kartu interactive gagal, coba relay:', e.message)
    try {
      await sendRaw(sock, jid, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: `🎮 ${name}`, hasMediaAttachment: false },
              body: { text: `${desc}\n\n▶ Mainkan sekarang:\n${url}` },
              footer: { text: `${config.botName} • minigame` },
              nativeFlowMessage: {
                buttons: [
                  { name: 'open_webview', buttonParamsJson: JSON.stringify({ display_text: '▶ MAIN SEKARANG', url }) },
                  { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📁 MINIGAME', id: '.minigame' }) }
                ],
                messageParamsJson: '',
                messageVersion: 1
              }
            }
          }
        }
      })
      cardOk = true
    } catch (e2) {
      log.warn('kartu relay juga gagal:', e2.message)
    }
  }

  // ── 3. Jaminan teks ──
  if (!cardOk) {
    await sock.sendMessage(jid, { text: gameCardText({ name, desc, url }) })
  }
  return url
}

module.exports = { sendRaw, sendList, sendButtons, sendGameCard, gameCardText, quoteCtx }
