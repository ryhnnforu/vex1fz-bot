/**
 * Scraper / API publik sederhana untuk fitur downloader & tools.
 * Semua endpoint publik — kalau mati, ganti URL-nya di sini.
 */
import { getJSON, getBuffer } from './functions.js'
import { config } from '../config.js'

/* ---------------- TIKTOK ---------------- */
export async function tiktok (url) {
  const apis = [
    async () => {
      // tikwm.com — paling stabil (tanpa watermark + musik)
      const j = await getJSON(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`)
      if (j?.code !== 0) throw new Error(j?.msg || 'tikwm menolak URL ini')
      const d = j.data
      return {
        title: d.title || 'TikTok Video',
        author: d.author?.nickname || d.author?.unique_id || 'TikTok',
        nowm: d.play, wm: d.wmplay || d.play, audio: d.music,
        cover: d.cover, duration: d.duration
      }
    },
    async () => {
      const j = await getJSON(`${config.api.tiktok}?url=${encodeURIComponent(url)}`)
      const d = j.result || j.data || j
      return {
        title: d.title || d.desc || 'TikTok Video',
        author: d.author?.nickname || d.author || 'TikTok',
        nowm: d.download?.nowm || d.nowm || d.url?.[0] || d.video,
        wm: d.download?.wm || d.wm,
        audio: d.download?.music || d.audio || d.music
      }
    },
    async () => {
      const j = await getJSON(`https://tiktokwm.vercel.app/api/tiktok?url=${encodeURIComponent(url)}`)
      const d = j.result || j.data || j
      return { title: d.title || 'TikTok Video', author: d.author || 'TikTok', nowm: d.nowm || d.video, wm: d.wm, audio: d.audio }
    }
  ]
  let lastErr
  for (const run of apis) {
    try {
      const r = await run()
      if (r.nowm || r.audio) return r
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('Gagal mengambil data TikTok')
}

/* ---------------- INSTAGRAM ---------------- */
export async function instagram (url) {
  const j = await getJSON(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`)
  const d = j.data || j.result || j
  const list = (Array.isArray(d) ? d : d.medias || d.url ? [d] : []).map(x => x.url || x)
  if (!list.length) throw new Error('Media Instagram tidak ditemukan')
  return { urls: list.filter(Boolean) }
}

/* ---------------- SCREENSHOT WEB ---------------- */
export async function ssweb (url) {
  return await getBuffer(config.api.ss + encodeURI(url).replace(/#.*$/, ''), { timeout: 90000 }, 1)
}

/* ---------------- CUACA ---------------- */
export async function cuaca (city) {
  const geo = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id`)
  const loc = geo?.results?.[0]
  if (!loc) throw new Error(`Kota "${city}" tidak ditemukan`)
  const w = await getJSON(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
  )
  const c = w.current || {}
  const codeMap = {
    0: 'Cerah ☀️', 1: 'Cerah berawan 🌤️', 2: 'Berawan sebagian ⛅', 3: 'Berawan ☁️',
    45: 'Berkabut 🌫️', 48: 'Kabut embun 🌫️', 51: 'Gerimis ringan 🌦️', 53: 'Gerimis 🌦️',
    55: 'Gerimis lebat 🌧️', 61: 'Hujan ringan 🌧️', 63: 'Hujan 🌧️', 65: 'Hujan lebat ⛈️',
    71: 'Salju ringan 🌨️', 73: 'Salju 🌨️', 75: 'Salju lebat ❄️', 80: 'Hujan lokal 🌦️',
    81: 'Hujan lokal sedang 🌧️', 82: 'Hujan lokal lebat ⛈️', 95: 'Badai petir ⛈️',
    96: 'Badai + es ⛈️', 99: 'Badai es parah ⛈️'
  }
  return {
    lokasi: `${loc.name}, ${loc.admin1 || ''} ${loc.country || ''}`.trim(),
    kondisi: codeMap[c.weather_code] || 'Tidak diketahui',
    suhu: `${c.temperature_2m}°C (terasa ${c.apparent_temperature}°C)`,
    kelembapan: `${c.relative_humidity_2m}%`,
    angin: `${c.wind_speed_10m} km/j`
  }
}

/* ---------------- KURS / CURRENCY ---------------- */
export async function kurs (from = 'USD', to = 'IDR', amount = 1) {
  const j = await getJSON(`https://open.er-api.com/v6/latest/${encodeURIComponent(from.toUpperCase())}`)
  const rate = j?.rates?.[to.toUpperCase()]
  if (!rate) throw new Error(`Kurs ${from} -> ${to} tidak ditemukan`)
  return { from: from.toUpperCase(), to: to.toUpperCase(), rate, result: amount * rate, updated: j.time_last_update_utc }
}

/* ---------------- JADWAL SHOLAT ---------------- */
export async function jadwalSholat (city) {
  const geo = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id`)
  const loc = geo?.results?.[0]
  if (!loc) throw new Error(`Kota "${city}" tidak ditemukan`)
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const j = await getJSON(
    `https://api.aladhan.com/v1/timings/${date}?latitude=${loc.latitude}&longitude=${loc.longitude}&method=20`
  )
  const t = j?.data?.timings
  if (!t) throw new Error('Jadwal sholat tidak tersedia')
  return {
    kota: loc.name,
    tanggal: j.data.date.readable,
    imsak: t.Imsak, subuh: t.Fajr, terbit: t.Sunrise, dzuhur: t.Dhuhr,
    ashar: t.Asr, maghrib: t.Maghrib, isya: t.Isha
  }
}

/* ---------------- WALLPAPER / GAMBAR RANDOM ---------------- */
export async function randomImage (query) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=720&height=1280&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`
  return await getBuffer(url, { timeout: 120000 }, 1)
}

export default { tiktok, instagram, ssweb, cuaca, kurs, jadwalSholat, randomImage }
