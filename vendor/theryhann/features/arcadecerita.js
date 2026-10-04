/**
 * features/arcadecerita.js — v7.18.0
 * 10 game HTML cerita BER-EPISODE (≥5 episode tiap game).
 *  .<game>            → kartu episode yang sedang terbuka (default 1)
 *  .<game> <n>        → buka episode n (hanya kalau sudah terbuka)
 *  tamat episode → kartu menampilkan KODE `ep<n>-<hash>` → user kirim kode
 *  → server verifikasi (nonce per user+game) → episode n+1 terbuka → bot
 *  kirim LIST BUTTON "Lanjut Episode n+1". Episode belum terbuka = ditolak.
 */
import { config } from '../config.js'
import { ARCADE_9, sisipEp } from '../lib/htmlgames15.js'
import { hash36, catatSkor } from '../lib/lbgame.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { sendButtons, sendList } from '../lib/interactive.js'
import { loadDB, saveDB, getSettings, setSetting } from '../lib/database.js'
import { baseUrl, webAktif, buatToken, teksDetail, setOnTamat, stat as statWeb } from '../lib/webgame.js'
import { sendInteractive } from '../lib/interactive.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'THERYHANN!'
const DBN = 'episode'
const db = () => loadDB(DBN, { user: {} })
const acak = n => { let s = ''; const c = 'abcdefghjkmnpqrstuvwxyz23456789'; for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s }
const BY_ID = Object.fromEntries(ARCADE_9.map(g => [g.id, g]))

export const ALIAS = {
  neonrunner: ['neonrun', 'runner2099', 'larineon', 'cyberrun'],
  lautdalam: ['kapalselam', 'deepsea', 'palung', 'selam'],
  penjagakuil: ['towerdefense', 'kuil', 'td', 'jagakuil'],
  kurirluar: ['kurirangkasa', 'antarpaket', 'roketkurir'],
  detektifkota: ['detektif', 'kasus', 'tkp', 'detective'],
  sawahnusantara: ['sawah', 'farming', 'petani'],
  gladiator: ['gladiatorarena', 'duelarena', 'colosseum'],
  pilotdrone: ['drone', 'terbangdrone', 'dronepilot', 'droneracing'],
  penyihirrune: ['rune', 'match3rune', 'penyihir', 'sihir3'],
  kotasenja: ['lampukota', 'lightsout', 'senja', 'teknisilampu'],
  droneview: ['drone3d', 'droneview3d', 'dronerealistis', 'openworlddrone', 'terbang3d'],
  neondrift: ['neon', 'drift', 'balapneon', 'kotatanpatidur', 'neonracing', 'mobil3d', 'balap3d'],
  rumah13: ['horror3d', 'horor3d', 'rumahangker', 'rumahnomor13', 'rumah13horror', 'nomor13'],
  mercusuar: ['lighthouse', 'penjagamercusuar', 'mercusuarterakhir', 'karanghitam'],
  desapixel: ['pixelhorror', 'pixelhoror', 'desaterkutuk', 'kalimati', 'horrorpixel', 'gamepixelhorror'],
  kampungmati: ['kampung', 'desamati', 'horrordesa', 'hororkampung', 'kampunghorror', 'kampungmisteri']
}

/* ---------------- KUNCI PRIBADI (v7.28.0) ----------------
 *  Tiap pemain punya 1 kunci unik (TH-XXXXXX), tidak ada yang sama.
 *  Dipakai: .episode<n> <kunci>  → membuka episode n game yang sedang dimainkan. */
export function kunciUser (user) {
  const d = db(); d.kunci = d.kunci || {}
  if (d.kunci[user]) return d.kunci[user]
  const dipakai = new Set(Object.values(d.kunci))
  let k; do { k = 'TH-' + acak(6).toUpperCase() } while (dipakai.has(k))
  d.kunci[user] = k; saveDB(DBN); return k
}
export function userDariKunci (k) {
  const d = db(); const K = String(k || '').trim().toUpperCase()
  for (const [u, v] of Object.entries(d.kunci || {})) if (v === K) return u
  return null
}
/* ---------------- progres ---------------- */
export function progres (user, game) {
  const d = db(); d.user[user] = d.user[user] || {}
  const p = d.user[user][game] || (d.user[user][game] = { max: 1, tamat: [], nonce: '', waktu: 0, riwayat: [] })
  return p
}
/* v7.32.0 — toleran identitas ganda: di grup mode LID vs chat pribadi, kunci DB user
   kadang beda bentuk (xxx@lid vs 628xx@s.whatsapp.net) → kunci dikira "milik pemain
   lain". Semua pemeriksaan di bawah mencoba SEMUA alias pengirim. */
