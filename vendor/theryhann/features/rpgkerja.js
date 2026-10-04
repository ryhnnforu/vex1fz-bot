/**
 * 💼 RPG KERJA (v7.8.3) — sistem profesi, gaji, cooldown & pangkat
 * -----------------------------------------------------------------
 *  .kerja                → menu pekerjaan (list) + status shift kamu
 *  .kerja <profesi>      → kerja 1 shift (energi ↓, koin & EXP ↑, cooldown 30 mnt)
 *  .kerjainfo            → rincian profesi, syarat level, gaji, pangkat
 *  .resign               → berhenti dari profesi sekarang (pangkat hilang)
 *  .gajian               → riwayat & total gaji seumur akun
 *
 *  Data disimpan di users.json → u.rpg.kerja = { profesi, shift, pangkat,
 *  totalGaji, lastWork, riwayat[] }.  Semua koin masuk r.money (dipakai
 *  toko, kasino RPG, transfer, bisnis) → terintegrasi penuh.
 *
 *  Pangkat naik tiap N shift: gaji ×(1 + 0.12 × pangkat). Profesi tinggi
 *  butuh level RPG tertentu. Ada peluang "bonus" & "apes" acak kecil.
 */
import { config } from '../config.js'
import { getRPG, addExp, addMoney, useEnergy, expNeeded, catatHarian, addItem, ITEMS } from '../lib/rpg.js'
import { saveDB } from '../lib/database.js'
import { formatDuration, truncate, pickRandom } from '../lib/functions.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender
const COOLDOWN = 30 * 60 * 1000
const rp = n => Math.max(0, Math.floor(n || 0)).toLocaleString('id-ID')

