/**
 * 🎰 KASINO RPG v7.6 — 5 game kasino dengan UANG RPG ASLI (server-side)
 * ======================================================================
 *  Sama seperti `.slot`: hasil diacak di SERVER (lib/casinorpg.js), koin RPG
 *  benar-benar dipotong & dibayarkan, hasil dikirim sebagai kartu HTML app
 *  yang memutar animasi dan berhenti persis di hasil server. Setiap
 *  pembayaran otomatis masuk papan peringkat `.lbgame` (tanpa kode setor).
 *
 *  Game & perintah:
 *    🎡 .rolet [taruhan] [pilihan]     — rolet Eropa 37 angka
 *    🎲 .dadukoin [taruhan] [pilihan]  — sic bo 3 dadu
 *    📈 .aviatorrpg [taruhan] [target] — crash, cash-out otomatis di target
 *    🎯 .keno [taruhan] [angka...]     — pilih 1–6 dari 40, diundi 10
 *    🃏 .blackjack21 [taruhan]         — lalu .hit21 / .stand21 / .double21
 *
 *  Menu & info: .kasinorpg · .kasinoinfo · .roletinfo · .daduinfo · .kenoinfo
 *
 *  Semua taruhan tersimpan per game: `.rolet hitam` (tanpa angka) memakai
 *  taruhan terakhirmu. RTP 84–96% tergantung game & progres RPG (luck/koin).
 */
import { config } from '../config.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { sendButtons } from '../lib/interactive.js'
import { saveDB, getUser } from '../lib/database.js'
import { addMoney, addExp, getRPG } from '../lib/rpg.js'
import { K, stat7, expHadiah } from '../lib/rpg7.js'
import { catatSkor } from '../lib/lbgame.js'
import {
  MIN_BET, MAX_BET, MAKS_BAYAR, UMUR_SESI, fmtKoin, parseBet, pisahTaruhan,
  parseRolet, putarRolet, hitungRolet, peluangRolet, warnaRolet, labelRolet,
  parseDadu, putarDadu, hitungDadu, peluangDadu, labelDadu,
  parseTarget, titikCrash, hitungAviator, peluangAviator, labelAviator,
  parseKeno, undiKeno, hitungKeno, peluangKeno, TABEL_KENO, labelKeno,
  mulaiBlackjack, langkahBlackjack, hitungBlackjack, mainBandar, nilaiTangan, nilaiKartu, GAME_KASINO,
  BAYAR_BLACKJACK, BAYAR_MENANG, MIN_DOUBLE, siapkanKasino, catatKasino,
  ringkasKasino, labelBlackjack
} from '../lib/casinorpg.js'
import { roletHtml, daduHtml, aviatorHtml, kenoHtml, blackjackHtml } from '../lib/casinorpgkartu.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** id papan peringkat (.lbgame) per game */
const LB_ID = { rolet: 'rolet', dadukoin: 'dadukoin', aviatorrpg: 'aviatorrpg', keno: 'keno', blackjack21: 'blackjack21' }

/** sumber koin kalau saldo kurang */
const CARA_KOIN = `\n\nCari koin: \`${P}tambang\` \`${P}tebang\` \`${P}mancing\` \`${P}berburu\` \`${P}battle\` \`${P}kerja\` \`${P}klaim\` \`${P}slot\``

/* ================================================================== */
/*  PEMBATU UMUM                                                       */
/* ================================================================== */

/**
 * Urusan uang setelah hasil diketahui: bayar, EXP, statistik, leaderboard.
 * @returns {{exp:number, saldoAkhir:number, lb:object|null, stat:object}}
 */
function selesaikan (m, jid, st, game, { bet, bayar, label }) {
  const r = st.r
  const k = siapkanKasino(r)
  if (bayar > 0) addMoney(jid, bayar)
  const exp = expHadiah(st, 4 + Math.floor(bet / 250))
  const naik = addExp(jid, exp)
  catatKasino(k[game], { label, bet, bayar })
  saveDB('users')
  const saldoAkhir = getRPG(jid).money
  /* papan peringkat: pembayaran terbesar otomatis tercatat (tanpa kode setor) */
  let lb = null
  if (bayar > bet) {
    try { lb = catatSkor(jid, m.pushName || r.name || 'Kamu', LB_ID[game] || game, bayar, { src: 'auto' }) } catch {}
  }
  return { exp, saldoAkhir, lb, stat: k[game], naik }
}

/** kirim kartu HTML + ringkasan teks (kartu gagal = hasil tetap sah) */
async function kirimHasil (m, { title, html, ringkas, tombol }) {
  let kartuGagal = false
  try {
    await sendHtmlApp(m.sock, m.jid, { title, html })
  } catch (e) {
    kartuGagal = true
    console.error('[kasino-rpg] kartu HTML gagal dikirim:', e?.message || e)
  }
  const tambahan = kartuGagal
    ? '\n\n⚠️ _Kartu HTML gagal dimuat di client kamu — hasil tetap sah & uang sudah diproses._'
    : ''
  await m.reply(ringkas + tambahan)
  if (!kartuGagal && tombol?.length) {
    try { await sendButtons(m.sock, m.jid, { text: '⚡ Aksi cepat:', buttons: tombol }) } catch {}
  }
  return { handled: true }
}

/** potongan teks leaderboard untuk ditempel di ringkasan */
const teksLb = lb => (lb && lb.terbaikBaru
  ? `\n🏆 *Rekor pembayaran baru!* Peringkat *#${lb.rank}* dari ${lb.total} → \`${P}lbgame\``
  : (lb ? `\n🏆 Papan peringkat: #${lb.rank}/${lb.total} (rekor ${fmtKoin(lb.skor)})` : ''))

/** taruhan dari teks + statistik game (pakai taruhan terakhir kalau kosong) */
function taruhanDari (teks, saldo, statGame) {
  const pisah = pisahTaruhan(teks)
  const parsed = parseBet(pisah.teksBet, saldo, statGame?.bet)
  return { parsed, pilihan: pisah.teksSisa }
}

const statRingkas = s =>
  `📊 Ronde *${s.main || 0}* · menang *${s.menang || 0}* · bayar terbaik *${fmtKoin(s.terbaik || 0)}*\n` +
  `💸 Total taruhan ${fmtKoin(s.taruhan || 0)} → hasil ${fmtKoin(s.hasil || 0)} (${(s.hasil || 0) - (s.taruhan || 0) >= 0 ? '+' : '−'}${fmtKoin(Math.abs((s.hasil || 0) - (s.taruhan || 0)))})`

