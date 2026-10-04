/**
 * ⚔️ RPG BARU v7.35 — DUEL PvP + PETI HARTA
 * ------------------------------------------------------------------
 *  DUEL (1 aktif per chat, sesi di lib/gamestore.js duelSessions):
 *   • .tarung @user <taruhan> — tantang (taruhan dikunci di awal)
 *   • .duelterima / .dueltolak — jawab tantangan (khusus yang ditantang)
 *   • .duelserang / .duelheal / .duelkabur — aksi giliran
 *   • .duelinfo — papan duel • kedaluwarsa 3 mnt (tantangan & tiap giliran)
 *   • Menang: pot 2× taruhan + 50 EXP + skor duel. Kabur/WO = kalah.
 *  PETI:
 *   • .peti — daftar tier • .bukapeti [kayu|perak|emas|legenda]
 *   • peti kayu GRATIS 1×/hari, sisanya beli pakai koin. Jackpot tiap tier!
 */
import { config } from '../config.js'
import { getRPG, addMoney, addExp, addItem, equipBonus, ITEMS } from '../lib/rpg.js'
import { getUser, saveDB } from '../lib/database.js'
import { catatSkor } from '../lib/lbgame.js'
import { duelSessions } from '../lib/gamestore.js'

const P = config.display.prefix
const RP = n => Number(n || 0).toLocaleString('id-ID')
const DUEL_TTL = 3 * 60 * 1000
const TARUHAN_MIN = 100
const TARUHAN_MAKS = 1000000

/* ================= PEMBANTU DUEL ================= */
const nama = (m, jid) => {
  if (jid === (m.senderKey || m.sender)) return m.pushName || 'Kamu'
  try { return getUser(jid)?.name || String(jid).split('@')[0] } catch { return String(jid).split('@')[0] }
}
const barHP = (hp, maks) => {
  const p = Math.max(0, Math.min(10, Math.round(hp / Math.max(1, maks) * 10)))
  return '🟩'.repeat(p) + '⬜'.repeat(10 - p)
}
const atkDari = jid => (10 + (getRPG(jid).level || 1) * 3) * (1 + equipBonus(jid, 'weapon'))
const redDari = jid => Math.min(0.6, equipBonus(jid, 'armor'))
const hpDuel = jid => 100 + (getRPG(jid).level || 1) * 10

function ambilDuel (m, sapu = true) {
  const s = duelSessions.get(m.jid)
  if (!s) return null
  if (sapu && Date.now() > s.expires) { // kedaluwarsa
    duelSessions.delete(m.jid)
    if (!s.mulai) { // tantangan basi → kembalikan taruhan penantang
      try { addMoney(s.a, s.taruhan) } catch {}
      s.basi = true
    } else s.wo = s.giliran // giliran habis → yang dapat giliran kalah WO
    return s
  }
  return s
}
function papanDuel (m, s) {
  const gA = s.hp.a, gB = s.hp.b
  return `⚔️ *DUEL PvP* — pot 💰 *${RP(s.taruhan * 2)}*\n\n` +
    `🗡️ ${nama(m, s.a)} — HP ${Math.max(0, gA)}/${s.maks.a}\n${barHP(gA, s.maks.a)}\n\n` +
    `🛡️ ${nama(m, s.b)} — HP ${Math.max(0, gB)}/${s.maks.b}\n${barHP(gB, s.maks.b)}\n\n` +
    `🎯 Giliran: *${nama(m, s.giliran)}*\n${P}duelserang · ${P}duelheal · ${P}duelkabur`
}
async function akhiriDuel (m, s, pemenang, sebab) {
  duelSessions.delete(m.jid)
  const pecundang = pemenang === s.a ? s.b : s.a
  try { addMoney(pemenang, s.taruhan * 2); addExp(pemenang, 50) } catch {}
  try { catatSkor(pemenang, nama(m, pemenang), 'duel', Math.floor(s.taruhan / 10) + 50) } catch {}
  const teks = `🏆 *DUEL SELESAI — ${nama(m, pemenang).toUpperCase()} MENANG!*\n\n` +
    `${sebab}\n\n💰 +${RP(s.taruhan * 2)} koin (pot penuh)\n✨ +50 EXP\n😞 ${nama(m, pecundang)} kehilangan ${RP(s.taruhan)} koin\n\nTarung lagi: \`${P}tarung @user <taruhan>\``
  try {
    await m.sendButtons({ title: '🏆 DUEL SELESAI', text: teks, buttons: [{ text: '⚔️ Tarung Lagi', id: `${P}tarung` }, { text: '🎮 RPG Menu', id: `${P}rpg` }] })
  } catch { await m.reply(teks) }
}
const targetDari = m => m.mentioned?.[0] || m.quoted?.sender || (m.args[0] && /[0-9]/.test(m.args[0]) ? m.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)

