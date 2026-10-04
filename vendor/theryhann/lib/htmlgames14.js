/**
 * lib/htmlgames14.js — 10 GAME MULTIPLAYER-ARENA v7.13.0 (lawan = member grup)
 * -------------------------------------------------------------------------
 *  Semua memakai shell + lock screen dari htmlgames13.js. "Pemain lain" =
 *  bot bernama member grup (webview WA tidak punya jaringan → tidak bisa
 *  realtime antar-HP). Tiap game beda sistem & kontrol:
 *   1 agario   🟢 Agar Arena    — makan titik & sel lebih kecil, joystick + SPLIT
 *   2 tankroyale 🛡️ Tank Royale — arena tank, joystick + TEMBAK, zona mengecil
 *   3 hexa     ⬡ Hexa Wars      — paper.io: kuasai wilayah, 4 arah
 *   4 balapan  🏎️ Balapan Grup  — top-down race 5 lap, GAS/REM/◀▶
 *   5 tinju    🥊 Tinju Arena   — sumo dorong keluar ring, joystick + DORONG
 *   6 zombie   🧟 Zombie Bareng — co-op bertahan, joystick + TEMBAK, tim = grup
 *   7 pesawat  ✈️ Dogfight      — pesawat berputar, KIRI/KANAN + TEMBAK/BOOST
 *   8 bomber   💣 Bomber Grup   — bomberman 4 arah + BOM
 *   9 lari     🏃 Lari Rintangan— fall-guys mini: 4 lajur, LOMPAT/GESER
 *  10 tagteam  👻 Kejar-kejaran — tag: yang "IT" mengejar, joystick + DASH
 */
import { shell } from './htmlgames13.js'
import { horrorHtml } from './horror.js'

const NAMA_DEF = ['nekuy', 'Monyet', 'yanto', 'te ff', 'aaahaiii', 'SAIRI', 'mm', 'izjt']
const norm = (d = {}) => {
  const pemain = (d.pemain || []).filter(Boolean).slice(0, 8).map(n => String(n).slice(0, 12))
  return { nama: String(d.nama || 'kamu').slice(0, 12), pemain: pemain.length ? pemain : NAMA_DEF, arena: String(d.arena || 'GLOBAL').slice(0, 14) }
}
const JOY = '<div class="joy"><div class="k" id="j7">↖</div><div class="k" id="j0">↑</div><div class="k" id="j1">↗</div><div class="k" id="j6">←</div><div class="k c"></div><div class="k" id="j2">→</div><div class="k" id="j5">↙</div><div class="k" id="j4">↓</div><div class="k" id="j3">↘</div></div>'
const JOY_CSS = `.ctl{display:grid;grid-template-columns:172px 1fr;gap:12px;margin-top:10px;align-items:center}.joy{display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(3,54px);gap:4px}.joy .k{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);font-size:18px;border-radius:12px}.joy .k.on{background:#fff;color:#000}.joy .c{border-radius:50%}
.act{height:172px;border-radius:24px;font-size:18px;letter-spacing:3px;flex-direction:column;box-shadow:0 8px 0 rgba(0,0,0,.4)}.act small{font-size:10px;letter-spacing:1px;opacity:.85;margin-top:4px}.act.dn{box-shadow:0 2px 0 rgba(0,0,0,.4)}`
const HELP_JS = String.raw`
function papan(list,me,label){var r=list.filter(function(w){return w.hidup!==false}).sort(function(a,b){return b.skor-a.skor}).slice(0,5);ctx.fillStyle='rgba(0,0,0,.5)';rr(W-150,10,140,20+r.length*16,8);ctx.fill();ctx.font='bold 11px sans-serif';ctx.textAlign='left';r.forEach(function(w,i){ctx.fillStyle=w===me?'#ffd84a':'#fff';ctx.fillText((i+1)+'. '+w.nama+'  '+Math.floor(w.skor)+(label||''),W-142,28+i*16)});ctx.textAlign='center'}
function rank(list,me){return list.filter(function(w){return w.hidup!==false}).sort(function(a,b){return b.skor-a.skor}).indexOf(me)+1}
function nametag(x,y,w){ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(w.nama,x,y);ctx.shadowBlur=0}
var COLW=['#ffd84a','#ff5f7a','#3ee6ff','#7cff6b','#ff8a65','#ba68c8','#4fc3f7','#f06292','#aed581'];`
const JOY_JS = String.raw`var dir={x:0,y:0};var J={'0':[0,-1],'1':[1,-1],'2':[1,0],'3':[1,1],'4':[0,1],'5':[-1,1],'6':[-1,0],'7':[-1,-1]};Object.keys(J).forEach(function(k){hold('j'+k,function(){dir={x:J[k][0],y:J[k][1]};document.querySelectorAll('.joy .k').forEach(function(e){e.classList.remove('on')});document.getElementById('j'+k).classList.add('on')},function(){})});
function ptr(e){var b=cv.getBoundingClientRect(),p=e.touches?e.touches[0]:e;var x=(p.clientX-b.left)/b.width*W-W/2,y=(p.clientY-b.top)/b.height*H-H/2;var l=Math.hypot(x,y);if(l>20)dir={x:x/l,y:y/l}}cv.addEventListener('touchstart',function(e){e.preventDefault();ptr(e)},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();ptr(e)},{passive:false});
document.addEventListener('keydown',function(e){var m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key])dir={x:m[e.key][0],y:m[e.key][1]}});`

/* ============ 1. AGAR ARENA ============ */
const AGAR_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var MAP=2000,me,cells=[],foods=[],run=false,lv=1,t=0,cam={x:0,y:0},split=0;
function mk(nama,bot,i){return{nama:nama,bot:bot,x:Math.random()*MAP,y:Math.random()*MAP,r:bot?14+Math.random()*10:16,c:COLW[i%COLW.length],hidup:true,skor:0,aiT:0,tx:0,ty:0,vx:0,vy:0}}
function reset(l){lv=l;cells=[];foods=[];me=mk(__D.nama,false,0);me.x=MAP/2;me.y=MAP/2;cells.push(me);var n=[5,7,9][l];for(var i=0;i<n;i++)cells.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));for(var f=0;f<300;f++)foods.push({x:Math.random()*MAP,y:Math.random()*MAP,c:COLW[Math.floor(Math.random()*COLW.length)]});split=0;dir={x:0,y:0};upd()}
function upd(){document.getElementById('sk').textContent=Math.floor(me.r);document.getElementById('rk').textContent='#'+rank(cells,me);document.getElementById('hd').textContent=cells.filter(function(c){return c.hidup}).length}
function ai(c){c.aiT--;if(c.aiT<=0){c.aiT=30+Math.random()*50;var target=null,bd=1e9;cells.forEach(function(o){if(o!==c&&o.hidup){var d=Math.hypot(o.x-c.x,o.y-c.y);if(o.r<c.r*.8&&d<bd&&d<400){bd=d;target=o}}});var flee=null;cells.forEach(function(o){if(o!==c&&o.hidup&&o.r>c.r*1.2&&Math.hypot(o.x-c.x,o.y-c.y)<250)flee=o});
 if(flee){c.tx=c.x-(flee.x-c.x);c.ty=c.y-(flee.y-c.y)}else if(target&&Math.random()<.4+lv*.2){c.tx=target.x;c.ty=target.y}else{var f=foods[Math.floor(Math.random()*foods.length)];c.tx=f.x;c.ty=f.y}}
 var dx=c.tx-c.x,dy=c.ty-c.y,l=Math.hypot(dx,dy)||1;gerak(c,dx/l,dy/l)}
function gerak(c,dx,dy){var sp=Math.max(1.4,5.2-c.r*.05);c.x+=dx*sp+c.vx;c.y+=dy*sp+c.vy;c.vx*=.9;c.vy*=.9;c.x=Math.max(c.r,Math.min(MAP-c.r,c.x));c.y=Math.max(c.r,Math.min(MAP-c.r,c.y))}
function update(){t++;if(!run)return;me.skor=me.r;gerak(me,dir.x,dir.y);cells.forEach(function(c){if(c.bot&&c.hidup){ai(c);c.skor=c.r}});
 cells.forEach(function(c){if(!c.hidup)return;for(var i=foods.length-1;i>=0;i--){var f=foods[i];if((f.x-c.x)*(f.x-c.x)+(f.y-c.y)*(f.y-c.y)<c.r*c.r){foods.splice(i,1);c.r+=.35;if(c===me&&t%4===0)bip(500+c.r*5,.04,'sine',.03)}}});
 while(foods.length<300)foods.push({x:Math.random()*MAP,y:Math.random()*MAP,c:COLW[Math.floor(Math.random()*COLW.length)]});
 cells.forEach(function(a){if(!a.hidup)return;cells.forEach(function(b){if(a===b||!b.hidup)return;if(a.r>b.r*1.15&&Math.hypot(a.x-b.x,a.y-b.y)<a.r-b.r*.4){b.hidup=false;a.r=Math.sqrt(a.r*a.r+b.r*b.r);if(a===me){say('😋 makan '+b.nama);bip(300,.15,'triangle')}if(b===me){run=false;selesai('💀 DIMAKAN '+a.nama,'ukuran '+Math.floor(me.r)+' · peringkat #'+rank(cells,me),Math.floor(me.r))}if(b.bot)setTimeout(function(){var i=cells.indexOf(b);cells[i]=mk(b.nama,true,i)},4000)}})});
 if(me.r>70)me.r-=.02;cam.x+=(me.x-W/2-cam.x)*.15;cam.y+=(me.y-H/2-cam.y)*.15;if(t%15===0)upd();
 if(run&&me.hidup&&cells.filter(function(c){return c.hidup&&c.bot}).length===0){run=false;selesai('👑 RAJA ARENA','semua sel dimakan · ukuran '+Math.floor(me.r),Math.floor(me.r))}}
function splitNow(){if(!run||me.r<24)return say('terlalu kecil untuk pecah');me.r*=.72;me.vx=dir.x*14;me.vy=dir.y*14;say('💥 pecah + dorong');bip(200,.1,'square')}
function draw(){ctx.fillStyle='#f4f6fb';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#dfe3ee';ctx.lineWidth=1;var gs=40,ox=-cam.x%gs,oy=-cam.y%gs;ctx.beginPath();for(var x=ox;x<W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(var y=oy;y<H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();ctx.strokeStyle='#ff5f7a';ctx.lineWidth=6;ctx.strokeRect(-cam.x,-cam.y,MAP,MAP);
 foods.forEach(function(f){var x=f.x-cam.x,y=f.y-cam.y;if(x<-10||x>W+10||y<-10||y>H+10)return;ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill()});
 cells.slice().sort(function(a,b){return a.r-b.r}).forEach(function(c){if(!c.hidup)return;var x=c.x-cam.x,y=c.y-cam.y;ctx.fillStyle=c.c;ctx.beginPath();ctx.arc(x,y,c.r,0,7);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=4;ctx.stroke();nametag(x,y+4,c);ctx.font='10px sans-serif';ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillText(Math.floor(c.r),x,y+16)});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(W-96,H-96,86,86,8);ctx.fill();cells.forEach(function(c){if(!c.hidup)return;ctx.fillStyle=c===me?'#000':c.c;ctx.fillRect(W-96+c.x/MAP*86-2,H-96+c.y/MAP*86-2,4,4)});papan(cells,me)}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('split',splitNow);document.addEventListener('keydown',function(e){if(e.key===' ')splitNow()});
