/**
 * 🎣 PANCING IKAN — timing & refleks (HTML app, skin pastel v7.6)
 * ------------------------------------------------------------------
 *  Perahu di permukaan, kail diturunkan ke laut. Ikan berenang mendatar
 *  di berbagai kedalaman; ubur-ubur mengurangi nyawa.
 *  ◀ ▶ geser perahu · ● turunkan kail / tarik kail · ▲▼ atur kedalaman
 *  saat kail menggantung. 75 detik, 3 nyawa, kombo mengalikan poin.
 *  Desain visual beda dari pastel lain: laut berlapis + gelembung naik.
 */
import { shell } from './htmlgames.js'

const FISH_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var LAUT = 150, DASAR = H - 22, WAKTU = 75 * 60, NYAWA = 3;

  var boatX, hookX, hookY, mode, bawa, ikan, gelembung, partikel;
  var skor, waktu, nyawa, combo, komboTerbaik, tangkap, level, over, sebab, runT, kedip;

  /* ---------- fungsi murni (A.debug) ---------- */
  function jenisUntuk (lvl, rng) {
    var r = (rng || Math.random)();
    var pEmas = Math.min(0.22, 0.06 + lvl * 0.02);
    var pUbur = Math.min(0.3, 0.1 + lvl * 0.03);
    if (r < pEmas) return 'emas';
    if (r < pEmas + pUbur) return 'ubur';
    return 'ikan';
  }
  function poinJenis (j) { return j === 'emas' ? 50 : j === 'ubur' ? 0 : 10; }
  function kaliKombo (n) { return 1 + Math.min(2, Math.floor(n / 3) * 0.5); }
  function radiusJenis (j) { return j === 'emas' ? 12 : j === 'ubur' ? 15 : 17; }
  function tabrak (hx, hy, o) {
    var dx = hx - o.x, dy = hy - o.y, r = o.r + 11;
    return dx * dx + dy * dy <= r * r;
  }
  function buatIkan (lvl, sisi) {
    var j = jenisUntuk(lvl), r = radiusJenis(j);
    var dariKiri = sisi === undefined ? Math.random() < 0.5 : !!sisi;
    var v = (j === 'emas' ? 2.6 : j === 'ubur' ? 0.9 : 1.5) + lvl * 0.22;
    return {
      x: dariKiri ? -30 : W + 30, y: LAUT + 40 + Math.random() * (DASAR - LAUT - 70),
      vx: dariKiri ? v : -v, r: r, jenis: j, goyang: Math.random() * 6.28,
      amp: j === 'ubur' ? 16 : 7, hidup: true
    };
  }

  /* ---------- siklus ---------- */
  function reset () {
    boatX = W / 2; hookX = boatX; hookY = LAUT - 26; mode = 0; bawa = null;
    ikan = []; gelembung = []; partikel = [];
    skor = 0; waktu = WAKTU; nyawa = NYAWA; combo = 0; komboTerbaik = 0;
    tangkap = 0; level = 1; over = false; sebab = ''; runT = 0; kedip = 0;
    for (var i = 0; i < 5; i++) ikan.push(buatIkan(1, i % 2 === 0));
    for (var g = 0; g < 14; g++) gelembung.push({ x: Math.random() * W, y: LAUT + Math.random() * (H - LAUT), r: 1 + Math.random() * 3, v: 0.25 + Math.random() * 0.6 });
    A.setScore(0); A.setBest(); A.setStatus('Nyawa 3', 'Waktu 75'); A.setProgress(1);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function letus (x, y, warna, n) {
    for (var i = 0; i < (n || 10); i++) {
      partikel.push({ x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 1, t: 26, warna: warna });
    }
  }

  function langkah () {
    runT++; waktu--;
    if (waktu <= 0) { waktu = 0; return tamat('WAKTU HABIS'); }
    level = 1 + Math.floor((WAKTU - waktu) / (12 * 60));

    /* kail */
    if (mode === 1) {
      hookY += 5.2;
      if (hookY >= DASAR) { hookY = DASAR; mode = 2; }
    } else if (mode === 2) {
      hookY -= bawa ? 3.1 : 5.6;
      if (hookY <= LAUT - 26) { hookY = LAUT - 26; mode = 0; if (bawa) setor(); }
    } else {
      hookY = LAUT - 26;
    }
    hookX += (boatX - hookX) * (mode === 0 ? 0.4 : 0.08);

    /* ikan */
    for (var i = 0; i < ikan.length; i++) {
      var o = ikan[i];
      if (bawa === o) { o.x = hookX; o.y = hookY + 12; continue; }
      o.x += o.vx; o.goyang += 0.09; o.y += Math.sin(o.goyang) * (o.jenis === 'ubur' ? 0.7 : 0.25);
      if (o.y < LAUT + 24) o.y = LAUT + 24;
      if (o.y > DASAR - 6) o.y = DASAR - 6;
      if (mode === 1 && tabrak(hookX, hookY, o)) kena(o);
    }
    ikan = ikan.filter(function (o) { return o.hidup && o.x > -60 && o.x < W + 60; });
    if (ikan.length < 4 + Math.min(5, level) && runT % 26 === 0) ikan.push(buatIkan(level));

    /* gelembung & partikel */
    for (var b = 0; b < gelembung.length; b++) {
      gelembung[b].y -= gelembung[b].v;
      if (gelembung[b].y < LAUT) { gelembung[b].y = DASAR; gelembung[b].x = Math.random() * W; }
    }
    for (var p = 0; p < partikel.length; p++) {
      var q = partikel[p]; q.x += q.vx; q.y += q.vy; q.vy += 0.12; q.t--;
    }
    partikel = partikel.filter(function (q) { return q.t > 0; });
    if (kedip > 0) kedip--;
  }

  function kena (o) {
    o.hidup = false;
    if (o.jenis === 'ubur') {
      nyawa--; combo = 0; kedip = 24; A.SFX.crash();
      letus(o.x, o.y, '#b28dff', 14);
      mode = 2; bawa = null;
      if (nyawa <= 0) tamat('TERSUNGAT UBUR-UBUR');
      return;
    }
    bawa = o; mode = 2; A.SFX.point();
    letus(o.x, o.y, o.jenis === 'emas' ? '#ffd166' : '#7fd8ff', 10);
  }
  function setor () {
    var o = bawa; bawa = null;
    if (!o) return;
    combo++; if (combo > komboTerbaik) komboTerbaik = combo;
    var tambah = Math.round(poinJenis(o.jenis) * kaliKombo(combo));
    skor += tambah; tangkap++;
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    letus(hookX, LAUT - 30, '#ffb7c5', 8);
    if (combo > 0 && combo % 3 === 0) A.SFX.level();
  }

  /* ---------- gambar ---------- */
  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff4e0'); g.addColorStop(0.18, '#ffe3ec');
    g.addColorStop(0.3, '#bde7ff'); g.addColorStop(1, '#8fd3f4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* matahari + awan */
    ctx.fillStyle = '#fff0b8'; ctx.beginPath(); ctx.arc(W - 62, 52, 26, 0, 6.29); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var a = 0; a < 3; a++) { ctx.beginPath(); ctx.arc(70 + a * 26, 46, 15 - a * 2, 0, 6.29); ctx.fill(); }

    /* permukaan laut bergelombang */
    ctx.fillStyle = '#bde7ff';
    ctx.beginPath(); ctx.moveTo(0, LAUT);
    for (var x = 0; x <= W; x += 14) ctx.lineTo(x, LAUT + Math.sin((x + runT * 2) / 42) * 5);
    ctx.lineTo(W, LAUT + 18); ctx.lineTo(0, LAUT + 18); ctx.closePath(); ctx.fill();

    /* pasir dasar */
    ctx.fillStyle = '#ffe6c7'; ctx.fillRect(0, DASAR, W, H - DASAR);
    ctx.fillStyle = '#f6c99a';
    for (var s = 0; s < 9; s++) { ctx.beginPath(); ctx.arc(20 + s * 58, DASAR + 9 + (s % 2) * 5, 4, 0, 6.29); ctx.fill(); }

    /* gelembung */
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    for (var b = 0; b < gelembung.length; b++) {
      var q = gelembung[b]; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.29); ctx.stroke();
    }

    /* rumput laut */
    ctx.strokeStyle = '#9be3a8'; ctx.lineWidth = 5;
    for (var r = 0; r < 6; r++) {
      var rx = 40 + r * 78;
      ctx.beginPath(); ctx.moveTo(rx, DASAR);
      ctx.quadraticCurveTo(rx + Math.sin(runT / 30 + r) * 12, DASAR - 26, rx + Math.sin(runT / 22 + r) * 18, DASAR - 46);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    /* ikan */
    for (var i = 0; i < ikan.length; i++) gambarIkan(ikan[i]);

    /* perahu */
    ctx.fillStyle = '#ff9fb2';
    ctx.beginPath();
    ctx.moveTo(boatX - 44, LAUT - 26); ctx.lineTo(boatX + 44, LAUT - 26);
    ctx.lineTo(boatX + 30, LAUT - 2); ctx.lineTo(boatX - 30, LAUT - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(boatX - 12, LAUT - 52, 24, 26);
    ctx.strokeStyle = '#c98ba0'; ctx.beginPath(); ctx.moveTo(boatX, LAUT - 26); ctx.lineTo(boatX, LAUT - 74); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.beginPath();
    ctx.moveTo(boatX, LAUT - 74); ctx.lineTo(boatX + 26, LAUT - 66); ctx.lineTo(boatX, LAUT - 58); ctx.closePath(); ctx.fill();

    /* tali + kail */
    ctx.strokeStyle = '#8a6d5a'; ctx.beginPath(); ctx.moveTo(hookX, LAUT - 26); ctx.lineTo(hookX, hookY); ctx.stroke();
    ctx.strokeStyle = '#6b5648'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hookX, hookY + 5, 7, Math.PI * 0.1, Math.PI * 1.5); ctx.stroke();
    ctx.lineWidth = 1;

    /* partikel */
    for (var p = 0; p < partikel.length; p++) {
      var z = partikel[p]; ctx.globalAlpha = Math.max(0, z.t / 26);
      ctx.fillStyle = z.warna; ctx.fillRect(z.x - 2, z.y - 2, 4, 4); ctx.globalAlpha = 1;
    }

    /* kilat merah saat kena ubur-ubur */
    if (kedip > 0 && kedip % 8 < 4) { ctx.fillStyle = 'rgba(255,90,120,0.18)'; ctx.fillRect(0, 0, W, H); }

    /* HUD dalam kanvas */
    ctx.font = '900 15px "Comic Sans MS", "Segoe UI", sans-serif';
    ctx.fillStyle = '#7a5c6b';
    ctx.fillText('⏱ ' + Math.ceil(waktu / 60) + 's', 14, 26);
    ctx.fillText('❤ ' + nyawa, 14, 48);
    ctx.fillText('🐟 ' + tangkap, 100, 26);
    if (combo > 1) { ctx.fillStyle = '#ff7aa2'; ctx.fillText('KOMBO ×' + kaliKombo(combo).toFixed(1) + ' (' + combo + ')', 100, 48); }
    ctx.fillStyle = '#7a5c6b';
    ctx.fillText('Level ' + level, W - 86, 26);
    if (over) {
      ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.fillRect(0, H / 2 - 74, W, 148);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a';
      ctx.font = '900 30px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.fillText('SELESAI!', W / 2, H / 2 - 26);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 16px "Comic Sans MS", "Segoe UI", sans-serif';
      ctx.fillText(sebab + ' · skor ' + skor + ' · ikan ' + tangkap, W / 2, H / 2 + 4);
      ctx.fillText('kombo terbaik ' + komboTerbaik, W / 2, H / 2 + 30);
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 60);
      ctx.textAlign = 'left';
    }
  }

  function gambarIkan (o) {
    ctx.save(); ctx.translate(o.x, o.y);
    if (o.vx < 0) ctx.scale(-1, 1);
    if (o.jenis === 'ubur') {
      ctx.fillStyle = '#c9a7ff';
      ctx.beginPath(); ctx.arc(0, 0, o.r, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#b28dff';
      for (var t = -2; t <= 2; t++) {
        ctx.beginPath(); ctx.moveTo(t * 5, 0);
        ctx.quadraticCurveTo(t * 5 + Math.sin(runT / 12 + t) * 5, 12, t * 5, 22); ctx.stroke();
      }
      ctx.fillStyle = '#5b3f7a'; ctx.beginPath(); ctx.arc(-4, -5, 2, 0, 6.29); ctx.arc(4, -5, 2, 0, 6.29); ctx.fill();
    } else {
      ctx.fillStyle = o.jenis === 'emas' ? '#ffd166' : '#ff9fb2';
      ctx.beginPath(); ctx.ellipse(0, 0, o.r + 4, o.r, 0, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-o.r - 2, 0); ctx.lineTo(-o.r - 14, -8); ctx.lineTo(-o.r - 14, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -3, 4, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#4a3b45'; ctx.beginPath(); ctx.arc(7, -3, 2, 0, 6.29); ctx.fill();
      if (o.jenis === 'emas') {
        ctx.fillStyle = '#fff3c4'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.fillText('★', -4, 14);
      }
    }
    ctx.restore();
  }

  /* ---------- loop ---------- */
  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    if (!over) { for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Nyawa ' + nyawa + (bawa ? ' · 🎣 ' + bawa.jenis : ''), 'Waktu ' + Math.ceil(waktu / 60));
    A.setProgress(waktu / WAKTU);
    A.state = {
      skor: skor, waktu: Math.ceil(waktu / 60), nyawa: nyawa, tangkap: tangkap, combo: combo,
      komboTerbaik: komboTerbaik, level: level, mode: mode, bawa: bawa ? bawa.jenis : null,
      hookX: Math.round(hookX), hookY: Math.round(hookY), boatX: Math.round(boatX),
      jumlahIkan: ikan.length, over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { jenisUntuk: jenisUntuk, poinJenis: poinJenis, kaliKombo: kaliKombo, radiusJenis: radiusJenis, tabrak: tabrak, buatIkan: buatIkan, LAUT: LAUT, DASAR: DASAR, WAKTU: WAKTU };

  /* ---------- input ---------- */
  function geser (dx) {
    if (over) { reset(); return; }
    boatX = Math.max(46, Math.min(W - 46, boatX + dx * 26));
    if (mode === 0) hookX = boatX;
  }
  function dalam () {
    if (over) { reset(); return; }
    if (mode === 0) { mode = 1; A.SFX.jump(); }
    else if (mode === 1) { mode = 2; }
  }
  function kedalaman (dy) {
    if (over || mode !== 1) return;
    hookY = Math.max(LAUT + 8, Math.min(DASAR, hookY + dy * 18));
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') geser(-1);
    else if (k === 'ArrowRight' || k === 'KeyD') geser(1);
    else if (k === 'ArrowUp' || k === 'KeyW') kedalaman(-1);
    else if (k === 'ArrowDown' || k === 'KeyS') kedalaman(1);
    else if (k === 'Space' || k === 'Enter') dalam();
  });

  function sentuh (e) {
    A.initAudio();
    if (over) { reset(); return; }
    var px = null;
    try {
      var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, width: W };
      px = (t.clientX - r.left) * (W / Math.max(1, r.width));
    } catch (err) { px = null; }
    if (px === null) { dalam(); return; }
    if (Math.abs(px - boatX) > 8) geser(px > boatX ? 1 : -1); else dalam();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function fishingHtml (brand = 'THERYHANN!') {
  return shell('Pancing Ikan', brand, FISH_JS, {
    w: 500, h: 640, maxw: 480, skin: 'pastel', sub: 'PASTEL',
    hint: '◀ ▶ geser perahu  ·  ● turunkan / tarik kail  ·  ▲▼ atur kedalaman  ·  🐟 +10 · ⭐ emas +50 · 🪼 ubur-ubur -1 nyawa'
  })
}

export const PASTEL6 = [
  { id: 'pancing', cmd: 'pancing', icon: '🎣', title: 'Pancing Ikan', nama: 'Pancing Ikan', html: fishingHtml, ratio: '500×640', w: 500, h: 640 }
]
