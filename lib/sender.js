/**
 * lib/sender.js — pengirim pesan khusus:
 *   • sendList   → ListMessage (tombol "Pilih" seperti video contoh)
 *   • sendButtons→ ButtonsMessage (legacy) + native flow quick_reply
 *   • sendGameCard → InteractiveResponseMessage + html + kartu game
 *   • sendRaw    → kirim proto mentah lewat relayMessage
 *
 * Catatan: generateWAMessageContent() resmi Baileys TIDAK menerima
 * listMessage / buttonsMessage / interactiveResponseMessage langsung,
 * jadi semua jenis itu dikirim lewat generateWAMessageFromContent + relayMessage.
 */
const fs = require('fs')
const path = require('path')
const {
  generateWAMessageFromContent,
  proto,
  generateMessageIDV2
} = require('@whiskeysockets/baileys')
const config = require('../config')
const { log } = require('./util')

/** kirim proto mentah */
async function sendRaw(sock, jid, protoMsg, options = {}) {
  const msg = generateWAMessageFromContent(jid, proto.Message.fromObject(protoMsg), {
    messageId: options.messageId || generateMessageIDV2(sock.user?.id),
    ...options
  })
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * Kirim ListMessage (sheet "Pilih")
 * @param {Array<{title:string, rows:Array<{title:string, description:string, rowId:string}>}>} sections
 */
async function sendList(sock, jid, { title = '', description = '', buttonText = 'Pilih', footer = '', sections = [] }, quoted) {
  const listMessage = {
    title,
    description,
    buttonText,
    listType: 1, // SINGLE_SELECT
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
  if (quoted) {
    listMessage.contextInfo = {
      mentionedJid: quoted.mentionedJid || [quoted.sender].filter(Boolean),
      stanzaId: quoted.key?.id,
      participant: quoted.key?.participant || quoted.sender,
      quotedMessage: quoted.message
    }
  }
  return sendRaw(sock, jid, { listMessage })
}

/**
 * Kirim tombol (native flow quick_reply + fallback legacy buttonsMessage)
 */
async function sendButtons(sock, jid, { text = '', footer = config.botName, buttons = [] }, quoted) {
  // 1) native flow (interactiveMessage) — pendekatan modern
  try {
    const nativeButtons = buttons.map(b => ({
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({ display_text: b.displayText || b.text, id: b.id || b.buttonId })
    }))
    const ctx = quoted ? {
      contextInfo: {
        mentionedJid: [quoted.sender].filter(Boolean),
        stanzaId: quoted.key?.id,
        participant: quoted.key?.participant || quoted.sender,
        quotedMessage: quoted.message
      }
    } : {}
    await sendRaw(sock, jid, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text },
            footer: { text: footer },
            nativeFlowMessage: { buttons: nativeButtons, messageParamsJson: '', messageVersion: 1 },
            contextInfo: ctx.contextInfo ? ctx.contextInfo : undefined
          }
        }
      }
    })
    return
  } catch (e) {
    log.warn('native flow gagal, fallback legacy buttons:', e.message)
  }

  // 2) legacy buttonsMessage
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
    await sock.sendMessage(jid, { text: `${text}\n\n${buttons.map(b => `• ${b.displayText || b.text}`).join('\n')}` }, { quoted })
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

  // ── 2. Kartu native flow (open_webview + quick reply) ──
  let cardOk = false
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
  } catch (e) {
    log.warn('kartu native flow gagal:', e.message)
  }

  // ── 3. Jaminan teks ──
  if (!cardOk) {
    await sock.sendMessage(jid, { text: gameCardText({ name, desc, url }) })
  }
  return url
}

module.exports = { sendRaw, sendList, sendButtons, sendGameCard, gameCardText }
