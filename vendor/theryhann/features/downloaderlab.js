/**
 * ⬇️ DOWNLOADERLAB — 50 fitur downloader & media (kategori Downloader, v6)
 * ------------------------------------------------------------------------
 *  TikTok (video/no-watermark/audio/slide/info/cover) via tikwm,
 *  YouTube (cari, info, thumbnail, unduh lewat yt-dlp bila terpasang),
 *  gambar dari sumber nyata (Wikimedia Commons, Wikipedia, Picsum,
 *  LoremFlickr, flagcdn, favicon Google, avatar GitHub, emoji jsDelivr),
 *  ambil media langsung dari URL (gambar/video/audio/dokumen + info),
 *  screenshot web (desktop/mobile/full) & arsip Wayback Machine,
 *  upload ke catbox/litterbox, kirim ulang media, album, serta
 *  panduan & riwayat unduhan.
 *
 *  Semua fitur memakai sumber publik yang bisa diakses dari Termux.
 *  Bila sumber sedang sibuk/gagal, bot memberi pesan jelas + saran.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { config } from '../config.js'
import { ROOT, truncate, formatSize, formatDuration, saveTmp } from '../lib/functions.js'
import { loadDB, saveDB } from '../lib/database.js'
import * as pluginsLib from '../lib/plugins.js'

const P = config.display.prefix
const UA = 'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

/* ------------------------- helper jaringan ------------------------- */
async function ambilBuffer (url, timeout = 45000) {
  const r = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: { 'User-Agent': UA, Accept: '*/*' }
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} dari ${new URL(url).host}`)
  const buf = Buffer.from(await r.arrayBuffer())
  if (!buf.length) throw new Error('Respons kosong')
  return { buf, type: r.headers.get('content-type') || 'application/octet-stream' }
}
async function ambilJson (url, timeout = 25000) {
  const r = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: { 'User-Agent': UA, Accept: 'application/json' }
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return await r.json()
}
const absolut = u => (String(u).startsWith('http') ? u : 'https:' + (String(u).startsWith('//') ? u : '//' + u))
const urlDari = m => {
  const q = m.q || ''
  const ketemu = q.match(/https?:\/\/[^\s]+/i)
  return ketemu ? ketemu[0] : ''
}
const idYoutube = url => {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/)
  return m ? m[1] : (/^[\w-]{11}$/.test(String(url)) ? url : null)
}
/** data TikTok dari tikwm (dengan anti rate-limit: 1 request/detik) */
async function dataTiktok (link, percobaan = 3) {
  let pesanErr = ''
  for (let i = 0; i < percobaan; i++) {
    try {
      const r = await ambilJson(`https://tikwm.com/api/?url=${encodeURIComponent(link)}&hd=1`)
      if (r.code === 0 && r.data) return r.data
      pesanErr = r.msg || 'Link tidak dikenali tikwm (mungkin privat/dihapus)'
      if (!/limit|rate|busy/i.test(pesanErr)) throw new Error(pesanErr)
    } catch (e) {
      pesanErr = String(e?.message || e)
      if (!/limit|rate|busy|timeout|fetch failed/i.test(pesanErr)) throw new Error(pesanErr)
    }
    await new Promise(r => setTimeout(r, 1600 * (i + 1)))
  }
  throw new Error(pesanErr || 'tikwm tidak merespons')
}
/** catat riwayat unduhan user */
function catatDl (m, jenis, judul) {
  try {
    const db = loadDB('userdata', {})
    const jid = m.senderKey || m.sender
    db[jid] = db[jid] || {}
    db[jid].dlLog = [{ jenis, judul: truncate(judul, 80), waktu: Date.now() }, ...(db[jid].dlLog || [])].slice(0, 25)
    db[jid].pengingat = db[jid].pengingat || []
    db[jid].catatan = db[jid].catatan || []
    db[jid].link = db[jid].link || []
    saveDB('userdata')
  } catch { /* riwayat tidak wajib */ }
}
/** cek keberadaan yt-dlp / ffmpeg */
function adaBinary (nama) {
  return new Promise(res => {
    const proc = spawn('which', [nama])
    let out = ''
    proc.stdout?.on('data', d => { out += d })
    proc.on('error', () => res(null))
    proc.on('close', code => res(code === 0 && out.trim() ? out.trim() : null))
  })
}
async function ytDlp (args, batasMs = 180000) {
  const bin = await adaBinary('yt-dlp')
  if (!bin) throw new Error('yt-dlp belum terpasang')
  return await new Promise((res, rej) => {
    const proc = spawn(bin, args, { cwd: path.join(ROOT, 'tmp') })
    let err = ''
    const t = setTimeout(() => { try { proc.kill('SIGKILL') } catch { /* sudah mati */ } rej(new Error('waktu habis (>3 menit)')) }, batasMs)
    proc.stderr?.on('data', d => { err += d })
    proc.on('error', e => { clearTimeout(t); rej(e) })
    proc.on('close', code => {
      clearTimeout(t)
      if (code === 0) res(true)
      else rej(new Error(truncate(err.trim().split('\n').pop() || `exit ${code}`, 200)))
    })
  })
}

/* ------------------------- factory ------------------------- */
const dl = (command, aliases, description, run, contoh = '', opt = {}) => ({
  command: [command, ...aliases],
  category: 'Downloader',
  description,
  limit: 1,
  cooldown: 5,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) {
      const pesan = String(e?.message || e)
      if (/yt-dlp belum terpasang/.test(pesan)) {
        return m.reply(`⚙️ *Butuh yt-dlp*\n\nFitur ini mengunduh langsung dari server, jadi perlu \`yt-dlp\` di Termux:\n\n\`\`\`pkg install -y python ffmpeg\npip install -U yt-dlp\`\`\`\n\nSetelah terpasang, ulangi perintahnya.\nCek status: ${P}ytdlpinfo\n\nAlternatif tanpa install: ${P}ttvideo (TikTok) · ${P}ytthumb (thumbnail) · ${P}ytinfo (info video)`)
      }
      return m.reply(`⚠️ Gagal: ${truncate(pesan, 220)}\n\nCoba lagi beberapa saat (sumber mungkin sibuk) atau periksa link-nya.\nBantuan: ${P}downloadgagal`)
    }
  }
})
const bebas = (command, aliases, description, run, contoh = '', opt = {}) =>
  dl(command, aliases, description, run, contoh, { limit: 0, cooldown: 3, ...opt })

