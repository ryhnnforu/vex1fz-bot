/**
 * ============================================================
 *  lib/datasets.js — LOADER + PENCARIAN DATA LOKAL
 * ------------------------------------------------------------
 *  Semua data dibaca dari folder data/ (JSON), di-cache di memori.
 *  Dipakai fitur Islami, Info, Internet, Games, Fun, Tools.
 *
 *  Isi data/:
 *    asmaulhusna.json  99 nama Allah + arti Indonesia
 *    doa.json          443 doa (arab + latin + terjemahan + kategori)
 *    doakategori.json  29 kategori doa
 *    doaharian.json    27 doa harian populer (judul & arti Indonesia)
 *    haditsarbain.json 42 hadits Arbain Nawawi (arab + terjemahan ID)
 *    surah.json        114 data surah (nama, arti, jumlah ayat, tipe)
 *    countries.json    250 negara (ibu kota, mata uang, bahasa, dll)
 *    provinsi.json     38 provinsi Indonesia
 *    kimia.json        118 unsur kimia
 *    quotes.json       bank quotes/pantun/fakta/tips/tebak receh
 * ============================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const cache = new Map()

function load (file, fallback = []) {
  if (cache.has(file)) return cache.get(file)
  let data = fallback
  try {
    data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
  } catch {
    data = fallback
  }
  cache.set(file, data)
  return data
}

/* ------------------------- DATASET ------------------------- */
export const countries = () => load('countries.json')
export const provinces = () => load('provinsi.json')
export const elements = () => load('kimia.json')
export const surahs = () => load('surah.json')
export const asmaulHusna = () => load('asmaulhusna.json')
export const duas = () => load('doa.json')
export const duaCategories = () => load('doakategori.json')
export const doaHarian = () => load('doaharian.json')
export const haditsArbain = () => load('haditsarbain.json')
export const quotesBank = () => load('quotes.json', {})

export const quoteCategories = () => Object.keys(quotesBank())

/** ambil satu bank quotes (mis. 'motivasi', 'pantun', 'fakta') */
export const quotes = cat => quotesBank()[cat] || []

/** quotes acak dari sebuah kategori */
export function randomQuote (cat) {
  const list = quotes(cat)
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

/* ------------------------- PENCARIAN ------------------------- */
const norm = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Pencarian fuzzy sederhana dengan skor.
 * @param {Array} list   daftar object
 * @param {string} q     kata kunci
 * @param {string[]} fields  field yang dicari
 * @param {number} limit
 */
export function search (list, q, fields = [], limit = 8) {
  const query = norm(q)
  if (!query) return list.slice(0, limit)
  const scored = []
  for (const item of list) {
    let best = 0
    for (const f of fields) {
      const val = norm(item[f])
      if (!val) continue
      let s = 0
      if (val === query) s = 100
      else if (val.startsWith(query)) s = 80
      else if (val.includes(query)) s = 60
      else if (query.length > 3 && val.split(' ').some(w => w.startsWith(query))) s = 50
      else if (query.length > 3 && query.split(' ').every(w => val.includes(w))) s = 40
      if (s > best) best = s
    }
    if (best > 0) scored.push({ item, score: best })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(x => x.item)
}

/* ------------------------- LOOKUP SPESIFIK ------------------------- */
export function findCountry (q) {
  const list = countries()
  if (/^\d+$/.test(String(q || ''))) return list[Number(q) - 1] || null
  const up = String(q || '').toUpperCase()
  return (
    list.find(c => c.cca2 === up || c.cca3 === up) ||
    search(list, q, ['nama', 'id', 'resmi', 'ibu', 'tld'], 1)[0] ||
    null
  )
}

export function findProvince (q) {
  const list = provinces()
  if (/^\d+$/.test(String(q || ''))) return list[Number(q) - 1] || null
  return search(list, q, ['nama', 'ibu'], 1)[0] || null
}

export function findElement (q) {
  const list = elements()
  if (/^\d+$/.test(String(q || ''))) return list.find(e => e.atom === Number(q)) || null
  const cap = String(q || '').replace(/^(\w)/, c => c.toUpperCase())
  return list.find(e => e.simbol === cap || e.simbol.toLowerCase() === String(q).toLowerCase()) ||
    search(list, q, ['nama', 'simbol', 'golongan'], 1)[0] || null
}

export function findSurah (q) {
  const list = surahs()
  const s = String(q || '').trim()
  if (/^\d+$/.test(s)) return list.find(x => x.no === Number(s)) || null
  return search(list, s, ['nama', 'arti'], 1)[0] || null
}

export function findAsma (q) {
  const list = asmaulHusna()
  if (/^\d+$/.test(String(q || ''))) return list.find(x => x.no === Number(q)) || null
  return search(list, q, ['latin', 'id', 'en'], 1)[0] || null
}

/** jarak dua titik koordinat (km) */
export function haversine (lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

/** arah mata angin dari dua titik */
export function bearing (lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1))
  const br = (Math.atan2(y, x) * 180) / Math.PI
  return (br + 360) % 360
}

export function compass (deg) {
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut']
  return dirs[Math.round(deg / 45) % 8]
}

export default {
  countries, provinces, elements, surahs, asmaulHusna, duas, duaCategories, doaHarian,
  haditsArbain, quotesBank, quotes, quoteCategories, randomQuote, search,
  findCountry, findProvince, findElement, findSurah, findAsma, haversine, bearing, compass
}
