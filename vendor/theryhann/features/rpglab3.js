/**
 * ⚔️ RPGLAB3 (v7) — 44 fitur RPG: MARKET, MASAK/BUFF, PERMATA, PETERNAKAN,
 *                   RUMAH & DEKORASI, RELIK, MUSIM, REBIRTH, HARIAN, TURNAMEN
 * ----------------------------------------------------------------------------
 *  Semua sistem memakai statistik turunan `stat7()` dari lib/rpg7.js sehingga
 *  saling terhubung:
 *   • Masak/alkimia → buff sementara → menaikkan ATK/DEF/luck/regen
 *   • Permata & relik → bonus permanen selama terpasang
 *   • Peternakan & kebun → bahan masak (telur, susu, sayur, gandum, daun)
 *   • Rumah & dekorasi → regen energi + koin lebih cepat → lebih sering aktivitas
 *   • Musim → memengaruhi hasil panen, loot, dan EXP seluruh server
 *   • Rebirth → pengali permanen semua statistik + poin skill
 *   • Market → jual beli item antar pemain (pajak 5% masuk kas server)
 */
import { config } from '../config.js'
import { truncate, pickRandom, formatDuration } from '../lib/functions.js'
import { saveDB, loadDB, allUsers, getUser } from '../lib/database.js'
import { addExp, addItem, takeItem, ITEMS, getRPG } from '../lib/rpg.js'
import {
  P, K, R7, R7jid, simpan, catat7, stat7, buffAktif, biayaEnergi, koinHadiah, expHadiah,
  kartu7, kirimKartu7, bar7, butuhEnergi, fmt, HARI, MINGGU,
  GEMS, RELICS, RESEP_MASAK, HEWAN, RUMAH, DEKOR, MUSIM, musimIni,
  marketDB, simpanMarket, listings, hargaRata, cariId
} from '../lib/rpg7.js'

const rpg7 = (command, aliases, description, run, contoh = '', opt = {}) => ({
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
const itemNama = id => ITEMS[id] ? `${ITEMS[id].icon} ${ITEMS[id].name}` : id
const rint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
/* kapasitas kandang naik bersama tingkat rumah */
const kapasitasKandang = r => (r.rumah && RUMAH[r.rumah] ? RUMAH[r.rumah].kandang : 4)

/* ================================================================== */
/*  A. MARKET ANTAR PEMAIN (7)                                         */
/* ================================================================== */
export const marketCmds = [
  rpg7('marketjual', ['jualmarket', 'pasangjualan', 'bukaanlapak'], 'Jual item ke market antar pemain', m => {
    const r = R7(m)
    const item = String(m.args?.[0] || '').toLowerCase()
    const harga = parseInt(String(m.args?.[1] || '').replace(/\D/g, ''), 10)
    if (!item || !harga) {
      const inv = Object.entries(r.inventory || {}).filter(([, q]) => q > 0)
      return m.reply(`Format: \`${P}marketjual <item> <harga>\`\nContoh: \`${P}marketjual rubin 2500\`\n\nInventory kamu:\n${inv.slice(0, 20).map(([id, q]) => `▸ ${itemNama(id)} ×${q} (harga toko ${fmt(ITEMS[id]?.sell || 0)})`).join('\n') || '_kosong_'}`)
    }
    if (!ITEMS[item]) return m.reply(`❌ Item tidak dikenal: ${item}\nLihat: \`${P}inv\``)
    if ((r.inventory?.[item] || 0) < 1) return m.reply(`❌ Kamu tidak punya ${itemNama(item)}.`)
    if (harga < 50) return m.reply('❌ Harga minimal 50 koin.')
    if (harga > 5000000) return m.reply('❌ Harga maksimal 5.000.000 koin.')
    const aktif = Object.values(marketDB().listing || {}).filter(l => l.penjual === K(m)).length
    if (aktif >= 5) return m.reply(`❌ Maksimal 5 lapak aktif. Batalkan dulu: \`${P}marketsaya\``)
    takeItem(K(m), item, 1)
    const db = marketDB()
    const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
    db.listing[id] = { item, harga, penjual: K(m), nama: m.pushName || getUser(K(m)).name || 'penjual', dibuat: Date.now() }
    simpanMarket(); catat7(r, `pasang ${item} di market ${fmt(harga)}`); simpan()
    return m.reply(`🛒 *LAPAK DIBUKA*\n\n${itemNama(item)} ×1 → *${fmt(harga)}* koin\nID: \`${id}\`\nPajak saat terjual: 5% (masuk kas server)\n\nLihat lapakmu: \`${P}marketsaya\`\nBatalkan: \`${P}marketbatal ${id}\``)
  }, 'rubin 2500'),

  rpg7('marketbuka', ['bukamarket', 'pasarv7', 'belanjaonline'], 'Lihat semua item yang dijual pemain lain', m => {
    const list = listings()
    if (!list.length) return m.reply(`🛒 *MARKET KOSONG*\n\nBelum ada pemain yang berjualan.\nJual itemmu: \`${P}marketjual rubin 2500\``)
    const q = (m.q || '').toLowerCase()
    const filter = q ? list.filter(l => l.item.includes(q) || (ITEMS[l.item]?.name || '').toLowerCase().includes(q)) : list
    const teks = `🛒 *MARKET PEMAIN* (${filter.length} barang${q ? ` · cari "${q}"` : ''})\n\n${filter.slice(0, 20).map(l => `▸ *${itemNama(l.item)}* — ${fmt(l.harga)} koin\n   penjual ${l.nama} · ID \`${l.id}\``).join('\n')}\n\nBeli: \`${P}marketbeli <id>\`\nJual: \`${P}marketjual <item> <harga>\`\nCari: \`${P}marketbuka rubin\``
    return m.reply(truncate(teks, 3600))
  }, 'rubin'),

  rpg7('marketbeli', ['belimarket', 'ordermarket'], 'Beli barang dari market', m => {
    const id = String(m.args?.[0] || '').trim()
    const db = marketDB()
    const l = db.listing?.[id]
    if (!l) return m.reply(`❌ Lapak tidak ditemukan: "${id}"\n\nLihat market: \`${P}marketbuka\``)
    if (l.penjual === K(m)) return m.reply('❌ Tidak bisa membeli barang sendiri.')
    const r = R7(m)
    if ((r.money || 0) < l.harga) return m.reply(`❌ Koin kurang: butuh ${fmt(l.harga)}, punya ${fmt(r.money)}.`)
    r.money -= l.harga
    addItem(K(m), l.item, 1)
    const penjual = R7jid(l.penjual)
    const bersih = Math.round(l.harga * 0.95)
    penjual.money = (penjual.money || 0) + bersih
    db.riwayat = [{ item: l.item, harga: l.harga, dari: l.nama, ke: m.pushName || 'pembeli', pada: Date.now() }, ...(db.riwayat || [])].slice(0, 30)
    delete db.listing[id]
    simpanMarket(); catat7(r, `beli ${l.item} ${fmt(l.harga)} di market`); simpan()
    return m.reply(`✅ *TRANSAKSI BERHASIL*\n\n${itemNama(l.item)} ×1 → kamu\n-${fmt(l.harga)} koin · sisa ${fmt(r.money)}\n\nPenjual ${l.nama} menerima ${fmt(bersih)} koin (pajak 5% = ${fmt(l.harga - bersih)}).\nRiwayat harga: \`${P}marketharga ${l.item}\``)
  }, 'm123abc'),

  rpg7('marketbatal', ['batallapak', 'hapusjualan', 'tarikmarket'], 'Batalkan lapak & ambil kembali item', m => {
    const id = String(m.args?.[0] || '').trim()
    const db = marketDB()
    const l = db.listing?.[id]
    if (!l) return m.reply(`❌ Lapak tidak ditemukan: "${id}"\nLapakmu: \`${P}marketsaya\``)
    if (l.penjual !== K(m)) return m.reply('❌ Itu lapak orang lain.')
    delete db.listing[id]
    addItem(K(m), l.item, 1)
    simpanMarket()
    return m.reply(`↩️ Lapak dibatalkan. ${itemNama(l.item)} kembali ke inventory.`)
  }, 'm123abc'),

  rpg7('marketsaya', ['lapakku', 'jualanku', 'mylisting'], 'Lihat lapak aktif & riwayat penjualanmu', m => {
    const db = marketDB()
    const punya = Object.entries(db.listing || {}).filter(([, l]) => l.penjual === K(m))
    const riwayat = (db.riwayat || []).filter(r => r.dari === (m.pushName || '') || r.ke === (m.pushName || ''))
    return m.reply(`🛒 *LAPAKKU* (${punya.length}/5)\n\n${punya.length ? punya.map(([id, l]) => `▸ ${itemNama(l.item)} — ${fmt(l.harga)} koin\n   ID \`${id}\` · ${formatDuration(Date.now() - l.dibuat)} lalu · \`${P}marketbatal ${id}\``).join('\n') : '_tidak ada lapak aktif_'}\n\n*Riwayat transaksi terakhir:*\n${riwayat.slice(0, 5).map(r => `▸ ${itemNama(r.item)} ${fmt(r.harga)} · ${r.dari} → ${r.ke}`).join('\n') || '-'}\n\nBuka lapak: \`${P}marketjual rubin 2500\``)
  }),

  rpg7('marketharga', ['hargapasar', 'cekharga', 'pricehistory'], 'Rata-rata harga item di market (10 transaksi terakhir)', m => {
    const item = String(m.args?.[0] || '').toLowerCase()
    if (!item || !ITEMS[item]) return m.reply(`Contoh: \`${P}marketharga rubin\`\n\nItem yang pernah diperdagangkan:\n${[...new Set((marketDB().riwayat || []).map(r => r.item))].slice(0, 20).map(i => `▸ ${itemNama(i)}`).join('\n') || '_belum ada transaksi_'}`)
    const rata = hargaRata(item)
    const jual = listings().filter(l => l.item === item)
    return m.reply(`📈 *HARGA PASAR: ${itemNama(item)}*\n\nRata-rata 10 transaksi terakhir: *${rata ? fmt(rata) : 'belum ada data'}* koin\nHarga toko (jual): ${fmt(ITEMS[item].sell || 0)} · (beli): ${ITEMS[item].buy ? fmt(ITEMS[item].buy) : '-'}\nLapak aktif sekarang: ${jual.length}\n${jual.slice(0, 5).map(l => `▸ ${fmt(l.harga)} — ${l.nama} \`${l.id}\``).join('\n') || ''}\n\n${rata && ITEMS[item].sell ? (rata > ITEMS[item].sell * 1.3 ? '💡 Harga pasar di atas harga toko → **jual ke pemain lebih untung**.' : '💡 Harga pasar mendekati toko → jual ke toko lebih cepat.') : ''}`)
  }, 'rubin'),

  rpg7('marketkartu', ['kartumarket', 'kartupasar'], 'Kartu gambar market + barang termurah', async m => {
    const list = listings()
    const termurah = list.slice(0, 5)
    const buf = await kartu7(m, { judul: '🛒 MARKET PEMAIN', sub: `${list.length} barang dijual · pajak 5%`, footer: `${config.bot.name} · RPG v7`, tema: 'sunset', kataBg: 'market,bazaar,shop', tinggi: 420 })
    return kirimKartu7(m, buf, `🛒 *KARTU MARKET*\n\nBarang dijual: *${list.length}*\n${termurah.length ? '*Termurah:*\n' + termurah.map(l => `▸ ${itemNama(l.item)} — ${fmt(l.harga)} (${l.nama})`).join('\n') : '_belum ada_'}\n\n💰 Koinmu: ${fmt(R7(m).money)}\nJual: \`${P}marketjual <item> <harga>\``, { title: '🛒 Market', buttons: [{ text: '🛒 Buka Market', id: `${P}marketbuka` }, { text: '📦 Lapakku', id: `${P}marketsaya` }] })
  })
]

