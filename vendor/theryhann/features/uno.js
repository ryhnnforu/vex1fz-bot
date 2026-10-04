/**
 * 🃏 UNO MULTIPLAYER — SATU FILE MANDIRI (v7.37.0)
 * ------------------------------------------------------------------
 *  UNO 2-8 pemain ANTAR MEMBER GRUP lewat giliran di chat.
 *  Webview kartu HTML tidak bisa mengirim pesan balik ke bot, jadi
 *  multiplayer sungguhan hanya bisa lewat chat (pola sama dgn .tarung).
 *
 *  Mesin logika UNO (lib/uno.js) ikut disertakan di file ini supaya bisa
 *  dipasang sekali jalan lewat .>_ — tidak perlu file tambahan.
 *
 *  Perintah:
 *   .uno @user @user …  — buat meja & undang pemain (2-8 orang)
 *   .unoikut            — pemain yang diundang masuk meja
 *   .unomulai           — host memulai setelah minimal 2 pemain
 *   .unokartu           — lihat kartu di tangan + kartu yang bisa dimainkan
 *   .unomain <n> [warna]— mainkan kartu ke-n (contoh: .unomain 3 merah)
 *   .unoambil           — ambil kartu (menanggung hukuman jika ada)
 *   .unoskip            — lewatkan giliran (hanya jika tidak bisa main)
 *   .unowarna <warna>   — pilih warna setelah Wild
 *   .unostatus          — papan permainan
 *   .unokeluar/.unobubar— keluar / bubarkan meja
 *
 *  Sesi disimpan di lib/gamestore.js (unoSessions) — WAJIB di sana karena
 *  loader fitur memuat features/ dengan cache-buster, sehingga Map di dalam
 *  file fitur tidak terlihat oleh instance lain. Kalau gamestore belum punya
 *  `unoSessions`, file ini membuatnya di sana saat pertama kali dimuat.
 */
import { config } from '../config.js'
import * as gamestore from '../lib/gamestore.js'

/* Map sesi bersama — pakai milik gamestore, buat kalau belum ada */
const unoSessions = gamestore.unoSessions || (gamestore.unoSessions = new Map())


const WARNA_UNO = ['merah', 'kuning', 'hijau', 'biru']
const EMOJI_WARNA = { merah: '🟥', kuning: '🟨', hijau: '🟩', biru: '🟦' }
const WARNA_ACAK = 'hitam'

/** id kartu → tampilan singkat */
const LABEL_AKSI = {
  skip: '⛔ Skip', reverse: '🔄 Reverse', draw2: '➕2 Draw Two',
  wild: '🌈 Wild', wild4: '🌈➕4 Wild Draw Four'
}

/* ================================================================== */
/*  Dek & pengocokan                                                   */
/* ================================================================== */

/** Bangun 108 kartu UNO. `rnd` opsional agar bisa diuji deterministik. */
function buatDek (rnd = Math.random) {
  const dek = []
  let id = 0
  for (const warna of WARNA_UNO) {
    dek.push({ id: id++, warna, nilai: '0', aksi: null })
    for (let n = 1; n <= 9; n++) {
      dek.push({ id: id++, warna, nilai: String(n), aksi: null })
      dek.push({ id: id++, warna, nilai: String(n), aksi: null })
    }
    for (const aksi of ['skip', 'reverse', 'draw2']) {
      dek.push({ id: id++, warna, nilai: aksi, aksi })
      dek.push({ id: id++, warna, nilai: aksi, aksi })
    }
  }
  for (let i = 0; i < 4; i++) dek.push({ id: id++, warna: WARNA_ACAK, nilai: 'wild', aksi: 'wild' })
  for (let i = 0; i < 4; i++) dek.push({ id: id++, warna: WARNA_ACAK, nilai: 'wild4', aksi: 'wild4' })
  return dek
}

/** Fisher-Yates memakai `rnd` yang bisa disuntik. */
function kocok (arr, rnd = Math.random) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Bagi kartu awal.
 * @returns {{tumpukan:Array, buangan:Array, tangan:Object, warnaAktif:string}}
 */
function mulaiPermainan (daftarJid, rnd = Math.random, jumlahAwal = 7) {
  const dek = kocok(buatDek(rnd), rnd)
  const tangan = {}
  for (const jid of daftarJid) tangan[jid] = []
  for (let i = 0; i < jumlahAwal; i++) {
    for (const jid of daftarJid) tangan[jid].push(dek.pop())
  }
  /* kartu buangan pertama tidak boleh Wild atau Wild Four */
  let awal = dek.pop()
  while (awal.aksi === 'wild' || awal.aksi === 'wild4') {
    dek.unshift(awal)
    const dekKocok = kocok(dek, rnd)
    dek.length = 0
    dek.push(...dekKocok)
    awal = dek.pop()
  }
  return {
    tumpukan: dek,
    buangan: [awal],
    tangan,
    warnaAktif: awal.warna
  }
}

