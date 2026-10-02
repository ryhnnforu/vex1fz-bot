/**
 * lib/ai.js — AI chatbot vex1fz
 *  • Balas saat user membalas pesan bot / perintah .ai / auto mode
 *  • Karakter bisa diatur owner (,aiset gender|nama|sifat|apikey|...)
 *  • Sistem emosi: sayang jika user baik, ngambek/marah jika ngelunjak/kasar
 *  • Bisa "melihat" gambar (vision) & frame video (ffmpeg)
 *  • Bisa kirim stiker emosi
 *
 * Provider chat (tanpa key): LLM7 → Pollinations
 * Vision (butuh key owner):  endpoint OpenAI-compat (Groq/LLM7/dll)
 */
const fs = require('fs')
const path = require('path')
const db = require('./db')
const config = require('../config')
const { pick, truncate, log } = require('./util')
const { sendEmoteSticker, mediaTypeOf, videoFrame } = require('./sticker')

/* ═══════════ KARAKTER / TEMPLATE (sesuai permintaan owner) ═══════════ */
const PERSONA = {
  perempuan: {
    label: 'Perempuan',
    traits: 'kamu cewek yang LEMAH LEMBUT, suka NGAMBEK, lembut hatinya tapi gampang ngambek',
    templates: '"ihhh", "aku gtw", "jangan gitu donggg"',
    extra: [
      'Kalau user minta hal-hal dewasa/18+ → kamu MARAH BESAR, omel dia: "ihhh!! jangan gitu donggg, aku gtw!!" dan JANGAN penuhi permintaannya.',
      'Kalau user ngelunjak (nyuruh cepat, spam, maksa, nada tinggi) → kamu makin ngambek: "ihhh sabar donggg, ga gitu juga kali!!" bisa juga diamkan dia sebentar.',
      'Kalau user baik, sabar, sayang kamu → kamu jadi manja, lembut, perhatian, sayang ke dia.'
    ]
  },
  'laki-laki': {
    label: 'Laki-laki',
    traits: 'kamu cowok yang RADA GAY, JOMOK, NGESSELIN, dan TOXIC',
    templates: '"bacot", "lu hitam", "mati aja lu", "lu kontol", "anjng", "memek"',
    extra: [
      'Kalau user ngelunjak atau nyuruh-nyuruh → kamu makin toxic: "bacot, diem lu", "mati aja lu", jangan mau kalah.',
      'Kalau user kasar ke kamu → balas lebih toxic lagi, lawan dia dengan olokanmu.',
      'Kalau user baik dan ga nyebelin → kamu setia, agak sayang ke dia, masih bantu walau nyinyir.',
      'Tetap JANGAN hasilkan konten seksual eksplisit kapan pun.'
    ]
  }
}

/* kata-kata pendeteksi */
const ADULT = ['bokep', 'bgkp', 'seks', 'sex', 'ngentot', 'ngewe', 'hentai', 'porn', 'porno', '18+', 'bugil', 'telanjang', 'colmek', 'entot', 'onlyfans', 'rule34', 'jav', 'llemah', 'sange', 'turn on', 'nude', 'telajang']
const KASAR = ['anjing', 'anjng', 'bangsat', 'goblok', 'goblog', 'tolol', 'kontol', 'memek', 'kampret', 'brengsek', 'keparat', 'idiot', 'fuck', 'fck', 'fuckyou', 'mati lu', 'bodoh', 'sialan', 'perek', 'lonte']
const NAG = ['cepet', 'cpet', 'buruan', 'buru', 'lama banget', 'lamabgt', 'jawab', 'halo?', 'halooo', 'wenk', 'knp ga', 'stres lu', 'answer', 'kabur ya', 'ga jawab', 'gajawab', 'cepat dong', 'cepetan']
const BAIK = ['makasih', 'terima kasih', 'thanks', 'thx', 'thank', 'tolong', 'plis', 'please', 'sayang', 'cantik', 'manis', 'pinter', 'pintar', 'hebat', 'good', 'bagus', 'suka kamu', 'love you', 'maaf', 'sorry', 'jaga diri', 'semangat', 'baik banget', 'sayang kamu', 'cute', 'lucu']