/* ================================================================== */
/*  A. TIKTOK (8)                                                      */
/* ================================================================== */
export const dlTiktokCmds = [
  dl('ttvideo', ['tiktokvideo', 'ttmp4'], 'Unduh video TikTok (tanpa watermark)', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Kirim link TikTok.\n\nContoh: ${P}ttvideo https://www.tiktok.com/@user/video/1234567890\n\nVarian lain:\n▸ ${P}ttnowm — tanpa watermark\n▸ ${P}ttmusik — audionya saja\n▸ ${P}ttinfo — info & statistik`)
    await m.react('⏳')
    const d = await dataTiktok(link)
    const video = absolut(d.hdplay || d.play)
    catatDl(m, 'tiktok-video', d.title)
    return m.sendVideo(video, `🎬 *TIKTOK*\n\n${truncate(d.title || '(tanpa judul)', 300)}\n\n👤 @${d.author?.unique_id || '?'} (${d.author?.nickname || '-'})\n⏱️ ${d.duration}s · 📊 ${formatSize(d.size || 0)}\n❤️ ${(d.digg_count || 0).toLocaleString('id-ID')} · 💬 ${(d.comment_count || 0).toLocaleString('id-ID')} · 🔁 ${(d.share_count || 0).toLocaleString('id-ID')}\n\n🎵 ${truncate(d.music_info?.title || '', 60)}\n\n💾 ${P}ttmusik untuk audionya`)
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  dl('ttnowm', ['tiktoknowm', 'tttanpawm'], 'Unduh TikTok tanpa watermark + pilih kualitas', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttnowm <link tiktok>`)
    const d = await dataTiktok(link)
    catatDl(m, 'tiktok-nowm', d.title)
    return m.sendButtons({
      title: '🎬 TIKTOK — pilih format',
      text: `${truncate(d.title || '(tanpa judul)', 200)}\n\n👤 @${d.author?.unique_id}\n⏱️ ${d.duration}s · ${formatSize(d.size || 0)}\n\n▸ *Tanpa watermark* (play)\n▸ *Dengan watermark* (wmplay)\n▸ *Audio* (musik)`,
      footer: config.bot.footer,
      buttons: [
        { text: '🎞️ Tanpa WM', id: `${P}ttvideo ${link}` },
        { text: '💧 Dengan WM', id: `${P}ttwm ${link}` },
        { text: '🎵 Audio', id: `${P}ttmusik ${link}` }
      ]
    })
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  dl('ttwm', ['tiktokwm'], 'Unduh video TikTok dengan watermark asli', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttwm <link tiktok>`)
    const d = await dataTiktok(link)
    const video = absolut(d.wmplay || d.play)
    catatDl(m, 'tiktok-wm', d.title)
    return m.sendVideo(video, `💧 *TIKTOK (watermark)*\n\n${truncate(d.title || '', 260)}\n👤 @${d.author?.unique_id}`)
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  dl('ttmusik', ['ttaudiomp3', 'ttsound'], 'Unduh audio/musik TikTok (MP3)', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttmusik <link tiktok>`)
    const d = await dataTiktok(link)
    const audio = absolut(d.music || d.music_info?.play)
    if (!audio) throw new Error('Audio tidak tersedia untuk video ini')
    catatDl(m, 'tiktok-audio', d.music_info?.title || d.title)
    return m.sendAudio(audio, { mimetype: 'audio/mpeg', fileName: `${truncate(d.music_info?.title || 'tiktok-audio', 40).replace(/[^\w\s-]/g, '')}.mp3` })
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  bebas('ttinfo', ['tiktokinfo', 'ttstat'], 'Info & statistik video TikTok (tanpa unduh)', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttinfo <link tiktok>`)
    const d = await dataTiktok(link)
    const tgl = d.create_time ? new Date(d.create_time * 1000).toLocaleString('id-ID') : '-'
    return m.sendButtons({
      title: '📊 INFO TIKTOK',
      text: `*${truncate(d.title || '(tanpa judul)', 240)}*\n\n👤 Akun: @${d.author?.unique_id || '-'} (${d.author?.nickname || '-'})\n🆔 Video: ${d.id}\n🌏 Region: ${d.region || '-'}\n⏱️ Durasi: ${d.duration}s\n📦 Ukuran: ${formatSize(d.size || 0)} (tanpa WM ${formatSize(d.wm_size || 0)})\n📅 Diunggah: ${tgl}\n\n*Statistik*\n▶️ ${(d.play_count || 0).toLocaleString('id-ID')} tontonan\n❤️ ${(d.digg_count || 0).toLocaleString('id-ID')} suka\n💬 ${(d.comment_count || 0).toLocaleString('id-ID')} komentar\n🔁 ${(d.share_count || 0).toLocaleString('id-ID')} bagikan\n⭐ ${(d.collect_count || 0).toLocaleString('id-ID')} simpan\n⬇️ ${(d.download_count || 0).toLocaleString('id-ID')} unduhan\n\n🎵 Musik: ${truncate(d.music_info?.title || '-', 60)}\n${d.images?.length ? `\n🖼️ Slide gambar: ${d.images.length} lembar (${P}ttslide)` : ''}`,
      footer: config.bot.footer,
      buttons: [{ text: '🎬 Unduh Video', id: `${P}ttvideo ${link}` }, { text: '🎵 Unduh Audio', id: `${P}ttmusik ${link}` }, { text: '🖼️ Cover', id: `${P}ttcover ${link}` }]
    })
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  bebas('ttcover', ['tiktokthumb', 'ttthumb'], 'Ambil cover/thumbnail video TikTok', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttcover <link tiktok>`)
    const d = await dataTiktok(link)
    const img = absolut(d.origin_cover || d.cover)
    catatDl(m, 'tiktok-cover', d.title)
    return m.sendImage(img, `🖼️ Cover TikTok\n\n${truncate(d.title || '', 200)}\n👤 @${d.author?.unique_id}`)
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675'),

  dl('ttslide', ['tiktokfoto', 'ttslideshow'], 'Unduh semua foto dari post slide TikTok', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttslide <link post foto tiktok>\n\nHanya untuk post berbentuk slide gambar.`)
    const d = await dataTiktok(link)
    const imgs = d.images || []
    if (!imgs.length) return m.reply(`ℹ️ Post ini bukan slide gambar (tidak ada foto).\n\nKalau berupa video, pakai: ${P}ttvideo ${link}`)
    catatDl(m, 'tiktok-slide', `${imgs.length} foto`)
    await m.reply(`🖼️ Mengirim ${imgs.length} foto dari TikTok...`)
    let n = 0
    for (const u of imgs.slice(0, 10)) {
      try { await m.sendImage(absolut(u), `📷 ${n + 1}/${imgs.length} — @${d.author?.unique_id || ''}`); n++ } catch { /* lewati foto gagal */ }
    }
    return n ? undefined : m.reply('⚠️ Semua foto gagal diunduh (mungkin CDN memblokir). Coba lagi nanti.')
  }, 'https://www.tiktok.com/@user/photo/1234567890'),

  bebas('ttunduh', ['tiktoklengkap', 'ttpaket'], 'Paket lengkap TikTok: info + tombol semua format', async m => {
    const link = urlDari(m)
    if (!link) return m.reply(`Contoh: ${P}ttunduh <link tiktok>`)
    const d = await dataTiktok(link)
    return m.sendButtons({
      title: '📦 PAKET TIKTOK',
      text: `*${truncate(d.title || '(tanpa judul)', 200)}*\n\n👤 @${d.author?.unique_id} · ⏱️ ${d.duration}s · 📦 ${formatSize(d.size || 0)}\n▶️ ${(d.play_count || 0).toLocaleString('id-ID')} · ❤️ ${(d.digg_count || 0).toLocaleString('id-ID')}\n${d.images?.length ? `🖼️ Slide: ${d.images.length} foto` : '🎬 Format: video'}\n\nPilih yang mau diunduh:`,
      footer: config.bot.footer,
      buttons: [
        { text: '🎬 Video (no WM)', id: `${P}ttvideo ${link}` },
        { text: '🎵 Audio MP3', id: `${P}ttmusik ${link}` },
        { text: d.images?.length ? `🖼️ ${d.images.length} Foto` : '💧 Video WM', id: d.images?.length ? `${P}ttslide ${link}` : `${P}ttwm ${link}` }
      ]
    })
  }, 'https://www.tiktok.com/@tiktok/video/7106594312292453675')
]

