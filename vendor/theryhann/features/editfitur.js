/**
 * 🛠️ .editfitur — STUDIO RAPIKAN TEKS FITUR + TEMPLATE BUTTON/LIST (v7.37.0)
 * ------------------------------------------------------------------
 *  Fitur yang dipasang lewat `.>_` biasanya balasan teksnya masih "mentah"
 *  (satu baris panjang, tanpa markdown). Perintah ini membaca plugin yang
 *  sudah terpasang, lalu membuatkan:
 *
 *   • TEMPLATE TEKS    balasan rapi (markdown WhatsApp: tebal/miring/mono)
 *   • TEMPLATE TOMBOL  m.sendButtons({title,text,footer,buttons})
 *   • TEMPLATE LIST    m.sendList({sections:[{rows:[…]}]})
 *   • KODE UTUH        blok plugin siap tempel ke features/<file>.js
 *   • PANDUAN          langkah pasang + contekan markdown
 *
 *  Semuanya tampil di KARTU HTML gaya studio (seperti .buatmenu): tab,
 *  pratinjau gelembung WhatsApp yang ikut berubah, tombol salin + toast.
 *  Karena webview tidak bisa mengirim pesan, hasilnya disalin ke papan
 *  klip — tempel lewat .getcode/.>_ atau editor di Termux.
 *
 *  Contoh: .editfitur toanime
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { findPlugin } from '../lib/plugins.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { loadDB } from '../lib/database.js'
import { truncate } from '../lib/functions.js'

const P = config.display.prefix
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** kategori → perintah submenu yang cocok untuk tombol "menu" */
export const MENU_KATEGORI = {
  'Sticker Menu': 'menusticker',
  'Group Menu': 'menugrup',
  'Games': 'menugame',
  'Fun Menu': 'menufun',
  Fun: 'menufun',
  'Owner Menu': 'menuowner',
  Islami: 'menuislami',
  Downloader: 'panduangdownload',
  Tools: 'menu',
  Premium: 'menu'
}

const IKON_KATEGORI = {
  'Sticker Menu': '🎨', 'Group Menu': '👥', Games: '🎮', 'Fun Menu': '🎉', Fun: '🎉',
  'Owner Menu': '👑', Islami: '🕌', Downloader: '⬇️', Tools: '🧰', AI: '🤖',
  'AI Menu': '🤖', 'RPG Menu': '⚔️', 'User Menu': '👤', 'Info Menu': 'ℹ️', Internet: '🌐'
}

