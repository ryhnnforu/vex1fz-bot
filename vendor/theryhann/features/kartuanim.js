/**
 * features/kartuanim.js — ✨ FITUR KARTU HTML ANIMASI (v7.31.0)
 *  .listguild                — daftar guild (kartu scroll)
 *  .listmember <nama guild>  — anggota guild (kartu scroll)
 *  .money / .xp / .limitku / .levelku — kartu stat berbeda-beda (data = profil user itu)
 *  .qris                     — kartu QRIS donasi (gambar media/qris.jpg)
 *  .lbmenu (baru)            — hub leaderboard HTML + tombol list
 *  .topplayer .toprpg .topfun .topgame .topkaya .toplevel .topguild (+ .totalchat di groupmenu) — papan kategori (kartu + nama user)
 *  .tokolevel                — toko RPG bertingkat sesuai level user
 *  Ekspor helper kirimKartu(m,title,html,teks) dipakai fitur lain (buatguild, daftar, profile).
 */
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { getUser, allUsers, loadDB, getUserStats, saveDB } from '../lib/database.js'
import { getRPG, expNeeded, ITEMS, addItem } from '../lib/rpg.js'
import { guildDB, levelGuild, anggotaGuild, cariGuild, JOBS, K } from '../lib/rpg7.js'
import { gelarLevel } from '../lib/kartulevel.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { sendList } from '../lib/interactive.js'
import { kartuListGuild, kartuMemberGuild, kartuStat, kartuQris, kartuLbHub, kartuTop } from '../lib/kartuanim.js'
import { daftarGame, papan } from '../lib/lbgame.js'

const P = config.display.prefix
const brand = () => config.bot.name || 'THERYHANN!'
const namaUser = (jid, fallback) => { const u = getUser(jid); return u.name || u.pushName || fallback || String(jid).split('@')[0].slice(-4).padStart(8, '•') }
const tgl = t => new Date(t || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

/** kirim kartu HTML; kalau gagal kirim teks. return true bila HTML terkirim */
export async function kirimKartu (m, title, html, teks) {
  let ok = false
  try { await sendHtmlApp(m.sock, m.jid, { title, html }); ok = true } catch (e) { console.error('[kartuanim]', title, e.message) }
  if (teks) await m.reply(ok ? teks : teks + '\n\n_(kartu HTML tidak dapat dimuat di client ini)_').catch(() => {})
  return ok
}
const plug = (command, description, run, opt = {}) => ({ command, category: opt.category || 'User Menu', description, limit: 0, cooldown: 3, contoh: opt.contoh || '', run: async m => { try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 200)}`) } } })

/* ═══════════════ GUILD ═══════════════ */
function dataGuild (g) {
  const ang = anggotaGuild(g.id)
  return { id: g.id, nama: g.nama, pemimpin: namaUser(g.pemimpin, 'Pemimpin'), anggota: ang.length, bendahara: g.bendahara || 0, level: levelGuild(g), dibuat: tgl(g.dibuat) }
}
export const listguild = plug(['listguild', 'daftarguild', 'guildlist', 'semuaguild', 'listguilds'], '🏰 Daftar semua guild terdaftar — kartu HTML animasi, bisa di-scroll', async m => {
  const gs = Object.values(guildDB()).map(dataGuild).sort((a, b) => b.level - a.level || b.bendahara - a.bendahara || b.anggota - a.anggota)
  const html = kartuListGuild(brand(), { guilds: gs, totalAnggota: gs.reduce((s, g) => s + g.anggota, 0) })
  const teks = `🏰 *DAFTAR GUILD* (${gs.length})\n\n${gs.slice(0, 15).map((g, i) => `${i + 1}. *${g.nama}* — Lv.${g.level} · ${g.anggota}/20 · 👑 ${g.pemimpin}`).join('\n') || 'Belum ada guild. `' + P + 'buatguild Nama`'}${gs.length > 15 ? `\n…+${gs.length - 15} lagi (lihat kartu)` : ''}\n\nAnggota: \`${P}listmember <nama guild>\` · Gabung: \`${P}joinguild <nama>\``
  return kirimKartu(m, '🏰 Daftar Guild', html, teks)
}, { category: 'RPG Menu' })

