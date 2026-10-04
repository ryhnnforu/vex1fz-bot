/**
 * 🕹️ ARCADE HTML v7.2 — 5 game baru (Frogger, Maze, Racer, Tank, Hunt)
 * ---------------------------------------------------------------------
 *  Semua game memakai shell() bersama dari lib/htmlgames.js:
 *  kartu neon + HUD (skor/best/status/progress) + D-pad on-screen
 *  (▲ ▼ ◀ ▶ + ●) + WebAudio + best score di localStorage.
 *
 *  Ciri khas batch ini:
 *   • SEMUA game dikendalikan 4 arah (atas/bawah/kiri/kanan) + tombol aksi
 *   • SETIAP game punya RATIO canvas sendiri (portrait / square / landscape)
 *   • payload self-contained: 1 <script>, 0 resource eksternal
 *
 *  Kontrak: A.state diisi SETELAH update()+draw(), berisi minimal
 *  { score, over }, dan saat mati wajib menggambar teks 'GAME OVER'.
 */
import { shell } from './htmlgames.js'

/* ================================================================== */
/*  1. FROGGER NEON  — 560x620 (portrait)  — grid 4 arah               */
/* ================================================================== */
const FROGGER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var STEP = 40, ROW = 56, START_Y = 580, GOAL_ROW = 76;
  var frog, cars, logs, score, lives, level, gameOver, runT, timer, keys, moveCd, slots, parts, stars;

  function lajur (y, spd, tipe, n, lebar) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push({ x: (W / n) * i + A.rand(-30, 30), y: y, w: lebar, h: 30, vx: spd });
    return arr;
  }
  function bangun () {
    cars = []; logs = [];
    var sp = 1 + level * 0.35;
    cars.push(lajur(524, sp * 1.0, 'car', 3, 62));
    cars.push(lajur(468, -sp * 1.25, 'car', 3, 58));
    cars.push(lajur(412, sp * 0.9, 'car', 2, 74));
    cars.push(lajur(356, -sp * 1.4, 'car', 3, 54));
    logs.push(lajur(244, sp * 0.85, 'log', 3, 104));
    logs.push(lajur(188, -sp * 1.05, 'log', 3, 88));
    logs.push(lajur(132, sp * 0.7, 'log', 2, 120));
  }
  function reset () {
    frog = { x: W / 2, y: START_Y, w: 30, h: 30 };
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0; timer = 1500; keys = {}; moveCd = 0;
    slots = [false, false, false, false]; parts = []; stars = [];
    for (var i = 0; i < 34; i++) stars.push({ x: A.rand(0, W), y: A.rand(0, H), s: A.rand(0.6, 1.8) });
    bangun();
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Nyawa 3'); A.setProgress(1);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: A.rand(-3.5, 3.5), vy: A.rand(-3.5, 3.5), life: 1, size: A.rand(2, 5), warna: warna });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash(); ledak(frog.x, frog.y, '#ffffff', 24);
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function kena () {
    if (gameOver) return;
    lives--; A.SFX.crash(); ledak(frog.x, frog.y, '#ff0055', 18);
    if (lives <= 0) { mati(); return; }
    frog.x = W / 2; frog.y = START_Y; timer = 1500;
    A.setStatus('Level ' + level, 'Nyawa ' + lives);
  }
  function zona (y) {
    if (y < 104) return 'goal';
    if (y < 272) return 'river';
    if (y < 328) return 'safe';
    if (y < 552) return 'road';
    return 'start';
  }
  function kotak (a, b, pad) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 - pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 - pad;
  }
  function sampaiGoal () {
    var idx = -1;
    for (var i = 0; i < 4; i++) {
      var sx = (W / 4) * i + W / 8;
      if (!slots[i] && Math.abs(frog.x - sx) < W / 8 - 6) { idx = i; break; }
    }
    if (idx < 0) { kena(); return; }
    slots[idx] = true;
    var bonus = Math.floor(timer / 12);
    score += 120 + bonus; A.SFX.level(); ledak(frog.x, frog.y, '#00ff87', 22);
    frog.x = W / 2; frog.y = START_Y; timer = 1500;
    if (slots.every(function (v) { return v; })) {
      level++; slots = [false, false, false, false]; score += 300; bangun();
      A.setStatus('Level ' + level, 'Nyawa ' + lives);
    }
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    timer -= dt;
    if (timer <= 0) { kena(); return; }

    if (moveCd > 0) moveCd -= dt;
    if (moveCd <= 0) {
      var gx = 0, gy = 0;
      if (keys.left) gx -= 1;
      if (keys.right) gx += 1;
      if (keys.up) gy -= 1;
      if (keys.down) gy += 1;
      if (gx || gy) {
        frog.x += gx * STEP; frog.y += gy * ROW;
        frog.x = Math.max(18, Math.min(W - 18, frog.x));
        frog.y = Math.max(GOAL_ROW, Math.min(START_Y, frog.y));
        moveCd = 8; A.SFX.jump();
        if (zona(frog.y) === 'goal') sampaiGoal();
      }
    }

    cars.forEach(function (laj) {
      laj.forEach(function (m) {
        m.x += m.vx * dt;
        if (m.vx > 0 && m.x > W + 60) m.x = -70;
        if (m.vx < 0 && m.x < -70) m.x = W + 60;
      });
    });
    var naikLog = null;
    logs.forEach(function (laj) {
      laj.forEach(function (m) {
        m.x += m.vx * dt;
        if (m.vx > 0 && m.x > W + 80) m.x = -90;
        if (m.vx < 0 && m.x < -90) m.x = W + 80;
        if (zona(frog.y) === 'river' && kotak(frog, m, 2)) naikLog = m;
      });
    });
    if (naikLog) frog.x += naikLog.vx * dt;
    frog.x = Math.max(14, Math.min(W - 14, frog.x));

    var z = zona(frog.y);
    if (z === 'road') {
      for (var i = 0; i < cars.length; i++) {
        for (var j = 0; j < cars[i].length; j++) if (kotak(frog, cars[i][j], 4)) { kena(); return; }
      }
    } else if (z === 'river' && !naikLog) { kena(); return; }

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setProgress(timer / 1500);
    A.setStatus('Level ' + level + ' \\u00B7 slot ' + slots.filter(Boolean).length + '/4',
      'Nyawa ' + lives + ' \\u00B7 waktu ' + Math.ceil(timer / 60) + 's');
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05070f'); bg.addColorStop(1, '#0d1424');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    stars.forEach(function (s) { ctx.globalAlpha = 0.2 + s.s * 0.2; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    // zona goal
    ctx.fillStyle = 'rgba(0,255,135,0.12)'; ctx.fillRect(0, 0, W, 104);
    for (var i = 0; i < 4; i++) {
      var sx = (W / 4) * i + 8;
      ctx.strokeStyle = slots[i] ? '#00ff87' : 'rgba(0,255,135,0.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, 14, W / 4 - 16, 76);
      if (slots[i]) { ctx.fillStyle = '#00ff87'; ctx.fillRect(sx + 8, 22, W / 4 - 32, 60); }
    }
    // sungai
    ctx.fillStyle = 'rgba(0,140,255,0.16)'; ctx.fillRect(0, 104, W, 168);
    for (var wx = 0; wx < W; wx += 26) {
      ctx.fillStyle = 'rgba(96,239,255,0.14)';
      ctx.fillRect(wx + ((runT * 0.6) % 26), 112, 12, 152);
    }
    // median
    ctx.fillStyle = 'rgba(0,243,255,0.08)'; ctx.fillRect(0, 272, W, 56);
    // jalan
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 328, W, 224);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([16, 14]);
    for (var ly = 384; ly < 552; ly += 56) { ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke(); }
    ctx.setLineDash([]);
    // zona start
    ctx.fillStyle = 'rgba(157,78,221,0.12)'; ctx.fillRect(0, 552, W, H - 552);

    // log
    logs.forEach(function (laj) {
      laj.forEach(function (m) {
        ctx.shadowColor = '#8b5a2b'; ctx.shadowBlur = 8; ctx.fillStyle = '#a9744f';
        ctx.fillRect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(m.x - m.w / 2 + 4, m.y - m.h / 2 + 4, m.w - 8, 5);
      });
    });
    // mobil
    cars.forEach(function (laj) {
      laj.forEach(function (m) {
        ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 12; ctx.fillStyle = '#ff2d6f';
        ctx.fillRect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(m.x - m.w / 2 + 8, m.y - m.h / 2 + 5, m.w - 16, 9);
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(m.vx > 0 ? m.x + m.w / 2 - 5 : m.x - m.w / 2 + 1, m.y - 4, 4, 8);
      });
    });
    // katak
    ctx.save();
    ctx.translate(frog.x, frog.y);
    ctx.shadowColor = th.primary; ctx.shadowBlur = 16; ctx.fillStyle = th.primary;
    ctx.fillRect(-15, -13, 30, 26);
    ctx.shadowBlur = 0; ctx.fillStyle = '#04121a';
    ctx.fillRect(-10, -8, 7, 7); ctx.fillRect(3, -8, 7, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-15, -13, 30, 5);
    ctx.restore();

    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    // garis waktu
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = timer < 240 ? '#ff0055' : '#00ff87';
    ctx.fillRect(0, H - 6, W * Math.max(0, timer / 1500), 6);

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.82)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  LEVEL ' + level, W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { frog: frog, cars: cars, logs: logs, score: score, lives: lives, level: level, timer: timer, slots: slots, over: gameOver, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var dx = tx - frog.x, dy = ty - frog.y;
    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) { keys.right = true; keys.left = false; } else { keys.left = true; keys.right = false; } }
    else { if (dy > 0) { keys.down = true; keys.up = false; } else { keys.up = true; keys.down = false; } }
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys = {}; }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  2. MAZE NEON  — 620x620 (square)  — labirin + koin + timer         */
/* ================================================================== */
const MAZE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var N = 15, CELL = Math.floor(Math.min((W - 40) / N, (H - 120) / N));
  var OX = Math.round((W - N * CELL) / 2), OY = H - N * CELL - 18;
  var grid, player, coins, exit, score, lives, level, gameOver, runT, timer, keys, moveCd, parts, sisa;

  function bikinMaze () {
    grid = [];
    for (var y = 0; y < N; y++) {
      var row = [];
      for (var x = 0; x < N; x++) row.push({ n: true, e: true, s: true, w: true, visited: false });
      grid.push(row);
    }
    var stack = [{ x: 0, y: 0 }];
    grid[0][0].visited = true;
    var AR = [{ dx: 0, dy: -1, a: 'n', b: 's' }, { dx: 1, dy: 0, a: 'e', b: 'w' },
              { dx: 0, dy: 1, a: 's', b: 'n' }, { dx: -1, dy: 0, a: 'w', b: 'e' }];
    while (stack.length) {
      var cur = stack[stack.length - 1];
      var opsi = AR.filter(function (d) {
        var nx = cur.x + d.dx, ny = cur.y + d.dy;
        return nx >= 0 && ny >= 0 && nx < N && ny < N && !grid[ny][nx].visited;
      });
      if (!opsi.length) { stack.pop(); continue; }
      var pick = opsi[Math.floor(Math.random() * opsi.length)];
      var px = cur.x + pick.dx, py = cur.y + pick.dy;
      grid[cur.y][cur.x][pick.a] = false;
      grid[py][px][pick.b] = false;
      grid[py][px].visited = true;
      stack.push({ x: px, y: py });
    }
  }
  function pusat (cx, cy) { return { x: OX + cx * CELL + CELL / 2, y: OY + cy * CELL + CELL / 2 }; }
  function reset (penuh) {
    if (penuh !== false) { score = 0; lives = 3; level = 1; gameOver = false; runT = 0; }
    bikinMaze();
    player = { cx: 0, cy: N - 1, x: pusat(0, N - 1).x, y: pusat(0, N - 1).y, tx: pusat(0, N - 1).x, ty: pusat(0, N - 1).y, gerak: false };
    exit = { cx: N - 1, cy: 0 };
    coins = [];
    var jumlah = 8 + level * 2;
    while (coins.length < jumlah) {
      var cx = Math.floor(Math.random() * N), cy = Math.floor(Math.random() * N);
      if (cx === player.cx && cy === player.cy) continue;
      if (cx === exit.cx && cy === exit.cy) continue;
      if (coins.some(function (k) { return k.cx === cx && k.cy === cy; })) continue;
      coins.push({ cx: cx, cy: cy, t: A.rand(0, 6.28) });
    }
    sisa = coins.length;
    timer = 3000; keys = {}; moveCd = 0; parts = parts || [];
    A.setScore(score); A.setBest(); A.setStatus('Level ' + level, 'Koin ' + sisa); A.setProgress(1);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-3, 3), life: 1, size: A.rand(2, 5), warna: warna });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash(); ledak(player.x, player.y, '#ffffff', 24);
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function kena () {
    lives--; A.SFX.crash(); ledak(player.x, player.y, '#ff0055', 16);
    if (lives <= 0) { mati(); return; }
    var p = pusat(player.cx, player.cy);
    player.x = p.x; player.y = p.y; player.tx = p.x; player.ty = p.y; player.gerak = false;
    timer = 3000;
    A.setStatus('Level ' + level, 'Nyawa ' + lives);
  }
  function bisaArah (d) {
    var sel = grid[player.cy][player.cx];
    if (d === 'n') return !sel.n;
    if (d === 's') return !sel.s;
    if (d === 'e') return !sel.e;
    return !sel.w;
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    coins.forEach(function (k) { k.t += 0.08 * dt; });
    if (gameOver) return;

    timer -= dt;
    if (timer <= 0) { kena(); if (gameOver) return; }

    if (player.gerak) {
      var dx = player.tx - player.x, dy = player.ty - player.y;
      var langkah = 7.2 * dt;
      if (Math.abs(dx) <= langkah && Math.abs(dy) <= langkah) {
        player.x = player.tx; player.y = player.ty; player.gerak = false; moveCd = 0;
        ambilKoin(); cekExit();
      } else { player.x += Math.sign(dx) * langkah; player.y += Math.sign(dy) * langkah; }
    } else if (moveCd <= 0) {
      var d = keys.up ? 'n' : (keys.down ? 's' : (keys.left ? 'w' : (keys.right ? 'e' : null)));
      if (d && bisaArah(d)) {
        if (d === 'n') player.cy--; else if (d === 's') player.cy++;
        else if (d === 'e') player.cx++; else player.cx--;
        var p = pusat(player.cx, player.cy);
        player.tx = p.x; player.ty = p.y; player.gerak = true;
        moveCd = 2; A.SFX.jump();
      } else if (d) moveCd = 6;
    }
    if (moveCd > 0) moveCd -= dt;

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setProgress(timer / 3000);
    A.setStatus('Level ' + level + ' \\u00B7 koin ' + sisa, 'Nyawa ' + lives + ' \\u00B7 ' + Math.ceil(timer / 60) + 's');
  }
  function ambilKoin () {
    for (var i = coins.length - 1; i >= 0; i--) {
      if (coins[i].cx === player.cx && coins[i].cy === player.cy) {
        var p = pusat(coins[i].cx, coins[i].cy);
        ledak(p.x, p.y, '#ffd60a', 10);
        coins.splice(i, 1); sisa = coins.length; score += 15; A.SFX.point();
      }
    }
  }
  function cekExit () {
    if (player.cx === exit.cx && player.cy === exit.cy && sisa === 0) {
      score += 150 + Math.floor(timer / 20); A.SFX.level(); level++;
      ledak(player.x, player.y, '#00ff87', 26);
      reset(false);
    }
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#120a24');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // HUD atas
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Kumpulkan semua koin, lalu keluar lewat pintu neon.', 14, 24);
    ctx.fillStyle = th.primary; ctx.font = '900 20px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + Math.floor(score), 14, 50);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('Koin sisa: ' + sisa + '   Nyawa: ' + lives + '   Level: ' + level, 14, 70);

    // dinding labirin
    ctx.strokeStyle = th.primary; ctx.lineWidth = 2; ctx.shadowColor = th.primary; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var px = OX + x * CELL, py = OY + y * CELL, sel = grid[y][x];
        if (sel.n) { ctx.moveTo(px, py); ctx.lineTo(px + CELL, py); }
        if (sel.w) { ctx.moveTo(px, py); ctx.lineTo(px, py + CELL); }
        if (x === N - 1 && sel.e) { ctx.moveTo(px + CELL, py); ctx.lineTo(px + CELL, py + CELL); }
        if (y === N - 1 && sel.s) { ctx.moveTo(px, py + CELL); ctx.lineTo(px + CELL, py + CELL); }
      }
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    // pintu keluar
    var ep = pusat(exit.cx, exit.cy);
    ctx.fillStyle = sisa === 0 ? '#00ff87' : 'rgba(0,255,135,0.22)';
    ctx.shadowColor = '#00ff87'; ctx.shadowBlur = sisa === 0 ? 16 : 4;
    ctx.fillRect(ep.x - CELL / 2 + 4, ep.y - CELL / 2 + 4, CELL - 8, CELL - 8);
    ctx.shadowBlur = 0;

    // koin
    coins.forEach(function (k) {
      var p = pusat(k.cx, k.cy), r = CELL * 0.2 + Math.sin(k.t) * 1.6;
      ctx.shadowColor = '#ffd60a'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffd60a';
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
    });

    // pemain
    ctx.shadowColor = th.secondary; ctx.shadowBlur = 14; ctx.fillStyle = th.secondary;
    ctx.beginPath(); ctx.arc(player.x, player.y, CELL * 0.3, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(player.x - 3, player.y - 3, CELL * 0.1, 0, 6.283); ctx.fill();

    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  LEVEL ' + level, W / 2, H / 2 + 10);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { player: player, grid: grid, coins: coins, sisa: sisa, exit: exit, score: score, lives: lives, level: level, timer: timer, over: gameOver, keys: keys, n: N, cell: CELL, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var dx = tx - player.x, dy = ty - player.y;
    if (Math.abs(dx) > Math.abs(dy)) { keys = { left: dx < 0, right: dx > 0 }; }
    else { keys = { up: dy < 0, down: dy > 0 }; }
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys = {}; }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  3. NEON RACER  — 460x740 (portrait tinggi)  — lajur + gas/rem      */
/* ================================================================== */
const RACER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var ROADX = 34, ROADW = W - 68, LANES = 4, LANEW = ROADW / LANES;
  var car, traffic, score, lives, level, gameOver, runT, speed, spawnT, keys, parts, garis, inv, jarak;

  function laneX (i) { return ROADX + LANEW * i + LANEW / 2; }
  function reset () {
    car = { lane: 1, x: laneX(1), y: H - 120, w: 40, h: 74 };
    traffic = []; parts = []; garis = 0;
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0; speed = 6.4; spawnT = 30; keys = {}; inv = 0; jarak = 0;
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Nyawa 3'); A.setProgress(0);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: A.rand(-4, 4), vy: A.rand(-5, 2), life: 1, size: A.rand(2, 6), warna: warna });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash(); ledak(car.x, car.y, '#ffffff', 26);
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function kena () {
    if (inv > 0 || gameOver) return;
    lives--; inv = 80; A.SFX.crash(); ledak(car.x, car.y, '#ff0055', 20);
    speed = Math.max(5.2, speed - 2);
    if (lives <= 0) mati();
  }
  function spawnTrafik () {
    var lane = Math.floor(Math.random() * LANES);
    if (traffic.some(function (t) { return t.lane === lane && t.y < 140; })) return;
    var jenis = Math.random() < 0.22 ? 'truk' : 'mobil';
    traffic.push({
      lane: lane, x: laneX(lane), y: -110,
      w: jenis === 'truk' ? 44 : 38, h: jenis === 'truk' ? 104 : 72,
      sp: A.rand(0.36, 0.6), jenis: jenis
    });
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (inv > 0) inv -= dt;
    // gas / rem
    if (keys.up) speed = Math.min(15, speed + 0.05 * dt);
    if (keys.down) speed = Math.max(3.2, speed - 0.09 * dt);
    speed = Math.min(15, speed + 0.0016 * dt);

    // pindah lajur
    if (keys.left && !keys._lk) { car.lane = Math.max(0, car.lane - 1); keys._lk = true; A.SFX.jump(); }
    if (!keys.left) keys._lk = false;
    if (keys.right && !keys._rk) { car.lane = Math.min(LANES - 1, car.lane + 1); keys._rk = true; A.SFX.jump(); }
    if (!keys.right) keys._rk = false;
    car.x += (laneX(car.lane) - car.x) * Math.min(1, 0.22 * dt);

    garis = (garis + speed * dt) % 46;
    jarak += speed * dt;
    score = Math.floor(jarak / 9);

    spawnT -= dt;
    if (spawnT <= 0) { spawnTrafik(); spawnT = Math.max(16, 46 - level * 2.6 - speed); }

    traffic.forEach(function (t) { t.y += (speed - speed * t.sp) * dt; });
    traffic = traffic.filter(function (t) { return t.y < H + 140; });

    for (var i = 0; i < traffic.length; i++) {
      var t = traffic[i];
      if (Math.abs(t.x - car.x) < (t.w + car.w) / 2 - 8 && Math.abs(t.y - car.y) < (t.h + car.h) / 2 - 10) {
        kena();
        if (gameOver) return;
        t.y = H + 200;
      }
    }

    var nl = Math.floor(score / 400) + 1;
    if (nl !== level) { level = nl; A.SFX.level(); }

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('Level ' + level + ' \\u00B7 lajur ' + (car.lane + 1), 'Nyawa ' + lives + ' \\u00B7 ' + speed.toFixed(1) + 'x');
    A.setProgress((score % 400) / 400);
  }

  function gambarMobil (x, y, w, h, warna, cahaya, balik) {
    ctx.shadowColor = cahaya; ctx.shadowBlur = 14; ctx.fillStyle = warna;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - w / 2 + 5, y - h / 2 + (balik ? h - 26 : 8), w - 10, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, 5);
    ctx.fillStyle = '#ffd60a';
    ctx.fillRect(x - w / 2 + 3, balik ? y - h / 2 + 2 : y + h / 2 - 7, 8, 5);
    ctx.fillRect(x + w / 2 - 11, balik ? y - h / 2 + 2 : y + h / 2 - 7, 8, 5);
  }
  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04060f'); bg.addColorStop(1, '#141027');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // rumput neon
    ctx.fillStyle = 'rgba(0,243,255,0.05)'; ctx.fillRect(0, 0, ROADX, H); ctx.fillRect(W - ROADX, 0, ROADX, H);
    // aspal
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(ROADX, 0, ROADW, H);
    ctx.strokeStyle = th.primary; ctx.lineWidth = 3; ctx.shadowColor = th.primary; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(ROADX, 0); ctx.lineTo(ROADX, H); ctx.moveTo(W - ROADX, 0); ctx.lineTo(W - ROADX, H); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.setLineDash([22, 24]);
    for (var l = 1; l < LANES; l++) {
      ctx.beginPath();
      ctx.lineDashOffset = -garis;
      ctx.moveTo(ROADX + LANEW * l, 0); ctx.lineTo(ROADX + LANEW * l, H);
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.lineDashOffset = 0;

    traffic.forEach(function (t) {
      gambarMobil(t.x, t.y, t.w, t.h, t.jenis === 'truk' ? '#ff8500' : '#ff2d6f', t.jenis === 'truk' ? '#ff8500' : '#ff0055', true);
    });
    if (!(inv > 0 && Math.floor(runT / 4) % 2 === 0)) gambarMobil(car.x, car.y, car.w, car.h, th.primary, th.primary, false);

    // knalpot
    if (!gameOver && Math.random() < 0.6) parts.push({ x: car.x + A.rand(-8, 8), y: car.y + car.h / 2, vx: A.rand(-0.6, 0.6), vy: A.rand(1, 3), life: 0.8, size: A.rand(2, 4), warna: 'rgba(0,243,255,0.6)' });
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    // speedometer
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(ROADX, H - 10, ROADW, 6);
    ctx.fillStyle = speed > 12 ? '#ff0055' : '#00ff87';
    ctx.fillRect(ROADX, H - 10, ROADW * Math.min(1, speed / 15), 6);

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('JARAK: ' + Math.floor(score), W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { car: car, traffic: traffic, score: score, lives: lives, level: level, speed: speed, over: gameOver, keys: keys, lanes: LANES, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    if (ty > H * 0.62) { keys.up = ty < H * 0.81; keys.down = ty >= H * 0.81; }
    else { if (tx < W / 2) { keys.left = true; keys.right = false; } else { keys.right = true; keys.left = false; } }
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys.up = false; keys.down = false; keys.left = false; keys.right = false; }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  4. TANK NEON  — 740x520 (landscape)  — gerak 4 arah + turret auto  */
/* ================================================================== */
const TANK_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var tank, musuh, peluru, mpeluru, tembok, parts, score, lives, level, gameOver, runT, keys, cool, spawnT, inv, kills;

  function bikinTembok () {
    tembok = [];
    var pola = [[0.22, 0.28], [0.5, 0.18], [0.76, 0.3], [0.3, 0.66], [0.62, 0.72], [0.46, 0.46]];
    pola.forEach(function (p) {
      tembok.push({ x: p[0] * W - 26, y: p[1] * H - 26, w: 52, h: 52 });
    });
  }
  function reset () {
    tank = { x: W / 2, y: H - 70, w: 30, h: 30, sudut: -1.57 };
    musuh = []; peluru = []; mpeluru = []; parts = [];
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0; keys = {}; cool = 0; spawnT = 20; inv = 0; kills = 0;
    bikinTembok();
    A.setScore(0); A.setBest(); A.setStatus('Wave 1', 'Nyawa 3'); A.setProgress(0);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: A.rand(-4, 4), vy: A.rand(-4, 4), life: 1, size: A.rand(2, 6), warna: warna });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash(); ledak(tank.x, tank.y, '#ffffff', 28);
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function kena () {
    if (inv > 0 || gameOver) return;
    lives--; inv = 80; A.SFX.crash(); ledak(tank.x, tank.y, '#ff0055', 20);
    if (lives <= 0) mati();
  }
  function kenaTembok (x, y, r) {
    for (var i = 0; i < tembok.length; i++) {
      var b = tembok[i];
      if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
    }
    return false;
  }
  function spawnMusuh () {
    var sisi = Math.floor(Math.random() * 3);
    var x = sisi === 0 ? A.rand(30, W - 30) : (sisi === 1 ? 24 : W - 24);
    var y = sisi === 2 ? A.rand(30, H * 0.4) : 24;
    musuh.push({
      x: x, y: y, w: 28, h: 28, hp: 2 + Math.floor(level / 3),
      sp: A.rand(0.85, 1.25) + level * 0.09, cool: A.rand(60, 150), sudut: 1.57
    });
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (inv > 0) inv -= dt;
    var vx = (keys.right ? 3.3 : 0) - (keys.left ? 3.3 : 0);
    var vy = (keys.down ? 3.3 : 0) - (keys.up ? 3.3 : 0);
    var nx = tank.x + vx * dt, ny = tank.y + vy * dt;
    if (nx > 18 && nx < W - 18 && !kenaTembok(nx, tank.y, 14)) tank.x = nx;
    if (ny > 18 && ny < H - 18 && !kenaTembok(tank.x, ny, 14)) tank.y = ny;

    // turret otomatis membidik musuh terdekat
    var terdekat = null, jd = 1e9;
    musuh.forEach(function (e) {
      var d = Math.hypot(e.x - tank.x, e.y - tank.y);
      if (d < jd) { jd = d; terdekat = e; }
    });
    if (terdekat) tank.sudut = Math.atan2(terdekat.y - tank.y, terdekat.x - tank.x);

    cool -= dt;
    if (cool <= 0 && terdekat && jd < 620) {
      cool = Math.max(14, 30 - level);
      peluru.push({ x: tank.x + Math.cos(tank.sudut) * 20, y: tank.y + Math.sin(tank.sudut) * 20, vx: Math.cos(tank.sudut) * 9, vy: Math.sin(tank.sudut) * 9 });
      A.SFX.jump();
    }
    peluru.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
    peluru = peluru.filter(function (b) { return b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10 && !kenaTembok(b.x, b.y, 3); });

    spawnT -= dt;
    var maks = 3 + Math.min(4, level);
    if (spawnT <= 0 && musuh.length < maks) { spawnMusuh(); spawnT = Math.max(40, 130 - level * 8); }

    musuh.forEach(function (e) {
      var dx = tank.x - e.x, dy = tank.y - e.y, d = Math.max(1, Math.hypot(dx, dy));
      e.sudut = Math.atan2(dy, dx);
      var mx = e.x + (dx / d) * e.sp * dt, my = e.y + (dy / d) * e.sp * dt;
      if (!kenaTembok(mx, my, 13)) { e.x = mx; e.y = my; }
      else { e.x += (dy / d) * e.sp * dt; e.y -= (dx / d) * e.sp * dt; }
      e.x = Math.max(14, Math.min(W - 14, e.x)); e.y = Math.max(14, Math.min(H - 14, e.y));
      e.cool -= dt;
      if (e.cool <= 0 && d < 520) {
        e.cool = Math.max(70, 170 - level * 8);
        var acak = A.rand(-0.16, 0.16);
        mpeluru.push({ x: e.x, y: e.y, vx: Math.cos(e.sudut + acak) * 4.4, vy: Math.sin(e.sudut + acak) * 4.4 });
      }
      if (Math.abs(e.x - tank.x) < 26 && Math.abs(e.y - tank.y) < 26) { kena(); e.hp = 0; ledak(e.x, e.y, '#ff8500', 12); }
    });
    mpeluru.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
    mpeluru = mpeluru.filter(function (b) {
      if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10 || kenaTembok(b.x, b.y, 3)) return false;
      if (Math.abs(b.x - tank.x) < 15 && Math.abs(b.y - tank.y) < 15) { kena(); return false; }
      return true;
    });

    for (var i = musuh.length - 1; i >= 0; i--) {
      var e2 = musuh[i];
      for (var j = peluru.length - 1; j >= 0; j--) {
        var b2 = peluru[j];
        if (Math.abs(b2.x - e2.x) < 16 && Math.abs(b2.y - e2.y) < 16) {
          peluru.splice(j, 1); e2.hp--; ledak(b2.x, b2.y, '#00f3ff', 4);
          if (e2.hp <= 0) {
            kills++; score += 25 + level * 5; A.SFX.point(); ledak(e2.x, e2.y, '#ff007f', 16);
            musuh.splice(i, 1);
            var nl = Math.floor(kills / 6) + 1;
            if (nl !== level) { level = nl; A.SFX.level(); }
          }
          break;
        }
      }
    }
    musuh = musuh.filter(function (e) { return e.hp > 0; });

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('Wave ' + level + ' \\u00B7 musuh ' + musuh.length, 'Nyawa ' + lives + ' \\u00B7 kill ' + kills);
    A.setProgress((kills % 6) / 6);
  }

  function gambarTank (x, y, sudut, warna, cahaya) {
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = cahaya; ctx.shadowBlur = 12;
    ctx.fillStyle = warna; ctx.fillRect(-15, -13, 30, 26);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-15, -13, 6, 26); ctx.fillRect(9, -13, 6, 26);
    ctx.rotate(sudut);
    ctx.fillStyle = warna; ctx.fillRect(0, -4, 24, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.283); ctx.fill();
    ctx.restore();
  }
  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#101a2e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    tembok.forEach(function (b) {
      ctx.fillStyle = 'rgba(157,78,221,0.35)'; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = 'rgba(157,78,221,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
    });

    musuh.forEach(function (e) { gambarTank(e.x, e.y, e.sudut, '#ff2d6f', '#ff0055'); });
    if (!(inv > 0 && Math.floor(runT / 4) % 2 === 0)) gambarTank(tank.x, tank.y, tank.sudut, th.primary, th.primary);

    ctx.fillStyle = '#00f3ff';
    peluru.forEach(function (b) { ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 8; ctx.fillRect(b.x - 3, b.y - 3, 6, 6); });
    ctx.fillStyle = '#ffd60a';
    mpeluru.forEach(function (b) { ctx.shadowColor = '#ffd60a'; ctx.shadowBlur = 8; ctx.fillRect(b.x - 3, b.y - 3, 6, 6); });
    ctx.shadowBlur = 0;

    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  KILL ' + kills, W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { tank: tank, musuh: musuh, peluru: peluru, mpeluru: mpeluru, tembok: tembok, score: score, lives: lives, level: level, kills: kills, over: gameOver, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    keys.left = tx < tank.x - 20; keys.right = tx > tank.x + 20;
    keys.up = ty < tank.y - 20; keys.down = ty > tank.y + 20;
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { keys = {}; }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  5. NEON HUNT  — 660x500 (landscape)  — bidik 4 arah + tembak       */
/* ================================================================== */
const HUNT_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var aim, targets, shots, hits, score, lives, round, gameOver, runT, keys, parts, spawnT, sisaTarget, lolos, kuota;

  function reset () {
    aim = { x: W / 2, y: H / 2 };
    targets = []; shots = []; parts = [];
    score = 0; lives = 3; round = 1; gameOver = false; runT = 0; keys = {};
    mulaiRound();
    A.setScore(0); A.setBest(); A.setStatus('Round 1', 'Nyawa 3'); A.setProgress(1);
  }
  function mulaiRound () {
    targets = []; shots = [];
    sisaTarget = 8 + round; kuota = Math.ceil((8 + round) * 0.55);
    hits = 0; lolos = 0; spawnT = 20;
    A.setStatus('Round ' + round, 'Target ' + kuota);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: A.rand(-5, 5), vy: A.rand(-5, 5), life: 1, size: A.rand(2, 6), warna: warna });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function spawnTarget () {
    var dariKiri = Math.random() < 0.5;
    var tipe = Math.random() < 0.2 + round * 0.03 ? 'cepat' : 'biasa';
    targets.push({
      x: dariKiri ? -30 : W + 30,
      y: A.rand(50, H - 90),
      vx: (dariKiri ? 1 : -1) * A.rand(1.6, 2.4) * (tipe === 'cepat' ? 1.7 : 1) * (1 + round * 0.07),
      r: tipe === 'cepat' ? 15 : 20,
      t: A.rand(0, 6.28), amp: A.rand(14, 40), tipe: tipe, poin: tipe === 'cepat' ? 40 : 20
    });
  }
  function tembak () {
    if (gameOver) return;
    shots.push({ x: aim.x, y: aim.y, life: 12 });
    A.SFX.jump();
    var kenaSatu = false;
    for (var i = targets.length - 1; i >= 0; i--) {
      var tg = targets[i];
      if (Math.hypot(tg.x - aim.x, tg.y - aim.y) < tg.r + 12) {
        hits++; score += tg.poin + hits * 2; kenaSatu = true;
        ledak(tg.x, tg.y, '#00ff87', 18); A.SFX.point();
        targets.splice(i, 1);
        break;
      }
    }
    if (!kenaSatu) { score = Math.max(0, score - 3); ledak(aim.x, aim.y, 'rgba(255,255,255,0.7)', 6); }
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    shots.forEach(function (s) { s.life -= dt; });
    shots = shots.filter(function (s) { return s.life > 0; });
    if (gameOver) return;

    var sp = 6.2;
    if (keys.left) aim.x -= sp * dt;
    if (keys.right) aim.x += sp * dt;
    if (keys.up) aim.y -= sp * dt;
    if (keys.down) aim.y += sp * dt;
    aim.x = Math.max(12, Math.min(W - 12, aim.x));
    aim.y = Math.max(12, Math.min(H - 12, aim.y));

    spawnT -= dt;
    if (spawnT <= 0 && (hits + lolos + targets.length) < sisaTarget) {
      spawnTarget();
      spawnT = Math.max(26, 62 - round * 3);
    }
    targets.forEach(function (tg) { tg.x += tg.vx * dt; tg.t += 0.06 * dt; tg.y += Math.sin(tg.t) * 1.1 * dt; });
    for (var i = targets.length - 1; i >= 0; i--) {
      var tg2 = targets[i];
      if (tg2.x < -50 || tg2.x > W + 50) { targets.splice(i, 1); lolos++; }
    }

    if (hits + lolos >= sisaTarget) {
      if (hits >= kuota) {
        score += 120 + round * 30; A.SFX.level(); round++;
        ledak(W / 2, H / 2, '#00f3ff', 30);
        mulaiRound();
      } else {
        lives--; A.SFX.crash();
        if (lives <= 0) { mati(); return; }
        mulaiRound();
      }
    }

    A.setScore(score);
    A.setStatus('Round ' + round + ' \\u00B7 kena ' + hits + '/' + kuota, 'Nyawa ' + lives + ' \\u00B7 lolos ' + lolos);
    A.setProgress((hits + lolos) / sisaTarget);
  }

  function draw () {
    var th = A.theme(round - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#040713'); bg.addColorStop(1, '#160c26');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // horizon neon
    ctx.strokeStyle = 'rgba(0,243,255,0.16)'; ctx.lineWidth = 1;
    for (var gy = H - 40; gy > 0; gy -= 34) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    for (var gx = 0; gx < W; gx += 44) { ctx.beginPath(); ctx.moveTo(gx, H); ctx.lineTo(W / 2 + (gx - W / 2) * 0.25, 0); ctx.stroke(); }

    targets.forEach(function (tg) {
      ctx.save(); ctx.translate(tg.x, tg.y);
      ctx.shadowColor = tg.tipe === 'cepat' ? '#ffd60a' : '#ff007f'; ctx.shadowBlur = 14;
      ctx.fillStyle = tg.tipe === 'cepat' ? '#ffd60a' : '#ff2d6f';
      ctx.beginPath(); ctx.arc(0, 0, tg.r, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(0, 0, tg.r * 0.5, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-tg.r - 8, -2, 8, 4); ctx.fillRect(tg.r, -2, 8, 4);
      ctx.restore();
    });

    shots.forEach(function (s) {
      ctx.globalAlpha = Math.max(0, s.life / 12);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 22 - s.life, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // crosshair
    ctx.strokeStyle = th.primary; ctx.lineWidth = 2; ctx.shadowColor = th.primary; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(aim.x, aim.y, 18, 0, 6.283); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(aim.x - 28, aim.y); ctx.lineTo(aim.x - 8, aim.y);
    ctx.moveTo(aim.x + 8, aim.y); ctx.lineTo(aim.x + 28, aim.y);
    ctx.moveTo(aim.x, aim.y - 28); ctx.lineTo(aim.x, aim.y - 8);
    ctx.moveTo(aim.x, aim.y + 8); ctx.lineTo(aim.x, aim.y + 28);
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = th.primary; ctx.fillRect(aim.x - 2, aim.y - 2, 4, 4);

    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.84)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  ROUND ' + round, W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { aim: aim, targets: targets, shots: shots, score: score, lives: lives, round: round, hits: hits, lolos: lolos, kuota: kuota, sisa: sisaTarget, over: gameOver, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    aim.x = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    aim.y = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    tembak();
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchmove', function (e) {
    if (gameOver) return;
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    aim.x = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    aim.y = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function (e) {
    A.initAudio();
    if (gameOver) { reset(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    aim.x = (e.clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    aim.y = (e.clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    tembak();
  });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); else tembak(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

/* ------------------------------------------------------------------ */
export function froggerHtml (brand = 'THERYHANN!') {
  return shell('Frogger Neon', brand, FROGGER_JS, {
    w: 560, h: 620, maxw: 450,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 lompat 4 arah  \u00B7  naik log lewat sungai  \u00B7  isi 4 slot'
  })
}
export function mazeHtml (brand = 'THERYHANN!') {
  return shell('Maze Neon', brand, MAZE_JS, {
    w: 620, h: 620, maxw: 480,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 jalan  \u00B7  ambil semua koin  \u00B7  keluar lewat pintu hijau'
  })
}
export function racerHtml (brand = 'THERYHANN!') {
  return shell('Neon Racer', brand, RACER_JS, {
    w: 460, h: 740, maxw: 380,
    hint: '\u25C0 \u25B6 pindah lajur  \u00B7  \u25B2 gas  \u00B7  \u25BC rem  \u00B7  hindari mobil & truk'
  })
}
export function tankHtml (brand = 'THERYHANN!') {
  return shell('Tank Neon', brand, TANK_JS, {
    w: 740, h: 520, maxw: 600,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 gerak tank  \u00B7  turret membidik otomatis  \u00B7  berlindung di balik blok'
  })
}
export function huntHtml (brand = 'THERYHANN!') {
  return shell('Neon Hunt', brand, HUNT_JS, {
    w: 660, h: 500, maxw: 540,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 geser bidikan  \u00B7  \u25CF tembak  \u00B7  penuhi kuota tiap ronde'
  })
}

/** daftar game batch v7.2 (dipakai menu + test) */
export const ARCADE_GAMES4 = [
  { id: 'frogger', title: 'Frogger Neon', html: froggerHtml, ratio: '560\u00D7620 (portrait)' },
  { id: 'maze', title: 'Maze Neon', html: mazeHtml, ratio: '620\u00D7620 (1:1)' },
  { id: 'racing', title: 'Neon Racer', html: racerHtml, ratio: '460\u00D7740 (portrait tinggi)' },
  { id: 'tank', title: 'Tank Neon', html: tankHtml, ratio: '740\u00D7520 (landscape)' },
  { id: 'hunt', title: 'Neon Hunt', html: huntHtml, ratio: '660\u00D7500 (landscape)' }
]

export default { froggerHtml, mazeHtml, racerHtml, tankHtml, huntHtml, ARCADE_GAMES4 }
