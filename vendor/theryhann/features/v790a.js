/**
 * ✨ v7.9.0 BATCH A — 10 fitur baru × 5 kategori (RPG · Games · Fun · Premium · User)
 * ------------------------------------------------------------------------------
 *  Semua fitur lokal (tanpa API luar), memakai DB & RPG yang sama sehingga
 *  koin/EXP nyambung ke toko, kasino, papan peringkat, dsb.
 */
import { config } from '../config.js'
import { getRPG, addExp, addMoney, useEnergy, addItem, takeItem, hasItem, ITEMS, bar } from '../lib/rpg.js'
import { getUser, allUsers, saveDB, addLimit } from '../lib/database.js'
import { pickRandom, truncate, formatDuration } from '../lib/functions.js'
import { gameSessions } from '../lib/gamestore.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender
const rp = n => Math.max(0, Math.floor(n || 0)).toLocaleString('id-ID')
const HARI = () => new Date().toISOString().slice(0, 10)
const acak = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const nomor = j => String(j || '').split('@')[0]
const plug = (cat, command, aliases, description, run, opt = {}) => ({
  command: [command, ...aliases], category: cat, description, limit: 0, cooldown: 2, ...opt,
  run: async (m, ctx) => { try { return await run(m, ctx) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 200)}`) } }
})
const cd = (obj, key, ms) => { const sisa = (obj[key] || 0) + ms - Date.now(); return sisa > 0 ? sisa : 0 }
const kirim = async (m, title, text, buttons = []) => {
  try { return await m.sendButtons({ title, text, footer: config.bot.footer, buttons: buttons.slice(0, 6) }) } catch { return m.reply(text) }
}
const x = r => { r.x = r.x || {}; return r.x } // ruang ekstra v7.9.0 di dalam u.rpg

/* ================================================================== */
/*  1. RPG MENU — 10 fitur                                              */
/* ================================================================== */
const TANAMAN = { jagung: { icon: '🌽', harga: 120, waktu: 20, hasil: [260, 420] }, tomat: { icon: '🍅', harga: 180, waktu: 35, hasil: [420, 700] }, semangka: { icon: '🍉', harga: 300, waktu: 60, hasil: [800, 1300] }, anggur: { icon: '🍇', harga: 500, waktu: 120, hasil: [1500, 2600] } }
const HEWAN = { ayam: { icon: '🐔', harga: 800, produk: 'telur', ikonProduk: '🥚', nilai: 60, tiap: 30 }, sapi: { icon: '🐄', harga: 4000, produk: 'susu', ikonProduk: '🥛', nilai: 250, tiap: 60 }, domba: { icon: '🐑', harga: 2500, produk: 'wol', ikonProduk: '🧶', nilai: 160, tiap: 45 } }
const GACHA = [
  { p: 40, jenis: 'koin', min: 100, max: 400, label: '🪙 Koin kecil' }, { p: 25, jenis: 'item', item: 'roti', label: '🍞 Roti' },
  { p: 15, jenis: 'item', item: 'ramuan', label: '🧪 Ramuan' }, { p: 10, jenis: 'koin', min: 800, max: 1500, label: '💰 Kantong koin' },
  { p: 6, jenis: 'item', item: 'besi', label: '⛓️ Besi' }, { p: 3, jenis: 'item', item: 'emas', label: '🥇 Emas' }, { p: 1, jenis: 'item', item: 'berlian', label: '💎 BERLIAN (legendaris)' }
]
const BOUNTY = [
  { nama: 'Bandit Gurun', icon: '🏜️', hp: 60, hadiah: [600, 1000], exp: 40 }, { nama: 'Perompak Pantai', icon: '🏴‍☠️', hp: 80, hadiah: [900, 1500], exp: 55 },
  { nama: 'Penyihir Rawa', icon: '🧙', hp: 100, hadiah: [1300, 2200], exp: 75 }, { nama: 'Naga Kecil', icon: '🐲', hp: 140, hadiah: [2200, 3800], exp: 110 }
]

export const RPG_BARU = [
  plug('RPG Menu', 'lotere', ['lotre', 'undian', 'togelrpg'], '🎟️ Beli tiket lotere 500 koin, pilih 2 digit (00-99). Tebak tepat ×40, 1 angka benar ×3. Undian tiap tiket',
    async m => {
      const r = getRPG(K(m)); const tebak = (m.args[0] || '').replace(/\D/g, '')
      if (tebak.length !== 2) return m.reply(`🎟️ *LOTERE RPG*\n\nTiket 500 koin · pilih 2 digit.\nTepat 2 digit → ×40 (20.000)\n1 digit posisi benar → ×3 (1.500)\n\nContoh: \`${P}lotere 27\`\nSaldo: ${rp(r.money)} koin`)
      if (r.money < 500) return m.reply('❌ Koin tidak cukup (butuh 500).')
      r.money -= 500
      const hasil = String(acak(0, 99)).padStart(2, '0')
      let menang = 0
      if (hasil === tebak) menang = 20000
      else if (hasil[0] === tebak[0] || hasil[1] === tebak[1]) menang = 1500
      r.money += menang; x(r).lotere = (x(r).lotere || 0) + 1; saveDB('users')
      return kirim(m, '🎟️ Lotere', `🎟️ *HASIL UNDIAN*\n\nTebakanmu: *${tebak}*\nAngka keluar: *${hasil}*\n\n${menang ? `🎉 MENANG *+${rp(menang)}* koin!` : '😢 Zonk. Coba lagi!'}\nSaldo: ${rp(r.money)} koin`, [{ text: '🎟️ Lagi (acak)', id: `${P}lotere ${String(acak(0, 99)).padStart(2, '0')}` }])
    }),
  plug('RPG Menu', 'rampok', ['begal', 'curi', 'robrpg'], '🥷 Rampok koin member lain (@tag). Peluang 45%, gagal = denda + energi. Cooldown 1 jam',
    async m => {
      const target = m.mentioned?.[0] || m.quoted?.sender
      if (!target) return m.reply(`🥷 Tag orang yang mau dirampok.\nContoh: \`${P}rampok @user\`\nPeluang 45%, hasil 5-15% koin korban (maks 5.000). Gagal: denda 800 + 15 energi. Cooldown 1 jam.`)
      if (target === K(m) || target === m.sender) return m.reply('🤡 Merampok diri sendiri?')
      const r = getRPG(K(m)); const sisa = cd(x(r), 'lastRampok', 3600e3)
      if (sisa) return m.reply(`⏳ Tunggu ${formatDuration(sisa)} lagi.`)
      if (!useEnergy(K(m), 15)) return m.reply('😮‍💨 Energi kurang (butuh 15).')
      const t = getRPG(target); x(r).lastRampok = Date.now()
      if (Math.random() < 0.45 && t.money > 100) {
        const dapat = Math.min(5000, Math.floor(t.money * (0.05 + Math.random() * 0.1)))
        t.money -= dapat; r.money += dapat; saveDB('users')
        return m.reply(`🥷 *BERHASIL!* Kamu merampok @${nomor(target)} dan kabur bawa *${rp(dapat)} koin*!`, { mentions: [target] })
      }
      const denda = Math.min(800, r.money); r.money -= denda; saveDB('users')
      return m.reply(`🚔 *GAGAL!* @${nomor(target)} teriak, polisi datang. Kamu didenda *${rp(denda)} koin*.`, { mentions: [target] })
    }, { group: true }),
  plug('RPG Menu', 'deposito', ['nabung', 'tabung', 'bankrpg'], '🏦 Simpan koin di bank: bunga 2%/hari (maks 7 hari), aman dari rampok. .deposito <jumlah> | tarik',
    async m => {
      const r = getRPG(K(m)); const d = x(r).depo || { saldo: 0, sejak: 0 }
      const a = (m.args[0] || '').toLowerCase()
      const bunga = d.saldo ? Math.floor(d.saldo * 0.02 * Math.min(7, Math.floor((Date.now() - d.sejak) / 86400e3))) : 0
      if (a === 'tarik') {
        if (!d.saldo) return m.reply('🏦 Tidak ada simpanan.')
        const total = d.saldo + bunga; r.money += total; x(r).depo = { saldo: 0, sejak: 0 }; saveDB('users')
        return m.reply(`🏦 Ditarik *${rp(total)}* koin (bunga ${rp(bunga)}). Saldo: ${rp(r.money)}`)
      }
      const jml = parseInt(a.replace(/\D/g, ''))
      if (!jml) return m.reply(`🏦 *BANK RPG*\n\nSimpanan: *${rp(d.saldo)}* koin${d.saldo ? `\nBunga berjalan: +${rp(bunga)} (2%/hari, maks 7 hari)` : ''}\n\n\`${P}deposito 5000\` — setor\n\`${P}deposito tarik\` — tarik semua + bunga\n\n💡 Koin di bank tidak bisa dirampok.`)
      if (jml < 500) return m.reply('Minimal setor 500 koin.')
      if (r.money < jml) return m.reply('❌ Koin tidak cukup.')
      r.money -= jml; x(r).depo = { saldo: d.saldo + bunga + jml, sejak: Date.now() }; saveDB('users')
      return m.reply(`🏦 Setor *${rp(jml)}* koin. Simpanan sekarang *${rp(x(r).depo.saldo)}*.\nBunga 2% dihitung tiap 24 jam.`)
    }),
  plug('RPG Menu', 'kebun', ['ladang', 'bertani', 'farm'], '🌱 Kebun pribadi: tanam jagung/tomat/semangka/anggur, tunggu menit tertentu, lalu panen. .kebun tanam <bibit> | panen',
    async m => {
      const r = getRPG(K(m)); const kb = x(r).kebun = x(r).kebun || []
      const a = (m.args[0] || '').toLowerCase(), b = (m.args[1] || '').toLowerCase()
      if (a === 'tanam') {
        const t = TANAMAN[b]; if (!t) return m.reply('Bibit: ' + Object.entries(TANAMAN).map(([k, v]) => `${v.icon} ${k} (${v.harga}c, ${v.waktu} mnt)`).join(' · '))
        if (kb.length >= 4) return m.reply('🌱 Petak penuh (maks 4). Panen dulu.')
        if (r.money < t.harga) return m.reply('❌ Koin kurang.')
        r.money -= t.harga; kb.push({ j: b, siap: Date.now() + t.waktu * 60e3 }); saveDB('users')
        return m.reply(`🌱 ${t.icon} ${b} ditanam! Siap panen dalam ${t.waktu} menit.`)
      }
      if (a === 'panen') {
        const siap = kb.filter(p => p.siap <= Date.now()); if (!siap.length) return m.reply('🌱 Belum ada yang siap panen.')
        let total = 0; for (const p of siap) { const t = TANAMAN[p.j]; total += acak(t.hasil[0], t.hasil[1]) }
        x(r).kebun = kb.filter(p => p.siap > Date.now()); r.money += total; addExp(K(m), siap.length * 12); saveDB('users')
        return m.reply(`🧺 Panen ${siap.length} petak → *+${rp(total)} koin* & +${siap.length * 12} EXP!`)
      }
      const daftar = kb.length ? kb.map((p, i) => `${i + 1}. ${TANAMAN[p.j].icon} ${p.j} — ${p.siap <= Date.now() ? '✅ siap' : '⏳ ' + formatDuration(p.siap - Date.now())}`).join('\n') : '_kosong_'
      return kirim(m, '🌱 Kebun', `🌱 *KEBUNMU* (${kb.length}/4 petak)\n\n${daftar}\n\nBibit: ${Object.entries(TANAMAN).map(([k, v]) => `${v.icon} ${k} ${v.harga}c`).join(' · ')}\n\n\`${P}kebun tanam jagung\` · \`${P}kebun panen\``, [{ text: '🧺 Panen', id: `${P}kebun panen` }, { text: '🌽 Tanam jagung', id: `${P}kebun tanam jagung` }])
    }),
  plug('RPG Menu', 'ternak', ['kandang', 'ternakrpg'], '🐄 Beli ayam/domba/sapi, hasilkan telur/wol/susu tiap beberapa menit → .ternak ambil untuk jual otomatis',
    async m => {
      const r = getRPG(K(m)); const tk = x(r).ternak = x(r).ternak || {}
      const a = (m.args[0] || '').toLowerCase(), b = (m.args[1] || '').toLowerCase()
      if (a === 'beli') {
        const h = HEWAN[b]; if (!h) return m.reply('Hewan: ' + Object.entries(HEWAN).map(([k, v]) => `${v.icon} ${k} ${v.harga}c`).join(' · '))
        if (r.money < h.harga) return m.reply('❌ Koin kurang.')
        r.money -= h.harga; tk[b] = tk[b] || { n: 0, last: Date.now() }; tk[b].n++; saveDB('users')
        return m.reply(`${h.icon} Beli 1 ${b}! Total ${tk[b].n}. Hasil ${h.ikonProduk} tiap ${h.tiap} menit/ekor.`)
      }
      if (a === 'ambil') {
        let total = 0, rincian = []
        for (const [k, v] of Object.entries(tk)) { const h = HEWAN[k]; const siklus = Math.min(10, Math.floor((Date.now() - v.last) / (h.tiap * 60e3))); if (siklus > 0) { const n = siklus * v.n; total += n * h.nilai; rincian.push(`${h.ikonProduk} ${n} ${h.produk}`); v.last = Date.now() } }
        if (!total) return m.reply('🐄 Belum ada hasil. Sabar ya.')
        r.money += total; saveDB('users')
        return m.reply(`🧺 Ambil: ${rincian.join(', ')} → terjual *+${rp(total)} koin*`)
      }
      const isi = Object.entries(tk).filter(([, v]) => v.n).map(([k, v]) => `${HEWAN[k].icon} ${k} ×${v.n}`).join('\n') || '_kosong_'
      return kirim(m, '🐄 Ternak', `🐄 *PETERNAKANMU*\n\n${isi}\n\n\`${P}ternak beli ayam\` · \`${P}ternak ambil\`\n${Object.entries(HEWAN).map(([k, v]) => `${v.icon} ${k} ${v.harga}c → ${v.ikonProduk} ${v.nilai}c/${v.tiap}mnt`).join('\n')}`, [{ text: '🧺 Ambil hasil', id: `${P}ternak ambil` }])
    }),
  plug('RPG Menu', 'gacha', ['gachabox', 'kotakmisteri', 'lootbox'], '🎁 Buka kotak misteri 300 koin: koin, roti, ramuan, besi, emas, hingga berlian 1%. .gacha 10 = buka 10 sekaligus',
    async m => {
      const r = getRPG(K(m)); const n = Math.min(10, Math.max(1, parseInt(m.args[0]) || 1))
      if (r.money < 300 * n) return m.reply(`❌ Butuh ${rp(300 * n)} koin.`)
      r.money -= 300 * n; const hasil = []
      for (let i = 0; i < n; i++) {
        let roll = Math.random() * 100, pilih = GACHA[0]
        for (const g of GACHA) { if (roll < g.p) { pilih = g; break } roll -= g.p }
        if (pilih.jenis === 'koin') { const k = acak(pilih.min, pilih.max); r.money += k; hasil.push(`${pilih.label} +${k}`) } else { addItem(K(m), pilih.item, 1); hasil.push(pilih.label) }
      }
      x(r).gacha = (x(r).gacha || 0) + n; saveDB('users')
      return kirim(m, '🎁 Gacha', `🎁 *KOTAK MISTERI ×${n}*\n\n${hasil.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nSaldo: ${rp(r.money)} · total dibuka: ${x(r).gacha}`, [{ text: '🎁 Buka 1', id: `${P}gacha` }, { text: '🎁 Buka 10', id: `${P}gacha 10` }])
    }),
  plug('RPG Menu', 'bounty', ['buruan', 'buronan', 'wanted'], '🎯 Papan buronan: lawan target dengan HP tertentu, serangan pakai senjata. Hadiah koin besar + EXP. Cooldown 20 menit',
    async m => {
      const r = getRPG(K(m)); const sisa = cd(x(r), 'lastBounty', 20 * 60e3)
      if (sisa) return m.reply(`⏳ Buronan berikutnya muncul dalam ${formatDuration(sisa)}.`)
      if (!useEnergy(K(m), 20)) return m.reply('😮‍💨 Energi kurang (20).')
      const t = pickRandom(BOUNTY.filter(b => b.hp <= 60 + r.level * 15) .length ? BOUNTY.filter(b => b.hp <= 60 + r.level * 15) : [BOUNTY[0]])
      const atk = 12 + r.level * 3 + (r.equipped?.weapon ? 15 : 0); let hp = t.hp, ronde = 0, luka = 0, log = []
      while (hp > 0 && ronde < 6) { ronde++; const d = acak(Math.floor(atk * 0.7), atk); hp -= d; const balas = acak(4, 14); luka += balas; log.push(`R${ronde}: kamu -${d} HP musuh · kena ${balas}`) }
      x(r).lastBounty = Date.now(); r.health = Math.max(1, r.health - luka)
      if (hp <= 0) { const hadiah = acak(t.hadiah[0], t.hadiah[1]); r.money += hadiah; addExp(K(m), t.exp); r.kills = (r.kills || 0) + 1; saveDB('users'); return m.reply(`🎯 *BURONAN DITANGKAP!* ${t.icon} ${t.nama}\n\n${log.join('\n')}\n\n💰 +${rp(hadiah)} koin · ✨ +${t.exp} EXP · ❤️ -${luka} HP`) }
      saveDB('users'); return m.reply(`💨 ${t.icon} ${t.nama} kabur setelah 6 ronde (sisa HP ${hp}).\n${log.join('\n')}\n❤️ -${luka} HP. Tingkatkan senjatamu!`)
    }),
  plug('RPG Menu', 'sedekah', ['amal', 'sedekahrpg'], '🤲 Sedekah koin ke kas bersama: dapat berkah EXP ×2 dan peluang bonus balasan 10× (1%). .sedekah <jumlah>',
    async m => {
      const r = getRPG(K(m)); const jml = parseInt((m.args[0] || '').replace(/\D/g, ''))
      if (!jml || jml < 100) return m.reply(`🤲 \`${P}sedekah 1000\` — minimal 100 koin.\nBalasan: EXP = 2× jumlah/100, 1% peluang koin kembali 10×.\nTotal sedekahmu: ${rp(x(r).sedekah || 0)}`)
      if (r.money < jml) return m.reply('❌ Koin kurang.')
      r.money -= jml; x(r).sedekah = (x(r).sedekah || 0) + jml; const exp = Math.floor(jml / 50); addExp(K(m), exp)
      let bonus = ''; if (Math.random() < 0.01) { r.money += jml * 10; bonus = `\n\n🌟 *MUKJIZAT!* Koinmu kembali 10× → +${rp(jml * 10)}` }
      saveDB('users'); return m.reply(`🤲 Sedekah *${rp(jml)}* koin diterima.\n✨ +${exp} EXP${bonus}\nTotal sedekah: ${rp(x(r).sedekah)}`)
    }),
  plug('RPG Menu', 'nikah', ['lamar', 'menikah', 'cerai', 'pasangan'], '💍 Lamar member (@tag), pasangan dapat bonus EXP 10% & bisa .kirimhadiah. .nikah terima | .nikah cerai',
    async m => {
      const r = getRPG(K(m)); const a = (m.args[0] || '').toLowerCase(); const target = m.mentioned?.[0] || m.quoted?.sender
      if (m.command === 'cerai' || a === 'cerai') { if (!x(r).pasangan) return m.reply('💔 Kamu belum menikah.'); const p = x(r).pasangan; const pr = getRPG(p); if (x(pr).pasangan === K(m)) x(pr).pasangan = null; x(r).pasangan = null; saveDB('users'); return m.reply(`💔 Kamu resmi berpisah dengan @${nomor(p)}.`, { mentions: [p] }) }
      if (a === 'terima') { const lamaran = x(r).lamaran; if (!lamaran) return m.reply('Tidak ada lamaran untukmu.'); const pr = getRPG(lamaran); x(pr).pasangan = K(m); x(r).pasangan = lamaran; x(r).lamaran = null; x(r).nikahSejak = Date.now(); saveDB('users'); return m.reply(`💍 *SELAMAT!* @${nomor(K(m))} & @${nomor(lamaran)} resmi menikah! Bonus EXP 10% aktif untuk berdua.`, { mentions: [K(m), lamaran] }) }
      if (!target) return m.reply(`💍 *PERNIKAHAN RPG*\n\nStatus: ${x(r).pasangan ? `menikah dengan @${nomor(x(r).pasangan)} sejak ${new Date(x(r).nikahSejak).toLocaleDateString('id-ID')}` : 'lajang'}\n\n\`${P}nikah @user\` — lamar (mahar 5.000 koin)\n\`${P}nikah terima\` — terima lamaran\n\`${P}cerai\` — berpisah`, { mentions: x(r).pasangan ? [x(r).pasangan] : [] })
      if (x(r).pasangan) return m.reply('Kamu sudah menikah! Cerai dulu kalau mau.')
      if (r.money < 5000) return m.reply('❌ Mahar 5.000 koin belum cukup.')
      r.money -= 5000; const tr = getRPG(target); x(tr).lamaran = K(m); saveDB('users')
      return m.reply(`💐 @${nomor(K(m))} melamar @${nomor(target)} dengan mahar 5.000 koin!\n@${nomor(target)}, ketik \`${P}nikah terima\` untuk menerima.`, { mentions: [K(m), target] })
    }),
  plug('RPG Menu', 'kirimhadiah', ['hadiah', 'gift', 'kado'], '🎁 Kirim item dari inventory ke member lain: .kirimhadiah @user <item> [jumlah]. Pasangan nikah dapat bonus EXP',
    async m => {
      const target = m.mentioned?.[0] || m.quoted?.sender; const args = m.args.filter(a => !a.startsWith('@'))
      const item = (args[0] || '').toLowerCase(), n = Math.max(1, parseInt(args[1]) || 1)
      if (!target || !ITEMS[item]) return m.reply(`🎁 \`${P}kirimhadiah @user roti 2\`\nItem: ${Object.keys(ITEMS).join(', ')}`)
      if (!hasItem(K(m), item) || (getRPG(K(m)).inventory[item] || 0) < n) return m.reply(`❌ ${ITEMS[item].icon} ${item} tidak cukup.`)
      takeItem(K(m), item, n); addItem(target, item, n)
      const r = getRPG(K(m)); const bonus = x(r).pasangan === target ? 30 : 10; addExp(K(m), bonus); saveDB('users')
      return m.reply(`🎁 @${nomor(K(m))} mengirim ${ITEMS[item].icon} ${item} ×${n} ke @${nomor(target)}! ✨ +${bonus} EXP`, { mentions: [K(m), target] })
    })
]

