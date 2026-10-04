/**
 * 🌐 NETLAB — 52 fitur jaringan/internet (kategori Internet, v6)
 * ------------------------------------------------------------
 *  DNS (A/AAAA/MX/TXT/NS/SOA/CNAME/PTR), ping TCP, cek port,
 *  port scan, info sertifikat SSL, whois (port 43), kalkulator
 *  IP/subnet/CIDR, parse URL, header HTTP, favicon, robots.txt,
 *  og-tags, shortlink, cek email/domain, speedtest, IP publik & geo.
 *
 *  Semua pakai modul bawaan Node (dns/net/tls/http) + API publik,
 *  jadi tetap jalan di Termux tanpa paket tambahan.
 */
import dns from 'node:dns'
import net from 'node:net'
import tls from 'node:tls'
import { URL } from 'node:url'
import { config } from '../config.js'
import { getJSON, getBuffer, truncate, formatSize } from '../lib/functions.js'

const P = config.display.prefix
const dnsP = dns.promises

/* ------------------------- helper ------------------------- */
const need = (m, contoh) => {
  if (!m.q) { m.reply(`Butuh input.\nContoh: ${P}${m.command} ${contoh}`); return null }
  return m.q.trim()
}
const withTimeout = (promise, ms = 12000, label = 'waktu habis') =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(label)), ms).unref?.())])

const cleanHost = q => String(q).replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
const isDomain = q => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(q)

async function tcpCheck (host, port, timeout = 6000) {
  return new Promise(resolve => {
    const t0 = Date.now()
    const s = new net.Socket()
    let done = false
    const fin = (open, ms) => { if (!done) { done = true; s.destroy(); resolve({ open, ms }) } }
    s.setTimeout(timeout)
    s.once('connect', () => fin(true, Date.now() - t0))
    s.once('timeout', () => fin(false, timeout))
    s.once('error', () => fin(false, Date.now() - t0))
    s.connect(port, host)
  })
}

async function fetchUrl (url, opt = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), opt.timeout || 20000)
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: opt.redirect ?? 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) therYHNN-Bot/6.0', ...opt.headers } })
    return r
  } finally { clearTimeout(t) }
}

const PORTS = {
  20: 'FTP-Data', 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 67: 'DHCP', 69: 'TFTP',
  80: 'HTTP', 110: 'POP3', 119: 'NNTP', 123: 'NTP', 135: 'RPC/MS', 137: 'NetBIOS', 139: 'NetBIOS',
  143: 'IMAP', 161: 'SNMP', 389: 'LDAP', 443: 'HTTPS', 445: 'SMB', 465: 'SMTPS', 514: 'Syslog',
  587: 'SMTP Submission', 636: 'LDAPS', 873: 'Rsync', 990: 'FTPS', 993: 'IMAPS', 995: 'POP3S',
  1080: 'SOCKS Proxy', 1433: 'MSSQL', 1521: 'Oracle DB', 1723: 'PPTP', 2049: 'NFS', 2082: 'cPanel',
  2083: 'cPanel SSL', 2086: 'WHM', 2087: 'WHM SSL', 3000: 'Dev Server', 3306: 'MySQL', 3389: 'RDP',
  4444: 'Metasploit', 5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis', 6667: 'IRC', 7000: 'Cassandra',
  8000: 'HTTP-Alt', 8080: 'HTTP-Proxy', 8081: 'HTTP-Alt', 8443: 'HTTPS-Alt', 8888: 'HTTP-Alt',
  9000: 'PHP-FPM/SonarQube', 9200: 'Elasticsearch', 11211: 'Memcached', 27017: 'MongoDB', 50000: 'SAP'
}

function cidrCalc (cidr) {
  const [ip, bitsRaw] = cidr.split('/')
  const bits = Number(bitsRaw)
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) throw new Error('IP tidak valid')
  if (isNaN(bits) || bits < 0 || bits > 32) throw new Error('Prefix harus 0-32')
  const int = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  const network = (int & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const toIp = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
  const hosts = bits >= 31 ? (bits === 32 ? 1 : 2) : Math.pow(2, 32 - bits) - 2
  return {
    ip: toIp(int), bits, mask: toIp(mask), network: toIp(network), broadcast: toIp(broadcast),
    first: bits >= 31 ? toIp(network) : toIp(network + 1),
    last: bits >= 31 ? toIp(broadcast) : toIp(broadcast - 1),
    hosts, wildcard: toIp((~mask >>> 0)),
    kelas: parts[0] < 128 ? 'A' : parts[0] < 192 ? 'B' : parts[0] < 224 ? 'C' : parts[0] < 240 ? 'D' : 'E',
    privat: (parts[0] === 10) || (parts[0] === 127) || (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 169 && parts[1] === 254)
  }
}

const ok = (s, x) => `✅ ${s}: ${x}`

/* ------------------------- perintah ------------------------- */
const netCmd = (command, aliases, description, run, contoh) => ({
  command: [command, ...aliases],
  category: 'Internet',
  description,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    try { return await run(m) } catch (e) {
      const msg = String(e.message || e)
      if (/abort|waktu habis|timeout/i.test(msg)) return m.reply(`⏱️ Server tidak merespons dalam waktu yang ditentukan.\nCoba lagi atau periksa nama domain/URL.`)
      return m.reply(`⚠️ ${truncate(msg, 200)}`)
    }
  }
})

