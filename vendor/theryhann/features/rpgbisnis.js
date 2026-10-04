/**
 * 🏪 RPG BISNIS v7.7.1 — usaha pasif di dunia RPG
 * ------------------------------------------------------------------
 *  Satu sistem dengan RPG: uang (`u.rpg.money`) & EXP dari `lib/rpg.js`.
 *
 *  • .bisnis           — dashboard: bisnismu, akumulasi, toko bisnis
 *  • .belibisnis <jenis>   — beli usaha (maks slot 4)
 *  • .koleksibisnis    — klaim pendapatan yang terkumpul (per JAM,
 *                        akumulasi maks 8 jam/bisnis)
 *  • .upgradebisnis <jenis> — naikkan level (pendapatan naik linier, maks 10)
 *  • .jualbisnis <jenis>   — jual balik (60% modal)
 *
 *  Ekonomi: ROI 7–17 jam/bisnis, akumulasi di-cap 8 jam (online aktif
 *  dibutuhkan), upgrade = 80% × harga × level → tidak pernah kosong omset.
 */
import { config } from '../config.js'
import { getRPG, addExp } from '../lib/rpg.js'
import { saveDB } from '../lib/database.js'
import { formatDuration, truncate } from '../lib/functions.js'

const P = config.display.prefix
const JAM = 3600000
const MAKS_SLOT = 4
const MAKS_LEVEL = 10
const MAKS_AKUM_JAM = 8
const rp = n => 'Rp' + Math.max(0, Math.floor(n || 0)).toLocaleString('id-ID')
const BARIS = '━━━━━━━━━━━━━━━━'

export const JENIS_BISNIS = [
  { id: 'warung',     icon: '🏪', nama: 'Warung Kelontong', dasar: 900,    harga: 6000 },
  { id: 'kudapan',    icon: '🍜', nama: 'Kedai Kudapan',    dasar: 2200,   harga: 16000 },
  { id: 'kopira',     icon: '☕', nama: 'Kedai Kopi',       dasar: 5200,   harga: 42000 },
  { id: 'minimarket', icon: '🛒', nama: 'Minimarket',       dasar: 12300,  harga: 110000 },
  { id: 'bengkel',    icon: '🔧', nama: 'Bengkel Motor',    dasar: 28000,  harga: 300000 },
  { id: 'ternak',     icon: '🐔', nama: 'Peternakan',       dasar: 64000,  harga: 820000 },
  { id: 'pabrik',     icon: '🏭', nama: 'Pabrik Skala Kota', dasar: 145000, harga: 2400000 }
]

const jenisOf = q => {
  q = String(q || '').trim().toLowerCase()
  if (!q) return null
  const n = parseInt(q, 10)
  if (Number.isFinite(n) && n >= 1 && n <= JENIS_BISNIS.length) return JENIS_BISNIS[n - 1]
  return JENIS_BISNIS.find(j => j.id.startsWith(q) || j.nama.toLowerCase().includes(q) || j.nama.toLowerCase().split(' ')[0].startsWith(q)) || null
}

export function bisnisOf (rpg) {
  if (!rpg.bisnis) rpg.bisnis = {}
  return rpg.bisnis
}

/** pendapatan kotor yang sedang terkumpul (REALTIME) */
export function akumulasi (rec, jenis, sekarang = Date.now()) {
  if (!rec?.terakhir) return { jam: 0, hasil: 0 }
  const detik = Math.max(0, sekarang - rec.terakhir)
  const jam = Math.min(MAKS_AKUM_JAM, Math.floor(detik / JAM))
  return { jam, hasil: jam * jenis.dasar * (rec.level || 1) }
}

/** panen: geser 'terakhir' hanya sebanyak jam penuh yang diklaim (sisa waktu terjaga) */
export function panen (rec, jenis, sekarang = Date.now()) {
  const { jam, hasil } = akumulasi(rec, jenis, sekarang)
  if (jam <= 0) return { jam: 0, hasil: 0 }
  rec.terakhir = rec.terakhir + jam * JAM
  return { jam, hasil }
}

