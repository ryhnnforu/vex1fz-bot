/**
 * 🎰 SLOT MESIN RPG — taruhan pakai UANG RPG ASLI (v7.5)
 * -------------------------------------------------------------------------
 *  `.slot` versi lama adalah game HTML ber-chip lokal (sekarang `.slotchip`).
 *  Versi ini berbeda secara mendasar:
 *
 *   1. Hasil putaran diacak di **SERVER** (lib/slotrpg.js → putarSlot),
 *      bukan di dalam kartu HTML, jadi tidak bisa dicurangi/diulang-ulang.
 *   2. Uang yang dipakai = **koin RPG** (`u.rpg.money` di database/users.json)
 *      → benar-benar dipotong saat taruhan dan benar-benar ditambahkan saat menang.
 *   3. Taruhan **bisa diatur**: `.slot 500` · `.slot 2.5k` · `.slot all` ·
 *      `.slot min` · `.slotbet 1000` (simpan taruhan bawaan).
 *   4. **Tersambung ke ekonomi RPG**:
 *        • peluang   ← stat7().luck  (job, skill, permata, relik, buff, dekor, musim)
 *        • bonus 3×  ← stat7().koin  (rumah & dekorasi, maks ×1,1)
 *        • EXP       ← expHadiah() tiap putaran
 *        • saldo     ← addMoney() / getRPG()
 *        • statistik ← r.slot (putar, menang, jackpot, untung/rugi, riwayat)
 *   5. Tampilannya tetap **HTML app** seperti .arcade/.casino: gulungan
 *      berputar lalu berhenti persis di hasil server, plus panel RINCIAN /
 *      PAYTABLE / RIWAYAT / BANTUAN (◀▶ panel · ▲▼ gulir · ● putar ulang).
 *
 *  Keseimbangan: RTP ~89% di luck 1 (mesin = pemusnah koin/anti inflasi),
 *  naik sampai ~93% untuk pemain dengan rumah + dekorasi penuh.
 */
import { config } from '../config.js'
import { sendHtmlApp } from '../lib/htmlapp.js'
import { catatSkor } from '../lib/lbgame.js'
import { saveDB } from '../lib/database.js'
import { addMoney, addExp, getRPG } from '../lib/rpg.js'
import { K, stat7, expHadiah } from '../lib/rpg7.js'
import {
  SIMBOL, BAYAR3, MIN_BET, MAX_BET, DEFAULT_BET, TANGGA_BET,
  parseBet, putarSlot, hitungBayar, peluang, siapkanSlot, catatSlot,
  slotRpgHtml, slotTeks, fmtKoin, betBerikutnya
} from '../lib/slotrpg.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'theryhann!'

/** ringkasan cara pakai, ditempel di bawah pesan error */
const bantuan = (r, s) =>
  `\n\n💰 Saldo kamu: *${fmtKoin(r.money)}* koin\n` +
  `Contoh: \`${P}slot 500\` · \`${P}slot 2.5k\` · \`${P}slot all\` · \`${P}slot min\`\n` +
  `Taruhan bawaan: \`${P}slotbet ${s.bet}\` → ubah misalnya \`${P}slotbet 1000\`\n` +
  `Tabel hadiah & statistik: \`${P}slotinfo\` · Versi chip (tanpa uang): \`${P}slotchip\``