window.__mulai=function(l){reset(l);run=true;say('🟢 makan titik, makan sel yang lebih kecil')};reset(1);loop();`
export function agarHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'agario', brand, judul: 'AGAR ARENA', sub: 'ARENA · ' + D.arena, bg: '#1b2a4a', ratio: '123%', data: D,
    css: JOY_CSS + '.act{background:radial-gradient(circle at 50% 30%,#8ef58e,#2ecc71 60%,#1e8449)}',
    hud: '<div class="p"><small>UKURAN</small><span id="sk">16</span></div><div class="p"><small>RANK</small><span id="rk">#1</span></div><div class="p"><small>HIDUP</small><span id="hd">0</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="split">💥 PECAH<small>dorong maju, ukuran -28%</small></div></div>',
    hint: 'joystick / geser jari · makan titik = tumbuh · sel lebih kecil bisa dimakan, yang lebih besar memakanmu · PECAH untuk kabur/kejar',
    lock: { warna: { a: '#2ecc71', b: '#3ee6ff' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="10" cy="12" r="7"/><circle cx="19" cy="7" r="3" opacity=".8"/></svg>', deskripsi: 'Arena sel ala agar.io. Sel bernama member grup berebut titik makanan; yang besar memakan yang kecil. Jadilah raja arena.', kontrol: [['✥', 'joystick / geser'], ['💥', 'PECAH: dorongan cepat'], ['🗺', 'minimap'], ['👑', 'peringkat live']], level: ['5 lawan', '7 lawan', '9 lawan lapar'], rekorKey: 'ag_lk' },
    js: HELP_JS + JOY_JS + AGAR_JS })
}

/* ============ 2. TANK ROYALE ============ */
const TANK_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var MAP=1600,me,tanks=[],shots=[],walls=[],run=false,lv=1,t=0,cam={x:0,y:0},zone=MAP/2,cool=0,kills=0;
function mk(nama,bot,i){return{nama:nama,bot:bot,x:100+Math.random()*(MAP-200),y:100+Math.random()*(MAP-200),a:Math.random()*6.28,hp:100,c:COLW[i%COLW.length],hidup:true,skor:0,aiT:0,cool:0}}
function reset(l){lv=l;tanks=[];shots=[];walls=[];me=mk(__D.nama,false,0);tanks.push(me);var n=[5,7,9][l];for(var i=0;i<n;i++)tanks.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));for(var w=0;w<26;w++)walls.push({x:Math.random()*MAP,y:Math.random()*MAP,w:40+Math.random()*80,h:40+Math.random()*80});zone=MAP/2;kills=0;dir={x:0,y:0};upd()}
function upd(){document.getElementById('hp').textContent=Math.max(0,me.hp|0);document.getElementById('kl').textContent=kills;document.getElementById('hd').textContent=tanks.filter(function(c){return c.hidup}).length}
function blok(x,y){if(x<10||y<10||x>MAP-10||y>MAP-10)return true;for(var i=0;i<walls.length;i++){var w=walls[i];if(x>w.x-12&&x<w.x+w.w+12&&y>w.y-12&&y<w.y+w.h+12)return true}return false}
function move(c,dx,dy,sp){var nx=c.x+dx*sp,ny=c.y+dy*sp;if(!blok(nx,c.y))c.x=nx;if(!blok(c.x,ny))c.y=ny;if(dx||dy)c.a=Math.atan2(dy,dx)}
function fire(c){if(c.cool>0)return;c.cool=c.bot?40+Math.random()*30:18;shots.push({x:c.x+Math.cos(c.a)*22,y:c.y+Math.sin(c.a)*22,vx:Math.cos(c.a)*9,vy:Math.sin(c.a)*9,o:c,t:70});if(c===me)bip(160,.08,'square',.06)}
function ai(c){c.aiT--;var tgt=null,bd=1e9;tanks.forEach(function(o){if(o!==c&&o.hidup){var d=Math.hypot(o.x-c.x,o.y-c.y);if(d<bd){bd=d;tgt=o}}});var cx=MAP/2,cy=MAP/2;var outside=Math.hypot(c.x-cx,c.y-cy)>zone-40;
 if(outside){var l=Math.hypot(cx-c.x,cy-c.y);move(c,(cx-c.x)/l,(cy-c.y)/l,2.2)}else if(tgt&&bd<380){c.a=Math.atan2(tgt.y-c.y,tgt.x-c.x)+(Math.random()-.5)*(.5-lv*.15);if(Math.random()<.05+lv*.03)fire(c);if(bd>160)move(c,Math.cos(c.a),Math.sin(c.a),1.6);else move(c,Math.cos(c.a+1.57),Math.sin(c.a+1.57),1.4)}else if(c.aiT<=0){c.aiT=40+Math.random()*60;c.wa=Math.random()*6.28}else move(c,Math.cos(c.wa||0),Math.sin(c.wa||0),1.6)}
function update(){t++;if(!run)return;if(dir.x||dir.y)move(me,dir.x,dir.y,2.6);tanks.forEach(function(c){c.cool--;if(c.bot&&c.hidup)ai(c)});if(t%2===0&&zone>140)zone-=.5;
 tanks.forEach(function(c){if(c.hidup&&Math.hypot(c.x-MAP/2,c.y-MAP/2)>zone){c.hp-=.35;if(c===me&&t%40===0)say('☠️ di luar zona!')}});
 for(var i=shots.length-1;i>=0;i--){var s=shots[i];s.x+=s.vx;s.y+=s.vy;s.t--;var hit=s.t<=0||blok(s.x,s.y);tanks.forEach(function(c){if(!hit&&c.hidup&&c!==s.o&&Math.hypot(c.x-s.x,c.y-s.y)<20){hit=true;c.hp-=25;if(c===me)bip(90,.1,'sawtooth');if(c.hp<=0){c.hidup=false;s.o.skor++;if(s.o===me){kills++;say('💥 '+c.nama+' hancur!')}if(c===me){run=false;selesai('💀 HANCUR oleh '+s.o.nama,'kill '+kills+' · peringkat #'+(tanks.filter(function(x){return x.hidup}).length+1),kills)}}}});if(hit)shots.splice(i,1)}
 tanks.forEach(function(c){if(c.hidup&&c.hp<=0){c.hidup=false;if(c===me){run=false;selesai('☠️ MATI DI ZONA','kill '+kills,kills)}}});
 cam.x+=(me.x-W/2-cam.x)*.15;cam.y+=(me.y-H/2-cam.y)*.15;if(t%15===0)upd();
 if(run&&me.hidup&&tanks.filter(function(c){return c.hidup}).length===1){run=false;selesai('🏆 WINNER WINNER','kamu tank terakhir · kill '+kills,kills+5)}}
function draw(){ctx.fillStyle='#8d9b6a';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(0,0,0,.08)';var gs=64,ox=-cam.x%gs,oy=-cam.y%gs;ctx.beginPath();for(var x=ox;x<W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(var y=oy;y<H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
 /* zona */ctx.fillStyle='rgba(120,40,200,.25)';ctx.beginPath();ctx.rect(-cam.x-50,-cam.y-50,MAP+100,MAP+100);ctx.arc(MAP/2-cam.x,MAP/2-cam.y,zone,0,7,true);ctx.fill();ctx.strokeStyle='#b26cff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(MAP/2-cam.x,MAP/2-cam.y,zone,0,7);ctx.stroke();
 walls.forEach(function(w){ctx.fillStyle='#5a4a3a';ctx.fillRect(w.x-cam.x,w.y-cam.y,w.w,w.h);ctx.fillStyle='#7a6a55';ctx.fillRect(w.x-cam.x+4,w.y-cam.y+4,w.w-8,w.h-8)});
 tanks.forEach(function(c){if(!c.hidup)return;var x=c.x-cam.x,y=c.y-cam.y;ctx.save();ctx.translate(x,y);ctx.rotate(c.a);ctx.fillStyle='#222';ctx.fillRect(-18,-16,36,8);ctx.fillRect(-18,8,36,8);ctx.fillStyle=c.c;rr(-14,-10,28,20,4);ctx.fill();ctx.fillStyle='#333';ctx.fillRect(0,-4,26,8);ctx.beginPath();ctx.arc(0,0,8,0,7);ctx.fill();ctx.restore();ctx.fillStyle='#000';ctx.fillRect(x-20,y-30,40,5);ctx.fillStyle=c.hp>40?'#7cff6b':'#ff5f7a';ctx.fillRect(x-20,y-30,40*Math.max(0,c.hp)/100,5);nametag(x,y-36,c)});
 ctx.fillStyle='#ffe066';shots.forEach(function(s){ctx.beginPath();ctx.arc(s.x-cam.x,s.y-cam.y,4,0,7);ctx.fill()});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(W-96,H-96,86,86,8);ctx.fill();ctx.strokeStyle='#b26cff';ctx.beginPath();ctx.arc(W-53,H-53,zone/MAP*86,0,7);ctx.stroke();tanks.forEach(function(c){if(!c.hidup)return;ctx.fillStyle=c===me?'#fff':c.c;ctx.fillRect(W-96+c.x/MAP*86-2,H-96+c.y/MAP*86-2,4,4)});papan(tanks,me,' kill')}
function loop(){update();draw();requestAnimationFrame(loop)}
hold('fire',function(){fire(me)},function(){});setInterval(function(){if(document.getElementById('fire').classList.contains('dn'))fire(me)},120);document.addEventListener('keydown',function(e){if(e.key===' ')fire(me)});
window.__mulai=function(l){reset(l);run=true;say('🛡️ zona ungu mengecil — tetap di dalam!')};reset(1);loop();`
export function tankHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'tankroyale', brand, judul: 'TANK ROYALE', sub: 'BATTLE ROYALE · ' + D.arena, bg: '#2f3a22', ratio: '123%', data: D,
    css: JOY_CSS + '.act{background:radial-gradient(circle at 50% 30%,#ffb347,#ff7b00 60%,#a34a00)}',
    hud: '<div class="p"><small>HP</small><span id="hp">100</span></div><div class="p"><small>KILL</small><span id="kl">0</span></div><div class="p"><small>HIDUP</small><span id="hd">0</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="fire">🔥 TEMBAK<small>tahan = rentetan</small></div></div>',
    hint: 'joystick gerak + arah meriam · TEMBAK (tahan) · zona ungu mengecil, di luar zona HP berkurang · tank terakhir menang',
    lock: { warna: { a: '#ff7b00', b: '#b26cff' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="3" y="11" width="18" height="7" rx="3"/><rect x="8" y="7" width="8" height="5" rx="2"/><rect x="14" y="8" width="8" height="2"/></svg>', deskripsi: 'Battle royale tank melawan member grup. Zona aman mengecil terus, tembok jadi perlindungan. Bertahan sampai jadi tank terakhir.', kontrol: [['✥', 'gerak & arah meriam'], ['🔥', 'TEMBAK (tahan)'], ['🟣', 'zona mengecil'], ['🧱', 'tembok menahan peluru']], level: ['5 lawan', '7 lawan', '9 lawan jitu'], rekorKey: 'tk_lk' },
    js: HELP_JS + JOY_JS + TANK_JS })
}

