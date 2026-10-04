/**
 * ============================================================
 *  RPG ENGINE — THERYHANN!
 *  Level, EXP, HP, Energy, Uang, Inventory, Shop, Battle
 *  Semua data disimpan di database/users.json (per user)
 * ============================================================
 */
import { getUser, saveDB } from './database.js'
import { config } from '../config.js'

const P = config.display?.prefix || '.'
import { pickRandom, formatDuration } from './functions.js'

/* ------------------------- KONSTANTA GAME ------------------------- */
export const ITEMS = {
  // hasil mengumpulkan
  kayu:     { name: 'Kayu',      icon: '🪵', sell: 50,   type: 'resource' },
  batu:     { name: 'Batu',      icon: '🪨', sell: 90,   type: 'resource' },
  besi:     { name: 'Besi',      icon: '⛓️', sell: 220,  type: 'resource' },
  emas:     { name: 'Emas',      icon: '🥇', sell: 600,  type: 'resource' },
  berlian:  { name: 'Berlian',   icon: '💎', sell: 1800, type: 'resource' },
  ikan:     { name: 'Ikan',      icon: '🐟', sell: 130,  type: 'food' },
  daging:   { name: 'Daging',    icon: '🥩', sell: 170,  type: 'food' },
  kulit:    { name: 'Kulit',     icon: '🟤', sell: 110,  type: 'resource' },
  gading:   { name: 'Gading',    icon: '🦷', sell: 900,  type: 'resource' },
  // barang beli
  ramuan:   { name: 'Ramuan',    icon: '🧪', buy: 500,   sell: 200,  type: 'consumable' },
  roti:     { name: 'Roti',      icon: '🍞', buy: 250,   sell: 100,  type: 'consumable' },
  pedang:   { name: 'Pedang',    icon: '🗡️', buy: 2500,  sell: 900,  type: 'weapon' },
  kapak:    { name: 'Kapak',     icon: '🪓', buy: 1500,  sell: 550,  type: 'tool' },
  pickaxe:  { name: 'Pickaxe',   icon: '⛏️', buy: 1800,  sell: 650,  type: 'tool' },
  pancing:  { name: 'Pancing',   icon: '🎣', buy: 1200,  sell: 450,  type: 'tool' },
  armor:    { name: 'Armor',     icon: '🛡️', buy: 4000,  sell: 1500, type: 'armor' }
}

export const MONSTERS = [
  { name: 'Slime',        icon: '🟢', hp: 30,  exp: 25,  money: 120,  minLevel: 1 },
  { name: 'Goblin',       icon: '👺', hp: 55,  exp: 45,  money: 260,  minLevel: 2 },
  { name: 'Serigala',     icon: '🐺', hp: 80,  exp: 70,  money: 420,  minLevel: 3 },
  { name: 'Orc',          icon: '👹', hp: 120, exp: 110, money: 700,  minLevel: 5 },
  { name: 'Naga Muda',    icon: '🐉', hp: 200, exp: 220, money: 1500, minLevel: 8 },
  { name: 'Raja Iblis',   icon: '😈', hp: 350, exp: 450, money: 3200, minLevel: 12 }
]

const REGEN_ENERGY_MS = 2 * 60 * 1000 // 1 energy / 2 menit
const REGEN_HP_MS = 4 * 60 * 1000 // 1 HP / 4 menit

/* ------------------------- PROFIL ------------------------- */

/** ambil / inisialisasi data RPG user (dengan regen otomatis) */
export function getRPG (jid) {
  const u = getUser(jid)
  if (!u.rpg) {
    u.rpg = {
      level: 1,
      exp: 0,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      money: 500,
      inventory: {},
      equipped: { weapon: null, armor: null, tool: null },
      kills: 0,
      gathered: 0,
      lastHunt: 0,
      lastMine: 0,
      lastFish: 0,
      lastChop: 0,
      lastWork: 0,
      lastBattle: 0,
      lastRegen: Date.now(),
      created: Date.now()
    }
    saveDB('users')
  }
  applyRegen(u.rpg)
  return u.rpg
}

/** regenerasi energy & HP berdasarkan waktu yang berlalu */
function applyRegen (rpg) {
  const now = Date.now()
  const last = rpg.lastRegen || now
  const elapsed = Math.max(0, now - last)
  if (elapsed < 1000) return

  const eGain = Math.floor(elapsed / REGEN_ENERGY_MS)
  const hGain = Math.floor(elapsed / REGEN_HP_MS)
  if (eGain > 0 && rpg.energy < rpg.maxEnergy) {
    rpg.energy = Math.min(rpg.maxEnergy, rpg.energy + eGain)
  }
  if (hGain > 0 && rpg.health < rpg.maxHealth) {
    rpg.health = Math.min(rpg.maxHealth, rpg.health + hGain)
  }
  if (eGain > 0 || hGain > 0) {
    rpg.lastRegen = now
    saveDB('users')
  }
}

