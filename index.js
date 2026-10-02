/**
 * ════════════════════════════════════════════════════════════
 *   VEX1FZ BOT — index.js (entry point)
 *   Baileys + ButtonList + multi prefix:
 *     "."  → semua user
 *     "/" "," "=>" → khusus owner
 * ════════════════════════════════════════════════════════════
 */
const path = require('path')
const util = require('util')
const pino = require('pino')
const qrcode = require('qrcode-terminal')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  jidNormalizedUser
} = require('@whiskeysockets/baileys')

const config = require('./config')
const db = require('./lib/db')
const ai = require('./lib/ai')
const { serialize } = require('./lib/serialize')
const registry = require('./commands/index')
const { log, sleep, truncate } = require('./lib/util')
const { startServer } = require('./server')

const ownerJids = [
  `${config.ownerNumber}@s.whatsapp.net`,
  config.ownerLid
]

/* ═══════════ banner pairing code ═══════════ */
function printBanner(title, lines) {
  console.log('\n\x1b[36m╔══════════════════════════════════════════╗')
  console.log('║\x1b[1m ' + title.padEnd(42) + '\x1b[0m\x1b[36m ║')
  console.log('╠══════════════════════════════════════════╣')
  for (const l of lines) console.log('║\x1b[0m ' + l.padEnd(42).slice(0, 44) + '\x1b[36m ║')
  console.log('╚══════════════════════════════════════════╝\x1b[0m\n')
}

/* ═══════════ eval owner (prefix =>) ═══════════ */
async function runEval(m, code) {
  if (!m.isOwner) return m.reply('🔒 Fitur eval hanya untuk *owner*.')
  if (!code) {
    return m.reply(
      'Contoh:\n' +
      '```=> 1 + 1\n=> shell ls -la\n=> process.version```'
    )
  }
  const attempts = [
    `(async () => { return (${code}) })()`,
    `(async () => { ${code} })()`,
    code
  ]
  let result
  let err
  for (const a of attempts) {
    try {
      result = await eval(a)
      err = null
      break
    } catch (e) {
      err = e
    }
  }
  if (err) return m.reply('```❌ ' + truncate(String(err.message || err), 1500) + '```')
  const out = util.inspect(result, { depth: 2, colors: false, maxArrayLength: 30 })
  await m.reply('```' + truncate(out === 'undefined' ? 'undefined (ok)' : out, 3800) + '```')
}

/* ═══════════ dispatcher ═══════════ */
const cooldown = new Map() // chat -> ts

