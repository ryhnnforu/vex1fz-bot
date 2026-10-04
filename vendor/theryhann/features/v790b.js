/**
 * ✨ v7.9.0 BATCH B — 10 fitur baru × 5 kategori (Group · Owner · Tools · AI · Sticker)
 * ------------------------------------------------------------------------------
 *  Group  : guard baru (badword custom, antisticker, antimedia, jam malam,
 *           auto-reply kata kunci) + utilitas admin.
 *  Owner  : pemeliharaan bot & broadcast tersegmen.
 *  Tools  : kalkulator & konverter lokal.
 *  AI     : template prompt siap pakai lewat aiChat yang sama.
 *  Sticker: efek jimp baru (sepia, pixel, bingkai, kartun, kaca, dsb).
 */
import fs from 'node:fs'
import os from 'node:os'
import { Jimp } from 'jimp'
import { config } from '../config.js'
import { getUser, getGroup, allUsers, allGroups, saveDB, getSettings, setSetting, getStats } from '../lib/database.js'
import { pickRandom, truncate, formatDuration, formatSize, saveTmp, toWebp, runtime, processMemory } from '../lib/functions.js'
import { aiChat, cleanAIText } from '../lib/ai.js'
import { listPlugins, categories } from '../lib/plugins.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender
const nomor = j => String(j || '').split('@')[0]
const plug = (cat, command, aliases, description, run, opt = {}) => ({
  command: [command, ...aliases], category: cat, description, limit: 0, cooldown: 2, ...opt,
  run: async (m, ctx) => { try { return await run(m, ctx) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 200)}`) } }
})
const v9 = g => { g.v9 = g.v9 || {}; return g.v9 }
const onoff = q => /^(on|aktif|1|ya|true|nyala)$/i.test(q || '') ? true : /^(off|mati|0|tidak|false|nonaktif)$/i.test(q || '') ? false : null

/* ================================================================== */
/*  1. GROUP MENU — 10 fitur                                            */
/* ================================================================== */
export const GROUP_BARU = [
  plug('Group Menu', 'badword', ['katakasar', 'antibadword', 'kataterlarang'], '🚫 Daftar kata terlarang grup (custom): .badword tambah <kata> | hapus <kata> | list | kick on/off (auto kick 3× pelanggaran)', m => {
    const g = getGroup(m.jid); const V = v9(g); V.badwords = V.badwords || []
    const [a, ...rest] = m.args; const kata = rest.join(' ').toLowerCase().trim()
    if (a === 'tambah' && kata) { if (!V.badwords.includes(kata)) V.badwords.push(kata); saveDB('groups'); return m.reply(`🚫 "${kata}" ditambahkan. Total ${V.badwords.length} kata.`) }
    if (a === 'hapus' && kata) { V.badwords = V.badwords.filter(w => w !== kata); saveDB('groups'); return m.reply(`✅ "${kata}" dihapus.`) }
    if (a === 'kick') { const v = onoff(rest[0]); if (v === null) return m.reply('kick on / off'); V.badwordKick = v; saveDB('groups'); return m.reply(`👢 Auto-kick 3× pelanggaran: ${v ? 'AKTIF' : 'nonaktif'}`) }
    if (a === 'reset') { V.pelanggaran = {}; saveDB('groups'); return m.reply('🔄 Hitungan pelanggaran direset.') }
    return m.reply(`🚫 *KATA TERLARANG GRUP* (${V.badwords.length})\n${V.badwords.map(w => `▸ ${w}`).join('\n') || '_belum ada_'}\n\nAuto-kick 3×: ${V.badwordKick ? 'AKTIF' : 'nonaktif'}\n\n\`${P}badword tambah <kata>\` · \`hapus <kata>\` · \`kick on/off\` · \`reset\`\nPesan pelanggar dihapus otomatis (bot harus admin).`)
  }, { group: true, admin: true }),
  plug('Group Menu', 'antisticker', ['antistiker', 'nostiker'], '🧷 Larang member kirim stiker (dihapus otomatis, admin bebas): .antisticker on/off', m => { const g = getGroup(m.jid); const v = onoff(m.args[0]); if (v === null) return m.reply(`Status: ${v9(g).antisticker ? 'AKTIF' : 'nonaktif'}\n\`${P}antisticker on/off\``); v9(g).antisticker = v; saveDB('groups'); return m.reply(`🧷 Anti stiker ${v ? 'AKTIF' : 'nonaktif'}.`) }, { group: true, admin: true }),
  plug('Group Menu', 'antimedia', ['antifoto', 'antivideo', 'nomedia'], '🖼️ Larang foto/video dari member non-admin: .antimedia on/off', m => { const g = getGroup(m.jid); const v = onoff(m.args[0]); if (v === null) return m.reply(`Status: ${v9(g).antimedia ? 'AKTIF' : 'nonaktif'}\n\`${P}antimedia on/off\``); v9(g).antimedia = v; saveDB('groups'); return m.reply(`🖼️ Anti media ${v ? 'AKTIF' : 'nonaktif'}.`) }, { group: true, admin: true }),
  plug('Group Menu', 'jammalam', ['curfew', 'jamtidur', 'jamtenang'], '🌙 Jam malam: pesan member dihapus pada rentang jam WIB tertentu. .jammalam 23 5 | off', m => {
    const g = getGroup(m.jid); const [a, b] = m.args
    if (/^off$/i.test(a)) { v9(g).jamMalam = null; saveDB('groups'); return m.reply('🌙 Jam malam dimatikan.') }
    const ja = parseInt(a), jb = parseInt(b)
    if (isNaN(ja) || isNaN(jb) || ja < 0 || ja > 23 || jb < 0 || jb > 23) return m.reply(`🌙 Status: ${v9(g).jamMalam ? `AKTIF ${v9(g).jamMalam[0]}:00–${v9(g).jamMalam[1]}:00 WIB` : 'nonaktif'}\n\n\`${P}jammalam 23 5\` — hapus pesan member jam 23:00–05:00 WIB\n\`${P}jammalam off\``)
    v9(g).jamMalam = [ja, jb]; saveDB('groups'); return m.reply(`🌙 Jam malam AKTIF ${ja}:00–${jb}:00 WIB. Pesan member (bukan admin) otomatis dihapus. Bot harus admin.`)
  }, { group: true, admin: true }),
  plug('Group Menu', 'autoreply', ['balasotomatis', 'katakunci', 'autorespon'], '💬 Balasan otomatis kata kunci di grup: .autoreply tambah <kata> = <balasan> | hapus <kata> | list', m => {
    const g = getGroup(m.jid); const V = v9(g); V.autoreply = V.autoreply || {}
    const [a, ...rest] = m.args; const isi = rest.join(' ')
    if (a === 'tambah' && isi.includes('=')) { const [k, ...v] = isi.split('='); const key = k.trim().toLowerCase(), val = v.join('=').trim(); if (!key || !val) return m.reply('Format: tambah kata = balasan'); if (Object.keys(V.autoreply).length >= 30) return m.reply('Maks 30 kata kunci.'); V.autoreply[key] = val; saveDB('groups'); return m.reply(`💬 Kata kunci "${key}" → "${truncate(val, 60)}" disimpan.`) }
    if (a === 'hapus' && isi) { delete V.autoreply[isi.toLowerCase().trim()]; saveDB('groups'); return m.reply('🗑️ Dihapus.') }
    if (a === 'off') { V.autoreply = {}; saveDB('groups'); return m.reply('Semua kata kunci dihapus.') }
    const list = Object.entries(V.autoreply); return m.reply(`💬 *AUTO-REPLY GRUP* (${list.length})\n${list.map(([k, v]) => `▸ *${k}* → ${truncate(v, 50)}`).join('\n') || '_belum ada_'}\n\n\`${P}autoreply tambah halo = Halo juga kak!\`\n\`${P}autoreply hapus halo\``)
  }, { group: true, admin: true }),
  plug('Group Menu', 'peringatan', ['sp', 'warnmember', 'teguran'], '⚠️ Beri peringatan ke @user (3× = auto kick jika bot admin): .peringatan @user [alasan] | .peringatan reset @user', async m => {
    const g = getGroup(m.jid); const V = v9(g); V.warn = V.warn || {}
    const t = m.mentioned?.[0] || m.quoted?.sender; if (!t) return m.reply(`⚠️ \`${P}peringatan @user spam\`\n\`${P}peringatan reset @user\`\n\`${P}peringatan list\``)
    if (m.args[0] === 'reset') { V.warn[t] = 0; saveDB('groups'); return m.reply(`🔄 Peringatan @${nomor(t)} direset.`, { mentions: [t] }) }
    if (m.args[0] === 'list') { const l = Object.entries(V.warn).filter(([, n]) => n > 0); return m.reply(`⚠️ *DAFTAR PERINGATAN*\n${l.map(([j, n]) => `▸ @${nomor(j)} — ${n}/3`).join('\n') || '_bersih_'}`, { mentions: l.map(([j]) => j) }) }
    V.warn[t] = (V.warn[t] || 0) + 1; const n = V.warn[t]; const alasan = m.args.filter(a => !a.startsWith('@')).join(' ') || 'melanggar aturan'
    saveDB('groups')
    if (n >= 3) { V.warn[t] = 0; saveDB('groups'); if (m.isBotAdmin) { try { await m.sock.groupParticipantsUpdate(m.jid, [t], 'remove') } catch {} } return m.reply(`👢 @${nomor(t)} mencapai 3 peringatan → ${m.isBotAdmin ? 'dikeluarkan dari grup.' : 'seharusnya dikeluarkan (bot bukan admin).'}`, { mentions: [t] }) }
    return m.reply(`⚠️ *PERINGATAN ${n}/3* untuk @${nomor(t)}\nAlasan: ${alasan}\n${3 - n} lagi → keluar grup.`, { mentions: [t] })
  }, { group: true, admin: true }),
  plug('Group Menu', 'pilihadmin', ['adminacak', 'undipetugas', 'petugasacak'], '🎲 Pilih member acak jadi petugas/piket hari ini (kecuali bot & admin opsional): .pilihadmin [jumlah]', m => {
    const list = (m.group?.participants || []).filter(p => !p.admin).map(p => p.id).filter(j => j !== m.user)
    const n = Math.min(5, Math.max(1, parseInt(m.args[0]) || 1)); const pilih = list.sort(() => Math.random() - 0.5).slice(0, n)
    if (!pilih.length) return m.reply('Tidak ada member.')
    return m.reply(`🎲 *PETUGAS TERPILIH HARI INI*\n\n${pilih.map((j, i) => `${i + 1}. @${nomor(j)}`).join('\n')}\n\nSelamat bertugas! 🫡`, { mentions: pilih })
  }, { group: true }),
  plug('Group Menu', 'sambutan', ['sambut', 'salamgrup', 'sambutmember'], '👋 Sambut member yang baru (tag) dengan template acak & aturan grup singkat', m => {
    const t = m.mentioned; if (!t?.length) return m.reply(`👋 \`${P}sambutan @user1 @user2\``)
    const g = getGroup(m.jid); const rules = v9(g).rulesSingkat || 'Sopan, no spam, no SARA, baca deskripsi grup.'
    const tpl = pickRandom([`Selamat datang {tag} di *${m.groupName}*! 🎉`, `Halo {tag}! Selamat bergabung di *${m.groupName}* 🤗`, `Wih ada member baru! {tag} welcome to *${m.groupName}* 🚀`])
    return m.reply(tpl.replace('{tag}', t.map(j => '@' + nomor(j)).join(' ')) + `\n\n📜 Aturan singkat: ${rules}\nKetik \`${P}menu\` buat lihat fitur bot.`, { mentions: t })
  }, { group: true }),
  plug('Group Menu', 'setaturansingkat', ['setrulesingkat', 'aturansingkat2', 'rulesingkat'], '📜 Set aturan singkat grup yang dipakai .sambutan', m => { const g = getGroup(m.jid); if (!m.q) return m.reply(`📜 Aturan sekarang: ${v9(g).rulesSingkat || '-'}\n\`${P}setaturan Sopan, no spam, no promosi.\``); v9(g).rulesSingkat = truncate(m.q, 500); saveDB('groups'); return m.reply('📜 Aturan singkat disimpan.') }, { group: true, admin: true }),
  plug('Group Menu', 'statgrupv9', ['statistikgrup2', 'infoguard', 'guardgrup'], '📊 Statistik grup: jumlah member/admin, fitur guard aktif, kata kunci, pelanggaran, pengaturan welcome', m => {
    const g = getGroup(m.jid); const V = v9(g); const ps = m.group?.participants || []
    return m.reply(`📊 *STATISTIK GRUP* — ${m.groupName}\n\n👥 Member: ${ps.length} · 🛡️ Admin: ${ps.filter(p => p.admin).length}\n\n*Guard:*\n▸ Antilink: ${g.antilink ? '✅' : '❌'} · Antitoxic: ${g.antitoxic ? '✅' : '❌'} · NSFW filter: ${g.nsfw ? '❌ (izinkan)' : '✅'}\n▸ Anti stiker: ${V.antisticker ? '✅' : '❌'} · Anti media: ${V.antimedia ? '✅' : '❌'}\n▸ Jam malam: ${V.jamMalam ? `${V.jamMalam[0]}-${V.jamMalam[1]} WIB` : '❌'}\n▸ Kata terlarang: ${(V.badwords || []).length} · Auto-reply: ${Object.keys(V.autoreply || {}).length}\n▸ Peringatan aktif: ${Object.values(V.warn || {}).filter(n => n > 0).length} orang\n\n*Sambutan:* welcome ${g.welcome ? '✅' : '❌'} · goodbye ${g.goodbye ? '✅' : '❌'} · mode ${g.welcomeMode}\n🔇 Mute: ${g.mute ? 'ya' : 'tidak'}`)
  }, { group: true })
]