/* ================================================================== */
/*  2. GAMES — 10 fitur (kuis via gameSessions, hadiah koin RPG)         */
/* ================================================================== */
const TTL = 60e3
function mulaiKuis (m, { game, cmd, soal, jawab, hadiah = 300, exp = 15, extra = '' }) {
  const s = gameSessions.get(m.jid)
  if (s && s.expires > Date.now()) return m.reply(`⏳ Masih ada game *${s.game}* berjalan. Tunggu ${Math.ceil((s.expires - Date.now()) / 1000)}s atau \`${P}batalgame\`.`)
  gameSessions.set(m.jid, { game, cmd, answer: jawab, reward: hadiah, exp, expires: Date.now() + TTL })
  return kirim(m, '🎮 ' + game, `${soal}\n\n${extra}⏱️ 60 detik · 💰 ${hadiah} koin + ${exp} EXP\nKetik jawabanmu langsung di chat!`, [{ text: '❌ Batal', id: `${P}batalgame` }])
}
const HEWAN_Q = [['🐘', 'gajah'], ['🦒', 'jerapah'], ['🐧', 'penguin'], ['🦘', 'kanguru'], ['🐙', 'gurita'], ['🦉', 'burung hantu'], ['🐊', 'buaya'], ['🦋', 'kupu-kupu'], ['🐝', 'lebah'], ['🦀', 'kepiting'], ['🐢', 'kura-kura'], ['🦈', 'hiu']]
const BUAH_Q = [['🍍', 'nanas'], ['🥭', 'mangga'], ['🍓', 'stroberi'], ['🥝', 'kiwi'], ['🍑', 'persik'], ['🥥', 'kelapa'], ['🍒', 'ceri'], ['🍋', 'lemon'], ['🍐', 'pir'], ['🫐', 'blueberry']]
const IBUKOTA = [['Jepang', 'tokyo'], ['Australia', 'canberra'], ['Kanada', 'ottawa'], ['Brasil', 'brasilia'], ['Turki', 'ankara'], ['Mesir', 'kairo'], ['Thailand', 'bangkok'], ['Vietnam', 'hanoi'], ['Korea Selatan', 'seoul'], ['Jerman', 'berlin'], ['Spanyol', 'madrid'], ['Argentina', 'buenos aires'], ['India', 'new delhi'], ['Filipina', 'manila']]
const TAHUN = [['Proklamasi Kemerdekaan Indonesia', 1945], ['Sumpah Pemuda', 1928], ['Manusia pertama mendarat di bulan', 1969], ['Runtuhnya Tembok Berlin', 1989], ['Berdirinya Budi Utomo', 1908], ['Titanic tenggelam', 1912], ['Perang Dunia II berakhir', 1945], ['Konferensi Asia Afrika di Bandung', 1955], ['Reformasi Indonesia', 1998], ['Piala Dunia pertama', 1930]]
const KATA5 = ['pasar', 'rumah', 'bunga', 'kucing', 'meja', 'pintu', 'langit', 'hujan', 'sepeda', 'gunung', 'pantai', 'kertas', 'lampu', 'jalan', 'sungai', 'burung', 'tangan', 'cermin', 'sekolah', 'kopi']
const WARNA = [['🔴', 'merah'], ['🟠', 'oranye'], ['🟡', 'kuning'], ['🟢', 'hijau'], ['🔵', 'biru'], ['🟣', 'ungu'], ['⚫', 'hitam'], ['⚪', 'putih'], ['🟤', 'cokelat']]
const LAWAN = [['panas', 'dingin'], ['tinggi', 'rendah'], ['gelap', 'terang'], ['cepat', 'lambat'], ['kaya', 'miskin'], ['rajin', 'malas'], ['ramai', 'sepi'], ['tebal', 'tipis'], ['maju', 'mundur'], ['naik', 'turun'], ['basah', 'kering'], ['jauh', 'dekat']]
const PERIBAHASA = [['Ada udang di balik ...', 'batu'], ['Sedia payung sebelum ...', 'hujan'], ['Air tenang menghanyutkan; ... beriak tanda tak dalam', 'air'], ['Bagai pungguk merindukan ...', 'bulan'], ['Tong kosong nyaring ...', 'bunyinya'], ['Berakit-rakit ke hulu, berenang-renang ke ...', 'tepian'], ['Sepandai-pandai tupai melompat akhirnya ... juga', 'jatuh'], ['Buah jatuh tak jauh dari ...', 'pohonnya'], ['Besar pasak daripada ...', 'tiang']]
const SINGKATAN = [['PBB (organisasi dunia)', 'perserikatan bangsa-bangsa'], ['DPR', 'dewan perwakilan rakyat'], ['KTP', 'kartu tanda penduduk'], ['SIM (berkendara)', 'surat izin mengemudi'], ['ASEAN', 'association of southeast asian nations'], ['NASA', 'national aeronautics and space administration'], ['WIB', 'waktu indonesia barat'], ['UMKM', 'usaha mikro kecil dan menengah'], ['HP (ponsel)', 'handphone']]

