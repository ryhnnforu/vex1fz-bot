/**
 * lib/api.js — downloader & fitur islami (API publik)
 */
const config = require('../config')
const { pick } = require('./util')

async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Safari/537.36', ...headers },
    signal: AbortSignal.timeout(25000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function getHtml(url, headers = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Mobile Safari/537.36', ...headers },
    signal: AbortSignal.timeout(25000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/* ══════════════ DOWNLOADER ══════════════ */

/** TikTok via tikwm (tanpa API key) */
async function tiktok(url) {
  const j = await getJson(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
  if (j.code !== 0 || !j.data) throw new Error(j.msg || 'Gagal memuat TikTok')
  const d = j.data
  return {
    title: d.title || 'TikTok',
    author: d.author?.nickname || d.author?.unique_id || 'unknown',
    duration: d.duration || 0,
    cover: d.cover || d.origin_cover || '',
    play: d.play || d.wmplay,
    wmplay: d.wmplay || '',
    music: d.music || ''
  }
}

/** MediaFire — scrape link download langsung */
async function mediafire(url) {
  const html = await getHtml(url)
  const patterns = [
    /href="(https:\/\/download\d*\.mediafire\.com\/[^"]+)"/i,
    /"downloadURL":"(https:[^"]+)"/i,
    /id="downloadButton"[^>]*href="(https:[^"]+)"/i,
    /class="input popsok"[^>]*href="(https:[^"]+)"/i,
    /(https:\/\/download\d*\.mediafire\.com\/[^"'\s<>]+)/i
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1]) {
      const fileName = decodeURIComponent((m[1].split('/').pop() || '').split('?')[0])
      const sizeMatch = html.match(/([\d.,]+\s*(?:KB|MB|GB))/i)
      return { url: m[1].replace(/&amp;/g, '&'), fileName, size: sizeMatch ? sizeMatch[1] : '?' }
    }
  }
  throw new Error('Link MediaFire tidak valid / file tidak ditemukan')
}

/** Generic downloader: coba endpoint satu per satu, cari url pertama */
async function genericDownload(endpoints, url, apikey = '') {
  const candidates = (Array.isArray(endpoints) ? endpoints : [endpoints]).filter(Boolean)
  if (!candidates.length) return null
  const errors = []
  for (const tpl of candidates) {
    const finalUrl = tpl
      .replaceAll('{url}', encodeURIComponent(url))
      .replaceAll('{apikey}', encodeURIComponent(apikey))
    try {
      const j = await getJson(finalUrl)
      const found = deepFindUrl(j)
      if (found) return { url: found, raw: j }
      errors.push('url tidak ditemukan di respons')
    } catch (e) {
      errors.push(e.message)
    }
  }
  throw new Error(errors.join(' | '))
}

/** cari url media pertama dalam JSON (heuristik) */
function deepFindUrl(obj, depth = 0) {
  if (depth > 6 || obj == null) return null
  if (typeof obj === 'string') return null
  const keys = ['url', 'download_url', 'downloadUrl', 'play', 'video', 'video_url', 'link', 'hd', 'sd', 'nowm', 'mp4']
  for (const k of keys) {
    if (typeof obj[k] === 'string' && /^https?:\/\//.test(obj[k])) return obj[k]
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const f = deepFindUrl(item, depth + 1)
      if (f) return f
    }
    return null
  }
  for (const v of Object.values(obj)) {
    const f = deepFindUrl(v, depth + 1)
    if (f) return f
  }
  return null
}

/** endpoint default lolhuman jika owner hanya isi API key (tanpa INSTAGRAM_API dsb) */
function lolhumanEndpoints(kind) {
  if (config.apiKeys.lolhuman) {
    return [`https://api.lolhuman.xyz/api/download/${kind}?apikey={apikey}&url={url}`]
  }
  return []
}

async function instagram(url) {
  const eps = config.downloaderEndpoints.instagram.length
    ? config.downloaderEndpoints.instagram
    : lolhumanEndpoints('instagram')
  const r = await genericDownload(eps, url, config.apiKeys.lolhuman)
  if (!r) throw new Error('__CONFIG__')
  return r
}

