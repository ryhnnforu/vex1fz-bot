/**
 * 📂 SUBMENU UTAMA (v7.32.0)
 * ------------------------------------------------------------------
 *  `.menu` menampilkan 10 submenu. Tiap submenu mengeluarkan SEMUA fiturnya
 *  dalam sections yang DIURUTKAN SESUAI KEGUNAAN (terpenting dulu):
 *
 *   👥 menugroup   🎨 menusticker   🕵️ menustalker  🧩 menuinteraktif
 *   🎉 menufun     🎮 menugame      👑 menuowner    🧑‍💻 menudev
 *   💖 donasi      📜 menuall
 *
 *  Khusus menugame: 🖥️ GAME HTML (versi awal → terbaru) · 🌐 GAME WEB
 *  (cerita + dunia) · 💬 GAME TEKS (tebak, kuis, lawan) · 🧠 LAB ·
 *  💵 KASINO TEKS · 🏆 PAPAN SKOR · 🧭 HUB.
 *
 *  Berkas ini juga dipakai .menu klasik, MENU2 (ikon app + daftar isi),
 *  dan MENU3 (daftar kategori) supaya strukturnya SAMA di semua mode.
 */
import { config } from '../config.js'
import { findPlugin, categories } from '../lib/plugins.js'
import { truncate } from '../lib/functions.js'
import { ARCADE_9 } from '../lib/htmlgames15.js'
import { daftarLab } from './gamerespon.js'
import { DAFTAR_ARCADE, DAFTAR_ARCADE2, DAFTAR_ARCADE3, DAFTAR_ARCADE5, DAFTAR_ARCADE6, DAFTAR_ARCADE7, DAFTAR_ARCADE8 } from './arcade.js'
import { DAFTAR_ARCADE_4 } from './arcadebaru.js'
import { DAFTAR_CASINO } from './casinolab.js'
import { DAFTAR_CASINO_RPG } from './casinorpg.js'
import { DAFTAR_JADUL } from './jadullab.js'
import { DAFTAR_PASTEL } from './pastellab.js'
import { DAFTAR_PASTEL_2 } from './pastelbaru.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'THERYHANN!'

/* ===================== perakit baris ===================== */
function plug (cmd) { try { return findPlugin(String(cmd).toLowerCase())?.plugin || null } catch { return null } }
/** baris list dari nama perintah (null bila perintah tidak ada → dilewati) */
export function barisCmd (cmd, ikon = '') {
  const p = plug(cmd)
  if (!p) return null
  const nama = p.command[0]
  const t = `${ikon ? ikon + ' ' : ''}${P}${nama}`
  return { title: truncate(t, 60), description: truncate(p.description || '', 70), id: `${P}${nama}` }
}
const daftarCmd = (cmds, ikon = '') => cmds.map(c => barisCmd(c, ikon)).filter(Boolean)
/** baris dari entri DAFTAR_* game HTML */
const barisGame = g => ({ title: truncate(`${g.icon} ${g.nama}`, 60), description: truncate(g.ket || '', 70), id: `${P}${g.cmd}` })
/** baris game cerita (web) */
const barisCerita = g => ({ title: truncate(`${g.icon} ${g.title}`, 60), description: truncate(`${g.episode} episode · ${g.ket}`, 70), id: `${P}${g.cmd}` })

/** potong section yang terlalu panjang jadi beberapa bagian (maks baris/section) */
function potong (sections, maks = 40) {
  const out = []
  for (const s of sections) {
    const rows = (s.rows || []).filter(Boolean)
    if (!rows.length) continue
    if (rows.length <= maks) { out.push({ title: s.title, rows }); continue }
    const n = Math.ceil(rows.length / maks)
    for (let i = 0; i < n; i++) out.push({ title: `${s.title} (${i + 1}/${n})`, rows: rows.slice(i * maks, (i + 1) * maks) })
  }
  return out
}
/** sisa perintah kategori yang belum ditempatkan eksplisit → section "📌 LAINNYA" */
function sisaKategori (kat, sudahPakai, kecuali = new Set()) {
  const pakai = new Set([...sudahPakai].map(c => String(c).toLowerCase()))
  for (const c of kecuali) pakai.add(String(c).toLowerCase())
  let list = []
  try { list = (categories().get(kat) || []).map(p => p.command[0]) } catch {}
  return list.filter(c => !pakai.has(String(c).toLowerCase())).sort((a, b) => a.localeCompare(b))
}
const kumpulPakai = sections => {
  const s = new Set()
  for (const x of sections) for (const c of (x.cmds || [])) s.add(String(c).toLowerCase())
  return s
}
/** sections final dari definisi [{t, cmds, rows}] + sisa kategori otomatis */
function rakit (defs, katSisa = null, kecualiSisa = new Set()) {
  const sections = defs.map(d => ({ title: d.t, rows: [...(d.rows || []), ...daftarCmd(d.cmds || [], d.ikon || '')].filter(Boolean) }))
  if (katSisa) {
    const sisa = sisaKategori(katSisa, kumpulPakai(defs), kecualiSisa)
    if (sisa.length) sections.push({ title: '📌 LAINNYA', rows: daftarCmd(sisa) })
  }
  return potong(sections)
}