export const listmember = plug(['listmember', 'guildmember', 'anggotaguild2'], '👥 Anggota sebuah guild — kartu HTML animasi scroll: .listmember <nama guild>', async m => {
  let nama = String(m.q || '').trim(); const r = getRPG(K(m))
  let g = nama ? cariGuild(nama) : (r.guild?.id ? Object.values(guildDB()).find(x => x.id === r.guild.id) : null)
  if (!g) { const gs = Object.values(guildDB()); return m.reply(nama ? `❌ Guild "${nama}" tidak ditemukan.\n\nGuild yang ada: ${gs.map(x => `*${x.nama}*`).join(', ') || '-'}` : `Contoh: \`${P}listmember Naga Merah\`\nLihat semua: \`${P}listguild\``) }
  const ang = anggotaGuild(g.id).map(u => ({ nama: u.name || String(u.jid).split('@')[0], level: u.rpg?.level || 1, job: u.rpg?.job ? `${JOBS[u.rpg.job]?.icon || ''} ${JOBS[u.rpg.job]?.nama || u.rpg.job}` : '', donasi: u.rpg?.guild?.donasi || 0, sejak: tgl(u.rpg?.guild?.masuk), pemimpin: u.jid === g.pemimpin })).sort((a, b) => (b.pemimpin - a.pemimpin) || b.donasi - a.donasi || b.level - a.level)
  const html = kartuMemberGuild(brand(), { nama: g.nama, level: levelGuild(g), bendahara: g.bendahara, dibuat: tgl(g.dibuat), anggota: ang })
  const teks = `👥 *ANGGOTA GUILD ${g.nama.toUpperCase()}* (${ang.length}/20)\n\n${ang.map((a, i) => `${i + 1}. ${a.pemimpin ? '👑 ' : ''}${a.nama} — Lv.${a.level}${a.job ? ' · ' + a.job : ''}`).join('\n')}`
  return kirimKartu(m, `👥 ${g.nama}`, html, teks)
}, { category: 'RPG Menu', contoh: 'Naga Merah' })

/* ═══════════════ KARTU STAT (money/xp/limit/level) ═══════════════ */
function rankDari (jid, nilai) { const all = allUsers().map(nilai).sort((a, b) => b - a); const me = nilai(getUser(jid)); return all.indexOf(me) + 1 || '-' }
function dataStat (m, jenis) {
  const jid = K(m); const u = getUser(jid); const r = getRPG(jid); const st = getUserStats(jid)
  const nama = m.pushName || u.name || 'Kamu'; const level = r.level || 1
  const hariIni = new Date().toDateString()
  const base = { jenis, nama, level, exp: r.exp || 0, butuh: expNeeded(level), gelar: gelarLevel(level) }
  if (jenis === 'money') return { ...base, money: r.money || 0, bank: r.bank || 0, rank: rankDari(jid, x => x.rpg?.money || 0), hariIni: r.koinHariIni?.tgl === hariIni ? r.koinHariIni.jml : 0 }
  if (jenis === 'xp') return { ...base, rank: rankDari(jid, x => x.rpg?.exp || 0) }
  if (jenis === 'limit') { const maks = config.limits?.default ?? 30; const claim = u.lastClaim && Date.now() - u.lastClaim < 864e5 ? 'sudah' : 'tersedia'; return { ...base, limit: u.limit || 0, limitMaks: Math.max(maks, u.limit || 0), premium: !!u.premium, claim, terpakai: st.last && new Date(st.last).toDateString() === hariIni ? (st.hariIni || 0) : 0 } }
  const G = [[1, 'Pendatang Baru'], [5, 'Warga'], [10, 'Petualang'], [20, 'Pejuang'], [30, 'Ksatria'], [45, 'Veteran'], [60, 'Elit'], [80, 'Legenda'], [100, 'Dewa Server']]
  const nx = G.find(([l]) => l > level)
  return { ...base, rank: rankDari(jid, x => (x.rpg?.level || 1) * 1e9 + (x.rpg?.exp || 0)), berikut: nx ? `${nx[1]} (Lv.${nx[0]})` : 'MAKS' }
}
const statCmd = (cmds, jenis, judul, teksFn) => plug(cmds, `${judul} — kartu HTML animasi sesuai data profilmu`, async m => {
  const d = dataStat(m, jenis)
  return kirimKartu(m, judul, kartuStat(brand(), d), teksFn(d))
})
const n = v => (Number(v) || 0).toLocaleString('id-ID')
export const money = statCmd(['money', 'uangku', 'koinku', 'saldo', 'dompet'], 'money', '💰 Dompet Koin', d => `💰 *DOMPET ${d.nama.toUpperCase()}*\n\n▸ Koin: *${n(d.money)}*\n▸ Bank: ${n(d.bank)}\n▸ Peringkat kaya: #${d.rank}\n\nTambah koin: \`${P}kerja\` · \`${P}berburu\` · \`${P}dungeon\``)
export const xp = statCmd(['xp', 'expku', 'myxp', 'cekxp', 'cekexp'], 'xp', '✨ EXP', d => `✨ *EXP ${d.nama.toUpperCase()}*\n\n▸ EXP: *${n(d.exp)}* / ${n(d.butuh)} (${Math.round(100 * d.exp / Math.max(1, d.butuh))}%)\n▸ Level: ${d.level} · ${d.gelar}\n▸ Peringkat EXP: #${d.rank}`)
export const limitku = statCmd(['limit', 'mylimit', 'limitcard', 'kartulimit'], 'limit', '🔋 Limit Harian', d => `🔋 *LIMIT ${d.nama.toUpperCase()}*\n\n▸ Limit: *${d.premium ? '♾️ Unlimited (premium)' : n(d.limit)}*\n▸ Claim harian: ${d.claim === 'tersedia' ? `✅ tersedia → \`${P}claim\`` : '⏳ sudah diambil'}`)
export const levelku = statCmd(['level', 'levelku', 'mylevel', 'lvl'], 'level', '🏅 Level & Gelar', d => `🏅 *LEVEL ${d.nama.toUpperCase()}*\n\n▸ Level: *${d.level}* · ✦ ${d.gelar}\n▸ Progres: ${n(d.exp)} / ${n(d.butuh)} EXP\n▸ Peringkat level: #${d.rank}\n▸ Gelar berikutnya: ${d.berikut}`)