async function handle(m, sock) {
  const prefix = m.prefix
  const cmdName = m.command
  if (!prefix) return
  // "=>" tanpa isi → tampilkan contoh eval
  if (!cmdName) {
    if (prefix === '=>' && m.isOwner) return runEval(m, '')
    return
  }

  // ── PREFIX OWNER (/, ,, =>) — hanya owner ──
  if (prefix !== config.userPrefix) {
    if (!m.isOwner) {
      const known = registry.resolve(cmdName)
      if ((known && known.access === 'owner') || prefix === '=>') {
        return m.reply(
          `🔒 Prefix *${prefix}* hanya untuk *owner*.\n` +
          `Fitur umum pakai prefix *${config.userPrefix}* — ketik *${config.userPrefix}menu*`
        )
      }
      return // diamkan agar tidak spam
    }

    // mode '=>': selain command terdaftar (shell), sisanya = eval
    if (prefix === '=>') {
      const cmd = registry.resolve(cmdName)
      if (cmd && cmd.prefixes.includes('=>')) {
        return runOwner(cmd, m, sock)
      }
      return runEval(m, m.body)
    }

    const cmd = registry.resolve(cmdName)
    if (!cmd) {
      // di grup diamkan (hindari balasan saat owner mengetik obrolan biasa)
      if (m.isGroup) return
      return m.reply(`❓ Perintah *${prefix}${cmdName}* tidak dikenal.\nKetik *.menuowner* untuk daftar fitur owner.`)
    }
    if (!cmd.prefixes.includes(prefix)) {
      return m.reply(
        `⚠️ *${cmd.name}* bukan perintah prefix *${prefix}*.\n` +
        `Coba: *${cmd.prefixes[0]}${cmd.name}* atau lihat *.menuowner*`
      )
    }
    return runOwner(cmd, m, sock)
  }

  // ── PREFIX "." — semua user ──
  const cmd = registry.resolve(cmdName)
  if (!cmd) {
    if (!m.isGroup) {
      m.reply(`❓ Perintah *${config.userPrefix}${cmdName}* tidak ada.\nKetik *${config.userPrefix}menu* untuk melihat semua fitur.`)
    }
    return
  }
  if (cmd.access === 'owner') {
    return m.reply(
      `🔒 *${cmd.name}* khusus owner — gunakan prefix *${cmd.prefixes[0]}* (contoh: *${cmd.prefixes[0]}${cmdName}*).\n` +
      `Info lengkap: *${config.userPrefix}menuowner*`
    )
  }
  if (!cmd.prefixes.includes(prefix)) {
    return m.reply(`⚠️ Gunakan prefix *${cmd.prefixes[0]}* untuk *${cmd.name}*`)
  }

  // batasan mode / ban / limit / cooldown
  const settings = db.load().settings
  if (settings.mode === 'self' && !m.isOwner) return

  const now = Date.now()
  const cd = m.isOwner ? 0 : 1200
  if (cooldown.get(m.chat) && now - cooldown.get(m.chat) < cd) return
  cooldown.set(m.chat, now)

  // limit harian (menu/info gratis)
  if (!m.isOwner && !['menu', 'info', 'minigame'].includes(cmd.category)) {
    const u = m.user
    if (u) {
      db.resetLimitIfNeeded(u)
      if ((u.limit ?? config.dailyLimit) <= 0) {
        return m.reply(`⚠️ Limit harian habis (${config.dailyLimit}/hari).\nCoba lagi besok atau ketik *.menu*.`)
      }
      u.limit--
      db.save()
    }
  }

  try {
    await cmd.run(m, sock, m.args)
  } catch (e) {
    log.err(`command .${cmdName} error:`, e)
    try { await m.reply('⚠️ Terjadi kesalahan saat menjalankan perintah.\n' + truncate(String(e.message || e), 300)) } catch (_) {}
  }
}

async function runOwner(cmd, m, sock) {
  if (cmd.access === 'owner' && !m.isOwner) {
    return m.reply('🔒 Khusus owner.')
  }
  log.owner(`${m.sender.split('@')[0]} → ${cmd.prefixes[0]}${cmd.name} ${m.args.join(' ')}`)
  try {
    await cmd.run(m, sock, m.args)
  } catch (e) {
    log.err(`owner command ${cmd.name} error:`, e)
    try { await m.reply('⚠️ Error: ' + truncate(String(e.message || e), 300)) } catch (_) {}
  }
}