/* ===================== 🎮 MENUGAME ===================== */
const LAB_CMDS = () => new Set(daftarLab().map(g => String(g.cmd).toLowerCase()))
export function sectionsGame () {
  const semuaHtml = [...DAFTAR_ARCADE, ...DAFTAR_ARCADE2, ...DAFTAR_ARCADE3, ...DAFTAR_CASINO, ...DAFTAR_JADUL, ...DAFTAR_PASTEL, ...DAFTAR_ARCADE_4, ...DAFTAR_PASTEL_2, ...DAFTAR_CASINO_RPG, ...DAFTAR_ARCADE5, ...DAFTAR_ARCADE6, ...DAFTAR_ARCADE7, ...DAFTAR_ARCADE8]
  const ditempatkan = new Set([
    ...semuaHtml.map(g => String(g.cmd).toLowerCase()),
    ...ARCADE_9.map(g => String(g.cmd).toLowerCase()),
    'nekopark', 'cacing', 'rumahtua', 'dunia', 'kunciku', 'menugame',
    'slot', 'slotbet', 'slotinfo', 'slotriwayat', 'dadukoin', 'daduinfo', 'kasinoinfo', 'kenoinfo', 'roletinfo', 'aviatorrpg', 'blackjack21', 'hit21', 'stand21', 'double21', 'batal21'
  ])
  /* lab: buang yang sudah ditempatkan di section lain (registry kind = cmd sama) */
  const lab = daftarLab().filter(g => !ditempatkan.has(String(g.cmd).toLowerCase()))
  const defs = [
    { t: '🕹️ GAME HTML · klasik v7.1–v7.3', rows: [...DAFTAR_ARCADE, ...DAFTAR_ARCADE2, ...DAFTAR_ARCADE3].map(barisGame) },
    { t: '🎰 GAME HTML · casino·jadul·pastel v7.4–v7.6', rows: [...DAFTAR_CASINO, ...DAFTAR_JADUL, ...DAFTAR_PASTEL, ...DAFTAR_ARCADE_4, ...DAFTAR_PASTEL_2, ...DAFTAR_CASINO_RPG].map(barisGame) },
    { t: '✨ GAME HTML · rupa asli v7.8–v7.9', rows: [...DAFTAR_ARCADE5, ...DAFTAR_ARCADE6].map(barisGame) },
    { t: '🆕 GAME HTML · baru v7.11–v7.14', rows: [...DAFTAR_ARCADE7.map(barisGame)], cmds: [] },
    { t: '🌐 GAME WEB · cerita ber-episode', rows: ARCADE_9.map(barisCerita), cmds: ['dunia', 'kunciku', 'episode2', 'episode3', 'episode4', 'episode5', 'episode6', 'episode7', 'episode8', 'episode9', 'episode10', 'episode11', 'episode12'] },
    { t: '💬 TEBAK-TEBAKAN', cmds: ['akinator', 'akinstop', 'tebakheroml', 'heroml', 'tebakangka', 'tebakkata', 'tebakemoji', 'tebakbendera', 'tebakhewan', 'tebahewan', 'tebakbuah', 'tebakkotanegara', 'tebaktahun', 'tebakwarna', 'tebakurutan', 'tebakkarakter', 'tebakprofesi', 'tebakmatematika', 'asahotak', 'katarahasia', 'acakkata', 'sambungkata', 'lawankata', 'singkatanapa', 'lengkapiperibahasa', 'family100', 'bocoran'] },
    { t: '🧠 KUIS', cmds: ['kuisacak', 'kuisberuntun', 'hitungcepat', 'kuishitungcepat', 'memoriangka', 'benarsalah', 'gantungman', 'kuisnegara', 'kuisibukota', 'kuisbendera', 'kuisuang', 'kuisbahasa', 'kuisprovinsi', 'kuishewan', 'kuisgunung', 'kuislaut', 'kuismakanan', 'kuissejarah', 'kuisolahraga', 'kuisfilm', 'kuislirik', 'kuisilmu', 'kuisgeografi', 'kuisaritmatika', 'kuispecahan', 'kuisanagram', 'kuiskode', 'kuislogika', 'kuissurah', 'kuisayat', 'kuisnabi', 'kuisasmaul', 'kuissingkatan', 'kuisunsur', 'kuisatom', 'kuisgolongan'] },
    { t: '🎲 LAWAN & KEBERUNTUNGAN', cmds: ['suit', 'tictactoe', 'guntinggrup', 'roletgrup', 'dadudouble', 'dadutiga', 'lemparkoin3', 'pilikartu', 'kocoknama', 'angkahoki2'] },
    { t: '💵 KASINO TEKS · uang RPG', cmds: ['slot', 'slotbet', 'slotinfo', 'slotriwayat', 'daduinfo', 'kasinoinfo', 'kenoinfo', 'roletinfo', 'hit21', 'stand21', 'double21', 'batal21'] },
    { t: '🧠 LAB AI RICH', rows: lab.map(g => ({ title: truncate(`${g.icon} ${g.nama}`, 60), description: truncate(g.ket || '', 70), id: `${P}${g.cmd}` })), cmds: ['airichgamelab', 'airichbantuan', 'airichstatistik', 'airichleaderboard', 'airichtes', 'airichriwayat', 'airichreset', 'gameairich', 'kuisairich', 'suitairich', 'tttairich', 'batalairich', 'batalairichlab', 'mainlagi'] },
    { t: '🏆 PAPAN SKOR', cmds: ['lbmenu', 'lbgame', 'topgame', 'rankgame', 'setorskore', 'topplayer', 'toprpg', 'topfun', 'topkaya', 'toplevel', 'totalchat', 'topguild', 'lblist', 'lbinfo', 'kartuskor', 'skorimg'] },
    { t: '🧭 HUB & DAFTAR', cmds: ['gamerespon', 'gameresponlist', 'gameresponbaru', 'arcade', 'arcade2', 'arcade3', 'arcade4', 'arcade5', 'pastel', 'pastel2', 'casino', 'kasinorpg', 'jadul', 'arcadecerita', 'multiplayer', 'daftargame', 'gamemenu', 'arcadelist', 'arcadelist2', 'arcadelist3', 'arcadelist4', 'casinolist', 'jadullist', 'pastellist', 'pastellist2', 'batalgame', 'batalgamelab'] }
  ]
  /* v7.11–v7.14: nekopark/cacing/rumahtua/bomber sudah termasuk dalam ARCADE7/8 */
  defs[3].rows = [...DAFTAR_ARCADE7, ...DAFTAR_ARCADE8].map(barisGame)
  /* cmd yang sama di dua era (mis. bomber: Neon v7.6 → Grup v7.13) → versi TERBARU menang */
  const lihat = new Set()
  for (let i = 3; i >= 0; i--) defs[i].rows = defs[i].rows.filter(r => { const k = String(r.id).toLowerCase(); if (lihat.has(k)) return false; lihat.add(k); return true })
  const sudah = kumpulPakai(defs)
  /* tandai semua cmd game HTML, lab & web sebagai sudah ditempatkan */
  for (const c of ditempatkan) sudah.add(c)
  for (const c of LAB_CMDS()) sudah.add(c)
  const sections = defs.map(d => ({ title: d.t, rows: [...(d.rows || []), ...daftarCmd(d.cmds || [])].filter(Boolean) }))
  const sisa = sisaKategori('Games', sudah)
  if (sisa.length) sections.push({ title: '📌 LAINNYA', rows: daftarCmd(sisa) })
  return potong(sections)
}

