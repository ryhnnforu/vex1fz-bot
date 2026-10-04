/**
 * lib/stikerwm.js — WATERMARK STIKER (pack name & author) tanpa dependensi (v7.15.0)
 * ------------------------------------------------------------------------
 *  WhatsApp membaca nama pack/author dari chunk EXIF di dalam file WEBP
 *  (RIFF). Fungsi ini menyisipkan/mengganti chunk EXIF itu secara murni JS.
 *  tambahWm(webpBuffer, { packname, author }) → Buffer webp baru
 */
function buatExif (packname, author) {
  const json = JSON.stringify({
    'sticker-pack-id': 'theryhann-' + Date.now().toString(36),
    'sticker-pack-name': String(packname || ''),
    'sticker-pack-publisher': String(author || ''),
    emojis: ['🔥']
  })
  const data = Buffer.from(json, 'utf8')
  const head = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
  head.writeUInt32LE(data.length, 14)
  return Buffer.concat([head, data])
}

function chunk (fourcc, payload) {
  const size = Buffer.alloc(4); size.writeUInt32LE(payload.length, 0)
  const pad = payload.length % 2 ? Buffer.from([0]) : Buffer.alloc(0)
  return Buffer.concat([Buffer.from(fourcc, 'ascii'), size, payload, pad])
}

/** susun ulang RIFF: buang EXIF lama, pastikan VP8X dengan flag EXIF, tambah EXIF baru */
export function tambahWm (webp, { packname = 'THERYHANN!', author = 'WhatsApp Bot' } = {}) {
  if (!Buffer.isBuffer(webp) || webp.length < 16 || webp.toString('ascii', 0, 4) !== 'RIFF' || webp.toString('ascii', 8, 12) !== 'WEBP') return webp
  const chunks = []
  let off = 12
  while (off + 8 <= webp.length) {
    const id = webp.toString('ascii', off, off + 4)
    const size = webp.readUInt32LE(off + 4)
    const payload = webp.subarray(off + 8, Math.min(webp.length, off + 8 + size))
    chunks.push({ id, payload })
    off += 8 + size + (size % 2)
  }
  const exif = buatExif(packname, author)
  let out = []
  const vp8x = chunks.find(c => c.id === 'VP8X')
  if (vp8x) {
    const p = Buffer.from(vp8x.payload)
    p[0] = p[0] | 0x08 // flag EXIF
    out.push(chunk('VP8X', p))
  } else {
    // buat VP8X dari dimensi VP8/VP8L
    let w = 512, h = 512
    const v8 = chunks.find(c => c.id === 'VP8 ')
    const v8l = chunks.find(c => c.id === 'VP8L')
    if (v8 && v8.payload.length >= 10) { w = v8.payload.readUInt16LE(6) & 0x3fff; h = v8.payload.readUInt16LE(8) & 0x3fff }
    else if (v8l && v8l.payload.length >= 5) { const b = v8l.payload.readUInt32LE(1); w = (b & 0x3fff) + 1; h = ((b >> 14) & 0x3fff) + 1 }
    const p = Buffer.alloc(10)
    p[0] = 0x08 | (chunks.find(c => c.id === 'ALPH') ? 0x10 : 0) | (chunks.find(c => c.id === 'ANIM') ? 0x02 : 0)
    p.writeUIntLE(w - 1, 4, 3); p.writeUIntLE(h - 1, 7, 3)
    out.push(chunk('VP8X', p))
  }
  for (const c of chunks) if (c.id !== 'VP8X' && c.id !== 'EXIF') out.push(chunk(c.id, c.payload))
  out.push(chunk('EXIF', exif))
  const body = Buffer.concat(out)
  const riff = Buffer.alloc(12)
  riff.write('RIFF', 0, 'ascii'); riff.writeUInt32LE(body.length + 4, 4); riff.write('WEBP', 8, 'ascii')
  return Buffer.concat([riff, body])
}

/** baca pack/author dari webp (untuk .infostiker) */
export function bacaWm (webp) {
  try {
    const i = webp.indexOf('EXIF')
    if (i < 0) return null
    const j = webp.indexOf('{"sticker-pack', i); if (j < 0) return null
    const k = webp.indexOf('}', j)
    return JSON.parse(webp.toString('utf8', j, k + 1))
  } catch { return null }
}

export default { tambahWm, bacaWm }
