/**
 * ============================================================
 *  lib/casinorpg.js — 🎰 5 GAME KASINO RPG (uang asli, server-side) v7.6
 * ------------------------------------------------------------
 *  Sama seperti `.slot` (lib/slotrpg.js): hasil diacak di SERVER, uang RPG
 *  (`u.rpg.money`) benar-benar dipotong & dibayarkan, lalu hasilnya dikirim
 *  sebagai kartu HTML app yang memutar animasi dan berhenti persis di hasil
 *  server. Tidak bisa dicurangi dari sisi client, dan setiap kemenangan
 *  otomatis tercatat di papan peringkat (`.lbgame`) — tanpa kode setor.
 *
 *  Game:
 *    • .rolet        🎡 Rolet Eropa 37 angka (merah/hitam/genap/ganjil/
 *                    besar/kecil/lusin/kolom/angka langsung)
 *    • .dadukoin     🎲 Sic Bo 3 dadu (besar/kecil/ganjil/genap/jumlah/
 *                    pasangan/triple)
 *    • .aviatorrpg   📈 Crash: pilih target cash-out, kurva naik lalu jebol
 *    • .keno         🎯 Pilih 1–6 angka dari 40, diundi 10
 *    • .blackjack21  🃏 Blackjack multi-giliran (.hit / .stand / .double)
 *
 *  Keseimbangan (anti inflasi, sama seperti slot):
 *    RTP pemain biasa ≈ 92–95%, naik sampai ≈97% untuk pemain RPG yang
 *    sudah memaksimalkan `luck` (job/skill/permata/relik/buff/dekor/musim)
 *    dan `koin` (rumah + dekorasi). Bonus koin dibatasi
 *    BONUS_KOIN_KASINO (1.05) dan hanya untuk taruhan berisiko tinggi.
 *
 *  Semua fungsi acak & pembayaran murni (pure) supaya bisa diuji + disimulasi.
 * ============================================================
 */
import { MIN_BET, MAX_BET, DEFAULT_BET, fmtKoin, parseBet, parseAngka } from './slotrpg.js'

export { MIN_BET, MAX_BET, DEFAULT_BET, fmtKoin, parseBet }

/** batas atas bonus pengali koin (rumah/dekorasi) untuk kasino RPG */
export const BONUS_KOIN_KASINO = 1.05
/** batas atas pengaruh luck terhadap peluang menang (relatif) */
export const BONUS_LUCK_MAKS = 0.04
/** umur sesi blackjack (ms) — lewat itu dianggap hangus */
export const UMUR_SESI = 10 * 60 * 1000
/**
 * Batas pembayaran satu ronde (anti inflasi): keno ×6000 atau rolet angka ×33
 * dengan taruhan maksimum tidak boleh mencetak koin ratusan juta sekaligus.
 */
export const MAKS_BAYAR = 2500000
export const capBayar = n => Math.min(MAKS_BAYAR, Math.max(0, Math.round(Number(n) || 0)))

/**
 * Pisahkan argumen `.rolet 500 merah` → taruhan ("500") + pilihan ("merah").
 * Token pertama yang terbaca sebagai angka ≥ MIN_BET (atau all/min) dianggap
 * taruhan; sisanya pilihan. Kalau tidak ada, taruhan bawaan yang dipakai.
 */
export function pisahTaruhan (teks) {
  const bagian = String(teks || '').trim().split(/\s+/).filter(Boolean)
  let idxBet = -1, betTeks = ''
  for (let i = 0; i < bagian.length; i++) {
    const b = bagian[i].toLowerCase()
    if (/^(all|semua|max|maks|maksimal|gas|gaskeun|full|min|kecil|termurah)$/.test(b)) { idxBet = i; betTeks = bagian[i]; break }
    const n = parseAngka(b)
    if (n !== null && n >= MIN_BET) { idxBet = i; betTeks = bagian[i]; break }
  }
  return { teksBet: betTeks, teksSisa: bagian.filter((_, i) => i !== idxBet).join(' '), jumlahToken: bagian.length }
}

const angka = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : d)
const bulat2 = v => Math.round((Number(v) || 0) * 100) / 100
const kaliBonus = (opt, bolehBonus) =>
  bolehBonus ? Math.max(1, Math.min(BONUS_KOIN_KASINO, Number(opt?.koin) || 1)) : 1
const pengaruhLuck = (luck, menang) => {
  /* luck RPG menaikkan peluang menang maksimal +4% relatif (hanya kalau belum menang) */
  const l = Math.max(0.2, Math.min(2.5, Number(luck) || 1))
  return menang ? 1 : 1 + Math.min(BONUS_LUCK_MAKS, Math.max(0, (l - 1) * 0.08))
}

/* ================================================================== */
/*  🎡 ROLET EROPA                                                     */
/* ================================================================== */
/** urutan angka di roda fisik (Eropa, single zero) — dipakai animasi kartu */
export const RODA_ROLET = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]
export const MERAH_ROLET = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
export const warnaRolet = n => (n === 0 ? 'hijau' : MERAH_ROLET.includes(n) ? 'merah' : 'hitam')