function daftarBisnis (rpg) {
  const b = bisnisOf(rpg)
  return JENIS_BISNIS.filter(j => b[j.id])
}

/* ================================================================== */
/*  1. .bisnis — dashboard                                            */
/* ================================================================== */
export const bisnisMenu = {
  command: ['bisnis', 'usaha', 'mybusiness', 'bisnisku', 'usahaku'],
  category: 'RPG Menu',
  description: '🏪 Dashboard bisnis pasif kamu (uang = uang RPG) + toko usaha',
  limit: 0,
  run: m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const punya = daftarBisnis(rpg)
    const skrng = Date.now()
    let punyaTeks = ''
    if (punya.length) {
      let totalAkum = 0
      punyaTeks = punya.map(j => {
        const rec = b[j.id]
        const a = akumulasi(rec, j, skrng)
        totalAkum += a.hasil
        const perjam = j.dasar * (rec.level || 1)
        return `${j.icon} *${j.nama}* · Lv.${rec.level || 1}\n   💰 ${rp(perjam)}/jam · terkumpul *${rp(a.hasil)}*${a.jam === MAKS_AKUM_JAM ? ' _(penuh!)_' : ''}`
      }).join('\n')
      punyaTeks = `*Bisnismu (${punya.length}/${MAKS_SLOT}):*\n${punyaTeks}\n▸ Total siap klaim: *${rp(totalAkum)}* · ketik \`${P}koleksibisnis\``
    } else {
      punyaTeks = '_Kamu belum punya bisnis. Beli dulu dari toko di bawah!_'
    }

    const toko = JENIS_BISNIS.map((j, i) => {
      const sudah = !!b[j.id]
      return `${i + 1}. ${j.icon} *${j.nama}*\n   💰 ${rp(j.dasar)}/jam · harga ${rp(j.harga)}${sudah ? ' · ✅ PUNYA' : ''}`
    }).join('\n')

    const teks =
      `🏪 *DUNIA BISNIS RPG*\n💰 Uangmu: *${rp(rpg.money)}*\n\n` +
      punyaTeks + '\n\n' +
      `*🏬 TOKO USAHA:*\n${toko}\n\n` +
      `▸ beli: \`${P}belibisnis kopira\` · upgrade: \`${P}upgradebisnis kopira\`\n` +
      `▸ klaim: \`${P}koleksibisnis\` (per jam, akumulasi maks ${MAKS_AKUM_JAM} jam)\n` +
      `▸ jual balik 60%: \`${P}jualbisnis kopira\``

    return m.sendButtons({
      title: '🏪 Bisnis RPG',
      text: teks,
      footer: config.bot.footer,
      buttons: punya.length
        ? [
            { text: '💰 Klaim Pendapatan', id: `${P}koleksibisnis` },
            { text: '⬆️ Upgrade', id: `${P}upgradebisnis ${punya[0].id}` },
            { text: '📊 Profil RPG', id: `${P}rpg` }
          ]
        : [
            { text: `${JENIS_BISNIS[0].icon} Beli ${JENIS_BISNIS[0].nama.split(' ')[0]}`, id: `${P}belibisnis ${JENIS_BISNIS[0].id}` },
            { text: `${JENIS_BISNIS[1].icon} Beli ${JENIS_BISNIS[1].nama.split(' ')[0]}`, id: `${P}belibisnis ${JENIS_BISNIS[1].id}` },
            { text: '📊 Profil RPG', id: `${P}rpg` }
          ]
    }).catch(() => m.reply(teks))
  }
}

