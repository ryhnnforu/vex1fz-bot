/**
 * ============================================================
 *  AI PROVIDER — THERYHANN!
 *  Default: Pollinations (GRATIS, tanpa API key)
 *  Cadangan: Gemini / Groq (opsional, isi API key di config.js)
 *  Ada retry otomatis karena API gratis kadang rate-limit (402/429)
 * ============================================================
 */
import { config } from '../config.js'
import { getBuffer, getJSON, fetchWithTimeout, saveTmp } from './functions.js'
import { loadDB } from './database.js'

const POLL_TEXT = 'https://text.pollinations.ai/openai'
const POLL_TEXT_GET = 'https://text.pollinations.ai/'
const POLL_IMAGE = 'https://image.pollinations.ai/prompt/'

/** header auth kalau user punya token Pollinations (gratis di auth.pollinations.ai) */
function authHeaders () {
  const t = config.ai.pollinationsToken
  return t ? { Authorization: 'Bearer ' + t } : {}
}

/** kunci AI aktif: settings (.setaikey) menimpa config.js */
export function aiKeys () {
  let db = {}
  try { db = loadDB('settings', {}) } catch {}
  const ak = db.aiKeys || {}
  return {
    groq: String(ak.groq || config.ai.groqKey || process.env.GROQ_API_KEY || '').trim(),
    openrouter: String(ak.openrouter || config.ai.openrouterKey || process.env.OPENROUTER_API_KEY || '').trim(),
    gemini: String(ak.gemini || config.ai.geminiKey || process.env.GEMINI_API_KEY || '').trim()
  }
}
export function aiProviderAktif () {
  const k = aiKeys()
  return k.groq ? 'groq (utama' + (groq.modelAktif ? ' · ' + groq.modelAktif : '') + ')' : k.openrouter ? 'openrouter' : k.gemini ? 'gemini' : 'pollinations (tanpa key — pasang Groq: .setaikey groq <key>)'
}

/** persona aktif (bisa diubah owner lewat `.persona set`) */
export function activePersona () {
  try {
    const db = loadDB('settings', {})
    return db.aiPersona || config.ai.persona
  } catch {
    return config.ai.persona
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * Chat AI dengan riwayat percakapan.
 * @param {string} prompt pesan user
 * @param {Array} history [{role:'user'|'assistant', content:'...'}]
 * @param {object} opt { system, model }
 * @returns {Promise<string>}
 */
export async function aiChat (prompt, history = [], opt = {}) {
  const system = opt.system || activePersona()
  const messages = [
    { role: 'system', content: system },
    ...(history || []).slice(-(config.ai.memoryLength * 2)),
    { role: 'user', content: String(prompt).slice(0, 4000) }
  ]

  // v7.9.1: urutan provider — key dari .setaikey (settings) > config.js.
  //   1) Groq (GRATIS, key gampang: console.groq.com → login email → Create API Key)
  //   2) OpenRouter (GRATIS model :free, openrouter.ai/keys)
  //   3) Gemini (aistudio.google.com)
  //   4) Pollinations (tanpa key, cadangan terakhir — sering rate-limit)
  const k = aiKeys()
  const providers = [
    ...(cfgClaude().token ? [{ name: 'claude-proxy', run: () => claudeProxy(messages) }] : []),
    ...(k.groq ? [{ name: 'groq', run: () => groq(messages, k.groq) }] : []),
    ...(k.openrouter ? [{ name: 'openrouter', run: () => openrouter(messages, k.openrouter) }] : []),
    ...(k.gemini ? [{ name: 'gemini', run: () => gemini(messages, k.gemini) }] : []),
    { name: 'pollinations', run: () => pollinations(messages, opt.model || config.ai.model) },
    { name: 'pollinations-get', run: () => pollinationsGet(prompt, system) }
  ]

  const deadline = Date.now() + (config.ai.totalBudget || 40000)
  let lastErr; const semuaErr = []
  for (const p of providers) {
    // 2x percobaan per provider — API gratis sering balas 402/429/502 sesaat
    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() > deadline) break
      try {
        const out = await p.run()
        if (out && out.trim()) return out.trim()
        throw new Error('Respon AI kosong')
      } catch (e) {
        lastErr = new Error(`[${p.name}] ${e.message}`)
        if (attempt === 1 || /HTTP 401/.test(e.message)) semuaErr.push(`${p.name}: ${String(e.message).slice(0, 90)}`)
        if (/HTTP 401/.test(e.message)) break
        if (attempt === 0 && Date.now() + 1500 < deadline) await sleep(1500)
      }
    }
    if (Date.now() > deadline) break
  }
  throw new Error(
    'AI gagal menjawab.\n' + semuaErr.map(x => '• ' + x).join('\n') + '\n' +
    (aiKeys().groq ? (semuaErr.some(x => /groq: HTTP 401/.test(x)) ? 'Key Groq DITOLAK (401) → buat key baru di console.groq.com lalu `.setaikey groq gsk_xxx`.' : 'Coba beberapa detik lagi.') : 'Owner: pasang API key GRATIS Groq (1 menit, tanpa kartu): buka console.groq.com → Create API Key → ketik `.setaikey groq gsk_xxx`.')
  )
}