/* ================================================================== */
/*  🎡 .rolet                                                          */
/* ================================================================== */
const BANTUAN_ROLET =
  `🎡 *ROLET RPG* — uang asli, hasil diacak di server\n\n` +
  `Sintaks: \`${P}rolet [taruhan] [pilihan]\`\n` +
  `▸ \`${P}rolet 500 merah\` · \`${P}rolet 2.5k hitam\` · \`${P}rolet all genap\`\n` +
  `▸ Angka langsung: \`${P}rolet 1k angka 17\` atau \`${P}rolet 500 17\`\n` +
  `▸ Tanpa taruhan (pakai taruhan terakhirmu): \`${P}rolet kolom2\`\n\n` +
  `Pilihan & pengali:\n` +
  `▸ merah / hitam / genap / ganjil — ×1.9\n` +
  `▸ kecil (1–18) / besar (19–36) — ×1.9\n` +
  `▸ lusin1..3 (1–12/13–24/25–36) — ×2.7\n` +
  `▸ kolom1..3 — ×2.7\n` +
  `▸ angka 0–36 — ×33\n\n` +
  `0 hijau membuat semua taruhan luar kalah. Taruhan terakhir tersimpan otomatis.\n` +
  `Tabel peluang: \`${P}roletinfo\` · Menu kasino: \`${P}kasinorpg\``

export const roletRpg = {
  command: ['rolet', 'roulette', 'rouletterpg', 'roletkoin', 'rodarulet', 'roletuang', 'spinrolet', 'roleteropa'],
  category: 'Games',
  description: '🎡 Rolet RPG — roda Eropa 37 angka, taruhan uang RPG asli: merah/hitam, genap/ganjil, kecil/besar, lusin, kolom, atau angka langsung (×33)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const teks = (m.args || []).join(' ')
    if (/^(info|bantuan|help|cara|\?)$/i.test(teks.trim())) return m.reply(BANTUAN_ROLET)

    const { parsed, pilihan } = taruhanDari(teks, r.money, k.rolet)
    if (parsed.error) return m.reply(parsed.error + CARA_KOIN + `\n\n${BANTUAN_ROLET}`)
    const bet = parsed.bet

    const tar = parseRolet(pilihan)
    if (tar.error) return m.reply(`⚠️ ${tar.error}\n\n${BANTUAN_ROLET}`)
    if (bet > r.money) return m.reply(`⚠️ Uangmu kurang 💰 — taruhan *${fmtKoin(bet)}*, saldo *${fmtKoin(r.money)}*.${CARA_KOIN}`)

    /* 1. potong uang dulu (otoritatif di server) */
    const saldoAwal = r.money
    addMoney(jid, -bet)

    /* 2. putar roda di server */
    const hasilAngka = putarRolet(st.luck, tar)
    const hit = hitungRolet(hasilAngka, tar, bet, { koin: st.koin })
    const { exp, saldoAkhir, lb, stat } = selesaikan(m, jid, st, 'rolet', { bet, bayar: hit.bayar, label: labelRolet(hasilAngka, tar) })

    const data = {
      bet, angka: hasilAngka, warna: hit.warna, pilihanLabel: tar.label,
      bayar: hit.bayar, kali: hit.kali, untung: hit.untung, bonusKoin: hit.bonusKoin,
      saldoAwal, saldoAkhir, exp, luck: Number(st.luck.toFixed(2)), maksBayar: MAKS_BAYAR,
      tabel: peluangRolet(st.luck, st.koin),
      riwayat: stat.riwayat, stat
    }
    const ringkas =
      `${hit.menang ? '✨' : '💨'} 🎡 *${hasilAngka} ${hit.warna.toUpperCase()}* · ${tar.label} ×${hit.kali || 0}\n` +
      `▸ Taruhan ${fmtKoin(bet)} → bayar *${fmtKoin(hit.bayar)}* (${hit.untung >= 0 ? '+' : '−'}${fmtKoin(Math.abs(hit.untung))})\n` +
      `▸ Saldo ${fmtKoin(saldoAwal)} → *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP\n` +
      `▸ Main lagi: \`${P}rolet ${fmtKoin(bet)} ${tar.jenis === 'angka' ? 'angka ' + hasilAngka : tar.jenis}\` · Ganti: \`${P}rolet ${fmtKoin(bet)} hitam\`` +
      teksLb(lb)
    return kirimHasil(m, { title: 'Rolet RPG', html: roletHtml(brand(), data), ringkas })
  }
}

export const roletInfo = {
  command: ['roletinfo', 'roletinfoo', 'inforolet', 'roletodds', 'roletstatistik', 'roletstat'],
  category: 'Games',
  description: '🎡 Peluang, pengali & RTP tiap taruhan rolet RPG + statistik pribadi',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const k = siapkanKasino(st.r)
    const tb = peluangRolet(st.luck, st.koin)
    const baris = tb.map(t => `▸ ${t.label.padEnd(16, ' ')} ×${String(t.kali).padEnd(6, ' ')} ${String(t.peluang).padStart(5, ' ')}% · RTP ${t.rtp}%`).join('\n')
    const teks =
      `🎡 *TABEL ROLET RPG* (luck ×${st.luck.toFixed(2)} · bonus koin ×${Math.max(1, Math.min(1.05, st.koin)).toFixed(2)})\n\n` +
      `${baris}\n\n` +
      `ℹ️ Angka 0 (hijau) membuat semua taruhan luar kalah → keunggulan rumah.\n` +
      `🔒 Batas pembayaran satu ronde: ${fmtKoin(MAKS_BAYAR)} koin (anti inflasi).\n` +
      `💡 Bonus koin hanya untuk lusin/kolom/angka langsung.\n\n` +
      `${statRingkas(k.rolet)}\n\n` +
      `Main: \`${P}rolet 500 merah\` · Riwayat: \`${P}kasinoinfo\``
    return m.reply(teks)
  }
}

/* ================================================================== */
/*  🎲 .dadukoin (sic bo)                                              */
/* ================================================================== */
const BANTUAN_DADU =
  `🎲 *DADU RPG (SIC BO)* — 3 dadu, uang asli\n\n` +
  `Sintaks: \`${P}dadukoin [taruhan] [pilihan]\`\n` +
  `▸ \`${P}dadukoin 500 besar\` · \`${P}dadukoin 2.5k kecil\` · \`${P}dadukoin all genap\`\n` +
  `▸ Jumlah tepat: \`${P}dadukoin 1k jumlah 9\` (atau \`${P}dadukoin 9\`)\n` +
  `▸ Pair (minimal 2 dadu sama): \`${P}dadukoin 500 pair 6\`\n` +
  `▸ Triple (3 dadu sama): \`${P}dadukoin 500 triple\`\n\n` +
  `Pengali: besar/kecil/genap/ganjil ×1.9 · triple ×32 · pair ×12 · jumlah 3–18 ×7 sampai ×190\n` +
  `⚠️ Triple membatalkan besar/kecil/genap/ganjil.\n\n` +
  `Tabel peluang: \`${P}daduinfo\` · Menu: \`${P}kasinorpg\``

