/**
 * lib/htmlgames15neon.js — NEON DRIFT: KOTA TANPA TIDUR (v7.19.0)
 * ------------------------------------------------------------------
 *  Game balap/mengemudi 3D open world bertema neon dengan cerita 6 episode.
 *  Dibangun di atas framework episode lib/htmlgames15.js (splash → prolog →
 *  menu garasi → misi → radio dialog → epilog → kode episode).
 *
 *  Grafik : renderer poligon 3D sendiri (painter's algorithm, near-clip),
 *           kota prosedural tanpa batas, gedung neon, lampu jalan, papan
 *           iklan, hujan, pantulan basah, kabut, siang/senja/malam.
 *  Gameplay: kemudi, gas/rem, nitro, drift, lalu lintas, polisi (kejar-kejaran),
 *           checkpoint + panah navigasi + minimap, misi berbeda tiap episode.
 */
const R = String.raw

export const neondrift = {
  id: 'neondrift', cmd: '.neondrift', icon: '🏎️', nama: 'Neon Drift: Kota Tanpa Tidur (open world 3D · 6 ep)', judul: 'NEON DRIFT', sub: 'KOTA TANPA TIDUR',
  ikon: '', ket: 'mengemudi 3D open world neon: kurir malam, kejar-kejaran polisi, balapan liar, kabur dari geng. Kisah Reza & bengkel almarhum ayahnya. 6 episode',
  bgm: { bpm: 124, wave: 'sawtooth', bwave: 'square', lead: [69, 0, 69, 72, 0, 76, 0, 0, 74, 0, 72, 0, 69, 0, 0, 0, 67, 0, 67, 71, 0, 74, 0, 0, 72, 0, 71, 0, 69, 0, 0, 0], bass: [45, 45, 0, 45, 0, 45, 45, 0, 43, 43, 0, 43, 0, 43, 43, 0, 41, 41, 0, 41, 0, 41, 41, 0, 43, 43, 0, 43, 0, 43, 43, 0], perc: 1, vol: .05, filt: 1800, len: 1.2 },
  css: `html,body{background:#05030f}.menuwrap{--acc:#ff2bd6;--accink:#1a0316;--box:rgba(20,6,40,.85);--line:#ff2bd655;--ink:#ffe9fb;background:linear-gradient(180deg,#0b0420,#05030f 60%,#120a2a)}
.gar{min-height:420px;padding:14px;color:#ffe9fb;position:relative;overflow:hidden;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.gar .grid{position:absolute;left:-20%;right:-20%;bottom:0;height:46%;background-image:linear-gradient(#ff2bd655 1px,transparent 1px),linear-gradient(90deg,#00e5ff55 1px,transparent 1px);background-size:40px 40px;transform:perspective(300px) rotateX(60deg);transform-origin:bottom;pointer-events:none;animation:gmv 2.5s linear infinite}
@keyframes gmv{to{background-position:0 40px,0 0}}
.gar .sun{position:absolute;left:50%;top:22px;width:150px;height:150px;margin-left:-75px;border-radius:50%;background:linear-gradient(180deg,#ffb74d,#ff2bd6 60%,#7c3aed);box-shadow:0 0 60px #ff2bd688;pointer-events:none;-webkit-mask:repeating-linear-gradient(#000 0 12px,transparent 12px 18px);mask:repeating-linear-gradient(#000 0 12px,transparent 12px 18px)}
.gar .ttl{position:relative;text-align:center;margin-top:120px}.gar .ttl b{display:block;font-size:34px;font-weight:900;letter-spacing:6px;font-style:italic;background:linear-gradient(180deg,#fff,#ff9be9 50%,#ff2bd6);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 14px #ff2bd6aa)}.gar .ttl small{display:block;font-size:10px;letter-spacing:6px;color:#00e5ff;text-shadow:0 0 10px #00e5ff}
.gar .card{position:relative;background:rgba(10,4,28,.85);border:1px solid #ff2bd644;border-radius:14px;padding:12px;margin-top:12px;backdrop-filter:blur(4px)}.gar h4{font-size:10px;letter-spacing:3px;color:#00e5ff;margin-bottom:8px;font-weight:800}
.gar .car{display:flex;align-items:center;gap:12px}.gar .car .pic{width:110px;height:56px;position:relative;flex:none}.gar .car .body{position:absolute;left:8px;right:8px;top:18px;height:22px;background:linear-gradient(180deg,#ff2bd6,#8b1a75);border-radius:6px 14px 4px 4px;box-shadow:0 0 16px #ff2bd688}.gar .car .top{position:absolute;left:34px;right:30px;top:8px;height:14px;background:#1b0a2e;border-radius:6px 8px 0 0;border:2px solid #ff9be9}.gar .car .wh{position:absolute;bottom:4px;width:18px;height:18px;border-radius:50%;background:#111;border:3px solid #00e5ff;box-shadow:0 0 8px #00e5ff}.gar .car .st{font-size:11px;color:#ffb3f0;line-height:1.6}.gar .car .st b{color:#fff}
.gar .bar{height:5px;border-radius:3px;background:#2a1040;overflow:hidden;margin-top:3px}.gar .bar i{display:block;height:100%;background:linear-gradient(90deg,#00e5ff,#ff2bd6)}
.gar .ms{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;border:1px solid #ff2bd633;margin-bottom:5px;font-size:12px;font-weight:700;background:rgba(255,43,214,.06)}.gar .ms i{width:34px;height:34px;border-radius:9px;background:#1b0a2e;display:flex;align-items:center;justify-content:center;font-style:normal;border:1px solid #00e5ff55}.gar .ms.on{border-color:#00e5ff;background:rgba(0,229,255,.1);box-shadow:0 0 14px #00e5ff44}.gar .ms.lk{opacity:.4}.gar .ms small{display:block;font-weight:400;color:#ff9be9;font-size:10px}.gar .ms em{margin-left:auto;font-style:normal;font-size:10px;color:#00e5ff;letter-spacing:1px}
.gar .go{position:relative;margin-top:12px;height:56px;border-radius:12px;background:linear-gradient(90deg,#ff2bd6,#7c3aed);color:#fff;font-weight:900;letter-spacing:3px;font-style:italic;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 24px #ff2bd677,inset 0 -3px 0 rgba(0,0,0,.3)}.gar .row3{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px}.gar .row3 div{height:42px;border-radius:10px;border:1px solid #00e5ff66;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#00e5ff;background:rgba(0,229,255,.06)}
.gar .foot{position:relative;text-align:center;font-size:9px;letter-spacing:3px;color:#ff9be988;margin-top:10px}
.hud .p,.hud .ps{background:rgba(10,4,28,.85);border:1px solid #ff2bd655;color:#ffe9fb}.hud .p span{color:#00e5ff;font-family:ui-monospace,Menlo,monospace}.frame{border:2px solid #ff2bd655;box-shadow:0 0 30px #ff2bd633}.dlg{background:rgba(10,4,28,.95);border-color:#00e5ff}.dlg b.j{color:#ff2bd6}.dlg .opts div{background:rgba(0,229,255,.1);border:1px solid #00e5ff66}.toast{border-color:#ff2bd6}
.nd{display:flex;justify-content:space-between;align-items:flex-end;padding:6px 2px}.nd .col{display:flex;flex-direction:column;gap:6px;align-items:center}.nd .k{width:70px;height:58px;border-radius:14px;font-size:20px;background:rgba(255,43,214,.12);border:1px solid #ff2bd666;color:#ffe9fb}.nd .k.dn{background:rgba(255,43,214,.45)}.nd .wheel{display:flex;gap:8px}.nd .wheel .k{width:84px;height:66px;font-size:26px}
.nd .k.gas{background:linear-gradient(180deg,#00e5ff,#0a7fa0);color:#03141a;border:0;width:84px;height:84px;border-radius:50%;font-size:14px;font-weight:900;letter-spacing:1px}.nd .k.gas.dn{background:linear-gradient(180deg,#8ff5ff,#00b6d1)}.nd .k.brk{background:linear-gradient(180deg,#ff2bd6,#8b1a75);border:0;width:70px;height:70px;border-radius:50%;font-size:13px;font-weight:900}.nd .k.nos{background:linear-gradient(180deg,#ffb74d,#f57c00);color:#2a1200;border:0;width:64px;height:44px;font-size:12px;font-weight:900}.nd .k.nos.dn{background:#ffe082}.hint{color:#ff9be9}`,
  splash: b => `<div class="gar"><div class="sun"></div><div class="grid"></div><div class="ttl"><small>${b} PRESENTS</small><b>NEON DRIFT</b><small>KOTA TANPA TIDUR</small></div><div class="card" style="text-align:center;font-size:12px;line-height:1.7;color:#ffb3f0">Bengkel <b style="color:#fff">"MAHESA MOTOR"</b> akan disita bank dalam 6 malam.<br>Satu-satunya yang tersisa dari Ayah: sebuah mobil drift tua bernomor <b style="color:#00e5ff">88</b>.<br>Dan malam ini, kota memanggil.<br><br><b style="color:#fff;letter-spacing:2px">▶ KETUK UNTUK MENYALAKAN MESIN</b></div></div>`,
  menu: `function(S){var m=S.eps.map(function(e,i){var n=i+1;return '<div data-ep="'+n+'" class="ms '+(n===S.ep?'on':n>S.max?'lk':'')+'"><i>'+(n>S.max?'🔒':e.ikon)+'</i><div>Malam '+n+' · '+e.judul+'<small>'+e.tipe.toUpperCase()+' · '+e.cuaca+'</small></div><em>'+(n<S.max?'SELESAI':n===S.ep?'SIAP':'')+'</em></div>'}).join('');
   var up=Math.min(6,S.max);return '<div class="gar"><div class="sun" style="top:-40px;width:110px;height:110px;margin-left:-55px;opacity:.7"></div><div class="grid"></div><div class="ttl" style="margin-top:56px"><b style="font-size:26px">NEON DRIFT</b><small>GARASI MAHESA · MALAM '+S.ep+' / 6</small></div>'+
   '<div class="card"><h4>MOBIL #88 · REZA</h4><div class="car"><div class="pic"><div class="top"></div><div class="body"></div><div class="wh" style="left:14px"></div><div class="wh" style="right:14px"></div></div><div class="st" style="flex:1">MESIN <b>lv'+up+'</b><div class="bar"><i style="width:'+(up*16)+'%"></i></div>NITRO <b>'+(up>=2?'terpasang':'—')+'</b><div class="bar"><i style="width:'+(up>=2?60+up*6:0)+'%"></i></div>REKOR <b>'+S.best+'</b></div></div></div>'+
   '<div class="card"><h4>PAPAN MISI</h4>'+m+'</div><div class="go" id="mPlay">▶ MULAI MALAM '+S.ep+'</div><div class="row3"><div id="mStory">📻 REKAP</div><div id="mHow">? KONTROL</div><div id="mSet">⚙ SETEL</div></div><div class="foot">'+S.brand+' · KOTA TANPA TIDUR</div></div>'}`,
  hud: '<div class="p"><small>KM/H</small><span id="hSpd">0</span></div><div class="p"><small>CP</small><span id="hCp">0/0</span></div><div class="p"><small>WAKTU</small><span id="hTm">0</span></div><div class="p"><small>MOBIL</small><span id="hHp">100%</span></div>',
  kontrol: '<div class="nd"><div class="col"><div class="wheel"><div class="k" id="bL">◀</div><div class="k" id="bR">▶</div></div><div class="k brk" id="bB">REM</div></div><div class="col"><div class="k nos" id="bN">⚡ NITRO</div><div class="k gas" id="bG">GAS</div></div></div>',
  hint: '◀▶ setir · GAS tahan · REM tahan (rem + setir = drift) · NITRO terbatas · ikuti panah & minimap',
  how: [['◀ ▶', 'setir kiri / kanan (tahan)'], ['GAS / REM', 'tahan. Rem sambil belok = DRIFT (bonus skor)'], ['⚡ NITRO', 'dorongan cepat, isi ulang otomatis'], ['➤ panah', 'menunjuk checkpoint berikutnya · minimap kanan atas'], ['🚓', 'polisi & geng menabrakmu; mobil rusak 0% = gagal'], ['🚗', 'lalu lintas: hindari, menabrak mengurangi kondisi mobil']],
  tujuan: 'Selesaikan tiap misi malam sebelum waktu habis / mobil hancur. Kota terbuka — jalan mana pun boleh, panah hanya menunjukkan arah terpendek.',
  tamat: 'Pagi itu bank datang. Reza menyerahkan amplop: lunas, dari hadiah balapan terakhir. Bu Sari menangis di depan bengkel. Di dinding, Reza memasang foto ayahnya di samping nomor 88 — dan di bawahnya, foto Dimas, adik yang sekarang bisa sekolah lagi. "Kota ini tidak pernah tidur, Yah. Tapi malam ini, aku bisa."',
  eps: [
    { judul: 'Kurir Tengah Malam', ikon: '📦', tipe: 'antar', cuaca: 'malam cerah', n: 6, waktu: 150, traffic: .5, polisi: 0, radio: [[2, 'BU SARI', 'Reza, hati-hati. Ayahmu juga mulai dari antar paket… dan tidak pernah berhenti.'], [4, 'PELANGGAN', 'Paket masih utuh? Bagus. Ada teman yang butuh kurir cepat. Bayarannya besar. Malam besok.']],
      intro: ['*REZA*, 19 tahun. Ayahnya, *MAHESA*, raja drift kota ini, meninggal tiga bulan lalu — di tikungan yang sama tempat ia menang seratus kali.', 'Yang ditinggalkan: bengkel dengan utang Rp 300 juta, adik bernama *DIMAS* yang berhenti sekolah, dan mobil drift tua nomor 88 yang tidak pernah boleh disentuh Reza.', 'Malam ini bank memberi tenggat: 6 malam. Reza menarik terpal dari mobil 88. "Maaf, Yah. Aku pinjam sebentar." Misi pertama: 6 paket ke seluruh kota sebelum jam 1 pagi.'],
      outro: ['Paket terakhir diantar. Rp 2 juta. Jauh dari cukup, tapi mesin 88 menyala lagi setelah tiga bulan — dan Reza merasa tangan ayahnya di atas setirnya.', 'Di rumah, Dimas pura-pura tidur. Di bawah bantalnya: brosur SMK otomotif yang sudah lecek.'] },
    { judul: 'Paket yang Salah', ikon: '🚓', tipe: 'kabur', cuaca: 'gerimis', n: 8, waktu: 170, traffic: .6, polisi: 2, hujan: true, radio: [[1, 'REZA', 'Bunyi apa di dalam paket ini…?'], [3, 'RADIO POLISI', 'Semua unit: sedan drift nomor 88, tersangka pembawa barang curian. Kejar.'], [6, 'BU SARI', 'Reza?! Ada polisi ke bengkel! Apa yang kamu bawa, Nak?!']],
      intro: ['"Teman" pelanggan semalam bernama *BARON*. Jas rapi, senyum terlalu lebar. Satu paket, satu alamat, Rp 15 juta.', 'Di tengah jalan, sirene. Bukan satu — tiga. Paket itu ternyata bukan paket. Baron menjebaknya sebagai umpan.', 'Reza tidak bisa ditangkap; kalau ia masuk penjara, bengkel hilang dan Dimas sendirian. Lewati 8 checkpoint untuk lepas dari kejaran polisi.'],
      outro: ['Reza membuang paket itu ke sungai dan lolos lewat gang pasar. Mobil penyok, tangan gemetar.', 'Telepon dari Baron: "Kau cepat. Ayahmu juga cepat. Datang ke Sirkuit Pelabuhan malam Jumat. Hadiahnya cukup untuk bengkelmu — kalau kau menang."'] },
    { judul: 'Balapan Pertama', ikon: '🏁', tipe: 'balap', cuaca: 'malam · neon', n: 10, waktu: 200, traffic: .3, polisi: 0, rival: 3, radio: [[2, 'BARON', 'Mobil tua itu masih hidup? Menarik. Jangan mati di tikungan tiga seperti ayahmu.'], [5, 'DIMAS', 'Kak… aku dengar dari temanku kakak balapan. Menang ya, Kak. Tapi pulang.'], [8, 'REZA', 'Tikungan tiga… Ayah, tunjukkan garisnya.']],
      intro: ['Sirkuit Pelabuhan: jalan kontainer, lampu neon Baron, penonton di atap truk. Tiga pembalap Baron menunggu — mobil baru, mesin baru, uang baru.', 'Bu Sari tidak tahu. Dimas tahu. Ia diam-diam menyelipkan foto ayah di dasbor mobil 88.', 'Sepuluh checkpoint, tiga lawan. Baron memberi syarat: kalah, mobil 88 jadi miliknya.'],
      outro: ['Garis finis. Reza pertama — mobil 88 pertama lagi setelah tiga bulan. Penonton di atap truk berteriak nama *MAHESA*.', 'Baron menyerahkan amplop Rp 60 juta dengan senyum yang tidak sampai ke mata. "Malam depan taruhannya lebih besar. Kau tidak bisa menolak — aku tahu di mana adikmu sekolah."'] },
    { judul: 'Hujan di Jalan Layang', ikon: '🌧', tipe: 'antar', cuaca: 'badai', n: 8, waktu: 160, traffic: .8, polisi: 1, hujan: true, radio: [[1, 'BU SARI', 'Dimas demam tinggi, Reza. Obatnya habis dan apotek dekat rumah tutup.'], [4, 'REZA', 'Tahan, Dik. Kakak sampai sebelum kamu selesai menghitung seratus.'], [7, 'DIMAS', '…enam puluh… tujuh puluh… Kak?']],
      intro: ['Badai. Jalan layang banjir sebagian. Dimas demam 40 derajat; obatnya cuma ada di apotek 24 jam di seberang kota.', 'Reza menolak tawaran Baron malam ini. Baron tidak suka ditolak. "Baik. Antar saja obat adikmu. Kalau bisa."', 'Delapan checkpoint: apotek, lalu pulang. Di belakang, mobil hitam tanpa plat mulai mengikuti.'],
      outro: ['Obat sampai. Demam Dimas turun menjelang subuh. Bu Sari memegang tangan Reza: "Ayahmu juga selalu bilang \'sebentar lagi\'."', 'Di layar ponsel, pesan dari nomor tak dikenal: foto bengkel, dari seberang jalan, malam ini. Tulisan: *Besok. Atau bengkel ini yang terbakar.*'] },
    { judul: 'Kabur dari Geng Baron', ikon: '🔥', tipe: 'kabur', cuaca: 'malam · kabut', n: 12, waktu: 240, traffic: .4, polisi: 3, kabut: true, gengs: true, radio: [[1, 'BARON', 'Kau pikir kota ini punya siapa? Anak-anakku ada di setiap persimpangan.'], [4, 'BU SARI', 'Reza, jangan pulang! Mereka menunggu di depan bengkel! Ibu sudah lapor polisi!'], [8, 'POLISI (PAK HENDRA)', 'Nomor 88, ini Hendra. Aku kenal ayahmu. Bawa mereka ke pelabuhan — kami tunggu di sana.'], [11, 'REZA', 'Ayo, 88. Satu tikungan lagi.']],
      intro: ['Baron memberi ultimatum: serahkan mobil 88 — bukti kemenangan atas Mahesa yang tidak pernah ia dapat — atau bengkel dibakar.', 'Reza memilih jalan ketiga: memancing seluruh geng Baron mengejarnya keliling kota, menjauh dari bengkel, sampai polisi bisa menangkap mereka.', 'Dua belas checkpoint dalam kabut, empat mobil geng yang menabrak tanpa ampun. Mobil boleh rusak. Reza tidak boleh berhenti.'],
      outro: ['Pelabuhan. Sorot lampu polisi menyala serentak. Mobil-mobil geng terjepit di antara kontainer. Baron ditangkap Pak Hendra sendiri.', 'Tapi bank tidak peduli siapa yang ditangkap. Utang tetap Rp 300 juta. Tenggat: besok pagi. Pak Hendra: "Ada balapan resmi malam ini di Jalan Layang. Hadiahnya… cukup. Ayahmu juara bertahan di sana."'] },
    { judul: 'Malam Terakhir Mahesa', ikon: '👑', tipe: 'balap', cuaca: 'fajar', n: 14, waktu: 260, traffic: .4, polisi: 0, rival: 5, fajar: true, radio: [[2, 'PAK HENDRA', 'Lima pembalap terbaik kota. Ayahmu mengalahkan mereka semua. Kau bukan ayahmu — dan itu tidak apa-apa.'], [5, 'DIMAS', 'Kak, aku di garis finis sama Ibu. Ibu bawa terpal buat nutup mobil lagi. Katanya \'setelah ini istirahat\'.'], [9, 'REZA', 'Tikungan tiga. Di sinilah Ayah…'], [10, 'BU SARI', 'Lepas gasnya sedikit, Nak. Ayahmu tidak pernah mau melakukannya. Kamu boleh.'], [13, 'DIMAS', 'KAK! DEPAN KAMU KOSONG! GAS!']],
      intro: ['Balapan Jalan Layang: 14 checkpoint melintasi seluruh kota, dari pelabuhan sampai bukit, finis saat matahari terbit. Lima pembalap terbaik.', 'Semalam Reza tidak tidur. Ia menemukan buku catatan ayah di laci bengkel: catatan garis balap tiap tikungan kota. Halaman terakhir: *"Untuk Reza, kalau ia siap. Tikungan 3: rem lebih awal. Ayah tidak pernah bisa."*', 'Mesin 88 menyala. Bu Sari dan Dimas di garis finis. Kota tanpa tidur akhirnya menahan napas.'],
      outro: ['Tikungan tiga: Reza mengerem lebih awal. Mobil-mobil lain melebar. 88 masuk paling dalam, keluar paling cepat. Matahari terbit tepat saat ia melewati garis finis.', 'Hadiah: Rp 350 juta. Cukup. Lebih dari cukup.'] }
  ],
  js: R`
var W=480,H=600,run=false,t=0,E=null,epN=1;
var hitCd=0,px=0,pz=0,yaw=0,spd=0,vyaw=0,hp=100,nos=100,skor=0,cps=[],ci=0,waktu=0,drift=0,traffic=[],cops=[],rivals=[],keys={},radioDone=[],rain=[],shake=0,finishRank=0;
/* ---------- kontrol ---------- */
hold('bL',function(){keys.l=1},function(){keys.l=0});hold('bR',function(){keys.r=1},function(){keys.r=0});hold('bG',function(){keys.g=1},function(){keys.g=0});hold('bB',function(){keys.b=1},function(){keys.b=0});hold('bN',function(){keys.n=1},function(){keys.n=0});
var KM={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'g',ArrowDown:'b',' ':'n',Shift:'n'};document.addEventListener('keydown',function(e){if(KM[e.key]){keys[KM[e.key]]=1;e.preventDefault()}});document.addEventListener('keyup',function(e){if(KM[e.key])keys[KM[e.key]]=0});
/* ---------- kota prosedural ---------- */
var CELL=16,ROADW=7;
function h2(i,j){var n=Math.sin(i*127.1+j*311.7+epN*7.7)*43758.5453;return n-Math.floor(n)}
function isRoad(i,j){return (i%4===0)||(j%4===0)}
function bld(i,j){if(isRoad(i,j))return null;var r=h2(i,j);if(r<.12)return null;var hh=6+h2(i+1,j)*22;if(h2(i,j+7)<.1)hh*=1.9;var c=Math.floor(h2(i+2,j)*5);return {h:hh,c:c,s:CELL*.55,sign:h2(i+3,j)<.35,park:r<.2}}
/* posisi jalan terdekat (untuk menaruh checkpoint/mobil di jalan) */
function snap(x){return Math.round(x/(CELL*4))*(CELL*4)}
function buatRute(){cps=[];var B=CELL*4,x=0,z=0,dir=Math.floor(h2(1,epN)*4),i=0,guard=0;while(cps.length<E.n&&guard++<200){var r=h2(i,3);if(r<.3)dir=(dir+1)%4;else if(r<.6)dir=(dir+3)%4;var len=B*(1+Math.floor(h2(i,9)*2));var nx=x+[1,0,-1,0][dir]*len,nz=z+[0,1,0,-1][dir]*len;i++;
  var dup=false;for(var k=Math.max(0,cps.length-6);k<cps.length;k++)if(cps[k].x===nx&&cps[k].z===nz)dup=true;if(dup||(nx===0&&nz===0)){dir=(dir+1)%4;continue}
  // titik antara: tiap persimpangan yang dilewati boleh jadi CP juga (biar jarak wajar)
  x=nx;z=nz;cps.push({x:x,z:z,ok:false})}
 while(cps.length<E.n)cps.push({x:x,z:z+=B,ok:false})}
function spawnCar(kind,near){var i=near?near:{x:px,z:pz};var ang=Math.random()*6.28;var d=kind==='cop'?70:kind==='rival'?6:30+Math.random()*90;var x=i.x+Math.sin(ang)*d,z=i.z+Math.cos(ang)*d;
 // ke jalan terdekat
 var gx=Math.round(x/CELL),gz=Math.round(z/CELL);var bx=gx,bz=gz,best=1e9;for(var u=-4;u<=4;u++)for(var v=-4;v<=4;v++){if(isRoad(gx+u,gz+v)){var dd=u*u+v*v;if(dd<best){best=dd;bx=gx+u;bz=gz+v}}}
 var alongX=(bz%4===0);return {x:bx*CELL,z:bz*CELL,yaw:alongX?(Math.random()<.5?1.5708:-1.5708):(Math.random()<.5?0:3.1416),spd:kind==='traffic'?.18+Math.random()*.12:0,kind:kind,col:kind==='cop'?[30,40,200]:kind==='rival'?[[255,120,0],[0,255,120],[255,230,0],[160,60,255],[255,255,255]][rivals.length%5]:[[200,200,210],[220,60,60],[60,60,70],[240,200,60],[90,120,240]][Math.floor(Math.random()*5)],cp:0,hp:3,turnCd:0,back:0}}
window.__mulai=function(ep){epN=ep;E=G.eps[ep-1];run=true;window.__running=true;t=0;px=0;pz=0;yaw=0;spd=0;vyaw=0;hp=100;nos=100;skor=0;ci=0;waktu=E.waktu*60;drift=0;shake=0;radioDone=[];finishRank=0;buatRute();
 traffic=[];for(var i=0;i<Math.floor(14*E.traffic);i++)traffic.push(spawnCar('traffic'));cops=[];for(i=0;i<(E.polisi||0);i++)cops.push(spawnCar('cop'));if(E.gengs)cops.forEach(function(c){c.col=[20,20,20];c.kind='geng'});
 rivals=[];for(i=0;i<(E.rival||0);i++){var r=spawnCar('rival');r.x=px-6+i*3;r.z=pz-8-Math.floor(i/2)*6;r.yaw=0;rivals.push(r)}
 rain=[];for(i=0;i<(E.hujan?110:0);i++)rain.push([Math.random()*W,Math.random()*H]);I('hCp').textContent='0/'+E.n;upd();
 var tipe={antar:'Antar ke '+E.n+' titik (checkpoint) sebelum waktu habis.',kabur:'Lewati '+E.n+' checkpoint. Jangan biarkan pengejar menghancurkan mobilmu.',balap:'Balapan '+E.n+' checkpoint melawan '+E.rival+' pembalap. Finis pertama!'}[E.tipe];
 dialog('MALAM '+ep+' — '+E.judul,E.intro[E.intro.length-1]+'\n\n*Misi:* '+tipe+'\n_Ikuti panah & minimap. Kota terbuka: jalan mana pun boleh._')};
function upd(){I('hSpd').textContent=Math.round(Math.abs(spd)*160);I('hCp').textContent=ci+'/'+(E?E.n:0);I('hTm').textContent=Math.max(0,Math.ceil(waktu/60));I('hHp').textContent=Math.max(0,hp|0)+'%';I('hHp').style.color=hp<30?'#ff4d6d':''}
/* ---------- fisika ---------- */
function carAt(x,z){var gx=Math.round(x/CELL),gz=Math.round(z/CELL);var b=bld(gx,gz);if(!b)return null;var cx=gx*CELL,cz=gz*CELL;if(Math.abs(x-cx)<b.s/2+.6&&Math.abs(z-cz)<b.s/2+.6)return {cx:cx,cz:cz};return null}
function update(){if(!run||paused||dopen)return;t++;var sc=[.9,1,1.12][SET.get().cepat];
 var maxs=(.62+epN*.03)*sc;var acc=keys.g?.011:0;if(keys.n&&nos>0&&keys.g){acc+=.02;nos-=.6;maxs*=1.35;if(t%3===0)shake=1}else if(nos<100)nos+=.08;
 if(keys.b)spd-=.018;spd+=acc;spd-=spd*(keys.g?.008:.02);if(spd<-.15)spd=-.15;if(spd>maxs)spd-=(spd-maxs)*.1;
 var steer=(keys.l?-1:0)+(keys.r?1:0);var grip=keys.b&&Math.abs(spd)>.25?.55:1;vyaw+=steer*.0062*Math.min(1,Math.abs(spd)*2.2)*(spd<0?-1:1);vyaw*=.82;yaw+=vyaw;
 var isDrift=keys.b&&Math.abs(steer)>0&&Math.abs(spd)>.3;if(isDrift){drift+=1;skor+=1;if(t%20===0)say('DRIFT +'+drift)}else if(drift>0){drift=0}
 var fx=Math.sin(yaw),fz=Math.cos(yaw);var slide=isDrift?vyaw*6:0;var nx=px+fx*spd+Math.cos(yaw)*slide*spd,nz=pz+fz*spd-Math.sin(yaw)*slide*spd;
 var hit=carAt(nx,nz);if(hit){var dmg=Math.min(8,Math.abs(spd)*8)*(E.kabut?.6:1);if(hitCd<=0&&dmg>1.5){hp-=dmg;hitCd=30;shake=6;getar(60);bip(80,.2,'sawtooth',.12);say('TABRAK! −'+Math.round(dmg)+'%')}spd*=-.25;var dx=px-hit.cx,dz=pz-hit.cz;if(Math.abs(dx)>Math.abs(dz))px+=Math.sign(dx)*1.2;else pz+=Math.sign(dz)*1.2;if(carAt(px,pz)){px+=Math.sign(dx)*2;pz+=Math.sign(dz)*2}}else{px=nx;pz=nz}if(hitCd>0)hitCd--;else if(hp<100&&t%20===0)hp+=.5;
 // lalu lintas AI: ikut jalan, belok di persimpangan
 traffic.forEach(function(c){c.x+=Math.sin(c.yaw)*c.spd;c.z+=Math.cos(c.yaw)*c.spd;var gx=Math.round(c.x/CELL),gz=Math.round(c.z/CELL);if(gx%4===0&&gz%4===0&&c.turnCd<=0&&Math.abs(c.x-gx*CELL)<.5&&Math.abs(c.z-gz*CELL)<.5){if(Math.random()<.4){c.yaw+=(Math.random()<.5?1:-1)*1.5708;c.x=gx*CELL;c.z=gz*CELL}c.turnCd=30}c.turnCd--;if(!isRoad(Math.round(c.x/CELL),Math.round(c.z/CELL))){c.yaw+=3.1416}
  if(Math.hypot(c.x-px,c.z-pz)>170){var n2=spawnCar('traffic');c.x=n2.x;c.z=n2.z;c.yaw=n2.yaw}
  if(Math.hypot(c.x-px,c.z-pz)<2.2&&hitCd<=0){hitCd=25;hp-=Math.min(8,Math.abs(spd)*12+1);shake=5;getar(50);bip(120,.15,'square',.1);spd*=.3;say('MENABRAK MOBIL!');c.x+=Math.sin(yaw)*4;c.z+=Math.cos(yaw)*4}});
 // pengejar: menuju pemain
 cops.forEach(function(c){var dx=px-c.x,dz=pz-c.z,d=Math.hypot(dx,dz);var ty=Math.atan2(dx,dz);var da=((ty-c.yaw+9.42)%6.28)-3.14;c.yaw+=da*.06;var want=(.40+epN*.015)*sc;c.spd+=(want-c.spd)*.02;var cx2=c.x+Math.sin(c.yaw)*c.spd,cz2=c.z+Math.cos(c.yaw)*c.spd;if(carAt(cx2,cz2)){c.yaw+=.5;c.spd*=.5}else{c.x=cx2;c.z=cz2}
  if(d>160){var n3=spawnCar('cop');c.x=n3.x;c.z=n3.z}
  if(c.back>0){c.back--;c.spd*=.9;var bx=c.x-Math.sin(c.yaw)*.25,bz=c.z-Math.cos(c.yaw)*.25;if(!carAt(bx,bz)){c.x=bx;c.z=bz}}else if(d<2.6){hp-=4;c.back=150;shake=5;getar(40);bip(160,.1,'square',.08);say((c.kind==='geng'?'GENG':'POLISI')+' MENABRAK! −4%');spd*=.9}});
 // rival: menuju checkpoint mereka
 rivals.forEach(function(r,k){if(r.cp>=cps.length)return;var tg=cps[r.cp];var dx=tg.x-r.x,dz=tg.z-r.z,d=Math.hypot(dx,dz);var ty=Math.atan2(dx,dz);var da=((ty-r.yaw+9.42)%6.28)-3.14;r.yaw+=da*.08;var want=(.5+epN*.035-k*.02)*sc*(.9+h2(k,t>>7)*.2);r.spd+=(want-r.spd)*.04;var rx2=r.x+Math.sin(r.yaw)*r.spd,rz2=r.z+Math.cos(r.yaw)*r.spd;if(carAt(rx2,rz2)){r.yaw+=.4;r.spd*=.6}else{r.x=rx2;r.z=rz2}if(d<5){r.cp++;if(r.cp>=cps.length){finishRank++}}
  if(Math.hypot(r.x-px,r.z-pz)<2.2&&hitCd<=0){hp-=2;hitCd=30;shake=3;spd*=.9;window.__rhits=(window.__rhits||0)+1}});
 // checkpoint
 var c=cps[ci];if(c&&Math.hypot(c.x-px,c.z-pz)<5.5){c.ok=true;ci++;skor+=200+Math.floor(waktu/60);bip(880,.1,'triangle');bip(1320,.15,'triangle');getar(25);say((E.tipe==='antar'?'PAKET DIANTAR ':'CHECKPOINT ')+ci+'/'+E.n);
  if(E.tipe!=='balap')waktu+=Math.min(900,E.waktu*10);
  if(ci>=E.n){run=false;if(E.tipe==='balap'){var pos=finishRank+1;skor+=(6-pos)*500+Math.floor(hp)*5;upd();if(pos===1)return tamat(true,skor);return tamat(false,skor,'Kamu finis ke-'+pos+'. Baron tidak menerima nomor dua — dan bengkel tidak menunggu. Coba lagi: rem lebih awal di tikungan, pakai nitro di jalan lurus.')}skor+=Math.floor(hp)*5+Math.floor(waktu/60)*10;upd();return tamat(true,skor)}}
 // radio
 E.radio.forEach(function(rd,k){if(radioDone.indexOf(k)<0&&ci>=rd[0]){radioDone.push(k);dialog('📻 '+rd[1],rd[2])}});
 waktu--;if(waktu<=0){run=false;upd();return tamat(false,skor,'Waktu habis. '+(E.tipe==='antar'?'Pelanggan membatalkan pesanan.':'Mereka menyusulmu.')+' Coba lagi — gunakan nitro di jalan lurus, jangan tabrak apa pun.')}
 if(hp<=0){run=false;upd();return tamat(false,skor,'Mobil 88 hancur. Reza terdiam di pinggir jalan, bau bensin dan hujan. Bukan malam ini. Coba lagi.')}
 if(t%5===0)upd()}
/* ---------- render 3D ---------- */
var F=400,cx,cy,cz,cyaw,sy,cy2,sp_,cp_,NEAR=1.2,faces=[];
function setCam(){var fx=Math.sin(yaw),fz=Math.cos(yaw);cx=px-fx*8.5;cy=3.4;cz=pz-fz*8.5;cyaw=yaw;var pit=-.2;sy=Math.sin(cyaw);cy2=Math.cos(cyaw);sp_=Math.sin(pit);cp_=Math.cos(pit)}
function toCam(x,y,z){var dx=x-cx,dy=y-cy,dz=z-cz;var X=dx*cy2-dz*sy,Z=dx*sy+dz*cy2;var Y=dy*cp_-Z*sp_;Z=dy*sp_+Z*cp_;return [X,Y,Z]}
function pr(c){return [W/2+c[0]*F/c[2],H*.5-c[1]*F/c[2]]}
function poly(pts3,col,glow){var cs=pts3.map(function(p){return toCam(p[0],p[1],p[2])});var out=[];for(var i=0;i<cs.length;i++){var a=cs[i],b=cs[(i+1)%cs.length];var ain=a[2]>NEAR,bin=b[2]>NEAR;if(ain)out.push(a);if(ain!==bin){var tt=(NEAR-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*tt,a[1]+(b[1]-a[1])*tt,NEAR])}}if(out.length<3)return;var d=0;for(var j=0;j<out.length;j++)d+=out[j][2];d/=out.length;faces.push({p:out.map(pr),d:d,c:col,g:glow})}
var SKY;function sky(){if(E.fajar)return [[255,140,90],[40,20,80],[60,30,90]];if(E.kabut)return [[40,30,70],[60,40,90],[50,40,80]];return [[8,4,24],[30,8,60],[20,6,40]]}
function fog(col,d){var sk=SKY[2];var f=Math.min(1,Math.max(0,(d-(E.kabut?10:40))/(E.kabut?45:160)));return 'rgb('+(col[0]+(sk[0]-col[0])*f|0)+','+(col[1]+(sk[1]-col[1])*f|0)+','+(col[2]+(sk[2]-col[2])*f|0)+')'}
function sh(c,k){return [Math.min(255,c[0]*k),Math.min(255,c[1]*k),Math.min(255,c[2]*k)]}
var NEON=[[255,43,214],[0,229,255],[255,230,0],[124,58,237],[57,255,20]];function NC(n){return NEON[((n%5)+5)%5]}
function box(x,z,s,h,col,y0,sz){y0=y0||0;var a=s/2,b=(sz||s)/2;var P=[[x-a,y0,z-b],[x+a,y0,z-b],[x+a,y0,z+b],[x-a,y0,z+b],[x-a,y0+h,z-b],[x+a,y0+h,z-b],[x+a,y0+h,z+b],[x-a,y0+h,z+b]];var dz=z-cz,dx=x-cx;
 poly([P[4],P[5],P[6],P[7]],sh(col,1.1));if(dz>0)poly([P[0],P[1],P[5],P[4]],sh(col,.9));else poly([P[3],P[2],P[6],P[7]],sh(col,.85));if(dx>0)poly([P[0],P[3],P[7],P[4]],sh(col,.7));else poly([P[1],P[2],P[6],P[5]],sh(col,.75))}
function car(c,x,z,ya,col,isP){var fx=Math.sin(ya),fz=Math.cos(ya),rx=Math.cos(ya),rz=-Math.sin(ya);function P(f,r,y){return [x+fx*f+rx*r,y,z+fz*f+rz*r]}
 poly([P(1.9,-.9,.05),P(1.9,.9,.05),P(-1.9,.9,.05),P(-1.9,-.9,.05)],[12,6,20]);poly([P(1.9,-.9,.35),P(1.9,.9,.35),P(1.9,.9,.85),P(1.9,-.9,.85)],sh(col,1.05));poly([P(-1.9,-.9,.35),P(-1.9,.9,.35),P(-1.9,.9,.9),P(-1.9,-.9,.9)],sh(col,.7));
 poly([P(1.9,-.9,.85),P(1.9,.9,.85),P(-1.9,.9,.9),P(-1.9,-.9,.9)],sh(col,1.15));poly([P(1.9,-.9,.35),P(1.9,-.9,.85),P(-1.9,-.9,.9),P(-1.9,-.9,.35)],sh(col,.8));poly([P(1.9,.9,.35),P(1.9,.9,.85),P(-1.9,.9,.9),P(-1.9,.9,.35)],sh(col,.8));
 poly([P(.9,-.75,.9),P(.9,.75,.9),P(-1.2,.75,1.45),P(-1.2,-.75,1.45)],[20,10,30]);poly([P(-1.2,-.75,1.45),P(-1.2,.75,1.45),P(-1.7,.75,.9),P(-1.7,-.75,.9)],[30,15,40]);poly([P(.9,-.75,.9),P(.9,.75,.9),P(-1.2,.75,1.45),P(-1.2,-.75,1.45)].slice(0,4),[15,8,25]);
 // lampu
 poly([P(1.92,-.8,.55),P(1.92,-.4,.55),P(1.92,-.4,.75),P(1.92,-.8,.75)],[255,255,220],1);poly([P(1.92,.4,.55),P(1.92,.8,.55),P(1.92,.8,.75),P(1.92,.4,.75)],[255,255,220],1);
 poly([P(-1.92,-.85,.55),P(-1.92,-.3,.55),P(-1.92,-.3,.72),P(-1.92,-.85,.72)],[255,30,60],1);poly([P(-1.92,.3,.55),P(-1.92,.85,.55),P(-1.92,.85,.72),P(-1.92,.3,.72)],[255,30,60],1);
 [[1.2,-1],[1.2,1],[-1.2,-1],[-1.2,1]].forEach(function(w){poly([P(w[0]+.4,w[1]*.95,.05),P(w[0]-.4,w[1]*.95,.05),P(w[0]-.4,w[1]*.95,.7),P(w[0]+.4,w[1]*.95,.7)],[10,10,14])});
 if(c==='cop'){poly([P(.2,-.6,1.47),P(.2,0,1.47),P(-.4,0,1.47),P(-.4,-.6,1.47)],(t>>3)%2?[255,40,40]:[60,60,255],1);poly([P(.2,0,1.47),P(.2,.6,1.47),P(-.4,.6,1.47),P(-.4,0,1.47)],(t>>3)%2?[60,60,255]:[255,40,40],1)}
 if(isP){poly([P(1.6,-1,.06),P(1.6,-.92,.06),P(-1.6,-.92,.06),P(-1.6,-1,.06)],[255,43,214],1);poly([P(1.6,.92,.06),P(1.6,1,.06),P(-1.6,1,.06),P(-1.6,.92,.06)],[255,43,214],1);if(keys.n&&nos>0&&keys.g){var fl=.6+Math.random()*.5;poly([P(-1.95,-.25,.45),P(-1.95,.25,.45),P(-1.95-fl,.1,.5),P(-1.95-fl,-.1,.5)],[80,200,255],1)}}}
function draw(){if(!E)return;SKY=sky();setCam();var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgb('+SKY[0].join(',')+')');g.addColorStop(.5,'rgb('+SKY[1].join(',')+')');g.addColorStop(1,'rgb('+SKY[2].join(',')+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(E.fajar){ctx.fillStyle='#ffb36b';ctx.beginPath();ctx.arc(W/2+Math.sin(-yaw)*300,H*.42,40,0,7);ctx.fill()}
 ctx.save();if(shake>0){ctx.translate((Math.random()-.5)*shake*2,(Math.random()-.5)*shake*2);shake--}
 faces=[];var gi=Math.round(cx/CELL),gj=Math.round(cz/CELL),Rr=E.kabut?8:12,a=CELL/2;
 var wet=E.hujan;var roadC=wet?[26,22,40]:[22,20,34],walkC=wet?[40,34,60]:[38,34,56],grassC=[16,26,30];
 for(var i=-Rr;i<=Rr;i++)for(var j=-Rr;j<=Rr;j++){var I2=gi+i,J=gj+j,x=I2*CELL,z=J*CELL;if((x-cx)*sy+(z-cz)*cy2<-CELL*1.5)continue;
  var rd=isRoad(I2,J);poly([[x-a,0,z-a],[x+a,0,z-a],[x+a,0,z+a],[x-a,0,z+a]],rd?roadC:walkC);
  if(rd){ // garis jalan neon
   var ax=(J%4===0),az=(I2%4===0);if(az&&!ax)poly([[x-.25,.02,z-a+2],[x+.25,.02,z-a+2],[x+.25,.02,z-a+8],[x-.25,.02,z-a+8]],[0,229,255],1);if(ax&&!az)poly([[x-a+2,.02,z-.25],[x-a+8,.02,z-.25],[x-a+8,.02,z+.25],[x-a+2,.02,z+.25]],[0,229,255],1);
   if(ax&&az)poly([[x-2,.02,z-2],[x+2,.02,z-2],[x+2,.02,z+2],[x-2,.02,z+2]],[255,43,214],1);
   // lampu jalan
   if(az&&!ax&&J%2===0){box(x+a-.5,z,.25,7,[60,60,80]);box(x+a-.5,z,.9,.25,[255,220,160],7,.5)}
   continue}
  var b=bld(I2,J);if(!b){if(h2(I2,J+11)<.5){poly([[x-a+1,.03,z-a+1],[x+a-1,.03,z-a+1],[x+a-1,.03,z+a-1],[x-a+1,.03,z+a-1]],grassC);box(x,z,.6,3,[40,30,50]);box(x,z,3.5,3,[30,90,70],2.5)}continue}
  var bc=[[40,24,70],[30,40,80],[60,20,60],[24,30,60],[50,30,50]][b.c]||[40,24,70];box(x,z,b.s,b.h,bc);
  // neon strip & jendela
  var nc=NC(I2+J*3);var side=(z>cz)?-1:1;var zz=z+side*b.s/2*-1;
  poly([[x-b.s/2,b.h-.5,zz],[x+b.s/2,b.h-.5,zz],[x+b.s/2,b.h-.2,zz],[x-b.s/2,b.h-.2,zz]],nc,1);
  for(var k=1;k<b.h-1;k+=2.6){var lit=h2(I2+k,J)<.6;var wc=lit?[255,220,150]:[20,14,30];poly([[x-b.s/2+1,k,zz],[x-b.s/2+2.4,k,zz],[x-b.s/2+2.4,k+1.2,zz],[x-b.s/2+1,k+1.2,zz]],wc,lit);poly([[x+b.s/2-2.4,k,zz],[x+b.s/2-1,k,zz],[x+b.s/2-1,k+1.2,zz],[x+b.s/2-2.4,k+1.2,zz]],lit?[150,220,255]:[20,14,30],lit)}
  if(b.sign)poly([[x-b.s/2+1.5,b.h*.5,zz+side*-.1],[x+b.s/2-1.5,b.h*.5,zz+side*-.1],[x+b.s/2-1.5,b.h*.5+3,zz+side*-.1],[x-b.s/2+1.5,b.h*.5+3,zz+side*-.1]],(t>>4)%2?nc:NC(I2+J),1)}
 // checkpoint (gerbang neon)
 for(var q=ci;q<Math.min(cps.length,ci+2);q++){var c=cps[q],col=q===ci?[0,229,255]:[255,43,214];var pu=(t*.1)%1;box(c.x-4,c.z,.5,6,col,0,.5);box(c.x+4,c.z,.5,6,col,0,.5);box(c.x,c.z,8.5,.4,col,6,.5);box(c.x,c.z,7,.1,[col[0],col[1],col[2]],1+pu*4,.1)}
 traffic.concat(cops).forEach(function(c){if(Math.hypot(c.x-px,c.z-pz)<120)car(c.kind,c.x,c.z,c.yaw,c.col)});rivals.forEach(function(r){car('rival',r.x,r.z,r.yaw,r.col)});
 car('p',px,pz,yaw,[255,43,214],true);
 faces.sort(function(a,b){return b.d-a.d});faces.forEach(function(f){ctx.beginPath();ctx.moveTo(f.p[0][0],f.p[0][1]);for(var i=1;i<f.p.length;i++)ctx.lineTo(f.p[i][0],f.p[i][1]);ctx.closePath();ctx.fillStyle=f.g?'rgb('+f.c.join(',')+')':fog(f.c,f.d);if(f.g&&f.d<60){ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8}ctx.fill();ctx.shadowBlur=0});
 ctx.restore();
 // pantulan basah / hujan
 if(wet){ctx.fillStyle='rgba(120,80,200,.06)';ctx.fillRect(0,H*.5,W,H*.5);ctx.strokeStyle='rgba(200,220,255,.3)';ctx.lineWidth=1;ctx.beginPath();rain.forEach(function(r){r[1]+=16;r[0]-=2;if(r[1]>H){r[1]=-10;r[0]=Math.random()*W}ctx.moveTo(r[0],r[1]);ctx.lineTo(r[0]-2,r[1]+12)});ctx.stroke()}
 if(E.kabut){ctx.fillStyle='rgba(60,40,90,.18)';ctx.fillRect(0,0,W,H)}
 // vignette + speed lines
 var vg=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 if(keys.n&&nos>0&&keys.g){ctx.strokeStyle='rgba(0,229,255,.35)';ctx.lineWidth=2;ctx.beginPath();for(var s=0;s<10;s++){var an=Math.random()*6.28,r1=120+Math.random()*80;ctx.moveTo(W/2+Math.cos(an)*r1,H/2+Math.sin(an)*r1);ctx.lineTo(W/2+Math.cos(an)*(r1+120),H/2+Math.sin(an)*(r1+120))}ctx.stroke()}
 // HUD: panah nav
 var c=cps[ci];if(c){var dx=c.x-px,dz=c.z-pz,ang=Math.atan2(dx,dz)-yaw,dist=Math.hypot(dx,dz);ctx.save();ctx.translate(W/2,60);ctx.rotate(ang);ctx.fillStyle='#00e5ff';ctx.shadowColor='#00e5ff';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(13,10);ctx.lineTo(0,4);ctx.lineTo(-13,10);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(Math.round(dist*2)+' m',W/2,96)}
 // minimap
 var MX=W-78,MY=14,MS=64;ctx.fillStyle='rgba(10,4,28,.8)';rr(MX,MY,MS,MS,8);ctx.fill();ctx.strokeStyle='#ff2bd688';ctx.stroke();ctx.save();ctx.beginPath();rr(MX,MY,MS,MS,8);ctx.clip();ctx.translate(MX+MS/2,MY+MS/2);ctx.rotate(-yaw);var scl=.22;ctx.strokeStyle='rgba(0,229,255,.35)';ctx.lineWidth=1;for(var g2=-160;g2<=160;g2+=CELL*4){var ox=Math.round(px/(CELL*4))*(CELL*4)+g2,oz=Math.round(pz/(CELL*4))*(CELL*4)+g2;ctx.beginPath();ctx.moveTo((ox-px)*scl,-200);ctx.lineTo((ox-px)*scl,200);ctx.stroke();ctx.beginPath();ctx.moveTo(-200,-(oz-pz)*scl);ctx.lineTo(200,-(oz-pz)*scl);ctx.stroke()}
 cps.forEach(function(p,k){if(k<ci)return;ctx.fillStyle=k===ci?'#00e5ff':'#ff2bd6';ctx.beginPath();ctx.arc((p.x-px)*scl,-(p.z-pz)*scl,k===ci?4:2.5,0,7);ctx.fill()});cops.forEach(function(p){ctx.fillStyle='#ff4d6d';ctx.fillRect((p.x-px)*scl-2,-(p.z-pz)*scl-2,4,4)});rivals.forEach(function(p){ctx.fillStyle='rgb('+p.col.join(',')+')';ctx.fillRect((p.x-px)*scl-2,-(p.z-pz)*scl-2,4,4)});ctx.restore();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(MX+MS/2,MY+MS/2-5);ctx.lineTo(MX+MS/2+4,MY+MS/2+4);ctx.lineTo(MX+MS/2-4,MY+MS/2+4);ctx.fill();
 // nitro bar + speedo
 ctx.fillStyle='rgba(10,4,28,.8)';rr(12,H-40,150,28,8);ctx.fill();ctx.fillStyle='#ffb74d';rr(18,H-32,138*Math.max(0,nos)/100,12,4);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='left';ctx.fillText('NITRO',20,H-15);
 ctx.textAlign='right';ctx.font='italic 900 34px sans-serif';ctx.fillStyle='#fff';ctx.shadowColor='#ff2bd6';ctx.shadowBlur=14;ctx.fillText(Math.round(Math.abs(spd)*160),W-14,H-20);ctx.shadowBlur=0;ctx.font='bold 10px sans-serif';ctx.fillStyle='#ff9be9';ctx.fillText('KM/H',W-14,H-8);
 if(E.tipe==='balap'){var ahead=rivals.filter(function(r){return r.cp>ci||(r.cp===ci&&cps[ci]&&Math.hypot(cps[ci].x-r.x,cps[ci].z-r.z)<Math.hypot(cps[ci].x-px,cps[ci].z-pz))}).length;ctx.fillStyle='rgba(10,4,28,.8)';rr(12,14,70,34,8);ctx.fill();ctx.fillStyle='#ffe600';ctx.font='italic 900 20px sans-serif';ctx.textAlign='left';ctx.fillText('P'+(ahead+1),20,40);ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.fillText('/ '+(rivals.length+1),52,40)}
 if(drift>15){ctx.fillStyle='#ff2bd6';ctx.font='italic 900 18px sans-serif';ctx.textAlign='center';ctx.shadowColor='#ff2bd6';ctx.shadowBlur=10;ctx.fillText('DRIFT ×'+drift,W/2,H-60);ctx.shadowBlur=0}
 ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='bold 9px sans-serif';ctx.textAlign='left';ctx.fillText('MALAM '+epN+' · '+E.judul.toUpperCase()+' · '+E.tipe.toUpperCase(),12,H-52)}
window.__auto=function(){var c=cps[ci];if(!c)return;var dx=c.x-px,dz=c.z-pz;var ang=((Math.atan2(dx,dz)-yaw+9.42)%6.28)-3.14;keys.l=ang<-.05?1:0;keys.r=ang>.05?1:0;keys.g=1;keys.b=Math.abs(ang)>1.2&&spd>.3?1:0};
(function loop(){if(window.__autoOn)window.__auto();update();draw();requestAnimationFrame(loop)})();
`
}

export default neondrift
