/**
 * 🃏 UNO HTML — 1 PEMAIN + 3 AI (v7.37.0)
 * ------------------------------------------------------------------
 *  SATU FILE MANDIRI, bisa dipasang langsung lewat .>_ karena punya
 *  `command:` sendiri — tidak butuh file tambahan apa pun.
 *
 *  Kenapa lawannya AI? Kartu HTML di dalam chat TIDAK bisa mengirim pesan
 *  balik ke bot (hanya setor skor via .setorskore), jadi kartu HTML tidak
 *  mungkin jadi multiplayer antar nomor. Untuk multiplayer sungguhan antar
 *  member grup, tetap pakai .uno versi chat (features/uno.js).
 *
 *  Isi:
 *   • 108 kartu UNO asli: 4 warna × (0 + dua set 1-9 + Skip/Reverse/+2)
 *     + 4 Wild + 4 Wild Draw Four
 *   • 3 lawan AI yang benar-benar berpikir (bobot kartu, simpan Wild)
 *   • Skip · Reverse · Draw Two · Wild · Wild Draw Four · hukuman menumpuk
 *   • tombol UNO! — lupa tekan saat sisa 1 kartu = denda 2 kartu
 *   • kartu diklik, atau D-pad: ◀▶ pilih kartu · ● buang · ▲ ambil
 *   • efek suara WebAudio — tanpa berkas luar, tanpa CDN
 *
 *  Perintah: .unohtml
 */
import { config } from '../config.js'
import { sendHtmlApp } from '../lib/htmlapp.js'

const P = config.display.prefix
const brand = () => config.bot?.name || 'THERYHANN!'

/* ==================================================================
 *  CSS + MARKUP — ditulis tangan, TANPA lib/htmlgames.js supaya file ini
 *  benar-benar mandiri dan tidak bisa rusak karena shell berubah.
 *  Aturan kartu HTML bot: tanpa position:fixed, tanpa 100vh,
 *  tanpa aspect-ratio, tanpa CDN.
 * ================================================================== */

const CSS_UNO = `
.uno-wrap{position:relative;width:100%;max-width:430px;margin:0 auto;
  background:linear-gradient(160deg,#123a1f,#0a2415 60%,#071a0f);
  border-radius:18px;overflow:hidden;font-family:"Segoe UI",system-ui,sans-serif;
  color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.uno-top{display:flex;align-items:center;justify-content:space-between;
  padding:10px 12px;background:rgba(0,0,0,.32)}
.uno-logo{font-weight:900;font-size:19px;letter-spacing:.5px;
  background:linear-gradient(90deg,#ff2d55,#ffd60a,#30d158,#0a84ff);
  -webkit-background-clip:text;background-clip:text;color:transparent}
.uno-brand{font-size:10px;opacity:.6;font-weight:700}
.uno-stat{display:flex;gap:6px}
.uno-chip{background:rgba(255,255,255,.1);border-radius:9px;padding:3px 8px;
  font-size:10px;font-weight:800;text-align:center;line-height:1.25}
.uno-chip small{display:block;opacity:.6;font-size:8px;font-weight:700}
.uno-ai{display:flex;justify-content:space-around;padding:8px 6px 2px}
.uno-ai-p{flex:1;text-align:center;padding:5px 2px;border-radius:10px;
  transition:background .2s,box-shadow .2s}
.uno-ai-p.aktif{background:rgba(255,214,10,.16);box-shadow:0 0 0 2px #ffd60a inset}
.uno-ai-n{font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uno-ai-c{display:inline-block;margin-top:3px;min-width:26px;padding:2px 6px;border-radius:8px;
  background:rgba(255,255,255,.13);font-size:11px;font-weight:900}
.uno-ai-p.uno1 .uno-ai-c{background:#ffd60a;color:#20160a}
.uno-meja{display:flex;align-items:center;justify-content:center;gap:14px;padding:12px 10px}
.uno-tumpuk{width:58px;height:84px;border-radius:9px;cursor:pointer;position:relative;
  background:repeating-linear-gradient(45deg,#1b1b1b 0 6px,#2a2a2a 6px 12px);
  border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:900;text-align:center;line-height:1.1}
.uno-tumpuk:active{transform:scale(.94)}
.uno-atas{width:58px;height:84px;border-radius:9px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;font-weight:900;box-shadow:0 4px 14px rgba(0,0,0,.45);
  border:3px solid #fff;transition:transform .18s}
.uno-atas.baru{transform:scale(1.09) rotate(-3deg)}
.uno-atas-n{font-size:26px;line-height:1}
.uno-atas-t{font-size:8px;margin-top:4px;opacity:.85;text-align:center;padding:0 3px}
.uno-info{flex:1;min-width:0}
.uno-warna{display:inline-block;padding:4px 9px;border-radius:9px;font-size:11px;font-weight:900}
.uno-gil{font-size:11px;margin-top:6px;opacity:.85;font-weight:700}
.uno-hukum{font-size:11px;margin-top:4px;color:#ff9f0a;font-weight:900}
.uno-log{font-size:10px;margin-top:6px;opacity:.7;min-height:26px;line-height:1.35}
.uno-tangan{display:flex;gap:5px;padding:8px 8px 4px;overflow-x:auto;min-height:96px;
  scrollbar-width:thin}
.uno-kartu{flex:0 0 auto;width:52px;height:76px;border-radius:8px;cursor:pointer;position:relative;
  display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;
  border:2px solid rgba(255,255,255,.85);box-shadow:0 3px 8px rgba(0,0,0,.4);
  transition:transform .14s,box-shadow .14s,opacity .14s}
.uno-kartu:hover{transform:translateY(-5px)}
.uno-kartu.pilih{transform:translateY(-12px);box-shadow:0 0 0 3px #ffd60a,0 6px 14px rgba(0,0,0,.5)}
.uno-kartumati{opacity:.42;filter:grayscale(.55);cursor:not-allowed}
.uno-kartu.mati:hover{transform:none}
.uno-kartu-n{font-size:22px;line-height:1}
.uno-kartu-t{font-size:7px;margin-top:3px;opacity:.9;text-align:center;padding:0 2px}
.uno-kartu-i{position:absolute;top:2px;left:4px;font-size:8px;opacity:.55;font-weight:800}
.uno-bar{display:flex;gap:6px;padding:8px}
.uno-btn{flex:1;padding:10px 6px;border:0;border-radius:11px;font-weight:900;font-size:12px;
  cursor:pointer;color:#fff;background:rgba(255,255,255,.14);transition:transform .12s,opacity .2s}
.uno-btn:active{transform:scale(.95)}
.uno-btn[disabled]{opacity:.35;cursor:not-allowed}
.uno-btn.utama{background:linear-gradient(180deg,#ffd60a,#e0a800);color:#20160a}
.uno-btn.uno1{background:linear-gradient(180deg,#ff453a,#c1121f);color:#fff;
  animation:denyut 1s infinite}
@keyframes denyut{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.uno-pilih-warna{position:absolute;inset:0;background:rgba(4,12,7,.93);display:none;
  flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:5;padding:16px}
.uno-pilih-warna.tampil{display:flex}
.uno-pw-j{font-weight:900;font-size:15px;margin-bottom:4px}
.uno-pw-g{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:250px}
.uno-pw-b{padding:16px 8px;border:0;border-radius:13px;font-weight:900;font-size:13px;cursor:pointer;color:#fff}
.uno-selesai{position:absolute;inset:0;background:rgba(4,12,7,.94);display:none;
  flex-direction:column;align-items:center;justify-content:center;gap:8px;z-index:6;padding:18px;text-align:center}
.uno-selesai.tampil{display:flex}
.uno-selesai h3{margin:0;font-size:26px;font-weight:900}
.uno-selesai p{margin:0;font-size:12px;opacity:.8;line-height:1.5}
.uno-pad{display:flex;gap:6px;padding:0 8px 10px}
.uno-pad .uno-btn{flex:0 0 52px}
.uno-pad .uno-btn.lebar{flex:1}
`

