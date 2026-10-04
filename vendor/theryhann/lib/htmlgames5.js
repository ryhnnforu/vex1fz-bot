/**
 * 🕹️ ARCADE HTML v7.3 — 4 game "puzzle & papan" (Block Blast, Catur,
 *                        Minesweeper, Asteroids)
 * v7.33.0: Akinator dihapus dari sini → jadi game chat tanya-jawab (features/akinator.js)
 * ---------------------------------------------------------------------
 *  Sama seperti batch v7.2: memakai shell() bersama dari lib/htmlgames.js
 *  (kartu neon + HUD + D-pad ▲▼◀▶ + ● + WebAudio + best score localStorage).
 *
 *  Ciri batch ini:
 *   • semuanya bisa dimainkan PENUH lewat D-pad (tanpa sentuh canvas)
 *   • tiap game punya ratio canvas sendiri
 *   • game berbasis giliran punya BATAS WAKTU supaya tetap bisa berakhir
 *     (dipakai test runtime: tanpa input akhirnya GAME OVER)
 *   • payload self-contained: 1 <script>, 0 resource eksternal
 *
 *  Kontrak: A.state diisi SETELAH update()+draw(), minimal { score, over },
 *  dan saat selesai wajib menggambar teks 'GAME OVER'.
 */
import { shell } from './htmlgames.js'

