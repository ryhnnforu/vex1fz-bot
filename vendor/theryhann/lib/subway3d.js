/**
 * ============================================================
 *  lib/subway3d.js — SUBWAY SURF "RUPA ASLI" 3D (v7.9.0)
 * ------------------------------------------------------------
 *  Kamera 3rd-person di belakang Jake, 3 rel dengan kereta
 *  besar warna-warni (merah, kuning, biru, hijau) + kereta
 *  beratap datar yang bisa dinaiki lewat ramp, palang
 *  lompat/guling, tembok grafiti kiri-kanan, lampu & rambu,
 *  koin melayang lengkung, jetpack & hoverboard, polisi + anjing
 *  mengejar. Kontrol: ◀▶ jalur · ▲ lompat · ▼ guling · ● hoverboard
 *  · geser layar. Sama seperti arcade lain (shell(), lbgame).
 * ============================================================
 */
import { shell } from './htmlgames.js'

const SUBWAY3D_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  /* ---------- kamera & proyeksi ---------- */
  var F = 300, CAM_Z = -2.6, CAM_H = 2.4, HORIZON = H * 0.42, LANE_W = 1.0;
  var TRAIN_H = 1.7, TRAIN_W = 0.9, JAUH = 60;
  function P (x, y, z) { var s = F / Math.max(0.15, z - CAM_Z); return { x: W / 2 + x * s, y: HORIZON + (CAM_H - y) * s, s: s }; }
  /* ---------- state ---------- */
  var lane, laneX, y, vy, guling, hover, jet, mulai, over, mati, frame, kec, jarak, koin, skor, obj, part, kejar, diRel, mult, goyangCam, warnaSeq;
  var WARNA = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa'];
  function reset () {
    lane = 1; laneX = 1; y = 0; vy = 0; guling = 0; hover = 0; jet = 0; mulai = false; over = false; mati = 0; frame = 0;
    kec = 0.28; jarak = 0; koin = 0; skor = 0; obj = []; part = []; kejar = 1.0; diRel = -1; mult = 1; goyangCam = 0; warnaSeq = 0;
    A.setScore(0); A.setBest(); A.setStatus('KETUK UNTUK LARI', '🪙 0'); A.setProgress(0);
    seedAwal();
  }
  /* ---------- spawn ---------- */
  var nextZ = 18;
  function seedAwal () { nextZ = 26; for (var i = 0; i < 6; i++) spawnPola(); }
  function acak (n) { return Math.floor(Math.random() * n); }
  function koinBaris (l, z0, n, tinggi, lengkung) {
    for (var i = 0; i < n; i++) { var yy = tinggi || 0.55; if (lengkung) yy = 0.55 + Math.sin(i / (n - 1) * Math.PI) * 1.6; obj.push({ j: 'koin', lane: l, z: z0 + i * 0.9, y: yy, pjg: 0.3 }); }
  }
  function spawnPola () {
    var z = nextZ, pola = acak(9), bebas = acak(3), l;
    if (pola <= 2) {
      /* 1–2 kereta panjang, satu jalur kosong (mungkin dengan palang) */
      for (l = 0; l < 3; l++) if (l !== bebas && Math.random() < 0.8) obj.push({ j: 'kereta', lane: l, z: z, pjg: 7 + acak(7), w: WARNA[(warnaSeq++) % WARNA.length], ramp: Math.random() < 0.45, atapKoin: Math.random() < 0.5 });
      if (Math.random() < 0.5) obj.push({ j: Math.random() < 0.5 ? 'palang_lompat' : 'palang_guling', lane: bebas, z: z + 3 + acak(4), pjg: 0.5 });
      koinBaris(bebas, z + 1, 6, 0.55, false);
      obj.forEach(function (o) { if (o.j === 'kereta' && o.z === z && o.atapKoin) koinBaris(o.lane, z + 1.5, 5, TRAIN_H + 0.5, false); });
      nextZ = z + 16 + acak(6);
    } else if (pola <= 4) {
      /* barisan palang */
      for (l = 0; l < 3; l++) { if (l === bebas) continue; obj.push({ j: ['palang_lompat', 'palang_guling', 'barrier'][acak(3)], lane: l, z: z + acak(3), pjg: 0.5 }); }
      koinBaris(bebas, z - 1, 7, 0.55, false);
      nextZ = z + 9 + acak(4);
    } else if (pola === 5) {
      /* kereta bergerak melawan arah */
      l = acak(3); obj.push({ j: 'kereta', lane: l, z: z + 20, pjg: 6, w: WARNA[(warnaSeq++) % WARNA.length], gerak: 0.22, ramp: false, lampu: true });
      koinBaris((l + 1) % 3, z, 6, 0.55, true);
      nextZ = z + 12;
    } else if (pola === 6) {
      /* terowongan + koin lengkung */
      obj.push({ j: 'terowongan', lane: 1, z: z, pjg: 10 });
      koinBaris(acak(3), z + 1, 8, 0.55, true);
      if (Math.random() < 0.5) obj.push({ j: 'barrier', lane: acak(3), z: z + 5, pjg: 0.5 });
      nextZ = z + 14;
    } else if (pola === 7) {
      /* power-up */
      obj.push({ j: Math.random() < 0.5 ? 'hover' : 'jet', lane: acak(3), z: z, pjg: 0.5, y: 0.6 });
      koinBaris(acak(3), z + 2, 5, 0.55, false);
      nextZ = z + 8;
    } else {
      /* kereta 3 jalur beda panjang, lompat dari atap ke atap */
      for (l = 0; l < 3; l++) obj.push({ j: 'kereta', lane: l, z: z + l * 2, pjg: 5 + acak(4), w: WARNA[(warnaSeq++) % WARNA.length], ramp: l === bebas, atapKoin: true });
      for (l = 0; l < 3; l++) koinBaris(l, z + l * 2 + 1.5, 4, TRAIN_H + 0.5, false);
      nextZ = z + 18;
    }
  }
  /* ---------- logika ---------- */
  function tabrak (o) {
    if (hover > 0) { hover = 0; A.SFX.crash(); goyangCam = 12; if (o) o.mati = true; return; }
    over = true; mati = 1; A.SFX.crash(); goyangCam = 16;
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    A.setStatus('TERTANGKAP!', '🪙 ' + koin + ' · ' + Math.floor(jarak) + ' m');
  }
  function tinggiLantai () {
    /* atap kereta di bawah pemain (z sekitar 0) */
    var t = 0;
    for (var i = 0; i < obj.length; i++) { var o = obj[i]; if (o.j === 'kereta' && o.lane === Math.round(laneX) && o.z <= 0.3 && o.z + o.pjg >= -0.3) t = Math.max(t, TRAIN_H); }
    return t;
  }
  function update () {
    frame++;
    laneX += (lane - laneX) * 0.22;
    if (goyangCam > 0) goyangCam--;
    if (!mulai) return;
    if (over) { mati++; kejar = Math.max(0.2, kejar - 0.03); return; }
    kec = Math.min(0.62, 0.28 + jarak / 2500);
    var dz = kec * (jet > 0 ? 1.4 : 1);
    jarak += dz * 1.2; mult = 1 + Math.floor(jarak / 400);
    skor = Math.floor(jarak) * mult + koin * 5; A.setScore(skor);
    A.setStatus(Math.floor(jarak) + ' m · x' + mult + (hover > 0 ? ' · 🛹' + Math.ceil(hover / 60) : '') + (jet > 0 ? ' · 🚀' + Math.ceil(jet / 60) : ''), '🪙 ' + koin);
    A.setProgress((jarak % 400) / 400);
    if (kejar < 1) kejar = Math.min(1, kejar + 0.004);
    /* gravitasi & lantai */
    var lantai = jet > 0 ? 4.2 : tinggiLantai();
    if (jet > 0) { y += (lantai - y) * 0.1; vy = 0; }
    else { vy -= 0.055; y += vy; if (y <= lantai) { if (y < lantai - 0.4 && vy < -0.2 && lantai > 0) { /* mendarat di atap */ } y = lantai; vy = 0; } }
    if (guling > 0) guling--;
    if (hover > 0) hover--;
    if (jet > 0) { jet--; if (jet % 6 === 0) koinBaris(acak(3), 8, 1, 4.2, false); }
    /* gerak objek */
    for (var i = obj.length - 1; i >= 0; i--) {
      var o = obj[i]; o.z -= dz + (o.gerak || 0);
      if (o.z + o.pjg < -4) { obj.splice(i, 1); continue; }
      if (o.mati) continue;
      var dekatLane = Math.abs(laneX - o.lane) < 0.5;
      if (!dekatLane) continue;
      var kena = o.z < 0.35 && o.z + o.pjg > -0.35;
      if (!kena) continue;
      if (o.j === 'koin') { if (Math.abs(y - o.y + 0.5) < 1.1) { koin++; A.SFX.point(); obj.splice(i, 1); ledak(o.lane, o.y, '#ffd54f'); } continue; }
      if (o.j === 'hover') { hover = 60 * 12; A.SFX.level(); obj.splice(i, 1); continue; }
      if (o.j === 'jet') { jet = 60 * 6; A.SFX.level(); obj.splice(i, 1); continue; }
      if (o.j === 'terowongan') continue;
      if (o.j === 'kereta') {
        if (jet > 0) continue;
        if (y >= TRAIN_H - 0.15) continue; /* di atas atap */
        if (o.ramp && o.z > -0.6 && o.z < 0.8) { y = Math.max(y, Math.min(TRAIN_H, y + 0.25)); if (y >= TRAIN_H - 0.15) { y = TRAIN_H; vy = 0; } continue; }
        if (o.z > -0.5 && o.z < 0.6 && vy > 0 && y > TRAIN_H * 0.5) continue;
        tabrak(o); if (over) return; continue;
      }
      if (o.j === 'barrier') { if (y < 0.8 && jet <= 0) { tabrak(o); if (over) return; } continue; }
      if (o.j === 'palang_lompat') { if (y < 0.9 && jet <= 0) { tabrak(o); if (over) return; } continue; }
      if (o.j === 'palang_guling') { if (guling <= 0 && y < 1.4 && jet <= 0) { tabrak(o); if (over) return; } continue; }
    }
    if (nextZ - jarak * 0 < JAUH) { /* nextZ relatif ke pemain: geser saat objek bergerak */ }
    nextZ -= dz;
    while (nextZ < JAUH) spawnPola();
    for (var p = part.length - 1; p >= 0; p--) { var q = part[p]; q.x += q.vx; q.y += q.vy; q.vy += 0.25; q.a -= 0.04; if (q.a <= 0) part.splice(p, 1); }
  }
  function ledak (l, yy, w) { var pr = P((l - 1) * LANE_W, yy, 0); for (var i = 0; i < 7; i++) part.push({ x: pr.x, y: pr.y, vx: A.rand(-3, 3), vy: A.rand(-4, -1), a: 1, w: w }); }

  /* ---------- gambar ---------- */
  function box (x0, x1, y0, y1, z0, z1, warnaDepan, warnaAtas, warnaSisi) {
    var a = P(x0, y1, z0), b = P(x1, y1, z0), cc = P(x1, y0, z0), d = P(x0, y0, z0);
    var e = P(x0, y1, z1), f = P(x1, y1, z1), g = P(x1, y0, z1), h = P(x0, y0, z1);
    /* atas */
    ctx.fillStyle = warnaAtas; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(f.x, f.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fill();
    /* sisi kiri / kanan (yang menghadap kamera) */
    var cx = (x0 + x1) / 2;
    ctx.fillStyle = warnaSisi;
    if (cx > 0.05) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.lineTo(h.x, h.y); ctx.lineTo(e.x, e.y); ctx.closePath(); ctx.fill(); }
    if (cx < -0.05) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(cc.x, cc.y); ctx.lineTo(g.x, g.y); ctx.lineTo(f.x, f.y); ctx.closePath(); ctx.fill(); }
    /* depan */
    ctx.fillStyle = warnaDepan; ctx.fillRect(d.x, a.y, cc.x - d.x, d.y - a.y);
    return { a: a, b: b, c: cc, d: d, e: e, f: f };
  }
  function gelap (hex, k) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')'; }
  function latar () {
    var g = ctx.createLinearGradient(0, 0, 0, HORIZON); g.addColorStop(0, '#5aa9ff'); g.addColorStop(1, '#cfe9ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON + 2);
    /* gedung jauh */
    for (var i = 0; i < 12; i++) { var bw = W / 11, bx = i * bw - ((frame * 0.05) % bw), bh = 50 + ((i * 47) % 80); ctx.fillStyle = i % 2 ? '#7d94b8' : '#93a9cc'; ctx.fillRect(bx, HORIZON - bh, bw - 4, bh); ctx.fillStyle = 'rgba(255,240,180,0.8)'; for (var wy = HORIZON - bh + 6; wy < HORIZON - 6; wy += 10) for (var wx = bx + 4; wx < bx + bw - 10; wx += 9) if ((wx * 7 + wy * 3 + i) % 5 < 2) ctx.fillRect(wx, wy, 4, 5); }
    /* tanah kerikil */
    var gg = ctx.createLinearGradient(0, HORIZON, 0, H); gg.addColorStop(0, '#7a7a7a'); gg.addColorStop(1, '#4b4b4b');
    ctx.fillStyle = gg; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    /* tembok kiri kanan dengan grafiti */
    var offs = (jarak * 1.2) % 6;
    for (var side = -1; side <= 1; side += 2) {
      var wx0 = side * 1.75, wx1 = side * 2.4;
      var q0 = P(wx0, 0, -2), q1 = P(wx0, 2.2, -2), q2 = P(wx0, 2.2, JAUH), q3 = P(wx0, 0, JAUH);
      ctx.fillStyle = side < 0 ? '#9c5f3d' : '#8a5233'; ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y); ctx.lineTo(q3.x, q3.y); ctx.closePath(); ctx.fill();
      /* garis bata */
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
      for (var zz = -offs; zz < JAUH; zz += 6) { var u0 = P(wx0, 0, zz), u1 = P(wx0, 2.2, zz); ctx.beginPath(); ctx.moveTo(u0.x, u0.y); ctx.lineTo(u1.x, u1.y); ctx.stroke(); }
      /* grafiti warna */
      for (var gz = 4 - ((jarak * 1.2) % 24); gz < JAUH; gz += 24) { var g0 = P(wx0, 0.4, gz), g1 = P(wx0, 1.8, gz), g2 = P(wx0, 1.8, gz + 5), g3 = P(wx0, 0.4, gz + 5); ctx.fillStyle = ['#ff4081', '#00e5ff', '#ffea00', '#76ff03'][Math.floor(gz / 24 + side + 9) % 4]; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.lineTo(g3.x, g3.y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
      /* lampu tiang */
      for (var lz = 8 - ((jarak * 1.2) % 16); lz < JAUH; lz += 16) { var t0 = P(wx0 - side * 0.1, 0, lz), t1 = P(wx0 - side * 0.1, 3.2, lz); ctx.strokeStyle = '#333'; ctx.lineWidth = Math.max(1, t0.s * 0.06); ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.stroke(); ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(t1.x - side * t1.s * 0.25, t1.y, Math.max(1.5, t1.s * 0.12), 0, Math.PI * 2); ctx.fill(); }
    }
    /* 3 rel */
    for (var l = 0; l < 3; l++) {
      var cx = (l - 1) * LANE_W;
      var r0 = P(cx - 0.42, 0, -2), r1 = P(cx + 0.42, 0, -2), r2 = P(cx + 0.42, 0, JAUH), r3 = P(cx - 0.42, 0, JAUH);
      ctx.fillStyle = '#5d4b3a'; ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.closePath(); ctx.fill();
      for (var bz = -((jarak * 1.2) % 0.8) - 2; bz < JAUH; bz += 0.8) { var s0 = P(cx - 0.4, 0.02, bz), s1 = P(cx + 0.4, 0.02, bz); var hh = Math.max(1, s0.s * 0.22); ctx.fillStyle = '#3e2f22'; ctx.fillRect(s0.x, s0.y - hh / 2, s1.x - s0.x, hh); }
      ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2;
      for (var k = -1; k <= 1; k += 2) { var v0 = P(cx + k * 0.26, 0.05, -2), v1 = P(cx + k * 0.26, 0.05, JAUH); ctx.beginPath(); ctx.moveTo(v0.x, v0.y); ctx.lineTo(v1.x, v1.y); ctx.stroke(); }
    }
  }
  function gambarObj (o) {
    var cx = (o.lane - 1) * LANE_W, z0 = Math.max(o.z, -2.8), z1 = o.z + o.pjg;
    if (z1 < -2.8) return;
    if (o.j === 'koin') { var pk = P(cx, o.y + 0.5, o.z); if (pk.s < 6) return; var rr = pk.s * 0.16, lebar = Math.abs(Math.cos(frame / 7 + o.z)); ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pk.x, pk.y, Math.max(1, rr * lebar), rr, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); return; }
    if (o.j === 'hover' || o.j === 'jet') { var ph = P(cx, o.y + 0.4 + Math.sin(frame / 8) * 0.1, o.z); if (ph.s < 6) return; ctx.font = Math.round(ph.s * 0.55) + 'px "Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.j === 'hover' ? '🛹' : '🚀', ph.x, ph.y); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(ph.x, ph.y, ph.s * 0.4, 0, Math.PI * 2); ctx.stroke(); return; }
    if (o.j === 'terowongan') {
      var t0 = P(-2.0, 0, z0), t1 = P(2.0, 0, z0), t2 = P(2.0, 3.4, z0), t3 = P(-2.0, 3.4, z0);
      var u2 = P(2.0, 3.4, z1), u3 = P(-2.0, 3.4, z1);
      ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.moveTo(t3.x, t3.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(u2.x, u2.y); ctx.lineTo(u3.x, u3.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#546e7a'; ctx.fillRect(t3.x, t3.y - t3.s * 0.5, t2.x - t3.x, t3.s * 0.5);
      ctx.fillStyle = '#ffeb3b'; ctx.font = '900 ' + Math.round(t3.s * 0.32) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SUBWAY', (t2.x + t3.x) / 2, t3.y - t3.s * 0.25);
      return;
    }
    if (o.j === 'kereta') {
      var wd = o.w, sisi = gelap(wd, 0.72), atas = '#cfd8dc';
      if (o.ramp && o.z > -2.5) {
        /* ramp: bidang miring di depan */
        var ra = P(cx - TRAIN_W / 2, 0, z0), rb = P(cx + TRAIN_W / 2, 0, z0), rc = P(cx + TRAIN_W / 2, TRAIN_H, z0 + 1.6), rd = P(cx - TRAIN_W / 2, TRAIN_H, z0 + 1.6);
        box(cx - TRAIN_W / 2, cx + TRAIN_W / 2, 0, TRAIN_H, z0 + 1.6, z1, wd, atas, sisi);
        ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(rb.x, rb.y); ctx.lineTo(rc.x, rc.y); ctx.lineTo(rd.x, rd.y); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 2; for (var i = 1; i < 4; i++) { var ka = P(cx - TRAIN_W / 2, TRAIN_H * i / 4, z0 + 1.6 * i / 4), kb = P(cx + TRAIN_W / 2, TRAIN_H * i / 4, z0 + 1.6 * i / 4); ctx.beginPath(); ctx.moveTo(ka.x, ka.y); ctx.lineTo(kb.x, kb.y); ctx.stroke(); }
      } else {
        var bx = box(cx - TRAIN_W / 2, cx + TRAIN_W / 2, 0, TRAIN_H, z0, z1, wd, atas, sisi);
        var fw = bx.c.x - bx.d.x, fh = bx.d.y - bx.a.y, fx = bx.d.x, fy = bx.a.y;
        if (fw > 6) {
          /* wajah depan kereta: jendela, lampu, garis */
          ctx.fillStyle = '#263238'; ctx.fillRect(fx + fw * 0.12, fy + fh * 0.12, fw * 0.76, fh * 0.34);
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(fx + fw * 0.14, fy + fh * 0.14, fw * 0.3, fh * 0.3);
          ctx.fillStyle = o.gerak ? '#fff59d' : '#eceff1'; ctx.fillRect(fx + fw * 0.08, fy + fh * 0.66, fw * 0.16, fh * 0.12); ctx.fillRect(fx + fw * 0.76, fy + fh * 0.66, fw * 0.16, fh * 0.12);
          ctx.fillStyle = gelap(wd, 0.6); ctx.fillRect(fx, fy + fh * 0.88, fw, fh * 0.12);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(fx, fy + fh * 0.52, fw, fh * 0.06);
        }
        /* jendela di sisi */
        var sisiX = cx > 0 ? cx - TRAIN_W / 2 : cx + TRAIN_W / 2;
        if (Math.abs(cx) > 0.05) { ctx.fillStyle = 'rgba(200,230,255,0.75)'; for (var jz = Math.max(z0, -2.5) + 0.6; jz < z1 - 0.6; jz += 1.3) { var j0 = P(sisiX, TRAIN_H * 0.62, jz), j1 = P(sisiX, TRAIN_H * 0.9, jz), j2 = P(sisiX, TRAIN_H * 0.9, jz + 0.8), j3 = P(sisiX, TRAIN_H * 0.62, jz + 0.8); ctx.beginPath(); ctx.moveTo(j0.x, j0.y); ctx.lineTo(j1.x, j1.y); ctx.lineTo(j2.x, j2.y); ctx.lineTo(j3.x, j3.y); ctx.closePath(); ctx.fill(); } }
      }
      return;
    }
    if (o.j === 'barrier') { box(cx - TRAIN_W / 2, cx + TRAIN_W / 2, 0.35, 0.75, z0, z0 + 0.25, '#ffb300', '#ffca28', '#ff8f00'); var b0 = P(cx - TRAIN_W / 2, 0.75, z0), b1 = P(cx + TRAIN_W / 2, 0.35, z0); ctx.fillStyle = '#212121'; for (var i = 0; i < 4; i++) ctx.fillRect(b0.x + (b1.x - b0.x) * (i / 4), b0.y, (b1.x - b0.x) / 8, b1.y - b0.y); ctx.fillStyle = '#616161'; ctx.fillRect(b0.x, b1.y, Math.max(2, b0.s * 0.05), P(cx, 0, z0).y - b1.y); ctx.fillRect(b1.x - Math.max(2, b0.s * 0.05), b1.y, Math.max(2, b0.s * 0.05), P(cx, 0, z0).y - b1.y); return; }
    if (o.j === 'palang_lompat') { var pa = P(cx - TRAIN_W / 2, 0, z0), pb = P(cx + TRAIN_W / 2, 0, z0), pt = P(cx, 0.85, z0); ctx.fillStyle = '#757575'; ctx.fillRect(pa.x, pt.y, Math.max(2, pa.s * 0.06), pa.y - pt.y); ctx.fillRect(pb.x - Math.max(2, pa.s * 0.06), pt.y, Math.max(2, pa.s * 0.06), pa.y - pt.y); ctx.fillStyle = '#e53935'; ctx.fillRect(pa.x, pt.y, pb.x - pa.x, Math.max(2, pa.s * 0.16)); ctx.fillStyle = '#fff'; for (var i = 0; i < 3; i++) ctx.fillRect(pa.x + (pb.x - pa.x) * (i * 2 + 0.5) / 6, pt.y, (pb.x - pa.x) / 6, Math.max(2, pa.s * 0.16)); return; }
    if (o.j === 'palang_guling') { var qa = P(cx - TRAIN_W / 2, 0, z0), qb = P(cx + TRAIN_W / 2, 0, z0), qt = P(cx, 2.2, z0), qm = P(cx, 1.15, z0); ctx.fillStyle = '#757575'; ctx.fillRect(qa.x, qt.y, Math.max(2, qa.s * 0.06), qa.y - qt.y); ctx.fillRect(qb.x - Math.max(2, qa.s * 0.06), qt.y, Math.max(2, qa.s * 0.06), qa.y - qt.y); ctx.fillStyle = '#e53935'; ctx.fillRect(qa.x, qm.y, qb.x - qa.x, qt.y - qm.y < 0 ? 2 : Math.max(2, (qa.y - qt.y) * 0.5)); ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.max(6, Math.round(qa.s * 0.16)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GULING ▼', (qa.x + qb.x) / 2, qm.y + Math.max(2, (qa.y - qt.y) * 0.25)); return; }
  }
  function pemain () {
    var x = (laneX - 1) * LANE_W, pb = P(x, y, 0.2), s = pb.s * 1.0;
    var tinggi = guling > 0 ? 0.6 : 1.15;
    /* bayangan */
    var sh = P(x, tinggiLantai(), 0.2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, Math.abs(s * 0.3), Math.abs(s * 0.08), 0, 0, Math.PI * 2); ctx.fill();
    var u = s; /* unit piksel */
    var gx = pb.x, gy = pb.y;
    var lari = mulai && !over && y <= tinggiLantai() + 0.01 && guling <= 0 ? Math.sin(frame / 2.5) : 0;
    if (hover > 0) { ctx.fillStyle = '#ff6f00'; ctx.beginPath(); ctx.ellipse(gx, gy - u * 0.02 + Math.sin(frame / 4) * 2, u * 0.34, u * 0.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(gx - u * 0.2, gy - u * 0.05, u * 0.4, u * 0.03); gy -= u * 0.1; }
    if (jet > 0) { ctx.fillStyle = '#9e9e9e'; ctx.fillRect(gx - u * 0.22, gy - u * 0.95, u * 0.44, u * 0.5); ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.moveTo(gx - u * 0.18, gy - u * 0.45); ctx.lineTo(gx - u * 0.08, gy - u * 0.05 + Math.random() * u * 0.2); ctx.lineTo(gx + 0, gy - u * 0.45); ctx.fill(); ctx.beginPath(); ctx.moveTo(gx + 0, gy - u * 0.45); ctx.lineTo(gx + u * 0.08, gy - u * 0.05 + Math.random() * u * 0.2); ctx.lineTo(gx + u * 0.18, gy - u * 0.45); ctx.fill(); }
    /* sepatu */
    ctx.fillStyle = '#fafafa'; ctx.fillRect(gx - u * 0.2, gy - u * 0.07 + lari * u * 0.04, u * 0.16, u * 0.07); ctx.fillRect(gx + u * 0.04, gy - u * 0.07 - lari * u * 0.04, u * 0.16, u * 0.07);
    /* jeans */
    var kakiH = guling > 0 ? u * 0.12 : u * 0.4;
    ctx.fillStyle = '#3949ab'; ctx.fillRect(gx - u * 0.19, gy - u * 0.07 - kakiH + lari * u * 0.04, u * 0.15, kakiH); ctx.fillRect(gx + u * 0.04, gy - u * 0.07 - kakiH - lari * u * 0.04, u * 0.15, kakiH);
    /* hoodie biru (Jake) */
    var by = gy - u * 0.07 - kakiH, badanH = guling > 0 ? u * 0.42 : u * 0.5;
    ctx.fillStyle = '#1e88e5'; ctx.fillRect(gx - u * 0.24, by - badanH, u * 0.48, badanH);
    ctx.fillStyle = '#1565c0'; ctx.fillRect(gx - u * 0.24, by - badanH, u * 0.48, u * 0.06); ctx.fillRect(gx - u * 0.05, by - badanH, u * 0.1, badanH);
    /* tudung hoodie di punggung */
    ctx.fillStyle = '#1565c0'; ctx.beginPath(); ctx.ellipse(gx, by - badanH + u * 0.06, u * 0.16, u * 0.1, 0, 0, Math.PI); ctx.fill();
    /* lengan */
    ctx.fillStyle = '#1e88e5'; ctx.fillRect(gx - u * 0.34, by - badanH + u * 0.06 - lari * u * 0.06, u * 0.1, u * 0.3); ctx.fillRect(gx + u * 0.24, by - badanH + u * 0.06 + lari * u * 0.06, u * 0.1, u * 0.3);
    ctx.fillStyle = '#f1c27d'; ctx.fillRect(gx - u * 0.34, by - badanH + u * 0.36 - lari * u * 0.06, u * 0.1, u * 0.08); ctx.fillRect(gx + u * 0.24, by - badanH + u * 0.36 + lari * u * 0.06, u * 0.1, u * 0.08);
    /* kepala + topi merah terbalik */
    var ky = by - badanH - u * 0.02;
    ctx.fillStyle = '#f1c27d'; ctx.fillRect(gx - u * 0.15, ky - u * 0.26, u * 0.3, u * 0.26);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(gx - u * 0.15, ky - u * 0.26, u * 0.3, u * 0.08);
    ctx.fillStyle = '#e53935'; ctx.fillRect(gx - u * 0.17, ky - u * 0.34, u * 0.34, u * 0.12); ctx.fillRect(gx - u * 0.1, ky - u * 0.24, u * 0.2, u * 0.05);
    ctx.fillStyle = '#c62828'; ctx.fillRect(gx - u * 0.06, ky - u * 0.34, u * 0.12, u * 0.03);
    /* kaleng cat semprot di tangan kanan */
    ctx.fillStyle = '#26c6da'; ctx.fillRect(gx + u * 0.26, by - badanH + u * 0.3 + lari * u * 0.06, u * 0.07, u * 0.12);
    /* polisi & anjing */
    var kj = over ? Math.max(0.6, kejar) : (jarak < 30 ? 1.4 : 5 - Math.min(3, jarak / 40));
    if (over || kj < 4.5) {
      var pp = P(x + 0.35, 0, -kj), pd = P(x - 0.4, 0, -kj + 0.2);
      var ps = pp.s;
      if (pp.y < H + 40) {
        /* polisi */
        ctx.fillStyle = '#fafafa'; ctx.fillRect(pp.x - ps * 0.16, pp.y - ps * 0.06, ps * 0.13, ps * 0.06); ctx.fillRect(pp.x + ps * 0.03, pp.y - ps * 0.06, ps * 0.13, ps * 0.06);
        ctx.fillStyle = '#1a237e'; ctx.fillRect(pp.x - ps * 0.16, pp.y - ps * 0.42, ps * 0.13, ps * 0.36); ctx.fillRect(pp.x + ps * 0.03, pp.y - ps * 0.42, ps * 0.13, ps * 0.36);
        ctx.fillStyle = '#283593'; ctx.fillRect(pp.x - ps * 0.22, pp.y - ps * 0.92, ps * 0.44, ps * 0.5);
        ctx.fillStyle = '#ffd600'; ctx.fillRect(pp.x - ps * 0.1, pp.y - ps * 0.86, ps * 0.06, ps * 0.06);
        ctx.fillStyle = '#e0ac69'; ctx.fillRect(pp.x - ps * 0.13, pp.y - ps * 1.16, ps * 0.26, ps * 0.24);
        ctx.fillStyle = '#1a237e'; ctx.fillRect(pp.x - ps * 0.16, pp.y - ps * 1.26, ps * 0.32, ps * 0.12); ctx.fillStyle = '#ffd600'; ctx.fillRect(pp.x - ps * 0.03, pp.y - ps * 1.24, ps * 0.06, ps * 0.06);
        ctx.fillStyle = '#e0ac69'; ctx.fillRect(pp.x - ps * 0.32, pp.y - ps * 0.9, ps * 0.1, ps * 0.26); ctx.fillStyle = '#795548'; ctx.fillRect(pp.x - ps * 0.34, pp.y - ps * 0.7, ps * 0.14, ps * 0.06);
        /* anjing */
        var ds = pd.s;
        ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.ellipse(pd.x, pd.y - ds * 0.22, Math.abs(ds * 0.22), Math.abs(ds * 0.15), 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(pd.x - ds * 0.18, pd.y - ds * 0.1, ds * 0.06, ds * 0.1); ctx.fillRect(pd.x + ds * 0.12, pd.y - ds * 0.1, ds * 0.06, ds * 0.1);
        ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.arc(pd.x + ds * 0.02, pd.y - ds * 0.42, ds * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4e342e'; ctx.fillRect(pd.x - ds * 0.14, pd.y - ds * 0.5, ds * 0.07, ds * 0.14); ctx.fillRect(pd.x + ds * 0.11, pd.y - ds * 0.5, ds * 0.07, ds * 0.14);
        ctx.fillStyle = '#e53935'; ctx.fillRect(pd.x - ds * 0.1, pd.y - ds * 0.34, ds * 0.24, ds * 0.04);
      }
    }
  }

  /* ---------- v7.9.1: LAYAR MENU ala game asli ---------- */
  var menuT = 0;
  function logoSubway (cx, cy, sk) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sk, sk); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 64px Impact, "Arial Black", sans-serif';
    ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b2a41'; ctx.strokeText('SUBWAY', 0, -30);
    var g1 = ctx.createLinearGradient(0, -60, 0, 0); g1.addColorStop(0, '#fff176'); g1.addColorStop(1, '#ff9800');
    ctx.fillStyle = g1; ctx.fillText('SUBWAY', 0, -30);
    ctx.font = '900 46px Impact, "Arial Black", sans-serif';
    ctx.lineWidth = 12; ctx.strokeStyle = '#1b2a41'; ctx.strokeText('SURFERS', 0, 24);
    var g2 = ctx.createLinearGradient(0, 0, 0, 46); g2.addColorStop(0, '#e1f5fe'); g2.addColorStop(1, '#29b6f6');
    ctx.fillStyle = g2; ctx.fillText('SURFERS', 0, 24);
    ctx.restore();
  }
  function tombolBesar (x, y, w, h, teks, warna, warnaTua) {
    ctx.fillStyle = warnaTua; roundRect(x, y + 6, w, h, h / 2); ctx.fill();
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#fff'); g.addColorStop(0.08, warna); g.addColorStop(1, warna);
    ctx.fillStyle = g; roundRect(x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(x + 10, y + 5, w - 20, h * 0.35, h * 0.2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(h * 0.5) + 'px Impact, "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeText(teks, x + w / 2, y + h / 2 + 1); ctx.fillText(teks, x + w / 2, y + h / 2 + 1);
  }
  function panelInfo (x, y, w, h, ikon, label, nilai) {
    ctx.fillStyle = 'rgba(10,20,40,0.72)'; roundRect(x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; roundRect(x, y, w, h, 12); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '22px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(ikon, x + 12, y + h / 2);
    ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#b0bec5'; ctx.fillText(label, x + 44, y + h / 2 - 10);
    ctx.font = '900 17px "Segoe UI", sans-serif'; ctx.fillStyle = '#ffd54f'; ctx.fillText(String(nilai), x + 44, y + h / 2 + 9);
  }
  function layarMenu () {
    menuT++;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, W, H);
    /* pita grafiti miring di belakang logo */
    ctx.save(); ctx.translate(W / 2, H * 0.2); ctx.rotate(-0.06);
    ctx.fillStyle = '#ff5722'; ctx.fillRect(-W, -62, W * 2, 124);
    ctx.fillStyle = '#ffab40'; ctx.fillRect(-W, -62, W * 2, 6); ctx.fillRect(-W, 56, W * 2, 6);
    ctx.restore();
    var bob = Math.sin(menuT / 18) * 4;
    logoSubway(W / 2, H * 0.2 + bob, Math.min(1, W / 420));
    /* panel best & koin */
    var pw = (W - 60) / 2;
    panelInfo(20, H * 0.40, pw, 50, '🏆', 'SKOR TERBAIK', String(A.best || 0).padStart(6, '0'));
    panelInfo(40 + pw, H * 0.40, pw, 50, '🪙', 'KOIN TERAKHIR', koin);
    /* tombol PLAY berdenyut */
    var puls = 1 + Math.sin(menuT / 10) * 0.03;
    var bw = 210 * puls, bh = 64 * puls;
    tombolBesar(W / 2 - bw / 2, H * 0.60 - bh / 2, bw, bh, '▶  PLAY', '#43a047', '#1b5e20');
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('ketuk layar / tombol untuk mulai', W / 2, H * 0.60 + 52);
    /* baris ikon menu ala asli: misi · toko · papan · pengaturan */
    var ikon = ['📋', '🛒', '🏆', '⚙️']; var lbl = ['MISI', 'TOKO', 'TOP', 'ATUR'];
    var iw = 64, gap = (W - iw * 4) / 5;
    for (var i = 0; i < 4; i++) {
      var ix = gap + i * (iw + gap), iy = H * 0.60 + 76;
      ctx.fillStyle = 'rgba(10,20,40,0.72)'; roundRect(ix, iy, iw, 58, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; roundRect(ix, iy, iw, 58, 12); ctx.stroke();
      ctx.font = '22px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ikon[i], ix + iw / 2, iy + 22);
      ctx.font = '800 10px "Segoe UI", sans-serif'; ctx.fillStyle = '#cfd8dc'; ctx.fillText(lbl[i], ix + iw / 2, iy + 46);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('◀ ▶ ganti jalur · ▲ lompat · ▼ berguling · ● hoverboard', W / 2, H - 14);
  }
  function layarOver () {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    var pw = W - 60, ph = 250, px = 30, py = H / 2 - ph / 2;
    ctx.fillStyle = '#0d47a1'; roundRect(px, py + 8, pw, ph, 20); ctx.fill();
    var g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#42a5f5'); g.addColorStop(1, '#1565c0');
    ctx.fillStyle = g; roundRect(px, py, pw, ph, 20); ctx.fill();
    ctx.fillStyle = '#ff5252'; roundRect(px, py, pw, 54, 20); ctx.fill(); ctx.fillRect(px, py + 30, pw, 24);
    ctx.fillStyle = '#fff'; ctx.font = '900 26px Impact, "Arial Black", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TERTANGKAP!', W / 2, py + 27);
    ctx.font = '900 40px Impact, "Arial Black", sans-serif'; ctx.fillStyle = '#ffd54f'; ctx.fillText(String(skor).padStart(7, '0'), W / 2, py + 96);
    ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillStyle = '#e3f2fd'; ctx.fillText('SKOR', W / 2, py + 124);
    ctx.font = '800 15px "Segoe UI", sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('🪙 ' + koin + '      📏 ' + Math.floor(jarak) + ' m      🏆 ' + Math.max(A.best || 0, skor), W / 2, py + 152);
    if (skor >= (A.best || 0) && skor > 0) { ctx.fillStyle = '#ffeb3b'; ctx.font = '900 13px "Segoe UI", sans-serif'; ctx.fillText('★ REKOR BARU! ★', W / 2, py + 176); }
    tombolBesar(W / 2 - 100, py + ph - 62, 200, 48, '↻  LARI LAGI', '#43a047', '#1b5e20');
    ctx.textBaseline = 'alphabetic';
  }
  function draw () {
    ctx.save();
    if (goyangCam > 0) ctx.translate(A.rand(-goyangCam / 3, goyangCam / 3), A.rand(-goyangCam / 3, goyangCam / 3));
    latar();
    var urut = obj.slice().sort(function (a, b) { return (b.z + b.pjg) - (a.z + a.pjg); });
    var sudahPemain = false;
    for (var i = 0; i < urut.length; i++) {
      var o = urut[i];
      if (!sudahPemain && o.z + o.pjg < 0.2 && o.j !== 'terowongan') { pemain(); sudahPemain = true; }
      gambarObj(o);
    }
    if (!sudahPemain) pemain();
    for (var p = 0; p < part.length; p++) { ctx.globalAlpha = part[p].a; ctx.fillStyle = part[p].w; ctx.fillRect(part[p].x, part[p].y, 5, 5); } ctx.globalAlpha = 1;
    ctx.restore();
    /* HUD */
    if (mulai) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(10, 10, 170, 56, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 20px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(skor).padStart(7, '0'), 20, 34);
    ctx.fillStyle = '#ffd54f'; ctx.font = '900 16px "Segoe UI", sans-serif'; ctx.fillText('● ' + koin, 20, 56);
    ctx.fillStyle = '#fff'; ctx.font = '800 14px "Segoe UI", sans-serif'; ctx.textAlign = 'right'; ctx.fillText('x' + mult, 170, 56);
    if (hover > 0 || jet > 0) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(W - 150, 10, 140, 26, 8); ctx.fill(); ctx.fillStyle = hover > 0 ? '#ff9800' : '#ef5350'; ctx.fillRect(W - 144, 16, 128 * ((hover > 0 ? hover / 720 : jet / 360)), 14); }
    }
    if (!mulai) layarMenu();
    if (over) layarOver();
    A.state = { lane: lane, y: y, skor: skor, koin: koin, jarak: jarak, over: over, mulai: mulai, hover: hover, jet: jet, obj: obj.length };
  }
  function roundRect (x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function loop () { update(); draw(); requestAnimationFrame(loop); }

  function aksi (k) {
    A.initAudio();
    if (over) { if (mati > 20) reset(); return; }
    if (!mulai) { mulai = true; }
    if (k === 'left') { lane = Math.max(0, lane - 1); }
    else if (k === 'right') { lane = Math.min(2, lane + 1); }
    else if (k === 'up') { if (y <= tinggiLantai() + 0.01 && jet <= 0) { vy = 0.36; guling = 0; A.SFX.jump(); } }
    else if (k === 'down') { guling = 40; if (y > tinggiLantai() + 0.1) vy = -0.5; }
    else if (k === 'act') { if (hover <= 0) { hover = 60 * 12; A.SFX.level(); } }
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
  c.addEventListener('touchend', function (e) {
    if (!ts) return; var dx = e.changedTouches[0].clientX - ts.clientX, dy = e.changedTouches[0].clientY - ts.clientY; ts = null;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) { if (!mulai || over) aksi('start'); else aksi('act'); e.preventDefault(); return; }
    if (Math.abs(dx) > Math.abs(dy)) aksi(dx > 0 ? 'right' : 'left'); else aksi(dy > 0 ? 'down' : 'up');
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { if (!mulai || over) aksi('start'); });
  reset(); requestAnimationFrame(loop);
`

export function subwayHtml (brand = 'THERYHANN!') {
  return shell('Subway Surf', brand, SUBWAY3D_JS, {
    w: 480, h: 780, maxw: 440, sub: 'ARCADE', pad: 'udlra', padStyle: 'subway',
    hint: '◀ ▶ pindah jalur · ▲ lompat (naik ramp ke atap kereta) · ▼ guling · ● hoverboard · geser layar juga bisa · kumpulkan koin & 🚀 jetpack'
  })
}

export default { subwayHtml }