/* ============ 3. HEXA WARS (paper.io) ============ */
const HEXA_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var N=60,CS=18,grid=[],trail=[],me,ps=[],run=false,lv=1,t=0,cam={x:0,y:0};
function mk(nama,bot,i){var x=4+Math.floor(Math.random()*(N-8)),y=4+Math.floor(Math.random()*(N-8));var p={nama:nama,bot:bot,id:i+1,x:x,y:y,dx:1,dy:0,c:COLW[i%COLW.length],hidup:true,skor:0,trail:[],aiT:0,mv:0};for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++)grid[(y+b)*N+x+a]=p.id;return p}
function reset(l){lv=l;grid=new Array(N*N).fill(0);ps=[];me=mk(__D.nama,false,0);me.dx=0;me.dy=0;ps.push(me);var n=[4,6,8][l];for(var i=0;i<n;i++)ps.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));dir={x:0,y:0};upd()}
function luas(p){var n=0;for(var i=0;i<grid.length;i++)if(grid[i]===p.id)n++;return n}
function upd(){ps.forEach(function(p){p.skor=luas(p)});document.getElementById('sk').textContent=(me.skor/(N*N)*100).toFixed(1)+'%';document.getElementById('rk').textContent='#'+rank(ps,me);document.getElementById('hd').textContent=ps.filter(function(p){return p.hidup}).length}
function isi(p){/* flood dari luar; sel bukan milik p & tidak terjangkau dari tepi → milik p */var vis=new Uint8Array(N*N),st=[];for(var i=0;i<N;i++){st.push(i,i*N,(N-1)*N+i,i*N+N-1)}p.trail.forEach(function(c){grid[c]=p.id});while(st.length){var k=st.pop();if(k<0||k>=N*N||vis[k]||grid[k]===p.id)continue;vis[k]=1;var x=k%N;if(x>0)st.push(k-1);if(x<N-1)st.push(k+1);st.push(k-N,k+N)}for(var j=0;j<N*N;j++)if(!vis[j])grid[j]=p.id;p.trail=[]}
function mati(p,oleh){p.hidup=false;for(var i=0;i<grid.length;i++)if(grid[i]===p.id)grid[i]=0;p.trail=[];if(p===me){run=false;selesai('💀 JALURMU DIPOTONG '+(oleh?'oleh '+oleh.nama:''),'wilayah '+(me.skor/(N*N)*100).toFixed(1)+'% · #'+rank(ps,me),Math.floor(me.skor))}else{say('☠️ '+p.nama+' tersingkir');if(p.bot)setTimeout(function(){var i=ps.indexOf(p);ps[i]=mk(p.nama,true,i)},3000)}}
function step(p){if(!p.dx&&!p.dy)return;var nx=p.x+p.dx,ny=p.y+p.dy;if(nx<0||ny<0||nx>=N||ny>=N)return mati(p);var k=ny*N+nx;
 /* potong jalur siapa pun */ps.forEach(function(o){if(o.hidup&&o.trail.indexOf(k)>=0){if(o===p)mati(p);else{mati(o,p);if(p===me)bip(600,.1,'square')}}});if(!p.hidup)return;
 p.x=nx;p.y=ny;if(grid[k]!==p.id){p.trail.push(k)}else if(p.trail.length){isi(p);if(p===me){bip(700,.08,'sine');say('⬡ wilayah bertambah')}}}
function ai(p){p.aiT--;if(p.aiT<=0){p.aiT=4+Math.random()*8;var r=Math.random();var home=grid[p.y*N+p.x]===p.id;if(p.trail.length>10+lv*4||(p.trail.length&&r<.3)){/* pulang: cari sel milik terdekat */var best=null,bd=1e9;for(var i=0;i<N*N;i+=3)if(grid[i]===p.id){var d=Math.abs(i%N-p.x)+Math.abs((i/N|0)-p.y);if(d<bd){bd=d;best=i}}if(best!==null){var tx=best%N,ty=best/N|0;if(Math.abs(tx-p.x)>Math.abs(ty-p.y)){p.dx=Math.sign(tx-p.x);p.dy=0}else{p.dx=0;p.dy=Math.sign(ty-p.y)}}}else if(r<.4){var d2=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(Math.random()*4)];if(!(d2[0]===-p.dx&&d2[1]===-p.dy)){p.dx=d2[0];p.dy=d2[1]}}
  var nx=p.x+p.dx,ny=p.y+p.dy;if(nx<1||ny<1||nx>=N-1||ny>=N-1){p.dx=Math.sign(N/2-p.x)||1;p.dy=0;if(Math.abs(N/2-p.y)>Math.abs(N/2-p.x)){p.dx=0;p.dy=Math.sign(N/2-p.y)}}}}
function update(){t++;if(!run)return;if(dir.x||dir.y){var ax=Math.abs(dir.x)>Math.abs(dir.y);var ndx=ax?Math.sign(dir.x):0,ndy=ax?0:Math.sign(dir.y);if(!(ndx===-me.dx&&ndy===-me.dy&&me.trail.length)){me.dx=ndx;me.dy=ndy}}
 if(t%6===0){ps.forEach(function(p){if(!p.hidup)return;if(p.bot)ai(p);step(p)});upd()}cam.x+=(me.x*CS-W/2-cam.x)*.2;cam.y+=(me.y*CS-H/2-cam.y)*.2;
 if(run&&me.skor>N*N*.5){run=false;selesai('👑 MENGUASAI ARENA','wilayah '+(me.skor/(N*N)*100).toFixed(1)+'%',Math.floor(me.skor))}}
function draw(){ctx.fillStyle='#e9ecf5';ctx.fillRect(0,0,W,H);var x0=Math.max(0,cam.x/CS|0),y0=Math.max(0,cam.y/CS|0);for(var y=y0;y<Math.min(N,y0+H/CS+2);y++)for(var x=x0;x<Math.min(N,x0+W/CS+2);x++){var v=grid[y*N+x];if(v){var p=ps[v-1];ctx.fillStyle=p&&p.hidup?p.c:'#ccc';ctx.fillRect(x*CS-cam.x,y*CS-cam.y,CS-1,CS-1)}}
 ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.strokeRect(-cam.x,-cam.y,N*CS,N*CS);
 ps.forEach(function(p){if(!p.hidup)return;ctx.globalAlpha=.55;ctx.fillStyle=p.c;p.trail.forEach(function(k){ctx.fillRect((k%N)*CS-cam.x+3,(k/N|0)*CS-cam.y+3,CS-7,CS-7)});ctx.globalAlpha=1;var x=p.x*CS-cam.x+CS/2,y=p.y*CS-cam.y+CS/2;ctx.fillStyle=p.c;rr(x-10,y-10,20,20,6);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.stroke();nametag(x,y-14,p)});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(W-96,H-96,86,86,8);ctx.fill();for(var yy=0;yy<N;yy+=2)for(var xx=0;xx<N;xx+=2){var g=grid[yy*N+xx];if(g&&ps[g-1]){ctx.fillStyle=ps[g-1].c;ctx.fillRect(W-96+xx/N*86,H-96+yy/N*86,3,3)}}papan(ps,me)}
function loop(){update();draw();requestAnimationFrame(loop)}
window.__mulai=function(l){reset(l);run=true;say('⬡ keluar, buat jalur, kembali → wilayah')};reset(1);loop();`
export function hexaHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'hexa', brand, judul: 'HEXA WARS', sub: 'REBUT WILAYAH · ' + D.arena, bg: '#2b2d5e', ratio: '123%', data: D,
    css: '.ctl{display:grid;grid-template-columns:1fr;margin-top:10px;justify-items:center}.joy{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,64px);gap:6px}.joy .k{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);font-size:24px;border-radius:14px}.joy .k.on{background:#fff;color:#000}.joy .c{border-radius:50%}.joy .x{visibility:hidden}',
    hud: '<div class="p"><small>WILAYAH</small><span id="sk">0%</span></div><div class="p"><small>RANK</small><span id="rk">#1</span></div><div class="p"><small>HIDUP</small><span id="hd">0</span></div>',
    kontrol: '<div class="ctl"><div class="joy"><div class="k x" id="j7"></div><div class="k" id="j0">↑</div><div class="k x" id="j1"></div><div class="k" id="j6">←</div><div class="k c"></div><div class="k" id="j2">→</div><div class="k x" id="j5"></div><div class="k" id="j4">↓</div><div class="k x" id="j3"></div></div></div>',
    hint: '4 arah · keluar dari wilayahmu meninggalkan jalur · kembali masuk = area tertutup jadi milikmu · jalur yang dilewati lawan (atau dirimu) = mati · kuasai 50% untuk menang',
    lock: { warna: { a: '#5b6cff', b: '#ff5f7a' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l9 5v10l-9 5-9-5V7z"/></svg>', deskripsi: 'Paper.io melawan member grup: perluas wilayah warnamu dengan membuat jalur lalu menutupnya. Potong jalur lawan untuk menyingkirkannya — tapi jalurmu juga bisa dipotong.', kontrol: [['✥', '4 arah'], ['⬡', 'tutup jalur = wilayah'], ['✂️', 'potong jalur lawan'], ['👑', '50% = menang']], level: ['4 lawan', '6 lawan', '8 lawan agresif'], rekorKey: 'hx_lk' },
    js: HELP_JS + JOY_JS + HEXA_JS })
}

/* ============ 4. BALAPAN GRUP ============ */
const RACE_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var me,cars=[],run=false,lv=1,t=0,cam={x:0,y:0},LAP=3,pts=[],track=[],TW=110;
for(var i=0;i<40;i++){var a=i/40*6.283;pts.push({x:900+Math.cos(a)*700+Math.cos(a*3)*120,y:800+Math.sin(a)*560+Math.sin(a*2)*100})}
function mk(nama,bot,i){var p=pts[0];return{nama:nama,bot:bot,x:p.x+(i%2?30:-30),y:p.y+i*22,a:Math.atan2(pts[1].y-p.y,pts[1].x-p.x),v:0,c:COLW[i%COLW.length],skor:0,cp:1,lap:0,sp:[3.6,4.1,4.6][lv]+Math.random()*.3,done:false,hidup:true}}
function reset(l){lv=l;cars=[];me=mk(__D.nama,false,0);cars.push(me);var n=[4,6,7][l];for(var i=0;i<n;i++)cars.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));gas=false;rem=false;steer=0;t=0;upd()}
var gas=false,rem=false,steer=0;
function upd(){document.getElementById('lp').textContent=Math.min(LAP,me.lap+1)+'/'+LAP;document.getElementById('ps').textContent='#'+posisi(me);document.getElementById('sp').textContent=Math.round(me.v*40)}
function prog(c){return c.lap*1000+c.cp*10-Math.hypot(pts[c.cp%pts.length].x-c.x,pts[c.cp%pts.length].y-c.y)/200}
function posisi(c){return cars.slice().sort(function(a,b){return prog(b)-prog(a)}).indexOf(c)+1}
function distTrack(x,y){var bd=1e9;for(var i=0;i<pts.length;i++){var a=pts[i],b=pts[(i+1)%pts.length];var dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;var tt=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/l2));var d=Math.hypot(x-(a.x+dx*tt),y-(a.y+dy*tt));if(d<bd)bd=d}return bd}
function fisika(c,g,r,s){var mx=c.sp;if(g)c.v+=.08;if(r)c.v-=.12;c.v*=.985;var off=distTrack(c.x,c.y)>TW/2;if(off)c.v*=.94;c.v=Math.max(-1,Math.min(mx,c.v));c.a+=s*.045*Math.min(1,Math.abs(c.v)/1.5);c.x+=Math.cos(c.a)*c.v;c.y+=Math.sin(c.a)*c.v;var p=pts[c.cp%pts.length];if(Math.hypot(p.x-c.x,p.y-c.y)<90){c.cp++;if(c.cp%pts.length===0){c.lap++;if(c===me){say('🏁 lap '+(c.lap+1));bip(880,.1,'sine')}if(c.lap>=LAP&&!c.done){c.done=true;c.skor=100-posisi(c)*10;if(c===me){run=false;selesai(posisi(me)===1?'🏆 JUARA 1!':'🏁 FINISH #'+posisi(me),'posisi '+posisi(me)+' dari '+cars.length+' · '+LAP+' lap',Math.max(0,(cars.length-posisi(me)+1)*10))}}}}}
function ai(c){var p=pts[c.cp%pts.length];var want=Math.atan2(p.y-c.y,p.x-c.x);var d=((want-c.a+Math.PI*3)%(Math.PI*2))-Math.PI;fisika(c,Math.abs(d)<.9,Math.abs(d)>1.4,Math.max(-1,Math.min(1,d*2)))}
function update(){t++;if(!run)return;fisika(me,gas,rem,steer);cars.forEach(function(c){if(c.bot)ai(c)});
 cars.forEach(function(a){cars.forEach(function(b){if(a===b)return;var dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<26&&d>0){a.x-=dx/d*(26-d)/2;a.y-=dy/d*(26-d)/2;a.v*=.97}})});
 cars.forEach(function(c){c.skor=Math.floor(prog(c)/10)});cam.x+=(me.x-W/2-cam.x)*.12;cam.y+=(me.y-H/2-cam.y)*.12;if(t%10===0)upd()}
function draw(){ctx.fillStyle='#3f7d3a';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam.x,-cam.y);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#4b4b4b';ctx.lineWidth=TW;ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)});ctx.closePath();ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.setLineDash([18,18]);ctx.stroke();ctx.setLineDash([]);
 /* garis start */ctx.save();ctx.translate(pts[0].x,pts[0].y);ctx.rotate(Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x));for(var i=-5;i<5;i++)for(var j=0;j<2;j++){ctx.fillStyle=(i+j)%2?'#fff':'#000';ctx.fillRect(j*10-10,i*11,10,11)}ctx.restore();
 /* checkpoint berikut */var np=pts[me.cp%pts.length];ctx.strokeStyle='rgba(255,216,74,.7)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(np.x,np.y,30,0,7);ctx.stroke();
 cars.forEach(function(c){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle='rgba(0,0,0,.3)';rr(-14,-8,28,16,4);ctx.fill();ctx.fillStyle=c.c;rr(-13,-9,26,16,5);ctx.fill();ctx.fillStyle='#222';ctx.fillRect(-9,-11,6,4);ctx.fillRect(3,-11,6,4);ctx.fillRect(-9,7,6,4);ctx.fillRect(3,7,6,4);ctx.fillStyle='#9ee';ctx.fillRect(1,-5,6,10);ctx.restore();nametag(c.x,c.y-16,c)});
 ctx.restore();
 /* minimap */ctx.fillStyle='rgba(0,0,0,.5)';rr(W-110,H-100,100,90,8);ctx.fill();ctx.strokeStyle='#888';ctx.lineWidth=3;ctx.beginPath();pts.forEach(function(p,i){var x=W-110+p.x/1800*100,y=H-100+p.y/1500*90;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();cars.forEach(function(c){ctx.fillStyle=c===me?'#fff':c.c;ctx.fillRect(W-110+c.x/1800*100-2,H-100+c.y/1500*90-2,4,4)});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(10,10,110,26,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='left';ctx.fillText('P'+posisi(me)+'  LAP '+Math.min(LAP,me.lap+1)+'/'+LAP,18,28);ctx.textAlign='center'}
function loop(){update();draw();requestAnimationFrame(loop)}
hold('gas',function(){gas=true},function(){gas=false});hold('rem',function(){rem=true},function(){rem=false});hold('ki',function(){steer=-1},function(){if(steer<0)steer=0});hold('ka',function(){steer=1},function(){if(steer>0)steer=0});
document.addEventListener('keydown',function(e){if(e.key==='ArrowUp')gas=true;if(e.key==='ArrowDown')rem=true;if(e.key==='ArrowLeft')steer=-1;if(e.key==='ArrowRight')steer=1});document.addEventListener('keyup',function(e){if(e.key==='ArrowUp')gas=false;if(e.key==='ArrowDown')rem=false;if(e.key==='ArrowLeft'||e.key==='ArrowRight')steer=0});
window.__mulai=function(l){reset(l);run=true;say('🏁 3 lap — ikuti lingkaran kuning')};reset(1);loop();`
export function raceHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'balapan', brand, judul: 'BALAPAN GRUP', sub: 'SIRKUIT · ' + D.arena, bg: '#1d3b1a', ratio: '123%', data: D,
    css: '.ctl{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:10px}.ctl .k{height:96px;font-size:22px;flex-direction:column;box-shadow:0 6px 0 rgba(0,0,0,.4)}.ctl small{font-size:10px;letter-spacing:1px;margin-top:4px}.st{background:#3a4a6a}.rem{background:#c0392b}.gas{background:#27ae60;font-size:24px}',
    hud: '<div class="p"><small>LAP</small><span id="lp">1/3</span></div><div class="p"><small>POSISI</small><span id="ps">#1</span></div><div class="p"><small>KM/J</small><span id="sp">0</span></div>',
    kontrol: '<div class="ctl"><div class="k st" id="ki">◀<small>KIRI</small></div><div class="k st" id="ka">▶<small>KANAN</small></div><div class="k rem" id="rem">🛑<small>REM</small></div><div class="k gas" id="gas">⛽<small>GAS</small></div></div>',
    hint: 'tahan GAS · ◀ ▶ belok · REM di tikungan tajam · keluar aspal = melambat · 3 lap, ikuti lingkaran kuning',
    lock: { warna: { a: '#27ae60', b: '#f1c40f' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M5 11l1.5-4.5h11L19 11v6h-2v-2H7v2H5zm2.5-1h9l-1-3h-7z"/></svg>', deskripsi: 'Balapan top-down 3 lap di sirkuit berkelok melawan mobil member grup. Kontrol gaya arcade: gas, rem, belok.', kontrol: [['⛽', 'GAS (tahan)'], ['🛑', 'REM'], ['◀▶', 'belok'], ['🟡', 'checkpoint berikut']], level: ['4 lawan pelan', '6 lawan', '7 lawan ngebut'], rekorKey: 'rc_lk' },
    js: HELP_JS + RACE_JS })
}

