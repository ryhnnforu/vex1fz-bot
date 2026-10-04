/**
 * 🤖 AIRICH LAB (v7) — 12 GAME PLAY lewat AIRichResponseMessage
 * ------------------------------------------------------------
 *  Semua game di sini memakai engine lib/airichgame.js:
 *   • papan/soal dirender sebagai AI Rich (teks + tabel + tip)
 *   • jawaban berupa PILL (addSuggest) yang bisa DIKETUK, atau diketik manual
 *   • tiap langkah di-LIVE EDIT di pesan yang sama (tidak spam chat)
 *   • device yang tidak mendukung AI Rich otomatis dapat versi teks
 *   • taruhan & hadiah pakai ekonomi RPG (koin + EXP) → saling terhubung
 *
 *  Game di file ini: Minesweeper, 2048, Memory, Ular Tangga, Connect Four,
 *  Blackjack, Roulette, Slot, Dadu Duel, Higher-Lower, Math Sprint, Reaction.
 */
import { config } from '../config.js'
import { truncate } from '../lib/functions.js'
import { getRPG } from '../lib/rpg.js'
import {
  daftarGame, mulaiGame, getS, clearLab, refresh, selesai, hadiah,
  bar, acak, rint, fmtKoin, kepala, getStat
} from '../lib/airichgame.js'

const P = config.display.prefix
const K = m => m.senderKey || m.sender

/* ================================================================== */
/*  UTIL TARUHAN (ekonomi RPG)                                         */
/* ================================================================== */
function uangKu (m) { try { return getRPG(K(m)).money || 0 } catch { return 0 } }

function parseTaruhan (m, minimum = 100) {
  const angka = parseInt(String(m.args?.[0] || m.q || '').replace(/[^\d]/g, ''), 10)
  if (!angka || angka < minimum) return null
  return angka
}

function pasang (m, jumlah) {
  if (!jumlah) return { ok: false, teks: `💰 Sebutkan taruhan minimal 100 koin.` }
  const punya = uangKu(m)
  if (jumlah > punya) return { ok: false, teks: `❌ Koin kurang: punya ${fmtKoin(punya)}, butuh ${fmtKoin(jumlah)}.` }
  hadiah(m, -jumlah, 0)
  return { ok: true, teks: `💰 Taruhan dipasang: *${fmtKoin(jumlah)}* koin.` }
}

const KARTU = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SIMBOL = ['♠', '♥', '♦', '♣']
const dekBaru = () => acak(SIMBOL.flatMap(s => KARTU.map(k => ({ s, k })))).map(c => `${c.k}${c.s}`)
const nilaiKartu = c => { const k = c.replace(/[♠♥♦♣]/g, ''); return k === 'A' ? 11 : ['K', 'Q', 'J'].includes(k) ? 10 : parseInt(k, 10) }

/* ================================================================== */
/*  1. 💣 MINESWEEPER 4×4                                              */
/* ================================================================== */
const MINE_LABEL = i => String.fromCharCode(65 + (i % 4)) + (Math.floor(i / 4) + 1)
const mineParse = t => {
  const m1 = t.match(/^([a-d])\s*([1-4])$/)
  if (m1) return (parseInt(m1[2], 10) - 1) * 4 + (m1[1].charCodeAt(0) - 97)
  const n = parseInt(t, 10)
  if (n >= 1 && n <= 16) return n - 1
  return -1
}
const tetangga = i => {
  const x = i % 4, y = Math.floor(i / 4), out = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy
    if ((dx || dy) && nx >= 0 && nx < 4 && ny >= 0 && ny < 4) out.push(ny * 4 + nx)
  }
  return out
}

daftarGame('mine', {
  nama: '💣 Minesweeper',
  cmd: 'airichmine',
  init: (m, opt) => {
    const bom = acak([...Array(16).keys()]).slice(0, 3)
    return { bom, buka: [], langkah: 0, taruhan: parseTaruhan(m) || 0 }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '💣 *MINESWEEPER AIRICH*  ·  4×4, 3 ranjau'))
    const rows = [['', 'A', 'B', 'C', 'D']]
    for (let y = 0; y < 4; y++) {
      const r = [String(y + 1)]
      for (let x = 0; x < 4; x++) {
        const i = y * 4 + x
        if (!s.buka.includes(i)) r.push('⬜')
        else if (s.bom.includes(i)) r.push('💥')
        else { const n = tetangga(i).filter(t => s.bom.includes(t)).length; r.push(n ? String(n) : '🟩') }
      }
      rows.push(r)
    }
    rich.addTable(rows)
    rich.addText(`Langkah: ${s.langkah}/13 · Terbuka: ${s.buka.length}/16${s.taruhan ? ` · 🎯 Taruhan ${fmtKoin(s.taruhan)}` : ''}`)
  },
  teks: s => {
    let out = '💣 MINESWEEPER 4×4 (3 ranjau)\n  A B C D\n'
    for (let y = 0; y < 4; y++) {
      out += (y + 1) + ' '
      for (let x = 0; x < 4; x++) {
        const i = y * 4 + x
        out += (!s.buka.includes(i) ? '⬜' : s.bom.includes(i) ? '💥' : (tetangga(i).filter(t => s.bom.includes(t)).length || '🟩')) + ' '
      }
      out += '\n'
    }
    return out + `Langkah ${s.langkah}/13`
  },
  pill: s => [...Array(16).keys()].filter(i => !s.buka.includes(i)).slice(0, 12).map(MINE_LABEL),
  tip: 'Buka sel aman. Angka = jumlah ranjau di sekitarnya. Ketuk pill atau ketik misal "B3".',
  async jawab (m, s, low) {
    const i = mineParse(low)
    if (i < 0 || s.buka.includes(i)) return false
    s.buka.push(i); s.langkah++
    if (s.bom.includes(i)) {
      await refresh(m, s, '💥 *BOOM!* Kamu kena ranjau.')
      return selesai(m, s, { judul: 'Minesweeper — kena ranjau', hasil: 'kalah', skor: s.langkah, teks: `Ranjau di ${MINE_LABEL(i)}.` })
    }
    if (s.buka.length === 13) {
      const bonus = Math.max(0, 400 - s.langkah * 20)
      await refresh(m, s, '🎉 Semua sel aman terbuka!')
      return selesai(m, s, { judul: 'Minesweeper — BERHASIL!', hasil: 'menang', skor: bonus + 100, koin: 500 + bonus + s.taruhan * 2, exp: 40, teks: `Selesai dalam ${s.langkah} langkah.` })
    }
    const n = tetangga(i).filter(t => s.bom.includes(t)).length
    return refresh(m, s, n ? `🔢 ${MINE_LABEL(i)}: ada *${n}* ranjau di sekitar.` : `🟩 ${MINE_LABEL(i)} aman.`)
  }
})

