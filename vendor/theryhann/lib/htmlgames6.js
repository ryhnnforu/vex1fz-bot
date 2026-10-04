/**
 * ============================================================
 *  lib/htmlgames6.js — 🎰 CASINO ARCADE (v7.4, sistem HTML app)
 * ------------------------------------------------------------
 *  4 game kasino yang jalan sebagai APLIKASI HTML di dalam chat,
 *  memakai shell arcade yang sama persis dengan 19 game lainnya
 *  (canvas + D-pad ▲▼◀▶ + ● + WebAudio + best score localStorage).
 *
 *    • Casino Slot      560×520  — 3 gulungan berputar (easing), paytable, auto-spin
 *    • Poker 5-Card     600×700  — 5-card draw vs CPU, tahan kartu, jam 30 detik
 *    • Crash / Aviator  700×480  — kurva pengali real-time, cash out, auto target
 *    • Baccarat         600×560  — Player/Banker/Tie, aturan kartu ketiga
 *
 *  Chip tiap pemain disimpan di localStorage perangkatnya sendiri
 *  (game HTML berjalan di sisi klien, tidak bisa menyentuh server),
 *  jadi kasino ini murni untuk seru-seruan — bukan judi uang asli.
 *
 *  Tiap game mengekspos `A.state` (untuk autopilot test) dan
 *  `A.debug` (fungsi murni: peringkat poker, nilai baccarat, RNG crash).
 * ============================================================
 */
