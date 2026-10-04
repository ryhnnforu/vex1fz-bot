import { lockScreen } from './lockscreen.js'
/**
 * lib/nekopark.js — 🐱 NEKO PARK · SAKURA (v7.11.0)
 * ------------------------------------------------------------------
 *  Meniru referensi video pengguna: taman sakura langit pink, bukit ungu
 *  bergerigi, rumput hijau, platform kayu, papan "→ NEKO PARK", gerbang
 *  torii merah, kucing-kucing kuning dengan nama di atas kepala, bendera
 *  jarak "nama · 32m" di kanan, koin melayang, bom/hati/emote, bubble
 *  chat, HUD "NEKO PARK · SAKURA ONLINE" + KOIN / PLR / 💬 / 🔊 / 🚪.
 *  Kontrol: ◀ ▶ · emote 👋❤️😂😡🎉✨ · item 💣🥊🎣 · ▲JAUH ▼DEKAT ·
 *  PAKAI BOM · LOMPAT. "Mode online": pemain lain adalah kucing AI yang
 *  memakai nama member grup (dikirim bot), berkeliaran, chat, lempar bom;
 *  lempar bom ke mereka → +koin, kena bom → kehilangan hati; koin dan
 *  rekor tersimpan di perangkat. Semua di satu kartu HTML self-contained.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#2a2530;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;overflow-x:hidden}
.np{max-width:600px;margin:0 auto;padding:8px 8px 14px;background:#2a2530}
.hud{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.hud .lg b{display:block;font-size:20px;font-weight:900;letter-spacing:2px;line-height:1}
.hud .lg small{display:block;font-size:9px;letter-spacing:3px;color:#c9bfd4;margin-top:3px}
.hud .r{display:flex;gap:6px}
.hud .r .p{background:#3a3342;border:1px solid #4a4254;border-radius:10px;min-width:46px;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:16px}
.hud .r .p small{font-size:8px;letter-spacing:1.5px;color:#c9bfd4;font-weight:800}
.hud .r .p.ic{font-size:18px;min-width:44px}
.hud .r .p.aktif{background:#7a4dff;border-color:#a98cff}
.stage{position:relative;margin-top:8px;border-radius:14px;overflow:hidden;background:#f6c6dc;height:0;padding-bottom:144%;border:3px solid #3a3342}
canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none}
.chatbox{position:absolute;left:8px;right:8px;bottom:8px;display:none;gap:6px}
.chatbox.on{display:flex}
.chatbox input{flex:1;height:38px;border-radius:10px;border:0;padding:0 12px;font-size:14px;background:rgba(255,255,255,.95);color:#222;outline:none}
.chatbox button{height:38px;padding:0 14px;border:0;border-radius:10px;background:#7a4dff;color:#fff;font-weight:900}
.ctl{display:grid;grid-template-columns:52px 52px 1fr;gap:8px;margin-top:10px;align-items:start}
.b{border-radius:12px;background:#4a3f7a;border:1px solid #6a5ca8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;box-shadow:0 4px 0 #2f2850}
.b:active,.b.dn{transform:translateY(3px);box-shadow:0 1px 0 #2f2850;background:#5a4d95}
.arw{height:66px;font-size:24px}
.arw.kanan{background:#6a52c8}
.emo{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.emo .b{height:34px;font-size:18px;background:#3a3342;border-color:#4a4254;box-shadow:0 3px 0 #1e1a24}
.itm{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}
.itm .b{height:40px;font-size:20px;background:#3a3342;border-color:#4a4254;box-shadow:0 3px 0 #1e1a24;position:relative}
.itm .b.sel{border:2px solid #ffd84a;background:#3d3620}
.itm .b i{position:absolute;right:4px;top:2px;font-style:normal;font-size:10px;color:#ffd84a;font-weight:900}
.row2{display:grid;grid-template-columns:44px 44px 1fr 1fr;gap:8px;margin-top:8px}
.jd{height:56px;display:flex;flex-direction:column;font-size:10px;letter-spacing:.5px;background:#3a3342;border-color:#4a4254;box-shadow:0 3px 0 #1e1a24;border-radius:50%}
.jd b{font-size:16px;line-height:1}
.big{height:56px;font-size:11px;letter-spacing:1px;flex-direction:column;gap:2px}
.big b{font-size:18px}
.big.bom{background:#4a3f7a}
.big.lompat{background:#e0568a;border-color:#ff8ab4;box-shadow:0 4px 0 #8f2f55}
.hint{text-align:center;font-size:10px;color:#a79fb3;margin-top:10px;line-height:1.5}
.hint b{color:#e6dff0}
.toast{position:absolute;left:50%;top:14px;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}
.toast.on{opacity:1}
`

const JS = String.raw`
(function(){
var D=__NP, cv=document.getElementById('cv'), ctx=cv.getContext('2d'), W=576, H=832; cv.width=W; cv.height=H;
var koinEl=document.getElementById('koin'), plrEl=document.getElementById('plr'), toast=document.getElementById('toast'), chatbox=document.getElementById('chatbox'), chatIn=document.getElementById('chatIn'), sndBtn=document.getElementById('snd');
var G=0, FLOOR=H-140, GRAV=0.55, keys={}, t=0, sfx=true, koin=0, rekor=0;
try{ koin=+localStorage.getItem('np_koin_'+D.taman)||0; rekor=+localStorage.getItem('np_rekor')||0; }catch(e){}
koinEl.textContent=koin;
/* ---------- audio bip sederhana ---------- */
var AC=null; function bip(f,d,tp){ if(!sfx) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); var o=AC.createOscillator(), g=AC.createGain(); o.type=tp||'square'; o.frequency.value=f; g.gain.value=.05; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d); o.stop(AC.currentTime+d);}catch(e){} }
function say(s){ toast.textContent=s; toast.className='toast on'; clearTimeout(say.t); say.t=setTimeout(function(){toast.className='toast';},1400); }
/* ---------- dunia ---------- */
var CAMX=0, WORLD=2400;
var plats=[{x:0,y:FLOOR,w:WORLD,h:140,tanah:true}];
var seed=1; function rnd(){ seed=(seed*9301+49297)%233280; return seed/233280; }
seed=D.seed||7;
for(var i=0;i<9;i++){ plats.push({x:180+i*250+rnd()*80,y:FLOOR-80-rnd()*130,w:120+rnd()*120,h:22}); }
var koins=[]; for(var k=0;k<26;k++){ koins.push({x:60+rnd()*(WORLD-120),y:FLOOR-40-rnd()*250,r:8,hidup:true,ang:rnd()*6}); }
var pohon=[]; for(var p=0;p<14;p++){ pohon.push({x:rnd()*WORLD,s:.7+rnd()*.7}); }
var torii=[{x:900},{x:2100}], papan=[{x:120,t:'→ NEKO PARK'},{x:1500,t:'← SAKURA'}];
/* ---------- kucing ---------- */
function Kucing(nama,x,warna,bot){ this.nama=nama; this.x=x; this.y=FLOOR; this.vx=0; this.vy=0; this.dir=1; this.tanah=true; this.warna=warna||'#f5c542'; this.bot=bot; this.hp=3; this.emote=''; this.emoteT=0; this.chat=''; this.chatT=0; this.jalan=0; this.stun=0; this.item='bom'; this.skor=0; this.aiT=60+Math.random()*120; this.aiDir=1; }
var me=new Kucing(D.nama,220,'#f5c542',false), others=[];
var WARNA=['#f0a35e','#ffd166','#f7b267','#f4d35e','#e9a86b','#fcbf49'];
D.pemain.forEach(function(n,i){ others.push(new Kucing(n,400+i*230+Math.random()*120,WARNA[i%WARNA.length],true)); });
plrEl.textContent=1+others.length;
var bomList=[], partikel=[], teksMelayang=[];
/* ---------- fisika ---------- */
function fisika(c){
  c.vy+=GRAV; c.x+=c.vx; c.y+=c.vy; c.tanah=false;
  if(c.x<20){c.x=20;c.vx=0;} if(c.x>WORLD-20){c.x=WORLD-20;c.vx=0;}
  for(var i=0;i<plats.length;i++){ var p=plats[i]; if(c.vy>=0 && c.x>p.x-6 && c.x<p.x+p.w+6 && c.y>=p.y && c.y-c.vy<=p.y+2){ c.y=p.y; c.vy=0; c.tanah=true; } }
  if(c.vx!==0) c.jalan+=Math.abs(c.vx)*.25; c.vx*=c.tanah?0.78:0.94; if(Math.abs(c.vx)<.05)c.vx=0;
  if(c.emoteT>0)c.emoteT--; else c.emote=''; if(c.chatT>0)c.chatT--; else c.chat=''; if(c.stun>0)c.stun--;
}
function lompat(c){ if(c.tanah && c.stun<=0){ c.vy=-11.5; c.tanah=false; bip(520,.08,'triangle'); } }
var dashT=0, lastTap=0;
function gerak(c,d){ if(c.stun>0) return; c.dir=d; c.vx+=d*(c.tanah?1.1:0.7); if(c.vx>5)c.vx=5; if(c.vx<-5)c.vx=-5; }
var jarakMode=1; /* 1 jauh, 0 dekat */
function pakai(c){
  if(c.stun>0) return;
  if(c.item==='bom'){ var kuat=jarakMode?11:6; bomList.push({x:c.x+c.dir*18,y:c.y-40,vx:c.dir*kuat+c.vx*.5,vy:-(jarakMode?8:5),owner:c,t:0,fuse:70}); bip(300,.1); if(!c.bot) say(jarakMode?'💣 lempar JAUH':'💣 lempar DEKAT'); }
  else if(c.item==='tinju'){ var kena=false; semua().forEach(function(o){ if(o!==c && Math.abs(o.x-c.x)<48 && Math.abs(o.y-c.y)<40){ o.vx=c.dir*9; o.vy=-6; o.stun=30; kena=true; teks(o.x,o.y-70,'POW!','#ff5f7a'); if(!c.bot){tambahKoin(1);} } }); c.emote='🥊'; c.emoteT=25; bip(kena?180:120,.12,'sawtooth'); if(!c.bot) say(kena?'🥊 HOME-RUN!':'🥊 tinju angin'); }
  else if(c.item==='pancing'){ var target=null,best=99999; semua().forEach(function(o){ if(o!==c){ var d=Math.abs(o.x-c.x); if(d<260 && d<best && (o.x-c.x)*c.dir>0){best=d;target=o;} } }); if(target){ target.vx=-(target.x-c.x)*.12; target.vy=-5; target.stun=25; teks(target.x,target.y-70,'🎣 KETARIK','#8ad6ff'); if(!c.bot){tambahKoin(1); say('🎣 nangkep '+target.nama);} } else if(!c.bot) say('🎣 tidak ada yang kena'); c.emote='🎣'; c.emoteT=25; bip(700,.08,'sine'); }
}
function semua(){ return [me].concat(others); }
function teks(x,y,s,c){ teksMelayang.push({x:x,y:y,s:s,c:c||'#fff',t:60}); }
function tambahKoin(n){ if(window.__lock&&n>0) window.__lock.rekor(koin+n); return tambahKoin0(n); }
function tambahKoin0(n){ koin+=n; koinEl.textContent=koin; try{localStorage.setItem('np_koin_'+D.taman,koin); if(koin>rekor){rekor=koin;localStorage.setItem('np_rekor',rekor);} }catch(e){} }
function ledak(b){
  for(var i=0;i<18;i++) partikel.push({x:b.x,y:b.y,vx:(Math.random()-.5)*9,vy:(Math.random()-.8)*9,t:30+Math.random()*20,c:['#ff7b54','#ffd84a','#fff','#ff4d6d'][i%4]});
  bip(90,.25,'sawtooth');
  semua().forEach(function(o){ var d=Math.hypot(o.x-b.x,o.y-30-b.y); if(d<75){ o.vx=(o.x-b.x)/Math.max(8,d)*10; o.vy=-8; o.stun=35; if(o!==b.owner){ if(b.owner===me){ tambahKoin(2); teks(o.x,o.y-70,'+2 KOIN','#ffd84a'); } if(o===me){ me.hp=Math.max(0,me.hp-1); teks(me.x,me.y-70,'-1 ❤','#ff5f7a'); if(me.hp===0){ say('💀 kalah… hati pulih'); me.hp=3; koin=Math.max(0,koin-3); koinEl.textContent=koin; } } o.emote=o===me?'😵':'😡'; o.emoteT=40; } } });
}
/* ---------- AI pemain lain ---------- */
var CHATS=['halo '+D.nama+'!','wkwk kena','awas bom!','koin dimana?','mental!','gas lompat','siapa ini','😂😂','jangan lempar aku','ngopi dulu'];
function ai(c){
  c.aiT--; if(c.aiT<=0){ c.aiT=50+Math.random()*140; var r=Math.random(); if(r<.35) c.aiDir=Math.random()<.5?-1:1; else if(r<.5) c.aiDir=0; else if(r<.62){ c.emote=['👋','😂','😡','🎉','✨','❤️'][Math.floor(Math.random()*6)]; c.emoteT=60; } else if(r<.74){ c.chat=CHATS[Math.floor(Math.random()*CHATS.length)]; c.chatT=120; } else if(r<.62+.28*(c.agresif||1)/1 && Math.abs(me.x-c.x)<420){ c.dir=me.x>c.x?1:-1; c.item=Math.random()<.7?'bom':(Math.random()<.5?'tinju':'pancing'); jarakMode=Math.abs(me.x-c.x)>200?1:0; pakai(c); } else { lompat(c); } }
  if(c.aiDir) gerak(c,c.aiDir); if(Math.random()<.01) lompat(c);
  /* koin */
  koins.forEach(function(k){ if(k.hidup && Math.abs(k.x-c.x)<16 && Math.abs(k.y-(c.y-24))<26){ k.hidup=false; c.skor++; setTimeout(function(){k.hidup=true;k.x=60+Math.random()*(WORLD-120);},6000); } });
}
/* ---------- gambar ---------- */
function gbrKucing(c){
  var x=c.x-CAMX, y=c.y; ctx.save(); ctx.translate(x,y); if(c.dir<0) ctx.scale(-1,1);
  var bob=c.vx!==0&&c.tanah?Math.sin(c.jalan)*3:0;
  ctx.fillStyle=c.warna; ctx.beginPath(); ctx.ellipse(0,-20+bob*.3,17,15,0,0,7); ctx.fill(); /* badan */
  ctx.beginPath(); ctx.arc(0,-42+bob*.3,14,0,7); ctx.fill(); /* kepala */
  ctx.beginPath(); ctx.moveTo(-12,-50); ctx.lineTo(-9,-62); ctx.lineTo(-3,-52); ctx.fill(); ctx.beginPath(); ctx.moveTo(12,-50); ctx.lineTo(9,-62); ctx.lineTo(3,-52); ctx.fill(); /* telinga */
  ctx.fillStyle='#e0862e'; ctx.beginPath(); ctx.arc(-6,-24,5,0,7); ctx.arc(7,-14,4,0,7); ctx.fill(); /* belang */
  ctx.strokeStyle=c.warna; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-14,-14); ctx.quadraticCurveTo(-30,-10+Math.sin(t*.1)*6,-28,-30); ctx.stroke(); /* ekor */
  ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(-4,-44,1.8,0,7); ctx.arc(5,-44,1.8,0,7); ctx.fill(); ctx.fillStyle='#e06'; ctx.beginPath(); ctx.arc(1,-39,1.6,0,7); ctx.fill();
  ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-12,-40); ctx.lineTo(-4,-39); ctx.moveTo(4,-39); ctx.lineTo(12,-40); ctx.stroke();
  /* kaki */
  ctx.fillStyle=c.warna; var s=Math.sin(c.jalan)*5*(c.vx!==0&&c.tanah?1:0); ctx.fillRect(-11,-8,7,9+s*.4); ctx.fillRect(4,-8,7,9-s*.4);
  /* item di tangan */
  ctx.font='14px serif'; ctx.textAlign='center'; if(c.stun>0){ ctx.fillText('💫',0,-66); }
  ctx.restore();
  /* label nama */
  ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; var w=ctx.measureText(c.nama).width+10; ctx.fillStyle=c===me?'rgba(120,80,200,.85)':'rgba(160,120,60,.85)'; ctx.fillRect(x-w/2,y-84,w,14); ctx.fillStyle='#fff'; ctx.fillText(c.nama,x,y-73);
  /* hati */
  if(c===me){ ctx.font='9px serif'; ctx.fillText('❤️'.repeat(c.hp)+'🖤'.repeat(3-c.hp),x,y-90); }
  if(c.emote){ ctx.font='22px serif'; ctx.fillText(c.emote,x,y-100); }
  if(c.chat){ ctx.font='11px sans-serif'; var cw=ctx.measureText(c.chat).width+14; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.roundRect(x-cw/2,y-128,cw,20,8); ctx.fill(); ctx.fillStyle='#222'; ctx.fillText(c.chat,x,y-114); }
}
function gbrLatar(){
  var g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#f7c5dc'); g.addColorStop(.55,'#f2b8d3'); g.addColorStop(1,'#e9a9c8'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,240,180,.9)'; ctx.beginPath(); ctx.arc(W-90,110,42,0,7); ctx.fill(); ctx.fillStyle='rgba(255,240,180,.25)'; ctx.beginPath(); ctx.arc(W-90,110,64,0,7); ctx.fill();
  /* kelopak sakura */
  for(var i=0;i<18;i++){ var px=((i*173+t*.6+i*i)%(W+40))-20, py=((i*97+t*(.9+i%3*.3))%(H)); ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(px,py,4,2.5,i+t*.02,0,7); ctx.fill(); }
  /* bukit ungu jauh + bergerigi */
  ctx.fillStyle='#b48bd6'; ctx.beginPath(); ctx.moveTo(0,H*.55); for(var x=0;x<=W;x+=8){ ctx.lineTo(x,H*.49-Math.sin((x+CAMX*.2)*.006)*40-Math.cos((x+CAMX*.2)*.013)*18); } ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
  ctx.fillStyle='#e8def2'; for(var x2=0;x2<=W;x2+=22){ var yy=H*.49-Math.sin((x2+CAMX*.2)*.006)*40-Math.cos((x2+CAMX*.2)*.013)*18; ctx.beginPath(); ctx.moveTo(x2-8,yy+3); ctx.lineTo(x2,yy-12); ctx.lineTo(x2+8,yy+3); ctx.fill(); }
  ctx.fillStyle='#9d7bc9'; ctx.beginPath(); ctx.moveTo(0,H*.66); for(var x3=0;x3<=W;x3+=8){ ctx.lineTo(x3,H*.62-Math.sin((x3+CAMX*.45)*.009+2)*30); } ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
  /* pohon sakura */
  pohon.forEach(function(p){ var x=p.x-CAMX*.7; if(x<-80||x>W+80) return; var s=p.s; ctx.fillStyle='#6b4b3a'; ctx.fillRect(x-4*s,FLOOR-70*s,8*s,70*s); ctx.fillStyle='#f6a5c9'; ctx.beginPath(); ctx.arc(x,FLOOR-85*s,32*s,0,7); ctx.arc(x-22*s,FLOOR-70*s,22*s,0,7); ctx.arc(x+22*s,FLOOR-72*s,24*s,0,7); ctx.fill(); ctx.fillStyle='#ffd0e4'; ctx.beginPath(); ctx.arc(x-8*s,FLOOR-96*s,12*s,0,7); ctx.fill(); });
  /* rumput */
  ctx.fillStyle='#a8d98a'; ctx.fillRect(0,FLOOR-30,W,30); ctx.fillStyle='#8cc96a'; for(var r=0;r<W;r+=9){ var hh=6+((r*7+(CAMX|0))%11); ctx.fillRect(r,FLOOR-30-hh,2,hh); }
  ctx.fillStyle='#6fb54f'; ctx.fillRect(0,FLOOR-4,W,4);
  /* tanah kayu */
  ctx.fillStyle='#8a5a3a'; ctx.fillRect(0,FLOOR,W,H-FLOOR); ctx.strokeStyle='#6b4327'; ctx.lineWidth=2; for(var b=0;b<H-FLOOR;b+=24){ ctx.beginPath(); ctx.moveTo(0,FLOOR+b); ctx.lineTo(W,FLOOR+b); ctx.stroke(); for(var q=((b/24)%2)*40-((CAMX|0)%80);q<W;q+=80){ ctx.beginPath(); ctx.moveTo(q,FLOOR+b); ctx.lineTo(q,FLOOR+b+24); ctx.stroke(); } }
  /* tembok batu kiri (awal taman) */
  var tx=0-CAMX; if(tx>-60){ ctx.fillStyle='#9ea3ad'; ctx.fillRect(tx-60,0,60,FLOOR); ctx.strokeStyle='#6e737d'; for(var by=0;by<FLOOR;by+=40){ ctx.strokeRect(tx-60,by,60,40); } }
}
function gbrDunia(){
  papan.forEach(function(p){ var x=p.x-CAMX; if(x<-120||x>W+120) return; ctx.fillStyle='#8a5a3a'; ctx.fillRect(x-3,FLOOR-70,6,70); ctx.fillStyle='#c9a06a'; ctx.fillRect(x-48,FLOOR-92,96,26); ctx.strokeStyle='#6b4327'; ctx.strokeRect(x-48,FLOOR-92,96,26); ctx.fillStyle='#3a2a1a'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.t,x,FLOOR-75); });
  torii.forEach(function(g){ var x=g.x-CAMX; if(x<-120||x>W+120) return; ctx.fillStyle='#d8323a'; ctx.fillRect(x-40,FLOOR-150,10,150); ctx.fillRect(x+30,FLOOR-150,10,150); ctx.fillRect(x-56,FLOOR-160,112,12); ctx.fillRect(x-46,FLOOR-135,92,8); ctx.fillStyle='#222'; ctx.fillRect(x-60,FLOOR-168,120,8); });
  plats.forEach(function(p){ if(p.tanah) return; var x=p.x-CAMX; if(x+p.w<0||x>W) return; ctx.fillStyle='#8cc96a'; ctx.fillRect(x,p.y-6,p.w,8); ctx.fillStyle='#8a5a3a'; ctx.fillRect(x,p.y+2,p.w,p.h-2); ctx.strokeStyle='#6b4327'; for(var q=x;q<x+p.w;q+=30){ ctx.beginPath(); ctx.moveTo(q,p.y+2); ctx.lineTo(q,p.y+p.h); ctx.stroke(); } });
  koins.forEach(function(k){ if(!k.hidup) return; var x=k.x-CAMX; if(x<-20||x>W+20) return; k.ang+=.08; var w=Math.abs(Math.cos(k.ang))*8+1; ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.ellipse(x,k.y+Math.sin(k.ang)*3,w,9,0,0,7); ctx.fill(); ctx.strokeStyle='#d9a400'; ctx.lineWidth=2; ctx.stroke(); });
  bomList.forEach(function(b){ var x=b.x-CAMX; ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(x,b.y,8,0,7); ctx.fill(); ctx.strokeStyle='#c96'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+4,b.y-7); ctx.lineTo(x+9,b.y-13); ctx.stroke(); if(b.t%8<4){ ctx.fillStyle='#ffb347'; ctx.beginPath(); ctx.arc(x+9,b.y-13,3,0,7); ctx.fill(); } });
  partikel.forEach(function(p){ ctx.globalAlpha=Math.max(0,p.t/40); ctx.fillStyle=p.c; ctx.fillRect(p.x-CAMX-3,p.y-3,6,6); }); ctx.globalAlpha=1;
  teksMelayang.forEach(function(f){ ctx.globalAlpha=Math.min(1,f.t/20); ctx.font='bold 14px sans-serif'; ctx.textAlign='center'; ctx.fillStyle=f.c; ctx.fillText(f.s,f.x-CAMX,f.y); }); ctx.globalAlpha=1;
}
function gbrHUD(){
  /* bendera jarak pemain lain di kanan */
  var list=others.slice().sort(function(a,b){return Math.abs(a.x-me.x)-Math.abs(b.x-me.x);}).slice(0,5);
  list.forEach(function(o,i){ var dx=o.x-me.x, y=300+i*50; var d=Math.round(Math.abs(dx)/10); var arah=dx>=0?1:-1; var bx=arah>0?W-14:14; ctx.fillStyle='#f5b26b'; ctx.beginPath(); if(arah>0){ ctx.moveTo(bx-30,y-14); ctx.lineTo(bx,y-4); ctx.lineTo(bx-30,y+6);} else { ctx.moveTo(bx+30,y-14); ctx.lineTo(bx,y-4); ctx.lineTo(bx+30,y+6);} ctx.fill(); ctx.fillStyle='rgba(70,50,30,.85)'; var lab=o.nama+' · '+d+'m'; ctx.font='bold 10px sans-serif'; var w=ctx.measureText(lab).width+10; var lx=arah>0?bx-w-4:bx+4; ctx.fillRect(lx,y+8,w,15); ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText(lab,lx+5,y+19); });
  /* minimap */
  ctx.fillStyle='rgba(60,50,60,.75)'; ctx.beginPath(); ctx.roundRect(W-140,12,128,18,6); ctx.fill(); ctx.fillStyle='#ffd84a'; ctx.beginPath(); ctx.arc(W-136+me.x/WORLD*120,21,4,0,7); ctx.fill(); ctx.fillStyle='#9fd3ff'; others.forEach(function(o){ ctx.beginPath(); ctx.arc(W-136+o.x/WORLD*120,21,2.5,0,7); ctx.fill(); });
  ctx.font='bold 9px sans-serif'; ctx.textAlign='left'; ctx.fillStyle='rgba(60,50,60,.7)'; ctx.fillText('GLOBAL ('+(others.length+1)+'/50) · '+D.taman,10,H-8); ctx.textAlign='right'; ctx.fillText('KOIN '+koin+' · REKOR '+rekor,W-10,H-8);
  if(t<200){ ctx.globalAlpha=Math.max(0,1-Math.max(0,t-120)/80); ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#e0568a'; ctx.fillText('MENTAL!',W/2,170); ctx.font='bold 11px sans-serif'; ctx.fillStyle='#7a4dff'; ctx.fillText('lempar bom ke pemain lain · kumpulkan koin',W/2,190); ctx.globalAlpha=1; }
}
/* ---------- loop ---------- */
function update(){
  t++;
  if(keys.l) gerak(me,-1); if(keys.r) gerak(me,1);
  fisika(me); others.forEach(function(o){ ai(o); fisika(o); });
  koins.forEach(function(k){ if(k.hidup && Math.abs(k.x-me.x)<18 && Math.abs(k.y-(me.y-24))<28){ k.hidup=false; tambahKoin(1); teks(k.x,k.y-10,'+1','#ffd84a'); bip(900,.07,'sine'); setTimeout(function(){k.hidup=true;k.x=60+Math.random()*(WORLD-120);k.y=FLOOR-40-Math.random()*250;},5000); } });
  for(var i=bomList.length-1;i>=0;i--){ var b=bomList[i]; b.vy+=GRAV; b.x+=b.vx; b.y+=b.vy; b.t++; if(b.y>=FLOOR-8){ b.y=FLOOR-8; b.vy=-b.vy*.35; b.vx*=.7; } var kena=false; semua().forEach(function(o){ if(o!==b.owner && b.t>6 && Math.abs(o.x-b.x)<16 && b.y>o.y-56 && b.y<o.y) kena=true; }); if(kena||b.t>b.fuse){ ledak(b); bomList.splice(i,1); } }
  for(var j=partikel.length-1;j>=0;j--){ var p=partikel[j]; p.vy+=.3; p.x+=p.vx; p.y+=p.vy; p.t--; if(p.t<=0) partikel.splice(j,1); }
  for(var q=teksMelayang.length-1;q>=0;q--){ var f=teksMelayang[q]; f.y-=.8; f.t--; if(f.t<=0) teksMelayang.splice(q,1); }
  var target=me.x-W/2; CAMX+=(target-CAMX)*.12; if(CAMX<0)CAMX=0; if(CAMX>WORLD-W)CAMX=WORLD-W;
}
function draw(){ gbrLatar(); gbrDunia(); others.forEach(gbrKucing); gbrKucing(me); gbrHUD(); }
function loop(){ update(); draw(); requestAnimationFrame(loop); }
/* ---------- kontrol ---------- */
function hold(id,k){ var el=document.getElementById(id); function dn(e){ e.preventDefault(); keys[k]=true; el.classList.add('dn'); var now=Date.now(); if(now-lastTap<260 && k!=='x'){ me.vx=(k==='l'?-1:1)*12; teks(me.x,me.y-60,'DASH','#7a4dff'); } lastTap=now; } function up(e){ keys[k]=false; el.classList.remove('dn'); } el.addEventListener('touchstart',dn,{passive:false}); el.addEventListener('touchend',up); el.addEventListener('touchcancel',up); el.addEventListener('mousedown',dn); el.addEventListener('mouseup',up); el.addEventListener('mouseleave',up); }
hold('kiri','l'); hold('kanan','r');
function tap(id,fn){ var el=document.getElementById(id); el.addEventListener('touchstart',function(e){e.preventDefault();fn();},{passive:false}); el.addEventListener('click',function(e){ if(e.detail===0) return; fn(); }); }
tap('lompat',function(){ lompat(me); });
tap('pakai',function(){ pakai(me); });
tap('jauh',function(){ jarakMode=1; say('▲ lempar JAUH'); document.getElementById('jauh').classList.add('dn'); document.getElementById('dekat').classList.remove('dn'); });
tap('dekat',function(){ jarakMode=0; say('▼ lempar DEKAT'); document.getElementById('dekat').classList.add('dn'); document.getElementById('jauh').classList.remove('dn'); });
document.querySelectorAll('.emo .b').forEach(function(b){ tap(b.id,function(){ me.emote=b.textContent; me.emoteT=70; bip(660,.06,'sine'); if(b.textContent==='🎉') tambahKoin(0); }); });
document.querySelectorAll('.itm .b').forEach(function(b){ tap(b.id,function(){ document.querySelectorAll('.itm .b').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel'); me.item=b.getAttribute('data-item'); document.getElementById('pakaiL').textContent={bom:'PAKAI BOM',tinju:'PAKAI TINJU',pancing:'PAKAI PANCING'}[me.item]; document.getElementById('pakaiI').textContent={bom:'💣',tinju:'🥊',pancing:'🎣'}[me.item]; }); });
tap('chatBtn',function(){ chatbox.classList.toggle('on'); if(chatbox.classList.contains('on')) chatIn.focus(); });
document.getElementById('kirim').onclick=function(){ var v=chatIn.value.trim(); if(!v) return; me.chat=v.slice(0,40); me.chatT=180; chatIn.value=''; chatbox.classList.remove('on'); others.forEach(function(o){ if(Math.random()<.4){ setTimeout(function(){ o.chat=CHATS[Math.floor(Math.random()*CHATS.length)]; o.chatT=120; },800+Math.random()*2000); } }); };
chatIn.onkeydown=function(e){ if(e.key==='Enter') document.getElementById('kirim').onclick(); };
tap('snd',function(){ sfx=!sfx; sndBtn.textContent=sfx?'🔊':'🔇'; });
tap('keluar',function(){ say('👋 sampai jumpa di '+D.taman+' · koin tersimpan'); me.emote='👋'; me.emoteT=80; });
document.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft')keys.l=true; if(e.key==='ArrowRight')keys.r=true; if(e.key==='ArrowUp'||e.key===' ')lompat(me); if(e.key==='ArrowDown'||e.key==='x')pakai(me); });
document.addEventListener('keyup',function(e){ if(e.key==='ArrowLeft')keys.l=false; if(e.key==='ArrowRight')keys.r=false; });
draw();
var mulaiSudah=false; window.__mulai=function(lv){ if(mulaiSudah) return; mulaiSudah=true; D.lv=lv; others.forEach(function(o){ o.agresif=[0.4,1,1.8][lv]||1; }); bip(880,.08,'sine'); loop(); };
})();
`

/**
 * @param {string} brand
 * @param {object} d { nama, pemain:[nama...], taman, seed }
 */
export function nekoParkHtml (brand, d = {}) {
  const pemain = (d.pemain || []).filter(Boolean).slice(0, 6)
  const data = { nama: String(d.nama || 'kamu').slice(0, 14), pemain: pemain.length ? pemain.map(n => String(n).slice(0, 12)) : ['nekuy', 'Monyet', 'aaahaiii', 'yanto', 'te ff'], taman: String(d.taman || 'GLOBAL').slice(0, 16), seed: Number(d.seed) || 7 }
  const L = lockScreen({ id: 'nekopark', judul: 'NEKO PARK', sub: 'SAKURA ONLINE · ' + data.taman, warna: { a: '#7a4dff', b: '#e0568a' }, brand,
    ikonSvg: '<svg viewBox="0 0 64 64"><path d="M12 30 8 10l16 10h16l16-10-4 20c2 4 4 8 4 14 0 10-10 16-24 16S8 54 8 44c0-6 2-10 4-14z" fill="#ffd166"/><circle cx="24" cy="38" r="3" fill="#333"/><circle cx="40" cy="38" r="3" fill="#333"/><path d="M28 46h8l-4 4z" fill="#e0568a"/><path d="M14 44h8M42 44h8" stroke="#333" stroke-width="2"/></svg>',
    deskripsi: 'Taman kucing bergaya online. Lempar bom ke kucing lain untuk koin, kumpulkan koin kuning, kirim emote & chat. Pemain lain di taman ini: ' + data.pemain.join(', ') + '.',
    kontrol: [['◀▶', 'jalan · 2× tap dash'], ['⤒', 'LOMPAT'], ['💣', 'bom (▲ jauh / ▼ dekat)'], ['🥊🎣', 'home-run · pancing'], ['😂', 'emote di atas kepala'], ['💬', 'chat global']],
    level: ['Santai', 'Normal', 'Rusuh'], rekorKey: 'np_lk', wrap: '.np' })
  return '<style>' + CSS + L.css + '</style>' + L.html +
    '<div class="np">' +
      `<div class="hud"><div class="lg"><b>NEKO<br>PARK</b><small>SAKURA<br>ONLINE · v18</small></div>` +
        `<div class="r"><div class="p"><small>KOIN</small><span id="koin">0</span></div><div class="p"><small>PLR</small><span id="plr">1</span></div><div class="p ic" id="chatBtn">💬</div><div class="p ic" id="snd">🔊</div><div class="p ic" id="keluar">🚪</div></div></div>` +
      '<div class="stage"><canvas id="cv"></canvas><div class="toast" id="toast"></div><div class="chatbox" id="chatbox"><input id="chatIn" maxlength="40" placeholder="chat global…"><button id="kirim">Kirim</button></div></div>' +
      '<div class="ctl"><div class="b arw" id="kiri">◀</div><div class="b arw kanan" id="kanan">▶</div>' +
        '<div><div class="emo"><div class="b" id="e1">👋</div><div class="b" id="e2">❤️</div><div class="b" id="e3">😂</div><div class="b" id="e4">😡</div><div class="b" id="e5">🎉</div><div class="b" id="e6">✨</div></div>' +
        '<div class="itm"><div class="b sel" id="i1" data-item="bom">💣<i>∞</i></div><div class="b" id="i2" data-item="tinju">🥊</div><div class="b" id="i3" data-item="pancing">🎣</div></div></div></div>' +
      '<div class="row2"><div class="b jd" id="jauh"><b>▲</b>JAUH</div><div class="b jd" id="dekat"><b>▼</b>DEKAT</div><div class="b big bom" id="pakai"><b id="pakaiI">💣</b><span id="pakaiL">PAKAI BOM</span></div><div class="b big lompat" id="lompat"><b>⤒</b>LOMPAT</div></div>' +
      `<div class="hint">💬 chat global · ▲▼ jarak lempar · 🎣 balik nangkep · 🥊 home-run · 🟡 pop=koin · 2x tap=dash<br><b>${esc(brand)}</b> · pemain lain: ${esc(data.pemain.join(', '))}</div>` +
    '</div>' +
    '<script>' + L.js + 'var __NP=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { nekoParkHtml }
