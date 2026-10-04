/**
 * ============================================================
 *  lib/slotrpg.js — 🎰 SLOT MESIN RPG (uang asli, server-side)
 * ------------------------------------------------------------
 *  Beda dengan `.slotchip` (casino HTML chip lokal): di sini hasil
 *  putaran diacak di SERVER, uang RPG (`u.rpg.money` di
 *  database/users.json) benar-benar dipotong & dibayarkan, lalu
 *  hasilnya dikirim sebagai kartu HTML app yang *memutar animasi
 *  gulungan dan berhenti tepat di hasil server*.
 *
 *  Tersambung ke ekonomi RPG:
 *   • saldo           = r.money            (lib/rpg.js → addMoney)
 *   • peluang         = stat7().luck       (job, skill, permata, relik,
 *                                           buff, dekorasi, musim, prestasi)
 *   • bonus hadiah 3× = stat7().koin       (rumah + dekorasi, maks ×1,2)
 *   • EXP tiap putaran= expHadiah(stat7())
 *   • statistik & riwayat disimpan di r.slot
 *
 *  Semua fungsi acak/bayar bersifat murni (pure) supaya bisa diuji.
 * ============================================================
 */
import { shell } from './htmlgames.js'

/* ------------------------- TABEL MESIN ------------------------- */
export const SIMBOL = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣']
export const NAMA_SIMBOL = ['Ceri', 'Lemon', 'Anggur', 'Lonceng', 'Bintang', 'Berlian', 'Tujuh']
/** bobot dasar (total 100) — makin ke kanan makin langka */
export const BOBOT = [26, 22, 18, 14, 10, 6, 4]
/** pengali taruhan untuk 3 simbol sama */
export const BAYAR3 = [6, 10, 16, 25, 45, 90, 250]
/** pengali untuk 2 simbol sama (balik modal) */
export const BAYAR2 = 1
export const MIN_BET = 50
export const MAX_BET = 250000
export const DEFAULT_BET = 100
/** tangga taruhan cepat (dipakai saran & tombol) */
export const TANGGA_BET = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000]
/** batas atas bonus pengali koin (rumah/dekorasi) untuk kemenangan 3 simbol */
export const BONUS_KOIN_MAKS = 1.1

export const fmtKoin = n => Math.round(n || 0).toLocaleString('id-ID')

/* ------------------------- BOBOT + LUCK ------------------------- */

/**
 * Bobot efektif setelah dipengaruhi `luck` RPG.
 * Luck > 1 menaikkan bobot 3 simbol terlangka (⭐ 💎 7️⃣) maksimal +60%,
 * luck < 1 menurunkannya (maksimal -50%).
 * @returns {number[]} bobot per simbol (belum dinormalisasi)
 */
export function bobotLuck (luck = 1) {
  const l = Number.isFinite(luck) ? luck : 1
  const boost = Math.max(-0.5, Math.min(0.6, (l - 1) * 0.5))
  return BOBOT.map((b, i) => (i >= 4 ? Math.max(0.5, b * (1 + boost)) : b))
}

function ambilSimbol (bobot, rng) {
  let tot = 0
  for (let i = 0; i < bobot.length; i++) tot += bobot[i]
  let r = rng() * tot
  for (let i = 0; i < bobot.length; i++) { r -= bobot[i]; if (r <= 0) return i }
  return 0
}

/**
 * Acak 3 gulungan di SERVER (satu-satunya sumber kebenaran).
 * @param {number} luck  pengali luck dari stat7()
 * @param {Function} rng sumber acak (bawaan Math.random)
 * @returns {number[]} 3 indeks simbol
 */
export function putarSlot (luck = 1, rng = Math.random) {
  const w = bobotLuck(luck)
  return [ambilSimbol(w, rng), ambilSimbol(w, rng), ambilSimbol(w, rng)]
}

/**
 * Hitung pembayaran dari hasil putaran.
 * @param {number[]} hasil 3 indeks simbol
 * @param {number} bet  taruhan
 * @param {{koin?:number}} opt bonus pengali koin (rumah/dekorasi), hanya untuk 3 sama
 * @returns {{kali:number, bayar:number, ket:string, jackpot:boolean, tiga:boolean, dua:boolean, bonusKoin:number}}
 */