const q = s => `'${String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** daftar plugin buatan .>_ (dipakai saat .editfitur dipanggil tanpa argumen) */
export function daftarPluginDev () {
  try {
    const d = loadDB('devplugin', { file: {}, meta: { total: 0 } })
    return Object.entries(d?.file || {}).map(([nama, rec]) => ({ nama, ...rec }))
  } catch { return [] }
}

/**
 * Potong satu blok `export const X = …` dari sumber (untuk dianalisis).
 * Mendukung dua bentuk: object literal `{ … }` dan factory `buatAI(…)`.
 */
export function potongBlok (sumber, nama) {
  const s = String(sumber || '')
  const re = new RegExp('export\\s+const\\s+' + String(nama).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=')
  const m = re.exec(s)
  if (!m) return ''
  const awal = m.index
  /* object literal: hitung kurung kurawal sampai seimbang */
  const buka = s.indexOf('{', m.index + m[0].length - 1)
  const akhirBaris = s.indexOf('\n', m.index + m[0].length)
  if (buka >= 0 && (akhirBaris < 0 || buka < akhirBaris)) {
    let dalam = 0
    for (let i = buka; i < s.length; i++) {
      if (s[i] === '{') dalam++
      else if (s[i] === '}') { dalam--; if (dalam === 0) return s.slice(awal, i + 1) }
    }
  }
  /* factory / bentuk lain: ambil sampai export berikutnya */
  const berikutnya = s.indexOf('\nexport ', m.index + m[0].length)
  return s.slice(awal, berikutnya > 0 ? berikutnya : Math.min(s.length, awal + 2000)).trim()
}

/** deteksi kebiasaan plugin dari sumbernya */
export function deteksiKebiasaan (sumber, nama) {
  const blok = potongBlok(sumber, nama) || sumber
  return {
    butuhMedia: /m\.(quoted|isMedia|download|mimetype)/.test(blok),
    butuhArgumen: /m\.(q|args)\b/.test(blok),
    sudahTombol: /sendButtons|sendList|sendInteractive/.test(blok),
    sudahKartu: /sendHtmlApp/.test(blok),
    pakaiGrup: /m\.isGroup|m\.group\b/.test(blok),
    baris: String(blok).split('\n').length
  }
}

/**
 * Bangun semua template untuk satu plugin.
 * @returns {{teks:string, tombol:string, list:string, kode:string, panduan:string,
 *            pratinjauTeks:string, pratinjauTombol:string, ringkas:object}}
 */
export function buatTemplate (info) {
  const { utama, alias, kategori, deskripsi, limit, cooldown, contoh, fileName, buatanDev, kebiasaan } = info
  const ikon = IKON_KATEGORI[kategori] || '🧩'
  const cmd = P + utama
  const menuKat = MENU_KATEGORI[kategori] || 'menu'
  const judulBesar = utama.toUpperCase()
  const contohArg = contoh ? ' ' + contoh : (kebiasaan?.butuhArgumen ? ' <isi>' : '')
  const barisMedia = kebiasaan?.butuhMedia
    ? "    if (!m.quoted && !m.isMedia) return m.reply('❌ Kirim / balas *gambar* lalu ketik `" + cmd + "`')\n"
    : ''
  const barisArg = kebiasaan?.butuhArgumen
    ? "    const q = String(m.q || '').trim()\n    if (!q) return m.reply('ℹ️ Cara pakai: `" + cmd + contohArg + "`')\n"
    : ''

  /* ---------- 1. TEKS ---------- */
  const teks =
`    /* ── TAMPILAN TEKS ───────────────────────────────────────────
     * Markdown WhatsApp:  *tebal*   _miring_   ~coret~   \`mono\`
     * \\n = baris baru.  Pakai + antar baris biar gampang diedit.
     * ─────────────────────────────────────────────────────────── */
    const teks =
      ${q(ikon + ' *' + judulBesar + '*')} + '\\n' +
      '\\n' +
      ${q('📌 *Perintah:* `' + cmd + contohArg + '`')} + '\\n' +
      ${q('📁 *Kategori:* ' + kategori)} + '\\n' +
      ${q('⚡ *Limit:* ' + limit + ' · *Cooldown:* ' + cooldown + ' detik')} + '\\n' +
      '\\n' +
      '_Sedang diproses, tunggu sebentar ya…_'`

  /* ---------- 2. TOMBOL ---------- */
  const tombol =
`    /* ── TEMPLATE BUTTON LIST ────────────────────────────────────
     * m.sendButtons = teks + tombol dalam satu pesan.
     * .catch(() => m.reply(teks)) = cadangan untuk client lama.
     * ─────────────────────────────────────────────────────────── */
    return m.sendButtons({
      title: ${q(ikon + ' ' + judulBesar)},
      text: teks,
      footer: config.bot.footer,
      buttons: [
        { text: '🔁 Ulangi', id: ${q(cmd)} },
        { text: ${q(ikon + ' Menu kategori')}, id: ${q(P + menuKat)} },
        { text: '📋 Menu utama', id: ${q(P + 'menu')} }
      ]
    }).catch(() => m.reply(teks))`

  /* ---------- 3. LIST ---------- */
  const list =
`    /* ── TEMPLATE LIST (single_select) ───────────────────────────
     * Cocok kalau opsinya banyak / bertingkat (lebih dari 3 pilihan).
     * id = perintah yang dikirim saat baris dipilih.
     * ─────────────────────────────────────────────────────────── */
    return m.sendList({
      text: teks,
      title: ${q(ikon + ' ' + judulBesar)},
      buttonText: 'Pilih opsi',
      footer: config.bot.footer,
      sections: [
        {
          title: ${q('Opsi ' + utama)},
          rows: [
            { header: 'Dasar', title: ${q('Jalankan ' + utama)}, description: ${q(truncate(deskripsi || '-', 60))}, id: ${q(cmd)} },
            { header: 'Varian', title: 'Contoh varian 1', description: 'ganti sesuai fiturmu', id: ${q(cmd + ' varian1')} },
            { header: 'Varian', title: 'Contoh varian 2', description: 'ganti sesuai fiturmu', id: ${q(cmd + ' varian2')} }
          ]
        }
      ]
    }).catch(() => m.reply(teks))`

  /* ---------- 4. KODE UTUH ---------- */
  const kode =
`/* ── ${fileName} — tempel blok ini, simpan, lalu ${P}reloadfitur ──────
 * Pasang cepat: kirim file ini ke chat bot lalu balas
 *   ${P}>_ ${String(fileName).replace(/\.js$/, '')} --paksa
 * ──────────────────────────────────────────────────────────────── */