/* ================================================================== */
/*  Pengecekan kartu                                                    */
/* ================================================================== */

/** Kartu atas tumpukan buangan. */
function kartuAtas (s) {
  return s.buangan[s.buangan.length - 1] || null
}

/**
 * Bolehkah `kartu` dimainkan di atas `atas` dengan `warnaAktif`?
 * Wild selalu boleh. Selain itu warna cocok ATAU nilai cocok.
 */
function bolehMain (kartu, atas, warnaAktif) {
  if (!kartu || !atas) return false
  if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') return true
  if (kartu.warna === warnaAktif) return true
  return kartu.nilai === atas.nilai
}

/** Kartu yang bisa dimainkan seorang pemain. */
function kartuBisa (s, jid) {
  const atas = kartuAtas(s)
  return (s.tangan[jid] || []).filter(k => bolehMain(k, atas, s.warnaAktif))
}

/** Pemain tidak punya kartu yang cocok. */
function harusAmbil (s, jid) {
  return kartuBisa(s, jid).length === 0
}

/* ================================================================== */
/*  Urutan giliran                                                      */
/* ================================================================== */

/** Giliran berikutnya setelah `idx`, mengikuti `arah` (1 = searah jarum jam). */
function berikut (urutan, idx, arah = 1, lompat = 0) {
  const n = urutan.length
  if (n === 0) return 0
  return ((idx + arah * (1 + lompat)) % n + n * 2) % n
}

/* ================================================================== */
/*  Aksi permainan                                                      */
/* ================================================================== */

/**
 * Ambil kartu dari tumpukan; jika habis, buangan (kecuali kartu atas)
 * diacak ulang jadi tumpukan baru.
 * @returns {{tumpukan:Array, buangan:Array, diambil:Array, dikocokUlang:boolean}}
 */
function ambilKartu (s, jumlah = 1, rnd = Math.random) {
  let tumpukan = s.tumpukan.slice()
  let buangan = s.buangan.slice()
  let dikocokUlang = false
  const diambil = []
  for (let i = 0; i < jumlah; i++) {
    if (tumpukan.length === 0) {
      if (buangan.length <= 1) break          // tidak ada yang bisa diacak
      const atas = buangan.pop()
      tumpukan = kocok(buangan, rnd)
      buangan = [atas]
      dikocokUlang = true
    }
    const k = tumpukan.pop()
    if (k) diambil.push(k)
  }
  return { tumpukan, buangan, diambil, dikocokUlang }
}

/**
 * Mainkan satu kartu.
 * @param {object} s     keadaan {tumpukan,buangan,tangan,warnaAktif,urutan,idx,arah,hukuman}
 * @param {string} jid   pemain yang bermain
 * @param {number} kartuId id kartu yang dimainkan
 * @param {object} opt   {pilihWarna, bilangUno}
 * @returns {object} {ok, sebab, state, pesan}
 */