/* ================================================================== */
/*  B. MASAK, ALKIMIA & BUFF (6)                                       */
/* ================================================================== */
const makananKu = r => (r.makanan = r.makanan || {}, r.makanan)

export const masakCmds = [
  rpg7('resepmasakan', ['daftarresep7', 'resepbuf', 'resepmasakanv7'], 'Daftar 12 resep masakan/alkimia + efek buff', m => {
    const r = R7(m)
    const inv = r.inventory || {}
    const rows = Object.entries(RESEP_MASAK).map(([id, res]) => {
      const cukup = Object.entries(res.bahan).every(([b, q]) => (inv[b] || 0) >= q)
      return `${cukup ? '✅' : '❌'} ${res.icon} *${res.nama}* (\`${id}\`)\n▸ Bahan: ${Object.entries(res.bahan).map(([b, q]) => `${itemNama(b)} ×${q} (${inv[b] || 0})`).join(', ')}\n▸ Efek: ${Object.entries(res.efek).filter(([k]) => k !== 'durasi').map(([k, v]) => v < 1 && v > 0 ? `${k} +${Math.round(v * 100)}%` : `${k} +${v}`).join(' · ')}${res.durasi ? ` selama ${Math.round(res.durasi / 60000)} menit` : ' (langsung)'}\n▸ Nilai jual: ${fmt(res.harga)} koin`
    })
    return m.reply(truncate(`🍳 *RESEP MASAKAN & ALKIMIA (12)*\n\n✅ = bahan lengkap di inventory\n\n${rows.join('\n\n')}\n\nMasak: \`${P}masak nasiGoreng\`\nBahan dari: kebun (\`${P}panen\`), peternakan (\`${P}panenhewan\`), menambang, memancing`, 3800))
  }),

  rpg7('masak', ['memaksak', 'cooking', 'olahmakanan'], 'Masak resep (butuh bahan dari kebun/peternakan)', m => {
    const r = R7(m)
    const id = cariId(RESEP_MASAK, m.args?.[0])
    const res = RESEP_MASAK[id]
    if (!id || !res) return m.reply(`Contoh: \`${P}masak nasiGoreng\`\nDaftar resep: \`${P}resepmasakan\``)
    const kurang = Object.entries(res.bahan).filter(([b, q]) => (r.inventory?.[b] || 0) < q)
    if (kurang.length) return m.reply(`❌ Bahan kurang:\n${kurang.map(([b, q]) => `▸ ${itemNama(b)}: punya ${r.inventory?.[b] || 0}, butuh ${q}`).join('\n')}\n\nCari bahan: \`${P}panen\` · \`${P}panenhewan\` · \`${P}menambang\` · \`${P}memancing\``)
    const st = stat7(K(m))
    if (!butuhEnergi(m, st, 8, 'memasak')) return null
    for (const [b, q] of Object.entries(res.bahan)) takeItem(K(m), b, q)
    const jumlah = 1 + (Math.random() < (st.panen - 1) ? 1 : 0)
    makananKu(r)[id] = (r.makanan[id] || 0) + jumlah
    catat7(r, `masak ${res.nama} ×${jumlah}`)
    simpan()
    return m.reply(`🍳 *MASAK BERHASIL*\n\n${res.icon} ${res.nama} ×${jumlah}${jumlah > 1 ? ' (bonus Farmer/musim!)' : ''}\nBahan terpakai: ${Object.entries(res.bahan).map(([b, q]) => `${itemNama(b)} ×${q}`).join(', ')}\n\nMakan/pakai buff: \`${P}makanbuff ${id}\`\nSimpanan masakan: ${Object.entries(r.makanan).map(([k, v]) => `${RESEP_MASAK[k]?.icon || '🍽️'} ${v}`).join(', ')}`)
  }, 'nasiGoreng'),

  rpg7('makanbuff', ['pakaimasakan', 'gunakanbuff', 'eatbuff'], 'Makan masakan → dapat efek/buff', m => {
    const r = R7(m)
    const id = cariId(RESEP_MASAK, m.args?.[0])
    const res = RESEP_MASAK[id]
    if (!res) return m.reply(`Contoh: \`${P}makanbuff nasiGoreng\`\nSimpananmu: ${Object.entries(r.makanan || {}).map(([k, v]) => `${RESEP_MASAK[k]?.icon} ${k} ×${v}`).join(', ') || '_kosong — masak dulu: ' + P + 'masak_'}`)
    if (!(r.makanan?.[id] > 0)) return m.reply(`❌ Kamu tidak punya ${res.nama}.\nMasak dulu: \`${P}masak ${id}\``)
    r.makanan[id]--
    if (r.makanan[id] <= 0) delete r.makanan[id]
    const st = stat7(K(m))
    const e = res.efek || {}
    let langsung = ''
    if (e.hp) { r.health = Math.min(st.maxHealth, r.health + e.hp); langsung += `❤️ +${e.hp} HP ` }
    if (e.energi) { r.energy = Math.min(st.maxEnergy, r.energy + e.energi); langsung += `⚡ +${e.energi} energi ` }
    if (res.durasi) {
      r.buff.push({ id, nama: res.nama, icon: res.icon, efek: e, sampai: Date.now() + res.durasi })
    }
    catat7(r, `makan ${res.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`${res.icon} *${res.nama.toUpperCase()} DIMAKAN*\n\n${langsung || '(tidak ada efek instan)'}\n${res.durasi ? `✨ Buff aktif ${Math.round(res.durasi / 60000)} menit: ${Object.entries(e).filter(([k]) => !['durasi', 'hp', 'energi'].includes(k)).map(([k, v]) => `${k} +${Math.round(v * 100)}%`).join(' · ') || '-'}` : ''}\n\n📊 Sekarang: ❤️ ${r.health}/${s2.maxHealth} · ⚡ ${r.energy}/${s2.maxEnergy} · ⚔️ ATK ${s2.atk} · 🛡️ DEF ${s2.def} · 🍀 ${s2.luck.toFixed(2)}×\nCek buff: \`${P}buffku\``)
  }, 'nasiGoreng'),

  rpg7('alkimia', ['racikramuan', 'brewpotion', 'buatramuan'], 'Racik ramuan tempur (butuh herbal & bijih)', m => {
    const r = R7(m)
    const st = stat7(K(m))
    const RESEP_ALKIMIA = [
      { id: 'ramuanBesi', butuh: { besi: 2, daun: 2 } },
      { id: 'ramuanKuat', butuh: { emas: 1, daun: 3 } },
      { id: 'elixirJiwa', butuh: { berlian: 1, buah: 3 } }
    ]
    if (!m.args?.[0]) {
      const baris = RESEP_ALKIMIA.map(x => {
        const res = RESEP_MASAK[x.id]
        const cukup = Object.entries(x.butuh).every(([b, q]) => (r.inventory?.[b] || 0) >= q)
        const bahan = Object.entries(x.butuh).map(([b, q]) => itemNama(b) + ' x' + q).join(', ')
        const efek = Object.entries(res.efek).filter(([k]) => k !== 'durasi')
          .map(([k, v]) => k + ' +' + (v < 1 ? Math.round(v * 100) + '%' : v)).join(' · ')
        return (cukup ? '✅' : '❌') + ' ' + res.icon + ' *' + res.nama + '* — ' + bahan +
          '\n   ' + efek + ' (' + Math.round(res.durasi / 60000) + ' menit)'
      }).join('\n\n')
      const teks = '🧪 *ALKIMIA*\n\nRamuan yang bisa diracik:\n' + baris +
        '\n\nRacik: `' + P + 'alkimia ramuanKuat`\nBahan: menambang (`' + P + 'menambang`) + daun herbal (`' + P + 'jelajah hutan`)'
      return m.reply(teks)
    }
    const id = String(m.args?.[0] || '').toLowerCase().replace(/[\s_-]+/g, '')
    const resep = RESEP_ALKIMIA.find(x => x.id.toLowerCase() === id)
    const idResep = cariId(RESEP_MASAK, id)
    if (!resep || !idResep) return m.reply(`❌ Ramuan tidak dikenal: ${m.args[0]}\nPilihan: ${RESEP_ALKIMIA.map(x => x.id).join(', ')}`)
    const kurang = Object.entries(resep.butuh).filter(([b, q]) => (r.inventory?.[b] || 0) < q)
    if (kurang.length) return m.reply(`❌ Bahan kurang:\n${kurang.map(([b, q]) => `▸ ${itemNama(b)}: punya ${r.inventory?.[b] || 0}, butuh ${q}`).join('\n')}`)
    if (!butuhEnergi(m, st, 12, 'meracik ramuan')) return null
    for (const [b, q] of Object.entries(resep.butuh)) takeItem(K(m), b, q)
    const res = RESEP_MASAK[idResep]
    r.buff.push({ id: idResep, nama: res.nama, icon: res.icon, efek: res.efek, sampai: Date.now() + res.durasi })
    catat7(r, `meracik ${res.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`🧪 *RAMUAN DIRACIK & DIMINUM*\n\n${res.icon} ${res.nama} — aktif ${Math.round(res.durasi / 60000)} menit\nEfek: ${Object.entries(res.efek).filter(([k]) => k !== 'durasi').map(([k, v]) => `${k} +${v < 1 ? Math.round(v * 100) + '%' : v}`).join(' · ')}\n\n📊 ⚔️ ${s2.atk} · 🛡️ ${s2.def} · 🍀 ${s2.luck.toFixed(2)}×\n\nManfaatkan sekarang: \`${P}airichbattle\` · \`${P}serangboss\` · \`${P}masukdungeon\``)
  }, 'ramuanKuat'),

  rpg7('masakaninfo', ['infomasakan', 'simpananmakanan', 'dapurku'], 'Lihat simpanan masakan & buff aktif', m => {
    const r = R7(m)
    const mkn = Object.entries(r.makanan || {})
    const buf = buffAktif(r); simpan()
    return m.reply(`🍽️ *SIMPANAN MASAKAN*\n\n${mkn.length ? mkn.map(([id, q]) => `▸ ${RESEP_MASAK[id]?.icon || '🍽️'} ${RESEP_MASAK[id]?.nama || id} ×${q} — \`${P}makanbuff ${id}\``).join('\n') : '_kosong_'}\n\n✨ *BUFF AKTIF* (${buf.length})\n${buf.length ? buf.map(b => `▸ ${b.icon || '✨'} ${b.nama} — sisa ${Math.ceil((b.sampai - Date.now()) / 60000)} menit`).join('\n') : '_tidak ada_'}\n\nMasak: \`${P}masak nasiGoreng\` · Racik: \`${P}alkimia ramuanKuat\``)
  }),

  rpg7('masakkartu', ['kartumasak', 'kartudapur', 'buffkartu'], 'Kartu gambar dapur/masakan', async m => {
    const r = R7(m)
    const buf = await kartu7(m, { judul: '🍳 DAPUR & ALKIMIA', sub: `${Object.keys(r.makanan || {}).length} masakan disimpan · ${buffAktif(r).length} buff aktif`, footer: `${config.bot.name} · RPG v7`, tema: 'sunset', kataBg: 'kitchen,cooking,potion', tinggi: 400 })
    return kirimKartu7(m, buf, `🍳 *KARTU DAPUR*\n\nResep tersedia: ${Object.keys(RESEP_MASAK).length}\nSimpanan: ${Object.entries(r.makanan || {}).map(([k, v]) => `${RESEP_MASAK[k]?.icon} ×${v}`).join(' ') || '-'}\nBuff: ${buffAktif(r).map(b => b.icon).join(' ') || '-'}\n\nResep: \`${P}resepmasakan\``, { title: '🍳 Dapur', buttons: [{ text: '📜 Resep', id: `${P}resepmasakan` }, { text: '✨ Buff-ku', id: `${P}buffku` }] })
  })
]