/* ===================== 👥 MENUGROUP ===================== */
export function sectionsGroup () {
  return rakit([
    { t: '⚙️ PENGATURAN', cmds: ['groupmenu', 'settinggrup', 'setgrup', 'group', 'groupinfo', 'gcid', 'setname', 'linkgroup', 'revoke', 'fotogrup', 'deskripsigrup', 'kartugrup', 'open', 'resetgrup', 'addall', 'cekundangan', 'swgc'] },
    { t: '👋 SAMBUTAN', cmds: ['welcome', 'welcomenyalakan', 'welcomematikan', 'goodbye', 'goodbyenyalakan', 'goodbyematikan', 'welcomecard', 'setwelcometext', 'resetwelcometext', 'setwelcomemode', 'settheme', 'setwelcomebg', 'listtheme', 'welcomeinfo', 'previewwelcome', 'previewgoodbye', 'sambutan'] },
    { t: '🛡️ KEAMANAN', cmds: ['antilinkon', 'antilinkoff', 'antitoxicon', 'antitoxicoff', 'antideleteon', 'antideleteoff', 'nsfwon', 'nsfwoff', 'muteon', 'muteoff', 'badword', 'antisticker', 'antimedia', 'jammalam', 'antitagsw', 'antitagswon', 'antitagswoff', 'peringatan', 'warn', 'unwarn', 'cekwarn', 'resetwarnall', 'bungkam', 'bukabungkam', 'listbungkam', 'kick', 'kickme', 'kickall', 'kicksider', 'demoteall'] },
    { t: '📢 TAG & SIARAN', cmds: ['hidetag', 'hidetagmedia', 'tagallcustom', 'tagadmin', 'tagme', 'totag', 'pengumuman', 'cekpengumuman', 'sudahbaca'] },
    { t: '📊 ABSEN & AKTIVITAS', cmds: ['mulaiabsen', 'hadir', 'izin', 'cekabsen', 'selesaiabsen', 'hapusabsen', 'mulaivoting', 'vote', 'cekvote', 'resetvote', 'grupstat', 'hitungaktif', 'sider', 'resetaktif', 'daftarmember', 'carimember', 'cekadmin', 'listadmin', 'totalmember', 'turnamen', 'kuisgrup', 'statgrupv9', 'setaturan', 'aturangrup', 'setaturansingkat', 'catatan', 'cn', 'listreminder', 'hapusreminder', 'pilihadmin', 'autoreply'] }
  ], 'Group Menu')
}

