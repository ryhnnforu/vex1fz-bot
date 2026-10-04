/**
 * ⚔️ RPGLAB — 50 fitur RPG lanjutan (kategori RPG Menu, v6)
 * ---------------------------------------------------------
 *  Semua sistem SALING TERHUBUNG lewat satu data `users.json → u.rpg`:
 *
 *  Level/EXP ─┬─ membuka lokasi jelajah, dungeon, & monster
 *             ├─ menaikkan Attack/Defense (dipakai arena, dungeon, battle)
 *  Peralatan ─┤   (weapon/armor/tool + level TEMPA +4%/level)
 *  Pet       ─┤   (bonus loot, energi, damage assist di dungeon & arena)
 *  Kebun     ─┤   (bibit → sayur/buah/gandum → bahan craft & jual)
 *  Menambang ─┤   (besi/emas/berlian → crafting & penempaan)
 *  Misi      ─┤   (dihitung dari aktivitas harian: hunt/mine/win/dungeon/...)
 *  Bank      ─┤   (koin aman + bunga 1%/hari, dipakai beli telur/peta/kunci)
 *  Prestasi  ─┴─ gelar + hadiah (koin, EXP, item langka)
 *
 *  Setiap fitur punya KARTU GAMBAR sendiri (lib/canvas.js makeBanner) yang
 *  temanya sesuai aktivitas: hutan, gua, danau, arena, toko, pet, dll.
 *  Bila jaringan gagal memuat latar, kartu tetap jadi (gradient tema).
 */
import { config } from '../config.js'
import { truncate, formatDuration, pickRandom } from '../lib/functions.js'
import { getUser, saveDB, allUsers } from '../lib/database.js'
import {
  ITEMS, MONSTERS, getRPG, addExp, addMoney, addItem, takeItem, hasItem,
  equipBonus, equip, battle, expNeeded, bar, inventoryList, catatHarian
} from '../lib/rpg.js'

const P = config.display.prefix
const HARI = () => new Date().toISOString().slice(0, 10)

/* ================================================================== */
/*  1. ITEM BARU (ditambahkan ke engine ITEMS agar toko/jual ikut tahu) */
/* ================================================================== */
Object.assign(ITEMS, {
  // bahan & konsumsi baru
  telurpet: { name: 'Telur Pet', icon: '🥚', buy: 5000, sell: 1500, type: 'material' },
  makananpet: { name: 'Makanan Pet', icon: '🍖', buy: 300, sell: 100, type: 'consumable' },
  bibit: { name: 'Bibit', icon: '🌱', buy: 150, sell: 60, type: 'material' },
  sayur: { name: 'Sayur', icon: '🥬', sell: 200, type: 'food' },
  buah: { name: 'Buah', icon: '🍎', sell: 260, type: 'food' },
  gandum: { name: 'Gandum', icon: '🌾', sell: 180, type: 'food' },
  kuncidungeon: { name: 'Kunci Dungeon', icon: '🗝️', buy: 3000, sell: 1200, type: 'material' },
  peta: { name: 'Peta Harta', icon: '🗺️', buy: 2500, sell: 900, type: 'material' },
  sisik: { name: 'Sisik Naga', icon: '🐉', sell: 2500, type: 'resource' },
  ramuanbesar: { name: 'Ramuan Besar', icon: '⚗️', buy: 1200, sell: 450, type: 'consumable' },
  kue: { name: 'Kue Energi', icon: '🍰', buy: 600, sell: 220, type: 'consumable' },
  // peralatan tingkat tinggi (bonus lebih besar, dipakai equipBonus)
  pedangemas: { name: 'Pedang Emas', icon: '⚔️', buy: 15000, sell: 5000, type: 'weapon', bonus: 0.6 },
  armoremas: { name: 'Armor Emas', icon: '🛡️', buy: 20000, sell: 7000, type: 'armor', bonus: 0.65 },
  armorbesi: { name: 'Armor Besi', icon: '🥋', buy: 9000, sell: 3000, type: 'armor', bonus: 0.45 },
  kapakemas: { name: 'Kapak Emas', icon: '🪓', buy: 8000, sell: 2800, type: 'tool', bonus: 0.5 },
  pickaxeemas: { name: 'Pickaxe Emas', icon: '⛏️', buy: 8500, sell: 2900, type: 'tool', bonus: 0.5 },
  pancingemas: { name: 'Pancing Emas', icon: '🎣', buy: 7000, sell: 2500, type: 'tool', bonus: 0.5 }
})

/* ================================================================== */
/*  2. DATA GAME: pet, lokasi, dungeon, resep, misi, prestasi          */
/* ================================================================== */
const PETS = [
  { id: 'kucing', nama: 'Kucing Hutan', icon: '🐱', rarity: 'Common', loot: 0.05, energi: 0, atk: 0, bg: 'cat,forest' },
  { id: 'kelinci', nama: 'Kelinci', icon: '🐰', rarity: 'Common', loot: 0.06, energi: 2, atk: 0, bg: 'rabbit,meadow' },
  { id: 'kura', nama: 'Kura-kura', icon: '🐢', rarity: 'Common', loot: 0.03, energi: 0, atk: 0, def: 0.1, bg: 'turtle,beach' },
  { id: 'rubah', nama: 'Rubah', icon: '🦊', rarity: 'Rare', loot: 0.12, energi: 3, atk: 2, bg: 'fox,autumn' },
  { id: 'elang', nama: 'Elang', icon: '🦅', rarity: 'Rare', loot: 0.1, energi: 4, atk: 3, bg: 'eagle,mountain' },
  { id: 'serigala', nama: 'Serigala', icon: '🐺', rarity: 'Rare', loot: 0.09, energi: 0, atk: 5, bg: 'wolf,night' },
  { id: 'harimau', nama: 'Harimau', icon: '🐯', rarity: 'Epic', loot: 0.18, energi: 5, atk: 8, bg: 'tiger,jungle' },
  { id: 'nagakecil', nama: 'Naga Kecil', icon: '🐉', rarity: 'Epic', loot: 0.2, energi: 6, atk: 10, bg: 'dragon,cave' },
  { id: 'phoenix', nama: 'Phoenix', icon: '🔥', rarity: 'Legendary', loot: 0.3, energi: 10, atk: 15, bg: 'fire,phoenix' },
  { id: 'nagaemas', nama: 'Naga Emas', icon: '🐲', rarity: 'Legendary', loot: 0.35, energi: 12, atk: 18, bg: 'golden,dragon' }
]
const RARITY_BOBOT = { Common: 55, Rare: 28, Epic: 13, Legendary: 4 }

const LOKASI = [
  { id: 'hutan', nama: 'Hutan Pinus', icon: '🌲', minLevel: 1, energi: 8, bg: 'pine,forest', loot: ['kayu', 'kayu', 'kulit', 'bibit'], koin: [40, 120], exp: [15, 35] },
  { id: 'danau', nama: 'Danau Biru', icon: '🏞️', minLevel: 2, energi: 9, bg: 'lake,water', loot: ['ikan', 'ikan', 'batu', 'buah'], koin: [60, 160], exp: [18, 40] },
  { id: 'gua', nama: 'Gua Kristal', icon: '🕳️', minLevel: 4, energi: 12, bg: 'cave,crystal', loot: ['batu', 'besi', 'besi', 'berlian'], koin: [120, 320], exp: [30, 70] },
  { id: 'gunung', nama: 'Gunung Berapi', icon: '🌋', minLevel: 6, energi: 15, bg: 'volcano,mountain', loot: ['besi', 'emas', 'batu', 'sisik'], koin: [220, 520], exp: [50, 110] },
  { id: 'gurun', nama: 'Gurun Kuno', icon: '🏜️', minLevel: 8, energi: 18, bg: 'desert,dunes', loot: ['emas', 'gading', 'peta', 'berlian'], koin: [400, 900], exp: [80, 170] },
  { id: 'kastil', nama: 'Kastil Terbengkalai', icon: '🏰', minLevel: 10, energi: 22, bg: 'castle,dark', loot: ['emas', 'berlian', 'sisik', 'kuncidungeon'], koin: [700, 1600], exp: [140, 300] }
]

const DUNGEONS = [
  { id: 'gua_kelelawar', nama: 'Gua Kelelawar', icon: '🦇', minLevel: 3, lantai: 3, energi: 30, hpMonster: 60, koin: 900, exp: 220, bg: 'bat,cave', drop: ['besi', 'kulit', 'ramuan'] },
  { id: 'hutan_terlarang', nama: 'Hutan Terlarang', icon: '🌳', minLevel: 6, lantai: 4, energi: 40, hpMonster: 110, koin: 2000, exp: 480, bg: 'dark,forest', drop: ['kayu', 'gading', 'bibit', 'makananpet'] },
  { id: 'reruntuhan', nama: 'Reruntuhan Kuno', icon: '🏛️', minLevel: 9, lantai: 4, energi: 50, hpMonster: 180, koin: 4200, exp: 900, bg: 'ruins,ancient', drop: ['emas', 'peta', 'armorbesi'] },
  { id: 'puncak_es', nama: 'Puncak Es', icon: '🏔️', minLevel: 12, lantai: 5, energi: 60, hpMonster: 260, koin: 7500, exp: 1600, bg: 'ice,snow', drop: ['berlian', 'sisik', 'pedangemas'] },
  { id: 'istana_iblis', nama: 'Istana Iblis', icon: '😈', minLevel: 15, lantai: 5, energi: 75, hpMonster: 380, koin: 15000, exp: 3200, bg: 'demon,castle', drop: ['sisik', 'armoremas', 'pedangemas'] }
]

const RESEP = {
  pedang: { butuh: { besi: 3, kayu: 2 }, exp: 40, ket: 'Senjata dasar (+35% damage)' },
  kapak: { butuh: { besi: 2, kayu: 3 }, exp: 35, ket: 'Alat menebang (+30% hasil)' },
  pickaxe: { butuh: { besi: 3, kayu: 2 }, exp: 35, ket: 'Alat menambang (+30% hasil)' },
  pancing: { butuh: { kayu: 2, besi: 1 }, exp: 30, ket: 'Alat memancing (+30% hasil)' },
  armor: { butuh: { besi: 5, kulit: 3 }, exp: 70, ket: 'Armor dasar (kurangi damage 25%)' },
  armorbesi: { butuh: { besi: 8, kulit: 4, emas: 1 }, exp: 140, ket: 'Armor besi (kurangi damage 45%)' },
  armoremas: { butuh: { besi: 10, emas: 3, berlian: 1 }, exp: 320, ket: 'Armor terbaik (65%)' },
  pedangemas: { butuh: { besi: 6, emas: 2, berlian: 1 }, exp: 300, ket: 'Senjata terbaik (+60% damage)' },
  kapakemas: { butuh: { besi: 5, kayu: 5, emas: 2 }, exp: 200, ket: 'Kapak emas (+50% kayu)' },
  pickaxeemas: { butuh: { besi: 6, batu: 5, emas: 2 }, exp: 200, ket: 'Pickaxe emas (+50% tambang)' },
  pancingemas: { butuh: { kayu: 6, besi: 3, emas: 1 }, exp: 180, ket: 'Pancing emas (+50% ikan)' },
  ramuan: { butuh: { sayur: 2, ikan: 1 }, exp: 25, ket: 'Pulihkan 60 HP' },
  ramuanbesar: { butuh: { sayur: 3, buah: 2, ikan: 2 }, exp: 60, ket: 'Pulihkan 150 HP' },
  roti: { butuh: { gandum: 2 }, exp: 20, ket: 'Pulihkan 40 energi' },
  kue: { butuh: { gandum: 2, buah: 1 }, exp: 30, ket: 'Pulihkan 80 energi' },
  kuncidungeon: { butuh: { besi: 5, emas: 2 }, exp: 90, ket: 'Kunci masuk dungeon' }
}

const PRESTASI = [
  { id: 'darah_pertama', nama: 'Darah Pertama', icon: '🩸', teks: 'Kalahkan 1 monster', cek: r => (r.kills || 0) >= 1, hadiah: { koin: 300, exp: 50 } },
  { id: 'pemburu', nama: 'Pemburu Ulung', icon: '🏹', teks: 'Kalahkan 25 monster', cek: r => (r.kills || 0) >= 25, hadiah: { koin: 2500, exp: 400 } },
  { id: 'pengumpul', nama: 'Tangan Rajin', icon: '🧺', teks: 'Kumpulkan 100 resource', cek: r => (r.gathered || 0) >= 100, hadiah: { koin: 1500, exp: 300 } },
  { id: 'kaya', nama: 'Kaya Raya', icon: '💰', teks: 'Punya 50.000 koin (termasuk bank)', cek: r => (r.money || 0) + (r.bank?.saldo || 0) >= 50000, hadiah: { koin: 5000, exp: 800 } },
  { id: 'level5', nama: 'Petualang', icon: '⭐', teks: 'Capai level 5', cek: r => r.level >= 5, hadiah: { koin: 1000, exp: 200 } },
  { id: 'level10', nama: 'Pahlawan', icon: '🌟', teks: 'Capai level 10', cek: r => (r.level >= 10), hadiah: { koin: 5000, exp: 900, item: 'ramuanbesar' } },
  { id: 'level20', nama: 'Legenda', icon: '👑', teks: 'Capai level 20', cek: r => (r.level >= 20), hadiah: { koin: 20000, exp: 3000, item: 'pedangemas' } },
  { id: 'pet_pertama', nama: 'Sahabat Setia', icon: '🐾', teks: 'Tetaskan 1 pet', cek: r => !!r.pet, hadiah: { koin: 1200, exp: 250 } },
  { id: 'dungeon_pertama', nama: 'Penjelajah Gua', icon: '🗝️', teks: 'Selesaikan 1 dungeon', cek: r => (r.stat?.dungeonSelesai || 0) >= 1, hadiah: { koin: 3000, exp: 500, item: 'kuncidungeon' } },
  { id: 'dungeon5', nama: 'Penakluk Dungeon', icon: '🏰', teks: 'Selesaikan 5 dungeon', cek: r => (r.stat?.dungeonSelesai || 0) >= 5, hadiah: { koin: 12000, exp: 2000, item: 'armoremas' } },
  { id: 'petani', nama: 'Petani Handal', icon: '🌾', teks: 'Panen 10 kali', cek: r => (r.stat?.panen || 0) >= 10, hadiah: { koin: 2000, exp: 350 } },
  { id: 'pandai_besi', nama: 'Pandai Besi', icon: '🔨', teks: 'Tempa peralatan sampai +5', cek: r => Object.values(r.forge || {}).some(v => v >= 5), hadiah: { koin: 6000, exp: 900 } },
  { id: 'juara_arena', nama: 'Juara Arena', icon: '🏆', teks: 'Menang 10 kali di arena', cek: r => (r.arena?.menang || 0) >= 10, hadiah: { koin: 8000, exp: 1200 } },
  { id: 'penjelajah', nama: 'Penjelajah Sejati', icon: '🧭', teks: 'Jelajahi semua 6 lokasi', cek: r => LOKASI.every(l => (r.stat?.jelajah?.[l.id] || 0) > 0), hadiah: { koin: 10000, exp: 1500, item: 'peta' } }
]

const JENIS_MISI = [
  { id: 'hunt', teks: 'Berburu {n}×', n: () => 2 + Math.floor(Math.random() * 3), hitung: r => r.harian?.hunt || 0 },
  { id: 'mine', teks: 'Menambang {n}×', n: () => 2 + Math.floor(Math.random() * 3), hitung: r => r.harian?.mine || 0 },
  { id: 'fish', teks: 'Memancing {n}×', n: () => 2 + Math.floor(Math.random() * 3), hitung: r => r.harian?.fish || 0 },
  { id: 'battle', teks: 'Bertarung {n}×', n: () => 2 + Math.floor(Math.random() * 2), hitung: r => r.harian?.battle || 0 },
  { id: 'win', teks: 'Menangkan {n} pertarungan', n: () => 1 + Math.floor(Math.random() * 3), hitung: r => r.harian?.win || 0 },
  { id: 'jual', teks: 'Jual {n} item ke toko', n: () => 2 + Math.floor(Math.random() * 4), hitung: r => r.harian?.jual || 0 },
  { id: 'jelajah', teks: 'Jelajahi lokasi {n}×', n: () => 1 + Math.floor(Math.random() * 2), hitung: r => r.harian?.jelajah || 0 },
  { id: 'panen', teks: 'Panen kebun {n}×', n: () => 1, hitung: r => r.harian?.panen || 0 },
  { id: 'dungeon', teks: 'Selesaikan dungeon {n}×', n: () => 1, hitung: r => r.harian?.dungeon || 0 }
]

