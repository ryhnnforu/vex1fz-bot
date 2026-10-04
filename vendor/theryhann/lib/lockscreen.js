/**
 * lib/lockscreen.js — LOCK SCREEN / MENU AWAL untuk game HTML (v7.12.0)
 * ---------------------------------------------------------------------
 *  Overlay penuh di atas game: logo, subjudul, deskripsi, panduan kontrol,
 *  rekor tersimpan (localStorage), pilihan tingkat kesulitan, tombol MULAI
 *  besar. Game baru berjalan setelah MULAI ditekan (fungsi window.__mulai).
 *  Setiap game memberi warna sendiri sehingga tema lock screen ikut game.
 *
 *  lockScreen({ id, judul, sub, ikonSvg, warna:{a,b,teks}, deskripsi,
 *               kontrol:[[ikon, keterangan]...], level:['Santai','Normal','Gila'],
 *               rekorKey, brand })
 *  → { css, html, js }  (js mendefinisikan window.__lock.open()/close())
 */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function lockScreen (o = {}) {
  const a = o.warna?.a || '#7a4dff', b = o.warna?.b || '#e0568a', tx = o.warna?.teks || '#fff'
  const level = o.level || ['Santai', 'Normal', 'Sulit']
  const css = `
.lk{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 10px 18px;min-height:560px;background:radial-gradient(120% 90% at 50% 0%,${a} 0%,#0d0b12 70%);color:${tx};font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:center;transition:opacity .35s,transform .35s}
.lk.off{display:none}
${o.wrap || '.g'}{display:none}
${o.wrap || '.g'}.on{display:block}
.lk .card{width:100%;max-width:460px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:22px 18px 18px;backdrop-filter:blur(10px);box-shadow:0 30px 60px rgba(0,0,0,.45)}
.lk .ico{width:84px;height:84px;margin:0 auto 10px;border-radius:24px;background:linear-gradient(135deg,${a},${b});display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,.4);animation:lkf 3s ease-in-out infinite}
.lk .ico svg{width:52px;height:52px}
@keyframes lkf{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.lk h1{font-size:26px;letter-spacing:3px;font-weight:900;line-height:1}
.lk .sub{font-size:10px;letter-spacing:4px;opacity:.75;margin-top:6px;font-weight:800}
.lk p{font-size:12.5px;line-height:1.55;opacity:.9;margin:12px 0 10px}
.lk .kt{display:grid;grid-template-columns:1fr 1fr;gap:6px;text-align:left}
.lk .kt span{min-width:0;word-break:break-word}
.lk .kt div{background:rgba(0,0,0,.28);border-radius:12px;padding:7px 9px;font-size:11px;line-height:1.35;display:flex;gap:7px;align-items:center}
.lk .kt b{font-size:15px;min-width:22px;text-align:center}
.lk .lv{display:flex;gap:6px;margin:12px 0 10px;justify-content:center;flex-wrap:wrap}
.lk .lv span{padding:7px 10px;border-radius:999px;font-size:11px;white-space:nowrap;font-weight:800;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);letter-spacing:.5px}
.lk .lv span.on{background:${b};border-color:${b};box-shadow:0 6px 16px rgba(0,0,0,.35)}
.lk .rk{display:flex;justify-content:space-between;font-size:11px;opacity:.85;margin-bottom:12px;padding:0 4px}
.lk .rk b{font-size:14px}
.lk .go{width:100%;height:58px;border-radius:18px;border:0;background:linear-gradient(90deg,${b},${a});color:#fff;font-size:17px;font-weight:900;letter-spacing:3px;box-shadow:0 10px 26px rgba(0,0,0,.45),inset 0 -4px 0 rgba(0,0,0,.25);animation:lkp 1.6s ease-in-out infinite}
.lk .go:active{transform:translateY(3px)}
@keyframes lkp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
.lk .br{font-size:10px;opacity:.55;margin-top:10px;letter-spacing:1px}
.lk .pz{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:40;background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:5px 12px;font-size:11px;font-weight:800}
`
  const html = `<div class="lk" id="lk"><div class="card">` +
    `<div class="ico">${o.ikonSvg || '<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>'}</div>` +
    `<h1>${esc(o.judul || 'GAME')}</h1><div class="sub">${esc(o.sub || 'THERYHANN ARCADE')}</div>` +
    `<p>${esc(o.deskripsi || '')}</p>` +
    `<div class="kt">${(o.kontrol || []).map(k => `<div><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join('')}</div>` +
    `<div class="lv" id="lkLv">${level.map((l, i) => `<span class="${i === 1 ? 'on' : ''}" data-i="${i}">${esc(l)}</span>`).join('')}</div>` +
    `<div class="rk"><span>🏆 Rekor<br><b id="lkRk">0</b></span><span>🎮 Main<br><b id="lkN">0</b></span><span>⭐ Terakhir<br><b id="lkL">0</b></span></div>` +
    `<button class="go" id="lkGo">▶ &nbsp;MULAI</button>` +
    `<div class="br">${esc(o.brand || 'THERYHANN!')} · ketuk MULAI · ${esc(o.id || '')}</div></div></div>`
  const js = `
window.__lock=(function(){
  var K='${esc(o.rekorKey || 'lk_' + (o.id || 'game'))}', el=document.getElementById('lk'), lv=1, W=document.querySelector('${o.wrap || '.g'}');
  function g(k){ try{return +localStorage.getItem(K+k)||0}catch(e){return 0} }
  function s(k,v){ try{localStorage.setItem(K+k,v)}catch(e){} }
  function refresh(){ document.getElementById('lkRk').textContent=g('_rk'); document.getElementById('lkN').textContent=g('_n'); document.getElementById('lkL').textContent=g('_l'); }
  refresh();
  document.querySelectorAll('#lkLv span').forEach(function(x){ x.addEventListener('click',function(){ document.querySelectorAll('#lkLv span').forEach(function(y){y.classList.remove('on')}); x.classList.add('on'); lv=+x.getAttribute('data-i'); }); });
  var api={ level:function(){return lv}, open:function(){ el.classList.remove('off'); if(W) W.classList.remove('on'); refresh(); window.scrollTo(0,0); }, close:function(){ el.classList.add('off'); if(W) W.classList.add('on'); window.scrollTo(0,0); },
    rekor:function(v){ v=+v||0; s('_l',v); s('_n',g('_n')+1); if(v>g('_rk')) s('_rk',v); refresh(); return g('_rk'); }, best:function(){return g('_rk')} };
  document.getElementById('lkGo').addEventListener('click',function(){ api.close(); if(window.__mulai) window.__mulai(lv); });
  return api;
})();`
  return { css, html, js }
}

export default { lockScreen }
