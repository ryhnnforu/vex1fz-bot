/**
 * lib/spotifylive.js — 🟢 .spotifylive / 📸 .iglive — KARTU LIVE (v7.14.0)
 * ------------------------------------------------------------------------
 *  Meniru video referensi: logo + nama universe, pil LIVE, 3 tab
 *  (Cari · Bareng · Ruang Global), status merah/hijau, kotak "Lagu atau
 *  artis" → hasil muncul LANGSUNG di kartu (Deezer JSONP, tanpa CORS),
 *  ketuk lagu → "Mengunduh 37%…" → mini-player (⟲ ▶/⏸ ⟳, seek, waktu).
 *  Tab Bareng: nama, checkbox "Buka untuk umum", maks orang 2-10, Buat
 *  ruangan / Kode ruangan / Gabung. Ruang Global: daftar ruangan publik.
 *  Bila jaringan diblokir webview → otomatis pakai lagu yang ditanam bot.
 *  theme: 'spotify' (hijau) | 'ig' (gradasi Instagram).
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const TRUSTED_LIVE = ['hirara.dev', 'api.deezer.com', 'cdnt-preview.dzcdn.net', 'cdns-preview-0.dzcdn.net', 'e-cdns-images.dzcdn.net', 'e-cdn-images.dzcdn.net', 'cdn-images.dzcdn.net', 'dzcdn.net', 'itunes.apple.com', 'audio-ssl.itunes.apple.com', 'mzstatic.com']

const THEME = {
  spotify: { nama: 'Spotify', ac: '#1db954', ac2: '#1ed760', bg: '#121212', bg2: '#1f1f1f', card: '#181818', in: '#242424', on: '#173b27', txtOn: '#000', logo: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1db954"/><path d="M6 9.5c3.8-1.1 8.3-.8 11.6 1.1M6.6 12.6c3.2-.9 6.9-.6 9.6.9M7.2 15.5c2.6-.7 5.5-.5 7.7.8" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>', grad: 'linear-gradient(90deg,#1db954,#1ed760)' },
  ig: { nama: 'Instagram', ac: '#e1306c', ac2: '#f77737', bg: '#0b0b0f', bg2: '#16121c', card: '#15111b', in: '#1f1a26', on: '#3a1230', txtOn: '#fff', logo: '<svg viewBox="0 0 24 24"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".3" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset=".8" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igg)"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="#fff"/></svg>', grad: 'linear-gradient(90deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' }
}

const CSS = T => `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:${T.bg};font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;height:auto}
.sl{max-width:560px;margin:0 auto;padding:16px 14px 12px;background:linear-gradient(180deg,${T.bg2} 0%,${T.bg} 45%)}
.hd{display:flex;align-items:flex-start;justify-content:space-between}
.hd .lg{display:flex;align-items:center;gap:8px}.hd .lg svg{width:34px;height:34px}.hd .lg b{font-size:24px;font-weight:800;letter-spacing:-.5px}.hd .lg sup{font-size:9px;opacity:.7}
.hd .nm{font-size:12px;color:#d0d0d0;margin:6px 0 0 2px}
.live{border:1.5px solid ${T.ac};color:${T.ac2};font-size:10px;letter-spacing:2px;font-weight:800;padding:5px 11px;border-radius:999px;margin-top:6px}
.tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:16px 0 10px}
.tabs div{height:44px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:#2a2a2a;color:#e0e0e0;text-align:center;line-height:1.1;padding:0 6px}
.tabs div.on{background:${T.grad};color:${T.txtOn}}
.st{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#b3b3b3;margin:6px 2px 12px}.st i{width:9px;height:9px;border-radius:50%;background:#e53935;display:inline-block;flex:none}.st i.ok{background:${T.ac};box-shadow:0 0 8px ${T.ac}}
.sr{height:50px;background:${T.in};border-radius:999px;display:flex;align-items:center;padding:0 16px;gap:10px}.sr svg{width:18px;height:18px;opacity:.7;flex:none}.sr input{flex:1;background:transparent;border:0;outline:none;color:#fff;font-size:15px;min-width:0}
.sr .go{font-size:12px;font-weight:800;color:${T.ac2};padding:6px 4px}
.lst{margin-top:12px;background:${T.card};border-radius:14px;max-height:300px;overflow:auto;padding:6px;display:none}.lst.on{display:block}
.tr{display:flex;align-items:center;gap:12px;padding:7px 8px;border-radius:10px}.tr.on{background:${T.on}}
.tr img,.tr .ph{width:56px;height:56px;border-radius:4px;object-fit:cover;background:#333;flex:none}
.tr .t{flex:1;min-width:0}.tr .t b{display:block;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tr.on .t b{color:${T.ac2}}.tr .t span{display:block;font-size:12.5px;color:#b3b3b3;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eq{width:18px;height:16px;display:none;align-items:flex-end;gap:2px}.tr.on .eq{display:flex}.eq i{flex:1;background:${T.ac2};animation:eq 1s ease-in-out infinite}.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}.eq i:nth-child(4){animation-delay:.1s}@keyframes eq{0%,100%{height:30%}50%{height:100%}}.eq.paused i{animation-play-state:paused}
.pg{display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 0 2px;font-size:11px;color:#b3b3b3}.pg span{width:28px;height:28px;border-radius:50%;border:1px solid #444;display:flex;align-items:center;justify-content:center;font-size:12px}
.info{padding:14px;text-align:center;color:#b3b3b3;font-size:12.5px;line-height:1.5}
.mp{margin-top:12px;background:#282828;border-radius:18px;padding:16px;display:none}.mp.on{display:block}
.mp .r1{display:flex;gap:14px;align-items:center}.mp img,.mp .ph{width:84px;height:84px;border-radius:8px;object-fit:cover;background:#333;flex:none}
.mp .t{min-width:0}.mp .t b{display:block;font-size:18px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mp .t span{display:block;font-size:13px;color:#b3b3b3;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sk{margin-top:14px}.sk input{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,#fff var(--p,0%),#5a5a5a var(--p,0%));outline:none}.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff}
.tm{display:flex;justify-content:space-between;font-size:11px;color:#b3b3b3;margin-top:6px}
.ct{display:flex;align-items:center;justify-content:center;gap:40px;margin-top:12px}.ct .b{width:40px;height:40px;flex:0 0 40px;display:flex;align-items:center;justify-content:center;color:#fff}.ct .b svg{width:24px;height:24px}
.ct .big{width:64px;height:64px;min-width:64px;max-width:64px;min-height:64px;max-height:64px;flex:0 0 64px;border-radius:32px;background:#fff;display:flex;align-items:center;justify-content:center;color:#000;line-height:0}.ct .big svg{width:28px;height:28px;display:block}
.dl{text-align:center;font-size:11px;color:#b3b3b3;margin-top:8px;min-height:14px}
.pane{display:none}.pane.on{display:block}
.rg p{font-size:13px;line-height:1.6;color:#d0d0d0;margin:6px 2px 12px}.rg p b{color:#fff}
.rg label{display:block;font-size:12.5px;font-weight:700;margin:10px 2px 6px;color:#e0e0e0}
.rg .fi{height:50px;background:${T.in};border-radius:10px;display:flex;align-items:center;padding:0 14px;gap:8px}.rg .fi input{flex:1;background:transparent;border:0;outline:none;color:#fff;font-size:15px;min-width:0}.rg .fi small{font-size:9px;color:#888;letter-spacing:1px}
.rg .cb{display:flex;gap:10px;align-items:flex-start;background:${T.in};border-radius:10px;padding:12px 14px;margin-top:10px;font-size:12px;color:#d0d0d0;line-height:1.45}.rg .cb i{width:18px;height:18px;border:2px solid #888;border-radius:4px;flex:none;margin-top:1px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px}.rg .cb.on i{background:${T.ac};border-color:${T.ac};color:#000}
.rg .bt{height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;margin-top:12px}.rg .bt.hij{background:${T.grad};color:${T.txtOn}}.rg .bt.gar{border:1.5px solid #fff;color:#fff}
.rg .atau{text-align:center;font-size:11px;letter-spacing:2px;color:#b3b3b3;margin:16px 0 4px;font-weight:700}
.pill{display:inline-flex;gap:8px;align-items:center;background:${T.in};border-radius:999px;padding:8px 12px;font-size:11px;margin-top:10px}.pill b{color:${T.ac2};letter-spacing:1px}
.kode{margin-top:12px;background:${T.on};border:1px solid ${T.ac};border-radius:14px;padding:14px;text-align:center;display:none}.kode.on{display:block}.kode small{display:block;font-size:11px;letter-spacing:2px;color:#b3b3b3}.kode b{display:block;font-size:32px;letter-spacing:8px;color:${T.ac2};margin:6px 0}.kode span{font-size:12px;color:#d0d0d0;line-height:1.5;display:block}
.room{display:flex;align-items:center;gap:12px;background:${T.card};border-radius:12px;padding:12px;margin-top:8px}.room .av{width:42px;height:42px;border-radius:50%;background:${T.grad};display:flex;align-items:center;justify-content:center;font-weight:900;color:${T.txtOn}}.room .t{flex:1;min-width:0}.room .t b{display:block;font-size:14px}.room .t span{font-size:12px;color:#b3b3b3}.room .jn{padding:8px 14px;border-radius:999px;background:${T.ac};color:#000;font-size:12px;font-weight:800}
.wm{text-align:center;font-size:10px;color:#6a6a6a;letter-spacing:1px;margin-top:12px}
`

const JS = String.raw`
(function(){
var D=__SL,I=document.getElementById.bind(document),au=I('au'),res=[],cur=-1,playing=false,page=0,PER=4,net=null,blob=null;
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function status(t,ok){I('st').textContent=t;I('stI').className=ok?'ok':''}
/* ---- tab ---- */function tab(n){['t1','t2','t3'].forEach(function(id,i){I(id).classList.toggle('on',i===n)});['p1','p2','p3'].forEach(function(id,i){I(id).classList.toggle('on',i===n)})}
I('t1').onclick=function(){tab(0)};I('t2').onclick=function(){tab(1)};I('t3').onclick=function(){tab(2);renderGlobal()};
/* ---- cari: Deezer JSONP → fallback tanam ---- */
function jsonp(url,cb,fail){var name='cb'+Date.now()+Math.floor(Math.random()*1e4);var s=document.createElement('script');var done=false;window[name]=function(d){done=true;delete window[name];s.remove();cb(d)};s.onerror=function(){if(!done){s.remove();fail()}};setTimeout(function(){if(!done){s.remove();fail()}},7000);s.src=url+(url.indexOf('?')>0?'&':'?')+'output=jsonp&callback='+name;document.body.appendChild(s)}
function cari(){var q=I('q').value.trim();if(!q)return;status('Mencari…',false);I('lst').innerHTML='<div class="info">Mencari…</div>';I('lst').classList.add('on');
 jsonp('https://api.deezer.com/search?q='+encodeURIComponent(q)+'&limit=12',function(d){net=true;res=(d.data||[]).filter(function(t){return t.preview}).map(function(t){return{judul:t.title,artis:t.artist&&t.artist.name,cover:t.album&&t.album.cover_medium,url:t.preview,durasi:30,dur:t.duration}});page=0;if(!res.length)return lokal(q,'tidak ada hasil online');render();status('Tersambung. '+res.length+' hasil untuk "'+q+'"',true)},function(){net=false;lokal(q,'jaringan diblokir')})}
