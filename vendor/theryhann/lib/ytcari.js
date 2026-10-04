/**
 * lib/ytcari.js — 🔎 Pencarian YouTube tanpa API key (v7.29.0)
 *  Scrape ytInitialData dari halaman hasil pencarian → [{id, judul, artis, durasi, cover, url}]
 *  Fallback: yt-dlp "ytsearchN:" --dump-json (kalau terpasang).
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const run = promisify(execFile)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const detik = t => { const p = String(t || '').split(/[:.]/).map(Number); return p.reduce((a, b) => a * 60 + b, 0) || 0 }

function * jalan (o) {
  if (Array.isArray(o)) { for (const x of o) yield * jalan(x) } else if (o && typeof o === 'object') { if (o.videoRenderer) yield o.videoRenderer; for (const x of Object.values(o)) yield * jalan(x) }
}
function rapikan (v) {
  const judul = v.title?.runs?.[0]?.text || '-'
  const artis = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'YouTube'
  return { id: v.videoId, judul, artis, durasi: detik(v.lengthText?.simpleText), durasiAsli: detik(v.lengthText?.simpleText), cover: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, coverKecil: `https://i.ytimg.com/vi/${v.videoId}/default.jpg`, url: `https://youtu.be/${v.videoId}`, views: v.viewCountText?.simpleText || '', umur: v.publishedTimeText?.simpleText || '' }
}
export async function cariYoutube (q, limit = 6) {
  try {
    const r = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&hl=id', { headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.8' }, signal: AbortSignal.timeout(20000) })
    const html = await r.text()
    const i = html.indexOf('var ytInitialData = '); const j = html.indexOf('};</script>', i)
    if (i < 0 || j < 0) throw new Error('ytInitialData tidak ketemu')
    const data = JSON.parse(html.slice(i + 20, j + 1))
    const out = []; const seen = new Set()
    for (const v of jalan(data)) { if (!v.videoId || seen.has(v.videoId)) continue; seen.add(v.videoId); const t = rapikan(v); if (t.durasi > 0 && t.durasi < 1200) out.push(t); if (out.length >= limit) break }
    if (out.length) return out
    throw new Error('hasil kosong')
  } catch (e) {
    try {
      const { stdout } = await run('yt-dlp', ['--dump-json', '--flat-playlist', '--no-warnings', `ytsearch${limit}:${q}`], { timeout: 60000, maxBuffer: 1 << 24 })
      return stdout.trim().split('\n').filter(Boolean).map(l => { const v = JSON.parse(l); return { id: v.id, judul: v.title, artis: v.uploader || v.channel || 'YouTube', durasi: Math.round(v.duration || 0), durasiAsli: Math.round(v.duration || 0), cover: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`, coverKecil: `https://i.ytimg.com/vi/${v.id}/default.jpg`, url: `https://youtu.be/${v.id}`, views: '' } })
    } catch (e2) { throw new Error(`YouTube search gagal: ${e.message} | ${e2.message}`) }
  }
}
export default { cariYoutube }