/* ================================================================== */
/*  3. HELPER                                                          */
/* ================================================================== */
const R = jid => getRPG(jid)
const simpan = () => saveDB('users')
const K = m => m.senderKey || m.sender

/** pastikan field baru ada di data rpg lama */
function siapkan (r) {
  r.inventory = r.inventory || {}
  r.equipped = r.equipped || { weapon: null, armor: null, tool: null }
  r.forge = r.forge || {}
  r.bank = r.bank || { saldo: 0, terakhirBunga: Date.now(), riwayat: [] }
  r.arena = r.arena || { menang: 0, kalah: 0, seri: 0, terakhir: 0, streak: 0, terbaik: 0 }
  r.stat = r.stat || { dungeonSelesai: 0, dungeonGagal: 0, panen: 0, craft: 0, tempa: 0, jelajah: {}, pet: 0 }
  r.prestasi = r.prestasi || { klaim: [], gelar: '' }
  r.log = r.log || []
  r.pet = r.pet || null
  r.kebun = r.kebun || null
  r.misi = r.misi || null
  return r
}
function catat (r, teks) {
  r.log = [{ w: Date.now(), t: truncate(teks, 80) }, ...(r.log || [])].slice(0, 20)
}
/** statistik turunan — dipakai arena, dungeon, dan ditampilkan di rpgstat */
function statistik (r) {
  const pet = r.pet ? PETS.find(p => p.id === r.pet.spesies) : null
  const petLv = r.pet?.level || 0
  const atkPet = (pet?.atk || 0) + petLv * 1.2
  const atk = Math.round((10 + r.level * 3) * (1 + (r.equipped?.weapon ? bonusSenjata(r) : 0)) + atkPet)
  const def = Math.round((2 + r.level * 1.5) * (1 + (r.equipped?.armor ? bonusArmor(r) : 0)) + (pet?.def || 0) * 5)
  const luck = 1 + (pet?.loot || 0) + (hasItemSafe(r, 'peta') ? 0.15 : 0) + (r.prestasi?.klaim?.length || 0) * 0.01
  const energiBonus = (pet?.energi || 0)
  return { atk, def, luck, energiBonus, pet, petLv }
}
const hasItemSafe = (r, item) => (r.inventory?.[item] || 0) > 0
function bonusSenjata (r) {
  const item = r.equipped?.weapon
  if (!item) return 0
  const bawaan = { pedang: 0.35, pedangemas: 0.6 }[item]
  const custom = ITEMS[item]?.bonus
  return (custom !== undefined ? custom : (bawaan || 0)) + (r.forge?.[item] || 0) * 0.04
}
function bonusArmor (r) {
  const item = r.equipped?.armor
  if (!item) return 0
  const bawaan = { armor: 0.25, armorbesi: 0.45, armoremas: 0.65 }[item]
  const custom = ITEMS[item]?.bonus
  return (custom !== undefined ? custom : (bawaan || 0)) + (r.forge?.[item] || 0) * 0.04
}
/** kartu gambar khusus RPG (latar bertema, fallback gradient) */
async function kartu (m, { judul, sub, footer, tema = 'midnight', kataBg = '', tinggi = 400 }) {
  try {
    const { makeBanner } = await import('../lib/canvas.js')
    let bg = null
    if (kataBg) {
      try {
        const r = await fetch(`https://loremflickr.com/900/${tinggi}/${encodeURIComponent(kataBg)}`, {
          redirect: 'follow', signal: AbortSignal.timeout(7000), headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        if (r.ok) {
          const b = Buffer.from(await r.arrayBuffer())
          if (b.length > 3000) bg = b
        }
      } catch { bg = null }
    }
    return await makeBanner({ title: judul, subtitle: sub, footer, theme: tema, background: bg, width: 900, height: tinggi })
  } catch { return null }
}
/** kirim kartu + caption; kalau gambar gagal, kirim teks saja */
async function kirimKartu (m, buf, caption, buttons) {
  if (buf) {
    if (buttons?.length) return m.sendButtons({ title: buttons.title || '🎮 RPG', text: caption, footer: config.bot.footer, buttons, image: buf })
    return m.sendImage(buf, caption)
  }
  if (buttons?.length) return m.sendButtons({ title: buttons.title || '🎮 RPG', text: caption, footer: config.bot.footer, buttons })
  return m.reply(caption)
}
/** bunga bank 1%/hari */
function prosesBank (r) {
  const b = r.bank
  if (!b.saldo) return 0
  const hari = Math.floor((Date.now() - (b.terakhirBunga || Date.now())) / 86400000)
  if (hari < 1) return 0
  const bunga = Math.floor(b.saldo * 0.01 * hari)
  b.saldo += bunga
  b.terakhirBunga = Date.now()
  b.riwayat = [{ w: Date.now(), t: `bunga +${bunga}` }, ...(b.riwayat || [])].slice(0, 10)
  return bunga
}
/** pet bertambah EXP & level dari aktivitas */
function petExp (r, jumlah) {
  if (!r.pet) return null
  r.pet.exp = (r.pet.exp || 0) + jumlah
  let naik = false
  const butuh = lv => 100 + lv * 60
  while (r.pet.exp >= butuh(r.pet.level)) {
    r.pet.exp -= butuh(r.pet.level)
    r.pet.level++
    naik = true
  }
  return naik
}
/** bangkitkan misi harian kalau belum ada / ganti hari */
function pastikanMisi (r) {
  if (r.misi && r.misi.tanggal === HARI()) return r.misi
  const dipilih = []
  const kolam = [...JENIS_MISI]
  for (let i = 0; i < 3 && kolam.length; i++) {
    const idx = Math.floor(Math.random() * kolam.length)
    dipilih.push(kolam.splice(idx, 1)[0])
  }
  r.misi = {
    tanggal: HARI(),
    list: dipilih.map((j, i) => {
      const target = j.n()
      const koin = 400 + target * 350 + i * 100
      return { id: i + 1, jenis: j.id, teks: j.teks.replace('{n}', target), target, dasar: j.hitung(r), koin, exp: Math.round(koin / 4), klaim: false }
    }),
    bonusKlaimSemua: false
  }
  simpan()
  return r.misi
}
const progresMisi = (r, x) => Math.max(0, (JENIS_MISI.find(j => j.id === x.jenis)?.hitung(r) || 0) - (x.dasar || 0))

/* ================================================================== */
/*  4. FACTORY                                                         */
/* ================================================================== */
const rpg = (command, aliases, description, run, contoh = '', opt = {}) => ({
  command: [command, ...aliases],
  category: 'RPG Menu',
  description,
  limit: 0,
  cooldown: 3,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 220)}`) }
  }
})

/* ================================================================== */
/*  A. MENU, PROFIL & STATISTIK (6)                                    */
/* ================================================================== */
export const rpgMenuCmds = [
  rpg('rpgmenu2', ['rpglengkap', 'rpgfull'], 'Menu RPG lengkap (semua sistem)', m => {
    const r = siapkan(R(K(m)))
    return m.sendList({
      title: `⚔️ RPG LENGKAP — Lv.${r.level}`,
      text: `💰 ${r.money.toLocaleString('id-ID')} koin · ❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy}\n🏦 Bank: ${(r.bank.saldo || 0).toLocaleString('id-ID')}\n${r.pet ? `${r.pet.icon || '🐾'} Pet: ${r.pet.nama} (Lv.${r.pet.level})` : '🐾 Belum punya pet'}\n\nPilih sistem:`,
      footer: config.bot.footer,
      buttonText: '⚔️ Buka RPG',
      sections: [
        {
          title: '👤 Profil & Statistik',
          rows: [
            { title: '🃏 Kartu RPG', description: 'Profil bergambar', id: `${P}rpgkartu` },
            { title: '📊 Statistik Tempur', description: 'Attack, Defense, Luck', id: `${P}rpgstat` },
            { title: '🎒 Kartu Inventory', id: `${P}invkartu` },
            { title: '📜 Riwayat Aktivitas', id: `${P}rpgriwayat` },
            { title: '📖 Panduan RPG', id: `${P}rpgbantuan` }
          ]
        },
        {
          title: '💼 Kerja',
          rows: [
            { title: '💼 Kerja shift', description: '16 profesi · gaji + EXP · pangkat', id: `${P}kerja` },
            { title: 'ℹ️ Info profesi', id: `${P}kerjainfo` },
            { title: '🧾 Slip gaji', id: `${P}gajian` }
          ]
        },
        {
          title: '🗺️ Petualangan',
          rows: [
            { title: '🧭 Peta Lokasi', description: '6 lokasi jelajah', id: `${P}peta` },
            { title: '🚶 Jelajah', description: 'Contoh: ' + P + 'jelajah gua', id: `${P}jelajah` },
            { title: '🗝️ Dungeon', description: '5 dungeon bertingkat', id: `${P}dungeoninfo` },
            { title: '⚔️ Battle Monster', id: `${P}battle` }
          ]
        },
        {
          title: '🐾 Pet & Kebun',
          rows: [
            { title: '🐾 Pet Saya', id: `${P}petku` },
            { title: '🥚 Beli Telur Pet', description: '5.000 koin', id: `${P}pettelur` },
            { title: '🐣 Tetaskan Telur', id: `${P}tetaskan` },
            { title: '📚 Daftar Spesies Pet', id: `${P}petguide` },
            { title: '🌱 Kebun Saya', id: `${P}kebunku` },
            { title: '🌾 Tanam Bibit', id: `${P}tanam` },
            { title: '🧺 Panen', id: `${P}panen` }
          ]
        },
        {
          title: '🔨 Crafting & Tempa',
          rows: [
            { title: '📜 Daftar Resep', id: `${P}resep` },
            { title: '🔨 Craft Item', description: 'Contoh: ' + P + 'craft pedang', id: `${P}craft` },
            { title: '⚒️ Tempa Peralatan', description: '+4% per level', id: `${P}tempa` },
            { title: '📈 Bonus Tempa', id: `${P}tempalist` }
          ]
        },
        {
          title: '🏆 Kompetisi & Ekonomi',
          rows: [
            { title: '⚔️ Arena PvP', description: 'Contoh: ' + P + 'arena @user', id: `${P}arena` },
            { title: '📊 Rekor Arena', id: `${P}arenarekam` },
            { title: '🏅 Leaderboard Arena', id: `${P}arenalb` },
            { title: '🏦 Bank (bunga 1%/hari)', id: `${P}bank` },
            { title: '🎯 Misi Harian', id: `${P}misi` },
            { title: '🎖️ Prestasi & Gelar', id: `${P}pencapaian` },
            { title: '🏪 Toko Lengkap', id: `${P}toko` }
          ]
        }
      ]
    })
  }),

  rpg('rpgkartu', ['karturpg', 'rpgcard'], 'Kartu profil RPG bergambar (sesuai level & lokasi)', async m => {
    const r = siapkan(R(K(m)))
    const s = statistik(r)
    const lokasi = [...LOKASI].reverse().find(l => r.level >= l.minLevel) || LOKASI[0]
    const need = expNeeded(r.level)
    const buf = await kartu(m, {
      judul: `${r.prestasi.gelar ? r.prestasi.gelar + ' • ' : ''}LV.${r.level}`,
      sub: `HP ${r.health}/${r.maxHealth}  ⚡${r.energy}/${r.maxEnergy}  💰${r.money.toLocaleString('id-ID')}`,
      footer: `${lokasi.icon} ${lokasi.nama} · ATK ${s.atk} · DEF ${s.def} · ${r.pet ? r.pet.nama + ' Lv.' + r.pet.level : 'tanpa pet'}`,
      tema: r.level >= 15 ? 'crimson' : r.level >= 10 ? 'grape' : r.level >= 5 ? 'forest' : 'ocean',
      kataBg: lokasi.bg
    })
    const cap = `*🎮 KARTU RPG — ${m.pushName || 'Petualang'}*\n\n▸ Level: *${r.level}* ${bar(r.exp, need)} ${r.exp}/${need}\n▸ HP: ${bar(r.health, r.maxHealth)} ${r.health}/${r.maxHealth}\n▸ Energi: ${bar(r.energy, r.maxEnergy)} ${r.energy}/${r.maxEnergy}\n▸ Koin: 💰 ${r.money.toLocaleString('id-ID')} · Bank 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')}\n▸ ATK ⚔️ ${s.atk} · DEF 🛡️ ${s.def} · Luck 🍀 ${s.luck.toFixed(2)}×\n▸ Pet: ${r.pet ? `${r.pet.icon} ${r.pet.nama} (Lv.${r.pet.level}, ${r.pet.raritas})` : 'belum ada'}\n▸ Lokasi terjauh: ${lokasi.icon} ${lokasi.nama}\n▸ Prestasi: ${r.prestasi.klaim.length}/${PRESTASI.length}${r.prestasi.gelar ? ` · Gelar: ${r.prestasi.gelar}` : ''}\n▸ Monster dikalahkan: ${r.kills || 0} · Resource: ${r.gathered || 0}`
    return kirimKartu(m, buf, cap, {
      title: '🃏 KARTU RPG',
      buttons: [{ text: '📊 Statistik', id: `${P}rpgstat` }, { text: '🗺️ Jelajah', id: `${P}peta` }, { text: '🎯 Misi', id: `${P}misi` }]
    })
  }),

  rpg('rpgstat', ['statistikrpg', 'statrpg'], 'Rincian Attack/Defense/Luck & sumber bonusnya', m => {
    const r = siapkan(R(K(m)))
    const s = statistik(r)
    const w = r.equipped?.weapon, a = r.equipped?.armor, t = r.equipped?.tool
    return m.sendButtons({
      title: '📊 STATISTIK TEMPUR',
      text: `*⚔️ ATTACK: ${s.atk}*\n▸ Dasar (10 + Lv.${r.level}×3): ${10 + r.level * 3}\n▸ Senjata ${w ? `${ITEMS[w]?.icon} ${ITEMS[w]?.name} +${r.forge?.[w] || 0}` : '(kosong)'}: +${Math.round((10 + r.level * 3) * bonusSenjata(r))}\n▸ Pet ${r.pet ? `${r.pet.icon} Lv.${r.pet.level}` : '-'}: +${Math.round((s.pet?.atk || 0) + s.petLv * 1.2)}\n\n*🛡️ DEFENSE: ${s.def}*\n▸ Dasar (2 + Lv.${r.level}×1.5): ${Math.round(2 + r.level * 1.5)}\n▸ Armor ${a ? `${ITEMS[a]?.icon} ${ITEMS[a]?.name} +${r.forge?.[a] || 0}` : '(kosong)'}\n\n*🍀 LUCK (loot): ${s.luck.toFixed(2)}×*\n▸ Pet: +${(s.pet?.loot || 0).toFixed(2)}\n▸ Peta harta aktif: ${hasItemSafe(r, 'peta') ? '+0.15 ✅' : '- (punya ' + P + 'peta)'}\n▸ Prestasi: +${((r.prestasi.klaim.length || 0) * 0.01).toFixed(2)}\n\n*🔧 Alat:* ${t ? `${ITEMS[t]?.icon} ${ITEMS[t]?.name} +${r.forge?.[t] || 0}` : 'tidak ada'} → memengaruhi hasil berburu/menambang/memancing/menebang\n\n*⚡ Energi bonus pet:* +${s.energiBonus}\n\nPerkuat: ${P}tempa (naikkan peralatan) · ${P}craft (bikin gear) · ${P}petlatih`,
      footer: config.bot.footer,
      buttons: [{ text: '⚒️ Tempa', id: `${P}tempa` }, { text: '🔨 Craft', id: `${P}resep` }, { text: '🃏 Kartu RPG', id: `${P}rpgkartu` }]
    })
  }),

  rpg('rpgriwayat', ['logrpg', 'riwayatrpg'], '20 aktivitas RPG terakhir kamu', m => {
    const r = siapkan(R(K(m)))
    const h = r.harian
    return m.reply(`📜 *RIWAYAT RPG*\n\n*Hari ini (${h?.tanggal === HARI() ? HARI() : 'belum ada aktivitas'}):*\n▸ 🏹 Berburu: ${h?.hunt || 0}× · ⛏️ Menambang: ${h?.mine || 0}× · 🎣 Memancing: ${h?.fish || 0}× · 🪓 Menebang: ${h?.chop || 0}×\n▸ ⚔️ Bertarung: ${h?.battle || 0}× (menang ${h?.win || 0}×)\n▸ 🚶 Jelajah: ${h?.jelajah || 0}× · 🗝️ Dungeon: ${h?.dungeon || 0}× · 🧺 Panen: ${h?.panen || 0}×\n▸ 💰 Jual: ${h?.jual || 0}× · 🔨 Craft: ${h?.craft || 0}×\n\n*Log terakhir:*\n${(r.log || []).length ? r.log.slice(0, 20).map((x, i) => `${i + 1}. ${new Date(x.w).toLocaleString('id-ID').slice(0, 16)} — ${x.t}`).join('\n') : '(belum ada)'}\n\n*Total seumur akun:*\n▸ Monster: ${r.kills || 0} · Resource: ${r.gathered || 0} · Dungeon selesai: ${r.stat.dungeonSelesai || 0} (gagal ${r.stat.dungeonGagal || 0})`)
  }),

  rpg('rpgbantuan', ['panduanrpg', 'caramainrpg'], 'Panduan lengkap sistem RPG & kaitannya', async m => {
    const r = siapkan(R(K(m)))
    const buf = await kartu(m, { judul: 'PANDUAN RPG', sub: 'Kumpulkan → Craft → Tempa → Taklukkan', footer: 'theryhann! • RPG v6', tema: 'grape', kataBg: 'fantasy,map' })
    const teks = `*🎮 ALUR BERMAIN*\n\n*1. Kumpulkan resource*\n${P}berburu · ${P}menambang · ${P}memancing · ${P}menebang\n${P}jelajah <lokasi> — hasil lebih besar, butuh level\nHasilnya: kayu, batu, besi, emas, berlian, ikan, daging\n\n*2. Naikkan level & uang*\nAktivitas + battle memberi EXP. Level membuka lokasi, dungeon, dan monster kuat. Jual hasil: ${P}jual <item> <jumlah>\n\n*3. Bikin peralatan (crafting)*\n${P}resep — lihat semua resep\n${P}craft pedang — 3 besi + 2 kayu\nLalu pakai: ${P}jual equip pedang (perintah lama) atau ${P}craft langsung equip\n\n*4. Tempa (+ kuat)*\n${P}tempa — naikkan senjata/armor +1..+10 (tiap level +4%)\nButuh besi/emas, ada risiko gagal di +6 ke atas\n\n*5. Pet (bonus permanen)*\n${P}pettelur → ${P}tetaskan → ${P}petmakan / ${P}petlatih\nPet menambah ATK, loot, dan energi — ikut bertarung di dungeon & arena\n\n*6. Kebun (pasif)*\n${P}belibibit → ${P}tanam → tunggu → ${P}panen\nSayur/buah/gandum = bahan craft ramuan & roti\n\n*7. Dungeon & Arena*\n${P}dungeon <id> — butuh 🗝️ kunci, 3-5 lantai, hadiah besar\n${P}arena @user — PvP, taruhan koin\n\n*8. Misi & prestasi*\n${P}misi (3 misi harian) · ${P}pencapaian (gelar + hadiah)\n\n*9. Bank*\n${P}bank <jumlah> — simpan koin (aman dari kekalahan arena) + bunga 1%/hari`
    return kirimKartu(m, buf, teks)
  }),

  rpg('rpgreset', ['resetrpg', 'ulangrpg'], 'Reset data RPG kamu (perlu konfirmasi)', m => {
    if (String(m.args[0]).toLowerCase() !== 'ya') return m.reply(`⚠️ Ini menghapus SEMUA progres RPG: level, koin, item, pet, kebun, bank, prestasi.\n\nLanjutkan: ${P}rpgreset ya`)
    const u = getUser(K(m))
    delete u.rpg
    simpan()
    return m.reply('🧹 Data RPG direset. Mulai petualangan baru: ' + P + 'rpg')
  }, 'ya')
]

