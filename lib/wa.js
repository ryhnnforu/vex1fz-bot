/**
 * lib/wa.js — loader library WhatsApp (@japofc/baileys)
 *
 * @japofc/baileys adalah ESM → TIDAK BISA require().
 * Wajib lewat import() dinamis yang dipanggil SEBELUM bot mulai
 * (lihat index.js → await initWA()).
 *
 * CATATAN KEAMANAN (audit 3 Okt 2026, versi 2.4.7-new):
 *   - Versi ini LULUS cek IOC kampanye PhantomSub (tanpa auto-follow channel,
 *     tanpa query_id 7871414976211147, tanpa injeksi iklan, tanpa install script).
 *   - Versi 2.0.1–2.4.2 PERNAH dilaporkan berbahaya → versi DI-PIN ketat
 *     di package.json. JANGAN upgrade tanpa audit ulang!
 *   - Setelah connect pertama: cek WhatsApp → Settings → Channels —
 *     kalau bot tiba-tiba follow channel aneh, HAPUS paket ini.
 *
 * Pemakaian di file lain:
 *   const { wa } = require('./lib/wa')   // atau require('../lib/wa')
 *   const { getContentType } = wa()      // panggil DI DALAM fungsi, bukan top-level
 */
let ns = null

async function initWA() {
  if (!ns) {
    ns = await import('@japofc/baileys')
    // pastikan export utama ada
    const need = ['default', 'useMultiFileAuthState', 'fetchLatestBaileysVersion', 'DisconnectReason']
    for (const k of need) {
      if (ns[k] === undefined) throw new Error(`@japofc/baileys tidak mengekspor ${k}`)
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