export const GAMES_BARU = [
  plug('Games', 'tebakhewan', ['hewanapa', 'tebakhewanemoji'], '🐘 Tebak nama hewan dari emoji. Hadiah 300 koin + 15 EXP', m => { const [e, j] = pickRandom(HEWAN_Q); return mulaiKuis(m, { game: 'tebakhewan', cmd: 'tebakhewan', soal: `🐾 *TEBAK HEWAN*\n\nHewan apa ini?  ${e}`, jawab: [j] }) }),
  plug('Games', 'tebakbuah', ['buahapa'], '🍍 Tebak nama buah dari emoji. Hadiah 300 koin + 15 EXP', m => { const [e, j] = pickRandom(BUAH_Q); return mulaiKuis(m, { game: 'tebakbuah', cmd: 'tebakbuah', soal: `🍎 *TEBAK BUAH*\n\nBuah apa ini?  ${e}`, jawab: [j] }) }),
  plug('Games', 'tebakkotanegara', ['tebakibukota2', 'kuiskota', 'ibukotanegara'], '🏙️ Tebak ibu kota negara. Hadiah 400 koin + 20 EXP', m => { const [n, j] = pickRandom(IBUKOTA); return mulaiKuis(m, { game: 'tebakkotanegara', cmd: 'tebakkotanegara', soal: `🌍 *TEBAK IBU KOTA*\n\nApa ibu kota negara *${n}*?`, jawab: [j], hadiah: 400, exp: 20 }) }),
  plug('Games', 'tebaktahun', ['kuistahun', 'tahunberapa'], '📅 Tebak tahun peristiwa sejarah. Hadiah 500 koin + 25 EXP', m => { const [p, t] = pickRandom(TAHUN); return mulaiKuis(m, { game: 'tebaktahun', cmd: 'tebaktahun', soal: `📜 *TEBAK TAHUN*\n\nTahun berapa peristiwa *${p}*?`, jawab: [String(t)], hadiah: 500, exp: 25 }) }),
  plug('Games', 'katarahasia', ['wordle', 'tebakkata5', 'katatersembunyi'], '🔤 Kata rahasia: diberi huruf pertama & terakhir + jumlah huruf, tebak katanya. Hadiah 350 koin', m => { const k = pickRandom(KATA5); const mask = k[0] + ' _'.repeat(k.length - 2) + ' ' + k[k.length - 1]; return mulaiKuis(m, { game: 'katarahasia', cmd: 'katarahasia', soal: `🔤 *KATA RAHASIA*\n\n\`${mask.toUpperCase()}\`  (${k.length} huruf)\nKata benda umum dalam bahasa Indonesia.`, jawab: [k], hadiah: 350, exp: 18 }) }),
  plug('Games', 'tebakwarna', ['warnaapa'], '🎨 Tebak nama warna dari lingkaran emoji, cepat & mudah. Hadiah 200 koin', m => { const [e, j] = pickRandom(WARNA); return mulaiKuis(m, { game: 'tebakwarna', cmd: 'tebakwarna', soal: `🎨 *TEBAK WARNA*\n\nWarna apa ini?  ${e}`, jawab: [j], hadiah: 200, exp: 10 }) }),
  plug('Games', 'lawankata', ['antonim', 'kebalikan'], '↔️ Sebutkan lawan kata (antonim). Hadiah 300 koin', m => { const pas = pickRandom(LAWAN); const [a, b] = Math.random() < 0.5 ? pas : [pas[1], pas[0]]; return mulaiKuis(m, { game: 'lawankata', cmd: 'lawankata', soal: `↔️ *LAWAN KATA*\n\nApa lawan kata dari *${a}*?`, jawab: [b] }) }),
  plug('Games', 'lengkapiperibahasa', ['tebakperibahasa2', 'peribahasa2', 'kuisperibahasa'], '📖 Lengkapi peribahasa Indonesia yang terpotong. Hadiah 400 koin', m => { const [s, j] = pickRandom(PERIBAHASA); return mulaiKuis(m, { game: 'lengkapiperibahasa', cmd: 'lengkapiperibahasa', soal: `📖 *LENGKAPI PERIBAHASA*\n\n_"${s}"_`, jawab: [j], hadiah: 400, exp: 20 }) }),
  plug('Games', 'singkatanapa', ['tebaksingkatan2', 'kepanjangan2', 'kuiskepanjangan'], '🔠 Sebutkan kepanjangan dari singkatan populer. Hadiah 400 koin', m => { const [s, j] = pickRandom(SINGKATAN); return mulaiKuis(m, { game: 'singkatanapa', cmd: 'singkatanapa', soal: `🔠 *TEBAK SINGKATAN*\n\nApa kepanjangan dari *${s}*?`, jawab: [j, j.replace(/-/g, ' ')], hadiah: 400, exp: 20 }) }),
  plug('Games', 'kuishitungcepat', ['hitungkilat', 'matematikakilat', 'soalhitung'], '🧮 Soal hitung cepat acak (+ − × dengan kurung). Hadiah 350 koin, waktu 60 detik', m => {
    const a = acak(2, 30), b = acak(2, 20), c = acak(1, 9); const bentuk = pickRandom([[`(${a} + ${b}) × ${c}`, (a + b) * c], [`${a} × ${c} − ${b}`, a * c - b], [`${a} + ${b} × ${c}`, a + b * c], [`${a * c} ÷ ${c} + ${b}`, a + b]])
    return mulaiKuis(m, { game: 'kuishitungcepat', cmd: 'kuishitungcepat', soal: `🧮 *HITUNG CEPAT*\n\nBerapa hasil dari:\n\n\`${bentuk[0]}\` = ?`, jawab: [String(bentuk[1])], hadiah: 350, exp: 18 })
  })
]