function markupUno (judul, merk) {
  return '' +
    '<div class="uno-wrap" id="unoWrap">' +
      '<div class="uno-top">' +
        '<div><div class="uno-logo">🃏 ' + judul + '</div>' +
        '<div class="uno-brand">' + merk + ' · 1 kamu + 3 AI</div></div>' +
        '<div class="uno-stat">' +
          '<div class="uno-chip"><small>SKOR</small><span id="uSkor">0</span></div>' +
          '<div class="uno-chip"><small>BEST</small><span id="uBest">0</span></div>' +
          '<div class="uno-chip"><small>SISA</small><span id="uSisa">108</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="uno-ai" id="uAi"></div>' +
      '<div class="uno-meja">' +
        '<div class="uno-tumpuk" id="uTumpuk">TUMPUKAN<br><span id="uJumlah">0</span></div>' +
        '<div class="uno-atas" id="uAtas"><div class="uno-atas-n" id="uAtasN">?</div>' +
          '<div class="uno-atas-t" id="uAtasT"></div></div>' +
        '<div class="uno-info">' +
          '<div class="uno-warna" id="uWarna">—</div>' +
          '<div class="uno-gil" id="uGil">—</div>' +
          '<div class="uno-hukum" id="uHukum"></div>' +
          '<div class="uno-log" id="uLog"></div>' +
          '<div id="uBisa" style="display:none"></div>' +
          '<div id="uRiwayat" style="display:none"></div>' +
        '</div>' +
      '</div>' +
      '<div class="uno-tangan" id="uTangan"></div>' +
      '<div class="uno-bar">' +
        '<button class="uno-btn" id="bAmbil">📥 AMBIL</button>' +
        '<button class="uno-btn utama" id="bMain">▶ BUANG KARTU</button>' +
        '<button class="uno-btn" id="bUno">🃏 UNO!</button>' +
      '</div>' +
      '<div class="uno-pad">' +
        '<button class="uno-btn" id="bKiri">◀</button>' +
        '<button class="uno-btn" id="bKanan">▶</button>' +
        '<button class="uno-btn lebar" id="bOk">● BUANG YANG DIPILIH</button>' +
      '</div>' +
      '<div class="uno-pilih-warna" id="uPw">' +
        '<div class="uno-pw-j" id="uPwJ">Pilih warna</div>' +
        '<div class="uno-pw-g">' +
          '<button class="uno-pw-b" data-w="merah" style="background:#ff2d55">🟥 MERAH</button>' +
          '<button class="uno-pw-b" data-w="kuning" style="background:#e0a800">🟨 KUNING</button>' +
          '<button class="uno-pw-b" data-w="hijau" style="background:#30d158;color:#06240f">🟩 HIJAU</button>' +
          '<button class="uno-pw-b" data-w="biru" style="background:#0a84ff">🟦 BIRU</button>' +
        '</div>' +
      '</div>' +
      '<div class="uno-selesai" id="uSelesai">' +
        '<h3 id="uSJ">—</h3><p id="uSP"></p>' +
        '<button class="uno-btn utama" id="bLagi" style="max-width:200px">🔄 MAIN LAGI</button>' +
      '</div>' +
    '</div>' +
    '<script>' + JS_UNO + '</script>'
}

