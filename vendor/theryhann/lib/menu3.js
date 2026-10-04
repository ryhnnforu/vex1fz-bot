/**
 * lib/menu3.js — v7.27.0 · MENU3: kartu HTML TEKS SAJA
 *  Gaya sama dengan MENU2 (latar blob animasi + partikel + grid), tapi isinya
 *  murni teks ala referensi (sapaan, status, keterangan simbol, daftar
 *  kategori) dan RASIO BERBEDA: 480×600 = 125%… tidak — game 125–133%, menu2
 *  187%, jadi MENU3 memakai 175% (portrait tinggi) agar mudah dibedakan.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const MENU3_RATIO = '175%'

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#06060f;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#f5f3ff;overflow-x:hidden}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:${MENU3_RATIO};border-radius:30px;overflow:hidden;background:radial-gradient(120% 70% at 20% 0%,#2a1a5e 0%,#0b0a1f 55%,#06060f 100%);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 60px rgba(0,0,0,.5)}
.f:before{content:"";position:absolute;inset:8px;border-radius:24px;border:1px solid rgba(253,224,171,.22);pointer-events:none;z-index:3}
.bg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden}
.bl{position:absolute;border-radius:50%;filter:blur(50px);opacity:.55;animation:fl 14s ease-in-out infinite alternate}
.b1{width:280px;height:280px;background:#d946ef;left:-90px;top:-80px}
.b2{width:320px;height:320px;background:#4f46e5;right:-120px;top:160px;animation-duration:17s;animation-delay:-5s}
.b3{width:240px;height:240px;background:#f59e0b;left:10px;bottom:-60px;animation-duration:19s;animation-delay:-9s;opacity:.35}
@keyframes fl{0%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.15)}100%{transform:translate(-30px,50px) scale(.95)}}
.pt{position:absolute;width:3px;height:3px;border-radius:50%;background:#fde68a;opacity:.5;animation:up linear infinite}
@keyframes up{0%{transform:translateY(0);opacity:0}10%{opacity:.8}100%{transform:translateY(-800px);opacity:0}}
.grid{position:absolute;left:0;top:0;width:100%;height:100%;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:30px 30px;mask-image:linear-gradient(#000,transparent 85%);-webkit-mask-image:linear-gradient(#000,transparent 85%)}
.in{position:absolute;left:0;top:0;width:100%;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:thin;padding:24px 22px 18px;font-size:13px;line-height:1.7}
.a{animation:fd .7s cubic-bezier(.2,1,.3,1) both;opacity:0}@keyframes fd{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.eyebrow{font-size:10px;letter-spacing:5px;color:#fcd34d;font-weight:800;text-align:center}
.brand{font-family:Georgia,"Times New Roman",serif;font-size:32px;letter-spacing:2px;text-align:center;font-weight:700;line-height:1.1;margin-top:4px;background:linear-gradient(90deg,#fde68a,#fff 40%,#fbcfe8 70%,#fde68a);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sh 7s linear infinite,fd .7s both}
@keyframes sh{to{background-position:250% 0}}
.rule{display:flex;align-items:center;gap:10px;margin:10px 0 12px;color:#fcd34d;font-size:11px;letter-spacing:3px}.rule:before,.rule:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(253,224,171,.6),transparent)}
.sapa{text-align:center;font-size:13px;color:rgba(255,255,255,.88)}.sapa b{color:#fbcfe8;font-weight:800}
.card{margin-top:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:12px 14px;backdrop-filter:blur(10px)}
.h{font-size:10px;letter-spacing:3px;color:#fcd34d;font-weight:800;margin-bottom:6px;display:flex;align-items:center;gap:8px}.h:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(253,224,171,.5),transparent)}
.r{display:flex;gap:8px;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.08)}.r:last-child{border:0}.r i{font-style:normal;color:rgba(255,255,255,.6);width:112px;flex:none;text-transform:uppercase;font-size:10.5px;letter-spacing:1.2px;line-height:22px}.r b{font-weight:700;color:#fff;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sym{display:flex;gap:10px;flex-wrap:wrap}.sym span{font-size:11px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:3px 10px}
.cat{columns:2;column-gap:14px}.cat div{break-inside:avoid;font-size:11.5px;letter-spacing:.6px;color:rgba(255,255,255,.92);display:flex;justify-content:space-between;padding:2px 0}.cat span{color:#fcd34d;font-size:10px;font-weight:800;font-family:ui-monospace,Menlo,monospace}
.tip{margin-top:12px;font-size:10.5px;color:rgba(255,255,255,.55);line-height:1.6;text-align:center}
.ft{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:9px;letter-spacing:4px;color:rgba(253,224,171,.5);z-index:4;animation:tw 3s ease-in-out infinite}@keyframes tw{50%{opacity:.3}}
`
const JS = String.raw`(function(){var bg=document.getElementById('bg');for(var i=0;i<22;i++){var p=document.createElement('div');p.className='pt';p.style.left=(Math.random()*100)+'%';p.style.top=(60+Math.random()*50)+'%';p.style.animationDuration=(8+Math.random()*10)+'s';p.style.animationDelay=(-Math.random()*12)+'s';p.style.width=p.style.height=(2+Math.random()*4)+'px';bg.appendChild(p)}})();`

/**
 * @param {object} d { brand, sapa, nama, baris:[[label,nilai]], simbol:[string], kategori:[[nama,jumlah]], catatan:[string], prefix }
 */
export function menu3Html (d = {}) {
  const brand = esc(d.brand || 'THERYHANN!')
  return `<style>${CSS}</style><div class="w"><div class="f"><div class="bg" id="bg"><div class="grid"></div><div class="bl b1"></div><div class="bl b2"></div><div class="bl b3"></div></div><div class="in">` +
    `<div class="eyebrow a">✦ MENU UTAMA ✦</div><div class="brand">${brand}</div>` +
    `<div class="rule a" style="animation-delay:.1s">SELAMAT ${esc(String(d.sapa || 'DATANG').toUpperCase())}</div>` +
    `<div class="sapa a" style="animation-delay:.15s">Halo <b>@${esc(d.nama || 'kakak')}</b>, selamat datang di <b>${brand}</b> — santai sebentar yuk ☕</div>` +
    `<div class="card a" style="animation-delay:.25s"><div class="h">INFO KAMU</div>` + (d.baris || []).map(([k, v]) => `<div class="r"><i>${esc(k)}</i><b>${esc(v)}</b></div>`).join('') + '</div>' +
    `<div class="card a" style="animation-delay:.35s"><div class="h">KETERANGAN SIMBOL</div><div class="sym">` + (d.simbol || ['Ⓕ Free', 'Ⓟ Premium', 'Ⓞ Owner']).map(s => `<span>${esc(s)}</span>`).join('') + '</div></div>' +
    `<div class="card a" style="animation-delay:.45s"><div class="h">DAFTAR KATEGORI · ${(d.kategori || []).length}</div><div class="cat">` + (d.kategori || []).map(([k, n]) => `<div><span style="color:#fff;font-family:inherit;font-weight:400">▹ ${esc(k)}</span><span>${esc(n)}</span></div>`).join('') + '</div></div>' +
    `<div class="tip a" style="animation-delay:.55s">${(d.catatan || []).map(esc).join('<br>')}</div>` +
    `</div><div class="ft">${brand}</div></div></div><script>${JS}</script>`
}
export default { menu3Html, MENU3_RATIO }
