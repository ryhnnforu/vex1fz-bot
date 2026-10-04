/**
 * 🖼 TOOLS MEDIA v7.7.1 — edit foto/video jarak jauh (API ikyyxd)
 * ------------------------------------------------------------------
 *  • .rvo        — buka pesan sekali-lihat (balas view-once → dibuka lagi)
 *  • .removebg   — hapus background foto (alias .rbg, .rbg)
 *  • .hd         — perjelas foto (upscale 4x)
 *  • .hdvid      — perjelas video (best-effort melalui API bila didukung)
 *  • .jadihitam  — edit foto "jadi hitam" (contoh konversi .addplugin)
 *
 *  Semua: balas foto/video, ATAU kirim media ber-caption perintah.
 *  Media diunggah sementara ke litter.catbox (publik ≤ 24 jam) lalu
 *  diproses API; hasil diunduh dan dikirim ulang. Non-fatal: kalau API
 *  macet/pelan, pengguna diberi tahu sopan — tidak ada crash.
 */
import { config } from '../config.js'
import { downloadMediaMessage, getContentType } from '../shims/elaina.mjs'
import { unggahLitter, removebg, upscale, jadihitam, unduhBuffer } from '../lib/ikyyapi.js'
import { truncate } from '../lib/functions.js'
import { hapusLatar, perjelas } from '../lib/fotolokal.js'

const P = config.display.prefix
const proses = m => m.react?.('🎨').catch(() => {})

/* unwrap pesan view-once bertingkat sampai isinya kelihatan */
function unwrapViewOnce (msg) {
  if (msg?.viewOnceMessage?.message) return unwrapViewOnce(msg.viewOnceMessage.message)
  if (msg?.viewOnceMessageV2?.message) return unwrapViewOnce(msg.viewOnceMessageV2.message)
  if (msg?.documentWithCaptionMessage?.message) return unwrapViewOnce(msg.documentWithCaptionMessage.message)
  return msg
}

/** media yang dibalas — memahami view-once (untuk .rvo dkk.) */
function mediaQuoted (m) {
  if (!m.quoted?.msg) return null
  const ini = unwrapViewOnce(m.quoted.msg)
  const tipe = getContentType(ini)
  if (!tipe || !/imageMessage|videoMessage|audioMessage|stickerMessage|ptvMessage|documentMessage/.test(tipe)) return null
  const node = ini[tipe] || {}
  return {
    tipe,
    node,
    mimetype: node.mimetype || m.quoted.mimetype || '',
    fileName: node.fileName || m.quoted.fileName || '',
    download: () => downloadMediaMessage(
      { key: m.quoted.key, message: ini },
      'buffer',
      {},
      { reuploadRequest: m.sock?.updateMediaMessage }
    )
  }
}

/** pilih sumber: media yang dibalas > media pada pesan ini sendiri */
function sumberMedia (m) {
  const q = mediaQuoted(m)
  if (q) return q
  if (m.isMedia || m.mediaKey) {
    const node = m.msg?.[m.mediaKey] || {}
    return {
      tipe: m.mediaKey || m.mtype,
      node,
      mimetype: m.mimetype || '',
      fileName: m.fileName || '',
      download: () => m.download()
    }
  }
  return null
}

const ekstDari = (mime, tipe) => {
  if (/png/i.test(mime)) return 'png'
  if (/webp/i.test(mime)) return 'webp'
  if (/mp4|webm|mov|video/i.test(mime) || /video|ptv/i.test(tipe)) return 'mp4'
  if (/audio|mpeg|ogg/i.test(mime) || /audio/i.test(tipe)) return /ogg/i.test(mime) ? 'ogg' : 'mp3'
  return 'jpg'
}

