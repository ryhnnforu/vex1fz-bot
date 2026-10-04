/**
 * ============================================================
 *  lib/htmlgames9.js — 2048 (v7.7.3)
 * ------------------------------------------------------------
 *  Puzzle klasik 2048 seperti aslinya (Gabriele Cirulli):
 *  papan 4×4, geser semua tile ke sisi; yang sama angkanya
 *  digabung → target 2048. Penampilan identik game aslinya
 *  (beige #faf8ef, sel #cdc1b4, tile berpalet klasik).
 *  Kanvas potret jumbo 560×780 (rasio beda dari Tetris 620×800
 *  dan Block Blast 640×760). Kontrol: ▲▼◀▶ geser · ● acak ulang.
 * ============================================================
 */
import { shell } from './htmlgames.js'

const D2048_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 560, H = 780;
  var N = 4, TS = 100, GAP = 16;
  var BODY = N * TS + GAP;
  var X0 = (W - BODY) / 2;
  var Y0 = 200;

  /* palet klasik (bg tile -> teks, ukuran font) */
  var WARNA = {
    2: ['#eee4da', '#776e65', 50],
    4: ['#ede0c8', '#776e65', 50],
    8: ['#f2b179', '#f9f6f2', 50],
    16: ['#f59563', '#f9f6f2', 50],
    32: ['#f67c5f', '#f9f6f2', 50],
    64: ['#f65e3b', '#f9f6f2', 50],
    128: ['#edcf72', '#f9f6f2', 44],
    256: ['#edcc61', '#f9f6f2', 44],
    512: ['#edc850', '#f9f6f2', 44],
    1024: ['#edc53f', '#f9f6f2', 38],
    2048: ['#edc22e', '#f9f6f2', 38],
    4096: ['#3c3a32', '#f9f6f2', 38],
    8192: ['#3c3a32', '#f9f6f2', 34]
  };

  var papan = new Array(16).fill(0);
  var skor = 0, menang = false, over = false, gerakan = 0;
  var partikel = [], tumbuh = []; /* { idx, t } animasi muncul/gabung */
  var lajuAnim = 12;
  var langkahTerakhir = [];

  function idx (r, cc) { return r * 4 + cc }
  function sel (i) { return { r: Math.floor(i / 4) * TS + Y0, kol: (i % 4) * TS + X0 } }

  function rondeAcak () {
    var kosong = [];
    for (var i = 0; i < 16; i++) if (!papan[i]) kosong.push(i);
    if (!kosong.length) return null;
    var i = kosong[Math.floor(Math.random() * kosong.length)];
    papan[i] = Math.random() < 0.9 ? 2 : 4;
    tumbuh.push({ idx: i, t: 0 });
    return i;
  }

  function baru () {
    papan.fill(0);
    skor = 0; over = false; menang = false;
    gerakan = 0; partikel = []; tumbuh = []; langkahTerakhir = [];
    rondeAcak(); rondeAcak();
    A.setScore(0); A.setBest();
  }

  function bisa (b) {
    for (var i = 0; i < 16; i++) {
      if (!b[i]) return true;
      var r = Math.floor(i / 4), cc = i % 4;
      if (cc < 3 && b[i] === b[i + 1]) return true;
      if (r < 3 && b[i] === b[i + 4]) return true;
    }
    return false;
  }

  function ledakan (x, y, n) {
    for (var i = 0; i < n; i++) partikel.push({ x: x, y: y, vx: A.rand(-3.5, 3.5), vy: A.rand(-5, 0.5), a: 1, r: A.rand(2, 4) });
  }

  /* geser semua tile ke satu sisi (l/r/u/d); skor dihitung tepat per penggabungan */
  function geser (arah) {
    if (over) return;
    A.SFX.jump();
    var b0 = papan.slice();
    var skorSebelum = skor;
    for (var k = 0; k < 4; k++) {
      var baris = [];
      for (var j = 0; j < 4; j++) {
        var i = arah === 'l' ? idx(k, j) : arah === 'r' ? idx(k, 3 - j) : arah === 'u' ? idx(j, k) : idx(3 - j, k);
        baris.push(papan[i]);
      }
      var gabungan = baris.filter(x => x !== 0);
      var out = [], ii = 0;
      while (ii < gabungan.length) {
        if (ii + 1 < gabungan.length && gabungan[ii] === gabungan[ii + 1]) {
          var v = gabungan[ii] * 2;
          skor += v;
          out.push(v);
          ii += 2;
        } else {
          out.push(gabungan[ii]); ii++;
        }
      }
      while (out.length < 4) out.push(0);
      for (var j2 = 0; j2 < 4; j2++) {
        var i2 = arah === 'l' ? idx(k, j2) : arah === 'r' ? idx(k, 3 - j2) : arah === 'u' ? idx(j2, k) : idx(3 - j2, k);
        papan[i2] = out[j2];
      }
    }
    var bergeser = false;
    for (var i4 = 0; i4 < 16; i4++) if (b0[i4] !== papan[i4]) { bergeser = true; break }
    if (!bergeser) {
      skor = skorSebelum;
      A.SFX.point();
      return;
    }
    gerakan++;
    langkahTerakhir.push(arah);
    if (langkahTerakhir.length > 60) langkahTerakhir.shift();
    A.SFX.point();
    if (!menang && papan.indexOf(2048) >= 0) {
      menang = true;
      A.SFX.level();
      ledakan(W / 2, Y0 + BODY / 2, 30);
    }
    /* ledakan kecil di sel yang nilainya naik (penggabungan) */
    for (var i5 = 0; i5 < 16; i5++) {
      if (papan[i5] > 0 && papan[i5] !== b0[i5]) {
        var sp = sel(i5);
        tumbuh.push({ idx: i5, t: 0 });
        if (b0[i5] > 0 && papan[i5] > b0[i5]) ledakan(sp.kol + TS / 2, sp.r + TS / 2, 8);
      }
    }
    var selBaru = rondeAcak();
    if (selBaru !== null && !bisa(papan)) {
      over = true;
      A.SFX.crash();
      A.saveBest(skor);
    }
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') geser('l');
    else if (k === 'ArrowRight' || k === 'KeyD') geser('r');
    else if (k === 'ArrowUp' || k === 'KeyW') geser('u');
    else if (k === 'ArrowDown' || k === 'KeyS') geser('d');
    else if (k === 'Space' || k === 'Enter') baru();
  });

  function ketuk (px, py) {
    if (px >= X0 && px < X0 + BODY && py >= Y0 && py < Y0 + BODY) {
      var keX = px - (X0 + BODY / 2), keY = py - (Y0 + BODY / 2);
      if (Math.abs(keX) > Math.abs(keY)) geser(keX > 0 ? 'r' : 'l');
      else geser(keY > 0 ? 'd' : 'u');
      return;
    }
    if (py >= H - 70) baru();
  }

  function teks (t, x, y, sz, ws, gaya, rata) {
    ctx.fillStyle = ws;
    ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
  }
  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  var last = 0, runT = 0;
  function update (dt) {
    runT += dt;
    for (var i = tumbuh.length - 1; i >= 0; i--) {
      tumbuh[i].t += dt;
      if (tumbuh[i].t > lajuAnim) tumbuh.splice(i, 1);
    }
    for (var pi = partikel.length - 1; pi >= 0; pi--) {
      var q = partikel[pi];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.15 * dt; q.a -= 0.02 * dt;
      if (q.a <= 0) partikel.splice(pi, 1);
    }
    A.setScore(skor);
    if (skor > A.best) A.best = skor;
    A.setProgress(papan.filter(x => x).length / 16);
    A.setStatus(over ? 'GAME OVER' : menang ? 'GABUNG 2048 TERCAPAI 🎉' : 'BERMAIN', (papan.filter(x => !x).length) + ' sel kosong');
    A.state = {
      papan: papan.slice(), skor: skor, gerakan: gerakan,
      menang: menang, over: over, kosong: papan.filter(x => !x).length,
      keys: { up: false, down: false, left: false, right: false, act: false }
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#faf8ef'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(187,173,160,0.18)'; bulat(0, 0, W, H, 8); ctx.fill();

    teks('2048', X0, 60, 62, '#776e65', '900');
    teks('gabungkan angka — raih ubin 2048!', X0, 108, 17, '#776e65', '600');
    ctx.fillStyle = '#bbada0'; bulat(W - 24 - 120, 24, 110, 56, 6); ctx.fill();
    teks('SKOR', W - 24 - 65, 40, 13, '#eee4da', '800', 'center');
    teks(String(skor), W - 24 - 65, 66, 26, '#ffffff', '900', 'center');
    ctx.fillStyle = '#bbada0'; bulat(W - 24 - 120, 92, 110, 56, 6); ctx.fill();
    var best = Math.max(A.best || 0, skor);
    teks('TERBAIK', W - 24 - 65, 108, 11.5, '#eee4da', '800', 'center');
    teks(String(best), W - 24 - 65, 132, 22, '#ffffff', '900', 'center');
    teks(over ? 'GAME OVER' : menang ? '🎉 2048 tercapai — main terus!' : 'kesalahan kecil bisa fatal…', X0, 168, 15, '#8f8580', '700');

    ctx.fillStyle = '#bbada0'; bulat(X0 - GAP, Y0 - GAP, BODY + GAP * 2, BODY + GAP * 2, 10); ctx.fill();

    /* sel */
    for (var i = 0; i < 16; i++) {
      var r = Math.floor(i / 4), cc = i % 4;
      var ex = X0 + cc * TS, ey = Y0 + r * TS;
      ctx.fillStyle = '#cdc1b4';
      ctx.fillRect(ex, ey, TS - GAP, TS - GAP);
      var tile = papan[i];
      if (tile) {
        var skala = 1;
        for (var ti = 0; ti < tumbuh.length; ti++) {
          if (tumbuh[ti].idx === i) skala = 0.35 + 0.65 * Math.min(1, tumbuh[ti].t / lajuAnim);
        }
        var ww = (TS - GAP) * skala, hh = (TS - GAP) * skala;
        var cx = ex + (TS - GAP) / 2, cy = ey + (TS - GAP) / 2;
        var wl = WARNA[tile] || WARNA[8192];
        ctx.fillStyle = wl[0];
        bulat(cx - ww / 2, cy - hh / 2, ww, hh, 6);
        ctx.fill();
        teks(String(tile), cx, cy + 2, Math.max(18, (wl[2] || 40) * skala), wl[1], '900', 'center');
      }
    }

    for (var pi = 0; pi < partikel.length; pi++) {
      var q = partikel[pi];
      ctx.globalAlpha = Math.max(0, q.a);
      ctx.fillStyle = '#f2b179';
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    teks('▲▼◀▶ geser · ● acak ulang · tap papan/tap bawah = multiaksi', W / 2, H - 46, 14, '#9a8f84', '600', 'center');
    teks('dibuat seperti 2048 asli — THERYHANN! BOT', W / 2, H - 24, 12, '#bcae9f', '600', 'center');

    if (over) {
      ctx.fillStyle = 'rgba(238,228,218,0.82)'; ctx.fillRect(X0 - GAP, Y0 - GAP, BODY + GAP * 2, BODY + GAP * 2);
      teks('GAME OVER', W / 2, Y0 + BODY / 2 - 22, 42, '#776e65', '900', 'center');
      teks('Skor akhirmu: ' + skor + ' · ulangi: ●', W / 2, Y0 + BODY / 2 + 22, 17, '#8f8580', '700', 'center');
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
  A.debug = { papan: function () { return papan.slice() }, geser: geser, bisa: bisa, rondeAcak: rondeAcak, baru: baru, WARNA: WARNA };
  requestAnimationFrame(loop);
`

/** bangun HTML kartu .2048 */
export function dua2048Html (brand = 'THERYHANN!') {
  return shell('2048', brand, D2048_JS, {
    w: 560, h: 780, maxw: 560, sub: 'ARCADE',
    hint: '▲▼◀▶ geser semua tile · yang sama digabung · raih 2048! · ● ulangi'
  })
}

export const DAFTAR_GAMES9 = [
  { id: 'd2048', title: '2048', html: dua2048Html, ratio: '560×780 (portrait)' }
]

export default { dua2048Html, DAFTAR_GAMES9 }