/**
 * Jenis taruhan rolet. `kali` = total pengembalian (taruhan sudah termasuk),
 * jadi untung bersih = (kali − 1) × taruhan.
 */
export const TARUHAN_ROLET = {
  merah: { kali: 1.9, label: 'MERAH', cek: n => warnaRolet(n) === 'merah' },
  hitam: { kali: 1.9, label: 'HITAM', cek: n => warnaRolet(n) === 'hitam' },
  ganjil: { kali: 1.9, label: 'GANJIL', cek: n => n !== 0 && n % 2 === 1 },
  genap: { kali: 1.9, label: 'GENAP', cek: n => n !== 0 && n % 2 === 0 },
  kecil: { kali: 1.9, label: 'KECIL 1–18', cek: n => n >= 1 && n <= 18 },
  besar: { kali: 1.9, label: 'BESAR 19–36', cek: n => n >= 19 && n <= 36 },
  lusin1: { kali: 2.7, label: 'LUSIN 1 (1–12)', cek: n => n >= 1 && n <= 12, bonus: true },
  lusin2: { kali: 2.7, label: 'LUSIN 2 (13–24)', cek: n => n >= 13 && n <= 24, bonus: true },
  lusin3: { kali: 2.7, label: 'LUSIN 3 (25–36)', cek: n => n >= 25 && n <= 36, bonus: true },
  kolom1: { kali: 2.7, label: 'KOLOM 1', cek: n => n >= 1 && n % 3 === 1, bonus: true },
  kolom2: { kali: 2.7, label: 'KOLOM 2', cek: n => n >= 2 && n % 3 === 2, bonus: true },
  kolom3: { kali: 2.7, label: 'KOLOM 3', cek: n => n >= 3 && n % 3 === 0, bonus: true }
}
export const ALIAS_ROLET = {
  red: 'merah', merah: 'merah', m: 'merah', black: 'hitam', hitam: 'hitam', h: 'hitam',
  odd: 'ganjil', ganjil: 'ganjil', even: 'genap', genap: 'genap',
  small: 'kecil', kecil: 'kecil', '1-18': 'kecil', big: 'besar', besar: 'besar', '19-36': 'besar',
  dozen1: 'lusin1', lusin1: 'lusin1', '1-12': 'lusin1', dozen2: 'lusin2', lusin2: 'lusin2',
  '13-24': 'lusin2', dozen3: 'lusin3', lusin3: 'lusin3', '25-36': 'lusin3',
  kolom1: 'kolom1', column1: 'kolom1', kolom2: 'kolom2', column2: 'kolom2',
  kolom3: 'kolom3', column3: 'kolom3', zero: 0, nol: 0
}

/**
 * Urai teks taruhan rolet: `.rolet 500 merah`, `.rolet 1k 17`, `.rolet 250 kolom2`.
 * @returns {{jenis:string, angka?:number, kali:number, label:string, error?:string}}
 */
export function parseRolet (teks) {
  const t = String(teks || '').trim().toLowerCase()
  if (!t) return { jenis: '', error: 'Sebutkan taruhan, contoh: `.rolet 500 merah` atau `.rolet 1k 17`' }
  const bagian = t.split(/[\s,]+/).filter(Boolean)
  let jenis = null, angkaDirect = null
  for (const b of bagian) {
    if (/^\d+$/.test(b)) {
      const n = Number(b)
      if (n >= 0 && n <= 36 && b.length <= 2 && !jenis) angkaDirect = n
      continue
    }
    const k = ALIAS_ROLET[b]
    if (typeof k === 'string' && TARUHAN_ROLET[k]) jenis = k
    else if (k === 0) jenis = 'angka0'
  }
  if (angkaDirect !== null) jenis = 'angka'
  if (!jenis) {
    return {
      jenis: '',
      error: 'Taruhan tidak dikenal. Pilihan: merah/hitam · genap/ganjil · kecil(1–18)/besar(19–36) · ' +
        'lusin1..3 · kolom1..3 · atau angka 0–36'
    }
  }
  if (jenis === 'angka' || jenis === 'angka0') {
    const n = jenis === 'angka0' ? 0 : angkaDirect
    return { jenis: 'angka', angka: n, kali: 33, label: `ANGKA ${n}`, bonus: true }
  }
  const d = TARUHAN_ROLET[jenis]
  return { jenis, kali: d.kali, label: d.label, bonus: !!d.bonus }
}

/**
 * Putar roda. `luck` RPG menaikkan peluang menang (maks +4% relatif) hanya
 * bila taruhan belum menang secara alami — jadi tidak pernah membuat
 * hasil di luar rentang roda.
 * @returns {number} 0..36
 */
export function putarRolet (luck = 1, taruhan = null, rng = Math.random) {
  const hasil = Math.floor(rng() * 37)
  if (!taruhan) return hasil
  const cek = taruhan.jenis === 'angka'
    ? n => n === taruhan.angka
    : (TARUHAN_ROLET[taruhan.jenis]?.cek || (() => false))
  if (cek(hasil)) return hasil
  const p = pengaruhLuck(luck, false) - 1
  if (p > 0 && rng() < p * 10) {
    const menang = []
    for (let n = 0; n <= 36; n++) if (cek(n)) menang.push(n)
    if (menang.length) return menang[Math.floor(rng() * menang.length)]
  }
  return hasil
}

