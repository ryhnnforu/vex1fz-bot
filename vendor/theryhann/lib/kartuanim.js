/**
 * lib/kartuanim.js — ✨ KUMPULAN KARTU HTML ANIMASI (v7.31.0)
 *  Semua kartu self-contained (tanpa CDN), aman untuk webview WA:
 *  tidak ada position:fixed / 100vh / aspect-ratio; rasio dibuat dengan padding-bottom.
 *
 *  kartuGuildBaru(brand,d)     — perayaan guild didirikan (lambang tumbuh, kilau, konfeti)
 *  kartuListGuild(brand,d)     — daftar guild, area SCROLL ke bawah, item muncul bertahap
 *  kartuMemberGuild(brand,d)   — anggota satu guild (scroll), pemimpin berbintang
 *  kartuDaftarBaru(brand,d)    — pendaftaran: "ID card" tercetak + stempel VERIFIED
 *  kartuStat(brand,d)          — kartu berbeda per jenis: money (koin jatuh), xp (bar terisi),
 *                                limit (baterai), level (roda gigi/ring) — angka menghitung naik
 *  kartuQris(brand,d)          — QRIS donasi (gambar QR data-URI) + animasi scan
 *  kartuLbHub(brand,d)         — hub leaderboard (podium 3 besar + kategori)
 *  kartuTop(brand,d)           — papan peringkat satu kategori (podium + list scroll, nama user)
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const n = v => (Number(v) || 0).toLocaleString('id-ID')
const ini = nama => (String(nama || '?').trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('') || '?').toUpperCase()
const BASE = `*{box-sizing:border-box;margin:0;padding:0}html,body{background:#06070d;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff;-webkit-tap-highlight-color:transparent}
.w{max-width:480px;margin:0 auto;padding:8px}.f{position:relative;height:0;overflow:hidden;border-radius:26px;border:1px solid rgba(255,255,255,.12)}
.in{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;padding-bottom:24px}
.in::-webkit-scrollbar{width:0;height:0}
.ft{text-align:center;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,.45);padding:8px 0 10px}
.bgc{position:absolute;left:0;top:0;width:100%;height:100%}
@keyframes fd{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.2) rotate(-20deg)}70%{transform:scale(1.12) rotate(4deg)}to{opacity:1;transform:none}}
@keyframes sl{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}
@keyframes flo{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shine{0%{left:-60%}100%{left:130%}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;padding:0 14px 14px}
.scroll::-webkit-scrollbar{width:4px}.scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.25);border-radius:4px}
.hint{text-align:center;font-size:10px;color:rgba(255,255,255,.5);padding:4px;animation:blink 1.6s infinite}
.av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex:none}`
const konfeti = (id = 'cf', warna = "['#fde68a','#f59e0b','#a78bfa','#f472b6','#34d399','#fff']", jml = 120) => `<script>(function(){var c=document.getElementById('${id}');if(!c)return;var x=c.getContext('2d'),P=[],W,H;function rs(){W=c.width=c.clientWidth*2;H=c.height=c.clientHeight*2}rs();var col=${warna};for(var i=0;i<${jml};i++)P.push({x:Math.random()*W,y:-Math.random()*H,r:4+Math.random()*8,v:2+Math.random()*4,a:Math.random()*6,s:(Math.random()-.5)*.2,c:col[i%col.length],w:Math.random()<.6});
function f(){x.clearRect(0,0,W,H);P.forEach(function(p){p.y+=p.v;p.a+=p.s;p.x+=Math.sin(p.a)*1.5;if(p.y>H+20){p.y=-20;p.x=Math.random()*W}x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;if(p.w)x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);else{x.beginPath();x.arc(0,0,p.r/2,0,7);x.fill()}x.restore()});requestAnimationFrame(f)}f()})()</script>`
const hitung = `<script>(function(){var els=document.querySelectorAll('[data-n]');els.forEach(function(el){var t=+el.getAttribute('data-n')||0,d=+el.getAttribute('data-d')||1400,s=null;function st(ts){if(!s)s=ts;var p=Math.min(1,(ts-s)/d);p=1-Math.pow(1-p,3);el.textContent=Math.round(t*p).toLocaleString('id-ID');if(p<1)requestAnimationFrame(st)}setTimeout(function(){requestAnimationFrame(st)},+el.getAttribute('data-w')||300)})})()</script>`
const bintang = (jml = 60) => `<script>(function(){var c=document.getElementById('st');if(!c)return;var x=c.getContext('2d'),W,H,S=[];W=c.width=c.clientWidth*2;H=c.height=c.clientHeight*2;for(var i=0;i<${jml};i++)S.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2.2+.4,p:Math.random()*6,v:.01+Math.random()*.03});function f(){x.clearRect(0,0,W,H);S.forEach(function(s){s.p+=s.v;x.globalAlpha=.35+Math.abs(Math.sin(s.p))*.65;x.fillStyle='#fff';x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill()});x.globalAlpha=1;requestAnimationFrame(f)}f()})()</script>`

/* ───────────────────────── 1. GUILD BARU ───────────────────────── */
export function kartuGuildBaru (brand, d = {}) {
  /* v7.32.0 — ditulis ulang: spanduk terbentang + lambang glow + partikel bara, easing spring halus */
  const nama = String(d.nama || 'Guild').slice(0, 24); const pemimpin = String(d.pemimpin || 'Pemimpin').slice(0, 22)
  const EASE = 'cubic-bezier(.16,1,.3,1)'
  return `<style>${BASE}
.f{padding-bottom:152%;background:radial-gradient(120% 70% at 50% 0%,#7c2d12 0%,#3b0a0a 45%,#0a0507 100%)}
.rays{position:absolute;left:50%;top:-40%;width:200%;aspect-ratio:1;transform:translateX(-50%);background:repeating-conic-gradient(from 0deg,rgba(251,191,36,.07) 0deg 9deg,transparent 9deg 18deg);border-radius:50%;animation:spin 46s linear infinite;pointer-events:none}
.emb{position:absolute;bottom:-10px;border-radius:50%;background:radial-gradient(circle,#fde68a,#f59e0b00 70%);animation:naik linear infinite;pointer-events:none}
@keyframes naik{0%{transform:translateY(0) scale(1);opacity:0}12%{opacity:.9}100%{transform:translateY(-560px) scale(.3);opacity:0}}
.top{text-align:center;padding:24px 16px 0;position:relative;z-index:2}.t1{font-size:11px;letter-spacing:6px;color:#fbbf24;font-weight:800}
.t1 span{display:inline-block;opacity:0;animation:huruf .7s ${EASE} both}
@keyframes huruf{from{opacity:0;transform:translateY(16px) rotate(6deg)}to{opacity:1;transform:none}}
.t2{font-size:30px;font-weight:900;margin-top:6px;background:linear-gradient(90deg,#fde68a,#fff,#fde68a);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;animation:judul 1.1s .35s ${EASE} both,judulshine 4s 1.6s linear infinite}
@keyframes judul{from{opacity:0;transform:scale(.7);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes judulshine{to{background-position:200% 0}}
.pan{position:relative;width:230px;margin:18px auto 0;z-index:2}
.pan .kayu{height:10px;border-radius:6px;background:linear-gradient(180deg,#a16207,#713f12);box-shadow:0 4px 10px rgba(0,0,0,.5);opacity:0;animation:fd .6s .7s ${EASE} both}
.pan .kayu:before,.pan .kayu:after{content:"";position:absolute;top:-4px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fde68a,#b45309)}
.pan .kayu:before{left:-6px}.pan .kayu:after{right:-6px}
.pan .kain{margin:0 8px;background:linear-gradient(180deg,#b91c1c,#7f1d1d 70%,#450a0a);border:1px solid rgba(253,230,138,.4);border-top:0;border-radius:0 0 14px 14px;transform-origin:top center;transform:scaleY(0);opacity:0;animation:bentang 1s .85s ${EASE} both;box-shadow:0 18px 40px rgba(0,0,0,.5)}
@keyframes bentang{0%{transform:scaleY(0);opacity:0}40%{opacity:1}100%{transform:scaleY(1);opacity:1}}
.crest{position:relative;width:120px;height:132px;margin:14px auto 0}
.crest svg{width:100%;height:100%;filter:drop-shadow(0 10px 24px rgba(251,191,36,.4))}
.crest .lt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:900;color:#fde68a;text-shadow:0 2px 12px rgba(0,0,0,.6);padding-bottom:10px}
.crest .ring{position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(253,230,138,.7);opacity:0;animation:ringx 1s 1.5s ${EASE} both}
@keyframes ringx{from{opacity:.9;transform:scale(.55)}to{opacity:0;transform:scale(1.25)}}
.crest .sh{position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);animation:shine 2.6s 2s infinite}
.crest{opacity:0;animation:pop2 1s 1.15s ${EASE} both}
@keyframes pop2{from{opacity:0;transform:scale(.3) rotate(-14deg)}60%{opacity:1;transform:scale(1.08) rotate(2deg)}to{opacity:1;transform:none}}
.nm{text-align:center;font-size:23px;font-weight:900;margin-top:12px;letter-spacing:1px;position:relative;z-index:2;opacity:0;animation:fd .8s 1.7s ${EASE} both}
.ld{display:flex;align-items:center;justify-content:center;gap:6px;margin:8px auto 0;width:fit-content;background:rgba(0,0,0,.4);border:1px solid rgba(251,191,36,.5);border-radius:999px;padding:6px 16px;font-size:12px;color:#fcd34d;position:relative;z-index:2;opacity:0;animation:fd .8s 1.9s ${EASE} both}
.gr{display:flex;gap:8px;justify-content:center;margin-top:16px;padding:0 14px;position:relative;z-index:2}
.gr div{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 6px;text-align:center;font-size:10px;color:rgba(255,255,255,.7);opacity:0;animation:fd .7s ${EASE} both}
.gr div:nth-child(1){animation-delay:2.05s}.gr div:nth-child(2){animation-delay:2.2s}.gr div:nth-child(3){animation-delay:2.35s}
.gr b{display:block;font-size:16px;color:#fde68a;margin-bottom:2px}
.rb{position:relative;margin:18px auto 0;width:fit-content;background:linear-gradient(90deg,#b45309,#f59e0b,#b45309);background-size:200% 100%;color:#1c0a02;font-weight:900;font-size:11px;letter-spacing:3px;padding:9px 24px;border-radius:999px;opacity:0;animation:fd .8s 2.5s ${EASE} both,rbsh 3s 3.2s linear infinite;z-index:2}
@keyframes rbsh{to{background-position:200% 0}}
</style><div class="w"><div class="f"><div class="rays"></div>${[0,1,2,3,4,5,6,7,8,9].map(i => `<i class="emb" style="left:${4 + i * 9}%;width:${6 + (i % 4) * 3}px;height:${6 + (i % 4) * 3}px;animation-duration:${4 + (i % 5)}s;animation-delay:${i * .5}s"></i>`).join('')}<canvas id="cf" class="bgc"></canvas><div class="in">
<div class="top"><div class="t1">${'GUILD DIDIRIKAN'.split('').map((c, i) => `<span style="animation-delay:${.15 + i * .035}s">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('')}</div><div class="t2">🏰 SELAMAT!</div></div>
<div class="pan"><div class="kayu"></div><div class="kain"><div class="crest"><svg viewBox="0 0 170 190"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><path d="M85 6 L158 30 V96 C158 140 122 172 85 184 C48 172 12 140 12 96 V30 Z" fill="url(#g2)" stroke="#fff7d6" stroke-width="4"/><path d="M85 26 L140 44 V96 C140 128 114 154 85 164 C56 154 30 128 30 96 V44 Z" fill="rgba(60,10,10,.25)"/></svg><div class="lt">${esc(ini(nama))}</div><div class="ring"></div><div class="sh"></div></div></div></div>
<div class="nm">${esc(nama)}</div><div class="ld">👑 ${esc(pemimpin)} · pendiri</div>
<div class="gr"><div><b>Lv.1</b>Level Guild</div><div><b>1/20</b>Anggota</div><div><b data-n="${25000}" data-d="1200" data-w="2300">0</b>Koin Pendirian</div></div>
<div class="rb">MISI MINGGUAN AKTIF</div>
<div class="ft">${esc(brand)} • GUILD RPG</div></div></div></div>${hitung}${konfeti('cf', "['#fde68a','#f59e0b','#fff','#fca5a5','#fb923c']", 130)}`
}

/* ───────────────────────── 2. LIST GUILD (scroll) ───────────────────────── */
export function kartuListGuild (brand, d = {}) {
  const gs = (d.guilds || []).slice(0, 60)
  const warna = ['#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#22c55e', '#ec4899', '#3b82f6']
  const item = (g, i) => `<div class="it" style="animation-delay:${Math.min(i, 14) * 90 + 200}ms"><div class="rk">#${i + 1}</div><div class="av" style="background:${warna[i % warna.length]}22;border:2px solid ${warna[i % warna.length]};color:${warna[i % warna.length]}">${esc(ini(g.nama))}</div><div class="tx"><b>${esc(g.nama)}</b><small>👑 ${esc(g.pemimpin)} · 👥 ${g.anggota}/20 · 💰 ${n(g.bendahara)}</small></div><div class="lv">Lv.${g.level}</div></div>`
  return `<style>${BASE}
.f{padding-bottom:160%;background:linear-gradient(180deg,#1e1b4b 0%,#0b0a1f 40%,#06070d 100%)}
.hd{padding:20px 16px 8px;text-align:center}.hd .t1{font-size:10px;letter-spacing:5px;color:#a5b4fc;font-weight:800;animation:fd .6s both}.hd .t2{font-size:24px;font-weight:900;animation:fd .6s .1s both}.hd .t3{font-size:11px;color:rgba(255,255,255,.55);margin-top:4px;animation:fd .6s .2s both}
.it{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px 12px;margin-top:8px;opacity:0;animation:sl .5s both}
.rk{font-size:11px;font-weight:900;color:rgba(255,255,255,.5);width:26px}.tx{flex:1;min-width:0}.tx b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tx small{font-size:10px;color:rgba(255,255,255,.6)}
.lv{background:linear-gradient(135deg,#fde68a,#f59e0b);color:#3b1d00;font-weight:900;font-size:11px;padding:5px 9px;border-radius:999px}
.it:nth-child(1) .lv{box-shadow:0 0 16px rgba(253,230,138,.6)}
.kos{text-align:center;padding:40px 20px;color:rgba(255,255,255,.6);font-size:13px}
</style><div class="w"><div class="f"><canvas id="st" class="bgc"></canvas><div class="in">
<div class="hd"><div class="t1">DAFTAR GUILD</div><div class="t2">🏰 ${gs.length} Guild Terdaftar</div><div class="t3">Total anggota ${n(d.totalAnggota)} · urut level & bendahara</div></div>
<div class="hint">▼ geser ke bawah untuk lihat semua ▼</div>
<div class="scroll">${gs.length ? gs.map(item).join('') : '<div class="kos">Belum ada guild.<br>Dirikan pertama: <b>.buatguild Nama</b></div>'}<div style="height:6px"></div><div class="ft">gabung: .joinguild &lt;nama&gt; · anggota: .listmember &lt;nama&gt;</div></div>
<div class="ft">${esc(brand)} • GUILD RPG</div></div></div></div>${bintang(70)}`
}