/* ==================================================================
 *  JS GAME — sengaja tanpa backtick dan tanpa ${ } supaya aman
 * ================================================================== */
const JS_UNO = `
(function () {
  'use strict';
  var WARNA = ['merah', 'kuning', 'hijau', 'biru'];
  var HEX = { merah: '#ff2d55', kuning: '#ffd60a', hijau: '#30d158', biru: '#0a84ff', hitam: '#1c1c1e' };
  var TEKS = { merah: '#fff', kuning: '#20160a', hijau: '#06240f', biru: '#fff', hitam: '#fff' };
  var EMOJI = { merah: '🟥', kuning: '🟨', hijau: '🟩', biru: '🟦' };
  var NAMA_AI = ['Rina', 'Bagas', 'Sinta'];
  var SIMBOL = { skip: '⛔', reverse: '🔄', draw2: '+2', wild: '🌈', wild4: '+4' };
  var LABEL = { skip: 'SKIP', reverse: 'REVERSE', draw2: 'DRAW TWO', wild: 'WILD', wild4: 'WILD +4' };

  /* ---------------- audio (WebAudio, tanpa berkas luar) ---------------- */
  var ac = null;
  function audio () {
    if (ac) return ac;
    try { var AC = window.AudioContext || window.webkitAudioContext; ac = AC ? new AC() : null; }
    catch (e) { ac = null; }
    return ac;
  }
  function bip (f0, f1, dur, vol, gelombang) {
    var g = audio(); if (!g) return;
    try {
      if (g.state === 'suspended') g.resume();
      var t = g.currentTime, o = g.createOscillator(), n = g.createGain();
      o.type = gelombang || 'triangle';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      n.gain.setValueAtTime(0.0001, t);
      n.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
      n.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(n); n.connect(g.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function sfxBuang () { bip(620, 320, 0.13, 0.13); }
  function sfxAmbil () { bip(240, 150, 0.16, 0.11, 'sine'); }
  function sfxAksi () { bip(880, 1320, 0.18, 0.12, 'square'); }
  function sfxUno () { bip(660, 990, 0.22, 0.15, 'square'); }
  function sfxMenang () { bip(520, 1040, 0.5, 0.16, 'square'); }
  function sfxKalah () { bip(300, 90, 0.55, 0.14, 'sawtooth'); }

  /* ---------------- dek & aturan ---------------- */
  function buatDek () {
    var d = [], id = 0, i, w, a;
    for (w = 0; w < 4; w++) {
      d.push({ id: id++, warna: WARNA[w], nilai: '0', aksi: null });
      for (i = 1; i <= 9; i++) {
        d.push({ id: id++, warna: WARNA[w], nilai: String(i), aksi: null });
        d.push({ id: id++, warna: WARNA[w], nilai: String(i), aksi: null });
      }
      var aksi = ['skip', 'reverse', 'draw2'];
      for (a = 0; a < aksi.length; a++) {
        d.push({ id: id++, warna: WARNA[w], nilai: aksi[a], aksi: aksi[a] });
        d.push({ id: id++, warna: WARNA[w], nilai: aksi[a], aksi: aksi[a] });
      }
    }
    for (i = 0; i < 4; i++) d.push({ id: id++, warna: 'hitam', nilai: 'wild', aksi: 'wild' });
    for (i = 0; i < 4; i++) d.push({ id: id++, warna: 'hitam', nilai: 'wild4', aksi: 'wild4' });
    return d;
  }
  function kocok (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function boleh (kartu, atas, warnaAktif) {
    if (!kartu || !atas) return false;
    /* selama hukuman menumpuk, HANYA Draw Two / Wild+4 yang boleh dibuang
       (menumpuk lagi). Tanpa aturan ini hukuman bisa menggantung selamanya
       karena pemain memilih membuang kartu biasa dan tidak pernah menagih. */
    if (S && S.hukuman > 0) return kartu.aksi === 'draw2' || kartu.aksi === 'wild4';
    if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') return true;
    if (kartu.warna === warnaAktif) return true;
    return kartu.nilai === atas.nilai;
  }
  function bisaMain (tangan, atas, warnaAktif) {
    var out = [], i;
    for (i = 0; i < tangan.length; i++) if (boleh(tangan[i], atas, warnaAktif)) out.push(tangan[i]);
    return out;
  }

  /* ---------------- keadaan ---------------- */
  var S = null;
  var pilihIdx = 0;
  var kunci = false;          // true saat bukan giliran manusia / sedang animasi
  var pendingWild = null;     // kartu Wild manusia yang menunggu pilihan warna

  function baru () {
    var dek = kocok(buatDek());
    var tangan = [[], [], [], []];
    var i, j;
    for (i = 0; i < 7; i++) for (j = 0; j < 4; j++) tangan[j].push(dek.pop());
    var awal = dek.pop();
    while (awal.aksi === 'wild' || awal.aksi === 'wild4') { dek.unshift(awal); kocok(dek); awal = dek.pop(); }
    S = {
      tumpukan: dek, buangan: [awal], tangan: tangan,
      warnaAktif: awal.warna, arah: 1, idx: 0, hukuman: 0,
      nama: ['Kamu', NAMA_AI[0], NAMA_AI[1], NAMA_AI[2]],
      unoDibilang: [false, false, false, false],
      selesai: false, pemenang: -1, skor: 0, log: []
    };
    pilihIdx = 0; kunci = false; pendingWild = null;
    /* kalau pembuka berupa kartu aksi, terapkan ke pemain pertama */
    if (awal.aksi === 'skip') { catat('⛔ Kartu pembuka Skip — Kamu dilewati.'); S.idx = 1; }
    else if (awal.aksi === 'reverse') { S.arah = -1; catat('🔄 Kartu pembuka Reverse — arah dibalik, jalan dari Sinta.'); S.idx = 3; }
    else if (awal.aksi === 'draw2') { S.hukuman = 2; catat('➕2 Kartu pembuka Draw Two — Kamu menanggung 2 kartu.'); S.idx = 0; S.tungguAmbil = true; }
    /* kalau kartu pembuka menggeser giliran ke AI, kunci tombol manusia
       supaya tidak menyala saat bukan gilirannya (kalau tidak, permainan
       berhenti menunggu pemain yang tidak pernah dapat giliran). */
    kunci = S.idx !== 0;
    gambar();
    if (S.idx !== 0) setTimeout(giliranAI, 900);
  }
  function catat (t) {
    S.log.unshift(t);
    if (S.log.length > 3) S.log.pop();
    /* riwayat penuh disimpan terpisah — log tampil hanya 3 baris terakhir,
       tapi kejadian penting (UNO!, denda) tetap bisa diperiksa */
    S.riwayat = S.riwayat || [];
    S.riwayat.push(t);
    if (S.riwayat.length > 60) S.riwayat.shift();
  }
  function atas () { return S.buangan[S.buangan.length - 1]; }

  function ambil (jumlah) {
    var out = [], i;
    for (i = 0; i < jumlah; i++) {
      if (S.tumpukan.length === 0) {
        if (S.buangan.length <= 1) break;
        var puncak = S.buangan.pop();
        S.tumpukan = kocok(S.buangan);
        S.buangan = [puncak];
        catat('🔁 Tumpukan habis — buangan diacak ulang.');
      }
      var k = S.tumpukan.pop();
      if (k) out.push(k);
    }
    return out;
  }
  function berikut (idx, arah, lompat) {
    var n = 4;
    return ((idx + arah * (1 + (lompat || 0))) % n + n * 2) % n;
  }

  /* ---------------- mainkan kartu ---------------- */
  function mainkan (p, kartuId, pilihWarna) {
    var tangan = S.tangan[p], i, ketemu = -1;
    for (i = 0; i < tangan.length; i++) if (tangan[i].id === kartuId) { ketemu = i; break; }
    if (ketemu < 0) return false;
    var kartu = tangan[ketemu];
    if (!boleh(kartu, atas(), S.warnaAktif)) return false;
    if ((kartu.aksi === 'wild' || kartu.aksi === 'wild4') && WARNA.indexOf(pilihWarna) < 0) return false;

    tangan.splice(ketemu, 1);
    S.buangan.push(kartu);
    if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') S.warnaAktif = pilihWarna;
    else S.warnaAktif = kartu.warna;
    S.unoDibilang[p] = false;

    var lompat = 0, sebut = S.nama[p];
    if (kartu.aksi === 'skip') { lompat = 1; catat('⛔ ' + sebut + ' melewatkan giliran berikutnya.'); sfxAksi(); }
    else if (kartu.aksi === 'reverse') {
      S.arah = -S.arah; lompat = 1;
      catat('🔄 ' + sebut + ' membalik arah (dengan 4 pemain ini sekaligus Skip).');
      sfxAksi();
    } else if (kartu.aksi === 'draw2') {
      S.hukuman += 2; lompat = 1;
      catat('➕2 ' + sebut + ' — hukuman jadi ' + S.hukuman + ' kartu.');
      sfxAksi();
    } else if (kartu.aksi === 'wild4') {
      S.hukuman += 4; lompat = 1;
      catat('🌈➕4 ' + sebut + ' memilih ' + pilihWarna + ' — hukuman ' + S.hukuman + ' kartu.');
      sfxAksi();
    } else if (kartu.aksi === 'wild') {
      catat('🌈 ' + sebut + ' memilih warna ' + pilihWarna + '.');
      sfxAksi();
    } else { sfxBuang(); catat(sebut + ' membuang ' + EMOJI[kartu.warna] + ' ' + kartu.nilai + '.'); }

    /* UNO! */
    if (tangan.length === 1) {
      if (p === 0) {
        if (S.unoDitekan) {
          catat('🃏 Kamu bilang UNO!');
          sfxUno();
        } else {
          var denda = ambil(2);
          S.tangan[0] = S.tangan[0].concat(denda);
          catat('⚠️ Kamu lupa tekan UNO! — denda ' + denda.length + ' kartu.');
          S.skor = Math.max(0, S.skor - 40);
        }
        S.unoDitekan = false;
      } else {
        /* AI "lupa" bilang UNO 1 dari 5 kali, supaya bisa dihukum */
        if (Math.random() < 0.8) { catat('🃏 ' + sebut + ' bilang UNO!'); sfxUno(); }
        else {
          var d = ambil(2);
          S.tangan[p] = S.tangan[p].concat(d);
          catat('😅 ' + sebut + ' lupa bilang UNO — denda ' + d.length + ' kartu.');
        }
      }
    } else if (tangan.length === 0) {
      S.selesai = true; S.pemenang = p;
      hitungSkor(p);
    }

    S.idx = berikut(S.idx, S.arah, lompat);
    kunci = true;            // giliran berpindah: tunggu AI
    gambar();
    return true;
  }

  function hitungSkor (p) {
    /* skor ala UNO asli: sisa kartu lawan dihitung */
    var total = 0, i, j;
    for (i = 0; i < 4; i++) {
      if (i === p) continue;
      for (j = 0; j < S.tangan[i].length; j++) {
        var k = S.tangan[i][j];
        if (k.aksi === 'wild4') total += 50;
        else if (k.aksi === 'wild') total += 50;
        else if (k.aksi) total += 20;
        else total += parseInt(k.nilai, 10) || 0;
      }
    }
    S.skor = total;
    simpanBest(total);
  }

  /* ---------------- AI ---------------- */
  function bobot (k, jumlahTangan) {
    if (k.aksi === 'wild4') return jumlahTangan <= 3 ? 100 : 30;   // simpan +4 kalau masih banyak kartu
    if (k.aksi === 'wild') return jumlahTangan <= 2 ? 95 : 35;
    if (k.aksi === 'draw2') return 80;
    if (k.aksi === 'skip' || k.aksi === 'reverse') return 70;
    return parseInt(k.nilai, 10) || 0;                              // buang angka besar duluan
  }
  function warnaTerbaik (tangan) {
    var hitung = { merah: 0, kuning: 0, hijau: 0, biru: 0 }, i;
    for (i = 0; i < tangan.length; i++) if (hitung[tangan[i].warna] != null) hitung[tangan[i].warna]++;
    var terbaik = 'merah', maks = -1;
    for (i = 0; i < WARNA.length; i++) {
      if (hitung[WARNA[i]] > maks) { maks = hitung[WARNA[i]]; terbaik = WARNA[i]; }
    }
    return terbaik;
  }
  function giliranAI () {
    if (!S || S.selesai) return;
    var p = S.idx;
    if (p === 0) { kunci = false; gambar(); return; }   // giliran manusia: buka kunci
    kunci = true; gambar();
    setTimeout(function () {
      if (!S || S.selesai) return;
      var opsi = bisaMain(S.tangan[p], atas(), S.warnaAktif);
      if (opsi.length) {
        opsi.sort(function (a, b) { return bobot(b, S.tangan[p].length) - bobot(a, S.tangan[p].length); });
        var pilih = opsi[0];
        var w = (pilih.aksi === 'wild' || pilih.aksi === 'wild4') ? warnaTerbaik(S.tangan[p]) : pilih.warna;
        mainkan(p, pilih.id, w);
      } else {
        /* tidak bisa main: tanggung hukuman, ambil 1 kalau tidak ada hukuman */
        var beban = S.hukuman > 0 ? S.hukuman : 1;
        var dapat = ambil(beban);
        S.tangan[p] = S.tangan[p].concat(dapat);
        if (S.hukuman > 0) { catat('📥 ' + S.nama[p] + ' menanggung ' + dapat.length + ' kartu hukuman.'); S.hukuman = 0; }
        else catat('📥 ' + S.nama[p] + ' tidak bisa main — ambil ' + dapat.length + ' kartu.');
        sfxAmbil();
        S.idx = berikut(S.idx, S.arah, 0);
        gambar();
      }
      if (!S.selesai) {
        if (S.idx === 0) { kunci = false; gambar(); }   // giliran kembali ke manusia
        else setTimeout(giliranAI, 760);
      } else kunci = false;
    }, 620);
  }

  /* ---------------- aksi manusia ---------------- */
  /* Giliran manusia. Variabel "kunci" wajib diperiksa: saat Skip/Reverse/
     Draw Two melewati pemain, S.idx bisa tetap 0 padahal giliran sudah
     berpindah. Tanpa "kunci", pemain masih bisa main dan permainan jadi
     tidak konsisten. */
  function giliranKamu () { return !kunci && !S.selesai && S.idx === 0; }
  /* saat hukuman menumpuk, tombol BUANG dimatikan: pemain harus AMBIL */
  function wajibAmbil () { return S && S.hukuman > 0; }
  /* setelah AI bermain, kunci giliran manusia sampai timer AI berikutnya
     benar-benar mengembalikan giliran ke pemain. */
  function kunciSampaiAI () { kunci = true; }

  function tekanAmbil () {
    if (!giliranKamu()) return;
    /* kalau ada hukuman, wajib menanggungnya */
    var beban = S.hukuman > 0 ? S.hukuman : 1;
    var dapat = ambil(beban);
    S.tangan[0] = S.tangan[0].concat(dapat);
    if (S.hukuman > 0) { catat('📥 Kamu menanggung ' + dapat.length + ' kartu hukuman.'); S.hukuman = 0; }
    else catat('📥 Kamu ambil ' + dapat.length + ' kartu.');
    sfxAmbil();
    S.unoDitekan = false;
    /* Setelah mengambil kartu, giliran SELALU lewat. Syarat lama
       ("boleh ambil lagi kalau dapat kartu yang cocok") membuat pemain
       terjebak mengambil berulang kali saat menanggung hukuman, sehingga
       hukuman menumpuk tanpa batas dan permainan tidak pernah selesai. */
    var baruBisa = bisaMain(dapat, atas(), S.warnaAktif);
    if (baruBisa.length) catat('💡 Kamu dapat kartu yang cocok — simpan untuk giliran berikutnya.');
    S.idx = berikut(S.idx, S.arah, 0);
    gambar();
    setTimeout(giliranAI, 700);
  }

  function tekanMain () {
    if (!giliranKamu()) return;
    if (wajibAmbil()) {
      catat('💥 Kamu harus menanggung ' + S.hukuman + ' kartu hukuman dulu — tekan AMBIL.');
      bip(180, 120, 0.12, 0.1);
      gambar();
      return;
    }
    var tangan = S.tangan[0];
    if (!tangan.length) return;
    if (pilihIdx >= tangan.length) pilihIdx = 0;
    var kartu = tangan[pilihIdx];
    if (!boleh(kartu, atas(), S.warnaAktif)) {
      catat('❌ Kartu itu tidak cocok. Pilih yang menyala.');
      bip(180, 120, 0.12, 0.1);
      gambar();
      return;
    }
    if (kartu.aksi === 'wild' || kartu.aksi === 'wild4') {
      pendingWild = kartu;
      document.getElementById('uPwJ').textContent =
        kartu.aksi === 'wild4' ? 'Wild +4 — pilih warna' : 'Wild — pilih warna';
      document.getElementById('uPw').classList.add('tampil');
      return;
    }
    mainkan(0, kartu.id, kartu.warna);
    if (!S.selesai) { kunci = true; setTimeout(giliranAI, 760); }
  }

  function pilihWarnaManusia (w) {
    document.getElementById('uPw').classList.remove('tampil');
    if (!pendingWild) return;
    var k = pendingWild; pendingWild = null;
    mainkan(0, k.id, w);
    if (!S.selesai) { kunci = true; setTimeout(giliranAI, 760); }
  }

  function tekanUno () {
    if (S.tangan[0].length === 1) { S.unoDitekan = true; catat('🃏 UNO! siap.'); sfxUno(); }
    else if (S.tangan[0].length === 2) { catat('💡 Tekan UNO! tepat setelah kartu ke-2 dibuang.'); }
    else { catat('UNO! ditekan saat sisa 1 kartu.'); }
    /* gambar() wajib dipanggil di SEMUA cabang — kalau tidak, catatan baru
       tidak pernah muncul di layar (hanya cabang pertama yang memanggilnya). */
    gambar();
  }

  /* ---------------- skor tersimpan ---------------- */
  function muatBest () {
    try { return parseInt(localStorage.getItem('uno_best') || '0', 10) || 0; } catch (e) { return 0; }
  }
  function simpanBest (n) {
    try { if (n > muatBest()) localStorage.setItem('uno_best', String(n)); } catch (e) {}
  }

  /* ---------------- gambar ---------------- */
  function el (id) { return document.getElementById(id); }
  function kartuHTML (k, idx, mati) {
    var warna = k.aksi === 'wild' || k.aksi === 'wild4' ? 'hitam' : k.warna;
    var isi = k.aksi ? (SIMBOL[k.aksi] || '?') : k.nilai;
    var bawah = k.aksi ? LABEL[k.aksi] : (EMOJI[k.warna] + ' ' + k.nilai);
    return '<div class="uno-kartu' + (mati ? ' mati' : '') + (idx === pilihIdx ? ' pilih' : '') + '"' +
      ' data-i="' + idx + '"' +
      ' style="background:' + (warna === 'hitam'
        ? 'linear-gradient(135deg,#2b2b2e,#0f0f11)'
        : 'linear-gradient(160deg,' + HEX[warna] + ',' + HEX[warna] + ')') + ';' +
      'color:' + TEKS[warna] + '">' +
      '<div class="uno-kartu-i">' + (idx + 1) + '</div>' +
      '<div class="uno-kartu-n">' + isi + '</div>' +
      '<div class="uno-kartu-t">' + bawah + '</div>' +
    '</div>';
  }
  function gambar () {
    if (!S) return;
    var i, h = '';
    /* AI */
    var ai = el('uAi');
    ai.innerHTML = '';
    for (i = 1; i < 4; i++) {
      var d = document.createElement('div');
      d.className = 'uno-ai-p' + (S.idx === i && !S.selesai ? ' aktif' : '') + (S.tangan[i].length === 1 ? ' uno1' : '');
      d.innerHTML = '<div class="uno-ai-n">' + S.nama[i] + '</div>' +
        '<div class="uno-ai-c">' + S.tangan[i].length + '</div>';
      ai.appendChild(d);
    }
    /* kartu atas */
    var a = atas();
    var warnaAtas = (a.aksi === 'wild' || a.aksi === 'wild4') ? S.warnaAktif : a.warna;
    var ea = el('uAtas');
    ea.style.background = 'linear-gradient(160deg,' + HEX[warnaAtas] + ',' + HEX[warnaAtas] + ')';
    ea.style.color = TEKS[warnaAtas];
    el('uAtasN').textContent = a.aksi ? (SIMBOL[a.aksi] || '?') : a.nilai;
    el('uAtasT').textContent = a.aksi ? LABEL[a.aksi] : (EMOJI[a.warna] + ' ' + a.nilai);
    /* tumpukan */
    el('uJumlah').textContent = String(S.tumpukan.length);
    el('uSisa').textContent = String(S.tumpukan.length);
    /* warna aktif */
    var uw = el('uWarna');
    uw.textContent = EMOJI[S.warnaAktif] + ' ' + S.warnaAktif.toUpperCase();
    uw.style.background = HEX[S.warnaAktif];
    uw.style.color = TEKS[S.warnaAktif];
    /* giliran & hukuman */
    el('uGil').textContent = S.selesai ? 'Permainan selesai'
      : (S.idx === 0 ? '🎯 Giliran KAMU' : '⏳ Giliran ' + S.nama[S.idx] + '…');
    el('uHukum').textContent = S.hukuman > 0 ? '💥 Hukuman menumpuk: ' + S.hukuman + ' kartu' : '';
    el('uLog').innerHTML = S.log.join('<br>');
    /* riwayat lengkap diekspos (tersembunyi) supaya bisa diaudit/diuji */
    el('uRiwayat').textContent = (S.riwayat || []).join(' | ');
    /* tangan */
    var tangan = S.tangan[0];
    if (pilihIdx >= tangan.length) pilihIdx = Math.max(0, tangan.length - 1);
    var bisa = bisaMain(tangan, atas(), S.warnaAktif);
    var idxBisa = [];
    for (i = 0; i < tangan.length; i++) if (boleh(tangan[i], atas(), S.warnaAktif)) idxBisa.push(i);
    /* indeks kartu yang bisa dimainkan diekspos (tersembunyi) supaya test &
       fitur bantu tidak perlu menebak dari nama kelas CSS */
    el('uBisa').textContent = idxBisa.join(',');
    var th = '';
    for (i = 0; i < tangan.length; i++) {
      var mati = !boleh(tangan[i], atas(), S.warnaAktif);
      th += kartuHTML(tangan[i], i, mati);
    }
    el('uTangan').innerHTML = th || '<div style="opacity:.5;font-size:11px;padding:20px">Tidak ada kartu</div>';
    /* tombol */
    var bolehAksi = giliranKamu();
    var paksa = bolehAksi && wajibAmbil();
    el('bMain').disabled = !bolehAksi || paksa;
    el('bAmbil').disabled = !bolehAksi;
    el('bOk').disabled = !bolehAksi || paksa;
    el('bAmbil').textContent = paksa ? '📥 TANGGUNG ' + S.hukuman : '📥 AMBIL';
    if (!paksa) el('bAmbil').textContent = '📥 AMBIL';
    var bu = el('bUno');
    bu.disabled = tangan.length !== 1;
    if (tangan.length === 1) bu.classList.add('uno1'); else bu.classList.remove('uno1');
    /* skor */
    el('uSkor').textContent = String(S.skor);
    el('uBest').textContent = String(muatBest());
    /* selesai */
    if (S.selesai) {
      var menang = S.pemenang === 0;
      el('uSJ').textContent = menang ? '🏆 KAMU MENANG!' : '😵 ' + S.nama[S.pemenang] + ' MENANG';
      el('uSJ').style.color = menang ? '#ffd60a' : '#ff453a';
      el('uSP').innerHTML = menang
        ? 'Skor kamu <b>' + S.skor + '</b> dari sisa kartu lawan.<br>Best: ' + muatBest()
        : 'Sisa kartumu: ' + S.tangan[0].length + '.<br>Coba lagi — tekan MAIN LAGI.';
      el('uSelesai').classList.add('tampil');
      if (menang) sfxMenang(); else sfxKalah();
    } else {
      el('uSelesai').classList.remove('tampil');
    }
    void bisa;
  }

  /* ---------------- input ---------------- */
  function geserPilih (d) {
    var n = S.tangan[0].length;
    if (!n) return;
    pilihIdx = (pilihIdx + d + n) % n;
    gambar();
    bip(500, 500, 0.04, 0.06, 'sine');
  }
  function ikat () {
    el('uTangan').addEventListener('click', function (e) {
      var t = e.target;
      while (t && !t.getAttribute('data-i')) t = t.parentElement;
      if (!t) return;
      var i = parseInt(t.getAttribute('data-i'), 10);
      if (isNaN(i)) return;
      audio();
      /* Klik pertama memilih, klik kedua membuang — TAPI kalau kartu itu
         memang bisa dimainkan, langsung buang saja. Aturan lama membuat
         pemain harus klik dua kali untuk kartu yang sudah jelas sah. */
      var kartu = S.tangan[0][i];
      if (kartu && boleh(kartu, atas(), S.warnaAktif) && giliranKamu() && !wajibAmbil()) {
        pilihIdx = i;
        tekanMain();
      } else if (i === pilihIdx) {
        tekanMain();
      } else {
        pilihIdx = i; gambar(); bip(500, 500, 0.04, 0.06, 'sine');
      }
    });
    el('uTumpuk').addEventListener('click', function () { audio(); tekanAmbil(); });
    el('bAmbil').addEventListener('click', function () { audio(); tekanAmbil(); });
    el('bMain').addEventListener('click', function () { audio(); tekanMain(); });
    el('bOk').addEventListener('click', function () { audio(); tekanMain(); });
    el('bUno').addEventListener('click', function () { audio(); tekanUno(); });
    el('bKiri').addEventListener('click', function () { geserPilih(-1); });
    el('bKanan').addEventListener('click', function () { geserPilih(1); });
    el('bLagi').addEventListener('click', function () { audio(); baru(); });
    var tombol = document.querySelectorAll('.uno-pw-b');
    for (var i = 0; i < tombol.length; i++) {
      /* jangan pakai "this" di dalam handler: di beberapa webview ketat
         "this" tidak terikat ke tombol sehingga warna tidak pernah
         terpilih. Ambil elemen lewat closure + argumen event. */
      (function (elTombol) {
        elTombol.addEventListener('click', function (e) {
          var w = (e && e.currentTarget && e.currentTarget.getAttribute)
            ? e.currentTarget.getAttribute('data-w')
            : elTombol.getAttribute('data-w');
          if (w) pilihWarnaManusia(w);
        });
      })(tombol[i]);
    }
    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') { geserPilih(-1); e.preventDefault(); }
      else if (k === 'ArrowRight') { geserPilih(1); e.preventDefault(); }
      else if (k === 'ArrowUp') { audio(); tekanAmbil(); e.preventDefault(); }
      else if (k === ' ' || k === 'Enter') { audio(); tekanMain(); e.preventDefault(); }
      else if (k === 'u' || k === 'U') { tekanUno(); }
      else if (k >= '1' && k <= '9') {
        var n = parseInt(k, 10) - 1;
        if (n < S.tangan[0].length) { pilihIdx = n; gambar(); }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ikat(); baru(); });
  } else { ikat(); baru(); }
})();
`

