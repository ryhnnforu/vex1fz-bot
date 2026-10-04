/**
 * lib/htmlgames13.js — 5 GAME BARU v7.12.0 (sistem & UI berbeda + lock screen)
 * -------------------------------------------------------------------------
 *  1. beatdrop   🎵 Beat Drop      — rhythm 4 lajur, pad D F J K, neon ungu/pink
 *  2. menara     🏗️ Menara Langit — tumpuk balok dari crane, satu tombol JATUHKAN, langit pastel
 *  3. gelembung  🫧 Bubble Pop     — bubble shooter, slider bidik + TEMBAK + TUKAR, permen pastel
 *  4. cacing     🐛 Cacing.io      — worm io, joystick 8 arah + BOOST, lawan = member grup, grid gelap
 *  5. sushi      🍣 Sushi Master   — dapur sushi: pesanan datang, tombol bahan + SAJIKAN, kayu hangat
 *  Setiap game: lock screen (lib/lockscreen.js) → MULAI → game. Rekor tersimpan di HP.
 */
import { lockScreen } from './lockscreen.js'

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** kerangka umum: hud + stage + kontrol khusus + lock screen */
export function shell ({ id, brand, judul, sub, bg, css, hud, kontrol, hint, lock, js, data, ratio = '133%' }) {
  const L = lockScreen({ ...lock, id, brand, judul, sub, wrap: '.g' })
  const base = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:${bg};font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;overflow-x:hidden}