/* ───────────────────────── 3. MEMBER GUILD (scroll) ───────────────────────── */
export function kartuMemberGuild (brand, d = {}) {
  const ms = (d.anggota || []).slice(0, 60)
  const item = (a, i) => `<div class="it ${a.pemimpin ? 'ld' : ''}" style="animation-delay:${Math.min(i, 14) * 80 + 300}ms"><div class="av" style="background:${a.pemimpin ? 'linear-gradient(135deg,#fde68a,#f59e0b)' : 'rgba(255,255,255,.12)'};color:${a.pemimpin ? '#3b1d00' : '#fff'}">${esc(ini(a.nama))}</div><div class="tx"><b>${a.pemimpin ? '👑 ' : ''}${esc(a.nama)}</b><small>Lv.${a.level} · ${esc(a.job || 'Tanpa kelas')} · donasi ${n(a.donasi)}</small></div><div class="sj">${esc(a.sejak || '')}</div></div>`
  return `<style>${BASE}
.f{padding-bottom:160%;background:radial-gradient(100% 60% at 50% 0%,#164e63 0%,#082f49 40%,#06070d 100%)}
.hd{padding:20px 16px 6px;text-align:center}.crest{width:70px;height:78px;margin:0 auto;animation:pop .9s .1s cubic-bezier(.2,1.5,.4,1) both;position:relative}.crest svg{width:100%;height:100%}.crest span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:26px;color:#083344;padding-bottom:6px}
.t2{font-size:22px;font-weight:900;margin-top:8px;animation:fd .6s .3s both}.t3{font-size:11px;color:rgba(255,255,255,.6);margin-top:3px;animation:fd .6s .4s both}
.st{display:flex;gap:6px;padding:10px 14px 4px;animation:fd .6s .5s both}.st div{flex:1;background:rgba(255,255,255,.08);border-radius:12px;padding:7px 4px;text-align:center;font-size:9px;color:rgba(255,255,255,.65)}.st b{display:block;font-size:14px;color:#67e8f9}
.it{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:9px 12px;margin-top:8px;opacity:0;animation:sl .5s both}
.it.ld{border-color:#fbbf24;background:rgba(251,191,36,.12)}.tx{flex:1;min-width:0}.tx b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tx small{font-size:10px;color:rgba(255,255,255,.6)}.sj{font-size:9px;color:rgba(255,255,255,.45)}
</style><div class="w"><div class="f"><canvas id="st" class="bgc"></canvas><div class="in">
<div class="hd"><div class="crest"><svg viewBox="0 0 170 190"><path d="M85 6 L158 30 V96 C158 140 122 172 85 184 C48 172 12 140 12 96 V30 Z" fill="#67e8f9" stroke="#ecfeff" stroke-width="5"/></svg><span>${esc(ini(d.nama))}</span></div><div class="t2">${esc(d.nama || 'Guild')}</div><div class="t3">Anggota guild · ${ms.length}/20</div></div>
<div class="st"><div><b>Lv.${d.level || 1}</b>Level</div><div><b>${n(d.bendahara)}</b>Bendahara</div><div><b>${ms.length}</b>Anggota</div><div><b>${esc(d.dibuat || '-')}</b>Berdiri</div></div>
<div class="hint">▼ geser untuk anggota lainnya ▼</div>
<div class="scroll">${ms.map(item).join('')}<div class="ft">gabung: .joinguild ${esc(d.nama || '')}</div></div>
<div class="ft">${esc(brand)} • GUILD RPG</div></div></div></div>${bintang(50)}`
}

