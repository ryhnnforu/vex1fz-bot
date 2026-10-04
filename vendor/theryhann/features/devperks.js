/**
 * features/devperks.js — 🧰 10 PERKAKAS DEV (khusus owner, 1 file)
 * ------------------------------------------------------------------
 *  1. .cekduplikat — pindai perintah/alias GANDA antar-plugin (penyebab fitur mati)
 *  2. .setdb       — ubah field database mentah via path (.setdb @user rpg.money 5000)
 *  3. .carikode    — cari teks di semua kode fitur/lib (grep via chat)
 *  4. .cekjs       — cek sintaks file .js tanpa menjalankannya (node --check)
 *  5. .cekconfig   — ringkasan config efektif (rahasia disamarkan)
 *  6. .jidinfo     — identitas JID lengkap pengirim (LID/PN/alts/peta)
 *  7. .exportcmd   — kirim daftar SEMUA perintah sebagai dokumen .txt
 *  8. .rute        — simulasi routing: perintah X ditangani plugin/file apa
 *  9. .hantudb     — pindai record hantu & kosong di database user
 * 10. .versilib    — versi node + dependensi kunci + info environment
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { config } from '../config.js'
import { plugins, findPlugin, listPlugins } from '../lib/plugins.js'
import { loadDB, saveDB } from '../lib/database.js'
import { aliasesOf, canonKey } from '../lib/identity.js'

const P = config.display.prefix
const ROOT = process.cwd()
const potong = (s, n = 1800) => { s = String(s); return s.length > n ? s.slice(0, n) + '\n…(dipotong)' : s }
const dev = (command, description, run) => ({ command, category: 'Owner Menu', description, owner: true, limit: 0, cooldown: 2, run })

/* target user: tag/balasan/ketikan/diri-sendiri (sisa argumen = argumen[1..]) */
function targetUser (m) {
  const a = m.args || []
  const men = m.mentioned?.[0] || m.quoted?.sender
  if (men) return { t: men, sisa: a }
  if (/^(me|saya|aku|diri|sendiri)$/i.test(String(a[0] || ''))) {
    return { t: m.senderKey || m.sender, sisa: a.slice(1) }
  }
  const dig = a.find(x => /^\d{8,16}$/.test(String(x).replace(/[^0-9]/g, '')))
  if (dig) return { t: String(dig).replace(/[^0-9]/g, '').replace(/^0/, '62') + '@s.whatsapp.net', sisa: a.filter(x => x !== dig) }
  return { t: m.senderKey || m.sender, sisa: a }
}

/* ================================================================== */
/*  1. .cekduplikat — pemindai bentrok perintah                          */
/* ================================================================== */
export const cekduplikat = dev(['cekduplikat', 'duplikatcmd', 'cektabrakan'],
  '🧰 (dev) Pindai perintah/alias ganda antar-plugin',
  async m => {
    const peta = new Map()
    for (const [nama, pl] of plugins) {
      for (const c of (pl.command || [])) {
        if (!peta.has(c)) peta.set(c, [])
        peta.get(c).push(`${nama} (${pl.fileName || '?'})`)
      }
    }
    const ganda = [...peta.entries()].filter(([, v]) => v.length > 1)
    if (!ganda.length) return m.reply(`✅ *CEK DUPLIKAT*\n\nTidak ada bentrok — ${peta.size} nama perintah unik dari ${plugins.size} plugin.`)
    return m.reply(potong(
      `⚠️ *CEK DUPLIKAT — ${ganda.length} BENTROK*\n` +
      `(yang menang = file terakhir dimuat; sisanya MATI)\n\n` +
      ganda.slice(0, 25).map(([c, v]) => `• \`${c}\`:\n  ${v.join('\n  ')}`).join('\n\n')
    ))
  })

