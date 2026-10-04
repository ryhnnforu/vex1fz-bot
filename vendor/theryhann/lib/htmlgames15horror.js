/**
 * lib/htmlgames15horror.js — 2 GAME HORROR BER-EPISODE (v7.20.0)
 * ------------------------------------------------------------------
 *  1. rumah13   — RUMAH NOMOR 13 : horror orang-pertama (raycasting 3D,
 *                 senter, kegelapan, hantu yang mengejar suara), NPC yang
 *                 bisa diajak bicara (pilihan dialog), inventaris & tukar item.
 *  2. desapixel — DESA PIXEL TERKUTUK : pixel-horror top-down (tile 8-bit,
 *                 malam, lentera, kewarasan), penduduk desa NPC dengan dialog
 *                 bercabang, barter item, pocong/kuntilanak yang berpatroli.
 *
 *  Keduanya memakai sistem NPC yang sama (dialog(judul,teks,opts)) dan
 *  inventaris sederhana INV = {item:jumlah}; tukar item lewat opsi dialog.
 */
const R = String.raw

/* ================================================================== */
/*  1. RUMAH NOMOR 13                                                  */
/* ================================================================== */
export const rumah13 = {
  id: 'rumah13', cmd: '.rumah13', icon: '🕯️', nama: 'Rumah Nomor 13 (horror 3D · 5 malam)', judul: 'RUMAH NOMOR 13', sub: 'HORROR ORANG-PERTAMA',
  ikon: '', ket: 'horror 3D orang-pertama: senter, lorong gelap, hantu yang mendengar langkahmu; bicara dengan penghuni, tukar item, pecahkan misteri 5 malam',
  bgm: { bpm: 52, wave: 'sine', bwave: 'sine', lead: [0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], perc: 0, vol: .07, filt: 500, len: 3 },
  css: `html,body{background:#050405}.menuwrap{--acc:#c8a24a;--accink:#120c04;--box:rgba(14,10,8,.9);--line:#c8a24a44;--ink:#e8dcc4;background:#050405;font-family:Georgia,"Times New Roman",serif}
.r13{min-height:420px;padding:16px;color:#e8dcc4;position:relative;overflow:hidden;font-family:Georgia,"Times New Roman",serif;background:radial-gradient(ellipse at 50% 30%,#1a120c 0%,#050405 70%)}
.r13 .fl{position:absolute;left:50%;top:38%;width:260px;height:260px;margin:-130px;border-radius:50%;background:radial-gradient(circle,#ffbf6a33,transparent 60%);animation:flk 3s infinite;pointer-events:none}@keyframes flk{0%,100%{opacity:.8}20%{opacity:.3}25%{opacity:.9}60%{opacity:.5}}
.r13 .door{position:relative;width:120px;height:190px;margin:10px auto 6px;background:linear-gradient(90deg,#2a1a10,#3d2818 50%,#2a1a10);border:3px solid #1a0f08;border-radius:60px 60px 4px 4px;box-shadow:0 0 40px #000 inset,0 0 30px #ffbf6a22}.r13 .door:after{content:"13";position:absolute;left:50%;top:26px;transform:translateX(-50%);font-size:34px;color:#c8a24a;letter-spacing:2px;text-shadow:0 0 10px #c8a24a}.r13 .door i{position:absolute;right:16px;top:100px;width:10px;height:10px;border-radius:50%;background:#c8a24a;box-shadow:0 0 8px #c8a24a}
.r13 .ttl{position:relative;text-align:center;font-size:24px;letter-spacing:6px;color:#e8dcc4;text-shadow:0 0 18px #c8a24a88}.r13 .ttl small{display:block;font-size:10px;letter-spacing:5px;color:#c8a24a;margin-top:4px}
.r13 .pap{position:relative;background:#e8dcc4;color:#2b1d12;border-radius:2px;padding:12px 14px;margin-top:12px;box-shadow:0 8px 24px #000;transform:rotate(-.6deg);font-size:12px;line-height:1.6}.r13 .pap:before{content:"";position:absolute;left:0;top:0;right:0;height:100%;background:repeating-linear-gradient(transparent 0 22px,#0001 22px 23px);pointer-events:none}.r13 .pap h4{font-size:11px;letter-spacing:3px;margin-bottom:6px;border-bottom:1px solid #2b1d1233;padding-bottom:4px}
.r13 .ep{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px dashed #2b1d1233;font-size:12px;font-weight:700}.r13 .ep:last-child{border:0}.r13 .ep i{width:28px;height:28px;border-radius:50%;border:2px solid #2b1d12;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;flex:none}.r13 .ep.on i{background:#7a1f1f;color:#fff;border-color:#7a1f1f}.r13 .ep.lk{opacity:.4;text-decoration:line-through}.r13 .ep small{display:block;font-weight:400;font-size:10px;color:#5a4030}
.r13 .go{position:relative;margin-top:14px;height:54px;border:1px solid #c8a24a;color:#e8dcc4;display:flex;align-items:center;justify-content:center;letter-spacing:4px;font-size:14px;background:linear-gradient(180deg,#2a1a10,#150c06);box-shadow:0 0 20px #c8a24a33}.r13 .row3{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px}.r13 .row3 div{height:40px;border:1px solid #c8a24a55;display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:2px;color:#c8a24a}
.r13 .ft{position:relative;text-align:center;font-size:9px;letter-spacing:4px;color:#c8a24a66;margin-top:10px}
.hud .p,.hud .ps{background:#0e0a08;border:1px solid #c8a24a44;color:#e8dcc4;font-family:Georgia,serif}.hud .p span{color:#c8a24a}.frame{border:2px solid #c8a24a33}.dlg{background:#0e0a08f2;border-color:#c8a24a;font-family:Georgia,serif}.dlg b.j{color:#c8a24a;letter-spacing:2px}.dlg .opts div{background:#1a120c;border:1px solid #c8a24a55}.toast{border-color:#7a1f1f;background:#1a0a0a}.hint{color:#c8a24a99}
.h13{display:flex;justify-content:space-between;align-items:flex-end;padding:6px 2px}.h13 .pad{display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(2,54px);gap:4px}.h13 .k{background:#1a120c;border:1px solid #c8a24a44;color:#e8dcc4;border-radius:8px;font-size:18px}.h13 .k.dn{background:#3d2818}.h13 .col{display:flex;flex-direction:column;gap:6px}.h13 .col .k{width:96px;height:46px;font-size:12px;letter-spacing:1px;font-family:Georgia,serif}.h13 .k.act{background:linear-gradient(180deg,#7a1f1f,#4a0f0f);border-color:#c8a24a}.h13 .k.lamp{background:#c8a24a;color:#120c04;font-weight:900}`,
  splash: b => `<div class="r13"><div class="fl"></div><div class="door"><i></i></div><div class="ttl">RUMAH NOMOR 13<small>${b} · HORROR</small></div><div class="pap"><h4>SURAT WASIAT</h4>"Kepada cucuku <b>Nadia</b>. Rumah ini milikmu sekarang. Jangan tidur di kamar belakang. Jangan jawab kalau ada yang memanggil namamu dari lantai atas. Dan tolong… temukan adikku."<br><br><i>— Nenek Ratna, 3 hari sebelum meninggal.</i><br><br><b style="letter-spacing:3px">▶ KETUK UNTUK MASUK</b></div></div>`,
  menu: `function(S){var m=S.eps.map(function(e,i){var n=i+1;return '<div data-ep="'+n+'" class="ep '+(n===S.ep?'on':n>S.max?'lk':'')+'"><i>'+(n>S.max?'✕':n)+'</i><div>Malam '+n+' — '+e.judul+'<small>'+e.sub+'</small></div></div>'}).join('');
   return '<div class="r13"><div class="fl"></div><div class="ttl" style="margin-top:6px">RUMAH NOMOR 13<small>BUKU HARIAN NADIA · MALAM '+S.ep+'</small></div><div class="pap"><h4>MALAM-MALAM DI RUMAH INI</h4>'+m+'</div><div class="pap" style="transform:rotate(.5deg);font-size:11px">Nyawa selamat: <b>'+S.best+'</b> poin · Senter: baterai terbatas, hantu <b>mendengar langkah cepat</b>. Bicara dengan penghuni (tombol BICARA saat dekat). Tukar barang dengan mereka.</div><div class="go" id="mPlay">MASUK — MALAM '+S.ep+'</div><div class="row3"><div id="mStory">CATATAN</div><div id="mHow">PETUNJUK</div><div id="mSet">SETEL</div></div><div class="ft">'+S.brand+'</div></div>'}`,
  hud: '<div class="p"><small>SENTER</small><span id="hBat">100%</span></div><div class="p"><small>DETAK</small><span id="hHr">70</span></div><div class="p"><small>TAS</small><span id="hInv">0</span></div><div class="p"><small>TUGAS</small><span id="hQ">0/0</span></div>',
  kontrol: '<div class="h13"><div class="pad"><div class="k" id="bTL">↶</div><div class="k" id="bF">▲</div><div class="k" id="bTR">↷</div><div class="k" id="bL">◀</div><div class="k" id="bB">▼</div><div class="k" id="bR">▶</div></div><div class="col"><div class="k lamp" id="bLamp">🔦 SENTER</div><div class="k act" id="bAct">BICARA / AMBIL</div><div class="k" id="bInv">🎒 TAS</div></div></div>',
  hint: '▲▼ jalan · ↶↷ menoleh · ◀▶ geser · SENTER hemat baterai · BICARA/AMBIL saat dekat orang/benda · jalan pelan saat hantu dekat',
  how: [['▲ ▼ ◀ ▶', 'berjalan / menggeser'], ['↶ ↷', 'menoleh kiri / kanan'], ['🔦', 'senter: melihat jauh, tapi baterai habis & hantu melihat cahaya'], ['BICARA/AMBIL', 'di depan orang = dialog (pilihan); di depan benda = ambil'], ['🎒', 'lihat isi tas; beberapa penghuni mau MENUKAR barang'], ['👻', 'hantu mendengar langkah: berhenti/diam saat detak jantung tinggi']],
  tujuan: 'Selesaikan tugas tiap malam (bicara, cari, tukar barang, buka pintu) tanpa tertangkap. Detak 180 = pingsan = gagal.',
  tamat: 'Di ruang bawah tanah, di balik tembok yang dibangun 60 tahun lalu, Nadia menemukan kerangka kecil dengan kalung bertuliskan "SITI". Adik Nenek Ratna, yang "hilang" tahun 1964 — dikurung ayah mereka karena "berbeda". Nadia menguburkannya di samping Nenek. Malam itu, untuk pertama kali, tidak ada yang memanggil namanya dari lantai atas. Hanya suara dua anak perempuan tertawa, jauh, lalu hening.',
  eps: [
    { judul: 'Kunci Pertama', sub: 'ruang tamu · dapur · penjaga tua', intro: ['*NADIA*, 24 tahun, mewarisi rumah tua Nomor 13 dari neneknya. Listrik mati. Hanya senter dari tas.', 'Di ruang tamu, seorang lelaki tua duduk di kursi goyang. *PAK DARMO*, penjaga rumah 40 tahun. "Nona Nadia? Nenek bilang Nona akan datang. Nenek juga bilang… Nona akan bertanya soal Siti."', 'Malam pertama: bicara dengan Pak Darmo, temukan kunci lemari di dapur. Dan jangan naik ke lantai atas. Belum.'],
      outro: ['Pak Darmo menerima rokok itu dengan tangan gemetar dan memberi kunci berkarat. "Kunci kamar Nenek. Bacalah buku hariannya. Lalu putuskan sendiri apakah Nona mau tetap tinggal."', 'Dari lantai atas, papan lantai berderit. Satu langkah. Dua. Lalu berhenti tepat di atas kepala Nadia.'],
      map: ['##########', '#....#...#', '#.D..#.k.#', '#....+...#', '###+######', '#.......r#', '#..S.....#', '#........#', '##########'], start: [1.5, 1.5], sa: 1.57,
      npc: { D: { nama: 'PAK DARMO', ikon: '👴', wajah: [180, 150, 120] }, S: null }, item: { k: ['rokok', '🚬'], r: null },
      tugas: ['bicara Pak Darmo', 'ambil rokok di dapur', 'tukar rokok → kunci'], hantu: { n: 0 },
      dialog: { D: [
        { syarat: null, teks: '"Rumah ini tidak jahat, Nona. Yang jahat sudah lama mati. Yang tersisa cuma… yang tidak bisa pergi." Ia batuk panjang. "Saya butuh rokok. Sudah tiga hari. Di dapur biasanya ada, di laci."', opsi: [['Siapa Siti?', 'darmo_siti'], ['Saya carikan rokoknya.', 'tutup']], flag: 'bicaraD' },
        { syarat: 'rokok', teks: '"Nona menemukannya." Ia menyalakan sebatang, tangannya berhenti gemetar. "Mau tukar? Rokok ini dengan kunci kamar Nenek. Adil?"', opsi: [['Tukar (rokok → kunci)', 'tukar:rokok:kunci'], ['Nanti dulu.', 'tutup']] },
        { syarat: 'kunci', teks: '"Kamar Nenek di lantai atas, paling ujung. Kalau ada yang memanggil dari kamar belakang—" ia menatap tajam, "—itu bukan Nenek."', opsi: [['Terima kasih, Pak.', 'selesai']] }
      ] },
      cabang: { darmo_siti: '"Adik Nenek Ratna. Umur 7 tahun waktu itu. Tahun 1964. Ayah mereka bilang Siti \'dibawa ke rumah sakit\'. Tidak ada rumah sakit yang pernah menerimanya." Ia menunduk. "Rokok, Nona. Tolong."' } },
    { judul: 'Buku Harian', sub: 'lantai atas · kamar nenek · anak perempuan', intro: ['Lantai atas. Lorong panjang, wallpaper terkelupas. Kunci Pak Darmo cocok di pintu ujung.', 'Di tengah lorong berdiri seorang anak perempuan berbaju putih, membelakangi. *"Kakak bawa boneka?"* Suaranya seperti dari dalam sumur. Ia tidak menoleh.', 'Tugas: temukan boneka di kamar mandi, berikan pada anak itu, buka kamar Nenek dan ambil buku harian. Sesuatu di kamar belakang mulai bergerak.'],
      outro: ['Buku harian Nenek, halaman 12 Maret 1964: *"Ayah membawa Siti ke bawah. Aku dengar palu semalaman. Pagi ini tembok ruang bawah tanah lebih tebal."*', 'Anak perempuan itu memeluk bonekanya di ujung lorong. Wajahnya kini terlihat: tidak ada. Hanya kulit rata. Tapi ia melambaikan tangan, ramah.'],
      map: ['############', '#..........#', '#.###.###.##', '#.#b#.#..#.#', '#.#+#.#+##.#', '#....A.....#', '#.####.###.#', '#.#..#.#.#.#', '#.#..+.#+#.#', '#.#..#...#j#', '#.####...###', '############'], start: [1.5, 1.5], sa: 1.57,
      npc: { A: { nama: 'ANAK PEREMPUAN', ikon: '👧', wajah: [230, 225, 220], diam: true } }, item: { b: ['boneka', '🧸'], j: ['buku harian', '📔'], butuhKunci: 'j' },
      tugas: ['ambil boneka', 'beri boneka pada anak', 'ambil buku harian (kamar terkunci → kunci)'], hantu: { n: 1, cepat: .012, mulai: 'boneka' },
      dialog: { A: [
        { syarat: null, teks: '"Kakak bawa boneka? Boneka Siti ada di kamar mandi. Ayah membuangnya." Ia tidak bergerak. "Kalau Kakak bawa, aku kasih tahu jalan ke kamar Nenek yang aman."', opsi: [['Kamu Siti?', 'anak_siti'], ['Aku carikan.', 'tutup']], flag: 'bicaraA' },
        { syarat: 'boneka', teks: 'Ia berbalik perlahan. "Boneka…" Tangannya terulur, terlalu panjang. "Tukar sama peta jalan? Biar yang di kamar belakang tidak dengar Kakak."', opsi: [['Berikan boneka (boneka → peta)', 'tukar:boneka:peta'], ['Belum.', 'tutup']] },
        { syarat: 'peta', teks: '"Kamar Nenek pintunya di pojok kanan. Jangan lewat lorong tengah. Dia di sana." Ia memeluk boneka. "Terima kasih, Kak Nadia. Siti ingat nama Kakak dari Nenek."', opsi: [['…', 'selesai']] }
      ] },
      cabang: { anak_siti: '"Siti sudah lama tidak dipanggil nama." Ia diam lama. "Boneka, Kak. Tolong. Sebelum yang di kamar belakang bangun."' } },
    { judul: 'Kamar Belakang', sub: 'sesuatu memanggil namamu', intro: ['Suara dari kamar belakang malam ini jelas: *"Nadia… Nadia, bukakan pintu. Ini Nenek."*', 'Pak Darmo di tangga, pucat. "Itu bukan Nenek, Nona. Itu *ayah* Nenek. Dia butuh seseorang membukakan pintu dari luar — 60 tahun dia menunggu."', 'Tugas: ambil garam dari dapur, tukar dengan Pak Darmo untuk gembok baru, dan pasang gembok di pintu kamar belakang — dari luar — sementara ia mengejarmu di lorong.'],
      outro: ['Gembok terpasang. Dari balik pintu, suara itu berubah dari suara Nenek menjadi geraman lelaki tua. Lalu tangisan. Lalu diam.', 'Pak Darmo terduduk. "Ayah mereka menguburkan Siti hidup-hidup di balik tembok, Nona. Dan Nenek Ratna tahu. Seumur hidup dia tahu, dan tidak bisa bilang siapa-siapa."'],
      map: ['############', '#....#.....#', '#.D..#..g..#', '#....+.....#', '####+#######', '#..........#', '#.###.####.#', '#.#.....#..#', '#.#..H..+.G#', '#.#.....#..#', '#.#######..#', '############'], start: [1.5, 1.5], sa: 1.57,
      npc: { D: { nama: 'PAK DARMO', ikon: '👴', wajah: [180, 150, 120] } }, item: { g: ['garam', '🧂'], G: ['pintu kamar belakang', '🚪'], pasang: 'G' },
      tugas: ['ambil garam', 'tukar garam → gembok', 'pasang gembok di pintu belakang'], hantu: { n: 1, cepat: .016, mulai: 'awal', suara: true },
      dialog: { D: [
        { syarat: null, teks: '"Garam, Nona. Di dapur. Dia tidak bisa lewat garam — sebentar. Bawa ke saya, saya punya gembok baja, tukar. Lalu pasang di pintunya. Jangan buka pintunya. APA PUN yang dia bilang."', opsi: [['Kenapa Bapak tidak pasang sendiri?', 'darmo_takut'], ['Baik.', 'tutup']], flag: 'bicaraD' },
        { syarat: 'garam', teks: '"Bagus." Ia menyerahkan gembok sebesar kepalan. "Taburkan garam kalau dia terlalu dekat. Lalu lari. Jangan menoleh."', opsi: [['Tukar (garam → gembok)', 'tukar:garam:gembok'], ['Sebentar.', 'tutup']] },
        { syarat: 'gembok', teks: '"Pergilah. Saya tunggu di sini. Kalau Nona tidak kembali dalam sepuluh menit… saya bakar rumah ini."', opsi: [['…', 'selesai']] }
      ] },
      cabang: { darmo_takut: '"Karena dia tahu nama saya, Nona. 40 tahun dia memanggil nama saya tiap malam. Kaki saya tidak mau jalan ke sana lagi." Ia menangis tanpa suara.' } },
    { judul: 'Tembok Ruang Bawah Tanah', sub: 'palu · lilin · kegelapan total', intro: ['Ruang bawah tanah. Tangga kayu lapuk. Tidak ada jendela — hanya senter, dan baterainya tinggal setengah.', 'Siti menunggu di bawah, duduk memeluk boneka. "Tembok yang itu, Kak. Aku di baliknya. Tapi palu Ayah dibawa dia — yang di kamar belakang. Sekarang dia keluar lagi lewat lubang lantai."', 'Tugas: temukan 3 lilin (baterai senter tidak cukup), tukar lilin dengan Siti untuk petunjuk letak palu, ambil palu, pukul tembok 5 kali — sambil dikejar dalam gelap.'],
      outro: ['Pukulan kelima. Tembok runtuh. Bau tanah tua dan kapur. Di dalamnya: ruang sesempit lemari.', 'Siti berdiri di sebelah Nadia, memandang ke dalam. "Itu aku," katanya pelan. "Kecil ya."'],
      map: ['##############', '#c...#.....#c#', '#....#..S..#.#', '#.####..#..+.#', '#....+..#....#', '#.##.####.##.#', '#.#..........#', '#.#.######.#.#', '#.#.#....#.#.#', '#...+.p..#...#', '#.###....#.#T#', '#c..........##', '##############'], start: [1.5, 1.5], sa: 1.57,
      npc: { S: { nama: 'SITI', ikon: '👧', wajah: [230, 225, 220], diam: true } }, item: { c: ['lilin', '🕯️'], p: ['palu', '🔨'], T: ['tembok tua', '🧱'], pukul: 'T', butuhItem: 'palu', pukulN: 5 },
      tugas: ['kumpulkan 3 lilin', 'tukar lilin → petunjuk palu', 'ambil palu', 'pukul tembok 5×'], hantu: { n: 2, cepat: .014, mulai: 'awal' }, gelap: true,
      dialog: { S: [
        { syarat: null, teks: '"Gelap ya, Kak? Aku sudah biasa." Ia menunjuk ke kegelapan. "Ada lilin di pojok-pojok. Tiga. Kalau Kakak bawa semua, aku bilang palu di mana. Dia menyembunyikannya."', opsi: [['Kamu tidak takut dia?', 'siti_takut'], ['Aku cari lilinnya.', 'tutup']], flag: 'bicaraS' },
        { syarat: 'lilin:3', teks: 'Lilin-lilin menyala sendiri di tangan Nadia. Ruangan sedikit terang. "Palu di ruang tengah bawah, dekat lubang lantai. Cepat, Kak. Dia lewat lubang itu."', opsi: [['Tukar (3 lilin → petunjuk)', 'tukar:lilin:petunjuk:3'], ['Tunggu.', 'tutup']] },
        { syarat: 'palu', teks: '"Tembok di pojok kanan bawah. Lima kali. Ayah memukulnya seratus kali waktu itu — aku menghitung." Ia tersenyum tanpa mulut. "Lima saja, Kak."', opsi: [['…', 'selesai']] }
      ] },
      cabang: { siti_takut: '"Dia Ayahku, Kak. Dulu aku takut. Sekarang aku cuma… kasihan. Dia tidak tahu dia sudah mati." Ia memeluk boneka lebih erat.' } },
    { judul: 'Fajar', sub: 'dua saudari · satu pintu terakhir', intro: ['Kerangka kecil itu terbaring di ruang sempit. Kalung timah: *SITI, 1957*. Nadia berlutut. Dari atas, suara langkah berat turun tangga — ayah mereka. Tidak lagi memanggil nama. Hanya mengejar.', 'Pak Darmo di atas tangga, memegang jerigen minyak. Siti di samping kerangkanya. "Kak, bawa aku keluar. Ke matahari. Lewat pintu depan. Dia tidak bisa keluar rumah — kalau semua pintu ditutup garam."', 'Tugas malam terakhir: kumpulkan 4 garam dari seluruh rumah, taburkan di 4 pintu, bawa kalung Siti keluar lewat pintu depan sebelum fajar. Ia mengejar tanpa henti.'],
      outro: ['Pintu depan. Fajar. Nadia melangkah keluar memegang kalung timah kecil. Di belakangnya, sebuah jeritan panjang yang makin jauh, lalu hening.', 'Di halaman, seorang anak perempuan berbaju putih berdiri di bawah matahari pertama yang ia lihat sejak 1964. Ia punya wajah sekarang. Ia tersenyum. Lalu tidak ada.'],
      map: ['##############', '#g...#....#..#', '#....+....+.g#', '#.####.##.####', '#.....X..#...#', '#.###.####.#.#', '#.#.....#..#.#', '#.#..g..+..#.#', '#.#.....#..#g#', '#.#######.##.#', '#.....P......#', '##############'], start: [1.5, 1.5], sa: 1.57,
      npc: { X: { nama: 'PAK DARMO', ikon: '👴', wajah: [180, 150, 120] } }, item: { g: ['garam', '🧂'], P: ['pintu depan', '🚪'], keluar: 'P', butuhItem: 'garam:4' },
      tugas: ['kumpulkan 4 garam', 'bicara Pak Darmo (kalung)', 'keluar lewat pintu depan'], hantu: { n: 2, cepat: .02, mulai: 'awal', suara: true },
      dialog: { X: [
        { syarat: null, teks: '"Kalung Siti, Nona." Ia menyerahkan kalung timah. "Bawa keluar. Empat garam di empat sudut rumah — ambil semua, dia akan terkunci di dalam. Saya… saya tinggal di sini. Ini rumah saya juga."', opsi: [['Ikut saya, Pak.', 'darmo_ikut'], ['Terima kasih untuk semuanya.', 'ambil:kalung']], flag: 'bicaraX' },
        { syarat: 'kalung', teks: '"Pergilah, Nona. Sampaikan pada Siti: Darmo minta maaf sudah diam 40 tahun."', opsi: [['…', 'selesai']] }
      ] },
      cabang: { darmo_ikut: '"Tidak, Nona. Seseorang harus menutup pintu dari dalam." Ia tersenyum untuk pertama kalinya. "Nenek Ratna juga bilang begitu dulu. Saya cuma terlambat 40 tahun."' } }
  ],
  js: R`
var W=480,H=600,run=false,t=0,E=null,epN=1,MAP=[],MW=0,MH=0;
var px=0,py=0,pa=0,bat=100,hr=70,INV={},FLAG={},lamp=true,keys={},ghosts=[],pukulan=0,tugasKe=0,taburGaram=[],ambilCd=0,gelapAbs=false,noise=0,jump=0;
function tile(x,y){var r=MAP[y|0];return r?r[x|0]||'#':'#'}
function solid(x,y){var c=tile(x,y);return c==='#'||(c==='+'&&false)||(c==='T'&&pukulan<(E.item.pukulN||5))||c==='G'||c==='P'}
/* ---------- kontrol ---------- */
['F','B','L','R','TL','TR'].forEach(function(k){hold('b'+k,function(){keys[k]=1},function(){keys[k]=0})});
tap('bLamp',function(){lamp=!lamp;bip(300,.05,'square',.05);say('senter '+(lamp?'ON':'OFF'))});tap('bInv',function(){tas()});tap('bAct',function(){aksi()});
var KM={ArrowUp:'F',ArrowDown:'B',ArrowLeft:'TL',ArrowRight:'TR',a:'L',d:'R'};document.addEventListener('keydown',function(e){if(KM[e.key]){keys[KM[e.key]]=1;e.preventDefault()}if(e.key==='e')aksi();if(e.key==='f')lamp=!lamp;if(e.key==='i')tas()});document.addEventListener('keyup',function(e){if(KM[e.key])keys[KM[e.key]]=0});
function invN(){var n=0;for(var k in INV)n+=INV[k];return n}
function punya(s){var p=String(s).split(':');return (INV[p[0]]||0)>=(+p[1]||1)}
function tas(){if(!run||dopen)return;var l=[];for(var k in INV)if(INV[k]>0)l.push(k+' ×'+INV[k]);dialog('🎒 TAS NADIA',l.length?l.join('\n'):'(kosong)\n\nAmbil barang dengan tombol AMBIL saat berada tepat di depannya.')}
function upd(){I('hBat').textContent=Math.max(0,bat|0)+'%';I('hHr').textContent=hr|0;I('hHr').style.color=hr>140?'#ff4d4d':'';I('hInv').textContent=invN();I('hQ').textContent=tugasKe+'/'+E.tugas.length}
function majuTugas(n){if(n>tugasKe){tugasKe=n;say('✓ '+E.tugas[n-1]);bip(660,.1,'sine',.05);upd()}}
/* ---------- NPC / dialog ---------- */
function depan(){for(var d=.6;d<=1.8;d+=.4){var x=px+Math.cos(pa)*d,y=py+Math.sin(pa)*d;var c=tile(x,y);if(c!=='.'&&c!==' ')return {c:c,x:x|0,y:y|0,d:d}}return null}
function aksi(){if(!run||dopen||paused)return;var f=depan();if(!f)return say('tidak ada apa-apa di depanmu');var c=f.c;
 if(E.npc&&E.npc[c]){return bicara(c)}
 if(E.item&&E.item[c]&&E.item[c].length){var it=E.item[c];var nama=it[0];
  if(E.item.butuhKunci===c&&!punya('kunci'))return say('🔒 terkunci — butuh kunci');
  if(E.item.pukul===c){if(!punya(E.item.butuhItem||'palu'))return say('butuh '+(E.item.butuhItem||'palu'));pukulan++;bip(90,.15,'square',.15);getar(80);noise=1;say('🔨 pukul '+pukulan+'/'+(E.item.pukulN||5));if(pukulan>=(E.item.pukulN||5)){majuTugas(E.tugas.length);setTimeout(function(){run=false;tamat(true,skorNow())},600)}return}
  if(E.item.pasang===c){if(!punya('gembok'))return say('butuh gembok dari Pak Darmo');INV.gembok--;majuTugas(E.tugas.length);say('🔒 gembok terpasang');bip(200,.3,'square',.1);setTimeout(function(){run=false;tamat(true,skorNow())},800);return}
  if(E.item.keluar===c){var need=String(E.item.butuhItem||'').split(':');if(!punya('kalung'))return say('ambil kalung dari Pak Darmo dulu');if((INV.garam||0)<(+need[1]||4))return say('butuh '+need[1]+' garam (punya '+(INV.garam||0)+')');majuTugas(E.tugas.length);setTimeout(function(){run=false;tamat(true,skorNow())},500);return}
  INV[nama]=(INV[nama]||0)+1;setMap(f.x,f.y,'.');bip(520,.08,'sine',.05);say('+ '+it[1]+' '+nama);
  if(nama==='rokok'||nama==='boneka'||nama==='garam'&&epN===3)majuTugas(epN===1?2:1);if(nama==='lilin'&&INV.lilin>=3)majuTugas(1);if(nama==='palu')majuTugas(3);if(nama==='buku harian'){majuTugas(3);setTimeout(function(){run=false;tamat(true,skorNow())},500)}if(nama==='garam'&&epN===5&&INV.garam>=4)majuTugas(1);
  if(E.hantu.mulai==='boneka'&&nama==='boneka')spawnGhosts();upd();return}
 say('…')}
function setMap(x,y,c){var r=MAP[y].split('');r[x]=c;MAP[y]=r.join('')}
function skorNow(){return Math.floor(bat)*3+Math.max(0,200-hr)+tugasKe*150+(epN*100)}
function bicara(c){var n=E.npc[c],list=E.dialog[c];var d=null;for(var i=list.length-1;i>=0;i--){var s=list[i].syarat;if(!s||punya(s)){d=list[i];break}}if(!d)d=list[0];
 if(d.flag&&!FLAG[d.flag]){FLAG[d.flag]=true;if(epN!==2&&epN!==4)majuTugas(1);if(epN===5)majuTugas(2)}
 var opts=d.opsi.map(function(o){return {l:o[0],f:(function(act){return function(){jalankan(act,c)}})(o[1])}});
 dialog(n.ikon+' '+n.nama,d.teks,opts)}
function jalankan(act,c){var p=act.split(':');
 if(p[0]==='tutup')return;if(p[0]==='selesai'){if(tugasKe>=E.tugas.length||(epN===1&&punya('kunci'))){majuTugas(E.tugas.length);run=false;setTimeout(function(){tamat(true,skorNow())},400)}return}
 if(p[0]==='tukar'){var beri=p[1],dapat=p[2],n=+p[3]||1;if((INV[beri]||0)<n)return say('kamu belum punya '+beri);INV[beri]-=n;if(INV[beri]<=0)delete INV[beri];INV[dapat]=(INV[dapat]||0)+1;bip(700,.1,'sine',.05);bip(900,.1,'sine',.05);say('🔁 '+beri+' → '+dapat);if(epN===1)majuTugas(3);if(epN===2)majuTugas(2);if(epN===3)majuTugas(2);if(epN===4)majuTugas(2);upd();setTimeout(function(){bicara(c)},350);return}
 if(p[0]==='ambil'){INV[p[1]]=(INV[p[1]]||0)+1;say('+ '+p[1]);upd();return}
 if(E.cabang&&E.cabang[act]){dialog(E.npc[c].ikon+' '+E.npc[c].nama,E.cabang[act],[{l:'Lanjut',f:function(){bicara(c)}}])}}
/* ---------- hantu ---------- */
function spawnGhosts(){ghosts=[];for(var i=0;i<E.hantu.n;i++){var gx,gy,tries=0;do{gx=1+Math.floor(Math.random()*(MW-2));gy=1+Math.floor(Math.random()*(MH-2));tries++}while((tile(gx,gy)!=='.'||Math.hypot(gx-px,gy-py)<5)&&tries<200);ghosts.push({x:gx+.5,y:gy+.5,cd:0,see:0})}}
window.__mulai=function(ep){epN=ep;E=G.eps[ep-1];MAP=E.map.slice();MH=MAP.length;MW=MAP[0].length;px=E.start[0];py=E.start[1];pa=E.sa;bat=100;hr=70;INV={};FLAG={};lamp=!E.gelap;ghosts=[];pukulan=0;tugasKe=0;noise=0;jump=0;run=true;window.__running=true;t=0;
 if(E.hantu.mulai==='awal')spawnGhosts();upd();dialog('MALAM '+ep+' — '+E.judul,E.intro[E.intro.length-1]+'\n\n*Tugas:*\n'+E.tugas.map(function(x,i){return (i+1)+'. '+x}).join('\n'))};
function update(){if(!run||paused||dopen)return;t++;var sp=[.03,.038,.046][SET.get().cepat],rot=.038;
 if(keys.TL)pa-=rot;if(keys.TR)pa+=rot;var mx=0,my=0;if(keys.F){mx+=Math.cos(pa)*sp;my+=Math.sin(pa)*sp}if(keys.B){mx-=Math.cos(pa)*sp*.7;my-=Math.sin(pa)*sp*.7}if(keys.L){mx+=Math.cos(pa-1.5708)*sp*.8;my+=Math.sin(pa-1.5708)*sp*.8}if(keys.R){mx+=Math.cos(pa+1.5708)*sp*.8;my+=Math.sin(pa+1.5708)*sp*.8}
 var moving=mx||my;if(!solid(px+mx*4,py))px+=mx;if(!solid(px,py+my*4))py+=my;
 noise=Math.max(0,noise-.01);if(moving)noise=Math.min(1,noise+.02);if(lamp)noise=Math.min(1,noise+.005);
 if(lamp){bat-=E.gelap?.05:.03;if(bat<=0){bat=0;lamp=false;say('baterai senter habis')}}
 // hantu
 var near=99;ghosts.forEach(function(g){var d=Math.hypot(g.x-px,g.y-py);near=Math.min(near,d);var hear=noise>.3&&d<7||lamp&&d<9&&Math.abs(Math.atan2(g.y-py,g.x-px)-pa)<1;if(hear)g.see=120;if(g.see>0){g.see--;var a=Math.atan2(py-g.y,px-g.x);var s=E.hantu.cepat*(SET.get().cepat===0?.8:1);var nx=g.x+Math.cos(a)*s,ny=g.y+Math.sin(a)*s;if(!solid(nx,g.y))g.x=nx;if(!solid(g.x,ny))g.y=ny}else if(t%120===0){g.wa=Math.random()*6.28}else if(g.wa!==undefined){var nx2=g.x+Math.cos(g.wa)*E.hantu.cepat*.5,ny2=g.y+Math.sin(g.wa)*E.hantu.cepat*.5;if(!solid(nx2,ny2)){g.x=nx2;g.y=ny2}else g.wa=Math.random()*6.28}
  if(d<.7){hr=200}});
 // garam di ep3/5: taburkan otomatis jika hantu dekat & punya garam
 if(near<1.6&&(INV.garam||0)>0&&epN!==5&&t%30===0){INV.garam--;ghosts.forEach(function(g){g.see=0;g.x+=(g.x-px)*2;g.y+=(g.y-py)*2});say('🧂 garam ditaburkan! ia mundur');upd()}
 var target=70+(near<8?(8-near)*14:0)+(lamp?0:5);hr+=(target-hr)*.03;if(near<3&&t%(near<1.5?12:24)===0){bip(50,.08,'sine',.2);getar(15)}
 if(hr>=180){run=false;upd();return tamat(false,skorNow(),'Napas Nadia berhenti sesaat. Gelap. Saat sadar, ia di depan pintu depan lagi — rumah itu mengembalikannya. Coba lagi: berjalan pelan, matikan senter saat dekat, gunakan garam.')}
 if(t%6===0)upd()}
/* ---------- raycast render ---------- */
var ZB=new Float32Array(W);
function draw(){if(!E)return;ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 var fov=1.05,half=H/2,bob=Math.sin(t*.15)*(keys.F||keys.B?4:0);
 // langit-langit & lantai gradasi
 var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050304');g.addColorStop(.5,'#000');g.addColorStop(1,lamp?'#1a1208':'#050403');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 var maxd=lamp?11:(E.gelap?2.2:3.2);
 for(var c=0;c<W;c+=2){var ra=pa-fov/2+(c/W)*fov;var dx=Math.cos(ra),dy=Math.sin(ra);var mxi=px|0,myi=py|0;var ddx=Math.abs(1/dx),ddy=Math.abs(1/dy);var sx,sy,sdx,sdy;if(dx<0){sx=-1;sdx=(px-mxi)*ddx}else{sx=1;sdx=(mxi+1-px)*ddx}if(dy<0){sy=-1;sdy=(py-myi)*ddy}else{sy=1;sdy=(myi+1-py)*ddy}var hit=0,side=0,ch='#',n=0;
  while(!hit&&n<40){if(sdx<sdy){sdx+=ddx;mxi+=sx;side=0}else{sdy+=ddy;myi+=sy;side=1}ch=tile(mxi,myi);if(ch==='#'||ch==='+'||ch==='T'||ch==='G'||ch==='P')hit=1;n++}
  var dist=side?(sdy-ddy):(sdx-ddx);dist*=Math.cos(ra-pa);if(dist<.05)dist=.05;ZB[c]=dist;ZB[c+1]=dist;var h=H/dist;var y0=half-h/2+bob;
  var lit=Math.max(0,1-dist/maxd);if(lamp){var ang=Math.abs(ra-pa);lit*=Math.max(.15,1-ang*1.4)}lit*=side?.7:1;lit=Math.pow(lit,1.3)*(.9+Math.random()*.1);
  var base=ch==='+'?[120,80,40]:ch==='T'?[110,100,90]:ch==='G'||ch==='P'?[80,50,30]:[95,80,70];if(E.gelap)base=[70,65,60];
  var wx=side?px+dist/Math.cos(ra-pa)*dx:py+dist/Math.cos(ra-pa)*dy;wx-=Math.floor(wx);var stripe=((wx*6)|0)%2?1:.85;if(ch==='#'&&((wx*4|0)%2===0)&&Math.random()<.02)stripe*=1.6;
  ctx.fillStyle='rgb('+(base[0]*lit*stripe|0)+','+(base[1]*lit*stripe|0)+','+(base[2]*lit*stripe|0)+')';ctx.fillRect(c,y0,2,h);
  if(ch==='+'){ctx.fillStyle='rgba(200,160,60,'+(lit*.6)+')';if(wx>.45&&wx<.55)ctx.fillRect(c,y0+h*.5,2,h*.05)}
  if(ch==='T'){ctx.fillStyle='rgba(0,0,0,'+(.3+pukulan*.1)+')';ctx.fillRect(c,y0+h*.3,2,h*.4)}
  // lantai dekat: pantulan senter
  if(lamp&&dist<3){ctx.fillStyle='rgba(255,200,120,'+((3-dist)*.05)+')';ctx.fillRect(c,y0+h,2,H-(y0+h))}}
 // sprite: item, NPC, hantu
 var sprites=[];for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){var ch2=tile(x,y);if(ch2!=='.'&&ch2!=='#'&&ch2!=='+'&&ch2!=='T'&&ch2!=='G'&&ch2!=='P'&&ch2!==' '){if(E.npc&&E.npc[ch2])sprites.push({x:x+.5,y:y+.5,t:'npc',n:E.npc[ch2]});else if(E.item&&E.item[ch2]&&E.item[ch2].length)sprites.push({x:x+.5,y:y+.5,t:'item',ic:E.item[ch2][1],nm:E.item[ch2][0]})}}
 // pintu khusus (G,P) sebagai sprite ikon di depan tembok
 ghosts.forEach(function(gh){sprites.push({x:gh.x,y:gh.y,t:'ghost',see:gh.see})});
 sprites.forEach(function(s){s.d=Math.hypot(s.x-px,s.y-py)});sprites.sort(function(a,b){return b.d-a.d});
 sprites.forEach(function(s){var ang=Math.atan2(s.y-py,s.x-px)-pa;while(ang>Math.PI)ang-=6.283;while(ang<-Math.PI)ang+=6.283;if(Math.abs(ang)>fov/2+.3)return;var dist=s.d*Math.cos(ang);if(dist<.2)return;var sxp=W/2+Math.tan(ang)*(W/2)/Math.tan(fov/2);var sh=H/dist;var lit=Math.max(0,1-dist/maxd);if(lamp)lit*=Math.max(.2,1-Math.abs(ang)*1.4);if(s.t==='ghost')lit=Math.max(lit,dist<2.5?.5:0);
  var col=(sxp|0);if(col<0||col>=W||ZB[col-col%2]<dist)return;if(lit<=.02)return;
  ctx.save();ctx.globalAlpha=Math.min(1,lit*1.4);
  if(s.t==='item'){ctx.font=(sh*.35|0)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#ffd27a';ctx.shadowBlur=10;ctx.fillText(s.ic,sxp,half+sh*.35+bob);ctx.shadowBlur=0;if(dist<2){ctx.font='bold 11px Georgia';ctx.fillStyle='#e8dcc4';ctx.fillText(s.nm+' — AMBIL',sxp,half+sh*.42+bob)}}
  else if(s.t==='npc'){var w=sh*.32,hh=sh*.75,y0=half-hh*.4+bob;ctx.fillStyle='rgb('+(40*lit|0)+','+(30*lit|0)+','+(25*lit|0)+')';ctx.fillRect(sxp-w/2,y0+hh*.3,w,hh*.7);var f=s.n.wajah;ctx.fillStyle='rgb('+(f[0]*lit|0)+','+(f[1]*lit|0)+','+(f[2]*lit|0)+')';ctx.beginPath();ctx.arc(sxp,y0+hh*.18,w*.28,0,7);ctx.fill();if(!s.n.diam){ctx.fillStyle='#000';ctx.fillRect(sxp-w*.12,y0+hh*.15,w*.06,w*.06);ctx.fillRect(sxp+w*.06,y0+hh*.15,w*.06,w*.06)}if(dist<2){ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillStyle='#c8a24a';ctx.fillText(s.n.nama+' — BICARA',sxp,y0-6)}}
  else{var w2=sh*.4,h2=sh*.9,y2=half-h2*.45+bob+Math.sin(t*.1)*4;var gg=ctx.createLinearGradient(0,y2,0,y2+h2);gg.addColorStop(0,'rgba(230,230,235,'+lit+')');gg.addColorStop(1,'rgba(230,230,235,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.moveTo(sxp-w2/2,y2+h2);ctx.quadraticCurveTo(sxp-w2/2,y2,sxp,y2);ctx.quadraticCurveTo(sxp+w2/2,y2,sxp+w2/2,y2+h2);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(sxp-w2*.15,y2+h2*.18,w2*.07,w2*.12,0,0,7);ctx.ellipse(sxp+w2*.15,y2+h2*.18,w2*.07,w2*.12,0,0,7);ctx.ellipse(sxp,y2+h2*.34,w2*.08,w2*.16,0,0,7);ctx.fill()}
  ctx.restore()});
 // vignette + bising film
 var vg=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(lamp?.75:.92)+')');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 if(hr>120){ctx.fillStyle='rgba(120,0,0,'+((hr-120)/60*.35*(1+Math.sin(t*.3))/2)+')';ctx.fillRect(0,0,W,H)}
 for(var i=0;i<60;i++){ctx.fillStyle='rgba(255,255,255,'+(Math.random()*.06)+')';ctx.fillRect(Math.random()*W,Math.random()*H,2,2)}
 // senter kerucut UI
 if(lamp){ctx.fillStyle='rgba(255,220,150,.04)';ctx.beginPath();ctx.moveTo(W/2,H);ctx.lineTo(0,H*.25);ctx.lineTo(W,H*.25);ctx.fill()}
 // tugas
 ctx.fillStyle='rgba(14,10,8,.75)';rr(8,8,W-16,26,4);ctx.fill();ctx.fillStyle='#e8dcc4';ctx.font='12px Georgia';ctx.textAlign='left';ctx.fillText('MALAM '+epN+' · '+(E.tugas[tugasKe]?('tugas: '+E.tugas[tugasKe]):'selesaikan…'),16,26);
 var f=depan();if(f&&(E.npc&&E.npc[f.c]||E.item&&E.item[f.c]&&E.item[f.c].length)){ctx.fillStyle='#c8a24a';ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.fillText('[ BICARA / AMBIL ]',W/2,H-22)}
 // minimap kecil pojok
 var ms=4;ctx.save();ctx.globalAlpha=.55;ctx.translate(W-MW*ms-10,44);ctx.fillStyle='#000';ctx.fillRect(-2,-2,MW*ms+4,MH*ms+4);for(var yy=0;yy<MH;yy++)for(var xx=0;xx<MW;xx++){var cc=tile(xx,yy);if(cc==='#'){ctx.fillStyle='#4a3a30';ctx.fillRect(xx*ms,yy*ms,ms,ms)}else if(cc!=='.'){ctx.fillStyle=E.npc&&E.npc[cc]?'#c8a24a':'#8ad';ctx.fillRect(xx*ms,yy*ms,ms,ms)}}ctx.fillStyle='#fff';ctx.fillRect(px*ms-1.5,py*ms-1.5,3,3);ctx.restore()}
(function loop(){update();draw();requestAnimationFrame(loop)})();
`
}