/* ================= PERINTAH DUEL ================= */
export const duel = {
  command: ['tarung', 'byone', 'duelturn', 'tarungpvp', 'tantangduel'], // 'duel' milik .arena instan (rpglab) — jangan rebut
  category: 'RPG Menu',
  description: '⚔️ Duel PvP TURN-BASED taruhan koin: .tarung @user <taruhan> (100–1jt) — terima, serang/heal bergiliran! (.arena = duel instan)',
  limit: 0,
  cooldown: 5,
  run: async m => {
    const saya = m.senderKey || m.sender
    const s0 = ambilDuel(m)
    if (s0 && !s0.basi && !s0.wo) return m.reply(`⚔️ Masih ada duel aktif di chat ini. Selesaikan dulu atau tunggu 3 menit.\nCek: \`${P}duelinfo\``)
    const target = targetDari(m)
    const taruhan = parseInt(m.args.filter(a => /^\d+$/.test(a)).pop())
    if (!target) return m.reply(`⚔️ *DUEL PvP*\n\nTantang pemain lain, taruhan koin, menang bawa pulang 2× lipat!\n\n\`${P}tarung @user <taruhan>\`\nContoh: \`${P}tarung @budi 5000\`\nTaruhan: ${RP(TARUHAN_MIN)}–${RP(TARUHAN_MAKS)} koin`)
    if (target === saya) return m.reply('❌ Tidak bisa duel melawan diri sendiri.')
    if (!taruhan || taruhan < TARUHAN_MIN || taruhan > TARUHAN_MAKS) return m.reply(`❌ Taruhan ${RP(TARUHAN_MIN)}–${RP(TARUHAN_MAKS)} koin.\nContoh: \`${P}tarung @${String(target).split('@')[0]} 5000\``)
    if ((getRPG(saya).money || 0) < taruhan) return m.reply(`❌ Koinmu kurang (punya ${RP(getRPG(saya).money)}, butuh ${RP(taruhan)}). Cari dulu: \`${P}kerja\``)
    if ((getRPG(target).money || 0) < taruhan) return m.reply(`❌ ${nama(m, target)} koinnya kurang dari ${RP(taruhan)} — turunkan taruhanmu.`)
    addMoney(saya, -taruhan)
    duelSessions.set(m.jid, { a: saya, b: target, taruhan, mulai: false, expires: Date.now() + DUEL_TTL })
    const teks = `⚔️ *TANTANGAN DUEL!*\n\n🗡️ ${nama(m, saya)} menantang 🛡️ @${String(target).split('@')[0]}!\n💰 Taruhan: *${RP(taruhan)}* koin per orang (menang bawa ${RP(taruhan * 2)}!)\n⏳ Berlaku 3 menit.\n\n@${String(target).split('@')[0]}, terima?`
    try {
      await m.sendButtons({
        title: '⚔️ TANTANGAN DUEL', text: teks, footer: 'Menang: pot 2× + 50 EXP',
        buttons: [{ text: '✅ Terima', id: `${P}duelterima` }, { text: '❌ Tolak', id: `${P}dueltolak` }, { text: 'ℹ️ Info', id: `${P}duelinfo` }]
      }, { mentions: [target] })
    } catch { await m.reply(teks + `\n\n\`${P}duelterima\` / \`${P}dueltolak\``, { mentions: [target] }) }
  }
}

