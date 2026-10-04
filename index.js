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

const { initWA, wa } = require('./lib/wa')

const config = require('./config')
const db = require('./lib/db')
const ai = require('./lib/ai')
const { serialize } = require('./lib/serialize')
const registry = require('./commands/index')
const thb = require('./lib/thbbridge')
// muat plugin tambahan dari folder plugins/ (tool dev .>_)
try {
  const pl = registry.loadPlugins()
  if (pl.loaded.length || pl.errors.length) {
    log.info(`plugin: ${pl.loaded.length} loaded` + (pl.errors.length ? `, ${pl.errors.length} error: ${pl.errors.join('; ')}` : ''))
  }
} catch (e) { log.warn('loadPlugins gagal:', e.message) }
const { log, sleep, truncate } = require('./lib/util')
const { isGroupAdmin } = require('./lib/groupmeta')
const { closestFeature } = require('./lib/typo')
const greet = require('./lib/greet')
const { startServer } = require('./server')

const ownerJids = [
  `${config.ownerNumber}@s.whatsapp.net`,
  config.ownerLid
]

/* ── trigger chat santai (permintaan owner) ── */
const triggerCd = new Map()
const spamWin = new Map()   // antispam: window pesan per user
const slowTs = new Map()    // slowmode: ts pesan terakhir per user+chat
const slowNotice = new Map() // jid → ts terakhir
const KONTOL_REPLIES = ['lu jangan toxic anjenk', 'lu diam aja zionis']
function chatTrigger(m) {
  const t = (m.text || '').trim()
  if (!t) return false
  const now = Date.now()
  const last = triggerCd.get(m.sender) || 0
  if (now - last < 8000) return false
  if (t.toLowerCase() === 'p') {
    triggerCd.set(m.sender, now)
    m.reply('pa pe pa pe, yahudi lu?')
    return true
  }
  if (/kontol/i.test(t)) {
    triggerCd.set(m.sender, now)
    m.reply(KONTOL_REPLIES[Math.floor(Math.random() * KONTOL_REPLIES.length)])
    return true
  }
  return false
}

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
    // owner: semua command terdaftar bebas dipanggil dengan prefix owner
    return runOwner(cmd, m, sock)
  }

  // ── PREFIX "." — semua user (role dicek per command) ──
  const cmd = registry.resolve(cmdName)
  if (!cmd) {
    // fitur salah ketik → AI yang jawab (lihat handleUnknownCommand)
    return handleUnknownCommand(m, sock, cmdName)
  }
  if (cmd.access === 'owner') {
    // owner tetap boleh memakai "." sesuai permintaan; selain owner tetap dikunci
    if (m.isOwner) return runOwner(cmd, m, sock)
    return m.reply(
      `🔒 *${cmd.name}* khusus owner.\n` +
      `Info lengkap: *${config.userPrefix}menuowner*`
    )
  }
  if (cmd.access === 'admin' && !m.isOwner) {
    const adminOk = await isGroupAdmin(sock, m)
    if (!adminOk) return m.reply(`🔒 *${cmd.name}* khusus *admin* grup.`)
  }
  if (!cmd.prefixes.includes(prefix) && !m.isOwner) {
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

  // statistik pemakaian (untuk .level/.statistik/.medali)
  if (m.user) {
    if (!m.user.stats) m.user.stats = { cmds: 0, firstAt: Date.now() }
    m.user.stats.cmds = (m.user.stats.cmds || 0) + 1
    db.save()
  }

  try {
    await cmd.run(m, sock, m.args)
  } catch (e) {
    log.err(`command .${cmdName} error:`, e)
    try { await m.reply('⚠️ Terjadi kesalahan saat menjalankan perintah.\n' + truncate(String(e.message || e), 300)) } catch (_) {}
  }
}

