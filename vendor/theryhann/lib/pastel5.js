/**
 * 🚰 PIPA BOCOR — puzzle putar pipa (HTML app, skin pastel v7.5)
 * ------------------------------------------------------------------
 *  Grid 6×6 pipa. Sumber air di kiri, keluaran di kanan.
 *  ▲ ▼ ◀ ▶ pindah kursor · ● putar pipa 90° (1 langkah).
 *  Air mengalir lewat pipa yang tersambung; sampai ke keluaran = level selesai.
 *  Langkah habis = GAME OVER. Level naik = grid lebih padat & langkah lebih sedikit.
 */
import { shell } from './htmlgames.js'

const PIPES_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var ROWS = 6, COLS = 6, TS = 74, OX = 56, OY = 96;
  var IDLE = 900;
  /* arah: 0=Utara 1=Timur 2=Selatan 3=Barat */
  var DN = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var BENTUK = [
    { nama: 'lurus', mask: 5 },   /* U|S */
    { nama: 'siku', mask: 3 },    /* U|T */
    { nama: 'tee', mask: 7 },     /* U|T|S */
    { nama: 'silang', mask: 15 }
  ];

  var grid, kx, ky, srcR, outR, langkah, skor, level, banjir, menang, rotMin, solusiOk;
  var gameOver, pesan, runT, idle, animAir, pesanKecil, pesanKecilT;

  /* ---------- fungsi murni (A.debug) ---------- */

  function putar (mask, r) {
    var out = 0, i;
    r = ((r % 4) + 4) % 4;
    for (i = 0; i < 4; i++) if (mask & (1 << i)) out |= (1 << ((i + r) % 4));
    return out;
  }
  function lawan (d) { return (d + 2) % 4; }
  /* putaran minimum supaya mask kembali ke bentuk aslinya
     (pipa simetris seperti lurus/silang butuh lebih sedikit) */
  function minPutar (mask, rot) {
    for (var k = 0; k < 4; k++) if (putar(mask, (rot + k) % 4) === mask) return k;
    return 0;
  }
  function conn (sel) { return putar(sel.base, sel.rot); }
  function arahAntara (r1, c1, r2, c2) {
    for (var d = 0; d < 4; d++) if (r1 + DN[d] === r2 && c1 + DC[d] === c2) return d;
    return -1;
  }

  function mengalir (papan, sR, oR) {
    var lihat = {}, tumpuk = [[sR, 0]], out = [];
    if (!(conn(papan[sR][0]) & 8)) return { banjir: [], menang: false };
    while (tumpuk.length) {
      var p = tumpuk.pop(), k = p[0] + ':' + p[1];
      if (lihat[k]) continue;
      lihat[k] = 1; out.push(p);
      var m = conn(papan[p[0]][p[1]]);
      for (var d = 0; d < 4; d++) {
        if (!(m & (1 << d))) continue;
        var nr = p[0] + DN[d], nc = p[1] + DC[d];
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (!(conn(papan[nr][nc]) & (1 << lawan(d)))) continue;
        if (!lihat[nr + ':' + nc]) tumpuk.push([nr, nc]);
      }
    }
    var terakhir = out.filter(function (p) { return p[0] === oR && p[1] === COLS - 1; });
    var menang = terakhir.length > 0 && (conn(papan[oR][COLS - 1]) & 2) > 0;
    return { banjir: out, menang: menang };
  }

  /* ---------- bangun level ---------- */

  function jalurAcak (sR, oR) {
    var lihat = {}, jalur = [], r = sR, cc = 0, guard = 0;
    while (guard++ < 300) {
      jalur.push([r, cc]); lihat[r + ':' + cc] = 1;
      if (cc === COLS - 1 && r === oR) return jalur;
      var opsi = [];
      for (var d = 0; d < 4; d++) {
        var nr = r + DN[d], nc = cc + DC[d];
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (lihat[nr + ':' + nc]) continue;
        opsi.push([nr, nc]);
      }
      if (!opsi.length) return null;
      var maju = opsi.filter(function (o) { return o[1] > cc; });
      var pilih = (maju.length && Math.random() < 0.72) ? maju[Math.floor(Math.random() * maju.length)]
                                                       : opsi[Math.floor(Math.random() * opsi.length)];
      r = pilih[0]; cc = pilih[1];
    }
    return null;
  }

  function levelBaru () {
    var coba = 0;
    while (coba++ < 60) {
      srcR = Math.floor(A.rand(0, ROWS));
      outR = Math.floor(A.rand(0, ROWS));
      var jalur = jalurAcak(srcR, outR);
      if (!jalur || jalur.length < COLS) continue;

      var papan = [], r, cc;
      for (r = 0; r < ROWS; r++) {
        var bar = [];
        for (cc = 0; cc < COLS; cc++) {
          var b = BENTUK[Math.floor(A.rand(0, 2))];   /* lurus / siku sebagai pengisi */
          bar.push({ base: b.mask, rot: Math.floor(A.rand(0, 4)) });
        }
        papan.push(bar);
      }
      for (var i = 0; i < jalur.length; i++) {
        var mask = 0;
        if (i === 0) mask |= 8;                                  /* masuk dari Barat */
        if (i === jalur.length - 1) mask |= 2;                   /* keluar ke Timur */
        if (i > 0) mask |= (1 << arahAntara(jalur[i][0], jalur[i][1], jalur[i - 1][0], jalur[i - 1][1]));
        if (i < jalur.length - 1) mask |= (1 << arahAntara(jalur[i][0], jalur[i][1], jalur[i + 1][0], jalur[i + 1][1]));
        if (mask === 0) continue;
        papan[jalur[i][0]][jalur[i][1]] = { base: mask, rot: 0 };
      }
      /* acak semua rotasi, pastikan belum terpecahkan */
      var acak = 0;
      while (acak++ < 30) {
        for (r = 0; r < ROWS; r++) for (cc = 0; cc < COLS; cc++) papan[r][cc].rot = Math.floor(A.rand(0, 4));
        if (!mengalir(papan, srcR, outR).menang) break;
      }
      if (mengalir(papan, srcR, outR).menang) continue;
      /* Verifikasi internal: kembalikan sel jalur ke rot 0 -> air HARUS sampai.
         Kalau tidak, papan dibuang dan dibuat ulang (jaminan level selalu
         bisa diselesaikan, bukan cuma "sepertinya bisa"). */
      var uji = [];
      for (r = 0; r < ROWS; r++) {
        var ub = [];
        for (cc = 0; cc < COLS; cc++) ub.push({ base: papan[r][cc].base, rot: papan[r][cc].rot });
        uji.push(ub);
      }
      var biaya = 0;
      for (var q = 0; q < jalur.length; q++) {
        var jr = jalur[q][0], jc = jalur[q][1];
        biaya += minPutar(uji[jr][jc].base, uji[jr][jc].rot);
        uji[jr][jc].rot = 0;
      }
      if (!mengalir(uji, srcR, outR).menang) continue;
      grid = papan; rotMin = biaya; solusiOk = true;
      return true;
    }
    return false;
  }

  function reset () {
    skor = 0; level = 1; gameOver = false; pesan = ''; runT = 0; idle = 0;
    kx = 0; ky = 0; animAir = 0; pesanKecil = ''; pesanKecilT = 0; menang = false;
    solusiOk = false;
    levelBaru();
    langkah = budgetUntuk(level, rotMin);
    banjir = mengalir(grid, srcR, outR).banjir;
    A.setScore(0); A.setBest();
    A.setStatus('Level 1', 'Langkah ' + langkah); A.setProgress(0);
    if (langkah <= 0) langkah = 10;
  }

  function budgetUntuk (lv, minimum) {
    var longgar = Math.max(4, 16 - (lv - 1) * 2);
    return (minimum || 0) + longgar;
  }

  function tamat (sebab) {
    gameOver = true; pesan = sebab || 'LANGKAH HABIS'; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
    A.setStatus('Skor ' + skor, 'Rekor ' + A.best);
  }

  function kecil (t) { pesanKecil = t; pesanKecilT = 70; }

  function putarSel () {
    if (gameOver) { reset(); return; }
    if (menang) return;
    idle = 0;
    grid[ky][kx].rot = (grid[ky][kx].rot + 1) % 4;
    langkah--;
    A.SFX.jump();
    var h = mengalir(grid, srcR, outR);
    banjir = h.banjir;
    A.setStatus('Level ' + level, 'Langkah ' + langkah);
    if (h.menang) {
      menang = true; animAir = 0;
      var bonus = 50 * level + langkah * 15;
      skor += bonus; A.setScore(skor); A.SFX.level();
      kecil('AIR MENGALIR! +' + bonus);
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      A.setProgress(Math.min(1, skor / 2000));
    } else if (langkah <= 0) {
      tamat('LANGKAH HABIS DI LEVEL ' + level + ' — SKOR ' + skor);
    }
  }

  function lanjut () {
    level++;
    if (!levelBaru()) { tamat('PAPAN GAGAL DIBUAT — SKOR ' + skor); return; }
    langkah = budgetUntuk(level, rotMin);
    menang = false; kx = 0; ky = 0; animAir = 0;
    banjir = mengalir(grid, srcR, outR).banjir;
    A.setStatus('Level ' + level, 'Langkah ' + langkah);
    kecil('LEVEL ' + level);
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

  function adaDiBanjir (r, cc) {
    for (var i = 0; i < banjir.length; i++) if (banjir[i][0] === r && banjir[i][1] === cc) return true;
    return false;
  }

  function gambarPipa (r, cc) {
    var x = OX + cc * TS, y = OY + r * TS, cxp = x + TS / 2, cyp = y + TS / 2;
    var basah = adaDiBanjir(r, cc);
    ctx.fillStyle = basah ? '#eafff7' : '#fff7f2';
    bulat(x + 3, y + 3, TS - 6, TS - 6, 15); ctx.fill();
    ctx.strokeStyle = basah ? '#8ee0c8' : '#ffe0ea'; ctx.lineWidth = 2.5; ctx.stroke();

    var m = conn(grid[r][cc]);
    var tebal = 20, isi = basah ? '#5cc9a8' : '#ffc9da', tepi = basah ? '#3fbb94' : '#ffb3c9';
    for (var d = 0; d < 4; d++) {
      if (!(m & (1 << d))) continue;
      var ex = cxp + DC[d] * (TS / 2 - 3), ey = cyp + DN[d] * (TS / 2 - 3);
      ctx.strokeStyle = tepi; ctx.lineWidth = tebal + 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = isi; ctx.lineWidth = tebal;
      ctx.beginPath(); ctx.moveTo(cxp, cyp); ctx.lineTo(ex, ey); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cxp, cyp, tebal / 2 + 2, 0, Math.PI * 2);
    ctx.fillStyle = tepi; ctx.fill();
    ctx.beginPath(); ctx.arc(cxp, cyp, tebal / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = isi; ctx.fill();
    if (basah) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(cxp - 4, cyp - 4, 3.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff7f2'); bg.addColorStop(1, '#eefaf6');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,201,218,0.28)';
    for (var b = 0; b < 18; b++) {
      ctx.beginPath(); ctx.arc((b * 97) % W, (b * 61) % H, 4 + (b % 4), 0, Math.PI * 2); ctx.fill();
    }

    /* HUD */
    ctx.textAlign = 'left'; ctx.fillStyle = '#7a5c6b'; ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + skor, 24, 42);
    ctx.textAlign = 'right'; ctx.fillStyle = langkah <= 5 ? '#ff6b8a' : '#3fbb94';
    ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.fillText('LANGKAH ' + langkah, W - 24, 42);
    ctx.textAlign = 'left'; ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText('LEVEL ' + level + '   ·   TERGENANG ' + banjir.length + '/' + (ROWS * COLS) + '   ·   REKOR ' + A.best, 24, 66);
    ctx.fillStyle = '#ffe9f0'; bulat(24, 76, W - 48, 10, 5); ctx.fill();
    ctx.fillStyle = '#8ee0c8'; bulat(24, 76, Math.max(10, (W - 48) * Math.min(1, skor / 2000)), 10, 5); ctx.fill();

    /* sumber & keluaran */
    var ys = OY + srcR * TS + TS / 2, yo = OY + outR * TS + TS / 2;
    ctx.fillStyle = '#a0c4ff'; bulat(8, ys - 20, 44, 40, 12); ctx.fill();
    ctx.strokeStyle = '#6f96d8'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '900 18px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▶', 30, ys + 7);
    ctx.fillStyle = menang ? '#8ee0c8' : '#ffd7e4';
    bulat(W - 52, yo - 20, 44, 40, 12); ctx.fill();
    ctx.strokeStyle = menang ? '#3fbb94' : '#ffb3c9'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillText('★', W - 30, yo + 7);
    ctx.textAlign = 'left';

    /* papan */
    for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) gambarPipa(r, cc);

    /* kursor */
    if (!gameOver) {
      var pk = 2 + Math.sin(runT / 6) * 2;
      ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 4;
      bulat(OX + kx * TS - pk, OY + ky * TS - pk, TS + pk * 2, TS + pk * 2, 17); ctx.stroke();
    }

    if (pesanKecilT > 0) {
      ctx.globalAlpha = Math.min(1, pesanKecilT / 22);
      ctx.textAlign = 'center'; ctx.fillStyle = '#3fbb94'; ctx.font = '900 24px "Segoe UI", sans-serif';
      ctx.fillText(pesanKecil, W / 2, OY - 8); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    if (menang && !gameOver) {
      ctx.fillStyle = 'rgba(234,255,247,0.86)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3fbb94'; ctx.font = '900 32px "Segoe UI", sans-serif';
      ctx.fillText('AIR SAMPAI!', W / 2, H / 2 - 24);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('Level ' + level + ' selesai · sisa ' + langkah + ' langkah', W / 2, H / 2 + 6);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN ● UNTUK LEVEL ' + (level + 1), W / 2, H / 2 + 42);
      ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.93)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 34px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 10);
      ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 26);
      ctx.fillStyle = '#3fbb94'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('LEVEL TERCAPAI ' + level + ' · REKOR ' + A.best, W / 2, H / 2 + 52);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 84);
      ctx.textAlign = 'left';
    } else if (!menang && idle > IDLE * 0.6) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,107,138,0.95)'; ctx.font = '900 15px "Segoe UI", sans-serif';
      ctx.fillText('AFK ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's — PIPA BERKARAT', W / 2, H - 16);
      ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;

    if (!gameOver) {
      if (!menang) {
        idle += dt;
        if (idle > IDLE) tamat('AFK ' + Math.round(IDLE / 60) + ' DETIK — PIPA BERKARAT');
      } else {
        animAir += dt;
      }
      if (pesanKecilT > 0) pesanKecilT -= dt;
    }

    draw();

    A.state = {
      kx: kx, ky: ky, skor: skor, level: level, langkah: langkah, menang: menang,
      tergenang: banjir.length, srcR: srcR, outR: outR, over: gameOver, sebab: pesan,
      idle: Math.round(idle), best: A.best, rotMin: rotMin, solusiOk: solusiOk,
      papan: grid.map(function (bar) { return bar.map(function (s) { return conn(s); }); })
    };

    requestAnimationFrame(loop);
  }

  A.debug = { putar: putar, lawan: lawan, minPutar: minPutar, conn: conn, mengalir: mengalir, arahAntara: arahAntara, budgetUntuk: budgetUntuk, BENTUK: BENTUK, ROWS: ROWS, COLS: COLS, DN: DN, DC: DC };

  /* ---------- input ---------- */

  function gerak (dx, dy) {
    if (gameOver) return;
    idle = 0;
    kx = Math.max(0, Math.min(COLS - 1, kx + dx));
    ky = Math.max(0, Math.min(ROWS - 1, ky + dy));
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (menang && (k === 'Space' || k === 'Enter')) { lanjut(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') gerak(-1, 0);
    else if (k === 'ArrowRight' || k === 'KeyD') gerak(1, 0);
    else if (k === 'ArrowUp' || k === 'KeyW') gerak(0, -1);
    else if (k === 'ArrowDown' || k === 'KeyS') gerak(0, 1);
    else if (k === 'Space' || k === 'Enter') putarSel();
  });

  function sentuh (e) {
    A.initAudio(); idle = 0;
    if (gameOver) { reset(); return; }
    if (menang) { lanjut(); return; }
    var px = null, py = null;
    try {
      var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = c.getBoundingClientRect();
      px = (t.clientX - r.left) * (W / r.width); py = (t.clientY - r.top) * (H / r.height);
    } catch (err) { px = null; }
    if (px === null) { putarSel(); return; }
    var cc = Math.floor((px - OX) / TS), rr = Math.floor((py - OY) / TS);
    if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) return;
    kx = cc; ky = rr; putarSel();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function pipesHtml (brand = 'THERYHANN!') {
  return shell('Pipa Bocor', brand, PIPES_JS, {
    w: 560, h: 560, maxw: 500, skin: 'pastel', sub: 'PASTEL',
    hint: '\u25B2 \u25BC \u25C0 \u25B6 pindah sel  \u00B7  \u25CF putar pipa 90\u00B0  \u00B7  alirkan air dari \u25B6 kiri ke \u2605 kanan'
  })
}

export const PASTEL5 = [
  { id: 'pipes', cmd: 'pipa', icon: '\u{1F6B0}', title: 'Pipa Bocor', nama: 'Pipa Bocor', html: pipesHtml, ratio: '560\u00D7560', w: 560, h: 560 }
]