async function facebook(url) {
  const eps = config.downloaderEndpoints.facebook.length
    ? config.downloaderEndpoints.facebook
    : lolhumanEndpoints('facebook')
  const r = await genericDownload(eps, url, config.apiKeys.lolhuman)
  if (!r) throw new Error('__CONFIG__')
  return r
}

async function twitter(url) {
  const eps = config.downloaderEndpoints.twitter.length
    ? config.downloaderEndpoints.twitter
    : lolhumanEndpoints('twitter')
  const r = await genericDownload(eps, url, config.apiKeys.lolhuman)
  if (!r) throw new Error('__CONFIG__')
  return r
}

/** cari key tertentu lebih dulu dalam JSON (untuk lolhuman youtube dsb) */
function deepFindKeys(obj, keys, depth = 0) {
  if (depth > 6 || obj == null || typeof obj !== 'object') return null
  for (const k of keys) {
    if (typeof obj[k] === 'string' && /^https?:\/\//.test(obj[k])) return obj[k]
  }
  for (const v of Array.isArray(obj) ? obj : Object.values(obj)) {
    const f = deepFindKeys(v, keys, depth + 1)
    if (f) return f
  }
  return null
}

/** YouTube via endpoint (lolhuman bila apikey diisi) — kind: mp3|mp4 */
async function youtube(url, kind = 'mp4') {
  const eps = (config.downloaderEndpoints.youtube || []).length
    ? config.downloaderEndpoints.youtube
    : lolhumanEndpoints('youtube')
  if (!eps.length) throw new Error('__CONFIG__')
  const errors = []
  for (const tpl of eps) {
    const finalUrl = tpl.replaceAll('{url}', encodeURIComponent(url)).replaceAll('{apikey}', encodeURIComponent(config.apiKeys.lolhuman))
    try {
      const j = await getJson(finalUrl)
      const found = kind === 'mp3'
        ? (deepFindKeys(j, ['linkmp3', 'mp3', 'audio', 'download']) || deepFindUrl(j))
        : (deepFindKeys(j, ['linkmp4', 'mp4', 'video', 'download']) || deepFindUrl(j))
      if (found) return { url: found, raw: j }
      errors.push('url tidak ditemukan')
    } catch (e) { errors.push(e.message) }
  }
  throw new Error(errors.join(' | ') || '__CONFIG__')
}

/** cari video YouTube berdasarkan judul (scrape hasil pencarian) */
async function ytSearch(query) {
  const html = await getHtml(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    { Cookie: 'CONSENT=YES+cb; SOCS=CAI' }
  )
  const m = html.match(/"videoId":"([\w-]{11})"/)
  if (!m) throw new Error('Video tidak ditemukan')
  return `https://www.youtube.com/watch?v=${m[1]}`
}

/** ekstrak meta og:video / og:audio / og:video:secure_url dari halaman */
async function ogMedia(url, prefer = ['video:secure_url', 'video', 'audio', 'image']) {
  const html = await getHtml(url, { Referer: url })
  const og = {}
  const re = /<meta[^>]+(?:property|name)=["']og:([^"']+)["'][^>]+content=["']([^"']+)["']/gi
  let mm
  while ((mm = re.exec(html))) og[mm[1]] = mm[2].replace(/&amp;/g, '&')
  for (const p of prefer) {
    if (og[p] && /^https?:\/\//.test(og[p])) return { url: og[p], title: og.title || '' }
  }
  // fallback: cari url media apa pun
  const any = html.match(/https?:\/\/[^"'\s]+?\.(?:mp4|mp3|webm|m3u8)[^"'\s]*/i)
  if (any) return { url: any[0].replace(/&amp;/g, '&'), title: og.title || '' }
  throw new Error('Media tidak ditemukan di halaman ini')
}

/** GitHub repo info (tanpa API key) */
async function githubRepo(input) {
  const repo = String(input || '').replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '').replace(/\.git$/, '')
  const j = await getJson(`https://api.github.com/repos/${repo}`)
  if (!j.full_name) throw new Error('Repo tidak ditemukan')
  return {
    name: j.full_name,
    desc: j.description || '(tanpa deskripsi)',
    stars: j.stargazers_count,
    forks: j.forks_count,
    lang: j.language || '-',
    url: j.html_url,
    zip: `https://github.com/${j.full_name}/archive/refs/heads/${j.default_branch || 'main'}.zip`,
    size: Math.round((j.size || 0) / 1024 * 10) / 10
  }
}

/** Reddit post: ambil video/gambar (JSON publik, tanpa key) */
async function reddit(url) {
  const clean = url.split('?')[0].replace(/\/+$/, '')
  const j = await getJson(clean + (clean.endsWith('.json') ? '' : '.json'), {
    'User-Agent': 'Mozilla/5.0 vex1fz-bot'
  })
  const post = j?.[0]?.data?.children?.[0]?.data
  if (!post) throw new Error('Post tidak ditemukan')
  const vid = post.media?.reddit_video?.fallback_url ||
    post.secure_media?.reddit_video?.fallback_url
  const img = post.preview?.images?.[0]?.source?.url
  const urlOv = post.url_overridden_by_dest
  const media = vid || img || (/\.(mp4|gif|jpg|png|webp)/i.test(urlOv || '') ? urlOv : null)
  if (!media) throw new Error('Post tidak punya media yang bisa diunduh')
  return { url: media.replace(/&amp;/g, '&'), title: post.title || 'Reddit' }
}

/** musik TikTok (tikwm, tanpa key) */
async function tiktokMusic(url) {
  const r = await tiktok(url)
  if (!r.music) throw new Error('Musik tidak ditemukan')
  return { url: r.music, title: r.title }
}

/** unduh bytes (dengan redirect) untuk kirim sebagai dokumen */
async function fetchBuffer(url, { timeout = 90_000 } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 vex1fz-bot' },
    signal: AbortSignal.timeout(timeout)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return { buf, name: decodeURIComponent((url.split('/').pop() || 'file.zip').split('?')[0]), type: res.headers.get('content-type') || '' }
}

const CONFIG_HELP =
  `⚠️ *Endpoint API belum diatur*\n` +
  `Untuk Instagram/Facebook/Twitter, isi dulu di *config.js*:\n\n` +
  `1. Dapat API key gratis (contoh: lolhuman via Telegram)\n` +
  `2. Buka file *.env*, isi:\n` +
  `   LOLHUMAN_APIKEY=xxxxx\n` +
  `3. Restart bot\n\n` +
  `Detail lengkap → lihat bagian *Downloader* di README.md`

/* ══════════════ ISLAMI ══════════════ */

async function quranSurah(number, fromAyah = 1, count = 5) {
  const j = await getJson(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`)
  if (j.code !== 200 || !j.data) throw new Error('Surah tidak ditemukan')
  const s = j.data
  const ayahs = s.ayahs.slice(fromAyah - 1, fromAyah - 1 + count)
  return {
    number: s.number,
    name: s.name,
    english: s.englishName,
    meaning: s.englishNameTranslation,
    totalAyah: s.numberOfAyahs,
    ayahs: ayahs.map(a => ({ number: a.numberInSurah, text: a.text }))
  }
}

/** daftar114 surah */
async function quranList() {
  const j = await getJson('https://api.alquran.cloud/v1/surah')
  if (j.code !== 200 || !j.data) throw new Error('Gagal memuat daftar surah')
  return j.data.map(s => ({ number: s.number, name: s.name, english: s.englishName, ayah: s.numberOfAyahs }))
}

/** cari ayat: balas dengan teks ayat yang cocok */
async function quranSearchFull(query) {
  const j = await getJson(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all`)
  if (j.code !== 200 || !j.data?.matches?.length) return []
  return j.data.matches.slice(0, 5).map(mm => ({
    surah: mm.surah.number,
    surahName: mm.surah.name,
    ayah: mm.numberInSurah,
    text: mm.text
  }))
}

/** jadwal sholat sebulan (aladhan calendarByCity) */
async function jadwalBulan(city, month, year) {
  const url = `https://api.aladhan.com/v1/calendarByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=20&month=${month}&year=${year}`
  const j = await getJson(url)
  if (j.code !== 200 || !j.data) throw new Error('Gagal memuat jadwal bulanan')
  return j.data.map(d => ({
    date: {
      day: d.date.gregorian.day,
      month: typeof d.date.gregorian.month === 'object' ? d.date.gregorian.month.en : String(d.date.gregorian.month),
      year: d.date.gregorian.year
    },
    hijri: `${d.date.hijri.day} ${d.date.hijri.month.en} ${d.date.hijri.year}`,
    subuh: d.timings.Fajr.replace(/ \(.*/, ''),
    dzuhur: d.timings.Dhuhr.replace(/ \(.*/, ''),
    ashar: d.timings.Asr.replace(/ \(.*/, ''),
    maghrib: d.timings.Maghrib.replace(/ \(.*/, ''),
    isya: d.timings.Isha.replace(/ \(.*/, '')
  }))
}

/** konversi tanggal Masehi → Hijriah */
async function hijriah(date = null) {
  const d = date ? new Date(date) : new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const j = await getJson(`https://api.aladhan.com/v1/gToH/${dd}-${mm}-${yyyy}`)
  if (j.code !== 200 || !j.data) throw new Error('Gagal konversi hijriah')
  const h = j.data.hijri
  return {
    hijri: `${h.day} ${h.month.en} ${h.year}`,
    gregorian: `${dd}-${mm}-${yyyy}`
  }
}

async function quranSearch(query) {
  const j = await getJson(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/1`)
  if (j.code !== 200 || !j.data?.matches?.length) return []
  const seen = new Set()
  const out = []
  for (const m of j.data.matches) {
    if (!seen.has(m.surah.number)) {
      seen.add(m.surah.number)
      out.push({ number: m.surah.number, name: m.surah.name, english: m.surah.englishName })
    }
    if (out.length >= 6) break
  }
  return out
}

async function jadwalSholat(city) {
  const j = await getJson(
    `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=20`
  )
  if (j.code !== 200) throw new Error(j.data || 'Kota tidak ditemukan')
  const t = j.data.timings
  return {
    city,
    date: j.data.date.readable,
    times: {
      'Imsak': t.Imsak, 'Subuh': t.Fajr, 'Terbit': t.Sunrise,
      'Dzuhur': t.Dhuhr, 'Ashar': t.Asr, 'Maghrib': t.Maghrib, 'Isya': t.Isha
    }
  }
}

async function asmaulHusna(number) {
  const j = await getJson('https://api.aladhan.com/v1/asmaAlHusna')
  if (j.code !== 200 || !j.data) throw new Error('Gagal memuat data')
  const list = j.data
  if (number) {
    const one = list.find(a => Number(a.number) === Number(number))
    if (!one) throw new Error('Nomor 1-99')
    return { single: one }
  }
  return { list: list.slice(0, 99) }
}

/** doa harian statis (tanpa internet) */
const DOA = [
  { t: 'Doa Bangun Tidur', a: 'اَلْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', tr: 'Alhamdulillahilladzi ahyana ba\'da ma amatana wa ilaihin nusyur', id: 'Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan kepada-Nya kami kembali.' },
  { t: 'Doa Masuk Kamar Mandi', a: 'اَللّٰهُمَّ إِنِّي أَعُوْذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ', tr: 'Allahumma inni a\'udzubika minal khubutsi wal khabaits', id: 'Ya Allah, aku berlindung kepada-Mu dari godaan jin pria dan wanita.' },
  { t: 'Doa Keluar Kamar Mandi', a: 'اَلْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الْأَذَى وَعَافَانِي', tr: 'Alhamdulillahilladzi adzhaba anni al-adza wa \'afani', id: 'Segala puji bagi Allah yang telah menghilangkan kotoran dari aku dan menyehatkanku.' },
  { t: 'Doa Sebelum Makan', a: 'بِسْمِ اللّٰهِ, وَإِنْ نَسِيَ فِي أَوَّلِهِ فَلْيَقُلْ: بِسْمِ اللّٰهِ أَوَّلَهُ وَآخِرَهُ', tr: 'Bismillah (jika lupa di awal: Bismillahi awwalahu wa akhirah)', id: 'Dengan nama Allah (di awal makan). Jika lupa membaca di awal, baca: Bismillah di awal dan akhirnya.' },
  { t: 'Doa Sesudah Makan', a: 'اَلْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', tr: 'Alhamdulillahilladzi ath\'amani hadza wa rozaqonihii min ghoiri hawlin minni wa la quwwah', id: 'Segala puji bagi Allah yang telah memberi makan ini dan memberi rezeki tanpa ada kekuatan dariku.' },
  { t: 'Doa Masuk Rumah', a: 'بِسْمِ اللّٰهِ وَلَجْنَا, وَبِسْمِ اللّٰهِ خَرَجْنَا, وَعَلَى رَبِّنَا تَوَكَّلْنَا', tr: 'Bismillahi walajna, wa bismillahi kharajna, wa \'ala robbina tawakkalna', id: 'Dengan nama Allah kami masuk, dengan nama Allah kami keluar, dan kepada Tuhan kami kami bertawakkal.' },
  { t: 'Doa Keluar Rumah', a: 'بِسْمِ اللّٰهِ, تَوَكَّلْتُ عَلَى اللّٰهِ, وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', tr: 'Bismillah, tawakkaltu \'alallah, wa la hawla wa la quwwata illa billah', id: 'Dengan nama Allah, aku bertawakkal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah.' },
  { t: 'Doa Masuk Masjid', a: 'اَللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', tr: 'Allahummaf-tahli abwaba rohmatik', id: 'Ya Allah, bukakan untukku pintu-pintu rahmat-Mu.' },
  { t: 'Doa Keluar Masjid', a: 'اَللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', tr: 'Allahumma inni as\'aluka min fadhlik', id: 'Ya Allah, sesungguhnya aku memohon kepada-Mu dari karunia-Mu.' },
  { t: 'Doa Duduk Diantara Sujud', a: 'رَبِّ اغْفِرْ لِي', tr: 'Rabbighfirli', id: 'Ya Tuhan kami, ampunilah aku.' },
  { t: 'Doa Melihat Musibah', a: 'اَلْحَمْدُ لِلَّهِ الَّذِي عَافَانِي مِمَّا ابْتَلَانِي بِهِ وَفَضَّلَنِي عَلَى كَثِيرٍ مِمَّنْ خَلَقَ تَفْضِيلًا', tr: 'Alhamdulillahilladzi \'afani mimma btalani bihi wa faddhalani \'ala katsirim mimman khalaqa tafdila', id: 'Segala puji bagi Allah yang telah menyelamatkanku dari cobaan yang ditimpakan-Nya dan melimpahkan nikmat kepadaku.' },
  { t: 'Doa Sebelum Tidur', a: 'بِاسْمِكَ اللّٰهُمَّ أَمُوْتُ وَأَحْيَا', tr: 'Bismika Allahumma amutu wa ahya', id: 'Dengan nama-Mu ya Allah, aku mati dan aku hidup.' }
]

module.exports = {
  getJson, getHtml,
  tiktok, mediafire, instagram, facebook, twitter,
  youtube, ytSearch, ogMedia, githubRepo, reddit, tiktokMusic, fetchBuffer,
  CONFIG_HELP,
  quranSurah, quranSearch, quranList, quranSearchFull,
  jadwalSholat, jadwalBulan, hijriah, asmaulHusna, DOA,
  deepFindUrl
}