export const PROFESI = [
  { id: 'ojek', icon: '🛵', nama: 'Ojek Online', level: 1, energi: 10, gaji: [250, 600], exp: [8, 14], cerita: ['antar penumpang ke stasiun', 'orderan makanan 3 titik', 'jemput anak sekolah', 'antar paket ke komplek'] },
  { id: 'kasir', icon: '🧾', nama: 'Kasir Minimarket', level: 1, energi: 10, gaji: [300, 650], exp: [8, 14], cerita: ['shift pagi ramai', 'stok opname malam', 'promo beli 2 gratis 1', 'ngitung uang setoran'] },
  { id: 'petani', icon: '🌾', nama: 'Petani', level: 2, energi: 14, gaji: [350, 800], exp: [10, 18], item: ['gandum', 'sayur'], cerita: ['panen padi sawah timur', 'nyabut rumput seharian', 'bajak sawah pakai traktor', 'jaga burung di sawah'] },
  { id: 'nelayan', icon: '🚤', nama: 'Nelayan', level: 3, energi: 16, gaji: [400, 950], exp: [12, 20], item: ['ikan'], cerita: ['melaut subuh', 'jaring penuh ikan', 'ombak besar tapi selamat', 'jual tangkapan di TPI'] },
  { id: 'kurir', icon: '📦', nama: 'Kurir Ekspedisi', level: 3, energi: 14, gaji: [450, 1000], exp: [12, 20], cerita: ['80 paket sehari', 'alamat susah ketemu', 'COD lancar semua', 'hujan tetap kirim'] },
  { id: 'barista', icon: '☕', nama: 'Barista', level: 4, energi: 12, gaji: [500, 1100], exp: [14, 22], cerita: ['latte art hati', 'antrean panjang pagi', 'racik menu baru', 'pelanggan kasih tip'] },
  { id: 'tukang', icon: '🔨', nama: 'Tukang Bangunan', level: 5, energi: 20, gaji: [700, 1500], exp: [16, 26], item: ['kayu', 'batu'], cerita: ['cor lantai 2', 'pasang keramik', 'ngecat pagar', 'angkat semen 20 sak'] },
  { id: 'penambang', icon: '⛏️', nama: 'Penambang Pro', level: 6, energi: 22, gaji: [800, 1700], exp: [18, 28], item: ['besi', 'batu'], cerita: ['gali terowongan baru', 'nemu urat besi', 'shift malam di tambang', 'angkut bijih ke atas'] },
  { id: 'chef', icon: '👨‍🍳', nama: 'Chef Restoran', level: 7, energi: 18, gaji: [1000, 2200], exp: [20, 32], cerita: ['menu spesial laris', 'kritikus makanan datang', 'catering 200 porsi', 'dapur kebakaran kecil'] },
  { id: 'guru', icon: '📚', nama: 'Guru', level: 8, energi: 15, gaji: [1100, 2300], exp: [24, 36], cerita: ['ngajar 6 jam pelajaran', 'koreksi 120 ulangan', 'rapat wali murid', 'muridnya juara lomba'] },
  { id: 'perawat', icon: '🩺', nama: 'Perawat', level: 9, energi: 18, gaji: [1300, 2600], exp: [24, 38], cerita: ['jaga IGD malam', 'pasien pulih semua', 'vaksinasi massal', 'shift 12 jam'] },
  { id: 'programmer', icon: '💻', nama: 'Programmer', level: 10, energi: 16, gaji: [1600, 3400], exp: [28, 44], cerita: ['fix bug production jam 3 pagi', 'deploy fitur baru', 'code review 15 PR', 'server down 10 menit'] },
  { id: 'youtuber', icon: '🎥', nama: 'Content Creator', level: 12, energi: 16, gaji: [1200, 4500], exp: [26, 46], cerita: ['video viral 1 juta views', 'shooting seharian', 'sponsor masuk', 'kena strike, tapi aman'] },
  { id: 'dokter', icon: '⚕️', nama: 'Dokter', level: 14, energi: 20, gaji: [2500, 5000], exp: [34, 52], cerita: ['operasi 5 jam sukses', 'praktek 40 pasien', 'jaga malam rumah sakit', 'seminar medis'] },
  { id: 'pilot', icon: '✈️', nama: 'Pilot', level: 17, energi: 22, gaji: [3500, 7000], exp: [40, 60], cerita: ['penerbangan Jakarta–Tokyo', 'landing mulus saat badai', 'delay 2 jam tapi aman', 'terbang malam lintas benua'] },
  { id: 'ceo', icon: '🏢', nama: 'CEO Startup', level: 20, energi: 25, gaji: [5000, 12000], exp: [50, 80], cerita: ['closing investor seri B', 'rapat dewan direksi', 'launching produk global', 'IPO! saham naik'] }
]
const byId = id => PROFESI.find(p => p.id === String(id || '').toLowerCase())
const PANGKAT = ['Magang', 'Junior', 'Staff', 'Senior', 'Supervisor', 'Manager', 'Direktur', 'Legenda']
const SHIFT_PER_PANGKAT = 5
const pangkatDari = shift => Math.min(PANGKAT.length - 1, Math.floor((shift || 0) / SHIFT_PER_PANGKAT))
const bonusPangkat = shift => 1 + 0.12 * pangkatDari(shift)

function kerjaData (r) {
  if (!r.kerja) r.kerja = { profesi: null, shift: 0, totalGaji: 0, lastWork: 0, riwayat: [] }
  return r.kerja
}