/** hitung pembayaran rolet */
export function hitungRolet (hasilRolet, taruhan, bet, opt = {}) {
  const b = Math.max(0, angka(bet))
  const cek = taruhan.jenis === 'angka'
    ? n => n === taruhan.angka
    : (TARUHAN_ROLET[taruhan.jenis]?.cek || (() => false))
  const menang = cek(hasilRolet)
  const bonusKoin = kaliBonus(opt, !!taruhan.bonus && menang)
  const bayar = menang ? capBayar(b * taruhan.kali * bonusKoin) : 0
  return {
    menang, bayar, kali: menang ? bulat2(taruhan.kali * bonusKoin) : 0, bonusKoin: bulat2(bonusKoin),
    untung: bayar - b, warna: warnaRolet(hasilRolet),
    ket: menang ? `${taruhan.label} kena · ×${bulat2(taruhan.kali * bonusKoin)}` : `${taruhan.label} tidak kena`
  }
}

/** peluang & RTP analitis rolet per jenis taruhan (dipakai `.roletinfo`) */
export function peluangRolet (luck = 1, koin = 1) {
  const bonus = Math.max(1, Math.min(BONUS_KOIN_KASINO, Number(koin) || 1))
  const pLuck = pengaruhLuck(luck, false)
  const out = []
  for (const [id, d] of Object.entries(TARUHAN_ROLET)) {
    const n = Array.from({ length: 37 }, (_, i) => i).filter(d.cek).length
    const p = Math.min(0.97, (n / 37) * pLuck)
    const kali = d.bonus ? d.kali * bonus : d.kali
    out.push({ id, label: d.label, angka: n, peluang: bulat2(p * 100), kali: bulat2(kali), rtp: bulat2(p * kali * 100) })
  }
  const pAngka = Math.min(0.97, (1 / 37) * pLuck)
  out.push({ id: 'angka', label: 'ANGKA 0–36', angka: 1, peluang: bulat2(pAngka * 100), kali: bulat2(33 * bonus), rtp: bulat2(pAngka * 33 * bonus * 100) })
  return out
}

/* ================================================================== */
/*  🎲 DADU RPG (sic bo 3 dadu)                                        */
/* ================================================================== */
/** ketiga dadu sama (triple) — taruhan besar/kecil/genap/ganjil kalah kalau keluar triple */
export const samaSemua = d => d[0] === d[1] && d[1] === d[2]

export const TARUHAN_DADU = {
  besar: { kali: 1.9, label: 'BESAR (11–17)', cek: (t, d) => t >= 11 && t <= 17 && !samaSemua(d) },
  kecil: { kali: 1.9, label: 'KECIL (4–10)', cek: (t, d) => t >= 4 && t <= 10 && !samaSemua(d) },
  ganjil: { kali: 1.9, label: 'GANJIL', cek: (t, d) => t % 2 === 1 && !samaSemua(d) },
  genap: { kali: 1.9, label: 'GENAP', cek: (t, d) => t % 2 === 0 && !samaSemua(d) },
  triple: { kali: 32, label: 'TRIPLE (3 dadu sama)', bonus: true, cek: (t, d) => samaSemua(d) }
}

/**
 * Pembayaran jumlah tepat (3..18) — disetel supaya RTP ≈ 83–88%
 * (peluang jumlah 3 = 1/216, jumlah 10/11 = 27/216, dst).
 */
export const BAYAR_JUMLAH = {
  3: 190, 4: 63, 5: 31, 6: 19, 7: 12, 8: 9, 9: 7.6, 10: 7,
  11: 7, 12: 7.6, 13: 9, 14: 12, 15: 19, 16: 31, 17: 63, 18: 190
}
export const ALIAS_DADU = {
  besar: 'besar', big: 'besar', kecil: 'kecil', small: 'kecil',
  ganjil: 'ganjil', odd: 'ganjil', genap: 'genap', even: 'genap', triple: 'triple', kembar3: 'triple'
}

/**
 * Urai taruhan dadu: `.dadukoin 500 besar`, `.dadukoin 1k jumlah 9`,
 * `.dadukoin 250 triple`, `.dadukoin 500 pair 6`.
 */
