/**
 * 🌐 INTERNET MENU — cuaca, jadwal sholat, kurs, wiki, google
 */
import { cuaca, kurs, jadwalSholat } from '../lib/scraper.js'
import { config } from '../config.js'
import { getJSON, truncate, getBuffer } from '../lib/functions.js'

export default {
  command: ['cuaca', 'weather'],
  category: 'Internet',
  description: 'Cek cuaca suatu kota',
  limit: 1,
  run: async (m) => {
    const city = m.q
    if (!city) return m.reply(`Contoh: \`${config.display.prefix}cuaca Jakarta\``)
    await m.typing()
    try {
      const w = await cuaca(city)
      return m.sendButtons({
        title: `🌤️ Cuaca — ${w.lokasi}`,
        text: `*🌤️ CUACA ${w.lokasi.toUpperCase()}*\n\n▸ Kondisi: ${w.kondisi}\n▸ Suhu: ${w.suhu}\n▸ Kelembapan: ${w.kelembapan}\n▸ Angin: ${w.angin}\n\n_Sumber: open-meteo.com_`,
        buttons: [
          { text: '🔄 Cek Lagi', id: `.cuaca ${city}` },
          { text: '🕌 Jadwal Sholat', id: `.sholat ${city}` }
        ]
      })
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

export const sholat = {
  command: ['sholat', 'jadwalsholat', 'jadwal'],
  category: 'Internet',
  description: 'Jadwal sholat harian per kota',
  limit: 1,
  run: async (m) => {
    const city = m.q || 'Jakarta'
    await m.typing()
    try {
      const j = await jadwalSholat(city)
      const text = `*🕌 JADWAL SHOLAT — ${j.kota.toUpperCase()}*
_${j.tanggal}_

▸ Imsak  : ${j.imsak}
▸ Subuh  : ${j.subuh}
▸ Terbit : ${j.terbit}
▸ Dzuhur : ${j.dzuhur}
▸ Ashar  : ${j.ashar}
▸ Maghrib: ${j.maghrib}
▸ Isya   : ${j.isya}

_Sumber: aladhan.com (Kemenag method)_`
      return m.sendButtons({
        title: '🕌 Jadwal Sholat',
        text,
        buttons: [{ text: '🌤️ Cuaca', id: `.cuaca ${city}` }, { text: '🏠 Menu', id: 'act:menu:main' }]
      }).catch(() => m.reply(text))
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

export const kursCmd = {
  command: ['kurs', 'currency', 'tukar'],
  category: 'Internet',
  description: 'Konversi mata uang (contoh: .kurs USD IDR 10)',
  limit: 1,
  run: async (m) => {
    const [from = 'USD', to = 'IDR', amount = '1'] = m.args
    await m.typing()
    try {
      const r = await kurs(from, to, parseFloat(amount) || 1)
      return m.reply(
        `*💱 KURS MATA UANG*\n\n▸ ${r.from} → ${r.to}\n▸ 1 ${r.from} = ${r.rate.toLocaleString('id-ID')} ${r.to}\n▸ ${amount} ${r.from} = *${r.result.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${r.to}*\n\n_Update: ${r.updated}_`
      )
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

export const wiki = {
  command: ['wiki', 'wikipedia'],
  category: 'Internet',
  description: 'Cari artikel Wikipedia Indonesia',
  limit: 1,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh: \`${config.display.prefix}wiki Borobudur\``)
    await m.typing()
    try {
      const j = await getJSON(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(m.q)}`, {}, 1)
      if (!j?.extract) throw new Error('Artikel tidak ditemukan')
      const buttons = [{ text: '🏠 Menu', id: 'act:menu:main' }]
      if (j.content_urls?.desktop?.page) buttons.unshift({ text: '🔗 Baca Lengkap', id: 'act:url' })
      try {
        return await m.sendInteractive({
          title: '📚 ' + j.title,
          body: j.extract,
          footer: 'Wikipedia Indonesia',
          image: j.thumbnail?.source ? await getBuffer(j.thumbnail.source).catch(() => null) : null,
          buttons: [{ text: '🔎 Wiki: ' + m.q, id: `.wiki ${m.q}` }],
          url: [{ text: '🔗 Baca di Wikipedia', url: j.content_urls.desktop.page }]
        })
      } catch {
        return await m.reply(`*📚 ${j.title}*\n\n${j.extract}\n\n🔗 ${j.content_urls?.desktop?.page || ''}`)
      }
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}

export const google = {
  command: ['google', 'gsearch', 'cari'],
  category: 'Internet',
  description: 'Cari di Google / DuckDuckGo',
  limit: 1,
  run: async (m) => {
    if (!m.q) return m.reply(`Contoh: \`${config.display.prefix}google cara install nodejs di termux\``)
    await m.typing()
    try {
      const j = await getJSON(`https://api.duckduckgo.com/?q=${encodeURIComponent(m.q)}&format=json&no_html=1&skip_disambig=1`, {}, 1)
      const results = []
      if (j?.AbstractText) results.push({ title: j.Heading || m.q, url: j.AbstractURL, snippet: j.AbstractText })
      for (const t of j?.RelatedTopics || []) {
        if (t.FirstURL) results.push({ title: t.Text?.slice(0, 80) || t.FirstURL, url: t.FirstURL, snippet: t.Text || '' })
        if (results.length >= 5) break
      }
      if (!results.length) {
        return await m.sendInteractive({
          title: '🔎 Pencarian Google',
          body: `Tidak ada hasil instan untuk:\n*${m.q}*\n\nBuka pencarian lengkap di browser 👇`,
          footer: config.bot.footer,
          url: [{ text: '🔎 Buka Google', url: `https://www.google.com/search?q=${encodeURIComponent(m.q)}` }]
        })
      }
      const text = `*🔎 HASIL PENCARIAN: ${m.q}*\n\n` + results
        .map((r, i) => `${i + 1}. *${r.title}*\n${truncate(r.snippet, 160)}\n🔗 ${r.url}`)
        .join('\n\n')
      return await m.reply(text)
    } catch (e) {
      return m.reply('❌ ' + truncate(e.message, 200))
    }
  }
}
