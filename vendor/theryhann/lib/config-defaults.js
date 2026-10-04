/**
 * ============================================================
 *  lib/config-defaults.js — PENAMBAL CONFIG LAMA
 * ------------------------------------------------------------
 *  User yang update dari versi lama menyimpan config.js sendiri.
 *  Kalau versi baru menambah key config, config lama bisa kekurangan
 *  key -> fitur gagal. File ini menambal key yang HILANG saja
 *  (nilai yang sudah ada TIDAK diubah).
 * ============================================================
 */

const DEFAULTS = {
  bot: {
    name: 'THERYHANN!',
    number: '6285177777777',
    usePairingCode: false,
    footer: '© THERYHANN! • WhatsApp Bot MD',
    wm: 'THERYHANN!',
    version: '3.0.0'
  },
  owner: { name: 'THERYHANN', number: '6283199329104', extra: [] },
  display: {
    prefix: '.',
    symbolPrefix: ['=>', '>', '$'],
    menuMode: 'auto',
    menuImage: 'media/menu.jpg',
    thumbnail: 'https://files.catbox.moe/gfiq9p.jpg',
    readCommand: false,
    typing: true,
    public: true,
    antiCall: false,
    autoBio: true,
    packname: 'THERYHANN!',
    author: 'WhatsApp Bot'
  },
  limits: { enable: true, default: 30, cooldown: 2 },
  ai: {
    provider: 'groq',
    model: 'openai',
    pollinationsToken: '',
    geminiKey: '',
    groqKey: '',
    timeout: 20000,
    totalBudget: 30000,
    autoReply: false,
    memoryLength: 12,
    persona: 'Kamu adalah THERYHANN!, asisten WhatsApp AI berbahasa Indonesia.'
  },
  api: { tiktok: 'https://apis-starlights-team.koyeb.app/starlight/tiktok', mediafire: '', ss: 'https://image.thum.io/get/width/1200/crop/900/fullpage/' },
  sessionFolder: 'session',
  databaseFolder: 'database',
  tmpFolder: 'tmp',
  links: { channel: 'https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s', github: 'https://github.com/', donasi: 'https://saweria.co/' }
}

function isPlain (v) {
  return v && typeof v === 'object' && !Array.isArray(v)
}

/** tambal key yang hilang (rekursif). Mengembalikan jumlah key yang ditambah. */
export function ensureConfig (cfg) {
  let added = 0
  const walk = (def, target) => {
    for (const k of Object.keys(def)) {
      if (target[k] === undefined) {
        target[k] = Array.isArray(def[k]) ? [...def[k]] : isPlain(def[k]) ? { ...def[k] } : def[k]
        added++
      } else if (isPlain(def[k]) && isPlain(target[k])) {
        walk(def[k], target[k])
      }
    }
  }
  walk(DEFAULTS, cfg)
  return added
}

export default { ensureConfig, DEFAULTS }