/* ---------------------------------------------------------------- */
/*  .kerja                                                           */
/* ---------------------------------------------------------------- */
export const kerja = {
  command: ['kerja', 'work', 'bekerja', 'shift', 'ngantor'],
  category: 'RPG Menu',
  description: '💼 Kerja sesuai profesi → koin + EXP (16 profesi, cooldown 30 menit, naik pangkat tiap 5 shift)',
  limit: 0,
  cooldown: 3,
  contoh: 'ojek',
  run: async m => {
    const jid = K(m)
    const r = getRPG(jid)
    const kd = kerjaData(r)
    const arg = String(m.args?.[0] || '').toLowerCase()
    const sisa = COOLDOWN - (Date.now() - (kd.lastWork || 0))

    /* ---- tanpa argumen: menu pekerjaan ---- */
    if (!arg) {
      const aktif = byId(kd.profesi)
      const teks =
        `💼 *KERJA — ${config.bot.name}*\n\n` +
        (aktif
          ? `▸ Profesi: ${aktif.icon} *${aktif.nama}*\n▸ Pangkat: *${PANGKAT[pangkatDari(kd.shift)]}* (${kd.shift} shift, bonus gaji +${Math.round((bonusPangkat(kd.shift) - 1) * 100)}%)\n▸ Total gaji: 💰 ${rp(kd.totalGaji)}\n`
          : '▸ Kamu belum punya profesi — pilih di bawah.\n') +
        `▸ Energi: ⚡ ${r.energy}/${r.maxEnergy} · Level RPG: ${r.level}\n` +
        `▸ Shift berikutnya: ${sisa > 0 ? `⏳ ${formatDuration(sisa)} lagi` : '✅ siap kerja!'}\n\n` +
        `Ketik \`${P}kerja <profesi>\` — contoh \`${P}kerja ojek\`\n` +
        `Ganti profesi kapan saja (pangkat direset). Rincian: \`${P}kerjainfo\``
      const rows = PROFESI.map(p => ({
        title: `${p.icon} ${p.nama}${kd.profesi === p.id ? ' ✅' : ''}${r.level < p.level ? ' 🔒' : ''}`,
        description: `Lv.${p.level}+ · ⚡${p.energi} · 💰 ${rp(p.gaji[0])}–${rp(p.gaji[1])}${p.item ? ' · +' + p.item.map(i => ITEMS[i]?.icon || i).join('') : ''}`,
        id: `${P}kerja ${p.id}`
      }))
      const terbuka = rows.filter((_, i) => r.level >= PROFESI[i].level)
      const terkunci = rows.filter((_, i) => r.level < PROFESI[i].level)
      try {
        return await m.sendList({
          title: '💼 PILIH PEKERJAAN', text: teks, footer: config.bot.footer, buttonText: '💼 Pilih Profesi',
          sections: [
            ...(aktif && sisa <= 0 ? [{ title: 'SHIFT SEKARANG', rows: [{ title: `▶️ Kerja lagi sebagai ${aktif.nama}`, description: 'langsung 1 shift', id: `${P}kerja ${aktif.id}` }] }] : []),
            { title: `TERSEDIA UNTUK LEVEL ${r.level} (${terbuka.length})`, rows: terbuka },
            ...(terkunci.length ? [{ title: `TERKUNCI — naikkan level (${terkunci.length})`, rows: terkunci }] : []),
            { title: 'LAINNYA', rows: [
              { title: 'ℹ️ Info profesi & pangkat', id: `${P}kerjainfo` },
              { title: '🧾 Riwayat gajian', id: `${P}gajian` },
              { title: '🎮 Kembali ke RPG', id: `${P}rpg` }
            ] }
          ]
        })
      } catch {
        return m.reply(teks + '\n\n' + PROFESI.map(p => `${p.icon} \`${P}kerja ${p.id}\` — ${p.nama} (Lv.${p.level}+, 💰${rp(p.gaji[0])}–${rp(p.gaji[1])})`).join('\n'))
      }
    }

    /* ---- dengan argumen: kerja 1 shift ---- */
    const prof = byId(arg) || PROFESI.find(p => p.nama.toLowerCase().includes(arg))
    if (!prof) return m.reply(`❌ Profesi *${arg}* tidak ada.\nLihat daftar: \`${P}kerja\``)
    if (r.level < prof.level) return m.reply(`🔒 *${prof.nama}* butuh level RPG *${prof.level}* (kamu Lv.${r.level}).\nNaikkan level lewat ${P}berburu / ${P}battle / kerja profesi lain.`)
    if (sisa > 0) return m.reply(`⏳ Kamu masih capek. Shift berikutnya *${formatDuration(sisa)}* lagi.\n\nSambil nunggu: ${P}berburu · ${P}slot · ${P}bisnis`)
    if (r.energy < prof.energi) return m.reply(`⚡ Energi kurang: butuh *${prof.energi}*, kamu punya *${r.energy}*.\nRegen 1 energi / 2 menit, atau ${P}makan.`)

    /* ganti profesi? */
    let catatanGanti = ''
    if (kd.profesi && kd.profesi !== prof.id) {
      const lama = byId(kd.profesi)
      catatanGanti = `\n🔁 Pindah profesi dari ${lama?.icon || ''} ${lama?.nama || kd.profesi} — pangkat direset.`
      kd.shift = 0
    }
    kd.profesi = prof.id

    useEnergy(jid, prof.energi)
    const roll = Math.random()
    let gaji = Math.round((prof.gaji[0] + Math.random() * (prof.gaji[1] - prof.gaji[0])) * bonusPangkat(kd.shift))
    let exp = Math.round(prof.exp[0] + Math.random() * (prof.exp[1] - prof.exp[0]))
    let kejadian = ''
    if (roll < 0.08) { gaji = Math.round(gaji * 2); kejadian = '🎉 *BONUS!* Bos senang, gaji hari ini ×2!' }
    else if (roll < 0.14) { gaji = Math.round(gaji * 0.5); kejadian = '😓 *Apes.* Kena potongan, gaji cuma setengah.' }
    else if (roll < 0.2) { exp = Math.round(exp * 1.5); kejadian = '📈 Kerja rapi banget, EXP +50%!' }

    kd.shift += 1
    kd.totalGaji = (kd.totalGaji || 0) + gaji
    kd.lastWork = Date.now()
    kd.riwayat = [{ w: Date.now(), p: prof.id, g: gaji }, ...(kd.riwayat || [])].slice(0, 20)
    addMoney(jid, gaji)
    const lv = addExp(jid, exp)
    catatHarian(r, 'kerja', 1)

    /* item sampingan */
    let itemTeks = ''
    if (prof.item && Math.random() < 0.6) {
      const it = pickRandom(prof.item)
      if (ITEMS[it]) { const q = 1 + Math.floor(Math.random() * 3); try { addItem(jid, it, q); itemTeks = `\n▸ Bawa pulang: ${ITEMS[it].icon} ${ITEMS[it].name} ×${q}` } catch {} }
    }
    const pangkatLama = pangkatDari(kd.shift - 1), pangkatBaru = pangkatDari(kd.shift)
    const naik = pangkatBaru > pangkatLama ? `\n\n🎖️ *NAIK PANGKAT!* ${PANGKAT[pangkatLama]} → *${PANGKAT[pangkatBaru]}* (gaji +${Math.round((bonusPangkat(kd.shift) - 1) * 100)}%)` : ''
    saveDB('users')

    const teks =
      `${prof.icon} *${prof.nama.toUpperCase()} — SHIFT SELESAI*\n` +
      `_${pickRandom(prof.cerita)}_\n\n` +
      (kejadian ? kejadian + '\n\n' : '') +
      `▸ Gaji: 💰 *+${rp(gaji)}* → saldo ${rp(r.money)}\n` +
      `▸ EXP: ✨ +${exp}${lv.leveledUp ? ` → *LEVEL UP! Lv.${lv.level}*` : ` (${r.exp}/${expNeeded(r.level)})`}\n` +
      `▸ Energi: ⚡ -${prof.energi} → ${r.energy}/${r.maxEnergy}${itemTeks}\n` +
      `▸ Pangkat: ${PANGKAT[pangkatBaru]} · shift ke-${kd.shift}` +
      naik + catatanGanti +
      `\n\n⏳ Shift berikutnya dalam 30 menit.`
    try {
      return await m.sendButtons({
        title: '💼 KERJA', text: teks, footer: config.bot.footer,
        buttons: [
          { text: '💼 Menu Kerja', id: `${P}kerja` },
          { text: '🎰 Slot RPG', id: `${P}slot 500` },
          { text: '🏪 Toko', id: `${P}toko` },
          { text: '🎮 RPG', id: `${P}rpg` }
        ]
      })
    } catch { return m.reply(teks) }
  }
}