/* ================================================================== */
/*  2. 🔢 2048                                                         */
/* ================================================================== */
const gridKeBaris = g => [0, 1, 2, 3].map(y => [0, 1, 2, 3].map(x => g[y * 4 + x]))
function geser (g, arah) {
  let grid = g.slice(), gerak = false, tambah = 0
  const putar = (arr, kali) => { let a = arr.slice(); for (let i = 0; i < kali; i++) a = rotasi(a); return a }
  function rotasi (arr) { // putar 90° searah jarum jam
    const out = Array(16).fill(0)
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) out[x * 4 + (3 - y)] = arr[y * 4 + x]
    return out
  }
  const kali = { kiri: 0, atas: 1, kanan: 2, bawah: 3 }[arah] ?? 0
  grid = putar(grid, kali)
  for (let y = 0; y < 4; y++) {
    let baris = [0, 1, 2, 3].map(x => grid[y * 4 + x]).filter(v => v)
    for (let i = 0; i < baris.length - 1; i++) {
      if (baris[i] === baris[i + 1]) { baris[i] *= 2; tambah += baris[i]; baris.splice(i + 1, 1) }
    }
    while (baris.length < 4) baris.push(0)
    for (let x = 0; x < 4; x++) { if (grid[y * 4 + x] !== baris[x]) gerak = true; grid[y * 4 + x] = baris[x] }
  }
  for (let i = 0; i < (4 - kali) % 4; i++) grid = rotasi(grid)
  return { grid, gerak, tambah }
}
const taruhAcak = g => {
  const kosong = g.map((v, i) => v ? -1 : i).filter(i => i >= 0)
  if (!kosong.length) return g
  const i = kosong[Math.floor(Math.random() * kosong.length)]
  g[i] = Math.random() < 0.9 ? 2 : 4
  return g
}
const bisaGerak = g => ['kiri', 'kanan', 'atas', 'bawah'].some(a => geser(g, a).gerak)

daftarGame('g2048', {
  nama: '🔢 2048',
  cmd: 'airich2048',
  init: () => { const g = Array(16).fill(0); taruhAcak(g); taruhAcak(g); return { grid: g, skor: 0, langkah: 0 } },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🔢 *2048 AIRICH*'))
    rich.addTable([['', '1', '2', '3', '4'], ...gridKeBaris(s.grid).map((r, i) => [String(i + 1), ...r.map(v => v || '·')])])
    rich.addText(`Skor: *${s.skor}* · Langkah: ${s.langkah} · Target: 2048`)
  },
  teks: s => `🔢 2048 — skor ${s.skor}, langkah ${s.langkah}\n` + gridKeBaris(s.grid).map(r => r.map(v => String(v || '·').padStart(5)).join('')).join('\n'),
  pill: () => ['⬅️ Kiri', '⬆️ Atas', '➡️ Kanan', '⬇️ Bawah'],
  tip: 'Gabungkan angka yang sama. Ketuk arah atau ketik: kiri / kanan / atas / bawah.',
  async jawab (m, s, low) {
    const arah = /kiri|⬅|left|^a$/.test(low) ? 'kiri' : /kanan|➡|right|^d$/.test(low) ? 'kanan'
      : /atas|⬆|up|^w$/.test(low) ? 'atas' : /bawah|⬇|down|^s$/.test(low) ? 'bawah' : null
    if (!arah) return false
    const { grid, gerak, tambah } = geser(s.grid, arah)
    if (!gerak) return refresh(m, s, `↩️ Tidak bisa geser ke *${arah}*.`)
    s.grid = taruhAcak(grid); s.skor += tambah; s.langkah++
    if (s.grid.includes(2048)) {
      await refresh(m, s, '🎉 Kamu membuat *2048*!')
      return selesai(m, s, { judul: '2048 — MENANG!', hasil: 'menang', skor: s.skor, koin: 2048, exp: 120, teks: `Skor akhir ${s.skor} dalam ${s.langkah} langkah.` })
    }
    if (!bisaGerak(s.grid)) {
      await refresh(m, s, '🚫 Tidak ada langkah tersisa.')
      return selesai(m, s, { judul: '2048 — papan penuh', hasil: 'kalah', skor: s.skor, koin: Math.floor(s.skor / 4), exp: Math.floor(s.skor / 40), teks: `Skor ${s.skor} dalam ${s.langkah} langkah.` })
    }
    return refresh(m, s, tambah ? `✨ Gabung! +${tambah} poin (geser ${arah}).` : `➡️ Geser ${arah}.`)
  }
})

/* ================================================================== */
/*  3. 🃏 MEMORY MATCH                                                 */
/* ================================================================== */
const EMOJI_MEM = ['🍎', '🍌', '🍇', '🍓', '🍑', '🥝', '🍉', '🍒']
daftarGame('memory', {
  nama: '🃏 Memory Match',
  cmd: 'airichmemory',
  init: () => {
    const pasangan = acak(EMOJI_MEM).slice(0, 6)
    return { kartu: acak([...pasangan, ...pasangan]), buka: [], cocok: [], coba: 0 }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🃏 *MEMORY MATCH*  ·  cari 6 pasang'))
    const rows = []
    for (let y = 0; y < 3; y++) {
      const r = []
      for (let x = 0; x < 4; x++) {
        const i = y * 4 + x
        r.push(s.cocok.includes(i) || s.buka.includes(i) ? s.kartu[i] : '❓')
      }
      rows.push(r)
    }
    rich.addTable([['1', '2', '3', '4'], ...rows.map((r, i) => [`${i + 1}`, ...r])])
    rich.addText(`Pasang: ${s.cocok.length / 2}/6 · Percobaan: ${s.coba}`)
  },
  teks: s => `🃏 MEMORY MATCH — pasang ${s.cocok.length / 2}/6, coba ${s.coba}\n` +
    [0, 1, 2].map(y => [0, 1, 2, 3].map(x => { const i = y * 4 + x; return (s.cocok.includes(i) || s.buka.includes(i)) ? s.kartu[i] : '❓' }).join(' ')).join('\n'),
  pill: s => [...Array(12).keys()].filter(i => !s.cocok.includes(i)).slice(0, 12).map(i => `Kartu ${i + 1}`),
  tip: 'Buka 2 kartu. Kalau sama → jadi pasang. Ketik nomor kartu, misal "3".',
  async jawab (m, s, low) {
    const n = parseInt(low.replace(/\D/g, ''), 10)
    if (!n || n < 1 || n > 12) return false
    const i = n - 1
    if (s.cocok.includes(i) || s.buka.includes(i)) return false
    s.buka.push(i)
    if (s.buka.length === 1) return refresh(m, s, `🔎 Kartu ${n}: ${s.kartu[i]}. Pilih satu lagi.`)
    s.coba++
    const [a, b] = s.buka
    if (s.kartu[a] === s.kartu[b]) {
      s.cocok.push(a, b); s.buka = []
      if (s.cocok.length === 12) {
        const skor = Math.max(60, 300 - s.coba * 15)
        await refresh(m, s, '🎉 Semua pasangan ditemukan!')
        return selesai(m, s, { judul: 'Memory Match — SELESAI!', hasil: 'menang', skor, koin: 300 + skor, exp: 45, teks: `${s.coba} percobaan.` })
      }
      return refresh(m, s, `✅ Cocok! ${s.kartu[a]} ${s.kartu[b]}`)
    }
    s.buka = []
    return refresh(m, s, `❌ Tidak sama: ${s.kartu[a]} vs ${s.kartu[b]}. Ingat posisinya!`)
  }
})