export const daduRpg = {
  command: ['dadukoin', 'dadurpg', 'sicbo', 'sicborpg', 'tigadadu', 'daduuang', 'lempardadu', 'dadubesar'],
  category: 'Games',
  description: '🎲 Dadu RPG (sic bo) — 3 dadu diacak server, taruhan uang RPG: besar/kecil, genap/ganjil, jumlah 3–18, pair, triple',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const teks = (m.args || []).join(' ')
    if (/^(info|bantuan|help|cara|\?)$/i.test(teks.trim())) return m.reply(BANTUAN_DADU)

    const { parsed, pilihan } = taruhanDari(teks, r.money, k.dadukoin)
    if (parsed.error) return m.reply(parsed.error + CARA_KOIN + `\n\n${BANTUAN_DADU}`)
    const bet = parsed.bet
    const tar = parseDadu(pilihan)
    if (tar.error) return m.reply(`⚠️ ${tar.error}\n\n${BANTUAN_DADU}`)
    if (bet > r.money) return m.reply(`⚠️ Uangmu kurang 💰 — taruhan *${fmtKoin(bet)}*, saldo *${fmtKoin(r.money)}*.${CARA_KOIN}`)

    const saldoAwal = r.money
    addMoney(jid, -bet)

    const dadu = putarDadu(st.luck, tar)
    const hit = hitungDadu(dadu, tar, bet, { koin: st.koin })
    const { exp, saldoAkhir, lb, stat } = selesaikan(m, jid, st, 'dadukoin', { bet, bayar: hit.bayar, label: labelDadu(dadu, tar) })

    const data = {
      bet, dadu, total: hit.total, triple: hit.triple, pilihanLabel: tar.label, ket: hit.ket,
      bayar: hit.bayar, kali: hit.kali, untung: hit.untung, bonusKoin: hit.bonusKoin,
      saldoAwal, saldoAkhir, exp, luck: Number(st.luck.toFixed(2)), maksBayar: MAKS_BAYAR,
      tabel: peluangDadu(st.luck, st.koin).slice(0, 22),
      riwayat: stat.riwayat, stat
    }
    const ringkas =
      `${hit.menang ? '✨' : '💨'} 🎲 *${dadu.join(' ')}* = ${hit.total}${hit.triple ? ' (TRIPLE!)' : ''} · ${tar.label}\n` +
      `▸ Taruhan ${fmtKoin(bet)} → bayar *${fmtKoin(hit.bayar)}* (×${hit.kali || 0})\n` +
      `▸ Saldo ${fmtKoin(saldoAwal)} → *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP\n` +
      `▸ Lagi: \`${P}dadukoin ${fmtKoin(bet)} ${tar.jenis === 'jumlah' ? 'jumlah ' + tar.nilai : tar.jenis === 'pair' ? 'pair ' + tar.nilai : tar.jenis}\`` +
      teksLb(lb)
    return kirimHasil(m, { title: 'Dadu RPG', html: daduHtml(brand(), data), ringkas })
  }
}

export const daduInfo = {
  command: ['daduinfo', 'infodadu', 'sicboinfo', 'daduodds', 'dadustatistik'],
  category: 'Games',
  description: '🎲 Peluang, pengali & RTP tiap taruhan dadu RPG + statistik pribadi',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const k = siapkanKasino(st.r)
    const tb = peluangDadu(st.luck, st.koin)
    const utama = tb.filter(t => ['besar', 'kecil', 'genap', 'ganjil', 'triple'].includes(t.id))
    const jumlah = tb.filter(t => /^jumlah/.test(t.id))
    const pair = tb.filter(t => /^pair/.test(t.id))
    const bar = a => a.map(t => `▸ ${t.label.padEnd(18, ' ')} ×${String(t.kali).padEnd(6, ' ')} ${String(t.peluang).padStart(6, ' ')}% · RTP ${t.rtp}%`).join('\n')
    const teks =
      `🎲 *TABEL DADU RPG* (luck ×${st.luck.toFixed(2)})\n\n` +
      `${bar(utama)}\n\n` +
      `*JUMLAH TEPAT*\n${bar(jumlah.slice(0, 8))}\n${bar(jumlah.slice(8))}\n\n` +
      `*PAIR (≥2 dadu sama)*\n${bar(pair.slice(0, 3))}\n\n` +
      `⚠️ Triple membatalkan besar/kecil/genap/ganjil.\n` +
      `🔒 Batas bayar satu ronde: ${fmtKoin(MAKS_BAYAR)} koin.\n\n` +
      `${statRingkas(k.dadukoin)}\n\nMain: \`${P}dadukoin 500 besar\``
    return m.reply(teks)
  }
}

/* ================================================================== */
/*  📈 .aviatorrpg (crash)                                             */
/* ================================================================== */
const BANTUAN_AVIATOR =
  `📈 *AVIATOR RPG* — kurva naik lalu jebol, uang asli\n\n` +
  `Sintaks: \`${P}aviatorrpg [taruhan] [target]\`\n` +
  `▸ \`${P}aviatorrpg 500 2\` → cash-out otomatis di ×2\n` +
  `▸ \`${P}aviatorrpg 2.5k 1.5\` · \`${P}aviatorrpg all 10\`\n` +
  `▸ Tanpa target: pakai target terakhirmu (bawaan ×2)\n\n` +
  `Target ${1.1}–${50}. Kurva jebol di titik acak server; kalau jebol sebelum targetmu → taruhan hangus.\n` +
  `Peluang ≈ 94%/target, jadi makin tinggi target makin kecil peluangnya (RTP sama).\n\n` +
  `Contoh peluang: ×1.5 → 62.7% · ×2 → 47% · ×5 → 18.8% · ×10 → 9.4%\n` +
  `Menu: \`${P}kasinorpg\``

