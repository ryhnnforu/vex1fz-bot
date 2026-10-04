/**
 * ============================================================
 *  lib/rpg7.js — ENGINE RPG v7 (sistem lanjutan, saling terhubung)
 * ------------------------------------------------------------
 *  Menyimpan definisi & logika bersama untuk fitur RPG v7:
 *   • JOB/KELAS      → pengali ATK/DEF/HP, crit, biaya energi, skill khusus
 *   • SKILL TREE     → 12 skill pasif (3 cabang) dibeli pakai poin level
 *   • PERMATA        → socket ke senjata/armor (bonus flat + persen)
 *   • RELIK          → pasif unik dari berburu relik / dungeon
 *   • BUFF MAKANAN   → efek sementara dari memasak & alkimia
 *   • GUILD          → database/guilds.json (bendaha, level, misi mingguan)
 *   • WORLD BOSS     → database/worldboss.json (HP bersama, kontribusi)
 *   • MARKET         → database/market.json (jual-beli antar pemain)
 *   • PETERNAKAN     → hewan produksi (telur/susu/wol) ber-timer
 *   • RUMAH          → bonus regen energi & kapasitas inventory
 *   • MUSIM          → rotasi 4 musim, memengaruhi panen & loot
 *   • REBIRTH        → prestige: reset level, dapat pengali permanen
 *
 *  Semua dibaca dari `users.json → u.rpg` (field baru ditambal otomatis
 *  oleh siapkan7), sehingga data pemain v6 tetap aman.
 * ============================================================
 */
import { config } from '../config.js'
import { truncate, pickRandom, formatDuration } from './functions.js'
import { getUser, saveDB, loadDB, allUsers } from './database.js'
import { getRPG, equipBonus, addMoney, addExp, addItem, takeItem, ITEMS } from './rpg.js'

export const P = config.display.prefix
export const K = m => m.senderKey || m.sender
export const HARI = () => new Date().toISOString().slice(0, 10)
export const MINGGU = () => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d.toISOString().slice(0, 10)
}
export const fmt = n => Math.round(n || 0).toLocaleString('id-ID')

/* ================================================================== */
/*  1. JOB / KELAS                                                     */
/* ================================================================== */
export const JOBS = {
  warrior: { nama: 'Warrior', icon: '⚔️', minLevel: 3, atk: 1.15, def: 1.2, hp: 20, crit: 0.05, energi: 1, loot: 1, desc: 'Petarung garis depan: ATK & DEF tinggi, HP bonus.' },
  mage: { nama: 'Mage', icon: '🔮', minLevel: 3, atk: 1.3, def: 0.9, hp: 0, crit: 0.08, energi: 1.25, loot: 1.05, desc: 'Serangan besar tapi boros energi & rapuh.' },
  archer: { nama: 'Archer', icon: '🏹', minLevel: 3, atk: 1.1, def: 1, hp: 5, crit: 0.18, energi: 0.95, loot: 1.05, desc: 'Critical tinggi, hemat energi.' },
  assassin: { nama: 'Assassin', icon: '🗡️', minLevel: 5, atk: 1.2, def: 0.85, hp: 0, crit: 0.28, energi: 0.9, loot: 1.15, desc: 'Crit & loot tertinggi, pertahanan lemah.' },
  farmer: { nama: 'Farmer', icon: '🌾', minLevel: 2, atk: 0.9, def: 1.05, hp: 10, crit: 0.03, energi: 0.8, loot: 1.1, desc: 'Panen & hasil kebun melimpah, energi irit.' },
  healer: { nama: 'Healer', icon: '💚', minLevel: 4, atk: 0.95, def: 1.1, hp: 25, crit: 0.05, energi: 0.9, loot: 1, desc: 'Regen HP/energi jauh lebih cepat.' }
}
export const JOB_SKILL = {
  warrior: { nama: 'Amukan Baja', icon: '💢', efek: 'atk', nilai: 0.5, durasi: 180000, desc: '+50% ATK selama 3 menit' },
  mage: { nama: 'Bola Api', icon: '🔥', efek: 'dmg', nilai: 90, durasi: 0, desc: 'Ledakan instan 90 damage ke musuh (battle RPG)' },
  archer: { nama: 'Panah Presisi', icon: '🎯', efek: 'crit', nilai: 0.4, durasi: 180000, desc: '+40% crit selama 3 menit' },
  assassin: { nama: 'Bayangan', icon: '🌫️', efek: 'luck', nilai: 0.5, durasi: 180000, desc: '+50% luck (loot & koin) selama 3 menit' },
  farmer: { nama: 'Tangan Subur', icon: '🌱', efek: 'panen', nilai: 2, durasi: 0, desc: 'Panen berikutnya menghasilkan 2×' },
  healer: { nama: 'Doa Sembuh', icon: '✨', efek: 'heal', nilai: 80, durasi: 0, desc: 'Pulihkan 80 HP + 40 energi seketika' }
}

