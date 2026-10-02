/**
 * commands/rpg.js — RPG lengkap, tiap game punya struktur sendiri
 *   .rpgdaftar .rpgprofile .adventure .boss .shop .beli .inventory .daily
 *   (.leaderboard ada di profile.js)
 */
const db = require('../lib/db')
const { box, boxLines } = require('../lib/menu')
const { fmt, bar, randomInt, pick } = require('../lib/util')

const SHOP = [
  { id: 'potion', nama: '🧪 Potion', harga: 50, desc: 'Pulihkan 50 HP (otomatis dipakai)', type: 'consume' },
  { id: 'eliksir', nama: '⚗️ Eliksir', harga: 120, desc: 'Pulihkan HP penuh', type: 'consume' },
  { id: 'pedang', nama: '🗡️ Pedang Baja', harga: 200, desc: 'ATK +8 (sekali beli)', type: 'gear', atk: 8 },
  { id: 'zirah', nama: '🛡️ Zirah Besi', harga: 200, desc: 'DEF +6 (sekali beli)', type: 'gear', def: 6 },
  { id: 'amulet', nama: '📿 Amulet Keberuntungan', harga: 350, desc: 'EXP +25% (sekali beli)', type: 'gear', luck: 0.25 }
]

const BOSSES = [
  { name: 'Slime Raksasa', emoji: '🟢' },
  { name: 'Goblin Perampok', emoji: '👺' },
  { name: 'Serigala Bayangan', emoji: '🐺' },
  { name: 'Naga Api', emoji: '🐉' },
  { name: 'Raja Iblis', emoji: '😈' }
]

function need(m) {
  const r = db.getRpg(m.chat)
  if (!r) {
    m.reply(
      boxLines('RPG — BELUM DAFTAR', [
        `│ Kamu belum punya karakter.`,
        `│ Daftar dulu:`,
        ``,
        `│ *.rpgdaftar <nama>*`
      ])
    )
    return null
  }
  return r
}

function save(m, r) { db.setRpg(m.chat, r) }

