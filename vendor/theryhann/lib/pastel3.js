/**
 * 🪩 PINBALL PASTEL — HTML app, skin pastel v7.5
 * ------------------------------------------------------------------
 *  ◀ = flipper kiri, ▶ = flipper kanan, ● = luncurkan bola.
 *  Fisika bola (gravitasi + pantul), 3 bumper membal & memberi poin,
 *  3 bola per sesi. Bola jatuh ke lubang = kehilangan satu bola.
 */
import { shell } from './htmlgames.js'

const PINBALL_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var R = 10, GRAV = 0.22, KIRI = 10, KANAN = 470, ATAS = 10;
  var LANE = 420, FL = 78, FR = 9;
  var IDLE = 900;
  var PIV_L = { x: 150, y: 612 }, PIV_R = { x: 330, y: 612 };
  var BUMPER = [{ x: 150, y: 250, r: 27, t: 0 }, { x: 300, y: 214, r: 27, t: 0 }, { x: 226, y: 348, r: 27, t: 0 }];
  /* dinding corongan: mempersempit jalan bola supaya selalu mengarah ke flipper.
     Tanpa ini ada celah ~90px di samping flipper dan bola langsung habis. */
  var DINDING = [
    { x1: KIRI + 2, y1: 392, x2: 138, y2: 598 },
    { x1: LANE - 2, y1: 392, x2: 342, y2: 598 }
  ];

  var bola, sisa, skor, gameOver, pesan, runT, idle, fase;
  var flipL, flipR, tekanL, tekanR, prevL, prevR, kenaBumper, comboBumper, tahanL, tahanR;

  /* ---------- fungsi murni (A.debug) ---------- */

  function segTitikDekat (px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    var t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + dx * t, y: ay + dy * t, t: t };
  }

  function sudutFlipper (kiri, progres) {
    if (kiri) return 0.45 - 1.0 * progres;
    return Math.PI - 0.45 + 1.0 * progres;
  }

  function ujungFlipper (kiri, progres) {
    var p = kiri ? PIV_L : PIV_R, a = sudutFlipper(kiri, progres);
    return { x: p.x + Math.cos(a) * FL, y: p.y + Math.sin(a) * FL };
  }

  function laju (vx, vy) { return Math.sqrt(vx * vx + vy * vy); }

  function batasiLaju (maks) {
    var v = laju(bola.vx, bola.vy);
    if (v > maks) { bola.vx = bola.vx / v * maks; bola.vy = bola.vy / v * maks; }
  }

  /* ---------- keadaan ---------- */

  function bolaBaru () {
    bola = { x: 445, y: 655, vx: 0, vy: 0, aktif: false };
    fase = 'siap';
    A.setStatus('Bola ' + sisa, 'Siap luncur');
  }

  function reset () {
    sisa = 3; skor = 0; gameOver = false; pesan = ''; runT = 0; idle = 0;
    flipL = 0; flipR = 0; tekanL = false; tekanR = false; prevL = 0; prevR = 0; tahanL = 0; tahanR = 0;
    kenaBumper = 0; comboBumper = 0;
    for (var i = 0; i < BUMPER.length; i++) BUMPER[i].t = 0;
    A.setScore(0); A.setBest(); A.setProgress(0);
    bolaBaru();
  }

  function tamat (sebab) {
    gameOver = true; fase = 'over'; pesan = sebab || 'BOLA HABIS'; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
    A.setStatus('Skor ' + skor, 'Rekor ' + A.best);
  }

  function luncurkan () {
    if (gameOver) { reset(); return; }
    if (fase !== 'siap') return;
    bola.aktif = true; bola.vy = -14.2; bola.vx = 0; fase = 'main';
    A.SFX.jump(); A.setStatus('Bola ' + sisa, 'Main');
  }

  function flipper (kiri, on) {
    if (kiri) tekanL = on; else tekanR = on;
  }

  function tabrakFlipper (kiri) {
    var prog = kiri ? flipL : flipR, prev = kiri ? prevL : prevR;
    var p = kiri ? PIV_L : PIV_R;
    var u = ujungFlipper(kiri, prog);
    var cp = segTitikDekat(bola.x, bola.y, p.x, p.y, u.x, u.y);
    var dx = bola.x - cp.x, dy = bola.y - cp.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    if (dist > R + FR) return false;
    var nx = dx / dist, ny = dy / dist;
    bola.x = cp.x + nx * (R + FR); bola.y = cp.y + ny * (R + FR);
    var vn = bola.vx * nx + bola.vy * ny;
    if (vn < 0) { bola.vx -= 1.72 * vn * nx; bola.vy -= 1.72 * vn * ny; }
    var sweep = Math.abs(sudutFlipper(kiri, prog) - sudutFlipper(kiri, prev));
    if (sweep > 0.002) {
      var impuls = sweep * (0.35 + cp.t) * 15;
      bola.vy -= impuls * 0.92;
      bola.vx += nx * impuls * 0.42 + (kiri ? impuls * 0.22 : -impuls * 0.22);
      A.SFX.point();
    }
    batasiLaju(19);
    return true;
  }

  function tabrakDinding (d) {
    var cp = segTitikDekat(bola.x, bola.y, d.x1, d.y1, d.x2, d.y2);
    var dx = bola.x - cp.x, dy = bola.y - cp.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    if (dist > R + 4) return false;
    var nx = dx / dist, ny = dy / dist;
    bola.x = cp.x + nx * (R + 4); bola.y = cp.y + ny * (R + 4);
    var vn = bola.vx * nx + bola.vy * ny;
    if (vn < 0) { bola.vx -= 1.78 * vn * nx; bola.vy -= 1.78 * vn * ny; }
    bola.vx *= 0.965; bola.vy *= 0.965;
    batasiLaju(19);
    return true;
  }

  function langkah () {
    if (gameOver || !bola.aktif) return;
    bola.vy += GRAV;
    batasiLaju(20);
    bola.x += bola.vx; bola.y += bola.vy;

    /* dinding luar */
    if (bola.x - R < KIRI) { bola.x = KIRI + R; bola.vx = Math.abs(bola.vx) * 0.74; }
    if (bola.y - R < ATAS) { bola.y = ATAS + R; bola.vy = Math.abs(bola.vy) * 0.74; }

    /* lane kanan: pemisah vertikal + panduan melengkung di atas */
    if (bola.y > 250) {
      if (bola.x + R > KANAN) { bola.x = KANAN - R; bola.vx = -Math.abs(bola.vx) * 0.74; }
      if (bola.x > LANE - 260 && bola.x < LANE && bola.y > 250) { /* area main biasa */ }
      var d = Math.abs(bola.x - LANE);
      if (d < R + 4) {
        if (bola.x < LANE) { bola.x = LANE - R - 4; bola.vx = -Math.abs(bola.vx) * 0.7; }
        else { bola.x = LANE + R + 4; bola.vx = Math.abs(bola.vx) * 0.7; }
      }
    } else {
      if (bola.x + R > KANAN) { bola.x = KANAN - R; bola.vx = -Math.abs(bola.vx) * 0.74; }
      if (bola.x > LANE - 40 && bola.vx > -3.4) bola.vx -= 0.42;
    }

    /* bumper */
    for (var i = 0; i < BUMPER.length; i++) {
      var B = BUMPER[i];
      var bx = bola.x - B.x, by = bola.y - B.y;
      var bd = Math.sqrt(bx * bx + by * by);
      if (bd < R + B.r) {
        var nx = bx / (bd || 1), ny = by / (bd || 1);
        bola.x = B.x + nx * (R + B.r); bola.y = B.y + ny * (R + B.r);
        bola.vx = nx * 8.4; bola.vy = ny * 8.4;
        B.t = 12; kenaBumper++; comboBumper++;
        skor += 10 * Math.min(5, comboBumper);
        A.setScore(skor); A.SFX.point();
        A.setProgress(Math.min(1, skor / 3000));
        if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      }
    }

    /* dinding corongan lalu flipper */
    for (var w = 0; w < DINDING.length; w++) tabrakDinding(DINDING[w]);
    tabrakFlipper(true); tabrakFlipper(false);

    /* jatuh */
    if (bola.y - R > H + 10) {
      bola.aktif = false; sisa--; comboBumper = 0;
      A.SFX.crash();
      if (sisa <= 0) { tamat('BOLA HABIS — SKOR ' + skor); }
      else bolaBaru();
    }
  }

  /* ---------- gambar ---------- */

  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff0f5'); bg.addColorStop(0.6, '#fff7f2'); bg.addColorStop(1, '#eefaf6');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* dinding main */
    ctx.strokeStyle = '#ffc9da'; ctx.lineWidth = 6;
    bulat(KIRI - 3, ATAS - 3, KANAN - KIRI + 6, H - ATAS + 6, 26); ctx.stroke();

    /* pemisah lane */
    ctx.strokeStyle = '#ffd7e4'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(LANE, 250); ctx.lineTo(LANE, H - 8); ctx.stroke();

    /* dinding corongan */
    ctx.lineCap = 'round';
    for (var wd = 0; wd < DINDING.length; wd++) {
      var DW = DINDING[wd];
      ctx.strokeStyle = '#c9a7eb'; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(DW.x1, DW.y1); ctx.lineTo(DW.x2, DW.y2); ctx.stroke();
      ctx.strokeStyle = '#fffaf6'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(DW.x1, DW.y1); ctx.lineTo(DW.x2, DW.y2); ctx.stroke();
    }

    /* hiasan hati */
    ctx.fillStyle = 'rgba(255,201,218,0.45)';
    for (var h = 0; h < 8; h++) {
      var hx = 40 + (h * 57) % 340, hy = 420 + ((h * 41) % 140);
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
    }

    /* bumper */
    for (var i = 0; i < BUMPER.length; i++) {
      var B = BUMPER[i], k = B.t > 0 ? 1 + B.t / 26 : 1;
      ctx.beginPath(); ctx.arc(B.x, B.y, B.r * k, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#ff9ec4' : (i === 1 ? '#8ee0c8' : '#ffd166'); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#fffaf6'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = i === 0 ? '#d9607f' : (i === 1 ? '#5cb89c' : '#d9a534'); ctx.stroke();
      ctx.fillStyle = '#5b4650';
      ctx.beginPath(); ctx.arc(B.x - 7, B.y - 3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(B.x + 7, B.y - 3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(B.x, B.y + 2, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      if (B.t > 0) B.t--;
    }

    /* flipper */
    for (var f = 0; f < 2; f++) {
      var kiri = f === 0, prog = kiri ? flipL : flipR, p = kiri ? PIV_L : PIV_R;
      var u = ujungFlipper(kiri, prog);
      ctx.lineCap = 'round'; ctx.lineWidth = FR * 2 + 4;
      ctx.strokeStyle = '#c9a7eb';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(u.x, u.y); ctx.stroke();
      ctx.lineWidth = FR * 2 - 4; ctx.strokeStyle = '#fffaf6';
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(u.x, u.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#9a74c4'; ctx.fill();
    }

    /* bola */
    ctx.beginPath(); ctx.arc(bola.x, bola.y, R, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffb3c9'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,143,177,0.55)';
    ctx.beginPath(); ctx.arc(bola.x - 3, bola.y - 3, 3, 0, Math.PI * 2); ctx.fill();

    /* HUD */
    ctx.textAlign = 'left'; ctx.fillStyle = '#7a5c6b'; ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + skor, 22, 40);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff7aa2'; ctx.font = '900 20px "Segoe UI", sans-serif';
    var bl = '';
    for (i = 0; i < sisa; i++) bl += '● ';
    ctx.fillText(bl || '—', W - 22, 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#b79aa8'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('BUMPER ' + kenaBumper + '   ·   REKOR ' + A.best, 22, 62);

    if (fase === 'siap' && !gameOver) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,107,138,0.95)'; ctx.font = '900 17px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN ● UNTUK MELUNCURKAN', W / 2 - 20, 560); ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.92)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 34px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 10);
      ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 26);
      ctx.fillStyle = '#3fbb94'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('REKOR ' + A.best, W / 2, H / 2 + 52);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 84);
      ctx.textAlign = 'left';
    } else if (idle > IDLE * 0.6) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,107,138,0.9)'; ctx.font = '900 15px "Segoe UI", sans-serif';
      ctx.fillText('AFK ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's', W / 2, 110); ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;

    /* ketukan di kanvas menahan flipper beberapa frame (pengganti setTimeout,
       supaya tetap jalan di webview yang men-throttle timer) */
    if (tahanL > 0) { tahanL -= dt; if (tahanL <= 0) flipper(true, false); }
    if (tahanR > 0) { tahanR -= dt; if (tahanR <= 0) flipper(false, false); }
    prevL = flipL; prevR = flipR;
    flipL += ((tekanL ? 1 : 0) - flipL) * 0.42 * dt;
    flipR += ((tekanR ? 1 : 0) - flipR) * 0.42 * dt;
    if (flipL > 0.999) flipL = 1; if (flipL < 0.001) flipL = 0;
    if (flipR > 0.999) flipR = 1; if (flipR < 0.001) flipR = 0;

    if (!gameOver) {
      idle += dt;
      if (idle > IDLE) tamat('AFK ' + Math.round(IDLE / 60) + ' DETIK');
      for (var s = 0; s < 2; s++) langkah();
      if (fase === 'main' && bola.vy > 6 && bola.y > 480) comboBumper = 0;
    }

    draw();

    A.state = {
      x: Math.round(bola.x), y: Math.round(bola.y), vx: Number(bola.vx.toFixed(2)), vy: Number(bola.vy.toFixed(2)),
      fase: fase, bola: sisa, skor: skor, over: gameOver, sebab: pesan, idle: Math.round(idle),
      bumper: kenaBumper, flipL: Number(flipL.toFixed(2)), flipR: Number(flipR.toFixed(2)), best: A.best
    };

    requestAnimationFrame(loop);
  }

  A.debug = { segTitikDekat: segTitikDekat, DINDING: DINDING, BUMPER: BUMPER, sudutFlipper: sudutFlipper, ujungFlipper: ujungFlipper, laju: laju, GRAV: GRAV, R: R, FL: FL };

  /* ---------- input ---------- */

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') flipper(true, true);
    else if (k === 'ArrowRight' || k === 'KeyD') flipper(false, true);
    else if (k === 'Space' || k === 'Enter' || k === 'ArrowUp' || k === 'KeyW') luncurkan();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') flipper(true, false);
    else if (k === 'ArrowRight' || k === 'KeyD') flipper(false, false);
  });

  function sentuh (e) {
    A.initAudio(); idle = 0;
    if (gameOver) { reset(); return; }
    if (fase === 'siap') { luncurkan(); return; }
    var px = null;
    try {
      var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = c.getBoundingClientRect();
      px = (t.clientX - r.left) * (W / r.width);
    } catch (err) { px = null; }
    if (px === null) { flipper(true, true); tahanL = 8; return; }
    if (px < W / 2) { flipper(true, true); tahanL = 8; }
    else { flipper(false, true); tahanR = 8; }
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function pinballHtml (brand = 'THERYHANN!') {
  return shell('Pinball Pastel', brand, PINBALL_JS, {
    w: 480, h: 700, maxw: 440, skin: 'pastel', sub: 'PASTEL',
    hint: '\u25CF luncurkan bola  \u00B7  \u25C0 flipper kiri  \u00B7  \u25B6 flipper kanan  \u00B7  3 bola, kena bumper = poin'
  })
}

export const PASTEL3 = [
  { id: 'pinball', cmd: 'pinball', icon: '\u{1FAA9}', title: 'Pinball Pastel', nama: 'Pinball Pastel', html: pinballHtml, ratio: '480\u00D7700', w: 480, h: 700 }
]
