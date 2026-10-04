/**
 * lib/htmlgames7.js — batch v7.4 (2/2): GAME JADUL / RETRO sebagai HTML APP
 * ---------------------------------------------------------------------------
 * Sama persis seperti .arcade: canvas + D-pad (▲▼◀▶ + ●) + WebAudio + best score
 * di localStorage. Tidak ada callback ke server, jadi semuanya client-side.
 *
 *   1. 🐸 POU JUMP        — doodle-jump, rasio 480×720 (portrait)
 *   2. 📟 SNAKE NOKIA     — LCD monokrom ala Nokia 3310, 480×480 (kotak)
 *   3. 👾 SPACE INVADER   — tembakan real-time, 560×640 (portrait)
 *
 * Kontrak harness (scripts/test-htmlapp74.js):
 *   - tiap frame set A.state = {...}      → dipakai autopilot
 *   - A.debug = { fn murni }              → dipakai assertion logika
 *   - tanpa input harus berakhir GAME OVER
 *
 * Catatan: string JS di bawah TIDAK boleh memuat backtick atau ${ karena
 * ditempel ke dalam template literal lalu digabung PRELUDE oleh shell().
 */

import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  1. 🐸 POU JUMP — 480×720                                           */
/* ------------------------------------------------------------------ */
const POU_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var GRAV = 0.44, VLOMPAT = -13.2, VPER = -21, VBOOST = -16.5;
  var R = 22, PW = 68, PH = 14;
  var TIPE = ['biasa', 'geser', 'rapuh', 'per'];
  var WARNA = ['#3ddc84', '#38b6ff', '#c98b4b', '#ffd700'];

  var pou, plats, musuh, part, tinggi, gameOver, runT, boostSisa, level, spawnY, mati, kedip;
  var idle = 0, IDLE = 900;   // 15 detik tanpa input = Pou ketiduran
  var keys = {};

  /* Platform baru dibatasi selisih horizontal maks 130px dari platform
     sebelumnya supaya SELALU ada jalur naik yang terjangkau (apex 192px,
     jangkauan geser ~186px). Tanpa ini pemain bisa terjebak memantul di
     satu platform tanpa bisa naik. */
  var lastX = null;
  function platBaru (y) {
    var r = Math.random();
    var tipe = 0;
    if (level > 1 && r > 0.86) tipe = 3;             // per
    else if (level > 2 && r > 0.70) tipe = 1;        // geser
    else if (level > 3 && r > 0.58) tipe = 2;        // rapuh
    var xBaru;
    if (lastX === null) xBaru = A.rand(14, W - PW - 14);
    else {
      xBaru = lastX + A.rand(-130, 130);
      if (xBaru < 14) xBaru = 14 + A.rand(0, 70);
      if (xBaru > W - PW - 14) xBaru = W - PW - 14 - A.rand(0, 70);
    }
    lastX = xBaru;
    var p = {
      x: xBaru, y: y, w: PW, h: PH, tipe: tipe,
      vx: tipe === 1 ? (Math.random() < 0.5 ? -1.6 : 1.6) * (1 + level * 0.12) : 0,
      hidup: true, goyang: 0
    };
    return p;
  }
  function tabrakPlat (px, py, pw, ph, ox, oy, ovy, or_) {
    if (ovy <= 0) return false;
    var kaki = oy + or_;
    if (kaki < py || kaki > py + ph + Math.abs(ovy) + 2) return false;
    return (ox + or_ > px) && (ox - or_ < px + pw);
  }
  function meter (t) { return Math.floor(t / 10); }

  function reset () {
    pou = { x: W / 2, y: H - 160, vy: VLOMPAT, vx: 0, muka: 1, squash: 0 };
    plats = []; musuh = []; part = [];
    tinggi = 0; gameOver = false; runT = 0; boostSisa = 3; level = 1; mati = 0; kedip = 0; idle = 0;
    lastX = null;
    spawnY = H - 90;
    for (var i = 0; i < 14; i++) {
      var p = platBaru(spawnY);
      if (i === 0) { p.x = W / 2 - PW / 2; p.tipe = 0; p.vx = 0; lastX = p.x; }
      plats.push(p);
      spawnY -= A.rand(58, 86);
    }
    A.setScore(0); A.setBest(); A.setProgress(0);
    A.setStatus('LVL 1', 'BOOST 3');
    A.setHint('◀▶ geser  ·  ▲/● lompat turbo (3×)  ·  ▼ terjun  ·  naik setinggi mungkin');
    keys = {};
  }

  function sembur (x, y, n, w) {
    for (var i = 0; i < n; i++) part.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-4, 1), r: A.rand(2, 5), a: 1, w: w });
  }
  function lompat (v, x, y) {
    pou.vy = v; pou.squash = 8; A.SFX.jump();
    sembur(x, y + R, 6, '#ffffff');
  }
  function pakaiBoost () {
    idle = 0;
    if (gameOver || boostSisa <= 0) return;
    boostSisa--; lompat(VBOOST, pou.x, pou.y);
    sembur(pou.x, pou.y + R, 16, '#ffd700');
    A.setStatus('LVL ' + level, 'BOOST ' + boostSisa);
  }
  function tamat (sebab) {
    if (gameOver) return;
    gameOver = true; mati = 1; A.SFX.crash();
    sembur(pou.x, pou.y, 26, '#ff5e5e');
    pesanAkhir = sebab;
    var s = meter(tinggi);
    if (s > A.best) { A.best = s; A.saveBest(s); }
    A.setBest(); A.setScore(s);
  }
  var pesanAkhir = '';

  function update (dt) {
    runT += dt; kedip += dt;
    if (gameOver) { mati += dt; return; }
    idle += dt;
    if (idle > IDLE) { tamat('POU KETIDURAN — AFK ' + Math.round(IDLE / 60) + ' detik'); return; }

    /* ---- gerak horizontal ---- */
    var accel = 0.9, maks = 6.2;
    if (keys.left) { pou.vx -= accel * dt; pou.muka = -1; }
    if (keys.right) { pou.vx += accel * dt; pou.muka = 1; }
    if (!keys.left && !keys.right) pou.vx *= Math.pow(0.86, dt);
    pou.vx = Math.max(-maks, Math.min(maks, pou.vx));
    pou.x += pou.vx * dt;
    if (pou.x < R) { pou.x = R; pou.vx = Math.abs(pou.vx) * 0.4; }
    if (pou.x > W - R) { pou.x = W - R; pou.vx = -Math.abs(pou.vx) * 0.4; }
    if (keys.down && pou.vy > 0) pou.vy += 0.7 * dt;

    /* ---- gravitasi ---- */
    pou.vy += GRAV * dt;
    if (pou.vy > 17) pou.vy = 17;
    pou.y += pou.vy * dt;
    if (pou.squash > 0) pou.squash -= dt;

    /* ---- platform ---- */
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      if (!p.hidup) continue;
      if (p.vx) {
        p.x += p.vx * dt;
        if (p.x < 8) { p.x = 8; p.vx = Math.abs(p.vx); }
        if (p.x + p.w > W - 8) { p.x = W - 8 - p.w; p.vx = -Math.abs(p.vx); }
      }
      if (p.goyang > 0) p.goyang -= dt;
      if (tabrakPlat(p.x, p.y, p.w, p.h, pou.x, pou.y, pou.vy, R)) {
        if (p.tipe === 2) { p.hidup = false; sembur(p.x + p.w / 2, p.y, 10, WARNA[2]); lompat(VLOMPAT * 0.92, pou.x, pou.y); }
        else if (p.tipe === 3) { p.goyang = 12; lompat(VPER, pou.x, pou.y); sembur(p.x + p.w / 2, p.y, 12, WARNA[3]); A.SFX.level(); }
        else { p.goyang = 8; lompat(VLOMPAT, pou.x, pou.y); }
      }
    }

    /* ---- kamera: naik ---- */
    var batas = H * 0.40;
    if (pou.y < batas) {
      var dy = (batas - pou.y) * dt;
      if (dy < 0.4) dy = 0.4;
      pou.y += dy; tinggi += dy;
      for (var j = 0; j < plats.length; j++) plats[j].y += dy;
      for (var k = 0; k < musuh.length; k++) musuh[k].y += dy;
      spawnY += dy;
      var s2 = meter(tinggi);
      A.setScore(s2);
      A.setProgress(Math.min(1, (s2 % 500) / 500));
      var lv = 1 + Math.floor(s2 / 250);
      if (lv !== level) {
        level = lv; A.SFX.level(); A.setStatus('LVL ' + level, 'BOOST ' + boostSisa);
        if (boostSisa < 5) { boostSisa++; A.setStatus('LVL ' + level, 'BOOST ' + boostSisa); }
      }
    }

    /* ---- buang yang lewat bawah + spawn baru ---- */
    plats = plats.filter(function (p) { return p.y < H + 40 && p.hidup; });
    musuh = musuh.filter(function (m) { return m.y < H + 40; });
    while (spawnY > -70) {
      var gap = Math.min(118, 62 + level * 3.2);
      spawnY -= A.rand(gap * 0.82, gap * 1.18);
      plats.push(platBaru(spawnY));
      if (level >= 3 && Math.random() < 0.20 + level * 0.02) {
        musuh.push({ x: A.rand(30, W - 30), y: spawnY - A.rand(10, 40), vx: (Math.random() < 0.5 ? -1 : 1) * A.rand(0.8, 1.9) * (1 + level * 0.1), r: 15, f: 0 });
      }
    }

    /* ---- musuh ---- */
    for (var m = 0; m < musuh.length; m++) {
      var e = musuh[m];
      e.x += e.vx * dt; e.f += dt;
      if (e.x < e.r) { e.x = e.r; e.vx = Math.abs(e.vx); }
      if (e.x > W - e.r) { e.x = W - e.r; e.vx = -Math.abs(e.vx); }
      var dx = e.x - pou.x, dy2 = e.y - pou.y;
      if (Math.sqrt(dx * dx + dy2 * dy2) < e.r + R - 4) { tamat('KETABRAK MONSTER di ' + meter(tinggi) + ' M'); return; }
    }

    /* ---- partikel ---- */
    for (var q = 0; q < part.length; q++) {
      var t = part[q];
      t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 0.16 * dt; t.a -= 0.02 * dt;
    }
    part = part.filter(function (t) { return t.a > 0; });

    /* ---- jatuh ---- */
    if (pou.y - R > H) tamat('JATUH di ' + meter(tinggi) + ' M');
  }

  /* ---------------- gambar ---------------- */
  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function gambarPou (x, y, sq, muka) {
    var rx = R + sq * 0.5, ry = R - sq * 0.6;
    ctx.save();
    ctx.translate(x, y);
    /* badan */
    var g = ctx.createRadialGradient(-6, -8, 4, 0, 0, rx + 6);
    g.addColorStop(0, '#c98b4b'); g.addColorStop(1, '#8a5a2b');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    /* kaki */
    ctx.fillStyle = '#6d4520';
    ctx.beginPath(); ctx.ellipse(-rx * 0.45, ry * 0.82, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(rx * 0.45, ry * 0.82, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    /* mata */
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-8 * muka + muka * 2, -7, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8 * muka + muka * 2, -7, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20140a';
    ctx.beginPath(); ctx.arc(-8 * muka + muka * 5, -6, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8 * muka + muka * 5, -6, 3.6, 0, Math.PI * 2); ctx.fill();
    /* mulut */
    ctx.strokeStyle = '#4d2f14'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(muka * 2, 6, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    /* pipi */
    ctx.fillStyle = 'rgba(255,120,120,0.35)';
    ctx.beginPath(); ctx.ellipse(-15, 3, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15, 3, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function draw () {
    /* langit bergradasi theo level */
    var th = A.theme(level - 1);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1026'); bg.addColorStop(0.55, '#16224a'); bg.addColorStop(1, '#2a1245');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* bintang paralaks */
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (var i = 0; i < 46; i++) {
      var sx = (i * 97) % W;
      var sy = ((i * 53 + tinggi * 0.25) % (H + 20)) - 10;
      ctx.fillRect(sx, sy, 2, 2);
    }
    /* platform */
    for (var j = 0; j < plats.length; j++) {
      var p = plats[j];
      if (!p.hidup || p.y < -20 || p.y > H + 20) continue;
      ctx.fillStyle = WARNA[p.tipe];
      bulat(p.x, p.y + (p.goyang > 0 ? 2 : 0), p.w, p.h, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.fillRect(p.x + 6, p.y + 3 + (p.goyang > 0 ? 2 : 0), p.w - 12, 3);
      if (p.tipe === 3) {
        ctx.fillStyle = '#ff5e00';
        ctx.fillRect(p.x + p.w / 2 - 5, p.y - 8, 10, 8);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(p.x + p.w / 2 - 8, p.y - 12, 16, 5);
      }
      if (p.tipe === 2) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x + 12, p.y + 2); ctx.lineTo(p.x + 20, p.y + p.h - 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + p.w - 16, p.y + 2); ctx.lineTo(p.x + p.w - 24, p.y + p.h - 2); ctx.stroke();
      }
    }
    /* musuh */
    for (var m = 0; m < musuh.length; m++) {
      var e = musuh[m];
      var wr = Math.sin(e.f * 0.18) * 2;
      ctx.fillStyle = '#ff4d6d';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r + wr, e.r - wr, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e.x - 5, e.y - 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x + 5, e.y - 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22060f';
      ctx.beginPath(); ctx.arc(e.x - 5, e.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(e.x + 5, e.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#22060f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y + 8, 5, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    }
    /* partikel */
    for (var q = 0; q < part.length; q++) {
      var t = part[q];
      ctx.globalAlpha = Math.max(0, t.a); ctx.fillStyle = t.w;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* Pou */
    if (!gameOver) gambarPou(pou.x, pou.y, pou.squash, pou.muka);

    /* HUD */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    bulat(W / 2 - 92, 10, 184, 40, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 22px "Segoe UI", sans-serif';
    ctx.fillText(meter(tinggi) + ' M', W / 2, 24);
    ctx.fillStyle = th.primary; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('LVL ' + level + '  ·  BOOST ' + boostSisa, W / 2, 41);
    /* indikator boost */
    for (var b = 0; b < 5; b++) {
      ctx.fillStyle = b < boostSisa ? '#ffd700' : 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.arc(24 + b * 17, 26, 6, 0, Math.PI * 2); ctx.fill();
    }
    if (idle > IDLE * 0.55) {
      ctx.fillStyle = 'rgba(255,77,109,' + (0.45 + 0.45 * Math.sin(kedip * 0.2)) + ')';
      ctx.font = '600 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('POU MENGANTUK — ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's', W / 2, 66);
      ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(4,6,18,0.82)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4d6d'; ctx.font = '800 40px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 60);
      ctx.fillStyle = '#fff'; ctx.font = '600 17px "Segoe UI", sans-serif';
      ctx.fillText(pesanAkhir, W / 2, H / 2 - 18);
      ctx.fillStyle = th.primary; ctx.font = '700 26px "Segoe UI", sans-serif';
      ctx.fillText(meter(tinggi) + ' METER', W / 2, H / 2 + 20);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('REKOR ' + A.best + ' M', W / 2, H / 2 + 50);
      if (Math.floor(kedip / 30) % 2 === 0) {
        ctx.fillStyle = '#fff'; ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 92);
      }
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    var dekat = [];
    for (var pi = 0; pi < plats.length; pi++) {
      var pq = plats[pi];
      if (pq.hidup && pq.y > pou.y - 30 && pq.y < pou.y + 300) dekat.push({ x: Math.round(pq.x), y: Math.round(pq.y), w: pq.w, t: pq.tipe });
    }
    A.state = { x: Math.round(pou.x), y: Math.round(pou.y), vy: Number(pou.vy.toFixed(2)), vx: Number(pou.vx.toFixed(2)), over: gameOver, score: meter(tinggi), tinggi: Math.round(tinggi), level: level, boost: boostSisa, idle: Math.round(idle), plats: dekat, jumlahPlat: plats.length, musuh: musuh.length, sebab: pesanAkhir };
    requestAnimationFrame(loop);
  }

  A.debug = { tabrakPlat: tabrakPlat, meter: meter, platBaru: platBaru };

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    idle = 0;
    if (tx < W * 0.3) { keys.left = true; keys.right = false; }
    else if (tx > W * 0.7) { keys.right = true; keys.left = false; }
    else pakaiBoost();
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys.left = false; keys.right = false; });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); else pakaiBoost(); });

  function setKey (k, v) {
    if (v) idle = 0;
    keys[k] = v;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = v;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = v;
    else if (k === 'ArrowDown' || k === 'KeyS') keys.down = v;
    else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') { if (v) pakaiBoost(); }
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); e.preventDefault(); return; }
    setKey(k, true);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { setKey(e.code, false); });

  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  2. 📟 SNAKE NOKIA — 480×480 (LCD monokrom)                         */
