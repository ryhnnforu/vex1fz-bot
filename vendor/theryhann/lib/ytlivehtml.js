/**
 * lib/ytlivehtml.js — 🎬 .ytlive KARTU CARI + PLAYER YOUTUBE (v7.36.0)
 *  Gaya: latar gelap + aksen merah, daftar hasil (thumbnail, judul 2 baris,
 *  channel, views · umur, badge durasi), kotak cari + tombol Cari, halaman
 *  ▲▼ di dalam kartu (JS, instan), ketuk = salin perintah + toast.
 *  Player: <video> stream /v/<id>, poster, judul, ▲▼ pindah video (JS),
 *  tombol Salin (link) + ← (kembali ke hasil).
 *  Catatan WA webview tidak bisa mengirim pesan → semua aksi ketuk berupa
 *  salin-perintah; tombol native dikirim bot di bawah kartu.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fmtDur = s => { s = Math.max(0, Math.round(Number(s) || 0)); const m = Math.floor(s / 60), d = s % 60; return m + '.' + String(d).padStart(2, '0') }

/** rasio kartu cari dari jumlah baris (peringatan: % dari lebar 480) */
export function rasioCari (n = 6) {
  const tinggi = 300 + Math.min(6, Math.max(1, n)) * 96 + 64
  return Math.max(150, Math.min(260, Math.round(tinggi / 480 * 100))) + '%'
}

