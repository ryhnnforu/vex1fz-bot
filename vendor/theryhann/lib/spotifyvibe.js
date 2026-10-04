/**
 * ============================================================
 *  lib/spotifyvibe.js — SPOTIFY VIBE: tema kartu berubah mengikuti lagu (v7.23.0)
 * ------------------------------------------------------------
 *  Referensi video pengguna: kartu "Spotify · +ROOM · LIVE" dengan kolom
 *  cari, daftar 4 lagu (cover kecil), cover besar di bawah + judul.
 *  Ketuk lagu → SELURUH kartu berganti warna (merah utk Starboy, biru
 *  utk versi lain) mengikuti warna cover; lagu baru = tema baru.
 *  Ketuk cover besar → layar pemutar: seekbar, waktu, ⏮ ⏸ ⏭, panel
 *  "LIRIK · REALTIME" (baris aktif menyala) + log "[12:34:17]
 *  Menghubungkan stream audio… / Buffering 30%".
 *  Warna dominan cover dihitung server (jimp) → t.warna; di kartu
 *  juga ada fallback canvas kalau cover bisa dibaca.
 * ============================================================
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#0b0b0d;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.sv{position:relative;max-width:520px;margin:0 auto;padding:12px 12px 18px;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,var(--c1,#7a1f2b) 0%,var(--c2,#3a0f16) 55%,#0d0d0f 100%);transition:background .8s ease}
.sv:before{content:"";position:absolute;inset:0;background:radial-gradient(120% 60% at 50% 0%,rgba(255,255,255,.14),transparent 60%);pointer-events:none}
.hd{position:relative;display:flex;align-items:center;justify-content:space-between;padding:2px 2px 10px}
.lg{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px}.lg svg{width:24px;height:24px}
.pil{display:flex;gap:6px}.pil span{font-size:10px;font-weight:800;letter-spacing:.5px;border-radius:999px;padding:4px 9px;border:1px solid rgba(255,255,255,.45)}.pil .rm{background:rgba(29,185,84,.18);border-color:#1db954;color:#7ff0a7}.pil .lv{background:rgba(255,255,255,.12)}
.sr{position:relative;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;margin:2px 0 10px}
.sr svg{width:16px;height:16px;flex:none;opacity:.85}.sr input{flex:1;background:none;border:0;outline:0;color:#fff;font-size:14px;min-width:0}.sr input::placeholder{color:rgba(255,255,255,.5)}.sr .go{font-size:12px;font-weight:800;background:rgba(255,255,255,.18);border-radius:8px;padding:5px 9px}
.lst{position:relative}
.tr{display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:10px;transition:background .3s}
.tr img,.tr .ph{width:38px;height:38px;border-radius:5px;object-fit:cover;flex:none;background:#333}
.tr .t{flex:1;min-width:0}.tr .t b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tr .t span{display:block;font-size:11px;color:rgba(255,255,255,.7);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr.on{background:rgba(255,255,255,.14)}.tr.on .t b{color:var(--ac,#1ed760)}
.eq{display:none;gap:2px;align-items:flex-end;height:14px}.tr.on .eq{display:flex}.eq i{width:3px;background:var(--ac,#1ed760);animation:eq .8s infinite ease-in-out}.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}.eq i:nth-child(4){animation-delay:.1s}
@keyframes eq{0%,100%{height:4px}50%{height:14px}}.paused .eq i{animation-play-state:paused;height:4px}
.cv{position:relative;width:60%;max-width:230px;height:0;padding-bottom:60%;margin:14px auto 8px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.12);box-shadow:0 18px 40px rgba(0,0,0,.55)}
@media(min-width:384px){.cv{padding-bottom:230px}}
.cv img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}.cv .ph{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:44px;opacity:.6}
.cv .tap{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.7));font-size:10px;letter-spacing:1px;text-align:center;padding:14px 0 6px;color:#ddd}
.now{text-align:center;font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}
.now small{display:block;font-weight:500;font-size:11px;color:rgba(255,255,255,.7);margin-top:2px}
.dl{text-align:center;font-size:11px;color:rgba(255,255,255,.75);min-height:15px;margin-top:4px}
/* ---- layar pemutar ---- */
.pl{position:relative;display:none;padding:6px 4px 4px}.sv.play .pl{display:block}.sv.play .lst,.sv.play .cv,.sv.play .now,.sv.play .sr,.sv.play .dl{display:none}
.pl .cv2{position:relative;width:46%;max-width:180px;height:0;padding-bottom:46%;margin:4px auto 10px;border-radius:10px;overflow:hidden;box-shadow:0 14px 30px rgba(0,0,0,.5);background:#222}@media(min-width:392px){.pl .cv2{padding-bottom:180px}}.pl .cv2 img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
.pl .tt{text-align:center;margin-bottom:8px}.pl .tt b{display:block;font-size:16px}.pl .tt span{font-size:12px;color:rgba(255,255,255,.7)}
.sk{padding:0 4px}.sk input{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;background:linear-gradient(90deg,#fff var(--p,0%),rgba(255,255,255,.25) var(--p,0%))}.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff}
.tm{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.75);margin-top:4px}
.ct{display:flex;align-items:center;justify-content:center;gap:26px;margin:8px 0 12px}.ct .b{width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#fff}.ct .b svg{width:26px;height:26px}
.ct .big{width:58px;height:58px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center}.ct .big svg{width:28px;height:28px}
.lyr{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;min-height:120px;max-height:190px;overflow:auto;scroll-behavior:smooth}
.lyr .h{display:flex;justify-content:space-between;font-size:10px;letter-spacing:2px;color:var(--ac,#1ed760);font-weight:800;margin-bottom:8px}.lyr .h i{font-style:normal;color:rgba(255,255,255,.55)}
.lyr .l{font-size:13px;line-height:1.5;color:rgba(255,255,255,.5);padding:2px 0;transition:.2s}.lyr .l.on{color:#fff;font-weight:700;font-size:14px}.lyr .kos{color:rgba(255,255,255,.55);font-size:12px;text-align:center;padding:20px 0}
.log{margin-top:10px;font-family:monospace;font-size:10px;color:rgba(255,255,255,.7);background:rgba(0,0,0,.35);border-radius:10px;padding:8px 10px;max-height:64px;overflow:hidden}.log div:before{content:"● ";color:var(--ac,#1ed760)}
.back{position:absolute;left:6px;top:4px;font-size:12px;font-weight:800;background:rgba(0,0,0,.35);border-radius:8px;padding:5px 9px;z-index:2}
.wm{position:relative;text-align:center;font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1px;margin-top:10px}
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
 root.style.setProperty('--c1',hex(c1));root.style.setProperty('--c2',hex(c2));root.style.setProperty('--ac',hex(ac))}
function warnaCover(t,cb){if(t.warna)return cb(t.warna);if(!t.cover)return cb(null);try{var im=new Image();im.crossOrigin='anonymous';im.onload=function(){try{var c=document.createElement('canvas');c.width=c.height=16;var x=c.getContext('2d');x.drawImage(im,0,0,16,16);var d=x.getImageData(0,0,16,16).data,r=0,g=0,b=0,n=0;for(var i=0;i<d.length;i+=4){var l=(d[i]+d[i+1]+d[i+2])/3;if(l<25||l>235)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++}if(n<5)return cb(null);t.warna=[r/n,g/n,b/n];cb(t.warna)}catch(e){cb(null)}};im.onerror=function(){cb(null)};im.src=t.cover}catch(e){cb(null)}}
/* ---- daftar ---- */
function render(){I('lst').innerHTML=res.slice(0,6).map(function(t,i){return '<div class="tr'+(i===cur?' on':'')+'" data-i="'+i+'">'+(t.cover?'<img src="'+esc(t.cover)+'">':'<div class="ph"></div>')+'<div class="t"><b>'+esc(t.judul)+'</b><span>'+esc(t.artis)+' · '+fmt(t.dur||t.durasi)+'</span></div><div class="eq"><i></i><i></i><i></i><i></i></div></div>'}).join('');
 I('lst').querySelectorAll('.tr').forEach(function(el){el.onclick=function(){pilih(+el.getAttribute('data-i'))}})}
function pilih(i){cur=i;var t=res[i];render();I('now').innerHTML=esc(t.judul)+'<small>'+esc(t.artis)+'</small>';I('plT').textContent=t.judul;I('plA').textContent=t.artis;
 I('cvI').style.display='none';I('cvP').style.display='flex';I('cvI').removeAttribute('src');
 warnaCover(t,function(c){tema(c);if(t.cover){I('cvI').src=t.cover;I('cvI').style.display='block';I('cvP').style.display='none';I('cv2').src=t.cover}});
 I('cur').textContent='0:00';I('tot').textContent=fmt(t.durasi);I('seek').value=0;I('seek').style.setProperty('--p','0%');pause();LIR=t.lirik||null;lirIdx=-1;gambarLirik();
 log('Menghubungkan stream audio…');
 if(t.penuh&&!t.penuhGagal){I('dl').textContent='Menyambung lagu penuh…';I('tot').textContent=fmt(t.durPenuh||t.dur||t.durasi);var x2=new XMLHttpRequest();x2.open('GET',t.penuh,true);x2.responseType='blob';var my=cur;
  x2.onprogress=function(e){if(cur!==my)return;var kb=Math.round(e.loaded/1024);if(e.lengthComputable){var p=Math.round(e.loaded/e.total*100);I('dl').textContent='Buffering lagu penuh '+p+'%…';if(p%20===0)log('Buffering: '+p+'% ('+kb+' KB)')}else I('dl').textContent='Buffering lagu penuh '+kb+' KB…'};
  x2.onload=function(){if(cur!==my)return;if(x2.status>=200&&x2.status<300&&x2.response.size>50000){if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(x2.response);au.src=blob;t.offset=0;t.isPenuh=true;I('dl').textContent='';log('Lagu penuh siap ('+Math.round(x2.response.size/1024)+' KB)');play()}else{t.penuhGagal=true;log('Lagu penuh belum ada → cuplikan 30 dtk');pilih(my)}};
  x2.onerror=function(){if(cur!==my)return;t.penuhGagal=true;log('Stream gagal → cuplikan 30 dtk');pilih(my)};x2.timeout=170000;x2.ontimeout=x2.onerror;x2.send();return}
 if(t.url.indexOf('data:')===0){au.src=t.url;I('dl').textContent='';setTimeout(function(){log('Buffering audio ('+Math.round(t.url.length*3/4/1024)+' KB)');play()},250);return}
 I('dl').textContent='Mengunduh 0%…';var xhr=new XMLHttpRequest();xhr.open('GET',t.url,true);xhr.responseType='blob';xhr.onprogress=function(e){if(e.lengthComputable){var p=Math.round(e.loaded/e.total*100);I('dl').textContent='Mengunduh '+p+'%…';if(p%25===0)log('Buffering: '+p+'% ('+Math.round(e.loaded/1024)+' KB)')}};
 xhr.onload=function(){if(xhr.status>=200&&xhr.status<300){if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(xhr.response);au.src=blob;I('dl').textContent='';play()}else langsung(t)};xhr.onerror=function(){langsung(t)};xhr.send()}
function langsung(t){au.src=t.url;I('dl').textContent='streaming…';play()}
function play(){au.play().then(function(){playing=true;ikon();I('dl').textContent='';log('Memutar · '+res[cur].judul)}).catch(function(){I('dl').textContent='Ketuk cover / ▶ untuk memutar'})}
function pause(){au.pause();playing=false;ikon()}
function ikon(){I('big').innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';root.classList.toggle('paused',!playing)}
/* ---- lirik realtime ---- */
function gambarLirik(){var el=I('lyrB');if(!LIR||!LIR.length){el.innerHTML='<div class="kos">'+(cur<0?'Pilih lagu dulu':'Lirik tidak tersedia untuk lagu ini')+'</div>';return}
 el.innerHTML=LIR.map(function(l,i){return '<div class="l" data-i="'+i+'">'+esc(l[1])+'</div>'}).join('')}
function sinkron(t){if(!LIR||!LIR.length)return;var idx=-1;for(var i=0;i<LIR.length;i++){if(LIR[i][0]<=t)idx=i;else break}if(idx===lirIdx)return;lirIdx=idx;var ls=I('lyrB').querySelectorAll('.l');ls.forEach(function(e,i){e.classList.toggle('on',i===idx)});if(idx>=0&&ls[idx]){var box=I('lyrB');box.scrollTop=Math.max(0,ls[idx].offsetTop-box.offsetTop-50)}}
au.addEventListener('timeupdate',function(){var d=au.duration||res[cur]&&res[cur].durasi||30;var p=au.currentTime/d*100;I('seek').value=p;I('seek').style.setProperty('--p',p+'%');I('cur').textContent=fmt(au.currentTime);I('tot').textContent=fmt(d);sinkron(au.currentTime+(res[cur]&&!res[cur].isPenuh&&res[cur].offset||0))});
au.addEventListener('loadedmetadata',function(){if(isFinite(au.duration)&&au.duration>0)I('tot').textContent=fmt(au.duration)});
au.addEventListener('ended',function(){if(cur+1<res.length)pilih(cur+1);else pause()});
I('seek').oninput=function(){var d=au.duration||30;au.currentTime=I('seek').value/100*d};I('big').onclick=function(){if(cur<0)return pilih(0);playing?pause():play()};
I('prev').onclick=function(){if(au.currentTime>3)au.currentTime=0;else if(cur>0)pilih(cur-1)};I('next').onclick=function(){if(cur+1<res.length)pilih(cur+1)};
I('cv').onclick=function(){if(cur<0)return pilih(0);root.classList.add('play');if(!playing)play()};I('back').onclick=function(){root.classList.remove('play')};
/* ---- cari: Deezer JSONP → fallback lagu tanam ---- */
function jsonp(url,cb,fail){var name='cb'+Date.now()+Math.floor(Math.random()*1e4);var s=document.createElement('script');var done=false;window[name]=function(d){done=true;delete window[name];s.remove();cb(d)};s.onerror=function(){if(!done){s.remove();fail()}};setTimeout(function(){if(!done){s.remove();fail()}},7000);s.src=url+(url.indexOf('?')>0?'&':'?')+'output=jsonp&callback='+name;document.body.appendChild(s)}
function cari(){var q=I('q').value.trim();if(!q)return;I('dl').textContent='Mencari "'+q+'"…';
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
 * @param {object} d { nama, prefix, cmd, query, tracks:[{judul,artis,cover,url,durasi,dur,warna:[r,g,b],lirik:[[t,teks]],offset}] }
 */
export function spotifyVibeHtml (brand, d = {}) {
  const data = {
    prefix: String(d.prefix || '.'), cmd: String(d.cmd || 'spotifyvibe'), query: String(d.query || '').slice(0, 60), stream: String(d.stream || ''), cari: String(d.cari || ''), nama: String(d.nama || 'kamu').slice(0, 24),
    tracks: (d.tracks || []).slice(0, 6).map(t => ({ judul: String(t.judul || '-').slice(0, 80), artis: String(t.artis || '-').slice(0, 60), cover: String(t.cover || ''), url: String(t.url || ''), durasi: Number(t.durasi) || 30, dur: Number(t.dur || t.durasiAsli) || 0, warna: Array.isArray(t.warna) ? t.warna.map(Number) : null, lirik: Array.isArray(t.lirik) ? t.lirik.slice(0, 80) : null, offset: Number(t.offset) || 0, penuh: String(t.penuh || ''), durPenuh: Number(t.durPenuh) || 0 }))
  }
  const logo = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1db954"/><path d="M6 9.5c3.8-1.1 8.3-.8 11.6 1.1M6.6 12.6c3.2-.9 6.9-.6 9.6.9M7.2 15.5c2.6-.7 5.5-.5 7.8.8" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>'
  const search = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  const prev = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>'
  const next = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>'
  return '<style>' + CSS + '</style>' +
    '<div class="sv" id="sv">' +
      `<div class="hd"><div class="lg">${logo}Spotify</div><div class="pil"><span class="rm">+ ROOM</span><span class="lv">LIVE</span></div></div>` +
      `<div class="sr">${search}<input id="q" placeholder="Cari lagu atau artis"><span class="go" id="go">Cari</span></div>` +
      '<div class="lst" id="lst"></div>' +
      '<div class="cv" id="cv"><img id="cvI" style="display:none"><div class="ph" id="cvP">♪</div><div class="tap">KETUK UNTUK MEMUTAR · LIRIK</div></div>' +
      '<div class="now" id="now">-</div><div class="dl" id="dl"></div>' +
      '<div class="pl"><div class="back" id="back">‹ Daftar</div><div class="cv2"><img id="cv2"></div><div class="tt"><b id="plT">-</b><span id="plA"></span></div>' +
        '<div class="sk"><input id="seek" type="range" min="0" max="100" step="0.1" value="0"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
        `<div class="ct"><div class="b" id="prev">${prev}</div><div class="big" id="big"></div><div class="b" id="next">${next}</div></div>` +
        '<div class="lyr"><div class="h">LIRIK<i>· REALTIME</i></div><div id="lyrB"></div></div><div class="log" id="log"></div></div>' +
      `<div class="wm">${esc(brand)} • SPOTIFY VIBE • tema mengikuti lagu</div>` +
    '</div>' +
    '<audio id="au" preload="auto" playsinline crossorigin="anonymous"></audio>' +
    '<script>var __SV=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { spotifyVibeHtml }