const commands = [
  /* ═══ DAFTAR ═══ */
  {
    name: 'rpgdaftar',
    aliases: ['rpgregister', 'rpgbuat'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Buat karakter RPG',
    usage: '.rpgdaftar <nama>',
    async run(m, sock, args) {
      if (db.getRpg(m.chat)) return m.reply('Kamu sudah punya karakter! Cek *.rpgprofile*')
      const nama = args.join(' ') || m.pushName || 'Petualang'
      const rpg = {
        name: nama.slice(0, 20),
        level: 1, exp: 0, expMax: 100,
        hp: 100, maxHp: 100,
        gold: 150, atk: 10, def: 5,
        weapon: null, armor: null, amulet: false,
        inv: { potion: 2, eliksir: 0 },
        lastDaily: 0, lastAdventure: 0, lastBoss: 0,
        wins: 0, kills: 0
      }
      db.setRpg(m.chat, rpg)
      m.reply(
        box('KARAKTER BARU', [
          ['nama', rpg.name],
          ['level', '1'],
          ['hp', '100/100'],
          ['gold', '150'],
          ['atk', '10 (default)'],
          ['def', '5 (default)']
        ]) +
        `\n\nSiap bertualang! Buka *.menurpg* untuk menu lengkap.`
      )
    }
  },

  /* ═══ PROFIL RPG (struktur sendiri: kartu + bar) ═══ */
  {
    name: 'rpgprofile',
    aliases: ['rpgcard', 'kartu'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kartu karakter RPG',
    usage: '.rpgprofile',
    async run(m) {
      const r = need(m)
      if (!r) return
      const equips = [
        r.weapon ? `🗡️ ${r.weapon}` : '🗡️ -',
        r.armor ? `🛡️ ${r.armor}` : '🛡️ -',
        r.amulet ? '📿 Amulet' : '📿 -'
      ].join('  ')
      m.reply(
        boxLines('KARTU PETUALANG', [
          `│ *NAMA*   : ${r.name}`,
          `│ *LEVEL*  : ${r.level}  ${bar(r.exp, r.expMax, 8)}`,
          `│ *EXP*    : ${r.exp}/${r.expMax}`,
          `│ *HP*     : ${bar(r.hp, r.maxHp, 8)}`,
          `│          ${r.hp}/${r.maxHp} HP`,
          `│ *ATK*    : ${r.atk}   *DEF*: ${r.def}`,
          `│ *GOLD*   : 🪙 ${fmt(r.gold)}`,
          `│ *MENANG* : ${r.wins} boss | ${r.kills} kill`,
          `│ *EQUIP*  : ${equips}`
        ])
      )
    }
  },

  /* ═══ ADVENTURE (struktur sendiri: laporan dungeon) ═══ */
  {
    name: 'adventure',
    aliases: ['petualangan', 'explore', 'dungeon'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Jelajah dungeon (gold + exp)',
    usage: '.adventure',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      const cd = 45_000
      if (now - (r.lastAdventure || 0) < cd) {
        const sisa = Math.ceil((cd - (now - r.lastAdventure)) / 1000)
        return m.reply(`⏳ *Bernapas dulu...* (${sisa}s lagi)`)
      }
      if (r.hp <= 10) return m.reply('💀 HP hampir habis! Pakai *.beli potion* / tunggu *.daily*.')

      r.lastAdventure = now
      const events = [
        'Kamu menemukan peti harta di lorong gelap 📦',
        'Monster menghadang jalanmu! ⚔️',
        'Kamu menjebak jebakan berbahaya 🪤',
        'Menemukan pedagang gelap di dungeon 🧙'
      ]
      const win = Math.random() < 0.62
      const gainGold = randomInt(20, 65)
      const gainExp = Math.round(randomInt(15, 40) * (r.amulet ? 1.25 : 1))
      const dmg = win ? randomInt(3, 15) : randomInt(10, 30)

      r.hp = Math.max(1, r.hp - dmg)
      if (win) { r.gold += gainGold; r.exp += gainExp; r.kills++ }
      else { r.exp += Math.round(gainExp / 3) }

      // naik level
      let levelUp = ''
      while (r.exp >= r.expMax) {
        r.exp -= r.expMax
        r.level++
        r.expMax = Math.round(r.expMax * 1.35)
        r.maxHp += 15
        r.hp = r.maxHp
        r.atk += 3
        r.def += 2
        levelUp = `\n🎉 *LEVEL UP!* → Level ${r.level}`
      }

      save(m, r)
      m.reply(
        boxLines(win ? 'DUNGEON — MENANG' : 'DUNGEON — TERLUKA', [
          `│ *AKSI*  : ${pick(events)}`,
          `│ *HASIL* : ${win ? '✅ MENANG' : '❌ TERLUKA'}`,
          `│ *DAMAGE*: -${dmg} HP`,
          `│ *GOLD*  : ${win ? '+' + gainGold : '+0'} 🪙`,
          `│ *EXP*   : +${win ? gainExp : Math.round(gainExp / 3)}`,
          `│ *HP*    : ${bar(r.hp, r.maxHp, 8)} ${r.hp}/${r.maxHp}`
        ]) + levelUp
      )
    }
  },

  /* ═══ BOSS (struktur sendiri: bar HP boss vs pemain) ═══ */
  {
    name: 'boss',
    aliases: ['bossbattle', 'lawanboss'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Lawan boss (bar HP)',
    usage: '.boss',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      if (now - (r.lastBoss || 0) < 8_000) {
        const sisa = Math.ceil((8000 - (now - r.lastBoss)) / 1000)
        return m.reply(`⏳ Serangan berikutnya: *${sisa}s*`)
      }
      if (r.hp <= 5) return m.reply('💀 HP terlalu rendah! Istirahat / pakai potion dulu.')

      r.lastBoss = now
      const tier = Math.min(BOSSES.length - 1, Math.floor((r.level - 1) / 2))
      const boss = BOSSES[tier]
      const bossMax = 60 + r.level * 40
      const bossAtk = 8 + r.level * 4
      // state boss tersimpan? ringkas: pakai hp tersimpan di r.bossHp
      if (!r.bossHp || r.bossTier !== tier) { r.bossHp = bossMax; r.bossTier = tier }

      const dmgKeBoss = Math.max(1, r.atk + randomInt(0, 8) - Math.round(r.level * 1.5))
      const dmgKePemain = Math.max(1, bossAtk + randomInt(0, 6) - r.def)
      r.bossHp -= dmgKeBoss
      r.hp -= dmgKePemain

      if (r.bossHp <= 0) {
        // menang
        const g = 80 + r.level * 40
        const e = 50 + r.level * 20
        r.gold += g
        r.exp += Math.round(e * (r.amulet ? 1.25 : 1))
        r.wins++
        r.bossHp = 0
        r.hp = Math.max(1, r.hp)
        let levelUp = ''
        while (r.exp >= r.expMax) {
          r.exp -= r.expMax
          r.level++
          r.expMax = Math.round(r.expMax * 1.35)
          r.maxHp += 15
          r.hp = r.maxHp
          r.atk += 3
          r.def += 2
          levelUp = `\n🎉 *LEVEL UP!* → Level ${r.level}`
        }
        save(m, r)
        return m.reply(
          boxLines('BOSS — DIKALAHKAN 🏆', [
            `│ *BOSS*  : ${boss.emoji} ${boss.name}`,
            `│ *BAR*   : ${'░'.repeat(10)}`,
            `│ *MENANG*: -${dmgKePemain} HP balik`,
            `│ *GOLD*  : +${g} 🪙`,
            `│ *EXP*   : +${e}`,
            `│ *HP*    : ${r.hp}/${r.maxHp}`
          ]) + levelUp
        )
      }

      if (r.hp <= 0) {
        r.hp = 1
        r.gold = Math.max(0, r.gold - 50)
        r.bossHp = bossMax // boss pulih
        save(m, r)
        return m.reply(
          boxLines('BOSS — KALAH 💀', [
            `│ *BOSS* : ${boss.emoji} ${boss.name}`,
            `│ Kamu jatuh... -50 gold`,
            `│ HP dipulihkan ke 1`,
            ``,
            `│ *TIPS*: beli potion, naikkan level`
          ])
        )
      }

      save(m, r)
      m.reply(
        boxLines('BOSS — PERTARUNGAN', [
          `│ *BOSS* : ${boss.emoji} ${boss.name}`,
          `│ *BAR*  : [${'█'.repeat(Math.max(0, Math.round((r.bossHp / bossMax) * 10)))}${'░'.repeat(10 - Math.max(0, Math.round((r.bossHp / bossMax) * 10)))}] ${r.bossHp}/${bossMax}`,
          `│ *KAMU* : ${bar(r.hp, r.maxHp, 8)}`,
          `│          ${r.hp}/${r.maxHp} HP`,
          ``,
          `│ Kamu -${dmgKePemain} | Boss -${dmgKeBoss}`,
          `│ Ketik *.boss* lagi untuk serang!`
        ])
      )
    }
  },

  /* ═══ SHOP (struktur sendiri: daftar toko) ═══ */
  {
    name: 'shop',
    aliases: ['toko'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Toko senjata & item RPG',
    usage: '.shop',
    async run(m) {
      const r = need(m)
      if (!r) return
      const lines = SHOP.map((s, i) => {
        const owned = s.type === 'gear' && ((s.id === 'pedang' && r.weapon) || (s.id === 'zirah' && r.armor) || (s.id === 'amulet' && r.amulet))
        return [
          `│ ${i + 1}. ${s.nama}`,
          `│    ${s.desc}`,
          `│    Harga: 🪙 ${s.harga} ${owned ? '✅ DIMILIKI' : ''}`
        ]
      }).join('\n')
      m.reply(
        boxLines('TOKO DUNGEON', [
          `│ Saldo kamu: 🪙 *${fmt(r.gold)}*`,
          ``,
          lines,
          ``,
          `│ Beli: *.beli potion 2*`
        ])
      )
    }
  },

  /* ═══ BELI ═══ */
  {
    name: 'beli',
    aliases: ['buy', 'shopbeli'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Beli item di toko',
    usage: '.beli <item> [qty]',
    async run(m, sock, args) {
      const r = need(m)
      if (!r) return
      const id = (args[0] || '').toLowerCase()
      const qty = Math.max(1, parseInt(args[1] || '1', 10) || 1)
      const item = SHOP.find(s => s.id === id || s.nama.toLowerCase().includes(id)) || SHOP.find(s => id && s.id.startsWith(id))
      if (!item) {
        return m.reply(`Item tidak ditemukan. Lihat daftar: *.shop*\nContoh: *.beli potion 2*`)
      }
      if (item.type === 'gear') {
        const owned = (item.id === 'pedang' && r.weapon) || (item.id === 'zirah' && r.armor) || (item.id === 'amulet' && r.amulet)
        if (owned) return m.reply('Kamu sudah punya item itu ✅')
        if (r.gold < item.harga) return m.reply(`Gold kurang! Butuh 🪙 ${item.harga}, kamu 🪙 ${r.gold}`)
        r.gold -= item.harga
        if (item.id === 'pedang') { r.weapon = 'Pedang Baja'; r.atk += item.atk }
        if (item.id === 'zirah') { r.armor = 'Zirah Besi'; r.def += item.def }
        if (item.id === 'amulet') r.amulet = true
        save(m, r)
        return m.reply(
          boxLines('PEMBELIAN BERHASIL', [
            `│ *ITEM* : ${item.nama}`,
            `│ *HARGA*: 🪙 ${item.harga}`,
            `│ *SISA* : 🪙 ${r.gold}`,
            ``,
            `│ ATK: ${r.atk} | DEF: ${r.def}`
          ])
        )
      }
      const total = item.harga * qty
      if (r.gold < total) return m.reply(`Gold kurang! Butuh 🪙 ${total}, kamu 🪙 ${r.gold}`)
      r.gold -= total
      r.inv[item.id] = (r.inv[item.id] || 0) + qty
      save(m, r)
      m.reply(
        boxLines('PEMBELIAN BERHASIL', [
          `│ *ITEM* : ${item.nama} x${qty}`,
          `│ *HARGA*: 🪙 ${total}`,
          `│ *SISA* : 🪙 ${r.gold}`,
          `│ *TAS*  : ${item.id} = ${r.inv[item.id]}`
        ])
      )
    }
  },

  /* ═══ INVENTORY (struktur sendiri: daftar tas) ═══ */
  {
    name: 'inventory',
    aliases: ['inv', 'tas'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tas & perlengkapan RPG',
    usage: '.inventory',
    async run(m) {
      const r = need(m)
      if (!r) return
      const items = Object.entries(r.inv).filter(([, v]) => v > 0)
      const itemLines = items.length
        ? items.map(([k, v]) => {
            const s = SHOP.find(x => x.id === k)
            return `│ ${s ? s.nama : '📦 ' + k} x${v}`
          }).join('\n')
        : '│ (kosong)'
      m.reply(
        boxLines('TAS PEMBALANG', [
          `│ *UANG* : 🪙 ${fmt(r.gold)}`,
          ``,
          `│ *EQUIPMENT*`,
          `│ 🗡️ ${r.weapon || '-'}`,
          `│ 🛡️ ${r.armor || '-'}`,
          `│ 📿 ${r.amulet ? 'Amulet' : '-'}`,
          ``,
          `│ *ITEM*`,
          itemLines,
          ``,
          `│ Pakai potion otomatis saat`,
          `│ bertarung / jelajah.`
        ])
      )
    }
  },

  /* ═══ DAILY (struktur sendiri: kotak bonus) ═══ */
  {
    name: 'daily',
    aliases: ['bonus', 'hadiah'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Bonus harian (24 jam)',
    usage: '.daily',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      const cd = 24 * 60 * 60 * 1000
      if (now - (r.lastDaily || 0) < cd) {
        const sisa = Math.ceil((cd - (now - r.lastDaily)) / 60000)
        const jam = Math.floor(sisa / 60), menit = sisa % 60
        return m.reply(
          boxLines('DAILY — SUDAH DIAMBIL', [
            `│ Bonus berikutnya dalam`,
            `│ *${jam}j ${menit}m* lagi`,
            ``,
            `│ Sambil menunggu: *.adventure*`
          ])
        )
      }
      r.lastDaily = now
      r.gold += 100
      r.inv.potion = (r.inv.potion || 0) + 1
      r.hp = Math.min(r.maxHp, r.hp + 30)
      save(m, r)
      m.reply(
        boxLines('DAILY — DITERIMA 🎁', [
          `│ *EMAS*   : +100 🪙`,
          `│ *POTION* : +1 🧪`,
          `│ *HP*     : +30`,
          ``,
          `│ *SALDO*  : 🪙 ${fmt(r.gold)}`,
          `│ *HP*     : ${r.hp}/${r.maxHp}`
        ])
      )
    }
  }
]

module.exports = commands