/* ================================================================== */
/*  2. BLOCK BLAST NEON — 560x700 (portrait) — ◀▶▲▼ kursor, ● taruh    */
/* ================================================================== */
const BLOCKBLAST_JS = `
  /* ========= BLOCK BLAST NEON v7.7.3 — rupa BLOCK BLAST ASLI (tap) ========= */
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 640, H = 760;
  var N8 = 8, SEL = 66, PADER = 18;
  var LEBARP = N8 * SEL + PADER * 2;
  var X0 = (W - LEBARP) / 2, Y0 = 132;
  var YBPA = Y0 + LEBARP + 26;

  /* warna permen seperti Block Blast aslinya */
  var CANDY = ['#f5455c', '#fa9768', '#f7c744', '#53c75b', '#3fa7f5', '#a855f7', '#f472b6'];

  /* bentuk polyomino: daftar sel relatif (x,y) dari sudut kiri atas */
  var BENTUK = [
    { s: [[0,0]], n: 'DOT' },
    { s: [[0,0],[1,0]], n: 'I2' },
    { s: [[0,0],[1,0],[2,0]], n: 'I3' },
    { s: [[0,0],[1,0],[2,0],[3,0]], n: 'I4' },
    { s: [[0,0],[0,1]], n: 'I2v' },
    { s: [[0,0],[0,1],[0,2]], n: 'I3v' },
    { s: [[0,0],[0,1],[0,2],[0,3]], n: 'I4v' },
    { s: [[0,0],[1,0],[0,1],[1,1]], n: 'SQ2' },
    { s: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]], n: 'RECT32' },
    { s: [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]], n: 'RECT23' },
    { s: [[0,0],[0,1],[0,2],[1,2]], n: 'L4' },
    { s: [[1,0],[1,1],[1,2],[0,2]], n: 'L4b' },
    { s: [[0,0],[1,0],[1,1],[1,2]], n: 'J4' },
    { s: [[0,0],[1,0],[1,1],[2,1]], n: 'Z4' },
    { s: [[0,0],[1,0],[2,0],[1,1]], n: 'T4' },
    { s: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], n: 'SQ3' },
    { s: [[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]], n: 'C5' }
  ];

  var papan = new Array(64).fill(0); /* angka index warna 1..N, 0=kosong */
  var tray = [];
  var aktif = -1; /* index tray yang dipilih (0..2), -1 = tidak ada */
  var hantu = null; /* kohns preview taruh { b0, ok } sebelum konfirmasi letakkan */
  var skor = 0, langkah = 0, dibersihkan = 0, combo = 0;
  var over = false, partikel = [], menyalakan = [];
  var DURASI_PINDAH = 16;

  function ambilAcak () { return BENTUK[Math.floor(Math.random() * BENTUK.length)] }

  function isiTray () {
    tray = [];
    var dipakai = {};
    var coba = 0;
    while (tray.length < 3 && coba++ < 80) {
      var b = ambilAcak();
      var kunci = b.n;
      if (dipakai[kunci]) continue;
      dipakai[kunci] = true;
      tray.push({ bentuk: b, warna: 1 + (tray.length + Math.floor(Math.random() * CANDY.length)) % CANDY.length, dipakai: false });
    }
    aktif = -1;
    hantu = null;
  }
  function bentukSel (b) { return b.s }

  function muat (b, b0) {
    var s = bentukSel(b);
    for (var i = 0; i < s.length; i++) {
      var t = b0 + s[i][0] + s[i][1] * 8;
      var kolom = (b0 % 8) + s[i][0], baris = Math.floor(b0 / 8) + s[i][1];
      if (kolom < 0 || kolom > 7 || baris < 0 || baris > 7) return false;
      if (t < 0 || t > 63) return false;
      if (papan[t]) return false;
    }
    return true;
  }

  function tempatkan (t, b0) {
    var s = bentukSel(t.bentuk);
    for (var i = 0; i < s.length; i++) papan[b0 + s[i][0] + s[i][1] * 8] = t.warna;
    t.dipakai = true;
    aktif = -1;
    hantu = null;
    langkah++;
    A.SFX.jump();
    /* bersihkan baris & kolom penuh */
    var barisPenuh = [], kolomPenuh = [];
    for (var r = 0; r < 8; r++) {
      var p = true;
      for (var c2 = 0; c2 < 8; c2++) if (!papan[r * 8 + c2]) { p = false; break }
      if (p) barisPenuh.push(r);
    }
    for (var c3 = 0; c3 < 8; c3++) {
      var p2 = true;
      for (var r2 = 0; r2 < 8; r2++) if (!papan[r2 * 8 + c3]) { p2 = false; break }
      if (p2) kolomPenuh.push(c3);
    }
    var dibersihkan = 0;
    var selBersih = new Set();
    for (var br = 0; br < barisPenuh.length; br++) for (var x = 0; x < 8; x++) selBersih.add(barisPenuh[br] * 8 + x);
    for (var kl = 0; kl < kolomPenuh.length; kl++) for (var y = 0; y < 8; y++) selBersih.add(y * 8 + kolomPenuh[kl]);
    selBersih.forEach(function (i4) {
      papan[i4] = 0;
      dibersihkan++;
      var cx = X0 + (i4 % 8) * SEL + SEL / 2, cy = Y0 + Math.floor(i4 / 8) * SEL + SEL / 2;
      ledakan(cx, cy, 10);
    });
    if (dibersihkan) {
      combo++;
      var bonus = combo >= 2 ? dibersihkan * 5 * combo : 0;
      skor += dibersihkan * 10 + bonus;
      menyalakan.push({ teks: combo >= 2 ? 'KOMBO x' + combo + '!' : '+' + (dibersihkan * 10 + bonus), t: 0 });
      A.SFX.point();
      if (combo >= 2) A.SFX.level();
    } else {
      combo = 0;
    }
    skor += 5;
    if (tray.every(function (x) { return x.dipakai })) isiTray();
    A.setScore(skor);
    if (!bisaLetak()) { over = true; A.SFX.crash(); A.saveBest(skor) }
    return true;
  }

  function bisaLetak () {
    for (var i = 0; i < tray.length; i++) {
      if (tray[i].dipakai) continue;
      for (var p = 0; p < 64; p++) if (muat(tray[i].bentuk, p)) return true;
    }
    return false;
  }

  function bisaLetakSatu (t) {
    for (var p = 0; p < 64; p++) if (muat(t.bentuk, p)) return true;
    return false;
  }

  function ledakan (x, y, n) {
    for (var i = 0; i < n; i++) partikel.push({ x: x, y: y, vx: A.rand(-4, 4), vy: A.rand(-6, 0.5), a: 1, r: A.rand(2, 4), w: CANDY[Math.floor(Math.random() * 7)] });
  }

  function baru () {
    papan.fill(0);
    skor = 0; langkah = 0; combo = 0; dibersihkan = 0;
    over = false; partikel = []; menyalakan = [];
    isiTray();
    A.setScore(0); A.setBest();
  }

  /* -------------------------------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    var k = e.code;
    if (k === 'Space' || k === 'Enter') { e.preventDefault(); baru(); }
  });

  /* DAFTAR tray area ketuk untuk debug & touch */
  function areaTray (i) {
    var jarak = (W - 3 * 150) / 4 + 100;
    var x = X0 + i * 150 + 6;
    return { x: x, y: YBPA, w: 136, h: 150 };
  }

  function ketuk (px, py) {
    if (over) { baru(); return }
    /* tray: pilih bidak */
    for (var i = 0; i < tray.length; i++) {
      var a = areaTray(i);
      if (px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
        if (tray[i].dipakai) return;
        aktif = aktif === i ? -1 : i;
        A.SFX.point();
        return;
      }
    }
    /* papan: konfirmasi taruh bila ada yang aktif */
    if (aktif >= 0 && px >= X0 && px < X0 + N8 * SEL && py >= Y0 && py < Y0 + N8 * SEL) {
      var cc = Math.max(0, Math.min(7, Math.floor((px - X0) / SEL)));
      var rr = Math.max(0, Math.min(7, Math.floor((py - Y0) / SEL)));
      var b0 = rr * 8 + cc;
      var t = tray[aktif];
      /* anchor: samakan sel pertama (0,0) ke b0 — kalau mentok geser kembali ke dalam papan */
      var s = bentukSel(t.bentuk);
      var makX = 0, makY = 0;
      for (var i2 = 0; i2 < s.length; i2++) { if (s[i2][0] > makX) makX = s[i2][0]; if (s[i2][1] > makY) makY = s[i2][1] }
      var kolom = cc, baris = rr;
      if (kolom + makX > 7) kolom = 7 - makX;
      if (baris + makY > 7) baris = 7 - makY;
      if (kolom < 0) kolom = 0;
      if (baris < 0) baris = 0;
      b0 = baris * 8 + kolom;
      if (muat(t.bentuk, b0)) {
        tempatkan(t, b0);
      } else {
        hantu = { b0: b0, ok: false, t: 0 };
        /* gagal di tempat ini — getar jawab */
        A.SFX.point();
      }
    }
  }

  /* ---------- gambar ---------- */
  function teks (tx, x, y, sz, ws, gaya, rata) {
    ctx.fillStyle = ws;
    ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(tx, x, y);
  }
  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function gambarSel (idx, warnaIdx, skala) {
    var r = Math.floor(idx / 8), c2 = idx % 8;
    var x = X0 + c2 * SEL + 3, y = Y0 + r * SEL + 3;
    var inv = (SEL - 6) * (skala || 1);
    /* sel penuh mengkilap grid corner highlight seperti asli */
    ctx.fillStyle = warnaIdx ? CANDY[warnaIdx - 1] : '#232337';
    bulat(x, y, inv, inv, 8); ctx.fill();
    if (warnaIdx) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      bulat(x, y, inv, inv * 0.44, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  var last = 0, runT = 0;
  function update (dt) {
    runT += dt;
    for (var pi = partikel.length - 1; pi >= 0; pi--) {
      var q = partikel[pi];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.16 * dt; q.a -= 0.02 * dt;
      if (q.a <= 0) partikel.splice(pi, 1);
    }
    for (var mi = menyalakan.length - 1; mi >= 0; mi--) {
      menyalakan[mi].t += dt;
      if (menyalakan[mi].t > 46) menyalakan.splice(mi, 1);
    }
    if (hantu) { hantu.t += dt; if (hantu.t > 26) hantu = null }
    /* game over dinilai terus-menerus (bukan hanya setelah taruh) */
    if (!over && !bisaLetak()) {
      over = true;
      A.SFX.crash();
      A.saveBest(skor);
    }
    A.setScore(skor);
    if (skor > A.best) A.best = skor;
    A.setProgress(papan.filter(function (x) { return x }).length / 64);
    A.setStatus(over ? 'GAME OVER' : aktif >= 0 ? 'TARUH ' + tray[aktif].bentuk.n : 'PILIH BLOK', combo > 1 ? 'kombo x' + combo : langkah + ' langkah');
    A.state = {
      papan: papan.slice(),
      tray: tray.map(function (t) { return { n: t.bentuk.n, warna: t.warna, dipakai: t.dipakai, sel: t.bentuk.s.length } }),
      aktif: aktif, skor: skor, langkah: langkah, combo: combo, over: over,
      bisaLetak: over ? false : bisaLetak(),
      kosong: papan.filter(function (x) { return !x }).length,
      keys: { up: false, down: false, left: false, right: false, act: false }
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    /* latar gelap ungu gelap seperti asli */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#171729'); bg.addColorStop(1, '#101018');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* header: judul + skor besar kanan-kiri seperti asli */
    teks('BLOCK BLAST', X0, 42, 28, '#ffffff', '900');
    teks('neon · generasi THERYHANN!', X0, 70, 12.5, '#8b8ba6', '600', 'left' === 'left' ? undefined : 'left');
    ctx.fillStyle = '#23233a'; bulat(W - 24 - 130, 22, 130, 62, 12); ctx.fill();
    teks('SKOR', W - 24 - 65, 38, 12, '#8b8ba6', '800', 'center');
    teks(String(skor), W - 24 - 65, 68, 30, '#ffffff', '900', 'center');
    var bestI = Math.max(A.best || 0, skor);
    teks('terbaik ' + bestI, W - 24 - 65, 94, 11, '#8b8ba6', '700', 'center');

    teks(combo > 1 ? 'KOMBO x' + combo : langkah === 0 ? 'taruh blok penuhi baris/kolom' : 'langkah ' + langkah, X0, 104, 15, combo > 1 ? '#f5455c' : '#8b8ba6', '800');
    if (aktif >= 0) teks('bidak dipilih: ' + tray[aktif].bentuk.n + ' — ketuk papan untuk meletakkannya', W - X0, 104, 12.5, '#f7c744', '700', 'right');

    /* area papan latar panel besar */
    ctx.fillStyle = '#1c1c30'; bulat(X0 - PADER, Y0 - PADER, LEBARP, LEBARP, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2; ctx.stroke();
    for (var i = 0; i < 64; i++) gambarSel(i, papan[i]);

    /* ghost preview saat memilih: gambar bayangan diagonal di posisi tengah papan */
    if (aktif >= 0) {
      var t = tray[aktif];
      var warnaIdx = t.warna;
      /* tampilkan bentuk dipilih di atas tray (preview besar) */
      var pX = X0 + 20, pY = Y0 + LEBARP + 46;
    }

    /* area tray: 3 slot kartu besar */
    for (var ti = 0; ti < tray.length; ti++) {
      var at = areaTray(ti);
      var dip = tray[ti].dipakai;
      var sedang = ti === aktif;
      ctx.fillStyle = sedang ? '#2a2a4a' : '#1e1e33';
      bulat(at.x, at.y, at.w, at.h, 16); ctx.fill();
      ctx.strokeStyle = sedang ? '#f7c744' : 'rgba(255,255,255,0.07)'; ctx.lineWidth = sedang ? 3 : 1.5; ctx.stroke();
      teks(dip ? '✓' : (ti + 1).toString(), at.x + 16, at.y + 18, 14, dip ? '#53c75b' : '#8b8ba6', '900');
      if (!dip) {
        /* gambar miniatur bentuk */
        var s = bentukSel(tray[ti].bentuk);
        var makX = 0, makY = 0;
        for (var i2 = 0; i2 < s.length; i2++) { if (s[i2][0] > makX) makX = s[i2][0]; if (s[i2][1] > makY) makY = s[i2][1] }
        var ms = Math.min(26, (at.w - 24) / (makX + 1), (at.h - 52) / (makY + 1));
        var awalX = at.x + (at.w - (makX + 1) * ms) / 2, awalY = at.y + 40 + ((at.h - 40 - (makY + 1) * ms) / 2) - 8;
        for (var i3 = 0; i3 < s.length; i3++) {
          ctx.fillStyle = CANDY[tray[ti].warna - 1];
          bulat(awalX + s[i3][0] * ms + 1, awalY + s[i3][1] * ms + 1, ms - 2, ms - 2, 5);
          ctx.fill();
        }
        var bisa = bisaLetakSatu(tray[ti]);
        if (!bisa) {
          ctx.fillStyle = '#f5455c'; ctx.fillRect(at.x + 12, at.y + at.h - 26, at.w - 24, 4);
          teks('tidak muat di mana pun', at.x + at.w / 2, at.y + at.h - 12, 9.5, '#f5455c', '700', 'center');
        }
      }
    }

    /* partikel + notifikasi kombo */
    for (var pi = 0; pi < partikel.length; pi++) {
      var q = partikel[pi];
      ctx.globalAlpha = Math.max(0, q.a);
      ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var mi = 0; mi < menyalakan.length; mi++) {
      var m = menyalakan[mi];
      ctx.globalAlpha = Math.max(0, 1 - m.t / 46);
      teks(m.teks, W / 2, Y0 + LEBARP / 2 - mi * 30 - 40 + m.t * 0.7, 42, '#ffffff', '900', 'center');
    }
    ctx.globalAlpha = 1;

    if (over) {
      ctx.fillStyle = 'rgba(10,10,16,0.85)'; ctx.fillRect(0, 0, W, H);
      teks('GAME OVER', W / 2, H / 2 - 44, 42, '#f5455c', '900', 'center');
      teks('skor akhirmu: ' + skor, W / 2, H / 2 + 2, 21, '#ffffff', '800', 'center');
      teks('langkah: ' + langkah + ' · terbaik: ' + Math.max(A.best || 0, skor), W / 2, H / 2 + 30, 14, '#8b8ba6', '600', 'center');
      teks('ketuk layar untuk main lagi', W / 2, H / 2 + 66, 14.5, '#f7c744', '700', 'center');
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
  A.debug = { papan: function () { return papan.slice() }, isiPapan: function (arr) { for (var i = 0; i < 64; i++) papan[i] = arr[i] || 0 }, trayOf: function () { return tray }, ketuk: ketuk, muat: muat, tempatkan: tempatkan, bisaLetak: bisaLetak, bisaLetakSatu: bisaLetakSatu, isiTray: isiTray, BENTUK: BENTUK, CANDY: CANDY, areaTray: areaTray };
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  3. CATUR NEON — 600x700 — ◀▶▲▼ kursor, ● pilih/jalan              */
/*  Engine catur penuh (rokade, promosi, skak, skakmat) + AI minimax   */
/* ================================================================== */
const CATUR_JS = `
  /* ============ CATUR NEON v7.7.3 — lobi CHESS MASTER + gerak halus ============ */
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 640, H = 840;
  var BX = 26, BY = 172, SQ = 73;
  var BAWAH = BY + SQ * 8;

  var NILAI = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  var POS_BONUS = {
    P: [0,0,0,0,0,0,0,0, 30,30,30,30,30,30,30,30, 12,12,18,20,20,18,12,12, 8,10,12,16,16,12,10,8,
         5,5,8,10,10,8,5,5, 2,3,3,4,4,3,3,2, 0,0,2,5,5,2,0,0, 0,0,0,0,0,0,0,0],
    N: [-10,-5,-5,-5,-5,-5,-5,-10, -5,5,10,10,10,10,5,-5, -5,10,15,15,15,15,10,-5, -5,10,15,20,20,15,10,-5,
        -5,10,15,20,20,15,10,-5, -5,5,10,10,10,10,5,-5, -5,-5,-5,-5,-5,-5,-5,-10, -10,-5,-5,-5,-5,-5,-5,-10]
  };
  function bonusPos (pc, idx) {
    var ar = POS_BONUS[pc.toUpperCase()];
    if (!ar) return 0;
    return pc === pc.toUpperCase() ? ar[idx] : ar[63 - idx];
  }

  function setupPapan () {
    var b = new Array(64).fill('');
    var belakang = ['R','N','B','Q','K','B','N','R'];
    for (var f = 0; f < 8; f++) {
      b[f] = belakang[f].toLowerCase();
      b[8 + f] = 'p';
      b[48 + f] = 'P';
      b[56 + f] = belakang[f];
    }
    return b;
  }
  function warna (pc) { return pc === '' ? '' : (pc === pc.toUpperCase() ? 'w' : 'b') }
  function lawan (w) { return w === 'w' ? 'b' : 'w' }

  function langkahPseudo (b, idx, enPesan, castling) {
    var pc = b[idx]; if (!pc) return [];
    var w = warna(pc);
    var out = [];
    var r = Math.floor(idx / 8), c2 = idx % 8;
    function up (rr, cc, opt) {
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return false;
      var t = rr * 8 + cc;
      var tgt = b[t];
      if (tgt && warna(tgt) === w) return 'blokir';
      out.push({ a: idx, b: t, cap: tgt || null, promo: (opt && opt.promo) || null, castleID: (opt && opt.castleID) || null, ep: !!(opt && opt.ep) });
      return tgt ? 'stop' : true;
    }
    function geser (dr, dc) {
      var rr = r + dr, cc = c2 + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        var hasil = up(rr, cc);
        if (hasil !== true) break;
        rr += dr; cc += dc;
      }
    }
    function rr0 (x) { return x >= 0 && x <= 7 }
    var P = pc.toUpperCase();
    if (P === 'P') {
      var arah = w === 'w' ? -1 : 1;
      var mulai = w === 'w' ? 6 : 1;
      var akhirRank = w === 'w' ? 0 : 7;
      if (rr0(r + arah) && !b[(r + arah) * 8 + c2]) {
        up(r + arah, c2, { promo: (r + arah) === akhirRank ? 'Q' : null });
        if (r === mulai && !b[(r + 2 * arah) * 8 + c2]) {
          out.push({ a: idx, b: (r + 2 * arah) * 8 + c2, cap: null, promo: null, ganda: true });
        }
      }
      for (var d = -1; d <= 1; d += 2) {
        var cc2 = c2 + d;
        if (cc2 < 0 || cc2 > 7) continue;
        var tr = r + arah;
        if (tr < 0 || tr > 7) continue;
        var ti = tr * 8 + cc2;
        if (b[ti] && warna(b[ti]) !== w) up(tr, cc2, { promo: tr === akhirRank ? 'Q' : null });
        else if (enPesan >= 0 && enPesan === ti && Math.abs(enPesan % 8 - c2) === 1) {
          out.push({ a: idx, b: ti, cap: w === 'w' ? 'p' : 'P', promo: null, ep: true });
        }
      }
    } else if (P === 'N') {
      var kel = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (var i = 0; i < 8; i++) up(r + kel[i][0], c2 + kel[i][1]);
    } else if (P === 'K') {
      var rk = [-1,0,1,-1,1,-1,0,1], ck = [-1,-1,-1,0,0,1,1,1];
      for (var kk = 0; kk < 8; kk++) up(r + rk[kk], c2 + ck[kk]);
      var home = w === 'w' ? 7 : 0;
      if (r === home && c2 === 4 && castling) {
        var key = w === 'w' ? ['K', 'Q'] : ['k', 'q'];
        if (castling[key[0]] && !b[home * 8 + 5] && !b[home * 8 + 6] && b[home * 8 + 7] && b[home * 8 + 7].toUpperCase() === 'R') {
          out.push({ a: idx, b: home * 8 + 6, cap: null, castleID: 'K' });
        }
        if (castling[key[1]] && !b[home * 8 + 3] && !b[home * 8 + 2] && !b[home * 8 + 1] && b[home * 8] && b[home * 8].toUpperCase() === 'R') {
          out.push({ a: idx, b: home * 8 + 2, cap: null, castleID: 'Q' });
        }
      }
    } else {
      if (P === 'B' || P === 'Q') { geser(-1,-1); geser(-1,1); geser(1,-1); geser(1,1); }
      if (P === 'R' || P === 'Q') { geser(-1,0); geser(1,0); geser(0,-1); geser(0,1); }
    }
    return out;
  }

  function apakahDiserang (b, idx, olehWarna) {
    for (var i = 0; i < 64; i++) {
      if (b[i] && warna(b[i]) === olehWarna) {
        var p = langkahPseudo(b, i, -1, null);
        for (var k = 0; k < p.length; k++) if (p[k].b === idx) return true;
      }
    }
    return false;
  }
  function rajaIdx (b, w) {
    var target = w === 'w' ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (b[i] === target) return i;
    return -1;
  }
  function cekra (b, w) { var i = rajaIdx(b, w); return i >= 0 && apakahDiserang(b, i, lawan(w)) }

  function terapkan (b, st3, mv) {
    var pc = b[mv.a]; var w = warna(pc);
    var st = { castling: { K: st3.castling.K, Q: st3.castling.Q, k: st3.castling.k, q: st3.castling.q }, enPesan: -1 };
    b[mv.b] = pc; b[mv.a] = '';
    if (mv.ep) { var ti = w === 'w' ? mv.b + 8 : mv.b - 8; b[ti] = '' }
    if (mv.castleID === 'K' || mv.castleID === 'Q') {
      var home = w === 'w' ? 7 : 0;
      if (mv.castleID === 'K') { b[home * 8 + 5] = b[home * 8 + 7]; b[home * 8 + 7] = '' }
      else { b[home * 8 + 3] = b[home * 8]; b[home * 8] = '' }
    }
    if (mv.promo) b[mv.b] = w === 'w' ? mv.promo : mv.promo.toLowerCase();
    if (pc === 'K') { st.castling.K = false; st.castling.Q = false }
    if (pc === 'k') { st.castling.k = false; st.castling.q = false }
    var sudutKiri = w === 'w' ? 56 : 0;
    if (mv.a === sudutKiri) st.castling[w === 'w' ? 'Q' : 'q'] = false;
    if (mv.a === sudutKiri + 7) st.castling[w === 'w' ? 'K' : 'k'] = false;
    if (mv.b === 56) st.castling.Q = false;
    if (mv.b === 63) st.castling.K = false;
    if (mv.b === 0) st.castling.q = false;
    if (mv.b === 7) st.castling.k = false;
    if (pc.toUpperCase() === 'P' && mv.ganda) st.enPesan = Math.floor((mv.a + mv.b) / 2);
    return st;
  }
  function langkahLegal (b, st3, warnaCari) {
    var out = [];
    for (var i = 0; i < 64; i++) {
      if (b[i] && warna(b[i]) === warnaCari) {
        var ps = langkahPseudo(b, i, st3.enPesan, st3.castling);
        for (var k = 0; k < ps.length; k++) {
          var bb2 = b.slice();
          if (ps[k].castleID) {
            var home = warnaCari === 'w' ? 7 : 0;
            var lintasan = ps[k].castleID === 'K' ? [home * 8 + 4, home * 8 + 5, home * 8 + 6] : [home * 8 + 4, home * 8 + 3, home * 8 + 2];
            var aman = true;
            for (var t = 0; t < 3; t++) if (apakahDiserang(bb2, lintasan[t], lawan(warnaCari))) { aman = false; break }
            if (!aman) continue;
          }
          terapkan(bb2, st3, ps[k]);
          if (!cekra(bb2, warnaCari)) out.push(ps[k]);
        }
      }
    }
    return out;
  }

  function nilaiPapan (b) {
    var n = 0;
    for (var i = 0; i < 64; i++) {
      var pc = b[i];
      if (!pc) continue;
      var v = NILAI[pc.toUpperCase()] * 100 + bonusPos(pc, i);
      n += warna(pc) === 'w' ? v : -v;
    }
    return n;
  }
  function minimax (b, st3, warnaCari, kedalaman, alfa, beta) {
    var legal = langkahLegal(b, st3, warnaCari);
    if (!legal.length) {
      return cekra(b, warnaCari) ? (warnaCari === 'b' ? 999999 + kedalaman : -999999 - kedalaman) : 0;
    }
    if (kedalaman === 0) return nilaiPapan(b);
    for (var i = legal.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = legal[i]; legal[i] = legal[j]; legal[j] = tmp;
    }
    legal.sort(function (x, y) { return (y.cap ? NILAI[String(y.cap).toUpperCase()] : 0) - (x.cap ? NILAI[String(x.cap).toUpperCase()] : 0) });
    if (warnaCari === 'b') {
      var terbaik = -Infinity;
      for (var k = 0; k < legal.length; k++) {
        var bb = b.slice();
        var st2 = terapkan(bb, st3, legal[k]);
        var nilai = minimax(bb, st2, 'w', kedalaman - 1, alfa, beta);
        if (nilai > terbaik) terbaik = nilai;
        if (terbaik > alfa) alfa = terbaik;
        if (beta <= alfa) break;
      }
      return terbaik;
    }
    var terburuk = Infinity;
    for (var k2 = 0; k2 < legal.length; k2++) {
      var bb2 = b.slice();
      var st22 = terapkan(bb2, st3, legal[k2]);
      var nilai2 = minimax(bb2, st22, 'b', kedalaman - 1, alfa, beta);
      if (nilai2 < terburuk) terburuk = nilai2;
      if (terburuk < beta) beta = terburuk;
      if (beta <= alfa) break;
    }
    return terburuk;
  }

  /* ---------- AI sesuai tingkat kesulitan ---------- */
  function langkahAI (sisi) {
    var legal = langkahLegal(papan, st, sisi);
    if (!legal.length) return null;
    var st2global = { castling: { K: st.castling.K, Q: st.castling.Q, k: st.castling.k, q: st.castling.q }, enPesan: st.enPesan };
    var nilai = [];
    for (var i = 0; i < legal.length; i++) {
      var bb = papan.slice();
      var st2 = terapkan(bb, st2global, legal[i]);
      var n = minimax(bb, st2, sisi === 'b' ? 'w' : 'b', kesulitan, -Infinity, Infinity);
      nilai.push({ mv: legal[i], n: sisi === 'b' ? n : -n });
    }
    nilai.sort(function (x, y) { return y.n - x.n });
    if (kesulitan === 0) {
      /* BEGINNER: acak dari 3 terbaik */
      var atas = nilai.slice(0, Math.min(3, nilai.length));
      return atas[Math.floor(Math.random() * atas.length)].mv;
    }
    return nilai[0].mv;
  }

  /* ---------- state permainan ---------- */
  var phase = 'lobi';         /* lobi | main | over */
  var warnaKamu = 'w';
  var kesulitan = 1;          /* 0 BEGINNER, 1 SENIOR, 2 GRANDMASTER */
  var NAMA_SU = ['BEGINNER', 'SENIOR', 'GRANDMASTER'];
  var GLIF_SU = ['☆', '★', '♛'];

  var papan = setupPapan();
  var st = { castling: { K: true, Q: true, k: true, q: true }, enPesan: -1 };
  var giliran = 'w';
  var terpilih = -1;
  var jalanLegalDariTerpilih = [];
  var langkahTerakhir = null;
  var over = false, hasil = '', skor = 0, partikel = [];
  var langkahLog = [], hlAngka = 1;
  var hitungLangkah = 0, aiJalan = -1, berkasMati = [], putihMati = [];
  var runT = 0;
  var animasi = [];  /* { pc, dari, ke, t, lama } — pergerakan halus */
  var DURASI_ANIM = 26; /* ±0.4 detik/frame */

  function evalTerakhir () { skor = nilaiPapan(papan) }
  function ledakan (x, y, w, n) {
    for (var i = 0; i < n; i++) partikel.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-5, 0.5), r: A.rand(1.5, 3.5), a: 1, w: w });
  }
  function pusat (idx) { return { x: BX + (idx % 8) * SQ + SQ / 2, y: BY + Math.floor(idx / 8) * SQ + SQ / 2 } }

  function baru (pertahankanSuati) {
    if (!pertahankanSuati) { warnaKamu = 'w'; kesulitan = 1 }
  }

  function mulaiPartai () {
    papan = setupPapan();
    st = { castling: { K: true, Q: true, k: true, q: true }, enPesan: -1 };
    giliran = 'w'; terpilih = -1; jalanLegalDariTerpilih = [];
    langkahTerakhir = null; over = false; hasil = '';
    hitungLangkah = 0; aiJalan = -1; berkasMati = []; putihMati = []; animasi = []; partikel = [];
    langkahLog = []; hlAngka = 1;
    phase = 'main';
    evalTerakhir();
    A.setScore(0);
    /* kalau kamu main HITAM → AI (putih) jalan duluan */
    if (warnaKamu === 'b') aiJalan = Math.max(1, Math.round((kesulitan === 0 ? 20 : 35)));
  }

  function periksaAkhir () {
    var legal = langkahLegal(papan, st, giliran);
    var sk = cekra(papan, giliran);
    if (!legal.length) {
      over = true;
      phase = 'over';
      var menang = giliran !== warnaKamu;
      if (sk) {
        hasil = menang ? 'PANTAS! SKAKMAT — kamu menang 🎉' : 'SKAKMAT — AI menang';
        A.SFX.crash();
      } else {
        hasil = 'SERI — langkah habis (stalemate)';
        A.SFX.level();
      }
      return;
    }
    var sisa = [];
    for (var i = 0; i < 64; i++) if (papan[i] && papan[i].toUpperCase() !== 'K') sisa.push(papan[i].toUpperCase());
    var matiLangsung = sisa.length === 0 || (sisa.length === 1 && (sisa[0] === 'B' || sisa[0] === 'N'));
    if (matiLangsung) {
      over = true; phase = 'over';
      hasil = 'SERI — materi tidak cukup';
      A.SFX.level();
    }
  }

  function jalankan (mv, pemain) {
    var pc = papan[mv.a]; var w = warna(pc);
    var tangkapan = mv.ep ? (w === 'w' ? 'p' : 'P') : papan[mv.b];
    if (tangkapan) {
      var nama = tangkapan === tangkapan.toUpperCase() ? 'putih' : 'hitam';
      if (nama === 'putih') putihMati.push(tangkapan); else berkasMati.push(tangkapan);
      ledakan(BX + (mv.b % 8) * SQ + SQ / 2, BY + Math.floor(mv.b / 8) * SQ + SQ / 2, nama === 'putih' ? '#e8eddf' : '#769656', 12);
      A.SFX.point();
    } else {
      A.SFX.jump();
    }
    /* antri animasi halus: simpan pc + posisi sebelum terapkan */
    var pcAnim = pc;
    var dariIdx = mv.a, keIdx = mv.b;
    if (mv.castleID) {
      var home2 = w === 'w' ? 7 : 0;
      if (mv.castleID === 'K') animasi.push({ pc: warnaKamu === 'w' ? 'r' : 'R', dari: home2 * 8 + 7, ke: home2 * 8 + 5, t: 0 });
      else animasi.push({ pc: warnaKamu === 'w' ? 'r' : 'R', dari: home2 * 8, ke: home2 * 8 + 3, t: 0 });
    }
    /* LOG langkah (notasi sederhana: tipe + kotak) */
    var tipeNama = { P: 'P', N: 'N', B: 'B', R: 'R', Q: 'Q', K: 'K' }[pc.toUpperCase()] || 'P';
    var aNama = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    var tujuanNama = aNama[mv.b % 8] + String(8 - Math.floor(mv.b / 8));
    langkahLog.push((warna(pc) === 'w' ? tipeNama : tipeNama.toLowerCase()) + tujuanNama);
    if (langkahLog.length > 24) langkahLog.shift();

    st = terapkan(papan, st, mv);
    /* bidak yang bergerak → animasi*/
    animasi.push({ pc: mv.promo ? (w === 'w' ? mv.promo : mv.promo.toLowerCase()) : pcAnim, dari: dariIdx, ke: keIdx, t: 0 });
    terpilih = -1; jalanLegalDariTerpilih = [];
    langkahTerakhir = [mv.a, mv.b];
    hitungLangkah++;
    giliran = lawan(giliran);
    evalTerakhir();
    A.setScore(Math.max(0, Math.round(skor / 10)));
    periksaAkhir();
    if (!over && giliran !== warnaKamu && phase === 'main') {
      aiJalan = kesulitan === 0 ? 18 : kesulitan === 1 ? 28 : 40;
    }
  }

  /* ---------- interaksi ---------- */
  function ketuk (px, py) {
    if (phase === 'lobi') { ketukLobi(px, py); return }
    if (phase === 'over') { phase = 'lobi'; return }
    /* konversi px→kotak, dengan dukungan orientasi dari sisi pemain */
    var orientasi = warnaKamu === 'w' ? 1 : -1;
    var rx = orientasi === 1 ? px - BX : (BX + SQ * 8 - px);
    var ry = orientasi === 1 ? py - BY : (BY + SQ * 8 - py);
    var cc = Math.floor(rx / SQ), rr = Math.floor(ry / SQ);
    if (cc < 0 || cc > 7 || rr < 0 || rr > 7) return;
    var idx = rr * 8 + cc;
    ketukKotak(idx);
  }

  /* index dari sudut mata kutu (row maju ke bawah putih|mundur hitam... orientasi selalu putih-bawah INTERNAL) */
  function ketukKotak (idx) {
    if (phase !== 'main' || over) return;
    if (giliran !== warnaKamu) return;
    var pc = papan[idx];
    if (terpilih >= 0) {
      for (var i = 0; i < jalanLegalDariTerpilih.length; i++) {
        if (jalanLegalDariTerpilih[i].b === idx) {
          jalankan(jalanLegalDariTerpilih[i], warnaKamu);
          return;
        }
      }
    }
    if (pc && warna(pc) === warnaKamu) {
      terpilih = idx;
      jalanLegalDariTerpilih = [];
      var semua = langkahLegal(papan, st, warnaKamu);
      for (var k = 0; k < semua.length; k++) if (semua[k].a === idx) jalanLegalDariTerpilih.push(semua[k]);
      A.SFX.point();
    } else {
      terpilih = -1; jalanLegalDariTerpilih = [];
    }
  }

  /* koordinat idx papan INTERNAL → layar (melihat dari sisi pemain) */
  function kotakLayar (idx) {
    var r = Math.floor(idx / 8), c2 = idx % 8;
    if (warnaKamu === 'b') { r = 7 - r; c2 = 7 - c2 }
    return { x: BX + c2 * SQ, y: BY + r * SQ };
  }

  /* ---------- LOBI (CHESS MASTER, seperti contoh tema) ---------- */
  var TOMBOL_LOBI = [
    { id: 'warna', y: 250, h: 56, lebar: 340, judul: function () { return 'PLAY AS: ' + (warnaKamu === 'w' ? '♕ WHITE' : '♚ BLACK') }, gaya: 'beige' },
    { id: 'su0', y: 330, h: 56, lebar: 340, judul: function () { return '☆  BEGINNER' }, gaya: 'coklat' },
    { id: 'su1', y: 412, h: 56, lebar: 340, judul: function () { return '★  SENIOR' }, gaya: 'kuning' },
    { id: 'su2', y: 494, h: 56, lebar: 340, judul: function () { return '♛ GRANDMASTER' }, gaya: 'merah' }
  ];
  function warnaGaya (gaya) {
    if (gaya === 'beige') return { bg: '#6e8898', garis: '#b3cdd9', teks: '#ffffff' };
    if (gaya === 'kuning') return { bg: '#4a3226', garis: '#e8bE17', teks: '#fbbf24' };
    if (gaya === 'merah') return { bg: '#5a1a12', garis: '#f43f30', teks: '#ffd9d4' };
    return { bg: '#4a3226', garis: '#8a6a5a', teks: '#ffffff' };
  }
  function ketukLobi (px, py) {
    for (var i = 0; i < TOMBOL_LOBI.length; i++) {
      var t = TOMBOL_LOBI[i];
      var x = (W - t.lebar) / 2;
      if (px >= x && px <= x + t.lebar && py >= t.y && py <= t.y + t.h) {
        A.SFX.point();
        if (t.id === 'warna') { warnaKamu = warnaKamu === 'w' ? 'b' : 'w' }
        else if (t.id === 'su0') { kesulitan = 0; mulaiPartai() }
        else if (t.id === 'su1') { kesulitan = 1; mulaiPartai() }
        else { kesulitan = 2; mulaiPartai() }
        return;
      }
    }
  }

  function gambarLobi () {
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2b1c14'); bg.addColorStop(0.6, '#3a241a'); bg.addColorStop(1, '#221108');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    function teks (t, x, y, sz, ws, gaya, rata) {
      ctx.fillStyle = ws;
      ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI", sans-serif';
      ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(t, x, y);
    }
    teks('♛', 40, 96, 42, '#f6c945', '900');
    teks('CHESS MASTER', 92, 96, 30, '#fbbf24', '900');
    ctx.fillStyle = '#f0e0cd'; ctx.fillRect(W - 150, 66, 120, 56);
    ctx.strokeStyle = '#d9c8b6'; ctx.lineWidth = 2; ctx.strokeRect(W - 150, 66, 120, 56);
    teks('YOU', W - 90, 85, 14, '#5a4a3c', '900', 'center');
    teks('vs AI', W - 90, 104, 14, '#5a4a3c', '900', 'center');

    teks('♛  DEEP CHESS CHALLENGE', W / 2, 178, 18, '#f6c945', '900', 'center');
    teks('Pilih warna & tingkat kesulitanmu!', W / 2, 208, 13.5, '#e8d4c0', '600', 'center');

    for (var i = 0; i < TOMBOL_LOBI.length; i++) {
      var t = TOMBOL_LOBI[i];
      var x = (W - t.lebar) / 2;
      var gs = warnaGaya(t.gaya);
      ctx.fillStyle = gs.bg; ctx.fillRect(x, t.y, t.lebar, t.h);
      var lgot = t.gaya === 'kuning' ? (kesulitan === 1 ? '#fbbf24' : gs.garis) : (t.id === 'warna' ? gs.garis : gs.garis);
      ctx.strokeStyle = lgot; ctx.lineWidth = (t.gaya === 'kuning' && kesulitan === 1) || t.id === 'warna' ? 3 : 2;
      ctx.strokeRect(x, t.y, t.lebar, t.h);
      /* rounded corners efekt */
      teks(t.judul(), W / 2, t.y + t.h / 2, 17, gs.teks, '800', 'center');
      if (t.gaya === 'kuning') teks('★', x - 18, t.y + t.h / 2, 20, '#fbbf24', '900', 'center');
    }
    /* info tingkat terpilih di sisi tombol kiri */
    teks('★ ' + NAMA_SU[kesulitan], W / 2 - t.lebar / 2 - 70, 412 + 28, 13, '#fbbf24', '800', 'center');
    teks('YOU', W / 2 + t.lebar / 2 + 70, 250 + 28, 13, '#c8a888', '800', 'center');
    teks('vs', W / 2 + t.lebar / 2 + 70, 330 + 28, 13, '#c8a888', '800', 'center');
    teks('AI', W / 2 + t.lebar / 2 + 70, 412 + 28, 13, '#c8a888', '800', 'center');

    teks('Kamu melawan AI. Setiap kesulitan mengubah kedalaman perhitungannya.', W / 2, 584, 12.5, '#cfae96', '600', 'center');
    teks('Tap tombol kesulitan untuk MULAI BERMAIN — waktu tidak dibatasi.', W / 2, 606, 12.5, '#cfae96', '600', 'center');
    teks('♛ CHESS MASTER · THERYHANN! BOT', W / 2, 652, 13, '#f6c945', '800', 'center');
    teks('tap untuk memilih', W / 2, 676, 11.5, '#8a7a6c', '600', 'center');
  }

  /* ---------- gambar papan main ---------- */
  var GLIF = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
  };
  function teks (t, x, y, sz, ws, gaya, rata) {
    ctx.fillStyle = ws;
    ctx.font = (gaya || '700') + ' ' + sz + 'px "Segoe UI Symbol", "Noto Sans Symbols", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
  }

  function posisiAnimasi (idx) {
    /* posisi GUI sebuah bidak di idx; bila bidaknya sedang bergerak → geser lerp */
    var P = kotakLayar(idx);
    for (var i = 0; i < animasi.length; i++) {
      var a = animasi[i];
      if (a.ke === idx) {
        var laju = Math.min(1, a.t / DURASI_ANIM);
        var ease = 1 - (1 - laju) * (1 - laju) * (1 - laju); /* ease-out cubic — HALUS */
        var dariP = kotakLayar(a.dari);
        return {
          x: dariP.x + (P.x - dariP.x) * ease,
          y: dariP.y + (P.y - dariP.y) * ease,
          sedang: laju < 1
        };
      }
    }
    return { x: P.x, y: P.y, sedang: false };
  }

  /* ---------- header CHESS MASTER: judul emas · kartu YOU · 3 status card · label YOU ---------- */
  function smallCard (x, y, w, h, judul, nilai, warnaNilai) {
    ctx.fillStyle = '#382518'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    teks(judul, x + w / 2, y + 14, 9.5, '#b98a63', '800', 'center');
    teks(nilai, x + w / 2, y + h - 13, 13.5, warnaNilai || '#fbbf24', '900', 'center');
  }
  function gambarPapanHeader () {
    /* ♛ CHESS MASTER emas (kiri) */
    ctx.font = '900 28px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('♛ CHESS MASTER', BX, 16);
    /* YOU vs AI beige card (kanan atas) */
    ctx.fillStyle = '#f0e0cd'; ctx.fillRect(W - 152, 6, 126, 48);
    ctx.strokeStyle = '#d9c8b6'; ctx.lineWidth = 2; ctx.strokeRect(W - 152, 6, 126, 48);
    teks('YOU', W - 89, 22, 12.5, '#5a4a3c', '900', 'center');
    teks('vs AI', W - 89, 40, 12.5, '#5a4a3c', '900', 'center');

    /* 3 status cards: TURN / LEVEL / STATUS — seperti foto referensi */
    var lebar1 = (W - BX - 64) / 3;
    smallCard(BX, 84, lebar1 - 6, 42, 'TURN', phase === 'main' ? (giliran === 'w' ? 'WHITE' : 'BLACK') : '—', '#e2e8f0');
    smallCard(BX + lebar1 + 2, 84, lebar1 - 6, 42, 'LEVEL', GLIF_SU[kesulitan] + ' ' + NAMA_SU[kesulitan], '#fbbf24');
    var sts = over ? 'SELESAI' : (cekra(papan, warnaKamu) ? 'SKAK' : (giliran === warnaKamu ? 'MAINMU' : 'AI…'));
    smallCard(BX + lebar1 * 2 + 8, 84, lebar1 - 6, 42, 'STATUS', sts, sts === 'SKAK' ? '#f43f30' : (sts === 'MAINMU' ? '#34d399' : '#f87171'));

    /* label YOU brown card (ember berdenyut saat giliranmu) */
    var pulse = (giliran === warnaKamu && !over && phase === 'main') ? (0.6 + 0.2 * Math.sin(runT * 0.1)) : 0.16;
    ctx.globalAlpha = Math.min(1, pulse + 0.3);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(BX, 134, 150, 30);
    ctx.strokeStyle = giliran === warnaKamu ? '#fbbf24' : '#5a3f2a'; ctx.lineWidth = giliran === warnaKamu ? 2.5 : 1.5; ctx.strokeRect(BX, 134, 150, 30);
    ctx.globalAlpha = 1;
    teks((giliran === warnaKamu ? '» ' : '') + 'YOU · ' + (warnaKamu === 'w' ? 'PUTIH ♙' : 'HITAM ♟'), BX + 75, 149, 12, giliran === warnaKamu ? '#fbbf24' : '#b98a63', '800', 'center');
  }

  function gambarPapan () {
    gambarPapanHeader();
    for (var r = 0; r < 8; r++) {
      var kiriX = BX - 8;
      var layarBaris = warnaKamu === 'w' ? String(8 - r) : String(r + 1);
      var layarKolom = warnaKamu === 'w' ? String.fromCharCode(97 + r) : String.fromCharCode(97 + 7 - r);
      teks(layarBaris, kiriX, BY + r * SQ + SQ / 2, 10, '#8a8a8a', '700', 'center' === 'center' ? 'center' : 'center');
      teks(layarKolom, BX + r * SQ + SQ / 2, BAWAH + 10, 10, '#8a8a8a', '700', 'center');
      for (var c2 = 0; c2 < 8; c2++) {
        var idx = (warnaKamu === 'w' ? r : 7 - r) * 8 + (warnaKamu === 'w' ? c2 : 7 - c2);
        var pos = posisiAnimasi(idx);
        var xx = BX + c2 * SQ, yy = BY + r * SQ;
        var gelap = (r + c2) % 2 === 1;
        ctx.fillStyle = gelap ? '#b58863' : '#f0d9b5';
        ctx.fillRect(xx, yy, SQ, SQ);
        if (langkahTerakhir && (langkahTerakhir[0] === idx || langkahTerakhir[1] === idx)) {
          ctx.fillStyle = 'rgba(56,189,248,0.35)'; ctx.fillRect(xx, yy, SQ, SQ);
        }
        if (terpilih === idx) {
          ctx.strokeStyle = '#1ed760'; ctx.lineWidth = 3.5; ctx.strokeRect(xx + 1.5, yy + 1.5, SQ - 3, SQ - 3);
        } else {
          var dariTerpilih = false;
          var d2 = false;
          for (var mk = 0; mk < jalanLegalDariTerpilih.length; mk++) {
            if (jalanLegalDariTerpilih[mk].b === idx) { d2 = true; break }
          }
          if (d2) {
            ctx.fillStyle = 'rgba(52,211,153,0.45)';
            ctx.fillRect(xx, yy, SQ, SQ);
          }
        }
      }
    }
    /* bidak — digambar di posisi animasi */
    for (var i2 = 0; i2 < 64; i2++) {
      var pc2 = papan[i2];
      if (!pc2) continue;
      var pp = posisiAnimasi(i2);
      var glif = GLIF[pc2] || '?';
      /* bidak yang sedang bergerak → glow hijau lingkaran target */
      ctx.font = '54px "Segoe UI Symbol", "Noto Sans Symbols", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (pc2 !== pc2.toUpperCase()) {
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.strokeText(glif, pp.x + SQ / 2, pp.y + SQ / 2 + 3);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(glif, pp.x + SQ / 2, pp.y + SQ / 2 + 3);
      } else {
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(30,30,30,0.85)';
        ctx.strokeText(glif, pp.x + SQ / 2, pp.y + SQ / 2 + 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(glif, pp.x + SQ / 2, pp.y + SQ / 2 + 3);
      }
    }

    var capH = '';
    for (var i3 = 0; i3 < berkasMati.length; i3++) capH += (GLIF[berkasMati[i3]] || '');
    var capP = '';
    for (var i4 = 0; i4 < putihMati.length; i4++) capP += (GLIF[putihMati[i4]] || '');
    teks('Tumbal (kamu ambil): ' + (capH || '-'), BX, BAWAH + 34, 12, '#e2e8f0', '600');
    teks('Ditangkap AI: ' + (capP || '-'), W - BX, BAWAH + 34, 12, '#8a8a8a', '600', 'right');

    /* bar AI label brown */
    ctx.fillStyle = '#382518'; ctx.fillRect(BX, BAWAH + 10, 130, 30);
    ctx.strokeStyle = '#5a3f2a'; ctx.lineWidth = 1.5; ctx.strokeRect(BX, BAWAH + 10, 130, 30);
    teks('AI', BX + 65, BAWAH + 25, 12, '#f87171', '900', 'center');

    /* kartu LOG langkah (dari foto referensi) */
    ctx.fillStyle = '#382518'; ctx.fillRect(BX, BAWAH + 46, SQ * 8, 48);
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 1.5; ctx.strokeRect(BX, BAWAH + 46, SQ * 8, 48);
    teks('LOG', BX + 10, BAWAH + 64, 10, '#b98a63', '800');
    var logTeks = langkahLog.length ? langkahLog.join('  ') : '(belum ada langkah)';
    teks(logTeks.slice(0, 78), BX + 52, BAWAH + 64, 11.5, '#f0e0cd', '700');

    /* status strip kecil (kalimatStatus tetap ada) */
    teks(kalimatStatus(), BX + SQ * 8 - 136, BAWAH + 25, 11, cekra(papan, giliran) ? '#f43f30' : '#b98a63', '700', 'right');

    if (over) {
      ctx.fillStyle = 'rgba(11,13,11,0.80)'; ctx.fillRect(0, 0, W, H);
      teks('♛ CHESS MASTER', W / 2, H / 2 - 66, 20, '#fbbf24', '900', 'center');
      ctx.fillStyle = '#2b1c14'; ctx.fillRect(W / 2 - 210, H / 2 - 48, 420, 92);
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 210, H / 2 - 48, 420, 92);
      teks(hasil, W / 2, H / 2 - 16, hasil.includes('SERI') ? 17 : 20, hasil.includes('SERI') ? '#fbbf24' : hasil.includes('menang 🎉') || hasil.includes('🎉') ? '#34d399' : '#f87171', '900', 'center');
      teks(hasil.includes('SERI') ? 'Remis' : 'Skor material: ' + (skor > 0 ? '+' : '') + Math.round((skor / 100) * 10) / 10, W / 2, H / 2 + 12, 13.5, '#e2e8f0', '700', 'center');
      teks('Ketuk layar kembali ke LOBI CHESS MASTER', W / 2, H / 2 + 78, 13.5, '#8ecae6', '700', 'center');
    }
  }

  function kalimatStatus () {
    return phase !== 'main' ? ''
      : over ? hasil
      : giliran !== warnaKamu ? 'AI berpikir… (' + NAMA_SU[kesulitan] + ' · ' + (GLIF_SU[kesulitan]) + ')'
      : cekra(papan, warnaKamu) ? '⚠ SKAK pada rajamu!'
      : terpilih >= 0 && jalanLegalDariTerpilih.length ? jalanLegalDariTerpilih.length + ' tujuan legal ditandai'
      : 'Ketuk bidakmu untuk bergerak';
  }

  /* ---------- loop ---------- */
  var last = 0;
  function update (dt) {
    runT += dt;
    for (var i = animasi.length - 1; i >= 0; i--) {
      animasi[i].t += dt;
      if (animasi[i].t >= DURASI_ANIM) animasi.splice(i, 1);
    }
    if (aiJalan > 0 && phase === 'main' && !over) {
      aiJalan -= dt;
      if (aiJalan <= 0) {
        aiJalan = -1;
        var mv = langkahAI(lawan(warnaKamu));
        if (mv) jalankan(mv, 'ai');
      }
    }
    for (var pi = partikel.length - 1; pi >= 0; pi--) {
      var q = partikel[pi];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.15 * dt; q.a -= 0.02 * dt;
      if (q.a <= 0) partikel.splice(pi, 1);
    }
    if (phase === 'main') { evalTerakhir(); A.setScore(Math.max(0, Math.round(skor / 10))) }
    A.setStatus(phase === 'lobi' ? 'LOBI' : (giliran === warnaKamu ? 'GILIRANMU' : 'PIKIRAN AI'), over ? 'SELESAI' : (phase === 'main' && cekra(papan, giliran) ? 'SKAK' : phase === 'main' ? 'BERJALAN' : 'PILIH'));
    A.state = {
      phase: phase,
      warnaKamu: warnaKamu,
      kesulitan: kesulitan, namaKesulitan: NAMA_SU[kesulitan],
      giliran: giliran,
      giliranPutih: giliran === 'w',
      giliranKamu: giliran === warnaKamu,
      terpilih: terpilih,
      legalCount: jalanLegalDariTerpilih.length,
      over: over, hasil: hasil,
      check: phase === 'main' ? cekra(papan, giliran) : false,
      langkah: hitungLangkah,
      material: Number((skor / 100).toFixed(2)),
      matiHitam: berkasMati.slice(),
      matiPutih: putihMati.slice(),
      papan: papan.slice(),
      animasi: animasi.length,
      bidak: (function () { var n = 0; for (var j = 0; j < 64; j++) if (papan[j]) n++; return n })(),
      kosong: false
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    if (phase === 'lobi') { gambarLobi(); return }
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2b1c14'); bg.addColorStop(0.5, '#231511'); bg.addColorStop(1, '#180d08');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a241a';
    ctx.fillRect(BX - 12, BY - 12, SQ * 8 + 24, SQ * 8 + 24);
    ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2; ctx.strokeRect(BX - 12, BY - 12, SQ * 8 + 24, SQ * 8 + 24);
    gambarPapan();
    for (var i = 0; i < partikel.length; i++) {
      var q = partikel[i];
      ctx.globalAlpha = Math.max(0, q.a);
      ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
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

  var idle = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min(3, Math.max(0.1, (t - last) / 16.67));
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  /* HUD boot: score/best terisi sejak lobi */
  A.setScore(0);
  A.setBest();
  A.debug = { papan: function () { return papan.slice() }, st: function () { return st }, langkahLegal: langkahLegal, jalankan: jalankan, ketuk: ketuk, evalTerakhir: evalTerakhir, minimax: minimax, setupPapan: setupPapan, GLIF: GLIF, mulaiPartai: mulaiPartai, phase: function () { return phase }, pilihKesulitan: function (k, w) { kesulitan = k; if (w) warnaKamu = w } };
  requestAnimationFrame(loop);
`



/* ================================================================== */
/*  4. MINESWEEPER NEON — 560x620 — ◀▶▲▼ kursor, ● gali, tahan ● bendera */
/* ================================================================== */
const MINESWEEPER_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var LEVEL = [{ n: 9, m: 10 }, { n: 10, m: 16 }, { n: 12, m: 24 }, { n: 13, m: 32 }];
  var N, M, CELL, OX, OY;
  var petak, buka, bendera, ranjau, kx, ky, aman, dibuka;
  var score, level, timer, gameOver, sebab, runT, keys, parts, moveCd, tahanAct, sudahFlag, pertama, sisaBendera;

  function resetLevel (lv) {
    var cfg = LEVEL[Math.min(lv - 1, LEVEL.length - 1)];
    N = cfg.n; M = cfg.m;
    CELL = Math.min(Math.floor((W - 32) / N), 46);
    OX = Math.round((W - N * CELL) / 2); OY = 124;
    petak = []; buka = []; bendera = []; ranjau = [];
    for (var i = 0; i < N * N; i++) { petak.push(0); buka.push(false); bendera.push(false); }
    aman = N * N - M; dibuka = 0; pertama = true;
    sisaBendera = M;
  }
  function reset () {
    score = 0; level = 1; timer = 4500; gameOver = false; sebab = 0;
    runT = 0; keys = {}; parts = []; moveCd = 0; tahanAct = 0; sudahFlag = false;
    kx = Math.floor(N / 2); ky = Math.floor(N / 2);
    resetLevel(1);
    kx = Math.floor(N / 2); ky = Math.floor(N / 2);
    A.setScore(0); A.setBest(); A.setProgress(1);
    A.setStatus('Level 1', 'Ranjau ' + M);
  }
  function tetangga (i) {
    var r = Math.floor(i / N), f = i % N, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var df = -1; df <= 1; df++) {
        if (!dr && !df) continue;
        var rr = r + dr, ff = f + df;
        if (rr >= 0 && rr < N && ff >= 0 && ff < N) out.push(rr * N + ff);
      }
    }
    return out;
  }
  function sebarRanjau (hindari) {
    var larang = {}; larang[hindari] = 1;
    tetangga(hindari).forEach(function (t) { larang[t] = 1; });
    var pilihan = [];
    for (var i = 0; i < N * N; i++) if (!larang[i]) pilihan.push(i);
    for (var k = 0; k < M && pilihan.length; k++) {
      var p = Math.floor(Math.random() * pilihan.length);
      var idx = pilihan.splice(p, 1)[0];
      petak[idx] = -1; ranjau.push(idx);
    }
    for (var j = 0; j < N * N; j++) {
      if (petak[j] === -1) continue;
      var hit = 0;
      tetangga(j).forEach(function (t) { if (petak[t] === -1) hit++; });
      petak[j] = hit;
    }
    pertama = false;
  }
  function ledak (i) {
    for (var q = 0; q < 7; q++) {
      parts.push({ x: OX + (i % N) * CELL + CELL / 2, y: OY + Math.floor(i / N) * CELL + CELL / 2, vx: A.rand(-4, 4), vy: A.rand(-4, 2), life: 1, warna: q % 2 ? '#ff0055' : '#ffb703' });
    }
  }
  function mati (s) {
    if (gameOver) return;
    gameOver = true; sebab = s; A.SFX.crash();
    for (var q = 0; q < ranjau.length; q++) { buka[ranjau[q]] = true; ledak(ranjau[q]); }
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
  }
  function bukaSel (i) {
    if (buka[i] || bendera[i]) return;
    if (pertama) sebarRanjau(i);
    if (petak[i] === -1) { mati(1); return; }
    var tumpuk = [i];
    while (tumpuk.length) {
      var cur = tumpuk.pop();
      if (buka[cur] || bendera[cur]) continue;
      buka[cur] = true; dibuka++; score += 2;
      if (petak[cur] === 0) tetangga(cur).forEach(function (t) { if (!buka[t] && !bendera[t]) tumpuk.push(t); });
    }
    A.SFX.point();
    if (dibuka >= aman) {
      score += 120 + level * 30;
      var bonus = Math.floor(timer / 60);
      score += Math.min(200, bonus);
      A.SFX.level();
      level++;
      if (level > LEVEL.length) { level = LEVEL.length; M += 4; }
      var tSisa = timer;
      resetLevel(level);
      timer = Math.min(4500, tSisa + 1200);
      kx = Math.floor(N / 2); ky = Math.floor(N / 2);
      if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    }
  }
  function toggleBendera (i) {
    if (buka[i]) return;
    bendera[i] = !bendera[i];
    sisaBendera += bendera[i] ? -1 : 1;
    A.SFX.jump();
  }

  function update (dt) {
    runT += dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.03 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;
    timer -= dt;
    if (timer <= 0) { mati(2); return; }
    if (moveCd > 0) moveCd -= dt;
    if (moveCd <= 0) {
      var pindah = false;
      if (keys.ArrowLeft || keys.KeyA) { kx = Math.max(0, kx - 1); pindah = true; }
      else if (keys.ArrowRight || keys.KeyD) { kx = Math.min(N - 1, kx + 1); pindah = true; }
      if (keys.ArrowUp || keys.KeyW) { ky = Math.max(0, ky - 1); pindah = true; }
      else if (keys.ArrowDown || keys.KeyS) { ky = Math.min(N - 1, ky + 1); pindah = true; }
      if (pindah) { moveCd = 7; A.SFX.jump(); }
    }
    /* tahan ● = bendera */
    if (keys.Space || keys.Enter) {
      tahanAct += dt;
      if (tahanAct >= 15 && !sudahFlag) { sudahFlag = true; toggleBendera(ky * N + kx); }
    }
    A.setScore(score);
    A.setProgress(timer / 4500);
    A.setStatus('Level ' + level + ' \\u00B7 ' + N + 'x' + N,
      'Ranjau ' + sisaBendera + ' \\u00B7 dibuka ' + dibuka + '/' + aman + ' \\u00B7 ' + Math.ceil(timer / 60) + 's');
  }

  var WARNA_ANGKA = ['#00f3ff', '#00ff87', '#ffb703', '#ff5e00', '#ff007f', '#9d4edd', '#60efff', '#ffffff'];
  function draw () {
    var th = A.theme(level - 1);
    ctx.clearRect(0, 0, W, H);
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#060911'); bg.addColorStop(1, '#140a28');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = th.primary; ctx.font = '900 18px "Segoe UI", sans-serif';
    ctx.fillText('MINESWEEPER NEON', 16, 30);
    ctx.fillStyle = '#fff'; ctx.font = '900 22px "Segoe UI", sans-serif';
    ctx.fillText(A.pad4(score), W - 88, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Ranjau tersisa: ' + sisaBendera + '   Dibuka: ' + dibuka + '/' + aman, 16, 52);
    ctx.fillStyle = timer < 600 ? '#ff0055' : 'rgba(255,255,255,0.7)';
    ctx.fillText('Waktu: ' + Math.ceil(timer / 60) + ' detik   \\u00B7   Level ' + level + ' (' + N + 'x' + N + ')', 16, 70);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Ketuk petak = gali  \\u00B7  tahan \\u25CF 15 frame = bendera  \\u00B7  tahan lama di HP = bendera', 16, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fillRect(16, 100, W - 32, 8);
    ctx.fillStyle = timer < 600 ? '#ff0055' : th.primary;
    ctx.fillRect(16, 100, (W - 32) * Math.max(0, timer / 4500), 8);

    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var i = y * N + x, px = OX + x * CELL, py = OY + y * CELL;
        if (!buka[i]) {
          ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,0.075)' : 'rgba(255,255,255,0.11)';
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          if (bendera[i]) {
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(px + CELL / 2 - 1, py + CELL * 0.22, 2, CELL * 0.5);
            ctx.beginPath();
            ctx.moveTo(px + CELL / 2 + 1, py + CELL * 0.24);
            ctx.lineTo(px + CELL / 2 + CELL * 0.3, py + CELL * 0.36);
            ctx.lineTo(px + CELL / 2 + 1, py + CELL * 0.48);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = petak[i] === -1 ? 'rgba(255,0,85,0.35)' : 'rgba(6,10,20,0.85)';
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          if (petak[i] === -1) {
            ctx.fillStyle = '#ff0055';
            ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, CELL * 0.24, 0, Math.PI * 2); ctx.fill();
          } else if (petak[i] > 0) {
            ctx.fillStyle = WARNA_ANGKA[petak[i] % 8];
            ctx.font = '900 ' + Math.round(CELL * 0.5) + 'px "Segoe UI", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(petak[i]), px + CELL / 2, py + CELL / 2 + 1);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
          }
        }
      }
    }
    if (!gameOver) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(OX + kx * CELL, OY + ky * CELL, CELL, CELL);
      if (tahanAct > 0 && !sudahFlag) {
        ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(OX + kx * CELL + CELL / 2, OY + ky * CELL + CELL / 2, CELL * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, tahanAct / 15));
        ctx.stroke();
      }
    }
    ctx.strokeStyle = th.primary; ctx.lineWidth = 2;
    ctx.strokeRect(OX - 3, OY - 3, N * CELL + 6, N * CELL + 6);
    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, 4, 4); });
    ctx.globalAlpha = 1;

    if (gameOver) {
      ctx.fillStyle = 'rgba(6,9,17,0.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 26);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  level ' + level, W / 2, H / 2 + 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText(sebab === 1 ? 'Kena ranjau!' : 'Waktu habis (75 detik)', W / 2, H / 2 + 26);
      ctx.fillStyle = th.primary; ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 54);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = {
      petak: petak.slice(), buka: buka.slice(), bendera: bendera.slice(), ranjau: ranjau.slice(),
      kx: kx, ky: ky, n: N, m: M, cell: CELL, ox: OX, oy: OY, score: score, level: level,
      timer: timer, over: gameOver, sebab: sebab, dibuka: dibuka, aman: aman, sisaBendera: sisaBendera,
      pertama: pertama, keys: keys, w: W, h: H
    };
    requestAnimationFrame(loop);
  }

  var sentuhMulai = 0, sentuhIdx = -1;
  function idxSentuh (e) {
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var src = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    var tx = (src.clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (src.clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    if (tx < OX || tx > OX + N * CELL || ty < OY || ty > OY + N * CELL) return -1;
    return Math.floor((ty - OY) / CELL) * N + Math.floor((tx - OX) / CELL);
  }
  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    sentuhMulai = Date.now(); sentuhIdx = idxSentuh(e);
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('touchend', function (e) {
    if (gameOver || sentuhIdx < 0) return;
    if (Date.now() - sentuhMulai > 380) toggleBendera(sentuhIdx); else bukaSel(sentuhIdx);
    sentuhIdx = -1; e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  function setKey (k, v) {
    keys[k] = v;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = v;
    else if (k === 'ArrowDown' || k === 'KeyS') keys.down = v;
    else if (k === 'ArrowLeft' || k === 'KeyA') keys.left = v;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = v;
    else if (k === 'Space' || k === 'Enter') keys.act = v;
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    setKey(k, true);
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); e.preventDefault(); return; }
    if (k === 'Space' || k === 'Enter') { tahanAct = 0; sudahFlag = false; }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.code;
    setKey(k, false);
    if (k === 'Space' || k === 'Enter') {
      if (!sudahFlag && !gameOver) bukaSel(ky * N + kx);
      tahanAct = 0; sudahFlag = false;
    }
  });

  resetLevel(1);
  reset();
  requestAnimationFrame(loop);
`

/* ================================================================== */
/*  5. ASTEROIDS NEON — 700x520 — ◀▶ putar, ▲ dorong, ● tembak, ▼ lompat */
/* ================================================================== */
const ASTEROIDS_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var ship, rocks, bullets, parts, stars, score, lives, level, gameOver, runT, keys, cool, inv, shots, hits, hyperCd, nextLife;

  function bintang () {
    stars = [];
    for (var i = 0; i < 60; i++) stars.push({ x: A.rand(0, W), y: A.rand(0, H), s: A.rand(0.6, 2), a: A.rand(0.2, 0.9) });
  }
  function buatBatu (n, jauh) {
    for (var i = 0; i < n; i++) {
      var x, y;
      if (jauh) {
        var sisi = Math.floor(Math.random() * 4);
        x = sisi === 0 ? 0 : sisi === 1 ? W : A.rand(0, W);
        y = sisi === 2 ? 0 : sisi === 3 ? H : A.rand(0, H);
      } else { x = A.rand(0, W); y = A.rand(0, H); }
      if (Math.hypot(x - ship.x, y - ship.y) < 110) { x = (x + W / 2) % W; y = (y + H / 2) % H; }
      var a = A.rand(0, Math.PI * 2), sp = A.rand(0.6, 1.5) + level * 0.12;
      rocks.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, ang: A.rand(0, 6.3), spin: A.rand(-0.05, 0.05), sisi: [] });
      var s = rocks[rocks.length - 1], titik = 9;
      for (var k = 0; k < titik; k++) s.sisi.push(A.rand(0.72, 1.18));
    }
  }
  function pecah (b) {
    var ukuran = b.r === 3 ? 34 : b.r === 2 ? 20 : 11;
    for (var i = 0; i < 8; i++) {
      parts.push({ x: b.x, y: b.y, vx: A.rand(-3, 3), vy: A.rand(-3, 3), life: 1, warna: i % 2 ? '#ffb703' : '#00f3ff', size: A.rand(2, 4) });
    }
    if (b.r > 1) {
      for (var j = 0; j < 2; j++) {
        var a = A.rand(0, 6.28), sp = A.rand(1, 2.2) + level * 0.1;
        var nb = { x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: b.r - 1, ang: 0, spin: A.rand(-0.08, 0.08), sisi: [] };
        for (var q = 0; q < 8; q++) nb.sisi.push(A.rand(0.72, 1.18));
        nb.ukuran = ukuran * 0.55;
        rocks.push(nb);
      }
    }
  }
  function reset () {
    ship = { x: W / 2, y: H / 2, ang: -Math.PI / 2, vx: 0, vy: 0, r: 11 };
    rocks = []; bullets = []; parts = [];
    score = 0; lives = 3; level = 1; gameOver = false; runT = 0;
    keys = {}; cool = 0; inv = 90; shots = 0; hits = 0; hyperCd = 0; nextLife = 5000;
    bintang();
    buatBatu(4, true);
    A.setScore(0); A.setBest(); A.setProgress(1);
    A.setStatus('Level 1', 'Nyawa 3');
  }
  function bungkus (o) {
    if (o.x < -20) o.x = W + 20; if (o.x > W + 20) o.x = -20;
    if (o.y < -20) o.y = H + 20; if (o.y > H + 20) o.y = -20;
  }
  function radiusBatu (b) { return b.r === 3 ? 34 : b.r === 2 ? 20 : 11; }
  function mati () {
    if (gameOver) return;
    gameOver = true; A.SFX.crash();
    for (var i = 0; i < 24; i++) parts.push({ x: ship.x, y: ship.y, vx: A.rand(-5, 5), vy: A.rand(-5, 5), life: 1.4, warna: i % 2 ? '#ff0055' : '#ffffff', size: A.rand(2, 5) });
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
  }
  function tembak () {
    if (cool > 0 || bullets.length > 5) return;
    bullets.push({ x: ship.x + Math.cos(ship.ang) * 13, y: ship.y + Math.sin(ship.ang) * 13, vx: Math.cos(ship.ang) * 8 + ship.vx, vy: Math.sin(ship.ang) * 8 + ship.vy, life: 62 });
    cool = 10; shots++; A.SFX.jump();
  }
  function lompat () {
    if (hyperCd > 0) return;
    ship.x = A.rand(60, W - 60); ship.y = A.rand(60, H - 60);
    ship.vx = 0; ship.vy = 0; inv = 70; hyperCd = 120; A.SFX.level();
    for (var i = 0; i < 10; i++) parts.push({ x: ship.x, y: ship.y, vx: A.rand(-3, 3), vy: A.rand(-3, 3), life: 0.8, warna: '#9d4edd', size: 3 });
  }

  function update (dt) {
    runT += dt;
    if (cool > 0) cool -= dt;
    if (inv > 0) inv -= dt;
    if (hyperCd > 0) hyperCd -= dt;
    parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.025 * dt; });
    parts = parts.filter(function (p) { return p.life > 0; });
    if (gameOver) return;

    if (keys.ArrowLeft || keys.KeyA) ship.ang -= 0.075 * dt;
    if (keys.ArrowRight || keys.KeyD) ship.ang += 0.075 * dt;
    if (keys.ArrowUp || keys.KeyW) {
      ship.vx += Math.cos(ship.ang) * 0.16 * dt;
      ship.vy += Math.sin(ship.ang) * 0.16 * dt;
      if (runT % 3 < 1.2) parts.push({ x: ship.x - Math.cos(ship.ang) * 12, y: ship.y - Math.sin(ship.ang) * 12, vx: A.rand(-0.6, 0.6), vy: A.rand(-0.6, 0.6), life: 0.5, warna: '#00f3ff', size: 2 });
    }
    if (keys.ArrowDown || keys.KeyS) { ship.vx *= Math.pow(0.94, dt); ship.vy *= Math.pow(0.94, dt); }
    if (keys.Space || keys.Enter) tembak();

    var sp = Math.hypot(ship.vx, ship.vy);
    if (sp > 6.2) { ship.vx = ship.vx / sp * 6.2; ship.vy = ship.vy / sp * 6.2; }
    ship.vx *= Math.pow(0.995, dt); ship.vy *= Math.pow(0.995, dt);
    ship.x += ship.vx * dt; ship.y += ship.vy * dt;
    bungkus(ship);

    bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; bungkus(b); });
    bullets = bullets.filter(function (b) { return b.life > 0; });
    rocks.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; b.ang += b.spin * dt; bungkus(b); });

    /* tabrakan peluru x batu */
    for (var i = bullets.length - 1; i >= 0; i--) {
      for (var j = rocks.length - 1; j >= 0; j--) {
        if (Math.hypot(bullets[i].x - rocks[j].x, bullets[i].y - rocks[j].y) < radiusBatu(rocks[j]) + 3) {
          var b2 = rocks[j];
          score += b2.r === 3 ? 20 : b2.r === 2 ? 50 : 100;
          hits++;
          bullets.splice(i, 1); rocks.splice(j, 1);
          pecah(b2); A.SFX.point();
          break;
        }
      }
    }
    /* tabrakan kapal x batu */
    if (inv <= 0) {
      for (var k = 0; k < rocks.length; k++) {
        if (Math.hypot(ship.x - rocks[k].x, ship.y - rocks[k].y) < radiusBatu(rocks[k]) + ship.r - 3) {
          var rb = rocks[k];
          rocks.splice(k, 1); pecah(rb);
          lives--;
          if (lives <= 0) { mati(); return; }
          A.SFX.crash();
          ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0; inv = 110;
          break;
        }
      }
    }
    if (score >= nextLife) { lives++; nextLife += 5000; A.SFX.level(); }
    if (!rocks.length) {
      level++; score += 100; A.SFX.level();
      buatBatu(3 + level, true);
    }
    if (score > A.best) { A.best = score; A.saveBest(score); A.setBest(); }
    A.setScore(score);
    A.setProgress(rocks.length ? 1 - Math.min(1, rocks.length / 12) : 1);
    A.setStatus('Level ' + level + ' \\u00B7 batu ' + rocks.length, 'Nyawa ' + lives + ' \\u00B7 tembakan ' + shots + ' \\u00B7 kena ' + hits);
  }

  function draw () {
    var th = A.theme(0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04060e'; ctx.fillRect(0, 0, W, H);
    stars.forEach(function (s) { ctx.globalAlpha = s.a; ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y, s.s, s.s); });
    ctx.globalAlpha = 1;

    ctx.fillStyle = th.primary; ctx.font = '900 17px "Segoe UI", sans-serif';
    ctx.fillText('ASTEROIDS NEON', 14, 26);
    ctx.fillStyle = '#fff'; ctx.font = '900 20px "Segoe UI", sans-serif';
    ctx.fillText(A.pad4(score), W - 84, 27);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Nyawa: ' + lives + '   Level: ' + level + '   Batu: ' + rocks.length, 14, 45);

    rocks.forEach(function (b) {
      var r = radiusBatu(b);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang);
      ctx.beginPath();
      for (var i = 0; i < b.sisi.length; i++) {
        var a = i / b.sisi.length * Math.PI * 2, rr = r * b.sisi[i];
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.strokeStyle = b.r === 3 ? '#ff007f' : b.r === 2 ? '#ffb703' : '#00ff87';
      ctx.lineWidth = 2; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
      ctx.restore();
    });

    bullets.forEach(function (b) {
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = th.primary; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (!gameOver && (inv <= 0 || Math.floor(runT / 4) % 2 === 0)) {
      ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.ang);
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(-10, 8); ctx.lineTo(-6, 0); ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.shadowColor = th.primary; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,243,255,0.18)'; ctx.fill();
      if (keys.ArrowUp || keys.KeyW) {
        ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-15 - Math.random() * 6, 0); ctx.lineTo(-7, -4);
        ctx.strokeStyle = '#ffb703'; ctx.stroke();
      }
      ctx.restore();
    }

    parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.warna; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('\\u25C0\\u25B6 putar  \\u00B7  \\u25B2 dorong  \\u00B7  \\u25BC rem  \\u00B7  \\u25CF tembak  \\u00B7  tahan \\u25BC = lompat ruang', 14, H - 12);

    if (gameOver) {
      ctx.fillStyle = 'rgba(4,6,14,0.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 18; ctx.fillStyle = '#ff0055';
      ctx.font = '900 34px "Segoe UI", sans-serif'; ctx.fillText('GAME OVER', W / 2, H / 2 - 22);
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillText('SCORE: ' + Math.floor(score) + '  \\u00B7  level ' + level + '  \\u00B7  ' + hits + ' batu hancur', W / 2, H / 2 + 6);
      ctx.fillStyle = th.primary; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText('TEKAN \\u25CF UNTUK MAIN LAGI', W / 2, H / 2 + 34);
      ctx.textAlign = 'left';
    }
  }

  var last = 0;
  function loop (t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 16.67, 2); last = t;
    update(dt); draw();
    A.state = {
      ship: { x: ship.x, y: ship.y, ang: ship.ang, vx: ship.vx, vy: ship.vy },
      rocks: rocks.slice(), bullets: bullets.length, score: score, lives: lives, level: level,
      over: gameOver, shots: shots, hits: hits, inv: inv, keys: keys, runT: runT, w: W, h: H
    };
    requestAnimationFrame(loop);
  }

  c.addEventListener('touchstart', function (e) {
    A.initAudio();
    if (gameOver) { reset(); e.preventDefault(); return; }
    var r = c.getBoundingClientRect ? c.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
    var tx = (e.touches[0].clientX - (r.left || 0)) * (r.width ? W / r.width : 1);
    var ty = (e.touches[0].clientY - (r.top || 0)) * (r.height ? H / r.height : 1);
    var a = Math.atan2(ty - ship.y, tx - ship.x);
    ship.ang = a;
    if (Math.hypot(tx - ship.x, ty - ship.y) > 60) tembak();
    e.preventDefault();
  }, { passive: false });
  c.addEventListener('mousedown', function () { A.initAudio(); if (gameOver) reset(); });
  function setKey (k, v) {
    keys[k] = v;
    if (k === 'ArrowUp' || k === 'KeyW') keys.up = v;
    else if (k === 'ArrowDown' || k === 'KeyS') keys.down = v;
    else if (k === 'ArrowLeft' || k === 'KeyA') keys.left = v;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = v;
    else if (k === 'Space' || k === 'Enter') keys.act = v;
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    setKey(k, true);
    if (gameOver && (k === 'Space' || k === 'Enter')) { reset(); e.preventDefault(); return; }
    if (!gameOver && (k === 'ArrowDown' || k === 'KeyS')) lompat();
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { setKey(e.code, false); });

  reset();
  requestAnimationFrame(loop);