/* ================================================================== */
/*  B. YOUTUBE (8)                                                     */
/* ================================================================== */
export const dlYoutubeCmds = [
  bebas('ytcari', ['ytsearch', 'cariyoutube'], 'Cari video YouTube (saran + tautan)', async m => {
    const q = m.q
    if (!q) return m.reply(`Contoh: ${P}ytcari lagu indonesia terbaru`)
    const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': UA } })
    const data = await r.json()
    const saran = Array.isArray(data?.[1]) ? data[1].slice(0, 10) : []
    return m.sendButtons({
      title: `🔎 HASIL PENCARIAN "${truncate(q, 40)}"`,
      text: `*Saran pencarian YouTube:*\n${saran.map((s, i) => `${i + 1}. ${s}`).join('\n') || '(tidak ada saran)'}\n\n*Klik tombol untuk membuka hasil pertama di YouTube* atau pakai:\n▸ ${P}ytinfo <link> — info video\n▸ ${P}ytvideo <link> — unduh (butuh yt-dlp)`,
      footer: config.bot.footer,
      buttons: saran.slice(0, 3).map(s => ({ text: truncate(s, 24), id: `${P}ytinfo https://www.youtube.com/results?search_query=${encodeURIComponent(s)}` }))
    })
  }, 'lagu indonesia terbaru'),

  bebas('ytinfo', ['ytmetadata', 'infoyt'], 'Info video YouTube (judul, channel, thumbnail)', async m => {
    const url = urlDari(m)
    const id = idYoutube(url || m.q)
    if (!id) return m.reply(`Contoh:\n▸ ${P}ytinfo https://youtu.be/dQw4w9WgXcQ\n▸ ${P}ytinfo dQw4w9WgXcQ`)
    const d = await ambilJson(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`)
    return m.sendButtons({
      title: '📺 INFO YOUTUBE',
      text: `*${truncate(d.title || '-', 200)}*\n\n👤 Channel: ${d.author_name || '-'}\n🔗 ${d.author_url || '-'}\n🆔 ID: ${id}\n🖼️ Thumbnail: https://i.ytimg.com/vi/${id}/maxresdefault.jpg\n\n*Unduh (butuh yt-dlp terpasang):*\n▸ ${P}ytvideo <link> — MP4\n▸ ${P}ytmp3dl <link> — MP3`,
      footer: config.bot.footer,
      buttons: [{ text: '🖼️ Thumbnail', id: `${P}ytthumb ${id}` }, { text: '🎬 Unduh Video', id: `${P}ytvideo https://youtu.be/${id}` }, { text: '🎵 Unduh Audio', id: `${P}ytmp3dl https://youtu.be/${id}` }]
    })
  }, 'dQw4w9WgXcQ'),

  bebas('ytthumb', ['thumbnailyt', 'cover yt'.replace(' ', '')], 'Ambil thumbnail video YouTube', async m => {
    const id = idYoutube(urlDari(m) || m.q)
    if (!id) return m.reply(`Contoh: ${P}ytthumb dQw4w9WgXcQ`)
    for (const jenis of ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault']) {
      try {
        const { buf } = await ambilBuffer(`https://i.ytimg.com/vi/${id}/${jenis}.jpg`, 15000)
        if (buf.length > 1500) {
          catatDl(m, 'yt-thumb', id)
          return m.sendImage(buf, `🖼️ Thumbnail YouTube (${jenis})\n🆔 ${id}\n\nInfo: ${P}ytinfo ${id}`)
        }
      } catch { /* coba resolusi lebih rendah */ }
    }
    throw new Error('Thumbnail tidak ditemukan untuk ID ' + id)
  }, 'dQw4w9WgXcQ'),

  dl('ytvideo', ['ytmp4', 'unduhyt'], 'Unduh video YouTube (MP4 ≤720p, butuh yt-dlp)', async m => {
    const url = urlDari(m)
    const id = idYoutube(url || m.q)
    if (!id) return m.reply(`Contoh: ${P}ytvideo https://youtu.be/dQw4w9WgXcQ`)
    fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true })
    const pola = path.join(ROOT, 'tmp', `${id}.%(ext)s`)
    await m.reply(`⏳ Mengunduh video YouTube ${id}... (bisa 1-3 menit)`)
    await ytDlp(['-f', 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b', '--merge-output-format', 'mp4', '-o', pola, '--no-playlist', '--restrict-filenames', `https://www.youtube.com/watch?v=${id}`])
    const file = path.join(ROOT, 'tmp', `${id}.mp4`)
    if (!fs.existsSync(file)) throw new Error('File hasil unduhan tidak ditemukan')
    const ukuran = fs.statSync(file).size
    catatDl(m, 'yt-video', id)
    if (ukuran > 60 * 1024 * 1024) {
      fs.unlinkSync(file)
      return m.reply(`⚠️ Video terlalu besar (${formatSize(ukuran)}). Batas kirim WhatsApp ±64MB.\n\nCoba kualitas lebih rendah: ${P}ytvideo360 ${id}`)
    }
    const hasil = await m.sendVideo(fs.readFileSync(file), `🎬 YouTube ${id} (${formatSize(ukuran)})\n\nInfo: ${P}ytinfo ${id}`)
    try { fs.unlinkSync(file) } catch { /* sudah terhapus */ }
    return hasil
  }, 'https://youtu.be/dQw4w9WgXcQ'),

  dl('ytvideo360', ['yt360'], 'Unduh video YouTube kualitas 360p (hemat kuota)', async m => {
    const id = idYoutube(urlDari(m) || m.q)
    if (!id) return m.reply(`Contoh: ${P}ytvideo360 dQw4w9WgXcQ`)
    fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true })
    await ytDlp(['-f', 'bv*[height<=360]+ba/b[height<=360]/b', '--merge-output-format', 'mp4', '-o', path.join(ROOT, 'tmp', `${id}360.%(ext)s`), '--no-playlist', '--restrict-filenames', `https://www.youtube.com/watch?v=${id}`])
    const file = path.join(ROOT, 'tmp', `${id}360.mp4`)
    if (!fs.existsSync(file)) throw new Error('File tidak ditemukan')
    catatDl(m, 'yt-video360', id)
    return m.sendVideo(fs.readFileSync(file), `🎬 YouTube ${id} · 360p (${formatSize(fs.statSync(file).size)})`)
  }, 'dQw4w9WgXcQ'),

  dl('ytmp3dl', ['ytaudio', 'ytmusik'], 'Unduh audio YouTube jadi MP3 (butuh yt-dlp + ffmpeg)', async m => {
    const id = idYoutube(urlDari(m) || m.q)
    if (!id) return m.reply(`Contoh: ${P}ytmp3dl https://youtu.be/dQw4w9WgXcQ`)
    fs.mkdirSync(path.join(ROOT, 'tmp'), { recursive: true })
    await m.reply(`⏳ Mengonversi ke MP3...`)
    await ytDlp(['-x', '--audio-format', 'mp3', '--audio-quality', '5', '-o', path.join(ROOT, 'tmp', `${id}.%(ext)s`), '--no-playlist', '--restrict-filenames', `https://www.youtube.com/watch?v=${id}`])
    const file = path.join(ROOT, 'tmp', `${id}.mp3`)
    if (!fs.existsSync(file)) throw new Error('MP3 tidak ditemukan (mungkin ffmpeg belum terpasang: pkg install ffmpeg)')
    catatDl(m, 'yt-mp3', id)
    return m.sendAudio(fs.readFileSync(file), { mimetype: 'audio/mpeg', ptt: false, fileName: `${id}.mp3` })
  }, 'https://youtu.be/dQw4w9WgXcQ'),

  dl('ytplaylist', ['ytlist'], 'Info playlist YouTube + unduh 3 video pertama', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}ytplaylist https://www.youtube.com/playlist?list=PLxxxx`)
    const bin = await adaBinary('yt-dlp')
    if (!bin) throw new Error('yt-dlp belum terpasang')
    const info = await new Promise((res, rej) => {
      execFile(bin, ['--flat-playlist', '--dump-single-json', '--no-warnings', url], { timeout: 90000, maxBuffer: 1024 * 1024 * 20 },
        (e, so) => e ? rej(new Error(truncate(e.message, 160))) : res(JSON.parse(so)))
    })
    const items = (info.entries || []).slice(0, 30)
    catatDl(m, 'yt-playlist', info.title)
    return m.sendButtons({
      title: `📃 PLAYLIST: ${truncate(info.title || '-', 60)}`,
      text: `Channel: ${info.channel || info.uploader || '-'}\nJumlah video: ${info.entries?.length || items.length}\n\n${items.slice(0, 15).map((v, i) => `${i + 1}. ${truncate(v.title || '-', 50)}`).join('\n')}${items.length > 15 ? `\n... +${items.length - 15} lainnya` : ''}`,
      footer: config.bot.footer,
      buttons: items.slice(0, 3).map(v => ({ text: truncate(v.title || 'Video', 22), id: `${P}ytvideo https://youtu.be/${v.id}` }))
    })
  }, 'https://www.youtube.com/playlist?list=PLxxxx'),

  bebas('ytdlpinfo', ['cekytdlp', 'statusytdlp'], 'Cek apakah yt-dlp & ffmpeg sudah terpasang', async m => {
    const yt = await adaBinary('yt-dlp')
    const ff = await adaBinary('ffmpeg')
    let ver = '-'
    if (yt) {
      ver = await new Promise(res => execFile(yt, ['--version'], { timeout: 15000 }, (e, so) => res(e ? 'error' : so.trim())))
    }
    return m.sendButtons({
      title: '⚙️ STATUS MESIN UNDUH',
      text: `*yt-dlp:* ${yt ? `✅ ${yt} (v${ver})` : '❌ belum terpasang'}\n*ffmpeg:* ${ff ? `✅ ${ff}` : '❌ belum terpasang'}\n\n${yt && ff ? 'Semua fitur unduh YouTube siap dipakai 🎉' : '*Pasang di Termux:*\n```\npkg update -y\npkg install -y python ffmpeg\npip install -U yt-dlp\n```\n\nSetelah itu cek ulang perintah ini.'}\n\nFitur yang butuh yt-dlp: ${P}ytvideo · ${P}ytvideo360 · ${P}ytmp3dl · ${P}ytplaylist\nYang tetap jalan tanpa install: ${P}ytinfo · ${P}ytthumb · ${P}ytcari · semua fitur TikTok`,
      footer: config.bot.footer,
      buttons: [{ text: '🔎 Cari YouTube', id: `${P}ytcari` }, { text: '🎬 TikTok', id: `${P}ttvideo` }, { text: '⬇️ Menu Downloader', id: `${P}menudownload` }]
    })
  })
]