/* ================================================================== */
/*  2. SKILL TREE (12 skill, 3 cabang)                                 */
/* ================================================================== */
export const SKILLS = {
  // cabang SERANG
  serang1: { nama: 'Tenaga Dalam', icon: '💪', cabang: 'Serang', biaya: 1, atk: 0.05, desc: '+5% ATK' },
  serang2: { nama: 'Pukulan Ganda', icon: '👊', cabang: 'Serang', biaya: 2, crit: 0.06, desc: '+6% crit', butuh: 'serang1' },
  serang3: { nama: 'Amukan Naga', icon: '🐲', cabang: 'Serang', biaya: 3, atk: 0.12, desc: '+12% ATK', butuh: 'serang2' },
  serang4: { nama: 'Pemburu Raksasa', icon: '🗡️', cabang: 'Serang', biaya: 4, atk: 0.08, dmgBoss: 0.25, desc: '+8% ATK, +25% damage ke boss', butuh: 'serang3' },
  // cabang TAHAN
  tahan1: { nama: 'Kulit Besi', icon: '🛡️', cabang: 'Tahan', biaya: 1, def: 0.08, desc: '+8% DEF' },
  tahan2: { nama: 'Tubuh Karang', icon: '🪨', cabang: 'Tahan', biaya: 2, hp: 25, desc: '+25 HP maks', butuh: 'tahan1' },
  tahan3: { nama: 'Pulih Cepat', icon: '💗', cabang: 'Tahan', biaya: 3, regen: 0.4, desc: '+40% regen HP/energi', butuh: 'tahan2' },
  tahan4: { nama: 'Benteng Abadi', icon: '🏰', cabang: 'Tahan', biaya: 4, def: 0.15, hp: 40, desc: '+15% DEF, +40 HP', butuh: 'tahan3' },
  // cabang UNTUNG
  untung1: { nama: 'Mata Tajam', icon: '👁️', cabang: 'Untung', biaya: 1, luck: 0.15, desc: '+15% luck (loot)' },
  untung2: { nama: 'Tangan Dingin', icon: '🧊', cabang: 'Untung', biaya: 2, koin: 0.1, desc: '+10% koin dari semua sumber', butuh: 'untung1' },
  untung3: { nama: 'Hemat Energi', icon: '⚡', cabang: 'Untung', biaya: 2, energi: -0.15, desc: '-15% biaya energi', butuh: 'untung1' },
  untung4: { nama: 'Sentuhan Midas', icon: '👑', cabang: 'Untung', biaya: 4, koin: 0.2, luck: 0.2, desc: '+20% koin & +20% luck', butuh: 'untung2' }
}