export function hitungBayar (hasil, bet, opt = {}) {
  const [a, b, c] = hasil
  const taruhan = Math.max(0, Math.floor(bet || 0))
  let kali = 0, ket = ''
  const tiga = a === b && b === c
  const dua = !tiga && (a === b || b === c || a === c)
  if (tiga) { kali = BAYAR3[a] || 0; ket = SIMBOL[a] + SIMBOL[a] + SIMBOL[a] + ' ×' + kali }
  else if (dua) { kali = BAYAR2; ket = '2 simbol sama ×' + BAYAR2 + ' (balik modal)' }
  const bonusKoin = tiga ? Math.max(1, Math.min(BONUS_KOIN_MAKS, Number(opt.koin) || 1)) : 1
  const bayar = kali > 0 ? Math.round(taruhan * kali * bonusKoin) : 0
  return { kali, bayar, ket, jackpot: tiga && a === 6, tiga, dua, bonusKoin }
}

/**
 * Peluang analitis mesin untuk luck & bonus koin tertentu (dipakai .slotinfo).
 * @returns {{tiga:number, dua:number, jackpot:number, rtp:number}}
 */
export function peluang (luck = 1, koin = 1) {
  const w = bobotLuck(luck)
  let tot = 0
  for (const x of w) tot += x
  const p = w.map(x => x / tot)
  const bonus = Math.max(1, Math.min(BONUS_KOIN_MAKS, Number(koin) || 1))
  let tiga = 0, dua = 0, ev3 = 0
  for (let i = 0; i < p.length; i++) {
    const p3 = p[i] * p[i] * p[i]
    tiga += p3
    ev3 += p3 * BAYAR3[i] * bonus
    dua += 3 * p[i] * p[i] * (1 - p[i])
  }
  return { tiga, dua, jackpot: p[6] * p[6] * p[6], rtp: ev3 + dua * BAYAR2 }
}

/** simulasi cepat untuk uji keseimbangan ekonomi (RTP) */
export function simulasi (jumlah = 100000, luck = 1, koin = 1, rng = Math.random) {
  let taruhan = 0, kembali = 0, tiga = 0, dua = 0, jackpot = 0
  for (let i = 0; i < jumlah; i++) {
    const h = putarSlot(luck, rng)
    const r = hitungBayar(h, 100, { koin })
    taruhan += 100; kembali += r.bayar
    if (r.tiga) tiga++
    if (r.dua) dua++
    if (r.jackpot) jackpot++
  }
  return { rtp: kembali / taruhan, tiga: tiga / jumlah, dua: dua / jumlah, jackpot: jackpot / jumlah }
}

/* ------------------------- TARUHAN ------------------------- */

/** "1.000" / "2.5k" / "1jt" / "500" → angka (null kalau tidak terbaca) */
export function parseAngka (teks) {
  const t = String(teks || '').trim().toLowerCase().replace(/\s+/g, '')
  if (!t) return null
  const m = /^(\d+(?:[.,]\d+)?)(k|rb|ribu|jt|juta|m)?$/i.exec(t)
  if (!m) return null
  const mult = { k: 1e3, rb: 1e3, ribu: 1e3, jt: 1e6, juta: 1e6, m: 1e6 }[m[2]] || 1
  let num = m[1]
  if (mult === 1 && !m[2]) {
    // tanpa sufiks: "1.000" = seribu, "1.5" = 1,5 → dibulatkan
    if (/^\d+[.,]\d{3}$/.test(num)) num = num.replace(/[.,]/g, '')
    else num = num.replace(',', '.')
  } else num = num.replace(',', '.')
  const v = Math.floor(parseFloat(num) * mult)
  return Number.isFinite(v) ? v : null
}

/**
 * Terjemahkan argumen taruhan.
 * @param {string} teks argumen user (".slot 500" → "500")
 * @param {number} money saldo RPG sekarang
 * @param {number} terakhir taruhan terakhir (dipakai kalau argumen kosong)
 * @returns {{bet?:number, error?:string, catatan?:string, semua?:boolean, bawaan?:boolean}}
 */
