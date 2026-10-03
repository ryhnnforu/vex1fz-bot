/**
 * lib/sender.js — pengirim pesan khusus:
 *   • sendList   → interactiveMessage single_select (@japofc/baileys, patch <biz>)
 *                  fallback: relay listMessage proto mentah
 *   • sendButtons→ interactiveMessage quick_reply (japofc) → relay → legacy → teks
 *   • sendGameCard → InteractiveResponseMessage + html + kartu game
 *   • sendRaw    → kirim proto mentah lewat relayMessage
 *
 * @japofc/baileys memproses content.interactiveMessage langsung lewat
 * sendMessage (lib/Socket/dugong.js) + node <biz> di message_builder —
 * inilah perbaikan agar list/button TAMPIL di WhatsApp.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { wa } = require('./wa')
const config = require('../config')
const { log } = require('./util')

/** bungkus kanonik ala japofc: viewOnce + messageContextInfo + interactiveMessage */
function wrapInteractive(interactiveMessage) {
  return {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2,
          messageSecret: crypto.randomBytes(32)
        },
        interactiveMessage
      }
    }
  }
}

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
  // ── 1) jalur japofc: interactiveMessage + single_select (recommended) ──
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
    const ctx = quoteCtx(quoted)
    const im = {
      body: { text: description || 'Pilih menu di bawah ini' },
      footer: { text: footer || config.botName },
      header: { title: title || '', subtitle: '', hasMediaAttachment: false },
      nativeFlowMessage: {
        buttons: [{ name: 'single_select', buttonParamsJson: JSON.stringify(payload) }],
        messageParamsJson: '',
        messageVersion: 1
      }
    }
    if (ctx) im.contextInfo = ctx
    await sendRaw(sock, jid, wrapInteractive(im))
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
 * Kirim tombol (native flow quick_reply lewat japofc → fallback relay → legacy → teks)
 */
async function sendButtons(sock, jid, { text = '', footer = config.botName, title = '', buttons = [] }, quoted) {
  const nativeButtons = buttons.map(b => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: b.displayText || b.text, id: b.id || b.buttonId })
  }))

  // 1) japofc interactiveMessage — bentuk kanonik (body/footer/nativeFlowMessage)
  try {
    const ctx = quoteCtx(quoted)
    const im = {
      body: { text },
      footer: { text: footer },
      nativeFlowMessage: {
        buttons: nativeButtons,
        messageParamsJson: '',
        messageVersion: 1
      }
    }
    if (title) im.header = { title, subtitle: '', hasMediaAttachment: false }
    if (ctx) im.contextInfo = ctx
    await sendRaw(sock, jid, wrapInteractive(im))
    return
  } catch (e) {
    log.warn('japofc buttons gagal → relay:', e.message)
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
async function sendGameCard(sock, jid, { name, desc, file }, quoted) {
  const url = `${config.publicUrl || `http://localhost:${config.port}`}/games/${file}`
  let html = ''
  try {
    html = fs.readFileSync(path.join(config.gamesDir, file), 'utf8')
  } catch (_) {}

  // ── 0. AIRichResponseMessage (kartu rich) — PRIMARY (kartu lama tidak muncul) ──
  try {
    const { AIRich } = wa()
    if (typeof AIRich === 'function') {
      const rich = new AIRich(sock)
      rich.addHeading(`\u{1F3AE} ${name}`)
      rich.addText(desc || `Minigame ${name}`)
      rich.addFooterAction({ text: '\u25B6 MAIN SEKARANG', url })
      await rich.send(jid, quoted ? { quoted } : {})
      return
    }
  } catch (e) {
    log.warn('AIRich game card gagal \u2192 jalur lama:', e.message)
  }

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

  // ── 2. Kartu native flow (open_webview + quick reply) — bentuk kanonik japofc ──
  let cardOk = false
  try {
    await sendRaw(sock, jid, wrapInteractive({
      body: { text: `${desc}\n\n▶ Mainkan sekarang:\n${url}` },
      footer: { text: `${config.botName} • minigame` },
      header: { title: `🎮 ${name}`, subtitle: '', hasMediaAttachment: false },
      nativeFlowMessage: {
        buttons: [
          { name: 'open_webview', buttonParamsJson: JSON.stringify({ display_text: '▶ MAIN SEKARANG', url }) },
          { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📁 MINIGAME', id: '.minigame' }) }
        ],
        messageParamsJson: '',
        messageVersion: 1
      }
    }))
    cardOk = true
  } catch (e) {
    log.warn('kartu relay juga gagal:', e.message)
  }

  // ── 3. Jaminan teks ──
  if (!cardOk) {
    await sock.sendMessage(jid, { text: gameCardText({ name, desc, url }) })
  }
  return url
}

module.exports = { sendRaw, sendList, sendButtons, sendGameCard, gameCardText, quoteCtx }