/* ================================================================== */
/*  3. PERMATA, RELIK, MUSIM                                           */
/* ================================================================== */
export const GEMS = {
  rubin: { nama: 'Rubin', icon: '🔴', atk: 0.08, desc: '+8% ATK', jual: 1800 },
  safir: { nama: 'Safir', icon: '🔵', def: 0.08, desc: '+8% DEF', jual: 1800 },
  zamrud: { nama: 'Zamrud', icon: '🟢', luck: 0.12, desc: '+12% luck', jual: 2200 },
  topaz: { nama: 'Topaz', icon: '🟡', koin: 0.1, desc: '+10% koin', jual: 2000 },
  ametis: { nama: 'Amethyst', icon: '🟣', energi: -0.1, desc: '-10% biaya energi', jual: 2400 },
  berlianhitam: { nama: 'Berlian Hitam', icon: '⚫', atk: 0.12, def: 0.12, crit: 0.05, desc: '+12% ATK/DEF, +5% crit', jual: 6000 }
}
export const RELICS = {
  jantungnaga: { nama: 'Jantung Naga', icon: '🐉', atk: 0.15, hp: 30, desc: '+15% ATK, +30 HP', rarity: 'Legendary' },
  mahkotakuno: { nama: 'Mahkota Kuno', icon: '👑', koin: 0.2, luck: 0.15, desc: '+20% koin, +15% luck', rarity: 'Epic' },
  cincinbayangan: { nama: 'Cincin Bayangan', icon: '💍', crit: 0.12, luck: 0.1, desc: '+12% crit, +10% luck', rarity: 'Epic' },
  perisaiAtlas: { nama: 'Perisai Atlas', icon: '🛡️', def: 0.2, hp: 50, desc: '+20% DEF, +50 HP', rarity: 'Legendary' },
  lenterajiwa: { nama: 'Lentera Jiwa', icon: '🏮', regen: 0.5, desc: '+50% regen', rarity: 'Rare' },
  benihkehidupan: { nama: 'Benih Kehidupan', icon: '🌱', panen: 0.3, energi: -0.1, desc: '+30% hasil panen, -10% energi', rarity: 'Rare' },
  mataperamal: { nama: 'Mata Peramal', icon: '🔮', exp: 0.15, desc: '+15% EXP', rarity: 'Epic' },
  tulangraksasa: { nama: 'Tulang Raksasa', icon: '🦴', hp: 80, def: 0.08, desc: '+80 HP, +8% DEF', rarity: 'Rare' }
}
export const MUSIM = [
  { id: 'semi', nama: 'Musim Semi', icon: '🌸', panen: 1.25, loot: 1, desc: 'Panen +25%' },
  { id: 'panas', nama: 'Musim Panas', icon: '☀️', panen: 0.9, loot: 1.15, koin: 1.1, desc: 'Loot & koin +15%, panen -10%' },
  { id: 'gugur', nama: 'Musim Gugur', icon: '🍂', panen: 1.4, loot: 1, desc: 'Panen +40% (panen raya)' },
  { id: 'dingin', nama: 'Musim Dingin', icon: '❄️', panen: 0.7, loot: 1.25, exp: 1.15, desc: 'Loot +25%, EXP +15%, panen -30%' }
]
export const musimIni = () => MUSIM[Math.floor(Date.now() / 86400000 / 7) % 4]