/* ================================================================== */
/*  4. 🐍 ULAR TANGGA (vs bot)                                         */
/* ================================================================== */
const TANGGA = { 2: 15, 9: 21, 20: 29, 28: 33 }
const ULAR = { 17: 7, 24: 12, 31: 19, 35: 27 }
daftarGame('ular', {
  nama: '🐍 Ular Tangga',
  cmd: 'airichular',
  init: () => ({ kamu: 0, bot: 0, giliran: 1, log: [], taruhan: 0 }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🐍 *ULAR TANGGA AIRICH*  ·  papan 36 kotak'))
    const rows = []
    for (let y = 5; y >= 0; y--) {
      const r = []
      for (let x = 0; x < 6; x++) {
        const n = y * 6 + x + 1
        let isi = String(n)
        if (s.kamu === n && s.bot === n) isi = '👤🤖'
        else if (s.kamu === n) isi = '👤'
        else if (s.bot === n) isi = '🤖'
        else if (TANGGA[n]) isi = `🪜${n}`
        else if (ULAR[n]) isi = `🐍${n}`
        r.push(isi)
      }
      rows.push(r)
    }
    rich.addTable(rows)
    rich.addText(`👤 Kamu: kotak *${s.kamu}* ${bar(s.kamu, 36)}\n🤖 Bot : kotak *${s.bot}* ${bar(s.bot, 36)}`)
    if (s.log.length) rich.addText(s.log.slice(0, 3).join('\n'))
  },
  teks: s => `🐍 ULAR TANGGA\n👤 Kamu: ${s.kamu}/36\n🤖 Bot : ${s.bot}/36\n${s.log.slice(0, 3).join('\n')}`,
  pill: () => ['🎲 Lempar dadu'],
  tip: 'Siapa dulu sampai kotak 36 menang. 🪜 tangga naik, 🐍 ular turun.',
  async jawab (m, s, low) {
    if (!/dadu|🎲|roll|lempar|kocok/.test(low)) return false
    s.log = []
    const jalan = (siapa, pos) => {
      const d = rint(1, 6)
      let baru = Math.min(36, pos + d)
      s.log.push(`${siapa === 'kamu' ? '👤' : '🤖'} dadu ${d} → kotak ${baru}`)
      if (TANGGA[baru]) { s.log.push(`${siapa === 'kamu' ? '🪜' : '🪜'} Naik tangga ke ${TANGGA[baru]}!`); baru = TANGGA[baru] }
      else if (ULAR[baru]) { s.log.push(`🐍 Digigit ular, turun ke ${ULAR[baru]}.`); baru = ULAR[baru] }
      return baru
    }
    s.kamu = jalan('kamu', s.kamu)
    if (s.kamu >= 36) {
      await refresh(m, s, '🏁 Kamu sampai finish!')
      return selesai(m, s, { judul: 'Ular Tangga — KAMU MENANG', hasil: 'menang', skor: 36 - s.bot, koin: 800 + s.taruhan * 2, exp: 50 })
    }
    s.bot = jalan('bot', s.bot)
    if (s.bot >= 36) {
      await refresh(m, s, '🏁 Bot sampai finish duluan.')
      return selesai(m, s, { judul: 'Ular Tangga — bot menang', hasil: 'kalah', skor: s.kamu, teks: `Kamu di kotak ${s.kamu}.` })
    }
    s.giliran++
    return refresh(m, s, '')
  }
})

