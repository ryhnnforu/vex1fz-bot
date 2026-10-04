/**
 * 🕹️ ARCADE NEON v7.6 — batch 1 (3 game HTML app)
 * ------------------------------------------------------------------
 *  • .missile  🛰️ Missile Command Neon — lindungi 3 kota, cegat rudal
 *  • .lukis    🧊 Lukis Neon — warnai grid, hindari 3 percik api
 *  • .lander   🌙 Lunar Lander Neon — mendarat mulus di pad, bahan bakar terbatas
 *
 *  Semua pakai shell yang sama dengan .arcade (canvas + D-pad ▲▼◀▶● +
 *  WebAudio + rekor localStorage + bar 🏆 kode setor skor), hanya isi
 *  game-nya baru dan desain visualnya berbeda satu sama lain.
 */
import { shell } from './htmlgames.js'

/* ================================================================== */
/*  🛰️ MISSILE COMMAND NEON                                           */
/* ================================================================== */
const MISSILE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var TANAH = H - 56, KOTA_X = [W * 0.2, W * 0.5, W * 0.8];
  var BAT_X = [W * 0.06, W * 0.5, W * 0.94];

  var cx, cy, musuh, cegat, ledak, kota, amunisi, gelombang, skor, over,
      sebab, runT, spawn, jedaSpawn, sisaMusuh, kotaSelamat, pesanT, pesan;

  function reset () {
    cx = W / 2; cy = H / 2;
    musuh = []; cegat = []; ledak = [];
    kota = [true, true, true];
    amunisi = [10, 10, 10];
    gelombang = 1; skor = 0; over = false; sebab = ''; runT = 0;
    sisaMusuh = 8; jedaSpawn = 90; spawn = 40; kotaSelamat = 0; pesan = ''; pesanT = 0;
    A.setScore(0); A.setBest(); A.setStatus('Wave 1', 'Rudal 30'); A.setProgress(1);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function bateraiTerdekat (x) {
    var terbaik = -1, jarak = 1e9;
    for (var i = 0; i < BAT_X.length; i++) {
      if (amunisi[i] <= 0) continue;
      var d = Math.abs(BAT_X[i] - x);
      if (d < jarak) { jarak = d; terbaik = i; }
    }
    return terbaik;
  }
  function tembak () {
    if (over) { reset(); return; }
    var b = bateraiTerdekat(cx);
    if (b < 0) return;
    amunisi[b]--;
    var x0 = BAT_X[b], y0 = TANAH - 10;
    var dx = cx - x0, dy = cy - y0, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var v = 8.5;
    cegat.push({ x: x0, y: y0, vx: dx / len * v, vy: dy / len * v, tx: cx, ty: cy, b: b });
    A.SFX.jump();
  }
  function buatLedak (x, y, warna, r) {
    ledak.push({ x: x, y: y, r: 4, maks: r || 44, warna: warna, t: 0 });
    A.SFX.point();
  }
  function gelombangBaru () {
    gelombang++;
    amunisi = [10 + gelombang, 10 + gelombang, 10 + gelombang];
    sisaMusuh = 6 + gelombang * 3;
    jedaSpawn = Math.max(26, 92 - gelombang * 8);
    var bonus = 0;
    for (var i = 0; i < 3; i++) if (kota[i]) bonus += 100;
    for (var j = 0; j < 3; j++) bonus += amunisi[j] * 5;
    skor += bonus;
    kotaSelamat = 0;
    for (var k = 0; k < 3; k++) if (!kota[k] && Math.random() < 0.5) kota[k] = true;
    pesan = 'WAVE ' + gelombang + ' · BONUS +' + bonus; pesanT = 90;
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    A.SFX.level();
  }
  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    /* rudal musuh */
    if (sisaMusuh > 0) {
      spawn--;
      if (spawn <= 0) {
        spawn = jedaSpawn;
        sisaMusuh--;
        var tujuan = [];
        for (var i = 0; i < 3; i++) if (kota[i]) tujuan.push(KOTA_X[i]);
        for (var b = 0; b < 3; b++) if (amunisi[b] > 0) tujuan.push(BAT_X[b]);
        if (!tujuan.length) tujuan = [W / 2];
        var tx = tujuan[(Math.random() * tujuan.length) | 0] + (Math.random() - 0.5) * 30;
        var x0 = 20 + Math.random() * (W - 40);
        var v = 1.1 + gelombang * 0.16;
        var dx = tx - x0, dy = TANAH - 10, len = Math.sqrt(dx * dx + dy * dy) || 1;
        var pecah = gelombang >= 3 && Math.random() < 0.22;
        musuh.push({ x: x0, y: 10, vx: dx / len * v, vy: dy / len * v, tx: tx, pecah: pecah, jejak: [] });
      }
    }
    for (var m = 0; m < musuh.length; m++) {
      var e = musuh[m];
      e.x += e.vx; e.y += e.vy;
      if (runT % 3 === 0) e.jejak.push({ x: e.x, y: e.y });
      if (e.jejak.length > 40) e.jejak.shift();
      if (e.pecah && e.y > H * 0.45 && !e.pecahOk) {
        e.pecahOk = true;
        for (var q = 0; q < 2; q++) {
          var v2 = 1.4 + gelombang * 0.15;
          musuh.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * v2 * 1.6, vy: v2, tx: e.x, pecah: false, jejak: [] });
        }
      }
      if (e.y >= TANAH - 6) {
        e.habis = true;
        buatLedak(e.x, TANAH - 6, '#ff3b6b', 52);
        for (var ci = 0; ci < 3; ci++) {
          if (kota[ci] && Math.abs(KOTA_X[ci] - e.x) < 46) { kota[ci] = false; A.SFX.crash(); }
        }
        for (var bi = 0; bi < 3; bi++) {
          if (Math.abs(BAT_X[bi] - e.x) < 34) amunisi[bi] = 0;
        }
      }
    }
    musuh = musuh.filter(function (e) { return !e.habis; });
    /* rudal pencegat */
    for (var k = 0; k < cegat.length; k++) {
      var o = cegat[k];
      o.x += o.vx; o.y += o.vy;
      var sampai = (o.vy < 0 && o.y <= o.ty) || (o.vy >= 0 && o.y >= o.ty) || o.x < 0 || o.x > W || o.y < 0;
      if (sampai) { o.habis = true; buatLedak(o.x, Math.max(8, o.y), '#59f7ff', 46); }
    }
    cegat = cegat.filter(function (o) { return !o.habis; });
    /* ledakan */
    for (var l = 0; l < ledak.length; l++) {
      var z = ledak[l];
      z.t++;
      z.r = z.t < 12 ? 4 + (z.maks - 4) * (z.t / 12) : Math.max(0, z.maks * (1 - (z.t - 12) / 20));
      if (z.r > 4) {
        for (var m2 = 0; m2 < musuh.length; m2++) {
          var g = musuh[m2];
          if (g.habis) continue;
          var dx2 = g.x - z.x, dy2 = g.y - z.y;
          if (dx2 * dx2 + dy2 * dy2 < z.r * z.r) {
            g.habis = true; skor += 25; A.setScore(skor);
            if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
            buatLedak(g.x, g.y, '#ffd166', 30);
          }
        }
      }
    }
    ledak = ledak.filter(function (z) { return z.r > 0; });
    musuh = musuh.filter(function (e) { return !e.habis; });
    /* kondisi akhir */
    var hidup = 0;
    for (var c2 = 0; c2 < 3; c2++) if (kota[c2]) hidup++;
    kotaSelamat = hidup;
    if (!hidup) return tamat('SEMUA KOTA HANCUR');
    if (sisaMusuh <= 0 && !musuh.length) gelombangBaru();
  }

  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05010f'); g.addColorStop(0.6, '#12062b'); g.addColorStop(1, '#1b0a33');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* bintang */
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (var s = 0; s < 40; s++) {
      var sx = (s * 137) % W, sy = (s * 71) % (TANAH - 40);
      ctx.fillRect(sx, sy, 2, 2);
    }
    /* tanah */
    ctx.fillStyle = '#2a1250'; ctx.fillRect(0, TANAH, W, H - TANAH);
    ctx.strokeStyle = '#7b3ff2'; ctx.beginPath(); ctx.moveTo(0, TANAH); ctx.lineTo(W, TANAH); ctx.stroke();
    /* kota */
    for (var i = 0; i < 3; i++) {
      if (!kota[i]) {
        ctx.fillStyle = '#4a2060';
        ctx.fillRect(KOTA_X[i] - 34, TANAH - 12, 68, 12);
        ctx.fillStyle = '#ff3b6b'; ctx.font = '700 12px monospace';
        ctx.fillText('RATA', KOTA_X[i] - 16, TANAH - 18);
        continue;
      }
      ctx.fillStyle = '#3fe0ff';
      for (var b2 = 0; b2 < 4; b2++) {
        var bh = 14 + ((i * 7 + b2 * 11) % 22);
        ctx.fillRect(KOTA_X[i] - 32 + b2 * 17, TANAH - bh, 12, bh);
      }
      ctx.fillStyle = 'rgba(255,255,180,0.85)';
      for (var w2 = 0; w2 < 6; w2++) ctx.fillRect(KOTA_X[i] - 30 + (w2 % 3) * 17, TANAH - 8 - Math.floor(w2 / 3) * 12, 3, 3);
    }
    /* baterai */
    for (var k = 0; k < 3; k++) {
      ctx.fillStyle = amunisi[k] > 0 ? '#9d4edd' : '#4a2060';
      ctx.beginPath(); ctx.moveTo(BAT_X[k] - 16, TANAH); ctx.lineTo(BAT_X[k] + 16, TANAH);
      ctx.lineTo(BAT_X[k] + 8, TANAH - 16); ctx.lineTo(BAT_X[k] - 8, TANAH - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 11px monospace';
      ctx.fillText('×' + amunisi[k], BAT_X[k] - 9, TANAH - 22);
    }
    /* jejak rudal musuh */
    for (var m = 0; m < musuh.length; m++) {
      var e = musuh[m];
      ctx.strokeStyle = e.pecah ? 'rgba(255,120,60,0.75)' : 'rgba(255,59,107,0.75)';
      ctx.beginPath();
      for (var j = 0; j < e.jejak.length; j++) {
        if (j === 0) ctx.moveTo(e.jejak[j].x, e.jejak[j].y); else ctx.lineTo(e.jejak[j].x, e.jejak[j].y);
      }
      ctx.stroke();
      ctx.fillStyle = e.pecah ? '#ff9f43' : '#ff3b6b';
      ctx.beginPath(); ctx.arc(e.x, e.y, 4, 0, 6.29); ctx.fill();
    }
    /* pencegat */
    ctx.strokeStyle = 'rgba(89,247,255,0.8)';
    for (var q = 0; q < cegat.length; q++) {
      var o = cegat[q];
      ctx.beginPath(); ctx.moveTo(BAT_X[o.b], TANAH - 10); ctx.lineTo(o.x, o.y); ctx.stroke();
      ctx.fillStyle = '#59f7ff'; ctx.beginPath(); ctx.arc(o.x, o.y, 3, 0, 6.29); ctx.fill();
    }
    /* ledakan */
    for (var l = 0; l < ledak.length; l++) {
      var z = ledak[l];
      ctx.strokeStyle = z.warna; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.29); ctx.stroke();
      ctx.fillStyle = z.warna.replace(')', ',0.18)').replace('rgb', 'rgba');
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    }
    /* crosshair */
    ctx.strokeStyle = '#00f3ff';
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 6.29); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy); ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy); ctx.lineTo(cx + 18, cy);
    ctx.moveTo(cx, cy - 18); ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, cy + 18);
    ctx.stroke();
    /* HUD */
    ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
    ctx.fillText('WAVE ' + gelombang, 12, 22);
    ctx.fillText('SISA RUDAL MUSUH ' + (sisaMusuh + musuh.length), 12, 40);
    ctx.textAlign = 'right';
    ctx.fillText('KOTA ' + kotaSelamat + '/3', W - 12, 22);
    ctx.fillText('AMUNISI ' + (amunisi[0] + amunisi[1] + amunisi[2]), W - 12, 40);
    ctx.textAlign = 'left';
    if (pesanT > 0) {
      ctx.fillStyle = '#ffd166'; ctx.font = '900 20px monospace'; ctx.textAlign = 'center';
      ctx.fillText(pesan, W / 2, 90); ctx.textAlign = 'left';
    }
    if (over) {
      ctx.fillStyle = 'rgba(5,1,15,0.86)'; ctx.fillRect(0, H / 2 - 66, W, 132);
      ctx.strokeStyle = '#ff3b6b'; ctx.strokeRect(0, H / 2 - 66, W, 132);
      ctx.fillStyle = '#ff3b6b'; ctx.font = '900 26px monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 26);
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 14px monospace';
      ctx.fillText(sebab + ' · SKOR ' + skor + ' · WAVE ' + gelombang, W / 2, H / 2 + 2);
      ctx.fillText('TAP / ● UNTUK MULAI LAGI', W / 2, H / 2 + 34);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    if (!over) { for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Wave ' + gelombang, 'Kota ' + kotaSelamat + '/3');
    A.setProgress(sisaMusuh / Math.max(1, 6 + gelombang * 3));
    A.state = {
      skor: skor, gelombang: gelombang, kota: kota.slice(), kotaSelamat: kotaSelamat,
      amunisi: amunisi.slice(), musuh: musuh.length, cegat: cegat.length, ledak: ledak.length,
      sisaMusuh: sisaMusuh, cx: Math.round(cx), cy: Math.round(cy), over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { bateraiTerdekat: bateraiTerdekat, tembak: tembak, buatLedak: buatLedak, KOTA_X: KOTA_X, BAT_X: BAT_X, TANAH: TANAH };

  function bidik (dx, dy) {
    if (over) { reset(); return; }
    cx = Math.max(6, Math.min(W - 6, cx + dx * 16));
    cy = Math.max(20, Math.min(TANAH - 6, cy + dy * 16));
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') bidik(-1, 0);
    else if (k === 'ArrowRight' || k === 'KeyD') bidik(1, 0);
    else if (k === 'ArrowUp' || k === 'KeyW') bidik(0, -1);
    else if (k === 'ArrowDown' || k === 'KeyS') bidik(0, 1);
    else if (k === 'Space' || k === 'Enter') tembak();
  });
  function sentuh (e) {
    A.initAudio();
    if (over) { reset(); return; }
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      cx = Math.max(6, Math.min(W - 6, (tt.clientX - r.left) * (W / Math.max(1, r.width))));
      cy = Math.max(20, Math.min(TANAH - 6, (tt.clientY - r.top) * (H / Math.max(1, r.height))));
      tembak();
    } catch (err) { tembak(); }
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function missileHtml (brand = 'THERYHANN!') {
  return shell('Missile Command', brand, MISSILE_JS, {
    w: 640, h: 520, maxw: 640, skin: 'neon', sub: 'ARCADE',
    hint: '▲▼◀▶ arahkan crosshair · ● luncurkan pencegat dari baterai terdekat · ledakan menghancurkan rudal musuh · lindungi 3 kota'
  })
}

/* ================================================================== */
/*  🧊 LUKIS NEON (territory painter)                                  */
/* ================================================================== */
const PAINT_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var N = 12, TS, OX, OY, TARGET = 0.75;

  var grid, px, py, percik, skor, nyawa, level, waktu, waktuAwal, cat,
      over, sebab, runT, combo, comboTerbaik, arahPercik, langkahMusuh;
  var tahan = { kiri: false, kanan: false, atas: false, bawah: false };

  function ukuran () {
    TS = Math.floor(Math.min((W - 40) / N, (H - 120) / N));
    OX = Math.floor((W - TS * N) / 2);
    OY = Math.floor((H - TS * N) / 2) + 16;
  }
  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function buatGrid (lvl, seed) {
    var rng = seedRng(seed), g = [], i, j;
    for (i = 0; i < N; i++) {
      g.push([]);
      for (j = 0; j < N; j++) g[i].push(0);
    }
    /* beberapa sel penghalang (tidak bisa dicat) */
    var halang = 4 + lvl * 2;
    for (var k = 0; k < halang; k++) {
      var x = Math.floor(rng() * N), y = Math.floor(rng() * N);
      if (x === 0 && y === 0) continue;
      g[y][x] = 9;
    }
    return g;
  }
  function buatPercik (lvl, seed) {
    var rng = seedRng(seed + 7), out = [], i;
    var jumlah = Math.min(5, 2 + Math.floor(lvl / 2));
    for (i = 0; i < jumlah; i++) {
      out.push({
        x: N - 1 - (i % 2), y: N - 1 - Math.floor(i / 2),
        vx: 0, vy: 0, t: Math.floor(rng() * 20),
        v: 0.045 + lvl * 0.008 + rng() * 0.012
      });
    }
    return out;
  }
  function totalBisa () {
    var n = 0;
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) if (grid[i][j] !== 9) n++;
    return n;
  }
  function persenCat () { return cat / totalBisa(); }
  function poinCat (lvl, combo) { return 10 + lvl * 2 + Math.min(20, combo); }
  function waktuLevel (lvl) { return Math.max(30, 70 - lvl * 5); }

  function reset (lvl, pertahankanSkor) {
    ukuran();
    level = lvl || 1;
    grid = buatGrid(level, level * 313 + 7);
    percik = buatPercik(level, level * 313);
    px = 0; py = 0; cat = 0; combo = 0;
    if (!pertahankanSkor) { skor = 0; nyawa = 3; comboTerbaik = 0; }
    waktuAwal = waktuLevel(level) * 60; waktu = waktuAwal;
    over = false; sebab = ''; runT = 0; langkahMusuh = 0;
    catSel(0, 0);
    A.setScore(skor); A.setBest();
    A.setStatus('Level ' + level, 'Waktu ' + Math.ceil(waktu / 60)); A.setProgress(0);
  }
  function catSel (x, y) {
    if (grid[y][x] === 9 || grid[y][x] === 1) return false;
    grid[y][x] = 1; cat++; combo++;
    if (combo > comboTerbaik) comboTerbaik = combo;
    skor += poinCat(level, combo);
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    A.SFX.point();
    return true;
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }

  function gerakPercik () {
    langkahMusuh++;
    for (var i = 0; i < percik.length; i++) {
      var p = percik[i];
      p.t++;
      /* kejar pemain sebagian waktu, acak sisanya */
      var dx = px - p.x, dy = py - p.y;
      var acak = p.t % 40 < (level <= 1 ? 22 : 14);
      if (acak) { p.vx = (Math.random() - 0.5); p.vy = (Math.random() - 0.5); }
      else {
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx += (dx / len) * p.v; p.vy += (dy / len) * p.v;
      }
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      var maks = 0.075 + level * 0.011;
      if (sp > maks) { p.vx = p.vx / sp * maks; p.vy = p.vy / sp * maks; }
      var nx = p.x + p.vx, ny = p.y + p.vy;
      if (nx < 0 || nx > N - 1) { p.vx *= -1; nx = Math.max(0, Math.min(N - 1, nx)); }
      if (ny < 0 || ny > N - 1) { p.vy *= -1; ny = Math.max(0, Math.min(N - 1, ny)); }
      p.x = nx; p.y = ny;
      if (grid[Math.round(p.y)][Math.round(p.x)] === 9) { p.vx *= -1; p.vy *= -1; }
      if (runT > 60 && Math.abs(p.x - px) < 0.55 && Math.abs(p.y - py) < 0.55) kenaPercik();
    }
  }
  function kenaPercik () {
    nyawa--; combo = 0; A.SFX.crash();
    if (nyawa <= 0) return tamat('TERSENGAT PERCIK API');
    px = 0; py = 0;
    for (var i = 0; i < percik.length; i++) { percik[i].x = N - 1; percik[i].y = N - 1; percik[i].vx = 0; percik[i].vy = 0; }
    waktu = Math.min(waktuAwal, waktu + 60);
  }

  function langkah () {
    runT++;
    if (!over) {
      waktu--;
      if (waktu <= 0) { waktu = 0; return tamat('WAKTU HABIS'); }
      /* tombol yang ditahan = kuas jalan terus (tiap 5 frame satu sel) */
      if (runT % 5 === 0) {
        if (tahan.kiri) geser(-1, 0);
        else if (tahan.kanan) geser(1, 0);
        else if (tahan.atas) geser(0, -1);
        else if (tahan.bawah) geser(0, 1);
      }
      gerakPercik();
      if (persenCat() >= TARGET) {
        skor += 250 + Math.round(waktu / 60) * 8 + nyawa * 40;
        A.setScore(skor);
        if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
        A.SFX.level();
        if (level >= 8) return tamat('SEMUA LEVEL SELESAI');
        level++;
        reset(level, true);
      }
    }
  }

  function gambar () {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#08131f'); g.addColorStop(1, '#101a2e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var v = grid[y][x];
        var rx = OX + x * TS, ry = OY + y * TS;
        if (v === 9) {
          ctx.fillStyle = '#2b3a52'; ctx.fillRect(rx + 1, ry + 1, TS - 2, TS - 2);
          ctx.strokeStyle = '#46587a'; ctx.strokeRect(rx + 1, ry + 1, TS - 2, TS - 2);
        } else if (v === 1) {
          var hue = ((x + y) * 14 + level * 20) % 360;
          ctx.fillStyle = 'hsl(' + hue + ', 85%, 55%)';
          ctx.fillRect(rx + 1, ry + 1, TS - 2, TS - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(rx + 1, ry + 1, TS - 2, 4);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(rx + 1, ry + 1, TS - 2, TS - 2);
          ctx.strokeStyle = 'rgba(120,160,220,0.22)'; ctx.strokeRect(rx + 1, ry + 1, TS - 2, TS - 2);
        }
      }
    }
    /* pemain: kuas neon */
    var ppx = OX + px * TS + TS / 2, ppy = OY + py * TS + TS / 2;
    ctx.shadowBlur = 14; ctx.shadowColor = '#00f3ff';
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath(); ctx.arc(ppx, ppy, TS * 0.3, 0, 6.29); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(TS * 0.34) + 'px monospace';
    ctx.textAlign = 'center'; ctx.fillText('✚', ppx, ppy + TS * 0.12); ctx.textAlign = 'left';
    /* percik api */
    for (var i = 0; i < percik.length; i++) {
      var p = percik[i];
      var ex = OX + p.x * TS + TS / 2, ey = OY + p.y * TS + TS / 2;
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff9f43';
      ctx.fillStyle = '#ff9f43';
      ctx.beginPath();
      for (var a = 0; a < 8; a++) {
        var rad = a % 2 === 0 ? TS * 0.32 : TS * 0.16;
        var ang = a * 0.785 + runT / 22;
        var vx2 = ex + Math.cos(ang) * rad, vy2 = ey + Math.sin(ang) * rad;
        if (a === 0) ctx.moveTo(vx2, vy2); else ctx.lineTo(vx2, vy2);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
    /* HUD */
    ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
    ctx.fillText('LEVEL ' + level, 12, 22);
    ctx.fillText('CAT ' + Math.round(persenCat() * 100) + '% / ' + Math.round(TARGET * 100) + '%', 12, 40);
    ctx.textAlign = 'right';
    ctx.fillText('NYAWA ' + nyawa, W - 12, 22);
    ctx.fillText('WAKTU ' + Math.ceil(waktu / 60) + 's', W - 12, 40);
    ctx.textAlign = 'left';
    if (combo > 3) { ctx.fillStyle = '#ffd166'; ctx.fillText('RANTAI ' + combo, 12, 58); }
    if (over) {
      ctx.fillStyle = 'rgba(8,19,31,0.88)'; ctx.fillRect(0, H / 2 - 62, W, 124);
      ctx.strokeStyle = '#ff3b6b'; ctx.strokeRect(0, H / 2 - 62, W, 124);
      ctx.fillStyle = '#ff3b6b'; ctx.font = '900 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
      ctx.fillText(sebab + ' · SKOR ' + skor + ' · LEVEL ' + level, W / 2, H / 2 + 4);
      ctx.fillText('TAP / ● UNTUK MULAI LAGI', W / 2, H / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    if (!over) { for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Level ' + level, 'Cat ' + Math.round(persenCat() * 100) + '%');
    A.setProgress(persenCat() / TARGET);
    A.state = {
      skor: skor, level: level, nyawa: nyawa, cat: cat, total: totalBisa(),
      persen: Math.round(persenCat() * 100), target: Math.round(TARGET * 100),
      px: px, py: py, percik: percik.map(function (p) { return [Number(p.x.toFixed(2)), Number(p.y.toFixed(2))]; }),
      combo: combo, comboTerbaik: comboTerbaik, waktu: Math.ceil(waktu / 60),
      over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { buatGrid: buatGrid, buatPercik: buatPercik, totalBisa: totalBisa, persenCat: persenCat, poinCat: poinCat, waktuLevel: waktuLevel, catSel: catSel, N: N, TARGET: TARGET };

  function geser (dx, dy) {
    if (over) { reset(1); return; }
    var nx = Math.max(0, Math.min(N - 1, px + dx)), ny = Math.max(0, Math.min(N - 1, py + dy));
    if (nx === px && ny === py) return;
    px = nx; py = ny;
    catSel(px, py);
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(1); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') { tahan.kiri = true; geser(-1, 0); }
    else if (k === 'ArrowRight' || k === 'KeyD') { tahan.kanan = true; geser(1, 0); }
    else if (k === 'ArrowUp' || k === 'KeyW') { tahan.atas = true; geser(0, -1); }
    else if (k === 'ArrowDown' || k === 'KeyS') { tahan.bawah = true; geser(0, 1); }
    else if (k === 'Space' || k === 'Enter') { if (over) reset(1); else catSel(px, py); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') tahan.kiri = false;
    else if (k === 'ArrowRight' || k === 'KeyD') tahan.kanan = false;
    else if (k === 'ArrowUp' || k === 'KeyW') tahan.atas = false;
    else if (k === 'ArrowDown' || k === 'KeyS') tahan.bawah = false;
  });
  function sentuh (e) {
    A.initAudio();
    if (over) { reset(1); return; }
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      var mx = (tt.clientX - r.left) * (W / Math.max(1, r.width));
      var my = (tt.clientY - r.top) * (H / Math.max(1, r.height));
      var gx = Math.floor((mx - OX) / TS), gy = Math.floor((my - OY) / TS);
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) return;
      /* bergerak satu sel ke arah sentuhan */
      var dx = gx === px ? 0 : (gx > px ? 1 : -1);
      var dy = gy === py ? 0 : (gy > py ? 1 : -1);
      if (dx || dy) geser(dx, dy); else catSel(px, py);
    } catch (err) {}
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset(1);
  requestAnimationFrame(loop);
`

export function painterHtml (brand = 'THERYHANN!') {
  return shell('Lukis Neon', brand, PAINT_JS, {
    w: 560, h: 560, maxw: 540, skin: 'neon', sub: 'ARCADE',
    hint: '▲▼◀▶ geser kuas · cat 75% grid untuk naik level · hindari percik api (nyawa -1) · makin lama rantai cat = poin makin besar'
  })
}

/* ================================================================== */
/*  🌙 LUNAR LANDER NEON                                               */
/* ================================================================== */
const LANDER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var TANAH0 = H - 70, G = 0.045;

  var x, y, vx, vy, sudut, bahan, kapal, skor, level, angin, terrain, pads,
      dorong, over, sebab, runT, ledak, mendarat, pesanT, pesan, jejak;

  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function buatTerrain (lvl, seed) {
    var rng = seedRng(seed), titik = [], pad = [], i;
    var jumlahPad = lvl <= 1 ? 2 : lvl <= 3 ? 2 : 3;
    var lebar = 46 - lvl * 2;
    var x0 = 0;
    titik.push({ x: 0, y: TANAH0 - 20 - rng() * 60 });
    for (i = 0; i < jumlahPad; i++) {
      var px = 70 + rng() * (W - 160);
      var py = TANAH0 - rng() * 90;
      titik.push({ x: px - lebar, y: TANAH0 - 30 - rng() * 70 });
      titik.push({ x: px - lebar, y: py });
      titik.push({ x: px + lebar, y: py });
      titik.push({ x: px + lebar, y: TANAH0 - 30 - rng() * 70 });
      pad.push({ x: px - lebar, x2: px + lebar, y: py, kali: 1 + (jumlahPad - i) * 0.5 });
    }
    titik.push({ x: W, y: TANAH0 - 20 - rng() * 60 });
    titik.sort(function (a, b) { return a.x - b.x; });
    return { titik: titik, pad: pad };
  }
  function tinggiTanah (px) {
    var t = terrain.titik, i;
    for (i = 0; i < t.length - 1; i++) {
      if (px >= t[i].x && px <= t[i + 1].x) {
        var r = (px - t[i].x) / ((t[i + 1].x - t[i].x) || 1);
        return t[i].y + (t[i + 1].y - t[i].y) * r;
      }
    }
    return TANAH0;
  }
  function padDi (px) {
    for (var i = 0; i < terrain.pad.length; i++) {
      var p = terrain.pad[i];
      if (px >= p.x && px <= p.x2) return p;
    }
    return null;
  }
  function nilaiMendarat (sisaBahan, kaliPad, lvl) {
    return Math.round((200 + sisaBahan * 4 + lvl * 60) * kaliPad);
  }
  function kondisiAman (vyy, vxx, ang) {
    return Math.abs(vyy) < 1.7 && Math.abs(vxx) < 1.1 && Math.abs(ang) < 0.28;
  }

  function reset (lvl, pertahankan) {
    level = lvl || 1;
    terrain = buatTerrain(level, level * 7717 + 5);
    x = 40 + Math.random() * (W - 80); y = 60;
    vx = (Math.random() - 0.5) * 0.6; vy = 0; sudut = 0;
    angin = level >= 3 ? (Math.random() - 0.5) * 0.012 * level : 0;
    bahan = 100; dorong = false; mendarat = false;
    ledak = []; jejak = []; pesan = ''; pesanT = 0; runT = 0;
    if (!pertahankan) { kapal = 3; skor = 0; }
    over = false; sebab = '';
    A.setScore(skor); A.setBest();
    A.setStatus('Misi ' + level, 'Kapal ' + kapal); A.setProgress(1);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function meledak () {
    if (over) return;
    for (var i = 0; i < 26; i++) {
      ledak.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, t: 40 });
    }
    A.SFX.crash();
    kapal = Math.max(0, kapal - 1);
    if (kapal <= 0) return tamat('KAPAL HABIS');
    reset(level, true);
    pesan = 'KAPAL HANCUR · sisa ' + kapal; pesanT = 90;
  }

  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    if (mendarat) {
      pesanT--;
      return;
    }
    /* fisika */
    vy += G;
    vx += angin;
    if (dorong && bahan > 0) {
      var daya = 0.115;
      vx += Math.sin(sudut) * daya;
      vy -= Math.cos(sudut) * daya;
      bahan = Math.max(0, bahan - 0.42);
      jejak.push({ x: x - Math.sin(sudut) * 14, y: y + Math.cos(sudut) * 14, t: 16 });
      if (runT % 12 === 0) A.SFX.jump();
    }
    x += vx; y += vy;
    if (x < 10) { x = 10; vx = Math.abs(vx) * 0.4; }
    if (x > W - 10) { x = W - 10; vx = -Math.abs(vx) * 0.4; }
    /* langit-langit lunak: kapal tidak boleh hilang ke luar layar */
    if (y < 26) { y = 26; if (vy < 0) vy = vy * -0.25; }
    for (var i = 0; i < jejak.length; i++) jejak[i].t--;
    jejak = jejak.filter(function (j) { return j.t > 0; });
    /* tabrakan dengan tanah */
    var gy = tinggiTanah(x);
    if (y >= gy - 8) {
      y = gy - 8;
      var p = padDi(x);
      if (p && kondisiAman(vy, vx, sudut)) {
        var tambah = nilaiMendarat(bahan, p.kali, level);
        skor += tambah;
        A.setScore(skor);
        if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
        A.SFX.level();
        mendarat = true;
        pesan = 'MENDARAT SEMPURNA +' + tambah;
        pesanT = 110;
        vx = 0; vy = 0;
        if (level >= 6) return tamat('SEMUA MISI SELESAI');
        level++;
        reset(level, true);
        return;
      }
      return meledak();
    }
    for (var l = 0; l < ledak.length; l++) {
      var z = ledak[l]; z.x += z.vx; z.y += z.vy; z.vy += 0.06; z.t--;
    }
    ledak = ledak.filter(function (z) { return z.t > 0; });
  }

  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#02030a'); g.addColorStop(0.7, '#0a0f24'); g.addColorStop(1, '#141b3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (var s = 0; s < 60; s++) {
      ctx.fillRect((s * 97) % W, (s * 53) % (H - 120), 1.6, 1.6);
    }
    /* bumi kecil */
    ctx.fillStyle = '#3a7bd5'; ctx.beginPath(); ctx.arc(W - 60, 54, 22, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(W - 66, 48, 7, 0, 6.29); ctx.fill();
    /* terrain */
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var i = 0; i < terrain.titik.length; i++) ctx.lineTo(terrain.titik[i].x, terrain.titik[i].y);
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = '#1b2447'; ctx.fill();
    ctx.strokeStyle = '#7b3ff2'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j < terrain.titik.length; j++) {
      if (j === 0) ctx.moveTo(terrain.titik[j].x, terrain.titik[j].y);
      else ctx.lineTo(terrain.titik[j].x, terrain.titik[j].y);
    }
    ctx.stroke(); ctx.lineWidth = 1;
    /* pad */
    for (var p = 0; p < terrain.pad.length; p++) {
      var pd = terrain.pad[p];
      ctx.strokeStyle = '#00ff87'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pd.x, pd.y); ctx.lineTo(pd.x2, pd.y); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = '#00ff87'; ctx.font = '700 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('×' + pd.kali.toFixed(1), (pd.x + pd.x2) / 2, pd.y - 8);
      ctx.textAlign = 'left';
    }
    /* jejak api */
    for (var f = 0; f < jejak.length; f++) {
      ctx.globalAlpha = jejak[f].t / 16;
      ctx.fillStyle = '#ffb703';
      ctx.beginPath(); ctx.arc(jejak[f].x, jejak[f].y, 3, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1;
    }
    /* kapal */
    if (!mendarat || pesanT > 0) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(sudut);
      if (dorong && bahan > 0 && !mendarat) {
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 26 + Math.random() * 8); ctx.lineTo(5, 12); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#9fe8ff';
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e6f7ff'; ctx.beginPath(); ctx.arc(0, -4, 4, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#59f7ff';
      ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-14, 14); ctx.moveTo(10, 8); ctx.lineTo(14, 14); ctx.stroke();
      ctx.restore();
    }
    for (var l = 0; l < ledak.length; l++) {
      ctx.globalAlpha = ledak[l].t / 40;
      ctx.fillStyle = l % 2 ? '#ff3b6b' : '#ffd166';
      ctx.fillRect(ledak[l].x - 2, ledak[l].y - 2, 4, 4);
      ctx.globalAlpha = 1;
    }
    /* HUD */
    ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
    ctx.fillText('MISI ' + level, 12, 22);
    ctx.fillText('BAHAN ' + Math.round(bahan) + '%', 12, 40);
    ctx.fillText('KAPAL ' + kapal, 12, 58);
    ctx.textAlign = 'right';
    ctx.fillText('V-BAWAH ' + vy.toFixed(2), W - 12, 22);
    ctx.fillText('V-SAMPING ' + vx.toFixed(2), W - 12, 40);
    ctx.fillText('SUDUT ' + Math.round(sudut * 57.3) + '°', W - 12, 58);
    ctx.textAlign = 'left';
    if (angin) { ctx.fillStyle = '#ffd166'; ctx.fillText('ANGIN ' + (angin > 0 ? '→' : '←'), 12, 76); }
    /* bilah bahan bakar */
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(W / 2 - 70, 14, 140, 8);
    ctx.fillStyle = bahan > 25 ? '#00ff87' : '#ff3b6b';
    ctx.fillRect(W / 2 - 70, 14, 140 * (bahan / 100), 8);
    ctx.fillStyle = '#9fe8ff'; ctx.textAlign = 'center';
    ctx.fillText('▲ gas · ◀▶ putar · mendarat: V<1.7 sudut<16°', W / 2, 40);
    if (pesanT > 0) {
      ctx.fillStyle = mendarat ? '#00ff87' : '#ffd166';
      ctx.font = '900 20px monospace';
      ctx.fillText(pesan, W / 2, H / 2 - 40);
    }
    ctx.textAlign = 'left';
    if (over) {
      ctx.fillStyle = 'rgba(2,3,10,0.88)'; ctx.fillRect(0, H / 2 - 58, W, 116);
      ctx.strokeStyle = '#ff3b6b'; ctx.strokeRect(0, H / 2 - 58, W, 116);
      ctx.fillStyle = '#ff3b6b'; ctx.font = '900 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('MISI GAGAL', W / 2, H / 2 - 18);
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
      ctx.fillText(sebab + ' · SKOR ' + skor + ' · MISI ' + level, W / 2, H / 2 + 8);
      ctx.fillText('TAP / ● UNTUK COBA LAGI', W / 2, H / 2 + 34);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    if (!over) { for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Misi ' + level + ' · kapal ' + kapal, 'Bahan ' + Math.round(bahan) + '%');
    A.setProgress(bahan / 100);
    A.state = {
      skor: skor, level: level, kapal: kapal, bahan: Math.round(bahan),
      x: Math.round(x), y: Math.round(y), vx: Number(vx.toFixed(2)), vy: Number(vy.toFixed(2)),
      sudut: Number(sudut.toFixed(2)), angin: Number(angin.toFixed(4)), dorong: dorong,
      pad: terrain.pad.length, mendarat: mendarat, ledak: ledak.length,
      over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { buatTerrain: buatTerrain, tinggiTanah: tinggiTanah, padDi: padDi, nilaiMendarat: nilaiMendarat, kondisiAman: kondisiAman, G: G, TANAH0: TANAH0 };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(1); return; }
    if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') dorong = true;
    else if (k === 'ArrowLeft' || k === 'KeyA') sudut = Math.max(-0.9, sudut - 0.07);
    else if (k === 'ArrowRight' || k === 'KeyD') sudut = Math.min(0.9, sudut + 0.07);
    else if (k === 'ArrowDown' || k === 'KeyS') { vx *= 0.9; }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') dorong = false;
  });
  function sentuh (e) {
    A.initAudio();
    if (over) { reset(1); return; }
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      var mx = (tt.clientX - r.left) * (W / Math.max(1, r.width));
      var my = (tt.clientY - r.top) * (H / Math.max(1, r.height));
      if (my > H * 0.6) { dorong = true; return; }
      sudut = Math.max(-0.9, Math.min(0.9, (mx / W - 0.5) * 1.6));
    } catch (err) { dorong = true; }
  }
  function lepas () { dorong = false; }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', lepas);
  c.addEventListener('mousedown', function (e) { sentuh(e); });
  c.addEventListener('mouseup', lepas);

  reset(1);
  requestAnimationFrame(loop);
`

export function landerHtml (brand = 'THERYHANN!') {
  return shell('Lunar Lander', brand, LANDER_JS, {
    w: 620, h: 520, maxw: 620, skin: 'neon', sub: 'ARCADE',
    hint: '▲ tahan untuk menyalakan mesin · ◀▶ putar kapal · ▼ rem samping · mendarat di garis hijau: kecepatan bawah < 1.7 & sudut < 16°'
  })
}

export const ARCADE6 = [
  { id: 'missile', cmd: 'missile', icon: '🛰️', title: 'Missile Command', nama: 'Missile Command Neon', html: missileHtml, ratio: '640×520', w: 640, h: 520 },
  { id: 'lukis', cmd: 'lukis', icon: '🧊', title: 'Lukis Neon', nama: 'Lukis Neon', html: painterHtml, ratio: '560×560', w: 560, h: 560 },
  { id: 'lander', cmd: 'lander', icon: '🌙', title: 'Lunar Lander', nama: 'Lunar Lander Neon', html: landerHtml, ratio: '620×520', w: 620, h: 520 }
]
