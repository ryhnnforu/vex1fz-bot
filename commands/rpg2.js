/**
 * commands/rpg2.js — RPG +15 (lanjutan rpg.js)
 *   craft forge duel pets feed panahan raid market sell steal
 *   spin scratch camp tower worldboss
 * Catatan: data RPG vex1fz per-chat (db.getRpg(m.chat)) — semua fitur mengikuti model itu.
 */
const db = require('../lib/db')
const { boxLines } = require('../lib/menu')
const { randomInt, pick, fmt } = require('../lib/util')

function need(m) {
  const r = db.getRpg(m.chat)
  if (!r) { m.reply('❌ Belum punya karakter. Daftar dulu: *.rpgdaftar <nama>*'); return null }
  return r
}
function save(m, r) { db.setRpg(m.chat, r) }

const RECIPES = [
  { id: 'elix', nama: '⚗️ Eliksir', butuh: { potion: 2 }, biaya: 0, hasil: { eliksir: 1 } },
  { id: 'permata', nama: '💎 Permata', butuh: {}, biaya: 400, hasil: { permata: 1 } },
  { id: 'mahkota', nama: '👑 Mahkota', butuh: { permata: 1 }, biaya: 600, hasil: { mahkota: 1 } }
]
const SELL_PRICE = { permata: 600, mahkota: 1400, potion: 35, eliksir: 85 }