export const aviatorRpg = {
  command: ['aviatorrpg', 'crashrpg', 'aviatorkoin', 'roketuang', 'aviatorjudi', 'crashkoin', 'kurvanaik'],
  category: 'Games',
  description: '📈 Aviator RPG — kurva multiplier naik lalu jebol; tentukan target cash-out, taruhan pakai uang RPG asli (RTP ≈94%)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const teks = (m.args || []).join(' ')
    if (/^(info|bantuan|help|cara|\?)$/i.test(teks.trim())) return m.reply(BANTUAN_AVIATOR)

    const { parsed, pilihan } = taruhanDari(teks, r.money, k.aviatorrpg)
    if (parsed.error) return m.reply(parsed.error + CARA_KOIN + `\n\n${BANTUAN_AVIATOR}`)
    const bet = parsed.bet
    const tg = parseTarget(pilihan)
    if (tg.error) return m.reply(`⚠️ ${tg.error}\n\n${BANTUAN_AVIATOR}`)
    const target = tg.target || k.aviatorrpg.target || 2
    if (bet > r.money) return m.reply(`⚠️ Uangmu kurang 💰 — taruhan *${fmtKoin(bet)}*, saldo *${fmtKoin(r.money)}*.${CARA_KOIN}`)

    const saldoAwal = r.money
    addMoney(jid, -bet)

    const crash = titikCrash(st.luck)
    const hit = hitungAviator(crash, target, bet, { koin: st.koin })
    k.aviatorrpg.target = target
    const { exp, saldoAkhir, lb, stat } = selesaikan(m, jid, st, 'aviatorrpg', { bet, bayar: hit.bayar, label: labelAviator(hit) })

    const data = {
      bet, crash: hit.crash, target: hit.target, menang: hit.menang,
      bayar: hit.bayar, kali: hit.kali, untung: hit.untung, bonusKoin: hit.bonusKoin,
      saldoAwal, saldoAkhir, exp, luck: Number(st.luck.toFixed(2)), maksBayar: MAKS_BAYAR,
      tabel: [1.2, 1.5, 2, 3, 5, 10, 20, 50].map(t => peluangAviator(t, st.luck, st.koin)),
      riwayat: stat.riwayat, stat
    }
    const ringkas =
      `${hit.menang ? '✨' : '💥'} 📈 Jebol di *×${hit.crash}* · targetmu ×${hit.target}\n` +
      `▸ ${hit.menang ? `Cash-out ×${hit.target} → bayar *${fmtKoin(hit.bayar)}*` : `Terlambat → hangus *${fmtKoin(bet)}*`}\n` +
      `▸ Saldo ${fmtKoin(saldoAwal)} → *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP\n` +
      `▸ Lagi: \`${P}aviatorrpg ${fmtKoin(bet)} ${hit.target}\` · Aman: \`${P}aviatorrpg ${fmtKoin(bet)} 1.3\`` +
      teksLb(lb)
    return kirimHasil(m, { title: 'Aviator RPG', html: aviatorHtml(brand(), data), ringkas })
  }
}

/* ================================================================== */
/*  🎯 .keno                                                           */
/* ================================================================== */
const BANTUAN_KENO =
  `🎯 *KENO RPG* — pilih 1–6 angka dari 40, server mengundi 10\n\n` +
  `Sintaks: \`${P}keno [taruhan] [angka...]\`\n` +
  `▸ \`${P}keno 500 3 11 27\` · \`${P}keno 2.5k 1 5 12 20 33\`\n` +
  `▸ Acak: \`${P}keno 500 acak\` · Tanpa taruhan: \`${P}keno 7 19 30\`\n\n` +
  `Pengali (total pengembalian):\n` +
  `▸ 1 angka: kena ×3.65\n` +
  `▸ 2 angka: 2 kena ×15.5\n` +
  `▸ 3 angka: 2 kena ×2.2 · 3 kena ×48\n` +
  `▸ 4 angka: 2 ×1.6 · 3 ×7 · 4 ×120\n` +
  `▸ 5 angka: 2 ×0.9 · 3 ×3.2 · 4 ×26 · 5 ×320\n` +
  `▸ 6 angka: 2 ×0.6 · 3 ×2 · 4 ×10 · 5 ×60 · 6 ×700\n\n` +
  `RTP 84–91% · batas bayar ${fmtKoin(MAKS_BAYAR)} · detail: \`${P}kenoinfo\``

export const kenoRpg = {
  command: ['keno', 'kenorpg', 'kenokoin', 'lotre40', 'kenolotre', 'undiangka', 'kenoangka'],
  category: 'Games',
  description: '🎯 Keno RPG — pilih 1–6 angka dari 40, 10 angka diundi server, taruhan uang RPG asli (RTP 84–91%)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const teks = (m.args || []).join(' ')
    if (/^(info|bantuan|help|cara|\?)$/i.test(teks.trim())) return m.reply(BANTUAN_KENO)

    const { parsed, pilihan } = taruhanDari(teks, r.money, k.keno)
    if (parsed.error) return m.reply(parsed.error + CARA_KOIN + `\n\n${BANTUAN_KENO}`)
    const bet = parsed.bet
    const pk = parseKeno(pilihan)
    if (pk.error) return m.reply(`⚠️ ${pk.error}\n\n${BANTUAN_KENO}`)
    let pilih = pk.pilih
    if (pk.acak || !pilih.length) {
      const banyak = Math.min(6, Math.max(1, k.keno.pilihJumlah || 3))
      const pool = Array.from({ length: 40 }, (_, i) => i + 1)
      pilih = []
      while (pilih.length < banyak) pilih.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
      pilih.sort((a, b) => a - b)
    }
    if (bet > r.money) return m.reply(`⚠️ Uangmu kurang 💰 — taruhan *${fmtKoin(bet)}*, saldo *${fmtKoin(r.money)}*.${CARA_KOIN}`)

    const saldoAwal = r.money
    addMoney(jid, -bet)

    const undian = undiKeno(st.luck, pilih)
    const hit = hitungKeno(pilih, undian, bet, { koin: st.koin })
    k.keno.pilihJumlah = pilih.length
    const { exp, saldoAkhir, lb, stat } = selesaikan(m, jid, st, 'keno', { bet, bayar: hit.bayar, label: labelKeno(hit) })

    const tabelTeks = []
    for (const baris of peluangKeno(st.luck, st.koin)) {
      tabelTeks.push({ kiri: `Pilih ${baris.pilih} angka (RTP ${baris.rtp}%)`, kanan: baris.rincian.map(x => `${x.kena}→×${x.kali}`).join(' '), rtp: baris.rtp })
    }
    const data = {
      bet, pilih, undian, kena: hit.kena, ket: hit.ket,
      bayar: hit.bayar, kali: hit.kali, untung: hit.untung, bonusKoin: hit.bonusKoin,
      saldoAwal, saldoAkhir, exp, luck: Number(st.luck.toFixed(2)), maksBayar: MAKS_BAYAR,
      tabel: tabelTeks, riwayat: stat.riwayat, stat
    }
    const ringkas =
      `${hit.menang ? '✨' : '💨'} 🎯 Keno ${hit.jumlahKena}/${hit.jumlahPilih} kena\n` +
      `▸ Pilihanmu: *${pilih.join(' · ')}*\n` +
      `▸ Undian: ${undian.join(' ')}\n` +
      `▸ Kena: ${hit.kena.length ? `*${hit.kena.join(' · ')}*` : '—'} → ×${hit.kali || 0} = *${fmtKoin(hit.bayar)}*\n` +
      `▸ Saldo ${fmtKoin(saldoAwal)} → *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP\n` +
      `▸ Lagi: \`${P}keno ${fmtKoin(bet)} ${pilih.join(' ')}\` · Acak: \`${P}keno ${fmtKoin(bet)} acak\`` +
      teksLb(lb)
    return kirimHasil(m, {
      title: 'Keno RPG',
      html: kenoHtml(brand(), data),
      ringkas
    })
  }
}