/* ═══════════ koneksi ═══════════ */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    options: { timeout: 60_000 }
  })

  let codeTries = 0
  let pairingScheduled = false
  async function requestPairing() {
    if (state.creds.registered) return
    const num = (config.botNumber || '').replace(/[^0-9]/g, '')
    if (!num) {
      printBanner('LOGIN MODE PAIRING', [
        'BOT_NUMBER belum diisi!',
        'Isi dulu di config.js / .env, lalu',
        'jalankan ulang: npm start'
      ])
      return
    }
    try {
      const code = await sock.requestPairingCode(num)
      printBanner('PAIRING CODE — masukkan di HP', [
        `Nomor bot : ${num}`,
        `KODE      : ${code.slice(0, 4)} ${code.slice(4)}`,
        'WhatsApp → Perangkat Tertaut →',
        'Tautkan dengan nomor telepon'
      ])
    } catch (e) {
      codeTries++
      if (codeTries < 4) {
        log.warn(`gagal minta pairing code (coba ${codeTries}/3):`, e.message)
        await sleep(3000)
        return requestPairing()
      }
      log.err('pairing code gagal total:', e.message)
    }
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (u) => {
    const { connection, lastDisconnect, qr } = u

    if (qr && !state.creds.registered) {
      if (config.loginMode === 'pairing') {
        // minta kode sekali saat HP mulai men-link
        if (!pairingScheduled) {
          pairingScheduled = true
          setTimeout(requestPairing, 1200)
        }
      } else {
        printBanner('SCAN QR DENGAN HP', ['buka WhatsApp → Perangkat Tertaut'])
        qrcode.generate(qr, { small: true })
      }
    }

    if (connection === 'connecting') log.info('menghubungkan ke WhatsApp...')

    if (connection === 'open') {
      log.ok(`terhubung! bot: ${sock.user?.id} (${sock.user?.name || '-'})`)
      printBanner('BOT ONLINE ✅', [
        `Nama    : ${config.botName} ${config.version}`,
        `Owner   : ${config.ownerNumber}`,
        `Mode    : ${(db.load().settings.mode || config.mode)}`,
        `Prefix  : . / , =>`,
        `Game    : port ${config.port}`
      ])
      // notifikasi ke owner
      try {
        for (const oj of ownerJids) {
          await sock.sendMessage(oj, {
            text: `✅ *${config.botName}* ONLINE\nMode: ${(db.load().settings.mode || config.mode).toUpperCase()}\nFitur: ${registry.count()} command\nKetik *.menu* untuk mulai.`
          })
        }
      } catch (e) { log.warn('notifikasi owner gagal:', e.message) }
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const loggedOut = code === DisconnectReason.loggedOut
      log.warn(`koneksi terputus (code ${code})...`)
      if (loggedOut) {
        log.err('session logout — hapus folder auth/ lalu scan ulang / pairing ulang.')
        process.exit(1)
      }
      log.info('reconnect dalam 3 detik...')
      await sleep(3000)
      startBot()
    }
  })

  /* ═══════════ pesan masuk ═══════════ */
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const raw of messages) {
      try {
        if (raw.message?.protocolMessage) continue
        const m = serialize(sock, raw)
        if (!m) continue
        if (m.fromMe) continue

        db.touchChat(m.chat, m.isGroup ? 'group' : 'private')

        // banned (cek berdasarkan pengirim)
        if (m.user?.banned && !m.isOwner) continue

        // mode self
        if ((db.load().settings.mode || config.mode) === 'self' && !m.isOwner) continue

        // ── AI chatbot: balasan ke pesan bot / auto mode (tanpa prefix) ──
        if (!m.prefix || !m.command) {
          const aiCfg = db.load().settings.ai
          const enabled = aiCfg ? aiCfg.enabled !== false : true
          const replyToBot = !!m.quoted?.key?.fromMe
          const autoOk = aiCfg?.auto && !m.isGroup && !m.prefix
          if (enabled && (replyToBot || autoOk)) {
            try {
              await ai.handleAI(sock, m, {})
            } catch (e) {
              log.err('ai error:', e)
            }
          }
          continue
        }

        await handle(m, sock)
      } catch (e) {
        log.err('upsert error:', e)
      }
    }
  })

  return sock
}

/* ═══════════ main ═══════════ */
;(async () => {
  console.log('\x1b[35m')
  console.log('  __ _ _ __   __ _ _   _ _ __ ___   ___  _ __   __ _ ')
  console.log(' / _` | \'_ \\ / _` | | | | \'_ ` _ \\ / _ \\| \'_ \\ / _` |')
  console.log('| (_| | | | | (_| | |_| | | | | | | (_) | | | | (_| |')
  console.log(' \\__,_|_| |_|\\__, |\\__,_|_| |_| |_|\\___/|_| |_|\\__,_|')
  console.log('             |___/         v1.0.0 • Baileys')
  console.log('\x1b[0m')

  db.load()
  startServer()
  log.info(`prefix user: "${config.userPrefix}" | prefix owner: ${config.ownerPrefixes.join(' ')}`)
  log.info(`owner: ${config.ownerNumber} | lid: ${config.ownerLid}`)
  log.info(`total command terdaftar: ${registry.count()}`)

  if (config.loginMode === 'pairing' && !config.botNumber) {
    printBanner('INGAT: ISI NOMOR BOT', [
      'Buka config.js atau file .env,',
      'isi BOT_NUMBER=628xxxxxxx',
      'lalu jalankan ulang npm start'
    ])
  }

  await startBot()
})().catch((e) => {
  log.err('fatal:', e)
  process.exit(1)
})