/* ================================================================== */
/*  .slot [taruhan] — putar mesin                                      */
/* ================================================================== */
export const slotRpg = {
  command: ['slot', 'mesinslot', 'slotmesin', 'putarslot', 'slotgacor', 'slotrpg',
    'slotkoin', 'slotuang', 'judislot', 'spinrpg', 'slotrpguang'],
  category: 'Games',
  description: '🎰 Slot Mesin RPG — 3 gulungan HTML app, taruhan pakai uang RPG asli (koin), bisa diatur: .slot 500 / 2.5k / all / min',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const s = siapkanSlot(r)

    const parsed = parseBet((m.args || []).join(' '), r.money, s.bet)
    if (parsed.error) return m.reply(parsed.error + bantuan(r, s))
    const bet = parsed.bet

    /* --- 1. potong uang dulu (otoritatif di server) --- */
    const saldoAwal = r.money
    addMoney(jid, -bet)

    /* --- 2. acak hasil di server, hitung pembayaran --- */
    const hasil = putarSlot(st.luck)
    const hit = hitungBayar(hasil, bet, { koin: st.koin })
    if (hit.bayar > 0) addMoney(jid, hit.bayar)

    /* --- 3. hadiah EXP kecil tiap putaran (tersambung ke progress RPG) --- */
    const exp = expHadiah(st, 4 + Math.floor(bet / 250))
    const naik = addExp(jid, exp)

    /* --- 4. catat statistik + riwayat --- */
    catatSlot(s, { bet, bayar: hit.bayar, hasil, jackpot: hit.jackpot })
    const saldoAkhir = getRPG(jid).money
    saveDB('users')

    /* --- 4b. papan peringkat game (v7.6): pembayaran terbesar sekali putar.
       Kasino RPG tercatat OTOMATIS di server — user tidak perlu setor kode. --- */
    let lb = null
    if (hit.bayar > 0) {
      try { lb = catatSkor(jid, m.pushName || r.name || 'Kamu', 'slot', hit.bayar, { src: 'auto' }) } catch {}
    }

    const data = {
      bet, hasil, kali: hit.kali, bayar: hit.bayar, jackpot: hit.jackpot,
      saldoAwal, saldoAkhir, exp,
      luck: Number(st.luck.toFixed(2)), bonusKoin: Number(hit.bonusKoin.toFixed(2)),
      nama: m.pushName || r.name || '',
      riwayat: s.riwayat.slice(1),
      stat: { putar: s.putar, menang: s.menang, jackpot: s.jackpot, terbaik: s.terbaik }
    }

    /* --- 5. kirim kartu HTML app (gulungan berhenti tepat di hasil server) --- */
    try {
      await sendHtmlApp(m.sock, m.jid, { title: 'Slot Mesin RPG', html: slotRpgHtml(brand(), data) })
    } catch (e) {
      return m.reply(
        slotTeks(data) +
        `\n\n⚠️ _Kartu HTML gagal dimuat (${String(e?.message || e).slice(0, 80)}) — hasil tetap sah & uang sudah diproses._` +
        (naik?.leveledUp ? `\n\n🎉 *LEVEL UP!* Sekarang level ${naik.level}.` : '')
      )
    }

    /* ringkasan 1 baris supaya hasil tetap terbaca walau kartu tidak dirender */
    const ringkas =
      `${hit.jackpot ? '🎉' : hit.bayar > 0 ? '✨' : '💨'} \`${P}slot ${fmtKoin(bet)}\` → ` +
      `${hasil.map(i => SIMBOL[i]).join('')} · ${hit.bayar > 0 ? `+${fmtKoin(hit.bayar)} 💰 (×${hit.kali})` : `−${fmtKoin(bet)} 💰`}` +
      ` · saldo *${fmtKoin(saldoAkhir)}* 💰 · +${exp} EXP` +
      (naik?.leveledUp ? ` · 🎉 LEVEL ${naik.level}!` : '') +
      (hit.bayar === 0 ? `\nPutar lagi: \`${P}slot ${fmtKoin(bet)}\` · \`${P}slot all\` · Naikkan: \`${P}slot ${fmtKoin(betBerikutnya(bet, saldoAkhir))}\`` : '') +
      (lb && lb.terbaikBaru
        ? `\n🏆 *Rekor pembayaran slot baru!* Peringkat *#${lb.rank}* dari ${lb.total} → \`${P}lbgame slot\``
        : (lb ? `\n🏆 Papan peringkat slot: #${lb.rank}/${lb.total} (rekor ${fmtKoin(lb.skor)}) → \`${P}lbgame slot\`` : ''))
    await m.reply(ringkas)
    return { handled: true }
  }
}