/* ================================================================== */
/*  4. MASAKAN & BUFF                                                  */
/* ================================================================== */
export const RESEP_MASAK = {
  nasiGoreng: { nama: 'Nasi Goreng Spesial', icon: '🍛', bahan: { gandum: 2, sayur: 1 }, efek: { energi: 40, hp: 20 }, durasi: 0, harga: 350 },
  supSayur: { nama: 'Sup Sayur Hangat', icon: '🍲', bahan: { sayur: 3 }, efek: { hp: 45 }, durasi: 0, harga: 280 },
  jusBuah: { nama: 'Jus Buah Segar', icon: '🧃', bahan: { buah: 3 }, efek: { energi: 35 }, durasi: 0, harga: 300 },
  rotiPanggang: { nama: 'Roti Panggang Madu', icon: '🍞', bahan: { gandum: 3 }, efek: { energi: 55, hp: 10 }, durasi: 0, harga: 400 },
  ikanBakar: { nama: 'Ikan Bakar Rica', icon: '🐟', bahan: { ikan: 2, sayur: 1 }, efek: { atk: 0.15, durasi: 900000 }, durasi: 900000, harga: 600 },
  steakDaging: { nama: 'Steak Monster', icon: '🥩', bahan: { daging: 2, sayur: 1 }, efek: { atk: 0.25, hp: 30, durasi: 1200000 }, durasi: 1200000, harga: 950 },
  saladMystic: { nama: 'Salad Mistik', icon: '🥗', bahan: { sayur: 2, buah: 2 }, efek: { luck: 0.2, durasi: 1200000 }, durasi: 1200000, harga: 800 },
  tehHerbal: { nama: 'Teh Herbal', icon: '🍵', bahan: { daun: 2, buah: 1 }, efek: { regen: 0.5, durasi: 1800000 }, durasi: 1800000, harga: 700 },
  kueUltah: { nama: 'Kue Perayaan', icon: '🎂', bahan: { gandum: 2, buah: 2 }, efek: { exp: 0.25, durasi: 1800000 }, durasi: 1800000, harga: 900 },
  ramuanBesi: { nama: 'Ramuan Kulit Besi', icon: '🧪', bahan: { besi: 2, daun: 2 }, efek: { def: 0.3, durasi: 900000 }, durasi: 900000, harga: 1100 },
  ramuanKuat: { nama: 'Ramuan Raksasa', icon: '⚗️', bahan: { emas: 1, daun: 3 }, efek: { atk: 0.4, durasi: 900000 }, durasi: 900000, harga: 1600 },
  elixirJiwa: { nama: 'Elixir Jiwa', icon: '🏺', bahan: { berlian: 1, buah: 3 }, efek: { hp: 150, energi: 100, luck: 0.3, durasi: 1800000 }, durasi: 1800000, harga: 3500 }
}
export const HEWAN = {
  ayam: { nama: 'Ayam', icon: '🐔', harga: 1200, hasil: 'telur', jumlah: 2, jam: 6, pakan: 'gandum' },
  bebek: { nama: 'Bebek', icon: '🦆', harga: 1800, hasil: 'telur', jumlah: 3, jam: 8, pakan: 'gandum' },
  kambing: { nama: 'Kambing', icon: '🐐', harga: 4500, hasil: 'susu', jumlah: 2, jam: 12, pakan: 'sayur' },
  sapi: { nama: 'Sapi', icon: '🐄', harga: 9000, hasil: 'susu', jumlah: 4, jam: 16, pakan: 'sayur' },
  domba: { nama: 'Domba', icon: '🐑', harga: 6000, hasil: 'wol', jumlah: 2, jam: 20, pakan: 'sayur' },
  kelinci: { nama: 'Kelinci', icon: '🐇', harga: 900, hasil: 'bulu', jumlah: 1, jam: 5, pakan: 'wortel' }
}
export const RUMAH = {
  gubuk: { nama: 'Gubuk Kayu', icon: '🛖', harga: 8000, regen: 0.15, koin: 0.03, slot: 2, kandang: 6, desc: '+15% regen, +3% koin, 2 slot dekorasi, kandang 6' },
  rumah: { nama: 'Rumah Sederhana', icon: '🏠', harga: 30000, regen: 0.3, koin: 0.06, slot: 4, kandang: 8, desc: '+30% regen, +6% koin, 4 slot dekorasi, kandang 8' },
  villa: { nama: 'Villa Bukit', icon: '🏡', harga: 90000, regen: 0.5, koin: 0.12, slot: 6, kandang: 10, desc: '+50% regen, +12% koin, 6 slot dekorasi, kandang 10' },
  kastil: { nama: 'Kastil Kecil', icon: '🏰', harga: 250000, regen: 0.8, koin: 0.2, slot: 8, kandang: 14, desc: '+80% regen, +20% koin, 8 slot dekorasi, kandang 14' }
}
export const DEKOR = {
  lukisan: { nama: 'Lukisan', icon: '🖼️', harga: 2000, luck: 0.03 },
  tanaman: { nama: 'Tanaman Hias', icon: '🪴', harga: 1500, regen: 0.05 },
  karpet: { nama: 'Karpet Persia', icon: '🧶', harga: 3000, koin: 0.02 },
  lampu: { nama: 'Lampu Kristal', icon: '💡', harga: 4500, exp: 0.05 },
  akuarium: { nama: 'Akuarium', icon: '🐠', harga: 6000, luck: 0.05 },
  patung: { nama: 'Patung Pahlawan', icon: '🗿', harga: 8000, atk: 0.04 }
}