import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  1. 🎰 CASINO SLOT — 560×520                                        */
/* ------------------------------------------------------------------ */
const SLOT_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var SIMBOL = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '💎'];
  var BOBOT = [30, 24, 18, 14, 9, 5];
  var BAYAR3 = [4, 6, 10, 20, 50, 150];   // RTP total ~84% (chip pelan-pelan habis = ada GAME OVER)
  var BETS = [50, 100, 250, 500, 1000, 2500];
  var N = 24, ROW = 96, OX = 60, OY = 130;

  function stripBaru () {
    var tot = 0, i;
    for (i = 0; i < BOBOT.length; i++) tot += BOBOT[i];
    var s = [];
    while (s.length < N) {
      var r = Math.random() * tot;
      for (i = 0; i < BOBOT.length; i++) { r -= BOBOT[i]; if (r <= 0) break; }
      if (i >= BOBOT.length) i = 0;
      s.push(i);
    }
    return s;
  }
  function pilihSimbol () {
    var tot = 0, i;
    for (i = 0; i < BOBOT.length; i++) tot += BOBOT[i];
    var r = Math.random() * tot;
    for (i = 0; i < BOBOT.length; i++) { r -= BOBOT[i]; if (r <= 0) return i; }
    return 0;
  }

  var strip = [stripBaru(), stripBaru(), stripBaru()];
  var pos = [0, 0, 0], target = [0, 0, 0], berhenti = [true, true, true];
  var chips = 2000, betIdx = 0, hasil = [0, 0, 0];
  var spinning = false, win = 0, flash = 0, gameOver = false, runT = 0;
  var pesan = '', autoSpin = false, part = [], spinCount = 0, totalMenang = 0, puncak = 1000;
  var kunci = {}, idle = 0, IDLE = 1080;   // 18 detik tanpa putaran = meja ditutup

  try { var s0 = localStorage.getItem('arc_chips_slot'); if (s0) chips = Math.max(0, parseInt(s0, 10) || 1000); } catch (e) {}
  function simpanChips () { try { localStorage.setItem('arc_chips_slot', String(Math.floor(chips))); } catch (e) {} }
  function bet () { return BETS[betIdx]; }

  function reset () {
    chips = 2000; betIdx = 0; pos = [0, 0, 0]; target = [0, 0, 0]; berhenti = [true, true, true];
    spinning = false; win = 0; flash = 0; gameOver = false; pesan = 'Tekan ● untuk MEMUTAR'; autoSpin = false;
    part = []; spinCount = 0; totalMenang = 0; puncak = 1000; idle = 0;
    strip = [stripBaru(), stripBaru(), stripBaru()];
    hasil = [strip[0][1], strip[1][1], strip[2][1]];
    simpanChips();
    A.setScore(chips); A.setBest(); A.setProgress(0);
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setHint('◀▶ ganti taruhan · ▲ taruhan max · ▼ auto-spin · ● PUTAR');
  }

  function cariIndeks (reel, simbol) {
    for (var i = 0; i < N; i++) if (strip[reel][i] === simbol) return i;
    strip[reel][0] = simbol; return 0;
  }

  function putar () {
    if (spinning || gameOver) return;
    if (chips < bet()) { tamat(); return; }
    chips -= bet(); simpanChips(); idle = 0;
    spinCount++; win = 0; flash = 0; pesan = ''; spinning = true;
    hasil = [pilihSimbol(), pilihSimbol(), pilihSimbol()];
    for (var i = 0; i < 3; i++) {
      var j = cariIndeks(i, hasil[i]);
      var base = Math.floor(pos[i]);
      var perlu = ((j - 1 - base) % N + N) % N;
      target[i] = base + (12 + i * 5) * N + perlu;
      berhenti[i] = false;
    }
    A.SFX.jump();
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setScore(chips);
  }

  function tamat () { tutupMeja('CHIP HABIS — ' + spinCount + ' putaran'); }

  function ledakan (x, y, warna, n) {
    for (var i = 0; i < n; i++) {
      part.push({ x: x, y: y, vx: A.rand(-4, 4), vy: A.rand(-6, 1), r: A.rand(2, 5), a: 1, w: warna });
    }
  }

  function evaluasi () {
    var b = bet(), kali = 0, ket = '';
    if (hasil[0] === hasil[1] && hasil[1] === hasil[2]) { kali = BAYAR3[hasil[0]]; ket = SIMBOL[hasil[0]] + SIMBOL[hasil[0]] + SIMBOL[hasil[0]] + '  ×' + kali; }
    else if (hasil[0] === hasil[1] || hasil[1] === hasil[2] || hasil[0] === hasil[2]) { kali = 1; ket = '2 sama  balik modal'; }
    win = b * kali;
    if (win > 0) {
      chips += win; totalMenang += win; idle = 0; simpanChips();
      pesan = 'MENANG ' + win + '  (' + ket + ')';
      flash = 60;
      A.SFX.level();
      ledakan(W / 2, OY + ROW, '#ffd700', kali >= 40 ? 46 : 22);
      if (chips > puncak) puncak = chips;
      if (chips > A.best) { A.best = chips; A.saveBest(chips); A.setBest(); }
    } else {
      pesan = 'belum beruntung  (-' + b + ')';
      A.SFX.crash();
    }
    A.setScore(chips);
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setProgress(Math.min(1, chips / 10000));
  }

  function tutupMeja (sebab) {
    if (gameOver) return;
    gameOver = true; autoSpin = false; spinning = false;
    pesan = sebab;
    A.SFX.crash();
    if (chips > A.best) { A.best = chips; A.saveBest(chips); }
    A.setBest();
  }
  function update (dt) {
    runT += dt;
    if (!spinning && !gameOver && !autoSpin) { idle += dt; if (idle > IDLE) tutupMeja('MEJA DITUTUP — AFK ' + Math.round(IDLE / 60) + ' detik'); }
    if (spinning) {
      var semua = true;
      for (var i = 0; i < 3; i++) {
        if (berhenti[i]) continue;
        var sisa = target[i] - pos[i];
        var sp = Math.max(0.06, 0.12 + sisa * 0.045) * dt;
        if (sisa <= sp) { pos[i] = target[i]; berhenti[i] = true; A.SFX.point(); }
        else { pos[i] += sp; semua = false; }
      }
      A.setProgress(1 - (target[2] - pos[2]) / (12 * N));
      if (semua) { spinning = false; idle = 0; evaluasi(); }
    }
    if (flash > 0) flash -= dt;
    for (var p = part.length - 1; p >= 0; p--) {
      var q = part[p];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.22 * dt; q.a -= 0.014 * dt;
      if (q.a <= 0) part.splice(p, 1);
    }
    if (autoSpin && !spinning && !gameOver) {
      if (chips < bet()) tamat();
      else putar();
    }
    if (!gameOver && chips < BETS[0] && !spinning) tutupMeja('CHIP HABIS — ' + spinCount + ' putaran');
  }

  function kartu (x, y, w, h, isi, sorot) {
    ctx.fillStyle = sorot ? '#2a1b4d' : '#151029';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = sorot ? '#ffd700' : '#4b3b8f';
    ctx.lineWidth = sorot ? 4 : 2;
    ctx.strokeRect(x, y, w, h);
    ctx.font = '52px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(isi, x + w / 2, y + h / 2);
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#120a26'); bg.addColorStop(1, '#25124a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffd700';
    for (var i = 0; i < 16; i++) {
      var bx = (i * 37 + runT * 0.6) % W;
      ctx.fillRect(bx, 6, 4, 4);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#0b0718'; ctx.fillRect(OX - 14, OY - 14, 3 * 150 + 28, ROW * 3 + 28);
    ctx.strokeStyle = flash > 0 && Math.floor(runT / 4) % 2 === 0 ? '#ffd700' : '#7b2ff7';
    ctx.lineWidth = 5; ctx.strokeRect(OX - 14, OY - 14, 3 * 150 + 28, ROW * 3 + 28);

    for (var r = 0; r < 3; r++) {
      for (var v = -1; v <= 1; v++) {
        var base = Math.floor(pos[r]) + v + 1;
        var idx = ((base % N) + N) % N;
        var frac = pos[r] - Math.floor(pos[r]);
        var x = OX + r * 150, y = OY + (v + 1) * ROW - frac * ROW;
        if (y < OY - ROW || y > OY + ROW * 3) continue;
        ctx.save();
        ctx.beginPath(); ctx.rect(OX - 8, OY - 8, 3 * 150 + 16, ROW * 3 + 16); ctx.clip();
        kartu(x, y, 140, ROW - 8, SIMBOL[strip[r][idx]], v === 0 && flash > 0);
        ctx.restore();
      }
    }

    ctx.strokeStyle = '#ff007f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(OX - 18, OY + ROW * 1.5); ctx.lineTo(OX + 468, OY + ROW * 1.5); ctx.stroke();

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffd700'; ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.fillText('CHIP ' + chips, 20, 40);
    ctx.fillStyle = '#00f3ff'; ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillText('TARUHAN ' + bet(), 20, 68);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9d4edd'; ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText('PUTARAN ' + spinCount, W - 20, 40);
    ctx.fillStyle = '#00ff87'; ctx.fillText('TOTAL MENANG ' + totalMenang, W - 20, 64);
    if (autoSpin) { ctx.fillStyle = '#ff007f'; ctx.fillText('AUTO-SPIN AKTIF', W - 20, 88); }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9b6ff'; ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillText('🍒×4  🍋×6  🔔×10  ⭐×20  7️⃣×50  💎×150   ·   2 sama = balik modal', W / 2, 106);

    if (pesan) {
      ctx.fillStyle = win > 0 ? '#ffd700' : '#ff8fa3';
      ctx.font = '900 26px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, OY + ROW * 3 + 52);
    }
    if (spinning) {
      ctx.fillStyle = '#00f3ff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('GULUNGAN BERPUTAR' + '.'.repeat(1 + Math.floor(runT / 12) % 3), W / 2, OY + ROW * 3 + 82);
    }

    part.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, q.a); ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(8,4,20,0.82)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 40px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 34);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 4);
      ctx.fillText(spinCount + ' PUTARAN · TOTAL MENANG ' + totalMenang, W / 2, H / 2 + 22);
      ctx.fillText('PUNCAK CHIP ' + puncak, W / 2, H / 2 + 48);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI (2000 CHIP)', W / 2, H / 2 + 78);
    }
  }

  function ubahBet (d) {
    idle = 0;
    if (spinning) return;
    betIdx = Math.max(0, Math.min(BETS.length - 1, betIdx + d));
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setHint('Taruhan ' + bet() + ' chip');
  }
  function aksi () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    if (spinning) return;
    putar();
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { chips: chips, bet: bet(), hasil: hasil, spinning: spinning, win: win, over: gameOver, auto: autoSpin, spinCount: spinCount, totalMenang: totalMenang, idle: Math.round(idle), sebab: pesan };
    requestAnimationFrame(loop);
  }

  function setKey (k, v) {
    kunci[k] = v;
    if (k === 'ArrowLeft' || k === 'KeyA') { if (v) ubahBet(-1); }
    else if (k === 'ArrowRight' || k === 'KeyD') { if (v) ubahBet(1); }
    else if (k === 'ArrowUp' || k === 'KeyW') { if (v) { betIdx = BETS.length - 1; A.setStatus('Chip ' + chips, 'Bet ' + bet()); } }
    else if (k === 'ArrowDown' || k === 'KeyS') { if (v) { idle = 0; autoSpin = !autoSpin; A.setHint(autoSpin ? 'AUTO-SPIN NYALA' : 'AUTO-SPIN MATI'); } }
    else if (k === 'Space' || k === 'Enter') { if (v) aksi(); }
  }
  window.addEventListener('keydown', function (e) { A.initAudio(); setKey(e.code, true); if (e.preventDefault) e.preventDefault(); });
  window.addEventListener('keyup', function (e) { setKey(e.code, false); });
  c.addEventListener('touchstart', function (e) { A.initAudio(); aksi(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); aksi(); });

  A.debug = { BAYAR3: BAYAR3, BOBOT: BOBOT, SIMBOL: SIMBOL, pilihSimbol: pilihSimbol, evaluasiKali: function (h) { if (h[0] === h[1] && h[1] === h[2]) return BAYAR3[h[0]]; if (h[0] === h[1] || h[1] === h[2] || h[0] === h[2]) return 1; return 0; } };
  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  2. 🃏 POKER 5-CARD DRAW — 600×700                                  */
