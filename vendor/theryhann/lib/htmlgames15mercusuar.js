/**
 * lib/htmlgames15mercusuar.js — 🗼 MERCUSUAR TERAKHIR (v7.28.0)
 * ------------------------------------------------------------------
 *  Game cerita baru: penjaga mercusuar di pulau badai. Mekanik unik:
 *  memutar arah sorot lampu (drag di layar) untuk menuntun kapal ke
 *  pelabuhan melewati karang, sambil menjawab sinyal morse kapal
 *  (tombol PENDEK/PANJANG). Malam bertambah gelap, badai & kabut tiap
 *  episode. UI: buku catatan penjaga (kertas, tinta biru, cap lilin),
 *  palet laut-badai — berbeda dari 14 game lain. 6 episode.
 */
const R = String.raw

export const mercusuar = {
  id: 'mercusuar', cmd: '.mercusuar', icon: '🗼', nama: 'Mercusuar Terakhir (cerita 6 ep)', judul: 'MERCUSUAR TERAKHIR', sub: 'LAUT · BADAI · MORSE',
  ikon: '', ket: 'penjaga mercusuar menuntun kapal lewat karang: putar sorot lampu, jawab sinyal morse. UI buku catatan penjaga, 6 episode',
  bgm: { bpm: 72, wave: 'sine', bwave: 'triangle', lead: [64, 0, 0, 0, 67, 0, 0, 0, 69, 0, 0, 0, 67, 0, 0, 0, 64, 0, 0, 0, 62, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0], bass: [36, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 36, 0, 0, 0, 0, 0, 0, 0], perc: 0, vol: .05, filt: 1400, len: 1.8 },
  css: `html,body{background:#0b1a2a}.menuwrap{--acc:#f2c14e;--accink:#2b1d0e;--box:rgba(248,240,220,.92);--line:#8a6d3b;--ink:#2b2a3a;background:#0b1a2a;font-family:Georgia,"Times New Roman",serif}
.bk{min-height:100%;padding:16px 14px;background:radial-gradient(circle at 50% 0%,#1d3b5a,#0b1a2a 70%);position:relative;overflow:hidden}
.bk .lt{position:absolute;left:50%;top:-40px;width:0;height:0;border-left:120px solid transparent;border-right:120px solid transparent;border-top:360px solid rgba(242,193,78,.14);transform:translateX(-50%) rotate(18deg);transform-origin:50% 0;animation:sw 6s ease-in-out infinite alternate;filter:blur(6px)}
@keyframes sw{from{transform:translateX(-50%) rotate(-22deg)}to{transform:translateX(-50%) rotate(22deg)}}
.bk .wv{position:absolute;left:-10%;right:-10%;bottom:-10px;height:90px;background:radial-gradient(60px 22px at 30px 40px,#123554 60%,transparent 62%) 0 0/110px 60px repeat-x,#0e2a44;opacity:.9;animation:wv 4s linear infinite}@keyframes wv{to{background-position-x:110px}}
.pg{position:relative;z-index:2;background:linear-gradient(180deg,#f8f0dc,#efe3c6);color:#2b2a3a;border-radius:6px 14px 14px 6px;padding:16px 16px 14px;box-shadow:0 14px 40px rgba(0,0,0,.6),inset 6px 0 0 #b89a5c;border-left:2px solid #8a6d3b}
.pg:before{content:"";position:absolute;left:0;top:0;bottom:0;width:26px;background:repeating-linear-gradient(180deg,transparent 0 22px,#cbb98e 22px 24px);opacity:.5}
.pg h1{font-size:22px;letter-spacing:2px;text-align:center;color:#1d3b5a;margin:0 0 2px}.pg .sub{text-align:center;font-size:10px;letter-spacing:4px;color:#8a6d3b;margin-bottom:10px}
.pg .ink{font-size:14px;line-height:1.7;color:#25324a;font-style:italic}.pg .ink b{color:#0b1a2a;font-style:normal}
.pg .seal{position:absolute;right:14px;top:10px;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#d8523e,#8f1f14);box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fbe1d5;font-size:20px;transform:rotate(-12deg)}
.pg .ep{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:12px 0}.pg .ep span{border:1px solid #8a6d3b;border-radius:4px;height:38px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#1d3b5a;background:rgba(255,255,255,.4)}.pg .ep span.on{background:#1d3b5a;color:#f8f0dc}.pg .ep span.lk{opacity:.45}
.pg .btn{display:block;text-align:center;padding:11px;margin:8px 0 0;border:1px solid #1d3b5a;border-radius:4px;font-weight:700;letter-spacing:1px;font-size:13px;color:#1d3b5a;background:rgba(255,255,255,.35)}.pg .btn.pri{background:#1d3b5a;color:#f8f0dc;font-size:15px}
.pg .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pg .ft{text-align:center;font-size:10px;letter-spacing:2px;color:#8a6d3b;margin-top:10px}
.hud .p,.hud .ps{background:#f8f0dcdd;color:#1d3b5a;border:1px solid #8a6d3b}.hud .p span{color:#8f1f14;font-family:Georgia,serif}.hud .lg b,.hud .lg small{color:#f8f0dc}
.frame{border:3px solid #8a6d3b;box-shadow:0 0 0 2px #1d3b5a}.dlg{background:#f8f0dcf2;color:#25324a;border-color:#8a6d3b;font-family:Georgia,serif}.dlg b.j{color:#8f1f14}
.k{background:#f8f0dc;color:#1d3b5a;border:2px solid #8a6d3b;font-family:Georgia,serif;font-weight:900}.k.pri{background:linear-gradient(180deg,#f2c14e,#c9962a);color:#2b1d0e;border-color:#8a6d3b}.hint{color:#cbb98e}
.S .ttl{color:#1d3b5a}.S .box{font-family:Georgia,serif}`,
  splash: b => `<div class="bk"><div class="lt"></div><div class="wv"></div><div class="pg"><div class="seal">⚓</div><div class="sub">BUKU JAGA · ${b}</div><h1>MERCUSUAR<br>TERAKHIR</h1><div class="sub">PULAU KARANG HITAM · 1987</div><div class="ink">"Malam ke-1.412. Lampu masih menyala. Ombak setinggi rumah. Kalau kau membaca ini, berarti aku sudah tidak di sini — <b>tapi lampunya harus tetap menyala.</b>"<br><br>— catatan terakhir Pak Darma, penjaga sebelumku</div><div class="btn pri">BUKA BUKU JAGA</div><div class="ft">KETUK UNTUK MULAI</div></div></div>`,
  menu: `function(S){var eps=S.eps.map(function(e,i){var n=i+1;return '<span data-ep="'+n+'" class="'+(n===S.ep?'on':n>S.max?'lk':'')+'">'+(n>S.max?'🔒':'M'+n)+'</span>'}).join('');
   return '<div class="bk"><div class="lt"></div><div class="wv"></div><div class="pg"><div class="seal">⚓</div><div class="sub">BUKU JAGA · PENJAGA: RAKA</div><h1>MERCUSUAR TERAKHIR</h1><div class="sub">MALAM '+S.ep+' / '+S.eps.length+' — '+S.eps[S.ep-1].judul.toUpperCase()+'</div><div class="ink">Kapal diselamatkan (rekor): <b>'+S.best+'</b></div><div class="ep">'+eps+'</div><div class="btn pri" id="mPlay">🕯 NYALAKAN LAMPU — MALAM '+S.ep+'</div><div class="row2"><div class="btn" id="mHow">CARA JAGA</div><div class="btn" id="mStory">CATATAN</div></div><div class="btn" id="mSet">PENGATURAN</div><div class="ft">'+S.brand+'</div></div></div>'}`,
  hud: '<div class="p"><small>KAPAL</small><span id="hK">0/3</span></div><div class="p"><small>KARAM</small><span id="hX">0</span></div><div class="p"><small>MINYAK</small><span id="hM">100%</span></div>',
  kontrol: '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="k" id="bDit" style="height:60px">• PENDEK</div><div class="k pri" id="bOil" style="height:60px">🛢 ISI MINYAK</div><div class="k" id="bDah" style="height:60px">— PANJANG</div></div>',
  hint: 'geser jari di layar = putar sorot lampu · kapal mengikuti cahaya · jawab morse kapal (• / —) sebelum sinyalnya habis',
  how: [['👆', 'GESER di layar untuk memutar arah sorot lampu'], ['🚢', 'kapal berlayar MENUJU cahaya — arahkan ke pelabuhan (bendera), jauhi karang'], ['•—', 'kapal mengirim morse; jawab dengan urutan yang sama (PENDEK/PANJANG) → kapal percaya & lebih cepat'], ['🛢', 'minyak habis = lampu padam; ISI MINYAK saat tidak ada kapal dekat karang']],
  tujuan: 'Selamatkan jumlah kapal target tiap malam. Kabut, badai dan karang bertambah. Jangan biarkan lebih dari 2 kapal karam.',
  tamat: 'Fajar ke-1.418. Badai berhenti. Di pelabuhan, 19 kapal berlabuh — semuanya lewat cahaya yang kau jaga. Raka menulis di halaman terakhir buku jaga: "Lampu masih menyala, Pak Darma. Dan akan terus menyala." Lalu ia menutup buku itu, dan untuk pertama kalinya dalam enam malam, tidur.',
  eps: [
    { judul: 'Malam Pertama', target: 3, kabut: 0, badai: 0, karang: 3, morse: 1, intro: ['Kau *RAKA*, 24 tahun, dikirim ke Pulau Karang Hitam menggantikan Pak Darma yang hilang saat badai bulan lalu.', 'Bukunya masih di meja. Halaman terakhir: *"Lampunya harus tetap menyala."*', 'Radio: "Tiga kapal nelayan menuju pelabuhan malam ini, Mercusuar. Tolong tuntun mereka."'], outro: ['Tiga kapal berlabuh. Salah satu nelayan melambaikan lentera ke arah menara. Raka membalas dengan sorot lampu — dua kali, seperti yang ditulis Pak Darma.', 'Di halaman baru buku jaga, ia menulis: "Malam ke-1.413. Lampu menyala."'], gagal: 'Sebuah kapal menghantam karang. Radio senyap. Raka membaca ulang buku jaga sampai pagi.' },
    { judul: 'Kabut Turun', target: 4, kabut: .45, badai: 0, karang: 4, morse: 2, intro: ['Kabut turun jam sepuluh malam. Dari menara, laut hanya putih.', 'Radio: "Mercusuar, kami tidak melihat cahayamu. Kami kirim morse — jawab kalau kau dengar."', 'Raka membuka buku Pak Darma: *"Kabut: percaya pada suara, bukan mata. Jawab setiap sinyal."*'], outro: ['Empat kapal selamat. Kapten kapal terakhir bicara lewat radio: "Suaramu di morse... sama seperti Darma. Dia mengajarimu?" Raka: "Bukunya yang mengajari."'], gagal: 'Kabut menelan sebuah kapal. Sampai pagi Raka menunggu radio berbunyi. Tidak pernah.' },
    { judul: 'Badai dari Timur', target: 4, kabut: .2, badai: 1, karang: 5, morse: 2, intro: ['Badai dari timur. Angin mendorong kapal keluar dari jalur cahaya.', 'Radio: "Kapal barang *Sri Rejeki*, 12 awak, mesin setengah mati. Kami mengandalkanmu, Mercusuar."', 'Lampu bergetar setiap kali petir menyambar. Raka mengikat dirinya ke pagar menara.'], outro: ['Sri Rejeki berlabuh dengan lambung robek tapi 12 awak selamat. Kaptennya mengirim morse terakhir: *T-E-R-I-M-A K-A-S-I-H*.', 'Raka menyalin morse itu di buku jaga, di bawah tulisan tangan Pak Darma.'], gagal: 'Angin menang malam ini. Raka menulis satu kata di buku jaga: "Maaf."' },
    { judul: 'Minyak Menipis', target: 5, kabut: .3, badai: 1, karang: 5, morse: 3, minyak: .6, intro: ['Kapal pemasok minyak tidak datang — badai menutup pelabuhan utama. Tersisa 60% minyak untuk malam ini.', 'Radio: "Lima kapal, Mercusuar. Kami tahu minyakmu sedikit. Nyalakan hanya saat kami dekat."', 'Raka menghitung: kalau lampu padam sepuluh menit terlalu awal, dua kapal takkan pernah sampai.'], outro: ['Lampu padam tepat saat kapal kelima menyentuh dermaga. Gelap. Raka tertawa sendirian di atas menara — tawa lelah orang yang menang tipis.'], gagal: 'Lampu padam terlalu awal. Di kegelapan, Raka mendengar suara yang tidak akan pernah ia lupakan.' },
    { judul: 'Kapal Pak Darma', target: 5, kabut: .5, badai: 2, karang: 6, morse: 3, intro: ['Radio menangkap morse dari kapal tak dikenal di utara — morse dengan irama yang Raka kenal dari buku: *irama Pak Darma*.', '"Perahu kecil, satu orang, tanpa mesin." Mustahil. Sudah sebulan.', 'Raka memutar lampu ke utara, ke bagian laut yang paling penuh karang.'], outro: ['Perahu itu merapat. Bukan Pak Darma — tapi putranya, *Bayu*, yang sebulan mencari ayahnya di laut dengan perahu dan buku morse ayahnya.', '"Ayah selalu bilang, kalau dia hilang, ikuti cahaya mercusuar. Cahayanya masih ada. Berarti seseorang menjaganya." Bayu menatap Raka. "Terima kasih."'], gagal: 'Perahu kecil itu hilang di antara karang. Raka tidak menulis apa pun malam ini.' },
    { judul: 'Malam Terpanjang', target: 6, kabut: .4, badai: 2, karang: 7, morse: 4, minyak: .8, intro: ['Badai terbesar dalam 30 tahun. Enam kapal terjebak di luar, termasuk kapal pemasok minyak dan kapal Bayu.', 'Radio pusat: "Mercusuar Karang Hitam, kau boleh turun. Tidak ada yang akan menyalahkanmu."', 'Raka menutup radio. Membuka buku jaga ke halaman Pak Darma. *"Lampunya harus tetap menyala."* Ia menyalakan lampu.'], outro: ['Semua kapal berlabuh.'], gagal: 'Menara bertahan, tapi tidak semua kapal. Raka menulis nama-nama mereka di buku jaga, satu per satu, supaya tidak ada yang dilupakan.' }
  ],
  js: R`
var W=480,H=600,run=false,t=0,E=null,epN=1,ang=-Math.PI/2,kapal=[],selamat=0,karam=0,minyak=100,karang=[],port={x:W/2,y:60},morse=null,skor=0,drag=false,lampu=true,petir=0;
var LH={x:W/2,y:H-90};
function upd(){I('hK').textContent=selamat+'/'+E.target;I('hX').textContent=karam;I('hM').textContent=Math.max(0,Math.round(minyak))+'%'}
function buatKarang(){karang=[];var n=E.karang;for(var i=0;i<n;i++){var a=-Math.PI/2+(Math.random()-.5)*2.2,d=150+Math.random()*250;karang.push({x:LH.x+Math.cos(a)*d,y:LH.y+Math.sin(a)*d,r:16+Math.random()*16})}karang=karang.filter(function(k){return Math.hypot(k.x-port.x,k.y-port.y)>80&&k.y>20&&Math.abs(k.x-W/2)>34&&Math.hypot(k.x-LH.x,k.y-LH.y)>120})}
function spawn(){var sisi=Math.random()<.5?-1:1;var k={x:W/2+sisi*(200+Math.random()*30),y:150+Math.random()*200,vx:0,vy:0,spd:.55+epN*.05,trust:0,id:Math.random(),lentera:0};kapal.push(k)}
function mulaiMorse(k){var pola=[];for(var i=0;i<E.morse+1;i++)pola.push(Math.random()<.5?0:1);morse={k:k,pola:pola,jawab:[],sisa:520+E.morse*120};say('📻 morse dari kapal: '+pola.map(function(p){return p?'—':'•'}).join(' ')+'  — jawab!')}
function jawab(v){if(!morse||!run||paused||dopen)return;morse.jawab.push(v);bip(v?520:760,v?.22:.09,'sine',.08);getar(v?40:15);
 var i=morse.jawab.length-1;if(morse.pola[i]!==v){say('✗ salah — kapal ragu');morse.k.trust=Math.max(-1,morse.k.trust-1);morse=null;return}
 if(morse.jawab.length===morse.pola.length){say('✓ kapal percaya — melaju lebih cepat');morse.k.trust=2;skor+=25;morse=null}}
window.__mulai=function(ep){epN=ep;E=G.eps[ep-1];run=true;window.__running=true;t=0;kapal=[];selamat=0;karam=0;minyak=100*(E.minyak||1);ang=-Math.PI/2;morse=null;lampu=true;skor=0;buatKarang();spawn();upd();dialog('MALAM '+ep+' — '+E.judul,E.intro[E.intro.length-1])};
function update(){if(!run||paused||dopen)return;t++;
 if(lampu){minyak-=.012*(1+E.badai*.3);if(minyak<=0){minyak=0;lampu=false;say('🕯 lampu PADAM — isi minyak!')}}
 if(E.badai&&Math.random()<.004*E.badai)petir=8;if(petir>0)petir--;
 if(t%Math.max(200,420-epN*30)===0&&kapal.length<3)spawn();
 var lx=LH.x+Math.cos(ang)*600,ly=LH.y+Math.sin(ang)*600;
 for(var i=kapal.length-1;i>=0;i--){var k=kapal[i];
  var tx,ty;if(lampu){/* menuju titik terdekat di garis sorot, lalu ke pelabuhan kalau sorot mengarah ke sana */var dx=lx-LH.x,dy=ly-LH.y,L=Math.hypot(dx,dy);var proj=((k.x-LH.x)*dx+(k.y-LH.y)*dy)/(L*L);proj=Math.max(.05,Math.min(1,proj));tx=LH.x+dx*proj;ty=LH.y+dy*proj;
   var dPort=Math.hypot(k.x-port.x,k.y-port.y);var sorotKePort=Math.abs(Math.atan2(port.y-LH.y,port.x-LH.x)-ang)<.18;if(sorotKePort||dPort<110){tx=port.x;ty=port.y}}else{tx=k.x+(Math.random()-.5)*20;ty=k.y+10}
  var a=Math.atan2(ty-k.y,tx-k.x),sp=k.spd*(k.trust>0?1.5:k.trust<0?.7:1)*(lampu?1:.4);k.vx+=(Math.cos(a)*sp-k.vx)*.04;k.vy+=(Math.sin(a)*sp-k.vy)*.04;
  if(E.badai)k.vx+=Math.sin(t/40+k.id*9)*.05*E.badai;k.x+=k.vx;k.y+=k.vy;k.lentera=(k.lentera+1)%60;
  if(Math.hypot(k.x-port.x,k.y-port.y)<26){kapal.splice(i,1);selamat++;skor+=100;bip(880,.15,'triangle');say('⚓ kapal berlabuh');upd();if(selamat>=E.target){run=false;return tamat(true,skor+Math.round(minyak))}continue}
  for(var j=0;j<karang.length;j++){var c=karang[j];if(Math.hypot(k.x-c.x,k.y-c.y)<c.r+8){kapal.splice(i,1);karam++;bip(120,.5,'sawtooth',.1);getar(120);say('💥 kapal karam di karang');upd();if(karam>2){run=false;return tamat(false,skor,E.gagal)}break}}
  if(k.x<-40||k.x>W+40||k.y>H+20||k.y<-20){kapal.splice(i,1);karam++;say('kapal hilang di laut lepas');upd();if(karam>2){run=false;return tamat(false,skor,E.gagal)}}
 }
 if(!morse&&kapal.length&&Math.random()<.004*E.morse){var kk=kapal[Math.floor(Math.random()*kapal.length)];if(kk.trust<2)mulaiMorse(kk)}
 if(morse){morse.sisa--;if(morse.sisa<=0){say('sinyal hilang…');morse.k.trust=-1;morse=null}}
 if(t%60===0)upd()}
function draw(){var kab=E?E.kabut:0;var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#08131f');g.addColorStop(1,'#0e2a44');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(petir>0){ctx.fillStyle='rgba(220,235,255,'+(petir/8*.5)+')';ctx.fillRect(0,0,W,H)}
 /* ombak */ctx.strokeStyle='rgba(120,170,210,.18)';ctx.lineWidth=1.5;for(var y=90;y<H;y+=26){ctx.beginPath();for(var x=0;x<=W;x+=8){ctx.lineTo(x,y+Math.sin((x+t*1.5)/28+y)*3)}ctx.stroke()}
 /* sorot */if(lampu){ctx.save();ctx.translate(LH.x,LH.y);ctx.rotate(ang);var sg=ctx.createLinearGradient(0,0,620,0);sg.addColorStop(0,'rgba(255,225,140,.55)');sg.addColorStop(1,'rgba(255,225,140,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(620,-70);ctx.lineTo(620,70);ctx.closePath();ctx.fill();ctx.restore()}
 /* pelabuhan */ctx.fillStyle='#3b2a1a';ctx.fillRect(port.x-40,port.y+10,80,10);ctx.fillStyle='#f2c14e';ctx.fillRect(port.x-2,port.y-30,3,40);ctx.fillStyle='#d8523e';ctx.beginPath();ctx.moveTo(port.x+1,port.y-30);ctx.lineTo(port.x+22,port.y-23);ctx.lineTo(port.x+1,port.y-16);ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';ctx.font='bold 9px Georgia';ctx.textAlign='center';ctx.fillText('PELABUHAN',port.x,port.y+34);
 /* karang */karang.forEach(function(c){ctx.fillStyle='#1b1f26';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';for(var i=0;i<3;i++){ctx.beginPath();ctx.arc(c.x+Math.cos(t/20+i*2)*(c.r+4),c.y+Math.sin(t/20+i*2)*(c.r+4),2,0,7);ctx.fill()}});
 /* kapal */kapal.forEach(function(k){ctx.save();ctx.translate(k.x,k.y);ctx.rotate(Math.atan2(k.vy,k.vx));ctx.fillStyle=k.trust>0?'#f2c14e':k.trust<0?'#8f1f14':'#e8dcc0';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-10,-6);ctx.lineTo(-10,6);ctx.closePath();ctx.fill();ctx.fillStyle='#2b1d0e';ctx.fillRect(-6,-2,6,4);ctx.restore();if(k.lentera<30){ctx.fillStyle='rgba(255,200,80,.9)';ctx.beginPath();ctx.arc(k.x,k.y-10,2.5,0,7);ctx.fill()}
  if(morse&&morse.k===k){ctx.fillStyle='#f8f0dc';ctx.font='bold 12px Georgia';ctx.textAlign='center';ctx.fillText(morse.pola.map(function(p,i){return i<morse.jawab.length?'·':(p?'—':'•')}).join(' '),k.x,k.y-18);ctx.fillStyle='rgba(242,193,78,.8)';ctx.fillRect(k.x-20,k.y-32,40*morse.sisa/(520+E.morse*120),3)}});
 /* menara */ctx.fillStyle='#e8dcc0';ctx.fillRect(LH.x-12,LH.y,24,80);ctx.fillStyle='#8f1f14';ctx.fillRect(LH.x-12,LH.y+20,24,14);ctx.fillRect(LH.x-12,LH.y+50,24,14);ctx.fillStyle=lampu?'#fff2b0':'#444';ctx.beginPath();ctx.arc(LH.x,LH.y,10,0,7);ctx.fill();if(lampu){ctx.shadowColor='#f2c14e';ctx.shadowBlur=30;ctx.fill();ctx.shadowBlur=0}
 /* kabut */if(kab>0){ctx.fillStyle='rgba(200,210,220,'+(kab*.55)+')';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='destination-out';var rg=ctx.createRadialGradient(LH.x,LH.y,10,LH.x,LH.y,260);rg.addColorStop(0,'rgba(0,0,0,'+(lampu?.9:.4)+')');rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);ctx.restore()}
 if(!E)return;ctx.fillStyle='rgba(248,240,220,.85)';ctx.font='italic 11px Georgia';ctx.textAlign='left';ctx.fillText('Malam '+epN+' · '+E.judul+(E.badai?' · badai':'')+(E.kabut?' · kabut':''),12,H-12)}
(function loop(){update();draw();requestAnimationFrame(loop)})();
function posisi(e){var r=cv.getBoundingClientRect();var p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)/r.width*W,y:(p.clientY-r.top)/r.height*H}}
function putar(e){if(!run||paused||dopen)return;var p=posisi(e);var a=Math.atan2(p.y-LH.y,p.x-LH.x);if(a>-.15&&a<Math.PI/2)a=-.15;if(a<-Math.PI+.15&&a>-Math.PI)a=-Math.PI+.15;if(a>Math.PI/2)a=-Math.PI+.15;ang=a}
cv.addEventListener('touchstart',function(e){e.preventDefault();drag=true;putar(e)},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();if(drag)putar(e)},{passive:false});cv.addEventListener('touchend',function(){drag=false});
cv.addEventListener('mousedown',function(e){drag=true;putar(e)});cv.addEventListener('mousemove',function(e){if(drag)putar(e)});window.addEventListener('mouseup',function(){drag=false});
tap('bDit',function(){jawab(0)});tap('bDah',function(){jawab(1)});
tap('bOil',function(){if(!run||paused||dopen)return;var dekat=kapal.some(function(k){return karang.some(function(c){return Math.hypot(k.x-c.x,k.y-c.y)<70})});if(dekat){say('⚠ ada kapal dekat karang — jangan padamkan sekarang');return}minyak=Math.min(100,minyak+35);lampu=true;bip(300,.2,'triangle');say('🛢 minyak +35% — lampu menyala');upd()});
`
}

export default { mercusuar }
