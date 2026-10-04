/**
 * 🧩 .addplugin — tambah plugin gaya BOT TELEGRAM tanpa restart (v7.7.1)
 * ------------------------------------------------------------------
 *  Owner menempelkan kode berbentuk `bot.command(...)` / gaya Telegraf,
 *  bot MENGONVERSI otomatis supaya cocok dengan handler bot ini:
 *
 *    • diekstrak `bot.command("nama", async (ctx) => { ... })`
 *    • dibungkus format plugin: `export default { command, category, run }`
 *    • `ctx` dari kode asli jadi adapter WhatsApp (lib/ctxtg.js):
 *      ctx.reply / replyWithPhoto / replyWithVideo / replyWithDocument /
 *      replyWithAudio / replyWithSticker / ctx.telegram.getFileLink
 *      (media WA diunduh → litter.catbox sementara → URL publik)
 *    • axios + config + P sudah disediakan
 *
 *  Lalu ditulis ke features/addplug-<nama>.js, dicek sintaksnya,
 *  dan HOT-RELOAD — perintah langsung bisa dipakai tanpa restart.
 *
 *  Cara pakai (.addplugin <nama> [--paksa]):
 *    1. `.addplugin jadihitam` lalu tempel/balas pesan berisi kodenya
 *    2. balas dokumen .js dengan caption `.addplugin jadihitam`
 *    3. inline: `.addplugin jadihitam bot.command("…", async (ctx) => { … })`
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { reloadPlugin } from '../lib/plugins.js'
import { truncate } from '../lib/functions.js'
import { konversiTelegraf } from '../lib/pluginconvert.js'
import { namaFileAman, cekSintaks, ambilKode } from './devmenu.js'

/* file ini sendiri ada di features/ → FEATURES_DIR = foldernya */
const FEATURES_DIR = path.dirname(fileURLToPath(import.meta.url))

const P = config.display.prefix
const MAKS_KODE = 200 * 1024

const judul = m => `🧩 *ADD PLUGIN — KONVERSI BOT TELEGRAM → ${config.bot.name}*\n\n`

