/**
 * 🌐 INTERNET PLUS — utilitas HTTP/URL (fetch langsung, tanpa API pihak ketiga)
 * Kategori "Internet".
 */
import { fetchWithTimeout } from '../lib/functions.js'

function normUrl (s) {
  s = String(s || '').trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  return s
}

export const cekWeb = {
  command: ['cekweb', 'httpstatus', 'ishidup', 'webcheck'],
  category: 'Internet',
  description: 'Cek status HTTP sebuah website',
  limit: 0,
  run: async (m) => {
    const url = normUrl(m.q)
    if (!url) return m.reply(`Contoh: \`.cekweb google.com\``)
    const t0 = Date.now()
    try {
      const res = await fetchWithTimeout(url, { method: 'GET' }, 15000)
      const ms = Date.now() - t0
      const ok = res.ok
      return m.reply(`${ok ? '✅' : '⚠️'} *${url}*\n▸ Status: ${res.status} ${res.statusText || ''}\n▸ Waktu: ${ms} ms\n▸ Tipe: ${res.headers.get('content-type') || '-'}`)
    } catch (e) {
      return m.reply(`❌ *${url}* tidak bisa diakses.\n${e.message}`)
    }
  }
}

export const latency = {
  command: ['latency', 'pingweb', 'latensi'],
  category: 'Internet',
  description: 'Ukur latensi ke sebuah host',
  limit: 0,
  run: async (m) => {
    const url = normUrl(m.q)
    if (!url) return m.reply('Contoh: `.latency google.com`')
    const samples = []
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now()
      try { await fetchWithTimeout(url, { method: 'HEAD' }, 10000); samples.push(Date.now() - t0) } catch { samples.push(-1) }
    }
    const good = samples.filter(x => x >= 0)
    if (!good.length) return m.reply(`❌ ${url} tidak merespons.`)
    const avg = Math.round(good.reduce((a, b) => a + b, 0) / good.length)
    return m.reply(`📶 *Latensi ${url}*\n▸ Sampel: ${samples.map(x => x < 0 ? 'timeout' : x + 'ms').join(', ')}\n▸ Rata-rata: *${avg} ms*`)
  }
}

export const httpHeaders = {
  command: ['headers', 'httphead', 'cekheader'],
  category: 'Internet',
  description: 'Lihat header HTTP sebuah URL',
  limit: 0,
  run: async (m) => {
    const url = normUrl(m.q)
    if (!url) return m.reply('Contoh: `.headers google.com`')
    try {
      const res = await fetchWithTimeout(url, { method: 'GET' }, 15000)
      const rows = [...res.headers.entries()].slice(0, 15).map(([k, v]) => `▸ ${k}: ${String(v).slice(0, 60)}`)
      return m.reply(`📨 *HEADER ${url}*\n${rows.join('\n')}`)
    } catch (e) {
      return m.reply('❌ ' + e.message)
    }
  }
}

export const expandUrl = {
  command: ['expandurl', 'redirect', 'unshort'],
  category: 'Internet',
  description: 'Lihat URL tujuan akhir setelah redirect',
  limit: 0,
  run: async (m) => {
    const url = normUrl(m.q)
    if (!url) return m.reply('Contoh: `.expandurl bit.ly/xxx`')
    try {
      const res = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, 15000)
      return m.reply(`🔀 *URL akhir:*\n${res.url}\n▸ Status: ${res.status}`)
    } catch (e) {
      return m.reply('❌ ' + e.message)
    }
  }
}