/* ------------------------------------------------------------------ */
const SNAKENOKIA_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var LCD = '#9ead86', LCD2 = '#8b9c74', PIX = '#1b2416', PIX2 = '#33402a';
  var CELL = 18, COLS = 22, ROWS = 21;
  var OX = Math.floor((W - COLS * CELL) / 2), OY = 54;

  /* font 3×5 untuk angka (ala 7-segment Nokia) */
  var DIGIT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    ' ': ['000', '000', '000', '000', '000'], '-': ['000', '000', '111', '000', '000']
  };
  function angka (txt, x, y, s, warna) {
    ctx.fillStyle = warna || PIX;
    var cx = x;
    for (var i = 0; i < txt.length; i++) {
      var g = DIGIT[txt[i]] || DIGIT[' '];
      for (var r = 0; r < 5; r++) for (var k = 0; k < 3; k++) if (g[r][k] === '1') ctx.fillRect(cx + k * s, y + r * s, s, s);
      cx += 4 * s;
    }
    return cx;
  }
  function lebarAngka (n, s) { return n * 4 * s - s; }

  var ular, arah, antrian, makanan, skor, gameOver, tickLen, acc, runT, level, dimakan, kedip, mulai;
  var keys = {};

  function selDepan (kepala, d) { return { x: kepala.x + d.x, y: kepala.y + d.y }; }
  function kena (s, arr, skipLast) {
    var n = arr.length - (skipLast ? 1 : 0);
    for (var i = 0; i < n; i++) if (arr[i].x === s.x && arr[i].y === s.y) return true;
    return false;
  }
  function taruhMakanan () {
    var kosong = [];
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) if (!kena({ x: x, y: y }, ular, false)) kosong.push({ x: x, y: y });
    if (!kosong.length) { makanan = null; return; }
    makanan = kosong[Math.floor(Math.random() * kosong.length)];
  }

  function reset () {
    ular = [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }];
    arah = { x: 1, y: 0 }; antrian = [];
    skor = 0; gameOver = false; tickLen = 9; acc = 0; runT = 0; level = 1; dimakan = 0; kedip = 0; mulai = 90;
    taruhMakanan();
    A.setScore(0); A.setBest(); A.setProgress(0);
    A.setStatus('LVL 1', 'KEC 9');
    A.setHint('◀▶▲▼ belok  ·  ● mulai ulang  ·  jangan kena dinding & badan sendiri');
    keys = {};
  }

  function belok (d) {
    if (d.x === -arah.x && d.y === -arah.y) return;    // tidak boleh putar balik
    if (d.x === arah.x && d.y === arah.y) return;
    antrian.push(d);
    if (antrian.length > 3) antrian.shift();
  }

  function langkah () {
    if (antrian.length) arah = antrian.shift();
    var baru = selDepan(ular[0], arah);
    /* dinding = mati (aturan Snake I Nokia) */
    if (baru.x < 0 || baru.y < 0 || baru.x >= COLS || baru.y >= ROWS) { tamat('KENA DINDING'); return; }
    if (kena(baru, ular, true)) { tamat('KENA BADAN SENDIRI'); return; }
    ular.unshift(baru);
    if (makanan && baru.x === makanan.x && baru.y === makanan.y) {
      skor += 10 * level; dimakan++; A.SFX.point();
      A.setScore(skor);
      A.setProgress(Math.min(1, (dimakan % 5) / 5));
      if (dimakan % 5 === 0) {
        level++; tickLen = Math.max(3, tickLen - 1); A.SFX.level();
        A.setStatus('LVL ' + level, 'KEC ' + tickLen);
      }
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      taruhMakanan();
    } else ular.pop();
  }
  function tamat (sebab) {
    if (gameOver) return;
    gameOver = true; pesanAkhir = sebab; A.SFX.crash();
    if (skor > A.best) { A.best = skor; A.saveBest(skor); }
    A.setBest(); A.setScore(skor);
  }
  var pesanAkhir = '';

  function update (dt) {
    runT += dt; kedip += dt;
    if (gameOver) return;
    if (mulai > 0) { mulai -= dt; return; }
    acc += dt;
    while (acc >= tickLen) { acc -= tickLen; langkah(); if (gameOver) break; }
  }

  /* ---------------- gambar ---------------- */
  function sel (x, y, inset) {
    var i = inset === undefined ? 2 : inset;
    ctx.fillRect(OX + x * CELL + i, OY + y * CELL + i, CELL - i * 2, CELL - i * 2);
  }
  function draw () {
    /* bodi LCD */
    ctx.fillStyle = '#2b2f2a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3c423a';
    ctx.fillRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = LCD;
    ctx.fillRect(16, 16, W - 32, H - 32);
    /* tekstur LCD */
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    for (var y = 16; y < H - 16; y += 3) ctx.fillRect(16, y, W - 32, 1);

    /* baris judul */
    ctx.fillStyle = PIX; ctx.font = '700 15px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('SNAKE  II', 28, 40);
    var sk = String(skor);
    while (sk.length < 5) sk = '0' + sk;
    angka(sk, W - 28 - lebarAngka(5, 3), 27, 3);
    /* garis pemisah */
    ctx.fillStyle = PIX; ctx.fillRect(24, 48, W - 48, 2);

    /* arena */
    ctx.strokeStyle = PIX; ctx.lineWidth = 3;
    ctx.strokeRect(OX - 3, OY - 3, COLS * CELL + 6, ROWS * CELL + 6);
    /* titik latar arena */
    ctx.fillStyle = LCD2;
    for (var gy = 0; gy < ROWS; gy++) for (var gx = 0; gx < COLS; gx++) ctx.fillRect(OX + gx * CELL + 8, OY + gy * CELL + 8, 2, 2);

    /* makanan (berkedip) */
    if (makanan && Math.floor(kedip / 8) % 4 !== 3) {
      ctx.fillStyle = PIX;
      sel(makanan.x, makanan.y, 3);
      ctx.fillRect(OX + makanan.x * CELL + 8, OY + makanan.y * CELL + 1, 2, 4);
    }

    /* ular */
    ctx.fillStyle = PIX;
    for (var i = 0; i < ular.length; i++) {
      var s = ular[i];
      if (s.x < 0 || s.y < 0 || s.x >= COLS || s.y >= ROWS) continue;
      sel(s.x, s.y, i === 0 ? 1 : 2);
    }
    /* mata kepala */
    var k = ular[0];
    ctx.fillStyle = LCD;
    var ex = OX + k.x * CELL, ey = OY + k.y * CELL;
    if (arah.x !== 0) {
      ctx.fillRect(ex + (arah.x > 0 ? 11 : 3), ey + 4, 3, 3);
      ctx.fillRect(ex + (arah.x > 0 ? 11 : 3), ey + 11, 3, 3);
    } else {
      ctx.fillRect(ex + 4, ey + (arah.y > 0 ? 11 : 3), 3, 3);
      ctx.fillRect(ex + 11, ey + (arah.y > 0 ? 11 : 3), 3, 3);
    }

    /* baris bawah: level + panjang */
    ctx.fillStyle = PIX;
    ctx.fillRect(24, H - 44, W - 48, 2);
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillText('LV ' + level, 28, H - 24);
    ctx.textAlign = 'center';
    ctx.fillText('PANJANG ' + ular.length, W / 2, H - 24);
    ctx.textAlign = 'right';
    ctx.fillText('BEST ' + A.best, W - 28, H - 24);
    ctx.textAlign = 'left';

    /* layar siap */
    if (!gameOver && mulai > 0) {
      ctx.fillStyle = 'rgba(154,173,134,0.86)';
      ctx.fillRect(OX, OY, COLS * CELL, ROWS * CELL);
      ctx.fillStyle = PIX; ctx.textAlign = 'center';
      ctx.font = '800 30px "Courier New", monospace';
      ctx.fillText('SNAKE II', W / 2, OY + 150);
      ctx.font = '700 14px "Courier New", monospace';
      ctx.fillText('Tekan ◀▶▲▼ untuk belok', W / 2, OY + 186);
      if (Math.floor(kedip / 22) % 2 === 0) ctx.fillText('SIAP...', W / 2, OY + 226);
      ctx.textAlign = 'left';
    }

    /* game over */
    if (gameOver) {
      ctx.fillStyle = 'rgba(154,173,134,0.9)';
      ctx.fillRect(OX, OY, COLS * CELL, ROWS * CELL);
      ctx.fillStyle = PIX; ctx.textAlign = 'center';
      ctx.font = '800 30px "Courier New", monospace';
      ctx.fillText('GAME OVER', W / 2, OY + 128);
      ctx.font = '700 14px "Courier New", monospace';
      ctx.fillText(pesanAkhir, W / 2, OY + 162);
      ctx.font = '800 22px "Courier New", monospace';
      ctx.fillText('SKOR ' + skor, W / 2, OY + 204);
      ctx.font = '700 13px "Courier New", monospace';
      ctx.fillText('REKOR ' + A.best, W / 2, OY + 230);
      if (Math.floor(kedip / 22) % 2 === 0) ctx.fillText('TEKAN ● / TAP ULANG', W / 2, OY + 268);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { x: ular[0].x, y: ular[0].y, dx: arah.x, dy: arah.y, len: ular.length, over: gameOver, score: skor, food: makanan ? { x: makanan.x, y: makanan.y } : null, level: level, tickLen: tickLen, mulai: Math.round(mulai), sebab: pesanAkhir, cols: COLS, rows: ROWS };
    requestAnimationFrame(loop);
  }

  A.debug = { selDepan: selDepan, kena: kena, COLS: COLS, ROWS: ROWS };

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var dx = tx - (OX + COLS * CELL / 2), dy = ty - (OY + ROWS * CELL / 2);
    if (Math.abs(dx) > Math.abs(dy)) belok(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    else belok(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });

  function setKey (k, v) {
    if (!v) return;
    keys[k] = v;
    if (k === 'ArrowLeft' || k === 'KeyA') belok({ x: -1, y: 0 });
    else if (k === 'ArrowRight' || k === 'KeyD') belok({ x: 1, y: 0 });
    else if (k === 'ArrowUp' || k === 'KeyW') belok({ x: 0, y: -1 });
    else if (k === 'ArrowDown' || k === 'KeyS') belok({ x: 0, y: 1 });
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); else mulai = 0; e.preventDefault(); return; }
    setKey(k, true);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
