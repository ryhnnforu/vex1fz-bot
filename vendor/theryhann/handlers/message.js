/**
 * ============================================================
 *  MESSAGE HANDLER — THERYHANN!
 *  Menerima pesan, parsing command, cek permission, eksekusi fitur
 * ============================================================
 */
import chalk from 'chalk'
import { areJidsSameUser, isJidGroup } from '../shims/elaina.mjs'
import { config } from '../config.js'
import { smsg, getButtonId, downloadToFile } from '../lib/serializer.js'
import {
  findPlugin,
  listPlugins,
  categories,
  isCooldown,
  loadPlugins
} from '../lib/plugins.js'
import {
  getUser,
  loadDB,
  getGroup,
  getSettings,
  useLimit,
  addHit,
  getMemory,
  pushMemory,
  saveNow,
  saveDB
} from '../lib/database.js'
import {
  sendSmartMenu,
  sendButtons,
  sendList,
  sendInteractive,
  sendAIRich,
  resolveMenuMode
} from '../lib/interactive.js'
import { aiChat, aiImage, aiTTS, activePersona } from '../lib/ai.js'
import { checkGameAnswer } from '../features/games.js'
import { checkLabAnswer } from '../features/gameslab.js'
import { tambahWarn, resetWarn } from '../features/grouplab.js'
import { checkAkinatorAnswer, balasAkin } from '../features/akinator.js'
import { checkAirichGame } from '../features/airichgames.js'
import { mulaiPenjadwal, tick as tickScheduler } from '../lib/scheduler.js'
import { mulaiSewa, bolehLayani } from '../features/sewabot.js'
import { periksaTurnamen } from '../features/turnamen.js'
import { cekSetorOtomatis } from '../features/lbgame.js'
import { cekKodeEpisode } from '../features/arcadecerita.js'
import { addExp as rpgAddExp, setOnLevelUp, getRPG as rpgGet } from '../lib/rpg.js'
import { kartuLevelHtml, gelarLevel } from '../lib/kartulevel.js'
import { sendHtmlApp as kirimHtmlLevel } from '../lib/htmlapp.js'

/* v7.29.0 — kartu naik level otomatis (semua sumber EXP) */
const CHAT_TERAKHIR = new Map() /* user -> { jid, nama } */
setOnLevelUp(async ({ jid, dari, ke, hadiah, exp, butuh }) => {
  const s = globalThis.__sockAktif || sock; if (!s) return
  const info = CHAT_TERAKHIR.get(jid) || { jid, nama: 'Member' }
  const html = kartuLevelHtml(config.bot.name, { nama: info.nama, dari, ke, hadiah, exp, butuh, gelar: gelarLevel(ke) })
  try { await kirimHtmlLevel(s, info.jid, { title: `🎉 LEVEL UP — ${info.nama} → Lv.${ke}`, html }) } catch {}
  try { await s.sendMessage(info.jid, { text: `🎉 *SELAMAT @${String(jid).split('@')[0]}!* Naik ke *Level ${ke}* (${gelarLevel(ke)})\n💰 Hadiah level: +${hadiah.toLocaleString('id-ID')} · HP & energi pulih\nLihat: \`${config.display.prefix}profile\``, mentions: [jid] }) } catch {}
})
import { checkAirichLab } from '../lib/airichgame.js'
import { checkPlayer } from '../lib/musikplayer.js'
import { checkAfk } from '../features/extra.js'
import { clockString, formatDuration, truncate, tanggalWIB, chunkText } from '../lib/functions.js'
import { makeCard, randomTheme } from '../lib/canvas.js'
import { resolveMenuImage, resolveImageValue } from '../lib/menuimg.js'
import {
  aliasesOf,
  isLid,
  isOwnerIdentity,
  findParticipant,
  isAdminParticipant,
  learnMapping,
  canonKey,
  sameIdentity
} from '../lib/identity.js'
import log from '../lib/logger.js'
import { catatPesan } from '../lib/aktivitasgrup.js'

/** @type {import('../shims/elaina.mjs').WASocket} */
export let sock = null
/** daftar pemilik (sudah di-normalisasi ke @s.whatsapp.net) */
export let OWNERS = []