/* ================================================================== */
/*  5. 🔴 CONNECT FOUR (vs bot)                                        */
/* ================================================================== */
const C4_MENANG = (() => {
  const garis = []
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
    if (c <= 3) garis.push([0, 1, 2, 3].map(i => r * 7 + c + i))
    if (r <= 2) garis.push([0, 1, 2, 3].map(i => (r + i) * 7 + c))
    if (r <= 2 && c <= 3) garis.push([0, 1, 2, 3].map(i => (r + i) * 7 + c + i))
    if (r >= 3 && c <= 3) garis.push([0, 1, 2, 3].map(i => (r - i) * 7 + c + i))
  }
  return garis
})()
const c4Cek = (papan, p) => C4_MENANG.some(g => g.every(i => papan[i] === p))
const c4Jatuh = (papan, kolom, p) => { for (let r = 5; r >= 0; r--) { const i = r * 7 + kolom; if (!papan[i]) { papan[i] = p; return i } } return -1 }
const c4Bot = papan => {
  for (const p of [2, 1]) for (let c = 0; c < 7; c++) {
    const salin = papan.slice(); if (c4Jatuh(salin, c, p) >= 0 && c4Cek(salin, p)) return c
  }
  const tengah = [3, 2, 4, 1, 5, 0, 6].filter(c => !papan[5 * 7 + c])
  return tengah.length ? tengah[0] : -1
}
daftarGame('connect4', {
  nama: '🔴 Connect Four',
  cmd: 'airichconnect',
  init: () => ({ papan: Array(42).fill(0), langkah: 0 }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🔴 *CONNECT FOUR*  ·  susun 4 sejajar'))
    const rows = [['1', '2', '3', '4', '5', '6', '7']]
    for (let r = 0; r < 6; r++) rows.push([0, 1, 2, 3, 4, 5, 6].map(c => s.papan[r * 7 + c] === 1 ? '🔴' : s.papan[r * 7 + c] === 2 ? '🟡' : '⚪'))
    rich.addTable(rows)
    rich.addText(`🔴 kamu vs 🟡 bot · langkah ke-${s.langkah + 1}`)
  },
  teks: s => '🔴 CONNECT FOUR\n1 2 3 4 5 6 7\n' + [0, 1, 2, 3, 4, 5].map(r => [0, 1, 2, 3, 4, 5, 6].map(c => s.papan[r * 7 + c] === 1 ? '🔴' : s.papan[r * 7 + c] === 2 ? '🟡' : '⚪').join('')).join('\n'),
  pill: () => ['1', '2', '3', '4', '5', '6', '7'],
  tip: 'Pilih kolom (1-7). Empat sejajar = menang.',
  async jawab (m, s, low) {
    const c = parseInt(low.replace(/\D/g, ''), 10) - 1
    if (!(c >= 0 && c <= 7)) return false
    if (c4Jatuh(s.papan, c, 1) < 0) return refresh(m, s, '❌ Kolom itu sudah penuh.')
    s.langkah++
    if (c4Cek(s.papan, 1)) {
      await refresh(m, s, '🎉 Empat sejajar!')
      return selesai(m, s, { judul: 'Connect Four — MENANG', hasil: 'menang', skor: 100 - s.langkah, koin: 900, exp: 55 })
    }
    const bc = c4Bot(s.papan)
    if (bc >= 0) { c4Jatuh(s.papan, bc, 2); s.langkah++ }
    if (c4Cek(s.papan, 2)) {
      await refresh(m, s, `🤖 Bot menyusun 4 di kolom ${bc + 1}.`)
      return selesai(m, s, { judul: 'Connect Four — bot menang', hasil: 'kalah', teks: 'Coba lagi, blok lebih awal!' })
    }
    if (s.papan.every(v => v)) { await refresh(m, s, '🤝 Papan penuh.'); return selesai(m, s, { judul: 'Connect Four — seri', hasil: 'seri', skor: 50, koin: 200, exp: 20 }) }
    return refresh(m, s, `🤖 Bot menjatuhkan di kolom *${bc + 1}*.`)
  }
})

/* ================================================================== */
/*  6. 🂡 BLACKJACK                                                    */
/* ================================================================== */
const total21 = kartu => {
  let t = kartu.reduce((a, c) => a + nilaiKartu(c), 0), ace = kartu.filter(c => c.startsWith('A')).length
  while (t > 21 && ace) { t -= 10; ace-- }
  return t
}
daftarGame('blackjack', {
  nama: '🂡 Blackjack',
  cmd: 'airichblackjack',
  init: (m, opt) => {
    const taruhan = parseTaruhan(m) || 500
    const dek = dekBaru()
    return { dek, pemain: [dek.pop(), dek.pop()], bandar: [dek.pop(), dek.pop()], taruhan, ganda: false, fase: 'main' }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🂡 *BLACKJACK AIRICH*'))
    rich.addTable([
      ['Pemain', `🎯 ${s.pemain.length} kartu · *${total21(s.pemain)}*`],
      ['', s.pemain.join(' ')],
      ['Bandar', s.fase === 'main' ? `🂠 ${s.bandar[0]} + ?` : `🎯 ${total21(s.bandar)} · ${s.bandar.join(' ')}`]
    ])
    rich.addText(`💰 Taruhan: *${fmtKoin(s.taruhan)}*${s.ganda ? ' (digandakan)' : ''} · Bayaran 1:1, Blackjack 3:2`)
  },
  teks: s => `🂡 BLACKJACK\nKamu : ${s.pemain.join(' ')} = ${total21(s.pemain)}\nBandar: ${s.fase === 'main' ? s.bandar[0] + ' + ?' : s.bandar.join(' ') + ' = ' + total21(s.bandar)}\nTaruhan ${fmtKoin(s.taruhan)}`,
  pill: s => s.fase === 'main' ? ['🂠 Hit (tambah kartu)', '✋ Stand', ...(s.pemain.length === 2 ? ['💰 Double'] : [])] : ['Main lagi'],
  tip: 'Dekati 21 tanpa lewat. Hit = tambah kartu, Stand = berhenti.',
  async jawab (m, s, low) {
    if (s.fase !== 'main') return false
    const aksi = /hit|tambah|🂠/.test(low) ? 'hit' : /stand|berhenti|cukup|✋/.test(low) ? 'stand' : /double|ganda|💰/.test(low) ? 'double' : null
    if (!aksi) return false
    if (aksi === 'double' && s.pemain.length !== 2) return refresh(m, s, '❌ Double hanya di awal.')
    if (aksi === 'double') {
      if (uangKu(m) < s.taruhan) return refresh(m, s, '❌ Koin tidak cukup untuk double.')
      hadiah(m, -s.taruhan, 0); s.taruhan *= 2; s.ganda = true
      s.pemain.push(s.dek.pop())
      return tungguBandar(m, s)
    }
    if (aksi === 'hit') {
      s.pemain.push(s.dek.pop())
      if (total21(s.pemain) > 21) {
        s.fase = 'selesai'
        await refresh(m, s, '💥 *BUST!* Lewat dari 21.')
        return selesai(m, s, { judul: 'Blackjack — bust', hasil: 'kalah', teks: `Kartu kamu: ${s.pemain.join(' ')} = ${total21(s.pemain)}. Taruhan ${fmtKoin(s.taruhan)} hangus.` })
      }
      if (total21(s.pemain) === 21) return tungguBandar(m, s)
      return refresh(m, s, `🂠 Dapat ${s.pemain.at(-1)} → total ${total21(s.pemain)}.`)
    }
    return tungguBandar(m, s)
  }
})

