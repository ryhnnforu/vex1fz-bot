/**
 * ▶ .ytrich — kartu YouTube Music bergaya Apple Music (v7.29.0)
 *  Mesin: pencarian YouTube tanpa API (lib/ytcari.js) → audio penuh via yt-dlp
 *  (dibuat di latar, di-stream dari server bot /a/<id>) → cuplikan 20 dtk ditanam
 *  di kartu sebagai cadangan (kalau yt-dlp ada) → lirik LRCLIB → kartu lib/richmusic.js
 *  mode yt (logo YouTube Music, kotak cari YouTube via /ycari, badge "YOUTUBE · HQ").
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariYoutube } from '../lib/ytcari.js'
import { richMusicHtml } from '../lib/richmusic.js'
import { TRUSTED_LIVE } from '../lib/spotifylive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { ambilLirik } from '../lib/lirik.js'
import { siapkanStreamYt, hostStream, endpointStream } from '../lib/webaudio.js'
import { kecilkan, kecilkanCover } from '../lib/lagupenuh.js'
import { ambil } from '../lib/siapkanlagu.js'
import { webAktif } from '../lib/webgame.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const P = config.display.prefix
const N_LAGU = 4
const PER_LAGU = 44 * 1024
const CUPLIK = 20

const bersihJudul = j => String(j).replace(/\(.*?(official|mv|lyric|lirik|video|audio|m\/v).*?\)|\[.*?\]|\|.*$|official\s*(music\s*)?video|lyrics?|m\/v/gi, '').replace(/\s{2,}/g, ' ').trim()

async function cuplikanYt (id) {
  const out = path.join(os.tmpdir(), `ytr_${id}_${Date.now()}`)
  try {
    await run('yt-dlp', ['-x', '--audio-format', 'mp3', '--audio-quality', '7', '--no-playlist', '--max-filesize', '30m', '-o', `${out}.%(ext)s`, `https://www.youtube.com/watch?v=${id}`], { timeout: 120000, maxBuffer: 1 << 24 })
    const f = `${out}.mp3`; if (!fs.existsSync(f)) return null
    const buf = fs.readFileSync(f); fs.rmSync(f, { force: true })
    const k = await kecilkan(buf, PER_LAGU, 0, { potong: CUPLIK }).catch(() => null)
    if (!k) return null
    return { url: `data:${k.mime};base64,${k.buf.toString('base64')}`, buf }
  } catch { return null }
}

async function siapkan (t, tanam) {
  let cover = ''
  try { const c = await ambil(t.coverKecil || t.cover, 15000); const cb = c.buf.length > 9 * 1024 ? await kecilkanCover(c.buf, 96) : c.buf; if (cb.length < 14 * 1024) cover = `data:image/jpeg;base64,${cb.toString('base64')}` } catch {}
  const st = siapkanStreamYt(t.id, t.judul, t.artis)
  const [lirik, cup] = await Promise.all([
    ambilLirik({ judul: bersihJudul(t.judul), artis: t.artis.replace(/\s*-\s*topic$|official|vevo/gi, '').trim(), durasiAsli: t.durasi }).catch(() => null),
    tanam ? cuplikanYt(t.id) : null
  ])
  const lirikPenuh = lirik?.sinkron?.length ? lirik.sinkron.slice(0, 80).map(([s, l]) => [+(+s).toFixed(2), l]) : null
  return { judul: t.judul, artis: t.artis, cover: cover || t.cover, url: cup?.url || '', durasi: cup ? CUPLIK : t.durasi, dur: t.durasi, penuh: st.url, durPenuh: t.durasi, lirik: lirikPenuh, offset: 0, warna: [255, 0, 0] }
}

export const ytrich = {
  command: ['ytrich', 'ytmusic', 'youtubemusic', 'richyt', 'ytm'],
  category: 'Downloader',
  description: '▶ Kartu YouTube Music ala Apple Music: cari lagu YouTube di dalam kartu, putar penuh sampai habis (stream server bot), Lirik Bersinkron, shuffle/repeat',
  limit: 1,
  cooldown: 6,
  contoh: 'dewa 19 kangen',
  run: async m => {
    const q = String(m.q || '').trim()
    if (!q) return m.reply(`▶ *YT RICH*\n\nContoh: *${P}ytrich dewa 19 kangen*\n\nKartu YouTube Music bergaya Apple Music: cari lagu YouTube di kartu, putar penuh sampai habis, Lirik Bersinkron, shuffle/repeat.`)
    try { await m.react?.('▶️') } catch {}
    await m.reply(`▶ Menyiapkan *YT RICH* untuk "${q}"… ±20 detik`)
    const hasil = await cariYoutube(q, N_LAGU + 2).catch(e => { console.log('[ytrich]', e.message); return [] })
    if (!hasil.length) return m.reply(`❌ YouTube tidak mengembalikan hasil untuk "${q}". Coba judul lain.`)
    let adaYtdlp = false; try { await run('yt-dlp', ['--version'], { timeout: 8000 }); adaYtdlp = true } catch {}
    const tracks = []
    for (const t of hasil.slice(0, N_LAGU)) { const x = await siapkan(t, adaYtdlp && tracks.length < 2); if (x) tracks.push(x) }
    if (!tracks.length) return m.reply('❌ Gagal menyiapkan lagu.')
    const ep = endpointStream()
    const html = richMusicHtml(config.bot.name, { yt: true, nama: truncate(String(m.pushName || 'kamu'), 20), prefix: P, cmd: 'ytrich', query: q, tracks, stream: ep.stream, cari: ep.cari ? ep.cari.replace(/\/cari$/, '/ycari') : '' })
    try {
      await sendHtmlApp(m.sock, m.jid, { title: `▶ YT Rich · ${truncate(q, 30)}`, html, trustedSources: [...TRUSTED_LIVE, 'i.ytimg.com', ...(hostStream() ? [hostStream()] : [])] })
    } catch (e) { return m.reply(`❌ Kartu gagal dikirim: ${truncate(String(e.message || e), 120)}`) }
    const catatan = !webAktif() ? '\n\n⚠️ Web server bot tidak aktif (PUBLIC_URL/PORT) → hanya cuplikan 20 dtk yang ditanam.' : !adaYtdlp ? '\n\n⚠️ yt-dlp belum terpasang di server → audio tidak bisa diunduh. Termux: `pkg install python ffmpeg && pip install -U yt-dlp`' : ''
    return m.reply(`▶ *YT RICH* — "${q}"\n\n${tracks.map((t, i) => `${i + 1}. ${truncate(t.judul, 48)} — ${t.artis}${t.lirik?.length ? ' 🎤' : ''}`).join('\n')}\n\n• Ketuk lagu / ▶ untuk memutar (lagu penuh di-stream dari server bot)\n• Kotak cari di kartu = pencarian YouTube langsung${catatan}`)
  }
}
export default { ytrich }