/* ================================================================== */
/*  B. PET (8)                                                         */
/* ================================================================== */
export const rpgPetCmds = [
  rpg('petku', ['petstatus', 'lih atpet'.replace(' ', '')], 'Status pet kamu saat ini', async m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply(`🐾 Kamu belum punya pet.\n\nBeli telur: ${P}pettelur (5.000 koin)\nLalu tetaskan: ${P}tetaskan\n\nLihat spesies: ${P}petguide`)
    const sp = PETS.find(p => p.id === r.pet.spesies)
    const butuh = 100 + r.pet.level * 60
    const buf = await kartu(m, {
      judul: `${sp?.icon || '🐾'} ${r.pet.nama}`,
      sub: `${r.pet.raritas} • Level ${r.pet.level} • ATK +${(sp?.atk || 0) + r.pet.level * 1.2 | 0}`,
      footer: `Loot ×${(1 + (sp?.loot || 0)).toFixed(2)} • Energi +${sp?.energi || 0} • ${r.pet.nama}`,
      tema: r.pet.raritas === 'Legendary' ? 'gold' : r.pet.raritas === 'Epic' ? 'crimson' : r.pet.raritas === 'Rare' ? 'grape' : 'forest',
      kataBg: sp?.bg || 'pet'
    })
    const lapar = r.pet.lapar ? formatDuration(Math.max(0, r.pet.lapar - Date.now())) + ' lagi' : 'kenyang'
    return kirimKartu(m, buf, `*🐾 PET: ${r.pet.nama}* ${sp?.icon || ''}\n\n▸ Rarity: *${r.pet.raritas}*\n▸ Level: ${r.pet.level} ${bar(r.pet.exp, butuh)} ${r.pet.exp}/${butuh}\n▸ Kenyang: ${lapar}\n▸ Skill: ${'⭐'.repeat(Math.min(5, r.pet.skill || 1))} (${r.pet.skill || 1}/5)\n▸ Ditambahkan: ${r.pet.sejak ? new Date(r.pet.sejak).toLocaleDateString('id-ID') : '-'}\n\n*Bonus yang kamu dapat:*\n▸ ⚔️ Attack +${Math.round((sp?.atk || 0) + r.pet.level * 1.2)}\n▸ 🍀 Loot ×${(1 + (sp?.loot || 0)).toFixed(2)}\n▸ ⚡ Energi +${sp?.energi || 0}${sp?.def ? `\n▸ 🛡️ Def +${Math.round(sp.def * 5)}` : ''}\n\nRawat: ${P}petmakan · Latih: ${P}petlatih`, {
      title: '🐾 PET',
      buttons: [{ text: '🍖 Beri Makan', id: `${P}petmakan` }, { text: '🎯 Latih', id: `${P}petlatih` }, { text: '📊 Stat Saya', id: `${P}rpgstat` }]
    })
  }),

  rpg('pettelur', ['belitelur', 'belipet'], 'Beli telur pet (5.000 koin)', m => {
    const r = siapkan(R(K(m)))
    if (r.pet) return m.reply(`⚠️ Kamu sudah punya pet (${r.pet.icon} ${r.pet.nama}).\n\nLepaskan dulu: ${P}petlepas\nAtau rawat dia: ${P}petmakan`)
    if (r.telurSiap) return m.reply(`🥚 Kamu sudah punya telur yang sedang ditetaskan.\n\nSiap: ${new Date(r.telurSiap).toLocaleString('id-ID')}\nTetaskan: ${P}tetaskan`)
    const harga = 5000
    if (r.money < harga) return m.reply(`❌ Koin tidak cukup.\n\nButuh: 💰 ${harga.toLocaleString('id-ID')}\nPunya: 💰 ${r.money.toLocaleString('id-ID')}\nBank  : 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')} (${P}tarikbank)\n\nTambah koin: ${P}jelajah · ${P}battle · ${P}jual`)
    r.money -= harga
    addItem(K(m), 'telurpet', 1)
    catat(r, `Beli telur pet (-${harga} koin)`)
    simpan()
    return m.reply(`🥚 *TELUR PET DIBELI* (-${harga.toLocaleString('id-ID')} koin)\n\nSisa koin: 💰 ${r.money.toLocaleString('id-ID')}\n\nTetaskan sekarang: ${P}tetaskan\n(Butuh 30 menit pengeraman — atau instan pakai ${P}tetaskan instan dengan 1.000 koin)`)
  }),

  rpg('tetaskan', ['hatch', 'tetaskan telur'.replace(' ', '')], 'Tetaskan telur jadi pet acak', m => {
    const r = siapkan(R(K(m)))
    if (r.pet) return m.reply(`⚠️ Kamu sudah punya pet: ${r.pet.icon} ${r.pet.nama}`)
    if (!hasItemSafe(r, 'telurpet')) return m.reply(`❌ Kamu tidak punya 🥚 Telur Pet.\n\nBeli: ${P}pettelur (5.000 koin)`)
    const instan = String(m.args[0]).toLowerCase() === 'instan'
    if (!r.telurMulai) {
      r.telurMulai = Date.now()
      r.telurSiap = Date.now() + 30 * 60000
      simpan()
      return m.reply(`🥚 *PENGERAMAN DIMULAI*\n\nTelur sedang dihangatkan...\nSiap menetas: ${new Date(r.telurSiap).toLocaleTimeString('id-ID')} (30 menit lagi)\n\nCek: ${P}tetaskan\nIngin instan? ${P}tetaskan instan (1.000 koin)`)
    }
    if (!instan && Date.now() < (r.telurSiap || 0)) {
      return m.reply(`⏳ Telur belum siap.\n\nSisa: ${formatDuration(r.telurSiap - Date.now())}\nSiap  : ${new Date(r.telurSiap).toLocaleTimeString('id-ID')}\n\nInstan (1.000 koin): ${P}tetaskan instan`)
    }
    if (instan) {
      if (r.money < 1000) return m.reply(`❌ Butuh 1.000 koin untuk penetasan instan. Koin kamu: ${r.money.toLocaleString('id-ID')}`)
      r.money -= 1000
    }
    takeItem(K(m), 'telurpet', 1)
    // undian rarity lalu spesies
    const total = Object.values(RARITY_BOBOT).reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    let rarity = 'Common'
    for (const [k, v] of Object.entries(RARITY_BOBOT)) { roll -= v; if (roll <= 0) { rarity = k; break } }
    const pool = PETS.filter(p => p.rarity === rarity)
    const sp = pickRandom(pool.length ? pool : PETS)
    r.pet = { spesies: sp.id, nama: sp.nama, icon: sp.icon, rarity: sp.rarity, raritas: sp.rarity, level: 1, exp: 0, skill: 1, lapar: 0, sejak: Date.now() }
    r.telurMulai = 0
    r.telurSiap = 0
    r.stat.pet = (r.stat.pet || 0) + 1
    addExp(K(m), 150)
    catatHarian(r, 'pet')
    catat(r, `Menetaskan ${sp.icon} ${sp.nama} (${sp.rarity})`)
    simpan()
    return m.reply(`🎉 *TELUR MENETAS!*\n\n${sp.icon} *${sp.nama}*\nRarity: *${sp.rarity}*\n\n*Bonus langsung aktif:*\n▸ ⚔️ ATK +${sp.atk || 0}\n▸ 🍀 Loot ×${(1 + (sp.loot || 0)).toFixed(2)}\n▸ ⚡ Energi +${sp.energi || 0}${sp.def ? `\n▸ 🛡️ DEF +${Math.round(sp.def * 5)}` : ''}\n\n+150 EXP petualang\n\nRawat dia: ${P}petmakan · ${P}petlatih\nLihat: ${P}petku`)
  }),

  rpg('petmakan', ['feedpet', 'kasihmakanpet'], 'Beri makan pet (butuh 🍖 Makanan Pet)', m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply(`❌ Belum punya pet. Beli telur: ${P}pettelur`)
    if (!hasItemSafe(r, 'makananpet')) {
      if (hasItemSafe(r, 'daging') || hasItemSafe(r, 'ikan')) {
        const pakai = hasItemSafe(r, 'daging') ? 'daging' : 'ikan'
        takeItem(K(m), pakai, 1)
        r.pet.lapar = Date.now() + 6 * 3600000
        const naik = petExp(r, 30)
        catat(r, `Memberi makan pet (${ITEMS[pakai].name})`)
        simpan()
        return m.reply(`🍽️ ${r.pet.icon} ${r.pet.nama} makan 1x ${ITEMS[pakai].icon} ${ITEMS[pakai].name}.\n\n+30 EXP pet · kenyang 6 jam\n${naik ? `🎉 *PET NAIK KE LEVEL ${r.pet.level}!* Bonus bertambah.` : `EXP pet: ${r.pet.exp}/${100 + r.pet.level * 60}`}\n\nBeli makanan khusus (+80 EXP): ${P}toko makananpet`)
      }
      return m.reply(`❌ Tidak ada makanan.\n\nPunya ${hasItemSafe(r, 'daging') ? '🥩 daging' : hasItemSafe(r, 'ikan') ? '🐟 ikan' : 'apa-apa'}.\nBeli: ${P}toko makananpet (300 koin)\nAtau cari: ${P}berburu / ${P}memancing`)
    }
    takeItem(K(m), 'makananpet', 1)
    r.pet.lapar = Date.now() + 12 * 3600000
    const naik = petExp(r, 80)
    catat(r, 'Memberi makan pet')
    simpan()
    return m.reply(`🍖 ${r.pet.icon} ${r.pet.nama} lahap makan!\n\n+80 EXP pet · kenyang 12 jam\n${naik ? `🎉 *PET NAIK KE LEVEL ${r.pet.level}!*\nATK sekarang +${Math.round((PETS.find(p => p.id === r.pet.spesies)?.atk || 0) + r.pet.level * 1.2)}` : `EXP pet: ${r.pet.exp}/${100 + r.pet.level * 60}`}`)
  }),

  rpg('petlatih', ['trainpet', 'latihpet'], 'Latih pet: naikkan skill & EXP (10 energi)', m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply(`❌ Belum punya pet. ${P}pettelur`)
    if (r.pet.lapar && r.pet.lapar < Date.now()) return m.reply(`😿 ${r.pet.nama} kelaparan, tidak mau berlatih.\n\nBeri makan dulu: ${P}petmakan`)
    if (r.energy < 10) return m.reply(`⚡ Energi kurang (butuh 10, punya ${r.energy}).\n\nMakan: ${P}makan · Tunggu regen (1 energi/2 menit)`)
    r.energy -= 10
    const sp = PETS.find(p => p.id === r.pet.spesies)
    const naik = petExp(r, 60)
    const sukses = Math.random() < 0.35 && (r.pet.skill || 1) < 5
    if (sukses) r.pet.skill = (r.pet.skill || 1) + 1
    addExp(K(m), 40)
    catat(r, `Melatih pet (${sukses ? 'skill naik' : 'EXP saja'})`)
    simpan()
    return m.reply(`🎯 *LATIHAN ${r.pet.icon} ${r.pet.nama}*\n\n-10 ⚡ energi\n+60 EXP pet · +40 EXP kamu\n${sukses ? `✨ *SKILL NAIK!* Sekarang ${'⭐'.repeat(r.pet.skill)} (${r.pet.skill}/5) — bonus loot & ATK bertambah` : `${naik ? `🎉 *LEVEL UP → ${r.pet.level}!*` : `Skill: ${'⭐'.repeat(r.pet.skill || 1)} (${r.pet.skill || 1}/5)`}`}\n\nBonus sekarang: ATK +${Math.round((sp?.atk || 0) + r.pet.level * 1.2)} · Loot ×${(1 + (sp?.loot || 0) + (r.pet.skill || 1) * 0.01).toFixed(2)}`)
  }),

  rpg('petguide', ['daftarspesies', 'petlist'], 'Daftar semua spesies pet & bonusnya', m => {
    const kelompok = {}
    for (const p of PETS) (kelompok[p.rarity] = kelompok[p.rarity] || []).push(p)
    return m.sendButtons({
      title: '📚 SPESIES PET',
      text: Object.entries(kelompok).map(([rar, arr]) => `*${rar}* (${RARITY_BOBOT[rar]}% peluang)\n${arr.map(p => `▸ ${p.icon} ${p.nama} — ATK +${p.atk || 0}, loot ×${(1 + p.loot).toFixed(2)}, ⚡+${p.energi || 0}${p.def ? `, DEF +${Math.round(p.def * 5)}` : ''}`).join('\n')}`).join('\n\n') + `\n\n*Catatan:*\n▸ Pet naik level dari ${P}petmakan (+80) & ${P}petlatih (+60)\n▸ Tiap level pet: ATK +1.2\n▸ Skill ⭐ (maks 5) naikkan loot sedikit\n▸ Pet ikut bertarung di ${P}dungeon & ${P}arena`,
      footer: config.bot.footer,
      buttons: [{ text: '🥚 Beli Telur', id: `${P}pettelur` }, { text: '🐾 Pet Saya', id: `${P}petku` }]
    })
  }),

  rpg('petlepas', ['releasepet', 'bebaskanpet'], 'Lepaskan pet (dapat kompensasi koin)', m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply('❌ Kamu tidak punya pet.')
    if (String(m.args[0]).toLowerCase() !== 'ya') return m.reply(`⚠️ Yakin melepaskan ${r.pet.icon} *${r.pet.nama}* (${r.pet.raritas} Lv.${r.pet.level})?\n\nKompensasi: 💰 ${(1000 * r.pet.level + ({ Common: 500, Rare: 2000, Epic: 6000, Legendary: 15000 }[r.pet.raritas] || 500)).toLocaleString('id-ID')} koin\n\nLanjutkan: ${P}petlepas ya`)
    const kompensasi = 1000 * r.pet.level + ({ Common: 500, Rare: 2000, Epic: 6000, Legendary: 15000 }[r.pet.raritas] || 500)
    const nama = r.pet.nama
    r.money += kompensasi
    r.pet = null
    catat(r, `Melepaskan pet ${nama} (+${kompensasi} koin)`)
    simpan()
    return m.reply(`👋 ${nama} dilepas ke alam liar.\n\nKompensasi: 💰 +${kompensasi.toLocaleString('id-ID')} koin\nSisa: ${r.money.toLocaleString('id-ID')}\n\nCari teman baru: ${P}pettelur`)
  }, 'ya'),

  rpg('petkartu', ['kartupet', 'petcard'], 'Kartu gambar pet kamu', async m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply(`🐾 Belum punya pet.\n\n${P}pettelur → ${P}tetaskan → ${P}petmakan`)
    const sp = PETS.find(p => p.id === r.pet.spesies)
    const buf = await kartu(m, {
      judul: `${sp.icon} ${r.pet.nama}`,
      sub: `${r.pet.raritas} · Lv.${r.pet.level} · ${'⭐'.repeat(r.pet.skill || 1)}`,
      footer: `ATK +${Math.round((sp.atk || 0) + r.pet.level * 1.2)} · LOOT ×${(1 + sp.loot).toFixed(2)} · ⚡+${sp.energi || 0}`,
      tema: r.pet.raritas === 'Legendary' ? 'gold' : r.pet.raritas === 'Epic' ? 'crimson' : 'grape',
      kataBg: sp.bg,
      tinggi: 460
    })
    if (!buf) return m.reply('⚠️ Gagal merender kartu. Coba lagi.')
    return m.sendImage(buf, `🐾 *${r.pet.nama}* — ${r.pet.raritas}\n\nLevel ${r.pet.level} · Skill ${'⭐'.repeat(r.pet.skill || 1)}\nATK +${Math.round((sp.atk || 0) + r.pet.level * 1.2)} · Loot ×${(1 + sp.loot).toFixed(2)} · Energi +${sp.energi || 0}\n\nRawat: ${P}petmakan · ${P}petlatih`)
  }),

  rpg('petganti nama'.replace(' ', ''), ['renampet', 'namapet', 'petgantianama'], 'Ganti nama panggilan pet', m => {
    const r = siapkan(R(K(m)))
    if (!r.pet) return m.reply(`❌ Belum punya pet. ${P}pettelur`)
    const nama = truncate(m.q || '', 20)
    if (!nama) return m.reply(`Contoh: ${P}petgantinama Mochi\n\nNama sekarang: ${r.pet.nama}`)
    const lama = r.pet.nama
    r.pet.nama = nama
    r.pet.custom = true
    catat(r, `Mengganti nama pet: ${lama} → ${nama}`)
    simpan()
    return m.reply(`✏️ Nama pet diubah: *${lama}* → *${nama}*\n\nLihat: ${P}petku`)
  }, 'Mochi')
]

