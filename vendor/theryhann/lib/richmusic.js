/**
 * lib/richmusic.js — 🍎 RICH MUSIC: kartu ala Apple Music (v7.27.0), sesuai screenshot pengguna.
 *  Mesin sama dengan Spotify Vibe (cari Deezer→server bot→tanam, lagu penuh stream /a, lirik LRC,
 *  log buffering), tampilan: logo Apple Music, +ROOM/LIVE, kotak cari + tombol Cari merah, daftar
 *  hasil, cover besar, badge LOSSLESS, seekbar, shuffle ⏮ ▶ ⏭ repeat, Lirik Bersinkron · Kualitas Audio.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#0b0b0d;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.sv{position:relative;max-width:520px;margin:0 auto;padding:14px 12px 16px;border-radius:22px;overflow:hidden;background:#141418;border:1px solid rgba(255,255,255,.08)}
.sv:before{content:"";position:absolute;inset:0;background:radial-gradient(90% 40% at 50% 0%,var(--c2,rgba(250,45,85,.18)),transparent 70%);pointer-events:none;transition:.8s}
.hd{position:relative;display:flex;align-items:center;justify-content:space-between;padding:0 4px 14px}
.lg{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;line-height:1.05}.lg .ic{width:46px;height:46px;border-radius:12px;background:linear-gradient(160deg,#fc5c7d,#fa2d48);display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 6px 16px rgba(250,45,72,.4)}
.pil{display:flex;gap:8px}.pil span{font-size:11px;font-weight:800;letter-spacing:.5px;border-radius:999px;padding:8px 12px;border:1px solid rgba(255,255,255,.18);text-align:center;line-height:1.1}.pil .rm{color:#fa2d48;border-color:rgba(250,45,72,.6);background:rgba(250,45,72,.12)}.pil .lv{color:#34c759;border-color:rgba(52,199,89,.6);background:rgba(52,199,89,.1)}.pil .lv:before{content:"● ";font-size:9px}
.sr{position:relative;display:flex;align-items:center;gap:8px;margin:0 0 12px}
.sr .bx{flex:1;display:flex;align-items:center;gap:8px;background:#1c1c21;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 12px}
.sr svg{width:16px;height:16px;flex:none;opacity:.7}.sr input{flex:1;background:none;border:0;outline:0;color:#fff;font-size:15px;min-width:0;text-transform:uppercase}.sr input::placeholder{color:rgba(255,255,255,.4);text-transform:none}.sr .go{font-size:15px;font-weight:800;background:#fa2d48;border-radius:12px;padding:12px 16px;flex:none}
.lst{position:relative}
.tr{display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:12px;background:#1c1c21;margin-bottom:8px;border:1px solid transparent;transition:.3s}
.tr img,.tr .ph{width:46px;height:46px;border-radius:8px;object-fit:cover;flex:none;background:#2a2a30;display:flex;align-items:center;justify-content:center;font-size:20px;color:#666}
.tr .t{flex:1;min-width:0}.tr .t b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tr .t span{display:block;font-size:12px;color:rgba(255,255,255,.65);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr.on{background:rgba(250,45,72,.16);border-color:#fa2d48}
.eq{display:none;gap:3px;align-items:flex-end;height:14px}.tr.on .eq{display:flex}.eq i{width:3px;background:#fa2d48;animation:eq .8s infinite ease-in-out}.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}.eq i:nth-child(4){animation-delay:.1s}
@keyframes eq{0%,100%{height:4px}50%{height:14px}}.paused .eq i{animation-play-state:paused;height:4px}
.pl{position:relative;margin-top:14px;background:#1a1a1f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:16px 16px 14px}
.cv{position:relative;width:64%;max-width:250px;height:0;padding-bottom:64%;margin:0 auto 14px;border-radius:14px;overflow:hidden;background:#2a2a30;box-shadow:0 18px 40px rgba(0,0,0,.6)}@media(min-width:390px){.cv{padding-bottom:250px}}
.cv img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}.cv .ph{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:52px;color:#555}
.now{text-align:center;font-weight:800;font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.now small{display:block;font-weight:500;font-size:15px;color:rgba(255,255,255,.65);margin-top:2px}
.bd{display:flex;justify-content:center;margin:8px 0 10px}.bd span{font-size:11px;font-weight:800;letter-spacing:1px;background:#2a2a30;border-radius:6px;padding:4px 8px;color:#eee}.bd span:before{content:"♪ ";color:#fa2d48}
.sk{padding:0 4px}.sk input{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;outline:none;background:linear-gradient(90deg,#fff var(--p,0%),rgba(255,255,255,.2) var(--p,0%))}.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff}
.tm{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.6);margin-top:4px}
.ct{display:flex;align-items:center;justify-content:space-between;margin:10px 4px 8px}.ct .b{width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#fff}.ct .b svg{width:24px;height:24px}.ct .b.on{color:#fa2d48}
.ct .big{width:82px;height:82px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center}.ct .big svg{width:34px;height:34px}
.dl{text-align:center;font-size:11px;color:rgba(255,255,255,.65);min-height:15px}
.ops{display:flex;border-top:1px solid rgba(255,255,255,.1);margin-top:8px;padding-top:12px}.ops div{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;font-weight:800;font-size:15px;line-height:1.15;color:#ddd}.ops div i{font-style:normal;color:#aaa;font-size:16px}.ops div.on{color:#fa2d48}
.lyr{display:none;background:#111114;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 14px;min-height:100px;max-height:190px;overflow:auto;margin-top:12px;scroll-behavior:smooth}.sv.lirik .lyr{display:block}
.lyr .h{display:flex;justify-content:space-between;font-size:10px;letter-spacing:2px;color:#fa2d48;font-weight:800;margin-bottom:8px}.lyr .h i{font-style:normal;color:rgba(255,255,255,.5)}
.lyr .l{font-size:14px;line-height:1.5;color:rgba(255,255,255,.45);padding:2px 0}.lyr .l.on{color:#fff;font-weight:800;font-size:15px}.lyr .kos{color:rgba(255,255,255,.5);font-size:12px;text-align:center;padding:20px 0}
.log{margin-top:12px;font-family:monospace;font-size:13px;color:rgba(255,255,255,.75);background:#1c1c21;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;max-height:74px;overflow:hidden;white-space:nowrap}.log div{overflow:hidden;text-overflow:ellipsis}.log div:before{content:"● ";color:#ff9f0a}
.wm{position:relative;text-align:center;font-size:10px;color:rgba(255,255,255,.35);letter-spacing:1px;margin-top:12px}
`

/* v7.30.0 — skin SPOTIFY (.play2): hijau #1db954, cover vinyl berputar, equalizer besar, bar bawah "Sedang diputar" */
const CSS_SPOTIFY = `
.sv{background:linear-gradient(180deg,var(--c1,#1e3a2a) 0%,#121212 45%,#000 100%)}
.sr .go,.tr.on .eq i{background:#1db954}.sr .go{color:#000}.tr.on{background:rgba(29,185,84,.16);border-color:#1db954}
.bd span:before,.lyr .h,.ct .b.on,.ops div.on{color:#1db954}
.cv{border-radius:50%!important;box-shadow:0 0 0 6px #111,0 0 0 8px #2a2a2a,0 24px 50px rgba(0,0,0,.7);animation:spin 9s linear infinite;animation-play-state:paused}.sv:not(.paused) .cv.go{animation-play-state:running}
.cv:after{content:"";position:absolute;left:50%;top:50%;width:18%;height:18%;transform:translate(-50%,-50%);border-radius:50%;background:#111;box-shadow:0 0 0 3px #1db954}
@keyframes spin{to{transform:rotate(360deg)}}
.ct .big{background:#1db954;color:#000}
.eqbig{display:flex;justify-content:center;gap:4px;align-items:flex-end;height:34px;margin:6px 0 2px}.eqbig i{width:5px;border-radius:3px;background:linear-gradient(#1db954,#1ed760);animation:eq .9s infinite ease-in-out;height:6px}
.eqbig i:nth-child(2n){animation-delay:.15s}.eqbig i:nth-child(3n){animation-delay:.3s}.eqbig i:nth-child(5n){animation-delay:.45s}.paused .eqbig i{animation-play-state:paused;height:6px}
@keyframes eq{0%,100%{height:6px}50%{height:32px}}
.npbar{display:flex;align-items:center;gap:10px;margin-top:12px;background:#282828;border-left:4px solid #1db954;border-radius:8px;padding:8px 10px;font-size:12px;animation:slideup .6s cubic-bezier(.2,1.4,.4,1) both}
.npbar b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.npbar span{color:#b3b3b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}.npbar .dot{width:8px;height:8px;border-radius:50%;background:#1db954;box-shadow:0 0 8px #1db954;animation:blink 1.2s infinite;flex:none}@keyframes blink{50%{opacity:.3}}
@keyframes slideup{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.pil .rm{background:rgba(29,185,84,.25)!important;border-color:#1db954!important}.pil .lv{color:#1db954}
`
const JS = String.raw`
(function(){
var D=__SV,I=document.getElementById.bind(document),au=I('au'),root=I('sv'),res=D.tracks.slice(),cur=-1,playing=false,LIR=null,lirIdx=-1,blob=null;
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function jam(){var d=new Date();return '['+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0')+']'}
function log(t){var l=I('log');var d=document.createElement('div');d.textContent=jam()+' '+t;l.appendChild(d);while(l.children.length>3)l.removeChild(l.firstChild)}
/* ---- tema dari warna lagu ---- */
function hex(c){return '#'+c.map(function(v){return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2)}).join('')}
function tema(rgb){if(!rgb)rgb=[122,31,43];var mx=Math.max.apply(null,rgb)||1;var sat=rgb.map(function(v){return v/mx*170+20});var c1=sat.map(function(v){return v*1.0}),c2=sat.map(function(v){return v*.42});var ac=sat.map(function(v){return Math.min(255,v*1.35+40)});
 root.style.setProperty('--c2','rgba('+Math.round(c1[0])+','+Math.round(c1[1])+','+Math.round(c1[2])+',.28)')}
function warnaCover(t,cb){if(t.warna)return cb(t.warna);if(!t.cover)return cb(null);try{var im=new Image();im.crossOrigin='anonymous';im.onload=function(){try{var c=document.createElement('canvas');c.width=c.height=16;var x=c.getContext('2d');x.drawImage(im,0,0,16,16);var d=x.getImageData(0,0,16,16).data,r=0,g=0,b=0,n=0;for(var i=0;i<d.length;i+=4){var l=(d[i]+d[i+1]+d[i+2])/3;if(l<25||l>235)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++}if(n<5)return cb(null);t.warna=[r/n,g/n,b/n];cb(t.warna)}catch(e){cb(null)}};im.onerror=function(){cb(null)};im.src=t.cover}catch(e){cb(null)}}
/* ---- daftar ---- */
function render(){I('lst').innerHTML=res.slice(0,6).map(function(t,i){return '<div class="tr'+(i===cur?' on':'')+'" data-i="'+i+'">'+(t.cover?'<img src="'+esc(t.cover)+'">':'<div class="ph"></div>')+'<div class="t"><b>'+esc(t.judul)+'</b><span>'+esc(t.artis)+' · '+fmt(t.dur||t.durasi)+'</span></div><div class="eq"><i></i><i></i><i></i><i></i></div></div>'}).join('');
 I('lst').querySelectorAll('.tr').forEach(function(el){el.onclick=function(){pilih(+el.getAttribute('data-i'))}})}
function pilih(i){cur=i;var t=res[i];render();I('now').innerHTML=esc(t.judul)+'<small>'+esc(t.artis)+'</small>';I('bdg').textContent=(t.penuh&&!t.penuhGagal)?(D.yt?'YOUTUBE · HQ':D.spotify?'SPOTIFY · FULL':'LOSSLESS'):'PREVIEW';if(D.spotify){I('cv').classList.add('go');I('npT').textContent=t.judul;I('npA').textContent=t.artis}
 I('cvI').style.display='none';I('cvP').style.display='flex';I('cvI').removeAttribute('src');
 warnaCover(t,function(c){tema(c);if(t.cover){I('cvI').src=t.cover;I('cvI').style.display='block';I('cvP').style.display='none';0}});
 I('cur').textContent='0:00';I('tot').textContent=fmt(t.durasi);I('seek').value=0;I('seek').style.setProperty('--p','0%');pause();LIR=t.lirik||null;lirIdx=-1;gambarLirik();
 log('Menghubungkan stream audio…');
 if(t.penuh&&!t.penuhGagal){I('dl').textContent='Menyambung lagu penuh…';I('tot').textContent=fmt(t.durPenuh||t.dur||t.durasi);var x2=new XMLHttpRequest();x2.open('GET',t.penuh,true);x2.responseType='blob';var my=cur;
  x2.onprogress=function(e){if(cur!==my)return;var kb=Math.round(e.loaded/1024);if(e.lengthComputable){var p=Math.round(e.loaded/e.total*100);I('dl').textContent='Buffering lagu penuh '+p+'%…';if(p%20===0)log('Buffering: '+p+'% ('+kb+' KB)')}else I('dl').textContent='Buffering lagu penuh '+kb+' KB…'};
  x2.onload=function(){if(cur!==my)return;if(x2.status>=200&&x2.status<300&&x2.response.size>50000){if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(x2.response);au.src=blob;t.offset=0;t.isPenuh=true;I('dl').textContent='';log('Lagu penuh siap ('+Math.round(x2.response.size/1024)+' KB)');play()}else{t.penuhGagal=true;log('Lagu penuh belum ada → cuplikan 30 dtk');pilih(my)}};
  x2.onerror=function(){if(cur!==my)return;t.penuhGagal=true;log('Stream gagal → cuplikan 30 dtk');pilih(my)};x2.timeout=170000;x2.ontimeout=x2.onerror;x2.send();return}
 if(!t.url)return langsung(t);if(t.url.indexOf('data:')===0){au.src=t.url;I('dl').textContent='';setTimeout(function(){log('Buffering audio ('+Math.round(t.url.length*3/4/1024)+' KB)');play()},250);return}
 I('dl').textContent='Mengunduh 0%…';var xhr=new XMLHttpRequest();xhr.open('GET',t.url,true);xhr.responseType='blob';xhr.onprogress=function(e){if(e.lengthComputable){var p=Math.round(e.loaded/e.total*100);I('dl').textContent='Mengunduh '+p+'%…';if(p%25===0)log('Buffering: '+p+'% ('+Math.round(e.loaded/1024)+' KB)')}};
 xhr.onload=function(){if(xhr.status>=200&&xhr.status<300){if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(xhr.response);au.src=blob;I('dl').textContent='';play()}else langsung(t)};xhr.onerror=function(){langsung(t)};xhr.send()}
function langsung(t){if(!t.url){I('dl').textContent='Audio belum tersedia (server bot sedang mengunduh) — coba lagi beberapa detik';log('Menunggu unduhan YouTube…');return}au.src=t.url;I('dl').textContent='streaming…';play()}
function play(){au.play().then(function(){playing=true;ikon();I('dl').textContent='';log('Memutar · '+res[cur].judul)}).catch(function(){I('dl').textContent='Ketuk cover / ▶ untuk memutar'})}
function pause(){au.pause();playing=false;ikon()}
function ikon(){I('big').innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';root.classList.toggle('paused',!playing)}
au.addEventListener('playing',function(){if(res[cur]&&res[cur].isPenuh)I('bdg').textContent=D.yt?'YOUTUBE · HQ':D.spotify?'SPOTIFY · FULL':'LOSSLESS'});
/* ---- lirik realtime ---- */
function gambarLirik(){var el=I('lyrB');if(!LIR||!LIR.length){el.innerHTML='<div class="kos">'+(cur<0?'Pilih lagu dulu':'Lirik tidak tersedia untuk lagu ini')+'</div>';return}
 el.innerHTML=LIR.map(function(l,i){return '<div class="l" data-i="'+i+'">'+esc(l[1])+'</div>'}).join('')}
function sinkron(t){if(!LIR||!LIR.length)return;var idx=-1;for(var i=0;i<LIR.length;i++){if(LIR[i][0]<=t)idx=i;else break}if(idx===lirIdx)return;lirIdx=idx;var ls=I('lyrB').querySelectorAll('.l');ls.forEach(function(e,i){e.classList.toggle('on',i===idx)});if(idx>=0&&ls[idx]){var box=I('lyrB');box.scrollTop=Math.max(0,ls[idx].offsetTop-box.offsetTop-50)}}
au.addEventListener('timeupdate',function(){var d=au.duration||res[cur]&&res[cur].durasi||30;var p=au.currentTime/d*100;I('seek').value=p;I('seek').style.setProperty('--p',p+'%');I('cur').textContent=fmt(au.currentTime);I('tot').textContent=fmt(d);sinkron(au.currentTime+(res[cur]&&!res[cur].isPenuh&&res[cur].offset||0))});
au.addEventListener('loadedmetadata',function(){if(isFinite(au.duration)&&au.duration>0)I('tot').textContent=fmt(au.duration)});
au.addEventListener('ended',function(){if(rep)return pilih(cur);if(shuf&&res.length>1){var n;do{n=Math.floor(Math.random()*res.length)}while(n===cur);return pilih(n)}if(cur+1<res.length)pilih(cur+1);else pause()});
I('seek').oninput=function(){var d=au.duration||30;au.currentTime=I('seek').value/100*d};I('big').onclick=function(){if(cur<0)return pilih(0);playing?pause():play()};
I('prev').onclick=function(){if(au.currentTime>3)au.currentTime=0;else if(cur>0)pilih(cur-1)};I('next').onclick=function(){if(cur+1<res.length)pilih(cur+1)};
I('cv').onclick=function(){if(cur<0)return pilih(0);playing?pause():play()};var shuf=false,rep=false;I('shuf').onclick=function(){shuf=!shuf;I('shuf').classList.toggle('on',shuf)};I('rep').onclick=function(){rep=!rep;I('rep').classList.toggle('on',rep)};I('opL').onclick=function(){root.classList.toggle('lirik');I('opL').classList.toggle('on')};I('opK').onclick=function(){var t=res[cur];I('dl').textContent=cur<0?'Pilih lagu dulu':(t.isPenuh?'Kualitas: LOSSLESS · lagu penuh dari server bot ('+fmt(t.durPenuh||t.dur)+')':'Kualitas: cuplikan 30 dtk · lagu penuh belum siap');log(I('dl').textContent)};
/* ---- cari: Deezer JSONP → fallback lagu tanam ---- */
function jsonp(url,cb,fail){var name='cb'+Date.now()+Math.floor(Math.random()*1e4);var s=document.createElement('script');var done=false;window[name]=function(d){done=true;delete window[name];s.remove();cb(d)};s.onerror=function(){if(!done){s.remove();fail()}};setTimeout(function(){if(!done){s.remove();fail()}},7000);s.src=url+(url.indexOf('?')>0?'&':'?')+'output=jsonp&callback='+name;document.body.appendChild(s)}
function cari(){var q=I('q').value.trim();if(!q)return;I('dl').textContent='Mencari "'+q+'"…';
 if(D.yt){if(!D.cari)return lokal(q);return fetch(D.cari+'?q='+encodeURIComponent(q)).then(function(x){return x.json()}).then(function(d){var r=(d.tracks||[]);if(!r.length)return lokal(q);res=r;cur=-1;render();I('dl').textContent=r.length+' hasil YouTube · ketuk lagu'}).catch(function(){lokal(q)})}
 jsonp('https://api.deezer.com/search?q='+encodeURIComponent(q)+'&limit=6',function(d){var r=(d.data||[]).filter(function(t){return t.preview}).map(function(t){return{judul:t.title,artis:t.artist&&t.artist.name,cover:t.album&&t.album.cover_medium,url:t.preview,durasi:30,dur:t.duration}});
  if(!r.length)return lokal(q);if(D.stream){r.forEach(function(t){t.penuh=D.stream+'?judul='+encodeURIComponent(t.judul)+'&artis='+encodeURIComponent(t.artis);t.durPenuh=t.dur})}res=r;cur=-1;render();I('dl').textContent=r.length+' hasil online · ketuk lagu';},function(){
  /* JSONP diblokir webview → minta ke server bot (pakai fetch), lalu fallback lagu tanam */
  if(!D.cari)return lokal(q);fetch(D.cari+'?q='+encodeURIComponent(q)).then(function(x){return x.json()}).then(function(d){var r=(d.tracks||[]);if(!r.length)return lokal(q);res=r;cur=-1;render();I('dl').textContent=r.length+' hasil · ketuk lagu'}).catch(function(){lokal(q)})})}
function lokal(q){var f=q.toLowerCase();var r=D.tracks.filter(function(t){return (t.judul+' '+t.artis).toLowerCase().indexOf(f)>=0});res=r.length?r:D.tracks.slice();cur=-1;render();I('dl').textContent=(r.length?r.length+' lagu cocok':'pencarian online diblokir WA · '+res.length+' lagu dari bot')+' · lagu lain: '+D.prefix+D.cmd+' judul';log(r.length?'Hasil dari lagu bot':'Pencarian online gagal → lagu bot')}
I('go').onclick=cari;I('q').onkeydown=function(e){if(e.key==='Enter')cari()};
/* ---- awal ---- */
ikon();render();tema(D.tracks[0]&&D.tracks[0].warna);if(D.query)I('q').value=D.query;if(D.tracks.length){var t0=D.tracks[0];I('now').innerHTML=esc(t0.judul)+'<small>'+esc(t0.artis)+' · ketuk cover untuk memutar</small>';if(t0.cover){I('cvI').src=t0.cover;I('cvI').style.display='block';I('cvP').style.display='none'}}
})();`