function mainkanKartu (s, jid, kartuId, opt = {}, rnd = Math.random) {
  const tangan = (s.tangan[jid] || []).slice()
  const idxKartu = tangan.findIndex(k => k.id === kartuId)
  if (idxKartu < 0) return { ok: false, sebab: 'kartu-tidak-dimiliki', state: s, pesan: 'Kartu itu tidak ada di tanganmu.' }

  const kartu = tangan[idxKartu]
  const atas = kartuAtas(s)
  if (!bolehMain(kartu, atas, s.warnaAktif)) {
    return { ok: false, sebab: 'tidak-cocok', state: s, pesan: `Kartu itu tidak cocok dengan ${labelKartu(atas)}.` }
  }
  if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') {
    if (!WARNA_UNO.includes(opt.pilihWarna)) {
      return { ok: false, sebab: 'warna-wajib', state: s, pesan: 'Sebutkan warna pilihan (merah/kuning/hijau/biru).' }
    }
  }

  tangan.splice(idxKartu, 1)
  const buangan = s.buangan.concat([kartu])
  const state = {
    ...s,
    tangan: { ...s.tangan, [jid]: tangan },
    buangan,
    warnaAktif: (kartu.aksi === 'wild' || kartu.aksi === 'wild4') ? opt.pilihWarna : kartu.warna,
    hukuman: s.hukuman || 0,
    log: []
  }

  const n = s.urutan.length
  const pesan = []
  let lompat = 0
  let arah = s.arah

  if (kartu.aksi === 'skip') {
    lompat = 1
    pesan.push('⛔ Giliran pemain berikutnya dilewati!')
  } else if (kartu.aksi === 'reverse') {
    arah = -arah
    /* dua pemain: reverse behaves like skip */
    if (n === 2) { lompat = 1; pesan.push('🔄 Arah dibalik — dengan 2 pemain ini sama dengan Skip!') } else { pesan.push('🔄 Arah permainan dibalik!') }
  } else if (kartu.aksi === 'draw2') {
    state.hukuman = (s.hukuman || 0) + 2
    lompat = 1
    pesan.push(`➕2 Hukuman jadi *${state.hukuman} kartu* dan giliran dilewati!`)
  } else if (kartu.aksi === 'wild4') {
    state.hukuman = (s.hukuman || 0) + 4
    lompat = 1
    pesan.push(`🌈➕4 Warna jadi *${opt.pilihWarna}* ${EMOJI_WARNA[opt.pilihWarna]}, hukuman *${state.hukuman} kartu*!`)
  } else if (kartu.aksi === 'wild') {
    pesan.push(`🌈 Warna dipilih: *${opt.pilihWarna}* ${EMOJI_WARNA[opt.pilihWarna]}`)
  }

  /* UNO! — sisa 1 kartu harus dibilang; lupa = denda 2 kartu */
  if (tangan.length === 1) {
    if (opt.bilangUno) {
      state.unoDibilang = { ...(s.unoDibilang || {}), [jid]: true }
      pesan.push('🃏 *UNO!* Tinggal satu kartu!')
    } else {
      state.unoDibilang = { ...(s.unoDibilang || {}), [jid]: false }
      pesan.push('⚠️ Kamu lupa bilang UNO! Ambil 2 kartu hukuman.')
      const ambil = ambilKartu(state, 2, rnd)
      state.tumpukan = ambil.tumpukan
      state.buangan = ambil.buangan
      state.tangan = { ...state.tangan, [jid]: state.tangan[jid].concat(ambil.diambil) }
      pesan.push(`📥 +${ambil.diambil.length} kartu (tumpukan${ambil.dikocokUlang ? ' baru diacak' : ''}).`)
    }
  } else if (tangan.length === 0) {
    state.pemenang = jid
    pesan.push('🏆 Kartu habis — *UNO!*')
  }

  /* Permainan selesai: hukuman yang belum sempat ditanggung siapa pun
     dibatalkan — kalau tidak, `hukuman` menggantung selamanya dan papan
     tetap menulis "hukuman menumpuk" setelah ada pemenang. */
  if (state.pemenang) {
    if (state.hukuman > 0) pesan.push(`💥 Hukuman ${state.hukuman} kartu dibatalkan karena permainan selesai.`)
    state.hukuman = 0
  }

  state.arah = arah
  state.idx = n > 0 ? berikut(s.urutan, s.idx, arah, lompat) : s.idx
  state.log = pesan
  return { ok: true, sebab: null, state, pesan }
}

/**
 * Ambil kartu karena tidak bisa main (atau sengaja).
 * Kalau hukuman menumpuk, pemain menanggung semuanya lalu gilirannya lewat.
 */
function ambilGiliran (s, jid, opt = {}, rnd = Math.random) {
  const beban = opt.paksaAmbil || Math.max(1, s.hukuman || 1)
  const ambil = ambilKartu(s, beban, rnd)
  if (ambil.diambil.length === 0) {
    return { ok: false, sebab: 'tumpukan-habis', state: s, pesan: 'Tumpukan sudah habis, tidak ada kartu untuk diambil.' }
  }
  const tangan = (s.tangan[jid] || []).concat(ambil.diambil)
  const state = {
    ...s,
    tangan: { ...s.tangan, [jid]: tangan },
    tumpukan: ambil.tumpukan,
    buangan: ambil.buangan,
    hukuman: 0,
    idx: berikut(s.urutan, s.idx, s.arah, 0),
    log: []
  }
  const pesan = [`📥 Kamu ambil *${ambil.diambil.length} kartu*${ambil.dikocokUlang ? ' (tumpukan diacak ulang)' : ''}.`]
  /* setelah ambil, giliran lewat — kecuali pemain mau & bisa langsung main */
  if (!opt.lanjutMain) {
    pesan.push('Giliran berpindah.')
  }
  state.log = pesan
  return { ok: true, sebab: null, state, pesan }
}