export const duelTerima = {
  command: ['duelterima', 'terimaduel', 'duelya', 'duelok', 'setujuduel'],
  category: 'RPG Menu',
  description: '✅ Terima tantangan duel (khusus yang ditantang)',
  limit: 0,
  run: async m => {
    const saya = m.senderKey || m.sender
    const s = ambilDuel(m)
    if (!s || s.basi) return m.reply(s?.basi ? '⏳ Tantangan sudah basi (3 menit) — taruhan penantang dikembalikan.' : `ℹ️ Tidak ada tantangan duel di chat ini.\nBuat: \`${P}tarung @user <taruhan>\``)
    if (s.mulai) return m.reply('⚔️ Duel sudah berjalan! ' + `\`${P}duelinfo\``)
    if (saya !== s.b) return m.reply('❌ Hanya yang ditantang yang bisa menerima.')
    if ((getRPG(saya).money || 0) < s.taruhan) { duelSessions.delete(m.jid); try { addMoney(s.a, s.taruhan) } catch {}; return m.reply('❌ Koinmu kurang — duel dibatalkan, taruhan penantang dikembalikan.') }
    addMoney(saya, -s.taruhan)
    s.hp = { a: hpDuel(s.a), b: hpDuel(s.b) }
    s.maks = { ...s.hp }
    s.giliran = Math.random() < 0.5 ? s.a : s.b
    s.mulai = true
    s.expires = Date.now() + DUEL_TTL
    duelSessions.set(m.jid, s)
    const teks = `⚔️ *DUEL DIMULAI!*\n\n${papanDuel(m, s)}`
    try {
      await m.sendButtons({ title: '⚔️ DUEL DIMULAI', text: teks, buttons: [{ text: '🗡️ Serang', id: `${P}duelserang` }, { text: '💚 Heal', id: `${P}duelheal` }, { text: '🏳️ Kabur', id: `${P}duelkabur` }] })
    } catch { await m.reply(teks) }
  }
}

export const duelTolak = {
  command: ['dueltolak', 'tolakduel', 'duelno', 'duelgamau', 'batalduel'],
  category: 'RPG Menu',
  description: '❌ Tolak / batalkan tantangan duel',
  limit: 0,
  run: async m => {
    const saya = m.senderKey || m.sender
    const s = ambilDuel(m, false)
    if (!s || s.mulai) return m.reply('ℹ️ Tidak ada tantangan yang bisa dibatalkan.')
    if (saya !== s.a && saya !== s.b) return m.reply('❌ Bukan duelmu.')
    duelSessions.delete(m.jid)
    try { addMoney(s.a, s.taruhan) } catch {}
    return m.reply(`❌ Tantangan duel dibatalkan. Taruhan ${RP(s.taruhan)} dikembalikan ke ${nama(m, s.a)}.`)
  }
}

