/**
 * ============================================================
 *  lib/lbgame.js — 🏆 PAPAN PERINGKAT GAME (leaderboard) v7.6
 * ------------------------------------------------------------
 *  Masalah: kartu HTML app jalan di HP user dan **tidak bisa
 *  memanggil balik** ke bot, jadi skor tidak bisa dikirim otomatis.
 *
 *  Solusi (dipakai semua game HTML di bot ini):
 *   1. waktu kartu game dikirim, server membuat **nonce** acak dan
 *      menyimpannya di `database/lbgame.json` (per user + per game);
 *   2. nonce itu disuntikkan ke kartu (`var __LB = {...}`) — PRELUDE di
 *      `lib/htmlgames.js` lalu menghitung
 *      `KODE = <skor base36>-<hash36(nonce:game:skor)>`
 *      dan menampilkannya di bar "🏆 Papan peringkat" bawah kartu;
 *   3. user mengirim `.setorskore <kode>` → server menghitung ulang hash
 *      dari nonce yang ia simpan, cocok = skor asli dari kartu itu,
 *      lalu masuk papan peringkat + statistik;
 *   4. `.lbgame` menampilkan papan peringkat sebagai **kartu HTML**
 *      (canvas, D-pad ▲▼ pilih game, medali 🥇🥈🥉, baris kamu disorot).
 *
 *  Game yang diacak di server (casino RPG, .slot) mencatat skor
 *  **otomatis** lewat `catatSkor()` — tidak perlu kode.
 *
 *  Semua fungsi murni/sederhana supaya gampang diuji.
 * ============================================================
 */
import { loadDB, saveDB, saveNow } from './database.js'
import { shell } from './htmlgames.js'
import { sendHtmlApp } from './htmlapp.js'
import { config } from '../config.js'

const NAMA_DB = 'lbgame'
const DEFAULT = { token: {}, skor: {}, stat: {}, meta: { totalSetor: 0 } }

/** entri tersimpan per game (sisanya dipangkas) */
export const MAKS_ENTRI = 50
/** baris yang ditampilkan di kartu */
export const MAKS_BARIS = 10
/** nonce berlaku 12 jam sejak kartu dikirim */
export const UMUR_TOKEN = 12 * 60 * 60 * 1000
/** jumlah game yang papannya ikut dikirim ke kartu (jaga payload) */
export const MAKS_PAPAN_KARTU = 14

const P = config.display.prefix
const db = () => loadDB(NAMA_DB, DEFAULT)
const simpan = () => saveDB(NAMA_DB)

