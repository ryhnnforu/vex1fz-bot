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
  },

  /* ═══════════ 12 FITUR BARU ═══════════ */

  /* 9. KERJA */
  {
    name: 'kerja',
    aliases: ['kerjaan', 'job'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Kerja sambilan → gold + exp (cooldown 30 menit)',
    usage: '.kerja',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      if (now - (r.lastKerja || 0) < 30 * 60_000) {
        const sisa = Math.ceil((30 * 60_000 - (now - r.lastKerja)) / 60000)
        return m.reply(`⏳ Masih lelah... istirahat *${sisa} menit* lagi.`)
      }
      r.lastKerja = now
      const jobs = [
        'Jadi kuli angkut di pasar 📦',
        'Bantu warung nasi tetangga 🍚',
        'Ojek online satu trip 🛵',
        'Berkebun di kebun orang 🌿',
        'Jaga toko seharian 🏪'
      ]
      const g = randomInt(40, 90)
      const e = randomInt(8, 18)
      r.gold += g
      r.exp += Math.round(e * (r.amulet ? 1.25 : 1))
      r.qCount = (r.qDate === new Date().toDateString()) ? (r.qCount || 0) + 1 : 1
      r.qDate = new Date().toDateString()
      let levelUp = ''
      while (r.exp >= r.expMax) {
        r.exp -= r.expMax; r.level++; r.expMax = Math.round(r.expMax * 1.35)
        r.maxHp += 15; r.hp = r.maxHp; r.atk += 3; r.def += 2
        levelUp = `\n🎉 *LEVEL UP!* → Level ${r.level}`
      }
      save(m, r)
      m.reply(
        boxLines('KERJA — SELESAI 💼', [
          `│ *JOB* : ${pick(jobs)}`,
          `│ *HASIL*: +${g} 🪙 | +${e} EXP`,
          `│ *SALDO*: 🪙 ${fmt(r.gold)}`,
          `│ *PROGRES QUEST*: ${Math.min(5, r.qCount)}/5`
        ]) + levelUp
      )
    }
  },

  /* 10. MINE */
  {
    name: 'mine',
    aliases: ['nambang', 'mining'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Nambang tambang → gold (ada chance permata)',
    usage: '.mine',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      if (now - (r.lastMine || 0) < 60_000) {
        const sisa = Math.ceil((60_000 - (now - r.lastMine)) / 1000)
        return m.reply(`⛏️ Berkedip dulu... *${sisa}s* lagi.`)
      }
      r.lastMine = now
      const g = randomInt(25, 65)
      const gem = Math.random() < (r.amulet ? 0.3 : 0.18)
      const bonus = gem ? randomInt(60, 150) : 0
      r.gold += g + bonus
      r.qCount = (r.qDate === new Date().toDateString()) ? (r.qCount || 0) + 1 : 1
      r.qDate = new Date().toDateString()
      save(m, r)
      m.reply(
        boxLines('NAMBANG', [
          `│ ⛏️ Batu pecah... +${g} 🪙`,
          gem ? `│ 💎 *DAPET PERMATA!* +${bonus} 🪙` : `│ 💎 Permata tidak ketemu...`,
          `│ *SALDO*: 🪙 ${fmt(r.gold)}`,
          `│ *PROGRES QUEST*: ${Math.min(5, r.qCount)}/5`
        ])
      )
    }
  },

  /* 11. FISH */
  {
    name: 'fish',
    aliases: ['mancing', 'fishing'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Mancing ikan → gold + pulihkan HP',
    usage: '.fish',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      if (now - (r.lastFish || 0) < 60_000) {
        const sisa = Math.ceil((60_000 - (now - r.lastFish)) / 1000)
        return m.reply(`🎣 Sabar... ikan lagi ngumpul (*${sisa}s*)`)
      }
      r.lastFish = now
      const catches = [
        ['🐟 Lele', 20, 45], ['🐠 Cupang', 25, 55], ['🐡 Pufferfish', 35, 70],
        ['🦈 Hiu Mini', 60, 120], ['👢 Sepatu Tua', 3, 8]
      ]
      const [ikan, lo, hi] = pick(catches)
      const g = randomInt(lo, hi)
      const heal = randomInt(5, 15)
      r.gold += g
      r.hp = Math.min(r.maxHp, r.hp + heal)
      r.qCount = (r.qDate === new Date().toDateString()) ? (r.qCount || 0) + 1 : 1
      r.qDate = new Date().toDateString()
      save(m, r)
      m.reply(
        boxLines('MANCING', [
          `│ 🎣 Dapat: *${ikan}* → +${g} 🪙`,
          `│ ❤️ HP +${heal} → ${r.hp}/${r.maxHp}`,
          `│ *SALDO*: 🪙 ${fmt(r.gold)}`,
          `│ *PROGRES QUEST*: ${Math.min(5, r.qCount)}/5`
        ])
      )
    }
  },

  /* 12. BANK */
  {
    name: 'bank',
    aliases: ['tabungan'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Lihat tabungan emas di bank',
    usage: '.bank',
    async run(m) {
      const r = need(m)
      if (!r) return
      m.reply(
        boxLines('BANK DUNGEON', [
          `│ *SALDO DALAM TAS*: 🪙 ${fmt(r.gold)}`,
          `│ *TABUNGAN*       : 🪙 ${fmt(r.bank || 0)}`,
          ``,
          `│ Setor: *.setor 500* / *.setor all*`,
          `│ Tarik: *.tarik 200*`
        ])
      )
    }
  },

  /* 13. SETOR */
  {
    name: 'setor',
    aliases: ['deposit', 'setorbank'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Setor emas ke bank',
    usage: '.setor 500 | .setor all',
    async run(m, sock, args) {
      const r = need(m)
      if (!r) return
      const inp = (args[0] || '').toLowerCase()
      const n = inp === 'all' || inp === 'semua' ? r.gold : parseInt(inp, 10)
      if (!n || n <= 0) return m.reply('Contoh: *.setor 500* atau *.setor all*')
      if (n > r.gold) return m.reply(`Saldo tas cuma 🪙 ${fmt(r.gold)}`)
      r.gold -= n
      r.bank = (r.bank || 0) + n
      save(m, r)
      m.reply(`🏦 Disetor 🪙 ${fmt(n)}\nTas: 🪙 ${fmt(r.gold)} | Bank: 🪙 ${fmt(r.bank)}`)
    }
  },

  /* 14. TARIK */
  {
    name: 'tarik',
    aliases: ['withdraw', 'ambilbank'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Tarik emas dari bank ke tas',
    usage: '.tarik 200 | .tarik all',
    async run(m, sock, args) {
      const r = need(m)
      if (!r) return
      const inp = (args[0] || '').toLowerCase()
      const bank = r.bank || 0
      const n = inp === 'all' || inp === 'semua' ? bank : parseInt(inp, 10)
      if (!n || n <= 0) return m.reply(`Bank kosong / contoh: *.tarik 200*`)
      if (n > bank) return m.reply(`Tabungan cuma 🪙 ${fmt(bank)}`)
      r.bank = bank - n
      r.gold += n
      save(m, r)
      m.reply(`🏧 Ditarik 🪙 ${fmt(n)}\nTas: 🪙 ${fmt(r.gold)} | Bank: 🪙 ${fmt(r.bank)}`)
    }
  },

  /* 15. WEEKLY */
  {
    name: 'weekly',
    aliases: ['bonusmingguan'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Bonus mingguan besar (7 hari sekali)',
    usage: '.weekly',
    async run(m) {
      const r = need(m)
      if (!r) return
      const cd = 7 * 86_400_000
      if (Date.now() - (r.lastWeekly || 0) < cd) {
        const sisa = Math.ceil((cd - (Date.now() - r.lastWeekly)) / 86_400_000)
        return m.reply(`⏳ Bonus mingguan berikutnya: *${sisa} hari* lagi.`)
      }
      r.lastWeekly = Date.now()
      r.gold += 500
      r.inv.potion = (r.inv.potion || 0) + 3
      save(m, r)
      m.reply(
        boxLines('WEEKLY BONUS 🎁', [
          `│ *EMAS*   : +500 🪙`,
          `│ *POTION* : +3 🧪`,
          `│ *SALDO*  : 🪙 ${fmt(r.gold)}`
        ])
      )
    }
  },

  /* 16. MONTHLY */
  {
    name: 'monthly',
    aliases: ['bonusbulanan'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Bonus bulanan raksasa (30 hari sekali)',
    usage: '.monthly',
    async run(m) {
      const r = need(m)
      if (!r) return
      const cd = 30 * 86_400_000
      if (Date.now() - (r.lastMonthly || 0) < cd) {
        const sisa = Math.ceil((cd - (Date.now() - r.lastMonthly)) / 86_400_000)
        return m.reply(`⏳ Bonus bulanan berikutnya: *${sisa} hari* lagi.`)
      }
      r.lastMonthly = Date.now()
      r.gold += 2000
      r.inv.eliksir = (r.inv.eliksir || 0) + 5
      r.exp += 200
      let levelUp = ''
      while (r.exp >= r.expMax) {
        r.exp -= r.expMax; r.level++; r.expMax = Math.round(r.expMax * 1.35)
        r.maxHp += 15; r.hp = r.maxHp; r.atk += 3; r.def += 2
        levelUp = `\n🎉 *LEVEL UP!* → Level ${r.level}`
      }
      save(m, r)
      m.reply(
        boxLines('MONTHLY BONUS 🎰', [
          `│ *EMAS*   : +2000 🪙`,
          `│ *ELIKSIR*: +5 ⚗️`,
          `│ *EXP*    : +200`,
          `│ *SALDO*  : 🪙 ${fmt(r.gold)}`
        ]) + levelUp
      )
    }
  },

  /* RPG BATCH 2 */

  /* 17. ARENA */
  {
    name: 'arena',
    aliases: ['lawan', 'fight'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Bertarung di arena vs petarung acak (20 detik cooldown)',
    usage: '.arena',
    async run(m) {
      const r = need(m)
      if (!r) return
      const now = Date.now()
      if (now - (r.lastArena || 0) < 20_000) {
        const sisa = Math.ceil((20_000 - (now - r.lastArena)) / 1000)
        return m.reply(`⏳ Waktu istirahat: *${sisa}s*`)
      }
      if (r.hp <= 10) return m.reply('💀 HP tipis! Pakai potion dulu.')
      r.lastArena = now
      const foes = ['🍷 Petarung Mabuk', '🥷 Ninja Palsu', '🦵 Jagoan Kampung', '🤖 Golem Latihan', '🧟 Hantu Arena']
      const foe = pick(foes)
      const foeAtk = 6 + r.level * 3 + randomInt(0, 8)
      const myDmg = r.atk + randomInt(0, 10)
      const foeDmg = Math.max(1, foeAtk - r.def)
      const menang = myDmg >= foeDmg || Math.random() < 0.55
      if (menang) {
        const g = 30 + r.level * 12
        r.gold += g
        r.exp += 15 + r.level * 4
        r.wins++
        r.hp = Math.max(1, r.hp - randomInt(2, 10))
        let levelUp = ''
        while (r.exp >= r.expMax) {
          r.exp -= r.expMax; r.level++; r.expMax = Math.round(r.expMax * 1.35)
          r.maxHp += 15; r.hp = r.maxHp; r.atk += 3; r.def += 2
          levelUp = `\n🎉 *LEVEL UP!* → Level ${r.level}`
        }
        save(m, r)
        return m.reply(
          boxLines('ARENA — MENANG 🏆', [
            `│ *LAWAN*: ${foe}`,
            `│ *SERANGANMU*: ${myDmg} | *LAWAN*: ${foeDmg}`,
            `│ *HASIL*: +${g} 🪙 | +${15 + r.level * 4} EXP`,
            `│ *SALDO*: 🪙 ${fmt(r.gold)}`
          ]) + levelUp
        )
      }
      r.hp = Math.max(1, r.hp - randomInt(8, 20))
      r.gold = Math.max(0, r.gold - 20)
      save(m, r)
      m.reply(
        boxLines('ARENA — KALAH 😵', [
          `│ *LAWAN*: ${foe}`,
          `│ *SERANGANMU*: ${myDmg} | *LAWAN*: ${foeDmg}`,
          `│ Kamu terjatuh... -20 🪙`,
          `│ *HP*: ${r.hp}/${r.maxHp}`
        ])
      )
    }
  },

  /* 18. UPGRADE */
  {
    name: 'upgrade',
    aliases: ['tingkatkan', 'upgear'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Upgrade senjata/armor (+ATK/DEF, harganya naik tiap level)',
    usage: '.upgrade pedang | .upgrade zirah',
    async run(m, sock, args) {
      const r = need(m)
      if (!r) return
      const t = (args[0] || '').toLowerCase()
      if (!['pedang', 'zirah', 'senjata', 'armor'].includes(t)) {
        return m.reply('Pilih yang mau di-upgrade:\n*.upgrade pedang* (+3 ATK)\n*.upgrade zirah* (+3 DEF)')
      }
      const isPedang = ['pedang', 'senjata'].includes(t)
      if (isPedang && !r.weapon) return m.reply('Belum punya pedang. Beli dulu di *.shop*.')
      if (!isPedang && !r.armor) return m.reply('Belum punya zirah. Beli dulu di *.shop*.')
      r.upP = r.upP || 0
      r.upA = r.upA || 0
      const lvl = isPedang ? r.upP : r.upA
      const cost = 150 + lvl * 120
      if (r.gold < cost) return m.reply(`Upgrade butuh 🪙 ${fmt(cost)} (gold kamu 🪙 ${fmt(r.gold)})`)
      r.gold -= cost
      if (isPedang) { r.upP++; r.atk += 3; r.weapon = `Pedang +${r.upP}` }
      else { r.upA++; r.def += 3; r.armor = `Zirah +${r.upA}` }
      save(m, r)
      m.reply(
        boxLines('UPGRADE BERHASIL 🔧', [
          `│ *ITEM* : ${isPedang ? r.weapon : r.armor}`,
          `│ *STATUS*: ATK ${r.atk} | DEF ${r.def}`,
          `│ *BIAYA* : 🪙 ${fmt(cost)}`,
          `│ *SISA*  : 🪙 ${fmt(r.gold)}`,
          ``,
          `│ Upgade lagi: butuh 🪙 ${fmt(cost + 120)}`
        ])
      )
    }
  },

  /* 19. INVESTASI */
  {
    name: 'investasi',
    aliases: ['invest', 'saham'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Investasi emas — bisa untung bisa rugi (cooldown 3 menit)',
    usage: '.investasi 200',
    async run(m, sock, args) {
      const r = need(m)
      if (!r) return
      const n = parseInt(args[0], 10)
      if (!n || n <= 0) return m.reply('Contoh: *.investasi 200*\n(minimal 50 gold)')
      if (n < 50) return m.reply('Minimal investasi 🪙 50')
      const now = Date.now()
      if (now - (r.lastInv || 0) < 3 * 60_000) {
        const sisa = Math.ceil((3 * 60_000 - (now - r.lastInv)) / 60000)
        return m.reply(`📈 Pasar lagi tutup... buka lagi *${sisa} menit*.`)
      }
      if (n > r.gold) return m.reply(`Gold cuma 🪙 ${fmt(r.gold)}`)
      r.lastInv = now
      r.gold -= n
      const roll = Math.random()
      if (roll < 0.4) {
        const gain = Math.round(n * (0.2 + Math.random() * 0.5))
        r.gold += n + gain
        save(m, r)
        m.reply(`📈 *CUAN!* Investasi 🪙 ${fmt(n)} → *+${fmt(gain)}* profit!\nSaldo: 🪙 ${fmt(r.gold)}`)
      } else if (roll < 0.7) {
        r.gold += n
        save(m, r)
        m.reply(`📉 Aman-aman saja... investasi 🪙 ${fmt(n)} kembali utuh.\nSaldo: 🪙 ${fmt(r.gold)}`)
      } else {
        const loss = Math.round(n * (0.15 + Math.random() * 0.35))
        r.gold += n - loss
        save(m, r)
        m.reply(`📉 *RUGI!* Investasi anjlok, hilang 🪙 ${fmt(loss)}.\nSaldo: 🪙 ${fmt(r.gold)}\nInvest lagi nanti ya 🙏`)
      }
    }
  },

  /* 20. QUEST */
  {
    name: 'quest',
    aliases: ['misi', 'mission'],
    category: 'rpg',
    access: 'user',
    prefixes: ['.'],
    desc: 'Quest harian: selesaikan 5x kerja/mine/fishing → +250 gold',
    usage: '.quest',
    async run(m) {
      const r = need(m)
      if (!r) return
      const today = new Date().toDateString()
      if (r.qDate !== today) { r.qDate = today; r.qCount = 0; r.qClaim = '' }
      const prog = Math.min(5, r.qCount || 0)
      if (r.qClaim === today) {
        return m.reply(`✅ Quest hari ini sudah diklaim!\nProgres: ${prog}/5 — besok misi baru lagi.`)
      }
      if (prog >= 5) {
        r.qClaim = today
        r.gold += 250
        save(m, r)
        return m.reply(
          boxLines('QUEST SELESAI 🏅', [
            `│ *MISI*: Kerja/nambang/mancing 5x`,
            `│ *STATUS*: ✅ ${prog}/5`,
            `│ *IMBALAN*: +250 🪙`,
            `│ *SALDO*: 🪙 ${fmt(r.gold)}`
          ])
        )
      }
      m.reply(
        boxLines('QUEST HARIAN', [
          `│ *MISI*: Kerja/nambang/mancing 5x`,
          `│ *PROGRES*: ${prog}/5`,
          ``,
          `│ Kerjakan: *.kerja* / *.mine* / *.fish*`,
          `│ *IMBALAN*: +250 🪙`
        ])
      )
    }
  }
]

module.exports = commands