/** Tuduh pemain lain lupa bilang UNO (opsional, ala UNO asli). */
function tuduhUno (s, penuduh, tertuduh) {
  if (!penuduh || !tertuduh) return { ok: false, sebab: 'argumen', pesan: 'Sebutkan siapa yang dituduh.' }
  if ((s.tangan[tertuduh] || []).length !== 1) {
    return { ok: false, sebab: 'bukan-uno', pesan: 'Dia belum punya satu kartu.' }
  }
  const bilang = s.unoDibilang && s.unoDibilang[tertuduh]
  if (bilang) return { ok: false, sebab: 'sudah-bilang', pesan: 'Dia sudah bilang UNO. Tuduhan gagal!' }
  return { ok: true, sebab: null, pesan: 'Dia lupa bilang UNO — kena denda!' }
}

/* ================================================================== */
/*  Tampilan kartu                                                      */
/* ================================================================== */

/** "🟥 7" / "🟦 ⛔ Skip" / "🌈➕4" */
function labelKartu (k) {
  if (!k) return '—'
  if (k.aksi === 'wild') return '🌈 Wild'
  if (k.aksi === 'wild4') return '🌈➕4 Wild Draw Four'
  const e = EMOJI_WARNA[k.warna] || '⬛'
  if (k.aksi) return `${e} ${LABEL_AKSI[k.aksi] || k.aksi}`
  return `${e} ${k.nilai}`
}

/** Baris kartu pendek untuk papan. */
function barisKartu (kartuList, maks = 12) {
  if (!kartuList || kartuList.length === 0) return '(kosong)'
  const tampil = kartuList.slice(0, maks).map(labelKartu).join('  ')
  return kartuList.length > maks ? `${tampil}  … +${kartuList.length - maks}` : tampil
}


/* ================= PLUGIN CHAT ================= */

const P = config.display.prefix
const brand = () => config.bot?.name || 'THERYHANN!'

const TTL_MEJA = 10 * 60 * 1000      // meja kosong kedaluwarsa 10 menit
const TTL_GILIRAN = 90 * 1000        // 90 detik untuk berpikir
const MAKS_PEMAIN = 8
const MIN_PEMAIN = 2

/* ================================================================== */
/*  Pembantu                                                            */
/* ================================================================== */

const key = m => m.jid
const namaDari = jid => String(jid || '').split('@')[0]
const nama = (m, jid) => {
  if (jid === (m.senderKey || m.sender)) return m.pushName || 'Kamu'
  return namaDari(jid)
}
const sebut = (m, jid) => `@${namaDari(jid)}`

/** sesi meja yang masih hidup */
function meja (m) {
  const s = unoSessions.get(key(m))
  if (!s) return null
  if (Date.now() > s.kadaluarsa) { unoSessions.delete(key(m)); return null }
  return s
}
function simpan (m, s) {
  s.kadaluarsa = Date.now() + (s.mulai ? TTL_GILIRAN : TTL_MEJA)
  unoSessions.set(key(m), s)
}
/** indeks pemain yang sedang giliran */
const idxAktif = s => s.urutan.indexOf(s.giliran)

function mejaBelumMulai (m) {
  const s = meja(m)
  if (!s) return `Belum ada meja UNO di sini.\nBuat dengan ${P}uno @teman1 @teman2 (2-${MAKS_PEMAIN} pemain).`
  if (s.mulai) return `Permainan sudah berjalan. Pakai ${P}unostatus untuk melihat papan.`
  return null
}

/* ================================================================== */
/*  Papan                                                               */
/* ================================================================== */

function papan (m, s, catatan = []) {
  const atas = kartuAtas(s)
  const baris = []
  baris.push(`🃏 *UNO* — ${brand()}`)
  baris.push('')
  baris.push(`🎴 Kartu atas: *${labelKartu(atas)}*`)
  baris.push(`🎨 Warna aktif: *${s.warnaAktif}* ${EMOJI_WARNA[s.warnaAktif] || '⬛'}  ·  Arah: ${s.arah === 1 ? '↻ searah jarum jam' : '↺ berlawanan'}  ·  Sisa tumpukan: ${s.tumpukan.length}`)
  if (s.hukuman > 0) baris.push(`💥 Hukuman menumpuk: *${s.hukuman} kartu*`)
  baris.push('')
  for (const jid of s.urutan) {
    const n = (s.tangan[jid] || []).length
    const ikon = jid === s.giliran ? '👉' : '  '
    const uno = n === 1 ? ' 🃏*UNO!*' : ''
    baris.push(`${ikon} ${sebut(m, jid)} — ${n} kartu${uno}`)
  }
  baris.push('')
  baris.push(`🎯 Giliran: *${nama(m, s.giliran)}*`)
  baris.push(`${P}unokartu · ${P}unomain <n> [warna] · ${P}unoambil · ${P}unoskip · ${P}unowarna <warna>`)
  if (catatan && catatan.length) baris.push('\n' + catatan.join('\n'))
  return baris.join('\n')
}