/* ================================================================== */
/*  C. KEBUN / FARM (5)                                                */
/* ================================================================== */
export const rpgFarmCmds = [
  rpg('belibibit', ['beliseed', 'bibit'], 'Beli bibit tanaman (150 koin)', m => {
    const r = siapkan(R(K(m)))
    const jumlah = Math.max(1, Number(m.args[0]) || 1)
    const harga = 150 * jumlah
    if (r.money < harga) return m.reply(`❌ Koin kurang.\n\nButuh: ${harga.toLocaleString('id-ID')} (150/bibit)\nPunya: ${r.money.toLocaleString('id-ID')}\nBank: ${(r.bank.saldo || 0).toLocaleString('id-ID')} (${P}tarikbank)`)
    r.money -= harga
    addItem(K(m), 'bibit', jumlah)
    catat(r, `Beli ${jumlah} bibit (-${harga} koin)`)
    simpan()
    return m.reply(`🌱 Membeli *${jumlah} bibit* (-${harga.toLocaleString('id-ID')} koin)\n\nSisa koin: ${r.money.toLocaleString('id-ID')}\nBibit di tas: ${r.inventory.bibit || 0}\n\nTanam: ${P}tanam\nLihat kebun: ${P}kebunku`)
  }, '3'),

  rpg('tanam', ['plant', 'berkebun'], 'Tanam bibit di kebun (5 energi, 15 menit)', m => {
    const r = siapkan(R(K(m)))
    if (r.kebun?.siap && Date.now() < r.kebun.siap) return m.reply(`🌱 Kebun sedang tumbuh.\n\nSiap panen: ${new Date(r.kebun.siap).toLocaleTimeString('id-ID')} (lagi ${formatDuration(r.kebun.siap - Date.now())})\n\nPercepat: ${P}sirami\nPanen: ${P}panen`)
    if (r.kebun?.siap) return m.reply(`🧺 Ada tanaman siap panen!\n\nPanen dulu: ${P}panen`)
    if (!hasItemSafe(r, 'bibit')) return m.reply(`❌ Tidak punya 🌱 Bibit.\n\nBeli: ${P}belibibit (150 koin)`)
    if (r.energy < 5) return m.reply(`⚡ Energi kurang (butuh 5, punya ${r.energy}).\n\n${P}makan untuk pulihkan`)
    takeItem(K(m), 'bibit', 1)
    r.energy -= 5
    r.kebun = { tanam: Date.now(), siap: Date.now() + 15 * 60000, disiram: 0 }
    catat(r, 'Menanam bibit')
    simpan()
    return m.reply(`🌱 *BIBIT DITANAM*\n\n-1 bibit · -5 ⚡ energi\nSiap panen: ${new Date(r.kebun.siap).toLocaleTimeString('id-ID')} (15 menit)\n\nHasil panen: 🥬 sayur / 🍎 buah / 🌾 gandum (2-5 buah, dipengaruhi 🍀 luck ${statistik(r).luck.toFixed(2)}×)\n\nPercepat 3 menit: ${P}sirami\nCek: ${P}kebunku`)
  }),

  rpg('sirami', ['water', 'siram'], 'Siram tanaman: percepat 3 menit (2 energi)', m => {
    const r = siapkan(R(K(m)))
    if (!r.kebun?.siap) return m.reply(`❌ Tidak ada tanaman yang tumbuh.\n\nTanam dulu: ${P}tanam`)
    if (Date.now() >= r.kebun.siap) return m.reply(`🧺 Sudah siap panen!\n\n${P}panen`)
    if (r.energy < 2) return m.reply('⚡ Energi kurang (butuh 2).')
    r.energy -= 2
    r.kebun.siap -= 3 * 60000
    r.kebun.disiram = (r.kebun.disiram || 0) + 1
    simpan()
    const sisa = r.kebun.siap - Date.now()
    return m.reply(`💧 Disiram!\n\n-2 ⚡ energi · waktu panen -3 menit\n${sisa > 0 ? `Sisa: ${formatDuration(sisa)}` : '🧺 *SIAP PANEN!* → ' + P + 'panen'}\n\nSiraman ke-${r.kebun.disiram}`)
  }),

  rpg('panen', ['harvest', 'panenkebun'], 'Panen hasil kebun', async m => {
    const r = siapkan(R(K(m)))
    if (!r.kebun?.siap) return m.reply(`🌱 Kebun kosong.\n\nTanam: ${P}tanam (butuh bibit: ${P}belibibit)`)
    if (Date.now() < r.kebun.siap) return m.reply(`⏳ Belum waktunya panen.\n\nSisa: ${formatDuration(r.kebun.siap - Date.now())}\nPercepat: ${P}sirami`)
    const s = statistik(r)
    const jenis = pickRandom(['sayur', 'buah', 'gandum'])
    const jumlah = Math.max(1, Math.round((2 + Math.floor(Math.random() * 4)) * s.luck))
    const bonus = Math.random() < 0.12 * s.luck ? { item: 'bibit', qty: 1 } : null
    addItem(K(m), jenis, jumlah)
    if (bonus) addItem(K(m), bonus.item, bonus.qty)
    const exp = 45 + jumlah * 6
    addExp(K(m), exp)
    r.stat.panen = (r.stat.panen || 0) + 1
    catatHarian(r, 'panen')
    r.kebun = null
    petExp(r, 20)
    catat(r, `Panen ${jumlah}x ${ITEMS[jenis].name}`)
    simpan()
    const buf = await kartu(m, { judul: '🧺 PANEN!', sub: `+${jumlah} ${ITEMS[jenis].icon} ${ITEMS[jenis].name} · +${exp} EXP`, footer: bonus ? `Bonus: +1 🌱 Bibit` : 'Kebun siap ditanami lagi', tema: 'forest', kataBg: 'farm,harvest' })
    return kirimKartu(m, buf, `🧺 *PANEN BERHASIL*\n\n+${jumlah}× ${ITEMS[jenis].icon} ${ITEMS[jenis].name}${bonus ? `\n+1× 🌱 Bibit (bonus keberuntungan!)` : ''}\n+${exp} EXP${r.pet ? `\n+20 EXP pet ${r.pet.icon}` : ''}\n\nTotal panen: ${r.stat.panen}×\nNilai jual: 💰 ${(ITEMS[jenis].sell * jumlah).toLocaleString('id-ID')} (${P}jual ${jenis} ${jumlah})\n\nTanam lagi: ${P}tanam\nMisi harian: ${P}misi`, {
      title: '🧺 PANEN',
      buttons: [{ text: '🌱 Tanam Lagi', id: `${P}tanam` }, { text: '💰 Jual Semua', id: `${P}pasarjual` }, { text: '🎯 Misi', id: `${P}misi` }]
    })
  }),

  rpg('kebunku', ['farmku', 'statuskebun'], 'Status kebun & hasil panen', m => {
    const r = siapkan(R(K(m)))
    const punya = ['sayur', 'buah', 'gandum', 'bibit'].map(k => `${ITEMS[k].icon} ${ITEMS[k].name}: ${r.inventory[k] || 0}`).join('\n')
    let status = '🌱 Kebun kosong — tanam: ' + P + 'tanam'
    if (r.kebun?.siap) {
      status = Date.now() >= r.kebun.siap
        ? `🧺 *SIAP PANEN!* → ${P}panen`
        : `⏳ Tumbuh... siap ${new Date(r.kebun.siap).toLocaleTimeString('id-ID')} (lagi ${formatDuration(r.kebun.siap - Date.now())})\nDisiram ${r.kebun.disiram || 0}× · percepat: ${P}sirami`
    }
    return m.reply(`🌾 *KEBUN KAMU*\n\n${status}\n\n*Stok:*\n${punya}\n\n*Total panen:* ${r.stat.panen || 0}×\n*Bibit di tas:* ${r.inventory.bibit || 0}\n\nAlur: ${P}belibibit → ${P}tanam → (15 menit) → ${P}panen → ${P}jual / bahan ${P}craft`)
  })
]

