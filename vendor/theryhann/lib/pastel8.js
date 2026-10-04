/**
 * 🧠 KARTU MEMORI — concentration pairs (HTML app, skin pastel v7.6)
 * -------------------------------------------------------------------
 *  Grid kartu pastel tertutup. Buka dua kartu: kalau gambarnya sama,
 *  kartu tetap terbuka & dapat poin (bonus makin cepat). Kalau beda,
 *  tertutup lagi setelah beberapa detik.
 *  ▲▼◀▶ pindah kursor · ● buka kartu · level naik = grid makin besar.
 *  Waktu habis = GAME OVER. Kocokan pakai seed supaya bisa diuji ulang.
 */
import { shell } from './htmlgames.js'

const MEMO_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var GAMBAR = ['🍓', '🍩', '🌷', '🐰', '⭐', '🍋', '🌈', '🐣', '🍉', '🦋', '🎀', '🍪'];
  var OX = 40, OY = 92, GAP = 12, TS = 92;

  var kartu, kx, ky, buka, pasangan, langkah, salah, skor, waktu, level,
      pilih, tungguT, combo, comboTerbaik, over, menang, sebab, runT, ledak;

  /* ---------- fungsi murni (A.debug) ---------- */
  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function kocok (arr, seed) {
    var a = arr.slice(), rng = seedRng(seed), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(rng() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function ukuranLevel (lvl) {
    if (lvl <= 1) return { baris: 4, kolom: 4 };
    if (lvl === 2) return { baris: 4, kolom: 5 };
    if (lvl === 3) return { baris: 5, kolom: 4 };
    if (lvl === 4) return { baris: 5, kolom: 5 };
    return { baris: 4, kolom: 6 };
  }
  function waktuLevel (lvl) { return 55 + lvl * 12; }
  function bonusCepat (sisa, total) { return Math.round(60 * Math.max(0, sisa / total)); }
  function poinPasang (lvl, combo, sisa, total) {
    return Math.round((100 + lvl * 20) * (1 + Math.min(1, combo * 0.2)) + bonusCepat(sisa, total));
  }

  /* ---------- siklus ---------- */
  function reset (lvl) {
    level = lvl || 1;
    var u = ukuranLevel(level), n = u.baris * u.kolom;
    var isi = [];
    for (var i = 0; i < n / 2; i++) { isi.push(GAMBAR[i % GAMBAR.length]); isi.push(GAMBAR[i % GAMBAR.length]); }
    kartu = kocok(isi, level * 7919 + 11).map(function (g) { return { g: g, buka: false, cocok: false, anim: 0 }; });
    TS = Math.min(92, Math.floor((W - OX * 2 - GAP * (u.kolom - 1)) / u.kolom));
    kx = 0; ky = 0; buka = []; pasangan = 0; langkah = 0; salah = 0;
    if (lvl === undefined || lvl === 1) { skor = 0; combo = 0; comboTerbaik = 0; }
    waktu = waktuLevel(level) * 60; pilih = null; tungguT = 0;
    over = false; menang = false; sebab = ''; runT = 0; ledak = [];
    A.setScore(skor); A.setBest();
    A.setStatus('Level ' + level + ' · ' + u.kolom + '×' + u.baris, 'Waktu ' + Math.ceil(waktu / 60));
    A.setProgress(1);
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function idx (x, y) { var u = ukuranLevel(level); return y * u.kolom + x; }

  function ambil () {
    if (over || menang || tungguT > 0) return;
    var u = ukuranLevel(level), i = idx(kx, ky), k = kartu[i];
    if (k.buka || k.cocok) return;
    k.buka = true; k.anim = 8; buka.push(i); A.SFX.jump();
    if (buka.length < 2) return;
    langkah++;
    var a = kartu[buka[0]], b = kartu[buka[1]];
    if (a.g === b.g) {
      a.cocok = b.cocok = true; pasangan++; combo++;
      if (combo > comboTerbaik) comboTerbaik = combo;
      var total = waktuLevel(level) * 60;
      skor += poinPasang(level, combo, waktu, total);
      A.setScore(skor);
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      A.SFX.point(); buka = [];
      ledak.push({ x: OX + kx * (TS + GAP) + TS / 2, y: OY + ky * (TS + GAP) + TS / 2, t: 20 });
      if (pasangan === kartu.length / 2) menangRonde();
    } else {
      combo = 0; salah++; tungguT = 46; A.SFX.crash();
    }
  }
  function menangRonde () {
    menang = true; waktu += 300;
    A.SFX.level();
    if (level >= 6) { tamat('SEMUA LEVEL SELESAI'); menang = false; }
  }
  function lanjut () { menang = false; reset(level + 1); }

  function langkahFrame () {
    runT++;
    if (!over) waktu--;
    if (waktu <= 0) { waktu = 0; return tamat('WAKTU HABIS'); }
    if (tungguT > 0) {
      tungguT--;
      if (tungguT === 0 && buka.length === 2) {
        kartu[buka[0]].buka = false; kartu[buka[1]].buka = false; buka = [];
      }
    }
    for (var i = 0; i < kartu.length; i++) if (kartu[i].anim > 0) kartu[i].anim--;
    for (var e = 0; e < ledak.length; e++) ledak[e].t--;
    ledak = ledak.filter(function (x) { return x.t > 0; });
  }

  /* ---------- gambar ---------- */
  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff8e7'); g.addColorStop(1, '#ffeaf3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    var u = ukuranLevel(level);
    for (var y = 0; y < u.baris; y++) {
      for (var x = 0; x < u.kolom; x++) {
        var i = idx(x, y), k = kartu[i];
        var px = OX + x * (TS + GAP), py = OY + y * (TS + GAP);
        var naik = k.anim > 0 ? (k.anim - 4) * 0.8 : 0;
        ctx.save(); ctx.translate(0, naik);
        if (k.cocok) {
          ctx.fillStyle = 'rgba(155,227,168,0.55)'; bulat(px, py, TS, TS, 16); ctx.fill();
          ctx.fillStyle = '#3f6b4a'; ctx.font = Math.round(TS * 0.5) + 'px "Segoe UI Emoji", sans-serif';
          ctx.textAlign = 'center'; ctx.fillText(k.g, px + TS / 2, py + TS * 0.68); ctx.textAlign = 'left';
        } else if (k.buka) {
          ctx.fillStyle = '#fff'; bulat(px, py, TS, TS, 16); ctx.fill();
          ctx.strokeStyle = '#ffc2d4'; ctx.lineWidth = 3; bulat(px, py, TS, TS, 16); ctx.stroke(); ctx.lineWidth = 1;
          ctx.fillStyle = '#333'; ctx.font = Math.round(TS * 0.5) + 'px "Segoe UI Emoji", sans-serif';
          ctx.textAlign = 'center'; ctx.fillText(k.g, px + TS / 2, py + TS * 0.68); ctx.textAlign = 'left';
        } else {
          var gr = ctx.createLinearGradient(px, py, px + TS, py + TS);
          gr.addColorStop(0, '#ffb7c5'); gr.addColorStop(1, '#b5e3ff');
          ctx.fillStyle = gr; bulat(px, py, TS, TS, 16); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.font = '900 ' + Math.round(TS * 0.34) + 'px "Comic Sans MS", sans-serif';
          ctx.textAlign = 'center'; ctx.fillText('?', px + TS / 2, py + TS * 0.63); ctx.textAlign = 'left';
        }
        if (x === kx && y === ky && !over) {
          ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 4;
          bulat(px - 3, py - 3, TS + 6, TS + 6, 18); ctx.stroke(); ctx.lineWidth = 1;
        }
        ctx.restore();
      }
    }
    /* ledakan bintang */
    for (var e = 0; e < ledak.length; e++) {
      var z = ledak[e];
      ctx.globalAlpha = z.t / 20; ctx.fillStyle = '#ffd166';
      ctx.font = '900 22px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('✨', z.x, z.y - (20 - z.t) * 2); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#7a5c6b'; ctx.font = '900 15px "Comic Sans MS", sans-serif';
    ctx.fillText('⏱ ' + Math.ceil(waktu / 60) + 's', 14, 30);
    ctx.fillText('🂠 ' + langkah + ' langkah', 14, 54);
    ctx.fillText('💞 ' + pasangan + '/' + (kartu.length / 2), 150, 30);
    ctx.fillText('❌ ' + salah, 150, 54);
    if (combo > 1) { ctx.fillStyle = '#ff7aa2'; ctx.fillText('KOMBO ×' + (1 + Math.min(1, combo * 0.2)).toFixed(1), 268, 30); }

    if (menang && !over) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, H / 2 - 52, W, 104);
      ctx.textAlign = 'center'; ctx.fillStyle = '#4caf7d';
      ctx.font = '900 26px "Comic Sans MS", sans-serif';
      ctx.fillText('LEVEL ' + level + ' SELESAI!', W / 2, H / 2 - 10);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText('+5 detik · TAP / ● untuk level berikutnya', W / 2, H / 2 + 22);
      ctx.textAlign = 'left';
    }
    if (over) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(0, H / 2 - 74, W, 148);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a';
      ctx.font = '900 28px "Comic Sans MS", sans-serif';
      ctx.fillText('SELESAI', W / 2, H / 2 - 28);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText(sebab + ' · skor ' + skor + ' · level ' + level, W / 2, H / 2 + 2);
      ctx.fillText(langkah + ' langkah · ' + salah + ' salah · kombo terbaik ' + comboTerbaik, W / 2, H / 2 + 28);
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 58);
      ctx.textAlign = 'left';
    }
  }
  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- loop ---------- */
  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2); last = tm;
    if (!over) { for (var i = 0; i < dt; i++) langkahFrame(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Level ' + level + (menang ? ' · SELESAI' : ''), 'Waktu ' + Math.ceil(waktu / 60));
    A.setProgress(waktu / (waktuLevel(level) * 60));
    A.state = {
      skor: skor, level: level, pasangan: pasangan, totalPasang: kartu.length / 2, langkah: langkah,
      salah: salah, combo: combo, comboTerbaik: comboTerbaik, waktu: Math.ceil(waktu / 60),
      kx: kx, ky: ky, terbuka: buka.slice(), tunggu: tungguT, menang: menang, over: over,
      sebab: sebab, best: A.best,
      papan: kartu.map(function (k) { return k.cocok ? 2 : k.buka ? 1 : 0; })
    };
    requestAnimationFrame(loop);
  }

  A.debug = { kocok: kocok, seedRng: seedRng, ukuranLevel: ukuranLevel, waktuLevel: waktuLevel, bonusCepat: bonusCepat, poinPasang: poinPasang, idx: idx, ambil: ambil, GAMBAR: GAMBAR };

  /* ---------- input ---------- */
  function gerak (dx, dy) {
    if (over) { reset(1); return; }
    if (menang) { lanjut(); return; }
    var u = ukuranLevel(level);
    kx = (kx + dx + u.kolom) % u.kolom;
    ky = (ky + dy + u.baris) % u.baris;
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(1); return; }
    if (menang && (k === 'Space' || k === 'Enter')) { lanjut(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') gerak(-1, 0);
    else if (k === 'ArrowRight' || k === 'KeyD') gerak(1, 0);
    else if (k === 'ArrowUp' || k === 'KeyW') gerak(0, -1);
    else if (k === 'ArrowDown' || k === 'KeyS') gerak(0, 1);
    else if (k === 'Space' || k === 'Enter') ambil();
  });

  function sentuh (e) {
    A.initAudio();
    if (over) { reset(1); return; }
    if (menang) { lanjut(); return; }
    var px = null, py = null;
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      px = (tt.clientX - r.left) * (W / Math.max(1, r.width));
      py = (tt.clientY - r.top) * (H / Math.max(1, r.height));
    } catch (err) { px = null; }
    if (px === null) { ambil(); return; }
    var u = ukuranLevel(level);
    var xx = Math.floor((px - OX) / (TS + GAP)), yy = Math.floor((py - OY) / (TS + GAP));
    if (xx < 0 || yy < 0 || xx >= u.kolom || yy >= u.baris) { ambil(); return; }
    kx = xx; ky = yy; ambil();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function memoryHtml (brand = 'THERYHANN!') {
  return shell('Kartu Memori', brand, MEMO_JS, {
    w: 560, h: 640, maxw: 520, skin: 'pastel', sub: 'PASTEL',
    hint: '▲▼◀▶ pindah kursor  ·  ● buka kartu  ·  cari 8 pasang gambar sebelum waktu habis  ·  makin cepat = bonus poin'
  })
}

export const PASTEL8 = [
  { id: 'kartumemori', cmd: 'kartumemori', icon: '🧠', title: 'Kartu Memori', nama: 'Kartu Memori', html: memoryHtml, ratio: '560×640', w: 560, h: 640 }
]
