/**
 * 🎧 .play <judul / link audio> — pemutar musik HTML "Now Playing" (v7.9.2)
 * ------------------------------------------------------------------
 *  1) cari lagu (Deezer → iTunes) : cover, judul, artis, URL audio langsung
 *  2) kirim kartu HTML (lib/playhtml.js): seek, ⏮⏸⏭, sleep timer, repeat,
 *     volume, panel STREAM AUDIO (host/MB/chunks/MIME) — semua berfungsi
 *  3) kirim juga audio sebagai pesan WhatsApp (untuk device tanpa HTML app)
 *  Link audio langsung (mp3/m4a) juga bisa: .play https://.../lagu.mp3
 */
import { config } from '../config.js'
import { getSettings, setSetting } from '../lib/database.js'
import { truncate } from '../lib/functions.js'
import { cariLagu, simpanPilihan, ambilPilihan } from '../lib/musikplayer.js'
import { playHtml } from '../lib/playhtml.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { siapkanAudio, kirimAudioWA } from '../lib/siapkanlagu.js'

const P = config.display.prefix
async function kirimPlayer (m, t, mode = 'auto') {
  const A = await siapkanAudio(t, 'play', mode)
  const html = playHtml(config.bot.name, { judul: t.judul, artis: t.artis, cover: A.cover || t.cover, url: A.urlAudio, cadangan: A.urlCadangan || '', mime: A.mimeKartu, durasi: t.durasiAsli, sumber: t.sumber, host: A.penuh ? 'full track' : A.host })
  let viaHtml = false
  try {
    const hosts = [A.host, A.streamHost, 'cdn-images.dzcdn.net', 'e-cdns-images.dzcdn.net', 'cdnt-preview.dzcdn.net', 'cdns-preview-0.dzcdn.net', 'is1-ssl.mzstatic.com', 'audio-ssl.itunes.apple.com', 'hirara.dev']
    await sendHtmlApp(m.sock, m.jid, { title: `🎧 ${truncate(t.judul, 40)} — ${truncate(t.artis, 30)}`, html, trustedSources: [...new Set(hosts)] })
    viaHtml = true
  } catch (e) { console.error('[play] html:', e.message) }
  t.viaAudio = await kirimAudioWA(m, t, A.audio, A.mime, 'play')
  return viaHtml
}

