/**
 * 👑 OWNERLAB — 50 fitur khusus owner/developer (kategori Owner Menu, v6)
 * ------------------------------------------------------------
 *  Manajemen plugin (reload/unload/rinci/cari/nonaktifkan),
 *  database (ekspor/impor/backup/restore/statistik/per-user),
 *  broadcast (teks/gambar/dokumen/tombol/grup/privat/tertunda),
 *  status grup (.upswgc2 — upload status WA ke semua anggota grup,
 *  dukung semua tipe file),
 *  konfigurasi bot (prefix, nama, footer, tema menu, model AI,
 *  limit, cooldown, typing, read, antiCall, autoBio, mode publik),
 *  sistem (log, tmp, sesi, dependensi, monitor CPU, cek API, shutdown).
 *
 *  Semua command di file ini `owner: true` — hanya nomor owner di
 *  config.js yang bisa memakainya.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { exec } from 'node:child_process'
import { config } from '../config.js'
import { ROOT, truncate, formatSize, formatDuration, sniffMime } from '../lib/functions.js'
import {
  loadDB, saveDB, getUser, allUsers, allGroups, getSettings, setSetting, getStats
} from '../lib/database.js'
import {
  listPlugins, reloadPlugin, unloadPlugin, plugins as pluginMap, aliases as aliasMap, categories
} from '../lib/plugins.js'

const P = config.display.prefix
const DB_DIR = path.resolve(ROOT, config.databaseFolder || 'database')
const TMP_DIR = path.resolve(ROOT, config.tmpFolder || 'tmp')
const SESI_DIR = path.resolve(ROOT, config.sessionFolder || 'session')

/* ------------------------- helper ------------------------- */
const owner = (command, aliases, description, run, contoh = '1') => ({
  command: [command, ...aliases],
  category: 'Owner Menu',
  description,
  owner: true,
  limit: 0,
  cooldown: 1,
  contoh,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 220)}`) }
  }
})
const jidDari = q => {
  const n = String(q || '').replace(/\D/g, '')
  if (n.length >= 9) return n + '@s.whatsapp.net'
  return String(q || '').includes('@') ? String(q).trim() : null
}
const ukuranFolder = dir => {
  let t = 0
  const walk = d => {
    let e = []
    try { e = fs.readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const x of e) {
      const p = path.join(d, x.name)
      try { if (x.isDirectory()) walk(p); else t += fs.statSync(p).size } catch { /* lewati */ }
    }
  }
  walk(dir)
  return t
}

/* ================================================================== */
/*  A. MANAJEMEN PLUGIN (10)                                           */
/* ================================================================== */
export const ownerPluginCmds = [
  owner('reloadfitur', ['reloadplugin', 'muatfitur'], 'Muat ulang satu file fitur tanpa restart', async m => {
    const file = (m.args[0] || '').replace(/\.js$/, '') + '.js'
    if (!m.args[0]) return m.reply(`Contoh: ${P}reloadfitur funlab\nLihat semua file: ${P}pluginberkas`)
    const before = pluginMap.size
    const reg = await reloadPlugin(file)
    return m.reply(`♻️ *RELOAD ${file}*\n\nTerdaftar: ${reg.length} command\nTotal plugin: ${before} → ${pluginMap.size}\n\n▸ ${reg.slice(0, 12).map(x => P + x).join(', ')}${reg.length > 12 ? ` +${reg.length - 12} lainnya` : ''}`)
  }, 'funlab'),

  owner('hapusfitur', ['unloadplugin', 'buangfitur'], 'Nonaktifkan (hapus dari memori) satu file fitur', m => {
    const file = (m.args[0] || '').replace(/\.js$/, '') + '.js'
    const removed = unloadPlugin(file)
    return m.reply(`🗑️ *UNLOAD ${file}*\n\nDihapus: ${removed.split(',').length} command\n▸ ${truncate(removed, 300)}\n\nSisa plugin: ${pluginMap.size}\nMuat ulang: ${P}reloadfitur ${m.args[0]}`)
  }, 'funlab'),

  owner('pluginrinci', ['plugininfo', 'rincifitur'], 'Rincian satu file fitur: daftar command & kategori', m => {
    const file = (m.args[0] || '').replace(/\.js$/, '')
    if (!file) return m.reply(`Contoh: ${P}pluginrinci islami\nLihat semua: ${P}pluginberkas`)
    const list = listPlugins().filter(p => (p.fileName || '').replace('.js', '') === file)
    if (!list.length) return m.reply(`❌ File "${file}.js" tidak punya plugin terdaftar.`)
    const perKat = {}
    for (const p of list) perKat[p.category] = (perKat[p.category] || 0) + 1
    return m.reply(`📄 *${file}.js*\n\nCommand: *${list.length}*\nKategori: ${Object.entries(perKat).map(([k, v]) => `${k} (${v})`).join(', ')}\n\n${list.map(p => `▸ ${P}${p.name}${p.owner ? ' 👑' : ''}${p.group ? ' 👥' : ''}${p.admin ? ' 🛡️' : ''} — ${truncate(p.description, 50)}`).join('\n').slice(0, 3000)}`)
  }, 'islami'),

  owner('pluginberkas', ['berkasfitur', 'daftarfiturfile'], 'Daftar semua file fitur + jumlah command', m => {
    const dir = path.join(ROOT, 'features')
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
    const list = listPlugins()
    const rows = files.map(f => ({
      f,
      n: list.filter(p => (p.fileName || '') === f).length,
      size: fs.statSync(path.join(dir, f)).size
    })).sort((a, b) => b.n - a.n)
    return m.reply(`📂 *FILE FITUR* (${files.length})\n\n${rows.map(r => `▸ ${r.f.padEnd(20)} ${String(r.n).padStart(3)} cmd · ${formatSize(r.size)}`).join('\n')}\n\nTotal command: *${list.length}*\nRincian: ${P}pluginrinci <file>`)
  }),

  owner('carifitur', ['searchcommand', 'cari perintah'.replace(' ', '')], 'Cari command berdasarkan nama/deskripsi', m => {
    const q = (m.q || '').toLowerCase()
    if (!q) return m.reply(`Contoh: ${P}carifitur sholat`)
    const list = listPlugins().filter(p => p.name.includes(q) || (p.description || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
    if (!list.length) return m.reply(`❌ Tidak ada fitur yang cocok dengan "${q}".`)
    const perKat = {}
    for (const p of list) (perKat[p.category] = perKat[p.category] || []).push(p)
    return m.reply(`🔎 *HASIL "${q}"* (${list.length})\n\n${Object.entries(perKat).map(([k, arr]) => `*${k}* (${arr.length})\n${arr.slice(0, 12).map(p => `▸ ${P}${p.name} — ${truncate(p.description, 44)}`).join('\n')}${arr.length > 12 ? `\n▸ ... +${arr.length - 12} lagi` : ''}`).join('\n\n').slice(0, 3200)}`)
  }, 'sholat'),

  owner('matikanfitur', ['disablecommand', 'nonaktifkan'], 'Sembunyikan satu command (tanpa hapus file)', m => {
    const cmd = (m.args[0] || '').toLowerCase()
    if (!cmd) return m.reply(`Contoh: ${P}matikanfitur tiktok`)
    const pl = pluginMap.get(cmd)
    if (!pl) return m.reply(`❌ Command "${cmd}" tidak ditemukan.`)
    const db = loadDB('settings', {})
    db.disabledCommands = [...new Set([...(db.disabledCommands || []), cmd])]
    pl.disabled = true
    saveDB('settings')
    return m.reply(`🚫 *${cmd}* dinonaktifkan.\n\nAlihkan ke pesan: "${pl.disabledReason || 'fitur sedang dimatikan owner'}"\nAktifkan lagi: ${P}nyalakanfitur ${cmd}\nDaftar: ${P}fiturmati`)
  }, 'tiktok'),

  owner('nyalakanfitur', ['enablecommand', 'aktifkanfitur'], 'Aktifkan kembali command yang dimatikan', m => {
    const cmd = (m.args[0] || '').toLowerCase()
    if (!cmd) return m.reply(`Contoh: ${P}nyalakanfitur tiktok`)
    const db = loadDB('settings', {})
    db.disabledCommands = (db.disabledCommands || []).filter(x => x !== cmd)
    saveDB('settings')
    const pl = pluginMap.get(cmd)
    if (pl) pl.disabled = false
    return m.reply(`✅ *${cmd}* diaktifkan kembali.${pl ? '' : '\n\n(Plugin tidak ada di memori — coba ' + P + 'reloadfitur <file>)'}`)
  }, 'tiktok'),

  owner('fiturmati', ['listdisabled', 'daftarmatikan'], 'Lihat daftar command yang dinonaktifkan', m => {
    const db = loadDB('settings', {})
    const list = db.disabledCommands || []
    return m.reply(`🚫 *COMMAND DINONAKTIFKAN* (${list.length})\n\n${list.length ? list.map(x => `▸ ${P}${x}`).join('\n') : '(tidak ada — semua fitur aktif)'}\n\nMatikan: ${P}matikanfitur <cmd>`)
  }),

  owner('kategorigraf', ['categorychart', 'grafikfitur'], 'Grafik jumlah command per kategori', m => {
    const cats = [...categories()].sort((a, b) => b[1].length - a[1].length)
    const maks = cats[0]?.[1]?.length || 1
    const total = cats.reduce((a, b) => a + b[1].length, 0)
    return m.reply(`📊 *DISTRIBUSI FITUR*\n\n${cats.map(([k, v]) => `${k.padEnd(15)} ${'█'.repeat(Math.max(1, Math.round(v.length / maks * 16)))} ${v.length}`).join('\n')}\n\nTotal: *${total}* command dalam ${cats.length} kategori`)
  }),

  owner('aliascek', ['cekalias', 'daftaralias'], 'Cek semua alias yang mengarah ke satu command', m => {
    const cmd = (m.args[0] || '').toLowerCase()
    if (!cmd) return m.reply(`Contoh: ${P}aliascek menu\nTotal alias terdaftar: ${aliasMap.size}`)
    const utama = aliasMap.get(cmd)
    if (!utama) return m.reply(`❌ "${cmd}" bukan command/alias terdaftar.`)
    const semua = [...aliasMap].filter(([, v]) => v === utama).map(([k]) => k)
    return m.reply(`🔤 *ALIAS ${utama}*\n\n${semua.map(a => `▸ ${P}${a}${a === utama ? ' (utama)' : ''}`).join('\n')}\n\nTotal: ${semua.length} alias`)
  }, 'menu')
]

/* ================================================================== */
/*  B. DATABASE (12)                                                   */
/* ================================================================== */
export const ownerDbCmds = [
  owner('dbstat', ['statistikdb', 'infodbdetail'], 'Statistik seluruh file database', m => {
    const files = fs.existsSync(DB_DIR) ? fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json')) : []
    const rows = files.map(f => {
      const st = fs.statSync(path.join(DB_DIR, f))
      let isi = 0
      try { const j = JSON.parse(fs.readFileSync(path.join(DB_DIR, f), 'utf8')); isi = Array.isArray(j) ? j.length : Object.keys(j).length } catch { isi = -1 }
      return { f, size: st.size, isi, mtime: st.mtime }
    }).sort((a, b) => b.size - a.size)
    return m.reply(`🗄️ *DATABASE*\nFolder: ${DB_DIR}\n\n${rows.map(r => `▸ ${r.f.padEnd(18)} ${formatSize(r.size).padStart(9)} · ${r.isi} kunci · ${r.mtime.toLocaleString('id-ID')}`).join('\n')}\n\nTotal: ${formatSize(rows.reduce((a, b) => a + b.size, 0))}\nUser: ${allUsers().length} · Grup: ${allGroups().length}`)
  }),

  owner('ekspordb', ['exportdb', 'kirimdb'], 'Kirim file database sebagai dokumen', async m => {
    const nama = (m.args[0] || 'users').replace(/\.json$/, '')
    const file = path.join(DB_DIR, `${nama}.json`)
    if (!fs.existsSync(file)) {
      const ada = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
      return m.reply(`❌ Database "${nama}" tidak ada.\nTersedia: ${ada.join(', ')}`)
    }
    const buf = fs.readFileSync(file)
    return await m.sendDoc(buf, `${nama}-${Date.now()}.json`, 'application/json', { caption: `📦 Database *${nama}* (${formatSize(buf.length)})` })
  }, 'users'),

  owner('impordb', ['importdb', 'gandidb'], 'Ganti isi database dari dokumen JSON (balas dokumennya)', async m => {
    const nama = (m.args[0] || 'users').replace(/\.json$/, '')
    if (!m.quoted?.isMedia && !m.isMedia) return m.reply(`Balas sebuah *dokumen .json* dengan caption: ${P}impordb ${nama}`)
    try {
      /* quoted.download() menghasilkan Buffer (bukan path) — pakai m.download()
       *  yang sudah menyimpan ke tmp dan mengembalikan { path, buffer, mime } */
      const h = await m.download()
      const buf = Buffer.isBuffer(h) ? h : (h?.buffer || (h?.path ? fs.readFileSync(h.path) : null))
      if (!buf) throw new Error('Isi dokumen tidak terbaca')
      const teks = buf.toString('utf8')
      const j = JSON.parse(teks)
      if (!j || typeof j !== 'object') throw new Error('Isi JSON tidak valid')
      const lama = fs.existsSync(path.join(DB_DIR, `${nama}.json`)) ? fs.statSync(path.join(DB_DIR, `${nama}.json`)).size : 0
      fs.writeFileSync(path.join(DB_DIR, `${nama}.json`), JSON.stringify(j, null, 1))
      return m.reply(`📥 *IMPOR ${nama}.json* berhasil.\n\nSebelum: ${formatSize(lama)}\nSesudah: ${formatSize(teks.length)}\nKunci   : ${Array.isArray(j) ? j.length : Object.keys(j).length}\n\n⚠️ Restart bot agar data terpakai bersih: ${P}restartsafe`)
    } catch (e) { return m.reply(`❌ Impor gagal: ${truncate(e.message, 180)}`) }
  }, 'users'),

  owner('backupdb', ['cadangkandb'], 'Buat salinan cadangan semua database', m => {
    const dirBackup = path.join(DB_DIR, 'backup')
    fs.mkdirSync(dirBackup, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json'))
    let total = 0
    for (const f of files) {
      fs.copyFileSync(path.join(DB_DIR, f), path.join(dirBackup, `${stamp}__${f}`))
      total++
    }
    return m.reply(`💾 *BACKUP SELESAI*\n\nFile disalin: ${total}\nFolder: database/backup/\nPrefix: ${stamp}\nUkuran: ${formatSize(ukuranFolder(dirBackup))}\n\nLihat: ${P}listbackup\nKembalikan: ${P}restorebackup ${stamp}`)
  }),

  owner('listbackup', ['daftarcadangan'], 'Daftar backup yang tersedia', m => {
    const dirBackup = path.join(DB_DIR, 'backup')
    if (!fs.existsSync(dirBackup)) return m.reply('ℹ️ Belum ada backup. Buat: ' + P + 'backupdb')
    const files = fs.readdirSync(dirBackup).filter(f => f.endsWith('.json'))
    const grup = {}
    for (const f of files) { const [stamp] = f.split('__'); (grup[stamp] = grup[stamp] || []).push(f) }
    const keys = Object.keys(grup).sort().reverse().slice(0, 10)
    return m.reply(`🗂️ *BACKUP* (${files.length} file, ${Object.keys(grup).length} set)\n\n${keys.map(k => `▸ ${k} — ${grup[k].length} file (${formatSize(grup[k].reduce((a, f) => a + fs.statSync(path.join(dirBackup, f)).size, 0))})`).join('\n')}\n\nRestore: ${P}restorebackup <prefix>`)
  }),

  owner('restorebackup', ['kembalikanbackup'], 'Kembalikan database dari backup', m => {
    const stamp = (m.args[0] || '').trim()
    const dirBackup = path.join(DB_DIR, 'backup')
    if (!stamp) return m.reply(`Contoh: ${P}restorebackup 2026-09-03T10-00-00\nLihat: ${P}listbackup`)
    const files = fs.readdirSync(dirBackup).filter(f => f.startsWith(stamp))
    if (!files.length) return m.reply(`❌ Backup dengan prefix "${stamp}" tidak ditemukan.`)
    let n = 0
    for (const f of files) {
      const asli = f.replace(`${stamp}__`, '')
      fs.copyFileSync(path.join(dirBackup, f), path.join(DB_DIR, asli))
      n++
    }
    return m.reply(`♻️ *RESTORE SELESAI*\n\n${n} file dikembalikan dari backup ${stamp}.\n\n⚠️ Restart bot: ${P}restartsafe`)
  }, 'prefix-backup'),

  owner('hapusbackup', ['delbackup'], 'Hapus satu set backup', m => {
    const stamp = (m.args[0] || '').trim()
    const dirBackup = path.join(DB_DIR, 'backup')
    if (!stamp) return m.reply(`Contoh: ${P}hapusbackup <prefix>\nLihat: ${P}listbackup`)
    const files = fs.readdirSync(dirBackup).filter(f => f.startsWith(stamp))
    for (const f of files) fs.unlinkSync(path.join(dirBackup, f))
    return m.reply(`🗑️ ${files.length} file backup "${stamp}" dihapus.`)
  }, 'prefix'),

  owner('userdetail', ['detailuser', 'lihatuser'], 'Data lengkap seorang user di database', m => {
    const jid = jidDari(m.args[0]) || (m.mentionJid?.[0]) || m.senderKey
    const u = getUser(jid)
    const rpg = (() => { try { const db = loadDB('rpg', {}); return db[jid] || {} } catch { return {} } })()
    return m.reply(`👤 *USER ${jid}*\n\n\`\`\`json\n${truncate(JSON.stringify({ ...u, rpg }, null, 2), 2800)}\n\`\`\`\n\nReset: ${P}resetuser ${jid.split('@')[0]}`)
  }, '6281234567890'),

  owner('grupdetail', ['detailgrup', 'lihatgrup'], 'Data lengkap sebuah grup di database', m => {
    const jid = (m.args[0] || m.jid).includes('@g.us') ? (m.args[0] || m.jid) : m.jid
    const db = loadDB('groups', {})
    const g = db[jid] || {}
    const ex = loadDB('groupextra', {})[jid] || {}
    return m.reply(`👥 *GRUP ${jid}*\n\n\`\`\`json\n${truncate(JSON.stringify({ ...g, extra: ex }, null, 2), 2800)}\n\`\`\``)
  }, '1'),

  owner('resetuser', ['hapususer', 'bersihkanuser'], 'Reset data seorang user (level, limit, RPG)', m => {
    const jid = jidDari(m.args[0])
    if (!jid) return m.reply(`Contoh: ${P}resetuser 6281234567890`)
    const db = loadDB('users', {})
    const sebelum = db[jid]
    delete db[jid]
    saveDB('users')
    const rpg = loadDB('rpg', {})
    if (rpg[jid]) { delete rpg[jid]; saveDB('rpg') }
    return m.reply(`🧹 Data user ${jid} direset.\n\nSebelumnya: ${sebelum ? `Lv.${sebelum.level || 1} · ${sebelum.exp || 0} EXP · limit ${sebelum.limit}` : '(belum ada data)'}\n\nSemua user: ${P}resetsemuauser`)
  }, '6281234567890'),

  owner('resetsemualimit', ['limitsemua', 'isilimitall'], 'Isi ulang limit semua user', m => {
    const jumlah = Number(m.args[0]) || config.limits.default
    const users = allUsers()
    const db = loadDB('users', {})
    for (const u of users) { const k = u.jid; if (db[k]) db[k].limit = jumlah }
    saveDB('users')
    return m.reply(`💠 Limit *${users.length} user* diisi jadi ${jumlah} per orang.\n\nTotal limit beredar: ${(jumlah * users.length).toLocaleString('id-ID')}`)
  }, '30'),

  owner('resetsemuauser', ['wipedb', 'hapussemuadata'], 'HAPUS semua data user (perlu konfirmasi)', m => {
    if (String(m.args[0]).toLowerCase() !== 'ya') {
      return m.reply(`⚠️ *BAHAYA* — ini menghapus data ${allUsers().length} user (level, EXP, limit, premium, RPG).\n\nKetik: ${P}resetsemuauser ya`)
    }
    fs.writeFileSync(path.join(DB_DIR, 'users.json'), '{}')
    const rpgPath = path.join(DB_DIR, 'rpg.json')
    if (fs.existsSync(rpgPath)) fs.writeFileSync(rpgPath, '{}')
    return m.reply('🗑️ Semua data user dihapus. Backup dulu lain kali: ' + P + 'backupdb')
  }, 'ya')
]

