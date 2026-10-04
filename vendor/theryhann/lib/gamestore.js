/**
 * ============================================================
 *  lib/gamestore.js — PENYIMPAN SESI GAME BERSAMA
 * ------------------------------------------------------------
 *  PENTING: loader fitur (lib/plugins.js) memuat file features/
 *  dengan cache-buster `?v=timestamp`, sehingga instance module
 *  fitur BERBEDA dari instance yang di-import handler. Kalau Map
 *  sesi disimpan di dalam file fitur, command (instance A) dan
 *  checker (instance B) tidak akan pernah melihat sesi yang sama.
 *
 *  Solusi: Map sesi hidup di file lib/ ini, yang SELALU di-import
 *  tanpa cache-buster -> satu instance bersama untuk semua.
 * ============================================================
 */

/** sesi game teks (games.js) */
export const gameSessions = new Map()

/** sesi game AI Rich (airichgames.js) */
export const airichSessions = new Map()

/** sesi game lanjutan (gameslab.js) — hangman, kuis beruntun, dsb. */
export const labSessions = new Map()

/** sesi game AI Rich v7 (lib/airichgame.js + features/airichlab*.js) */
export const airichLabSessions = new Map()

/** sesi player musik .play2 (lib/musikplayer.js, v7.4) */
export const playerSessions = new Map()

export function sessSet (map, jid, data, ttl = 120000) {
  map.set(jid, { ...data, expires: Date.now() + ttl })
}

export function sessGet (map, jid) {
  const s = map.get(jid)
  if (!s) return null
  if (Date.now() > s.expires) { map.delete(jid); return null }
  return s
}

export function sessClear (map, jid) {
  return map.delete(jid)
}

/** sesi akinator (akinator.js, per-user) */
export const akinatorSessions = new Map()

/** sesi duel PvP (duel.js, per-chat, 1 duel aktif per chat) */
export const duelSessions = new Map()

/** sesi UNO multiplayer (features/uno.js, v7.37.0) */
export const unoSessions = new Map()

export default {
  gameSessions, airichSessions, labSessions, airichLabSessions, playerSessions,
  akinatorSessions, duelSessions, unoSessions, sessSet, sessGet, sessClear
}