export const play = {
  command: ['play', 'putarmusik', 'playmusic', 'nowplayinghtml', 'playhtml'],
  category: 'Downloader',
  description: '🎧 Pemutar musik HTML "Now Playing": cover, seek, ⏮⏸⏭, sleep timer, repeat, volume, panel stream — .play judul lagu / link mp3',
  limit: 1,
  cooldown: 5,
  contoh: 'dj sudah cukup sudah',
  run: async m => {
    let q = String(m.q || '').trim()
    let modePilih = 'auto'
    let hasilAwal = null
    const tok = q.match(/^#([A-Z0-9]{6})\s+(30|full)$/i)
    if (tok) {
      const simpan = ambilPilihan(tok[1])
      if (!simpan?.hasil?.length) return m.reply(`⏱️ Pilihan kedaluwarsa — ketik \`${P}play <judul>\` lagi.`)
      q = simpan.q
      hasilAwal = simpan.hasil
      modePilih = tok[2].toLowerCase() === '30' ? '30' : 'full'
    }
    if (!q) return m.reply(`🎧 *PLAY*\n\n\`${P}play dj sudah cukup sudah\`\n\`${P}play https://situs.com/lagu.mp3\`\n\nPemutar tampil di chat: seek, ⏮ ⏸ ⏭, sleep timer, repeat, volume.`)
    try { await m.react?.('🎧') } catch {}
    try {
      let t
      const url = q.match(/https?:\/\/[^\s]+/i)?.[0]
      if (url) {
        const nama = decodeURIComponent(url.split('/').pop().split('?')[0] || 'Audio').replace(/\.(mp3|m4a|aac|ogg|wav|opus)$/i, '')
        t = { judul: nama || 'Audio', artis: new URL(url).host, cover: '', preview: url, mime: /\.(m4a|aac|mp4)/i.test(url) ? 'audio/mp4' : 'audio/mpeg', durasiAsli: 0, sumber: 'Link', album: '', link: url }
      } else {
        const hasil = hasilAwal || await cariLagu(q, 5)
        if (!hasil.length) return m.reply(`❌ Lagu "${q}" tidak ditemukan. Coba tulis judul + artis.`)
        if (!hasilAwal) {
          const token = simpanPilihan({ hasil, q })
          const t0 = hasil[0]
          const dur0 = t0.durasiAsli ? Math.floor(t0.durasiAsli / 60) + ':' + String(t0.durasiAsli % 60).padStart(2, '0') : '-'
          return m.sendButtons({
            title: '🎧 Pilih durasi',
            text: `🎧 *${t0.judul}*\n${t0.artis} · ⏱️ ${dur0} · ${t0.sumber}\n\nPilih durasi audio:`,
            footer: config.bot.footer,
            buttons: [{ text: '⏱️ 30 detik', id: `${P}play #${token} 30` }, { text: '🎵 Durasi full', id: `${P}play #${token} full` }]
          }).catch(() => m.reply(`🎧 *PILIH DURASI — ${t0.judul}*\n\n\`${P}play #${token} 30\` — 30 detik\n\`${P}play #${token} full\` — lagu penuh`))
        }
        t = hasil[0]
        const lain = hasil.slice(1, 5)
        const viaHtml = await kirimPlayer(m, t, modePilih)
        return m.sendButtons({
          title: '🎧 Now Playing',
          text: `🎧 *NOW PLAYING*\n\n*${t.judul}*\n${t.artis}${t.album ? ` · _${t.album}_` : ''}\n⏱️ ${t.durasiAsli ? Math.floor(t.durasiAsli / 60) + ':' + String(t.durasiAsli % 60).padStart(2, '0') : '-'} · ${t.sumber}\n\n${viaHtml ? 'Pemutar ada di atas ☝️ — ketuk ▶ (kalau kartu tidak muncul, buka ulang chat/perbarui WhatsApp)' : '⚠️ Pemutar HTML tidak terkirim.'}${t.viaAudio ? '\n🎵 File audio' + (t.penuh ? ' penuh' : '') + ' kualitas asli juga dikirim di atas' + (t.penuh ? ' — kartu memakai versi hemat data.' : '.') : '\n❌ File audio gagal dikirim (cek log terminal).'}${modePilih === '30' ? '\n\n⏱️ Mode 30 detik (sesuai pilihan).' : (t.penuh ? '' : `\n\n⚠️ Lagu penuh gagal diambil dari semua sumber — coba lagi nanti.`)}${lain.length ? `\n\n*Hasil lain:*\n${lain.map((x, i) => `${i + 2}. ${x.judul} — ${x.artis}`).join('\n')}` : ''}`,
          footer: config.bot.footer,
          buttons: [...lain.slice(0, 3).map((x, i) => ({ text: truncate(`${i + 2}. ${x.judul}`, 20), id: `${P}play ${x.judul} ${x.artis}` })), { text: '🟢 Versi Spotify + lirik', id: `${P}play3 ${t.judul} ${t.artis}` }]
        }).catch(() => null)
      }
      const viaHtml = await kirimPlayer(m, t)
      return m.reply(`🎧 *NOW PLAYING*\n*${t.judul}*\n${t.artis}\n\n${viaHtml ? 'Pemutar ada di atas ☝️' : '⚠️ Pemutar HTML tidak terkirim.'}${t.viaAudio ? '\n🎵 Audio dikirim di atas.' : '\n❌ Audio gagal dikirim.'}`)
    } catch (e) {
      console.error('[play]', e)
      return m.reply(`❌ Gagal: ${truncate(String(e.message || e), 200)}`)
    }
  }
}


export const playkb = {
  command: ['playkb', 'playkualitas', 'setplaykb'],
  category: 'Owner',
  description: '🎚️ Owner: batas ukuran audio di kartu .play (KB). Makin besar = makin jernih, tapi >~600 KB kartu bisa ditolak WhatsApp. Default 430',
  owner: true,
  run: async m => {
    const n = parseInt(m.q)
    if (!n) return m.reply(`🎚️ *PLAY KB*\nSekarang: *${(Number(getSettings().playKartuKb) || 430)} KB*\n\n\`${P}playkb 550\` → coba lebih jernih (cek kartu masih muncul)\n\`${P}playkb 430\` → kembali default aman\n\nBitrate kartu = KB×8÷durasi; lagu 4,5 mnt: 430KB≈12kbps, 600KB≈17kbps.`)
    if (n < 150 || n > 1200) return m.reply('❌ Rentang 150–1200 KB.')
    setSetting('playKartuKb', n)
    return m.reply(`✅ Batas audio kartu .play = *${n} KB*. Coba \`${P}play\` lagi; kalau kartu tidak muncul, turunkan.`)
  }
}
export default { play, playkb }
