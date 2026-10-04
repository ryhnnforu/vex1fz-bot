/**
 * ============================================================
 *  lib/ctxtg.js — ADAPTER "ctx" GAYA TELEGRAM (v7.7.1)
 * ------------------------------------------------------------
 *  Dipakai oleh plugin hasil .addplugin: kode yang ditulis untuk
 *  Bot Telegram (Telegraf-ish, `bot.command(...)/(ctx)=>{...}`)
 *  dijalankan di bot WhatsApp ini dengan bentuk `ctx` yang familiar:
 *
 *      ctx.reply(teks)              → m.reply(teks)
 *      ctx.replyWithPhoto(url,{caption})
 *      ctx.replyWithVideo(url,{caption})
 *      ctx.replyWithDocument(url,{caption,filename})
 *      ctx.replyWithAudio(url)
 *      ctx.replyWithSticker(url)
 *      ctx.message.photo            → ada bila pesan ini membawa foto
 *      ctx.message.reply_to_message.photo → ada bila pesan dibalas foto
 *      ctx.telegram.getFileLink(id) → URL publik media WA
 *                                     (unduh buffer → litter.catbox)
 *      ctx.from.first_name          → nama pengirim
 *      ctx.chat.id                  → jid chat
 *
 *  Media berkas diunduh dari server WhatsApp (bukan webview) sesuai
 *  aturan proyek; `m.sock.sendMessage` memakai sumber {url} jadi
 *  server bot yang memanggang kiriman, bukan client pengguna.
 * ============================================================
 */
import { unggahLitter } from './ikyyapi.js'

const FOTO = src => (typeof src === 'string' ? { url: src } : src)

/** sumber media: kutipan pesan yang dibalas ▶ media di pesan opsi sendiri */
async function ambilBufferWa (m) {
  if (m.quoted?.isMedia) {
    const mime = m.quoted.mimetype || ''
    return { buf: await m.quoted.toBuffer(), ekst: /video/i.test(mime) ? 'mp4' : /webp/i.test(mime) ? 'webp' : /image/i.test(mime) ? 'jpg' : 'bin' }
  }
  if (m.isMedia || m.mediaKey) {
    const mime = m.mimetype || ''
    return { buf: await m.download(), ekst: /video/i.test(mime) ? 'mp4' : /image/i.test(mime) ? 'jpg' : 'bin' }
  }
  return null
}

/**
 * Bangun adapter ctx untuk handler `m` bot ini.
 */
export function buatCtx (m) {
  const fotoSendiri = (m.isMedia || m.mediaKey) && /^image\//.test(m.mimetype || '')
  const videoSendiri = (m.isMedia || m.mediaKey) && /^video\//.test(m.mimetype || '')
  const fotoBalasan = m.quoted?.isMedia && /^image\//.test(m.quoted.mimetype || '')
  const videoBalasan = m.quoted?.isMedia && /^video\//.test(m.quoted.mimetype || '')

  return {
    from: { first_name: m.pushName || 'User', id: String((m.sender || '').split('@')[0]) },
    chat: { id: m.jid, type: m.isGroup ? 'supergroup' : 'private' },

    message: {
      message_id: m.id || m.key?.id,
      caption: m.q || m.text || '',
      photo: fotoSendiri ? [{ file_id: 'wa-media-1' }] : undefined,
      video: videoSendiri ? [{ file_id: 'wa-media-1' }] : undefined,
      reply_to_message: m.quoted
        ? {
            message_id: m.quoted.key?.id,
            text: m.quoted.text,
            photo: fotoBalasan ? [{ file_id: 'wa-media-1' }] : undefined,
            video: videoBalasan ? [{ file_id: 'wa-media-1' }] : undefined,
            sticker: m.quoted.tipe ? undefined : undefined,
            document: m.quoted.isDocument ? { file_id: 'wa-doc-1', file_name: m.quoted.fileName || 'dokumen' } : undefined,
            from: { first_name: String((m.quoted.sender || '').split('@')[0]) }
          }
        : undefined
    },

    telegram: {
      /** token WA → URL publik (unduh buffer + unggah litter.catbox sementara) */
      getFileLink: async (fileId) => {
        void fileId
        const ambil = await ambilBufferWa(m).catch(e => { throw new Error('media WhatsApp tidak bisa diunduh: ' + (e?.message || e)) })
        if (!ambil || !ambil.buf?.length) {
          throw new Error('tidak ada media — balas foto/video dengan perintah ini')
        }
        const url = await unggahLitter(ambil.buf, ambil.ekst === 'bin' ? 'jpg' : ambil.ekst, { masa: '24h' })
        return { href: url }
      }
    },

    /* ---- metode kirim kirim ---- */
    reply: (teks, opt = {}) => m.reply(String(teks ?? ''), opt),
    replyWithPhoto: (src, opt = {}) =>
      m.sock.sendMessage(m.jid, { image: FOTO(src), caption: opt.caption || '' }, { quoted: m?.raw }),
    replyWithVideo: (src, opt = {}) =>
      m.sock.sendMessage(m.jid, { video: FOTO(src), caption: opt.caption || '' }, { quoted: m?.raw }),
    replyWithDocument: (src, opt = {}) =>
      m.sock.sendMessage(m.jid, { document: FOTO(src), fileName: opt.filename || opt.fileName || 'dokumen', caption: opt.caption || '' }, { quoted: m?.raw }),
    replyWithAudio: (src, opt = {}) =>
      m.sock.sendMessage(m.jid, { audio: FOTO(src), mimetype: opt.mimetype || 'audio/mpeg', ptt: opt.ppt || opt.ppt === true }, { quoted: m?.raw }),
    replyWithSticker: (src, opt = {}) =>
      m.sock.sendMessage(m.jid, { sticker: FOTO(src) }, { quoted: m?.raw }),

    /* util sebagai info tambahan (jarang dipakai kode telegraf mudah) */
    deleteMessage: () => m.quoted?.delete?.().catch(() => {})
  }
}

export default { buatCtx }
