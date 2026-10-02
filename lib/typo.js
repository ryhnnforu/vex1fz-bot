/**
 * lib/typo.js — deteksi fitur salah ketik (untuk balasan AI 2c)
 * format wajib: lu salah mengetik fitur, ketiklah ini 'nama fitur'
 */
const registry = require('../commands/index')

/** Levenshtein distance sederhana */
function lev(a, b) {
  a = String(a || '').toLowerCase()
  b = String(b || '').toLowerCase()
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[n]
}

/**
 * Cari fitur paling mirip dengan kata yang diketik user.
 * @returns {{name:string, score:number}|null}
 */
function closestFeature(input, { owner = false } = {}) {
  const name = String(input || '').toLowerCase().replace(/^[.,/]+/, '')
  if (!name || name.length < 2) return null
  const cmds = registry.list()
  let best = null
  for (const cmd of cmds) {
    if (!owner && cmd.access === 'owner') continue
    const cands = [cmd.name, ...(cmd.aliases || [])]
    for (const c of cands) {
      const d = lev(name, c)
      const score = 1 - d / Math.max(name.length, c.length)
      // bonus bila salah ketik mengandung nama fitur penuh atau sebaliknya
      const bonus = (c.includes(name) || name.includes(c)) && Math.min(name.length, c.length) >= 3 ? 0.15 : 0
      const finalScore = Math.min(1, score + bonus)
      if (!best || finalScore > best.score) best = { name: cmd.name, score: finalScore }
    }
  }
  if (best && best.score >= 0.6) return best
  return null
}

module.exports = { lev, closestFeature }