/* ------------------------------------------------------------------ */
const POKER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var RANK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var SUIT = ['♠', '♥', '♦', '♣'];
  var NAMA = ['HIGH CARD', 'ONE PAIR', 'TWO PAIR', 'THREE OF A KIND', 'STRAIGHT', 'FLUSH', 'FULL HOUSE', 'FOUR OF A KIND', 'STRAIGHT FLUSH', 'ROYAL FLUSH'];

  function dekBaru () {
    var d = [], i, j;
    for (i = 0; i < 4; i++) for (j = 0; j < 13; j++) d.push({ s: i, r: j });
    for (i = d.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
    return d;
  }
  function nilai (kartu) {
    var ranks = kartu.map(function (k) { return k.r + 2; }).sort(function (a, b) { return b - a; });
    var flush = kartu.every(function (k) { return k.s === kartu[0].s; });
    var uniq = ranks.filter(function (v, i) { return ranks.indexOf(v) === i; });
    var straight = false, tinggi = ranks[0];
    if (uniq.length === 5) {
      if (uniq[0] - uniq[4] === 4) straight = true;
      else if (uniq[0] === 14 && uniq[1] === 5) { straight = true; tinggi = 5; }
    }
    var hit = {};
    ranks.forEach(function (r) { hit[r] = (hit[r] || 0) + 1; });
    var grup = Object.keys(hit).map(function (r) { return { r: Number(r), n: hit[r] }; })
      .sort(function (a, b) { return b.n - a.n || b.r - a.r; });
    var sisa = grup.filter(function (g) { return g.n === 1; }).map(function (g) { return g.r; });
    var kat, tb;
    if (straight && flush && tinggi === 14) { kat = 9; tb = [14]; }
    else if (straight && flush) { kat = 8; tb = [tinggi]; }
    else if (grup[0].n === 4) { kat = 7; tb = [grup[0].r].concat(sisa); }
    else if (grup[0].n === 3 && grup[1] && grup[1].n === 2) { kat = 6; tb = [grup[0].r, grup[1].r]; }
    else if (flush) { kat = 5; tb = ranks; }
    else if (straight) { kat = 4; tb = [tinggi]; }
    else if (grup[0].n === 3) { kat = 3; tb = [grup[0].r].concat(sisa); }
    else if (grup[0].n === 2 && grup[1] && grup[1].n === 2) { kat = 2; tb = [grup[0].r, grup[1].r].concat(sisa); }
    else if (grup[0].n === 2) { kat = 1; tb = [grup[0].r].concat(sisa); }
    else { kat = 0; tb = ranks; }
    return { kat: kat, nama: NAMA[kat], tb: tb };
  }
  function banding (x, y) {
    if (x.kat !== y.kat) return x.kat - y.kat;
    for (var i = 0; i < Math.max(x.tb.length, y.tb.length); i++) {
      var d = (x.tb[i] || 0) - (y.tb[i] || 0);
      if (d) return d;
    }
    return 0;
  }
  /** AI CPU: tahan pair / three / kartu tinggi, buru flush kalau 4 sewarna */
  function cpuTahan (kartu) {
    var v = nilai(kartu), th = [false, false, false, false, false], i;
    if (v.kat >= 4) return [true, true, true, true, true];
    var hit = {};
    kartu.forEach(function (k) { hit[k.r] = (hit[k.r] || 0) + 1; });
    for (i = 0; i < 5; i++) {
      if (hit[kartu[i].r] >= 2) th[i] = true;
      else if (kartu[i].r >= 10) th[i] = true;
      else if (kartu[i].r === 0 && Math.random() < 0.5) th[i] = true;
    }
    for (i = 0; i < 4; i++) {
      var idx = [];
      for (var j = 0; j < 5; j++) if (kartu[j].s === i) idx.push(j);
      if (idx.length === 4) idx.forEach(function (k) { th[k] = true; });
    }
    return th;
  }

  var chips = 2000, ante = 100, fase = 'bet', kursor = 0, tahan = [false, false, false, false, false];
  var tangan = [], cpu = [], dek = [], pot = 0, pesan = '', timer = 1800, runT = 0, gameOver = false, idle = 0, IDLE = 900;
  var ronde = 0, menangRonde = 0, kalahRonde = 0, hasilCPU = null, hasilKu = null, kunci = {}, anim = 0;
  var ANTES = [50, 100, 250, 500, 1000];
  var anteIdx = 1;

  try { var s0 = localStorage.getItem('arc_chips_poker'); if (s0) chips = Math.max(0, parseInt(s0, 10) || 1000); } catch (e) {}
  function simpan () { try { localStorage.setItem('arc_chips_poker', String(Math.floor(chips))); } catch (e) {} }

  function reset () {
    idle = 0;
    chips = 2000; anteIdx = 1; ante = ANTES[1]; fase = 'bet'; ronde = 0; menangRonde = 0; kalahRonde = 0;
    pesan = '▲▼ pilih ante, ● DEAL'; gameOver = false; pot = 0; tangan = []; cpu = []; kursor = 0;
    tahan = [false, false, false, false, false]; hasilCPU = null; hasilKu = null; timer = 1800;
    simpan();
    A.setScore(chips); A.setBest(); A.setProgress(1);
    A.setStatus('Chip ' + chips, 'Ante ' + ante);
    A.setHint('▲▼ ante · ● deal · ◀▶ pilih kartu · ● tahan · ▲ tukar');
  }

  function deal () {
    idle = 0;
    if (chips < ante * 2) { tamat(); return; }
    chips -= ante; simpan();
    dek = dekBaru();
    tangan = dek.slice(0, 5); cpu = dek.slice(5, 10); dek = dek.slice(10);
    pot = ante * 2; ronde++;
    tahan = [false, false, false, false, false];
    kursor = 0; fase = 'pilih'; timer = 1800; pesan = 'Tahan kartu, lalu ▲ TUKAR';
    hasilKu = nilai(tangan); anim = 20;
    A.SFX.point();
    A.setScore(chips); A.setStatus('Chip ' + chips, 'Pot ' + pot);
  }

  function tukar () {
    var i, ambil = 0;
    for (i = 0; i < 5; i++) if (!tahan[i]) { tangan[i] = dek[ambil++]; }
    dek = dek.slice(ambil);
    var th = cpuTahan(cpu), a2 = 0;
    for (i = 0; i < 5; i++) if (!th[i]) { cpu[i] = dek[a2++]; }
    dek = dek.slice(a2);
    hasilKu = nilai(tangan); hasilCPU = nilai(cpu);
    var d = banding(hasilKu, hasilCPU);
    if (d > 0) { chips += pot; menangRonde++; pesan = 'MENANG ' + pot + ' — ' + hasilKu.nama; A.SFX.level(); }
    else if (d < 0) { kalahRonde++; pesan = 'KALAH — CPU: ' + hasilCPU.nama; A.SFX.crash(); }
    else { chips += ante; pesan = 'SERI — ante dikembalikan'; A.SFX.point(); }
    simpan();
    fase = 'hasil'; timer = 2400;
    if (chips > A.best) { A.best = chips; A.saveBest(chips); A.setBest(); }
    A.setScore(chips); A.setProgress(Math.min(1, chips / 5000));
  }

  function tamat (sebab) { gameOver = true; fase = 'over'; pesan = sebab || 'CHIP HABIS — ' + ronde + ' ronde'; A.SFX.crash(); if (chips > A.best) { A.best = chips; A.saveBest(chips); } A.setBest(); }

  function aksi () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    if (fase === 'bet') deal();
    else if (fase === 'pilih') { tahan[kursor] = !tahan[kursor]; A.SFX.point(); }
    else if (fase === 'hasil') { fase = 'bet'; pesan = '▲▼ ante, ● DEAL'; timer = 1800; }
  }
  function konfirmasi () {
    if (gameOver) { reset(); return; }
    if (fase === 'pilih') tukar();
    else if (fase === 'bet') deal();
    else if (fase === 'hasil') { fase = 'bet'; pesan = '▲▼ ante, ● DEAL'; }
  }

  function update (dt) {
    runT += dt;
    if (!gameOver && fase === 'bet') { idle += dt; if (idle > IDLE) { tamat('MEJA DITUTUP — AFK ' + Math.round(IDLE / 60) + ' detik'); return; } }
    if (anim > 0) anim -= dt;
    if (!gameOver && (fase === 'pilih' || fase === 'hasil')) {
      timer -= dt;
      if (timer <= 0) { if (fase === 'pilih') tukar(); else { fase = 'bet'; pesan = '▲▼ ante, ● DEAL'; timer = 1800; } }
    }
    if (!gameOver && chips < ANTES[0] * 2 && fase === 'bet') tamat('CHIP HABIS — ' + ronde + ' ronde');
  }

  function gambarKartu (x, y, w, h, kart, balik, sorot, hold) {
    ctx.save();
    if (sorot) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 16; }
    ctx.fillStyle = balik ? '#7b2ff7' : '#fdfdfd';
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sorot ? '#ffd700' : '#2a1b4d'; ctx.lineWidth = sorot ? 4 : 2;
    ctx.strokeRect(x, y, w, h);
    if (balik) {
      ctx.fillStyle = '#4b1d9e';
      for (var i = 0; i < 4; i++) for (var j = 0; j < 6; j++) if ((i + j) % 2 === 0) ctx.fillRect(x + 6 + i * 14, y + 6 + j * 14, 10, 10);
    } else if (kart) {
      var merah = kart.s === 1 || kart.s === 2;
      ctx.fillStyle = merah ? '#e63946' : '#14121f';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = '900 22px "Segoe UI", sans-serif';
      ctx.fillText(RANK[kart.r], x + 7, y + 6);
      ctx.font = '24px "Segoe UI Emoji", serif';
      ctx.fillText(SUIT[kart.s], x + 7, y + 30);
      ctx.textAlign = 'center';
      ctx.font = '40px "Segoe UI Emoji", serif';
      ctx.fillText(SUIT[kart.s], x + w / 2, y + h / 2 - 6);
    }
    if (hold) {
      ctx.fillStyle = '#00ff87'; ctx.font = '900 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('HOLD', x + w / 2, y + h + 6);
    }
    ctx.restore();
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04240f'); bg.addColorStop(1, '#0a5c2a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, W - 28, H - 28);

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffd700'; ctx.font = '900 24px "Segoe UI", sans-serif';
    ctx.fillText('CHIP ' + chips, 28, 48);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9ef01a'; ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText('RONDE ' + ronde + '  ·  W ' + menangRonde + ' / L ' + kalahRonde, W - 28, 44);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c8ffe0'; ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText('🤖 CPU' + (hasilCPU && fase === 'hasil' ? ' — ' + hasilCPU.nama : ''), W / 2, 84);
    var cw = 84, ch = 118, gap = 14;
    var x0 = (W - (cw * 5 + gap * 4)) / 2;
    for (var i = 0; i < 5; i++) {
      gambarKartu(x0 + i * (cw + gap), 96, cw, ch, cpu[i], !(fase === 'hasil'), false, false);
    }

    ctx.fillStyle = '#ffd700'; ctx.font = '900 30px "Segoe UI", sans-serif';
    ctx.fillText('POT  ' + pot, W / 2, 268);
    if (fase !== 'bet') {
      ctx.fillStyle = timer < 300 ? '#ff5e5e' : '#c8ffe0'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('⏱ ' + Math.max(0, Math.ceil(timer / 60)) + ' dtk', W / 2, 294);
    }

    if (pesan) {
      ctx.fillStyle = /MENANG/.test(pesan) ? '#ffd700' : /KALAH|HABIS/.test(pesan) ? '#ff8fa3' : '#ffffff';
      ctx.font = '900 22px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, 340);
    }
    if (fase === 'bet') {
      ctx.fillStyle = '#9ef01a'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText('ANTE  ' + ante + '   (▲ naik · ▼ turun)', W / 2, 372);
    }
    if (hasilKu && fase !== 'bet') {
      ctx.fillStyle = '#00f3ff'; ctx.font = '700 17px "Segoe UI", sans-serif';
      ctx.fillText('KOMBINASI: ' + hasilKu.nama, W / 2, 400);
    }

    var py = 430, pw = 96, ph = 136, pg = 14;
    var px0 = (W - (pw * 5 + pg * 4)) / 2;
    for (var j = 0; j < 5; j++) {
      gambarKartu(px0 + j * (pw + pg), py, pw, ph, tangan[j], false, fase === 'pilih' && kursor === j, fase === 'pilih' && tahan[j]);
    }
    if (fase === 'pilih') {
      ctx.fillStyle = '#ffd700'; ctx.font = '900 16px "Segoe UI", sans-serif';
      ctx.fillText('▲', px0 + kursor * (pw + pg) + pw / 2, py - 10);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillText('Royal Flush > Straight Flush > Four > Full House > Flush > Straight > Three > Two Pair > Pair > High', W / 2, 610);

    if (gameOver) {
      ctx.fillStyle = 'rgba(2,20,10,0.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 42px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText(ronde + ' RONDE · MENANG ' + menangRonde + ' · KALAH ' + kalahRonde, W / 2, H / 2 + 6);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI (2000 CHIP)', W / 2, H / 2 + 40);
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { chips: chips, ante: ante, fase: fase, kursor: kursor, tahan: tahan.slice(), pot: pot, over: gameOver, ronde: ronde, menang: menangRonde, timer: timer, tangan: tangan.map(function (k) { return k ? RANK[k.r] + SUIT[k.s] : null; }), cpu: cpu.map(function (k) { return k ? RANK[k.r] + SUIT[k.s] : null; }), hasilKu: hasilKu ? hasilKu.nama : null, hasilCPU: hasilCPU ? hasilCPU.nama : null , idle: Math.round(idle), sebab: pesan };
    requestAnimationFrame(loop);
  }

  function setKey (k, v) {
    if (v) idle = 0;
    kunci[k] = v;
    if (!v) return;
    if (k === 'ArrowLeft' || k === 'KeyA') { if (fase === 'pilih') kursor = (kursor + 4) % 5; else { anteIdx = Math.max(0, anteIdx - 1); ante = ANTES[anteIdx]; A.setStatus('Chip ' + chips, 'Ante ' + ante); } }
    else if (k === 'ArrowRight' || k === 'KeyD') { if (fase === 'pilih') kursor = (kursor + 1) % 5; else { anteIdx = Math.min(ANTES.length - 1, anteIdx + 1); ante = ANTES[anteIdx]; A.setStatus('Chip ' + chips, 'Ante ' + ante); } }
    else if (k === 'ArrowUp' || k === 'KeyW') { if (fase === 'pilih') konfirmasi(); else { anteIdx = Math.min(ANTES.length - 1, anteIdx + 1); ante = ANTES[anteIdx]; A.setStatus('Chip ' + chips, 'Ante ' + ante); } }
    else if (k === 'ArrowDown' || k === 'KeyS') { if (fase === 'bet') { anteIdx = Math.max(0, anteIdx - 1); ante = ANTES[anteIdx]; A.setStatus('Chip ' + chips, 'Ante ' + ante); } }
    else if (k === 'Space' || k === 'Enter') aksi();
  }
  window.addEventListener('keydown', function (e) { A.initAudio(); setKey(e.code, true); if (e.preventDefault) e.preventDefault(); });
  window.addEventListener('keyup', function (e) { kunci[e.code] = false; });
  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); if (e.preventDefault) e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    if (ty > 420 && ty < 600 && fase === 'pilih') {
      var pw = 96, pg = 14, px0 = (W - (pw * 5 + pg * 4)) / 2;
      var idx = Math.floor((tx - px0) / (pw + pg));
      if (idx >= 0 && idx < 5) { kursor = idx; tahan[idx] = !tahan[idx]; A.SFX.point(); }
    } else aksi();
    if (e.preventDefault) e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });

  A.debug = { nilai: nilai, banding: banding, cpuTahan: cpuTahan, dekBaru: dekBaru, NAMA: NAMA, RANK: RANK, SUIT: SUIT };
  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  3. 🚀 CRASH / AVIATOR — 700×480                                    */
