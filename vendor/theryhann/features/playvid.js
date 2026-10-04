/**
 * 🎬 .playvid <judul / link> — PEMUTAR VIDEO HTML (v7.10.0) · lib/vidhtml.js
 *  Sumber: yt-dlp (YouTube search / TikTok / IG / link langsung mp4).
 *  Kartu HTML ala referensi (VM · judul · seek ungu · ⏸ VOL ↻ · PLAYING),
 *  video ditanam base64 setelah dikecilkan (240p) supaya diterima WA;
 *  file video asli (≤ 60 MB) ikut dikirim sebagai pesan video.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { vidHtml } from '../lib/vidhtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { ambilVideo, kecilkanVideo, kecilkanCover } from '../lib/lagupenuh.js'
import { getSettings } from '../lib/database.js'

const P = config.display.prefix
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36'
const maksKartu = () => (Number(getSettings().playKartuKb) || 430) * 1024
const fmt = s => s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '-'

export const playvid = {
  command: ['playvid', 'playvideo', 'videoplay', 'putarvideo', 'vidplay'],
  category: 'Downloader',
  description: '🎬 Pemutar video HTML (VM player: seek, ⏸, VOL, ↻) dari judul YouTube / link TikTok / YouTube / mp4 — .playvid judul',
  limit: 2,
  cooldown: 10,
  contoh: 'dj astaga bercanda aku tunggu aja',
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`🎬 *PLAYVID*\n\n\`${P}playvid dj astaga bercanda\`\n\`${P}playvid https://vt.tiktok.com/...\`\n\nPemutar video tampil di chat (seek, ⏸, VOL, ↻) + file video dikirim.`)
    try { await m.react?.('🎬') } catch {}
    try {
      let v
      if (/^https?:\/\/\S+\.(mp4|m4v|mov|webm)(\?|$)/i.test(q)) {
        const r = await fetch(q, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120000) })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        v = { buf: Buffer.from(await r.arrayBuffer()), judul: decodeURIComponent(q.split('/').pop().split('?')[0]), artis: new URL(q).host, durasi: 0, thumb: '', sumber: 'Link' }
      } else v = await ambilVideo(q)
      if (!v?.buf?.length) throw new Error('video tidak ditemukan')
      /* kecilkan untuk kartu */
      const k = await kecilkanVideo(v.buf, maksKartu(), v.durasi)
      let poster = ''
      try { if (v.thumb) { const r = await fetch(v.thumb, { signal: AbortSignal.timeout(15000) }); const b = await kecilkanCover(Buffer.from(await r.arrayBuffer()), 320); if (b.length < 40 * 1024) poster = `data:image/jpeg;base64,${b.toString('base64')}` } } catch {}
      console.log(`[playvid] ${v.judul} · ${v.sumber} · asli ${v.buf.length / 1024 | 0}KB · kartu ${k ? `${k.buf.length / 1024 | 0}KB ${k.h}p ${k.vKbps}k${k.klip ? ` klip ${k.klip}s` : ' penuh'}` : 'TIDAK MUAT'} · stream ${v.url ? 'ada' : '-'}`)
      let viaHtml = false
      if (k || v.url) {
        /* kartu: coba stream URL langsung (host di trusted_sources); gagal → klip/penuh tertanam */
        const cadangan = k ? `data:video/mp4;base64,${k.buf.toString('base64')}` : ''
        const host = (() => { try { return new URL(v.url).host } catch { return '' } })()
        const html = vidHtml(config.bot.name, { judul: v.judul, artis: v.artis, durasi: v.durasi, url: v.url || '', cadangan, klip: k?.klip || 0, poster, sumber: v.sumber })
        try { await sendHtmlApp(m.sock, m.jid, { title: `🎬 ${truncate(v.judul, 50)}`, html, trustedSources: [...new Set([host, 'googlevideo.com', 'tiktokcdn.com', 'hirara.dev'].filter(Boolean))] }); viaHtml = true } catch (e) { console.error('[playvid] html:', e.message) }
      }
      let viaVideo = false
      if (v.buf.length <= 60 * 1024 * 1024) {
        try { await m.sock.sendMessage(m.jid, { video: v.buf, mimetype: 'video/mp4', caption: `🎬 *${v.judul}*\n👤 ${v.artis} · ⏱️ ${fmt(v.durasi)} · ${v.sumber}`, fileName: `${v.judul.replace(/[\\/:*?"<>|]/g, '').slice(0, 60)}.mp4` }, { quoted: m.raw }); viaVideo = true } catch (e) { console.error('[playvid] video:', e.message) }
      }
      return m.reply(
        `🎬 *${v.judul}*\n👤 ${v.artis} · ⏱️ ${fmt(v.durasi)} · ${v.sumber}\n\n` +
        (viaHtml ? `Pemutar ada di atas ☝️ — ketuk ▶${k?.klip ? `\n_(kartu memutar stream penuh; bila jaringan webview diblokir, otomatis klip ${k.klip} dtk — video utuh ada di file)_` : ''}` : '⚠️ Kartu pemutar tidak terkirim.') +
        (viaVideo ? '\n📹 File video juga dikirim.' : '\n❌ File video gagal dikirim (terlalu besar / error).')
      )
    } catch (e) {
      console.error('[playvid]', e)
      return m.reply(`❌ Gagal: ${truncate(String(e.message || e), 220)}`)
    }
  }
}

export default { playvid }
