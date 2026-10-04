/**
 * lib/siapkanlagu.js — pipeline audio bersama untuk .play / .play2 (v7.10.0)
 *  cari lagu penuh (theresav → yt-dlp) → fallback preview → kecilkan utk kartu
 *  (Opus ≤ batas .playkb) → cover diperkecil → semuanya base64 (webview WA
 *  memblokir URL luar).
 */
import { getSettings } from './database.js'
import { ambilLaguPenuh, kecilkan, durasiFile, kecilkanCover } from './lagupenuh.js'

const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
export const maksTanam = () => (Number(getSettings().playKartuKb) || 430) * 1024
export async function ambil (url, timeout = 60000) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(timeout) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return { buf: Buffer.from(await r.arrayBuffer()), type: (r.headers.get('content-type') || '').split(';')[0] }
}
/** @param t track dari cariLagu / link; dimutasi (durasiAsli, sumber, penuh) */
export async function siapkanAudio (t, tag = 'play', mode = 'auto') {
  let audio = null, cover = '', penuh = false
  if (t.sumber !== 'Link' && mode !== '30') {
    const full = await ambilLaguPenuh(t.judul, t.artis).catch(() => null)
    if (full) { audio = { buf: full.buf, type: full.mime }; penuh = true; if (full.durasi) t.durasiAsli = full.durasi; t.sumber = `${t.sumber} · ${full.sumber} (full)` }
  }
  if (!audio) try { audio = await ambil(t.preview) } catch (e) { console.error(`[${tag}] unduh audio:`, e.message) }
  t.penuh = penuh
  let audioKartu = audio, catatan = ''
  if (audio && penuh && !t.durasiAsli) t.durasiAsli = await durasiFile(audio.buf).catch(() => 0)
  if (audio && audio.buf.length > maksTanam()) {
    const k = await kecilkan(audio.buf, maksTanam(), t.durasiAsli).catch(() => null)
    if (k) { audioKartu = { buf: k.buf, type: k.mime }; catatan = `kartu ${k.codec} ${k.kbps}kbps` } else {
      try { const pv = await ambil(t.preview); audioKartu = pv.buf.length <= maksTanam() ? pv : null } catch { audioKartu = null }
      catatan = 'kartu preview'
    }
  }
  try { if (t.cover) { const c = await ambil(t.cover, 20000); const cb = c.buf.length > 25 * 1024 ? await kecilkanCover(c.buf, 200) : c.buf; if (cb.length < 40 * 1024) cover = `data:${cb === c.buf ? (c.type || 'image/jpeg') : 'image/jpeg'};base64,${cb.toString('base64')}` } } catch {}
  console.log(`[${tag}] ${t.judul} · full=${penuh} · audio ${audio ? (audio.buf.length / 1024 | 0) + 'KB' : '-'} · kartu ${audioKartu ? (audioKartu.buf.length / 1024 | 0) + 'KB' : 'url'} ${catatan} · cover ${cover ? (cover.length / 1024 | 0) + 'KB' : '-'}`)
  const mime = (audio?.type && /audio|mp4|mpeg/.test(audio.type)) ? audio.type : (t.mime || 'audio/mpeg')
  let urlAudio = audioKartu && audioKartu.buf.length <= maksTanam() * 1.08 ? `data:${audioKartu.type || mime};base64,${audioKartu.buf.toString('base64')}` : t.preview
  /* v7.28.0 — lagu PENUH di kartu: kalau web bot aktif, kartu memutar stream /a/<id> (file asli, sampai habis);
     data-URI/preview di atas tetap dikirim sebagai cadangan (D.cadangan) bila stream gagal */
  let urlCadangan = ''
  let streamHost = ''
  if (audio && penuh) {
    try {
      const { daftarkanBuffer, hostStream } = await import('./webaudio.js')
      const st = daftarkanBuffer(t.judul, t.artis, audio.buf, t.durasiAsli || 0)
      if (st.url) { urlCadangan = urlAudio; urlAudio = st.url; streamHost = hostStream(); catatan += ' · stream penuh' }
    } catch (e) { console.error(`[${tag}] stream:`, e.message) }
  }
  const host = (() => { try { return new URL(t.preview).host } catch { return t.sumber || '-' } })()
  return { audio, audioKartu, cover, mime, urlAudio, urlCadangan, streamHost, penuh, host, mimeKartu: urlAudio.startsWith('data:') ? (audioKartu.type || mime) : (urlAudio.startsWith('http') && streamHost ? 'audio/mpeg' : mime) }
}
/** kirim audio WA 3 lapis; return true bila terkirim */
export async function kirimAudioWA (m, t, audio, mime, tag = 'play') {
  if (!audio || audio.buf.length <= 5000) return false
  const nama = `${t.judul} - ${t.artis}`.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)
  const dasar = { audio: audio.buf, mimetype: /mp4/.test(mime) ? 'audio/mp4' : 'audio/mpeg', ptt: false, fileName: `${nama}.${/mp4/.test(mime) ? 'm4a' : 'mp3'}`, seconds: t.durasiAsli || undefined }
  try { await m.sock.sendMessage(m.jid, { ...dasar, contextInfo: { externalAdReply: { title: t.judul, body: `${t.artis}${t.album ? ' · ' + t.album : ''}`, thumbnailUrl: t.coverKecil || t.cover, mediaType: 1, renderLargerThumbnail: false, sourceUrl: t.link || '' } } }, { quoted: m.raw }); return true } catch (e) {
    console.error(`[${tag}] audio (dgn cover):`, e.message)
    try { await m.sock.sendMessage(m.jid, dasar, { quoted: m.raw }); return true } catch (e2) {
      console.error(`[${tag}] audio:`, e2.message)
      try { await m.sock.sendMessage(m.jid, { document: audio.buf, mimetype: 'audio/mpeg', fileName: `${nama}.mp3` }, { quoted: m.raw }); return true } catch (e3) { console.error(`[${tag}] dokumen:`, e3.message) }
    }
  }
  return false
}
