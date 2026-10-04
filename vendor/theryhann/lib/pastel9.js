/**
 * 🍩 DONAT SUSUN — stack tower (HTML app, skin pastel v7.6)
 * -----------------------------------------------------------
 *  Donat bergeser kiri-kanan di atas tumpukan. ● menjatuhkannya.
 *  Bagian yang tidak tumpang tindih dengan donat di bawahnya terpotong
 *  dan jatuh; tumpukan makin sempit. Seimbang sempurna (±6px) = kombo
 *  & donat melebar lagi sedikit. Lebar habis = GAME OVER.
 *  ▲▼ mempercepat/memperlambat ayunan (mengatur ritme).
 */
import { shell } from './htmlgames.js'

const STACK_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var BH = 34, DASAR = H - 64, LEBAR0 = 200;

  var tumpuk, cur, arah, kecepatan, skor, kombo, komboTerbaik, sempurna,
      jatuh, camY, over, sebab, runT, pesan, pesanT;

  /* ---------- fungsi murni (A.debug) ---------- */
  function potong (atas, bawah) {
    var kiri = Math.max(atas.x, bawah.x);
    var kanan = Math.min(atas.x + atas.w, bawah.x + bawah.w);
    var lebar = kanan - kiri;
    if (lebar <= 0) return { ok: false, x: 0, w: 0, sisa: null, geser: 0 };
    var tengahAtas = atas.x + atas.w / 2, tengahBawah = bawah.x + bawah.w / 2;
    var geser = Math.abs(tengahAtas - tengahBawah);
    var sisa = null;
    if (atas.x < bawah.x) sisa = { x: atas.x, w: bawah.x - atas.x };
    else if (atas.x + atas.w > bawah.x + bawah.w) sisa = { x: bawah.x + bawah.w, w: (atas.x + atas.w) - (bawah.x + bawah.w) };
    return { ok: true, x: kiri, w: lebar, sisa: sisa, geser: geser, sempurna: geser <= 6 };
  }
  function poinSusun (tinggi, sempurna, kombo) {
    var dasar = 10 + Math.min(40, tinggi);
    return sempurna ? dasar * 2 + kombo * 5 : dasar;
  }
  function kecepatanUntuk (tinggi) { return Math.min(7.5, 2.2 + tinggi * 0.16); }
  function lebarSetelahSempurna (w) { return Math.min(LEBAR0, w + 8); }
  function warnaDonat (i) {
    var gl = ['#ffb7c5', '#ffd166', '#9be3a8', '#a8d8ff', '#d9b8ff', '#ffc59f'];
    return gl[i % gl.length];
  }

  /* ---------- siklus ---------- */
  function reset () {
    tumpuk = [{ x: (W - LEBAR0) / 2, w: LEBAR0 }];
    cur = null; arah = 1; kecepatan = kecepatanUntuk(0);
    skor = 0; kombo = 0; komboTerbaik = 0; sempurna = 0;
    jatuh = []; camY = 0; over = false; sebab = ''; runT = 0; pesan = ''; pesanT = 0;
    lahir();
    A.setScore(0); A.setBest(); A.setStatus('Tinggi 0', 'Speed ' + kecepatan.toFixed(1)); A.setProgress(0);
  }
  function lahir () {
    var top = tumpuk[tumpuk.length - 1];
    var dariKiri = Math.random() < 0.5;
    /* mulai dari tepi layar supaya ayunan selalu melewati tumpukan */
    cur = { x: dariKiri ? 26 : W - 26 - top.w, w: top.w, y: yUntuk(tumpuk.length) };
    arah = dariKiri ? 1 : -1;
    kecepatan = kecepatanUntuk(tumpuk.length);
  }
  function yUntuk (i) { return DASAR - i * BH; }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }

  function jatuhkan () {
    if (over) { reset(); return; }
    if (!cur) return;
    var top = tumpuk[tumpuk.length - 1];
    var h = potong(cur, top);
    if (!h.ok) {
      jatuh.push({ x: cur.x, w: cur.w, y: cur.y, vy: 0, vx: arah * 1.4, rot: 0, vr: 0.1 });
      return tamat('DONAT JATUH — TIDAK TUMPANG TINDIH');
    }
    if (h.sisa) {
      jatuh.push({ x: h.sisa.x, w: h.sisa.w, y: cur.y, vy: 0, vx: arah * 1.6, rot: 0, vr: 0.08 });
    }
    var baru = { x: h.x, w: h.w };
    if (h.sempurna) {
      kombo++; sempurna++;
      baru.w = lebarSetelahSempurna(h.w);
      baru.x = h.x - (baru.w - h.w) / 2;
      pesan = kombo > 1 ? 'SEMPURNA ×' + kombo : 'SEMPURNA!';
      A.SFX.level();
    } else {
      kombo = 0; pesan = h.geser < 20 ? 'HAMPIR!' : 'TERPOTONG';
      A.SFX.point();
    }
    if (kombo > komboTerbaik) komboTerbaik = kombo;
    pesanT = 40;
    tumpuk.push(baru);
    skor += poinSusun(tumpuk.length, h.sempurna, kombo);
    A.setScore(skor);
    if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
    cur = null;
    lahir();
    if (baru.w < 12) tamat('TUMPUKAN TERLALU SEMPIT');
  }

  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    if (!over && cur) {
      var top = tumpuk[tumpuk.length - 1];
      cur.x += arah * kecepatan;
      var batas = 26;
      if (cur.x + cur.w > W - batas) { cur.x = W - batas - cur.w; arah = -1; }
      if (cur.x < batas) { cur.x = batas; arah = 1; }
      cur.y = yUntuk(tumpuk.length);
    }
    for (var i = 0; i < jatuh.length; i++) {
      var j = jatuh[i]; j.vy += 0.42; j.y += j.vy; j.x += j.vx; j.rot += j.vr;
    }
    jatuh = jatuh.filter(function (j) { return j.y < H + 120; });
    /* kamera mengikuti tumpukan */
    var targetCam = Math.max(0, tumpuk.length * BH - (H - 260));
    camY += (targetCam - camY) * 0.12;
  }

  /* ---------- gambar ---------- */
  function donat (x, y, w, warna, rot) {
    ctx.save();
    if (rot) { ctx.translate(x + w / 2, y + BH / 2); ctx.rotate(rot); ctx.translate(-(x + w / 2), -(y + BH / 2)); }
    ctx.fillStyle = '#e8b98a'; bulat(x, y + 8, w, BH - 8, 12); ctx.fill();
    ctx.fillStyle = warna; bulat(x, y + 2, w, BH - 14, 12); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (var s = 0; s < Math.max(2, Math.floor(w / 26)); s++) {
      ctx.beginPath();
      ctx.arc(x + 12 + s * 26 + (s % 2) * 6, y + 12 + (s % 3) * 3, 3, 0, 6.29);
      ctx.fill();
    }
    ctx.restore();
  }
  function bulat (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function gambar () {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#e8f6ff'); g.addColorStop(0.55, '#fff2f7'); g.addColorStop(1, '#ffe9d6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* awan latar */
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (var a = 0; a < 4; a++) {
      var cx = (a * 150 + runT * 0.25) % (W + 120) - 60, cy = 70 + a * 90 + camY * 0.2;
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 6.29); ctx.arc(cx + 26, cy + 6, 20, 0, 6.29); ctx.arc(cx - 24, cy + 8, 18, 0, 6.29); ctx.fill();
    }
    ctx.save(); ctx.translate(0, camY);
    /* piring dasar */
    ctx.fillStyle = '#ffd7e4'; bulat(W / 2 - 140, DASAR + BH + 6, 280, 18, 9); ctx.fill();
    for (var i = 0; i < tumpuk.length; i++) {
      donat(tumpuk[i].x, yUntuk(i), tumpuk[i].w, warnaDonat(i));
    }
    for (var j = 0; j < jatuh.length; j++) {
      var f = jatuh[j];
      donat(f.x, f.y, f.w, '#d9b8a8', f.rot);
    }
    if (cur && !over) {
      /* garis bantu ke tumpukan */
      var top = tumpuk[tumpuk.length - 1];
      ctx.strokeStyle = 'rgba(255,143,179,0.5)'; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(top.x, cur.y + BH); ctx.lineTo(top.x, top.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(top.x + top.w, cur.y + BH); ctx.lineTo(top.x + top.w, top.y); ctx.stroke();
      ctx.setLineDash([]);
      donat(cur.x, cur.y, cur.w, warnaDonat(tumpuk.length));
    }
    ctx.restore();

    ctx.fillStyle = '#7a5c6b'; ctx.font = '900 15px "Comic Sans MS", sans-serif';
    ctx.fillText('🍩 ' + (tumpuk.length - 1) + ' tingkat', 14, 28);
    ctx.fillText('🌟 ' + sempurna + ' sempurna', 14, 52);
    if (kombo > 1) { ctx.fillStyle = '#ff7aa2'; ctx.fillText('KOMBO ×' + kombo, 14, 76); }
    ctx.textAlign = 'right'; ctx.fillStyle = '#7a5c6b';
    ctx.fillText('LEBAR ' + Math.round(tumpuk[tumpuk.length - 1].w), W - 14, 28);
    ctx.fillText('SPEED ' + kecepatan.toFixed(1), W - 14, 52);
    ctx.textAlign = 'left';

    if (pesanT > 0) {
      ctx.globalAlpha = Math.min(1, pesanT / 20);
      ctx.fillStyle = kombo > 1 ? '#ff6b8a' : '#4caf7d';
      ctx.font = '900 26px "Comic Sans MS", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(pesan, W / 2, 130); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
    if (over) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(0, H / 2 - 76, W, 152);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ff6b8a';
      ctx.font = '900 28px "Comic Sans MS", sans-serif';
      ctx.fillText('TUMPUKAN RUNTUH', W / 2, H / 2 - 30);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText(sebab, W / 2, H / 2 - 2);
      ctx.fillText('skor ' + skor + ' · ' + (tumpuk.length - 1) + ' tingkat · ' + sempurna + ' sempurna', W / 2, H / 2 + 24);
      ctx.fillText('kombo terbaik ' + komboTerbaik, W / 2, H / 2 + 48);
      ctx.fillText('TAP / ● UNTUK SUSUN LAGI', W / 2, H / 2 + 74);
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
    A.setStatus('Tinggi ' + (tumpuk.length - 1), 'Speed ' + kecepatan.toFixed(1));
    A.setProgress(Math.min(1, (tumpuk.length - 1) / 30));
    A.state = {
      skor: skor, tinggi: tumpuk.length - 1, kombo: kombo, komboTerbaik: komboTerbaik,
      sempurna: sempurna, kecepatan: Number(kecepatan.toFixed(2)), lebar: Math.round(tumpuk[tumpuk.length - 1].w),
      arah: arah, curX: cur ? Math.round(cur.x) : null,
      topX: Math.round(tumpuk[tumpuk.length - 1].x), camY: Math.round(camY),
      jatuh: jatuh.length, over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { potong: potong, poinSusun: poinSusun, kecepatanUntuk: kecepatanUntuk, lebarSetelahSempurna: lebarSetelahSempurna, warnaDonat: warnaDonat, jatuhkan: jatuhkan, DASAR: DASAR, BH: BH, LEBAR0: LEBAR0 };

  /* ---------- input ---------- */
  function atur (d) {
    if (over) return;
    kecepatan = Math.max(1.2, Math.min(9, kecepatan + d * 0.6));
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'Space' || k === 'Enter') jatuhkan();
    else if (k === 'ArrowUp' || k === 'KeyW') atur(-1);
    else if (k === 'ArrowDown' || k === 'KeyS') atur(1);
    else if (k === 'ArrowLeft' || k === 'KeyA') { if (cur) arah = -1; }
    else if (k === 'ArrowRight' || k === 'KeyD') { if (cur) arah = 1; }
  });

  function sentuh (e) {
    A.initAudio();
    if (over) { reset(); return; }
    var py = null;
    try {
      var tt = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r = (c.getBoundingClientRect ? c.getBoundingClientRect() : null) || { top: 0, height: H };
      py = (tt.clientY - r.top) * (H / Math.max(1, r.height));
    } catch (err) { py = null; }
    if (py === null) { jatuhkan(); return; }
    if (py < 100) atur(-1); else if (py > H - 100) atur(1); else jatuhkan();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function donatHtml (brand = 'THERYHANN!') {
  return shell('Donat Susun', brand, STACK_JS, {
    w: 480, h: 640, maxw: 460, skin: 'pastel', sub: 'PASTEL',
    hint: '● jatuhkan donat tepat di atas tumpukan  ·  ▲▼ atur kecepatan ayunan  ·  ◀▶ balik arah  ·  seimbang ±6px = SEMPURNA'
  })
}

export const PASTEL9 = [
  { id: 'donat', cmd: 'donat', icon: '🍩', title: 'Donat Susun', nama: 'Donat Susun', html: donatHtml, ratio: '480×640', w: 480, h: 640 }
]
