/**
 * lib/htmlgames15.js — GAME CERITA BER-EPISODE (v7.18.0)
 * ------------------------------------------------------------------
 *  Kerangka umum untuk 10 game story di lib/htmlgames15games.js:
 *   • splash → prolog episode (ketik-ketik) → MENU (UI khas tiap game)
 *   • pengaturan: musik, sfx, getar, kecepatan, ukuran tombol, tangan kiri
 *   • BACKSOUND prosedural WebAudio berbeda tiap game (G.bgm)
 *   • dialog dalam game, jeda, epilog + KODE EPISODE (ep<n>-<hash>)
 *   • kode dikirim user ke chat → server membuka episode berikutnya
 *  Data disuntik server: var __EP = { ep, max, nonce }
 */
import { GAMES } from './htmlgames15games.js'

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS_BASE = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{color:#fff;overflow-x:hidden;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:600px;margin:0 auto;padding:8px 8px 14px;position:relative}
.frame{position:relative;border-radius:18px;overflow:hidden;height:0;padding-bottom:var(--ratio,125%);background:#000}
.frame>canvas,.frame>.lay{position:absolute;left:0;top:0;width:100%;height:100%}
canvas{display:block;touch-action:none}
.lay{overflow:visible;display:block}.frame.m{height:auto;padding-bottom:0;min-height:420px}.frame.m canvas,.frame.m .toast{display:none}.frame.m .lay{position:relative;height:auto;min-height:420px}
.lay.hid{display:none}
.hud{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.hud .lg b{display:block;font-size:17px;font-weight:900;letter-spacing:1.5px;line-height:1;white-space:nowrap}.hud .lg small{display:block;font-size:9px;letter-spacing:3px;opacity:.7;margin-top:3px}
.hud .r{display:flex;gap:6px}.hud .p{border-radius:12px;min-width:50px;height:46px;padding:0 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}.hud .p small{font-size:8px;letter-spacing:1.5px;opacity:.75;font-weight:800}
.hud .ps{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-weight:900}
.toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);background:rgba(0,0,0,.65);color:#fff;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;opacity:0;transition:opacity .2s;white-space:nowrap;pointer-events:none;z-index:3}.toast.on{opacity:1}
.dlg{position:absolute;left:10px;right:10px;bottom:10px;background:rgba(0,0,0,.88);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.55;display:none;z-index:3;color:#fff}.dlg.on{display:block}.dlg b.j{display:block;font-size:11px;letter-spacing:2px;margin-bottom:4px;opacity:.9}.dlg .nx{text-align:right;font-size:11px;opacity:.7;margin-top:6px}
.dlg .opts{display:grid;gap:6px;margin-top:8px}.dlg .opts div{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:9px 12px}
.ctl{margin-top:10px}
.k{border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
.k:active,.k.dn{transform:translateY(3px);filter:brightness(1.2)}
.ctl.big .k{height:78px!important;font-size:19px}.ctl.small .k{height:52px!important;font-size:14px}
.ctl.left{flex-direction:row-reverse}
.pad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:4px}.pad .k{border-radius:12px}.pad .x{visibility:hidden}
.hint{text-align:center;font-size:11px;opacity:.7;margin-top:10px;line-height:1.5}
/* layar umum (cerita / pengaturan / cara main / epilog) — diberi warna oleh tema game lewat var */
.S{min-height:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px 16px}
.S .box{width:100%;max-width:440px;text-align:left;font-size:15px;line-height:1.7;background:var(--box,rgba(0,0,0,.45));border:1px solid var(--line,rgba(255,255,255,.25));border-radius:14px;padding:16px 18px;min-height:120px;color:var(--ink,#fff)}
.S .box b{color:var(--acc,#ffd84a)}
.S .ttl{font-size:11px;letter-spacing:4px;opacity:.8;margin-bottom:8px;font-weight:900;color:var(--acc,#ffd84a)}
.S .row{display:flex;gap:10px;margin-top:14px;width:100%;max-width:440px}
.S .b{flex:1;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;letter-spacing:1px;font-size:14px;background:var(--acc,#ffd84a);color:var(--accink,#000);white-space:nowrap}
.S .b.sec{background:rgba(255,255,255,.12);color:var(--ink,#fff);border:1px solid var(--line,rgba(255,255,255,.3))}
.S .set{width:100%;max-width:420px;text-align:left}
.S .set .it{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.07);border:1px solid var(--line,rgba(255,255,255,.15));border-radius:12px;padding:9px 12px;margin-bottom:7px;font-size:13px;font-weight:700;color:var(--ink,#fff)}
.S .set .v{display:flex;gap:5px}.S .set .v span{min-width:38px;height:32px;padding:0 9px;border-radius:9px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:12px}.S .set .v span.on{background:var(--acc,#ffd84a);color:var(--accink,#000)}
.S .how{width:100%;max-width:420px;text-align:left;font-size:13px;line-height:1.55;color:var(--ink,#fff)}.S .how div{display:flex;gap:10px;background:rgba(255,255,255,.07);border-radius:10px;padding:8px 12px;margin-bottom:6px}.S .how b{min-width:34px;color:var(--acc,#ffd84a)}
.S .kode{margin-top:12px;background:#000;color:#fff;border:2px dashed var(--acc,#ffd84a);border-radius:14px;padding:12px 16px;text-align:center;width:100%;max-width:440px}
.S .kode b{display:block;font-size:30px;letter-spacing:4px;font-family:monospace;color:var(--acc,#ffd84a)}
.S .kode small{display:block;font-size:11px;opacity:.85;line-height:1.5;margin-top:4px}
.S .skor{font-size:12px;opacity:.85;margin-top:8px;color:var(--ink,#fff)}
`

/* ---------------- FRAMEWORK JS (berjalan di webview) ---------------- */
const FW_JS = String.raw`
var G=window.__G,EPD=window.__EP||{ep:1,max:1,nonce:''},I=function(id){return document.getElementById(id)},cv=I('cv'),ctx=cv.getContext('2d'),lay=I('lay');
var EP=Math.max(1,Math.min(G.eps.length,+EPD.ep||1)),MAXEP=Math.max(EP,+EPD.max||1);
var SET=(function(){var K='g15_'+G.id;var d={musik:1,suara:1,getar:1,cepat:1,tombol:1,kiri:0};try{Object.assign(d,JSON.parse(localStorage.getItem(K+'_set')||'{}'))}catch(e){}
 return{get:function(){return d},set:function(k,v){d[k]=v;try{localStorage.setItem(K+'_set',JSON.stringify(d))}catch(e){}terap()},rekor:function(v){var b=+(localStorage.getItem(K+'_rk')||0);if(v>b){b=v;try{localStorage.setItem(K+'_rk',v)}catch(e){}}return b},best:function(){try{return +(localStorage.getItem(K+'_rk')||0)}catch(e){return 0}}}})();
function terap(){var d=SET.get();var c=I('ctl');if(c){c.className='ctl'+(d.tombol===2?' big':d.tombol===0?' small':'')+(d.kiri?' left':'')}if(d.musik)bgmStart();else bgmStop()}
/* ---- audio ---- */
var AC=null;function ac(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC}
function bip(f,d,tp,v){if(!SET.get().suara)return;try{var A=ac();if(!A)return;var o=A.createOscillator(),g=A.createGain();o.type=tp||'square';o.frequency.value=f;g.gain.value=v||.05;o.connect(g);g.connect(A.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,A.currentTime+d);o.stop(A.currentTime+d)}catch(e){}}
function getar(ms){if(SET.get().getar&&navigator.vibrate)try{navigator.vibrate(ms)}catch(e){}}
/* ---- BACKSOUND prosedural: G.bgm = {bpm, wave, bwave, lead:[midi|0], bass:[midi|0], perc, vol, filt} ---- */
var BG={on:false,timer:null,step:0,next:0,gain:null,lp:null};
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function bgmStart(){var A=ac();if(!A||BG.on||!G.bgm)return;BG.on=true;BG.step=0;BG.next=A.currentTime+.05;BG.gain=A.createGain();BG.gain.gain.value=G.bgm.vol||.06;BG.lp=A.createBiquadFilter();BG.lp.type='lowpass';BG.lp.frequency.value=G.bgm.filt||2200;BG.lp.connect(BG.gain);BG.gain.connect(A.destination);BG.timer=setInterval(bgmTick,90)}
function bgmStop(){if(!BG.on)return;BG.on=false;clearInterval(BG.timer);try{BG.gain.gain.setTargetAtTime(0,AC.currentTime,.1)}catch(e){}}
function nota(f,t,d,wave,v,dest){var A=AC;var o=A.createOscillator(),g=A.createGain();o.type=wave;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(dest);o.start(t);o.stop(t+d+.02)}
function noise(t,d,v,hp){var A=AC;var n=A.createBufferSource(),b=A.createBuffer(1,A.sampleRate*d,A.sampleRate),dt=b.getChannelData(0);for(var i=0;i<dt.length;i++)dt[i]=(Math.random()*2-1)*(1-i/dt.length);n.buffer=b;var f=A.createBiquadFilter();f.type=hp?'highpass':'lowpass';f.frequency.value=hp?4000:400;var g=A.createGain();g.gain.value=v;n.connect(f);f.connect(g);g.connect(BG.gain);n.start(t)}
function bgmTick(){var A=AC,B=G.bgm,spb=60/B.bpm/4;while(BG.next<A.currentTime+.25){var s=BG.step;var L=B.lead[s%B.lead.length],Bs=B.bass[s%B.bass.length];var mul=paused?.35:1;
 if(L)nota(mtof(L),BG.next,spb*(B.len||1.2),B.wave||'square',.5*mul,BG.lp);
 if(Bs)nota(mtof(Bs),BG.next,spb*1.8,B.bwave||'triangle',.7*mul,BG.lp);
 if(B.perc){if(s%4===0)nota(60,BG.next,.12,'sine',.9*mul,BG.gain);if(s%4===2)noise(BG.next,.08,.25*mul,true);if(B.perc===2&&s%8===4)noise(BG.next,.25,.3*mul,false)}
 BG.next+=spb;BG.step++}}
/* ---- util ---- */
function say(s){var t=I('toast');t.textContent=s;t.className='toast on';clearTimeout(say.t);say.t=setTimeout(function(){t.className='toast'},1400)}
function tap(id,fn){var el=typeof id==='string'?I(id):id;if(!el)return;var lock=0;function h(e){if(e.type==='mousedown'&&Date.now()-lock<700)return;if(e.type==='touchstart')lock=Date.now();if(e.cancelable)e.preventDefault();fn(e)}el.addEventListener('touchstart',h,{passive:false});el.addEventListener('mousedown',h)}
function hold(id,dn,up){var el=I(id);if(!el)return;function d(e){if(e.cancelable)e.preventDefault();el.classList.add('dn');dn()}function u(){el.classList.remove('dn');up&&up()}el.addEventListener('touchstart',d,{passive:false});el.addEventListener('touchend',u);el.addEventListener('touchcancel',u);el.addEventListener('mousedown',d);el.addEventListener('mouseup',u);el.addEventListener('mouseleave',u)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function hash36(str){var h1=0xdeadbeef,h2=0x41c6ce57,i,ch;for(i=0;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36).slice(0,5)}
function kodeEp(n){return 'ep'+n+'-'+hash36(EPD.nonce+':'+G.id+':ep:'+n)}
function md(s){return String(s).replace(/\*(.*?)\*/g,'<b>$1</b>')}
/* ---- layar ---- */
var __frame=document.querySelector('.frame'),__ctl=I('ctl');function layar(html,cls){lay.className='lay '+(cls||'');lay.innerHTML=html;__frame.classList.add('m');if(__ctl)__ctl.style.display='none';try{window.scrollTo(0,0)}catch(e){}}
function sembunyi(){lay.className='lay hid';__frame.classList.remove('m');if(__ctl)__ctl.style.display=''}
function splash(){layar(G.splash,'menuwrap');var done=false;tap(lay,function(){if(done)return;done=true;ac();terap();bip(660,.1,'triangle');cerita('EPISODE '+EP+' — '+G.eps[EP-1].judul,G.eps[EP-1].intro,menu)})}
function cerita(judul,baris,lanjut){if(!baris||!baris.length)return lanjut();var i=0,ch=0,timer=null;layar('<div class="S"><div class="ttl">'+judul+'</div><div class="box" id="st"></div><div class="row"><div class="b sec" id="skip">LEWATI</div><div class="b" id="next">LANJUT ▸</div></div></div>','menuwrap');
 var st=I('st');function ketik(){var s=baris[i];if(ch<s.length){ch+=2;st.innerHTML=md(s.slice(0,ch));timer=setTimeout(ketik,16)}else st.innerHTML=md(s)}
 function maju(){clearTimeout(timer);if(ch<baris[i].length){ch=baris[i].length;ketik();return}i++;ch=0;if(i>=baris.length)return lanjut();ketik()}
 ketik();tap('next',maju);tap('skip',function(){clearTimeout(timer);lanjut()})}
function menu(){paused=false;window.__running=false;var S={ep:EP,max:MAXEP,eps:G.eps,best:SET.best(),judul:G.judul,sub:G.sub,ikon:G.ikon,brand:G.brand};layar(G.menuHtml(S),'menuwrap');
 tap('mPlay',function(){bip(520,.08);sembunyi();window.__mulai(EP)});tap('mSet',function(){pengaturan()});tap('mHow',caramain);tap('mStory',rekap);
 lay.querySelectorAll('[data-ep]').forEach(function(el){tap(el,function(){var n=+el.getAttribute('data-ep');if(n>MAXEP)return say('🔒 selesaikan Episode '+(n-1)+' dulu, lalu kirim kodenya ke chat');if(n!==EP)return say('buka Episode '+n+' lewat chat: '+G.cmd+' '+n);bip(520,.08);sembunyi();window.__mulai(EP)})})}
function rekap(){var h='';for(var i=0;i<EP;i++){var e=G.eps[i];h+='<div class="box" style="margin-bottom:8px;min-height:0"><div class="ttl">EPISODE '+(i+1)+' — '+e.judul+'</div>'+md(e.intro.join(' '))+(i<EP-1?'<br><br><i>'+md(e.outro.join(' '))+'</i>':'')+'</div>'}
 layar('<div class="S" style="justify-content:flex-start"><div class="ttl">CERITA SEJAUH INI</div>'+h+'<div class="row"><div class="b" id="back">◂ KEMBALI</div></div></div>','menuwrap');tap('back',menu)}
function pengaturan(dari){var d=SET.get();var SETK={'Musik latar':'musik','Efek suara':'suara','Getar':'getar','Kecepatan':'cepat','Ukuran tombol':'tombol','Tangan kiri':'kiri'};
 function opt(k,vals,labels){return '<div class="it"><span>'+k+'</span><div class="v">'+vals.map(function(v,i){return '<span data-k="'+k+'" data-v="'+v+'" class="'+(d[SETK[k]]===v?'on':'')+'">'+labels[i]+'</span>'}).join('')+'</div></div>'}
 layar('<div class="S"><div class="ttl">PENGATURAN</div><div class="set">'+opt('Musik latar',[1,0],['ON','OFF'])+opt('Efek suara',[1,0],['ON','OFF'])+opt('Getar',[1,0],['ON','OFF'])+opt('Kecepatan',[0,1,2],['Santai','Normal','Cepat'])+opt('Ukuran tombol',[0,1,2],['S','M','L'])+opt('Tangan kiri',[0,1],['Tidak','Ya'])+'</div><div class="row"><div class="b" id="back">✓ SELESAI</div></div></div>','menuwrap');
 lay.querySelectorAll('.set span[data-k]').forEach(function(el){tap(el,function(){SET.set(SETK[el.getAttribute('data-k')],+el.getAttribute('data-v'));bip(700,.05,'sine');pengaturan(dari)})});
 tap('back',typeof dari==='function'?dari:menu)}
function caramain(){layar('<div class="S"><div class="ttl">CARA MAIN</div><div class="how">'+G.how.map(function(h){return '<div><b>'+h[0]+'</b><span>'+h[1]+'</span></div>'}).join('')+'</div><div class="box" style="margin-top:10px;font-size:13px;min-height:0">'+G.tujuan+'<br><br>📖 Game ini punya <b>'+G.eps.length+' episode</b>. Tamatkan satu episode → muncul <b>KODE</b> → kirim kode itu ke chat → bot membuka episode berikutnya.</div><div class="row"><div class="b" id="back">◂ KEMBALI</div></div></div>','menuwrap');tap('back',menu)}
/* ---- dialog ---- */
var dq=[],dopen=false;function dialog(judul,teks,opts,cb){dq.push({j:judul,t:teks,o:opts,cb:cb});if(!dopen)nextDlg()}
function nextDlg(){var d=dq.shift(),el=I('dlg');if(!d){dopen=false;el.className='dlg';return}dopen=true;el.className='dlg on';var h='<b class="j">'+d.j+'</b>'+md(d.t);if(d.o)h+='<div class="opts">'+d.o.map(function(o,i){return '<div data-i="'+i+'">'+o.l+'</div>'}).join('')+'</div>';else h+='<div class="nx">ketuk untuk lanjut ▸</div>';el.innerHTML=h;
 if(d.o)el.querySelectorAll('.opts div').forEach(function(x){tap(x,function(e){e.stopPropagation();var o=d.o[+x.getAttribute('data-i')];dopen=false;el.className='dlg';o.f&&o.f();d.cb&&d.cb(o);if(!dopen)nextDlg()})});else tap(el,function(){dopen=false;el.className='dlg';d.cb&&d.cb();if(!dopen)nextDlg()})}
/* ---- jeda ---- */
var paused=false;tap('ps',function(){if(!window.__running)return;paused=!paused;if(paused){layar('<div class="S"><div class="ttl">JEDA</div><div class="row" style="flex-direction:column"><div class="b" id="pRes">▶ LANJUT</div><div class="b sec" id="pSet">⚙ PENGATURAN</div><div class="b sec" id="pMenu">☰ MENU UTAMA</div></div></div>','menuwrap');tap('pRes',function(){paused=false;sembunyi()});tap('pSet',function(){pengaturan(function(){paused=false;sembunyi()})});tap('pMenu',function(){paused=false;window.__running=false;menu()})}else sembunyi()});
/* ---- akhir episode ---- */
function tamat(menang,skor,catatan){window.__running=false;paused=false;var e=G.eps[EP-1];var best=SET.rekor(skor||0);
 if(!menang){layar('<div class="S"><div class="ttl">EPISODE '+EP+' — GAGAL</div><div class="box">'+md(catatan||e.gagal||'Belum berhasil kali ini.')+'</div><div class="skor">skor '+(skor||0)+' · rekor '+best+'</div><div class="row"><div class="b sec" id="eMenu">☰ MENU</div><div class="b" id="eAgain">↻ COBA LAGI</div></div></div>','menuwrap');tap('eMenu',menu);tap('eAgain',function(){sembunyi();window.__mulai(EP)});bip(150,.4,'sawtooth',.06);return}
 bip(880,.15,'triangle');setTimeout(function(){bip(1100,.2,'triangle')},150);setTimeout(function(){bip(1320,.35,'triangle')},300);
 cerita('EPISODE '+EP+' — TAMAT',e.outro,function(){var last=EP>=G.eps.length;var k=kodeEp(EP);
  layar('<div class="S"><div class="ttl">'+(last?'🏁 CERITA TAMAT':'EPISODE '+EP+' SELESAI')+'</div><div class="box" style="min-height:0">'+(last?md(G.tamat||'Terima kasih sudah memainkan '+G.judul+'.'):'Episode <b>'+(EP+1)+' — '+G.eps[EP].judul+'</b> menunggu.')+'</div>'+
   '<div class="kode"><small>KODE EPISODE — kirim ke chat bot</small><b>'+k+'</b><small>'+(last?'kirim untuk mencatat tamat & skor akhirmu':'Ketik/kirim kode ini di chat, bot akan mengirim tombol <b>Episode '+(EP+1)+'</b>.'+(EPD.kunci?'<br>Lalu buka dengan: <b>'+(EPD.prefix||'.')+'episode'+(EP+1)+' '+EPD.kunci+'</b> (kunci pribadimu)':''))+'</small></div>'+
   '<div class="skor">skor episode '+(skor||0)+' · rekor '+best+'</div><div class="row"><div class="b sec" id="eMenu">☰ MENU</div><div class="b" id="eAgain">↻ MAIN ULANG EP '+EP+'</div></div></div>','menuwrap');
  tap('eMenu',menu);tap('eAgain',function(){sembunyi();window.__mulai(EP)})})}
window.__tamat=tamat;
/* v7.28.0 — resolusi tinggi: backing store mengikuti devicePixelRatio (maks 3×), koordinat game tetap 480×600 */
/* v7.32.0 — garis & ujung membulat global (visual lebih halus di semua game) */
(function(){var s=Math.max(1,Math.min(3,window.devicePixelRatio||1));cv.width=Math.round(480*s);cv.height=Math.round(600*s);ctx.setTransform(s,0,0,s,0,0);ctx.imageSmoothingEnabled=true;try{ctx.imageSmoothingQuality='high'}catch(e){}
try{ctx.lineJoin='round';ctx.lineCap='round'}catch(e){}
 var _cl=ctx.clearRect.bind(ctx);ctx.clearRect=function(x,y,w,h){if(x===0&&y===0&&w>=cv.width/s-1&&h>=cv.height/s-1){ctx.save();ctx.setTransform(1,0,0,1,0,0);_cl(0,0,cv.width,cv.height);ctx.restore()}else _cl(x,y,w,h)};
 var _gid=ctx.getImageData.bind(ctx);ctx.getImageData=function(x,y,w,h){return _gid(x*s,y*s,w*s,h*s)};window.__DPR=s})();
splash();
`

/**
 * bungkus(game, brand, {ep,max,nonce}) → HTML lengkap
 */
export function bungkus (g, brand = 'THERYHANN!', epd = {}) {
  const G = { id: g.id, cmd: g.cmd, judul: g.judul, sub: g.sub, ikon: g.ikon, brand, eps: g.eps, how: g.how, tujuan: g.tujuan, tamat: g.tamat, bgm: g.bgm, splash: g.splash(brand) }
  const gjson = JSON.stringify(G).replace(/</g, '\\u003c')
  return '<style>' + CSS_BASE + g.css + '</style>' +
    `<div class="wrap"><div class="hud"><div class="lg"><b>${esc(g.judul)}</b><small>${esc(g.sub)} · EP ${epd.ep || 1}</small></div><div class="r">${g.hud}<div class="ps" id="ps">II</div></div></div>` +
    `<div class="frame" style="--ratio:${g.ratio || '125%'}"><canvas id="cv"></canvas><div class="toast" id="toast"></div><div class="dlg" id="dlg"></div><div class="lay menuwrap" id="lay"></div></div>` +
    `<div class="ctl" id="ctl">${g.kontrol}</div><div class="hint">${g.hint || ''}<br><b>${esc(brand)}</b></div></div>` +
    '<script>var __EP = { ep: ' + (+epd.ep || 1) + ', max: ' + (+epd.max || 1) + ', nonce: "' + String(epd.nonce || '').replace(/[^0-9a-zA-Z]/g, '') + '", kunci: "' + String(epd.kunci || '').replace(/[^0-9a-zA-Z-]/g, '') + '", prefix: "' + String(epd.prefix || '.').replace(/["\\]/g, '') + '" };' +
    'window.__G=' + gjson + ';window.__G.menuHtml=' + g.menu + ';' + FW_JS + g.js + '</script>'
}

/** sisipkan data episode (dipanggil server saat kirim kartu) */
export function sisipEp (html, { ep = 1, max = 1, nonce = '', kunci = '', prefix = '.' } = {}) {
  return String(html).replace(/var __EP = \{[^}]*\};/, 'var __EP = { ep: ' + (+ep || 1) + ', max: ' + (+max || 1) + ', nonce: "' + String(nonce).replace(/[^0-9a-zA-Z]/g, '') + '", kunci: "' + String(kunci || '').replace(/[^0-9a-zA-Z-]/g, '') + '", prefix: "' + String(prefix || '.').replace(/["\\]/g, '') + '" };')
}

export const HTML15 = {}
for (const k of Object.keys(GAMES)) HTML15[k] = (brand = 'THERYHANN!', epd = {}) => bungkus(GAMES[k], brand, epd)

export const ARCADE_9 = Object.values(GAMES).map(g => ({
  id: g.id, cmd: g.cmd.replace(/^\./, ''), icon: g.icon, nama: g.nama, title: g.judul.replace(/\b\w+/g, w => w[0] + w.slice(1).toLowerCase()), ket: g.ket, ratio: '480×600',
  episode: g.eps.length, html: (b, epd) => bungkus(g, b, epd)
}))

export default { HTML15, ARCADE_9, bungkus, sisipEp }