/* ================================================================== */
/*  C. PERMATA / SOCKET (4)                                            */
/* ================================================================== */
export const gemCmds = [
  rpg7('permata', ['daftargem', 'gems', 'listpermata'], 'Lihat permata yang dimiliki & yang terpasang', m => {
    const r = R7(m)
    const punya = Object.keys(GEMS).filter(g => (r.inventory?.[g] || 0) > 0)
    return m.reply(`💎 *PERMATA*\n\n*Terpasang:*\n▸ 🗡️ Senjata (${r.equipped?.weapon || '-'}): ${r.permata?.weapon ? `${GEMS[r.permata.weapon].icon} ${GEMS[r.permata.weapon].nama} — ${GEMS[r.permata.weapon].desc}` : '_kosong_'}\n▸ 🛡️ Armor (${r.equipped?.armor || '-'}): ${r.permata?.armor ? `${GEMS[r.permata.armor].icon} ${GEMS[r.permata.armor].nama} — ${GEMS[r.permata.armor].desc}` : '_kosong_'}\n\n*Di tas:*\n${punya.length ? punya.map(g => `▸ ${GEMS[g].icon} ${GEMS[g].nama} ×${r.inventory[g]} — ${GEMS[g].desc} (jual ${fmt(GEMS[g].jual)})`).join('\n') : '_tidak ada — cari: ' + P + 'caripermata_'}\n\nPasang: \`${P}pasangpermata rubin weapon\`\nLepas: \`${P}lepaspermata weapon\`\nSemua jenis: ${Object.values(GEMS).map(g => `${g.icon} ${g.nama}`).join(' ')}`)
  }),

  rpg7('pasangpermata', ['socketgem', 'pasanggem', 'gemsocket'], 'Pasang permata ke senjata/armor', m => {
    const r = R7(m)
    const gem = cariId(GEMS, m.args?.[0])
    const slot = String(m.args?.[1] || '').toLowerCase()
    if (!GEMS[gem]) return m.reply(`Contoh: \`${P}pasangpermata rubin weapon\`\nJenis: ${Object.keys(GEMS).join(', ')}\nSlot: weapon, armor`)
    if (!['weapon', 'armor'].includes(slot)) return m.reply(`❌ Slot harus *weapon* atau *armor*.\nContoh: \`${P}pasangpermata rubin weapon\``)
    if (!r.equipped?.[slot]) return m.reply(`❌ Kamu belum equip ${slot === 'weapon' ? 'senjata' : 'armor'}.\nEquip dulu: \`${P}equip pedang besi\``)
    if ((r.inventory?.[gem] || 0) < 1) return m.reply(`❌ Tidak punya ${GEMS[gem].icon} ${GEMS[gem].nama}.\nCari: \`${P}caripermata\` · beli di market: \`${P}marketbuka ${gem}\``)
    const lama = r.permata?.[slot]
    if (lama) { addItem(K(m), lama, 1); }
    takeItem(K(m), gem, 1)
    r.permata = { ...(r.permata || {}), [slot]: gem }
    catat7(r, `pasang ${GEMS[gem].nama} ke ${slot}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`💎 *PERMATA DIPASANG*\n\n${GEMS[gem].icon} ${GEMS[gem].nama} → ${slot === 'weapon' ? '🗡️ senjata' : '🛡️ armor'}\nEfek: ${GEMS[gem].desc}\n${lama ? `Permata lama (${GEMS[lama].icon} ${GEMS[lama].nama}) kembali ke tas.\n` : ''}\n📊 Statistik: ⚔️ ${s2.atk} · 🛡️ ${s2.def} · 🎯 ${Math.round(s2.crit * 100)}% · 🍀 ${s2.luck.toFixed(2)}×`)
  }, 'rubin weapon'),

  rpg7('lepaspermata', ['cabutgem', 'lepasgem', 'gemout'], 'Lepas permata dari slot', m => {
    const r = R7(m)
    const slot = String(m.args?.[0] || '').toLowerCase()
    if (!['weapon', 'armor'].includes(slot)) return m.reply(`Contoh: \`${P}lepaspermata weapon\``)
    const gem = r.permata?.[slot]
    if (!gem) return m.reply(`❌ Slot ${slot} kosong.`)
    delete r.permata[slot]
    addItem(K(m), gem, 1)
    simpan()
    return m.reply(`↩️ ${GEMS[gem].icon} ${GEMS[gem].nama} dilepas dari ${slot} → kembali ke tas.`)
  }, 'weapon'),

  rpg7('caripermata', ['tambangpermata', 'burugem', 'mininggem'], 'Buru permata (25 energi, hasil tergantung luck)', m => {
    const st = stat7(K(m))
    const r = st.r
    if (!butuhEnergi(m, st, 25, 'memburu permata')) return null
    const cd = (r.lastGem || 0) + 300000 - Date.now()
    if (cd > 0) { r.energy += biayaEnergi(st, 25); return m.reply(`⏳ Tunggu ${Math.ceil(cd / 1000)} detik.`) }
    r.lastGem = Date.now()
    const peluang = 0.25 + (st.luck - 1) * 0.35 + (r.stat?.dungeonSelesai || 0) * 0.005
    const roll = Math.random()
    let hasil = ''
    if (roll < peluang * 0.15) {
      addItem(K(m), 'berlianhitam', 1)
      hasil = `⚫ *BERLIAN HITAM!* (+12% ATK/DEF, +5% crit) — sangat langka!`
    } else if (roll < peluang) {
      const g = pickRandom(['rubin', 'safir', 'zamrud', 'topaz', 'ametis'])
      addItem(K(m), g, 1)
      hasil = `${GEMS[g].icon} Dapat *${GEMS[g].nama}* (${GEMS[g].desc})`
    } else if (roll < peluang + 0.3) {
      const bonus = pickRandom(['besi', 'besi', 'emas', 'batu'])
      addItem(K(m), bonus, 2)
      hasil = `⛏️ Belum dapat permata, tapi menemukan ${itemNama(bonus)} ×2`
    } else {
      const koin = Math.round(koinHadiah(st, 400))
      r.money = (r.money || 0) + koin
      hasil = `💰 Lubang kosong, tapi ada ${fmt(koin)} koin terjatuh`
    }
    catat7(r, 'buru permata')
    simpan()
    return m.reply(`⛏️ *BURU PERMATA*\n\n${hasil}\n\n🍀 Luck kamu ${st.luck.toFixed(2)}× (peluang dasar ${Math.round(peluang * 100)}%)\n⚡ Energi -${biayaEnergi(st, 25)} → ${r.energy}/${st.maxEnergy}\nCooldown 5 menit\n\nPasang: \`${P}pasangpermata <gem> weapon\``)
  })
]

