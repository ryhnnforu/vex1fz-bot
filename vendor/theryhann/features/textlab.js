/**
 * 🛠️ TEXTLAB — 55+ utilitas teks/angka/data (Tools, v6)
 * ------------------------------------------------------------
 *  Semua berjalan LOKAL (tanpa internet): encoding, hash, cipher,
 *  ubah kapitalisasi, statistik teks, matematika, terbilang,
 *  romawi, base konversi, JSON/CSV/JWT, generator acak, warna,
 *  tanggal & umur.
 */
import crypto from 'node:crypto'
import { config } from '../config.js'
import { pickRandom } from '../lib/functions.js'

const P = config.display.prefix

/* ------------------------- helper ------------------------- */
const need = m => {
  if (!m.q || !String(m.q).trim()) {
    m.reply(`Butuh input.\nContoh: ${P}${m.command} ${m.command.includes('json') ? '{"a":1}' : 'teks contoh'}`)
    return null
  }
  return String(m.q)
}
const B64C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B32C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const B58C = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function baseEncode (buf, alphabet) {
  const base = BigInt(alphabet.length)
  let num = BigInt('0x' + (buf.toString('hex') || '0'))
  let out = ''
  while (num > 0n) { out = alphabet[Number(num % base)] + out; num /= base }
  for (const b of buf) { if (b === 0) out = alphabet[0] + out; else break }
  return out || alphabet[0]
}
function baseDecode (str, alphabet) {
  const base = BigInt(alphabet.length)
  let num = 0n
  for (const ch of str) {
    const idx = alphabet.indexOf(ch)
    if (idx < 0) throw new Error('Karakter tidak valid: ' + ch)
    num = num * base + BigInt(idx)
  }
  let hex = num.toString(16)
  if (hex.length % 2) hex = '0' + hex
  return Buffer.from(hex, 'hex')
}
function crc32 (buf) {
  let c, crc = 0xffffffff
  const table = crc32.t || (crc32.t = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c >>> 0
    }
    return t
  })())
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
const hash = (algo, txt) => crypto.createHash(algo).update(txt).digest('hex')

function terbilang (n) {
  n = Math.abs(Math.floor(Number(n) || 0))
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  if (n < 12) return satuan[n]
  if (n < 20) return terbilang(n - 10) + ' belas'
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '')
  if (n < 200) return 'seratus' + (n - 100 ? ' ' + terbilang(n - 100) : '')
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '')
  if (n < 2000) return 'seribu' + (n - 1000 ? ' ' + terbilang(n - 1000) : '')
  if (n < 1e6) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '')
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + terbilang(n % 1e6) : '')
  if (n < 1e12) return terbilang(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + terbilang(n % 1e9) : '')
  return terbilang(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + terbilang(n % 1e12) : '')
}
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
function toRoman (num) {
  let n = Math.floor(num); let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out
}
function fromRoman (str) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  const s = String(str).toUpperCase()
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]]
    if (!cur) throw new Error('Karakter romawi tidak valid: ' + s[i])
    const next = map[s[i + 1]] || 0
    total += cur < next ? -cur : cur
  }
  return total
}
const isPrime = n => {
  if (n < 2) return false
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false
  return true
}
function factorize (n) {
  const f = []
  for (let i = 2; i * i <= n; i++) while (n % i === 0) { f.push(i); n /= i }
  if (n > 1) f.push(n)
  return f
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b)

function hexToRgb (hex) {
  const h = String(hex).replace('#', '')
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (!/^[0-9a-f]{6}$/i.test(f)) throw new Error('Format hex salah (contoh: #1abc9c)')
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)]
}
function rgbToHsl (r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}
const LEET = { a: '4', b: '8', e: '3', g: '9', i: '1', l: '1', o: '0', s: '5', t: '7', z: '2' }

/* ------------------------- definisi command ------------------------- */
const txt = (cmd, aliases, desc, fn, contoh = 'Halo Dunia 123') => ({
  command: [cmd, ...aliases],
  category: 'Tools',
  description: desc,
  limit: 0,
  run: m => {
    const q = need(m)
    if (q === null) return
    try { return m.reply(fn(q, m)) } catch (e) { return m.reply(`⚠️ ${e.message}`) }
  },
  contoh
})

