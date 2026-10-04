/**
 * ============================================================
 *  lib/htmlapp.js — KIRIM APLIKASI HTML INTERAKTIF LEWAT AIRICH
 * ------------------------------------------------------------
 *  Menanam web-app (game canvas, dll) di dalam pesan WhatsApp
 *  sebagai AI Rich response message, memakai primitive HTML:
 *
 *    sections[].view_model.primitive.__typename =
 *        "GenAIaeacdsnwHtmlPrimitive"
 *    sections[].view_model.primitive.payload    = "<style>…<script>…"
 *    sections[].view_model.primitive.trusted_sources = […]
 *
 *  Payload dibungkus base64 di `unifiedResponse.data`, plus
 *  `messageContextInfo.botMetadata.verificationMetadata` agar
 *  client menerimanya sebagai respons bot terverifikasi.
 *  verificationMetadata dibuat pakai AIRich.generateVerificationMetadata()
 *  (bukan cert hardcode) supaya selalu sesuai versi builder.
 * ============================================================
 */
import crypto from 'node:crypto'
import { AIRich } from '../shims/elaina.mjs'

/** typename primitive HTML milik richResponseMessage */
export const HTML_PRIMITIVE = 'GenAIaeacdsnwHtmlPrimitive'

/** default trusted source (client mengecek daftar ini) */
export const DEFAULT_TRUSTED_SOURCES = ['hirara.dev']

/** botJid yang dipakai pada forwardOrigin AI */
export const DEFAULT_BOT_JID = '867051314767696@bot'

/**
 * Buat satu section layout Single berisi primitive HTML.
 */
export function buildHtmlSection (html, trustedSources = DEFAULT_TRUSTED_SOURCES) {
  return AIRich.newLayout('Single', {
    __typename: HTML_PRIMITIVE,
    payload: String(html),
    trusted_sources: trustedSources
  })
}

/**
 * Buat object pesan lengkap (belum dikirim).
 * @param {string} jid
 * @param {object} o
 * @param {string} o.title      judul yang tampil di submessage
 * @param {string} o.html       payload HTML self-contained
 * @param {string[]} [o.trustedSources]
 * @param {string} [o.botJid]
 */
export function buildHtmlAppMessage (jid, { title = 'HTML App', html = '', trustedSources, botJid } = {}) {
  const sections = [buildHtmlSection(html, trustedSources)]
  const unified = {
    response_id: crypto.randomUUID(),
    sections
  }
  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        messageDisclaimerText: '',
        botResponseId: crypto.randomUUID(),
        verificationMetadata: AIRich.generateVerificationMetadata()
      }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [
            { messageType: 2, messageText: String(title) }
          ],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify(unified)).toString('base64')
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: { botJid: botJid || DEFAULT_BOT_JID },
            forwardOrigin: 4
          }
        }
      }
    }
  }
}

/**
 * Kirim aplikasi HTML ke jid. Melempar error kalau relay gagal
 * (pemanggil bisa fallback, mis. kirim sebagai file .html).
 */
export async function sendHtmlApp (sock, jid, opts = {}) {
  const msg = buildHtmlAppMessage(jid, opts)
  return await sock.relayMessage(jid, msg, {})
}

/**
 * Ambil kembali payload HTML dari sebuah pesan html-app (untuk debug/preview).
 */
export function decodeHtmlApp (message) {
  try {
    const rich = message?.botForwardedMessage?.message?.richResponseMessage || message?.richResponseMessage
    const json = JSON.parse(Buffer.from(rich?.unifiedResponse?.data || '', 'base64').toString('utf8'))
    const prim = json?.sections?.[0]?.view_model?.primitive
    if (prim?.__typename === HTML_PRIMITIVE) return prim.payload
    return null
  } catch {
    return null
  }
}

export default { sendHtmlApp, buildHtmlAppMessage, buildHtmlSection, decodeHtmlApp, HTML_PRIMITIVE }