/* ═══════════════ QRIS ═══════════════ */
export function fileQris () { return [path.join(process.cwd(), 'media', 'qris.jpg'), path.join(process.cwd(), 'media', 'qris.png')].find(f => fs.existsSync(f)) || '' }
export function qrisDataUri () { const f = fileQris(); return f ? `data:image/${f.endsWith('png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(f).toString('base64')}` : '' }
export const qris = plug(['qris', 'donasiqris', 'qrisdonasi', 'bayarqris', 'scanqris'], '💖 QRIS donasi — kartu HTML animasi + gambar QR', async m => {
  const qr = qrisDataUri(); if (!qr) return m.reply('⚠️ Gambar QRIS belum dipasang (media/qris.jpg).')
  const html = kartuQris(brand(), { qr, namaPenerima: config.owner?.name || 'Owner ' + brand() })
  const ok = await kirimKartu(m, '💖 QRIS Donasi', html, null)
  /* gambar QR asli selalu ikut dikirim agar bisa di-scan dari galeri */
  await m.sock.sendMessage(m.jid, { image: fs.readFileSync(fileQris()), caption: `💖 *QRIS ${brand()}*\nScan pakai DANA/GoPay/OVO/ShopeePay/m-banking.\nSetelah bayar kirim bukti ke \`${P}owner\` 🙏${ok ? '' : '\n_(kartu HTML tidak dimuat di client ini)_'}` }, { quoted: m.raw })
}, { category: 'Main Menu' })

