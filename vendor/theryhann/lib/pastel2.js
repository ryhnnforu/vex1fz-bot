/**
 * 🫧 BALON SABUN — bubble shooter (HTML app, skin pastel v7.5)
 * ------------------------------------------------------------------
 *  Sistem sama dengan arcade (canvas + D-pad + WebAudio + localStorage).
 *  Bidik pakai ◀ ▶, tembak pakai ● / ▲. 3+ balon sewarna yang bersentuhan
 *  pecah; gugusan yang tidak lagi menempel di langit-langit ikut jatuh.
 *  Tiap 8 tembakan langit-langit turun satu baris.
 */
import { shell } from './htmlgames.js'

const BUBBLE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var R = 19, COLS = 11, ROWS = 16, OX = 30, OY = 44;
  var ROWH = 2 * R * 0.866;
  var BAHAYA = H - 120;
  var WARNA = ['#ff8fb1', '#ffd166', '#8ee0c8', '#a0c4ff', '#c9a7eb', '#ffab73'];
  var GELAP = ['#d9607f', '#d9a534', '#5cb89c', '#6f96d8', '#9a74c4', '#d9834a'];
  var IDLE = 900;

  var grid, sudut, aktif, antri, tembakan, skor, gameOver, pesan, runT, idle;
  var bola, jatuh, ledak, turunSisa;

  /* ---------- fungsi murni (A.debug) ---------- */

  function tetanggaB (r, col) {
    var ganjil = (r % 2) === 1;
    var d = ganjil
      ? [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]]
      : [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];
    var out = [];
    for (var i = 0; i < d.length; i++) {
      var rr = r + d[i][1], cc = col + d[i][0];
      if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) out.push([rr, cc]);
    }
    return out;
  }

  function isi (r, col) { return (grid[r] && grid[r][col] !== undefined) ? grid[r][col] : -1; }

  function grupSama (r, col, warna) {
    var lihat = {}, tumpuk = [[r, col]], out = [];
    while (tumpuk.length) {
      var p = tumpuk.pop(), k = p[0] + ':' + p[1];
      if (lihat[k]) continue;
      lihat[k] = 1;
      if (isi(p[0], p[1]) !== warna) continue;
      out.push(p);
      var t = tetanggaB(p[0], p[1]);
      for (var i = 0; i < t.length; i++) tumpuk.push(t[i]);
    }
    return out;
  }

  function jangkar () {
    var lihat = {}, tumpuk = [];
    for (var cc = 0; cc < COLS; cc++) if (isi(0, cc) >= 0) tumpuk.push([0, cc]);
    while (tumpuk.length) {
      var p = tumpuk.pop(), k = p[0] + ':' + p[1];
      if (lihat[k] || isi(p[0], p[1]) < 0) continue;
      lihat[k] = 1;
      var t = tetanggaB(p[0], p[1]);
      for (var i = 0; i < t.length; i++) tumpuk.push(t[i]);
    }
    return lihat;
  }

  function selMelayang () {
    var a = jangkar(), out = [];
    for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
      if (isi(r, cc) >= 0 && !a[r + ':' + cc]) out.push([r, cc]);
    }
    return out;
  }

  function posXY (r, col) {
    return { x: OX + R + col * 2 * R + ((r % 2) ? R : 0), y: OY + R + r * ROWH };
  }

  function selDariXY (x, y) {
    var r = Math.round((y - OY - R) / ROWH);
    r = Math.max(0, Math.min(ROWS - 1, r));
    var col = Math.round((x - OX - R - ((r % 2) ? R : 0)) / (2 * R));
    col = Math.max(0, Math.min(COLS - 1, col));
    if (isi(r, col) < 0) return [r, col];
    var t = tetanggaB(r, col), terbaik = null, jd = 1e9;
    for (var i = 0; i < t.length; i++) {
      if (isi(t[i][0], t[i][1]) >= 0) continue;
      var p = posXY(t[i][0], t[i][1]);
      var dd = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (dd < jd) { jd = dd; terbaik = t[i]; }
    }
    return terbaik || [r, col];
  }

  /* ---------- keadaan ---------- */

  function warnaAcak () {
    var ada = {}, list = [], r, cc;
    for (r = 0; r < ROWS; r++) for (cc = 0; cc < COLS; cc++) if (isi(r, cc) >= 0) ada[isi(r, cc)] = 1;
    for (var k in ada) list.push(parseInt(k, 10));
    if (!list.length) list = [0, 1, 2, 3, 4, 5];
    return list[Math.floor(A.rand(0, list.length))];
  }

  function reset () {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      var bar = [];
      for (var cc = 0; cc < COLS; cc++) bar.push(r < 5 ? Math.floor(A.rand(0, WARNA.length)) : -1);
      grid.push(bar);
    }
    sudut = -90; aktif = warnaAcak(); antri = warnaAcak();
    tembakan = 0; skor = 0; gameOver = false; pesan = ''; runT = 0; idle = 0;
    bola = null; jatuh = []; ledak = []; turunSisa = 0;
    A.setScore(0); A.setBest(); A.setStatus('Baris 5', 'Tembakan 0'); A.setProgress(0);
  }

  function tamat (sebab) {
    gameOver = true; pesan = sebab || 'BALON TURUN'; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
    A.setStatus('Skor ' + skor, 'Rekor ' + A.best);
  }

  function jumlahBaris () {
    for (var r = ROWS - 1; r >= 0; r--) for (var cc = 0; cc < COLS; cc++) if (isi(r, cc) >= 0) return r + 1;
    return 0;
  }

  function tembak () {
    if (gameOver) { reset(); return; }
    if (bola) return;
    var rad = sudut * Math.PI / 180;
    bola = { x: W / 2, y: H - 62, vx: Math.cos(rad) * 11, vy: Math.sin(rad) * 11, w: aktif };
    aktif = antri; antri = warnaAcak();
    A.SFX.jump();
  }

  function tempel (x, y, w) {
    var s = selDariXY(x, y);
    grid[s[0]][s[1]] = w;
    bola = null;
    tembakan++;
    var grup = grupSama(s[0], s[1], w);
    if (grup.length >= 3) {
      for (var i = 0; i < grup.length; i++) {
        var p = posXY(grup[i][0], grup[i][1]);
        ledak.push({ x: p.x, y: p.y, w: w, t: 16 });
        grid[grup[i][0]][grup[i][1]] = -1;
      }
      var lay = selMelayang();
      for (i = 0; i < lay.length; i++) {
        var q = posXY(lay[i][0], lay[i][1]);
        jatuh.push({ x: q.x, y: q.y, w: grid[lay[i][0]][lay[i][1]], vy: 1 });
        grid[lay[i][0]][lay[i][1]] = -1;
      }
      skor += grup.length * 10 + lay.length * 20;
      A.SFX.point();
      if (lay.length) A.SFX.level();
    } else {
      A.SFX.crash();
    }
    if (tembakan % 8 === 0) turunBaris();
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    A.setStatus('Baris ' + jumlahBaris(), 'Tembakan ' + tembakan);
    A.setProgress(Math.min(1, skor / 2000));
    if (!jumlahBaris()) { skor += 500; A.setScore(skor); tamat('SEMUA BALON PECAH! BONUS 500'); }
  }

  function turunBaris () {
    grid.unshift((function () { var b = []; for (var i = 0; i < COLS; i++) b.push(-1); return b; })());
    grid.pop();
    var baru = [];
    for (var cc = 0; cc < COLS; cc++) if (Math.random() < 0.55) baru.push(Math.floor(A.rand(0, WARNA.length))); else baru.push(-1);
    for (cc = 0; cc < COLS; cc++) grid[0][cc] = baru[cc];
    turunSisa = 14;
    for (var r = 0; r < ROWS; r++) for (cc = 0; cc < COLS; cc++) {
      if (isi(r, cc) >= 0) { var p = posXY(r, cc); if (p.y + R > BAHAYA) { tamat('BALON LEWAT GARIS'); return; } }
    }
  }

  /* ---------- gambar ---------- */

  function balon (x, y, w, skala, senyum) {
    var k = skala === undefined ? 1 : skala;
    if (k <= 0.03) return;
    ctx.beginPath(); ctx.arc(x, y, R * k, 0, Math.PI * 2);
    ctx.fillStyle = WARNA[w]; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = GELAP[w]; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(x - R * 0.32 * k, y - R * 0.36 * k, R * 0.26 * k, R * 0.16 * k, -0.6, 0, Math.PI * 2); ctx.fill();
    if (senyum && k > 0.6) {
      ctx.fillStyle = '#5b4650';
      ctx.beginPath(); ctx.arc(x - 5 * k, y - 1 * k, 2.2 * k, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 5 * k, y - 1 * k, 2.2 * k, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1.8 * k; ctx.strokeStyle = '#5b4650';
      ctx.beginPath(); ctx.arc(x, y + 3 * k, 4.5 * k, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#eefaf6'); bg.addColorStop(1, '#fff7f2');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* awan hias */
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i = 0; i < 5; i++) {
      var ax = (i * 131 + runT * 0.15) % (W + 90) - 45, ay = 60 + i * 108;
      ctx.beginPath(); ctx.arc(ax, ay, 20, 0, Math.PI * 2); ctx.arc(ax + 22, ay + 5, 15, 0, Math.PI * 2); ctx.arc(ax - 20, ay + 6, 13, 0, Math.PI * 2); ctx.fill();
    }

    var geser = turunSisa > 0 ? (turunSisa / 14) * ROWH : 0;
    for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
      var w = isi(r, cc); if (w < 0) continue;
      var p = posXY(r, cc);
      balon(p.x, p.y - geser, w, 1, false);
    }

    /* garis bahaya */
    ctx.strokeStyle = 'rgba(255,107,138,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(12, BAHAYA); ctx.lineTo(W - 12, BAHAYA); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,107,138,0.8)'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('GARIS BAHAYA', 14, BAHAYA - 6);

    /* ledakan & jatohan */
    for (i = 0; i < ledak.length; i++) { var L = ledak[i]; balon(L.x, L.y, L.w, L.t / 16, false); }
    for (i = 0; i < jatuh.length; i++) { var J = jatuh[i]; balon(J.x, J.y, J.w, 1, false); }

    /* pembidik */
    var rad = sudut * Math.PI / 180, sx = W / 2, sy = H - 62;
    ctx.strokeStyle = 'rgba(122,92,107,0.4)'; ctx.lineWidth = 3; ctx.setLineDash([5, 9]);
    ctx.beginPath(); ctx.moveTo(sx, sy);
    var px = sx, py = sy, vx = Math.cos(rad), vy = Math.sin(rad);
    for (i = 0; i < 60; i++) { px += vx * 9; py += vy * 9; if (px < OX || px > W - OX) vx = -vx; if (py < OY) break; ctx.lineTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);

    balon(sx, sy, aktif, 1, true);
    balon(sx - 46, sy + 16, antri, 0.72, false);
    ctx.fillStyle = '#b79aa8'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('BERIKUTNYA', sx - 46, sy + 42);

    if (bola) balon(bola.x, bola.y, bola.w, 1, false);

    /* HUD */
    ctx.textAlign = 'left'; ctx.fillStyle = '#7a5c6b'; ctx.font = '900 24px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + skor, 18, 30);
    ctx.textAlign = 'right'; ctx.fillStyle = '#3fbb94'; ctx.font = '900 18px "Segoe UI", sans-serif';
    ctx.fillText('TEMBAKAN ' + tembakan, W - 18, 30);
    ctx.textAlign = 'center';

    if (gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.9)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 32px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 36);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 8);
      ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 28);
      ctx.fillStyle = '#3fbb94'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('REKOR ' + A.best, W / 2, H / 2 + 52);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 82);
    } else if (idle > IDLE * 0.6) {
      ctx.fillStyle = 'rgba(255,107,138,0.9)'; ctx.font = '900 15px "Segoe UI", sans-serif';
      ctx.fillText('AFK ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's', W / 2, 100);
    }
    ctx.textAlign = 'left';
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;

    if (!gameOver) {
      idle += dt;
      if (idle > IDLE) tamat('AFK ' + Math.round(IDLE / 60) + ' DETIK');
      if (turunSisa > 0) turunSisa -= dt;

      if (bola) {
        for (var step = 0; step < 3 && bola; step++) {
          bola.x += bola.vx * dt / 3; bola.y += bola.vy * dt / 3;
          if (bola.x < OX) { bola.x = OX; bola.vx = -bola.vx; }
          if (bola.x > W - OX) { bola.x = W - OX; bola.vx = -bola.vx; }
          if (bola.y - R <= OY) { tempel(bola.x, OY + R, bola.w); break; }
          var kena = false;
          for (var r = 0; r < ROWS && !kena; r++) for (var cc = 0; cc < COLS; cc++) {
            if (isi(r, cc) < 0) continue;
            var p = posXY(r, cc), dx = p.x - bola.x, dy = p.y - bola.y;
            if (dx * dx + dy * dy < (2 * R - 3) * (2 * R - 3)) { tempel(bola.x, bola.y, bola.w); kena = true; break; }
          }
          if (kena) break;
          if (bola && bola.y > H) bola = null;
        }
      }

      for (var i = ledak.length - 1; i >= 0; i--) { ledak[i].t -= dt; if (ledak[i].t <= 0) ledak.splice(i, 1); }
      for (i = jatuh.length - 1; i >= 0; i--) { jatuh[i].vy += 0.7 * dt; jatuh[i].y += jatuh[i].vy * dt; if (jatuh[i].y > H + 40) jatuh.splice(i, 1); }
    }

    draw();

    A.state = {
      sudut: Math.round(sudut), over: gameOver, sebab: pesan, skor: skor, tembakan: tembakan,
      baris: jumlahBaris(), aktif: aktif, antri: antri, idle: Math.round(idle),
      bola: bola ? { x: Math.round(bola.x), y: Math.round(bola.y) } : null,
      ledak: ledak.length, jatuh: jatuh.length, best: A.best
    };

    requestAnimationFrame(loop);
  }

  A.debug = { tetanggaB: tetanggaB, grupSama: grupSama, selMelayang: selMelayang, jangkar: jangkar, selDariXY: selDariXY, posXY: posXY, R: R, COLS: COLS, ROWS: ROWS };

  /* ---------- input ---------- */

  function bidik (d) {
    if (gameOver) return;
    idle = 0;
    sudut = Math.max(-172, Math.min(-8, sudut + d));
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') bidik(-3.2);
    else if (k === 'ArrowRight' || k === 'KeyD') bidik(3.2);
    else if (k === 'ArrowUp' || k === 'KeyW') bidik(-0.7);
    else if (k === 'ArrowDown' || k === 'KeyS') bidik(0.7);
    else if (k === 'Space' || k === 'Enter') tembak();
  });

  function sentuh (e) {
    A.initAudio(); idle = 0;
    if (gameOver) { reset(); return; }
    var px = null, py = null;
    try {
      var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = c.getBoundingClientRect();
      px = (t.clientX - r.left) * (W / r.width); py = (t.clientY - r.top) * (H / r.height);
    } catch (err) { px = null; }
    if (px === null) { tembak(); return; }
    if (py < H - 110) sudut = Math.max(-172, Math.min(-8, Math.atan2(py - (H - 62), px - W / 2) * 180 / Math.PI));
    tembak();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function bubbleHtml (brand = 'THERYHANN!') {
  return shell('Balon Sabun', brand, BUBBLE_JS, {
    w: 520, h: 640, maxw: 470, skin: 'pastel', sub: 'PASTEL',
    hint: '\u25C0 \u25B6 bidik kasar  \u00B7  \u25B2 \u25BC bidik halus  \u00B7  \u25CF tembak  \u00B7  3+ balon sewarna pecah'
  })
}

export const PASTEL2 = [
  { id: 'bubble', cmd: 'bubble', icon: '\u{1FAE7}', title: 'Balon Sabun', nama: 'Balon Sabun', html: bubbleHtml, ratio: '520\u00D7640', w: 520, h: 640 }
]