async function tungguBandar (m, s) {
  s.fase = 'bandar'
  while (total21(s.bandar) < 17) s.bandar.push(s.dek.pop())
  s.fase = 'selesai'
  const pk = total21(s.pemain), bd = total21(s.bandar)
  const bj = s.pemain.length === 2 && pk === 21
  await refresh(m, s, `🤖 Bandar membuka: ${s.bandar.join(' ')} = ${bd}`)
  if (bd > 21 || pk > bd) {
    const bayar = bj ? Math.floor(s.taruhan * 2.5) : s.taruhan * 2
    return selesai(m, s, { judul: bj ? 'BLACKJACK! 🂡' : 'Blackjack — MENANG', hasil: 'menang', skor: pk, koin: bayar, exp: 35, teks: `Kamu ${pk} vs bandar ${bd}. Bayar ${fmtKoin(bayar)} koin.` })
  }
  if (pk === bd) {
    hadiah(m, s.taruhan, 0)
    return selesai(m, s, { judul: 'Blackjack — seri (push)', hasil: 'seri', skor: pk, exp: 10, teks: `Sama-sama ${pk}. Taruhan dikembalikan.` })
  }
  return selesai(m, s, { judul: 'Blackjack — kalah', hasil: 'kalah', teks: `Kamu ${pk} vs bandar ${bd}.` })
}

/* ================================================================== */
/*  7. 🎡 ROULETTE                                                     */
/* ================================================================== */
const MERAH = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
daftarGame('roulette', {
  nama: '🎡 Roulette',
  cmd: 'airichroulette',
  init: (m, opt) => {
    const jenis = String(m.args?.[0] || '').toLowerCase()
    const jumlah = parseInt(String(m.args?.[1] || '').replace(/\D/g, ''), 10) || 0
    return { jenis: ['merah', 'hitam', 'ganjil', 'genap', 'besar', 'kecil'].includes(jenis) ? jenis : (/^\d+$/.test(jenis) ? 'angka' : ''), angka: /^\d+$/.test(jenis) ? parseInt(jenis, 10) : -1, jumlah, riwayat: [] }
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🎡 *ROULETTE AIRICH*'))
    rich.addTable([
      ['Taruhan', 'Bayaran'],
      ['🔴 merah / ⚫ hitam', '2×'], ['ganjil / genap', '2×'], ['kecil 1-18 / besar 19-36', '2×'], ['angka 0-36', '36×']
    ])
    rich.addText(s.jenis && s.jumlah ? `Taruhan: *${s.jenis}${s.jenis === 'angka' ? ' ' + s.angka : ''}* — ${fmtKoin(s.jumlah)} koin` : 'Belum ada taruhan.')
    if (s.riwayat.length) rich.addText('📜 Riwayat: ' + s.riwayat.join(', '))
  },
  teks: s => `🎡 ROULETTE\nTaruhan: ${s.jenis || '-'} ${s.angka >= 0 ? s.angka : ''} — ${fmtKoin(s.jumlah)}\nCara: ${P}airichroulette merah 1000`,
  pill: s => s.jenis && s.jumlah ? ['🎡 Putar sekarang'] : ['🔴 merah 500', '⚫ hitam 500', 'ganjil 500', 'genap 500', 'besar 500', 'kecil 500'],
  tip: 'Pilih taruhan (pill) lalu putar. Contoh ketik: "merah 1000".',
  async jawab (m, s, low) {
    if (!s.jenis || !s.jumlah) {
      const jenis = ['merah', 'hitam', 'ganjil', 'genap', 'besar', 'kecil'].find(j => low.includes(j))
      const angka = low.match(/\b(3[0-6]|[12]?\d)\b(?!\d)/)
      if (!jenis && !/^angka\s+\d+$/.test(low)) {
        if (low.startsWith('angka')) { const a = parseInt(low.replace(/\D/g, ''), 10); if (a >= 0 && a <= 36) { s.jenis = 'angka'; s.angka = a } }
        else return false
      } else if (jenis) s.jenis = jenis
      const jumlah = parseInt(low.replace(/[^\d]/g, ''), 10) || 500
      const p = pasang(m, jumlah)
      if (!p.ok) return refresh(m, s, p.teks)
      s.jumlah = jumlah
      return refresh(m, s, `${p.teks} Sekarang ketuk *Putar*.`)
    }
    if (!/putar|spin|🎡|mulai/.test(low)) return false
    const hasil = rint(0, 36)
    const merah = MERAH.includes(hasil)
    s.riwayat.unshift(`${hasil}${merah ? '🔴' : hasil ? '⚫' : '🟢'}`)
    s.riwayat = s.riwayat.slice(0, 6)
    let menang = false, kali = 0
    if (s.jenis === 'angka') { menang = hasil === s.angka; kali = 36 }
    else if (s.jenis === 'merah') { menang = merah; kali = 2 }
    else if (s.jenis === 'hitam') { menang = hasil !== 0 && !merah; kali = 2 }
    else if (s.jenis === 'ganjil') { menang = hasil !== 0 && hasil % 2 === 1; kali = 2 }
    else if (s.jenis === 'genap') { menang = hasil !== 0 && hasil % 2 === 0; kali = 2 }
    else if (s.jenis === 'kecil') { menang = hasil >= 1 && hasil <= 18; kali = 2 }
    else if (s.jenis === 'besar') { menang = hasil >= 19 && hasil <= 36; kali = 2 }
    await refresh(m, s, `🎡 Bola berhenti di *${hasil}* ${hasil === 0 ? '🟢' : merah ? '🔴' : '⚫'}`)
    return menang
      ? selesai(m, s, { judul: `Roulette — MENANG ${hasil}`, hasil: 'menang', skor: s.jumlah * kali, koin: s.jumlah * kali, exp: 25, teks: `Taruhan ${s.jenis} → bayaran ${fmtKoin(s.jumlah * kali)} koin.` })
      : selesai(m, s, { judul: `Roulette — kalah (${hasil})`, hasil: 'kalah', teks: `Taruhan ${s.jenis}${s.angka >= 0 ? ' ' + s.angka : ''} belum beruntung.` })
  }
})

