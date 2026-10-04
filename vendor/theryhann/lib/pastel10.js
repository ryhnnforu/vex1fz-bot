/**
 * 🔤 SUSUN KATA — puzzle huruf (HTML app, skin pastel v7.6)
 * ------------------------------------------------------------
 *  Sebuah kata diacak jadi keping huruf. Susun kembali sesuai petunjuk.
 *  ◀ ▶ pilih keping · ● ambil keping · ▲ hapus huruf terakhir ·
 *  ▼ lewati kata (-1 nyawa). Jawaban penuh otomatis diperiksa.
 *  3 nyawa · waktu per kata makin singkat tiap level · kombo = pengali.
 */
import { shell } from './htmlgames.js'

const WORD_JS = `
  var A = window.__ARC, c = A.c, ctx = A.ctx;
  var W = c.width, H = c.height;
  var NYAWA = 3;

  /* [kata, petunjuk] — kosakata Indonesia umum */
  var KAMUS = [
    ['PELANGI', 'Lengkungan warna di langit setelah hujan'],
    ['KUCING', 'Hewan berbulu yang suka ikan dan tidur'],
    ['SEKOLAH', 'Tempat belajar pagi sampai siang'],
    ['BUNGA', 'Bagian tanaman yang harum dan berwarna'],
    ['MATAHARI', 'Bintang yang menerangi siang hari'],
    ['PENSIL', 'Alat tulis yang bisa diraut'],
    ['JENDELA', 'Lubang berkaca di dinding untuk melihat keluar'],
    ['SEPATU', 'Dipakai di kaki sebelum keluar rumah'],
    ['NASI', 'Makanan pokok orang Indonesia'],
    ['HUJAN', 'Air yang turun dari awan'],
    ['GAJAH', 'Hewan besar berbelalai'],
    ['BUKU', 'Kumpulan halaman berisi tulisan'],
    ['PISANG', 'Buah kuning yang disukai monyet'],
    ['AWAN', 'Gumpalan putih di langit'],
    ['MEJA', 'Tempat menaruh barang saat duduk'],
    ['LAMPION', 'Lampu hias kertas yang digantung saat perayaan'],
    ['KERTAS', 'Bahan untuk menulis dan mencetak'],
    ['LEBAH', 'Serangga penghasil madu'],
    ['RODA', 'Bagian kendaraan yang berputar'],
    ['SUSU', 'Minuman putih dari sapi'],
    ['PAYUNG', 'Dipakai saat hujan agar tidak basah'],
    ['BANTAL', 'Alas kepala saat tidur'],
    ['SISIR', 'Alat merapikan rambut'],
    ['GELAS', 'Wadah minum dari kaca'],
    ['POHON', 'Tanaman besar berkayu'],
    ['IKAN', 'Hewan yang hidup di air'],
    ['TOPI', 'Penutup kepala dari kain'],
    ['SAPU', 'Alat membersihkan lantai'],
    ['KURSI', 'Tempat duduk bersandar'],
    ['CERMIN', 'Kaca untuk melihat wajah sendiri'],
    ['GUNUNG', 'Permukaan bumi yang menjulang tinggi'],
    ['SUNGAI', 'Aliran air panjang menuju laut'],
    ['BULAN', 'Benda langit yang tampak di malam hari'],
    ['BINTANG', 'Kelap-kelip di langit malam'],
    ['KUE', 'Camilan manis untuk ulang tahun'],
    ['SIRUP', 'Minuman manis berwarna'],
    ['GARPU', 'Alat makan bergigi'],
    ['SELIMUT', 'Kain penutup badan saat tidur'],
    ['KUNCI', 'Pembuka gembok atau pintu'],
    ['TEROMPET', 'Alat musik tiup yang suaranya nyaring'],
    ['APEL', 'Buah renyah berwarna merah atau hijau'],
    ['JERUK', 'Buah oranye yang rasanya asam manis'],
    ['MANGGA', 'Buah manis berwarna kuning saat matang'],
    ['DURIAN', 'Buah berkulit duri dan beraroma tajam'],
    ['SEMANGKA', 'Buah besar berkulit hijau berdaging merah'],
    ['AYAM', 'Unggas yang berkokok di pagi hari'],
    ['BEBEK', 'Unggas yang pandai berenang'],
    ['KAMBING', 'Hewan ternak yang makan rumput dan mengembik'],
    ['SAPI', 'Hewan ternak penghasil susu'],
    ['KUDA', 'Hewan tunggangan yang berlari cepat'],
    ['HARIMAU', 'Kucing besar bergaris penghuni hutan'],
    ['MONYET', 'Primata yang pandai memanjat pohon'],
    ['ULAR', 'Hewan melata tanpa kaki'],
    ['BURUNG', 'Hewan bersayap yang bisa terbang'],
    ['SEMUT', 'Serangga kecil yang berjalan berbaris'],
    ['NYAMUK', 'Serangga yang menggigit dan berdengung'],
    ['LAUT', 'Hamparan air asin yang sangat luas'],
    ['PANTAI', 'Tepian laut yang berpasir'],
    ['PASIR', 'Butiran halus di pantai dan gurun'],
    ['OMBAK', 'Air laut yang bergulung ke pantai'],
    ['ANGIN', 'Udara yang bergerak'],
    ['PETIR', 'Cahaya menyambar disertai bunyi menggelegar'],
    ['GUNTUR', 'Bunyi menggelegar setelah kilat'],
    ['SALJU', 'Butiran es putih di negara dingin'],
    ['API', 'Nyala panas untuk memasak'],
    ['RUMAH', 'Tempat tinggal sebuah keluarga'],
    ['PINTU', 'Jalan masuk ke dalam ruangan'],
    ['ATAP', 'Bagian atas rumah yang menahan hujan'],
    ['TANGGA', 'Tempat melangkah naik ke lantai atas'],
    ['DAPUR', 'Ruangan untuk memasak'],
    ['KAMAR', 'Ruangan untuk tidur'],
    ['HALAMAN', 'Area terbuka di depan rumah'],
    ['PAGAR', 'Pembatas di sekeliling rumah'],
    ['SUMUR', 'Sumber air di dalam tanah'],
    ['SAWAH', 'Lahan tempat menanam padi'],
    ['PETANI', 'Orang yang menggarap sawah'],
    ['GURU', 'Orang yang mengajar di sekolah'],
    ['DOKTER', 'Orang yang mengobati pasien'],
    ['PERAWAT', 'Pendamping dokter merawat pasien'],
    ['POLISI', 'Aparat penjaga keamanan'],
    ['PILOT', 'Orang yang menerbangkan pesawat'],
    ['NAHKODA', 'Pemimpin sebuah kapal laut'],
    ['PASAR', 'Tempat orang berjual beli'],
    ['UANG', 'Alat pembayaran yang sah'],
    ['WARUNG', 'Kedai kecil tempat membeli makanan'],
    ['ROTI', 'Makanan dari tepung yang dipanggang'],
    ['TELUR', 'Bahan makanan bulat dari ayam'],
    ['KEJU', 'Makanan olahan dari susu'],
    ['GULA', 'Perasa manis dalam minuman'],
    ['GARAM', 'Perasa asin dalam masakan'],
    ['CABAI', 'Bahan makanan yang membuat rasa pedas'],
    ['WORTEL', 'Sayuran oranye yang baik untuk mata'],
    ['BAYAM', 'Sayuran hijau yang kaya zat besi'],
    ['TEMPE', 'Makanan fermentasi kedelai khas Indonesia'],
    ['SATE', 'Daging tusuk yang dibakar'],
    ['BAKSO', 'Bola daging berkuah'],
    ['KOPI', 'Minuman hitam dari biji yang diseduh'],
    ['TEH', 'Minuman dari daun yang diseduh air panas'],
    ['SEPEDA', 'Kendaraan roda dua yang dikayuh'],
    ['MOBIL', 'Kendaraan roda empat bermesin'],
    ['KERETA', 'Kendaraan panjang yang berjalan di rel'],
    ['PESAWAT', 'Kendaraan yang terbang di udara'],
    ['KAPAL', 'Kendaraan yang berlayar di laut'],
    ['HELM', 'Pelindung kepala saat berkendara'],
    ['ARLOJI', 'Jam yang dipakai di pergelangan tangan'],
    ['CANGKIR', 'Wadah minum bertangkai'],
    ['PIRING', 'Alat makan berbentuk datar bundar'],
    ['SENDOK', 'Alat makan berbentuk cekung'],
    ['PANCI', 'Wadah untuk merebus air atau sup'],
    ['WAJAN', 'Alat masak untuk menggoreng'],
    ['KOMPOR', 'Alat untuk menyalakan api memasak'],
    ['KULKAS', 'Alat pendingin penyimpan makanan'],
    ['RADIO', 'Alat penerima siaran suara'],
    ['KAMERA', 'Alat untuk mengambil gambar'],
    ['GITAR', 'Alat musik petik berdawai enam'],
    ['PIANO', 'Alat musik bertuts hitam putih'],
    ['DRUM', 'Alat musik pukul yang dimainkan dengan stik'],
    ['BIOLA', 'Alat musik gesek berdawai empat'],
    ['BOLA', 'Mainan bundar untuk berolahraga'],
    ['LAYANGAN', 'Mainan yang diterbangkan dengan benang'],
    ['GASING', 'Mainan yang berputar di atas tanah'],
    ['KELERENG', 'Bola kaca kecil untuk bermain'],
    ['BONEKA', 'Mainan berbentuk orang atau hewan'],
    ['KUAS', 'Alat untuk mengoleskan cat'],
    ['GUNTUNG', 'Alat untuk memotong kertas'],
    ['TAS', 'Wadah untuk membawa buku'],
    ['PENA', 'Alat tulis bertinta'],
    ['PENGHAPUS', 'Alat untuk menghapus tulisan pensil'],
    ['PENGARIS', 'Alat untuk membuat garis lurus'],
    ['PETA', 'Gambaran wilayah di atas kertas'],
    ['KOMPAS', 'Alat penunjuk arah mata angin'],
    ['BENDERA', 'Kain lambang sebuah negara'],
    ['GARUDA', 'Burung lambang negara Indonesia'],
    ['BATIK', 'Kain bermotif khas Indonesia'],
    ['WAYANG', 'Boneka pertunjukan tradisional'],
    ['ANGKLUNG', 'Alat musik bambu dari Jawa Barat'],
    ['MASJID', 'Tempat ibadah umat Islam'],
    ['SAJADAH', 'Alas untuk menunaikan salat'],
    ['TASBIH', 'Butiran untuk menghitung zikir'],
    ['LEBARAN', 'Hari raya setelah puasa Ramadan']
  ];

  var urutan, kata, petunjuk, keping, jawab, pakai, kx, skor, nyawa, kombo,
      komboTerbaik, waktu, waktuAwal, level, benar, salah, over, sebab, runT,
      pesan, pesanT, ledak;

  /* ---------- fungsi murni (A.debug) ---------- */
  function seedRng (seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function kocakHuruf (kata, seed) {
    var a = kata.split(''), rng = seedRng(seed), i, j, t, coba = 0;
    do {
      for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(rng() * (i + 1));
        t = a[i]; a[i] = a[j]; a[j] = t;
      }
      coba++;
    } while (a.join('') === kata && coba < 12);
    return a;
  }
  function urutanKamus (seed, jumlah) {
    var idx = [], rng = seedRng(seed), i, j, t;
    for (i = 0; i < KAMUS.length; i++) idx.push(i);
    for (i = idx.length - 1; i > 0; i--) {
      j = Math.floor(rng() * (i + 1)); t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx.slice(0, Math.min(jumlah, idx.length));
  }
  function waktuLevel (lvl) { return Math.max(14, 30 - lvl * 2); }
  function poinKata (panjang, sisaDetik, kombo) {
    return Math.round(panjang * 20 * (1 + Math.min(1, kombo * 0.15)) + sisaDetik * 4);
  }

  /* ---------- siklus ---------- */
  var seedRonde = 4242;
  function reset () {
    /* urutan kata & acakan huruf berbeda tiap sesi supaya tidak hafal urutan */
    seedRonde = ((Date.now() + seedRonde * 7919) % 99991) + 1;
    urutan = urutanKamus(seedRonde, KAMUS.length);
    skor = 0; nyawa = NYAWA; kombo = 0; komboTerbaik = 0; benar = 0; salah = 0;
    level = 1; over = false; sebab = ''; runT = 0; pesan = ''; pesanT = 0; ledak = [];
    muatKata();
    A.setScore(0); A.setBest(); A.setStatus('Level 1', 'Nyawa 3'); A.setProgress(1);
  }
  function muatKata () {
    var i = urutan[(benar + salah) % urutan.length];
    kata = KAMUS[i][0]; petunjuk = KAMUS[i][1];
    keping = kocakHuruf(kata, i * 31 + level * 7 + seedRonde);
    jawab = []; pakai = [];
    for (var k = 0; k < keping.length; k++) pakai.push(false);
    kx = 0;
    waktuAwal = waktuLevel(level) * 60; waktu = waktuAwal;
  }
  function tamat (s) {
    over = true; sebab = s; A.SFX.crash();
    if (skor > A.best) A.best = skor;
    A.saveBest(A.best); A.setBest();
  }
  function ambil () {
    if (over || pakai[kx]) return;
    pakai[kx] = true; jawab.push(keping[kx]); A.SFX.jump();
    if (jawab.length === kata.length) periksa();
  }
  function hapus () {
    if (over || !jawab.length) return;
    var huruf = jawab.pop();
    for (var i = keping.length - 1; i >= 0; i--) {
      if (pakai[i] && keping[i] === huruf) { pakai[i] = false; break; }
    }
    A.SFX.point();
  }
  function lewat () {
    if (over) return;
    nyawa--; kombo = 0; salah++;
    pesan = 'DILEWATI — ' + kata; pesanT = 70;
    A.SFX.crash();
    if (nyawa <= 0) return tamat('NYAWA HABIS');
    level = Math.max(1, level);
    muatKata();
  }
  function periksa () {
    var hasil = jawab.join('');
    if (hasil === kata) {
      kombo++; if (kombo > komboTerbaik) komboTerbaik = kombo;
      var tambah = poinKata(kata.length, Math.ceil(waktu / 60), kombo);
      skor += tambah; benar++;
      pesan = 'BENAR! +' + tambah; pesanT = 60;
      A.setScore(skor);
      if (skor > A.best) { A.best = skor; A.saveBest(skor); A.setBest(); }
      A.SFX.level();
      ledak.push({ t: 26 });
      if (benar % 4 === 0) level++;
      muatKata();
    } else {
      nyawa--; kombo = 0; salah++;
      pesan = 'SALAH — coba lagi'; pesanT = 60;
      A.SFX.crash();
      if (nyawa <= 0) return tamat('NYAWA HABIS');
      jawab = [];
      for (var i = 0; i < pakai.length; i++) pakai[i] = false;
    }
  }

  function langkah () {
    runT++;
    if (pesanT > 0) pesanT--;
    if (ledak.length) { for (var e = 0; e < ledak.length; e++) ledak[e].t--; ledak = ledak.filter(function (x) { return x.t > 0; }); }
    if (over) return;
    waktu--;
    if (waktu <= 0) {
      nyawa--; kombo = 0; salah++;
      pesan = 'WAKTU HABIS — ' + kata; pesanT = 70;
      A.SFX.crash();
      if (nyawa <= 0) return tamat('WAKTU HABIS, NYAWA 0');
      muatKata();
    }
  }

  /* ---------- gambar ---------- */
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
    g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#fde7f3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* bintik latar */
    ctx.fillStyle = 'rgba(255,183,197,0.25)';
    for (var b = 0; b < 26; b++) {
      ctx.beginPath(); ctx.arc((b * 97 + 20) % W, (b * 53 + 30) % H, 4 + (b % 3), 0, 6.29); ctx.fill();
    }

    /* petunjuk */
    ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 ' + petunjuk, W / 2, 104);
    ctx.fillStyle = '#ff8fb3'; ctx.font = '900 13px "Comic Sans MS", sans-serif';
    ctx.fillText(kata.length + ' HURUF · LEVEL ' + level, W / 2, 128);

    /* kotak jawaban */
    var uk = 46, gap = 8;
    var totalW = kata.length * uk + (kata.length - 1) * gap;
    var ox = (W - totalW) / 2, oy = 170;
    for (var i = 0; i < kata.length; i++) {
      ctx.fillStyle = '#fff'; bulat(ox + i * (uk + gap), oy, uk, uk, 12); ctx.fill();
      ctx.strokeStyle = i < jawab.length ? '#4caf7d' : '#ffc2d4'; ctx.lineWidth = 3;
      bulat(ox + i * (uk + gap), oy, uk, uk, 12); ctx.stroke(); ctx.lineWidth = 1;
      if (jawab[i]) {
        ctx.fillStyle = '#4caf7d'; ctx.font = '900 26px "Segoe UI", sans-serif';
        ctx.fillText(jawab[i], ox + i * (uk + gap) + uk / 2, oy + 33);
      }
    }

    /* keping huruf */
    var kUk = 56, kGap = 12;
    var perBaris = Math.min(keping.length, Math.max(3, Math.floor((W - 40) / (kUk + kGap))));
    var baris = Math.ceil(keping.length / perBaris);
    var kOy = 300;
    for (var k = 0; k < keping.length; k++) {
      var bar = Math.floor(k / perBaris);
      var nBar = Math.min(perBaris, keping.length - bar * perBaris);
      var kOx = (W - (nBar * kUk + (nBar - 1) * kGap)) / 2;
      var kolom = k % perBaris;
      var x = kOx + kolom * (kUk + kGap), y = kOy + bar * (kUk + kGap);
      if (pakai[k]) {
        ctx.fillStyle = 'rgba(200,200,200,0.25)'; bulat(x, y, kUk, kUk, 14); ctx.fill();
        ctx.fillStyle = '#c9b6bd'; ctx.font = '900 26px "Segoe UI", sans-serif';
        ctx.fillText('·', x + kUk / 2, y + 36);
      } else {
        var gr = ctx.createLinearGradient(x, y, x + kUk, y + kUk);
        gr.addColorStop(0, '#ffd9e6'); gr.addColorStop(1, '#cdeaff');
        ctx.fillStyle = gr; bulat(x, y, kUk, kUk, 14); ctx.fill();
        ctx.fillStyle = '#7a5c6b'; ctx.font = '900 28px "Segoe UI", sans-serif';
        ctx.fillText(keping[k], x + kUk / 2, y + 39);
      }
      if (k === kx && !over) {
        ctx.strokeStyle = '#ff6b8a'; ctx.lineWidth = 4;
        bulat(x - 4, y - 4, kUk + 8, kUk + 8, 17); ctx.stroke(); ctx.lineWidth = 1;
      }
    }

    /* HUD */
    ctx.textAlign = 'left'; ctx.fillStyle = '#7a5c6b';
    ctx.font = '900 15px "Comic Sans MS", sans-serif';
    ctx.fillText('❤ ' + nyawa, 14, 30);
    ctx.fillText('⏱ ' + Math.ceil(waktu / 60) + 's', 14, 54);
    ctx.textAlign = 'right';
    ctx.fillText('✅ ' + benar, W - 14, 30);
    ctx.fillText('❌ ' + salah, W - 14, 54);
    ctx.textAlign = 'center';
    if (kombo > 1) { ctx.fillStyle = '#ff7aa2'; ctx.fillText('KOMBO ×' + (1 + Math.min(1, kombo * 0.15)).toFixed(2), W / 2, 30); }

    /* bilah waktu */
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(40, 146, W - 80, 8);
    ctx.fillStyle = waktu / waktuAwal < 0.25 ? '#ff6b8a' : '#9be3a8';
    ctx.fillRect(40, 146, (W - 80) * Math.max(0, waktu / waktuAwal), 8);

    if (ledak.length) {
      ctx.globalAlpha = ledak[0].t / 26;
      ctx.fillStyle = '#ffd166'; ctx.font = '900 30px "Segoe UI", sans-serif';
      ctx.fillText('✨ 🎉 ✨', W / 2, 262); ctx.globalAlpha = 1;
    }
    if (pesanT > 0) {
      ctx.globalAlpha = Math.min(1, pesanT / 24);
      ctx.fillStyle = pesan.indexOf('BENAR') === 0 ? '#4caf7d' : '#ff6b8a';
      ctx.font = '900 22px "Comic Sans MS", sans-serif';
      ctx.fillText(pesan, W / 2, 292);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(122,92,107,0.75)'; ctx.font = '800 13px "Comic Sans MS", sans-serif';
    ctx.fillText('◀ ▶ pilih · ● ambil · ▲ hapus · ▼ lewati', W / 2, H - 26);

    if (over) {
      ctx.fillStyle = 'rgba(255,255,255,0.93)'; ctx.fillRect(0, H / 2 - 80, W, 160);
      ctx.fillStyle = '#ff6b8a'; ctx.font = '900 28px "Comic Sans MS", sans-serif';
      ctx.fillText('SELESAI', W / 2, H / 2 - 34);
      ctx.fillStyle = '#7a5c6b'; ctx.font = '800 15px "Comic Sans MS", sans-serif';
      ctx.fillText(sebab + ' · skor ' + skor, W / 2, H / 2 - 4);
      ctx.fillText(benar + ' kata benar · ' + salah + ' salah · level ' + level, W / 2, H / 2 + 22);
      ctx.fillText('kombo terbaik ' + komboTerbaik, W / 2, H / 2 + 46);
      ctx.fillText('TAP / ● UNTUK MAIN LAGI', W / 2, H / 2 + 72);
    }
    ctx.textAlign = 'left';
  }

  /* ---------- loop ---------- */
  var last = 0;
  function loop (tm) {
    if (!last) last = tm;
    var dt = Math.min((tm - last) / 16.67, 2); last = tm;
    for (var i = 0; i < dt; i++) langkah();
    gambar();
    A.setScore(skor);
    A.setStatus('Level ' + level + ' · ' + kata.length + ' huruf', 'Nyawa ' + nyawa);
    A.setProgress(waktu / waktuAwal);
    A.state = {
      skor: skor, nyawa: nyawa, level: level, benar: benar, salah: salah, kombo: kombo,
      komboTerbaik: komboTerbaik, waktu: Math.ceil(waktu / 60), kata: kata, petunjuk: petunjuk,
      keping: keping.join(''), jawab: jawab.join(''), panjangJawab: jawab.length, kx: kx,
      pakai: pakai.slice(), over: over, sebab: sebab, best: A.best
    };
    requestAnimationFrame(loop);
  }

  A.debug = { kocakHuruf: kocakHuruf, urutanKamus: urutanKamus, waktuLevel: waktuLevel, poinKata: poinKata, ambil: ambil, hapus: hapus, lewat: lewat, periksa: periksa, KAMUS: KAMUS, seedRng: seedRng };

  /* ---------- input ---------- */
  function geser (d) {
    if (over) { reset(); return; }
    kx = (kx + d + keping.length) % keping.length;
  }
  window.addEventListener('keydown', function (e) {
    A.initAudio();
    var k = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].indexOf(k) >= 0) e.preventDefault();
    if (over && (k === 'Space' || k === 'Enter')) { reset(); return; }
    if (k === 'ArrowLeft' || k === 'KeyA') geser(-1);
    else if (k === 'ArrowRight' || k === 'KeyD') geser(1);
    else if (k === 'ArrowUp' || k === 'KeyW') hapus();
    else if (k === 'ArrowDown' || k === 'KeyS') lewat();
    else if (k === 'Space' || k === 'Enter') { if (over) reset(); else ambil(); }
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
    if (px === null) { ambil(); return; }
    if (py < 160) { lewat(); return; }
    if (py > H - 90) { hapus(); return; }
    /* hitung keping yang paling dekat dengan titik sentuh */
    var kUk = 56, kGap = 12;
    var perBaris = Math.min(keping.length, Math.max(3, Math.floor((W - 40) / (kUk + kGap))));
    var bar = Math.max(0, Math.floor((py - 300) / (kUk + kGap)));
    var nBar = Math.min(perBaris, keping.length - bar * perBaris);
    var kOx = (W - (nBar * kUk + (nBar - 1) * kGap)) / 2;
    var kolom = Math.max(0, Math.min(nBar - 1, Math.floor((px - kOx) / (kUk + kGap))));
    kx = Math.min(keping.length - 1, bar * perBaris + kolom);
    ambil();
  }
  c.addEventListener('touchstart', function (e) { sentuh(e); if (e.preventDefault) e.preventDefault(); }, { passive: false });
  c.addEventListener('mousedown', function (e) { sentuh(e); });

  reset();
  requestAnimationFrame(loop);
`

export function wordHtml (brand = 'THERYHANN!') {
  return shell('Susun Kata', brand, WORD_JS, {
    w: 560, h: 620, maxw: 520, skin: 'pastel', sub: 'PASTEL',
    hint: '◀ ▶ pilih keping huruf  ·  ● ambil  ·  ▲ hapus huruf terakhir  ·  ▼ lewati kata (-1 nyawa)'
  })
}

export const PASTEL10 = [
  { id: 'susunhuruf', cmd: 'susunhuruf', icon: '🔤', title: 'Susun Kata', nama: 'Susun Kata', html: wordHtml, ratio: '560×620', w: 560, h: 620 }
]