/* ---------- v-aiclaude: proxy Anthropic (konfigurasi bawaan) ----------
 * Base URL / token / model mengikuti config.ai.anthropic bila ada,
 * kalau tidak pakai bawaan (proxy api.apinex.bond milik owner). */
function cfgClaude () {
  const c = config.ai?.anthropic || {}
  return {
    base: String(c.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.apinex.bond').replace(/\/+$/, ''),
    token: String(c.authToken || c.token || process.env.ANTHROPIC_AUTH_TOKEN || 'sk-apx042836b625212e0f12b6a702a618c38167663489c5295f9').trim(),
    model: String(c.sonnetModel || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'claude/sonnet-5').trim()
  }
}
async function claudeProxy (messages) {
  const c = cfgClaude()
  if (!c.token) throw new Error('token anthropic tidak ada')
  const sys = messages.find(x => x.role === 'system')?.content
  const chat = messages.filter(x => x.role !== 'system').map(x => ({ role: x.role, content: x.content }))
  const res = await fetch(c.base + '/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': c.token, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: c.model, max_tokens: 1024, system: sys, messages: chat }),
    signal: AbortSignal.timeout(30000)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + String(data?.error?.message || '').slice(0, 120))
  const teks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
  if (!teks) throw new Error('respon kosong')
  return teks
}

async function pollinations (messages, model = 'openai') {
  const res = await fetchWithTimeout(
    POLL_TEXT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'THERYHANN-Bot/1.0', ...authHeaders() },
      body: JSON.stringify({ model, messages, seed: Math.floor(Math.random() * 1e9), private: true })
    },
    config.ai.timeout
  )
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  const txt = data?.choices?.[0]?.message?.content
  if (!txt) throw new Error('body kosong')
  return txt
}

/** cadangan: endpoint GET sederhana (tanpa riwayat percakapan) */
async function pollinationsGet (prompt, system) {
  const url =
    POLL_TEXT_GET +
    encodeURIComponent(String(prompt).slice(0, 1500)) +
    `?model=openai&system=${encodeURIComponent(String(system).slice(0, 500))}&referrer=THERYHANN`
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'THERYHANN-Bot/1.0' } }, config.ai.timeout)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const txt = await res.text()
  if (!txt || txt.trim().startsWith('{')) throw new Error('body bukan teks')
  return txt
}

async function gemini (messages, key) {
  const systemInstruction = messages.filter(m => m.role === 'system').map(m => m.content).join('\n')
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemInstruction }] } })
    },
    config.ai.timeout
  )
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 150))
  const data = await res.json()
  const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n')
  if (!txt) throw new Error('body kosong')
  return txt
}

async function openrouter (messages, key) {
  const res = await fetchWithTimeout(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'HTTP-Referer': 'https://github.com/theryhann', 'X-Title': 'THERYHANN Bot' },
      body: JSON.stringify({ model: config.ai.openrouterModel || 'meta-llama/llama-3.3-70b-instruct:free', messages, temperature: 0.7 })
    },
    config.ai.timeout
  )
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const data = await res.json()
  const txt = data?.choices?.[0]?.message?.content
  if (!txt) throw new Error('body kosong')
  return txt
}

