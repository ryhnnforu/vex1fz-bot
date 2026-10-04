/**
 * features/ekonomi.js — v7.29.0
 *  💰 EKONOMI & RPG TERSAMBUNG
 *   • owner: .addmoney / .addxp / .addlevel / .setmoney / .setlevel  <@user|nomor|me> <jumlah>
 *     (bisa ke diri sendiri: "me" / tanpa target). Semua menulis ke u.rpg (uang RPG = uang bot).
 *   • user: .transfer @user 1000 · .harian (klaim harian + streak) · .topkaya · .toplevel
 *   • RPG baru: .dungeon (3 lantai, boss, loot) · .arena @user (PvP taruhan) · .quest (misi harian 3 target)
 *   • 20 fitur fun cek-persen baru (cekfemboy, cektolol, ...)
 */
import { config } from '../config.js'
import { getUser, saveNow, loadDB, saveDB } from '../lib/database.js'
const allUsers = () => Object.entries(loadDB('users', {})).map(([jid, u]) => ({ ...u, jid }))
import { getRPG, addExp, addMoney, expNeeded, damage, heal, addItem } from '../lib/rpg.js'
import { canonKey, aliasesOf } from '../lib/identity.js'
import { gelarLevel } from '../lib/kartulevel.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const rp = n => 'Rp ' + Math.floor(+n || 0).toLocaleString('id-ID')

/* skor "record berdata" (0 = belum ada, 1+ = ada isi; 10+ = sudah dimainkan).
 * Dipakai agar addmoney/addxp/addlevel SELALU mendarat di record yang benar
 * (bug lama: tag LID / quoted LID / @angka-LID nyasar ke record hantu). */
const skorData = u => {
  if (!u || typeof u !== 'object') return -1
  let s = 0
  const r = u.rpg
  if (r) { s += 1; if (r.money !== 500 || r.level !== 1 || (r.exp || 0) > 0) s += 10 }
  if (u.exp) s += 5
  const nm = u.name || u.pushName
  if (nm && !/^[0-9]+$/.test(String(nm))) s += 3
  return s
}
/* kunci kanonik: utamakan PN (canonKey), tapi kalau record lain yang berdata → pakai itu */
function canonTarget (j, alt) {
  const semua = [...new Set([j, alt, ...aliasesOf(j), ...(alt ? aliasesOf(alt) : [])].filter(Boolean))]
  const c = canonKey(j, semua) || j
  try {
    const db = loadDB('users', {})
    let menang = c, skorMax = skorData(db[c])
    for (const k of semua) {
      if (k === c) continue
      const s = skorData(db[k])
      if (s > skorMax) { skorMax = s; menang = k }
    }
    return menang
  } catch { return c }
}
/* cocokkan digit nomor ke peserta grup (cocok PN maupun LID) → kembalikan bentuk JID-nya */
const cocokPeserta = (m, digit) => {
  const d = String(digit).replace(/[^0-9]/g, '')
  if (!d) return null
  for (const p of (m.group?.participants || [])) {
    for (const k of [p.pn, p.id, p.lid]) {
      if (k && String(k).split('@')[0].replace(/[^0-9]/g, '') === d) return k
    }
  }
  return null
}
function target (m, izinkanDiri = true) {
  const a = m.args || []
  m._tArg = null
  const men = m.mentioned?.[0] || m.quoted?.sender
  if (men) return canonTarget(men)
  const digitArgs = a.filter(x => /^\d{8,16}$/.test(String(x).replace(/[^0-9]/g, '')))
  if (!digitArgs.length) return izinkanDiri ? (m.senderKey || m.sender) : null
  if (digitArgs.length === 1) {
    // satu-satunya angka panjang: nominal besar (mis. 10000000) atau nomor HP?
    const d = String(digitArgs[0]).replace(/[^0-9]/g, '')
    if (!/^(62|0)\d+$/.test(d)) return izinkanDiri ? (m.senderKey || m.sender) : null
    // format nomor tapi tanpa angka lain → target valid, jumlah kosong → tampil bantuan
    if (!a.some(x => x !== digitArgs[0] && /[0-9]/.test(String(x).replace(/[^0-9]/g, '')))) {
      m._tArg = digitArgs[0]
      const dd = String(d).replace(/^0/, '62')
      const cocok = cocokPeserta(m, dd)
      return cocok ? canonTarget(cocok) : canonTarget(dd + '@s.whatsapp.net', dd + '@lid')
    }
  }
  const argT = digitArgs[0]
  m._tArg = argT
  const d = String(argT).replace(/[^0-9]/g, '').replace(/^0/, '62')
  const cocok = cocokPeserta(m, d)
  if (cocok) return canonTarget(cocok)
  return canonTarget(d + '@s.whatsapp.net', d + '@lid')
}
function jumlah (m) {
  const buang = m._tArg
  const n = (m.args || [])
    .filter(x => x !== buang && !String(x).startsWith('@'))
    .map(x => String(x).replace(/[^0-9-]/g, ''))
    .filter(x => x && x !== '-')
    .pop()
  return parseInt(n || '', 10)
}
const tag = j => '@' + String(j).split('@')[0]

