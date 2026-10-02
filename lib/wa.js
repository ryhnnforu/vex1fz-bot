/**
 * lib/wa.js — loader library WhatsApp (ourin-baileys)
 *
 * ourin-baileys adalah ESM dengan top-level await → TIDAK BISA require().
 * Wajib lewat import() dinamis yang dipanggil SEBELUM bot mulai
 * (lihat index.js → await initWA()).
 *
 * Pemakaian di file lain:
 *   const { wa } = require('./lib/wa')   // atau require('../lib/wa')
 *   const { getContentType } = wa()      // panggil DI DALAM fungsi, bukan top-level
 */
let ns = null

async function initWA() {
  if (!ns) {
    ns = await import('ourin-baileys')
    // pastikan export utama ada
    const need = ['default', 'useMultiFileAuthState', 'fetchLatestBaileysVersion', 'DisconnectReason']
    for (const k of need) {
      if (ns[k] === undefined) throw new Error(`ourin-baileys tidak mengekspor ${k}`)
    }
  }
  return ns
}

function wa() {
  if (!ns) throw new Error('lib/wa belum diinisialisasi — panggil await initWA() dulu di index.js')
  return ns
}

function isReady() { return !!ns }

module.exports = { initWA, wa, isReady }
