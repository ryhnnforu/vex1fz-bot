/**
 * lib/htmlgames15kampung.js — KAMPUNG MATI (v7.32.0)
 * ------------------------------------------------------------------
 *  Horror 3D orang-pertama di desa mati: raycaster BERTEKSTUR (gedek,
 *  kayu, bata, tanah, pintu, gapura), NPC HUMANOID prosedural (bukan
 *  kotak: kepala, wajah berkedip, rambut, lengan/kaki berayun, sarung,
 *  blangkon/peci, tongkat, tasbih), gerakan HALUS berbasis delta-time
 *  (akselerasi, gesekan, head-bob), kunang-kunang, kabut, hujan, moon,
 *  jumpscare, kewarasan (NYALI), dialog bercabang + barter + 2 ending.
 */
const R = String.raw

export const kampungmati = {
  id: 'kampungmati', cmd: '.kampungmati', icon: '🏚️', nama: 'Kampung Mati (horror desa 3D · 5 babak)', judul: 'KAMPUNG MATI', sub: 'HORROR DESA · 3D',
  ikon: '', ket: 'horror 3D di desa mati: senter, sumur berbisik, kuntilanak yang bisa diajak bicara, tuyul, genderuwo & Ki Dalang; NPC manusia penuh, gerakan halus, 2 ending. 5 babak',
  bgm: { bpm: 48, wave: 'sine', bwave: 'sine', lead: [57, 0, 0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 53, 0, 0, 0, 0, 0, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: [33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], perc: 0, vol: .07, filt: 450, len: 3.5 },
  css: `html,body{background:#030704}.menuwrap{--acc:#b8d86a;--accink:#0a1405;--box:rgba(8,16,6,.92);--line:#b8d86a44;--ink:#e4ecd2;background:#030704;font-family:Georgia,"Times New Roman",serif}
.km{min-height:420px;padding:16px;color:#e4ecd2;position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 12%,#14240e 0%,#030704 65%)}
.km .moon{position:absolute;right:36px;top:18px;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f4f6e4,#c8d4a8 70%);box-shadow:0 0 50px #d8e6b488;pointer-events:none}
.km .fly{position:absolute;width:4px;height:4px;border-radius:50%;background:#e8ff9a;box-shadow:0 0 8px #e8ff9a;animation:flyy 3s infinite;pointer-events:none}@keyframes flyy{0%,100%{opacity:.1}50%{opacity:1}}
.km .gap{position:relative;width:170px;margin:6px auto 4px;text-align:center}
.km .gap .tiang{display:flex;justify-content:space-between}.km .gap .tiang i{width:12px;height:86px;background:repeating-linear-gradient(0deg,#4a3a22 0 8px,#3a2c18 8px 10px);border-radius:3px}
.km .gap .atap{height:26px;background:linear-gradient(180deg,#2a3a1a,#141f0c);clip-path:polygon(0 100%,50% 0,100% 100%);margin-bottom:-4px}
.km .gap .nm{font-size:15px;letter-spacing:5px;color:#e4ecd2;text-shadow:0 0 14px #b8d86a88;margin-top:2px}.km .gap .nm small{display:block;font-size:9px;letter-spacing:4px;color:#b8d86a}
.km .pap{position:relative;background:#ddd2b4;color:#2b2413;border-radius:2px;padding:12px 14px;margin-top:12px;box-shadow:0 8px 24px #000;font-size:12px;line-height:1.6}
.km .pap h4{font-size:11px;letter-spacing:3px;margin-bottom:6px;border-bottom:1px solid #2b241333;padding-bottom:4px}
.km .ep{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px dashed #2b241133;font-size:12px;font-weight:700}
.km .ep:last-child{border:0}.km .ep i{width:28px;height:28px;border-radius:50%;border:2px solid #2b2413;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;flex:none}
.km .ep.on i{background:#3a5a1a;color:#fff;border-color:#3a5a1a}.km .ep.lk{opacity:.4}.km .ep small{display:block;font-weight:400;font-size:10px;color:#5a5a3a}
.km .go{position:relative;margin-top:14px;height:54px;border:1px solid #b8d86a;color:#e4ecd2;display:flex;align-items:center;justify-content:center;letter-spacing:4px;font-size:14px;background:linear-gradient(180deg,#1a2a10,#0a1405);box-shadow:0 0 20px #b8d86a33}
.km .row3{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px}.km .row3 div{height:40px;border:1px solid #b8d86a55;display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:2px;color:#b8d86a}
.km .ft{position:relative;text-align:center;font-size:9px;letter-spacing:4px;color:#b8d86a66;margin-top:10px}
.hud .p,.hud .ps{background:#0a1206;border:1px solid #b8d86a44;color:#e4ecd2;font-family:Georgia,serif}.hud .p span{color:#b8d86a}.frame{border:2px solid #b8d86a33}.dlg{background:#0a1206f2;border-color:#b8d86a;font-family:Georgia,serif}.dlg b.j{color:#b8d86a;letter-spacing:2px}.dlg .opts div{background:#141f0c;border:1px solid #b8d86a55}.toast{border-color:#3a5a1a;background:#0c140a}.hint{color:#b8d86a99}
.k13{display:flex;justify-content:space-between;align-items:flex-end;padding:6px 2px}.k13 .pad{display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(2,54px);gap:4px}.k13 .k{background:#141f0c;border:1px solid #b8d86a44;color:#e4ecd2;border-radius:8px;font-size:18px}.k13 .k.dn{background:#2a3a1a}.k13 .col{display:flex;flex-direction:column;gap:6px}.k13 .col .k{width:96px;height:46px;font-size:12px;letter-spacing:1px;font-family:Georgia,serif}.k13 .k.act{background:linear-gradient(180deg,#3a5a1a,#1e320c);border-color:#b8d86a}.k13 .k.lamp{background:#b8d86a;color:#0a1405;font-weight:900}`,
  splash: b => `<div class="km"><div class="moon"></div><div class="fly" style="left:20%;top:30%"></div><div class="fly" style="left:70%;top:50%;animation-delay:1s"></div><div class="fly" style="left:40%;top:70%;animation-delay:2s"></div><div class="gap"><div class="atap"></div><div class="tiang"><i></i><i></i></div><div class="nm">KAMPUNG MATI<small>${b} · HORROR DESA 3D</small></div></div><div class="pap"><h4>SURAT TERAKHIR IBU</h4>"Nak <b>Sari</b>. Kalau kau baca surat ini, Ibu sudah tidak berani keluar rumah lagi. Sumur berbisik tiap malam. Anak-anak tidak lahir lagi. <b>Jangan pulang</b>… kecuali kau sudah siap tahu kenapa."<br><br><i>— Ibu, 15 tahun setelah Malam Kentongan.</i><br><br><b style="letter-spacing:3px">▶ KETUK UNTUK MASUK DESA</b></div></div>`,
  menu: `function(S){var m=S.eps.map(function(e,i){var n=i+1;return '<div data-ep="'+n+'" class="ep '+(n===S.ep?'on':n>S.max?'lk':'')+'"><i>'+(n>S.max?'✕':n)+'</i><div>Babak '+n+' — '+e.judul+'<small>'+e.sub+'</small></div></div>'}).join('');
   return '<div class="km"><div class="moon"></div><div class="fly" style="left:15%;top:20%"></div><div class="fly" style="left:80%;top:60%;animation-delay:1.4s"></div><div class="gap"><div class="atap"></div><div class="tiang"><i></i><i></i></div><div class="nm" style="font-size:19px">KAMPUNG MATI<small>CATATAN SARI · BABAK '+S.ep+'</small></div></div><div class="pap"><h4>LIMA BABAK · DUA AKHIR CERITA</h4>'+m+'</div><div class="pap" style="font-size:11px">Nyali: <b>'+S.best+'</b> poin · Senter hemat baterai · hantu <b>mendengar langkah</b> dan <b>melihat cahaya</b>. Bicara dengan semua orang — tidak semuanya masih hidup.</div><div class="go" id="mPlay">MASUK — BABAK '+S.ep+'</div><div class="row3"><div id="mStory">CATATAN</div><div id="mHow">PETUNJUK</div><div id="mSet">SETEL</div></div><div class="ft">'+S.brand+'</div></div>'}`,
  hud: '<div class="p"><small>SENTER</small><span id="hBat">100%</span></div><div class="p"><small>NYALI</small><span id="hNy">100</span></div><div class="p"><small>TAS</small><span id="hInv">0</span></div><div class="p"><small>TUGAS</small><span id="hQ">0/0</span></div>',
  kontrol: '<div class="k13"><div class="pad"><div class="k" id="bTL">↶</div><div class="k" id="bF">▲</div><div class="k" id="bTR">↷</div><div class="k" id="bL">◀</div><div class="k" id="bB">▼</div><div class="k" id="bR">▶</div></div><div class="col"><div class="k lamp" id="bLamp">🔦 SENTER</div><div class="k act" id="bAct">BICARA / AMBIL</div><div class="k" id="bInv">🎒 TAS</div></div></div>',
  hint: '▲▼ jalan · ↶↷ menoleh halus · ◀▶ geser · senter hemat baterai · BICARA/AMBIL saat dekat · diam saat detak tinggi',
  how: [['▲ ▼ ◀ ▶', 'berjalan / menggeser (mulus, ada momentum)'], ['↶ ↷', 'menoleh kiri / kanan'], ['🔦', 'senter: melihat jauh, tapi baterai habis & hantu melihat cahaya'], ['BICARA/AMBIL', 'di depan orang = dialog (pilihan); di depan benda = ambil'], ['🎒', 'lihat isi tas; beberapa arwah mau MENUKAR barang'], ['👻', 'hantu mendengar langkah: berhenti & matikan senter saat dekat']],
  tujuan: 'Selesaikan tugas tiap babak tanpa kehabisan nyali. Pilih akhirmu di babak 5: keris atau surat Ibu.',
  tamat: 'Fajar pertama dalam 15 tahun menyentuh gapura Kampung Mati. Di belakang Sari, langkah-langkah kecil — anak-anak desa yang tidak pernah lahir — berlari melewatinya menuju cahaya, tertawa. Ibunya menunggu di ujung jalan, muda lagi, melambaikan tangan. "Ayo pulang, Nak. Desanya sudah hidup lagi."',
  eps: [
    { judul: 'Gerbang Bambu', sub: 'mbah karta · lentera · langkah pertama',
      intro: ['Bus berhenti di ujung jalan tanah. Sopirnya tidak mau maju lagi. *"Kampung Mati? Mbak serius? Tidak ada yang turun di sana sejak saya kecil."*', '*SARI*, 26 tahun, melangkah turun dengan satu tas dan surat Ibu yang sudah lusuh. Di gerbang bambu, seorang lelaki tua duduk bersila. *"Sari? Anaknya Yu Lestari? Aku Mbah Karta. Sudah 15 tahun menunggu ada yang pulang."*', 'Babak pertama: bicara dengan Mbah Karta, temukan minyak tanah & korek, isi lentera. Dan dengar baik-baik aturannya.'],
      outro: ['Lentera menyala. Cahaya hangat pertama di desa ini setelah belasan tahun.', 'Mbah Karta menatap nyala itu lama. *"Ibumu di rumah, Nak. Tapi jalannya… tidak lurus lagi. Sumur dulu. Ada yang menunggumu di sana. Jangan takut padanya sebelum kau dengar ceritanya."*'],
      gagal: 'Kegelapan menelan Sari di dekat gerbang. Ia terbangun di bus yang sama — sopirnya menatap aneh. "Mbak mimpi buruk?" Sari turun lagi. Kali ini ia bawa lentera.',
      map: ['#############', '#K...#..m.k.#', '#....+......#', '#.BB.+.BB...#', '#....+......#', '###+####+####', '#...........#', '#....B......#', '#...........#', '#############'],
      start: [6.5, 7.5], sa: -1.57,
      npc: { K: { nama: 'MBAH KARTA', ikon: '👴', kulit: [168, 128, 92], rambut: [200, 200, 200], baju: [40, 60, 110], kain: [90, 60, 35], topi: 'blangkon', tongkat: true, bungkuk: true } },
      item: { m: ['minyak', '🛢️'], k: ['korek', '🔥'] },
      tugas: ['bicara Mbah Karta', 'ambil minyak tanah', 'ambil korek', 'isi lentera (minyak+korek)'], hantu: { n: 1, jenis: 'pocong', cepat: .55, mulai: 'lentera' },
      dialog: { K: [
        { syarat: null, teks: '"Desa ini tidak mati, Nak. Dia *tidur* — dan yang tidur jangan dibangunkan sembarangan." Ia menunjuk ke utara. "Minyak di gubuk, korek di gardu. Isi lenteramu. Aturannya tiga: *jangan berlari dekat mereka, matikan senter kalau detakmu kencang, dan jangan pernah — dengar? — jangan pernah jawab sumur dengan namamu."', opsi: [['Kenapa Ibu tidak pernah pulang?', 'karta_ibu'], ['Saya siapkan lentera.', 'tutup']], flag: 'bicaraK' },
        { syarat: 'minyak', teks: '"Minyaknya dapat. Koreknya? Kalau dua-duanya ada, serahkan — Mbah yang isi lenteranya. Tanganmu gemetar begitu."', opsi: [['Isi lentera (minyak+korek)', 'rakit'], ['Sebentar, Mbah.', 'tutup']] },
        { syarat: 'lentera', teks: '"Nah. Terang." Wajahnya melembut. "Ibumu dulu yang mengajariku menyalakan lentera ini, waktu dia kecil. Pergilah ke sumur, Nak. Nyi Roro menunggumu. Dia… tidak sejahat yang diceritakan orang."', opsi: [['Terima kasih, Mbah.', 'selesai']] }
      ] },
      cabang: { karta_ibu: '"Ibumu menjaga rumah — dan rumah itu menjaga sesuatu. Lima belas tahun dia tidak keluar pagar. Bukan karena tidak bisa, Nak. Karena kalau dia pergi, *tidak ada lagi yang hidup di desa ini*. Dan kalau tidak ada yang hidup… mereka bebas keluar."' } },
    { judul: 'Sumur Tua', sub: 'tuyul · nyi roro · bisikan',
      intro: ['Sumur tua di tengah desa. Airnya hitam seperti kaca. Dari dalamnya, samar: *"Sarii… Sariii…"* — suara yang mirip suara Ibu.', 'Sesuatu yang kecil melompat dari balik batu. Botak, bermata besar. *"Hehe! Orang baru! Om Tuyul — eh, Tuyul! Mau buka sumur? Tukeran! Tuyul butuh tali! Tali buat… main!"*', 'Tugas: bicara Tuyul, ambil tali, tukar tali → kunci sumur, ambil kembang, tukar kembang → cincin dengan Nyi Roro, buka tutup sumur.'],
      outro: ['Tutup sumur terangkat. Bisikan itu berhenti — seketika, seperti radio dimatikan.', 'Dari dalam sumur, sebuah tangan pucat meletakkan sesuatu di bibir batu: *cincin kawin Ibu*. Dan suara Nyi Roro, jauh di bawah: *"Sampaikan pada ibumu… aku menjaga titipannya baik-baik."*'],
      gagal: 'Bisikan sumur masuk terlalu dalam. Sari terbangun di bibir sumur saat fajar, dengan tali melilit pergelangan kakinya. Untung belum kencang. Ia mencoba lagi — lebih cepat kali ini.',
      map: ['##############', '#......#.....#', '#..T...#.r...#', '#......+.....#', '####+#####+###', '#............#', '#..b....W..R.#', '#............#', '#..S....S....#', '#............#', '##############'],
      start: [1.5, 9.5], sa: -1.57,
      npc: {
        T: { nama: 'TUYUL', ikon: '👶', tuyul: true, kulit: [190, 200, 170], rambut: [20, 20, 20], baju: [120, 40, 40], kain: [120, 40, 40], mulut: 'usil' },
        R: { nama: 'NYI RORO', ikon: '👻', hantu: true, melayang: true, kulit: [228, 218, 212], rambut: [12, 12, 14], rambutPanjang: true, baju: [225, 225, 230], kain: [225, 225, 230], rok: true, mulut: 'sedih' }
      },
      item: { r: ['tali', '🪢'], b: ['kembang', '🌸'], W: ['tutup sumur', '🕳️'], pasang: 'W', butuhPasang: 'kunci sumur', butuhPasang2: 'cincin' },
      tugas: ['bicara Tuyul', 'ambil tali', 'tukar tali → kunci sumur', 'bicara Nyi Roro', 'tukar kembang → cincin', 'buka tutup sumur'], hantu: { n: 1, jenis: 'pocong', cepat: .7, mulai: 'awal' },
      dialog: {
        T: [
          { syarat: null, teks: '"Tuyul! Namaku Tuyul! Dulu Tuyul… Tuyul lupa dulu Tuyul apa. Hehe!" Ia melompat-lompat. "Ombutuhtali! Eh — Tuyul butuh tali! Di gudang ada! Tuker sama kunci sumur! Kunci mengkilap! Tuyul suka yang mengkilap tapi Tuyul lebih suka tali!"', opsi: [['Kamu sebenarnya siapa?', 'tuyul_siapa'], ['Aku carikan tali.', 'tutup']], flag: 'bicaraT' },
          { syarat: 'tali', teks: '"TALIII!" Ia memeluk tali itu seperti boneka. "Nih kunci! Kunci sumur! Tuyul ambil dari… dari… Tuyul lupa! Hehe!"', opsi: [['Tukar (tali → kunci sumur)', 'tukar:tali:kunci sumur'], ['Nanti.', 'tutup']] },
          { syarat: 'kunci sumur', teks: '"Sumur tengah! Tutupnya berat! Tapi kunci itu… eh, kuncinya bukan buat tutupnya ding. Buat… buat…" Ia menggaruk kepala botaknya. "Buat Nyi Roro percaya sama kamu! Kasih lihat kembang juga! Perempuan suka kembang! Tuyul tahu! Hehe!"', opsi: [['…makasih, Tuyul.', 'tutup']] }
        ],
        R: [
          { syarat: null, teks: 'Ia melayang tanpa kaki, rambutnya bergerak padahal tidak ada angin. *"Sari… anak Lestari. Ibumu menitipkan sesuatu padaku 15 tahun lalu. Tapi aku tidak memberikan titipan pada orang yang datang dengan tangan kosong."*', opsi: [['Kamu kenal ibuku?', 'roro_ibu'], ['Aku kembali lagi.', 'tutup']], flag: 'bicaraR' },
          { syarat: 'kembang', teks: 'Ia menerima kembang itu. Untuk sesaat, wajahnya… cantik. Sangat cantik, dan sangat sedih. *"Dulu tidak ada yang memberiku kembang. Terima kasih."* Ia meletakkan cincin di tanganmu. Dingin. *"Ini milik ibumu. Buka sumurnya. Ambil apa yang menjadi hakmu."*', opsi: [['Tukar (kembang → cincin)', 'tukar:kembang:cincin'], ['Sebentar.', 'tutup']] },
          { syarat: 'cincin', teks: '*"Pergilah. Yang di dalam sumur bukan aku — aku hanya penjaganya. Kalau ia memanggil namamu… jawab dengan namaku."*', opsi: [['Baik.', 'tutup']] }
        ]
      },
      cabang: {
        tuyul_siapa: '"Tuyul? Tuyul itu… Tuyul itu…" Ia berhenti melompat — pertama kalinya diam. "Tuyul ingat… dingin. Tuyul ingat nangis. Terus… tidak ingat. Hehe! Tali! Tuyul mau tali!" Ia melompat lagi, tapi tidak setinggi tadi.',
        roro_ibu: '"Lestari satu-satunya yang berani menatapku dan tidak lari. Malam Kentongan itu, ia datang ke sumur membawa cincin kawinnya. Katanya: kalau anakku kembali, berikan ini. Supaya dia tahu… ibunya tidak pernah meninggalkannya."' } },
    { judul: 'Langgar Tua', sub: 'ustadz karim · genderuwo · doa',
      intro: ['Langgar tua di ujung timur. Lampu minyaknya masih menyala — padahal desa ini kosong 15 tahun.', 'Di dalamnya, seorang lelaki bertopi peci duduk membaca kitab. *"Sari? Alhamdulillah. Ustadz Karim. Duduklah. Kau pasti lelah — dan penasaran kenapa langgar ini masih terang."*', 'Tugas: bicara Ustadz Karim, ambil tasbih, ambil air doa, minta doa (tasbih+air), baca doa di mimbar. Sesuatu yang besar dan berbulu mengintai di luar.'],
      outro: ['Doa selesai dibaca. Dari luar, raungan panjang — bukan marah. Lega. Seperti beban bertahun-tahun terangkat.', 'Ustadz Karim tersenyum. *"Genderuwo itu… dulu penjaga desa ini, Nak. Ia hanya lupa tugasnya. Sekarang ia ingat."* Dari jendela, sepasang mata merah meredup, lalu hilang ke hutan.'],
      gagal: 'Bulu kuduk Sari berdiri — terlambat. Sesuatu menariknya ke kegelapan. Ia terbangun di depan langgar dengan tasbih melingkar di pergelangan tangan. Ustadz Karim menatapnya dari pintu: "Pelan-pelan, Nak. Ia mendengar langkah yang tergesa."',
      map: ['##############', '#.....#......#', '#..U..#..s..a#', '#.....+......#', '###+####+#####', '#............#', '#.S...M...S..#', '#............#', '#.....#......#', '##############'],
      start: [5.5, 8.5], sa: -1.57,
      npc: { U: { nama: 'USTADZ KARIM', ikon: '👳', kulit: [175, 135, 100], rambut: [60, 60, 60], baju: [240, 240, 235], kain: [120, 130, 140], topi: 'peci', tasbih: true, mulut: 'senyum' } },
      item: { s: ['tasbih', '📿'], a: ['air doa', '🍶'], M: ['mimbar tua', '📖'], pasang: 'M', butuhPasang: 'doa' },
      tugas: ['bicara Ustadz Karim', 'ambil tasbih', 'ambil air doa', 'minta doa (tasbih+air)', 'baca doa di mimbar'], hantu: { n: 1, jenis: 'genderuwo', cepat: .5, mulai: 'awal' },
      dialog: { U: [
        { syarat: null, teks: '"Kau heran aku masih di sini? Aku pun heran, Nak." Ia tertawa kecil. "Tasbihku tercecer, air doa di kendi. Kumpulkan. Nanti aku ajarkan doa yang dulu — *dulu sekali* — pernah mengusir kegelapan dari desa ini."', opsi: [['Ustadz… masih hidup?', 'ustadz_hidup'], ['Saya kumpulkan dulu.', 'tutup']], flag: 'bicaraU' },
        { syarat: 'tasbih', teks: '"Tasbihnya dapat. Airnya? Kalau dua-duanya ada, duduk. Doa tidak bisa diburu-buru — tapi genderuwo di luar tidak tahu itu, jadi kita baca cepat saja malam ini."', opsi: [['Minta doa (tasbih+air)', 'doa'], ['Sebentar.', 'tutup']] },
        { syarat: 'doa', teks: '"Ingat, Nak: baca di mimbar, menghadap barat. Dan kalau ia menatapmu saat kau membaca… jangan berhenti. *Terutama* jangan berhenti."', opsi: [['Baik, Ustadz.', 'tutup']] }
      ] },
      cabang: { ustadz_hidup: 'Ia diam lama. Kitab di tangannya… tidak ada tulisannya. Halaman-halaman kosong. "Hidup itu relatif, Nak. Yang penting: langgar ini masih terang, dan selama masih terang, desa ini belum kalah. Tasbih, Nak. Air. Kita kerja."' } },
    { judul: 'Kuburan', sub: 'lastri · pocong · makam tak bernama',
      intro: ['Hujan. Kuburan di bukit barat. Nisan-nisan miring, dan satu makam tanpa nama — tanahnya masih gembur, padahal tidak ada yang meninggal di sini 15 tahun.', 'Seorang gadis berkebaya merah duduk di samping makam itu. *"Kak Sari? Aku Lastri. Aku… menunggu lama. Tulang-tulang di makam ini kedinginan. Tidak ada yang membungkusnya dengan kafan."*', 'Tugas: bicara Lastri, ambil cangkul, kumpulkan 3 bunga, tukar bunga → kain kafan, gali makam tak bernama. Pocong-pocong berpatroli di antara nisan.'],
      outro: ['Cangkul keempat. Kain kafan terbentang. Di dalamnya: tulang-tulang kecil dan sebuah papan nama yang sengaja dihapus. Tapi Lastri bisa membacanya — ia selalu bisa.', '*"SARI… bukan. Kakak lain."* Lastri menatapmu. *"Dulu, sebelum Kakak… ada bayi yang lahir mati di desa ini. Bayi lurah. Lurah malu. Ia kubur diam-diam. Dan sejak itu… tidak ada bayi lahir lagi. Desa ini dikutuk oleh air mata seorang ibu yang bahkan tidak boleh menangis."*'],
      gagal: 'Sesuatu yang melompat menangkap Sari di antara nisan. Dingin. Sangat dingin. Ia terbangun di kaki bukit dengan bunga-bunga berserakan. Lastri memanggil dari atas: "Kak! Pelan-pelan! Mereka mendengar langkah yang takut!"',
      map: ['##############', '#f...#....f..#', '#....+.......#', '#.X..+.c.....#', '#....+.......#', '####+####+####', '#............#', '#..L....f....#', '#............#', '#..S....S....#', '##############'],
      start: [6.5, 7.5], sa: -1.57, hujan: true,
      npc: { L: { nama: 'LASTRI', ikon: '👧', hantu: true, kulit: [215, 195, 190], rambut: [30, 25, 25], rambutPanjang: true, baju: [150, 40, 50], kain: [90, 30, 40], rok: true, mulut: 'sedih' } },
      item: { c: ['cangkul', '⛏️'], f: ['bunga', '🌼'], X: ['makam tak bernama', '🪦'], pukul: 'X', butuhItem: 'cangkul', butuhItem2: 'kafan', pukulN: 4 },
      tugas: ['bicara Lastri', 'ambil cangkul', 'kumpulkan 3 bunga', 'tukar bunga → kain kafan', 'gali makam tak bernama'], hantu: { n: 3, jenis: 'pocong', cepat: .62, mulai: 'awal' },
      dialog: { L: [
        { syarat: null, teks: '"Kakak berani ke sini malam-malam? Hebat." Ia tersenyum — senyum yang tidak sampai ke matanya, karena matanya… menangis terus. "Tulangnya kedinginan, Kak. Tolong. Cangkul ada di gubuk. Bunga… ambil tiga. Nanti tukar sama kafan. Kafan punyaku — dari… dari tasku dulu."', opsi: [['Kamu siapa, Lastri?', 'lastri_siapa'], ['Aku bantu.', 'tutup']], flag: 'bicaraL' },
        { syarat: 'bunga:3', teks: 'Ia menerima tiga bunga itu satu per satu, menciumnya. "Masih wangi. Dulu kuburan ini wangi, Kak. Sekarang bau tanah basah saja." Ia menyerahkan kain kafan yang dilipat rapi. "Bungkus tulangnya. Pelan-pelan ya, Kak. Dia kecil."', opsi: [['Tukar (3 bunga → kain kafan)', 'tukar:bunga:kafan:3'], ['Sebentar.', 'tutup']] },
        { syarat: 'kafan', teks: '"Makam yang tanpa nama, di utara. Empat kali cangkul. Jangan takut kalau tanahnya… bergerak. Itu dia. Dia senang akhirnya ada yang datang."', opsi: [['…', 'tutup']] }
      ] },
      cabang: { lastri_siapa: '"Aku? Aku kembang desa, Kak. Dulu." Ia tertawa kecil. "Lurah suka padaku. Istrinya tahu. Malam Kentongan itu… aku disuruh diam. Selamanya." Tangannya meraba lehernya sendiri. "Tapi aku tidak marah lagi. Aku cuma… kedinginan. Seperti tulang-tulang itu."' } },
    { judul: 'Balai Desa', sub: 'ki dalang · keris · surat ibu',
      intro: ['Balai desa. Pintu terbuka. Di dalamnya, wayang-wayang tergantung — dan semuanya berwajah penduduk desa. Di tengah, dalang bertubuh bayangan memainkan keris bercahaya.', '*"SARI BIN LESTARI."* Suaranya seperti gamelan retak. *"Ibumu 15 tahun menolak pergi. Kau… 15 tahun menolak pulang. Sekarang kita selesaikan. Keris di tangan kanan. Surat ibumu di tangan kiri. PILIH."*', 'Tugas terakhir: hadapi Ki Dalang, ambil keris, ambil surat Ibu, tentukan nasib desa. Dua jalan. Tidak ada yang salah. Tapi hanya satu yang benar-benar membebaskan.'],
      outro: ['Pagi. Sari berdiri di gapura dengan keris patah — atau surat yang basah oleh air mata, ia tidak ingat lagi mana yang ia pilih. Yang ia ingat: wayang-wayang itu jatuh satu per satu. Dan di setiap wayang yang jatuh, terdengar suara orang menghela napas lega.', 'Di rumah ujung jalan, pintu terbuka. *"Sari? SARI!"* Ibu berlari — benar-benar berlari — dan 15 tahun berakhir dalam satu pelukan.'],
      gagal: 'Bayangan menelan balai desa. Sari terbangun di gapura dengan keris mainan anak-anak di tangan. Bukan. Bukan yang ini. Ia masuk lagi — kali ini ia tahu: Ki Dalang hanya kuat kalau kau takut. Dan Sari sudah berhenti takut sejak babak pertama.',
      map: ['##############', '#.....#......#', '#..D..#.k.s..#', '#.....+......#', '###+####+#####', '#............#', '#.S...X...S..#', '#............#', '##############'],
      start: [5.5, 7.5], sa: -1.57,
      npc: { D: { nama: 'KI DALANG', ikon: '🎭', hantu: true, dalang: true, kulit: [60, 55, 70], rambut: [10, 10, 12], baju: [25, 20, 35], kain: [25, 20, 35], topi: 'blangkon', mataMerah: true, mulut: 'taring', skala: 1.22 } },
      item: { k: ['keris', '🗡️'], s: ['surat ibu', '💌'] },
      tugas: ['hadapi Ki Dalang', 'ambil keris', 'ambil surat Ibu', 'tentukan nasib desa'], hantu: { n: 2, jenis: 'campur', cepat: .66, mulai: 'awal' },
      dialog: { D: [
        { syarat: null, teks: '*"Lestari memberimu hidup. Desa ini memberimu kutukan. Aku memberimu PILIHAN."* Wayang-wayang bergoyang. *"Keris itu — tusukkan padaku. Jadilah pahlawan. Desa bebas… dan semua arwah di sini, termasuk ibumu, ikut musnah bersamaku."*', opsi: [['Dan jalan kedua?', 'dalang_dua'], ['Aku pikir dulu.', 'tutup']], flag: 'bicaraD' },
        { syarat: 'keris', teks: '*"Keris sudah di tanganmu. Surat ibumu… sudah kau baca? Belum? Baca dulu. Baru pilih."*', opsi: [['⚔️ Tusuk dengan keris', 'lawan'], ['💌 Bacakan surat Ibu', 'ampun'], ['Belum siap.', 'tutup']] },
        { syarat: 'surat ibu', teks: '*"Surat itu… Lestari menulisnya tiap malam 15 tahun. Balasannya tidak pernah datang."* Dalang itu — untuk sesaat — terlihat lelah. *"Pilih, Nak. Keris atau kata-kata."*', opsi: [['⚔️ Tusuk dengan keris', 'lawan'], ['💌 Bacakan surat Ibu', 'ampun'], ['Belum siap.', 'tutup']] }
      ] },
      cabang: { dalang_dua: '*"Jalan kedua: bacakan surat ibumu. Semua. Sampai selesai. Kalau suaramu tidak gemetar… kutukan ini patah dengan sendirinya. Tapi kalau gemetar — kau jadi wayangku. Seperti mereka."* Ia menunjuk wayang-wayang itu. Salah satunya… mirip Sari kecil.' } }
  ],
  js: R`
var W=480,H=600,run=false,t=0,E=null,epN=1,MAP=[],MW=0,MH=0;
var px=0,py=0,pa=0,vx=0,vy=0,turnV=0,bat=100,nyali=100,INV={},FLAG={},lamp=true,keys={},ghosts=[],tugasKe=0,pukulan=0,noise=0,jumpCd=0,shake=0,bobP=0,bobY=0,lastMs=0,lampF=1;
var flies=[],mists=[],drops=[],stars=[];
for(var si=0;si<70;si++)stars.push({x:Math.random()*W,y:Math.random()*H*.4,r:.5+Math.random()*1.4,tw:Math.random()*6});
function tile(x,y){var r=MAP[y|0];return r?r[x|0]||'#':'#'}
function solid(x,y){var c=tile(x,y);return c==='#'||c==='B'||c==='S'||c==='T'||c==='X'||c==='M'||c==='W'}
function solidC(x,y){var r=.22;return solid(x-r,y-r)||solid(x+r,y-r)||solid(x-r,y+r)||solid(x+r,y+r)}
/* ---------- tekstur prosedural ---------- */
function buatTex(fn){var c=document.createElement('canvas');c.width=64;c.height=64;try{fn(c.getContext('2d'))}catch(e){}return c}
var TEX={};
TEX['#']=buatTex(function(g){for(var y=0;y<64;y+=8)for(var x=0;x<64;x+=8){var o=((x+y)/8)%2;g.fillStyle=o?'#8a6a3a':'#6e5429';g.fillRect(x,y,8,8);g.fillStyle='rgba(0,0,0,.28)';if(o)g.fillRect(x,y+6,8,2);else g.fillRect(x+6,y,2,8);g.fillStyle='rgba(255,230,170,.10)';g.fillRect(x,y,8,1)}});
TEX['B']=buatTex(function(g){for(var x=0;x<64;x+=13){g.fillStyle='#5a3d22';g.fillRect(x,0,13,64);g.fillStyle='#412a14';g.fillRect(x+11,0,2,64);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;for(var k=0;k<4;k++){g.beginPath();var gx=x+2+k*3;g.moveTo(gx,0);g.quadraticCurveTo(gx+2,32,gx-1,64);g.stroke()}}});
TEX['S']=buatTex(function(g){g.fillStyle='#5a3025';g.fillRect(0,0,64,64);for(var y=0;y<64;y+=10){var off=((y/10)|0)%2?8:0;for(var x=-8;x<64;x+=16){g.fillStyle='#7d4433';g.fillRect(x+off+1,y+1,14,8);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+off+1,y+8,14,1)}}});
TEX['T']=buatTex(function(g){g.fillStyle='#4a3a28';g.fillRect(0,0,64,64);for(var i=0;i<130;i++){g.fillStyle='rgba('+(40+Math.random()*45|0)+','+(30+Math.random()*32|0)+',20,.55)';var r=1+Math.random()*3;g.fillRect(Math.random()*64,Math.random()*64,r,r)}});
TEX['+']=buatTex(function(g){g.fillStyle='#33230f';g.fillRect(0,0,64,64);g.fillStyle='#54401f';g.fillRect(6,2,52,60);g.fillStyle='#33230f';for(var x=16;x<60;x+=12)g.fillRect(x,2,2,60);g.strokeStyle='#c8a24a';g.lineWidth=3;g.beginPath();g.arc(46,34,5,0,7);g.stroke();g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,64,5)});
TEX['X']=buatTex(function(g){g.fillStyle='#33333d';g.fillRect(0,0,64,64);for(var y=0;y<64;y+=16)for(var x=0;x<64;x+=16){var o=((x+y)/16)%2;g.fillStyle=o?'#454550':'#34343e';g.fillRect(x+1,y+1,14,14)}g.fillStyle='rgba(70,130,70,.4)';for(var i=0;i<22;i++)g.fillRect(Math.random()*64,46+Math.random()*18,3,3)});
TEX['M']=TEX['B'];TEX['W']=TEX['X'];
/* ---------- kontrol ---------- */
['F','B','L','R','TL','TR'].forEach(function(k){hold('b'+k,function(){keys[k]=1},function(){keys[k]=0})});
tap('bLamp',function(){lamp=!lamp;bip(300,.05,'square',.05);say('senter '+(lamp?'ON':'OFF'))});tap('bInv',function(){tas()});tap('bAct',function(){aksi()});
var KM={ArrowUp:'F',ArrowDown:'B',ArrowLeft:'TL',ArrowRight:'TR',a:'L',d:'R'};document.addEventListener('keydown',function(e){if(KM[e.key]){keys[KM[e.key]]=1;e.preventDefault()}if(e.key==='e')aksi();if(e.key==='f')lamp=!lamp;if(e.key==='i')tas()});document.addEventListener('keyup',function(e){if(KM[e.key])keys[KM[e.key]]=0});
function invN(){var n=0;for(var k in INV)n+=INV[k];return n}
function punya(s){var p=String(s).split(':');return (INV[p[0]]||0)>=(+p[1]||1)}
function tas(){if(!run||dopen)return;var l=[];for(var k in INV)if(INV[k]>0)l.push(k+' ×'+INV[k]);dialog('🎒 TAS SARI',l.length?l.join('\n'):'(kosong)\n\nAmbil barang dengan tombol AMBIL saat berada tepat di depannya.')}
function upd(){I('hBat').textContent=Math.max(0,bat|0)+'%';I('hNy').textContent=Math.max(0,nyali|0);I('hNy').style.color=nyali<35?'#ff4d4d':'';I('hInv').textContent=invN();I('hQ').textContent=tugasKe+'/'+E.tugas.length}
function majuTugas(n){if(n>tugasKe){tugasKe=n;say('✓ '+E.tugas[n-1]);bip(660,.1,'sine',.05);upd()}}
function majuSeq(n){if(tugasKe>=n-1)majuTugas(n)}
function skorNow(){return Math.floor(bat)*2+Math.floor(nyali)*2+tugasKe*150+epN*100}
/* ---------- NPC / aksi ---------- */
function depan(){for(var d=.6;d<=1.9;d+=.35){var x=px+Math.cos(pa)*d,y=py+Math.sin(pa)*d;var c=tile(x,y);if(c!=='.')return {c:c,x:x|0,y:y|0,d:d}}return null}
function aksi(){if(!run||dopen||paused)return;var f=depan();if(!f)return say('tidak ada apa-apa di depanmu');var c=f.c;
 if(E.npc&&E.npc[c]){return bicara(c)}
 if(E.item&&E.item[c]&&E.item[c].length){var it=E.item[c];var nama=it[0];
  if(E.item.pukul===c){if(!punya(E.item.butuhItem||'palu'))return say('butuh '+(E.item.butuhItem||'palu'));if(E.item.butuhItem2&&!punya(E.item.butuhItem2))return say('butuh '+E.item.butuhItem2+' dulu');pukulan++;bip(90,.15,'square',.15);getar(80);noise=1;shake=Math.max(shake,6);say('⛏️ gali '+pukulan+'/'+(E.item.pukulN||5));if(pukulan>=(E.item.pukulN||5)){majuSeq(E.tugas.length);setTimeout(function(){run=false;tamat(true,skorNow())},600)}return}
  if(E.item.pasang===c){if(!punya(E.item.butuhPasang||'gembok'))return say('butuh '+E.item.butuhPasang);if(E.item.butuhPasang2&&!punya(E.item.butuhPasang2))return say('butuh '+E.item.butuhPasang2+' juga');majuSeq(E.tugas.length);say(it[1]+' '+nama+' — selesai');bip(200,.3,'square',.1);setTimeout(function(){run=false;tamat(true,skorNow())},800);return}
  INV[nama]=(INV[nama]||0)+1;setMap(f.x,f.y,'.');bip(520,.08,'sine',.05);say('+ '+it[1]+' '+nama);
  if(epN===1&&nama==='minyak')majuSeq(2);if(epN===1&&nama==='korek')majuSeq(3);
  if(epN===2&&nama==='tali')majuSeq(2);
  if(epN===3&&nama==='tasbih')majuSeq(2);if(epN===3&&nama==='air doa')majuSeq(3);
  if(epN===4&&nama==='cangkul')majuSeq(2);if(epN===4&&nama==='bunga'&&INV.bunga>=3)majuSeq(3);
  if(epN===5&&nama==='keris')majuSeq(2);if(epN===5&&nama==='surat ibu')majuSeq(3);
  upd();return}
 say('…')}
function setMap(x,y,c){var r=MAP[y].split('');r[x]=c;MAP[y]=r.join('')}
function bicara(c){var n=E.npc[c],list=E.dialog[c];var d=null;for(var i=list.length-1;i>=0;i--){var s=list[i].syarat;if(!s||punya(s)){d=list[i];break}}if(!d)d=list[0];
 if(d.flag&&!FLAG[d.flag]){FLAG[d.flag]=true;if(epN===1&&c==='K')majuSeq(1);if(epN===2&&c==='T')majuSeq(1);if(epN===2&&c==='R')majuSeq(4);if(epN===3&&c==='U')majuSeq(1);if(epN===4&&c==='L')majuSeq(1);if(epN===5&&c==='D')majuSeq(1)}
 var opts=d.opsi.map(function(o){return {l:o[0],f:(function(act){return function(){jalankan(act,c)}})(o[1])}});
 dialog(n.ikon+' '+n.nama,d.teks,opts)}
function jalankan(act,c){var p=act.split(':');
 if(p[0]==='tutup')return;
 if(p[0]==='selesai'){if(tugasKe>=E.tugas.length){majuTugas(E.tugas.length);run=false;setTimeout(function(){tamat(true,skorNow())},400)}return}
 if(p[0]==='tukar'){var beri=p[1],dapat=p[2],n=+p[3]||1;if((INV[beri]||0)<n)return say('kamu belum punya '+beri);INV[beri]-=n;if(INV[beri]<=0)delete INV[beri];INV[dapat]=(INV[dapat]||0)+1;bip(700,.1,'sine',.05);bip(900,.1,'sine',.05);say('🔁 '+beri+' → '+dapat);if(epN===2&&dapat==='kunci sumur')majuSeq(3);if(epN===2&&dapat==='cincin')majuSeq(5);if(epN===4&&dapat==='kafan')majuSeq(4);upd();setTimeout(function(){bicara(c)},350);return}
 if(p[0]==='rakit'){if(!punya('minyak'))return say('butuh minyak tanah');if(!punya('korek'))return say('butuh korek');delete INV.minyak;delete INV.korek;INV.lentera=1;bip(700,.15,'sine',.06);say('🏮 lentera menyala!');majuSeq(4);upd();if(E.hantu.mulai==='lentera')spawnGhosts();setTimeout(function(){bicara(c)},350);return}
 if(p[0]==='doa'){if(!punya('tasbih'))return say('butuh tasbih');if(!punya('air doa'))return say('butuh air doa');delete INV.tasbih;delete INV['air doa'];INV.doa=1;bip(520,.2,'sine',.06);say('🤲 doa dihafal');majuSeq(4);upd();setTimeout(function(){bicara(c)},350);return}
 if(p[0]==='lawan'){if(!punya('keris'))return say('butuh keris');majuSeq(4);dialog('⚔️ JALAN KERIS','Sari mengangkat keris — dan menusukkannya ke jantung bayangan itu. Dalang itu tidak melawan. Ia *tertawa*. "Bagus. Bagus! Sekarang kau mengerti rasanya jadi aku." Wayang-wayang jatuh satu per satu. Termasuk satu yang berwajah… Ibu.',[{l:'…',f:function(){run=false;tamat(true,skorNow())}}]);return}
 if(p[0]==='ampun'){if(!punya('surat ibu'))return say('baca surat Ibu dulu (ambil suratnya)');majuSeq(4);dialog('💌 JALAN SURAT','"Nak Sari…" Suaramu gemetar di kalimat pertama. Lalu tidak lagi. "…Ibu tidak pernah menyalahkanmu yang pergi. Ibu hanya takut kau pulang dan menemukan desa ini… dan membencinya." Dalang itu mundur selangkah. Wayang-wayangnya retak. "BERHENTI—" "…karena desa ini tetap rumahmu, Nak. Rumah tidak dibenci. Rumah diperbaiki." Hening. Lalu seluruh balai desa runtuh menjadi debu — dan pagi datang.',[{l:'…',f:function(){run=false;tamat(true,skorNow()+500)}}]);return}
 if(E.cabang&&E.cabang[act]){dialog(E.npc[c].ikon+' '+E.npc[c].nama,E.cabang[act],[{l:'Lanjut',f:function(){bicara(c)}}])}}
/* ---------- hantu ---------- */
var GHOST={pocong:{dmg:22,sk:.95},kunti:{dmg:30,sk:1.05},genderuwo:{dmg:40,sk:1.5}};
function spawnGhosts(){ghosts=[];var JJ=E.hantu.jenis||'pocong';for(var i=0;i<E.hantu.n;i++){var gx,gy,tr=0;do{gx=1+Math.floor(Math.random()*(MW-2));gy=1+Math.floor(Math.random()*(MH-2));tr++}while((tile(gx,gy)!=='.'||Math.hypot(gx-px,gy-py)<5)&&tr<200);var j=JJ==='campur'?['pocong','kunti','genderuwo'][i%3]:JJ;ghosts.push({x:gx+.5,y:gy+.5,j:j,cd:0,see:0,wa:Math.random()*6.28,ph:Math.random()*6})}}
window.__mulai=function(ep,now){epN=ep;E=G.eps[ep-1];MAP=E.map.slice();MH=MAP.length;MW=MAP[0].length;px=E.start[0];py=E.start[1];pa=E.sa;vx=vy=turnV=0;bat=100;nyali=100;INV={};FLAG={};lamp=true;ghosts=[];pukulan=0;tugasKe=0;noise=0;jumpCd=0;shake=0;bobP=0;lastMs=now||0;
 flies=[];for(var i=0;i<24;i++)flies.push({x:px+(Math.random()-.5)*14,y:py+(Math.random()-.5)*14,ph:Math.random()*6,sp:.3+Math.random()*.5});
 mists=[];for(var k=0;k<6;k++)mists.push({x:Math.random()*W,y:H*.35+Math.random()*H*.4,r:60+Math.random()*90,vx:4+Math.random()*8});
 drops=[];if(E.hujan)for(var d=0;d<80;d++)drops.push({x:Math.random()*W,y:Math.random()*H});
 run=true;window.__running=true;t=0;
 if(E.hantu.mulai==='awal')spawnGhosts();upd();dialog('BABAK '+ep+' — '+E.judul,E.intro[E.intro.length-1]+'\n\n*Tugas:*\n'+E.tugas.map(function(x,i){return (i+1)+'. '+x}).join('\n'))};
/* ---------- update: gerakan halus delta-time ---------- */
function update(now){if(!run||paused||dopen){lastMs=now||lastMs;return}t++;var dt=Math.min(.05,Math.max(.001,((now||0)-lastMs)/1000||.016));lastMs=now||lastMs;
 var tr=((keys.TR?1:0)-(keys.TL?1:0))*2.4;turnV+=(tr-turnV)*Math.min(1,dt*10);pa+=turnV*dt;
 var fw=(keys.F?1:0)-(keys.B?.65:0),st=(keys.R?1:0)-(keys.L?1:0);
 var tvx=(Math.cos(pa)*fw+Math.cos(pa+1.5708)*st)*2.3,tvy=(Math.sin(pa)*fw+Math.sin(pa+1.5708)*st)*2.3;
 var acc=fw||st?9:11;vx+=(tvx-vx)*Math.min(1,dt*acc);vy+=(tvy-vy)*Math.min(1,dt*acc);
 var nx=px+vx*dt,ny=py+vy*dt;if(!solidC(nx,py))px=nx;else vx*=.2;if(!solidC(px,ny))py=ny;else vy*=.2;
 var spd=Math.hypot(vx,vy);bobP+=dt*(2+spd*4);bobY=Math.sin(bobP)*Math.min(5,spd*2.2);
 noise=Math.max(0,noise-dt*.5);if(spd>.4)noise=Math.min(1,noise+dt*(spd>1.8?.9:.35));if(lamp)noise=Math.min(1,noise+dt*.12);
 lampF+=(lamp?1:0-lampF)*Math.min(1,dt*8);if(lamp){bat-=dt*1.1;if(bat<=0){bat=0;lamp=false;say('baterai senter habis')}}
 if(jumpCd>0)jumpCd--;if(shake>0)shake=Math.max(0,shake-dt*30);
 /* hantu */
 var near=99;ghosts.forEach(function(g){var d=Math.hypot(g.x-px,g.y-py);near=Math.min(near,d);
  var da=Math.atan2(g.y-py,g.x-px)-pa;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;
  var hear=(noise>.3&&d<8)||(lamp&&d<9&&Math.abs(da)<1);if(hear)g.see=4;
  var speed=E.hantu.cepat*(SET.get().cepat===0?.8:1)*(g.j==='kunti'?1.25:g.j==='genderuwo'?.75:1);
  if(g.see>0){g.see-=dt;var a=Math.atan2(py-g.y,px-g.x);var mx=g.x+Math.cos(a)*speed*dt,my=g.y+Math.sin(a)*speed*dt;if(!solidC(mx,g.y))g.x=mx;if(!solidC(g.x,my))g.y=my;g.ph+=dt*7}
  else{if(Math.random()<dt*.5)g.wa=Math.random()*6.28;var wx=g.x+Math.cos(g.wa)*speed*.4*dt,wy=g.y+Math.sin(g.wa)*speed*.4*dt;if(!solidC(wx,wy)){g.x=wx;g.y=wy}else g.wa=Math.random()*6.28;g.ph+=dt*2}
  if(g.cd>0)g.cd-=dt;
  if(d<.62&&g.cd<=0){g.cd=2.2;var dmg=(GHOST[g.j]||GHOST.pocong).dmg;nyali-=dmg;jumpCd=42;shake=14;noise=1;getar(150);bip(70,.4,'sawtooth',.2);bip(1400,.25,'sine',.08);var ka=Math.atan2(py-g.y,px-g.x);vx=Math.cos(ka)*6;vy=Math.sin(ka)*6;g.x-=(px-g.x)*2.5;g.y-=(py-g.y)*2.5;say('👻 '+dmg+' nyali!');upd()}});
 if(near>7)nyali=Math.min(100,nyali+dt*3);
 var target=70+(near<8?(8-near)*13:0);if(near<3&&t%Math.round(near<1.5?12:26)===0){bip(52,.09,'sine',.22);getar(12)}
 if(nyali<=0){run=false;upd();return tamat(false,skorNow(),E.gagal||'Nyali Sari habis. Desa ini mendapat penghuni baru. Coba lagi: jalan pelan, matikan senter saat hantu dekat.')}
 /* partikel */
 flies.forEach(function(f){f.ph+=dt*f.sp*3;f.x+=Math.sin(f.ph)*dt*.4;f.y+=Math.cos(f.ph*.7)*dt*.4;if(Math.hypot(f.x-px,f.y-py)>9){var a=Math.random()*6.28;f.x=px+Math.cos(a)*7;f.y=py+Math.sin(a)*7}});
 mists.forEach(function(m){m.x+=m.vx*dt;if(m.x-m.r>W)m.x=-m.r});
 if(E.hujan)drops.forEach(function(r){r.y+=dt*700;r.x-=dt*120;if(r.y>H){r.y=-10;r.x=Math.random()*(W+100)}});
 if(t%6===0)upd()}
/* ---------- manusia prosedural (NON-BOXY) ---------- */
function manusia(x,yB,h,lit,n,ph){
 function C(c){return 'rgb('+(c[0]*lit|0)+','+(c[1]*lit|0)+','+(c[2]*lit|0)+')'}
 function C2(c,a){return 'rgba('+(c[0]*lit|0)+','+(c[1]*lit|0)+','+(c[2]*lit|0)+','+a+')'}
 var u=h/100,sk=n.skala||1;u*=sk;
 ctx.save();ctx.globalAlpha=Math.min(1,lit*1.6)*(n.hantu?(.8+Math.sin(t*.06)*.12):1);
 var sw=n.melayang?0:Math.sin(ph)*u*6,br=Math.sin(t*.07+(n.bl||0))*u*1.4;
 if(n.melayang)yB+=Math.sin(t*.09)*u*4;
 if(n.tuyul)yB-=Math.abs(Math.sin(ph*1.4))*u*10;
 if(n.pocong)yB-=Math.abs(Math.sin(ph))*u*12;
 ctx.fillStyle='rgba(0,0,0,'+(.38*lit)+')';ctx.beginPath();ctx.ellipse(x,yB+2,u*13,u*3.6,0,0,7);ctx.fill();
 if(n.pocong){ /* pocong: kain kafan membungkus */
  var hw=u*13,hh=u*72;
  ctx.fillStyle=C([232,230,222]);ctx.beginPath();ctx.moveTo(x-hw,yB);ctx.quadraticCurveTo(x-hw*1.1,yB-hh*.7,x-u*7,yB-hh);ctx.quadraticCurveTo(x,yB-hh-u*8,x+u*7,yB-hh);ctx.quadraticCurveTo(x+hw*1.1,yB-hh*.7,x+hw,yB);ctx.closePath();ctx.fill();
  ctx.fillStyle=C([200,196,188]);ctx.fillRect(x-hw*.9,yB-hh*.62,hw*1.8,u*3);ctx.fillRect(x-hw*.95,yB-hh*.3,hw*1.9,u*3);
  ctx.fillStyle=C([210,190,175]);ctx.beginPath();ctx.ellipse(x,yB-hh*.82,u*7,u*9,0,0,7);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(x-u*3,yB-hh*.84,u*1.6,u*1,0,0,7);ctx.ellipse(x+u*3,yB-hh*.84,u*1.6,u*1,0,0,7);ctx.fill();
  ctx.strokeStyle='#522';ctx.lineWidth=u*1.4;ctx.beginPath();ctx.moveTo(x-u*2,yB-hh*.72);ctx.lineTo(x+u*2,yB-hh*.72);ctx.stroke();
  ctx.restore();return}
 if(n.genderuwo){ /* genderuwo: raksasa berbulu */
  ctx.fillStyle=C([45,32,28]);
  ctx.beginPath();ctx.ellipse(x,yB-u*45,u*17,u*30,0,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(x-u*13,yB-u*30,u*6,0,7);ctx.arc(x+u*13,yB-u*30,u*6,0,7);ctx.fill();
  ctx.strokeStyle=C([45,32,28]);ctx.lineWidth=u*8;ctx.beginPath();ctx.moveTo(x-u*12,yB-u*50);ctx.quadraticCurveTo(x-u*20,yB-u*25,x-u*16+sw,yB-u*4);ctx.moveTo(x+u*12,yB-u*50);ctx.quadraticCurveTo(x+u*20,yB-u*25,x+u*16-sw,yB-u*4);ctx.stroke();
  ctx.fillStyle=C([70,55,50]);ctx.beginPath();ctx.arc(x,yB-u*78,u*11,0,7);ctx.fill();
  ctx.fillStyle=n.mataMerah?C([255,50,50]):'#200';ctx.beginPath();ctx.arc(x-u*4,yB-u*80,u*2.4,0,7);ctx.arc(x+u*4,yB-u*80,u*2.4,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-u*4,yB-u*72);ctx.lineTo(x-u*2,yB-u*66);ctx.lineTo(x,yB-u*72);ctx.moveTo(x+u*4,yB-u*72);ctx.lineTo(x+u*2,yB-u*66);ctx.lineTo(x,yB-u*72);ctx.fill();
  ctx.restore();return}
 var bungkuk=n.bungkuk?u*6:0;
 /* kaki */
 if(!n.melayang&&!n.rok){ctx.strokeStyle=C(n.kulit);ctx.lineWidth=u*6.5;ctx.beginPath();ctx.moveTo(x-u*4,yB-u*44);ctx.lineTo(x-u*4+sw,yB-u*2);ctx.moveTo(x+u*4,yB-u*44);ctx.lineTo(x+u*4-sw,yB-u*2);ctx.stroke();
  ctx.fillStyle=C([30,22,18]);ctx.beginPath();ctx.ellipse(x-u*4+sw,yB-u*1,u*4,u*2,0,0,7);ctx.ellipse(x+u*4-sw,yB-u*1,u*4,u*2,0,0,7);ctx.fill()}
 /* kain / rok */
 ctx.fillStyle=C(n.kain);ctx.beginPath();
 if(n.rok){var gw=n.hantu?Math.sin(t*.12)*u*3:0;ctx.moveTo(x-u*9,yB-u*48);ctx.quadraticCurveTo(x-u*13,yB-u*12,x-u*10+gw,yB);ctx.lineTo(x+u*10+gw,yB);ctx.quadraticCurveTo(x+u*13,yB-u*12,x+u*9,yB-u*48);ctx.closePath();ctx.fill()}
 else{ctx.moveTo(x-u*10,yB-u*54);ctx.lineTo(x+u*10,yB-u*54);ctx.lineTo(x+u*8,yB-u*20);ctx.lineTo(x-u*8,yB-u*20);ctx.closePath();ctx.fill();
  ctx.fillStyle=C2([255,255,255],.12);ctx.fillRect(x-u*8,yB-u*50,u*16,u*3)}
 /* badan */
 ctx.fillStyle=C(n.baju);rr(x-u*10,yB-u*80+br+bungkuk*.4,u*20,u*32,u*9);ctx.fill();
 if(n.baju2){ctx.fillStyle=C2(n.baju2,.8);ctx.fillRect(x-u*10,yB-u*64+br,u*20,u*5)}
 /* lengan */
 ctx.strokeStyle=C(n.baju);ctx.lineWidth=u*6;ctx.beginPath();ctx.moveTo(x-u*10,yB-u*74+br);ctx.quadraticCurveTo(x-u*16,yB-u*56,x-u*13-sw,yB-u*42);ctx.moveTo(x+u*10,yB-u*74+br);ctx.quadraticCurveTo(x+u*16,yB-u*56,x+u*13+sw,yB-u*42);ctx.stroke();
 ctx.fillStyle=C(n.kulit);ctx.beginPath();ctx.arc(x-u*13-sw,yB-u*40,u*3.2,0,7);ctx.arc(x+u*13+sw,yB-u*40,u*3.2,0,7);ctx.fill();
 /* tongkat */
 if(n.tongkat){ctx.strokeStyle=C([110,80,50]);ctx.lineWidth=u*2.6;ctx.beginPath();ctx.moveTo(x+u*17,yB-u*46);ctx.lineTo(x+u*19,yB);ctx.stroke();ctx.fillStyle=C([150,110,60]);ctx.beginPath();ctx.arc(x+u*17,yB-u*46,u*2.6,0,7);ctx.fill()}
 /* tasbih */
 if(n.tasbih){ctx.fillStyle=C([180,140,80]);for(var bi=0;bi<7;bi++){var an=bi/7*6.28;ctx.beginPath();ctx.arc(x+u*13+sw+Math.cos(an)*u*3.4,yB-u*40+Math.sin(an)*u*4.4,u*1.2,0,7);ctx.fill()}}
 /* kepala */
 var hy=yB-u*90+br+bungkuk;
 var hr2=n.tuyul?u*12:u*9;
 ctx.fillStyle=C(n.kulit);ctx.beginPath();ctx.arc(x,hy,hr2,0,7);ctx.fill();
 /* rambut */
 if(n.rambutPanjang){var hw2=n.hantu?Math.sin(t*.15)*u*4:0;ctx.fillStyle=C(n.rambut);ctx.beginPath();ctx.moveTo(x-hr2,hy-u*3);ctx.quadraticCurveTo(x-hr2-u*5+hw2,hy+u*30,x-u*7,hy+u*36);ctx.lineTo(x+u*7,hy+u*36);ctx.quadraticCurveTo(x+hr2+u*5+hw2,hy+u*30,x+hr2,hy-u*3);ctx.quadraticCurveTo(x,hy-hr2-u*5,x-hr2,hy-u*3);ctx.fill()}
 else if(n.tuyul){ctx.fillStyle=C([25,25,25]);ctx.beginPath();ctx.arc(x+u*2,hy-hr2,u*3,0,7);ctx.fill();ctx.strokeStyle=C([25,25,25]);ctx.lineWidth=u*1.4;for(var hi=-1;hi<=1;hi++){ctx.beginPath();ctx.moveTo(x+u*2,hy-hr2-u*2);ctx.lineTo(x+u*2+hi*u*3,hy-hr2-u*7);ctx.stroke()}}
 else if(!n.topi){ctx.fillStyle=C(n.rambut);ctx.beginPath();ctx.arc(x,hy-u*2,hr2,Math.PI*.95,Math.PI*2.05);ctx.fill()}
 /* topi */
 if(n.topi==='blangkon'){ctx.fillStyle=C([42,26,16]);ctx.beginPath();ctx.moveTo(x-hr2-u*1,hy-u*5);ctx.quadraticCurveTo(x,hy-hr2-u*11,x+hr2+u*1,hy-u*5);ctx.lineTo(x+hr2,hy-u*1);ctx.quadraticCurveTo(x,hy-u*7,x-hr2,hy-u*1);ctx.closePath();ctx.fill();ctx.fillStyle=C([200,160,60]);ctx.beginPath();ctx.arc(x,hy-u*9,u*2,0,7);ctx.fill()}
 if(n.topi==='peci'){ctx.fillStyle=C([16,16,20]);rr(x-hr2+u*1,hy-hr2-u*10,hr2*2-u*2,hr2+u*3,u*3);ctx.fill()}
 /* wajah */
 var kedip=((t+(n.bl||0))%200<8)?.15:1;
 if(n.hantu&&!n.dalang&&!n.tuyul){ctx.fillStyle='rgba(20,10,15,.9)';ctx.beginPath();ctx.ellipse(x-hr2*.35,hy-u*1,hr2*.22,hr2*.3,0,0,7);ctx.ellipse(x+hr2*.35,hy-u*1,hr2*.22,hr2*.3,0,0,7);ctx.fill()}
 else{ctx.fillStyle=n.mataMerah?C([255,45,45]):'#181818';ctx.beginPath();ctx.ellipse(x-hr2*.35,hy-u*1,hr2*.16,hr2*.16*kedip,0,0,7);ctx.ellipse(x+hr2*.35,hy-u*1,hr2*.16,hr2*.16*kedip,0,0,7);ctx.fill();
  if(n.mataMerah){ctx.fillStyle=C([255,45,45]);ctx.beginPath();ctx.arc(x-hr2*.35,hy-u*1,hr2*.3,0,7);ctx.arc(x+hr2*.35,hy-u*1,hr2*.3,0,7);ctx.globalAlpha*=.35;ctx.fill();ctx.globalAlpha/=.35}}
 if(n.dalang){ctx.fillStyle=C([150,40,150]);ctx.beginPath();ctx.arc(x,hy+hr2*.45,hr2*.1,0,7);ctx.fill()}
 else if(n.mulut==='taring'){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-u*3,hy+hr2*.35);ctx.lineTo(x-u*1.5,hy+hr2*.6);ctx.lineTo(x,hy+hr2*.35);ctx.moveTo(x+u*3,hy+hr2*.35);ctx.lineTo(x+u*1.5,hy+hr2*.6);ctx.lineTo(x,hy+hr2*.35);ctx.fill()}
 else{ctx.strokeStyle=C([110,60,60]);ctx.lineWidth=u*1.6;ctx.beginPath();if(n.mulut==='sedih'||n.mulut==='usil')ctx.arc(x,hy+hr2*.75,hr2*.35,Math.PI*1.15,Math.PI*1.85);else ctx.arc(x,hy+hr2*.25,hr2*.35,Math.PI*.15,Math.PI*.85);ctx.stroke()}
 ctx.restore()}
/* ---------- render ---------- */
var ZB=new Float32Array(W);
function draw(){if(!E)return;var shx=shake>0?(Math.random()-.5)*shake:0,shy=shake>0?(Math.random()-.5)*shake:0;
 ctx.save();ctx.translate(shx,shy);
 var fov=1.05,half=H/2+bobY;
 /* langit malam + bulan + bintang */
 var g=ctx.createLinearGradient(0,0,0,half);g.addColorStop(0,'#02040c');g.addColorStop(1,'#0a1410');ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,half+20);
 stars.forEach(function(s){ctx.fillStyle='rgba(255,255,255,'+(.3+Math.sin(t*.03+s.tw)*.25)+')';ctx.fillRect(s.x,s.y,s.r,s.r)});
 ctx.fillStyle='#e8eed2';ctx.beginPath();ctx.arc(W*.78,half-190,30,0,7);ctx.fill();ctx.fillStyle='rgba(232,238,210,.15)';ctx.beginPath();ctx.arc(W*.78,half-190,48,0,7);ctx.fill();ctx.fillStyle='#c8d4a8';ctx.beginPath();ctx.arc(W*.78-9,half-198,6,0,7);ctx.arc(W*.78+8,half-182,4,0,7);ctx.fill();
 /* tanah: lajur perspektif */
 var maxd=lamp?12:3.4;
 for(var fy=half;fy<H;fy+=6){var p=(fy-half)/(H-half),lit2=(1-p)*(1-p);var base=lampF>0.5?[34,44,26]:[12,16,10];ctx.fillStyle='rgb('+(base[0]*(0.25+lit2)+p*8|0)+','+(base[1]*(0.25+lit2)+p*6|0)+','+(base[2]*(0.25+lit2)|0)+')';ctx.fillRect(-20,fy,W+40,6)}
 if(lamp){var pg=ctx.createRadialGradient(W/2,H,20,W/2,H,260);pg.addColorStop(0,'rgba(255,230,170,.20)');pg.addColorStop(1,'rgba(255,230,170,0)');ctx.fillStyle=pg;ctx.fillRect(0,half,W,H-half)}
 /* dinding bertekstur */
 var flick=lamp?(.9+Math.random()*.1):1;
 for(var c=0;c<W;c+=2){var ra=pa-fov/2+(c/W)*fov,dx=Math.cos(ra),dy=Math.sin(ra);
  var mxi=px|0,myi=py|0,ddx=Math.abs(1/(dx||1e-6)),ddy=Math.abs(1/(dy||1e-6)),sx,sy,sdx,sdy;
  if(dx<0){sx=-1;sdx=(px-mxi)*ddx}else{sx=1;sdx=(mxi+1-px)*ddx}
  if(dy<0){sy=-1;sdy=(py-myi)*ddy}else{sy=1;sdy=(myi+1-py)*ddy}
  var hit=0,side=0,ch='#',n=0;
  while(!hit&&n<48){if(sdx<sdy){sdx+=ddx;mxi+=sx;side=0}else{sdy+=ddy;myi+=sy;side=1}ch=tile(mxi,myi);if(ch==='#'||ch==='B'||ch==='S'||ch==='T'||ch==='+'||ch==='X'||ch==='M'||ch==='W')hit=1;n++}
  var dist=side?(sdy-ddy):(sdx-ddx);dist*=Math.cos(ra-pa);if(dist<.05)dist=.05;ZB[c]=dist;ZB[c+1]=dist;
  var h=H/dist,y0=half-h/2;
  var lit=Math.max(0,1-dist/maxd);
  if(lamp){var an2=ra-pa;while(an2>Math.PI)an2-=6.283;while(an2<-Math.PI)an2+=6.283;lit*=Math.max(.1,1-Math.abs(an2)*1.15)}
  lit*=side?.72:1;lit=Math.pow(Math.max(0,lit),1.15)*flick;
  var ud=dist/Math.cos(ra-pa),wallX=side?px+ud*dx:py+ud*dy;wallX-=Math.floor(wallX);
  var tex=TEX[ch]||TEX['#'];
  if(h>0){try{ctx.drawImage(tex,(wallX*63)|0,0,1,64,c,y0,2,h)}catch(e){ctx.fillStyle='#222';ctx.fillRect(c,y0,2,h)}
   if(lit<.97){ctx.fillStyle='rgba(0,0,12,'+(1-Math.min(1,lit))+')';ctx.fillRect(c,y0,2,h)}}
  if(ch==='+'&&lit>.1){ctx.fillStyle='rgba(220,180,90,'+(lit*.5)+')';ctx.fillRect(c,y0+h*.44,2,Math.max(2,h*.03))}}
 /* sprite: item, NPC, hantu, kunang */
 var sprites=[];
 for(var y=0;y<MH;y++)for(var x=0;x<MW;x++){var ch2=tile(x,y);
  if(E.npc&&E.npc[ch2])sprites.push({x:x+.5,y:y+.5,t:'npc',n:E.npc[ch2],ph:(x*3+y)*1.3});
  else if(E.item&&E.item[ch2]&&E.item[ch2].length)sprites.push({x:x+.5,y:y+.5,t:'item',ic:E.item[ch2][1],nm:E.item[ch2][0]});}
 ghosts.forEach(function(gh){sprites.push({x:gh.x,y:gh.y,t:'ghost',g:gh})});
 flies.forEach(function(f){if(Math.hypot(f.x-px,f.y-py)<10)sprites.push({x:f.x,y:f.y,t:'fly',f:f})});
 sprites.forEach(function(s){s.d=Math.hypot(s.x-px,s.y-py)});sprites.sort(function(a,b){return b.d-a.d});
 sprites.forEach(function(s){var an=Math.atan2(s.y-py,s.x-px)-pa;while(an>Math.PI)an-=6.283;while(an<-Math.PI)an+=6.283;if(Math.abs(an)>fov/2+.35)return;
  var dist=s.d*Math.cos(an);if(dist<.15)return;var sxp=W/2+Math.tan(an)*(W/2)/Math.tan(fov/2);
  var sh=H/dist;var lit=Math.max(0,1-dist/maxd);if(lamp){var an3=Math.abs(an);lit*=Math.max(.15,1-an3*1.15)}lit*=flick;
  if(s.t==='ghost')lit=Math.max(lit,dist<3?.55:.12);
  if(s.t==='fly')lit=Math.max(lit,.3);
  var wpx=s.t==='npc'?sh*.3:s.t==='ghost'?sh*.35:sh*.2;
  var zbOk=false;for(var q=-1;q<=1;q++){var cc=(sxp+q*wpx*.5)|0;cc-=cc%2;if(cc>=0&&cc<W&&ZB[cc]>dist-.25){zbOk=true;break}}
  if(!zbOk||lit<=.02)return;
  if(s.t==='fly'){var tw2=.4+Math.abs(Math.sin(t*.08+s.f.ph))*.6;ctx.fillStyle='rgba(232,255,154,'+(tw2*Math.min(1,lit+0.3))+')';ctx.shadowColor='#e8ff9a';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(sxp,half-sh*.15+Math.sin(t*.1+s.f.ph)*8,Math.max(1.5,3.2-lit*1.5),0,7);ctx.fill();ctx.shadowBlur=0;return}
  if(s.t==='item'){ctx.save();ctx.globalAlpha=Math.min(1,lit*1.5+.2);ctx.font=(Math.max(10,sh*.3)|0)+'px sans-serif';ctx.textAlign='center';ctx.shadowColor='#ffd27a';ctx.shadowBlur=12;ctx.fillText(s.ic,sxp,half+sh*.28+bobY*.3);ctx.shadowBlur=0;
   if(dist<2.2){ctx.font='bold 11px Georgia';ctx.fillStyle='#e4ecd2';ctx.fillText(s.nm+' — AMBIL',sxp,half+sh*.36+bobY*.3)}ctx.restore();return}
  if(s.t==='npc'){var nn=s.n;var hh=sh*(nn.tuyul?.55:1);manusia(sxp,half+sh*.42+bobY*.3,hh,Math.min(1,lit+.25),nn,s.ph+t*.02);
   if(dist<2.2){ctx.fillStyle='#b8d86a';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(nn.nama+' — BICARA',sxp,half-sh*.42+bobY*.3)}return}
  /* ghost */
  var gg=s.g,GP=GHOST[gg.j]||GHOST.pocong,gh2=sh*GP.sk;
  if(gg.j==='pocong')manusia(sxp,half+sh*.42+bobY*.3,gh2,Math.min(1,lit+.3),{pocong:true,kulit:[210,190,175]},gg.ph);
  else if(gg.j==='kunti')manusia(sxp,half+sh*.42+bobY*.3,gh2,Math.min(1,lit+.3),{hantu:true,melayang:true,kulit:[228,218,212],rambut:[10,10,12],rambutPanjang:true,baju:[230,230,235],kain:[230,230,235],rok:true,mulut:'sedih',mataMerah:gg.see>0},gg.ph);
  else manusia(sxp,half+sh*.42+bobY*.3,gh2,Math.min(1,lit+.3),{genderuwo:true,kulit:[70,55,50],mataMerah:true},gg.ph);
  if(dist<2.5&&gg.see>0){ctx.fillStyle='#ff5f5f';ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.fillText('!!',sxp,half-gh2*.55)}});
 /* kabut */
 mists.forEach(function(m){var mg=ctx.createRadialGradient(m.x,m.y,5,m.x,m.y,m.r);mg.addColorStop(0,'rgba(180,200,180,.10)');mg.addColorStop(1,'rgba(180,200,180,0)');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,7);ctx.fill()});
 /* hujan */
 if(E.hujan){ctx.strokeStyle='rgba(180,210,235,.4)';ctx.lineWidth=1;ctx.beginPath();drops.forEach(function(r){ctx.moveTo(r.x,r.y);ctx.lineTo(r.x-3,r.y+15)});ctx.stroke()}
 /* vignette + grain + darah */
 var vg=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.78);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(lamp?.72:.93)+')');ctx.fillStyle=vg;ctx.fillRect(-20,-20,W+40,H+40);
 if(nyali<45){ctx.fillStyle='rgba(120,0,0,'+((45-nyali)/45*.3*(1+Math.sin(t*.25))/2)+')';ctx.fillRect(-20,-20,W+40,H+40)}
 for(var gi=0;gi<50;gi++){ctx.fillStyle='rgba(255,255,255,'+(Math.random()*.05)+')';ctx.fillRect(Math.random()*W,Math.random()*H,2,2)}
 if(lamp){ctx.fillStyle='rgba(255,220,150,.035)';ctx.beginPath();ctx.moveTo(W/2,H);ctx.lineTo(0,H*.25);ctx.lineTo(W,H*.25);ctx.fill()}
 /* jumpscare */
 if(jumpCd>0){ctx.fillStyle='rgba(140,0,0,'+Math.min(.55,jumpCd/60)+')';ctx.fillRect(-20,-20,W+40,H+40);
  var ja=1-jumpCd/42;ctx.fillStyle='rgba(240,235,225,'+(.9*(1-ja))+')';ctx.beginPath();ctx.ellipse(W/2,H*.42,90+ja*60,120+ja*70,0,0,7);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(W/2-32,H*.38,12,20,0,0,7);ctx.ellipse(W/2+32,H*.38,12,20,0,0,7);ctx.ellipse(W/2,H*.52,20,34,0,0,7);ctx.fill()}
 /* tugas + prompt */
 ctx.fillStyle='rgba(8,14,6,.78)';rr(8,8,W-16,26,4);ctx.fill();ctx.fillStyle='#e4ecd2';ctx.font='12px Georgia';ctx.textAlign='left';ctx.fillText('BABAK '+epN+' · '+(E.tugas[tugasKe]?('tugas: '+E.tugas[tugasKe]):'selesaikan…'),16,26);
 var f=depan();if(f&&(E.npc&&E.npc[f.c]||E.item&&E.item[f.c]&&E.item[f.c].length)){ctx.fillStyle='#b8d86a';ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.fillText('[ BICARA / AMBIL ]',W/2,H-22)}
 /* minimap */
 var ms=4;ctx.save();ctx.globalAlpha=.6;ctx.translate(W-MW*ms-10,44);ctx.fillStyle='#000';ctx.fillRect(-2,-2,MW*ms+4,MH*ms+4);
 for(var yy=0;yy<MH;yy++)for(var xx=0;xx<MW;xx++){var cc=tile(xx,yy);if(cc==='#'||cc==='B'||cc==='S'||cc==='T'||cc==='X'||cc==='M'||cc==='W'){ctx.fillStyle='#3a4a2a';ctx.fillRect(xx*ms,yy*ms,ms,ms)}else if(cc!=='.'){ctx.fillStyle=E.npc&&E.npc[cc]?'#b8d86a':'#8ad';ctx.fillRect(xx*ms,yy*ms,ms,ms)}}
 ghosts.forEach(function(gh){if(Math.hypot(gh.x-px,gh.y-py)<8){ctx.fillStyle='#ff3b3b';ctx.fillRect(gh.x*ms-1.5,gh.y*ms-1.5,3,3)}});
 ctx.fillStyle='#fff';ctx.fillRect(px*ms-1.5,py*ms-1.5,3,3);
 ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(px*ms,py*ms);ctx.lineTo((px+Math.cos(pa)*1.2)*ms,(py+Math.sin(pa)*1.2)*ms);ctx.stroke();ctx.restore();
 ctx.restore()}
(function loop(now){update(now||0);draw();requestAnimationFrame(loop)})();
`
}

export default { kampungmati }