export const kenoInfo = {
  command: ['kenoinfo', 'infoKeno', 'kenotabel', 'kenoodds', 'kenostatistik'],
  category: 'Games',
  description: '🎯 Tabel pembayaran, peluang & RTP keno RPG + statistik pribadi',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const k = siapkanKasino(st.r)
    const tb = peluangKeno(st.luck, st.koin)
    const baris = tb.map(b =>
      `*Pilih ${b.pilih} angka* — RTP ${b.rtp}%\n` +
      b.rincian.map(x => `   ${x.kena} kena: ×${x.kali}  (${x.peluang}%)`).join('\n')
    ).join('\n\n')
    const teks =
      `🎯 *TABEL KENO RPG* (40 angka, diundi 10)\n\n${baris}\n\n` +
      `🔒 Batas bayar satu ronde: ${fmtKoin(MAKS_BAYAR)} koin.\n` +
      `💡 Bonus koin hanya untuk pengali ≥ ×50.\n\n` +
      `${statRingkas(k.keno)}\n\nMain: \`${P}keno 500 3 11 27\` · Acak: \`${P}keno 500 acak\``
    return m.reply(teks)
  }
}

/* ================================================================== */
/*  🃏 .blackjack21 + .hit21 / .stand21 / .double21                    */
/* ================================================================== */
const BANTUAN_BJ =
  `🃏 *BLACKJACK RPG* — uang asli, multi-giliran\n\n` +
  `Mulai: \`${P}blackjack21 500\`\n` +
  `Lalu balas: \`${P}hit21\` (tambah kartu) · \`${P}stand21\` (berhenti) · \`${P}double21\` (gandakan, hanya 2 kartu awal)\n` +
  `Batalkan: \`${P}batal21\` (taruhan hangus)\n\n` +
  `Aturan:\n` +
  `▸ Blackjack (21 dengan 2 kartu) bayar ×${BAYAR_BLACKJACK}\n` +
  `▸ Menang biasa ×${BAYAR_MENANG} · seri (push) taruhan kembali\n` +
  `▸ Bandar berhenti di total ≥ 17 (termasuk soft 17)\n` +
  `▸ DOUBLE hanya dengan 2 kartu awal & total ≥ ${MIN_DOUBLE}\n` +
  `▸ Sesi hangus setelah ${Math.round(UMUR_SESI / 60000)} menit\n\n` +
  `Sepatu 4 deck (208 kartu), dikocok ulang otomatis saat sisa < 60.\n` +
  `Statistik: \`${P}kasinoinfo\``

/** data kartu untuk HTML */
function dataBj (sesi, tambahan = {}) {
  const p = nilaiTangan(sesi.pemain)
  const b = nilaiTangan(sesi.bandar)
  return Object.assign({
    bet: sesi.bet, pemain: sesi.pemain, bandar: sesi.bandar,
    pemainTotal: p.total, bandarTotal: b.total, soft: p.soft, bust: p.bust,
    bandarTerlihat: sesi.bandar.length ? nilaiKartu(sesi.bandar[0]) : 0,
    fase: sesi.fase, umurSesi: UMUR_SESI,
    bayarBlackjack: BAYAR_BLACKJACK, bayarMenang: BAYAR_MENANG, minDouble: MIN_DOUBLE,
    maksBayar: MAKS_BAYAR
  }, tambahan)
}

const tombolBj = () => [
  { text: '🃏 HIT (tambah kartu)', id: `${P}hit21` },
  { text: '✋ STAND (berhenti)', id: `${P}stand21` },
  { text: '💰 DOUBLE (gandakan)', id: `${P}double21` },
  { text: '🚫 Batalkan ronde', id: `${P}batal21` }
]

/**
 * Simpan/ambil sesi blackjack (disimpan penuh termasuk sepatu 208 kartu supaya
 * kartu benar-benar berurutan antar ronde). Sesi kedaluwarsa → diselesaikan
 * otomatis sebagai STAND (bandar tetap main) supaya uang tidak menggantung.
 */
function simpanSesi (k, sesi) {
  k.sesi = {
    bet: sesi.bet, pemain: sesi.pemain.slice(), bandar: sesi.bandar.slice(),
    sepatu: sesi.sepatu.slice(), idx: sesi.idx, mulai: sesi.mulai, fase: sesi.fase,
    ganda: !!sesi.ganda, saldoAwal: sesi.saldoAwal
  }
  saveDB('users')
  return k.sesi
}

function hapusSesi (k, sesi) {
  /* sepatu diteruskan ke ronde berikutnya */
  k.sepatu = { sepatu: sesi.sepatu.slice(), idx: sesi.idx }
  k.sesi = null
  saveDB('users')
}

function sesiAktif (k) {
  const s = k.sesi
  if (!s || !Array.isArray(s.pemain) || !s.pemain.length) return null
  if (Date.now() - (s.mulai || 0) > UMUR_SESI) return { kedaluwarsa: true, sesi: s }
  return { sesi: s }
}

