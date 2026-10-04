/**
 * 🌐 .curl — ambil URL / HTTP request langsung dari chat  v7.37.0
 * ------------------------------------------------------------------
 *  • .curl <url>                      → GET, tampilkan isi respons
 *  • .curl <url> | method:POST        → ganti metode
 *  • .curl <url> | header:X-Api:123   → tambah header (boleh banyak)
 *  • .curl <url> | data:a=1&b=2       → badan permintaan (form/JSON)
 *  • .curl <url> | raw                → kirim mentah tanpa dirapikan
 *  • .curl <url> | head               → hanya header + status
 *  • .curl <url> | file               → unduh & kirim sebagai dokumen
 *
 *  OWNER-ONLY: permintaan keluar dari server bot bisa dipakai untuk
 *  memindai jaringan internal, jadi dibatasi pemilik + daftar blokir
 *  alamat pribadi (SSRF guard).
 *
 *  Memakai fetch bawaan Node (repo ini tidak memakai axios).
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const TIMEOUT_MS = 20000
const MAKS_TAMPIL = 3500          // karakter yang ditampilkan di chat
const MAKS_UNDUH = 8 * 1024 * 1024 // 8 MB untuk mode file
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/** header yang tidak aman dikirim balik ke user (bisa bocorkan kredensial) */
const HEADER_RAHASIA = /^(set-cookie|authorization|proxy-authenticate|x-api-key|cookie)$/i

/**
 * Blokir alamat pribadi/lokal supaya bot tidak dipakai memindai jaringan
 * internal (SSRF). Dicek pada nama host sebelum permintaan dikirim.
 */
function hostTerlarang (host) {
  const h = String(host || '').toLowerCase()
  if (!h) return 'host kosong'
  if (h === 'localhost' || h.endsWith('.localhost')) return 'alamat lokal'
  if (h === '0.0.0.0' || h === '::' || h === '::1') return 'alamat lokal'
  if (/^127\./.test(h)) return 'loopback 127.x'
  if (/^10\./.test(h)) return 'jaringan privat 10.x'
  if (/^192\.168\./.test(h)) return 'jaringan privat 192.168.x'
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return 'jaringan privat 172.16-31.x'
  if (/^169\.254\./.test(h)) return 'link-local / metadata cloud'
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return 'CGNAT 100.64.x'
  if (/^(metadata|169\.254\.169\.254)$/.test(h)) return 'endpoint metadata cloud'
  return ''
}

/**
 * Urai argumen .curl: `<url> | key:value | key:value`
 * @returns {{url:string, method:string, headers:object, data:string, opsi:Set<string>, galat:string}}
 */