/* ================================================================== */
/*  D. DUNGEON (4)                                                     */
/* ================================================================== */
export const rpgDungeonCmds = [
  rpg('dungeoninfo', ['listdungeon', 'dungeon'], 'Daftar dungeon & persyaratannya', async m => {
    const r = siapkan(R(K(m)))
    const buf = await kartu(m, { judul: '🗝️ DUNGEON', sub: `${DUNGEONS.length} dungeon · ${r.stat.dungeonSelesai || 0} diselesaikan`, footer: 'Butuh Kunci Dungeon & energi', tema: 'crimson', kataBg: 'dungeon,dark' })
    const teks = `*🗝️ DAFTAR DUNGEON*\n\n${DUNGEONS.map(d => {
      const bisa = r.level >= d.minLevel
      return `${d.icon} *${d.nama}* ${bisa ? '' : '🔒'}\n▸ Lv.${d.minLevel}+ · ${d.lantai} lantai · ⚡${d.energi} energi\n▸ HP monster ±${d.hpMonster} · hadiah 💰${d.koin.toLocaleString('id-ID')} + ${d.exp} EXP\n▸ Drop: ${d.drop.map(x => ITEMS[x]?.icon).join(' ')}\n▸ Masuk: ${P}masukdungeon ${d.id}`
    }).join('\n\n')}\n\n*Kamu:* Lv.${r.level} · ⚡${r.energy}/${r.maxEnergy} · ❤️${r.health}/${r.maxHealth}\n🗝️ Kunci: ${r.inventory.kuncidungeon || 0} (${P}toko kuncidungeon / ${P}craft kuncidungeon)\n${r.pet ? `🐾 ${r.pet.nama} membantu: ATK +${Math.round((statistik(r).pet?.atk || 0) + r.pet.level * 1.2)}` : ''}\n\n*Rekor:* selesai ${r.stat.dungeonSelesai || 0}× · gagal ${r.stat.dungeonGagal || 0}×\n\n💡 Monster dungeon lebih kuat dari ${P}battle biasa, tapi hadiahnya jauh lebih besar.`
    return kirimKartu(m, buf, teks)
  }),

  rpg('masukdungeon', ['dungeonrun', 'jelajahdungeon'], 'Masuk dungeon: .masukdungeon <id>', async m => {
    const r = siapkan(R(K(m)))
    const id = (m.args[0] || '').toLowerCase()
    const d = DUNGEONS.find(x => x.id === id || x.nama.toLowerCase().includes(id))
    if (!d) return m.reply(`Contoh: ${P}masukdungeon gua_kelelawar\n\nDaftar: ${P}dungeoninfo`)
    if (r.level < d.minLevel) return m.reply(`🔒 Butuh level ${d.minLevel} (kamu Lv.${r.level}).\n\nNaikkan level: ${P}jelajah · ${P}battle`)
    if (!hasItemSafe(r, 'kuncidungeon')) return m.reply(`❌ Butuh 🗝️ *Kunci Dungeon*.\n\nBeli: ${P}toko kuncidungeon (3.000 koin)\nCraft: ${P}craft kuncidungeon (5 besi + 2 emas)`)
    if (r.energy < d.energi) return m.reply(`⚡ Energi kurang: butuh ${d.energi}, punya ${r.energy}.\n\n${P}makan / ${P}toko kue / tunggu regen`)
    if (r.health < Math.round(r.maxHealth * 0.4)) return m.reply(`❤️ HP terlalu rendah (${r.health}/${r.maxHealth}). Minimal 40%.\n\nSembuhkan: ${P}heal (ramuan) atau tunggu regen`)
    takeItem(K(m), 'kuncidungeon', 1)
    r.energy -= d.energi

    const s = statistik(r)
    const atk = s.atk
    const def = s.def
    const log = []
    let monHpSisa = 0
    let koin = 0, exp = 0
    const drops = []
    let mati = false

    for (let lantai = 1; lantai <= d.lantai; lantai++) {
      const isBoss = lantai === d.lantai
      const hpMon = Math.round(d.hpMonster * (isBoss ? 1.8 : 1) * (1 + (lantai - 1) * 0.15))
      monHpSisa = hpMon
      let ronde = 0
      while (monHpSisa > 0 && r.health > 0 && ronde < 14) {
        ronde++
        const dmg = Math.round(atk * (0.85 + Math.random() * 0.4) * (isBoss ? 0.9 : 1))
        monHpSisa -= dmg
        log.push(`🗝️ Lantai ${lantai}${isBoss ? ' (BOSS)' : ''} ⚔️ -${dmg} HP monster`)
        if (monHpSisa <= 0) break
        const balas = Math.max(1, Math.round((hpMon * 0.1) * (1 - Math.min(0.75, def / 100)) * (0.7 + Math.random() * 0.6)))
        r.health = Math.max(0, r.health - balas)
        log.push(`🩸 Kamu kena -${balas} HP (sisa ${r.health})`)
      }
      if (r.health <= 0 || monHpSisa > 0) { mati = true; log.push(`💀 Gagal di lantai ${lantai}`); break }
      const rewardKoin = Math.round(d.koin / d.lantai * s.luck * (isBoss ? 2 : 1))
      const rewardExp = Math.round(d.exp / d.lantai * (isBoss ? 1.6 : 1))
      koin += rewardKoin
      exp += rewardExp
      log.push(`✅ Lantai ${lantai} bersih: +${rewardKoin.toLocaleString('id-ID')} koin, +${rewardExp} EXP`)
      if (Math.random() < (isBoss ? 0.65 : 0.25) * s.luck) {
        const drop = pickRandom(d.drop)
        addItem(K(m), drop, 1)
        drops.push(drop)
        log.push(`🎁 Drop: ${ITEMS[drop]?.icon} ${ITEMS[drop]?.name}`)
      }
    }

    const menang = !mati
    if (menang) {
      r.money += koin
      r.stat.dungeonSelesai = (r.stat.dungeonSelesai || 0) + 1
      catatHarian(r, 'dungeon')
      petExp(r, 120)
      addExp(K(m), exp)
      catat(r, `Menyelesaikan ${d.nama} (+${koin} koin)`)
    } else {
      const hilang = Math.round(r.money * 0.05)
      r.money -= hilang
      r.health = Math.max(Math.round(r.maxHealth * 0.25), r.health)
      r.stat.dungeonGagal = (r.stat.dungeonGagal || 0) + 1
      addExp(K(m), Math.round(exp * 0.2))
      catat(r, `Gagal di ${d.nama} (-${hilang} koin)`)
      log.push(`💸 Kehilangan ${hilang.toLocaleString('id-ID')} koin`)
    }
    simpan()

    const buf = await kartu(m, {
      judul: menang ? '🏆 DUNGEON DITAKLUKKAN' : '💀 GAGAL',
      sub: `${d.icon} ${d.nama} — ${menang ? `+${koin.toLocaleString('id-ID')} koin` : 'kamu tumbang'}`,
      footer: `❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy} · 💰 ${r.money.toLocaleString('id-ID')}`,
      tema: menang ? 'gold' : 'crimson',
      kataBg: d.bg
    })
    return kirimKartu(m, buf, `${menang ? '🏆' : '💀'} *${d.nama.toUpperCase()}* — ${menang ? 'SELESAI!' : 'GAGAL'}\n\n${log.map(x => `▸ ${x}`).join('\n').slice(0, 1800)}\n\n*Hasil:*\n${menang ? `▸ 💰 +${koin.toLocaleString('id-ID')} koin\n▸ ✨ +${exp} EXP\n${drops.length ? `▸ 🎁 Drop: ${drops.map(x => ITEMS[x]?.icon + ' ' + ITEMS[x]?.name).join(', ')}\n` : ''}${r.pet ? `▸ 🐾 +120 EXP pet\n` : ''}` : `▸ Kehilangan sebagian koin & HP\n▸ +20% EXP sebagai pengalaman`}\n\nSisa: ❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy} · 🗝️ ${r.inventory.kuncidungeon || 0}\n\n${menang ? `Ulangi: ${P}masukdungeon ${d.id}` : `Sembuhkan dulu: ${P}heal · perkuat: ${P}tempa / ${P}craft`}`, {
      title: menang ? '🏆 MENANG' : '💀 KALAH',
      buttons: menang
        ? [{ text: '🗝️ Kunci Lagi', id: `${P}toko kuncidungeon` }, { text: '📊 Statistik', id: `${P}rpgstat` }, { text: '🏰 Dungeon Lain', id: `${P}dungeoninfo` }]
        : [{ text: '🧪 Heal', id: `${P}heal` }, { text: '⚒️ Tempa', id: `${P}tempa` }, { text: '📜 Resep', id: `${P}resep` }]
    })
  }, 'gua_kelelawar'),

  rpg('dungeonlb', ['leaderboarddungeon', 'topdungeon'], 'Peringkat penakluk dungeon', m => {
    const rows = allUsers()
      .map(u => ({ jid: u.jid, nama: u.name || u.jid.split('@')[0], n: u.rpg?.stat?.dungeonSelesai || 0, lv: u.rpg?.level || 0 }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n || b.lv - a.lv)
      .slice(0, 15)
    if (!rows.length) return m.reply('ℹ️ Belum ada yang menyelesaikan dungeon. Jadilah yang pertama: ' + P + 'dungeoninfo')
    const aku = rows.findIndex(x => x.jid === K(m)) + 1
    return m.reply(`🏰 *PERINGKAT DUNGEON*\n\n${rows.map((x, i) => `${['🥇', '🥈', '🥉'][i] || i + 1}. ${truncate(x.nama, 20)} — ${x.n} dungeon (Lv.${x.lv})`).join('\n')}\n\nKamu: ${aku ? `#${aku}` : 'belum masuk 15 besar'}\n\nMulai: ${P}dungeoninfo`)
  }),

  rpg('dungeonpersiapan', ['cekdungeon', 'siapdungeon'], 'Cek kesiapan kamu masuk dungeon', m => {
    const r = siapkan(R(K(m)))
    const s = statistik(r)
    const d = DUNGEONS.find(x => r.level >= x.minLevel) ? [...DUNGEONS].reverse().find(x => r.level >= x.minLevel) : null
    const cek = [
      ['🗝️ Kunci Dungeon', hasItemSafe(r, 'kuncidungeon') ? `✅ ${r.inventory.kuncidungeon} buah` : `❌ 0 — ${P}toko kuncidungeon`],
      ['⚡ Energi', r.energy >= (d?.energi || 30) ? `✅ ${r.energy}/${r.maxEnergy}` : `❌ ${r.energy} (butuh ${d?.energi || 30}) — ${P}makan`],
      ['❤️ HP', r.health >= r.maxHealth * 0.4 ? `✅ ${r.health}/${r.maxHealth}` : `❌ ${r.health} — ${P}heal`],
      ['⚔️ Attack', `ATK ${s.atk} ${s.atk >= (d?.hpMonster || 60) / 3 ? '✅ cukup' : '⚠️ lemah — ' + P + 'tempa'}`],
      ['🛡️ Defense', `DEF ${s.def} ${r.equipped?.armor ? '✅' : '⚠️ tanpa armor — ' + P + 'craft armorbesi'}`],
      ['🐾 Pet', r.pet ? `✅ ${r.pet.nama} Lv.${r.pet.level}` : `⚠️ belum punya — ${P}pettelur`]
    ]
    return m.reply(`🎒 *KESIAPAN DUNGEON*\n\nTarget disarankan: ${d ? `${d.icon} ${d.nama} (Lv.${d.minLevel}+, ${d.lantai} lantai)` : 'naikkan level dulu (Lv.3+)'}\n\n${cek.map(([k, v]) => `▸ ${k}: ${v}`).join('\n')}\n\n${cek.every(([, v]) => v.startsWith('✅')) ? '🟢 *SIAP MASUK!* → ' + P + 'masukdungeon ' + (d?.id || '') : '🔴 Lengkapi dulu yang ❌/⚠️'}`)
  })
]

/* ================================================================== */
/*  E. MISI HARIAN (3)                                                 */
/* ================================================================== */
export const rpgMisiCmds = [
  rpg('misi', ['quest', 'misi harian'.replace(' ', '')], 'Misi harian: 3 tugas + hadiah', async m => {
    const r = siapkan(R(K(m)))
    const misi = pastikanMisi(r)
    const buf = await kartu(m, { judul: '🎯 MISI HARIAN', sub: `${misi.list.filter(x => !x.klaim).length} tugas aktif`, footer: `Reset tiap tengah malam · ${HARI()}`, tema: 'sunset', kataBg: 'quest,scroll' })
    const teks = `*🎯 MISI HARIAN — ${HARI()}*\n\n${misi.list.map(x => {
      const p = progresMisi(r, x)
      const selesai = p >= x.target
      return `${x.klaim ? '✅' : selesai ? '🎁' : '⬜'} *${x.teks}*\n   ${bar(p, x.target, 12)} ${Math.min(p, x.target)}/${x.target}\n   Hadiah: 💰 ${x.koin.toLocaleString('id-ID')} + ✨ ${x.exp} EXP${x.klaim ? ' — *sudah diklaim*' : selesai ? ` — **${P}misiklaim ${x.id}**` : ''}`
    }).join('\n\n')}\n\n*Bonus semua misi:* ${misi.list.every(x => x.klaim) ? '✅ sudah diklaim' : `${misi.bonusKlaimSemua ? 'sudah' : `💰 2.000 koin + 🎁 1 kunci dungeon (klaim setelah 3 misi selesai)`}`}\n\n💡 Progres dihitung otomatis dari aktivitasmu hari ini (${P}rpgriwayat).\nMisi baru muncul tiap tengah malam.`
    return kirimKartu(m, buf, teks)
  }),

  rpg('misiklaim', ['klaimmisi', 'claimquest'], 'Klaim hadiah misi: .misiklaim <id|semua>', m => {
    const r = siapkan(R(K(m)))
    const misi = pastikanMisi(r)
    const arg = String(m.args[0] || '').toLowerCase()
    const semua = ['semua', 'all', '-'].includes(arg)
    const dipilih = semua ? misi.list : misi.list.filter(x => x.id === Number(arg))
    if (!dipilih.length) return m.reply(`Contoh: ${P}misiklaim 1\natau ${P}misiklaim semua\n\nLihat: ${P}misi`)
    let totalKoin = 0, totalExp = 0, n = 0, belum = 0
    for (const x of dipilih) {
      if (x.klaim) continue
      if (progresMisi(r, x) < x.target) { belum++; continue }
      x.klaim = true
      totalKoin += x.koin
      totalExp += x.exp
      n++
    }
    let bonus = ''
    if (n && misi.list.every(x => x.klaim) && !misi.bonusKlaimSemua) {
      misi.bonusKlaimSemua = true
      totalKoin += 2000
      addItem(K(m), 'kuncidungeon', 1)
      bonus = '\n\n🎁 *BONUS SEMUA MISI!* +2.000 koin & +1 🗝️ Kunci Dungeon'
    }
    if (!n) return m.reply(belum ? `⏳ ${belum} misi belum selesai.\n\nLihat progres: ${P}misi` : 'ℹ️ Semua misi sudah diklaim hari ini.\n\nMisi baru: besok tengah malam.')
    r.money += totalKoin
    addExp(K(m), totalExp)
    catat(r, `Klaim ${n} misi (+${totalKoin} koin)`)
    simpan()
    return m.reply(`🎉 *HADIAH MISI DIKLAIM*\n\n${n} misi selesai\n💰 +${totalKoin.toLocaleString('id-ID')} koin\n✨ +${totalExp} EXP${bonus}\n\nSisa koin: ${r.money.toLocaleString('id-ID')}\nLihat misi: ${P}misi`)
  }, 'semua'),

  rpg('misistatus', ['misicek', 'cekquest'], 'Cek cepat progres misi tanpa kartu', m => {
    const r = siapkan(R(K(m)))
    const misi = pastikanMisi(r)
    const selesai = misi.list.filter(x => progresMisi(r, x) >= x.target && !x.klaim).length
    return m.reply(`🎯 *MISI ${HARI()}*\n\n${misi.list.map(x => `${x.klaim ? '✅' : progresMisi(r, x) >= x.target ? '🎁' : '⬜'} ${x.teks} — ${Math.min(progresMisi(r, x), x.target)}/${x.target}`).join('\n')}\n\n${selesai ? `🎁 *${selesai} misi siap diklaim!* → ${P}misiklaim semua` : 'Semua masih berjalan. Coba: ' + P + 'jelajah / ' + P + 'berburu / ' + P + 'battle'}\n\nDetail: ${P}misi`)
  })
]

/* ================================================================== */
/*  F. CRAFTING & PENEMPAAN (4)                                        */
/* ================================================================== */
export const rpgCraftCmds = [
  rpg('resep', ['daftarresep', 'craftlist'], 'Semua resep crafting + bahan yang kamu punya', m => {
    const r = siapkan(R(K(m)))
    const rows = Object.entries(RESEP).map(([hasil, res]) => {
      const punya = Object.entries(res.butuh).map(([b, n]) => `${(r.inventory[b] || 0) >= n ? '✅' : '❌'}${n} ${ITEMS[b]?.icon || ''}`).join(' ')
      const bisa = Object.entries(res.butuh).every(([b, n]) => (r.inventory[b] || 0) >= n)
      return `${bisa ? '🟢' : '⚪'} ${ITEMS[hasil]?.icon || '📦'} *${ITEMS[hasil]?.name || hasil}*\n   Bahan: ${punya}\n   ${res.ket} · +${res.exp} EXP`
    })
    return m.sendButtons({
      title: `📜 RESEP CRAFTING (${Object.keys(RESEP).length})`,
      text: rows.join('\n\n').slice(0, 3000) + `\n\nCraft: ${P}craft <nama item>\nContoh: ${P}craft pedangemas`,
      footer: config.bot.footer,
      buttons: [{ text: '⚒️ Tempa', id: `${P}tempa` }, { text: '🎒 Inventory', id: `${P}inv` }, { text: '🏪 Toko', id: `${P}toko` }]
    })
  }),

  rpg('craft', ['buatitem', 'membuat'], 'Craft item dari bahan: .craft <nama>', m => {
    const r = siapkan(R(K(m)))
    const nama = (m.args[0] || '').toLowerCase()
    const res = RESEP[nama]
    if (!nama || !res) return m.reply(`Contoh: ${P}craft pedang\n\nResep tersedia: ${Object.keys(RESEP).map(x => `\`${x}\``).join(' ')}\n\nDetail: ${P}resep`)
    const kurang = Object.entries(res.butuh).filter(([b, n]) => (r.inventory[b] || 0) < n)
    if (kurang.length) {
      return m.reply(`❌ Bahan kurang:\n${kurang.map(([b, n]) => `▸ ${ITEMS[b]?.icon} ${ITEMS[b]?.name}: punya ${r.inventory[b] || 0}, butuh ${n}`).join('\n')}\n\nCari bahan: ${P}menambang · ${P}jelajah · ${P}berburu\nAtau beli: ${P}toko`)
    }
    if (r.energy < 8) return m.reply(`⚡ Butuh 8 energi untuk craft (punya ${r.energy}).\n\n${P}makan`)
    for (const [b, n] of Object.entries(res.butuh)) takeItem(K(m), b, n)
    r.energy -= 8
    addItem(K(m), nama, 1)
    r.stat.craft = (r.stat.craft || 0) + 1
    catatHarian(r, 'craft')
    addExp(K(m), res.exp)
    // auto-equip kalau lebih bagus / slot kosong
    let dipasang = ''
    const tipe = ITEMS[nama]?.type
    const slot = tipe === 'weapon' ? 'weapon' : tipe === 'armor' ? 'armor' : tipe === 'tool' ? 'tool' : null
    if (slot && !r.equipped[slot]) {
      try { equip(K(m), nama); dipasang = `\n🔧 Otomatis dipasang di slot ${slot}!` } catch { /* biarkan di tas */ }
    }
    catat(r, `Craft ${ITEMS[nama]?.name}`)
    simpan()
    return m.reply(`🔨 *CRAFT BERHASIL*\n\n${ITEMS[nama]?.icon} *${ITEMS[nama]?.name}* +1\n\nBahan terpakai: ${Object.entries(res.butuh).map(([b, n]) => `${n}× ${ITEMS[b]?.icon}`).join(', ')}\n-8 ⚡ energi · +${res.exp} EXP${dipasang}\n\n${slot ? `Pasang: ${P}equip ${nama}` : `Pakai: ${P}gunakan ${nama}`}\nPerkuat: ${P}tempa\nStatistik baru: ${P}rpgstat`)
  }, 'pedang'),

  rpg('tempa', ['forge', 'upgrade'], 'Tempa peralatan yang dipakai (+4% per level, maks +10)', m => {
    const r = siapkan(R(K(m)))
    const slotArg = String(m.args[0] || '').toLowerCase()
    const slotMap = { weapon: 'weapon', senjata: 'weapon', armor: 'armor', tool: 'tool', alat: 'tool' }
    const slot = slotMap[slotArg] || (r.equipped?.weapon ? 'weapon' : r.equipped?.armor ? 'armor' : r.equipped?.tool ? 'tool' : null)
    if (!slot || !r.equipped?.[slot]) return m.reply(`❌ Tidak ada peralatan di slot itu.\n\nTerpasang sekarang:\n▸ 🗡️ Senjata: ${r.equipped?.weapon ? ITEMS[r.equipped.weapon].name : '-'}\n▸ 🛡️ Armor: ${r.equipped?.armor ? ITEMS[r.equipped.armor].name : '-'}\n▸ 🔧 Alat: ${r.equipped?.tool ? ITEMS[r.equipped.tool].name : '-'}\n\nContoh: ${P}tempa senjata · ${P}tempa armor · ${P}tempa alat`)
    const item = r.equipped[slot]
    const lv = r.forge?.[item] || 0
    if (lv >= 10) return m.reply(`✨ ${ITEMS[item].name} sudah maksimal (+10).\n\nBonus: +${(lv * 4)}% · lihat ${P}tempalist`)
    const butuhBesi = 2 + lv
    const butuhEmas = lv >= 3 ? Math.ceil(lv / 2) : 0
    const biaya = 500 + lv * 700
    const punya = (r.inventory.besi || 0)
    if (punya < butuhBesi) return m.reply(`❌ Butuh ${butuhBesi} ⛓️ Besi (punya ${punya}).\n\nTambang: ${P}menambang · ${P}jelajah gua\n${butuhEmas ? `Juga butuh ${butuhEmas} 🥇 Emas.` : ''}`)
    if (butuhEmas && (r.inventory.emas || 0) < butuhEmas) return m.reply(`❌ Butuh ${butuhEmas} 🥇 Emas (punya ${r.inventory.emas || 0}).\n\nTambang di ${P}jelajah gunung / gurun`)
    if (r.money < biaya) return m.reply(`❌ Biaya pandai besi ${biaya.toLocaleString('id-ID')} koin (punya ${r.money.toLocaleString('id-ID')}).`)
    if (r.energy < 12) return m.reply(`⚡ Butuh 12 energi (punya ${r.energy}).`)

    takeItem(K(m), 'besi', butuhBesi)
    if (butuhEmas) takeItem(K(m), 'emas', butuhEmas)
    r.money -= biaya
    r.energy -= 12
    const peluang = lv < 3 ? 1 : lv < 6 ? 0.85 : lv < 9 ? 0.65 : 0.45
    const sukses = Math.random() < peluang
    r.forge = r.forge || {}
    if (sukses) {
      r.forge[item] = lv + 1
      r.stat.tempa = (r.stat.tempa || 0) + 1
      addExp(K(m), 60 + lv * 25)
      catat(r, `Tempa ${ITEMS[item].name} → +${lv + 1}`)
    } else {
      addExp(K(m), 25)
      catat(r, `Tempa gagal ${ITEMS[item].name}`)
    }
    simpan()
    const bonusNow = Math.round(equipBonus(K(m), slot) * 100)
    return sukses
      ? m.reply(`⚒️ *TEMPA BERHASIL!*\n\n${ITEMS[item].icon} ${ITEMS[item].name} → *+${lv + 1}*\n\nBonus total slot ${slot}: +${bonusNow}%\nBahan: -${butuhBesi} ⛓️${butuhEmas ? ` -${butuhEmas} 🥇` : ''} -${biaya.toLocaleString('id-ID')} 💰 -12 ⚡\n+${60 + lv * 25} EXP\n\nPeluang berikutnya: ${Math.round((lv + 1 < 3 ? 1 : lv + 1 < 6 ? 0.85 : lv + 1 < 9 ? 0.65 : 0.45) * 100)}%\nStatistik: ${P}rpgstat`)
      : m.reply(`💥 *TEMPA GAGAL!* (${Math.round(peluang * 100)}% peluang tadi)\n\n${ITEMS[item].icon} ${ITEMS[item].name} tetap +${lv}\nBahan & biaya tetap terpakai: -${butuhBesi} ⛓️ -${biaya.toLocaleString('id-ID')} 💰\n+25 EXP penghibur\n\nCoba lagi: ${P}tempa ${slotArg || slot}\nTabel peluang: ${P}tempalist`)
  }, 'senjata'),

  rpg('tempalist', ['bonustempa', 'tabeltempa'], 'Tabel bonus & peluang penempaan', m => {
    const r = siapkan(R(K(m)))
    const rows = Array.from({ length: 10 }, (_, i) => {
      const lv = i + 1
      const peluang = lv <= 3 ? 100 : lv <= 6 ? 85 : lv <= 9 ? 65 : 45
      const besi = 1 + lv
      const emas = lv >= 4 ? Math.ceil((lv - 1) / 2) : 0
      const biaya = 500 + (lv - 1) * 700
      return `+${String(lv).padEnd(2)} → +${lv * 4}%  |  ${peluang}%  |  ${besi}⛓️${emas ? ` ${emas}🥇` : ''}  |  💰${biaya.toLocaleString('id-ID')}`
    })
    const now = Object.entries(r.forge || {}).filter(([, v]) => v > 0)
    return m.reply(`⚒️ *TABEL PENEMPAAN*\n\n\`\`\`\nLv  Bonus   Peluang  Bahan        Biaya\n${rows.join('\n')}\n\`\`\`\n\n*Peralatanmu:*\n${now.length ? now.map(([k, v]) => `▸ ${ITEMS[k]?.icon} ${ITEMS[k]?.name} +${v} (+${v * 4}%)`).join('\n') : '(belum ada yang ditempa)'}\n\nTerpasang: ${['weapon', 'armor', 'tool'].map(s => `${s}: ${r.equipped?.[s] ? ITEMS[r.equipped[s]].name : '-'}`).join(' · ')}\n\nTempa: ${P}tempa senjata|armor|alat`)
  })
]