/* ================= OWNER ================= */
function ownerCmd (names, label, fn, contoh) {
  return {
    command: names, category: 'Owner Menu', owner: true, limit: 0,
    description: `👑 (owner) ${label} — \`${P}${names[0]} @user|nomor|me <jumlah>\``,
    run: async m => {
      const t = target(m); const n = jumlah(m)
      if (!Number.isFinite(n)) return m.reply(`👑 *${label.toUpperCase()}*\n\n• \`${P}${names[0]} @user 5000\`\n• \`${P}${names[0]} 628xxx 5000\`\n• \`${P}${names[0]} me 5000\` (diri sendiri)\n• balas pesan user + \`${P}${names[0]} 5000\`\n\nContoh: \`${P}${names[0]} ${contoh}\``)
      const hasil = fn(t, n)
      return m.reply(`✅ *${label.toUpperCase()}*\n▸ Target: ${tag(t)}${t === (m.senderKey || m.sender) ? ' (kamu)' : ''}\n${hasil}`, { mentions: [t] })
    }
  }
}
export const addmoney = ownerCmd(['addmoney', 'adduang', 'addbalance', 'tambahuang', 'addsaldo'], 'Tambah uang', (t, n) => { const s = addMoney(t, n); return `▸ ${n >= 0 ? '+' : ''}${n.toLocaleString('id-ID')} → saldo *${rp(s)}*` }, 'me 100000')
export const setmoney = ownerCmd(['setmoney', 'setuang', 'setsaldo', 'setbalance'], 'Set uang', (t, n) => { const r = getRPG(t); r.money = Math.max(0, n); saveDB('users'); return `▸ saldo sekarang *${rp(r.money)}*` }, '@user 50000')
export const addxp = ownerCmd(['addxp', 'addexp', 'tambahxp', 'tambahexp'], 'Tambah XP', (t, n) => { const r = addExp(t, Math.max(0, n)); const g = getRPG(t); return `▸ +${n} XP → Lv.*${g.level}* (${g.exp}/${expNeeded(g.level)})${r.leveledUp ? '\n🎉 NAIK LEVEL! kartu ucapan dikirim.' : ''}` }, 'me 500')
export const addlevel = ownerCmd(['addlevel', 'tambahlevel', 'levelup'], 'Tambah level', (t, n) => { const g = getRPG(t); const dari = g.level; let tot = 0; for (let i = 0; i < Math.max(0, n); i++) tot += expNeeded(g.level + i) ; g.exp = 0; addExp(t, tot); const g2 = getRPG(t); return `▸ Lv.${dari} → Lv.*${g2.level}* (${gelarLevel(g2.level)})` }, '@user 3')
export const setlevel = ownerCmd(['setlevel', 'aturlevel'], 'Set level', (t, n) => { const g = getRPG(t); const lv = Math.max(1, Math.min(999, n)); const dari = g.level; g.level = lv; g.exp = 0; g.maxHealth = 100 + (lv - 1) * 15; g.maxEnergy = 100 + (lv - 1) * 5; g.health = g.maxHealth; g.energy = g.maxEnergy; saveDB('users'); return `▸ Lv.${dari} → Lv.*${lv}* (${gelarLevel(lv)}) · HP ${g.maxHealth}` }, 'me 50')
/* ================= USER: uang ================= */
export const transfer = {
  command: ['transfer', 'tf', 'kirimuang', 'pay'], category: 'RPG Menu', limit: 0, cooldown: 5,
  description: '💸 Kirim uang ke user lain: .transfer @user 5000 (pajak 2%)',
  run: async m => {
    const t = target(m, false); const n = jumlah(m)
    if (!t || !Number.isFinite(n) || n <= 0) return m.reply(`💸 \`${P}transfer @user 5000\` atau balas pesan orangnya.`)
    if (t === (m.senderKey || m.sender)) return m.reply('🙃 Transfer ke diri sendiri? Kreatif, tapi tidak.')
    const me = getRPG(m.senderKey || m.sender); const pajak = Math.ceil(n * 0.02)
    if (me.money < n + pajak) return m.reply(`❌ Saldo kurang. Butuh ${rp(n + pajak)} (termasuk pajak 2%), punya ${rp(me.money)}.`)
    addMoney(m.senderKey || m.sender, -(n + pajak)); addMoney(t, n)
    return m.reply(`✅ *TRANSFER BERHASIL*\n▸ Ke: ${tag(t)}\n▸ Jumlah: ${rp(n)} (pajak ${rp(pajak)})\n▸ Sisa saldo: ${rp(getRPG(m.senderKey || m.sender).money)}`, { mentions: [t] })
  }
}
export const harian = {
  command: ['harian', 'dailyclaim', 'hadiahhari', 'klaimhari'], category: 'RPG Menu', limit: 0,
  description: '📅 Klaim hadiah harian (uang + XP), streak berturut-turut = bonus makin besar',
  run: async m => {
    const k = m.senderKey || m.sender; const r = getRPG(k); const now = Date.now(); const hari = 86400e3
    if (r.lastDaily && now - r.lastDaily < hari) { const sisa = hari - (now - r.lastDaily); return m.reply(`⏳ Sudah klaim hari ini. Lagi dalam ${Math.floor(sisa / 3600e3)} jam ${Math.floor(sisa % 3600e3 / 60e3)} menit.\n🔥 Streak: ${r.streak || 1} hari`) }
    r.streak = r.lastDaily && now - r.lastDaily < 2 * hari ? (r.streak || 1) + 1 : 1
    r.lastDaily = now
    const uang = 1000 + Math.min(r.streak, 30) * 300 + r.level * 50; const xp = 40 + Math.min(r.streak, 30) * 10
    addMoney(k, uang); const lv = addExp(k, xp)
    return m.reply(`📅 *HADIAH HARIAN*\n▸ 💰 +${rp(uang)}\n▸ ✨ +${xp} XP${lv.leveledUp ? ' · 🎉 NAIK LEVEL!' : ''}\n▸ 🔥 Streak: *${r.streak} hari* (bonus +${Math.min(r.streak, 30) * 300}/hari)\n\nSaldo: ${rp(getRPG(k).money)} · Lv.${getRPG(k).level}`)
  }
}
export const topkaya = {
  command: ['topkaya', 'richlist', 'orangkaya', 'topuang'], category: 'RPG Menu', limit: 0,
  description: '🏦 10 user terkaya di bot',
  run: async m => {
    const L = allUsers().filter(u => u.rpg).sort((a, b) => (b.rpg.money || 0) - (a.rpg.money || 0)).slice(0, 10)
    return m.reply(`🏦 *TOP 10 TERKAYA*\n\n${L.map((u, i) => `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${truncate(u.name || String(u.jid).split('@')[0], 18)} — ${rp(u.rpg.money)} · Lv.${u.rpg.level}`).join('\n') || 'belum ada'}\n\nSaldo kamu: ${rp(getRPG(m.senderKey || m.sender).money)}`)
  }
}
export const toplevel = {
  command: ['toplevel', 'levellist', 'toprank'], category: 'RPG Menu', limit: 0,
  description: '🏆 10 user level tertinggi',
  run: async m => {
    const L = allUsers().filter(u => u.rpg).sort((a, b) => (b.rpg.level - a.rpg.level) || (b.rpg.exp - a.rpg.exp)).slice(0, 10)
    return m.reply(`🏆 *TOP 10 LEVEL*\n\n${L.map((u, i) => `${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} ${truncate(u.name || String(u.jid).split('@')[0], 18)} — Lv.${u.rpg.level} ${gelarLevel(u.rpg.level)}`).join('\n') || 'belum ada'}`)
  }
}

