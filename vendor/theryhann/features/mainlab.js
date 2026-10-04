/**
 * 🏠 MAINLAB — 50 fitur menu utama / navigasi & bantuan (kategori Main Menu, v6)
 * ----------------------------------------------------------------------------
 *  Menu per kategori (tools, games, ai, stiker, grup, owner, rpg, info,
 *  internet, fun, downloader, admin), menu dalam berbagai tampilan
 *  (tombol, list, teks, karusel, AI Rich, aplikasi HTML), panduan pemula,
 *  FAQ, kamus istilah, info bot (versi, changelog, kredit, instalasi Termux),
 *  serta perintah sapaan & bantuan cepat.
 */
import { config } from '../config.js'
import { truncate, formatDuration, formatSize } from '../lib/functions.js'
import { listPlugins, categories, plugins as pluginMap } from '../lib/plugins.js'
import { sendCarousel, sendAIRich } from '../lib/interactive.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { allUsers, allGroups, getSettings, getStats } from '../lib/database.js'
import { sectionsGroup, sectionsSticker, sectionsFun, sectionsOwner } from './submenu.js'

const P = config.display.prefix
const NAMA = config.bot.name

/* ------------------------- helper ------------------------- */
const main = (command, aliases, description, run, contoh = '', opt = {}) => ({
  command: [command, ...aliases],
  category: 'Main Menu',
  description,
  limit: 0,
  cooldown: 1,
  contoh,
  ...opt,
  run: async m => {
    try { return await run(m) } catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 220)}`) }
  }
})
/** baris daftar command sebuah kategori */
const isiKategori = (kat, maks = 60) => {
  const list = (categories().get(kat) || []).slice(0, maks)
  return list.map(p => `▸ ${P}${p.name} — ${p.description || ''}`).join('\n')
}
/* v7.32.0 — submenu ber-sections (diurutkan sesuai kegunaan, lihat features/submenu.js) */
const kirimSub = (judul, emoji, buat, ket) => async m => {
  const sections = buat()
  const total = sections.reduce((a, s) => a + s.rows.length, 0)
  return m.sendList({
    title: `${emoji} ${judul}`,
    text: `${emoji} *${judul} — ${total} fitur*\n${ket}\n\nPilih untuk langsung menjalankan:`,
    footer: config.bot.footer,
    buttonText: `${emoji} ${judul}`,
    sections
  })
}
/** menu list untuk satu kategori */
const menuKat = (m, kat, emoji, judul) => {
  const list = categories().get(kat) || []
  if (!list.length) return m.reply(`ℹ️ Kategori *${kat}* sedang kosong.`)
  const perBagian = Math.ceil(list.length / 2)
  const bagi = [list.slice(0, perBagian), list.slice(perBagian)].filter(x => x.length)
  return m.sendList({
    title: `${emoji} ${judul}`,
    text: `${list.length} perintah di kategori *${kat}*.\n\nPilih perintah untuk langsung menjalankannya:`,
    footer: config.bot.footer,
    buttonText: `${emoji} Lihat ${judul}`,
    sections: bagi.map((bag, i) => ({
      title: `${judul} ${bagi.length > 1 ? (i + 1) : ''}`.trim(),
      rows: bag.map(p => ({ title: `${P}${p.name}`, description: p.description || '', id: `${P}${p.name}` }))
    }))
  })
}

/* ================================================================== */
/*  A. MENU PER KATEGORI (12)                                          */
/* ================================================================== */
export const menuKategoriCmds = [
  main('menutools', ['toolsmenu', 'menuutilitas'], 'Menu Tools (104 fitur: konversi, encoder, kalkulator)', m => menuKat(m, 'Tools', '🧰', 'TOOLS'), ''),
  main('menugames', ['gamesmenu', 'menumain'], 'Menu Games (kuis, tebak-tebakan, mini game)', m => menuKat(m, 'Games', '🎮', 'GAMES'), ''),
  main('menuai', ['menuaicerdas', 'menukecerdasan'], 'Menu AI (chat, gambar, suara, terjemah)', m => menuKat(m, 'AI Menu', '🤖', 'AI'), ''),
  main('menusticker', ['stickermenu', 'menustikerlengkap'], '🎨 SEMUA stiker berurutan: buat, brat, meme, AI style & efek', kirimSub('MENU STICKER', '🎨', sectionsSticker, 'Buat stiker → brat & teks → meme → AI style → 40+ efek.'), ''),
  main('menugrup', ['menugruplengkap', 'menugrupsemua', 'menugroup'], '👥 SEMUA grup berurutan: pengaturan, sambutan, keamanan, absen', kirimSub('MENU GROUP', '👥', sectionsGroup, 'Atur grup → sambutan → keamanan → tag → absen & aktivitas.'), ''),
  main('menuowner', ['ownermenu'], '👑 SEMUA owner berurutan: broadcast, user, pengaturan, database (dev pindah ke .menudev)', kirimSub('MENU OWNER', '👑', sectionsOwner, 'Broadcast → premium & user → grup & sewa → pengaturan → database → pantau.'), ''),
  main('menurpg', ['rpgmenu', 'menupetualangan'], 'Menu RPG (petualangan, toko, dungeon, pet)', m => menuKat(m, 'RPG Menu', '⚔️', 'RPG'), ''),
  main('menuinfo', ['infomenu', 'menuinformasi'], 'Menu Info (berita, cuaca, kurs, wikipedia)', m => menuKat(m, 'Info Menu', 'ℹ️', 'INFO'), ''),
  main('menuinternet', ['netmenu', 'menuweb'], 'Menu Internet (download, cek web, jaringan)', m => menuKat(m, 'Internet', '🌐', 'INTERNET'), ''),
  main('menufun', ['funmenu', 'menuhiburan'], '🎉 SEMUA fun berurutan: ramalan, jodoh, humor, acak & teks unik', kirimSub('MENU FUN', '🎉', sectionsFun, 'Ramalan → jodoh → cek diri → humor → main & acak → teks unik → quotes.'), ''),
  main('menudownload', ['dlmenu', 'menudl'], 'Menu Downloader (video, gambar, file)', m => menuKat(m, 'Downloader', '⬇️', 'DOWNLOADER'), ''),
  main('menuadmin', ['adminmenu', 'menuadmin grup'.replace(' ', '')], 'Menu khusus admin grup (fitur yang butuh admin)', m => {
    const list = listPlugins().filter(p => p.admin || p.group)
    const perKat = {}
    for (const p of list) (perKat[p.category] = perKat[p.category] || []).push(p)
    return m.sendList({
      title: '🛡️ MENU ADMIN GRUP',
      text: `*${list.length} perintah* yang butuh status grup/admin.\n\nPastikan bot sudah jadi admin: ${P}undangbot`,
      footer: config.bot.footer,
      buttonText: '🛡️ Menu Admin',
      sections: Object.entries(perKat).slice(0, 8).map(([k, arr]) => ({
        title: `${k} (${arr.length})`,
        rows: arr.slice(0, 12).map(p => ({ title: `${P}${p.name}`, description: p.description || '', id: `${P}${p.name}` }))
      }))
    })
  })
]

/* ================================================================== */
/*  B. VARIAN TAMPILAN MENU (8)                                        */
/* ================================================================== */
const semuaKategori = () => [...categories()].sort((a, b) => b[1].length - a[1].length)

export const menuVarianCmds = [
  main('menutombol', ['menubutton', 'menubuttonlist'], 'Menu utama dalam bentuk tombol', m => {
    const cats = semuaKategori()
    const total = listPlugins().length
    return m.sendButtons({
      title: `🤖 ${NAMA}`,
      text: `Halo @${(m.senderKey || m.sender).split('@')[0]}! 👋\n\nBot ini punya *${total} perintah* dalam ${cats.length} kategori.\n\nPakai tombol di bawah untuk membuka menu yang kamu mau.`,
      footer: config.bot.footer,
      buttons: cats.slice(0, 6).map(([k, v]) => ({ text: `${k} (${v.length})`, id: `${P}menu${k.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}` })),
      image: config.display.thumbnail
    })
  }),

  main('menulist', ['menudropdownlist', 'menudropdown'], 'Menu utama dalam bentuk list/dropdown', m => {
    const cats = semuaKategori()
    return m.sendList({
      title: `📋 MENU ${NAMA}`,
      text: `${listPlugins().length} perintah · ${cats.length} kategori\n\nPilih kategori:`,
      footer: config.bot.footer,
      buttonText: '📋 Buka Kategori',
      sections: cats.map(([k, v]) => ({
        title: `${k} (${v.length})`,
        rows: v.slice(0, 10).map(p => ({ title: `${P}${p.name}`, description: p.description || '', id: `${P}${p.name}` }))
          .concat([{ title: `➕ Lihat semua ${k}`, id: `${P}listkat ${k}` }])
      }))
    })
  }),

  main('menuteks', ['textmenu', 'menupolos'], 'Menu utama dalam bentuk teks biasa (hemat kuota)', m => {
    const cats = semuaKategori()
    const teks = cats.map(([k, v]) => `*${k.toUpperCase()}* (${v.length})\n${v.slice(0, 14).map(p => `▸ ${P}${p.name}`).join(' ')}${v.length > 14 ? ` +${v.length - 14} lainnya (${P}listkat ${k})` : ''}`).join('\n\n')
    return m.reply(`🤖 *${NAMA} — MENU TEKS*\n\n${truncate(teks, 3600)}\n\n💡 Cari fitur: ${P}carimenu <kata>`)
  }),

  main('menukarusel', ['carousellmenu', 'menugeser'], 'Menu utama dalam bentuk karusel (geser kartu)', async m => {
    const cats = semuaKategori().slice(0, 6)
    const { makeBanner } = await import('../lib/canvas.js')
    const tema = ['ocean', 'sunset', 'forest', 'grape', 'cyber', 'gold']
    const cards = []
    for (let i = 0; i < cats.length; i++) {
      const [k, v] = cats[i]
      const gambar = await makeBanner({
        title: k.toUpperCase(),
        subtitle: `${v.length} perintah tersedia`,
        footer: v.slice(0, 3).map(p => P + p.name).join('  ·  '),
        theme: tema[i % tema.length],
        width: 900,
        height: 400
      })
      cards.push({
        title: `${k} (${v.length})`,
        body: v.slice(0, 6).map(p => `▸ ${P}${p.name} — ${truncate(p.description || '', 90)}`).join('\n'),
        footer: `${v.length > 6 ? '+' + (v.length - 6) + ' lagi · ' : ''}${P}listkat ${k}`,
        image: gambar,
        buttons: [{ text: '📋 Buka Semua', id: `${P}listkat ${k}` }]
      })
    }
    await sendCarousel(m.sock, m.jid, {
      text: `🎠 *MENU ${NAMA}* — geser kartu untuk tiap kategori`,
      footer: config.bot.footer,
      quoted: m.raw,
      cards
    })
    return undefined
  }),

  main('menuairich', ['airichmenu', 'menukaya'], 'Menu utama dengan tampilan AI Rich (Meta AI style)', async m => {
    const cats = semuaKategori()
    await sendAIRich(m.sock, m.jid, {
      title: `🤖 ${NAMA}`,
      text: `Bot multifungsi dengan *${listPlugins().length} perintah*.\n\nKategori terbesar:\n${cats.slice(0, 8).map(([k, v]) => `▸ *${k}* — ${v.length} perintah`).join('\n')}`,
      table: [['Kategori', 'Jumlah'], ...cats.slice(0, 10).map(([k, v]) => [k, String(v.length)])],
      tip: `Ketik ${P}carimenu <kata> untuk mencari fitur, atau ${P}panduan untuk tutorial pemula.`,
      suggest: [`${P}menuislami`, `${P}menugames`, `${P}menuai`, `${P}panduan`],
      footer: config.bot.footer,
      quoted: m.raw
    })
    return undefined
  }),

  main('menuapp', ['appmenu', 'menuaplikasi'], 'Menu utama sebagai aplikasi HTML interaktif (cari & filter)', async m => {
    const cats = semuaKategori()
    const data = cats.map(([k, v]) => ({ k, c: v.map(p => ({ n: p.name, d: p.description || '' })) }))
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1020;color:#e8ecff;padding:14px}
h1{font-size:19px;margin-bottom:2px;background:linear-gradient(90deg,#7dd3fc,#c4b5fd);-webkit-background-clip:text;background-clip:text;color:transparent}
p.sub{font-size:12px;color:#93a0c8;margin-bottom:12px}
input{width:100%;padding:10px 12px;border-radius:12px;border:1px solid #2b3560;background:#131a33;color:#fff;font-size:14px;margin-bottom:10px}
.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:8px}
.tab{white-space:nowrap;padding:6px 11px;border-radius:999px;background:#16204a;color:#a9b6e4;font-size:12px;cursor:pointer;border:1px solid #26305c}
.tab.on{background:linear-gradient(90deg,#3b82f6,#8b5cf6);color:#fff;border-color:transparent}
.card{background:#131a33;border:1px solid #232c55;border-radius:12px;padding:10px 12px;margin-bottom:7px}
.card b{font-size:13.5px;color:#9fe8ff}
.card span{display:block;font-size:11.5px;color:#93a0c8;margin-top:3px}
code{background:#0e1430;padding:1px 5px;border-radius:5px;color:#c4b5fd;font-size:12px}
.f{margin-top:12px;text-align:center;font-size:11px;color:#5d6a94}
</style></head><body>
<h1>${NAMA}</h1><p class="sub">${listPlugins().length} perintah · ${cats.length} kategori · prefix <code>${P}</code></p>
<input id="q" placeholder="🔎 Cari fitur… (misal: sholat, stiker, ai)" oninput="render()">
<div class="tabs" id="tabs"></div><div id="out"></div>
<div class="f">theryhann! • v6 • semua perintah dijalankan lewat chat WhatsApp</div>
<script>
const D=${JSON.stringify(data)};let aktif='Semua';
function tabs(){const t=document.getElementById('tabs');t.innerHTML='';
 const list=['Semua',...D.map(x=>x.k)];
 for(const k of list){const b=document.createElement('div');b.className='tab'+(k===aktif?' on':'');b.textContent=k==='Semua'?'✨ Semua':k;
 b.onclick=()=>{aktif=k;tabs();render()};t.appendChild(b)}}
function render(){const q=document.getElementById('q').value.toLowerCase();
 let h='',n=0;
 for(const g of D){if(aktif!=='Semua'&&g.k!==aktif)continue;
  const c=g.c.filter(x=>!q||x.n.includes(q)||x.d.toLowerCase().includes(q));
  if(!c.length)continue;n+=c.length;
  h+='<div style="font-size:11px;color:#6f7db0;margin:10px 0 4px">'+g.k+' ('+c.length+')</div>';
  for(const x of c.slice(0,60))h+='<div class="card"><b>'+P+x.n+'</b><span>'+x.d+'</span></div>'}
 document.getElementById('out').innerHTML=h||'<div class="card"><span>Tidak ada hasil untuk "'+q+'"</span></div>';
}
tabs();render();
</script></body></html>`
    await sendHtmlApp(m.sock, m.jid, { title: `📱 Menu ${NAMA}`, html })
    return undefined
  }),

  main('menuringkas', ['menusingkat2', 'menucompact'], 'Menu ringkas: 1 baris per kategori', m => {
    const cats = semuaKategori()
    return m.reply(`🤖 *${NAMA}*\n\n${cats.map(([k, v]) => `*${k}* (${v.length}) → ${P}listkat ${k}`).join('\n')}\n\nTotal: ${listPlugins().length} perintah\nCari: ${P}carimenu <kata>`)
  }),

  main('listkat', ['isikategori', 'lihatkategori'], 'Lihat semua perintah satu kategori: .listkat <nama>', m => {
    const q = m.q
    const cats = semuaKategori()
    if (!q) return m.reply(`Contoh: ${P}listkat Islami\n\nKategori tersedia:\n${cats.map(([k, v]) => `▸ ${k} (${v.length})`).join('\n')}`)
    const kat = cats.find(([k]) => k.toLowerCase() === q.toLowerCase())?.[0] ||
      cats.find(([k]) => k.toLowerCase().includes(q.toLowerCase()))?.[0]
    if (!kat) return m.reply(`❌ Kategori "${q}" tidak ada.\n\nTersedia:\n${cats.map(([k]) => `▸ ${k}`).join('\n')}`)
    const list = categories().get(kat) || []
    return m.reply(`📂 *${kat.toUpperCase()}* (${list.length} perintah)\n\n${truncate(isiKategori(kat, 200), 3600)}\n\n💡 Contoh pakai: ${P}${list[0]?.name || 'menu'}`)
  }, 'Islami')
]