/* ================================================================== */
/*  .slotbet <n> — simpan taruhan bawaan                              */
/* ================================================================== */
export const slotBet = {
  command: ['slotbet', 'setbet', 'taruhanslot', 'betdefault', 'slotdefault'],
  category: 'Games',
  description: `Atur taruhan bawaan .slot (tanpa memutar) — min ${MIN_BET}, maks ${fmtKoin(MAX_BET)}`,
  limit: 0,
  cooldown: 2,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const s = siapkanSlot(r)
    const arg = String(m.args?.[0] || '').trim().toLowerCase()
    if (!arg) {
      saveDB('users')
      return m.reply(
        `🎰 *TARUHAN BAWAAN SLOT*\n\nSaat ini: *${fmtKoin(s.bet)}* 💰\nSaldo: ${fmtKoin(r.money)} 💰\n\n` +
        `Ubah: \`${P}slotbet 1000\`\nTangga cepat: ${TANGGA_BET.map(x => fmtKoin(x)).join(' · ')}\n` +
        `Batas: min ${fmtKoin(MIN_BET)} · maks ${fmtKoin(MAX_BET)}\n\n` +
        `Setiap \`${P}slot\` tanpa angka memakai taruhan ini.`
      )
    }
    const parsed = parseBet(arg, Math.max(r.money, MAX_BET), s.bet)
    if (parsed.error) return m.reply(parsed.error + bantuan(r, s))
    s.bet = parsed.bet
    saveDB('users')
    return m.reply(
      `✅ Taruhan bawaan .slot disetel ke *${fmtKoin(s.bet)}* 💰\n\n` +
      `Saldo: ${fmtKoin(r.money)} 💰\nPutar sekarang: \`${P}slot\``
    )
  }
}

/* ================================================================== */
/*  .slotinfo — tabel hadiah + peluang + statistik                    */
/* ================================================================== */
export const slotInfo = {
  command: ['slotinfo', 'infoslot', 'paytable', 'tabelslot', 'hargaslot', 'peluangslot'],
  category: 'Games',
  description: 'Tabel hadiah, peluang (dihitung dari luck kamu), RTP, dan statistik slot RPG',
  limit: 0,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const s = siapkanSlot(r)
    const pl = peluang(st.luck, st.koin)
    const untung = s.hasil - s.taruhan
    saveDB('users')
    return m.reply(
      `🎰 *SLOT MESIN RPG — TABEL HADIAH*\n` +
      `Mesin 3 gulungan · uang RPG asli · hasil diacak di server\n\n` +
      `*3 SIMBOL SAMA* (× taruhan)\n` +
      SIMBOL.map((x, i) => `${x}${x}${x}  ×${BAYAR3[i]}${i === 6 ? '  🎉 JACKPOT' : ''}`).join('\n') +
      `\n\n*2 SIMBOL SAMA*  ×1 — taruhan balik\n\n` +
      `📊 *PELUANG KAMU* (luck ×${st.luck.toFixed(2)}${st.koin > 1 ? `, bonus koin ×${Math.min(1.1, st.koin).toFixed(2)}` : ''})\n` +
      `▸ 3 sama: ${(pl.tiga * 100).toFixed(2)}%\n` +
      `▸ 2 sama: ${(pl.dua * 100).toFixed(1)}%\n` +
      `▸ Jackpot 7️⃣7️⃣7️⃣: 1 / ${fmtKoin(Math.round(1 / Math.max(pl.jackpot, 1e-9)))} putaran\n` +
      `▸ RTP teoritis: *${(pl.rtp * 100).toFixed(1)}%* ${pl.rtp < 1 ? '(mesin menyerap koin — anti inflasi)' : ''}\n` +
      `▸ Luck naik dari rumah, dekorasi, permata, relik, buff & musim\n\n` +
      `📈 *STATISTIK KAMU*\n` +
      `▸ Putaran: ${s.putar} · Menang: ${s.menang} (${s.putar ? Math.round(s.menang / s.putar * 100) : 0}%)\n` +
      `▸ Jackpot: ${s.jackpot} · Menang terbesar: ${fmtKoin(s.terbaik)} 💰\n` +
      `▸ Total taruhan: ${fmtKoin(s.taruhan)} 💰 · Total kembali: ${fmtKoin(s.hasil)} 💰\n` +
      `▸ Untung/rugi: *${untung >= 0 ? '+' : '−'}${fmtKoin(Math.abs(untung))}* 💰\n\n` +
      `💰 Saldo: *${fmtKoin(r.money)}* koin · Taruhan bawaan: ${fmtKoin(s.bet)}\n` +
      `Batas taruhan: ${fmtKoin(MIN_BET)} – ${fmtKoin(MAX_BET)} (default ${fmtKoin(DEFAULT_BET)})\n\n` +
      `Main: \`${P}slot 500\` · \`${P}slot all\` · \`${P}slotbet 1000\`\n` +
      `Riwayat: \`${P}slotriwayat\` · Versi chip: \`${P}slotchip\`\n` +
      `Cari koin: \`${P}tambang\` \`${P}tebang\` \`${P}mancing\` \`${P}berburu\` \`${P}battle\` \`${P}kerja\``
    )
  }
}