/** selesaikan ronde (stand / bust / blackjack) → bayar + kartu hasil */
async function selesaikanBj (m, jid, st, k, sesi, { saldoAwal, aksi = 'stand' } = {}) {
  const r = st.r
  if (sesi.fase === 'main') {
    const res = langkahBlackjack(sesi, 'stand', { saldo: r.money })
    if (res.error) mainBandar(sesi, () => { if (sesi.idx >= sesi.sepatu.length - 10) { sesi.sepatu = mulaiBlackjack(0).sepatu; sesi.idx = 0 } return sesi.sepatu[sesi.idx++] })
  } else if (sesi.fase === 'hangus') {
    sesi.fase = 'buka'
    mainBandar(sesi, () => { if (sesi.idx >= sesi.sepatu.length - 10) { sesi.sepatu = mulaiBlackjack(0).sepatu; sesi.idx = 0 } return sesi.sepatu[sesi.idx++] })
  }
  const hit = hitungBlackjack(sesi, { koin: st.koin })
  const { exp, saldoAkhir, lb, stat } = selesaikan(m, jid, st, 'blackjack21', { bet: sesi.bet, bayar: hit.bayar, label: labelBlackjack(hit) })
  hapusSesi(k, sesi)
  const hasilLabel = {
    blackjack: '🎉 BLACKJACK!', menang: '✨ KAMU MENANG', seri: '➖ SERI (PUSH)',
    bust: '💥 BUST', kalah: '💨 BANDAR MENANG'
  }[hit.hasil] || hit.hasil.toUpperCase()
  const data = dataBj(sesi, {
    hasil: hit.hasil, hasilLabel: hasilLabel.replace(/^[^\s]+\s/, ''), ket: hit.ket,
    bayar: hit.bayar, kali: hit.kali, untung: hit.untung, bonusKoin: hit.bonusKoin,
    saldoAwal: saldoAwal ?? r.money, saldoAkhir, exp, luck: Number(st.luck.toFixed(2)),
    riwayat: stat.riwayat, stat
  })
  const ringkas =
    `${hasilLabel} — ${hit.ket}\n` +
    `▸ Kamu: ${sesi.pemain.join(' ')} = *${hit.pemainTotal}*${hit.soft ? ' (soft)' : ''}\n` +
    `▸ Bandar: ${sesi.bandar.join(' ')} = *${hit.bandarTotal}*\n` +
    `▸ Taruhan ${fmtKoin(sesi.bet)} → bayar *${fmtKoin(hit.bayar)}* (${hit.untung >= 0 ? '+' : '−'}${fmtKoin(Math.abs(hit.untung))})\n` +
    `▸ Saldo → *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP\n` +
    `▸ Main lagi: \`${P}blackjack21 ${fmtKoin(sesi.bet)}\`` +
    teksLb(lb)
  return kirimHasil(m, { title: 'Blackjack RPG', html: blackjackHtml(brand(), data), ringkas, aksi })
}

export const blackjackRpg = {
  command: ['blackjack21', 'bjrpg', 'blackjackrpg', 'kartu21', 'twentyonerpg', 'duapuluhsaturpg', 'mainblackjack'],
  category: 'Games',
  description: '🃏 Blackjack RPG — mulai ronde dengan uang RPG asli, lalu .hit21 / .stand21 / .double21 (bandar stand di 17)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const teks = (m.args || []).join(' ')
    if (/^(info|bantuan|help|cara|\?)$/i.test(teks.trim())) return m.reply(BANTUAN_BJ)

    /* sesi lama masih jalan? */
    const cek = sesiAktif(k)
    if (cek?.kedaluwarsa) {
      await m.reply(`⌛ Sesi blackjack-mu kedaluwarsa (> ${Math.round(UMUR_SESI / 60000)} menit) — diselesaikan otomatis sebagai STAND.`)
      return selesaikanBj(m, jid, st, k, cek.sesi, { saldoAwal: cek.sesi.saldoAwal ?? r.money })
    }
    if (cek?.sesi) {
      return m.reply(
        `⚠️ Kamu masih punya ronde blackjack berjalan (taruhan ${fmtKoin(cek.sesi.bet)}).\n\n` +
        `Kartu kamu: ${cek.sesi.pemain.join(' ')} = *${nilaiTangan(cek.sesi.pemain).total}*\n` +
        `Bandar terlihat: ${cek.sesi.bandar[0]} = ${nilaiKartu(cek.sesi.bandar[0])}\n\n` +
        `Lanjutkan: \`${P}hit21\` · \`${P}stand21\` · \`${P}double21\` · batalkan: \`${P}batal21\``
      )
    }

    const parsed = parseBet(teks, r.money, k.blackjack21.bet)
    if (parsed.error) return m.reply(parsed.error + CARA_KOIN + `\n\n${BANTUAN_BJ}`)
    const bet = parsed.bet
    if (bet > r.money) return m.reply(`⚠️ Uangmu kurang 💰 — taruhan *${fmtKoin(bet)}*, saldo *${fmtKoin(r.money)}*.${CARA_KOIN}`)

    const saldoAwal = r.money
    addMoney(jid, -bet)
    saveDB('users')

    const sepatuLama = k.sepatu && Array.isArray(k.sepatu.sepatu) ? k.sepatu : null
    const sesi = mulaiBlackjack(bet, Math.random, sepatuLama)
    sesi.saldoAwal = getRPG(jid).money
    simpanSesi(k, sesi)

    const p = nilaiTangan(sesi.pemain)
    /* blackjack alami / bandar blackjack → langsung dibuka */
    if (sesi.fase === 'buka') return selesaikanBj(m, jid, st, k, sesi, { saldoAwal: sesi.saldoAwal })

    const data = dataBj(sesi, {
      saldoAwal: sesi.saldoAwal, saldoAkhir: sesi.saldoAwal, exp: 0,
      luck: Number(st.luck.toFixed(2)), aksiTeks: `${P}hit21 · ${P}stand21 · ${P}double21 · ${P}batal21`,
      riwayat: k.blackjack21.riwayat, stat: k.blackjack21
    })
    const ringkas =
      `🃏 *BLACKJACK RPG* — taruhan ${fmtKoin(bet)}\n\n` +
      `▸ Kamu: ${sesi.pemain.join(' ')} = *${p.total}*${p.soft ? ' (soft)' : ''}\n` +
      `▸ Bandar: ${sesi.bandar[0]} + 🂠 (? terlihat ${nilaiKartu(sesi.bandar[0])})\n` +
      `▸ Saldo: ${fmtKoin(saldoAwal)} → *${fmtKoin(sesi.saldoAwal)}* 💰\n\n` +
      `Giliranmu — balas:\n\`${P}hit21\` tambah kartu · \`${P}stand21\` berhenti · \`${P}double21\` gandakan (total ≥ ${MIN_DOUBLE})\n` +
      `\`${P}batal21\` batalkan (taruhan hangus) · sesi berlaku ${Math.round(UMUR_SESI / 60000)} menit`
    return kirimHasil(m, {
      title: 'Blackjack RPG',
      html: blackjackHtml(brand(), data),
      ringkas,
      tombol: tombolBj()
    })
  }
}