import { config } from '../config.js'

export const ${utama} = {
  command: [${alias.map(a => q(a)).join(', ')}],
  category: ${q(kategori)},
  description: ${q(deskripsi || '')},
  limit: ${limit},
  cooldown: ${cooldown},
  contoh: ${q(contoh || '')},
  run: async m => {
${barisMedia}${barisArg}
    /* 1) kerjakan inti fiturnya di sini */
    await m.react?.('⏳').catch(() => {})

    /* 2) teks balasan yang rapi */
${teks}

    /* 3) kirim + tombol */
${tombol}
  }
}

export default { ${utama} }`

  /* ---------- 5. PANDUAN ---------- */
  const panduan =
`CARA MERAPIKAN TEKS FITUR "${utama}"
${'='.repeat(46)}
1. Ambil kode sekarang
   ${P}getcode ${utama}      (kirim kode sumber ke chat)
   ${P}cekplugin ${String(fileName).replace(/\.js$/, '')}   (periksa sintaks)

2. Salin template di kartu ini (tab TEKS / TOMBOL / LIST),
   tempel ke dalam  run: async m => { … }  menggantikan m.reply(…) lama.

3. Pasang ulang file-nya:
   ${buatanDev
    ? `• lewat chat: kirim file lalu balas ${P}>_ ${String(fileName).replace(/\.js$/, '')} --paksa`
    : `• file ini BAWAAN bot, jadi perlu --paksa: ${P}>_ ${String(fileName).replace(/\.js$/, '')} --paksa`}
   • atau edit langsung di Termux:  nano ~/theryhann-bot/features/${fileName}

4. Muat ulang tanpa restart:  ${P}reloadfitur
   Cek hasil:  ${P}${utama}${contohArg}

CONTEKAN MARKDOWN WHATSAPP
${'='.repeat(46)}
  *teks*      → tebal
  _teks_      → miring
  ~teks~      → coret
  \`\`\`teks\`\`\`  → blok mono (kode)
  \\n          → baris baru
  @628xxx     → tag (pakai m.mentioned / contextInfo)

CATATAN
${'='.repeat(46)}
• Tombol & list butuh WhatsApp Android/iOS terbaru; selalu siapkan
  .catch(() => m.reply(teks)) supaya client lama tetap dapat teksnya.
• id tombol = perintah nyata (bukan teks bebas) supaya bisa diklik ulang.
• Maks 10 tombol per pesan; sisanya pakai m.sendList.
• Status plugin ini: ${buatanDev ? 'buatan .>_' : 'bawaan bot'} · ${kebiasaan?.baris || '?'} baris` +
    `\n• Sudah pakai tombol/list? ${kebiasaan?.sudahTombol ? 'YA' : 'belum'}` +
    ` · kartu HTML? ${kebiasaan?.sudahKartu ? 'YA' : 'belum'}`

  /* ---------- pratinjau (teks polos, dirender markdown di kartu) ---------- */
  const pratinjauTeks =