/* ------------------------------------------------------------------ */
/*  METADATA GAME (nama & ikon untuk kartu leaderboard)                 */
/* ------------------------------------------------------------------ */
export const NAMA_GAME = {
  /* arcade (neon) */
  gd: ['Geometry Dash Mini', '🔷', 'ARCADE'], snake: ['Snake Neon', '🐍', 'ARCADE'],
  flappy: ['Flappy Neon', '🐤', 'ARCADE'], breakout: ['Breakout Neon', '🧱', 'ARCADE'],
  spaceshooter: ['Space Shooter', '🚀', 'ARCADE'], dino: ['Dino Run', '🦖', 'ARCADE'],
  tetris: ['Tetris Neon', '🟦', 'ARCADE'], pong: ['Pong Neon', '🏓', 'ARCADE'],
  neonjump: ['Neon Jump', '🦘', 'ARCADE'], frogger: ['Frogger Neon', '🐸', 'ARCADE'],
  maze: ['Maze Neon', '🌀', 'ARCADE'], racing: ['Neon Racer', '🏎️', 'ARCADE'],
  tank: ['Tank Neon', '🛡️', 'ARCADE'], neonhunt: ['Neon Hunt', '🎯', 'ARCADE'],
  akinator: ['Akinator', '🧞', 'LAIN'], blockblast: ['Block Blast Neon', '💥', 'ARCADE'],
  catur: ['Catur Neon', '♟️', 'ARCADE'], minesweeper: ['Minesweeper Neon', '🚩', 'ARCADE'],
  asteroids: ['Asteroids Neon', '☄️', 'ARCADE'], d2048: ['2048', '2️⃣', 'PUZZLE'], fruitninja: ['Fruit Ninja', '🍉', 'ARCADE'],
  /* v7.8.3 — rupa asli */
  flappybird: ['Flappy Bird', '🐦', 'ARCADE'], pacman: ['Pac-Man', '🟡', 'ARCADE'], subway: ['Subway Surf', '🏃', 'ARCADE'],
  candycrush: ['Candy Crush', '🍬', 'ARCADE'], templerun: ['Temple Run', '🏛️', 'ARCADE'], angrybirds: ['Angry Birds', '🐦', 'ARCADE'], superjump: ['Super Jump', '🍄', 'ARCADE'],

  /* pastel */
  match3: ['Permen Pastel', '🍬', 'PASTEL'], bubble: ['Balon Sabun', '🫧', 'PASTEL'],
  pinball: ['Pinball Pastel', '🪩', 'PASTEL'], tikus: ['Tikus Tanah', '🐹', 'PASTEL'],
  pipa: ['Pipa Bocor', '🚰', 'PASTEL'],
  /* pastel v7.6 */
  pancing: ['Pancing Ikan', '🎣', 'PASTEL'], ritme: ['Irama Pastel', '🎵', 'PASTEL'],
  kartumemori: ['Kartu Memori', '🧠', 'PASTEL'], donat: ['Donat Susun', '🍩', 'PASTEL'],
  susunhuruf: ['Susun Kata', '🔤', 'PASTEL'],
  /* arcade v7.6 */
  missile: ['Missile Command Neon', '🛰️', 'ARCADE'], lukis: ['Lukis Neon', '🧊', 'ARCADE'],
  lander: ['Lunar Lander Neon', '🌙', 'ARCADE'], spiral: ['Spiral Neon', '🌀', 'ARCADE'],
  bomber: ['Bomber Neon', '💣', 'ARCADE'],
  /* jadul */
  poujump: ['Pou Jump', '🐸', 'JADUL'], snakenokia: ['Snake Nokia 3310', '📟', 'JADUL'],
  spaceinvader: ['Space Invader', '👾', 'JADUL'],
  /* casino chip (lokal, tetap bisa disetor) */
  slotchip: ['Casino Slot (chip)', '🎰', 'CASINO'], poker: ['Poker 5-Card Draw', '🃏', 'CASINO'],
  crash: ['Crash / Aviator', '🚀', 'CASINO'], baccarat: ['Baccarat', '🂡', 'CASINO'],
  /* casino RPG v7.6 — uang & skor dicatat server (otomatis, tanpa kode setor) */
  rolet: ['Rolet RPG', '🎡', 'RPG'], blackjack21: ['Blackjack RPG', '🃏', 'RPG'],
  dadukoin: ['Dadu RPG', '🎲', 'RPG'], aviatorrpg: ['Aviator RPG', '📈', 'RPG'],
  keno: ['Keno RPG', '🎯', 'RPG'],
  slot: ['Slot Mesin RPG', '🎰', 'RPG'],
  nekopark: ['Neko Park · Sakura', '🐱', 'ARCADE'],
  beatdrop: ['Beat Drop', '🎵', 'ARCADE'],
  menara: ['Menara Langit', '🏗️', 'ARCADE'],
  gelembung: ['Bubble Pop', '🫧', 'ARCADE'],
  cacing: ['Cacing.io', '🐛', 'ARCADE'],
  neonrunner: ['Neon Runner 2099', '🏃', 'CERITA'], lautdalam: ['Laut Dalam', '🐟', 'CERITA'], penjagakuil: ['Penjaga Kuil', '⛩️', 'CERITA'], kurirluar: ['Kurir Luar Angkasa', '🚀', 'CERITA'], detektifkota: ['Detektif Kota', '🔍', 'CERITA'],
  sawahnusantara: ['Sawah Nusantara', '🌾', 'CERITA'], gladiator: ['Gladiator Arena', '⚔️', 'CERITA'], pilotdrone: ['Pilot Drone', '🛸', 'CERITA'], penyihirrune: ['Penyihir Rune', '🔮', 'CERITA'], kotasenja: ['Kota Senja', '💡', 'CERITA'], droneview: ['Drone View 3D', '🚁', 'CERITA'], neondrift: ['Neon Drift', '🏎️', 'CERITA'], rumah13: ['Rumah Nomor 13', '🕯️', 'CERITA'], desapixel: ['Desa Pixel Terkutuk', '👻', 'CERITA'],
  rumahtua: ['Rumah Tua (horor)', '👁️', 'ARCADE'],
  sushi: ['Sushi Master', '🍣', 'ARCADE'],
  agario: ['Agar Arena', '🟢', 'MULTI'], tankroyale: ['Tank Royale', '🛡️', 'MULTI'], hexa: ['Hexa Wars', '⬡', 'MULTI'], balapan: ['Balapan Grup', '🏎️', 'MULTI'], tinju: ['Tinju Arena', '🥊', 'MULTI'],
  zombie: ['Zombie Bareng', '🧟', 'MULTI'], pesawat: ['Dogfight', '✈️', 'MULTI'], bomber: ['Bomber Grup', '💣', 'MULTI'], lari: ['Lari Rintangan', '🏃', 'MULTI'], tagteam: ['Kejar-kejaran', '👻', 'MULTI'],
  /* kartu non-game */
  musik: ['Player Musik', '🎧', 'LAIN']
}

/** nama/icon/kategori sebuah game (fallback: id-nya sendiri) */
export function infoGame (id) {
  const g = NAMA_GAME[id]
  return g ? { id, nama: g[0], icon: g[1], kategori: g[2] } : { id, nama: String(id).slice(0, 24), icon: '🎮', kategori: 'LAIN' }
}