/* ---------------------------------------------------------------- */
/*  .kerjainfo                                                       */
/* ---------------------------------------------------------------- */
export const kerjaInfo = {
  command: ['kerjainfo', 'infokerja', 'daftarkerja', 'listprofesi', 'pekerjaan', 'daftarprofesi'],
  category: 'RPG Menu',
  description: 'ℹ️ Daftar 16 profesi: syarat level, energi, gaji, item sampingan & sistem pangkat',
  limit: 0,
  run: async m => {
    const r = getRPG(K(m))
    const kd = kerjaData(r)
    const teks =
      `💼 *DAFTAR PROFESI* (${PROFESI.length})\n\n` +
      PROFESI.map(p => `${r.level >= p.level ? p.icon : '🔒'} *${p.nama}* — \`${P}kerja ${p.id}\`\n   Lv.${p.level}+ · ⚡${p.energi} · 💰 ${rp(p.gaji[0])}–${rp(p.gaji[1])} · ✨ ${p.exp[0]}–${p.exp[1]} EXP${p.item ? ` · bonus ${p.item.map(i => ITEMS[i]?.icon + ITEMS[i]?.name).join(', ')}` : ''}`).join('\n') +
      `\n\n*🎖️ PANGKAT* (naik tiap ${SHIFT_PER_PANGKAT} shift di profesi yang sama, gaji +12% per pangkat):\n` +
      PANGKAT.map((p, i) => `${i + 1}. ${p}${kd.profesi && pangkatDari(kd.shift) === i ? ' ← kamu' : ''}`).join(' · ') +
      `\n\n*Aturan:* cooldown 30 menit tiap shift · ganti profesi = pangkat reset · 8% peluang bonus ×2, 6% apes ½, 6% EXP +50%.\n` +
      `Koin masuk saldo RPG (dipakai ${P}toko, ${P}slot, ${P}bisnis, ${P}transfer).`
    return m.reply(truncate(teks, 3900))
  }
}