/* ================================================================== */
/*  C. BROADCAST (7)                                                   */
/* ================================================================== */
const targetBc = (m, mode) => {
  if (mode === 'grup') return allGroups().map(g => g.jid).filter(Boolean)
  if (mode === 'privat') return allUsers().map(u => u.jid).filter(j => j && !j.includes('@g.us'))
  return [...new Set([...allGroups().map(g => g.jid), ...allUsers().map(u => u.jid)])].filter(Boolean)
}
async function jalankanBc (m, mode, kirim, jedaMs = 700) {
  const jids = targetBc(m, mode)
  if (!jids.length) return m.reply(`❌ Tidak ada target (mode ${mode}). Database masih kosong?`)
  await m.reply(`📤 Broadcast ke *${jids.length}* chat (mode ${mode})...`)
  let sukses = 0, gagal = 0
  for (const jid of jids) {
    try { await kirim(jid); sukses++ } catch { gagal++ }
    await new Promise(r => setTimeout(r, jedaMs))
  }
  return m.reply(`✅ *BROADCAST SELESAI*\n\nMode   : ${mode}\nSukses : ${sukses}\nGagal  : ${gagal}\nTotal  : ${jids.length}`)
}
const bcCmd = (command, aliases, description, mode, kirim, contoh) =>
  owner(command, aliases, description, m => jalankanBc(m, mode, jid => kirim(m, jid)), contoh)

