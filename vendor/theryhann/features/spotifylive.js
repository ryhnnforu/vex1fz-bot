/**
 * 🟢 .spotifylive  /  📸 .iglive — KARTU LIVE ala video referensi (v7.14.0)
 *  3 tab (Cari · Bareng · Ruang Global). "Cari" di dalam kartu memanggil
 *  Deezer langsung (JSONP, host masuk trusted_sources) → hasil & audio
 *  langsung di kartu dengan progres "Mengunduh xx%". Jika webview WA
 *  memblokir jaringan, kartu otomatis memakai lagu yang ditanam bot
 *  (4 cuplikan dari kata kunci). Ruangan memakai penyimpanan yang sama
 *  dengan .playlists (.gabungruang KODE tetap berlaku).
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { cariLagu } from '../lib/musikplayer.js'
import { spotifyLiveHtml, TRUSTED_LIVE } from '../lib/spotifylive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { siapkanTrackKecil, ruangan, buatKode } from './playlists.js'

const P = config.display.prefix
const daftarRuang = () => [...ruangan.entries()].map(([kode, r]) => ({ kode, host: r.nama, n: 1 + (r.anggota?.size || 0), mx: r.mx || 10, pub: !!r.pub, lagu: r.tracks?.[0]?.judul || '-' }))

async function tanam (q, n = 4) {
  if (!q) return []
  const hasil = await cariLagu(q, n).catch(() => [])
  const out = []
  for (const t of hasil.slice(0, n)) { const x = await siapkanTrackKecil(t, 44 * 1024, false).catch(() => null); if (x?.url) out.push(x) }
  return out
}

function buat (theme, cmd, aliases, label) {
  return {
    command: [cmd, ...aliases],
    category: 'Downloader',
    description: `${theme === 'ig' ? '📸' : '🟢'} ${label} LIVE — kartu 3 tab: Cari (hasil & putar langsung di kartu) · Bareng (buat/gabung ruangan, publik, maks orang) · Ruang Global`,
    limit: 1,
    cooldown: 6,
    contoh: 'tesla slowed',
    run: async m => {
      const user = m.senderKey || m.sender
      const nama = truncate(String(m.pushName || 'kamu'), 20)
      const kode = buatKode(user)
      const q = String(m.q || '').trim()
      try { await m.react?.(theme === 'ig' ? '📸' : '🟢') } catch {}
      let tracks = []
      if (q) { await m.reply(`${theme === 'ig' ? '📸' : '🟢'} Menyiapkan kartu *${label} LIVE*${q ? ` untuk "${q}"` : ''}… ±15 detik`); tracks = await tanam(q, 4) }
      if (!ruangan.has(kode)) ruangan.set(kode, { host: user, nama, tracks, ts: Date.now(), mx: 10, pub: false })
      else if (tracks.length) ruangan.get(kode).tracks = tracks
      const html = spotifyLiveHtml(config.bot.name, { theme, nama, universe: `${config.bot.name} Universe`, kode, prefix: P, cmd, tracks, query: q, rooms: daftarRuang() })
      try {
        await sendHtmlApp(m.sock, m.jid, { title: `${theme === 'ig' ? '📸' : '🟢'} ${label} LIVE · ruangan ${kode}`, html, trustedSources: TRUSTED_LIVE })
      } catch (e) { return m.reply(`❌ Kartu gagal dikirim: ${truncate(String(e.message || e), 120)}`) }
      return m.reply(`${theme === 'ig' ? '📸' : '🟢'} *${label.toUpperCase()} LIVE* — ruangan *${kode}*\n\n• Tab *Cari*: ketik lagu/artis → hasil & pemutar langsung di kartu${tracks.length ? ` (cadangan ${tracks.length} lagu "${q}" sudah ditanam)` : ''}\n• Tab *Bareng*: Buat ruangan (publik/privat, maks 2-10) atau masukkan kode\n• Tab *Ruang Global*: ruangan publik yang sedang aktif\n\nTeman gabung: \`${P}gabungruang ${kode}\` · Playlist penuh: \`${P}playlists judul\``)
    }
  }
}

export const spotifylive = buat('spotify', 'spotifylive', ['splive2', 'spotlive', 'spotifyliv', 'spotifylivemass'], 'Spotify')
export const iglive = buat('ig', 'iglive', ['instalive', 'igmusic', 'instagramlive', 'iglivemusic'], 'Instagram')

export const ruangpublik = {
  command: ['ruangpublik', 'ruangglobal', 'publicroom', 'daftarruang'],
  category: 'Downloader',
  description: '👥 Daftar ruangan LIVE publik + jadikan ruanganmu publik: .ruangpublik on|off [maks]',
  limit: 0,
  run: async m => {
    const user = m.senderKey || m.sender; const kode = buatKode(user)
    const [a, b] = String(m.q || '').trim().toLowerCase().split(/\s+/)
    if (a === 'on' || a === 'off') { const r = ruangan.get(kode) || { host: user, nama: truncate(String(m.pushName || 'kamu'), 20), tracks: [], ts: Date.now() }; r.pub = a === 'on'; if (b) r.mx = Math.max(2, Math.min(10, parseInt(b) || 10)); ruangan.set(kode, r); return m.reply(`👥 Ruangan *${kode}* sekarang ${r.pub ? 'PUBLIK' : 'privat'} · maks ${r.mx || 10} orang`) }
    const pub = daftarRuang().filter(r => r.pub)
    return m.reply(`🌐 *RUANG GLOBAL* (${pub.length} publik)\n${pub.length ? pub.map(r => `• *${r.kode}* — host ${r.host} · ${r.n}/${r.mx} · 🎵 ${r.lagu}`).join('\n') : 'belum ada'}\n\nGabung: \`${P}gabungruang KODE\`\nJadikan ruanganmu publik: \`${P}ruangpublik on 10\``)
  }
}
export default { spotifylive, iglive, ruangpublik }