export function initHandler (socket, owners = []) {
  sock = socket
  OWNERS = (Array.isArray(owners) ? owners : [owners])
    .filter(Boolean)
    .map(n => String(n).replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  /* v7.7.3: hidupkan penjadwal pengingat (interval internal idempoten) */
  try { mulaiPenjadwal(socket) } catch (e) { console.error('[scheduler] gagal inisiasi:', e && e.message) }
  /* v7.23.0: pemeriksa masa sewa grup (auto pamit & keluar) */
  try { mulaiSewa(socket) } catch (e) { console.error('[sewa] gagal inisiasi:', e && e.message) }
}

/**
 * Cek owner. Menerima satu JID ATAU array identitas (m.senderAlts).
 * Tahan terhadap LID addressing (xxx@lid vs 628xxx@s.whatsapp.net).
 */
export function isOwnerNumber (jid) {
  if (!jid) return false
  const cands = Array.isArray(jid) ? jid : aliasesOf(jid)
  return isOwnerIdentity(cands, OWNERS)
}

/* ------------------------------------------------------------------ */
/*  HANDLER UTAMA                                                      */
/* ------------------------------------------------------------------ */
/* ---------- CRM (.crm) ----------
 * checkCrm dimuat DINAMIS, bukan dengan import statis dari features/crm.js.
 * Import statis membuat bot GAGAL START (ERR_MODULE_NOT_FOUND) kalau crm.js
 * belum ada — misalnya di HP yang baru ditambal tapi belum pasang fiturnya
 * lewat `.>_`. Tanpa file itu bot tetap jalan normal, hanya saja jawaban
 * form CRM tidak ditangkap. */
let checkCrm = null
try {
  const modCrm = await import('../features/crm.js')
  if (typeof modCrm.checkCrm === 'function') checkCrm = modCrm.checkCrm
} catch { /* features/crm.js belum dipasang — fitur .crm nonaktif, bot tetap jalan */ }

/* ---------- BASH (.bash) ----------
 * Sama seperti checkCrm: dimuat dinamis supaya bot tetap hidup walau
 * features/bash.js belum dipasang. */
let checkBash = null
try {
  const modBash = await import('../features/bash.js')
  if (typeof modBash.checkBash === 'function') checkBash = modBash.checkBash
} catch { /* features/bash.js belum dipasang — fitur .bash nonaktif, bot tetap jalan */ }

export async function messageHandler (messages, type) {
  if (type !== 'notify') return
  for (const raw of messages) {
    try {
      if (!raw?.message) continue
      if (raw.key?.remoteJid === 'status@broadcast') continue
      if (raw.key?.id?.startsWith('BAE5') && raw.key?.id?.length === 16) continue

      const m = smsg(sock, raw)
      if (!m || !m.jid) continue
      if (m.fromMe && !m.isCommand) continue
      if (m.isBot && !m.buttonId) continue

      const settings = getSettings()

      /* ---------- SELF MODE ---------- */
      if (!settings.public && !m.fromMe && !isOwnerNumber(m.senderAlts || m.sender)) continue

      /* ---------- KELENGKAPAN ---------- */
      m.settings = settings
      m.config = config
      m.sock = sock
      m.client = sock
      m.owners = OWNERS
      // kunci DB kanonik: pakai bentuk PN kalau dikenal, biar tidak dobel profil
      m.senderKey = canonKey(m.sender, m.senderAlts)
      m.isOwner = m.fromMe || isOwnerNumber(m.senderAlts || m.sender)
      m.userDB = getUser(m.senderKey)
      /* v7.15: ingat nama tampilan (dipakai kartu welcome/promote agar bukan angka LID) */
      if (m.pushName && m.userDB.name !== m.pushName) { m.userDB.name = String(m.pushName).slice(0, 40); try { simpanNama(m.senderAlts || [m.sender], m.pushName) } catch {} }
      /* v7.7: premium bertempo otomatis kedaluwarsa (kodepromo/addprem <hari>) */
      if (m.userDB.premium && m.userDB.premiumUntil && m.userDB.premiumUntil <= Date.now()) {
        m.userDB.premium = false
        m.userDB.premiumUntil = null
        saveNow('users')
      }
      m.isPremium = m.isOwner || !!m.userDB.premium
      /* v7.29.0 — EXP per chat (anti-spam: maks 1x/20 dtk) → auto naik level */
      try {
        const kUser = m.senderKey || m.sender
        CHAT_TERAKHIR.set(kUser, { jid: m.jid, nama: m.pushName || m.userDB.name || 'Member' })
        if (!m.fromMe && Date.now() - (m.userDB.lastExpChat || 0) > 20000 && String(m.text || '').length > 1) {
          m.userDB.lastExpChat = Date.now()
          rpgAddExp(kUser, 3 + Math.min(12, Math.floor(String(m.text || '').length / 12)))
        }
      } catch {}
      m.plugins = listPlugins()
      m.categories = categories()
      m.runtime = () => formatDuration((Date.now() - (settings.uptimeStart || Date.now())))
      m.clock = clockString
      m.download = () => downloadToFile(m)

      // helper kirim pesan
      m.reply = async (text, opt = {}) => {
        const isi = String(text ?? '')
        // pesan panjang dipecah otomatis (batas WhatsApp 4096 karakter)
        const bagian = isi.length > 3900 ? chunkText(isi, 3800) : [isi]
        let hasil = null
        for (let i = 0; i < bagian.length; i++) {
          const suffix = bagian.length > 1 ? `\n\n_(${i + 1}/${bagian.length})_` : ''
          hasil = await sock.sendMessage(
            m.jid,
            { text: bagian[i] + suffix, contextInfo: opt.noContext ? undefined : contextMention(m, opt.mentions) },
            { quoted: i === 0 ? (opt.quoted === false ? undefined : opt.quoted || m.raw) : undefined, ...opt.extra }
          )
        }
        return hasil
      }
      m.sendButtons = (opt = {}) =>
        sendButtons(sock, m.jid, { footer: settings.footer || config.bot.footer, quoted: m.raw, ...opt })
      m.sendList = (opt = {}) =>
        sendList(sock, m.jid, { footer: settings.footer || config.bot.footer, quoted: m.raw, ...opt })
      m.sendInteractive = (opt = {}) =>
        sendInteractive(sock, m.jid, { footer: settings.footer || config.bot.footer, quoted: m.raw, ...opt })
      m.sendMenu = (opt = {}) =>
        sendSmartMenu(sock, m.jid, {
          footer: m.settings?.footer || config.bot.footer,
          isGroup: m.isGroup,
          quoted: m.raw,
          ...opt
        })
      m.sendAIRich = (opt = {}) =>
        sendAIRich(sock, m.jid, { title: config.bot.name, footer: settings.footer || config.bot.footer, ...opt })
      /* v7.17: kirim ulang otomatis bila 'Connection Closed' (socket sempat putus saat proses gambar berat) */
      const kirimUlang = async (fn, n = 3) => {
        let err
        for (let i = 0; i < n; i++) {
          try { return await fn() } catch (e) {
            err = e
            if (!/Connection Closed|Timed Out|not open|closed/i.test(String(e?.message || e))) throw e
            await new Promise(r => setTimeout(r, 2500 * (i + 1)))
          }
        }
        throw err
      }
      m.kirimUlang = kirimUlang
      m.sendImage = (media, caption, opt = {}) =>
        kirimUlang(() => (globalThis.__sockAktif || sock).sendMessage(m.jid, { image: media, caption, ...opt }, { quoted: m.raw }))
      m.sendVideo = (media, caption, opt = {}) =>
        sock.sendMessage(m.jid, { video: media, caption, ...opt }, { quoted: m.raw })
      /* v7.32.0 — default ptt:false. PTT (voice note) wajib Opus; MP3 + ptt:true
         membuat client menampilkan "audio tidak tersedia karena ada masalah pada file".
         ffmpeg bot tidak punya libopus sehingga PTT asli tidak bisa dibuat —
         semua audio dikirim sebagai pesan audio biasa (tetap bisa diputar). */
      m.sendAudio = (media, opt = {}) =>
        sock.sendMessage(m.jid, { audio: media, mimetype: 'audio/mpeg', ptt: opt.ptt === true, ...opt }, { quoted: m.raw })
      m.sendSticker = (media, opt = {}) =>
        kirimUlang(() => (globalThis.__sockAktif || sock).sendMessage(m.jid, { sticker: media, ...opt }, { quoted: m.raw }))
      m.sendDoc = (media, fileName, mimetype = 'application/octet-stream', opt = {}) =>
        sock.sendMessage(m.jid, { document: media, fileName, mimetype, ...opt }, { quoted: m.raw })
      m.react = async (emoji) => {
        try {
          await sock.sendMessage(m.jid, { react: { text: emoji, key: m.key } })
        } catch {}
      }
      m.typing = () => simulateTyping(m.jid, settings.typing !== false)
      m.fail = (err) => m.reply('❌ ' + (err?.message || err)).catch(() => {})

      /* ---------- GROUP ---------- */
      if (m.isGroup) {
        m.group = await safeGroupMetadata(m.jid)
        if (m.group?.participants && Math.random() < 0.05) pelajariKontak(m.group.participants)
        m.metadata = m.group
        const g = getGroup(m.jid)
        g.members = m.group?.participants?.length || g.members
        m.groupSet = g
        /* ---- FIX: di grup mode LID, participant.id bisa berupa `xxx@lid`
           sehingga perbandingan `p.id === m.sender` selalu gagal.
           Kita cocokkan SEMUA bentuk identitas (PN + LID + alt) dan
           cek field `p.id` MAUPUN `p.lid`. ---- */
        const parts = m.group?.participants || []
        for (const p of parts) learnMapping([p.id, p.lid, p.pn])
        m.addressingMode = m.group?.addressingMode || 'pn'

        const mePart = findParticipant(parts, m.senderAlts && m.senderAlts.length ? m.senderAlts : [m.sender])
        const botPart = findParticipant(parts, m.userAlts && m.userAlts.length ? m.userAlts : [m.user])

        m.participant = mePart || null
        m.botParticipant = botPart || null
        m.isAdmin = isAdminParticipant(mePart)
        m.isBotAdmin = isAdminParticipant(botPart)
        m.groupName = m.group?.subject || 'Grup'
      } else {
        m.isAdmin = false
        m.isBotAdmin = false
        m.groupSet = null
      }

      /* ---------- AKTIVITAS GRUP (dipakai .sider / .kicksider) ----------
       *  setiap pesan member dicatat, bukan hanya perintah bot */
      if (m.isGroup && !m.fromMe) {
        try {
          const mt = String(m.mtype || '')
          const jenis = m.isCommand ? 'perintah' : mt === 'stickerMessage' ? 'stiker' : /^(image|video|audio|document|contact|location|liveLocation|pollCreation|pollUpdate)/.test(mt) ? 'media' : 'teks'
          catatPesan(m.jid, m.senderKey || m.sender, 1, jenis)
        } catch {}
      }

      /* ---------- BANNED ---------- */
      if (m.userDB.banned && !m.isOwner) {
        if (m.isCommand) m.reply(`🚫 Kamu sedang dibanned.\nAlasan: ${m.userDB.bannedReason || '-'}`)
        continue
      }

      /* ---------- GRUP DIBANNED (.bangc) ----------
         Bot berhenti merespons APA PUN di grup ini — diam total, tanpa
         balasan, supaya benar-benar terasa "tidak bisa pakai bot".
         Owner dikecualikan agar bisa `.bangc batal`. */
      if (m.isGroup && !m.isOwner) {
        try {
          const dBan = loadDB('groupban', { grup: {} })
          if (dBan?.grup?.[m.jid]) continue
        } catch {}
      }

      /* ---------- ANTI LINK / ANTI TOXIC ---------- */
      if (m.isGroup && !m.isAdmin && !m.isOwner) { if (await guardGroup(m)) continue }

      /* ---------- READ / PRESENCE ---------- */
      if (settings.readCommand && m.isCommand) {
        try {
          await sock.readMessages([m.key])
        } catch {}
      }

      /* ---------- SCHEDULER: kirim tugas jadwal yang jatuh tempo (tiap pesan) ---------- */
      try { tickScheduler() } catch (e) { log.warn('scheduler tick:', e.message) }

      /* ---------- ROUTING ---------- */
      const body = m.text || ''
      const btnId = m.buttonId || ''
      const isAction = /^act:/.test(btnId)

      if (isAction) return await handleAction(m, btnId)

      /* ---------- BASH: mode shell tanpa prefix ----------
         Dicek SEBELUM routing perintah: saat mode shell nyala, `ls`, `cd`,
         `pwd` tanpa prefix harus jadi perintah shell (foldernya satu), bukan
         ditangkap plugin .ls/.cd milik fitur lain. Hanya pesan tanpa prefix
         yang lewat sini; yang berawalan titik tetap jadi perintah bot.
         Harus SETELAH `const isAction` dideklarasikan (temporal dead zone). */
      if (checkBash && !isAction && !m.isBot && m.isCommand === false) {
        try {
          const bs = await checkBash(m)
          if (bs?.handled) return
        } catch (e) { log.warn('bash check:', e.message) }
      }


      if (m.isCommand && m.command) {
        if (m.isGroup && m.groupSet?.mute && !m.isOwner && !['unmute', 'menu'].includes(m.command)) continue
        return await handleCommand(m)
      }

      /* ---------- CRM: tangkap jawaban user yang sedang mengisi form ---------- */
      if (checkCrm && !isAction && !m.isBot && m.isCommand === false) {
        try {
          const cr = await checkCrm(m)
          if (cr?.handled) return
        } catch (e) { log.warn('crm check:', e.message) }
      }

      /* ---------- AFK ---------- */
      try {
        const afkMsg = checkAfk(m)
        if (afkMsg) await m.reply(afkMsg, { mentions: [m.senderKey || m.sender] }).catch(() => {})
      } catch {}

      /* ---------- AIRICH GAME SESSION (jawab via ketuk pill / teks) ---------- */
      if (!isAction && body && !m.isBot) {
        try {
          const ag = await checkAirichGame(m)
          if (ag?.handled) return
          const ag2 = await checkAirichLab(m)
          if (ag2?.handled) return
        } catch (e) {
          log.warn('airich game check:', e.message)
        }
      }

      /* ---------- MUSIK PLAYER .play2 (kontrol via ketuk pill) ---------- */
      if (!isAction && body && !m.isBot) {
        try {
          const mp = await checkPlayer(m)
          if (mp?.handled) return
        } catch (e) {
          log.warn('musik player check:', e.message)
        }
      }


      /* ---------- TURNAMEN KUIS ANTAR-USER (per grup) ---------- */
      if (!isAction && body && !m.isBot && m.isGroup) {
        try {
          const trn = await periksaTurnamen(m)
          if (trn?.handled) return
        } catch (e) {
          log.warn('turnamen check:', e.message)
        }
      }

      /* ---------- LB AUTO-SETOR (kirim kodenya saja → langsung lbgame) ---------- */
      if (!isAction && body && !m.isBot) {
        try {
          const epX = await cekKodeEpisode(m)
          if (epX?.handled) return
          const lbX = await cekSetorOtomatis(m)
          if (lbX?.handled) return
        } catch (e) {
          log.warn('auto-setor check:', e.message)
        }
      }

      /* ---------- GAME SESSION (jawab kuis tanpa prefix) ---------- */
      if (!isAction && body && !m.isBot) {
        try {
          const g = checkGameAnswer(m) || checkLabAnswer(m) || checkAkinatorAnswer(m)
          if (g) {
            if (g.type === 'hint') return await m.reply(g.text)
            if (g.type === 'akin-cmd') return await balasAkin(m, g.val)
            return await m
              .sendButtons({ title: g.title || '🎉 Jawaban Benar!', text: g.text, buttons: g.buttons || [] })
              .catch(() => m.reply(g.text, { mentions: g.mentions }))
          }
        } catch (e) {
          log.warn('game check:', e.message)
        }
      }

      /* ---------- AI AUTO REPLY ---------- */
      const autoAI = m.isGroup ? !!m.groupSet?.autoai : !!settings.autoReplyAI || !!m.userDB.autoai
      if (autoAI && body && !m.isBot) return await aiAutoReply(m, body)

      /* ---------- AI KETIKA DI-MENTION DI GRUP ---------- */
      if (m.isGroup && m.mentionsBot && body) return await aiAutoReply(m, body.replace(new RegExp(`@${m.user.split('@')[0]}`, 'g'), '').trim() || 'halo')
    } catch (e) {
      log.error('handler:', e.message)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  COMMAND                                                            */
/* ------------------------------------------------------------------ */
async function handleCommand (m) {
  const found = findPlugin(m.command)
  if (!found?.plugin) {
    if (!m.settings.autoReplyAI) return
    return await aiAutoReply(m, m.q || m.command)
  }

  const p = found.plugin
  if (p.disabled) return m.reply(`🚫 Fitur *\`${found.name}\`* sedang dinonaktifkan.`)
  /* v7.23.0: mode ketat sewa — grup tanpa sewa aktif tidak dilayani (kecuali .sewabot/.ceksewa) */
  try { if (!bolehLayani(m) && !p.command.some(c => ['sewabot', 'ceksewa'].includes(c))) return m.reply(`💼 Grup ini belum menyewa *${config.bot.name}*.\nKetik \`${config.display.prefix}ceksewa\` · sewa: wa.me/${config.owner.number}`) } catch {}
  /* v7.9.0: .kuncifitur (owner) — perintah dinonaktifkan global lewat settings.disabled */
  try { const dis = getSettings().disabled; if (Array.isArray(dis) && dis.length && !m.isOwner && p.command.some(c => dis.includes(String(c).toLowerCase()))) return m.reply(`🔒 Perintah *\`${found.name}\`* sedang dikunci owner.`) } catch {}

  // ---------- WAJIB DAFTAR (v7.29.0) ----------
  /* user belum .daftar tidak bisa memakai bot (kecuali daftar/menu/help/owner/ping). Owner bebas.
     Nonaktifkan: .set wajibDaftar off */
  try {
    const wajib = getSettings().wajibDaftar !== false && getSettings().wajibDaftar !== 'off'
    const bebas = ['daftar', 'reg', 'register', 'menu', 'help', 'owner', 'ping', 'start', '?', 'profile', 'me']
    if (wajib && !m.isOwner && !m.userDB?.registered && !p.command.some(c => bebas.includes(c))) {
      return m.sendButtons({
        title: '📝 Daftar dulu yuk',
        text: `🔒 *Kamu belum terdaftar di ${config.bot.name}!*\n\nSemua fitur (game, RPG, AI, downloader, dll) hanya untuk member terdaftar.\n\nDaftar gratis 5 detik:\n\`${config.display.prefix}daftar ${m.pushName || 'Nama'}|18\`\n_(format: nama|umur)_ → dapat kartu member + bonus limit.`,
        buttons: [{ text: '📝 Daftar Sekarang', id: `${config.display.prefix}daftar ${m.pushName || 'Nama'}|18` }, { text: '🏠 Menu', id: 'act:menu:main' }]
      }).catch(() => m.reply(`🔒 Kamu belum terdaftar. Ketik: ${config.display.prefix}daftar ${m.pushName || 'Nama'}|18`))
    }
  } catch {}

  // ---------- PERMISSION ----------
  if (p.owner && !m.isOwner)
    return m.reply(`🔒 *${config.bot.name}*\n\nPerintah ini khusus Owner @${m.config.owner.number}.`, {
      mentions: [m.config.owner.number + '@s.whatsapp.net']
    })
  if (p.group && !m.isGroup) return m.reply('👥 Fitur ini hanya bisa dipakai di dalam grup.')
  if (p.private && m.isGroup) return m.reply('📴 Fitur ini hanya bisa dipakai di chat pribadi.')
  if (p.admin && !m.isAdmin && !m.isOwner) return m.reply('🛡️ Fitur ini khusus Admin grup.')
  if (p.botAdmin && !m.isBotAdmin) return m.reply('🤖 Jadikan bot sebagai Admin grup dulu ya.')
  /* v7.37.0: `.topremium <fitur>` menambahkan kunci premium lewat overlay
     settings.premiumCmd — tanpa perlu menulis ulang file fiturnya.
     Owner selalu lolos. */
  const dikunciPremium = p.premium || (m.settings?.premiumCmd || {})[found.name]
  if (dikunciPremium && !m.isPremium && !m.isOwner) {
    return m.reply(`💎 Fitur ini khusus user *PREMIUM*.\n\nLihat paket: \`${config.display.prefix}hargapremium\`\nAjukan: \`${config.display.prefix}belipremium 30 hari\``)
  }

  // ---------- MODE PER-PERINTAH (v7.7.2: settings.cmdMode) ----------
  /* "self" → hanya owner/bot yang boleh memakai perintah ini (diam, sperti mode self) */
  if (!m.fromMe && !m.isOwner && (m.settings?.cmdMode || {})[found.name] === 'self') {
    console.log(`  🔐 cmdmode=self menyembunyikan ${found.name} dari ${m.sender.split('@')[0]}`)
    return
  }

  // ---------- COOLDOWN ----------
  const cd = p.cooldown || config.limits.cooldown
  const wait = isCooldown(`${m.senderKey || m.sender}:${found.name}`, cd)
  if (wait) return m.reply(`⏳ Tunggu *${wait} detik* lagi sebelum memakai \`${found.name}\`.`)

  // ---------- LIMIT ----------
  const cost = m.isPremium ? 0 : (p.limit ?? (p.owner ? 0 : 1))
  /* v7.7: user premium memakai semua fitur tanpa potong limit */
  if (cost && !useLimit(m.senderKey || m.sender, cost))
    return m.reply(
      `💠 Limit kamu habis (${m.userDB.limit}).\nKetik \`${config.display.prefix}claim\` untuk isi ulang (1x/hari).`
    )

  // ---------- EKSEKUSI ----------
  try {
    await m.typing()
    addHit(found.name, m.senderKey || m.sender)
    log.cmd(
      chalk.green(found.name.padEnd(14)),
      chalk.gray('dari'),
      chalk.white(m.sender.split('@')[0]),
      m.isGroup ? chalk.cyan('in ' + (m.groupName || '')) : ''
    )
    await p.run(m, {
      sock,
      text: m.q,
      args: m.args,
      arg: m.arg,
      command: found.name,
      prefix: m.prefix,
      config,
      sendSmartMenu,
      sendButtons,
      sendList,
      sendInteractive,
      sendAIRich,
      aiChat,
      aiImage,
      aiTTS,
      reload: loadPlugins
    })

    /* v7.37.0: `.tobutton <fitur>` menambahkan button list sebagai BALASAN
       setelah teks asli fitur terkirim — file fiturnya tidak diubah, jadi
       aman untuk fitur bawaan maupun buatan `.>_`. */
    try {
      const ov = (m.settings?.tombolFitur || {})[found.name]
      if (ov?.tombol?.length) {
        /* title WAJIB diisi: tanpa header.title, WhatsApp sering tidak
           merender tombolnya sama sekali (pesan terlihat "kosong"). */
        await sendButtons(sock, m.jid, {
          title: `🔘 ${found.name}`,
          text: ov.judul || 'Pilih opsi di bawah',
          footer: m.settings?.footer || config.bot.footer,
          buttons: ov.tombol
        }).catch(() => {})
      }
    } catch {}
  } catch (e) {
    log.error(`command ${found.name}:`, e.message)
    await m.reply(`❌ Gagal menjalankan *${found.name}*\n\`\`\`${truncate(e?.message || String(e), 800)}\`\`\``).catch(() => {})
    await reportOwner(m, found.name, e)
  }
}

/* ------------------------------------------------------------------ */
/*  ACTION (dari tombol menu interaktif)                               */
/* ------------------------------------------------------------------ */
async function handleAction (m, id) {
  const [, type, ...rest] = id.split(':')
  const val = rest.join(':')
  const settings = m.settings

  switch (type) {
    case 'menu': {
      // format: act:menu:<target>[:<halaman>]
      const seg = val.split(':')
      const last = seg[seg.length - 1]
      const page = /^\d+$/.test(last) && seg.length > 1 ? Number(last) : 0
      const target = (seg.length > 1 && /^\d+$/.test(last) ? seg.slice(0, -1) : seg).join(':')
      if (!target || target === 'main') return await sendMainMenu(m, page)
      if (target === 'all') return await sendAllMenu(m)
      if (target === 'owner') return await sendOwnerMenu(m)
      if (target === 'ai') return await sendAIMenu(m)
      return await sendCategoryMenu(m, target, page)
    }

    case 'ai':
      if (val === 'toggle') {
        const cur = m.isGroup ? !!m.groupSet?.autoai : !!settings.autoReplyAI
        if (m.isGroup) {
          if (!m.isAdmin && !m.isOwner) return m.reply('🛡️ Khusus admin grup.')
          const g = getGroup(m.jid)
          g.autoai = !g.autoai
          const { saveDB } = await import('../lib/database.js')
          saveDB('groups')
          return m.reply(g.autoai ? '✅ Auto AI grup diaktifkan.' : '🚫 Auto AI grup dimatikan.')
        }
        const { setSetting } = await import('../lib/database.js')
        setSetting('autoReplyAI', !cur)
        return m.reply(!cur ? '✅ Auto reply AI global diaktifkan.' : '🚫 Auto reply AI global dimatikan.')
      }
      break

    case 'owner':
      return await m.sendButtons({
        title: '👤 Owner ' + config.owner.name,
        text: 'Hubungi owner bot:',
        buttons: [
          { text: '💬 Chat Owner', id: `.owner` },
          { text: '📋 Menu Utama', id: 'act:menu:main' }
        ]
      })

    case 'back':
      return await sendMainMenu(m)

    case 'ping':
      return await handleCommand({ ...m, command: 'ping', q: '', args: [] })

    default:
      // id lain -> anggap command
      if (val) {
        const nm = { ...m, text: val, isCommand: true, command: val.split(' ')[0].toLowerCase(), q: val.split(' ').slice(1).join(' '), args: val.split(' ').slice(1) }
        return await handleCommand(nm)
      }
  }
  return await sendMainMenu(m)
}

/* ------------------------------------------------------------------ */
/*  MENU                                                               */
/* ------------------------------------------------------------------ */
const ICON = {
  'Main Menu': '🏠',
  'AI Menu': '🤖',
  'Group Menu': '👥',
  'Downloader': '⬇️',
  'Internet': '🌐',
  'Tools': '🛠️',
  'Fun Menu': '🎲',
  'Maker Menu': '🎨',
  'User Menu': '👤',
  'Owner Menu': '👑',
  'Info Menu': 'ℹ️',
  'Sticker Menu': '🌟',
  'RPG Menu': '🎮',
  'Games': '🎲',
  'Islami': '🕌'
}

function catIcon (c) {
  return ICON[c] || '📦'
}

function categoryRows () {
  return [...categories().keys()].sort().map(c => ({
    title: `${catIcon(c)} ${c}`,
    description: `${categories().get(c).length} perintah`,
    id: `act:menu:${c}`
  }))
}

const PAGE_SIZE = 8 // mode button: 8 item + tombol navigasi (maks 10 tombol)

/**
 * Kirim menu ber-paginasi.
 *  - mode list  : semua item (dipecah jadi section @10 baris oleh sendSmartMenu)
 *  - mode button: 8 item per halaman + ⬅️/➡️
 * idPrefix contoh: 'act:menu:main' atau 'act:menu:RPG Menu'
 */
async function sendPagedMenu (m, { text, title, items = [], page = 0, idPrefix = 'act:menu:main', home = true }) {
  const mode = resolveMenuMode(m.isGroup)
  if (mode !== 'button') {
    return await m.sendMenu({ text, title, items })
  }
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1)
  const slice = items.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE)
  const buttons = [...slice]
  if (pages > 1) {
    if (p > 0) buttons.unshift({ title: `⬅️ Hal ${p}`, description: '', id: `${idPrefix}:${p - 1}` })
    if (p < pages - 1) buttons.push({ title: `➡️ Hal ${p + 2}/${pages}`, description: '', id: `${idPrefix}:${p + 1}` })
  }
  if (home) buttons.push({ title: '🏠 Menu Utama', description: '', id: 'act:menu:main' })
  const note = pages > 1 ? `\n\n📄 Halaman *${p + 1}/${pages}* (total ${items.length} menu)` : ''
  return await m.sendMenu({ text: text + note, title, items: buttons.slice(0, 10) })
}

export async function sendMainMenu (m, page = 0) {
  const cats = [...categories().keys()].sort()
  const total = listPlugins().length
  const text = `Halo *@${m.sender.split('@')[0]}* 👋

Selamat datang di *${config.bot.name}* — bot WhatsApp Multi Device dengan tombol interaktif, button list, dan AI Rich message.

▸ *Prefix:* \`${config.display.prefix}\`
▸ *Mode Menu:* ${resolveMenuMode(m.isGroup)}
▸ *Total Fitur:* ${total} perintah / ${cats.length} kategori
▸ *Limit:* ${m.userDB.limit}${m.isPremium ? ' (♾️ premium)' : ''}
▸ *Jam:* ${clockString()} WIB

Pilih submenu di bawah (SEMUA kategori ada di button list), atau ketik \`${config.display.prefix}allmenu\` untuk melihat seluruh fitur.`

  const items = [
    { title: '📜 Semua Menu', description: `${total} perintah dalam 1 pesan`, id: 'act:menu:all' },
    ...categoryRows()
  ]

  return await sendPagedMenu(m, {
    text,
    title: config.bot.name,
    items,
    page,
    idPrefix: 'act:menu:main',
    home: false
  })
}

export async function sendCategoryMenu (m, cat, page = 0) {
  const list = categories().get(cat)
  if (!list?.length) return m.reply(`Kategori *${cat}* tidak ditemukan.\nKetik \`${config.display.prefix}menu\``)
  const p = config.display.prefix
  const text = `*${catIcon(cat)} ${cat.toUpperCase()}* (${list.length} perintah)\n\n` + list
    .map(c => `▸ \`${p}${c.command[0]}\` — ${c.description || '-'}`)
    .join('\n')

  const items = list.map(c => ({
    title: `${p}${c.command[0]}`,
    description: c.description || '',
    id: `${p}${c.command[0]}`
  }))

  return await sendPagedMenu(m, { text, title: `${catIcon(cat)} ${cat}`, items, page, idPrefix: `act:menu:${cat}` })
}

export async function sendAllMenu (m) {
  const p = config.display.prefix
  const cats = [...categories()].sort((a, b) => b[1].length - a[1].length)
  const total = listPlugins().length

  // ringkasan dulu (1 pesan tombol), lalu rincian per kategori dikirim bertahap
  await m.sendButtons({
    title: '📜 All Menu',
    text: `*📜 ALL MENU — ${config.bot.name}*\n\nTotal *${total} perintah* dalam ${cats.length} kategori:\n\n${cats.map(([c, l]) => `${catIcon(c)} *${c}* — ${l.length} perintah`).join('\n')}\n\nRincian semua perintah dikirim di pesan berikutnya (dipecah beberapa bagian).`,
    buttons: [
      { text: '🏠 Menu Utama', id: 'act:menu:main' },
      { text: '🤖 AI Menu', id: 'act:menu:ai' },
      { text: '👑 Owner Menu', id: 'act:menu:owner' }
    ]
  }).catch(() => {})

  let blok = ''
  let bagian = 1
  const kirim = async () => {
    if (!blok.trim()) return
    await m.reply(`*📜 ALL MENU (${bagian})*\n\n${blok.trim()}`, { quoted: false }).catch(() => {})
    blok = ''
    bagian++
  }
  for (const [cat, list] of cats) {
    const isi = `${catIcon(cat)} *${cat.toUpperCase()}* (${list.length})\n` +
      list.map(c => `▸ \`${p}${c.command[0]}\`${c.description ? ' — ' + c.description : ''}`).join('\n') + '\n\n'
    if ((blok + isi).length > 3200) await kirim()
    blok += isi
  }
  await kirim()
  return undefined
}

export async function sendOwnerMenu (m) {
  const list = listPlugins().filter(p => p.category === 'Owner Menu')
  const p = config.display.prefix
  const text = `*👑 OWNER / DEVELOPER MENU*\n\n` +
    list.map(c => `▸ \`${p}${c.command[0]}\` — ${c.description || '-'}`).join('\n')
  const items = list.map(c => ({ title: `${p}${c.command[0]}`, description: c.description || '', id: `${p}${c.command[0]}` }))
  items.push({ title: '⬅️ Kembali', description: '', id: 'act:menu:main' })
  return await m.sendMenu({ text, title: 'Owner Menu', items })
}

export async function sendAIMenu (m) {
  const list = listPlugins().filter(c => c.category === 'AI Menu')
  const p = config.display.prefix
  const text = `*🤖 AI MENU*\n\n` + list.map(c => `▸ \`${p}${c.command[0]}\` — ${c.description || '-'}`).join('\n')
  const items = list.map(c => ({ title: `${p}${c.command[0]}`, description: c.description || '', id: `${p}${c.command[0]}` }))
  items.push({ title: '🔁 Toggle Auto AI', description: 'AI balas otomatis tanpa prefix', id: 'act:ai:toggle' })
  items.push({ title: '⬅️ Kembali', description: '', id: 'act:menu:main' })
  return await m.sendMenu({ text, title: 'AI Menu', items })
}

/* ------------------------------------------------------------------ */
/*  AI AUTO REPLY                                                      */
/* ------------------------------------------------------------------ */
async function aiAutoReply (m, text) {
  const key = m.isGroup ? m.jid : (m.senderKey || m.sender)
  const name = m.pushName || 'user'
  try {
    await m.typing()
    await m.react('🤖')
    const history = getMemory(key)
    const answer = await aiChat(text, history, {
      system: `${activePersona()}\n\nKonteks: kamu sedang chatting dengan ${name}${m.isGroup ? ` di grup "${m.groupName}"` : ''}. Jawab ringkas ala chat WhatsApp (maks 3 paragraf), jangan pakai markdown heading.`
    })
    pushMemory(key, 'user', text)
    pushMemory(key, 'assistant', answer)

    const clean = truncate(answer, 3500)
    if (m.settings.aiRich !== false && clean.length < 900) {
      try {
        return await m.sendAIRich({ text: clean, suggest: ['lanjutin', 'jelasin lagi', '.menu'] })
      } catch {}
    }
    return await m.reply(clean)
  } catch (e) {
    log.ai('auto reply gagal:', e.message)
    return await m.reply('🤖 AI sedang sibuk / error: `' + truncate(e.message, 200) + '`').catch(() => {})
  }
}

/* ------------------------------------------------------------------ */
/*  GUARD GRUP (antilink, antitoxic)                                   */
/* ------------------------------------------------------------------ */
const TOXIC = /(kontol|memek|anjing|bangsat|babi|tolol|ngentot)/i
const NSFW = /(bokep|porn|porno|xxx|hentai|bugil|telanjang|ngewe|col[im]an|vcs|open\s*bo)/i
async function guardGroup (m) {
  const g = m.groupSet
  if (!g) return
  /* v7.33.0 — .bungkam: hapus SEMUA pesan member yg dibungkam + hentikan proses */
  if (g.bungkam && (g.bungkam[m.sender] || (m.senderKey && g.bungkam[m.senderKey]))) {
    if (m.isBotAdmin) { try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {} }
    return true // hentikan: perintah/jawaban/AI tidak diproses
  }
  if (g.antilink && m.isBotAdmin) {
    if (/chat\.whatsapp\.com|wa\.me|https?:\/\//i.test(m.text)) {
      await m.reply(`⚠️ *Anti Link aktif*\nLink terdeteksi, pesan dihapus.`).catch(() => {})
      try {
        await sock.sendMessage(m.jid, { delete: m.key })
      } catch {}
      return
    }
  }
  /* v7.33.0 — anti tag SW: tag orang + kata "sw" → hapus + warn */
  if (g.antitagsw) {
    const adaTag = (m.mentionJid?.length || m.mentioned?.length || /@\d{6,}/.test(m.text || ''))
    if (adaTag && /\bsw\b/i.test(m.text || '')) {
      const w = tambahWarn(m.senderKey || m.sender, 'tag SW di grup')
      if (m.isBotAdmin) { try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {} }
      let teks = `📵 *TAG SW TERDETEKSI — pesan dihapus.*\n@${(m.senderKey || m.sender).split('@')[0]} kena *warn ${w.n}/${w.max}* (alasan: tag SW).`
      if (w.n >= w.max && m.isBotAdmin) {
        try { await sock.groupParticipantsUpdate(m.jid, [m.sender], 'remove'); resetWarn(m.senderKey || m.sender); teks += '\n🚫 Warn penuh — dikeluarkan dari grup.' } catch { teks += '\n(Gagal mengeluarkan.)' }
      }
      await m.reply(teks, { mentions: [m.senderKey || m.sender] }).catch(() => {})
      return true
    }
  }
  /* v7.9.0 — guard tambahan dari .groupmenu batch baru */
  try {
    const v9 = g.v9 || {}
    const now = new Date(Date.now() + 7 * 3600e3) // WIB
    const jam = now.getUTCHours()
    if (v9.jamMalam && !m.isAdmin && !m.isOwner) {
      const [a, b] = v9.jamMalam
      const kena = a < b ? (jam >= a && jam < b) : (jam >= a || jam < b)
      if (kena && m.isBotAdmin) { try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {} return }
    }
    if (v9.antisticker && m.mtype === 'stickerMessage' && !m.isAdmin && m.isBotAdmin) {
      await m.reply('🚫 *Anti Stiker aktif* — stiker dihapus.').catch(() => {})
      try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {}
      return
    }
    if (v9.antimedia && ['imageMessage', 'videoMessage'].includes(m.mtype) && !m.isAdmin && m.isBotAdmin) {
      await m.reply('🚫 *Anti Media aktif* — foto/video dihapus.').catch(() => {})
      try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {}
      return
    }
    if (Array.isArray(v9.badwords) && v9.badwords.length && !m.isAdmin && m.text) {
      const t = m.text.toLowerCase()
      const kena = v9.badwords.find(w => t.includes(w))
      if (kena) {
        v9.pelanggaran = v9.pelanggaran || {}
        v9.pelanggaran[m.sender] = (v9.pelanggaran[m.sender] || 0) + 1
        const n = v9.pelanggaran[m.sender]
        await m.reply(`⚠️ Kata terlarang *"${kena}"* terdeteksi. Peringatan ${n}/3 untuk @${m.sender.split('@')[0]}.`, { mentions: [m.sender] }).catch(() => {})
        if (m.isBotAdmin) { try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {} }
        if (n >= 3 && m.isBotAdmin && v9.badwordKick) { try { await sock.groupParticipantsUpdate(m.jid, [m.sender], 'remove'); v9.pelanggaran[m.sender] = 0 } catch {} }
        saveDB('groups')
        return
      }
    }
    if (v9.autoreply && m.text && !m.isCommand) {
      const t = m.text.toLowerCase()
      const hit = Object.entries(v9.autoreply).find(([k]) => t === k || t.includes(k))
      if (hit) await m.reply(hit[1]).catch(() => {})
    }
  } catch {}
  if (g.antitoxic && TOXIC.test(m.text)) {
    await m.reply(`🫂 Jaga kata-katanya ya @${m.sender.split('@')[0]}.`, { mentions: [m.sender] }).catch(() => {})
  }
  // filter konten dewasa: aktif selama admin grup belum mengizinkan (nsfw=false)
  if (!g.nsfw && NSFW.test(m.text || '')) {
    await m.reply(`🔞 Kata berbau pornografi terdeteksi. Pesan dihapus.\nAdmin bisa mengizinkan dengan \`${config.display.prefix}nsfwon\`.`, { mentions: [m.sender] }).catch(() => {})
    if (m.isBotAdmin) { try { await sock.sendMessage(m.jid, { delete: m.key }) } catch {} }
  }
}

/* ---------- v7.15: peta nama tampilan (PN & LID) untuk kartu welcome ---------- */
const NAMA_CACHE = new Map()
const namaDB = () => loadDB('nama', {})
export function simpanNama (jids, nama) {
  if (!nama) return
  const db = namaDB(); let ubah = false
  for (const j of [].concat(jids || [])) {
    if (!j) continue
    const k = String(j).replace(/:\d+@/, '@')
    NAMA_CACHE.set(k, nama)
    if (db[k] !== nama) { db[k] = nama; ubah = true }
  }
  if (ubah) saveDB('nama')
}
/** dipanggil dari index.js untuk contacts.update / contacts.upsert / messaging-history.set */
export function pelajariKontak (list) {
  try {
    for (const c of [].concat(list || [])) {
      const n = c?.notify || c?.name || c?.verifiedName
      if (n) simpanNama([c.id, c.lid, c.jid, c.phoneNumber].filter(Boolean), n)
    }
  } catch {}
}
function cariNama (jid, meta) {
  const cand = [jid]
  try { cand.push(...aliasesOf(jid)) } catch {}
  const parts = meta?.participants || []
  for (const c of cand) {
    const p = parts.find(x => x.id === c || x.lid === c || x.jid === c || x.phoneNumber === c)
    const n = p?.notify || p?.name || p?.verifiedName
    if (n) return n
  }
  for (const c of cand) { const n = NAMA_CACHE.get(String(c)) || namaDB()[String(c)]; if (n) return n }
  for (const c of cand) {
    try { const u = getUser(canonKey(c, cand)); if (u?.name) return u.name } catch {}
  }
  const num = String(jid).split('@')[0]
  return isLid(jid) ? '' : ('+' + num)
}
/** coba lagi mendapatkan nama: metadata segar (2x), lalu onWhatsApp untuk PN */
async function cariNamaKeras (sock, id, jid) {
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 1500 + i * 1500))
    const meta = await sock.groupMetadata(id).catch(() => null)
    const n = cariNama(jid, meta)
    if (n) return n
  }
  try {
    const pn = aliasesOf(jid).find(a => a.endsWith('@s.whatsapp.net'))
    if (pn) { const r = await sock.onWhatsApp(pn.split('@')[0]); const n = r?.[0]?.notify || r?.[0]?.name; if (n) return n }
  } catch {}
  return ''
}

