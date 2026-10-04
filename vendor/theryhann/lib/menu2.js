/**
 * lib/menu2.js — v7.30.0 · MENU2 dibuat ulang: HOME SCREEN ala iPhone
 *  - rasio kartu DIHITUNG dari jumlah kategori (baris ikon) → panjangnya pas dengan sub-menu.
 *  - status bar + Dynamic Island, wallpaper gradasi bergerak, widget kaca (sapaan/status/limit),
 *    grid ikon app (kategori) dengan animasi masuk "spring" berurutan, dock di bawah.
 *  - ketuk ikon (mis. RPG) → animasi iOS "app open": ikon membesar & memudar ke layar penuh
 *    kategori itu (nav bar besar, search bar di dalam, daftar perintah bergaya Settings iOS).
 *    tombol ‹ Kembali / home indicator → animasi menutup kembali ke home.
 *  - ketuk perintah → tersalin ke clipboard + toast (webview WA tidak bisa mengirim pesan);
 *    LIST native dikirim bersamaan supaya perintah tetap bisa dijalankan langsung.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/** rasio dihitung: header 260px + baris ikon × 104px + dock 120px, lebar 480 */
export function menu2Ratio (jumlahKategori = 15) {
  const baris = Math.max(3, Math.ceil(jumlahKategori / 4))
  const tinggi = 340 + baris * 118 + 150
  return Math.max(120, Math.min(260, Math.round(tinggi / 480 * 100))) + '%'
}
export const MENU2_RATIO = menu2Ratio(15)