/* ================================================================== */
/*  PLUGIN                                                            */
/* ================================================================== */

export function unoHtml (merk = 'THERYHANN!') {
  return '<style>' + CSS_UNO + '</style>' + markupUno('UNO', merk)
}

export const unoHtmlGame = {
  /* 'unoplay' TIDAK dipakai: sudah milik .unomain di UNO chat — merebutnya
     membuat loader memindahkan alias (dipindah != 0). */
  command: ['unohtml', 'unocardhtml', 'unogamehtml', 'unokartuhtml', 'mainunohtml', 'unoai', 'unosolohtml'],
  category: 'Games',
  description: '🃏 UNO versi kartu HTML: 1 kamu vs 3 AI — Skip, Reverse, Draw Two, Wild, Wild +4, hukuman menumpuk, tombol UNO! (.uno = multiplayer antar member grup)',
  limit: 0,
  cooldown: 3,
  run: async m => {
    const html = unoHtml(brand())
    const kb = Number((await import('../lib/database.js')).getSettings?.().playKartuKb || 430) * 1024
    try {
      if (Buffer.byteLength(html) > kb) throw new Error('payload terlalu besar')
      await sendHtmlApp(m.sock, m.jid, { title: 'UNO — 1 vs 3 AI', html })
    } catch (e) {
      await m.reply(
        `⚠️ Gagal memuat *UNO HTML*.\n` +
        'Kemungkinan WhatsApp kamu belum mendukung richResponse HTML ' +
        '(butuh WA Android/iOS terbaru atau WA Web).\n' +
        `Error: ${String(e?.message || e).slice(0, 120)}\n\n` +
        `Alternatif multiplayer antar member grup: ${P}uno @teman`
      )
    }
    return { handled: true }
  }
}

export default { unoHtmlGame, unoHtml }
