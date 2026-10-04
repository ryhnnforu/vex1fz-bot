/**
 * ============================================================
 *  lib/htmlgames12.js — 4 GAME "RUPA ASLI" batch 2 (v7.9.0)
 * ------------------------------------------------------------
 *  • Candy Crush  — papan 8×8 permen warna-warni (kacang, jelly,
 *                   lollipop), match-3, permen bergaris & bom warna,
 *                   target skor per level, gerakan terbatas.
 *                   Pad: ▲▼◀▶ pindah kursor · ● pilih/tukar.
 *  • Temple Run   — lari di lorong kuil batu, belok kiri/kanan di
 *                   tikungan, lompat akar, geser bawah api, monyet
 *                   iblis mengejar. Pad: ◀▶ belok/geser · ▲ lompat ·
 *                   ▼ slide · ● miring (pindah sisi).
 *  • Angry Birds  — ketapel, burung merah/kuning/hitam, babi hijau,
 *                   balok kayu/es/batu dengan fisika sederhana.
 *                   Pad: ◀▶ sudut · ▲▼ tenaga · ● tembak / kekuatan.
 *  • Super Jump   — platformer ala Mario: bata, koin, kura-kura,
 *                   jamur, pipa hijau, bendera akhir.
 *                   Pad: ◀▶ jalan · ▲ / ● lompat · ▼ jongkok.
 * ============================================================
 */