/* ═══════════════ LEADERBOARD ═══════════════ */
const KATEGORI_LB = {
  topplayer: { icon: '👑', nama: 'Top Player', label: 'TOP PLAYER', satuan: 'poin', warna: '#fde68a', bg1: '#713f12', bg2: '#1c1917', ket: 'gabungan level, EXP, koin & aktivitas', nilai: u => (u.rpg?.level || 1) * 1000 + Math.floor((u.rpg?.exp || 0) / 10) + Math.floor((u.rpg?.money || 0) / 1000) + (getUserStats(u.jid).total || 0), det: u => `Lv.${u.rpg?.level || 1} · ${n(u.rpg?.money || 0)} koin` },
  toprpg: { icon: '⚔️', nama: 'Top RPG', label: 'TOP RPG', satuan: 'EXP', warna: '#fca5a5', bg1: '#7f1d1d', bg2: '#1c1917', ket: 'level & EXP petualangan', nilai: u => (u.rpg?.level || 1) * 1e6 + (u.rpg?.exp || 0), tampil: u => u.rpg?.exp || 0, det: u => `Lv.${u.rpg?.level || 1} · ${gelarLevel(u.rpg?.level || 1)}${u.rpg?.job ? ' · ' + (JOBS[u.rpg.job]?.nama || u.rpg.job) : ''}` },
  topkaya: { icon: '💰', nama: 'Top Kaya', label: 'TOP KAYA', satuan: 'koin', warna: '#fde68a', bg1: '#78350f', bg2: '#1c1917', ket: 'koin + bank', nilai: u => (u.rpg?.money || 0) + (u.rpg?.bank || 0), det: u => `bank ${n(u.rpg?.bank || 0)}` },
  toplevel: { icon: '🏅', nama: 'Top Level', label: 'TOP LEVEL', satuan: 'level', warna: '#c4b5fd', bg1: '#4c1d95', bg2: '#111827', ket: 'level tertinggi', nilai: u => (u.rpg?.level || 1) * 1e6 + (u.rpg?.exp || 0), tampil: u => u.rpg?.level || 1, det: u => gelarLevel(u.rpg?.level || 1) },
  topfun: { icon: '🎭', nama: 'Top Fun', label: 'TOP FUN', satuan: 'pemakaian', warna: '#f9a8d4', bg1: '#831843', bg2: '#111827', ket: 'paling sering pakai fitur fun/stiker/AI', nilai: u => { const c = getUserStats(u.jid).commands || {}; return Object.entries(c).filter(([k]) => /^(s|stiker|sticker|brat|smeme|meme|fake|igqc|quote|tts|ai|gpt|tebak|truth|dare|jodoh|cek|rate|gombal|pantun|toxic|roast|jokes|bucin|emoji|ttp|attp|wm|tohitam|say)/.test(k)).reduce((s, [, v]) => s + v, 0) }, det: u => `${getUserStats(u.jid).total || 0} perintah total` },
  topgame: { icon: '🎮', nama: 'Top Game', label: 'TOP GAME', satuan: 'poin', warna: '#86efac', bg1: '#14532d', bg2: '#111827', ket: 'akumulasi skor terbaik semua web game', nilai: u => { let s = 0; for (const g of daftarGame()) { const p = papan(g.id, 50).find(x => x.user === u.jid); if (p) s += Math.min(100000, p.skor) } return s }, det: u => { let j = 0; for (const g of daftarGame()) if (papan(g.id, 1)[0]?.user === u.jid) j++; return j ? `🥇 juara ${j} game` : 'pemain aktif' } },
  topguild: { icon: '🏰', nama: 'Top Guild', label: 'TOP GUILD', satuan: 'poin', warna: '#67e8f9', bg1: '#164e63', bg2: '#111827', guild: true, ket: 'level guild & bendahara' }
}
function papanKategori (kunci, meJid) {
  const k = KATEGORI_LB[kunci]
  if (k.guild) { const gs = Object.values(guildDB()).map(dataGuild).sort((a, b) => b.level - a.level || b.bendahara - a.bendahara); return gs.map(g => ({ nama: g.nama, nilai: g.level * 100000 + g.bendahara, ket: `Lv.${g.level} · ${g.anggota} anggota · 👑 ${g.pemimpin}`, me: false })) }
  return allUsers().filter(u => u.jid && !/@g\.us$/.test(u.jid)).map(u => ({ u, v: k.nilai(u) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).map(({ u, v }) => ({ nama: u.name || String(u.jid).split('@')[0].replace(/(\d{4})\d+(\d{3})/, '$1•••$2'), nilai: k.tampil ? k.tampil(u) : v, ket: k.det ? k.det(u) : '', me: u.jid === meJid }))
}
async function kirimTop (m, kunci) {
  const k = KATEGORI_LB[kunci]; const list = papanKategori(kunci, K(m)); const meIdx = list.findIndex(x => x.me)
  const html = kartuTop(brand(), { ...k, judul: k.nama, sub: `${list.length} peserta · ${k.ket}`, list, me: meIdx >= 0 ? { rank: meIdx + 1, nilai: list[meIdx].nilai } : null })
  const teks = `${k.icon} *${k.label}* — ${k.ket}\n\n${list.slice(0, 10).map((x, i) => `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} *${x.nama}* — ${n(x.nilai)} ${k.satuan}${x.me ? ' ← kamu' : ''}`).join('\n') || 'Belum ada data.'}${meIdx >= 10 ? `\n…\n#${meIdx + 1} kamu — ${n(list[meIdx].nilai)}` : ''}\n\nKategori lain: \`${P}lbmenu\``
  return kirimKartu(m, `${k.icon} ${k.nama}`, html, teks)
}
export const topCmds = Object.keys(KATEGORI_LB).map(kunci => plug([kunci, kunci + 'card', 'kartu' + kunci], `${KATEGORI_LB[kunci].icon} ${KATEGORI_LB[kunci].nama} — kartu HTML animasi (podium + daftar nama)`, m => kirimTop(m, kunci), { category: 'Games' }))

export const lbmenu = plug(['lbmenu', 'menulb', 'menuleaderboard', 'leaderboardmenu', 'menupapan', 'menuperingkat', 'topmenu'], '🏆 Hub papan peringkat — kartu HTML animasi (podium juara umum + semua kategori) & tombol list', async m => {
  const kats = Object.entries(KATEGORI_LB).map(([kunci, k]) => { const l = papanKategori(kunci, K(m)); return { kunci, icon: k.icon, nama: k.nama, juara: l[0]?.nama || '-', ket: k.ket, cmd: P + kunci, jumlah: l.length } })
  const top = papanKategori('topplayer', K(m)).slice(0, 3)
  const html = kartuLbHub(brand(), { totalUser: allUsers().length, top, kategori: kats })
  await kirimKartu(m, '🏆 Leaderboard', html, null)
  const gameRows = daftarGame().slice(0, 8).map(g => ({ title: `${g.icon} ${g.nama}`, description: `🥇 ${g.juara} · ${n(g.terbaik)}`, id: `${P}lbgame ${g.id}` }))
  return sendList(m.sock, m.jid, {
    title: '🏆 PAPAN PERINGKAT', text: `🏆 *MENU PAPAN PERINGKAT* — ${brand()}\n\nJuara umum: *${top[0]?.nama || '-'}* 👑\nPilih kategori di tombol bawah — bot membalas dengan kartu animasi berisi nama-nama yang masuk peringkat.\n\n${kats.map(k => `${k.icon} \`${k.cmd}\` — 🥇 ${k.juara}`).join('\n')}`, footer: brand(), buttonText: '🏆 Pilih Kategori',
    sections: [
      { title: 'KATEGORI', rows: kats.map(k => ({ title: `${k.icon} ${k.nama}`, description: `🥇 ${k.juara} · ${k.jumlah} peserta · ${k.ket}`, id: k.cmd })) },
      ...(gameRows.length ? [{ title: 'PER GAME (skor web game)', rows: gameRows }] : []),
      { title: 'LAINNYA', rows: [{ title: '📊 Peringkatku di game', description: 'skor terbaik & rank kamu', id: `${P}rankgame` }, { title: '🏟 Turnamen grup', description: 'adu skor antar member', id: `${P}turnamen` }] }
    ]
  }).catch(() => m.reply(kats.map(k => `${k.icon} \`${k.cmd}\``).join('\n')))
}, { category: 'Games' })