/* ================================================================== */
/*  8. 🎰 SLOT                                                         */
/* ================================================================== */
const SIMBOL_SLOT = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎']
daftarGame('slot', {
  nama: '🎰 Slot Machine',
  cmd: 'airichslot',
  init: m => ({ taruhan: parseTaruhan(m) || 200, hasil: null }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '🎰 *SLOT AIRICH*'))
    rich.addTable([
      ['Gulungan', (s.hasil || ['❔', '❔', '❔']).join(' | ')],
      ['Bayaran', '3 sama 💎 = 50× · 3 sama = 10× · 2 sama = 2× · 7️⃣7️⃣7️⃣ = 100×']
    ])
    rich.addText(`💰 Taruhan: *${fmtKoin(s.taruhan)}* koin`)
  },
  teks: s => `🎰 SLOT — taruhan ${fmtKoin(s.taruhan)}\n${(s.hasil || ['❔', '❔', '❔']).join(' | ')}`,
  pill: () => ['🎰 PUTAR'],
  tip: `Pasang taruhan: ${P}airichslot 500 lalu ketuk PUTAR.`,
  async jawab (m, s, low) {
    if (!/putar|spin|🎰|go|mulai/.test(low)) return false
    const p = pasang(m, s.taruhan)
    if (!p.ok) return refresh(m, s, p.teks)
    s.hasil = [0, 1, 2].map(() => SIMBOL_SLOT[rint(0, SIMBOL_SLOT.length - 1)])
    const [a, b, c] = s.hasil
    let kali = 0
    if (a === b && b === c) kali = a === '💎' ? 50 : a === '7️⃣' ? 100 : 10
    else if (a === b || b === c || a === c) kali = 2
    await refresh(m, s, `🎰 ${s.hasil.join(' | ')}`)
    return kali
      ? selesai(m, s, { judul: `Slot — ${s.hasil.join('')} MENANG ${kali}×`, hasil: 'menang', skor: s.taruhan * kali, koin: s.taruhan * kali, exp: 20, teks: `Bayaran ${fmtKoin(s.taruhan * kali)} koin.` })
      : selesai(m, s, { judul: 'Slot — belum hoki', hasil: 'kalah', teks: `Taruhan ${fmtKoin(s.taruhan)} hangus. Coba lagi!` })
  }
})

/* ================================================================== */
/*  9. 🎲 DADU DUEL (best of 3)                                        */
/* ================================================================== */
daftarGame('dadu', {
  nama: '🎲 Dadu Duel',
  cmd: 'airichdadu',
  init: m => ({ ronde: 1, kamu: 0, bot: 0, taruhan: parseTaruhan(m) || 300, log: [] }),
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, `🎲 *DADU DUEL*  ·  ronde ${s.ronde}/3`))
    rich.addTable([['Pemain', 'Menang ronde', 'Skor'], ['👤 Kamu', String(s.kamu), '—'], ['🤖 Bot', String(s.bot), '—']])
    if (s.log.length) rich.addText(s.log.slice(0, 4).join('\n'))
    rich.addText(`💰 Taruhan: ${fmtKoin(s.taruhan)} · yang menang 2 ronde dulu = juara`)
  },
  teks: s => `🎲 DADU DUEL ronde ${s.ronde}/3\n👤 ${s.kamu} — 🤖 ${s.bot}\n${s.log.slice(0, 4).join('\n')}`,
  pill: () => ['🎲 Lempar dadu'],
  tip: 'Tiap ronde: dadu terbesar menang. Best of 3.',
  async jawab (m, s, low) {
    if (!/dadu|🎲|lempar|roll/.test(low)) return false
    if (!s.log.length || s.log.length % 1 === 0) {
      const p = pasang(m, s.ronde === 1 ? s.taruhan : 0)
      if (s.ronde === 1 && !p.ok) return refresh(m, s, p.teks)
    }
    const dk = rint(1, 6), db = rint(1, 6)
    s.log.unshift(`Ronde ${s.ronde}: 👤 ${dk} vs 🤖 ${db} → ${dk > db ? 'kamu menang' : dk < db ? 'bot menang' : 'seri'}`)
    if (dk > db) s.kamu++; else if (db > dk) s.bot++
    s.ronde++
    if (s.kamu === 2 || s.bot === 2 || s.ronde > 3) {
      const menang = s.kamu > s.bot
      await refresh(m, s, menang ? '🏆 Kamu juara duel!' : s.kamu === s.bot ? '🤝 Seri.' : '🤖 Bot juara.')
      return selesai(m, s, {
        judul: menang ? 'Dadu Duel — MENANG' : s.kamu === s.bot ? 'Dadu Duel — seri' : 'Dadu Duel — kalah',
        hasil: menang ? 'menang' : s.kamu === s.bot ? 'seri' : 'kalah',
        skor: s.kamu, koin: menang ? s.taruhan * 2 : s.kamu === s.bot ? s.taruhan : 0, exp: menang ? 30 : 10,
        teks: `Skor akhir 👤 ${s.kamu} — 🤖 ${s.bot}`
      })
    }
    return refresh(m, s, '')
  }
})

/* ================================================================== */
/*  10. ⬆️ HIGHER / LOWER                                              */
/* ================================================================== */
daftarGame('highlow', {
  nama: '⬆️ Higher-Lower',
  cmd: 'airichhighlow',
  init: m => ({ dek: dekBaru(), kartu: null, streak: 0, taruhan: parseTaruhan(m) || 300 }),
  render: (rich, s, m) => {
    const now = s.kartu || s.dek.at(-1)
    rich.addText(kepala(m, s, '⬆️ *HIGHER / LOWER*'))
    rich.addTable([['Kartu sekarang', `🂠 ${now} (${nilaiKartu(now)})`], ['Streak', `${s.streak} · pengali ${(Math.pow(1.4, s.streak)).toFixed(2)}×`], ['Sisa kartu', String(s.dek.length)]])
    rich.addText(`💰 Taruhan awal: ${fmtKoin(s.taruhan)} · potensi: *${fmtKoin(s.taruhan * Math.pow(1.4, s.streak))}*`)
  },
  teks: s => `⬆️ HIGHER-LOWER\nKartu: ${s.kartu || s.dek.at(-1)} · streak ${s.streak} · potensi ${fmtKoin(s.taruhan * Math.pow(1.4, s.streak))}`,
  pill: s => s.streak > 0 ? ['⬆️ Lebih tinggi', '⬇️ Lebih rendah', '💰 Ambil untung'] : ['⬆️ Lebih tinggi', '⬇️ Lebih rendah'],
  tip: 'Tebak kartu berikutnya lebih tinggi atau lebih rendah. Semakin panjang streak, semakin besar pengali.',
  async jawab (m, s, low) {
    if (/ambil|cair|cash|stop|💰/.test(low) && s.streak > 0) {
      const bayar = Math.floor(s.taruhan * Math.pow(1.4, s.streak) * 2)
      return selesai(m, s, { judul: `Higher-Lower — ambil untung (streak ${s.streak})`, hasil: 'menang', skor: s.streak, koin: bayar, exp: 20 + s.streak * 5, teks: `Kamu mencairkan ${fmtKoin(bayar)} koin.` })
    }
    const tebak = /tinggi|⬆|naik|higher/.test(low) ? 'naik' : /rendah|⬇|turun|lower/.test(low) ? 'turun' : null
    if (!tebak) return false
    if (!s.kartu) {
      const p = pasang(m, s.taruhan)
      if (!p.ok) return refresh(m, s, p.teks)
      s.kartu = s.dek.pop()
      return refresh(m, s, `🂠 Kartu pertama: ${s.kartu} (${nilaiKartu(s.kartu)}). Tebak kartu berikutnya.`)
    }
    if (!s.dek.length) return selesai(m, s, { judul: 'Higher-Lower — dek habis', hasil: 'menang', skor: s.streak, koin: Math.floor(s.taruhan * Math.pow(1.4, s.streak) * 2), exp: 50 })
    const lama = nilaiKartu(s.kartu)
    const baru = s.dek.pop()
    const benar = tebak === 'naik' ? nilaiKartu(baru) > lama : nilaiKartu(baru) < lama
    if (!benar) {
      await refresh(m, s, `❌ Kartu ${baru} (${nilaiKartu(baru)}) — tebakanmu salah.`)
      return selesai(m, s, { judul: `Higher-Lower — kalah di streak ${s.streak}`, hasil: 'kalah', skor: s.streak, teks: `Kartu ${s.kartu} → ${baru}.` })
    }
    s.kartu = baru; s.streak++
    return refresh(m, s, `✅ Benar! ${baru} (${nilaiKartu(baru)}). Streak ${s.streak}.`)
  }
})