/* ===================== 🎨 MENUSTICKER ===================== */
export function sectionsSticker () {
  return rakit([
    { t: '🌟 BUAT STIKER', cmds: ['s', 'setwm', 'wm', 'stickertext', 'stikerlama', 'topng', 'tojpg', 'towebp', 'attp', 'stikeracak'] },
    { t: '🟩 BRAT & TEKS', cmds: ['brat', 'bratvid', 'stikernama', 'stikerkutipan', 'stikerperingatan', 'stikerucapan', 'stikerteksatas', 'ttpneon', 'ttpgradasi', 'ttpoutline', 'ttprainbow', 'ttpkotak', 'ttpbulat', 'ttpbayangan', 'ttpbesar', 'ttpkecil', 'ttpstrip', 'stikerhari', 'stikerjam'] },
    { t: '🖼️ MEME & CHAT PALSU', cmds: ['smeme', 'stikermeme', 'tohitam', 'fakechat', 'fakegroup', 'igqc', 'qc', 'iqc'] },
    { t: '🎨 AI STYLE', cmds: ['toanime', 'toputih', 'tozombie', 'toghibli', 'tofigure', 'tocartoon', 'tolego', 'tochibi', 'tosketsa', 'topixel'] },
    { t: '✨ EFEK CEPAT', cmds: ['skartun', 'sneon', 'ssepia', 'spixel', 'sbingkai', 'sbulatbingkai', 'sdingin', 'shangat', 'svignette', 'scermin4', 'sblur', 'sbright', 'scircle', 'scontrast', 'sflip', 'sflipv', 'sgaussian', 'sgray', 'sinvert', 'sopacity', 'sposter', 'srotate'] },
    { t: '🖌️ EFEK LENGKAP', cmds: ['stikersepia', 'stikerpixelate', 'stikerthreshold', 'stikerduotone', 'stikerborder', 'stikerrounded', 'stikervignette', 'stikerwarm', 'stikercool', 'stikerjadul', 'stikerhue', 'stikersaturasi', 'stikerdesaturasi', 'stikerresize', 'stikerkompres', 'stikerpersegi', 'stikerwatermark', 'stikercrop', 'stikerkaleidoskop', 'stikerlatarputih', 'stikerupscale', 'stikerdownscale'] },
    { t: '🔧 INFO', cmds: ['infostiker', 'infoimg', 'tobase64img', 'warnadominan'] }
  ], 'Sticker Menu')
}