export function parseDadu (teks) {
  const t = String(teks || '').trim().toLowerCase()
  if (!t) return { jenis: '', error: 'Sebutkan taruhan, contoh: `.dadukoin 500 besar` · `.dadukoin 1k jumlah 9` · `.dadukoin 250 pair 6` · `.dadukoin 500 triple`' }
  const bagian = t.split(/[\s,]+/).filter(Boolean)
  let jenis = null, nilai = null
  for (const b of bagian) {
    if (/^\d+$/.test(b)) { const n = Number(b); if (n >= 1 && n <= 18 && (!jenis || jenis === 'jumlah' || jenis === 'pair')) nilai = n; continue }
    if (b === 'jumlah' || b === 'total' || b === 'sum') { jenis = 'jumlah'; continue }
    if (b === 'pair' || b === 'pasangan' || b === 'double') { jenis = 'pair'; continue }
    if (ALIAS_DADU[b]) jenis = ALIAS_DADU[b]
  }
  if (!jenis && nilai !== null && nilai >= 3 && nilai <= 18) jenis = 'jumlah'
  if (jenis === 'jumlah') {
    if (nilai === null || nilai < 3 || nilai > 18) return { jenis: 'jumlah', error: 'Jumlah harus 3–18, contoh `.dadukoin 500 jumlah 9`' }
    return { jenis: 'jumlah', nilai, kali: BAYAR_JUMLAH[nilai], label: `JUMLAH ${nilai}`, bonus: true }
  }
  if (jenis === 'pair') {
    if (nilai === null || nilai < 1 || nilai > 6) return { jenis: 'pair', error: 'Pair harus angka dadu 1–6, contoh `.dadukoin 500 pair 6`' }
    return { jenis: 'pair', nilai, kali: 12, label: `PAIR ${nilai} (≥2 dadu)`, bonus: false }
  }
  if (!jenis || !TARUHAN_DADU[jenis]) {
    return { jenis: '', error: 'Taruhan tidak dikenal. Pilihan: besar/kecil · ganjil/genap · jumlah 3–18 · pair 1–6 · triple' }
  }
  const d = TARUHAN_DADU[jenis]
  return { jenis, kali: d.kali, label: d.label, bonus: !!d.bonus }
}

/** lempar 3 dadu (luck menaikkan peluang menang maksimal +4% relatif) */
export function putarDadu (luck = 1, taruhan = null, rng = Math.random) {
  const lempar = () => [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)]
  let d = lempar()
  if (!taruhan) return d
  const cek = pembuatCekDadu(taruhan)
  if (cek(d)) return d
  const p = pengaruhLuck(luck, false) - 1
  if (p > 0 && rng() < p * 10) {
    for (let i = 0; i < 40; i++) { const c = lempar(); if (cek(c)) return c }
  }
  return d
}
function pembuatCekDadu (t) {
  const total = d => d[0] + d[1] + d[2]
  if (t.jenis === 'jumlah') return d => total(d) === t.nilai
  if (t.jenis === 'pair') return d => d.filter(x => x === t.nilai).length >= 2
  if (TARUHAN_DADU[t.jenis]) return d => TARUHAN_DADU[t.jenis].cek(total(d), d)
  return () => false
}
export function hitungDadu (dadu, taruhan, bet, opt = {}) {
  const b = Math.max(0, angka(bet))
  const total = dadu[0] + dadu[1] + dadu[2]
  const menang = pembuatCekDadu(taruhan)(dadu)
  const bonusKoin = kaliBonus(opt, !!taruhan.bonus && menang)
  const bayar = menang ? capBayar(b * taruhan.kali * bonusKoin) : 0
  return {
    menang, bayar, total, triple: dadu[0] === dadu[1] && dadu[1] === dadu[2],
    kali: menang ? bulat2(taruhan.kali * bonusKoin) : 0, bonusKoin: bulat2(bonusKoin),
    untung: bayar - b,
    ket: menang ? `${taruhan.label} kena (jumlah ${total}) · ×${bulat2(taruhan.kali * bonusKoin)}` : `${taruhan.label} tidak kena (jumlah ${total})`
  }
}
/** peluang & RTP dadu (dipakai `.daduinfo`) */
export function peluangDadu (luck = 1, koin = 1) {
  const bonus = Math.max(1, Math.min(BONUS_KOIN_KASINO, Number(koin) || 1))
  const pLuck = pengaruhLuck(luck, false)
  const semua = []
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) semua.push([a, b, c])
  const out = []
  for (const [id, d] of Object.entries(TARUHAN_DADU)) {
    const n = semua.filter(x => d.cek(x[0] + x[1] + x[2], x)).length
    const p = Math.min(0.97, (n / 216) * pLuck)
    const kali = d.bonus ? d.kali * bonus : d.kali
    out.push({ id, label: d.label, kombinasi: n, peluang: bulat2(p * 100), kali: bulat2(kali), rtp: bulat2(p * kali * 100) })
  }
  for (let s = 3; s <= 18; s++) {
    const n = semua.filter(x => x[0] + x[1] + x[2] === s).length
    const p = Math.min(0.97, (n / 216) * pLuck)
    const kali = BAYAR_JUMLAH[s] * bonus
    out.push({ id: 'jumlah' + s, label: `JUMLAH ${s}`, kombinasi: n, peluang: bulat2(p * 100), kali: bulat2(kali), rtp: bulat2(p * kali * 100) })
  }
  for (let v = 1; v <= 6; v++) {
    const n = semua.filter(x => x.filter(y => y === v).length >= 2).length
    const p = Math.min(0.97, (n / 216) * pLuck)
    out.push({ id: 'pair' + v, label: `PAIR ${v} (≥2 dadu)`, kombinasi: n, peluang: bulat2(p * 100), kali: 12, rtp: bulat2(p * 12 * 100) })
  }
  return out
}

