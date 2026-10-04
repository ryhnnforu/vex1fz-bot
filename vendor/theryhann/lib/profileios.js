/**
 * lib/profileios.js — 📱 PROFIL GAYA iOS (v7.29.0)
 *  Kartu profil HTML dengan nuansa iPhone: Dynamic Island, wallpaper gradasi
 *  bergerak, widget kaca (blur) yang muncul dengan animasi spring, badge status
 *  keanggotaan (Owner / Premium / Member / Belum daftar), member sejak, ring EXP,
 *  ikon-ikon app (uang, level, limit) yang "bergoyang" saat disentuh, tombol
 *  Home-indicator. Semua inline (tanpa CDN), aman di webview WA.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const angka = n => Math.floor(+n || 0).toLocaleString('id-ID')

const STATUS = {
  OWNER: { warna: '#ff3b30', ikon: '👑', teks: 'OWNER', sub: 'Pemilik bot' },
  PREMIUM: { warna: '#ffcc00', ikon: '💎', teks: 'PREMIUM', sub: 'Akses tanpa limit' },
  MEMBER: { warna: '#34c759', ikon: '✅', teks: 'MEMBER', sub: 'Terdaftar & terverifikasi' },
  'BELUM DAFTAR': { warna: '#8e8e93', ikon: '🔒', teks: 'BELUM DAFTAR', sub: 'Ketik .daftar nama|umur' }
}

export function profilIosHtml (brand = 'THERYHANN!', d = {}) {
  const st = STATUS[d.status] || STATUS['BELUM DAFTAR']
  const butuh = Math.max(1, +d.butuh || 100), exp = Math.max(0, +d.exp || 0), persen = Math.min(100, Math.round(exp / butuh * 100))
  const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')
  const inisial = String(d.nama || 'U').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const apps = [
    ['💰', 'Uang', 'Rp' + angka(d.uang), '#30d158'], ['⭐', 'Level', 'Lv.' + (d.level || 1), '#ff9f0a'],
    ['🎟', 'Limit', d.premium ? '∞' : angka(d.limit), '#0a84ff'], ['🎂', 'Umur', d.umur ? d.umur + ' th' : '—', '#bf5af2'],
    ['🆔', 'ID', String(d.nomor || '').slice(-6) || '—', '#ff375f'], ['🏅', 'Gelar', d.gelar || 'Warga', '#64d2ff']
  ]
  return `<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}html,body{background:#000;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.wrap{max-width:430px;margin:0 auto;padding:10px}
.ph{position:relative;height:0;padding-bottom:205%;border-radius:46px;overflow:hidden;background:#000;box-shadow:0 0 0 3px #1c1c1e,0 0 0 5px #3a3a3c,0 30px 60px rgba(0,0,0,.6)}
.wp{position:absolute;inset:0;background:linear-gradient(135deg,#0a84ff,#bf5af2,#ff375f,#ff9f0a,#30d158);background-size:400% 400%;animation:wp 14s ease infinite}
.wp:after{content:"";position:absolute;inset:0;background:radial-gradient(60% 40% at 30% 20%,rgba(255,255,255,.25),transparent 70%),radial-gradient(50% 40% at 80% 80%,rgba(0,0,0,.35),transparent 70%)}
@keyframes wp{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:14px 16px 0;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:none}
.sb{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:700;padding:4px 10px}
.isl{position:absolute;left:50%;top:12px;transform:translateX(-50%);width:120px;height:34px;background:#000;border-radius:20px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#fff;animation:isl 1.2s .3s cubic-bezier(.2,1.4,.4,1) both;overflow:hidden;white-space:nowrap}
.isl i{width:8px;height:8px;border-radius:50%;background:${st.warna};box-shadow:0 0 8px ${st.warna};display:inline-block;animation:blink 1.6s infinite}
@keyframes isl{from{width:110px;opacity:.6}60%{width:210px}to{width:196px;opacity:1}}@keyframes blink{50%{opacity:.35}}
.g{background:rgba(255,255,255,.16);backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);border:1px solid rgba(255,255,255,.28);border-radius:26px;box-shadow:0 8px 30px rgba(0,0,0,.18)}
.w{animation:spring .9s cubic-bezier(.18,1.5,.4,1) both;opacity:0}
@keyframes spring{from{opacity:0;transform:translateY(40px) scale(.85)}to{opacity:1;transform:none}}
.hero{margin-top:44px;padding:18px;display:flex;gap:14px;align-items:center}
.av{width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,#fff,#c7d2fe);color:#1c1c1e;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px ${st.warna},0 10px 30px rgba(0,0,0,.3);flex:none;animation:pulse 3s infinite}
@keyframes pulse{50%{box-shadow:0 0 0 6px ${st.warna}66,0 10px 30px rgba(0,0,0,.3)}}
.hero h1{font-size:22px;font-weight:800;letter-spacing:-.3px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
.hero p{font-size:12px;opacity:.8;margin-top:3px}
.bdg{display:inline-flex;align-items:center;gap:5px;margin-top:8px;background:${st.warna};color:${st.teks === 'PREMIUM' ? '#000' : '#fff'};font-size:11px;font-weight:800;letter-spacing:1px;padding:5px 10px;border-radius:999px;box-shadow:0 4px 14px ${st.warna}66}
.row{display:flex;gap:12px;margin-top:12px}.row>.g{flex:1;padding:14px}
.k{font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.7}.v{font-size:18px;font-weight:800;margin-top:4px;letter-spacing:-.3px}
.ring{width:64px;height:64px;position:relative;float:right;margin:-4px -4px 0 6px}.ring svg{transform:rotate(-90deg);width:100%;height:100%}.ring circle{fill:none;stroke-width:7}.ring .b{stroke:rgba(255,255,255,.2)}.ring .f{stroke:#fff;stroke-linecap:round;stroke-dasharray:170;stroke-dashoffset:170;animation:ring 1.4s 1s ease-out forwards}
@keyframes ring{to{stroke-dashoffset:${Math.round(170 - 170 * persen / 100)}}}.ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px}
.apps{margin-top:14px;padding:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.app{text-align:center;cursor:pointer}.app .ic{width:58px;height:58px;margin:0 auto;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:inset 0 -6px 12px rgba(0,0,0,.18),0 6px 14px rgba(0,0,0,.25);transition:transform .25s cubic-bezier(.2,1.6,.4,1)}
.app:active .ic{transform:scale(.86)}.app.j .ic{animation:jig .35s infinite}.app .n{font-size:11px;margin-top:6px;opacity:.9}.app .val{font-size:12px;font-weight:800}
@keyframes jig{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
.info{margin-top:12px;padding:6px 16px}.info div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.14);font-size:13px}.info div:last-child{border:0}.info span:last-child{font-weight:700;opacity:.95;max-width:58%;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dock{margin-top:auto;margin-bottom:22px;padding:12px;display:flex;justify-content:space-around;border-radius:34px}
.dock div{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:24px}
.home{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:130px;height:5px;border-radius:5px;background:#fff;opacity:.9}
.toast{position:absolute;left:50%;top:60px;transform:translate(-50%,-30px);background:rgba(28,28,30,.92);padding:10px 16px;border-radius:16px;font-size:13px;opacity:0;transition:all .4s cubic-bezier(.2,1.4,.4,1);pointer-events:none;white-space:nowrap}
.toast.on{opacity:1;transform:translate(-50%,0)}
</style><div class="wrap"><div class="ph"><div class="wp"></div><div class="scr">
<div class="sb"><span>${jam}</span><span>📶 🔋</span></div>
<div class="isl"><i></i><span>${st.ikon} ${st.teks}</span></div>
<div class="g w hero" style="animation-delay:.15s"><div class="av">${esc(inisial)}</div><div style="min-width:0"><h1>${esc(d.nama || 'User')}</h1><p>+${esc(d.nomor || '')} · ${esc(d.gelar || '')}</p><span class="bdg">${st.ikon} ${st.teks}</span></div></div>
<div class="row"><div class="g w" style="animation-delay:.3s"><div class="ring"><svg viewBox="0 0 60 60"><circle class="b" cx="30" cy="30" r="27"/><circle class="f" cx="30" cy="30" r="27"/></svg><b>${persen}%</b></div><div class="k">Level</div><div class="v">Lv.${d.level || 1}</div><div class="k" style="margin-top:6px">${angka(exp)} / ${angka(butuh)} EXP</div></div>
<div class="g w" style="animation-delay:.4s"><div class="k">Saldo RPG</div><div class="v">Rp${angka(d.uang)}</div><div class="k" style="margin-top:6px">${d.premium ? 'Limit ∞' : 'Limit ' + angka(d.limit)}</div></div></div>
<div class="g w apps" style="animation-delay:.55s" id="apps">${apps.map(a => `<div class="app"><div class="ic" style="background:${a[3]}">${a[0]}</div><div class="n">${a[1]}</div><div class="val">${esc(a[2])}</div></div>`).join('')}</div>
<div class="g w info" style="animation-delay:.7s"><div><span>Status</span><span>${st.ikon} ${st.teks}</span></div><div><span>Keterangan</span><span>${esc(st.sub)}${d.premiumSisa ? ' · ' + esc(d.premiumSisa) : ''}</span></div><div><span>Member sejak</span><span>${esc(d.sejak || '-')}</span></div><div><span>Member ID</span><span>${esc(d.memberId || '-')}</span></div>${d.bio ? `<div><span>Bio</span><span>${esc(d.bio)}</span></div>` : ''}</div>
<div class="g w dock" style="animation-delay:.85s"><div style="background:#30d158">🎮</div><div style="background:#0a84ff">🤖</div><div style="background:#ff9f0a">🛒</div><div style="background:#ff375f">📸</div></div>
</div><div class="toast" id="toast"></div><div class="home"></div></div></div>
<script>(function(){var t=document.getElementById('toast'),tm;document.querySelectorAll('.app').forEach(function(a){a.addEventListener('click',function(){document.querySelectorAll('.app').forEach(function(b){b.classList.remove('j')});a.classList.add('j');t.textContent=a.querySelector('.n').textContent+': '+a.querySelector('.val').textContent;t.classList.add('on');clearTimeout(tm);tm=setTimeout(function(){t.classList.remove('on');a.classList.remove('j')},1600)})})})();</script>`
}
export default { profilIosHtml }