/* ================================================================== */
/*  D. PETERNAKAN (6)                                                  */
/* ================================================================== */
export const hewanCmds = [
  rpg7('belihewan', ['beliternak', 'adopthewan', 'belibinatang'], 'Beli hewan ternak (produksi ber-timer)', m => {
    const r = R7(m)
    const jenis = cariId(HEWAN, m.args?.[0])
    if (!jenis || !HEWAN[jenis]) {
      return m.reply(`🐄 *TOKO TERNAK*\n\n${Object.entries(HEWAN).map(([id, h]) => `▸ ${h.icon} *${h.nama}* — ${fmt(h.harga)} koin\n   hasil ${itemNama(h.hasil)} ×${h.jumlah} tiap ${h.jam} jam · pakan ${itemNama(h.pakan)}`).join('\n')}\n\nBeli: \`${P}belihewan ayam\`\nKandangmu: \`${P}kandangku\``)
    }
    const h = HEWAN[jenis]
    if ((r.hewan?.length || 0) >= kapasitasKandang(r)) return m.reply(`❌ Kandang penuh (${kapasitasKandang(r)} hewan). Jual dulu: \`${P}jualhewan 1\`\n\nUpgrade rumah menambah kapasitas: \`${P}upgraderumah\` (kandang ${RUMAH[kapasitasKandang(r) === 4 ? 'gubuk' : 'gubuk'] ? '' : ''}${kapasitasKandang(r)} → lihat \`${P}belirumah\`)`)
    if ((r.money || 0) < h.harga) return m.reply(`❌ Koin kurang: butuh ${fmt(h.harga)}, punya ${fmt(r.money)}.`)
    r.money -= h.harga
    r.hewan = r.hewan || []
    r.hewan.push({ jenis, nama: h.nama, beli: Date.now(), terakhir: Date.now(), kenyang: 0 })
    catat7(r, `beli ${h.nama}`)
    simpan()
    return m.reply(`${h.icon} *${h.nama.toUpperCase()} DIBELI*\n\n-${fmt(h.harga)} koin · sisa ${fmt(r.money)}\nKandang: ${r.hewan.length}/${kapasitasKandang(r)}\n\n⏱️ Produksi ${itemNama(h.hasil)} ×${h.jumlah} tiap *${h.jam} jam*\n🌾 Pakan: ${itemNama(h.pakan)} atau ${itemNama('pakan')} — mempercepat 25%\n\nPanen: \`${P}panenhewan\` · Beri pakan: \`${P}berimakan 1\``)
  }, 'ayam'),

  rpg7('kandangku', ['ternakku', 'hewanku', 'peternakan'], 'Lihat semua hewan & status produksinya', m => {
    const r = R7(m)
    const st = stat7(K(m))
    if (!r.hewan?.length) return m.reply(`🐄 *KANDANG KOSONG*\n\nBeli hewan: \`${P}belihewan ayam\`\nLihat toko ternak: \`${P}belihewan\`\n\nHasil ternak (telur/susu/wol) bisa dijual, dimasak (\`${P}resepmasakan\`), atau dijual di market.`)
    const sekarang = Date.now()
    const rows = r.hewan.map((h, i) => {
      const def = HEWAN[h.jenis]
      const jeda = def.jam * 3600000 * (h.kenyang > sekarang ? 0.75 : 1)
      const siap = sekarang - (h.terakhir || h.beli) >= jeda
      const sisa = Math.max(0, jeda - (sekarang - (h.terakhir || h.beli)))
      return `${i + 1}. ${def.icon} *${h.nama}* ${siap ? '✅ SIAP PANEN' : `⏳ ${formatDuration(sisa)}`}\n   hasil ${itemNama(def.hasil)} ×${Math.round(def.jumlah * st.panen)} · ${h.kenyang > sekarang ? '🌾 kenyang' : 'perlu pakan'}`
    })
    return m.reply(`🐄 *KANDANGKU* (${r.hewan.length}/${kapasitasKandang(r)})\n\n${rows.join('\n')}\n\n🌾 Bonus panen musim ${st.musim.icon} ${st.musim.nama}: ×${st.panen.toFixed(2)}\nPanen semua: \`${P}panenhewan\` · Pakan: \`${P}berimakan\``)
  }),

  rpg7('panenhewan', ['panenternak', 'ambiltelur', 'perahsusu'], 'Panen hasil semua hewan yang siap', m => {
    const r = R7(m)
    const st = stat7(K(m))
    if (!r.hewan?.length) return m.reply(`Kandang kosong. Beli hewan: \`${P}belihewan ayam\``)
    const sekarang = Date.now()
    const dapat = []
    for (const h of r.hewan) {
      const def = HEWAN[h.jenis]
      const jeda = def.jam * 3600000 * (h.kenyang > sekarang ? 0.75 : 1)
      if (sekarang - (h.terakhir || h.beli) >= jeda) {
        const jumlah = Math.max(1, Math.round(def.jumlah * st.panen))
        addItem(K(m), def.hasil, jumlah)
        dapat.push(`${def.icon} ${itemNama(def.hasil)} ×${jumlah}`)
        h.terakhir = sekarang
      }
    }
    if (!dapat.length) return m.reply(`⏳ Belum ada hewan yang siap panen.\nCek waktu: \`${P}kandangku\`\nPercepat dengan pakan: \`${P}berimakan\``)
    catat7(r, `panen ternak ${dapat.length} hewan`)
    simpan()
    return m.reply(`🧺 *PANEN TERNAK*\n\n${dapat.join('\n')}\n\nTotal ${dapat.length} hewan dipanen (bonus ×${st.panen.toFixed(2)} dari Farmer/musim/rumah).\n\nJual: \`${P}jual telur\` · Masak: \`${P}masak nasiGoreng\` · Market: \`${P}marketjual telur 150\``)
  }),

  rpg7('berimakan', ['pakanhewan', 'feedhewan', 'kasihmakan'], 'Beri pakan → produksi 25% lebih cepat (6 jam)', m => {
    const r = R7(m)
    if (!r.hewan?.length) return m.reply(`Kandang kosong. Beli hewan: \`${P}belihewan\``)
    const idx = parseInt(m.args?.[0], 10)
    const target = idx >= 1 && idx <= r.hewan.length ? [r.hewan[idx - 1]] : r.hewan
    const butuhPakan = target.length
    const punyaPakan = r.inventory?.pakan || 0
    const punyaGandum = r.inventory?.gandum || 0
    if (punyaPakan >= butuhPakan) takeItem(K(m), 'pakan', butuhPakan)
    else if (punyaGandum >= butuhPakan) takeItem(K(m), 'gandum', butuhPakan)
    else {
      const koin = butuhPakan * 200
      if ((r.money || 0) < koin) return m.reply(`❌ Butuh ${itemNama('pakan')} ×${butuhPakan} (atau gandum ×${butuhPakan}), atau ${fmt(koin)} koin untuk beli.\n\nBeli pakan: \`${P}toko pakan ${butuhPakan}\``)
      r.money -= koin
    }
    const sampai = Date.now() + 6 * 3600000
    for (const h of target) h.kenyang = sampai
    catat7(r, `beri pakan ${target.length} hewan`)
    simpan()
    return m.reply(`🌾 *PAKAN DIBERIKAN*\n\n${target.length} hewan kenyang 6 jam → produksi *25% lebih cepat*\n${r.inventory?.pakan || r.inventory?.gandum ? 'Pakai pakan dari inventory.' : `Beli pakan otomatis: -${fmt(target.length * 200)} koin`}\n\nCek: \`${P}kandangku\``)
  }, '1'),

  rpg7('hewaninfo', ['infohewan', 'detailhewan', 'ternakinfo'], 'Rincian satu jenis hewan ternak', m => {
    const jenis = cariId(HEWAN, m.args?.[0])
    const h = HEWAN[jenis]
    if (!h) return m.reply(`Contoh: \`${P}hewaninfo sapi\`\nPilihan: ${Object.keys(HEWAN).join(', ')}`)
    const st = stat7(K(m))
    const untung = Math.round((ITEMS[h.hasil]?.sell || 100) * h.jumlah * st.panen / h.jam * 24)
    return m.reply(`${h.icon} *${h.nama.toUpperCase()}*\n\n▸ Harga beli: ${fmt(h.harga)} koin\n▸ Produksi: ${itemNama(h.hasil)} ×${h.jumlah} tiap ${h.jam} jam\n▸ Pakan: ${itemNama(h.pakan)} (atau ${itemNama('pakan')})\n▸ Estimasi pemasukan: ~${fmt(untung)} koin/hari (dengan bonus panen ×${st.panen.toFixed(2)})\n▸ Balik modal: ~${(h.harga / Math.max(1, untung)).toFixed(1)} hari\n\nBeli: \`${P}belihewan ${jenis}\``)
  }, 'sapi'),

  rpg7('jualhewan', ['lepashewan', 'jualternak'], 'Jual hewan ternak (70% harga beli)', m => {
    const r = R7(m)
    const idx = parseInt(m.args?.[0], 10)
    if (!r.hewan?.length) return m.reply('Kandang kosong.')
    if (!(idx >= 1 && idx <= r.hewan.length)) return m.reply(`Pilih nomor hewan (1-${r.hewan.length}).\nLihat: \`${P}kandangku\``)
    const h = r.hewan[idx - 1]
    const harga = Math.round(HEWAN[h.jenis].harga * 0.7)
    r.hewan.splice(idx - 1, 1)
    r.money = (r.money || 0) + harga
    catat7(r, `jual ${h.nama} +${fmt(harga)}`)
    simpan()
    return m.reply(`💰 ${HEWAN[h.jenis].icon} ${h.nama} dijual → +${fmt(harga)} koin (70% harga beli)\nSisa hewan: ${r.hewan.length}/${kapasitasKandang(r)} · koin ${fmt(r.money)}`)
  }, '1')
]