/* ------------------------------------------------------------------ */
const CRASH_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var BETS = [50, 100, 250, 500, 1000, 2500];
  var AUTO = [0, 1.5, 2, 3, 5, 10];

  function titikCrash () {
    var r = Math.random();
    var v = 0.97 / (1 - r);
    return Math.min(30, Math.max(1, Math.floor(v * 100) / 100));
  }

  var chips = 2000, betIdx = 1, autoIdx = 0;
  var fase = 'bet', pengali = 1, titik = 0, kurva = [], waktu = 0;
  var riwayat = [], pesan = '', runT = 0, gameOver = false, idle = 0, IDLE = 900, part = [];
  var ronde = 0, totalMenang = 0, kunci = {};
  var OX = 70, OY = H - 70, GW = W - 110, GH = H - 150;

  try { var s0 = localStorage.getItem('arc_chips_crash'); if (s0) chips = Math.max(0, parseInt(s0, 10) || 1000); } catch (e) {}
  function simpan () { try { localStorage.setItem('arc_chips_crash', String(Math.floor(chips))); } catch (e) {} }
  function bet () { return BETS[betIdx]; }

  function reset () {
    idle = 0;
    chips = 2000; betIdx = 1; autoIdx = 0; fase = 'bet'; pengali = 1; titik = 0; kurva = [];
    riwayat = []; pesan = '▲▼ taruhan · ● LUNCUR'; ronde = 0; totalMenang = 0; gameOver = false; part = []; waktu = 0;
    simpan();
    A.setScore(chips); A.setBest(); A.setProgress(0);
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setHint('▲▼ taruhan · ▼ auto cash-out · ● LUNCUR / CASH OUT');
  }

  function luncur () {
    idle = 0;
    if (chips < bet()) { tamat(); return; }
    chips -= bet(); simpan(); ronde++;
    titik = titikCrash(); pengali = 1; waktu = 0; kurva = [{ x: 0, y: 1 }];
    fase = 'fly'; pesan = '';
    A.SFX.jump();
    A.setScore(chips); A.setStatus('Chip ' + chips, 'Bet ' + bet());
  }
  function cashOut (otomatis) {
    if (fase !== 'fly') return;
    var menang = Math.floor(bet() * pengali);
    chips += menang; totalMenang += menang; simpan();
    riwayat.unshift({ v: pengali, cash: true });
    if (riwayat.length > 12) riwayat.pop();
    pesan = (otomatis ? 'AUTO CASH OUT ' : 'CASH OUT ') + pengali.toFixed(2) + '×  +' + menang;
    fase = 'selesai';
    A.SFX.level();
    for (var i = 0; i < 26; i++) part.push({ x: A.rand(0, W), y: A.rand(H * 0.3, H), vx: A.rand(-2, 2), vy: A.rand(-5, -1), r: A.rand(2, 5), a: 1, w: '#00ff87' });
    if (chips > A.best) { A.best = chips; A.saveBest(chips); A.setBest(); }
    A.setScore(chips); A.setProgress(Math.min(1, pengali / 10));
  }
  function meledak () {
    fase = 'crash';
    riwayat.unshift({ v: titik, cash: false });
    if (riwayat.length > 12) riwayat.pop();
    pesan = '💥 MELEDAK di ' + titik.toFixed(2) + '×  (-' + bet() + ')';
    A.SFX.crash();
    for (var i = 0; i < 34; i++) part.push({ x: posisiX(), y: posisiY(), vx: A.rand(-6, 6), vy: A.rand(-6, 3), r: A.rand(2, 6), a: 1, w: i % 2 ? '#ff5e00' : '#ffd700' });
    if (chips < BETS[0]) tamat('CHIP HABIS — ' + ronde + ' ronde');
  }
  function tamat (sebab) { gameOver = true; fase = 'over'; pesan = sebab || 'CHIP HABIS — ' + ronde + ' ronde'; A.SFX.crash(); if (chips > A.best) { A.best = chips; A.saveBest(chips); } A.setBest(); }

  function posisiX () { return OX + Math.min(1, waktu / 12) * GW; }
  function posisiY () { return OY - Math.min(1, (pengali - 1) / 9) * GH; }

  function update (dt) {
    runT += dt;
    if (!gameOver && fase !== 'fly') { idle += dt; if (idle > IDLE) { tamat('MEJA DITUTUP — AFK ' + Math.round(IDLE / 60) + ' detik'); return; } }
    if (fase === 'fly') {
      waktu += dt / 60;
      var lama = pengali;
      pengali = Math.round(pengali * Math.pow(1.075, dt * (1 + pengali * 0.03)) * 100) / 100;
      if (pengali > 30) pengali = 30;
      if (Math.floor(pengali * 10) !== Math.floor(lama * 10)) kurva.push({ x: waktu, y: pengali });
      A.setProgress(Math.min(1, (pengali - 1) / 9));
      if (AUTO[autoIdx] > 0 && pengali >= AUTO[autoIdx]) cashOut(true);
      else if (pengali >= titik) { pengali = titik; meledak(); }
    }
    if ((fase === 'selesai' || fase === 'crash') && !gameOver) {
      if (chips < BETS[0]) tamat('CHIP HABIS — ' + ronde + ' ronde');
    }
    for (var p = part.length - 1; p >= 0; p--) {
      var q = part[p];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.18 * dt; q.a -= 0.016 * dt;
      if (q.a <= 0) part.splice(p, 1);
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1020'); bg.addColorStop(1, '#1b1035');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    for (var g = 0; g <= 10; g++) {
      var gy = OY - (g / 10) * GH;
      ctx.beginPath(); ctx.moveTo(OX, gy); ctx.lineTo(OX + GW, gy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((1 + g * 0.9).toFixed(1) + '×', OX - 8, gy + 4);
    }
    ctx.strokeStyle = '#4b3b8f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(OX, OY - GH - 10); ctx.lineTo(OX, OY); ctx.lineTo(OX + GW + 10, OY); ctx.stroke();

    if (kurva.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = fase === 'crash' ? '#ff0055' : '#00ff87';
      ctx.lineWidth = 4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14;
      for (var i = 0; i < kurva.length; i++) {
        var px = OX + Math.min(1, kurva[i].x / 12) * GW;
        var py = OY - Math.min(1, (kurva[i].y - 1) / 9) * GH;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.lineTo(posisiX(), posisiY());
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,255,135,0.10)';
      ctx.lineTo(posisiX(), OY); ctx.lineTo(OX, OY); ctx.closePath(); ctx.fill();
    }

    if (fase === 'fly' || fase === 'selesai') {
      ctx.font = '34px "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🚀', posisiX(), posisiY() + 10);
    }
    if (fase === 'crash') {
      ctx.font = '40px "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💥', posisiX(), posisiY() + 12);
    }

    ctx.textAlign = 'center';
    var warna = fase === 'crash' ? '#ff0055' : fase === 'selesai' ? '#00ff87' : '#ffffff';
    ctx.fillStyle = warna;
    ctx.shadowColor = warna; ctx.shadowBlur = fase === 'fly' ? 24 : 0;
    ctx.font = '900 ' + (fase === 'fly' ? 76 : 56) + 'px "Segoe UI", sans-serif';
    ctx.fillText((fase === 'bet' ? '1.00' : pengali.toFixed(2)) + '×', W / 2, 130);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffd700'; ctx.font = '900 22px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('CHIP ' + chips, 20, 36);
    ctx.fillStyle = '#00f3ff'; ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText('TARUHAN ' + bet(), 20, 60);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9d4edd'; ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText('RONDE ' + ronde, W - 20, 34);
    ctx.fillStyle = '#00ff87'; ctx.fillText('AUTO ' + (AUTO[autoIdx] ? AUTO[autoIdx].toFixed(2) + '×' : 'OFF'), W - 20, 56);
    if (fase === 'fly') {
      ctx.fillStyle = '#c9b6ff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('CASH OUT = ' + Math.floor(bet() * pengali), W - 20, 80);
    }

    if (riwayat.length) {
      ctx.textAlign = 'left'; ctx.font = '700 13px "Segoe UI", sans-serif';
      var rx = 20;
      for (var r = 0; r < Math.min(8, riwayat.length); r++) {
        ctx.fillStyle = riwayat[r].cash ? '#00ff87' : '#ff5e5e';
        var txt = riwayat[r].v.toFixed(2) + '×';
        ctx.fillText(txt, rx, H - 20);
        rx += ctx.measureText(txt).width + 14;
      }
    }
    if (pesan) {
      ctx.textAlign = 'center';
      ctx.fillStyle = /MELEDAK|HABIS/.test(pesan) ? '#ff8fa3' : '#ffd700';
      ctx.font = '900 22px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H - 44);
    }
    part.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, q.a); ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,8,20,0.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 42px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 26);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText(ronde + ' RONDE · TOTAL CASH OUT ' + totalMenang, W / 2, H / 2 + 8);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI (2000 CHIP)', W / 2, H / 2 + 40);
    }
  }

  function aksi () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    if (fase === 'bet') luncur();
    else if (fase === 'fly') cashOut(false);
    else { fase = 'bet'; pesan = ''; }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { chips: chips, bet: bet(), fase: fase, pengali: pengali, titik: titik, over: gameOver, ronde: ronde, auto: AUTO[autoIdx], riwayat: riwayat.length, totalMenang: totalMenang , idle: Math.round(idle), sebab: pesan };
    requestAnimationFrame(loop);
  }

  function setKey (k, v) {
    if (v) idle = 0;
    kunci[k] = v;
    if (!v) return;
    if (k === 'ArrowUp' || k === 'KeyW') { betIdx = Math.min(BETS.length - 1, betIdx + 1); A.setStatus('Chip ' + chips, 'Bet ' + bet()); }
    else if (k === 'ArrowDown' || k === 'KeyS') { autoIdx = (autoIdx + 1) % AUTO.length; A.setHint('Auto cash-out: ' + (AUTO[autoIdx] ? AUTO[autoIdx] + '×' : 'OFF')); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { betIdx = Math.max(0, betIdx - 1); A.setStatus('Chip ' + chips, 'Bet ' + bet()); }
    else if (k === 'ArrowRight' || k === 'KeyD') { betIdx = Math.min(BETS.length - 1, betIdx + 1); A.setStatus('Chip ' + chips, 'Bet ' + bet()); }
    else if (k === 'Space' || k === 'Enter') aksi();
  }
  window.addEventListener('keydown', function (e) { A.initAudio(); setKey(e.code, true); if (e.preventDefault) e.preventDefault(); });
  window.addEventListener('keyup', function (e) { kunci[e.code] = false; });
  c.addEventListener('touchstart', function (e) { A.initAudio(); aksi(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); aksi(); });

  A.debug = { titikCrash: titikCrash, BETS: BETS, AUTO: AUTO };
  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  4. 🂡 BACCARAT — 600×560                                            */
/* ------------------------------------------------------------------ */
const BACCARAT_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var RANK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var SUIT = ['♠', '♥', '♦', '♣'];
  var BETS = [50, 100, 250, 500, 1000];
  var SISI = ['PLAYER', 'BANKER', 'TIE'];
  var KALI = [2, 1.95, 9];

  function nilaiKartu (k) { var r = k.r + 2; if (r === 14) return 1; if (r >= 10) return 0; return r; }
  function total (kartu) { var t = 0; kartu.forEach(function (k) { t += nilaiKartu(k); }); return t % 10; }
  function dekBaru () {
    var d = [], i, j;
    for (i = 0; i < 4; i++) for (j = 0; j < 13; j++) d.push({ s: i, r: j });
    for (i = d.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
    return d;
  }

  var chips = 2000, betIdx = 1, sisiIdx = 0;
  var fase = 'bet', player = [], banker = [], dek = [], pesan = '', runT = 0, gameOver = false, idle = 0, IDLE = 900;
  var riwayat = [], ronde = 0, menangRonde = 0, animP = 0, animB = 0, kunci = {}, hasil = '';

  try { var s0 = localStorage.getItem('arc_chips_baccarat'); if (s0) chips = Math.max(0, parseInt(s0, 10) || 1000); } catch (e) {}
  function simpan () { try { localStorage.setItem('arc_chips_baccarat', String(Math.floor(chips))); } catch (e) {} }
  function bet () { return BETS[betIdx]; }

  function reset () {
    idle = 0;
    chips = 2000; betIdx = 1; sisiIdx = 0; fase = 'bet'; player = []; banker = [];
    pesan = '◀▶ pilih sisi · ▲▼ taruhan · ● DEAL'; riwayat = []; ronde = 0; menangRonde = 0;
    gameOver = false; hasil = ''; simpan();
    A.setScore(chips); A.setBest(); A.setProgress(1);
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    A.setHint('◀▶ PLAYER/BANKER/TIE · ▲▼ taruhan · ● DEAL');
  }

  function deal () {
    idle = 0;
    if (chips < bet()) { tamat(); return; }
    chips -= bet(); simpan(); ronde++;
    dek = dekBaru();
    player = [dek[0], dek[2]]; banker = [dek[1], dek[3]];
    var ambil = 4;
    var tp = total(player), tb = total(banker);
    if (tp <= 5 && tp < 8) { player.push(dek[ambil++]); tp = total(player); }
    if (tb <= 5 && tb < 8) { banker.push(dek[ambil++]); tb = total(banker); }
    hasil = tp > tb ? 'PLAYER' : tb > tp ? 'BANKER' : 'TIE';
    riwayat.unshift(hasil); if (riwayat.length > 14) riwayat.pop();
    var menang = hasil === SISI[sisiIdx];
    if (menang) {
      var bayar = Math.floor(bet() * KALI[sisiIdx]);
      chips += bayar; menangRonde++;
      pesan = hasil + ' MENANG — kamu dapat ' + bayar + ' (' + KALI[sisiIdx] + '×)';
      A.SFX.level();
      if (chips > A.best) { A.best = chips; A.saveBest(chips); A.setBest(); }
    } else {
      pesan = hasil + ' MENANG — kamu pilih ' + SISI[sisiIdx] + ' (-' + bet() + ')';
      A.SFX.crash();
    }
    fase = 'hasil'; animP = 24; animB = 24;
    simpan();
    A.setScore(chips); A.setProgress(Math.min(1, chips / 5000));
    A.setStatus('Chip ' + chips, 'Bet ' + bet());
    if (chips < BETS[0]) tamat('CHIP HABIS — ' + ronde + ' ronde');
  }
  function tamat (sebab) { gameOver = true; fase = 'over'; pesan = sebab || 'CHIP HABIS — ' + ronde + ' ronde'; A.SFX.crash(); if (chips > A.best) { A.best = chips; A.saveBest(chips); } A.setBest(); }

  function update (dt) {
    runT += dt;
    if (!gameOver && fase !== 'deal') { idle += dt; if (idle > IDLE) { tamat('MEJA DITUTUP — AFK ' + Math.round(IDLE / 60) + ' detik'); return; } }
    if (animP > 0) animP -= dt;
    if (animB > 0) animB -= dt;
  }

  function gambarKartu (x, y, w, h, k, sorot) {
    ctx.save();
    if (sorot) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 14; }
    ctx.fillStyle = '#fdfdfd'; ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = sorot ? '#ffd700' : '#333'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    var merah = k.s === 1 || k.s === 2;
    ctx.fillStyle = merah ? '#e63946' : '#14121f';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '900 18px "Segoe UI", sans-serif'; ctx.fillText(RANK[k.r], x + 5, y + 4);
    ctx.textAlign = 'center';
    ctx.font = '30px "Segoe UI Emoji", serif';
    ctx.fillText(SUIT[k.s], x + w / 2, y + h / 2 - 14);
    ctx.restore();
  }

  function sisi (x, label, kartu, tot, warna, anim) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x - 10, 120, 280, 220);
    ctx.strokeStyle = warna; ctx.lineWidth = 3; ctx.strokeRect(x - 10, 120, 280, 220);
    ctx.textAlign = 'center'; ctx.fillStyle = warna;
    ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.fillText(label, x + 130, 150);
    for (var i = 0; i < kartu.length; i++) {
      gambarKartu(x + i * 76, 170 + (anim > 0 ? Math.sin(runT / 3 + i) * 3 : 0), 66, 96, kartu[i], i === kartu.length - 1 && kartu.length > 2);
    }
    ctx.fillStyle = '#fff'; ctx.font = '900 46px "Segoe UI", sans-serif';
    ctx.fillText(kartu.length ? String(tot) : '—', x + 130, 322);
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2b0d0d'); bg.addColorStop(1, '#5c1a1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,215,0,0.25)'; ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffd700'; ctx.font = '900 24px "Segoe UI", sans-serif';
    ctx.fillText('CHIP ' + chips, 26, 48);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe9a8'; ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText('RONDE ' + ronde + ' · MENANG ' + menangRonde, W - 26, 44);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = '900 20px "Segoe UI", sans-serif';
    ctx.fillText('🂡 BACCARAT', W / 2, 100);

    sisi(35, '👤 PLAYER', player, total(player), '#00f3ff', animP);
    sisi(325, '🏦 BANKER', banker, total(banker), '#ffb703', animB);

    ctx.fillStyle = '#fff'; ctx.font = '900 24px "Segoe UI", sans-serif';
    ctx.fillText('VS', W / 2, 250);

    ctx.font = '900 22px "Segoe UI", sans-serif';
    for (var i = 0; i < 3; i++) {
      var bx = 90 + i * 160, aktif = (fase === 'bet' && sisiIdx === i);
      ctx.fillStyle = aktif ? '#ffd700' : 'rgba(255,255,255,0.35)';
      ctx.fillRect(bx - 74, 372, 148, 46);
      ctx.fillStyle = aktif ? '#3a0d0d' : '#2b0d0d';
      ctx.font = '900 17px "Segoe UI", sans-serif';
      ctx.fillText(SISI[i] + ' ' + KALI[i] + '×', bx, 401);
      if (aktif) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(bx - 74, 372, 148, 46); }
    }

    if (fase === 'bet') {
      ctx.fillStyle = '#ffe9a8'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText('TARUHAN ' + bet() + '   (▲ naik · ▼ turun)', W / 2, 452);
    }
    if (pesan) {
      ctx.fillStyle = /kamu dapat/.test(pesan) ? '#00ff87' : '#ff8fa3';
      ctx.font = '900 20px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, 492);
    }
    if (riwayat.length) {
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText('RIWAYAT: ' + riwayat.map(function (r) { return r === 'PLAYER' ? '👤' : r === 'BANKER' ? '🏦' : '🤝'; }).join(' '), W / 2, 524);
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(20,4,4,0.86)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 42px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 26);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 18px "Segoe UI", sans-serif';
      ctx.fillText(ronde + ' RONDE · MENANG ' + menangRonde, W / 2, H / 2 + 8);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI (2000 CHIP)', W / 2, H / 2 + 40);
    }
  }

  function aksi () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    if (fase === 'bet') deal();
    else { fase = 'bet'; pesan = ''; player = []; banker = []; }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { chips: chips, bet: bet(), sisi: SISI[sisiIdx], fase: fase, hasil: hasil, player: player.length, banker: banker.length, totalP: player.length ? total(player) : -1, totalB: banker.length ? total(banker) : -1, over: gameOver, ronde: ronde, menang: menangRonde, riwayat: riwayat.slice() , idle: Math.round(idle), sebab: pesan };
    requestAnimationFrame(loop);
  }

  function setKey (k, v) {
    if (v) idle = 0;
    kunci[k] = v;
    if (!v) return;
    if (k === 'ArrowLeft' || k === 'KeyA') { if (fase === 'bet') sisiIdx = (sisiIdx + 2) % 3; }
    else if (k === 'ArrowRight' || k === 'KeyD') { if (fase === 'bet') sisiIdx = (sisiIdx + 1) % 3; }
    else if (k === 'ArrowUp' || k === 'KeyW') { betIdx = Math.min(BETS.length - 1, betIdx + 1); A.setStatus('Chip ' + chips, 'Bet ' + bet()); }
    else if (k === 'ArrowDown' || k === 'KeyS') { betIdx = Math.max(0, betIdx - 1); A.setStatus('Chip ' + chips, 'Bet ' + bet()); }
    else if (k === 'Space' || k === 'Enter') aksi();
  }
  window.addEventListener('keydown', function (e) { A.initAudio(); setKey(e.code, true); if (e.preventDefault) e.preventDefault(); });
  window.addEventListener('keyup', function (e) { kunci[e.code] = false; });
  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); if (e.preventDefault) e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    if (ty > 366 && ty < 424 && fase === 'bet') {
      for (var i = 0; i < 3; i++) { var bx = 90 + i * 160; if (tx > bx - 74 && tx < bx + 74) { sisiIdx = i; A.SFX.point(); if (e.preventDefault) e.preventDefault(); return; } }
    }
    aksi();
    if (e.preventDefault) e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });

  A.debug = { total: total, nilaiKartu: nilaiKartu, dekBaru: dekBaru, KALI: KALI, SISI: SISI };
  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  EXPORT                                                              */