/**
 * @param {string} brand
 * @param {object} d sama seperti spotifyVibeHtml (tracks, stream, cari, query, prefix, cmd)
 */
export function richMusicHtml (brand, d = {}) {
  const data = {
    prefix: String(d.prefix || '.'), cmd: String(d.cmd || 'richmusic'), query: String(d.query || '').slice(0, 60), stream: String(d.stream || ''), cari: String(d.cari || ''), yt: !!d.yt, spotify: !!d.spotify, nama: String(d.nama || 'kamu').slice(0, 24),
    tracks: (d.tracks || []).slice(0, 6).map(t => ({ judul: String(t.judul || '-').slice(0, 80), artis: String(t.artis || '-').slice(0, 60), cover: String(t.cover || ''), url: String(t.url || ''), durasi: Number(t.durasi) || 30, dur: Number(t.dur || t.durasiAsli) || 0, warna: Array.isArray(t.warna) ? t.warna.map(Number) : null, lirik: Array.isArray(t.lirik) ? t.lirik.slice(0, 80) : null, offset: Number(t.offset) || 0, penuh: String(t.penuh || ''), durPenuh: Number(t.durPenuh) || 0 }))
  }
  const search = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  const prev = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>'
  const next = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>'
  const shuf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'
  const rep = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'
  return '<style>' + CSS + (d.spotify ? CSS_SPOTIFY : '') + '</style>' +
    '<div class="sv" id="sv">' +
      `<div class="hd"><div class="lg"><div class="ic">${d.yt ? '▶' : d.spotify ? '<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="12" fill="#1db954"/><path d="M6 9.5c4-1.2 8.2-.9 11.6 1.1M6.6 12.5c3.3-1 6.8-.7 9.7.9M7.3 15.3c2.6-.8 5.3-.5 7.6.7" stroke="#000" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>' : '🎵'}</div><div>${d.yt ? 'YouTube<br>Music' : d.spotify ? 'Spotify<br><small style="font-weight:500;font-size:10px;color:#1db954">PLAY2</small>' : 'Apple<br>Music'}</div></div><div class="pil"><span class="rm">+<br>ROOM</span><span class="lv">LIVE</span></div></div>` +
      `<div class="sr"><div class="bx">${search}<input id="q" placeholder="${d.yt ? 'Cari di YouTube' : d.spotify ? 'Apa yang ingin kamu putar?' : 'Cari lagu atau artis'}"></div><span class="go" id="go">Cari</span></div>` +
      '<div class="lst" id="lst"></div>' +
      '<div class="pl"><div class="cv" id="cv"><img id="cvI" style="display:none"><div class="ph" id="cvP">♪</div></div>' +
        (d.spotify ? '<div class="eqbig">' + '<i></i>'.repeat(14) + '</div>' : '') + '<div class="now" id="now">-</div><div class="bd"><span id="bdg">' + (d.spotify ? 'SPOTIFY · FULL' : 'LOSSLESS') + '</span></div>' +
        '<div class="sk"><input id="seek" type="range" min="0" max="100" step="0.1" value="0"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
        `<div class="ct"><div class="b" id="shuf">${shuf}</div><div class="b" id="prev">${prev}</div><div class="big" id="big"></div><div class="b" id="next">${next}</div><div class="b" id="rep">${rep}</div></div>` +
        '<div class="dl" id="dl"></div>' +
        '<div class="ops"><div id="opL"><i>♪</i>Lirik<br>Bersinkron</div><div id="opK"><i>⚙</i>Kualitas<br>Audio</div></div>' +
        '<div class="lyr"><div class="h">LIRIK<i>· BERSINKRON</i></div><div id="lyrB"></div></div></div>' +
      (d.spotify ? '<div class="npbar" id="np"><div class="dot"></div><div style="min-width:0"><b id="npT">Sedang diputar</b><span id="npA">pilih lagu di atas · ' + esc(data.nama) + '</span></div></div>' : '') + '<div class="log" id="log"></div>' +
      `<div class="wm">${esc(brand)} • ${d.yt ? 'YT RICH' : d.spotify ? 'PLAY2 · SPOTIFY' : 'RICH MUSIC'}</div>` +
    '</div>' +
    '<audio id="au" preload="auto" playsinline crossorigin="anonymous"></audio>' +
    '<script>var __SV=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { richMusicHtml }