/** .hit21 — tambah kartu */
export const bjHit = {
  command: ['hit21', 'hitblackjack', 'tambahkartu21', 'tarik21', 'hitbj'],
  category: 'Games',
  description: '🃏 HIT — tambah satu kartu di ronde blackjack RPG yang sedang berjalan',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const cek = sesiAktif(k)
    if (cek?.kedaluwarsa) return selesaikanBj(m, jid, st, k, cek.sesi, { saldoAwal: cek.sesi.saldoAwal ?? r.money })
    if (!cek?.sesi) return m.reply(`⚠️ Tidak ada ronde blackjack aktif.\n\nMulai: \`${P}blackjack21 500\`\n${BANTUAN_BJ}`)
    const sesi = cek.sesi
    const hasil = langkahBlackjack(sesi, 'hit', { saldo: r.money })
    if (hasil.error) return m.reply(`⚠️ ${hasil.error}`)
    simpanSesi(k, sesi)
    if (sesi.fase === 'buka') return selesaikanBj(m, jid, st, k, sesi, { saldoAwal: sesi.saldoAwal })
    const p = nilaiTangan(sesi.pemain)
    const data = dataBj(sesi, {
      saldoAwal: sesi.saldoAwal, saldoAkhir: getRPG(jid).money, exp: 0, luck: Number(st.luck.toFixed(2)),
      aksiTeks: `${P}hit21 · ${P}stand21${sesi.pemain.length === 2 && p.total >= MIN_DOUBLE ? ` · ${P}double21` : ''} · ${P}batal21`,
      riwayat: k.blackjack21.riwayat, stat: k.blackjack21
    })
    const ringkas =
      `🃏 *HIT* → ${hasil.kartu} (total *${p.total}*${p.soft ? ' soft' : ''})\n` +
      `▸ Kamu: ${sesi.pemain.join(' ')}\n` +
      `▸ Bandar terlihat: ${sesi.bandar[0]}\n` +
      `▸ Taruhan ${fmtKoin(sesi.bet)}\n\n` +
      (p.total >= 17 ? `Saran: total ${p.total} — pertimbangkan \`${P}stand21\`\n` : '') +
      `\`${P}hit21\` tambah lagi · \`${P}stand21\` berhenti · \`${P}batal21\` batalkan`
    return kirimHasil(m, { title: 'Blackjack RPG', html: blackjackHtml(brand(), data), ringkas, tombol: tombolBj() })
  }
}

/** .stand21 — berhenti, bandar main */
export const bjStand = {
  command: ['stand21', 'standblackjack', 'tahankartu21', 'cukup21', 'standbj'],
  category: 'Games',
  description: '🃏 STAND — berhenti menarik kartu; bandar membuka kartu & main sampai total ≥ 17',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const cek = sesiAktif(k)
    if (cek?.kedaluwarsa) return selesaikanBj(m, jid, st, k, cek.sesi, { saldoAwal: cek.sesi.saldoAwal ?? r.money })
    if (!cek?.sesi) return m.reply(`⚠️ Tidak ada ronde blackjack aktif.\n\nMulai: \`${P}blackjack21 500\``)
    return selesaikanBj(m, jid, st, k, cek.sesi, { saldoAwal: cek.sesi.saldoAwal ?? r.money })
  }
}

/** .double21 — gandakan taruhan, satu kartu, lalu otomatis stand */
export const bjDouble = {
  command: ['double21', 'doubleblackjack', 'gandakartu21', 'gandataruhan21', 'doublebj'],
  category: 'Games',
  description: '🃏 DOUBLE — gandakan taruhan, ambil tepat satu kartu, lalu otomatis stand',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const k = siapkanKasino(r)
    const cek = sesiAktif(k)
    if (cek?.kedaluwarsa) return selesaikanBj(m, jid, st, k, cek.sesi, { saldoAwal: cek.sesi.saldoAwal ?? r.money })
    if (!cek?.sesi) return m.reply(`⚠️ Tidak ada ronde blackjack aktif.\n\nMulai: \`${P}blackjack21 500\``)
    const sesi = cek.sesi
    const saldo = getRPG(jid).money
    if (saldo < sesi.bet) {
      return m.reply(`⚠️ Saldo tidak cukup untuk DOUBLE (butuh tambahan ${fmtKoin(sesi.bet)} 💰, saldo ${fmtKoin(saldo)}).${CARA_KOIN}\n\nPakai \`${P}hit21\` atau \`${P}stand21\`.`)
    }
    const sebelum = saldo
    addMoney(jid, -sesi.bet)
    saveDB('users')
    const hasil = langkahBlackjack(sesi, 'double', { saldo })
    if (hasil.error) {
      addMoney(jid, sesi.bet)
      saveDB('users')
      return m.reply(`⚠️ ${hasil.error}`)
    }
    sesi.saldoAwal = sesi.saldoAwal ?? sebelum
    simpanSesi(k, sesi)
    return selesaikanBj(m, jid, st, k, sesi, { saldoAwal: sebelum })
  }
}

/** .batal21 — batalkan ronde (taruhan hangus) */
export const bjBatal = {
  command: ['batal21', 'batalblackjack', 'surrender21', 'nyerah21', 'batalkartu21'],
  category: 'Games',
  description: '🃏 Batalkan ronde blackjack yang berjalan (taruhan hangus)',
  limit: 0,
  cooldown: 1,
  run: async m => {
    const jid = K(m)
    const k = siapkanKasino(getRpgUser(jid))
    const s = k.sesi
    if (!s) return m.reply('⚠️ Tidak ada ronde blackjack aktif.')
    hapusSesi(k, s)
    return m.reply(
      `🚫 Ronde blackjack dibatalkan — taruhan *${fmtKoin(s.bet)}* hangus.\n` +
      `Kartu kamu tadi: ${s.pemain.join(' ')}\n\nMain lagi: \`${P}blackjack21 ${fmtKoin(s.bet)}\``
    )
  }
}

/** ambil objek rpg user (dipakai perintah yang tidak butuh stat7) */
function getRpgUser (jid) {
  const u = getUser(jid)
  if (!u.rpg || typeof u.rpg !== 'object') u.rpg = {}
  return u.rpg
}