/* ===================== 🕵️ MENUSTALKER ===================== */
export function sectionsStalker () {
  return rakit([
    { t: '📱 SOSIAL MEDIA', cmds: ['igstalk', 'tiktokstalk', 'ytstalk', 'fbstalk', 'threadsstalk', 'pinstalk', 'telestalk', 'spotifystalk'] },
    { t: '🎮 GAME', cmds: ['robloxstalk', 'steamstalk', 'mcstalk', 'chessstalk'] },
    { t: '💻 DEVELOPER', cmds: ['githubstalk', 'npmstalk'] }
  ])
}

/* ===================== 🧩 MENUINTERAKTIF ===================== */
export function sectionsInteraktif () {
  return rakit([
    { t: '🎮 HUB GAME HTML', cmds: ['gamerespon', 'gameresponlist', 'arcade', 'arcade2', 'arcade3', 'arcade4', 'arcade5', 'pastel', 'pastel2', 'casino', 'kasinorpg', 'jadul', 'arcadecerita', 'multiplayer'] },
    { t: '🎧 MUSIK & VIDEO', cmds: ['play', 'play2', 'play3', 'playvid', 'ytrich', 'richmusic', 'spotifylive', 'spotifyvibe', 'liriklagu3', 'playlists'] },
    { t: '🪪 KARTU HTML', cmds: ['profile', 'premcard', 'welcome', 'menuapp', 'menu2', 'menu3', 'ping2', 'qris', 'lbmenu'] },
    { t: '😈 PRANK', cmds: ['hack'] },
    { t: '🏆 RANK & KASINO', cmds: ['lbgame', 'slot', 'topplayer', 'topgame'] }
  ])
}

/* ===================== 🎉 MENUFUN ===================== */
export function sectionsFun () {
  return rakit([
    { t: '🔮 RAMALAN', cmds: ['zodiac', 'artinama', 'umurmental', 'ramalnasib', 'haribaik', 'nomercantik', 'ramalancinta', 'tanyadukun', 'cekhoki', 'mantra', 'tebakusia', 'siapayang', 'siapakah', 'tebakwajah', 'umurcek'] },
    { t: '💘 JODOH', cmds: ['jodoh', 'ship', 'kapalcinta', 'hitungkecocokan', 'cocoknama', 'cantikcek', 'cekromantis', 'cekgalau'] },
    { t: '✅ CEK DIRI', cmds: ['cekimut', 'cekcool', 'cekberuntung', 'cekrajin', 'ceklaper', 'cekngantuk', 'cekpintar', 'cekjagoan', 'cekwibu', 'cekfemboy', 'ceksabar', 'cekdermawan', 'cekegois', 'cekcerewet'] },
    { t: '😂 HUMOR', cmds: ['jokesbapak', 'tebakkonyol', 'receh', 'pantun', 'pantunlucu', 'gombal', 'katagombal2', 'rayuanmakan', 'sindiranhalus', 'kalimatbucin', 'gombalkode', 'julukan', 'kutukan', 'hukuman', 'tebak', 'howgay', 'howlist', 'truth'] },
    { t: '🎲 MAIN & ACAK', cmds: ['apakah', 'bagaimana', 'bisakah', 'kapankah', 'coinflip', 'dadu', 'luckynumber', 'pick', 'rate', 'roletkeputusan', 'acakteman', 'moodhari', 'generatoralasan', 'generatornama', 'generatorcaption', 'generatoride', 'kapsulkata', 'bukakapsul'] },
    { t: '✍️ TEKS UNIK', cmds: ['wallpaper', 'zalgo', 'bubbletext', 'smallcaps', 'fullwidth', 'coretteks', 'garisbawah', 'superscript', 'mirrorteks'] },
    { t: '💬 QUOTES & FAKTA', cmds: ['quote', 'katabijak', 'motivasi', 'fakta', 'faktaaneh', 'pepatahlama', 'quotesinggris', 'ucapanbagus'] }
  ], 'Fun Menu')
}

