/**
 * ============================================================
 *  lib/pinterest.js — SCRAPER PINTEREST (v7.7.1)
 * ------------------------------------------------------------
 *  Mekanisme "API internal" Pinterest (cookie csrftoken → resource
 *  JSON), dipadatkan dari cookbuk yang dilampirkan pengguna:
 *    • cariPin(query, jml)     — cari foto pin (pinterest.com/search)
 *    • cariVideoPin(query,jml) — cari video pin
 *    • detailPin(id)           — detail 1 pin (media, statistik, board)
 *  Non-fatal: melempar Error berpesan jalas; pemanggil menjawab
 *  pengguna dengan sopan. `fetchImpl` bisa disuntik untuk test offline.
 * ============================================================
 */

const BASE = 'https://id.pinterest.com'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 15; SM-S938B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Xiaomi 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.7151.104 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
]
const acakIp = () => `${(Math.random() * 255 + 1) | 0}.${(Math.random() * 255 + 1) | 0}.${(Math.random() * 255 + 1) | 0}.${(Math.random() * 255 + 1) | 0}`
const acak = (arr) => arr[(Math.random() * arr.length) | 0]
const tidur = ms => new Promise(r => setTimeout(r, ms))

/* ---------------- sesi: cookie csrftoken ---------------- */
async function initSession (f, ua, ip) {
  const res = await f(`${BASE}/`, {
    headers: {
      'User-Agent': ua,
      'X-Forwarded-For': ip,
      'X-Real-IP': ip,
      'Client-IP': ip,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  })
  if (!res || !res.ok) throw new Error(`Pinterest menolak sesi (HTTP ${res ? res.status : '???'})`)
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : [])
  const cookie = raw.map(c => String(c).split(';')[0]).join('; ')
  const csrf = raw.map(c => String(c).split(';')[0]).find(c => c.startsWith('csrftoken='))?.split('=')[1]
  if (!csrf) throw new Error('token sesi Pinterest tidak diberikan (kena rate-limit — coba lagi sebentar)')
  return { csrf, cookie }
}

const headerApi = (ua, ip, csrf, cookie, sourceUrl) => ({
  'User-Agent': ua,
  'X-Forwarded-For': ip,
  'X-Real-IP': ip,
  'Client-IP': ip,
  Accept: 'application/json, text/javascript, */*, q=0.01',
  'x-requested-with': 'XMLHttpRequest',
  'x-pinterest-appstate': 'active',
  'x-pinterest-source-url': sourceUrl,
  'x-csrftoken': csrf,
  origin: BASE,
  referer: BASE + sourceUrl,
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
  Cookie: cookie
})

const petik = (pin, jml) => ({
  id: String(pin.id || ''),
  url: pin.id ? `https://www.pinterest.com/pin/${pin.id}/` : null,
  judul: pin.grid_title || pin.title || pin.seo_title || '',
  deskripsi: (pin.description || '').trim().slice(0, 160) || null,
  gambar: pin.images?.['736x']?.url || pin.images?.orig?.url || null,
  video: pin.videos?.video_list
    ? (pin.videos.video_list.V_720P?.url || pin.videos.video_list.V_HLSV4?.url || pin.videos.video_list.V_HLSV3_MOBILE?.url || null)
    : null,
  warna: pin.dominant_color || null,
  suka: pin.reaction_counts?.['1'] || 0,
  simpan: pin.repin_count || pin.aggregated_pin_data?.aggregated_stats?.saves || 0,
  komentar: pin.comment_count || 0,
  kreator: pin.native_creator?.full_name || pin.pinner?.full_name || null,
  username: pin.native_creator?.username || pin.pinner?.username || null,
  // 📌 v-pinvideo: papan & URL gambar asli (kartu .pin + tombol Download HD)
  board: pin.board?.title || pin.board?.name || pin.board?.board_title || null,
  hd: pin.images?.orig?.url || pin.images?.['736x']?.url || null
})

/* ---------------- pencarian ---------------- */
/**
 * Cari pin di Pinterest.
 * @param {string} query kata kunci
 * @param {number} jml target jumlah (max 25, default 8)
 * @param {{ maxHalaman?: number, fetchImpl?: Function }} [opt]
 */