`

/* ---------------- ekspor shell ---------------- */

export function blockblastHtml (brand = 'THERYHANN!') {
  /* v7.7.3: ditulis ulang total — rupa Block Blast ASLI (tap tray → tap papan),
     kanvas jumbo 640×760, tray 3 blok, panel gelap, KOMBO berseri */
  return shell('Block Blast Neon', brand, BLOCKBLAST_JS, {
    w: 640, h: 760, maxw: 560, sub: 'ARCADE',
    hint: 'ketuk blok di tray bawah, lalu ketuk papan untuk meletakkannya · bersihkan baris/kolom penuh!'
  })
}
export function caturHtml (brand = 'THERYHANN!') {
  /* v7.7.1: CATUR DIBUAT ULANG — tap-to-move (tanpa D-pad memakan tempat),
     32 bidak sungguhan dengan outline kontas, aturan lengkap
     (legal move, rokade, en passant, promosi otomotis, skak/mat/seri) */
  return shell('Catur Neon', brand, CATUR_JS, {
    w: 640, h: 840, maxw: 620, sub: 'ARCADE',
    hint: 'papan PENUH untuk fokus main · ketuk bidak → ketuk tujuan · ▲▼◀▶ ● di kunci layarmu juga melayani'
  })
}
export function minesweeperHtml (brand = 'THERYHANN!') {
  return shell('Minesweeper Neon', brand, MINESWEEPER_JS, {
    w: 560, h: 620, maxw: 540,
    hint: '\u25B2 \u25BC \u25C0 \u25B6 geser kursor  \u00B7  \u25CF gali  \u00B7  tahan \u25CF = pasang bendera'
  })
}
export function asteroidsHtml (brand = 'THERYHANN!') {
  return shell('Asteroids Neon', brand, ASTEROIDS_JS, {
    w: 700, h: 520, maxw: 600,
    hint: '\u25C0 \u25B6 putar  \u00B7  \u25B2 dorong  \u00B7  \u25BC rem + lompat ruang  \u00B7  \u25CF tembak'
  })
}

/** daftar game batch v7.3 (dipakai menu + test) */
export const ARCADE_GAMES5 = [
  { id: 'blockblast', title: 'Block Blast Neon', html: blockblastHtml, ratio: '560\u00D7700 (portrait)' },
  { id: 'catur', title: 'Catur Neon', html: caturHtml, ratio: '600\u00D7700 (portrait)' },
  { id: 'minesweeper', title: 'Minesweeper Neon', html: minesweeperHtml, ratio: '560\u00D7620 (portrait)' },
  { id: 'asteroids', title: 'Asteroids Neon', html: asteroidsHtml, ratio: '700\u00D7520 (landscape)' }
]

export default { blockblastHtml, caturHtml, minesweeperHtml, asteroidsHtml, ARCADE_GAMES5 }