export function expNeeded (level) {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/** tambah EXP, otomatis level up. Return { leveledUp, newLevel } */
export function addExp (jid, amount) {
  const u = getUser(jid)
  const rpg = getRPG(jid)
  rpg.exp += Math.max(0, Math.floor(amount))
  const dariLevel = rpg.level
  let leveledUp = false
  while (rpg.exp >= expNeeded(rpg.level)) {
    rpg.exp -= expNeeded(rpg.level)
    rpg.level++
    rpg.maxHealth += 15
    rpg.maxEnergy += 5
    rpg.health = rpg.maxHealth
    rpg.energy = rpg.maxEnergy
    leveledUp = true
  }
  saveDB('users')
  void u
  /* v7.29.0 — auto naik level: hadiah uang + kartu HTML ucapan selamat ke chat terakhir user */
  if (leveledUp) {
    const dari = rpg.level - 1 /* perkiraan; hadiah dihitung dari level baru */
    const hadiah = rpg.level * 250
    rpg.money = (rpg.money || 0) + hadiah
    saveDB('users')
    try { if (onLevelUp) Promise.resolve(onLevelUp({ jid, dari: dariLevel ?? dari, ke: rpg.level, hadiah, exp: rpg.exp, butuh: expNeeded(rpg.level) })).catch(() => {}) } catch {}
  }
  return { leveledUp, level: rpg.level, newLevel: rpg.level }
}
let onLevelUp = null
/** dipanggil handlers/message.js untuk mengirim kartu naik level */
export function setOnLevelUp (fn) { onLevelUp = fn }

export function addMoney (jid, amount) {
  const rpg = getRPG(jid)
  rpg.money = Math.max(0, rpg.money + Math.floor(amount))
  saveDB('users')
  return rpg.money
}

export function addItem (jid, item, qty = 1) {
  const rpg = getRPG(jid)
  if (!ITEMS[item]) throw new Error('Item tidak dikenal: ' + item)
  rpg.inventory[item] = (rpg.inventory[item] || 0) + qty
  saveDB('users')
  return rpg.inventory[item]
}

export function takeItem (jid, item, qty = 1) {
  const rpg = getRPG(jid)
  const have = rpg.inventory[item] || 0
  if (have < qty) return false
  rpg.inventory[item] = have - qty
  if (rpg.inventory[item] <= 0) delete rpg.inventory[item]
  saveDB('users')
  return true
}

export function hasItem (jid, item) {
  const rpg = getRPG(jid)
  return (rpg.inventory[item] || 0) > 0
}

export function damage (jid, amount) {
  const rpg = getRPG(jid)
  rpg.health = Math.max(0, rpg.health - Math.max(0, Math.floor(amount)))
  saveDB('users')
  return rpg.health
}

export function heal (jid, amount) {
  const rpg = getRPG(jid)
  rpg.health = Math.min(rpg.maxHealth, rpg.health + Math.max(0, Math.floor(amount)))
  saveDB('users')
  return rpg.health
}

export function useEnergy (jid, amount) {
  const rpg = getRPG(jid)
  if (rpg.energy < amount) return false
  rpg.energy -= amount
  saveDB('users')
  return true
}

/** bonus dari peralatan yang dipakai */
/** bonus peralatan: nilai bawaan / field .bonus pada item + tiap level tempa (+4%) */
export function equipBonus (jid, slot) {
  const rpg = getRPG(jid)
  const item = rpg.equipped?.[slot]
  if (!item || !hasItem(jid, item)) return 0
  const bawaan = { pedang: 0.35, kapak: 0.3, pickaxe: 0.3, pancing: 0.3, armor: 0.25 }[item]
  const custom = ITEMS[item]?.bonus
  const dasar = custom !== undefined ? custom : (bawaan || 0)
  const tempa = (rpg.forge?.[item] || 0) * 0.04
  return dasar + tempa
}

/**
 * Pencatat aktivitas harian (dipakai sistem misi harian di features/rpglab.js)
 * jenis: hunt | mine | fish | chop | battle | win | dungeon | harvest | craft | jelajah
 */
export function catatHarian (rpg, jenis, jumlah = 1) {
  const hari = new Date().toISOString().slice(0, 10)
  if (!rpg.harian || rpg.harian.tanggal !== hari) {
    rpg.harian = { tanggal: hari }
  }
  rpg.harian[jenis] = (rpg.harian[jenis] || 0) + jumlah
  return rpg.harian
}

export function equip (jid, item) {
  const rpg = getRPG(jid)
  if (!ITEMS[item]) throw new Error('Item tidak dikenal')
  if (!hasItem(jid, item)) throw new Error(`Kamu tidak punya ${ITEMS[item].name}`)
  const type = ITEMS[item].type
  const slot = type === 'weapon' ? 'weapon' : type === 'armor' ? 'armor' : type === 'tool' ? 'tool' : null
  if (!slot) throw new Error('Item itu tidak bisa di-equip')
  rpg.equipped[slot] = item
  saveDB('users')
  return slot
}

export function unequip (jid, slot) {
  const rpg = getRPG(jid)
  rpg.equipped[slot] = null
  saveDB('users')
}

/* ------------------------- AKTIVITAS ------------------------- */

function roll (table, luck = 1) {
  const total = table.reduce((a, b) => a + b.chance * (b.item === 'bonus' ? luck : 1), 0)
  let r = Math.random() * total
  for (const row of table) {
    r -= row.chance * (row.item === 'bonus' ? luck : 1)
    if (r <= 0) return row
  }
  return table[table.length - 1]
}

const HUNT_TABLE = [
  { item: 'daging', chance: 34, min: 1, max: 3, exp: 22, money: 60 },
  { item: 'kulit', chance: 26, min: 1, max: 2, exp: 18, money: 45 },
  { item: 'gading', chance: 9, min: 1, max: 1, exp: 55, money: 220 },
  { item: 'nothing', chance: 22, exp: 6, money: 0 },
  { item: 'hurt', chance: 9, dmg: 18, exp: 8, money: 0 }
]

const MINE_TABLE = [
  { item: 'batu', chance: 33, min: 1, max: 3, exp: 20, money: 55 },
  { item: 'besi', chance: 22, min: 1, max: 2, exp: 32, money: 110 },
  { item: 'emas', chance: 9, min: 1, max: 1, exp: 60, money: 260 },
  { item: 'berlian', chance: 3, min: 1, max: 1, exp: 120, money: 600 },
  { item: 'nothing', chance: 24, exp: 6, money: 0 },
  { item: 'hurt', chance: 9, dmg: 15, exp: 8, money: 0 }
]

const FISH_TABLE = [
  { item: 'ikan', chance: 52, min: 1, max: 3, exp: 18, money: 55 },
  { item: 'nothing', chance: 34, exp: 5, money: 0 },
  { item: 'bonus', chance: 6, exp: 40, money: 200 },
  { item: 'hurt', chance: 8, dmg: 8, exp: 5, money: 0 }
]

const CHOP_TABLE = [
  { item: 'kayu', chance: 62, min: 2, max: 5, exp: 16, money: 45 },
  { item: 'nothing', chance: 30, exp: 5, money: 0 },
  { item: 'hurt', chance: 8, dmg: 10, exp: 6, money: 0 }
]

/**
 * Jalankan aktivitas mengumpulkan (berburu/menambang/memancing/menebang)
 * @returns {object} hasil
 */
export function doActivity (jid, kind) {
  const rpg = getRPG(jid)
  const cfg = {
    hunt:  { key: 'lastHunt',  cost: 20, table: HUNT_TABLE, tool: 'pedang',  cd: 60000,  label: 'Berburu' },
    mine:  { key: 'lastMine',  cost: 18, table: MINE_TABLE, tool: 'pickaxe', cd: 60000,  label: 'Menambang' },
    fish:  { key: 'lastFish',  cost: 12, table: FISH_TABLE, tool: 'pancing', cd: 45000,  label: 'Memancing' },
    chop:  { key: 'lastChop',  cost: 10, table: CHOP_TABLE, tool: 'kapak',   cd: 40000,  label: 'Menebang' }
  }[kind]
  if (!cfg) throw new Error('Aktivitas tidak dikenal')

  // cooldown
  const wait = (rpg[cfg.key] || 0) + cfg.cd - Date.now()
  if (wait > 0) return { ok: false, reason: 'cooldown', wait }

  if (rpg.health <= 0) return { ok: false, reason: 'dead' }
  if (rpg.energy < cfg.cost) return { ok: false, reason: 'energy', need: cfg.cost, have: rpg.energy }

  rpg.energy -= cfg.cost
  rpg[cfg.key] = Date.now()

  const bonus = 1 + equipBonus(jid, cfg.tool) + (rpg.level - 1) * 0.03
  const hit = roll(cfg.table, bonus)
  const result = { ok: true, label: cfg.label, energyUsed: cfg.cost, drops: [] }

  if (hit.item === 'nothing') {
    result.text = pickRandom([
      'Kosong... gak dapet apa-apa 😮‍💨',
      'Waduh, malah kabur semua 💨',
      'Nihil. Coba lagi ya!',
      'Belum rejeki kali ini 🥲'
    ])
  } else if (hit.item === 'hurt') {
    const dmg = Math.max(1, Math.round(hit.dmg * (1 - equipBonus(jid, 'armor'))))
    rpg.health = Math.max(0, rpg.health - dmg)
    result.hurt = dmg
    result.text = `Aduh! Kamu kena serangan dan kehilangan *${dmg} HP* 🩸`
  } else if (hit.item === 'bonus') {
    const money = Math.round((hit.money || 200) * bonus)
    rpg.money += money
    result.money = money
    result.text = `✨ JACKPOT! Nemu harta karun *${money} koin* 💰`
  } else {
    const qty = Math.max(1, Math.round((hit.min + Math.floor(Math.random() * (hit.max - hit.min + 1))) * bonus))
    rpg.inventory[hit.item] = (rpg.inventory[hit.item] || 0) + qty
    rpg.gathered = (rpg.gathered || 0) + qty
    result.drops.push({ item: hit.item, qty })
    result.text = `Dapat *${qty}x ${ITEMS[hit.item].icon} ${ITEMS[hit.item].name}*!`
  }

  const money = Math.round((hit.money || 0) * bonus)
  if (money && hit.item !== 'bonus') {
    rpg.money += money
    result.money = money
  }
  const exp = Math.round((hit.exp || 0) * bonus)
  if (exp) {
    rpg.exp += exp
    result.exp = exp
  }

  // level up check
  let leveled = false
  while (rpg.exp >= expNeeded(rpg.level)) {
    rpg.exp -= expNeeded(rpg.level)
    rpg.level++
    rpg.maxHealth += 15
    rpg.maxEnergy += 5
    rpg.health = rpg.maxHealth
    rpg.energy = rpg.maxEnergy
    leveled = true
  }
  result.leveledUp = leveled
  result.newLevel = rpg.level
  result.health = rpg.health
  result.energy = rpg.energy

  catatHarian(rpg, kind)
  saveDB('users')
  return result
}

/* ------------------------- BATTLE ------------------------- */
export function battle (jid, monsterIndex) {
  const rpg = getRPG(jid)
  const wait = (rpg.lastBattle || 0) + 90000 - Date.now()
  if (wait > 0) return { ok: false, reason: 'cooldown', wait }
  if (rpg.health <= 0) return { ok: false, reason: 'dead' }
  if (rpg.energy < 25) return { ok: false, reason: 'energy', need: 25, have: rpg.energy }

  const list = MONSTERS.filter(x => x.minLevel <= rpg.level)
  const mon = monsterIndex != null ? MONSTERS[monsterIndex] : pickRandom(list)
  if (!mon) return { ok: false, reason: 'none' }
  if (mon.minLevel > rpg.level) return { ok: false, reason: 'level', need: mon.minLevel, have: rpg.level }

  rpg.energy -= 25
  rpg.lastBattle = Date.now()

  const atk = (10 + rpg.level * 3) * (1 + equipBonus(jid, 'weapon'))
  const def = 1 - equipBonus(jid, 'armor')
  let monHp = mon.hp
  let round = 0
  const log = []

  while (monHp > 0 && rpg.health > 0 && round < 12) {
    round++
    const myDmg = Math.round(atk * (0.8 + Math.random() * 0.5))
    monHp -= myDmg
    log.push(`⚔️ Ronde ${round}: kamu serang ${mon.icon} *-${myDmg} HP*`)
    if (monHp <= 0) break
    const monDmg = Math.max(1, Math.round(mon.hp * 0.12 * def * (0.7 + Math.random() * 0.6)))
    rpg.health = Math.max(0, rpg.health - monDmg)
    log.push(`🩸 ${mon.icon} ${mon.name} balas: *-${monDmg} HP*`)
  }

  const win = monHp <= 0 && rpg.health > 0
  const result = { ok: true, monster: mon, win, log, round, health: rpg.health, energy: rpg.energy }

  if (win) {
    const bonus = 1 + (rpg.level - 1) * 0.04
    const money = Math.round(mon.money * bonus)
    const exp = Math.round(mon.exp * bonus)
    rpg.money += money
    rpg.exp += exp
    rpg.kills = (rpg.kills || 0) + 1
    result.money = money
    result.exp = exp

    // chance drop item
    if (Math.random() < 0.35) {
      const drop = pickRandom(['daging', 'kulit', 'gading', 'ramuan'])
      rpg.inventory[drop] = (rpg.inventory[drop] || 0) + 1
      result.drop = drop
    }
    let leveled = false
    while (rpg.exp >= expNeeded(rpg.level)) {
      rpg.exp -= expNeeded(rpg.level)
      rpg.level++
      rpg.maxHealth += 15
      rpg.maxEnergy += 5
      rpg.health = rpg.maxHealth
      rpg.energy = rpg.maxEnergy
      leveled = true
    }
    result.leveledUp = leveled
    result.newLevel = rpg.level
  } else if (rpg.health <= 0) {
    // kalah + pingsan: kehilangan sebagian uang
    const loss = Math.round(rpg.money * 0.1)
    rpg.money -= loss
    rpg.health = Math.round(rpg.maxHealth * 0.3)
    result.lostMoney = loss
    result.revived = true
  }

  catatHarian(rpg, 'battle')
  if (win) catatHarian(rpg, 'win')
  saveDB('users')
  return result
}

/* ------------------------- SHOP ------------------------- */
export function buy (jid, item, qty = 1) {
  const rpg = getRPG(jid)
  const it = ITEMS[item]
  if (!it) throw new Error('Item tidak dikenal')
  if (!it.buy) throw new Error(`${it.name} tidak dijual di toko`)
  const cost = it.buy * qty
  if (rpg.money < cost) return { ok: false, reason: 'money', need: cost, have: rpg.money }
  rpg.money -= cost
  rpg.inventory[item] = (rpg.inventory[item] || 0) + qty
  saveDB('users')
  return { ok: true, item, qty, cost, money: rpg.money }
}

export function sell (jid, item, qty = 1) {
  const rpg = getRPG(jid)
  const it = ITEMS[item]
  if (!it) throw new Error('Item tidak dikenal')
  const have = rpg.inventory[item] || 0
  if (have < qty) return { ok: false, reason: 'stock', have }
  const gain = it.sell * qty
  rpg.inventory[item] = have - qty
  if (rpg.inventory[item] <= 0) delete rpg.inventory[item]
  rpg.money += gain
  saveDB('users')
  return { ok: true, item, qty, gain, money: rpg.money }
}

/* ------------------------- UTIL ------------------------- */
export function inventoryList (jid) {
  const rpg = getRPG(jid)
  return Object.entries(rpg.inventory)
    .filter(([, q]) => q > 0)
    .map(([k, q]) => ({ key: k, qty: q, ...(ITEMS[k] || { name: k, icon: '📦', sell: 0 }) }))
}

export function bar (value, max, size = 10) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  const filled = Math.round(pct * size)
  return '█'.repeat(filled) + '░'.repeat(size - filled)
}

