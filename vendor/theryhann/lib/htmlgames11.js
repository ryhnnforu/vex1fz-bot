/**
 * ============================================================
 *  lib/htmlgames11.js — 3 GAME "RUPA ASLI" (v7.8.3)
 * ------------------------------------------------------------
 *  • Flappy Bird  — burung kuning, pipa hijau, langit biru, tanah
 *                   bergaris, angka skor pixel ala aslinya. Pad: ● saja.
 *  • Pac-Man      — labirin biru klasik 28×31, pelet, power-pellet,
 *                   4 hantu (Blinky/Pinky/Inky/Clyde) + mode takut.
 *                   Pad: ▲▼◀▶ (tanpa ●).
 *  • Subway Surf  — lari 3 jalur perspektif, kereta & rintangan,
 *                   koin, papan luncur. Pad: ◀▶ jalur · ▲ lompat ·
 *                   ▼ guling · ● hoverboard.
 *  Semua: satu file HTML mandiri lewat shell() yang sama dengan
 *  arcade lain (D-pad, WebAudio, best score, kode setor lbgame).
 * ============================================================
 */
import { shell } from './htmlgames.js'
import { subwayHtml } from './subway3d.js'

/* ------------------------------------------------------------------ */
/*  FLAPPY BIRD                                                         */
/* ------------------------------------------------------------------ */
const FLAPPY_ASLI_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var TANAH_H = 112, GY = H - TANAH_H;
  var GRAV = 0.38, FLAP = -7.2, PIPA_W = 72, GAP = 160, JARAK = 220, KEC = 2.8;
  var bird, pipes, score, over, mulai, t, tanahX, flapAnim, mati, terbaik;

  function reset () {
    bird = { x: Math.round(W * 0.28), y: Math.round(GY * 0.45), vy: 0, rot: 0 };
    pipes = []; score = 0; over = false; mulai = false; t = 0; tanahX = 0; flapAnim = 0; mati = 0;
    A.setScore(0); A.setBest(); A.setStatus('TAP UNTUK MULAI', 'Pipa 0'); A.setProgress(0);
  }
  function flap () {
    A.initAudio();
    if (over) { if (mati > 30) reset(); return; }
    if (!mulai) { mulai = true; spawn(W * 0.75); }
    bird.vy = FLAP; A.SFX.jump();
  }
  function spawn (x) {
    var top = 90 + Math.random() * (GY - GAP - 180);
    pipes.push({ x: x, top: top, lewat: false });
  }
  function mati_ () {
    if (over) return;
    over = true; A.SFX.crash();
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('GAME OVER', 'Skor ' + score);
  }

  function update () {
    t++;
    if (!over) tanahX = (tanahX - KEC) % 24;
    if (!mulai) { bird.y = Math.round(GY * 0.45) + Math.sin(t / 9) * 6; flapAnim = Math.floor(t / 6) % 3; return; }
    bird.vy += GRAV; bird.y += bird.vy;
    bird.rot = Math.max(-0.45, Math.min(1.35, bird.vy * 0.09));
    if (!over) flapAnim = bird.vy < 0 ? Math.floor(t / 3) % 3 : 1;
    if (over) { mati++; if (bird.y + 12 >= GY) { bird.y = GY - 12; bird.vy = 0; } return; }
    if (pipes.length && pipes[pipes.length - 1].x < W - JARAK) spawn(W + 10);
    for (var i = 0; i < pipes.length; i++) {
      var p = pipes[i]; p.x -= KEC;
      if (!p.lewat && p.x + PIPA_W < bird.x) {
        p.lewat = true; score++; A.SFX.point(); A.setScore(score);
        A.setStatus('Skor ' + score, 'Pipa ' + score); A.setProgress((score % 10) / 10);
      }
      if (bird.x + 18 > p.x && bird.x - 18 < p.x + PIPA_W) {
        if (bird.y - 14 < p.top || bird.y + 14 > p.top + GAP) mati_();
      }
    }
    pipes = pipes.filter(function (p) { return p.x > -PIPA_W - 10; });
    if (bird.y - 12 < 0) { bird.y = 12; bird.vy = 0; }
    if (bird.y + 16 >= GY) { bird.y = GY - 16; mati_(); }
  }

  /* ---------- gambar bergaya sprite asli ---------- */
  function langit () {
    var g = ctx.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#4ec0ca'); g.addColorStop(1, '#70c5ce');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, GY);
    /* awan & kota (siluet sederhana, warna asli) */
    ctx.fillStyle = '#e9fbe8';
    for (var i = 0; i < 7; i++) { var cx = ((i * 97) + (t * 0.25)) % (W + 120) - 60; ctx.beginPath(); ctx.arc(cx, GY - 92, 26, 0, Math.PI * 2); ctx.arc(cx + 24, GY - 104, 30, 0, Math.PI * 2); ctx.arc(cx + 52, GY - 92, 24, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#dff5d4'; ctx.fillRect(0, GY - 84, W, 30);
    ctx.fillStyle = '#9fd6a3';
    for (var j = 0; j < 12; j++) { var bx = ((j * 61) + (t * 0.4)) % (W + 80) - 40; var bh = 22 + ((j * 37) % 26); ctx.fillRect(bx, GY - 54 - bh, 26, bh); }
    ctx.fillStyle = '#5ee270'; ctx.fillRect(0, GY - 56, W, 12);
    ctx.fillStyle = '#c8f7c5'; ctx.fillRect(0, GY - 44, W, 44);
    /* semak */
    ctx.fillStyle = '#7fd37f';
    for (var k = 0; k < 14; k++) { var sx = ((k * 48) + (t * 0.8)) % (W + 60) - 30; ctx.beginPath(); ctx.arc(sx, GY - 6, 22, Math.PI, 0); ctx.fill(); }
  }
  function tanah () {
    ctx.fillStyle = '#ded895'; ctx.fillRect(0, GY, W, TANAH_H);
    ctx.fillStyle = '#73bf2e'; ctx.fillRect(0, GY, W, 12);
    ctx.fillStyle = '#5a9e1f';
    for (var x = tanahX - 24; x < W + 24; x += 24) { ctx.beginPath(); ctx.moveTo(x, GY + 12); ctx.lineTo(x + 12, GY + 12); ctx.lineTo(x + 24, GY); ctx.lineTo(x + 12, GY); ctx.fill(); }
    ctx.fillStyle = '#543847'; ctx.fillRect(0, GY + 12, W, 2);
  }
  function pipa (p) {
    function badan (x, y, w, h) {
      var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#5fbd3a'); g.addColorStop(0.35, '#9be457'); g.addColorStop(0.6, '#73bf2e'); g.addColorStop(1, '#4f9f28');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#543847'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
    /* atas */
    badan(p.x + 3, -4, PIPA_W - 6, p.top - 24 + 4);
    badan(p.x, p.top - 26, PIPA_W, 26);
    /* bawah */
    badan(p.x, p.top + GAP, PIPA_W, 26);
    badan(p.x + 3, p.top + GAP + 24, PIPA_W - 6, GY - (p.top + GAP + 24) + 4);
  }
  function burung () {
    ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
    ctx.lineWidth = 2; ctx.strokeStyle = '#543847';
    /* badan kuning */
    ctx.scale(1.5, 1.5); ctx.fillStyle = '#f8d82c'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    /* perut */
    ctx.fillStyle = '#f9e9a0'; ctx.beginPath(); ctx.ellipse(-2, 5, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    /* sayap (3 frame) */
    var wy = flapAnim === 0 ? -6 : flapAnim === 1 ? 0 : 6;
    ctx.fillStyle = '#f4c542'; ctx.beginPath(); ctx.ellipse(-6, wy, 9, 5, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    /* mata */
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(9, -4, 2.4, 0, Math.PI * 2); ctx.fill();
    /* paruh oranye */
    ctx.fillStyle = '#f37020'; ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(22, 3); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(21, 7); ctx.lineTo(10, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function angkaBesar (n, x, y, size) {
    ctx.font = '900 ' + size + 'px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = Math.max(3, size / 8); ctx.strokeStyle = '#543847'; ctx.strokeText(String(n), x, y);
    ctx.fillStyle = '#fff'; ctx.fillText(String(n), x, y);
  }
  function papan () {
    var bw = 260, bh = 150, bx = (W - bw) / 2, by = GY * 0.32;
    ctx.fillStyle = '#ded895'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#543847'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#f4b73f'; ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
    ctx.font = '900 14px "Courier New", monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#e86a17';
    ctx.fillText('SKOR', bx + bw - 24, by + 40); ctx.fillText('TERBAIK', bx + bw - 24, by + 100);
    angkaBesar(score, bx + bw - 44, by + 72, 28); angkaBesar(A.best, bx + bw - 44, by + 132, 28);
    /* medali */
    var medal = score >= 40 ? '#e5e4e2' : score >= 30 ? '#ffd700' : score >= 20 ? '#c0c0c0' : score >= 10 ? '#cd7f32' : null;
    ctx.fillStyle = '#ded895'; ctx.beginPath(); ctx.arc(bx + 62, by + 82, 34, 0, Math.PI * 2); ctx.fill();
    if (medal) { ctx.fillStyle = medal; ctx.beginPath(); ctx.arc(bx + 62, by + 82, 28, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#543847'; ctx.font = '900 20px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('★', bx + 62, by + 90); }
    ctx.font = '900 12px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#543847'; ctx.fillText('MEDALI', bx + 62, by + 132);
  }
  function tulisanBesar (s, y, warna) {
    ctx.font = '900 44px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#543847'; ctx.strokeText(s, W / 2, y); ctx.fillStyle = warna; ctx.fillText(s, W / 2, y);
  }
  function draw () {
    langit();
    for (var i = 0; i < pipes.length; i++) pipa(pipes[i]);
    tanah(); burung();
    if (!mulai) {
      tulisanBesar('Flappy Bird', 92, '#fff');
      ctx.font = '900 16px "Courier New", monospace'; ctx.fillStyle = '#543847'; ctx.textAlign = 'center';
      ctx.fillText('KETUK / TEKAN ● UNTUK TERBANG', W / 2, GY * 0.62);
      /* tangan penunjuk */
      ctx.font = '900 34px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('👆', W / 2, GY * 0.62 + 44 + Math.sin(t / 8) * 4);
    } else if (!over) {
      angkaBesar(score, W / 2, 96, 64);
    } else {
      tulisanBesar('Game Over', GY * 0.22, '#f5a000');
      papan();
      if (mati > 30) { ctx.font = '900 15px "Courier New", monospace'; ctx.fillStyle = '#543847'; ctx.textAlign = 'center'; ctx.fillText('KETUK UNTUK MAIN LAGI', W / 2, GY * 0.32 + 190 + Math.sin(t / 8) * 2); }
    }
    A.state = { bird: bird, pipes: pipes, score: score, over: over, mulai: mulai };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }

  c.addEventListener('touchstart', function (e) { e.preventDefault(); flap(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { flap(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) flap(); }
  });
  reset(); requestAnimationFrame(loop);
`

export function flappyBirdHtml (brand = 'THERYHANN!') {
  return shell('Flappy Bird', brand, FLAPPY_ASLI_JS, {
    w: 400, h: 700, maxw: 380, sub: 'ARCADE', pad: 'a', padStyle: 'flappy',
    hint: '● atau ketuk layar = kepak sayap · lewati pipa hijau · 10 / 20 / 30 / 40 pipa = medali perunggu / perak / emas / platinum'
  })
}

/* ------------------------------------------------------------------ */
/*  PAC-MAN                                                             */
/* ------------------------------------------------------------------ */
const PACMAN_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  /* peta klasik 28×31 : # dinding · . pelet · o power · - pintu · ' ' kosong */
  var PETA_SRC = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###--### ##.#     ',
    '######.## #      # ##.######',
    '      .   #      #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################'
  ];
  var COLS = 28, ROWS = 31, T = Math.floor(Math.min(W / COLS, (H - 70) / ROWS));
  var OX = Math.floor((W - COLS * T) / 2), OY = 40;
  var peta, pelet, totalPelet, pac, hantu, skor, nyawa, level, over, menang, takut, frame, siap, deadAnim, buahT, buah;
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var WARNA_HANTU = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
  var NAMA_HANTU = ['Blinky', 'Pinky', 'Inky', 'Clyde'];

  function dinding (cx, cy) { if (cy < 0 || cy >= ROWS) return true; if (cx < 0 || cx >= COLS) return false; var ch = peta[cy][cx]; return ch === '#'; }
  function pintu (cx, cy) { return peta[cy] && peta[cy][cx] === '-'; }
  function bisa (cx, cy, hantuKah) { if (cx < 0 || cx >= COLS) return true; if (dinding(cx, cy)) return false; if (pintu(cx, cy) && !hantuKah) return false; return true; }

  function reset (semua) {
    if (semua) { skor = 0; nyawa = 3; level = 1; A.setScore(0); }
    peta = PETA_SRC.map(function (r) { return r; });
    pelet = {}; totalPelet = 0;
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) { var ch = peta[y][x]; if (ch === '.' || ch === 'o') { pelet[x + ',' + y] = ch; totalPelet++; } }
    posisiAwal(); over = false; menang = false; frame = 0; buah = null; buahT = 0;
    A.setBest(); A.setStatus('LEVEL ' + level, '❤'.repeat(nyawa)); A.setProgress(0);
  }
  function posisiAwal () {
    pac = { x: 13.5, y: 23, dir: 'left', mau: 'left', mulut: 0, hidup: true };
    hantu = [
      { x: 13.5, y: 11, dir: 'left', warna: WARNA_HANTU[0], nama: NAMA_HANTU[0], rumah: 0, mode: 'kejar', mati: false },
      { x: 13.5, y: 14, dir: 'up', warna: WARNA_HANTU[1], nama: NAMA_HANTU[1], rumah: 60, mode: 'kejar', mati: false },
      { x: 11.5, y: 14, dir: 'up', warna: WARNA_HANTU[2], nama: NAMA_HANTU[2], rumah: 180, mode: 'kejar', mati: false },
      { x: 15.5, y: 14, dir: 'up', warna: WARNA_HANTU[3], nama: NAMA_HANTU[3], rumah: 300, mode: 'kejar', mati: false }
    ];
    takut = 0; siap = 110; deadAnim = 0;
  }
  function tengah (v) { return Math.abs(v - Math.round(v)) < 0.08; }

  function gerakPac () {
    var sp = 0.11 + level * 0.005;
    var cx = Math.round(pac.x), cy = Math.round(pac.y);
    if (pac.mau !== pac.dir) {
      var d = DIRS[pac.mau];
      var balik = (DIRS[pac.dir][0] === -d[0] && DIRS[pac.dir][1] === -d[1]);
      if (balik || (tengah(pac.x) && tengah(pac.y) && bisa(cx + d[0], cy + d[1], false))) { if (!balik) { pac.x = cx; pac.y = cy; } pac.dir = pac.mau; }
    }
    var dd = DIRS[pac.dir];
    var nx = pac.x + dd[0] * sp, ny = pac.y + dd[1] * sp;
    var tx = Math.round(nx + dd[0] * 0.5), ty = Math.round(ny + dd[1] * 0.5);
    if (tengah(pac.x) && tengah(pac.y) && !bisa(cx + dd[0], cy + dd[1], false)) { pac.x = cx; pac.y = cy; return; }
    if (!bisa(tx, ty, false) && ((dd[0] && Math.abs(nx - cx) > 0.5) || (dd[1] && Math.abs(ny - cy) > 0.5))) { pac.x = cx; pac.y = cy; return; }
    pac.x = nx; pac.y = ny;
    if (pac.x < -0.5) pac.x = COLS - 0.5; if (pac.x > COLS - 0.5) pac.x = -0.5;
    pac.mulut = (pac.mulut + 0.25) % (Math.PI * 2);
    var k = Math.round(pac.x) + ',' + Math.round(pac.y);
    if (pelet[k]) {
      var pw = pelet[k] === 'o'; delete pelet[k]; skor += pw ? 50 : 10; totalPelet--;
      A.setScore(skor); if (frame % 2 === 0) A.SFX.point();
      if (pw) { takut = Math.max(240, 480 - level * 40); hantu.forEach(function (h) { if (!h.mati && h.rumah <= 0) h.mode = 'takut'; }); A.SFX.level(); }
      A.setProgress(1 - totalPelet / Math.max(1, Object.keys(pelet).length + totalPelet));
      if (totalPelet <= 0) { menang = true; setTimeout(function () { level++; reset(false); }, 1600); }
    }
    if (buah && Math.abs(pac.x - buah.x) < 0.6 && Math.abs(pac.y - buah.y) < 0.6) { skor += 100 * level; A.setScore(skor); buah = null; A.SFX.level(); }
  }
  function pilihArah (h, targetX, targetY) {
    var cx = Math.round(h.x), cy = Math.round(h.y);
    var opsi = [], balik = { up: 'down', down: 'up', left: 'right', right: 'left' }[h.dir];
    for (var k in DIRS) {
      if (k === balik) continue;
      var d = DIRS[k];
      if (bisa(cx + d[0], cy + d[1], true)) opsi.push({ k: k, jarak: Math.pow(cx + d[0] - targetX, 2) + Math.pow(cy + d[1] - targetY, 2) });
    }
    if (!opsi.length) return balik;
    if (h.mode === 'takut' && !h.mati) return opsi[Math.floor(Math.random() * opsi.length)].k;
    opsi.sort(function (a, b) { return a.jarak - b.jarak; });
    return opsi[0].k;
  }
  function gerakHantu (h, i) {
    if (h.rumah > 0) { h.rumah--; h.y = 14 + Math.sin(frame / 10 + i) * 0.4; if (h.rumah === 0) { h.x = 13.5; h.y = 11; h.dir = 'left'; } return; }
    var sp = h.mati ? 0.22 : h.mode === 'takut' ? 0.06 : 0.09 + level * 0.004;
    if (tengah(h.x) && tengah(h.y)) {
      h.x = Math.round(h.x); h.y = Math.round(h.y);
      var tx, ty;
      if (h.mati) { tx = 13; ty = 11; if (h.x === 13 && h.y === 11) { h.mati = false; h.mode = 'kejar'; } }
      else if (h.mode === 'takut') { tx = Math.random() * COLS; ty = Math.random() * ROWS; }
      else if (i === 0) { tx = pac.x; ty = pac.y; }
      else if (i === 1) { var d1 = DIRS[pac.dir]; tx = pac.x + d1[0] * 4; ty = pac.y + d1[1] * 4; }
      else if (i === 2) { tx = (frame % 600 < 420) ? pac.x + (Math.random() - 0.5) * 6 : 26; ty = (frame % 600 < 420) ? pac.y : 29; }
      else { var jr = Math.pow(h.x - pac.x, 2) + Math.pow(h.y - pac.y, 2); if (jr > 64) { tx = pac.x; ty = pac.y; } else { tx = 1; ty = 29; } }
      h.dir = pilihArah(h, tx, ty);
    }
    var dd = DIRS[h.dir];
    h.x += dd[0] * sp; h.y += dd[1] * sp;
    if (h.x < -0.5) h.x = COLS - 0.5; if (h.x > COLS - 0.5) h.x = -0.5;
  }
  function tabrakan () {
    for (var i = 0; i < hantu.length; i++) {
      var h = hantu[i]; if (h.rumah > 0 || h.mati) continue;
      if (Math.abs(h.x - pac.x) < 0.7 && Math.abs(h.y - pac.y) < 0.7) {
        if (h.mode === 'takut') { h.mati = true; h.mode = 'kejar'; skor += 200; A.setScore(skor); A.SFX.level(); }
        else { pac.hidup = false; deadAnim = 1; A.SFX.crash(); return; }
      }
    }
  }
  function update () {
    frame++;
    if (over || menang) return;
    if (siap > 0) { siap--; return; }
    if (!pac.hidup) {
      deadAnim++;
      if (deadAnim > 80) {
        nyawa--; A.setStatus('LEVEL ' + level, '❤'.repeat(Math.max(0, nyawa)));
        if (nyawa <= 0) { over = true; if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); } A.setStatus('GAME OVER', 'Skor ' + skor); }
        else posisiAwal();
      }
      return;
    }
    gerakPac();
    if (takut > 0) { takut--; if (takut === 0) hantu.forEach(function (h) { if (h.mode === 'takut') h.mode = 'kejar'; }); }
    for (var i = 0; i < hantu.length; i++) gerakHantu(hantu[i], i);
    tabrakan();
    buahT++; if (!buah && buahT % 900 === 450) buah = { x: 13.5, y: 17, t: 600 };
    if (buah && --buah.t <= 0) buah = null;
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
  }

  /* ---------- gambar ---------- */
  function px (cx) { return OX + (cx + 0.5) * T; }
  function py (cy) { return OY + (cy + 0.5) * T; }
  function gambarLabirin () {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2121de'; ctx.lineWidth = Math.max(2, T * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = '#2121de'; ctx.shadowBlur = 6;
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      if (peta[y][x] !== '#') continue;
      var X = OX + x * T, Y = OY + y * T;
      /* garis luar antar dinding-dan-jalan */
      ctx.beginPath();
      if (!dinding(x, y - 1) && y > 0) { ctx.moveTo(X, Y + 2); ctx.lineTo(X + T, Y + 2); }
      if (!dinding(x, y + 1) && y < ROWS - 1) { ctx.moveTo(X, Y + T - 2); ctx.lineTo(X + T, Y + T - 2); }
      if (x > 0 && !dinding(x - 1, y)) { ctx.moveTo(X + 2, Y); ctx.lineTo(X + 2, Y + T); }
      if (x < COLS - 1 && !dinding(x + 1, y)) { ctx.moveTo(X + T - 2, Y); ctx.lineTo(X + T - 2, Y + T); }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    /* pintu kandang */
    ctx.strokeStyle = '#ffb8de'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(OX + 13 * T, OY + 12.5 * T); ctx.lineTo(OX + 15 * T, OY + 12.5 * T); ctx.stroke();
    /* pelet */
    ctx.fillStyle = '#ffb897';
    for (var k in pelet) {
      var p = k.split(','), ex = px(+p[0]), ey = py(+p[1]);
      if (pelet[k] === 'o') { if (Math.floor(frame / 12) % 2) { ctx.beginPath(); ctx.arc(ex, ey, T * 0.36, 0, Math.PI * 2); ctx.fill(); } }
      else ctx.fillRect(ex - T * 0.1, ey - T * 0.1, T * 0.2, T * 0.2);
    }
    if (buah) { ctx.font = (T * 1.1) + 'px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['🍒', '🍓', '🍊', '🍎', '🍈', '🍇'][(level - 1) % 6], px(buah.x), py(buah.y)); }
  }
  function gambarPac () {
    var x = px(pac.x), y = py(pac.y), r = T * 0.62;
    var sudut = { right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2 }[pac.dir];
    var buka = pac.hidup ? Math.abs(Math.sin(pac.mulut)) * 0.9 + 0.05 : Math.min(Math.PI, deadAnim / 25);
    ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.moveTo(x, y);
    if (!pac.hidup && deadAnim > 78) return;
    ctx.arc(x, y, r, sudut + buka, sudut + Math.PI * 2 - buka); ctx.closePath(); ctx.fill();
  }
  function gambarHantu (h) {
    var x = px(h.x), y = py(h.y), r = T * 0.62;
    var takutKah = h.mode === 'takut' && !h.mati;
    var kedip = takutKah && takut < 90 && Math.floor(frame / 8) % 2;
    if (!h.mati) {
      ctx.fillStyle = takutKah ? (kedip ? '#fff' : '#2121de') : h.warna;
      ctx.beginPath(); ctx.arc(x, y - r * 0.15, r, Math.PI, 0);
      ctx.lineTo(x + r, y + r * 0.85);
      for (var i = 0; i < 3; i++) { var fx = x + r - (i * 2 + 1) * (r / 3); ctx.lineTo(fx, y + r * 0.55 + ((frame >> 3) % 2 ? 0 : r * 0.3)); ctx.lineTo(fx - r / 3, y + r * 0.85); }
      ctx.closePath(); ctx.fill();
    }
    /* mata */
    var dd = DIRS[h.dir];
    if (takutKah) {
      ctx.fillStyle = kedip ? '#f00' : '#ffb897'; ctx.fillRect(x - r * 0.45, y - r * 0.3, r * 0.25, r * 0.25); ctx.fillRect(x + r * 0.2, y - r * 0.3, r * 0.25, r * 0.25);
      ctx.strokeStyle = kedip ? '#f00' : '#ffb897'; ctx.lineWidth = 2; ctx.beginPath(); for (var z = 0; z < 5; z++) { var zx = x - r * 0.5 + z * r * 0.25; ctx.lineTo(zx, y + r * 0.3 + (z % 2 ? -r * 0.15 : 0)); } ctx.stroke();
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.2, r * 0.26, r * 0.32, 0, 0, Math.PI * 2); ctx.ellipse(x + r * 0.32, y - r * 0.2, r * 0.26, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2121de'; ctx.beginPath(); ctx.arc(x - r * 0.32 + dd[0] * r * 0.12, y - r * 0.2 + dd[1] * r * 0.12, r * 0.14, 0, Math.PI * 2); ctx.arc(x + r * 0.32 + dd[0] * r * 0.12, y - r * 0.2 + dd[1] * r * 0.12, r * 0.14, 0, Math.PI * 2); ctx.fill();
    }
  }
  function hud () {
    ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(T * 0.9) + 'px "Courier New", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('1UP', OX + T * 2, 18); ctx.fillText(String(skor).padStart(2, '0'), OX + T * 2, 34);
    ctx.textAlign = 'center'; ctx.fillText('HIGH SCORE', W / 2, 18); ctx.fillText(String(Math.max(A.best, skor)).padStart(2, '0'), W / 2, 34);
    /* nyawa */
    for (var i = 0; i < Math.max(0, nyawa - 1); i++) { ctx.fillStyle = '#ffe600'; ctx.beginPath(); var lx = OX + T * 1.5 + i * T * 1.4, ly = H - 14; ctx.moveTo(lx, ly); ctx.arc(lx, ly, T * 0.5, 0.6, Math.PI * 2 - 0.6); ctx.closePath(); ctx.fill(); }
    ctx.font = (T * 1.1) + 'px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.fillText(['🍒', '🍓', '🍊', '🍎', '🍈', '🍇'][(level - 1) % 6], W - OX - T, H - 8);
    ctx.font = '900 12px "Courier New", monospace'; ctx.fillStyle = '#ffe600'; ctx.textAlign = 'center';
    if (siap > 0 && !over) ctx.fillText('READY!', px(13.5), py(17) + 5);
    if (menang) ctx.fillText('LEVEL CLEAR!', px(13.5), py(17) + 5);
    if (over) { ctx.fillStyle = '#ff0000'; ctx.fillText('GAME  OVER', px(13.5), py(17) + 5); ctx.fillStyle = '#fff'; ctx.font = '700 11px "Courier New", monospace'; ctx.fillText('tekan arah untuk main lagi', px(13.5), py(19) + 5); }
  }
  function draw () {
    gambarLabirin(); gambarPac();
    for (var i = 0; i < hantu.length; i++) gambarHantu(hantu[i]);
    hud();
    A.state = { pac: pac, hantu: hantu, skor: skor, nyawa: nyawa, level: level, over: over, pelet: totalPelet, takut: takut };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }

  function arah (k) { A.initAudio(); if (over) { reset(true); return; } pac.mau = k; }
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { arah('up'); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { arah('down'); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { arah('left'); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { arah('right'); e.preventDefault(); }
    else if (k === 'Space' && over) { reset(true); e.preventDefault(); }
  });
  var ts = null;
  c.addEventListener('touchstart', function (e) { ts = e.touches[0]; e.preventDefault(); if (over) reset(true); }, { passive: false });
  c.addEventListener('touchend', function (e) {
    if (!ts) return; var dx = e.changedTouches[0].clientX - ts.clientX, dy = e.changedTouches[0].clientY - ts.clientY; ts = null;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    if (Math.abs(dx) > Math.abs(dy)) arah(dx > 0 ? 'right' : 'left'); else arah(dy > 0 ? 'down' : 'up');
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { if (over) reset(true); });
  reset(true); requestAnimationFrame(loop);
`

export function pacmanHtml (brand = 'THERYHANN!') {
  return shell('Pac-Man', brand, PACMAN_JS, {
    w: 560, h: 740, maxw: 520, sub: 'ARCADE', pad: 'udlr', padStyle: 'pacman',
    hint: '▲▼◀▶ atau geser = arah Pac-Man · makan semua pelet · pelet besar = hantu jadi biru, kejar & makan (200) · 3 nyawa'
  })
}

/* ------------------------------------------------------------------ */
/*  SUBWAY SURF (endless runner 3 jalur, perspektif)                    */
/* ------------------------------------------------------------------ */
/* v7.9.0: Subway Surf 3D dipindah ke lib/subway3d.js (kamera 3rd-person, kereta besar, ramp/atap, terowongan, jetpack) */
export { subwayHtml }

export const ARCADE_5 = [
  { id: 'flappybird', cmd: 'flappybird', icon: '🐦', nama: 'Flappy Bird', title: 'Flappy Bird', ket: 'burung kuning & pipa hijau persis aslinya — ● / tap kepak', ratio: '400×700', html: flappyBirdHtml },
  { id: 'pacman', cmd: 'pacman', icon: '🟡', nama: 'Pac-Man', title: 'Pac-Man', ket: 'labirin biru klasik, 4 hantu, power-pellet — ▲▼◀▶', ratio: '560×740', html: pacmanHtml },
  { id: 'subway', cmd: 'subway', icon: '🏃', nama: 'Subway Surf', title: 'Subway Surf', ket: 'lari 3 jalur, kereta & koin — ◀▶ ▲ ▼ ● hoverboard', ratio: '480×760', html: subwayHtml }
]

export default { flappyBirdHtml, pacmanHtml, subwayHtml, ARCADE_5 }
