/**
 * features/menubuilder.js — 🎨 .buatmenu / .simpanmenu / .setmenuN / .menusaya / .hapusmenu (v7.30.0)
 *  Menu kustom disimpan di settings.menuKustom = { 4: {cfg, dibuat}, 5: {...} }.
 *  settings.menuMode = 'menu4' → features/menu.js merender lewat renderMenuKustom().
 */
import { config } from '../config.js'
import { getSettings, setSetting } from '../lib/database.js'
import { categories } from '../lib/plugins.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { truncate } from '../lib/functions.js'
import { builderHtml, kodeKeCfg, cfgKeKode, TEMPLATE, TEMA } from '../lib/menubuilder.js'

const P = config.display.prefix
export const IKON_KAT = { 'RPG Menu': '⚔️', Games: '🎮', 'Fun Menu': '🎉', Premium: '💎', 'User Menu': '👤', 'Group Menu': '👥', 'Owner Menu': '👑', Tools: '🧰', 'AI Menu': '🤖', 'Sticker Menu': '🎨', 'Info Menu': 'ℹ️', Downloader: '⬇️', 'Main Menu': '🏠', Internet: '🌐', Islami: '🕌' }

export function daftarMenuKustom () { return getSettings().menuKustom || {} }
export function nomorMenuBaru () { const n = Object.keys(daftarMenuKustom()).map(Number).filter(Boolean); return n.length ? Math.max(...n) + 1 : 4 }
/** data kategori untuk kartu (dipakai builder & menu final) */
export function dataKategori (m) {
  return [...categories().entries()].filter(([k, v]) => v.length >= 3 && (m.isOwner || !/owner/i.test(k))).sort((a, b) => b[1].length - a[1].length)
    .map(([k, v]) => ({ title: k, icon: IKON_KAT[k] || '📂', items: v.map(p => ({ icon: IKON_KAT[k] || '▸', title: p.command[0], desc: truncate(String(p.description || ''), 44), cmd: `${P}${p.command[0]}` })) }))
}

export const buatmenu = {
  command: ['buatmenu', 'menustudio', 'menubuilder', 'desainmenu', 'custommenu'],
  category: 'Owner Menu', owner: true, limit: 0,
  description: '🎨 Studio menu: pilih template (8), tema (10), sudut, latar animasi, font, teks → pratinjau langsung → Save & Terapkan → tersimpan sebagai menu4/5/6…',
  run: async m => {
    const u = m.userDB || {}
    const html = builderHtml({ brand: config.bot.name, nama: m.pushName || 'kakak', status: m.isOwner ? 'OWNER' : u.premium ? 'PREMIUM' : 'MEMBER', limit: m.isOwner || u.premium ? '∞' : (u.limit ?? 0), fitur: [...categories().values()].reduce((a, v) => a + v.length, 0), versi: config.bot.version, nomor: (m.sender || '').split('@')[0], kategori: dataKategori(m), nomorBaru: nomorMenuBaru(), prefix: P })
    try { await sendHtmlApp(m.sock, m.jid, { title: '🎨 MENU STUDIO', html }) } catch (e) { return m.reply('❌ Kartu studio gagal dikirim: ' + truncate(String(e.message || e), 100)) }
    return m.reply(`🎨 *MENU STUDIO* dibuka di kartu di atas.\n\n1. Pilih template, warna, sudut, latar, font, teks → pratinjau berubah langsung\n2. Ketuk *💾 Save & Terapkan* → kode tersalin\n3. Tempel & kirim kode itu ke sini → tersimpan sebagai *menu${nomorMenuBaru()}* & langsung dipakai\n\nTemplate: ${Object.values(TEMPLATE).map(t => t.nama).join(', ')}\nTema: ${Object.keys(TEMA).join(', ')}\n\nLainnya: \`${P}menusaya\` (daftar) · \`${P}setmenu4\` (pakai) · \`${P}hapusmenu 4\``)
  }
}