/* ================================================================== */
/*  E. RUMAH & DEKORASI (6)                                            */
/* ================================================================== */
export const rumahCmds = [
  rpg7('belirumah', ['belihouse', 'beliproperti'], 'Beli rumah (bonus regen energi & koin)', m => {
    const r = R7(m)
    const tipe = cariId(RUMAH, m.args?.[0])
    if (!tipe || !RUMAH[tipe]) {
      return m.reply(`🏠 *TOKO PROPERTI*\n\n${Object.entries(RUMAH).map(([id, h]) => `▸ ${h.icon} *${h.nama}* — ${fmt(h.harga)} koin\n   ${h.desc}${r.rumah === id ? '  ← MILIKMU' : ''}`).join('\n')}\n\nBeli: \`${P}belirumah rumah\`\nRumah mempercepat regen energi → lebih sering jelajah/dungeon/boss.`)
    }
    const h = RUMAH[tipe]
    if (r.rumah) return m.reply(`Kamu sudah punya ${RUMAH[r.rumah].icon} *${RUMAH[r.rumah].nama}*.\nUpgrade: \`${P}upgraderumah\``)
    if ((r.money || 0) < h.harga) return m.reply(`❌ Koin kurang: butuh ${fmt(h.harga)}, punya ${fmt(r.money)}.\n\nMenabung: \`${P}bank\` (bunga 1%/hari) · jual hasil panen/ternak`)
    r.money -= h.harga
    r.rumah = tipe
    catat7(r, `beli ${h.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`${h.icon} *RUMAH DIBELI: ${h.nama}*\n\n-${fmt(h.harga)} koin · sisa ${fmt(r.money)}\n${h.desc}\n\n📊 Efek sekarang: 💗 regen ×${s2.regen.toFixed(2)} · 💰 koin ×${s2.koin.toFixed(2)} · slot dekorasi ${h.slot}\n\nDekorasi: \`${P}belidekor lukisan\` → \`${P}dekorasi lukisan\``)
  }, 'rumah'),

  rpg7('rumahku', ['rumahsaya', 'myhouse', 'propertiku'], 'Lihat rumah, dekorasi, dan bonusnya', async m => {
    const r = R7(m)
    const st = stat7(K(m))
    if (!r.rumah) return m.reply(`🏠 *KAMU BELUM PUNYA RUMAH*\n\nTinggal di tenda → regen energi standar.\n\n${Object.entries(RUMAH).map(([id, h]) => `▸ ${h.icon} ${h.nama} — ${fmt(h.harga)} koin (${h.desc})`).join('\n')}\n\nBeli: \`${P}belirumah gubuk\``)
    const h = RUMAH[r.rumah]
    const teks = `${h.icon} *RUMAH: ${h.nama.toUpperCase()}*\n\n${h.desc}\n\n💗 Regen energi/HP: ×${st.regen.toFixed(2)}\n💰 Bonus koin: ×${st.koin.toFixed(2)}\n🪑 Dekorasi terpasang: ${r.dekor.length}/${h.slot}\n${r.dekor.length ? r.dekor.map(d => `▸ ${DEKOR[d].icon} ${DEKOR[d].nama} — ${Object.entries(DEKOR[d]).filter(([k]) => !['nama', 'icon', 'harga'].includes(k)).map(([k, v]) => `${k} +${Math.round(v * 100)}%`).join(' ')}`).join('\n') : '_belum ada dekorasi_'}\n\nUpgrade: \`${P}upgraderumah\` · Dekorasi: \`${P}belidekor lukisan\``
    const buf = await kartu7(m, { judul: `${h.icon} ${h.nama}`, sub: `Regen ×${st.regen.toFixed(2)} · ${r.dekor.length}/${h.slot} dekorasi · koin ×${st.koin.toFixed(2)}`, footer: `${m.pushName || 'Pemilik'} · RPG v7`, tema: 'forest', kataBg: r.rumah === 'kastil' ? 'castle,house,fantasy' : r.rumah === 'villa' ? 'villa,hill,house' : 'cozy,house,home', tinggi: 420 })
    return kirimKartu7(m, buf, teks, { title: `${h.icon} Rumah`, buttons: [{ text: '⬆️ Upgrade', id: `${P}upgraderumah` }, { text: '🪑 Beli Dekorasi', id: `${P}belidekor` }, { text: '🃏 Kartu Rumah', id: `${P}rumahkartu` }] })
  }),

  rpg7('upgraderumah', ['naikkanrumah', 'renovasi'], 'Upgrade rumah ke tingkat berikutnya', m => {
    const r = R7(m)
    const urutan = Object.keys(RUMAH)
    if (!r.rumah) return m.reply(`Kamu belum punya rumah.\nBeli: \`${P}belirumah gubuk\``)
    const idx = urutan.indexOf(r.rumah)
    if (idx >= urutan.length - 1) return m.reply(`🏰 *${RUMAH[r.rumah].nama}* sudah tingkat tertinggi!`)
    const berikutnya = urutan[idx + 1]
    const h = RUMAH[berikutnya]
    const diskon = Math.round(RUMAH[r.rumah].harga * 0.4)
    const bayar = Math.max(1000, h.harga - diskon)
    if ((r.money || 0) < bayar) return m.reply(`❌ Upgrade ke ${h.nama} butuh ${fmt(bayar)} koin (setelah diskon nilai rumah lama ${fmt(diskon)}).\nPunya: ${fmt(r.money)}.`)
    r.money -= bayar
    r.rumah = berikutnya
    catat7(r, `upgrade rumah → ${h.nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`🏗️ *RUMAH DIUPGRADE*\n\n${RUMAH[urutan[idx]].icon} ${RUMAH[urutan[idx]].nama} → *${h.icon} ${h.nama}*\n-${fmt(bayar)} koin (diskon ${fmt(diskon)}) · sisa ${fmt(r.money)}\n\n${h.desc}\n📊 Regen ×${s2.regen.toFixed(2)} · koin ×${s2.koin.toFixed(2)} · slot dekor ${h.slot}`)
  }),

  rpg7('belidekor', ['belidekorasi', 'shopdekor'], 'Beli dekorasi rumah (bonus pasif kecil)', m => {
    const r = R7(m)
    const id = cariId(DEKOR, m.args?.[0])
    if (!id || !DEKOR[id]) {
      return m.reply(`🪑 *TOKO DEKORASI*\n\n${Object.entries(DEKOR).map(([k, d]) => `▸ ${d.icon} *${d.nama}* — ${fmt(d.harga)} koin (${Object.entries(d).filter(([x]) => !['nama', 'icon', 'harga'].includes(x)).map(([x, v]) => `${x} +${Math.round(v * 100)}%`).join(', ')})`).join('\n')}\n\nBeli: \`${P}belidekor lukisan\`\nPasang: \`${P}dekorasi lukisan\`\nSlot: ${r.rumah ? RUMAH[r.rumah].slot : 0} (butuh rumah)`)
    }
    const d = DEKOR[id]
    if (!r.rumah) return m.reply(`❌ Butuh rumah dulu untuk dekorasi.\nBeli: \`${P}belirumah gubuk\``)
    if ((r.dekor?.length || 0) >= RUMAH[r.rumah].slot) return m.reply(`❌ Slot dekorasi penuh (${RUMAH[r.rumah].slot}). Upgrade rumah untuk tambah slot: \`${P}upgraderumah\``)
    if (r.dekor?.includes(id)) return m.reply(`Kamu sudah punya ${d.icon} ${d.nama}.`)
    if ((r.money || 0) < d.harga) return m.reply(`❌ Koin kurang: butuh ${fmt(d.harga)}, punya ${fmt(r.money)}.`)
    r.money -= d.harga
    r.dekor = [...(r.dekor || []), id]
    catat7(r, `beli dekorasi ${d.nama}`)
    simpan()
    return m.reply(`🪑 *${d.icon} ${d.nama} DIBELI & DIPASANG*\n\n-${fmt(d.harga)} koin · sisa ${fmt(r.money)}\nDekorasi: ${r.dekor.length}/${RUMAH[r.rumah].slot}\n\n📊 Bonus total rumah: regen ×${stat7(K(m)).regen.toFixed(2)} · koin ×${stat7(K(m)).koin.toFixed(2)} · luck ×${stat7(K(m)).luck.toFixed(2)}`)
  }, 'lukisan'),

  rpg7('dekorasi', ['lihatdekor', 'listdekorasi'], 'Lihat dekorasi terpasang & efeknya', m => {
    const r = R7(m)
    if (!r.rumah) return m.reply(`Belum punya rumah. Beli: \`${P}belirumah gubuk\``)
    return m.reply(`🪑 *DEKORASI ${RUMAH[r.rumah].nama.toUpperCase()}* (${r.dekor.length}/${RUMAH[r.rumah].slot})\n\n${r.dekor.length ? r.dekor.map(d => `▸ ${DEKOR[d].icon} ${DEKOR[d].nama} — ${Object.entries(DEKOR[d]).filter(([k]) => !['nama', 'icon', 'harga'].includes(k)).map(([k, v]) => `${k} +${Math.round(v * 100)}%`).join(' · ')}`).join('\n') : '_kosong_'}\n\nBeli: \`${P}belidekor lukisan\`\nToko: \`${P}belidekor\``)
  }),

  rpg7('rumahkartu', ['karturumah', 'kartuproperti'], 'Kartu gambar rumahmu', async m => {
    const r = R7(m)
    const st = stat7(K(m))
    const h = r.rumah ? RUMAH[r.rumah] : null
    const buf = await kartu7(m, {
      judul: h ? `${h.icon} ${h.nama}` : '⛺ Tanpa Rumah',
      sub: h ? `${r.dekor.length}/${h.slot} dekorasi · regen ×${st.regen.toFixed(2)} · koin ×${st.koin.toFixed(2)}` : 'Beli rumah untuk bonus regen',
      footer: `${m.pushName || 'Petualang'} · RPG v7`,
      tema: h?.id === 'kastil' ? 'royal' : 'forest',
      kataBg: h ? (h.nama.includes('Kastil') ? 'castle' : h.nama.includes('Villa') ? 'villa' : 'house') : 'tent,camp',
      tinggi: 420
    })
    return kirimKartu7(m, buf, `${h ? `${h.icon} *${h.nama}*` : '⛺ *BELUM ADA RUMAH*'}\n\n${h ? h.desc : 'Beli: ' + P + 'belirumah gubuk'}\n💰 Koin: ${fmt(r.money)}`)
  })
]

