/**
 * 🎵 IRAMA PASTEL — rhythm game 4 lajur (HTML app, skin pastel v7.6)
 * --------------------------------------------------------------------
 *  Not balok pastel jatuh di 4 lajur. Tekan tombol lajur saat not tepat
 *  di garis pukul: PERFECT / GOOD / OK / MISS.
 *  ◀ = lajur 1 · ▼ = lajur 2 · ▲ = lajur 3 · ▶ = lajur 4 · ● = mulai/ulang
 *  Pola not dibuat deterministik (seed per level) supaya adil & bisa diuji.
 *  5 nyawa (miss), lagu habis = nilai S/A/B/C.
 */
import { shell } from './htmlgames.js'

const RHYTHM_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var LANE = 4, LW = 96, OX = (W - LW * LANE) / 2, HY = H - 130, NYAWA = 5;

  var not, pola, idxPola, skor, kombo, komboTerbaik, nyawa, hitung, kena, meleset,
      level, kecepatan, t, mulai, selesai, over, sebab, nilai, kilat, lajurKilat;

  /* ---------- fungsi murni (A.debug) ---------- */
  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  /** pola not: array { t: frame kemunculan, lane: 0..3 } — deterministik per seed */
  function buatPola (seed, jumlah) {
    var rng = seedRng(seed), out = [], last = 0, i, jeda;
    for (i = 0; i < jumlah; i++) {
      jeda = 26 + Math.floor(rng() * 22);
      last += jeda;
      out.push({ t: last, lane: Math.floor(rng() * LANE) });
    }
    return out;
  }
  /** nilai pukulan berdasarkan jarak not ke garis pukul (piksel) */
  function nilaiJarak (d) {
    var a = Math.abs(d);
    if (a <= 16) return { nama: 'PERFECT', poin: 100, ok: true };
    if (a <= 34) return { nama: 'GOOD', poin: 60, ok: true };
    if (a <= 62) return { nama: 'OK', poin: 25, ok: true };
    return { nama: 'MISS', poin: 0, ok: false };
  }
  function kaliKombo (n) { return 1 + Math.min(1.5, Math.floor(n / 5) * 0.25); }
  function akurasi () { return hitung ? Math.round((kena / hitung) * 100) : 0; }
  function rankUntuk (persen) {
    if (persen >= 95) return 'S';
    if (persen >= 85) return 'A';
    if (persen >= 70) return 'B';
    if (persen >= 50) return 'C';
    return 'D';
  }
  function xLajur (l) { return OX + l * LW + LW / 2; }

  /* ---------- siklus ---------- */
  function reset () {
    level = 1; kecepatan = 3.2; t = 0;
    pola = buatPola(level * 977 + 13, 34 + level * 6);
    idxPola = 0; not = [];
    skor = 0; kombo = 0; komboTerbaik = 0; nyawa = NYAWA;
    hitung = 0; kena = 0; meleset = 0;
    mulai = false; selesai = false; over = false; sebab = ''; nilai = '';
    kilat = 0; lajurKilat = -1;
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Nyawa 5'); A.setProgress(0);
  }
  function laguBerikut () {
    level++;
    kecepatan = 3.2 + level * 0.55;
    pola = buatPola(level * 977 + 13, 34 + level * 6);
    idxPola = 0; not = [];
    A.SFX.level();
  }
  function tamat (s) {
    over = true; sebab = s; nilai = rankUntuk(akurasi()); A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }

  function langkah () {
    if (!mulai) return;
    t++;
    if (kilat > 0) kilat--;
    /* munculkan not sesuai pola */
    while (idxPola < pola.length && pola[idxPola].t <= t) {
      var p = pola[idxPola++];
      not.push({ lane: p.lane, y: -20 - (HY + 20) + 0, hidup: true, lahir: t });
    }
    /* not berjalan; posisikan relatif waktu lahir supaya kecepatan konsisten */
    for (var i = 0; i < not.length; i++) {
      var o = not[i];
      if (!o.hidup) continue;
      o.y = -20 + (t - o.lahir) * kecepatan;
      if (o.y > HY + 66) { o.hidup = false; gagal(); }
    }
    not = not.filter(function (o) { return o.hidup; });
    /* lagu habis? */
    if (idxPola >= pola.length && !not.length && !selesai) {
      selesai = true;
      if (level >= 6) return tamat('LAGU SELESAI');
      skor += 250 * level;
      A.setScore(skor);
      laguBerikut();
      selesai = false;
    }
  }

  function gagal () {
    hitung++; meleset++; kombo = 0; nyawa--; kilat = 12; A.SFX.crash();
    if (nyawa <= 0) tamat('NYAWA HABIS');
  }

  function pukul (l) {
    if (!mulai) { mulai = true; A.SFX.jump(); return; }
    if (over) { reset(); return; }
    lajurKilat = l; kilat = 8;
    /* cari not terdekat di lajur itu */
    var terbaik = null, jarak = 1e9;
    for (var i = 0; i < not.length; i++) {
      var o = not[i];
      if (!o.hidup || o.lane !== l) continue;
      var d = o.y - HY;
      if (Math.abs(d) < Math.abs(jarak)) { jarak = d; terbaik = o; }
    }
    var v = nilaiJarak(jarak === 1e9 ? 999 : jarak);
    if (!terbaik || !v.ok) { kombo = 0; kilat = 8; A.SFX.crash(); return; }
    terbaik.hidup = false;
    hitung++; kena++; kombo++;
    if (kombo > komboTerbaik) komboTerbaik = kombo;
    skor += Math.round(v.poin * kaliKombo(kombo));
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    if (v.nama === 'PERFECT') A.SFX.point(); else A.SFX.jump();
    if (kombo > 0 && kombo % 10 === 0) A.SFX.level();
  }

  /* ---------- gambar ---------- */
  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff0f6'); g.addColorStop(0.5, '#ffe9f2'); g.addColorStop(1, '#e6f7ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* lajur */
    for (var l = 0; l < LANE; l++) {
      ctx.fillStyle = l % 2 ? 'rgba(255,255,255,0.6)' : 'rgba(255,232,242,0.7)';
      ctx.fillRect(OX + l * LW, 0, LW, H);
      if (lajurKilat === l && kilat > 0) {
        ctx.fillStyle = 'rgba(255,209,102,0.35)'; ctx.fillRect(OX + l * LW, 0, LW, H);
      }
    }
    ctx.strokeStyle = '#ffc2d4';
    for (var s = 0; s <= LANE; s++) {
      ctx.beginPath(); ctx.moveTo(OX + s * LW, 0); ctx.lineTo(OX + s * LW, H); ctx.stroke();
    }

    /* garis pukul */
    ctx.fillStyle = '#ff8fb3'; ctx.fillRect(OX, HY - 4, LW * LANE, 8);
    ctx.fillStyle = 'rgba(255,143,179,0.2)'; ctx.fillRect(OX, HY - 62, LW * LANE, 124);
    for (var k = 0; k < LANE; k++) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(xLajur(k), HY, 26, 0, 6.29); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = '#b0708a'; ctx.font = '800 12px "Comic Sans MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(['◀', '▼', '▲', '▶'][k], xLajur(k), HY + 5);
    }
    ctx.textAlign = 'left';

    /* not */
    for (var i = 0; i < not.length; i++) {
      var o = not[i], x = xLajur(o.lane);
      ctx.fillStyle = ['#ff9fb2', '#ffd166', '#9be3a8', '#a8d8ff'][o.lane];
      ctx.beginPath();
      if (o.lane % 2 === 0) { ctx.arc(x, o.y, 22, 0, 6.29); }
      else {
        ctx.moveTo(x, o.y - 24); ctx.lineTo(x + 22, o.y); ctx.lineTo(x, o.y + 24); ctx.lineTo(x - 22, o.y);
        ctx.closePath();
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
      ctx.fillStyle = '#7a5c6b'; ctx.font = '900 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('♪', x, o.y + 5); ctx.textAlign = 'left';
    }

    /* HUD */
    ctx.fillStyle = '#7a5c6b'; ctx.font = '900 15px "Comic Sans MS", sans-serif';
    ctx.fillText('❤ ' + nyawa, 12, 26);
    ctx.fillText('KOMBO ' + kombo, 12, 48);
    ctx.fillText('AKURASI ' + akurasi() + '%', 12, 70);
    ctx.textAlign = 'right';
    ctx.fillText('LEVEL ' + level, W - 12, 26);
    ctx.fillText('MAX ' + komboTerbaik, W - 12, 48);
    ctx.textAlign = 'left';

    if (kilat > 0 && kombo === 0) {
      ctx.fillStyle = 'rgba(255,90,120,0.12)'; ctx.fillRect(0, 0, W, H);
    }
    if (!mulai && !over) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, H / 2 - 66, W, 132);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a';
      ctx.font = '900 26px "Comic Sans MS", sans-serif';
      ctx.fillText('IRAMA PASTEL', W / 2, H / 2 - 22);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText('Tekan ◀ ▼ ▲ ▶ sesuai lajur saat not di garis', W / 2, H / 2 + 8);
      ctx.fillText('● / TAP untuk mulai', W / 2, H / 2 + 36);
      ctx.textAlign = 'left';
    }
    if (over) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(0, H / 2 - 84, W, 168);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a';
      ctx.font = '900 30px "Comic Sans MS", sans-serif';
      ctx.fillText('NILAI ' + nilai, W / 2, H / 2 - 34);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText(sebab + ' · skor ' + skor, W / 2, H / 2 - 2);
      ctx.fillText('akurasi ' + akurasi() + '% (' + kena + '/' + hitung + ') · miss ' + meleset, W / 2, H / 2 + 24);
      ctx.fillText('kombo terbaik ' + komboTerbaik, W / 2, H / 2 + 48);
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 74);
      ctx.textAlign = 'left';
    }
  }

  /* ---------- loop ---------- */
  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2); last = tm;
    if (!over) { for (var i = 0; i < dt && !over; i++) langkah(); }
    gambar();
    A.setScore(skor);
    A.setStatus('Level ' + level + ' · ' + nilaiJarak(0).nama, 'Nyawa ' + nyawa);
    A.setProgress(hitung / Math.max(1, pola.length + hitung));
    A.state = {
      skor: skor, kombo: kombo, komboTerbaik: komboTerbaik, nyawa: nyawa, level: level,
      kecepatan: Number(kecepatan.toFixed(2)), akurasi: akurasi(), kena: kena, hitung: hitung,
      meleset: meleset, sisaNot: not.length, sisaPola: pola.length - idxPola,
      mulai: mulai, selesai: selesai, over: over, sebab: sebab, nilai: nilai, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { buatPola: buatPola, seedRng: seedRng, nilaiJarak: nilaiJarak, kaliKombo: kaliKombo, rankUntuk: rankUntuk, xLajur: xLajur, akurasi: akurasi, pukul: pukul, HY: HY, LW: LW, OX: OX, LANE: LANE };

  /* ---------- input ---------- */
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') pukul(0);
    else if (k === 'ArrowDown' || k === 'KeyS') pukul(1);
    else if (k === 'ArrowUp' || k === 'KeyW') pukul(2);
    else if (k === 'ArrowRight' || k === 'KeyD') pukul(3);
    else if (k === 'Space' || k === 'Enter') { if (!mulai) { mulai = true; A.SFX.jump(); } else if (over) reset(); }
  });

  function sentuh (e) {
    A.initAudio();
    if (over) { reset(); return; }
    var px = null, py = null;
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { left: 0, top: 0, width: W, height: H };
      px = (tt.clientX - r.left) * (W / Math.max(1, r.width));
      py = (tt.clientY - r.top) * (H / Math.max(1, r.height));
    } catch (err) { px = null; }
    if (px === null) { if (!mulai) mulai = true; else pukul(1); return; }
    var l = Math.max(0, Math.min(LANE - 1, Math.floor((px - OX) / LW)));
    pukul(l);
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function rhythmHtml (brand = 'THERYHANN!') {
  return shell('Irama Pastel', brand, RHYTHM_JS, {
    w: 480, h: 640, maxw: 460, skin: 'pastel', sub: 'PASTEL',
    hint: '◀ lajur 1 · ▼ lajur 2 · ▲ lajur 3 · ▶ lajur 4  —  pukul not tepat di garis  ·  ● mulai / ulang'
  })
}

export const PASTEL7 = [
  { id: 'ritme', cmd: 'ritme', icon: '🎵', title: 'Irama Pastel', nama: 'Irama Pastel', html: rhythmHtml, ratio: '480×640', w: 480, h: 640 }
]
