/**
 * 🎸 GUITAR FLASH — game ritme 4 lajur (v7.37.0)
 * ------------------------------------------------------------------
 *  Meniru alur & rasa Guitar Flash / rhythm game gitar:
 *   • layar PILIH LAGU: 5 lagu × 3 tingkat, pratinjau pola ketukan
 *   • note 4 lajur (merah/kuning/biru/hijau) turun sesuai ketukan lagu
 *   • NOTE PANJANG (hold) — tahan sampai ekornya habis
 *   • HAMMER-ON / PULL-OFF (note kecil) — cukup ketuk, tanpa pukul lajur
 *   • CHORD — dua note sekaligus dalam satu ketukan
 *   • BAGIAN SOLO — papan fret menyala, nada naik cepat
 *   • PENILAIAN garis pukul: PERFECT ±70ms · GOOD ±140ms · MISS di luar itu
 *   • combo, MULTIPLIER ×1–×4, STAR POWER (● saat penuh = 2× selama 8 dtk)
 *   • WHAMMY — getar ekor hold untuk bonus skor
 *   • BAND: musik berhenti + suara penonton kecewa kalau kamu gagal,
 *     lalu "RECOVER" saat combo pulih (persis game aslinya)
 *   • audio: drum + bass + gitar (WebAudio, tanpa berkas luar)
 *
 *  Lagu & chart digambar dari pola ketukan buatan sendiri — bukan berkas
 *  audio berhak cipta, jadi tidak ada lagu/aset/logo asli yang disalin.
 *
 *  Kontrol: ▲▼ pilih lagu · ◀▶ tingkat · ● mulai / STAR POWER ·
 *  D F J K (atau 1 2 3 4) = empat lajur · ketuk lajur di dalam kartu ·
 *  ESC/Space jeda.
 */
import { shell } from './htmlgames.js'

/**
 * pola ketukan per lagu. Nilai per langkah:
 *   -1 = jeda · 0-3 = lajur · [a,b] = chord dua lajur · 'Hn' = hold di lajur n
 *   's' = mulai bagian solo · 'e' = selesai bagian solo
 */
export const LAGU = [
  {
    id: 'neonhighway', nama: 'Neon Highway', bpm: 104, durasi: 78, warna: '#38bdf8',
    ket: 'intro lembut, mudah diikuti', skala: [0, 2, 4, 7, 9],
    pola: [
      0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 2, -1, 3, -1, 2, -1,
      0, 0, -1, 1, 1, -1, 2, -1, 3, 2, 1, -1, 0, -1, -1, -1,
      's', 0, 2, 1, 3, 2, 0, 1, 3, 2, 0, 1, 'e',
      [0, 2], -1, [1, 3], -1, [0, 3], -1, [1, 2], -1, 'H0', -1, -1, -1
    ]
  },
  {
    id: 'thunderroad', nama: 'Thunder Road', bpm: 126, durasi: 76, warna: '#fbbf24',
    ket: 'riff cepat, mulai ada chord & hold', skala: [0, 3, 5, 7, 10],
    pola: [
      0, 2, -1, 1, 3, -1, 2, 0, 1, -1, 3, -1, 2, 3, 1, -1,
      0, -1, 1, 2, 3, -1, 2, -1, 1, 0, 3, 2, 0, 1, -1, -1,
      3, 3, 2, 2, 1, 1, 0, -1, 2, -1, 3, -1, 0, 2, 1, 3,
      [0, 3], -1, [1, 2], -1, 'H2', -1, -1, -1, [0, 1], -1, [2, 3], -1,
      's', 3, 1, 2, 0, 3, 1, 2, 0, 2, 3, 1, 0, 2, 1, 3, 'e'
    ]
  },
  {
    id: 'midnightshred', nama: 'Midnight Shred', bpm: 152, durasi: 74, warna: '#f43f5e',
    ket: 'shred 16th, chord & solo panjang', skala: [0, 2, 3, 5, 7, 8, 10],
    pola: [
      0, 1, 2, 3, 2, 1, 0, -1, 3, 2, 1, 0, 1, 2, 3, -1,
      0, -1, 2, -1, 1, 3, 0, 2, 3, -1, 1, -1, 0, 2, 1, 3,
      's', 0, 2, 1, 3, 0, 2, 1, 3, 2, 2, 3, 3, 1, 0, 2, -1,
      3, 1, 2, 0, 3, 1, 2, 0, 0, 1, 2, 3, 3, 2, 1, 0, 'e',
      [0, 2], -1, [1, 3], -1, 'H1', -1, -1, -1, [0, 3], -1, [1, 2], -1,
      0, 0, 1, 1, 2, 2, 3, 3, 'H3', -1, -1, -1, [0, 1], [2, 3], -1, -1
    ]
  },
  {
    id: 'sunsetcruise', nama: 'Sunset Cruise', bpm: 88, durasi: 82, warna: '#34d399',
    ket: 'ballad santai untuk pemanasan', skala: [0, 4, 7, 11, 12],
    pola: [
      0, -1, -1, 2, -1, -1, 1, -1, 3, -1, -1, 2, -1, -1, 0, -1,
      1, -1, -1, 3, -1, -1, 2, -1, 0, -1, -1, 1, -1, -1, -1, -1,
      'H0', -1, -1, -1, 'H2', -1, -1, -1, 'H1', -1, -1, -1, 'H3', -1, -1, -1,
      's', 0, 1, 2, 3, 2, 1, 0, 2, 3, 1, 0, 'e',
      [0, 2], -1, -1, -1, [1, 3], -1, -1, -1, [0, 3], -1, -1, -1
    ]
  },
  {
    id: 'voltbreaker', nama: 'Volt Breaker', bpm: 174, durasi: 72, warna: '#a78bfa',
    ket: 'tercepat: hampir tanpa jeda', skala: [0, 1, 3, 6, 7, 10],
    pola: [
      0, 1, 0, 2, 1, 3, 2, 0, 3, 1, 2, 3, 0, 2, 1, 0,
      3, 2, 3, 1, 0, 1, 2, 3, 2, 0, 3, 1, 0, 3, 2, 1,
      0, 0, 1, 1, 2, 2, 3, 3, 2, 1, 0, 3, 1, 2, 0, 3,
      0, 1, 2, 3, 3, 2, 1, 0, 0, 2, 1, 3, 2, 0, 3, 1,
      's', 3, 2, 3, 1, 0, 1, 2, 3, 2, 1, 0, 3, 2, 1, 0,
      1, 2, 3, 2, 1, 0, 2, 3, 0, 1, 3, 2, 0, 3, 1, 2, 'e',
      [0, 3], -1, [1, 2], -1, 'H0', -1, -1, -1, [2, 3], -1, [0, 1], -1
    ]
  }
]