/* ================================================================== */
/*  C. GAMBAR DARI SUMBER NYATA (10)                                   */
/* ================================================================== */
async function cariCommons (q, lebar = 800, jumlah = 1) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=${jumlah}&gsrnamespace=6&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=${lebar}&format=json`
  const j = await ambilJson(url)
  const pages = Object.values(j?.query?.pages || {})
    .filter(p => p.imageinfo?.[0] && /image\//.test(p.imageinfo[0].mime || ''))
    .map(p => ({ judul: p.title.replace(/^File:/, ''), info: p.imageinfo[0] }))
  if (!pages.length) throw new Error(`tidak ada gambar untuk "${q}"`)
  return pages
}
export const dlGambarCmds = [
  bebas('wikigambar', ['carigambar', 'gambarcommons'], 'Cari & unduh gambar dari Wikimedia Commons', async m => {
    const q = m.q
    if (!q) return m.reply(`Contoh: ${P}wikigambar danau toba\n\nSumber: Wikimedia Commons (bebas lisensi).`)
    const hasil = await cariCommons(q, 800, 5)
    const pilih = hasil[0]
    catatDl(m, 'commons', pilih.judul)
    return m.sendImage(pilih.info.thumburl || pilih.info.url, `🖼️ *${truncate(pilih.judul.replace(/\.\w+$/, ''), 80)}*\n\n📐 ${pilih.info.width}×${pilih.info.height} · ${formatSize(pilih.info.size || 0)}\n📄 ${truncate(pilih.info.extmetadata?.LicenseShortName?.value || '-', 40)}\n🌐 Wikimedia Commons\n\nHasil lain: ${hasil.slice(1, 4).map(h => truncate(h.judul.replace(/\.\w+$/, ''), 30)).join(' · ')}\nHD: ${P}gambarhd ${q}`)
  }, 'danau toba'),

  bebas('gambarhd', ['gambarkualitas'], 'Unduh gambar resolusi penuh dari Wikimedia', async m => {
    const q = m.q
    if (!q) return m.reply(`Contoh: ${P}gambarhd masjid istiqlal`)
    const hasil = await cariCommons(q, 1600, 3)
    const pilih = hasil[0]
    const { buf } = await ambilBuffer(pilih.info.url, 60000)
    if (buf.length > 15 * 1024 * 1024) return m.reply(`⚠️ Gambar terlalu besar (${formatSize(buf.length)}). Pakai versi lebih kecil: ${P}wikigambar ${q}`)
    catatDl(m, 'commons-hd', pilih.judul)
    return m.sendImage(buf, `🖼️ *HD* ${truncate(pilih.judul.replace(/\.\w+$/, ''), 70)}\n📐 ${pilih.info.width}×${pilih.info.height} · ${formatSize(buf.length)}`)
  }, 'masjid istiqlal'),

  bebas('fotowiki', ['gambarwiki', 'wikimedia'], 'Ambil gambar utama artikel Wikipedia Indonesia', async m => {
    const q = m.q
    if (!q) return m.reply(`Contoh: ${P}fotowiki Sumatera Utara`)
    const j = await ambilJson(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`)
    const img = j?.originalimage?.source || j?.thumbnail?.source
    if (!img) return m.reply(`ℹ️ Artikel "${q}" tidak punya gambar.\n\nRingkasan: ${truncate(j?.extract || 'tidak ditemukan', 200)}\nCoba: ${P}wikigambar ${q}`)
    catatDl(m, 'wikipedia', j.title)
    return m.sendImage(img, `📖 *${j.title}*\n\n${truncate(j.extract || '', 240)}\n\n🌐 id.wikipedia.org`)
  }, 'Sumatera Utara'),

  bebas('randomgambar', ['picsum', 'fotorandom'], 'Kirim foto acak berkualitas (Picsum)', async m => {
    const w = Number(m.args[0]) || 800
    const h = Number(m.args[1]) || 600
    const { buf } = await ambilBuffer(`https://picsum.photos/${Math.min(2000, w)}/${Math.min(2000, h)}`, 30000)
    catatDl(m, 'picsum', `${w}x${h}`)
    return m.sendImage(buf, `🎲 Foto acak ${w}×${h} (Picsum)\n\nUkuran lain: ${P}randomgambar 1080 1350\nBertema: ${P}gambartema gunung`)
  }, '1080 1350'),

  bebas('gambartema', ['loremflickr', 'gambar kata'.replace(' ', '')], 'Foto acak sesuai kata kunci (LoremFlickr)', async m => {
    const q = (m.q || 'nature').replace(/\s+/g, ',')
    const { buf } = await ambilBuffer(`https://loremflickr.com/800/600/${encodeURIComponent(q)}`, 30000)
    catatDl(m, 'loremflickr', q)
    return m.sendImage(buf, `🖼️ Foto bertema *${q}* (LoremFlickr)\n\nTema lain: ${P}gambartema kucing\nAcak tanpa tema: ${P}randomgambar`)
  }, 'kucing lucu'),

  bebas('wallpaperhd', ['walldl', 'latarhd'], 'Wallpaper HP (1080×1920) sesuai tema', async m => {
    const q = (m.q || 'nature').replace(/\s+/g, ',')
    const { buf } = await ambilBuffer(`https://loremflickr.com/1080/1920/${encodeURIComponent(q)}`, 40000)
    catatDl(m, 'wallpaper', q)
    return m.sendImage(buf, `📱 Wallpaper 1080×1920 tema *${q}*\n\nTema lain: ${P}wallpaperhd galaxy\nBuat jadi stiker: balas gambar ini dengan ${P}stiker`)
  }, 'galaxy'),

  bebas('benderabesar', ['flagdl', 'benderahd'], 'Unduh gambar bendera negara resolusi besar', async m => {
    const kode = (m.args[0] || 'id').toLowerCase().replace(/[^a-z]/g, '')
    if (kode.length !== 2) return m.reply(`Contoh: ${P}benderabesar my\n\nKode ISO 2 huruf: id, my, sg, us, jp, sa, ...\nLihat daftar negara: ${P}negaralist`)
    const { buf } = await ambilBuffer(`https://flagcdn.com/w640/${kode}.png`, 20000)
    catatDl(m, 'bendera', kode)
    return m.sendImage(buf, `🏳️ Bendera *${kode.toUpperCase()}* (640px)\n\nUkuran lain: w40, w160, w1280\nContoh: https://flagcdn.com/w1280/${kode}.png`)
  }, 'my'),

  bebas('situslogo', ['logositus', 'logoweb'], 'Ambil logo/favicon sebuah situs', async m => {
    const url = urlDari(m) || m.q
    if (!url) return m.reply(`Contoh: ${P}situslogo https://github.com\natau ${P}situslogo github.com`)
    const host = url.replace(/^https?:\/\//, '').split('/')[0]
    if (!host.includes('.')) return m.reply(`⚠️ Domain tidak valid: "${host}"`)
    const { buf } = await ambilBuffer(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=256`, 20000)
    catatDl(m, 'favicon', host)
    return m.sendImage(buf, `🔖 Logo/favicon *${host}* (256px)\n\nSumber: Google Favicon Service\nJadikan stiker: balas dengan ${P}stiker`)
  }, 'github.com'),

  bebas('fotogithub', ['avatar github'.replace(' ', ''), 'ghavatar'], 'Ambil foto profil pengguna GitHub', async m => {
    const user = (m.args[0] || '').replace(/^@/, '').replace(/[^\w-]/g, '')
    if (!user) return m.reply(`Contoh: ${P}fotogithub torvalds`)
    const { buf } = await ambilBuffer(`https://github.com/${user}.png`, 20000)
    catatDl(m, 'github-avatar', user)
    return m.sendImage(buf, `👤 Avatar GitHub *@${user}*\n\nProfil: https://github.com/${user}\nUkuran: 460×460`)
  }, 'torvalds'),

  bebas('emojiunduh', ['emojipng', 'ambilemoji'], 'Unduh emoji Apple sebagai gambar PNG', async m => {
    const em = (m.q || '😂').trim()
    const hex = [...em].map(c => c.codePointAt(0).toString(16)).join('-').slice(0, 20)
    const { buf } = await ambilBuffer(`https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/${hex}.png`, 20000)
    catatDl(m, 'emoji', em)
    return m.sendImage(buf, `${em} Emoji Apple (64px)\n\nVersi besar: https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/160/${hex}.png\nJadikan stiker: ${P}stikeremoji ${em}`)
  }, '🐱')
]

/* ================================================================== */
/*  D. AMBIL MEDIA DARI URL (6)                                        */
/* ================================================================== */
export const dlUrlCmds = [
  dl('ambilgambar', ['getimage', 'unduhgambar'], 'Unduh gambar dari link langsung', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}ambilgambar https://example.com/foto.jpg`)
    const { buf, type } = await ambilBuffer(url)
    if (!/image\//.test(type)) return m.reply(`⚠️ Link itu bukan gambar (tipe: ${type}).\n\nKalau dokumen: ${P}ambildokumen ${url}\nKalau video: ${P}ambilvideo ${url}`)
    catatDl(m, 'gambar', url)
    return m.sendImage(buf, `🖼️ ${truncate(url, 120)}\n${formatSize(buf.length)} · ${type}`)
  }, 'https://picsum.photos/600/400'),

  dl('ambilvideo', ['getvideo', 'unduhvideo'], 'Unduh video dari link langsung', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}ambilvideo https://example.com/video.mp4`)
    const { buf, type } = await ambilBuffer(url, 90000)
    if (buf.length > 60 * 1024 * 1024) return m.reply(`⚠️ Video ${formatSize(buf.length)} terlalu besar (batas ±64MB).`)
    catatDl(m, 'video', url)
    return m.sendVideo(buf, `🎬 ${truncate(url, 120)}\n${formatSize(buf.length)} · ${type}`)
  }, 'https://example.com/video.mp4'),

  dl('ambilaudio', ['getaudio', 'unduhmp3'], 'Unduh audio/MP3 dari link langsung', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}ambilaudio https://example.com/lagu.mp3`)
    const { buf, type } = await ambilBuffer(url, 60000)
    catatDl(m, 'audio', url)
    return m.sendAudio(buf, { mimetype: /audio/.test(type) ? type : 'audio/mpeg', ptt: false })
  }, 'https://example.com/lagu.mp3'),

  dl('ambildokumen', ['getfile', 'unduhfile'], 'Unduh file apa pun jadi dokumen', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}ambildokumen https://example.com/berkas.pdf`)
    const { buf, type } = await ambilBuffer(url, 60000)
    const nama = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'file.bin').slice(0, 60)
    catatDl(m, 'dokumen', nama)
    return m.sendDoc(buf, nama, type, { caption: `📄 ${nama}\n${formatSize(buf.length)} · ${type}` })
  }, 'https://example.com/berkas.pdf'),

  bebas('mediainfo', ['cekmedia', 'infourl'], 'Cek isi sebuah link tanpa mengunduh penuh', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}mediainfo https://example.com/video.mp4`)
    let head
    try {
      head = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': UA } })
    } catch (e) { throw new Error('tidak bisa diakses: ' + truncate(e.message, 80)) }
    const type = head.headers.get('content-type') || '?'
    const size = Number(head.headers.get('content-length') || 0)
    const jenis = /image/.test(type) ? '🖼️ Gambar' : /video/.test(type) ? '🎬 Video' : /audio/.test(type) ? '🎵 Audio' : /pdf/.test(type) ? '📕 PDF' : /zip|rar|7z/.test(type) ? '🗜️ Arsip' : /html/.test(type) ? '🌐 Halaman web' : '📄 File'
    return m.reply(`${jenis} *INFO LINK*\n\nURL    : ${truncate(url, 160)}\nStatus : HTTP ${head.status}\nTipe   : ${type}\nUkuran : ${size ? formatSize(size) : '(tidak diketahui)'}\nServer : ${head.headers.get('server') || '-'}\nCache  : ${head.headers.get('cache-control') || '-'}\n\nUnduh:\n▸ ${P}ambilgambar / ${P}ambilvideo / ${P}ambilaudio / ${P}ambildokumen`)
  }, 'https://picsum.photos/600/400'),

  dl('simpanmedia', ['savekefile'], 'Simpan media dari link ke folder tmp bot', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}simpanmedia https://example.com/foto.jpg`)
    const { buf, type } = await ambilBuffer(url, 60000)
    const ext = (type.split('/')[1] || 'bin').split(';')[0].replace('jpeg', 'jpg')
    const file = saveTmp(buf, ext)
    catatDl(m, 'simpan', path.basename(file))
    return m.reply(`💾 Media disimpan sementara.\n\nFile  : ${path.relative(ROOT, file)}\nUkuran: ${formatSize(buf.length)}\nTipe  : ${type}\n\n⚠️ Folder tmp dibersihkan otomatis tiap 30 menit.\nKirim sebagai dokumen: ${P}ambildokumen ${url}`)
  }, 'https://picsum.photos/600/400')
]