export const ownerBcCmds = [
  bcCmd('bcteks', ['bcall', 'broadcastsemua'], 'Broadcast teks ke semua chat', 'semua',
    (m, jid) => m.sock.sendMessage(jid, { text: `📢 *BROADCAST ${config.bot.name}*\n\n${m.q || 'Halo!'}` }), 'Halo semua'),

  bcCmd('bcgrup', ['bcpesangrup'], 'Broadcast teks khusus ke semua grup', 'grup',
    (m, jid) => m.sock.sendMessage(jid, { text: `📢 *PENGUMUMAN UNTUK GRUP*\n\n${m.q || 'Halo!'}` }), 'Halo grup'),

  bcCmd('bcprivat', ['bcpribadi'], 'Broadcast teks khusus ke chat pribadi', 'privat',
    (m, jid) => m.sock.sendMessage(jid, { text: `📢 *PESAN PRIBADI*\n\n${m.q || 'Halo!'}` }), 'Halo'),

  owner('bcgambar', ['broadcastgambar'], 'Broadcast gambar (kirim/balas gambar + caption)', async m => {
    let buf = null
    try {
      if (m.quoted?.isMedia) buf = await m.quoted.toBuffer()
      else if (m.isMedia) buf = await m.download()
    } catch { buf = null }
    if (!buf) return m.reply(`Kirim/balas gambar dengan caption ${P}bcgambar <pesan>`)
    const teks = m.q || `📢 Broadcast dari ${config.bot.name}`
    return jalankanBc(m, 'semua', jid => m.sock.sendMessage(jid, { image: buf, caption: teks }))
  }, 'Pengumuman bergambar'),

  owner('bcdokumen', ['broadcastfile'], 'Broadcast dokumen ke semua chat', async m => {
    let buf = null
    try {
      if (m.quoted?.isMedia) buf = await m.quoted.toBuffer()
      else if (m.isMedia) buf = await m.download()
    } catch { buf = null }
    if (!buf) return m.reply(`Balas dokumen dengan caption ${P}bcdokumen`)
    return jalankanBc(m, 'semua', jid => m.sock.sendMessage(jid, {
      document: buf, mimetype: 'application/pdf', fileName: `pengumuman-${Date.now()}.pdf`,
      caption: m.q || `📢 Dokumen dari ${config.bot.name}`
    }))
  }, '1'),

  owner('bctombol', ['broadcasttombol'], 'Broadcast dengan tombol interaktif', async m => {
    const [teks, ...rest] = (m.q || '').split('|').map(x => x.trim())
    if (!teks) return m.reply(`Contoh: ${P}bctombol Ada fitur baru!|Coba sekarang|.menu`)
    const label = rest[0] || 'Lihat Menu'
    const id = rest[1] || `${P}menu`
    return jalankanBc(m, 'semua', async jid => {
      try {
        await m.sock.sendMessage(jid, {
          text: `📢 *BROADCAST*\n\n${teks}\n\n_(kirim ${label} untuk membuka)_`
        })
      } catch { /* lewati */ }
    })
  }, 'Fitur baru!|Coba|.menu'),

  owner('bctunda', ['jadwalbc', 'bclater'], 'Broadcast tertunda: .bctunda <menit> <pesan>', async m => {
    const menit = Number(m.args[0])
    const pesan = m.args.slice(1).join(' ')
    if (!menit || menit < 1 || menit > 720 || !pesan) return m.reply(`Format: ${P}bctunda <menit 1-720> <pesan>\nContoh: ${P}bctunda 30 Bot akan restart jam 20.00`)
    const jids = targetBc(m, 'semua')
    const sock = m.sock
    setTimeout(async () => {
      for (const jid of jids) {
        try { await sock.sendMessage(jid, { text: `📢 *BROADCAST TERTUNDA*\n\n${pesan}` }) } catch { /* lewati */ }
        await new Promise(r => setTimeout(r, 600))
      }
    }, menit * 60000).unref?.()
    return m.reply(`⏰ Broadcast terjadwal.\n\nTarget: ${jids.length} chat\nWaktu : ${new Date(Date.now() + menit * 60000).toLocaleString('id-ID')} (${menit} menit lagi)\nPesan : ${truncate(pesan, 200)}\n\n⚠️ Hanya jalan selama bot hidup (tidak tahan restart).`)
  }, '30 Bot maintenance')
]