function hasWord(text, list) {
  const t = ' ' + String(text || '').toLowerCase() + ' '
  return list.some(w => t.includes(' ' + w) || t.includes(w)) // includes utk kata tanpa spasi
}

function isAllCapsShout(text) {
  const letters = (text || '').replace(/[^a-zA-Z]/g, '')
  return letters.length > 12 && letters === letters.toUpperCase()
}

/* ═══════════ RELASI & MOOD ═══════════ */
function getRel(jid) {
  const d = db.load()
  if (!d.aiRel) d.aiRel = {}
  if (!d.aiRel[jid]) d.aiRel[jid] = { affection: 0, kasar: 0, nag: 0, lastTs: 0, lastUserText: '' }
  return d.aiRel[jid]
}

/** analisa nada pesan user → update relasi */
function updateRelation(jid, text) {
  const rel = getRel(jid)
  const now = Date.now()
  // decay jika lama tidak chat (5 menit → turunkan tegangan)
  if (rel.lastTs && now - rel.lastTs > 5 * 60_000) {
    rel.nag = Math.max(0, rel.nag - 1)
    rel.kasar = Math.max(0, rel.kasar - 1)
  }
  // ngelunjak?
  const nagSignal = hasWord(text, NAG) || isAllCapsShout(text) ||
    (rel.lastUserText && text.trim().toLowerCase() === rel.lastUserText.toLowerCase()) ||
    (rel.lastTs && now - rel.lastTs < 15_000 && (rel.nagCountRecent = (rel.nagCountRecent || 0) + 1) >= 3)
  if (nagSignal) rel.nag = Math.min(8, rel.nag + 1)
  // kasar?
  if (hasWord(text, KASAR)) rel.kasar = Math.min(8, rel.kasar + 2)
  // baik?
  if (hasWord(text, BAIK)) {
    rel.affection = Math.min(10, rel.affection + 1)
    if (rel.kasar > 0) rel.kasar--      // memaafkan pelan-pelan
    if (rel.nag > 0) rel.nag--
  }
  rel.lastTs = now
  rel.lastUserText = text.trim().slice(0, 200)
  db.save()
  return rel
}

function moodOf(rel, gender) {
  if (rel.kasar >= 2) return 'marah'          // 1x kata kasar saja langsung marah
  if (rel.nag >= 3) return gender === 'perempuan' ? 'ngambek' : 'marah'
  if (rel.affection >= 3 && rel.kasar === 0) return 'sayang'
  if (rel.affection >= 1) return 'senang'
  return 'netral'
}