/* ================================================================== */
/*  F. RELIK (4)                                                       */
/* ================================================================== */
export const relikCmds = [
  rpg7('relik', ['relic', 'daftarrelik', 'artefak'], 'Lihat relik yang dimiliki & yang dipakai', m => {
    const r = R7(m)
    const dipakai = r.relik?.dipakai ? RELICS[r.relik.dipakai] : null
    return m.reply(`🏺 *RELIK*\n\n*Dipakai:* ${dipakai ? `${dipakai.icon} *${dipakai.nama}* (${dipakai.rarity}) — ${dipakai.desc}` : '_tidak ada_'}\n\n*Dimiliki (${r.relik?.dimiliki?.length || 0}/${Object.keys(RELICS).length}):*\n${Object.entries(RELICS).map(([id, x]) => `${r.relik?.dimiliki?.includes(id) ? '✅' : '❔'} ${x.icon} ${x.nama} (${x.rarity}) — ${x.desc}`).join('\n')}\n\nCari relik: \`${P}carirelik\` (60 energi, butuh Lv.8+)\nPasang: \`${P}pasangrelik <id>\``)
  }),

  rpg7('carirelik', ['bururelik', 'huntrelic', 'ekspedisirelik'], 'Ekspedisi mencari relik (60 energi, Lv.8+)', m => {
    const st = stat7(K(m))
    const r = st.r
    if (r.level < 8) return m.reply(`❌ Butuh Lv.8 untuk ekspedisi relik. Level kamu ${r.level}.`)
    const cd = (r.lastRelic || 0) + 3600000 - Date.now()
    if (cd > 0) return m.reply(`⏳ Ekspedisi berikutnya: ${formatDuration(cd)} lagi.`)
    if (!butuhEnergi(m, st, 60, 'ekspedisi relik')) return null
    r.lastRelic = Date.now()
    const belum = Object.keys(RELICS).filter(id => !(r.relik.dimiliki || []).includes(id))
    const peluang = 0.18 + (st.luck - 1) * 0.25 + (r.stat?.dungeonSelesai || 0) * 0.01
    if (belum.length && Math.random() < peluang) {
      const rarityRoll = Math.random()
      const pool = belum.filter(id => rarityRoll < 0.15 ? RELICS[id].rarity === 'Legendary' : rarityRoll < 0.5 ? RELICS[id].rarity === 'Epic' : true)
      const id = pickRandom(pool.length ? pool : belum)
      r.relik.dimiliki = [...(r.relik.dimiliki || []), id]
      if (!r.relik.dipakai) r.relik.dipakai = id
      catat7(r, `menemukan relik ${RELICS[id].nama}`)
      simpan()
      const s2 = stat7(K(m))
      return m.reply(`🏺✨ *RELIK DITEMUKAN!* \n\n${RELICS[id].icon} *${RELICS[id].nama}* (${RELICS[id].rarity})\n${RELICS[id].desc}\n\n${r.relik.dipakai === id ? '🎯 Langsung dipakai.' : `Pasang: \`${P}pasangrelik ${id}\``}\n📊 ⚔️ ${s2.atk} · 🛡️ ${s2.def} · ❤️ maks ${s2.maxHealth} · 🍀 ${s2.luck.toFixed(2)}×\n\nKoleksi: ${r.relik.dimiliki.length}/${Object.keys(RELICS).length}`)
    }
    const koin = Math.round(koinHadiah(st, rint(1500, 4000)))
    const exp = Math.round(expHadiah(st, rint(150, 400)))
    r.money = (r.money || 0) + koin
    addExp(K(m), exp)
    if (Math.random() < 0.35) addItem(K(m), pickRandom(['peta', 'kuncidungeon', 'ramuanbesar']), 1)
    catat7(r, `ekspedisi relik gagal (+${fmt(koin)})`)
    simpan()
    return m.reply(`🏺 *EKSPEDISI RELIK*\n\nBelum menemukan relik kali ini (peluang ${Math.round(peluang * 100)}%).\nTapi kamu membawa pulang:\n▸ 💰 ${fmt(koin)} koin\n▸ ✨ ${fmt(exp)} EXP\n${Math.random() < 0.35 ? '▸ 🎁 1 item langka\n' : ''}\n⚡ Energi -${biayaEnergi(st, 60)} → ${r.energy}/${st.maxEnergy}\nCooldown 1 jam · naikkan luck untuk peluang lebih besar (\`${P}pasangpermata zamrud armor\`)`)
  }),

  rpg7('pasangrelik', ['pakairelik', 'equiprelik', 'setrelik'], 'Pasang/ganti relik yang dipakai', m => {
    const r = R7(m)
    const id = cariId(RELICS, m.args?.[0])
    if (!RELICS[id]) return m.reply(`Contoh: \`${P}pasangrelik jantungnaga\`\nRelik dimiliki: ${(r.relik?.dimiliki || []).join(', ') || '_tidak ada — cari: ' + P + 'carirelik_'}`)
    if (!(r.relik?.dimiliki || []).includes(id)) return m.reply(`❌ Kamu tidak punya ${RELICS[id].nama}.\nCari: \`${P}carirelik\``)
    r.relik.dipakai = id
    catat7(r, `pasang relik ${RELICS[id].nama}`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`🏺 *RELIK DIPASANG*\n\n${RELICS[id].icon} ${RELICS[id].nama} (${RELICS[id].rarity})\n${RELICS[id].desc}\n\n📊 ⚔️ ${s2.atk} · 🛡️ ${s2.def} · ❤️ maks ${s2.maxHealth} · 🎯 ${Math.round(s2.crit * 100)}% · 🍀 ${s2.luck.toFixed(2)}× · 💗 regen ×${s2.regen.toFixed(2)}`)
  }, 'jantungnaga'),

  rpg7('inforelik', ['detailrelik', 'relikinfo'], 'Rincian satu relik', m => {
    const id = cariId(RELICS, m.args?.[0])
    if (!RELICS[id]) return m.reply(`Contoh: \`${P}inforelik mahkotakuno\`\nDaftar: ${Object.keys(RELICS).join(', ')}`)
    const x = RELICS[id]
    const punya = R7(m).relik?.dimiliki?.includes(id)
    return m.reply(`${x.icon} *${x.nama}*\n\n▸ Rarity: ${x.rarity}\n▸ Efek: ${x.desc}\n▸ Status: ${punya ? '✅ dimiliki' : '❔ belum ditemukan'}\n▸ Sumber: ekspedisi relik (\`${P}carirelik\`), boss dunia, hadiah misi guild\n\n${punya ? `Pasang: \`${P}pasangrelik ${id}\`` : `Cari: \`${P}carirelik\` (60 energi, Lv.8+)`}`)
  }, 'mahkotakuno')
]

/* ================================================================== */
/*  G. MUSIM (2)                                                       */
/* ================================================================== */
export const musimCmds = [
  rpg7('musim', ['season', 'cuacarpg', 'musimrpg'], 'Musim RPG saat ini & efeknya ke seluruh server', m => {
    const st = stat7(K(m))
    const ms = st.musim
    const idx = MUSIM.indexOf(ms)
    const berikut = MUSIM[(idx + 1) % 4]
    const hariGanti = 7 - (Math.floor(Date.now() / 86400000) % 7)
    return m.reply(`${ms.icon} *${ms.nama.toUpperCase()}*\n\n${ms.desc}\n\n*Efek musim ini:*\n▸ 🌾 Hasil panen: ×${(ms.panen || 1).toFixed(2)}\n▸ 🎁 Loot: ×${(ms.loot || 1).toFixed(2)}\n▸ 💰 Koin: ×${(ms.koin || 1).toFixed(2) || '1.00'}\n▸ ✨ EXP: ×${(ms.exp || 1).toFixed(2)}\n\nMusim berganti tiap 7 hari (rotasi 4 musim) — berikutnya: ${berikut.icon} ${berikut.nama} dalam ±${hariGanti} hari.\n\n*Statistikmu termasuk bonus musim:*\n▸ 🌾 Panen ×${st.panen.toFixed(2)} · 🍀 Luck ×${st.luck.toFixed(2)} · 💰 Koin ×${st.koin.toFixed(2)} · ✨ EXP ×${st.exp.toFixed(2)}\n\nManfaatkan: ${ms.panen > 1 ? `\`${P}panen\` & \`${P}panenhewan\` sedang melimpah!` : ms.loot > 1 ? `\`${P}jelajah\` & \`${P}masukdungeon\` sedang menguntungkan!` : `\`${P}masak\` & simpan bahan untuk musim panen.`}`)
  }),

  rpg7('musimbantuan', ['panduanmusim', 'seasonhelp'], 'Penjelasan sistem musim & strategi', m => {
    return m.reply(`🍂 *SISTEM MUSIM RPG v7*\n\nMusim berotasi otomatis tiap 7 hari: ${MUSIM.map(x => `${x.icon} ${x.nama}`).join(' → ')}\n\n${MUSIM.map(x => `*${x.icon} ${x.nama}* — ${x.desc}\n▸ panen ×${(x.panen || 1).toFixed(2)} · loot ×${(x.loot || 1).toFixed(2)} · koin ×${(x.koin || 1).toFixed(2)} · exp ×${(x.exp || 1).toFixed(2)}`).join('\n\n')}\n\n*Strategi:*\n▸ Musim Gugur/Semi → tanam & panen sebanyak mungkin (\`${P}belibibit\`, \`${P}tanam\`)\n▸ Musim Panas → jual hasil panen (harga bagus), farming koin\n▸ Musim Dingin → fokus dungeon/boss (loot & EXP naik), masak untuk buff\n\nCek sekarang: \`${P}musim\``)
  })
]

/* ================================================================== */
/*  H. REBIRTH / PRESTIGE (3)                                          */
/* ================================================================== */
export const rebirthCmds = [
  rpg7('rebirthinfo', ['prestigeinfo', 'informasirebirth', 'rebirthhelp'], 'Penjelasan rebirth (prestige) & bonusnya', m => {
    const r = R7(m)
    const berikut = 1 + (r.rebirth.jumlah + 1) * 0.15
    return m.reply(`🔥 *REBIRTH (PRESTIGE)*\n\nStatus: ${r.rebirth.jumlah}× rebirth · pengali statistik *×${r.rebirth.pengali.toFixed(2)}*\n\n*Syarat:* Lv.20+\n*Yang direset:* level → 1, EXP → 0, HP/energi → dasar\n*Yang DIPERTAHANKAN:* koin, inventory, pet, kebun, rumah, guild, relik, permata, skill (poin ditambah)\n\n*Hadiah tiap rebirth:*\n▸ Pengali permanen ATK/DEF +15% (akumulatif)\n▸ +3 poin skill\n▸ Gelar khusus & 1 relik acak\n▸ Berikutnya: ×${berikut.toFixed(2)}\n\nLakukan: \`${P}rebirth ya\``)
  }),

  rpg7('rebirth', ['prestige', 'lahirkembali', 'resetlevel'], 'Rebirth: reset level demi pengali permanen (Lv.20+)', m => {
    const r = R7(m)
    if (r.level < 20) return m.reply(`❌ Butuh Lv.20 untuk rebirth. Level kamu ${r.level}.\nNaikkan: \`${P}jelajah\`, \`${P}masukdungeon\`, \`${P}serangboss\``)
    if (!/ya|yakin/i.test(m.q || '')) {
      return m.reply(`🔥 *REBIRTH — KONFIRMASI*\n\nAkan mereset level ${r.level} → 1 dan EXP.\n\nKamu dapat: pengali ×${(1 + (r.rebirth.jumlah + 1) * 0.15).toFixed(2)} (ATK/DEF permanen), +3 poin skill, 1 relik acak, gelar 🔥.\n\nKoin, item, pet, rumah, guild TETAP.\n\nKonfirmasi: \`${P}rebirth ya\``)
    }
    const lvlLama = r.level
    r.rebirth.jumlah++
    r.rebirth.pengali = 1 + r.rebirth.jumlah * 0.15
    r.level = 1; r.exp = 0
    r.health = r.maxHealth = 100
    r.energy = r.maxEnergy = 100
    const belum = Object.keys(RELICS).filter(id => !(r.relik.dimiliki || []).includes(id))
    const dapat = belum.length ? pickRandom(belum) : null
    if (dapat) r.relik.dimiliki = [...(r.relik.dimiliki || []), dapat]
    r.prestasi = r.prestasi || { klaim: [], gelar: '' }
    r.prestasi.gelar = `🔥 Reborn ${r.rebirth.jumlah}×`
    catat7(r, `REBIRTH ke-${r.rebirth.jumlah} (dari Lv.${lvlLama})`)
    simpan()
    const s2 = stat7(K(m))
    return m.reply(`🔥✨ *REBIRTH KE-${r.rebirth.jumlah} BERHASIL!*\n\nLv.${lvlLama} → Lv.1 (EXP direset)\n\n*Hadiah:*\n▸ Pengali permanen: ×${r.rebirth.pengali.toFixed(2)} (semua ATK/DEF)\n▸ +3 poin skill → total ${Math.max(0, r.level - 2) + r.rebirth.jumlah * 3} poin\n▸ ${dapat ? `${RELICS[dapat].icon} Relik *${RELICS[dapat].nama}* (${RELICS[dapat].rarity})` : '🏺 (semua relik sudah terkumpul)'}\n▸ Gelar: 🔥 Reborn ${r.rebirth.jumlah}×\n\n📊 Statistik awal baru: ⚔️ ${s2.atk} · 🛡️ ${s2.def} (sudah ×${r.rebirth.pengali.toFixed(2)})\n\nNaik level lagi lebih cepat: \`${P}jelajah\` · \`${P}skill\``)
  }, 'ya'),

  rpg7('rebirthkartu', ['karturebirth', 'kartuprestige'], 'Kartu gambar status rebirth', async m => {
    const r = R7(m)
    const st = stat7(K(m))
    const buf = await kartu7(m, { judul: `🔥 REBORN ${r.rebirth.jumlah}×`, sub: `Lv.${r.level} · pengali ×${r.rebirth.pengali.toFixed(2)} · ATK ${st.atk} · DEF ${st.def}`, footer: `${m.pushName || 'Petualang'} · RPG v7`, tema: 'midnight', kataBg: 'phoenix,fire,rebirth', tinggi: 420 })
    return kirimKartu7(m, buf, `🔥 *KARTU REBIRTH*\n\nRebirth: *${r.rebirth.jumlah}×*\nPengali permanen: ×${r.rebirth.pengali.toFixed(2)}\nPoin skill bonus: ${r.rebirth.jumlah * 3}\nRelik terkumpul: ${r.relik.dimiliki?.length || 0}/${Object.keys(RELICS).length}\nGelar: ${r.prestasi?.gelar || '-'}\n\n${r.level < 20 ? `Lv.20 dibutuhkan untuk rebirth berikutnya (kamu Lv.${r.level})` : `\`${P}rebirth ya\` siap dilakukan!`}`, { title: '🔥 Rebirth', buttons: [{ text: 'ℹ️ Info Rebirth', id: `${P}rebirthinfo` }, { text: '🏺 Relik', id: `${P}relik` }] })
  })
]

/* ================================================================== */
/*  I. HADIAH HARIAN & STREAK (3)                                      */
/* ================================================================== */
const HADIAH_STREAK = [
  { koin: 1000, exp: 80, item: null, label: 'hari ke-1' },
  { koin: 1500, exp: 120, item: 'roti', label: 'hari ke-2' },
  { koin: 2500, exp: 200, item: 'ramuan', label: 'hari ke-3' },
  { koin: 4000, exp: 320, item: 'bibit', label: 'hari ke-4' },
  { koin: 6000, exp: 500, item: 'kuncidungeon', label: 'hari ke-5' },
  { koin: 9000, exp: 750, item: 'telurpet', label: 'hari ke-6' },
  { koin: 15000, exp: 1200, item: 'peta', label: 'hari ke-7 🎁' }
]
export const harianCmds = [
  rpg7('hadiahharian', ['dailyv7', 'klaimharian', 'loginharian'], 'Hadiah harian (streak 7 hari, makin lama makin besar)', m => {
    const r = R7(m)
    const st = stat7(K(m))
    const hariIni = HARI()
    const kemarin = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (r.streak.terakhir === hariIni) {
      const next = new Date(new Date(hariIni + 'T00:00:00Z').getTime() + 86400000)
      return m.reply(`✅ Sudah klaim hari ini (streak ${r.streak.hari} hari).\n\nKembali lagi: ${next.toLocaleTimeString('id-ID', { timeZone: config.timezone || 'Asia/Jakarta' })}\nCek streak: \`${P}streakku\``)
    }
    r.streak.hari = r.streak.terakhir === kemarin ? r.streak.hari + 1 : 1
    r.streak.terakhir = hariIni
    r.streak.terbaik = Math.max(r.streak.terbaik || 0, r.streak.hari)
    const idx = (r.streak.hari - 1) % 7
    const h = HADIAH_STREAK[idx]
    const koin = Math.round(koinHadiah(st, h.koin) * (1 + Math.floor(r.streak.hari / 7) * 0.25))
    const exp = Math.round(expHadiah(st, h.exp))
    r.money = (r.money || 0) + koin
    addExp(K(m), exp)
    if (h.item) addItem(K(m), h.item, 1)
    if (r.streak.hari % 7 === 0) addItem(K(m), pickRandom(['rubin', 'safir', 'zamrud', 'topaz', 'ametis']), 1)
    catat7(r, `hadiah harian streak ${r.streak.hari}`)
    simpan()
    return m.reply(`📅 *HADIAH HARIAN — ${h.label}*\n\n🔥 Streak: *${r.streak.hari} hari* (terbaik ${r.streak.terbaik})\n\n+${fmt(koin)} koin\n+${fmt(exp)} EXP\n${h.item ? `+1 ${itemNama(h.item)}` : ''}\n${r.streak.hari % 7 === 0 ? '+1 💎 permata acak (bonus 7 hari!)' : ''}\n\nBesok: ${HADIAH_STREAK[idx === 6 ? 0 : idx + 1].label} — ${fmt(HADIAH_STREAK[idx === 6 ? 0 : idx + 1].koin)} koin\n\nJangan putus! Cek: \`${P}streakku\``)
  }),

  rpg7('streakku', ['cekstreak', 'streaklogin', 'absenrpg'], 'Lihat streak harian & kalender hadiah', m => {
    const r = R7(m)
    const hariIni = HARI()
    const kemarin = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const aktif = r.streak.terakhir === hariIni
    const idx = (r.streak.hari - 1 + 7) % 7
    return m.reply(`🔥 *STREAK HARIAN: ${r.streak.hari} hari*\n\nStatus hari ini: ${aktif ? '✅ sudah klaim' : r.streak.terakhir === kemarin ? '⏳ bisa klaim sekarang' : '⚠️ streak akan reset kalau tidak klaim hari ini'}\nStreak terbaik: ${r.streak.terbaik || 0} hari\n\n*Kalender hadiah 7 hari:*\n${HADIAH_STREAK.map((h, i) => `${i === idx ? '➡️' : i < idx ? '✅' : '🔒'} ${h.label}: ${fmt(h.koin)} koin + ${fmt(h.exp)} EXP${h.item ? ` + ${itemNama(h.item)}` : ''}`).join('\n')}\n\nBonus tiap 7 hari: 💎 permata acak + hadiah ×${(1 + Math.floor(r.streak.hari / 7) * 0.25).toFixed(2)}\n\nKlaim: \`${P}hadiahharian\``)
  }),

  rpg7('streaklb', ['leaderboardstreak', 'topstreak', 'rankstreak'], 'Peringkat streak harian pemain', m => {
    const list = allUsers().filter(u => u.rpg?.streak?.hari).sort((a, b) => (b.rpg.streak.terbaik || 0) - (a.rpg.streak.terbaik || 0)).slice(0, 10)
    if (!list.length) return m.reply(`Belum ada yang klaim hadiah harian.\nMulai: \`${P}hadiahharian\``)
    return m.reply(`🔥 *PERINGKAT STREAK*\n\n${list.map((u, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${u.name || String(u.jid || 'pemain').split('@')[0].slice(-6)} — terbaik ${u.rpg.streak.terbaik} hari (sekarang ${u.rpg.streak.hari})`).join('\n')}\n\nStreak kamu: ${R7(m).streak.hari} hari (terbaik ${R7(m).streak.terbaik || 0})`)
  })
]

/* ================================================================== */
/*  J. TURNAMEN MINGGUAN (3)                                           */
/* ================================================================== */
function skorTurnamen (st) {
  return Math.round(st.atk * 3 + st.def * 2.5 + st.maxHealth * 1.2 + st.r.level * 25 + Object.keys(st.r.skill?.dimiliki || {}).length * 40 + (st.r.relik?.dimiliki?.length || 0) * 60 + (st.r.rebirth?.jumlah || 0) * 150)
}
const BIAYA_TURNAMEN = 2000
function turnamenDB () { return loadDB('turnamen', { minggu: MINGGU(), peserta: {}, selesai: null }) }
/* gulir minggu: bagikan hadiah 3 besar ke pemenang, simpan arsip, lalu reset */
function gulirTurnamen () {
  const db = turnamenDB()
  if (db.minggu === MINGGU()) return { db, juara: null }
  const peserta = Object.entries(db.peserta || {}).map(([jid, p]) => ({ jid, ...p })).sort((a, b) => b.skor - a.skor)
  let juara = null
  if (peserta.length) {
    const kolam = Math.round(peserta.length * BIAYA_TURNAMEN * 0.6)
    const bagi = [0.5, 0.3, 0.2]
    juara = peserta.slice(0, 3).map((p, i) => {
      const hadiah = Math.round(kolam * bagi[i])
      const u = R7jid(p.jid)
      u.money = (u.money || 0) + hadiah
      catat7(u, `juara ${i + 1} turnamen ${db.minggu} +${fmt(hadiah)}`)
      return { ...p, hadiah }
    })
    simpan()
    const arsip = loadDB('turnamenarsip', [])
    if (Array.isArray(arsip)) {
      arsip.unshift({ minggu: db.minggu, peserta: peserta.length, kolam, juara: juara.map(j => ({ nama: j.nama, skor: j.skor, hadiah: j.hadiah })) })
      if (arsip.length > 8) arsip.length = 8
      saveDB('turnamenarsip')
    }
  }
  db.minggu = MINGGU(); db.peserta = {}; db.selesai = Date.now()
  saveDB('turnamen')
  return { db, juara }
}

export const turnamenCmds = [
  rpg7('turnamenv7', ['arenamingguan', 'kompetisi', 'turnamenrpg'], 'Turnamen mingguan: adu statistik karakter', m => {
    const { db, juara } = gulirTurnamen()
    const st = stat7(K(m))
    if (juara?.length) {
      const info = `🏁 *TURNAMEN MINGGU LALU SELESAI*\n${juara.map((j, i) => `${['🥇', '🥈', '🥉'][i]} ${j.nama} — ${fmt(j.skor)} → +${fmt(j.hadiah)} koin`).join('\n')}\n\n`
      m.reply(truncate(info + 'Musim baru dimulai. Daftar lagi: `' + P + 'ikutturnamen`', 500))
    }
    const peserta = Object.entries(db.peserta).map(([jid, p]) => ({ jid, ...p })).sort((a, b) => b.skor - a.skor)
    const aku = peserta.find(p => p.jid === K(m))
    const skorku = skorTurnamen(st)
    const hariSisa = 7 - new Date().getUTCDay()
    return m.reply(`🏟️ *TURNAMEN MINGGUAN*\n\nMinggu: ${db.minggu} · ditutup ${hariSisa} hari lagi\nBiaya daftar: 2.000 koin · hadiah 60% kolam dibagi 3 besar\n\n*Skor karaktermu:* ${fmt(skorku)}\n(rumus: ATK×3 + DEF×2.5 + HP×1.2 + Lv×25 + skill×40 + relik×60 + rebirth×150)\n\n*Peserta: ${peserta.length}*\n${peserta.slice(0, 10).map((p, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${p.nama} — ${fmt(p.skor)}${p.jid === K(m) ? ' ← kamu' : ''}`).join('\n') || '_belum ada peserta_'}\n\n${aku ? '✅ Kamu sudah terdaftar.' : `Daftar: \`${P}ikutturnamen\` (2.000 koin)`}\nKolam hadiah saat ini: ${fmt(peserta.length * 2000 * 0.6)} koin`)
  }),

  rpg7('ikutturnamen', ['daftartertunamen', 'jointurnamen', 'turnamendaftar'], 'Daftar turnamen mingguan (2.000 koin)', m => {
    const { db } = gulirTurnamen()
    const r = R7(m)
    if (db.peserta[K(m)]) return m.reply(`✅ Sudah terdaftar minggu ini (skor ${fmt(db.peserta[K(m)].skor)}).\n\nPerbarui skor setelah upgrade: \`${P}ikutturnamen\`\nLihat peringkat: \`${P}turnamenv7\``)
    if ((r.money || 0) < BIAYA_TURNAMEN) return m.reply(`❌ Biaya daftar ${fmt(BIAYA_TURNAMEN)} koin. Punya ${fmt(r.money)}.`)
    r.money -= BIAYA_TURNAMEN
    const st = stat7(K(m))
    db.peserta[K(m)] = { nama: m.pushName || getUser(K(m)).name || K(m).split('@')[0].slice(-6), skor: skorTurnamen(st), pada: Date.now(), level: st.r.level }
    saveDB('turnamen'); catat7(r, 'daftar turnamen mingguan'); simpan()
    return m.reply(`🏟️ *TERDAFTAR DI TURNAMEN*\n\n-${fmt(BIAYA_TURNAMEN)} koin · sisa ${fmt(r.money)}\nSkor kamu: *${fmt(db.peserta[K(m)].skor)}*\nPeserta: ${Object.keys(db.peserta).length}\n\n*Naikkan skor sebelum ditutup:*\n▸ Naik level → \`${P}jelajah\`\n▸ Skill → \`${P}belajarskill\`\n▸ Relik → \`${P}carirelik\`\n▸ Permata → \`${P}pasangpermata\`\n▸ Rebirth → \`${P}rebirthinfo\`\n\nPerbarui skor: \`${P}ikutturnamen\` · Hadiah dibagikan otomatis tiap Senin UTC`)
  }),

  rpg7('turnamenlb', ['leaderboardturnamen', 'rankturnamen', 'hasiltertunamen'], 'Peringkat & pemenang turnamen (minggu ini + arsip)', m => {
    const { db } = gulirTurnamen()
    const peserta = Object.entries(db.peserta).map(([jid, p]) => ({ jid, ...p })).sort((a, b) => b.skor - a.skor)
    const arsipRaw = loadDB('turnamenarsip', [])
    const arsip = (Array.isArray(arsipRaw) ? arsipRaw : []).slice(0, 3)
    const kolam = Math.round(peserta.length * BIAYA_TURNAMEN * 0.6)
    return m.reply(`🏆 *TURNAMEN ${db.minggu}*\n\nPeserta: ${peserta.length} · kolam hadiah ${fmt(kolam)} koin\n\n${peserta.length ? peserta.slice(0, 10).map((p, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${p.nama} (Lv.${p.level}) — ${fmt(p.skor)}`).join('\n') : '_belum ada peserta_'}\n\nPembagian hadiah: 🥇 50% · 🥈 30% · 🥉 20% (otomatis tiap Senin UTC)\n\n*Juara sebelumnya:*\n${arsip.length ? arsip.map(a => `▸ ${a.minggu}: ${a.juara.map((j, i) => `${['🥇', '🥈', '🥉'][i]} ${j.nama} (+${fmt(j.hadiah)})`).join(' · ')}`).join('\n') : '_belum ada_'}\n\nDaftar: \`${P}ikutturnamen\``)
  })
]

