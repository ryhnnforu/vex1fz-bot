/**
 * ============================================================
 *  lib/fancyfont.js — GENERATOR NAMA DENGAN FONT UNICODE (v7.7)
 * ------------------------------------------------------------
 *  Dipakai perintah .cn ("costum name"): mengubah NAMA ORANG
 *  (bukan nama grup!) menjadi puluhan gaya font unicode yang
 *  tinggal disalin lalu dipakai sebagai nama profil / nama
 *  panggilan. Murni pemetaan karakter — tanpa jaringan.
 * ============================================================
 */

const run = (start, len) => Array.from({ length: len }, (_, i) => String.fromCodePoint(start + i))

const A_UP = run(0x41, 26)
const A_LO = run(0x61, 26)
const A_DG = run(0x30, 10)

/**
 * Bangun pemetaan karakter → glyph gaya.
 * @param {object} o { up:[26], lo:[26], dig:[10], holesUp:{}, holesLo:{} }
 */
function buatMap ({ up, lo, dig = null, holesUp = {}, holesLo = {} }) {
  const map = {}
  A_UP.forEach((ch, i) => { map[ch] = holesUp[ch] || (up && up[i]) || ch })
  A_LO.forEach((ch, i) => { map[ch] = holesLo[ch] || (lo && lo[i]) || ch })
  A_DG.forEach((ch, i) => { map[ch] = (dig && dig[i]) || ch })
  return map
}

const terapkan = (map, teks) => [...String(teks)].map(ch => map[ch] || ch).join('')

/* -------- gaya berbasis matematis alfanumerik (Unicode) -------- */
const MAPS = {
  'Serif Tebal': buatMap({ up: run(0x1D400, 26), lo: run(0x1D41A, 26), dig: run(0x1D7CE, 10) }),
  'Serif Miring': buatMap({ up: run(0x1D434, 26), lo: run(0x1D44E, 26), holesLo: { h: 'ℎ' } }),
  'Serif Tebal Miring': buatMap({ up: run(0x1D468, 26), lo: run(0x1D482, 26) }),
  'Tulisan Tangan': buatMap({
    up: run(0x1D49C, 26), lo: run(0x1D4B6, 26),
    holesUp: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' },
    holesLo: { e: 'ℯ', g: 'ℊ', o: 'ℴ' }
  }),
  'Tulisan Tangan Tebal': buatMap({ up: run(0x1D4D0, 26), lo: run(0x1D4EA, 26) }),
  'Gotik': buatMap({
    up: run(0x1D504, 26), lo: run(0x1D51E, 26),
    holesUp: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }
  }),
  'Gotik Tebal': buatMap({ up: run(0x1D56C, 26), lo: run(0x1D586, 26) }),
  'Garis Ganda': buatMap({
    up: run(0x1D538, 26), lo: run(0x1D552, 26), dig: run(0x1D7D8, 10),
    holesUp: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
  }),
  'Sans': buatMap({ up: run(0x1D5A0, 26), lo: run(0x1D5BA, 26) }),
  'Sans Tebal': buatMap({ up: run(0x1D5D4, 26), lo: run(0x1D5EE, 26), dig: run(0x1D7EC, 10) }),
  'Sans Miring': buatMap({ up: run(0x1D608, 26), lo: run(0x1D622, 26) }),
  'Sans Tebal Miring': buatMap({ up: run(0x1D63C, 26), lo: run(0x1D656, 26) }),
  'Mesin Ketik': buatMap({ up: run(0x1D670, 26), lo: run(0x1D68A, 26), dig: run(0x1D7F6, 10) }),
  'Lebar Penuh': buatMap({ up: run(0xFF21, 26), lo: run(0xFF41, 26), dig: run(0xFF10, 10) }),
  Bulat: buatMap({
    up: run(0x24B6, 26), lo: run(0x24D0, 26),
    dig: ['⓪', ...run(0x2460, 9)]
  }),
  'Bulat Gelap': buatMap({ up: run(0x1F150, 26), lo: run(0x1F150, 26) }),
  Kotak: buatMap({ up: run(0x1F130, 26), lo: run(0x1F130, 26) }),
  'Kotak Gelap': buatMap({ up: run(0x1F170, 26), lo: run(0x1F170, 26) }),
  'Kotak Biru': buatMap({ up: run(0x1F1E6, 26), lo: run(0x1F1E6, 26) }),
  Mungil: buatMap({
    up: [...'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'],
    lo: [...'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ']
  })
}

/* -------- gaya berbasis combining mark (garis dsb.) -------- */
const GARIS_BAWAH = '̲'
const CORET = '̶'
const GARIS_ATAS = '̅'
const PAYUNG = '⃠' // eslint-disable-line no-unused-vars
const kombin = mark => teks => [...String(teks)].map(ch => (ch === ' ' ? ch : ch + mark)).join('')

/* -------- gaya hiasan pinggir (populer utk nama game/WA) -------- */
const hias = (kiri, kanan = kiri) => teks => `${kiri} ${teks} ${kanan}`

/**
 * Semua gaya yang tersedia.
 * @returns {Array<{nama:string, fn:(t:string)=>string}>}
 */
export function daftarGaya () {
  const out = Object.entries(MAPS).map(([nama, map]) => ({ nama, fn: t => terapkan(map, t) }))
  out.push(
    { nama: 'Garis Bawah', fn: kombin(GARIS_BAWAH) },
    { nama: 'Dicoret', fn: kombin(CORET) },
    { nama: 'Garis Atas', fn: kombin(GARIS_ATAS) },
    { nama: 'Hias Mahkota', fn: hias('꧁👑', '👑꧂') },
    { nama: 'Hias Bintang', fn: hias('★彡', '彡★') },
    { nama: 'Hias Pita', fn: hias('×͜×', '×͜×') },
    { nama: 'Hias Bunga', fn: hias('✿', '✿') },
    { nama: 'Hias Naga', fn: hias('꧁☬', '☬꧂') },
    { nama: 'Hias Petir', fn: hias('⚡•', '•⚡') },
    { nama: 'Hias Buku', fn: hias('『', '』') },
    { nama: 'Hias Panah', fn: hias('➳', '➳') },
    { nama: 'Hias Musik', fn: hias('♪', '♪') },
    { nama: 'Hias Moncar', fn: t => `꧁༺ ${t} ༻꧂` },
    { nama: 'Hias Titik', fn: t => `•${String(t).split('').join('•')}•` }
  )
  return out
}

/**
 * Ubah satu nama ke SEMUA gaya.
 * @param {string} nama
 * @param {number} [maks] batasi jumlah gaya (0 = semua)
 * @returns {Array<{nama:string, teks:string}>}
 */
export function gayaNama (nama, maks = 0) {
  const bersih = String(nama || '').replace(/\s+/g, ' ').trim().slice(0, 30)
  const gaya = daftarGaya()
  return (maks > 0 ? gaya.slice(0, maks) : gaya).map(g => ({ nama: g.nama, teks: g.fn(bersih) }))
}

/** satu gaya tertentu (cari longgar berdasar nama) */
export function gayaTertentu (nama, gaya) {
  const g = daftarGaya().find(x => x.nama.toLowerCase().includes(String(gaya || '').toLowerCase()))
  if (!g) return null
  return { nama: g.nama, teks: g.fn(String(nama || '').trim().slice(0, 30)) }
}

export default { gayaNama, gayaTertentu, daftarGaya }