/* ───────────────────────── 4. DAFTAR BARU ───────────────────────── */
export function kartuDaftarBaru (brand, d = {}) {
  /* v7.32.0 — ditulis ulang: kartu holografik flip-in + stempel shockwave + baris stagger, easing spring */
  const EASE = 'cubic-bezier(.16,1,.3,1)'
  return `<style>${BASE}
.f{padding-bottom:150%;background:radial-gradient(120% 70% at 50% 0%,#065f46 0%,#052e2b 45%,#06070d 100%)}
.aur{position:absolute;border-radius:50%;filter:blur(46px);opacity:.5;animation:aur 9s ease-in-out infinite alternate;pointer-events:none}
.a1{width:300px;height:300px;background:#10b981;left:-110px;top:-70px}.a2{width:260px;height:260px;background:#0ea5e9;right:-100px;top:32%;animation-delay:-4s}
@keyframes aur{from{transform:translate(0,0) scale(1)}to{transform:translate(40px,34px) scale(1.15)}}
.t1{text-align:center;font-size:11px;letter-spacing:6px;color:#6ee7b7;font-weight:800;padding-top:22px;position:relative;z-index:2;opacity:0;animation:fd .8s .1s ${EASE} both}
.t2{text-align:center;font-size:27px;font-weight:900;margin-top:4px;position:relative;z-index:2;opacity:0;animation:fd .8s .25s ${EASE} both}
.pers{perspective:900px;margin:22px 22px 0;position:relative;z-index:2}
.holo{position:absolute;inset:-2px;border-radius:20px;background:conic-gradient(from var(--a,0deg),#34d399,#22d3ee,#a78bfa,#f472b6,#34d399);animation:putar 5s linear infinite;filter:blur(1px)}
@property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes putar{to{--a:360deg}}
.card{position:relative;background:linear-gradient(135deg,#ecfdf5,#d1fae5 60%,#a7f3d0);color:#064e3b;border-radius:18px;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,.5);overflow:hidden;opacity:0;transform:rotateX(70deg) translateY(60px);animation:flipin 1.1s .45s ${EASE} both}
@keyframes flipin{0%{opacity:0;transform:rotateX(70deg) translateY(60px)}60%{opacity:1;transform:rotateX(-6deg) translateY(-4px)}100%{opacity:1;transform:none}}
.card .kil{position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:shine 3s 2.2s infinite}
.card .hd{display:flex;align-items:center;gap:10px}.card .av{width:54px;height:54px;background:linear-gradient(135deg,#065f46,#10b981);color:#d1fae5;font-size:20px;border-radius:16px;box-shadow:0 6px 16px rgba(6,95,70,.4);opacity:0;animation:pop2 .8s 1s ${EASE} both}
@keyframes pop2{from{opacity:0;transform:scale(.3) rotate(-20deg)}60%{opacity:1;transform:scale(1.1)}to{opacity:1;transform:none}}
.card .nm{font-size:18px;font-weight:900;line-height:1.1;opacity:0;animation:fd .7s 1.05s ${EASE} both}.card .id{font-size:10px;letter-spacing:2px;color:#047857;margin-top:2px;opacity:0;animation:fd .7s 1.15s ${EASE} both}
.card .rows{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;font-size:11px}
.card .rows>div{background:rgba(6,95,70,.07);border:1px solid rgba(6,95,70,.14);border-radius:10px;padding:6px 9px;opacity:0;animation:fd .6s ${EASE} both}
.card .rows>div:nth-child(1){animation-delay:1.25s}.card .rows>div:nth-child(2){animation-delay:1.35s}.card .rows>div:nth-child(3){animation-delay:1.45s}.card .rows>div:nth-child(4){animation-delay:1.55s}
.card .rows small{display:block;font-size:8.5px;letter-spacing:1.5px;color:#047857}.card .rows b{font-size:12.5px}
.card .chip{position:absolute;right:16px;top:16px;width:34px;height:26px;border-radius:6px;background:linear-gradient(135deg,#fde68a,#d97706);box-shadow:0 2px 6px rgba(0,0,0,.25)}
.stamp{position:absolute;right:14px;bottom:12px;border:3px solid #dc2626;color:#dc2626;font-weight:900;font-size:13px;letter-spacing:2px;padding:4px 10px;border-radius:8px;background:rgba(255,255,255,.65);opacity:0;transform:translateY(-160px) rotate(-14deg) scale(1.6);animation:cap 1s 2s ${EASE} both}
@keyframes cap{0%{opacity:0;transform:translateY(-160px) rotate(-14deg) scale(1.6)}55%{opacity:1;transform:translateY(0) rotate(-14deg) scale(.94)}75%{transform:translateY(-6px) rotate(-14deg) scale(1.02)}100%{opacity:.92;transform:translateY(0) rotate(-14deg) scale(1)}}
.gel{position:absolute;right:30px;bottom:26px;width:120px;height:44px;border:3px solid rgba(220,38,38,.8);border-radius:8px;opacity:0;transform:rotate(-14deg);animation:gelx .8s 2.35s ${EASE} both;pointer-events:none}
@keyframes gelx{from{opacity:.9;transform:rotate(-14deg) scale(.5)}to{opacity:0;transform:rotate(-14deg) scale(1.7)}}
.bonus{display:flex;gap:8px;justify-content:center;margin-top:16px;padding:0 20px;position:relative;z-index:2}
.bonus div{flex:1;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 6px;text-align:center;font-size:10px;color:rgba(255,255,255,.72);opacity:0;animation:fd .7s ${EASE} both}
.bonus div:nth-child(1){animation-delay:2.5s}.bonus div:nth-child(2){animation-delay:2.62s}.bonus div:nth-child(3){animation-delay:2.74s}
.bonus b{display:block;font-size:15px;color:#6ee7b7}
.ok{text-align:center;font-size:12px;color:rgba(255,255,255,.8);margin-top:12px;padding:0 20px;position:relative;z-index:2;opacity:0;animation:fd .7s 2.9s ${EASE} both}
</style><div class="w"><div class="f"><div class="aur a1"></div><div class="aur a2"></div><canvas id="cf" class="bgc"></canvas><div class="in">
<div class="t1">PENDAFTARAN BERHASIL</div><div class="t2">🎉 Selamat Datang!</div>
<div class="pers"><div class="holo"></div><div class="card"><div class="kil"></div><div class="chip"></div><div class="hd"><div class="av">${esc(ini(d.nama))}</div><div><div class="nm">${esc(String(d.nama || 'Member').slice(0, 20))}</div><div class="id">ID ${esc(d.memberId || '-')}</div></div></div>
<div class="rows"><div><small>NOMOR</small><b>+${esc(d.nomor || '-')}</b></div><div><small>UMUR</small><b>${n(d.umur)} tahun</b></div><div><small>TERDAFTAR</small><b>${esc(d.tanggal || '-')}</b></div><div><small>STATUS</small><b>MEMBER</b></div></div>
<div class="stamp">✔ VERIFIED</div><div class="gel"></div></div></div>
<div class="bonus"><div><b>+${n(d.bonusLimit || 10)}</b>Bonus limit</div><div><b>+${n(d.bonusKoin || 0)}</b>Bonus koin</div><div><b>Lv.1</b>Mulai petualangan</div></div>
<div class="ok">Ketik <b>.profile</b> untuk lihat kartu profilmu · <b>.rpg</b> untuk mulai main</div>
<div class="ft">${esc(brand)} • MEMBER BARU</div></div></div></div>${konfeti('cf', "['#6ee7b7','#34d399','#a7f3d0','#fff','#fde68a']", 100)}`
}