function lokal(q,why){var f=q.toLowerCase();res=D.tracks.filter(function(t){return !f||(t.judul+' '+t.artis).toLowerCase().indexOf(f)>=0});if(!res.length)res=D.tracks.slice();page=0;render();status((why?why+' · ':'')+'memakai lagu dari bot ('+res.length+'). Lagu lain: ketik '+D.prefix+D.cmd+' judul di chat',res.length>0)}
function render(){var start=page*PER,items=res.slice(start,start+PER);var h=items.map(function(t,i){var idx=start+i;return '<div class="tr'+(idx===cur?' on':'')+'" data-i="'+idx+'">'+(t.cover?'<img src="'+esc(t.cover)+'">':'<div class="ph"></div>')+'<div class="t"><b>'+esc(t.judul)+'</b><span>'+esc(t.artis)+'</span></div><div class="eq'+(playing?'':' paused')+'"><i></i><i></i><i></i><i></i></div></div>'}).join('');
 var pages=Math.max(1,Math.ceil(res.length/PER));h+='<div class="pg"><span id="pgU">︿</span>'+(page+1)+'/'+pages+'<span id="pgD">﹀</span></div>';I('lst').innerHTML=h;I('lst').classList.add('on');
 I('lst').querySelectorAll('.tr').forEach(function(el){el.onclick=function(){pilih(+el.getAttribute('data-i'))}});I('pgU').onclick=function(){if(page>0){page--;render()}};I('pgD').onclick=function(){if(page<pages-1){page++;render()}}}