async function kirim (m, teks) {
  try {
    await m.sock.sendMessage(m.jid, {
      text: teks,
      mentions: (teks.match(/@\d+/g) || []).map(x => x.slice(1) + '@s.whatsapp.net')
    })
  } catch { await m.reply(teks) }
}

/* ================================================================== */
/*  .uno — buat meja                                                    */
/* ================================================================== */
export const uno = {
  command: ['uno', 'unogame', 'mainuno', 'unocard', 'kartuuno', 'unomulti', 'unomultiplayer'],
  category: 'Games',
  description: `🃏 UNO multiplayer 2-${MAKS_PEMAIN} pemain antar member grup: ${P}uno @teman (buat meja) → ${P}unoikut → ${P}unomulai → ${P}unomain <n> [warna]`,
  limit: 0,
  cooldown: 3,
  contoh: `${P}uno @628123 @628456`,
  run: async m => {
    const ada = meja(m)
    if (ada) {
      if (ada.mulai) return kirim(m, `Permainan UNO sedang berjalan.\n${papan(m, ada)}`)
      return kirim(m, `Meja UNO sudah ada (belum mulai).\n${papan(m, ada)}\n\nUndang lagi dengan ${P}uno @teman, atau mulai dengan ${P}unomulai.`)
    }
    const host = m.senderKey || m.sender
    /* serializer menamai field ini `mentionJid` (bukan `mentionedJid`) —
       lihat lib/serializer.js:192; semua plugin lain memakai nama itu. */
    const diundang = (m.mentionJid || m.mentionedJid || []).filter(j => j !== host)
    const s = {
      host,
      pemain: [host],
      urutan: [host],
      tangan: { [host]: [] },
      mulai: false,
      arah: 1,
      giliran: host,
      hukuman: 0,
      tumpukan: [],
      buangan: [],
      warnaAktif: null,
      dibuat: Date.now()
    }
    for (const j of diundang) {
      if (!s.pemain.includes(j) && s.pemain.length < MAKS_PEMAIN) {
        s.pemain.push(j); s.urutan.push(j); s.tangan[j] = []
      }
    }
    simpan(m, s)
    const teks =
      `🃏 *UNO* — meja dibuat oleh *${nama(m, host)}*\n\n` +
      `Pemain saat ini (${s.pemain.length}/${MAKS_PEMAIN}):\n` +
      s.pemain.map(j => `▸ ${sebut(m, j)}${j === host ? ' *(host)*' : ''}`).join('\n') +
      `\n\nYang diundang, masuk dengan ${P}unoikut\n` +
      `Yang lain boleh ikut selama belum mulai.\n` +
      `Host mulai dengan ${P}unomulai (minimal ${MIN_PEMAIN} pemain)`
    return kirim(m, teks)
  }
}

/* ================================================================== */
/*  .unoikut / .unokeluar                                               */
/* ================================================================== */
export const unoIkut = {
  command: ['unoikut', 'unojoin', 'unomasuk', 'joinuno'],
  category: 'Games',
  description: '🃏 Masuk ke meja UNO yang sedang menunggu pemain',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const galat = mejaBelumMulai(m)
    if (galat) return kirim(m, galat)
    const s = meja(m)
    const jid = m.senderKey || m.sender
    if (s.pemain.includes(jid)) return kirim(m, 'Kamu sudah di meja ini.')
    if (s.pemain.length >= MAKS_PEMAIN) return kirim(m, `Meja penuh (maksimal ${MAKS_PEMAIN} pemain).`)
    s.pemain.push(jid); s.urutan.push(jid); s.tangan[jid] = []
    simpan(m, s)
    return kirim(m,
      `✅ *${nama(m, jid)}* masuk meja UNO (${s.pemain.length}/${MAKS_PEMAIN}).\n` +
      (s.pemain.length >= MIN_PEMAIN
        ? `Host ${sebut(m, s.host)} bisa mulai dengan ${P}unomulai.`
        : `Butuh minimal ${MIN_PEMAIN} pemain untuk mulai.`))
  }
}

