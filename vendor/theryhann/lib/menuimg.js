/**
 * ============================================================
 *  lib/menuimg.js — GAMBAR HEADER MENU YANG BISA DI-CUSTOM
 * ------------------------------------------------------------
 *  Sumber gambar menu, urutan prioritas:
 *   1. setting runtime  `settings.menuImage`   (diubah lewat .setmenuimg)
 *   2. config.js        `config.display.menuImage`
 *   3. config.js        `config.display.thumbnail`
 *
 *  Nilai yang didukung:
 *   '' / 'none'        -> tanpa gambar (paling cepat & anti gagal)
 *   'banner'           -> banner gradient buatan lib/canvas (tema default)
 *   'banner:<tema>'    -> banner gradient tema tertentu (lihat .listtheme)
 *   'random'           -> banner gradient tema acak (di-cache per tema)
 *   <url http(s)>      -> gambar dari internet
 *   <path file>        -> gambar lokal, mis. media/menu.jpg
 *
 *  Banner hasil generate DI-CACHE di memory supaya menu tetap ngebut.
 * ============================================================
 */

import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { getSettings } from './database.js'
import { makeBanner, THEMES, THEME_NAMES, randomTheme } from './canvas.js'
import { ROOT } from './functions.js'

/** cache banner per tema */
const bannerCache = new Map()

export async function bannerBuffer (themeName) {
  const key = THEMES[themeName] ? themeName : 'midnight'
  if (bannerCache.has(key)) return bannerCache.get(key)
  const buf = await makeBanner({
    title: config.bot.name,
    subtitle: `WhatsApp Bot  |  ${config.bot.version}`,
    footer: config.bot.footer,
    theme: key
  })
  bannerCache.set(key, buf)
  return buf
}

/** buang cache banner (dipakai setelah .setmenutheme) */
export function clearBannerCache () {
  bannerCache.clear()
}

export function listThemes () {
  return THEME_NAMES
}

/**
 * Resolve gambar header menu saat ini.
 * @returns {Promise<Buffer|string|null>} buffer/path/url, atau null jika 'none'
 */
export async function resolveMenuImage () {
  let val = ''
  try { val = getSettings().menuImage || '' } catch {}
  if (!val) val = config.display.menuImage || ''
  if (!val) val = config.display.thumbnail || ''

  return await resolveImageValue(val)
}

/**
 * Resolve satu nilai gambar (dipakai juga untuk background kartu welcome).
 */
export async function resolveImageValue (val) {
  if (!val) return null
  const v = String(val).trim()
  if (!v || v === 'none' || v === 'off' || v === 'false') return null

  if (v === 'banner') return await bannerBuffer(getSettings().menuTheme || 'midnight')
  if (v.startsWith('banner:')) return await bannerBuffer(v.slice(7).trim())
  if (v === 'random') return await bannerBuffer(randomTheme())

  if (/^https?:\/\//i.test(v)) return v

  // path lokal
  const candidate = path.isAbsolute(v) ? v : path.join(ROOT, v)
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate

  return null
}

export default { resolveMenuImage, resolveImageValue, bannerBuffer, clearBannerCache, listThemes }
