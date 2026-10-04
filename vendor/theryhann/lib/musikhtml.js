/**
 * ============================================================
 *  lib/musikhtml.js — KARTU PEMUTAR MUSIK "SPOTIFY" (v7.7)
 * ------------------------------------------------------------
 *  DIBUAT ULANG TOTAL menggantikan "Music Player" neon v7.6.
 *  Gaya: Spotify — latar gelap, aksen hijau #1DB954, disc vinyl
 *  berputar + progress hijau, dan TAB LIRIK (lirik diambil
 *  server-side via LRCLIB dan diinjeksi ke payload; kartu sendiri
 *  TETAP tanpa jaringan — aturan proyek).
 *
 *  • Audio tetap dikirim pesan WhatsApp terpisah (kirimFileLagu);
 *    kartu ini kontrol visual + lirik + antrian (MODE VISUAL).
 *  • Kontrak state (idx/pilih/gulir/mode/bar 30/dll) dipertahankan
 *    agar pola game HTML konsisten.
 *  • ES5 saja di dalam kartu + TANPA backtick/${ (aturan htmlgames).
 * ============================================================
 */
import { shell } from './htmlgames.js'

/* =================== DATA TERNORMALISASI =================== */
const potong = (s, n) => String(s == null ? '' : s).slice(0, n)
const urlAman = u => (/^https?:\/\//i.test(String(u || '')) ? String(u).slice(0, 400) : '')
const teksAman = (s, n) => potong(String(s == null ? '' : s).replace(/[\u0000-\u001f<>\\`$]/g, ''), n)

function ringkasLirik (lirik) {
  if (!lirik || typeof lirik !== 'object') return null
  const sinkron = Array.isArray(lirik.sinkron)
    ? lirik.sinkron.slice(0, 60).map(x => [Math.max(0, Number(x && x[0]) || 0), teksAman(x && x[1], 90)])
    : []
  const polos = teksAman(lirik.polos || '', 2800) || null
  if (!polos && !sinkron.length) return null
  return { polos, sinkron }
}

/* =================== JS KARTU (dijalankan di webview) =================== */
const MUSIK_JS = `\
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = 620, H = 760;
  var VIS_N = 30;
  var VIS_X = 40, VIS_Y = 386, VIS_W = W - 80, VIS_H = 16;
  var BAR_X = 40, BAR_W = W - 80, BAR_Y = 356, BAR_H = 7;
  var DCX = W / 2, DCY = 156, DR = 100, DR_L = 34;
  var TOMBOL = [
    { id: 'prev', x: W / 2 - 172, y: 440, r: 26, label: '|<<' },
    { id: 'acak', x: W / 2 - 86, y: 440, r: 26, label: 'S' },
    { id: 'play', x: W / 2, y: 440, r: 34, label: '' },
    { id: 'ulang', x: W / 2 + 86, y: 440, r: 26, label: 'R' },
    { id: 'next', x: W / 2 + 172, y: 440, r: 26, label: '>>|' },
    { id: 'suka', x: W - 40, y: 96, r: 20, label: '' }
  ];
  var TAB_Y = 486, TAB_W = 160, TAB_H = 32;
  var Q_VIS = 7, Q_ROW = 26, Q_Y = 534;

  var D = __MUSIKDATA;
  var TR = D.tracks || [];
  var idx = Math.max(0, Math.min((D.mulai || 0), Math.max(0, TR.length - 1)));
  var pilih = idx, gulir = 0, status = 'siap';
  var tab = 'antrean', lirikGulir = 0;

  var mode = 'audio', alasan = '', posisi = 0, durasi = 30;
  var acak = false, ulang = false, runT = 0, part = [];
  var suka = {}, putarCount = 0, bars = [], audio = null, tungguAudio = 0;

  for (var si = 0; si < TR.length; si++) if (TR[si].suka) suka[TR[si].id] = true;
  for (var bi = 0; bi < VIS_N; bi++) bars.push(0);

  function potong (s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '...' : s }
  function fmtS (v) {
    v = Math.max(0, Math.floor(v || 0));
    return Math.floor(v / 60) + ':' + ('0' + (v % 60)).slice(-2);
  }
  function track () { return TR[idx] || null }

  /* ---------- lirik lagu aktif ---------- */
  function barisLirik () {
    var t = track();
    if (!t || !t.lirik) return [];
    if (t.lirik.sinkron && t.lirik.sinkron.length) {
      var out = [];
      for (var i = 0; i < t.lirik.sinkron.length; i++) out.push(String(t.lirik.sinkron[i][1]));
      return out;
    }
    if (t.lirik.polos) return String(t.lirik.polos).split('\\n');
    return [];
  }
  function ledakan (x, y, w, n) {
    for (var i = 0; i < n; i++) part.push({ x: x, y: y, vx: A.rand(-3, 3), vy: A.rand(-5, 0.5), r: A.rand(1.6, 4), a: 1, w: w });
  }

  /* ---------------- audio opsional (default gagal → MODE VISUAL) ---------------- */
  function vis () {
    if (mode !== 'visual') {
      mode = 'visual';
      if (!alasan) alasan = 'Webview tanpa jaringan — suara dikirim sebagai pesan audio WhatsApp';
      A.SFX.crash();
    }
  }
  function siapkanAudio () {
    if (audio || typeof Audio !== 'function') {
      if (typeof Audio !== 'function') { alasan = 'Suara dikirim sebagai pesan audio WhatsApp'; vis(); }
      return;
    }
    try {
      audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('error', function () { alasan = 'Audio tidak bisa dimuat di kartu — pakai pesan audio WhatsApp'; vis(); });
      audio.addEventListener('playing', function () { mode = 'audio'; alasan = ''; tungguAudio = 0; });
      audio.addEventListener('ended', function () { selesaiTrack(); });
    } catch (e) { alasan = 'Audio diblokir webview'; audio = null; vis(); }
  }

  function muat (i, otomatis) {
    if (!TR.length) return;
    idx = ((i % TR.length) + TR.length) % TR.length;
    pilih = idx;
    lirikGulir = 0;
    posisi = 0;
    var t = track();
    durasi = 30;
    siapkanAudio();
    if (audio) {
      try {
        audio.pause();
        audio.src = t && t.preview ? t.preview : '';
        audio.load();
        tungguAudio = 420;
        if (otomatis !== false) {
          var p = audio.play();
          if (p && p.catch) p.catch(function () { alasan = 'Autoplay ditolak — ketuk ●'; vis(); });
          status = 'main';
        } else status = 'siap';
      } catch (e) { alasan = 'Gagal memutar'; vis(); status = 'siap' }
    } else {
      status = otomatis === false ? 'siap' : 'main';
      if (mode === 'audio') { alasan = 'Audio tidak tersedia'; vis(); }
    }
    if (otomatis !== false) { putarCount++; A.saveBest(putarCount); ledakan(DCX, DCY, '#1db954', 10) }
    samakanGulir();
    A.setBest();
    hud();
  }

  function selesaiTrack () {
    if (ulang && !acak) { posisi = 0; if (audio) { try { audio.currentTime = 0; audio.play() } catch (e) {} } return }
    if (acak && TR.length > 1) {
      var n = idx;
      while (n === idx) n = Math.floor(Math.random() * TR.length);
      muat(n);
      return;
    }
    if (idx + 1 >= TR.length) {
      status = 'habis'; posisi = 0;
      A.SFX.level();
      hud();
      return;
    }
    muat(idx + 1);
  }

  function playPause () {
    if (!TR.length) return;
    A.initAudio();
    if (tab === 'antrean' && pilih !== idx) { muat(pilih); return }
    if (status === 'main') {
      status = 'jeda';
      if (audio) { try { audio.pause() } catch (e) {} }
      A.SFX.point();
    } else {
      if (status === 'habis') { posisi = 0; idx = 0; muat(0); return }
      status = 'main';
      alasan = '';
      if (audio) {
        siapkanAudio();
        tungguAudio = 420;
        try {
          var p = audio.play();
          if (p && p.catch) p.catch(function () { alasan = 'Autoplay ditolak webview'; vis(); });
        } catch (e) { vis() }
      } else if (mode === 'audio') vis();
      A.SFX.jump();
    }
    idle = 0;
    hud();
  }

  function geser (d) {
    if (!TR.length) return;
    if (tab === 'lirik') {
      var n = barisLirik().length;
      lirikGulir = Math.max(0, Math.min(Math.max(0, n - 9), lirikGulir + d));
      A.SFX.point(); idle = 0;
      return;
    }
    pilih = ((pilih + d) % TR.length + TR.length) % TR.length;
    samakanGulir();
    A.SFX.point();
    idle = 0;
  }
  function samakanGulir () {
    if (pilih < gulir) gulir = pilih;
    else if (pilih >= gulir + Q_VIS) gulir = pilih - Q_VIS + 1;
    gulir = Math.max(0, Math.min(Math.max(0, TR.length - Q_VIS), gulir));
  }
  function toggleTab (ke) {
    tab = ke || (tab === 'antrean' ? 'lirik' : 'antrean');
    A.SFX.point(); idle = 0;
  }
  function toggleAcak () { acak = !acak; A.SFX.point(); idle = 0; hud() }
  function toggleUlang () { ulang = !ulang; A.SFX.point(); idle = 0; hud() }
  function toggleSuka () {
    var t = track(); if (!t) return;
    suka[t.id] = !suka[t.id];
    A.SFX.level();
    ledakan(TOMBOL[5].x, TOMBOL[5].y, suka[t.id] ? '#1db954' : '#8f8f8f', 14);
    idle = 0;
  }
  function seek (frac) {
    posisi = Math.max(0, Math.min(1, frac)) * durasi;
    if (audio) { try { audio.currentTime = posisi } catch (e) {} }
    A.SFX.point(); idle = 0;
  }

  var idle = 0, IDLE_VISUAL = 1800;
  function hud () {
    A.setScore(Math.floor(posisi));
    A.setStatus('Track ' + (TR.length ? idx + 1 : 0) + '/' + TR.length, (mode === 'audio' ? 'AUDIO ' : 'VISUAL ') + (status === 'main' ? '▶' : status === 'jeda' ? '❚❚' : '■'));
    A.setHint('◀▶ lagu · ▲▼ ' + (tab === 'lirik' ? 'gulir lirik' : 'pilih') + ' · ● putar/jeda · 🔊 suara = pesan audio WhatsApp');
  }

  function update (dt) {
    runT += dt;
    if (!TR.length) {
      A.state = { kosong: true, over: false, sebab: 'Antrian kosong', idx: -1, jumlahTrack: 0, mode: mode, status: status, posisi: 0, durasi: 0, idle: 0, tab: tab, barisLirik: 0, adaLirik: false };
      requestAnimationFrame(loop);
      return;
    }
    if (mode === 'audio' && audio) {
      if (typeof audio.currentTime === 'number' && isFinite(audio.currentTime)) posisi = audio.currentTime;
      if (audio.duration && isFinite(audio.duration) && audio.duration > 1) durasi = audio.duration;
      if (tungguAudio > 0) { tungguAudio -= dt; if (tungguAudio <= 0 && status === 'main') { alasan = 'Audio tidak merespons'; vis() } }
    } else if (status === 'main') {
      posisi += dt / 60;
      if (posisi >= durasi) { posisi = durasi; selesaiTrack() }
    }
    if (status === 'habis') posisi = 0;
    idle += dt;
    if (mode === 'visual' && idle > IDLE_VISUAL && status === 'main') {
      status = 'jeda'; alasan = 'Dijeda (mode visual tanpa sentuhan 30 detik)';
      if (audio) { try { audio.pause() } catch (e) {} }
    }

    /* visualiser 30 bar */
    for (var j = 0; j < VIS_N; j++) {
      var target;
      if (status !== 'main') target = 0.03;
      else {
        var f = 0.5 + 0.5 * Math.sin(runT * 0.09 + j * 0.55) * Math.cos(runT * 0.031 + j * 0.21);
        target = 0.12 + f * (0.55 + 0.35 * Math.sin(j * 1.7 + runT * 0.02));
      }
      bars[j] += (target - bars[j]) * 0.22;
    }
    for (var p = part.length - 1; p >= 0; p--) {
      var q = part[p];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 0.16 * dt; q.a -= 0.016 * dt;
      if (q.a <= 0) part.splice(p, 1);
    }

    var L = barisLirik();
    A.setProgress(durasi > 0 ? posisi / durasi : 0);
    A.setScore(Math.floor(posisi));
    A.state = {
      idx: idx, pilih: pilih, gulir: gulir, jumlahTrack: TR.length,
      judul: track() ? track().judul : '', artis: track() ? track().artis : '',
      album: track() ? track().album : '', sumber: track() ? track().sumber : '',
      status: status, mode: mode, alasan: alasan,
      posisi: Number(posisi.toFixed(2)), durasi: Number(durasi.toFixed(2)),
      acak: acak, ulang: ulang, suka: !!suka[track() ? track().id : ''],
      jumlahSuka: Object.keys(suka).filter(function (k) { return suka[k] }).length,
      putarCount: putarCount, partikel: part.length, idle: Math.round(idle),
      bar: bars.map(function (b) { return Number(b.toFixed(3)) }),
      tab: tab, lirikGulir: lirikGulir, barisLirik: L.length, adaLirik: L.length > 0,
      over: false, sebab: '', kosong: false
    };
    requestAnimationFrame(loop);
  }

  /* ---------------- gambar (SPOTIFY STYLE) ---------------- */
  function bulat (x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function lingk (x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function teks (s, x, y, ukuran, warna, gaya, rata) {
    ctx.fillStyle = warna;
    ctx.font = (gaya || '700') + ' ' + ukuran + 'px "Segoe UI", sans-serif';
    ctx.textAlign = rata || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
  }
  function lebar (s, ukuran, gaya) {
    ctx.font = (gaya || '700') + ' ' + ukuran + 'px "Segoe UI", sans-serif';
    var m = ctx.measureText(String(s));
    return m && m.width ? m.width : 0;
  }

  /* disc vinyl berputar dengan label hijau Spotify */
  function gambarDisc () {
    var t = track();
    /* bayangan piringan */
    lingk(DCX, DCY + 6, DR + 3); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
    /* vinyl hitam + alur */
    lingk(DCX, DCY, DR); ctx.fillStyle = '#0a0a0a'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    for (var i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(DCX, DCY, DR - 10 - i * 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (i % 2 ? 0.05 : 0.09) + ')';
      ctx.lineWidth = 1.4; ctx.stroke();
    }
    /* kilau berputar (masa jeda diam) */
    var rot = posisi * 2.4;
    ctx.save();
    ctx.translate(DCX, DCY);
    ctx.rotate(rot);
    var kil = ctx.createLinearGradient(-DR, -DR, DR, DR);
    kil.addColorStop(0, 'rgba(255,255,255,0.0)');
    kil.addColorStop(0.45, 'rgba(255,255,255,0.10)');
    kil.addColorStop(0.55, 'rgba(255,255,255,0.02)');
    kil.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = kil;
    ctx.beginPath(); ctx.arc(0, 0, DR - 4, -0.7, 0.35); ctx.arc(0, 0, DR_L, 0.35, -0.7, true); ctx.closePath();
    ctx.fill();
    ctx.restore();
    /* label hijau + inisial JUDUL */
    lingk(DCX, DCY, DR_L); ctx.fillStyle = '#1db954'; ctx.fill();
    ctx.strokeStyle = '#17a34a'; ctx.lineWidth = 3; ctx.stroke();
    var inisial = ((t ? t.judul : '?').trim().charAt(0) || '?').toUpperCase();
    teks(inisial, DCX, DCY + 8, 26, '#0d1f12', '900', 'center');
    /* lubang piringan */
    lingk(DCX, DCY, 7); ctx.fillStyle = '#121212'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    /* cincin status: berdenyut saat main */
    if (status === 'main') {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(runT * 0.12);
      lingk(DCX, DCY, DR + 6 + 2 * Math.sin(runT * 0.12));
      ctx.strokeStyle = '#1db954'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function draw () {
    ctx.clearRect(0, 0, W, H);
    /* latar Spotify: #121212 → hijau pudar di atas */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1e2e24'); bg.addColorStop(0.28, '#17211a'); bg.addColorStop(0.6, '#121212'); bg.addColorStop(1, '#0b0d0b');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* header */
    teks('🎧 SPOTIFY PLAYER · LIRIK', 24, 30, 16, '#1db954', '900');
    teks(potong('Pencarian: ' + (D.query || '-'), 52), 24, 50, 12, '#b3b3b3', '600');
    teks(mode === 'audio' ? '● AUDIO' : '● VISUAL', W - 64, 84, 12, mode === 'audio' ? '#1db954' : '#ffb703', '900', 'right');
    teks(TR.length + ' lagu · ' + (D.totalPutar || 0) + '× putar', W - 64, 102, 11, '#8a8a8a', '600', 'right');

    if (!TR.length) {
      teks('ANTRIAN KOSONG', W / 2, H / 2 - 10, 28, '#1db954', '900', 'center');
      teks('Cari lagu: .play2 <judul>', W / 2, H / 2 + 22, 15, '#fff', '700', 'center');
      return;
    }

    gambarDisc();

    /* judul (marquee bila panjang) + artis + chips */
    var t = track();
    var judul = t ? t.judul : '-';
    var jx = W / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(20, 0, W - 40, H); ctx.clip();
    if (lebar(judul, 22, '900') > W - 60) {
      var off = (runT * 1.2) % (lebar(judul, 22, '900') + 60);
      teks(judul + '      ' + judul, 30 - off, 290, 22, '#ffffff', '900');
    } else teks(potong(judul, 34), jx, 290, 22, '#ffffff', '900', 'center');
    ctx.restore();
    teks(potong(t ? t.artis : '-', 44), W / 2, 314, 14.5, '#b3b3b3', '600', 'center');
    var chip = (t && t.album ? potong(t.album, 22) : 'single') + '  ·  ' + (t ? t.sumber : '-') + (t && t.explicit ? ' 🅴' : '') + '  ·  preview ' + fmtS(durasi);
    teks(chip, W / 2, 336, 11.5, '#8a8a8a', '600', 'center');

    /* progress hijau Spotify */
    ctx.fillStyle = '#3a3a3a'; bulat(BAR_X, BAR_Y, BAR_W, BAR_H, 4); ctx.fill();
    var frac = durasi > 0 ? Math.max(0, Math.min(1, posisi / durasi)) : 0;
    ctx.fillStyle = '#1db954'; bulat(BAR_X, BAR_Y, Math.max(6, BAR_W * frac), BAR_H, 4); ctx.fill();
    ctx.fillStyle = '#fff'; lingk(BAR_X + BAR_W * frac, BAR_Y + BAR_H / 2, 7); ctx.fill();
    teks(fmtS(posisi), BAR_X, BAR_Y + 24, 11, '#b3b3b3', '700');
    teks('-' + fmtS(durasi - posisi), BAR_X + BAR_W, BAR_Y + 24, 11, '#b3b3b3', '700', 'right');

    /* visualiser mini (30 bar) di bawah progress */
    var bw = VIS_W / VIS_N;
    for (var vi = 0; vi < VIS_N; vi++) {
      var hgt = Math.max(2, bars[vi] * VIS_H);
      ctx.fillStyle = vi % 4 === 0 ? '#1ed760' : 'rgba(29,185,84,0.55)';
      ctx.fillRect(VIS_X + vi * bw + 1, VIS_Y + VIS_H - hgt, bw - 2, hgt);
    }

    /* tombol transport */
    for (var k = 0; k < TOMBOL.length; k++) {
      var b = TOMBOL[k];
      var isSuka = b.id === 'suka';
      var aktif = (b.id === 'acak' && acak) || (b.id === 'ulang' && ulang) || (isSuka && suka[t ? t.id : '']);
      lingk(b.x, b.y, b.r);
      if (b.id === 'play') ctx.fillStyle = '#1db954';
      else if (isSuka) ctx.fillStyle = aktif ? '#1db954' : '#2a2a2a';
      else ctx.fillStyle = aktif ? '#2f4034' : '#212121';
      ctx.fill();
      ctx.strokeStyle = aktif && !isSuka ? '#1ed760' : (b.id === 'play' ? '#17a34a' : '#3a3a3a');
      ctx.lineWidth = (aktif && !isSuka) ? 3 : 1.5; ctx.stroke();
      ctx.font = (b.id === 'play' ? 24 : 14) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = b.id === 'play' ? '#0d1f12' : (aktif && !isSuka ? '#1ed760' : '#e8e8e8');
      var lbl = b.id === 'play' ? (status === 'main' ? '||' : '▶')
        : b.id === 'acak' ? '⇄'
        : b.id === 'ulang' ? '↻' + (ulang ? '¹' : '')
        : isSuka ? (suka[t ? t.id : ''] ? '♥' : '♡')
        : b.label;
      ctx.fillText(lbl, b.x, b.y + 1);
      ctx.textBaseline = 'alphabetic';
    }
    /* label status kecil */
    var stLabel = status === 'main' ? 'SEDANG DIPUTAR' : status === 'jeda' ? 'DIJEDA' : status === 'habis' ? 'ANTRIAN HABIS' : 'SIAP';
    teks(stLabel, TOMBOL[1].x - 38, TOMBOL[1].y + 30, 10, status === 'main' ? '#1ed760' : '#8a8a8a', '800', 'right');

    /* tab: ANTREAN | LIRIK */
    var tx1 = W / 2 - TAB_W - 12, tx2 = W / 2 + 12;
    var nbL = barisLirik().length;
    function gambarTab (x, label, aktif) {
      ctx.fillStyle = aktif ? '#1db954' : '#242424';
      bulat(x, TAB_Y, TAB_W, TAB_H, 16); ctx.fill();
      ctx.strokeStyle = aktif ? '#1ed760' : '#3a3a3a'; ctx.lineWidth = 1.5; ctx.stroke();
      teks(label, x + TAB_W / 2, TAB_Y + 21, 13, aktif ? '#0d1f12' : '#b3b3b3', '900', 'center');
    }
    gambarTab(tx1, 'ANTRIAN (' + TR.length + ')', tab === 'antrean');
    gambarTab(tx2, 'LIRIK' + (nbL ? ' (' + nbL + ')' : ''), tab === 'lirik');

    /* ---------------- isi tab ---------------- */
    if (tab === 'antrean') {
      ctx.save();
      ctx.beginPath(); ctx.rect(16, Q_Y - 4, W - 32, Q_VIS * Q_ROW + 8); ctx.clip();
      for (var r = 0; r < Q_VIS; r++) {
        var n = gulir + r;
        if (n >= TR.length) break;
        var y = Q_Y + r * Q_ROW;
        var item = TR[n];
        var sedang = n === idx, dipilih = n === pilih;
        ctx.fillStyle = sedang ? '#1f3d29' : (dipilih ? '#1d2a21' : '#181818');
        bulat(20, y, W - 40, Q_ROW - 4, 8); ctx.fill();
        if (dipilih || sedang) { ctx.strokeStyle = sedang ? '#1db954' : '#3d5c47'; ctx.lineWidth = sedang ? 2.5 : 1.2; ctx.stroke() }
        teks(sedang && status === 'main' ? '▶' : String(n + 1), 30, y + 17, 11.5, sedang ? '#1ed760' : '#8a8a8a', '800');
        teks(potong(item.judul, 32), 54, y + 17, 13, sedang ? '#fff' : '#d9d9d9', sedang ? '800' : '600');
        var punyaLirik = item.lirik && (item.lirik.polos || (item.lirik.sinkron || []).length);
        teks(potong(item.artis + ' · ' + fmtS(item.durasi), 22), W - 92, y + 17, 10.5, '#8a8a8a', '600');
        if (punyaLirik) teks('🎤', W - 56, y + 17, 10.5, '#1ed760', '700', 'center');
        if (suka[item.id]) teks('♥', W - 34, y + 17, 11, '#1db954', '700', 'center');
      }
      ctx.restore();
      if (TR.length > Q_VIS) {
        var sh = (Q_VIS * Q_ROW) / TR.length;
        ctx.fillStyle = '#3d5c47';
        ctx.fillRect(W - 14, Q_Y + (gulir / TR.length) * Q_VIS * Q_ROW, 4, Math.max(8, sh));
      }
    } else {
      /* ---- tab LIRIK ---- */
      var L = barisLirik();
      var LH = 21, LV = 9;
      ctx.fillStyle = '#101410'; bulat(16, Q_Y - 4, W - 32, LV * LH + 10, 12); ctx.fill();
      ctx.strokeStyle = '#223126'; ctx.lineWidth = 1.5; ctx.stroke();
      if (!L.length) {
        teks('🎤 Lirik tidak tersedia', W / 2, Q_Y + 48, 15, '#8a8a8a', '800', 'center');
        teks('Kartu menunggu lirik dari server (LRCLIB).', W / 2, Q_Y + 72, 11.5, '#6a6a6a', '600', 'center');
        teks('Ambil/kirim lirik: .liriklagu ' + (idx + 1), W / 2, Q_Y + 92, 11.5, '#1ed760', '700', 'center');
      } else {
        ctx.save();
        ctx.beginPath(); ctx.rect(18, Q_Y - 2, W - 36, LV * LH + 6); ctx.clip();
        var maks = Math.max(0, L.length - LV);
        lirikGulir = Math.max(0, Math.min(maks, lirikGulir));
        for (var li = 0; li < LV; li++) {
          var nn = lirikGulir + li;
          if (nn >= L.length) break;
          var ly = Q_Y + 14 + li * LH;
          teks(potong(L[nn], 46), W / 2 - 4, ly, 13.5, '#e8e8e8', nn === lirikGulir ? '800' : '600', 'center');
        }
        ctx.restore();
        if (L.length > LV) {
          var persen = lirikGulir / Math.max(1, L.length - LV);
          ctx.fillStyle = '#1db954';
          ctx.fillRect(W - 20, Q_Y + persen * (LV * LH - 26), 4, 26);
        }
        teks(potong((t ? t.judul : '') + ' — ' + (t ? t.artis : ''), 44) + ' · sumber: lrclib', W / 2, Q_Y + LV * LH + 18, 10.5, '#6a6a6a', '600', 'center');
      }
    }

    /* catatan bawah */
    if (mode === 'visual') {
      ctx.fillStyle = 'rgba(29,185,84,0.10)';
      bulat(16, H - 34, W - 32, 26, 8); ctx.fill();
      teks('🔊 ' + potong(alasan || 'suara ada di pesan audio WhatsApp', 52), W / 2, H - 28, 11, '#1ed760', '700', 'center');
      teks('kontrol: .nextlagu  .prevlagu  .putarlagu 3  .ulanglagu  .liriklagu  .unduhlagu ' + (idx + 1), W / 2, H - 12, 10.5, '#8a8a8a', '600', 'center');
    } else {
      teks('❤ suka di kartu ini sementara — simpan permanen: .heartlagu ' + (idx + 1), W / 2, H - 16, 11, '#8a8a8a', '600', 'center');
    }

    part.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, q.a); ctx.fillStyle = q.w;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  var last = 0;
  function loop (tt) {
    if (!last) last = tt;
    var dt = Math.min(3, Math.max(0.1, (tt - last) / 16.67));
    last = tt;
    update(dt);
    draw();
  }

  function tombolDi (px, py) {
    for (var i = 0; i < TOMBOL.length; i++) {
      var b = TOMBOL[i];
      var dx = px - b.x, dy = py - b.y;
      if (dx * dx + dy * dy <= (b.r + 8) * (b.r + 8)) return b.id;
    }
    return null;
  }
  function tabDi (px, py) {
    if (py < TAB_Y - 4 || py > TAB_Y + TAB_H + 4) return null;
    var x1 = W / 2 - TAB_W - 12, x2 = W / 2 + 12;
    if (px >= x1 && px <= x1 + TAB_W) return 'antrean';
    if (px >= x2 && px <= x2 + TAB_W) return 'lirik';
    return null;
  }

  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Tab'].indexOf(k) >= 0) e.preventDefault();
    idle = 0;
    if (k === 'ArrowLeft' || k === 'KeyA') { if (TR.length) muat(idx - 1) }
    else if (k === 'ArrowRight' || k === 'KeyD') { if (TR.length) muat(idx + 1) }
    else if (k === 'ArrowUp' || k === 'KeyW') geser(-1);
    else if (k === 'ArrowDown' || k === 'KeyS') geser(1);
    else if (k === 'Space' || k === 'Enter') playPause();
    else if (k === 'Tab' || k === 'KeyY') toggleTab();
    else if (k === 'KeyR') toggleUlang();
    else if (k === 'KeyM') toggleAcak();
  });

  function sentuh (e) {
    A.initAudio(); idle = 0;
    var px = null, py = null;
    try {
      var t0 = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
      var r0 = c.getBoundingClientRect();
      px = (t0.clientX - r0.left) * (W / r0.width); py = (t0.clientY - r0.top) * (H / r0.height);
    } catch (err) { px = null }
    if (px === null) { playPause(); return }
    var tb = tabDi(px, py);
    if (tb) { toggleTab(tb); return }
    var id = tombolDi(px, py);
    if (id === 'play') { playPause(); return }
    if (id === 'prev') { if (TR.length) muat(idx - 1) ; return }
    if (id === 'next') { if (TR.length) muat(idx + 1) ; return }
    if (id === 'acak') { toggleAcak(); return }
    if (id === 'ulang') { toggleUlang(); return }
    if (id === 'suka') { toggleSuka(); return }
    if (px >= DCX - DR && px <= DCX + DR && py >= DCY - DR && py <= DCY + DR) { playPause(); return }
    if (py >= BAR_Y - 14 && py <= BAR_Y + BAR_H + 14 && px >= BAR_X && px <= BAR_X + BAR_W) { seek((px - BAR_X) / BAR_W); return }
    if (py >= Q_Y && py < Q_Y + Q_VIS * Q_ROW) {
      if (tab === 'antrean') {
        var n = gulir + Math.floor((py - Q_Y) / Q_ROW);
        if (n >= 0 && n < TR.length) { pilih = n; samakanGulir(); muat(n) }
      } else {
        var arah = py < Q_Y + Q_VIS * Q_ROW / 2 ? -1 : 1;
        geser(arah);
      }
      return;
    }
    playPause();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault() }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e) });

  muat(idx, false);
  hud();
  A.debug = { D: D, TR: TR, mode: function () { return mode }, tombolDi: tombolDi, tabDi: tabDi, fmtS: fmtS, muat: muat, seek: seek, toggleTab: toggleTab, barisLirik: barisLirik };
  requestAnimationFrame(loop);
`

/* =================== PEMBANGUN KARTU =================== */

/**
 * Bangun HTML player Spotify + lirik.
 * @param {string} brand nama bot
 * @param {object} data  { query, totalPutar, mulai, tracks:[{id,judul,artis,album,durasi,cover,coverKecil,preview,sumber,explicit,suka,lirik?}] }
 */
export function playerHtml (brand = 'THERYHANN!', data = {}) {
  const tracks = (Array.isArray(data.tracks) ? data.tracks : []).slice(0, 12).map(t => ({
    id: potong(String(t.id || ''), 60),
    judul: teksAman(t.judul, 60) || 'Tanpa Judul',
    artis: teksAman(t.artis, 45) || 'Artis',
    album: teksAman(t.album, 45),
    durasi: Math.max(0, Math.floor(Number(t.durasi ?? t.durasiAsli) || 0)),
    /* payload ringan: cover besar tidak dipakai kartu — cukup coverKecil */
    cover: urlAman(t.coverKecil || t.cover),
    coverKecil: urlAman(t.coverKecil),
    preview: urlAman(t.preview),
    sumber: teksAman(t.sumber, 14) || 'Deezer',
    explicit: !!t.explicit,
    suka: !!t.suka,
    lirik: ringkasLirik(t.lirik)
  }))
  const payload = {
    query: teksAman(data.query, 60),
    totalPutar: Math.max(0, Math.floor(Number(data.totalPutar) || 0)),
    mulai: Math.max(0, Math.min(Math.floor(Number(data.mulai) || 0), Math.max(0, tracks.length - 1))),
    tracks
  }
  const js = 'var __MUSIKDATA = ' + JSON.stringify(payload) + ';\n' + MUSIK_JS
  return shell('Spotify Player', brand, js, {
    w: 620, h: 760, maxw: 560, sub: 'SPOTIFY',
    hint: 'ketuk tab ANTREAN/LIRIK · ketuk tombol di kartu · kontrol lengkap: .nextlagu .prevlagu .putarlagu N',
    pad: ''
  })
}

/** ringkasan teks (balasan pendamping & fallback) */
export function playerTeks (d) {
  const t = (d.tracks || [])[d.mulai] || {}
  const n = (d.tracks || []).length
  const adaLirik = (d.tracks || []).filter(x => x.lirik && (x.lirik.polos || (x.lirik.sinkron || []).length)).length
  const B = '═'.repeat(18)
  return [
    `${B}`,
    `🎧 *${t.judul || 'Musik Player'}*`,
    `👤 ${t.artis || '-'} · 💿 ${t.album || '-'}`,
    `⏱ ${t.durasi ? Math.floor(t.durasi / 60) + ':' + ('0' + (t.durasi % 60)).slice(-2) : '0:30'} · ${t.sumber || 'Deezer'}${t.explicit ? ' · 🅴' : ''}${t.suka ? ' · ❤' : ''}`,
    `📜 Antrian ${d.mulai + 1}/${n}` + (adaLirik ? ` · 🎤 lirik ${adaLirik}/${n}` : ''),
    `${B}`,
    `⏭ *.nextlagu* · ⏮ *.prevlagu* · 🔁 *.ulanglagu*`,
    `🔀 *.acaklagu* · ▶ *.putarlagu ${d.mulai + 1}* · 🎤 *.liriklagu*`,
    `⬇️ *.unduhlagu ${d.mulai + 1}* · ❤ *.heartlagu ${d.mulai + 1}* · 📜 *.antrianlagu*`,
    `${B}`
  ].join('\n')
}

export default { playerHtml, playerTeks }