export const unoKeluar = {
  command: ['unokeluar', 'unoleave', 'unoexit', 'keluaruno'],
  category: 'Games',
  description: '🃏 Keluar dari meja UNO (bubarkan meja kalau kamu host)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s) return kirim(m, 'Tidak ada meja UNO di sini.')
    const jid = m.senderKey || m.sender
    if (!s.pemain.includes(jid)) return kirim(m, 'Kamu tidak ada di meja ini.')
    if (jid === s.host) {
      unoSessions.delete(key(m))
      return kirim(m, `🃏 Meja UNO dibubarkan oleh *${nama(m, jid)}*.`)
    }
    s.pemain = s.pemain.filter(j => j !== jid)
    s.urutan = s.urutan.filter(j => j !== jid)
    delete s.tangan[jid]
    if (s.giliran === jid) s.giliran = s.urutan[0]
    simpan(m, s)
    return kirim(m, `👋 *${nama(m, jid)}* keluar dari meja UNO. Sisa ${s.pemain.length} pemain.`)
  }
}

/* ================================================================== */
/*  .unomulai                                                           */
/* ================================================================== */
export const unoMulai = {
  command: ['unomulai', 'unostart', 'mulaiuno', 'unogo'],
  category: 'Games',
  description: `🃏 Mulai permainan UNO (khusus host, minimal ${MIN_PEMAIN} pemain)`,
  limit: 0,
  cooldown: 2,
  run: async m => {
    const galat = mejaBelumMulai(m)
    if (galat) return kirim(m, galat)
    const s = meja(m)
    const jid = m.senderKey || m.sender
    if (jid !== s.host) return kirim(m, `Hanya host (${sebut(m, s.host)}) yang bisa memulai.`)
    if (s.pemain.length < MIN_PEMAIN) {
      return kirim(m, `Butuh minimal ${MIN_PEMAIN} pemain. Sekarang baru ${s.pemain.length}.\nUndang dengan ${P}uno @teman atau minta mereka ${P}unoikut.`)
    }
    const awal = mulaiPermainan(s.pemain)
    s.tumpukan = awal.tumpukan
    s.buangan = awal.buangan
    s.tangan = awal.tangan
    s.warnaAktif = awal.warnaAktif
    s.mulai = true
    s.hukuman = 0
    s.arah = 1
    /* pemain pertama tidak boleh langsung kena hukuman berat */
    s.giliran = s.urutan[0]
    simpan(m, s)
    const atas = kartuAtas(s)
    await kirim(m,
      `🃏 *UNO DIMULAI!* — ${s.pemain.length} pemain\n\n` +
      `Masing-masing dapat 7 kartu.\n` +
      `🎴 Kartu pembuka: *${labelKartu(atas)}*\n` +
      `🎨 Warna aktif: *${s.warnaAktif}* ${EMOJI_WARNA[s.warnaAktif]}\n` +
      s.pemain.map(j => `▸ ${sebut(m, j)} — 7 kartu`).join('\n') +
      `\n\n🎯 Giliran pertama: *${nama(m, s.giliran)}*\n` +
      `Lihat kartumu dengan ${P}unokartu, lalu ${P}unomain <nomor>.`)
    /* kartu dikirim privat agar tidak bocor */
    for (const j of s.pemain) await kirimTangan(m, s, j)
    return { handled: true }
  }
}

/** kirim daftar kartu ke pemain (ke chat yang sama; sebut @ agar jelas) */
async function kirimTangan (m, s, jid) {
  const tangan = s.tangan[jid] || []
  const bisa = kartuBisa(s, jid)
  const nomorBisa = tangan
    .map((k, i) => ({ k, i: i + 1 }))
    .filter(x => bisa.some(b => b.id === x.k.id))
    .map(x => x.i)
  const teks =
    `🃏 *Kartu ${nama(m, jid)}* (${tangan.length})\n\n` +
    tangan.map((k, i) => {
      const ok = bisa.some(b => b.id === k.id)
      return `${ok ? '✅' : '▫️'} *${i + 1}*. ${labelKartu(k)}`
    }).join('\n') +
    `\n\n🎴 Atas: *${labelKartu(kartuAtas(s))}* · warna *${s.warnaAktif}* ${EMOJI_WARNA[s.warnaAktif] || '⬛'}` +
    (nomorBisa.length
      ? `\nBisa dimainkan: ${nomorBisa.join(', ')} → ${P}unomain ${nomorBisa[0]}`
      : `\nTidak ada yang cocok → ${P}unoambil`)
  return kirim(m, teks)
}

/* ================================================================== */
/*  .unokartu                                                           */
/* ================================================================== */
export const unoKartu = {
  command: ['unokartu', 'unotangan', 'unolihat', 'lihatkartu', 'unohand', 'unocards'],
  category: 'Games',
  description: '🃏 Lihat kartu di tanganmu + kartu yang bisa dimainkan',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s || !s.mulai) return kirim(m, `Permainan belum mulai. Buat meja dengan ${P}uno @teman.`)
    const jid = m.senderKey || m.sender
    if (!s.pemain.includes(jid)) return kirim(m, 'Kamu tidak ada di meja ini.')
    return kirimTangan(m, s, jid)
  }
}