/* ---------------------------------------------------------------- */
/*  .gajian — riwayat                                                */
/* ---------------------------------------------------------------- */
export const gajian = {
  command: ['gajian', 'riwayatkerja', 'slipgaji', 'gajiku'],
  category: 'RPG Menu',
  description: '🧾 Riwayat 20 shift terakhir & total gaji seumur akun',
  limit: 0,
  run: async m => {
    const r = getRPG(K(m))
    const kd = kerjaData(r)
    if (!kd.riwayat?.length) return m.reply(`🧾 Belum ada riwayat kerja.\nMulai: \`${P}kerja\``)
    const prof = byId(kd.profesi)
    return m.reply(
      `🧾 *SLIP GAJI — ${m.pushName || 'Pekerja'}*\n\n` +
      `▸ Profesi: ${prof ? prof.icon + ' ' + prof.nama : '-'} · Pangkat *${PANGKAT[pangkatDari(kd.shift)]}*\n` +
      `▸ Total shift: ${kd.shift} · Total gaji: 💰 *${rp(kd.totalGaji)}*\n\n` +
      kd.riwayat.map((x, i) => { const p = byId(x.p); return `${i + 1}. ${new Date(x.w).toLocaleString('id-ID').slice(0, 16)} — ${p?.icon || ''} ${p?.nama || x.p}: +${rp(x.g)}` }).join('\n')
    )
  }
}

/* ---------------------------------------------------------------- */
/*  .resign                                                          */
/* ---------------------------------------------------------------- */
export const resign = {
  command: ['resign', 'berhentikerja', 'keluarkerja'],
  category: 'RPG Menu',
  description: '🚪 Berhenti dari profesi sekarang (pangkat & shift direset, riwayat tetap)',
  limit: 0,
  run: async m => {
    const r = getRPG(K(m))
    const kd = kerjaData(r)
    if (!kd.profesi) return m.reply(`Kamu belum bekerja di mana pun. Cari kerja: \`${P}kerja\``)
    const p = byId(kd.profesi)
    kd.profesi = null; kd.shift = 0
    saveDB('users')
    return m.reply(`🚪 Kamu resign dari ${p?.icon || ''} *${p?.nama || '-'}*. Pangkat direset.\nCari kerja baru: \`${P}kerja\``)
  }
}

export default { kerja, kerjaInfo, gajian, resign }