/* ================================================================== */
/*  G. ARENA PVP (3)                                                   */
/* ================================================================== */
export const rpgArenaCmds = [
  rpg('arena', ['pvp', 'duel'], 'Duel PvP dengan user lain: .arena @user [taruhan]', async m => {
    const r = siapkan(R(K(m)))
    const target = m.mentionJid?.[0] || (() => {
      const n = String(m.args.find(a => /^\d{9,15}$/.test(a.replace(/\D/g, ''))) || '').replace(/\D/g, '')
      return n ? n + '@s.whatsapp.net' : null
    })()
    if (!target) return m.reply(`Tag lawannya atau tulis nomornya.\n\nContoh:\n▸ ${P}arena @628xxx\n▸ ${P}arena @628xxx 5000 (taruhan koin)\n\nTaruhan default: 500 koin (maks 20% koinmu)`)
    if (target === K(m)) return m.reply('😅 Tidak bisa duel dengan diri sendiri.')
    const t = getUser(target)
    const rt = t.rpg ? siapkan(t.rpg) : null
    if (!rt) return m.reply(`❌ @${target.split('@')[0]} belum pernah main RPG.\n\nSuruh dia mulai: ${P}rpg`, { mentions: [target] })
    const taruhan = Math.max(0, Math.min(Number(m.args.find(a => /^\d+$/.test(a)) || 500), Math.round(r.money * 0.2), rt.money))
    if (r.energy < 20) return m.reply(`⚡ Butuh 20 energi (punya ${r.energy}).\n\n${P}makan`)
    if (r.health < 30) return m.reply(`❤️ HP terlalu rendah (${r.health}). Sembuhkan: ${P}heal`)
    const cd = (r.arena.terakhir || 0) + 120000 - Date.now()
    if (cd > 0) return m.reply(`⏳ Tunggu ${formatDuration(cd)} sebelum duel lagi.`)

    r.energy -= 20
    r.arena.terakhir = Date.now()

    const sA = statistik(r), sB = statistik(rt)
    let hpA = r.health, hpB = rt.health
    const log = []
    let ronde = 0
    while (hpA > 0 && hpB > 0 && ronde < 10) {
      ronde++
      const dmgA = Math.max(1, Math.round(sA.atk * (0.7 + Math.random() * 0.5) * (1 - Math.min(0.6, sB.def / 120))))
      hpB -= dmgA
      log.push(`⚔️ R${ronde}: kamu -${dmgA} → lawan (${Math.max(0, hpB)} HP)`)
      if (hpB <= 0) break
      const dmgB = Math.max(1, Math.round(sB.atk * (0.7 + Math.random() * 0.5) * (1 - Math.min(0.6, sA.def / 120))))
      hpA -= dmgB
      log.push(`🩸 R${ronde}: lawan -${dmgB} → kamu (${Math.max(0, hpA)} HP)`)
    }
    const menang = hpB <= 0 && hpA > 0
    const seri = !menang && hpA > 0 && hpB > 0 && ronde >= 10

    r.health = Math.max(1, hpA)
    rt.health = Math.max(1, hpB)
    let hasilKoin = ''
    if (menang) {
      r.money += taruhan
      rt.money = Math.max(0, rt.money - taruhan)
      r.arena.menang = (r.arena.menang || 0) + 1
      r.arena.streak = (r.arena.streak || 0) + 1
      r.arena.terbaik = Math.max(r.arena.terbaik || 0, r.arena.streak)
      addExp(K(m), 120 + taruhan / 20)
      hasilKoin = `💰 +${taruhan.toLocaleString('id-ID')} koin (dari lawan)`
    } else if (seri) {
      r.arena.seri = (r.arena.seri || 0) + 1
      addExp(K(m), 60)
      hasilKoin = '🤝 Seri — taruhan dikembalikan'
    } else {
      r.money = Math.max(0, r.money - taruhan)
      rt.money += taruhan
      r.arena.kalah = (r.arena.kalah || 0) + 1
      r.arena.streak = 0
      addExp(K(m), 40)
      hasilKoin = `💸 -${taruhan.toLocaleString('id-ID')} koin (ke lawan)`
    }
    petExp(r, 50)
    catatHarian(r, 'arena')
    catat(r, `Arena vs ${target.split('@')[0]}: ${menang ? 'menang' : seri ? 'seri' : 'kalah'}`)
    simpan()

    try {
      await m.sock.sendMessage(target, {
        text: `⚔️ *DUEL ARENA*\n\n@${K(m).split('@')[0]} menantangmu!\nHasil: ${menang ? 'kamu KALAH 😢' : seri ? 'SERI 🤝' : 'kamu MENANG 🏆'}\nTaruhan: ${taruhan.toLocaleString('id-ID')} koin\n\nStatistikmu: ${rt.arena?.menang || 0}M/${rt.arena?.kalah || 0}K\nBalas tantangan: ${P}arena @${K(m).split('@')[0]}`,
        mentions: [K(m)]
      })
    } catch { /* lawan mungkin blokir bot */ }

    const buf = await kartu(m, {
      judul: menang ? '🏆 MENANG DUEL' : seri ? '🤝 SERI' : '💀 KALAH DUEL',
      sub: `ATK ${sA.atk} vs ${sB.atk} · DEF ${sA.def} vs ${sB.def}`,
      footer: hasilKoin,
      tema: menang ? 'gold' : seri ? 'midnight' : 'crimson',
      kataBg: 'arena,battle'
    })
    return kirimKartu(m, buf, `⚔️ *ARENA PVP* ${menang ? '— KAMU MENANG! 🏆' : seri ? '— SERI 🤝' : '— KAMU KALAH 💀'}\n\nLawan: @${target.split('@')[0]}${rt.prestasi?.gelar ? ` (${rt.prestasi.gelar})` : ''}\n\n*Statistik:*\n▸ Kamu  : ATK ${sA.atk} · DEF ${sA.def} · HP akhir ${Math.max(1, hpA)}\n▸ Lawan : ATK ${sB.atk} · DEF ${sB.def} · HP akhir ${Math.max(1, hpB)}\n\n*log ${ronde} ronde:*\n${log.map(x => '▸ ' + x).join('\n').slice(0, 1200)}\n\n${hasilKoin}\nRekor: ${r.arena.menang}M / ${r.arena.kalah}K / ${r.arena.seri}S · streak ${r.arena.streak}🔥\n\nPerkuat diri: ${P}tempa · ${P}craft · ${P}petlatih`, {
      title: '⚔️ ARENA',
      buttons: [{ text: '📊 Rekor', id: `${P}arenarekam` }, { text: '⚒️ Tempa', id: `${P}tempa` }, { text: '🏅 Papan Arena', id: `${P}arenalb` }]
    })
  }, '@628xxx 1000'),

  rpg('arenarekam', ['rekorarena', 'statistikarena'], 'Rekor duel arena kamu', m => {
    const r = siapkan(R(K(m)))
    const a = r.arena
    const total = (a.menang || 0) + (a.kalah || 0) + (a.seri || 0)
    const winrate = total ? Math.round((a.menang / total) * 100) : 0
    return m.reply(`⚔️ *REKOR ARENA*\n\nMenang : ${a.menang || 0}\nKalah  : ${a.kalah || 0}\nSeri   : ${a.seri || 0}\nTotal  : ${total}\nWinrate: ${winrate}% ${bar(a.menang || 0, Math.max(1, total), 12)}\nStreak : ${a.streak || 0}🔥 (terbaik ${a.terbaik || 0})\nDuel terakhir: ${a.terakhir ? new Date(a.terakhir).toLocaleString('id-ID') : '-'}\n\nDuel lagi: ${P}arena @user\nPerkuat: ${P}rpgstat`)
  }),

  rpg('arenalb', ['papanarena', 'toparena'], 'Papan peringkat duel arena', m => {
    const rows = allUsers()
      .map(u => ({ jid: u.jid, nama: u.name || u.jid.split('@')[0], m: u.rpg?.arena?.menang || 0, k: u.rpg?.arena?.kalah || 0, s: u.rpg?.arena?.streak || 0 }))
      .filter(x => x.m + x.k > 0)
      .sort((a, b) => b.m - a.m || b.s - a.s)
      .slice(0, 15)
    if (!rows.length) return m.reply('ℹ️ Belum ada duel. Mulai: ' + P + 'arena @user')
    return m.reply(`🏆 *PAPAN ARENA*\n\n${rows.map((x, i) => `${['🥇', '🥈', '🥉'][i] || i + 1}. ${truncate(x.nama, 20)} — ${x.m}M/${x.k}K${x.s > 1 ? ` 🔥${x.s}` : ''}`).join('\n')}\n\nRekormu: ${P}arenarekam\nTantang: ${P}arena @user`)
  })
]