/* ===================== 👑 MENUOWNER ===================== */
const DEV_CMDS = new Set(['devmenu', '>_', 'addplugin', 'getcode', 'cekplugin', 'plugin', 'pluginrinci', 'pluginberkas', 'plugindev', 'hapusplugindev', 'restoreplugin', 'reloadfitur', 'hapusfitur', 'matikanfitur', 'nyalakanfitur', 'fiturmati', 'carifitur', 'kategorigraf', 'aliascek', '>', '$', 'jalankanperintah', 'bacafile', 'listfolder', 'restart', 'restartsafe', 'matikanbot'])
export function sectionsOwner () {
  return rakit([
    { t: '📢 BROADCAST', cmds: ['bc', 'bcteks', 'bcgrup', 'bcprivat', 'bcgambar', 'bcdokumen', 'bctombol', 'bctunda', 'bcpremium', 'bcaktif', 'upswgc2'] },
    { t: '💎 PREMIUM & USER', cmds: ['premlist', 'premdetail', 'userinfo', 'userdetail', 'setcashuser', 'addmoney', 'setmoney', 'setkoin', 'addlevel', 'setlevel', 'addxp', 'setlevelrpg', 'ban', 'bantemp', 'banlist', 'resetuser', 'resetsemualimit', 'resetsemuauser', 'resetlimit', 'resetdatarpg'] },
    { t: '👥 GRUP & SEWA', cmds: ['sewabot', 'grupdetail'] },
    { t: '⚙️ PENGATURAN', cmds: ['settinglist', 'setnamabot', 'setfooter', 'settemamenu', 'setmodemenu', 'setmenuimg', 'setprefix', 'setlimitdefault', 'setcooldown', 'setmodelai', 'setapikey', 'setaikey', 'typingon', 'typingoff', 'readon', 'readoff', 'anticallon', 'anticalloff', 'autobioon', 'autobiooff', 'public', 'cmdmode', 'kuncifitur', 'pesanpembuka', 'set', 'setmenu1', 'setmenu2', 'setmenu3', 'setmenu4', 'buatmenu', 'simpanmenu', 'hapusmenu', 'setppbot', 'setwebgame'] },
    { t: '🗄️ DATABASE', cmds: ['dbsize', 'dbstat', 'ekspordb', 'impordb', 'backupdb', 'listbackup', 'restorebackup', 'hapusbackup', 'logbot', 'bersihkantmp2', 'cleartmp', 'kirimfile'] },
    { t: '📊 PANTAU', cmds: ['statistikpenuh', 'totalchat', 'lbreset', 'aistatus', 'kesehatanbot', 'monitorcpu', 'sesiinfo', 'hapussesi', 'cekapi', 'cekdependensi', 'pluginhealth'] }
  ], 'Owner Menu', DEV_CMDS)
}

/* ===================== 🧑‍💻 MENUDEV ===================== */
export function sectionsDev () {
  return rakit([
    { t: '🧩 PLUGIN', cmds: ['devmenu', '>_', 'addplugin', 'getcode', 'cekplugin', 'plugin', 'pluginrinci', 'pluginberkas', 'plugindev', 'hapusplugindev', 'restoreplugin', 'reloadfitur', 'hapusfitur', 'matikanfitur', 'nyalakanfitur', 'fiturmati', 'carifitur', 'kategorigraf', 'aliascek'] },
    { t: '💻 KODE & MESIN', cmds: ['>', '$', 'jalankanperintah', 'bacafile', 'listfolder', 'restart', 'restartsafe', 'matikanbot'] }
  ])
}