.g{max-width:600px;margin:0 auto;padding:8px 8px 14px}
.hud{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.hud .lg b{display:block;font-size:18px;font-weight:900;letter-spacing:1.5px;line-height:1;white-space:nowrap}
.hud .lg small{display:block;font-size:9px;letter-spacing:3px;opacity:.7;margin-top:3px}
.hud .r{display:flex;gap:6px}
.hud .p{border-radius:12px;min-width:52px;height:48px;padding:0 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:15px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.hud .p small{font-size:8px;letter-spacing:1.5px;opacity:.75;font-weight:800}
.stage{position:relative;border-radius:16px;overflow:hidden;border:3px solid rgba(255,255,255,.15);height:0;padding-bottom:var(--ratio,133%);background:#000}
canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none}
.toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;opacity:0;transition:opacity .2s;white-space:nowrap;pointer-events:none}
.toast.on{opacity:1}
.over{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.62);text-align:center;padding:20px}
.over.on{display:flex}
.over h2{font-size:26px;letter-spacing:2px;line-height:1.2}
.over p{font-size:13px;opacity:.9;margin:8px 0 16px;line-height:1.5}
.over .bts{display:flex;gap:10px;justify-content:center;width:100%}
.over .btn{flex:1;max-width:170px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;font-weight:900;letter-spacing:1px;background:#fff;color:#111;font-size:14px;white-space:nowrap}
.over .btn.sec{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.5)}
.hint{text-align:center;font-size:11px;opacity:.7;margin-top:10px;line-height:1.5}
.k{border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900}
.k:active,.k.dn{transform:translateY(3px);filter:brightness(1.15)}
${css}`
  return '<style>' + base + L.css + '</style>' + L.html +
    `<div class="g"><div class="hud"><div class="lg"><b>${esc(judul)}</b><small>${esc(sub)}</small></div><div class="r">${hud}</div></div>` +
    `<div class="stage" id="stage" style="--ratio:${ratio}"><canvas id="cv"></canvas><div class="toast" id="toast"></div><div class="over" id="over"><h2 id="ovT">SELESAI</h2><p id="ovP"></p><div class="bts"><div class="btn" id="ovR">▶ MAIN LAGI</div><div class="btn sec" id="ovM">☰ MENU</div></div></div></div>` +
    kontrol + `<div class="hint">${hint}<br><b>${esc(brand)}</b></div></div>` +
    '<script>' + L.js + 'var __D=' + JSON.stringify(data || {}).replace(/</g, '\\u003c') + ';' + COMMON + js + '</script>'
}

/* util bersama di dalam webview */
const COMMON = String.raw`
var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),toast=document.getElementById('toast'),over=document.getElementById('over');
function say(s){toast.textContent=s;toast.className='toast on';clearTimeout(say.t);say.t=setTimeout(function(){toast.className='toast'},1300)}
var AC=null,sfx=true;function bip(f,d,tp,v){if(!sfx)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.type=tp||'square';o.frequency.value=f;g.gain.value=v||.05;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
function tap(id,fn){var el=document.getElementById(id);if(!el)return;el.addEventListener('touchstart',function(e){e.preventDefault();fn(e)},{passive:false});el.addEventListener('mousedown',function(e){fn(e)});}
function hold(id,dn,up){var el=document.getElementById(id);if(!el)return;function d(e){e.preventDefault();el.classList.add('dn');dn()}function u(e){el.classList.remove('dn');up&&up()}el.addEventListener('touchstart',d,{passive:false});el.addEventListener('touchend',u);el.addEventListener('touchcancel',u);el.addEventListener('mousedown',d);el.addEventListener('mouseup',u);el.addEventListener('mouseleave',u)}
function selesai(judul,teks,skor){var best=window.__lock?window.__lock.rekor(skor):skor;document.getElementById('ovT').textContent=judul;document.getElementById('ovP').textContent=teks+' · rekor '+best+(skor>=best&&skor>0?' 🏆 BARU':'');over.classList.add('on')}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
tap('ovM',function(){over.classList.remove('on');window.__lock.open()});
tap('ovR',function(){over.classList.remove('on');window.__mulai(window.__lock.level())});
`

/* =========================== 1. BEAT DROP =========================== */
const BEAT_JS = String.raw`
var W=480,H=640;cv.width=W;cv.height=H;var LANE=4,LW=W/LANE,HIT=H-90;
var notes=[],t=0,run=false,skor=0,combo=0,maxc=0,hp=100,bpm=120,lv=1,nextBeat=0,spd=5,fx=[],beat=0,total=0,kena=0;
var COL=['#ff4fd8','#7a4dff','#3ee6ff','#ffd84a'];
function reset(l){lv=l;bpm=[100,125,150][l];spd=[4,5.5,7][l];notes=[];t=0;skor=0;combo=0;maxc=0;hp=100;nextBeat=0;fx=[];beat=0;total=0;kena=0;upd()}
function upd(){document.getElementById('sk').textContent=skor;document.getElementById('cb').textContent=combo+'x';document.getElementById('hp').textContent=hp+'%'}
function spawn(){var lane=Math.floor(Math.random()*LANE);var n={l:lane,y:-20,hit:false,long:Math.random()<.15?60:0};notes.push(n);total++;if(Math.random()<.25+lv*.1){var l2=(lane+1+Math.floor(Math.random()*3))%LANE;notes.push({l:l2,y:-20,hit:false,long:0});total++}}
function update(){t++;var frame=60/bpm*60;if(t>=nextBeat){spawn();beat++;nextBeat=t+frame*(Math.random()<.3?.5:1);bip(60,.08,'sine',.08)}
 for(var i=notes.length-1;i>=0;i--){var n=notes[i];n.y+=spd;if(!n.hit&&n.y>HIT+40){notes.splice(i,1);combo=0;hp-=6;fx.push({l:n.l,t:20,txt:'MISS',c:'#ff5f7a'});bip(120,.1,'sawtooth');upd();if(hp<=0)return akhir()}else if(n.hit&&n.y>H+80)notes.splice(i,1)}
 for(var j=fx.length-1;j>=0;j--){fx[j].t--;if(fx[j].t<=0)fx.splice(j,1)}
 if(beat>=[60,80,100][lv]&&notes.length===0)akhir(true)}
function pukul(l){if(!run)return;var best=null,bd=999;notes.forEach(function(n){if(n.l===l&&!n.hit){var d=Math.abs(n.y-HIT);if(d<bd){bd=d;best=n}}});
 var el=document.getElementById('p'+l);el.classList.add('dn');setTimeout(function(){el.classList.remove('dn')},90);
 if(best&&bd<44){best.hit=true;kena++;var nilai=bd<12?3:bd<26?2:1;var lbl=['','OK','GOOD','PERFECT'][nilai];combo++;maxc=Math.max(maxc,combo);skor+=nilai*10*(1+Math.floor(combo/10));hp=Math.min(100,hp+1);fx.push({l:l,t:22,txt:lbl,c:nilai===3?'#ffd84a':nilai===2?'#3ee6ff':'#fff'});bip([440,554,659,784][l]*(nilai===3?1.5:1),.12,'triangle',.07)}else{combo=0;fx.push({l:l,t:16,txt:'…',c:'#888'})}upd()}
function akhir(menang){run=false;var acc=total?Math.round(kena/total*100):0;selesai(menang?'🎉 LAGU SELESAI':'💔 KALAH','skor '+skor+' · akurasi '+acc+'% · combo maks '+maxc,skor)}
function draw(){var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#120b22');g.addColorStop(1,'#2a0f3a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(var i=0;i<LANE;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.03)':'rgba(255,255,255,.06)';ctx.fillRect(i*LW,0,LW,H);ctx.strokeStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.moveTo(i*LW,0);ctx.lineTo(i*LW,H);ctx.stroke()}
 /* garis pukul */ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,HIT-6,W,12);
 for(var k=0;k<LANE;k++){ctx.strokeStyle=COL[k];ctx.lineWidth=3;ctx.shadowColor=COL[k];ctx.shadowBlur=14;ctx.beginPath();ctx.arc(k*LW+LW/2,HIT,26,0,7);ctx.stroke();ctx.shadowBlur=0}
 notes.forEach(function(n){if(n.hit)return;ctx.fillStyle=COL[n.l];ctx.shadowColor=COL[n.l];ctx.shadowBlur=18;rr(n.l*LW+10,n.y-14,LW-20,28+n.long,12);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.55)';rr(n.l*LW+18,n.y-8,LW-36,8,4);ctx.fill()});
 fx.forEach(function(f){ctx.globalAlpha=f.t/22;ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle=f.c;ctx.fillText(f.txt,f.l*LW+LW/2,HIT-60-(22-f.t)*1.5);ctx.globalAlpha=1});
 /* combo besar */if(combo>=5){ctx.font='900 46px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.9)';ctx.shadowColor='#ff4fd8';ctx.shadowBlur=20;ctx.fillText(combo+'x',W/2,140);ctx.shadowBlur=0}
 /* hp bar */ctx.fillStyle='rgba(255,255,255,.15)';rr(20,16,W-40,10,5);ctx.fill();ctx.fillStyle=hp>40?'#3ee6ff':'#ff5f7a';rr(20,16,(W-40)*hp/100,10,5);ctx.fill();
 ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText(bpm+' BPM · beat '+beat,20,44)}
function loop(){if(run)update();draw();requestAnimationFrame(loop)}
for(var q=0;q<4;q++)(function(l){tap('p'+l,function(){pukul(l)})})(q);
document.addEventListener('keydown',function(e){var m={d:0,f:1,j:2,k:3};if(m[e.key]!==undefined)pukul(m[e.key])});
tap('snd',function(){sfx=!sfx;document.getElementById('snd').textContent=sfx?'🔊':'🔇'});
window.__mulai=function(l){reset(l);run=true;say('🎵 ikuti irama!')};
draw();loop();`
export function beatHtml (brand = 'THERYHANN!') {
  return shell({
    id: 'beatdrop', brand, judul: 'BEAT DROP', sub: 'RHYTHM · 4 LAJUR', bg: '#120b22',
    css: `.pads{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.pads .k{height:110px;font-size:30px;flex-direction:column;gap:4px;border:2px solid;box-shadow:0 6px 0 rgba(0,0,0,.5)}.pads small{font-size:10px;letter-spacing:2px;opacity:.8}
.pads .k:nth-child(1){background:#5a1f52;border-color:#ff4fd8}.pads .k:nth-child(2){background:#2d1e5e;border-color:#7a4dff}.pads .k:nth-child(3){background:#0f4a56;border-color:#3ee6ff}.pads .k:nth-child(4){background:#5c4a12;border-color:#ffd84a}.pads .k.dn{box-shadow:0 0 24px currentColor}`,
    hud: '<div class="p"><small>SKOR</small><span id="sk">0</span></div><div class="p"><small>COMBO</small><span id="cb">0x</span></div><div class="p"><small>HP</small><span id="hp">100%</span></div><div class="p" id="snd">🔊</div>',
    kontrol: '<div class="pads"><div class="k" id="p0">◆<small>D</small></div><div class="k" id="p1">◆<small>F</small></div><div class="k" id="p2">◆<small>J</small></div><div class="k" id="p3">◆<small>K</small></div></div>',
    hint: 'ketuk pad saat balok menyentuh lingkaran · PERFECT ×3 · combo tiap 10 menambah pengali · HP habis = kalah',
    lock: { warna: { a: '#7a4dff', b: '#ff4fd8' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>', deskripsi: 'Game ritme 4 lajur bergaya neon. Balok warna jatuh mengikuti beat — ketuk pad yang sesuai tepat di lingkaran. Pilih tempo di bawah.', kontrol: [['◆', '4 pad sesuai warna lajur'], ['⌨', 'D F J K di keyboard'], ['🔊', 'suara on/off'], ['💗', 'HP turun tiap miss']], level: ['100 BPM', '125 BPM', '150 BPM'], rekorKey: 'bd_lk' },
    js: BEAT_JS
  })
}

/* =========================== 2. MENARA LANGIT =========================== */
const MENARA_JS = String.raw`
var W=480,H=720;cv.width=W;cv.height=H;
var blocks=[],crane={x:W/2,dir:1,spd:3,w:120},cur=null,fall=null,run=false,skor=0,perfect=0,cam=0,lv=1,sway=0,clouds=[],birds=[],t=0,goyang=0;
for(var i=0;i<8;i++)clouds.push({x:Math.random()*W,y:Math.random()*H,s:.6+Math.random(),v:.2+Math.random()*.3});
function reset(l){lv=l;blocks=[{x:W/2-70,w:140,y:0,c:'#6b4f3a'}];crane.spd=[2.4,3.4,4.6][l];crane.w=[130,120,110][l];crane.x=W/2;cur=null;fall=null;skor=0;perfect=0;cam=0;sway=0;goyang=0;upd();baru()}
function upd(){document.getElementById('sk').textContent=skor;document.getElementById('pf').textContent=perfect;document.getElementById('tg').textContent=(blocks.length*3)+'m'}
function baru(){var top=blocks[blocks.length-1];cur={w:Math.min(top.w,crane.w),h:36,c:'hsl('+((blocks.length*23)%360)+',60%,'+(55+(blocks.length%3)*6)+'%)'}}
function jatuh(){if(!run||!cur||fall)return;fall={x:crane.x+sway-cur.w/2,y:70,w:cur.w,h:36,vy:0,c:cur.c};cur=null;bip(300,.06,'triangle')}
function update(){t++;if(!run)return;crane.x+=crane.dir*crane.spd;if(crane.x<70||crane.x>W-70)crane.dir*=-1;sway=Math.sin(t*.05)*4;
 if(fall){fall.vy+=.6;fall.y+=fall.vy;var top=blocks[blocks.length-1];var topY=H-140-blocks.length*36+cam;/* layar: sisi atas balok baru */if(fall.y>=topY){var ov=Math.min(fall.x+fall.w,top.x+top.w)-Math.max(fall.x,top.x);if(ov<=8){run=false;bip(90,.4,'sawtooth');return selesai('🏚️ MENARA RUNTUH','tinggi '+(blocks.length*3)+'m · skor '+skor+' · perfect '+perfect,skor)}
   var nx=Math.max(fall.x,top.x);var d=Math.abs(fall.x-top.x);var perfectHit=d<6;if(perfectHit){nx=top.x;ov=top.w;perfect++;skor+=5;say('✨ PERFECT +5');bip(880,.12,'sine');goyang=2;setTimeout(function(){goyang=0},300)}else skor+=1;
   blocks.push({x:nx,w:ov,y:0,c:fall.c});fall=null;bip(200,.05,'square');upd();if(ov<30)say('⚠️ tipis banget!');baru();var target=Math.max(0,(blocks.length-6)*36);cam=target}}
 clouds.forEach(function(c){c.x+=c.v;if(c.x>W+80)c.x=-80});if(Math.random()<.004)birds.push({x:-20,y:80+Math.random()*200,v:1+Math.random()});birds.forEach(function(b){b.x+=b.v});birds=birds.filter(function(b){return b.x<W+30})}
function draw(){var g=ctx.createLinearGradient(0,0,0,H);var h=Math.min(1,blocks.length/60);g.addColorStop(0,h<.5?'#ffb6c1':'#2b1d5c');g.addColorStop(.5,'#ffd9a8');g.addColorStop(1,'#bfe6ff');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(255,255,255,.8)';clouds.forEach(function(c){var y=(c.y+cam*.3)%(H+100)-50;ctx.beginPath();ctx.arc(c.x,y,18*c.s,0,7);ctx.arc(c.x+18*c.s,y-6*c.s,14*c.s,0,7);ctx.arc(c.x+34*c.s,y,16*c.s,0,7);ctx.fill()});
 ctx.strokeStyle='#333';ctx.lineWidth=2;birds.forEach(function(b){ctx.beginPath();ctx.moveTo(b.x-8,b.y);ctx.quadraticCurveTo(b.x-4,b.y-5,b.x,b.y);ctx.quadraticCurveTo(b.x+4,b.y-5,b.x+8,b.y);ctx.stroke()});
 /* kota */ctx.fillStyle='rgba(60,50,90,.35)';for(var i=0;i<10;i++){var bw=40,bh=60+((i*37)%90);ctx.fillRect(i*50,H-100-bh+cam*.5,bw,bh+200)}
 ctx.save();ctx.translate(Math.sin(t*.4)*goyang,0);
 /* tanah */ctx.fillStyle='#6a8f3a';ctx.fillRect(0,H-104+cam,W,300);
 blocks.forEach(function(b,i){var y=H-140-i*36+cam;ctx.fillStyle=b.c;rr(b.x,y,b.w,36,4);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(b.x,y,b.w,6);ctx.fillStyle='rgba(0,0,0,.15)';for(var w=b.x+10;w<b.x+b.w-10;w+=22){ctx.fillRect(w,y+12,10,12)}});
 ctx.restore();
 /* crane */var cy=-cam+30;ctx.strokeStyle='#333';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(W,10);ctx.stroke();ctx.beginPath();ctx.moveTo(crane.x,10);ctx.lineTo(crane.x+sway,70);ctx.stroke();
 if(cur){ctx.fillStyle=cur.c;rr(crane.x+sway-cur.w/2,70,cur.w,36,4);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(crane.x+sway-cur.w/2,70,cur.w,6)}
 if(fall){ctx.fillStyle=fall.c;rr(fall.x,fall.y,fall.w,36,4);ctx.fill()}
 ctx.font='900 40px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(60,40,80,.85)';ctx.fillText(blocks.length*3+'m',W/2,H-30);}
function loop(){update();draw();requestAnimationFrame(loop)}
tap('drop',jatuh);tap('stage',jatuh);document.addEventListener('keydown',function(e){if(e.key===' ')jatuh()});
window.__mulai=function(l){reset(l);run=true;say('🏗️ ketuk saat balok pas!')};
reset(1);loop();`
export function menaraHtml (brand = 'THERYHANN!') {
  return shell({
    id: 'menara', brand, judul: 'MENARA LANGIT', sub: 'TOWER STACK', bg: '#5b3d8f', ratio: '150%',
    css: `.drop{margin-top:12px;height:104px;border-radius:26px;background:linear-gradient(180deg,#ffd166,#f4a261);color:#4a2b12;font-size:20px;letter-spacing:3px;flex-direction:column;box-shadow:0 8px 0 #b86a2a,0 18px 30px rgba(0,0,0,.35)}.drop small{font-size:10px;letter-spacing:2px;opacity:.75;margin-top:2px}.drop.dn{box-shadow:0 2px 0 #b86a2a}.hud .p{background:rgba(255,255,255,.14)}`,
    hud: '<div class="p"><small>SKOR</small><span id="sk">0</span></div><div class="p"><small>PERFECT</small><span id="pf">0</span></div><div class="p"><small>TINGGI</small><span id="tg">3m</span></div>',
    kontrol: '<div class="k drop" id="drop">⬇ JATUHKAN<small>ketuk layar juga bisa</small></div>',
    hint: 'crane berayun kiri-kanan · lepaskan balok tepat di atas tumpukan · bagian yang menggantung terpotong · pas sempurna = PERFECT +5',
    lock: { warna: { a: '#f4a261', b: '#e76f51' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M4 20h16v-2H4zm2-3h12v-3H6zm2-4h8V9H8zm2-5h4V4h-4z"/></svg>', deskripsi: 'Bangun menara setinggi mungkin. Balok bergantung di crane yang berayun — ketuk JATUHKAN di saat yang tepat. Kelebihan balok terpotong, kalau meleset jauh menara runtuh.', kontrol: [['⬇', 'JATUHKAN balok'], ['👆', 'ketuk area game'], ['✨', 'pas sempurna = bonus'], ['📏', 'tiap balok = 3 meter']], level: ['Pelan', 'Normal', 'Ngebut'], rekorKey: 'mn_lk' },
    js: MENARA_JS
  })
}

/* =========================== 3. BUBBLE POP =========================== */
const BUBBLE_JS = String.raw`
var W=480,H=640;cv.width=W;cv.height=H;var R=22,COLS=10,ROWS=14,OX=(W-COLS*R*2)/2+R;
var COL=['#ff6b9d','#4fc3f7','#ffd54f','#81c784','#ba68c8','#ff8a65'];var grid=[],ang=-Math.PI/2,shot=null,cur=0,nxt=1,run=false,skor=0,lv=1,pops=[],shots=0,turun=0,t=0;
function warnaAcak(n){return Math.floor(Math.random()*n)}
function reset(l){lv=l;grid=[];var rows=[5,6,7][l],nc=[4,5,6][l];for(var r=0;r<ROWS;r++){grid[r]=[];for(var c=0;c<COLS;c++)grid[r][c]=r<rows?warnaAcak(nc):-1}cur=warnaAcak(nc);nxt=warnaAcak(nc);shot=null;skor=0;pops=[];shots=0;turun=0;ang=-Math.PI/2;upd()}
function upd(){document.getElementById('sk').textContent=skor;document.getElementById('sisa').textContent=hitung();document.getElementById('nx').style.background=COL[nxt]}
function hitung(){var n=0;grid.forEach(function(r){r.forEach(function(v){if(v>=0)n++})});return n}
function pos(r,c){return{x:OX+c*R*2+(r%2?R:0),y:R+6+r*R*1.75}}
function tembak(){if(!run||shot)return;shots++;shot={x:W/2,y:H-60,vx:Math.cos(ang)*11,vy:Math.sin(ang)*11,c:cur};cur=nxt;nxt=warnaAcak([4,5,6][lv]);upd();bip(500,.06,'sine')}
function tukar(){if(!run)return;var a=cur;cur=nxt;nxt=a;upd();bip(700,.05,'triangle')}
function tetangga(r,c){var odd=r%2;return[[r,c-1],[r,c+1],[r-1,c],[r+1,c],[r-1,odd?c+1:c-1],[r+1,odd?c+1:c-1]].filter(function(p){return p[0]>=0&&p[0]<ROWS&&p[1]>=0&&p[1]<COLS-(p[0]%2?1:0)})}
function flood(r,c,warna,seen){var key=r+','+c;if(seen[key])return[];seen[key]=1;if(grid[r][c]!==warna)return[];var out=[[r,c]];tetangga(r,c).forEach(function(p){out=out.concat(flood(p[0],p[1],warna,seen))});return out}
function tempel(){var best=null,bd=1e9;for(var r=0;r<ROWS;r++)for(var c=0;c<COLS-(r%2?1:0);c++){if(grid[r][c]>=0)continue;var p=pos(r,c),d=(p.x-shot.x)*(p.x-shot.x)+(p.y-shot.y)*(p.y-shot.y);if(d<bd){bd=d;best=[r,c]}}
 if(!best){shot=null;return}var r=best[0],c=best[1];grid[r][c]=shot.c;var grup=flood(r,c,shot.c,{});
 if(grup.length>=3){grup.forEach(function(p){pops.push({x:pos(p[0],p[1]).x,y:pos(p[0],p[1]).y,c:COL[grid[p[0]][p[1]]],t:20});grid[p[0]][p[1]]=-1});skor+=grup.length*10;bip(900,.1,'sine');
  /* lepas yang menggantung */var att={};for(var cc=0;cc<COLS;cc++)if(grid[0][cc]>=0)flood2(0,cc,att);var jatuh=0;for(var rr2=0;rr2<ROWS;rr2++)for(var c2=0;c2<COLS;c2++)if(grid[rr2][c2]>=0&&!att[rr2+','+c2]){pops.push({x:pos(rr2,c2).x,y:pos(rr2,c2).y,c:COL[grid[rr2][c2]],t:26,fall:true});grid[rr2][c2]=-1;jatuh++}
  if(jatuh){skor+=jatuh*20;say('💧 '+jatuh+' jatuh +'+jatuh*20)}else if(grup.length>=5)say('🫧 POP ×'+grup.length)}else{bip(200,.05,'square');if(r>=ROWS-2){run=false;return selesai('😵 PENUH','skor '+skor+' · tembakan '+shots,skor)}}
 shot=null;if(shots%[10,8,6][lv]===0){for(var rr3=ROWS-1;rr3>0;rr3--)grid[rr3]=grid[rr3-1].slice();grid[0]=[];for(var c3=0;c3<COLS;c3++)grid[0][c3]=warnaAcak([4,5,6][lv]);turun++;say('⬇ baris baru!');for(var r4=ROWS-2;r4<ROWS;r4++)if(grid[r4].some(function(v){return v>=0})){run=false;return selesai('😵 PENUH','skor '+skor+' · tembakan '+shots,skor)}}
 upd();if(hitung()===0){run=false;skor+=500;selesai('🎉 BERSIH!','papan bersih bonus +500 · skor '+skor,skor)}}
function flood2(r,c,seen){var key=r+','+c;if(seen[key]||grid[r][c]<0)return;seen[key]=1;tetangga(r,c).forEach(function(p){flood2(p[0],p[1],seen)})}
function update(){t++;if(shot){shot.x+=shot.vx;shot.y+=shot.vy;if(shot.x<R){shot.x=R;shot.vx*=-1}if(shot.x>W-R){shot.x=W-R;shot.vx*=-1}if(shot.y<R){tempel();return}
  var hit=false;for(var r=0;r<ROWS&&!hit;r++)for(var c=0;c<COLS;c++){if(grid[r][c]<0)continue;var p=pos(r,c),dx=p.x-shot.x,dy=p.y-shot.y;if(dx*dx+dy*dy<(R*2-4)*(R*2-4)){hit=true;break}}if(hit)tempel()}
 pops.forEach(function(p){p.t--;if(p.fall)p.y+=6});pops=pops.filter(function(p){return p.t>0})}
function bola(x,y,c,r){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(x-r*.3,y-r*.35,r*.35,0,7);ctx.fill()}
function draw(){var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#fde2f3');g.addColorStop(1,'#e0c3fc');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(var i=0;i<12;i++){ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc((i*97+t*.3)%W,(i*131)%H,6+i%4*3,0,7);ctx.fill()}
 ctx.strokeStyle='rgba(255,90,140,.6)';ctx.setLineDash([4,8]);ctx.beginPath();ctx.moveTo(0,pos(ROWS-2,0).y-R);ctx.lineTo(W,pos(ROWS-2,0).y-R);ctx.stroke();ctx.setLineDash([]);
 for(var r=0;r<ROWS;r++)for(var c=0;c<COLS-(r%2?1:0);c++){if(grid[r][c]<0)continue;var p=pos(r,c);bola(p.x,p.y,COL[grid[r][c]],R-1)}
 pops.forEach(function(p){ctx.globalAlpha=p.t/26;bola(p.x,p.y,p.c,R*(p.fall?1:p.t/20));ctx.globalAlpha=1});
 /* bidik */ctx.strokeStyle='rgba(120,60,160,.5)';ctx.lineWidth=3;ctx.setLineDash([6,10]);ctx.beginPath();ctx.moveTo(W/2,H-60);var lx=W/2,ly=H-60,vx=Math.cos(ang)*14,vy=Math.sin(ang)*14;for(var s=0;s<28;s++){lx+=vx;ly+=vy;if(lx<R||lx>W-R)vx*=-1;ctx.lineTo(lx,ly)}ctx.stroke();ctx.setLineDash([]);
 /* peluncur */ctx.fillStyle='#8e44ad';rr(W/2-40,H-30,80,20,10);ctx.fill();if(!shot||true)bola(W/2,H-60,COL[cur],R);if(shot)bola(shot.x,shot.y,COL[shot.c],R)}
function loop(){update();draw();requestAnimationFrame(loop)}
var aim=document.getElementById('aim');aim.addEventListener('input',function(){ang=-Math.PI/2+(aim.value-50)/50*1.25});
hold('ki',function(){keyL=true},function(){keyL=false});hold('ka',function(){keyR=true},function(){keyR=false});var keyL=false,keyR=false;
setInterval(function(){if(keyL){aim.value=+aim.value-2;aim.dispatchEvent(new Event('input'))}if(keyR){aim.value=+aim.value+2;aim.dispatchEvent(new Event('input'))}},30);
tap('fire',tembak);tap('swap',tukar);
cv.addEventListener('touchstart',function(e){e.preventDefault();var b=cv.getBoundingClientRect(),x=(e.touches[0].clientX-b.left)/b.width*W,y=(e.touches[0].clientY-b.top)/b.height*H;var a=Math.atan2(y-(H-60),x-W/2);if(a>-2.85&&a<-0.3){ang=a;aim.value=50+(a+Math.PI/2)/1.25*50;tembak()}},{passive:false});
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){aim.value=+aim.value-3;aim.dispatchEvent(new Event('input'))}if(e.key==='ArrowRight'){aim.value=+aim.value+3;aim.dispatchEvent(new Event('input'))}if(e.key===' '||e.key==='ArrowUp')tembak();if(e.key==='ArrowDown')tukar()});
window.__mulai=function(l){reset(l);run=true;say('🫧 3 warna sama = pop!')};
reset(1);loop();`
export function bubbleHtml (brand = 'THERYHANN!') {
  return shell({
    id: 'gelembung', brand, judul: 'BUBBLE POP', sub: 'BUBBLE SHOOTER · PERMEN', bg: '#6d3fa0',
    css: `.aimrow{display:grid;grid-template-columns:54px 1fr 54px;gap:8px;margin-top:10px;align-items:center}.aimrow .k{height:62px;font-size:24px;background:#8e44ad;box-shadow:0 5px 0 #5b2c7a}
input[type=range]{-webkit-appearance:none;width:100%;height:14px;border-radius:7px;background:linear-gradient(90deg,#ff6b9d,#ffd54f,#4fc3f7);outline:none}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:34px;height:34px;border-radius:50%;background:#fff;border:4px solid #8e44ad;box-shadow:0 4px 10px rgba(0,0,0,.3)}
.act{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:8px}.act .k{height:76px;font-size:16px;letter-spacing:2px;gap:8px}.swap{background:#fff;color:#6d3fa0;box-shadow:0 5px 0 #c9b3e6}.fire{background:linear-gradient(90deg,#ff6b9d,#ff8a65);box-shadow:0 5px 0 #a33e5f;font-size:18px}.nx{width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,.7)}`,
    hud: '<div class="p"><small>SKOR</small><span id="sk">0</span></div><div class="p"><small>SISA</small><span id="sisa">0</span></div>',
    kontrol: '<div class="aimrow"><div class="k" id="ki">◀</div><input type="range" id="aim" min="0" max="100" value="50"><div class="k" id="ka">▶</div></div><div class="act"><div class="k swap" id="swap"><span class="nx" id="nx"></span>TUKAR</div><div class="k fire" id="fire">🫧 TEMBAK</div></div>',
    hint: 'geser slider / ◀▶ untuk bidik · TEMBAK · ketuk papan langsung juga bisa · 3 warna sama = pop · yang menggantung ikut jatuh (+20) · baris baru turun berkala',
    lock: { warna: { a: '#8e44ad', b: '#ff6b9d' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="9" cy="9" r="6"/><circle cx="17" cy="15" r="4" opacity=".8"/><circle cx="7" cy="18" r="2.5" opacity=".7"/></svg>', deskripsi: 'Bubble shooter bertema permen pastel. Bidik dengan slider lalu tembak — tiga gelembung sewarna meletus, gelembung yang menggantung ikut jatuh. Papan turun tiap beberapa tembakan.', kontrol: [['◀▶', 'bidik halus'], ['🫧', 'TEMBAK'], ['🔁', 'TUKAR dengan berikutnya'], ['👆', 'ketuk papan = bidik & tembak']], level: ['4 warna', '5 warna', '6 warna'], rekorKey: 'bb_lk' },
    js: BUBBLE_JS
  })
}

/* =========================== 4. CACING.IO =========================== */
const CACING_JS = String.raw`
var W=520,H=640;cv.width=W;cv.height=H;var MAP=2200;var me,worms=[],foods=[],run=false,lv=1,t=0,cam={x:0,y:0},dir={x:1,y:0},boost=false,skor=0,kills=0,best=0,namaLain=__D.pemain||['nekuy','Monyet','yanto','te ff','aaahaiii'];
var COLW=['#ff5f7a','#3ee6ff','#ffd84a','#7cff6b','#ff8a65','#ba68c8','#4fc3f7'];
function buatWorm(nama,bot,i){var a=Math.random()*6.28;var w={nama:nama,bot:bot,x:Math.random()*MAP,y:Math.random()*MAP,a:a,seg:[],len:bot?18+Math.random()*30:16,c:COLW[i%COLW.length],hidup:true,spd:2.6,aiT:0,skor:0};for(var k=0;k<w.len;k++)w.seg.push({x:w.x-Math.cos(a)*k*6,y:w.y-Math.sin(a)*k*6});return w}
function reset(l){lv=l;worms=[];foods=[];me=buatWorm(__D.nama||'kamu',false,0);me.x=MAP/2;me.y=MAP/2;worms.push(me);var n=[4,6,8][l];for(var i=0;i<n;i++)worms.push(buatWorm(namaLain[i%namaLain.length]+(i>=namaLain.length?i:''),true,i+1));for(var f=0;f<260;f++)foods.push(mkFood());skor=0;kills=0;dir={x:1,y:0};boost=false;upd()}
function mkFood(x,y,v){return{x:x!==undefined?x:Math.random()*MAP,y:y!==undefined?y:Math.random()*MAP,v:v||1,c:COLW[Math.floor(Math.random()*COLW.length)],r:v?4+v:3+Math.random()*3}}
function upd(){document.getElementById('sk').textContent=Math.floor(me.len);document.getElementById('kl').textContent=kills;var rank=worms.filter(function(w){return w.hidup}).sort(function(a,b){return b.len-a.len});document.getElementById('rk').textContent='#'+(rank.indexOf(me)+1)}
function ai(w){w.aiT--;if(w.aiT<=0){w.aiT=30+Math.random()*60;var f=null,bd=1e9;foods.forEach(function(o){var d=(o.x-w.x)*(o.x-w.x)+(o.y-w.y)*(o.y-w.y);if(d<bd){bd=d;f=o}});if(f)w.target=Math.atan2(f.y-w.y,f.x-w.x);if(lv>0&&Math.random()<.25*lv&&Math.hypot(me.x-w.x,me.y-w.y)<300)w.target=Math.atan2(me.y-w.y,me.x-w.x)+.6}
 var d=((w.target||w.a)-w.a+Math.PI*3)%(Math.PI*2)-Math.PI;w.a+=Math.max(-.07,Math.min(.07,d));if(w.x<60)w.a=0;if(w.x>MAP-60)w.a=Math.PI;if(w.y<60)w.a=Math.PI/2;if(w.y>MAP-60)w.a=-Math.PI/2}
function gerak(w,sp){w.x+=Math.cos(w.a)*sp;w.y+=Math.sin(w.a)*sp;w.seg.unshift({x:w.x,y:w.y});while(w.seg.length>w.len*3)w.seg.pop()}
function mati(w){w.hidup=false;for(var i=0;i<w.seg.length;i+=4)foods.push(mkFood(w.seg[i].x+Math.random()*10-5,w.seg[i].y+Math.random()*10-5,2));if(w.bot)setTimeout(function(){var idx=worms.indexOf(w);worms[idx]=buatWorm(w.nama,true,idx)},3000)}
function update(){t++;if(!run)return;
 var want=Math.atan2(dir.y,dir.x);var d=(want-me.a+Math.PI*3)%(Math.PI*2)-Math.PI;me.a+=Math.max(-.12,Math.min(.12,d));
 var sp=boost&&me.len>10?5.2:2.6;if(boost&&me.len>10&&t%6===0){me.len-=.5;foods.push(mkFood(me.seg[me.seg.length-1].x,me.seg[me.seg.length-1].y,1))}
 gerak(me,sp);if(me.x<0||me.x>MAP||me.y<0||me.y>MAP)return tamat('nabrak tembok');
 worms.forEach(function(w){if(!w.hidup||w===me)return;ai(w);gerak(w,w.spd)});
 /* makan */worms.forEach(function(w){if(!w.hidup)return;var r=8+w.len*.08;for(var i=foods.length-1;i>=0;i--){var f=foods[i];var dx=f.x-w.x,dy=f.y-w.y;if(dx*dx+dy*dy<(r+f.r+6)*(r+f.r+6)){foods.splice(i,1);w.len+=f.v*.6;if(w===me){skor+=f.v;if(t%3===0)bip(600+Math.random()*300,.04,'sine',.03)}}}});
 while(foods.length<260)foods.push(mkFood());
 /* tabrakan kepala vs badan lain */worms.forEach(function(w){if(!w.hidup)return;var r=8+w.len*.08;worms.forEach(function(o){if(!o.hidup||o===w)return;var ro=8+o.len*.08;for(var i=0;i<o.seg.length;i+=3){var dx=o.seg[i].x-w.x,dy=o.seg[i].y-w.y;if(dx*dx+dy*dy<(r+ro)*(r+ro)*.7){if(w===me)return tamat('nabrak '+o.nama);mati(w);if(o===me){kills++;say('💥 '+w.nama+' nabrak kamu!');bip(200,.2,'sawtooth')}return}}})});
 cam.x+=(me.x-W/2-cam.x)*.15;cam.y+=(me.y-H/2-cam.y)*.15;if(t%20===0)upd()}
function tamat(alasan){if(!run)return;run=false;mati(me);bip(100,.5,'sawtooth');selesai('💀 KAMU MATI','panjang '+Math.floor(me.len)+' · '+alasan+' · kill '+kills,Math.floor(me.len))}
function gbrWorm(w){var r=8+w.len*.08;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=w.c;ctx.lineWidth=r*2;ctx.shadowColor=w.c;ctx.shadowBlur=w===me&&boost?22:8;ctx.beginPath();for(var i=0;i<w.seg.length;i+=2){var p=w.seg[i];if(i===0)ctx.moveTo(p.x-cam.x,p.y-cam.y);else ctx.lineTo(p.x-cam.x,p.y-cam.y)}ctx.stroke();ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=r*.7;ctx.beginPath();for(var j=0;j<w.seg.length;j+=6){var q=w.seg[j];ctx.moveTo(q.x-cam.x,q.y-cam.y);ctx.lineTo(q.x-cam.x+.1,q.y-cam.y)}ctx.stroke();
 var hx=w.x-cam.x,hy=w.y-cam.y;ctx.fillStyle='#fff';var ex=Math.cos(w.a+1.1)*r*.6,ey=Math.sin(w.a+1.1)*r*.6,ex2=Math.cos(w.a-1.1)*r*.6,ey2=Math.sin(w.a-1.1)*r*.6;ctx.beginPath();ctx.arc(hx+ex,hy+ey,r*.38,0,7);ctx.arc(hx+ex2,hy+ey2,r*.38,0,7);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(hx+ex+Math.cos(w.a)*2,hy+ey+Math.sin(w.a)*2,r*.18,0,7);ctx.arc(hx+ex2+Math.cos(w.a)*2,hy+ey2+Math.sin(w.a)*2,r*.18,0,7);ctx.fill();
 ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=4;ctx.fillText(w.nama+' · '+Math.floor(w.len),hx,hy-r-8);ctx.shadowBlur=0}
function draw(){ctx.fillStyle='#0b1020';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(80,120,255,.12)';ctx.lineWidth=1;var gs=40,ox=-cam.x%gs,oy=-cam.y%gs;ctx.beginPath();for(var x=ox;x<W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(var y=oy;y<H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
 ctx.strokeStyle='#ff5f7a';ctx.lineWidth=6;ctx.strokeRect(-cam.x,-cam.y,MAP,MAP);
 foods.forEach(function(f){var x=f.x-cam.x,y=f.y-cam.y;if(x<-10||x>W+10||y<-10||y>H+10)return;ctx.fillStyle=f.c;ctx.shadowColor=f.c;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,y,f.r+Math.sin(t*.1+f.x)*.8,0,7);ctx.fill()});ctx.shadowBlur=0;
 worms.forEach(function(w){if(w.hidup&&w!==me)gbrWorm(w)});if(me.hidup)gbrWorm(me);
 /* minimap */ctx.fillStyle='rgba(0,0,0,.5)';rr(W-96,H-96,86,86,8);ctx.fill();worms.forEach(function(w){if(!w.hidup)return;ctx.fillStyle=w===me?'#fff':w.c;ctx.fillRect(W-96+w.x/MAP*86-2,H-96+w.y/MAP*86-2,4,4)});
 /* papan peringkat */var rank=worms.filter(function(w){return w.hidup}).sort(function(a,b){return b.len-a.len}).slice(0,5);ctx.fillStyle='rgba(0,0,0,.45)';rr(W-150,10,140,20+rank.length*16,8);ctx.fill();ctx.font='bold 11px sans-serif';ctx.textAlign='left';rank.forEach(function(w,i){ctx.fillStyle=w===me?'#ffd84a':'#fff';ctx.fillText((i+1)+'. '+w.nama+'  '+Math.floor(w.len),W-142,28+i*16)})}
function loop(){update();draw();requestAnimationFrame(loop)}
/* joystick 8 arah */var J={'0':[0,-1],'1':[1,-1],'2':[1,0],'3':[1,1],'4':[0,1],'5':[-1,1],'6':[-1,0],'7':[-1,-1]};Object.keys(J).forEach(function(k){hold('j'+k,function(){dir={x:J[k][0],y:J[k][1]};document.querySelectorAll('.joy .k').forEach(function(e){e.classList.remove('on')});document.getElementById('j'+k).classList.add('on')})});
hold('boost',function(){boost=true},function(){boost=false});
/* geser di canvas = arah */function ptr(e){var b=cv.getBoundingClientRect(),p=e.touches?e.touches[0]:e;var x=(p.clientX-b.left)/b.width*W-W/2,y=(p.clientY-b.top)/b.height*H-H/2;if(Math.hypot(x,y)>20)dir={x:x,y:y}}cv.addEventListener('touchstart',function(e){e.preventDefault();ptr(e)},{passive:false});cv.addEventListener('touchmove',function(e){e.preventDefault();ptr(e)},{passive:false});
document.addEventListener('keydown',function(e){var m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key])dir={x:m[e.key][0],y:m[e.key][1]};if(e.key===' ')boost=true});document.addEventListener('keyup',function(e){if(e.key===' ')boost=false});
window.__mulai=function(l){reset(l);run=true;say('🐛 makan titik, hindari badan cacing lain')};
reset(1);loop();`
export function cacingHtml (brand = 'THERYHANN!', d = {}) {
  const pemain = (d.pemain || []).filter(Boolean).slice(0, 8).map(n => String(n).slice(0, 12))
  return shell({
    id: 'cacing', brand, judul: 'CACING.IO', sub: 'ARENA · ' + (d.arena || 'GLOBAL'), bg: '#0b1020', ratio: '123%',
    css: `.ctl{display:grid;grid-template-columns:172px 1fr;gap:12px;margin-top:10px;align-items:center}.joy{display:grid;grid-template-columns:repeat(3,54px);grid-template-rows:repeat(3,54px);gap:4px}.joy .k{background:#1a2340;border:1px solid #33427a;font-size:18px;border-radius:12px}.joy .k.on{background:#3ee6ff;color:#0b1020;box-shadow:0 0 16px #3ee6ff}.joy .c{background:radial-gradient(#33427a,#1a2340);border-radius:50%}
.boost{height:172px;border-radius:24px;background:radial-gradient(circle at 50% 30%,#ff8fa3,#ff5f7a 60%,#b32d4a);font-size:18px;letter-spacing:3px;flex-direction:column;box-shadow:0 8px 0 #7a1f33,0 0 30px rgba(255,95,122,.5)}.boost small{font-size:10px;letter-spacing:1px;opacity:.85;margin-top:4px}.boost.dn{box-shadow:0 2px 0 #7a1f33,0 0 40px #ff5f7a}.hud .p{background:#1a2340;border-color:#33427a}`,
    hud: '<div class="p"><small>PANJANG</small><span id="sk">0</span></div><div class="p"><small>KILL</small><span id="kl">0</span></div><div class="p"><small>RANK</small><span id="rk">#1</span></div>',
    kontrol: '<div class="ctl"><div class="joy"><div class="k" id="j7">↖</div><div class="k" id="j0">↑</div><div class="k" id="j1">↗</div><div class="k" id="j6">←</div><div class="k c"></div><div class="k" id="j2">→</div><div class="k" id="j5">↙</div><div class="k" id="j4">↓</div><div class="k" id="j3">↘</div></div><div class="k boost" id="boost">⚡ BOOST<small>tahan · memakai panjang</small></div></div>',
    hint: 'joystick 8 arah atau geser jari di arena · BOOST = ngebut tapi badan memendek · buat lawan menabrak badanmu → mereka jadi makanan',
    lock: { warna: { a: '#3ee6ff', b: '#ff5f7a' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M4 16c3 0 3-8 6-8s3 8 6 8 3-8 5-8"/><circle cx="20" cy="8" r="1.5" fill="#fff"/></svg>', deskripsi: 'Arena cacing bergaya io. Lawan bernama member grupmu berkeliaran memakan titik cahaya — jadilah yang terpanjang. Kepala menabrak badan lain = mati dan berubah jadi makanan.', kontrol: [['✥', 'joystick 8 arah'], ['👆', 'geser jari di arena'], ['⚡', 'BOOST (tahan)'], ['🗺', 'minimap & peringkat']], level: ['4 lawan', '6 lawan', '8 lawan agresif'], rekorKey: 'cc_lk' },
    js: CACING_JS, data: { nama: d.nama || 'kamu', pemain: pemain.length ? pemain : ['nekuy', 'Monyet', 'yanto', 'te ff', 'aaahaiii'] }
  })
}

/* =========================== 5. SUSHI MASTER =========================== */
const SUSHI_JS = String.raw`
var W=480,H=560;cv.width=W;cv.height=H;
var BAHAN={nasi:{e:'🍚',n:'Nasi',c:'#fff'},ikan:{e:'🐟',n:'Salmon',c:'#ff8a65'},tuna:{e:'🍣',n:'Tuna',c:'#e53935'},alpukat:{e:'🥑',n:'Alpukat',c:'#8bc34a'},timun:{e:'🥒',n:'Timun',c:'#4caf50'},nori:{e:'🍙',n:'Nori',c:'#263238'},udang:{e:'🍤',n:'Udang',c:'#ffab91'},telur:{e:'🍳',n:'Tamago',c:'#ffd54f'}};
var MENU=[{n:'Salmon Nigiri',b:['nasi','ikan'],h:12},{n:'Tuna Nigiri',b:['nasi','tuna'],h:12},{n:'Ebi Nigiri',b:['nasi','udang'],h:13},{n:'Kappa Maki',b:['nori','nasi','timun'],h:15},{n:'Avocado Roll',b:['nori','nasi','alpukat'],h:15},{n:'Tamago',b:['nasi','telur','nori'],h:14},{n:'California',b:['nori','nasi','alpukat','udang'],h:22},{n:'Rainbow Roll',b:['nori','nasi','ikan','tuna','alpukat'],h:30},{n:'Dragon Roll',b:['nori','nasi','udang','alpukat','telur'],h:32}];
var pel=[],piring=[],run=false,uang=0,tip=0,t=0,lv=1,puas=100,dilayani=0,gagal=0,waktu=0,spawnT=0;
function reset(l){lv=l;pel=[];piring=[];uang=0;tip=0;t=0;puas=100;dilayani=0;gagal=0;waktu=[120,100,90][l]*60;spawnT=60;upd()}
function upd(){document.getElementById('sk').textContent='Rp'+uang+'k';document.getElementById('pu').textContent=puas+'%';document.getElementById('tm').textContent=Math.ceil(waktu/60)+'s';var el=document.getElementById('piring');el.innerHTML=piring.length?piring.map(function(b){return '<span>'+BAHAN[b].e+'</span>'}).join(''):'<i>piring kosong — pilih bahan</i>'}
function datang(){var maks=[2,3,4][lv];if(pel.length>=maks)return;var pool=MENU.slice(0,[5,7,9][lv]);var o=pool[Math.floor(Math.random()*pool.length)];pel.push({o:o,sabar:[1500,1100,850][lv],maks:[1500,1100,850][lv],wajah:['🧑','👩','👨‍🦱','👵','🧔','👧','🧕','👴'][Math.floor(Math.random()*8)],x:W+60});bip(880,.08,'sine')}
function tambah(b){if(!run)return;if(piring.length>=6)return say('🍽️ piring penuh, SAJIKAN atau BUANG');piring.push(b);bip(500+piring.length*60,.05,'triangle');upd()}
function sama(a,b){if(a.length!==b.length)return false;var x=a.slice().sort(),y=b.slice().sort();return x.every(function(v,i){return v===y[i]})}
function sajikan(){if(!run||!piring.length)return;var idx=-1;pel.forEach(function(p,i){if(idx<0&&sama(p.o.b,piring))idx=i});
 if(idx>=0){var p=pel[idx];var bonus=Math.round(p.sabar/p.maks*p.o.h*.5);uang+=p.o.h;tip+=bonus;uang+=bonus;dilayani++;puas=Math.min(100,puas+3);pel.splice(idx,1);say('✅ '+p.o.n+' +Rp'+(p.o.h+bonus)+'k'+(bonus>5?' 💰 tip!':''));bip(1046,.12,'sine');bip(1318,.12,'sine')}
 else{puas-=8;say('❌ tidak ada yang pesan itu');bip(150,.2,'sawtooth')}piring=[];upd();if(puas<=0)akhir()}
function buang(){if(!piring.length)return;piring=[];say('🗑️ dibuang');bip(200,.05,'square');upd()}
function akhir(){run=false;selesai(puas>0?'🏁 SHIFT SELESAI':'😡 PELANGGAN KABUR','Rp'+uang+'k · '+dilayani+' pesanan · tip Rp'+tip+'k · '+gagal+' pergi',uang)}
function update(){if(!run)return;t++;waktu--;if(waktu<=0)return akhir();spawnT--;if(spawnT<=0){datang();spawnT=[300,220,170][lv]+Math.random()*120}
 for(var i=pel.length-1;i>=0;i--){var p=pel[i];p.x+=(80+i*130-p.x)*.1;p.sabar--;if(p.sabar<=0){pel.splice(i,1);gagal++;puas-=15;say('😡 pelanggan pergi!');bip(120,.3,'sawtooth');if(puas<=0)return akhir()}}
 if(t%30===0)upd()}
function draw(){ctx.fillStyle='#f3e3c3';ctx.fillRect(0,0,W,H);/* dinding */var g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,'#b23a48');g.addColorStop(1,'#8c2d3a');ctx.fillStyle=g;ctx.fillRect(0,0,W,300);ctx.fillStyle='rgba(255,255,255,.06)';for(var y=0;y<300;y+=24)ctx.fillRect(0,y,W,2);
 ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe3a3';ctx.fillText('🏮  寿司 SUSHI MASTER  🏮',W/2,44);
 /* meja bar */ctx.fillStyle='#6d4c2a';ctx.fillRect(0,300,W,40);ctx.fillStyle='#8b6a3f';ctx.fillRect(0,340,W,220);ctx.fillStyle='rgba(0,0,0,.08)';for(var x=0;x<W;x+=60)ctx.fillRect(x,340,2,220);
 /* pelanggan */pel.forEach(function(p,i){var x=p.x;ctx.font='58px serif';ctx.fillText(p.wajah,x,290);var bw=130,bx=x-bw/2,by=110;ctx.fillStyle='#fff';rr(bx,by,bw,120,14);ctx.fill();ctx.beginPath();ctx.moveTo(x-8,by+120);ctx.lineTo(x+8,by+120);ctx.lineTo(x,by+132);ctx.fill();
  ctx.fillStyle='#333';ctx.font='bold 12px sans-serif';ctx.fillText(p.o.n,x,by+20);ctx.font='22px serif';var s=p.o.b.map(function(b){return BAHAN[b].e}).join('');ctx.fillText(s,x,by+52);ctx.font='bold 11px sans-serif';ctx.fillStyle='#2e7d32';ctx.fillText('Rp'+p.o.h+'k',x,by+72);
  var f=p.sabar/p.maks;ctx.fillStyle='#eee';rr(bx+12,by+88,bw-24,12,6);ctx.fill();ctx.fillStyle=f>.5?'#66bb6a':f>.25?'#ffa726':'#ef5350';rr(bx+12,by+88,(bw-24)*f,12,6);ctx.fill();ctx.fillStyle='#333';ctx.font='bold 9px sans-serif';ctx.fillText(f>.5?'santai':f>.25?'mulai kesal':'MAU PERGI!',x,by+112)});
 if(!pel.length){ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='bold 14px sans-serif';ctx.fillText('menunggu pelanggan…',W/2,200)}
 /* talenan & piring */ctx.fillStyle='#d7b07a';rr(60,370,W-120,150,16);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(W/2,450,150,58,0,0,7);ctx.fill();ctx.strokeStyle='#e0e0e0';ctx.lineWidth=4;ctx.stroke();
 ctx.font='40px serif';piring.forEach(function(b,i){ctx.fillText(BAHAN[b].e,W/2-(piring.length-1)*24+i*48,465)});
 ctx.fillStyle='#4e342e';ctx.font='bold 12px sans-serif';ctx.fillText('piring: '+(piring.length?piring.map(function(b){return BAHAN[b].n}).join(' + '):'kosong'),W/2,540)}
function loop(){update();draw();requestAnimationFrame(loop)}
Object.keys(BAHAN).forEach(function(k){tap('b_'+k,function(){tambah(k)})});tap('serve',sajikan);tap('trash',buang);
document.addEventListener('keydown',function(e){var ks=Object.keys(BAHAN);var n=parseInt(e.key);if(n>=1&&n<=8)tambah(ks[n-1]);if(e.key==='Enter'||e.key===' ')sajikan();if(e.key==='Backspace')buang()});
window.__mulai=function(l){reset(l);run=true;datang();say('🍣 lihat pesanan, susun bahan, SAJIKAN!')};
reset(1);loop();`
export function sushiHtml (brand = 'THERYHANN!') {
  const bahan = [['nasi', '🍚', 'Nasi'], ['ikan', '🐟', 'Salmon'], ['tuna', '🍣', 'Tuna'], ['udang', '🍤', 'Udang'], ['nori', '🍙', 'Nori'], ['alpukat', '🥑', 'Alpukat'], ['timun', '🥒', 'Timun'], ['telur', '🍳', 'Tamago']]
  return shell({
    id: 'sushi', brand, judul: 'SUSHI MASTER', sub: 'DAPUR · MANAJEMEN PESANAN', bg: '#3e2723', ratio: '117%',
    css: `.hud .p{background:#5d4037;border-color:#8d6e63}.piring{margin-top:10px;background:#fff;color:#333;border-radius:14px;min-height:46px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:24px;border:3px solid #d7b07a}.piring i{font-size:12px;color:#999;font-style:normal}
.bahan{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}.bahan .k{height:76px;flex-direction:column;background:linear-gradient(180deg,#8d6e63,#6d4c41);border:2px solid #a1887f;font-size:26px;gap:2px;box-shadow:0 5px 0 #3e2723}.bahan small{font-size:10px;letter-spacing:.5px}
.act{display:grid;grid-template-columns:1fr 2.4fr;gap:8px;margin-top:8px}.act .k{height:74px;font-size:17px;letter-spacing:2px}.trash{background:#546e7a;box-shadow:0 5px 0 #263238}.serve{background:linear-gradient(90deg,#e53935,#ff7043);box-shadow:0 5px 0 #8e1b1b;font-size:18px}`,
    hud: '<div class="p"><small>OMZET</small><span id="sk">Rp0k</span></div><div class="p"><small>PUAS</small><span id="pu">100%</span></div><div class="p"><small>WAKTU</small><span id="tm">120s</span></div>',
    kontrol: '<div class="piring" id="piring"><i>piring kosong — pilih bahan</i></div><div class="bahan">' + bahan.map(b => `<div class="k" id="b_${b[0]}">${b[1]}<small>${b[2]}</small></div>`).join('') + '</div><div class="act"><div class="k trash" id="trash">🗑️ BUANG</div><div class="k serve" id="serve">🍣 SAJIKAN</div></div>',
    hint: 'baca pesanan di balon pelanggan · ketuk bahan sesuai resep (urutan bebas) · SAJIKAN · makin cepat makin besar tip · kesabaran habis = pelanggan pergi',
    lock: { warna: { a: '#b23a48', b: '#ff7043' }, ikonSvg: '<svg viewBox="0 0 24 24" fill="#fff"><ellipse cx="12" cy="15" rx="9" ry="4"/><path d="M5 10c0-3 3-5 7-5s7 2 7 5v2H5z" opacity=".85"/></svg>', deskripsi: 'Kelola bar sushi kecilmu. Pelanggan datang membawa pesanan — susun bahan yang tepat di piring lalu sajikan sebelum kesabaran habis. Dapatkan omzet & tip setinggi mungkin dalam satu shift.', kontrol: [['🍚🐟', '8 tombol bahan'], ['🍣', 'SAJIKAN pesanan'], ['🗑️', 'BUANG isi piring'], ['⏳', 'bar kesabaran tiap pelanggan']], level: ['Santai · 5 menu', 'Normal · 7 menu', 'Rush · 9 menu'], rekorKey: 'ss_lk' },
    js: SUSHI_JS
  })
}

export const ARCADE_7 = [
  { id: 'beatdrop', cmd: 'beatdrop', icon: '🎵', nama: 'Beat Drop (rhythm)', title: 'Beat Drop', ket: 'rhythm 4 lajur neon, pad D F J K, PERFECT/GOOD, combo & HP — lock screen pilih BPM', ratio: '480×640', html: beatHtml },
  { id: 'menara', cmd: 'menara', icon: '🏗️', nama: 'Menara Langit (stack)', title: 'Menara Langit', ket: 'tumpuk balok dari crane berayun, satu tombol JATUHKAN, PERFECT bonus, langit berubah', ratio: '480×720', html: menaraHtml },
  { id: 'gelembung', cmd: 'gelembung', icon: '🫧', nama: 'Bubble Pop (shooter)', title: 'Bubble Pop', ket: 'bubble shooter permen pastel: slider bidik + ◀▶, TEMBAK, TUKAR, gantung ikut jatuh', ratio: '480×640', html: bubbleHtml },
  { id: 'cacing', cmd: 'cacing', icon: '🐛', nama: 'Cacing.io (arena)', title: 'Cacing.io', ket: 'worm io: joystick 8 arah + BOOST, lawan = member grup, minimap & peringkat', ratio: '520×640', html: b => cacingHtml(b, {}) },
  { id: 'sushi', cmd: 'sushi', icon: '🍣', nama: 'Sushi Master (dapur)', title: 'Sushi Master', ket: 'manajemen bar sushi: pesanan, 8 tombol bahan, SAJIKAN/BUANG, kesabaran & tip', ratio: '480×560', html: sushiHtml }
]

export default { beatHtml, menaraHtml, bubbleHtml, cacingHtml, sushiHtml, ARCADE_7 }