/* ================================================================== */
/*  H. BANK (3)                                                        */
/* ================================================================== */
export const rpgBankCmds = [
  rpg('bank', ['setorbank', 'deposit'], 'Setor koin ke bank (aman + bunga 1%/hari)', m => {
    const r = siapkan(R(K(m)))
    const jumlah = String(m.args[0]).toLowerCase() === 'semua' ? r.money : Number(m.args[0])
    if (!jumlah || jumlah < 1) return m.reply(`Contoh:\n▸ ${P}bank 10000\n▸ ${P}bank semua\n\nKoin di tangan: 💰 ${r.money.toLocaleString('id-ID')}\nSaldo bank: 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')}`)
    if (jumlah > r.money) return m.reply(`❌ Koin tidak cukup.\n\nMau setor: ${jumlah.toLocaleString('id-ID')}\nPunya   : ${r.money.toLocaleString('id-ID')}`)
    const bunga = prosesBank(r)
    r.money -= jumlah
    r.bank.saldo = (r.bank.saldo || 0) + jumlah
    r.bank.terakhirBunga = r.bank.terakhirBunga || Date.now()
    r.bank.riwayat = [{ w: Date.now(), t: `setor ${jumlah}` }, ...(r.bank.riwayat || [])].slice(0, 10)
    catat(r, `Setor bank ${jumlah} koin`)
    simpan()
    return m.reply(`🏦 *SETORAN BERHASIL*\n\n+${jumlah.toLocaleString('id-ID')} koin ke bank${bunga ? `\n+${bunga.toLocaleString('id-ID')} bunga diproses` : ''}\n\nSaldo bank: 🏦 ${r.bank.saldo.toLocaleString('id-ID')}\nKoin di tangan: 💰 ${r.money.toLocaleString('id-ID')}\n\n💡 Bunga 1%/hari. Koin di bank AMAN dari kekalahan arena/battle.\nTarik: ${P}tarikbank <jumlah>`)
  }, '5000'),

  rpg('tarikbank', ['withdraw', 'ambilbank'], 'Tarik koin dari bank', m => {
    const r = siapkan(R(K(m)))
    prosesBank(r)
    const jumlah = String(m.args[0]).toLowerCase() === 'semua' ? r.bank.saldo : Number(m.args[0])
    if (!jumlah || jumlah < 1) return m.reply(`Contoh: ${P}tarikbank 5000 atau ${P}tarikbank semua\n\nSaldo: 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')}`)
    if (jumlah > r.bank.saldo) return m.reply(`❌ Saldo tidak cukup.\n\nMau tarik: ${jumlah.toLocaleString('id-ID')}\nSaldo    : ${(r.bank.saldo || 0).toLocaleString('id-ID')}`)
    r.bank.saldo -= jumlah
    r.money += jumlah
    r.bank.riwayat = [{ w: Date.now(), t: `tarik ${jumlah}` }, ...(r.bank.riwayat || [])].slice(0, 10)
    catat(r, `Tarik bank ${jumlah} koin`)
    simpan()
    return m.reply(`💵 *PENARIKAN BERHASIL*\n\n-${jumlah.toLocaleString('id-ID')} dari bank\n\nSaldo bank: 🏦 ${r.bank.saldo.toLocaleString('id-ID')}\nKoin di tangan: 💰 ${r.money.toLocaleString('id-ID')}`)
  }, '2000'),

  rpg('bankinfo', ['infobank', 'cekbank'], 'Saldo, bunga, & riwayat bank', m => {
    const r = siapkan(R(K(m)))
    const bunga = prosesBank(r)
    if (bunga) simpan()
    const jam = (Date.now() - (r.bank.terakhirBunga || Date.now())) / 3600000
    const total = r.money + (r.bank.saldo || 0)
    return m.reply(`🏦 *BANK ${config.bot.name}*\n\nSaldo    : ${(r.bank.saldo || 0).toLocaleString('id-ID')} koin\nKoin tangan: ${r.money.toLocaleString('id-ID')}\n*Total kekayaan: ${total.toLocaleString('id-ID')}* 💎\n\nBunga    : 1%/hari${bunga ? ` (baru saja +${bunga.toLocaleString('id-ID')})` : ''}\nSejak bunga terakhir: ${jam.toFixed(1)} jam\nPerkiraan besok: +${Math.floor((r.bank.saldo || 0) * 0.01).toLocaleString('id-ID')}\n\n*Riwayat:*\n${(r.bank.riwayat || []).slice(0, 8).map(x => `▸ ${new Date(x.w).toLocaleString('id-ID').slice(0, 16)} — ${x.t}`).join('\n') || '(kosong)'}\n\nSetor: ${P}bank <jumlah> · Tarik: ${P}tarikbank <jumlah>\n\n💡 Koin di bank tidak hilang saat kalah arena/battle.`)
  })
]