/* ------------------------------------------------------------------ */
export function slotHtml (brand = 'THERYHANN!') {
  return shell('Casino Slot (Chip)', brand, SLOT_JS, {
    w: 560, h: 520, maxw: 560,
    hint: '◀▶ taruhan · ▲ max · ▼ auto-spin · ● PUTAR'
  })
}
export function pokerHtml (brand = 'THERYHANN!') {
  return shell('Poker 5-Card Draw', brand, POKER_JS, {
    w: 600, h: 700, maxw: 600,
    hint: '▲▼ ante · ● DEAL · ◀▶ pilih kartu · ● tahan · ▲ TUKAR'
  })
}
export function crashHtml (brand = 'THERYHANN!') {
  return shell('Crash / Aviator', brand, CRASH_JS, {
    w: 700, h: 480, maxw: 700,
    hint: '▲▼ taruhan/auto · ● LUNCUR lalu ● CASH OUT'
  })
}
export function baccaratHtml (brand = 'THERYHANN!') {
  return shell('Baccarat', brand, BACCARAT_JS, {
    w: 600, h: 560, maxw: 600,
    hint: '◀▶ PLAYER/BANKER/TIE · ▲▼ taruhan · ● DEAL'
  })
}

export const CASINO_HTML = [
  { id: 'slot', cmd: 'slotchip', icon: '🎰', nama: 'Casino Slot (Chip)', ket: '3 gulungan beranimasi, paytable, auto-spin, chip lokal — uang RPG: .slot', ratio: '560×520', html: slotHtml },
  { id: 'poker', cmd: 'poker', icon: '🃏', nama: 'Poker 5-Card Draw', ket: 'vs CPU, tahan kartu, jam 12 detik', ratio: '600×700', html: pokerHtml },
  { id: 'crash', cmd: 'crash', icon: '🚀', nama: 'Crash / Aviator', ket: 'kurva pengali real-time, cash out sebelum meledak', ratio: '700×480', html: crashHtml },
  { id: 'baccarat', cmd: 'baccarat', icon: '🂡', nama: 'Baccarat', ket: 'Player/Banker/Tie, aturan kartu ketiga', ratio: '600×560', html: baccaratHtml }
]

export default { slotHtml, pokerHtml, crashHtml, baccaratHtml, CASINO_HTML }