function kandidatUser (m, user) {
  const s = new Set([user])
  for (const a of (m?.senderAlts || [])) if (a) s.add(String(a))
  return [...s]
}
/** progres terbaik di semua alias + disatukan ke kunci utama */
function progresSatukan (m, user, game) {
  const d = db(); const u = progres(user, game)
  for (const a of kandidatUser(m, user)) {
    if (a === user) continue
    const p = d.user?.[a]?.[game]
    if (!p) continue
    u.max = Math.max(u.max || 1, p.max || 1)
    u.tamat = [...new Set([...(u.tamat || []), ...(p.tamat || [])])]
    u.riwayat = [...new Set([...(u.riwayat || []), ...(p.riwayat || []), p.nonce].filter(Boolean))].slice(-5)
    if (!u.nonce && p.nonce) { u.nonce = p.nonce; u.waktu = p.waktu }
  }
  saveDB(DBN)
  return u
}
function gameAktif (m, user) {
  const d = db(); const aktif = d.aktif || {}
  if (aktif[user]) return aktif[user]
  for (const a of kandidatUser(m, user)) if (aktif[a]) return aktif[a]
  return null
}
export function kodeEpisode (nonce, game, ep) { return 'ep' + ep + '-' + hash36(nonce + ':' + game + ':ep:' + ep) }

/** verifikasi kode `ep<n>-<hash>` dari user → { ok, game, ep, next, pesan } */
export function verifikasiKode (user, teks, m = null) {
  const m2 = /^ep(\d{1,2})-([0-9a-z]{3,7})$/i.exec(String(teks || '').trim().toLowerCase())
  if (!m2) return { ok: false }
  const ep = +m2[1]
  const d = db()
  const daftarCoba = []
  for (const u of (m ? kandidatUser(m, user) : [user])) {
    const milik = d.user[u] || {}
    for (const game of Object.keys(milik)) daftarCoba.push([u, game, milik[game]])
  }
  for (const [u, game, p] of daftarCoba) {
    if (!p.nonce || !BY_ID[game]) continue
    if (Date.now() - (p.waktu || 0) > 24 * 60 * 60 * 1000) continue
    /* v7.32.0 — coba nonce aktif + 5 nonce terakhir (kartu web lama tetap valid) */
    const nonces = [p.nonce, ...(p.riwayat || [])].filter(Boolean)
    if (!nonces.some(nc => kodeEpisode(nc, game, ep) === m2[0].toLowerCase())) continue
    /* satukan ke kunci utama bila kode cocok di alias lain */
    const pu = (u === user) ? p : progresSatukan(m, user, game)
    const g = BY_ID[game]
    if (ep > pu.max) return { ok: false, pesan: `Episode ${ep} belum terbuka untukmu. Selesaikan Episode ${pu.max} dulu.` }
    if (!pu.tamat.includes(ep)) pu.tamat.push(ep)
    const next = Math.min(g.episode + 1, Math.max(pu.max, ep + 1))
    const baru = next > pu.max
    pu.max = next
    saveDB(DBN)
    return { ok: true, game, g, ep, next, baru, selesaiSemua: ep >= g.episode }
  }
  return { ok: false, pesan: 'Kode tidak cocok dengan kartu game aktifmu (kode berlaku 24 jam sejak kartu dikirim). Buka gamenya lagi lalu tamatkan episodenya.' }
}