/* ================================================================== */
/*  2. .belibisnis                                                     */
/* ================================================================== */
export const beliBisnis = {
  command: ['belibisnis', 'buybisnis', 'beliusaha', 'bisnisbeli', 'openbisnis'],
  category: 'RPG Menu',
  description: '🏬 Beli usaha pasif — `.belibisnis warung` (uang dipotong dari RPG)',
  limit: 0,
  run: m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const j = jenisOf(m.q)
    if (!j) {
      return m.reply(`🏬 *TOKO USAHA*\n${JENIS_BISNIS.map((x, i) => `${i + 1}. ${x.icon} ${x.nama} — ${rp(x.dasar)}/jam · ${rp(x.harga)}`).join('\n')}\n\nBeli: \`${P}belibisnis <nama/nomor>\` — contoh \`${P}belibisnis kopira\``)
    }
    if (b[j.id]) return m.reply(`✅ Kamu sudah punya *${j.nama}* (Lv.${b[j.id].level}).\nUpgrade: \`${P}upgradebisnis ${j.id}\``)
    if (Object.keys(b).length >= MAKS_SLOT) return m.reply(`❌ Slot bisnis penuh (${MAKS_SLOT}). Jual salah satu dulu: \`${P}jualbisnis <jenis>\``)
    if ((rpg.money || 0) < j.harga) {
      return m.reply(`❌ Uang kurang. Butuh *${rp(j.harga)}*, kamu punya *${rp(rpg.money)}*.\nCari cuan: \`${P}berburu\` · \`${P}battle\` · jual hasil dengan \`${P}jual\` di toko RPG.`)
    }
    rpg.money -= j.harga
    b[j.id] = { level: 1, terakhir: Date.now(), modal: j.harga }
    saveDB('users')
    return m.reply(
      `🎉 *USAHA BARU — ${j.icon} ${j.nama}!*\n${BARIS}\n` +
      `💰 Pendapatan: *${rp(j.dasar)}/jam* (mulai mengalir sekarang)\n` +
      `💸 Modal keluar: -${rp(j.harga)} → sisa uang *${rp(rpg.money)}*\n\n` +
      `Klaim pendapatan: \`${P}koleksibisnis\`\nUpgrade x2 pendapatan: \`${P}upgradebisnis ${j.id}\`\n` +
      `Cek semua: \`${P}bisnis\``
    )
  }
}

/* ================================================================== */
/*  3. .koleksibisnis — klaim semua akumulasi                          */
/* ================================================================== */
export const koleksiBisnis = {
  command: ['koleksibisnis', 'klaimbisnis', 'collectbisnis', 'panenbisnis', 'takebisnis'],
  category: 'RPG Menu',
  description: '💰 Klaim pendapatan semua bisnis yang terkumpul (per jam, maks akum. 8 jam)',
  limit: 0,
  cooldown: 4,
  run: m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const punya = daftarBisnis(rpg)
    if (!punya.length) return m.reply(`🏪 Kamu belum punya bisnis. Beli di toko: \`${P}bisnis\``)
    const skrng = Date.now()
    let total = 0, jamTotal = 0
    const baris = []
    for (const j of punya) {
      const rec = b[j.id]
      const { jam, hasil } = panen(rec, j, skrng)
      if (hasil > 0) {
        total += hasil; jamTotal += jam
        baris.push(`${j.icon} ${j.nama}: ${jam} jam × ${rp(j.dasar * (rec.level || 1))} = *+${rp(hasil)}*`)
      } else {
        const sisa = JAM - (skrng - (rec.terakhir || skrng))
        baris.push(`${j.icon} ${j.nama}: belum 1 jam penuh (${formatDuration(Math.max(0, sisa))} lagi)`)
      }
    }
    if (!total) {
      return m.reply(`⏳ Pendapatanmu belum terkumpul (per jam).\n${BARIS}\n${baris.join('\n')}\n\nCek: \`${P}bisnis\``)
    }
    rpg.money = (rpg.money || 0) + total
    const up = addExp(m.senderKey || m.sender, jamTotal * 12)
    saveDB('users')
    return m.reply(
      `💰 *PANEN BISNIS — +${rp(total)}* (≈ ${jamTotal} jam × omset)\n${BARIS}\n${baris.join('\n')}\n${BARIS}\n` +
      `💵 Uangmu sekarang: *${rp(rpg.money)}*\n` +
      `✨ +${jamTotal * 12} EXP` + (up?.leveledUp ? ` · ⬆️ NAIK LEVEL → *${up.level}* 🎉` : '') + '\n\n' +
      `Upgrade biar omset x level: \`${P}upgradebisnis ${punya[0].id}\``
    )
  }
}