/* v7.29.0 — Groq UTAMA: coba beberapa model berurutan (llama-3.3-70b kini "Enterprise" di
   sebagian akun → 403/404; gpt-oss-120b & llama-3.1-8b-instant tersedia di tier gratis).
   Pesan error API ikut dilaporkan supaya owner tahu sebabnya (key salah / model / limit). */
export const GROQ_MODELS = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b', 'meta-llama/llama-4-scout-17b-16e-instruct']
async function groq (messages, key) {
  const pilihan = [...new Set([config.ai.groqModel, ...GROQ_MODELS].filter(Boolean))]
  let lastErr = null
  for (const model of pilihan) {
    try {
      const res = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
          body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 })
        },
        config.ai.timeout
      )
      if (!res.ok) {
        let pesan = ''
        try { const j = await res.json(); pesan = j?.error?.message || JSON.stringify(j).slice(0, 120) } catch { pesan = await res.text().catch(() => '') }
        const e = new Error(`HTTP ${res.status} ${model}: ${String(pesan).slice(0, 140)}`)
        /* 401/403 = key salah / tidak berhak → tidak perlu coba model lain */
        if (res.status === 401) throw e
        lastErr = e; continue
      }
      const data = await res.json()
      const txt = data?.choices?.[0]?.message?.content
      if (!txt) { lastErr = new Error(`${model}: body kosong`); continue }
      groq.modelAktif = model
      return txt
    } catch (e) { if (/HTTP 401/.test(e.message)) throw e; lastErr = e }
  }
  throw lastErr || new Error('semua model Groq gagal')
}
groq.modelAktif = ''

/* ------------------------- GAMBAR ------------------------- */
/**
 * Generate gambar dari teks (gratis, tanpa API key)
 * @returns {Promise<Buffer>}
 */
export async function aiImage (prompt, opt = {}) {
  const w = opt.width || 768
  const h = opt.height || 768
  const model = opt.model || 'flux'
  let lastErr
  for (let i = 0; i < 3; i++) {
    const seed = opt.seed || Math.floor(Math.random() * 1e9)
    const url =
      POLL_IMAGE +
      encodeURIComponent(String(prompt)) +
      `?width=${w}&height=${h}&model=${model}&nologo=true&enhance=true&seed=${seed}&referrer=THERYHANN`
    try {
      const buf = await getBuffer(url, { timeout: 120000 }, 0)
      if (buf.length < 1500) throw new Error('gambar terlalu kecil / gagal')
      return buf
    } catch (e) {
      lastErr = e
      await sleep(1500 * (i + 1))
    }
  }
  throw lastErr || new Error('Gagal membuat gambar')
}

/** daftar model gambar yang tersedia */
export async function aiImageModels () {
  try {
    return await getJSON('https://image.pollinations.ai/models', {}, 0)
  } catch {
    return ['flux', 'turbo']
  }
}

/* ------------------------- SUARA ------------------------- */
/** Text to speech (gratis) -> buffer mp3 */
/* v7.31.0 — TTS via Microsoft Edge neural voices (msedge-tts, tanpa key). Pollinations openai-audio sudah mati (404). */
export const EDGE_VOICES = {
  gadis: 'id-ID-GadisNeural', ardi: 'id-ID-ArdiNeural',                       // Indonesia
  nova: 'id-ID-GadisNeural', shimmer: 'id-ID-GadisNeural', alloy: 'id-ID-ArdiNeural', onyx: 'id-ID-ArdiNeural', echo: 'en-US-GuyNeural', fable: 'en-GB-RyanNeural', // alias lama
  jenny: 'en-US-JennyNeural', guy: 'en-US-GuyNeural', aria: 'en-US-AriaNeural', ryan: 'en-GB-RyanNeural', sonia: 'en-GB-SoniaNeural',
  nanami: 'ja-JP-NanamiNeural', keita: 'ja-JP-KeitaNeural', sunhi: 'ko-KR-SunHiNeural', xiaoxiao: 'zh-CN-XiaoxiaoNeural',
  yasmin: 'ms-MY-YasminNeural', osman: 'ms-MY-OsmanNeural', salma: 'ar-EG-SalmaNeural', dalia: 'es-MX-DaliaNeural', denise: 'fr-FR-DeniseNeural'
}
/* v7.32.0 — TTS anti-gagal: validasi MP3 (header ID3/frame sync + ukuran wajar),
   2x percobaan Edge, lalu fallback Google Translate TTS (tanpa key, per bahasa).
   Buffer hasil SELALU MP3 valid supaya client tidak menampilkan
   "audio tidak tersedia karena ada masalah pada file". */