/* ================================================================== */
/*  2. .setdb — ubah field database mentah                               */
/* ================================================================== */
export const setdb = dev(['setdb', 'ubahdb', 'aturdb'],
  `🧰 (dev) Ubah field DB mentah: \`${P}setdb @user rpg.money 5000\``,
  async m => {
    const { t, sisa } = targetUser(m)
    const jalur = String(sisa[0] || '').trim()
    const nilaiTxt = sisa.slice(1).join(' ').trim()
    if (!jalur || !nilaiTxt) {
      return m.reply(`🧰 *SETDB*\n\nPakai: \`${P}setdb @user|nomor|me <path> <nilai>\`\nContoh: \`${P}setdb @user rpg.money 5000\`\nContoh: \`${P}setdb me limit 100\`\n_nilai dibaca sebagai JSON dulu (angka/true/false), kalau gagal jadi teks._`)
    }
    const kunci = jalur.split('.').filter(Boolean)
    if (!kunci.length || kunci.length > 6 || kunci.some(k => ['__proto__', 'prototype', 'constructor'].includes(k))) {
      return m.reply('❌ Path tidak valid (maks 6 tingkat, tanpa kunci terlarang).')
    }
    let nilai
    try { nilai = JSON.parse(nilaiTxt) } catch { nilai = nilaiTxt }
    const db = loadDB('users', {})
    if (!db[t] || typeof db[t] !== 'object') db[t] = {}
    let o = db[t]
    for (let i = 0; i < kunci.length - 1; i++) {
      if (!o[kunci[i]] || typeof o[kunci[i]] !== 'object') o[kunci[i]] = {}
      o = o[kunci[i]]
    }
    const sebelum = o[kunci[kunci.length - 1]]
    o[kunci[kunci.length - 1]] = nilai
    saveDB('users')
    return m.reply(`🧰 *SETDB OK*\n\n▸ Target: @${String(t).split('@')[0]}\n▸ \`${jalur}\`\n• sebelum: \`${potong(JSON.stringify(sebelum), 300)}\`\n• sesudah: \`${potong(JSON.stringify(nilai), 300)}\``, { mentions: [t] })
  })

/* ================================================================== */
/*  3. .carikode — grep kode via chat                                    */
/* ================================================================== */
export const carikode = dev(['carikode', 'grep', 'cariteks'],
  `🧰 (dev) Cari teks di kode fitur/lib: \`${P}carikode addMoney\``,
  async m => {
    const kunci = String(m.q || (m.args || []).join(' ')).trim()
    if (kunci.length < 3) return m.reply(`🧰 *CARIKODE*\n\nPakai: \`${P}carikode <kata, min 3 huruf>\`\nMencari di \`features/*.js\` + \`lib/*.js\`.`)
    const hasil = []
    const rendah = kunci.toLowerCase()
    for (const dir of ['features', 'lib']) {
      const dp = path.join(ROOT, dir)
      let files = []
      try { files = fs.readdirSync(dp).filter(f => f.endsWith('.js')) } catch { continue }
      for (const f of files) {
        let baris
        try { baris = fs.readFileSync(path.join(dp, f), 'utf8').split('\n') } catch { continue }
        baris.forEach((isi, i) => {
          if (hasil.length >= 25) return
          if (isi.toLowerCase().includes(rendah)) hasil.push(`${dir}/${f}:${i + 1}: ${isi.trim().slice(0, 90)}`)
        })
        if (hasil.length >= 25) break
      }
      if (hasil.length >= 25) break
    }
    if (!hasil.length) return m.reply(`🧰 *CARIKODE — "${kunci}"*\n\nTidak ketemu di features/ + lib/.`)
    return m.reply(potong(`🧰 *CARIKODE — "${kunci}"* (${hasil.length}${hasil.length >= 25 ? '+' : ''})\n\n` + hasil.join('\n')))
  })

/* ================================================================== */
/*  4. .cekjs — cek sintaks file                                         */
/* ================================================================== */
export const cekjs = dev(['cekjs', 'ceksintaks', 'cekfilejs'],
  `🧰 (dev) Cek sintaks file JS: \`${P}cekjs features/delmsg.js\``,
  async m => {
    let rel = String(m.args[0] || '').trim()
    if (!rel) return m.reply(`🧰 *CEKJS*\n\nPakai: \`${P}cekjs <path>\`\nContoh: \`${P}cekjs features/delmsg.js\` / \`${P}cekjs delmsg\` / \`${P}cekjs lib/rpg.js\``)
    if (!rel.endsWith('.js')) {
      const coba = [`features/${rel}.js`, `lib/${rel}.js`, `${rel}.js`].find(c => fs.existsSync(path.join(ROOT, c)))
      if (coba) rel = coba; else rel += '.js'
    }
    const abs = path.normalize(path.join(ROOT, rel))
    if (!abs.startsWith(ROOT + path.sep) && abs !== ROOT) return m.reply('❌ Path di luar repo — ditolak.')
    if (!fs.existsSync(abs)) return m.reply(`❌ File tidak ada: \`${rel}\``)
    try {
      execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe', timeout: 15000 })
      const loc = fs.readFileSync(abs, 'utf8').split('\n').length
      return m.reply(`✅ *CEKJS — SINTAKS OK*\n\n\`${rel}\` (${loc} baris) — tidak ada error sintaks.`)
    } catch (e) {
      const err = String(e?.stderr || e?.stdout || e?.message || e).split('\n').slice(0, 6).join('\n')
      return m.reply(`❌ *CEKJS — ERROR SINTAKS*\n\n\`${rel}\`\n\`\`\`\n${err.slice(0, 1200)}\n\`\`\``)
    }
  })