/* ============ 5. TINJU ARENA (sumo) ============ */
const SUMO_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var R=250,me,ps=[],run=false,lv=1,t=0,cool=0,ronde=1,menangR=0;
function mk(nama,bot,i){var a=i/8*6.28;return{nama:nama,bot:bot,x:W/2+Math.cos(a)*120,y:H/2+Math.sin(a)*120,vx:0,vy:0,c:COLW[i%COLW.length],hidup:true,skor:0,aiT:0,cool:0,r:20}}
function reset(l){lv=l;ps=[];me=mk(__D.nama,false,0);me.x=W/2;me.y=H/2;ps.push(me);var n=[3,5,7][l];for(var i=0;i<n;i++)ps.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));R=250;ronde=1;menangR=0;dir={x:0,y:0};upd()}
function upd(){document.getElementById('hd').textContent=ps.filter(function(p){return p.hidup}).length;document.getElementById('rd').textContent=ronde;document.getElementById('wn').textContent=menangR}
function dorong(p){if(p.cool>0)return;p.cool=p.bot?50:30;var kena=false;ps.forEach(function(o){if(o!==p&&o.hidup){var dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy);if(d<60){o.vx+=dx/d*(p===me?12:8);o.vy+=dy/d*(p===me?12:8);kena=true;if(p===me)say('🥊 DORONG '+o.nama+'!')}}});if(p===me)bip(kena?180:120,.1,'square');p.pukul=10}
function ai(p){p.aiT--;var tgt=null,bd=1e9;ps.forEach(function(o){if(o!==p&&o.hidup){var d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;tgt=o}}});var dc=Math.hypot(p.x-W/2,p.y-H/2);var ax=0,ay=0;if(dc>R-50){ax=(W/2-p.x)/dc;ay=(H/2-p.y)/dc}else if(tgt){var l=Math.hypot(tgt.x-p.x,tgt.y-p.y);ax=(tgt.x-p.x)/l;ay=(tgt.y-p.y)/l;if(l<55&&Math.random()<.03+lv*.03)dorong(p)}p.vx+=ax*.16;p.vy+=ay*.16}
function update(){t++;if(!run)return;me.vx+=dir.x*.34;me.vy+=dir.y*.34;ps.forEach(function(p){if(!p.hidup)return;p.cool--;if(p.pukul)p.pukul--;if(p.bot&&t>120)ai(p);p.vx*=.9;p.vy*=.9;p.x+=p.vx;p.y+=p.vy;
 ps.forEach(function(o){if(o!==p&&o.hidup){var dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy);if(d<40&&d>0){var push=(40-d)/2;p.x-=dx/d*push;p.y-=dy/d*push;o.x+=dx/d*push;o.y+=dy/d*push}}});
 if(Math.hypot(p.x-W/2,p.y-H/2)>R+10){p.hidup=false;if(p===me){run=false;selesai('😵 JATUH DARI RING','ronde '+ronde+' · menang '+menangR+' ronde',menangR)}else{say('💨 '+p.nama+' keluar ring');me.skor++}}});
 if(t%2===0&&R>110)R-=.15;
 var hidup=ps.filter(function(p){return p.hidup});if(run&&hidup.length===1&&hidup[0]===me){menangR++;ronde++;say('🏆 ronde '+(ronde-1)+' menang!');bip(880,.2,'sine');ps.forEach(function(p,i){if(p.bot){var a=i/8*6.28;p.hidup=true;p.x=W/2+Math.cos(a)*120;p.y=H/2+Math.sin(a)*120;p.vx=p.vy=0}});R=250;if(ronde>3){run=false;selesai('👑 JUARA SUMO','3 ronde dimenangkan',menangR*3)}}
 if(t%10===0)upd()}
function draw(){ctx.fillStyle='#2c1b12';ctx.fillRect(0,0,W,H);ctx.fillStyle='#d8b98a';ctx.beginPath();ctx.arc(W/2,H/2,R+14,0,7);ctx.fill();ctx.fillStyle='#e8d0a8';ctx.beginPath();ctx.arc(W/2,H/2,R,0,7);ctx.fill();ctx.strokeStyle='#b23a48';ctx.lineWidth=6;ctx.beginPath();ctx.arc(W/2,H/2,R-4,0,7);ctx.stroke();ctx.strokeStyle='rgba(0,0,0,.15)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-40,H/2);ctx.lineTo(W/2+40,H/2);ctx.stroke();
 ps.forEach(function(p){if(!p.hidup)return;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(p.x,p.y+18,18,7,0,0,7);ctx.fill();ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.stroke();if(p.pukul){ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,p.r+8+(10-p.pukul)*3,0,7);ctx.stroke()}ctx.fillStyle='#222';ctx.beginPath();ctx.arc(p.x-6,p.y-4,3,0,7);ctx.arc(p.x+6,p.y-4,3,0,7);ctx.fill();nametag(p.x,p.y-28,p)});
 ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText('RONDE '+ronde+' / 3   ·   ring mengecil',W/2,30);papan(ps,me,' out')}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('push',function(){dorong(me)});document.addEventListener('keydown',function(e){if(e.key===' ')dorong(me)});