/* ================================================================== */
/*  📈 AVIATOR RPG (crash)                                             */
/* ================================================================== */
/** konstanta house edge: P(crash ≥ x) ≈ EDGE_CRASH / x */
export const EDGE_CRASH = 0.94
export const TARGET_MIN = 1.1
export const TARGET_MAX = 50

/**
 * Titik jebol (multiplier). Distribusi crash klasik dengan house edge,
 * luck RPG menaikkan EDGE_CRASH sampai 0.96 (maks).
 * @returns {number} 1.00 .. ~200 (2 desimal)
 */
export function titikCrash (luck = 1, rng = Math.random) {
  const l = Math.max(0.2, Math.min(2.5, Number(luck) || 1))
  const edge = Math.min(EDGE_CRASH + 0.02, EDGE_CRASH + Math.max(0, (l - 1) * 0.04))
  const u = Math.max(0, Math.min(0.999999, rng()))
  /* P(crash >= x) = edge / x  ->  RTP = x * edge/x = edge (94%, maks 96% dgn luck) */
  return Math.max(1.00, Math.min(999, Math.round((edge / (1 - u)) * 100) / 100))
}
/** urai target cash-out: `.aviator 500 2.5` / `.aviator 1k x3` */
export function parseTarget (teks) {
  const t = String(teks || '').trim().toLowerCase().replace(/^[x×*]/, '').replace(/[x×*]$/, '')
  if (!t) return { target: null }
  const n = Number(t.replace(',', '.'))
  if (!Number.isFinite(n)) return { target: null, error: `Target harus angka, contoh \`.aviator 500 2.5\` (cash-out di ×2.5)` }
  if (n < TARGET_MIN || n > TARGET_MAX) return { target: null, error: `Target harus ${TARGET_MIN}–${TARGET_MAX}, contoh \`.aviator 500 2\`` }
  return { target: Math.round(n * 100) / 100 }
}
export function hitungAviator (crash, target, bet, opt = {}) {
  const b = Math.max(0, angka(bet))
  const t = Math.max(TARGET_MIN, Math.min(TARGET_MAX, Number(target) || 2))
  const menang = crash >= t
  const bonusKoin = kaliBonus(opt, menang && t >= 5)
  const bayar = menang ? capBayar(b * t * bonusKoin) : 0
  return {
    menang, bayar, crash: bulat2(crash), target: bulat2(t), bonusKoin: bulat2(bonusKoin),
    kali: menang ? bulat2(t * bonusKoin) : 0, untung: bayar - b,
    ket: menang ? `Cash-out ×${bulat2(t)} sebelum jebol ×${bulat2(crash)}` : `Jebol di ×${bulat2(crash)} sebelum target ×${bulat2(t)}`
  }
}
/** RTP aviator untuk target tertentu */
export function peluangAviator (target = 2, luck = 1, koin = 1) {
  const l = Math.max(0.2, Math.min(2.5, Number(luck) || 1))
  const edge = Math.min(EDGE_CRASH + 0.02, EDGE_CRASH + Math.max(0, (l - 1) * 0.04))
  const t = Math.max(TARGET_MIN, Number(target) || 2)
  const p = Math.min(0.97, edge / t)
  const bonus = t >= 5 ? Math.max(1, Math.min(BONUS_KOIN_KASINO, Number(koin) || 1)) : 1
  return { target: bulat2(t), peluang: bulat2(p * 100), kali: bulat2(t * bonus), rtp: bulat2(p * t * bonus * 100) }
}

/* ================================================================== */
/*  🎯 KENO RPG                                                        */
/* ================================================================== */
export const KENO_ANGKA = 40
export const KENO_UNDI = 10
export const KENO_PILIH_MAKS = 6
/**
 * Tabel pembayaran keno: TABEL_KENO[jumlahPilihan][jumlahTebak] = total pengembalian.
 * Dirancang RTP ≈ 92% (dihitung di `peluangKeno`).
 */