import { nekoParkHtml } from './nekopark.js'
import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  CANDY CRUSH                                                         */
/* ------------------------------------------------------------------ */
const CANDY_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height, N = 8, TOP = 118, CELL = Math.floor((W - 24) / N), OX = Math.floor((W - CELL * N) / 2);
  var WARNA = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
  var grid, cur, sel, skor, gerak, level, target, anim, over, menang, jatuhT, kombo, pesan, pesanT, partikel;
  function reset () {
    level = 1; skor = 0; mulaiLevel();
  }
  function mulaiLevel () {
    gerak = 18 + level * 2; target = 1500 * level + (level - 1) * 800; over = false; menang = false; kombo = 0; partikel = [];
    cur = { x: 3, y: 4 }; sel = null; anim = []; jatuhT = 0; pesan = 'LEVEL ' + level; pesanT = 90;
    do { grid = []; for (var y = 0; y < N; y++) { grid[y] = []; for (var x = 0; x < N; x++) grid[y][x] = { w: Math.floor(Math.random() * 6), t: 0 }; } hapusAwal(); } while (!adaLangkah());
    A.setScore(skor); A.setBest(); A.setStatus('Level ' + level, 'Target ' + target); A.setProgress(0);
  }
  function hapusAwal () { var ada = true; while (ada) { ada = false; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { if (x >= 2 && grid[y][x].w === grid[y][x - 1].w && grid[y][x].w === grid[y][x - 2].w) { grid[y][x].w = (grid[y][x].w + 1) % 6; ada = true; } if (y >= 2 && grid[y][x].w === grid[y - 1][x].w && grid[y][x].w === grid[y - 2][x].w) { grid[y][x].w = (grid[y][x].w + 1) % 6; ada = true; } } } }
  function cocok () {
    var hit = [];
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) hit.push(false);
    var m = false;
    for (var y = 0; y < N; y++) { var x = 0; while (x < N) { var w = grid[y][x] && grid[y][x].w, len = 1; while (x + len < N && grid[y][x + len] && grid[y][x + len].w === w && w >= 0) len++; if (len >= 3 && w >= 0) { m = true; for (var k = 0; k < len; k++) { hit[y * N + x + k] = true; if (len >= 4 && k === 0) grid[y][x].bikin = len >= 5 ? 'bom' : 'garisH'; } } x += len; } }
    for (var x = 0; x < N; x++) { var y = 0; while (y < N) { var w = grid[y][x] && grid[y][x].w, len = 1; while (y + len < N && grid[y + len][x] && grid[y + len][x].w === w && w >= 0) len++; if (len >= 3 && w >= 0) { m = true; for (var k = 0; k < len; k++) { hit[(y + k) * N + x] = true; if (len >= 4 && k === 0) grid[y][x].bikin = len >= 5 ? 'bom' : 'garisV'; } } y += len; } }
    return m ? hit : null;
  }
  function ledakSpesial (x, y, hit) {
    var g = grid[y][x]; if (!g || !g.t) return;
    if (g.t === 'garisH') for (var i = 0; i < N; i++) hit[y * N + i] = true;
    else if (g.t === 'garisV') for (var i = 0; i < N; i++) hit[i * N + x] = true;
    else if (g.t === 'bom') { var w = g.w; for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) if (grid[yy][xx].w === w) hit[yy * N + xx] = true; }
    else if (g.t === 'bungkus') for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (grid[y + dy] && grid[y + dy][x + dx]) hit[(y + dy) * N + x + dx] = true;
  }
  function selesaikan () {
    var hit = cocok(); if (!hit) return false;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (hit[y * N + x]) ledakSpesial(x, y, hit);
    var n = 0;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (hit[y * N + x]) {
      n++; pecah(x, y, WARNA[grid[y][x].w]);
      if (grid[y][x].bikin) { grid[y][x] = { w: grid[y][x].w, t: grid[y][x].bikin === 'bom' ? 'bom' : grid[y][x].bikin, baru: true }; if (grid[y][x].t === 'bom') grid[y][x].w = -1; }
      else grid[y][x] = null;
    }
    kombo++; var poin = n * 60 * kombo; skor += poin; A.setScore(skor); A.SFX.point();
    if (kombo >= 2) { pesan = ['Sweet!', 'Tasty!', 'Delicious!', 'Divine!'][Math.min(3, kombo - 2)]; pesanT = 50; }
    jatuh(); return true;
  }
  function jatuh () {
    for (var x = 0; x < N; x++) { var tulis = N - 1; for (var y = N - 1; y >= 0; y--) if (grid[y][x]) { grid[tulis][x] = grid[y][x]; if (tulis !== y) grid[tulis][x].dy = (tulis - y); tulis--; } for (var y2 = tulis; y2 >= 0; y2--) grid[y2][x] = { w: Math.floor(Math.random() * 6), t: 0, dy: tulis + 1 }; }
    jatuhT = 14;
  }
  function adaLangkah () {
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { if (x < N - 1 && cobaTukar(x, y, x + 1, y)) return true; if (y < N - 1 && cobaTukar(x, y, x, y + 1)) return true; }
    return false;
  }
  function cobaTukar (x1, y1, x2, y2) { var t = grid[y1][x1]; grid[y1][x1] = grid[y2][x2]; grid[y2][x2] = t; var r = !!cocok(); t = grid[y1][x1]; grid[y1][x1] = grid[y2][x2]; grid[y2][x2] = t; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) delete grid[y][x].bikin; return r; }
  function tukar (a, b) {
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) return false;
    var ga = grid[a.y][a.x], gb = grid[b.y][b.x];
    var t = ga; grid[a.y][a.x] = gb; grid[b.y][b.x] = t;
    if (ga.t === 'bom' || gb.t === 'bom') { var w = ga.t === 'bom' ? gb.w : ga.w; var hit = []; for (var i = 0; i < N * N; i++) hit.push(false); for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (grid[y][x].w === w || grid[y][x].t === 'bom') hit[y * N + x] = true; var n = 0; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (hit[y * N + x]) { n++; pecah(x, y, WARNA[Math.max(0, grid[y][x].w)]); grid[y][x] = null; } skor += n * 120; A.setScore(skor); A.SFX.level(); jatuh(); gerak--; return true; }
    if (!cocok()) { t = grid[a.y][a.x]; grid[a.y][a.x] = grid[b.y][b.x]; grid[b.y][b.x] = t; A.SFX.crash(); return false; }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) delete grid[y][x].bikin;
    gerak--; kombo = 0; selesaikan(); return true;
  }
  function pecah (x, y, w) { var cx = OX + x * CELL + CELL / 2, cy = TOP + y * CELL + CELL / 2; for (var i = 0; i < 6; i++) partikel.push({ x: cx, y: cy, vx: A.rand(-3, 3), vy: A.rand(-4, 0), a: 1, w: w }); }
  function cekAkhir () {
    if (skor >= target && !menang) { menang = true; over = true; pesan = 'LEVEL SELESAI!'; pesanT = 120; A.SFX.level(); A.setStatus('Level ' + level + ' selesai', 'skor ' + skor); return; }
    if (gerak <= 0 && !over) { over = true; pesan = 'GERAKAN HABIS'; pesanT = 999; A.SFX.crash(); if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); } A.setStatus('GAME OVER', 'skor ' + skor); }
    if (!over && !adaLangkah()) { pesan = 'Tidak ada langkah — acak ulang'; pesanT = 80; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) grid[y][x] = { w: Math.floor(Math.random() * 6), t: 0 }; hapusAwal(); }
  }
  function update () {
    if (pesanT > 0) pesanT--;
    if (jatuhT > 0) { jatuhT--; if (jatuhT === 0) { for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) delete grid[y][x].dy; if (!selesaikan()) { kombo = 0; cekAkhir(); } } }
    for (var p = partikel.length - 1; p >= 0; p--) { var q = partikel[p]; q.x += q.vx; q.y += q.vy; q.vy += 0.25; q.a -= 0.04; if (q.a <= 0) partikel.splice(p, 1); }
    A.setProgress(Math.min(1, skor / target));
  }
  function permen (x, y, g, r) {
    if (!g) return;
    var w = g.w >= 0 ? WARNA[g.w] : '#3e2723';
    ctx.save(); ctx.translate(x, y);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    if (g.t === 'bom') { ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; for (var i = 0; i < 8; i++) { ctx.fillStyle = WARNA[i % 6]; ctx.beginPath(); ctx.arc(Math.cos(i / 8 * Math.PI * 2) * r * 0.55, Math.sin(i / 8 * Math.PI * 2) * r * 0.55, r * 0.16, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); return; }
    var bentuk = g.w;
    ctx.fillStyle = w;
    if (bentuk === 0) { ctx.beginPath(); ctx.moveTo(0, -r); ctx.bezierCurveTo(r, -r, r, r * 0.2, 0, r); ctx.bezierCurveTo(-r, r * 0.2, -r, -r, 0, -r); ctx.fill(); }               /* jelly bean merah */
    else if (bentuk === 1) { ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2); ctx.fill(); }                                                                     /* lozenge oranye */
    else if (bentuk === 2) { ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * 0.8); ctx.lineTo(r, 0); ctx.lineTo(0, r * 0.8); ctx.closePath(); ctx.fill(); }              /* drop kuning */
    else if (bentuk === 3) { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.95, r * 0.6); ctx.lineTo(-r * 0.95, r * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-r * 0.6, r * 0.1, r * 1.2, r * 0.18); } /* gumdrop hijau */
    else if (bentuk === 4) { ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = w; ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill(); } /* lollipop biru */
    else { ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.35, r * 0.2, -0.6, 0, Math.PI * 2); ctx.fill(); }  /* permen ungu */
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.22, r * 0.12, -0.7, 0, Math.PI * 2); ctx.fill();
    if (g.t === 'garisH' || g.t === 'garisV') { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; for (var i = -1; i <= 1; i++) { ctx.beginPath(); if (g.t === 'garisH') { ctx.moveTo(-r * 0.7, i * r * 0.35); ctx.lineTo(r * 0.7, i * r * 0.35); } else { ctx.moveTo(i * r * 0.35, -r * 0.7); ctx.lineTo(i * r * 0.35, r * 0.7); } ctx.stroke(); } }
    if (g.t === 'bungkus') { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2); }
    ctx.restore();
  }
  function draw () {
    var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5b2c83'); bg.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    /* papan HUD atas */
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(12, 12, W - 24, 92);
    ctx.fillStyle = '#fff'; ctx.font = '900 14px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('LEVEL ' + level, 24, 34); ctx.fillText('TARGET', 24, 58); ctx.fillText('GERAKAN', W - 120, 34);
    ctx.font = '900 26px "Segoe UI", sans-serif'; ctx.fillStyle = '#ffd54f'; ctx.fillText(String(target), 24, 88);
    ctx.fillStyle = gerak <= 5 ? '#ff5252' : '#fff'; ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.textAlign = 'right'; ctx.fillText(String(Math.max(0, gerak)), W - 24, 70);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 20px "Segoe UI", sans-serif'; ctx.fillText(String(skor), W / 2, 62);
    /* progress bar bintang */
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(W / 2 - 70, 72, 140, 10); ctx.fillStyle = '#ffd54f'; ctx.fillRect(W / 2 - 70, 72, 140 * Math.min(1, skor / target), 10);
    for (var s = 1; s <= 3; s++) { var px = W / 2 - 70 + 140 * (s / 3); ctx.font = '14px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText(skor >= target * s / 3 ? '⭐' : '☆', px, 96); }
    /* papan */
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)'; ctx.fillRect(OX + x * CELL, TOP + y * CELL, CELL, CELL); }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var g = grid[y][x]; if (!g) continue; var off = g.dy && jatuhT > 0 ? -g.dy * CELL * (jatuhT / 14) : 0; permen(OX + x * CELL + CELL / 2, TOP + y * CELL + CELL / 2 + off, g, CELL * 0.38); }
    /* seleksi & kursor */
    if (sel) { ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 4; ctx.strokeRect(OX + sel.x * CELL + 3, TOP + sel.y * CELL + 3, CELL - 6, CELL - 6); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeRect(OX + cur.x * CELL + 2, TOP + cur.y * CELL + 2, CELL - 4, CELL - 4); ctx.setLineDash([]);
    for (var p = 0; p < partikel.length; p++) { ctx.globalAlpha = partikel[p].a; ctx.fillStyle = partikel[p].w; ctx.fillRect(partikel[p].x, partikel[p].y, 6, 6); } ctx.globalAlpha = 1;
    if (pesanT > 0 && pesan) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H * 0.45 - 34, W, 68); ctx.fillStyle = menang ? '#ffd54f' : '#fff'; ctx.font = '900 30px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(pesan, W / 2, H * 0.45 + 10); if (over) { ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText(menang ? '● lanjut level ' + (level + 1) : '● main lagi', W / 2, H * 0.45 + 30); } }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▲▼◀▶ pilih permen · ● tandai lalu pilih tetangganya untuk tukar · tap juga bisa', W / 2, H - 10);
    A.state = { level: level, skor: skor, gerak: gerak, target: target, over: over, menang: menang, sel: sel, cur: cur };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }
  function pilih (x, y) {
    if (over) { if (menang) { level++; mulaiLevel(); } else reset(); return; }
    if (jatuhT > 0) return;
    if (!sel) { sel = { x: x, y: y }; A.SFX.jump && A.SFX.jump(); return; }
    if (sel.x === x && sel.y === y) { sel = null; return; }
    if (Math.abs(sel.x - x) + Math.abs(sel.y - y) !== 1) { sel = { x: x, y: y }; return; }
    tukar(sel, { x: x, y: y }); sel = null; A.setStatus('Level ' + level + ' · ' + gerak + ' gerakan', 'Target ' + target);
    if (jatuhT === 0) cekAkhir();
  }
  window.addEventListener('keydown', function (e) {
    var k = e.code; if (e.repeat) return; A.initAudio();
    if (k === 'ArrowLeft' || k === 'KeyA') { cur.x = Math.max(0, cur.x - 1); if (sel && Math.abs(sel.x - cur.x) + Math.abs(sel.y - cur.y) === 1) pilih(cur.x, cur.y); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { cur.x = Math.min(N - 1, cur.x + 1); if (sel && Math.abs(sel.x - cur.x) + Math.abs(sel.y - cur.y) === 1) pilih(cur.x, cur.y); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { cur.y = Math.max(0, cur.y - 1); if (sel && Math.abs(sel.x - cur.x) + Math.abs(sel.y - cur.y) === 1) pilih(cur.x, cur.y); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { cur.y = Math.min(N - 1, cur.y + 1); if (sel && Math.abs(sel.x - cur.x) + Math.abs(sel.y - cur.y) === 1) pilih(cur.x, cur.y); e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { pilih(cur.x, cur.y); e.preventDefault(); }
  });
  function ketuk (px, py) { var r = c.getBoundingClientRect(); var x = Math.floor(((px - r.left) * (W / r.width) - OX) / CELL), y = Math.floor(((py - r.top) * (H / r.height) - TOP) / CELL); A.initAudio(); if (over) { pilih(0, 0); return; } if (x < 0 || y < 0 || x >= N || y >= N) return; cur = { x: x, y: y }; pilih(x, y); }
  c.addEventListener('mousedown', function (e) { ketuk(e.clientX, e.clientY); });
  c.addEventListener('touchstart', function (e) { ketuk(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
  reset(); requestAnimationFrame(loop);
`
export function candyHtml (brand = 'THERYHANN!') {
  return shell('Candy Crush', brand, CANDY_JS, {
    w: 480, h: 640, maxw: 440, sub: 'ARCADE', pad: 'udlra', padStyle: 'candy',
    hint: '▲▼◀▶ gerakkan kursor · ● tandai permen lalu arahkan ke tetangganya untuk menukar · 4 sejajar = permen bergaris · 5 = bom warna · capai target sebelum gerakan habis'
  })
}

/* ------------------------------------------------------------------ */
/*  TEMPLE RUN                                                          */
/* ------------------------------------------------------------------ */
const TEMPLE_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height, HORIZON = H * 0.38;
  var F = 280, CAM_Z = -2.2, CAM_H = 1.9, JAUH = 40, PATH_W = 2.2;
  function P (x, y, z) { var s = F / Math.max(0.15, z - CAM_Z); return { x: W / 2 + x * s, y: HORIZON + (CAM_H - y) * s, s: s }; }
  var side, sideX, y, vy, slide, mulai, over, mati, frame, kec, jarak, koin, skor, seg, monyet, belok, belokT, miring, goyang, kabut, kekuatan;
  function reset () {
    side = 0; sideX = 0; y = 0; vy = 0; slide = 0; mulai = false; over = false; mati = 0; frame = 0; kec = 0.24; jarak = 0; koin = 0; skor = 0; seg = []; monyet = 3.5; belok = 0; belokT = 0; miring = 0; goyang = 0; kabut = 0; kekuatan = 0;
    nextZ = 18; for (var i = 0; i < 8; i++) spawn();
    A.setScore(0); A.setBest(); A.setStatus('KETUK UNTUK LARI', '🪙 0'); A.setProgress(0);
  }
  var nextZ = 18;
  function acak (n) { return Math.floor(Math.random() * n); }
  function spawn () {
    var r = acak(10), z = nextZ;
    if (r <= 2) { seg.push({ j: 'akar', z: z, pjg: 0.5 }); nextZ = z + 6 + acak(4); }
    else if (r <= 4) { seg.push({ j: 'api', z: z, pjg: 0.6 }); nextZ = z + 6 + acak(4); }
    else if (r <= 6) { var sd = Math.random() < 0.5 ? -1 : 1; seg.push({ j: 'jurang', z: z, pjg: 4, sisi: sd }); for (var i = 0; i < 4; i++) seg.push({ j: 'koin', z: z + i, pjg: 0.3, x: -sd * 0.6 }); nextZ = z + 8 + acak(3); }
    else if (r === 7) { var arah = Math.random() < 0.5 ? -1 : 1; seg.push({ j: 'tikungan', z: z, pjg: 1.2, arah: arah }); nextZ = z + 7; }
    else if (r === 8) { seg.push({ j: 'pohon', z: z, pjg: 0.8 }); nextZ = z + 6; }
    else { for (var i = 0; i < 5; i++) seg.push({ j: 'koin', z: z + i * 0.9, pjg: 0.3, x: (acak(3) - 1) * 0.6 }); nextZ = z + 7; }
  }
  function tabrak (fatal) {
    if (!fatal) { monyet = monyet - 1.1; goyang = 14; A.SFX.crash(); if (monyet < 0.9) tabrak(true); return; }
    over = true; mati = 1; A.SFX.crash(); goyang = 20;
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    A.setStatus('TERTANGKAP MONYET!', '🪙 ' + koin);
  }
  function update () {
    frame++; sideX += (side - sideX) * 0.25; if (goyang > 0) goyang--; if (belokT > 0) belokT--;
    if (!mulai) return;
    if (over) { mati++; monyet = Math.max(0.3, monyet - 0.05); return; }
    kec = Math.min(0.55, 0.24 + jarak / 3000); var dz = kec;
    jarak += dz * 1.4; skor = Math.floor(jarak) + koin * 10; A.setScore(skor);
    A.setStatus(Math.floor(jarak) + ' m', '🪙 ' + koin); A.setProgress((jarak % 500) / 500);
    if (monyet < 3.5) monyet = Math.min(3.5, monyet + 0.006);
    vy -= 0.045; y += vy; if (y <= 0) { y = 0; vy = 0; }
    if (slide > 0) slide--;
    for (var i = seg.length - 1; i >= 0; i--) {
      var o = seg[i]; o.z -= dz;
      if (o.z + o.pjg < -3) { if (o.j === 'tikungan' && !o.lewat) { tabrak(true); return; } seg.splice(i, 1); continue; }
      var kena = o.z < 0.35 && o.z + o.pjg > -0.35;
      if (!kena) continue;
      if (o.j === 'koin') { if (Math.abs(o.x - sideX * 0.6) < 0.45 && y < 1.2) { koin++; A.SFX.point(); seg.splice(i, 1); } continue; }
      if (o.j === 'akar') { if (y < 0.5 && !o.hit) { o.hit = true; tabrak(false); if (over) return; } continue; }
      if (o.j === 'api') { if (slide <= 0 && y < 1.6 && !o.hit) { o.hit = true; tabrak(false); if (over) return; } continue; }
      if (o.j === 'pohon') { if (y < 0.9 && !o.hit) { o.hit = true; tabrak(true); return; } continue; }
      if (o.j === 'jurang') { if (side === o.sisi && y <= 0.05 && !o.hit) { o.hit = true; tabrak(true); return; } continue; }
      if (o.j === 'tikungan') { if (belok === o.arah && !o.lewat) { o.lewat = true; belokT = 22; belok = 0; skor += 25; A.SFX.level && A.SFX.level(); } else if (belok !== 0 && belok !== o.arah && !o.lewat) { tabrak(true); return; } continue; }
    }
    if (belok !== 0 && frame % 30 === 0) belok = 0;
    nextZ -= dz; while (nextZ < JAUH) spawn();
  }
  /* ---- gambar ---- */
  function latar () {
    var g = ctx.createLinearGradient(0, 0, 0, HORIZON); g.addColorStop(0, '#f4d58d'); g.addColorStop(1, '#9ccc65');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON + 2);
    /* gunung & hutan */
    ctx.fillStyle = '#6d9b5b'; ctx.beginPath(); ctx.moveTo(0, HORIZON); for (var i = 0; i <= 10; i++) ctx.lineTo(i * W / 10, HORIZON - 40 - Math.abs(Math.sin(i * 1.7 + 1)) * 60); ctx.lineTo(W, HORIZON); ctx.fill();
    ctx.fillStyle = '#4c7a3e'; for (var t = 0; t < 16; t++) { var tx = t * W / 15 - ((frame * 0.1) % (W / 15)); ctx.beginPath(); ctx.moveTo(tx, HORIZON); ctx.lineTo(tx + 14, HORIZON - 30 - (t * 13) % 25); ctx.lineTo(tx + 28, HORIZON); ctx.fill(); }
    /* tanah hutan */
    ctx.fillStyle = '#3f6b32'; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    /* lorong batu kuil */
    var a = P(-PATH_W / 2, 0, -2), b = P(PATH_W / 2, 0, -2), cc = P(PATH_W / 2, 0, JAUH), d = P(-PATH_W / 2, 0, JAUH);
    ctx.fillStyle = '#8d8a7c'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(cc.x, cc.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(60,55,45,0.55)'; ctx.lineWidth = 1;
    for (var z = -((jarak * 1.4) % 1.5) - 2; z < JAUH; z += 1.5) { var l0 = P(-PATH_W / 2, 0, z), l1 = P(PATH_W / 2, 0, z); ctx.beginPath(); ctx.moveTo(l0.x, l0.y); ctx.lineTo(l1.x, l1.y); ctx.stroke(); }
    for (var k = -1; k <= 1; k++) { var m0 = P(k * PATH_W / 3, 0, -2), m1 = P(k * PATH_W / 3, 0, JAUH); ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke(); }
    /* dinding kuil kiri kanan (batu berlumut) */
    for (var s = -1; s <= 1; s += 2) {
      var wx = s * (PATH_W / 2 + 0.05);
      var w0 = P(wx, 0, -2), w1 = P(wx, 1.4, -2), w2 = P(wx, 1.4, JAUH), w3 = P(wx, 0, JAUH);
      ctx.fillStyle = s < 0 ? '#6f6a5a' : '#615c4d'; ctx.beginPath(); ctx.moveTo(w0.x, w0.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y); ctx.lineTo(w3.x, w3.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(80,140,60,0.5)'; for (var mz = -((jarak * 1.4) % 5) - 2; mz < JAUH; mz += 5) { var v0 = P(wx, 0.9, mz), v1 = P(wx, 1.4, mz), v2 = P(wx, 1.4, mz + 2), v3 = P(wx, 1.0, mz + 2); ctx.beginPath(); ctx.moveTo(v0.x, v0.y); ctx.lineTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.lineTo(v3.x, v3.y); ctx.closePath(); ctx.fill(); }
      /* obor */
      for (var oz = 6 - ((jarak * 1.4) % 12); oz < JAUH; oz += 12) { var ob = P(wx, 1.3, oz); ctx.fillStyle = '#5d4037'; ctx.fillRect(ob.x - ob.s * 0.03, ob.y, ob.s * 0.06, ob.s * 0.25); ctx.fillStyle = frame % 6 < 3 ? '#ffb300' : '#ff6f00'; ctx.beginPath(); ctx.arc(ob.x, ob.y - ob.s * 0.05, ob.s * 0.09, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function gambar (o) {
    var z0 = Math.max(o.z, -2.5);
    if (o.j === 'koin') { var pk = P(o.x, 0.6, o.z); if (pk.s < 5) return; var r = pk.s * 0.13; ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pk.x, pk.y, Math.max(1, r * Math.abs(Math.cos(frame / 7 + o.z))), r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); return; }
    if (o.j === 'akar') { var a0 = P(-PATH_W / 2, 0, z0), a1 = P(PATH_W / 2, 0, z0); ctx.strokeStyle = '#4e342e'; ctx.lineWidth = Math.max(3, a0.s * 0.2); ctx.beginPath(); ctx.moveTo(a0.x, a0.y); for (var i = 1; i <= 6; i++) ctx.lineTo(a0.x + (a1.x - a0.x) * i / 6, a0.y - Math.sin(i * 1.3) * a0.s * 0.12 - a0.s * 0.1); ctx.stroke(); return; }
    if (o.j === 'api') { var f0 = P(-PATH_W / 2, 0, z0), f1 = P(PATH_W / 2, 0, z0), ft = P(0, 1.2, z0); ctx.fillStyle = '#3e2723'; ctx.fillRect(f0.x, ft.y, f1.x - f0.x, Math.max(2, f0.s * 0.05)); for (var i = 0; i < 9; i++) { var fx = f0.x + (f1.x - f0.x) * (i + 0.5) / 9; ctx.fillStyle = i % 2 ? '#ff6f00' : '#ffc107'; ctx.beginPath(); ctx.moveTo(fx - f0.s * 0.08, ft.y); ctx.lineTo(fx, ft.y + f0.s * (0.3 + 0.1 * Math.sin(frame / 3 + i))); ctx.lineTo(fx + f0.s * 0.08, ft.y); ctx.fill(); } return; }
    if (o.j === 'pohon') { var p0 = P(-PATH_W / 2, 0, z0), p1 = P(PATH_W / 2, 0, z0); ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.ellipse((p0.x + p1.x) / 2, p0.y - p0.s * 0.35, (p1.x - p0.x) / 2, p0.s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.ellipse((p0.x + p1.x) / 2, p0.y - p0.s * 0.35, (p1.x - p0.x) / 2.3, p0.s * 0.25, 0, 0, Math.PI * 2); ctx.fill(); return; }
    if (o.j === 'jurang') { var sx0 = o.sisi < 0 ? -PATH_W / 2 : 0, sx1 = o.sisi < 0 ? 0 : PATH_W / 2; var j0 = P(sx0, 0, z0), j1 = P(sx1, 0, z0), j2 = P(sx1, 0, o.z + o.pjg), j3 = P(sx0, 0, o.z + o.pjg); ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.moveTo(j0.x, j0.y); ctx.lineTo(j1.x, j1.y); ctx.lineTo(j2.x, j2.y); ctx.lineTo(j3.x, j3.y); ctx.closePath(); ctx.fill(); return; }
    if (o.j === 'tikungan') {
      var t0 = P(-PATH_W / 2, 0, z0), t1 = P(PATH_W / 2, 0, z0), t2 = P(PATH_W / 2, 1.4, z0), t3 = P(-PATH_W / 2, 1.4, z0);
      ctx.fillStyle = '#6f6a5a'; ctx.fillRect(t0.x, t3.y, t1.x - t0.x, t0.y - t3.y);
      ctx.fillStyle = '#3f6b32'; ctx.fillRect(t0.x, t3.y - t0.s * 0.3, t1.x - t0.x, t0.s * 0.3);
      /* cabang jalan ke arah tikungan */
      var sd = o.arah, c0 = P(sd * PATH_W / 2, 0, o.z - 0.2), c1 = P(sd * (PATH_W / 2 + 3), 0, o.z - 0.2), c2 = P(sd * (PATH_W / 2 + 3), 0, o.z + 1.2), c3 = P(sd * PATH_W / 2, 0, o.z + 1.2);
      ctx.fillStyle = '#8d8a7c'; ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffeb3b'; ctx.font = '900 ' + Math.max(8, Math.round(t0.s * 0.28)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sd < 0 ? '◀ BELOK' : 'BELOK ▶', (t0.x + t1.x) / 2, (t3.y + t0.y) / 2);
      return;
    }
  }
  function pelari () {
    var x = sideX * 0.6, pb = P(x, y, 0.2), s = pb.s, gx = pb.x, gy = pb.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; var sh = P(x, 0, 0.2); ctx.beginPath(); ctx.ellipse(sh.x, sh.y, Math.abs(s * 0.22), Math.abs(s * 0.06), 0, 0, Math.PI * 2); ctx.fill();
    var lari = mulai && !over && y === 0 ? Math.sin(frame / 2.5) : 0, u = s, tinggi = slide > 0 ? 0.45 : 1;
    ctx.save(); ctx.translate(gx, gy); if (belokT > 0) ctx.rotate((belokT / 22) * 0.5 * (side || 1) * -1); ctx.translate(-gx, -gy);
    /* sepatu & celana khaki */
    ctx.fillStyle = '#3e2723'; ctx.fillRect(gx - u * 0.17, gy - u * 0.06 + lari * u * 0.04, u * 0.14, u * 0.06); ctx.fillRect(gx + u * 0.03, gy - u * 0.06 - lari * u * 0.04, u * 0.14, u * 0.06);
    var kaki = slide > 0 ? u * 0.1 : u * 0.34;
    ctx.fillStyle = '#c8a165'; ctx.fillRect(gx - u * 0.16, gy - u * 0.06 - kaki + lari * u * 0.04, u * 0.13, kaki); ctx.fillRect(gx + u * 0.03, gy - u * 0.06 - kaki - lari * u * 0.04, u * 0.13, kaki);
    /* jaket cokelat penjelajah + tas */
    var by = gy - u * 0.06 - kaki, bh = u * 0.42 * tinggi + u * 0.1;
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(gx - u * 0.22, by - bh, u * 0.44, bh);
    ctx.fillStyle = '#4e342e'; ctx.fillRect(gx - u * 0.12, by - bh + u * 0.04, u * 0.24, bh * 0.6);
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(gx - u * 0.32, by - bh + u * 0.04 - lari * u * 0.06, u * 0.1, u * 0.28); ctx.fillRect(gx + u * 0.22, by - bh + u * 0.04 + lari * u * 0.06, u * 0.1, u * 0.28);
    ctx.fillStyle = '#d7a37a'; ctx.fillRect(gx - u * 0.32, by - bh + u * 0.32 - lari * u * 0.06, u * 0.1, u * 0.08); ctx.fillRect(gx + u * 0.22, by - bh + u * 0.32 + lari * u * 0.06, u * 0.1, u * 0.08);
    /* kepala + topi fedora */
    var ky = by - bh - u * 0.02;
    ctx.fillStyle = '#d7a37a'; ctx.fillRect(gx - u * 0.14, ky - u * 0.24, u * 0.28, u * 0.24);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(gx - u * 0.2, ky - u * 0.3, u * 0.4, u * 0.07); ctx.fillRect(gx - u * 0.14, ky - u * 0.42, u * 0.28, u * 0.13);
    ctx.fillStyle = '#212121'; ctx.fillRect(gx - u * 0.14, ky - u * 0.33, u * 0.28, u * 0.03);
    /* patung emas di tangan */
    ctx.fillStyle = '#ffd54f'; ctx.fillRect(gx + u * 0.24, by - bh + u * 0.22 + lari * u * 0.06, u * 0.07, u * 0.14);
    ctx.restore();
    /* monyet iblis mengejar */
    if (over || monyet < 3.4) {
      for (var i = -1; i <= 1; i++) {
        var pm = P(x + i * 0.55, 0, -monyet + Math.abs(i) * 0.4), ms = pm.s * 0.9;
        if (pm.y > H + 60) continue;
        var lompat = Math.abs(Math.sin(frame / 4 + i)) * ms * 0.12;
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.ellipse(pm.x, pm.y - ms * 0.35 - lompat, ms * 0.26, ms * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(pm.x, pm.y - ms * 0.75 - lompat, ms * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(pm.x - ms * 0.08, pm.y - ms * 0.78 - lompat, ms * 0.045, 0, Math.PI * 2); ctx.arc(pm.x + ms * 0.08, pm.y - ms * 0.78 - lompat, ms * 0.045, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fafafa'; ctx.fillRect(pm.x - ms * 0.1, pm.y - ms * 0.66 - lompat, ms * 0.2, ms * 0.04);
        ctx.fillStyle = '#212121'; ctx.fillRect(pm.x - ms * 0.4, pm.y - ms * 0.5 - lompat, ms * 0.14, ms * 0.08); ctx.fillRect(pm.x + ms * 0.26, pm.y - ms * 0.5 - lompat, ms * 0.14, ms * 0.08);
      }
    }
  }
  function draw () {
    ctx.save(); if (goyang > 0) ctx.translate(A.rand(-goyang / 3, goyang / 3), A.rand(-goyang / 3, goyang / 3));
    if (belokT > 0) { ctx.translate(W / 2, H / 2); ctx.rotate((belokT / 22) * 0.12 * -(side || 1)); ctx.translate(-W / 2, -H / 2); }
    latar();
    var urut = seg.slice().sort(function (a, b) { return (b.z + b.pjg) - (a.z + a.pjg); });
    var sudah = false;
    for (var i = 0; i < urut.length; i++) { if (!sudah && urut[i].z + urut[i].pjg < 0.2) { pelari(); sudah = true; } gambar(urut[i]); }
    if (!sudah) pelari();
    ctx.restore();
    /* HUD */
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, 10, 170, 56);
    ctx.fillStyle = '#ffd54f'; ctx.font = '900 22px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(skor).padStart(7, '0'), 20, 36);
    ctx.fillStyle = '#fff'; ctx.font = '800 14px "Segoe UI", sans-serif'; ctx.fillText(Math.floor(jarak) + ' m', 20, 58); ctx.fillText('● ' + koin, 100, 58);
    /* indikator monyet */
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(W - 120, 10, 110, 22); ctx.fillStyle = monyet < 1.8 ? '#ef5350' : '#66bb6a'; ctx.fillRect(W - 116, 14, 102 * Math.min(1, monyet / 3.5), 14);
    if (!mulai) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(20, H * 0.3, W - 40, 150); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd54f'; ctx.font = '900 42px "Segoe UI", serif'; ctx.fillText('TEMPLE RUN', W / 2, H * 0.3 + 56); ctx.fillStyle = '#fff'; ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('◀ ▶ belok di tikungan / geser sisi · ▲ lompat · ▼ slide', W / 2, H * 0.3 + 92); ctx.fillText('jangan sampai monyet iblis menangkapmu!', W / 2, H * 0.3 + 114); ctx.fillText('ketuk untuk mulai', W / 2, H * 0.3 + 138); }
    if (over) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(20, H * 0.3, W - 40, 150); ctx.textAlign = 'center'; ctx.fillStyle = '#ef5350'; ctx.font = '900 36px "Segoe UI", sans-serif'; ctx.fillText('TERTANGKAP!', W / 2, H * 0.3 + 56); ctx.fillStyle = '#fff'; ctx.font = '800 18px "Segoe UI", sans-serif'; ctx.fillText('Skor ' + skor + ' · ' + Math.floor(jarak) + ' m · ● ' + koin, W / 2, H * 0.3 + 92); ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillText('ketuk untuk lari lagi', W / 2, H * 0.3 + 128); }
    A.state = { side: side, y: y, skor: skor, koin: koin, jarak: jarak, over: over, mulai: mulai, monyet: monyet, seg: seg.length };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }
  function aksi (k) {
    A.initAudio();
    if (over) { if (mati > 20) reset(); return; }
    if (!mulai) mulai = true;
    var adaTikungan = seg.some(function (o) { return o.j === 'tikungan' && o.z < 3 && o.z + o.pjg > -0.5 && !o.lewat; });
    if (k === 'left') { if (adaTikungan) belok = -1; else side = Math.max(-1, side - 1); }
    else if (k === 'right') { if (adaTikungan) belok = 1; else side = Math.min(1, side + 1); }
    else if (k === 'up') { if (y === 0) { vy = 0.32; slide = 0; A.SFX.jump(); } }
    else if (k === 'down') { slide = 36; if (y > 0) vy = -0.4; }
    else if (k === 'act') { side = side === 0 ? (Math.random() < 0.5 ? -1 : 1) : 0; }
  }
  window.addEventListener('keydown', function (e) {
    var k = e.code; if (e.repeat) return;
    if (k === 'ArrowLeft' || k === 'KeyA') { aksi('left'); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { aksi('right'); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { aksi('up'); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { aksi('down'); e.preventDefault(); }
    else if (k === 'Space' || k === 'Enter') { aksi('act'); e.preventDefault(); }
  });
  var ts = null;
  c.addEventListener('touchstart', function (e) { ts = e.touches[0]; e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function (e) { if (!ts) return; var dx = e.changedTouches[0].clientX - ts.clientX, dy = e.changedTouches[0].clientY - ts.clientY; ts = null; if (Math.abs(dx) < 16 && Math.abs(dy) < 16) { if (!mulai || over) aksi('start'); else aksi('up'); e.preventDefault(); return; } if (Math.abs(dx) > Math.abs(dy)) aksi(dx > 0 ? 'right' : 'left'); else aksi(dy > 0 ? 'down' : 'up'); e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function () { if (!mulai || over) aksi('start'); });
  reset(); requestAnimationFrame(loop);
`
export function templeHtml (brand = 'THERYHANN!') {
  return shell('Temple Run', brand, TEMPLE_JS, {
    w: 480, h: 760, maxw: 440, sub: 'ARCADE', pad: 'udlra', padStyle: 'temple',
    hint: '◀ ▶ belok saat ada tanda BELOK (kalau tidak: geser ke sisi lorong) · ▲ lompat akar/jurang · ▼ slide di bawah api · ● pindah ke tengah · geser layar juga bisa'
  })
}

/* ------------------------------------------------------------------ */
/*  ANGRY BIRDS                                                         */
/* ------------------------------------------------------------------ */
const ANGRY_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height, TANAH = H - 70, GRAV = 0.32;
  var SLX = 120, SLY = TANAH - 110;
  var burung, antre, babi, balok, sudut, tenaga, terbang, skor, level, over, menang, partikel, kamera, pesanT, aktifKuat, jejak, frame;
  var LEVELS = [
    function () { tumpuk(430, 3, 'kayu'); babi.push({ x: 430, y: TANAH - 12, r: 14, hp: 1 }); tumpuk(560, 2, 'kayu'); babi.push({ x: 560, y: TANAH - 12 - 60, r: 16, hp: 1 }); },
    function () { menara(470, 4, 'kayu'); babi.push({ x: 470, y: TANAH - 12 - 120, r: 14, hp: 1 }); menara(600, 3, 'es'); babi.push({ x: 600, y: TANAH - 12, r: 16, hp: 1 }); babi.push({ x: 600, y: TANAH - 12 - 90, r: 12, hp: 1 }); },
    function () { menara(440, 3, 'batu'); babi.push({ x: 440, y: TANAH - 12 - 90, r: 18, hp: 2 }); menara(560, 5, 'kayu'); babi.push({ x: 560, y: TANAH - 12, r: 14, hp: 1 }); babi.push({ x: 560, y: TANAH - 12 - 150, r: 12, hp: 1 }); tumpuk(650, 2, 'es'); babi.push({ x: 650, y: TANAH - 12, r: 20, hp: 3 }); }
  ];
  function tumpuk (x, n, jenis) { for (var i = 0; i < n; i++) balok.push({ x: x - 40 + i * 40, y: TANAH - 60, w: 14, h: 60, jenis: jenis, hp: hpJenis(jenis), vx: 0, vy: 0 }); balok.push({ x: x - 50, y: TANAH - 74, w: 100 + (n - 2) * 40, h: 14, jenis: jenis, hp: hpJenis(jenis), vx: 0, vy: 0 }); }
  function menara (x, tingkat, jenis) { for (var t = 0; t < tingkat; t++) { var y = TANAH - (t + 1) * 30; balok.push({ x: x - 30, y: y, w: 12, h: 30, jenis: jenis, hp: hpJenis(jenis), vx: 0, vy: 0 }); balok.push({ x: x + 18, y: y, w: 12, h: 30, jenis: jenis, hp: hpJenis(jenis), vx: 0, vy: 0 }); balok.push({ x: x - 36, y: y - 10, w: 72, h: 10, jenis: jenis, hp: hpJenis(jenis), vx: 0, vy: 0 }); } }
  function hpJenis (j) { return j === 'es' ? 1 : j === 'kayu' ? 2 : 4; }
  function reset () { level = 0; skor = 0; mulaiLevel(); }
  function mulaiLevel () {
    babi = []; balok = []; partikel = []; jejak = []; over = false; menang = false; kamera = 0; pesanT = 60; aktifKuat = false; frame = 0;
    LEVELS[level % LEVELS.length]();
    if (level >= LEVELS.length) babi.forEach(function (b) { b.hp++; });
    antre = ['merah', 'kuning', 'merah', 'hitam', 'kuning'].slice(0, 3 + Math.min(2, level));
    sudut = 40; tenaga = 12; terbang = false; burung = null; ambilBurung();
    A.setScore(skor); A.setBest(); A.setStatus('Level ' + (level + 1), '🐦 ' + antre.length); A.setProgress(0);
  }
  function ambilBurung () { if (!antre.length) { burung = null; return; } burung = { j: antre.shift(), x: SLX, y: SLY, vx: 0, vy: 0, r: 14, hidup: true, kuat: false }; terbang = false; aktifKuat = false; }
  function tembak () { if (!burung || terbang) return; terbang = true; var rad = sudut * Math.PI / 180; burung.vx = Math.cos(rad) * tenaga; burung.vy = -Math.sin(rad) * tenaga; jejak = []; A.SFX.jump(); }
  function kekuatan () {
    if (!burung || !terbang || aktifKuat) return; aktifKuat = true;
    if (burung.j === 'kuning') { burung.vx *= 1.8; burung.vy *= 1.3; A.SFX.level(); }
    else if (burung.j === 'hitam') { ledak(burung.x, burung.y, 90); burung.hidup = false; A.SFX.crash(); }
    else { burung.vy += 6; }
  }
  function ledak (x, y, r) {
    for (var i = 0; i < 20; i++) partikel.push({ x: x, y: y, vx: A.rand(-6, 6), vy: A.rand(-6, 2), a: 1, w: i % 2 ? '#ff6f00' : '#ffd54f' });
    balok.forEach(function (b) { var dx = b.x + b.w / 2 - x, dy = b.y + b.h / 2 - y, d = Math.sqrt(dx * dx + dy * dy); if (d < r) { b.hp -= 3; b.vx += dx / d * 8; b.vy += dy / d * 8 - 4; } });
    babi.forEach(function (p) { var dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy); if (d < r) p.hp -= 3; });
  }
  function update () {
    frame++; if (pesanT > 0) pesanT--;
    /* fisika balok sederhana: gravitasi + lantai + tumpukan */
    balok.forEach(function (b) {
      b.vy += GRAV; b.x += b.vx; b.y += b.vy; b.vx *= 0.96;
      if (b.y + b.h > TANAH) { b.y = TANAH - b.h; if (Math.abs(b.vy) > 4) b.hp -= 1; b.vy = 0; b.vx *= 0.7; }
      balok.forEach(function (o) { if (o === b) return; if (b.x < o.x + o.w && b.x + b.w > o.x && b.y + b.h > o.y && b.y + b.h < o.y + o.h / 2 + 8 && b.vy >= 0) { b.y = o.y - b.h; if (b.vy > 4) { b.hp -= 1; o.hp -= 1; } b.vy = 0; o.vx += b.vx * 0.3; } });
    });
    for (var i = balok.length - 1; i >= 0; i--) if (balok[i].hp <= 0) { skor += 500; pecah(balok[i]); balok.splice(i, 1); }
    /* babi: jatuh kalau tidak ada penyangga */
    babi.forEach(function (p) {
      var sangga = p.y + p.r >= TANAH - 1 || balok.some(function (b) { return p.x > b.x - p.r && p.x < b.x + b.w + p.r && Math.abs(p.y + p.r - b.y) < 6; });
      if (!sangga) { p.vy = (p.vy || 0) + GRAV; p.y += p.vy; if (p.y + p.r > TANAH) { p.y = TANAH - p.r; if (p.vy > 5) p.hp -= 1; p.vy = 0; } } else { if ((p.vy || 0) > 5) p.hp -= 1; p.vy = 0; }
      balok.forEach(function (b) { if (Math.abs(b.vx) > 3 && p.x > b.x - p.r && p.x < b.x + b.w + p.r && p.y > b.y - p.r && p.y < b.y + b.h + p.r) { p.hp -= 1; b.vx *= 0.5; } });
    });
    for (var j = babi.length - 1; j >= 0; j--) if (babi[j].hp <= 0) { skor += 5000; for (var k = 0; k < 10; k++) partikel.push({ x: babi[j].x, y: babi[j].y, vx: A.rand(-4, 4), vy: A.rand(-5, 0), a: 1, w: '#8bc34a' }); babi.splice(j, 1); A.SFX.point(); }
    /* burung */
    if (burung && terbang && burung.hidup) {
      burung.vy += GRAV; burung.x += burung.vx; burung.y += burung.vy;
      if (frame % 3 === 0) jejak.push({ x: burung.x, y: burung.y });
      balok.forEach(function (b) { if (burung.x + burung.r > b.x && burung.x - burung.r < b.x + b.w && burung.y + burung.r > b.y && burung.y - burung.r < b.y + b.h) { var kuat = Math.sqrt(burung.vx * burung.vx + burung.vy * burung.vy); b.hp -= kuat > 6 ? 2 : 1; b.vx += burung.vx * 0.6; b.vy += burung.vy * 0.3; burung.vx *= 0.4; burung.vy *= 0.4; A.SFX.crash(); } });
      babi.forEach(function (p) { var dx = burung.x - p.x, dy = burung.y - p.y; if (dx * dx + dy * dy < (p.r + burung.r) * (p.r + burung.r)) { p.hp -= 2; burung.vx *= 0.3; burung.vy *= -0.3; } });
      if (burung.y + burung.r > TANAH) { burung.y = TANAH - burung.r; burung.vy *= -0.4; burung.vx *= 0.8; if (Math.abs(burung.vy) < 1) burung.vy = 0; }
      if (burung.x > W + 60 || (Math.abs(burung.vx) < 0.2 && Math.abs(burung.vy) < 0.2 && burung.y + burung.r >= TANAH - 1)) burung.hidup = false;
      kamera = Math.max(0, Math.min(W * 0.2, burung.x - W * 0.6));
    }
    if (burung && !burung.hidup) { burung.mati = (burung.mati || 0) + 1; if (burung.mati > 50) { kamera = 0; if (babi.length) ambilBurung(); } }
    A.setScore(skor); A.setProgress(1 - babi.length / Math.max(1, (LEVELS[level % LEVELS.length].toString().match(/babi.push/g) || []).length));
    if (!over) {
      if (!babi.length) { over = true; menang = true; skor += antre.length * 10000; A.setScore(skor); A.SFX.level(); A.setStatus('LEVEL SELESAI', 'bonus ' + antre.length + ' burung'); }
      else if (!burung && !antre.length) { over = true; menang = false; if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); } A.setStatus('LEVEL GAGAL', 'skor ' + skor); }
      else if (burung && !burung.hidup && burung.mati > 50 && !antre.length && babi.length) { over = true; if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); } A.setStatus('LEVEL GAGAL', 'skor ' + skor); }
    }
    for (var p = partikel.length - 1; p >= 0; p--) { var q = partikel[p]; q.x += q.vx; q.y += q.vy; q.vy += 0.3; q.a -= 0.03; if (q.a <= 0) partikel.splice(p, 1); }
  }
  function pecah (b) { var w = b.jenis === 'es' ? '#b3e5fc' : b.jenis === 'kayu' ? '#a1887f' : '#9e9e9e'; for (var i = 0; i < 8; i++) partikel.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: A.rand(-3, 3), vy: A.rand(-4, 0), a: 1, w: w }); }
  function gambarBurung (b, x, y, r) {
    var warna = b.j === 'kuning' ? '#fdd835' : b.j === 'hitam' ? '#263238' : '#e53935';
    ctx.fillStyle = warna;
    if (b.j === 'kuning') { ctx.beginPath(); ctx.moveTo(x + r * 1.1, y); ctx.lineTo(x - r * 0.8, y - r * 0.9); ctx.lineTo(x - r * 0.8, y + r * 0.9); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    /* perut krem */
    ctx.fillStyle = b.j === 'hitam' ? '#78909c' : '#ffe0b2'; ctx.beginPath(); ctx.ellipse(x + r * 0.1, y + r * 0.4, r * 0.55, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    /* jambul */
    ctx.fillStyle = warna; ctx.fillRect(x - r * 0.2, y - r * 1.5, r * 0.25, r * 0.6); ctx.fillRect(x - r * 0.45, y - r * 1.35, r * 0.22, r * 0.45);
    /* mata & alis marah */
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.3, 0, Math.PI * 2); ctx.arc(x - r * 0.15, y - r * 0.2, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + r * 0.38, y - r * 0.18, r * 0.12, 0, Math.PI * 2); ctx.arc(x - r * 0.08, y - r * 0.18, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.18; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.6); ctx.lineTo(x + r * 0.65, y - r * 0.35); ctx.stroke();
    /* paruh */
    ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.moveTo(x + r * 0.5, y); ctx.lineTo(x + r * 1.25, y + r * 0.1); ctx.lineTo(x + r * 0.5, y + r * 0.35); ctx.closePath(); ctx.fill();
  }
  function gambarBabi (p) {
    ctx.fillStyle = '#7cb342'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9ccc65'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.6, p.y - p.r * 0.9, p.r * 0.3, 0, Math.PI * 2); ctx.arc(p.x + p.r * 0.6, p.y - p.r * 0.9, p.r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8bc34a'; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r * 0.1, p.r * 0.5, p.r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#558b2f'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.2, p.y + p.r * 0.1, p.r * 0.1, 0, Math.PI * 2); ctx.arc(p.x + p.r * 0.2, p.y + p.r * 0.1, p.r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.45, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2); ctx.arc(p.x + p.r * 0.45, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p.x - p.r * 0.45, p.y - p.r * 0.35, p.r * 0.1, 0, Math.PI * 2); ctx.arc(p.x + p.r * 0.45, p.y - p.r * 0.35, p.r * 0.1, 0, Math.PI * 2); ctx.fill();
    if (p.hp <= 1) { ctx.strokeStyle = '#33691e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - p.r * 0.5, p.y + p.r * 0.6); ctx.lineTo(p.x, p.y + p.r * 0.5); ctx.stroke(); }
  }
  function draw () {
    var g = ctx.createLinearGradient(0, 0, 0, TANAH); g.addColorStop(0, '#6ec6ff'); g.addColorStop(1, '#e3f2fd');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* awan */
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (var i = 0; i < 4; i++) { var cx = ((i * 190 + frame * 0.2) % (W + 120)) - 60, cy = 50 + i * 30; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.arc(cx + 22, cy - 8, 22, 0, Math.PI * 2); ctx.arc(cx + 46, cy, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.translate(-kamera, 0);
    /* bukit & tanah */
    ctx.fillStyle = '#aed581'; ctx.beginPath(); ctx.moveTo(-100, TANAH); for (var x = -100; x <= W + 300; x += 40) ctx.lineTo(x, TANAH - 20 - Math.sin(x / 90) * 14); ctx.lineTo(W + 300, TANAH); ctx.fill();
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(-100, TANAH, W + 400, H - TANAH); ctx.fillStyle = '#7cb342'; ctx.fillRect(-100, TANAH, W + 400, 8);
    /* ketapel */
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(SLX, TANAH); ctx.lineTo(SLX, SLY + 20); ctx.moveTo(SLX, SLY + 20); ctx.lineTo(SLX - 12, SLY - 14); ctx.moveTo(SLX, SLY + 20); ctx.lineTo(SLX + 12, SLY - 14); ctx.stroke();
    /* garis lintasan bantuan */
    if (burung && !terbang) {
      var rad = sudut * Math.PI / 180, px = SLX, py = SLY, vx = Math.cos(rad) * tenaga, vy = -Math.sin(rad) * tenaga;
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (var t = 0; t < 26; t++) { px += vx; py += vy; vy += GRAV; if (py > TANAH) break; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); }
      /* karet */
      var tarik = tenaga * 3;
      ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(SLX - 12, SLY - 14); ctx.lineTo(SLX - Math.cos(rad) * tarik, SLY + Math.sin(rad) * tarik); ctx.lineTo(SLX + 12, SLY - 14); ctx.stroke();
      gambarBurung(burung, SLX - Math.cos(rad) * tarik, SLY + Math.sin(rad) * tarik, burung.r);
    }
    for (var j = 0; j < jejak.length; j++) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(jejak[j].x - 2, jejak[j].y - 2, 4, 4); }
    /* balok */
    balok.forEach(function (b) { ctx.fillStyle = b.jenis === 'es' ? 'rgba(179,229,252,0.9)' : b.jenis === 'kayu' ? '#c8955c' : '#9e9e9e'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeStyle = b.jenis === 'es' ? '#81d4fa' : b.jenis === 'kayu' ? '#8d5a2b' : '#616161'; ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h); if (b.jenis === 'kayu') { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; if (b.w > b.h) for (var k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h * k / 3); ctx.lineTo(b.x + b.w, b.y + b.h * k / 3); ctx.stroke(); } else for (var k2 = 1; k2 < 4; k2++) { ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h * k2 / 4); ctx.lineTo(b.x + b.w, b.y + b.h * k2 / 4); ctx.stroke(); } } });
    babi.forEach(gambarBabi);
    if (burung && terbang && burung.hidup) gambarBurung(burung, burung.x, burung.y, burung.r);
    for (var p = 0; p < partikel.length; p++) { ctx.globalAlpha = partikel[p].a; ctx.fillStyle = partikel[p].w; ctx.fillRect(partikel[p].x, partikel[p].y, 6, 6); } ctx.globalAlpha = 1;
    /* antrean burung */
    for (var q = 0; q < antre.length; q++) gambarBurung({ j: antre[q] }, 40 + q * 28, TANAH - 12, 10);
    ctx.restore();
    /* HUD */
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(10, 10, 220, 50);
    ctx.fillStyle = '#fff'; ctx.font = '900 20px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('SKOR ' + skor, 20, 32);
    ctx.font = '800 13px "Segoe UI", sans-serif'; ctx.fillText('Level ' + (level + 1) + ' · sudut ' + sudut + '° · tenaga ' + tenaga + ' · 🐷 ' + babi.length, 20, 52);
    if (burung && terbang && burung.hidup && !aktifKuat) { ctx.fillStyle = '#ffd54f'; ctx.font = '900 14px "Segoe UI", sans-serif'; ctx.textAlign = 'right'; ctx.fillText('● ' + (burung.j === 'kuning' ? 'NGEBUT!' : burung.j === 'hitam' ? 'LEDAKKAN!' : 'JATUHKAN!'), W - 14, 30); }
    if (pesanT > 0 && !over) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H * 0.35, W, 60); ctx.fillStyle = '#fff'; ctx.font = '900 28px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('LEVEL ' + (level + 1), W / 2, H * 0.35 + 40); }
    if (over) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H * 0.32, W, 120); ctx.textAlign = 'center'; ctx.fillStyle = menang ? '#ffd54f' : '#ef5350'; ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText(menang ? 'LEVEL SELESAI!' : 'LEVEL GAGAL', W / 2, H * 0.32 + 50); ctx.fillStyle = '#fff'; ctx.font = '800 16px "Segoe UI", sans-serif'; ctx.fillText('Skor ' + skor, W / 2, H * 0.32 + 80); ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.fillText(menang ? '● lanjut level berikutnya' : '● ulangi dari awal', W / 2, H * 0.32 + 104); }
    A.state = { level: level, skor: skor, babi: babi.length, antre: antre.length, sudut: sudut, tenaga: tenaga, over: over, menang: menang, terbang: terbang };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }
  function aksi (k) {
    A.initAudio();
    if (over) { if (k === 'act' || k === 'start') { if (menang) { level++; mulaiLevel(); } else reset(); } return; }
    if (k === 'left') sudut = Math.min(80, sudut + 5);
    else if (k === 'right') sudut = Math.max(5, sudut - 5);
    else if (k === 'up') tenaga = Math.min(20, tenaga + 1);
    else if (k === 'down') tenaga = Math.max(6, tenaga - 1);
    else if (k === 'act' || k === 'start') { if (!terbang) tembak(); else kekuatan(); }
  }
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { aksi('left'); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { aksi('right'); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { aksi('up'); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { aksi('down'); e.preventDefault(); }
    else if ((k === 'Space' || k === 'Enter') && !e.repeat) { aksi('act'); e.preventDefault(); }
  });
  /* tarik ketapel dengan jari */
  var tarikAktif = false;
  function posisi (e) { var r = c.getBoundingClientRect(); var t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (W / r.width), y: (t.clientY - r.top) * (H / r.height) }; }
  function mulaiTarik (e) { var p = posisi(e); if (over || terbang) { aksi('act'); return; } tarikAktif = true; gerakTarik(e); }
  function gerakTarik (e) { if (!tarikAktif) return; var p = posisi(e); var dx = SLX - p.x, dy = p.y - SLY; if (dx < 4) dx = 4; sudut = Math.max(5, Math.min(80, Math.round(Math.atan2(dy, dx) * 180 / Math.PI))); tenaga = Math.max(6, Math.min(20, Math.round(Math.sqrt(dx * dx + dy * dy) / 4))); }
  function lepasTarik () { if (!tarikAktif) return; tarikAktif = false; tembak(); }
  c.addEventListener('mousedown', mulaiTarik); c.addEventListener('mousemove', gerakTarik); window.addEventListener('mouseup', lepasTarik);
  c.addEventListener('touchstart', function (e) { mulaiTarik(e); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove', function (e) { gerakTarik(e); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function (e) { lepasTarik(); e.preventDefault(); }, { passive: false });
  reset(); requestAnimationFrame(loop);
`
export function angryHtml (brand = 'THERYHANN!') {
  return shell('Angry Birds', brand, ANGRY_JS, {
    w: 720, h: 440, maxw: 720, sub: 'ARCADE', pad: 'udlra', padStyle: 'angry',
    hint: '◀ ▶ atur sudut · ▲ ▼ atur tenaga · ● tembak, tekan ● lagi saat terbang untuk kekuatan (kuning ngebut, hitam meledak, merah menukik) · atau tarik ketapel dengan jari'
  })
}

/* ------------------------------------------------------------------ */
/*  SUPER JUMP (platformer ala Mario)                                   */
/* ------------------------------------------------------------------ */
const MARIO_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height, T = 32, ROWS = Math.floor(H / T), GRAV = 0.55, LEBAR_DUNIA = 220;
  var peta, pemain, musuh, koinAnim, kamera, skor, koin, nyawa, waktu, over, menang, frame, partikel, kiri, kanan, jongkok, besar, invul, level;
  function buatDunia () {
    peta = []; musuh = []; koinAnim = [];
    for (var x = 0; x < LEBAR_DUNIA; x++) { peta[x] = []; for (var y = 0; y < ROWS; y++) peta[x][y] = 0; }
    var lantaiY = ROWS - 2;
    var x = 0;
    while (x < LEBAR_DUNIA) {
      var lubang = x > 12 && x < LEBAR_DUNIA - 14 && Math.random() < 0.12;
      if (lubang) { x += 2 + Math.floor(Math.random() * 2); continue; }
      peta[x][lantaiY] = 1; peta[x][lantaiY + 1] = 1;
      x++;
    }
    /* bata & kotak tanya melayang */
    for (var i = 0; i < 34; i++) { var bx = 10 + Math.floor(Math.random() * (LEBAR_DUNIA - 30)), by = lantaiY - 4 - Math.floor(Math.random() * 2), n = 2 + Math.floor(Math.random() * 4); for (var k = 0; k < n; k++) if (peta[bx + k]) peta[bx + k][by] = Math.random() < 0.3 ? 3 : 2; }
    /* pipa hijau */
    for (var p = 0; p < 10; p++) { var px = 18 + p * 19 + Math.floor(Math.random() * 6), ph = 2 + Math.floor(Math.random() * 2); if (!peta[px] || !peta[px][lantaiY] || !peta[px + 1] || !peta[px + 1][lantaiY]) continue; for (var h = 1; h <= ph; h++) { peta[px][lantaiY - h] = h === ph ? 5 : 4; peta[px + 1][lantaiY - h] = h === ph ? 6 : 4; } }
    /* tangga blok keras + bendera akhir */
    for (var s = 0; s < 8; s++) for (var h2 = 0; h2 <= s; h2++) peta[LEBAR_DUNIA - 22 + s][lantaiY - 1 - h2] = 7;
    for (var f = 1; f <= 9; f++) peta[LEBAR_DUNIA - 8][lantaiY - f] = 8; peta[LEBAR_DUNIA - 8][lantaiY - 10] = 9;
    /* koin di udara */
    for (var q = 0; q < 60; q++) { var qx = 6 + Math.floor(Math.random() * (LEBAR_DUNIA - 30)), qy = lantaiY - 2 - Math.floor(Math.random() * 4); if (peta[qx][qy] === 0) peta[qx][qy] = 10; }
    /* musuh: kura-kura & jamur cokelat */
    for (var e = 0; e < 26; e++) { var ex = 14 + Math.floor(Math.random() * (LEBAR_DUNIA - 40)); if (peta[ex][lantaiY]) musuh.push({ x: ex * T, y: (lantaiY - 1) * T, vx: -1, j: Math.random() < 0.4 ? 'kura' : 'jamur', hidup: true, w: T - 4, h: T - 2 }); }
  }
  function reset () { skor = 0; koin = 0; nyawa = 3; level = 1; mulaiLevel(); }
  function mulaiLevel () {
    buatDunia(); pemain = { x: 3 * T, y: (ROWS - 4) * T, vx: 0, vy: 0, w: 22, h: 30, tanah: false, hadap: 1 }; kamera = 0; waktu = 300; over = false; menang = false; frame = 0; partikel = []; kiri = false; kanan = false; jongkok = false; besar = false; invul = 0;
    A.setScore(skor); A.setBest(); A.setStatus('WORLD 1-' + level, '❤ ' + nyawa); A.setProgress(0);
  }
  function padat (t) { return t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6 || t === 7 || t === 11; }
  function tile (px, py) { var x = Math.floor(px / T), y = Math.floor(py / T); if (x < 0 || x >= LEBAR_DUNIA || y < 0 || y >= ROWS) return 0; return peta[x][y]; }
  function setTile (px, py, v) { var x = Math.floor(px / T), y = Math.floor(py / T); if (peta[x]) peta[x][y] = v; }
  function mati () {
    if (invul > 0) return;
    if (besar) { besar = false; invul = 90; pemain.h = 30; A.SFX.crash(); return; }
    nyawa--; A.SFX.crash(); A.setStatus('WORLD 1-' + level, '❤ ' + nyawa);
    if (nyawa <= 0) { over = true; if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); } A.setStatus('GAME OVER', 'skor ' + skor); return; }
    pemain.x = Math.max(3 * T, kamera + 2 * T); pemain.y = 2 * T; pemain.vx = 0; pemain.vy = 0; invul = 120;
  }
  function update () {
    frame++; if (over || menang) return;
    if (frame % 60 === 0) { waktu--; if (waktu <= 0) { nyawa = 1; mati(); waktu = 300; } }
    if (invul > 0) invul--;
    var kec = 3.2;
    if (kiri) { pemain.vx = -kec; pemain.hadap = -1; } else if (kanan) { pemain.vx = kec; pemain.hadap = 1; } else pemain.vx *= 0.7;
    pemain.vy += GRAV; if (pemain.vy > 12) pemain.vy = 12;
    /* gerak X */
    pemain.x += pemain.vx;
    if (pemain.x < kamera) pemain.x = kamera;
    var l = pemain.x, r = pemain.x + pemain.w, tp = pemain.y, bt = pemain.y + pemain.h - 1;
    if (pemain.vx > 0 && (padat(tile(r, tp)) || padat(tile(r, bt)))) { pemain.x = Math.floor(r / T) * T - pemain.w - 0.01; pemain.vx = 0; }
    if (pemain.vx < 0 && (padat(tile(l, tp)) || padat(tile(l, bt)))) { pemain.x = (Math.floor(l / T) + 1) * T; pemain.vx = 0; }
    /* gerak Y */
    pemain.y += pemain.vy; pemain.tanah = false;
    l = pemain.x + 2; r = pemain.x + pemain.w - 2; tp = pemain.y; bt = pemain.y + pemain.h;
    if (pemain.vy > 0 && (padat(tile(l, bt)) || padat(tile(r, bt)))) { pemain.y = Math.floor(bt / T) * T - pemain.h; pemain.vy = 0; pemain.tanah = true; }
    if (pemain.vy < 0 && (padat(tile(l, tp)) || padat(tile(r, tp)))) {
      pemain.y = (Math.floor(tp / T) + 1) * T; pemain.vy = 0;
      var hx = padat(tile(l, tp)) ? l : r, t = tile(hx, tp);
      if (t === 3) { setTile(hx, tp, 11); koin++; skor += 200; A.SFX.point(); koinAnim.push({ x: Math.floor(hx / T) * T + T / 2, y: Math.floor(tp / T) * T, t: 0 }); if (Math.random() < 0.25) { musuh.push({ x: Math.floor(hx / T) * T, y: Math.floor(tp / T) * T - T, vx: 1.2, j: 'power', hidup: true, w: T - 4, h: T - 4 }); } }
      else if (t === 2 && besar) { setTile(hx, tp, 0); skor += 50; A.SFX.crash(); for (var i = 0; i < 6; i++) partikel.push({ x: hx, y: tp, vx: A.rand(-3, 3), vy: A.rand(-6, -2), a: 1, w: '#b5651d' }); }
      else A.SFX.jump && A.SFX.jump();
    }
    /* koin */
    var cx = pemain.x + pemain.w / 2, cy = pemain.y + pemain.h / 2;
    if (tile(cx, cy) === 10) { setTile(cx, cy, 0); koin++; skor += 100; A.SFX.point(); } if (tile(cx, pemain.y + 4) === 10) { setTile(cx, pemain.y + 4, 0); koin++; skor += 100; A.SFX.point(); }
    /* bendera */
    if (tile(cx, cy) === 8 || tile(cx, cy) === 9) { menang = true; skor += 5000 + waktu * 10; A.setScore(skor); A.SFX.level(); A.setStatus('LEVEL SELESAI!', 'bonus waktu ' + waktu * 10); }
    if (pemain.y > H + 40) { invul = 0; mati(); }
    /* musuh */
    for (var m = musuh.length - 1; m >= 0; m--) {
      var e = musuh[m]; if (!e.hidup) { e.matiT = (e.matiT || 0) + 1; if (e.matiT > 30) musuh.splice(m, 1); continue; }
      if (Math.abs(e.x - pemain.x) > W * 1.2) continue;
      e.vy = (e.vy || 0) + GRAV; e.y += e.vy;
      if (padat(tile(e.x + 4, e.y + e.h)) || padat(tile(e.x + e.w - 4, e.y + e.h))) { e.y = Math.floor((e.y + e.h) / T) * T - e.h; e.vy = 0; }
      e.x += e.vx * (e.j === 'cangkang' ? 6 : 1);
      var depan = e.vx > 0 ? e.x + e.w : e.x;
      if (padat(tile(depan, e.y + e.h / 2)) || (e.j !== 'cangkang' && !padat(tile(depan, e.y + e.h + 2)))) { e.vx *= -1; e.x += e.vx * 2; }
      if (e.y > H + 40) { musuh.splice(m, 1); continue; }
      /* cangkang meluncur menabrak musuh lain */
      if (e.j === 'cangkang') musuh.forEach(function (o) { if (o !== e && o.hidup && o.j !== 'cangkang' && Math.abs(o.x - e.x) < T && Math.abs(o.y - e.y) < T) { o.hidup = false; skor += 400; A.SFX.point(); } });
      /* tabrakan pemain */
      if (pemain.x < e.x + e.w && pemain.x + pemain.w > e.x && pemain.y < e.y + e.h && pemain.y + pemain.h > e.y) {
        if (e.j === 'power') { musuh.splice(m, 1); besar = true; pemain.h = 40; pemain.y -= 10; skor += 1000; A.SFX.level(); continue; }
        if (pemain.vy > 0 && pemain.y + pemain.h - e.y < 16) {
          pemain.vy = -8; skor += e.j === 'kura' ? 200 : 100; A.SFX.point();
          if (e.j === 'kura') { e.j = 'cangkang'; e.vx = 0; e.h = T - 10; } else if (e.j === 'cangkang') { e.vx = e.vx === 0 ? (pemain.x < e.x ? 1 : -1) : 0; } else e.hidup = false;
        } else if (e.j === 'cangkang' && e.vx === 0) { e.vx = pemain.x < e.x ? 1 : -1; e.x += e.vx * 8; }
        else mati();
      }
    }
    kamera = Math.max(kamera, pemain.x - W * 0.4); kamera = Math.min(kamera, LEBAR_DUNIA * T - W);
    for (var p = partikel.length - 1; p >= 0; p--) { var q = partikel[p]; q.x += q.vx; q.y += q.vy; q.vy += 0.3; q.a -= 0.04; if (q.a <= 0) partikel.splice(p, 1); }
    for (var ka = koinAnim.length - 1; ka >= 0; ka--) { koinAnim[ka].t++; if (koinAnim[ka].t > 24) koinAnim.splice(ka, 1); }
    A.setScore(skor); A.setProgress(pemain.x / (LEBAR_DUNIA * T));
  }
  function blok (x, y, t) {
    var sx = x * T - kamera, sy = y * T;
    if (t === 1) { ctx.fillStyle = '#c84c0c'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#f8b878'; ctx.fillRect(sx + 2, sy + 2, T - 4, T / 2 - 3); ctx.fillRect(sx + 2, sy + T / 2 + 1, T / 2 - 3, T / 2 - 3); ctx.fillRect(sx + T / 2 + 1, sy + T / 2 + 1, T / 2 - 3, T / 2 - 3); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy + T - 2, T, 2); }
    else if (t === 2) { ctx.fillStyle = '#c84c0c'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy + T / 2 - 1, T, 2); ctx.fillRect(sx + T / 2 - 1, sy, 2, T / 2); ctx.fillRect(sx, sy + T / 2, 2, T / 2); ctx.fillRect(sx + T - 2, sy + T / 2, 2, T / 2); ctx.fillRect(sx, sy + T - 2, T, 2); }
    else if (t === 3) { ctx.fillStyle = frame % 40 < 20 ? '#f8b800' : '#e89800'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, T, 2); ctx.fillRect(sx, sy + T - 2, T, 2); ctx.fillRect(sx, sy, 2, T); ctx.fillRect(sx + T - 2, sy, 2, T); ctx.font = '900 20px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#c84c0c'; ctx.fillText('?', sx + T / 2, sy + T / 2 + 1); }
    else if (t === 11) { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, T, 2); ctx.fillRect(sx, sy + T - 2, T, 2); ctx.fillRect(sx, sy, 2, T); ctx.fillRect(sx + T - 2, sy, 2, T); }
    else if (t === 4 || t === 5 || t === 6) { ctx.fillStyle = '#00a800'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#80d010'; ctx.fillRect(sx + 4, sy, 6, T); ctx.fillStyle = '#004000'; ctx.fillRect(sx + T - 5, sy, 5, T); if (t === 5 || t === 6) { ctx.fillStyle = '#00a800'; ctx.fillRect(sx - (t === 5 ? 4 : 0), sy, T + 4, T / 2 + 4); ctx.fillStyle = '#004000'; ctx.fillRect(sx - (t === 5 ? 4 : 0), sy + T / 2 + 2, T + 4, 2); } }
    else if (t === 7) { ctx.fillStyle = '#c0c0c0'; ctx.fillRect(sx, sy, T, T); ctx.fillStyle = '#404040'; ctx.fillRect(sx, sy + T - 3, T, 3); ctx.fillRect(sx + T - 3, sy, 3, T); ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, T, 3); ctx.fillRect(sx, sy, 3, T); }
    else if (t === 8) { ctx.fillStyle = '#00a800'; ctx.fillRect(sx + T / 2 - 2, sy, 4, T); }
    else if (t === 9) { ctx.fillStyle = '#00a800'; ctx.fillRect(sx + T / 2 - 2, sy, 4, T); ctx.fillStyle = '#e0e0e0'; ctx.beginPath(); ctx.arc(sx + T / 2, sy, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f8f8f8'; ctx.beginPath(); ctx.moveTo(sx + T / 2 - 2, sy + 6); ctx.lineTo(sx + T / 2 - 26, sy + 16); ctx.lineTo(sx + T / 2 - 2, sy + 26); ctx.fill(); ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.arc(sx + T / 2 - 14, sy + 16, 4, 0, Math.PI * 2); ctx.fill(); }
    else if (t === 10) { ctx.fillStyle = '#f8b800'; ctx.beginPath(); ctx.ellipse(sx + T / 2, sy + T / 2, Math.max(2, 9 * Math.abs(Math.cos(frame / 8 + x))), 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#c86800'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function gambarPemain () {
    if (invul > 0 && Math.floor(frame / 4) % 2) return;
    var x = pemain.x - kamera, y = pemain.y, w = pemain.w, h = pemain.h, d = pemain.hadap;
    ctx.save(); if (d < 0) { ctx.translate(x + w, 0); ctx.scale(-1, 1); x = 0; }
    var lari = Math.abs(pemain.vx) > 0.5 && pemain.tanah ? Math.floor(frame / 5) % 2 : 0;
    /* sepatu */
    ctx.fillStyle = '#8b4513'; ctx.fillRect(x + 2 + lari * 4, y + h - 5, 10, 5); ctx.fillRect(x + w - 12 - lari * 4, y + h - 5, 10, 5);
    /* overall biru */
    ctx.fillStyle = '#1e40af'; ctx.fillRect(x + 4, y + h - 17, w - 8, 12);
    /* baju merah */
    ctx.fillStyle = '#e52521'; ctx.fillRect(x + 2, y + h - 22, w - 4, 8); ctx.fillRect(x, y + h - 20, 4, 8); ctx.fillRect(x + w - 4, y + h - 20, 4, 8);
    ctx.fillStyle = '#1e40af'; ctx.fillRect(x + 6, y + h - 22, 4, 5); ctx.fillRect(x + w - 10, y + h - 22, 4, 5); ctx.fillStyle = '#f8b800'; ctx.fillRect(x + 6, y + h - 17, 3, 3); ctx.fillRect(x + w - 9, y + h - 17, 3, 3);
    /* tangan */
    ctx.fillStyle = '#fbd3a0'; ctx.fillRect(x - 2, y + h - 14, 5, 5); ctx.fillRect(x + w - 3, y + h - 14 - lari * 3, 5, 5);
    /* kepala & kumis */
    var ky = y + (besar ? 4 : 0);
    ctx.fillStyle = '#fbd3a0'; ctx.fillRect(x + 4, ky + 7, w - 6, 9);
    ctx.fillStyle = '#6b3a12'; ctx.fillRect(x + 3, ky + 7, 4, 8); ctx.fillRect(x + 10, ky + 13, w - 10, 3);
    ctx.fillStyle = '#000'; ctx.fillRect(x + 12, ky + 9, 2, 3);
    ctx.fillStyle = '#fbd3a0'; ctx.fillRect(x + w - 4, ky + 10, 4, 4);
    /* topi merah */
    ctx.fillStyle = '#e52521'; ctx.fillRect(x + 3, ky + 2, w - 4, 5); ctx.fillRect(x + 6, ky, w - 8, 3); ctx.fillRect(x + 8, ky + 6, w, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 9, ky + 2, 5, 4); ctx.fillStyle = '#e52521'; ctx.fillRect(x + 11, ky + 3, 1, 2);
    ctx.restore();
  }
  function gambarMusuh (e) {
    var x = e.x - kamera, y = e.y;
    if (x < -T || x > W + T) return;
    if (!e.hidup) { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x, y + e.h - 10, e.w, 10); return; }
    if (e.j === 'jamur') { ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(x + e.w / 2, y + 12, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(x, y + 12, e.w, 8); ctx.fillStyle = '#fbd3a0'; ctx.fillRect(x + 4, y + 18, e.w - 8, 6); ctx.fillStyle = '#000'; ctx.fillRect(x + 6, y + 19, 4, 3); ctx.fillRect(x + e.w - 10, y + 19, 4, 3); ctx.fillStyle = '#000'; var f = Math.floor(frame / 8) % 2; ctx.fillRect(x + 2 + f * 3, y + 24, 9, 6); ctx.fillRect(x + e.w - 11 - f * 3, y + 24, 9, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x + 8, y + 4, 4, 6); ctx.fillRect(x + e.w - 12, y + 4, 4, 6); ctx.fillStyle = '#000'; ctx.fillRect(x + 9, y + 6, 2, 3); ctx.fillRect(x + e.w - 11, y + 6, 2, 3); }
    else if (e.j === 'kura') { ctx.fillStyle = '#f8f8a0'; ctx.fillRect(x + (e.vx < 0 ? 0 : e.w - 10), y, 10, 14); ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.ellipse(x + e.w / 2, y + 20, 13, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f8f8a0'; ctx.fillRect(x + 4, y + 26, 6, 4); ctx.fillRect(x + e.w - 10, y + 26, 6, 4); ctx.fillStyle = '#004000'; ctx.beginPath(); ctx.moveTo(x + e.w / 2, y + 11); ctx.lineTo(x + e.w / 2, y + 29); ctx.moveTo(x + 4, y + 20); ctx.lineTo(x + e.w - 4, y + 20); ctx.stroke(); ctx.fillStyle = '#000'; ctx.fillRect(x + (e.vx < 0 ? 2 : e.w - 6), y + 4, 3, 3); }
    else if (e.j === 'cangkang') { ctx.fillStyle = '#00a800'; ctx.beginPath(); ctx.ellipse(x + e.w / 2, y + e.h / 2 + 2, 14, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f8f8a0'; ctx.fillRect(x + 2, y + e.h - 4, e.w - 4, 4); }
    else if (e.j === 'power') { ctx.fillStyle = '#e52521'; ctx.beginPath(); ctx.arc(x + e.w / 2, y + 14, 14, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 8, y + 8, 4, 0, Math.PI * 2); ctx.arc(x + e.w - 8, y + 8, 4, 0, Math.PI * 2); ctx.arc(x + e.w / 2, y + 3, 3, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fbd3a0'; ctx.fillRect(x + 6, y + 14, e.w - 12, 12); ctx.fillStyle = '#000'; ctx.fillRect(x + 9, y + 17, 2, 4); ctx.fillRect(x + e.w - 11, y + 17, 2, 4); }
  }
  function draw () {
    ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, W, H);
    /* bukit & awan latar */
    ctx.fillStyle = '#00a800'; for (var b = 0; b < 6; b++) { var bx = ((b * 380 - kamera * 0.3) % (W + 400) + W + 400) % (W + 400) - 200; ctx.beginPath(); ctx.moveTo(bx - 90, (ROWS - 2) * T); ctx.quadraticCurveTo(bx, (ROWS - 2) * T - 110, bx + 90, (ROWS - 2) * T); ctx.fill(); }
    ctx.fillStyle = '#fff'; for (var a = 0; a < 5; a++) { var ax = ((a * 300 - kamera * 0.5) % (W + 300) + W + 300) % (W + 300) - 100, ay = 50 + (a * 37) % 70; ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI * 2); ctx.arc(ax + 20, ay - 8, 20, 0, Math.PI * 2); ctx.arc(ax + 42, ay, 15, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#80d010'; for (var s = 0; s < 8; s++) { var sxx = ((s * 230 - kamera) % (LEBAR_DUNIA * T) + LEBAR_DUNIA * T) % (LEBAR_DUNIA * T); if (sxx < W + 40) { ctx.beginPath(); ctx.arc(sxx, (ROWS - 2) * T, 14, Math.PI, 0); ctx.arc(sxx + 20, (ROWS - 2) * T, 18, Math.PI, 0); ctx.arc(sxx + 42, (ROWS - 2) * T, 12, Math.PI, 0); ctx.fill(); } }
    var x0 = Math.max(0, Math.floor(kamera / T)), x1 = Math.min(LEBAR_DUNIA - 1, x0 + Math.ceil(W / T) + 1);
    for (var x = x0; x <= x1; x++) for (var y = 0; y < ROWS; y++) if (peta[x][y]) blok(x, y, peta[x][y]);
    for (var k = 0; k < koinAnim.length; k++) { var ka = koinAnim[k]; ctx.fillStyle = '#f8b800'; ctx.beginPath(); ctx.ellipse(ka.x - kamera, ka.y - ka.t * 3 + (ka.t > 12 ? (ka.t - 12) * 5 : 0), 6, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    musuh.forEach(gambarMusuh); gambarPemain();
    for (var p = 0; p < partikel.length; p++) { ctx.globalAlpha = partikel[p].a; ctx.fillStyle = partikel[p].w; ctx.fillRect(partikel[p].x - kamera, partikel[p].y, 8, 8); } ctx.globalAlpha = 1;
    /* HUD ala NES */
    ctx.fillStyle = '#fff'; ctx.font = '900 14px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('MARIO', 16, 20); ctx.fillText(String(skor).padStart(6, '0'), 16, 36);
    ctx.fillStyle = '#f8b800'; ctx.beginPath(); ctx.ellipse(W * 0.34, 31, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('x' + String(koin).padStart(2, '0'), W * 0.34 + 8, 36);
    ctx.fillText('WORLD', W * 0.55, 20); ctx.fillText(' 1-' + level, W * 0.55, 36);
    ctx.fillText('TIME', W * 0.78, 20); ctx.fillText(String(waktu).padStart(3, '0'), W * 0.78, 36);
    ctx.fillText('❤'.repeat(Math.max(0, nyawa)), W - 60, 36);
    if (over || menang) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H * 0.32, W, 110); ctx.textAlign = 'center'; ctx.fillStyle = menang ? '#f8b800' : '#fff'; ctx.font = '900 30px monospace'; ctx.fillText(menang ? 'COURSE CLEAR!' : 'GAME OVER', W / 2, H * 0.32 + 46); ctx.font = '900 14px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('SKOR ' + skor + ' · KOIN ' + koin, W / 2, H * 0.32 + 72); ctx.fillText(menang ? '● / ▲ lanjut world 1-' + (level + 1) : '● / ▲ main lagi', W / 2, H * 0.32 + 94); }
    A.state = { x: pemain.x, y: pemain.y, skor: skor, koin: koin, nyawa: nyawa, over: over, menang: menang, besar: besar, musuh: musuh.length, level: level };
  }
  function loop () { update(); draw(); requestAnimationFrame(loop); }
  function lompat () { A.initAudio(); if (menang) { level++; mulaiLevel(); return; } if (over) { reset(); return; } if (pemain.tanah) { pemain.vy = besar ? -12 : -11; A.SFX.jump(); } }
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') { kiri = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { kanan = true; e.preventDefault(); }
    else if ((k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') && !e.repeat) { lompat(); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { jongkok = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') kiri = false; else if (k === 'ArrowRight' || k === 'KeyD') kanan = false; else if (k === 'ArrowDown' || k === 'KeyS') jongkok = false;
    else if ((k === 'ArrowUp' || k === 'KeyW' || k === 'Space' || k === 'Enter') && pemain.vy < -4) pemain.vy = -4;
  });
  /* sentuh: kiri layar = jalan kiri/kanan (setengah), kanan layar = lompat */
  var sentuh = {};
  function handle (e) { kiri = false; kanan = false; for (var i = 0; i < e.touches.length; i++) { var r = c.getBoundingClientRect(); var tx = (e.touches[i].clientX - r.left) / r.width; if (tx < 0.25) kiri = true; else if (tx < 0.5) kanan = true; } }
  c.addEventListener('touchstart', function (e) { var r = c.getBoundingClientRect(); var tx = (e.changedTouches[0].clientX - r.left) / r.width; if (tx >= 0.5) lompat(); handle(e); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchmove', function (e) { handle(e); e.preventDefault(); }, { passive: false });
  c.addEventListener('touchend', function (e) { handle(e); e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function () { lompat(); });
  reset(); requestAnimationFrame(loop);
`
export function marioHtml (brand = 'THERYHANN!') {
  return shell('Super Jump', brand, MARIO_JS, {
    w: 640, h: 416, maxw: 640, sub: 'ARCADE', pad: 'udlra', padStyle: 'mario',
    hint: '◀ ▶ jalan (tahan) · ▲ / ● lompat (tahan = lebih tinggi) · injak musuh · pukul kotak ? dari bawah untuk koin/jamur · capai bendera · sentuh: kiri layar jalan, kanan layar lompat'
  })
}

export const ARCADE_6 = [
  { id: 'candycrush', cmd: 'candycrush', icon: '🍬', nama: 'Candy Crush', title: 'Candy Crush', ket: 'match-3 permen, permen bergaris & bom warna, target per level — ▲▼◀▶ ●', ratio: '480×640', html: candyHtml },
  { id: 'templerun', cmd: 'templerun', icon: '🏛️', nama: 'Temple Run', title: 'Temple Run', ket: 'lari lorong kuil, belok di tikungan, lompat akar, slide api, monyet iblis — ◀▶ ▲ ▼', ratio: '480×760', html: templeHtml },
  { id: 'angrybirds', cmd: 'angrybirds', icon: '🐦', nama: 'Angry Birds', title: 'Angry Birds', ket: 'ketapel burung merah/kuning/hitam ke babi hijau, kayu·es·batu — ◀▶ sudut ▲▼ tenaga ● tembak', ratio: '720×440', html: angryHtml },
  { id: 'superjump', cmd: 'superjump', icon: '🍄', nama: 'Super Jump (Mario)', title: 'Super Jump', ket: 'platformer ala Mario: bata, kotak ?, koin, kura-kura, jamur, pipa, bendera — ◀▶ ▲/●', ratio: '640×416', html: marioHtml },
  { id: 'nekopark', cmd: 'nekopark', icon: '🐱', nama: 'Neko Park · Sakura (online)', title: 'Neko Park', ket: 'taman kucing: bom jauh/dekat, home-run, pancing, emote, chat, koin — pemain lain = member grup', ratio: '576×832', html: b => nekoParkHtml(b, {}) }
]

export default { candyHtml, templeHtml, angryHtml, marioHtml, ARCADE_6 }