`${ikon} *${judulBesar}*\n\n` +
`📌 *Perintah:* \`${cmd}${contohArg}\`\n` +
`📁 *Kategori:* ${kategori}\n` +
`⚡ *Limit:* ${limit} · *Cooldown:* ${cooldown} detik\n\n` +
`_Sedang diproses, tunggu sebentar ya…_`

  const pratinjauTombol = pratinjauTeks +
    `\n\n┌──────────────────────┐\n` +
    `   🔁 Ulangi   ·   ${ikon} Menu kategori   ·   📋 Menu utama\n` +
    `└──────────────────────┘`

  return {
    teks, tombol, list, kode, panduan, pratinjauTeks, pratinjauTombol,
    ringkas: { utama, alias, kategori, fileName, buatanDev: !!buatanDev, limit, cooldown, ...kebiasaan }
  }
}

/* ================================================================== */
/*  KARTU HTML — STUDIO EDIT FITUR (gaya .buatmenu)                    */
/* ================================================================== */
const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
.ef{position:relative;max-width:500px;margin:0 auto;padding:8px;color:#fff;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#000}
.std{border-radius:26px;background:#0f0f14;border:1px solid rgba(255,255,255,.12);padding:14px;overflow:hidden}
.hd{display:flex;align-items:center;gap:10px}
.hd .ic{flex:none;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#f472b6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:20px}
.hd h1{font-size:16px;font-weight:800;letter-spacing:.3px}
.hd p{font-size:11px;color:rgba(255,255,255,.55);margin-top:2px;word-break:break-all}
.meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.meta span{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:999px;padding:5px 10px;font-size:10.5px;color:rgba(255,255,255,.85)}
.meta span.on{background:#8b5cf6;color:#fff;border-color:#8b5cf6;font-weight:700}
.lb{font-size:9.5px;letter-spacing:2px;color:rgba(255,255,255,.5);font-weight:800;margin:14px 0 6px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.tabs span{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 12px;font-size:11.5px;cursor:pointer;transition:all .2s}
.tabs span.on{background:linear-gradient(135deg,#34d399,#0ea5e9);color:#04140f;border-color:transparent;font-weight:800;transform:scale(1.04)}
.bub{background:#1d2b23;border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:11px 12px;font-size:13px;line-height:1.6;color:#e9f2ec;white-space:pre-wrap;word-break:break-word;animation:pop .35s cubic-bezier(.2,1.5,.4,1)}
.bub.hid{display:none}
.bub b{color:#fff}.bub i{color:#cfe6d8}.bub s{opacity:.65}.bub code{background:rgba(0,0,0,.4);border-radius:5px;padding:1px 5px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
@keyframes pop{0%{opacity:0;transform:scale(.97)}100%{opacity:1;transform:none}}
.cd{background:#08080b;border:1px dashed rgba(255,255,255,.24);border-radius:12px;padding:11px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;line-height:1.62;color:#d7e2ff;white-space:pre-wrap;word-break:break-word;max-height:300px;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.cd.besar{font-size:13px;line-height:1.7}
.row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.btn{flex:1 1 44%;background:linear-gradient(135deg,#34d399,#0ea5e9);color:#04140f;font-weight:900;text-align:center;padding:12px;border-radius:14px;font-size:13px;cursor:pointer;transition:transform .18s}
.btn:active{transform:scale(.97)}
.btn.gh{background:rgba(255,255,255,.09);color:#fff;border:1px solid rgba(255,255,255,.16);font-weight:700}
.tip{font-size:11px;color:rgba(255,255,255,.55);margin-top:11px;line-height:1.6}
.tip b{color:#34d399}
.toast{position:absolute;left:50%;top:16px;transform:translate(-50%,-24px);background:#1c1c1e;border:1px solid rgba(255,255,255,.14);color:#fff;font-size:12.5px;padding:10px 15px;border-radius:18px;opacity:0;transition:all .38s cubic-bezier(.2,1.4,.4,1);max-width:88%;text-align:center;pointer-events:none;z-index:9}
.toast.on{opacity:1;transform:translate(-50%,0)}
`

const JS = String.raw`
(function(){
  var D = __EF;
  var I = function (i) { return document.getElementById(i) };
  var tst = I('toast'), tm;
  function toast (t) { tst.textContent = t; tst.className = 'toast on'; clearTimeout(tm); tm = setTimeout(function () { tst.className = 'toast' }, 2400) }
  function esc (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }
  /* markdown WhatsApp -> HTML (untuk pratinjau).
     Backtick tidak boleh ditulis langsung di payload, jadi pakai fromCharCode(96). */
  var BT = String.fromCharCode(96)
  var RE_BLOK = new RegExp(BT + BT + BT + '([\\s\\S]*?)' + BT + BT + BT, 'g')
  var RE_MONO = new RegExp(BT + '([^' + BT + '\\n]+)' + BT, 'g')
  function wa (t) {
    var h = esc(t)
    h = h.replace(RE_BLOK, function (a, b) { return '<code>' + b + '</code>' })
    h = h.replace(/(^|\s)\*([^*\n]+)\*/g, '$1<b>$2</b>')
    h = h.replace(/(^|\s)_([^_\n]+)_/g, '$1<i>$2</i>')
    h = h.replace(/(^|\s)~([^~\n]+)~/g, '$1<s>$2</s>')
    h = h.replace(RE_MONO, '<code>$1</code>')
    return h
  }
  function salin (t) {
    try {
      var ta = document.createElement('textarea')
      ta.value = t; ta.style.position = 'absolute'; ta.style.left = '-9999px'
      document.body.appendChild(ta); ta.select()
      var ok = document.execCommand && document.execCommand('copy')
      document.body.removeChild(ta); return !!ok
    } catch (e) { return false }
  }
  var tabAktif = D.urut[0]
  function gambar (k) {
    tabAktif = k
    var t = D.tab[k]
    I('cd').textContent = t.kode
    var b = I('bub')
    if (t.pratinjau) { b.innerHTML = wa(t.pratinjau); b.className = 'bub'; I('lbp').style.display = '' } else { b.className = 'bub hid'; I('lbp').style.display = 'none' }
    Array.prototype.forEach.call(I('tabs').querySelectorAll('span'), function (s) { s.className = s.getAttribute('data-t') === k ? 'on' : '' })
    var c = I('cd'); c.className = 'cd'; void c.offsetWidth; c.className = 'cd' + (c._besar ? ' besar' : '')
  }
  Array.prototype.forEach.call(I('tabs').querySelectorAll('span'), function (s) {
    s.addEventListener('click', function () { gambar(s.getAttribute('data-t')) })
  })
  I('cp').addEventListener('click', function () {
    var t = D.tab[tabAktif].kode
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { toast('📋 Template ' + tabAktif.toUpperCase() + ' tersalin') }, function () { toast(salin(t) ? '📋 Tersalin' : 'Salin manual dari kotak kode') })
    } else toast(salin(t) ? '📋 Tersalin' : 'Salin manual dari kotak kode')
  })
  I('fs').addEventListener('click', function () {
    var c = I('cd'); c._besar = !c._besar; c.className = 'cd' + (c._besar ? ' besar' : '')
    toast(c._besar ? '🔠 Huruf diperbesar' : '🔠 Huruf normal')
  })
  I('pn').addEventListener('click', function () {
    var b = I('bub'); var tampil = b.className.indexOf('hid') < 0
    b.className = tampil ? 'bub hid' : 'bub'; I('lbp').style.display = tampil ? 'none' : ''
    toast(tampil ? '👁️ Pratinjau disembunyikan' : '👁️ Pratinjau ditampilkan')
  })
  gambar(tabAktif)
})();
`

/**
 * @param {string} brand nama bot
 * @param {object} d hasil buatTemplate() + info plugin
 */
export function editFiturHtml (brand, d = {}) {
  const tab = {
    teks: { label: '📝 TEKS', kode: String(d.teks || ''), pratinjau: String(d.pratinjauTeks || '') },
    tombol: { label: '🔘 TOMBOL', kode: String(d.tombol || ''), pratinjau: String(d.pratinjauTombol || '') },
    list: { label: '📃 LIST', kode: String(d.list || ''), pratinjau: '' },
    kode: { label: '📦 KODE UTUH', kode: String(d.kode || ''), pratinjau: '' },
    panduan: { label: '📖 PANDUAN', kode: String(d.panduan || ''), pratinjau: '' }
  }
  const data = { tab, urut: Object.keys(tab) }
  const r = d.ringkas || {}
  const chip = [
    `<span class="on">${esc(r.kategori || '-')}</span>`,
    `<span>${(r.alias || []).length} alias</span>`,
    `<span>limit ${esc(String(d.ringkas?.limit ?? '-'))}</span>`,
    `<span>${r.buatanDev ? 'buatan .>_' : 'bawaan bot'}</span>`,
    r.sudahTombol ? '<span>sudah ada tombol</span>' : '<span>belum pakai tombol</span>'
  ].join('')
  const tabs = data.urut.map((k, i) => `<span data-t="${k}"${i === 0 ? ' class="on"' : ''}>${tab[k].label}</span>`).join('')

  return '<style>' + CSS + '</style>' +
    `<div class="ef"><div class="std">` +
      `<div class="hd"><div class="ic">🛠️</div><div><h1>EDIT FITUR — ${esc(String(r.utama || '').toUpperCase())}</h1><p>${esc(r.fileName || '')} · ${esc(brand)}</p></div></div>` +
      `<div class="meta">${chip}</div>` +
      `<div class="tabs" id="tabs">${tabs}</div>` +
      `<div class="lb" id="lbp">PRATINJAU DI WHATSAPP</div>` +
      `<div class="bub" id="bub"></div>` +
      `<div class="lb">KODE — SIAP TEMPEL</div>` +
      `<pre class="cd" id="cd"></pre>` +
      `<div class="row"><div class="btn" id="cp">📋 SALIN</div><div class="btn gh" id="fs">🔠 HURUF</div><div class="btn gh" id="pn">👁️ PRATINJAU</div></div>` +
      `<div class="tip">Webview tidak bisa mengirim pesan ke bot, jadi hasilnya <b>disalin</b> — tempel ke file lewat <b>${esc(P)}&gt;_</b> atau editor di Termux, lalu <b>${esc(P)}reloadfitur</b>. Ganti fitur lain: <b>${esc(P)}editfitur &lt;nama&gt;</b>.</div>` +
    `</div><div class="toast" id="toast"></div></div>` +
    '<script>var __EF=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

/* ================================================================== */
/*  PERINTAH                                                           */
/* ================================================================== */
export const editFitur = {
  command: ['editfitur', 'rapikanfitur', 'templatefitur', 'editplugin', 'templatebutton', 'templateplugin'],
  category: 'Owner Menu',
  description: '🛠️ Studio rapikan teks fitur + template button/list (kartu HTML) — `.editfitur toanime`',
  owner: true,
  limit: 0,
  cooldown: 3,
  contoh: 'toanime',
  run: async m => {
    const q = String(m.q || (m.args || [])[0] || '').trim().replace(/^\.+/, '')
    if (!q) {
      const dev = daftarPluginDev()
      const contohBeberapa = ['toanime', 'tiktok', 'play', 'menu']
      return m.sendButtons({
        title: '🛠️ EDIT FITUR',
        text:
          `🛠️ *EDIT FITUR — STUDIO TEKS & TOMBOL*\n\n` +
          `Membaca plugin yang sudah terpasang lalu membuatkan:\n` +
          `• template *teks* balasan yang rapi (markdown WA)\n` +
          `• template *button list* (\`m.sendButtons\`)\n` +
          `• template *list* (\`m.sendList\`)\n` +
          `• *kode utuh* siap tempel + panduan\n\n` +
          `Cara: \`${P}editfitur <nama fitur>\`\n` +
          `Contoh: \`${P}editfitur ${contohBeberapa[0]}\` · \`${P}editfitur tiktok\`\n\n` +
          (dev.length
            ? `*Plugin buatan ${P}>_* (${dev.length}):\n${dev.slice(0, 12).map(x => `• ${x.nama}`).join('\n')}${dev.length > 12 ? '\n…' : ''}`
            : `Belum ada plugin buatan \`${P}>_\` — fitur bawaan juga bisa diedit.`),
        footer: config.bot.footer,
        buttons: [
          { text: '🎨 Contoh: toanime', id: `${P}editfitur toanime` },
          { text: '⬇️ Contoh: tiktok', id: `${P}editfitur tiktok` },
          { text: '📂 Daftar plugin dev', id: `${P}plugindev` }
        ]
      }).catch(() => m.reply(`🛠️ Cara: \`${P}editfitur <nama fitur>\`\nContoh: \`${P}editfitur toanime\``))
    }

    const plug = findPlugin(q)
    if (!plug?.plugin) {
      const file = path.join(path.dirname(fileURLToPath(import.meta.url)), q.replace(/\.js$/, '') + '.js')
      if (!fs.existsSync(file)) return m.reply(`❌ Fitur *${q}* tidak ditemukan.\nCek nama: \`${P}carifitur ${q}\` atau \`${P}pluginberkas\``)
    }
    const pl = plug.plugin
    const fileName = pl.fileName || path.basename(pl.file || (q + '.js'))
    let sumber = ''
    try { sumber = pl.file && fs.existsSync(pl.file) ? fs.readFileSync(pl.file, 'utf8') : '' } catch {}

    const dev = daftarPluginDev()
    const buatanDev = dev.some(x => x.nama === fileName)
    const kebiasaan = deteksiKebiasaan(sumber, pl.name)
    const T = buatTemplate({
      utama: pl.name,
      alias: pl.command || [pl.name],
      kategori: pl.category || 'Lainnya',
      deskripsi: pl.description || '',
      limit: pl.limit ?? 1,
      cooldown: pl.cooldown ?? 5,
      contoh: pl.contoh || '',
      fileName,
      buatanDev,
      kebiasaan
    })

    await m.react?.('🛠️').catch(() => {})
    let viaHtml = false
    try {
      await sendHtmlApp(m.sock, m.jid, {
        title: `🛠️ Edit fitur: ${pl.name}`,
        html: editFiturHtml(config.bot.name, T),
        trustedSources: ['hirara.dev']
      })
      viaHtml = true
    } catch (e) { console.error('[editfitur] html:', e.message) }

    const teks =
      `🛠️ *EDIT FITUR — ${pl.name.toUpperCase()}*\n` +
      `📁 \`features/${fileName}\` · ${pl.category || '-'}${buatanDev ? ` · buatan ${P}>_` : ' · bawaan bot'}\n` +
      `🔗 Alias: ${(pl.command || []).map(c => `\`${P}${c}\``).join(' ')}\n` +
      `⚡ limit ${pl.limit ?? 1} · cooldown ${pl.cooldown ?? 5} dtk · ${kebiasaan.baris} baris\n\n` +
      (viaHtml
        ? '☝️ Studio ada di atas: pilih tab *TEKS / TOMBOL / LIST / KODE / PANDUAN*, lihat pratinjau WhatsApp-nya, lalu *📋 SALIN*.\n\n'
        : '⚠️ Kartu HTML tidak terkirim (client lama) — template dikirim sebagai teks di bawah.\n\n') +
      `*TEMPLATE TEKS*\n\`\`\`${truncate(T.teks, 900)}\`\`\`\n\n` +
      `*TEMPLATE TOMBOL*\n\`\`\`${truncate(T.tombol, 900)}\`\`\``

    await m.sendButtons({
      title: `🛠️ ${pl.name}`,
      text: teks,
      footer: config.bot.footer,
      buttons: [
        { text: '📦 Kode utuh', id: `${P}getcode ${pl.name}` },
        { text: '🔍 Cek sintaks', id: `${P}cekplugin ${fileName.replace(/\.js$/, '')}` },
        { text: '♻️ Muat ulang', id: `${P}reloadfitur` },
        { text: '🔘 Jadikan button', id: `${P}tobutton ${pl.name}` },
        { text: '👑 Kunci premium', id: `${P}topremium ${pl.name}` },
        { text: '🛠️ Fitur lain', id: `${P}editfitur` }
      ]
    }).catch(() => m.reply(teks))

    /* ---------- PRATINJAU SUNGGUHAN DI BAWAH KARTU ----------
     * Gelembung WhatsApp asli (bukan gambar) supaya owner langsung
     * melihat bentuk balasan fiturnya: teks polos, lalu versi tombol,
     * lalu versi list. Kalau client tidak mendukung tombol, dilewati. */
    /* PRATINJAU SUNGGUHAN — harus selalu ada isinya. Kalau template kosong
       (mis. plugin aneh), dipakai teks cadangan supaya tidak pernah hampa. */
    const isiPratinjau = String(T.pratinjauTeks || '').trim() ||
      `${IKON_KATEGORI[pl.category] || '🧩'} *${pl.name.toUpperCase()}*\n\n` +
      `📌 *Perintah:* \`${P}${pl.name}${pl.contoh ? ' ' + pl.contoh : ''}\`\n` +
      `📁 *Kategori:* ${pl.category || 'Lainnya'}\n\n` +
      `${truncate(pl.description || 'Tidak ada deskripsi.', 200)}`
    const pratinjau =
      `👁️ *PRATINJAU — ${pl.name.toUpperCase()}*\n` +
      `_Begini bentuk balasan fiturnya di WhatsApp._\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${isiPratinjau}\n` +
      `━━━━━━━━━━━━━━━\n\n` +
      `🔘 Versi tombol menyusul di bawah 👇`
    await m.reply(pratinjau).catch(() => {})

    await m.sendButtons({
      title: `👁️ Pratinjau tombol — ${pl.name}`,
      text: `${T.pratinjauTombol}\n\n_Tombol di bawah adalah contoh yang dikirim \`${P}tobutton\`._`,
      footer: config.bot.footer,
      buttons: [
        { text: '🔁 Ulangi', id: `${P}${pl.name}` },
        { text: '🔘 Pasang tombol ini', id: `${P}tobutton ${pl.name}` },
        { text: '👑 Jadikan premium', id: `${P}topremium ${pl.name}` }
      ]
    }).catch(() => {})

    await m.sendList({
      title: `👁️ Pratinjau list — ${pl.name}`,
      text: `📃 *BENTUK LIST* — \`${P}${pl.name}\`\n\nKalau opsinya banyak, pakai \`m.sendList\` (tab *LIST* di studio).`,
      buttonText: 'Pilih opsi',
      footer: config.bot.footer,
      sections: [{
        title: `Opsi ${pl.name}`,
        rows: [
          { header: 'Dasar', title: `Jalankan ${pl.name}`, description: truncate(pl.description || '-', 60), id: `${P}${pl.name}` },
          { header: 'Studio', title: 'Buka studio edit', description: 'rapikan teks & tombol', id: `${P}editfitur ${pl.name}` },
          { header: 'Atur', title: 'Jadikan button list', description: 'pasang tombol balasan', id: `${P}tobutton ${pl.name}` }
        ]
      }]
    }).catch(() => {})
  }
}

export default { editFitur }