export const TABEL_KENO = {
  1: { 1: 3.65 },
  2: { 2: 15.5 },
  3: { 2: 2.2, 3: 48 },
  4: { 2: 1.6, 3: 7, 4: 120 },
  5: { 2: 0.9, 3: 3.2, 4: 26, 5: 320 },
  6: { 2: 0.6, 3: 2, 4: 10, 5: 60, 6: 700 }
}
/** urai pilihan keno: `.keno 500 3 11 27` / `.keno 1k acak` */
export function parseKeno (teks) {
  const t = String(teks || '').trim().toLowerCase()
  const bagian = t.split(/[\s,;.\-]+/).filter(Boolean)
  if (!bagian.length) return { pilih: [], acak: true }
  if (bagian.some(b => b === 'acak' || b === 'random' || b === 'auto')) return { pilih: [], acak: true }
  const pilih = []
  for (const b of bagian) {
    if (!/^\d+$/.test(b)) continue
    const n = Number(b)
    if (n < 1 || n > KENO_ANGKA) return { pilih: [], error: `Angka keno harus 1–${KENO_ANGKA} (kamu menulis ${n})` }
    if (!pilih.includes(n)) pilih.push(n)
  }
  if (!pilih.length) return { pilih: [], acak: true }
  if (pilih.length > KENO_PILIH_MAKS) return { pilih: pilih.slice(0, KENO_PILIH_MAKS), peringatan: `Maksimal ${KENO_PILIH_MAKS} angka, sisanya diabaikan` }
  return { pilih: pilih.slice().sort((a, b) => a - b) }
}
/** undi 10 angka unik (luck menaikkan peluang kena maksimal +4% relatif) */
export function undiKeno (luck = 1, pilih = [], rng = Math.random) {
  const undi = () => {
    const pool = Array.from({ length: KENO_ANGKA }, (_, i) => i + 1)
    const out = []
    for (let i = 0; i < KENO_UNDI; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
    return out.sort((a, b) => a - b)
  }
  let hasil = undi()
  if (!pilih?.length) return hasil
  const kena = hasil.filter(n => pilih.includes(n)).length
  const terbaik = hitungKeno(pilih, hasil, 1).kali
  const p = pengaruhLuck(luck, terbaik > 0) - 1
  if (p > 0 && terbaik === 0 && rng() < p * 10) {
    for (let i = 0; i < 30; i++) {
      const c = undi()
      if (hitungKeno(pilih, c, 1).kali > 0) return c
    }
  }
  void kena
  return hasil
}
export function hitungKeno (pilih, undian, bet, opt = {}) {
  const b = Math.max(0, angka(bet))
  const p = (Array.isArray(pilih) ? pilih : []).slice(0, KENO_PILIH_MAKS)
  const u = Array.isArray(undian) ? undian : []
  const kena = p.filter(n => u.includes(n))
  const tabel = TABEL_KENO[p.length] || {}
  const kali0 = Number(tabel[kena.length] || 0)
  const menang = kali0 > 0
  const bonusKoin = kaliBonus(opt, menang && kali0 >= 50)
  const bayar = menang ? capBayar(b * kali0 * bonusKoin) : 0
  return {
    menang, bayar, kena: kena.slice(), jumlahKena: kena.length, jumlahPilih: p.length,
    kali: menang ? bulat2(kali0 * bonusKoin) : 0, bonusKoin: bulat2(bonusKoin), untung: bayar - b,
    ket: menang ? `${kena.length}/${p.length} kena · ×${bulat2(kali0 * bonusKoin)}` : `${kena.length}/${p.length} kena — belum beruntung`
  }
}
/** RTP keno per jumlah pilihan */
export function peluangKeno (luck = 1, koin = 1) {
  const bonus = Math.max(1, Math.min(BONUS_KOIN_KASINO, Number(koin) || 1))
  const pLuck = pengaruhLuck(luck, false)
  const C = (n, k) => {
    if (k < 0 || k > n) return 0
    let r = 1
    for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1)
    return Math.round(r)
  }
  const out = []
  for (let pilih = 1; pilih <= KENO_PILIH_MAKS; pilih++) {
    const tabel = TABEL_KENO[pilih] || {}
    let rtp = 0
    const rincian = []
    for (let kena = 0; kena <= pilih; kena++) {
      const p = (C(pilih, kena) * C(KENO_ANGKA - pilih, KENO_UNDI - kena)) / C(KENO_ANGKA, KENO_UNDI)
      const kali = Number(tabel[kena] || 0)
      const kb = kali >= 50 ? bonus : 1
      rtp += p * kali * kb * pLuck
      if (kali) rincian.push({ kena, kali: bulat2(kali * kb), peluang: bulat2(p * 100 * pLuck) })
    }
    out.push({ pilih, rtp: bulat2(rtp * 100), rincian })
  }
  return out
}

/* ================================================================== */
/*  🃏 BLACKJACK RPG                                                   */
/* ================================================================== */
export const SIMBOL_WARNA = ['♠', '♥', '♦', '♣']
export const RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const BAYAR_BLACKJACK = 2.2   /* total pengembalian untuk blackjack alami */
export const BAYAR_MENANG = 2        /* total pengembalian untuk menang biasa */
export const BAYAR_SERI = 1          /* push: taruhan kembali */
export const MIN_DOUBLE = 9

/** buat sepatu kartu (default 4 deck = 208 kartu) dalam bentuk 'A♠' */
export function buatSepatu (deck = 4, rng = Math.random) {
  const kartu = []
  for (let d = 0; d < deck; d++) for (const r of RANK) for (const s of SIMBOL_WARNA) kartu.push(r + s)
  for (let i = kartu.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = kartu[i]; kartu[i] = kartu[j]; kartu[j] = t
  }
  return kartu
}
export const rankDari = k => String(k).slice(0, -1)
/** nilai satu kartu (A dihitung 11 di nilaiTangan) */
export function nilaiKartu (k) {
  const r = rankDari(k)
  if (r === 'A') return 11
  if (r === 'K' || r === 'Q' || r === 'J') return 10
  return Number(r) || 0
}
/** total tangan dengan penanganan As (soft/hard) */
export function nilaiTangan (kartu) {
  let total = 0, as = 0
  for (const k of kartu || []) {
    total += nilaiKartu(k)
    if (rankDari(k) === 'A') as++
  }
  let soft = as > 0
  while (total > 21 && as > 0) { total -= 10; as-- }
  if (as === 0) soft = false
  return { total, soft, as: soft ? as : 0, bust: total > 21, blackjack: (kartu || []).length === 2 && total === 21 }
}

