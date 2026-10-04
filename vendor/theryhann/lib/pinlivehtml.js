/**
 * lib/pinlivehtml.js — 📌 .pinlive KARTU CARI PINTEREST (v7.36.0)
 *  Gaya TERANG (kontras kartu gelap ytlive): logo P merah, LIVE,
 *  status Tersambung, kotak cari + Cari, grid 2 kolom + halaman ▲▼,
 *  ketuk gambar = pratinjau besar (lightbox) + tombol salin perintah.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function rasioPin (n = 4) {
  const baris = Math.min(2, Math.max(1, Math.ceil(n / 2)))
  const tinggi = 330 + baris * 178 + 58
  return Math.max(150, Math.min(210, Math.round(tinggi / 480 * 100))) + '%'
}

export function pinliveSearchHtml (bot, d = {}) {
  const q = String(d.q || '')
  const P = String(d.P || '.')
  const token = String(d.token || '')
  const hasil = Array.isArray(d.hasil) ? d.hasil : []
  const per = 4
  const cards = hasil.map((v, i) => {
    const cmd = `${P}pinlive ${token} ${i + 1}`.trim()
    return `<div class="c" data-i="${i}" data-cmd="${esc(cmd)}" style="animation-delay:${i * 45}ms;display:${i < per ? 'block' : 'none'}">` +
      `<div class="g">${v.thumb ? `<img src="${v.thumb}" alt="" loading="lazy">` : `<div class="kosong" style="${v.warna ? `background:${esc(v.warna)}` : ''}">📌</div>`}${v.video ? '<span class="pb">▶</span>' : ''}<span class="no">${i + 1}</span></div>` +
      `<b>${esc(v.judul || 'Tanpa judul')}</b><span>${esc([v.kreator, v.suka ? `♥ ${v.suka}` : ''].filter(Boolean).join(' · '))}</span></div>`
  }).join('')
  const data = JSON.stringify({ t: hasil.map(v => v.thumb || ''), j: hasil.map(v => v.judul || ''), P, token }).replace(/</g, '‹')
  const css = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#000;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:${rasioPin(Math.min(per, hasil.length) || 1)};border-radius:26px;overflow:hidden;background:#f7f4f2;border:1px solid rgba(0,0,0,.08);box-shadow:0 24px 60px rgba(0,0,0,.55)}
.in{position:absolute;inset:0;padding:16px 16px 12px;display:flex;flex-direction:column;overflow:hidden;color:#222}
.hd{display:flex;align-items:center;gap:10px;animation:turun .5s both}
.lg{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#e60023,#b8001b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800;font-family:Georgia,serif;flex:none;box-shadow:0 4px 14px rgba(230,0,35,.4)}
.hd b{font-size:15.5px;color:#1c1c1c}
.hd small{display:block;font-size:11.5px;color:#8a8a8a;font-weight:500;margin-top:1px}
.live{margin-left:auto;flex:none;font-size:10.5px;font-weight:800;letter-spacing:1.5px;color:#e60023;border:1.5px solid rgba(230,0,35,.6);border-radius:999px;padding:4px 11px;display:flex;align-items:center;gap:6px}
.live i{width:7px;height:7px;border-radius:50%;background:#e60023;box-shadow:0 0 8px #e60023;animation:denyut 1.4s infinite}
.st{display:flex;align-items:center;gap:7px;font-size:12px;color:#555;margin:9px 2px 0;animation:turun .5s .06s both}
.st i{width:8px;height:8px;border-radius:50%;background:#22b573;box-shadow:0 0 7px #22b573;animation:denyut 1.8s infinite}
.st b{margin-left:auto;color:#999;font-size:11.5px}
.cari{display:flex;gap:8px;margin-top:8px;animation:turun .5s .12s both}
.cari input{flex:1;min-width:0;background:#ececec;border:1px solid rgba(0,0,0,.06);border-radius:999px;padding:10px 16px;color:#222;font-size:13.5px;outline:none}
.cari input:focus{border-color:rgba(230,0,35,.5)}
.cari button{flex:none;background:linear-gradient(135deg,#e60023,#c0001d);border:0;color:#fff;font-weight:800;font-size:14px;border-radius:999px;padding:10px 22px;cursor:pointer;box-shadow:0 4px 14px rgba(230,0,35,.35)}
.cari button:active{transform:scale(.94)}
.grid{margin-top:10px;flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start;overflow:hidden}
.c{cursor:pointer;animation:naik .45s both}
.g{position:relative;border-radius:14px;overflow:hidden;height:118px;background:#e2e2e2}
.g img{width:100%;height:100%;object-fit:cover;display:block}
.g .kosong{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:34px;background:#dcdcdc}
.g .pb{position:absolute;right:7px;top:7px;background:rgba(0,0,0,.7);color:#fff;font-size:10px;font-weight:800;padding:3px 8px;border-radius:999px}
.g .no{position:absolute;left:7px;top:7px;background:rgba(0,0,0,.65);color:#fff;font-size:10.5px;font-weight:800;min-width:22px;height:22px;border-radius:11px;display:flex;align-items:center;justify-content:center}
.c b{display:block;font-size:12px;color:#2b2b2b;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c span{display:block;font-size:10.5px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft{display:flex;align-items:center;justify-content:center;gap:14px;padding-top:8px}
.ft button{width:38px;height:30px;border-radius:9px;border:1px solid rgba(0,0,0,.12);background:#fff;color:#333;font-size:13px;cursor:pointer}
.ft button:active{transform:scale(.92)}
.ft b{font-size:12.5px;color:#666;min-width:44px;text-align:center}
.lb{position:absolute;inset:0;background:rgba(15,15,15,.94);display:none;flex-direction:column;align-items:center;justify-content:center;padding:22px;z-index:5}
.lb.on{display:flex}
.lb img{max-width:100%;max-height:62%;border-radius:14px;object-fit:contain}
.lb b{color:#fff;font-size:13.5px;margin-top:12px;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lb .row{display:flex;gap:10px;margin-top:14px}
.lb .row button{border:0;border-radius:999px;padding:10px 20px;font-weight:800;font-size:13px;cursor:pointer}
.lb .kirim{background:linear-gradient(135deg,#e60023,#c0001d);color:#fff}
.lb .tutup{background:#333;color:#fff}
.toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%) translateY(20px);background:rgba(20,20,20,.94);color:#fff;font-size:12px;font-weight:600;padding:9px 16px;border-radius:999px;opacity:0;transition:all .3s;pointer-events:none;max-width:92%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:9}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
@keyframes turun{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes naik{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes denyut{0%,100%{opacity:1}50%{opacity:.35}}
`
  const js = `(function(){
function salin(t){try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);return true}}catch(e){}try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);return true}catch(e){}return false}
function toast(t){var el=document.getElementById('toast');el.textContent=t;el.className='toast on';clearTimeout(window.__tt);window.__tt=setTimeout(function(){el.className='toast'},2200)}
var D=__PIN,pg=0,per=${per},cards=Array.prototype.slice.call(document.querySelectorAll('.c')),tot=Math.max(1,Math.ceil(cards.length/per));
function tampil(){cards.forEach(function(el,i){el.style.display=(i>=pg*per&&i<(pg+1)*per)?'block':'none'});document.getElementById('pg').textContent=(pg+1)+'/'+tot}
document.getElementById('naik').addEventListener('click',function(){if(pg>0){pg--;tampil()}});
document.getElementById('turun').addEventListener('click',function(){if(pg<tot-1){pg++;tampil()}});
var cur=0;
cards.forEach(function(el){el.addEventListener('click',function(){cur=parseInt(el.getAttribute('data-i'));var im=document.getElementById('lbi');if(D.t[cur]){im.src=D.t[cur];im.style.display='block'}else{im.style.display='none'}document.getElementById('lbj').textContent=D.j[cur]||'';document.getElementById('lb').className='lb on'})});
document.getElementById('lbt').addEventListener('click',function(){document.getElementById('lb').className='lb'});
document.getElementById('lbk').addEventListener('click',function(){salin(D.P+'pinlive '+D.token+' '+(cur+1));toast('📋 Disalin — tempel & kirim untuk mengunduh')});
document.getElementById('cari').addEventListener('click',function(){var v=document.getElementById('kunci').value.trim();if(!v){toast('Ketik kata kunci dulu');return}salin('${P.replace(/'/g, "\\'")}pinlive '+v);toast('📋 Disalin — tempel & kirim untuk mencari')});
tampil();})();`
  return `<style>${css}</style><div class="w"><div class="f"><div class="in">` +
    `<div class="hd"><div class="lg">P</div><div style="min-width:0"><b>Pinterest — ${esc(bot)}</b><small>Pencarian gambar Pinterest langsung</small></div><div class="live"><i></i>LIVE</div></div>` +
    `<div class="st"><i></i>Tersambung…<b>Hasil untuk &quot;${esc(q)}&quot; (${hasil.length})</b></div>` +
    `<div class="cari"><input id="kunci" value="${esc(q)}" placeholder="Cari gambar…"><button id="cari">Cari</button></div>` +
    `<div class="grid">${cards}</div>` +
    `<div class="ft"><button id="naik">▲</button><b id="pg">1/1</b><button id="turun">▼</button></div>` +
    `</div><div class="lb" id="lb"><img id="lbi" alt=""><b id="lbj"></b><div class="row"><button class="kirim" id="lbk">📋 Salin perintah</button><button class="tutup" id="lbt">✕ Tutup</button></div></div><div class="toast" id="toast"></div></div></div><script>var __PIN=${data};${js}</script>`
}

export default { pinliveSearchHtml, rasioPin }