/* ---------------- kirim kartu ---------------- */
async function kirimEpisode (m, g, epMinta) {
  const user = m.senderKey || m.sender
  const p = progres(user, g.id)
  const maxBuka = Math.min(g.episode, p.max)
  let ep = epMinta ? +epMinta : maxBuka
  if (!ep || ep < 1) ep = 1
  if (ep > g.episode) return m.reply(`📖 *${g.title}* hanya punya ${g.episode} episode.`)
  if (ep > p.max) {
    return m.reply(`🔒 *Episode ${ep} terkunci.*\nKamu baru membuka sampai Episode ${maxBuka}. Tamatkan Episode ${maxBuka}, lalu kirim KODE yang muncul di akhir episode ke chat ini.\n\nBuka: \`${P}${g.cmd} ${maxBuka}\``)
  }
  p.nonce = acak(8); p.waktu = Date.now(); const dAktif = db(); dAktif.aktif = dAktif.aktif || {}; dAktif.aktif[user] = g.id; saveDB(DBN)
  // ---- MODE WEB: kartu DETAIL MINIGAME + tombol ▶ Mainkan Sekarang (buka di pratinjau WhatsApp) ----
  const modeWeb = getSettings().webgame !== false && webAktif()
  if (modeWeb && !m.args?.includes('chat')) {
    const tok = buatToken({ user, jid: m.jid, game: g.id, ep, max: p.max, nama: m.pushName || 'Pemain', kunci: kunciUser(user), prefix: P })
    const url = `${baseUrl()}/g/${tok}`
    const text = teksDetail(g, ep) + `\n\n_Link pribadi @${String(m.sender).split('@')[0]} · berlaku 3 hari · progres & tombol episode berikutnya dikirim otomatis ke chat ini setelah tamat._`
    try {
      await sendInteractive(m.sock, m.jid, { title: `${g.icon} ${g.title}`, body: text, footer: brand(), url: [{ text: '▶ Mainkan Sekarang', url }], contextInfo: { mentionedJid: [m.sender] } })
      return { handled: true }
    } catch (e) {
      try { await m.reply(text + `\n\n▶ *Mainkan Sekarang:* ${url}`); return { handled: true } } catch {}
    }
  }
  const html = sisipEp(g.html(brand(), { ep, max: p.max, nonce: p.nonce, kunci: kunciUser(user), prefix: P }), { ep, max: p.max, nonce: p.nonce, kunci: kunciUser(user), prefix: P })
  const title = `${g.icon} ${g.title.toUpperCase()} — EPISODE ${ep}/${g.episode}`
  try {
    await sendHtmlApp(m.sock, m.jid, { title, html })
  } catch (e) {
    return m.reply(`⚠️ Gagal memuat *${g.title}*.\nError: ${String(e?.message || e).slice(0, 120)}`)
  }
  return { handled: true }
}

/* ---------------- otomatis: user kirim kode ep → buka episode berikutnya ---------------- */
export async function cekKodeEpisode (m) {
  if (m.isCommand) return null
  const teks = String(m.text || '').trim()
  if (!/^ep\d{1,2}-[0-9a-zA-Z]{3,7}$/.test(teks)) return null
  const user = m.senderKey || m.sender
  const r = verifikasiKode(user, teks, m)
  if (!r.ok) { if (r.pesan) await m.reply(`❌ ${r.pesan}`); return { handled: true } }
  const g = r.g
  try { catatSkor(user, m.pushName || 'Pemain', g.id, r.ep * 100, { src: 'episode' }) } catch {}
  if (r.selesaiSemua) {
    await m.reply(`🏁 *${g.title} — CERITA TAMAT!*\nSelamat @${String(m.sender).split('@')[0]}, kamu menamatkan semua ${g.episode} episode.\n\nMain ulang episode mana pun: \`${P}${g.cmd} <nomor>\`\nGame cerita lain: \`${P}arcadecerita\``, { mentions: [m.sender] })
    return { handled: true }
  }
  const teksB = `✅ *EPISODE ${r.ep} SELESAI!* — ${g.icon} ${g.title}\n` +
    (r.baru ? `🔓 *Episode ${r.next}* sekarang terbuka untukmu.\n\n` : `Episode ${r.next} sudah terbuka sebelumnya.\n\n`) +
    `Ketuk tombol di bawah untuk melanjutkan cerita, atau ketik \`${P}episode${r.next} ${kunciUser(user)}\`.\n_Kunci ${kunciUser(user)} unik milikmu — hanya kamu yang bisa membuka episode ini._`
  const rows = []
  for (let i = 1; i <= g.episode; i++) {
    if (i <= r.next) rows.push({ title: `${i === r.next ? '▶' : '↻'} Episode ${i}${i === r.next ? ' — LANJUTKAN' : ' (ulang)'}`, description: i === r.next ? 'episode baru terbuka' : 'sudah ditamatkan', id: `${P}${g.cmd} ${i}` })
    else rows.push({ title: `🔒 Episode ${i}`, description: 'terkunci — tamatkan episode sebelumnya', id: `${P}${g.cmd} ${i}` })
  }
  try {
    await sendList(m.sock, m.jid, { text: teksB, title: `📖 ${g.title}`, footer: brand(), buttonText: `▶ EPISODE ${r.next}`, sections: [{ title: `Episode (${r.next}/${g.episode} terbuka)`, rows }] })
  } catch {
    try { await sendButtons(m.sock, m.jid, { text: teksB, title: `📖 ${g.title}`, footer: brand(), buttons: [{ text: `▶ Lanjut Episode ${r.next}`, id: `${P}${g.cmd} ${r.next}` }, { text: `↻ Ulang Episode ${r.ep}`, id: `${P}${g.cmd} ${r.ep}` }] }) } catch { await m.reply(teksB) }
  }
  return { handled: true }
}