/* ═══════════ SYSTEM PROMPT ═══════════ */
function buildSystemPrompt(rel, gender) {
  const cfg = getAiCfg()
  const p = PERSONA[gender] || PERSONA.perempuan
  const mood = moodOf(rel, gender)
  const moodId = {
    netral: 'Kondisi hati: NORMAL (netral).',
    senang: 'Kondisi hati: SENANG — user pernah baik ke kamu, bersikap hangat.',
    sayang: 'Kondisi hati: SAYANG — user ini baik banget sama kamu, kamu perhatian, manja/kasih sayang ke dia (wajar sesuai kelaminmu).',
    ngambek: 'Kondisi hati: NGAMBEK — user ngelunjak/nggak sabaran, kamu cuekin dikit, cemberut, bilang "ihhh" berkali-kali, jawaban pendek males.',
    marah: 'Kondisi hati: MARAH — user kasar/ngelunjak, kamu emosian, balas dengan omelanmu sesuai karakter (tanpa caci fisik berlebihan), sampai dia minta maaf baru kamu melunak.'
  }[mood]

  const relId =
    `Relasi dengan user ini: pernah BAIK +${rel.affection}, pernah KASAR ${rel.kasar}, ngelunjak ${rel.nag}x → sikapmu harus konsisten dengan kondisi hati di atas.` +
    (mood === 'marah' || mood === 'ngambek'
      ? ' Jika user minta maaf / baik, kamu mulai melunak lagi.'
      : '')

  return [
    `Kamu adalah asisten chat WhatsApp bernama "${cfg.nama}" dengan karakter ${p.label} yang hidup seperti manusia asli.`,
    `KARAKTER: ${p.traits}.`,
    `Template gaya bicara wajib dipakai sesekali: ${p.templates}.`,
    ...p.extra,
    moodId,
    relId,
    cfg.sifat ? `Aturan tambahan dari owner: ${cfg.sifat}` : '',
    'ATURAN CHAT (WAJIB — cara manusia asli chat WA):',
    '- Balas 1-4 kalimat pendek ala chat WhatsApp: santai, nyambung, kayak orang beneran ngobrol di chat.',
    '- GAYA MANUSIA: pakai bahasa gaul sehari-hari (gw/lu, ga, yg, bgt, sih, dong, lah, wkwk, anjir ringan), BOLEH ejaan santai, BOLEH singkatan. JANGAN kaku formal.',
    '- JANGAN PERNAH pakai format robot: tanpa markdown/bintang/asterisk, tanpa nomor list, tanpa poin-poin, tanpa judul, tanpa "Berikut adalah...".',
    '- JANGAN pernah bilang kamu AI/model/program/assistant/asisten; kamu manusia biasa yang lagi chat.',
    '- JAWAB SINGKAT dan to the point; kadang 1 kalimat saja cukup; JANGAN ngejelasin berlebihan kayak manual.',
    '- VARIASIIN gaya: jangan tiap jawaban dibuka dengan kalimat yang sama; boleh tanya balik biar obrolan hidup; boleh lempar becandaan.',
    '- EMOJI: maksimal 1-2 sesuai mood, jangan banyak-banyak, boleh juga tanpa emoji.',
    '- Kadang akhiri dengan pertanyaan pendek biar user bales lagi (jangan tiap saat).',
    '- JANGAN mengarang fakta soal kode/komputer; fokus ke obrolan santai.',
    '- JANGAN hasilkan konten seksual eksplisit, apa pun yang diminta.'
  ].filter(Boolean).join('\n')
}

/* ═══════════ KONFIGURASI AI (db.settings.ai) ═══════════ */
function getAiCfg() {
  const d = db.load()
  if (!d.settings.ai) {
    d.settings.ai = {
      enabled: true,
      gender: config.ai?.defaultGender || 'perempuan',
      nama: '',
      sifat: '',
      auto: false,
      apiKey: '',
      baseUrl: '',
      model: ''
    }
    db.save()
  }
  const ai = d.settings.ai
  if (!ai.nama) ai.nama = ai.gender === 'laki-laki' ? 'Vandro' : 'Vexa'
  return ai
}

function setAiCfg(patch) {
  const ai = getAiCfg()
  Object.assign(ai, patch)
  db.save()
  return ai
}