async function aksiDuel (m, aksi) {
  const saya = m.senderKey || m.sender
  const s = ambilDuel(m)
  if (!s || s.basi) return m.reply(s?.basi ? '⏳ Tantangan sudah basi — taruhan dikembalikan.' : `ℹ️ Tidak ada duel aktif.\nMulai: \`${P}tarung @user <taruhan>\``)
  if (s.wo) { // giliran sebelumnya hangus
    const pemenang = s.wo === s.a ? s.b : s.a
    return akhiriDuel(m, s, pemenang, `⏳ ${nama(m, s.wo)} tidak bergerak 3 menit — kalah WO!`)
  }
  if (!s.mulai) return m.reply(`⏳ Duel belum dimulai — menunggu @${String(s.b).split('@')[0]}: \`${P}duelterima\` / \`${P}dueltolak\``, { mentions: [s.b] })
  if (saya !== s.giliran) return m.reply(`⏳ Bukan giliranmu! Menunggu *${nama(m, s.giliran)}*.`)
  const lawan = saya === s.a ? s.b : s.a
  const kunciSaya = saya === s.a ? 'a' : 'b'
  const kunciLawan = saya === s.a ? 'b' : 'a'
  if (aksi === 'kabur') return akhiriDuel(m, s, lawan, `🏳️ ${nama(m, saya)} kabur dari arena!`)
  if (aksi === 'heal') {
    const r = getRPG(saya)
    if ((r.energy || 0) < 25) return m.reply(`⚡ Energi kurang (butuh 25, punya ${r.energy || 0}). Regen 1/2 menit atau \`${P}makan\`.`)
    r.energy -= 25
    saveDB('users')
    const pulih = Math.round(s.maks[kunciSaya] * 0.35)
    s.hp[kunciSaya] = Math.min(s.maks[kunciSaya], s.hp[kunciSaya] + pulih)
    s.giliran = lawan
    s.expires = Date.now() + DUEL_TTL
    duelSessions.set(m.jid, s)
    const teks = `💚 ${nama(m, saya)} memulihkan *${pulih} HP*!\n\n${papanDuel(m, s)}`
    try { await m.sendButtons({ title: '💚 DUEL — HEAL', text: teks, buttons: [{ text: '🗡️ Serang', id: `${P}duelserang` }, { text: '💚 Heal', id: `${P}duelheal` }, { text: '🏳️ Kabur', id: `${P}duelkabur` }] }) } catch { await m.reply(teks) }
    return
  }
  /* serang */
  const krit = Math.random() < 0.15
  let dmg = Math.round(atkDari(saya) * (0.8 + Math.random() * 0.5) * (1 - redDari(lawan)))
  if (krit) dmg = Math.round(dmg * 1.5)
  s.hp[kunciLawan] = Math.max(0, s.hp[kunciLawan] - dmg)
  if (s.hp[kunciLawan] <= 0) return akhiriDuel(m, s, saya, `🗡️ ${nama(m, saya)} menghantam ${nama(m, lawan)} dengan *${dmg} damage*${krit ? ' (CRITICAL! 💥)' : ''} — KO!`)
  s.giliran = lawan
  s.expires = Date.now() + DUEL_TTL
  duelSessions.set(m.jid, s)
  const teks = `🗡️ ${nama(m, saya)} menyerang ${nama(m, lawan)}: *${dmg} damage*${krit ? ' 💥CRITICAL!' : ''}\n\n${papanDuel(m, s)}`
  try { await m.sendButtons({ title: '🗡️ DUEL', text: teks, buttons: [{ text: '🗡️ Serang', id: `${P}duelserang` }, { text: '💚 Heal', id: `${P}duelheal` }, { text: '🏳️ Kabur', id: `${P}duelkabur` }] }) } catch { await m.reply(teks) }
}

