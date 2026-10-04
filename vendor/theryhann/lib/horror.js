/**
 * lib/horror.js — 👁️ "RUMAH TUA DI UJUNG DESA" — game horor cerita lengkap (v7.14.0)
 * ---------------------------------------------------------------------------
 *  Petualangan top-down dengan senter (lingkaran cahaya), 5 bab, 12 ruangan,
 *  benda & kunci, dialog pilihan, meter KEWARASAN, 3 akhir (kabur / ritual /
 *  terjebak), sosok "Ibu" yang memburu bila kewarasan rendah, jumpscare
 *  (kilatan + getar + suara), catatan (lore) yang menyusun cerita.
 *  Kontrol: D-pad 4 arah + INTERAKSI + SENTER (baterai) + TAS. Lock screen.
 */
import { lockScreen } from './lockscreen.js'
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#050308;font-family:Georgia,"Times New Roman",serif;color:#d9cfc1}
.h{max-width:600px;margin:0 auto;padding:8px 8px 14px;display:none}.h.on{display:block}
.hud{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-family:-apple-system,Roboto,sans-serif}
.hud .lg b{display:block;font-size:17px;letter-spacing:3px;color:#c8102e;font-family:Georgia,serif;text-shadow:0 0 12px #c8102e}
.hud .lg small{display:block;font-size:9px;letter-spacing:3px;color:#8a7f70;margin-top:2px}
.hud .r{display:flex;gap:6px}.hud .p{border-radius:8px;min-width:58px;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:14px;background:#120c14;border:1px solid #2a1f2e}
.hud .p small{font-size:8px;letter-spacing:1.5px;color:#8a7f70;font-weight:800}.hud .p.w span{color:#c8102e}
.stage{position:relative;border-radius:10px;overflow:hidden;border:2px solid #2a1f2e;height:0;padding-bottom:110%;background:#000}
canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none}
.flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.flash.on{animation:fl .5s}@keyframes fl{0%{opacity:.95}100%{opacity:0}}
.stage.shake{animation:sh .4s}@keyframes sh{0%,100%{transform:translate(0)}20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,-3px)}80%{transform:translate(4px,4px)}}
.dlg{position:absolute;left:8px;right:8px;bottom:8px;background:rgba(8,4,10,.94);border:1px solid #3a2a3e;border-radius:10px;padding:12px 14px;display:none;font-size:14px;line-height:1.55}
.dlg.on{display:block}.dlg b{color:#e8b04b;display:block;margin-bottom:4px;font-size:12px;letter-spacing:2px;font-family:-apple-system,Roboto,sans-serif}
.dlg .opts{display:grid;gap:6px;margin-top:10px}.dlg .opts div{background:#1c1220;border:1px solid #3a2a3e;border-radius:8px;padding:10px 12px;font-size:13px}.dlg .opts div:active{background:#3a1a2e}
.dlg .next{margin-top:8px;text-align:right;font-size:11px;color:#8a7f70;font-family:-apple-system,Roboto,sans-serif}
.ctl{display:grid;grid-template-columns:168px 1fr;gap:12px;margin-top:10px;align-items:center;font-family:-apple-system,Roboto,sans-serif}
.pad{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,52px);gap:4px}.pad .k{background:#120c14;border:1px solid #2a1f2e;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#d9cfc1}.pad .k.dn{background:#3a1a2e}.pad .x{visibility:hidden}.pad .c{border-radius:50%;background:#0b070d}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.acts .k{height:78px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;letter-spacing:2px;font-size:13px;border:1px solid #3a2a3e}.acts small{font-size:9px;letter-spacing:1px;opacity:.8;margin-top:3px;font-weight:700}
.acts .k:active,.acts .k.dn{transform:translateY(2px);filter:brightness(1.2)}
.int{grid-column:1/3;background:linear-gradient(180deg,#8a0f22,#5a0a16);color:#fff;box-shadow:0 5px 0 #2a050a}.sen{background:#1c1a10;color:#e8b04b}.tas{background:#141018;color:#d9cfc1}
.hint{text-align:center;font-size:10px;color:#6a6058;margin-top:10px;line-height:1.5;font-family:-apple-system,Roboto,sans-serif}
.over{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9);text-align:center;padding:20px}.over.on{display:flex}
.over h2{font-size:24px;letter-spacing:3px;color:#c8102e;text-shadow:0 0 16px #c8102e}.over p{font-size:13px;color:#d9cfc1;margin:10px 0 16px;line-height:1.6;max-width:360px}
.over .bts{display:flex;gap:10px}.over .btn{height:48px;padding:0 20px;display:flex;align-items:center;justify-content:center;border-radius:10px;font-weight:900;letter-spacing:1px;background:#d9cfc1;color:#111;font-family:-apple-system,Roboto,sans-serif;font-size:13px}.over .btn.sec{background:transparent;border:1px solid #d9cfc1;color:#d9cfc1}
`

const JS = String.raw`
(function(){
var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),W=520,H=572;cv.width=W;cv.height=H;var TS=40;
var I=document.getElementById.bind(document),dlg=I('dlg'),over=I('over'),stage=I('stage');
var sfx=true,AC=null;function snd(f,d,tp,v){if(!sfx)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.type=tp||'sine';o.frequency.value=f;g.gain.value=v||.05;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
function scream(){snd(90,.9,'sawtooth',.12);setTimeout(function(){snd(1400,.5,'square',.06)},60);setTimeout(function(){snd(60,1.2,'sawtooth',.1)},200)}
function jumpscare(txt){I('flash').className='flash on';stage.className='stage shake';scream();setTimeout(function(){I('flash').className='flash';stage.className='stage'},600);waras(-15);if(txt)say(txt)}
/* ================= PETA ================= */
/* legenda: #=dinding . =lantai D=pintu(kode) key items dgn huruf */
var ROOMS={
 halaman:{nama:'Halaman Depan',bg:'#0a120a',map:['#############','#...T.....T.#','#...........#','#.....P.....#','#...........#','#.T.......T.#','#...........#','#####.a.#####','#####...#####','#####...#####','#####...#####','#####...#####','#############'],exits:{a:{to:'ruangtamu',x:6,y:10,lock:null}},items:[{x:2,y:2,id:'senter',n:'Senter tua',t:'Senter berkarat, masih menyala. Baterainya tidak penuh.'}],start:{x:6,y:11}},
 ruangtamu:{nama:'Ruang Tamu',bg:'#120c0a',map:['#####b#######','#...........#','#.SS....F...#','#.SS........#','#...........#','#...........c','#...........#','#...........#','#..M........#','#...........#','#...........#','#####.a.#####','#############'],exits:{a:{to:'halaman',x:6,y:6},b:{to:'lorong',x:5,y:10},c:{to:'dapur',x:1,y:5}},items:[{x:3,y:8,id:'catatan1',n:'Surat kabar 1998',t:'“KELUARGA WIRYA MENGHILANG. Rumah ditemukan kosong, meja makan masih tersaji untuk lima orang.” Kamu bergidik.'},{x:8,y:2,id:'foto',n:'Foto keluarga',t:'Ayah, ibu, tiga anak. Wajah si ibu tergores hingga habis. Di balik foto: “Jangan biarkan Ibu menyanyi.”'}],start:{x:6,y:10}},
 dapur:{nama:'Dapur',bg:'#0e100c',map:['#############','#K..........#','#...........#','#...........#','#...OO......#','c...OO......#','#...........#','#......W....#','#...........#','#...........#','#...........#','#...........#','#############'],exits:{c:{to:'ruangtamu',x:11,y:5}},items:[{x:1,y:1,id:'pisau',n:'Pisau dapur',t:'Tumpul, tapi lebih baik daripada tangan kosong.'},{x:7,y:7,id:'kuncigudang',n:'Kunci berkarat',t:'Tergantung di paku, label: “GUDANG”. Kamu mendengar sesuatu bergeser di lantai atas.',efek:function(){waras(-5);say('…sesuatu bergeser di lantai atas.')}}],start:{x:2,y:5}},
 lorong:{nama:'Lorong Lantai 1',bg:'#0c0a10',map:['######d######','#...........#','#...........#','e...........f','#...........#','#...........#','#...........#','#...........#','#...........#','#...........#','#...........#','#####b#######','#############'],exits:{b:{to:'ruangtamu',x:5,y:1},d:{to:'tangga',x:6,y:10},e:{to:'kamaranak',x:11,y:3},f:{to:'gudang',x:1,y:3,lock:'kuncigudang',pesan:'Terkunci. Label pintu: GUDANG.'}},items:[{x:6,y:6,id:'catatan2',n:'Halaman buku harian',t:'“Ibu tidak tidur lagi. Malam ini dia menyanyi di kamar Rara sampai subuh. Ayah bilang jangan dengar. Tapi lagunya… memanggil.”'}],start:{x:6,y:10},event:'lorong1'},
 kamaranak:{nama:'Kamar Anak',bg:'#140c14',map:['#############','#BB.....BB..#','#BB.....BB..#','#...........#','#...........#','#...........#','#...........#','#.....R.....#','#...........#','#...........#','#...........#','#...........e','#############'],exits:{e:{to:'lorong',x:1,y:3}},items:[{x:6,y:7,id:'boneka',n:'Boneka Rara',t:'Boneka kain dengan satu mata kancing. Saat kamu mengangkatnya, kotak musik di dalamnya berbunyi sendiri.',efek:function(){snd(660,.4);snd(880,.4);setTimeout(function(){snd(523,.6)},400);waras(-8)}},{x:2,y:4,id:'catatan3',n:'Gambar krayon',t:'Gambar anak-anak: lima orang di meja makan, satu berdiri di pintu dengan mulut terbuka sangat lebar. Tulisan: “IBU LAPAR”.'}],start:{x:10,y:10}},
 gudang:{nama:'Gudang',bg:'#0a0c0a',map:['#############','#OOO........#','#OOO........#','#...........#','#...........#','#...........#','#.......OO..#','#.......OO..#','#...........#','#...........#','#..........g#','f...........#','#############'],exits:{f:{to:'lorong',x:11,y:3},g:{to:'bawahtanah',x:6,y:1,lock:'lilin',pesan:'Lubang gelap menuju bawah. Terlalu gelap tanpa cahaya lain — senter saja tidak cukup.'}},items:[{x:4,y:4,id:'lilin',n:'Lilin & korek',t:'Tiga batang lilin merah dan korek api. Bau kemenyan.'},{x:9,y:9,id:'garam',n:'Kantong garam',t:'Garam kasar. Di kantongnya tertulis tangan: “taburkan di ambang, dia tidak akan lewat.”'}],start:{x:10,y:11}},
 tangga:{nama:'Tangga',bg:'#0c0a0c',map:['######h######','#...........#','#...........#','#....###....#','#....###....#','#....###....#','#....###....#','#....###....#','#....###....#','#...........#','#...........#','#####d#######','#############'],exits:{d:{to:'lorong',x:6,y:1},h:{to:'lorong2',x:6,y:10}},items:[],start:{x:6,y:10},event:'tangga'},
 lorong2:{nama:'Lorong Lantai 2',bg:'#100a12',map:['#############','#...........#','i...........j','#...........#','#...........#','#...........#','#...........#','#...........#','#...........#','#...........#','#...........#','######h######','#############'],exits:{h:{to:'tangga',x:6,y:1},i:{to:'kamarortu',x:11,y:2,lock:'boneka',pesan:'Pintu tidak mau terbuka. Dari dalam terdengar nyanyian pelan… dan suara anak kecil: “bonekaku…”'},j:{to:'kamarmandi',x:1,y:2}},items:[{x:6,y:5,id:'catatan4',n:'Surat Ayah',t:'“Jika ada yang membaca ini: aku mengurungnya di kamar. Dia bukan istriku lagi. Lilin, garam, dan nama aslinya — hanya itu yang bisa mengembalikannya. Namanya… Sumiati.”'}],start:{x:6,y:10},event:'lorong2'},
 kamarmandi:{nama:'Kamar Mandi',bg:'#0a1010',map:['#############','#...........#','j...........#','#...........#','#....WWW....#','#....WWW....#','#...........#','#...........#','#...........#','#...........#','#.....C.....#','#...........#','#############'],exits:{j:{to:'lorong2',x:11,y:2}},items:[{x:6,y:10,id:'cermin',n:'Cermin retak',t:'Kamu melihat pantulanmu… dan di belakangmu, seorang wanita berdiri dengan rambut menutupi wajah. Saat menoleh — tidak ada siapa-siapa.',efek:function(){jumpscare('👁️ Dia ada di belakangmu.')},tetap:true},{x:2,y:7,id:'baterai',n:'Baterai',t:'Dua baterai besar. Senter kembali terang.',efek:function(){bat=100;say('🔦 baterai penuh')}}],start:{x:2,y:2}},
 kamarortu:{nama:'Kamar Ibu',bg:'#160810',map:['#############','#BBBB.......#','#BBBB.......#','#...........#','#...........#','#...........#','#...........#','#.....A.....#','#...........#','#...........#','#...........#','i...........#','#############'],exits:{i:{to:'lorong2',x:1,y:2}},items:[{x:6,y:7,id:'altar',n:'Altar kecil',t:'Lima piring kosong tersusun melingkar. Di tengah: rambut panjang yang diikat pita merah.',tetap:true},{x:9,y:3,id:'kuncipagar',n:'Kunci pagar',t:'Kunci gembok pagar depan! Kamu bisa kabur… tapi keluarga ini akan tetap terkurung selamanya.'}],start:{x:2,y:10},event:'kamarortu'},
 bawahtanah:{nama:'Ruang Bawah Tanah',bg:'#080408',map:['#############','#...........#','#...........#','#...........#','#....###....#','#....#X#....#','#....#.#....#','#....#.#....#','#...........#','#...........#','#...........#','######g######','#############'],exits:{g:{to:'gudang',x:10,y:10}},items:[{x:6,y:6,id:'lingkaran',n:'Lingkaran ritual',t:'Lingkaran garam lama yang sudah putus. Lima kursi mengelilinginya. Di sini semuanya berakhir — atau dimulai lagi.',tetap:true}],start:{x:6,y:10},event:'bawahtanah'}
};
/* ================= STATE ================= */
var room,map,px,py,dir={x:0,y:1},keys={},t=0,run=false,bat=70,sanity=100,inv=[],dibaca=0,flags={},lv=1,ibu=null,pesan=[],senter=true,mv=0,bab=1,tot=0;
function waras(n){sanity=Math.max(0,Math.min(100,sanity+n));upd();if(sanity<=0&&run){run=false;akhir('gila')}}
function upd(){I('sn').textContent=sanity+'%';I('sn').parentNode.className='p'+(sanity<35?' w':'');I('bt').textContent=Math.max(0,bat|0)+'%';I('bb').textContent=bab}
function say(s){pesan.push({s:s,t:200})}
function tile(x,y){return (map[y]||'')[x]||'#'}
function solid(x,y){var c=tile(x,y);return c==='#'||c==='S'||c==='O'||c==='B'||c==='T'||c==='W'||c==='M'||c==='F'||c==='K'||c==='R'||c==='A'||c==='C'||c==='X'||c==='P'}
function masuk(id,x,y){room=ROOMS[id];map=room.map;px=x!==undefined?x:room.start.x;py=y!==undefined?y:room.start.y;say('— '+room.nama+' —');if(room.event&&!flags[room.event])setTimeout(function(){cerita(room.event)},400);if(ibu&&ibu.room!==id)ibu=null;snd(80,.3,'triangle',.03)}
/* ================= DIALOG ================= */
var dq=[],dopen=false;
function dialog(judul,teks,opts,cb){dq.push({j:judul,t:teks,o:opts,cb:cb});if(!dopen)nextDlg()}
function nextDlg(){var d=dq.shift();if(!d){dopen=false;dlg.className='dlg';return}dopen=true;dlg.className='dlg on';var h='<b>'+d.j+'</b>'+d.t;if(d.o){h+='<div class="opts">'+d.o.map(function(o,i){return '<div data-i="'+i+'">'+o.l+'</div>'}).join('')+'</div>'}else h+='<div class="next">ketuk untuk lanjut ▸</div>';dlg.innerHTML=h;
 if(d.o){dlg.querySelectorAll('.opts div').forEach(function(el){el.onclick=function(e){e.stopPropagation();var o=d.o[+el.getAttribute('data-i')];dopen=false;dlg.className='dlg';o.f&&o.f();if(d.cb)d.cb(o);nextDlg()}})}else dlg.onclick=function(){dopen=false;dlg.className='dlg';if(d.cb)d.cb();nextDlg()}}
/* ================= CERITA ================= */
function cerita(ev){flags[ev]=true;
 if(ev==='intro'){dialog('PROLOG','Hujan. Motormu mogok di ujung desa yang tidak ada di peta. Satu-satunya cahaya datang dari rumah tua di balik pagar besi. Pagar itu tergembok dari dalam… tapi kamu sudah berada di halamannya.');dialog('PROLOG','Di kejauhan, dari dalam rumah, seseorang menyanyikan lagu nina bobo. Pelan. Sumbang. Kamu butuh telepon, tempat berteduh — apa pun. Pintu depan terbuka sendiri.',[{l:'Masuk ke rumah',f:function(){}},{l:'Coba panjat pagar dulu',f:function(){say('Pagar terlalu tinggi dan berduri. Tidak ada jalan lain.');waras(-3)}}])}
 if(ev==='lorong1'){bab=2;upd();dialog('BAB 2 — LORONG','Lampu di lorong berkedip lalu padam. Di ujung lorong, lantai berderit seolah ada yang berjalan… lalu berhenti tepat saat kamu berhenti.');dialog('SUARA','“…anak-anak… makan malam sudah siap…” Suara itu datang dari atas. Kamu belum siap ke atas. Cari tahu dulu apa yang terjadi di rumah ini.')}
 if(ev==='tangga'){dialog('TANGGA','Anak tangga ketujuh hilang. Di dinding, lima bekas tangan kecil berwarna cokelat tua mengarah ke atas. Nyanyian itu makin jelas.',[{l:'Naik perlahan',f:function(){}},{l:'Berteriak: “Siapa di sana?!”',f:function(){jumpscare('Nyanyian berhenti. Lalu tawa.');flags.teriak=true}}])}
 if(ev==='lorong2'){bab=3;upd();dialog('BAB 3 — LANTAI DUA','Di lantai dua udaranya dingin dan berbau melati busuk. Pintu paling kiri bergetar pelan dari dalam — seperti seseorang bersandar padanya. Di lantai, bekas seretan menuju kamar mandi.');if(flags.teriak)dialog('…','Kamu mendengar langkah cepat menuruni tangga di belakangmu. Dia tahu kamu di sini.')}
 if(ev==='kamarortu'){bab=4;upd();dialog('BAB 4 — KAMAR IBU','Wanita itu duduk membelakangimu di depan cermin, menyisir rambut yang menyentuh lantai. Lehernya terlalu panjang. Dia tidak menoleh, tapi di cermin, matanya menatapmu.');dialog('IBU','“Kamu bukan anakku. Tapi kamu boleh duduk. Piringnya masih ada satu.” Di meja: kunci pagar. Di sudut: rambut berpita merah. Kamu hanya punya satu kesempatan bergerak sebelum dia berdiri.',[{l:'Ambil kunci pagar & lari',f:function(){flags.pilihkunci=true;say('Ambil kunci di meja (◆), lalu keluar!');ibu={x:6,y:2,room:'kamarortu',sp:.55,t:0}}},{l:'Panggil namanya: “Sumiati.”',f:function(){if(has('catatan4')){flags.nama=true;say('Dia terdiam. Sisirnya jatuh. “…siapa yang memberitahumu?”');waras(10)}else{jumpscare('Kamu tidak tahu namanya. Dia tertawa.');ibu={x:6,y:2,room:'kamarortu',sp:.7,t:0}}}},{l:'Diam dan mundur perlahan',f:function(){waras(-10);ibu={x:6,y:2,room:'kamarortu',sp:.45,t:0};say('Dia berdiri. Sangat pelan.')}}])}
 if(ev==='bawahtanah'){bab=5;upd();dialog('BAB 5 — BAWAH TANAH','Lima kursi. Lima piring. Empat di antaranya berisi tulang kecil. Lingkaran garam di lantai sudah putus di satu titik — di situlah dia keluar dua puluh tahun lalu.');if(has('garam')&&has('lilin')&&flags.nama)dialog('RITUAL','Kamu punya garam, lilin, dan namanya. Dekati lingkaran (◆) dan selesaikan apa yang tidak sanggup diselesaikan sang Ayah.');else dialog('RITUAL','Kamu merasa ada yang kurang. Lingkaran ini butuh: garam untuk menutup, lilin untuk memanggil, dan NAMA ASLI untuk mengikat. Tanpa ketiganya, dia hanya akan marah.')}
}
function has(id){return inv.indexOf(id)>=0}
/* ================= INTERAKSI ================= */
function depan(){return{x:px+dir.x,y:py+dir.y}}
function interaksi(){if(dopen||!run)return;var f=depan();var key=null;for(var k in room.exits){for(var y=0;y<map.length;y++){var x=map[y].indexOf(k);if(x>=0&&((x===f.x&&y===f.y)||(x===px&&y===py)))key=k}}
 if(key){var ex=room.exits[key];if(ex.lock&&!has(ex.lock)){say(ex.pesan||'Terkunci.');snd(120,.15,'square');return}if(ex.lock==='boneka'&&!flags.bonekaDiberi){flags.bonekaDiberi=true;dialog('SUARA ANAK','“…bonekaku. Terima kasih, kak.” Kunci berputar sendiri. Pintu terbuka.');inv.splice(inv.indexOf('boneka'),1)}
  if(ex.to==='halaman'&&flags.pilihkunci&&has('kuncipagar')){run=false;akhir('kabur');return}masuk(ex.to,ex.x,ex.y);return}
 var it=null;room.items.forEach(function(o){if(!o.ambil&&((o.x===f.x&&o.y===f.y)||(o.x===px&&o.y===py)))it=o});
 if(it){if(it.id==='lingkaran'){return ritual()}if(it.id==='altar'&&!flags.altar){flags.altar=true;dialog('ALTAR','Lima piring untuk lima jiwa. Kamu menyadari: dia tidak menunggu keluarganya kembali. Dia menunggu piring keenam terisi.');waras(-5);return}
  dialog(it.n.toUpperCase(),it.t);if(!it.tetap){it.ambil=true;inv.push(it.id);if(it.id.indexOf('catatan')===0||it.id==='foto')dibaca++;snd(880,.08);}if(it.efek)it.efek();tot++;return}
 say('Tidak ada apa-apa di sini.')}
function ritual(){if(has('garam')&&has('lilin')&&flags.nama){run=false;dialog('RITUAL','Kamu menutup lingkaran dengan garam, menyalakan tiga lilin, dan menyebut namanya tiga kali. “Sumiati. Sumiati. Sumiati.”');dialog('IBU','Dia muncul di ambang, mulutnya terbuka lebar — lalu berhenti. Wajahnya, untuk pertama kali, wajah seorang ibu. Air mata. “…anak-anakku sudah lama pergi, ya?”',null,function(){akhir('ritual')})}
 else{jumpscare('Lingkaran menolak. Sesuatu MERANGKAK keluar dari kegelapan!');if(!ibu)ibu={x:6,y:1,room:'bawahtanah',sp:.6,t:0};say('LARI! Kamu belum punya semua yang dibutuhkan.')}}
function toggleSenter(){senter=!senter;say(senter?'🔦 senter nyala':'🔦 senter mati (hemat baterai, kewarasan turun lebih cepat)');snd(senter?900:300,.06)}
function tas(){var n=inv.map(function(i){var it=null;for(var r in ROOMS)ROOMS[r].items.forEach(function(o){if(o.id===i)it=o});return '• '+(it?it.n:i)}).join('<br>');dialog('TAS ('+inv.length+')',(n||'kosong')+'<br><br><span style="color:#8a7f70;font-size:12px">Catatan dibaca: '+dibaca+'/5 · Nama asli: '+(flags.nama?'diketahui':'?')+'</span>')}
/* ================= IBU (pengejar) ================= */
function updIbu(){if(!ibu||ibu.room!==roomId())return;ibu.t++;var dx=px-ibu.x,dy=py-ibu.y;var d=Math.hypot(dx,dy);if(d>0.1){var sp=ibu.sp*(lv===0?.8:lv===2?1.25:1);var nx=ibu.x+dx/d*sp*.12,ny=ibu.y+dy/d*sp*.12;if(!solid(Math.round(nx),Math.round(ibu.y)))ibu.x=nx;if(!solid(Math.round(ibu.x),Math.round(ny)))ibu.y=ny}
 if(d<.7&&run){if(has('garam')&&!flags.garamPakai){flags.garamPakai=true;inv.splice(inv.indexOf('garam'),1);jumpscare('Kamu menaburkan garam! Dia menjerit dan mundur.');ibu=null;return}if(has('pisau')&&!flags.pisauPakai){flags.pisauPakai=true;inv.splice(inv.indexOf('pisau'),1);jumpscare('Pisau menembus — tapi dia hanya terhuyung. Kamu punya beberapa detik.');ibu.x=Math.max(1,ibu.x-4);waras(-5);return}run=false;jumpscare();setTimeout(function(){akhir('tertangkap')},700)}
 if(t%90===0&&d<5)waras(-3)}
function roomId(){for(var k in ROOMS)if(ROOMS[k]===room)return k}
/* ================= AKHIR ================= */
function akhir(tipe){var skor=dibaca*20+tot*5+sanity;var j,tx;
 if(tipe==='kabur'){j='AKHIR 1 — KABUR';tx='Kamu membuka gembok pagar dan berlari ke jalan raya tanpa menoleh. Motormu menyala pada percobaan pertama. Di kaca spion, lampu rumah itu masih menyala — dan nyanyian itu kini terdengar dari earphone-mu.';skor+=50}
 else if(tipe==='ritual'){j='AKHIR SEJATI — PULANG';tx='Lilin padam satu per satu. Lima kursi kosong, lalu lima bayangan kecil duduk di sana. Ibu tersenyum dan ikut duduk. Rumah itu, untuk pertama kalinya dalam dua puluh tahun, sunyi. Kamu keluar lewat pagar yang kini terbuka sendiri.';skor+=200}
 else if(tipe==='gila'){j='AKHIR 3 — PIRING KEENAM';tx='Kamu tidak ingat sejak kapan kamu duduk di meja makan. Piring di depanmu penuh. Ibu membelai rambutmu. “Makan yang banyak, nak.” Kamu makan.'}
 else{j='TERTANGKAP';tx='Tangannya dingin dan panjang. Hal terakhir yang kamu lihat adalah mulut yang terbuka jauh lebih lebar dari yang seharusnya. Nyanyian itu kini keluar dari tenggorokanmu.'}
 var best=window.__lock?window.__lock.rekor(skor):skor;I('ovT').textContent=j;I('ovP').innerHTML=tx+'<br><br><span style="color:#8a7f70">skor '+skor+' · catatan '+dibaca+'/5 · kewarasan '+sanity+'% · rekor '+best+'</span>';over.className='over on'}
/* ================= LOOP ================= */
function update(){t++;if(!run||dopen)return;if(t%4===0){var nx=px+(keys.l?-1:keys.r?1:0),ny=py+(keys.u?-1:keys.d?1:0);if(keys.l||keys.r||keys.u||keys.d){dir={x:keys.l?-1:keys.r?1:0,y:keys.u?-1:keys.d?1:0};if(!solid(nx,py))px=nx;else nx=px;if(!solid(px,ny))py=ny;mv++;if(mv%6===0)snd(70,.05,'triangle',.02)}}
 /* pintu otomatis saat berdiri di atasnya */for(var k in room.exits){if(tile(px,py)===k){interaksi();return}}
 if(senter&&t%30===0){bat-=lv===2?.9:.6;if(bat<=0){bat=0;senter=false;say('🔦 baterai habis!')}}
 if(t%120===0)waras(senter&&bat>0?(-1):-3);
 if(t%600===0&&!ibu&&sanity<50&&Math.random()<.5&&roomId()!=='halaman'){ibu={x:px+(Math.random()<.5?-5:5),y:py,room:roomId(),sp:.45,t:0};say('…kamu mendengar nyanyian mendekat.');snd(220,.6,'sine',.04)}
 updIbu();pesan.forEach(function(p){p.t--});pesan=pesan.filter(function(p){return p.t>0});if(t%20===0)upd()}
function draw(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);var ox=(W-13*TS)/2,oy=(H-13*TS)/2;
 for(var y=0;y<map.length;y++)for(var x=0;x<map[y].length;x++){var c=map[y][x],X=ox+x*TS,Y=oy+y*TS;ctx.fillStyle=room.bg;ctx.fillRect(X,Y,TS,TS);ctx.fillStyle='rgba(255,255,255,.025)';if((x+y)%2)ctx.fillRect(X,Y,TS,TS);
  if(c==='#'){ctx.fillStyle='#1c1418';ctx.fillRect(X,Y,TS,TS);ctx.fillStyle='#2a1f24';ctx.fillRect(X+2,Y+2,TS-4,TS/2-3)}
  else if('SOBMFKWCRAX'.indexOf(c)>=0){ctx.fillStyle={S:'#3a2a24',O:'#4a3a2a',B:'#3a2430',M:'#4a3a2a',F:'#5a4a3a',K:'#4a4a4a',W:'#2a3a3a',C:'#5a6a6a',R:'#6a2a2a',A:'#5a1a1a',X:'#3a0a0a'}[c];ctx.fillRect(X+4,Y+4,TS-8,TS-8)}
  else if(c==='T'){ctx.fillStyle='#0f1f0f';ctx.beginPath();ctx.arc(X+TS/2,Y+TS/2,TS/2-2,0,7);ctx.fill()}else if(c==='P'){ctx.fillStyle='#2a1a1a';ctx.fillRect(X+10,Y+8,TS-20,TS-12)}
  else if('abcdefghij'.indexOf(c)>=0){ctx.fillStyle='#5a3a1a';ctx.fillRect(X+3,Y+3,TS-6,TS-6);ctx.fillStyle='#e8b04b';ctx.fillRect(X+TS-12,Y+TS/2-2,4,4);var ex=room.exits[c];if(ex&&ex.lock&&!has(ex.lock)){ctx.fillStyle='#c8102e';ctx.font='14px serif';ctx.textAlign='center';ctx.fillText('🔒',X+TS/2,Y+TS/2+5)}}}
 room.items.forEach(function(o){if(o.ambil)return;var X=ox+o.x*TS,Y=oy+o.y*TS;ctx.fillStyle='#e8b04b';ctx.globalAlpha=.6+Math.sin(t*.1)*.3;ctx.beginPath();ctx.arc(X+TS/2,Y+TS/2,6,0,7);ctx.fill();ctx.globalAlpha=1});
 if(ibu&&ibu.room===roomId()){var X=ox+ibu.x*TS,Y=oy+ibu.y*TS;ctx.fillStyle='#0a0508';ctx.fillRect(X+8,Y-14,TS-16,TS+14);ctx.fillStyle='#d9cfc1';ctx.fillRect(X+12,Y-8,TS-24,18);ctx.fillStyle='#000';ctx.fillRect(X+10,Y-14,TS-20,12);ctx.fillStyle='#c8102e';ctx.fillRect(X+15,Y-2,3,3);ctx.fillRect(X+TS-18,Y-2,3,3);ctx.fillStyle='#000';ctx.fillRect(X+16,Y+4,TS-32,8)}
 /* pemain */var PX=ox+px*TS,PY=oy+py*TS;ctx.fillStyle='#2f4f7f';ctx.fillRect(PX+10,PY+8,TS-20,TS-12);ctx.fillStyle='#e8c39e';ctx.fillRect(PX+12,PY+2,TS-24,12);ctx.fillStyle='#e8b04b';ctx.fillRect(PX+TS/2-2+dir.x*10,PY+TS/2-2+dir.y*10,5,5);
 /* kegelapan + senter */var g=ctx.createRadialGradient(PX+TS/2,PY+TS/2,senter&&bat>0?30:8,PX+TS/2,PY+TS/2,senter&&bat>0?150+bat*.6:60);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.6,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,.985)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(senter&&bat>0){ctx.save();ctx.translate(PX+TS/2,PY+TS/2);ctx.rotate(Math.atan2(dir.y,dir.x));var cone=ctx.createLinearGradient(0,0,180,0);cone.addColorStop(0,'rgba(255,230,160,.22)');cone.addColorStop(1,'rgba(255,230,160,0)');ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(180,-70);ctx.lineTo(180,70);ctx.closePath();ctx.fill();ctx.restore()}
 if(sanity<40){ctx.fillStyle='rgba(120,0,20,'+((40-sanity)/40*.25+Math.sin(t*.2)*.05)+')';ctx.fillRect(0,0,W,H)}
 /* noise */if(t%3===0){ctx.fillStyle='rgba(255,255,255,.03)';for(var n=0;n<40;n++)ctx.fillRect(Math.random()*W,Math.random()*H,2,2)}
 ctx.font='bold 12px sans-serif';ctx.textAlign='left';ctx.fillStyle='#8a7f70';ctx.fillText(room.nama.toUpperCase(),10,18);ctx.textAlign='right';ctx.fillText('BAB '+bab,W-10,18);
 pesan.slice(-3).forEach(function(p,i){ctx.globalAlpha=Math.min(1,p.t/40);ctx.font='13px Georgia,serif';ctx.textAlign='center';ctx.fillStyle='#e8d9c1';ctx.fillText(p.s,W/2,H-14-i*18);ctx.globalAlpha=1});
 var f=depan();var target=null;for(var k2 in room.exits)if(tile(f.x,f.y)===k2)target='pintu';room.items.forEach(function(o){if(!o.ambil&&o.x===f.x&&o.y===f.y)target=o.n});if(target){ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e8b04b';ctx.fillText('◆ '+target,W/2,34)}}
function loop(){update();draw();requestAnimationFrame(loop)}
/* ================= KONTROL ================= */
function hold(id,k){var el=I(id);function dn(e){e.preventDefault();keys[k]=true;el.classList.add('dn')}function up(){keys[k]=false;el.classList.remove('dn')}el.addEventListener('touchstart',dn,{passive:false});el.addEventListener('touchend',up);el.addEventListener('touchcancel',up);el.addEventListener('mousedown',dn);el.addEventListener('mouseup',up);el.addEventListener('mouseleave',up)}
hold('u','u');hold('d','d');hold('l','l');hold('r','r');
function tap(id,fn){var el=I(id);el.addEventListener('touchstart',function(e){e.preventDefault();fn()},{passive:false});el.addEventListener('mousedown',fn)}
tap('act',interaksi);tap('sen',toggleSenter);tap('bag',tas);
document.addEventListener('keydown',function(e){var m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};if(m[e.key])keys[m[e.key]]=true;if(e.key===' '||e.key==='Enter')interaksi();if(e.key==='f')toggleSenter();if(e.key==='i')tas()});document.addEventListener('keyup',function(e){var m={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'};if(m[e.key])keys[m[e.key]]=false});
tap('ovR',function(){over.className='over';window.__mulai(window.__lock.level())});tap('ovM',function(){over.className='over';window.__lock.open()});
window.__mulai=function(l){lv=l;for(var r in ROOMS)ROOMS[r].items.forEach(function(o){o.ambil=false});inv=[];flags={};dibaca=0;tot=0;bab=1;sanity=100;bat=lv===0?100:lv===2?50:70;senter=true;ibu=null;pesan=[];dq=[];dopen=false;dlg.className='dlg';masuk('halaman');run=true;setTimeout(function(){cerita('intro')},300);upd()};
masuk('halaman');loop();
})();`

export function horrorHtml (brand = 'THERYHANN!') {
  const L = lockScreen({ id: 'rumahtua', judul: 'RUMAH TUA', sub: 'DI UJUNG DESA · HOROR CERITA', brand, wrap: '.h', warna: { a: '#5a0a16', b: '#c8102e' },
    ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/><circle cx="12" cy="11" r="1.6" fill="#c8102e"/></svg>',
    deskripsi: 'Motormu mogok di depan rumah tua yang menyanyi. 5 bab, 12 ruangan, catatan yang menyusun kisah keluarga Wirya, sosok Ibu yang memburu saat kewarasanmu turun, dan 3 akhir berbeda. Gunakan headset.',
    kontrol: [['✚', 'jalan 4 arah'], ['◆', 'INTERAKSI: benda, pintu, pilihan'], ['🔦', 'senter (baterai) — gelap = kewarasan turun'], ['🎒', 'tas & catatan']],
    level: ['Penakut · baterai 100%', 'Normal · 70%', 'Mimpi buruk · 50%'], rekorKey: 'hr_lk' })
  return '<style>' + CSS + L.css + '</style>' + L.html +
    '<div class="h"><div class="hud"><div class="lg"><b>RUMAH TUA</b><small>DI UJUNG DESA</small></div><div class="r"><div class="p"><small>WARAS</small><span id="sn">100%</span></div><div class="p"><small>BATERAI</small><span id="bt">70%</span></div><div class="p"><small>BAB</small><span id="bb">1</span></div></div></div>' +
    '<div class="stage" id="stage"><canvas id="cv"></canvas><div class="flash" id="flash"></div><div class="dlg" id="dlg"></div><div class="over" id="over"><h2 id="ovT"></h2><p id="ovP"></p><div class="bts"><div class="btn" id="ovR">▶ MAIN LAGI</div><div class="btn sec" id="ovM">☰ MENU</div></div></div></div>' +
    '<div class="ctl"><div class="pad"><div class="k x"></div><div class="k" id="u">▲</div><div class="k x"></div><div class="k" id="l">◀</div><div class="k c"></div><div class="k" id="r">▶</div><div class="k x"></div><div class="k" id="d">▼</div><div class="k x"></div></div>' +
    '<div class="acts"><div class="k int" id="act">◆ INTERAKSI<small>ambil · buka · bicara</small></div><div class="k sen" id="sen">🔦 SENTER<small>hemat baterai</small></div><div class="k tas" id="bag">🎒 TAS<small>catatan</small></div></div></div>' +
    `<div class="hint">baca semua catatan untuk tahu NAMA ASLI-nya · garam menolak, pisau menunda · lilin + garam + nama = akhir sejati<br><b>${esc(brand)}</b></div></div>` +
    '<script>' + L.js + JS + '</script>'
}
export default { horrorHtml }