/* ================================================================== */
/*  2. OWNER MENU — 10 fitur                                            */
/* ================================================================== */
export const OWNER_BARU = [
  plug('Owner Menu', 'bcpremium', ['bcprem', 'broadcastpremium'], '📣 Broadcast pesan hanya ke member premium', async m => { if (!m.q) return m.reply(`📣 \`${P}bcpremium <pesan>\``); const list = allUsers().filter(u => u.premium && u.jid); let n = 0; for (const u of list) { try { await m.sock.sendMessage(u.jid, { text: `📣 *PESAN UNTUK MEMBER PREMIUM*\n\n${m.q}` }); n++; await new Promise(r => setTimeout(r, 400)) } catch {} } return m.reply(`✅ Terkirim ke ${n}/${list.length} member premium.`) }, { owner: true }),
  plug('Owner Menu', 'bcaktif', ['bcactive', 'broadcastaktif'], '📣 Broadcast ke user yang aktif dalam N hari terakhir (default 7): .bcaktif 7 | <pesan>', async m => { const [hari, ...pesan] = m.q.split('|'); const teks = pesan.join('|').trim(); const d = parseInt(hari) || 7; if (!teks) return m.reply(`📣 \`${P}bcaktif 7 | Halo semua!\``); const batas = Date.now() - d * 86400e3; const list = allUsers().filter(u => u.jid && (u.lastChat || 0) > batas); let n = 0; for (const u of list) { try { await m.sock.sendMessage(u.jid, { text: teks }); n++; await new Promise(r => setTimeout(r, 400)) } catch {} } return m.reply(`✅ Terkirim ke ${n}/${list.length} user aktif ${d} hari terakhir.`) }, { owner: true }),
  plug('Owner Menu', 'userinfo', ['cekuser', 'datauser', 'infoakun'], '🔎 Lihat data lengkap seorang user (limit, premium, RPG, banned, aktivitas): .userinfo @user / nomor', m => { const t = m.mentioned?.[0] || (m.args[0] ? m.args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null); if (!t) return m.reply(`🔎 \`${P}userinfo @user\` atau nomor`); const u = getUser(t); const r = u.rpg || {}; return m.reply(`🔎 *USER INFO* @${nomor(t)}\n\n▸ Nama: ${u.name || '-'}\n▸ Premium: ${u.premium ? '✅' + (u.premiumUntil ? ` s/d ${new Date(u.premiumUntil).toLocaleDateString('id-ID')}` : ' (permanen)') : '❌'}\n▸ Limit: ${u.limit} · Level ${u.level} · EXP ${u.exp}\n▸ Banned: ${u.banned ? '🚫 ' + (u.bannedReason || '') : 'tidak'}\n▸ Hits: ${u.hits || 0} · Terakhir chat: ${u.lastChat ? formatDuration(Date.now() - u.lastChat) + ' lalu' : '-'}\n▸ RPG: Lv ${r.level || 1} · ${(r.money || 0).toLocaleString('id-ID')} koin · HP ${r.health}/${r.maxHealth}\n▸ Bergabung: ${new Date(u.created || 0).toLocaleDateString('id-ID')}`, { mentions: [t] }) }, { owner: true }),
  plug('Owner Menu', 'setkoin', ['ubahkoin'], '🪙 Set / tambah koin RPG user: .setkoin @user 10000 | +5000 | -2000', m => { const t = m.mentioned?.[0] || m.quoted?.sender; const v = m.args.find(a => /^[+-]?\d+$/.test(a)); if (!t || !v) return m.reply(`🪙 \`${P}setkoin @user 10000\` · \`+5000\` · \`-2000\``); const u = getUser(t); u.rpg = u.rpg || { money: 0 }; if (/^[+-]/.test(v)) u.rpg.money = Math.max(0, (u.rpg.money || 0) + parseInt(v)); else u.rpg.money = parseInt(v); saveDB('users'); return m.reply(`🪙 Koin @${nomor(t)} sekarang *${u.rpg.money.toLocaleString('id-ID')}*.`, { mentions: [t] }) }, { owner: true }),
  plug('Owner Menu', 'setlevelrpg', ['setlvl', 'setlevelr'], '⭐ Set level RPG user: .setlevelrpg @user 20', m => { const t = m.mentioned?.[0] || m.quoted?.sender; const v = parseInt(m.args.find(a => /^\d+$/.test(a))); if (!t || !v) return m.reply(`⭐ \`${P}setlevelrpg @user 20\``); const u = getUser(t); u.rpg = u.rpg || {}; u.rpg.level = Math.min(999, v); u.rpg.exp = 0; u.rpg.maxHealth = 100 + v * 10; u.rpg.maxEnergy = 100 + v * 5; saveDB('users'); return m.reply(`⭐ Level RPG @${nomor(t)} → *${v}*`, { mentions: [t] }) }, { owner: true }),
  plug('Owner Menu', 'resetdatarpg', ['hapusrpg', 'rpgresetuser', 'resetrpguser'], '♻️ Reset data RPG user ke awal: .resetrpg @user', m => { const t = m.mentioned?.[0] || m.quoted?.sender; if (!t) return m.reply(`♻️ \`${P}resetrpg @user\``); const u = getUser(t); delete u.rpg; saveDB('users'); return m.reply(`♻️ Data RPG @${nomor(t)} direset.`, { mentions: [t] }) }, { owner: true }),
  plug('Owner Menu', 'kesehatanbot', ['healthbot', 'bothealth', 'sehatbot'], '🩺 Ringkasan kesehatan bot: uptime, RAM, CPU load, plugin, DB size, tmp size, versi Node', m => { const mem = processMemory(); const tmpDir = './tmp'; let tmpSize = 0; try { for (const f of fs.readdirSync(tmpDir)) tmpSize += fs.statSync(`${tmpDir}/${f}`).size } catch {} let dbSize = 0; try { for (const f of fs.readdirSync('./database')) dbSize += fs.statSync(`./database/${f}`).size } catch {} const st = getStats(); return m.reply(`🩺 *KESEHATAN BOT*\n\n▸ Uptime: ${runtime()}\n▸ RAM proses: ${typeof mem === 'object' ? (mem.rss || mem.heapUsed || JSON.stringify(mem)) : mem}\n▸ RAM sistem bebas: ${formatSize(os.freemem())} / ${formatSize(os.totalmem())}\n▸ Load CPU (1m): ${os.loadavg()[0].toFixed(2)}\n▸ Node: ${process.version} · platform ${process.platform}\n▸ Plugin: ${listPlugins().length} perintah / ${categories().size} kategori\n▸ Database: ${formatSize(dbSize)} · tmp: ${formatSize(tmpSize)}\n▸ Total hit: ${st?.totalHits ?? st?.hits ?? '-'}\n▸ User: ${allUsers().length} · Grup: ${allGroups().length}`) }, { owner: true }),
  plug('Owner Menu', 'pesanpembuka', ['setgreeting', 'setsapaanbot', 'sapaanbot'], '💬 Set pesan pembuka yang ditampilkan di header .menu (kosongkan = default)', m => { setSetting('pesanPembuka', m.q || ''); return m.reply(m.q ? `💬 Pesan pembuka menu diset:\n\n${m.q}` : '💬 Pesan pembuka dikembalikan ke default.') }, { owner: true }),
  plug('Owner Menu', 'kuncifitur', ['disablecmd', 'nonaktifkanperintah', 'bukafitur'], '🔒 Matikan / hidupkan perintah tertentu secara global: .matikanfitur <cmd> | .matikanfitur on <cmd> | list', m => { const s = getSettings(); s.disabled = s.disabled || []; const [a, b] = m.args; if (a === 'list') return m.reply(`🔒 Perintah nonaktif: ${s.disabled.join(', ') || '-'}`); if (a === 'on' && b) { s.disabled = s.disabled.filter(c => c !== b.toLowerCase()); setSetting('disabled', s.disabled); return m.reply(`✅ \`${b}\` diaktifkan lagi.`) } if (!a) return m.reply(`🔒 \`${P}kuncifitur tebakkata\` · \`${P}kuncifitur on tebakkata\` · \`list\``); const c = a.toLowerCase(); if (!listPlugins().some(p => p.command.includes(c))) return m.reply('Perintah tidak ditemukan.'); if (['menu', 'kuncifitur', 'owner'].includes(c)) return m.reply('Perintah ini tidak boleh dimatikan.'); if (!s.disabled.includes(c)) s.disabled.push(c); setSetting('disabled', s.disabled); return m.reply(`🔒 \`${c}\` dinonaktifkan untuk semua user.`) }, { owner: true })
]