export const duelSerang = {
  command: ['duelserang', 'duelhit', 'duelattack', 'duelgebuk', 'duelpukul'],
  category: 'RPG Menu', description: '🗡️ Serang lawan saat giliran duelmu', limit: 0,
  run: m => aksiDuel(m, 'serang')
}
export const duelHeal = {
  command: ['duelheal', 'duelobat', 'duelrecovery', 'duelpulih', 'duelnyawa'],
  category: 'RPG Menu', description: '💚 Pulihkan 35% HP duel (25 energi)', limit: 0,
  run: m => aksiDuel(m, 'heal')
}
export const duelKabur = {
  command: ['duelkabur', 'duelnyerah', 'duelsurrender', 'duelmenyerah', 'duelkeluar'],
  category: 'RPG Menu', description: '🏳️ Menyerah kalah duel (lawan bawa pot)', limit: 0,
  run: m => aksiDuel(m, 'kabur')
}
export const duelInfo = {
  command: ['duelinfo', 'infoduel', 'cekduel', 'statusduel', 'duelstatus'],
  category: 'RPG Menu', description: 'ℹ️ Lihat papan duel aktif di chat ini', limit: 0,
  run: async m => {
    const s = ambilDuel(m)
    if (!s || s.basi) return m.reply(s?.basi ? '⏳ Tantangan sudah basi — taruhan dikembalikan.' : `ℹ️ Tidak ada duel aktif.\nMulai: \`${P}tarung @user <taruhan>\``)
    if (s.wo) {
      const pemenang = s.wo === s.a ? s.b : s.a
      return akhiriDuel(m, s, pemenang, `⏳ ${nama(m, s.wo)} tidak bergerak 3 menit — kalah WO!`)
    }
    if (!s.mulai) return m.reply(`⚔️ *TANTANGAN MENUNGGU*\n\n${nama(m, s.a)} vs @${String(s.b).split('@')[0]} · taruhan ${RP(s.taruhan)}\n@${String(s.b).split('@')[0]}: \`${P}duelterima\` / \`${P}dueltolak\``, { mentions: [s.b] })
    return m.reply(papanDuel(m, s))
  }
}