/**
 * Mulai ronde blackjack.
 * @returns {object} sesi { sepatu, idx, pemain, bandar, bet, fase, ganda, mulai }
 */
export function mulaiBlackjack (bet, rng = Math.random, prev = null) {
  /* `prev` = { sepatu, idx } dari ronde sebelumnya supaya sepatu benar-benar
     terpakai berurutan (reshuffle otomatis saat sisa < 60 kartu) */
  let sepatu = prev && Array.isArray(prev.sepatu) ? prev.sepatu.slice() : null
  let idx = prev && Number.isFinite(Number(prev.idx)) ? Math.max(0, Math.floor(Number(prev.idx))) : 0
  if (!sepatu || sepatu.length - idx < 60) { sepatu = buatSepatu(4, rng); idx = 0 }
  const ambil = n => { const out = sepatu.slice(idx, idx + n); idx += n; return out }
  const pemain = ambil(1).concat(ambil(1))
  const bandar = ambil(1).concat(ambil(1))
  const sesi = {
    sepatu, idx, pemain, bandar, bet: Math.max(0, angka(bet)), fase: 'main',
    ganda: false, mulai: Date.now(), asuransi: false
  }
  const np = nilaiTangan(pemain), nb = nilaiTangan(bandar)
  if (np.blackjack || nb.blackjack) sesi.fase = 'buka'
  void nb
  return sesi
}

/**
 * Jalankan satu aksi: 'hit' | 'stand' | 'double'.
 * `double` menggandakan taruhan & hanya boleh dengan 2 kartu dan saldo cukup.
 * @returns {object} { sesi, error?, aksi }
 */
export function langkahBlackjack (sesi, aksi, opt = {}) {
  if (!sesi || sesi.fase !== 'main') return { sesi, error: 'Tidak ada ronde aktif' }
  if (Date.now() - (sesi.mulai || 0) > UMUR_SESI) return { sesi: { ...sesi, fase: 'hangus' }, error: 'Sesi blackjack sudah hangus (lebih dari 10 menit). Mulai lagi dengan `.blackjack21 <taruhan>`' }
  const a = String(aksi || '').toLowerCase()
  const ambilKartu = () => {
    if (sesi.idx >= sesi.sepatu.length - 10) { sesi.sepatu = buatSepatu(4, opt.rng || Math.random); sesi.idx = 0 }
    return sesi.sepatu[sesi.idx++]
  }
  if (a === 'hit' || a === 'h' || a === 'tambah') {
    if (sesi.ganda) return { sesi, error: 'Setelah DOUBLE tidak boleh hit lagi' }
    sesi.pemain.push(ambilKartu())
    if (nilaiTangan(sesi.pemain).bust) sesi.fase = 'buka'
    return { sesi, aksi: 'hit', kartu: sesi.pemain[sesi.pemain.length - 1] }
  }
  if (a === 'double' || a === 'd' || a === 'ganda') {
    if (sesi.pemain.length !== 2) return { sesi, error: 'DOUBLE hanya boleh dengan 2 kartu awal' }
    if (nilaiTangan(sesi.pemain).total < MIN_DOUBLE) return { sesi, error: `DOUBLE hanya boleh jika total ≥ ${MIN_DOUBLE}` }
    if ((Number(opt.saldo) || 0) < sesi.bet) return { sesi, error: 'Saldo tidak cukup untuk menggandakan taruhan' }
    sesi.ganda = true
    sesi.bet *= 2
    sesi.pemain.push(ambilKartu())
    if (nilaiTangan(sesi.pemain).bust) { sesi.fase = 'buka'; return { sesi, aksi: 'double' } }
    mainBandar(sesi, ambilKartu)
    return { sesi, aksi: 'double' }
  }
  if (a === 'stand' || a === 's' || a === 'tahan' || a === 'cukup') {
    mainBandar(sesi, ambilKartu)
    return { sesi, aksi: 'stand' }
  }
  return { sesi, error: 'Aksi tidak dikenal. Pakai `.hit`, `.stand`, atau `.double`' }
}

/** bandar main otomatis: tarik sampai ≥17 (stand on all 17) */
export function mainBandar (sesi, ambilKartu) {
  sesi.fase = 'buka'
  const np = nilaiTangan(sesi.pemain)
  if (np.bust) return sesi
  let guard = 0
  while (nilaiTangan(sesi.bandar).total < 17 && guard++ < 12) sesi.bandar.push(ambilKartu())
  return sesi
}