/* ================================================================== */
/*  11. ➗ MATH SPRINT                                                 */
/* ================================================================== */
const bikinSoal = tingkat => {
  const op = tingkat < 3 ? ['+', '-'] : tingkat < 6 ? ['+', '-', '×'] : ['+', '-', '×', '÷']
  const o = op[rint(0, op.length - 1)]
  let a = rint(2, 10 + tingkat * 3), b = rint(2, 10 + tingkat * 2), hasil
  if (o === '+') hasil = a + b
  else if (o === '-') { if (b > a) [a, b] = [b, a]; hasil = a - b }
  else if (o === '×') { a = rint(2, 12); b = rint(2, 12); hasil = a * b }
  else { b = rint(2, 12); hasil = rint(2, 12); a = b * hasil }
  const opsi = acak([hasil, hasil + rint(1, 5), Math.max(0, hasil - rint(1, 5)), hasil + rint(6, 12)])
  const unik = [...new Set(opsi)]
  while (unik.length < 4) unik.push(hasil + unik.length * 3)
  return { soal: `${a} ${o} ${b} = ?`, opsi: unik.slice(0, 4), jawaban: hasil }
}
daftarGame('math', {
  nama: '➗ Math Sprint',
  cmd: 'airichmath',
  init: () => ({ daftar: Array.from({ length: 10 }, (_, i) => bikinSoal(i)), idx: 0, benar: 0, mulai: Date.now() }),
  render: (rich, s, m) => {
    const q = s.daftar[s.idx]
    rich.addText(kepala(m, s, `➗ *MATH SPRINT*  ·  soal ${s.idx + 1}/10`))
    rich.addText(q ? `### ${q.soal}` : 'Selesai.')
    if (q) rich.addTable(q.opsi.map((o, i) => [String.fromCharCode(65 + i), String(o)]))
    rich.addText(`✅ Benar: ${s.benar} · ⏱️ ${Math.round((Date.now() - s.mulai) / 1000)} detik`)
  },
  teks: s => { const q = s.daftar[s.idx]; return q ? `➗ MATH SPRINT ${s.idx + 1}/10\n${q.soal}\n${q.opsi.map((o, i) => String.fromCharCode(65 + i) + '. ' + o).join('\n')}\nBenar ${s.benar}` : 'Selesai.' },
  pill: s => s.daftar[s.idx] ? s.daftar[s.idx].opsi.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`) : [],
  tip: 'Jawab secepat mungkin. Ketuk pilihan atau ketik angkanya langsung.',
  async jawab (m, s, low) {
    const q = s.daftar[s.idx]
    if (!q) return false
    let pick = -1
    const huruf = low.match(/^([a-d])\b/)
    if (huruf) pick = huruf[1].charCodeAt(0) - 97
    else { const n = parseInt(low.replace(/\D/g, ''), 10); pick = q.opsi.indexOf(n); if (pick < 0 && !isNaN(n)) pick = q.opsi.findIndex(o => o === n) }
    if (pick < 0) return false
    const benar = q.opsi[pick] === q.jawaban
    if (benar) s.benar++
    s.idx++
    if (s.idx >= 10) {
      const detik = Math.round((Date.now() - s.mulai) / 1000)
      const skor = s.benar * 100 + Math.max(0, 300 - detik * 5)
      await refresh(m, s, s.benar >= 8 ? '🔥 Luar biasa!' : s.benar >= 5 ? '👍 Lumayan!' : '💪 Terus latihan!')
      return selesai(m, s, { judul: `Math Sprint — ${s.benar}/10 benar`, hasil: s.benar >= 5 ? 'menang' : 'kalah', skor, koin: s.benar * 120, exp: s.benar * 8, teks: `Waktu ${detik} detik.` })
    }
    return refresh(m, s, benar ? `✅ Benar! (${q.jawaban})` : `❌ Salah, jawaban ${q.jawaban}.`)
  }
})

/* ================================================================== */
/*  12. ⚡ REACTION TEST                                               */
/* ================================================================== */
daftarGame('reaction', {
  nama: '⚡ Reaction Test',
  cmd: 'airichreaction',
  init: m => {
    const s = { siapPada: 0, percobaan: 0, hasil: [], jadwal: 0 }
    const jeda = rint(2500, 7000)
    s.jadwal = Date.now() + jeda
    setTimeout(async () => {
      const cur = getS(m.jid)
      if (!cur || cur.kind !== 'reaction' || cur.siapPada) return
      cur.siapPada = Date.now()
      await refresh(m, cur, '⚡ *TANGKAP SEKARANG!*').catch(() => {})
    }, jeda)
    return s
  },
  render: (rich, s, m) => {
    rich.addText(kepala(m, s, '⚡ *REACTION TEST*'))
    rich.addText(s.siapPada ? '## 🟢 TANGKAP!' : '## 🔴 Tunggu warna hijau...')
    rich.addTable([['Percobaan', String(s.percobaan)], ['Terbaik', s.hasil.length ? `${Math.min(...s.hasil)} ms` : '-'], ['Rata-rata', s.hasil.length ? `${Math.round(s.hasil.reduce((a, b) => a + b, 0) / s.hasil.length)} ms` : '-']])
  },
  teks: s => `⚡ REACTION TEST — ${s.siapPada ? 'TANGKAP SEKARANG!' : 'tunggu hijau...'}\nPercobaan ${s.percobaan}, terbaik ${s.hasil.length ? Math.min(...s.hasil) + ' ms' : '-'}`,
  pill: () => ['🖐️ TANGKAP!'],
  tip: 'Jangan ketuk sebelum pesan berubah jadi 🟢. Ketuk secepat mungkin setelahnya!',
  async jawab (m, s, low) {
    if (!/tangkap|🖐|stop|go|klik|tap/.test(low)) return false
    s.percobaan++
    if (!s.siapPada) {
      await refresh(m, s, '❌ *Terlalu cepat!* Tunggu hijau dulu.')
      s.jadwal = Date.now() + rint(2500, 6000)
      const jeda = s.jadwal - Date.now()
      setTimeout(async () => {
        const cur = getS(m.jid)
        if (!cur || cur.kind !== 'reaction' || cur.siapPada) return
        cur.siapPada = Date.now()
        await refresh(m, cur, '⚡ *TANGKAP SEKARANG!*').catch(() => {})
      }, jeda)
      s.siapPada = 0
      return true
    }
    const ms = Date.now() - s.siapPada
    s.hasil.push(ms); s.siapPada = 0
    if (s.percobaan >= 3) {
      const rata = Math.round(s.hasil.reduce((a, b) => a + b, 0) / s.hasil.length)
      const terbaik = Math.min(...s.hasil)
      const skor = Math.max(50, 1200 - rata)
      return selesai(m, s, {
        judul: `Reaction — rata-rata ${rata} ms`, hasil: rata < 900 ? 'menang' : 'kalah', skor,
        koin: rata < 500 ? 1000 : rata < 900 ? 500 : 150, exp: 25,
        teks: `Hasil: ${s.hasil.map(h => h + ' ms').join(', ')}\nTerbaik: ${terbaik} ms ${terbaik < 300 ? '🔥 refleks dewa!' : terbaik < 500 ? '⚡ cepat!' : '🙂 normal'}`
      })
    }
    const jeda = rint(2500, 6500)
    setTimeout(async () => {
      const cur = getS(m.jid)
      if (!cur || cur.kind !== 'reaction' || cur.siapPada) return
      cur.siapPada = Date.now()
      await refresh(m, cur, '⚡ *TANGKAP SEKARANG!*').catch(() => {})
    }, jeda)
    return refresh(m, s, `⏱️ *${ms} ms* — percobaan ${s.percobaan}/3. Tunggu hijau lagi...`)
  }
})

/* ================================================================== */
/*  PLUGIN COMMAND                                                     */
/* ================================================================== */
const ag = (cmd, aliases, desc, kind, contoh = '') => ({
  command: [cmd, ...aliases],
  category: 'Games',
  description: desc,
  limit: 0,
  cooldown: 2,
  contoh,
  run: async m => {
    try { return await mulaiGame(m, kind, { args: m.args, q: m.q }) }
    catch (e) { return m.reply(`⚠️ ${truncate(String(e.message || e), 180)}`) }
  }
})

export const airichLabGames = [
  ag('airichmine', ['minesweeperai', 'ranjauairich'], '💣 Minesweeper 4×4 via AI Rich (buka sel, hindari ranjau)', 'mine', 'B3'),
  ag('airich2048', ['2048airich', 'airichdua048'], '🔢 2048 via AI Rich (geser papan, gabung angka)', 'g2048'),
  ag('airichmemory', ['memoryairich', 'memaairich', 'kartuairich'], '🃏 Memory match 12 kartu via AI Rich', 'memory'),
  ag('airichular', ['ulartanggaairich', 'airichsnake'], '🐍 Ular tangga vs bot via AI Rich', 'ular'),
  ag('airichconnect', ['connect4airich', 'airich4', 'fourairich'], '🔴 Connect Four vs bot via AI Rich', 'connect4'),
  ag('airichblackjack', ['bjairich', 'blackjackai', 'airich21'], '🂡 Blackjack vs bandar via AI Rich (taruhan koin)', 'blackjack', '1000'),
  ag('airichroulette', ['roletairich', 'airichrolet'], '🎡 Roulette via AI Rich (merah/hitam/angka 0-36)', 'roulette', 'merah 1000'),
  ag('airichslot', ['slotairich', 'airichmesin'], '🎰 Slot machine via AI Rich (3 gulungan)', 'slot', '500'),
  ag('airichdadu', ['daduairich', 'airichdice', 'dueldadu'], '🎲 Duel dadu best-of-3 vs bot via AI Rich', 'dadu', '500'),
  ag('airichhighlow', ['highlowairich', 'airichnaikturun', 'higherlower'], '⬆️ Higher-Lower kartu via AI Rich (streak & pengali)', 'highlow', '500'),
  ag('airichmath', ['mathairich', 'airichhitung', 'sprintangka'], '➗ Math sprint 10 soal via AI Rich', 'math'),
  ag('airichreaction', ['reaksiairich', 'airichrefleks', 'reactiontest'], '⚡ Tes refleks via AI Rich (ukur milidetik)', 'reaction'),

  {
    command: ['batalairichlab', 'stopairichlab', 'batalgameairich'],
    category: 'Games',
    description: 'Hentikan game AI Rich v7 yang sedang berjalan',
    limit: 0,
    run: m => {
      const s = getS(m.jid)
      clearLab(m.jid)
      return m.reply(s ? `🛑 Game *${s.kind}* dihentikan.` : 'Tidak ada game AI Rich yang berjalan.')
    }
  },

  {
    command: ['mainlagi', 'ulangaairich', 'rematchairich'],
    category: 'Games',
    description: 'Ulangi game AI Rich terakhir yang kamu mainkan',
    limit: 0,
    run: async m => {
      const u = getStat(K(m))
      if (!u.terakhirKind) return m.reply(`Belum ada game yang dimainkan.\nDaftar game: \`${P}airichmenu\``)
      return mulaiGame(m, u.terakhirKind, { args: m.args, q: m.q, paksa: true })
    }
  }
]

export default { airichLabGames }