/* ================================================================== */
/*  .unostatus                                                          */
/* ================================================================== */
export const unoStatus = {
  command: ['unostatus', 'unopapan', 'unoboard', 'unoinfo', 'unostate'],
  category: 'Games',
  description: '🃏 Lihat papan permainan UNO (giliran, kartu atas, jumlah kartu)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s) return kirim(m, 'Tidak ada meja UNO di sini.')
    return kirim(m, papan(m, s))
  }
}

/* ================================================================== */
/*  .unomain                                                            */
/* ================================================================== */
export const unoMain = {
  command: ['unomain', 'unoplay', 'unokeluarkartu', 'mainkartu', 'unotaruh', 'unodrop'],
  category: 'Games',
  description: `🃏 Mainkan kartu: ${P}unomain <nomor> [merah|kuning|hijau|biru] — warna wajib untuk kartu Wild`,
  limit: 0,
  cooldown: 2,
  contoh: `${P}unomain 3 merah`,
  run: async m => {
    const s = meja(m)
    if (!s || !s.mulai) return kirim(m, `Permainan belum mulai. Buat meja dengan ${P}uno @teman.`)
    const jid = m.senderKey || m.sender
    if (!s.pemain.includes(jid)) return kirim(m, 'Kamu tidak ada di meja ini.')
    if (s.giliran !== jid) {
      return kirim(m, `Bukan giliranmu.\n🎯 Sekarang giliran *${nama(m, s.giliran)}*.\n${P}unokartu untuk melihat kartumu.`)
    }

    const arg = (m.args || []).map(a => String(a).toLowerCase())
    const nomor = parseInt(arg[0], 10)
    if (!nomor || nomor < 1) {
      return kirim(m, `Sebutkan nomor kartu. Contoh: ${P}unomain 3\nLihat daftar dengan ${P}unokartu.`)
    }
    const tangan = s.tangan[jid] || []
    if (nomor > tangan.length) return kirim(m, `Nomor terlalu besar. Kamu punya ${tangan.length} kartu.`)

    const kartu = tangan[nomor - 1]
    const pilihWarna = WARNA_UNO.find(w => arg.slice(1).some(a => a.startsWith(w.slice(0, 4)) || a === w))
    const bilangUno = arg.some(a => a === 'uno' || a === 'uno!') || s._bilangUno === jid

    const hasil = mainkanKartu(s, jid, kartu.id, { pilihWarna, bilangUno })
    if (!hasil.ok) {
      if (hasil.sebab === 'warna-wajib') {
        return kirim(m, `Kartu itu Wild — sebutkan warnanya.\nContoh: ${P}unomain ${nomor} merah\n(merah / kuning / hijau / biru)`)
      }
      return kirim(m, `❌ ${hasil.pesan}\n${P}unokartu untuk melihat yang bisa dimainkan, atau ${P}unoambil.`)
    }

    Object.assign(s, hasil.state)
    if (s.pemenang) {
      unoSessions.delete(key(m))
      return kirim(m,
        `🏆 *${nama(m, s.pemenang)}* MENANG UNO!\n\n` +
        `Kartu terakhir: *${labelKartu(kartuAtas(s))}*\n\n` +
        `Sisa kartu pemain lain:\n` +
        Object.entries(s.tangan)
          .filter(([j]) => j !== s.pemenang)
          .map(([j, t]) => `▸ ${sebut(m, j)} — ${t.length} kartu`).join('\n') +
        `\n\nMain lagi dengan ${P}uno @teman`)
    }
    simpan(m, s)
    return kirim(m, papan(m, s, [`🃏 *${nama(m, jid)}* memainkan ${labelKartu(kartu)}`, ...hasil.pesan]))
  }
}

/* ================================================================== */
/*  .unoambil                                                           */
/* ================================================================== */
export const unoAmbil = {
  command: ['unoambil', 'unodraw', 'unoambilkartu', 'ambilkartu', 'unodrag'],
  category: 'Games',
  description: '🃏 Ambil kartu dari tumpukan (menanggung hukuman jika ada)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s || !s.mulai) return kirim(m, `Permainan belum mulai. Buat meja dengan ${P}uno @teman.`)
    const jid = m.senderKey || m.sender
    if (!s.pemain.includes(jid)) return kirim(m, 'Kamu tidak ada di meja ini.')
    if (s.giliran !== jid) return kirim(m, `Bukan giliranmu. Giliran *${nama(m, s.giliran)}*.`)

    const hasil = ambilGiliran(s, jid)
    if (!hasil.ok) return kirim(m, hasil.pesan)
    Object.assign(s, hasil.state)
    simpan(m, s)
    const barisAmbil = `📥 *${nama(m, jid)}* ambil kartu${s.hukuman > 0 ? ` (hukuman ${s.hukuman})` : ''}`
    await kirimTangan(m, s, jid)
    return kirim(m, papan(m, s, [barisAmbil, ...hasil.pesan]))
  }
}