/* ================================================================== */
/*  MENU & STATISTIK                                                   */
/* ================================================================== */
export const kasinoRpgMenu = {
  command: ['kasinorpg', 'kasinouang', 'casinorpg', 'judirpg', 'kasinokoin', 'rpgkasino', 'kasinojudi'],
  category: 'Games',
  description: '🎰 Menu 5 game kasino RPG (rolet, dadu, aviator, keno, blackjack) — taruhan pakai uang RPG asli',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const k = siapkanKasino(st.r)
    const saldo = getRPG(jid).money
    const teks =
      `🎰 *KASINO RPG* — uang asli, hasil diacak server\n\n` +
      `💰 Saldo kamu: *${fmtKoin(saldo)}* koin · luck ×${st.luck.toFixed(2)}\n\n` +
      `🎡 *Rolet* — \`${P}rolet 500 merah\`\n` +
      `    merah/hitam/genap/ganjil/kecil/besar ×1.9 · lusin/kolom ×2.7 · angka ×33\n` +
      `🎲 *Dadu (sic bo)* — \`${P}dadukoin 500 besar\`\n` +
      `    besar/kecil/genap/ganjil ×1.9 · pair ×12 · triple ×32 · jumlah ×7–190\n` +
      `📈 *Aviator* — \`${P}aviatorrpg 500 2\`\n` +
      `    kurva jebol acak; cash-out otomatis di targetmu (RTP ≈94%)\n` +
      `🎯 *Keno* — \`${P}keno 500 3 11 27\`\n` +
      `    pilih 1–6 dari 40, diundi 10 (RTP 84–91%)\n` +
      `🃏 *Blackjack* — \`${P}blackjack21 500\`\n` +
      `    multi-giliran: \`${P}hit21\` \`${P}stand21\` \`${P}double21\` \`${P}batal21\`\n\n` +
      `ℹ️ Semua pembayaran otomatis masuk papan peringkat \`${P}lbgame\` (kategori RPG).\n` +
      `🔒 Batas bayar satu ronde: ${fmtKoin(MAKS_BAYAR)} koin.\n` +
      `📊 Statistik: \`${P}kasinoinfo\` · Peluang: \`${P}roletinfo\` \`${P}daduinfo\` \`${P}kenoinfo\`\n` +
      `🎮 Versi chip (tanpa uang): \`${P}casino\` · Slot RPG: \`${P}slot\``
    try {
      await sendButtons(m.sock, m.jid, {
        text: teks,
        buttons: [
          { text: '🎡 Rolet ×1.9', id: `${P}rolet ${Math.max(MIN_BET, Math.min(saldo, k.rolet.bet))} merah` },
          { text: '🎲 Dadu besar', id: `${P}dadukoin ${Math.max(MIN_BET, Math.min(saldo, k.dadukoin.bet))} besar` },
          { text: '📈 Aviator ×2', id: `${P}aviatorrpg ${Math.max(MIN_BET, Math.min(saldo, k.aviatorrpg.bet))} 2` },
          { text: '🎯 Keno acak', id: `${P}keno ${Math.max(MIN_BET, Math.min(saldo, k.keno.bet))} acak` },
          { text: '🃏 Blackjack', id: `${P}blackjack21 ${Math.max(MIN_BET, Math.min(saldo, k.blackjack21.bet))}` },
          { text: '📊 Statistik kasino', id: `${P}kasinoinfo` }
        ]
      })
      return { handled: true }
    } catch {
      return m.reply(teks)
    }
  }
}

export const kasinoInfo = {
  command: ['kasinoinfo', 'infokasino', 'statistikkasino', 'kasinostat', 'riwayatkasino', 'rtpkasino'],
  category: 'Games',
  description: '📊 Statistik & riwayat 5 game kasino RPG + slot (ronde, menang, untung/rugi, RTP pribadi)',
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const r = getRpgUser(jid)
    const k = siapkanKasino(r)
    const ringkas = ringkasKasino(k)
    const nama = { rolet: '🎡 Rolet', dadukoin: '🎲 Dadu', aviatorrpg: '📈 Aviator', keno: '🎯 Keno', blackjack21: '🃏 Blackjack' }
    const baris = GAME_KASINO.map(g => {
      const s = ringkas[g]
      if (!s) return `▸ ${nama[g]}: —`
      return `▸ ${nama[g]}: ${s.main} ronde · menang ${s.menang} · taruhan ${fmtKoin(s.taruhan)} → hasil ${fmtKoin(s.hasil)} (${s.untung >= 0 ? '+' : '−'}${fmtKoin(Math.abs(s.untung))}) · RTP ${s.rtp}%`
    }).join('\n')
    const riwayat = Object.keys(nama).map(g => {
      const rws = k[g]?.riwayat || []
      if (!rws.length) return ''
      return `*${nama[g]}*\n` + rws.slice(0, 3).map(x => `   ${x.h >= 0 ? '＋' : '－'}${fmtKoin(Math.abs(x.h))} · ${x.l}`).join('\n')
    }).filter(Boolean).join('\n')
    const t = ringkas.total
    const teks =
      `🎰 *STATISTIK KASINO RPG*\n\n` +
      `💰 Saldo: *${fmtKoin(getRPG(jid).money)}* koin\n\n` +
      `${baris}\n\n` +
      `*TOTAL*: ${t.main} ronde · taruhan ${fmtKoin(t.taruhan)} → hasil ${fmtKoin(t.hasil)} (${t.untung >= 0 ? '+' : '−'}${fmtKoin(Math.abs(t.untung))}) · RTP pribadi ${t.rtp}%\n\n` +
      (riwayat ? `*RIWAYAT TERAKHIR*\n${riwayat}\n\n` : '') +
      `🏆 Pembayaran terbaik tercatat di papan peringkat: \`${P}lbgame\`\n` +
      `ℹ️ RTP teoretis: rolet 87–92% · dadu 88–92% · aviator 94% · keno 84–91% · blackjack 90–96% (tergantung keahlian). Naik sedikit sesuai luck & bonus koin RPG-mu.`
    return m.reply(teks)
  }
}

/** daftar untuk menu .casino & hub .gamerespon */
export const DAFTAR_CASINO_RPG = [
  { id: 'rolet', cmd: 'rolet', icon: '🎡', nama: 'Rolet RPG', ket: 'roda Eropa 37 angka: merah/hitam ×1.9, lusin/kolom ×2.7, angka langsung ×33 — uang RPG asli', kind: 'rolet' },
  { id: 'dadukoin', cmd: 'dadukoin', icon: '🎲', nama: 'Dadu RPG', ket: 'sic bo 3 dadu: besar/kecil ×1.9, pair ×12, triple ×32, jumlah 3–18 ×7–190 — uang RPG asli', kind: 'dadukoin' },
  { id: 'aviatorrpg', cmd: 'aviatorrpg', icon: '📈', nama: 'Aviator RPG', ket: 'kurva multiplier jebol acak; tentukan target cash-out ×1.1–50 — uang RPG asli', kind: 'aviatorrpg' },
  { id: 'keno', cmd: 'keno', icon: '🎯', nama: 'Keno RPG', ket: 'pilih 1–6 angka dari 40, 10 diundi server, pengali sampai ×700 — uang RPG asli', kind: 'keno' },
  { id: 'blackjack21', cmd: 'blackjack21', icon: '🃏', nama: 'Blackjack RPG', ket: '21 multi-giliran: hit/stand/double, blackjack ×2.2, bandar stand di 17 — uang RPG asli', kind: 'blackjack21' }
]
