/**
 * lib/playlisthtml.js — 🟢 .playlists — KARTU "SPOTIFY LIVE" (v7.12.0)
 * ------------------------------------------------------------------
 *  Meniru screenshot pengguna: logo Spotify + nama, pil LIVE, dua tab
 *  "Cari & Putar" / "Dengerin Bareng", baris status "Tersambung…",
 *  kotak cari + tombol Cari, daftar hasil (aktif hijau + ikon equalizer),
 *  mini-player di bawah (cover, judul, seek, 1:35 / 5:26, ⟲ ⏸ ⟳).
 *  Tab 2: penjelasan host, "Nama kamu", Buat ruangan, ATAU, Kode ruangan,
 *  Gabung ruangan.
 *
 *  Webview WA tidak punya akses jaringan → semua lagu (audio+cover) ditanam
 *  base64. "Cari" di dalam kartu menyaring lagu yang tertanam; kata kunci
 *  lain → petunjuk kirim .playlists <judul> ke chat (bot buat kartu baru).
 *  Ruangan: kode 4 huruf dibuat bot; member lain .gabungruang KODE → dapat
 *  kartu berisi playlist yang sama (sinkron per-playlist, bukan detik).
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#121212;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;height:auto;min-height:0}
.pl{max-width:560px;margin:0 auto;padding:16px 14px 10px;background:linear-gradient(180deg,#1f1f1f 0%,#121212 40%)}
.hd{display:flex;align-items:flex-start;justify-content:space-between}
.hd .lg{display:flex;align-items:center;gap:8px}
.hd .lg svg{width:34px;height:34px}
.hd .lg b{font-size:24px;font-weight:800;letter-spacing:-.5px}
.hd .lg sup{font-size:9px;opacity:.7}
.hd .nm{font-size:12px;color:#d0d0d0;margin:6px 0 0 2px}
.live{border:1.5px solid #1db954;color:#1db954;font-size:10px;letter-spacing:2px;font-weight:800;padding:5px 11px;border-radius:999px;margin-top:6px}
.tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 10px}
.tabs div{height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;background:#2a2a2a;color:#e0e0e0}
.tabs div.on{background:#1db954;color:#000}
.st{display:flex;align-items:center;gap:8px;font-size:13px;color:#b3b3b3;margin:6px 2px 14px}
.st i{width:9px;height:9px;border-radius:50%;background:#1db954;display:inline-block;box-shadow:0 0 8px #1db954}
.sr{display:grid;grid-template-columns:1fr 84px;gap:10px;align-items:center}
.sr .in{height:54px;background:#242424;border-radius:14px;display:flex;align-items:center;padding:0 14px;gap:10px}
.sr .in svg{width:20px;height:20px;opacity:.7;flex:none}
.sr input{flex:1;background:transparent;border:0;outline:none;color:#fff;font-size:16px;min-width:0}
.sr .go{height:54px;border-radius:999px;background:#1db954;color:#000;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
.lst{margin-top:14px;background:#181818;border-radius:14px;max-height:330px;overflow:auto;padding:6px}
.tr{display:flex;align-items:center;gap:12px;padding:8px;border-radius:10px}
.tr.on{background:#173b27}
.tr img,.tr .ph{width:66px;height:66px;border-radius:4px;object-fit:cover;background:#333;flex:none}
.tr .t{flex:1;min-width:0}
.tr .t b{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr.on .t b{color:#1ed760}
.tr .t span em{color:#1ed760;font-style:normal;font-weight:700}
.tr .t span{display:block;font-size:13px;color:#b3b3b3;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eq{width:18px;height:16px;display:none;align-items:flex-end;gap:2px;margin-right:4px}
.tr.on .eq{display:flex}
.eq i{flex:1;background:#1ed760;animation:eq 1s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}.eq i:nth-child(4){animation-delay:.1s}
@keyframes eq{0%,100%{height:30%}50%{height:100%}}
.eq.paused i{animation-play-state:paused}
.kosong{padding:26px 12px;text-align:center;color:#b3b3b3;font-size:13px;line-height:1.5}
.kosong b{color:#1ed760}
.mp{margin-top:14px;background:#282828;border-radius:18px;padding:16px}
.mp .r1{display:flex;gap:14px;align-items:center}
.mp img,.mp .ph{width:92px;height:92px;border-radius:8px;object-fit:cover;background:#333;flex:none}
.mp .t b{display:block;font-size:20px;font-weight:800;line-height:1.2}
.mp .t span{display:block;font-size:14px;color:#b3b3b3;margin-top:4px}
.sk{margin-top:16px}
.sk input{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,#fff var(--p,0%),#5a5a5a var(--p,0%));outline:none}
.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff}
.tm{display:flex;justify-content:space-between;font-size:12px;color:#b3b3b3;margin-top:6px}
.ct{display:flex;align-items:center;justify-content:center;gap:44px;margin-top:14px}
.ct .b{width:44px;height:44px;flex:0 0 44px;display:flex;align-items:center;justify-content:center;color:#fff}
.ct .b svg{width:26px;height:26px}
.ct .big{width:68px;height:68px;min-width:68px;max-width:68px;min-height:68px;max-height:68px;flex:0 0 68px;border-radius:34px;background:#fff;display:flex;align-items:center;justify-content:center;color:#000;box-sizing:border-box;padding:0;line-height:0}
.ct .big svg{width:30px;height:30px;display:block}
.ct .big:active{transform:scale(.95)}
/* tab 2 */
.rg{display:none}.rg.on{display:block}
.rg p{font-size:14px;line-height:1.6;color:#d0d0d0;margin:8px 2px 14px}
.rg p b{color:#fff}
.rg label{display:block;font-size:13px;font-weight:700;margin:10px 2px 6px;color:#e0e0e0}
.rg .fi{height:56px;background:#242424;border-radius:12px;display:flex;align-items:center;padding:0 16px}
.rg .fi input{flex:1;background:transparent;border:0;outline:none;color:#fff;font-size:16px;text-transform:none}
.rg .bt{height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;margin-top:14px}
.rg .bt.hij{background:#1db954;color:#000}
.rg .bt.gar{border:1.5px solid #fff;color:#fff}
.rg .atau{text-align:center;font-size:12px;letter-spacing:2px;color:#b3b3b3;margin:20px 0 8px;font-weight:700}
.rg .kode{margin-top:14px;background:#173b27;border:1px solid #1db954;border-radius:14px;padding:14px;text-align:center;display:none}
.rg .kode.on{display:block}
.rg .kode small{display:block;font-size:11px;letter-spacing:2px;color:#b3b3b3}
.rg .kode b{display:block;font-size:34px;letter-spacing:8px;color:#1ed760;margin:6px 0}
.rg .kode span{font-size:12px;color:#d0d0d0;line-height:1.5;display:block}
.cp{display:none}.cp.on{display:block}
.wm{text-align:center;font-size:10px;color:#6a6a6a;letter-spacing:1px;margin-top:10px;padding-bottom:0}
`

const JS = String.raw`
(function(){
var D=__PL, au=document.getElementById('au'), lst=document.getElementById('lst'), q=document.getElementById('q'), cur=0, playing=false;
var I=document.getElementById.bind(document);
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function render(filter){var f=(filter||'').toLowerCase().trim();var items=D.tracks.map(function(t,i){return {t:t,i:i}}).filter(function(x){return !f||(x.t.judul+' '+x.t.artis).toLowerCase().indexOf(f)>=0});
 if(!items.length){lst.innerHTML='<div class="kosong">Tidak ada "<b>'+f.replace(/</g,'')+'</b>" di playlist ini.<br>Ketik di chat: <b>'+D.prefix+'playlists '+f.replace(/</g,'')+'</b><br>bot akan mengirim kartu baru berisi lagu itu.</div>';return}
 lst.innerHTML=items.map(function(x){var t=x.t;return '<div class="tr'+(x.i===cur?' on':'')+'" data-i="'+x.i+'">'+(t.cover?'<img src="'+t.cover+'">':'<div class="ph"></div>')+'<div class="t"><b>'+esc(t.judul)+'</b><span>'+esc(t.artis)+'</span></div><div class="eq'+(playing?'':' paused')+'"><i></i><i></i><i></i><i></i></div></div>'}).join('');
 lst.querySelectorAll('.tr').forEach(function(el){el.addEventListener('click',function(){pilih(+el.getAttribute('data-i'),true)})})}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function pilih(i,auto){cur=i;var t=D.tracks[i];I('mpT').textContent=t.judul;I('mpA').textContent=t.artis;var c=I('mpC');if(t.cover){c.src=t.cover;c.style.display='block';I('mpPh').style.display='none'}else{c.style.display='none';I('mpPh').style.display='block'}
 au.src=t.url;au.load();I('tot').textContent=fmt(t.durasi||30);I('cur').textContent='0:00';I('seek').value=0;I('seek').style.setProperty('--p','0%');render(q.value);if(auto)play()}
function play(){au.play().then(function(){playing=true;ikon();var t=D.tracks[cur];I('st').textContent=t.penuh?'Memutar penuh: '+t.judul:'Cuplikan 30s · penuh: ketik '+D.prefix+'playlists putar '+(cur+1)}).catch(function(){I('st').textContent='Ketuk ▶ untuk memutar'})}
function pause(){au.pause();playing=false;ikon()}
function ikon(){I('big').innerHTML=playing?'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';document.querySelectorAll('.eq').forEach(function(e){e.classList.toggle('paused',!playing)})}
au.addEventListener('timeupdate',function(){var d=au.duration||D.tracks[cur].durasi||30;var p=au.currentTime/d*100;I('seek').value=p;I('seek').style.setProperty('--p',p+'%');I('cur').textContent=fmt(au.currentTime);I('tot').textContent=fmt(d)});
au.addEventListener('ended',function(){pilih((cur+1)%D.tracks.length,true)});
I('seek').addEventListener('input',function(){var d=au.duration||30;au.currentTime=I('seek').value/100*d});
I('big').addEventListener('click',function(){playing?pause():play()});
I('back').addEventListener('click',function(){au.currentTime=Math.max(0,au.currentTime-10);if(au.currentTime<1&&D.tracks.length>1)pilih((cur-1+D.tracks.length)%D.tracks.length,true)});
I('fwd').addEventListener('click',function(){if(D.tracks.length>1)pilih((cur+1)%D.tracks.length,true);else au.currentTime=Math.min(au.duration||30,au.currentTime+10)});
I('cari').addEventListener('click',function(){render(q.value);var f=q.value.toLowerCase().trim();var hit=D.tracks.findIndex(function(t){return (t.judul+' '+t.artis).toLowerCase().indexOf(f)>=0});if(hit>=0&&f)pilih(hit,true)});
q.addEventListener('input',function(){render(q.value)});q.addEventListener('keydown',function(e){if(e.key==='Enter')I('cari').click()});
/* tab */function tab(n){I('t1').classList.toggle('on',n===1);I('t2').classList.toggle('on',n===2);I('cp').classList.toggle('on',n===1);I('rg').classList.toggle('on',n===2)}
I('t1').addEventListener('click',function(){tab(1)});I('t2').addEventListener('click',function(){tab(2)});
/* ruangan */I('buat').addEventListener('click',function(){var n=I('nama').value.trim()||D.nama;I('kode').classList.add('on');I('kodeB').textContent=D.kode;I('kodeS').textContent='Host: '+n+' · '+D.tracks.length+' lagu. Minta teman kirim di chat:  '+D.prefix+'gabungruang '+D.kode+'  — mereka akan menerima kartu berisi playlist ini.';I('nama').value=n});
I('gabung').addEventListener('click',function(){var k=I('kodeIn').value.trim().toUpperCase();if(k.length<4)return I('kodeIn').focus();I('kode').classList.add('on');I('kodeB').textContent=k;I('kodeS').textContent=k===D.kode?'Kamu sudah berada di ruangan ini ✅':'Kirim di chat:  '+D.prefix+'gabungruang '+k+'  — bot akan mengirim kartu ruangan '+k+' ke kamu.'});
I('kodeIn').addEventListener('input',function(){I('kodeIn').value=I('kodeIn').value.toUpperCase().slice(0,4)});
if(D.tracks.length){pilih(D.mulai||0,false);render('')}else{lst.innerHTML='<div class="kosong">Playlist kosong.</div>'}
ikon();
})();`

/**
 * @param {string} brand
 * @param {object} d { nama, kode, prefix, tracks:[{judul,artis,cover,url,durasi}], query, host }
 */
export function playlistHtml (brand, d = {}) {
  const data = {
    nama: String(d.nama || 'Kamu').slice(0, 24), kode: String(d.kode || 'ABCD').slice(0, 4).toUpperCase(), prefix: String(d.prefix || '.'),
    tracks: (d.tracks || []).slice(0, 8).map(t => ({ judul: String(t.judul || '-').slice(0, 80), artis: String(t.artis || '-').slice(0, 60), cover: String(t.cover || ''), url: String(t.url || ''), durasi: Number(t.durasi) || 30, penuh: !!t.penuh })), mulai: Math.max(0, Math.min((d.tracks || []).length - 1, Number(d.mulai) || 0))
  }
  const logo = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1db954"/><path d="M6 9.5c3.8-1.1 8.3-.8 11.6 1.1M6.6 12.6c3.2-.9 6.9-.6 9.6.9M7.2 15.5c2.6-.7 5.5-.5 7.7.8" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>'
  const search = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  const back = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/></svg>'
  const fwd = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>'
  const t0 = data.tracks[data.mulai] || {}
  return '<style>' + CSS + '</style>' +
    '<div class="pl">' +
      `<div class="hd"><div><div class="lg">${logo}<b>Spotify<sup>®</sup></b></div><div class="nm">${esc(data.nama)}${d.host ? ' · ruangan ' + esc(data.kode) : ''}</div></div><div class="live">LIVE</div></div>` +
      '<div class="tabs"><div class="on" id="t1">Cari &amp; Putar</div><div id="t2">Dengerin Bareng</div></div>' +
      '<div class="cp on" id="cp">' +
        '<div class="st"><i></i><span id="st">Tersambung. Cari lagu di atas.</span></div>' +
        `<div class="sr"><div class="in">${search}<input id="q" placeholder="Cari lagu…" value="${esc(d.query || '')}"></div><div class="go" id="cari">Cari</div></div>` +
        '<div class="lst" id="lst"></div>' +
        `<div class="mp"><div class="r1"><img id="mpC" src="${esc(t0.cover || '')}" style="${t0.cover ? '' : 'display:none'}"><div class="ph" id="mpPh" style="${t0.cover ? 'display:none' : ''}"></div><div class="t"><b id="mpT">${esc(t0.judul || '-')}</b><span id="mpA">${esc(t0.artis || '')}</span></div></div>` +
        '<div class="sk"><input id="seek" type="range" min="0" max="100" step="0.1" value="0"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
        `<div class="ct"><div class="b" id="back">${back}</div><div class="big" id="big"></div><div class="b" id="fwd">${fwd}</div></div></div>` +
      '</div>' +
      '<div class="rg" id="rg">' +
        '<p>Yang membuat ruangan jadi <b>host</b> - cuma dia yang memilih lagu, memutar, dan menjeda. Yang gabung pakai kode tinggal dengerin: lagunya ikut jalan sendiri, mengikuti host.</p>' +
        `<label>Nama kamu</label><div class="fi"><input id="nama" placeholder="${esc(data.nama)}" maxlength="24"></div>` +
        '<div class="bt hij" id="buat">Buat ruangan</div>' +
        '<div class="atau">ATAU</div>' +
        '<label>Kode ruangan</label><div class="fi"><input id="kodeIn" placeholder="ABCD" maxlength="4"></div>' +
        '<div class="bt gar" id="gabung">Gabung ruangan</div>' +
        '<div class="kode" id="kode"><small>KODE RUANGAN</small><b id="kodeB"></b><span id="kodeS"></span></div>' +
      '</div>' +
      `<div class="wm">${esc(brand)} • PLAYLISTS • ${data.tracks.length} LAGU • RUANGAN ${esc(data.kode)}</div>` +
    '</div>' +
    '<audio id="au" preload="auto" playsinline></audio>' +
    '<script>var __PL=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { playlistHtml }