/* ================================================================== */
/*  E. SCREENSHOT & ARSIP WEB (6)                                      */
/* ================================================================== */
const ssCmd = (command, aliases, desc, lebar, tinggi, contoh) =>
  dl(command, aliases, desc, async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}${command} https://detik.com`)
    await m.react('📸')
    const { buf } = await ambilBuffer(`https://image.thum.io/get/width/${lebar}/crop/${tinggi}/${url}`, 75000)
    catatDl(m, 'screenshot', url)
    return m.sendImage(buf, `📸 Screenshot ${lebar}×${tinggi}\n${truncate(url, 120)}`)
  }, contoh)

export const dlWebCmds = [
  ssCmd('ssfull', ['screenshotpenuh', 'sslengkap'], 'Screenshot halaman penuh (panjang)', 1200, 3000, 'https://detik.com'),
  ssCmd('ssmobile', ['sshp', 'screenshotmobile'], 'Screenshot tampilan mobile (390×844)', 390, 844, 'https://tokopedia.com'),
  ssCmd('ssdesktop', ['sspc', 'screenshotdesktop'], 'Screenshot tampilan desktop (1366×768)', 1366, 768, 'https://github.com'),
  ssCmd('sslebar', ['sswide', 'ss1920'], 'Screenshot layar lebar 1920×1080', 1920, 1080, 'https://youtube.com'),

  bebas('arsipweb', ['wayback', 'webarchive'], 'Buka versi arsip (Wayback Machine) sebuah situs', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}arsipweb https://detik.com`)
    const j = await ambilJson(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`)
    const snap = j?.archived_snapshots?.closest
    if (!snap?.available) return m.reply(`ℹ️ Tidak ada arsip untuk ${truncate(url, 80)}.\n\nCoba simpan sekarang: ${P}simpanarsip ${url}`)
    return m.sendButtons({
      title: '🗄️ ARSIP WEB',
      text: `*${truncate(url, 120)}*\n\nVersi arsip: ${new Date(String(snap.timestamp).replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6')).toLocaleString('id-ID')}\nStatus: HTTP ${snap.status}\n\n🔗 ${snap.url}\n\nMau lihat gambarnya? ${P}ssfull ${snap.url}`,
      footer: config.bot.footer,
      buttons: [{ text: '📸 Screenshot Arsip', id: `${P}ssdesktop ${snap.url}` }, { text: '📸 Screenshot Asli', id: `${P}ssdesktop ${url}` }]
    })
  }, 'https://detik.com'),

  bebas('cekarsip', ['arsiptersedia'], 'Cek cepat apakah sebuah situs punya arsip', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}cekarsip https://example.com`)
    const j = await ambilJson(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`)
    const snap = j?.archived_snapshots?.closest
    return m.reply(snap?.available
      ? `✅ Ada arsip untuk ${truncate(url, 80)}\n\nSnapshot: ${snap.timestamp}\nStatus  : HTTP ${snap.status}\nLink    : ${snap.url}\n\nBuka detail: ${P}arsipweb ${url}`
      : `❌ Belum ada arsip untuk ${truncate(url, 80)}.\n\nSitus baru/kecil biasanya belum terarsip.`)
  }, 'https://example.com')
]

/* ================================================================== */
/*  F. UPLOAD & KIRIM ULANG (7)                                        */
/* ================================================================== */
async function uploadCatbox (buf, nama) {
  const fd = new FormData()
  fd.append('reqtype', 'fileupload')
  fd.append('fileToUpload', new Blob([buf]), nama)
  const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd, signal: AbortSignal.timeout(90000) })
  const teks = (await r.text()).trim()
  if (r.ok && /^https:\/\/files\.catbox\.moe\//.test(teks)) return teks
  throw new Error(teks.slice(0, 100) || 'catbox menolak')
}
async function uploadLitter (buf, nama) {
  const fd = new FormData()
  fd.append('reqtype', 'fileupload')
  fd.append('time', '72h')
  fd.append('fileToUpload', new Blob([buf]), nama)
  const r = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: fd, signal: AbortSignal.timeout(90000) })
  const teks = (await r.text()).trim()
  if (r.ok && /^https:\/\//.test(teks)) return teks
  throw new Error(teks.slice(0, 100) || 'litterbox menolak')
}
async function mediaDariPesan (m) {
  if (m.quoted?.isMedia) return { buf: await m.quoted.toBuffer(), nama: `media-${Date.now()}` }
  if (m.isMedia) return { buf: await m.download(), nama: `media-${Date.now()}` }
  const link = urlDari(m)
  if (link) { const { buf, type } = await ambilBuffer(link, 60000); return { buf, nama: `unduh-${Date.now()}.${(type.split('/')[1] || 'bin').split(';')[0]}` } }
  return null
}
const uploadCmd = (command, aliases, desc, jenis) =>
  dl(command, aliases, desc, async m => {
    const media = await mediaDariPesan(m)
    if (!media) return m.reply(`Balas/kirim *${jenis}* lalu ketik ${P}${command}\n\nAtau pakai link: ${P}${command} https://example.com/file\n\n⚠️ Maksimal ±50MB. Link permanen (catbox) atau 72 jam (litterbox).`)
    if (media.buf.length > 50 * 1024 * 1024) return m.reply(`⚠️ File ${formatSize(media.buf.length)} terlalu besar (maks 50MB).`)
    await m.react('⏳')
    let link
    try { link = await uploadCatbox(media.buf, media.nama) } catch { link = await uploadLitter(media.buf, media.nama) }
    catatDl(m, 'upload', media.nama)
    return m.reply(`✅ *UPLOAD BERHASIL*\n\nUkuran: ${formatSize(media.buf.length)}\nLink  : ${link}\n\n${/litterbox/.test(link) ? '⏳ Link berlaku 72 jam (catbox sedang menolak).' : '♾️ Link permanen selama tidak dihapus.'}\n\nPerpendek: ${P}perpendek ${link}`)
  }, '1')