export const addPluginCmd = {
  command: ['addplugin', 'tambahplugin', 'konvertiplugin', 'pasangplugin', 'pluginconvert', 'convertplugin'],
  category: 'Owner Menu',
  description: '🧩 Konversi kode Bot Telegram (`bot.command(...)`) jadi plugin bot ini — langsung bisa dipakai, tanpa restart',
  owner: true,
  limit: 0,
  run: async m => {
    const argumen = String(m.q || '').trim()
    const cocok = argumen.match(/^(\S+)([\s\S]*)$/)
    let namaMentah = cocok ? cocok[1] : ''
    let sisa = cocok ? cocok[2] || '' : ''
    const paksa = /^(--paksa|--force|-f)\b/i.test(sisa.trim())
    if (paksa) sisa = sisa.trim().replace(/^(--paksa|--force|-f)\s*/, '')

    if (!namaMentah) {
      return m.reply(
        judul(m) +
        `Tempelkan kode gaya *Bot Telegram/Telegraf* — bot otomatis mengonversinya\n` +
        `supaya cocok dengan handler WhatsApp bot ini.\n\n` +
        `Yang dikenali otomatis:\n` +
        `• \`bot.command("nama", async (ctx) => { … })\` (multi-command sekalian)\n` +
        `• \`ctx.reply\` · \`ctx.replyWithPhoto/Video/Document/Audio/Sticker\`\n` +
        `• \`ctx.telegram.getFileLink\` → media WA diunggah sementara ke litter.catbox\n` +
        `• \`ctx.message.photo\` / \`reply_to_message.photo\` (bentuk persis Telegraf)\n` +
        `• \`axios\`, \`config\`, \`P\` siap pakai\n\n` +
        `*Cara:*\n` +
        `1. balas pesan/dokumen berisi kode dengan \`${P}addplugin namaplugin\`\n` +
        `2. inline: \`${P}addplugin namaplugin bot.command("…", async (ctx) => { … })\`\n` +
        `3. nama file jadi \`addplug-namaplugin.js\` (perintah aktif: sesuai nama command)\n\n` +
        `Timpa versi konversi lama: \`${P}addplugin namaplugin --paksa\`\n` +
        `Cek plugin: \`${P}cekplugin addplug-namaplugin\` · hapus: \`${P}hapusplugindev addplug-namaplugin\``
      )
    }

    const namaDasar = namaFileAman(namaMentah)
    if (!namaDasar) return m.reply('❌ Nama plugin tidak valid (huruf/angka/-_, maks 40 karakter).')
    const namaFile = 'addplug-' + namaDasar.replace(/\.js$/, '') + '.js'
    const target = path.join(FEATURES_DIR, namaFile)
    if (!target.startsWith(FEATURES_DIR)) return m.reply('⚠️ Nama file tidak diizinkan.')

    const sudahAda = fs.existsSync(target)
    if (sudahAda && !paksa) {
      return m.reply(
        `⚠️ \`features/${namaFile}\` sudah ada.\n` +
        `Lihat: \`${P}getcode ${namaFile.replace(/\.js$/, '')}\`\n` +
        `Timpa: \`${P}addplugin ${namaMentah} --paksa\``
      )
    }

    const { kode, sumber, galat } = await ambilKode(m, sisa)
    if (galat) return m.reply(`❌ ${galat}`)
    if (!kode || !kode.trim()) {
      return m.reply(
        '❌ Kodenya belum ada.\n\n' +
        `Kirim lewat salah satu cara:\n` +
        `• balas *pesan teks* berisi kode → \`${P}addplugin ${namaMentah}\`\n` +
        `• balas *dokumen .js* → \`${P}addplugin ${namaMentah}\`\n` +
        `• tulis kodenya sekaligus: \`${P}addplugin ${namaMentah} bot.command(…)\``
      )
    }
    if (Buffer.byteLength(kode) > MAKS_KODE) return m.reply('❌ Kode terlalu besar (maks 200 KB).')

    /* --- KONVERSI --- */
    const hasil = konversiTelegraf(kode, { namaFile: namaFile.replace(/^addplug-/, '').replace(/\.js$/, '') })
    if (!hasil.ok) {
      return m.reply(`❌ *KONVERSI GAGAL*\n${hasil.alasan}\n\nKalau kodenya sudah format plugin bot ini (export default { command, run }), pakai \`${P}>_\` saja.`)
    }

    /* --- tulis + cek sintaks + hot reload --- */
    const lama = sudahAda ? fs.readFileSync(target, 'utf8') : null
    try { fs.writeFileSync(target, hasil.kodeHasil) } catch (e) { return m.reply('❌ Gagal menulis file: ' + (e?.message || e)) }
    const cek = cekSintaks(target)
    if (!cek.ok) {
      if (lama !== null) fs.writeFileSync(target, lama)
      else fs.unlinkSync(target)
      return m.reply(`❌ *SINTAKS HASIL KONVERSI SALAH* — file dibatalkan.\n\n\`\`\`\n${truncate(cek.pesan, 700)}\n\`\`\`\n\nKonversi gagal menangkap bentuk fungsi — perbaiki kode sumbernya lalu coba lagi.`)
    }

    let perintahAktif = []
    try {
      perintahAktif = await reloadPlugin(namaFile)
    } catch (e) {
      if (lama !== null) fs.writeFileSync(target, lama)
      else try { fs.unlinkSync(target) } catch {}
      try { await reloadPlugin(namaFile) } catch {}
      return m.reply(`❌ Plugin ditolak loader: ${truncate(String(e?.message || e), 200)}\n\nFile dikembalikan seperti semula.`)
    }

    /* lacak di DB devplugin supaya .plugindev/.getcode kenal */
    try {
      const { loadDB, saveNow } = await import('../lib/database.js')
      const d = loadDB('devplugin', { file: {} })
      d.file[namaFile] = { oleh: m.senderKey || m.sender, waktu: Date.now(), sumber, jumlahPerintah: perintahAktif.length, konversi: 'telegram' }
      saveNow('devplugin')
    } catch {}

    return m.sendButtons({
      title: '🧩 Plugin Ditambahkan',
      text:
        `✅ *PLUGIN \`${namaFile}\` SUDAH AKTIF TANPA RESTART*\n\n` +
        `▸ Sumber kode: ${sumber || 'inline/balasan'}\n` +
        `▸ ${hasil.ringkasan.join('\n▸ ')}\n` +
        `▸ Perintah aktif: ${(perintahAktif.length ? perintahAktif : hasil.perintah).map(x => '\`.' + x + '\`').join(', ')}\n` +
        `▸ Adapter: \`ctx.reply\` → m.reply · \`getFileLink\` → unduh media → litter.catbox\n\n` +
        `📌 Coba sekarang: kirim foto lalu balas perintahnya.\n` +
        `Edit kode: \`${P}getcode ${namaFile.replace(/\.js$/, '')}\` · \`${P}>_ ${namaFile.replace(/\.js$/, '')} --paksa\``,
      footer: config.bot.footer,
      buttons: [
        { text: '▶️ Coba Perintah', id: `${P}${(perintahAktif[0] || hasil.perintah[0])}` },
        { text: '📜 Lihat Kode', id: `${P}getcode ${namaFile.replace(/\.js$/, '')}` },
        { text: '🗑 Hapus Plugin', id: `${P}hapusplugindev ${namaFile.replace(/\.js$/, '')}` }
      ]
    }).catch(() => m.reply(`✅ Plugin ${namaFile} aktif: ${perintahAktif.length ? perintahAktif.join(', ') : hasil.perintah.join(', ')}`))
  }
}

export default { addPluginCmd }