/* ---------------- web: episode tamat dari browser → progres + tombol episode berikutnya ---------------- */
setOnTamat(async ({ info, g, ep, skor }) => {
  const sock = globalThis.__sockAktif || global.sock
  const user = info.user
  const p = progres(user, g.id)
  if (!p.tamat.includes(ep)) p.tamat.push(ep)
  const next = Math.min(g.episode + 1, Math.max(p.max, ep + 1))
  const baru = next > p.max; p.max = next; saveDB(DBN)
  try { catatSkor(user, info.nama || 'Pemain', g.id, ep * 100 + Math.min(99, Math.floor((+skor || 0) / 10)), { src: 'web' }) } catch {}
  if (!sock) return { next: ep >= g.episode ? null : next, pesan: '✔ Episode ' + ep + ' tersimpan' }
  const tag = String(user).split('@')[0]
  if (ep >= g.episode) {
    try { await sock.sendMessage(info.jid, { text: `🏁 *${g.title} — CERITA TAMAT!*\nSelamat @${tag}, kamu menamatkan semua ${g.episode} episode lewat web.\n\nMain ulang: \`${P}${g.cmd} <nomor>\` · Game lain: \`${P}arcadecerita\``, mentions: [user] }) } catch {}
    return { next: null, pesan: '🏁 Cerita tamat!' }
  }
  const teksB = `✅ *EPISODE ${ep} SELESAI!* — ${g.icon} ${g.title}\n@${tag} ${baru ? `🔓 *Episode ${next}* sekarang terbuka.` : `Episode ${next} sudah terbuka.`}\n🔑 Ketik: \`${P}episode${next} ${kunciUser(user)}\`\n\nKetuk tombol untuk lanjut (link main baru akan dikirim), atau ketik \`${P}${g.cmd} ${next}\`.`
  try {
    await sendButtons(sock, info.jid, { text: teksB, title: `📖 ${g.title}`, footer: brand(), buttons: [{ text: `▶ Lanjut Episode ${next}`, id: `${P}${g.cmd} ${next}` }, { text: `↻ Ulang Episode ${ep}`, id: `${P}${g.cmd} ${ep}` }] })
  } catch { try { await sock.sendMessage(info.jid, { text: teksB, mentions: [user] }) } catch {} }
  return { next, pesan: '✔ Episode ' + ep + ' selesai' }
})