export const simpanmenu = {
  command: ['simpanmenu', 'savemenu', 'terapkanmenu'],
  category: 'Owner Menu', owner: true, limit: 0,
  description: '💾 Simpan konfigurasi dari Menu Studio sebagai menuN & langsung terapkan — `.simpanmenu T:ios|W:ungu|…` (atau `.simpanmenu 5 <kode>` untuk menimpa)',
  run: async (m, ctx) => {
    let q = String(m.q || '').trim()
    if (!q) return m.reply(`💾 Tempel kode dari kartu *${P}buatmenu*.\nContoh: \`${P}simpanmenu T:neon|W:cyan|B:kotak|L:grid|F:mono\``)
    let nomor = null; const mt = q.match(/^(\d{1,2})\s+(.+)$/s); if (mt) { nomor = +mt[1]; q = mt[2] }
    if (!/T:/.test(q)) return m.reply('❌ Kode tidak dikenali. Ketuk *Save & Terapkan* di kartu studio lalu tempel kodenya.')
    const cfg = kodeKeCfg(q); nomor = nomor && nomor >= 4 ? nomor : nomorMenuBaru()
    const semua = { ...daftarMenuKustom(), [nomor]: { cfg, dibuat: Date.now(), oleh: m.pushName || '' } }
    setSetting('menuKustom', semua); setSetting('menuMode', 'menu' + nomor)
    await m.reply(`✅ Tersimpan sebagai *MENU${nomor}* & langsung diterapkan.\n▸ Template: ${TEMPLATE[cfg.template].nama} · tema ${cfg.tema} · sudut ${cfg.bentuk} · latar ${cfg.latar} · font ${cfg.font}\n▸ Pakai lagi: \`${P}setmenu${nomor}\` · buat lagi: \`${P}buatmenu\` (jadi menu${nomor + 1})\n\nIni tampilannya:`)
    m.q = ''
    return (await import('./menu.js')).default.run(m, ctx)
  }
}

export const menusaya = {
  command: ['menusaya', 'daftarmenu', 'listmenukustom', 'menukustom'],
  category: 'Owner Menu', owner: true, limit: 0,
  description: '📋 Daftar menu kustom (menu4, menu5, …) + mode aktif',
  run: async m => {
    const L = Object.entries(daftarMenuKustom())
    const mode = getSettings().menuMode || 'auto'
    return m.reply(`📋 *MENU TERSIMPAN* (aktif: *${mode}*)\n\n• menu1 — klasik (list)\n• menu2 — iOS home (bawaan)\n• menu3 — kartu teks elegan (bawaan)\n${L.map(([n, v]) => `• menu${n} — ${TEMPLATE[v.cfg.template]?.nama || v.cfg.template} · ${v.cfg.tema} · ${v.cfg.latar}${mode === 'menu' + n ? ' ✅' : ''}`).join('\n') || '_(belum ada menu kustom — buat: ' + P + 'buatmenu)_'}\n\nPakai: \`${P}setmenu<N>\` · hapus: \`${P}hapusmenu <N>\``)
  }
}

export const hapusmenu = {
  command: ['hapusmenu', 'deletemenu', 'removemenu'],
  category: 'Owner Menu', owner: true, limit: 0,
  description: '🗑 Hapus menu kustom — `.hapusmenu 4`',
  run: async m => {
    const n = parseInt(m.args?.[0], 10); const semua = daftarMenuKustom()
    if (!n || !semua[n]) return m.reply(`🗑 \`${P}hapusmenu <nomor>\` — yang ada: ${Object.keys(semua).map(x => 'menu' + x).join(', ') || 'tidak ada'}`)
    delete semua[n]; setSetting('menuKustom', semua)
    if (getSettings().menuMode === 'menu' + n) setSetting('menuMode', 'html')
    return m.reply(`✅ menu${n} dihapus.${getSettings().menuMode === 'html' ? ' Mode kembali ke MENU2.' : ''}`)
  }
}

/** .setmenu4 … .setmenu20 */
export const setmenuN = {
  command: Array.from({ length: 17 }, (_, i) => 'setmenu' + (i + 4)),
  category: 'Owner Menu', owner: true, limit: 0,
  description: '🪄 Pakai menu kustom buatan .buatmenu — `.setmenu4`, `.setmenu5`, …',
  run: async (m, ctx) => {
    const n = parseInt(String(m.command).replace(/\D/g, ''), 10)
    if (!daftarMenuKustom()[n]) return m.reply(`❌ menu${n} belum ada. Buat dulu: \`${P}buatmenu\` · daftar: \`${P}menusaya\``)
    setSetting('menuMode', 'menu' + n)
    await m.reply(`✅ Mode menu → *MENU${n}*. Ini tampilannya:`); m.q = ''
    return (await import('./menu.js')).default.run(m, ctx)
  }
}
export default { buatmenu, simpanmenu, menusaya, hapusmenu, setmenuN }