const CSS_CARI = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#000;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:VAR_RATIO;border-radius:26px;overflow:hidden;background:#161616;border:1px solid rgba(255,255,255,.09);box-shadow:0 24px 60px rgba(0,0,0,.55)}
.in{position:absolute;inset:0;padding:16px 16px 12px;display:flex;flex-direction:column;overflow:hidden}
.hd{display:flex;align-items:center;gap:10px;animation:turun .5s both}
.lg{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#ff0033,#b80024);display:flex;align-items:center;justify-content:center;font-size:17px;flex:none;box-shadow:0 4px 14px rgba(255,0,51,.45)}
.hd b{font-size:16px;letter-spacing:.2px}
.hd small{display:block;font-size:11.5px;color:#b5b5b5;font-weight:500;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:250px}
.live{margin-left:auto;flex:none;font-size:10.5px;font-weight:800;letter-spacing:1.5px;color:#ff4d5e;border:1.5px solid rgba(255,77,94,.65);border-radius:999px;padding:4px 11px;display:flex;align-items:center;gap:6px}
.live i{width:7px;height:7px;border-radius:50%;background:#ff2d40;box-shadow:0 0 8px #ff2d40;animation:denyut 1.4s infinite}
.hint{font-size:12px;color:#9a9a9a;margin:10px 2px 8px;animation:turun .5s .08s both}
.cari{display:flex;gap:8px;animation:turun .5s .14s both}
.cari input{flex:1;min-width:0;background:#232323;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:10px 16px;color:#fff;font-size:13.5px;outline:none}
.cari input:focus{border-color:rgba(255,0,51,.6)}
.cari button{flex:none;background:linear-gradient(135deg,#ff1f3d,#d6002b);border:0;color:#fff;font-weight:800;font-size:14px;border-radius:999px;padding:10px 22px;cursor:pointer;box-shadow:0 4px 14px rgba(255,0,51,.4)}
.cari button:active{transform:scale(.94)}
.daftar{margin-top:8px;flex:1;min-height:0;overflow:hidden}
.r{display:flex;gap:12px;padding:9px 6px;border-radius:14px;cursor:pointer;animation:naik .45s both}
.r:active{background:rgba(255,255,255,.06)}
.th{position:relative;flex:none;width:128px;height:72px;border-radius:10px;overflow:hidden;background:#000}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th .du{position:absolute;right:5px;bottom:5px;background:rgba(0,0,0,.85);font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:6px}
.tx{min-width:0;flex:1;padding-top:1px}
.tx b{display:block;font-size:13px;line-height:1.32;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tx span{display:block;font-size:11.5px;color:#a8a8a8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tx em{display:block;font-style:normal;font-size:11px;color:#8a8a8a;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft{display:flex;align-items:center;justify-content:center;gap:14px;padding-top:8px}
.ft button{width:38px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.16);background:#232323;color:#fff;font-size:13px;cursor:pointer}
.ft button:active{transform:scale(.92)}
.ft b{font-size:12.5px;color:#cfcfcf;min-width:44px;text-align:center}
.toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%) translateY(20px);background:rgba(20,20,20,.94);border:1px solid rgba(255,255,255,.16);color:#fff;font-size:12px;font-weight:600;padding:9px 16px;border-radius:999px;opacity:0;transition:all .3s;pointer-events:none;max-width:92%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:9}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
@keyframes turun{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes naik{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes denyut{0%,100%{opacity:1}50%{opacity:.35}}
`

const JS_BANTU = `
function salin(t){try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t);return true}}catch(e){}try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);return true}catch(e){}return false}
function toast(t){var el=document.getElementById('toast');el.textContent=t;el.className='toast on';clearTimeout(window.__tt);window.__tt=setTimeout(function(){el.className='toast'},2200)}
`

/**
 * @param d { q, hasil:[{id,judul,artis,durasi,views,umur,thumb}], token, P }
 */
export function ytliveSearchHtml (bot, d = {}) {
  const q = String(d.q || '')
  const P = String(d.P || '.')
  const token = String(d.token || '')
  const hasil = Array.isArray(d.hasil) ? d.hasil : []
  const per = 6
  const rows = hasil.map((v, i) => {
    const cmd = `${P}ytplay ${token} ${i + 1}`.trim()
    return `<div class="r" data-cmd="${esc(cmd)}" style="animation-delay:${i * 40}ms;display:${i < per ? 'flex' : 'none'}">` +
      `<div class="th">${v.thumb ? `<img src="${v.thumb}" alt="">` : ''}<span class="du">${fmtDur(v.durasi)}</span></div>` +
      `<div class="tx"><b>${esc(v.judul)}</b><span>${esc(v.artis)}</span><em>${esc([v.views, v.umur].filter(Boolean).join(' · '))}</em></div></div>`
  }).join('')
  const css = CSS_CARI.replace('VAR_RATIO', rasioCari(Math.min(per, hasil.length) || 1))
  const js = `(function(){${JS_BANTU}` +
    `var pg=0,per=${per},rows=Array.prototype.slice.call(document.querySelectorAll('.r')),tot=Math.max(1,Math.ceil(rows.length/per));` +
    `function tampil(){rows.forEach(function(el,i){el.style.display=(i>=pg*per&&i<(pg+1)*per)?'flex':'none'});document.getElementById('pg').textContent=(pg+1)+'/'+tot}` +
    `document.getElementById('naik').addEventListener('click',function(){if(pg>0){pg--;tampil()}});` +
    `document.getElementById('turun').addEventListener('click',function(){if(pg<tot-1){pg++;tampil()}});` +
    `rows.forEach(function(el){el.addEventListener('click',function(){var c=el.getAttribute('data-cmd');salin(c);toast('📋 Disalin — tempel & kirim untuk memutar')})});` +
    `document.getElementById('cari').addEventListener('click',function(){var v=document.getElementById('kunci').value.trim();if(!v){toast('Ketik kata kunci dulu');return}salin('${P.replace(/'/g, "\\'")}ytlive '+v);toast('📋 Disalin — tempel & kirim untuk mencari')});` +
    `tampil();})();`
  return `<style>${css}</style><div class="w"><div class="f"><div class="in">` +
    `<div class="hd"><div class="lg">▶</div><div style="min-width:0"><b>Ytlive — ${esc(bot)}</b><small>Hasil untuk &quot;${esc(q)}&quot; (${hasil.length})</small></div><div class="live"><i></i>LIVE</div></div>` +
    `<div class="hint">Ketuk salah satu video untuk memutar.</div>` +
    `<div class="cari"><input id="kunci" value="${esc(q)}" placeholder="Cari video…"><button id="cari">Cari</button></div>` +
    `<div class="daftar">${rows}</div>` +
    `<div class="ft"><button id="naik">▲</button><b id="pg">1/1</b><button id="turun">▼</button></div>` +
    `</div><div class="toast" id="toast"></div></div></div><script>${js}</script>`
}

const CSS_MAIN = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
html,body{background:#000;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.w{max-width:480px;margin:0 auto;padding:8px}
.f{position:relative;height:0;padding-bottom:172%;border-radius:26px;overflow:hidden;background:#161616;border:1px solid rgba(255,255,255,.09);box-shadow:0 24px 60px rgba(0,0,0,.55)}
.in{position:absolute;inset:0;padding:14px 14px 12px;display:flex;flex-direction:column;animation:naik .5s both}
.bar{display:flex;align-items:center;gap:10px}
.bk{width:34px;height:34px;border-radius:50%;background:#232323;border:1px solid rgba(255,255,255,.12);color:#fff;font-size:15px;cursor:pointer;flex:none}
.bk:active{transform:scale(.9)}
.ct{flex:1;text-align:center;font-size:13px;font-weight:700;color:#d5d5d5}
.salin{flex:none;background:linear-gradient(135deg,#ff1f3d,#d6002b);border:0;color:#fff;font-weight:800;font-size:12.5px;border-radius:999px;padding:8px 16px;cursor:pointer;display:flex;align-items:center;gap:6px}
.salin:active{transform:scale(.94)}
.vid{position:relative;margin-top:10px;border-radius:14px;overflow:hidden;background:#000;flex:none}
.vid video{width:100%;aspect-ratio:16/9;display:block;background:#000}
.vid .nov{padding:34px 16px;text-align:center;font-size:12.5px;color:#bdbdbd;line-height:1.6}
.jd{margin-top:10px}
.jd b{display:block;font-size:14px;line-height:1.35;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.jd span{display:block;font-size:12px;color:#a8a8a8;margin-top:3px}
.nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:auto;padding-top:10px}
.nav button{width:46px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:#232323;color:#fff;font-size:14px;cursor:pointer}
.nav button:active{transform:scale(.92)}
.nav button:disabled{opacity:.3}
.nav b{font-size:12.5px;color:#cfcfcf;min-width:52px;text-align:center}
.toast{position:absolute;left:50%;bottom:18px;transform:translateX(-50%) translateY(20px);background:rgba(20,20,20,.94);border:1px solid rgba(255,255,255,.16);color:#fff;font-size:12px;font-weight:600;padding:9px 16px;border-radius:999px;opacity:0;transition:all .3s;pointer-events:none;max-width:92%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:9}
.toast.on{opacity:1;transform:translateX(-50%) translateY(0)}
@keyframes naik{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
`

/**
 * @param d { items:[{id,judul,artis,thumb,stream,link}], idx, token, P }
 */
export function ytlivePlayerHtml (bot, d = {}) {
  const P = String(d.P || '.')
  const token = String(d.token || '')
  const items = (Array.isArray(d.items) ? d.items : []).map(v => ({ id: v.id, judul: String(v.judul || '-'), artis: String(v.artis || ''), thumb: v.thumb || '', stream: v.stream || '', link: v.link || '' }))
  const idx = Math.max(0, Math.min(items.length - 1, Number(d.idx) || 0))
  const cur = items[idx] || { judul: '-', artis: '', thumb: '', stream: '', link: '' }
  const data = JSON.stringify({ items, idx, token, P }).replace(/</g, '‹')
  const js = `(function(){${JS_BANTU}` +
    `var D=__YT,i=D.idx,P=D.P;` +
    `function tampil(){var v=D.items[i];document.getElementById('jd').textContent=v.judul;document.getElementById('ar').textContent=v.artis;document.getElementById('ct').textContent=(i+1)+'/'+D.items.length;document.getElementById('pg2').textContent=(i+1)+'/'+D.items.length;var vd=document.getElementById('vd');if(vd&&v.stream){vd.poster=v.thumb||'';var s=document.getElementById('src');if(s){s.src=v.stream}vd.load()}document.getElementById('sebelum').disabled=i<=0;document.getElementById('lanjut').disabled=i>=D.items.length-1}` +
    `document.getElementById('sebelum').addEventListener('click',function(){if(i>0){i--;tampil()}});` +
    `document.getElementById('lanjut').addEventListener('click',function(){if(i<D.items.length-1){i++;tampil()}});` +
    `document.getElementById('salin').addEventListener('click',function(){var v=D.items[i];salin(v.link||'');toast('📋 Link disalin')});` +
    `document.getElementById('kembali').addEventListener('click',function(){salin(P+'ytlive #'+D.token);toast('📋 Disalin — tempel & kirim untuk kembali')});` +
    `tampil();})();`
  return `<style>${CSS_MAIN}</style><div class="w"><div class="f"><div class="in">` +
    `<div class="bar"><button class="bk" id="kembali">←</button><div class="ct" id="ct">${idx + 1}/${items.length || 1}</div><button class="salin" id="salin">📋 Salin</button></div>` +
    `<div class="vid">${cur.stream ? `<video id="vd" controls playsinline webkit-playsinline preload="metadata" poster="${cur.thumb}"><source id="src" src="${cur.stream}" type="video/mp4">Browser tidak mendukung video.</video>` : `<div class="nov">Video dikirim sebagai pesan di bawah ⬇️<br>(stream kartu tidak tersedia)</div>`}</div>` +
    `<div class="jd"><b id="jd">${esc(cur.judul)}</b><span id="ar">${esc(cur.artis)}</span></div>` +
    `<div class="nav"><button id="sebelum">▲</button><b id="pg2">${idx + 1}/${items.length || 1}</b><button id="lanjut">▼</button></div>` +
    `</div><div class="toast" id="toast"></div></div></div><script>var __YT=${data};${js}</script>`
}

export default { ytliveSearchHtml, ytlivePlayerHtml, rasioCari }