window.__mulai=function(l){reset(l);run=true;t=0;say('🥊 2 detik bersiap… dorong semua keluar ring!')};reset(1);loop();`
export function sumoHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'tinju', brand, judul: 'TINJU ARENA', sub: 'SUMO · ' + D.arena, bg: '#3b2418', ratio: '123%', data: D,
    css: JOY_CSS + '.act{background:radial-gradient(circle at 50% 30%,#ff8fa3,#e63946 60%,#8f1d2c)}',
    hud: '<div class="p"><small>HIDUP</small><span id="hd">0</span></div><div class="p"><small>RONDE</small><span id="rd">1</span></div><div class="p"><small>MENANG</small><span id="wn">0</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="push">🥊 DORONG<small>jarak dekat · cooldown</small></div></div>',
    hint: 'joystick gerak (ada momentum) · DORONG lawan dalam jarak dekat · ring mengecil · keluar ring = kalah · 3 ronde',
    lock: { warna: { a: '#e63946', b: '#f4a261' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M7 10V6a3 3 0 0 1 6 0v1h3a3 3 0 0 1 3 3v3a6 6 0 0 1-6 6H9a4 4 0 0 1-4-4v-3a2 2 0 0 1 2-2z"/></svg>', deskripsi: 'Sumo battle melawan member grup: dorong semua keluar ring yang terus mengecil. Menangkan 3 ronde.', kontrol: [['✥', 'gerak (momentum)'], ['🥊', 'DORONG'], ['⭕', 'ring mengecil'], ['🏆', '3 ronde']], level: ['3 lawan', '5 lawan', '7 lawan brutal'], rekorKey: 'sm_lk' },
    js: HELP_JS + JOY_JS + SUMO_JS })
}

/* ============ 6. ZOMBIE BARENG (co-op) ============ */
const ZOMBIE_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var MAP=1400,me,tim=[],zs=[],shots=[],run=false,lv=1,t=0,cam={x:0,y:0},wave=1,kills=0,aim={x:1,y:0};
function mk(nama,bot,i){return{nama:nama,bot:bot,x:MAP/2+(Math.random()-.5)*120,y:MAP/2+(Math.random()-.5)*120,hp:100,c:COLW[i%COLW.length],hidup:true,skor:0,cool:0,aim:{x:1,y:0}}}
function reset(l){lv=l;tim=[];zs=[];shots=[];me=mk(__D.nama,false,0);tim.push(me);var n=[4,3,2][l];for(var i=0;i<n;i++)tim.push(mk(__D.pemain[i%__D.pemain.length],true,i+1));wave=1;kills=0;spawnWave();dir={x:0,y:0};upd()}
function spawnWave(){var n=6+wave*3+lv*2;for(var i=0;i<n;i++){var a=Math.random()*6.28,r=500+Math.random()*300;zs.push({x:MAP/2+Math.cos(a)*r,y:MAP/2+Math.sin(a)*r,hp:20+wave*6,sp:.8+Math.random()*.5+wave*.06,big:Math.random()<.1+wave*.02})}zs.forEach(function(z){if(z.big){z.hp*=3;z.sp*=.7}});say('🧟 WAVE '+wave+' — '+n+' zombie')}
function upd(){document.getElementById('hp').textContent=Math.max(0,me.hp|0);document.getElementById('wv').textContent=wave;document.getElementById('kl').textContent=kills}
function fire(p){if(p.cool>0)return;p.cool=p.bot?14:9;shots.push({x:p.x,y:p.y,vx:p.aim.x*10,vy:p.aim.y*10,o:p,t:50});if(p===me)bip(200,.05,'square',.05)}
function ai(p){var z=null,bd=1e9;zs.forEach(function(o){var d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;z=o}});var dx=0,dy=0;if(z){var l=bd||1;p.aim={x:(z.x-p.x)/l,y:(z.y-p.y)/l};if(bd<110){dx=-p.aim.x;dy=-p.aim.y}else if(bd>260){dx=p.aim.x;dy=p.aim.y}if(bd<420)fire(p)}var dm=Math.hypot(me.x-p.x,me.y-p.y);if(dm>200){dx+=(me.x-p.x)/dm;dy+=(me.y-p.y)/dm}p.x+=dx*1.8;p.y+=dy*1.8}
function update(){t++;if(!run)return;if(dir.x||dir.y){me.x+=dir.x*2.6;me.y+=dir.y*2.6;me.aim={x:dir.x,y:dir.y}}me.x=Math.max(20,Math.min(MAP-20,me.x));me.y=Math.max(20,Math.min(MAP-20,me.y));
 tim.forEach(function(p){p.cool--;if(p.bot&&p.hidup)ai(p)});if(autoFire)fire(me);
 zs.forEach(function(z){var tg=null,bd=1e9;tim.forEach(function(p){if(p.hidup){var d=Math.hypot(p.x-z.x,p.y-z.y);if(d<bd){bd=d;tg=p}}});if(tg){z.x+=(tg.x-z.x)/bd*z.sp;z.y+=(tg.y-z.y)/bd*z.sp;if(bd<(z.big?30:20)){tg.hp-=z.big?.6:.3;if(tg===me&&t%30===0)bip(90,.1,'sawtooth')}}});
 for(var i=shots.length-1;i>=0;i--){var s=shots[i];s.x+=s.vx;s.y+=s.vy;s.t--;var hit=s.t<=0;for(var j=zs.length-1;j>=0&&!hit;j--){var z=zs[j];if(Math.hypot(z.x-s.x,z.y-s.y)<(z.big?26:16)){hit=true;z.hp-=10;if(z.hp<=0){zs.splice(j,1);s.o.skor++;if(s.o===me)kills++}}}if(hit)shots.splice(i,1)}
 tim.forEach(function(p){if(p.hidup&&p.hp<=0){p.hidup=false;if(p===me){run=false;selesai('💀 TERGIGIT','wave '+wave+' · kill '+kills+' · tim: '+tim.filter(function(x){return x.bot&&x.hidup}).map(function(x){return x.nama}).join(', '),kills)}else say('☠️ '+p.nama+' tumbang')}});
 if(!zs.length){wave++;tim.forEach(function(p){if(p.hidup)p.hp=Math.min(100,p.hp+30);else{p.hidup=true;p.hp=60;p.x=me.x;p.y=me.y;say('💚 '+p.nama+' bangkit')}});spawnWave()}
 cam.x+=(me.x-W/2-cam.x)*.15;cam.y+=(me.y-H/2-cam.y)*.15;if(t%15===0)upd()}
function draw(){ctx.fillStyle='#1a1f1a';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(100,140,100,.15)';var gs=48,ox=-cam.x%gs,oy=-cam.y%gs;ctx.beginPath();for(var x=ox;x<W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(var y=oy;y<H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();ctx.strokeStyle='#7cff6b';ctx.lineWidth=4;ctx.strokeRect(-cam.x,-cam.y,MAP,MAP);
 zs.forEach(function(z){var x=z.x-cam.x,y=z.y-cam.y;if(x<-40||x>W+40||y<-40||y>H+40)return;var r=z.big?22:13;ctx.fillStyle=z.big?'#5a8f3a':'#6fbf4a';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle='#c00';ctx.beginPath();ctx.arc(x-r*.35,y-r*.2,r*.2,0,7);ctx.arc(x+r*.35,y-r*.2,r*.2,0,7);ctx.fill()});
 tim.forEach(function(p){if(!p.hidup)return;var x=p.x-cam.x,y=p.y-cam.y;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(x,y,14,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+p.aim.x*22,y+p.aim.y*22);ctx.stroke();ctx.fillStyle='#000';ctx.fillRect(x-16,y-26,32,4);ctx.fillStyle=p.hp>40?'#7cff6b':'#ff5f7a';ctx.fillRect(x-16,y-26,32*Math.max(0,p.hp)/100,4);nametag(x,y-30,p)});
 ctx.fillStyle='#ffe066';shots.forEach(function(s){ctx.fillRect(s.x-cam.x-2,s.y-cam.y-2,4,4)});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(10,10,130,24,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='left';ctx.fillText('WAVE '+wave+' · sisa '+zs.length,18,26);ctx.textAlign='center';papan(tim,me,' kill')}
function loop(){update();draw();requestAnimationFrame(loop)}
var autoFire=false;hold('fire',function(){autoFire=true},function(){autoFire=false});document.addEventListener('keydown',function(e){if(e.key===' ')autoFire=true});document.addEventListener('keyup',function(e){if(e.key===' ')autoFire=false});
window.__mulai=function(l){reset(l);run=true};reset(1);loop();`
export function zombieHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'zombie', brand, judul: 'ZOMBIE BARENG', sub: 'CO-OP · TIM ' + D.arena, bg: '#0f1a0f', ratio: '123%', data: D,
    css: JOY_CSS + '.act{background:radial-gradient(circle at 50% 30%,#b6ff9e,#4caf50 60%,#1b5e20)}',
    hud: '<div class="p"><small>HP</small><span id="hp">100</span></div><div class="p"><small>WAVE</small><span id="wv">1</span></div><div class="p"><small>KILL</small><span id="kl">0</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="fire">🔫 TEMBAK<small>tahan · arah = joystick</small></div></div>',
    hint: 'kerja sama dengan tim (member grup) melawan gelombang zombie · joystick = gerak & arah tembak · TEMBAK (tahan) · rekan yang tumbang bangkit di wave berikut',
    lock: { warna: { a: '#4caf50', b: '#ff5f7a' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8" r="5"/><path d="M4 21a8 8 0 0 1 16 0z"/></svg>', deskripsi: 'Satu-satunya mode KERJA SAMA: kamu dan rekan bernama member grup bertahan dari gelombang zombie yang makin banyak dan makin cepat. Berapa wave yang bisa kalian lewati?', kontrol: [['✥', 'gerak + arah'], ['🔫', 'TEMBAK (tahan)'], ['🧟', 'zombie besar = 3× HP'], ['💚', '+30 HP tiap wave']], level: ['Tim 5 orang', 'Tim 4 orang', 'Tim 3 orang'], rekorKey: 'zb_lk' },
    js: HELP_JS + JOY_JS + ZOMBIE_JS })
}

/* ============ 7. DOGFIGHT ============ */
const DOG_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var MAP=1600,me,pl=[],shots=[],clouds=[],run=false,lv=1,t=0,cam={x:0,y:0},kills=0,turn=0,boost=false;
for(var i=0;i<30;i++)clouds.push({x:Math.random()*MAP,y:Math.random()*MAP,r:30+Math.random()*50});
function mk(nama,bot,i){return{nama:nama,bot:bot,x:Math.random()*MAP,y:Math.random()*MAP,a:Math.random()*6.28,hp:100,c:COLW[i%COLW.length],hidup:true,skor:0,cool:0,bst:100}}
function reset(l){lv=l;pl=[];shots=[];me=mk(__D.nama,false,0);me.x=MAP/2;me.y=MAP/2;pl.push(me);var n=[4,6,8][l];for(var i=0;i<n;i++)pl.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));kills=0;turn=0;upd()}
function upd(){document.getElementById('hp').textContent=Math.max(0,me.hp|0);document.getElementById('kl').textContent=kills;document.getElementById('bs').textContent=(me.bst|0)+'%'}
function fire(p){if(p.cool>0)return;p.cool=p.bot?16:8;shots.push({x:p.x,y:p.y,vx:Math.cos(p.a)*12,vy:Math.sin(p.a)*12,o:p,t:45});if(p===me)bip(700,.04,'square',.04)}
function ai(p){var tg=null,bd=1e9;pl.forEach(function(o){if(o!==p&&o.hidup){var d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;tg=o}}});if(tg){var want=Math.atan2(tg.y-p.y,tg.x-p.x);var d=((want-p.a+Math.PI*3)%(Math.PI*2))-Math.PI;p.a+=Math.max(-.045,Math.min(.045,d*(1+lv*.3)));if(Math.abs(d)<.25&&bd<380&&Math.random()<.3+lv*.15)fire(p)}p.x+=Math.cos(p.a)*3.4;p.y+=Math.sin(p.a)*3.4;if(p.x<0)p.x+=MAP;if(p.x>MAP)p.x-=MAP;if(p.y<0)p.y+=MAP;if(p.y>MAP)p.y-=MAP}
function update(){t++;if(!run)return;me.a+=turn*.055;var sp=3.6;if(boost&&me.bst>0){sp=6.5;me.bst-=1.2}else me.bst=Math.min(100,me.bst+.3);me.x+=Math.cos(me.a)*sp;me.y+=Math.sin(me.a)*sp;if(me.x<0)me.x+=MAP;if(me.x>MAP)me.x-=MAP;if(me.y<0)me.y+=MAP;if(me.y>MAP)me.y-=MAP;
 pl.forEach(function(p){p.cool--;if(p.bot&&p.hidup)ai(p)});if(firing)fire(me);
 for(var i=shots.length-1;i>=0;i--){var s=shots[i];s.x+=s.vx;s.y+=s.vy;s.t--;var hit=s.t<=0;pl.forEach(function(p){if(!hit&&p.hidup&&p!==s.o&&Math.hypot(p.x-s.x,p.y-s.y)<18){hit=true;p.hp-=12;if(p===me)bip(100,.08,'sawtooth');if(p.hp<=0){p.hidup=false;s.o.skor++;if(s.o===me){kills++;say('✈️ '+p.nama+' jatuh!')}if(p===me){run=false;selesai('💥 DITEMBAK JATUH oleh '+s.o.nama,'kill '+kills,kills)}else if(p.bot)setTimeout(function(){var k=pl.indexOf(p);pl[k]=mk(p.nama,true,k)},3000)}}});if(hit)shots.splice(i,1)}
 cam.x=me.x-W/2;cam.y=me.y-H/2;if(t%15===0)upd()}