/* ===================== meta 10 submenu ===================== */
export const SUBMENU_BUILDER = { menugame: sectionsGame, menugroup: sectionsGroup, menusticker: sectionsSticker, menustalker: sectionsStalker, menuinteraktif: sectionsInteraktif, menufun: sectionsFun, menuowner: sectionsOwner, menudev: sectionsDev }
export const SUBMENU_META = [
  { id: 'menugroup', icon: '👥', nama: 'Group', desc: 'pengaturan, sambutan, keamanan, absen & aktivitas grup' },
  { id: 'menusticker', icon: '🎨', nama: 'Sticker', desc: 'buat stiker, brat, meme, AI style & 40+ efek' },
  { id: 'menustalker', icon: '🕵️', nama: 'Stalker', desc: 'intip profil sosmed, game & developer' },
  { id: 'menuinteraktif', icon: '🧩', nama: 'Interaktif', desc: 'hub HTML: game, musik, kartu, prank, rank' },
  { id: 'menufun', icon: '🎉', nama: 'Fun', desc: 'ramalan, jodoh, humor, tebak & teks unik' },
  { id: 'menugame', icon: '🎮', nama: 'Game', desc: 'HTML (awal→baru), web cerita, teks, lab & papan skor' },
  { id: 'menuowner', icon: '👑', nama: 'Owner', desc: 'broadcast, user, pengaturan, database (owner)', owner: true },
  { id: 'menudev', icon: '🧑‍💻', nama: 'Dev', desc: 'plugin, kode & mesin bot (owner)', owner: true },
  { id: 'donasi', icon: '💖', nama: 'Donasi', desc: 'dukung bot via QRIS / sewa / premium' },
  { id: 'menuall', icon: '📜', nama: 'Semua', desc: 'tampilkan SEMUA perintah bot sekaligus' }
]
export const jumlahSubmenu = id => { try { return (SUBMENU_BUILDER[id]?.() || []).reduce((a, s) => a + s.rows.length, 0) } catch { return 0 } }

/** item menu2 untuk 1 submenu: header section (SEC:) + baris perintah */
export function itemsSubmenu (id) {
  const out = []
  for (const s of (SUBMENU_BUILDER[id]?.() || [])) {
    out.push({ icon: '📌', title: s.title, desc: `${s.rows.length} perintah`, cmd: 'SEC:' + s.title })
    for (const r of s.rows) {
      const cmd = String(r.id || '').replace(/^\./, '')
      out.push({ icon: (r.title.match(/^(\p{Extended_Pictographic}\S*)/u) || [])[1] || '▸', title: r.title.replace(/^(\p{Extended_Pictographic}\S*\s*)/u, ''), desc: r.description || '', cmd: r.id })
    }
  }
  return out
}

/* ===================== plugin ===================== */
const kirimSubmenu = (judul, emoji, sections, ket) => async m => {
  const total = sections.reduce((a, s) => a + s.rows.length, 0)
  const text = `${emoji} *${judul} — ${total} fitur*\n${ket}\n\nPilih untuk langsung menjalankan:`
  try {
    await m.sendList({ title: `${emoji} ${judul}`, text, footer: brand(), buttonText: `${emoji} ${judul}`, sections })
  } catch {
    await m.reply(`*${emoji} ${judul} (${total})*\n\n` + sections.map(s => `*${s.title}*\n` + s.rows.map(r => `▸ ${r.id}`).join('\n')).join('\n\n'))
  }
  return { handled: true }
}

export const menugame = {
  command: ['menugame', 'gamemenu2', 'menugamelengkap'],
  category: 'Games',
  description: '🎮 SEMUA game berurutan: HTML (versi awal→terbaru) · web cerita · teks · lab · kasino · papan skor',
  limit: 0,
  run: async m => kirimSubmenu('MENU GAME', '🎮', sectionsGame(), 'HTML diurutkan dari versi awal sampai terbaru · web = cerita ber-episode + Dunia Voxel · teks = tebak, kuis & lawan kata.')(m)
}

export const menustalker = {
  command: ['menustalker', 'stalkermenu', 'menustalk'],
  category: 'Internet',
  description: '🕵️ Semua stalker berurutan: sosmed · game · developer',
  limit: 0,
  run: async m => kirimSubmenu('MENU STALKER', '🕵️', sectionsStalker(), 'Intip profil publik: ketik perintah + username, mis. `.igstalk cristiano`.')(m)
}

export const menudev = {
  command: ['menudev', 'devmenu2', 'menutoolsdev'],
  category: 'Owner Menu',
  description: '🧑‍💻 Menu developer: plugin, kode & mesin bot (owner)',
  owner: true, limit: 0,
  run: async m => kirimSubmenu('MENU DEV', '🧑‍💻', sectionsDev(), 'Perkakas developer & owner: kelola plugin, eksekusi kode, atur mesin.')(m)
}

export default { menugame, menustalker, menudev, sectionsGame, sectionsGroup, sectionsSticker, sectionsStalker, sectionsInteraktif, sectionsFun, sectionsOwner, sectionsDev, SUBMENU_META, jumlahSubmenu, itemsSubmenu, barisCmd }