/* item baru yang dipakai sistem v7 (ditambahkan ke engine ITEMS) */
Object.assign(ITEMS, {
  telur: { name: 'Telur', icon: '🥚', sell: 90, type: 'food' },
  susu: { name: 'Susu', icon: '🥛', sell: 140, type: 'food' },
  wol: { name: 'Wol', icon: '🧶', sell: 320, type: 'material' },
  bulu: { name: 'Bulu Halus', icon: '🪶', sell: 110, type: 'material' },
  daging: { name: 'Daging', icon: '🥩', sell: 260, type: 'food' },
  daun: { name: 'Daun Herbal', icon: '🌿', sell: 120, type: 'material' },
  wortel: { name: 'Wortel', icon: '🥕', sell: 85, type: 'food' },
  rubin: { name: 'Rubin', icon: '🔴', sell: GEMS.rubin.jual, type: 'gem' },
  safir: { name: 'Safir', icon: '🔵', sell: GEMS.safir.jual, type: 'gem' },
  zamrud: { name: 'Zamrud', icon: '🟢', sell: GEMS.zamrud.jual, type: 'gem' },
  topaz: { name: 'Topaz', icon: '🟡', sell: GEMS.topaz.jual, type: 'gem' },
  ametis: { name: 'Amethyst', icon: '🟣', sell: GEMS.ametis.jual, type: 'gem' },
  berlianhitam: { name: 'Berlian Hitam', icon: '⚫', sell: GEMS.berlianhitam.jual, type: 'gem' },
  pakan: { name: 'Pakan Ternak', icon: '🌾', buy: 200, sell: 80, type: 'material' }
})

/* ================================================================== */
/*  5. STATE: tambal field v7 di data RPG lama                         */
/* ================================================================== */
export function siapkan7 (r) {
  r.inventory = r.inventory || {}
  r.equipped = r.equipped || { weapon: null, armor: null, tool: null }
  r.job = r.job || null
  r.jobSkillTerakhir = r.jobSkillTerakhir || 0
  r.skill = r.skill || { poin: 0, dimiliki: {} }
  r.skill.dimiliki = r.skill.dimiliki || {}
  r.buff = r.buff || []
  r.permata = r.permata || { weapon: null, armor: null }
  r.relik = r.relik || { dipakai: null, dimiliki: [] }
  r.hewan = r.hewan || []
  r.rumah = r.rumah || null
  r.dekor = r.dekor || []
  r.rebirth = r.rebirth || { jumlah: 0, pengali: 1 }
  r.streak = r.streak || { hari: 0, terakhir: 0, terbaik: 0 }
  r.turnamen = r.turnamen || { minggu: '', ikut: false, poin: 0, menang: 0 }
  r.musimKlaim = r.musimKlaim || ''
  r.guild = r.guild || { id: null, donasi: 0 }
  r.boss = r.boss || { kontribusi: 0, klaim: '' }
  r.log7 = r.log7 || []
  return r
}
export const R7 = m => siapkan7(getRPG(K(m)))
export const R7jid = jid => siapkan7(getRPG(jid))
export const simpan = () => saveDB('users')
export function catat7 (r, teks) {
  r.log7 = [{ w: Date.now(), t: truncate(teks, 90) }, ...(r.log7 || [])].slice(0, 25)
}

/* ================================================================== */
/*  6. STATISTIK TURUNAN v7 (job + skill + permata + relik + buff +     */
/*     rumah + dekor + rebirth + musim)                                 */
/* ================================================================== */
export function buffAktif (r) {
  const now = Date.now()
  r.buff = (r.buff || []).filter(b => b.sampai > now)
  return r.buff
}

