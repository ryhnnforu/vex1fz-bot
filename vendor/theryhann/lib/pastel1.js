/**
 * 🍬 PERMEN PASTEL — match-3 (HTML app, skin pastel v7.5)
 * ------------------------------------------------------------------
 *  Sistem SAMA dengan arcade: canvas + D-pad (▲ ▼ ◀ ▶ + ●) + WebAudio
 *  + rekor di localStorage. Bedanya hanya *penampilan*: kulit pastel
 *  (krem/pink/mint), sudut membulat, permen berwajah.
 *
 *  Kontrak test (wajib dijaga):
 *   - tiap frame set A.state = {...}   → dipakai autopilot
 *   - A.debug = { fn murni }           → dipakai assertion logika
 *   - tanpa input 15 detik → GAME OVER
 *   - kode game: ES5, tanpa backtick, tanpa ${, tanpa IIFE sendiri
 */
import { shell } from './htmlgames.js'

const MATCH3_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var N = 8, TS = 58, OX = 22, OY = 120;
  var WARNA = ['#ff8fb1', '#ffd166', '#8ee0c8', '#a0c4ff', '#c9a7eb', '#ffab73'];
  var GELAP = ['#d9607f', '#d9a534', '#5cb89c', '#6f96d8', '#9a74c4', '#d9834a'];
  var IDLE = 900;

  var g, kx, ky, sel, langkah, skor, kombo, fase, animT, jatuhOff, popList;
  var gameOver, pesan, runT, idle, kedip, pesanKecil, pesanKecilT;

  /* ---------- fungsi murni (diekspor ke A.debug) ---------- */

  function tetangga (i, j) {
    if (i < 0 || j < 0 || i >= N * N || j >= N * N) return false;
    var d = Math.abs(Math.floor(i / N) - Math.floor(j / N)) + Math.abs((i % N) - (j % N));
    return d === 1;
  }

  function cariMatch (arr) {
    var tanda = [], i, j, k, run, sama;
    for (i = 0; i < N; i++) {
      run = 1;
      for (j = 1; j <= N; j++) {
        sama = (j < N) && arr[i * N + j] >= 0 && arr[i * N + j] === arr[i * N + j - 1];
        if (sama) run++;
        else { if (run >= 3) { for (k = j - run; k < j; k++) tanda.push(i * N + k); } run = 1; }
      }
    }
    for (j = 0; j < N; j++) {
      run = 1;
      for (i = 1; i <= N; i++) {
        sama = (i < N) && arr[i * N + j] >= 0 && arr[i * N + j] === arr[(i - 1) * N + j];
        if (sama) run++;
        else { if (run >= 3) { for (k = i - run; k < i; k++) tanda.push(k * N + j); } run = 1; }
      }
    }
    var unik = {}, out = [];
    for (i = 0; i < tanda.length; i++) { if (!unik[tanda[i]]) { unik[tanda[i]] = 1; out.push(tanda[i]); } }
    return out;
  }

  function gravitasi (arr) {
    var out = [], j, i, tumpuk;
    for (i = 0; i < N * N; i++) out.push(-1);
    for (j = 0; j < N; j++) {
      tumpuk = [];
      for (i = N - 1; i >= 0; i--) if (arr[i * N + j] >= 0) tumpuk.push(arr[i * N + j]);
      for (i = 0; i < tumpuk.length; i++) out[(N - 1 - i) * N + j] = tumpuk[i];
    }
    return out;
  }

  function bolehTukar (arr, i, j) {
    if (!tetangga(i, j)) return false;
    var sal = arr.slice(), t = sal[i]; sal[i] = sal[j]; sal[j] = t;
    return cariMatch(sal).length > 0;
  }

  function adaLangkah (arr) {
    var i;
    for (i = 0; i < N * N; i++) {
      if (i % N < N - 1 && bolehTukar(arr, i, i + 1)) return true;
      if (Math.floor(i / N) < N - 1 && bolehTukar(arr, i, i + N)) return true;
    }
    return false;
  }

  /* ---------- bangun papan ---------- */

  function papanAcak () {
    var arr = [], i, coba = 0;
    for (i = 0; i < N * N; i++) arr.push(Math.floor(A.rand(0, WARNA.length)));
    while (cariMatch(arr).length && coba++ < 400) {
      var m = cariMatch(arr);
      for (i = 0; i < m.length; i++) arr[m[i]] = Math.floor(A.rand(0, WARNA.length));
    }
    if (!adaLangkah(arr)) return papanAcak();
    return arr;
  }

  function reset () {
    g = papanAcak();
    jatuhOff = []; for (var i = 0; i < N * N; i++) jatuhOff.push(0);
    kx = 3; ky = 3; sel = -1; langkah = 25; skor = 0; kombo = 0;
    fase = 'main'; animT = 0; popList = [];
    gameOver = false; pesan = ''; runT = 0; idle = 0; kedip = 0; pesanKecil = ''; pesanKecilT = 0;
    A.setScore(0); A.setBest(); A.setStatus('Sisa 25 langkah', 'Kombo x0'); A.setProgress(0);
    A.setHint('◀ ▶ ▲ ▼ pilih permen  ·  ● tukar  ·  3+ sewarna = meletus');
  }

  function tamat (sebab) {
    gameOver = true; fase = 'over'; pesan = sebab || 'LANGKAH HABIS';
    A.SFX.crash();
    if (skor > A.best) { A.best = skor; }
    A.saveBest(A.best); A.setBest();
    A.setStatus('Skor ' + skor, 'Rekor ' + A.best);
  }

  function kecil (t) { pesanKecil = t; pesanKecilT = 70; }

  /* ---------- aksi ---------- */

  function mulaiPop () {
    popList = cariMatch(g);
    if (!popList.length) return false;
    kombo++;
    var pts = popList.length * 10 * kombo;
    skor += pts; A.setScore(skor); A.SFX.point();
    kecil(popList.length >= 5 ? ('HEBAT! +' + pts) : (kombo > 1 ? ('KOMBO x' + kombo + ' +' + pts) : ('+' + pts)));
    A.setProgress(Math.min(1, skor / 3000));
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    animT = 14; fase = 'pop';
    return true;
  }

  function tukar () {
    if (gameOver) { reset(); return; }
    if (fase !== 'main') return;
    var idx = ky * N + kx, t;
    if (sel < 0) { sel = idx; A.SFX.jump(); return; }
    if (sel === idx) { sel = -1; return; }
    if (!tetangga(sel, idx)) { sel = idx; A.SFX.jump(); return; }
    t = g[sel]; g[sel] = g[idx]; g[idx] = t;
    if (cariMatch(g).length) {
      langkah--; kombo = 0;
      A.setStatus('Sisa ' + langkah + ' langkah', 'Kombo x0');
      mulaiPop();
    } else {
      t = g[sel]; g[sel] = g[idx]; g[idx] = t;
      kecil('TIDAK ADA COCOK'); A.SFX.crash();
    }
    sel = -1;
  }

  function prosesJatuh () {
    var j, i, idx, tumpuk, asal, kosong;
    for (i = 0; i < N * N; i++) jatuhOff[i] = 0;
    for (j = 0; j < N; j++) {
      tumpuk = []; asal = [];
      for (i = N - 1; i >= 0; i--) { if (g[i * N + j] >= 0) { tumpuk.push(g[i * N + j]); asal.push(i); } }
      kosong = N - tumpuk.length;
      for (i = 0; i < N; i++) {
        idx = (N - 1 - i) * N + j;
        if (i < tumpuk.length) { g[idx] = tumpuk[i]; jatuhOff[idx] = (N - 1 - i) - asal[i]; }
        else { g[idx] = Math.floor(A.rand(0, WARNA.length)); jatuhOff[idx] = kosong; }
      }
    }
    animT = 14; fase = 'jatuh';
  }

  function kocokUlang () {
    var coba = 0;
    do { g = papanAcak(); coba++; } while (!adaLangkah(g) && coba < 20);
    kecil('PAPAN DIKOCOK ULANG'); A.SFX.level();
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

  function permen (x, y, s, w, skala) {
    var k = skala === undefined ? 1 : skala;
    if (k <= 0.02) return;
    var sz = s * k, off = (s - sz) / 2;
    bulat(x + off + 3, y + off + 3, sz - 6, sz - 6, 13 * k);
    ctx.fillStyle = WARNA[w]; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = GELAP[w]; ctx.stroke();
    /* kilau */
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x + off + sz * 0.32, y + off + sz * 0.28, sz * 0.16, sz * 0.10, -0.5, 0, Math.PI * 2); ctx.fill();
    /* wajah */
    ctx.fillStyle = '#5b4650';
    var cxm = x + off + sz / 2, cym = y + off + sz / 2 + 2 * k;
    ctx.beginPath(); ctx.arc(cxm - 8 * k, cym - 2 * k, 2.6 * k, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cxm + 8 * k, cym - 2 * k, 2.6 * k, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2 * k; ctx.strokeStyle = '#5b4650';
    ctx.beginPath(); ctx.arc(cxm, cym + 3 * k, 5 * k, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  function draw () {
    runT += 0;
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#fff7f2'); bg.addColorStop(1, '#ffeede');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* titik-titik hias */
    ctx.fillStyle = 'rgba(255,182,205,0.35)';
    for (var d = 0; d < 26; d++) {
      var dx = (d * 79) % W, dy = (d * 53) % H;
      ctx.beginPath(); ctx.arc(dx, dy, 3 + (d % 3), 0, Math.PI * 2); ctx.fill();
    }

    /* HUD */
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7a5c6b'; ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + skor, 24, 46);
    ctx.fillStyle = langkah <= 5 ? '#ff6b8a' : '#3fbb94';
    ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'right'; ctx.fillText('LANGKAH ' + langkah, W - 24, 46);
    ctx.textAlign = 'left'; ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText('KOMBO x' + kombo + '   ·   REKOR ' + A.best, 24, 70);
    /* bar target */
    ctx.fillStyle = '#ffe9f0'; bulat(24, 82, W - 48, 12, 6); ctx.fill();
    ctx.fillStyle = '#ff9ec4'; bulat(24, 82, Math.max(12, (W - 48) * Math.min(1, skor / 3000)), 12, 6); ctx.fill();

    /* papan */
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; bulat(OX - 8, OY - 8, N * TS + 16, N * TS + 16, 20); ctx.fill();
    ctx.strokeStyle = '#ffd7e4'; ctx.lineWidth = 3; ctx.stroke();

    var i, r, col, x, y, sk, offy;
    for (i = 0; i < N * N; i++) {
      r = Math.floor(i / N); col = i % N;
      x = OX + col * TS; y = OY + r * TS;
      if (fase === 'pop' && popList.indexOf(i) >= 0) { sk = Math.max(0, animT / 14); permen(x, y, TS, g[i], sk); continue; }
      offy = fase === 'jatuh' ? -jatuhOff[i] * TS * Math.min(1, animT / 14) : 0;
      if (g[i] >= 0) permen(x, y + offy, TS, g[i], 1);
    }

    /* seleksi & kursor */
    if (!gameOver && fase === 'main') {
      if (sel >= 0) {
        ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 4;
        bulat(OX + (sel % N) * TS + 2, OY + Math.floor(sel / N) * TS + 2, TS - 4, TS - 4, 14); ctx.stroke();
      }
      var pk = 2 + Math.sin(runT / 7) * 2;
      ctx.strokeStyle = '#7a5c6b'; ctx.lineWidth = 3;
      bulat(OX + kx * TS - pk, OY + ky * TS - pk, TS + pk * 2, TS + pk * 2, 16); ctx.stroke();
    }

    /* pesan kecil */
    if (pesanKecilT > 0) {
      ctx.globalAlpha = Math.min(1, pesanKecilT / 25);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a'; ctx.font = '900 24px "Segoe UI", sans-serif';
      ctx.fillText(pesanKecil, W / 2, OY - 16 - (70 - pesanKecilT) * 0.25);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.9)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 34px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 10);
      ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 28);
      ctx.fillStyle = '#3fbb94'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('REKOR ' + A.best, W / 2, H / 2 + 54);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI (25 LANGKAH)', W / 2, H / 2 + 86);
      ctx.textAlign = 'left';
    } else if (idle > IDLE * 0.6) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,107,138,0.9)'; ctx.font = '900 16px "Segoe UI", sans-serif';
      ctx.fillText('MASIH DIMAINKAN? ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's', W / 2, OY + N * TS + 26);
      ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;

    if (!gameOver) {
      idle += dt;
      if (idle > IDLE) { tamat('AFK ' + Math.round(IDLE / 60) + ' DETIK — PERMEN MENCAIR'); }
      else if (fase === 'pop') {
        animT -= dt;
        if (animT <= 0) {
          for (var q = 0; q < popList.length; q++) g[popList[q]] = -1;
          prosesJatuh();
        }
      } else if (fase === 'jatuh') {
        animT -= dt;
        if (animT <= 0) {
          if (!mulaiPop()) {
            kombo = 0; fase = 'main';
            A.setStatus('Sisa ' + langkah + ' langkah', 'Kombo x0');
            if (langkah <= 0) tamat('LANGKAH HABIS — SKOR ' + skor);
            else if (!adaLangkah(g)) kocokUlang();
          }
        }
      }
      if (pesanKecilT > 0) pesanKecilT -= dt;
    }

    draw();

    A.state = {
      fase: fase, kx: kx, ky: ky, sel: sel, langkah: langkah, skor: skor, kombo: kombo,
      over: gameOver, sebab: pesan, idle: Math.round(idle), pop: popList.length,
      papan: g.slice(), best: A.best
    };

    requestAnimationFrame(loop);
  }

  A.debug = { cariMatch: cariMatch, gravitasi: gravitasi, tetangga: tetangga, bolehTukar: bolehTukar, adaLangkah: adaLangkah, N: N, WARNA: WARNA.length };

  /* ---------- input ---------- */

  function gerak (dx, dy) {
    if (gameOver) return;
    idle = 0;
    if (fase !== 'main') return;
    kx = Math.max(0, Math.min(N - 1, kx + dx));
    ky = Math.max(0, Math.min(N - 1, ky + dy));
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') gerak(-1, 0);
    else if (k === 'ArrowRight' || k === 'KeyD') gerak(1, 0);
    else if (k === 'ArrowUp' || k === 'KeyW') gerak(0, -1);
    else if (k === 'ArrowDown' || k === 'KeyS') gerak(0, 1);
    else if (k === 'Space' || k === 'Enter') tukar();
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
    if (px === null) { tukar(); return; }
    var col = Math.floor((px - OX) / TS), row = Math.floor((py - OY) / TS);
    if (col < 0 || row < 0 || col >= N || row >= N) return;
    kx = col; ky = row; tukar();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function match3Html (brand = 'THERYHANN!') {
  return shell('Permen Pastel', brand, MATCH3_JS, {
    w: 520, h: 620, maxw: 480, skin: 'pastel', sub: 'PASTEL',
    hint: '\u25C0 \u25B6 \u25B2 \u25BC geser kursor  \u00B7  \u25CF pilih lalu tukar  \u00B7  3+ permen sewarna meletus'
  })
}

export const PASTEL1 = [
  { id: 'match3', cmd: 'match3', icon: '\u{1F36C}', title: 'Permen Pastel', nama: 'Permen Pastel', html: match3Html, ratio: '520\u00D7620', w: 520, h: 620 }
]