/* ================================================================== */
/*  .unoskip — hanya jika tidak bisa main                               */
/* ================================================================== */
export const unoSkip = {
  command: ['unoskip', 'unolewati', 'unopass', 'unolewat'],
  category: 'Games',
  description: '🃏 Lewatkan giliran (hanya boleh kalau tidak ada kartu yang cocok)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s || !s.mulai) return kirim(m, `Permainan belum mulai. Buat meja dengan ${P}uno @teman.`)
    const jid = m.senderKey || m.sender
    if (!s.pemain.includes(jid)) return kirim(m, 'Kamu tidak ada di meja ini.')
    if (s.giliran !== jid) return kirim(m, `Bukan giliranmu. Giliran *${nama(m, s.giliran)}*.`)

    const bisa = kartuBisa(s, jid)
    if (bisa.length > 0) {
      return kirim(m, `❌ Kamu masih punya kartu yang bisa dimainkan (${bisa.length}).\n` +
        `Mainkan dengan ${P}unomain <nomor> — lihat daftar: ${P}unokartu\n` +
        `Kalau memang mau ambil kartu: ${P}unoambil`)
    }
    /* tidak bisa main → wajib ambil 1 kartu, lalu giliran lewat */
    const hasil = ambilGiliran(s, jid, { paksaAmbil: Math.max(1, s.hukuman || 1) })
    if (!hasil.ok) return kirim(m, hasil.pesan)
    Object.assign(s, hasil.state)
    simpan(m, s)
    return kirim(m, papan(m, s,
      [`⏭️ *${nama(m, jid)}* tidak punya kartu yang cocok, ambil 1 kartu.`, ...hasil.pesan]))
  }
}

/* ================================================================== */
/*  .unowarna — pilih warna setelah Wild (kalau lupa menyebut di unomain) */
/* ================================================================== */
export const unoWarna = {
  command: ['unowarna', 'unopilihwarna', 'unocolor', 'unowarnapilih'],
  category: 'Games',
  description: `🃏 Pilih warna setelah Wild: ${P}unowarna merah|kuning|hijau|biru`,
  limit: 0,
  cooldown: 2,
  contoh: `${P}unowarna biru`,
  run: async m => {
    const s = meja(m)
    if (!s || !s.mulai) return kirim(m, `Permainan belum mulai. Buat meja dengan ${P}uno @teman.`)
    const jid = m.senderKey || m.sender
    if (s.giliran !== jid) return kirim(m, `Bukan giliranmu. Giliran *${nama(m, s.giliran)}*.`)
    const arg = String((m.args || [])[0] || '').toLowerCase()
    const warna = WARNA_UNO.find(w => w.startsWith(arg) && arg.length >= 3)
    if (!warna) {
      return kirim(m, `Pilih salah satu: ${WARNA_UNO.map(w => `${EMOJI_WARNA[w]} ${w}`).join(' · ')}\n` +
        `Contoh: ${P}unowarna biru\nAtau langsung saat main: ${P}unomain 3 biru`)
    }
    /* simpan niat, lalu minta mainkan kartu Wild-nya */
    s._bilangUno = null
    simpan(m, s)
    return kirim(m, `🎨 Warna *${warna}* ${EMOJI_WARNA[warna]} tercatat.\n` +
      `Sekarang mainkan kartu Wild-nya: ${P}unomain <nomor> ${warna}`)
  }
}

/* ================================================================== */
/*  .unobubar — host bubarkan meja                                      */
/* ================================================================== */
export const unoBubar = {
  command: ['unobubar', 'unostop', 'unobatal', 'bataluno', 'unohapus'],
  category: 'Games',
  description: '🃏 Bubarkan meja UNO (host atau owner)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const s = meja(m)
    if (!s) return kirim(m, 'Tidak ada meja UNO di sini.')
    const jid = m.senderKey || m.sender
    if (jid !== s.host && !m.isOwner) {
      return kirim(m, `Hanya host (${sebut(m, s.host)}) atau owner yang bisa membubarkan meja.`)
    }
    unoSessions.delete(key(m))
    return kirim(m, `🃏 Meja UNO dibubarkan oleh *${nama(m, jid)}*.`)
  }
}