/* ═══════════════ TOKO LEVEL (shop RPG sesuai level) ═══════════════ */
export const TOKO_LEVEL = [
  { lv: 1, id: 'roti', nama: 'Roti', icon: '🍞', harga: 250, ket: 'pulih HP kecil' },
  { lv: 1, id: 'ramuan', nama: 'Ramuan', icon: '🧪', harga: 500, ket: 'pulih HP' },
  { lv: 3, id: 'pancing', nama: 'Pancing', icon: '🎣', harga: 1200, ket: 'buka .mancing' },
  { lv: 3, id: 'kapak', nama: 'Kapak', icon: '🪓', harga: 1500, ket: 'buka .nebang' },
  { lv: 5, id: 'pickaxe', nama: 'Pickaxe', icon: '⛏️', harga: 1800, ket: 'buka .nambang' },
  { lv: 5, id: 'pedang', nama: 'Pedang', icon: '🗡️', harga: 2500, ket: '+35% damage' },
  { lv: 8, id: 'armor', nama: 'Armor', icon: '🛡️', harga: 4000, ket: '-25% damage diterima' },
  { lv: 10, id: 'ramuan', nama: 'Paket Ramuan x5', icon: '🧪', harga: 2000, qty: 5, ket: 'hemat 20%' },
  { lv: 15, id: 'pedang', nama: 'Pedang Baja (x2 pedang)', icon: '⚔️', harga: 4200, qty: 2, ket: 'stok ganda, hemat 16%' },
  { lv: 20, id: 'armor', nama: 'Armor Naga (x2 armor)', icon: '🐉', harga: 6800, qty: 2, ket: 'stok ganda, hemat 15%' },
  { lv: 25, id: 'ramuan', nama: 'Peti Ramuan x15', icon: '📦', harga: 5000, qty: 15, ket: 'hemat 33%' },
  { lv: 30, id: 'pedang', nama: 'Gudang Senjata (x5 pedang)', icon: '🏹', harga: 9000, qty: 5, ket: 'hemat 28%' },
  { lv: 40, id: 'armor', nama: 'Zirah Legenda (x5 armor)', icon: '✨', harga: 14000, qty: 5, ket: 'hemat 30%' },
  { lv: 50, id: 'ramuan', nama: 'Elixir Dewa (x50 ramuan)', icon: '🌟', harga: 12500, qty: 50, ket: 'hemat 50% — khusus Lv.50+' }
]
export const tokolevel = plug(['tokolevel', 'shoplevel', 'tokorpg2', 'levelshop', 'belilevel'], '🏪 Toko RPG bertingkat: barang terbuka sesuai LEVEL kamu (paket hemat di level tinggi). .belilevel <no>', async m => {
  const jid = K(m); const r = getRPG(jid); const lv = r.level || 1
  const terbuka = TOKO_LEVEL.filter(x => x.lv <= lv); const terkunci = TOKO_LEVEL.filter(x => x.lv > lv)
  if (m.command === 'belilevel') {
    const no = parseInt(m.args?.[0]); const it = TOKO_LEVEL[no - 1]
    if (!it) return m.reply(`Contoh: \`${P}belilevel 3\` (nomor dari \`${P}tokolevel\`)`)
    if (it.lv > lv) return m.reply(`🔒 *${it.nama}* terbuka di Lv.${it.lv}. Level kamu: ${lv}.`)
    if ((r.money || 0) < it.harga) return m.reply(`💰 Uang tidak cukup. Butuh ${n(it.harga)}, punya ${n(r.money)}.`)
    r.money -= it.harga; addItem(jid, it.id, it.qty || 1); saveDB('users')
    return m.reply(`✅ Beli *${it.icon} ${it.nama}* → +${it.qty || 1} ${ITEMS[it.id]?.name || it.id}\n▸ Biaya: ${n(it.harga)} koin · sisa ${n(r.money)}`)
  }
  const baris = (x, i) => `${x.lv <= lv ? '✅' : '🔒'} *${i + 1}.* ${x.icon} ${x.nama} — ${n(x.harga)} koin ${x.lv > lv ? `_(Lv.${x.lv})_` : `· ${x.ket}`}`
  const teks = `🏪 *TOKO LEVEL* — Lv.${lv} · 💰 ${n(r.money)} koin\n\n*TERBUKA UNTUKMU*\n${terbuka.map((x) => baris(x, TOKO_LEVEL.indexOf(x))).join('\n')}\n\n*TERKUNCI (naik level dulu)*\n${terkunci.slice(0, 6).map((x) => baris(x, TOKO_LEVEL.indexOf(x))).join('\n') || '— semua terbuka, kamu sultan 👑'}\n\nBeli: \`${P}belilevel <nomor>\``
  return sendList(m.sock, m.jid, { title: '🏪 Toko Level', text: teks, footer: brand(), buttonText: '🛒 Beli', sections: [{ title: `Terbuka di Lv.${lv}`, rows: terbuka.map(x => ({ title: `${x.icon} ${x.nama} — ${n(x.harga)}`, description: x.ket, id: `${P}belilevel ${TOKO_LEVEL.indexOf(x) + 1}` })) }] }).catch(() => m.reply(teks))
}, { category: 'RPG Menu' })

export default { listguild, listmember, money, xp, limitku, levelku, qris, lbmenu, topCmds, tokolevel }