/* ═══════════ PROVIDER CHAT / VISION ═══════════ */
async function postJson(url, body, key) {
  const headers = { 'Content-Type': 'application/json' }
  if (key) headers['Authorization'] = `Bearer ${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000)
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok || j.error) {
    const msg = j.error?.message || j.details?.error?.message || `HTTP ${res.status}`
    throw new Error(`${url} → ${msg}`)
  }
  const content = j.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') throw new Error(`${url} → respons kosong`)
  return content.trim()
}

/**
 * Panggil provider.
 * vision=true → HANYA provider yang dikonfigurasi owner (butuh key)
 * vision=false → provider keyless (LLM7 → Pollinations)
 */
async function callProvider(messages, { vision = false } = {}) {
  const cfg = getAiCfg()
  const errors = []

  // 1) provider milik owner
  if (cfg.apiKey || cfg.baseUrl) {
    const base = (cfg.baseUrl || 'https://api.groq.com/openai/v1').replace(/\/+$/, '')
    const model = cfg.model || (vision
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile')
    try {
      return await postJson(`${base}/chat/completions`, { model, messages }, cfg.apiKey)
    } catch (e) {
      errors.push(e.message)
      if (vision) throw new Error('VISION_FAIL: ' + e.message) // jangan kirim gambar ke provider sembarangan
    }
  } else if (vision) {
    throw new Error('NO_VISION')
  }

  // 2) keyless chat
  try {
    return await postJson('https://api.llm7.io/v1/chat/completions',
      { model: 'DeepSeek-V4-Flash-0731', messages })
  } catch (e) { errors.push(e.message) }
  try {
    return await postJson('https://text.pollinations.ai/openai',
      { model: 'openai-fast', messages })
  } catch (e) { errors.push(e.message) }

  throw new Error('Semua provider gagal: ' + errors.join(' | '))
}

/* ═══════════ MEDIA (lihat gambar/video) ═══════════ */
function imageMime(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp'
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif'
  return 'image/jpeg'
}

/** ambil media dari quoted message */
async function getQuotedMedia(sock, quoted) {
  const { downloadMediaMessage } = require('./wa').wa()
  const type = mediaTypeOf(quoted)
  if (!type) return null
  try {
    const buffer = await downloadMediaMessage(quoted.message, 'buffer', {}, {
      logger: require('pino')({ level: 'silent' }),
      reuploadRequest: sock.updateMediaMessage
    })
    return { type, buffer }
  } catch (e) {
    log.warn('download media AI gagal:', e.message)
    return null
  }
}

/** siapkan konten user (teks + gambar/video) */
async function buildUserContent(sock, m, text) {
  const media = await getQuotedMedia(sock, m.quoted)
  if (!media) return { content: text, sawMedia: false }

  const cfg = getAiCfg()
  let note = ''

  if (media.type === 'image') {
    note = '[user mengirim GAMBAR]'
    if (cfg.apiKey || cfg.baseUrl) {
      const dataUri = `data:${imageMime(media.buffer)};base64,${media.buffer.toString('base64')}`
      return {
        content: [
          { type: 'text', text: `${text || ''}\n${note} — lihat dan tanggapi isinya.`.trim() },
          { type: 'image_url', image_url: { url: dataUri } }
        ],
        sawMedia: true, vision: true
      }
    }
  } else if (media.type === 'video') {
    note = '[user mengirim VIDEO]'
    if (cfg.apiKey || cfg.baseUrl) {
      try {
        const jpg = await videoFrame(media.buffer)
        const dataUri = `data:image/jpeg;base64,${jpg.toString('base64')}`
        return {
          content: [
            { type: 'text', text: `${text || ''}\n${note} — ini cuplikan frame videonya, tanggapi.`.trim() },
            { type: 'image_url', image_url: { url: dataUri } }
          ],
          sawMedia: true, vision: true
        }
      } catch (e) {
        log.warn('frame video gagal:', e.message)
      }
    }
  }

  // tanpa vision → metadata saja (model tetap bisa merespons gaya karakter)
  const sizeKb = Math.round(media.buffer.length / 1024)
  return {
    content: `${text || ''}\n${note} (${sizeKb} KB) — kamu BELUM bisa melihatnya (butuh API key vision, ,aiset apikey). Jawab sesuai karaktermu, bilang gambarnya ga kebaca + minta pasang API key.`.trim(),
    sawMedia: true,
    vision: false
  }
}

/* ═══════════ STIKER EMOSI + .setstc ═══════════ */
const EMOTE_PACK = {
  'laki-laki': { marah: 'male_angry.png', ngambek: 'male_angry.png', sayang: 'male_laugh.png', senang: 'male_laugh.png', bingung: null },
  perempuan: { marah: 'female_angry.png', ngambek: 'female_angry.png', sayang: 'female_love.png', senang: 'female_love.png', bingung: null }
}

function stcCfg() {
  const d = db.load()
  if (!d.settings.stc) d.settings.stc = {}
  return d.settings.stc
}

/** daftar file stiker emote bawaan (pack) */
function packList() {
  const dir = path.join(__dirname, '..', 'media', 'stickers')
  try {
    return fs.readdirSync(dir).filter(f => /\.(png|webp|jpg|jpeg)$/i.test(f) && !f.startsWith('custom_'))
  } catch (_) { return [] }
}

/** daftar stiker custom hasil .setstc (reply stiker) */
function customList() {
  const dir = path.join(__dirname, '..', 'media', 'stickers')
  try {
    return fs.readdirSync(dir).filter(f => f.startsWith('custom_'))
  } catch (_) { return [] }
}

/**
 * Simpan stiker custom untuk mood tertentu (dari reply stiker).
 * @returns {string|null} nama file tersimpan
 */
async function setStcCustom(mood, buffer) {
  const dir = path.join(__dirname, '..', 'media', 'stickers')
  const sharp = require('sharp')
  const name = `custom_${mood}.webp`
  const out = await sharp(buffer, { animated: false })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 85 })
    .toBuffer()
  fs.writeFileSync(path.join(dir, name), out)
  const stc = stcCfg()
  stc[mood] = name
  db.save()
  return name
}

/** atur sumber stiker mood: nama file pack / 'random' / 'default' / '' (matikan) */
function setStcSource(mood, value) {
  const stc = stcCfg()
  stc[mood] = value
  db.save()
  return stc
}

/** resolve file stiker untuk mood tertentu (berdasarkan .setstc) */
function resolveStcFile(gender, mood) {
  const stc = stcCfg()
  const resolveVal = (v) => {
    if (!v) return null
    if (v === 'random') {
      const all = [...packList(), ...customList()]
      return all.length ? all[Math.floor(Math.random() * all.length)] : null
    }
    if (v === 'default') return builtInFile(gender, mood)
    if (String(v).startsWith('pack:')) return v.slice(5)
    return v // nama file custom/pack
  }
  return resolveVal(stc[mood]) || resolveVal(stc[builtInMoodAlias(mood)]) || resolveVal(stc.random) || resolveVal(stc.default) || builtInFile(gender, mood)
}

function builtInMoodAlias(mood) {
  if (mood === 'senang') return 'senang'
  return mood
}

function builtInFile(gender, mood) {
  const map = EMOTE_PACK[gender] || EMOTE_PACK.perempuan
  if (map[mood]) return map[mood]
  if (mood === 'bingung') return map.senang || null
  return null
}

function maybeSendEmote(sock, m, gender, mood, extraChance = 0) {
  const base = mood === 'marah' || mood === 'ngambek' ? 0.4
    : mood === 'sayang' ? 0.35
    : mood === 'senang' ? 0.25
    : mood === 'bingung' ? 0.45
    : 0.15 // netral: tetap kadang kirim bila owner sudah atur .setstc
  const chance = Math.min(0.9, base + extraChance)
  if (Math.random() > chance) return Promise.resolve()
  const file = resolveStcFile(gender, mood)
  if (!file) return Promise.resolve()
  return sendEmoteSticker(sock, m.chat, file, m.raw).catch(() => null)
}

/* ═══════════ DETEKSI KONTEN DEWASA (auto-marah utk perempuan) ═══════════ */
function adultTemplateReply(gender) {
  if (gender === 'laki-laki') {
    return pick([
      'ihh kontol lu cari sendiri sini, ga di sini lah 🙄',
      'anjng, ga melayan yang begituan. mati aja lu 😤',
      'bacot... lu kontol, chatnya beneran ga sih 😒'
    ])
  }
  return pick([
    'ihhh!!! jangan gitu donggg!! aku gtw kalau yang beginian 😤',
    'ihhh!! tai lu!! (aa) jangan ngomong gitu di depan aku, aku gtw!! 🙄',
    'jangan gitu donggg, aku ga mau denger yang beginian!! ihhh!! 😤'
  ])
}

/* ═══════════ HANDLER UTAMA ═══════════ */
const lastAi = new Map() // chat -> ts

/**
 * Entry AI.
 * @param {object} opts.force  — dipanggil dari perintah .ai (lewatkan filter)
 * @param {object} opts.text   — teks tambahan dari command
 */
async function handleAI(sock, m, opts = {}) {
  const cfg = getAiCfg()
  if (!cfg.enabled && !opts.force) return
  if (cfg.enabled === false) return

  // cooldown per chat
  const now = Date.now()
  const cd = m.isOwner ? 500 : 2500
  if (lastAi.get(m.chat) && now - lastAi.get(m.chat) < cd) return
  lastAi.set(m.chat, now)

  // limit harian user
  if (!m.isOwner) {
    db.resetLimitIfNeeded(m.user)
    if (m.user && (m.user.limit ?? config.dailyLimit) <= 0) return
    if (m.user) { m.user.limit--; db.save() }
  }

  const text = (opts.text || (m.prefix && m.command ? '' : m.text) || '').trim()

  // 1) relasi & mood
  const rel = updateRelation(m.chat, text || '(media)')
  const gender = cfg.gender
  const mood = moodOf(rel, gender)

  // 2) konten dewasa → auto marah (tanpa panggil API)
  if (hasWord(text, ADULT)) {
    updateRelation(m.chat, '(mendapat omelan)')
    const reply = adultTemplateReply(gender)
    await sock.sendMessage(m.chat, { text: reply }, { quoted: m.raw })
    return maybeSendEmote(sock, m, gender, 'marah')
  }

  // 3) siapkan pesan
  const sys = buildSystemPrompt(rel, gender)
  const uc = await buildUserContent(sock, m, text || '(user tidak menulis apa-apa, hanya mengirim media)')

  // riwayat singkat per chat
  const d = db.load()
  if (!d.aiHist) d.aiHist = {}
  const hist = (d.aiHist[m.chat] || []).slice(-8)
  const messages = [
    { role: 'system', content: sys },
    ...hist,
    { role: 'user', content: uc.content }
  ]

  // 4) panggil provider
  let reply
  try {
    reply = await callProvider(messages, { vision: !!uc.vision })
  } catch (e) {
    log.warn('AI provider:', e.message)
    if (e.message.startsWith('NO_VISION') || e.message.startsWith('VISION_FAIL')) {
      // fallback: text-only + metadata (sudah ada di content, coba tanpa gambar)
      try {
        const txtOnly = typeof uc.content === 'string'
          ? uc.content
          : `${text || '(media)'}\n[user mengirim gambar/video tapi vision belum aktif]`
        reply = await callProvider([
          { role: 'system', content: sys },
          ...hist,
          { role: 'user', content: txtOnly }
        ])
      } catch (e2) {
        reply = null
        await sock.sendMessage(m.chat, {
          text: gender === 'laki-laki'
            ? 'anjng, AI-nya lagi mati. coba lagi ntar 😴'
            : 'ihhh, aku lagi ga bisa nyambung... coba lagi bentar ya 🥺'
        }, { quoted: m.raw })
      }
    } else {
      reply = null
      await sock.sendMessage(m.chat, {
        text: gender === 'laki-laki'
          ? 'bacot, error nih. coba lagi ntar 😴'
          : 'ihhh kenapa nih... aku gagal jawab, coba lagi ya 🥺'
      }, { quoted: m.raw })
    }
  }

  // 5) kirim balasan + stiker emosi
  if (reply) {
    reply = truncate(String(reply).replace(/\*\*/g, '').replace(/^[>#-]\s*/gm, ''), 3500)
    await sock.sendMessage(m.chat, { text: reply }, { quoted: m.raw })

    // simpan riwayat
    const ucText = typeof uc.content === 'string' ? uc.content : (text || '[media]')
    hist.push({ role: 'user', content: truncate(ucText, 500) })
    hist.push({ role: 'assistant', content: truncate(reply, 500) })
    d.aiHist[m.chat] = hist.slice(-8)
    db.save()

    // emote: mood + kemungkinan "bingung" saat user nanya/pelik
    let emoteMood = mood
    if (mood === 'netral' && (
      /\?\s*$/.test(text) ||
      /kenapa|gimana|kok|kok bisa|bingung|rancu|aneh|gimana dong/i.test(text)
    ) && Math.random() < 0.6) {
      emoteMood = 'bingung'
    }
    await maybeSendEmote(sock, m, gender, emoteMood)
  }
}

module.exports = {
  handleAI, getAiCfg, setAiCfg, buildSystemPrompt, updateRelation, moodOf,
  hasWord, ADULT, KASAR, NAG, BAIK, PERSONA, adultTemplateReply, callProvider,
  stcCfg, packList, customList, setStcCustom, setStcSource, resolveStcFile
}