/* ================================================================== */
/*  D. KONFIGURASI (16)                                                */
/* ================================================================== */
const settingCmd = (command, aliases, key, label, parser, keterangan) =>
  owner(command, aliases, `Ubah ${label}`, m => {
    const val = m.q
    if (!val) {
      const s = getSettings()
      return m.reply(`*${label}* saat ini: \`${s[key]}\`\n\nUbah: ${P}${command} <nilai>\n${keterangan}`)
    }
    const parsed = parser(val)
    setSetting(key, parsed)
    if (key === 'botName') config.bot.name = parsed
    if (key === 'footer') config.bot.footer = parsed
    return m.reply(`✅ *${label}* diubah menjadi:\n\`${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}\``)
  }, 'nilai')

export const ownerConfigCmds = [
  settingCmd('setnamabot', ['ganti namabot'.replace(' ', '')], 'botName', 'Nama bot', v => truncate(v, 40), 'Contoh: ' + P + 'setnamabot therYHNN!'),
  settingCmd('setfooter', ['gantifooter'], 'footer', 'Footer menu', v => truncate(v, 80), 'Tampil di bagian bawah menu/kartu.'),
  settingCmd('settemamenu', ['menu theme'.replace(' ', '')], 'menuTheme', 'Tema banner menu', v => v.trim(), 'Tema: ocean, sunset, forest, grape, crimson, midnight, gold, cyber, sakura, mono.'),
  settingCmd('setmodemenu', ['menu mode'.replace(' ', '')], 'menuMode', 'Mode menu', v => (['button', 'list', 'text', 'auto'].includes(v.toLowerCase()) ? v.toLowerCase() : 'auto'), 'Pilihan: button | list | text | auto'),

  owner('setprefix', ['gantiprefix'], 'Ubah prefix command bot', m => {
    const p = (m.args[0] || '').slice(0, 3)
    if (!p) return m.reply(`Prefix saat ini: \`${config.display.prefix}\`\n\nUbah: ${P}setprefix !\nMulti-prefix: ${P}setprefix . ! /`)
    config.display.prefix = p
    setSetting('prefix', p)
    return m.reply(`✅ Prefix diubah ke \`${p}\`\n\nCoba: ${p}menu\n\n⚠️ Prefix tersimpan untuk sesi ini; untuk permanen ubah juga di config.js.`)
  }, '!'),

  owner('setlimitdefault', ['limitdefault'], 'Ubah limit harian default user baru', m => {
    const n = Number(m.args[0])
    if (!n || n < 1 || n > 10000) return m.reply(`Limit saat ini: ${config.limits.default}\n\nUbah: ${P}setlimitdefault 50`)
    config.limits.default = n
    setSetting('limitDefault', n)
    return m.reply(`✅ Limit harian default: *${n}*\n\nUser lama tidak berubah. Isi ulang semua: ${P}resetsemualimit ${n}`)
  }, '50'),

  owner('setcooldown', ['ganticooldown'], 'Ubah jeda antar command (anti spam)', m => {
    const n = Number(m.args[0])
    if (isNaN(n) || n < 0 || n > 60) return m.reply(`Cooldown saat ini: ${config.limits.cooldown} detik\n\nUbah: ${P}setcooldown 2 (0 = mati)`)
    config.limits.cooldown = n
    setSetting('cooldown', n)
    return m.reply(`✅ Cooldown command: *${n} detik*${n === 0 ? ' (dimatikan)' : ''}`)
  }, '2'),

  owner('setmodelai', ['gantimodelai', 'aimodel'], 'Ubah model AI (pollinations)', m => {
    const model = (m.args[0] || '').trim()
    if (!model) return m.reply(`Model saat ini: \`${config.ai.model}\`\n\nUbah: ${P}setmodelai openai\nLainnya: openai-large, mistral, llama, deepseek, qwen-coder`)
    config.ai.model = model
    setSetting('aiModel', model)
    return m.reply(`✅ Model AI: *${model}*\n\nUji: ${P}ai halo`)
  }, 'openai'),

  owner('setapikey', ['isiapikey'], 'Isi API key AI (Gemini/Groq) agar lebih stabil', m => {
    const [jenis, key] = m.args
    if (!jenis || !key) return m.reply(`Format: ${P}setapikey gemini|groq <key>\n\nGemini: ${config.ai.geminiKey ? '✅ terisi' : '❌ kosong'}\nGroq  : ${config.ai.groqKey ? '✅ terisi' : '❌ kosong'}`)
    if (jenis.toLowerCase() === 'gemini') config.ai.geminiKey = key
    else if (jenis.toLowerCase() === 'groq') config.ai.groqKey = key
    else return m.reply('⚠️ Jenis hanya: gemini atau groq')
    return m.reply(`✅ API key ${jenis} disimpan (untuk sesi ini).\n\n⚠️ Untuk permanen, tulis juga di config.js agar tidak hilang setelah restart.`)
  }, 'gemini AIza...'),

  owner('typingon', ['nyalaketik'], 'Nyalakan indikator "sedang mengetik"', m => {
    setSetting('typing', true); return m.reply('✅ Indikator mengetik DINYALAKAN.')
  }),
  owner('typingoff', ['matiketik'], 'Matikan indikator mengetik (hemat resource)', m => {
    setSetting('typing', false); return m.reply('🚫 Indikator mengetik DIMATIKAN.')
  }),
  owner('readon', ['nyalaread', 'centangbiru'], 'Bot membaca pesan (centang biru)', m => {
    setSetting('readCommand', true); return m.reply('✅ Bot akan menandai pesan terbaca.')
  }),
  owner('readoff', ['matiread'], 'Bot tidak menandai terbaca', m => {
    setSetting('readCommand', false); return m.reply('🚫 Centang biru dimatikan.')
  }),
  owner('anticallon', ['nyalaanticall'], 'Tolak panggilan masuk + kirim pesan', m => {
    setSetting('antiCall', true); return m.reply('✅ Anti-call DINYALAKAN. Panggilan akan ditolak otomatis.')
  }),
  owner('anticalloff', ['matianticall'], 'Matikan penolakan panggilan', m => {
    setSetting('antiCall', false); return m.reply('🚫 Anti-call DIMATIKAN.')
  }),
  owner('autobioon', ['nyalaautobio'], 'Bio bot otomatis (uptime & jam)', m => {
    setSetting('autoBio', true); return m.reply('✅ Auto-bio DINYALAKAN. Bio bot akan diperbarui berkala.')
  }),
  owner('autobiooff', ['matiautobio'], 'Matikan bio otomatis', m => {
    setSetting('autobio', false); setSetting('autoBio', false); return m.reply('🚫 Auto-bio DIMATIKAN.')
  }),
  owner('settinglist', ['semuasetting', 'lihatsetting'], 'Lihat semua pengaturan bot', m => {
    const s = getSettings()
    return m.reply(`⚙️ *PENGATURAN BOT*\n\n${Object.entries(s).filter(([k]) => !['uptimeStart'].includes(k)).map(([k, v]) => `▸ ${k}: \`${typeof v === 'object' ? JSON.stringify(v) : v}\``).join('\n').slice(0, 2500)}\n\n*config.js (runtime):*\n▸ prefix: ${config.display.prefix}\n▸ model AI: ${config.ai.model}\n▸ limit: ${config.limits.default}/hari · cooldown ${config.limits.cooldown}s\n▸ owner: ${config.owner.number}`)
  })
]

/* ================================================================== */
/*  E. SISTEM (11)                                                     */
/* ================================================================== */
export const ownerSystemCmds = [
  owner('logbot', ['lihatlog', 'taillog'], 'Lihat N baris terakhir log file (kalau ada)', m => {
    const n = Math.min(80, Number(m.args[0]) || 25)
    const candidates = ['bot.log', 'error.log', 'output.log'].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f))
    if (!candidates.length) return m.reply(`ℹ️ Tidak ada file log di folder bot.\n\nUntuk merekam log, jalankan:\n\`\`\`node index.js 2>&1 | tee bot.log\`\`\`\n\nLihat error terakhir lewat: ${P}monitorcpu · ${P}dbstat`)
    const out = candidates.map(f => {
      const lines = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).slice(-n)
      return `*${path.basename(f)}* (${lines.length} baris terakhir)\n\`\`\`\n${truncate(lines.join('\n'), 1800)}\n\`\`\``
    })
    return m.reply(`📜 *LOG BOT*\n\n${out.join('\n\n')}`)
  }, '25'),

  owner('bersihkantmp2', ['cleantmp', 'hapustmp'], 'Hapus file sementara (tmp/) yang lebih tua dari 30 menit', m => {
    if (!fs.existsSync(TMP_DIR)) return m.reply(`ℹ️ Folder tmp belum ada (${TMP_DIR}).`)
    const batas = Date.now() - 30 * 60000
    let n = 0, ukuran = 0
    for (const f of fs.readdirSync(TMP_DIR)) {
      const p = path.join(TMP_DIR, f)
      try {
        const st = fs.statSync(p)
        if (st.isFile() && st.mtimeMs < batas) { ukuran += st.size; fs.unlinkSync(p); n++ }
      } catch { /* lewati */ }
    }
    return m.reply(`🧹 *TMP DIBERSIHKAN*\n\nFile dihapus: ${n}\nRuang bebas  : ${formatSize(ukuran)}\nSisa di tmp  : ${formatSize(ukuranFolder(TMP_DIR))}`)
  }),

  owner('sesiinfo', ['infosesilogin', 'sessioninfo'], 'Info folder sesi login WhatsApp', m => {
    const ada = fs.existsSync(SESI_DIR)
    const files = ada ? fs.readdirSync(SESI_DIR, { recursive: true }) : []
    const kredensial = ada && fs.existsSync(path.join(SESI_DIR, 'creds.json'))
    return m.reply(`🔐 *SESI LOGIN*\n\nFolder : ${SESI_DIR}\nAda    : ${ada ? '✅ ya' : '❌ belum login'}\nFile   : ${files.length}\nUkuran : ${formatSize(ukuranFolder(SESI_DIR))}\ncreds.json: ${kredensial ? '✅ ada' : '❌ tidak ada'}\n\n⚠️ Jangan hapus folder ini kalau tidak mau login ulang.\nHapus paksa (logout): ${P}hapussesi`)
  }),

  owner('hapussesi', ['logoutbot', 'deletesession'], 'HAPUS sesi login (bot harus scan QR lagi)', m => {
    if (String(m.args[0]).toLowerCase() !== 'ya') return m.reply(`⚠️ Ini akan mengeluarkan bot dari WhatsApp (harus scan QR/pairing lagi).\n\nLanjutkan: ${P}hapussesi ya`)
    fs.rmSync(SESI_DIR, { recursive: true, force: true })
    return m.reply('🗑️ Sesi dihapus. Bot akan keluar dalam beberapa detik — jalankan ulang `node index.js` untuk login.')
  }, 'ya'),

  owner('monitorcpu', ['cpuload', 'bebancpu'], 'Ukur beban CPU & memori selama 1 detik', async m => {
    const c0 = os.cpus().map(c => ({ ...c.times }))
    const t0 = Date.now()
    await new Promise(r => setTimeout(r, 1000))
    const c1 = os.cpus()
    const beban = c1.map((c, i) => {
      const idle = c.times.idle - c0[i].idle
      const total = Object.keys(c.times).reduce((a, k) => a + (c.times[k] - c0[i][k]), 0)
      return total ? Math.round((1 - idle / total) * 100) : 0
    })
    const mu = process.memoryUsage()
    return m.reply(`📈 *MONITOR (${Date.now() - t0} ms)*\n\nCPU rata-rata: *${Math.round(beban.reduce((a, b) => a + b, 0) / beban.length)}%*\nPer core     : ${beban.map(b => b + '%').join(' ')}\nLoad avg     : ${os.loadavg().map(x => x.toFixed(2)).join(' · ')}\n\nRAM sistem   : ${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}\nRAM proses   : ${formatSize(mu.rss)} (heap ${formatSize(mu.heapUsed)})\nUptime proses: ${formatDuration(process.uptime() * 1000)}`)
  }),

  owner('cekapi', ['tesapi', 'apicheck'], 'Uji semua API eksternal yang dipakai bot', async m => {
    const daftar = [
      ['Pollinations (AI)', 'https://text.pollinations.ai/openai/models'],
      ['Quran gading', 'https://api.quran.gading.dev/surah/1'],
      ['Aladhan (jadwal sholat)', 'https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=20'],
      ['Open-Meteo (cuaca)', 'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&current_weather=true'],
      ['Wikipedia ID', 'https://id.wikipedia.org/api/rest_v1/page/summary/Jakarta'],
      ['Kurs er-api', 'https://open.er-api.com/v6/latest/USD'],
      ['TikWM (TikTok)', 'https://tikwm.com/api/?url=https://www.tiktok.com/@tiktok/video/7106594312292453675'],
      ['thum.io (screenshot)', 'https://image.thum.io/get/width/400/crop/300/https://example.com'],
      ['ip-api (lokasi IP)', 'http://ip-api.com/json/8.8.8.8'],
      ['TinyURL', 'https://tinyurl.com/api-create.php?url=https://example.com'],
      ['flagcdn (bendera)', 'https://flagcdn.com/w40/id.png'],
      ['loremflickr (gambar)', 'https://loremflickr.com/320/240/nature']
    ]
    await m.reply(`🔌 Menguji ${daftar.length} API...`)
    const hasil = []
    for (const [nama, url] of daftar) {
      const t0 = Date.now()
      try {
        const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 therYHNN-Bot' } })
        hasil.push(`${r.ok ? '✅' : '⚠️'} ${nama} — HTTP ${r.status} (${Date.now() - t0} ms)`)
      } catch (e) {
        hasil.push(`❌ ${nama} — ${truncate(e.message, 40)} (${Date.now() - t0} ms)`)
      }
    }
    const hidup = hasil.filter(h => h.startsWith('✅')).length
    return m.reply(`🔌 *HASIL CEK API*\n\nHidup: ${hidup}/${daftar.length}\n\n${hasil.join('\n')}\n\n⚠️ Yang ❌ biasanya karena rate-limit sementara atau butuh VPN/jaringan tertentu.`)
  }),

  owner('cekdependensi', ['npmcheck', 'versi modul'.replace(' ', '')], 'Cek versi paket terpasang vs package.json', m => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    const deps = Object.entries({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })
    const rows = deps.map(([nama, want]) => {
      let got = 'TIDAK TERPASANG'
      try { got = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', nama, 'package.json'), 'utf8')).version } catch { /* belum dipasang */ }
      const ok = got !== 'TIDAK TERPASANG'
      return `${ok ? '✅' : '❌'} ${nama} — diminta ${want}, terpasang ${got}`
    })
    return m.reply(`📦 *DEPENDENSI*\n\nNode: ${process.version} · npm ${(() => { try { return fs.existsSync(path.join(ROOT, 'node_modules')) ? 'ada node_modules' : 'tidak ada node_modules' } catch { return '?' } })()}\n\n${rows.join('\n')}\n\n${rows.some(r => r.startsWith('❌')) ? `⚠️ Jalankan: npm install --no-audit --no-fund` : '✅ Semua paket terpasang.'}`)
  }),

  owner('jalankanperintah', ['shell', 'exec2'], 'Jalankan perintah shell (hati-hati!)', async m => {
    const cmd = m.q
    if (!cmd) return m.reply(`Contoh: ${P}jalankanperintah ls -la\n\n⚠️ Berjalan di folder bot dengan user Termux.`)
    const hasil = await new Promise(res => {
      exec(cmd, { cwd: ROOT, timeout: 60000, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
        res({ err: err?.message, stdout: stdout || '', stderr: stderr || '' })
      })
    })
    return m.reply(`💻 *\`$ ${truncate(cmd, 120)}\`*\n\n${hasil.stdout ? '```\n' + truncate(hasil.stdout, 2400) + '\n```' : ''}${hasil.stderr ? '\n⚠️ stderr:\n```\n' + truncate(hasil.stderr, 800) + '\n```' : ''}${hasil.err && !hasil.stdout && !hasil.stderr ? '\n❌ ' + hasil.err : ''}${!hasil.stdout && !hasil.stderr && !hasil.err ? '(tidak ada output)' : ''}`)
  }, 'ls -la'),

  owner('bacafile', ['lihatfile', 'catfile'], 'Baca isi file di folder bot', m => {
    const rel = (m.q || '').trim()
    if (!rel) return m.reply(`Contoh: ${P}bacafile config.js\nLihat daftar: ${P}listfolder`)
    const p = path.resolve(ROOT, rel)
    if (!p.startsWith(ROOT)) return m.reply('⚠️ Path di luar folder bot tidak diizinkan.')
    if (!fs.existsSync(p)) return m.reply(`❌ File tidak ditemukan: ${rel}`)
    const st = fs.statSync(p)
    if (st.isDirectory()) return m.reply(`📂 Itu folder. Isinya:\n${fs.readdirSync(p).slice(0, 40).join('\n')}`)
    return m.reply(`📄 *${rel}* (${formatSize(st.size)})\n\n\`\`\`\n${truncate(fs.readFileSync(p, 'utf8'), 3200)}\n\`\`\``)
  }, 'config.js'),

  owner('listfolder', ['listfile', 'isifolder'], 'Lihat isi folder bot', m => {
    const rel = (m.q || '').trim()
    const p = path.resolve(ROOT, rel)
    if (!p.startsWith(ROOT)) return m.reply('⚠️ Path di luar folder bot tidak diizinkan.')
    if (!fs.existsSync(p)) return m.reply(`❌ Folder tidak ada: ${rel}`)
    const items = fs.readdirSync(p, { withFileTypes: true }).filter(e => e.name !== 'node_modules')
    const dirs = items.filter(e => e.isDirectory()).map(e => `📂 ${e.name}/`)
    const files = items.filter(e => e.isFile()).map(e => {
      const st = fs.statSync(path.join(p, e.name))
      return `📄 ${e.name} · ${formatSize(st.size)}`
    })
    return m.reply(`📁 *${rel || '.'}*\n\n${[...dirs, ...files].join('\n').slice(0, 3000) || '(kosong)'}\n\nBaca file: ${P}bacafile ${rel || ''}/namafile`)
  }, 'features'),

  owner('restartsafe', ['restartaman', 'reboot'], 'Restart bot dengan jeda (pesan tersampaikan dulu)', m => {
    m.reply(`🔄 Bot akan restart dalam 3 detik...\n\nSesi login aman (folder session tidak dihapus).`).catch(() => {})
    setTimeout(() => process.exit(0), 3000).unref?.()
    return undefined
  }),

  owner('matikanbot', ['shutdown', 'stopbot'], 'Matikan bot sepenuhnya', m => {
    m.reply('👋 Bot dimatikan oleh owner. Jalankan ulang dengan `node index.js`.').catch(() => {})
    setTimeout(() => process.exit(0), 2000).unref?.()
    return undefined
  })
]