export const netlabCmds = [
  /* ============ DNS ============ */
  netCmd('dns', ['dnslookup', 'nslookup'], 'Lookup DNS lengkap (A, AAAA, NS, MX, TXT)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const R = new dnsP.Resolver(); R.setServers(['8.8.8.8', '1.1.1.1'])
    const [a, aaaa, ns, mx, txt, soa] = await withTimeout(Promise.all([
      R.resolve4(host).catch(() => []), R.resolve6(host).catch(() => []),
      R.resolveNs(host).catch(() => []), R.resolveMx(host).catch(() => []),
      R.resolveTxt(host).catch(() => []), R.resolveSoa(host).catch(() => null)
    ]), 15000)
    if (!a.length && !aaaa.length && !ns.length) return m.reply(`❌ Domain \`${host}\` tidak ditemukan (NXDOMAIN).`)
    return m.reply(`🌐 *DNS LOOKUP — ${host}*\n\n` +
      `▸ *A (IPv4):*\n${a.map(x => `   ${x}`).join('\n') || '   -'}\n` +
      `▸ *AAAA (IPv6):*\n${aaaa.slice(0, 4).map(x => `   ${x}`).join('\n') || '   -'}\n` +
      `▸ *NS:*\n${ns.slice(0, 6).map(x => `   ${x}`).join('\n') || '   -'}\n` +
      `▸ *MX (mail):*\n${mx.slice(0, 5).map(x => `   ${x.priority} ${x.exchange}`).join('\n') || '   -'}\n` +
      `▸ *SOA:* ${soa ? `${soa.nsname} (serial ${soa.serial}, refresh ${soa.refresh}s)` : '-'}\n` +
      `▸ *TXT:* ${txt.length ? truncate(txt.map(t => t.join('')).join(' | '), 400) : '-'}`)
  }, 'example.com'),

  netCmd('dnsa', ['resolvea', 'ipv4'], 'Resolve DNS record A (IPv4)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const addrs = await withTimeout(dnsP.resolve4(host, { ttl: true }))
    return m.reply(`🅰️ *A record ${host}*\n\n${addrs.map(a => `▸ ${a.address}  (TTL ${a.ttl}s)`).join('\n')}`)
  }, 'example.com'),

  netCmd('dnsaaaa', ['resolveaaaa', 'ipv6'], 'Resolve DNS record AAAA (IPv6)', async m => {
    const q = need(m, 'google.com'); if (!q) return
    const host = cleanHost(q)
    const addrs = await withTimeout(dnsP.resolve6(host, { ttl: true }))
    return m.reply(`🔢 *AAAA record ${host}*\n\n${addrs.map(a => `▸ ${a.address}  (TTL ${a.ttl}s)`).join('\n') || '(tidak punya IPv6)'}`)
  }, 'google.com'),

  netCmd('dnsmx', ['resolvemx', 'mailserver'], 'Resolve MX (server email domain)', async m => {
    const q = need(m, 'gmail.com'); if (!q) return
    const host = cleanHost(q)
    const mx = await withTimeout(dnsP.resolveMx(host))
    return m.reply(`📧 *MX ${host}*\n\n${mx.sort((a, b) => a.priority - b.priority).map(x => `▸ prioritas ${x.priority} → ${x.exchange}`).join('\n')}`)
  }, 'gmail.com'),

  netCmd('dnstxt', ['resolvetxt', 'spf'], 'Resolve TXT (SPF/DKIM/verifikasi)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const txt = await withTimeout(dnsP.resolveTxt(host))
    return m.reply(`📝 *TXT ${host}*\n\n${txt.map(t => `▸ ${t.join('')}`).join('\n').slice(0, 3000)}`)
  }, 'example.com'),

  netCmd('dnsns', ['resolvens', 'nameserver'], 'Resolve NS (nameserver)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const ns = await withTimeout(dnsP.resolveNs(host))
    return m.reply(`🖥️ *NS ${host}*\n\n${ns.map(x => `▸ ${x}`).join('\n')}`)
  }, 'example.com'),

  netCmd('dnscname', ['resolvecname', 'alias'], 'Resolve CNAME (alias domain)', async m => {
    const q = need(m, 'www.wikipedia.org'); if (!q) return
    const host = q.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const c = await dnsP.resolveCname(host).catch(e => { throw new Error(/ENODATA|ENOTFOUND/.test(e.code || e.message) ? `Domain ${host} tidak punya record CNAME (langsung menunjuk IP).` : e.message) })
    return m.reply(`🔗 *CNAME ${host}*\n\n${c.map(x => `▸ ${x}`).join('\n')}`)
  }, 'www.wikipedia.org'),

  netCmd('dnssoa', ['resolvesoa'], 'Resolve SOA (otoritas zona)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const s = await withTimeout(dnsP.resolveSoa(host))
    return m.reply(`📋 *SOA ${host}*\n\nNS utama : ${s.nsname}\nEmail admin: ${s.hostmaster}\nSerial   : ${s.serial}\nRefresh  : ${s.refresh}s\nRetry    : ${s.retry}s\nExpire   : ${s.expire}s\nMin TTL  : ${s.minttl}s`)
  }, 'example.com'),

  netCmd('dnsptr', ['reverseip', 'ptrdns'], 'Reverse DNS: IP → nama domain', async m => {
    const q = need(m, '8.8.8.8'); if (!q) return
    const host = cleanHost(q)
    const names = await withTimeout(dnsP.reverse(host))
    return m.reply(`↩️ *Reverse DNS*\n\n${host} →\n${names.map(n => `▸ ${n}`).join('\n') || '(tidak ada PTR record)'}`)
  }, '8.8.8.8'),

  netCmd('dnspublik', ['dnskustom'], 'Resolve lewat DNS publik tertentu: .dnspublik <domain> [server]', async m => {
    const host = cleanHost(m.args[0] || m.q || 'example.com')
    const server = (m.args[1] || '1.1.1.1').trim()
    const R = new dnsP.Resolver(); R.setServers([server])
    const t0 = Date.now()
    const addrs = await withTimeout(R.resolve4(host), 10000)
    return m.reply(`🌍 *DNS via ${server}*\n\nDomain: ${host}\nHasil : ${addrs.join(', ')}\nWaktu : ${Date.now() - t0} ms\n\nServer populer: 1.1.1.1 (Cloudflare), 8.8.8.8 (Google), 9.9.9.9 (Quad9)`)
  }, 'example.com 8.8.8.8'),

  netCmd('resolveip', ['iptoip', 'lookupip'], 'Resolve nama host → IP (sistem)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const { address, family } = await withTimeout(dnsP.lookup(host))
    return m.reply(`🔎 ${host} → *${address}* (IPv${family})`)
  }, 'example.com'),

  /* ============ KONEKTIVITAS ============ */
  netCmd('pinghost', ['pingtcp', 'cekping'], 'Ping TCP (ukur latency koneksi ke host)', async m => {
    const q = need(m, 'google.com'); if (!q) return
    const host = cleanHost(q)
    const port = Number(m.args[1]) || (/^https:/.test(q) ? 443 : 443)
    const hasil = []
    for (let i = 0; i < 4; i++) hasil.push(await tcpCheck(host, port, 5000))
    const okc = hasil.filter(h => h.open)
    if (!okc.length) return m.reply(`❌ ${host}:${port} tidak merespons (host mati / port ditutup / diblokir firewall).`)
    const ms = okc.map(h => h.ms)
    const avg = ms.reduce((a, b) => a + b, 0) / ms.length
    return m.reply(`📶 *PING TCP ${host}:${port}*\n\nTerkirim : 4\nDiterima : ${okc.length} (loss ${Math.round((1 - okc.length / 4) * 100)}%)\nMin/Rata²/Maks: ${Math.min(...ms)} / ${avg.toFixed(1)} / ${Math.max(...ms)} ms\n\nKualitas: ${avg < 60 ? '🟢 Sangat baik' : avg < 150 ? '🟡 Baik' : '🔴 Lambat'}`)
  }, 'google.com'),

  netCmd('portcheck', ['cekport', 'port'], 'Cek satu port terbuka/tertutup', async m => {
    const host = cleanHost(m.args[0] || m.q || '')
    const port = Number(m.args[1] ?? m.args[0])
    if (!host || !port) return m.reply(`Contoh: ${P}portcheck example.com 443`)
    const r = await tcpCheck(host, port, 8000)
    return m.reply(`${r.open ? '🟢 TERBUKA' : '🔴 TERTUTUP'} — ${host}:${port} (${PORTS[port] || 'port tak dikenal'})${r.open ? ` · ${r.ms} ms` : ''}`)
  }, 'example.com 443'),

  netCmd('portscan', ['scanport'], 'Scan port umum pada host (≤20 port)', async m => {
    const host = cleanHost(m.q || '')
    if (!host || !isDomain(host) && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) return m.reply(`Contoh: ${P}portscan example.com`)
    const list = Object.keys(PORTS).slice(0, 20).map(Number)
    await m.reply(`🔍 Scanning ${list.length} port di *${host}*...`)
    const hasil = await Promise.all(list.map(async p => ({ p, ...(await tcpCheck(host, p, 4000)) })))
    const open = hasil.filter(h => h.open)
    return m.reply(`🛡️ *PORT SCAN ${host}*\n\nTerbuka (${open.length}/${list.length}):\n${open.map(h => `▸ 🟢 ${h.p} — ${PORTS[h.p]} (${h.ms} ms)`).join('\n') || '(tidak ada)'}\n\nTertutup:\n${hasil.filter(h => !h.open).map(h => `▸ 🔴 ${h.p} ${PORTS[h.p]}`).join('\n').slice(0, 700)}`)
  }, 'example.com'),

  netCmd('sslinfo', ['cekssl', 'sertifikat'], 'Info sertifikat SSL/TLS sebuah domain', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const info = await withTimeout(new Promise((res, rej) => {
      const t0 = Date.now()
      const s = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 10000 }, () => {
        const c = s.getPeerCertificate()
        const ms = Date.now() - t0
        s.end()
        if (!c || !c.subject) return rej(new Error('Sertifikat tidak tersedia'))
        res({ c, ms, proto: s.getProtocol?.(), cipher: s.getCipher?.() })
      })
      s.on('timeout', () => { s.destroy(); rej(new Error('timeout')) })
      s.on('error', e => rej(e))
    }), 15000)
    const c = info.c
    const validFrom = new Date(c.valid_from), validTo = new Date(c.valid_to)
    const sisa = Math.floor((validTo - Date.now()) / 86400000)
    return m.reply(`🔐 *SSL ${host}*\n\nDiterbitkan untuk : ${c.subject.CN}\nOrganisasi        : ${c.subject.O || '-'}\nPenerbit          : ${c.issuer?.CN || c.issuer?.O || '-'}\nBerlaku           : ${validFrom.toLocaleDateString('id-ID')} → ${validTo.toLocaleDateString('id-ID')}\nSisa              : *${sisa} hari* ${sisa > 30 ? '🟢' : sisa > 7 ? '🟡' : '🔴'}\nVersi TLS         : ${info.proto}\nCipher            : ${info.cipher?.name || '-'}\nSAN               : ${truncate((c.subjectaltname || '-').replace(/DNS:/g, ''), 200)}\nHandshake         : ${info.ms} ms`)
  }, 'example.com'),

  netCmd('whois', [], 'Data WHOIS domain (registrar, tanggal, nameserver)', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    if (!isDomain(host)) return m.reply('⚠️ Nama domain tidak valid.')
    const query = (server, domain) => withTimeout(new Promise((res, rej) => {
      let data = ''
      const s = net.connect(43, server, () => s.write(domain + '\r\n'))
      s.setTimeout(10000)
      s.on('data', d => { data += d.toString() })
      s.on('end', () => res(data))
      s.on('timeout', () => { s.destroy(); rej(new Error('timeout')) })
      s.on('error', rej)
    }), 12000)
    let txt = await query('whois.iana.org', host)
    const mRef = txt.match(/refer:\s*(\S+)/i)
    if (mRef) txt = await query(mRef[1], host).catch(() => txt)
    const pick = k => (txt.match(new RegExp(`^${k}:\\s*(.+)$`, 'im')) || [])[1]?.trim()
    const ambil = keys => { for (const k of keys) { const v = pick(k); if (v) return v } return '-' }
    return m.reply(`📇 *WHOIS ${host}*\n\nRegistrar   : ${ambil(['Registrar', 'registrar', 'Registrar Name'])}\nDibuat      : ${ambil(['Creation Date', 'created', 'Registration Time'])}\nKedaluwarsa : ${ambil(['Registry Expiry Date', 'Expir', 'paid-till'])}\nUpdate      : ${ambil(['Updated Date', 'last-modified', 'changed'])}\nStatus      : ${ambil(['Domain Status', 'status'])}\nNameserver  : ${ambil(['Name Server', 'nserver'])}\n\n${truncate(txt.replace(/\r/g, '').split('\n').filter(l => /%/i.test(l) === false).slice(0, 12).join('\n'), 600)}`)
  }, 'example.com'),

  netCmd('isup', ['cekup', 'hidupkah'], 'Cek situs hidup/mati + waktu respons', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const t0 = Date.now()
    const r = await fetchUrl(url, { timeout: 15000 })
    return m.reply(`${r.ok ? '🟢 HIDUP' : '🟡 MERESPONS'} — ${url}\n\nStatus : ${r.status} ${r.statusText}\nWaktu  : ${Date.now() - t0} ms\nServer : ${r.headers.get('server') || '-'}`)
  }, 'https://example.com'),

  netCmd('speedtest', ['cekspeed', 'teskecepatan'], 'Ukur kecepatan unduh (server Cloudflare)', async m => {
    await m.reply('⏱️ Mengukur kecepatan unduh (2 MB)...')
    const sumber = ['https://speed.cloudflare.com/__down?bytes=2000000', 'https://proof.ovh.net/files/1Mb.dat']
    let best = null
    for (const u of sumber) {
      try {
        const t0 = Date.now()
        const r = await fetchUrl(u, { timeout: 25000 })
        if (!r.ok) continue
        const buf = await r.arrayBuffer()
        const dt = (Date.now() - t0) / 1000
        const mbps = (buf.byteLength * 8) / dt / 1e6
        if (!best || mbps > best.mbps) best = { mbps, bytes: buf.byteLength, dt, u }
      } catch { /* coba sumber berikutnya */ }
    }
    if (!best) return m.reply('❌ Tidak bisa mengukur: semua server uji tidak terjangkau.')
    return m.reply(`🚀 *SPEEDTEST (unduh)*\n\nKecepatan : *${best.mbps.toFixed(2)} Mbps* (${(best.mbps / 8).toFixed(2)} MB/s)\nData      : ${formatSize(best.bytes)}\nWaktu     : ${best.dt.toFixed(2)} detik\nServer    : ${new URL(best.u).host}\n\nKualitas: ${best.mbps > 50 ? '🟢 Sangat cepat' : best.mbps > 10 ? '🟡 Cukup' : '🔴 Lambat'}`)
  }, '1'),

  /* ============ URL & HTTP ============ */
  netCmd('urlparse', ['bedahurl', 'parseurl'], 'Bedah komponen sebuah URL', async m => {
    const q = need(m, 'https://user:pass@sub.example.com:8080/path?a=1&b=2#bagian'); if (!q) return
    const u = new URL(/^https?:/.test(q) ? q : 'https://' + q)
    return m.reply(`🔗 *BEDAH URL*\n\nProtokol : ${u.protocol}\nHost     : ${u.hostname}\nPort     : ${u.port || '(default)'}\nPath     : ${u.pathname || '/'}\nQuery    : ${u.search || '-'}\nHash     : ${u.hash || '-'}\nUsername : ${u.username || '-'}\nPassword : ${u.password ? '••••' : '-'}\nOrigin   : ${u.origin}\n\n*Parameter:*\n${[...u.searchParams].map(([k, v]) => `▸ ${k} = ${v}`).join('\n') || '(tidak ada)'}`)
  }, 'https://example.com/path?a=1'),

  netCmd('urljoin', ['gaburl'], 'Gabungkan URL dasar + path', async m => {
    const [base, ...rest] = (m.q || '').split(/\s+/)
    if (!base || !rest.length) return m.reply(`Contoh: ${P}urljoin https://example.com/api /user?id=1`)
    return m.reply(`Hasil: \`${new URL(rest.join(' '), base).href}\``)
  }, 'https://example.com /api/user'),

  netCmd('httpcode', ['kodehttp', 'statushttp'], 'Ambil status code + header utama sebuah URL', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const t0 = Date.now()
    const r = await fetchUrl(url, { timeout: 15000 })
    const h = r.headers
    return m.reply(`📡 *HTTP ${r.status} ${r.statusText}*\n\nURL         : ${r.url}\nWaktu       : ${Date.now() - t0} ms\nContent-Type: ${h.get('content-type') || '-'}\nUkuran      : ${h.get('content-length') ? formatSize(Number(h.get('content-length'))) : '-'}\nServer      : ${h.get('server') || '-'}\nCache       : ${h.get('cache-control') || '-'}\nKeamanan    : ${h.get('strict-transport-security') ? '✅ HSTS aktif' : '❌ tanpa HSTS'}\nCORS        : ${h.get('access-control-allow-origin') || 'tidak diizinkan'}`)
  }, 'https://example.com'),

  netCmd('httpbody', ['gethtml', 'sumberweb'], 'Ambil isi HTML/teks sebuah URL (maks 3000 karakter)', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 20000 })
    const body = await r.text()
    return m.reply(`📄 *ISI ${r.url}* (${formatSize(body.length)})\n\n\`\`\`html\n${truncate(body.replace(/\s+\n/g, '\n'), 3000)}\n\`\`\``)
  }, 'https://example.com'),

  netCmd('httpredirect', ['redirectchain', 'jejakurl'], 'Ikuti rantai redirect sebuah URL', async m => {
    const q = need(m, 'https://bit.ly/3WvQmXy'); if (!q) return
    let url = /^https?:/.test(q) ? q : 'https://' + q
    const jejak = []
    for (let i = 0; i < 8; i++) {
      const r = await fetchUrl(url, { redirect: 'manual', timeout: 12000 })
      jejak.push(`${r.status} ${url}`)
      const loc = r.headers.get('location')
      if (!loc || (r.status >= 200 && r.status < 300)) break
      url = new URL(loc, url).href
    }
    return m.reply(`🔀 *RANTAI REDIRECT*\n\n${jejak.map((j, i) => `${i + 1}. ${j}`).join('\n')}\n\nTotal lompatan: ${Math.max(0, jejak.length - 1)}`)
  }, 'https://bit.ly/3WvQmXy'),

  netCmd('mimetype', ['tipefile'], 'Deteksi tipe file (MIME) dari URL', async m => {
    const q = need(m, 'https://example.com/foto.jpg'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000 })
    const head = Buffer.from(await r.arrayBuffer()).slice(0, 12)
    const magic = head.toString('hex')
    let tebak = 'tidak dikenal'
    if (magic.startsWith('ffd8ff')) tebak = 'JPEG'
    else if (magic.startsWith('89504e47')) tebak = 'PNG'
    else if (magic.startsWith('47494638')) tebak = 'GIF'
    else if (magic.startsWith('25504446')) tebak = 'PDF'
    else if (magic.startsWith('504b0304')) tebak = 'ZIP/APK/DOCX'
    else if (magic.startsWith('1a45dfa3')) tebak = 'WEBM/MKV'
    else if (magic.startsWith('494433') || magic.startsWith('fff3')) tebak = 'MP3'
    else if (magic.startsWith('00000018') || magic.startsWith('00000020')) tebak = 'MP4'
    else if (magic.startsWith('52696666')) tebak = 'WAV/WEBP/AVI (RIFF)'
    return m.reply(`🗂️ *TIPE FILE*\n\nURL        : ${url}\nMIME (hdr) : ${r.headers.get('content-type') || '-'}\nUkuran     : ${r.headers.get('content-length') ? formatSize(Number(r.headers.get('content-length'))) : '-'}\nMagic bytes: ${magic.slice(0, 16)}\nTerdeteksi : *${tebak}*`)
  }, 'https://example.com/a.jpg'),

  netCmd('filesize', ['ukuranfile'], 'Cek ukuran file dari URL (HEAD request)', async m => {
    const q = need(m, 'https://example.com/file.zip'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000 })
    const len = r.headers.get('content-length')
    return m.reply(`📦 *UKURAN FILE*\n\nURL    : ${url}\nUkuran : ${len ? formatSize(Number(len)) : 'tidak diberitahukan server (chunked)'}\nTipe   : ${r.headers.get('content-type') || '-'}\nSupport resume: ${r.headers.get('accept-ranges') === 'bytes' ? '✅ ya' : '❌ tidak'}`)
  }, 'https://example.com/a.jpg'),

  netCmd('favicon', ['ikonweb'], 'Ambil favicon sebuah situs', async m => {
    const q = need(m, 'github.com'); if (!q) return
    const host = cleanHost(q)
    const sz = Number(m.args[1]) || 128
    const buf = await getBuffer(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${sz}`, { timeout: 20000 })
    return m.sendImage(buf, `🖼️ Favicon ${host} (${sz}px)`)
  }, 'github.com'),

  netCmd('robotstxt', ['robots'], 'Lihat robots.txt sebuah situs', async m => {
    const q = need(m, 'google.com'); if (!q) return
    const host = cleanHost(q)
    const r = await fetchUrl(`https://${host}/robots.txt`, { timeout: 15000 })
    if (r.status === 404) return m.reply(`ℹ️ ${host} tidak punya robots.txt (semua halaman boleh dirayapi).`)
    const t = await r.text()
    return m.reply(`🤖 *robots.txt ${host}*\n\n\`\`\`\n${truncate(t, 3000)}\n\`\`\``)
  }, 'google.com'),

  netCmd('oginfo', ['opengraph', 'metaweb'], 'Ambil metadata Open Graph / judul & deskripsi situs', async m => {
    const q = need(m, 'https://github.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 20000 })
    const html = await r.text()
    const grab = (re) => (html.match(re) || [])[1]?.replace(/&amp;/g, '&').trim()
    const og = (p) => grab(new RegExp(`<meta[^>]+property=["']og:${p}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      grab(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${p}["']`, 'i'))
    const title = og('title') || grab(/<title[^>]*>([^<]+)<\/title>/i) || '-'
    const desc = og('description') || grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || '-'
    return m.reply(`🏷️ *OPEN GRAPH*\n\nJudul    : ${title}\nDeskripsi: ${truncate(desc, 400)}\nGambar   : ${og('image') || '-'}\nURL      : ${og('url') || url}\nTipe     : ${og('type') || 'website'}\nSitus    : ${og('site_name') || '-'}` +
      (og('image') ? '' : ''))
  }, 'https://github.com'),

  netCmd('webinfo', ['infohalaman'], 'Ringkasan halaman: judul, jumlah kata, gambar, link', async m => {
    const q = need(m, 'https://id.wikipedia.org/wiki/Jakarta'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 20000 })
    const html = await r.text()
    const teks = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const imgs = (html.match(/<img[^>]+src=/gi) || []).length
    const links = (html.match(/<a[^>]+href=/gi) || []).length
    const h = [...html.matchAll(/<h([1-3])[^>]*>(.*?)<\/h\1>/gis)].slice(0, 8).map(x => `H${x[1]}. ${x[2].replace(/<[^>]+>/g, '').trim().slice(0, 70)}`)
    return m.reply(`📰 *INFO HALAMAN*\n\nURL      : ${r.url}\nStatus   : ${r.status}\nUkuran   : ${formatSize(html.length)}\nJudul    : ${(html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '-'}\nKata     : ${teks.split(' ').length.toLocaleString('id-ID')}\nGambar   : ${imgs}\nLink     : ${links}\nBahasa   : ${(html.match(/<html[^>]+lang=["']([^"']+)/i) || [])[1] || '-'}\n\n*Heading:*\n${h.join('\n') || '-'}`)
  }, 'https://id.wikipedia.org/wiki/Jakarta'),

  netCmd('shortlink', ['pendekinurl', 'tinyurl'], 'Perpendek URL (TinyURL)', async m => {
    const q = need(m, 'https://example.com/halaman-yang-sangat-panjang-sekali'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 15000 })
    const short = (await r.text()).trim()
    if (!short.startsWith('http')) throw new Error('Gagal memperpendek URL')
    return m.reply(`🔗 *URL DIPERPENDEK*\n\nAsli  : ${truncate(url, 300)}\n\nPendek: *${short}*\nPanjang: ${url.length} → ${short.length} karakter`)
  }, 'https://example.com'),

  /* ============ IP ============ */
  netCmd('ipku', ['myip', 'ippublik'], 'Lihat IP publik + lokasi bot ini', async m => {
    const r = await fetchUrl('http://ip-api.com/json/?lang=id&fields=status,country,regionName,city,isp,org,as,timezone,query,lat,lon', { timeout: 15000 })
    const j = await r.json()
    if (j.status !== 'success') throw new Error('Layanan IP tidak merespons')
    return m.reply(`🌐 *IP PUBLIK*\n\nIP       : *${j.query}*\nNegara   : ${j.country}\nWilayah  : ${j.regionName}\nKota     : ${j.city}\nISP      : ${j.isp}\nOrganisasi: ${j.org}\nAS       : ${j.as}\nZona waktu: ${j.timezone}\nKoordinat: ${j.lat}, ${j.lon}`)
  }, '1'),

  netCmd('ipgeo', ['lokasiip', 'ipinfo'], 'Lacak lokasi & ISP sebuah IP', async m => {
    const q = need(m, '8.8.8.8'); if (!q) return
    const ip = cleanHost(q)
    const j = await getJSON(`http://ip-api.com/json/${encodeURIComponent(ip)}?lang=id`)
    if (j.status !== 'success') return m.reply(`❌ ${j.message || 'IP tidak dikenali'}`)
    return m.reply(`📍 *INFO IP ${ip}*\n\nNegara  : ${j.country} (${j.countryCode})\nWilayah : ${j.regionName} (${j.region})\nKota    : ${j.city}\nKode pos: ${j.zip || '-'}\nKoordinat: ${j.lat}, ${j.lon}\nZona waktu: ${j.timezone}\nISP     : ${j.isp}\nOrganisasi: ${j.org}\nAS      : ${j.as}\nTipe    : ${j.mobile ? '📱 Seluler' : j.proxy ? '🕶️ Proxy' : j.hosting ? '🖥️ Hosting/DC' : '🏠 Residensial'}\n\nPeta: https://www.google.com/maps?q=${j.lat},${j.lon}`)
  }, '8.8.8.8'),

  netCmd('ipcalc', ['cidr', 'subnet'], 'Kalkulator IP/CIDR: network, broadcast, jumlah host', async m => {
    const q = need(m, '192.168.1.0/24'); if (!q) return
    const c = cidrCalc(q.includes('/') ? q : q + '/32')
    return m.reply(`🧮 *KALKULATOR IP*\n\nInput      : ${q}\nKelas      : ${c.kelas}${c.privat ? ' (privat/RFC1918)' : ' (publik)'}\n\nNetwork    : ${c.network}/${c.bits}\nNetmask    : ${c.mask}\nWildcard   : ${c.wildcard}\nBroadcast  : ${c.broadcast}\nHost pertama: ${c.first}\nHost terakhir: ${c.last}\nTotal host : *${c.hosts.toLocaleString('id-ID')}*\n\nBinari IP  : ${c.ip.split('.').map(x => Number(x).toString(2).padStart(8, '0')).join('.')}`)
  }, '192.168.1.0/24'),

  netCmd('subnetting', ['bagisubnet'], 'Pecah jaringan jadi beberapa subnet: .subnetting 192.168.1.0/24 4', async m => {
    const cidr = m.args[0] || m.q
    const jumlah = Math.min(32, Math.max(2, Number(m.args[1] ?? m.q) || 4))
    if (!cidr || !cidr.includes('/')) return m.reply(`Contoh: ${P}subnetting 192.168.1.0/24 4`)
    const base = cidrCalc(cidr)
    const needBits = Math.ceil(Math.log2(jumlah))
    const newBits = base.bits + needBits
    if (newBits > 30) return m.reply('⚠️ Subnet terlalu kecil untuk dibagi sebanyak itu.')
    const step = Math.pow(2, 32 - newBits)
    const toInt = ip => ip.split('.').reduce((a, o) => ((a << 8) + Number(o)) >>> 0, 0)
    const toIp = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
    const start = toInt(base.network)
    const jumlah2 = Math.pow(2, needBits)
    const rows = Array.from({ length: Math.min(jumlah2, 12) }, (_, i) => {
      const n = (start + i * step) >>> 0
      return `${i + 1}. ${toIp(n)}/${newBits} → host ${toIp(n + 1)}–${toIp(n + step - 2)} (${step - 2} host)`
    })
    return m.reply(`🧩 *SUBNETTING ${cidr} → ${jumlah2} subnet /${newBits}*\n\n${rows.join('\n')}${jumlah2 > 12 ? `\n... dan ${jumlah2 - 12} subnet lainnya` : ''}`)
  }, '192.168.1.0/24 4'),

  netCmd('ipacak', ['fakeip', 'randomip'], 'Buat IP acak (untuk uji coba)', async m => {
    const tipe = (m.args[0] || 'public').toLowerCase()
    const gen = () => tipe === 'private'
      ? `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
      : `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
    const list = Array.from({ length: 5 }, gen)
    return m.reply(`🎲 *IP ACAK (${tipe})*\n\n${list.map((ip, i) => `${i + 1}. \`${ip}\`  → ${P}ipgeo ${ip}`).join('\n')}`)
  }, 'public'),

  netCmd('portinfo', ['infoport'], 'Penjelasan sebuah nomor port', async m => {
    const q = need(m, '443'); if (!q) return
    const p = Number(q)
    if (isNaN(p) || p < 0 || p > 65535) return m.reply('⚠️ Port harus 0-65535.')
    const well = PORTS[p]
    const jenis = p === 0 ? 'Reserved' : p < 1024 ? 'Well-known (butuh root)' : p < 49152 ? 'Registered' : 'Dynamic/Private'
    return m.reply(`🔌 *PORT ${p}*\n\nNama umum : ${well || 'tidak terdaftar di daftar kami'}\nKategori  : ${jenis}\nProtokol  : ${[21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432].includes(p) ? 'TCP & UDP' : 'TCP (umumnya)'}\n\n💡 Port terkenal lain: 80 HTTP · 443 HTTPS · 22 SSH · 3306 MySQL · 5432 PostgreSQL`)
  }, '443'),

  /* ============ EMAIL & DOMAIN ============ */
  netCmd('emailcheck', ['cekemail'], 'Validasi format email + cek server MX-nya', async m => {
    const q = need(m, 'nama@gmail.com'); if (!q) return
    const email = q.trim()
    const valid = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)
    const domain = email.split('@')[1] || ''
    let mx = []
    if (domain) mx = await dnsP.resolveMx(domain).catch(() => [])
    const disposible = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com']
    return m.reply(`📮 *CEK EMAIL*\n\nEmail    : ${email}\nFormat   : ${valid ? '✅ valid' : '❌ tidak valid'}\nDomain   : ${domain}\nMX ada   : ${mx.length ? '✅ ya → ' + mx.sort((a, b) => a.priority - b.priority).slice(0, 3).map(x => x.exchange).join(', ') : '❌ tidak (email tidak bisa diterima)'}\nSekali pakai: ${disposible.includes(domain?.toLowerCase()) ? '⚠️ ya' : 'bukan'}\nPenyedia : ${/gmail/.test(domain) ? 'Google Workspace/Gmail' : /outlook|hotmail|live/.test(domain) ? 'Microsoft' : /yahoo/.test(domain) ? 'Yahoo' : /proton/.test(domain) ? 'ProtonMail' : 'lainnya'}`)
  }, 'nama@gmail.com'),

  netCmd('domaincheck', ['cekdomain'], 'Cek domain sudah terdaftar atau masih kosong', async m => {
    const q = need(m, 'contohdomainku123.com'); if (!q) return
    const host = cleanHost(q).replace(/^https?:\/\//, '')
    const base = host.split('.').length < 2 ? host + '.com' : host
    const [a, ns] = await Promise.all([dnsP.resolve4(base).catch(() => []), dnsP.resolveNs(base).catch(() => [])])
    const ada = a.length || ns.length
    return m.reply(`🔎 *CEK DOMAIN ${base}*\n\nStatus   : ${ada ? '🔴 SUDAH TERDAFTAR / dipakai' : '🟢 kemungkinan MASIH TERSEDIA'}\nDNS A    : ${a.join(', ') || '-'}\nNameserver: ${ns.slice(0, 4).join(', ') || '-'}\n\n⚠️ Kepastian hanya dari registrar. Cek harga: https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(base)}`)
  }, 'namabaru123.com'),

  netCmd('dnspropagation', ['cekpropagasi'], 'Cek propagasi DNS lewat beberapa resolver publik', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const servers = [['Google', '8.8.8.8'], ['Cloudflare', '1.1.1.1'], ['Quad9', '9.9.9.9'], ['OpenDNS', '208.67.222.222']]
    const hasil = await Promise.all(servers.map(async ([nama, ip]) => {
      const R = new dnsP.Resolver(); R.setServers([ip])
      const t0 = Date.now()
      try { const a = await withTimeout(R.resolve4(host), 8000); return { nama, ip, ok: a.join(', '), ms: Date.now() - t0 } } catch (e) { return { nama, ip, ok: null, ms: Date.now() - t0 } }
    }))
    const unik = new Set(hasil.filter(h => h.ok).map(h => h.ok))
    return m.reply(`🌍 *PROPAGASI DNS ${host}*\n\n${hasil.map(h => `${h.ok ? '✅' : '❌'} ${h.nama} (${h.ip}) → ${h.ok || 'gagal'} · ${h.ms} ms`).join('\n')}\n\nKesimpulan: ${unik.size <= 1 && hasil.every(h => h.ok) ? '🟢 sudah sinkron di semua resolver' : unik.size > 1 ? '🟡 masih berbeda antar resolver (sedang propagasi)' : '🔴 belum resolving'}`)
  }, 'example.com'),

  netCmd('dnsspeed', ['tesdns'], 'Bandingkan kecepatan resolver DNS publik', async m => {
    const host = cleanHost(m.args[0] || 'google.com')
    const servers = [['Cloudflare', '1.1.1.1'], ['Google', '8.8.8.8'], ['Quad9', '9.9.9.9'], ['AdGuard', '94.140.14.14']]
    const hasil = []
    for (const [nama, ip] of servers) {
      const R = new dnsP.Resolver(); R.setServers([ip])
      const t0 = Date.now()
      try { await withTimeout(R.resolve4(host), 6000); hasil.push({ nama, ip, ms: Date.now() - t0 }) } catch { hasil.push({ nama, ip, ms: null }) }
    }
    hasil.sort((a, b) => (a.ms ?? 1e9) - (b.ms ?? 1e9))
    return m.reply(`⚡ *KECEPATAN RESOLVER (${host})*\n\n${hasil.map((h, i) => `${i === 0 ? '🏆' : '▸'} ${h.nama} (${h.ip}): ${h.ms === null ? '❌ gagal' : h.ms + ' ms'}`).join('\n')}\n\nTercepat: *${hasil[0]?.nama || '-'}*`)
  }, 'google.com'),

  netCmd('useragent', ['randomua', 'fakeua'], 'Buat User-Agent acak (untuk scraping)', async m => {
    const os = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64', 'Linux; Android 13; SM-A536B', 'iPhone; CPU iPhone OS 17_2 like Mac OS X']
    const chrome = `${120 + Math.floor(Math.random() * 12)}.0.0.0`
    const list = Array.from({ length: 4 }, () => {
      const o = os[Math.floor(Math.random() * os.length)]
      return /iPhone|Android/.test(o)
        ? `Mozilla/5.0 (${o}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1`
        : `Mozilla/5.0 (${o}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chrome} Safari/537.36`
    })
    return m.reply(`🕶️ *USER-AGENT ACAK*\n\n${list.map((u, i) => `${i + 1}. \`${u}\``).join('\n\n')}`)
  }, '1'),

  netCmd('httpmethod', ['cekmethod'], 'Cek metode HTTP yang diizinkan sebuah URL', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000, headers: { 'Access-Control-Request-Method': 'POST' }, redirect: 'follow' })
    const allow = r.headers.get('allow') || r.headers.get('access-control-allow-methods')
    const hasil = []
    for (const meth of ['GET', 'HEAD', 'OPTIONS']) {
      try { const rr = await fetch(url, { method: meth, redirect: 'follow' }); hasil.push(`${rr.ok ? '✅' : '⚠️'} ${meth} → ${rr.status}`) } catch { hasil.push(`❌ ${meth} → gagal`) }
    }
    return m.reply(`🧪 *METODE HTTP ${url}*\n\n${hasil.join('\n')}\nAllow header: ${allow || '(tidak diberikan)'}\nStatus akhir: ${r.status}`)
  }, 'https://example.com'),

  netCmd('securityheader', ['ceksecurity', 'headerskor'], 'Audit header keamanan sebuah situs', async m => {
    const q = need(m, 'https://github.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000 })
    const cek = [
      ['Strict-Transport-Security', 'HSTS (paksa HTTPS)'],
      ['Content-Security-Policy', 'CSP (cegah XSS)'],
      ['X-Frame-Options', 'Anti clickjacking'],
      ['X-Content-Type-Options', 'Anti MIME-sniffing'],
      ['Referrer-Policy', 'Kontrol referrer'],
      ['Permissions-Policy', 'Batasi fitur browser'],
      ['Cross-Origin-Opener-Policy', 'Isolasi COOP']
    ]
    let skor = 0
    const rows = cek.map(([h, label]) => {
      const v = r.headers.get(h)
      if (v) skor += 100 / cek.length
      return `${v ? '✅' : '❌'} ${label}: ${v ? truncate(v, 60) : 'tidak ada'}`
    })
    return m.reply(`🛡️ *AUDIT HEADER KEAMANAN*\n${url}\n\n${rows.join('\n')}\n\nSkor: *${Math.round(skor)}/100* ${skor >= 80 ? '🟢 bagus' : skor >= 50 ? '🟡 sedang' : '🔴 perlu diperbaiki'}`)
  }, 'https://github.com'),

  netCmd('cekcdn', ['deteksicdn'], 'Deteksi CDN/WAF yang dipakai sebuah situs', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000 })
    const h = r.headers
    const tanda = []
    if (h.get('server')?.includes('cloudflare') || h.get('cf-ray')) tanda.push('Cloudflare')
    if (h.get('x-amz-cf-id') || h.get('server') === 'CloudFront') tanda.push('AWS CloudFront')
    if (h.get('x-served-by')?.includes('cache') || h.get('x-fastly-request-id')) tanda.push('Fastly')
    if (h.get('x-akamai-transformed') || h.get('server')?.includes('AkamaiGHost')) tanda.push('Akamai')
    if (h.get('x-vercel-id') || h.get('server')?.includes('Vercel')) tanda.push('Vercel')
    if (h.get('x-nf-request-id')) tanda.push('Netlify')
    if (h.get('x-powered-by')?.includes('Next.js')) tanda.push('Next.js')
    if (h.get('x-sucuri-id')) tanda.push('Sucuri WAF')
    if (h.get('x-cache') || h.get('x-cache-hits')) tanda.push('Cache layer: ' + (h.get('x-cache') || h.get('x-cache-hits')))
    return m.reply(`🧲 *DETeksi CDN — ${new URL(url).hostname}*\n\nServer header: ${h.get('server') || '-'}\nTerdeteksi   : ${tanda.length ? tanda.join(', ') : 'tidak ada CDN umum (kemungkinan server sendiri)'}\nVia          : ${h.get('via') || '-'}\nPowered by   : ${h.get('x-powered-by') || '-'}`)
  }, 'https://example.com'),

  netCmd('ceklatensi', ['latensimulti'], 'Ukur latency ke beberapa situs besar sekaligus', async m => {
    const situs = ['google.com', 'cloudflare.com', 'github.com', 'youtube.com', 'wikipedia.org']
    await m.reply('📶 Mengukur latency ke 5 situs...')
    const hasil = []
    for (const s of situs) {
      const t0 = Date.now()
      const r = await tcpCheck(s, 443, 6000)
      hasil.push({ s, ms: r.open ? Date.now() - t0 : null })
    }
    hasil.sort((a, b) => (a.ms ?? 1e9) - (b.ms ?? 1e9))
    return m.reply(`📶 *LATENCY INTERNASIONAL*\n\n${hasil.map((h, i) => `${i + 1}. ${h.ms === null ? '❌' : '✅'} ${h.s} — ${h.ms === null ? 'tidak terjangkau' : h.ms + ' ms'}`).join('\n')}\n\nRata-rata: ${(hasil.filter(h => h.ms).reduce((a, b) => a + b.ms, 0) / Math.max(1, hasil.filter(h => h.ms).length)).toFixed(0)} ms`)
  }, '1'),

  netCmd('ceksslchain', ['rantaisertifikat'], 'Lihat rantai sertifikat (chain) sebuah domain', async m => {
    const q = need(m, 'example.com'); if (!q) return
    const host = cleanHost(q)
    const out = await withTimeout(new Promise((res, rej) => {
      const s = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 10000 }, () => {
        const chain = []
        let c = s.getPeerCertificate(true)
        const seen = new Set()
        while (c && !seen.has(c.fingerprint)) {
          seen.add(c.fingerprint)
          chain.push({ cn: c.subject?.CN, issuer: c.issuer?.CN || c.issuer?.O, until: c.valid_to, self: c.issuerCertificate?.fingerprint === c.fingerprint })
          if (c.issuerCertificate?.fingerprint === c.fingerprint) break
          c = c.issuerCertificate
          if (chain.length > 5) break
        }
        s.end(); res(chain)
      })
      s.on('timeout', () => { s.destroy(); rej(new Error('timeout')) })
      s.on('error', rej)
    }), 15000)
    return m.reply(`🔗 *RANTAI SERTIFIKAT ${host}*\n\n${out.map((c, i) => `${i + 1}. ${c.self ? '🏁 ROOT' : i === 0 ? '🍃 LEAF' : '🔸 INTERMEDIATE'}\n   CN: ${c.cn}\n   Issuer: ${c.issuer}\n   Berlaku s/d: ${new Date(c.until).toLocaleDateString('id-ID')}`).join('\n\n')}\n\nTotal: ${out.length} sertifikat`)
  }, 'example.com'),

  netCmd('cekdnssec', ['dnssec'], 'Cek apakah domain memakai DNSSEC', async m => {
    const q = need(m, 'cloudflare.com'); if (!q) return
    const host = cleanHost(q)
    const R = new dnsP.Resolver(); R.setServers(['8.8.8.8'])
    let ada = false
    try {
      const ds = await withTimeout(dnsP.resolveAny(host), 8000)
      ada = Array.isArray(ds) && ds.some(x => x && (x.type === 'DNSKEY' || x.type === 'RRSIG'))
    } catch { /* ANY sering ditolak */ }
    const txt = await R.resolveTxt(host).catch(() => [])
    return m.reply(`🔏 *DNSSEC ${host}*\n\nTerdeteksi record DNSKEY/RRSIG: ${ada ? '✅ ya' : '⚠️ tidak terdeteksi lewat query ANY (banyak resolver membatasi)'}\nCek pasti: https://dnsviz.net/d/${host}/\n\nDNSSEC melindungi jawaban DNS dari pemalsuan (cache poisoning).`)
  }, 'cloudflare.com'),

  netCmd('httpjson', ['getjson', 'api'], 'Ambil & rapikan JSON dari sebuah API URL', async m => {
    const q = need(m, 'https://api.github.com/repos/WhiskeySockets/Baileys'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 20000, headers: { Accept: 'application/json' } })
    const t = await r.text()
    let j
    try { j = JSON.parse(t) } catch { return m.reply(`❌ Bukan JSON valid (status ${r.status}).\n\n${truncate(t, 800)}`) }
    return m.reply(`🧾 *JSON ${r.url}* (${formatSize(t.length)})\n\n\`\`\`json\n${truncate(JSON.stringify(j, null, 2), 3200)}\n\`\`\``)
  }, 'https://api.github.com/repos/WhiskeySockets/Baileys'),

  netCmd('httpbin', ['testhttp'], 'Uji request HTTP lewat httpbin (echo header & IP)', async m => {
    const r = await fetchUrl('https://httpbin.org/get?tes=1', { timeout: 20000, headers: { 'X-Bot-Name': config.bot.name } })
    const j = await r.json()
    return m.reply(`🔁 *ECHO HTTPBIN*\n\nIP kamu (menurut server): ${j.origin}\nUser-Agent: ${truncate(j.headers['User-Agent'], 80)}\nX-Bot-Name: ${j.headers['X-Bot-Name'] || '-'}\nQuery args: ${JSON.stringify(j.args)}\nURL: ${j.url}`)
  }, '1'),

  netCmd('cekkoneksi', ['netcheck', 'koneksiku'], 'Diagnosa koneksi internet bot (DNS, HTTPS, kecepatan)', async m => {
    await m.reply('🩺 Memeriksa koneksi...')
    const hasil = {}
    const t0 = Date.now(); hasil.dns = await dnsP.resolve4('google.com').then(() => Date.now() - t0).catch(() => null)
    const t1 = Date.now(); const tcp = await tcpCheck('cloudflare.com', 443, 8000); hasil.tls = tcp.open ? Date.now() - t1 : null
    let speed = null
    try {
      const t2 = Date.now()
      const r = await fetchUrl('https://speed.cloudflare.com/__down?bytes=1000000', { timeout: 25000 })
      const b = await r.arrayBuffer()
      speed = (b.byteLength * 8) / ((Date.now() - t2) / 1000) / 1e6
    } catch { /* abaikan */ }
    let ip = '-'
    try { const r = await fetchUrl('http://ip-api.com/json/?fields=query,country,isp', { timeout: 10000 }); const j = await r.json(); ip = `${j.query} (${j.country}, ${j.isp})` } catch { /* abaikan */ }
    return m.reply(`🩺 *DIAGNOSA KONEKSI*\n\n▸ DNS resolve : ${hasil.dns === null ? '❌ gagal' : ok('OK', hasil.dns + ' ms')}\n▸ TCP/TLS 443 : ${hasil.tls === null ? '❌ gagal' : ok('OK', hasil.tls + ' ms')}\n▸ Kecepatan   : ${speed === null ? '❌ gagal' : ok('OK', speed.toFixed(2) + ' Mbps')}\n▸ IP publik   : ${ip}\n\nKesimpulan: ${hasil.dns && hasil.tls ? '🟢 internet bot normal' : '🔴 ada masalah — periksa jaringan Termux'}`)
  }, '1'),

  netCmd('urlstatus', ['cekurlbanyak'], 'Cek status banyak URL sekaligus (pisah spasi)', async m => {
    const urls = (m.q || '').split(/\s+/).filter(Boolean).slice(0, 6).map(u => (/^https?:/.test(u) ? u : 'https://' + u))
    if (!urls.length) return m.reply(`Contoh: ${P}urlstatus example.com github.com google.com`)
    const hasil = await Promise.all(urls.map(async u => {
      const t0 = Date.now()
      try { const r = await fetchUrl(u, { timeout: 12000 }); return `${r.ok ? '🟢' : '🟡'} ${new URL(u).hostname} → ${r.status} (${Date.now() - t0} ms)` } catch { return `🔴 ${new URL(u).hostname} → gagal` }
    }))
    return m.reply(`📊 *STATUS ${urls.length} URL*\n\n${hasil.join('\n')}`)
  }, 'example.com github.com'),

  netCmd('cekcache', ['cachecontrol'], 'Periksa header cache & umur konten sebuah URL', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000 })
    const h = r.headers
    const age = h.get('age')
    return m.reply(`🗄️ *CACHE ${new URL(url).hostname}*\n\nCache-Control : ${h.get('cache-control') || '-'}\nPragma        : ${h.get('pragma') || '-'}\nExpires       : ${h.get('expires') || '-'}\nETag          : ${h.get('etag') || '-'}\nLast-Modified : ${h.get('last-modified') || '-'}\nAge           : ${age ? age + ' detik' : '-'}\nX-Cache       : ${h.get('x-cache') || '-'}\nVary          : ${h.get('vary') || '-'}`)
  }, 'https://example.com'),

  netCmd('cekkompres', ['gzip'], 'Cek dukungan kompresi (gzip/br) sebuah situs', async m => {
    const q = need(m, 'https://example.com'); if (!q) return
    const url = /^https?:/.test(q) ? q : 'https://' + q
    const r = await fetchUrl(url, { timeout: 15000, headers: { 'Accept-Encoding': 'gzip, deflate, br' } })
    const enc = r.headers.get('content-encoding')
    const body = await r.text()
    return m.reply(`🗜️ *KOMPRESI ${new URL(url).hostname}*\n\nContent-Encoding: ${enc || '(tidak dikompresi)'}\nDukungan        : ${enc === 'br' ? '🟢 Brotli (terbaik)' : enc === 'gzip' ? '🟢 gzip' : enc ? '🟡 ' + enc : '🔴 tidak ada — situs lebih boros kuota'}\nUkuran diterima : ${formatSize(body.length)}\nContent-Length  : ${r.headers.get('content-length') ? formatSize(Number(r.headers.get('content-length'))) : '-'}`)
  }, 'https://example.com'),

  netCmd('cekipv6', ['supportipv6'], 'Cek apakah domain mendukung IPv6', async m => {
    const q = need(m, 'google.com'); if (!q) return
    const host = cleanHost(q)
    const [v4, v6] = await Promise.all([dnsP.resolve4(host).catch(() => []), dnsP.resolve6(host).catch(() => [])])
    let v6ok = null
    if (v6.length) v6ok = (await tcpCheck(v6[0], 443, 6000)).open
    return m.reply(`🔢 *IPv6 ${host}*\n\nIPv4: ${v4.length ? '✅ ' + v4[0] : '❌ tidak ada'}\nIPv6: ${v6.length ? '✅ ' + v6[0] : '❌ tidak ada'}\nKoneksi IPv6 ke :443 — ${v6ok === null ? 'tidak diuji' : v6ok ? '🟢 berhasil' : '🔴 gagal'}\n\nDukungan dual-stack: ${v4.length && v6.length ? '✅ ya' : '❌ tidak'}`)
  }, 'google.com')
]

export default { netlabCmds }