/* ================================================================== */
/*  5. .cekconfig — ringkasan config efektif                              */
/* ================================================================== */
export const cekconfig = dev(['cekconfig', 'configinfo'],
  '🧰 (dev) Ringkasan config efektif (rahasia disamarkan)',
  async m => {
    const b = config.bot || {}, o = config.owner || {}, d = config.display || {}
    const api = config.api || {}
    const kunciApi = Object.keys(api).map(k => {
      const v = api[k]
      const isi = typeof v === 'object' ? Object.values(v || {}).some(x => !!x) : !!v
      return `${k}: ${isi ? 'terisi ••••' : 'kosong'}`
    })
    return m.reply(
      `🧰 *CEK CONFIG* (v${config.version || '?'} ${config.build || ''})\n\n` +
      `🤖 Bot: ${b.name || '?'} · ${b.number || '?'}\n` +
      `👑 Owner: ${o.name || '?'} · ${o.number || '?'}${(o.extra || []).length ? ` (+${o.extra.length} extra)` : ''}\n` +
      `⌨️ Prefix: \`${d.prefix}\` · menu: ${d.menuMode} · publik: ${d.public ? 'ya' : 'tidak'}\n` +
      `📁 sesi: \`${config.sessionFolder}\` · db: \`${config.databaseFolder}\` · tmp: \`${config.tmpFolder}\`\n` +
      `🔑 API: ${kunciApi.join(' · ') || '-'}\n` +
      `_nilai rahasia tidak pernah ditampilkan._`
    )
  })

/* ================================================================== */
/*  6. .jidinfo — identitas JID pengirim                                 */
/* ================================================================== */
export const jidinfo = dev(['jidinfo', 'myjid', 'siapajid'],
  '🧰 (dev) Identitas JID lengkapmu (LID/PN/alts/peta)',
  async m => {
    const s = m.senderKey || m.sender
    let bentuk = []
    try { bentuk = aliasesOf(s) } catch {}
    const kanon = (() => { try { return canonKey(s, bentuk) } catch { return s } })()
    return m.reply(
      `🧰 *JID INFO*\n\n` +
      `• sender: \`${m.sender}\`\n` +
      `• senderKey: \`${m.senderKey || '-'}\`\n` +
      `• senderAlts: ${(m.senderAlts || []).map(x => `\`${x}\``).join(' ') || '-'}\n` +
      `• semua bentuk dikenal: ${bentuk.map(x => `\`${x}\``).join(' ') || '-'}\n` +
      `• kanonik (dipakai DB): \`${kanon}\`\n` +
      `• mode grup: ${m.addressingMode || (m.isGroup ? '?' : 'pc')}\n` +
      `• status: ${m.isOwner ? '👑owner ' : ''}${m.isAdmin ? '🛡️admin ' : ''}${m.isBotAdmin ? '🤖bot-admin' : ''}`.trim() +
      `\n\n_target user lain? balas pesannya + \`${P}jidinfo\` (info target)_`
    )
  })

