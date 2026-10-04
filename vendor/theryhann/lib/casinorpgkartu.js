/**
 * ============================================================
 *  lib/casinorpgkartu.js — 🎴 KARTU HTML 5 GAME KASINO RPG (v7.6)
 * ------------------------------------------------------------
 *  Semua kartu memakai `shell()` dari lib/htmlgames.js (canvas + D-pad
 *  ▲▼◀▶● + WebAudio + rekor localStorage + bar 🏆 leaderboard), dengan
 *  sub 'CASINO'. Hasilnya sudah ditentukan SERVER (lib/casinorpg.js),
 *  jadi kartu hanya *memutar animasi dan berhenti persis di hasil itu*.
 *
 *  Kontrol di semua kartu: ◀▶ pindah panel · ▲▼ gulir · ● putar ulang animasi.
 *  Panel: 0 = MEJA (animasi) · 1 = RINCIAN + RIWAYAT · 2 = PAYTABLE.
 *
 *  Skor (pembayaran terbesar) tercatat otomatis di server → `.lbgame`.
 * ============================================================
 */
import { shell } from './htmlgames.js'

/* ------------------------------------------------------------------ */
/*  INTI BERSAMA: panel, HUD, format angka, input                      */
/* ------------------------------------------------------------------ */
const KASINO_CORE = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var D = (typeof __D !== 'undefined' && __D) || {};

  function fmt (n) {
    var s = String(Math.round(Number(n) || 0)), out = '', hitung = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s[i] + out; hitung++;
      if (hitung % 3 === 0 && i > 0) out = '.' + out;
    }
    return out;
  }
  function bulatR (x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function bungkus (teks, maksPx) {
    var kata = String(teks || '').split(' '), baris = [], cur = '';
    for (var i = 0; i < kata.length; i++) {
      var coba = cur ? cur + ' ' + kata[i] : kata[i];
      if (ctx.measureText(coba).width > maksPx && cur) { baris.push(cur); cur = kata[i]; }
      else cur = coba;
    }
    if (cur) baris.push(cur);
    return baris;
  }
  var panel = 0, gulir = 0, frame = 0, ulang = 0, JUDUL_PANEL = ['MEJA', 'RINCIAN', 'PAYTABLE'];

  function latar () {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, D.warna0 || '#0d1b12');
    g.addColorStop(1, D.warna1 || '#04140c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function kepalaPanel () {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#ffd166'; ctx.font = '900 13px monospace';
    for (var i = 0; i < JUDUL_PANEL.length; i++) {
      var x = 18 + i * 96;
      if (i === panel) {
        ctx.fillStyle = '#ffd166';
        bulatR(x - 8, 7, ctx.measureText(JUDUL_PANEL[i]).width + 16, 20, 10); ctx.fill();
        ctx.fillStyle = '#1a1206';
      } else ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText(JUDUL_PANEL[i], x, 22);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '700 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('◀▶ panel · ▲▼ gulir · ● ulang', W - 12, 22);
    ctx.textAlign = 'left';
  }
  function kakiHasil () {
    var y = H - 78;
    ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(0, y, W, 78);
    var menang = (D.bayar || 0) > (D.bet || 0);
    var seri = (D.bayar || 0) === (D.bet || 0) && (D.bet || 0) > 0;
    ctx.font = '900 18px monospace';
    ctx.fillStyle = menang ? '#00ff87' : seri ? '#ffd166' : '#ff5e7a';
    ctx.fillText(menang ? '✨ MENANG +' + fmt((D.bayar || 0) - (D.bet || 0)) : seri ? '➖ SERI (kembali)' : '💨 KALAH −' + fmt(D.bet || 0), 14, y + 26);
    ctx.font = '700 13px monospace'; ctx.fillStyle = '#cfe8ff';
    ctx.fillText('Taruhan ' + fmt(D.bet) + ' · Bayar ' + fmt(D.bayar) + (D.kali ? ' (×' + D.kali + ')' : ''), 14, y + 48);
    ctx.fillText('Saldo ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' · +' + fmt(D.exp) + ' EXP', 14, y + 68);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '700 11px monospace';
    ctx.fillText('luck ×' + (D.luck || 1) + (D.bonusKoin > 1 ? ' · bonus koin ×' + D.bonusKoin : ''), W - 14, y + 68);
    ctx.textAlign = 'left';
  }
  function panelRincian (baris) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 34, W, H - 112); ctx.clip();
    ctx.translate(0, 34 - gulir * 18);
    ctx.font = '700 13px monospace';
    var y = 26;
    for (var i = 0; i < baris.length; i++) {
      var b = baris[i];
      if (b.judul) {
        ctx.fillStyle = '#ffd166'; ctx.font = '900 14px monospace';
        ctx.fillText(b.judul, 16, y); y += 22; ctx.font = '700 13px monospace';
        continue;
      }
      ctx.fillStyle = b.warna || '#d8ecff';
      var barisTeks = bungkus(b.teks, W - 40);
      for (var k = 0; k < barisTeks.length; k++) { ctx.fillText(barisTeks[k], 22, y); y += 18; }
    }
    ctx.restore();
    var tinggi = y + gulir * 18;
    A.state.gulirMaks = Math.max(0, Math.ceil((tinggi - (H - 120)) / 18));
  }
  function riwayat () {
    var r = D.riwayat || [];
    var out = [];
    if (!r.length) return [{ teks: '(belum ada riwayat)' }];
    for (var i = 0; i < r.length; i++) {
      out.push({
        teks: (r[i].h >= 0 ? '＋' : '－') + fmt(Math.abs(r[i].h)) + '  ·  ' + r[i].l + '  ·  taruhan ' + fmt(r[i].b),
        warna: r[i].h >= 0 ? '#8effc1' : '#ff9fb2'
      });
    }
    return out;
  }
  function statBaris () {
    var s = D.stat || {};
    return [
      { judul: 'STATISTIK ' + (D.judulStat || '') },
      { teks: 'Ronde: ' + fmt(s.main) + '  ·  Menang: ' + fmt(s.menang) + '  ·  Pembayaran terbaik: ' + fmt(s.terbaik) },
      { teks: 'Total taruhan: ' + fmt(s.taruhan) + '  ·  Total hasil: ' + fmt(s.hasil) + '  ·  Untung/rugi: ' + ((s.hasil - s.taruhan) >= 0 ? '+' : '−') + fmt(Math.abs((s.hasil || 0) - (s.taruhan || 0))) }
    ];
  }
  function gambarPaytable (baris) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 34, W, H - 112); ctx.clip();
    ctx.translate(0, 34 - gulir * 18);
    ctx.font = '700 12px monospace';
    var y = 26;
    ctx.fillStyle = '#ffd166'; ctx.font = '900 14px monospace';
    ctx.fillText(D.judulPaytable || 'PAYTABLE', 16, y); y += 24;
    ctx.font = '700 12px monospace';
    for (var i = 0; i < baris.length; i++) {
      ctx.fillStyle = baris[i].warna || '#d8ecff';
      ctx.fillText(baris[i].kiri, 20, y);
      ctx.textAlign = 'right';
      ctx.fillText(baris[i].kanan, W - 20, y);
      ctx.textAlign = 'left';
      y += 18;
    }
    ctx.restore();
    A.state.gulirMaks = Math.max(0, Math.ceil((y + gulir * 18 - (H - 120)) / 18));
  }

  function reset () {
    frame = 0; panel = 0; gulir = 0; ulang++;
    A.setScore(D.bayar || 0);
    A.setBest();
    A.setStatus('Taruhan ' + fmt(D.bet), 'Saldo ' + fmt(D.saldoAkhir));
    A.setProgress(1);
  }
