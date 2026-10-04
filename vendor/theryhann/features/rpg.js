/**
 * 🎮 RPG MENU — petualangan, berburu, menambang, battle, shop
 */
import { config } from '../config.js'
import {
  ITEMS, MONSTERS, getRPG, doActivity, battle, buy, sell,
  inventoryList, equip, unequip, heal, takeItem, hasItem,
  rpgProfileText, expNeeded, bar, catatHarian
} from '../lib/rpg.js'
import { getUser, saveDB } from '../lib/database.js'
import { formatDuration, truncate } from '../lib/functions.js'

const P = config.display.prefix

/* ================= MENU RPG — 3 MODE (v7.7.3) ================= */
export default {
  command: ['rpg', 'petualang', 'adventure', 'game'],
  category: 'RPG Menu',
  description: '🎮 Hub RPG — rpg 1 versi awal · rpg 2 versi perjalanan/misi/kerja · rpg 3 versi bisnis/sosial',
  limit: 0,
  run: async (m) => {
    const r = getRPG(m.senderKey || m.sender)
    const need = expNeeded(r.level)
    const teks =
      `🎮 *RPG — ${config.bot.name}*\n` +
      `Saldo kamu: 💰 *${(r.money || 0).toLocaleString('id-ID')}* · Lv.${r.level} · EXP ${r.exp || 0}/${need}\n\n` +
      `*PILIH MODE RPG KAMU:*\n` +
      `▸ **rpg 1** — game RPG versi awal (hub klasik)\n` +
      `▸ **rpg 2** — game RPG versi perjalanan/misi/kerja\n` +
      `▸ **rpg 3** — game RPG versi bisnis/sosial\n` +
      `▸ **rpg 4** — RPG v7 lanjutan: job/kelas, skill tree, guild, world boss\n\n` +
      `💼 Cari uang cepat: \`${P}kerja\` (16 profesi, gaji + EXP, naik pangkat)\n\n` +
      `Ketik \`${P}rpgmenu1\` / \`${P}rpgmenu2\` / \`${P}rpgmenu3\`, atau ketuk tombol di bawah.\n` +
      `Energi habis? Tunggu regen (1 energi / 2 menit) atau makan \`${P}makan\`.`
    try {
      return await m.sendButtons({
        title: '🎮 RPG — pilih mode',
        text: teks,
        footer: config.bot.footer,
        buttons: [
          { text: '🗿 rpg 1 · versi awal', id: `${P}rpgmenu1` },
          { text: '🧭 rpg 2 · perjalanan / misi / kerja', id: `${P}rpgmenu2` },
          { text: '🏪 rpg 3 · bisnis / sosial', id: `${P}rpgmenu3` },
          { text: '⚔️ rpg 4 · job / guild / boss', id: `${P}rpgmenu4` },
          { text: '💼 kerja · cari gaji', id: `${P}kerja` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

/* ---- rpg 1: hub klasik (isi .rpg yang lama, tidak berubah) ---- */
export const rpgMenu1 = {
  command: ['rpgmenu1', 'rpg1', 'rpgawal', 'menurpg1'],
  category: 'RPG Menu',
  description: '🗿 RPG versi awal — hub klasik (berburu, battle, duel PvP, peti, toko, item, slot RPG)',
  limit: 0,
  run: async (m) => {
    const r = getRPG(m.senderKey || m.sender)
    const need = expNeeded(r.level)
    const text = `${rpgProfileText(m.senderKey || m.sender, m.pushName)}\n\n*🗺️ PILIH AKTIVITAS*\nEnergi habis? Tunggu regen (1 energi / 2 menit) atau makan \`${P}makan\`.\n\nKembali ke pilihan mode: \`${P}rpg\``
    return m.sendList({
      title: '🗿 rpg 1 — RPG versi awal',
      text,
      buttonText: '🗺️ Buka Petualangan',
      sections: [
        {
          title: '💼 Kerja & Penghasilan',
          rows: [
            { title: '💼 Kerja (16 profesi)', description: 'Ojek, kasir, programmer, dokter… gaji + EXP, naik pangkat', id: `${P}kerja` },
            { title: 'ℹ️ Info profesi & pangkat', description: 'Syarat level, gaji, bonus item', id: `${P}kerjainfo` },
            { title: '🧾 Slip gaji', description: 'Riwayat shift & total gaji', id: `${P}gajian` }
          ]
        },
        {
          title: '⛏️ Mengumpulkan Resource',
          rows: [
            { title: '🏹 Berburu', description: '20 energi • daging, kulit, gading', id: `${P}berburu` },
            { title: '⛏️ Menambang', description: '18 energi • batu, besi, emas, berlian', id: `${P}menambang` },
            { title: '🎣 Memancing', description: '12 energi • ikan', id: `${P}memancing` },
            { title: '🪓 Menebang', description: '10 energi • kayu', id: `${P}menebang` }
          ]
        },
        {
          title: '⚔️ Pertarungan',
          rows: [
            { title: '🎲 Battle Random', description: 'Lawan monster acak sesuai level', id: `${P}battle` },
            ...MONSTERS.map((x, i) => ({
              title: `${x.icon} Lawan ${x.name}`,
              description: `HP ${x.hp} • Lv.${x.minLevel}+ • 💰${x.money}`,
              id: `${P}battle ${i + 1}`
            }))
          ]
        },
        {
          title: '⚔️ Duel PvP & 🎁 Peti (BARU!)',
          rows: [
            { title: '⚔️ Tarung (Duel Turn-Based)', description: 'Tantang @user, taruhan koin, serang bergiliran!', id: `${P}tarung` },
            { title: 'ℹ️ Info Duel Aktif', description: 'Papan HP & giliran duel chat ini', id: `${P}duelinfo` },
            { title: '🎁 Peti Harta', description: 'Kayu GRATIS 1×/hari • perak/emas/legenda', id: `${P}peti` },
            { title: '🔓 Buka Peti Kayu', description: 'Gratis harian atau 1.500 koin', id: `${P}bukapeti kayu` }
          ]
        },
        {
          title: '🎒 Item & Toko',
          rows: [
            { title: '🎒 Inventory', description: 'Lihat semua item', id: `${P}inv` },
            { title: '🏪 Toko', description: 'Beli peralatan & ramuan', id: `${P}toko` },
            { title: '💰 Jual Item', description: 'Contoh: .jual ikan 5', id: `${P}jual` },
            { title: '🧪 Pakai Ramuan', description: 'Pulihkan 60 HP', id: `${P}heal` },
            { title: '🍞 Makan', description: 'Pulihkan 40 energi', id: `${P}makan` }
          ]
        },
        {
          title: '🎰 Kasino RPG (uang asli)',
          rows: [
            { title: '🎰 Slot Mesin RPG', description: 'Taruhan koin sungguhan • .slot 500 / 2.5k / all / min', id: `${P}slot 500` },
            { title: '📊 Tabel Hadiah & Peluang', description: 'RTP + statistik putaranmu', id: `${P}slotinfo` },
            { title: '⚙️ Taruhan Bawaan', description: 'Simpan nominal .slot', id: `${P}slotbet` },
            { title: '📜 Riwayat Putaran', description: '8 putaran terakhir', id: `${P}slotriwayat` }
          ]
        },
        {
          title: '📊 Lainnya',
          rows: [
            { title: '🏆 Leaderboard RPG', description: 'Peringkat level tertinggi', id: `${P}rpglb` },
            { title: '💸 Transfer Koin', description: 'Contoh: .transfer @user 1000', id: `${P}transfer` },
            { title: '🏠 Menu Utama', description: '', id: 'act:menu:main' }
          ]
        }
      ]
    }).catch(() => m.sendButtons({
      title: '🎮 RPG Menu',
      text,
      buttons: [
        { text: '💼 Kerja', id: `${P}kerja` },
        { text: '🏹 Berburu', id: `${P}berburu` },
        { text: '⛏️ Menambang', id: `${P}menambang` },
        { text: '⚔️ Battle', id: `${P}battle` },
        { text: '🎒 Inventory', id: `${P}inv` },
        { text: '🏪 Toko', id: `${P}toko` },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    }))
  }
}

/* ================= AKTIVITAS ================= */
const ACT = {
  berburu: { kind: 'hunt', icon: '🏹', label: 'Berburu' },
  menambang: { kind: 'mine', icon: '⛏️', label: 'Menambang' },
  memancing: { kind: 'fish', icon: '🎣', label: 'Memancing' },
  menebang: { kind: 'chop', icon: '🪓', label: 'Menebang' }
}

export const aktivitas = {
  command: ['berburu', 'hunt', 'menambang', 'mine', 'memancing', 'fish', 'menebang', 'chop'],
  category: 'RPG Menu',
  description: 'Kumpulkan resource (butuh energi)',
  limit: 0,
  cooldown: 3,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const cfg = ACT[m.command] || ACT[Object.keys(ACT).find(k => ACT[k].kind === m.command)] || ACT.berburu
    const r = getRPG(key)

    await m.typing()
    const res = doActivity(key, cfg.kind)

    if (!res.ok) {
      if (res.reason === 'cooldown')
        return m.reply(`⏳ Kamu baru saja ${cfg.label.toLowerCase()}. Tunggu *${formatDuration(res.wait)}* lagi.`)
      if (res.reason === 'dead')
        return m.reply(`💀 HP kamu 0! Pakai \`${P}heal\` atau \`${P}makan\` dulu untuk pulih.`)
      if (res.reason === 'energy')
        return m.reply(
          `⚡ Energi tidak cukup.\nButuh *${res.need}*, punya *${res.have}*.\n\nRegen: 1 energi / 2 menit.\nAtau makan: \`${P}makan\``
        )
    }

    let text = `*${cfg.icon} ${res.label.toUpperCase()}*\n\n${res.text}\n`
    if (res.money) text += `\n💰 +${res.money.toLocaleString('id-ID')} koin`
    if (res.exp) text += `\n✨ +${res.exp} EXP`
    text += `\n\n▸ HP: ${res.health}/${r.maxHealth}\n▸ Energi: ${res.energy}/${r.maxEnergy}`

    if (res.leveledUp) {
      text += `\n\n🎉🎉 *LEVEL UP!* 🎉🎉\nKamu naik ke *Level ${res.newLevel}*!\nHP & Energi penuh kembali.`
    }

    const buttons = [
      { text: `${cfg.icon} Lagi`, id: `${P}${m.command}` },
      { text: '🎒 Inventory', id: `${P}inv` },
      { text: '🎮 RPG Menu', id: `${P}rpg` }
    ]
    if (res.leveledUp) buttons.unshift({ text: '⚔️ Battle!', id: `${P}battle` })

    return m.sendButtons({ title: `${cfg.icon} ${res.label}`, text, buttons }).catch(() => m.reply(text))
  }
}

/* ================= BATTLE ================= */
export const battleCmd = {
  command: ['battle', 'serang', 'fight', 'lawan'],
  category: 'RPG Menu',
  description: 'Lawan monster (25 energi)',
  limit: 0,
  cooldown: 3,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const idx = parseInt(m.args[0]) - 1
    const monIdx = !isNaN(idx) && MONSTERS[idx] ? idx : null

    await m.typing()
    const res = battle(key, monIdx)

    if (!res.ok) {
      if (res.reason === 'cooldown') return m.reply(`⏳ Tunggu *${formatDuration(res.wait)}* sebelum battle lagi.`)
      if (res.reason === 'dead') return m.reply(`💀 HP kamu 0! \`${P}heal\` dulu.`)
      if (res.reason === 'energy') return m.reply(`⚡ Butuh *${res.need}* energi, punya *${res.have}*.`)
      if (res.reason === 'level') return m.reply(`🔒 *${res.need === undefined ? '' : MONSTERS[idx]?.name || 'Monster'}* butuh Level ${res.need}. Level kamu ${res.have}.`)
    }

    const mon = res.monster
    let text = res.win
      ? `🎉 *MENANG!* ${mon.icon} *${mon.name}* dikalahkan dalam ${res.round} ronde!\n\n`
      : `💀 *KALAH...* ${mon.icon} *${mon.name}* terlalu kuat.\n\n`

    text += '```\n' + res.log.join('\n') + '\n```\n'

    if (res.win) {
      text += `\n💰 +${res.money.toLocaleString('id-ID')} koin\n✨ +${res.exp} EXP`
      if (res.drop) text += `\n🎁 Drop: ${ITEMS[res.drop].icon} ${ITEMS[res.drop].name}`
      if (res.leveledUp) text += `\n\n🎉 *LEVEL UP → Level ${res.newLevel}!*`
    } else {
      text += `\n🩸 Kehilangan 💰 ${res.lostMoney?.toLocaleString('id-ID') || 0} koin`
      if (res.revived) text += `\n🏥 Kamu diselamatkan dengan HP ${res.health}`
    }
    text += `\n\n▸ HP: ${res.health}\n▸ Energi: ${res.energy}`

    return m.sendButtons({
      title: `⚔️ Battle vs ${mon.icon} ${mon.name}`,
      text,
      buttons: [
        { text: '⚔️ Battle Lagi', id: `${P}battle` },
        { text: '🧪 Heal', id: `${P}heal` },
        { text: '🎮 RPG Menu', id: `${P}rpg` }
      ]
    }).catch(() => m.reply(text))
  }
}

/* ================= INVENTORY ================= */
export const inv = {
  command: ['inv', 'inventory', 'tas', 'rpgprofile', 'profilrpg'],
  category: 'RPG Menu',
  description: 'Lihat inventory & profil RPG',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    if (m.command === 'rpgprofile' || m.command === 'profilrpg') {
      return m.reply(rpgProfileText(key, m.pushName))
    }
    const list = inventoryList(key)
    const r = getRPG(key)
    let text = `*🎒 INVENTORY*\n\n`
    if (!list.length) {
      text += '_Kosong... Ayo kumpulkan resource!_\n'
    } else {
      const total = list.reduce((a, b) => a + b.qty * (b.sell || 0), 0)
      text += list.map(i => `${i.icon} *${i.name}* × ${i.qty}  _(jual: ${((i.sell || 0) * i.qty).toLocaleString('id-ID')})_`).join('\n')
      text += `\n\n▸ Total item: ${list.reduce((a, b) => a + b.qty, 0)}`
      text += `\n▸ Nilai jual semua: 💰 ${total.toLocaleString('id-ID')}`
    }
    text += `\n\n*⚔️ TERPAKAI*\n▸ Weapon: ${r.equipped.weapon ? ITEMS[r.equipped.weapon].icon + ' ' + ITEMS[r.equipped.weapon].name : '-'}\n▸ Armor: ${r.equipped.armor ? ITEMS[r.equipped.armor].icon + ' ' + ITEMS[r.equipped.armor].name : '-'}\n▸ Tool: ${r.equipped.tool ? ITEMS[r.equipped.tool].icon + ' ' + ITEMS[r.equipped.tool].name : '-'}`
    text += `\n\n*💰 Uang:* ${r.money.toLocaleString('id-ID')} koin`
    text += `\n\nCara pakai:\n▸ \`${P}jual <item> <jumlah>\` — jual\n▸ \`${P}equip <item>\` — pakai alat\n▸ \`${P}heal\` — minum ramuan`

    return m.sendButtons({
      title: '🎒 Inventory',
      text,
      buttons: [
        { text: '🏪 Toko', id: `${P}toko` },
        { text: '🎮 RPG Menu', id: `${P}rpg` },
        { text: '🏠 Menu', id: 'act:menu:main' }
      ]
    }).catch(() => m.reply(text))
  }
}

/* ================= TOKO ================= */
export const shop = {
  command: ['toko', 'shop', 'beli', 'buy'],
  category: 'RPG Menu',
  description: 'Beli peralatan, ramuan, makanan',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const r = getRPG(key)

    if (m.command === 'beli' || m.command === 'buy') {
      const [item, qtyRaw] = m.args
      if (!item) return m.reply(`Contoh: \`${P}beli ramuan 2\`\nLihat barang: \`${P}toko\``)
      const found = Object.keys(ITEMS).find(k => k === item.toLowerCase() || ITEMS[k].name.toLowerCase() === item.toLowerCase())
      if (!found) return m.reply(`❌ Item \`${item}\` tidak ada di toko.`)
      const qty = Math.max(1, parseInt(qtyRaw) || 1)
      const res = buy(key, found, qty)
      if (!res.ok) return m.reply(`💰 Uang tidak cukup.\nButuh *${res.need.toLocaleString('id-ID')}*, punya *${res.have.toLocaleString('id-ID')}*.`)
      return m.reply(`✅ Beli *${qty}x ${ITEMS[found].icon} ${ITEMS[found].name}*\n▸ Biaya: ${res.cost.toLocaleString('id-ID')} koin\n▸ Sisa uang: ${res.money.toLocaleString('id-ID')} koin`)
    }

    const sellable = Object.entries(ITEMS).filter(([, v]) => v.buy)
    const text = `*🏪 TOKO ${config.bot.name}*\n\n💰 Uang kamu: *${r.money.toLocaleString('id-ID')} koin*\n\n` +
      sellable.map(([k, v]) => `${v.icon} *${v.name}* — ${v.buy.toLocaleString('id-ID')} koin\n    _${v.type === 'weapon' ? '+35% damage' : v.type === 'armor' ? '-25% damage diterima' : v.type === 'tool' ? '+30% hasil' : v.type === 'consumable' ? 'konsumsi' : ''}_`).join('\n') +
      `\n\nCara beli: \`${P}beli <item> <jumlah>\`\nContoh: \`${P}beli pedang 1\``

    return m.sendList({
      title: '🏪 Toko',
      text,
      buttonText: '🛒 Beli Cepat',
      sections: [{
        title: 'Klik untuk beli 1',
        rows: sellable.map(([k, v]) => ({ title: `${v.icon} ${v.name} — ${v.buy} koin`, description: '', id: `${P}beli ${k} 1` }))
      }]
    }).catch(() => m.reply(text))
  }
}

/* ================= JUAL / EQUIP / HEAL / MAKAN ================= */
export const itemActions = {
  command: ['jual', 'sell', 'equip', 'unequip', 'heal', 'makan', 'eat', 'gunakan'],
  category: 'RPG Menu',
  description: 'Jual item, equip alat, heal, makan',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const r = getRPG(key)

    if (m.command === 'jual' || m.command === 'sell') {
      const [item, qtyRaw] = m.args
      if (!item) {
        const list = inventoryList(key)
        if (!list.length) return m.reply('🎒 Inventory kamu kosong.')
        return m.reply(`*💰 JUAL ITEM*\n\n${list.map(i => `${i.icon} ${i.key} × ${i.qty} — ${i.sell}/satuan`).join('\n')}\n\nContoh: \`${P}jual ikan 5\``)
      }
      const found = Object.keys(ITEMS).find(k => k === item.toLowerCase() || ITEMS[k].name.toLowerCase() === item.toLowerCase())
      if (!found) return m.reply(`❌ Item \`${item}\` tidak dikenal.`)
      const qty = qtyRaw === 'all' || qtyRaw === 'semua' ? (r.inventory[found] || 0) : Math.max(1, parseInt(qtyRaw) || 1)
      const res = sell(key, found, qty)
      if (!res.ok) return m.reply(`❌ Stok kurang. Kamu punya *${res.have}x ${ITEMS[found].name}*.`)
      catatHarian(getRPG(key), 'jual', res.qty)
      return m.reply(`✅ Jual *${res.qty}x ${ITEMS[found].icon} ${ITEMS[found].name}*\n▸ Dapat: 💰 ${res.gain.toLocaleString('id-ID')} koin\n▸ Sisa uang: ${res.money.toLocaleString('id-ID')}`)
    }

    if (m.command === 'equip') {
      const item = m.args[0]
      if (!item) return m.reply(`Contoh: \`${P}equip pedang\``)
      try {
        const found = Object.keys(ITEMS).find(k => k === item.toLowerCase() || ITEMS[k].name.toLowerCase() === item.toLowerCase())
        if (!found) return m.reply(`❌ Item \`${item}\` tidak dikenal.`)
        const slot = equip(key, found)
        return m.reply(`✅ *${ITEMS[found].icon} ${ITEMS[found].name}* terpasang di slot *${slot}*.`)
      } catch (e) {
        return m.reply('❌ ' + e.message)
      }
    }

    if (m.command === 'unequip') {
      const slot = (m.args[0] || '').toLowerCase()
      if (!['weapon', 'armor', 'tool'].includes(slot)) return m.reply(`Contoh: \`${P}unequip weapon|armor|tool\``)
      unequip(key, slot)
      return m.reply(`✅ Slot *${slot}* dikosongkan.`)
    }

    if (m.command === 'heal' || m.command === 'gunakan') {
      if (!hasItem(key, 'ramuan')) return m.reply(`🧪 Kamu tidak punya Ramuan.\nBeli: \`${P}beli ramuan 1\` (500 koin)`)
      if (r.health >= r.maxHealth) return m.reply(`❤️ HP kamu sudah penuh (${r.health}/${r.maxHealth}).`)
      takeItem(key, 'ramuan', 1)
      const now = heal(key, 60)
      return m.reply(`🧪 Minum Ramuan!\n▸ HP: ${now}/${r.maxHealth} (+60)\n▸ Sisa ramuan: ${getRPG(key).inventory.ramuan || 0}`)
    }

    if (m.command === 'makan' || m.command === 'eat') {
      if (!hasItem(key, 'roti') && !hasItem(key, 'ikan') && !hasItem(key, 'daging'))
        return m.reply(`🍞 Tidak ada makanan.\nBeli roti: \`${P}beli roti 1\` (250 koin)\nAtau jual hasil buruan/pancinganmu.`)
      const food = hasItem(key, 'roti') ? 'roti' : hasItem(key, 'daging') ? 'daging' : 'ikan'
      takeItem(key, food, 1)
      const r2 = getRPG(key)
      r2.energy = Math.min(r2.maxEnergy, r2.energy + (food === 'roti' ? 40 : 30))
      r2.health = Math.min(r2.maxHealth, r2.health + 10)
      saveDB('users')
      return m.reply(`${ITEMS[food].icon} Makan *${ITEMS[food].name}*!\n▸ Energi: ${r2.energy}/${r2.maxEnergy}\n▸ HP: ${r2.health}/${r2.maxHealth}`)
    }
  }
}

/* ================= LEADERBOARD RPG ================= */
export const rpgLeaderboard = {
  command: ['rpglb', 'rpgleaderboard'],
  category: 'RPG Menu',
  description: 'Peringkat level RPG tertinggi',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const { allUsers } = await import('../lib/database.js')
    const rows = allUsers()
      .filter(u => u.rpg)
      .map(u => ({ jid: u.jid, rpg: u.rpg }))
      .sort((a, b) => b.rpg.level - a.rpg.level || b.rpg.exp - a.rpg.exp)
      .slice(0, 10)

    if (!rows.length) return m.reply('Belum ada pemain RPG. Jadilah yang pertama! 🎮')
    const medal = ['🥇', '🥈', '🥉']
    const meRank = allUsers()
      .filter(u => u.rpg)
      .map(u => ({ jid: u.jid, rpg: u.rpg }))
      .sort((a, b) => b.rpg.level - a.rpg.level || b.rpg.exp - a.rpg.exp)
      .findIndex(u => u.jid === key) + 1

    const text = `*🏆 LEADERBOARD RPG*\n\n` +
      rows.map((r, i) => `${medal[i] || (i + 1) + '.'} @${r.jid.split('@')[0]} — *Lv.${r.rpg.level}* | 💰${r.rpg.money.toLocaleString('id-ID')} | ⚔️${r.rpg.kills || 0} kill`)
        .join('\n') +
      `\n\n▸ Peringkat kamu: *#${meRank || '-'}*`

    return m.sendButtons({
      title: '🏆 Leaderboard RPG',
      text,
      buttons: [{ text: '🎮 RPG Menu', id: `${P}rpg` }, { text: '⚔️ Battle', id: `${P}battle` }]
    }).catch(() => m.reply(text))
  }
}

/* ================= TRANSFER KOIN ================= */
export const transfer = {
  command: ['transfer', 'tf', 'kirimkoin', 'beri'],
  category: 'RPG Menu',
  description: 'Transfer koin ke user lain',
  limit: 0,
  cooldown: 5,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const target = m.mentioned[0] || m.quoted?.sender || (m.args[0] ? m.args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
    const amountRaw = m.args.filter(a => /^\d+$/.test(a)).pop()
    const amount = parseInt(amountRaw)

    if (!target) return m.reply(`Contoh: \`${P}transfer @user 1000\`\natau tag user lalu \`${P}transfer 1000\``)
    if (!amount || amount <= 0) return m.reply('❌ Jumlah tidak valid.')
    const { sameIdentity } = await import('../lib/identity.js')
    if (sameIdentity(target, key)) return m.reply('❌ Tidak bisa transfer ke diri sendiri.')

    const r = getRPG(key)
    if (r.money < amount) return m.reply(`💰 Koin tidak cukup. Punya *${r.money.toLocaleString('id-ID')}*, mau kirim ${amount.toLocaleString('id-ID')}.`)

    r.money -= amount
    const t = getRPG(target)
    t.money += amount
    saveDB('users')

    return m.reply(`✅ Transfer berhasil!\n\n▸ Ke: @${target.split('@')[0]}\n▸ Jumlah: 💰 ${amount.toLocaleString('id-ID')} koin\n▸ Sisa koin kamu: ${r.money.toLocaleString('id-ID')}`, { mentions: [target] })
  }
}

/* ================= INFO MONSTER ================= */
export const monsterInfo = {
  command: ['monster', 'bestiary', 'listmonster'],
  category: 'RPG Menu',
  description: 'Daftar monster & syarat level',
  limit: 0,
  run: async (m) => {
    const key = m.senderKey || m.sender
    const r = getRPG(key)
    const text = `*👹 BESTIARY — Daftar Monster*\n\nLevel kamu: *${r.level}*\n\n` +
      MONSTERS.map((x, i) => {
        const locked = x.minLevel > r.level
        return `${locked ? '🔒' : x.icon} *${x.name}*\n   HP ${x.hp} • EXP +${x.exp} • 💰 ${x.money}\n   ${locked ? `Butuh Level ${x.minLevel}` : `Siap dilawan → \`${P}battle ${i + 1}\``}`
      }).join('\n\n')
    return m.sendButtons({
      title: '👹 Bestiary',
      text,
      buttons: [{ text: '⚔️ Battle Random', id: `${P}battle` }, { text: '🎮 RPG Menu', id: `${P}rpg` }]
    }).catch(() => m.reply(text))
  }
}