/* ================================================================== */
/*  F. STATISTIK & PRESTIGE (4)                                        */
/* ================================================================== */
export const ownerStatCmds = [
  owner('statistikpenuh', ['fullstats', 'laporanbot'], 'Laporan lengkap pemakaian bot', m => {
    const s = getStats()
    const users = allUsers(), groups = allGroups()
    const top = Object.entries(s.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const prem = users.filter(u => u.premium).length
    const ban = users.filter(u => u.banned).length
    return m.reply(`📊 *LAPORAN BOT*\n${new Date().toLocaleString('id-ID')}\n\n*Pemakaian*\n▸ Total pesan diproses: ${(s.total || 0).toLocaleString('id-ID')}\n▸ Command unik dipakai: ${Object.keys(s.commands || {}).length}/${pluginMap.size}\n▸ Uptime proses: ${formatDuration(process.uptime() * 1000)}\n\n*Pengguna*\n▸ User: ${users.length} (premium ${prem}, banned ${ban})\n▸ Grup: ${groups.length}\n▸ Grup welcome aktif: ${groups.filter(g => g.welcome).length}\n▸ Grup antilink aktif: ${groups.filter(g => g.antilink).length}\n\n*Top command*\n${top.map(([k, v], i) => `${i + 1}. ${P}${k} — ${v}×`).join('\n') || '(belum ada)'}\n\n*Sistem*\n▸ RAM proses: ${formatSize(process.memoryUsage().rss)}\n▸ Disk bot  : ${formatSize(ukuranFolder(ROOT))}\n▸ Node      : ${process.version} di ${os.platform()}`)
  }),

  owner('bantemp', ['bansementara'], 'Ban sementara (otomatis lepas setelah N jam)', m => {
    const jid = jidDari(m.args[0])
    const jam = Number(m.args[1]) || 24
    const alasan = m.args.slice(2).join(' ') || 'pelanggaran aturan'
    if (!jid) return m.reply(`Contoh: ${P}bantemp 6281234567890 12 spam di grup`)
    const u = getUser(jid)
    u.banned = true
    u.bannedReason = `${alasan} (ban ${jam} jam sampai ${new Date(Date.now() + jam * 3600000).toLocaleString('id-ID')})`
    saveDB('users')
    const sock = m.sock
    setTimeout(() => {
      try {
        const x = getUser(jid)
        x.banned = false
        x.bannedReason = ''
        saveDB('users')
        sock.sendMessage(jid, { text: `✅ Ban sementara kamu sudah dicabut.\nAlasan sebelumnya: ${alasan}\n\nJangan diulangi ya.` }).catch(() => {})
      } catch { /* bot mungkin sudah mati */ }
    }, jam * 3600000).unref?.()
    return m.reply(`🚫 @${jid.split('@')[0]} dibanned *${jam} jam*.\nAlasan: ${alasan}\n\nOtomatis lepas: ${new Date(Date.now() + jam * 3600000).toLocaleString('id-ID')}\n⚠️ Hanya jalan selama bot hidup.`, { mentions: [jid] })
  }, '6281234567890 12 spam'),

  owner('premdetail', ['infopremium', 'datapremium'], 'Rincian semua user premium', m => {
    const users = allUsers().filter(u => u.premium)
    if (!users.length) return m.reply('ℹ️ Belum ada user premium.\nTambah: ' + P + 'addprem 628xxx 30')
    return m.reply(`💎 *USER PREMIUM* (${users.length})\n\n${users.map(u => `▸ ${u.jid.split('@')[0]} — exp ${u.exp || 0}, level ${u.level || 1}${u.premiumUntil ? ', sampai ' + new Date(u.premiumUntil).toLocaleDateString('id-ID') : ''}`).join('\n')}`)
  }),

  owner('kirimfile', ['ambilfile', 'sendfile'], 'Kirim file dari folder bot sebagai dokumen', m => {
    const rel = (m.q || '').trim()
    if (!rel) return m.reply(`Contoh: ${P}kirimfile config.js`)
    const p = path.resolve(ROOT, rel)
    if (!p.startsWith(ROOT)) return m.reply('⚠️ Path di luar folder bot tidak diizinkan.')
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) return m.reply(`❌ File tidak ditemukan: ${rel}`)
    const buf = fs.readFileSync(p)
    return m.sendDoc(buf, path.basename(p), 'application/octet-stream', { caption: `📄 ${rel} (${formatSize(buf.length)})` })
  }, 'config.js')
]