export function uraiCurl (q) {
  const bagian = String(q || '').split('|').map(s => s.trim()).filter(Boolean)
  const url = String(bagian.shift() || '').trim()
  const method0 = 'GET'
  let method = method0
  const headers = { 'User-Agent': UA }
  let data = ''
  const opsi = new Set()
  let galat = ''

  if (!url) return { url: '', method, headers, data, opsi, galat: 'url kosong' }
  if (!/^https?:\/\//i.test(url)) {
    return { url, method, headers, data, opsi, galat: `URL harus diawali http:// atau https:// (dapat: \`${url}\`)` }
  }

  for (const b of bagian) {
    const pisah = b.indexOf(':')
    if (pisah < 0) { opsi.add(b.toLowerCase()); continue }
    const kunci = b.slice(0, pisah).trim().toLowerCase()
    const nilai = b.slice(pisah + 1).trim()
    if (!nilai) continue
    if (kunci === 'method' || kunci === 'm' || kunci === 'x') method = nilai.toUpperCase()
    else if (kunci === 'data' || kunci === 'd' || kunci === 'body' || kunci === 'post') data = nilai
    else if (kunci === 'header' || kunci === 'h') {
      /* `header:Nama: nilai` → pisahkan lagi pada ":" pertama setelah nama */
      const p2 = nilai.indexOf(':')
      if (p2 > 0) headers[nilai.slice(0, p2).trim()] = nilai.slice(p2 + 1).trim()
      else galat = `Header tidak sah: \`${b}\` (pakai \`header: Nama: nilai\`)`
    } else {
      /* tanpa kata kunci dikenal → anggap header bebas `Nama: nilai` */
      headers[b.slice(0, pisah).trim()] = nilai
    }
  }

  /* kalau ada data tapi method masih GET, naikkan ke POST (kebiasaan curl) */
  if (data && method === 'GET') method = 'POST'
  if (data && !headers['Content-Type']) {
    headers['Content-Type'] = /^\s*[\[{]/.test(data) ? 'application/json' : 'application/x-www-form-urlencoded'
  }
  return { url, method, headers, data, opsi, galat }
}

/** rapikan JSON supaya enak dibaca, tapi jangan meledak untuk payload besar */
function rapikan (teks, tipe) {
  if (/json/i.test(tipe || '')) {
    try { return JSON.stringify(JSON.parse(teks), null, 2) } catch {}
  }
  return teks
}

export const curlCmd = {
  command: ['curl', 'httpget', 'ambilkurl', 'ambilurl', 'fetchurl', 'geturl', 'requesturl'],
  category: 'Owner Menu',
  description: '🌐 Ambil URL / HTTP request dari chat — `.curl https://api.github.com/zen`',
  owner: true,
  limit: 0,
  cooldown: 3,
  contoh: 'https://api.github.com/zen',
  run: async m => {
    const q = String(m.q || (m.args || []).join(' ') || '').trim()

    if (!q || /^(help|bantuan|cara|\?)$/i.test(q)) {
      const teks =
        `🌐 *CURL — HTTP REQUEST DARI CHAT*\\n\\n` +
        `Cara pakai:\\n` +
        `\`${P}curl <url>\`\\n\\n` +
        `*Opsi* (pisahkan dengan \`|\`):\\n` +
        `• \`method:POST\` — ganti metode (GET/POST/PUT/DELETE/PATCH)\\n` +
        `• \`header: Nama: nilai\` — tambah header (boleh banyak)\\n` +
        `• \`data: a=1&b=2\` — badan permintaan (form/JSON)\\n` +
        `• \`head\` — hanya status + header\\n` +
        `• \`raw\` — tampilkan mentah tanpa dirapikan\\n` +
        `• \`file\` — unduh lalu kirim sebagai dokumen\\n\\n` +
        `*Contoh:*\\n` +
        `\`${P}curl https://api.github.com/zen\`\\n` +
        `\`${P}curl https://httpbin.org/post | method:POST | data: nama=budi\`\\n` +
        `\`${P}curl https://api.ipify.org?format=json | head\`\\n\\n` +
        `⏱️ Batas waktu ${TIMEOUT_MS / 1000} detik · tampilan maks ${MAKS_TAMPIL} karakter\\n` +
        `🔒 Alamat lokal/privat diblokir (anti-SSRF).`
      return m.sendButtons({
        title: '🌐 CURL',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          { text: '🎲 Contoh: github zen', id: `${P}curl https://api.github.com/zen` },
          { text: '🌍 Contoh: ip saya', id: `${P}curl https://api.ipify.org?format=json` },
          { text: '📋 Contoh: header saja', id: `${P}curl https://example.com | head` }
        ]
      }).catch(() => m.reply(teks))
    }

    const u = uraiCurl(q)
    if (u.galat) return m.reply(`❌ ${u.galat}`)

    let parsed
    try { parsed = new URL(u.url) } catch { return m.reply(`❌ URL tidak sah: \`${truncate(u.url, 80)}\``) }

    const kenapa = hostTerlarang(parsed.hostname)
    if (kenapa) {
      return m.reply(`🔒 *Ditolak:* \`${parsed.hostname}\` adalah ${kenapa}.\\n\\nFitur ini hanya untuk URL publik (anti-SSRF).`)
    }

    await m.react?.('🌐').catch(() => {})
    const mulai = Date.now()

    let res
    try {
      res = await fetch(u.url, {
        method: u.method,
        headers: u.headers,
        body: u.data && u.method !== 'GET' && u.method !== 'HEAD' ? u.data : undefined,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
    } catch (e) {
      const sebab = /timeout|aborted/i.test(String(e?.message || e))
        ? `waktu habis setelah ${TIMEOUT_MS / 1000} detik`
        : String(e?.message || e)
      return m.reply(`❌ *Gagal menghubungi* \`${truncate(u.url, 90)}\`\\n\\n\`\`\`${truncate(sebab, 300)}\`\`\``)
    }

    const ms = Date.now() - mulai
    const tipe = res.headers.get('content-type') || ''
    const panjang = res.headers.get('content-length')
    const barisHeader = [...res.headers.entries()]
      .filter(([k]) => !HEADER_RAHASIA.test(k))
      .map(([k, v]) => `${k}: ${truncate(v, 120)}`)
      .join('\\n')

    /* ---------- mode head ---------- */
    if (u.opsi.has('head') || u.opsi.has('header')) {
      return m.reply(
        `🌐 *CURL — ${u.method} ${truncate(u.url, 70)}*\\n\\n` +
        `*Status:* ${res.status} ${res.statusText || ''}\\n` +
        `*Waktu:* ${ms} ms${panjang ? ` · *Ukuran:* ${Number(panjang).toLocaleString('id-ID')} B` : ''}\\n\\n` +
        `*Header:*\\n\`\`\`${truncate(barisHeader || '(tidak ada)', 1200)}\`\`\``
      )
    }

    /* ---------- mode file ---------- */
    if (u.opsi.has('file') || u.opsi.has('unduh') || u.opsi.has('download')) {
      if (panjang && Number(panjang) > MAKS_UNDUH) {
        return m.reply(`❌ Terlalu besar: ${(Number(panjang) / 1048576).toFixed(1)} MB (maks ${MAKS_UNDUH / 1048576} MB).\\nPakai tanpa \`file\` untuk melihat isinya sebagai teks.`)
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > MAKS_UNDUH) {
        return m.reply(`❌ Terlalu besar: ${(buf.length / 1048576).toFixed(1)} MB (maks ${MAKS_UNDUH / 1048576} MB).`)
      }
      const nama = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || 'unduhan.bin')
      return m.sock.sendMessage(m.jid, {
        document: buf,
        mimetype: tipe.split(';')[0] || 'application/octet-stream',
        fileName: nama,
        caption: `🌐 *${res.status}* · ${ms} ms · ${buf.length.toLocaleString('id-ID')} B\\n${truncate(u.url, 120)}`
      }).catch(() => m.reply('❌ Gagal mengirim file (mungkin tipe tidak didukung).'))
    }

    /* ---------- mode teks ---------- */
    const mentah = await res.text()
    const isi = u.opsi.has('raw') ? mentah : rapikan(mentah, tipe)
    const dipotong = isi.length > MAKS_TAMPIL
    const badan =
      `🌐 *CURL — ${u.method} ${truncate(u.url, 70)}*\\n\\n` +
      `*Status:* ${res.status} ${res.statusText || ''} · *Waktu:* ${ms} ms\\n` +
      `*Tipe:* ${tipe || '(tidak ada)'} · *Panjang:* ${isi.length.toLocaleString('id-ID')} karakter\\n\\n` +
      `\`\`\`${truncate(isi, MAKS_TAMPIL)}\`\`\`` +
      (dipotong ? `\\n\\n⚠️ Dipotong dari ${isi.length.toLocaleString('id-ID')} karakter. Kirim dengan \`| file\` untuk unduh penuh.` : '')

    return m.sendButtons({
      title: `🌐 ${res.status} ${res.statusText || ''}`.trim(),
      text: badan,
      footer: config.bot.footer,
      buttons: [
        { text: '🔁 Ulangi', id: `${P}curl ${truncate(u.url, 60)}` },
        { text: '📋 Header saja', id: `${P}curl ${truncate(u.url, 55)} | head` },
        { text: '📄 Unduh file', id: `${P}curl ${truncate(u.url, 55)} | file` }
      ]
    }).catch(() => m.reply(badan))
  }
}

export default { curlCmd }