/* ------------------------------------------------------------------ */
/*  HASH & KODE SETOR (harus sama persis dengan PRELUDE di htmlgames.js) */
/* ------------------------------------------------------------------ */
export function hash36 (str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).slice(0, 5)
}

/** kode yang ditampilkan kartu: `<skor base36>-<hash 5 char>` */
export function kodeUntuk (nonce, game, skor) {
  const n = Math.max(0, Math.floor(Number(skor) || 0))
  return n.toString(36) + '-' + hash36(nonce + ':' + game + ':' + n)
}

/** uraikan `<skor base36>-<hash>` → { skor, hash } (null kalau format salah) */
export function uraiKode (kode) {
  const t = String(kode || '').trim().toLowerCase().replace(/\s+/g, '')
  const m = /^([0-9a-z]{1,7})-([0-9a-z]{3,8})$/.exec(t)
  if (!m) return null
  const skor = parseInt(m[1], 36)
  if (!Number.isFinite(skor) || skor < 0 || skor > 1e12) return null
  return { skor, hash: m[2], mentah: t }
}

/* ------------------------------------------------------------------ */
/*  TOKEN / NONCE                                                       */
/* ------------------------------------------------------------------ */
const acak = (n = 8) => {
  let s = ''
  const ab = 'abcdefghijkmnopqrstuvwxyz23456789'
  for (let i = 0; i < n; i++) s += ab[(Math.random() * ab.length) | 0]
  return s
}

/** buang token kedaluwarsa milik seorang user */
export function bersihToken (user) {
  const d = db()
  const kini = Date.now()
  let n = 0
  for (const k of Object.keys(d.token)) {
    if (!k.startsWith(user + '|')) continue
    if (!d.token[k] || kini - (d.token[k].waktu || 0) > UMUR_TOKEN) { delete d.token[k]; n++ }
  }
  if (n) simpan()
  return n
}

/**
 * Buat nonce baru untuk (user, game) — dipanggil tiap kali kartu game dikirim.
 * @returns {string} nonce
 */
export function buatToken (user, game) {
  const d = db()
  bersihToken(user)
  const nonce = acak(8)
  d.token[user + '|' + game] = { nonce, waktu: Date.now() }
  /* jangan biarkan token menumpuk: maks 400 entri global */
  const keys = Object.keys(d.token)
  if (keys.length > 400) {
    keys.sort((a, b) => (d.token[a]?.waktu || 0) - (d.token[b]?.waktu || 0))
    for (let i = 0; i < keys.length - 400; i++) delete d.token[keys[i]]
  }
  simpan()
  return nonce
}

/** nonce aktif milik (user, game) — untuk uji/verifikasi */
export function tokenAktif (user, game) {
  return db().token[user + '|' + game]?.nonce || null
}

/**
 * Suntik nonce + id game ke payload HTML yang sudah dibangun `shell()`.
 * Mengganti baris `var __LB = { game: "", nonce: "", cmd: ".setorskore" };`
 */
export function sisipLb (html, game, nonce) {
  const ganti = 'var __LB = { game: "' + String(game).replace(/"/g, '') + '", nonce: "' +
    String(nonce).replace(/"/g, '') + '", cmd: "' + P + 'setorskore" };'
  if (/var __LB = \{[^}]*\};/.test(String(html))) return String(html).replace(/var __LB = \{[^}]*\};/, ganti)
  return String(html)
}