function wrapDraw(x,y,fn){var sx=x-cam.x,sy=y-cam.y;[[0,0],[MAP,0],[-MAP,0],[0,MAP],[0,-MAP]].forEach(function(o){var px=sx+o[0],py=sy+o[1];if(px>-60&&px<W+60&&py>-60&&py<H+60)fn(px,py)})}
function draw(){var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#78c4ff');g.addColorStop(1,'#bfe4ff');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(255,255,255,.75)';clouds.forEach(function(c){wrapDraw(c.x,c.y,function(x,y){ctx.beginPath();ctx.arc(x,y,c.r,0,7);ctx.arc(x+c.r*.8,y+c.r*.2,c.r*.7,0,7);ctx.arc(x-c.r*.7,y+c.r*.25,c.r*.6,0,7);ctx.fill()})});
 pl.forEach(function(p){if(!p.hidup)return;wrapDraw(p.x,p.y,function(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-12,-14);ctx.lineTo(-6,0);ctx.lineTo(-12,14);ctx.closePath();ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(-14,-3,6,6);ctx.restore();ctx.fillStyle='#000';ctx.fillRect(x-16,y-28,32,4);ctx.fillStyle=p.hp>40?'#7cff6b':'#ff5f7a';ctx.fillRect(x-16,y-28,32*Math.max(0,p.hp)/100,4);nametag(x,y-32,p)})});
 ctx.fillStyle='#ff3';shots.forEach(function(s){wrapDraw(s.x,s.y,function(x,y){ctx.fillRect(x-2,y-2,5,5)})});
 /* radar */ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.arc(W-55,H-55,45,0,7);ctx.fill();pl.forEach(function(p){if(!p.hidup||p===me)return;var dx=p.x-me.x,dy=p.y-me.y;if(dx>MAP/2)dx-=MAP;if(dx<-MAP/2)dx+=MAP;if(dy>MAP/2)dy-=MAP;if(dy<-MAP/2)dy+=MAP;var d=Math.hypot(dx,dy);var k=Math.min(1,d/800)*40;ctx.fillStyle=p.c;ctx.fillRect(W-55+dx/d*k-2,H-55+dy/d*k-2,4,4)});ctx.fillStyle='#fff';ctx.fillRect(W-57,H-57,4,4);papan(pl,me,' kill')}
function loop(){update();draw();requestAnimationFrame(loop)}
var firing=false;hold('ki',function(){turn=-1},function(){if(turn<0)turn=0});hold('ka',function(){turn=1},function(){if(turn>0)turn=0});hold('fire',function(){firing=true},function(){firing=false});hold('bst',function(){boost=true},function(){boost=false});
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')turn=-1;if(e.key==='ArrowRight')turn=1;if(e.key===' ')firing=true;if(e.key==='ArrowUp')boost=true});document.addEventListener('keyup',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight')turn=0;if(e.key===' ')firing=false;if(e.key==='ArrowUp')boost=false});
window.__mulai=function(l){reset(l);run=true;say('✈️ pesawat terus maju — belok & tembak')};reset(1);loop();`
export function dogfightHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'pesawat', brand, judul: 'DOGFIGHT', sub: 'PERANG UDARA · ' + D.arena, bg: '#1c3b5a', ratio: '123%', data: D,
    css: '.ctl{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:10px}.ctl .k{height:96px;font-size:22px;flex-direction:column;box-shadow:0 6px 0 rgba(0,0,0,.4)}.ctl small{font-size:10px;letter-spacing:1px;margin-top:4px}.st{background:#2f5d8a}.bst{background:#f39c12}.fire{background:#e74c3c}',
    hud: '<div class="p"><small>HP</small><span id="hp">100</span></div><div class="p"><small>KILL</small><span id="kl">0</span></div><div class="p"><small>BOOST</small><span id="bs">100%</span></div>',
    kontrol: '<div class="ctl"><div class="k st" id="ki">↺<small>KIRI</small></div><div class="k st" id="ka">↻<small>KANAN</small></div><div class="k bst" id="bst">🚀<small>BOOST</small></div><div class="k fire" id="fire">🔥<small>TEMBAK</small></div></div>',
    hint: 'pesawat selalu maju · KIRI/KANAN berputar · TEMBAK (tahan) · BOOST terbatas (isi ulang) · radar kanan bawah menunjukkan lawan · peta menyambung di tepi',
    lock: { warna: { a: '#2f80ed', b: '#e74c3c' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>', deskripsi: 'Pertempuran udara melawan pilot bernama member grup. Pesawat terus melaju — kuasai putaran, gunakan boost untuk kabur, tembak dari belakang.', kontrol: [['↺↻', 'belok kiri/kanan'], ['🔥', 'TEMBAK (tahan)'], ['🚀', 'BOOST terbatas'], ['📡', 'radar lawan']], level: ['4 pilot', '6 pilot', '8 pilot jago'], rekorKey: 'df_lk' },
    js: HELP_JS + DOG_JS })
}

/* ============ 8. BOMBER GRUP ============ */
const BOMBER_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var C=13,R=15,CS=40,grid=[],me,ps=[],bombs=[],fires=[],run=false,lv=1,t=0,offx=(W-C*CS)/2,offy=(H-R*CS)/2;
function mk(nama,bot,i){var pos=[[1,1],[C-2,1],[1,R-2],[C-2,R-2],[6,1],[6,R-2],[1,7],[C-2,7]][i%8];return{nama:nama,bot:bot,x:pos[0],y:pos[1],c:COLW[i%COLW.length],hidup:true,skor:0,maxB:1,pow:2,aiT:0,mv:0,dx:0,dy:0}}
function reset(l){lv=l;grid=[];for(var y=0;y<R;y++){grid[y]=[];for(var x=0;x<C;x++){grid[y][x]=(x===0||y===0||x===C-1||y===R-1||(x%2===0&&y%2===0))?2:(Math.random()<.6?1:0)}}
 ps=[];me=mk(__D.nama,false,0);ps.push(me);var n=[3,5,7][l];for(var i=0;i<n;i++)ps.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));
 ps.forEach(function(p){for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++)if(Math.abs(a)+Math.abs(b)<=1&&grid[p.y+b]&&grid[p.y+b][p.x+a]===1)grid[p.y+b][p.x+a]=0});bombs=[];fires=[];dir={x:0,y:0};upd()}
function upd(){document.getElementById('hd').textContent=ps.filter(function(p){return p.hidup}).length;document.getElementById('kl').textContent=me.skor;document.getElementById('pw').textContent=me.pow}
function bebas(x,y){return grid[y]&&grid[y][x]===0&&!bombs.some(function(b){return b.x===x&&b.y===y})}
function taruh(p){if(!p.hidup||bombs.filter(function(b){return b.o===p}).length>=p.maxB)return;if(bombs.some(function(b){return b.x===p.x&&b.y===p.y}))return;bombs.push({x:p.x,y:p.y,t:120,o:p,pow:p.pow});if(p===me)bip(300,.05,'square')}
function ledak(b){bombs.splice(bombs.indexOf(b),1);var cells=[[b.x,b.y]];[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){for(var k=1;k<=b.pow;k++){var x=b.x+d[0]*k,y=b.y+d[1]*k;if(grid[y][x]===2)break;cells.push([x,y]);if(grid[y][x]===1){grid[y][x]=0;if(Math.random()<.25)grid[y][x]=3+Math.floor(Math.random()*2);break}bombs.forEach(function(o){if(o.x===x&&o.y===y)o.t=1})}});cells.forEach(function(c){fires.push({x:c[0],y:c[1],t:25,o:b.o})});bip(80,.2,'sawtooth',.08)}
function ai(p){p.aiT--;if(p.aiT>0)return;p.aiT=8+Math.random()*8;var bahaya=function(x,y){return fires.some(function(f){return f.x===x&&f.y===y})||bombs.some(function(b){return (b.x===x&&Math.abs(b.y-y)<=b.pow)||(b.y===y&&Math.abs(b.x-x)<=b.pow)})};
 var opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(function(d){return bebas(p.x+d[0],p.y+d[1])});var aman=opts.filter(function(d){return !bahaya(p.x+d[0],p.y+d[1])});
 if(bahaya(p.x,p.y)){var d=aman[0]||opts[0];if(d){p.x+=d[0];p.y+=d[1]}return}
 var dekat=ps.some(function(o){return o!==p&&o.hidup&&Math.abs(o.x-p.x)+Math.abs(o.y-p.y)<=2})||[[1,0],[-1,0],[0,1],[0,-1]].some(function(d){return grid[p.y+d[1]][p.x+d[0]]===1});
 if(dekat&&Math.random()<.3+lv*.2&&aman.length){taruh(p);return}
 if(aman.length){var d2=aman[Math.floor(Math.random()*aman.length)];if(Math.random()<.5){var tg=me;var best=aman.slice().sort(function(a,b){return (Math.abs(p.x+a[0]-tg.x)+Math.abs(p.y+a[1]-tg.y))-(Math.abs(p.x+b[0]-tg.x)+Math.abs(p.y+b[1]-tg.y))})[0];d2=best}p.x+=d2[0];p.y+=d2[1]}}
function update(){t++;if(!run)return;me.mv--;if((dir.x||dir.y)&&me.mv<=0){var ax=Math.abs(dir.x)>Math.abs(dir.y);var dx=ax?Math.sign(dir.x):0,dy=ax?0:Math.sign(dir.y);if(bebas(me.x+dx,me.y+dy)){me.x+=dx;me.y+=dy;me.mv=9}}
 ps.forEach(function(p){if(p.bot&&p.hidup)ai(p);var g=grid[p.y][p.x];if(g===3){grid[p.y][p.x]=0;p.pow++;if(p===me)say('🔥 ledakan +1')}if(g===4){grid[p.y][p.x]=0;p.maxB++;if(p===me)say('💣 bom +1')}});
 bombs.slice().forEach(function(b){b.t--;if(b.t<=0)ledak(b)});
 for(var i=fires.length-1;i>=0;i--){var f=fires[i];f.t--;ps.forEach(function(p){if(p.hidup&&p.x===f.x&&p.y===f.y){p.hidup=false;if(f.o!==p)f.o.skor++;if(p===me){run=false;selesai('💥 KENA LEDAKAN '+(f.o===me?'sendiri':f.o.nama),'kill '+me.skor+' · sisa lawan '+ps.filter(function(x){return x.hidup&&x.bot}).length,me.skor)}else say('☠️ '+p.nama+' meledak')}});if(f.t<=0)fires.splice(i,1)}
 if(run&&me.hidup&&!ps.some(function(p){return p.bot&&p.hidup})){run=false;selesai('🏆 BOMBER TERAKHIR','semua lawan meledak · kill '+me.skor,me.skor+5)}if(t%10===0)upd()}
function draw(){ctx.fillStyle='#1f6b3a';ctx.fillRect(0,0,W,H);for(var y=0;y<R;y++)for(var x=0;x<C;x++){var g=grid[y][x],px=offx+x*CS,py=offy+y*CS;ctx.fillStyle=(x+y)%2?'#3e9a56':'#46a860';ctx.fillRect(px,py,CS,CS);if(g===2){ctx.fillStyle='#6b7280';ctx.fillRect(px,py,CS,CS);ctx.fillStyle='#9ca3af';ctx.fillRect(px+3,py+3,CS-6,CS-6)}if(g===1){ctx.fillStyle='#b5651d';ctx.fillRect(px+2,py+2,CS-4,CS-4);ctx.fillStyle='#8a4a12';ctx.fillRect(px+2,py+CS/2-1,CS-4,2);ctx.fillRect(px+CS/2-1,py+2,2,CS/2-3)}if(g===3||g===4){ctx.fillStyle='#fff';rr(px+8,py+8,CS-16,CS-16,6);ctx.fill();ctx.font='18px serif';ctx.textAlign='center';ctx.fillText(g===3?'🔥':'💣',px+CS/2,py+CS/2+7)}}
 bombs.forEach(function(b){var px=offx+b.x*CS+CS/2,py=offy+b.y*CS+CS/2;var s=1+Math.sin(t*.3)*.08;ctx.fillStyle='#111';ctx.beginPath();ctx.arc(px,py,14*s,0,7);ctx.fill();ctx.strokeStyle='#f80';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+6,py-10);ctx.lineTo(px+12,py-18);ctx.stroke();if(t%6<3){ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(px+12,py-18,3,0,7);ctx.fill()}});
 fires.forEach(function(f){ctx.fillStyle='rgba(255,'+(120+f.t*4)+',40,'+(f.t/25)+')';rr(offx+f.x*CS+4,offy+f.y*CS+4,CS-8,CS-8,8);ctx.fill()});
 ps.forEach(function(p){if(!p.hidup)return;var px=offx+p.x*CS+CS/2,py=offy+p.y*CS+CS/2;ctx.fillStyle=p.c;rr(px-13,py-15,26,28,8);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px-5,py-5,4,0,7);ctx.arc(px+5,py-5,4,0,7);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(px-5,py-5,2,0,7);ctx.arc(px+5,py-5,2,0,7);ctx.fill();nametag(px,py-20,p)});papan(ps,me,' kill')}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('bom',function(){taruh(me)});document.addEventListener('keydown',function(e){if(e.key===' ')taruh(me)});
window.__mulai=function(l){reset(l);run=true;say('💣 taruh bom lalu MENJAUH — api menyilang 2 kotak!')};reset(1);loop();`
export function bomberHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'bomber', brand, judul: 'BOMBER GRUP', sub: 'ARENA BOM · ' + D.arena, bg: '#14472a', ratio: '123%', data: D,
    css: JOY_CSS + '.joy .k:nth-child(1),.joy .k:nth-child(3),.joy .k:nth-child(7),.joy .k:nth-child(9){visibility:hidden}.act{background:radial-gradient(circle at 50% 30%,#ffd166,#f77f00 60%,#9a3b00)}',
    hud: '<div class="p"><small>HIDUP</small><span id="hd">0</span></div><div class="p"><small>KILL</small><span id="kl">0</span></div><div class="p"><small>API</small><span id="pw">2</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="bom">💣 BOM<small>meledak 2 detik</small></div></div>',
    hint: '4 arah per kotak · BOM meledak setelah 2 detik menyilang · hancurkan kotak kayu → power-up 🔥 (jangkauan) 💣 (jumlah bom) · jangan kena api sendiri',
    lock: { warna: { a: '#f77f00', b: '#06d6a0' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="11" cy="14" r="7"/><path d="M14 7l3-3 2 2-3 3z"/><circle cx="20" cy="3" r="1.5"/></svg>', deskripsi: 'Bomberman melawan member grup di arena 13×15. Hancurkan kotak, kumpulkan power-up, dan jebak lawan dengan ledakan menyilang.', kontrol: [['✥', '4 arah'], ['💣', 'taruh BOM'], ['🔥', 'power-up jangkauan'], ['🏆', 'terakhir hidup menang']], level: ['3 lawan', '5 lawan', '7 lawan licik'], rekorKey: 'bm_lk' },
    js: HELP_JS + JOY_JS + BOMBER_JS })
}