/* fitur tidak dikenal (salah ketik) → saran format persis / AI yang balas */
async function handleUnknownCommand(m, sock, name) {
  const match = closestFeature(name, { owner: m.isOwner })
  if (match) {
    return m.reply(`lu salah mengetik fitur, ketiklah ini '${match.name}'`)
  }
  const aiCfg = db.load().settings.ai
  const aiEnabled = aiCfg ? aiCfg.enabled !== false : true
  if (aiEnabled) {
    try {
      return await ai.handleAI(sock, m, { text: m.text })
    } catch (e) {
      log.err('ai (unknown cmd):', e)
    }
  }
  if (!m.isGroup) {
    return m.reply(
      `❓ Fitur *${config.userPrefix}${name}* nggak ada.\nKetik *${config.userPrefix}menu* buat lihat semua fitur.`
    )
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
  const w = wa()
  const makeWASocket = w.default
  const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = w

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

  /* ── lacak ID pesan bot (untuk deteksi "user membalas pesan AI/bot") ── */
  const botMsgIds = new Set()
  const origSend = sock.sendMessage.bind(sock)
  sock.sendMessage = async (jid, content, opts) => {
    const r = await origSend(jid, content, opts)
    try {
      if (r?.key?.id) {
        botMsgIds.add(r.key.id)
        if (botMsgIds.size > 800) botMsgIds.clear()
      }
    } catch (_) {}
    return r
  }

  /* ── welcome / goodbye otomatis ── */
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    thb.onGroupUpdate({ id, participants, action }).catch(() => {})
    try {
      const botJid = (sock.user?.id || '').split(':')[0].split('@')[0]
      for (const p of participants) {
        if (p.split('@')[0] === botJid) continue
        if (action === 'add') await greet.sendWelcome(sock, id, p)
        else if (action === 'remove') await greet.sendGoodbye(sock, id, p)
      }
    } catch (e) {
      log.warn('event peserta grup:', e.message)
    }
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

  sock.ev.on('messages.delete', (info) => {
    for (const msg of (info && info.messages) || []) {
      if (!msg || !msg.key || msg.key.fromMe) continue
      thb.onDelete({
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant || msg.key.remoteJid
      }).catch(() => {})
    }
  })

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
      thb.init(sock).catch(e => log.err('THB init:', e))
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

        // ── BUNGKAM: hapus semua pesan user yang sedang dibungkam ──
        {
          const settings0 = db.load().settings
          const muted = settings0.muted || {}
          const mute = muted[m.sender]
          if (mute) {
            const now = Date.now()
            if (mute.until > now && mute.chat === m.chat) {
              try {
                await sock.sendMessage(m.chat, { delete: m.key })
              } catch (e) {
                log.warn('hapus pesan bungkam gagal (bot perlu admin):', e.message)
              }
              continue
            } else if (mute.until <= now) {
              delete muted[m.sender]
              db.save()
            }
          }
        }

        // ── AFK: user kembali dari AFK / mention user yang AFK ──
        {
          const st = db.load().settings
          if (!st.afk) st.afk = {}
          const own = st.afk[m.sender]
          if (own && !m.isOwner) {
            const dur = Math.max(1, Math.round((Date.now() - (own.since || Date.now())) / 60000))
            delete st.afk[m.sender]
            db.save()
            if (m.isGroup) {
              await sock.sendMessage(m.chat, {
                text: `👋 @${m.sender.split('@')[0]} kembali dari AFK (${dur} menit lalu${own.reason ? ' • ' + own.reason : ''})`,
                mentions: [m.sender]
              })
            }
          }
          if (m.mentions?.length) {
            const rows = []
            for (const j of m.mentions) {
              const a = st.afk[j]
              if (a) rows.push(`@${j.split('@')[0]} lagi AFK${a.reason ? ' — ' + a.reason : ''} (sejak ${Math.round((Date.now() - (a.since || Date.now())) / 60000)} menit lalu)`)
            }
            if (rows.length) {
              await sock.sendMessage(m.chat, { text: rows.join('\n'), mentions: m.mentions })
            }
          }
        }

        // ── ANTILINK: hapus pesan berisi link grup/channel ──
        if (m.isGroup && !m.isOwner) {
          const gc = (db.load().settings.groupcfg || {})[m.chat]
          if (gc?.antilink && /chat\.whatsapp\.com\/|whatsapp\.com\/channel\//i.test(m.text || '')) {
            const adminOk = await isGroupAdmin(sock, m)
            if (!adminOk) {
              try {
                await sock.sendMessage(m.chat, { delete: m.key })
                await sock.sendMessage(m.chat, {
                  text: `🚫 @${m.sender.split('@')[0]} link grup/channel dilarang di sini, pesan dihapus.`,
                  mentions: [m.sender]
                })
              } catch (e) {
                log.warn('antilink gagal hapus (bot perlu admin):', e.message)
              }
              continue
            }
          }
        }

        // ── ANTITOXIC / ANTISPAM / SLOWMODE (grup) ──
        if (m.isGroup && !m.isOwner) {
          const gcfg = (db.load().settings.groupcfg || {})[m.chat]
          if (gcfg) {
            const txt = m.text || ''

            // kata kasar → hapus + warn hitungan
            if (gcfg.antitoxic && txt && /(anjing|babi|bangsat|goblok|goblog|tolol|memek|kampret|monyet|idiot|fuck|bitch|kontol)/i.test(txt)) {
              const adminMe = await isGroupAdmin(sock, m)
              if (!adminMe) {
                try {
                  await sock.sendMessage(m.chat, { delete: m.key })
                  gcfg.toxicCount = gcfg.toxicCount || {}
                  gcfg.toxicCount[m.sender] = (gcfg.toxicCount[m.sender] || 0) + 1
                  db.save()
                  await sock.sendMessage(m.chat, {
                    text: `🧹 @${m.sender.split('@')[0].split(':')[0]} kata kasar tidak diterima di sini (cekbacot: *.cekbacot*)`,
                    mentions: [m.sender]
                  })
                } catch (e) { log.warn('antitoxic gagal hapus:', e.message) }
                continue
              }
            }

            // antispam: ≥5 pesan dalam 5 detik → hapus
            if (gcfg.antispam) {
              const now = Date.now()
              const wins = (spamWin.get(m.sender) || []).filter(t => now - t < 5000)
              wins.push(now)
              spamWin.set(m.sender, wins)
              if (wins.length >= 5) {
                try {
                  await sock.sendMessage(m.chat, { delete: m.key })
                } catch (_) {}
                if (!slowNotice.has('spam:' + m.sender) || now - slowNotice.get('spam:' + m.sender) > 10000) {
                  slowNotice.set('spam:' + m.sender, now)
                  await sock.sendMessage(m.chat, { text: `🚫 @${m.sender.split('@')[0].split(':')[0]} terlalu cepat (antispam)!`, mentions: [m.sender] })
                }
                continue
              }
            }

            // slowmode: pesan > X detik setelah pesan sebelumnya → hapus
            if (gcfg.slow > 0) {
              const now = Date.now()
              const last = slowTs.get(m.chat + ':' + m.sender) || 0
              if (last && now - last < gcfg.slow * 1000) {
                try { await sock.sendMessage(m.chat, { delete: m.key }) } catch (_) {}
                if (!slowNotice.has('slow:' + m.sender) || now - slowNotice.get('slow:' + m.sender) > 8000) {
                  slowNotice.set('slow:' + m.sender, now)
                  await sock.sendMessage(m.chat, { text: `⏳ Slowmode *${gcfg.slow} detik* — tunggu dulu ya.` })
                }
                continue
              }
              slowTs.set(m.chat + ':' + m.sender, now)
            }
          }
        }

        // ── TRIGGER CHAT (p / kontol) — sebelum AI supaya tidak dimakan AI ──
        if (!m.prefix && chatTrigger(m)) continue

        // ── teks polos: serahkan ke engine THB lebih dulu (session game dll).
        //    Pump berhitung: kalau THB membalas → selesai; kalau tidak → AI vex1fz.
        if (!m.prefix && thb.ready()) {
          if (await thb.pumpCounted(sock, [raw], 'notify')) continue
        }

        // ── AI chatbot: balasan ke pesan bot / auto mode (tanpa prefix) ──
        if (!m.prefix || !m.command) {
          const aiCfg = db.load().settings.ai
          const enabled = aiCfg ? aiCfg.enabled !== false : true
          // deteksi reply ke pesan bot: via fromMe QUOTE atau ID pesan yang pernah bot kirim
          // (contextInfo.participant di chat pribadi sering tidak diisi → jangan andalkan itu saja)
          let replyToBot = !!m.quoted?.key?.fromMe
          if (!replyToBot && m.quoted?.key?.id) replyToBot = botMsgIds.has(m.quoted.key.id)
          if (!replyToBot && m.quoted && !m.isGroup) {
            const botJid = (sock.user?.id || '').split(':')[0]
            replyToBot = !!botJid && m.quoted.sender === botJid
          }
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

        // ── PARTISI THERYHANN: perintah milik vendor & bukan milik kita → THB ──
        if (m.prefix === config.userPrefix && m.command && !registry.resolve(m.command) && thb.hasCommand(m.command)) {
          await thb.pump([raw], 'notify')
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
  await initWA() // ESM @japofc/baileys wajib di-load sebelum startBot
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