const commands = [
  /* 1. CRAFT */
  {
    name: 'craft', aliases: ['buat'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Craft item dari resep (.craft untuk daftar resep)', usage: '.craft [elix|permata|mahkota]',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const sub = (args[0] || '').toLowerCase()
      if (!sub) {
        return m.reply(
          boxLines('CRAFT — RESEP', RECIPES.map(x => {
            const b = Object.entries(x.butuh).map(([k, v]) => `${k}x${v}`).join(', ')
            return `│ *${x.nama}* — ${b || '-'} ${x.biaya ? `+ 🪙${x.biaya}` : ''}`
          }).concat(['', '│ Pakai: .craft <id>']))
        )
      }
      const rec = RECIPES.find(x => x.id === sub || x.nama.toLowerCase().includes(sub))
      if (!rec) return m.reply('Resep tidak dikenal. Lihat: *.craft*')
      if (r.gold < rec.biaya) return m.reply(`Gold kurang: butuh 🪙 ${fmt(rec.biaya)} (punya ${fmt(r.gold)})`)
      for (const [k, v] of Object.entries(rec.butuh)) {
        if ((r.inv[k] || 0) < v) return m.reply(`Bahan kurang: *${k} x${v}* (punya ${r.inv[k] || 0})`)
      }
      r.gold -= rec.biaya
      for (const [k, v] of Object.entries(rec.butuh)) r.inv[k] -= v
      for (const [k, v] of Object.entries(rec.hasil)) r.inv[k] = (r.inv[k] || 0) + v
      r.exp = (r.exp || 0) + 8
      save(m, r)
      m.reply(`🔨 *CRAFT SUKSES*\n${rec.nama} masuk tas!\nSaldo: 🪙 ${fmt(r.gold)} • EXP +8`)
    }
  },

  /* 2. FORGE */
  {
    name: 'forge', aliases: ['tempa'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Tempa senjata: ATK +3 (biaya naik tiap level tempa)', usage: '.forge',
    async run(m) {
      const r = need(m); if (!r) return
      r.forge = r.forge || 0
      const cost = 120 + r.forge * 80
      if (r.gold < cost) return m.reply(`Butuh 🪙 ${fmt(cost)} untuk tempa berikutnya (punya ${fmt(r.gold)})`)
      r.gold -= cost
      r.atk += 3
      r.forge++
      save(m, r)
      m.reply(
        boxLines('FORGE — SUKSES 🔥', [
          `│ Senjata *+3 ATK* (tempa ke-${r.forge})`,
          `│ ATK sekarang: *${r.atk}*`,
          `│ Biaya berikutnya: 🪙 ${120 + r.forge * 80}`
        ])
      )
    }
  },

  /* 3. DUEL (vs NPC) */
  {
    name: 'duel', aliases: ['adu'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Duel melawan pendekar jalanan — menang dapat gold', usage: '.duel',
    async run(m) {
      const r = need(m); if (!r) return
      const now = Date.now()
      if (now - (r.lastDuel || 0) < 60000) return m.reply(`⏳ Tunggu ${60 - Math.round((now - r.lastDuel) / 1000)} detik lagi.`)
      r.lastDuel = now
      const enemyName = pick(['Pendekar Jalanan', 'Bandit Berkumis', 'Ronin Pengembara', 'Petinju Pasar'])
      const enemyHp = 60 + r.level * 10
      let myHp = r.hp, eHp = enemyHp, rounds = 0, log = []
      while (myHp > 0 && eHp > 0 && rounds < 15) {
        rounds++
        const dmgToEnemy = Math.max(2, r.atk + randomInt(-3, 5) - 3)
        const dmgToMe = Math.max(1, Math.floor(enemyHp / 8) + randomInt(0, 5) - Math.floor(r.def / 2))
        eHp -= dmgToEnemy
        if (eHp > 0) myHp -= dmgToMe
        log.push(`R${rounds}: -${dmgToEnemy} ke lawan${eHp > 0 ? `, -${dmgToMe} ke kamu` : ''}`)
      }
      r.hp = Math.max(1, myHp)
      if (eHp <= 0) {
        const gain = 80 + r.level * 20 + randomInt(0, 60)
        r.gold += gain
        r.wins = (r.wins || 0) + 1
        r.exp = (r.exp || 0) + 15
        save(m, r)
        return m.reply(`⚔️ *DUEL MENANG* vs ${enemyName}!\n${log.join('\n')}\n💰 +${fmt(gain)} gold • EXP +15\nHP tersisa: ${r.hp}/${r.maxHp}`)
      }
      save(m, r)
      m.reply(`😵 *DUEL KALAH* vs ${enemyName}\n${log.join('\n')}\nHP: ${r.hp}/${r.maxHp} (potion otomatis dipakai kalau ada)`)
    }
  },

  /* 4. PETS */
  {
    name: 'pets', aliases: ['pet'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Peliharaan: .pets adopt <nama> | .pets | .pets <nama>', usage: '.pets adopt naga',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const sub = (args[0] || '').toLowerCase()
      if (sub === 'adopt') {
        if (r.pet) return m.reply(`Kamu sudah punya pet: *${r.pet.name}* (ganti: *.pets release*)`)
        const nama = args.slice(1).join(' ') || pick(['Mochi', 'Golem', 'Kirin', 'Bebek'])
        r.pet = { name: nama.slice(0, 16), type: pick(['Naga Mini', 'Serigala', 'Burung Phoenix', 'Kucing Ajaib']), level: 1, exp: 0, hunger: 80, bond: 10 }
        save(m, r)
        return m.reply(`🐾 *PET BARU!*\n${r.pet.emoji || '🐾'} ${r.pet.name} (${r.pet.type})\nLevel 1 • Kelaparan 20%\nBeri makan: *.feed*`)
      }
      if (sub === 'release') {
        if (!r.pet) return m.reply('Belum punya pet.')
        const n = r.pet.name; r.pet = null; save(m, r)
        return m.reply(`😿 ${n} dilepas dengan sedih...`)
      }
      if (!r.pet) return m.reply('Belum punya pet. Adopsi: *.pets adopt <nama>*')
      const p = r.pet
      p.hunger = Math.max(0, p.hunger - Math.floor((Date.now() - (p.lastFeed || Date.now())) / 3600000) * 3)
      p.lastFeed = Date.now()
      save(m, r)
      m.reply(boxLines(`PET — ${p.name}`, [
        `│ Jenis : ${p.type}`,
        `│ Level : ${p.level} (EXP ${p.exp}/100)`,
        `│ Kelaparan: ${p.hunger}%`,
        `│ Bond  : ${p.bond}%`,
        `│ Makan : *.feed*`
      ]))
    }
  },

  /* 5. FEED */
  {
    name: 'feed', aliases: ['makanim'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Beriharaanmu makan (butuh potion atau 20g)', usage: '.feed',
    async run(m) {
      const r = need(m); if (!r) return
      if (!r.pet) return m.reply('Belum punya pet. *.pets adopt <nama>*')
      if ((r.inv.potion || 0) >= 1) { r.inv.potion-- }
      else if (r.gold >= 20) r.gold -= 20
      else return m.reply('Butuh 1 potion atau 🪙 20 untuk makanan pet.')
      r.pet.hunger = Math.min(100, (r.pet.hunger || 0) + 30)
      r.pet.bond = Math.min(100, (r.pet.bond || 0) + 3)
      r.pet.exp = (r.pet.exp || 0) + 10
      if (r.pet.exp >= 100) { r.pet.exp = 0; r.pet.level++; }
      save(m, r)
      m.reply(`🍖 ${r.pet.name} dimakan-makan! Kelaparan ${r.pet.hunger}% • Bond ${r.pet.bond}% • Lv.${r.pet.level}`)
    }
  },

  /* 6. PANAHAN (minigame) */
  {
    name: 'panahan', aliases: ['archery'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Panahan: .panahan (mulai) → .panahan <1-10> (3 panah, bullseye jackpot)', usage: '.panahan',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const games = db.load().games
      const sesi = games[m.chat]
      if (args.length && /^\d+$/.test(args[0])) {
        if (!sesi || sesi.type !== 'panahan') return m.reply('Belum mulai. Ketik *.panahan* untuk mulai.')
        const n = parseInt(args[0], 10)
        if (n < 1 || n > 10) return m.reply('Pilih posisi 1-10!')
        sesi.shots++
        const d = Math.abs(n - sesi.target)
        let skor = 0, teks = ''
        if (d === 0) { skor = 300; teks = '🏹 *BULLSEYE!* +300 gold!' }
        else if (d === 1) { skor = 120; teks = '🎯 Meleset tipis! +120 gold' }
        else if (d <= 3) { skor = 50; teks = '👌 Lumayan! +50 gold' }
        else { teks = `💨 Meleset jauh (target di ${sesi.target})...` }
        if (sesi.shots >= 3) {
          delete games[m.chat]
          r.gold += skor
          r.exp = (r.exp || 0) + 10
          save(m, r)
          db.save()
          return m.reply(`${teks}\n🏹 Panah terpakai 3/3 — Saldo: 🪙 ${fmt(r.gold)}`)
        }
        sesi.target = randomInt(1, 10)
        db.save()
        m.reply(`${teks}\nPanah ke-${sesi.shots}/3 selesai. Lanjut: *.panahan <1-10>*`)
        return
      }
      games[m.chat] = { type: 'panahan', target: randomInt(1, 10), shots: 0, by: m.sender }
      db.save()
      m.reply('🏹 *PANAHAN DIMULAI!*\n3 panah, target posisi 1-10.\nTebak: *.panahan <angka>*\n(petunjuk terus muncul tiap panah)')
    }
  },

  /* 7. RAID (dungeon boss sesi) */
  {
    name: 'raid', aliases: ['penyerbuan'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Serang bos raid bertahap sampai mati', usage: '.raid | .raid pukul',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const games = db.load().games
      let sesi = games[m.chat]
      if (!sesi || sesi.type !== 'raid') {
        const boss = pick(['Harimau Iblis', 'Kolumnel Raksasa', 'Lich Pemburu', 'Golem Batu'])
        games[m.chat] = { type: 'raid', boss, hp: 200 + r.level * 40, max: 200 + r.level * 40, turns: 0, by: m.sender }
        db.save()
        return m.reply(`🐗 *RAID DIMULAI* — ${boss}\nHP: ${games[m.chat].hp}\nSerang: *.raid pukul*`)
      }
      if (r.hp <= 1) return m.reply('HP habis! Istirahat dulu: *.camp*')
      const dmg = Math.max(5, r.atk + randomInt(-4, 8))
      sesi.hp -= dmg
      sesi.turns++
      const counter = Math.max(1, Math.floor(sesi.max / 45) + randomInt(0, 6))
      r.hp = Math.max(1, r.hp - counter)
      if (sesi.hp <= 0) {
        const loot = 150 + r.level * 40 + randomInt(0, 100)
        r.gold += loot
        r.inv.potion = (r.inv.potion || 0) + 1
        r.exp = (r.exp || 0) + 30
        r.kills = (r.kills || 0) + 1
        delete games[m.chat]
        save(m, r); db.save()
        return m.reply(`🏆 *RAID MENANG!* ${sesi.boss} tumbang di turn ${sesi.turns}!\n💰 +${fmt(loot)} gold • 🧪 +1 potion • EXP +30\nHP kamu: ${r.hp}/${r.maxHp} (-${counter})`)
      }
      db.save(); save(m, r)
      m.reply(`⚔️ Kamu -${dmg} ke ${sesi.boss} (sisa HP ${sesi.hp})\n${sesi.boss} balas -${counter} (HP kamu ${r.hp})\nLanjut: *.raid pukul*`)
    }
  },

  /* 8. MARKET */
  {
    name: 'market', aliases: ['pasar'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Lihat harga jual item ke bot', usage: '.market',
    async run(m) {
      const r = need(m); if (!r) return
      const rows = Object.entries(SELL_PRICE).map(([k, v]) => `│ ${k} → jual *🪙 ${fmt(v)}* (punya: ${r.inv[k] || 0})`)
      m.reply(boxLines('MARKET — HARGA BELI BOT', rows.concat(['', '│ Jual: .sell <item> [qty]'])))
    }
  },

  /* 9. SELL */
  {
    name: 'sell', aliases: ['jual'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Jual item ke bot', usage: '.sell permata 1',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const item = (args[0] || '').toLowerCase()
      const qty = Math.max(1, parseInt(args[1], 10) || 1)
      const price = SELL_PRICE[item]
      if (!price) return m.reply(`Item tidak bisa dijual. Lihat *.market*`)
      const have = r.inv[item] || 0
      if (have < qty) return m.reply(`Punya ${item} cuma *${have}*.`)
      r.inv[item] -= qty
      const total = price * qty
      r.gold += total
      r.exp = (r.exp || 0) + 3 * qty
      save(m, r)
      m.reply(`💰 Menjual *${item} x${qty}* → +🪙 ${fmt(total)}\nSaldo: 🪙 ${fmt(r.gold)}`)
    }
  },

  /* 10. STEAL */
  {
    name: 'steal', aliases: ['maling'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Curi gold dari karavan — ketahuan kena denda', usage: '.steal',
    async run(m) {
      const r = need(m); if (!r) return
      const now = Date.now()
      if (now - (r.lastSteal || 0) < 480000) return m.reply(`⏳ Maling butuh istirahat ${Math.ceil((480000 - (now - r.lastSteal)) / 60000)} menit lagi.`)
      r.lastSteal = now
      if (randomInt(0, 99) < 45) {
        const gain = randomInt(80, 250) + r.level * 10
        r.gold += gain
        r.exp = (r.exp || 0) + 5
        save(m, r)
        return m.reply(`🥷 *MELACURKAN!* Kamu menyikat karavan...\n💰 +🪙 ${fmt(gain)} • lari terbirit-birit`)
      }
      const fine = Math.min(r.gold, 60)
      r.gold -= fine
      save(m, r)
      return m.reply(`🚨 *KETAHUAN!* Petugas kejar kamu — denda 🪙 ${fmt(fine)}.\nSaldo: ${fmt(r.gold)}`)
    }
  },

  /* 11. SPIN */
  {
    name: 'spin', aliases: ['roda'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Roda keberuntungan (cooldown 12 jam)', usage: '.spin',
    async run(m) {
      const r = need(m); if (!r) return
      const now = Date.now()
      if (now - (r.lastSpin || 0) < 12 * 3600000) {
        return m.reply(`⏳ Roda kembali dalam ${Math.ceil((12 * 3600000 - (now - r.lastSpin)) / 3600000)} jam.`)
      }
      r.lastSpin = now
      const hasil = pick([
        { t: '🪙 100 gold', f: rr => { rr.gold += 100 } },
        { t: '🪙 300 gold', f: rr => { rr.gold += 300 } },
        { t: '🧪 potion x2', f: rr => { rr.inv.potion = (rr.inv.potion || 0) + 2 } },
        { t: '⚗️ eliksir x1', f: rr => { rr.inv.eliksir = (rr.inv.eliksir || 0) + 1 } },
        { t: '✨ EXP +40', f: rr => { rr.exp = (rr.exp || 0) + 40 } },
        { t: '💀 zonk (sial)', f: () => {} }
      ])
      hasil.f(r)
      save(m, r)
      m.reply(`🎰 *SPIN* → ${hasil.t}\nSaldo: 🪙 ${fmt(r.gold)}`)
    }
  },

  /* 12. SCRATCH */
  {
    name: 'scratch', aliases: ['gosok'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Gosok kartu 50g — hadiah 0-500g', usage: '.scratch',
    async run(m) {
      const r = need(m); if (!r) return
      if (r.gold < 50) return m.reply('Butuh 🪙 50 untuk beli kartu gosok.')
      r.gold -= 50
      const roll = randomInt(0, 99)
      let msg
      if (roll < 3) { r.gold += 500; msg = '🎫 *JACKPOT!* +500 gold!' }
      else if (roll < 15) { r.gold += 200; msg = '🎫 +200 gold!' }
      else if (roll < 45) { r.gold += 90; msg = '🎫 +90 gold (balik modal dikit)' }
      else if (roll < 70) { r.gold += 50; msg = '🎫 Modal balik — nol ruginya.' }
      else { msg = '🎫 Kosong... zonk (-50g)' }
      save(m, r)
      m.reply(`${msg}\nSaldo: 🪙 ${fmt(r.gold)}`)
    }
  },

  /* 13. CAMP */
  {
    name: 'camp', aliases: ['kemah'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Kemah: pulihkan HP 60% (cooldown 30 menit)', usage: '.camp',
    async run(m) {
      const r = need(m); if (!r) return
      const now = Date.now()
      if (now - (r.lastCamp || 0) < 1800000) return m.reply(`⏳ Kemah berikutnya dalam ${Math.ceil((1800000 - (now - r.lastCamp)) / 60000)} menit.`)
      r.lastCamp = now
      const heal = Math.floor(r.maxHp * 0.6)
      r.hp = Math.min(r.maxHp, r.hp + heal)
      r.exp = (r.exp || 0) + 5
      save(m, r)
      m.reply(`🏕️ *MENGEMAH* — tidur nyenyak...\nHP +${heal} → *${r.hp}/${r.maxHp}* • EXP +5`)
    }
  },

  /* 14. TOWER */
  {
    name: 'tower', aliases: ['menara'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Daki menara: kalahkan penjaga tiap lantai', usage: '.tower',
    async run(m) {
      const r = need(m); if (!r) return
      r.tower = r.tower || 1
      if (r.hp <= 1) return m.reply('HP habis! *.camp* dulu.')
      const floor = r.tower
      const guardHp = 50 + floor * 25
      const myPower = r.atk * 3 + r.def * 2 + r.level * 5 + randomInt(0, 40)
      const guardPower = guardHp + randomInt(0, 30)
      if (myPower >= guardPower) {
        const loot = 60 + floor * 35
        r.gold += loot
        r.exp = (r.exp || 0) + 20 + floor * 2
        r.hp = Math.max(1, r.hp - randomInt(5, 20))
        r.tower = floor + 1
        save(m, r)
        return m.reply(`🏗️ *LANTAI ${floor} SELESAI!*\nPenjaga '${pick(['Ksatria Bayangan', 'Orc Brutal', 'Penyihir Hitam'])}' kalah.\n💰 +${fmt(loot)} gold • EXP +${20 + floor * 2}\nNaik ke lantai *${floor + 1}*. Lanjut: *.tower*`)
      }
      const dmg = randomInt(15, 40)
      r.hp = Math.max(1, r.hp - dmg)
      save(m, r)
      m.reply(`💀 *KALAH DI LANTAI ${floor}* (penjaga terlalu kuat)\nHP -${dmg} → ${r.hp}/${r.maxHp}\nNaik level / forge dulu, lalu coba lagi: *.tower*`)
    }
  },

  /* 15. WORLDBOSS */
  {
    name: 'worldboss', aliases: ['bossdunia'], category: 'rpg', access: 'user', prefixes: ['.'],
    desc: 'Boss dunia bareng-bareng semua chat: .worldboss [pukul]', usage: '.worldboss pukul',
    async run(m, sock, args) {
      const r = need(m); if (!r) return
      const d = db.load()
      if (!d.settings.worldboss || d.settings.worldboss.hp <= 0) {
        const max = 5000
        d.settings.worldboss = { hp: max, max, born: Date.now(), hitters: {} }
        db.save()
        m.reply(`🐲 *WORLD BOSS MUNCUL!* — Naga Purba\nHP: ${max}\nSerang: *.worldboss pukul*\nSemua orang di semua grup ikut nyerang!`)
        return
      }
      const wb = d.settings.worldboss
      if (!(args[0] || '').toLowerCase().match(/^(pukul|hentak|serang|hit|attack)$/)) {
        const pct = ((wb.hp / wb.max) * 100).toFixed(1)
        return m.reply(boxLines('WORLD BOSS', [
          `│ Naga Purba`,
          `│ HP: *${fmt(wb.hp)} / ${fmt(wb.max)}* (${pct}%)`,
          `│ Serang: *.worldboss pukul*`,
          `│ Bos hilang = hadiah dibagikan ke top hitter`
        ]))
      }
      const now = Date.now()
      const cd = (wb.hitters[m.sender] || 0) + 12000 - now
      if (cd > 0) return m.reply(`⏳ Serangan berikutnya dalam ${Math.ceil(cd / 1000)} detik.`)
      const dmg = Math.max(5, Math.floor(r.atk * 1.5) + randomInt(0, 25))
      wb.hp -= dmg
      wb.hitters[m.sender] = now
      if (!wb.hits) wb.hits = {}
      wb.hits[m.sender] = (wb.hits[m.sender] || 0) + dmg
      if (wb.hp <= 0) {
        const sorted = Object.entries(wb.hits || {}).sort((a, b) => b[1] - a[1])
        const top = sorted[0]?.[0] === m.sender ? 'KAMU ORANGNYA! 🏆' : `pemenang: @${(sorted[0]?.[0] || m.sender).split('@')[0].split(':')[0]}`
        r.gold += 250
        r.inv.eliksir = (r.inv.eliksir || 0) + 1
        r.exp = (r.exp || 0) + 50
        delete d.settings.worldboss
        save(m, r); db.save()
        return m.reply(`🐲 *WORLD BOSS MATI!* Pukulan terakhirmu ${dmg}.\n${top}\nSemua kontributor dapat bonus • kamu +🪙250, +⚗️ eliksir, +50 EXP`)
      }
      db.save(); save(m, r)
      m.reply(`🐲 WORLD BOSS -${dmg} (sisa *${fmt(wb.hp)}*)\nKontribusimu: ${fmt(wb.hits[m.sender])} • cooldown 12 detik`)
    }
  }
]

module.exports = commands
