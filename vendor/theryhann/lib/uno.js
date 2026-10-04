/**
 * 🃏 lib/uno.js — MESIN LOGIKA UNO (v7.37.0)
 * ------------------------------------------------------------------
 *  Fungsi murni: tidak menyentuh WhatsApp, database, atau waktu nyata.
 *  Semua keadaan lewat argumen & dikembalikan sebagai objek baru supaya
 *  mudah diuji (scripts/test-uno.js).
 *
 *  Aturan yang diimplementasi (UNO klasik):
 *   • 108 kartu: 4 warna × (0 + dua set 1-9) + 8 kartu aksi per warna
 *     (Skip, Reverse, Draw Two) + 4 Wild + 4 Wild Draw Four
 *   • cocok = warna sama ATAU angka/aksi sama; Wild cocok kapan saja
 *   • Skip = lewati 1 pemain · Reverse = putar arah · Draw Two = +2 & lewati
 *   • Wild = pilih warna · Wild Draw Four = +4, lewati, pilih warna
 *   • tumpukan Draw Two / Wild Four MENUMPUK (stacking)
 *   • pemain harus bilang "UNO!" saat sisa 1 kartu, lupa = denda 2 kartu
 *   • menang = kartu habis; jika tumpukan habis, buangan diacak ulang
 */

export const WARNA_UNO = ['merah', 'kuning', 'hijau', 'biru']
export const EMOJI_WARNA = { merah: '🟥', kuning: '🟨', hijau: '🟩', biru: '🟦' }
export const WARNA_ACAK = 'hitam'

/** id kartu → tampilan singkat */
export const LABEL_AKSI = {
  skip: '⛔ Skip', reverse: '🔄 Reverse', draw2: '➕2 Draw Two',
  wild: '🌈 Wild', wild4: '🌈➕4 Wild Draw Four'
}

/* ================================================================== */
/*  Dek & pengocokan                                                   */
/* ================================================================== */

/** Bangun 108 kartu UNO. `rnd` opsional agar bisa diuji deterministik. */
export function buatDek (rnd = Math.random) {
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
export function kocok (arr, rnd = Math.random) {
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
export function mulaiPermainan (daftarJid, rnd = Math.random, jumlahAwal = 7) {
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
export function kartuAtas (s) {
  return s.buangan[s.buangan.length - 1] || null
}

/**
 * Bolehkah `kartu` dimainkan di atas `atas` dengan `warnaAktif`?
 * Wild selalu boleh. Selain itu warna cocok ATAU nilai cocok.
 */
export function bolehMain (kartu, atas, warnaAktif) {
  if (!kartu || !atas) return false
  if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') return true
  if (kartu.warna === warnaAktif) return true
  return kartu.nilai === atas.nilai
}

/** Kartu yang bisa dimainkan seorang pemain. */
export function kartuBisa (s, jid) {
  const atas = kartuAtas(s)
  return (s.tangan[jid] || []).filter(k => bolehMain(k, atas, s.warnaAktif))
}

/** Pemain tidak punya kartu yang cocok. */
export function harusAmbil (s, jid) {
  return kartuBisa(s, jid).length === 0
}

/* ================================================================== */
/*  Urutan giliran                                                      */
/* ================================================================== */

/** Giliran berikutnya setelah `idx`, mengikuti `arah` (1 = searah jarum jam). */
export function berikut (urutan, idx, arah = 1, lompat = 0) {
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
export function ambilKartu (s, jumlah = 1, rnd = Math.random) {
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
export function mainkanKartu (s, jid, kartuId, opt = {}, rnd = Math.random) {
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
export function ambilGiliran (s, jid, opt = {}, rnd = Math.random) {
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
export function tuduhUno (s, penuduh, tertuduh) {
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
export function labelKartu (k) {
  if (!k) return '—'
  if (k.aksi === 'wild') return '🌈 Wild'
  if (k.aksi === 'wild4') return '🌈➕4 Wild Draw Four'
  const e = EMOJI_WARNA[k.warna] || '⬛'
  if (k.aksi) return `${e} ${LABEL_AKSI[k.aksi] || k.aksi}`
  return `${e} ${k.nilai}`
}

/** Baris kartu pendek untuk papan. */
export function barisKartu (kartuList, maks = 12) {
  if (!kartuList || kartuList.length === 0) return '(kosong)'
  const tampil = kartuList.slice(0, maks).map(labelKartu).join('  ')
  return kartuList.length > maks ? `${tampil}  … +${kartuList.length - maks}` : tampil
}

export default {
  WARNA_UNO, EMOJI_WARNA, WARNA_ACAK, LABEL_AKSI,
  buatDek, kocok, mulaiPermainan, kartuAtas, bolehMain, kartuBisa, harusAmbil,
  berikut, ambilKartu, mainkanKartu, ambilGiliran, tuduhUno, labelKartu, barisKartu
}
