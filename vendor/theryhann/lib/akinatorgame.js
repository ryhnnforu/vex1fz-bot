/**
 * lib/akinatorgame.js — AKINATOR dimainkan DI DALAM kartu HTML (v7.35.0)
 * ------------------------------------------------------------------
 * .akinator → kartu game: start → ±20 pertanyaan (5 tombol jawab) →
 * tebakan (Ya/Bukan, maks 3) → menang (kode klaim koin!) / kalah.
 * Mesin (45 Q + 70 tokoh + AI) = lib/akinengine.js, disisip MENTAH ke
 * <script> — satu-satunya sumber logika (test-v735 mensimulasikan 70/70).
 * Menang → kode AKIN-..x.-.... → klaim via `.akinklaim <kode>` (koin+EXP+skor).
 * Fallback: bila html-app gagal terkirim, features/akinator.js memakai mode
 * chat (tombol) seperti dulu — tanpa kartu per-pertanyaan lagi.
 */
import { readFileSync } from 'node:fs'

const ENGINE = readFileSync(new URL('./akinengine.js', import.meta.url), 'utf8')
  .replace(/<\/(script)/gi, '<\\/$1')

export const AKINATOR_RATIO = '192%'

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#0f0d2e;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:${AKINATOR_RATIO};border-radius:32px;overflow:hidden;background:radial-gradient(120% 55% at 50% 0%,#4c1d95 0%,#2e1065 34%,#1e1b4b 60%,#0b0a24 100%);border:1px solid rgba(251,191,36,.25);box-shadow:0 24px 60px rgba(0,0,0,.55)}
.bg{position:absolute;inset:0;overflow:hidden}
.bg i{position:absolute;background:#fff;border-radius:50%;animation:tw 3s infinite}
@keyframes tw{0%,100%{opacity:.15}50%{opacity:.9}}
.in{position:absolute;inset:0;display:flex;flex-direction:column;padding:14px 14px 10px;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:thin}
.hd{text-align:center;flex:none}
.hd .t1{font-size:10px;letter-spacing:5px;color:#fbbf24;font-weight:800;animation:fd .6s both}
.hd .t2{font-size:23px;font-weight:900;margin-top:2px;animation:fd .6s .12s both}
@keyframes fd{from{opacity:0;transform:translateY(10px)}}
.jwrap{position:relative;flex:none;height:172px;margin-top:2px}
.jwrap svg{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);height:215px;animation:flo 4.2s ease-in-out infinite}
@keyframes flo{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-9px)}}
.jmuka{transform-origin:150px 150px;animation:sway 5s ease-in-out infinite}
@keyframes sway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}
.jmatai{transform-origin:center;animation:blink 4.2s infinite}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.08)}}
.jpupil{animation:pglow 2.6s ease-in-out infinite}
@keyframes pglow{50%{fill:#a5f3fc}}
.jglow{animation:jgl 3s ease-in-out infinite}
@keyframes jgl{50%{opacity:.35}}
.jtw path{animation:tw 2.6s infinite}
.jasap{position:absolute;bottom:6px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,rgba(165,243,252,.85),rgba(165,243,252,0) 70%);animation:smk 3.4s linear infinite;opacity:0}
@keyframes smk{0%{transform:translateY(0) scale(.7);opacity:0}25%{opacity:.9}100%{transform:translateY(-70px) translateX(var(--ax,8px)) scale(2.1);opacity:0}}
.box{flex:none;background:rgba(255,255,255,.08);border:1px solid rgba(251,191,36,.3);border-radius:20px;padding:14px;margin-top:6px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:pop .45s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}}
.box h3{font-size:15px;text-align:center}
.box .q{font-size:17px;font-weight:800;text-align:center;margin-top:8px;line-height:1.45;min-height:50px}
.bar{height:8px;background:rgba(255,255,255,.14);border-radius:99px;margin-top:10px;overflow:hidden}
.bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:99px;transition:width .4s}
.meta{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.65);margin-top:6px}
.btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.btns.one{grid-template-columns:1fr}
button{font-family:inherit;border:0;cursor:pointer;border-radius:14px;padding:12px 8px;font-size:14px;font-weight:800;color:#fff;background:linear-gradient(135deg,#7c3aed,#4c1d95);box-shadow:0 4px 0 #2e1065,0 8px 18px rgba(0,0,0,.35);transition:transform .12s}
button:active{transform:scale(.94)}
button.y{background:linear-gradient(135deg,#10b981,#065f46);box-shadow:0 4px 0 #064e3b,0 8px 18px rgba(0,0,0,.35)}
button.n{background:linear-gradient(135deg,#f43f5e,#881337);box-shadow:0 4px 0 #4c0519,0 8px 18px rgba(0,0,0,.35)}
button.g{background:linear-gradient(135deg,#f59e0b,#92400e);box-shadow:0 4px 0 #451a03,0 8px 18px rgba(0,0,0,.35)}
button.big{font-size:16px;padding:14px}
.chips{display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap}
.chips span{font-size:11px;background:rgba(251,191,36,.14);border:1px solid rgba(251,191,36,.35);padding:5px 10px;border-radius:99px}
.emo{font-size:64px;text-align:center;animation:pop .5s .15s cubic-bezier(.2,1.6,.4,1) both}
.tokoh{font-size:21px;font-weight:900;text-align:center;margin-top:4px}
.desc{font-size:12px;color:rgba(255,255,255,.7);text-align:center;margin-top:4px}
.rew{display:flex;gap:8px;margin-top:12px}
.rew div{flex:1;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);border-radius:12px;padding:8px 4px;text-align:center}
.rew b{display:block;font-size:16px;color:#fde68a}
.rew small{font-size:10px;color:rgba(255,255,255,.65)}
.kode{margin-top:12px;background:#000;border:1px dashed #fbbf24;border-radius:14px;padding:10px;text-align:center}
.kode small{display:block;font-size:10px;letter-spacing:2px;color:#fbbf24}
.kode b{font-family:ui-monospace,Menlo,monospace;font-size:20px;letter-spacing:1px;color:#fff}
.kode p{font-size:11px;color:rgba(255,255,255,.7);margin-top:6px;line-height:1.5}
.best{text-align:center;font-size:11px;color:rgba(255,255,255,.6);margin-top:10px}
.ft{text-align:center;font-size:10px;color:rgba(255,255,255,.4);margin-top:auto;padding-top:8px;flex:none}
.terawang{text-align:center;font-size:52px;animation:tera 1s ease-in-out infinite}
@keyframes tera{50%{transform:scale(1.15) rotate(8deg);filter:brightness(1.4)}}
.cnv{position:absolute;inset:0;pointer-events:none}
.hide{display:none!important}
`

/* jin SVG — ekspresi via parameter (happy^^ / normal / X_X). Tanpa backtick. */
const PAGE = String.raw`
(function(){
var $=function(id){return document.getElementById(id)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var MATA={n:'<g class="jmatai"><ellipse cx="122" cy="148" rx="17" ry="19" fill="#fff"/><ellipse cx="178" cy="148" rx="17" ry="19" fill="#fff"/><circle class="jpupil" cx="122" cy="150" r="8" fill="#22d3ee"/><circle class="jpupil" cx="178" cy="150" r="8" fill="#22d3ee"/><circle cx="125" cy="147" r="2.6" fill="#fff"/><circle cx="181" cy="147" r="2.6" fill="#fff"/></g>',
h:'<g stroke="#082f49" stroke-width="7" stroke-linecap="round" fill="none"><path d="M108 148 Q122 134 136 148"/><path d="M164 148 Q178 134 192 148"/></g>',
x:'<g stroke="#082f49" stroke-width="6" stroke-linecap="round"><path d="M110 140 L134 156 M134 140 L110 156"/><path d="M166 140 L190 156 M190 140 L166 156"/></g>'};
var MULUT={n:'<path d="M132 189 Q154 199 174 184" stroke="#082f49" stroke-width="6" stroke-linecap="round" fill="none"/>',
h:'<path d="M128 187 Q150 203 176 185" stroke="#082f49" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M135 191 Q150 201 168 189" stroke="#f87171" stroke-width="4" stroke-linecap="round" fill="none"/>',
x:'<path d="M130 193 Q140 186 150 193 Q160 200 172 191" stroke="#082f49" stroke-width="6" stroke-linecap="round" fill="none"/>'};
var ALIS={n:'<g stroke="#082f49" stroke-width="8" stroke-linecap="round" fill="none"><path d="M102 122 Q122 112 142 120"/><path d="M158 120 Q178 112 198 122"/></g>',
h:'<g stroke="#082f49" stroke-width="8" stroke-linecap="round" fill="none"><path d="M102 122 Q122 112 142 120"/><path d="M158 120 Q178 112 198 122"/></g>',
x:'<g stroke="#082f49" stroke-width="7" stroke-linecap="round"><path d="M104 116 L140 128"/><path d="M196 116 L160 128"/></g>'};
function jin(exp){
return '<svg viewBox="0 0 300 372"><defs>'
+'<linearGradient id="jskin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset=".55" stop-color="#0ea5e9"/><stop offset="1" stop-color="#0369a1"/></linearGradient>'
+'<linearGradient id="jgold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fef3c7"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient>'
+'<linearGradient id="jtur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient>'
+'<radialGradient id="jglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#22d3ee" stop-opacity=".8"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient></defs>'
+'<ellipse cx="150" cy="330" rx="105" ry="26" fill="url(#jglow)" class="jglow"/>'
+'<g><path d="M150 372 C120 340 170 330 150 300 C135 275 165 268 150 244 L150 372" fill="#0ea5e9" opacity=".85"/><path d="M150 372 C175 345 130 335 152 305 C165 285 140 275 150 250" fill="#38bdf8" opacity=".55"/></g>'
+'<path d="M96 268 Q150 246 204 268 L196 300 Q150 284 104 300 Z" fill="url(#jgold)" opacity=".95"/>'
+'<ellipse cx="96" cy="228" rx="20" ry="34" fill="url(#jskin)" transform="rotate(18 96 228)"/><ellipse cx="204" cy="228" rx="20" ry="34" fill="url(#jskin)" transform="rotate(-18 204 228)"/>'
+'<path d="M70 218 Q110 244 150 244 Q190 244 230 218" stroke="url(#jskin)" stroke-width="34" stroke-linecap="round" fill="none"/>'
+'<circle cx="72" cy="214" r="15" fill="url(#jgold)"/><circle cx="228" cy="214" r="15" fill="url(#jgold)"/><circle cx="72" cy="214" r="6" fill="#ef4444"/><circle cx="228" cy="214" r="6" fill="#ef4444"/>'
+'<g class="jmuka"><ellipse cx="96" cy="150" rx="13" ry="20" fill="#0284c7"/><ellipse cx="204" cy="150" rx="13" ry="20" fill="#0284c7"/>'
+'<rect x="100" y="96" width="100" height="104" rx="42" fill="url(#jskin)"/>'+ALIS[exp]+MATA[exp]+MULUT[exp]+'</g>'
+'<path d="M92 108 Q86 60 130 44 Q120 66 132 74 Q124 52 158 46 Q150 68 162 72 Q160 50 196 56 Q214 62 210 108 Q150 88 92 108 Z" fill="url(#jtur)"/>'
+'<path d="M92 108 Q150 88 210 108 L204 122 Q150 104 96 122 Z" fill="url(#jgold)"/>'
+'<circle cx="150" cy="104" r="11" fill="url(#jgold)"/><circle cx="150" cy="104" r="6" fill="#ef4444"/>'
+'<g fill="#fef9c3" class="jtw"><path d="M52 120 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z"/><path d="M248 108 l2.4 6.5 6.5 2.4 -6.5 2.4 -2.4 6.5 -2.4-6.5 -6.5-2.4 6.5-2.4z" style="animation-delay:.7s"/><path d="M260 200 l2.6 7 7 2.6 -7 2.6 -2.6 7 -2.6-7 -7-2.6 7-2.6z" style="animation-delay:1.9s"/></g></svg>'}
function setJin(exp){$('jin').innerHTML=jin(exp)+'<i class="jasap" style="left:38%;--ax:10px"></i><i class="jasap" style="left:52%;animation-delay:1.1s;--ax:-12px"></i><i class="jasap" style="left:63%;animation-delay:2.2s;--ax:9px"></i>'}
var S=null;
function baca(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function tulis(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function best(){var b=baca('akinBest',0),w=baca('akinWin',0),l=baca('akinLose',0);return '🏆 menang '+w+'× · kalah '+l+'×'+(b?' · tercepat '+b+' tanya':'')}
function show(id){var ids=['st','qy','tb','wn','ls'];for(var i=0;i<ids.length;i++)$(ids[i]).className=(ids[i]===id?'box':'box hide')}
function mulai(){
S=akinBaru();var qi=akinPilihQ(S);S.cur=qi<0?0:qi;S.asked.push(S.cur);setJin('n');tanya()
}
function tanya(){
var q=AKIN_Q[S.cur];
$('qy').innerHTML='<h3>❓ Pertanyaan '+S.asked.length+' / '+20+'</h3><div class="q">'+esc(q.t)+'</div>'
+'<div class="bar"><i style="width:'+Math.round(S.asked.length/20*100)+'%"></i></div>'
+'<div class="meta"><span>🎯 tebakan ke-'+(S.tebakan.length+1)+'</span><span>'+S.asked.length+' tanya</span></div>'
+'<div class="btns"><button class="y" data-v="1">👍 Ya</button><button class="n" data-v="-1">👎 Tidak</button>'
+'<button data-v="0">🤷 Gatau</button><button data-v="0.6">🙂 Mungkin</button></div>'
+'<div class="btns one" style="margin-top:8px"><button data-v="-0.6">🙃 Mungkin Tidak</button></div>';
show('qy');
var bs=$('qy').querySelectorAll('button');
for(var i=0;i<bs.length;i++)bs[i].onclick=function(){jawab(parseFloat(this.getAttribute('data-v')))}
}
function jawab(v){
var h=akinJawab(S,v);
if(h==='tanya'){tanya();return}
if(h==='tebak'){tebak();return}
if(h==='menang'){menang();return}
kalah()
}
function tebak(){
var g=AKIN_CHARS[S.tebakIdx];
setJin('n');
$('tb').innerHTML='<h3>🔮 Aku Menerawang...</h3><div class="terawang">🔮</div><div class="desc">Tebakan ke-'+S.tebakan.length+' dari 3</div>';
show('tb');
setTimeout(function(){
$('tb').innerHTML='<h3>🔮 Tebakan ke-'+S.tebakan.length+'</h3><div class="emo">'+esc(g.e)+'</div><div class="tokoh">'+esc(g.n)+'</div><div class="desc">'+esc(g.d)+'</div><div class="q" style="min-height:0;font-size:15px">Apakah aku benar? 🧞</div>'
+'<div class="btns"><button class="y" id="by">✅ Ya, benar!</button><button class="n" id="bn">❌ Bukan!</button></div>';
$('by').onclick=function(){jawab(1)};$('bn').onclick=function(){jawab(-1)}
},1100)
}
function hitung(el, target, ms){
var t0=Date.now();(function f(){var p=Math.min(1,(Date.now()-t0)/ms);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString('id-ID');if(p<1)requestAnimationFrame(f)})()
}
function konfeti(){
var c=$('cnv'),x=c.getContext('2d');c.width=440;c.height=800;
var P=[],C=['#fbbf24','#f472b6','#22d3ee','#a3e635','#fff'];
for(var i=0;i<110;i++)P.push({x:Math.random()*440,y:-20-Math.random()*300,v:2+Math.random()*3.4,s:Math.random()*6.28,vs:.05+Math.random()*.12,r:3+Math.random()*4,c:C[i%C.length],w:Math.random()<.5});
(function f(){x.clearRect(0,0,440,800);var hidup=false;
for(var i=0;i<P.length;i++){var p=P[i];p.y+=p.v;p.s+=p.vs;p.x+=Math.sin(p.s)*1.4;if(p.y<820)hidup=true;
x.save();x.translate(p.x,p.y);x.rotate(p.s);x.fillStyle=p.c;
if(p.w)x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);else{x.beginPath();x.arc(0,0,p.r/2,0,7);x.fill()}x.restore()}
if(hidup)requestAnimationFrame(f);else x.clearRect(0,0,440,800)})()
}
function salin(t){
try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();
var ok=document.execCommand&&document.execCommand('copy');document.body.removeChild(ta);return ok}catch(e){return false}}
function menang(){
var g=AKIN_CHARS[S.tebakIdx],hd=akinHadiah(S.asked.length,S.tebakan.length),kode=akinKode(S.asked.length,S.tebakan.length);
setJin('h');konfeti();
tulis('akinWin',baca('akinWin',0)+1);
var b=baca('akinBest',0);if(!b||S.asked.length<b)tulis('akinBest',S.asked.length);
$('wn').innerHTML='<h3>🎉 BENAR! Aku Memang Jin Terpintar!</h3><div class="emo">'+esc(g.e)+'</div><div class="tokoh">'+esc(g.n)+'</div>'
+'<div class="desc">'+esc(g.d)+'<br>'+S.asked.length+' pertanyaan + '+S.tebakan.length+' tebakan</div>'
+'<div class="rew"><div><b id="r1">0</b><small>💰 koin</small></div><div><b id="r2">0</b><small>✨ EXP</small></div><div><b id="r3">0</b><small>🏆 skor</small></div></div>'
+'<div class="kode"><small>KODE KLAIM HADIAH</small><b>'+kode+'</b><p>Salin kode ini lalu kirim ke bot:<br><b>.akinklaim '+kode+'</b><br>untuk menerima koin + EXP + skor! 🎁</p></div>'
+'<div class="btns" style="margin-top:10px"><button class="g" id="bs">📋 Salin Kode</button><button id="bl">🔮 Main Lagi</button></div>'
+'<div class="best">'+best()+'</div>';
show('wn');
hitung($('r1'),hd.koin,1200);hitung($('r2'),hd.exp,1200);hitung($('r3'),hd.skor,1500);
$('bs').onclick=function(){salin(kode);this.textContent='✅ Tersalin!';setTimeout(function(){$('bs').textContent='📋 Salin Kode'},1800)};
$('bl').onclick=mulai
}
function kalah(){
setJin('x');tulis('akinLose',baca('akinLose',0)+1);
$('ls').innerHTML='<h3>😤 Kamu Menang Kali Ini!</h3><div class="q">Aku menyerah setelah '+S.asked.length+' pertanyaan...<br>Tokohmu terlalu misterius! 💨</div>'
+'<div class="btns one" style="margin-top:10px"><button class="big" id="bt">💪 Tantang Lagi</button></div>'
+'<div class="best">'+best()+'</div>';
show('ls');$('bt').onclick=mulai
}
setJin('n');
$('bs0').onclick=mulai;
$('best0').textContent=best();
})();`

export function akinatorHtml (brand = 'THERYHANN!') {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const bintang = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 37 + 11) % 100, y = (i * 53 + 7) % 100, r = 1 + (i % 3) * 0.7
    return `<i style="left:${x}%;top:${y}%;width:${r}px;height:${r}px;animation-delay:${(i % 10) * 0.3}s"></i>`
  }).join('')
  return `<style>${CSS}</style><div class="w"><div class="f"><div class="bg">${bintang}</div><canvas id="cnv" class="cnv"></canvas><div class="in">` +
    `<div class="hd"><div class="t1">JIN PENEBAK PIKIRAN</div><div class="t2">🧞 AKINATOR</div></div>` +
    `<div class="jwrap" id="jin"></div>` +
    `<div class="box" id="st"><h3>Pikirkan satu TOKOH!</h3><div class="q" style="font-size:14px;font-weight:400">Nyata atau fiksi, siapa saja —<br>jawab JUJUR ±20 pertanyaan Ya/Tidak.</div>` +
    `<div class="chips"><span>❓ ±20 tanya</span><span>🔮 3 tebakan</span><span>🎁 koin menanti</span></div>` +
    `<div class="btns one" style="margin-top:12px"><button class="big g" id="bs0">🔮 MULAI BERMAIN</button></div>` +
    `<div class="best" id="best0"></div></div>` +
    `<div class="box hide" id="qy"></div><div class="box hide" id="tb"></div>` +
    `<div class="box hide" id="wn"></div><div class="box hide" id="ls"></div>` +
    `<div class="ft">${esc(brand)} • AKINATOR v7.35</div>` +
    `</div></div></div><script>${ENGINE}</script><script>${PAGE}</script>`
}

export default { akinatorHtml, AKINATOR_RATIO }