const GUITAR_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var LAGU = __LAGU__;

  /* ---------- tata letak (relatif, jangan angka tetap) ---------- */
  var LANES = 4;
  var LANE_W = W / LANES;
  var HIT_Y = H - 104;
  var HIT_H = 26;
  var LEAD = 1.85;                    /* detik note terlihat sebelum garis pukul */
  var WARNA = ['#ff2d55', '#ffd60a', '#0a84ff', '#30d158'];
  var WARNA_TUA = ['#8c0f28', '#8a6d00', '#04458c', '#116b2b'];
  var KEY_LANE = [['KeyD', 'Digit1'], ['KeyF', 'Digit2'], ['KeyJ', 'Digit3'], ['KeyK', 'Digit4']];
  var JENDELA_PERFECT = 0.07, JENDELA_GOOD = 0.14, BATAS_MISS = 0.16;
  var DUR_HOLD = 0.62;                /* detik panjang ekor hold */

  var mode = 'pilih';                 /* pilih | main | jeda | selesai */
  var pilihan = 0, kesulitan = 1;
  var DIFF = [
    { nama: 'EASY', pembagi: 2, acakLajur: false, lifeTurun: 7, hammer: 0.25, hold: 0.45 },
    { nama: 'NORMAL', pembagi: 1, acakLajur: false, lifeTurun: 11, hammer: 0.4, hold: 0.7 },
    { nama: 'HARD', pembagi: 0.5, acakLajur: true, lifeTurun: 16, hammer: 0.6, hold: 1 }
  ];

  var chart = [], head = 0, songT = 0;
  var score = 0, combo = 0, maxCombo = 0, life = 100, star = 0, starAktif = 0;
  var hit = { perfect: 0, good: 0, miss: 0, hold: 0, hammer: 0 };
  var judge = null, judgeT = 0, flash = [0, 0, 0, 0], shakeT = 0, particles = [];
  var laneTekan = [false, false, false, false];
  var beatKe = -1, soloT = -1, whammy = 0, bandMati = false, bandPulihT = 0;
  var holdAktif = {};                 /* index chart -> { sisa, whammy } */

  /* roundRect belum ada di semua webview → fallback ke kotak biasa */
  function kotak (x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }
  function lajurDariX (x) {
    var l = Math.floor(x / LANE_W);
    return l < 0 ? 0 : l > LANES - 1 ? LANES - 1 : l;
  }
  function kaliSkor () {
    var k = combo >= 40 ? 4 : combo >= 30 ? 3 : combo >= 20 ? 2 : 1;
    return starAktif > 0 ? k * 2 : k;
  }

  /* ---------- bangun chart dari pola ketukan ---------- */
  function bangunsChart () {
    var L = LAGU[pilihan], D = DIFF[kesulitan];
    var step = 60 / L.bpm / 2;            /* dasar: not per 1/8 ketukan */
    if (D.pembagi === 2) step = 60 / L.bpm;
    if (D.pembagi === 0.5) step = 60 / L.bpm / 4;
    chart = [];
    var t = 2.4, i = 0, solo = false, sejakHammer = 99;
    while (t < L.durasi) {
      var v = L.pola[i % L.pola.length];
      i++; sejakHammer++;
      if (v === 's') { solo = true; t += step; continue; }
      if (v === 'e') { solo = false; t += step; continue; }
      if (v === -1) { t += step; continue; }

      /* chord = dua note pada waktu sama */
      if (Object.prototype.toString.call(v) === '[object Array]') {
        for (var q = 0; q < v.length; q++) {
          chart.push({ t: t, lane: v[q], kena: false, nilai: false, hold: false, hammer: false });
        }
        sejakHammer = 0; t += step; continue;
      }

      var lane = 0, hold = false;
      if (typeof v === 'string' && v.charAt(0) === 'H') {
        lane = parseInt(v.slice(1), 10) || 0; hold = true;
      } else {
        lane = v;
      }
      if (D.acakLajur && !solo) lane = Math.floor(Math.random() * LANES);

      /* hammer-on / pull-off: note kecil setelah rentetan, cukup diketuk */
      var hammer = !solo && sejakHammer <= 2 && Math.random() < D.hammer;
      chart.push({
        t: t, lane: lane, kena: false, nilai: false,
        hold: hold && Math.random() < D.hold, hammer: hammer
      });
      sejakHammer = 0;
      t += step;
    }
    chart.sort(function (a, b) { return a.t - b.t || a.lane - b.lane; });
    /* bagian solo ditandai waktu, untuk papan fret & nada */
    soloMulai = null; soloSelesai = null;
    var ts = 2.4, soloOn = false;
    for (var k = 0; k < L.pola.length; k++) {
      var p = L.pola[k];
      if (p === 's') { soloOn = true; soloMulai = ts; ts += step; continue; }
      if (p === 'e') { soloOn = false; soloSelesai = ts; ts += step; continue; }
      ts += step;
    }
    return chart.length;
  }
  var soloMulai = null, soloSelesai = null;

  function resetPartai () {
    head = 0; songT = 0; score = 0; combo = 0; maxCombo = 0;
    life = 100; star = 0; starAktif = 0;
    hit = { perfect: 0, good: 0, miss: 0, hold: 0, hammer: 0 };
    judge = null; judgeT = 0; particles = []; shakeT = 0;
    beatKe = -1; soloT = -1; whammy = 0; bandMati = false; bandPulihT = 0;
    holdAktif = {}; flash = [0, 0, 0, 0];
  }
  function mulai () {
    bangunsChart();
    resetPartai();
    mode = 'main';
    A.setScore(0); A.setBest(); A.setStatus(DIFF[kesulitan].nama, LAGU[pilihan].bpm + ' BPM');
    A.setProgress(0); A.initAudio();
  }

  /* ---------- audio: drum + bass + gitar (WebAudio) ---------- */
  /* JANGAN pakai nama audioCtx: PRELUDE shell sudah punya var audioCtx di
     scope yang sama (bentrokan var/function membuat binding jadi undefined). */
  var gfCtx = null;
  function audioGf () {
    if (gfCtx) return gfCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      gfCtx = AC ? new AC() : null;
    } catch (e) { gfCtx = null; }
    return gfCtx;
  }
  function frekuensi (lane) {
    var L = LAGU[pilihan];
    var semi = L.skala[(lane + Math.floor(combo / 10)) % L.skala.length];
    var oktaf = soloT >= 0 ? 1 : 0;
    return 220 * Math.pow(2, (semi + 12 * oktaf) / 12);
  }
  function nadaGitar (lane, sempurna, hammer) {
    if (bandMati) return;                 /* band mati = gitar ikut mati */
    var g = audioGf();
    if (!g) { try { A.SFX.point(); } catch (e) {} return; }
    try {
      if (g.state === 'suspended') g.resume();
      var now = g.currentTime, f = frekuensi(lane);
      var o = g.createOscillator(), o2 = g.createOscillator();
      var gn = g.createGain(), fl = g.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = hammer ? 'triangle' : 'square';
      o.frequency.setValueAtTime(f, now);
      o2.frequency.setValueAtTime(f * 2, now);
      if (soloT >= 0) {                   /* bend khas bagian solo */
        o.frequency.exponentialRampToValueAtTime(f * 1.35, now + 0.12);
      }
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(semperna ? 4400 : 2600, now);
      fl.frequency.exponentialRampToValueAtTime(700, now + 0.32);
      var vol = hammer ? 0.1 : 0.16;
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(vol, now + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      o.connect(fl); o2.connect(fl); fl.connect(gn); gn.connect(g.destination);
      o.start(now); o2.start(now); o.stop(now + 0.35); o2.stop(now + 0.35);
    } catch (e) { try { A.SFX.point(); } catch (e2) {} }
  }
  function nadaBass (lane) {
    var g = audioGf();
    if (!g || bandMati) return;
    try {
      var now = g.currentTime;
      var o = g.createOscillator(), gn = g.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(frekuensi(lane) / 4, now);
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      o.connect(gn); gn.connect(g.destination);
      o.start(now); o.stop(now + 0.3);
    } catch (e) {}
  }
  function drum (kuat) {
    var g = audioGf();
    if (!g) { try { A.SFX.jump(); } catch (e) {} return; }
    try {
      var now = g.currentTime;
      var o = g.createOscillator(), gn = g.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(kuat ? 132 : 88, now);
      o.frequency.exponentialRampToValueAtTime(42, now + 0.11);
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(kuat ? 0.2 : 0.09, now + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      o.connect(gn); gn.connect(g.destination);
      o.start(now); o.stop(now + 0.15);
      if (kuat) {                         /* simbal tipis di ketukan pertama */
        var b = g.createBufferSource(), len = Math.floor(g.sampleRate * 0.12);
        var buf = g.createBuffer(1, len, g.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.12;
        b.buffer = buf;
        var hp = g.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
        b.connect(hp); hp.connect(g.destination); b.start(now);
      }
    } catch (e) { try { A.SFX.jump(); } catch (e2) {} }
  }
  function suaraKecewa () {               /* penonton kecewa saat band mati */
    var g = audioGf();
    if (!g) return;
    try {
      var now = g.currentTime, len = Math.floor(g.sampleRate * 0.7);
      var buf = g.createBuffer(1, len, g.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var env = Math.min(1, i / (g.sampleRate * 0.05)) * (1 - i / len);
        d[i] = (Math.random() * 2 - 1) * env * 0.18;
      }
      var b = g.createBufferSource(); b.buffer = buf;
      var bp = g.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.8;
      b.connect(bp); bp.connect(g.destination); b.start(now);
    } catch (e) {}
  }
  function suaraSorak () {                /* band pulih */
    var g = audioGf();
    if (!g) return;
    try {
      var now = g.currentTime, len = Math.floor(g.sampleRate * 0.9);
      var buf = g.createBuffer(1, len, g.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var env = Math.min(1, i / (g.sampleRate * 0.25)) * (1 - i / len);
        d[i] = (Math.random() * 2 - 1) * env * 0.14;
      }
      var b = g.createBufferSource(); b.buffer = buf;
      var hp = g.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      b.connect(hp); hp.connect(g.destination); b.start(now);
      try { A.SFX.level(); } catch (e) {}
    } catch (e) {}
  }

  /* ---------- penilaian ---------- */
  function partikel (x, y, warna, n) {
    for (var i = 0; i < n; i++) {
      particles.push({
        x: x, y: y, vx: A.rand(-3.4, 3.4), vy: A.rand(-4.6, -0.6),
        r: A.rand(1.6, 4.2), warna: warna, hidup: 1
      });
    }
  }
  function tambahSkor (dasar) {
    score += Math.floor(dasar * kaliSkor());
    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
  }
  function nilai (lane, sempurna, hammer, idx) {
    var dasar = sempurna ? 100 : 50;
    if (hammer) { dasar = Math.floor(dasar * 0.6); hit.hammer++; }
    tambahSkor(dasar + Math.min(combo, 50) * 2);
    combo++; if (combo > maxCombo) maxCombo = combo;
    life = Math.min(100, life + (sempurna ? 3.2 : 1.6));
    star = Math.min(100, star + (sempurna ? 7 : 4));
    judge = sempurna ? 'PERFECT' : 'GOOD'; judgeT = 0.5;
    flash[lane] = 1;
    partikel(lane * LANE_W + LANE_W / 2, HIT_Y, WARNA[lane], sempurna ? 16 : 9);
    nadaGitar(lane, sempurna, hammer);
    if (combo % 4 === 0) nadaBass(lane);
    if (combo > 0 && combo % 16 === 0) drum(true);
    if (bandMati && combo >= 8) { bandMati = false; bandPulihT = 1.2; suaraSorak(); }
  }
  function gagal (lane) {
    combo = 0;
    life -= DIFF[kesulitan].lifeTurun;
    judge = 'MISS'; judgeT = 0.5; shakeT = 0.22;
    hit.miss++;
    if (!bandMati) { bandMati = true; suaraKecewa(); }
    try { A.SFX.crash(); } catch (e) {}
    if (life <= 0) { life = 0; selesai(); }
  }
  function selesai () {
    if (mode === 'selesai') return;
    mode = 'selesai';
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setProgress(1);
    try { A.SFX.level(); } catch (e) {}
  }

  /* ---------- pukul lajur ---------- */
  function pukul (lane) {
    laneTekan[lane] = true; flash[lane] = Math.max(flash[lane], 0.55);
    if (mode !== 'main') return;
    var terbaik = null, beda = 999, idxTerbaik = -1;
    for (var i = head; i < chart.length && chart[i].t < songT + JENDELA_GOOD; i++) {
      var n = chart[i];
      if (n.kena || n.nilai || n.lane !== lane) continue;
      var d = Math.abs(n.t - songT);
      if (d < beda) { beda = d; terbaik = n; idxTerbaik = i; }
    }
    if (terbaik && beda <= JENDELA_GOOD) {
      terbaik.kena = true; terbaik.nilai = true;
      var sempurna = beda <= JENDELA_PERFECT;
      if (sempurna) hit.perfect++; else hit.good++;
      nilai(lane, sempurna, terbaik.hammer, idxTerbaik);
      /* note panjang: mulai ditahan */
      if (terbaik.hold) holdAktif[idxTerbaik] = { sisa: DUR_HOLD, whammy: 0, lane: lane };
    } else {
      /* Pukul kosong. Seperti game aslinya: tidak dihukum kalau memang tidak
         ada note dekat di lajur mana pun (strum berlebih saat chord/hold).
         Hanya memutus combo kalau ada note yang sedang terlewat di dekat sini. */
      flash[lane] = 0.35;
      var adaDekat = false;
      for (var j = head; j < chart.length && chart[j].t < songT + JENDELA_GOOD; j++) {
        if (!chart[j].nilai && chart[j].t >= songT - JENDELA_GOOD) { adaDekat = true; break; }
      }
      if (adaDekat && combo > 4) { combo = Math.floor(combo / 2); judge = 'EMPTY'; judgeT = 0.35; }
    }
  }
  function lepas (lane) {
    laneTekan[lane] = false;
    /* melepas terlalu awal memotong hold → dihitung miss */
    for (var k in holdAktif) {
      var h = holdAktif[k];
      if (h.lane === lane && h.sisa > 0.06) {
        delete holdAktif[k];
        gagal(lane);
        return;
      }
    }
  }

  /* ---------- update ---------- */
  function update (dt) {
    var dts = dt / 60;
    if (judgeT > 0) judgeT -= dts;
    if (shakeT > 0) shakeT -= dts;
    if (bandPulihT > 0) bandPulihT -= dts;
    for (var i = 0; i < LANES; i++) if (flash[i] > 0) flash[i] = Math.max(0, flash[i] - dt / 12);
    for (var p = particles.length - 1; p >= 0; p--) {
      var q = particles[p];
      q.x += q.vx * dt * 0.6; q.y += q.vy * dt * 0.6; q.vy += 0.16 * dt; q.hidup -= dt / 42;
      if (q.hidup <= 0) particles.splice(p, 1);
    }
    if (mode !== 'main') return;

    songT += dts;
    if (starAktif > 0) starAktif -= dts;

    /* bagian solo aktif? */
    soloT = (soloMulai !== null && songT >= soloMulai &&
             (soloSelesai === null || songT <= soloSelesai)) ? 1 : -1;

    /* note yang lewat tanpa dipukul = MISS */
    while (head < chart.length && chart[head].t < songT - BATAS_MISS) {
      var n = chart[head];
      if (!n.nilai) { n.nilai = true; gagal(n.lane); }
      head++;
    }

    /* ekor hold berjalan; lepas sebelum habis = miss (d tangani di lepas()) */
    for (var k in holdAktif) {
      var h = holdAktif[k];
      h.sisa -= dts;
      if (laneTekan[h.lane]) {
        hit.hold++;
        tambahSkor(6);
        star = Math.min(100, star + dts * 9);
        life = Math.min(100, life + dts * 4);
        flash[h.lane] = Math.max(flash[h.lane], 0.5);
        whammy = 1;
        if (Math.random() < 0.25) partikel(h.lane * LANE_W + LANE_W / 2, HIT_Y, WARNA[h.lane], 2);
      }
      if (h.sisa <= 0) {
        delete holdAktif[k];
        tambahSkor(40);
        judge = 'HOLD OK'; judgeT = 0.4;
        partikel(h.lane * LANE_W + LANE_W / 2, HIT_Y, '#ffffff', 10);
      }
    }
    if (whammy > 0) whammy = Math.max(0, whammy - dts * 2.2);

    /* ketukan drum mengikuti BPM */
    var L = LAGU[pilihan];
    var beat = Math.floor(songT / (60 / L.bpm));
    if (beat !== beatKe) { beatKe = beat; if (!bandMati) drum(beat % 4 === 0); }

    A.setProgress(Math.min(1, songT / L.durasi));
    A.setStatus(DIFF[kesulitan].nama + ' · ' + L.nama,
      '×' + kaliSkor() + ' · COMBO ' + combo + (starAktif > 0 ? ' · 2×' : ''));
    if (songT >= L.durasi && head >= chart.length && !Object.keys(holdAktif).length) selesai();
  }

  /* ---------- gambar ---------- */
  function latar () {
    var L = LAGU[pilihan];
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0714'); g.addColorStop(0.55, '#160a24'); g.addColorStop(1, '#05030a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var periode = 60 / L.bpm;
    var puls = mode === 'main' ? (0.5 + 0.5 * Math.cos((songT % periode) / periode * Math.PI * 2)) : 0.35;
    if (bandMati) puls *= 0.25;
    var rg = ctx.createRadialGradient(W / 2, H * 0.1, 10, W / 2, H * 0.1, W * 0.85);
    rg.addColorStop(0, 'rgba(255,255,255,' + (0.05 + 0.08 * puls).toFixed(3) + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  function lajur () {
    for (var i = 0; i < LANES; i++) {
      var x = i * LANE_W;
      var gg = ctx.createLinearGradient(x, 0, x + LANE_W, 0);
      gg.addColorStop(0, 'rgba(255,255,255,0.03)');
      gg.addColorStop(0.5, 'rgba(255,255,255,0.07)');
      gg.addColorStop(1, 'rgba(255,255,255,0.03)');
      ctx.fillStyle = gg; ctx.fillRect(x, 0, LANE_W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      /* fret ala papan gitar */
      for (var f = 1; f < 7; f++) {
        var fy = H - (H - 40) * (f / 7);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + LANE_W, fy); ctx.stroke();
      }
      if (flash[i] > 0) {
        ctx.globalAlpha = 0.05 + 0.13 * flash[i];
        ctx.fillStyle = WARNA[i];
        ctx.fillRect(x, 0, LANE_W, H);
        ctx.globalAlpha = 1;
      }
    }
    if (soloT >= 0) {                      /* papan fret menyala saat solo */
      ctx.globalAlpha = 0.16 + 0.1 * Math.sin(songT * 12);
      ctx.fillStyle = '#ffd60a';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,214,10,0.95)';
      ctx.font = '900 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ GUITAR SOLO ★', W / 2, 62);
      ctx.textAlign = 'left';
    }
  }
  function garisPukul () {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, HIT_Y - HIT_H / 2, W, HIT_H);
    for (var i = 0; i < LANES; i++) {
      var x = i * LANE_W, cx = x + LANE_W / 2;
      var tekan = laneTekan[i];
      ctx.beginPath();
      ctx.arc(cx, HIT_Y, LANE_W * 0.3, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = WARNA[i];
      ctx.globalAlpha = tekan ? 1 : 0.75;
      ctx.stroke();
      if (tekan || flash[i] > 0.2) {
        ctx.fillStyle = WARNA[i];
        ctx.globalAlpha = 0.28 + 0.4 * flash[i];
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(['D', 'F', 'J', 'K'][i], cx, HIT_Y + 5);
    }
    ctx.textAlign = 'left';
  }
  function yNote (t) {
    return HIT_Y - ((t - songT) / LEAD) * (HIT_Y + 40);
  }
  function kepalaNote (n, y) {
    var x = n.lane * LANE_W + LANE_W / 2;
    var w = LANE_W * 0.62, h = 20;
    ctx.save();
    ctx.shadowColor = WARNA[n.lane]; ctx.shadowBlur = 14;
    if (n.hammer) {                        /* hammer-on: note kecil transparan */
      ctx.globalAlpha = 0.75;
      w = LANE_W * 0.34; h = 12;
      ctx.fillStyle = WARNA[n.lane];
      ctx.beginPath(); ctx.arc(x, y, w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, w / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      return;
    }
    var gr = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    gr.addColorStop(0, WARNA[n.lane]); gr.addColorStop(1, WARNA_TUA[n.lane]);
    ctx.fillStyle = gr;
    kotak(x - w / 2, y - h / 2, w, h, 7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, 3);
  }
  function notes () {
    for (var i = head; i < chart.length; i++) {
      var n = chart[i];
      if (n.t > songT + LEAD) break;
      if (n.nilai && n.kena) continue;
      var y = yNote(n.t);
      if (y < -60 || y > HIT_Y + 40) continue;

      /* ekor hold digambar lebih dulu supaya kepala ada di atas */
      if (n.hold && !n.nilai) {
        var y2 = yNote(n.t + DUR_HOLD);
        var cx = n.lane * LANE_W + LANE_W / 2;
        var ew = LANE_W * 0.22;
        ctx.fillStyle = WARNA[n.lane];
        ctx.globalAlpha = 0.5;
        kotak(cx - ew / 2, Math.min(y, y2), ew, Math.abs(y - y2), ew / 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = WARNA[n.lane];
        ctx.beginPath(); ctx.arc(cx, y2, ew / 2, 0, Math.PI * 2); ctx.fill();
      }
      kepalaNote(n, y);
    }
    /* ekor yang sedang ditahan: menyala + bergetar (whammy) */
    for (var k in holdAktif) {
      var h = holdAktif[k];
      var cx = h.lane * LANE_W + LANE_W / 2 + (whammy > 0 ? A.rand(-3, 3) : 0);
      var ew = LANE_W * 0.22;
      var yTop = yNote(songT + h.sisa);
      ctx.save();
      ctx.shadowColor = WARNA[h.lane]; ctx.shadowBlur = 18;
      ctx.fillStyle = WARNA[h.lane];
      ctx.globalAlpha = 0.85;
      kotak(cx - ew / 2, Math.min(yTop, HIT_Y), ew, Math.abs(HIT_Y - yTop), ew / 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  function partikelDraw () {
    for (var i = 0; i < particles.length; i++) {
      var q = particles[i];
      ctx.globalAlpha = Math.max(0, q.hidup);
      ctx.fillStyle = q.warna;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function hud () {
    /* life bar */
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(10, 10, W - 20, 9);
    var lw = (W - 20) * Math.max(0, life) / 100;
    var lg = ctx.createLinearGradient(10, 0, 10 + lw, 0);
    lg.addColorStop(0, life > 40 ? '#30d158' : '#ff9f0a');
    lg.addColorStop(1, life > 40 ? '#0a84ff' : '#ff453a');
    ctx.fillStyle = lg; ctx.fillRect(10, 10, lw, 9);
    /* star power */
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(10, 24, W - 20, 6);
    ctx.fillStyle = starAktif > 0 ? '#ffd60a' : (star >= 100 ? '#fff07c' : '#7a5cff');
    ctx.fillRect(10, 24, (W - 20) * (starAktif > 0 ? Math.max(0, starAktif) / 8 : star / 100), 6);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.fillText(starAktif > 0 ? 'STAR POWER 2×' : (star >= 100 ? '● STAR POWER SIAP' : 'STAR POWER'), 12, 44);

    /* multiplier ×1..×4 */
    var k = kaliSkor();
    ctx.textAlign = 'right';
    ctx.fillStyle = k > 1 ? '#ffd60a' : 'rgba(255,255,255,0.5)';
    ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.fillText('×' + k, W - 14, 62);
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('MULTIPLIER', W - 14, 74);
    ctx.textAlign = 'left';

    /* peringatan band mati */
    if (bandMati) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,69,58,0.9)';
      ctx.font = '900 15px "Segoe UI", sans-serif';
      ctx.fillText('⚠ BAND MATI — kejar 8 combo!', W / 2, 62);
      ctx.textAlign = 'left';
    } else if (bandPulihT > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(48,209,88,0.95)';
      ctx.font = '900 15px "Segoe UI", sans-serif';
      ctx.fillText('🎉 BAND PULIH!', W / 2, 62);
      ctx.textAlign = 'left';
    }

    /* combo besar di tengah */
    if (combo > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '900 ' + Math.min(52, 26 + combo * 0.35).toFixed(0) + 'px "Segoe UI", sans-serif';
      ctx.fillText(combo + 'x', W / 2, H * 0.32);
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('COMBO', W / 2, H * 0.32 + 16);
      ctx.textAlign = 'left';
    }
    /* penilaian */
    if (judge && judgeT > 0) {
      ctx.textAlign = 'center';
      ctx.font = '900 22px "Segoe UI", sans-serif';
      ctx.fillStyle = judge === 'PERFECT' ? '#ffd60a'
        : judge === 'GOOD' ? '#30d158'
        : judge === 'MISS' ? '#ff453a'
        : judge === 'HOLD OK' ? '#0a84ff' : 'rgba(255,255,255,0.6)';
      ctx.fillText(judge, W / 2, HIT_Y - 50);
      ctx.textAlign = 'left';
    }
    /* lagu & waktu */
    var L = LAGU[pilihan];
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '700 11px "Segoe UI", sans-serif';
    var sisa = Math.max(0, L.durasi - songT);
    ctx.fillText(L.nama + ' · ' + L.bpm + ' BPM', 12, H - 12);
    ctx.textAlign = 'right';
    ctx.fillText(Math.floor(sisa / 60) + ':' + ('0' + Math.floor(sisa % 60)).slice(-2), W - 12, H - 12);
    ctx.textAlign = 'left';
  }
  function menuPilih () {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '900 30px "Segoe UI", sans-serif';
    ctx.fillText('GUITAR FLASH', W / 2, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('▲ ▼ pilih lagu · ◀ ▶ tingkat · ● mulai', W / 2, 72);
    var top = 92, baris = 64;
    for (var i = 0; i < LAGU.length; i++) {
      var L = LAGU[i], y = top + i * baris, aktif = i === pilihan;
      ctx.fillStyle = aktif ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.045)';
      kotak(24, y, W - 48, baris - 12, 12);
      ctx.fill();
      if (aktif) { ctx.strokeStyle = L.warna; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = L.warna;
      ctx.beginPath(); ctx.arc(50, y + (baris - 12) / 2, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b0714'; ctx.font = '900 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), 50, y + (baris - 12) / 2 + 5);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff'; ctx.font = '800 16px "Segoe UI", sans-serif';
      ctx.fillText(L.nama, 74, y + 22);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText(L.bpm + ' BPM · ' + Math.floor(L.durasi) + ' dtk · ' + L.ket, 74, y + 38);
      /* pratinjau pola ketukan */
      var px = 74, py = y + 46, n = Math.min(28, L.pola.length), sw = (W - 120) / n;
      for (var k = 0; k < n; k++) {
        var v = L.pola[k], lane = -1;
        if (typeof v === 'number') lane = v;
        else if (typeof v === 'string' && v.charAt(0) === 'H') lane = parseInt(v.slice(1), 10) || 0;
        else if (Object.prototype.toString.call(v) === '[object Array]') lane = v[0];
        ctx.fillStyle = lane >= 0 ? WARNA[lane] : 'rgba(255,255,255,0.14)';
        var tinggi = (typeof v === 'string' && v.charAt(0) === 'H') ? 8 :
          (Object.prototype.toString.call(v) === '[object Array]' ? 6 : 4);
        ctx.fillRect(px + k * sw, py - (lane >= 0 ? tinggi / 2 : 1), Math.max(1, sw - 1.5), lane >= 0 ? tinggi : 2);
      }
      ctx.textAlign = 'center';
    }
    /* tingkat kesulitan */
    var dy = top + LAGU.length * baris + 8;
    for (var d = 0; d < DIFF.length; d++) {
      var dx = W / 2 + (d - 1) * 118, on = d === kesulitan;
      ctx.fillStyle = on ? '#ffd60a' : 'rgba(255,255,255,0.14)';
      kotak(dx - 52, dy, 104, 30, 15);
      ctx.fill();
      ctx.fillStyle = on ? '#20160a' : 'rgba(255,255,255,0.75)';
      ctx.font = '800 12px "Segoe UI", sans-serif';
      ctx.fillText(DIFF[d].nama, dx, dy + 20);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('hold · hammer-on · chord · solo · multiplier ×4', W / 2, dy + 48);
    ctx.textAlign = 'left';
  }
  function layarSelesai () {
    ctx.fillStyle = 'rgba(5,3,10,0.84)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    var total = hit.perfect + hit.good + hit.miss;
    var akurat = total ? (hit.perfect + hit.good * 0.6) / total : 0;
    var bintang = akurat > 0.95 ? 5 : akurat > 0.85 ? 4 : akurat > 0.7 ? 3 : akurat > 0.5 ? 2 : 1;
    var lulus = life > 0;
    ctx.fillStyle = lulus ? '#ffd60a' : '#ff453a';
    ctx.font = '900 34px "Segoe UI", sans-serif';
    ctx.fillText(lulus ? 'SONG CLEAR' : 'GAME OVER', W / 2, 74);
    ctx.fillStyle = '#ffd60a'; ctx.font = '900 26px "Segoe UI", sans-serif';
    var bintangTeks = '';
    for (var i = 0; i < 5; i++) bintangTeks += i < bintang ? '★' : '☆';
    ctx.fillText(bintangTeks, W / 2, 110);
    ctx.fillStyle = '#fff'; ctx.font = '900 40px "Segoe UI", sans-serif';
    ctx.fillText(String(Math.floor(score)), W / 2, 160);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('SKOR · TERBAIK ' + Math.floor(A.best), W / 2, 182);
    var barisY = 214;
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffd60a'; ctx.fillText('PERFECT  ' + hit.perfect, W / 2, barisY);
    ctx.fillStyle = '#30d158'; ctx.fillText('GOOD  ' + hit.good, W / 2, barisY + 24);
    ctx.fillStyle = '#ff453a'; ctx.fillText('MISS  ' + hit.miss, W / 2, barisY + 48);
    ctx.fillStyle = '#0a84ff'; ctx.fillText('HAMMER  ' + hit.hammer + '  ·  HOLD ' + hit.hold, W / 2, barisY + 72);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('MAX COMBO  ' + maxCombo, W / 2, barisY + 96);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('AKURASI  ' + Math.round(akurat * 100) + '%', W / 2, barisY + 120);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillText('● main lagi  ·  ▼ pilih lagu lain', W / 2, H - 30);
    ctx.textAlign = 'left';
  }
  function layarJeda () {
    ctx.fillStyle = 'rgba(5,3,10,0.7)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8'; ctx.font = '900 30px "Segoe UI", sans-serif';
    ctx.fillText('JEDA', W / 2, H / 2 - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillText('Space / ● lanjut  ·  ESC keluar ke pilih lagu', W / 2, H / 2 + 20);
    ctx.textAlign = 'left';
  }

  function draw () {
    ctx.save();
    if (shakeT > 0) ctx.translate(A.rand(-4, 4) * shakeT * 5, A.rand(-4, 4) * shakeT * 5);
    latar();
    if (mode === 'pilih') { menuPilih(); }
    else {
      lajur(); notes(); garisPukul(); partikelDraw(); hud();
      if (mode === 'jeda') layarJeda();
      if (mode === 'selesai') layarSelesai();
    }
    ctx.restore();
  }

  /* ---------- input ---------- */
  function mulaiAtauUlang () {
    if (mode === 'pilih') mulai();
    else if (mode === 'selesai') mulai();
    else if (mode === 'jeda') mode = 'main';
    else if (mode === 'main' && star >= 100 && starAktif <= 0) {
      starAktif = 8; star = 0;
      try { A.SFX.level(); } catch (e) {}
    }
  }
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    /* D-pad PRELUDE mengirim keydown SAAT ditekan dan keyup SAAT dilepas
       (lihat kirimKey di shell) — semua aksi sekali-tekan hanya di sini. */
    if (e.type !== 'keydown') return;
    if (mode === 'pilih') {
      if (k === 'ArrowUp') { pilihan = (pilihan + LAGU.length - 1) % LAGU.length; e.preventDefault(); }
      else if (k === 'ArrowDown') { pilihan = (pilihan + 1) % LAGU.length; e.preventDefault(); }
      else if (k === 'ArrowLeft') { kesulitan = (kesulitan + DIFF.length - 1) % DIFF.length; e.preventDefault(); }
      else if (k === 'ArrowRight') { kesulitan = (kesulitan + 1) % DIFF.length; e.preventDefault(); }
      else if (k === 'Space' || k === 'Enter') { mulai(); e.preventDefault(); }
      return;
    }
    if (k === 'Escape') { if (mode === 'main') mode = 'jeda'; else if (mode === 'jeda') mode = 'pilih'; e.preventDefault(); return; }
    if (k === 'Space') { mulaiAtauUlang(); e.preventDefault(); return; }
    for (var i = 0; i < LANES; i++) {
      if (KEY_LANE[i].indexOf(k) >= 0) { pukul(i); e.preventDefault(); return; }
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.type !== 'keyup') return;
    for (var i = 0; i < LANES; i++) if (KEY_LANE[i].indexOf(e.code) >= 0) { lepas(i); return; }
  });

  /* PRELUDE mengirim keydown/keyup ke window DAN ke canvas (lihat kirimKey di
     shell) — handler sentuh harus menolak event sintetis itu supaya sekali
     tekan D-pad tidak ikut memukul lajur / memindahkan pilihan. */
  function sintetik (e) { return !!e && (e.type === 'keydown' || e.type === 'keyup') }
  var MENU_TOP = 92, MENU_BARIS = 64;
  function pilihDariY (y) {
    var idx = Math.floor((y - MENU_TOP) / MENU_BARIS);
    if (idx < 0 || idx >= LAGU.length) return;
    if (pilihan === idx) mulai(); else pilihan = idx;
  }
  c.addEventListener('touchstart', function (e) {
    if (sintetik(e)) return;
    A.initAudio();
    var r = c.getBoundingClientRect();
    if (mode === 'pilih') {
      pilihDariY((e.touches[0].clientY - r.top) * (H / r.height));
      e.preventDefault(); return;
    }
    if (mode === 'selesai' || mode === 'jeda') { mulaiAtauUlang(); e.preventDefault(); return; }
    for (var i = 0; i < e.touches.length; i++) {
      var x = (e.touches[i].clientX - r.left) * (W / r.width);
      pukul(lajurDariX(x));
    }
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function (e) {
    if (sintetik(e)) return;
    var r = c.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var x = (e.changedTouches[i].clientX - r.left) * (W / r.width);
      lepas(lajurDariX(x));
    }
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function (e) {
    if (sintetik(e)) return;
    A.initAudio();
    var r = c.getBoundingClientRect();
    var x = (e.clientX - r.left) * (W / r.width);
    var y = (e.clientY - r.top) * (H / r.height);
    if (mode === 'pilih') { pilihDariY(y); return; }
    if (mode === 'selesai' || mode === 'jeda') { mulaiAtauUlang(); return; }
    pukul(lajurDariX(x));
  });
  c.addEventListener('mouseup', function (e) {
    if (sintetik(e)) return;
    var r = c.getBoundingClientRect();
    lepas(lajurDariX((e.clientX - r.left) * (W / r.width)));
  });

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    if (mode !== 'jeda') update(dt);
    draw();
    A.state = {
      mode: mode, score: Math.floor(score), over: mode === 'selesai', combo: combo, maxCombo: maxCombo,
      life: Math.round(life), star: Math.round(star), starAktif: +starAktif.toFixed(2),
      kali: kaliSkor(), bandMati: bandMati, solo: soloT >= 0, whammy: +whammy.toFixed(2),
      lagu: LAGU[pilihan].id, kesulitan: DIFF[kesulitan].nama, pilihan: pilihan,
      hit: hit, songT: +songT.toFixed(2), total: chart.length,
      holdAktif: Object.keys(holdAktif).length, keys: laneTekan.slice()
    };
    requestAnimationFrame(loop);
  }

  A.setStatus('PILIH LAGU', LAGU.length + ' lagu');
  A.setHint('▲▼ lagu · ◀▶ tingkat · ● mulai · D F J K = 4 lajur · tahan untuk hold');
  requestAnimationFrame(loop);
`

export function guitarFlashHtml (brand = 'THERYHANN!') {
  const data = LAGU.map(l => ({
    id: l.id, nama: l.nama, bpm: l.bpm, durasi: l.durasi, warna: l.warna, ket: l.ket, skala: l.skala, pola: l.pola
  }))
  return shell('Guitar Flash', brand, GUITAR_JS.replace('__LAGU__', JSON.stringify(data)), {
    w: 480, h: 780, maxw: 430,
    hint: '▲▼ pilih lagu · ◀▶ tingkat · ● mulai / STAR POWER · D F J K = lajur · tahan untuk hold',
    palette: ['#f43f5e', '#ffd60a'], sub: 'RHYTHM', pad: 'udlra'
  })
}

export default { guitarFlashHtml, LAGU }
