/**
 * 🔤 TEXT TOOLS — puluhan utilitas teks murni-JS (offline, pasti jalan)
 * Semua masuk kategori "Tools".
 */
import { config } from '../config.js'

const need = (m) => {
  const t = String(m.q || m.args.join(' ') || '').trim()
  return t || null
}
const usage = (m, contoh) => m.reply(`Kirim teks setelah perintah.\nContoh: \`${config.display.prefix}${m.command} ${contoh}\``)

/* ---------- helper konversi ---------- */
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': '/' }
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '9', l: '1', b: '8' }

function toMorse (s) { return s.toUpperCase().split('').map(c => MORSE[c] ?? c).join(' ') }
function fromMorse (s) { return s.split(/\s+/).map(t => MORSE_REV[t] ?? t).join('') }
function toBinary (s) { return [...s].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ') }
function fromBinary (s) { return s.split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('') }
function toHex (s) { return [...s].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ') }
function fromHex (s) { return s.split(/\s+/).map(h => String.fromCharCode(parseInt(h, 16))).join('') }
function caesar (s, shift) {
  return s.replace(/[a-z]/gi, c => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 2600) % 26) + base)
  })
}
function rot13 (s) { return caesar(s, 13) }
function leet (s) { return s.split('').map(c => LEET[c.toLowerCase()] ?? c).join('') }
function titlecase (s) { return s.replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()) }

const P = config.display.prefix

/* ================= CASE ================= */
export const cUpper = { command: ['uppercase', 'kapital', 'upper', 'besar'], category: 'Tools', description: 'Ubah teks jadi HURUF BESAR', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo dunia'); return m.reply(t.toUpperCase()) } }
export const cLower = { command: ['lowercase', 'kecil', 'lower'], category: 'Tools', description: 'Ubah teks jadi huruf kecil', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'HALO DUNIA'); return m.reply(t.toLowerCase()) } }
export const cTitle = { command: ['titlecase', 'kapitalawal', 'title'], category: 'Tools', description: 'Kapital Di Awal Kata', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo dunia kita'); return m.reply(titlecase(t)) } }
export const cRepeat = { command: ['repeat', 'ulang'], category: 'Tools', description: 'Ulangi teks N kali (format: n|teks)', limit: 0, run: m => { const [n, ...rest] = String(m.q || '').split('|'); const c = Math.min(parseInt(n) || 1, 50); const t = rest.join('|').trim(); if (!t) return usage(m, '3|halo'); return m.reply(Array(c).fill(t).join(' ')) } }

/* ================= ENCODE / DECODE ================= */
export const cB64d = { command: ['base64dec', 'b64decode', 'unbase64'], category: 'Tools', description: 'Decode Base64 ke teks', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'aGFsbw=='); try { return m.reply(Buffer.from(t, 'base64').toString('utf8')) } catch { return m.reply('❌ Base64 tidak valid.') } } }
export const cUrlEnc = { command: ['urlencode', 'urlenc'], category: 'Tools', description: 'Encode teks jadi format URL', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo dunia'); return m.reply(encodeURIComponent(t)) } }
export const cUrlDec = { command: ['urldecode', 'urldec'], category: 'Tools', description: 'Decode format URL ke teks', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo%20dunia'); try { return m.reply(decodeURIComponent(t)) } catch { return m.reply('❌ URL-encoded tidak valid.') } } }
export const cBin = { command: ['binary', 'biner', 'binenc'], category: 'Tools', description: 'Ubah teks ke biner', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo'); return m.reply(toBinary(t)) } }
export const cBinD = { command: ['binarydec', 'bindec', 'unbiner'], category: 'Tools', description: 'Ubah biner ke teks', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, '01101000 01101001'); return m.reply(fromBinary(t)) } }
export const cHexD = { command: ['hexdec', 'unhex'], category: 'Tools', description: 'Ubah hexadesimal ke teks', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, '68 61 6c 6f'); return m.reply(fromHex(t)) } }
export const cMorse = { command: ['morse', 'morseenc'], category: 'Tools', description: 'Ubah teks ke kode Morse', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'sos'); return m.reply(toMorse(t)) } }
export const cMorseD = { command: ['morsedec', 'unmorse'], category: 'Tools', description: 'Ubah kode Morse ke teks', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, '... --- ...'); return m.reply(fromMorse(t)) } }

/* ================= CIPHER ================= */
export const cCaesar = { command: ['caesar', 'caesarcipher'], category: 'Tools', description: 'Cipher Caesar (format: shift|teks)', limit: 0, run: m => { const [n, ...rest] = String(m.q || '').split('|'); const t = rest.join('|').trim(); if (!t) return usage(m, '3|halo dunia'); return m.reply(caesar(t, parseInt(n) || 3)) } }
export const cRot13 = { command: ['rot13'], category: 'Tools', description: 'Cipher ROT13', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo'); return m.reply(rot13(t)) } }
export const cLeet = { command: ['leet', 'leetspeak', '1337'], category: 'Tools', description: 'Ubah teks jadi gaya 1337', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'hacker'); return m.reply(leet(t)) } }

/* ================= ANALISIS ================= */
export const cPalindrome = { command: ['palindrome', 'cekpalindrom'], category: 'Tools', description: 'Cek apakah teks palindrom', limit: 0, run: m => { const t = (need(m) || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!t) return usage(m, 'katak'); const rev = [...t].reverse().join(''); return m.reply(rev === t ? `✅ *Palindrom!* "${t}" dibaca sama dari dua arah.` : `❌ Bukan palindrom.\nAsli: ${t}\nBalik: ${rev}`) } }
export const cSortWords = { command: ['sortwords', 'urutkata'], category: 'Tools', description: 'Urutkan kata secara alfabet', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'mangga apel jeruk'); return m.reply(t.split(/\s+/).filter(Boolean).sort((a, b) => a.localeCompare(b)).join(' ')) } }
export const cUnique = { command: ['uniquewords', 'unikata'], category: 'Tools', description: 'Buang kata duplikat', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'satu dua satu tiga'); return m.reply([...new Set(t.split(/\s+/).filter(Boolean))].join(' ')) } }

/* ================= FORMAT ================= */
export const cSlug = { command: ['slug', 'slugify'], category: 'Tools', description: 'Ubah teks jadi slug url', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'Halo Dunia!'); return m.reply(t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) } }
export const cHashtag = { command: ['hashtag', 'tagar'], category: 'Tools', description: 'Ubah teks jadi hashtag', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'hari ini cerah'); return m.reply(t.split(/\s+/).filter(Boolean).map(w => '#' + w.replace(/[^a-zA-Z0-9]/g, '')).join(' ')) } }
export const cCollapse = { command: ['rapikan', 'collapsespace', 'buangspasi'], category: 'Tools', description: 'Rapikan spasi berlebih', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo    dunia'); return m.reply(t.replace(/[ \t]+/g, ' ').trim()) } }
export const cNoSpace = { command: ['nospace', 'hspasi', 'tanpaspace'], category: 'Tools', description: 'Hapus semua spasi', limit: 0, run: m => { const t = need(m); if (!t) return usage(m, 'halo dunia'); return m.reply(t.replace(/\s+/g, '')) } }