export function rpgProfileText (jid, name = '') {
  const r = getRPG(jid)
  const need = expNeeded(r.level)
  const eq = r.equipped || {}
  return `*🎮 PROFIL RPG${name ? ' — ' + name : ''}*

▸ *Level:* ${r.level}
▸ *EXP:* ${bar(r.exp, need)} ${r.exp}/${need}
▸ *HP:* ${bar(r.health, r.maxHealth)} ${r.health}/${r.maxHealth}
▸ *Energy:* ${bar(r.energy, r.maxEnergy)} ${r.energy}/${r.maxEnergy}
▸ *Uang:* 💰 ${r.money.toLocaleString('id-ID')} koin

*⚔️ PERALATAN*
▸ Weapon: ${eq.weapon ? ITEMS[eq.weapon].icon + ' ' + ITEMS[eq.weapon].name : '- kosong -'}
▸ Armor: ${eq.armor ? ITEMS[eq.armor].icon + ' ' + ITEMS[eq.armor].name : '- kosong -'}
▸ Tool: ${eq.tool ? ITEMS[eq.tool].icon + ' ' + ITEMS[eq.tool].name : '- kosong -'}

*📈 STATISTIK*
▸ Monster dikalahkan: ${r.kills || 0}
▸ Resource dikumpulkan: ${r.gathered || 0}
▸ 🎰 Slot RPG: ${r.slot?.putar || 0} putaran · ${r.slot?.menang || 0} menang · ${r.slot?.jackpot || 0} jackpot (\`${P}slot\`)`
}

export { formatDuration }
export default {
  ITEMS, MONSTERS, getRPG, addExp, addMoney, addItem, takeItem, hasItem,
  damage, heal, useEnergy, equip, unequip, equipBonus, doActivity, battle,
  buy, sell, inventoryList, bar, rpgProfileText, expNeeded
}
