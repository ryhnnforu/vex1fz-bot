/**
 * 🕹️ HTMLGAMES 3 — 3 game arcade HTML tambahan (v7.1)
 * ------------------------------------------------------------
 *  Shell sama dengan lib/htmlgames.js (lihat htmlgames2.js untuk catatan).
 *
 *  Game:
 *    • Tetris Neon  — 7 tetromino, rotate/soft-hard drop, line clear, level
 *    • Pong Neon    — lawan CPU, first-to-3, bola makin cepat tiap pukulan
 *    • Neon Jump    — lompat antar platform, layar auto-naik (jangan jatuh)
 */
import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  1. TETRIS NEON                                                     */
/* ------------------------------------------------------------------ */
const TETRIS_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 660, H = 840;
  var COLS = 10, ROWS = 20, BLK = 34;
  var FX = 24, FY = 94;            /* field frame pos (layar hampir PENUH) */
  var PW = COLS * BLK, PH = ROWS * BLK;

  /* ----- 7 tetromino klasik (matriks rotasi berbasis sel, warna classic) ----- */
  var BENTUK = {
    I: { w: 4, sel: [[8,9,10,11],[2,6,10,14],[8,9,10,11],[2,6,10,14]], warna: '#22d3ee' },
    J: { w: 3, sel: [[0,3,4,5],[1,2,4,7],[3,4,5,8],[1,4,5,7]], warna: '#60a5fa' },
    L: { w: 3, sel: [[2,3,4,5],[0,4,8,9],[3,4,5,6],[1,2,6,9]], warna: '#f59e0b' },
    O: { w: 2, sel: [[0,1,2,3],[0,1,2,3],[0,1,2,3],[0,1,2,3]], warna: '#fde047' },
    S: { w: 3, sel: [[1,2,3,4],[1,4,5,8],[1,2,3,4],[1,4,5,8]], warna: '#4ade80' },
    T: { w: 3, sel: [[1,3,4,5],[1,4,5,7],[3,4,5,7],[1,3,5,7]], warna: '#c084fc' },
    Z: { w: 3, sel: [[0,1,4,5],[2,4,5,7],[0,1,4,5],[2,4,5,7]], warna: '#f87171' }
  };
  var NAMA = ['I','J','L','O','S','T','Z'];
  var SEL_INDEX = { I: 0, J: 1, L: 2, O: 3, S: 4, T: 5, Z: 6 };

  /* grid 2D (ROWS x COLS) dari indeks warna */
  function gridKosong () {
    var g = [];
    for (var r = 0; r < ROWS; r++) { g.push(new Array(COLS).fill(0)) }
    return g;
  }
  var grid = gridKosong();
  var piece = null, nextQ = [], score = 0, lines = 0, level = 1;
  var jatuhT = 0, over = false, keys = { up: false, down: false, left: false, right: false, act: false };
  var partikel = [], kb = 0, mulaiNuker = 1;

  /* interval jatuh: level makin besar = makin cepat (classic curve) */
  function fallInterval () { return Math.max(5, 44 - (level - 1) * 4) }

  function ambilAcak () {
    var i = Math.floor(Math.random() * NAMA.length)
    var tipe = NAMA[i];
    return newLembaran(tipe);
  }
  function newLembaran (tipe) {
    var b = BENTUK[tipe];
    return { tipe: tipe, x: tipe === 'I' ? 3 : 3, y: -1, sel: 0, warna: b.warna, selArr: b.sel, w: b.w };
  }
  function isiNpc () { while (nextQ.length < 3) nextQ.push(ambilAcak()) }

  function selPiece (p) {
    var idxSEL = p.sel % 4;
    var arr = p.selArr[idxSEL];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i];
      out.push({ x: t % p.w, y: Math.floor(t / p.w) });
    }
    return out;
  }
  function bisa (p, dx, dy, sel = null) {
    var sels = selPiece(sel ? { ...p, sel: sel } : p);
    for (var i = 0; i < sels.length; i++) {
      var x = p.x + sels[i].x + dx, y = p.y + sels[i].y + dy;
      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y >= 0 && grid[y][x]) return false;
    }
    return true;
  }

  function putar () {
    var baru = (piece.sel + 1) % 4;
    var arah = [-1, 1, -2, 2, 0];
    for (var i = 0; i < arah.length; i++) {
      if (bisa(piece, arah[i], 0, baru)) {
        piece.x += arah[i];
        piece.sel = baru;
        A.SFX.point();
        return;
      }
    }
  }
  function geser (d) {
    if (!piece) return;
    if (bisa(piece, d, 0)) { piece.x += d; A.SFX.point(); }
  }
  function hardDrop () {
    if (!piece) return;
    var d = 0;
    while (bisa(piece, 0, d + 1)) d++;
    piece.y += d;
    score += d * 2;               /* classic: hard drop +2/baris */
    A.SFX.level();
    kunciPiece();
  }

  function kunciPiece () {
    var sels = selPiece(piece);
    var skorBaris = 0;
    var lockDiTepiAtas = true;
    for (var i = 0; i < sels.length; i++) {
      var x = piece.x + sels[i].x, y = piece.y + sels[i].y;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        grid[y][x] = SEL_INDEX[piece.tipe] + 1;
        ledakan(FX + x * BLK + BLK / 2, FY + y * BLK + BLK / 2, piece.warna, 3);
      }
      if (y >= 1) lockDiTepiAtas = false;
    }
    /* bersihkan baris penuh */
    var penuh = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      var full = true;
      for (var rr = 0; rr < COLS; rr++) if (!grid[r][rr]) { full = false; break }
      if (full) {
        grid.splice(r, 1);
        grid.unshift(new Array(COLS).fill(0));
        penuh++; skorBaris++; r++;
        ledakan(FX + PW / 2, FY + r * BLK + BLK / 2, '#ffffff', 12);
      }
    }
    if (penuh) {
      var bayaran = [0, 100, 300, 500, 800][Math.min(4, penuh)] * level;
      score += bayaran;
      lines += penuh;
      var naik = 1 + Math.floor(lines / 10);
      if (naik > level) { level = naik; A.SFX.level() }
      A.SFX.point();
    }
    isiNpc();
    piece = nextQ.shift();
    /* spawn out = game over (kontak langsung) */
    if (!bisa(piece, 0, 0)) {
      over = true;
      A.SFX.crash();
      A.saveBest(score);
    }
    A.setScore(score);
  }

  /* cerai spawn awal */
  function baru () {
    grid = gridKosong();
    score = 0; lines = 0; level = 1; over = false;
    keys = { up: false, down: false, left: false, right: false, act: false };
    partikel = [];
    nextQ = [];
    isiNpc();
    piece = nextQ.shift();
    jatuhT = 0;
    A.setScore(0); A.setBest();
  }

  function ledakan (x, y, w, n) {
    for (var i = 0; i < n; i++) partikel.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-6, 0.5), a: 1, r: A.rand(2, 4), w: w });
  }

  /* keyboard */
  function setKey (kode, v) {
    if (kode === 'ArrowUp' || kode === 'KeyW') keys.up = v;
    else if (kode === 'ArrowDown' || kode === 'KeyS') keys.down = v;
    else if (kode === 'ArrowLeft' || kode === 'KeyA') keys.left = v;
    else if (kode === 'ArrowRight' || kode === 'KeyD') keys.right = v;
    else if (kode === 'Space' || kode === 'Enter') keys.act = v;
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over) { if (k === 'Space' || k === 'Enter') baru(); return }
    setKey(k, true);
    if (k === 'ArrowUp') putar();
    else if (k === 'ArrowLeft') geser(-1);
    else if (k === 'ArrowRight') geser(1);
    else if (k === 'Space' || k === 'Enter') hardDrop();
  });
  window.addEventListener('keyup', function (e) { setKey(e.code, false) });

  function eksekusiBundar (px, py) {
    /* tap kapsul toggle (di bawah NEXT block) sesuai permintaan */
    var TB = window.__TBTGL || [];
    for (var i = 0; i < TB.length; i++) {
      var b = TB[i];
      if (px >= b.x - 2 && px <= b.x + 44 && py >= 265 && py <= 305) {
        if (b.aksi === 'l') geser(-1);
        else if (b.aksi === 'r') putar();
        else if (b.aksi === 'd') { piece.y = Math.min(ROWS - 1, piece.y + 1); score += 1 }
        else if (b.aksi === 'space') hardDrop();
        A.SFX.point();
        return true;
      }
    }
    return false;
  }
  function ketuk (px, py) {
    if (over) { baru(); return }
    if (eksekusiBundar(px, py)) return;
    if (px < FX + PW * 0.34) geser(-1);
    else if (px > FX + PW * 0.66) geser(1);
    else if (py < FY + PH * 0.5) putar();
    else hardDrop();
  }

  /* DAS: repeat gerakan horizontal saat ditahan */
  var dasT = 0, DAS = 7;

  var last = 0, runT = 0;
  function update (dt) {
    runT += dt;
    for (var pi = partikel.length - 1; pi >= 0; pi--) {
      var q = partikel[pi];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.18 * dt; q.a -= 0.02 * dt;
      if (q.a <= 0) partikel.splice(pi, 1);
    }
    if (!over && piece) {
      /* DAS */
      if (keys.left || keys.right) {
        dasT += dt;
        if (dasT >= DAS) {
          dasT = 0;
          geser(keys.left && !keys.right ? -1 : 1);
        }
      } else dasT = 0;
      /* gravitasi (turun cepat saat ▼ ditahan — soft drop dengan skor) */
      var tujuan = keys.down ? 4 : fallInterval();
      jatuhT += dt;
      var didukungSoft = keys.down ? 1 : 0;
      while (jatuhT >= tujuan) {
        jatuhT -= tujuan;
        if (bisa(piece, 0, 1)) {
          piece.y++;
          score += didukungSoft ? 1 : 0;   /* classic soft drop +1/baris */
        } else {
          kunciPiece();
          break;
        }
      }
    }
    A.setScore(score);
    if (score > A.best) A.best = score;
    A.setProgress(Math.min(1, lines / 40));
    A.setStatus('Lv.' + level + ' · ' + lines + ' baris', fallInterval() + 'f/baris ' + (over ? '· GAME OVER' : ''));
    A.state = {
      grid: grid.map(function (r) { return r.slice() }),
      piece: piece ? { tipe: piece.tipe, x: piece.x, y: piece.y, sel: piece.sel, selArr: piece.selArr.slice(), warna: piece.warna } : null,
      next: nextQ.map(function (n) { return n.tipe }),
      score: score, lines: lines, level: level, over: over,
      cols: COLS, rows: ROWS,
      keys: { up: keys.up, down: keys.down, left: keys.left, right: keys.right, act: keys.act },
      rondaJatuh: fallInterval()
    }
  }

  /* gambar */
  function teks (t, x, y, sz, ws, gaya, rata) {
    ctx.fillStyle = ws;
    ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
  }
  var WARNA_NOMOR = [null, BENTUK.I.warna, BENTUK.J.warna, BENTUK.L.warna, BENTUK.O.warna, BENTUK.S.warna, BENTUK.T.warna, BENTUK.Z.warna];
  function gambarSel (x, y, warna, kecil = false) {
    var sz = BLK - (kecil ? 8 : 2);
    var off = kecil ? 4 : 1;
    ctx.fillStyle = '#111';
    ctx.fillRect(x + off, y + off, BLK - 2, BLK - 2);
    ctx.fillStyle = '#1f2a3a';
    ctx.fillRect(x + off, y + off, BLK - 2, BLK - 2);
    if (warna) {
      ctx.fillStyle = warna;
      ctx.fillRect(x + off + 1, y + off + 1, BLK - 4, BLK - 4);
      /* highlight atas kiri */
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(x + off + 1, y + off + 1, BLK - 4, Math.max(2, (BLK - 4) * 0.26));
      ctx.fillRect(x + off + 1, y + off + 1, Math.max(2, (BLK - 4) * 0.26), BLK - 4);
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    /* latar gelap klasik */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a1122'); bg.addColorStop(1, '#05070f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* header */
    teks('TETRIS', FX, 38, 34, '#ffffff', '900');
    teks('classic curve · gravity level dinamis', FX, 68, 13, '#8b93a8', '600');
    teks('▲ putar · ▼ soft · ● hard drop', FX + PW + 20, 38, 14, '#c4cfe2', '700');
    teks('ketuk: kiri/kanan geser, atas putar, bawah jatuh', FX + PW + 20, 58, 11.5, '#8b93a8', '600');

    /* field frame */
    ctx.fillStyle = '#0d1526'; ctx.fillRect(FX - 6, FY - 6, PW + 12, PH + 12);
    ctx.strokeStyle = '#27314a'; ctx.lineWidth = 2; ctx.strokeRect(FX - 6, FY - 6, PW + 12, PH + 12);
    /* grid sel */
    for (var r = 0; r < ROWS; r++) {
      for (var c2 = 0; c2 < COLS; c2++) {
        gambarSel(FX + c2 * BLK, FY + r * BLK, grid[r][c2] ? WARNA_NOMOR[grid[r][c2]] : null);
      }
    }
    /* piece yang bergerak */
    if (piece) {
      var sels = selPiece(piece);
      /* ghost dahulu, supaya bayangan */
      var gY = 0;
      while (bisa(piece, 0, gY + 1)) gY++;
      if (gY > 0) {
        for (var i = 0; i < sels.length; i++) {
          var gx = piece.x + sels[i].x, gy = piece.y + sels[i].y + gY;
          if (gy >= 0) {
            ctx.globalAlpha = 0.28;
            ctx.fillStyle = piece.warna;
            ctx.fillRect(FX + gx * BLK + 1, FY + gy * BLK + 1, BLK - 2, BLK - 2);
            ctx.globalAlpha = 1;
          }
        }
      }
      for (var i2 = 0; i2 < sels.length; i2++) {
        var x = piece.x + sels[i2].x, y = piece.y + sels[i2].y;
        if (y >= 0) gambarSel(FX + x * BLK, FY + y * BLK, piece.warna);
      }
    }
    /* grid line lembut */
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var c3 = 1; c3 < COLS; c3++) { ctx.moveTo(FX + c3 * BLK + 0.5, FY); ctx.lineTo(FX + c3 * BLK + 0.5, FY + PH) }
    for (var r3 = 1; r3 < ROWS; r3++) { ctx.moveTo(FX, FY + r3 * BLK + 0.5); ctx.lineTo(FX + PW, FY + r3 * BLK + 0.5) }
    ctx.stroke();

    /* partikel */
    for (var pi = 0; pi < partikel.length; pi++) {
      var q2 = partikel[pi];
      ctx.globalAlpha = Math.max(0, q2.a);
      ctx.fillStyle = q2.w;
      ctx.beginPath(); ctx.arc(q2.x, q2.y, q2.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* panel kanan */
    var px2 = FX + PW + 20;
    ctx.fillStyle = '#0d1526'; ctx.fillRect(px2 - 10, 86, W - px2 - FX + PW + 10 - 28 + 6, 660);
    ctx.strokeStyle = '#27314a'; ctx.lineWidth = 2; ctx.strokeRect(px2 - 10, 86, W - px2 - FX + PW + 10 - 28 + 6, 660);

    teks('NEXT', px2, 110, 13, '#8b93a8', '800');
    var ny = 124;
    for (var i3 = 0; i3 < nextQ.length; i3++) {
      var n = nextQ[i3];
      var selnya = selPiece({ ...n, sel: 0 });
      var makX = 0, makY = 0;
      for (var s3 = 0; s3 < selnya.length; s3++) { if (selnya[s3].x > makX) makX = selnya[s3].x; if (selnya[s3].y > makY) makY = selnya[s3].y }
      for (var s4 = 0; s4 < selnya.length; s4++) {
        var cx = px2 + 4 + (selnya[s4].x - 0) * 16, cy = ny + selnya[s4].y * 16;
        var wsm = n.warna;
        ctx.fillStyle = wsm;
        ctx.fillRect(cx, cy, 15, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(cx, cy, 15, 4);
      }
      ny += (makY + 1) * 16 + 16;
    }

    /* ----- TOGGLE KAPSUL — tepat di bawah block NEXT (sesuai permintaan) ----- */
    var tyb = 265;
    teks('TOGGLE (tap也向处 berlaku):', px2, tyb - 12, 11.5, '#8b93a8', '700');
    var TB = [
      { ikon: '◀', aksi: 'l', x: px2, label: 'kiri' },
      { ikon: '▼', aksi: 'd', x: px2 + 52, label: 'soft' },
      { ikon: '▲', aksi: 'r', x: px2 + 104, label: 'putar' },
      { ikon: '●', aksi: 'space', x: px2 + 156, label: 'hard drop' }
    ];
    for (var tb = 0; tb < TB.length; tb++) {
      var bx = TB[tb].x;
      ctx.fillStyle = '#162038';
      ctx.fillRect(bx - 2, tyb, 46, 40);
      ctx.strokeStyle = 'rgba(56,189,248,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(bx - 2, tyb, 46, 40);
      ctx.fillStyle = '#8ecae6';
      ctx.font = '900 20px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(TB[tb].ikon, bx + 21, tyb + 15);
      ctx.font = '700 9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b93a8';
      ctx.fillText(TB[tb].label, bx + 21, tyb + 31);
    }
    window.__TBTGL = TB;

    var py3 = 320;
    teks('SCORE', px2, py3, 13, '#8b93a8', '800');
    teks(String(score), px2, py3 + 40, 30, '#ffffff', '900');
    teks('TERBAIK', px2, py3 + 48, 11, '#8b93a8', '800');
    teks(String(Math.max(A.best || 0, score)), px2, py3 + 72, 18, '#ffffff', '900');
    var py4 = py3 + 100;
    teks('LINES', px2, py4, 13, '#8b93a8', '800');
    teks(String(lines), px2, py4 + 34, 26, '#fde047', '900');
    teks('LEVEL', px2, py4 + 46, 13, '#8b93a8', '800');
    teks(String(level), px2, py4 + 70, 26, '#c084fc', '900');
    teks(fallInterval() + 'f drop', px2, py4 + 100, 12, '#8b93a8', '600');

    if (over) {
      ctx.fillStyle = 'rgba(5,7,15,0.82)'; ctx.fillRect(0, 0, W, H);
      teks('GAME OVER', W / 2, H / 2 - 40, 44, '#f5455c', '900', 'center');
      teks('skor kamu: ' + score, W / 2, H / 2 + 8, 21, '#ffffff', '800', 'center');
      teks('baris: ' + lines + ' · level: ' + level + ' · terbaik: ' + Math.max(A.best || 0, score), W / 2, H / 2 + 40, 13, '#8b93a8', '600', 'center');
      teks('ketuk untuk main lagi', W / 2, H / 2 + 76, 15, '#fde047', '700', 'center');
    }
  }

  function rectC () {
    return (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
  }
  function sentuh (e) {
    A.initAudio();
    var t0 = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    var r0 = rectC();
    var px = (t0.clientX - r0.left) * (W / r0.width), py = (t0.clientY - r0.top) * (H / r0.height);
    ketuk(px, py);
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault() }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e) });

  function loop (t) {
    if (!last) last = t;
    var dt = Math.min(3, Math.max(0.1, (t - last) / 16.67));
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  baru();
  A.debug = { grid: function () { return grid.map(function (r) { return r.slice() }) }, pieceOf: function () { return piece }, putar: putar, geser: geser, hardDrop: hardDrop, selPiece: selPiece, kunciPiece: kunciPiece, BENTUK: BENTUK, fallInterval: fallInterval, baru: baru };
  requestAnimationFrame(loop);
`


export function tetrisHtml (brand = 'THERYHANN!') {
  /* v7.7.3: ditulis ulang — penampilan tetris KLASIK (field 10×20 + panel NEXT/SCORE,
     warna tetromino asli, ghost piece, gravity curve level, DAS, hard drop +2/baris) — kanvas 620×800 */
  return shell('Tetris Neon', brand, TETRIS_JS, { w: 660, h: 840, maxw: 620, hint: '\u25C0 \u25B6 geser  \u00B7  \u25B2 putar  \u00B7  \u25BC soft drop (+1/baris)  \u00B7  \u25CF hard drop (+2/baris)' })
}

/* ------------------------------------------------------------------ */
/*  2. PONG NEON                                                       */
/* ------------------------------------------------------------------ */
const PONG_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var TARGET = 3, PW = Math.max(12, Math.round(W * 0.017)), PH = Math.round(H * 0.19);
  var player, cpu, ball, spKamu, spCpu, servis, gameOver, runT, parts, rally, winner, cpuError;

  function reset () {
    player = { x: 20, y: H / 2 - PH / 2, w: PW, h: PH };
    cpu = { x: W - 20 - PW, y: H / 2 - PH / 2, w: PW, h: PH };
    spKamu = 0; spCpu = 0; rally = 0; winner = ''; cpuError = 0;
    parts = []; gameOver = false; runT = 0; servis = 40;
    ball = { x: W / 2, y: H / 2, r: 7, vx: 0, vy: 0, sp: 5 };
    A.setScore(0); A.setBest(); A.setStatus('Kamu 0', 'CPU 0'); A.setProgress(0);
  }
  function lepas () {
    var arah = Math.random() < 0.5 ? -1 : 1;
    var a = A.rand(-0.5, 0.5);
    ball.vx = Math.cos(a) * ball.sp * arah;
    ball.vy = Math.sin(a) * ball.sp;
    rally = 0;
  }
  function ledak (x, y, warna) {
    for (var i = 0; i < 12; i++) parts.push({ x: x, y: y, vx: A.rand(-4, 4), vy: A.rand(-4, 4), life: 1, size: A.rand(2, 4), warna: warna });
  }
  function poin (siapa) {
    if (siapa === 'cpu') { spCpu++; A.SFX.crash(); ledak(ball.x, ball.y, '#ff0055'); }
    else { spKamu++; A.SFX.point(); ledak(ball.x, ball.y, '#00f3ff'); }
    A.setStatus('Kamu ' + spKamu, 'CPU ' + spCpu);
    A.setProgress(Math.max(spKamu, spCpu) / TARGET);
    if (spKamu >= TARGET || spCpu >= TARGET) {
      winner = spKamu >= TARGET ? 'KAMU MENANG' : 'CPU MENANG';
      gameOver = true;
      if (spKamu >= TARGET && spKamu * 100 > A.best) { A.best = spKamu * 100; A.saveBest(A.best); }
      A.setBest();
      return;
    }
    ball.x = W / 2; ball.y = H / 2; ball.vx = 0; ball.vy = 0;
    ball.sp = 5; servis = 45;
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.035 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (keys.up) player.y -= 6.6 * dt;
    if (keys.down) player.y += 6.6 * dt;
    if (targetY !== null) player.y += (targetY - player.h / 2 - player.y) * Math.min(1, 0.35 * dt);
    player.y = Math.max(4, Math.min(H - player.h - 4, player.y));

    var pusat = ball.y + cpuError - cpu.h / 2;
    var kecepatanCpu = 3.6 + Math.min(1.5, rally * 0.05);
    var selisih = pusat - cpu.y;
    cpu.y += Math.max(-kecepatanCpu * dt, Math.min(kecepatanCpu * dt, selisih * 0.16 * dt));
    cpu.y = Math.max(4, Math.min(H - cpu.h - 4, cpu.y));

    if (servis > 0) { servis -= dt; if (servis <= 0) lepas(); return; }

    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); A.SFX.jump(); }
    if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); A.SFX.jump(); }

    if (ball.vx < 0 && ball.x - ball.r <= player.x + player.w && ball.x - ball.r >= player.x - 12 &&
        ball.y >= player.y - ball.r && ball.y <= player.y + player.h + ball.r) {
      ball.x = player.x + player.w + ball.r;
      pantul(player, 1);
    }
    if (ball.vx > 0 && ball.x + ball.r >= cpu.x && ball.x + ball.r <= cpu.x + cpu.w + 12 &&
        ball.y >= cpu.y - ball.r && ball.y <= cpu.y + cpu.h + ball.r) {
      ball.x = cpu.x - ball.r;
      pantul(cpu, -1);
      cpuError = A.rand(-1, 1) * (16 + rally * 5);
    }

    if (ball.x < -20) poin('cpu');
    else if (ball.x > W + 20) poin('kamu');
  }
  function pantul (pad, arah) {
    rally++;
    if (arah > 0) cpuError = A.rand(-1, 1) * (14 + rally * 5);
    ball.sp = Math.min(10.5, ball.sp * 1.04);
    var rel = ((ball.y - pad.y) / pad.h - 0.5) * 2;
    rel = Math.max(-1, Math.min(1, rel)) + A.rand(-0.12, 0.12);
    var a = rel * 0.95;
    ball.vx = Math.cos(a) * ball.sp * arah;
    ball.vy = Math.sin(a) * ball.sp;
    A.SFX.jump();
    ledak(ball.x, ball.y, arah > 0 ? '#00f3ff' : '#9d4edd');
    score = spKamu * 100 + rally * 5;
    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('Kamu ' + spKamu, 'CPU ' + spCpu);
  }

  var keys = { up: false, down: false }, targetY = null, score = 0;

  function draw () {
    var th = A.theme(Math.max(spKamu, spCpu));
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, W, 0);
    bg.addColorStop(0, '#060911'); bg.addColorStop(0.5, '#0d1424'); bg.addColorStop(1, '#120a20');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.setLineDash([10, 14]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);

    ctx.textAlign = 'center'; ctx.font = '900 44px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(0,243,255,0.22)'; ctx.fillText(String(spKamu), W / 2 - 70, 56);
    ctx.fillStyle = 'rgba(255,0,85,0.22)'; ctx.fillText(String(spCpu), W / 2 + 70, 56);
    ctx.textAlign = 'left';

    ctx.shadowColor = th.primary; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowColor = '#ff0055'; ctx.fillStyle = '#ff0055';
    ctx.fillRect(cpu.x, cpu.y, cpu.w, cpu.h);
    ctx.shadowBlur = 0;

    if (servis > 0 && !gameOver) {
      ctx.globalAlpha = 0.5 + Math.sin(runT / 6) * 0.3;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (!gameOver) {
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }

    parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('FIRST TO ' + TARGET + ' · RALLY ' + rally, 14, H - 12);

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.8)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = spKamu >= TARGET ? '#00f3ff' : '#ff0055'; ctx.shadowBlur = 18;
      ctx.fillStyle = spKamu >= TARGET ? '#00f3ff' : '#ff0055';
      ctx.font = '900 30px "Segoe UI", sans-serif'; ctx.fillText(winner, W / 2, H / 2 - 26);
      ctx.shadowBlur = 0; ctx.fillStyle = '#ff0055'; ctx.font = '900 22px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 + 4);
      ctx.fillStyle = '#fff'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(spKamu + ' - ' + spCpu, W / 2, H / 2 + 28);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / SPACE UNTUK MAIN LAGI', W / 2, H / 2 + 54);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { player: player, cpu: cpu, ball: ball, score: score, spKamu: spKamu, spCpu: spCpu, rally: rally, servis: servis, over: gameOver, winner: winner, target: TARGET, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  function posY (clientY) {
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { top: 0, height: H };
    return (clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
  }
  c.addEventListener('touchstart', function (e) { A.initAudio(); if (gameOver) { reset(); return; } targetY = posY(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove', function (e) { if (!gameOver) targetY = posY(e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function () { targetY = null; }, { passive: false });
  c.addEventListener('mousedown', function (e) { A.initAudio(); if (gameOver) { reset(); return; } targetY = posY(e.clientY); });
  c.addEventListener('mousemove', function (e) { if (targetY !== null && !gameOver) targetY = posY(e.clientY); });
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') { keys.up = true; targetY = null; e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; targetY = null; e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = true; targetY = null; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { keys.right = true; targetY = null; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); else if (servis > 0) servis = 1; e.preventDefault(); }
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

export function pongHtml (brand = 'THERYHANN!') {
  return shell('Pong Neon', brand, PONG_JS, { w: 720, h: 480, maxw: 580, hint: '\u25B2 \u25BC gerak paddle  \u00B7  \u25CF servis cepat' })
}

/* ------------------------------------------------------------------ */
/*  3. NEON JUMP                                                       */
/* ------------------------------------------------------------------ */
const JUMP_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var hero, plats, score, scroll, gameOver, runT, parts, keys, target, stars, boosted;

  function reset () {
    hero = { x: W / 2, y: H - 92, w: 26, h: 26, vy: -11.4, vx: 0 };
    plats = []; parts = []; stars = [];
    for (var i = 0; i < 40; i++) stars.push({ x: A.rand(0, W), y: A.rand(0, H), s: A.rand(0.6, 2) });
    plats.push({ x: W / 2 - 48, y: H - 60, w: 96, h: 12, tipe: 'static', t: 0 });
    var y = H - 60;
    while (y > -80) { y -= A.rand(44, 62); plats.push(bikinPlat(y)); }
    score = 0; scroll = 0.3; gameOver = false; runT = 0; keys = {}; target = null; boosted = false;
    A.setScore(0); A.setBest(); A.setStatus('Ketinggian 0', 'Scroll 0.3x'); A.setProgress(0);
  }
  function bikinPlat (y) {
    var moving = Math.random() < 0.28 && score > 300;
    var w = moving ? 78 : 96;
    // platform berikutnya harus terjangkau dari platform sebelumnya (rantai x)
    var atas = plats.length ? plats[plats.length - 1] : null;
    var pusat = atas ? atas.x + atas.w / 2 : W / 2;
    var cx = pusat + A.rand(-70, 70);
    cx = Math.max(14 + w / 2, Math.min(W - 14 - w / 2, cx));
    return {
      x: cx - w / 2, y: y, w: w, h: 12,
      tipe: moving ? 'moving' : 'static', vx: moving ? (Math.random() < 0.5 ? -1.2 : 1.2) : 0, t: A.rand(0, 6)
    };
  }
  function boost () {
    if (gameOver || boosted) return;
    boosted = true; hero.vy = -10.2; A.SFX.jump();
    for (var i = 0; i < 8; i++) parts.push({ x: hero.x + A.rand(-12, 12), y: hero.y + 10, vx: A.rand(-2, 2), vy: A.rand(0, 2.5), life: 1, size: A.rand(2, 4), warna: '#9d4edd' });
  }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    for (var i = 0; i < 16; i++) parts.push({ x: hero.x, y: H - 10, vx: A.rand(-4, 4), vy: A.rand(-6, -1), life: 1, size: A.rand(2, 5), warna: '#ffffff' });
    if (score > A.best) A.best = score;
    A.saveBest(A.best); A.setBest();
  }

  function update (dt) {
    runT += dt;
    stars.forEach(function (s) { s.y += scroll * 0.25 * dt; if (s.y > H) { s.y = -2; s.x = A.rand(0, W); } });
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.25 * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    scroll = Math.min(1.5, 0.3 + score * 0.00016);

    if (target !== null) hero.vx = (target - hero.x) * 0.2;
    else hero.vx = (keys.left ? -7 : 0) + (keys.right ? 7 : 0);
    hero.x += hero.vx * dt;
    if (hero.x < 10) hero.x = 10;
    if (hero.x > W - 10) hero.x = W - 10;

    var yLama = hero.y;
    hero.vy += (keys.down ? 1.05 : 0.44) * dt;
    hero.y += hero.vy * dt;

    plats.forEach(function (p) {
      p.py = p.y;
      p.y += scroll * dt;
      if (p.tipe === 'moving') {
        p.t += 0.03 * dt;
        p.x += p.vx * dt;
        if (p.x < 8 || p.x > W - 8 - p.w) p.vx = -p.vx;
      }
    });

    if (hero.vy > 0) {
      plats.forEach(function (p) {
        if (yLama + hero.h / 2 <= p.py + 9 && hero.y + hero.h / 2 >= p.y - 2 &&
            hero.x + hero.w / 2 > p.x && hero.x - hero.w / 2 < p.x + p.w) {
          hero.y = p.y - hero.h / 2;
          hero.vy = -11.4;
          boosted = false;
          A.SFX.jump();
          for (var i = 0; i < 5; i++) parts.push({ x: hero.x + A.rand(-10, 10), y: p.y, vx: A.rand(-1.5, 1.5), vy: A.rand(-1, 0.5), life: 1, size: 2, warna: '#00f3ff' });
        }
      });
    }

    // kamera ikut naik saat hero melewati garis tengah (gaya doodle-jump)
    var garis = H * 0.5;
    if (hero.y < garis) {
      var d = garis - hero.y;
      hero.y = garis;
      plats.forEach(function (p) { p.y += d; p.py += d; });
      score += d * 1.1;
    }

    plats = plats.filter(function (p) { return p.y < H + 30; });
    var atas = plats.reduce(function (m, p) { return Math.min(m, p.y); }, H);
    while (atas > -40) {
      var y = atas - A.rand(44, 62);
      plats.push(bikinPlat(y));
      atas = y;
    }

    score += scroll * dt * 0.8;
    if (hero.y - hero.h > H) mati();
    A.setScore(score);
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setStatus('Ketinggian ' + Math.floor(score / 10), 'Scroll ' + scroll.toFixed(1) + 'x');
    A.setProgress((score % 500) / 500);
  }

  function draw () {
    var th = A.theme(Math.floor(score / 500));
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b0620'); bg.addColorStop(1, '#160b2e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    stars.forEach(function (s) { ctx.globalAlpha = 0.2 + s.s * 0.2; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    plats.forEach(function (p) {
      var w = p.tipe === 'moving' ? th.secondary : th.primary;
      ctx.shadowColor = w; ctx.shadowBlur = 10; ctx.fillStyle = w;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 3);
    });

    if (!gameOver) {
      ctx.save();
      ctx.translate(hero.x, hero.y);
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
      ctx.fillRect(-hero.w / 2, -hero.h / 2, hero.w, hero.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = th.primary;
      ctx.fillRect(-hero.w / 2 + 5, -hero.h / 2 + 5, hero.w - 10, hero.h - 10);
      ctx.fillStyle = '#060911';
      ctx.fillRect(-5, -4, 4, 4); ctx.fillRect(3, -4, 4, 4);
      ctx.restore();
      if (hero.vy < 0) {
        ctx.globalAlpha = 0.5; ctx.fillStyle = th.secondary;
        ctx.fillRect(hero.x - 5, hero.y + hero.h / 2, 10, 10);
        ctx.globalAlpha = 1;
      }
    }

    parts.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna || th.primary;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,0,85,0.25)';
    ctx.fillRect(0, H - 6, W, 6);

    if (gameOver) {
      ctx.fillStyle = 'rgba(11,6,32,0.82)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 32px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score), W / 2, H / 2 + 8);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('← → / GESER · TAP UNTUK ULANG', W / 2, H / 2 + 38);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = { hero: hero, plats: plats, score: score, scroll: scroll, boosted: boosted, over: gameOver, keys: keys, w: W, h: H };
    requestAnimationFrame(loop);
  }

  function posDari (clientX) {
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, width: W };
    return (clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
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
    else if (k === 'ArrowUp' || k === 'KeyW') { boost(); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { keys.down = true; e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { if (gameOver) reset(); else boost(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (e.code === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || k === 'KeyD') keys.right = false;
    if (k === 'ArrowDown' || k === 'KeyS') keys.down = false;
  });

  reset();
  requestAnimationFrame(loop);
`

export function jumpHtml (brand = 'THERYHANN!') {
  return shell('Neon Jump', brand, JUMP_JS, { w: 500, h: 720, maxw: 400, hint: '\u25C0 \u25B6 geser  \u00B7  \u25B2 / \u25CF lompat ekstra  \u00B7  \u25BC jatuh cepat' })
}

export const ARCADE_GAMES3 = [
  { id: 'tetris', title: 'Tetris Neon', html: tetrisHtml },
  { id: 'pong', title: 'Pong Neon', html: pongHtml },
  { id: 'jump', title: 'Neon Jump', html: jumpHtml }
]

export default { tetrisHtml, pongHtml, jumpHtml, ARCADE_GAMES3 }