/* ================================================================== */
/*  .slotriwayat — 8 putaran terakhir                                 */
/* ================================================================== */
export const slotRiwayat = {
  command: ['slotriwayat', 'riwayatslot', 'historyslot', 'slotlog', 'logslot'],
  category: 'Games',
  description: 'Riwayat 8 putaran slot RPG terakhir + untung/rugi tiap putaran',
  limit: 0,
  run: async m => {
    const jid = K(m)
    const st = stat7(jid)
    const r = st.r
    const s = siapkanSlot(r)
    const baris = (s.riwayat || []).map((x, i) =>
      `${i + 1}. ${x.s}  bet ${fmtKoin(x.b)}  ${x.h >= 0 ? `*+${fmtKoin(x.h)}*` : `−${fmtKoin(Math.abs(x.h))}`} 💰` +
      `  ·  ${new Date(x.w).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`)
    return m.reply(
      `📜 *RIWAYAT SLOT RPG* (8 terakhir)\n\n` +
      (baris.length ? baris.join('\n') : '_belum ada putaran_') +
      `\n\n▸ Total: ${s.putar} putaran · ${s.menang} menang · ${s.jackpot} jackpot\n` +
      `▸ Untung/rugi keseluruhan: *${s.hasil - s.taruhan >= 0 ? '+' : '−'}${fmtKoin(Math.abs(s.hasil - s.taruhan))}* 💰\n` +
      `▸ Saldo sekarang: ${fmtKoin(r.money)} 💰 · Luck ×${st.luck.toFixed(2)}\n\n` +
      `Putar lagi: \`${P}slot ${fmtKoin(s.bet)}\` · Statistik: \`${P}slotinfo\``
    )
  }
}

/** dipakai .casino / .gamerespon / menu RPG untuk menampilkan baris slot uang asli */
export const SLOT_RPG_INFO = {
  id: 'slotrpg', cmd: 'slot', icon: '🎰', nama: 'Slot Mesin RPG',
  ket: `3 gulungan — taruhan uang RPG asli, bisa diatur (${fmtKoin(MIN_BET)}–${fmtKoin(MAX_BET)}), hasil diacak server`,
  ratio: '600×640', kind: 'slotrpg', html: slotRpgHtml,
  alias: ['slotinfo', 'slotbet', 'slotriwayat', 'slotchip']
}

export default { slotRpg, slotBet, slotInfo, slotRiwayat, SLOT_RPG_INFO }