/* ---- putar: unduh dengan progres → blob; kalau gagal pakai src langsung ---- */
function pilih(i){cur=i;var t=res[i];I('mp').classList.add('on');I('mpT').textContent=t.judul;I('mpA').textContent=t.artis;if(t.cover){I('mpC').src=t.cover;I('mpC').style.display='block';I('mpPh').style.display='none'}else{I('mpC').style.display='none';I('mpPh').style.display='block'}
 I('cur').textContent='0:00';I('tot').textContent=fmt(t.durasi);I('seek').value=0;I('seek').style.setProperty('--p','0%');render();pause();
 if(t.url.indexOf('data:')===0){au.src=t.url;I('dl').textContent='';play();return}
 I('dl').textContent='Mengunduh 0%…';var xhr=new XMLHttpRequest();xhr.open('GET',t.url,true);xhr.responseType='blob';xhr.onprogress=function(e){if(e.lengthComputable)I('dl').textContent='Mengunduh '+Math.round(e.loaded/e.total*100)+'%…'};
 xhr.onload=function(){if(xhr.status>=200&&xhr.status<300){if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(xhr.response);au.src=blob;I('dl').textContent='';play()}else langsung(t)};xhr.onerror=function(){langsung(t)};xhr.send()}
function langsung(t){au.src=t.url;I('dl').textContent='streaming…';play()}
function play(){au.play().then(function(){playing=true;ikon();I('dl').textContent=''}).catch(function(){I('dl').textContent='Ketuk ▶ untuk memutar'})}
function pause(){au.pause();playing=false;ikon()}
function ikon(){I('big').innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';document.querySelectorAll('.eq').forEach(function(e){e.classList.toggle('paused',!playing)})}
au.addEventListener('timeupdate',function(){var d=au.duration||30;var p=au.currentTime/d*100;I('seek').value=p;I('seek').style.setProperty('--p',p+'%');I('cur').textContent=fmt(au.currentTime);I('tot').textContent=fmt(d)});
au.addEventListener('ended',function(){if(cur+1<res.length)pilih(cur+1)});au.addEventListener('error',function(){if(cur>=0&&au.src&&au.src.indexOf('blob:')!==0&&res[cur].url.indexOf('data:')!==0){I('dl').textContent='gagal memuat audio · coba lagu lain';}});
I('seek').oninput=function(){var d=au.duration||30;au.currentTime=I('seek').value/100*d};I('big').onclick=function(){playing?pause():play()};
I('back').onclick=function(){au.currentTime=Math.max(0,au.currentTime-10)};I('fwd').onclick=function(){if(cur+1<res.length)pilih(cur+1);else au.currentTime=Math.min(au.duration||30,au.currentTime+10)};
I('go').onclick=cari;I('q').onkeydown=function(e){if(e.key==='Enter')cari()};
/* ---- ruangan ---- */var pub=false;I('cb').onclick=function(){pub=!pub;I('cb').classList.toggle('on',pub);I('cbI').textContent=pub?'✓':''};
I('buat').onclick=function(){var n=I('nama').value.trim()||D.nama;var mx=Math.max(2,Math.min(10,+I('maks').value||10));I('kode').classList.add('on');I('kodeB').textContent=D.kode;I('kodeS').textContent='Host: '+n+' · maks '+mx+' orang · '+(pub?'PUBLIK (tampil di Ruang Global)':'privat')+'. Teman kirim di chat:  '+D.prefix+'gabungruang '+D.kode;D.rooms.unshift({kode:D.kode,host:n,n:1,mx:mx,pub:pub,lagu:cur>=0?res[cur].judul:'-'});status('Ruangan '+D.kode+' dibuat · kamu host',true)};
I('gabung').onclick=function(){var k=I('kodeIn').value.trim().toUpperCase();if(k.length<4){status('Kode ruangan tidak ditemukan.',false);return I('kodeIn').focus()}var r=D.rooms.filter(function(x){return x.kode===k})[0];I('kode').classList.add('on');I('kodeB').textContent=k;if(r){I('kodeS').textContent='Ruangan '+k+' · host '+r.host+' · '+r.n+'/'+r.mx+' orang. Kirim di chat:  '+D.prefix+'gabungruang '+k+'  untuk menerima playlist host.';status('Tersambung ke ruangan '+k+' sebagai PENDENGAR',true)}else{I('kodeS').textContent='Kode '+k+' belum terdaftar di bot. Kirim  '+D.prefix+'gabungruang '+k+'  di chat — bila ruangan ada, bot mengirim kartunya.';status('Kode ruangan tidak ditemukan.',false)}};
I('kodeIn').oninput=function(){I('kodeIn').value=I('kodeIn').value.toUpperCase().slice(0,4)};
function renderGlobal(){var r=D.rooms.filter(function(x){return x.pub});I('rooms').innerHTML=r.length?r.map(function(x){return '<div class="room"><div class="av">'+esc(x.host[0]||'?').toUpperCase()+'</div><div class="t"><b>'+esc(x.host)+' · '+esc(x.kode)+'</b><span>'+x.n+'/'+x.mx+' orang · 🎵 '+esc(x.lagu||'-')+'</span></div><div class="jn" data-k="'+esc(x.kode)+'">Gabung</div></div>'}).join(''):'<div class="info">Belum ada ruangan publik.<br>Buat di tab <b>Bareng</b> dan centang "Buka untuk umum".</div>';I('rooms').querySelectorAll('.jn').forEach(function(b){b.onclick=function(){I('kodeIn').value=b.getAttribute('data-k');tab(1);I('gabung').onclick()}})}
/* ---- awal ---- */ikon();if(D.query){I('q').value=D.query;if(D.tracks.length){lokal(D.query,'');}cari()}else if(D.tracks.length){lokal('','');}else status('Kode ruangan tidak ditemukan.',false);
})();`

/**
 * @param {string} brand
 * @param {object} d { theme, nama, universe, kode, prefix, cmd, tracks:[{judul,artis,cover,url,durasi}], query, rooms:[{kode,host,n,mx,pub,lagu}] }
 */
export function spotifyLiveHtml (brand, d = {}) {
  const T = THEME[d.theme === 'ig' ? 'ig' : 'spotify']
  const data = {
    nama: String(d.nama || 'kamu').slice(0, 24), kode: String(d.kode || 'ABCD').slice(0, 4).toUpperCase(), prefix: String(d.prefix || '.'), cmd: String(d.cmd || 'spotifylive'), query: String(d.query || '').slice(0, 60),
    tracks: (d.tracks || []).slice(0, 8).map(t => ({ judul: String(t.judul || '-').slice(0, 80), artis: String(t.artis || '-').slice(0, 60), cover: String(t.cover || ''), url: String(t.url || ''), durasi: Number(t.durasi) || 30 })),
    rooms: (d.rooms || []).slice(0, 12).map(r => ({ kode: String(r.kode || '').slice(0, 4), host: String(r.host || '-').slice(0, 20), n: Number(r.n) || 1, mx: Number(r.mx) || 10, pub: !!r.pub, lagu: String(r.lagu || '-').slice(0, 40) }))
  }
  const search = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  const back = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/></svg>'
  const fwd = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>'
  return '<style>' + CSS(T) + '</style>' +
    '<div class="sl">' +
      `<div class="hd"><div><div class="lg">${T.logo}<b>${T.nama}<sup>®</sup></b></div><div class="nm">${esc(d.universe || brand + ' Universe')}</div></div><div class="live">LIVE</div></div>` +
      '<div class="tabs"><div class="on" id="t1">Cari</div><div id="t2">Bareng</div><div id="t3">Ruang Global</div></div>' +
      '<div class="st"><i id="stI"></i><span id="st">Kode ruangan tidak ditemukan.</span></div>' +
      '<div class="pane on" id="p1">' +
        `<div class="sr">${search}<input id="q" placeholder="Lagu atau artis"><span class="go" id="go">Cari</span></div>` +
        '<div class="lst" id="lst"></div>' +
        `<div class="mp" id="mp"><div class="r1"><img id="mpC" src="" style="display:none"><div class="ph" id="mpPh"></div><div class="t"><b id="mpT">-</b><span id="mpA"></span></div></div>` +
        '<div class="sk"><input id="seek" type="range" min="0" max="100" step="0.1" value="0"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
        `<div class="ct"><div class="b" id="back">${back}</div><div class="big" id="big"></div><div class="b" id="fwd">${fwd}</div></div><div class="dl" id="dl"></div></div>` +
      '</div>' +
      '<div class="pane rg" id="p2">' +
        '<p>Yang membuat ruangan jadi <b>host</b> - cuma dia yang memilih lagu, memutar, dan menjeda. Yang gabung pakai kode tinggal dengerin: lagunya ikut jalan sendiri, mengikuti host.</p>' +
        `<label>Nama kamu</label><div class="fi"><input id="nama" placeholder="${esc(data.nama)}" maxlength="24"><small>${esc(data.nama.toUpperCase())}</small></div>` +
        '<div class="cb" id="cb"><i id="cbI"></i><span>Buka untuk umum — ruanganmu muncul di Ruang Global, orang lain bisa masuk langsung tanpa kode.</span></div>' +
        '<label>Maksimal orang di ruangan (2-10)</label><div class="fi"><input id="maks" type="number" min="2" max="10" value="10"></div>' +
        '<div class="bt hij" id="buat">Buat ruangan</div>' +
        '<div><span class="pill"><b>PENDENGAR</b> Ngikutin host</span></div>' +
        '<div class="atau">ATAU</div>' +
        '<label>Kode ruangan</label><div class="fi"><input id="kodeIn" placeholder="MASS" maxlength="4"></div>' +
        '<div class="bt gar" id="gabung">Gabung ruangan</div>' +
        '<div class="kode" id="kode"><small>KODE RUANGAN</small><b id="kodeB"></b><span id="kodeS"></span></div>' +
      '</div>' +
      '<div class="pane" id="p3"><div id="rooms"></div></div>' +
      `<div class="wm">${esc(brand)} • ${T.nama.toUpperCase()} LIVE • RUANGAN ${esc(data.kode)}</div>` +
    '</div>' +
    '<audio id="au" preload="auto" playsinline crossorigin="anonymous"></audio>' +
    '<script>var __SL=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { spotifyLiveHtml, TRUSTED_LIVE }