/*  3. 👾 SPACE INVADER — 560×640                                      */
/* ------------------------------------------------------------------ */
const INVADER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var PX = 2;                    /* 1 piksel sprite = 2px canvas */
  var BARIS = 5, KOLOM = 9, JARAKX = 46, JARAKY = 36;
  var POIN = [50, 40, 40, 30, 30];   /* baris atas paling mahal */

  /* sprite 11×8 piksel, 2 frame animasi per tipe */
  var SPR = [
    [['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'],
     ['00100000100', '10010001001', '10111111101', '11101110111', '11111111111', '01111111110', '00100000100', '01000000010']],
    [['00011111000', '01111111110', '11111111111', '11100100111', '11111111111', '00011011000', '00110001100', '11000000011'],
     ['00011111000', '01111111110', '11111111111', '11100100111', '11111111111', '00111011100', '01100000110', '00100000100']],
    [['00111111100', '01111111110', '11111111111', '11001001011', '11111111111', '00110011000', '01101001011', '00110000110'],
     ['00111111100', '01111111110', '11111111111', '11001001011', '11111111111', '00110011000', '01001111001', '10100000101']]
  ];
  var SPRKAPAL = ['0000001000000', '0000011100000', '0000011100000', '0111111111110', '1111111111111', '1111111111111', '1111111111111', '1111111111111'];

  function aabb (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function gambarSprite (pola, x, y, px, warna) {
    ctx.fillStyle = warna;
    for (var r = 0; r < pola.length; r++) {
      var bar = pola[r];
      var mulai = -1;
      for (var k = 0; k <= bar.length; k++) {
        var nyala = k < bar.length && bar[k] === '1';
        if (nyala && mulai < 0) mulai = k;
        if (!nyala && mulai >= 0) { ctx.fillRect(x + mulai * px, y + r * px, (k - mulai) * px, px); mulai = -1; }
      }
    }
  }

  var kapal, musuh, peluru, bom, part, skor, nyawa, wave, gameOver, runT, geser, langkah, frame, timerBom, kena, kedip, pesanAkhir;
  var keys = {};

  function susunMusuh () {
    musuh = [];
    var lebar = KOLOM * JARAKX;
    var x0 = (W - lebar) / 2 + (JARAKX - 11 * PX) / 2;
    for (var b = 0; b < BARIS; b++) {
      for (var k = 0; k < KOLOM; k++) {
        var tipe = b === 0 ? 0 : (b < 3 ? 1 : 2);
        musuh.push({ baris: b, kolom: k, tipe: tipe, x: x0 + k * JARAKX, y: 84 + b * JARAKY + (wave - 1) * 12, w: 11 * PX, h: 8 * PX, hidup: true });
      }
    }
    langkah = Math.max(5, 15 - wave * 2);
    geser = 12 + wave;
    timerBom = 100;
  }
  function reset () {
    kapal = { x: W / 2 - 13, y: H - 62, w: 13 * PX, h: 8 * PX, vx: 0, inv: 0 };
    peluru = []; bom = []; part = [];
    skor = 0; nyawa = 3; wave = 1; gameOver = false; runT = 0; frame = 0; kena = 0; kedip = 0; pesanAkhir = '';
    susunMusuh();
    A.setScore(0); A.setBest(); A.setProgress(0);
    A.setStatus('WAVE 1', 'NYAWA 3');
    A.setHint('◀▶ geser  ·  ●/▲ tembak  ·  habiskan 45 invader sebelum mendarat');
    keys = {};
  }
  function waveBaru () {
    wave++; A.SFX.level();
    peluru = []; bom = [];
    susunMusuh();
    A.setStatus('WAVE ' + wave, 'NYAWA ' + nyawa);
  }
  function sembur (x, y, n, w) {
    for (var i = 0; i < n; i++) part.push({ x: x, y: y, vx: A.rand(-3.4, 3.4), vy: A.rand(-3.4, 3.4), r: A.rand(1.6, 4), a: 1, w: w });
  }
  function tembak () {
    if (gameOver || peluru.length >= 2) return;
    peluru.push({ x: kapal.x + kapal.w / 2 - 2, y: kapal.y - 12, w: 4, h: 12 });
    A.SFX.point();
  }
  function tamat (sebab) {
    if (gameOver) return;
    gameOver = true; pesanAkhir = sebab; A.SFX.crash();
    sembur(kapal.x + kapal.w / 2, kapal.y, 30, '#ff5e00');
    if (skor > A.best) { A.best = skor; A.saveBest(skor); }
    A.setBest(); A.setScore(skor);
  }

  function update (dt) {
    runT += dt; kedip += dt;
    if (gameOver) return;
    frame += dt;

    /* kapal */
    var maks = 5.6 + wave * 0.15;
    if (keys.left) kapal.vx -= 0.85 * dt;
    if (keys.right) kapal.vx += 0.85 * dt;
    if (!keys.left && !keys.right) kapal.vx *= Math.pow(0.82, dt);
    kapal.vx = Math.max(-maks, Math.min(maks, kapal.vx));
    kapal.x += kapal.vx * dt;
    if (kapal.x < 14) { kapal.x = 14; kapal.vx = 0; }
    if (kapal.x + kapal.w > W - 14) { kapal.x = W - 14 - kapal.w; kapal.vx = 0; }
    if (kapal.inv > 0) kapal.inv -= dt;

    /* gerombolan invader */
    var hidup = musuh.filter(function (m) { return m.hidup; });
    if (!hidup.length) { waveBaru(); }
    else {
      var kiri = W, kanan = 0, bawah = 0;
      for (var i = 0; i < hidup.length; i++) {
        if (hidup[i].x < kiri) kiri = hidup[i].x;
        if (hidup[i].x + hidup[i].w > kanan) kanan = hidup[i].x + hidup[i].w;
        if (hidup[i].y + hidup[i].h > bawah) bawah = hidup[i].y + hidup[i].h;
      }
      if (frame >= langkah) {
        frame = 0;
        var turun = false;
        if (geser > 0 && kanan + 10 >= W - 10) { geser = -Math.abs(geser); turun = true; }
        else if (geser < 0 && kiri - 10 <= 10) { geser = Math.abs(geser); turun = true; }
        for (var j = 0; j < musuh.length; j++) {
          if (turun) musuh[j].y += 18; else musuh[j].x += geser;
        }
        A.SFX.jump();
      }
      if (bawah >= kapal.y - 6) { tamat('INVADER MENDARAT — wave ' + wave); return; }

      /* invader menembak: pilih kolom paling dekat kapal, baris paling bawah */
      timerBom -= dt;
      if (timerBom <= 0) {
        timerBom = Math.max(30, 100 - wave * 7 - Math.floor((45 - hidup.length) / 3));
        /* 60% membidik kolom kapal (pemain diam pasti kena), 40% acak
           supaya pemain yang bergerak lincah masih bisa bernapas. */
        var membidik = Math.random() < 0.6;
        var pusat = kapal.x + kapal.w / 2, pilih = null, jarak = 1e9;
        if (!membidik) pilih = hidup[Math.floor(Math.random() * hidup.length)];
        for (var m = 0; pilih === null && m < hidup.length; m++) {
          var cx = hidup[m].x + hidup[m].w / 2;
          var d = Math.abs(cx - pusat);
          if (d < jarak) { pilih = hidup[m]; jarak = d; }
        }
        /* ambil yang paling bawah di kolom terpilih */
        if (pilih) {
          var kolom = pilih.kolom, terendah = pilih;
          for (var n = 0; n < hidup.length; n++) if (hidup[n].kolom === kolom && hidup[n].y > terendah.y) terendah = hidup[n];
          bom.push({ x: terendah.x + terendah.w / 2 - 2, y: terendah.y + terendah.h, w: 4, h: 10, v: 3.6 + wave * 0.28 });
        }
      }
    }

    /* peluru pemain */
    for (var p = 0; p < peluru.length; p++) peluru[p].y -= 9.4 * dt;
    peluru = peluru.filter(function (b) { return b.y > -20; });
    /* bom invader */
    for (var q = 0; q < bom.length; q++) bom[q].y += bom[q].v * dt;
    bom = bom.filter(function (b) { return b.y < H + 20; });

    /* tabrakan peluru vs invader */
    for (var a = peluru.length - 1; a >= 0; a--) {
      var pl = peluru[a], dapat = false;
      for (var z = 0; z < musuh.length; z++) {
        var e = musuh[z];
        if (!e.hidup) continue;
        if (aabb(pl, e)) {
          e.hidup = false; peluru.splice(a, 1); dapat = true;
          var poin = POIN[e.baris] * wave;
          skor += poin; kena++; A.SFX.crash();
          sembur(e.x + e.w / 2, e.y + e.h / 2, 14, e.baris === 0 ? '#ffd700' : '#00f3ff');
          A.setScore(skor);
          A.setStatus('WAVE ' + wave, 'NYAWA ' + nyawa);
          A.setProgress(1 - musuh.filter(function (mm) { return mm.hidup; }).length / (BARIS * KOLOM));
          if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
          break;
        }
      }
      if (dapat) continue;
    }

    /* bom vs kapal */
    if (kapal.inv <= 0) {
      for (var b2 = bom.length - 1; b2 >= 0; b2--) {
        if (aabb(bom[b2], kapal)) {
          bom.splice(b2, 1); nyawa--; kapal.inv = 100; kapal.vx = 0;
          sembur(kapal.x + kapal.w / 2, kapal.y, 20, '#ff4d6d');
          A.SFX.crash();
          A.setStatus('WAVE ' + wave, 'NYAWA ' + nyawa);
          if (nyawa <= 0) { tamat('KAPAL HANCUR — skor ' + skor); return; }
          break;
        }
      }
    }

    /* partikel */
    for (var t2 = 0; t2 < part.length; t2++) {
      var pp = part[t2];
      pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.a -= 0.022 * dt;
    }
    part = part.filter(function (pp) { return pp.a > 0; });
  }

  /* ---------------- gambar ---------------- */
  function draw () {
    var th = A.theme(wave - 1);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04060f'); bg.addColorStop(1, '#120a26');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* bintang */
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (var i = 0; i < 60; i++) {
      var sx = (i * 89) % W, sy = ((i * 61 + runT * 0.5) % H);
      ctx.fillRect(sx, sy, 2, 2);
    }
    /* garis tanah retro */
    ctx.strokeStyle = th.secondary; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H - 34); ctx.lineTo(W, H - 34); ctx.stroke();
    ctx.globalAlpha = 1;

    /* invader */
    var anim = Math.floor(frame / Math.max(2, langkah * 0.5)) % 2;
    for (var m = 0; m < musuh.length; m++) {
      var e = musuh[m];
      if (!e.hidup) continue;
      var warna = e.baris === 0 ? '#ffd700' : (e.baris < 3 ? '#00f3ff' : '#3ddc84');
      gambarSprite(SPR[e.tipe][anim], e.x, e.y, PX, warna);
    }
    /* kapal */
    if (!gameOver && !(kapal.inv > 0 && Math.floor(kedip / 4) % 2 === 0)) {
      gambarSprite(SPRKAPAL, kapal.x, kapal.y, PX, th.primary);
      ctx.fillStyle = '#fff';
      ctx.fillRect(kapal.x + kapal.w / 2 - 1, kapal.y - 4, 2, 4);
    }
    /* peluru */
    ctx.fillStyle = '#fff';
    for (var p = 0; p < peluru.length; p++) ctx.fillRect(peluru[p].x, peluru[p].y, peluru[p].w, peluru[p].h);
    /* bom */
    for (var b = 0; b < bom.length; b++) {
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(bom[b].x, bom[b].y, bom[b].w, bom[b].h);
      ctx.fillStyle = 'rgba(255,77,109,0.4)';
      ctx.fillRect(bom[b].x - 1, bom[b].y + bom[b].h, bom[b].w + 2, 5);
    }
    /* partikel */
    for (var q = 0; q < part.length; q++) {
      var pp = part[q];
      ctx.globalAlpha = Math.max(0, pp.a); ctx.fillStyle = pp.w;
      ctx.fillRect(pp.x, pp.y, pp.r, pp.r);
    }
    ctx.globalAlpha = 1;

    /* HUD */
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff'; ctx.font = '700 20px "Courier New", monospace';
    ctx.fillText('SKOR', 18, 30);
    ctx.fillStyle = th.primary; ctx.font = '800 26px "Courier New", monospace';
    var sk = String(skor); while (sk.length < 5) sk = '0' + sk;
    ctx.fillText(sk, 18, 56);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = '700 16px "Courier New", monospace';
    ctx.fillText('WAVE ' + wave, W / 2, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 12px "Courier New", monospace';
    ctx.fillText(musuh.filter(function (e2) { return e2.hidup; }).length + ' / ' + (BARIS * KOLOM) + ' INVADER', W / 2, 50);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff'; ctx.font = '700 16px "Courier New", monospace';
    ctx.fillText('NYAWA', W - 18, 30);
    for (var n = 0; n < 3; n++) {
      if (n < nyawa) gambarSprite(SPRKAPAL, W - 46 - n * 30, 38, 1.6, '#ff4d6d');
      else gambarSprite(SPRKAPAL, W - 46 - n * 30, 38, 1.6, 'rgba(255,255,255,0.18)');
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(4,6,15,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4d6d'; ctx.font = '800 42px "Courier New", monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 66);
      ctx.fillStyle = '#fff'; ctx.font = '600 16px "Segoe UI", sans-serif';
      ctx.fillText(pesanAkhir, W / 2, H / 2 - 26);
      ctx.fillStyle = th.primary; ctx.font = '800 30px "Courier New", monospace';
      ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 16);
      ctx.fillStyle = '#ffd700'; ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillText('REKOR ' + A.best + '  ·  ' + kena + ' INVADER DITEMBAK  ·  WAVE ' + wave, W / 2, H / 2 + 46);
      if (Math.floor(kedip / 26) % 2 === 0) {
        ctx.fillStyle = '#fff'; ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 88);
      }
      ctx.textAlign = 'left';
      return;
    }
    ctx.textAlign = 'left';
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 3); last = t;
    update(dt); draw();
    A.state = { x: Math.round(kapal.x), y: Math.round(kapal.y), vx: Number(kapal.vx.toFixed(2)), lives: nyawa, over: gameOver, score: skor, wave: wave, foes: musuh.filter(function (e) { return e.hidup; }).length, bullets: peluru.length, bombs: bom.length, hits: kena, geser: geser, inv: Math.max(0, Math.round(kapal.inv)), sebab: pesanAkhir };
    requestAnimationFrame(loop);
  }

  A.debug = { aabb: aabb, POIN: POIN, SPR: SPR, SPRKAPAL: SPRKAPAL };

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    if (ty > H * 0.55) { if (tx < W / 2) { keys.left = true; keys.right = false; } else { keys.right = true; keys.left = false; } }
    else tembak();
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys.left = false; keys.right = false; });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); else tembak(); });

  function setKey (k, v) {
    keys[k] = v;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = v;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = v;
    else if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') { if (v) tembak(); }
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); e.preventDefault(); return; }
    setKey(k, true);
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { setKey(e.code, false); });

  reset();
  requestAnimationFrame(loop);