/* ================================================================== */
/*  C. PANDUAN & BANTUAN (12)                                          */
/* ================================================================== */
export const menuBantuanCmds = [
  main('panduan', ['petunjukpakai', 'cara pakai'.replace(' ', '')], 'Panduan singkat cara memakai bot', m => {
    return m.sendButtons({
      title: '📘 PANDUAN MEMAKAI BOT',
      text: `*1. Kirim perintah*\nTulis prefix lalu nama fitur, contoh:\n▸ ${P}menu — buka semua menu\n▸ ${P}jadwalsholat medan — jadwal sholat\n▸ ${P}ai jelaskan fotosintesis — tanya AI\n▸ ${P}stiker — balas gambar jadi stiker\n\n*2. Balas media*\nBanyak fitur butuh media dibalas (stiker, konversi, edit gambar).\n\n*3. Di dalam grup*\nTag bot atau pakai perintah; fitur admin butuh bot jadi admin.\n\n*4. Hemat limit*\nSebagian fitur memakai limit harian. Isi ulang: ${P}claim\n\n*5. Cari fitur*\n${P}carimenu <kata> · ${P}listkat <kategori> · ${P}menuapp`,
      footer: config.bot.footer,
      buttons: [{ text: '🚀 Mulai Coba', id: `${P}mulaicoba` }, { text: '❓ FAQ', id: `${P}faq` }, { text: '📋 Menu Lengkap', id: `${P}menu` }]
    })
  }),

  main('mulaicoba', ['onboarding', 'pemula'], '5 perintah pertama yang wajib dicoba', m => {
    const coba = [
      ['menu', 'Lihat semua kategori fitur'],
      ['ai apa itu black hole?', 'Ngobrol & tanya apa saja ke AI'],
      ['jadwalsholat jakarta', 'Jadwal sholat + arah kiblat'],
      ['stiker', 'Balas gambar/video jadi stiker (kirim: ' + P + 'stiker sambil balas gambar)'],
      ['tebakgambar', 'Main kuis seru bareng teman']
    ]
    return m.sendButtons({
      title: '🚀 MULAI COBA — 5 LANGKAH',
      text: coba.map(([c, d], i) => `*${i + 1}.* \`${P}${c}\`\n   ${d}`).join('\n\n') + `\n\nSetelah itu jelajahi: ${P}menulengkap atau ${P}menuapp`,
      footer: config.bot.footer,
      buttons: coba.slice(0, 3).map(([c]) => ({ text: `${P}${c.split(' ')[0]}`, id: `${P}${c.split(' ')[0]}` }))
    })
  }),

  main('faq', ['tanyaumum', 'pertanyaansering'], 'Pertanyaan yang paling sering ditanya', m => {
    const s = getSettings()
    return m.reply(`❓ *FAQ ${NAMA}*\n\n*1. Kenapa fitur tidak merespons?*\n▸ Cek prefix: sekarang \`${config.display.prefix}\`\n▸ Mode publik: ${s.public ? 'aktif' : 'MATI (hanya owner)'}\n▸ Mungkin kena cooldown: tunggu beberapa detik\n\n*2. Kenapa muncul "limit habis"?*\nBeberapa fitur memakai limit harian. Isi: ${P}claim / ${P}klaimmingguan / ${P}tukarlimit\n\n*3. Kenapa "khusus admin"?*\nFitur grup butuh kamu admin DAN bot admin. Undang/promosikan bot: ${P}undangbot\n\n*4. Fitur download gagal?*\nCoba lagi (kadang API sumber sibuk) atau pakai link lain. Cek: ${P}kendalapertama\n\n*5. Bot lambat?*\nTergantung jaringan HP/Server & antrean. Cek kecepatan: ${P}ping\n\n*6. Data saya aman?*\nBot menyimpan level/limit/catatan kamu. Lihat & unduh: ${P}ekspordataku\n\n*7. Mau request fitur?*\n${P}saran <isi saran> atau ${P}permintaanfitur`)
  }),

  main('carimenu', ['cari menu'.replace(' ', ''), 'temukanfitur'], 'Cari fitur lewat kata kunci', m => {
    const q = (m.q || '').toLowerCase()
    if (!q) return m.reply(`Contoh:\n▸ ${P}carimenu sholat\n▸ ${P}carimenu stiker\n▸ ${P}carimenu download\n\nAtau buka aplikasi menu: ${P}menuapp`)
    const hasil = listPlugins().filter(p =>
      p.name.includes(q) || (p.description || '').toLowerCase().includes(q) ||
      (p.command || []).some(c => c.includes(q)) || (p.category || '').toLowerCase().includes(q))
    if (!hasil.length) return m.reply(`❌ Tidak ketemu "${q}".\n\nCoba kata lain atau lihat semua: ${P}menuteks\n\n💡 Contoh kata kunci: sholat, quran, cuaca, stiker, ai, gambar, game, grup, download`)
    const perKat = {}
    for (const p of hasil) (perKat[p.category] = perKat[p.category] || []).push(p)
    return m.sendButtons({
      title: `🔎 HASIL "${q}" — ${hasil.length} fitur`,
      text: Object.entries(perKat).map(([k, arr]) => `*${k}* (${arr.length})\n${arr.slice(0, 8).map(p => `▸ ${P}${p.name} — ${truncate(p.description || '', 44)}`).join('\n')}${arr.length > 8 ? `\n▸ +${arr.length - 8} lagi` : ''}`).join('\n\n').slice(0, 2600),
      footer: config.bot.footer,
      buttons: hasil.slice(0, 3).map(p => ({ text: p.name, id: `${P}${p.name}` }))
    })
  }, 'sholat'),

  main('pintasan', ['shortcut', 'perintahcepat'], 'Daftar pintasan perintah yang paling sering dipakai', m => {
    const s = getStats()
    const top = Object.entries(s.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const wajib = [
      ['menu', 'Buka menu utama'], ['ai', 'Tanya AI apa saja'], ['stiker', 'Gambar → stiker'],
      ['claim', 'Klaim limit harian'], ['jadwalsholat', 'Jadwal sholat'], ['tiktok', 'Download TikTok'],
      ['cuaca', 'Cuaca kota'], ['terjemah', 'Terjemahkan teks'], ['profile', 'Profil kamu'], ['ping', 'Kecepatan bot']
    ]
    return m.reply(`⚡ *PINTASAN CEPAT*\n\n${wajib.map(([c, d]) => `▸ \`${P}${c}\` — ${d}`).join('\n')}\n\n*Paling sering dipakai semua orang:*\n${top.length ? top.map(([k, v], i) => `${i + 1}. ${P}${k} (${v}×)`).join('\n') : '(belum ada data)'}\n\n💡 Prefix bisa juga: ${config.display.prefixes ? config.display.prefixes.join(' ') : config.display.prefix}`)
  }),

  main('contohpenggunaan', ['contoh', 'example'], 'Contoh pemakaian beberapa fitur populer', m => {
    const contoh = [
      ['ai', 'jelaskan teori relativitas dengan singkat'],
      ['jadwalsholat', 'medan'],
      ['stiker', '(balas gambar/video lalu kirim perintah ini)'],
      ['terjemah', 'en|selamat pagi dunia'],
      ['tiktok', 'https://www.tiktok.com/@user/video/123'],
      ['cuaca', 'jakarta'],
      ['wallpaper', 'pegunungan malam'],
      ['tebakgambar', ''],
      ['welcome', 'on'],
      ['antilink', 'on'],
      ['setbio', 'suka ngopi sambil ngoding'],
      ['ingatkan', '30 minum obat']
    ]
    return m.reply(`📖 *CONTOH PEMAKAIAN*\n\n${contoh.map(([c, a]) => `▸ \`${P}${c}${a ? ' ' + a : ''}\``).join('\n')}\n\n*Format umum:*\n\`${P}perintah <argumen>\`\n\`${P}perintah <pilihan1>|<pilihan2>\`\n\nLihat contoh tiap fitur: ${P}infofitur <nama>\nCari fitur: ${P}carimenu <kata>`)
  }),

  main('infofitur', ['detailfitur', 'bantuanfitur'], 'Bantuan detail satu fitur: .infofitur <nama>', m => {
    const q = (m.args[0] || '').toLowerCase().replace(new RegExp('^\\' + P), '')
    if (!q) return m.reply(`Contoh: ${P}infofitur tiktok`)
    const pl = pluginMap.get(q)
    if (!pl) return m.reply(`❌ Fitur "${q}" tidak ditemukan.\n\nCari: ${P}carimenu ${q}`)
    return m.sendButtons({
      title: `📖 ${P}${pl.name}`,
      text: `*Deskripsi:* ${pl.description || '-'}\n*Kategori:* ${pl.category || '-'}\n*Alias:* ${(pl.command || []).map(c => P + c).join(', ')}\n*Biaya limit:* ${pl.limit || 0}${pl.limit ? '' : ' (gratis)'}\n*Cooldown:* ${pl.cooldown ?? config.limits.cooldown} detik\n*Akses:* ${[pl.owner && '👑 owner', pl.admin && '🛡️ admin grup', pl.group && '👥 khusus grup', pl.premium && '💎 premium', pl.private && '🔒 chat pribadi'].filter(Boolean).join(', ') || 'semua orang'}\n\n*Cara pakai:*\n\`${P}${pl.name}${pl.contoh && pl.contoh !== '1' ? ' ' + pl.contoh : ''}\``,
      footer: config.bot.footer,
      buttons: [{ text: '▶️ Jalankan', id: `${P}${pl.name}` }, { text: '🔎 Fitur Serupa', id: `${P}carimenu ${pl.name.slice(0, 5)}` }]
    })
  }, 'tiktok'),

  main('kamusperintah', ['glossary', 'istilahbot'], 'Kamus istilah: limit, EXP, cooldown, premium, dsb.', m => {
    const istilah = [
      ['Prefix', `Awalan perintah, sekarang "${config.display.prefix}"`],
      ['Limit', 'Kuota harian untuk fitur berbayar. Isi: ' + P + 'claim'],
      ['EXP', 'Poin pengalaman. Naik tiap pakai command → menaikkan Level'],
      ['Level', 'Tingkat akun. Tiap 5 level dapat bonus limit'],
      ['Cooldown', 'Jeda antar perintah agar tidak spam'],
      ['Premium', 'Akun berbayar: limit besar & semua fitur terbuka'],
      ['Auto-AI', 'Bot menjawab chat kamu tanpa prefix (' + P + 'autoaion)'],
      ['Stiker', 'Gambar/video diubah jadi stiker WhatsApp'],
      ['AIRich', 'Format balasan kaya (tabel, kode, gambar) ala Meta AI'],
      ['Interactive', 'Pesan dengan tombol/list yang bisa diklik'],
      ['RPG', 'Mode petualangan: kerja, toko, dungeon, pet, inventory'],
      ['Absen', 'Presensi member grup lewat bot'],
      ['Warning', 'Peringatan admin ke member (3× = kick)'],
      ['Anti-link', 'Hapus otomatis pesan berisi link grup lain'],
      ['NSFW', 'Konten dewasa — dimatikan default di grup']
    ]
    return m.reply(`📚 *KAMUS ISTILAH BOT*\n\n${istilah.map(([k, v]) => `*${k}*\n${v}`).join('\n\n')}\n\nTanya istilah lain: ${P}ai apa itu cooldown?`)
  }),

  main('tipsbot', ['tips', 'trik'], 'Tips & trik memaksimalkan bot', m => {
    return m.reply(`💡 *TIPS & TRIK*\n\n*1. Pakai tombol/list*\nMenu tombol lebih cepat daripada mengetik: ${P}menutombol\n\n*2. Hemat limit*\nFitur gratis sangat banyak. Cek biaya: ${P}biayaperintah <cmd>\nIsi: ${P}claim · ${P}klaimmingguan · ${P}klaimbulanan\n\n*3. Auto-AI di grup*\nNyalakan agar bot menjawab pertanyaan tanpa prefix: ${P}autoaion\n\n*4. Stiker cepat*\nBalas gambar lalu kirim ${P}stiker — bisa juga ${P}stikeremoji 🐱\n\n*5. Cari fitur*\n${P}carimenu <kata> atau aplikasi ${P}menuapp\n\n*6. Naik level cepat*\nMain game (${P}menugames) & RPG (${P}menurpg) memberi EXP besar\n\n*7. Catat hal penting*\n${P}catat <teks> · ${P}ingatkan <menit> <teks>\n\n*8. Admin grup*\nPasang ${P}welcome on + ${P}antilink on + ${P}antitoxic on sekaligus`)
  }),

  main('kendalapertama', ['troubleshoot', 'masalah'], 'Solusi masalah yang sering terjadi', m => {
    const s = getSettings()
    return m.reply(`🛠️ *PENANGANAN MASALAH*\n\n*Bot tidak membalas*\n1. Cek prefix benar: \`${config.display.prefix}\`\n2. Mode publik: ${s.public ? '✅ aktif' : '❌ MATI (owner only)'}\n3. Cooldown: tunggu 2-3 detik\n4. Di grup: pastikan bot tidak di-mute (${P}unmute)\n\n*"Khusus admin" / "Khusus owner"*\nFitur grup butuh kamu admin + bot admin. Di nomor owner: hanya ${config.owner.number}.\n\n*"Limit habis"*\n${P}claim (harian) · ${P}klaimmingguan · ${P}tukarlimit\n\n*Download gagal / media tidak ditemukan*\nSumber sibuk atau link privat. Coba lagi beberapa menit, atau link lain.\n\n*Stiker gagal*\nPastikan media dibalas (reply), bukan dikirim bareng teks.\n\n*AI lambat/error*\nLayanan AI publik kadang rate-limit. Coba lagi atau ${P}setmodelai (owner).\n\nMasih bermasalah? ${P}laporbug <penjelasan>`)
  }),

  main('tutorial', ['bimbing', 'cara main'.replace(' ', '')], 'Tutorial bertahap dari nol sampai mahir', m => {
    const tahap = [
      ['Level 1 — Kenalan', [`${P}menu`, `${P}panduan`, `${P}pintasan`]],
      ['Level 2 — Coba fitur dasar', [`${P}ai halo`, `${P}stiker`, `${P}cuaca jakarta`]],
      ['Level 3 — Islami & info', [`${P}jadwalsholat medan`, `${P}quran`, `${P}asmaulhusna`]],
      ['Level 4 — Main game', [`${P}tebakgambar`, `${P}suit`, `${P}tictactoe`]],
      ['Level 5 — Akun & ekonomi', [`${P}daftar`, `${P}claim`, `${P}levelcard`]],
      ['Level 6 — RPG petualangan', [`${P}rpg`, `${P}kerja`, `${P}toko`]],
      ['Level 7 — Admin grup', [`${P}welcome on`, `${P}antilink on`, `${P}absen`]],
      ['Level 8 — RPG v7 & Game AIRich', [`${P}rpgmenu3`, `${P}jobinfo`, `${P}airichgamelab`]]
    ]
    return m.sendList({
      title: '🎓 TUTORIAL BERTAHAP',
      text: 'Ikuti dari Level 1 sampai 8. Klik salah satu untuk langsung menjalankan perintahnya.',
      footer: config.bot.footer,
      buttonText: '🎓 Pilih Tahap',
      sections: tahap.map(([judul, cmds]) => ({
        title: judul,
        rows: cmds.map(c => ({ title: c, id: c.replace(/\s.*/, '') }))
      }))
    })
  }),

  main('bantuan', ['bantuancepat', 'tolong'], 'Bantuan cepat (alias menu ringkas)', m => {
    const cats = semuaKategori()
    return m.reply(`🆘 *BANTUAN CEPAT*\n\n${cats.map(([k, v]) => `▸ *${k}* (${v.length}) → ${P}listkat ${k}`).join('\n')}\n\n*Lainnya:*\n▸ ${P}panduan — cara pakai bot\n▸ ${P}faq — pertanyaan umum\n▸ ${P}carimenu <kata> — cari fitur\n▸ ${P}menuapp — menu aplikasi HTML\n▸ ${P}infofitur <nama> — detail satu fitur\n▸ ${P}kendalapertama — solusi masalah\n▸ ${P}owner — hubungi owner`)
  }),

  main('semuaperintah', ['daftarfitur', 'listfitur'], 'Daftar SEMUA perintah bot (teks panjang)', m => {
    const cats = semuaKategori()
    const teks = cats.map(([k, v]) => `*${k.toUpperCase()}* (${v.length})\n${v.map(p => p.name).join(', ')}`).join('\n\n')
    if (teks.length > 3800) {
      const bagian = []
      let now = ''
      for (const blok of teks.split('\n\n')) {
        if ((now + blok).length > 3600) { bagian.push(now); now = blok } else now += (now ? '\n\n' : '') + blok
      }
      if (now) bagian.push(now)
      m.reply(`📜 *SEMUA PERINTAH* (${listPlugins().length}) — dikirim ${bagian.length} bagian`).catch(() => {})
      return m.reply(`*Bagian 1/${bagian.length}*\n\n${bagian[0]}\n\n_Ketik ${P}semuaperintah 2 untuk bagian berikutnya_`)
    }
    return m.reply(`📜 *SEMUA PERINTAH* (${listPlugins().length})\n\n${teks}\n\nPrefix: ${config.display.prefix}`)
  })
]