/* ================================================================== */
/*  7. .exportcmd — daftar semua perintah → dokumen                       */
/* ================================================================== */
export const exportcmd = dev(['exportcmd', 'daftarcmd'],
  '🧰 (dev) Kirim daftar SEMUA perintah sebagai dokumen .txt',
  async m => {
    const semua = listPlugins()
    const perKat = new Map()
    for (const pl of semua) {
      const k = pl.category || 'Lainnya'
      if (!perKat.has(k)) perKat.set(k, [])
      perKat.get(k).push(pl)
    }
    const teks = [`DAFTAR PERINTAH ${config.bot?.name || 'BOT'} v${config.version || '?'}`, `total ${semua.length} plugin`, '']
    for (const [kat, arr] of [...perKat.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      teks.push(`══ ${kat} (${arr.length}) ══`)
      for (const pl of arr) teks.push(`.${(pl.command || []).join(' / .')} — ${(pl.description || '').slice(0, 80)}`)
      teks.push('')
    }
    const buf = Buffer.from(teks.join('\n'), 'utf8')
    const nama = `daftar-perintah-v${config.version || 'x'}.txt`
    try {
      await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/plain', fileName: nama }, { quoted: m.raw })
    } catch {
      await m.sock.sendMessage(m.jid, { document: buf, mimetype: 'text/plain', fileName: nama })
    }
    return m.reply(`🧰 *EXPORTCMD*\n\nDokumen \`${nama}\` terkirim (${semua.length} plugin, ${perKat.size} kategori).`)
  })

/* ================================================================== */
/*  8. .rute — simulasi routing perintah                                 */
/* ================================================================== */
export const rute = dev(['rute', 'routecmd', 'cekrute'],
  `🧰 (dev) Cek perintah ditangani siapa: \`${P}rute .menu\``,
  async m => {
    const mentah = String(m.q || (m.args || []).join(' ')).trim().split(/\s+/)[0] || ''
    if (!mentah) return m.reply(`🧰 *RUTE*\n\nPakai: \`${P}rute <perintah>\`\nContoh: \`${P}rute .menu\` / \`${P}rute tarung\``)
    const nama = mentah.replace(new RegExp(`^\\${config.display.prefix}`), '').toLowerCase()
    const temu = findPlugin(nama)
    if (!temu) return m.reply(`🧰 *RUTE — "${mentah}"*\n\n❌ TIDAK ADA plugin yang menangani perintah ini.`)
    const pl = temu.plugin || {}
    const bendera = ['owner', 'admin', 'botAdmin', 'group', 'premium'].filter(k => pl[k]).map(k => `\`${k}\``).join(' ') || 'publik'
    return m.reply(
      `🧰 *RUTE — "${mentah}"*\n\n` +
      `• plugin: \`${temu.name}\`\n` +
      `• file: \`${pl.fileName || '?'}\` → \`${pl.exportName || 'default'}\`\n` +
      `• kategori: ${pl.category || '?'}\n` +
      `• akses: ${bendera} · limit: ${pl.limit ?? '?'} · cooldown: ${pl.cooldown ?? 0}s\n` +
      `• alias (${(pl.command || []).length}): ${(pl.command || []).slice(0, 12).map(c => `\`${c}\``).join(' ')}\n` +
      `• deskripsi: ${(pl.description || '-').slice(0, 200)}`
    )
  })

/* ================================================================== */
/*  9. .hantudb — pemindai record hantu                                  */
/* ================================================================== */
export const hantudb = dev(['hantudb', 'ghostdb', 'cekhantu'],
  '🧰 (dev) Pindai record hantu & kosong di database user',
  async m => {
    const db = loadDB('users', {})
    const kunci = Object.keys(db)
    const peta = (() => { try { return loadDB('lidmap', {}) } catch { return {} } })()
    const berdata = u => !!(u && (u.rpg || u.name || u.pushName))
    const lidBerdata = kunci.filter(k => k.endsWith('@lid') && berdata(db[k]))
    const ganda = lidBerdata.filter(l => {
      const pn = peta[l]
      return pn && berdata(db[pn])
    })
    const kosong = kunci.filter(k => !berdata(db[k]))
    const baris = (arr, n = 12) => arr.slice(0, n).map(k => `• \`${k}\``).join('\n') + (arr.length > n ? `\n…+${arr.length - n} lagi` : '')
    return m.reply(potong(
      `🧰 *HANTU DB* (${kunci.length} record user)\n\n` +
      `👻 Record LID berdata: *${lidBerdata.length}*\n${lidBerdata.length ? baris(lidBerdata) + '\n' : ''}` +
      `👥 Ganda LID+PN (data di dua tempat): *${ganda.length}*\n${ganda.length ? baris(ganda) + '\n' : ''}` +
      `🕳️ Record kosong: *${kosong.length}*\n${kosong.length ? baris(kosong) : ''}` +
      `\n_Bersihkan manual via \`${P}resetuser\`, atau biarkan (tidak merusak apa pun)._`
    ))
  })

/* ================================================================== */
/* 10. .versilib — versi & environment                                   */
/* ================================================================== */
export const versilib = dev(['versilib', 'cekdep'],
  '🧰 (dev) Versi node + dependensi kunci + info environment',
  async m => {
    let dep = {}
    try { dep = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies || {} } catch {}
    const penting = ['@rexxhayanasi/elaina-baileys', 'chalk', 'express', 'node-fetch', 'axios', 'fluent-ffmpeg', 'jimp', 'sharp']
    const up = Math.floor(process.uptime())
    const uh = `${Math.floor(up / 3600)}j ${Math.floor(up % 3600 / 60)}m ${up % 60}d`
    return m.reply(
      `🧰 *VERSI & ENV*\n\n` +
      `• bot: v${config.version || '?'} (${config.build || '?'})\n` +
      `• node: \`${process.version}\` · ${process.platform}/${process.arch}\n` +
      `• uptime proses: ${uh}\n` +
      `• repo: \`${ROOT}\`\n\n` +
      `📦 Dependensi kunci:\n` +
      penting.map(n => `• ${n}: \`${dep[n] || '?'}\``).join('\n')
    )
  })

export default { cekduplikat, setdb, carikode, cekjs, cekconfig, jidinfo, exportcmd, rute, hantudb, versilib }