/* ============ 9. LARI RINTANGAN ============ */
const RUN_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var LN=4,LW=W/LN,me,rs=[],obs=[],run=false,lv=1,t=0,FIN=6000,spd=5;
function mk(nama,bot,i){return{nama:nama,bot:bot,lane:i%LN,x:0,z:0,y:0,vy:0,c:COLW[i%COLW.length],hidup:true,skor:0,stun:0,done:false,aiT:0,slide:0}}
function reset(l){lv=l;rs=[];obs=[];me=mk(__D.nama,false,0);rs.push(me);var n=[5,7,9][l];for(var i=0;i<n;i++)rs.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));for(var z=300;z<FIN-200;z+=90+Math.random()*120){var tipe=Math.random();if(tipe<.4)obs.push({z:z,lane:Math.floor(Math.random()*LN),t:'lompat'});else if(tipe<.7)obs.push({z:z,lane:Math.floor(Math.random()*LN),t:'slide'});else if(tipe<.85){var ln=Math.floor(Math.random()*LN);for(var k=0;k<LN;k++)if(k!==ln)obs.push({z:z,lane:k,t:'tembok'})}else obs.push({z:z,lane:-1,t:'ayun',ph:Math.random()*6})}spd=[4.6,5.2,5.8][l];t=0;upd()}
function upd(){document.getElementById('ps').textContent='#'+posisi(me);document.getElementById('jr').textContent=Math.floor(me.z/10)+'m';document.getElementById('hd').textContent=rs.length}
function posisi(p){return rs.slice().sort(function(a,b){return b.z-a.z}).indexOf(p)+1}
function lompat(p){if(p.y===0&&!p.stun){p.vy=9;if(p===me)bip(600,.06,'sine')}}
function geser(p,d){var n=p.lane+d;if(n>=0&&n<LN)p.lane=n}
function slide(p){if(p.y===0){p.slide=22;if(p===me)bip(300,.06,'triangle')}}
function ai(p){var next=obs.filter(function(o){return o.z>p.z&&o.z<p.z+130&&(o.lane===p.lane||o.lane===-1)})[0];if(next&&Math.random()<.5+lv*.2){if(next.t==='lompat'&&next.z-p.z<70)lompat(p);else if(next.t==='slide'&&next.z-p.z<60)slide(p);else if(next.t==='tembok'&&next.z-p.z<110){var libre=[];for(var k=0;k<LN;k++)if(!obs.some(function(o){return o.z===next.z&&o.lane===k}))libre.push(k);if(libre.length)geser(p,Math.sign(libre[0]-p.lane))}else if(next.t==='ayun'&&next.z-p.z<40){var fase=Math.sin(t*.06+next.ph);if(Math.abs(fase*1.6-(p.lane-1.5))<.7)geser(p,p.lane>1?-1:1)}}}
function fisika(p){if(p.done)return;var v=p.stun?0:(p.slide?spd*.9:spd)*(p.bot?.95+Math.random()*.08:1);p.z+=v;if(p.stun)p.stun--;if(p.slide)p.slide--;p.vy-=.55;p.y+=p.vy;if(p.y<0){p.y=0;p.vy=0}
 obs.forEach(function(o){if(o.hit===p)return;if(Math.abs(o.z-p.z)<14){var kena=false;if(o.t==='lompat'&&o.lane===p.lane&&p.y<18)kena=true;if(o.t==='slide'&&o.lane===p.lane&&!p.slide&&p.y<40)kena=true;if(o.t==='tembok'&&o.lane===p.lane)kena=true;if(o.t==='ayun'){var bx=1.5+Math.sin(t*.06+o.ph)*1.6;if(Math.abs(bx-p.lane)<.6&&p.y<30)kena=true}if(kena){p.stun=40;p.z-=30;o.hit=p;if(p===me){say('💥 nabrak!');bip(90,.15,'sawtooth')}}}});
 if(p.z>=FIN&&!p.done){p.done=true;p.skor=100-posisi(p)*5;if(p===me){run=false;selesai(posisi(me)===1?'🏆 JUARA LARI!':'🏁 FINISH #'+posisi(me),'posisi '+posisi(me)+' dari '+rs.length,Math.max(0,(rs.length-posisi(me)+1)*10))}}}