/* ================= RPG BARU ================= */
const BOS = [['🐺 Serigala Alfa', 60, 2], ['🧌 Troll Gua', 140, 4], ['🐉 Naga Bayangan', 320, 8]]
export const dungeon = {
  command: ['raid', 'gua', 'raidboss', 'raidgua'], category: 'RPG Menu', limit: 0, cooldown: 20,
  description: '🏰 Raid 3 lantai: tiap lantai ada boss; makin dalam makin besar hadiah (uang, XP, item langka). Butuh 30 energi.',
  run: async m => {
    const k = m.senderKey || m.sender; const r = getRPG(k)
    if (r.health < 30) return m.reply(`🩸 HP terlalu rendah (${r.health}). Pulihkan dulu: \`${P}makan\` / \`${P}heal\``)
    if (r.energy < 30) return m.reply(`⚡ Energi kurang (${r.energy}/30). Regen 1 per 2 menit.`)
    r.energy -= 30
    const atk = 10 + r.level * 3 + ((r.equipped?.weapon ? 8 : 0)); const def = 2 + Math.floor(r.level / 2) + (r.equipped?.armor ? 5 : 0)
    let log = [], uang = 0, xp = 0, lantai = 0, items = []
    for (const [nama, hp, dmgBos] of BOS) {
      lantai++; let bhp = hp + r.level * 4; let ronde = 0
      while (bhp > 0 && r.health > 0 && ronde < 12) { ronde++; bhp -= atk + Math.floor(Math.random() * 8); if (bhp > 0) r.health -= Math.max(1, dmgBos + lantai * 2 - def + Math.floor(Math.random() * 4)) }
      if (bhp > 0 || r.health <= 0) { log.push(`Lantai ${lantai}: ${nama} — ❌ kalah (HP habis)`); r.health = Math.max(1, r.health); break }
      const u = 400 * lantai + r.level * 30; const x = 35 * lantai + r.level * 3; uang += u; xp += x
      log.push(`Lantai ${lantai}: ${nama} — ✅ ${ronde} ronde · +${rp(u)} · +${x} XP`)
      if (Math.random() < 0.35 * lantai / 3 + 0.15) { const it = ['ramuan', 'batu_naga', 'kristal', 'daging'][Math.floor(Math.random() * 4)]; try { addItem(k, it, 1); items.push(it) } catch {} }
    }
    addMoney(k, uang); const lv = addExp(k, xp); saveDB('users')
    return m.reply(`🏰 *RAID* — ${lantai}/3 lantai\n\n${log.join('\n')}\n\n💰 Total: ${rp(uang)} · ✨ ${xp} XP${items.length ? ` · 🎁 ${items.join(', ')}` : ''}${lv.leveledUp ? '\n🎉 NAIK LEVEL!' : ''}\n❤️ HP tersisa: ${getRPG(k).health}/${r.maxHealth}`)
  }
}
export const arena = {
  command: ['arena', 'pvp', 'tantang', 'duelinstan'], category: 'RPG Menu', limit: 0, cooldown: 15, group: true,
  description: '⚔️ PvP instan: .arena @user 5000 — sekali klik langsung ada pemenang (mau duel turn-based seru? .duel @user <taruhan>)',
  run: async m => {
    const t = target(m, false); const n = jumlah(m) || 1000
    if (!t) return m.reply(`⚔️ \`${P}arena @user 5000\``)
    const a = m.senderKey || m.sender; if (t === a) return m.reply('🙃 Duel sama diri sendiri?')
    const ra = getRPG(a), rb = getRPG(t)
    if (ra.money < n) return m.reply(`❌ Saldo kamu kurang untuk taruhan ${rp(n)}.`); if (rb.money < n) return m.reply(`❌ Saldo ${tag(t)} kurang untuk taruhan ${rp(n)}.`, { mentions: [t] })
    const sa = ra.level * 10 + ra.health / 4 + Math.random() * 40, sb = rb.level * 10 + rb.health / 4 + Math.random() * 40
    const menang = sa >= sb ? a : t, kalah = menang === a ? t : a
    addMoney(menang, n); addMoney(kalah, -n); addExp(menang, 30); damage(kalah, 15)
    return m.reply(`⚔️ *ARENA PvP* — taruhan ${rp(n)}\n\n${tag(a)} (Lv.${ra.level}) ⚡ ${Math.round(sa)}\n${tag(t)} (Lv.${rb.level}) ⚡ ${Math.round(sb)}\n\n🏆 Pemenang: *${tag(menang)}* +${rp(n)} +30 XP\n💀 ${tag(kalah)} −${rp(n)} −15 HP`, { mentions: [a, t] })
  }
}
/* ================= 20 FUN CEK BARU ================= */
const CEK = [
  ['cekfemboy', 'Femboy', '🎀', 'lucu tapi bahaya'], ['cektolol', 'Tolol', '🤡', 'jangan dibawa ke hati'], ['cekgoblok', 'Goblok', '🥴', 'sabar ya'], ['cekbucin', 'Bucin', '💘', 'chat dia dulu gih'],
  ['cekjomblo', 'Jomblo', '🧍', 'sendiri itu bebas'], ['ceksange', 'Sange', '🥵', 'wudhu dulu bro'], ['cekgans', 'Gans', '😎', 'kata mama'], ['cekcakep', 'Cakep', '🌸', 'filter off tetep cakep'],
  ['cekhalu', 'Halu', '🌈', 'bangun, dia ga peka'], ['cekgabut', 'Gabut', '🥱', 'main game bot aja'], ['cekmiskin', 'Miskin', '🪙', 'cek .harian'], ['cekkaya', 'Kaya', '💸', 'traktir dong'],
  ['ceksigma', 'Sigma', '🐺', 'grindset detected'], ['cekbeta', 'Beta', '🐑', 'ya gapapa'], ['cekredflag', 'Red Flag', '🚩', 'lari sebelum terlambat'], ['cekgreenflag', 'Green Flag', '💚', 'langka, jaga baik-baik'],
  ['cekcringe', 'Cringe', '😬', 'tarik napas dulu'], ['ceknolep', 'Nolep', '🏠', 'kapan terakhir keluar rumah?'], ['cekmesum', 'Mesum', '🔞', 'otaknya dicuci dulu'], ['cekalay', 'Alay', '💅', 'k4mu 4l4y b4ng3t']
]
const hashStr = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }
export const cekBaru = {
  command: CEK.map(c => c[0]),
  category: 'Fun Menu', limit: 0, cooldown: 1,
  description: 'Cek kadar: ' + CEK.map(c => c[0]).join(', ') + ' (20 varian baru, hiburan)',
  run: async m => {
    const [, nama, ikon, komen] = CEK.find(c => c[0] === m.command) || ['', m.command, '❓', '']
    const tgt = m.mentioned?.[0] || m.quoted?.sender || (m.q ? null : m.sender)
    const label = tgt ? tag(tgt) : m.q.trim()
    const v = hashStr(`${m.command}:${(tgt || m.q).toLowerCase()}:${new Date().toISOString().slice(0, 10)}`) % 101
    const bar = '█'.repeat(Math.round(v / 10)) + '░'.repeat(10 - Math.round(v / 10))
    const ket = v >= 85 ? 'PARAH, udah level akhir 💀' : v >= 60 ? 'tinggi juga ya bestie 😭' : v >= 35 ? 'lumayan, masih bisa ditolerir 🫠' : 'aman, rendah banget 😇'
    return m.reply(`${ikon} *CEK ${nama.toUpperCase()}*\n${label}\n\n\`${bar}\` *${v}%*\n_${ket} — ${komen}_`, tgt ? { mentions: [tgt] } : {})
  }
}

export default { addmoney, setmoney, addxp, addlevel, setlevel, transfer, harian, topkaya, toplevel, dungeon, arena, cekBaru }