export const textlabCmds = [
  /* ---- ENCODING ---- */
  txt('base32', ['b32'], 'Encode teks ke Base32', q => `Base32:\n\`${baseEncode(Buffer.from(q), B32C)}\``),
  txt('base32dec', ['b32dec'], 'Decode Base32 ke teks', q => `Teks:\n\`${baseDecode(q.replace(/[=\s]/g, ''), B32C).toString('utf8')}\``),
  txt('base58', ['b58'], 'Encode teks ke Base58', q => `Base58:\n\`${baseEncode(Buffer.from(q), B58C)}\``),
  txt('base58dec', ['b58dec'], 'Decode Base58 ke teks', q => `Teks:\n\`${baseDecode(q.replace(/[=\s]/g, ''), B58C).toString('utf8')}\``),
  txt('base64url', ['b64url'], 'Encode Base64 URL-safe', q => `Base64URL:\n\`${Buffer.from(q).toString('base64url')}\``),
  txt('base64urldec', ['b64urldec'], 'Decode Base64 URL-safe', q => `Teks:\n\`${Buffer.from(q.trim(), 'base64url').toString('utf8')}\``),
  txt('text2hex', ['hexify'], 'Encode teks ke hexadecimal', q => `Hex:\n\`${Buffer.from(q).toString('hex')}\``),
  txt('hex2text', ['unhexify'], 'Decode hexadecimal ke teks', q => `Teks:\n\`${Buffer.from(q.replace(/\s/g, ''), 'hex').toString('utf8')}\``),
  txt('text2biner', ['binerteks'], 'Ubah teks ke biner', q => `Biner:\n\`${[...q].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')}\``),
  txt('biner2text', ['teksbiner'], 'Ubah biner ke teks', q => `Teks:\n\`${q.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('')}\``),
  txt('text2oktal', ['oktalteks'], 'Ubah teks ke oktal', q => `Oktal:\n\`${[...q].map(c => c.charCodeAt(0).toString(8)).join(' ')}\``),
  txt('encurl', ['urlencode2'], 'URL-encode teks', q => `Hasil:\n\`${encodeURIComponent(q)}\``),
  txt('decurl', ['urldecode2'], 'URL-decode teks', q => `Hasil:\n\`${decodeURIComponent(q)}\``),
  txt('htmlentity', ['htmlenc'], 'Ubah teks ke HTML entity', q => `Hasil:\n\`${q.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))}\``),
  txt('htmlunescape', ['htmldec'], 'Ubah HTML entity ke teks', q => `Hasil:\n\`${q.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (s0, e) => {
    if (e[0] === '#') return String.fromCharCode(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e.toLowerCase()] || s0
  })}\``),
  txt('unicode', ['codepoint'], 'Tampilkan code point Unicode tiap karakter', q => `Unicode:\n${[...q].map(c => `\`${c}\` U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (${c.codePointAt(0)})`).join('\n')}`),

  /* ---- CIPHER ---- */
  txt('rotsandi', [], 'Cipher ROT13', q => `ROT13:\n\`${q.replace(/[a-z]/gi, c => { const a = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - a + 13) % 26) + a) })}\``),
  txt('rot47', [], 'Cipher ROT47', q => `ROT47:\n\`${q.replace(/[!-~]/g, c => String.fromCharCode(((c.charCodeAt(0) - 33 + 47) % 94) + 33))}\``),
  txt('atbash', [], 'Cipher Atbash (cermin alfabet)', q => `Atbash:\n\`${q.replace(/[a-z]/gi, c => { const a = c <= 'Z' ? 65 : 97; return String.fromCharCode(a + 25 - (c.charCodeAt(0) - a)) })}\``),
  txt('caesarshift', ['sandi shift'.replace(' ','')], 'Cipher Caesar: .caesar <geser> <teks>', (q, m) => {
    const n = Number(m.args[0]) || 3
    const teks = m.args.slice(1).join(' ') || q
    return `Caesar (geser ${n}):\n\`${teks.replace(/[a-z]/gi, c => { const a = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - a + n) % 26 + 26) % 26 + a) })}\``
  }),
  txt('vigenere', [], 'Cipher Vigenère: .vigenere <kunci> <teks>', (q, m) => {
    const key = (m.args[0] || 'kunci').toLowerCase().replace(/[^a-z]/g, '')
    const teks = m.args.slice(1).join(' ') || q
    let i = 0
    return `Vigenère (kunci "${key}"):\n\`${teks.replace(/[a-z]/gi, c => {
      const a = c <= 'Z' ? 65 : 97
      const k = key.charCodeAt(i++ % key.length) - 97
      return String.fromCharCode(((c.charCodeAt(0) - a + k) % 26) + a)
    })}\``
  }),
  txt('morsetotext', ['morseteks'], 'Decode morse ke teks', q => {
    const M = { '.-': 'a', '-...': 'b', '-.-.': 'c', '-..': 'd', '.': 'e', '..-.': 'f', '--.': 'g', '....': 'h', '..': 'i', '.---': 'j', '-.-': 'k', '.-..': 'l', '--': 'm', '-.': 'n', '---': 'o', '.--.': 'p', '--.-': 'q', '.-.': 'r', '...': 's', '-': 't', '..-': 'u', '...-': 'v', '.--': 'w', '-..-': 'x', '-.--': 'y', '--..': 'z', '/': ' ' }
    return `Teks:\n\`${q.trim().split(/\s+/).map(c => M[c] ?? '').join('').toUpperCase()}\``
  }, '.... .- .-.. ---'),
  txt('leetify', ['leet1337'], 'Ubah teks jadi leetspeak', q => `Leet:\n\`${q.toLowerCase().replace(/[abegilostz]/g, c => LEET[c] || c)}\``),

  /* ---- HASH ---- */
  txt('md5', [], 'Hash MD5', q => `MD5:\n\`${hash('md5', q)}\``, 'contoh'),
  txt('sha1', [], 'Hash SHA-1', q => `SHA1:\n\`${hash('sha1', q)}\``, 'contoh'),
  txt('sha256', [], 'Hash SHA-256', q => `SHA256:\n\`${hash('sha256', q)}\``, 'contoh'),
  txt('sha512', [], 'Hash SHA-512', q => `SHA512:\n\`${hash('sha512', q)}\``, 'contoh'),
  txt('sha3', [], 'Hash SHA3-256', q => `SHA3-256:\n\`${hash('sha3-256', q)}\``, 'contoh'),
  txt('crc32', [], 'Checksum CRC32', q => `CRC32: \`${crc32(Buffer.from(q))}\` (0x${crc32(Buffer.from(q)).toString(16)})`, 'contoh'),
  txt('hmacsha', ['hmac'], 'HMAC-SHA256: .hmacsha <kunci> <teks>', (q, m) => {
    const key = m.args[0] || 'rahasia'
    const teks = m.args.slice(1).join(' ') || q
    return `HMAC-SHA256 (kunci "${key}"):\n\`${crypto.createHmac('sha256', key).update(teks).digest('hex')}\``
  }),

  /* ---- KAPITALISASI & TEKS ---- */
  txt('camelcaseify', ['camelize'], 'Ubah ke camelCase', q => `Hasil: \`${q.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase())}\``),
  txt('pascalcaseify', ['pascalize'], 'Ubah ke PascalCase', q => `Hasil: \`${q.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[a-z]/, c => c.toUpperCase())}\``),
  txt('snakecaseify', ['snakeize'], 'Ubah ke snake_case', q => `Hasil: \`${q.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}\``),
  txt('kebabcaseify', ['kebabize'], 'Ubah ke kebab-case', q => `Hasil: \`${q.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}\``),
  txt('constantcase', ['screaming'], 'Ubah ke CONSTANT_CASE', q => `Hasil: \`${q.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}\``),
  txt('titlecaseify', ['titleize'], 'Ubah ke Title Case', q => `Hasil: \`${q.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}\``),
  txt('sentencecase', ['sentence'], 'Ubah ke Sentence case', q => `Hasil: \`${q.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase())}\``),
  txt('alternating', ['altcase', 'spongebob'], 'Ubah ke KaPiTaL sELeNg-SeLiNg', q => `Hasil: \`${[...q].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('')}\``),
  txt('inverse', ['invertcase'], 'Balik besar/kecil huruf', q => `Hasil: \`${[...q].map(c => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')}\``),
  txt('balikteks', ['teksbalik'], 'Balik urutan karakter', q => `Hasil: \`${[...q].reverse().join('')}\``),
  txt('reversword', ['balikkata'], 'Balik urutan kata', q => `Hasil: \`${q.split(/\s+/).reverse().join(' ')}\``),
  txt('slugifyteks', ['bikinslug'], 'Ubah teks jadi slug URL', q => `Slug: \`${q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}\``),
  txt('wordcount', ['hitungkata', 'statteks'], 'Statistik teks (kata, karakter, baris, kalimat)', q => {
    const words = q.trim().split(/\s+/).filter(Boolean)
    return `📊 *STATISTIK TEKS*\n\nKarakter     : ${q.length}\nKarakter (tanpa spasi): ${q.replace(/\s/g, '').length}\nKata         : ${words.length}\nBaris        : ${q.split('\n').length}\nKalimat      : ${(q.match(/[.!?]+(\s|$)/g) || []).length || 1}\nParagraf     : ${q.split(/\n{2,}/).length}\nKata terpanjang: ${words.slice().sort((a, b) => b.length - a.length)[0] || '-'}\nUnik         : ${new Set(words.map(w => w.toLowerCase())).size}`
  }),
  txt('dedupe', ['barisunik', 'hapusduplikat'], 'Hapus baris duplikat', q => `Hasil (${q.split('\n').length} → ${[...new Set(q.split('\n'))].length} baris):\n\`${[...new Set(q.split('\n'))].join('\n')}\``),
  txt('sortline', ['urutbaris'], 'Urutkan baris (asc/desc)', (q, m) => {
    const desc = /desc|-d/i.test(m.args[m.args.length - 1] || '')
    const arr = q.split('\n').sort((a, b) => (desc ? b.localeCompare(a) : a.localeCompare(b)))
    return `Hasil:\n\`${arr.join('\n')}\``
  }),
  txt('striphtml', ['hapushtml'], 'Buang tag HTML dari teks', q => `Hasil:\n\`${q.replace(/<[^>]*>/g, '').replace(/\s+\n/g, '\n').trim()}\``, '<p>Halo <b>dunia</b></p>'),
  txt('emojiinfo', ['hitungemoji'], 'Hitung & daftar emoji dalam teks', q => {
    const em = q.match(/\p{Extended_Pictographic}/gu) || []
    const map = {}
    for (const e of em) map[e] = (map[e] || 0) + 1
    return `Emoji ditemukan: *${em.length}*\n${Object.entries(map).map(([e, n]) => `${e} ×${n}`).join('\n') || '(tidak ada emoji)'}`
  }, 'Halo 🌍🔥🔥 seru'),

  /* ---- ANGKA & MATEMATIKA ---- */
  txt('terbilang', ['bilangangka'], 'Ubah angka jadi kata (terbilang)', q => `Terbilang: *${terbilang(Number(String(q).replace(/[^0-9]/g, '')))}*`),
  txt('romawi', ['toroman', 'roman'], 'Ubah angka ke Romawi', q => `Romawi: *${toRoman(Number(q))}*`),
  txt('romawidec', ['fromroman'], 'Ubah Romawi ke angka', q => `Angka: *${fromRoman(q)}*`, 'MCMXCIX'),
  txt('primacheck', ['cekprima', 'prima'], 'Cek bilangan prima', q => {
    const n = Number(q)
    return `${n} → ${isPrime(n) ? '✅ PRIMA' : '❌ bukan prima'}` + (isPrime(n) ? '' : `\nFaktor: ${factorize(n).join(' × ')}`)
  }, '97'),
  txt('faktorisasi', ['faktorialprima'], 'Faktorisasi prima', q => `${q} = ${factorize(Number(q)).join(' × ')}`, '360'),
  txt('fpb', ['gcd'], 'FPB (GCD) dua angka: .fpb 12 18', (q, m) => {
    const a = Number(m.args[0]), b = Number(m.args[1] ?? q)
    if (!b) throw new Error(`Format: ${P}fpb 12 18`)
    return `FPB(${a}, ${b}) = *${gcd(a, b)}*`
  }, '12 18'),
  txt('kpk', ['lcm'], 'KPK (LCM) dua angka: .kpk 4 6', (q, m) => {
    const a = Number(m.args[0]), b = Number(m.args[1] ?? q)
    if (!b) throw new Error(`Format: ${P}kpk 4 6`)
    return `KPK(${a}, ${b}) = *${lcm(a, b)}*`
  }, '4 6'),
  txt('fibonacci', ['fibo'], 'Deret Fibonacci ke-n / sebanyak n', q => {
    const n = Math.min(60, Math.max(1, Number(q) || 10))
    const a = [0, 1]
    for (let i = 2; i < n; i++) a.push(a[i - 1] + a[i - 2])
    return `Fibonacci ${n} suku:\n${a.slice(0, n).join(', ')}\n\nSuku ke-${n}: *${a[n - 1]}*`
  }, '10'),
  txt('faktorial', ['factorial'], 'Hitung faktorial n!', q => {
    const n = Math.min(170, Math.max(0, Number(q) || 0))
    let r = 1n
    for (let i = 2n; i <= BigInt(n); i++) r *= i
    return `${n}! = *${r.toString()}*`
  }, '10'),
  txt('baseconvert', ['konversibase'], 'Konversi antar basis: .baseconvert 255 16', (q, m) => {
    const [val, from, to] = [m.args[0] ?? q, m.args[1] ?? 10, m.args[2] ?? 16]
    const dec = parseInt(String(val), Number(from))
    if (isNaN(dec)) throw new Error('Angka/basis tidak valid')
    return `${val} (basis ${from}) = *${dec.toString(Number(to)).toUpperCase()}* (basis ${to})\nDesimal: ${dec}\nBiner: ${dec.toString(2)}\nOktal: ${dec.toString(8)}\nHex: ${dec.toString(16).toUpperCase()}`
  }, '255 10 16'),
  txt('bmi', ['imt'], 'Hitung BMI: .bmi <kg> <cm>', (q, m) => {
    const kg = Number(m.args[0] ?? q), cm = Number(m.args[1])
    if (!kg || !cm) throw new Error(`Format: ${P}bmi 60 170`)
    const bmi = kg / Math.pow(cm / 100, 2)
    const kat = bmi < 18.5 ? 'Kurus' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Gemuk' : 'Obesitas'
    const ideal = 18.5 * Math.pow(cm / 100, 2), ideal2 = 24.9 * Math.pow(cm / 100, 2)
    return `⚖️ *BMI*\n\nBerat: ${kg} kg · Tinggi: ${cm} cm\nBMI: *${bmi.toFixed(1)}* → ${kat}\nRentang ideal: ${ideal.toFixed(1)}–${ideal2.toFixed(1)} kg`
  }, '60 170'),
  txt('persen', ['percentage'], 'Hitung persentase: .persen 25 dari 200', (q, m) => {
    const a = Number(m.args[0] ?? q), b = Number(m.args[2] ?? m.args[1])
    if (!b) throw new Error(`Format: ${P}persen 25 dari 200`)
    return `${a} dari ${b} = *${((a / b) * 100).toFixed(2)}%*\n${a}% dari ${b} = *${(a / 100) * b}*`
  }, '25 200'),
  txt('suhu', ['konversisuhu', 'celcius'], 'Konversi suhu: .suhu 30 C', (q, m) => {
    const v = Number(m.args[0] ?? q)
    const from = String(m.args[1] || 'C').toUpperCase()[0]
    if (isNaN(v)) throw new Error(`Format: ${P}suhu 30 C  (C/F/K/R)`)
    let c
    if (from === 'C') c = v
    else if (from === 'F') c = (v - 32) * 5 / 9
    else if (from === 'K') c = v - 273.15
    else c = v * 5 / 4
    return `🌡️ ${v}°${from} =\nCelsius  : ${c.toFixed(2)} °C\nFahrenheit: ${(c * 9 / 5 + 32).toFixed(2)} °F\nKelvin   : ${(c + 273.15).toFixed(2)} K\nReamur   : ${(c * 4 / 5).toFixed(2)} °R`
  }, '30 C'),

  /* ---- DATA ---- */
  txt('jsonformat', ['jsonpretty', 'formatjson'], 'Rapikan JSON', q => `\`\`\`json\n${JSON.stringify(JSON.parse(q), null, 2).slice(0, 3500)}\n\`\`\``, '{"a":1,"b":[1,2]}'),
  txt('jsonminify', ['minifyjson'], 'Padatkan JSON', q => `\`${JSON.stringify(JSON.parse(q)).slice(0, 3800)}\``, '{ "a" : 1 }'),
  txt('csv2json', ['csvjson'], 'Ubah CSV ke JSON (baris pertama = header)', q => {
    const rows = q.trim().split(/\r?\n/).map(r => r.split(/[;,]/).map(c => c.trim()))
    const head = rows.shift()
    return `\`\`\`json\n${JSON.stringify(rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? null]))), null, 2).slice(0, 3400)}\n\`\`\``
  }, 'nama,umur\nBudi,20\nSari,22'),
  txt('jwtdecode', ['jwt'], 'Decode token JWT (header + payload)', q => {
    const parts = String(q).trim().split('.')
    if (parts.length < 2) throw new Error('Token JWT tidak valid (harus 3 bagian dipisah titik)')
    const dec = p => JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
    const header = dec(parts[0]), payload = dec(parts[1])
    const exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString('id-ID') : '-'
    return `🔐 *JWT*\n\nHeader:\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\`\nPayload:\n\`\`\`json\n${JSON.stringify(payload, null, 2).slice(0, 2000)}\n\`\`\`\nKedaluwarsa: ${exp}`
  }),

  /* ---- GENERATOR ---- */
  txt('uuid', ['guid'], 'Buat UUID v4', () => `UUID: \`${crypto.randomUUID()}\``, '1'),
  txt('password', ['genpass', 'buatpassword'], 'Buat password acak: .password [panjang]', q => {
    const n = Math.min(64, Math.max(6, Number(q) || 16))
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'
    const list = Array.from({ length: 3 }, () => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join(''))
    return `🔑 *PASSWORD ACAK* (${n} karakter)\n\n${list.map((p, i) => `${i + 1}. \`${p}\``).join('\n')}\n\nKekuatan: ${n >= 16 ? 'sangat kuat' : n >= 12 ? 'kuat' : 'sedang'}`
  }, '16'),
  txt('username', ['genuser', 'namauser'], 'Buat ide username acak', q => {
    const base = (q || '').replace(/[^a-zA-Z0-9]/g, '') || pickRandom(['star', 'moon', 'code', 'pixel', 'neo', 'zen', 'nova', 'byte'])
    const suffix = [crypto.randomInt(10, 999), '_', 'x', '.id', crypto.randomInt(2000, 2099)]
    return `👤 Ide username dari "${base}":\n${Array.from({ length: 6 }, (_, i) => `${i + 1}. \`${base.toLowerCase()}${pickRandom(suffix)}\``).join('\n')}`
  }, 'budi'),
  txt('angkaacak', ['randomnumber', 'acakangka'], 'Angka acak: .angkaacak [min] [max]', (q, m) => {
    const a = Number(m.args[0] ?? 1), b = Number(m.args[1] ?? q ?? 100)
    const lo = Math.min(a, b), hi = Math.max(a, b)
    return `🎲 Angka acak ${lo}–${hi}: *${crypto.randomInt(lo, hi + 1)}*`
  }, '1 100'),
  txt('pilihacak', ['randompick2', 'undipilih'], 'Pilih acak dari daftar (pisah koma)', q => {
    const arr = q.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
    if (arr.length < 2) throw new Error(`Beri minimal 2 pilihan, pisahkan koma. Contoh: ${P}pilihacak nasi, mie, bakso`)
    return `🎯 Terpilih: *${pickRandom(arr)}*\n(dari ${arr.length} pilihan)`
  }, 'nasi, mie, bakso'),

  /* ---- WARNA & TANGGAL ---- */
  txt('warnahex', ['hex2rgb', 'konversiwarna'], 'Konversi warna hex → RGB/HSL', q => {
    const [r, g, b] = hexToRgb(q)
    const [h, s, l] = rgbToHsl(r, g, b)
    return `🎨 *WARNA ${q}*\n\nHEX : #${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}\nRGB : rgb(${r}, ${g}, ${b})\nHSL : hsl(${h}, ${s}%, ${l}%)\nCMYK: ${(() => { const k = 1 - Math.max(r, g, b) / 255; const c = k === 1 ? 0 : (1 - r / 255 - k) / (1 - k); const mm = k === 1 ? 0 : (1 - g / 255 - k) / (1 - k); const y = k === 1 ? 0 : (1 - b / 255 - k) / (1 - k); return `${Math.round(c * 100)}%, ${Math.round(mm * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%` })()}\nInteger: ${(r << 16 | g << 8 | b) >>> 0}`
  }, '#1abc9c'),
  txt('timestamp', ['unixtime', 'waktuts'], 'Konversi timestamp ↔ tanggal', q => {
    const n = Number(String(q).trim())
    if (!isNaN(n) && n > 1e9) {
      const d = new Date(n < 1e12 ? n * 1000 : n)
      return `⏱️ Timestamp ${q}\n\nUTC  : ${d.toUTCString()}\nWIB  : ${d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\nISO  : ${d.toISOString()}`
    }
    const d = new Date(q)
    if (isNaN(d)) throw new Error('Beri timestamp (angka) atau tanggal (2026-09-03)')
    return `⏱️ ${q}\n\nUnix (detik): *${Math.floor(d.getTime() / 1000)}*\nUnix (ms)   : ${d.getTime()}\nISO         : ${d.toISOString()}`
  }, '1767225600'),
  txt('hitungumur', ['umurku2', 'agex'], 'Hitung umur dari tanggal lahir', q => {
    const lahir = new Date(q)
    if (isNaN(lahir)) throw new Error(`Format tanggal: ${P}umur 2000-08-17`)
    const now = new Date()
    let y = now.getFullYear() - lahir.getFullYear()
    let mo = now.getMonth() - lahir.getMonth()
    let d = now.getDate() - lahir.getDate()
    if (d < 0) { mo--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (mo < 0) { y--; mo += 12 }
    const totalHari = Math.floor((now - lahir) / 86400000)
    return `🎂 *HITUNG UMUR*\n\nLahir : ${lahir.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\nUmur  : *${y} tahun ${mo} bulan ${d} hari*\nTotal : ${totalHari.toLocaleString('id-ID')} hari (${(totalHari / 7).toFixed(0)} minggu)\nUlang tahun berikutnya: ${(() => { let next = new Date(now.getFullYear(), lahir.getMonth(), lahir.getDate()); if (next < now) next = new Date(now.getFullYear() + 1, lahir.getMonth(), lahir.getDate()); return Math.ceil((next - now) / 86400000) + ' hari lagi' })()}`
  }, '2000-08-17'),
  txt('selisihhari', ['datediff', 'jaraktanggal'], 'Selisih dua tanggal: .selisihhari 2026-01-01 2026-12-31', (q, m) => {
    const a = new Date(m.args[0] ?? q), b = new Date(m.args[1])
    if (isNaN(a) || isNaN(b)) throw new Error(`Format: ${P}selisihhari 2026-01-01 2026-12-31`)
    const hari = Math.round(Math.abs(b - a) / 86400000)
    return `📅 Selisih ${a.toLocaleDateString('id-ID')} ↔ ${b.toLocaleDateString('id-ID')}\n\n*hari* : ${hari}\nminggu : ${(hari / 7).toFixed(1)}\nbulan  : ${(hari / 30.44).toFixed(1)}\ntahun  : ${(hari / 365.25).toFixed(2)}`
  }, '2026-01-01 2026-12-31'),
  txt('hitungmundur', ['countdown'], 'Hitung mundur ke tanggal tertentu', q => {
    const t = new Date(q)
    if (isNaN(t)) throw new Error(`Format: ${P}hitungmundur 2026-12-31`)
    const ms = t - Date.now()
    const hari = Math.floor(Math.abs(ms) / 86400000)
    return `${ms > 0 ? '⏳' : '✅'} Menuju *${q}*\n\n${ms > 0 ? `*${hari} hari lagi*` : `sudah lewat ${hari} hari`}\n(${Math.floor(Math.abs(ms) / 3600000).toLocaleString('id-ID')} jam)`
  }, '2026-12-31')
]

export default { textlabCmds }