/* ------------------------------------------------------------------ */
/*  PENYIMPANAN SKOR                                                    */
/* ------------------------------------------------------------------ */
const namaRapi = (s, n = 18) => String(s == null ? '' : s).replace(/[|`*]/g, '').trim().slice(0, n) || 'Anonim'

/**
 * Catat skor (dipakai `.setorskore` dan game server-side).
 * @returns {{skor:number, rank:number, total:number, terbaikBaru:boolean, naik:number}}
 */
export function catatSkor (user, nama, game, skor, opt = {}) {
  const d = db()
  const g = String(game || '').slice(0, 24)
  const n = Math.max(0, Math.floor(Number(skor) || 0))
  if (!g) return { error: 'game tidak dikenal' }
  if (!d.skor[g]) d.skor[g] = []
  const list = d.skor[g]

  const sebelum = list.filter(x => x.u === user)
  const terbaikLama = sebelum.length ? Math.max(...sebelum.map(x => x.s)) : 0
  const terbaikBaru = n > terbaikLama

  if (opt.gabung !== false && sebelum.length) {
    /* satu entri per user per game: ambil skor terbaik + waktu terakhir */
    const e = sebelum[0]
    const naik = n - e.s
    if (terbaikBaru) e.s = n
    e.n = namaRapi(nama, 18)
    e.w = Date.now()
    e.k = (e.k || 0) + 1
    list.splice(list.indexOf(e), 1)
    list.push(e)
    rapikan(g)
    d.meta.totalSetor = (d.meta.totalSetor || 0) + 1
    catatStat(user, g, n, terbaikBaru)
    simpan()
    return { skor: n, terbaikLama, terbaikBaru, naik, rank: rankOf(g, user), total: list.length }
  }

  list.push({ u: user, n: namaRapi(nama, 18), s: n, w: Date.now(), k: 1, src: opt.src || 'kode' })
  rapikan(g)
  d.meta.totalSetor = (d.meta.totalSetor || 0) + 1
  catatStat(user, g, n, terbaikBaru)
  simpan()
  return { skor: n, terbaikLama, terbaikBaru, naik: n - terbaikLama, rank: rankOf(g, user), total: list.length }
}

function catatStat (user, game, skor, terbaikBaru) {
  const d = db()
  if (!d.stat[user]) d.stat[user] = {}
  const s = d.stat[user]
  if (!s[game]) s[game] = { setor: 0, terbaik: 0, terakhir: 0, main: 0 }
  s[game].setor = (s[game].setor || 0) + 1
  s[game].terakhir = Date.now()
  if (skor > (s[game].terbaik || 0)) s[game].terbaik = skor
  if (terbaikBaru) s[game].main = (s[game].main || 0) + 1
}

/** pangkas daftar supaya rapi & hemat tempat */
function rapikan (game) {
  const d = db()
  const list = (d.skor[game] || []).slice()
  list.sort((a, b) => (b.s || 0) - (a.s || 0) || (a.w || 0) - (b.w || 0))
  d.skor[game] = list.slice(0, MAKS_ENTRI)
  return d.skor[game]
}

/** peringkat (1-based) seorang user di sebuah game; 0 kalau tidak ada */
export function rankOf (game, user) {
  const list = db().skor[game] || []
  const i = list.findIndex(x => x.u === user)
  return i < 0 ? 0 : i + 1
}

/** papan peringkat sebuah game (sudah terurut) */
export function papan (game, limit = MAKS_BARIS) {
  const list = (db().skor[game] || []).slice()
  list.sort((a, b) => (b.s || 0) - (a.s || 0) || (a.w || 0) - (b.w || 0))
  return list.slice(0, Math.max(1, limit)).map((x, i) => ({
    rank: i + 1, nama: x.n || 'Anonim', skor: x.s || 0, waktu: x.w || 0, user: x.u, setor: x.k || 1, src: x.src || 'kode'
  }))
}

/** semua game yang punya skor, terurut menurut skor terbaik */
export function daftarGame (kategori = '') {
  const d = db()
  const kat = String(kategori || '').toUpperCase()
  return Object.keys(d.skor)
    .map(id => {
      const list = (d.skor[id] || []).slice().sort((a, b) => (b.s || 0) - (a.s || 0))
      const info = infoGame(id)
      return {
        id, nama: info.nama, icon: info.icon, kategori: info.kategori,
        jumlah: list.length, terbaik: list[0]?.s || 0, juara: list[0]?.n || '-'
      }
    })
    .filter(g => !kat || g.kategori === kat)
    .sort((a, b) => (b.terbaik || 0) - (a.terbaik || 0) || a.nama.localeCompare(b.nama))
}

/** statistik milik seorang user (semua game) */
export function statistikUser (user) {
  const s = db().stat[user] || {}
  return Object.keys(s).map(id => ({ id, ...infoGame(id), ...s[id], rank: rankOf(id, user) }))
    .sort((a, b) => (b.terbaik || 0) - (a.terbaik || 0))
}

/* ------------------------------------------------------------------ */
/*  SETOR LEWAT KODE DARI KARTU                                         */
/* ------------------------------------------------------------------ */
/**
 * Validasi `.setorskore <kode>`: cari nonce milik user yang cocok.
 * @returns {{ok:true,game,skor,rank,total,terbaikBaru,naik}|{ok:false,pesan:string}}
 */
export function setorKode (user, nama, kodeTeks) {
  const d = db()
  const u = uraiKode(kodeTeks)
  if (!u) {
    return {
      ok: false,
      pesan: `Format kode salah. Contoh kode di kartu game: \`1a2-x9f3k\`\n\nPakai: \`${P}setorskore <kode>\` (kode ada di bar *🏆 Papan peringkat* bawah kartu game).`
    }
  }
  const kini = Date.now()
  const milik = Object.keys(d.token).filter(k => k.startsWith(user + '|'))
  if (!milik.length) {
    return { ok: false, pesan: `Tidak ada kartu game aktif atas namamu (kode berlaku 12 jam).\n\nBuka game dulu, misal \`${P}pastel\` atau \`${P}arcade\`, lalu setor kode yang muncul di kartu.` }
  }
  let cocok = null
  for (const k of milik) {
    const t = d.token[k]
    if (!t?.nonce) continue
    if (kini - (t.waktu || 0) > UMUR_TOKEN) continue
    const game = k.slice(user.length + 1)
    if (kodeUntuk(t.nonce, game, u.skor) === u.mentah) { cocok = { game, nonce: t.nonce, key: k }; break }
  }
  if (!cocok) {
    return {
      ok: false,
      pesan: `Kode *${u.mentah}* tidak cocok / sudah kedaluwarsa.\n\n` +
        `• Kode hanya berlaku untuk **kartu yang dikirim ke kamu** (12 jam).\n` +
        `• Salin apa adanya dari bar 🏆 di bawah D-pad, contoh: \`${P}setorskore 1a2-x9f3k\`\n` +
        `• Game casino RPG & \`${P}slot\` tercatat **otomatis**, tidak perlu kode.`
    }
  }
  const h = catatSkor(user, nama, cocok.game, u.skor, { src: 'kode' })
  delete d.token[cocok.key]          /* satu kode = satu kali setor */
  simpan()
  return { ok: true, game: cocok.game, ...infoGame(cocok.game), ...h }
}