/* ---------------- owner: atur mode web ---------------- */
export const webGameSet = {
  command: ['setwebgame', 'setweburl', 'gameweb', 'webgameset'],
  category: 'Owner Menu',
  description: '🌐 Mode game cerita versi web (kartu DETAIL MINIGAME + tombol Mainkan Sekarang): .setwebgame on/off | .setwebgame url https://domain-bot',
  owner: true, limit: 0,
  run: async m => {
    const [a, b] = m.args || []
    if (a === 'on' || a === 'off') { setSetting('webgame', a === 'on'); return m.reply(`🌐 Mode web game: *${a.toUpperCase()}*${a === 'on' && !webAktif() ? '\n⚠️ URL publik belum ada. Set: `' + P + 'webgame url https://xxx.up.railway.app` (dan pastikan env PORT ada).' : ''}`) }
    if (a === 'url' && b) { setSetting('webUrl', String(b).replace(/\/+$/, '')); return m.reply(`✅ URL web game: ${baseUrl()}/g\nCoba: \`${P}rumah13\``) }
    return m.reply(`🌐 *GAME CERITA VERSI WEB*\nStatus: ${getSettings().webgame === false ? 'OFF' : 'ON'} · URL: ${baseUrl() || '(belum diset)'} · PORT: ${process.env.PORT || '(tidak ada → server web mati)'}\n\n\`${P}setwebgame on/off\`\n\`${P}setwebgame url https://domain-bot\`\n\nSaat aktif, tiap perintah game cerita mengirim kartu *DETAIL MINIGAME* + tombol *▶ Mainkan Sekarang* (buka di pratinjau WhatsApp). Tambah kata \`chat\` untuk versi kartu HTML di chat: \`${P}rumah13 1 chat\`.`)
  }
}

/* ---------------- plugin per game ---------------- */
export const PLUGIN_CERITA = {}
for (const g of ARCADE_9) {
  PLUGIN_CERITA['cr_' + g.id] = {
    command: [g.cmd, ...(ALIAS[g.id] || [])],
    category: 'Games',
    description: `${g.icon} ${g.title} — ${g.ket} (${g.episode} episode, kode buka episode)`,
    limit: 0, cooldown: 3,
    run: async m => kirimEpisode(m, g, /^\d+$/.test(m.args?.[0] || '') ? m.args[0] : 0)
  }
}

/* ---------------- .episode<n> <kunci> (v7.28.0) ---------------- */
async function bukaDenganKunci (m, n) {
  const user = m.senderKey || m.sender
  const k = String(m.args?.[0] || '').trim().toUpperCase()
  const milik = kunciUser(user)
  if (!k) return m.reply(`🔑 *EPISODE ${n}*\nFormat: \`${P}episode${n} <kunci>\`\n\nKunci pribadimu: *${milik}* (unik, hanya untukmu — jangan dibagikan).\nKunci muncul juga di akhir tiap episode.`)
  const pemilik = userDariKunci(k)
  if (!pemilik) return m.reply(`❌ Kunci *${k}* tidak dikenal. Kunci pribadimu: *${milik}*`)
  /* v7.32.0 — kunci di alias lain (LID ↔ nomor) tetap diterima sebagai milik sendiri */
  if (pemilik !== user && !kandidatUser(m, user).includes(pemilik)) return m.reply(`⛔ Kunci *${k}* milik pemain lain! Setiap pemain punya 1 kunci unik. Kunci milikmu: *${milik}*`)
  if (pemilik !== user) { const dd = db(); dd.kunci = dd.kunci || {}; dd.kunci[user] = dd.kunci[pemilik]; saveDB(DBN) }
  const gid = gameAktif(m, user)
  const g = gid && BY_ID[gid]
  if (!g) return m.reply(`📖 Kamu belum memulai game cerita apa pun. Pilih dulu: \`${P}arcadecerita\``)
  if (n > g.episode) return m.reply(`📖 *${g.title}* hanya punya ${g.episode} episode.`)
  const p = progresSatukan(m, user, g.id)
  if (n > p.max) return m.reply(`🔒 *Episode ${n} ${g.title} masih terkunci.*\nKamu baru menamatkan sampai Episode ${Math.max(1, p.max - 1)} (terbuka: ${Math.min(p.max, g.episode)}). Tamatkan Episode ${Math.min(p.max, g.episode)} dulu → progres tersimpan otomatis (web) atau kirim kode di akhir episode.\n\nBuka: \`${P}${g.cmd} ${Math.min(p.max, g.episode)}\``)
  await m.reply(`🔑 Kunci cocok · *${g.icon} ${g.title} — Episode ${n}* dibuka untukmu.`)
  return kirimEpisode(m, g, n)
}
export const EPISODE_CMDS = {}
for (let n = 2; n <= 12; n++) {
  EPISODE_CMDS['episode' + n] = {
    command: ['episode' + n, 'ep' + n + 'buka'],
    category: 'Games',
    description: `🔑 Buka Episode ${n} game cerita yang sedang kamu mainkan: .episode${n} <kunci pribadimu>`,
    limit: 0, cooldown: 2,
    run: async m => bukaDenganKunci(m, n)
  }
}
export const kunciku = {
  command: ['kunciku', 'keyku', 'kunciepisode', 'mykey'],
  category: 'Games',
  description: '🔑 Lihat kunci pribadimu untuk .episode<n> <kunci> (unik per pemain)',
  limit: 0,
  run: async m => {
    const user = m.senderKey || m.sender; const d = db(); const gid = (d.aktif || {})[user]; const g = gid && BY_ID[gid]
    return m.reply(`🔑 *KUNCI PRIBADIMU:* \`${kunciUser(user)}\`\n_(unik — tidak ada pemain lain dengan kunci ini)_\n\n${g ? `Game aktif: ${g.icon} *${g.title}* · terbuka sampai Episode ${Math.min(progres(user, g.id).max, g.episode)}\nLanjut: \`${P}episode${Math.min(progres(user, g.id).max, g.episode)} ${kunciUser(user)}\`` : `Belum ada game aktif · \`${P}arcadecerita\``}`)
  }
}

export const arcadeCerita = {
  command: ['arcadecerita', 'arcade9', 'gamecerita', 'storygame', 'gamestory', 'arcadestory', 'episodeku'],
  category: 'Games',
  description: '📖 15 game HTML cerita ber-episode: tiap game punya UI, backsound & alur sendiri; tamatkan episode → kode → episode berikutnya terbuka',
  limit: 0,
  run: async m => {
    const user = m.senderKey || m.sender
    const text =
      `📖 *${brand().toUpperCase()} — GAME CERITA (v7.18.0)*\n` +
      '_15 game (🗼 Mercusuar Terakhir baru, 🕯️ horror 3D, 👻 pixel-horror dengan NPC & barter, 🏎️ Neon Drift, 🚁 Drone View 3D, +10 lainnya), 14 tema, 14 backsound. Setiap game punya layar pembuka, prolog, MENU khas, pengaturan, dan ≥5 EPISODE. Tamatkan satu episode → kartu menampilkan KODE → kirim kode ke chat → bot mengirim tombol episode berikutnya. Episode yang belum kamu buka tidak bisa dimainkan._\n\n' +
      ARCADE_9.map(g => { const p = progres(user, g.id); return `${g.icon} *${P}${g.cmd}* — ${g.title} (${g.episode} ep · kamu: ${Math.min(p.max, g.episode)}/${g.episode})\n   ${g.ket}` }).join('\n') +
      `\n\n⚙️ Pengaturan di tiap game: musik latar, efek suara, getar, kecepatan, ukuran tombol, tangan kiri.\n🕹️ Arcade lain: ${P}arcade · 🧩 semua game: ${P}gamerespon`
    try {
      await sendList(m.sock, m.jid, {
        text, title: '📖 GAME CERITA', footer: brand(), buttonText: 'PILIH GAME',
        sections: [{ title: `📖 Game cerita (${ARCADE_9.length})`, rows: ARCADE_9.map(g => ({ title: `${g.icon} ${g.title} (${g.episode} ep)`, description: g.ket.slice(0, 70), id: `${P}${g.cmd}` })) }]
      })
    } catch {
      try { await sendButtons(m.sock, m.jid, { text, title: '📖 GAME CERITA', footer: brand(), buttons: ARCADE_9.slice(0, 8).map(g => ({ text: `${g.icon} ${g.title}`, id: `${P}${g.cmd}` })) }) } catch { await m.reply(text) }
    }
  }
}

export const DAFTAR_ARCADE9 = ARCADE_9
export default { ...PLUGIN_CERITA, ...EPISODE_CMDS, kunciku, arcadeCerita, webGameSet }