function update(){t++;if(!run)return;rs.forEach(function(p){if(p.bot)ai(p);fisika(p);p.skor=Math.floor(p.z/10)});if(t%10===0)upd()}
function sy(z){var d=z-me.z;return H-120-d*1.1}
function draw(){ctx.fillStyle='#ff9ecf';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffd6ea';ctx.fillRect(0,0,W,120);for(var l=0;l<LN;l++){ctx.fillStyle=l%2?'#f7c8e0':'#fbd9ea';ctx.fillRect(l*LW,120,LW,H)}ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([12,12]);for(var q=1;q<LN;q++){ctx.beginPath();ctx.moveTo(q*LW,120);ctx.lineTo(q*LW,H);ctx.stroke()}ctx.setLineDash([]);
 /* garis finish */var fy=sy(FIN);if(fy>100&&fy<H){for(var i=0;i<LN*4;i++){ctx.fillStyle=i%2?'#000':'#fff';ctx.fillRect(i*LW/4,fy-8,LW/4,16)}}
 obs.forEach(function(o){var y=sy(o.z);if(y<100||y>H+40)return;if(o.t==='ayun'){var bx=(1.5+Math.sin(t*.06+o.ph)*1.6+.5)*LW;ctx.strokeStyle='#8d5524';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(W/2,y-100);ctx.lineTo(bx,y);ctx.stroke();ctx.fillStyle='#8d5524';ctx.beginPath();ctx.arc(bx,y,20,0,7);ctx.fill();return}var x=o.lane*LW;if(o.t==='lompat'){ctx.fillStyle='#e63946';rr(x+8,y-10,LW-16,20,6);ctx.fill()}if(o.t==='slide'){ctx.fillStyle='#457b9d';rr(x+4,y-46,LW-8,14,6);ctx.fill();ctx.fillRect(x+8,y-40,4,40);ctx.fillRect(x+LW-12,y-40,4,40)}if(o.t==='tembok'){ctx.fillStyle='#6d597a';rr(x+3,y-40,LW-6,44,6);ctx.fill();ctx.fillStyle='#b56576';ctx.fillRect(x+3,y-40,LW-6,8)}});
 rs.slice().sort(function(a,b){return a.z-b.z}).forEach(function(p){var y=sy(p.z),x=p.lane*LW+LW/2;if(y<80||y>H+40)return;var h=p.slide?18:34;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y+4,16,6,0,0,7);ctx.fill();var yy=y-p.y;ctx.fillStyle=p.c;rr(x-14,yy-h,28,h,12);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-5,yy-h+10,4,0,7);ctx.arc(x+5,yy-h+10,4,0,7);ctx.fill();if(p.stun){ctx.font='14px serif';ctx.fillText('💫',x,yy-h-6)}nametag(x,yy-h-8,p)});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(10,10,140,24,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='left';ctx.fillText('P'+posisi(me)+' · '+Math.floor(me.z/10)+'/'+(FIN/10)+'m',18,26);ctx.textAlign='center';papan(rs,me,'m')}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('ki',function(){geser(me,-1)});tap('ka',function(){geser(me,1)});tap('jp',function(){lompat(me)});tap('sl',function(){slide(me)});
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')geser(me,-1);if(e.key==='ArrowRight')geser(me,1);if(e.key==='ArrowUp'||e.key===' ')lompat(me);if(e.key==='ArrowDown')slide(me)});
window.__mulai=function(l){reset(l);run=true;say('🏃 lompat merah · slide biru · hindari tembok & bandul')};reset(1);loop();`
export function runHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'lari', brand, judul: 'LARI RINTANGAN', sub: 'FALL RACE · ' + D.arena, bg: '#7b2d6b', ratio: '123%', data: D,
    css: '.ctl{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:10px}.ctl .k{height:96px;font-size:24px;flex-direction:column;box-shadow:0 6px 0 rgba(0,0,0,.4)}.ctl small{font-size:10px;letter-spacing:1px;margin-top:4px}.st{background:#9d4edd}.jp{background:#ff6d00}.sl{background:#00b4d8}',
    hud: '<div class="p"><small>POSISI</small><span id="ps">#1</span></div><div class="p"><small>JARAK</small><span id="jr">0m</span></div><div class="p"><small>PELARI</small><span id="hd">0</span></div>',
    kontrol: '<div class="ctl"><div class="k st" id="ki">◀<small>LAJUR</small></div><div class="k st" id="ka">▶<small>LAJUR</small></div><div class="k jp">⤒<small id="x">LOMPAT</small></div><div class="k sl" id="sl">⤓<small>SLIDE</small></div></div>'.replace('class="k jp"', 'class="k jp" id="jp"'),
    hint: '4 lajur · palang merah = LOMPAT · palang biru = SLIDE · tembok ungu = pindah lajur · bandul berayun · nabrak = terhenti sejenak · 600 m menuju finish',
    lock: { warna: { a: '#9d4edd', b: '#ff6d00' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="14" cy="4" r="2"/><path d="M12 7l-4 3 1.5 3L7 20h2l2.5-6 2.5 2v4h2v-5l-2.5-3 1-3 2 2h3V9h-2l-2.5-2.5z"/></svg>', deskripsi: 'Lomba lari rintangan ala Fall Guys melawan member grup: lompat, slide, pindah lajur, hindari bandul. Siapa yang finish duluan?', kontrol: [['◀▶', 'pindah lajur'], ['⤒', 'LOMPAT palang merah'], ['⤓', 'SLIDE palang biru'], ['🏁', '600 m']], level: ['5 pelari', '7 pelari', '9 pelari cepat'], rekorKey: 'rn_lk' },
    js: HELP_JS + RUN_JS })
}

/* ============ 10. KEJAR-KEJARAN (tag) ============ */
const TAG_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var me,ps=[],walls=[],run=false,lv=1,t=0,waktu=0,dash=0,itT=0;
function mk(nama,bot,i){return{nama:nama,bot:bot,x:60+Math.random()*(W-120),y:60+Math.random()*(H-120),c:COLW[i%COLW.length],hidup:true,skor:0,it:false,itTime:0,imun:0,aiT:0,dash:0}}
function reset(l){lv=l;ps=[];walls=[];me=mk(__D.nama,false,0);ps.push(me);var n=[4,6,8][l];for(var i=0;i<n;i++)ps.push(mk(__D.pemain[i%__D.pemain.length]+(i>=__D.pemain.length?i:''),true,i+1));for(var w=0;w<7;w++)walls.push({x:60+Math.random()*(W-180),y:80+Math.random()*(H-200),w:30+Math.random()*90,h:20+Math.random()*60});var it=ps[1+Math.floor(Math.random()*(ps.length-1))];it.it=true;waktu=90*60;dir={x:0,y:0};dash=0;upd()}
function upd(){document.getElementById('tm').textContent=Math.ceil(waktu/60)+'s';var it=ps.filter(function(p){return p.it})[0];document.getElementById('it').textContent=it===me?'KAMU!':(it?it.nama:'-');document.getElementById('sc').textContent=Math.floor(me.itTime/60)+'s'}
function blok(x,y){if(x<14||y<14||x>W-14||y>H-14)return true;return walls.some(function(w){return x>w.x-12&&x<w.x+w.w+12&&y>w.y-12&&y<w.y+w.h+12})}
function move(p,dx,dy,sp){var nx=p.x+dx*sp,ny=p.y+dy*sp;if(!blok(nx,p.y))p.x=nx;if(!blok(p.x,ny))p.y=ny}
function doDash(p){if(p.dash>0)return;p.dash=90;p.dashT=10;if(p===me){bip(500,.08,'sine');say('💨 DASH')}}
function ai(p){var it=ps.filter(function(o){return o.it})[0];var dx=0,dy=0;if(p.it){var tg=null,bd=1e9;ps.forEach(function(o){if(o!==p&&!o.imun){var d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;tg=o}}});if(tg){dx=(tg.x-p.x)/bd;dy=(tg.y-p.y)/bd;if(bd<120&&Math.random()<.02*lv)doDash(p)}}else if(it){var d=Math.hypot(it.x-p.x,it.y-p.y);if(d<220){dx=-(it.x-p.x)/d;dy=-(it.y-p.y)/d;if(d<90&&Math.random()<.02*lv)doDash(p)}else{p.aiT--;if(p.aiT<=0){p.aiT=30+Math.random()*40;p.wa=Math.random()*6.28}dx=Math.cos(p.wa||0)*.5;dy=Math.sin(p.wa||0)*.5}}
 /* hindari tembok: coba arah alternatif */if(blok(p.x+dx*10,p.y+dy*10)){var tmp=dx;dx=-dy;dy=tmp}move(p,dx,dy,(p.dashT>0?5.5:2.3+lv*.15))}
function update(){t++;if(!run)return;waktu--;ps.forEach(function(p){if(p.dash>0)p.dash--;if(p.dashT>0)p.dashT--;if(p.imun>0)p.imun--;if(p.it)p.itTime++;if(p.bot)ai(p)});
 if(dir.x||dir.y)move(me,dir.x,dir.y,me.dashT>0?6:2.8);
 var it=ps.filter(function(p){return p.it})[0];if(it){ps.forEach(function(o){if(o!==it&&!o.imun&&Math.hypot(o.x-it.x,o.y-it.y)<26){it.it=false;it.imun=90;o.it=true;say(o===me?'😱 KAMU jadi IT!':(it===me?'✅ kena! '+o.nama+' jadi IT':o.nama+' jadi IT'));bip(o===me?150:800,.12,'square')}})}
 ps.forEach(function(p){p.skor=Math.floor((waktu>0?0:0)+(90*60-p.itTime)/60)});
 if(waktu<=0){run=false;var s=Math.max(0,90-Math.floor(me.itTime/60));selesai(me.it?'😵 KAMU IT SAAT WAKTU HABIS':'🏆 SELAMAT!','jadi IT selama '+Math.floor(me.itTime/60)+' dtk dari 90 · skor '+s,s)}
 if(t%10===0)upd()}
function draw(){ctx.fillStyle='#22303c';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(255,255,255,.05)';for(var x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(var y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.strokeStyle='#ffd84a';ctx.lineWidth=4;ctx.strokeRect(6,6,W-12,H-12);
 walls.forEach(function(w){ctx.fillStyle='#4a5a6a';rr(w.x,w.y,w.w,w.h,6);ctx.fill();ctx.fillStyle='#5f7182';rr(w.x+3,w.y+3,w.w-6,w.h-6,4);ctx.fill()});
 ps.forEach(function(p){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y+14,13,5,0,0,7);ctx.fill();if(p.it){ctx.strokeStyle='#ff3b3b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,20+Math.sin(t*.3)*3,0,7);ctx.stroke()}if(p.imun){ctx.globalAlpha=.5}ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,13,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x-4,p.y-3,3,0,7);ctx.arc(p.x+4,p.y-3,3,0,7);ctx.fill();ctx.globalAlpha=1;if(p.dashT){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,18,0,7);ctx.stroke()}nametag(p.x,p.y-20,p);if(p.it){ctx.fillStyle='#ff3b3b';ctx.font='bold 11px sans-serif';ctx.fillText('IT!',p.x,p.y+28)}});
 ctx.fillStyle='rgba(0,0,0,.5)';rr(W/2-70,10,140,26,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('⏱ '+Math.ceil(waktu/60)+'s  ·  DASH '+(me.dash>0?Math.ceil(me.dash/60)+'s':'✓'),W/2,28)}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('dash',function(){doDash(me)});document.addEventListener('keydown',function(e){if(e.key===' ')doDash(me)});
window.__mulai=function(l){reset(l);run=true;say('👻 hindari yang IT (lingkaran merah) selama 90 dtk')};reset(1);loop();`
export function tagHtml (brand = 'THERYHANN!', d = {}) {
  const D = norm(d)
  return shell({ id: 'tagteam', brand, judul: 'KEJAR-KEJARAN', sub: 'TAG · ' + D.arena, bg: '#1a2530', ratio: '123%', data: D,
    css: JOY_CSS + '.act{background:radial-gradient(circle at 50% 30%,#fff3a3,#ffd84a 60%,#b8930f);color:#222}',
    hud: '<div class="p"><small>WAKTU</small><span id="tm">90s</span></div><div class="p"><small>IT</small><span id="it">-</span></div><div class="p"><small>JADI IT</small><span id="sc">0s</span></div>',
    kontrol: '<div class="ctl">' + JOY + '<div class="k act" id="dash">💨 DASH<small>cooldown 1.5 dtk</small></div></div>',
    hint: 'yang IT (lingkaran merah) mengejar; sentuh orang lain = dia jadi IT (kebal 1,5 dtk) · DASH untuk kabur/menangkap · tembok jadi penghalang · jangan jadi IT saat waktu habis',
    lock: { warna: { a: '#ffd84a', b: '#ff3b3b' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 0 0-7 7v13l3-2 2 2 2-2 2 2 2-2 3 2V9a7 7 0 0 0-7-7zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>', deskripsi: 'Kejar-kejaran klasik dengan member grup: satu orang jadi IT dan harus menyentuh yang lain. Skor = makin sedikit waktu kamu jadi IT.', kontrol: [['✥', 'gerak / geser jari'], ['💨', 'DASH'], ['🔴', 'lingkaran merah = IT'], ['⏱', '90 detik']], level: ['4 pemain', '6 pemain', '8 pemain gesit'], rekorKey: 'tg_lk' },
    js: HELP_JS + JOY_JS + TAG_JS })
}

export const ARCADE_8 = [
  { id: 'agario', cmd: 'agario', icon: '🟢', nama: 'Agar Arena (multiplayer)', title: 'Agar Arena', ket: 'sel makan sel ala agar.io, joystick + PECAH, lawan = member grup', ratio: '520×640', html: b => agarHtml(b, {}) },
  { id: 'tankroyale', cmd: 'tankroyale', icon: '🛡️', nama: 'Tank Royale (multiplayer)', title: 'Tank Royale', ket: 'battle royale tank, zona mengecil, joystick + TEMBAK', ratio: '520×640', html: b => tankHtml(b, {}) },
  { id: 'hexa', cmd: 'hexa', icon: '⬡', nama: 'Hexa Wars (multiplayer)', title: 'Hexa Wars', ket: 'paper.io rebut wilayah 4 arah, potong jalur lawan', ratio: '520×640', html: b => hexaHtml(b, {}) },
  { id: 'balapan', cmd: 'balapgrup', icon: '🏎️', nama: 'Balapan Grup (multiplayer)', title: 'Balapan Grup', ket: 'balap top-down 3 lap: GAS · REM · ◀ ▶', ratio: '520×640', html: b => raceHtml(b, {}) },
  { id: 'tinju', cmd: 'tinju', icon: '🥊', nama: 'Tinju Arena / Sumo (multiplayer)', title: 'Tinju Arena', ket: 'dorong lawan keluar ring yang mengecil, joystick + DORONG, 3 ronde', ratio: '520×640', html: b => sumoHtml(b, {}) },
  { id: 'zombie', cmd: 'zombie', icon: '🧟', nama: 'Zombie Bareng (co-op)', title: 'Zombie Bareng', ket: 'kerja sama tim grup lawan gelombang zombie, joystick + TEMBAK', ratio: '520×640', html: b => zombieHtml(b, {}) },
  { id: 'pesawat', cmd: 'dogfight', icon: '✈️', nama: 'Dogfight (multiplayer)', title: 'Dogfight', ket: 'perang udara: KIRI/KANAN putar, TEMBAK, BOOST, radar', ratio: '520×640', html: b => dogfightHtml(b, {}) },
  { id: 'bomber', cmd: 'bomber', icon: '💣', nama: 'Bomber Grup (multiplayer)', title: 'Bomber Grup', ket: 'bomberman 13×15, 4 arah + BOM, power-up api/bom', ratio: '520×640', html: b => bomberHtml(b, {}) },
  { id: 'lari', cmd: 'laririntangan', icon: '🏃', nama: 'Lari Rintangan (multiplayer)', title: 'Lari Rintangan', ket: 'fall race 4 lajur: LAJUR ◀▶ · LOMPAT · SLIDE, 600 m', ratio: '520×640', html: b => runHtml(b, {}) },
  { id: 'tagteam', cmd: 'kejar', icon: '👻', nama: 'Kejar-kejaran / Tag (multiplayer)', title: 'Kejar-kejaran', ket: 'tag 90 dtk: hindari yang IT, joystick + DASH', ratio: '520×640', html: b => tagHtml(b, {}) },
  /* v7.14.0 — game horor cerita penuh */
  { id: 'rumahtua', cmd: 'rumahtua', icon: '👁️', nama: 'Rumah Tua (horor cerita)', title: 'Rumah Tua di Ujung Desa', ket: 'horor top-down senter: 5 bab, 12 ruangan, catatan, sosok Ibu pemburu, jumpscare, 3 akhir', ratio: '520×572', html: b => horrorHtml(b) }
]
export const HTML_BY_ID = { rumahtua: horrorHtml, agario: agarHtml, tankroyale: tankHtml, hexa: hexaHtml, balapan: raceHtml, tinju: sumoHtml, zombie: zombieHtml, pesawat: dogfightHtml, bomber: bomberHtml, lari: runHtml, tagteam: tagHtml }
export default { ARCADE_8, HTML_BY_ID }