/** alur umum: media → URL publik → panggil API → download hasil → kirim */
async function editDenganApi (m, { butuh, mimes, jalankanApi, lokal, judulHasil, sebutFitur }) {
  const sumber = sumberMedia(m)
  if (!sumber) {
    return m.reply(`🖼 *${sebutFitur}*\n\nBalas/kirim foto ${butuh === 'video' ? 'atau video' : '(atau dokumen sebagai foto)'} dengan perintah ini.\nContoh: kirim foto lalu balas \`${P}${m.command}\``)
  }
  const gambaran = butuh === 'gambar'
  const mime = sumber.mimetype || ''
  const cocok = gambaran
    ? (/^image\//i.test(mime) || sumber.tipe === 'imageMessage' || (sumber.tipe === 'documentMessage' && /^image\//i.test(mime)))
    : (/^video\//i.test(mime) || /video/i.test(sumber.tipe))
  if (!cocok) {
    return m.reply(gambaran ? '❌ Itu bukan foto. Kirim/balas FOTO ya.' : '❌ Itu bukan video. Kirim/balas VIDEO MP4 ya.')
  }
  await proses(m)
  let buf
  try { buf = await sumber.download() } catch (e) {
    return m.reply(`⚠️ Media tidak bisa diunduh (${truncate(String(e?.message || e), 80)}). Kirim ulang fotonya lalu coba lagi.`)
  }
  if (!buf?.length) return m.reply('⚠️ Media kosong/tidak ditemukan. Kirim ulang ya.')
  const ekst = ekstDari(mime, sumber.tipe)
  try {
    let hasil, ket = ''
    /* v7.31.0: mesin LOKAL dulu (tanpa API pihak ketiga); API jarak jauh hanya cadangan */
    if (lokal) { try { const r = await lokal(buf); hasil = r.buf; ket = r.mesin } catch (e) { console.error(`[${sebutFitur}] lokal:`, e.message); if (!jalankanApi) throw e } }
    if (!hasil) { const urlPublik = await unggahLitter(buf, ekst, { masa: '24h' }); const urlHasil = await jalankanApi(urlPublik); hasil = await unduhBuffer(urlHasil, { maks: 40e6 }); ket = 'API' }
    judulHasil = judulHasil.replace(/\n_.*_$/, '') + (ket ? `\n_mesin: ${ket}_` : '')
    const png = hasil.length > 8 && hasil.readUInt32BE(0) === 0x89504e47
    const kirim = gambaran
      ? (png
          ? m.sock.sendMessage(m.jid, { document: hasil, mimetype: 'image/png', fileName: 'removebg.png', caption: judulHasil + '\n_(dikirim sebagai PNG agar transparansi tidak hilang)_' }, { quoted: m.raw }).then(() => m.sock.sendMessage(m.jid, { image: hasil, caption: '👆 pratinjau' }, { quoted: m.raw }))
          : m.sock.sendMessage(m.jid, { image: hasil, jpegThumbnail: null, caption: judulHasil }, { quoted: m.raw }))
      : m.sock.sendMessage(m.jid, { video: hasil, caption: judulHasil }, { quoted: m.raw })
    await kirim
    await m.react?.('✅').catch(() => {})
  } catch (e) {
    await m.react?.('❌').catch(() => {})
    const psn = truncate(String(e?.message || e), 130)
    return m.reply(`⚠️ *${sebutFitur}* gagal: ${psn}\n\nServer API sedang padat — coba lagi sebentar lagi.`)
  }
}

/* ================================================================== */
/*  1. .rvo — buka pesan sekali-lihat                                  */
/* ================================================================== */
export const readViewOnce = {
  command: ['rvo', 'readviewonce', 'bukavo', 'lihatvo', 'viewonce'],
  category: 'Tools',
  description: '🔓 Buka pesan foto/video sekali-lihat (view-once) → dikirim balik utuh',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const sumber = sumberMedia(m)
    if (!sumber) {
      return m.reply(`🔓 *BACA PESAN SEKALI-LIHAT*\n\nBalas pesan sekali-lihat (foto/video/audio dengan ikon ⏱) lalu ketik \`${P}rvo\` — bot mengunduhnya lalu mengirim balik ke chat.`)
    }
    await m.react?.('🔓').catch(() => {})
    let buf
    try { buf = await sumber.download() } catch (e) {
      return m.reply(`⚠️ Pesan tidak bisa dibuka (${truncate(String(e?.message || e), 80)}). Mungkin sudah dibuka semua anggota, atau kadaluarsa.`)
    }
    if (!buf?.length) return m.reply('❌ Konten kosong/tidak terbaca.')
    const mt = sumber.mimetype || ''
    const warna = '🔓 _Pesan sekali-lihat dibuka_ · ' + (mt || sumber.tipe)
    try {
      if (/image/i.test(mt)) {
        return await m.sock.sendMessage(m.jid, { image: buf, caption: warna }, { quoted: m.raw })
      }
      if (/video/i.test(mt) || /video/i.test(sumber.tipe)) {
        return await m.sock.sendMessage(m.jid, { video: buf, caption: warna }, { quoted: m.raw })
      }
      if (/audio|ogg|mpeg/i.test(mt) || /audio/i.test(sumber.tipe)) {
        return await m.sock.sendMessage(m.jid, { audio: buf, mimetype: mt || 'audio/mpeg', ptt: /ogg/i.test(mt) }, { quoted: m.raw })
      }
      if (/webp/i.test(mt) || /sticker/i.test(sumber.tipe)) {
        return await m.sock.sendMessage(m.jid, { sticker: buf }, { quoted: m.raw })
      }
      /* dokumen / tipe lain → kirim apa adanya */
      return await m.sock.sendMessage(m.jid, { document: buf, mimetype: mt || 'application/octet-stream', fileName: sumber.fileName || 'view-once', caption: warna }, { quoted: m.raw })
    } catch (e) {
      return m.reply('⚠️ Gagal mengirim hasil: ' + truncate(String(e?.message || e), 90))
    }
  }
}

/* ================================================================== */
/*  2. .removebg — hapus background foto                               */
/* ================================================================== */
export const removeBgCmd = {
  command: ['removebg', 'rbg', 'hapuslatar', 'nobg', 'rimbg', 'remove-background', 'bgremover'],
  category: 'Tools',
  description: '🖼 Hapus background foto (AI) — balas foto lalu `.removebg`',
  limit: 0,
  cooldown: 5,
  run: async m => editDenganApi(m, {
    butuh: 'gambar',
    sebutFitur: 'REMOVE BACKGROUND',
    judulHasil: `✅ *REMOVEBG* — latar dihapus\n_Pengiriman memakai litter.catbox sementara (≤24 jam)_`,
    lokal: buf => hapusLatar(buf),
    jalankanApi: url => removebg(url)
  })
}

/* ================================================================== */
/*  3. .hd — perjelas foto (upscale 4x)                                */
/* ================================================================== */
export const toHD = {
  command: ['hd', 'tohd', 'upscale', 'perjelas', 'hdpic', 'superres'],
  category: 'Tools',
  description: '🔍 Perjelas foto jadi HD (2x, ketik `.hd 4` untuk 4x) — balas foto lalu `.hd`',
  limit: 0,
  cooldown: 5,
  run: async m => editDenganApi(m, {
    butuh: 'gambar',
    sebutFitur: 'PERJELAS FOTO (HD)',
    judulHasil: `✅ *HD* — foto diperjelas\n_Sementara disimpan di litter.catbox (≤24 jam)_`,
    lokal: buf => perjelas(buf, /4|four/.test(String(m.q || '')) ? 4 : 2),
    jalankanApi: url => upscale(url)
  })
}

/* ================================================================== */
/*  4. .hdvid — perjelas video (best-effort)                           */
/* ================================================================== */
export const hdVid = {
  command: ['hdvid', 'tohdvid', 'hdvideo', 'perjelasvideo', 'videohd'],
  category: 'Tools',
  description: '🎞 Perjelas video (best-effort via API) — balas video MP4 lalu `.hdvid`',
  limit: 0,
  cooldown: 8,
  run: async m => {
    const sumber = sumberMedia(m)
    if (!sumber) {
      return m.reply(`🎞 *PERJELAS VIDEO*\n\nBalas video MP4 dengan \`${P}hdvid\`.\n_Catatan: API video-HD publik masih sangat terbatas — bila server menolak, coba perintah ini sesekali lagi atau pakai_ \`${P}hd\` _untuk foto._`)
    }
    const mime = sumber.mimetype || ''
    if (!/^video\//i.test(mime) && !/video/i.test(sumber.tipe)) return m.reply('❌ Itu bukan video. Kirim/balas VIDEO ya.')
    await proses(m)
    let buf
    try { buf = await sumber.download() } catch { return m.reply('⚠️ Video tidak bisa diunduh. Kirim ulang lalu coba lagi.') }
    if (buf.length > 25e6) return m.reply(`❌ Video terlalu besar (${(buf.length / 1e6).toFixed(1)} MB) — API gratis hanya sanggup video kecil (≤ 25 MB).`)
    try {
      const urlPublik = await unggahLitter(buf, 'mp4', { masa: '24h' })
      /* upscale() menolak video di sebagian besar endpoint → dicoba, gagal = jelas */
      const urlHasil = await upscale(urlPublik)
      const hasil = await unduhBuffer(urlHasil, { maks: 50e6 })
      return await m.sock.sendMessage(m.jid, { video: hasil, caption: '✅ *HD VIDEO* — diproses' }, { quoted: m.raw })
    } catch (e) {
      return m.reply(
        '⚠️ *HD VIDEO* belum bisa diproses sekarang — ' +
        `(${truncate(String(e?.message || e), 100)}).\n` +
        'Server API publik untuk video HD sering penuh/offline.\n' +
        `Alternatif: edit dulu frame kuncinya dengan foto + \`${P}hd\`, atau coba beberapa menit lagi.`
      )
    }
  }
}

/* ================================================================== */
/*  5. .jadihitam — edit foto "jadi hitam" (contoh konversi .addplugin) */
/* ================================================================== */
export const jadiHitamCmd = {
  command: ['jadihitam', 'jadigelap', 'blackfilter', 'bwfilter', 'filterhitam'],
  category: 'Tools',
  description: '🖤 Edit foto "jadi hitam" ala filter aesthetic — balas foto lalu `.jadihitam`',
  limit: 0,
  cooldown: 5,
  run: async m => editDenganApi(m, {
    butuh: 'gambar',
    sebutFitur: 'JADI HITAM',
    judulHasil: 'done bang, cek hasilnya 🖤',
    jalankanApi: url => jadihitam(url)
  })
}

export default { readViewOnce, removeBgCmd, toHD, hdVid, jadiHitamCmd }