/* ------------------------------------------------------------------ */
/*  EVENT GROUP (welcome / goodbye)                                    */
/* ------------------------------------------------------------------ */
/** isi placeholder {tag} {name} {group} {desc} {member} {time} {date} */
function fillTemplate (tpl, vars) {
  return String(tpl).replace(/\{(tag|name|group|desc|member|time|date)\}/gi, (_, k) => {
    const v = vars[k.toLowerCase()]
    return v === undefined || v === null ? '' : String(v)
  })
}

const DEFAULT_TPL = {
  welcome: '👋 *Selamat datang* {tag}\ndi grup *{group}* ({member} member)\n\nBetah-betah ya, jangan lupa baca deskripsi grup!',
  leave: '👋 *Selamat tinggal* {tag}\nSemoga sukses di luar sana.',
  promote: '🎉 Selamat {tag} naik jadi *Admin* grup!',
  demote: '📉 {tag} turun jabatan dari Admin.'
}

export async function groupParticipantsHandler (update) {
  try {
    /* v7.9.2: Baileys mengirim SATU objek { id, participants, action }, bukan array → normalisasi */
    const daftar = Array.isArray(update) ? update : [update]
    for (const { id, participants: rawP, action } of daftar) {
      if (!id || !rawP) continue
      const participants = rawP.map(p => (typeof p === 'string' ? p : (p?.id || p?.jid || p?.lid || ''))).filter(Boolean)
      const g = getGroup(id)
      const type = action === 'add' ? 'welcome'
        : action === 'remove' ? 'leave'
          : action === 'promote' ? 'promote'
            : action === 'demote' ? 'demote' : null
      if (!type) continue
      // toggle: welcome utk add/promote/demote, goodbye utk remove
      const enabled = type === 'leave' ? g.goodbye : g.welcome
      if (!enabled) continue

      const meta = await safeGroupMetadata(id)
      const memberCount = meta?.participants?.length || g.members || 0
      const desc = meta?.desc || ''

      for (const jid of participants) {
        const num = jid.split('@')[0]
        // nama: dari metadata grup, fallback ke nomor
        let pname = cariNama(jid, meta)
        if (!pname) pname = await cariNamaKeras(sock, id, jid)
        if (!pname) { const pn = (() => { try { return aliasesOf(jid).find(a => a.endsWith('@s.whatsapp.net')) } catch { return '' } })(); pname = pn ? '+' + pn.split('@')[0] : 'Member ' + String(num).slice(-4) }
        else simpanNama([jid], pname)
        const tagNum = (() => { try { return (aliasesOf(jid).find(a => a.endsWith('@s.whatsapp.net')) || jid).split('@')[0] } catch { return num } })()
        const vars = {
          tag: '@' + tagNum,
          name: pname,
          group: meta?.subject || '',
          desc,
          member: memberCount,
          time: clockString(),
          date: tanggalWIB()
        }

        const customTpl = (type === 'welcome' ? g.welcomeText : type === 'leave' ? g.leaveText : '')
        const tpl = customTpl || DEFAULT_TPL[type]
        const text = fillTemplate(tpl, vars)

        // ── v7.9.1: mode HTML (default) — kartu canvas interaktif ala .profile
        if ((g.welcomeMode || 'html') !== 'text') {  /* v7.9.3: 'card' lama pun dipetakan ke kartu HTML ala .profile */
          try {
            const { kartuWelcomeHtml } = await import('../lib/kartuwelcome.js')
            const { sendHtmlApp } = await import('../lib/htmlapp.js')
            const avatarUrl = await sock.profilePictureUrl(jid, 'image').catch(() => '')
            const nomorTampil = /^\d{8,15}$/.test(tagNum) && !isLid(jid) ? tagNum : (/^\d{8,15}$/.test(tagNum) && tagNum !== num ? tagNum : '')
            const html = kartuWelcomeHtml(config.bot.name, {
              jenis: type, nama: pname, nomor: nomorTampil, avatar: avatarUrl, grup: meta?.subject || '', member: memberCount,
              waktu: clockString(), tanggal: tanggalWIB(), pesan: text.replace(/[*_`~]/g, '').replace(/\s+/g, ' ').slice(0, 160)
            })
            const JUDUL = { welcome: '👋 Selamat datang', leave: '🚪 Sampai jumpa', promote: '🎉 Naik jadi admin:', demote: '📉 Turun jabatan:' }
            await sendHtmlApp(sock, id, { title: `${JUDUL[type]} ${pname}`, html })
            await sock.sendMessage(id, { text, mentions: [jid] })
            continue
          } catch (e) {
            log.warn('welcome html gagal, fallback kartu gambar:', e.message)
          }
        }

        // ── mode kartu gambar
        if ((g.welcomeMode || 'html') !== 'text') {
          try {
            const theme = (g.welcomeTheme || 'random') === 'random'
              ? randomTheme()
              : (g.welcomeTheme || 'ocean')
            const avatar = await sock.profilePictureUrl(jid, 'image').catch(() => null)
            const bg = g.welcomeBg ? await resolveImageValue(g.welcomeBg).catch(() => null) : null
            const buf = await makeCard({
              type,
              name: pname,
              group: meta?.subject || '',
              memberCount,
              subtitle: type === 'welcome' && desc ? desc.slice(0, 90) : '',
              footer: config.bot.footer,
              avatar,
              background: Buffer.isBuffer(bg) ? bg : null,
              theme
            })
            await sock.sendMessage(id, {
              image: buf,
              caption: text,
              mentions: [jid]
            })
            continue
          } catch (e) {
            log.warn('welcome card gagal, fallback teks:', e.message)
          }
        }

        // ── fallback / mode teks
        await sendButtons(sock, id, {
          text,
          footer: config.bot.footer,
          buttons: [{ text: '📋 Menu', id: `${config.display.prefix}menu` }],
          image: config.display.thumbnail
        }).catch(() => sock.sendMessage(id, { text, mentions: [jid] }).catch(() => {}))
      }
    }
  } catch (e) {
    log.warn('group update:', e.message)
  }
}

/* ------------------------------------------------------------------ */
/*  ANTI DELETE                                                        */
/* ------------------------------------------------------------------ */
export async function messageDeleteHandler (update) {
  try {
    const jid = update.remoteJid
    if (!jid || !isJidGroup(jid)) return
    const g = getGroup(jid)
    if (!g.antidelete) return
    const num = (update.participant || jid).split('@')[0]
    await sock.sendMessage(jid, {
      text: `♻️ *Anti Delete*\nPesan dari @${num} telah dihapus pada ${clockString()}.`,
      mentions: [update.participant || jid]
    })
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  UTIL                                                               */
/* ------------------------------------------------------------------ */
const metaCache = new Map()
export async function safeGroupMetadata (jid) {
  if (metaCache.has(jid) && Date.now() - metaCache.get(jid).t < 1000 * 60 * 10) return metaCache.get(jid).v
  try {
    const v = await sock.groupMetadata(jid)
    metaCache.set(jid, { v, t: Date.now() })
    return v
  } catch {
    return null
  }
}

export async function simulateTyping (jid, enable = true) {
  if (!enable) return
  try {
    await sock.sendPresenceUpdate('composing', jid)
    setTimeout(() => sock.sendPresenceUpdate('paused', jid).catch(() => {}), 4000).unref?.()
  } catch {}
}

function contextMention (m, mentions) {
  if (!mentions?.length) return { mentionedJid: [], stanzaId: m.id, participant: m.sender }
  return { mentionedJid: mentions, stanzaId: m.id, participant: m.sender }
}

async function reportOwner (m, cmd, err) {
  try {
    const text = `🐞 *ERROR REPORT*\n\nFitur: ${cmd}\nDari: ${m.sender}\nChat: ${m.jid}\nPesan: ${truncate(err?.stack || err?.message, 1200)}`
    for (const o of OWNERS.slice(0, 2)) {
      await sock.sendMessage(o, { text })
    }
  } catch {}
}

export default { messageHandler, initHandler, groupParticipantsHandler, messageDeleteHandler, sendMainMenu }