/* ───────────────────────── 5. KARTU STAT (money / xp / limit / level) ───────────────────────── */
export function kartuStat (brand, d = {}) {
  const jenis = ['money', 'xp', 'limit', 'level'].includes(d.jenis) ? d.jenis : 'money'
  const nama = esc(String(d.nama || 'Kamu').slice(0, 22))
  const T = {
    money: { bg: 'radial-gradient(120% 70% at 50% 0%,#78350f 0%,#3b1d00 45%,#06070d 100%)', ak: '#fde68a', t1: 'DOMPET KOIN', ico: '💰' },
    xp: { bg: 'radial-gradient(120% 70% at 50% 0%,#4c1d95 0%,#1e0b3a 45%,#06070d 100%)', ak: '#c4b5fd', t1: 'PENGALAMAN', ico: '✨' },
    limit: { bg: 'radial-gradient(120% 70% at 50% 0%,#0c4a6e 0%,#082f49 45%,#06070d 100%)', ak: '#7dd3fc', t1: 'LIMIT HARIAN', ico: '🔋' },
    level: { bg: 'radial-gradient(120% 70% at 50% 0%,#7f1d1d 0%,#3b0a0a 45%,#06070d 100%)', ak: '#fca5a5', t1: 'LEVEL & GELAR', ico: '🏅' }
  }[jenis]
  const pct = Math.max(0, Math.min(100, Math.round(100 * (d.exp || 0) / Math.max(1, d.butuh || 1))))
  let tengah = '', ekstra = ''
  if (jenis === 'money') {
    tengah = `<div class="big"><span class="ico">🪙</span><b data-n="${+d.money || 0}">0</b><small>KOIN</small></div>`
    ekstra = `<div class="gr"><div><b>${n(d.bank || 0)}</b>Di bank</div><div><b>#${d.rank || '-'}</b>Peringkat kaya</div><div><b>${n(d.hariIni || 0)}</b>Hari ini</div></div><div class="tip">Tambah koin: .kerja · .berburu · .dungeon · .judi (hati-hati 😏)</div>`
  } else if (jenis === 'xp') {
    tengah = `<div class="big"><span class="ico">✨</span><b data-n="${+d.exp || 0}">0</b><small>EXP · LEVEL ${d.level || 1}</small></div><div class="bar"><i style="--p:${pct}%"></i><em>${pct}% menuju Lv.${(d.level || 1) + 1}</em></div>`
    ekstra = `<div class="gr"><div><b>${n(d.butuh)}</b>EXP dibutuhkan</div><div><b>${n(Math.max(0, (d.butuh || 0) - (d.exp || 0)))}</b>Sisa</div><div><b>#${d.rank || '-'}</b>Peringkat EXP</div></div><div class="tip">EXP naik dari chat, game, RPG. Naik level → kartu LEVEL UP otomatis 🎉</div>`
  } else if (jenis === 'limit') {
    const lp = d.premium ? 100 : Math.max(0, Math.min(100, Math.round(100 * (d.limit || 0) / Math.max(1, d.limitMaks || 50))))
    tengah = `<div class="bat"><div class="cap"></div><div class="body"><i style="--p:${lp}%;background:${lp > 50 ? '#34d399' : lp > 20 ? '#fbbf24' : '#f87171'}"></i><span>${d.premium ? '∞' : `<b data-n="${+d.limit || 0}">0</b>`}</span></div></div><div class="lbl">${d.premium ? 'PREMIUM · UNLIMITED' : `${lp}% · ${n(d.limit)} limit tersisa`}</div>`
    ekstra = `<div class="gr"><div><b>${d.premium ? '💎' : n(d.limitMaks || 50)}</b>${d.premium ? 'Premium' : 'Kapasitas'}</div><div><b>${esc(d.claim || '-')}</b>Claim harian</div><div><b>${n(d.terpakai || 0)}</b>Terpakai hari ini</div></div><div class="tip">Tambah limit: .claim tiap 24 jam · premium = tanpa batas</div>`
  } else {
    tengah = `<div class="ring"><svg viewBox="0 0 180 180"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10"/><circle class="fg" cx="90" cy="90" r="80" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round" style="--o:${Math.round(502 - 502 * pct / 100)}"/></svg><div class="c"><small>LEVEL</small><b data-n="${+d.level || 1}" data-d="1000">0</b></div></div><div class="gel">✦ ${esc(d.gelar || '')} ✦</div>`
    ekstra = `<div class="gr"><div><b>${pct}%</b>Progres</div><div><b>#${d.rank || '-'}</b>Peringkat level</div><div><b>${esc(d.berikut || '-')}</b>Gelar berikut</div></div><div class="tip">${n(d.exp)} / ${n(d.butuh)} EXP · HP & energi pulih tiap naik level</div>`
  }
  return `<style>${BASE}
.f{padding-bottom:128%;background:${T.bg}}
.hd{display:flex;align-items:center;gap:10px;padding:18px 18px 0;animation:fd .6s both}.hd .av{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25)}.hd .nm{font-size:15px;font-weight:900}.hd .sb{font-size:10px;letter-spacing:3px;color:${T.ak};font-weight:800}
.big{text-align:center;margin-top:26px;animation:pop .9s .3s cubic-bezier(.2,1.5,.4,1) both}.big .ico{display:block;font-size:54px;animation:flo 2.6s infinite}.big b{display:block;font-size:52px;font-weight:900;line-height:1;margin-top:6px;letter-spacing:-1px;color:${T.ak};text-shadow:0 0 30px ${T.ak}55}.big small{display:block;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,.6);margin-top:6px}
.bar{position:relative;margin:18px 30px 0;height:14px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;animation:fd .6s .8s both}.bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#8b5cf6,#c4b5fd);border-radius:999px;animation:grow 1.6s 1s cubic-bezier(.2,1,.3,1) forwards}.bar em{position:absolute;left:0;right:0;top:16px;text-align:center;font-size:10px;font-style:normal;color:rgba(255,255,255,.7)}@keyframes grow{to{width:var(--p)}}
.bat{position:relative;width:200px;height:96px;margin:34px auto 0;animation:pop .9s .3s cubic-bezier(.2,1.5,.4,1) both}.bat .cap{position:absolute;right:-12px;top:30px;width:12px;height:36px;background:rgba(255,255,255,.35);border-radius:0 6px 6px 0}.bat .body{position:absolute;inset:0;border:4px solid rgba(255,255,255,.55);border-radius:18px;padding:6px;overflow:hidden}.bat .body i{position:absolute;left:6px;top:6px;bottom:6px;width:0;border-radius:10px;animation:grow 1.5s .9s cubic-bezier(.2,1,.3,1) forwards;box-shadow:0 0 24px currentColor}.bat .body span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.lbl{text-align:center;font-size:12px;color:${T.ak};font-weight:800;margin-top:18px;letter-spacing:1px;animation:fd .6s 1s both}
.ring{position:relative;width:180px;height:180px;margin:22px auto 0;animation:pop .9s .3s cubic-bezier(.2,1.5,.4,1) both}.ring svg{width:100%;height:100%;transform:rotate(-90deg)}.ring .fg{stroke-dasharray:502;stroke-dashoffset:502;animation:ring 1.6s .9s ease-out forwards}@keyframes ring{to{stroke-dashoffset:var(--o)}}.ring .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.ring .c small{font-size:10px;letter-spacing:4px;color:${T.ak}}.ring .c b{font-size:64px;font-weight:900;line-height:1}
.gel{text-align:center;font-size:12px;letter-spacing:2px;color:${T.ak};font-weight:800;margin-top:12px;animation:fd .6s 1.2s both}
.gr{display:flex;gap:8px;margin:22px 16px 0;animation:fd .6s 1.4s both}.gr div{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:9px 4px;text-align:center;font-size:9px;color:rgba(255,255,255,.65)}.gr b{display:block;font-size:14px;color:#fff;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tip{text-align:center;font-size:10px;color:rgba(255,255,255,.6);margin:14px 22px 0;line-height:1.5;animation:fd .6s 1.7s both}
</style><div class="w"><div class="f">${jenis === 'money' ? '<canvas id="cf" class="bgc"></canvas>' : '<canvas id="st" class="bgc"></canvas>'}<div class="in">
<div class="hd"><div class="av">${esc(ini(d.nama))}</div><div><div class="sb">${T.ico} ${T.t1}</div><div class="nm">${nama}</div></div></div>
${tengah}${ekstra}
<div class="ft" style="position:absolute;left:0;right:0;bottom:0">${esc(brand)} • ${T.t1}</div></div></div></div>${hitung}${jenis === 'money' ? konfeti('cf', "['#fde68a','#f59e0b','#fbbf24','#fff7ed']", 60) : bintang(50)}`
}