export async function cariPin (query, jml = 8, opt = {}) {
  query = String(query || '').replace(/\s+/g, ' ').trim()
  if (!query) throw new Error('kata kunci kosong')
  jml = Math.max(1, Math.min(25, Number(jml) || 8))
  const f = opt.fetchImpl || globalThis.fetch
  const ua = acak(USER_AGENTS)
  const ip = acakIp()
  const { csrf, cookie } = await initSession(f, ua, ip)
  const sourceUrl = `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`
  const heads = headerApi(ua, ip, csrf, cookie, sourceUrl)

  let keluar = []
  let bookmark = null
  let hal = 0
  while (keluar.length < jml && hal < Math.max(1, opt.maxHalaman || 2)) {
    hal++
    const options = {
      query, scope: 'pins', appliedProductFilters: '---', domains: null, user: null,
      seoDrawerEnabled: false, applied_unified_filters: null, auto_correction_disabled: false,
      journey_depth: null, source_id: null, source_module_id: null, source_url: sourceUrl,
      static_feed: false, selected_one_bar_modules: null, query_pin_sigs: null, page_size: null,
      price_max: null, price_min: null, query_image_pins: null, request_params: null,
      top_pin_ids: null, article: null, corpus: null, customized_rerank_type: null,
      filters: null, rs: 'typed', redux_normalize_feed: true,
      bookmarks: bookmark ? [bookmark] : []
    }
    const body = new URLSearchParams({ source_url: sourceUrl, data: JSON.stringify({ options, context: {} }) })
    const res = await f(`${BASE}/resource/BaseSearchResource/get/`, { method: 'POST', headers: heads, body })
    if (!res || !res.ok) throw new Error(`pencarian ditolak (HTTP ${res ? res.status : '???'})`)
    const j = await res.json()
    const hasil = j?.resource_response?.data?.results || []
    keluar.push(...hasil)
    bookmark = j?.resource_response?.bookmark || null
    if (!bookmark) break
    if (keluar.length < jml) await tidur(400) /* sopan, jangan spam */
  }
  const pin = keluar.slice(0, jml).map(p => petik(p)).filter(p => p.gambar || p.video)
  if (!pin.length) throw new Error(`tidak ada pin ditemukan untuk "${query.slice(0, 30)}"`)
  return pin
}

/** cari video pin (V_720P/HLSS) */
export async function cariVideoPin (query, jml = 5, opt = {}) {
  query = String(query || '').replace(/\s+/g, ' ').trim()
  if (!query) throw new Error('kata kunci kosong')
  jml = Math.max(1, Math.min(15, Number(jml) || 5))
  const f = opt.fetchImpl || globalThis.fetch
  const ua = acak(USER_AGENTS)
  const ip = acakIp()
  const { csrf, cookie } = await initSession(f, ua, ip)
  const sourceUrl = `/search/videos/?q=${encodeURIComponent(query)}&rs=content_type_filter&filter_location=1`
  const heads = headerApi(ua, ip, csrf, cookie, sourceUrl)

  const options = {
    query, scope: 'videos', appliedProductFilters: '---', domains: null, user: null,
    seoDrawerEnabled: false, rs: 'content_type_filter', redux_normalize_feed: true,
    bookmarks: [], static_feed: false
  }
  const data = JSON.stringify({ options, context: {} })
  const url = `${BASE}/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(sourceUrl)}&data=${encodeURIComponent(data)}&_=${Date.now()}`
  const res = await f(url, { headers: heads })
  if (!res || !res.ok) throw new Error(`pencarian video ditolak (HTTP ${res ? res.status : '???'})`)
  const j = await res.json()
  const hasil = (j?.resource_response?.data?.results || []).filter(p => p.videos?.video_list)
    .slice(0, jml).map(p => petik(p)).filter(p => p.video)
  if (!hasil.length) throw new Error(`tidak ada VIDEO pin untuk "${query.slice(0, 30)}"`)
  return hasil
}

/* ---------------- detail satu pin ---------------- */
export async function detailPin (id, opt = {}) {
  id = String(id || '').replace(/[^0-9]/g, '')
  if (!id) throw new Error('id pin tidak valid')
  const f = opt.fetchImpl || globalThis.fetch
  const ua = acak(USER_AGENTS)
  const ip = acakIp()
  const { csrf, cookie } = await initSession(f, ua, ip)
  const params = new URLSearchParams({
    source_url: `/pin/${id}/`,
    data: JSON.stringify({ options: { field_set_key: 'detailed', id }, context: {} }),
    _: Date.now()
  })
  const res = await f(`${BASE}/resource/PinResource/get/?${params}`, { headers: headerApi(ua, ip, csrf, cookie, `/pin/${id}/`) })
  if (!res || !res.ok) throw new Error(`pin ditolak (HTTP ${res ? res.status : '???'})`)
  const j = await res.json()
  const pin = j?.resource_response?.data
  if (!pin) throw new Error('pin tidak ditemukan (mungkin dihapus/diakhiri)')
  return petik(pin)
}

export default { cariPin, cariVideoPin, detailPin }