/* ================= STATUS GRUP (v7.2) ================= */
const SW_KEYS = ['imageMessage', 'videoMessage', 'ptvMessage', 'audioMessage', 'documentMessage', 'stickerMessage']
const swCacheNama = new Map()

/** nama grup (subject) dengan cache — dipakai untuk laporan & daftar pilihan */
async function namaGrupDari (m, jid) {
  if (swCacheNama.has(jid)) return swCacheNama.get(jid)
  let n = String(jid).split('@')[0]
  try {
    const meta = await m.sock.groupMetadata(jid)
    if (meta?.subject) n = meta.subject
  } catch { /* pakai fallback nomor */ }
  swCacheNama.set(jid, n)
  return n
}

/** ambil media dari balasan ATAU lampiran pesan (semua tipe file) */
async function mediaSw (m) {
  try {
    const q = m.quoted
    if (q?.isMedia) {
      const msg = q.msg || {}
      const key = SW_KEYS.find(k => msg[k])
      const buf = await q.download()
      return { buf, mime: (key ? msg[key].mimetype : '') || '', mtype: q.mtype, fileName: (key ? msg[key].fileName : '') || '', sumber: 'balasan' }
    }
    if (m.isMedia) {
      const msg = m.msg || {}
      const key = SW_KEYS.find(k => msg[k])
      const buf = await m.download()
      return { buf, mime: m.mimetype || '', mtype: m.mtype, fileName: (key ? msg[key].fileName : '') || '', sumber: 'lampiran' }
    }
  } catch (e) { return { error: truncate(String(e?.message || e), 160) } }
  return null
}