/* ───────────────────────── 6. QRIS ───────────────────────── */
export function kartuQris (brand, d = {}) {
  return `<style>${BASE}
.f{padding-bottom:160%;background:radial-gradient(120% 60% at 50% 0%,#be123c 0%,#4c0519 45%,#06070d 100%)}
.t1{text-align:center;font-size:11px;letter-spacing:6px;color:#fecdd3;font-weight:800;padding-top:22px;animation:fd .6s both}.t2{text-align:center;font-size:24px;font-weight:900;margin-top:4px;animation:fd .6s .15s both}
.qr{position:relative;width:78%;margin:18px auto 0;background:#fff;border-radius:20px;padding:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:pop .9s .4s cubic-bezier(.2,1.5,.4,1) both;overflow:hidden}.qr img{display:block;width:100%;border-radius:8px}
.qr .ln{position:absolute;left:8px;right:8px;top:0;height:3px;background:linear-gradient(90deg,transparent,#e11d48,transparent);box-shadow:0 0 14px #e11d48;animation:scan 2.4s 1.2s ease-in-out infinite}@keyframes scan{0%{top:6%}50%{top:92%}100%{top:6%}}
.qr .cn{position:absolute;width:26px;height:26px;border:4px solid #e11d48}.qr .a{left:6px;top:6px;border-right:0;border-bottom:0;border-radius:8px 0 0 0}.qr .b{right:6px;top:6px;border-left:0;border-bottom:0;border-radius:0 8px 0 0}.qr .c{left:6px;bottom:6px;border-right:0;border-top:0;border-radius:0 0 0 8px}.qr .d{right:6px;bottom:6px;border-left:0;border-top:0;border-radius:0 0 8px 0}
.lg{display:flex;justify-content:center;gap:6px;margin-top:8px;padding-bottom:4px}.lg span{font-size:10px;font-weight:900;color:#111;letter-spacing:1px}
.nm{text-align:center;margin-top:16px;font-size:13px;color:#fecdd3;animation:fd .6s 1s both}.nm b{display:block;font-size:16px;color:#fff;margin-top:2px}
.hg{display:flex;gap:8px;margin:16px 18px 0;animation:fd .6s 1.2s both}.hg div{flex:1;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:9px 4px;text-align:center;font-size:9px;color:rgba(255,255,255,.7)}.hg b{display:block;font-size:12px;color:#fff;margin-bottom:2px}
.tip{text-align:center;font-size:10px;color:rgba(255,255,255,.65);margin:14px 22px 0;line-height:1.5;animation:fd .6s 1.4s both}
</style><div class="w"><div class="f"><canvas id="st" class="bgc"></canvas><div class="in">
<div class="t1">DONASI · QRIS</div><div class="t2">💖 Dukung ${esc(brand)}</div>
<div class="qr"><div class="cn a"></div><div class="cn b"></div><div class="cn c"></div><div class="cn d"></div><img src="${d.qr || ''}" alt="QRIS"><div class="ln"></div><div class="lg"><span>QRIS</span><span style="color:#e11d48">•</span><span>GPN</span><span style="color:#e11d48">•</span><span>SEMUA E-WALLET & M-BANKING</span></div></div>
<div class="nm">Scan pakai DANA · GoPay · OVO · ShopeePay · BCA · dll<b>a.n. ${esc(d.namaPenerima || 'Owner')}</b></div>
<div class="hg"><div><b>Rp5.000</b>Premium 1 bln</div><div><b>Rp15.000</b>Sewa bot grup</div><div><b>Seikhlasnya</b>Traktir kopi ☕</div></div>
<div class="tip">Setelah bayar, kirim bukti ke owner (<b>.owner</b>) agar premium/sewa langsung diaktifkan 🙏</div>
<div class="ft" style="position:absolute;left:0;right:0;bottom:0">${esc(brand)} • TERIMA KASIH</div></div></div></div>${bintang(60)}`
}