/* ================================================================== */
/*  K. KARTU RANGKUMAN v7 (1)                                          */
/* ================================================================== */
export const kartuV7 = [
  rpg7('kartuv7', ['rpgkartuv7', 'kartulengkap', 'kartuv7lengkap'], 'Kartu rangkuman semua sistem RPG v7', async m => {
    const r = R7(m)
    const st = stat7(K(m))
    const g = (() => { try { return loadDB('guilds', {})[r.guild?.id] } catch { return null } })()
    const buf = await kartu7(m, {
      judul: `⚔️ RPG v7 — Lv.${r.level}`,
      sub: `${st.job ? st.job.icon + ' ' + st.job.nama : '🎭 tanpa kelas'} · 🔥 rebirth ${r.rebirth.jumlah}× · ${g ? '🏰 ' + g.nama : '🏰 tanpa guild'}`,
      footer: `${m.pushName || 'Petualang'} · ${config.bot.name}`,
      tema: 'royal', kataBg: 'hero,fantasy,adventure', tinggi: 460
    })
    const teks = `🃏 *KARTU LENGKAP RPG v7*\n\n🎭 Job: ${st.job ? st.job.nama : '-'} · 🌳 Skill ${Object.keys(r.skill.dimiliki || {}).length}/12\n🏰 Guild: ${g ? g.nama : '-'} · 🔥 Rebirth ${r.rebirth.jumlah}× (×${r.rebirth.pengali.toFixed(2)})\n🏠 Rumah: ${r.rumah ? RUMAH[r.rumah].nama : '-'} · 🐄 Hewan ${r.hewan?.length || 0}/${kapasitasKandang(r)}\n🏺 Relik: ${r.relik.dipakai ? RELICS[r.relik.dipakai].nama : '-'} · 💎 Permata ${Object.values(r.permata || {}).filter(Boolean).length}/2\n🍳 Masakan: ${Object.values(r.makanan || {}).reduce((a, b) => a + b, 0)} · ✨ Buff ${buffAktif(r).length}\n🔥 Streak: ${r.streak.hari} hari\n\n📊 ⚔️ ${st.atk} · 🛡️ ${st.def} · ❤️ ${r.health}/${st.maxHealth} · ⚡ ${r.energy}/${st.maxEnergy}\n🎯 crit ${Math.round(st.crit * 100)}% · 🍀 luck ${st.luck.toFixed(2)}× · 💰 koin ${fmt(r.money)} · ${st.musim.icon} ${st.musim.nama}`
    return kirimKartu7(m, buf, teks, { title: '🃏 RPG v7', buttons: [{ text: '⚔️ Menu RPG v7', id: `${P}rpgmenu3` }, { text: '🎭 Job', id: `${P}jobku` }, { text: '🌳 Skill', id: `${P}skill` }] })
  })
]

export default { marketCmds, masakCmds, gemCmds, hewanCmds, rumahCmds, relikCmds, musimCmds, rebirthCmds, harianCmds, turnamenCmds, kartuV7 }