/** tentukan hasil & pembayaran setelah kedua tangan dibuka */
export function hitungBlackjack (sesi, opt = {}) {
  const p = nilaiTangan(sesi.pemain), b = nilaiTangan(sesi.bandar)
  const bet = Math.max(0, angka(sesi.bet))
  let hasil = 'kalah', kali = 0, ket = ''
  if (p.blackjack && !b.blackjack) { hasil = 'blackjack'; ket = 'BLACKJACK! 21 dengan 2 kartu' }
  else if (p.bust) { hasil = 'bust'; ket = `Kamu lewat 21 (${p.total})` }
  else if (b.bust) { hasil = 'menang'; ket = `Bandar lewat 21 (${b.total})` }
  else if (p.total > b.total) { hasil = 'menang'; ket = `${p.total} vs ${b.total}` }
  else if (p.total < b.total) { hasil = 'kalah'; ket = `${p.total} vs ${b.total}` }
  else { hasil = 'seri'; ket = `Seri ${p.total}` }
  if (hasil === 'blackjack') kali = BAYAR_BLACKJACK
  else if (hasil === 'menang') kali = BAYAR_MENANG
  else if (hasil === 'seri') kali = BAYAR_SERI
  const bonusKoin = kaliBonus(opt, hasil === 'blackjack')
  const bayar = capBayar(bet * kali * bonusKoin)
  return {
    hasil, bayar, kali: bulat2(kali * bonusKoin), bonusKoin: bulat2(bonusKoin),
    untung: bayar - bet, pemain: p, bandar: b, ket,
    pemainTotal: p.total, bandarTotal: b.total, soft: p.soft
  }
}

/* ================================================================== */
/*  STATISTIK PER GAME (disimpan di r.kasino)                          */
/* ================================================================== */
const BENTUK_STAT = () => ({ main: 0, menang: 0, taruhan: 0, hasil: 0, terbaik: 0, bet: DEFAULT_BET, riwayat: [] })

/** siapkan/migrasi objek r.kasino (semua game kasino RPG) */
/** key statistik per game (dipakai plugin features/casinorpg.js) */
export const GAME_KASINO = ['rolet', 'dadukoin', 'aviatorrpg', 'keno', 'blackjack21']

export function siapkanKasino (r) {
  if (!r.kasino || typeof r.kasino !== 'object') r.kasino = {}
  const k = r.kasino
  for (const g of GAME_KASINO) {
    if (!k[g] || typeof k[g] !== 'object') k[g] = BENTUK_STAT()
    const s = k[g]
    s.main = angka(s.main); s.menang = angka(s.menang); s.taruhan = angka(s.taruhan)
    s.hasil = angka(s.hasil); s.terbaik = angka(s.terbaik)
    s.bet = Math.max(MIN_BET, Math.min(MAX_BET, angka(s.bet, DEFAULT_BET)))
    if (!Array.isArray(s.riwayat)) s.riwayat = []
    s.riwayat = s.riwayat.filter(x => x && typeof x === 'object').map(x => ({
      l: String(x.l || '').slice(0, 22), b: angka(x.b), h: angka(x.h), w: angka(x.w, Date.now())
    })).slice(0, 8)
  }
  if (!k.sesi || typeof k.sesi !== 'object') k.sesi = null
  return k
}

/** catat satu ronde ke statistik + riwayat (tahan input kosong/rusak) */
export function catatKasino (s, opt) {
  if (!s || typeof s !== 'object') return s
  const { label, bet, bayar } = opt || {}
  if (!Array.isArray(s.riwayat)) s.riwayat = []
  const b = Math.max(0, angka(bet))
  const h = Math.max(0, angka(bayar))
  s.main++
  s.taruhan += b
  s.hasil += h
  s.bet = b || s.bet
  if (h > b) s.menang++
  if (h > s.terbaik) s.terbaik = h
  s.riwayat = [{ l: String(label || '').slice(0, 22), b, h: h - b, w: Date.now() }, ...(s.riwayat || [])].slice(0, 8)
  return s
}

/** ringkasan statistik untuk `.kasinoinfo` */
export function ringkasKasino (k) {
  const out = {}
  let taruhan = 0, hasil = 0, main = 0
  for (const [g, s] of Object.entries(k || {})) {
    if (!GAME_KASINO.includes(g) || !s || typeof s !== 'object') continue
    out[g] = {
      main: s.main || 0, menang: s.menang || 0, taruhan: s.taruhan || 0, hasil: s.hasil || 0,
      terbaik: s.terbaik || 0, bet: s.bet || DEFAULT_BET,
      untung: (s.hasil || 0) - (s.taruhan || 0),
      rtp: s.taruhan ? Math.round(((s.hasil || 0) / s.taruhan) * 1000) / 10 : 0
    }
    taruhan += s.taruhan || 0; hasil += s.hasil || 0; main += s.main || 0
  }
  out.total = { main, taruhan, hasil, untung: hasil - taruhan, rtp: taruhan ? Math.round((hasil / taruhan) * 1000) / 10 : 0 }
  return out
}

/** format label hasil untuk riwayat */
export const labelRolet = (n, taruhan) => `${n}${warnaRolet(n)[0].toUpperCase()} ${taruhan.label}`.slice(0, 22)
export const labelDadu = (dadu, taruhan) => `${dadu.join('+')} ${taruhan.label}`.slice(0, 22)
export const labelAviator = (h) => `×${h.crash} tgt ×${h.target}`.slice(0, 22)
export const labelKeno = (h) => `${h.jumlahKena}/${h.jumlahPilih} keno`.slice(0, 22)
export const labelBlackjack = (h) => h.hasil.slice(0, 22)