/* ───────────────────────── 7. LEADERBOARD HUB ───────────────────────── */
const podium = (top, ak) => {
  const p = i => top[i] || { nama: '-', nilai: 0 }
  const kol = (i, cls, tinggi, medali) => `<div class="pd ${cls}"><div class="av" style="background:${ak}22;border:2px solid ${ak};color:${ak}">${esc(ini(p(i).nama))}</div><b>${esc(String(p(i).nama).slice(0, 12))}</b><small>${n(p(i).nilai)}</small><div class="blk" style="--h:${tinggi}px;--d:${i * .15}s"><span>${medali}</span></div></div>`
  return `<div class="pod">${kol(1, 'p2', 64, '🥈')}${kol(0, 'p1', 92, '🥇')}${kol(2, 'p3', 48, '🥉')}</div>`
}
export function kartuLbHub (brand, d = {}) {
  const kats = d.kategori || []
  return `<style>${BASE}
.f{padding-bottom:165%;background:radial-gradient(120% 60% at 50% 0%,#713f12 0%,#1c1917 45%,#06070d 100%)}
.t1{text-align:center;font-size:11px;letter-spacing:6px;color:#fde68a;font-weight:800;padding-top:20px;animation:fd .6s both}.t2{text-align:center;font-size:24px;font-weight:900;margin-top:4px;animation:fd .6s .15s both}.t3{text-align:center;font-size:11px;color:rgba(255,255,255,.55);margin-top:3px;animation:fd .6s .25s both}
.pod{display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:16px 20px 0}.pd{flex:1;text-align:center;max-width:110px;animation:fd .7s calc(.4s + var(--d,0s)) both}.pd .av{margin:0 auto 4px;animation:flo 3s infinite}.pd b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pd small{font-size:10px;color:#fde68a}
.blk{height:0;margin-top:6px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,rgba(253,230,138,.6),rgba(253,230,138,.08));animation:up .9s calc(.6s + var(--d)) cubic-bezier(.2,1,.3,1) forwards;display:flex;align-items:flex-start;justify-content:center;font-size:22px;padding-top:6px;overflow:hidden}@keyframes up{to{height:var(--h)}}
.p1 .blk{background:linear-gradient(180deg,#fde68a,rgba(253,230,138,.15))}
.hint{margin-top:8px}
.kt{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:10px 12px;margin-top:8px;opacity:0;animation:sl .5s both}.kt .ic{font-size:22px;width:34px;text-align:center}.kt .tx{flex:1;min-width:0}.kt b{display:block;font-size:13px}.kt small{font-size:10px;color:rgba(255,255,255,.6);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kt .cmd{font-size:10px;background:#fde68a;color:#3b1d00;font-weight:900;padding:4px 8px;border-radius:999px}
</style><div class="w"><div class="f"><canvas id="cf" class="bgc"></canvas><div class="in">
<div class="t1">PAPAN PERINGKAT</div><div class="t2">🏆 Hall of Fame</div><div class="t3">${n(d.totalUser)} pemain · juara umum: <b>${esc(d.top?.[0]?.nama || '-')}</b></div>
${podium(d.top || [], '#fde68a')}
<div class="hint">▼ geser untuk kategori lain ▼</div>
<div class="scroll">${kats.map((k, i) => `<div class="kt" style="animation-delay:${1 + i * .1}s"><div class="ic">${k.icon}</div><div class="tx"><b>${esc(k.nama)}</b><small>🥇 ${esc(k.juara || '-')} · ${esc(k.ket || '')}</small></div><div class="cmd">${esc(k.cmd)}</div></div>`).join('')}<div class="ft">ketik perintah di kanan untuk membuka papan lengkap</div></div>
<div class="ft">${esc(brand)} • LEADERBOARD</div></div></div></div>${konfeti('cf', "['#fde68a','#f59e0b','#fff','#fbbf24']", 50)}`
}
export function kartuTop (brand, d = {}) {
  const list = (d.list || []).slice(0, 50); const ak = d.warna || '#fde68a'
  return `<style>${BASE}
.f{padding-bottom:165%;background:radial-gradient(120% 60% at 50% 0%,${d.bg1 || '#312e81'} 0%,${d.bg2 || '#111827'} 45%,#06070d 100%)}
.t1{text-align:center;font-size:11px;letter-spacing:6px;color:${ak};font-weight:800;padding-top:20px;animation:fd .6s both}.t2{text-align:center;font-size:24px;font-weight:900;margin-top:4px;animation:fd .6s .15s both}.t3{text-align:center;font-size:11px;color:rgba(255,255,255,.55);margin-top:3px;animation:fd .6s .25s both}
.pod{display:flex;align-items:flex-end;justify-content:center;gap:8px;padding:16px 20px 0}.pd{flex:1;text-align:center;max-width:110px;animation:fd .7s calc(.4s + var(--d,0s)) both}.pd .av{margin:0 auto 4px;animation:flo 3s infinite}.pd b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pd small{font-size:10px;color:${ak}}
.blk{height:0;margin-top:6px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,${ak}99,${ak}14);animation:up .9s calc(.6s + var(--d)) cubic-bezier(.2,1,.3,1) forwards;display:flex;align-items:flex-start;justify-content:center;font-size:22px;padding-top:6px;overflow:hidden}@keyframes up{to{height:var(--h)}}
.it{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:8px 12px;margin-top:7px;opacity:0;animation:sl .5s both}.it.me{border-color:${ak};background:${ak}22}.rk{width:26px;font-size:12px;font-weight:900;color:rgba(255,255,255,.55)}.tx{flex:1;min-width:0}.tx b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tx small{font-size:10px;color:rgba(255,255,255,.55)}.vl{font-size:12px;font-weight:900;color:${ak}}
.me-b{text-align:center;font-size:11px;color:rgba(255,255,255,.7);padding:8px}
</style><div class="w"><div class="f"><canvas id="st" class="bgc"></canvas><div class="in">
<div class="t1">${esc(d.label || 'TOP')}</div><div class="t2">${d.icon || '🏆'} ${esc(d.judul || 'Peringkat')}</div><div class="t3">${esc(d.sub || '')}</div>
${podium(list.map(x => ({ nama: x.nama, nilai: x.nilai })), ak)}
<div class="me-b">${d.me ? `Peringkatmu: <b style="color:${ak}">#${d.me.rank}</b> · ${n(d.me.nilai)} ${esc(d.satuan || '')}` : 'Kamu belum masuk papan — semangat! 💪'}</div>
<div class="hint">▼ geser untuk peringkat 4 ke bawah ▼</div>
<div class="scroll">${list.slice(3).map((x, i) => `<div class="it ${x.me ? 'me' : ''}" style="animation-delay:${1.1 + Math.min(i, 12) * .08}s"><div class="rk">#${i + 4}</div><div class="av" style="width:32px;height:32px;font-size:11px;background:rgba(255,255,255,.12)">${esc(ini(x.nama))}</div><div class="tx"><b>${esc(x.nama)}${x.me ? ' (kamu)' : ''}</b><small>${esc(x.ket || '')}</small></div><div class="vl">${n(x.nilai)}</div></div>`).join('') || '<div class="me-b">Belum ada data lain.</div>'}<div style="height:8px"></div></div>
<div class="ft">${esc(brand)} • ${esc(d.label || 'TOP')}</div></div></div></div>${bintang(60)}`
}
export default { kartuGuildBaru, kartuListGuild, kartuMemberGuild, kartuDaftarBaru, kartuStat, kartuQris, kartuLbHub, kartuTop }