`

/* ---------------- ekspor shell ---------------- */

export function pouHtml (brand = 'THERYHANN!') {
  return shell('Pou Jump Retro', brand, POU_JS, {
    w: 480, h: 720, maxw: 460,
    hint: '\u25C0 \u25B6 geser Pou  \u00B7  \u25B2/\u25CF lompat turbo (3\u00D7)  \u00B7  \u25BC terjun  \u00B7  naik setinggi mungkin'
  })
}
export function snakeNokiaHtml (brand = 'THERYHANN!') {
  return shell('Snake Nokia 3310', brand, SNAKENOKIA_JS, {
    w: 480, h: 480, maxw: 460,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 belok  \u00B7  \u25CF mulai / ulang  \u00B7  LCD monokrom ala HP jadul'
  })
}
export function invaderHtml (brand = 'THERYHANN!') {
  return shell('Space Invader Retro', brand, INVADER_JS, {
    w: 560, h: 640, maxw: 520,
    hint: '\u25C0 \u25B6 geser kapal  \u00B7  \u25CF/\u25B2 tembak  \u00B7  habiskan 45 invader per wave'
  })
}

/** daftar game jadul v7.4 (dipakai menu + test) */
export const JADUL_HTML = [
  { id: 'pou', cmd: 'poujump', icon: '\u{1F438}', title: 'Pou Jump Retro', nama: 'Pou Jump Retro', html: pouHtml, ratio: '480\u00D7720', w: 480, h: 720 },
  { id: 'snakenokia', cmd: 'snakenokia', icon: '\u{1F4DF}', title: 'Snake Nokia 3310', nama: 'Snake Nokia 3310', html: snakeNokiaHtml, ratio: '480\u00D7480', w: 480, h: 480 },
  { id: 'invader', cmd: 'spaceinvader', icon: '\u{1F47E}', title: 'Space Invader Retro', nama: 'Space Invader Retro', html: invaderHtml, ratio: '560\u00D7640', w: 560, h: 640 }
]