/* ================================================================== */
/*  D. INFO BOT (10)                                                   */
/* ================================================================== */
export const menuInfoBotCmds = [
  main('versibot', ['cekversi', 'versiterkini'], 'Versi bot saat ini', m => {
    const s = getSettings()
    return m.reply(`🏷️ *${NAMA}*\n\nVersi   : ${config.version || config.bot?.version || '7.0.0'}\nBuild   : ${config.build || 'stable'}\nPerintah: ${listPlugins().length}\nKategori: ${categories().size}\nNode    : ${process.version}\nPrefix  : ${config.display.prefix}\nMode    : ${s.public ? 'publik' : 'self (owner only)'}\nUptime  : ${formatDuration(process.uptime() * 1000)}\n\nPerubahan versi: ${P}changelog`)
  }),

  main('changelog', ['perubahan', 'riwayatversi'], 'Catatan perubahan tiap versi', m => {
    const log = [
      ['7.0.0', 'AIRich Game Lab (38 game/mini-game AIRichResponseMessage: tambang, 2048, memory, ular, connect4, blackjack, roulette, slot, dadu, high-low, math, reaction, battle, dungeon, lelang, dll) + RPG v7 (79 fitur baru: job/kelas, skill tree, guild, world boss, market antar pemain, masak & buff, permata, peternakan, rumah & dekorasi, relik, musim, rebirth, streak harian, turnamen mingguan).'],
      ['6.0.1', 'Perbaikan installer & verifikasi paket.'],
      ['6.0.0', 'Ekspansi besar: +50 fitur di SETIAP kategori (Tools, Islami, Fun, Games, Info, Sticker, Internet, AI, Group, Owner, User, Downloader, Main), kategori Islami baru, RPG detail + kartu gambar, filter NSFW grup, statistik per user, aplikasi menu HTML.'],
      ['5.0.1', 'Perbaikan bug kartu & stabilitas, update.sh otomatis.'],
      ['5.0.0', 'Game aplikasi HTML (AIRich HtmlPrimitive): snake, 2048, memory, flappy, dan lainnya.'],
      ['4.0.0', 'Game dengan AIRichResponseMessage (194 perintah).'],
      ['3.0.0', 'Kartu welcome/leave bergambar, submenu diperluas, gambar menu bisa diganti.'],
      ['2.0.0', 'Perbaikan LID (admin/owner tidak terdeteksi), RPG, mini games.'],
      ['1.0.0', 'Rilis pertama: interactive button/list + AIRich.']
    ]
    return m.reply(`📝 *CHANGELOG ${NAMA}*\n\n${log.map(([v, isi]) => `*v${v}*\n${isi}`).join('\n\n').slice(0, 3500)}`)
  }),

  main('kreditbot', ['penghargaan', 'kreditpembuat'], 'Kredit & sumber daya yang dipakai', m => {
    return m.reply(`🙏 *KREDIT*\n\n*Pembuat:* THERYHANN (${config.owner.number})\n*Bot:* ${NAMA} v${config.version || config.bot?.version || '7.0.0'}\n\n*Library:*\n▸ @rexxhayanasi/elaina-baileys — koneksi WhatsApp (interactive button/list/AIRich)\n▸ jimp — pengolahan gambar (stiker, efek, kartu)\n▸ node-canvas/sharp — render kartu & banner\n\n*Sumber data:*\n▸ api.aladhan.com — jadwal sholat, kiblat, kalender Hijriah\n▸ api.quran.gading.dev — Al-Qur'an & tafsir\n▸ open-meteo.com — cuaca\n▸ id.wikipedia.org — ringkasan artikel\n▸ open.er-api.com — kurs mata uang\n▸ mledoze/countries — data negara\n▸ tikwm.com — downloader TikTok\n▸ pollinations.ai — AI teks & gambar\n\n*Dataset npm:* arbain-id, @asksakina/islamic-knowledge-mcp (asmaul husna & doa)`)
  }),

  main('lisensi', ['license'], 'Lisensi & ketentuan pemakaian', m => {
    return m.reply(`⚖️ *LISENSI*\n\nBot ini dibagikan untuk keperluan *edukasi & pribadi*.\n\n*Boleh:*\n▸ Memakai untuk grup/komunitas sendiri\n▸ Memodifikasi untuk belajar\n▸ Menyebarkan dengan menyertakan kredit\n\n*Tidak boleh:*\n▸ Menjual ulang sebagai produk sendiri\n▸ Menghapus kredit pembuat\n▸ Memakai untuk spam, penipuan, judi, atau konten ilegal\n\n*Risiko:* WhatsApp bisa memblokir nomor yang memakai otomasi berlebihan. Pakai dengan wajar.\n\nKredit: ${P}kreditbot · Aturan: ${P}rules`)
  }),

  main('sumbercode', ['sourcecode', 'kodebot'], 'Struktur kode bot ini', m => {
    return m.reply(`📦 *STRUKTUR PROJECT*\n\n\`\`\`\ntheryhann-bot/\n├─ index.js          → titik masuk (koneksi WA)\n├─ config.js         → nomor owner, prefix, AI, limit\n├─ handlers/         → pesan, grup, tombol\n├─ lib/              → plugins, database, serializer,\n│                      interactive, canvas, ai, htmlapp\n├─ features/         → semua command (1 file = 1 kategori)\n├─ data/             → dataset (quran, doa, negara, dll)\n├─ database/         → users.json, groups.json, ...\n├─ media/            → gambar menu & kartu\n├─ scripts/          → test offline & build data\n└─ session/          → login WhatsApp (jangan dihapus)\n\`\`\`\n\nLihat isi folder: ${P}listfolder (owner)\nTotal perintah: ${listPlugins().length}`)
  }),

  main('carainstall', ['instalasi', 'pasangbot'], 'Cara memasang bot ini di Termux (langkah lengkap)', m => {
    return m.sendButtons({
      title: '📲 CARA INSTALL DI TERMUX',
      text: `*1. Siapkan Termux (F-Droid lebih stabil)*\n\`\`\`pkg update -y && pkg upgrade -y\npkg install -y nodejs git ffmpeg libwebp\`\`\`\n\n*2. Ambil kode bot*\n\`\`\`git clone <repo> therYHNN-bot\ncd therYHNN-bot\nnpm install --no-audit --no-fund\`\`\`\n\n*3. Isi config.js*\n▸ number: nomor bot (KARTU SIM ke-2)\n▸ owner.number: ${config.owner.number}\n▸ pairing: nomor untuk kode pairing\n\n*4. Jalankan*\n\`\`\`node index.js\`\`\`\nScan QR (atau masukkan kode pairing).\n\n*5. Biar jalan terus*\n\`\`\`npm start\`\`\` atau pakai update.sh\n\n⚠️ Jangan pakai nomor utama — rawan banned.`,
      footer: config.bot.footer,
      buttons: [{ text: '🆘 Kendala Install', id: `${P}kendalapertama` }, { text: '📦 Struktur Kode', id: `${P}sumbercode` }]
    })
  }),

  main('fiturunggulan', ['keunggulan', 'fitur utama'.replace(' ', '')], 'Fitur paling unggulan di bot ini', m => {
    const cats = semuaKategori()
    const unggul = [
      ['🕌 Islami', `${(categories().get('Islami') || []).length} fitur: jadwal sholat, Al-Qur'an + tafsir, hadits, doa harian, asmaul husna, kalender Hijriah, arah kiblat`],
      ['🤖 AI Lengkap', 'chat AI (dengan memori), AI gambar, AI suara/TTS, terjemah, rangkum, coding helper'],
      ['🎨 Stiker & Gambar', 'buat stiker dari gambar/video/teks, puluhan efek edit gambar, kartu profil bergambar'],
      ['🕹️ Game AIRich', '38 game dalam satu pesan AI Rich yang berubah tiap aksi: tambang, 2048, memory, ular, connect4, blackjack, roulette, slot, dadu, high-low, battle, dungeon, lelang, tebak-tebakan'],
      ['⚔️ RPG v7', 'job/kelas + skill tree, guild & misi mingguan, world boss rame-rame, market antar pemain, masak & buff, permata, peternakan, rumah, relik, musim, rebirth, turnamen'],
      ['👥 Manajemen Grup', 'welcome/leave bergambar, absen, voting, warning, anti-link/toxic/NSFW, aturan grup'],
      ['🌐 Internet', 'download TikTok/media, cek web, whois, IP, kurs, cuaca, wikipedia'],
      ['👤 Akun Personal', 'level & EXP, limit, pengingat, catatan, bookmark, statistik pemakaian']
    ]
    return m.sendButtons({
      title: '✨ FITUR UNGGULAN',
      text: unggul.map(([k, v]) => `*${k}*\n${v}`).join('\n\n') + `\n\nTotal: *${listPlugins().length} perintah* dalam ${cats.length} kategori.`,
      footer: config.bot.footer,
      buttons: [{ text: '⚔️ RPG v7', id: `${P}rpgmenu3` }, { text: '🕹️ Game AIRich', id: `${P}airichgamelab` }, { text: '🕌 Islami', id: `${P}menuislami` }, { text: '🎮 Games', id: `${P}menugames` }]
    })
  }),

  main('statistikpublik', ['statpublik', 'statistikbotpublik'], 'Statistik pemakaian bot secara keseluruhan', m => {
    const s = getStats()
    const users = allUsers(), groups = allGroups()
    const top = Object.entries(s.commands || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return m.reply(`📊 *STATISTIK BOT*\n\nPerintah diproses : ${(s.total || 0).toLocaleString('id-ID')}\nPengguna terdaftar: ${users.length}\nGrup aktif        : ${groups.length}\nFitur tersedia    : ${listPlugins().length}\nUptime proses     : ${formatDuration(process.uptime() * 1000)}\nMemori dipakai    : ${formatSize(process.memoryUsage().rss)}\n\n*Perintah terpopuler:*\n${top.map(([k, v], i) => `${i + 1}. ${P}${k} — ${v}×`).join('\n') || '(belum ada data)'}\n\nStatistik kamu: ${P}statistikku`)
  }),

  main('updateinfo', ['infoupdate', 'cekupdate'], 'Cara memperbarui bot ke versi terbaru', m => {
    return m.reply(`🔄 *UPDATE BOT*\n\n*Cara 1 — script otomatis (disarankan)*\n\`\`\`bash ./update.sh\`\`\`\nScript akan mengunduh zip terbaru, menimpa file, lalu menjalankan ulang bot.\n\n*Cara 2 — git*\n\`\`\`git pull\nnpm install --no-audit --no-fund\nnode index.js\`\`\`\n\n*Cara 3 — manual*\n1. Unduh zip terbaru dari owner\n2. Ekstrak menimpa folder bot\n3. ${P}backupdb dulu kalau mau aman (owner)\n4. Jalankan ulang: node index.js\n\n⚠️ Folder \`session/\` dan \`database/\` jangan dihapus agar tidak perlu login ulang.\n\nVersi sekarang: ${config.version || config.bot?.version || '7.0.0'} — lihat ${P}changelog`)
  }),

  main('kontak', ['contact', 'hubungi'], 'Cara menghubungi owner/pembuat', m => {
    const wa = `https://wa.me/${config.owner.number}`
    return m.sendButtons({
      title: '📞 KONTAK',
      text: `*Owner/Pembuat:* ${config.owner.name || 'THERYHANN'}\n*Nomor:* ${config.owner.number}\n*WhatsApp:* ${wa}\n\n*Untuk:*\n▸ Beli premium: ${P}hargapremium\n▸ Lapor bug: ${P}laporbug <penjelasan>\n▸ Saran fitur: ${P}saran <isi>\n▸ Minta invite bot ke grup: chat langsung\n\n⚠️ Chat dengan sopan ya, owner manusia biasa 😊`,
      footer: config.bot.footer,
      buttons: [{ text: '💎 Premium', id: `${P}hargapremium` }, { text: '🐞 Lapor Bug', id: `${P}laporbug` }, { text: '👑 Owner', id: `${P}owner` }]
    })
  })
]

/* ================================================================== */
/*  E. SAPAAN & LAIN-LAIN (8)                                          */
/* ================================================================== */
export const menuLainCmds = [
  main('halo', ['hai', 'hi'], 'Sapa bot dan dapat ringkasan cepat', m => {
    const jam = new Date().getHours()
    const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam'
    return m.sendButtons({
      title: `👋 ${salam}, ${m.pushName || 'kak'}!`,
      text: `Aku *${NAMA}* — bot WhatsApp dengan ${listPlugins().length} perintah.\n\nMau mulai dari mana?`,
      footer: config.bot.footer,
      buttons: [{ text: '📋 Menu Utama', id: `${P}menu` }, { text: '🚀 Coba Cepat', id: `${P}mulaicoba` }, { text: '🤖 Tanya AI', id: `${P}ai halo` }]
    })
  }),

  main('sapa', ['greet'], 'Sapa semua orang di grup', m => {
    if (!m.isGroup) return m.reply(`ℹ️ Perintah ini untuk grup.\nDi chat pribadi coba: ${P}halo`)
    const peserta = (m.group?.participants || []).map(p => p.id || p).filter(j => j !== m.sock?.user?.id)
    return m.reply(`👋 *HALO SEMUA!*\n\n${peserta.slice(0, 30).map(j => `@${j.split('@')[0]}`).join(' ')}${peserta.length > 30 ? ` dan ${peserta.length - 30} lainnya` : ''}\n\nAda ${peserta.length} orang di grup *${m.groupName}*. Semoga harimu menyenangkan! ✨`, { mentions: peserta.slice(0, 100) })
  }),

  main('tesbot', ['testbot', 'cekrespons'], 'Cek apakah bot merespons', m => {
    const t0 = Date.now()
    return m.reply(`✅ Bot aktif dan merespons.\n\nWaktu balasan: ${Date.now() - t0} ms\nUptime: ${formatDuration(process.uptime() * 1000)}\nPerintah: ${listPlugins().length}\n\nCek kecepatan jaringan: ${P}ping`)
  }),

  main('cekbot', ['botstatuscepat', 'botaktif'], 'Status bot: online, mode, beban', m => {
    const s = getSettings()
    const os = process.memoryUsage()
    return m.sendButtons({
      title: '🟢 BOT AKTIF',
      text: `*Mode:* ${s.public ? 'Publik (semua orang)' : 'Self (owner only)'}\n*Uptime:* ${formatDuration(process.uptime() * 1000)}\n*Perintah:* ${listPlugins().length}\n*Memori:* ${formatSize(os.rss)}\n*User:* ${allUsers().length} · *Grup:* ${allGroups().length}\n*Auto-AI kamu:* ${m.userDB.autoai ? '✅ aktif' : '❌ mati'}\n*Limit kamu:* ${m.userDB.limit}`,
      footer: config.bot.footer,
      buttons: [{ text: '📋 Menu', id: `${P}menu` }, { text: '👤 Profil', id: `${P}profile` }, { text: '🤖 Auto-AI ON', id: `${P}autoaion` }]
    })
  }),

  main('grupresmi', ['grupofficial', 'join grup'.replace(' ', '')], 'Info grup resmi bot', m => {
    const link = config.display.groupLink || config.bot.groupLink || ''
    return m.reply(link
      ? `👥 *GRUP RESMI ${NAMA}*\n\nGabung untuk tanya-jawab, request fitur, dan info update:\n${link}\n\nAturan grup ada di deskripsi. Jangan spam ya!`
      : `👥 Grup resmi belum dipasang.\n\nOwner bisa menambahkannya di config.js (display.groupLink).\n\nSementara itu:\n▸ Request fitur: ${P}saran <isi>\n▸ Hubungi owner: ${P}kontak`)
  }),

  main('undangbot', ['invitebot', 'tambahbot'], 'Cara menambahkan bot ke grup kamu', m => {
    const kode = m.sock?.user?.id?.split('@')[0] || config.bot.number
    return m.sendButtons({
      title: '➕ UNDANG BOT KE GRUP',
      text: `*Cara 1 — lewat link WhatsApp*\nBuka link ini di HP kamu, pilih grup tujuan:\nhttps://wa.me/${kode}\n\n*Cara 2 — dari dalam grup*\n1. Buka info grup → *Undang peserta*\n2. Masukkan nomor bot: ${kode}\n3. Setelah masuk, jadikan bot *ADMIN*\n\n*Setelah bot jadi admin, nyalakan:*\n▸ ${P}welcome on — kartu sambutan member\n▸ ${P}antilink on — hapus link grup lain\n▸ ${P}antitoxic on — filter kata kasar\n▸ ${P}absen — presensi member\n\n⚠️ Tanpa status admin, fitur grup tidak jalan.`,
      footer: config.bot.footer,
      buttons: [{ text: '🛡️ Menu Admin', id: `${P}menuadmin` }, { text: '👥 Menu Grup', id: `${P}menugrup` }]
    })
  }),

  main('permintaanfitur', ['requestfitur', 'minta fitur'.replace(' ', '')], 'Ajukan permintaan fitur baru', async m => {
    const teks = m.q
    if (!teks) return m.reply(`Contoh: ${P}permintaanfitur tambah fitur download story Instagram\n\nAtau pakai: ${P}saran <isi>`)
    const db = (await import('../lib/database.js')).loadDB('saran', [])
    db.push({ dari: m.senderKey.split('@')[0] || m.sender.split('@')[0], teks: truncate(teks, 400), waktu: Date.now(), jenis: 'fitur' })
    ;(await import('../lib/database.js')).saveDB('saran')
    try {
      await m.sock.sendMessage(config.owner.number + '@s.whatsapp.net', {
        text: `🧩 *PERMINTAAN FITUR*\nDari: @${m.sender.split('@')[0]}\n\n${teks}`, mentions: [m.sender]
      })
    } catch { /* owner mungkin blokir bot */ }
    return m.reply(`✅ Permintaan fitur tercatat (#${db.length}).\n\n"${truncate(teks, 200)}"\n\nOwner akan meninjau. Fitur yang disetujui muncul di ${P}changelog.`)
  }, 'tambah fitur download story IG'),

  main('donasilain', ['dukungbot', 'support'], 'Cara lain mendukung pengembangan bot', m => {
    return m.reply(`💝 *DUKUNG PENGEMBANGAN*\n\nSelain donasi (${P}donate), kamu bisa membantu dengan:\n\n*1. Lapor bug*\n${P}laporbug <penjelasan> — makin detail makin cepat diperbaiki\n\n*2. Kasih saran fitur*\n${P}saran <ide kamu>\n\n*3. Ajak teman*\nUndang bot ke grup: ${P}undangbot\n\n*4. Beri bintang repo*\nKalau punya akses kodenya: ${P}sumbercode\n\n*5. Pakai dengan wajar*\nJangan spam — menjaga nomor bot tetap aman\n\nTerima kasih! 🙏`)
  })
]

export const mainlabCmds = [
  ...menuKategoriCmds, ...menuVarianCmds, ...menuBantuanCmds,
  ...menuInfoBotCmds, ...menuLainCmds
]

export default { mainlabCmds }