/* ================================================================== */
/*  3. FUN MENU — 10 fitur                                              */
/* ================================================================== */
const hashStr = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h }
const JULUKAN = ['Sang Penakluk Rebahan', 'Raja Nyemil', 'Ratu Drama', 'Kapten Gabut', 'Sultan Receh', 'Master Typo', 'Dewa Telat', 'Legenda Ngantuk', 'Profesor Julid', 'Duta Santuy', 'Ninja Read-Only', 'Jenderal Halu']
const KUTUKAN = ['kalau mandi airnya selalu dingin', 'tiap buka kulkas lupa mau ambil apa', 'selalu dapat kursi paling depan pas telat', 'charger selalu ketinggalan', 'kaus kaki selalu hilang sebelah', 'wifi lemot pas lagi seru-serunya', 'selalu kena zonk gacha 7 hari']
const HUKUMAN = ['nyanyi lagu anak-anak di grup (voice note)', 'ganti nama WA jadi "Aku Kalah" 1 jam', 'kirim foto selfie ekspresi sedih', 'puji 3 member grup dengan tulus', 'ketik alfabet dari Z ke A tanpa salah', 'bikin pantun buat admin', 'kirim stiker paling memalukan yang kamu punya']
const MANTRA = ['Abrakadabra', 'Simsalabim', 'Wingardium Leviosa', 'Bibbidi-Bobbidi-Boo', 'Expecto Patronum', 'Hocus Pocus', 'Alakazam']
const RAMAL_CINTA = ['Minggu ini ada yang diam-diam memperhatikanmu 👀', 'Chat yang kamu tunggu akan datang, tapi isinya cuma "p" 😭', 'Mantan akan muncul di story-mu. Tahan jempolmu.', 'Cinta datang dari arah yang tidak terduga: tukang bakso langganan.', 'Fokus dulu ke diri sendiri, jodoh lagi loading 99%.', 'Ada yang mau ngajak jalan, tapi malu. Kode keras: kamu duluan.', 'Hubunganmu dengan kasur makin serius.']
const DUKUN = ['Hmm... aku melihat... kamu butuh tidur lebih awal.', 'Roh leluhur bilang: "cek saldo dulu sebelum checkout".', 'Bola kristal menunjukkan kamu akan makan enak hari ini. Kalau bayar.', 'Aku melihat angka 7. Entah apa artinya, tapi bagus.', 'Ada aura kuat... aura males.', 'Jawabannya: ya, tapi jangan sekarang.', 'Bola kristal retak. Pertanyaanmu terlalu berat.']
export const FUN_BARU = [
  plug('Fun Menu', 'julukan', ['titel', 'nicknamefun', 'julukanku'], '🏷️ Berikan julukan konyol untuk dirimu atau @user (konsisten per orang)', m => { const t = m.mentioned?.[0] || K(m); const j = JULUKAN[hashStr(t) % JULUKAN.length]; return m.reply(`🏷️ Julukan resmi @${nomor(t)}:\n\n*"${j}"*`, { mentions: [t] }) }),
  plug('Fun Menu', 'kutukan', ['kutuk', 'sumpahserapah'], '🧙 Kutuk @user dengan kutukan receh acak', m => { const t = m.mentioned?.[0] || K(m); return m.reply(`🧙‍♂️ *${pickRandom(MANTRA)}!* ✨\n\n@${nomor(t)} terkena kutukan: *${pickRandom(KUTUKAN)}* selama 7 hari 7 malam.`, { mentions: [t] }) }),
  plug('Fun Menu', 'hukuman', ['tantangan', 'dendaseru', 'punishment'], '⚖️ Undi hukuman seru untuk yang kalah game / telat', m => { const t = m.mentioned?.[0]; return m.reply(`⚖️ *HUKUMAN TERPILIH*${t ? ` untuk @${nomor(t)}` : ''}:\n\n👉 *${pickRandom(HUKUMAN)}*\n\nTidak boleh protes! 😆`, { mentions: t ? [t] : [] }) }),
  plug('Fun Menu', 'ramalancinta', ['ramalcinta', 'asmara', 'ramalanjodoh'], '💘 Ramalan asmara harian (berubah tiap hari)', m => { const i = hashStr(K(m) + HARI()) % RAMAL_CINTA.length; return m.reply(`💘 *RAMALAN CINTA HARI INI*\n@${nomor(K(m))}\n\n${RAMAL_CINTA[i]}\n\n💞 Tingkat kecocokan semesta: ${hashStr(K(m) + HARI() + 'x') % 41 + 60}%`, { mentions: [K(m)] }) }),
  plug('Fun Menu', 'tanyadukun', ['dukun', 'mbahdukun', 'bolakristal'], '🔮 Tanya apa saja ke Mbah Dukun, jawabannya... ya begitulah', m => { if (!m.q) return m.reply(`🔮 Tanya sesuatu: \`${P}tanyadukun apakah aku bakal kaya?\``); return m.reply(`🔮 *MBAH DUKUN MENJAWAB*\n\n_"${m.q}"_\n\n🧿 ${DUKUN[hashStr(m.q + HARI()) % DUKUN.length]}`) }),
  plug('Fun Menu', 'cekhoki', ['hoki', 'keberuntungan', 'luckyme'], '🍀 Cek tingkat hoki hari ini + angka & warna keberuntungan', m => { const h = hashStr(K(m) + HARI()); const pct = h % 101; return m.reply(`🍀 *HOKI HARI INI* — @${nomor(K(m))}\n\n${bar(pct, 100, 12)} *${pct}%*\n\n🔢 Angka hoki: *${h % 99 + 1}*\n🎨 Warna hoki: *${WARNA[h % WARNA.length][1]}* ${WARNA[h % WARNA.length][0]}\n🧭 Arah rezeki: *${['utara', 'timur', 'selatan', 'barat'][h % 4]}*\n\n${pct > 80 ? '🔥 Gas gacha & lotere!' : pct > 50 ? '🙂 Lumayan, hati-hati aja.' : '😴 Rebahan dulu lebih aman.'}`, { mentions: [K(m)] }) }),
  plug('Fun Menu', 'mantra', ['sihir', 'spell'], '✨ Lempar mantra sihir acak ke @user dengan efek konyol', m => { const t = m.mentioned?.[0] || K(m); const efek = ['berubah jadi kodok 5 menit 🐸', 'melayang 3 cm dari lantai', 'tertawa tanpa henti', 'jadi ganteng/cantik +10%', 'kehilangan sinyal', 'lupa password', 'jadi bijak sementara 🧘']; return m.reply(`🪄 *${pickRandom(MANTRA)}!*\n\n@${nomor(t)} ${pickRandom(efek)}!`, { mentions: [t] }) }),
  plug('Fun Menu', 'cocoknama', ['cekjodohnama', 'kecocokan', 'cocoknamaku'], '💑 Hitung kecocokan dua nama: .cocoknama Budi & Ani', m => { const [a, b] = (m.q || '').split(/&|dan|,|\//i).map(s => s.trim()).filter(Boolean); if (!a || !b) return m.reply(`💑 \`${P}cocoknama Budi & Ani\``); const pct = hashStr((a + b).toLowerCase().split('').sort().join('')) % 101; return m.reply(`💑 *KECOCOKAN NAMA*\n\n${a} ❤️ ${b}\n\n${bar(pct, 100, 12)} *${pct}%*\n\n${pct > 80 ? '💍 Jodoh dunia akhirat!' : pct > 60 ? '💕 Cocok, tinggal usaha.' : pct > 40 ? '🤝 Teman tapi mesra.' : '🌧️ Semesta belum merestui.'}`) }),
  plug('Fun Menu', 'tebakusia', ['umurberapa', 'cekusia'], '🎂 Bot menebak usiamu dari nama (asal-asalan tapi pede)', m => { const t = m.mentioned?.[0] || K(m); const u = 13 + hashStr(nomor(t)) % 40; return m.reply(`🎂 Menurut analisis super canggih (ngasal), @${nomor(t)} berusia *${u} tahun*. Kalau salah, berarti kamu awet muda. 😎`, { mentions: [t] }) }),
  plug('Fun Menu', 'siapayang', ['siapayg', 'pilihsiapa', 'undisiapa'], '👉 Pilih member grup acak untuk pertanyaan: .siapayang paling ganteng', async m => { const list = (m.group?.participants || []).map(p => p.id); if (!list.length) return m.reply('Khusus grup.'); const t = pickRandom(list); return m.reply(`👉 Siapa yang ${m.q || 'paling kece'}?\n\nJawabannya: *@${nomor(t)}* 🎉`, { mentions: [t] }) }, { group: true })
]

/* ================================================================== */
/*  4. PREMIUM — 10 fitur                                               */
/* ================================================================== */
const px = u => { u.premx = u.premx || {}; return u.premx }
export const PREMIUM_BARU = [
  plug('Premium', 'premkuota', ['kuotaprem', 'premsisa', 'masaprem'], '💎 Cek sisa masa aktif premium & ringkasan perk yang kamu pakai', m => { const u = m.userDB || getUser(K(m)); if (!u.premium) return m.reply(`❌ Kamu belum premium. Minta owner: \`${P}addprem\`.`); const sisa = u.premiumUntil ? u.premiumUntil - Date.now() : 0; return m.reply(`💎 *STATUS PREMIUM*\n\n▸ Aktif: ✅\n▸ Sisa: ${sisa > 0 ? formatDuration(sisa) : 'selamanya / tidak dibatasi'}\n▸ Limit: ♾️ unlimited\n▸ Klaim harian: ${px(u).lastKlaim === HARI() ? 'sudah' : 'belum'} (\`${P}premclaim\`)\n▸ Catatan tersimpan: ${(px(u).notes || []).length}\n▸ Pengingat aktif: ${(px(u).todo || []).length}`) }),
  plug('Premium', 'premnote', ['catatanprem', 'premcatat', 'notesprem'], '📝 Catatan pribadi premium (tersimpan permanen): .premnote tambah <teks> | list | hapus <no>', m => { const u = getUser(K(m)); const n = px(u).notes = px(u).notes || []; const a = (m.args[0] || '').toLowerCase(); const isi = m.args.slice(1).join(' '); if (a === 'tambah' && isi) { n.push({ t: isi, w: Date.now() }); saveDB('users'); return m.reply(`📝 Catatan #${n.length} disimpan.`) } if (a === 'hapus') { const i = parseInt(isi) - 1; if (!n[i]) return m.reply('Nomor tidak ada.'); n.splice(i, 1); saveDB('users'); return m.reply('🗑️ Dihapus.') } return m.reply(`📝 *CATATAN PREMIUM* (${n.length})\n\n${n.map((c, i) => `${i + 1}. ${c.t} _(${new Date(c.w).toLocaleDateString('id-ID')})_`).join('\n') || '_kosong_'}\n\n\`${P}premnote tambah <teks>\` · \`${P}premnote hapus 1\``) }, { premium: true }),
  plug('Premium', 'premtodo', ['todoprem', 'premtugas'], '✅ Daftar tugas premium dengan centang: .premtodo tambah <tugas> | selesai <no> | list', m => { const u = getUser(K(m)); const t = px(u).todo = px(u).todo || []; const a = (m.args[0] || '').toLowerCase(); const isi = m.args.slice(1).join(' '); if (a === 'tambah' && isi) { t.push({ t: isi, ok: false }); saveDB('users'); return m.reply(`✅ Tugas #${t.length} ditambah.`) } if (a === 'selesai') { const i = parseInt(isi) - 1; if (!t[i]) return m.reply('Nomor tidak ada.'); t[i].ok = true; saveDB('users'); return m.reply(`🎉 "${t[i].t}" selesai!`) } if (a === 'bersihkan') { px(u).todo = t.filter(v => !v.ok); saveDB('users'); return m.reply('🧹 Tugas selesai dibersihkan.') } return m.reply(`✅ *TO-DO PREMIUM*\n\n${t.map((v, i) => `${v.ok ? '☑️' : '⬜'} ${i + 1}. ${v.t}`).join('\n') || '_kosong_'}\n\n\`${P}premtodo tambah <tugas>\` · \`selesai <no>\` · \`bersihkan\``) }, { premium: true }),
  plug('Premium', 'premlucky', ['premspin', 'rodaprem', 'spinprem'], '🎡 Roda keberuntungan premium 1×/hari: koin RPG 1.000–20.000 atau bonus limit', m => { const u = getUser(K(m)); if (px(u).lastSpin === HARI()) return m.reply('🎡 Sudah spin hari ini. Besok lagi!'); px(u).lastSpin = HARI(); const roll = Math.random(); let hasil; if (roll < 0.5) { const k = acak(1000, 3000); addMoney(K(m), k); hasil = `🪙 +${rp(k)} koin` } else if (roll < 0.8) { const k = acak(3000, 8000); addMoney(K(m), k); hasil = `💰 +${rp(k)} koin` } else if (roll < 0.95) { addLimit(K(m), 50); hasil = '🎫 +50 limit cadangan' } else { addMoney(K(m), 20000); hasil = '💎 JACKPOT +20.000 koin!' } saveDB('users'); return m.reply(`🎡 *RODA PREMIUM*\n\n🎯 ${hasil}\n\nSampai jumpa besok!`) }, { premium: true }),
  plug('Premium', 'premwish', ['ucapanprem', 'premucapan'], '🎀 Buat kartu ucapan teks mewah (ulang tahun, wisuda, nikah): .premwish ultah Rina', m => { const [jenis, ...nama] = m.args; const n = nama.join(' ') || 'Kamu'; const tpl = { ultah: `🎂✨ *SELAMAT ULANG TAHUN, ${n.toUpperCase()}!* ✨🎂\n\nSemoga panjang umur, sehat selalu, rezeki lancar, dan semua doa baikmu diijabah. Tambah usia, tambah bijak, tambah bahagia! 🎉🎈`, wisuda: `🎓✨ *SELAMAT WISUDA, ${n.toUpperCase()}!* ✨🎓\n\nPerjuangan begadang, revisi, dan deadline akhirnya terbayar. Dunia menunggumu — semoga ilmunya berkah dan kariernya cemerlang! 🌟`, nikah: `💍✨ *SELAMAT MENEMPUH HIDUP BARU, ${n.toUpperCase()}!* ✨💍\n\nSemoga menjadi keluarga yang sakinah, mawaddah, warahmah — langgeng sampai kakek nenek. 🤍`, sukses: `🏆✨ *SELAMAT ATAS PENCAPAIANNYA, ${n.toUpperCase()}!* ✨🏆\n\nKerja kerasmu terlihat dan terbayar. Terus melesat, jangan lupa istirahat! 🚀` }; if (!tpl[jenis]) return m.reply(`🎀 \`${P}premwish <ultah|wisuda|nikah|sukses> <nama>\``); return m.reply(tpl[jenis] + `\n\n— dikirim dengan 💎 ${config.bot.name} Premium`) }, { premium: true }),
  plug('Premium', 'premstat', ['statprem', 'premstatistik'], '📊 Statistik penggunaanmu: total command, kategori favorit, koin RPG, ranking premium', m => { const u = getUser(K(m)); const r = getRPG(K(m)); const semua = allUsers().filter(v => v.premium).sort((a, b) => (b.rpg?.money || 0) - (a.rpg?.money || 0)); const rank = semua.findIndex(v => v === u) + 1; return m.reply(`📊 *STATISTIK PREMIUM* — @${nomor(K(m))}\n\n▸ Level: ${u.level || 1} · EXP ${u.exp || 0}\n▸ Koin RPG: ${rp(r.money)} (level RPG ${r.level})\n▸ Total hit command: ${u.hits || u.totalHit || '-'}\n▸ Bergabung: ${new Date(u.created || Date.now()).toLocaleDateString('id-ID')}\n▸ Peringkat koin antar premium: #${rank || '-'} dari ${semua.length}\n▸ Catatan: ${(px(u).notes || []).length} · To-do: ${(px(u).todo || []).length}`, { mentions: [K(m)] }) }, { premium: true }),
  plug('Premium', 'premrank', ['premrankboard', 'rankprem'], '🏅 Papan peringkat khusus member premium berdasarkan koin RPG', m => { const semua = allUsers().filter(v => v.premium).sort((a, b) => (b.rpg?.money || 0) - (a.rpg?.money || 0)).slice(0, 10); if (!semua.length) return m.reply('Belum ada member premium.'); return m.reply(`🏅 *TOP PREMIUM (koin RPG)*\n\n${semua.map((v, i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} @${nomor(v.jid || v.id || '')} — ${rp(v.rpg?.money)} koin`).join('\n')}`, { mentions: semua.map(v => v.jid || v.id).filter(Boolean) }) }),
  plug('Premium', 'premboost', ['boostexp', 'premexp'], '⚡ Aktifkan boost EXP ×2 selama 1 jam (1×/hari) untuk semua aktivitas RPG', m => { const u = getUser(K(m)); const r = getRPG(K(m)); if (px(u).lastBoost === HARI()) return m.reply(`⚡ Boost hari ini sudah dipakai${x(r).boostSampai > Date.now() ? ` (aktif ${formatDuration(x(r).boostSampai - Date.now())} lagi)` : ''}.`); px(u).lastBoost = HARI(); x(r).boostSampai = Date.now() + 3600e3; addExp(K(m), 100); saveDB('users'); return m.reply('⚡ *BOOST AKTIF 1 JAM!* Bonus langsung +100 EXP. Aktivitas RPG (kerja, berburu, kebun) memberi EXP ekstra.') }, { premium: true }),
  plug('Premium', 'premhitung', ['hitungprem', 'kalkulatorprem'], '🧮 Kalkulator premium multi-baris: .premhitung 12*4+7 | 100/3 | 2^10 (hasil rapi per baris)', m => { if (!m.q) return m.reply(`🧮 \`${P}premhitung 12*4+7 | 100/3 | 2^10\``); const baris = m.q.split('|').map(s => s.trim()).filter(Boolean).slice(0, 10); const hasil = baris.map(b => { try { if (!/^[\d\s+\-*/().^%,]+$/.test(b)) throw 0; const v = Function('"use strict";return (' + b.replace(/\^/g, '**').replace(/,/g, '.') + ')')(); return `\`${b}\` = *${Number.isFinite(v) ? Number(v.toFixed(6)).toLocaleString('id-ID') : '∞'}*` } catch { return `\`${b}\` = ❌` } }); return m.reply(`🧮 *KALKULATOR PREMIUM*\n\n${hasil.join('\n')}`) }, { premium: true }),
  plug('Premium', 'premkotak', ['premdailybox', 'kotakprem', 'premkotakharian'], '📦 Kotak harian premium: 1×/hari dapat paket acak (koin + item RPG + EXP) yang lebih besar dari klaim biasa', m => { const u = getUser(K(m)); if (px(u).lastKotak === HARI()) return m.reply('📦 Kotak hari ini sudah dibuka. Besok lagi!'); px(u).lastKotak = HARI(); const koin = acak(1500, 4000); const item = pickRandom(['roti', 'ramuan', 'besi', 'emas']); addMoney(K(m), koin); addItem(K(m), item, 2); addExp(K(m), 60); saveDB('users'); return m.reply(`📦 *KOTAK HARIAN PREMIUM*\n\n🪙 +${rp(koin)} koin\n${ITEMS[item].icon} ${item} ×2\n✨ +60 EXP\n\nTerima kasih sudah jadi member premium 💎`) }, { premium: true })
]

/* ================================================================== */
/*  5. USER MENU — 10 fitur                                             */
/* ================================================================== */
const ux = u => { u.profil = u.profil || {}; return u.profil }
const setField = (field, label, contoh, validasi) => plug('User Menu', 'set' + field, [field === 'ultah' ? 'setulangtahun' : field + 'ku', 'ubah' + field], `${label}: ${contoh}`, m => { const u = getUser(K(m)); if (!m.q) return m.reply(`${label}\nContoh: \`${P}set${field} ${contoh}\`\nSekarang: ${ux(u)[field] || '-'}`); const v = validasi ? validasi(m.q) : truncate(m.q, 60); if (v === null) return m.reply('❌ Nilai tidak valid.'); ux(u)[field] = v; saveDB('users'); return m.reply(`✅ ${label} diset: *${v}*`) })
export const USER_BARU = [
  setField('nick', '🏷️ Nama panggilan', 'Thery'),
  setField('gender', '🚻 Jenis kelamin', 'L / P', q => /^(l|p|laki|pria|cowok|perempuan|wanita|cewek)/i.test(q) ? (/^(l|laki|pria|cowok)/i.test(q) ? 'Laki-laki' : 'Perempuan') : null),
  setField('kota', '🏙️ Kota domisili', 'Medan'),
  setField('ultah', '🎂 Tanggal lahir', '17-08-2005', q => /^\d{1,2}-\d{1,2}-\d{4}$/.test(q) ? q : null),
  setField('hobi', '🎯 Hobi', 'main game, ngoding'),
  plug('User Menu', 'biodata', ['bio', 'datadiri', 'profilku'], '🪪 Tampilkan biodata lengkapmu (nick, gender, kota, ultah, hobi, zodiak, umur, status RPG)', m => { const t = m.mentioned?.[0] || K(m); const u = getUser(t); const p = ux(u); const r = getRPG(t); let umur = '-', zod = '-'; if (p.ultah) { const [d, mo, y] = p.ultah.split('-').map(Number); const now = new Date(); umur = now.getFullYear() - y - ((now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) ? 1 : 0); const z = [[20, 'Capricorn'], [19, 'Aquarius'], [21, 'Pisces'], [21, 'Aries'], [21, 'Taurus'], [22, 'Gemini'], [23, 'Cancer'], [23, 'Leo'], [23, 'Virgo'], [23, 'Libra'], [23, 'Scorpio'], [22, 'Sagitarius'], [20, 'Capricorn']]; zod = d < z[mo - 1][0] ? z[mo - 1][1] : z[mo][1] } return m.reply(`🪪 *BIODATA* — @${nomor(t)}\n\n▸ Nick: ${p.nick || u.name || '-'}\n▸ Gender: ${p.gender || '-'}\n▸ Kota: ${p.kota || '-'}\n▸ Lahir: ${p.ultah || '-'} (${umur} th, ${zod})\n▸ Hobi: ${p.hobi || '-'}\n▸ Bio: ${u.bio || p.bio || '-'}\n▸ Status: ${u.premium ? '💎 Premium' : '👤 Free'} · Limit ${u.premium ? '∞' : u.limit}\n▸ RPG: Lv ${r.level} · ${rp(r.money)} koin${x(r).pasangan ? `\n▸ 💍 Pasangan: @${nomor(x(r).pasangan)}` : ''}\n\nAtur: ${P}setnick · ${P}setgender · ${P}setkota · ${P}setultah · ${P}sethobi`, { mentions: [t, x(r).pasangan].filter(Boolean) }) }),
  plug('User Menu', 'streak', ['runtutan', 'harianku', 'absenharian'], '🔥 Absen harian: jaga streak berturut-turut, bonus koin naik tiap hari (maks ×7)', m => { const u = getUser(K(m)); const s = ux(u).streak = ux(u).streak || { n: 0, last: '' }; const kemarin = new Date(Date.now() - 86400e3).toISOString().slice(0, 10); if (s.last === HARI()) return m.reply(`🔥 Sudah absen hari ini. Streak: *${s.n} hari*. Besok lagi!`); s.n = s.last === kemarin ? s.n + 1 : 1; s.last = HARI(); const bonus = 200 * Math.min(7, s.n); addMoney(K(m), bonus); addExp(K(m), 10 * Math.min(7, s.n)); saveDB('users'); return m.reply(`🔥 *STREAK ${s.n} HARI!*\n\n${'🔥'.repeat(Math.min(7, s.n))}${'⚪'.repeat(Math.max(0, 7 - s.n))}\n\n🪙 +${bonus} koin · ✨ +${10 * Math.min(7, s.n)} EXP\n${s.n < 7 ? `Besok bonus ${200 * Math.min(7, s.n + 1)} koin` : 'Bonus maksimal! Pertahankan.'}`) }),
  plug('User Menu', 'lencana', ['badge', 'badges', 'lencanaku'], '🏅 Lihat lencana pencapaianmu (RPG, game, sosial) yang terbuka otomatis', m => { const t = m.mentioned?.[0] || K(m); const u = getUser(t); const r = getRPG(t); const L = [['🐣', 'Pendatang', true], ['💎', 'Premium', !!u.premium], ['💰', 'Sultan 10K', r.money >= 10000], ['🏦', 'Nasabah', !!x(r).depo?.saldo], ['⚔️', 'Pemburu 10 kill', (r.kills || 0) >= 10], ['🎁', 'Gacha 10×', (x(r).gacha || 0) >= 10], ['💍', 'Menikah', !!x(r).pasangan], ['🤲', 'Dermawan', (x(r).sedekah || 0) >= 5000], ['🔥', 'Streak 7', (ux(u).streak?.n || 0) >= 7], ['🌾', 'Petani', !!(x(r).kebun || []).length], ['⭐', 'Level 10', r.level >= 10], ['👑', 'Level 25', r.level >= 25]]; const buka = L.filter(l => l[2]); return m.reply(`🏅 *LENCANA* — @${nomor(t)} (${buka.length}/${L.length})\n\n${L.map(l => `${l[2] ? l[0] : '🔒'} ${l[1]}${l[2] ? ' ✅' : ''}`).join('\n')}`, { mentions: [t] }) }),
  plug('User Menu', 'ultahku', ['ulangtahun', 'hitungultah', 'countdownultah'], '🎂 Hitung mundur ke ulang tahunmu berikutnya (dari .setultah)', m => { const u = getUser(K(m)); const p = ux(u); if (!p.ultah) return m.reply(`Set dulu: \`${P}setultah 17-08-2005\``); const [d, mo] = p.ultah.split('-').map(Number); const now = new Date(); let next = new Date(now.getFullYear(), mo - 1, d); if (next < now.setHours(0, 0, 0, 0)) next = new Date(now.getFullYear() + 1, mo - 1, d); const sisa = Math.ceil((next - Date.now()) / 86400e3); return m.reply(sisa === 0 ? `🎉 *HARI INI ULANG TAHUNMU!* Selamat ya @${nomor(K(m))} 🎂🎈` : `🎂 Ulang tahunmu berikutnya: *${next.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}*\n⏳ *${sisa} hari lagi*`, { mentions: [K(m)] }) }),
  plug('User Menu', 'aktivitasku', ['logku', 'ringkasanakun', 'akunku'], '📈 Ringkasan aktivitas akunmu: koin, streak, kebun, ternak, bank, lotere, gacha, pasangan', m => { const u = getUser(K(m)); const r = getRPG(K(m)); const X = x(r); return m.reply(`📈 *RINGKASAN AKUN* — @${nomor(K(m))}\n\n🪙 Koin: ${rp(r.money)} · 🏦 Bank: ${rp(X.depo?.saldo)}\n⭐ Level RPG ${r.level} · ❤️ ${r.health}/${r.maxHealth} · ⚡ ${r.energy}/${r.maxEnergy}\n🔥 Streak: ${ux(u).streak?.n || 0} hari\n🌱 Kebun: ${(X.kebun || []).length} petak · 🐄 Ternak: ${Object.values(X.ternak || {}).reduce((a, b) => a + (b.n || 0), 0)} ekor\n🎟️ Lotere: ${X.lotere || 0}× · 🎁 Gacha: ${X.gacha || 0}× · 🤲 Sedekah: ${rp(X.sedekah)}\n💼 Kerja: ${r.kerja?.profesi || '-'} (${r.kerja?.shift || 0} shift)\n💍 Pasangan: ${X.pasangan ? '@' + nomor(X.pasangan) : '-'}\n📅 Bergabung: ${new Date(u.created || Date.now()).toLocaleDateString('id-ID')}`, { mentions: [K(m), X.pasangan].filter(Boolean) }) })
]

export default { RPG_BARU, GAMES_BARU, FUN_BARU, PREMIUM_BARU, USER_BARU }