/** petakan media apa pun -> isi pesan status (tipe tak dikenal jadi dokumen) */
function isiStatus (media, caption) {
  if (!media || !media.buf) return { content: { text: caption }, jenis: '📝 teks', mime: 'text/plain' }
  const mime = media.mime || sniffMime(media.buf) || 'application/octet-stream'
  const suara = /ogg|opus/i.test(mime)
  if (media.mtype === 'stickerMessage' || /webp/i.test(mime)) return { content: { sticker: media.buf }, jenis: '🎴 stiker', mime }
  if (media.mtype === 'imageMessage' || mime.startsWith('image/')) return { content: { image: media.buf, caption }, jenis: '🖼️ gambar', mime }
  if (media.mtype === 'videoMessage' || media.mtype === 'ptvMessage' || mime.startsWith('video/')) {
    return { content: { video: media.buf, caption, mimetype: mime }, jenis: '🎥 video', mime }
  }
  if (media.mtype === 'audioMessage' || mime.startsWith('audio/')) {
    return { content: { audio: media.buf, mimetype: mime, ptt: suara }, jenis: suara ? '🎙️ voice note' : '🎵 audio', mime }
  }
  const nama = media.fileName || `status-${Date.now()}.bin`
  return { content: { document: media.buf, mimetype: mime, fileName: nama, caption }, jenis: '📄 dokumen', mime }
}