/* ------------------------------------------------------------------ */
/*  KARTU HTML PAPAN PERINGKAT                                          */
/* ------------------------------------------------------------------ */
const potong = (s, n) => String(s == null ? '' : s).slice(0, n)
const rel = t => {
  const d = Math.max(0, Date.now() - (t || 0))
  const m = Math.floor(d / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return m + ' mnt lalu'
  const h = Math.floor(m / 60)
  if (h < 24) return h + ' jam lalu'
  return Math.floor(h / 24) + ' hari lalu'
}

/** susun data kartu leaderboard */
export function dataLb (user, opts = {}) {
  const d = db()
  const kat = String(opts.kategori || '').toUpperCase()
  let games = daftarGame(kat)
  const minta = String(opts.game || '').trim().toLowerCase()
  let mulai = 0
  if (minta) {
    const i = games.findIndex(g => g.id === minta)
    if (i >= 0) mulai = i
    else {
      /* game belum punya skor → tetap tampilkan sebagai baris kosong */
      const info = infoGame(minta)
      games = [{ id: minta, nama: info.nama, icon: info.icon, kategori: info.kategori, jumlah: 0, terbaik: 0, juara: '-' }, ...games]
      mulai = 0
    }
  }
  const dipotong = games.slice(0, MAKS_PAPAN_KARTU)
  const papanMap = {}
  for (const g of dipotong) papanMap[g.id] = papan(g.id, MAKS_BARIS).map(x => ({
    r: x.rank, n: potong(x.nama, 16), s: x.skor, w: rel(x.waktu), me: x.user === user
  }))
  return {
    games: dipotong.map(g => ({
      id: g.id, nama: potong(g.nama, 22), icon: g.icon, kategori: g.kategori,
      jumlah: g.jumlah, terbaik: g.terbaik, juara: potong(g.juara, 14),
      rankKu: rankOf(g.id, user), skorKu: (d.stat[user]?.[g.id]?.terbaik) || 0
    })),
    papan: papanMap,
    mulai: Math.max(0, Math.min(mulai, Math.max(0, dipotong.length - 1))),
    kategori: kat,
    aku: potong(opts.nama || 'Kamu', 16),
    totalSetor: d.meta.totalSetor || 0,
    totalGame: Object.keys(d.skor || {}).length,
    prefix: P
  }
}

const LB_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var D = (typeof __LBDATA !== 'undefined') ? __LBDATA : { games: [], papan: {}, mulai: 0 };
  var G = D.games || [];
  var pilih = Math.max(0, Math.min(G.length - 1, D.mulai || 0));
  var t0 = 0;
  var MEDALI = ['🥇', '🥈', '🥉'];
  var PFX = D.prefix || '.';

  /* ---------- palet "papan nama" — kontras tinggi, mudah dibaca ---------- */
  var KERTAS = '#f7f0e3', TINTA = '#2f2618', TINTA_TIPIS = '#7d735c', GARIS = '#d9cdb5';
  var AKSEN = '#b8860b', PANEL = '#fffdf8', PANEL_H = '#fbf5ea', HIJAU = '#dff5e6', HIJAU_TUA = '#1f9e5c', MERAH = '#b91c1c';
  var EMOJI = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";

  function F (size, weight, fam) { ctx.font = (weight || '700') + ' ' + size + 'px ' + (fam || "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"); }
  function teks (t, x, y, size, warna, weight, align, fam) {
    F(size, weight, fam); ctx.fillStyle = warna || TINTA; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(t), x, y);
  }
  function potong (s, maxW, size, weight) {
    F(size, weight); s = String(s == null ? '' : s);
    if (ctx.measureText(s).width <= maxW) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }
  function rr (x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function kotak (x, y, w, h, isi, garis, r) {
    rr(x, y, w, h, r == null ? 10 : r); ctx.fillStyle = isi || PANEL; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = garis || GARIS; ctx.stroke();
  }
  function tombol (x, y, w, h, label, aktif) {
    rr(x, y, w, h, 10); ctx.fillStyle = aktif ? AKSEN : PANEL; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = aktif ? AKSEN : GARIS; ctx.stroke();
    teks(label, x + w / 2, y + h / 2 + 6, 17, aktif ? '#fff' : TINTA, '900', 'center');
  }
  function gameKini () { return G[pilih] || null; }
  function angka (n) { n = Number(n) || 0; return n.toLocaleString ? n.toLocaleString('id-ID') : String(n); }

  A.state = { pilih: pilih, jumlahGame: G.length, game: (G[pilih] || {}).id || '', kosong: G.length === 0, over: false };
  /* HUD game tidak relevan untuk papan: isi dengan info papan */
  try { A.setStatus('🏆 ' + G.length + ' game', (D.totalSetor || 0) + ' skor'); var sc = document.getElementById('score'); if (sc) sc.textContent = ''; var bs = document.getElementById('best'); if (bs) bs.textContent = 'PAPAN'; } catch (e) {}
  A.debug = { G: G, D: D, MEDALI: MEDALI, pilih: function () { return pilih },
    geser: function (n) { if (!G.length) return 0; pilih = ((pilih + n) % G.length + G.length) % G.length; A.state.pilih = pilih; A.state.game = (G[pilih] || {}).id || pilih; return pilih } };

  /* area tombol ◀ ▶ di tab (dipakai sentuh) */
  var BTN_KIRI = { x: 24, y: 96, w: 48, h: 48 }, BTN_KANAN = { x: W - 72, y: 96, w: 48, h: 48 };

  function gambar () {
    t0 += 1;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = KERTAS; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = AKSEN; ctx.fillRect(0, 0, W, 8); ctx.fillRect(0, H - 8, W, 8);

    /* ---------- judul (sekali saja, rapi) ---------- */
    teks('🏆', 30, 58, 30, TINTA, '900', 'left', EMOJI);
    teks('PAPAN PERINGKAT', 74, 56, 30, TINTA, '900', 'left');
    teks(angka(D.totalGame) + ' game · ' + angka(D.totalSetor) + ' skor tersetor' + (D.aku ? ' · kamu: ' + D.aku : ''), 74, 78, 13, TINTA_TIPIS, '700', 'left');

    if (!G.length) {
      kotak(40, 190, W - 80, 220, PANEL, GARIS, 16);
      teks('BELUM ADA SKOR', W / 2, 262, 26, TINTA, '900', 'center');
      teks('Main game apa saja, lalu kirim kode dari kartu game ke bot.', W / 2, 298, 14, TINTA_TIPIS, '700', 'center');
      teks(PFX + 'setorskore <kode>', W / 2, 340, 20, HIJAU_TUA, '900', 'center');
      teks('atau cukup kirim kodenya saja — otomatis tercatat', W / 2, 368, 13, TINTA_TIPIS, '700', 'center');
      return;
    }

    var g = gameKini();

    /* ---------- pemilih game: [◀] ikon nama [▶] ---------- */
    kotak(24, 96, W - 48, 64, PANEL, GARIS, 12);
    tombol(BTN_KIRI.x + 6, BTN_KIRI.y + 8, 40, 48, '◀', false);
    tombol(BTN_KANAN.x + 2, BTN_KANAN.y + 8, 40, 48, '▶', false);
    teks(g.icon || '🎮', 80, 132, 24, TINTA, '900', 'left', EMOJI);
    teks(potong(g.nama, W - 260, 20, '900'), 116, 128, 20, TINTA, '900', 'left');
    teks(String(g.kategori || '') + ' · ' + angka(g.jumlah) + ' pemain', 116, 148, 12, TINTA_TIPIS, '700', 'left');
    teks((pilih + 1) + ' / ' + G.length, W - 84, 132, 14, AKSEN, '900', 'right');

    /* ---------- kepala tabel ---------- */
    var rows = (D.papan && D.papan[g.id]) || [];
    var Y = 176;
    teks('RANK', 56, Y + 12, 11, TINTA_TIPIS, '900', 'center');
    teks('NAMA PEMAIN', 96, Y + 12, 11, TINTA_TIPIS, '900', 'left');
    teks('SKOR', W - 40, Y + 12, 11, TINTA_TIPIS, '900', 'right');
    Y += 22;
    var ROW = 46, GAP = 6;

    if (!rows.length) {
      kotak(24, Y, W - 48, 110, PANEL, GARIS, 12);
      teks('Belum ada yang menyetor skor di game ini', W / 2, Y + 48, 16, TINTA, '800', 'center');
      teks('Jadilah nomor 1: ' + PFX + 'setorskore <kode>', W / 2, Y + 78, 14, HIJAU_TUA, '800', 'center');
    }

    var nTampil = Math.min(rows.length, 10);
    for (var i = 0; i < nTampil; i++) {
      var r = rows[i];
      var y = Y + i * ROW;
      var aku = !!r.me;
      var h = ROW - GAP;
      kotak(24, y, W - 48, h, aku ? HIJAU : (i % 2 ? PANEL_H : PANEL), aku ? HIJAU_TUA : GARIS, 10);
      /* strip kiri */
      if (r.r <= 3 || aku) { ctx.fillStyle = aku ? HIJAU_TUA : AKSEN; rr(24, y, 8, h, 4); ctx.fill(); }
      /* rank */
      if (r.r <= 3) teks(MEDALI[r.r - 1], 56, y + h / 2 + 8, 22, TINTA, '900', 'center', EMOJI);
      else teks('#' + r.r, 56, y + h / 2 + 6, 16, TINTA_TIPIS, '900', 'center');
      /* nama */
      teks(potong(r.n, W - 96 - 150, 17, '800') + (aku ? '  (kamu)' : ''), 96, y + h / 2 + 6, 17, aku ? HIJAU_TUA : TINTA, '800', 'left');
      /* skor + waktu */
      teks(angka(r.s), W - 40, y + h / 2 + 2, 18, AKSEN, '900', 'right');
      if (r.w) teks(r.w, W - 40, y + h / 2 + 16, 10, TINTA_TIPIS, '700', 'right');
    }

    /* ---------- peringkatmu ---------- */
    var MY = Y + Math.max(nTampil, rows.length ? nTampil : 3) * ROW + 12;
    if (MY > H - 150) MY = H - 150;
    var punya = g.rankKu > 0;
    kotak(24, MY, W - 48, 72, punya ? HIJAU : PANEL, punya ? HIJAU_TUA : AKSEN, 14);
    teks('PERINGKATMU DI GAME INI', 42, MY + 24, 11, TINTA_TIPIS, '900', 'left');
    if (punya) {
      var mx = 42;
      if (g.rankKu <= 3) { teks(MEDALI[g.rankKu - 1], mx, MY + 54, 22, TINTA, '900', 'left', EMOJI); mx += 34; }
      teks(potong('Peringkat #' + g.rankKu + ' dari ' + angka(g.jumlah) + ' pemain', W - mx - 150, 19, '900'), mx, MY + 54, 19, HIJAU_TUA, '900', 'left');
      teks(angka(g.skorKu), W - 42, MY + 54, 22, AKSEN, '900', 'right');
    } else {
      teks('Belum ada skor kamu di sini', 42, MY + 54, 18, TINTA, '800', 'left');
      teks('main lalu kirim kodenya', W - 42, MY + 54, 13, HIJAU_TUA, '800', 'right');
    }

    /* ---------- footer ---------- */
    teks('Cara setor skor: kirim kode dari bar 🏆 di kartu game, atau ' + PFX + 'setorskore <kode>', W / 2, H - 42, 12, TINTA_TIPIS, '700', 'center');
    teks('◀ ▶ atau ketuk kiri/kanan untuk ganti game  ·  ' + PFX + 'lblist ' + g.id + ' untuk versi teks', W / 2, H - 22, 12, TINTA_TIPIS, '700', 'center');

    A.state.pilih = pilih; A.state.jumlahGame = G.length; A.state.game = (gameKini() || {}).id || ''; A.state.kosong = false; A.state.over = false;
  }

  function geserPilih (d2) {
    if (!G.length) return;
    pilih = ((pilih + d2) % G.length + G.length) % G.length;
    A.state.pilih = pilih; A.state.game = (G[pilih] || {}).id || pilih;
    A.SFX.point();
  }

  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'KeyW' || k === 'KeyA') geserPilih(-1);
    else if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'KeyS' || k === 'KeyD') geserPilih(1);
    else if (k === 'Space' || k === 'Enter') A.SFX.point();
  });

  function rectC () { return (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H }; }
  function sentuh (e) {
    if (e.preventDefault) e.preventDefault();
    var p = (e.touches && e.touches[0]) || e;
    var r = rectC();
    var x = ((p.clientX || 0) - r.left) * (W / Math.max(1, r.width));
    var y = ((p.clientY || 0) - r.top) * (H / Math.max(1, r.height));
    if (x < W / 2) geserPilih(-1); else geserPilih(1);
  }
  c.addEventListener('touchstart', sentuh, { passive: false });
  c.addEventListener('mousedown', sentuh);

  function loop () { gambar(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
`


/** kartu HTML papan peringkat */
export function lbHtml (brand = 'theryhann!', data = {}) {
  const aman = {
    games: (Array.isArray(data.games) ? data.games : []).slice(0, MAKS_PAPAN_KARTU).map(g => ({
      id: potong(g.id, 24), nama: potong(g.nama, 22), icon: potong(g.icon, 4), kategori: potong(g.kategori, 10),
      jumlah: Math.max(0, Math.floor(g.jumlah) || 0), terbaik: Math.max(0, Math.floor(g.terbaik) || 0),
      juara: potong(g.juara, 14), rankKu: Math.max(0, Math.floor(g.rankKu) || 0), skorKu: Math.max(0, Math.floor(g.skorKu) || 0)
    })),
    papan: {},
    mulai: Math.max(0, Math.floor(data.mulai) || 0),
    kategori: potong(data.kategori, 10),
    aku: potong(data.aku, 16),
    totalSetor: Math.max(0, Math.floor(data.totalSetor) || 0),
    totalGame: Math.max(0, Math.floor(data.totalGame) || 0),
    prefix: potong(data.prefix || P, 3)
  }
  for (const id of Object.keys(data.papan || {})) {
    aman.papan[potong(id, 24)] = (data.papan[id] || []).slice(0, MAKS_BARIS).map(r => ({
      r: Math.max(1, Math.floor(r.r) || 1), n: potong(r.n, 16), s: Math.max(0, Math.floor(r.s) || 0),
      w: potong(r.w, 14), me: !!r.me
    }))
  }
  const js = '  var __LBDATA = ' + JSON.stringify(aman) + ';\n' + LB_JS
  return shell('Papan Peringkat', brand, js, {
    w: 640, h: 760, maxw: 620, sub: 'LEADERBOARD',  /* v7.8.0: diperbesar sesuai permintaan */
    hint: 'ketuk kiri/kanan (atau ◀ ▶) untuk ganti game · skor langsung ter-update begitu kamu kirim kodenya'
  })
}

/** teks papan peringkat (fallback / balasan chat) */
export function lbTeks (user, opts = {}) {
  const games = daftarGame(opts.kategori)
  if (!games.length) {
    return `🏆 *PAPAN PERINGKAT GAME* — belum ada skor.\n\nMain game apa saja (mis. \`${P}pastel\`, \`${P}arcade\`, \`${P}casino\`), lalu kirim kode yang muncul di bar 🏆 bawah kartu:\n\`${P}setorskore <kode>\``
  }
  const fokus = opts.game ? games.find(g => g.id === String(opts.game).toLowerCase()) : null
  let s = `🏆 *PAPAN PERINGKAT* — ${games.length} game · ${db().meta.totalSetor || 0} skor tersetor\n\n`
  if (fokus) {
    s += `*${fokus.icon} ${fokus.nama}* (${fokus.kategori}) — ${fokus.jumlah} pemain\n`
    const rows = papan(fokus.id, MAKS_BARIS)
    s += rows.length
      ? rows.map(r => `${r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : '#' + r.rank} *${r.nama}* — ${r.skor.toLocaleString('id-ID')}${r.user === user ? '  ← KAMU' : ''}  \`${rel(r.waktu)}\``).join('\n')
      : '_belum ada skor_'
    const rk = rankOf(fokus.id, user)
    s += `\n\nKamu: ${rk ? `rank *#${rk}* dari ${fokus.jumlah}` : 'belum menyetor skor'}`
  } else {
    s += games.slice(0, 12).map(g => {
      const rk = rankOf(g.id, user)
      return `${g.icon} *${g.nama}* — 🥇 ${g.juara} (${g.terbaik.toLocaleString('id-ID')}) · ${g.jumlah} pemain${rk ? ` · kamu #${rk}` : ''}`
    }).join('\n')
  }
  s += `\n\n🖼 Kartu HTML: \`${P}lbgame${fokus ? ' ' + fokus.id : ''}\`\n` +
    `📥 Setor skor: \`${P}setorskore <kode>\` (kode ada di kartu game)\n` +
    `📊 Peringkatmu semua game: \`${P}rankgame\``
  return s
}

/* ------------------------------------------------------------------ */
/*  KIRIM KARTU GAME + NONCE LEADERBOARD                                */
/* ------------------------------------------------------------------ */
/**
 * Kirim kartu game HTML sekaligus mendaftarkan nonce leaderboard.
 * Dipakai semua submenu game (arcade/pastel/casino/jadul).
 * @param {object} m pesan
 * @param {{title:string, html:string, game:string}} opt
 */
export async function kirimGameHtml (m, { title, html, game }) {
  const user = m.senderKey || m.sender
  const nonce = buatToken(user, game)
  const payload = sisipLb(html, game, nonce)
  try {
    await sendHtmlApp(m.sock, m.jid, { title, html: payload })
    return { ok: true, nonce, game }
  } catch (e) {
    return { ok: false, error: e, nonce, game }
  }
}

/** simpan segera (dipakai sebelum proses keluar / test) */
export const simpanLb = () => saveNow(NAMA_DB)

export default {
  hash36, kodeUntuk, uraiKode, buatToken, tokenAktif, bersihToken, sisipLb, catatSkor, setorKode,
  papan, rankOf, daftarGame, statistikUser, dataLb, lbHtml, lbTeks, kirimGameHtml, infoGame,
  NAMA_GAME, MAKS_ENTRI, MAKS_BARIS, UMUR_TOKEN, simpanLb
}
