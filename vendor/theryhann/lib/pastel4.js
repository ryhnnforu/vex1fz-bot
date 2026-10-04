/**
 * 🐹 TIKUS TANAH — whack-a-mole (HTML app, skin pastel v7.5)
 * ------------------------------------------------------------------
 *  3×3 lubang, kursor ▲ ▼ ◀ ▶, pukul pakai ● (atau ketuk lubangnya).
 *  🐹 tikus = +10 · 🌟 tikus emas = +50 · 💣 bom = -1 nyawa.
 *  Kombo beruntun mengalikan poin. 60 detik, 3 nyawa, tempo naik tiap level.
 */
import { shell } from './htmlgames.js'

const MOLE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var KOLOM = 3, BARIS = 3, SEL = 158, TY = 128, OX = 24, OY = 152;
  var DURASI = 3600;   /* 60 detik */
  var IDLE = 900;
  var TIPE = ['tikus', 'tikus', 'tikus', 'emas', 'bom'];

  var lubang, kx, ky, skor, nyawa, kombo, komboMaks, kena, luput, waktu, level;
  var gameOver, pesan, runT, idle, timerLahir, efek, pesanKecil, pesanKecilT, mulai;

  /* ---------- fungsi murni (A.debug) ---------- */

  function intervalUntuk (lv) { return Math.max(20, 58 - (lv - 1) * 5); }
  function umurUntuk (lv) { return Math.max(22, 58 - (lv - 1) * 5); }
  function tipeAcak (lv) {
    var peluangEmas = 0.10 + Math.min(0.10, (lv - 1) * 0.015);
    var peluangBom = 0.14 + Math.min(0.14, (lv - 1) * 0.02);
    var r = Math.random();
    if (r < peluangBom) return 'bom';
    if (r < peluangBom + peluangEmas) return 'emas';
    return 'tikus';
  }
  function poin (tipe, combo) {
    var dasar = tipe === 'emas' ? 50 : (tipe === 'tikus' ? 10 : 0);
    return dasar * Math.min(4, 1 + Math.floor(combo / 4));
  }
  function levelUntuk (sisaWaktu) { return Math.min(8, Math.floor((DURASI - sisaWaktu) / 480) + 1); }

  /* ---------- keadaan ---------- */

  function reset () {
    lubang = [];
    for (var i = 0; i < KOLOM * BARIS; i++) lubang.push(null);
    kx = 1; ky = 1; skor = 0; nyawa = 3; kombo = 0; komboMaks = 0; kena = 0; luput = 0;
    waktu = DURASI; level = 1; gameOver = false; pesan = ''; runT = 0; idle = 0;
    timerLahir = 24; efek = []; pesanKecil = ''; pesanKecilT = 0; mulai = false;
    A.setScore(0); A.setBest(); A.setStatus('Level 1', '60.0s'); A.setProgress(1);
  }

  function tamat (sebab) {
    gameOver = true; pesan = sebab || 'WAKTU HABIS'; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
    A.setStatus('Skor ' + skor, 'Rekor ' + A.best);
  }

  function kecil (t) { pesanKecil = t; pesanKecilT = 55; }

  function idx (col, row) { return row * KOLOM + col; }
  function pusatX (col) { return OX + col * SEL + SEL / 2; }
  function pusatY (row) { return OY + row * TY + TY / 2; }

  function lahir () {
    var kosong = [];
    for (var i = 0; i < lubang.length; i++) if (!lubang[i]) kosong.push(i);
    if (!kosong.length) return;
    var pick = kosong[Math.floor(A.rand(0, kosong.length))];
    lubang[pick] = { tipe: tipeAcak(level), umur: umurUntuk(level), awal: umurUntuk(level) };
  }

  function pukul () {
    if (gameOver) { reset(); return; }
    if (!mulai) { mulai = true; A.SFX.level(); kecil('MULAI!'); return; }   /* tekanan pertama = mulai, bukan memukul */
    var i = idx(kx, ky), L = lubang[i];
    var px = pusatX(kx), py = pusatY(ky);
    if (!L) {
      luput++; kombo = 0;
      efek.push({ x: px, y: py, t: 16, jenis: 'angin' });
      A.SFX.crash();
      return;
    }
    lubang[i] = null;
    if (L.tipe === 'bom') {
      nyawa--; kombo = 0;
      efek.push({ x: px, y: py, t: 22, jenis: 'bom' });
      A.SFX.crash(); kecil('BOM! -1 NYAWA');
      if (nyawa <= 0) { tamat('TIGA BOM TERPUKUL — SKOR ' + skor); return; }
    } else {
      kombo++; kena++;
      if (kombo > komboMaks) komboMaks = kombo;
      var p = poin(L.tipe, kombo - 1);
      skor += p; A.setScore(skor);
      efek.push({ x: px, y: py, t: 20, jenis: L.tipe === 'emas' ? 'emas' : 'poin', teks: '+' + p });
      A.SFX.point();
      if (L.tipe === 'emas') { A.SFX.level(); kecil('EMAS! +' + p); }
      else if (kombo > 0 && kombo % 5 === 0) kecil('KOMBO ' + kombo + '!');
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    }
    A.setStatus('Level ' + level, 'Kombo x' + kombo);
    A.setProgress(Math.min(1, skor / 2500));
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

  function gambarLubang (col, row) {
    var x = pusatX(col), y = pusatY(row);
    ctx.fillStyle = '#e8d5c4';
    ctx.beginPath(); ctx.ellipse(x, y + 26, 62, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a88c';
    ctx.beginPath(); ctx.ellipse(x, y + 22, 54, 18, 0, 0, Math.PI * 2); ctx.fill();

    var L = lubang[idx(col, row)];
    if (L) {
      var naik = Math.min(1, (L.awal - L.umur) / 8), turun = Math.min(1, L.umur / 8);
      var k = Math.min(naik, turun);
      var ty = y + 24 - 46 * k;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 66, ty - 44, 132, 46 + 22); ctx.clip();
      if (L.tipe === 'bom') {
        ctx.fillStyle = '#5b4650';
        ctx.beginPath(); ctx.arc(x, ty, 26, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff8fb1'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, ty - 26); ctx.quadraticCurveTo(x + 10, ty - 40, x + 20, ty - 36); ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(x + 21, ty - 37, 5 + Math.sin(runT / 3) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x - 8, ty - 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 8, ty - 4, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        var bulu = L.tipe === 'emas' ? '#ffd166' : '#c9a7eb';
        var gelap = L.tipe === 'emas' ? '#d9a534' : '#9a74c4';
        ctx.fillStyle = bulu;
        ctx.beginPath(); ctx.ellipse(x, ty, 30, 32, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = gelap; ctx.stroke();
        /* telinga */
        ctx.beginPath(); ctx.arc(x - 20, ty - 26, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 20, ty - 26, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffe3ec';
        ctx.beginPath(); ctx.arc(x - 20, ty - 26, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 20, ty - 26, 5, 0, Math.PI * 2); ctx.fill();
        /* wajah */
        ctx.fillStyle = '#5b4650';
        ctx.beginPath(); ctx.arc(x - 10, ty - 4, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 10, ty - 4, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, ty + 6, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#5b4650';
        ctx.beginPath(); ctx.arc(x, ty + 8, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        if (L.tipe === 'emas') {
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '900 16px "Segoe UI", sans-serif';
          ctx.textAlign = 'center'; ctx.fillText('★', x, ty - 34); ctx.textAlign = 'left';
        }
      }
      ctx.restore();
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#eafff7'); bg.addColorStop(1, '#fff3e2');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* rumput */
    ctx.fillStyle = 'rgba(142,224,200,0.35)';
    for (var r0 = 0; r0 < 30; r0++) {
      var gx = (r0 * 71) % W, gy = H - 8 - (r0 % 4) * 5;
      ctx.beginPath(); ctx.ellipse(gx, gy, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    }

    /* HUD */
    ctx.textAlign = 'left'; ctx.fillStyle = '#7a5c6b'; ctx.font = '900 26px "Segoe UI", sans-serif';
    ctx.fillText('SKOR ' + skor, 24, 42);
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff7aa2'; ctx.font = '900 24px "Segoe UI", sans-serif';
    var detik = Math.max(0, waktu / 60);
    ctx.fillText(detik.toFixed(1) + 's', W - 24, 42);
    ctx.textAlign = 'left'; ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText('KOMBO x' + kombo + '   ·   KENA ' + kena + '   ·   REKOR ' + A.best, 24, 66);
    /* nyawa */
    ctx.textAlign = 'right'; ctx.fillStyle = '#ff6b8a'; ctx.font = '900 16px "Segoe UI", sans-serif';
    var hat = '';
    for (var hh = 0; hh < nyawa; hh++) hat += '♥ ';
    ctx.fillText(hat || '—', W - 24, 66);
    /* bar waktu */
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe9f0'; bulat(24, 80, W - 48, 13, 7); ctx.fill();
    ctx.fillStyle = waktu < 600 ? '#ff6b8a' : '#8ee0c8';
    bulat(24, 80, Math.max(13, (W - 48) * (waktu / DURASI)), 13, 7); ctx.fill();
    ctx.fillStyle = '#a98b9c'; ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillText('LEVEL ' + level + ' — TEMPO ' + (intervalUntuk(level)) + 'f, UMUR ' + (umurUntuk(level)) + 'f', 24, 116);

    for (var row = 0; row < BARIS; row++) for (var col = 0; col < KOLOM; col++) gambarLubang(col, row);

    /* kursor */
    if (!gameOver) {
      var cx = pusatX(kx), cy = pusatY(ky), pk = 3 + Math.sin(runT / 6) * 2.5;
      ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 4;
      bulat(cx - 66 - pk, cy - 52 - pk, 132 + pk * 2, 104 + pk * 2, 22); ctx.stroke();
      /* palu */
      ctx.save(); ctx.translate(cx + 44, cy - 44); ctx.rotate(-0.5 + Math.sin(runT / 9) * 0.12);
      ctx.fillStyle = '#c9a88c'; ctx.fillRect(-4, 0, 8, 34);
      ctx.fillStyle = '#a0c4ff'; bulat(-16, -16, 32, 20, 7); ctx.fill();
      ctx.strokeStyle = '#6f96d8'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
    }

    /* efek */
    for (var e = 0; e < efek.length; e++) {
      var E = efek[e], a = E.t / 22;
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      if (E.jenis === 'bom') {
        ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(E.x, E.y, (22 - E.t) * 3.4, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = E.jenis === 'emas' ? '#d9a534' : (E.jenis === 'angin' ? '#b79aa8' : '#3fbb94');
        ctx.font = '900 22px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(E.teks || (E.jenis === 'angin' ? 'MELESET' : ''), E.x, E.y - 30 - (22 - E.t) * 1.6);
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    }

    if (pesanKecilT > 0) {
      ctx.globalAlpha = Math.min(1, pesanKecilT / 20);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a'; ctx.font = '900 26px "Segoe UI", sans-serif';
      ctx.fillText(pesanKecil, W / 2, 146); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    if (!mulai && !gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.82)'; ctx.fillRect(0, 130, W, H - 130);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 30px "Segoe UI", sans-serif';
      ctx.fillText('TIKUS TANAH', W / 2, H / 2 - 30);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText('Tekan ● untuk mulai — 60 detik, 3 nyawa', W / 2, H / 2);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('▲ ▼ ◀ ▶ pindah lubang  ·  ● pukul  ·  hindari 💣', W / 2, H / 2 + 28);
      ctx.textAlign = 'left';
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(255,247,242,0.92)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff7aa2'; ctx.font = '900 34px "Segoe UI", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 52);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(pesan, W / 2, H / 2 - 22);
      ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillText('SKOR ' + skor, W / 2, H / 2 + 12);
      ctx.fillStyle = '#3fbb94'; ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('KENA ' + kena + ' · LUPUT ' + luput + ' · KOMBO TERBAIK ' + komboMaks + ' · REKOR ' + A.best, W / 2, H / 2 + 40);
      ctx.fillStyle = '#b79aa8'; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 74);
      ctx.textAlign = 'left';
    } else if (idle > IDLE * 0.6 && mulai) {
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,107,138,0.95)'; ctx.font = '900 16px "Segoe UI", sans-serif';
      ctx.fillText('AFK ' + Math.max(0, Math.ceil((IDLE - idle) / 60)) + 's', W / 2, H - 14); ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t; runT += dt;

    if (!gameOver) {
      idle += dt;
      if (idle > IDLE) tamat('AFK ' + Math.round(IDLE / 60) + ' DETIK');
      else if (mulai) {
        waktu -= dt;
        if (waktu <= 0) { waktu = 0; tamat('WAKTU HABIS — SKOR ' + skor); }
        var lv = levelUntuk(waktu);
        if (lv !== level) { level = lv; A.SFX.level(); kecil('LEVEL ' + level); A.setStatus('Level ' + level, 'Kombo x' + kombo); }
        timerLahir -= dt;
        if (timerLahir <= 0) {
          lahir();
          if (level >= 4 && Math.random() < 0.35) lahir();
          timerLahir = intervalUntuk(level);
        }
        for (var i = 0; i < lubang.length; i++) {
          if (lubang[i]) { lubang[i].umur -= dt; if (lubang[i].umur <= 0) lubang[i] = null; }
        }
        A.setStatus('Level ' + level, (waktu / 60).toFixed(1) + 's');
      }
      for (i = efek.length - 1; i >= 0; i--) { efek[i].t -= dt; if (efek[i].t <= 0) efek.splice(i, 1); }
      if (pesanKecilT > 0) pesanKecilT -= dt;
    }

    draw();

    var muncul = 0, bom = 0;
    for (var q = 0; q < lubang.length; q++) if (lubang[q]) { muncul++; if (lubang[q].tipe === 'bom') bom++; }

    A.state = {
      kx: kx, ky: ky, skor: skor, nyawa: nyawa, kombo: kombo, komboMaks: komboMaks,
      kena: kena, luput: luput, waktu: Math.round(waktu), detik: Number((waktu / 60).toFixed(1)),
      level: level, muncul: muncul, bom: bom, mulai: mulai,
      over: gameOver, sebab: pesan, idle: Math.round(idle), best: A.best,
      lubang: lubang.map(function (L) { return L ? L.tipe : null; })
    };

    requestAnimationFrame(loop);
  }

  A.debug = { intervalUntuk: intervalUntuk, umurUntuk: umurUntuk, tipeAcak: tipeAcak, poin: poin, levelUntuk: levelUntuk, DURASI: DURASI, KOLOM: KOLOM, BARIS: BARIS };

  /* ---------- input ---------- */

  function gerak (dx, dy) {
    if (gameOver) return;
    idle = 0;
    kx = Math.max(0, Math.min(KOLOM - 1, kx + dx));
    ky = Math.max(0, Math.min(BARIS - 1, ky + dy));
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
    else if (k === 'Space' || k === 'Enter') pukul();
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
    if (px === null) { pukul(); return; }
    var col = Math.floor((px - OX) / SEL), row = Math.floor((py - OY) / TY);
    if (col < 0 || row < 0 || col >= KOLOM || row >= BARIS) { pukul(); return; }
    kx = col; ky = row; pukul();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function moleHtml (brand = 'THERYHANN!') {
  return shell('Tikus Tanah', brand, MOLE_JS, {
    w: 520, h: 560, maxw: 480, skin: 'pastel', sub: 'PASTEL',
    hint: '\u25B2 \u25BC \u25C0 \u25B6 pindah lubang  \u00B7  \u25CF pukul  \u00B7  \uD83D\uDC39 +10  \u00B7  \u2B50 +50  \u00B7  \uD83D\uDCA3 -1 nyawa'
  })
}

export const PASTEL4 = [
  { id: 'mole', cmd: 'tikus', icon: '\u{1F439}', title: 'Tikus Tanah', nama: 'Tikus Tanah', html: moleHtml, ratio: '520\u00D7560', w: 520, h: 560 }
]