export function parseBet (teks, money, terakhir = DEFAULT_BET) {
  const t = String(teks || '').trim().toLowerCase()
  const saldo = Math.max(0, Math.floor(money || 0))
  if (!t) {
    const bet = Math.max(MIN_BET, Math.min(MAX_BET, Math.floor(terakhir) || DEFAULT_BET))
    if (bet > saldo) {
      return {
        error: `Uangmu kurang 💰 — taruhan bawaan *${fmtKoin(bet)}*, saldo *${fmtKoin(saldo)}* (minimum ${fmtKoin(MIN_BET)}).\n\n` +
          `Cari koin: \`.tambang\` \`.tebang\` \`.mancing\` \`.berburu\` \`.battle\` \`.kerja\` \`.klaim\``
      }
    }
    return { bet, bawaan: true }
  }
  if (/^(all|semua|max|maks|maksimal|gas|gaskeun|full)$/.test(t)) {
    const bet = Math.min(MAX_BET, saldo)
    if (bet < MIN_BET) return { error: `Saldo ${fmtKoin(saldo)} 💰 di bawah taruhan minimum ${fmtKoin(MIN_BET)}.` }
    return { bet, semua: true }
  }
  if (/^(min|kecil|termurah)$/.test(t)) {
    if (saldo < MIN_BET) return { error: `Saldo ${fmtKoin(saldo)} 💰 di bawah taruhan minimum ${fmtKoin(MIN_BET)}.` }
    return { bet: MIN_BET }
  }
  const n = parseAngka(t)
  if (n === null) {
    return {
      error: `Taruhan *"${t}"* tidak terbaca.\n\nContoh: \`.slot 500\` · \`.slot 2.5k\` · \`.slot 1jt\` · \`.slot all\` · \`.slot min\``
    }
  }
  if (n < MIN_BET) return { error: `Taruhan minimum *${fmtKoin(MIN_BET)}* 💰 (kamu minta ${fmtKoin(n)}).` }
  if (n > MAX_BET) return { error: `Taruhan maksimum *${fmtKoin(MAX_BET)}* 💰 per putaran (kamu minta ${fmtKoin(n)}).` }
  if (n > saldo) {
    return {
      error: `Uangmu kurang 💰\n\nTaruhan: *${fmtKoin(n)}* · Saldo: *${fmtKoin(saldo)}* · Kurang: *${fmtKoin(n - saldo)}*\n\n` +
        `Cari uang: \`.tambang\` \`.tebang\` \`.mancing\` \`.berburu\` \`.battle\` \`.kerja\` \`.klaim\` · atau \`.slot all\``
    }
  }
  return { bet: n }
}

/** tangga taruhan berikutnya (untuk saran "naikkan taruhan") */
export function betBerikutnya (bet, money) {
  const naik = TANGGA_BET.find(x => x > bet)
  return naik && naik <= money ? naik : Math.min(MAX_BET, money)
}

/* ------------------------- PROFIL STATISTIK ------------------------- */

/** data statistik slot di dalam rpg user (dibuat malas) */
export function siapkanSlot (r) {
  if (!r.slot || typeof r.slot !== 'object') {
    r.slot = { putar: 0, menang: 0, taruhan: 0, hasil: 0, jackpot: 0, terbaik: 0, bet: DEFAULT_BET, riwayat: [] }
  }
  const s = r.slot
  const angka = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : d)
  s.putar = angka(s.putar); s.menang = angka(s.menang); s.taruhan = angka(s.taruhan)
  s.hasil = angka(s.hasil); s.jackpot = angka(s.jackpot); s.terbaik = angka(s.terbaik)
  s.bet = Math.max(MIN_BET, Math.min(MAX_BET, angka(s.bet, DEFAULT_BET)))
  if (!Array.isArray(s.riwayat)) s.riwayat = []
  s.riwayat = s.riwayat.filter(x => x && typeof x === 'object').map(x => ({
    s: String(x.s || '???').slice(0, 8), b: angka(x.b), h: angka(x.h), w: angka(x.w, Date.now())
  })).slice(0, 8)
  return s
}