export const ownerSwCmds = [
  owner('upswgc2', ['upswgc', 'upswgroup', 'upstatusgrup', 'statusgrup', 'swgrup', 'storygrup', 'upswgcdua', 'statusgc'],
    'Upload STATUS WA ke semua anggota grup — dukung SEMUA tipe file (gambar/video/audio/dokumen/stiker/teks)',
    async m => {
      const gs = allGroups()
      let targets = []
      let caption = m.q || ''

      /* ---- tentukan grup tujuan ---- */
      if (m.isGroup) {
        targets = [m.chat]
      } else {
        const arg = String(m.args[0] || '').trim()
        caption = m.args.slice(1).join(' ')
        if (!arg) {
          if (!gs.length) {
            return m.reply(
              `❌ Bot belum tercatat di grup mana pun (database grup kosong).\n\n` +
              `Cara pakai di dalam grup: balas/kirim media lalu ketik ${P}upswgc2 <caption>`
            )
          }
          const baris = []
          for (const g of gs.slice(0, 25)) baris.push(`${baris.length + 1}. ${await namaGrupDari(m, g.jid)}\n   \`${g.jid}\``)
          return m.reply(
            `📤 *STATUS GRUP* — ${P}upswgc2\n\n` +
            'Kamu memakainya di chat pribadi, jadi sebutkan grupnya:\n\n' +
            `${baris.join('\n')}\n\n` +
            '*Contoh:*\n' +
            `▸ ${P}upswgc2 1 Halo semua          (pakai nomor urut)\n` +
            `▸ ${P}upswgc2 ${gs[0].jid} Halo       (pakai jid)\n` +
            `▸ ${P}upswgc2 all Halo               (semua grup sekaligus)\n\n` +
            'Balas/kirim media apa pun (gambar, video, audio, dokumen, stiker) + caption untuk status bermedia.'
          )
        }
        if (/^all$/i.test(arg)) targets = gs.map(g => g.jid)
        else if (arg.endsWith('@g.us')) targets = [arg]
        else if (/^\d{1,4}$/.test(arg) && Number(arg) >= 1 && Number(arg) <= gs.length) targets = [gs[Number(arg) - 1].jid]
        else {
          const angka = arg.replace(/\D/g, '')
          const ketemu = angka ? gs.find(g => String(g.jid).startsWith(angka)) : null
          targets = [ketemu ? ketemu.jid : (angka.length >= 9 ? `${angka}@g.us` : arg)]
        }
      }
      targets = [...new Set(targets.filter(Boolean))]
      if (!targets.length) return m.reply('❌ Tidak ada grup tujuan.')

      /* ---- media / teks ---- */
      const media = await mediaSw(m)
      if (media?.error) return m.reply(`❌ Gagal mengunduh media: ${media.error}`)
      if (!media && !caption.trim()) {
        return m.reply(
          `Kirim/balas *media apa pun* dengan caption ${P}upswgc2 <caption>\n` +
          `atau kirim teks saja: ${P}upswgc2 <pesan>\n\n` +
          'Didukung: gambar, video, GIF, audio/voice note, stiker, dokumen (pdf/zip/apk/xlsx/…), dan teks.'
        )
      }
      const { content, jenis, mime } = isiStatus(media, caption.trim() || `📢 Status dari ${config.bot.name}`)

      /* ---- kirim sebagai status khusus anggota grup ---- */
      const nama = []
      for (const t of targets.slice(0, 8)) nama.push(await namaGrupDari(m, t))
      if (targets.length > 8) nama.push(`+${targets.length - 8} grup lain`)
      try {
        await m.sock.sendMessage(targets, content, { delayMs: 1500 })
      } catch (e) {
        return m.reply(
          `❌ Gagal upload status grup: ${truncate(String(e?.message || e), 200)}\n\n` +
          'Catatan: status hanya muncul di tab *Status* anggota yang nomornya tersimpan / mengikuti nomor bot.'
        )
      }
      const ukuran = media?.buf ? formatSize(media.buf.length) : formatSize(Buffer.byteLength(content.text || ''))
      return m.reply(
        `✅ *STATUS GRUP TERKIRIM*\n\n` +
        `Jenis    : ${jenis}\n` +
        `MIME     : ${mime}\n` +
        `Ukuran   : ${ukuran}\n` +
        `Tujuan   : ${targets.length} grup\n` +
        `Grup     : ${nama.join(', ')}\n` +
        `Caption  : ${caption.trim() ? truncate(caption.trim(), 90) : '(otomatis)'}\n\n` +
        'Status tampil di tab *Status* semua anggota grup tersebut (bukan di chat grup).'
      )
    }, 'Halo semua, cek status bot ya!'),

  /* ---- v7.22.0: STATUS GRUP ASLI (groupStatusMessageV2 via relayMessage) — port dari handler swgc ---- */
  {
    command: ['swgc', 'swgroup', 'statusgrupasli', 'upgroupstatus', 'gcstatus', 'swgrupasli'],
    category: 'Group Menu',
    description: '📸 Unggah STATUS GRUP WhatsApp (status milik grup, bukan status bot): .swgc <teks> atau balas media/pesan',
    group: true, admin: true, limit: 0, cooldown: 5, contoh: 'Halo semua',
    run: async m => {
      if (!m.isGroup) return m.reply('Khusus grup.')
      const text = String(m.q || '').trim()
      const CTX = { statusSourceType: 4, statusAttributions: [{ type: 10 }], statusAudienceMetadata: { audienceType: 1 } }
      const teksMsg = t => ({
        extendedTextMessage: {
          text: t, textArgb: 4294967295, backgroundArgb: 4280669030, font: 5, previewType: 0,
          contextInfo: { forwardingScore: 0, featureEligibilities: { canBeReshared: true, canReceiveMultiReact: true }, ...CTX },
          inviteLinkGroupTypeV2: 0
        }
      })
      let message
      const MEDIA = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'ptvMessage']
      const qRaw = m.quoted?.msg ? (m.quoted.msg.ephemeralMessage?.message || m.quoted.msg.viewOnceMessageV2?.message || m.quoted.msg.viewOnceMessage?.message || m.quoted.msg) : null
      const rawOwn = m.msg?.ephemeralMessage?.message || m.msg || {}
      const qMediaType = qRaw ? MEDIA.find(k => qRaw[k]) : null
      const ownMediaType = MEDIA.find(k => rawOwn[k])
      if (qMediaType) {
        const media = { ...qRaw[qMediaType] }
        media.contextInfo = { ...(media.contextInfo || {}), ...CTX }
        if (text) media.caption = text
        message = { [qMediaType]: media }
      } else if (ownMediaType) {
        const media = { ...rawOwn[ownMediaType] }
        media.contextInfo = { ...(media.contextInfo || {}), ...CTX }
        media.caption = text
        message = { [ownMediaType]: media }
      } else if (m.quoted) {
        message = teksMsg(m.quoted.text || '')
      } else if (text) {
        message = teksMsg(text)
      } else {
        return m.reply(`Contoh:\n${P}swgc Halo semua\n\nAtau reply media/pesan dengan ${P}swgc`)
      }
      try {
        const { randomBytes } = await import('node:crypto')
        await m.sock.relayMessage(m.jid, {
          messageContextInfo: { messageSecret: randomBytes(32) },
          groupStatusMessageV2: { message }
        }, {})
        return m.reply('✅ Status grup berhasil dikirim')
      } catch (e) {
        console.error(e)
        return m.reply(`❌ Gagal mengirim status grup\n\n${e.message || e}`)
      }
    }
  }
]

export const ownerlabCmds = [
  ...ownerPluginCmds, ...ownerDbCmds, ...ownerBcCmds, ...ownerSwCmds,
  ...ownerConfigCmds, ...ownerSystemCmds, ...ownerStatCmds
]

export default { ownerlabCmds }
