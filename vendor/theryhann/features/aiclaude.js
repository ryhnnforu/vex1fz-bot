/**
 * ============================================================================
 *  🤖 .claude — AI lewat proxy Anthropic (konfigurasi env bawaan)
 * ============================================================================
 *  Konfigurasi (bisa ditimpa lewat config.ai.anthropic di config.js):
 *    ANTHROPIC_BASE_URL            https://api.apinex.bond
 *    ANTHROPIC_AUTH_TOKEN          sk-apx… (punya owner)
 *    ANTHROPIC_DEFAULT_OPUS_MODEL    claude/opus-5
 *    ANTHROPIC_DEFAULT_SONNET_MODEL  claude/sonnet-5
 *    ANTHROPIC_DEFAULT_HAIKU_MODEL   deepseek/v4-flash
 *
 *  Cara pakai:
 *    .claude <pertanyaan>            model bawaan (sonnet)
 *    .claude haiku <pertanyaan>      model cepat/murah
 *    .claude opus <pertanyaan>       model paling pintar
 *    .claude model                   lihat daftar model
 *
 *  ⚠️ Token terpasang sebagai bawaan supaya langsung jalan tanpa utak-atik
 *     config. Siapa pun yang bisa membaca file bot bisa melihatnya —
 *     jangan sebarkan repo/script ini ke orang lain.
 * ============================================================================
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix

/* ---- konfigurasi: config.js > env > bawaan ---- */
function cfgClaude () {
  const c = config.ai?.anthropic || {}
  return {
    base: String(c.baseUrl || process.env.ANTHROPIC_BASE_URL || 'https://api.apinex.bond').replace(/\/+$/, ''),
    token: String(c.authToken || c.token || process.env.ANTHROPIC_AUTH_TOKEN || 'sk-apx042836b625212e0f12b6a702a618c38167663489c5295f9').trim(),
    models: {
      opus: String(c.opusModel || process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || 'claude/opus-5').trim(),
      sonnet: String(c.sonnetModel || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'claude/sonnet-5').trim(),
      haiku: String(c.haikuModel || process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'deepseek/v4-flash').trim()
    }
  }
}

const MODEL_ALIASES = { opus: 'opus', o: 'opus', sonnet: 'sonnet', s: 'sonnet', haiku: 'haiku', h: 'haiku', cepat: 'haiku', pintar: 'opus' }

/** panggil Anthropic Messages API */
export async function tanyaClaude (prompt, { model = 'sonnet', system, kutip } = {}) {
  const c = cfgClaude()
  if (!c.token) throw new Error('token Anthropic belum dipasang')
  const isi = []
  if (kutip) isi.push({ role: 'user', content: `Konteks:\n${truncate(String(kutip), 2500)}` })
  isi.push({ role: 'user', content: truncate(String(prompt), 4000) })
  const res = await fetch(`${c.base}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': c.token,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: c.models[model] || c.models.sonnet,
      max_tokens: 1024,
      system: system || config.ai?.persona || undefined,
      messages: isi
    }),
    signal: AbortSignal.timeout(40000)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const pesan = data?.error?.message || ''
    if (res.status === 402 || /balance|billing/i.test(pesan)) throw new Error('saldo proxy Anthropic habis (402) — isi ulang atau pakai provider lain')
    if (res.status === 401 || res.status === 403) throw new Error(`token ditolak (HTTP ${res.status})`)
    if (res.status === 429) throw new Error('rate-limit proxy (429) — coba beberapa detik lagi')
    throw new Error(`HTTP ${res.status} ${truncate(pesan, 120)}`)
  }
  const teks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
  if (!teks) throw new Error('respon AI kosong')
  return teks
}

export const claudeCmd = {
  command: ['claude', 'aiclaude', 'aipro'],
  category: 'AI',
  description: '🤖 Tanya AI lewat proxy Anthropic — `.claude [opus|sonnet|haiku] pertanyaan`',
  owner: false,
  limit: 0,
  cooldown: 5,
  contoh: 'haiku buat pantun bot whatsapp',
  run: async m => {
    const c = cfgClaude()
    let q = String(m.q || '').trim()
    if (!q) {
      return m.reply(
        `🤖 *CLAUDE — AI PROXY*\n\n` +
        `\`${P}claude <pertanyaan>\`            model sonnet (bawaan)\n` +
        `\`${P}claude haiku <pertanyaan>\`     cepat & hemat\n` +
        `\`${P}claude opus <pertanyaan>\`      paling pintar\n` +
        `\`${P}claude model\`                  daftar model\n\n` +
        `Bisa juga balas (quote) pesan sebagai konteks.\n` +
        `Mesin: ${c.base}`
      )
    }
    if (/^model$/i.test(q)) {
      return m.reply(
        `🤖 *MODEL TERSEDIA*\n\n` +
        `▸ opus   → \`${c.models.opus}\`\n` +
        `▸ sonnet → \`${c.models.sonnet}\` (bawaan)\n` +
        `▸ haiku  → \`${c.models.haiku}\`\n\n` +
        `Pakai: \`${P}claude haiku halo\``
      )
    }
    let model = 'sonnet'
    const mm = q.match(/^(\S+)\s+([\s\S]*)$/)
    if (mm && MODEL_ALIASES[mm[1].toLowerCase()]) { model = MODEL_ALIASES[mm[1].toLowerCase()]; q = mm[2].trim() }
    if (!q) return m.reply(`Pertanyaannya mana? Contoh: \`${P}claude ${model} halo\``)

    await m.react?.('🤖').catch(() => {})
    try {
      const jawab = await tanyaClaude(q, { model, kutip: m.quoted?.text || '' })
      return m.reply(`🤖 *CLAUDE · ${model}*\n\n${truncate(jawab, 3500)}`)
    } catch (e) {
      await m.react?.('⚠️').catch(() => {})
      return m.reply(
        `⚠️ Claude belum bisa menjawab: ${truncate(String(e?.message || e), 160)}\n\n` +
        `Coba \`${P}ai ${truncate(q, 60)}\` — bot akan pakai provider AI lainnya.`
      )
    }
  }
}

export default { claudeCmd }