const mp3Valid = buf => {
  if (!buf || buf.length < 1500) return false
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true // ID3
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true // frame sync
  return false
}
async function edgeSekali (text, voice, { rate, pitch }) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('../shims/msedge-tts.mjs')
  const v = EDGE_VOICES[String(voice).toLowerCase()] || (/-.*Neural$/.test(voice) ? voice : EDGE_VOICES.gadis)
  const tts = new MsEdgeTTS()
  try {
    await tts.setMetadata(v, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(String(text).slice(0, 1500), { rate, pitch })
    const buf = await new Promise((res, rej) => { const b = []; const t = setTimeout(() => rej(new Error('TTS timeout')), 60000); audioStream.on('data', d => b.push(d)); audioStream.on('end', () => { clearTimeout(t); res(Buffer.concat(b)) }); audioStream.on('error', e => { clearTimeout(t); rej(e) }) })
    if (!mp3Valid(buf)) throw new Error('Edge mengembalikan audio rusak (bukan MP3)')
    return { buf, mesin: 'edge-' + v.split('-')[0].toLowerCase() }
  } finally { try { tts.close?.() } catch {} }
}
const GTTS_BAHASA = { gadis: 'id', ardi: 'id', nova: 'id', shimmer: 'id', alloy: 'id', onyx: 'id', jenny: 'en', guy: 'en', aria: 'en', echo: 'en', ryan: 'en', sonia: 'en', fable: 'en', nanami: 'ja', keita: 'ja', sunhi: 'ko', xiaoxiao: 'zh-CN', yasmin: 'ms', osman: 'ms', salma: 'ar', dalia: 'es', denise: 'fr' }
/** fallback: Google Translate TTS (gratis, tanpa key) — teks dipotong per 190 karakter */
async function gtts (text, voice) {
  const tl = GTTS_BAHASA[String(voice).toLowerCase()] || 'id'
  const kalimat = String(text).slice(0, 1200).match(/[^.!?\n]{1,190}(?:[.!?\s]|$)|.{1,190}/g) || [text]
  const bagian = []
  for (const k of kalimat.slice(0, 8)) {
    const q = k.trim(); if (!q) continue
    const r = await fetchWithTimeout(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=${tl}&client=tw-ob`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 25000)
    if (!r.ok) throw new Error('gTTS HTTP ' + r.status)
    const b = Buffer.from(await r.arrayBuffer())
    if (!mp3Valid(b)) throw new Error('gTTS mengembalikan audio rusak')
    bagian.push(b)
  }
  if (!bagian.length) throw new Error('gTTS: teks kosong')
  return { buf: Buffer.concat(bagian), mesin: 'google-' + tl }
}
export async function aiTTS (text, voice = 'gadis', { rate = '+0%', pitch = '+0Hz' } = {}) {
  text = String(text || '').trim()
  if (!text) throw new Error('Teks kosong — contoh: .tts Halo apa kabar')
  let err
  for (let i = 0; i < 2; i++) {
    try { return await edgeSekali(text, voice, { rate, pitch }) } catch (e) { err = e; await sleep(1200) }
  }
  try { return await gtts(text, voice) } catch (e2) { throw new Error(`Edge gagal (${err?.message || '?'}) & cadangan gagal (${e2.message})`) }
}

export const ttsVoices = Object.keys(EDGE_VOICES)

/* ------------------------- UTIL ------------------------- */
export function cleanAIText (text = '') {
  return String(text)
    .replace(/<\|[^>]*\|>/g, '')
    .replace(/\[object Object\]/g, '')
    .trim()
}

export { saveTmp }
export default { aiChat, aiImage, aiTTS, aiImageModels, ttsVoices, cleanAIText, activePersona, aiKeys, aiProviderAktif }
