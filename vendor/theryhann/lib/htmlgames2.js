/**
 * 🕹️ HTMLGAMES 2 — 3 game arcade HTML tambahan (v7.1)
 * ------------------------------------------------------------
 *  Memakai shell yang sama dengan lib/htmlgames.js (CSS neon + markup
 *  + PRELUDE: WebAudio, best-score localStorage, HUD, tema warna), jadi
 *  tiap game tetap: self-contained, tanpa resource eksternal, 1 <script>,
 *  dan bisa di-smoke-test di DOM palsu (vm) lewat hook `window.__ARC.state`.
 *
 *  Game:
 *    • Breakout Neon  — paddle + bola + bata 3 HP, 3 nyawa, level makin cepat
 *    • Space Shooter  — pesawat, auto-tembak, musuh bergelombang + peluru musuh
 *    • Dino Run       — endless runner: lompat kaktus, menunduk hindari burung
 */
import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  1. BREAKOUT NEON                                                   */
/* ------------------------------------------------------------------ */
const BREAKOUT_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var COLS = 10, GAP = 5;
  var BW = Math.floor((W - 44 - GAP * (COLS - 1)) / COLS), BH = Math.max(14, Math.round(H * 0.031));
  var LEFT = Math.round((W - (COLS * (BW + GAP) - GAP)) / 2), TOP = Math.round(H * 0.085);
  var BASEW = Math.round(W * 0.145);
  var paddle, ball, bricks, score, lives, level, gameOver, runT, parts, keys, target;
  var dashT, dashCd, shieldT, shieldCd;

  function makeBricks () {
    bricks = [];
    var rows = ROWS_NOW();
    for (var r = 0; r < rows; r++) {
      for (var q = 0; q < COLS; q++) {
        bricks.push({ x: LEFT + q * (BW + GAP), y: TOP + r * (BH + GAP), w: BW, h: BH, hp: r < 1 ? 3 : (r < 3 ? 2 : 1), alive: true });
      }
    }
  }
  function ROWS_NOW () { return 4 + Math.min(3, level - 1); }
  function reset () {
    paddle = { x: W / 2 - BASEW / 2, y: H - 26, w: BASEW, h: 12 };
    ball = { x: W / 2, y: H - 44, r: Math.max(6, Math.round(H * 0.012)), vx: 2.6, vy: -3.4 };
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0; parts = []; keys = {}; target = null;
    dashT = 0; dashCd = 0; shieldT = 0; shieldCd = 0;
    makeBricks();
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Nyawa 3'); A.setProgress(0);
  }
  function newBall () {
    ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - 12;
    var a = A.rand(-0.45, 0.45);
    var sp = 4.1 + level * 0.32;
    ball.vx = Math.sin(a) * sp; ball.vy = -Math.cos(a) * sp;
  }
  function pantulPaddle (rel) {
    var sp = Math.min(9.4, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.035);
    var a = (rel - 0.5) * 2.0 + A.rand(-0.18, 0.18);
    a = Math.max(-1.1, Math.min(1.1, a));
    ball.vx = Math.sin(a) * sp; ball.vy = -Math.abs(Math.cos(a) * sp) - 0.7;
    A.SFX.jump();
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < (n || 8); i++) parts.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-3, 3), life: 1, size: A.rand(2, 4), warna: warna });
  }
  function hilangNyawa () {
    lives--; A.SFX.crash(); ledak(ball.x, H - 10, '#ff0055', 14);
    A.setStatus('Level ' + level, 'Nyawa ' + Math.max(0, lives));
    if (lives <= 0) { mati(); return; }
    newBall();
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    // power-up: ▲ dash (paddle ngebut) & ▼ perisai (paddle melebar)
    if (dashT > 0) dashT -= dt;
    if (dashCd > 0) dashCd -= dt;
    if (shieldT > 0) shieldT -= dt;
    if (shieldCd > 0) shieldCd -= dt;
    var lebarTarget = shieldT > 0 ? Math.round(BASEW * 1.7) : BASEW;
    paddle.w += (lebarTarget - paddle.w) * Math.min(1, 0.25 * dt);
    var kecepatan = 7.4 * (dashT > 0 ? 2.3 : 1);

    if (target !== null) {
      var want = target - paddle.w / 2;
      paddle.x += (want - paddle.x) * Math.min(1, 0.35 * dt);
    } else {
      var pv = 0;
      if (keys.left) pv -= kecepatan;
      if (keys.right) pv += kecepatan;
      paddle.x += pv * dt;
    }
    paddle.x = Math.max(4, Math.min(W - paddle.w - 4, paddle.x));

    var sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    var steps = Math.max(1, Math.ceil(sp * dt / 4));
    for (var s = 0; s < steps; s++) {
      var py = ball.y;
      ball.x += ball.vx * dt / steps; ball.y += ball.vy * dt / steps;
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); }
      if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
      if (ball.vy > 0 && py <= paddle.y && ball.y >= paddle.y &&
          ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
        ball.y = paddle.y;
        pantulPaddle((ball.x - paddle.x) / paddle.w);
      }
      for (var i = 0; i < bricks.length; i++) {
        var b = bricks[i];
        if (!b.alive) continue;
        if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.hp--;
          if (b.hp <= 0) { b.alive = false; score += 10 * level; ledak(b.x + b.w / 2, b.y + b.h / 2, '#00f3ff', 9); }
          else { score += 3; ledak(ball.x, ball.y, '#9d4edd', 4); }
          A.SFX.point();
          var ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
          var oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
          if (ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
          break;
        }
      }
      if (ball.y - ball.r > H) { hilangNyawa(); break; }
    }

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    var sisa = bricks.filter(function (b) { return b.alive; }).length;
    A.setProgress(bricks.length ? 1 - sisa / bricks.length : 0);
    A.setStatus('Level ' + level + (dashT > 0 ? ' \u26A1' : '') + (shieldT > 0 ? ' \u26E8' : ''),
      'Nyawa ' + lives + ' \u00B7 \u25B2 ' + (dashCd > 0 ? Math.ceil(dashCd / 60) + 's' : 'SIAP') +
      ' \u00B7 \u25BC ' + (shieldCd > 0 ? Math.ceil(shieldCd / 60) + 's' : 'SIAP'));
    if (sisa === 0) {
      level++; A.SFX.level(); makeBricks(); newBall();
      A.setStatus('Level ' + level, 'Nyawa ' + lives);
    }
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#10162a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = th.primary; ctx.globalAlpha = 0.07; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 0; gx <= W; gx += 32) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (var gy = 0; gy <= H; gy += 32) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke(); ctx.globalAlpha = 1;

    bricks.forEach(function (b) {
      if (!b.alive) return;
      var warna = b.hp >= 3 ? '#ff007f' : b.hp === 2 ? th.secondary : th.primary;
      ctx.shadowColor = warna; ctx.shadowBlur = 8; ctx.fillStyle = warna;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
      if (b.hp > 1) {
        ctx.fillStyle = '#060911'; ctx.font = '700 10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(String(b.hp), b.x + b.w / 2, b.y + b.h - 4); ctx.textAlign = 'left';
      }
    });

    ctx.shadowColor = th.primary; ctx.shadowBlur = 12; ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.shadowBlur = 0; ctx.fillStyle = th.primary;
    ctx.fillRect(paddle.x + 3, paddle.y + 3, paddle.w - 6, paddle.h - 6);

    ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

    parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna || th.primary;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ff0055'; ctx.font = '700 12px "Segoe UI", sans-serif';
    for (var i = 0; i < Math.max(0, lives); i++) ctx.fillText('♥', 12 + i * 16, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('BATA ' + bricks.filter(function (b) { return b.alive; }).length, W - 74, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.8)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score), W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('GESER / PANAH ← → · TAP UNTUK ULANG', W / 2, H / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { paddle: paddle, ball: ball, bricks: bricks, score: score, lives: lives, level: level, over: gameOver, dashT: dashT, dashCd: dashCd, shieldT: shieldT, shieldCd: shieldCd, baseW: BASEW, w: W, h: H };
    requestAnimationFrame(loop);
  }

  function posDari (clientX) {
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, width: W };
    var skala = r.width ? W / r.width : 1;
    return (clientX - (r.left || 0)) * skala;
  }
  c.addEventListener('touchstart', function (e) { A.initAudio(); if (gameOver) { reset(); return; } target = posDari(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove', function (e) { if (!gameOver) target = posDari(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function () { target = null; }, { passive: false });
  c.addEventListener('mousedown', function (e) { A.initAudio(); if (gameOver) { reset(); return; } target = posDari(e.clientX); });
  c.addEventListener('mousemove', function (e) { if (target !== null && !gameOver) target = posDari(e.clientX); });
  function dash () { if (gameOver || dashCd > 0) return; dashT = 32; dashCd = 190; A.SFX.jump(); }
  function perisai () { if (gameOver || shieldCd > 0) return; shieldT = 300; shieldCd = 780; A.SFX.level(); }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; target = null; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; target = null; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { dash(); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { perisai(); e.preventDefault(); }
    else if (k === 'Space') { if (gameOver) reset(); else dash(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

export function breakoutHtml (brand = 'THERYHANN!') {
  return shell('Breakout Neon', brand, BREAKOUT_JS, { w: 700, h: 520, maxw: 560, hint: '◀ ▶ gerak paddle  ·  ▲ / ● dash  ·  ▼ perisai (paddle lebar)' })
}

/* ------------------------------------------------------------------ */
/*  2. SPACE SHOOTER                                                   */
/* ------------------------------------------------------------------ */
const SHOOTER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var ship, bullets, enemies, ebullets, parts, stars, targetY;
  var score, lives, level, gameOver, runT, spawnT, cool, keys, target, kills, bombs;

  function reset () {
    ship = { x: W / 2, y: H - 44, w: 30, h: 24, inv: 0 };
    bullets = []; enemies = []; ebullets = []; parts = [];
    stars = [];
    for (var i = 0; i < 60; i++) stars.push({ x: A.rand(0, W), y: A.rand(0, H), s: A.rand(0.6, 2.2), v: A.rand(0.4, 1.6) });
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0; spawnT = 30; cool = 0; keys = {}; target = null; targetY = null; kills = 0; bombs = 3;
    A.setScore(0); A.setBest(); A.setStatus('Wave 1', 'Nyawa 3'); A.setProgress(0);
  }
  function ledak (x, y, warna, n) {
    for (var i = 0; i < (n || 10); i++) parts.push({ x: x, y: y, vx: A.rand(-3.4, 3.4), vy: A.rand(-3.4, 3.4), life: 1, size: A.rand(2, 4), warna: warna });
  }
  function spawnMusuh () {
    var tipe = Math.random() < 0.18 + level * 0.02 ? 'shooter' : 'drone';
    var w = tipe === 'shooter' ? 34 : 28;
    enemies.push({
      x: A.rand(20, W - 20 - w), y: -30, w: w, h: tipe === 'shooter' ? 26 : 22,
      vy: A.rand(0.8, 1.5) + level * 0.16, vx: A.rand(-0.8, 0.8),
      hp: tipe === 'shooter' ? 2 : 1, tipe: tipe, t: A.rand(0, 6.28), cool: A.rand(50, 130)
    });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash(); ledak(ship.x, ship.y, '#ffffff', 22);
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }
  function bom () {
    if (gameOver || bombs <= 0) return;
    bombs--; A.SFX.crash(); ledak(ship.x, ship.y, '#ffd60a', 34);
    ebullets.length = 0;
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      e.hp -= 3;
      ledak(e.x + e.w / 2, e.y + e.h / 2, '#ff007f', 10);
      if (e.hp <= 0) { kills++; score += e.tipe === 'shooter' ? 30 : 15; enemies.splice(i, 1); }
    }
    ship.inv = 70;
    A.setStatus('Wave ' + level, 'Bom ' + bombs + ' \u00B7 Nyawa ' + lives);
  }
  function kena () {
    if (ship.inv > 0 || gameOver) return;
    lives--; ship.inv = 70; A.SFX.crash(); ledak(ship.x, ship.y, '#ff0055', 16);
    A.setStatus('Wave ' + level, 'Nyawa ' + Math.max(0, lives) + ' \u00B7 Bom ' + bombs);
    if (lives <= 0) mati();
  }

  function update (dt) {
    runT += dt;
    stars.forEach(function (s) { s.y += s.v * dt * (1 + level * 0.1); if (s.y > H) { s.y = -2; s.x = A.rand(0, W); } });
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (ship.inv > 0) ship.inv -= dt;
    if (target !== null) ship.x += (target - ship.x) * Math.min(1, 0.3 * dt);
    else {
      var pv = 0;
      if (keys.left) pv -= 6.4;
      if (keys.right) pv += 6.4;
      ship.x += pv * dt;
    }
    ship.x = Math.max(16, Math.min(W - 16, ship.x));
    // ▲ ▼ : pesawat maju/mundur (vertikal)
    if (targetY === null) {
      if (keys.up) ship.y -= 5.4 * dt;
      if (keys.down) ship.y += 5.4 * dt;
    }
    ship.y = Math.max(H * 0.42, Math.min(H - 24, ship.y));

    cool -= dt;
    if (cool <= 0) {
      cool = Math.max(5, 9 - level * 0.3);
      bullets.push({ x: ship.x - 9, y: ship.y - 12, vy: -9.5 });
      bullets.push({ x: ship.x + 9, y: ship.y - 12, vy: -9.5 });
      A.SFX.jump();
    }
    bullets.forEach(function (b) { b.y += b.vy * dt; });
    bullets = bullets.filter(function (b) { return b.y > -10; });

    spawnT -= dt;
    if (spawnT <= 0) { spawnMusuh(); spawnT = Math.max(14, 46 - level * 3.2); }

    enemies.forEach(function (e) {
      e.t += 0.05 * dt;
      e.y += e.vy * dt;
      e.x += Math.sin(e.t) * 1.2 * dt + e.vx * dt;
      if (e.x < 10 || e.x > W - 10 - e.w) e.vx = -e.vx;
      if (e.tipe === 'shooter') {
        e.cool -= dt;
        if (e.cool <= 0 && e.y > 0 && e.y < H - 90) {
          e.cool = Math.max(64, 145 - level * 6);
          var dx = ship.x - (e.x + e.w / 2), dy = ship.y - e.y;
          var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          ebullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vx: dx / d * 3.0, vy: dy / d * 3.0 });
        }
      }
    });

    ebullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
    ebullets = ebullets.filter(function (b) { return b.y < H + 10 && b.y > -10 && b.x > -10 && b.x < W + 10; });

    // tabrakan peluru pemain vs musuh
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      for (var j = bullets.length - 1; j >= 0; j--) {
        var b = bullets[j];
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          bullets.splice(j, 1);
          e.hp--;
          ledak(b.x, b.y, '#00f3ff', 3);
          if (e.hp <= 0) {
            score += e.tipe === 'shooter' ? 30 : 15;
            kills++; A.SFX.point(); ledak(e.x + e.w / 2, e.y + e.h / 2, '#ff007f', 12);
            enemies.splice(i, 1);
            var nl = Math.floor(kills / 8) + 1;
            if (nl !== level) { level = nl; A.SFX.level(); A.setStatus('Wave ' + level, 'Nyawa ' + lives); }
          }
          break;
        }
      }
    }
    // musuh / peluru musuh kena pesawat
    enemies.forEach(function (e) {
      if (Math.abs(e.x + e.w / 2 - ship.x) < e.w / 2 + 12 && Math.abs(e.y + e.h / 2 - ship.y) < e.h / 2 + 10) kena();
    });
    // musuh yang lolos tidak mengurangi nyawa (cuma skor) — mati hanya karena tabrakan/tembakan
    enemies = enemies.filter(function (e) {
      if (e.y > H + 30) { score = Math.max(0, score - 4); return false; }
      return true;
    });
    ebullets.forEach(function (b) {
      if (Math.abs(b.x - ship.x) < 13 && Math.abs(b.y - ship.y) < 12) { kena(); b.y = H + 99; }
    });

    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setProgress((kills % 8) / 8);
    A.setStatus('Wave ' + level + (bombs > 0 ? ' \u00B7 \u25CF bom ' + bombs : ''), 'Nyawa ' + Math.max(0, lives) + ' \u00B7 Kill ' + kills);
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04060f'); bg.addColorStop(1, '#131a33');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    stars.forEach(function (s) { ctx.globalAlpha = 0.25 + s.v * 0.3; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    ctx.fillStyle = th.primary;
    bullets.forEach(function (b) { ctx.shadowColor = th.primary; ctx.shadowBlur = 8; ctx.fillRect(b.x - 2, b.y - 8, 4, 12); });
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0055';
    ebullets.forEach(function (b) { ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.shadowBlur = 0;

    enemies.forEach(function (e) {
      var w = e.tipe === 'shooter' ? th.secondary : '#ff007f';
      ctx.shadowColor = w; ctx.shadowBlur = 10; ctx.fillStyle = w;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#060911';
      ctx.fillRect(e.x + 5, e.y + 6, e.w - 10, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(e.x, e.y + e.h - 3, e.w * Math.max(0, e.hp) / (e.tipe === 'shooter' ? 3 : 2), 3);
    });

    if (!gameOver) {
      ctx.save();
      if (ship.inv > 0 && Math.floor(runT / 4) % 2 === 0) ctx.globalAlpha = 0.35;
      ctx.translate(ship.x, ship.y);
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(13, 12); ctx.lineTo(0, 6); ctx.lineTo(-13, 12); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = th.primary;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 8); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(-3, 12, 6, 4 + Math.sin(runT / 2) * 3);
      ctx.restore(); ctx.globalAlpha = 1;
    }

    parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna || th.primary;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#ff0055'; ctx.font = '700 12px "Segoe UI", sans-serif';
    for (var i = 0; i < Math.max(0, lives); i++) ctx.fillText('♥', 12 + i * 16, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('KILL ' + kills, W - 70, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(4,6,15,0.8)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + ' · KILL: ' + kills, W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / SPACE UNTUK MAIN LAGI', W / 2, H / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { ship: ship, enemies: enemies, bullets: bullets, ebullets: ebullets, score: score, lives: lives, level: level, kills: kills, bombs: bombs, over: gameOver, w: W, h: H };
    requestAnimationFrame(loop);
  }

  function posDari (clientX) {
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, width: W };
    var skala = r.width ? W / r.width : 1;
    return (clientX - (r.left || 0)) * skala;
  }
  c.addEventListener('touchstart', function (e) { A.initAudio(); if (gameOver) { reset(); return; } target = posDari(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove', function (e) { if (!gameOver) target = posDari(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function () { target = null; }, { passive: false });
  c.addEventListener('mousedown', function (e) { A.initAudio(); if (gameOver) { reset(); return; } target = posDari(e.clientX); });
  c.addEventListener('mousemove', function (e) { if (target !== null && !gameOver) target = posDari(e.clientX); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; target = null; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; target = null; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; targetY = null; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; targetY = null; e.preventDefault(); }
    else if (k === 'Space') { if (gameOver) reset(); else bom(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
  });

  reset();
  requestAnimationFrame(loop);
`

export function shooterHtml (brand = 'THERYHANN!') {
  return shell('Space Shooter', brand, SHOOTER_JS, { w: 520, h: 700, maxw: 430, hint: '◀ ▶ geser  ·  ▲ ▼ maju/mundur  ·  ● bom (3×)' })
}

/* ------------------------------------------------------------------ */
/*  3. DINO RUN                                                        */
/* ------------------------------------------------------------------ */
const DINO_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height, GY = H - 48;
  var dino, obs, parts, clouds, score, speed, level, gameOver, runT, spawnT, ducking, jumpHold, keys;

  function reset () {
    dino = { x: 84, y: GY, w: 30, h: 44, vy: 0, onGround: true };
    obs = []; parts = []; clouds = [];
    for (var i = 0; i < 5; i++) clouds.push({ x: A.rand(0, W), y: A.rand(20, 130), s: A.rand(0.4, 1) });
    score = 0; speed = 5.2; level = 1; gameOver = false; runT = 0; spawnT = 60; ducking = false; jumpHold = 0; keys = {};
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Speed 5.2x'); A.setProgress(0);
  }
  function lompat () {
    A.initAudio();
    if (gameOver) { reset(); return; }
    if (dino.onGround) { dino.vy = -12.6; dino.onGround = false; jumpHold = 10; A.SFX.jump(); }
  }
  function spawn () {
    var burung = level >= 2 && Math.random() < 0.3;
    if (burung) {
      var tinggi = Math.random() < 0.5 ? 52 : 96;
      obs.push({ tipe: 'bird', x: W + 30, y: GY - tinggi, w: 34, h: 24, t: 0 });
    } else {
      var n = Math.random() < 0.35 ? 2 : 1;
      var h = n === 2 ? 54 : A.rand(32, 48);
      obs.push({ tipe: 'cactus', x: W + 30, y: GY - h, w: 16 + n * 13, h: h });
    }
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    for (var i = 0; i < 18; i++) parts.push({ x: dino.x, y: dino.y - 20, vx: A.rand(-4, 4), vy: A.rand(-5, 1), life: 1, size: A.rand(2, 5), warna: '#ffffff' });
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }

  function update (dt) {
    runT += dt;
    clouds.forEach(function (cl) { cl.x -= cl.s * speed * 0.18 * dt; if (cl.x < -60) { cl.x = W + 40; cl.y = A.rand(20, 130); } });
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.3 * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (jumpHold > 0) { jumpHold -= dt; dino.vy -= 0.28 * dt; }
    dino.vy += 0.66 * dt;
    dino.y += dino.vy * dt;
    if (dino.y >= GY) { dino.y = GY; dino.vy = 0; dino.onGround = true; }
    dino.h = ducking && dino.onGround ? 26 : 44;
    // ◀ ▶ : geser posisi lari (maju/mundur) supaya timing lompat lebih bebas
    var dx = (keys.right ? 4.4 : 0) - (keys.left ? 4.4 : 0);
    dino.x += dx * dt;
    dino.x = Math.max(40, Math.min(W * 0.45, dino.x));

    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(34, (level >= 2 ? 78 : 96) - speed * 3.4 + A.rand(-8, 22)); }
    obs.forEach(function (o) { o.x -= speed * dt; if (o.tipe === 'bird') o.t += 0.2 * dt; });
    obs = obs.filter(function (o) { return o.x > -60; });

    var hb = { x: dino.x - dino.w / 2 + 5, y: dino.y - dino.h + 4, w: dino.w - 10, h: dino.h - 6 };
    obs.forEach(function (o) {
      var ob = { x: o.x + 3, y: o.y + (o.tipe === 'bird' ? Math.sin(o.t) * 5 : 0) + 3, w: o.w - 6, h: o.h - 6 };
      if (hb.x < ob.x + ob.w && hb.x + hb.w > ob.x && hb.y < ob.y + ob.h && hb.y + hb.h > ob.y) mati();
    });

    score += dt * speed * 0.16;
    speed = Math.min(12.5, 5.2 + score * 0.012);
    var nl = Math.floor(score / 120) + 1;
    if (nl !== level) { level = nl; A.SFX.level(); }
    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('Level ' + level, 'Speed ' + speed.toFixed(1) + 'x');
    A.setProgress((score % 120) / 120);
  }

  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0715'); bg.addColorStop(1, '#1b1030');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    clouds.forEach(function (cl) {
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, 14 * cl.s, 0, Math.PI * 2);
      ctx.arc(cl.x + 16 * cl.s, cl.y + 4 * cl.s, 11 * cl.s, 0, Math.PI * 2);
      ctx.arc(cl.x - 15 * cl.s, cl.y + 5 * cl.s, 10 * cl.s, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(15,20,35,0.95)'; ctx.fillRect(0, GY, W, H - GY);
    ctx.shadowColor = th.primary; ctx.shadowBlur = 10; ctx.strokeStyle = th.primary; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W, GY); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var gx = -(runT * speed * 2) % 46; gx < W; gx += 46) { ctx.moveTo(gx, GY + 14); ctx.lineTo(gx + 22, GY + 14); }
    ctx.stroke();

    obs.forEach(function (o) {
      if (o.tipe === 'cactus') {
        ctx.shadowColor = '#00ff87'; ctx.shadowBlur = 10; ctx.fillStyle = '#00ff87';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0; ctx.fillStyle = '#060911';
        ctx.fillRect(o.x + 3, o.y + 6, 3, o.h - 12);
      } else {
        var yy = o.y + Math.sin(o.t) * 5;
        ctx.shadowColor = '#ffb703'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffb703';
        ctx.fillRect(o.x, yy, o.w, o.h);
        ctx.shadowBlur = 0; ctx.fillStyle = '#060911';
        var kepak = Math.sin(o.t * 2) > 0 ? -8 : 8;
        ctx.fillRect(o.x + 6, yy + kepak + 8, o.w - 14, 5);
        ctx.fillStyle = '#ff0055'; ctx.fillRect(o.x + o.w - 8, yy + 6, 4, 4);
      }
    });

    if (!gameOver) {
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
      ctx.fillRect(dino.x - dino.w / 2, dino.y - dino.h, dino.w, dino.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = th.primary;
      ctx.fillRect(dino.x - dino.w / 2 + 5, dino.y - dino.h + 6, dino.w - 12, 7);
      ctx.fillStyle = '#060911';
      ctx.fillRect(dino.x + 4, dino.y - dino.h + 8, 5, 5);
      ctx.fillStyle = th.secondary;
      var kaki = Math.floor(runT / 4) % 2 === 0 ? 0 : 6;
      if (dino.onGround) {
        ctx.fillRect(dino.x - dino.w / 2 + 3, dino.y - 6, 8, 6);
        ctx.fillRect(dino.x + dino.w / 2 - 11 + kaki * 0.4, dino.y - 6, 8, 6);
      } else ctx.fillRect(dino.x - dino.w / 2 + 6, dino.y - 8, 16, 6);
    }

    parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna || th.primary;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(10,7,21,0.8)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score), W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / SPACE = LOMPAT · BAWAH = MENUNDUK', W / 2, H / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { dino: dino, obs: obs, score: score, speed: speed, level: level, over: gameOver, ground: GY, ducking: ducking, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { top: 0, height: H };
    var y = ((e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1));
    if (y > H * 0.66) ducking = true; else lompat();
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function () { ducking = false; }, { passive: false });
  c.addEventListener('mousedown', function (e) { A.initAudio(); if (gameOver) reset(); else lompat(); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') { if (gameOver) reset(); else lompat(); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { ducking = true; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; e.preventDefault(); }
    else if (k === 'Enter') { if (gameOver) reset(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowDown' || k === 'KeyS') ducking = false;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });

  reset();
  requestAnimationFrame(loop);
`

export function dinoHtml (brand = 'THERYHANN!') {
  return shell('Dino Run', brand, DINO_JS, { w: 780, h: 380, maxw: 640, hint: '▲ / ● lompat  ·  ▼ menunduk  ·  ◀ ▶ geser posisi lari' })
}

export const ARCADE_GAMES2 = [
  { id: 'breakout', title: 'Breakout Neon', html: breakoutHtml },
  { id: 'shooter', title: 'Space Shooter', html: shooterHtml },
  { id: 'dino', title: 'Dino Run', html: dinoHtml }
]

export default { breakoutHtml, shooterHtml, dinoHtml, ARCADE_GAMES2 }