/** catat satu putaran ke statistik + riwayat (maks 8 baris) */
export function catatSlot (s, { bet, bayar, hasil, jackpot }) {
  const b = Math.max(0, Math.floor(Number(bet) || 0))
  const h = Math.max(0, Math.floor(Number(bayar) || 0))
  s.putar++
  s.taruhan += b
  s.hasil += h
  s.bet = b
  if (h > 0) s.menang++
  if (jackpot) s.jackpot++
  if (h > s.terbaik) s.terbaik = h
  const simbol = (Array.isArray(hasil) ? hasil : []).map(i => SIMBOL[i] || '?').join('')
  s.riwayat = [{ s: simbol, b, h: h - b, w: Date.now() }, ...(s.riwayat || [])].slice(0, 8)
  return s
}

/* ============================================================ */
/*  KARTU HTML — animasi gulungan berhenti tepat di hasil server  */
/* ============================================================ */

const SLOT_RPG_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var D = (typeof __SLOTDATA !== 'undefined' && __SLOTDATA) || {};
  var SIMBOL = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣'];
  var BAYAR3 = [6, 10, 16, 25, 45, 90, 250];
  var N = 24, ROW = 92, OX = 75, OY = 138, STRIDE = 150, KARTU = 140;
  var BET = Math.max(0, D.bet || 0);
  var KALI = D.kali || 0, BAYAR = D.bayar || 0, JACKPOT = !!D.jackpot;
  var HASIL = (D.hasil && D.hasil.length === 3) ? D.hasil : [0, 1, 2];
  var SALDO_AWAL = D.saldoAwal || 0, SALDO_AKHIR = D.saldoAkhir || 0;
  var EXP = D.exp || 0, LUCK = D.luck || 1, KOIN = D.bonusKoin || 1;
  var RIWAYAT = D.riwayat || [], STAT = D.stat || {}, NAMA = D.nama || '';
  var strip = [], pos = [0, 0, 0], target = [0, 0, 0], berhenti = [true, true, true];
  var fase = 'siap', runT = 0, flash = 0, part = [], panel = 0, gulir = 0, idle = 0, tunda = 16;
  var PANEL = ['RINCIAN', 'PAYTABLE', 'RIWAYAT', 'BANTUAN'];

  function acakStrip () {
    var s = [], i;
    while (s.length < N) s.push(Math.floor(Math.random() * SIMBOL.length));
    for (i = 0; i < 3; i++) if (s[i] === HASIL[i]) s[i] = (s[i] + 1) % SIMBOL.length;
    return s;
  }
  function cariIndeks (reel, simbol) {
    for (var i = 0; i < N; i++) if (strip[reel][i] === simbol) return i;
    strip[reel][0] = simbol; return 0;
  }
  function tengah (reel) {
    var idx = ((Math.floor(pos[reel]) + 1) % N + N) % N;
    return strip[reel][idx];
  }
  function ledakan (x, y, warna, n) {
    for (var i = 0; i < n; i++) part.push({ x: x, y: y, vx: A.rand(-4.5, 4.5), vy: A.rand(-7, 1), r: A.rand(2, 5.5), a: 1, w: warna });
  }
  function hud () {
    A.setScore(Math.max(0, SALDO_AKHIR));
    A.setStatus('TARUHAN ' + BET, 'SALDO ' + SALDO_AKHIR);
    A.setHint('◀▶ panel · ▲▼ gulir · ● putar ulang animasi');
  }

  function mulaiPutar () {
    strip = [acakStrip(), acakStrip(), acakStrip()];
    for (var i = 0; i < 3; i++) {
      var j = cariIndeks(i, HASIL[i]);
      var base = Math.floor(pos[i]);
      var perlu = ((j - 1 - base) % N + N) % N;
      target[i] = base + (12 + i * 5) * N + perlu;
      berhenti[i] = false;
    }
    fase = 'putar'; flash = 0; part = []; idle = 0;
    A.SFX.jump();
  }

  function selesai () {
    fase = 'hasil'; idle = 0;
    if (BAYAR > 0) {
      flash = 70;
      A.SFX.level();
      ledakan(W / 2, OY + ROW * 1.5, JACKPOT ? '#ffd700' : '#00ff87', JACKPOT ? 70 : 30);
      if (BAYAR > A.best) { A.best = BAYAR; A.saveBest(BAYAR); }
    } else A.SFX.crash();
    A.setBest();
    hud();
  }

  function update (dt) {
    runT += dt;
    if (fase === 'siap') {
      tunda -= dt;
      if (tunda <= 0) mulaiPutar();
    }
    if (fase === 'putar') {
      var semua = true;
      for (var i = 0; i < 3; i++) {
        if (berhenti[i]) continue;
        var sisa = target[i] - pos[i];
        var sp = Math.max(0.06, 0.12 + sisa * 0.045) * dt;
        if (sisa <= sp) { pos[i] = target[i]; berhenti[i] = true; A.SFX.point(); }
        else { pos[i] += sp; semua = false; }
      }
      A.setProgress(Math.max(0, Math.min(1, 1 - (target[2] - pos[2]) / (12 * N))));
      if (semua) selesai();
    } else A.setProgress(fase === 'hasil' ? 1 : 0);
    if (flash > 0) flash -= dt;
    for (var p = part.length - 1; p >= 0; p--) {
      var q = part[p];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.22 * dt; q.a -= 0.013 * dt;
      if (q.a <= 0) part.splice(p, 1);
    }
    if (fase === 'hasil') idle += dt;
    A.state = {
      fase: fase, reel: [tengah(0), tengah(1), tengah(2)], hasil: HASIL,
      bet: BET, kali: KALI, bayar: BAYAR, jackpot: JACKPOT,
      saldoAwal: SALDO_AWAL, saldoAkhir: SALDO_AKHIR, exp: EXP, luck: LUCK,
      panel: panel, namaPanel: PANEL[panel], gulir: gulir,
      over: false, sebab: '', idle: Math.round(idle), best: A.best,
      berhenti: berhenti.slice(), partikel: part.length
    };
    requestAnimationFrame(loop);
  }

  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function kartuSimbol (x, y, w, h, isi, sorot) {
    ctx.fillStyle = sorot ? '#3a2560' : '#170f2e';
    bulat(x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = sorot ? '#ffd700' : '#5a3fb0';
    ctx.lineWidth = sorot ? 4 : 2; ctx.stroke();
    ctx.font = '50px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(isi, x + w / 2, y + h / 2 + 2);
  }
  function teks (s, x, y, ukuran, warna, gaya, rata) {
    ctx.fillStyle = warna; ctx.font = (gaya || '700') + ' ' + ukuran + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
  }

  function panelIsi (y0) {
    var i, x = 26, w = W - 52;
    ctx.save();
    ctx.beginPath(); ctx.rect(14, y0 - 4, W - 28, H - y0 - 12); ctx.clip();
    if (panel === 0) {
      var baris = [
        ['Taruhan', '- ' + BET + ' 💰'],
        ['Hasil', HASIL.map(function (h) { return SIMBOL[h]; }).join(' ') + (KALI > 0 ? '  ×' + KALI : '')],
        ['Pembayaran', BAYAR > 0 ? '+ ' + BAYAR + ' 💰' : '0 💰'],
        ['Saldo', SALDO_AWAL + ' → ' + SALDO_AKHIR + ' 💰'],
        ['EXP didapat', '+' + EXP + ' ✨'],
        ['Luck RPG', '×' + LUCK.toFixed(2) + (KOIN > 1 ? '  ·  bonus koin ×' + KOIN.toFixed(2) : '')],
        ['Statistik', (STAT.putar || 0) + ' putaran · ' + (STAT.menang || 0) + ' menang · ' + (STAT.jackpot || 0) + ' jackpot']
      ];
      for (i = 0; i < baris.length; i++) {
        var yy = y0 + 18 + i * 24 - gulir * 6;
        if (yy < y0 - 6 || yy > H - 10) continue;
        teks(baris[i][0], x, yy, 14, '#b9a7ff', '600');
        teks(baris[i][1], x + w, yy, 14, i === 2 && BAYAR > 0 ? '#ffd700' : '#fff', '800', 'right');
      }
    } else if (panel === 1) {
      teks('3 SIMBOL SAMA  =  taruhan ×', x, y0 + 18 - gulir * 6, 13, '#00f3ff', '800');
      for (i = 0; i < SIMBOL.length; i++) {
        var yy2 = y0 + 42 + i * 22 - gulir * 6;
        if (yy2 < y0 - 6 || yy2 > H - 10) continue;
        teks(SIMBOL[i] + SIMBOL[i] + SIMBOL[i], x, yy2, 15, '#fff', '700');
        teks('×' + BAYAR3[i] + (i === 6 ? '  JACKPOT' : ''), x + w, yy2, 15, i === 6 ? '#ffd700' : '#00ff87', '900', 'right');
      }
      var yy3 = y0 + 42 + SIMBOL.length * 22 - gulir * 6;
      if (yy3 > y0 && yy3 < H - 10) {
        teks('2 simbol sama', x, yy3, 14, '#fff', '700');
        teks('×' + 1 + ' (balik modal)', x + w, yy3, 14, '#ff8fa3', '800', 'right');
      }
    } else if (panel === 2) {
      if (!RIWAYAT.length) teks('belum ada riwayat putaran', x, y0 + 22 - gulir * 6, 13, '#8f7fc0', '600');
      for (i = 0; i < RIWAYAT.length; i++) {
        var yy4 = y0 + 22 + i * 22 - gulir * 6;
        if (yy4 < y0 - 6 || yy4 > H - 10) continue;
        teks(RIWAYAT[i].s, x, yy4, 14, '#fff', '700');
        teks('bet ' + RIWAYAT[i].b, x + 110, yy4, 12, '#b9a7ff', '600');
        teks((RIWAYAT[i].h >= 0 ? '+' : '') + RIWAYAT[i].h, x + w, yy4, 14, RIWAYAT[i].h > 0 ? '#00ff87' : '#ff8fa3', '900', 'right');
      }
      var yy5 = y0 + 30 + RIWAYAT.length * 22 - gulir * 6;
      if (yy5 > y0 && yy5 < H - 10) teks('Menang terbesar: ' + (STAT.terbaik || 0) + ' 💰', x, yy5, 13, '#ffd700', '800');
    } else {
      var ban = [
        'Uang yang dipakai = uang RPG asli (💰 koin).',
        'Hasil diacak di server, kartu ini hanya menampilkannya.',
        'Putar lagi:  .slot 500   ·   .slot all   ·   .slot min',
        'Tabel hadiah & statistik:  .slotinfo',
        'Versi chip (tanpa uang):  .slotchip',
        'Cari koin: .tambang .tebang .mancing .berburu .battle',
        'Luck naik dari rumah, dekorasi, permata, relik & buff.'
      ];
      for (i = 0; i < ban.length; i++) {
        var yy6 = y0 + 20 + i * 22 - gulir * 6;
        if (yy6 < y0 - 6 || yy6 > H - 10) continue;
        teks('• ' + ban[i], x, yy6, 13, i < 2 ? '#ffd700' : '#d7ccff', '600');
      }
    }
    ctx.restore();
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#150b2e'); bg.addColorStop(1, '#2b1354');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.14; ctx.fillStyle = '#ffd700';
    for (var i = 0; i < 18; i++) ctx.fillRect((i * 41 + runT * 0.7) % W, 8, 4, 4);
    ctx.globalAlpha = 1;

    teks('💰 UANG RPG' + (NAMA ? ' — ' + NAMA : ''), 20, 34, 17, '#ffd700', '900');
    teks('SALDO ' + SALDO_AKHIR, 20, 58, 15, '#00f3ff', '800');
    teks('TARUHAN ' + BET, W - 20, 34, 15, '#ff8fa3', '800', 'right');
    teks('LUCK ×' + LUCK.toFixed(2), W - 20, 58, 13, '#00ff87', '700', 'right');
    teks('🍒×6  🍋×10  🍇×16  🔔×25  ⭐×45  💎×90  7️⃣×250   ·   2 sama = balik modal', W / 2, 84, 11.5, '#c9b6ff', '600', 'center');

    /* --- mesin --- */
    var mw = STRIDE * 3 + 24;
    ctx.fillStyle = '#0c0720';
    bulat(OX - 18, OY - 18, mw, ROW * 3 + 36, 16); ctx.fill();
    ctx.strokeStyle = flash > 0 && Math.floor(runT / 4) % 2 === 0 ? '#ffd700' : (JACKPOT && fase === 'hasil' ? '#ffd700' : '#7b2ff7');
    ctx.lineWidth = 5; ctx.stroke();

    for (var r = 0; r < 3; r++) {
      for (var v = -1; v <= 1; v++) {
        var base = Math.floor(pos[r]) + v + 1;
        var idx = ((base % N) + N) % N;
        var frac = pos[r] - Math.floor(pos[r]);
        var x = OX + r * STRIDE, y = OY + (v + 1) * ROW - frac * ROW;
        if (y < OY - ROW || y > OY + ROW * 3) continue;
        ctx.save();
        bulat(OX - 10, OY - 10, mw - 16, ROW * 3 + 20, 10); ctx.clip();
        kartuSimbol(x, y, KARTU, ROW - 8, SIMBOL[strip[r] ? strip[r][idx] : 0], v === 0 && flash > 0);
        ctx.restore();
      }
    }
    ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(OX - 22, OY + ROW * 1.5); ctx.lineTo(OX + mw - 2, OY + ROW * 1.5); ctx.stroke();

    /* --- banner hasil --- */
    var by = OY + ROW * 3 + 34;
    if (fase === 'putar' || fase === 'siap') {
      teks('GULUNGAN BERPUTAR' + '.'.repeat(1 + Math.floor(runT / 12) % 3), W / 2, by, 20, '#00f3ff', '900', 'center');
    } else if (BAYAR > 0) {
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 16;
      teks(JACKPOT ? '🎉 JACKPOT! +' + BAYAR + ' 💰' : 'MENANG +' + BAYAR + ' 💰  (×' + KALI + ')', W / 2, by, JACKPOT ? 26 : 23, '#ffd700', '900', 'center');
      ctx.shadowBlur = 0;
      teks('saldo ' + SALDO_AWAL + ' → ' + SALDO_AKHIR + ' 💰   ·   +' + EXP + ' EXP', W / 2, by + 24, 13, '#d7ccff', '700', 'center');
    } else {
      teks('BELUM BERUNTUNG  −' + BET + ' 💰', W / 2, by, 22, '#ff8fa3', '900', 'center');
      teks('saldo ' + SALDO_AWAL + ' → ' + SALDO_AKHIR + ' 💰   ·   +' + EXP + ' EXP', W / 2, by + 24, 13, '#d7ccff', '700', 'center');
    }

    /* --- panel --- */
    var py = by + 52;
    ctx.fillStyle = '#100a24';
    bulat(14, py, W - 28, H - py - 12, 12); ctx.fill();
    ctx.strokeStyle = '#4b3b8f'; ctx.lineWidth = 2; ctx.stroke();
    for (var t = 0; t < PANEL.length; t++) {
      var tx2 = 26 + t * ((W - 52) / PANEL.length);
      teks((t === panel ? '▸ ' : '') + PANEL[t], tx2, py + 18, 12, t === panel ? '#ffd700' : '#8f7fc0', '800');
    }
    ctx.strokeStyle = '#2c2050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, py + 26); ctx.lineTo(W - 20, py + 26); ctx.stroke();
    panelIsi(py + 30);

    part.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, q.a); ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min(3, Math.max(0.1, (t - last) / 16.67));
    last = t;
    update(dt);
    draw();
  }

  function gantiPanel (d) {
    panel = (panel + d + PANEL.length) % PANEL.length;
    gulir = 0; idle = 0;
    A.SFX.point();
    hud();
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (k === 'ArrowLeft' || k === 'KeyA') gantiPanel(-1);
    else if (k === 'ArrowRight' || k === 'KeyD') gantiPanel(1);
    else if (k === 'ArrowUp' || k === 'KeyW') { gulir = Math.max(0, gulir - 1); A.SFX.point(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { gulir = Math.min(12, gulir + 1); A.SFX.point(); }
    else if (k === 'Space' || k === 'Enter') { if (fase !== 'putar') { A.SFX.jump(); mulaiPutar(); } }
  });

  function sentuh (e) {
    A.initAudio(); idle = 0;
    var px = null, py = null;
    try {
      var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = c.getBoundingClientRect();
      px = (t.clientX - r.left) * (W / r.width); py = (t.clientY - r.top) * (H / r.height);
    } catch (err) { px = null; }
    if (px === null) { if (fase !== 'putar') mulaiPutar(); return; }
    if (py > OY - 20 && py < OY + ROW * 3 + 20) { if (fase !== 'putar') mulaiPutar(); return; }
    gantiPanel(px < W / 2 ? -1 : 1);
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  strip = [acakStrip(), acakStrip(), acakStrip()];
  for (var q = 0; q < 3; q++) { pos[q] = 0; cariIndeks(q, HASIL[q]); }
  hud(); A.setBest();
  A.debug = { SIMBOL: SIMBOL, BAYAR3: BAYAR3, PANEL: PANEL, D: D, tengah: tengah, mulaiPutar: mulaiPutar };
  requestAnimationFrame(loop);
`

/**
 * Kartu HTML app slot RPG: gulungan berputar lalu berhenti persis di `data.hasil`.
 * @param {string} brand nama bot
 * @param {object} data hasil putaran dari server
 */
export function slotRpgHtml (brand = 'THERYHANN!', data = {}) {
  const aman = {
    bet: Math.max(0, Math.floor(data.bet || 0)),
    hasil: Array.isArray(data.hasil) && data.hasil.length === 3 ? data.hasil.map(x => Math.max(0, Math.min(SIMBOL.length - 1, Math.floor(x) || 0))) : [0, 1, 2],
    kali: Math.max(0, Math.floor(data.kali || 0)),
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    jackpot: !!data.jackpot,
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number((Number(data.luck) || 1).toFixed(2)),
    bonusKoin: Number((Number(data.bonusKoin) || 1).toFixed(2)),
    nama: String(data.nama || '').slice(0, 18),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(x => ({
      s: String(x.s || '???').slice(0, 6), b: Math.floor(x.b || 0), h: Math.floor(x.h || 0)
    })),
    stat: {
      putar: Math.floor(data.stat?.putar || 0), menang: Math.floor(data.stat?.menang || 0),
      jackpot: Math.floor(data.stat?.jackpot || 0), terbaik: Math.floor(data.stat?.terbaik || 0)
    }
  }
  const js = '  var __SLOTDATA = ' + JSON.stringify(aman) + ';\n' + SLOT_RPG_JS
  return shell('Slot Mesin RPG', brand, js, {
    w: 600, h: 640, maxw: 600, sub: 'CASINO',
    hint: '◀▶ panel · ▲▼ gulir · ● putar ulang animasi'
  })
}

/** teks ringkas hasil putaran (fallback kalau client tidak mendukung HTML app) */
export function slotTeks (d) {
  const simbol = d.hasil.map(i => SIMBOL[i]).join(' ')
  const kepala = d.jackpot
    ? `🎉 *JACKPOT 7️⃣7️⃣7️⃣!* +${fmtKoin(d.bayar)} 💰`
    : d.bayar > 0 ? `✨ *MENANG ×${d.kali}* +${fmtKoin(d.bayar)} 💰` : `💨 *Belum beruntung* −${fmtKoin(d.bet)} 💰`
  return (
    `🎰 *SLOT MESIN RPG*\n\n` +
    `┌─┈┈┈┈┈┈┈┈┈┈┐\n` +
    `   ${simbol}\n` +
    `└─┈┈┈┈┈┈┈┈┈┈┘\n\n` +
    `${kepala}\n\n` +
    `▸ Taruhan: ${fmtKoin(d.bet)} 💰\n` +
    `▸ Pembayaran: ${d.bayar > 0 ? fmtKoin(d.bayar) + ' 💰' : '0 💰'}${d.bonusKoin > 1 ? ` (bonus koin ×${d.bonusKoin.toFixed(2)})` : ''}\n` +
    `▸ Saldo: ${fmtKoin(d.saldoAwal)} → *${fmtKoin(d.saldoAkhir)}* 💰\n` +
    `▸ EXP: +${d.exp} ✨ · Luck: ×${Number(d.luck).toFixed(2)}\n\n` +
    `Putar lagi: \`.slot ${d.bet}\` · \`.slot all\`\n` +
    `Tabel hadiah: \`.slotinfo\` · Versi chip: \`.slotchip\``
  )
}

export default {
  SIMBOL, NAMA_SIMBOL, BOBOT, BAYAR3, BAYAR2, MIN_BET, MAX_BET, DEFAULT_BET, TANGGA_BET,
  bobotLuck, putarSlot, hitungBayar, peluang, simulasi, parseAngka, parseBet, betBerikutnya,
  siapkanSlot, catatSlot, slotRpgHtml, slotTeks, fmtKoin
}
