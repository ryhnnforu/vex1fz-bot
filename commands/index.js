/**
 * commands/index.js — registry semua command
 *
 * access  : 'user'  → prefix "." (semua user)
 *           'owner' → prefix "/", ",", "=>" (hanya owner)
 * prefixes: daftar prefix yang diperbolehkan memanggil command
 */
const general = require('./general')
const downloader = require('./downloader')
const game = require('./game')
const rpg = require('./rpg')
const islami = require('./islami')
const profile = require('./profile')
const owner = require('./owner')
const ai = require('./ai')

const all = [
  ...general,
  ...downloader,
  ...game,
  ...rpg,
  ...islami,
  ...profile,
  ...owner,
  ...ai
]

const byName = new Map()
for (const cmd of all) {
  byName.set(cmd.name.toLowerCase(), cmd)
  for (const a of cmd.aliases || []) byName.set(a.toLowerCase(), cmd)
}

function resolve(name) {
  if (!name) return null
  return byName.get(String(name).toLowerCase()) || null
}

function count() {
  return all.length
}

function list() {
  return all
}

module.exports = { resolve, count, list, all: byName }