`

/* ------------------------------------------------------------------ */
/*  🎡 ROLET                                                           */
/* ------------------------------------------------------------------ */
const ROLET_JS = `
  var RODA = D.roda || [];
  var MERAH = D.merah || [];
  var hasil = D.angka | 0;
  var posHasil = Math.max(0, RODA.indexOf(hasil));
  var PUTARAN = 4;
  var durasi = 190;

  function warnaDari (n) { return n === 0 ? '#1f9d55' : (MERAH.indexOf(n) >= 0 ? '#d7263d' : '#1b1b1f'); }
  function kemaju () { return Math.min(1, frame / durasi); }
  function sudutBola () {
    var k = kemaju();
    var ease = 1 - Math.pow(1 - k, 3);
    var total = (PUTARAN * RODA.length + posHasil) * (Math.PI * 2 / RODA.length);
    return -total * ease;
  }
  function gambarRoda () {
    var cxp = W / 2, cyp = 44 + (H - 156) * 0.42;
    var R1 = Math.min(W * 0.4, (H - 170) * 0.42), R2 = R1 * 0.62;
    ctx.save(); ctx.translate(cxp, cyp);
    /* mangkuk luar */
    ctx.strokeStyle = '#caa44a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, R1 + 12, 0, 6.29); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.rotate(-sudutBola());
    var langkah = Math.PI * 2 / RODA.length;
    for (var i = 0; i < RODA.length; i++) {
      var a0 = i * langkah, a1 = a0 + langkah;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R1, a0, a1); ctx.closePath();
      ctx.fillStyle = warnaDari(RODA[i]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.stroke();
      ctx.save(); ctx.rotate(a0 + langkah / 2);
      ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.max(8, R1 * 0.075) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(RODA[i]), 0, -R1 * 0.86);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, R2, 0, 6.29);
    var g = ctx.createRadialGradient(0, 0, R2 * 0.2, 0, 0, R2);
    g.addColorStop(0, '#2b2118'); g.addColorStop(1, '#120d08');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#caa44a'; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 1;
    /* jarum penanda hasil */
    ctx.fillStyle = '#ffd166'; ctx.font = '900 ' + (R2 * 0.42) + 'px monospace';
    ctx.textAlign = 'center'; ctx.fillText(String(hasil), 0, R2 * 0.16);
    ctx.font = '700 ' + (R2 * 0.2) + 'px monospace'; ctx.fillStyle = '#cfe8ff';
    ctx.fillText(D.pilihanLabel || '', 0, R2 * 0.5);
    ctx.restore();
    /* bola */
    var k = kemaju();
    var rb = R1 * (1 - 0.13 * k);
    var ab = sudutBola() * -7 + frame * 0.22 * (1 - k) + posHasil * (Math.PI * 2 / RODA.length) * (k > 0.82 ? 1 : 0);
    if (k >= 0.82) ab = posHasil * (Math.PI * 2 / RODA.length) + Math.PI / 2 + sudutBola();
    var bx = cxp + Math.cos(ab - Math.PI / 2) * rb, by = cyp + Math.sin(ab - Math.PI / 2) * rb;
    ctx.shadowBlur = 12; ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, 6.29); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    /* papan taruhan mini di bawah roda */
    var y0 = cyp + R1 + 26;
    ctx.font = '700 11px monospace';
    for (var n = 0; n <= 36; n++) {
      var kolom = n % 12, baris = Math.floor(n / 12);
      var x = 16 + kolom * ((W - 32) / 12), y = y0 + baris * 16;
      ctx.fillStyle = n === hasil ? '#ffd166' : warnaDari(n);
      ctx.globalAlpha = n === hasil ? 1 : 0.55;
      ctx.fillRect(x, y, (W - 32) / 12 - 2, 13);
      ctx.globalAlpha = 1;
      if (n === hasil) { ctx.fillStyle = '#1a1206'; ctx.fillText(String(n), x + 3, y + 10); }
    }
    if (k >= 1) {
      ctx.fillStyle = '#ffd166'; ctx.font = '900 16px monospace'; ctx.textAlign = 'center';
      ctx.fillText('HASIL: ' + hasil + ' ' + (D.warna || '').toUpperCase() + ' · ' + (D.pilihanLabel || ''), W / 2, 54);
      ctx.textAlign = 'left';
    }
  }
  function rincian () {
    return [
      { judul: 'HASIL RONDE' },
      { teks: 'Angka keluar: ' + D.angka + ' (' + (D.warna || '-') + ')' },
      { teks: 'Taruhan kamu: ' + (D.pilihanLabel || '-') + ' · pengali ×' + (D.kali || 0) },
      { teks: 'Pembayaran: ' + fmt(D.bayar) + ' koin · untung/rugi: ' + ((D.untung || 0) >= 0 ? '+' : '−') + fmt(Math.abs(D.untung || 0)), warna: (D.untung || 0) >= 0 ? '#8effc1' : '#ff9fb2' },
      { teks: 'Saldo: ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' koin · EXP +' + fmt(D.exp) },
      { teks: 'Luck ×' + (D.luck || 1) + (D.bonusKoin > 1 ? ' · bonus koin ×' + D.bonusKoin : '') }
    ].concat(statBaris(), [{ judul: 'RIWAYAT' }], riwayat());
  }
  function paytable () {
    var out = [];
    var tb = D.tabel || [];
    for (var i = 0; i < tb.length; i++) {
      out.push({ kiri: tb[i].label, kanan: '×' + tb[i].kali + '  (' + tb[i].peluang + '% · RTP ' + tb[i].rtp + '%)', warna: tb[i].rtp >= 92 ? '#8effc1' : '#d8ecff' });
    }
    out.push({ kiri: '——', kanan: '——' });
    out.push({ kiri: '0 hijau = rumah menang', kanan: 'semua taruhan luar kalah' });
    out.push({ kiri: 'Bonus koin (rumah/dekor)', kanan: 'hanya lusin/kolom/angka' });
    out.push({ kiri: 'Batas bayar per ronde', kanan: fmt(D.maksBayar || 0) });
    return out;
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    frame += dt;
    latar();
    if (panel === 0) { gambarRoda(); }
    else if (panel === 1) { panelRincian(rincian()); }
    else { gambarPaytable(paytable()); }
    kepalaPanel();
    kakiHasil();
    if (kemaju() >= 1 && !A.state.sudah) { A.state.sudah = true; if ((D.bayar || 0) > (D.bet || 0)) A.SFX.level(); else A.SFX.crash(); }
    A.setScore(D.bayar || 0);
    A.setStatus('Angka ' + D.angka, 'Saldo ' + fmt(D.saldoAkhir));
    A.setProgress(kemaju());
    A.state = Object.assign(A.state || {}, {
      panel: panel, gulir: gulir, frame: Math.round(frame), sudah: A.state && A.state.sudah,
      angka: D.angka, warna: D.warna, bayar: D.bayar, bet: D.bet, pilihan: D.pilihanLabel,
      kemaju: Number(kemaju().toFixed(2)), posHasil: posHasil, over: false
    });
    requestAnimationFrame(loop);
  }
  A.debug = { warnaDari: warnaDari, sudutBola: sudutBola, kemaju: kemaju, RODA: RODA, posHasil: posHasil, paytable: paytable };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') { panel = (panel + 2) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { panel = (panel + 1) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowUp' || k === 'KeyW') { gulir = Math.max(0, gulir - 2); }
    else if (k === 'ArrowDown' || k === 'KeyS') { gulir = Math.min((A.state.gulirMaks || 0) + 6, gulir + 2); }
    else if (k === 'Space' || k === 'Enter') { frame = 0; A.state.sudah = false; A.SFX.point(); }
  });
  function sentuh () { A.initAudio(); if (panel === 0) { frame = 0; A.state.sudah = false; } else panel = (panel + 1) % 3; }
  c.addEventListener('touchstart', function (e) { sentuh(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', sentuh);

  reset();
  requestAnimationFrame(loop);
`

/** kartu rolet: roda berputar lalu berhenti di angka hasil server */
export function roletHtml (brand = 'THERYHANN!', data = {}) {
  const aman = {
    judulStat: 'ROLET',
    roda: RODA_ROLET_LOKAL, merah: MERAH_ROLET_LOKAL,
    bet: Math.max(0, Math.floor(data.bet || 0)),
    angka: Math.max(0, Math.min(36, Math.floor(data.angka || 0))),
    warna: String(data.warna || 'hitam').slice(0, 8),
    pilihanLabel: String(data.pilihanLabel || '').slice(0, 22),
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    kali: Number(data.kali || 0), untung: Math.floor(data.untung || 0),
    bonusKoin: Number(data.bonusKoin || 1),
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number(Number(data.luck || 1).toFixed(2)),
    maksBayar: Math.floor(data.maksBayar || 0),
    tabel: (Array.isArray(data.tabel) ? data.tabel : []).slice(0, 20).map(t => ({
      label: String(t.label || '').slice(0, 20), kali: Number(t.kali || 0),
      peluang: Number(t.peluang || 0), rtp: Number(t.rtp || 0)
    })),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(riwayatAman),
    stat: statAman(data.stat),
    warna0: '#1a0f0a', warna1: '#080403'
  }
  return bungkusKartu('Rolet RPG', brand, ROLET_JS, aman, {
    w: 600, h: 660, maxw: 600,
    hint: '◀▶ panel MEJA / RINCIAN / PAYTABLE · ▲▼ gulir · ● putar ulang roda'
  })
}

/* ------------------------------------------------------------------ */
/*  🎲 DADU                                                            */
/* ------------------------------------------------------------------ */
const DADU_JS = `
  var hasilDadu = D.dadu || [1, 1, 1];
  var durasi = 150;
  function kemaju () { return Math.min(1, frame / durasi); }
  function nilaiAcak (i, f) {
    if (f >= 1) return hasilDadu[i];
    return 1 + ((Math.floor(frame / 4) + i * 3) % 6);
  }
  function gambarDadu () {
    var f = kemaju();
    var ukuran = Math.min(96, (W - 80) / 3);
    var y0 = 60 + (H - 200) * 0.3;
    ctx.textAlign = 'center';
    for (var i = 0; i < 3; i++) {
      var x = W / 2 + (i - 1) * (ukuran + 16);
      var lompat = f < 1 ? Math.abs(Math.sin((frame / 9) + i)) * 26 * (1 - f) : 0;
      var rot = f < 1 ? (frame / 7 + i) : 0;
      var n = nilaiAcak(i, f);
      ctx.save();
      ctx.translate(x, y0 - lompat);
      ctx.rotate(rot * (f < 1 ? 1 : 0));
      ctx.shadowBlur = 16; ctx.shadowColor = '#ffd166';
      ctx.fillStyle = '#fdf6e3'; bulatR(-ukuran / 2, -ukuran / 2, ukuran, ukuran, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#caa44a'; ctx.lineWidth = 3; bulatR(-ukuran / 2, -ukuran / 2, ukuran, ukuran, 16); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = '#b3202f';
      var titik = polaTitik(n);
      for (var t = 0; t < titik.length; t++) {
        ctx.beginPath();
        ctx.arc(titik[t][0] * ukuran * 0.27, titik[t][1] * ukuran * 0.27, ukuran * 0.085, 0, 6.29);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = '#ffd166'; ctx.font = '900 16px monospace';
      ctx.fillText(String(n), x, y0 + ukuran * 0.85);
    }
    ctx.textAlign = 'left';
    /* total & keterangan */
    var total = hasilDadu[0] + hasilDadu[1] + hasilDadu[2];
    var tampil = f >= 1 ? total : '—';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = '900 30px monospace';
    ctx.fillText('JUMLAH ' + tampil, W / 2, y0 + ukuran * 1.4);
    if (f >= 1) {
      ctx.fillStyle = D.triple ? '#ffd166' : ((D.bayar || 0) > (D.bet || 0) ? '#00ff87' : '#ff9fb2');
      ctx.font = '900 17px monospace';
      ctx.fillText((D.triple ? 'TRIPLE! ' : '') + (D.pilihanLabel || ''), W / 2, y0 + ukuran * 1.4 + 26);
      ctx.fillStyle = '#cfe8ff'; ctx.font = '700 13px monospace';
      ctx.fillText(D.ket || '', W / 2, y0 + ukuran * 1.4 + 50);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '700 13px monospace';
      ctx.fillText('mengocok dadu…', W / 2, y0 + ukuran * 1.4 + 26);
    }
    ctx.textAlign = 'left';
  }
  function polaTitik (n) {
    var P = {
      1: [[0, 0]],
      2: [[-1, -1], [1, 1]],
      3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
      6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
    };
    return P[n] || P[1];
  }
  function rincian () {
    return [
      { judul: 'HASIL RONDE' },
      { teks: 'Dadu: ' + (D.dadu || []).join(' + ') + ' = ' + (D.total || 0) + (D.triple ? ' (TRIPLE)' : '') },
      { teks: 'Taruhan: ' + (D.pilihanLabel || '-') + ' · pengali ×' + (D.kali || 0) },
      { teks: 'Pembayaran: ' + fmt(D.bayar) + ' koin · untung/rugi: ' + ((D.untung || 0) >= 0 ? '+' : '−') + fmt(Math.abs(D.untung || 0)), warna: (D.untung || 0) >= 0 ? '#8effc1' : '#ff9fb2' },
      { teks: 'Saldo: ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' koin · EXP +' + fmt(D.exp) },
      { teks: 'Aturan: triple (3 dadu sama) membatalkan besar/kecil/genap/ganjil' }
    ].concat(statBaris(), [{ judul: 'RIWAYAT' }], riwayat());
  }
  function paytable () {
    var out = [];
    var tb = D.tabel || [];
    for (var i = 0; i < tb.length; i++) {
      out.push({ kiri: tb[i].label, kanan: '×' + tb[i].kali + ' (' + tb[i].peluang + '% · RTP ' + tb[i].rtp + '%)', warna: tb[i].rtp >= 90 ? '#8effc1' : '#d8ecff' });
    }
    out.push({ kiri: '——', kanan: '——' });
    out.push({ kiri: 'Batas bayar per ronde', kanan: fmt(D.maksBayar || 0) });
    return out;
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    frame += dt;
    latar();
    if (panel === 0) gambarDadu();
    else if (panel === 1) panelRincian(rincian());
    else gambarPaytable(paytable());
    kepalaPanel(); kakiHasil();
    if (kemaju() >= 1 && !A.state.sudah) { A.state.sudah = true; if ((D.bayar || 0) > (D.bet || 0)) A.SFX.level(); else A.SFX.crash(); }
    A.setScore(D.bayar || 0);
    A.setStatus('Jumlah ' + (D.total || 0), 'Saldo ' + fmt(D.saldoAkhir));
    A.setProgress(kemaju());
    A.state = Object.assign(A.state || {}, {
      panel: panel, gulir: gulir, frame: Math.round(frame), sudah: !!(A.state && A.state.sudah),
      dadu: D.dadu, total: D.total, triple: !!D.triple, bayar: D.bayar, bet: D.bet,
      kemaju: Number(kemaju().toFixed(2)), over: false
    });
    requestAnimationFrame(loop);
  }
  A.debug = { polaTitik: polaTitik, kemaju: kemaju, nilaiAcak: nilaiAcak, paytable: paytable };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') { panel = (panel + 2) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { panel = (panel + 1) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowUp' || k === 'KeyW') gulir = Math.max(0, gulir - 2);
    else if (k === 'ArrowDown' || k === 'KeyS') gulir = Math.min((A.state.gulirMaks || 0) + 6, gulir + 2);
    else if (k === 'Space' || k === 'Enter') { frame = 0; A.state.sudah = false; A.SFX.point(); }
  });
  function sentuh () { A.initAudio(); if (panel === 0) { frame = 0; A.state.sudah = false; } else panel = (panel + 1) % 3; }
  c.addEventListener('touchstart', function (e) { sentuh(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', sentuh);

  reset();
  requestAnimationFrame(loop);
`

export function daduHtml (brand = 'THERYHANN!', data = {}) {
  const aman = {
    judulStat: 'DADU',
    bet: Math.max(0, Math.floor(data.bet || 0)),
    dadu: (Array.isArray(data.dadu) ? data.dadu : [1, 2, 3]).slice(0, 3).map(x => Math.max(1, Math.min(6, Math.floor(x) || 1))),
    total: Math.max(3, Math.min(18, Math.floor(data.total || 0))),
    triple: !!data.triple,
    pilihanLabel: String(data.pilihanLabel || '').slice(0, 24),
    ket: String(data.ket || '').slice(0, 90),
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    kali: Number(data.kali || 0), untung: Math.floor(data.untung || 0),
    bonusKoin: Number(data.bonusKoin || 1),
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number(Number(data.luck || 1).toFixed(2)),
    maksBayar: Math.floor(data.maksBayar || 0),
    tabel: (Array.isArray(data.tabel) ? data.tabel : []).slice(0, 26).map(t => ({
      label: String(t.label || '').slice(0, 22), kali: Number(t.kali || 0),
      peluang: Number(t.peluang || 0), rtp: Number(t.rtp || 0)
    })),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(riwayatAman),
    stat: statAman(data.stat),
    warna0: '#160d24', warna1: '#07040f'
  }
  return bungkusKartu('Dadu RPG', brand, DADU_JS, aman, {
    w: 560, h: 620, maxw: 560,
    hint: '◀▶ panel · ▲▼ gulir · ● kocok ulang animasi dadu'
  })
}

/* ------------------------------------------------------------------ */
/*  📈 AVIATOR (crash)                                                 */
/* ------------------------------------------------------------------ */
const AVIATOR_JS = `
  var crash = Number(D.crash || 1);
  var target = Number(D.target || 2);
  var durasi = Math.min(260, 70 + Math.log(Math.max(1.05, crash)) * 90);
  var MAKS_X = Math.max(crash, target) * 1.12;
  function kemaju () { return Math.min(1, frame / durasi); }
  function nilaiPada (k) { return Math.pow(crash, k); }
  function gambarKurva () {
    var x0 = 46, y0 = H - 108, x1 = W - 20, y1 = 52;
    var k = kemaju();
    /* grid */
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    for (var i = 0; i <= 5; i++) {
      var gy = y0 - (y0 - y1) * (i / 5);
      ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '700 10px monospace';
      ctx.fillText('×' + (1 + (MAKS_X - 1) * (i / 5)).toFixed(1), 6, gy + 3);
    }
    for (var j = 0; j <= 4; j++) {
      var gx = x0 + (x1 - x0) * (j / 4);
      ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx, y1); ctx.stroke();
    }
    function px (kk) { return x0 + (x1 - x0) * kk; }
    function py (nilai) { return y0 - (y0 - y1) * Math.min(1, (nilai - 1) / Math.max(0.001, MAKS_X - 1)); }
    /* garis target cash-out */
    ctx.strokeStyle = '#ffd166'; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x0, py(target)); ctx.lineTo(x1, py(target)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166'; ctx.font = '700 11px monospace';
    ctx.fillText('TARGET ×' + target.toFixed(2), x0 + 6, py(target) - 6);
    /* kurva */
    var akhir = k;
    ctx.beginPath();
    ctx.moveTo(px(0), py(1));
    for (var s = 0; s <= 60; s++) {
      var kk = akhir * (s / 60);
      ctx.lineTo(px(kk), py(nilaiPada(kk)));
    }
    var gradien = ctx.createLinearGradient(x0, y0, x1, y1);
    gradien.addColorStop(0, '#ff3b6b'); gradien.addColorStop(1, '#ffd166');
    ctx.strokeStyle = gradien; ctx.lineWidth = 4; ctx.stroke(); ctx.lineWidth = 1;
    ctx.lineTo(px(akhir), y0); ctx.lineTo(px(0), y0); ctx.closePath();
    ctx.fillStyle = 'rgba(255,90,120,0.14)'; ctx.fill();
    /* roket */
    var rx = px(akhir), ry = py(nilaiPada(akhir));
    if (k < 1) {
      ctx.save(); ctx.translate(rx, ry);
      var kemiringan = -0.5 + 0.2 * k;
      ctx.rotate(kemiringan);
      ctx.fillStyle = '#ff9f43';
      ctx.beginPath(); ctx.moveTo(-16, 4); ctx.lineTo(-30 - Math.random() * 8, 0); ctx.lineTo(-16, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, 8); ctx.lineTo(-8, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff3b6b'; ctx.beginPath(); ctx.arc(2, 0, 3.6, 0, 6.29); ctx.fill();
      ctx.restore();
    }
    /* multiplier besar */
    ctx.textAlign = 'center';
    var nilaiSekarang = k < 1 ? nilaiPada(k) : crash;
    ctx.font = '900 44px monospace';
    ctx.fillStyle = k < 1 ? '#fff' : (D.menang ? '#00ff87' : '#ff3b6b');
    ctx.fillText('×' + nilaiSekarang.toFixed(2), W / 2, 118);
    if (k >= 1) {
      ctx.font = '900 20px monospace';
      ctx.fillText(D.menang ? 'CASH-OUT ×' + target.toFixed(2) : 'JEBOL!', W / 2, 148);
      /* tanda ledakan di titik crash */
      ctx.strokeStyle = '#ff3b6b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px(1), py(crash), 16 + Math.sin(frame / 6) * 4, 0, 6.29); ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '700 11px monospace';
    ctx.fillText('waktu →', x1 - 54, y0 + 16);
  }
  function rincian () {
    return [
      { judul: 'HASIL RONDE' },
      { teks: 'Kurva jebol di ×' + Number(D.crash).toFixed(2) },
      { teks: 'Target cash-out kamu: ×' + Number(D.target).toFixed(2) },
      { teks: D.menang ? 'Berhasil cash-out sebelum jebol' : 'Kurva jebol lebih dulu', warna: D.menang ? '#8effc1' : '#ff9fb2' },
      { teks: 'Pembayaran: ' + fmt(D.bayar) + ' koin · untung/rugi: ' + ((D.untung || 0) >= 0 ? '+' : '−') + fmt(Math.abs(D.untung || 0)) },
      { teks: 'Saldo: ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' koin · EXP +' + fmt(D.exp) },
      { teks: 'Tips: target tinggi = untung besar tapi peluang kecil. RTP sama untuk semua target (≈94%).' }
    ].concat(statBaris(), [{ judul: 'RIWAYAT' }], riwayat());
  }
  function paytable () {
    var out = [];
    var tb = D.tabel || [];
    for (var i = 0; i < tb.length; i++) {
      out.push({ kiri: 'Target ×' + tb[i].target, kanan: 'peluang ' + tb[i].peluang + '% · bayar ×' + tb[i].kali + ' · RTP ' + tb[i].rtp + '%', warna: tb[i].rtp >= 94 ? '#8effc1' : '#d8ecff' });
    }
    out.push({ kiri: '——', kanan: '——' });
    out.push({ kiri: 'Jebol instan ×1.00', kanan: '±6% ronde' });
    out.push({ kiri: 'Bonus koin (rumah/dekor)', kanan: 'hanya target ≥ ×5' });
    out.push({ kiri: 'Batas bayar per ronde', kanan: fmt(D.maksBayar || 0) });
    return out;
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    frame += dt;
    latar();
    if (panel === 0) gambarKurva();
    else if (panel === 1) panelRincian(rincian());
    else gambarPaytable(paytable());
    kepalaPanel(); kakiHasil();
    if (kemaju() >= 1 && !A.state.sudah) { A.state.sudah = true; if (D.menang) A.SFX.level(); else A.SFX.crash(); }
    A.setScore(D.bayar || 0);
    A.setStatus('Crash ×' + Number(D.crash).toFixed(2), 'Target ×' + Number(D.target).toFixed(2));
    A.setProgress(kemaju());
    A.state = Object.assign(A.state || {}, {
      panel: panel, gulir: gulir, frame: Math.round(frame), sudah: !!(A.state && A.state.sudah),
      crash: D.crash, target: D.target, menang: !!D.menang, bayar: D.bayar, bet: D.bet,
      nilai: Number(nilaiPada(kemaju()).toFixed(2)), kemaju: Number(kemaju().toFixed(2)), over: false
    });
    requestAnimationFrame(loop);
  }
  A.debug = { kemaju: kemaju, nilaiPada: nilaiPada, durasi: durasi, MAKS_X: MAKS_X, paytable: paytable };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') { panel = (panel + 2) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { panel = (panel + 1) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowUp' || k === 'KeyW') gulir = Math.max(0, gulir - 2);
    else if (k === 'ArrowDown' || k === 'KeyS') gulir = Math.min((A.state.gulirMaks || 0) + 6, gulir + 2);
    else if (k === 'Space' || k === 'Enter') { frame = 0; A.state.sudah = false; A.SFX.point(); }
  });
  function sentuh () { A.initAudio(); if (panel === 0) { frame = 0; A.state.sudah = false; } else panel = (panel + 1) % 3; }
  c.addEventListener('touchstart', function (e) { sentuh(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', sentuh);

  reset();
  requestAnimationFrame(loop);
`

export function aviatorHtml (brand = 'THERYHANN!', data = {}) {
  const aman = {
    judulStat: 'AVIATOR',
    bet: Math.max(0, Math.floor(data.bet || 0)),
    crash: Math.max(1, Math.min(999, Number(data.crash) || 1)),
    target: Math.max(1.1, Math.min(50, Number(data.target) || 2)),
    menang: !!data.menang,
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    kali: Number(data.kali || 0), untung: Math.floor(data.untung || 0),
    bonusKoin: Number(data.bonusKoin || 1),
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number(Number(data.luck || 1).toFixed(2)),
    maksBayar: Math.floor(data.maksBayar || 0),
    tabel: (Array.isArray(data.tabel) ? data.tabel : []).slice(0, 12).map(t => ({
      target: Number(t.target || 2), kali: Number(t.kali || 0),
      peluang: Number(t.peluang || 0), rtp: Number(t.rtp || 0)
    })),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(riwayatAman),
    stat: statAman(data.stat),
    warna0: '#12041f', warna1: '#050109'
  }
  return bungkusKartu('Aviator RPG', brand, AVIATOR_JS, aman, {
    w: 600, h: 600, maxw: 600,
    hint: '◀▶ panel · ▲▼ gulir · ● putar ulang kurva · garis kuning = target cash-out kamu'
  })
}

/* ------------------------------------------------------------------ */
/*  🎯 KENO                                                            */
/* ------------------------------------------------------------------ */
const KENO_JS = `
  var pilih = D.pilih || [];
  var undian = D.undian || [];
  var KOLON = 8, BARIS = 5;
  function kemaju () { return Math.min(1, frame / (40 + undian.length * 16)); }
  function jumlahTampil () { return Math.min(undian.length, Math.max(0, Math.floor((frame - 30) / 16))); }
  function gambarPapan () {
    var uk = Math.min(52, (W - 40) / KOLON);
    var ox = (W - uk * KOLON) / 2, oy = 74;
    var tampil = jumlahTampil();
    ctx.textAlign = 'center';
    for (var n = 1; n <= 40; n++) {
      var kx = (n - 1) % KOLON, ky = Math.floor((n - 1) / KOLON);
      var x = ox + kx * uk, y = oy + ky * uk;
      var dipilih = pilih.indexOf(n) >= 0;
      var keluar = undian.indexOf(n) >= 0 && undian.slice(0, tampil).indexOf(n) >= 0;
      var kena = dipilih && keluar;
      if (kena) {
        ctx.shadowBlur = 14; ctx.shadowColor = '#00ff87';
        ctx.fillStyle = '#00ff87';
      } else if (keluar) {
        ctx.shadowBlur = 8; ctx.shadowColor = '#59f7ff';
        ctx.fillStyle = '#1f6f8b';
      } else if (dipilih) {
        ctx.shadowBlur = 8; ctx.shadowColor = '#ffd166';
        ctx.fillStyle = '#6b5416';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
      }
      bulatR(x + 2, y + 2, uk - 4, uk - 4, 9); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = dipilih ? '#ffd166' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = dipilih ? 2 : 1;
      bulatR(x + 2, y + 2, uk - 4, uk - 4, 9); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = kena ? '#03220f' : keluar ? '#dff7ff' : dipilih ? '#ffe9a8' : 'rgba(255,255,255,0.55)';
      ctx.font = '900 ' + Math.round(uk * 0.36) + 'px monospace';
      ctx.fillText(String(n), x + uk / 2, y + uk * 0.62);
    }
    ctx.textAlign = 'left';
    /* keterangan */
    var kenaSekarang = 0;
    for (var i = 0; i < undian.slice(0, tampil).length; i++) if (pilih.indexOf(undian[i]) >= 0) kenaSekarang++;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166'; ctx.font = '900 16px monospace';
    ctx.fillText('PILIHANMU: ' + (pilih.join(' · ') || '-'), W / 2, 52);
    ctx.fillStyle = tampil >= undian.length ? '#fff' : 'rgba(255,255,255,0.7)';
    ctx.font = '900 22px monospace';
    ctx.fillText((tampil >= undian.length ? 'KENA ' : 'mengundi… ') + (tampil >= undian.length ? kenaSekarang + '/' + pilih.length : tampil + '/' + undian.length), W / 2, oy + BARIS * uk + 30);
    if (tampil >= undian.length) {
      ctx.fillStyle = (D.bayar || 0) > (D.bet || 0) ? '#00ff87' : '#ff9fb2';
      ctx.font = '900 15px monospace';
      ctx.fillText(D.ket || '', W / 2, oy + BARIS * uk + 56);
    }
    ctx.textAlign = 'left';
  }
  function rincian () {
    return [
      { judul: 'HASIL RONDE' },
      { teks: 'Pilihanmu (' + pilih.length + '): ' + (pilih.join(', ') || '-') },
      { teks: 'Undian (10): ' + undian.join(', ') },
      { teks: 'Kena: ' + (D.kena || []).join(', ') + ' (' + (D.kena || []).length + ' angka)', warna: (D.bayar || 0) > (D.bet || 0) ? '#8effc1' : '#ff9fb2' },
      { teks: 'Pembayaran: ' + fmt(D.bayar) + ' koin · ×' + (D.kali || 0) + ' · untung/rugi: ' + ((D.untung || 0) >= 0 ? '+' : '−') + fmt(Math.abs(D.untung || 0)) },
      { teks: 'Saldo: ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' koin · EXP +' + fmt(D.exp) }
    ].concat(statBaris(), [{ judul: 'RIWAYAT' }], riwayat());
  }
  function paytable () {
    var out = [];
    var tb = D.tabel || [];
    for (var i = 0; i < tb.length; i++) {
      out.push({ kiri: tb[i].kiri, kanan: tb[i].kanan, warna: tb[i].rtp >= 88 ? '#8effc1' : '#d8ecff' });
    }
    out.push({ kiri: '——', kanan: '——' });
    out.push({ kiri: 'Bonus koin (rumah/dekor)', kanan: 'hanya pengali ≥ ×50' });
    out.push({ kiri: 'Batas bayar per ronde', kanan: fmt(D.maksBayar || 0) });
    return out;
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    frame += dt;
    latar();
    if (panel === 0) gambarPapan();
    else if (panel === 1) panelRincian(rincian());
    else gambarPaytable(paytable());
    kepalaPanel(); kakiHasil();
    if (kemaju() >= 1 && !A.state.sudah) { A.state.sudah = true; if ((D.bayar || 0) > (D.bet || 0)) A.SFX.level(); else A.SFX.crash(); }
    A.setScore(D.bayar || 0);
    A.setStatus('Undian ' + jumlahTampil() + '/10', 'Kena ' + (D.kena || []).length);
    A.setProgress(kemaju());
    A.state = Object.assign(A.state || {}, {
      panel: panel, gulir: gulir, frame: Math.round(frame), sudah: !!(A.state && A.state.sudah),
      pilih: pilih, undian: undian, tampil: jumlahTampil(), kena: (D.kena || []).length,
      bayar: D.bayar, bet: D.bet, kemaju: Number(kemaju().toFixed(2)), over: false
    });
    requestAnimationFrame(loop);
  }
  A.debug = { kemaju: kemaju, jumlahTampil: jumlahTampil, paytable: paytable };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') { panel = (panel + 2) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { panel = (panel + 1) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowUp' || k === 'KeyW') gulir = Math.max(0, gulir - 2);
    else if (k === 'ArrowDown' || k === 'KeyS') gulir = Math.min((A.state.gulirMaks || 0) + 6, gulir + 2);
    else if (k === 'Space' || k === 'Enter') { frame = 0; A.state.sudah = false; A.SFX.point(); }
  });
  function sentuh () { A.initAudio(); if (panel === 0) { frame = 0; A.state.sudah = false; } else panel = (panel + 1) % 3; }
  c.addEventListener('touchstart', function (e) { sentuh(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', sentuh);

  reset();
  requestAnimationFrame(loop);
`

export function kenoHtml (brand = 'THERYHANN!', data = {}) {
  const aman = {
    judulStat: 'KENO',
    bet: Math.max(0, Math.floor(data.bet || 0)),
    pilih: (Array.isArray(data.pilih) ? data.pilih : []).slice(0, 6).map(x => Math.max(1, Math.min(40, Math.floor(x) || 1))),
    undian: (Array.isArray(data.undian) ? data.undian : []).slice(0, 10).map(x => Math.max(1, Math.min(40, Math.floor(x) || 1))),
    kena: (Array.isArray(data.kena) ? data.kena : []).slice(0, 6).map(x => Math.max(1, Math.min(40, Math.floor(x) || 1))),
    ket: String(data.ket || '').slice(0, 60),
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    kali: Number(data.kali || 0), untung: Math.floor(data.untung || 0),
    bonusKoin: Number(data.bonusKoin || 1),
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number(Number(data.luck || 1).toFixed(2)),
    maksBayar: Math.floor(data.maksBayar || 0),
    tabel: (Array.isArray(data.tabel) ? data.tabel : []).slice(0, 30).map(t => ({
      kiri: String(t.kiri || '').slice(0, 26), kanan: String(t.kanan || '').slice(0, 46), rtp: Number(t.rtp || 0)
    })),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(riwayatAman),
    stat: statAman(data.stat),
    warna0: '#04141f', warna1: '#020a10'
  }
  return bungkusKartu('Keno RPG', brand, KENO_JS, aman, {
    w: 560, h: 620, maxw: 560,
    hint: '◀▶ panel · ▲▼ gulir · ● undi ulang · kuning = pilihanmu, biru = undian, hijau = kena'
  })
}

/* ------------------------------------------------------------------ */
/*  🃏 BLACKJACK                                                       */
/* ------------------------------------------------------------------ */
const BLACKJACK_JS = `
  var pemain = D.pemain || [];
  var bandar = D.bandar || [];
  var buka = D.fase === 'buka' || D.hasil;
  function kemaju () {
    var total = pemain.length + (buka ? bandar.length : 1);
    return Math.min(1, frame / (18 + total * 16));
  }
  function kartuKe (i) { return Math.floor((frame - 18 - i * 16) / 16) >= 0; }
  function warnaKartu (k) { return (String(k).slice(-1) === '♥' || String(k).slice(-1) === '♦') ? '#d7263d' : '#1b1b1f'; }
  function gambarKartu (k, x, y, w, h, balik) {
    ctx.save();
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.fillStyle = '#fdf6e3'; bulatR(x, y, w, h, 8); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#b8a97a'; bulatR(x, y, w, h, 8); ctx.stroke();
    if (balik) {
      ctx.fillStyle = '#8b1e3f';
      bulatR(x + 5, y + 5, w - 10, h - 10, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      for (var i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(x + 5, y + 8 + i * (h - 16) / 5); ctx.lineTo(x + w - 5, y + 8 + i * (h - 16) / 5); ctx.stroke();
      }
      ctx.restore();
      return;
    }
    var rank = String(k).slice(0, -1), warna = String(k).slice(-1);
    ctx.fillStyle = warnaKartu(k);
    ctx.font = '900 ' + Math.round(h * 0.26) + 'px monospace';
    ctx.fillText(rank, x + 7, y + h * 0.3);
    ctx.font = '900 ' + Math.round(h * 0.3) + 'px "Segoe UI Symbol", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(warna, x + w / 2, y + h * 0.72);
    ctx.textAlign = 'left';
    ctx.restore();
  }
  function gambarMeja () {
    /* meja felt */
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.52, W * 0.56, H * 0.42, 0, 0, 6.29); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.52, W * 0.5, H * 0.36, 0, 0, 6.29); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255,209,102,0.75)'; ctx.font = '700 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('BLACKJACK BAYAR ' + (D.bayarBlackjack || 2.2) + '×  ·  BANDAR STAND DI 17', W / 2, H * 0.52 + 4);
    ctx.textAlign = 'left';

    var cw = Math.min(72, (W - 60) / 5), chh = cw * 1.45;
    /* bandar */
    ctx.fillStyle = '#ffd166'; ctx.font = '900 13px monospace';
    ctx.fillText('BANDAR', 20, 62);
    var totalBandar = buka ? D.bandarTotal : (D.bandarTerlihat || 0);
    ctx.fillStyle = '#fff';
    ctx.fillText(buka ? String(D.bandarTotal) : String(D.bandarTerlihat || '?') + ' + ?', 20, 80);
    for (var i = 0; i < bandar.length; i++) {
      if (!kartuKe(i)) break;
      gambarKartu(bandar[i], W / 2 - (bandar.length * (cw + 8)) / 2 + i * (cw + 8), 92, cw, chh, !buka && i === 1);
    }
    /* pemain */
    ctx.fillStyle = '#ffd166'; ctx.font = '900 13px monospace';
    ctx.fillText('KAMU', 20, H - 190);
    ctx.fillStyle = D.bust ? '#ff5e7a' : '#fff';
    ctx.fillText(String(D.pemainTotal) + (D.soft ? ' (soft)' : ''), 20, H - 172);
    for (var j = 0; j < pemain.length; j++) {
      if (!kartuKe(bandar.length + j)) break;
      gambarKartu(pemain[j], W / 2 - (pemain.length * (cw + 8)) / 2 + j * (cw + 8), H - 160, cw, chh, false);
    }
    /* hasil */
    if (kemaju() >= 1 && D.hasil) {
      ctx.textAlign = 'center';
      ctx.font = '900 26px monospace';
      ctx.fillStyle = D.hasil === 'menang' || D.hasil === 'blackjack' ? '#00ff87' : D.hasil === 'seri' ? '#ffd166' : '#ff5e7a';
      ctx.fillText((D.hasilLabel || D.hasil || '').toUpperCase(), W / 2, H * 0.5 - 4);
      ctx.font = '700 13px monospace'; ctx.fillStyle = '#cfe8ff';
      ctx.fillText(D.ket || '', W / 2, H * 0.5 + 20);
      ctx.textAlign = 'left';
    }
    /* sesi masih aktif → tampilkan aksi */
    if (!buka && D.fase === 'main') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H - 108, W, 30);
      ctx.fillStyle = '#8effc1'; ctx.font = '900 13px monospace'; ctx.textAlign = 'center';
      ctx.fillText((D.aksiTeks || '.hit  ·  .stand  ·  .double'), W / 2, H - 88);
      ctx.textAlign = 'left';
    }
  }
  function rincian () {
    var out = [
      { judul: 'RONDE BLACKJACK' },
      { teks: 'Kartu kamu: ' + (pemain.join(' ') || '-') + ' = ' + D.pemainTotal + (D.soft ? ' (soft)' : '') },
      { teks: 'Kartu bandar: ' + (buka ? bandar.join(' ') + ' = ' + D.bandarTotal : bandar[0] + ' + kartu tertutup') }
    ];
    if (D.hasil) {
      out.push({ teks: 'Hasil: ' + (D.hasilLabel || D.hasil) + ' · ' + (D.ket || ''), warna: D.bayar > D.bet ? '#8effc1' : D.bayar === D.bet ? '#ffd166' : '#ff9fb2' });
      out.push({ teks: 'Pembayaran: ' + fmt(D.bayar) + ' koin · untung/rugi: ' + ((D.untung || 0) >= 0 ? '+' : '−') + fmt(Math.abs(D.untung || 0)) });
      out.push({ teks: 'Saldo: ' + fmt(D.saldoAwal) + ' → ' + fmt(D.saldoAkhir) + ' koin · EXP +' + fmt(D.exp) });
    } else {
      out.push({ teks: 'Ronde masih berjalan — balas .hit / .stand / .double di chat.' });
      out.push({ teks: 'Sesi hangus setelah ' + Math.round((D.umurSesi || 600000) / 60000) + ' menit tidak dipakai.' });
    }
    return out.concat(statBaris(), [{ judul: 'RIWAYAT' }], riwayat());
  }
  function paytable () {
    var out = [
      { kiri: 'Blackjack (21 dgn 2 kartu)', kanan: 'bayar ×' + (D.bayarBlackjack || 2.2) },
      { kiri: 'Menang biasa', kanan: 'bayar ×' + (D.bayarMenang || 2) },
      { kiri: 'Seri (push)', kanan: 'taruhan kembali ×1' },
      { kiri: 'Bandar berhenti', kanan: 'total ≥ 17 (termasuk soft 17)' },
      { kiri: 'DOUBLE', kanan: 'hanya 2 kartu awal & total ≥ ' + (D.minDouble || 9) },
      { kiri: 'Sepatu', kanan: '4 deck (208 kartu), kocok ulang saat sisa < 60' },
      { kiri: '——', kanan: '——' },
      { kiri: 'Batas bayar per ronde', kanan: fmt(D.maksBayar || 0) }
    ];
    var tb = D.tabel || [];
    for (var i = 0; i < tb.length; i++) out.push({ kiri: tb[i].kiri, kanan: tb[i].kanan });
    return out;
  }

  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2.5); last = tm;
    frame += dt;
    latar();
    if (panel === 0) gambarMeja();
    else if (panel === 1) panelRincian(rincian());
    else gambarPaytable(paytable());
    kepalaPanel();
    if (buka) kakiHasil();
    if (kemaju() >= 1 && !A.state.sudah) {
      A.state.sudah = true;
      if (D.hasil === 'menang' || D.hasil === 'blackjack') A.SFX.level();
      else if (D.hasil) A.SFX.crash();
    }
    A.setScore(D.bayar || 0);
    A.setStatus(buka ? 'Total ' + D.pemainTotal + ' vs ' + D.bandarTotal : 'Giliranmu · ' + D.pemainTotal, 'Saldo ' + fmt(D.saldoAkhir));
    A.setProgress(kemaju());
    A.state = Object.assign(A.state || {}, {
      panel: panel, gulir: gulir, frame: Math.round(frame), sudah: !!(A.state && A.state.sudah),
      pemain: pemain, bandar: bandar, pemainTotal: D.pemainTotal, bandarTotal: D.bandarTotal,
      fase: D.fase, hasil: D.hasil || null, buka: !!buka, bayar: D.bayar || 0, bet: D.bet,
      kemaju: Number(kemaju().toFixed(2)), over: false
    });
    requestAnimationFrame(loop);
  }
  A.debug = { kemaju: kemaju, kartuKe: kartuKe, warnaKartu: warnaKartu, paytable: paytable };

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'ArrowLeft' || k === 'KeyA') { panel = (panel + 2) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { panel = (panel + 1) % 3; gulir = 0; A.SFX.jump(); }
    else if (k === 'ArrowUp' || k === 'KeyW') gulir = Math.max(0, gulir - 2);
    else if (k === 'ArrowDown' || k === 'KeyS') gulir = Math.min((A.state.gulirMaks || 0) + 6, gulir + 2);
    else if (k === 'Space' || k === 'Enter') { frame = 0; A.state.sudah = false; A.SFX.point(); }
  });
  function sentuh () { A.initAudio(); if (panel === 0) { frame = 0; A.state.sudah = false; } else panel = (panel + 1) % 3; }
  c.addEventListener('touchstart', function (e) { sentuh(); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', sentuh);

  reset();
  requestAnimationFrame(loop);
`

export function blackjackHtml (brand = 'THERYHANN!', data = {}) {
  const amanKartu = a => (Array.isArray(a) ? a : []).slice(0, 12).map(x => String(x || '').slice(0, 4))
  const aman = {
    judulStat: 'BLACKJACK',
    bet: Math.max(0, Math.floor(data.bet || 0)),
    pemain: amanKartu(data.pemain), bandar: amanKartu(data.bandar),
    pemainTotal: Math.max(0, Math.min(40, Math.floor(data.pemainTotal || 0))),
    bandarTotal: Math.max(0, Math.min(40, Math.floor(data.bandarTotal || 0))),
    bandarTerlihat: Math.max(0, Math.min(40, Math.floor(data.bandarTerlihat || 0))),
    soft: !!data.soft, bust: !!data.bust,
    fase: data.fase === 'main' ? 'main' : 'buka',
    hasil: String(data.hasil || '').slice(0, 12),
    hasilLabel: String(data.hasilLabel || '').slice(0, 20),
    ket: String(data.ket || '').slice(0, 60),
    aksiTeks: String(data.aksiTeks || '').slice(0, 46),
    bayar: Math.max(0, Math.floor(data.bayar || 0)),
    kali: Number(data.kali || 0), untung: Math.floor(data.untung || 0),
    bonusKoin: Number(data.bonusKoin || 1),
    bayarBlackjack: Number(data.bayarBlackjack || 2.2),
    bayarMenang: Number(data.bayarMenang || 2),
    minDouble: Math.floor(data.minDouble || 9),
    umurSesi: Math.floor(data.umurSesi || 600000),
    saldoAwal: Math.max(0, Math.floor(data.saldoAwal || 0)),
    saldoAkhir: Math.max(0, Math.floor(data.saldoAkhir || 0)),
    exp: Math.max(0, Math.floor(data.exp || 0)),
    luck: Number(Number(data.luck || 1).toFixed(2)),
    maksBayar: Math.floor(data.maksBayar || 0),
    tabel: (Array.isArray(data.tabel) ? data.tabel : []).slice(0, 8).map(t => ({
      kiri: String(t.kiri || '').slice(0, 26), kanan: String(t.kanan || '').slice(0, 40)
    })),
    riwayat: (Array.isArray(data.riwayat) ? data.riwayat : []).slice(0, 8).map(riwayatAman),
    stat: statAman(data.stat),
    warna0: '#0d2417', warna1: '#04120a'
  }
  return bungkusKartu('Blackjack RPG', brand, BLACKJACK_JS, aman, {
    w: 600, h: 640, maxw: 600,
    hint: '◀▶ panel · ▲▼ gulir · ● bagi ulang kartu · balas .hit / .stand / .double di chat saat giliranmu'
  })
}

/* ------------------------------------------------------------------ */
/*  PEMBATU                                                            */
/* ------------------------------------------------------------------ */
const RODA_ROLET_LOKAL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
]
const MERAH_ROLET_LOKAL = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

const riwayatAman = x => ({
  l: String(x?.l || '').slice(0, 22),
  b: Math.max(0, Math.floor(x?.b || 0)),
  h: Math.floor(x?.h || 0)
})
const statAman = s => ({
  main: Math.max(0, Math.floor(s?.main || 0)),
  menang: Math.max(0, Math.floor(s?.menang || 0)),
  taruhan: Math.max(0, Math.floor(s?.taruhan || 0)),
  hasil: Math.max(0, Math.floor(s?.hasil || 0)),
  terbaik: Math.max(0, Math.floor(s?.terbaik || 0))
})

/** rakit payload kartu: data → var __D + inti bersama + JS game */
function bungkusKartu (title, brand, gameJs, data, opts) {
  const js = '  var __D = ' + JSON.stringify(data) + ';\n' + KASINO_CORE + gameJs
  return shell(title, brand, js, Object.assign({ sub: 'CASINO', skin: 'neon' }, opts || {}))
}

export const CASINO_RPG = [
  { id: 'rolet', cmd: 'rolet', icon: '🎡', title: 'Rolet RPG', nama: 'Rolet RPG', html: roletHtml, ratio: '600×660', w: 600, h: 660 },
  { id: 'dadukoin', cmd: 'dadukoin', icon: '🎲', title: 'Dadu RPG', nama: 'Dadu RPG', html: daduHtml, ratio: '560×620', w: 560, h: 620 },
  { id: 'aviatorrpg', cmd: 'aviatorrpg', icon: '📈', title: 'Aviator RPG', nama: 'Aviator RPG', html: aviatorHtml, ratio: '600×600', w: 600, h: 600 },
  { id: 'keno', cmd: 'keno', icon: '🎯', title: 'Keno RPG', nama: 'Keno RPG', html: kenoHtml, ratio: '560×620', w: 560, h: 620 },
  { id: 'blackjack21', cmd: 'blackjack21', icon: '🃏', title: 'Blackjack RPG', nama: 'Blackjack RPG', html: blackjackHtml, ratio: '600×640', w: 600, h: 640 }
]

export default CASINO_RPG
