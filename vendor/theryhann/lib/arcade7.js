/**
 * 🕹️ ARCADE NEON v7.6 — batch 2 (2 game HTML app)
 * ------------------------------------------------------------------
 *  • .spiral  🌀 Spiral Neon — turunkan bola lewat celah cincin yang berputar
 *  • .bomber  💣 Bomber Neon — pasang bom, hancurkan blok & musuh, hindari ledakan
 *
 *  Skin neon (sama seperti .arcade) tapi visual & mekanik berbeda dari
 *  19 game arcade yang sudah ada.
 */
import { shell } from './htmlgames.js'

/* ================================================================== */
/*  🌀 SPIRAL NEON                                                     */
/* ================================================================== */
const SPIRAL_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var BALL_Y = H * 0.62, BALL_X = W / 2, R = 11;

  var cincin, geser, kecepatan, kedalaman, skor, kombo, komboTerbaik,
      sempit, over, sebab, runT, bintang, ledak, pesanT, pesan, level;

  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  /* refGap: 'tengah' = paksa celah tepat di bawah bola (cincin pertama, supaya
     selalu bisa dilewati), atau angka = celah cincin sebelumnya (dibatasi ±92px
     supaya masih terkejar dalam waktu antar-cincin ≈ 39 frame). */
  function buatCincin (i, lvl, rng, refGap) {
    var lebarGap = Math.max(46, 92 - lvl * 5 - (i % 5) * 3);
    var posisi = (rng ? rng() : Math.random());
    var x = 40 + posisi * (W - 80 - lebarGap);
    if (refGap === 'tengah') x = BALL_X - lebarGap / 2;
    else if (typeof refGap === 'number') {
      if (x > refGap + 92) x = refGap + 92;
      if (x < refGap - 92) x = refGap - 92;
    }
    x = Math.max(30, Math.min(W - 30 - lebarGap, x));
    return {
      y: BALL_Y + 90 + i * 96, gap: x, w: lebarGap, lewat: false,
      putar: lvl >= 2 ? (Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) * (0.35 + lvl * 0.12) : 0) : 0,
      warna: i % 3
    };
  }
  function kecepatanUntuk (dalam, lvl) { return Math.min(7, 2.1 + dalam * 0.012 + lvl * 0.35); }
  function poinLewat (dalam, kombo, tengah) {
    return Math.round((10 + Math.min(30, dalam * 0.2)) * (1 + Math.min(1.5, kombo * 0.1)) + (tengah ? 15 : 0));
  }
  function celahTerbuka (o, xBall) {
    return xBall + R > o.gap + geser && xBall - R < o.gap + geser + o.w;
  }

  function reset () {
    var rng = seedRng(9187);
    cincin = [];
    for (var i = 0; i < 8; i++) cincin.push(buatCincin(i, 1, rng, i === 0 ? 'tengah' : cincin[i - 1].gap));
    geser = 0; kedalaman = 0; skor = 0; kombo = 0; komboTerbaik = 0;
    level = 1; over = false; sebab = ''; runT = 0; ledak = []; pesan = ''; pesanT = 0;
    kecepatan = kecepatanUntuk(0, 1);
    bintang = [];
    for (var b = 0; b < 50; b++) bintang.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() });
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Speed ' + kecepatan.toFixed(1)); A.setProgress(0);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    for (var i = 0; i < 24; i++) ledak.push({ x: BALL_X, y: BALL_Y, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7, t: 40 });
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }

  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    kecepatan = kecepatanUntuk(kedalaman, level);
    for (var i = 0; i < cincin.length; i++) {
      var o = cincin[i];
      o.y -= kecepatan;
      if (o.putar) {
        o.gap += o.putar;
        if (o.gap < 30) { o.gap = 30; o.putar = Math.abs(o.putar); }
        if (o.gap + o.w > W - 30) { o.gap = W - 30 - o.w; o.putar = -Math.abs(o.putar); }
      }
      if (!o.lewat && o.y <= BALL_Y) {
        o.lewat = true;
        if (celahTerbuka(o, BALL_X)) {
          var tengah = Math.abs((o.gap + geser + o.w / 2) - BALL_X) < 10;
          kombo++;
          if (kombo > komboTerbaik) komboTerbaik = kombo;
          skor += poinLewat(kedalaman, kombo, tengah);
          A.setScore(skor);
          if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
          kedalaman++;
          if (tengah) { pesan = 'TENGAH! ×' + kombo; pesanT = 34; }
          A.SFX.point();
          if (kedalaman % 12 === 0) {
            level++;
            skor += 200; A.setScore(skor);
            pesan = 'LEVEL ' + level; pesanT = 60;
            A.SFX.level();
          }
        } else {
          return tamat('BOLA MENABRAK CINCIN');
        }
      }
    }
    /* buang cincin yang sudah lewat, tambah yang baru di bawah */
    cincin = cincin.filter(function (o) { return o.y > -60; });
    while (cincin.length < 8) {
      var terakhir = cincin.length ? cincin[cincin.length - 1] : null;
      var baru = buatCincin(kedalaman + cincin.length, level, null, terakhir ? terakhir.gap : 'tengah');
      baru.y = Math.max((terakhir ? terakhir.y : BALL_Y) + 96, H + 40);
      cincin.push(baru);
    }
    for (var s = 0; s < bintang.length; s++) {
      bintang[s].y -= kecepatan * bintang[s].z * 0.5;
      if (bintang[s].y < 0) { bintang[s].y = H; bintang[s].x = Math.random() * W; }
    }
    for (var l = 0; l < ledak.length; l++) {
      var z = ledak[l]; z.x += z.vx; z.y += z.vy; z.vy += 0.08; z.t--;
    }
    ledak = ledak.filter(function (z) { return z.t > 0; });
  }

  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0221'); g.addColorStop(0.6, '#1a0740'); g.addColorStop(1, '#2b0a4d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var s = 0; s < bintang.length; s++) {
      ctx.fillRect(bintang[s].x, bintang[s].y, bintang[s].z * 2, bintang[s].z * 2);
    }
    /* cincin */
    var warnaC = ['#00f3ff', '#9d4edd', '#00ff87'];
    for (var i = 0; i < cincin.length; i++) {
      var o = cincin[i];
      var gx = o.gap + geser;
      ctx.shadowBlur = 10; ctx.shadowColor = warnaC[o.warna];
      ctx.strokeStyle = warnaC[o.warna]; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(6, o.y); ctx.lineTo(gx, o.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx + o.w, o.y); ctx.lineTo(W - 6, o.y); ctx.stroke();
      /* tiang penghubung biar terasa seperti menara */
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(157,78,221,0.35)';
      ctx.beginPath(); ctx.moveTo(6, o.y); ctx.lineTo(6, o.y + 96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 6, o.y); ctx.lineTo(W - 6, o.y + 96); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      if (o.putar) {
        ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.font = '700 11px monospace';
        ctx.fillText(o.putar > 0 ? '▶' : '◀', gx + o.w / 2 - 4, o.y - 8);
      }
    }
    /* bola + jejak */
    ctx.shadowBlur = 16; ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff5ea8';
    ctx.beginPath(); ctx.arc(BALL_X, BALL_Y, R, 0, 6.29); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(BALL_X - 3, BALL_Y - 4, 3.4, 0, 6.29); ctx.fill();
    for (var t = 1; t <= 4; t++) {
      ctx.globalAlpha = 0.28 - t * 0.05;
      ctx.fillStyle = '#ff5ea8';
      ctx.beginPath(); ctx.arc(BALL_X, BALL_Y + t * 12, R - t * 1.4, 0, 6.29); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (var l = 0; l < ledak.length; l++) {
      ctx.globalAlpha = ledak[l].t / 40;
      ctx.fillStyle = l % 2 ? '#ff007f' : '#ffd166';
      ctx.fillRect(ledak[l].x - 2, ledak[l].y - 2, 4, 4);
      ctx.globalAlpha = 1;
    }
    /* HUD */
    ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
    ctx.fillText('LEVEL ' + level, 12, 22);
    ctx.fillText('KEDALAMAN ' + kedalaman, 12, 40);
    ctx.fillText('SPEED ' + kecepatan.toFixed(1), 12, 58);
    ctx.textAlign = 'right';
    ctx.fillText('GESER ' + Math.round(geser), W - 12, 22);
    ctx.fillText('KOMBO ' + kombo, W - 12, 40);
    ctx.textAlign = 'left';
    if (pesanT > 0) {
      ctx.fillStyle = '#ffd166'; ctx.font = '900 20px monospace'; ctx.textAlign = 'center';
      ctx.fillText(pesan, W / 2, 96); ctx.textAlign = 'left';
    }
    if (over) {
      ctx.fillStyle = 'rgba(11,2,33,0.88)'; ctx.fillRect(0, H / 2 - 64, W, 128);
      ctx.strokeStyle = '#ff007f'; ctx.strokeRect(0, H / 2 - 64, W, 128);
      ctx.fillStyle = '#ff007f'; ctx.font = '900 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 24);
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
      ctx.fillText(sebab + ' · SKOR ' + skor + ' · KEDALAMAN ' + kedalaman, W / 2, H / 2 + 2);
      ctx.fillText('TAP / ● UNTUK TURUN LAGI', W / 2, H / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    if (!over) { langkahGeser(); for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Level ' + level + ' · ' + kedalaman, 'Speed ' + kecepatan.toFixed(1));
    A.setProgress(Math.min(1, (kedalaman % 12) / 12));
    var berikut = null;
    for (var bi = 0; bi < cincin.length; bi++) { if (!cincin[bi].lewat) { berikut = cincin[bi]; break; } }
    A.state = {
      skor: skor, level: level, kedalaman: kedalaman, kombo: kombo, komboTerbaik: komboTerbaik,
      kecepatan: Number(kecepatan.toFixed(2)), geser: Math.round(geser), cincin: cincin.length,
      gapPertama: berikut ? Math.round(berikut.gap + geser) : null,
      lebarGap: berikut ? Math.round(berikut.w) : null,
      yBerikut: berikut ? Math.round(berikut.y) : null,
      over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { buatCincin: buatCincin, kecepatanUntuk: kecepatanUntuk, poinLewat: poinLewat, celahTerbuka: function (o, x) { return celahTerbuka(o, x); }, BALL_Y: BALL_Y, BALL_X: BALL_X, geserKe: function (v) { geser = v; } };

  var tahanKiri = false, tahanKanan = false;

  function geserMenara (d) {
    if (over) { reset(); return; }
    geser = Math.max(-(W - 120), Math.min(W - 120, geser + d * 15));
  }
  function langkahGeser () {
    if (over) return;
    if (tahanKiri) geser = Math.max(-(W - 120), geser - 3.1);
    if (tahanKanan) geser = Math.min(W - 120, geser + 3.1);
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') { tahanKiri = true; geserMenara(-1); }
    else if (k === 'ArrowRight' || k === 'KeyD') { tahanKanan = true; geserMenara(1); }
    else if (k === 'ArrowUp' || k === 'KeyW') { /* tidak dipakai */ }
    else if (k === 'ArrowDown' || k === 'KeyS') { /* tidak dipakai */ }
    else if (k === 'Space' || k === 'Enter') { if (over) reset(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') tahanKiri = false;
    if (k === 'ArrowRight' || k === 'KeyD') tahanKanan = false;
  });
  function sentuh (e) {
    A.initAudio();
    if (over) { reset(); return; }
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, width: W };
      var mx = (tt.clientX - r.left) * (W / Math.max(1, r.width));
      geserMenara(mx < W / 2 ? -1 : 1);
    } catch (err) {}
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function spiralHtml (brand = 'THERYHANN!') {
  return shell('Spiral Neon', brand, SPIRAL_JS, {
    w: 520, h: 620, maxw: 500, skin: 'neon', sub: 'ARCADE',
    hint: '◀▶ geser menara supaya bola masuk celah cincin · tahan tombol untuk geser halus · celah tengah = bonus · level naik tiap 12 cincin'
  })
}

/* ================================================================== */
/*  💣 BOMBER NEON                                                     */
/* ================================================================== */
const BOMBER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var COLS = 15, ROWS = 13, TS = 32, OX, OY;
  /* isi sel: 0 kosong · 1 tembok · 2 blok (bisa hancur) */

  var grid, px, py, bom, ledak, musuh, skor, nyawa, level, waktu, waktuAwal,
      over, sebab, runT, maksBom, jangkauan, musuhHancur, blokHancur, arah, pesan, pesanT;

  function hitungOffset () {
    OX = Math.floor((W - COLS * TS) / 2);
    OY = Math.floor((H - ROWS * TS) / 2) + 14;
  }
  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function buatGrid (lvl, seed) {
    var rng = seedRng(seed), g = [], x, y;
    for (y = 0; y < ROWS; y++) {
      g.push([]);
      for (x = 0; x < COLS; x++) {
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) g[y].push(1);
        else if (x % 2 === 0 && y % 2 === 0) g[y].push(1);
        else g[y].push(rng() < (0.42 - Math.min(0.14, lvl * 0.02)) ? 2 : 0);
      }
    }
    /* area awal pemain harus kosong */
    g[1][1] = 0; g[1][2] = 0; g[2][1] = 0;
    return g;
  }
  function buatMusuh (lvl, seed) {
    var rng = seedRng(seed + 31), out = [], jumlah = Math.min(7, 2 + lvl), coba = 0;
    while (out.length < jumlah && coba < 300) {
      coba++;
      var x = 2 + Math.floor(rng() * (COLS - 4)), y = 2 + Math.floor(rng() * (ROWS - 4));
      if (grid[y][x] !== 0) continue;
      if (x < 5 && y < 5) continue;
      out.push({ x: x * TS + TS / 2, y: y * TS + TS / 2, vx: 0, vy: 0, v: 0.55 + lvl * 0.11 + rng() * 0.2, t: Math.floor(rng() * 30), jenis: rng() < 0.3 ? 'cepat' : 'biasa' });
    }
    return out;
  }
  function padat (cx, cy) {
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true;
    return grid[cy][cx] !== 0;
  }
  function bolehDi (x, y) {
    var r = TS * 0.34;
    var sel = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
    for (var i = 0; i < sel.length; i++) {
      var cx = Math.floor(sel[i][0] / TS), cy = Math.floor(sel[i][1] / TS);
      if (padat(cx, cy)) return false;
    }
    return true;
  }
  function selBom (x, y) { return [Math.floor(x / TS), Math.floor(y / TS)]; }
  function waktuLevel (lvl) { return Math.max(50, 130 - lvl * 10); }
  function poinMusuh (lvl) { return 150 + lvl * 25; }

  function reset (lvl, pertahankan) {
    hitungOffset();
    level = lvl || 1;
    grid = buatGrid(level, level * 977 + 3);
    musuh = buatMusuh(level, level * 977);
    px = TS * 1.5; py = TS * 1.5;
    bom = []; ledak = []; arah = { x: 0, y: 0 };
    maksBom = level >= 3 ? 2 : 1;
    jangkauan = level >= 4 ? 3 : 2;
    waktuAwal = waktuLevel(level) * 60; waktu = waktuAwal;
    if (!pertahankan) { skor = 0; nyawa = 3; musuhHancur = 0; blokHancur = 0; }
    over = false; sebab = ''; runT = 0; pesan = ''; pesanT = 0;
    A.setScore(skor); A.setBest();
    A.setStatus('Level ' + level, 'Musuh ' + musuh.length); A.setProgress(1);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function pasangBom () {
    if (over) { reset(1); return; }
    if (bom.length >= maksBom) return;
    var s = selBom(px, py);
    for (var i = 0; i < bom.length; i++) if (bom[i].cx === s[0] && bom[i].cy === s[1]) return;
    bom.push({ cx: s[0], cy: s[1], t: 130 });
    A.SFX.jump();
  }
  function meledakkan (b) {
    var sel = [[b.cx, b.cy, 0]];
    var MATA = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var d = 0; d < 4; d++) {
      for (var k = 1; k <= jangkauan; k++) {
        var cx = b.cx + MATA[d][0] * k, cy = b.cy + MATA[d][1] * k;
        if (padat(cx, cy)) {
          if (cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS && grid[cy][cx] === 2) {
            grid[cy][cx] = 0; blokHancur++;
            skor += 10; A.setScore(skor);
            sel.push([cx, cy, 1]);
          }
          break;
        }
        sel.push([cx, cy, 1]);
      }
    }
    for (var i = 0; i < sel.length; i++) {
      ledak.push({ cx: sel[i][0], cy: sel[i][1], t: 22 });
      /* rantai ke bom lain */
      for (var j = 0; j < bom.length; j++) {
        if (bom[j] !== b && bom[j].cx === sel[i][0] && bom[j].cy === sel[i][1]) bom[j].t = Math.min(bom[j].t, 3);
      }
      /* kena musuh */
      for (var e = 0; e < musuh.length; e++) {
        var m = musuh[e];
        if (m.mati) continue;
        var ms = selBom(m.x, m.y);
        if (ms[0] === sel[i][0] && ms[1] === sel[i][1]) {
          m.mati = true; musuhHancur++;
          skor += poinMusuh(level); A.setScore(skor);
          if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
          A.SFX.point();
        }
      }
      /* kena pemain */
      var ps = selBom(px, py);
      if (ps[0] === sel[i][0] && ps[1] === sel[i][1]) kenaPemain('TERKENA LEDAKAN BOM SENDIRI');
    }
    A.SFX.crash();
  }
  function kenaPemain (s) {
    if (over) return;
    nyawa--;
    A.SFX.crash();
    if (nyawa <= 0) return tamat(s);
    px = TS * 1.5; py = TS * 1.5;
    bom = []; musuh = musuh.filter(function (m) { return !m.mati; });
    pesan = 'NYAWA ' + nyawa; pesanT = 70;
  }

  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    /* gerak pemain */
    var v = 2.1;
    var nx = px + arah.x * v, ny = py + arah.y * v;
    if (bolehDi(nx, py)) px = nx;
    if (bolehDi(px, ny)) py = ny;
    /* bom */
    for (var i = 0; i < bom.length; i++) {
      var b0 = bom[i];
      if (!b0) break;                 /* meledakkan() bisa mengosongkan array (kena pemain) */
      b0.t--;
      if (b0.t <= 0 && !b0.habis) { b0.habis = true; meledakkan(b0); }
    }
    bom = bom.filter(function (b) { return !b.habis; });
    for (var l = 0; l < ledak.length; l++) ledak[l].t--;
    ledak = ledak.filter(function (z) { return z.t > 0; });
    /* musuh */
    for (var e = 0; e < musuh.length; e++) {
      var m = musuh[e];
      if (m.mati) continue;
      m.t++;
      var sp = m.v * (m.jenis === 'cepat' ? 1.35 : 1);
      if (m.t % 34 === 0 || (m.vx === 0 && m.vy === 0)) {
        var pilih = [];
        if (!padat(Math.floor((m.x + TS) / TS), Math.floor(m.y / TS))) pilih.push([1, 0]);
        if (!padat(Math.floor((m.x - TS) / TS), Math.floor(m.y / TS))) pilih.push([-1, 0]);
        if (!padat(Math.floor(m.x / TS), Math.floor((m.y + TS) / TS))) pilih.push([0, 1]);
        if (!padat(Math.floor(m.x / TS), Math.floor((m.y - TS) / TS))) pilih.push([0, -1]);
        var lanjut = Math.random() < 0.65 && (m.vx || m.vy) ? [[m.vx > 0 ? 1 : m.vx < 0 ? -1 : 0, m.vy > 0 ? 1 : m.vy < 0 ? -1 : 0]] : [];
        var opsi = (lanjut.length && Math.random() < 0.65) ? lanjut : pilih;
        if (!opsi.length) opsi = pilih;
        if (opsi.length) {
          var a = opsi[(Math.random() * opsi.length) | 0];
          m.vx = a[0]; m.vy = a[1];
        }
      }
      var mx = m.x + m.vx * sp, my = m.y + m.vy * sp;
      if (bolehDiMusuh(mx, m.y)) m.x = mx; else m.vx = -m.vx;
      if (bolehDiMusuh(m.x, my)) m.y = my; else m.vy = -m.vy;
      if (Math.abs(m.x - px) < TS * 0.62 && Math.abs(m.y - py) < TS * 0.62) {
        m.mati = true;
        kenaPemain('DITABRAK MUSUH');
      }
    }
    musuh = musuh.filter(function (m) { return !m.mati; });
    /* waktu */
    waktu--;
    if (waktu <= 0) { waktu = 0; return tamat('WAKTU HABIS'); }
    /* level selesai */
    if (!musuh.length && !bom.length) {
      var bonus = 500 + Math.round(waktu / 60) * 10 + nyawa * 50;
      skor += bonus;
      A.setScore(skor);
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      A.SFX.level();
      if (level >= 8) return tamat('SEMUA LEVEL SELESAI');
      pesan = 'LEVEL ' + level + ' BERSIH +' + bonus; pesanT = 90;
      level++;
      reset(level, true);
    }
  }
  function bolehDiMusuh (x, y) {
    var r = TS * 0.3;
    return !padat(Math.floor((x - r) / TS), Math.floor((y - r) / TS)) &&
      !padat(Math.floor((x + r) / TS), Math.floor((y - r) / TS)) &&
      !padat(Math.floor((x - r) / TS), Math.floor((y + r) / TS)) &&
      !padat(Math.floor((x + r) / TS), Math.floor((y + r) / TS));
  }

  function gambar () {
    ctx.fillStyle = '#050a18'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(OX, OY);
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var v = grid[y][x];
        var rx = x * TS, ry = y * TS;
        if (v === 1) {
          ctx.fillStyle = '#233458'; ctx.fillRect(rx, ry, TS, TS);
          ctx.strokeStyle = '#3d5a92'; ctx.strokeRect(rx + 1, ry + 1, TS - 2, TS - 2);
          ctx.fillStyle = 'rgba(150,190,255,0.15)'; ctx.fillRect(rx + 3, ry + 3, TS - 6, 4);
        } else if (v === 2) {
          ctx.fillStyle = '#4a2f6b'; ctx.fillRect(rx + 2, ry + 2, TS - 4, TS - 4);
          ctx.strokeStyle = '#8b5cf6'; ctx.strokeRect(rx + 2, ry + 2, TS - 4, TS - 4);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(rx + 6, ry + 6, TS - 12, 3);
        } else {
          ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.015)';
          ctx.fillRect(rx, ry, TS, TS);
        }
      }
    }
    /* bom */
    for (var b = 0; b < bom.length; b++) {
      var bb = bom[b];
      var denyut = 1 + Math.sin(runT / 4) * 0.12;
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff3b6b';
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath(); ctx.arc(bb.cx * TS + TS / 2, bb.cy * TS + TS / 2, TS * 0.32 * denyut, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#ff3b6b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bb.cx * TS + TS / 2, bb.cy * TS + TS / 2, TS * 0.32 * denyut, 0, 6.29); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(bb.cx * TS + TS / 2, bb.cy * TS + TS / 2 - TS * 0.36, 3, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 10px monospace'; ctx.textAlign = 'center';
      ctx.fillText(Math.ceil(bb.t / 60) + '', bb.cx * TS + TS / 2, bb.cy * TS + TS / 2 + 4);
      ctx.textAlign = 'left';
    }
    /* ledakan */
    for (var l = 0; l < ledak.length; l++) {
      var z = ledak[l];
      ctx.globalAlpha = Math.min(1, z.t / 14);
      var gr = ctx.createLinearGradient(z.cx * TS, z.cy * TS, z.cx * TS + TS, z.cy * TS + TS);
      gr.addColorStop(0, '#ffd166'); gr.addColorStop(0.5, '#ff9f43'); gr.addColorStop(1, '#ff3b6b');
      ctx.fillStyle = gr;
      ctx.fillRect(z.cx * TS + 2, z.cy * TS + 2, TS - 4, TS - 4);
      ctx.globalAlpha = 1;
    }
    /* musuh */
    for (var e = 0; e < musuh.length; e++) {
      var m = musuh[e];
      ctx.shadowBlur = 10; ctx.shadowColor = m.jenis === 'cepat' ? '#00ff87' : '#ff007f';
      ctx.fillStyle = m.jenis === 'cepat' ? '#00ff87' : '#ff5ea8';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y - TS * 0.34);
      ctx.lineTo(m.x + TS * 0.32, m.y + TS * 0.1);
      ctx.lineTo(m.x + TS * 0.16, m.y + TS * 0.34);
      ctx.lineTo(m.x - TS * 0.16, m.y + TS * 0.34);
      ctx.lineTo(m.x - TS * 0.32, m.y + TS * 0.1);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0b0221';
      ctx.beginPath(); ctx.arc(m.x - 4, m.y - 2, 2.4, 0, 6.29); ctx.arc(m.x + 4, m.y - 2, 2.4, 0, 6.29); ctx.fill();
    }
    /* pemain */
    ctx.shadowBlur = 14; ctx.shadowColor = '#00f3ff';
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath(); ctx.arc(px, py, TS * 0.3, 0, 6.29); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#04121f';
    ctx.beginPath(); ctx.arc(px - 3, py - 2, 2, 0, 6.29); ctx.arc(px + 3, py - 2, 2, 0, 6.29); ctx.fill();
    ctx.restore();
    /* HUD */
    ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
    ctx.fillText('LEVEL ' + level, 12, 22);
    ctx.fillText('MUSUH ' + musuh.length, 12, 40);
    ctx.fillText('BOM ' + bom.length + '/' + maksBom + ' · JARAK ' + jangkauan, 12, 58);
    ctx.textAlign = 'right';
    ctx.fillText('NYAWA ' + nyawa, W - 12, 22);
    ctx.fillText('WAKTU ' + Math.ceil(waktu / 60) + 's', W - 12, 40);
    ctx.fillText('BLOK ' + blokHancur + ' · MUSUH ' + musuhHancur, W - 12, 58);
    ctx.textAlign = 'left';
    if (pesanT > 0) {
      ctx.fillStyle = '#ffd166'; ctx.font = '900 18px monospace'; ctx.textAlign = 'center';
      ctx.fillText(pesan, W / 2, OY - 16); ctx.textAlign = 'left';
    }
    if (over) {
      ctx.fillStyle = 'rgba(5,10,24,0.9)'; ctx.fillRect(0, H / 2 - 64, W, 128);
      ctx.strokeStyle = '#ff3b6b'; ctx.strokeRect(0, H / 2 - 64, W, 128);
      ctx.fillStyle = '#ff3b6b'; ctx.font = '900 24px monospace'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 24);
      ctx.fillStyle = '#9fe8ff'; ctx.font = '700 13px monospace';
      ctx.fillText(sebab + ' · SKOR ' + skor + ' · LEVEL ' + level, W / 2, H / 2 + 2);
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 30);
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
    A.setStatus('Level ' + level + ' · nyawa ' + nyawa, 'Musuh ' + musuh.length);
    A.setProgress(waktu / waktuAwal);
    A.state = {
      skor: skor, level: level, nyawa: nyawa, musuh: musuh.length, bom: bom.length,
      maksBom: maksBom, jangkauan: jangkauan, ledak: ledak.length, blokHancur: blokHancur,
      musuhHancur: musuhHancur, waktu: Math.ceil(waktu / 60),
      px: Math.round(px), py: Math.round(py), sel: selBom(px, py), over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { buatGrid: buatGrid, buatMusuh: buatMusuh, padat: padat, bolehDi: bolehDi, selBom: selBom, waktuLevel: waktuLevel, poinMusuh: poinMusuh, pasangBom: pasangBom, COLS: COLS, ROWS: ROWS, TS: TS };

  var tahan = { kiri: false, kanan: false, atas: false, bawah: false };
  function hitungArah () {
    arah.x = (tahan.kanan ? 1 : 0) - (tahan.kiri ? 1 : 0);
    arah.y = (tahan.bawah ? 1 : 0) - (tahan.atas ? 1 : 0);
    if (arah.x && arah.y) { arah.x *= 0.707; arah.y *= 0.707; }
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(1); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') tahan.kiri = true;
    else if (k === 'ArrowRight' || k === 'KeyD') tahan.kanan = true;
    else if (k === 'ArrowUp' || k === 'KeyW') tahan.atas = true;
    else if (k === 'ArrowDown' || k === 'KeyS') tahan.bawah = true;
    else if (k === 'Space' || k === 'Enter') pasangBom();
    hitungArah();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') tahan.kiri = false;
    else if (k === 'ArrowRight' || k === 'KeyD') tahan.kanan = false;
    else if (k === 'ArrowUp' || k === 'KeyW') tahan.atas = false;
    else if (k === 'ArrowDown' || k === 'KeyS') tahan.bawah = false;
    hitungArah();
  });
  function sentuh (e) {
    A.initAudio();
    if (over) { reset(1); return; }
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      var mx = (tt.clientX - r.left) * (W / Math.max(1, r.width)) - OX;
      var my = (tt.clientY - r.top) * (H / Math.max(1, r.height)) - OY;
      var dx = mx - px, dy = my - py;
      if (Math.abs(dx) < TS && Math.abs(dy) < TS) { pasangBom(); return; }
      tahan.kiri = dx < -TS * 0.5; tahan.kanan = dx > TS * 0.5;
      tahan.atas = dy < -TS * 0.5; tahan.bawah = dy > TS * 0.5;
      hitungArah();
    } catch (err) { pasangBom(); }
  }
  function lepas () { tahan.kiri = tahan.kanan = tahan.atas = tahan.bawah = false; hitungArah(); }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', lepas);
  c.addEventListener('mousedown', function (e) { sentuh(e); });
  c.addEventListener('mouseup', lepas);

  reset(1);
  requestAnimationFrame(loop);
`

export function bomberHtml (brand = 'THERYHANN!') {
  return shell('Bomber Neon', brand, BOMBER_JS, {
    w: 600, h: 560, maxw: 600, skin: 'neon', sub: 'ARCADE',
    hint: '▲▼◀▶ jalan (tahan untuk terus bergerak) · ● pasang bom · bom meledak 2 detik kemudian berbentuk + · hancurkan semua musuh'
  })
}

export const ARCADE7 = [
  { id: 'spiral', cmd: 'spiral', icon: '🌀', title: 'Spiral Neon', nama: 'Spiral Neon', html: spiralHtml, ratio: '520×620', w: 520, h: 620 },
  { id: 'bomber', cmd: 'bomber', icon: '💣', title: 'Bomber Neon', nama: 'Bomber Neon', html: bomberHtml, ratio: '600×560', w: 600, h: 560 }
]
