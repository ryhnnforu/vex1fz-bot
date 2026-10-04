/**
 * ============================================================
 *  lib/htmlgames10.js — FRUIT NINJA (v7.8.0)
 * ------------------------------------------------------------
 *  Buah melempar dari bawah, iris sebanyak-banyaknya sebelum
 *  jatuh. Sama pola dengan koleksi game lain:
 *    • tap = iris di titik itu (jejak pedang) · ● = iris di kursor
 *    • ▲▼◀▶ menggerakkan kursor slicing juga (style D-pad biasa)
 *    • 3× nyawa (buah jatuh = −1, bom = langsung −1 nyawa & ledakan)
 *    • combo multi-iris pada momen sama = ×2/×3 · level makin cepat
 *  Kanvas 640×820 (portrait jumbo, rasio unik).
 * ============================================================
 */
import { shell } from './htmlgames.js'

const FN_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 640, H = 820;
  var GRAV = 0.115;

  var BUAH_NAMA = ['#ff4d6d', '#ff9f1c', '#ffe819', '#f2cc8f', '#6cc573', '#a0665b'];
  var TIPE = [
    { ico: '🍎', nama: 'apel', skor: 15, r: 26 },
    { ico: '🍊', nama: 'jeruk', skor: 14, r: 25 },
    { ico: '🍉', nama: 'semangka', skor: 20, r: 32 },
    { ico: '🍌', nama: 'pisang', skor: 13, r: 24 },
    { ico: '🥝', nama: 'kiwi', skor: 17, r: 23 },
    { ico: '🥥', nama: 'kelapa', skor: 18, r: 27 },
    { ico: '🍓', nama: 'stroberi', skor: 22, r: 20 }
  ];

  var buah = [], partikel = [], jejak = [], combo = [];
  var spawnT = 0, spawnInterval = 95;
  var skor = 0, nyawa = 3, level = 1, bunuhKombat = 0, slichan = 0;
  var over = false, kursorX = W / 2, kursorY = H - 180, pedangT = 0;
  var keys = { up: false, down: false, left: false, right: false, act: false };
  var intro = 36, kecepatanStok = 1;

  function laju () { return (1 + (level - 1) * 0.16) * kecepatanStok }

  function spawnBuah () {
    var n = 1 + (Math.random() < 0.30 + level * 0.03 ? 1 : 0) + (Math.random() < level * 0.04 ? 1 : 0);
    for (var i = 0; i < n; i++) {
      var bom = Math.random() < Math.min(0.20, 0.06 + level * 0.011);
      var t = TIPE[Math.floor(Math.random() * (bom ? 1 : TIPE.length))];
      var x = 60 + Math.random() * (W - 120);
      var vx = (Math.random() - 0.5) * 3.2 * laju();
      var vy = -(12.5 + Math.random() * 4.5) * laju();
      buah.push({ x: x, y: H + 40, vx: vx, vy: vy, tipe: t, bom: bom, iris: 0, rot: (Math.random() - 0.5) * 0.2 });
    }
    spawnInterval = Math.max(38, Math.round(95 - level * 3));
  }

  function ledakan (x, y, w, n, r) {
    for (var i = 0; i < n; i++) {
      partikel.push({ x: x, y: y, vx: A.rand(-r, r), vy: A.rand(-r * 1.2, 0.4), a: 1, r: A.rand(2, 5), w: w });
    }
  }

  function irisDi (cx, cy) {
    if (over) return 0;
    var nIris = 0, ij = [];
    for (var i = buah.length - 1; i >= 0; i--) {
      var b = buah[i];
      var d2 = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy);
      var jangkau = b.tipe.r + 26;
      if (d2 <= jangkau * jangkau) {
        /* iris! */
        nIris++;
        combo.push({ x: b.x, y: b.y, w: b.bom ? '#f43f30' : b.tipe.skor >= 18 ? '#fde047' : '#ffffff' });
        ledakan(b.x, b.y, '#ff4d6d', 14, 5.5);
        ledakan(b.x, b.y, '#a3e635', 10, 3.5);
        buah.splice(i, 1);
        if (b.bom) {
          nyawa -= 1;
          ledakan(cx, cy, '#f43f30', 40, 10);
          jejak.push({ x1: cx - 90 * (Math.random() < 0.5 ? -1 : 1), y1: cy, x2: cx + 90, y2: cy, t: 0, boom: true });
          A.SFX.crash();
          if (nyawa <= 0) {
            over = true;
            A.saveBest(skor);
            A.SFX.crash();
          }
        } else {
          var nilai = b.tipe.skor;
          skor += nilai;
          slichan++;
          if (nIris >= 3) {
            /* combo multi-iris: moment sama → nilai bonus ×(nIris-1) */
            var bonus = Math.round(nilai * (nIris - 1) * 0.5);
            skor += bonus;
            partikel.push({ teks: 'KOMBO x' + nIris + ' +' + bonus, x: cx, y: cy - 30, vy: -0.9, a: 1, t: 0, w: '#fde047', font: true });
            A.SFX.level();
          } else {
            A.SFX.point();
          }
        }
      }
    }
    if (nIris > 0) {
      jejak.push({ x1: cx - 90 * (Math.random() < 0.5 ? -1 : 1), y1: cy, x2: cx + 90, y2: cy, t: 0, boom: false });
      return nIris;
    }
    return 0;
  }

  function baru () {
    buah = []; partikel = []; jejak = []; combo = [];
    skor = 0; nyawa = 3; level = 1; bunuhKombat = 0; slichan = 0;
    over = false; spawnT = 0; spawnInterval = 95;
    A.setScore(0); A.setBest();
  }

  /* keyboard / D-pad */
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
    if ((k === 'Space' || k === 'Enter') && !over) irisDi(kursorX, kursorY);
  });
  window.addEventListener('keyup', function (e) { setKey(e.code, false) });

  function ketuk (px, py) {
    if (over) { baru(); return }
    A.initAudio();
    if (py > H - 90 && px > W / 2 - 70) {
      /* zona restart saja semi-transparan */
      return;
    }
    irisDi(px, py);
  }

  var last = 0, runT = 0;
  function update (dt) {
    runT += dt;

    /* kursor slicing: D-pad menggerakkan crosshair slicing */
    var spd = 7.6;
    if (keys.left) kursorX = Math.max(40, kursorX - spd);
    if (keys.right) kursorX = Math.min(W - 40, kursorX + spd);
    if (keys.up) kursorY = Math.max(80, kursorY - spd);
    if (keys.down) kursorY = Math.min(H - 120, kursorY + spd);
    if (keys.act) pedangT += dt;
    else pedangT = 0;

    /* spawn */
    spawnT += dt;
    if (spawnT >= spawnInterval && !over) {
      spawnT = 0;
      spawnBuah();
    }

    /* level naik per 12 iris */
    var levelBaru = 1 + Math.floor(slichan / 12);
    if (levelBaru > level) {
      level = levelBaru;
      A.SFX.level();
      partikel.push({ teks: 'LEVEL ' + level, x: W / 2, y: H / 2 - 40, vy: -0.5, a: 1, t: 0, w: '#22d3ee', font: true, besar: true });
    }

    /* update buah */
    for (var i = buah.length - 1; i >= 0; i--) {
      var b = buah[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.vy += GRAV * laju() * dt;
      if (b.x < 40 || b.x > W - 40) b.vx *= -0.97;
      if (b.y > H + 46 && b.vy > 0) {
        /* buah yang jatuh tanpa di-iris */
        buah.splice(i, 1);
        if (!b.bom) {
          nyawa -= 1;
          A.SFX.crash();
          if (nyawa <= 0) {
            over = true;
            A.saveBest(skor);
          }
        }
        continue;
      }
    }

    /* partikel */
    for (var pi = partikel.length - 1; pi >= 0; pi--) {
      var q = partikel[pi];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.16 * dt; q.a -= 0.016 * dt;
      if (q.a <= 0) partikel.splice(pi, 1);
    }
    for (var ji = jejak.length - 1; ji >= 0; ji--) {
      jejak[ji].t += dt;
      if (jejak[ji].t > 14) jejak.splice(ji, 1);
    }
    for (var ci = combo.length - 1; ci >= 0; ci--) {
      combo[ci].t += dt || 1;
      if (combo[ci].t > 6) combo.splice(ci, 1);
    }

    A.setScore(skor);
    if (skor > A.best) A.best = skor;
    A.setProgress(Math.min(1, slichan / 60));
    A.setStatus(!over ? (nyawa + ' nyawa · Lv.' + level) : 'GAME OVER', spawnInterval + 'f spawn');
    A.state = {
      buah: buah.length, skor: skor, nyawa: nyawa, level: level, slichan: slichan,
      over: over, comboKeys: combo.length, kursorX: kursorX, kursorY: kursorY,
      keys: { up: keys.up, down: keys.down, left: keys.left, right: keys.right, act: keys.act }
    }
  }

  /* ---------- gambar ---------- */
  function teks (t, x, y, sz, ws, gaya, rata) {
    ctx.fillStyle = ws;
    ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    /* langit sunset-hier niijjat */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1b0f2e'); bg.addColorStop(0.5, '#22123a'); bg.addColorStop(1, '#12081d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* bintang tapak ringan */
    for (var st2 = 0; st2 < 6; st2++) {
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(runT * 0.05 + st2);
      ctx.fillStyle = '#a3e635';
      ctx.beginPath(); ctx.arc(60 + st2 * 106, 90 + (st2 % 2) * 40, 3 + (st2 % 3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* header */
    teks('FRUIT NINJA', 24, 40, 30, '#a3e635', '900');
    teks('iris buah · LEFT/RIGHT/UP/DOWN D-pad untuk kursor · ● iris di kursor / tap = iris langsung', W - 24, 38, 12.5, '#8b93a8', '600', 'right');
    teks('kombo ≥ 3 momen → bonus besar', W - 24, 58, 12, '#fde047', '700', 'right');

    /* HUD skor & best dan nyawa */
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(24, 80, 172, 62);
    teks('SKOR', 108, 96, 12, '#8b93a8', '800', 'center');
    teks(String(skor), 108, 122, 26, '#ffffff', '900', 'center');
    var best = Math.max(A.best || 0, skor);
    teks('TERBAIK ' + best, 108, 140, 11, '#8b93a8', '700', 'center');
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(W - 24 - 172, 80, 172, 62);
    teks('NYAWA', W - 24 - 86, 96, 12, '#8b93a8', '800', 'center');
    teks('♥'.repeat(Math.max(0, nyawa)) + '♡'.repeat(Math.max(0, 3 - nyawa)), W - 24 - 86, 122, 22, '#f5455c', '900', 'center');

    /* buah */
    for (var i = 0; i < buah.length; i++) {
      var b = buah[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot * Math.sin(runT * 0.09 + b.vx));
      var basa = b.bom ? 260 : 200;
      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath(); ctx.arc(0, 0, b.tipe.r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.font = (b.tipe.r * 2) + 'px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.bom ? '💣' : b.tipe.ico, 0, 2);
      if (b.bom) {
        ctx.strokeStyle = '#f43f30'; ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* jejak pedang */
    for (var ji = 0; ji < jejak.length; ji++) {
      var j = jejak[ji];
      var alfaS = Math.max(0, 1 - j.t / 14);
      ctx.globalAlpha = alfaS;
      ctx.strokeStyle = j.boom ? '#f43f30' : '#ffffff';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(j.x1, j.y1); ctx.lineTo(j.x2, j.y2); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = j.boom ? '#ffe66d' : '#22d3ee';
      ctx.beginPath(); ctx.moveTo(j.x1, j.y1); ctx.lineTo(j.x2, j.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* gerakan back nerosiaf untuk kursor */
    ctx.strokeStyle = 'rgba(34,211,238,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(kursorX, kursorY, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(kursorX - 32, kursorY); ctx.lineTo(kursorX - 12, kursorY);
    ctx.moveTo(kursorX + 12, kursorY); ctx.lineTo(kursorX + 32, kursorY);
    ctx.moveTo(kursorX, kursorY - 32); ctx.lineTo(kursorX, kursorY - 12);
    ctx.moveTo(kursorX, kursorY + 12); ctx.lineTo(kursorX, kursorY + 32);
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(kursorX, kursorY, 5, 0, Math.PI * 2); ctx.fill();
    teks('● di kursor · tap di buah', W / 2, kursorY - 46, 11, '#8b93a8', '600', 'center');

    /* partikel teks alert */
    for (var pi = 0; pi < partikel.length; pi++) {
      var q = partikel[pi];
      ctx.globalAlpha = Math.max(0, q.a);
      if (q.font) {
        ctx.fillStyle = q.w;
        ctx.font = '900 30px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(q.teks, q.x, q.y);
      } else {
        ctx.fillStyle = q.w;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    /* kaki kontrol */
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, H - 66, W, 66);
    teks('▲▼◀▶ gerakin kursor slicing · ●/Enter iris area crosshair nya · tap = iris langsung di titik itu', W / 2, H - 42, 13.5, '#b3c8ff', '600', 'center');
    teks('bom hitam hilang nyawa 1 · 💣 bukan buah!', W / 2, H - 20, 12, '#f58a9e', '600', 'center');

    if (over) {
      ctx.fillStyle = 'rgba(10,6,18,0.86)'; ctx.fillRect(0, 0, W, H);
      teks('GAME OVER', W / 2, H / 2 - 60, 44, '#f5455c', '900', 'center');
      teks('skor kamu: ' + skor + ' · iris: ' + slichan + ' buah', W / 2, H / 2 - 10, 20, '#ffffff', '800', 'center');
      teks('terbaik: ' + Math.max(A.best || 0, skor) + ' · level: ' + level, W / 2, H / 2 + 24, 13, '#8b93a8', '600', 'center');
      teks('ketuk untuk main lagi', W / 2, H / 2 + 64, 15, '#a3e635', '700', 'center');
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
  A.debug = { buahOf: function () { return buah.slice() }, ketuk: ketuk, irisDi: irisDi, spawnBuah: spawnBuah, setKursor: function (x, y) { kursorX = x; kursorY = y }, baru: baru };
  requestAnimationFrame(loop);
`

/** kartu .fruitninja */
export function fruitninjaHtml (brand = 'THERYHANN!') {
  return shell('Fruit Ninja', brand, FN_JS, {
    w: 640, h: 820, maxw: 600, sub: 'ARCADE',
    hint: '▲▼◀▶ gerakin kursor slicing · ● iris di crosshair · tap sembarang = iris di titiknya · 💣 hindari bom · 3 nyawa'
  })
}

export const DAFTAR_GAMES10 = [
  { id: 'fruitninja', title: 'Fruit Ninja', html: fruitninjaHtml, ratio: '640×820 (portrait)' }
]

export default { fruitninjaHtml, DAFTAR_GAMES10 }