/* ================================================================== */
/*  2. DESA PIXEL TERKUTUK                                             */
/* ================================================================== */
export const desapixel = {
  id: 'desapixel', cmd: '.desapixel', icon: '👻', nama: 'Desa Pixel Terkutuk (pixel-horror · 5 malam)', judul: 'DESA PIXEL TERKUTUK', sub: 'PIXEL HORROR · TOP-DOWN',
  ikon: '', ket: 'pixel-horror 8-bit top-down: desa terkutuk di malam hari, lentera, kewarasan, penduduk NPC yang bisa diajak bicara & barter, pocong/kuntilanak berpatroli. 5 malam',
  bgm: { bpm: 70, wave: 'square', bwave: 'triangle', lead: [64, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 62, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [36, 0, 0, 0, 0, 0, 0, 0, 35, 0, 0, 0, 0, 0, 0, 0], perc: 1, vol: .04, filt: 900, len: 2.2 },
  css: `html,body{background:#06060c}.menuwrap{--acc:#9ae66e;--accink:#0b1a08;--box:#0c0c18;--line:#9ae66e55;--ink:#e6e6f0;background:#06060c;font-family:"Courier New",monospace}
.dpx{min-height:420px;padding:14px;color:#e6e6f0;font-family:"Courier New",monospace;position:relative;overflow:hidden;background:#06060c;image-rendering:pixelated}
.dpx .sky{position:absolute;left:0;right:0;top:0;height:170px;background:linear-gradient(#0a0a1e,#141432);pointer-events:none}.dpx .moon{position:absolute;right:30px;top:20px;width:40px;height:40px;background:#e6e6c8;box-shadow:8px 0 0 #0a0a1e inset,0 0 20px #e6e6c866;pointer-events:none}
.dpx .vil{position:absolute;left:0;right:0;top:120px;height:60px;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 30px,#1a1a2a 30px 60px,transparent 60px 70px,#141424 70px 110px)}.dpx .vil:before{content:"";position:absolute;left:0;right:0;bottom:0;height:8px;background:#1f2a14}
.dpx .win{position:absolute;width:6px;height:6px;background:#ffcf5a;box-shadow:0 0 6px #ffcf5a;animation:wf 4s steps(2) infinite;pointer-events:none}@keyframes wf{50%{opacity:.2}}
.dpx .ttl{position:relative;margin-top:172px;text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;color:#9ae66e;text-shadow:3px 3px 0 #0b1a08,0 0 12px #9ae66e66}.dpx .ttl small{display:block;font-size:10px;color:#8a8aa0;letter-spacing:3px}
.dpx .box{position:relative;border:3px solid #e6e6f0;box-shadow:3px 3px 0 #000;background:#0c0c18;padding:10px;margin-top:10px;font-size:12px;line-height:1.6}.dpx .box h4{font-size:10px;letter-spacing:2px;color:#9ae66e;margin-bottom:6px}
.dpx .ep{display:flex;align-items:center;gap:8px;padding:6px 4px;font-size:12px;border-bottom:1px dashed #33334a}.dpx .ep:last-child{border:0}.dpx .ep i{width:26px;height:26px;background:#22223a;border:2px solid #e6e6f0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;flex:none}.dpx .ep.on i{background:#9ae66e;color:#0b1a08}.dpx .ep.lk{opacity:.4}.dpx .ep small{display:block;color:#8a8aa0;font-size:10px}.dpx .ep.on:before{content:"▶";color:#9ae66e;font-size:10px}
.dpx .go{position:relative;margin-top:12px;height:50px;border:3px solid #9ae66e;box-shadow:4px 4px 0 #000;background:#0b1a08;color:#9ae66e;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:2px;font-size:14px}.dpx .row3{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px}.dpx .row3 div{height:38px;border:2px solid #e6e6f0;box-shadow:3px 3px 0 #000;display:flex;align-items:center;justify-content:center;font-size:11px;background:#0c0c18}
.dpx .ft{position:relative;text-align:center;font-size:9px;color:#8a8aa0;margin-top:10px;letter-spacing:2px}
.hud .p,.hud .ps{background:#0c0c18;border:2px solid #e6e6f0;border-radius:0;box-shadow:2px 2px 0 #000;color:#e6e6f0;font-family:"Courier New",monospace}.hud .p span{color:#9ae66e}.frame{border:3px solid #e6e6f0;border-radius:4px;box-shadow:4px 4px 0 #000}canvas{image-rendering:pixelated}.dlg{background:#0c0c18;border:3px solid #e6e6f0;border-radius:0;box-shadow:4px 4px 0 #000;font-family:"Courier New",monospace}.dlg b.j{color:#9ae66e}.dlg .opts div{background:#22223a;border:2px solid #e6e6f0;border-radius:0}.toast{border-radius:0;border:2px solid #9ae66e;background:#0c0c18;font-family:"Courier New",monospace}.hint{color:#8a8aa0;font-family:"Courier New",monospace}
.dp{display:flex;justify-content:space-between;align-items:flex-end;padding:6px 2px}.dp .pad{display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(3,54px);gap:3px}.dp .k{border-radius:0;background:#22223a;border:2px solid #e6e6f0;box-shadow:2px 2px 0 #000;color:#e6e6f0;font-size:18px}.dp .k.dn{background:#9ae66e;color:#0b1a08}.dp .col{display:flex;flex-direction:column;gap:6px}.dp .col .k{width:96px;height:46px;font-size:11px;font-family:"Courier New",monospace;font-weight:700}.dp .k.act{background:#9ae66e;color:#0b1a08}`,
  splash: b => `<div class="dpx"><div class="sky"></div><div class="moon"></div><div class="vil"></div><div class="win" style="left:40px;top:150px"></div><div class="win" style="left:125px;top:146px"></div><div class="win" style="left:230px;top:152px;animation-delay:1s"></div><div class="ttl">DESA PIXEL<br>TERKUTUK<small>${b} · PIXEL HORROR</small></div><div class="box">Bus terakhir menurunkan <b>BIMA</b> di gerbang Desa Kalimati jam 23.40. Ia datang menjemput adiknya, <b>LARAS</b>, mahasiswi KKN yang sudah 9 hari tidak mengabari.<br><br>Papan di gerbang: <i>"JANGAN BERADA DI LUAR SETELAH KENTONGAN KE-3."</i><br><br>Kentongan pertama baru saja berbunyi.<br><br><b>▶ KETUK UNTUK MASUK DESA</b></div></div>`,
  menu: `function(S){var m=S.eps.map(function(e,i){var n=i+1;return '<div data-ep="'+n+'" class="ep '+(n===S.ep?'on':n>S.max?'lk':'')+'"><i>'+(n>S.max?'X':n)+'</i><div>MALAM '+n+' — '+e.judul+'<small>'+e.sub+'</small></div></div>'}).join('');
   return '<div class="dpx"><div class="sky" style="height:110px"></div><div class="moon" style="top:14px;width:28px;height:28px"></div><div class="vil" style="top:60px"></div><div class="win" style="left:40px;top:90px"></div><div class="win" style="left:125px;top:86px"></div><div class="ttl" style="margin-top:112px;font-size:18px">DESA PIXEL TERKUTUK<small>BUKU CATATAN BIMA · MALAM '+S.ep+'/5</small></div><div class="box"><h4>&gt; PILIH MALAM</h4>'+m+'</div><div class="box"><h4>&gt; STATUS</h4>Rekor kewarasan: <b>'+S.best+'</b><br>Bicara ke penduduk (tombol BICARA). Beberapa mau BARTER. Pocong mengikuti garis lurus; kuntilanak muncul kalau kewarasan rendah. Lentera = terlihat, tapi menjaga kewarasan.</div><div class="go" id="mPlay">&gt; MULAI MALAM '+S.ep+'</div><div class="row3"><div id="mStory">CATATAN</div><div id="mHow">CARA</div><div id="mSet">SETEL</div></div><div class="ft">'+S.brand+'</div></div>'}`,
  hud: '<div class="p"><small>WARAS</small><span id="hSan">100</span></div><div class="p"><small>MINYAK</small><span id="hOil">100</span></div><div class="p"><small>TAS</small><span id="hInv">0</span></div><div class="p"><small>TUGAS</small><span id="hQ">0/0</span></div>',
  kontrol: '<div class="dp"><div class="pad"><div class="k x"></div><div class="k" id="bU">▲</div><div class="k x"></div><div class="k" id="bL">◀</div><div class="k x"></div><div class="k" id="bR">▶</div><div class="k x"></div><div class="k" id="bD">▼</div><div class="k x"></div></div><div class="col"><div class="k" id="bLamp">🏮 LENTERA</div><div class="k act" id="bAct">BICARA/AMBIL</div><div class="k" id="bInv">🎒 TAS</div></div></div>',
  hint: '▲▼◀▶ jalan · BICARA/AMBIL saat bersebelahan · LENTERA: kewarasan naik tapi hantu melihatmu · sembunyi di rumah (pintu) saat pocong dekat',
  how: [['▲▼◀▶', 'berjalan (tile per tile)'], ['BICARA/AMBIL', 'menghadap penduduk = dialog dengan pilihan; menghadap benda = ambil'], ['🏮', 'lentera menyala: kewarasan pulih pelan, tapi hantu melihat dari jauh'], ['🎒', 'lihat tas; beberapa penduduk mau BARTER (dialog)'], ['👻 pocong', 'melompat lurus; kalau menyentuhmu kewarasan −30'], ['🚪', 'masuk pintu rumah = aman sebentar, hantu kehilangan jejak']],
  tujuan: 'Selesaikan tugas tiap malam sebelum kewarasan 0. Bicaralah dengan semua orang — tidak semuanya masih hidup.',
  tamat: 'Laras ditemukan di sumur tua, hidup, dijaga oleh seorang nenek yang ternyata sudah meninggal 30 tahun lalu — Mbah Sumi, yang selama ini menyembunyikan Laras dari Juragan Wiro dan kutukannya. Saat kentongan ke-3 dipukul Bima dengan tangannya sendiri, kutukan itu berbalik pada pembuatnya. Pagi datang. Desa Kalimati kosong — hanya Bima, Laras, dan bekas telapak kaki kecil di tanah basah yang menuju hutan.',
  eps: [
    { judul: 'Kentongan Pertama', sub: 'gerbang · warung · pos ronda', intro: ['*BIMA*, 26 tahun, masuk Desa Kalimati tengah malam. Sinyal hilang. Semua rumah gelap kecuali satu warung.', 'Pemilik warung, *YU MARNI*, terkejut. "Mas mau cari mahasiswi KKN? Mereka sudah pulang seminggu lalu, Mas… kecuali satu. Yang tinggal di rumah Mbah Sumi."', 'Tugas: bicara Yu Marni, ambil korek di pos ronda, tukar korek dengan minyak lentera, temukan peta desa di pos ronda.'],
      outro: ['Yu Marni memberi minyak dan bisikan: "Rumah Mbah Sumi di ujung utara. Tapi Mas — Mbah Sumi meninggal tahun 1994."', 'Kentongan kedua berbunyi. Di kejauhan, sesuatu yang putih melompat-lompat di antara pohon pisang.'],
      map: ['TTTTTTTTTTTTTTTT', 'T....TT........T', 'T.HHH.....HHH..T', 'T.HDH.....HDH..T', 'T..............T', 'T....W.........T', 'T..............T', 'TTT.....TTT....T', 'T.......T.k....T', 'T...HHH.TpT....T', 'T...HDH........T', 'T..............T', 'T......TT......T', 'TTTTTTTTTTTTTTTT'], start: [7, 12],
      npc: { W: { nama: 'YU MARNI', warna: [220, 120, 160], hidup: true } }, item: { k: ['korek', '🔥'], p: ['peta desa', '🗺️'] },
      tugas: ['bicara Yu Marni', 'ambil korek (pos ronda)', 'barter korek → minyak', 'ambil peta desa'], hantu: { pocong: 1, kunti: 0, cepat: 40 },
      dialog: { W: [
        { syarat: null, teks: '"Astaga, Mas! Malam-malam begini!" Ia menarik Bima masuk warung. "Adik Mas… Laras? Anak yang baik. Dia sering ke sini." Ia menunduk. "Mas butuh minyak lentera. Saya tukar dengan korek — korek saya habis, ada di pos ronda biasanya."', opsi: [['Ke mana Laras?', 'marni_laras'], ['Saya ambil koreknya.', 'tutup']], flag: 'W' },
        { syarat: 'korek', teks: '"Nah, ini dia." Ia menukar korek dengan botol minyak. "Jangan padamkan lentera kalau tidak perlu, Mas. Yang gelap-gelap itu… mereka suka orang yang takut."', opsi: [['Barter (korek → minyak)', 'tukar:korek:minyak'], ['Nanti.', 'tutup']] },
        { syarat: 'minyak', teks: '"Peta desa ada di pos ronda, di bawah kentongan. Ambil. Dan Mas—" suaranya turun, "—kalau ketemu Juragan Wiro, jangan terima apa pun darinya."', opsi: [['Baik, Yu.', 'selesai']] }
      ] },
      cabang: { marni_laras: '"Terakhir saya lihat dia lari ke utara, malam kentongan ketiga, sembilan hari lalu. Dikejar…" Ia tidak melanjutkan. "Korek, Mas. Tolong."' } },
    { judul: 'Juragan Wiro', sub: 'rumah besar · penawaran · jimat', intro: ['Peta menunjuk rumah besar di tengah desa: milik *JURAGAN WIRO*, kepala desa. Satu-satunya rumah dengan lampu.', 'Juragan Wiro menyambut hangat. Terlalu hangat. "Adikmu? Ah, mahasiswi cantik itu. Dia… memilih tinggal. Kau mau jimat? Gratis. Supaya aman malam ini."', 'Tugas: bicara Juragan Wiro (jangan terima jimat), cari *KUSNO* si penggali kubur di makam, tukar rokok dengan garis kapur, dan kabur dari pocong yang kini dua.'],
      outro: ['Kusno, dengan mata kosong, menggambar garis kapur di tanah. "Pocong tidak lewat garis ini. Juragan Wiro yang buat mereka, Mas. Dari orang-orang yang menolak menjual tanah."', '"Adik Mas menolak menandatangani surat tanah KKN-nya. Jadi Juragan… mau menjadikannya seperti kami." Kusno menatap tangannya sendiri yang tembus cahaya lentera.'],
      map: ['TTTTTTTTTTTTTTTT', 'T..............T', 'T..HHHHH..+.+..T', 'T..HHDHH..+.+..T', 'T..............T', 'T.....J........T', 'T..............T', 'T..HHH....HHH..T', 'T..HDH....HDH..T', 'T..............T', 'T...r....K.....T', 'T..+.+.+.+.+...T', 'T..+.+.+.+.+...T', 'TTTTTTTTTTTTTTTT'], start: [1, 1],
      npc: { J: { nama: 'JURAGAN WIRO', warna: [200, 170, 60], hidup: true }, K: { nama: 'KUSNO', warna: [140, 150, 170], hidup: false } }, item: { r: ['rokok', '🚬'] },
      tugas: ['bicara Juragan Wiro', 'temukan Kusno di makam', 'ambil rokok', 'barter rokok → kapur'], hantu: { pocong: 2, kunti: 0, cepat: 34 },
      dialog: { J: [
        { syarat: null, teks: '"Selamat datang, Nak Bima." Ia tahu nama Bima. "Ambil jimat ini. Gratis. Semua tamu desa memakainya." Jimat itu hangat, berdenyut seperti jantung.', opsi: [['Terima jimat', 'jimat_terima'], ['Tidak, terima kasih.', 'jimat_tolak']], flag: 'J' }
      ], K: [
        { syarat: null, teks: 'Lelaki itu menggali kubur — kuburnya sendiri, ada namanya di nisan. "Mas orang luar? Bagus. Saya butuh rokok. Sudah 6 tahun tidak merokok." Ia tertawa serak. "Saya kasih kapur. Kapur ini menahan pocong."', opsi: [['Kamu… sudah mati?', 'kusno_mati'], ['Saya carikan rokok.', 'tutup']], flag: 'K' },
        { syarat: 'rokok', teks: 'Ia menghirup asap yang tembus melewati dadanya. "Ah. Enak." Ia memberi sebatang kapur. "Gambar garis, pocong tidak lewat. Tiga kali pakai."', opsi: [['Barter (rokok → kapur)', 'tukar:rokok:kapur'], ['Sebentar.', 'tutup']] },
        { syarat: 'kapur', teks: '"Adik Mas di utara, rumah Mbah Sumi. Mbah Sumi orang baik — dulu. Sekarang dia yang menjaga Laras dari Juragan. Cepat, Mas, sebelum kentongan ketiga."', opsi: [['Terima kasih, Kusno.', 'selesai']] }
      ] },
      cabang: { jimat_terima: 'Jimat itu membakar telapak tangan Bima. Kewarasan −25. Juragan tersenyum lebar. "Bagus. Sekarang kau milik desa ini." Bima melemparnya ke lantai. Juragan tertawa. "Cari saja adikmu. Kau tidak akan keluar."|san:-25', jimat_tolak: 'Senyum Juragan menghilang sedetik. "Pintar. Seperti adikmu." Ia berbalik. "Pintar tidak menyelamatkan siapa pun di sini, Nak Bima."', kusno_mati: '"Enam tahun, Mas. Menolak jual tanah ke Juragan. Besoknya ditemukan di sumur. Sekarang saya kerja untuk dia — menggali untuk yang berikutnya." Ia menatap Bima. "Rokok, Mas."' } },
    { judul: 'Hutan Bambu', sub: 'kuntilanak · kewarasan · anak kecil', intro: ['Jalan ke utara melewati hutan bambu. Di sinilah kuntilanak — tawa dari atas pohon setiap kewarasan Bima turun.', 'Di tengah hutan, anak kecil *ADI* duduk di batu. "Om cari Kak Laras? Adi tahu jalan. Tapi Adi lapar. Adi mau kue."', 'Tugas: temukan 2 kue di rumah kosong, tukar dengan Adi untuk jalan rahasia, kumpulkan 3 bunga kenanga (pelindung), keluar dari hutan lewat gerbang utara.'],
      outro: ['Adi memakan kue itu tanpa mengunyah — kue jatuh menembus tubuhnya ke tanah. Ia tetap tersenyum. "Enak, Om. Adi lupa rasa kue."', '"Kak Laras di rumah Mbah Sumi. Mbah Sumi baik. Cuma Juragan yang bilang Mbah Sumi jahat, biar orang tidak ke sana." Ia menunjuk gerbang utara yang kini terbuka.'],
      map: ['TTTTTTTTTTTTTTTT', 'TTTTTTT.GTTTTTTT', 'T.b.TT....TTb..T', 'T..TT..TT..TT..T', 'T.....A........T', 'T.TT.....TT..TTT', 'T.HHH...T.HHH..T', 'T.HDH.c.T.HDH..T', 'T.......T......T', 'TT.TT.b.TT.TT..T', 'T..............T', 'T.HHH..c..HHH..T', 'T.HDH.....HDH..T', 'TTTTTTTTTTTTTTTT'], start: [7, 12],
      npc: { A: { nama: 'ADI', warna: [240, 220, 200], hidup: false } }, item: { c: ['kue', '🍪'], b: ['kenanga', '🌼'], G: ['gerbang utara', '⛩️'], keluar: 'G', butuhItem: 'jalan' },
      tugas: ['temukan 2 kue', 'barter kue → jalan rahasia', 'kumpulkan 3 kenanga', 'keluar gerbang utara'], hantu: { pocong: 1, kunti: 1, cepat: 36 },
      dialog: { A: [
        { syarat: null, teks: '"Om, Adi lapar. Kue di rumah kosong, biasanya Ibu simpan dua. Ibu sudah lama tidak pulang." Ia mengayun kaki yang tidak menyentuh tanah.', opsi: [['Di mana ibumu?', 'adi_ibu'], ['Om carikan kuenya.', 'tutup']], flag: 'A' },
        { syarat: 'kue:2', teks: '"Kue!" Matanya berbinar — terlalu terang. "Adi kasih tahu jalan rahasia ke gerbang utara. Tukar ya, Om?"', opsi: [['Barter (2 kue → jalan)', 'tukar:kue:jalan:2'], ['Sebentar.', 'tutup']] },
        { syarat: 'jalan', teks: '"Ambil bunga kenanga dulu, Om. Tiga. Kuntilanak tidak suka baunya. Terus lewat gerbang. Adi tidak bisa ikut — Adi cuma boleh sampai hutan."', opsi: [['Terima kasih, Adi.', 'selesai']] }
      ] },
      cabang: { adi_ibu: '"Ibu jual tanah ke Juragan, Om. Terus Ibu pergi ke kota. Adi ditinggal. Adi tunggu di sini, dari… Adi lupa tahun berapa." Ia tersenyum. "Kue, Om."' } },
    { judul: 'Rumah Mbah Sumi', sub: 'sumur · nenek · kebenaran', intro: ['Rumah Mbah Sumi: reyot, gelap, tapi ada bau kopi. Seorang nenek duduk di beranda, menjahit. Tembus cahaya lentera.', '"Kau kakaknya Laras," katanya tanpa menoleh. "Dia di sumur. Hidup. Aku sembunyikan dia dari Wiro 9 hari. Tapi kutukannya tidak bisa kuhentikan — hanya keluarga sedarah yang bisa memukul kentongan ketiga."', 'Tugas: bicara Mbah Sumi, temukan tali di gudang, tukar tali dengan kunci sumur, buka sumur dan bicara dengan Laras. Pocong Juragan mengepung rumah.'],
      outro: ['Laras di dasar sumur kering, pucat tapi hidup. "Kak… Juragan mau tanda tanganku. Kalau aku tanda tangan, tanah KKN jadi miliknya dan semua orang di desa ini jadi seperti Kusno selamanya."', 'Mbah Sumi di bibir sumur: "Kentongan ketiga di pos ronda. Pukul tiga kali, Nak Bima, dengan tanganmu. Wiro yang membuat aturan itu — biarkan aturannya memakannya sendiri."'],
      map: ['TTTTTTTTTTTTTTTT', 'T..HHHHHH......T', 'T..HH.M.HH..t..T', 'T..HH..D.HH....T', 'T..............T', 'T......S.......T', 'T..............T', 'T.HHH.....HHH..T', 'T.HDH.....HDH..T', 'T..............T', 'T....t.........T', 'T..HHH.........T', 'T..HDH.........T', 'TTTTTTTTTTTTTTTT'], start: [7, 12],
      npc: { M: { nama: 'MBAH SUMI', warna: [230, 230, 230], hidup: false }, S: { nama: 'SUMUR TUA', warna: [80, 80, 100], benda: true } }, item: { t: ['tali', '🪢'] },
      tugas: ['bicara Mbah Sumi', 'temukan 2 tali', 'barter tali → kunci sumur', 'buka sumur & bicara Laras'], hantu: { pocong: 3, kunti: 1, cepat: 30 },
      dialog: { M: [
        { syarat: null, teks: '"Duduk dulu, Nak. Kopinya tidak bisa kau minum, tapi baunya menenangkan." Kewarasan +15. "Sumur itu kukunci dari luar supaya Wiro tidak bisa turun. Kuncinya kuberikan kalau kau bawa tali — dua utas, di gudang. Laras butuh tali untuk naik."|san:15', opsi: [['Kenapa Mbah menolong Laras?', 'sumi_laras'], ['Saya ambil talinya.', 'tutup']], flag: 'M' },
        { syarat: 'tali:2', teks: '"Bagus." Kunci besi dingin berpindah ke tangan Bima. "Buka sumurnya. Bicara pada adikmu. Lalu lakukan yang harus dilakukan."', opsi: [['Barter (2 tali → kunci sumur)', 'tukar:tali:kunci sumur:2'], ['Sebentar.', 'tutup']] },
        { syarat: 'kunci sumur', teks: '"Pergilah. Aku tahan pocong-pocong itu di pagar. Tiga puluh tahun aku mati, Nak — aku tidak takut lagi pada apa pun."', opsi: [['…', 'selesai']] }
      ], S: [
        { syarat: null, teks: 'Sumur tua bertutup kayu, digembok. Dari dalam, samar: "…Kak…?"', opsi: [['Laras?!', 'tutup']] },
        { syarat: 'kunci sumur', teks: 'Gembok terbuka. Di dasar sumur kering, Laras memeluk lutut. "Kak Bima… kamu datang." Ia menangis. "Jangan tanda tangan apa pun dari Juragan, Kak. Apa pun."', opsi: [['Kakak tarik kamu naik.', 'laras_naik']] }
      ] },
      cabang: { sumi_laras: '"Karena 30 tahun lalu, aku yang pertama menolak menjual tanah pada ayahnya Wiro. Dan aku yang pertama masuk sumur." Ia tersenyum. "Laras mengingatkanku pada diriku."', laras_naik: 'Tali ditarik. Laras keluar, lemah tapi utuh. Ia memeluk Bima lama. Di belakang, pocong-pocong berhenti di garis pagar Mbah Sumi — tidak bisa lewat.|selesai' } },
    { judul: 'Kentongan Ketiga', sub: 'lari · seluruh desa · pos ronda', intro: ['Kentongan ketiga belum dipukul. Juragan Wiro berdiri di tengah desa, dan di sekelilingnya: semua pocong desa — semua yang pernah menolaknya. Ia tahu apa yang akan Bima lakukan.', '"Pukul kentongan itu, dan kau jadi bagian dari mereka," teriaknya. Mbah Sumi di belakang Bima: "Bohong. Aturan itu memakan pembuatnya. Lari, Nak. Aku dan Kusno dan Adi — kami akan buka jalan."', 'Tugas malam terakhir: kumpulkan 3 kentongan kecil dari 3 rumah (Yu Marni, Kusno, Adi — bicara mereka), bawa Laras, capai pos ronda, pukul kentongan 3 kali. Semua pocong mengejar.'],
      outro: ['Pukulan ketiga. Suara kentongan menggema seperti dipukul dari dalam dada seluruh desa. Pocong-pocong berhenti. Kain kafan mereka jatuh — hanya udara di baliknya.', 'Juragan Wiro berteriak — suaranya berubah menjadi suara puluhan orang yang pernah ia bungkam. Lalu ia terlipat, seperti kain, ke dalam kentongan.'],
      map: ['TTTTTTTTTTTTTTTT', 'T....W.........T', 'T.HHH.....HHH..T', 'T.HDH.....HDH..T', 'T.....K........T', 'T..............T', 'T.......A......T', 'TTT.....TTT....T', 'T.......T.R....T', 'T...HHH.TTT....T', 'T...HDH........T', 'T..............T', 'T......TT..L...T', 'TTTTTTTTTTTTTTTT'], start: [7, 12],
      npc: { W: { nama: 'YU MARNI', warna: [220, 120, 160], hidup: true }, K: { nama: 'KUSNO', warna: [140, 150, 170], hidup: false }, A: { nama: 'ADI', warna: [240, 220, 200], hidup: false }, L: { nama: 'LARAS', warna: [250, 200, 200], hidup: true }, R: { nama: 'KENTONGAN', warna: [120, 80, 40], benda: true } }, item: {},
      tugas: ['bicara Laras (ikut)', 'kumpulkan 3 kentongan kecil (Marni, Kusno, Adi)', 'pukul kentongan 3×'], hantu: { pocong: 4, kunti: 1, cepat: 28 },
      dialog: { L: [{ syarat: null, teks: '"Kak, aku ikut. Aku bisa jalan." Laras menggenggam tangan Bima. Kewarasan +20.|san:20', opsi: [['Ayo.', 'tutup']], flag: 'L' }],
        W: [{ syarat: null, teks: '"Kentongan kecil warung, Mas. Ambil. Dan Mas—Laras—" Yu Marni menangis, "—maafkan saya diam sembilan hari."', opsi: [['Ambil kentongan kecil', 'ambil:kentongan kecil']], flag: 'W' }],
        K: [{ syarat: null, teks: '"Kentongan penggali kubur." Kusno menyerahkannya. "Kalau ini berhasil, Mas, kubur saya baik-baik ya. Nisannya sudah ada."', opsi: [['Ambil kentongan kecil', 'ambil:kentongan kecil']], flag: 'K' }],
        A: [{ syarat: null, teks: '"Kentongan mainan Adi, Om." Anak itu tersenyum. "Kalau Adi hilang nanti, itu bukan hilang ya, Om. Itu pulang."', opsi: [['Ambil kentongan kecil', 'ambil:kentongan kecil']], flag: 'A' }],
        R: [{ syarat: null, teks: 'Kentongan besar pos ronda. Tiga kentongan kecil harus digantung dulu.', opsi: [['…', 'tutup']] }, { syarat: 'kentongan kecil:3', teks: 'Tiga kentongan kecil tergantung. Bima mengangkat pemukul. Laras memegang bahunya. Juragan Wiro berlari ke arah mereka.', opsi: [['PUKUL!', 'pukul']] }] },
      cabang: {} }
  ],
  js: R`
var W=480,H=600,TS=32,run=false,t=0,E=null,epN=1,MAP=[],MW=0,MH=0;
var px=0,py=0,fx=0,fy=1,san=100,oil=100,INV={},FLAG={},lamp=true,keys={},ghosts=[],kunti=null,tugasKe=0,pukul=0,moveCd=0,laras=false,inHouse=0,kapurLines=[];
function tile(x,y){var r=MAP[y];return r?r[x]||'T':'T'}
function walk(x,y){var c=tile(x,y);return c!=='T'&&c!=='H'&&c!=='+'&&!(E.npc&&E.npc[c])}
function setMap(x,y,c){var r=MAP[y].split('');r[x]=c;MAP[y]=r.join('')}
['U','D','L','R'].forEach(function(k){hold('b'+k,function(){keys[k]=1},function(){keys[k]=0})});
tap('bLamp',function(){lamp=!lamp;bip(300,.05,'square',.05);say('lentera '+(lamp?'menyala':'padam'))});tap('bInv',function(){tas()});tap('bAct',function(){aksi()});
var KM={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R'};document.addEventListener('keydown',function(e){if(KM[e.key]){keys[KM[e.key]]=1;e.preventDefault()}if(e.key==='e')aksi();if(e.key==='f')lamp=!lamp});document.addEventListener('keyup',function(e){if(KM[e.key])keys[KM[e.key]]=0});
function invN(){var n=0;for(var k in INV)n+=INV[k];return n}function punya(s){var p=String(s).split(':');return (INV[p[0]]||0)>=(+p[1]||1)}
function tas(){if(!run||dopen)return;var l=[];for(var k in INV)if(INV[k]>0)l.push('> '+k+' x'+INV[k]);dialog('TAS BIMA',l.length?l.join('\n'):'(kosong)')}
function upd(){I('hSan').textContent=san|0;I('hSan').style.color=san<35?'#ff5c5c':'';I('hOil').textContent=oil|0;I('hInv').textContent=invN();I('hQ').textContent=tugasKe+'/'+E.tugas.length}
function majuTugas(n){if(n>tugasKe){tugasKe=n;say('> '+E.tugas[n-1]+' [OK]');bip(660,.1,'square',.04);upd()}}
function skorNow(){return Math.floor(san)*4+tugasKe*150+epN*100+Math.floor(oil)}
function depan(){return {x:px+fx,y:py+fy,c:tile(px+fx,py+fy)}}
function aksi(){if(!run||dopen||paused)return;var f=depan(),c=f.c;
 if(E.npc&&E.npc[c])return bicara(c);
 if(c==='D'){inHouse=180;say('sembunyi di rumah… hantu kehilangan jejak');ghosts.forEach(function(g){g.see=0});san=Math.min(100,san+8);upd();return}
 if(E.item&&E.item[c]){var it=E.item[c];if(E.item.keluar===c){if(!punya(E.item.butuhItem))return say('butuh '+E.item.butuhItem+' dari Adi');if((INV.kenanga||0)<3)return say('butuh 3 kenanga (punya '+(INV.kenanga||0)+')');majuTugas(E.tugas.length);setTimeout(function(){run=false;tamat(true,skorNow())},500);return}
  INV[it[0]]=(INV[it[0]]||0)+1;setMap(f.x,f.y,'.');bip(520,.08,'square',.04);say('+ '+it[1]+' '+it[0]);
  if(it[0]==='korek')majuTugas(2);if(it[0]==='peta desa'){majuTugas(4);setTimeout(function(){run=false;tamat(true,skorNow())},500)}if(it[0]==='rokok')majuTugas(3);if(it[0]==='kue'&&INV.kue>=2)majuTugas(1);if(it[0]==='kenanga'&&INV.kenanga>=3)majuTugas(3);if(it[0]==='tali'&&INV.tali>=2)majuTugas(2);upd();return}
 if((INV.kapur||0)>0&&c==='.'){INV.kapur--;setMap(f.x,f.y,'=');say('garis kapur digambar');upd();return}
 say('...')}
function bicara(c){var n=E.npc[c],list=E.dialog[c];var d=null;for(var i=list.length-1;i>=0;i--){var s=list[i].syarat;if(!s||punya(s)){d=list[i];break}}if(!d)d=list[0];
 if(d.flag&&!FLAG[d.flag]){FLAG[d.flag]=true;if(epN===1&&c==='W')majuTugas(1);if(epN===2&&c==='J')majuTugas(1);if(epN===2&&c==='K')majuTugas(2);if(epN===4&&c==='M')majuTugas(1);if(epN===5&&c==='L'){majuTugas(1);laras=true}}
 var teks=d.teks,eff=null;if(teks.indexOf('|')>=0){var sp=teks.split('|');teks=sp[0];eff=sp[1]}if(eff)efek(eff);
 var opts=d.opsi.map(function(o){return {l:o[0],f:(function(act){return function(){jalankan(act,c)}})(o[1])}});
 dialog((n.hidup?'':'')+n.nama+(n.hidup===false?' (?)':''),teks,opts)}
function efek(e){var p=e.split(':');if(p[0]==='san'){san=Math.max(0,Math.min(100,san+(+p[1])));upd()}if(p[0]==='selesai'){majuTugas(E.tugas.length);setTimeout(function(){run=false;tamat(true,skorNow())},600)}}
function jalankan(act,c){var p=act.split(':');if(p[0]==='tutup')return;if(p[0]==='selesai'){if(tugasKe>=E.tugas.length){run=false;setTimeout(function(){tamat(true,skorNow())},400)}return}
 if(p[0]==='tukar'){var beri=p[1],dapat=p[2],n=+p[3]||1;if((INV[beri]||0)<n)return say('belum punya '+beri);INV[beri]-=n;if(INV[beri]<=0)delete INV[beri];INV[dapat]=(INV[dapat]||0)+1;bip(700,.1,'square',.04);bip(900,.1,'square',.04);say('BARTER: '+beri+' -> '+dapat);if(epN===1)majuTugas(3);if(epN===2)majuTugas(4);if(epN===3)majuTugas(2);if(epN===4)majuTugas(3);if(epN===2&&dapat==='kapur'){setTimeout(function(){run=false;tamat(true,skorNow())},900)}upd();setTimeout(function(){bicara(c)},300);return}
 if(p[0]==='ambil'){INV[p[1]]=(INV[p[1]]||0)+1;say('+ '+p[1]);if(epN===5&&(INV['kentongan kecil']||0)>=3)majuTugas(2);upd();return}
 if(p[0]==='pukul'){pukul++;bip(150,.3,'square',.15);getar(120);say('KENTONGAN '+pukul+'/3');ghosts.forEach(function(g){g.see=0;g.x=1;g.y=1});if(pukul>=3){majuTugas(3);setTimeout(function(){run=false;tamat(true,skorNow())},800)}else setTimeout(function(){bicara(c)},600);return}
 if(E.cabang&&E.cabang[act]){setTimeout(function(){var tx=E.cabang[act],ef=null;if(tx.indexOf('|')>=0){var sp=tx.split('|');tx=sp[0];ef=sp[1]}dialog(E.npc[c].nama,tx,[{l:'Lanjut',f:function(){if(ef==='selesai'){majuTugas(E.tugas.length);run=false;setTimeout(function(){tamat(true,skorNow())},400);return}if(ef)efek(ef);bicara(c)}}])},60)}else if(E.cabang){dialog(E.npc[c].nama,'…',[{l:'Lanjut',f:function(){}}])}}
function spawnGhosts(){ghosts=[];for(var i=0;i<E.hantu.pocong;i++){var gx,gy,k=0;do{gx=1+Math.floor(Math.random()*(MW-2));gy=1+Math.floor(Math.random()*(MH-2));k++}while((!walk(gx,gy)||Math.abs(gx-px)+Math.abs(gy-py)<6)&&k<300);ghosts.push({x:gx,y:gy,cd:0,see:0,dir:[[1,0],[-1,0],[0,1],[0,-1]][i%4]})}kunti=E.hantu.kunti?{x:-9,y:-9,on:0}:null}
window.__mulai=function(ep){epN=ep;E=G.eps[ep-1];MAP=E.map.slice();MH=MAP.length;MW=MAP[0].length;px=E.start[0];py=E.start[1];fx=0;fy=-1;san=100;oil=100;INV={};FLAG={};lamp=true;tugasKe=0;pukul=0;laras=false;inHouse=0;run=true;window.__running=true;t=0;spawnGhosts();upd();
 dialog('MALAM '+ep+' — '+E.judul,E.intro[E.intro.length-1]+'\n\n*Tugas:*\n'+E.tugas.map(function(x,i){return (i+1)+'. '+x}).join('\n'))};
function update(){if(!run||paused||dopen)return;t++;var cd=[9,7,6][SET.get().cepat];
 if(moveCd>0)moveCd--;else{var dx=0,dy=0;if(keys.U){dy=-1}else if(keys.D){dy=1}else if(keys.L){dx=-1}else if(keys.R){dx=1}if(dx||dy){fx=dx;fy=dy;if(walk(px+dx,py+dy)){px+=dx;py+=dy;moveCd=cd;if(t%2===0)bip(90,.03,'square',.02)}}}
 if(inHouse>0)inHouse--;
 if(lamp){oil-=.015;if(oil<=0){oil=0;lamp=false;say('minyak habis')}san=Math.min(100,san+.01)}else san-=.02;
 // pocong: lompat lurus, belok saat mentok; melihat pemain jika lentera/garis lurus
 ghosts.forEach(function(g){g.cd++;var speed=E.hantu.cepat;if(g.see>0)speed=Math.max(10,speed*.5);if(g.cd<speed)return;g.cd=0;
  var see=inHouse<=0&&((lamp&&Math.abs(g.x-px)+Math.abs(g.y-py)<9)||(g.x===px&&Math.abs(g.y-py)<7)||(g.y===py&&Math.abs(g.x-px)<7));if(see)g.see=8;
  var nx,ny;if(g.see>0){g.see--;var ddx=px-g.x,ddy=py-g.y;if(Math.abs(ddx)>Math.abs(ddy)){nx=g.x+Math.sign(ddx);ny=g.y}else{nx=g.x;ny=g.y+Math.sign(ddy)}}else{nx=g.x+g.dir[0];ny=g.y+g.dir[1]}
  if(walk(nx,ny)&&tile(nx,ny)!=='='){g.x=nx;g.y=ny}else{g.dir=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)]}
  if(g.x===px&&g.y===py&&inHouse<=0){san-=30;getar(150);bip(60,.4,'sawtooth',.2);say('POCONG MENYENTUHMU! -30');g.x=1;g.y=1;g.see=0;upd()}});
 if(kunti){if(san<50&&!kunti.on&&t%240===0){kunti.on=200;kunti.x=px+(Math.random()<.5?-4:4);kunti.y=py-3;bip(1400,.4,'sine',.06);say('...hihihi...')}if(kunti.on>0){kunti.on--;if(t%20===0){var kx=Math.sign(px-kunti.x),ky=Math.sign(py-kunti.y);kunti.x+=kx;kunti.y+=ky}if(Math.abs(kunti.x-px)+Math.abs(kunti.y-py)<=1&&inHouse<=0){san-=(INV.kenanga?4:12);kunti.on=0;say(INV.kenanga?'kenanga melindungimu':'KUNTILANAK! kewarasan turun');getar(100)}}}
 if(san<=0){run=false;upd();return tamat(false,skorNow(),'Bima tertawa. Terus tertawa. Pagi hari, penduduk menemukannya duduk di pos ronda, memukul kentongan tanpa suara. Coba lagi: nyalakan lentera lebih sering, sembunyi di pintu rumah (D), gambar kapur.')}
 if(t%8===0)upd()}
/* ---------- render pixel ---------- */
function px8(x,y,c){ctx.fillStyle=c;ctx.fillRect(x,y,4,4)}
function sprite(sx,sy,rows,pal){for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++){var k=rows[r][c];if(k!=='.'&&pal[k])px8(sx+c*4,sy+r*4,pal[k])}}
var SPR={bima:['..1111..','..1221..','..1221..','.333333.','.344443.','.333333.','..5..5..','..5..5..'],laras:['..1111..','..1661..','.111111.','.777777.','.788887.','.777777.','..7..7..','..5..5..'],pocong:['..0000..','.099990.','.098890.','.099990.','.099990.','.099990.','.099990.','..0000..'],kunti:['.aaaaaa.','aaa66aaa','aa6bb6aa','aaa66aaa','.aaaaaa.','..aaaa..','.aaaaaa.','aaaaaaaa'],npc:['..1111..','..1221..','..1221..','.cccccc.','.cddddc.','.cccccc.','..5..5..','..5..5..'],mati:['..eeee..','..e22e..','..e22e..','.eeeeee.','.effffe.','.eeeeee.','..e..e..','........'],pohon:['...gg...','..gggg..','.gggggg.','gggggggg','.gggggg.','...hh...','...hh...','...hh...'],rumah:['...ii...','..iiii..','.iiiiii.','jjjjjjjj','jkkjjkkj','jkkjjkkj','jjjjjjjj','jjjjjjjj'],pintu:['jjjjjjjj','jjllllj','jjlmmljj','jjlmmljj','jjlmmljj','jjlmmljj','jjlmmljj','jjllllj'],makam:['...nn...','..nnnn..','..noon..','..nnnn..','..nnnn..','..nnnn..','.nnnnnn.','........'],item:['........','...pp...','..pqqp..','..pqqp..','...pp...','........','........','........'],kentong:['..rrrr..','.rssssr.','.rs..sr.','.rs..sr.','.rs..sr.','.rssssr.','..rrrr..','...tt...'],sumur:['.uuuuuu.','uvvvvvvu','uv....vu','uv....vu','uv....vu','uv....vu','uvvvvvvu','.uuuuuu.']};
var PAL={0:'#e8e8f0',1:'#2b2b3a',2:'#f0c8a0',3:'#3060a0',4:'#4080c0',5:'#503020',6:'#101018',7:'#c05070',8:'#e07090',9:'#f6f6ff',a:'#f0f0f6',b:'#ff2020',c:'#8a4a2a',d:'#a06040',e:'#9aa0b0',f:'#b0b8c8',g:'#1e3a1a',h:'#3a2a18',i:'#5a2a1a',j:'#6a5040',k:'#ffcf5a',l:'#2a1a10',m:'#100a06',n:'#606070',o:'#303040',p:'#ffd070',q:'#fff0a0',r:'#5a3a1a',s:'#8a5a2a',t:'#3a2a1a',u:'#505060',v:'#202030'};
function draw(){if(!E)return;var camx=px*TS-W/2+TS/2,camy=py*TS-H/2+TS/2;camx=Math.max(0,Math.min(MW*TS-W,camx));camy=Math.max(0,Math.min(MH*TS-H,camy));
 ctx.fillStyle='#0a1408';ctx.fillRect(0,0,W,H);
 for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){var sx=x*TS-camx,sy=y*TS-camy;if(sx<-TS||sy<-TS||sx>W||sy>H)continue;var c=tile(x,y);
  ctx.fillStyle=((x+y)%2)?'#101e0c':'#0e1a0b';ctx.fillRect(sx,sy,TS,TS);if(((x*7+y*13)%5)===0){ctx.fillStyle='#16260f';ctx.fillRect(sx+8,sy+12,4,4);ctx.fillRect(sx+20,sy+22,4,4)}
  if(c==='T')sprite(sx,sy,SPR.pohon,PAL);else if(c==='H')sprite(sx,sy,SPR.rumah,PAL);else if(c==='D')sprite(sx,sy,SPR.pintu,PAL);else if(c==='+')sprite(sx,sy,SPR.makam,PAL);else if(c==='='){ctx.fillStyle='#f0f0f0';ctx.fillRect(sx+2,sy+14,28,4)}
  else if(E.npc&&E.npc[c]){var n=E.npc[c];if(n.benda){sprite(sx,sy,c==='S'?SPR.sumur:SPR.kentong,PAL)}else{var p2=Object.assign({},PAL);p2.c='rgb('+n.warna.join(',')+')';p2.d=p2.c;if(n.hidup===false){p2.e='rgba('+n.warna.join(',')+',.8)';ctx.globalAlpha=.7+Math.sin(t*.1)*.2;sprite(sx,sy,SPR.mati,p2);ctx.globalAlpha=1}else sprite(sx,sy,SPR.npc,p2)}}
  else if(E.item&&E.item[c]&&E.item[c].length){sprite(sx,sy+Math.sin(t*.1)*2,SPR.item,PAL);ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText(E.item[c][1],sx+TS/2,sy+TS/2+5)}}
 // pemain (+ laras mengikuti)
 if(laras)sprite(px*TS-camx-fx*TS,py*TS-camy-fy*TS,SPR.laras,PAL);
 sprite(px*TS-camx,py*TS-camy+(moveCd>0?-2:0),SPR.bima,PAL);
 if(lamp){ctx.fillStyle='#ffcf5a';ctx.fillRect(px*TS-camx+(fx>0?30:fx<0?-2:14),py*TS-camy+16,4,6)}
 ghosts.forEach(function(g){var gx=g.x*TS-camx,gy=g.y*TS-camy+(g.cd<4?-6:0);ctx.globalAlpha=.9;sprite(gx,gy,SPR.pocong,PAL);ctx.globalAlpha=1;if(g.see>0){ctx.fillStyle='#ff2020';ctx.font='bold 12px monospace';ctx.fillText('!',gx+14,gy-4)}});
 if(kunti&&kunti.on>0){ctx.globalAlpha=.5+Math.sin(t*.3)*.3;sprite(kunti.x*TS-camx,kunti.y*TS-camy,SPR.kunti,PAL);ctx.globalAlpha=1}
 // kegelapan + lentera
 ctx.save();ctx.fillStyle='rgba(2,2,10,'+(lamp?.78:.93)+')';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='destination-out';var cxp=px*TS-camx+TS/2,cyp=py*TS-camy+TS/2;var rad=lamp?150+Math.sin(t*.2)*6:55;var rg=ctx.createRadialGradient(cxp,cyp,10,cxp,cyp,rad);rg.addColorStop(0,'rgba(0,0,0,.95)');rg.addColorStop(.6,'rgba(0,0,0,.5)');rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
 // jendela rumah bercahaya & NPC hidup memancarkan cahaya kecil
 for(var y2=0;y2<MH;y2++)for(var x2=0;x2<MW;x2++){var c2=tile(x2,y2);if(c2==='D'||(E.npc&&E.npc[c2]&&E.npc[c2].hidup)){var rg2=ctx.createRadialGradient(x2*TS-camx+16,y2*TS-camy+16,4,x2*TS-camx+16,y2*TS-camy+16,60);rg2.addColorStop(0,'rgba(0,0,0,.6)');rg2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg2;ctx.fillRect(x2*TS-camx-50,y2*TS-camy-50,130,130)}}
 ctx.restore();
 if(san<40){ctx.fillStyle='rgba(120,0,0,'+((40-san)/40*.3*(1+Math.sin(t*.25))/2)+')';ctx.fillRect(0,0,W,H)}
 if(san<60&&Math.random()<.03){ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,Math.random()*H,W,3)}
 // scanline & HUD
 ctx.fillStyle='rgba(0,0,0,.12)';for(var s=0;s<H;s+=4)ctx.fillRect(0,s,W,1);
 ctx.fillStyle='#0c0c18';ctx.fillRect(6,6,W-12,24);ctx.strokeStyle='#e6e6f0';ctx.lineWidth=2;ctx.strokeRect(6,6,W-12,24);ctx.fillStyle='#e6e6f0';ctx.font='bold 12px "Courier New",monospace';ctx.textAlign='left';ctx.fillText('> MALAM '+epN+' | '+(E.tugas[tugasKe]||'selesai').toUpperCase(),14,23);
 var f=depan();if(f&&(E.npc&&E.npc[f.c]||E.item&&E.item[f.c]||f.c==='D')){ctx.fillStyle='#9ae66e';ctx.textAlign='center';ctx.fillText(f.c==='D'?'[ MASUK RUMAH ]':'[ BICARA / AMBIL ]',W/2,H-14)}
 if(inHouse>0){ctx.fillStyle='rgba(154,230,110,.9)';ctx.textAlign='right';ctx.fillText('SEMBUNYI '+Math.ceil(inHouse/60),W-12,H-14)}}
(function loop(){update();draw();requestAnimationFrame(loop)})();
`
}

export default { rumah13, desapixel }
