/**
 * lib/kartulevel.js — 🎉 KARTU NAIK LEVEL (v7.29.0)
 *  Kartu HTML ucapan selamat saat user naik level (dipicu addExp dari mana pun:
 *  chat, game, RPG, .addxp owner). Gaya: gradasi ungu-emas, confetti canvas,
 *  angka level membesar, ring EXP, hadiah level.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function kartuLevelHtml (brand, d = {}) {
  const data = { nama: String(d.nama || 'Member').slice(0, 24), dari: +d.dari || 1, ke: +d.ke || 2, hadiah: +d.hadiah || 0, exp: +d.exp || 0, butuh: +d.butuh || 100, gelar: String(d.gelar || '').slice(0, 24), brand: String(brand || 'THERYHANN!') }
  return `<style>
*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0b0716;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.w{max-width:480px;margin:0 auto;padding:10px}.f{position:relative;height:0;padding-bottom:135%;border-radius:28px;overflow:hidden;background:radial-gradient(120% 80% at 50% 0%,#5b21b6 0%,#1e0b3a 50%,#0b0716 100%);border:1px solid rgba(255,255,255,.14)}
canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.in{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px}
.t1{font-size:11px;letter-spacing:5px;color:#fcd34d;font-weight:800;animation:fd .8s both}
.t2{font-size:30px;font-weight:900;margin:6px 0 2px;letter-spacing:1px;background:linear-gradient(90deg,#fde68a,#fff,#fde68a);-webkit-background-clip:text;background-clip:text;color:transparent;animation:fd .8s .2s both}
.nm{font-size:15px;color:rgba(255,255,255,.85);animation:fd .8s .35s both}
.ring{position:relative;width:170px;height:170px;margin:22px 0 14px;animation:pop .9s .5s cubic-bezier(.2,1.6,.4,1) both}
.ring svg{width:100%;height:100%;transform:rotate(-90deg)}.ring circle{fill:none;stroke-width:10}.ring .bg{stroke:rgba(255,255,255,.12)}.ring .fg{stroke:url(#g);stroke-linecap:round;stroke-dasharray:502;stroke-dashoffset:502;animation:ring 1.6s 1s ease-out forwards}
.ring .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.ring .c small{font-size:10px;letter-spacing:3px;color:#fcd34d}.ring .c b{font-size:56px;line-height:1;font-weight:900}
.ring .old{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:56px;font-weight:900;opacity:.35;animation:out 1s 1.1s forwards}
.gl{font-size:12px;letter-spacing:2px;color:#c4b5fd;font-weight:800;animation:fd .8s 1.2s both}
.hd{display:flex;gap:8px;margin-top:14px;animation:fd .8s 1.5s both}.hd div{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:8px 12px;font-size:12px}.hd b{display:block;font-size:14px;color:#fde68a}
.ft{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,.45)}
@keyframes fd{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}@keyframes ring{to{stroke-dashoffset:${Math.round(502 - 502 * Math.min(1, data.exp / Math.max(1, data.butuh)))}}}@keyframes out{to{opacity:0;transform:translate(-50%,-140%) scale(.5)}}
</style><div class="w"><div class="f"><canvas id="cf"></canvas><div class="in">
<div class="t1">SELAMAT</div><div class="t2">LEVEL UP! 🎉</div><div class="nm">${esc(data.nama)}</div>
<div class="ring"><svg viewBox="0 0 180 180"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><circle class="bg" cx="90" cy="90" r="80"/><circle class="fg" cx="90" cy="90" r="80"/></svg><div class="c"><small>LEVEL</small><b>${data.ke}</b></div><div class="old">${data.dari}</div></div>
${data.gelar ? `<div class="gl">✦ ${esc(data.gelar)} ✦</div>` : ''}
<div class="hd"><div>Hadiah<b>💰 +${data.hadiah.toLocaleString('id-ID')}</b></div><div>EXP<b>${data.exp.toLocaleString('id-ID')} / ${data.butuh.toLocaleString('id-ID')}</b></div><div>HP & Energi<b>PULIH ✓</b></div></div>
</div><div class="ft">${esc(data.brand)} • AUTO LEVEL</div></div></div>
<script>(function(){var c=document.getElementById('cf'),x=c.getContext('2d'),P=[],W,H;function rs(){W=c.width=c.clientWidth*2;H=c.height=c.clientHeight*2}rs();var col=['#fde68a','#f59e0b','#a78bfa','#f472b6','#34d399','#fff'];for(var i=0;i<140;i++)P.push({x:Math.random()*W,y:-Math.random()*H,r:4+Math.random()*8,v:2+Math.random()*4,a:Math.random()*6,s:(Math.random()-.5)*.2,c:col[i%col.length],w:Math.random()<.5});
function f(){x.clearRect(0,0,W,H);P.forEach(function(p){p.y+=p.v;p.a+=p.s;p.x+=Math.sin(p.a)*1.5;if(p.y>H+20){p.y=-20;p.x=Math.random()*W}x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;if(p.w)x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);else{x.beginPath();x.arc(0,0,p.r/2,0,7);x.fill()}x.restore()});requestAnimationFrame(f)}f()})();</script>`
}

/** gelar per level (dipakai kartu & profil) */
export function gelarLevel (lv) {
  const G = [[1, 'Pendatang Baru'], [5, 'Warga'], [10, 'Petualang'], [20, 'Pejuang'], [30, 'Ksatria'], [45, 'Veteran'], [60, 'Elit'], [80, 'Legenda'], [100, 'Dewa Server']]
  let g = G[0][1]; for (const [l, n] of G) if (lv >= l) g = n
  return g
}
export default { kartuLevelHtml, gelarLevel }