export function stat7 (jid) {
  const r = siapkan7(getRPG(jid))
  const job = r.job ? JOBS[r.job] : null
  let atkW = 0, defA = 0, toolT = 0
  try { atkW = equipBonus(jid, 'weapon') } catch {}
  try { defA = equipBonus(jid, 'armor') } catch {}
  try { toolT = equipBonus(jid, 'tool') } catch {}

  const s = { atkPct: 0, defPct: 0, hpFlat: 0, crit: 0.05, luckPct: 0, koinPct: 0, expPct: 0, regenPct: 0, energiPct: 0, panenPct: 0, dmgBoss: 0 }

  // job
  if (job) { s.atkPct += job.atk - 1; s.defPct += job.def - 1; s.hpFlat += job.hp; s.crit += job.crit; s.energiPct += job.energi - 1; s.luckPct += job.loot - 1 }
  // skill
  for (const id of Object.keys(r.skill.dimiliki || {})) {
    const sk = SKILLS[id]
    if (!sk) continue
    s.atkPct += sk.atk || 0; s.defPct += sk.def || 0; s.hpFlat += sk.hp || 0
    s.crit += sk.crit || 0; s.luckPct += sk.luck || 0; s.koinPct += sk.koin || 0
    s.regenPct += sk.regen || 0; s.energiPct += sk.energi || 0; s.panenPct += sk.panen || 0
    s.dmgBoss += sk.dmgBoss || 0; s.expPct += sk.exp || 0
  }
  // permata (socket di senjata/armor)
  for (const slot of ['weapon', 'armor']) {
    const g = r.permata?.[slot] ? GEMS[r.permata[slot]] : null
    if (!g) continue
    s.atkPct += g.atk || 0; s.defPct += g.def || 0; s.crit += g.crit || 0
    s.luckPct += g.luck || 0; s.koinPct += g.koin || 0; s.energiPct += g.energi || 0
  }
  // relik
  const rel = r.relik?.dipakai ? RELICS[r.relik.dipakai] : null
  if (rel) {
    s.atkPct += rel.atk || 0; s.defPct += rel.def || 0; s.hpFlat += rel.hp || 0
    s.crit += rel.crit || 0; s.luckPct += rel.luck || 0; s.koinPct += rel.koin || 0
    s.regenPct += rel.regen || 0; s.expPct += rel.exp || 0; s.panenPct += rel.panen || 0
    s.energiPct += rel.energi || 0
  }
  // buff makanan
  for (const b of buffAktif(r)) {
    const e = b.efek || {}
    s.atkPct += e.atk || 0; s.defPct += e.def || 0; s.luckPct += e.luck || 0
    s.koinPct += e.koin || 0; s.expPct += e.exp || 0; s.regenPct += e.regen || 0
    s.crit += e.crit || 0
  }
  // rumah + dekorasi
  if (r.rumah && RUMAH[r.rumah]) { s.regenPct += RUMAH[r.rumah].regen || 0; s.koinPct += RUMAH[r.rumah].koin || 0 }
  for (const d of r.dekor || []) {
    const dek = DEKOR[d]
    if (!dek) continue
    s.luckPct += dek.luck || 0; s.regenPct += dek.regen || 0; s.koinPct += dek.koin || 0; s.expPct += dek.exp || 0; s.atkPct += dek.atk || 0
  }
  // rebirth
  const pengali = r.rebirth?.pengali || 1
  // musim
  const musim = musimIni()

  const petLv = r.pet?.level || 0
  const atkPet = (r.pet?.atk || 0) + petLv * 1.2
  const atk = Math.round(((10 + r.level * 3) * (1 + atkW) + atkPet) * (1 + s.atkPct) * pengali)
  const def = Math.round(((5 + r.level * 2) * (1 + defA)) * (1 + s.defPct) * pengali)
  const maxHealth = (r.maxHealth || 100) + s.hpFlat
  const maxEnergy = r.maxEnergy || 100

  return {
    r, job, rel, musim, s,
    atk, def, maxHealth, maxEnergy,
    crit: Math.min(0.85, s.crit),
    luck: Math.max(0.2, 1 + s.luckPct + (r.prestasi?.klaim?.length || 0) * 0.01) * (musim.loot || 1),
    koin: Math.max(0.2, 1 + s.koinPct) * pengali * (musim.koin || 1),
    exp: Math.max(0.2, 1 + s.expPct) * (musim.exp || 1),
    regen: Math.max(0.2, 1 + s.regenPct),
    energi: Math.max(0.3, 1 + s.energiPct),
    panen: Math.max(0.3, 1 + s.panenPct) * (musim.panen || 1),
    dmgBoss: s.dmgBoss,
    toolBonus: toolT,
    pengali
  }
}