/* ================================================================== */
/*  3. TOOLS — 10 fitur                                                 */
/* ================================================================== */
const fmtRp = n => 'Rp ' + Math.round(n).toLocaleString('id-ID')
export const TOOLS_BARU = [
  plug('Tools', 'cicilan', ['hitungcicilan', 'kpr', 'angsuran'], '💳 Hitung cicilan pinjaman: .cicilan <pokok> <bunga%/tahun> <bulan> → angsuran bulanan (anuitas) & total bunga', m => { const [pk, bg, bl] = m.args.map(Number); if (!pk || bl == null || isNaN(bg)) return m.reply(`💳 \`${P}cicilan 50000000 12 24\`\n(pokok, bunga %/tahun, tenor bulan)`); const i = bg / 100 / 12; const ang = i ? pk * i / (1 - Math.pow(1 + i, -bl)) : pk / bl; return m.reply(`💳 *SIMULASI CICILAN*\n\nPokok: ${fmtRp(pk)}\nBunga: ${bg}%/tahun · Tenor: ${bl} bulan\n\n▸ Angsuran/bulan: *${fmtRp(ang)}*\n▸ Total bayar: ${fmtRp(ang * bl)}\n▸ Total bunga: ${fmtRp(ang * bl - pk)}`) }),
  plug('Tools', 'diskon', ['hitungdiskon', 'potonganharga'], '🏷️ Hitung harga setelah diskon (bisa bertingkat): .diskon 250000 20 | .diskon 250000 20+10', m => { const [h, d] = m.args; const harga = Number(h); if (!harga || !d) return m.reply(`🏷️ \`${P}diskon 250000 20\` · \`${P}diskon 250000 20+10\``); let akhir = harga; const tahap = d.split('+').map(Number); for (const t of tahap) akhir *= (1 - t / 100); return m.reply(`🏷️ *HITUNG DISKON*\n\nHarga awal: ${fmtRp(harga)}\nDiskon: ${tahap.join('% + ')}%\n\n▸ Hemat: ${fmtRp(harga - akhir)}\n▸ Harga akhir: *${fmtRp(akhir)}*\n▸ Setara diskon tunggal: ${((1 - akhir / harga) * 100).toFixed(1)}%`) }),
  plug('Tools', 'ppn', ['pajak', 'hitungppn', 'pph'], '🧾 Hitung PPN 11%/12% atau pajak custom, dari harga sebelum/sesudah pajak: .ppn 100000 [11] [include]', m => { const h = Number(m.args[0]); const t = Number(m.args[1]) || 11; const inc = /inc/i.test(m.args[2] || ''); if (!h) return m.reply(`🧾 \`${P}ppn 100000\` (11%) · \`${P}ppn 100000 12\` · \`${P}ppn 111000 11 include\``); const dasar = inc ? h / (1 + t / 100) : h; const pajak = dasar * t / 100; return m.reply(`🧾 *PAJAK ${t}%*\n\n▸ Dasar (DPP): ${fmtRp(dasar)}\n▸ Pajak: ${fmtRp(pajak)}\n▸ Total: *${fmtRp(dasar + pajak)}*`) }),
  plug('Tools', 'kalori', ['bmr', 'tdee', 'kebutuhankalori'], '🔥 Hitung BMR & kebutuhan kalori harian (Mifflin-St Jeor): .kalori L 70 175 25 [aktivitas 1-5]', m => { const [g, bb, tb, um, ak] = m.args; const L = /^l|p(ria)?$/i.test(g || '') && !/^p$/i.test(g); const w = Number(bb), h = Number(tb), a = Number(um), lvl = Math.min(5, Math.max(1, Number(ak) || 2)); if (!w || !h || !a) return m.reply(`🔥 \`${P}kalori L 70 175 25 2\`\n(gender L/P, berat kg, tinggi cm, umur, aktivitas 1=sangat ringan … 5=sangat berat)`); const bmr = 10 * w + 6.25 * h - 5 * a + (L ? 5 : -161); const f = [1.2, 1.375, 1.55, 1.725, 1.9][lvl - 1]; const tdee = bmr * f; return m.reply(`🔥 *KEBUTUHAN KALORI*\n\n▸ BMR: *${Math.round(bmr)} kkal*/hari\n▸ TDEE (aktivitas ${lvl}): *${Math.round(tdee)} kkal*/hari\n\n🎯 Turun berat: ${Math.round(tdee - 500)} kkal\n🎯 Jaga berat: ${Math.round(tdee)} kkal\n🎯 Naik berat: ${Math.round(tdee + 300)} kkal`) }),
  plug('Tools', 'bungamajemuk', ['investasi', 'compound', 'hitunginvestasi'], '📈 Simulasi investasi bunga majemuk: .bungamajemuk <modal> <return%/tahun> <tahun> [setoran/bulan]', m => { const [md, rt, th, st] = m.args.map(Number); if (!md || !rt || !th) return m.reply(`📈 \`${P}bungamajemuk 10000000 12 10 500000\``); const r = rt / 100 / 12, n = th * 12; let total = md * Math.pow(1 + r, n); if (st) total += st * ((Math.pow(1 + r, n) - 1) / r); const setor = md + (st || 0) * n; const baris = [1, Math.ceil(th / 2), th].filter((v, i, a) => a.indexOf(v) === i).map(t => { const nn = t * 12; let v = md * Math.pow(1 + r, nn); if (st) v += st * ((Math.pow(1 + r, nn) - 1) / r); return `▸ Tahun ${t}: ${fmtRp(v)}` }); return m.reply(`📈 *SIMULASI INVESTASI*\n\nModal ${fmtRp(md)} · ${rt}%/tahun · ${th} tahun${st ? ` · setoran ${fmtRp(st)}/bulan` : ''}\n\n${baris.join('\n')}\n\n💰 Total akhir: *${fmtRp(total)}*\n💵 Total disetor: ${fmtRp(setor)}\n📊 Keuntungan: ${fmtRp(total - setor)} (${((total / setor - 1) * 100).toFixed(0)}%)`) }),
  plug('Tools', 'hariapa', ['tanggalhari', 'cekhari', 'harilahir'], '📆 Cek hari apa suatu tanggal (dd-mm-yyyy) + selisih hari dari hari ini + hari ke berapa dalam tahun', m => { const mt = (m.args[0] || '').match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/); if (!mt) return m.reply(`📆 \`${P}hariapa 17-08-1945\``); const d = new Date(+mt[3], +mt[2] - 1, +mt[1]); if (isNaN(d)) return m.reply('Tanggal tidak valid.'); const hari = d.toLocaleDateString('id-ID', { weekday: 'long' }); const selisih = Math.round((d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400e3); const awal = new Date(d.getFullYear(), 0, 0); const doy = Math.floor((d - awal) / 86400e3); return m.reply(`📆 *${mt[1]}-${mt[2]}-${mt[3]}* jatuh pada hari *${hari}*\n\n▸ ${selisih === 0 ? 'Hari ini!' : selisih > 0 ? `${selisih} hari lagi` : `${-selisih} hari yang lalu`} (${(Math.abs(selisih) / 365.25).toFixed(1)} tahun)\n▸ Hari ke-${doy} dalam tahun ${d.getFullYear()}\n▸ Minggu ke-${Math.ceil(doy / 7)}`) }),
  plug('Tools', 'satuan', ['konversisatuan', 'konversi2', 'unit'], '📏 Konversi satuan panjang/berat/volume/kecepatan/data: .satuan 5 km mil | 70 kg lb | 1 gb mb', m => {
    const T = { km: ['len', 1000], m: ['len', 1], cm: ['len', 0.01], mm: ['len', 0.001], mil: ['len', 1609.344], mile: ['len', 1609.344], kaki: ['len', 0.3048], ft: ['len', 0.3048], inci: ['len', 0.0254], inch: ['len', 0.0254], yard: ['len', 0.9144], kg: ['mass', 1], g: ['mass', 0.001], mg: ['mass', 1e-6], lb: ['mass', 0.4536], ons: ['mass', 0.1], oz: ['mass', 0.02835], ton: ['mass', 1000], l: ['vol', 1], liter: ['vol', 1], ml: ['vol', 0.001], gal: ['vol', 3.785], galon: ['vol', 3.785], cup: ['vol', 0.24], 'km/jam': ['spd', 1], kmh: ['spd', 1], 'm/s': ['spd', 3.6], mph: ['spd', 1.609], knot: ['spd', 1.852], b: ['data', 1], kb: ['data', 1024], mb: ['data', 1048576], gb: ['data', 1073741824], tb: ['data', 1099511627776] }
    const [v, a, b] = m.args; const A = T[(a || '').toLowerCase()], B = T[(b || '').toLowerCase()]; const n = Number(v)
    if (isNaN(n) || !A || !B || A[0] !== B[0]) return m.reply(`📏 \`${P}satuan 5 km mil\` · \`70 kg lb\` · \`2 gb mb\` · \`100 kmh mph\`\nSatuan: ${Object.keys(T).join(', ')}`)
    const hasil = n * A[1] / B[1]; return m.reply(`📏 *${n} ${a}* = *${Number(hasil.toPrecision(8)).toLocaleString('id-ID', { maximumFractionDigits: 6 })} ${b}*`)
  }),
  plug('Tools', 'katasandi', ['passgen', 'generatepass', 'sandiacak'], '🔐 Buat kata sandi kuat + versi frasa mudah diingat + skor kekuatan: .katasandi [panjang]', m => { const n = Math.min(64, Math.max(8, parseInt(m.args[0]) || 16)); const set = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+='; let p = ''; for (let i = 0; i < n; i++) p += set[Math.floor(Math.random() * set.length)]; const kata = ['naga', 'kopi', 'hujan', 'langit', 'meja', 'pisang', 'awan', 'sepeda', 'gunung', 'lampu', 'kunci', 'jeruk', 'batu', 'angin', 'roti', 'ikan']; const frasa = Array.from({ length: 4 }, () => pickRandom(kata)).map(w => w[0].toUpperCase() + w.slice(1)).join('-') + Math.floor(Math.random() * 100); return m.reply(`🔐 *KATA SANDI BARU*\n\nAcak (${n}): \`${p}\`\nFrasa: \`${frasa}\`\n\n💡 Jangan pakai sandi yang sama di banyak akun.`) }),
  plug('Tools', 'ceksandi', ['cekpassword', 'kekuatansandi', 'passcheck'], '🛡️ Cek kekuatan kata sandi (panjang, variasi, pola umum) — tidak disimpan', m => { const s = m.q || ''; if (!s) return m.reply(`🛡️ \`${P}ceksandi <sandi>\` (kirim di chat pribadi ya)`); let skor = 0; const cek = [[s.length >= 8, 'panjang ≥ 8'], [s.length >= 12, 'panjang ≥ 12'], [/[a-z]/.test(s), 'huruf kecil'], [/[A-Z]/.test(s), 'huruf besar'], [/\d/.test(s), 'angka'], [/[^A-Za-z0-9]/.test(s), 'simbol'], [!/(123|abc|qwerty|password|admin|1111|0000)/i.test(s), 'bukan pola umum'], [!/(.)\1{2,}/.test(s), 'tanpa huruf berulang 3×']]; cek.forEach(c => { if (c[0]) skor++ }); const label = ['Sangat lemah', 'Sangat lemah', 'Lemah', 'Lemah', 'Sedang', 'Cukup kuat', 'Kuat', 'Sangat kuat', 'Luar biasa'][skor]; const entropi = Math.round(s.length * Math.log2((/[a-z]/.test(s) ? 26 : 0) + (/[A-Z]/.test(s) ? 26 : 0) + (/\d/.test(s) ? 10 : 0) + (/[^A-Za-z0-9]/.test(s) ? 32 : 0) || 1)); return m.reply(`🛡️ *KEKUATAN SANDI*: *${label}* (${skor}/8)\n${'█'.repeat(skor)}${'░'.repeat(8 - skor)}\n\n${cek.map(c => `${c[0] ? '✅' : '❌'} ${c[1]}`).join('\n')}\n\n🔢 Entropi ≈ ${entropi} bit`) }),
  plug('Tools', 'jadwalkerja', ['shiftkerja', 'jadwalshift', 'rosterkerja'], '🗓️ Buat jadwal shift otomatis untuk beberapa nama selama N hari: .jadwalkerja 7 | Andi, Budi, Cici', m => { const [h, nm] = (m.q || '').split('|'); const hari = Math.min(31, parseInt(h) || 7); const nama = (nm || '').split(',').map(s => s.trim()).filter(Boolean); if (nama.length < 2) return m.reply(`🗓️ \`${P}jadwalkerja 7 | Andi, Budi, Cici\``); const shift = ['🌅 Pagi', '🌇 Sore', '🌙 Malam']; const out = []; const mulai = new Date(); for (let d = 0; d < hari; d++) { const tgl = new Date(mulai.getTime() + d * 86400e3); const baris = nama.map((n, i) => `${shift[(i + d) % shift.length].split(' ')[0]} ${n}`).join(' · '); out.push(`*${tgl.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}*: ${baris}`) } return m.reply(`🗓️ *JADWAL SHIFT ${hari} HARI*\n(${shift.join(' · ')})\n\n${out.join('\n')}`) })
]

/* ================================================================== */
/*  4. AI MENU — 10 fitur (template prompt via aiChat)                  */
/* ================================================================== */
const tanya = async (m, system, prompt, judul) => { await m.react?.('🤖'); const jawab = cleanAIText(await aiChat(prompt, [], { system })); return m.reply(`${judul}\n\n${truncate(jawab, 3800)}`) }
const aiPlug = (cmd, aliases, desc, contoh, judul, system, buildPrompt) => plug('AI Menu', cmd, aliases, desc, m => { const teks = m.q || m.quoted?.text || ''; if (!teks) return m.reply(`${judul}\nContoh: \`${P}${cmd} ${contoh}\``); return tanya(m, system, buildPrompt(teks), judul) }, { limit: 1, cooldown: 5 })
export const AI_BARU = [
  aiPlug('koreksi', ['perbaikiteks', 'grammar', 'ejaan'], '✍️ Perbaiki ejaan, tanda baca & tata bahasa teks (ID/EN) + jelaskan singkat perubahannya', 'saya pergi kepasar kemaren beli sayur2an', '✍️ *KOREKSI TEKS*', 'Kamu editor bahasa profesional. Perbaiki ejaan, tanda baca, dan tata bahasa tanpa mengubah makna. Tampilkan: 1) versi perbaikan, 2) daftar singkat perubahan. Bahasa jawaban mengikuti bahasa teks.', t => `Perbaiki teks berikut:\n\n${t}`),
  aiPlug('jelaskan', ['eli5', 'jelasin', 'jelaskansederhana'], '🧒 Jelaskan konsep apa pun dengan bahasa sederhana seperti ke anak 10 tahun + analogi', 'blockchain', '🧒 *PENJELASAN SEDERHANA*', 'Jelaskan konsep dengan bahasa Indonesia sangat sederhana seperti ke anak 10 tahun, pakai 1 analogi sehari-hari, maksimal 6 kalimat, lalu 1 kalimat "versi dewasa".', t => `Jelaskan: ${t}`),
  aiPlug('kodeai', ['codegen', 'tuliskode', 'kodeprogram'], '💻 Buat / jelaskan / perbaiki kode program: .kodeai buat fungsi python cek bilangan prima', 'buat fungsi python cek bilangan prima', '💻 *KODE AI*', 'Kamu programmer senior. Jawab dengan kode dalam blok ``` dan penjelasan singkat (maks 5 poin). Kalau diminta perbaiki, tunjukkan bug dan versi benar.', t => t),
  aiPlug('idenama', ['idebrand', 'idenamausaha', 'namaide'], '💡 10 ide nama brand/usaha/produk + tagline pendek berdasarkan deskripsi', 'kedai kopi kekinian di Medan', '💡 *IDE NAMA*', 'Kamu konsultan branding kreatif. Berikan 10 ide nama yang mudah diingat, unik, dan relevan, format: nomor. Nama — tagline pendek. Akhiri dengan 1 rekomendasi terbaik dan alasannya.', t => `Buat ide nama untuk: ${t}`),
  aiPlug('debat', ['prokontra', 'argumen', 'sudutpandang'], '⚖️ Tampilkan argumen PRO dan KONTRA yang seimbang tentang suatu topik', 'sekolah 4 hari seminggu', '⚖️ *PRO vs KONTRA*', 'Sajikan 4 argumen PRO dan 4 argumen KONTRA yang kuat & seimbang tentang topik, netral tanpa memihak, lalu 2 kalimat kesimpulan "pertanyaan untuk direnungkan". Bahasa Indonesia.', t => `Topik: ${t}`),
  aiPlug('cerpenai', ['ceritapendek', 'buatcerpen', 'dongeng'], '📚 Buat cerita pendek ±300 kata dari premis/genre yang diminta', 'kucing yang ingin jadi astronot, genre komedi', '📚 *CERPEN AI*', 'Kamu penulis cerpen. Tulis cerita pendek bahasa Indonesia ±300 kata dengan judul, alur jelas (awal-konflik-akhir), dialog hidup, dan ending memuaskan.', t => `Premis: ${t}`),
  aiPlug('emailai', ['buatemail', 'suratresmi', 'emailformal'], '📧 Susun email/surat formal dari poin-poin singkat (izin, lamaran, komplain, permohonan)', 'izin tidak masuk kerja besok karena sakit, ke Pak Budi manajer', '📧 *EMAIL AI*', 'Susun email formal bahasa Indonesia yang sopan dan ringkas: subjek, salam pembuka, isi 2-3 paragraf, penutup, tanda tangan [Nama]. Hindari bertele-tele.', t => `Buat email: ${t}`),
  aiPlug('resepai', ['bikinresep', 'masakapa', 'resepdari'], '🍳 Rekomendasi resep dari bahan yang ada di dapurmu + langkah & estimasi waktu', 'telur, bawang, kecap, nasi sisa', '🍳 *RESEP AI*', 'Kamu chef rumahan. Dari bahan yang disebutkan, sarankan 1 resep utama (nama, porsi, waktu, bahan, langkah bernomor) dan 2 alternatif singkat. Bahasa Indonesia.', t => `Bahan tersedia: ${t}`),
  aiPlug('kuisai', ['buatkuis', 'latihansoal', 'soalpilgan'], '📝 Buat 5 soal pilihan ganda + kunci jawaban dari topik/materi apa pun', 'sistem tata surya kelas 6 SD', '📝 *KUIS AI*', 'Buat 5 soal pilihan ganda (A-D) bahasa Indonesia dengan tingkat kesulitan sesuai permintaan. Setelah semua soal, tulis "KUNCI:" dan jawabannya dengan penjelasan 1 kalimat tiap soal.', t => `Topik: ${t}`),
  aiPlug('rencanaai', ['jadwalbelajar', 'buatrencana', 'planner'], '🗓️ Buat rencana/jadwal langkah demi langkah untuk target tertentu (belajar, diet, tabungan, proyek)', 'belajar bahasa Inggris 30 menit/hari selama 4 minggu', '🗓️ *RENCANA AI*', 'Kamu perencana produktivitas. Buat rencana realistis per minggu/hari dengan target terukur, tips konsistensi, dan cara evaluasi. Format rapi dengan heading singkat dan bullet. Bahasa Indonesia.', t => `Target: ${t}`)
]

/* ================================================================== */
/*  5. STICKER MENU — 10 fitur (efek jimp lokal)                        */
/* ================================================================== */
async function srcBuffer (m) {
  try {
    if (m.quoted?.isMedia) return await m.quoted.toBuffer()
    if (m.isMedia) { const p = await m.download(); return fs.readFileSync(p) }
  } catch {}
  return null
}
async function kirimStiker (m, buf) {
  const input = saveTmp(buf, 'png'); const output = input.replace(/\.png$/, '.webp')
  try { await toWebp(input, output, { animated: false, sticker: true }); return await m.sendSticker(fs.readFileSync(output)) } catch { return await m.sendImage(buf, '⚠️ ffmpeg tidak tersedia, dikirim sebagai gambar.') }
}
const stik = (cmd, aliases, desc, fn) => plug('Sticker Menu', cmd, aliases, desc, async m => {
  const buf = await srcBuffer(m); if (!buf) return m.reply(`Kirim / reply gambar lalu ketik \`${P}${cmd}\`${m.q ? '' : ''}`)
  const img = await Jimp.read(buf); img.cover({ w: 512, h: 512 }); await fn(img, m)
  return kirimStiker(m, await img.getBuffer('image/png'))
}, { limit: 1, cooldown: 4 })
export const STICKER_BARU = [
  stik('ssepia', ['sepiastiker', 'stikercoklat', 'jadulstiker'], '🟤 Stiker efek sepia / foto jadul', img => img.sepia()),
  stik('spixel', ['stikerpixel', 'pixelstiker', 'mozaikstiker'], '🟪 Stiker pixel-art (mozaik): .spixel [ukuran 4-40]', (img, m) => img.pixelate(Math.min(40, Math.max(4, parseInt(m.args[0]) || 12)))),
  stik('sbingkai', ['stikerbingkai', 'frame', 'stikerframe'], '🖼️ Stiker dengan bingkai warna: .sbingkai [warna hex] [tebal]', (img, m) => { const warna = /^#?[0-9a-f]{6}$/i.test(m.args[0] || '') ? parseInt(m.args[0].replace('#', '') + 'ff', 16) : 0xffffffff; const t = Math.min(60, Math.max(4, parseInt(m.args[1]) || 20)); img.scan(0, 0, 512, 512, (x, y) => { if (x < t || y < t || x >= 512 - t || y >= 512 - t) img.setPixelColor(warna, x, y) }) }),
  stik('sbulatbingkai', ['stikerlingkaran', 'circleframe', 'avatarstiker'], '⭕ Stiker bulat dengan ring warna (cocok avatar): .sbulatbingkai [warna hex]', (img, m) => { const warna = /^#?[0-9a-f]{6}$/i.test(m.args[0] || '') ? parseInt(m.args[0].replace('#', '') + 'ff', 16) : 0x38bdf8ff; const c = 256, r = 250, ring = 14; img.scan(0, 0, 512, 512, (x, y, idx) => { const d = Math.hypot(x - c, y - c); if (d > r) img.bitmap.data[idx + 3] = 0; else if (d > r - ring) img.setPixelColor(warna, x, y) }) }),
  stik('skartun', ['stikerkartun', 'cartoon', 'toon'], '🎨 Efek kartun: posterize + kontras + garis tepi lembut', img => { img.posterize(6); img.contrast(0.25); img.normalize() }),
  stik('sneon', ['stikerneon', 'glow', 'stikerglow'], '🌈 Efek neon: invert + saturasi tinggi + tint warna', img => { img.color([{ apply: 'saturate', params: [60] }, { apply: 'hue', params: [Math.floor(Math.random() * 360)] }]); img.contrast(0.3) }),
  stik('sdingin', ['stikerdingin', 'cooltone', 'stikerbiru'], '🧊 Tone dingin (kebiruan) ala filter Instagram', img => img.color([{ apply: 'blue', params: [40] }, { apply: 'red', params: [-20] }, { apply: 'desaturate', params: [10] }])),
  stik('shangat', ['stikerhangat', 'warmtone', 'stikeroranye'], '🔥 Tone hangat (keemasan) ala golden hour', img => img.color([{ apply: 'red', params: [35] }, { apply: 'green', params: [10] }, { apply: 'blue', params: [-25] }])),
  stik('svignette', ['vignettestiker', 'stikergelappinggir', 'fokustengah'], '🌑 Vignette: pinggiran gelap, fokus ke tengah', img => { const c = 256; img.scan(0, 0, 512, 512, (x, y, idx) => { const d = Math.hypot(x - c, y - c) / 362; const f = Math.max(0, 1 - Math.pow(d, 2.2)); img.bitmap.data[idx] *= f; img.bitmap.data[idx + 1] *= f; img.bitmap.data[idx + 2] *= f }) }),
  stik('scermin4', ['kaleidoskopstiker', 'cermin4', 'simetri4'], '🪞 Kaleidoskop: gambar dicerminkan 4 arah (simetri)', async img => { const q = img.clone().crop({ x: 0, y: 0, w: 256, h: 256 }); const a = q.clone(), b = q.clone().flip({ horizontal: true, vertical: false }), c = q.clone().flip({ horizontal: false, vertical: true }), d = q.clone().flip({ horizontal: true, vertical: true }); img.composite(a, 0, 0); img.composite(b, 256, 0); img.composite(c, 0, 256); img.composite(d, 256, 256) })
]

/* v7.9.1: API key AI dari chat (Groq paling gampang & gratis) */
export const AI_KEY_BARU = [
  plug('Owner Menu', 'setaikey', ['setapikeyai', 'aikey', 'setgroq'], '🔑 Pasang API key AI dari chat: .setaikey groq <key> | openrouter <key> | gemini <key> | hapus <nama> — Groq GRATIS & paling mudah', async m => {
    const [prov, ...rest] = m.args; const key = rest.join(' ').trim(); const p = String(prov || '').toLowerCase()
    const { aiKeys, aiProviderAktif } = await import('../lib/ai.js')
    const st = getSettings(); st.aiKeys = st.aiKeys || {}
    if (p === 'hapus' && key) { delete st.aiKeys[key.toLowerCase()]; saveDB('settings'); return m.reply(`🗑️ Key ${key} dihapus. Provider aktif: ${aiProviderAktif()}`) }
    if (!['groq', 'openrouter', 'gemini'].includes(p) || !key) {
      const k = aiKeys()
      return m.reply(`🔑 *API KEY AI*\n\nProvider aktif: *${aiProviderAktif()}*\n▸ groq: ${k.groq ? '✅ ' + k.groq.slice(0, 6) + '…' : '❌'}\n▸ openrouter: ${k.openrouter ? '✅' : '❌'}\n▸ gemini: ${k.gemini ? '✅' : '❌'}\n\n*Cara paling mudah (1 menit, gratis, tanpa kartu):*\n1. Buka console.groq.com → login Google/email\n2. Menu *API Keys* → *Create API Key* → salin (gsk_...)\n3. Ketik: \`${P}setaikey groq gsk_xxxxx\`\n\nAlternatif: openrouter.ai/keys → \`${P}setaikey openrouter sk-or-...\`\nHapus: \`${P}setaikey hapus groq\``)
    }
    st.aiKeys[p] = key; saveDB('settings')
    let uji = ''
    try { const { aiChat } = await import('../lib/ai.js'); const r = await aiChat('Balas satu kata: siap', [], { system: 'Jawab singkat.' }); uji = `\n🧪 Uji: "${truncate(r, 60)}"` } catch (e) { uji = `\n⚠️ Uji gagal: ${truncate(e.message, 120)}` }
    return m.reply(`✅ Key *${p}* tersimpan (${key.slice(0, 6)}…${key.slice(-3)}).\nProvider aktif sekarang: *${aiProviderAktif()}*${uji}`)
  }, { owner: true, limit: 0 }),
  plug('Owner Menu', 'aistatus', ['cekai', 'statusai', 'providerai'], '🤖 Cek provider AI aktif & uji koneksi cepat', async m => {
    const { aiChat, aiProviderAktif } = await import('../lib/ai.js'); const t0 = Date.now()
    try { const r = await aiChat('Sebutkan namamu dalam 5 kata.', []); return m.reply(`🤖 *AI STATUS*\n▸ Provider: *${aiProviderAktif()}*\n▸ Respons: ${Date.now() - t0} ms\n▸ Jawaban: ${truncate(r, 120)}`) } catch (e) { return m.reply(`🤖 *AI STATUS*\n▸ Provider: ${aiProviderAktif()}\n▸ ❌ ${truncate(e.message, 300)}`) }
  }, { owner: true, limit: 0 })
]

export default { GROUP_BARU, OWNER_BARU, TOOLS_BARU, AI_BARU, STICKER_BARU }