/* ================= PETI HARTA ================= */
const PETI = {
  kayu: { nama: 'Peti Kayu', icon: '🪵', harga: 1500, exp: [15, 40], koin: [0.6, 2.2], item: [['kayu', 3], ['batu', 3], ['ikan', 2]], jackpot: 1, hadiahJackpot: { koin: 6000, item: ['besi', 2], exp: 60 } },
  perak: { nama: 'Peti Perak', icon: '🥈', harga: 6000, exp: [40, 100], koin: [0.7, 2.4], item: [['besi', 2], ['daging', 3], ['ramuan', 2], ['roti', 2]], jackpot: 2, hadiahJackpot: { koin: 25000, item: ['emas', 2], exp: 150 } },
  emas: { nama: 'Peti Emas', icon: '🥇', harga: 18000, exp: [100, 220], koin: [0.8, 2.6], item: [['emas', 2], ['gading', 2], ['ramuan', 3]], jackpot: 3, hadiahJackpot: { koin: 70000, item: ['berlian', 1], exp: 300 } },
  legenda: { nama: 'Peti Legenda', icon: '💎', harga: 50000, exp: [220, 450], koin: [0.9, 3], item: [['berlian', 1], ['emas', 3], ['pedang', 1]], jackpot: 4, hadiahJackpot: { koin: 200000, item: ['berlian', 3], exp: 600 } }
}
const acak = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
function gratisKayu (u) {
  const hari = new Date().toLocaleDateString('en-CA')
  if (u.petiHarian?.tgl !== hari) { u.petiHarian = { tgl: hari, kayu: false }; saveDB('users') }
  return !u.petiHarian.kayu
}
export function bukaPeti (jid, tier) {
  const t = PETI[tier]
  const hasil = { tier, jackpot: false, koin: 0, exp: 0, item: null }
  if (Math.random() * 100 < t.jackpot) {
    hasil.jackpot = true
    hasil.koin = t.hadiahJackpot.koin
    hasil.exp = t.hadiahJackpot.exp
    hasil.item = t.hadiahJackpot.item
  } else {
    hasil.koin = Math.round(t.harga * (t.koin[0] + Math.random() * (t.koin[1] - t.koin[0])))
    hasil.exp = acak(t.exp[0], t.exp[1])
    if (Math.random() < 0.65) hasil.item = t.item[Math.floor(Math.random() * t.item.length)]
  }
  try { addMoney(jid, hasil.koin); addExp(jid, hasil.exp) } catch {}
  if (hasil.item) { try { addItem(jid, hasil.item[0], hasil.item[1]) } catch {} }
  try { catatSkor(jid, getUser(jid)?.name || 'Pemain', 'peti', hasil.koin) } catch {}
  return hasil
}
export const peti = {
  command: ['peti', 'petiharta', 'chest', 'petiku', 'daftarpteri'],
  category: 'RPG Menu',
  description: '🎁 Peti harta karun: kayu gratis 1×/hari, perak/emas/legenda pakai koin',
  limit: 0,
  run: async m => {
    const u = getUser(m.senderKey || m.sender)
    const gratis = gratisKayu(u)
    const teks = `🎁 *PETI HARTA KARUN*\n\n` +
      Object.entries(PETI).map(([k, t]) => `${t.icon} *${t.nama}* — ${k === 'kayu' && gratis ? 'GRATIS 1× hari ini! 🎉' : `💰 ${RP(t.harga)}`}\n   └ hadiah koin + EXP + item${t.jackpot}% jackpot`).join('\n') +
      `\n\nBuka: \`${P}bukapeti <tier>\` (contoh: \`${P}bukapeti emas\`)`
    try {
      await m.sendButtons({
        title: '🎁 PETI HARTA', text: teks,
        buttons: [{ text: `${gratis ? '🎉 Buka Kayu GRATIS' : '🪵 Kayu'}`, id: `${P}bukapeti kayu` }, { text: '🥈 Perak', id: `${P}bukapeti perak` }, { text: '🥇 Emas', id: `${P}bukapeti emas` }, { text: '💎 Legenda', id: `${P}bukapeti legenda` }]
      })
    } catch { await m.reply(teks) }
  }
}
export const bukaPetiCmd = {
  command: ['bukapeti', 'openchest', 'bukachest', 'gachapeti', 'petibuka'],
  category: 'RPG Menu',
  description: '🔓 Buka peti harta: .bukapeti [kayu|perak|emas|legenda]',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const saya = m.senderKey || m.sender
    const tier = String(m.args[0] || 'kayu').toLowerCase()
    const t = PETI[tier]
    if (!t) return m.reply(`❌ Tier tidak ada. Pilih: kayu / perak / emas / legenda.\nLihat: \`${P}peti\``)
    const u = getUser(saya)
    let gratis = false
    if (tier === 'kayu' && gratisKayu(u)) { gratis = true; u.petiHarian.kayu = true; saveDB('users') }
    else {
      if ((getRPG(saya).money || 0) < t.harga) return m.reply(`❌ Koin kurang (butuh ${RP(t.harga)}, punya ${RP(getRPG(saya).money)}).`)
      addMoney(saya, -t.harga)
    }
    const h = bukaPeti(saya, tier)
    const itemTx = h.item && ITEMS[h.item[0]] ? `\n🎒 +${h.item[1]}× ${ITEMS[h.item[0]].icon} ${ITEMS[h.item[0]].name}` : ''
    const teks = h.jackpot
      ? `🎆 *JACKPOT!!!* 🎆\n${t.icon} ${t.nama} meledak penuh cahaya!\n\n💰 +${RP(h.koin)} koin\n✨ +${h.exp} EXP${itemTx}`
      : `${t.icon} *${t.nama} DIBUKA*${gratis ? ' (GRATIS harian 🎉)' : ''}\n\n💰 +${RP(h.koin)} koin\n✨ +${h.exp} EXP${itemTx}`
    try {
      await m.sendButtons({ title: h.jackpot ? '🎆 JACKPOT!' : `${t.icon} PETI DIBUKA`, text: teks + `\n\nBuka lagi?`, buttons: [{ text: `${t.icon} Buka Lagi`, id: `${P}bukapeti ${tier}` }, { text: '🎁 Semua Peti', id: `${P}peti` }, { text: '🎒 Inventory', id: `${P}inv` }] })
    } catch { await m.reply(teks) }
  }
}

export default { duel, duelTerima, duelTolak, duelSerang, duelHeal, duelKabur, duelInfo, peti, bukaPetiCmd }