/** biaya energi setelah diskon */
export const biayaEnergi = (st, dasar) => Math.max(1, Math.round(dasar * st.energi))
/** hadiah koin setelah bonus */
export const koinHadiah = (st, dasar) => Math.max(1, Math.round(dasar * st.koin * st.luck))
/** exp setelah bonus */
export const expHadiah = (st, dasar) => Math.max(1, Math.round(dasar * st.exp))

/* ================================================================== */
/*  7. KARTU GAMBAR (tema menyesuaikan fitur)                          */
/* ================================================================== */
export async function kartu7 (m, { judul, sub, footer, tema = 'midnight', kataBg = '', tinggi = 420 }) {
  try {
    const { makeBanner } = await import('./canvas.js')
    let bg = null
    if (kataBg) {
      try {
        const res = await fetch(`https://loremflickr.com/900/${tinggi}/${encodeURIComponent(kataBg)}`, {
          redirect: 'follow', signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        if (res.ok) { const b = Buffer.from(await res.arrayBuffer()); if (b.length > 3000) bg = b }
      } catch { bg = null }
    }
    return await makeBanner({ title: judul, subtitle: sub, footer, theme: tema, background: bg, width: 900, height: tinggi })
  } catch { return null }
}
export async function kirimKartu7 (m, buf, caption, buttons) {
  /* buttons boleh berupa array [{text,id}] atau {title, buttons:[...]} */
  const opt = Array.isArray(buttons) ? { buttons } : (buttons || {})
  const list = Array.isArray(opt.buttons) && opt.buttons.length ? opt.buttons : null
  const title = opt.title || '⚔️ RPG v7'
  if (buf) {
    if (list) return m.sendButtons({ title, text: caption, footer: config.bot.footer, buttons: list, image: buf })
    return m.sendImage(buf, caption)
  }
  if (list) return m.sendButtons({ title, text: caption, footer: config.bot.footer, buttons: list })
  return m.reply(caption)
}

/* ================================================================== */
/*  8. GUILD (database/guilds.json)                                    */
/* ================================================================== */
export function guildDB () { const d = loadDB('guilds', {}); return d }
export function simpanGuild () { saveDB('guilds') }
export function cariGuild (nama) {
  const db = guildDB()
  const key = String(nama || '').toLowerCase()
  return Object.entries(db).find(([, g]) => (g.nama || '').toLowerCase() === key)?.[1] ||
    Object.entries(db).find(([, g]) => (g.nama || '').toLowerCase().includes(key))?.[1] || null
}
export function guildDariId (id) { return id ? guildDB()[id] || null : null }
export function levelGuild (g) { return Math.max(1, Math.floor((g.bendahara || 0) / 20000) + 1) }
export function anggotaGuild (id) {
  return allUsers().filter(u => u.rpg?.guild?.id === id)
}

/* ================================================================== */
/*  9. WORLD BOSS (database/worldboss.json)                            */
/* ================================================================== */
export const BOSSES = [
  { id: 'nagaEs', nama: 'Naga Es Utara', icon: '🐉', hp: 12000, atk: 90, hadiah: 25000, exp: 1500, item: 'sisik', level: 5 },
  { id: 'rajaGoblin', nama: 'Raja Goblin', icon: '👺', hp: 8000, atk: 60, hadiah: 15000, exp: 900, item: 'emas', level: 3 },
  { id: 'kraken', nama: 'Kraken Laut Dalam', icon: '🐙', hp: 18000, atk: 120, hadiah: 40000, exp: 2400, item: 'berlian', level: 8 },
  { id: 'lichKing', nama: 'Lich King', icon: '💀', hp: 25000, atk: 150, hadiah: 60000, exp: 3600, item: 'berlianhitam', level: 12 }
]
export function bossDB () {
  const db = loadDB('worldboss', { aktif: null, riwayat: [] })
  /* boss yang tumbang tetap disimpan sampai hadiah diklaim (atau lewat 24 jam) */
  const kedaluwarsa = db.aktif?.selesai && Date.now() - (db.aktif.selesaiPada || 0) > 86400000
  if (!db.aktif || kedaluwarsa) {
    const calon = BOSSES.filter(b => b.level <= Math.max(3, rataLevel()))
    const b = pickRandom(calon.length ? calon : BOSSES)
    db.aktif = { id: b.id, hp: b.hp, hpMax: b.hp, mulai: Date.now(), kontribusi: {}, selesai: false, oleh: '' }
    saveDB('worldboss')
  }
  return db
}
export function infoBoss () { return BOSSES.find(b => b.id === bossDB().aktif?.id) || BOSSES[0] }
function rataLevel () {
  try {
    const us = allUsers().filter(u => u.rpg?.level)
    if (!us.length) return 3
    return Math.round(us.reduce((a, u) => a + (u.rpg.level || 1), 0) / us.length)
  } catch { return 3 }
}

/* ================================================================== */
/*  10. MARKET (database/market.json)                                  */
/* ================================================================== */
export function marketDB () { return loadDB('market', { listing: {}, riwayat: [] }) }
export function simpanMarket () { saveDB('market') }
export function listings () {
  const db = marketDB()
  return Object.entries(db.listing || {}).map(([id, l]) => ({ id, ...l })).sort((a, b) => a.harga - b.harga)
}
export function hargaRata (item) {
  const db = marketDB()
  const rel = (db.riwayat || []).filter(r => r.item === item).slice(-10)
  if (!rel.length) return null
  return Math.round(rel.reduce((a, r) => a + r.harga, 0) / rel.length)
}

/* ================================================================== */
/*  11. UTIL                                                           */
/* ================================================================== */
export function cariId (tabel, input) {
  /* cari kunci tabel dari input pengguna, toleran huruf besar/kecil & spasi */
  if (!input) return null
  const q = String(input).trim().toLowerCase().replace(/[\s_-]+/g, '')
  if (tabel[q]) return q
  for (const k of Object.keys(tabel)) if (k.toLowerCase().replace(/[\s_-]+/g, '') === q) return k
  const alt = tabel[q]?.id || null
  return alt
}
export function bar7 (nilai, maks, ukuran = 12) {
  const n = Math.max(0, Math.min(ukuran, Math.round((nilai / (maks || 1)) * ukuran)))
  return '█'.repeat(n) + '░'.repeat(ukuran - n)
}
export const butuhEnergi = (m, st, jumlah, label = 'aktivitas') => {
  const butuh = biayaEnergi(st, jumlah)
  if (st.r.energy < butuh) {
    m.reply(`⚡ Energi tidak cukup untuk ${label}.\n\nButuh: ${butuh} · Punya: ${st.r.energy}/${st.maxEnergy}\nIsi: ${P}makan roti · ${P}toko kue · tunggu regen${st.rumah ? ` (rumah ${RUMAH[st.rumah].icon} +${Math.round(RUMAH[st.rumah].regen * 100)}%)` : ''}`)
    return false
  }
  st.r.energy -= butuh
  return true
}
export { formatDuration, truncate, pickRandom, getRPG, addMoney, addExp, addItem, takeItem, ITEMS, getUser, saveDB, loadDB }

export default {
  JOBS, JOB_SKILL, SKILLS, GEMS, RELICS, MUSIM, musimIni, RESEP_MASAK, HEWAN, RUMAH, DEKOR,
  siapkan7, R7, R7jid, stat7, buffAktif, biayaEnergi, koinHadiah, expHadiah,
  kartu7, kirimKartu7, guildDB, cariGuild, guildDariId, levelGuild, anggotaGuild, simpanGuild,
  BOSSES, bossDB, infoBoss, marketDB, listings, hargaRata, simpanMarket, bar7, butuhEnergi, catat7
}
