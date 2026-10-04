/**
 * 🧰 DEV PLUS (v7.8.0) — tambahan praktis di Dev Menu
 * ------------------------------------------------------------------
 *  • .dbsize        — ukuran DB & file database per modul
 *  • .setcashuser   — (owner) set saldo uang RPG user manual (tanpa konfirmasi)
 *  • .pluginhealth  — laporan kesehatan muatan plugin (jumlah/bootstrap laporan fail pada muatan)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { getUser, saveNow, listDB } from '../lib/database.js'
import { truncate } from '../lib/functions.js'
import { aliasesOf, canonKey } from '../lib/identity.js'

const P = config.display.prefix
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const fmtB = n => {
  n = Number(n) || 0
  if (n < 1024) return n + ' B'
  if (n < 1024 ** 2) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 ** 3) return (n / 1024 ** 2).toFixed(1) + ' MB'
  return (n / 1024 ** 3).toFixed(2) + ' GB'
}

/** cari akumber manual perintah target sederhana dari argumen tunggal (kecuali mention/reply/nomor) */
function nomorTargetDari (m) {
  const mentah = m.mentioned?.[0] || m.quoted?.sender || (m.args[0] ? String(m.args[0]).replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null)
  return mentah || null
}

export const dbSize = {
  command: ['dbsize', 'dbsizestats', 'dbsizejson', 'cekukurandb'],
  category: 'Owner Menu',
  description: '🗄 Lihat ukuran folder database & per-file *.json* (devmaks)',
  owner: true,
  limit: 0,
  run: m => {
    const dir = path.join(ROOT, 'database')
    let files = []
    try {
      files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const st = fs.statSync(path.join(dir, f))
          return { name: f, size: st.size }
        })
        .sort((a, b) => b.size - a.size)
    } catch (e) { return m.reply('⚠️ Folder database tak bisa dibaca: ' + e.message) }

    const total = files.reduce((a, b) => a + b.size, 0)
    const dbs = listDB?.() || []
    return m.reply(
      `🗄 *UKURAN DATABASE* (${files.length} file)\n` +
      `Total: *${fmtB(total)}*\n\n` +
      files.slice(0, 18).map((f, i) => `${i + 1}. ${f.name} — ${fmtB(f.size)}`).join('\n') +
      (files.length > 18 ? `\n(+${files.length - 18} lainnya)` : '') +
      `\n\nBersihkan file sementara: \`${P}tmpbekasi\` (reset penuh bisa hopelanse data user jika di-clear tanpa backup!)`
    )
  }
}

export const setCashUser = {
  command: ['setcashuser', 'cashtarget', 'setuanguser', 'setusercash', 'cashtarget premium'.replace(' ', '')],
  category: 'Owner Menu',
  description: '💰 (owner) Set saldo uang RPG user — `.setcashuser 62xx 1000000` atau reply + perintah',
  owner: true,
  limit: 0,
  run: async m => {
    const tujuan = nomorTargetDari(m)
    const angka = parseInt((m.args.map(a => String(a).replace(/[^0-9-]/g, '')).filter(a => a !== '') || []).pop() || '', 10)
    if (!tujuan || !Number.isFinite(angka)) {
      return m.reply(
        `💰 *SET CASH USER* — atur saldo uang RPG manual (owner).\n\n` +
        `• \`${P}setcashuser 628123xxx 1000000\`\n` +
        `• atau balas user target dengan jumlahnya\n\n` +
        `Catatan: pakai dengan bijak, ekonomi bisa rusak bila ditambahkan tanpa siafting.`
      )
    }
    if (angka < 0) return m.reply('❌ Saldo tidak boleh negatif.')
    const u = getUser(canonKey(tujuan, aliasesOf(tujuan)) || tujuan)
    if (!u.rpg) u.rpg = { money: 0, level: 1, exp: 0 }
    const sblum = u.rpg.money || 0
    u.rpg.money = angka
    saveNow('users')
    return m.reply(
      `✅ *SALDO DIUBAH*\n` +
      `▸ Target: @${tujuan.split('@')[0]}\n` +
      `▸ ${sblum.toLocaleString('id-ID')} → *${angka.toLocaleString('id-ID')}* uang\n\n` +
      `Cek saldo: \`${P}premcek\``
      , { mentions: [tujuan] })
  }
}

export const pluginHealth = {
  command: ['pluginhealth', 'pluginstatistik', 'pluginstats', 'healthplugin'],
  category: 'Owner Menu',
  description: '📊 Laporan ringkasan pluginlload-status (total, per-kategori)',
  owner: true,
  limit: 0,
  run: async m => {
    try {
      const { categories, plugins } = await import('../lib/plugins.js')
      const cat = [...categories().entries()].map(([k, v]) => ({ k, n: v.length }))
      const tot = plugins.size
      const perHit = m.userDB?.hits
      return m.reply(
        `📊 *PLUGIN HEALTH — ${tot} plugin, ${cat.length} kategori*\n\n` +
        cat.map(x => `▸ *${x.k}* — ${x.n} plugin`).join('\n') +
        `\n\nAlias aktif: ${Object.keys(Object.fromEntries(plugins)).length}`
      )
    } catch (e) { return m.reply('⚠️ Gagal ambil report: ' + truncate(String(e?.message || e), 100)) }
  }
}

export default { dbSize, setCashUser, pluginHealth }