const WARNA = ['#ff3b30,#ff6961', '#ff9500,#ffb340', '#ffcc00,#ffe066', '#34c759,#5ee07a', '#00c7be,#4de3dc', '#30b0c7,#67cfe0', '#32ade6,#6cc6f0', '#007aff,#4da3ff', '#5856d6,#8683e6', '#af52de,#c98cf0', '#ff2d55,#ff6b8a', '#a2845e,#c4a77d', '#8e8e93,#b0b0b5', '#ff375f,#ff7a99', '#64d2ff,#9ae3ff', '#bf5af2,#d99cff']

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#000;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;overflow-x:hidden}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:var(--r);border-radius:44px;overflow:hidden;background:#000;box-shadow:0 0 0 3px #1c1c1e,0 0 0 5px #3a3a3c,0 24px 60px rgba(0,0,0,.6)}
.wp{position:absolute;inset:0;background:linear-gradient(160deg,#0a84ff,#5e5ce6 30%,#bf5af2 55%,#ff375f 80%,#ff9f0a);background-size:300% 300%;animation:wp 14s ease infinite}
.wp:after{content:"";position:absolute;inset:0;background:radial-gradient(70% 40% at 20% 10%,rgba(255,255,255,.28),transparent 70%),radial-gradient(60% 50% at 90% 90%,rgba(0,0,0,.45),transparent 70%)}
@keyframes wp{0%{background-position:0% 0%}50%{background-position:100% 100%}100%{background-position:0% 0%}}
.scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:12px 16px 0;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:none}
.scr::-webkit-scrollbar{width:0;height:0}
.sb{display:flex;justify-content:space-between;font-size:14px;font-weight:700;padding:4px 12px;height:30px}
.isl{position:absolute;left:50%;top:12px;transform:translateX(-50%);height:32px;min-width:110px;padding:0 14px;background:#000;border-radius:20px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:11px;white-space:nowrap;animation:isl 1.1s .2s cubic-bezier(.2,1.5,.4,1) both;z-index:6}
.isl i{width:8px;height:8px;border-radius:50%;background:#30d158;box-shadow:0 0 8px #30d158;animation:blink 1.6s infinite}
@keyframes isl{from{opacity:.4;transform:translateX(-50%) scaleX(.6)}to{opacity:1;transform:translateX(-50%)}}@keyframes blink{50%{opacity:.3}}.orb{position:absolute;border-radius:50%;filter:blur(50px);opacity:.45;pointer-events:none;animation:orb 12s ease-in-out infinite alternate;z-index:0}.ob1{width:200px;height:200px;background:#ff375f;left:-60px;top:20%}.ob2{width:240px;height:240px;background:#0a84ff;right:-70px;bottom:10%;animation-duration:16s;animation-delay:-6s}@keyframes orb{from{transform:translate(0,0) scale(1)}to{transform:translate(46px,-56px) scale(1.22)}}
.g{background:rgba(255,255,255,.16);backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);border:1px solid rgba(255,255,255,.26);border-radius:24px}
.sp{animation:spring .8s cubic-bezier(.18,1.5,.4,1) both;opacity:0}
@keyframes spring{from{opacity:0;transform:translateY(30px) scale(.85) rotate(-5deg)}60%{opacity:1;transform:translateY(-3px) scale(1.02) rotate(1deg)}to{opacity:1;transform:none}}
.wid{margin-top:12px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.wid .lg{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,#fff,#c7d2fe);color:#1c1c1e;font-weight:900;font-size:26px;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.wid h1{font-size:19px;font-weight:800;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wid p{font-size:12px;color:rgba(255,255,255,.8);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.st{display:flex;gap:10px;margin-top:10px}.st .g{flex:1;padding:10px 12px}.st small{display:block;font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,.7)}.st b{font-size:14px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 10px;margin-top:18px;padding:0 2px}
.app{text-align:center;cursor:pointer;position:relative}
.app .ic{width:60px;height:60px;margin:0 auto;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:inset 0 -8px 14px rgba(0,0,0,.2),inset 0 2px 4px rgba(255,255,255,.35),0 8px 16px rgba(0,0,0,.28);transition:transform .3s cubic-bezier(.2,1.6,.4,1)}
.app:active .ic{transform:scale(.86)}
.app .bd{position:absolute;top:-6px;right:calc(50% - 40px);min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#ff3b30;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.app .n{font-size:11px;margin-top:6px;text-shadow:0 1px 3px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dock{margin-top:auto;margin-bottom:22px;padding:12px 14px;display:flex;justify-content:space-around;border-radius:34px}
.dock .app .ic{width:56px;height:56px}
.home{position:absolute;left:50%;bottom:7px;transform:translateX(-50%);width:130px;height:5px;border-radius:5px;background:#fff;opacity:.9;z-index:7}
.dots{display:flex;justify-content:center;gap:6px;margin:12px 0 6px}.dots i{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.45)}.dots i:first-child{background:#fff}
/* ---- layar kategori (app open) ---- */
.appv{position:absolute;inset:0;background:#000;border-radius:44px;transform-origin:50% 50%;transform:scale(.1);opacity:0;pointer-events:none;transition:transform .5s cubic-bezier(.32,.72,0,1),opacity .35s,border-radius .5s;z-index:5;display:flex;flex-direction:column;overflow:hidden}
.appv.on{transform:none;opacity:1;pointer-events:auto}
.nav{padding:44px 16px 8px;background:rgba(28,28,30,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.08);position:relative;z-index:2}
.nav .bk{display:inline-flex;align-items:center;gap:4px;color:#0a84ff;font-size:16px;cursor:pointer}
.nav h2{font-size:30px;font-weight:800;letter-spacing:-.5px;margin-top:6px;display:flex;align-items:center;gap:10px}
.nav h2 .mini{width:36px;height:36px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px}
.nav p{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px}
.sr{margin:10px 0 0;background:rgba(118,118,128,.24);border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:8px;font-size:15px;color:rgba(235,235,245,.6)}
.sr input{flex:1;background:none;border:0;outline:0;color:#fff;font-size:15px;font-family:inherit;min-width:0}
.lst{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;padding:14px 16px 40px;scrollbar-width:thin}
.lst::-webkit-scrollbar{width:4px}.lst::-webkit-scrollbar-thumb{background:rgba(255,255,255,.3);border-radius:4px}
.grp{background:#1c1c1e;border-radius:14px;overflow:hidden;margin-bottom:16px}
.row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.08);animation:rin .45s cubic-bezier(.2,1.2,.4,1) both;cursor:pointer;transition:background .15s}
.row:last-child{border:0}.row:active,.row.on{background:rgba(255,255,255,.08)}
@keyframes rin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.row .ri{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}
.row .rt{flex:1;min-width:0}.row .rt b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .rt span{display:block;font-size:12px;color:rgba(235,235,245,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .cmd{font-size:11px;font-family:ui-monospace,Menlo,monospace;color:#0a84ff;flex:none;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.row .chev{color:rgba(235,235,245,.3);font-size:18px;flex:none}
.sec{font-size:12px;color:rgba(235,235,245,.55);letter-spacing:.5px;text-transform:uppercase;margin:0 4px 6px}
.toast{position:absolute;left:50%;top:56px;transform:translate(-50%,-30px);background:rgba(44,44,46,.96);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:13px;padding:10px 16px;border-radius:18px;opacity:0;transition:all .4s cubic-bezier(.2,1.4,.4,1);max-width:86%;text-align:center;z-index:9;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.toast.on{opacity:1;transform:translate(-50%,0)}
.kosong{text-align:center;color:rgba(235,235,245,.5);padding:30px 0;font-size:14px}
`

const JS = String.raw`
(function(){
var I=function(id){return document.getElementById(id)};var tst=I('toast'),tm=null,K=__K;
function toast(t){tst.textContent=t;tst.className='toast on';clearTimeout(tm);tm=setTimeout(function(){tst.className='toast'},2200)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function salin(t){try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();var ok=document.execCommand&&document.execCommand('copy');document.body.removeChild(ta);if(!ok&&navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){});ok=true}return ok}catch(e){return false}}
var appv=I('appv'),f=I('f'),cur=-1;
function warna(i){return K[i]?K[i].w:'#8e8e93,#b0b0b5'}
function rowHtml(it,d,idx){return '<div class="row" data-cmd="'+esc(it[3])+'" style="animation-delay:'+Math.min(d,700)+'ms"><div class="ri" style="background:linear-gradient(135deg,'+warna(idx)+')">'+esc(it[0])+'</div><div class="rt"><b>'+esc(it[1])+'</b><span>'+esc(it[2]||'ketuk untuk salin perintah')+'</span></div><div class="cmd">'+esc(it[3])+'</div><div class="chev">›</div></div>'}
function isSec(it){return it[3].indexOf('SEC:')===0}
function render(idx,q){var k=K[idx];var items=k.items;var hdr=!q&&items.some(isSec);
 if(q){q=q.toLowerCase();items=items.filter(function(it){return !isSec(it)&&(it[1]+' '+it[2]+' '+it[3]).toLowerCase().indexOf(q)>=0})}
 var h='';if(!items.length)h='<div class="kosong">Tidak ada perintah cocok "'+esc(q||'')+'"</div>';
 else if(hdr){var gr=[],cu={t:'',it:[]};items.forEach(function(it){if(isSec(it)){if(cu.it.length||cu.t)gr.push(cu);cu={t:it[1],it:[]}}else cu.it.push(it)});if(cu.it.length||cu.t)gr.push(cu);
  h=gr.map(function(g){return '<div class="sec">'+esc(g.t||'Perintah')+' · '+g.it.length+'</div><div class="grp">'+g.it.map(function(it,j){return rowHtml(it,j*22,idx)}).join('')+'</div>'}).join('')}
 else{var per=8;for(var g=0;g<items.length;g+=per){h+='<div class="sec">'+(g===0?'Perintah':'')+' '+(g+1)+'–'+Math.min(items.length,g+per)+' dari '+items.length+'</div><div class="grp">'+items.slice(g,g+per).map(function(it,j){return rowHtml(it,(g+j)*22,idx)}).join('')+'</div>'}}
 I('lst').innerHTML=h;bind(I('lst'))}
function bind(root){Array.prototype.forEach.call(root.querySelectorAll('.row'),function(el){
 var last=0;function h(e){var n=Date.now();if(n-last<700)return;last=n;Array.prototype.forEach.call(root.querySelectorAll('.row'),function(x){x.className='row'});el.className='row on';var c=el.getAttribute('data-cmd');var ok=salin(c);toast((ok?'📋 Disalin: ':'Ketik: ')+c+' — tempel & kirim, atau ketuk item yang sama di daftar di bawah kartu')}
 var sx=0,sy=0;el.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});el.addEventListener('touchend',function(e){var t=e.changedTouches[0];if(Math.hypot(t.clientX-sx,t.clientY-sy)<12)h(e)});el.addEventListener('mousedown',function(e){if(e.button===0)h(e)})})}
function buka(idx,el){var k=K[idx];if(!k)return;cur=idx;
 var r=el.getBoundingClientRect(),fr=f.getBoundingClientRect();var ox=((r.left+r.width/2-fr.left)/fr.width*100).toFixed(1),oy=((r.top+r.height/2-fr.top)/fr.height*100).toFixed(1);
 appv.style.transformOrigin=ox+'% '+oy+'%';
 appv.innerHTML='<div class="nav"><div class="bk" id="bk">‹ Kembali</div><h2><span class="mini" style="background:linear-gradient(135deg,'+warna(idx)+')">'+esc(k.i)+'</span>'+esc(k.t)+'</h2><p>'+k.items.filter(function(it){return it[3].indexOf('SEC:')!==0}).length+' perintah · ketuk = salin perintah</p><div class="sr">🔍<input id="q" placeholder="Cari di '+esc(k.t)+'"></div></div><div class="lst" id="lst"></div>';
 render(idx,'');requestAnimationFrame(function(){appv.className='appv on'});
 I('bk').addEventListener('click',tutup);var q=I('q');q.addEventListener('input',function(){render(idx,q.value.trim())});toast(k.i+' '+k.t+' dibuka')}
function tutup(){appv.className='appv';cur=-1;setTimeout(function(){if(cur<0)appv.innerHTML=''},520)}
Array.prototype.forEach.call(document.querySelectorAll('.app[data-k]'),function(a){a.addEventListener('click',function(){buka(+a.getAttribute('data-k'),a)})});
bind(I('dock'));
I('hm').addEventListener('click',function(){if(cur>=0)tutup()});
/* jam status bar hidup */
function jam(){var d=new Date();I('jam').textContent=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)}jam();setInterval(jam,15000);
})();`

/**
 * @param {object} d { brand, nama, status, limit, fitur, versi, tanggal, pembuka, kategori:[{title,icon,items:[{icon,title,desc,cmd}]}], sections }
 */
export function menu2Html (d = {}) {
  const brand = esc(d.brand || 'THERYHANN!')
  const kat = (d.kategori || []).map((k, i) => ({ ...k, w: WARNA[i % WARNA.length] }))
  const pintas = (d.sections || []).flatMap(s => s.items).slice(0, 4)
  const ratio = menu2Ratio(kat.length)
  const K = kat.map(k => ({ t: k.title.replace(/ Menu$/i, ''), i: k.icon || '📂', w: k.w, items: k.items.map(i => [i.icon || '▸', i.title, i.desc || '', i.cmd]) }))
  const apps = kat.map((k, i) => `<div class="app sp" data-k="${i}" style="animation-delay:${180 + i * 45}ms"><div class="ic" style="background:linear-gradient(135deg,${k.w})">${esc(k.icon || '📂')}</div><span class="bd">${k.items.filter(i => !String(i.cmd).startsWith('SEC:')).length}</span><div class="n">${esc(k.title.replace(/ Menu$/i, ''))}</div></div>`).join('')
  const dock = pintas.map((p, i) => `<div class="app row" data-cmd="${esc(p.cmd)}" style="animation:none;padding:0;border:0;background:none;display:block"><div class="ic" style="background:linear-gradient(135deg,${WARNA[(i + 5) % WARNA.length]})">${esc(p.icon || '▸')}</div><div class="n">${esc(p.title)}</div></div>`).join('')
  return `<style>${CSS}</style><div class="w"><div class="f" id="f" style="--r:${ratio}"><div class="wp"></div><div class="orb ob1"></div><div class="orb ob2"></div><div class="scr">` +
    `<div class="sb"><span id="jam">--:--</span><span>📶 🔋</span></div><div class="isl"><i></i><span>${brand} · ${esc(d.status || 'ONLINE')}</span></div>` +
    `<div class="g sp wid" style="animation-delay:.05s"><div class="lg">${esc((d.brand || 'T')[0])}</div><div style="min-width:0"><h1>${brand}</h1><p>Halo ${esc(String(d.nama || 'kakak').slice(0, 18))} 👋 · v${esc(d.versi || '')} · ${esc(d.tanggal || '')}</p></div></div>` +
    `<div class="st"><div class="g sp" style="animation-delay:.1s"><small>STATUS</small><b>${esc(d.status || '-')}</b></div><div class="g sp" style="animation-delay:.14s"><small>LIMIT</small><b>${esc(d.limit ?? '-')}</b></div><div class="g sp" style="animation-delay:.18s"><small>FITUR</small><b>${esc(d.fitur ?? '-')}</b></div></div>` +
    (d.pembuka ? `<div class="g sp" style="animation-delay:.22s;margin-top:10px;padding:10px 14px;font-size:12px;line-height:1.5">💬 ${esc(d.pembuka)}</div>` : '') +
    `<div class="grid">${apps}</div><div class="dots"><i></i><i></i></div>` +
    `<div class="g sp dock" style="animation-delay:.9s" id="dock">${dock}</div>` +
    `</div><div class="appv" id="appv"></div><div class="toast" id="toast"></div><div class="home" id="hm"></div></div></div>` +
    `<script>var __K=${JSON.stringify(K).replace(/</g, '\\u003c')};${JS}</script>`
}

export default { menu2Html, MENU2_RATIO, menu2Ratio }