/* ================================================================== */
/*  4. .upgradebisnis                                                  */
/* ================================================================== */
export const upgradeBisnis = {
  command: ['upgradebisnis', 'naikbisnis', 'upgradeusaha', 'upbisnis', 'growthbisnis'],
  category: 'RPG Menu',
  description: '⬆️ Upgrade usaha (pendapatan × level) — `.upgradebisnis kopira`',
  limit: 0,
  run: m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const j = jenisOf(m.q)
    if (!j) return m.reply(`Contoh: \`${P}upgradebisnis kopira\` — biaya 80% × harga × level sekarang.`)
    const rec = b[j.id]
    if (!rec) return m.reply(`❌ Kamu belum punya *${j.nama}*. Beli dulu: \`${P}belibisnis ${j.id}\``)
    if ((rec.level || 1) >= MAKS_LEVEL) return m.reply(`🏆 *${j.nama}* sudah level MAKS (${MAKS_LEVEL}). Omsetmu sudah puncak!`)
    const biaya = Math.round(j.harga * 0.8 * (rec.level || 1))
    if ((rpg.money || 0) < biaya) {
      return m.reply(`❌ Upgrade *${j.nama}* Lv.${rec.level}→${rec.level + 1} butuh *${rp(biaya)}*, kamu punya *${rp(rpg.money)}*.\nKlaim dulu: \`${P}koleksibisnis\``)
    }
    rpg.money -= biaya
    rec.level = (rec.level || 1) + 1
    rec.modal = (rec.modal || j.harga) + biaya
    saveDB('users')
    const perjam = j.dasar * rec.level
    return m.reply(
      `⬆️ *UPGRADE SUKSES — ${j.icon} ${j.nama} Lv.${rec.level}!*\n${BARIS}\n` +
      `💰 Pendapatan: ${rp(j.dasar * (rec.level - 1))} → *${rp(perjam)}/jam*\n` +
      `💸 Biaya: -${rp(biaya)} → sisa *${rp(rpg.money)}*\n\nKlaim: \`${P}koleksibisnis\`${rec.level >= MAKS_LEVEL ? '\n🏆 Level maksimal tercapai — puncak omset!' : ''}`
    )
  }
}

/* ================================================================== */
/*  5. .jualbisnis                                                     */
/* ================================================================== */
export const jualBisnis = {
  command: ['jualbisnis', 'sellbisnis', 'jualusaha', 'bisnisjual', 'closebisnis'],
  category: 'RPG Menu',
  description: '💸 Jual balik usaha (60% modal terkumpul) — `.jualbisnis kopira`',
  limit: 0,
  run: m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const j = jenisOf(m.q)
    if (!j) return m.reply(`Contoh: \`${P}jualbisnis kopira\` (dijual balik 60% dari modal+upgrade).`)
    const rec = b[j.id]
    if (!rec) return m.reply(`❌ Kamu tidak punya *${j.nama}*.`)
    /* kumpulkan dulu akumulasi supaya tidak hangus */
    const { hasil: akum } = panen(rec, j)
    const modal = rec.modal || j.harga
    const dapat = Math.round(modal * 0.6) + akum
    delete b[j.id]
    rpg.money = (rpg.money || 0) + dapat
    saveDB('users')
    return m.reply(
      `💸 *${j.icon} ${j.nama} terjual!*\n${BARIS}\n` +
      `▸ Harga beli kembali (60% dari ${rp(modal)}): ${rp(Math.round(modal * 0.6))}\n` +
      (akum ? `▸ Akumulasi pendapatan ikut (tak hangus): +${rp(akum)}\n` : '') +
      `${BARIS}\n💵 Total masuk: *+${rp(dapat)}* → uangmu *${rp(rpg.money)}*\n` +
      `Slot kosong — beli usaha lain: \`${P}bisnis\``
    )
  }
}