export const dlUploadCmds = [
  uploadCmd('uploadfile', ['uploadke', 'hostingfile'], 'Upload file/media ke hosting & dapat link', 'file'),
  uploadCmd('uploadgambar', ['hostingfoto', 'imgur alternatif'.replace(' ', '')], 'Upload gambar dan dapat link langsung', 'gambar'),
  uploadCmd('uploadvideo', ['hostingvideo'], 'Upload video dan dapat link langsung', 'video'),

  bebas('kirimulang', ['forward', 'teruskan'], 'Kirim ulang media yang dibalas ke chat ini', async m => {
    if (!m.quoted?.isMedia && !m.isMedia) return m.reply(`Balas sebuah media (gambar/video/audio/stiker/dokumen) lalu ketik ${P}kirimulang\n\nBisa juga tambah caption: ${P}kirimulang halo semua`)
    const buf = m.quoted?.isMedia ? await m.quoted.toBuffer() : await m.download()
    const type = m.quoted?.mimetype || m.mimetype || ''
    const cap = m.q ? `\n\n${m.q}` : ''
    if (/image/.test(type)) return m.sendImage(buf, `🔁 Dikirim ulang${cap}`)
    if (/video/.test(type)) return m.sendVideo(buf, `🔁 Dikirim ulang${cap}`)
    if (/audio/.test(type)) return m.sendAudio(buf, { mimetype: type })
    if (/sticker|webp/.test(type)) return m.sendSticker(buf)
    return m.sendDoc(buf, `media-${Date.now()}`, type || 'application/octet-stream')
  }),

  bebas('mediakedokumen', ['jadifile', 'konversidokumen'], 'Ubah media yang dibalas menjadi file dokumen', async m => {
    if (!m.quoted?.isMedia && !m.isMedia) return m.reply(`Balas media lalu ketik ${P}mediakedokumen\n\nContoh: balas stiker → jadi file .webp`)
    const buf = m.quoted?.isMedia ? await m.quoted.toBuffer() : await m.download()
    const type = m.quoted?.mimetype || m.mimetype || 'application/octet-stream'
    const ext = (type.split('/')[1] || 'bin').split(';')[0].replace('jpeg', 'jpg')
    const nama = (m.args[0] || `media-${Date.now()}`) + '.' + ext
    catatDl(m, 'ke-dokumen', nama)
    return m.sendDoc(buf, nama, type, { caption: `📄 *${nama}*\n${formatSize(buf.length)} · ${type}` })
  }),

  bebas('albumgambar', ['kirimalbum', 'multiimage'], 'Kirim beberapa gambar sekaligus dari daftar link', async m => {
    const links = (m.q || '').match(/https?:\/\/[^\s]+/gi) || []
    if (links.length < 2) return m.reply(`Kirim 2-6 link gambar dipisah spasi.\n\nContoh: ${P}albumgambar https://picsum.photos/400/300 https://picsum.photos/400/301`)
    await m.reply(`🖼️ Mengirim ${Math.min(6, links.length)} gambar...`)
    let n = 0
    for (const u of links.slice(0, 6)) {
      try { const { buf } = await ambilBuffer(u, 30000); await m.sendImage(buf, `📷 ${n + 1}/${Math.min(6, links.length)}`); n++ } catch { /* lewati */ }
    }
    return n ? undefined : m.reply('⚠️ Semua link gagal diunduh. Periksa apakah link-nya gambar langsung (.jpg/.png).')
  }, 'https://picsum.photos/400/300 https://picsum.photos/400/301'),

  bebas('tautanpendek', ['perpendekmedia', 'pendekkanlink'], 'Perpendek link hasil unduhan/upload', async m => {
    const url = urlDari(m)
    if (!url) return m.reply(`Contoh: ${P}tautanpendek https://files.catbox.moe/xxxxx.jpg`)
    const r = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': UA } })
    const pendek = (await r.text()).trim()
    if (!/^https?:\/\//.test(pendek)) throw new Error('tinyurl menolak link itu')
    return m.reply(`🔗 *LINK DIPERPENDEK*\n\nAsli  : ${truncate(url, 120)}\nPendek: ${pendek}\n\nCek isi link: ${P}mediainfo ${url}`)
  }, 'https://example.com')
]

/* ================================================================== */
/*  G. PANDUAN & RIWAYAT (5)                                           */
/* ================================================================== */
export const dlBantuanCmds = [
  bebas('panduan download'.replace(' ', ''), ['caradownload', 'panduanunduh'], 'Panduan lengkap memakai fitur downloader', m => {
    return m.sendButtons({
      title: '⬇️ PANDUAN DOWNLOADER',
      text: `*TIKTOK* (langsung jalan)\n▸ ${P}ttvideo <link> — video tanpa watermark\n▸ ${P}ttmusik <link> — audio MP3\n▸ ${P}ttslide <link> — foto dari post slide\n▸ ${P}ttinfo <link> — statistik & detail\n▸ ${P}ttunduh <link> — semua format dalam 1 pesan\n\n*YOUTUBE*\n▸ Tanpa install: ${P}ytinfo · ${P}ytthumb · ${P}ytcari\n▸ Perlu yt-dlp: ${P}ytvideo · ${P}ytvideo360 · ${P}ytmp3dl · ${P}ytplaylist\n▸ Cek & pasang: ${P}ytdlpinfo\n\n*GAMBAR*\n▸ ${P}wikigambar <kata> — Wikimedia Commons\n▸ ${P}gambarhd <kata> — resolusi penuh\n▸ ${P}fotowiki <judul> — gambar artikel Wikipedia\n▸ ${P}wallpaperhd <tema> — wallpaper 1080×1920\n▸ ${P}situslogo <domain> · ${P}fotogithub <user> · ${P}emojiunduh 😂\n\n*LINK LANGSUNG*\n▸ ${P}ambilgambar / ${P}ambilvideo / ${P}ambilaudio / ${P}ambildokumen <url>\n▸ ${P}mediainfo <url> — cek dulu sebelum unduh\n\n*WEB & UPLOAD*\n▸ ${P}ssfull / ${P}ssmobile / ${P}ssdesktop <url>\n▸ ${P}arsipweb <url> — versi lama situs\n▸ ${P}uploadfile — balas media, dapat link`,
      footer: config.bot.footer,
      buttons: [{ text: '🎬 TikTok', id: `${P}ttvideo` }, { text: '⚙️ Cek yt-dlp', id: `${P}ytdlpinfo` }, { text: '🖼️ Cari Gambar', id: `${P}wikigambar` }]
    })
  }),

  bebas('sumberdownload', ['apisdownload', 'sumbermedia'], 'Daftar sumber/API yang dipakai fitur downloader', m => {
    const sumber = [
      ['tikwm.com', 'Video, audio, cover, statistik TikTok'],
      ['youtube.com/oembed', 'Judul & channel video YouTube'],
      ['suggestqueries.google.com', 'Saran pencarian YouTube'],
      ['i.ytimg.com', 'Thumbnail YouTube'],
      ['yt-dlp (lokal)', 'Unduh video/audio YouTube — perlu dipasang di Termux'],
      ['commons.wikimedia.org', 'Jutaan gambar bebas lisensi'],
      ['id.wikipedia.org', 'Gambar & ringkasan artikel'],
      ['picsum.photos', 'Foto acak berkualitas'],
      ['loremflickr.com', 'Foto acak bertema + wallpaper'],
      ['flagcdn.com', 'Bendera negara semua ukuran'],
      ['google.com/s2/favicons', 'Logo/favicon situs'],
      ['github.com', 'Avatar pengguna GitHub'],
      ['cdn.jsdelivr.net', 'Gambar emoji Apple'],
      ['image.thum.io', 'Screenshot halaman web'],
      ['archive.org', 'Arsip Wayback Machine'],
      ['catbox.moe / litterbox', 'Hosting file hasil upload'],
      ['tinyurl.com', 'Perpendek link']
    ]
    return m.reply(`🌐 *SUMBER DOWNLOADER*\n\n${sumber.map(([k, v]) => `▸ *${k}*\n  ${v}`).join('\n')}\n\nSemua sumber publik & gratis. Kalau satu sedang sibuk, coba lagi beberapa menit.\nCek kesehatan API (owner): ${P}cekapi`)
  }),

  bebas('downloadgagal', ['dlerror', 'solusidownload'], 'Penyebab & solusi unduhan gagal', m => {
    return m.reply(`🛠️ *UNDUHAN GAGAL? CEK INI*\n\n*1. Link tidak valid/privat*\n▸ TikTok: pastikan link dari tombol Share → Copy link\n▸ Video privat/dihapus tidak bisa diunduh\n\n*2. Sumber sibuk (rate limit)*\n▸ Tunggu 1-2 menit lalu ulangi\n▸ API gratis punya batas per jam\n\n*3. File terlalu besar*\n▸ Batas kirim WhatsApp ±64MB (video) / 100MB (dokumen)\n▸ YouTube: pakai ${P}ytvideo360\n\n*4. yt-dlp belum terpasang*\n▸ ${P}ytdlpinfo untuk cek\n▸ Pasang: pkg install -y python ffmpeg && pip install -U yt-dlp\n\n*5. Jaringan HP lambat/VPN*\n▸ Beberapa CDN memblokir IP tertentu\n\n*6. Kuota bot habis*\n▸ Limit harian: ${P}claim\n\nMasih gagal? Lapor: ${P}laporbug <link + pesan error>`)
  }),

  bebas('riwayatdownload', ['riwayatdl', 'dlku'], 'Riwayat 25 unduhan terakhir kamu', m => {
    const db = loadDB('userdata', {})
    const log = db[m.senderKey || m.sender]?.dlLog || []
    if (!log.length) return m.reply(`ℹ️ Belum ada riwayat unduhan.\n\nCoba: ${P}wikigambar medan atau ${P}ttvideo <link>\n\nPanduan: ${P}panduandownload`)
    const jenis = {}
    for (const x of log) jenis[x.jenis] = (jenis[x.jenis] || 0) + 1
    return m.reply(`📥 *RIWAYAT UNDUHAN* (${log.length})\n\n${log.map((x, i) => `${i + 1}. [${x.jenis}] ${truncate(x.judul, 46)}\n   ⤷ ${new Date(x.waktu).toLocaleString('id-ID')}`).join('\n')}\n\n*Ringkasan:*\n${Object.entries(jenis).sort((a, b) => b[1] - a[1]).map(([k, v]) => `▸ ${k}: ${v}×`).join('\n')}`)
  }),

  bebas('listdownload', ['dlmenu2', 'semuadownload'], 'Daftar semua perintah downloader', m => {
    const { categories } = pluginsLib
    const list = categories().get('Downloader') || []
    const bagian = {
      tt: '🎬 TikTok', yt: '📺 YouTube', wiki: '🖼️ Gambar', ambil: '🔗 Link langsung',
      ss: '📸 Web', upload: '⬆️ Upload'
    }
    const kelompok = {}
    for (const p of list) {
      const k = p.name.startsWith('tt') ? 'tt' : p.name.startsWith('yt') ? 'yt'
        : /gambar|foto|logo|emoji|bendera|wallpaper|random|wiki|picsum/.test(p.name) ? 'wiki'
          : /ambil|media|simpan/.test(p.name) ? 'ambil'
            : /^ss|arsip|cekarsip/.test(p.name) ? 'ss' : /^upload|kirim|album|tautan/.test(p.name) ? 'upload' : 'wiki'
      ;(kelompok[k] = kelompok[k] || []).push(p)
    }
    return m.reply(`⬇️ *MENU DOWNLOADER* (${list.length} perintah)\n\n${Object.entries(kelompok).map(([k, arr]) => `*${bagian[k] || k}*\n${arr.map(p => `▸ ${P}${p.name} — ${truncate(p.description || '', 44)}`).join('\n')}`).join('\n\n')}\n\nPanduan lengkap: ${P}panduandownload`)
  })
]

export const downloaderlabCmds = [
  ...dlTiktokCmds, ...dlYoutubeCmds, ...dlGambarCmds,
  ...dlUrlCmds, ...dlWebCmds, ...dlUploadCmds, ...dlBantuanCmds
]

export default { downloaderlabCmds }