/* ================================================================== */
/*  I. LOKASI & JELAJAH (3)                                            */
/* ================================================================== */
export const rpgLokasiCmds = [
  rpg('peta', ['map', 'peta rpg'.replace(' ', '')], 'Peta lokasi jelajah & status terbuka', async m => {
    const r = siapkan(R(K(m)))
    const buf = await kartu(m, { judul: '🗺️ PETA PETUALANGAN', sub: `${LOKASI.filter(l => r.level >= l.minLevel).length}/${LOKASI.length} lokasi terbuka`, footer: `Level ${r.level} · ⚡ ${r.energy} energi`, tema: 'forest', kataBg: 'fantasy,map' })
    const teks = `*🗺️ PETA LOKASI*\n\n${LOKASI.map(l => {
      const buka = r.level >= l.minLevel
      const dikunjungi = r.stat.jelajah?.[l.id] || 0
      return `${buka ? l.icon : '🔒'} *${l.nama}* ${buka ? '' : `(Lv.${l.minLevel}+)`}\n▸ ⚡ ${l.energi} energi · koin ${l.koin[0]}-${l.koin[1]} · EXP ${l.exp[0]}-${l.exp[1]}\n▸ Loot: ${l.loot.map(x => ITEMS[x]?.icon + ' ' + ITEMS[x]?.name).join(', ')}\n▸ Dijelajahi: ${dikunjungi}×${buka ? ` → ${P}jelajah ${l.id}` : ' 🔒 naikkan level'}`
    }).join('\n\n')}\n\n🍀 Luck kamu: ${statistik(r).luck.toFixed(2)}× (pet ${r.pet ? '✅' : '❌'} · peta harta ${hasItemSafe(r, 'peta') ? '✅' : '❌'})\n\n💡 Punya item 🗺️ Peta Harta = loot +15% seharian.`
    return kirimKartu(m, buf, teks)
  }),

  rpg('jelajah', ['explore', 'eksplorasi'], 'Jelajahi lokasi: .jelajah <id lokasi>', async m => {
    const r = siapkan(R(K(m)))
    const id = (m.args[0] || '').toLowerCase()
    const l = LOKASI.find(x => x.id === id || x.nama.toLowerCase().includes(id))
    if (!l) return m.reply(`Contoh: ${P}jelajah hutan\n\nLokasi: ${LOKASI.map(x => `\`${x.id}\``).join(' ')}\n\nPeta: ${P}peta`)
    if (r.level < l.minLevel) return m.reply(`🔒 Butuh level ${l.minLevel} (kamu Lv.${r.level}).\n\nCoba lokasi lebih mudah: ${P}peta`)
    if (r.energy < l.energi) return m.reply(`⚡ Energi kurang: butuh ${l.energi}, punya ${r.energy}.\n\n${P}makan / ${P}toko kue / regen 1 energi per 2 menit`)
    r.energy -= l.energi
    const s = statistik(r)

    // 20% kemungkinan ketemu monster → pertarungan singkat
    const kejadian = Math.random()
    let teksKejadian = ''
    if (kejadian < 0.18) {
      const mon = pickRandom(MONSTERS.filter(x => x.minLevel <= r.level)) || MONSTERS[0]
      const dmg = Math.max(1, Math.round(mon.hp * 0.15 * (1 - Math.min(0.6, s.def / 100))))
      r.health = Math.max(1, r.health - dmg)
      const koinM = Math.round(mon.money * 0.5 * s.luck)
      r.money += koinM
      r.kills = (r.kills || 0) + 1
      catatHarian(r, 'battle')
      teksKejadian = `⚔️ *Disergap ${mon.icon} ${mon.name}!*\nKamu menang tipis: -${dmg} HP, +${koinM.toLocaleString('id-ID')} koin\n\n`
    } else if (kejadian < 0.26) {
      const jebak = Math.max(1, Math.round(r.maxHealth * 0.08))
      r.health = Math.max(1, r.health - jebak)
      teksKejadian = `🪤 *Terjebak!* -${jebak} HP\n\n`
    } else if (kejadian > 0.94) {
      const harta = Math.round(l.koin[1] * 2 * s.luck)
      r.money += harta
      teksKejadian = `💎 *Menemukan harta karun!* +${harta.toLocaleString('id-ID')} koin\n\n`
    }

    const jumlah = Math.max(1, Math.round((1 + Math.floor(Math.random() * 3)) * s.luck))
    const item = pickRandom(l.loot)
    addItem(K(m), item, jumlah)
    r.gathered = (r.gathered || 0) + jumlah
    const koin = Math.round((l.koin[0] + Math.random() * (l.koin[1] - l.koin[0])) * s.luck)
    const exp = Math.round((l.exp[0] + Math.random() * (l.exp[1] - l.exp[0])) * (1 + (s.luck - 1) / 2))
    r.money += koin
    r.stat.jelajah = r.stat.jelajah || {}
    r.stat.jelajah[l.id] = (r.stat.jelajah[l.id] || 0) + 1
    catatHarian(r, 'jelajah')
    const lv = addExp(K(m), exp)
    petExp(r, 40)
    catat(r, `Jelajah ${l.nama}: +${jumlah} ${ITEMS[item]?.name}`)
    simpan()

    const buf = await kartu(m, {
      judul: `${l.icon} ${l.nama.toUpperCase()}`,
      sub: `+${jumlah} ${ITEMS[item]?.icon} ${ITEMS[item]?.name} · +${koin.toLocaleString('id-ID')} koin`,
      footer: `+${exp} EXP · ⚡ sisa ${r.energy} · ❤️ ${r.health}`,
      tema: l.id === 'kastil' ? 'crimson' : l.id === 'gurun' ? 'gold' : l.id === 'gunung' ? 'sunset' : 'forest',
      kataBg: l.bg
    })
    return kirimKartu(m, buf, `${l.icon} *JELAJAH ${l.nama.toUpperCase()}*\n\n${teksKejadian}Kamu menemukan:\n▸ ${jumlah}× ${ITEMS[item]?.icon} ${ITEMS[item]?.name}\n▸ 💰 ${koin.toLocaleString('id-ID')} koin\n▸ ✨ ${exp} EXP${r.pet ? `\n▸ 🐾 +40 EXP pet` : ''}\n${lv.leveledUp ? `\n🎉 *LEVEL UP → ${lv.level}!* HP & energi pulih penuh.` : ''}\n\nSisa: ⚡ ${r.energy}/${r.maxEnergy} · ❤️ ${r.health}/${r.maxHealth} · 💰 ${r.money.toLocaleString('id-ID')}\n\nJelajah lagi: ${P}jelajah ${l.id}\nJual hasil: ${P}pasarjual\nMisi: ${P}misistatus`, {
      title: `${l.icon} ${l.nama}`,
      buttons: [{ text: '🚶 Jelajah Lagi', id: `${P}jelajah ${l.id}` }, { text: '💰 Jual Hasil', id: `${P}pasarjual` }, { text: '🗺️ Peta', id: `${P}peta` }]
    })
  }, 'hutan'),

  rpg('lokasiinfo', ['infolokasi', 'detaillokasi'], 'Detail satu lokasi: .lokasiinfo <id>', m => {
    const r = siapkan(R(K(m)))
    const id = (m.args[0] || '').toLowerCase()
    const l = LOKASI.find(x => x.id === id)
    if (!l) return m.reply(`Contoh: ${P}lokasiinfo gunung\n\nLokasi: ${LOKASI.map(x => x.id).join(', ')}`)
    const nilai = l.loot.map(x => ITEMS[x]?.sell || 0)
    return m.reply(`${l.icon} *${l.nama.toUpperCase()}*\n\nSyarat : Level ${l.minLevel}+ ${r.level >= l.minLevel ? '✅ (kamu bisa masuk)' : '🔒'}\nEnergi : ⚡ ${l.energi} per jelajah\nKoin   : ${l.koin[0]}-${l.koin[1]} (dikalikan 🍀 luck ${statistik(r).luck.toFixed(2)}×)\nEXP    : ${l.exp[0]}-${l.exp[1]}\n\n*Loot yang mungkin:*\n${l.loot.map(x => `▸ ${ITEMS[x]?.icon} ${ITEMS[x]?.name} — jual ${ITEMS[x]?.sell} koin`).join('\n')}\nRata-rata nilai loot: 💰 ${Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length)}\n\n*Kamu sudah jelajah:* ${r.stat.jelajah?.[l.id] || 0}×\n\nMasuk: ${P}jelajah ${l.id}`)
  }, 'gunung')
]

/* ================================================================== */
/*  J. PRESTASI & GELAR (4)                                            */
/* ================================================================== */
export const rpgPrestasiCmds = [
  rpg('pencapaian', ['achievement', 'prestasi'], 'Daftar prestasi & progresnya', async m => {
    const r = siapkan(R(K(m)))
    const buf = await kartu(m, { judul: '🎖️ PRESTASI', sub: `${r.prestasi.klaim.length}/${PRESTASI.length} terklaim`, footer: r.prestasi.gelar ? `Gelar aktif: ${r.prestasi.gelar}` : 'Klaim hadiah untuk membuka gelar', tema: 'gold', kataBg: 'trophy,medal' })
    const teks = `*🎖️ PRESTASI (${r.prestasi.klaim.length}/${PRESTASI.length})*\n\n${PRESTASI.map(p => {
      const selesai = p.cek(r)
      const klaim = r.prestasi.klaim.includes(p.id)
      return `${klaim ? '✅' : selesai ? '🎁' : '⬜'} ${p.icon} *${p.nama}*\n   ${p.teks}\n   Hadiah: 💰 ${p.hadiah.koin.toLocaleString('id-ID')} + ✨ ${p.hadiah.exp}${p.hadiah.item ? ` + ${ITEMS[p.hadiah.item]?.icon} ${ITEMS[p.hadiah.item]?.name}` : ''}${klaim ? ' — *terklaim*' : selesai ? ` — **${P}klaimpencapaian ${p.id}**` : ''}`
    }).join('\n\n')}\n\nKlaim semua yang siap: ${P}klaimpencapaian semua\nGelar: ${P}gelar`
    return kirimKartu(m, buf, teks)
  }),

  rpg('klaimpencapaian', ['klaimprestasi', 'claimachievement'], 'Klaim hadiah prestasi', m => {
    const r = siapkan(R(K(m)))
    const arg = String(m.args[0] || '').toLowerCase()
    const semua = ['semua', 'all', '-'].includes(arg)
    const dipilih = semua ? PRESTASI : PRESTASI.filter(p => p.id === arg)
    if (!dipilih.length) return m.reply(`Contoh: ${P}klaimpencapaian pemburu\natau ${P}klaimpencapaian semua\n\nLihat: ${P}pencapaian`)
    let koin = 0, exp = 0, items = [], n = 0
    for (const p of dipilih) {
      if (r.prestasi.klaim.includes(p.id)) continue
      if (!p.cek(r)) continue
      r.prestasi.klaim.push(p.id)
      koin += p.hadiah.koin
      exp += p.hadiah.exp
      if (p.hadiah.item) { addItem(K(m), p.hadiah.item, 1); items.push(p.hadiah.item) }
      n++
    }
    if (!n) return m.reply('ℹ️ Tidak ada prestasi baru yang siap diklaim.\n\nLihat progres: ' + P + 'pencapaian')
    r.money += koin
    addExp(K(m), exp)
    catat(r, `Klaim ${n} prestasi (+${koin} koin)`)
    simpan()
    return m.reply(`🎖️ *${n} PRESTASI DIKLAIM*\n\n💰 +${koin.toLocaleString('id-ID')} koin\n✨ +${exp} EXP\n${items.length ? `🎁 Item: ${items.map(x => ITEMS[x]?.icon + ' ' + ITEMS[x]?.name).join(', ')}\n` : ''}\nTotal prestasi: ${r.prestasi.klaim.length}/${PRESTASI.length}\n🍀 Luck naik +${(n * 0.01).toFixed(2)} (tiap prestasi = +1% loot)\n\nGelar baru: ${P}gelar`)
  }, 'semua'),

  rpg('gelar', ['title rpg'.replace(' ', ''), 'daftargelar'], 'Daftar gelar yang bisa dipakai', m => {
    const r = siapkan(R(K(m)))
    const terbuka = PRESTASI.filter(p => r.prestasi.klaim.includes(p.id))
    const daftarGelar = [
      { id: 'Petualang', syarat: 1 }, { id: 'Pemburu', syarat: 2 }, { id: 'Penjelajah', syarat: 4 },
      { id: 'Pandai Besi', syarat: 6 }, { id: 'Penakluk Dungeon', syarat: 8 }, { id: 'Juara Arena', syarat: 10 },
      { id: 'Sahabat Pet', syarat: 12 }, { id: 'Legenda therYHNN', syarat: PRESTASI.length }
    ]
    return m.reply(`👑 *GELAR*\n\nGelar aktif: *${r.prestasi.gelar || '(tidak ada)'}*\nPrestasi terklaim: ${terbuka.length}/${PRESTASI.length}\n\n*Gelar tersedia:*\n${daftarGelar.map(g => `${terbuka.length >= g.syarat ? '✅' : '🔒'} ${g.id} — butuh ${g.syarat} prestasi`).join('\n')}\n\nPasang: ${P}setgelar Petualang\nGelar muncul di: ${P}rpgkartu · arena · leaderboard`)
  }),

  rpg('setgelar', ['pasanggelar', 'pakai gelar'.replace(' ', '')], 'Pasang gelar: .setgelar <nama gelar>', m => {
    const r = siapkan(R(K(m)))
    const q = m.q.trim()
    if (!q) return m.reply(`Contoh: ${P}setgelar Pemburu\n\nDaftar gelar: ${P}gelar\nHapus gelar: ${P}setgelar off`)
    if (['off', 'hapus', 'none', '-'].includes(q.toLowerCase())) {
      r.prestasi.gelar = ''
      simpan()
      return m.reply('✅ Gelar dilepas.')
    }
    const jumlah = r.prestasi.klaim.length
    const daftarGelar = [
      ['Petualang', 1], ['Pemburu', 2], ['Penjelajah', 4], ['Pandai Besi', 6],
      ['Penakluk Dungeon', 8], ['Juara Arena', 10], ['Sahabat Pet', 12], ['Legenda therYHNN', PRESTASI.length]
    ]
    const cocok = daftarGelar.find(([nama]) => nama.toLowerCase() === q.toLowerCase())
    if (!cocok) return m.reply(`❌ Gelar "${q}" tidak dikenal.\n\nTersedia: ${daftarGelar.map(([n]) => n).join(', ')}`)
    if (jumlah < cocok[1]) return m.reply(`🔒 Gelar *${cocok[0]}* butuh ${cocok[1]} prestasi (kamu ${jumlah}).\n\nKlaim: ${P}klaimpencapaian semua`)
    r.prestasi.gelar = cocok[0]
    simpan()
    return m.reply(`👑 Gelar dipasang: *${cocok[0]}*\n\nTampil di ${P}rpgkartu, duel arena, dan leaderboard.\nLihat kartu: ${P}rpgkartu`)
  }, 'Petualang')
]

/* ================================================================== */
/*  K. TOKO & PASAR (5)                                                */
/* ================================================================== */
export const rpgTokoCmds = [
  rpg('tokopet', ['petshop', 'tokohewan'], 'Toko pet: telur, makanan', async m => {
    const r = siapkan(R(K(m)))
    const barang = ['telurpet', 'makananpet']
    const buf = await kartu(m, { judul: '🏪 TOKO PET', sub: `💰 ${r.money.toLocaleString('id-ID')} koin`, footer: 'Telur menetas jadi pet acak', tema: 'sakura', kataBg: 'pet,shop' })
    return kirimKartu(m, buf, `*🏪 TOKO PET*\n\nSaldo: 💰 ${r.money.toLocaleString('id-ID')}\n\n${barang.map(b => `▸ ${ITEMS[b].icon} *${ITEMS[b].name}* — ${ITEMS[b].buy.toLocaleString('id-ID')} koin\n   Beli: ${P}toko ${b}\n   Jual: ${ITEMS[b].sell.toLocaleString('id-ID')} koin`).join('\n')}\n\n*Pet kamu:* ${r.pet ? `${r.pet.icon} ${r.pet.nama} (${r.pet.raritas} Lv.${r.pet.level})` : 'belum ada'}\n*Telur di tas:* ${r.inventory.telurpet || 0}${r.telurSiap ? ` (menetas ${new Date(r.telurSiap).toLocaleTimeString('id-ID')})` : ''}\n\nSpesies & bonus: ${P}petguide\nTetaskan: ${P}tetaskan`, {
      title: '🏪 TOKO PET',
      buttons: [{ text: '🥚 Beli Telur', id: `${P}toko telurpet` }, { text: '🍖 Beli Makanan', id: `${P}toko makananpet` }, { text: '📚 Spesies', id: `${P}petguide` }]
    })
  }),

  rpg('tokoalat', ['blacksmith', 'tokosenjata'], 'Toko alat & senjata tingkat tinggi', async m => {
    const r = siapkan(R(K(m)))
    const barang = ['pedangemas', 'armoremas', 'armorbesi', 'kapakemas', 'pickaxeemas', 'pancingemas']
    const buf = await kartu(m, { judul: '⚒️ PANDAI BESI', sub: `💰 ${r.money.toLocaleString('id-ID')} koin`, footer: 'Bisa juga di-craft lebih murah: ' + P + 'resep', tema: 'crimson', kataBg: 'blacksmith,forge' })
    return kirimKartu(m, buf, `*⚒️ PANDAI BESI*\n\nSaldo: 💰 ${r.money.toLocaleString('id-ID')}\n\n${barang.map(b => {
      const punya = r.inventory[b] || 0
      const lv = r.forge?.[b] || 0
      return `▸ ${ITEMS[b].icon} *${ITEMS[b].name}* — ${ITEMS[b].buy.toLocaleString('id-ID')} koin\n   Bonus ${Math.round((ITEMS[b].bonus || 0) * 100)}%${punya ? ` · punya ${punya}${lv ? ` (+${lv})` : ''}` : ''} · ${P}toko ${b}`
    }).join('\n')}\n\n*Lebih hemat:* craft sendiri (${P}resep)\n▸ pedangemas = 6⛓️ + 2🥇 + 1💎\n▸ armorbesi = 8⛓️ + 4🟤 + 1🥇\n\nSetelah punya, pasang: ${P}equip <item>\nPerkuat: ${P}tempa`, {
      title: '⚒️ PANDAI BESI',
      buttons: [{ text: '📜 Resep Craft', id: `${P}resep` }, { text: '⚔️ Tempa', id: `${P}tempa` }, { text: '📊 Stat', id: `${P}rpgstat` }]
    })
  }),

  rpg('tokoramuan', ['apotek', 'tokoobat'], 'Toko ramuan & makanan pemulihan', async m => {
    const r = siapkan(R(K(m)))
    const barang = [
      ['ramuan', 'Pulihkan 60 HP'], ['ramuanbesar', 'Pulihkan 150 HP'],
      ['roti', 'Pulihkan 40 energi'], ['kue', 'Pulihkan 80 energi'],
      ['makananpet', '+80 EXP pet']
    ]
    const buf = await kartu(m, { judul: '🧪 APOTEK', sub: `❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy}`, footer: `💰 ${r.money.toLocaleString('id-ID')} koin`, tema: 'sakura', kataBg: 'potion,alchemy' })
    return kirimKartu(m, buf, `*🧪 APOTEK & TOKO MAKANAN*\n\nStatus: ❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy}\nSaldo : 💰 ${r.money.toLocaleString('id-ID')}\n\n${barang.map(([b, ket]) => `▸ ${ITEMS[b].icon} *${ITEMS[b].name}* — ${ITEMS[b].buy.toLocaleString('id-ID')} koin\n   ${ket} · punya ${r.inventory[b] || 0} · ${P}toko ${b}`).join('\n')}\n\n*Pakai:* ${P}heal (ramuan) · ${P}makan (roti)\n*Bikin sendiri (lebih murah):* ${P}craft ramuanbesar / ${P}craft kue\n\nBahan craft dari kebun: ${P}tanam → ${P}panen`, {
      title: '🧪 APOTEK',
      buttons: [{ text: '🧪 Beli Ramuan', id: `${P}toko ramuan` }, { text: '🍰 Beli Kue', id: `${P}toko kue` }, { text: '🔨 Craft', id: `${P}resep` }]
    })
  }),

  rpg('pasarjual', ['jualsemua', 'jualmassal'], 'Jual semua resource makanan/tambang sekaligus', m => {
    const r = siapkan(R(K(m)))
    const bisa = ['kayu', 'batu', 'besi', 'emas', 'berlian', 'ikan', 'daging', 'kulit', 'gading', 'sayur', 'buah', 'gandum', 'sisik']
    const stok = bisa.filter(k => (r.inventory[k] || 0) > 0)
    if (!stok.length) return m.reply(`🎒 Tidak ada resource untuk dijual.\n\nIsi tas: ${P}jelajah · ${P}menambang · ${P}berburu · ${P}panen\nLihat tas: ${P}inv`)
    if (String(m.args[0]).toLowerCase() !== 'ya') {
      const total = stok.reduce((a, k) => a + (ITEMS[k].sell * (r.inventory[k] || 0)), 0)
      return m.reply(`💰 *JUAL SEMUA RESOURCE*\n\n${stok.map(k => `▸ ${ITEMS[k].icon} ${ITEMS[k].name} ×${r.inventory[k]} = ${(ITEMS[k].sell * r.inventory[k]).toLocaleString('id-ID')}`).join('\n')}\n\n*Total: ${total.toLocaleString('id-ID')} koin*\n\nKonfirmasi: ${P}pasarjual ya\n\n⚠️ Jangan jual bahan yang masih dibutuhkan untuk ${P}resep (besi, kayu, emas, sayur, gandum).`)
    }
    // sisakan bahan craft penting kalau user tidak minta jual total
    let total = 0, detail = []
    for (const k of stok) {
      const qty = r.inventory[k] || 0
      total += ITEMS[k].sell * qty
      detail.push(`${ITEMS[k].icon} ${qty}× ${ITEMS[k].name}`)
      takeItem(K(m), k, qty)
    }
    r.money += total
    catatHarian(r, 'jual', detail.length)
    catat(r, `Jual semua resource (+${total} koin)`)
    simpan()
    return m.reply(`💰 *TERJUAL SEMUA*\n\n${detail.join(', ')}\n\n+${total.toLocaleString('id-ID')} koin\nSaldo: 💰 ${r.money.toLocaleString('id-ID')}\n\nBelanja: ${P}tokoalat · ${P}tokopet · ${P}tokoramuan\nBank: ${P}bank semua`)
  }, 'ya'),

  rpg('tokokartu', ['kartutoko', 'shopcard'], 'Kartu gambar ringkasan semua toko', async m => {
    const r = siapkan(R(K(m)))
    const buf = await kartu(m, { judul: '🏪 PASAR RPG', sub: `💰 ${r.money.toLocaleString('id-ID')} koin · 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')}`, footer: 'Pet · Pandai Besi · Apotek · Kunci Dungeon', tema: 'sunset', kataBg: 'market,fantasy' })
    return kirimKartu(m, buf, `*🏪 PASAR RPG*\n\n💰 Koin: ${r.money.toLocaleString('id-ID')}\n🏦 Bank: ${(r.bank.saldo || 0).toLocaleString('id-ID')}\n\n*Toko tersedia:*\n▸ 🏪 ${P}toko — semua item dasar\n▸ 🐾 ${P}tokopet — telur & makanan pet\n▸ ⚒️ ${P}tokoalat — senjata/armor emas\n▸ 🧪 ${P}tokoramuan — HP & energi\n▸ 🗝️ Kunci dungeon — ${P}toko kuncidungeon\n\n*Jual:*\n▸ ${P}jual <item> <jumlah>\n▸ ${P}pasarjual — jual semua resource\n\n💡 Harga craft lebih murah daripada beli: ${P}resep`)
  })
]

/* ================================================================== */
/*  L. KARTU TAMBAHAN (2)                                              */
/* ================================================================== */
export const rpgKartuCmds = [
  rpg('invkartu', ['kartuinv', 'kartutas'], 'Kartu gambar inventory + nilai total', async m => {
    const r = siapkan(R(K(m)))
    const list = inventoryList(K(m))
    const nilai = list.reduce((a, x) => a + (x.sell || 0) * x.qty, 0)
    const buf = await kartu(m, {
      judul: '🎒 INVENTORY',
      sub: `${list.length} jenis item · 💰 ${nilai.toLocaleString('id-ID')} nilai jual`,
      footer: `💰 ${r.money.toLocaleString('id-ID')} koin · 🏦 ${(r.bank.saldo || 0).toLocaleString('id-ID')}`,
      tema: 'midnight',
      kataBg: 'backpack,items'
    })
    const cap = `*🎒 INVENTORY*\n\n${list.length ? list.sort((a, b) => (b.sell * b.qty) - (a.sell * a.qty)).map(x => `▸ ${x.icon} ${x.name} ×${x.qty} — 💰 ${((x.sell || 0) * x.qty).toLocaleString('id-ID')}`).join('\n') : '(kosong — cari: ' + P + 'jelajah)'}\n\n*Nilai total: ${nilai.toLocaleString('id-ID')} koin*\n\n*Terpasang:*\n▸ 🗡️ ${r.equipped?.weapon ? `${ITEMS[r.equipped.weapon].name} +${r.forge?.[r.equipped.weapon] || 0}` : '-'}\n▸ 🛡️ ${r.equipped?.armor ? `${ITEMS[r.equipped.armor].name} +${r.forge?.[r.equipped.armor] || 0}` : '-'}\n▸ 🔧 ${r.equipped?.tool ? `${ITEMS[r.equipped.tool].name} +${r.forge?.[r.equipped.tool] || 0}` : '-'}\n\nJual semua resource: ${P}pasarjual\nCraft: ${P}resep`
    return kirimKartu(m, buf, cap, {
      title: '🎒 INVENTORY',
      buttons: [{ text: '💰 Jual Semua', id: `${P}pasarjual` }, { text: '📜 Resep', id: `${P}resep` }, { text: '🏪 Toko', id: `${P}toko` }]
    })
  }),

  rpg('misikartu', ['kartumisi', 'questcard'], 'Kartu gambar misi harian', async m => {
    const r = siapkan(R(K(m)))
    const misi = pastikanMisi(r)
    const selesai = misi.list.filter(x => x.klaim).length
    const buf = await kartu(m, {
      judul: '🎯 MISI HARIAN',
      sub: `${selesai}/${misi.list.length} selesai · ${HARI()}`,
      footer: misi.list.map(x => `${progresMisi(r, x) >= x.target ? '✅' : '⬜'} ${x.teks}`).join(' · '),
      tema: 'sunset',
      kataBg: 'quest,adventure'
    })
    return kirimKartu(m, buf, `*🎯 MISI HARIAN*\n\n${misi.list.map(x => {
      const p = progresMisi(r, x)
      return `${x.klaim ? '✅' : p >= x.target ? '🎁' : '⬜'} ${x.teks} — ${Math.min(p, x.target)}/${x.target}\n   💰 ${x.koin.toLocaleString('id-ID')} + ✨ ${x.exp} EXP`
    }).join('\n')}\n\n${selesai === misi.list.length ? '🏆 Semua selesai!' : `Klaim: ${P}misiklaim semua`}\n\nCara cepat: ${P}jelajah · ${P}berburu · ${P}battle · ${P}panen`)
  })
]

export const rpglabCmds = [
  ...rpgMenuCmds, ...rpgPetCmds, ...rpgFarmCmds, ...rpgDungeonCmds,
  ...rpgMisiCmds, ...rpgCraftCmds, ...rpgArenaCmds, ...rpgBankCmds,
  ...rpgLokasiCmds, ...rpgPrestasiCmds, ...rpgTokoCmds, ...rpgKartuCmds
]

export default { rpglabCmds }