/* ================================================================== */
/*  rpgmenu3 — hub "rpg 3: versi bisnis/sosial" (v7.7.3)                */
/* ================================================================== */
export const rpgMenu3 = {
  command: ['rpgmenu3', 'rpg3', 'rpgbisnismode', 'rpgbiznis'],
  category: 'RPG Menu',
  description: '🏪 RPG versi bisnis/sosial — usaha pasif, transfer ekonomi, profil sosial',
  limit: 0,
  run: async m => {
    const rpg = getRPG(m.senderKey || m.sender)
    const b = bisnisOf(rpg)
    const daftarBisnisku = JENIS_BISNIS.filter(j => b[j.id])
    const teks =
      `🏪 *rpg 3 — MODE BISNIS / SOSIAL*\n` +
      `💰 Saldo: *${rp(rpg.money)}* · bisnis: ${daftarBisnisku.length}/${MAKS_SLOT}\n\n` +
      `Semua di sini pakai *uang RPG yang sama* dengan duel di rpg 1 / kerja di rpg 2.\n\n` +
      `*USAHA PASIF (cuan per jam):*\n` +
      `▸ ${P}bisnis — dashboard & toko 7 usaha\n` +
      `▸ ${P}belibisnis kopira · ${P}koleksibisnis · ${P}upgradebisnis · ${P}jualbisnis\n\n` +
      `*EKONOMI & SOSIAL:*\n` +
      `▸ ${P}kerja — Kerja shift 16 profesi, gaji + EXP (modal awal usaha)\n` +
      `▸ ${P}transfer @user 1000 — kirim koin ke teman\n` +
      `▸ ${P}toko — beli peralatan · ${P}jual — jual item\n` +
      `▸ ${P}inv — ranselmu · ${P}rpglb — peringkat RPG\n\n` +
      `Kembali pilih mode: \`${P}rpg\``
    try {
      return await m.sendList({
        title: '🏪 rpg 3 — bisnis & sosial',
        text: teks,
        footer: config.bot.footer,
        buttonText: '🏪 Buka Bisnis',
        sections: [{
          title: 'Usaha & Ekonomi',
          rows: [
            { title: '💼 Kerja (gaji tetap)', description: '16 profesi · modal awal buat beli usaha', id: `${P}kerja` },
            { title: '🏪 Dashboard Bisnis', description: 'usaha kamu + toko baru', id: `${P}bisnis` },
            { title: '💰 Klaim Pendapatan', description: 'ambil cuan per jam', id: `${P}koleksibisnis` },
            { title: '🏬 Toko Usaha (beli)', description: '7 jenis usaha', id: `${P}belibisnis` },
            { title: '💸 Transfer Koin', description: '.transfer @user 1000', id: `${P}transfer` },
            { title: '🏪 Toko Barang RPG', description: 'peralatan & ramuan', id: `${P}toko` },
            { title: '💰 Jual Item', description: 'contoh .jual kayu 5', id: `${P}jual` },
            { title: '🎒 Ransel', description: 'inventarismu', id: `${P}inv` },
            { title: '🏆 Peringkat RPG', description: 'level tertinggi', id: `${P}rpglb` }
          ]
        }]
      })
    } catch { return m.reply(teks) }
  }
}

export default { bisnisMenu, beliBisnis, koleksiBisnis, upgradeBisnis, jualBisnis, rpgMenu3, JENIS_BISNIS }
