/**
 * ════════════════════════════════════════════════════════════
 *  VEX1FZ BOT — KONFIGURASI UTAMA
 *  Semua pengaturan penting ada di file ini / environment (.env)
 * ════════════════════════════════════════════════════════════
 */
const path = require('path')

// opsional: dukungan .env tanpa dependensi (auto-load jika file ada)
try {
  const fs = require('fs')
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    const s = line.trim()
    if (!s || s.startsWith('#')) continue
    const i = s.indexOf('=')
    if (i < 0) continue
    const k = s.slice(0, i).trim()
    const v = s.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!(k in process.env)) process.env[k] = v
  }
} catch (_) {}

module.exports = {
  /* ── Identitas bot ─────────────────────────────────────── */
  botName: 'vex1fz',
  version: 'v1.0.0',
  author: 'vex1fz',

  /* ── Owner (jangan diubah kalau tidak perlu) ───────────── */
  ownerNumber: '6283199329104',        // nomor owner (PN)
  ownerLid: '168036921303189@lid',     // LID owner

  /* ── Nomor bot (BISA DIATUR) ───────────────────────────── */
  // Isi nomor bot WhatsApp dengan format internasional tanpa "+".
  // Contoh: '6281234567890'
  // Bisa juga lewat .env / environment: BOT_NUMBER=6281234567890
  botNumber: process.env.BOT_NUMBER || '',

  // Mode login: 'pairing' (kode 8 digit) atau 'qr' (scan QR)
  loginMode: (process.env.LOGIN_MODE || 'pairing').toLowerCase(),

  /* ── Prefix ────────────────────────────────────────────── */
  // prefix user  : "."  (semua user)
  // prefix owner : "/", ",", "=>" (hanya owner)
  userPrefix: '.',
  ownerPrefixes: ['/', ',', '=>'],

  /* ── Mode bot ──────────────────────────────────────────── */
  // 'public' = semua orang bisa pakai | 'self' = hanya owner
  mode: (process.env.BOT_MODE || 'public').toLowerCase(),

  /* ── Server game (minigame HTML) ───────────────────────── */
  port: parseInt(process.env.PORT || '8080', 10),
  // WAJIB diisi untuk panel Pterodactyl / hosting publik,
  // contoh: 'https://abcde12345.pterodactyl.host:20123'
  // (untuk Termux cukup kosong -> http://localhost:PORT)
  publicUrl: (process.env.PUBLIC_URL || '').replace(/\/+$/, ''),

  /* ── Donasi (tampil di .menudonasi) ────────────────────── */
  donation: {
    dana: '083199329104',
    gopay: '083199329104',
    ovo: '083199329104',
    saweria: 'https://saweria.co/vex1fz'
  },

  /* ── Downloader ────────────────────────────────────────── */
  // TikTok pakai tikwm (tanpa API key, langsung jalan).
  // Instagram / Facebook / Twitter: isi endpoint milikmu.
  //   {url}   -> akan diganti dengan link tujuan
  //   {apikey} -> akan diganti isi apiKeys di bawah
  // Contoh (lolhuman, key gratis via telegram @BotLolhuman):
  //   instagram: ['https://api.lolhuman.xyz/api/download/instagram?apikey={apikey}&url={url}']
  apiKeys: {
    lolhuman: process.env.LOLHUMAN_APIKEY || ''
  },
  downloaderEndpoints: {
    instagram: (process.env.INSTAGRAM_API || '').split(',').filter(Boolean),
    facebook: (process.env.FACEBOOK_API || '').split(',').filter(Boolean),
    twitter: (process.env.TWITTER_API || '').split(',').filter(Boolean),
    youtube: (process.env.YOUTUBE_API || '').split(',').filter(Boolean),
    generic: (process.env.GENERIC_DL_API || '').split(',').filter(Boolean)
  },

  /* ── Path ──────────────────────────────────────────────── */
  sessionDir: process.env.SESSION_DIR || path.join(__dirname, 'auth'),
  // DB_FILE bisa diarahkan ke volume (Railway/panel): DB_FILE=/data/db.json
  dbFile: process.env.DB_FILE || path.join(__dirname, 'database', 'db.json'),
  gamesDir: path.join(__dirname, 'games'),

  /* ── Limit harian user biasa (owner = unlimited) ───────── */
  dailyLimit: parseInt(process.env.DAILY_LIMIT || '100', 10),

  /* ── AI chatbot ─────────────────────────────────────────── */
  ai: {
    // karakter bawaan: 'perempuan' | 'laki-laki'
    defaultGender: (process.env.AI_GENDER || 'perempuan').toLowerCase() === 'laki-laki' || process.env.AI_GENDER === 'laki' ? 'laki-laki' : 'perempuan'
  }
}
