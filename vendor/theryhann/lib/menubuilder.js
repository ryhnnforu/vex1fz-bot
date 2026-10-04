/**
 * lib/menubuilder.js — 🎨 MENU BUILDER (v7.30.0)
 *  .buatmenu → kartu HTML "studio": pilih TEMPLATE (8), TEMA warna (10), BENTUK (4),
 *  LATAR animasi (5), FONT (4), isi (sapaan/pembuka) → pratinjau langsung berubah di kartu.
 *  Tombol "💾 Save & Terapkan" menghasilkan kode konfigurasi (webview WA tidak bisa
 *  mengirim pesan) → user kirim `.simpanmenu <kode>` → tersimpan sebagai menuN
 *  (N otomatis: 4, 5, 6, …), langsung diterapkan; `.setmenuN` untuk memakai lagi.
 *
 *  renderMenuKustom(cfg, data) → HTML menu final untuk dipakai features/menu.js.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const TEMPLATE = {
  ios: { nama: 'iOS Home', ket: 'grid ikon app + dock (ala iPhone)' },
  glass: { nama: 'Glass Card', ket: 'panel kaca bertumpuk + daftar kategori' },
  neon: { nama: 'Neon Arcade', ket: 'garis neon, grid retro, glow' },
  minimal: { nama: 'Minimal Putih', ket: 'putih bersih, tipografi besar' },
  terminal: { nama: 'Terminal Hacker', ket: 'monospace hijau, kursor berkedip' },
  kartu: { nama: 'Kartu Bank', ket: 'kartu kredit metalik + chip' },
  majalah: { nama: 'Majalah', ket: 'judul serif besar, kolom, garis emas' },
  bubble: { nama: 'Bubble Chat', ket: 'gelembung chat lucu, warna pastel' }
}
export const TEMA = {
  ungu: ['#7c3aed', '#c084fc', '#0b0620'], biru: ['#0a84ff', '#5ac8fa', '#03102a'], merah: ['#ff3b30', '#ff9f0a', '#200606'],
  hijau: ['#30d158', '#a3e635', '#04160a'], pink: ['#ff2d55', '#ff9ac2', '#220613'], emas: ['#f59e0b', '#fde68a', '#1a1204'],
  cyan: ['#22d3ee', '#818cf8', '#031a1f'], hitam: ['#e5e7eb', '#9ca3af', '#000000'], sunset: ['#f97316', '#db2777', '#1a0710'], ocean: ['#0ea5e9', '#14b8a6', '#02141d']
}
export const BENTUK = { bulat: 28, kotak: 6, pil: 44, tajam: 0 }
export const LATAR = { gradasi: 'gradasi bergerak', blob: 'blob blur melayang', partikel: 'partikel naik', grid: 'grid neon', polos: 'polos' }
export const FONT = { sistem: '-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif', serif: 'Georgia,"Times New Roman",serif', mono: 'ui-monospace,Menlo,Consolas,monospace', bulat: '"Trebuchet MS","Segoe UI",Verdana,sans-serif' }

/** kode ⇄ konfigurasi: T:ios|W:ungu|B:bulat|L:blob|F:sistem|S:sapaan|P:pembuka */
export function kodeKeCfg (kode) {
  const cfg = { template: 'ios', tema: 'ungu', bentuk: 'bulat', latar: 'gradasi', font: 'sistem', sapaan: '', pembuka: '' }
  String(kode || '').split('|').forEach(p => {
    const [k, ...v] = p.split(':'); const val = v.join(':').trim()
    if (k === 'T' && TEMPLATE[val]) cfg.template = val
    if (k === 'W' && TEMA[val]) cfg.tema = val
    if (k === 'B' && BENTUK[val] != null) cfg.bentuk = val
    if (k === 'L' && LATAR[val]) cfg.latar = val
    if (k === 'F' && FONT[val]) cfg.font = val
    if (k === 'S') cfg.sapaan = val.slice(0, 60)
    if (k === 'P') cfg.pembuka = val.slice(0, 160)
  })
  return cfg
}
export const cfgKeKode = c => `T:${c.template}|W:${c.tema}|B:${c.bentuk}|L:${c.latar}|F:${c.font}${c.sapaan ? '|S:' + c.sapaan : ''}${c.pembuka ? '|P:' + c.pembuka : ''}`

/* ---------- mesin render (dipakai builder DI DALAM kartu dan bot) ---------- */
const ENGINE = String.raw`
var TEMA=__TEMA,BENTUK=__BENTUK,FONT=__FONT;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function latar(c,t){var a=t[0],b=t[1],bg=t[2];
 if(c.latar==='gradasi')return '<div class="bg" style="background:linear-gradient(160deg,'+a+','+b+','+bg+');background-size:300% 300%;animation:wp 14s ease infinite"></div>';
 if(c.latar==='blob')return '<div class="bg" style="background:'+bg+'"><i class="bl" style="background:'+a+';left:-60px;top:-40px"></i><i class="bl" style="background:'+b+';right:-80px;top:35%;animation-delay:-5s"></i><i class="bl" style="background:'+a+';left:10%;bottom:-60px;animation-delay:-9s;opacity:.4"></i></div>';
 if(c.latar==='partikel'){var h='';for(var i=0;i<22;i++)h+='<i class="pt" style="left:'+(Math.random()*100)+'%;top:'+(60+Math.random()*50)+'%;animation-duration:'+(7+Math.random()*9)+'s;animation-delay:-'+(Math.random()*12)+'s;background:'+(i%2?a:b)+'"></i>';return '<div class="bg" style="background:radial-gradient(80% 60% at 50% 0%,'+a+'55,'+bg+' 70%)">'+h+'</div>'}
 if(c.latar==='grid')return '<div class="bg" style="background:'+bg+'"><div class="gr" style="background-image:linear-gradient('+a+'33 1px,transparent 1px),linear-gradient(90deg,'+a+'33 1px,transparent 1px)"></div><div class="hz" style="background:linear-gradient(transparent,'+a+'66)"></div></div>';
 return '<div class="bg" style="background:'+bg+'"></div>'}
function render(c,d){var t=TEMA[c.tema]||TEMA.ungu,a=t[0],b=t[1],bg=t[2],r=BENTUK[c.bentuk],f=FONT[c.font],T=c.template;var K=d.kategori||[];var light=T==='minimal';
 var css='font-family:'+f+';--a:'+a+';--b:'+b+';--bg:'+bg+';--r:'+r+'px;--fg:'+(light?'#111':'#fff')+';--mut:'+(light?'rgba(0,0,0,.55)':'rgba(255,255,255,.65)')+';--pn:'+(light?'rgba(0,0,0,.05)':'rgba(255,255,255,.1)')+';--bd:'+(light?'rgba(0,0,0,.1)':'rgba(255,255,255,.18)');
 var sapa=c.sapaan||('Halo '+(d.nama||'kakak')+' 👋'),pem=c.pembuka||('Selamat datang di '+d.brand+'. Pilih kategori di bawah.');
 var hd='',body='',cls='tp-'+T;
 var ico=function(k,i){return '<div class="ik" style="background:linear-gradient(135deg,'+a+','+b+')">'+esc(k.icon)+'</div>'};
 if(T==='ios'){hd='<div class="isl">'+esc(d.brand)+' · '+esc(d.status)+'</div><div class="pn wid"><div class="lg">'+esc(d.brand[0])+'</div><div><h1>'+esc(d.brand)+'</h1><p>'+esc(sapa)+' · v'+esc(d.versi)+'</p></div></div><div class="row3"><div class="pn"><small>STATUS</small><b>'+esc(d.status)+'</b></div><div class="pn"><small>LIMIT</small><b>'+esc(d.limit)+'</b></div><div class="pn"><small>FITUR</small><b>'+esc(d.fitur)+'</b></div></div><div class="pn note">💬 '+esc(pem)+'</div>';
  body='<div class="grid4">'+K.map(function(k,i){return '<div class="app sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms">'+ico(k,i)+'<span class="bd">'+k.n+'</span><div class="nm">'+esc(k.t)+'</div></div>'}).join('')+'</div>'}
 else if(T==='glass'){hd='<div class="brand">'+esc(d.brand)+'</div><div class="sub">'+esc(sapa)+'</div><div class="pn note">'+esc(pem)+'</div><div class="row3"><div class="pn"><small>STATUS</small><b>'+esc(d.status)+'</b></div><div class="pn"><small>LIMIT</small><b>'+esc(d.limit)+'</b></div><div class="pn"><small>FITUR</small><b>'+esc(d.fitur)+'</b></div></div>';
  body=K.map(function(k,i){return '<div class="pn it sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms">'+ico(k,i)+'<div class="tx"><b>'+esc(k.t)+'</b><span>'+k.n+' perintah</span></div><span class="ar">›</span></div>'}).join('')}
 else if(T==='neon'){hd='<div class="neon">'+esc(d.brand)+'</div><div class="sub" style="letter-spacing:4px">INSERT COIN · '+esc(d.status)+'</div><div class="pn note" style="border-color:var(--a)">'+esc(sapa)+' — '+esc(pem)+'</div>';
  body='<div class="grid3">'+K.map(function(k,i){return '<div class="pn tile sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms;box-shadow:0 0 14px '+(i%2?a:b)+'66 inset">'+ico(k,i)+'<b>'+esc(k.t)+'</b><small>'+k.n+'</small></div>'}).join('')+'</div>'}
 else if(T==='minimal'){hd='<div class="big">'+esc(d.brand)+'</div><div class="sub">'+esc(sapa)+'</div><div class="line" style="background:'+a+'"></div><div class="note" style="padding:0">'+esc(pem)+'</div>';
  body=K.map(function(k,i){return '<div class="it sp" data-k="'+i+'" style="animation-delay:'+(i*30)+'ms;border-bottom:1px solid var(--bd);border-radius:0"><span class="num" style="color:'+a+'">'+('0'+(i+1)).slice(-2)+'</span><div class="tx"><b>'+esc(k.t)+'</b><span>'+k.n+' perintah</span></div><span class="ar">→</span></div>'}).join('')}
 else if(T==='terminal'){hd='<div class="term"><span style="color:'+a+'">root@'+esc(d.brand.toLowerCase().replace(/[^a-z0-9]/g,''))+'</span>:~$ menu --user "'+esc(d.nama)+'"<br><span style="color:var(--mut)">'+esc(sapa)+' · '+esc(pem)+'</span><br><span style="color:'+b+'">status='+esc(d.status)+' limit='+esc(d.limit)+' fitur='+esc(d.fitur)+'</span></div>';
  body='<div class="term">'+K.map(function(k,i){return '<div class="ln sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms"><span style="color:'+a+'">['+('0'+(i+1)).slice(-2)+']</span> '+esc(k.icon)+' '+esc(k.t.toLowerCase())+'<span style="color:var(--mut)"> …… '+k.n+'</span></div>'}).join('')+'<div class="cur">$ <i></i></div></div>'}
 else if(T==='kartu'){hd='<div class="bank" style="background:linear-gradient(135deg,'+a+','+b+' 60%,'+bg+')"><div class="chip"></div><div class="bn">'+esc(d.brand)+'</div><div class="no">'+esc(String(d.nomor||'0000 0000 0000').replace(/(\d{4})(?=\d)/g,'$1 '))+'</div><div class="bf"><span>'+esc(d.nama).toUpperCase()+'</span><span>'+esc(d.status)+'</span></div></div><div class="note" style="padding:6px 2px">'+esc(sapa)+' · '+esc(pem)+'</div>';
  body='<div class="grid3">'+K.map(function(k,i){return '<div class="pn tile sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms">'+ico(k,i)+'<b>'+esc(k.t)+'</b><small>'+k.n+'</small></div>'}).join('')+'</div>'}
 else if(T==='majalah'){hd='<div class="eyebrow" style="color:'+b+'">✦ EDISI '+esc(d.versi)+' ✦</div><div class="serif">'+esc(d.brand)+'</div><div class="rule" style="color:'+b+'">'+esc(sapa).toUpperCase()+'</div><div class="note" style="text-align:center;font-style:italic">'+esc(pem)+'</div>';
  body='<div class="cols">'+K.map(function(k,i){return '<div class="mg sp" data-k="'+i+'" style="animation-delay:'+(i*35)+'ms"><span style="color:'+b+'">'+esc(k.icon)+'</span> <b>'+esc(k.t)+'</b><small>'+k.n+'</small></div>'}).join('')+'</div>'}
 else {hd='<div class="bub me">'+esc(sapa)+'</div><div class="bub">'+esc(pem)+'</div><div class="bub">Status '+esc(d.status)+' · limit '+esc(d.limit)+' · '+esc(d.fitur)+' fitur ✨</div>';
  body='<div class="grid3">'+K.map(function(k,i){return '<div class="bubk sp" data-k="'+i+'" style="animation-delay:'+(i*40)+'ms;background:'+(i%2?a:b)+'22;border-color:'+(i%2?a:b)+'">'+esc(k.icon)+'<b>'+esc(k.t)+'</b><small>'+k.n+'</small></div>'}).join('')+'</div>'}
 return '<div class="mf '+cls+'" style="'+css+'">'+latar(c,t)+'<div class="mi">'+hd+body+'<div class="ft">'+esc(d.brand)+' · MENU KUSTOM</div></div></div>'}`

const CSS_MENU = `
.mf{position:relative;height:0;padding-bottom:var(--mr,190%);border-radius:calc(var(--r) + 8px);overflow:hidden;color:var(--fg);border:1px solid var(--bd)}
.mf .bg{position:absolute;inset:0}.mf .bl{position:absolute;width:260px;height:260px;border-radius:50%;filter:blur(50px);opacity:.6;animation:fl 13s ease-in-out infinite alternate}
.mf .pt{position:absolute;width:4px;height:4px;border-radius:50%;opacity:.6;animation:up linear infinite}.mf .gr{position:absolute;inset:0;background-size:28px 28px;transform:perspective(300px) rotateX(55deg) translateY(30%) scale(1.6);transform-origin:50% 100%}.mf .hz{position:absolute;left:0;right:0;bottom:0;height:40%}
@keyframes wp{0%{background-position:0% 0%}50%{background-position:100% 100%}100%{background-position:0% 0%}}@keyframes fl{0%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.15)}100%{transform:translate(-30px,50px) scale(.95)}}@keyframes up{0%{transform:translateY(0);opacity:0}10%{opacity:.8}100%{transform:translateY(-900px);opacity:0}}
.mf .mi{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:thin;padding:16px 14px 30px}
.mf .sp{animation:spring .7s cubic-bezier(.18,1.5,.4,1) both;opacity:0}@keyframes spring{from{opacity:0;transform:translateY(24px) scale(.85) rotate(-4deg)}60%{opacity:1;transform:translateY(-2px) scale(1.02) rotate(1deg)}to{opacity:1;transform:none}}
.mf .pn{background:var(--pn);border:1px solid var(--bd);border-radius:var(--r);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.mf .isl{margin:0 auto 12px;width:max-content;background:#000;color:#fff;border-radius:20px;padding:7px 16px;font-size:11px;animation:spring .8s both}
.mf .wid{display:flex;gap:12px;align-items:center;padding:14px}.mf .lg{width:50px;height:50px;border-radius:calc(var(--r)*.6);background:linear-gradient(135deg,#fff,var(--b));color:#111;font-weight:900;font-size:24px;display:flex;align-items:center;justify-content:center;flex:none}
.mf h1{font-size:19px;font-weight:800}.mf .wid p{font-size:12px;color:var(--mut)}
.mf .row3{display:flex;gap:8px;margin-top:10px}.mf .row3 .pn{flex:1;padding:8px 10px}.mf .row3 small{display:block;font-size:9px;letter-spacing:1.5px;color:var(--mut)}.mf .row3 b{font-size:13px}
.mf .note{margin-top:10px;padding:10px 12px;font-size:12px;line-height:1.5}
.mf .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;margin-top:16px}.mf .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
.mf .app{text-align:center;position:relative;cursor:pointer}.mf .ik{width:56px;height:56px;margin:0 auto;border-radius:calc(var(--r)*.65);display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:inset 0 -6px 12px rgba(0,0,0,.2),0 6px 14px rgba(0,0,0,.25);flex:none}
.mf .app .bd{position:absolute;top:-6px;right:calc(50% - 36px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#ff3b30;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}.mf .app .nm{font-size:10.5px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mf .brand{font-size:30px;font-weight:900;letter-spacing:1px;background:linear-gradient(90deg,#fff,var(--b),#fff);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sh 6s linear infinite}@keyframes sh{to{background-position:200% 0}}
.mf .sub{font-size:12px;color:var(--mut);margin-top:2px}
.mf .it{display:flex;align-items:center;gap:12px;padding:10px 12px;margin-top:8px;cursor:pointer}.mf .it .ik{width:40px;height:40px;font-size:20px}.mf .tx{flex:1;min-width:0}.mf .tx b{display:block;font-size:14px}.mf .tx span{font-size:11px;color:var(--mut)}.mf .ar{color:var(--mut);font-size:20px}
.mf .neon{font-size:32px;font-weight:900;letter-spacing:3px;text-align:center;color:#fff;text-shadow:0 0 8px var(--a),0 0 24px var(--a),0 0 48px var(--b);animation:flk 3s infinite}@keyframes flk{0%,92%,100%{opacity:1}94%{opacity:.5}96%{opacity:1}98%{opacity:.6}}
.mf .tile{text-align:center;padding:12px 6px;cursor:pointer}.mf .tile .ik{width:46px;height:46px;font-size:22px;margin-bottom:6px}.mf .tile b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mf .tile small{font-size:9px;color:var(--mut)}
.mf .big{font-size:40px;font-weight:900;letter-spacing:-1.5px;line-height:1}.mf .line{height:4px;width:60px;margin:12px 0}.mf .num{font-size:22px;font-weight:900;width:36px;font-family:ui-monospace,monospace}
.mf .term{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.8;padding:12px;background:rgba(0,0,0,.45);border:1px solid var(--bd);border-radius:var(--r);margin-top:10px}.mf .ln{cursor:pointer}.mf .cur i{display:inline-block;width:8px;height:14px;background:var(--a);vertical-align:middle;animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
.mf .bank{border-radius:var(--r);padding:18px;height:190px;position:relative;box-shadow:0 20px 40px rgba(0,0,0,.4);animation:spring .8s both;overflow:hidden}.mf .bank:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.25) 45%,transparent 60%);background-size:250% 100%;animation:sh 4s linear infinite}
.mf .chip{width:44px;height:32px;border-radius:7px;background:linear-gradient(135deg,#f5d77a,#c9a94b);box-shadow:inset 0 0 0 2px rgba(0,0,0,.2)}.mf .bn{position:absolute;top:18px;right:18px;font-weight:900;font-style:italic;font-size:16px}.mf .no{font-family:ui-monospace,monospace;font-size:20px;letter-spacing:3px;margin-top:26px;text-shadow:0 1px 1px rgba(0,0,0,.5)}.mf .bf{display:flex;justify-content:space-between;font-size:11px;letter-spacing:1px;margin-top:22px}
.mf .eyebrow{text-align:center;font-size:10px;letter-spacing:5px;font-weight:800}.mf .serif{font-family:Georgia,"Times New Roman",serif;font-size:36px;text-align:center;letter-spacing:2px;font-weight:700;margin-top:4px}.mf .rule{display:flex;align-items:center;gap:10px;font-size:10px;letter-spacing:3px;margin:8px 0}.mf .rule:before,.mf .rule:after{content:"";flex:1;height:1px;background:currentColor;opacity:.6}
.mf .cols{columns:2;column-gap:14px;margin-top:12px}.mf .mg{break-inside:avoid;padding:8px 0;border-bottom:1px solid var(--bd);font-size:13px;cursor:pointer;display:flex;gap:6px;align-items:center}.mf .mg small{margin-left:auto;color:var(--mut)}
.mf .bub{max-width:82%;background:var(--pn);border:1px solid var(--bd);border-radius:20px;padding:10px 14px;font-size:13px;margin-top:8px;animation:spring .6s both}.mf .bub.me{margin-left:auto;background:var(--a);color:#fff}
.mf .bubk{text-align:center;border:2px solid;border-radius:22px;padding:12px 6px;font-size:24px;cursor:pointer}.mf .bubk b{display:block;font-size:11px;margin-top:4px}.mf .bubk small{font-size:9px;color:var(--mut)}
.mf .ft{text-align:center;font-size:9px;letter-spacing:3px;color:var(--mut);margin-top:18px}
`

/** HTML MENU FINAL (dipakai .menu bila mode = menuN kustom) — sama seperti MENU2: kategori bisa dibuka (app open) */
export function renderMenuKustom (cfg, d = {}) {
  const K = (d.kategori || []).map(k => ({ t: k.title.replace(/ Menu$/i, ''), icon: k.icon || '📂', n: k.items.length, items: k.items.map(i => [i.icon || '▸', i.title, i.desc || '', i.cmd]) }))
  const data = { brand: String(d.brand || 'THERYHANN!'), nama: String(d.nama || 'kakak').slice(0, 18), status: String(d.status || '-'), limit: String(d.limit ?? '-'), fitur: String(d.fitur ?? '-'), versi: String(d.versi || ''), nomor: String(d.nomor || ''), kategori: K.map(k => ({ t: k.t, icon: k.icon, n: k.n })) }
  const perBaris = { ios: 4, glass: 1, minimal: 1, terminal: 1, majalah: 2, neon: 3, kartu: 3, bubble: 3 }[cfg.template] || 3
  const tinggiBaris = { ios: 108, glass: 74, minimal: 66, terminal: 30, majalah: 36, neon: 104, kartu: 104, bubble: 104 }[cfg.template] || 104
  const kepala = { ios: 360, glass: 330, minimal: 250, terminal: 160, majalah: 270, neon: 290, kartu: 360, bubble: 280 }[cfg.template] || 330
  const baris = Math.ceil(K.length / perBaris)
  const tinggi = kepala + baris * tinggiBaris + 70
  const ratio = Math.max(120, Math.min(270, Math.round(tinggi / 480 * 100))) + '%'
  return `<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}html,body{background:#000;color:#fff;font-family:-apple-system,"Segoe UI",Roboto,sans-serif}.w{max-width:480px;margin:0 auto;padding:8px}${CSS_MENU}${CSS_APP}</style>` +
    `<div class="w"><div id="root" style="--mr:${ratio}"></div><div class="appv" id="appv"></div><div class="toast" id="toast"></div></div>` +
    `<script>var __TEMA=${JSON.stringify(TEMA)},__BENTUK=${JSON.stringify(BENTUK)},__FONT=${JSON.stringify(FONT)};${ENGINE}
var CFG=${JSON.stringify(cfg)},D=${JSON.stringify(data).replace(/</g, '\\u003c')},K=${JSON.stringify(K).replace(/</g, '\\u003c')};
document.getElementById('root').innerHTML=render(CFG,D);${JS_APP}</script>`
}

/* layar kategori (app open) + toast — dipakai menu final */
const CSS_APP = `
.w{position:relative}
.appv{position:absolute;left:8px;right:8px;top:8px;bottom:8px;background:#0b0b0f;border-radius:30px;transform:scale(.1);opacity:0;pointer-events:none;transition:transform .5s cubic-bezier(.32,.72,0,1),opacity .35s;z-index:5;display:flex;flex-direction:column;overflow:hidden}
.appv.on{transform:none;opacity:1;pointer-events:auto}
.nav{padding:18px 16px 10px;background:rgba(28,28,30,.9);border-bottom:1px solid rgba(255,255,255,.08)}.nav .bk{color:#0a84ff;font-size:16px;cursor:pointer}.nav h2{font-size:28px;font-weight:800;margin-top:4px}.nav p{font-size:12px;color:rgba(255,255,255,.55)}
.sr{margin-top:10px;background:rgba(118,118,128,.24);border-radius:12px;padding:8px 12px;display:flex;gap:8px;color:rgba(235,235,245,.6)}.sr input{flex:1;background:none;border:0;outline:0;color:#fff;font-size:15px;font-family:inherit;min-width:0}
.lst{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;scrollbar-width:thin;padding:14px 16px 30px}.grp{background:#1c1c1e;border-radius:14px;overflow:hidden;margin-bottom:14px}
.row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.08);animation:rin .45s cubic-bezier(.2,1.2,.4,1) both;cursor:pointer}.row:last-child{border:0}.row.on{background:rgba(255,255,255,.08)}
@keyframes rin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.row .ri{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}.row .rt{flex:1;min-width:0}.row .rt b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row .rt span{display:block;font-size:12px;color:rgba(235,235,245,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row .cmd{font-size:11px;font-family:ui-monospace,monospace;color:#0a84ff;flex:none;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.toast{position:absolute;left:50%;top:40px;transform:translate(-50%,-30px);background:rgba(44,44,46,.96);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:13px;padding:10px 16px;border-radius:18px;opacity:0;transition:all .4s cubic-bezier(.2,1.4,.4,1);max-width:86%;text-align:center;z-index:9;pointer-events:none}.toast.on{opacity:1;transform:translate(-50%,0)}
`
const JS_APP = String.raw`(function(){var I=function(i){return document.getElementById(i)},tst=I('toast'),tm;function toast(t){tst.textContent=t;tst.className='toast on';clearTimeout(tm);tm=setTimeout(function(){tst.className='toast'},2200)}
function salin(t){try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();var ok=document.execCommand&&document.execCommand('copy');document.body.removeChild(ta);return ok}catch(e){return false}}
var appv=I('appv');function bind(root){Array.prototype.forEach.call(root.querySelectorAll('.row'),function(el){el.addEventListener('click',function(){Array.prototype.forEach.call(root.querySelectorAll('.row'),function(x){x.className='row'});el.className='row on';var c=el.getAttribute('data-cmd');toast((salin(c)?'📋 Disalin: ':'Ketik: ')+c)})})}
function rend(idx,q){var k=K[idx],items=k.items;if(q){q=q.toLowerCase();items=items.filter(function(it){return (it[1]+' '+it[2]+' '+it[3]).toLowerCase().indexOf(q)>=0})}var h='';for(var g=0;g<items.length;g+=8)h+='<div class="grp">'+items.slice(g,g+8).map(function(it,j){return '<div class="row" data-cmd="'+esc(it[3])+'" style="animation-delay:'+Math.min((g+j)*22,700)+'ms"><div class="ri" style="background:linear-gradient(135deg,'+TEMA[CFG.tema][0]+','+TEMA[CFG.tema][1]+')">'+esc(it[0])+'</div><div class="rt"><b>'+esc(it[1])+'</b><span>'+esc(it[2])+'</span></div><div class="cmd">'+esc(it[3])+'</div></div>'}).join('')+'</div>';I('lst').innerHTML=h||'<p style="text-align:center;opacity:.5;padding:30px">kosong</p>';bind(I('lst'))}
function buka(idx,el){var k=K[idx];var r=el.getBoundingClientRect(),fr=document.querySelector('.w').getBoundingClientRect();appv.style.transformOrigin=((r.left+r.width/2-fr.left)/fr.width*100)+'% '+((r.top+r.height/2-fr.top)/fr.height*100)+'%';
 appv.innerHTML='<div class="nav"><div class="bk" id="bk">‹ Kembali</div><h2>'+esc(k.icon)+' '+esc(k.t)+'</h2><p>'+k.n+' perintah · ketuk = salin</p><div class="sr">🔍<input id="q" placeholder="Cari di '+esc(k.t)+'"></div></div><div class="lst" id="lst"></div>';rend(idx,'');requestAnimationFrame(function(){appv.className='appv on'});I('bk').addEventListener('click',function(){appv.className='appv'});I('q').addEventListener('input',function(){rend(idx,I('q').value.trim())})}
Array.prototype.forEach.call(document.querySelectorAll('[data-k]'),function(a){a.addEventListener('click',function(){buka(+a.getAttribute('data-k'),a)})})})();`

/* ---------- KARTU STUDIO (.buatmenu) ---------- */
export function builderHtml (d = {}) {
  const K = (d.kategori || []).map(k => ({ t: k.title.replace(/ Menu$/i, ''), icon: k.icon || '📂', n: k.items.length }))
  const data = { brand: String(d.brand || 'THERYHANN!'), nama: String(d.nama || 'kakak').slice(0, 18), status: String(d.status || '-'), limit: String(d.limit ?? '-'), fitur: String(d.fitur ?? '-'), versi: String(d.versi || ''), nomor: String(d.nomor || ''), kategori: K }
  const opsi = (id, obj, label) => `<div class="op"><div class="lb">${label}</div><div class="ch" id="${id}">${Object.keys(obj).map((k, i) => `<span data-v="${k}"${i === 0 ? ' class="on"' : ''}>${esc(obj[k]?.nama || k)}</span>`).join('')}</div></div>`
  const swatch = `<div class="op"><div class="lb">TEMA WARNA</div><div class="ch sw" id="W">${Object.entries(TEMA).map(([k, v], i) => `<span data-v="${k}"${i === 0 ? ' class="on"' : ''} style="background:linear-gradient(135deg,${v[0]},${v[1]})" title="${k}"></span>`).join('')}</div></div>`
  return `<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}html,body{background:#000;color:#fff;font-family:-apple-system,"Segoe UI",Roboto,sans-serif}.w{max-width:480px;margin:0 auto;padding:8px}
.std{border-radius:28px;background:#0f0f14;border:1px solid rgba(255,255,255,.12);padding:14px;overflow:hidden}
.hd{display:flex;align-items:center;gap:10px;margin-bottom:10px}.hd .ic{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#a78bfa,#38bdf8);display:flex;align-items:center;justify-content:center;font-size:20px}.hd h1{font-size:17px;font-weight:800}.hd p{font-size:11px;color:rgba(255,255,255,.55)}
.prev{position:relative;border-radius:22px;overflow:hidden;transform:scale(1);transition:transform .35s cubic-bezier(.2,1.4,.4,1)}.prev.pop{animation:pop .5s cubic-bezier(.2,1.6,.4,1)}@keyframes pop{0%{transform:scale(.96)}100%{transform:scale(1)}}
.prev .mf{padding-bottom:150%}
.op{margin-top:12px}.lb{font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.55);font-weight:800;margin-bottom:6px}
.ch{display:flex;flex-wrap:wrap;gap:6px}.ch span{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:6px 11px;font-size:12px;cursor:pointer;transition:all .2s}.ch span.on{background:#a78bfa;color:#111;border-color:#a78bfa;font-weight:800;transform:scale(1.05)}
.sw span{width:30px;height:30px;border-radius:50%;padding:0;border:2px solid transparent}.sw span.on{border-color:#fff;transform:scale(1.15)}
.in{width:100%;margin-top:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;color:#fff;font-size:13px;font-family:inherit;outline:0}
.btn{margin-top:14px;background:linear-gradient(135deg,#34d399,#0ea5e9);color:#05130f;font-weight:900;text-align:center;padding:14px;border-radius:16px;font-size:15px;cursor:pointer;box-shadow:0 10px 30px rgba(52,211,153,.3);transition:transform .2s}.btn:active{transform:scale(.97)}
.kode{margin-top:10px;background:#000;border:1px dashed rgba(255,255,255,.3);border-radius:12px;padding:10px;font-family:ui-monospace,monospace;font-size:11px;word-break:break-all;display:none;line-height:1.5}.kode.on{display:block;animation:pop .4s}
.kode b{color:#34d399;display:block;margin-bottom:4px;font-family:inherit}.tip{font-size:11px;color:rgba(255,255,255,.55);margin-top:8px;line-height:1.5}
.toast{position:fixed;left:50%;top:14px;transform:translate(-50%,-30px);background:#1c1c1e;border:1px solid rgba(255,255,255,.12);color:#fff;font-size:13px;padding:10px 16px;border-radius:18px;opacity:0;transition:all .4s;z-index:9;max-width:86%;text-align:center;pointer-events:none}.toast.on{opacity:1;transform:translate(-50%,0)}
${CSS_MENU}</style>
<div class="w"><div class="std"><div class="hd"><div class="ic">🎨</div><div><h1>MENU STUDIO</h1><p>Rakit tampilan menu sesukamu · pratinjau langsung berubah</p></div></div>
<div class="prev" id="prev"></div>
${opsi('T', TEMPLATE, 'TEMPLATE / BENTUK UI')}${swatch}${opsi('B', BENTUK, 'SUDUT')}${opsi('L', Object.fromEntries(Object.keys(LATAR).map(k => [k, { nama: LATAR[k] }])), 'LATAR / ANIMASI')}${opsi('F', FONT, 'FONT')}
<div class="op"><div class="lb">TEKS</div><input class="in" id="S" placeholder="Sapaan (kosong = otomatis: Halo nama 👋)" maxlength="60"><input class="in" id="P" placeholder="Kalimat pembuka (kosong = otomatis)" maxlength="160"></div>
<div class="btn" id="save">💾 Save & Terapkan → simpan sebagai MENU${esc(d.nomorBaru || 4)}</div>
<div class="kode" id="kode"></div>
<div class="tip">Setelah ketuk tombol, kode konfigurasi muncul & tersalin. <b>Kirim kode itu ke chat</b> (tempel) → bot menyimpannya sebagai <b>menu${esc(d.nomorBaru || 4)}</b> & langsung memakainya. Menu berikutnya otomatis menu${esc((d.nomorBaru || 4) + 1)}, dst. Ganti kapan saja: <b>${esc(d.prefix || '.')}setmenu${esc(d.nomorBaru || 4)}</b> · daftar: <b>${esc(d.prefix || '.')}menusaya</b></div>
</div><div class="toast" id="toast"></div></div>
<script>var __TEMA=${JSON.stringify(TEMA)},__BENTUK=${JSON.stringify(BENTUK)},__FONT=${JSON.stringify(FONT)};${ENGINE}
(function(){var I=function(i){return document.getElementById(i)},D=${JSON.stringify(data).replace(/</g, '\\u003c')},C={template:'ios',tema:'ungu',bentuk:'bulat',latar:'gradasi',font:'sistem',sapaan:'',pembuka:''},map={T:'template',W:'tema',B:'bentuk',L:'latar',F:'font'},tst=I('toast'),tm;
function toast(t){tst.textContent=t;tst.className='toast on';clearTimeout(tm);tm=setTimeout(function(){tst.className='toast'},2600)}
function draw(){var p=I('prev');p.innerHTML=render(C,D);p.className='prev';void p.offsetWidth;p.className='prev pop'}
Object.keys(map).forEach(function(id){var box=I(id);Array.prototype.forEach.call(box.querySelectorAll('span'),function(s){s.addEventListener('click',function(){Array.prototype.forEach.call(box.querySelectorAll('span'),function(x){x.className=''});s.className='on';C[map[id]]=s.getAttribute('data-v');draw()})})});
I('S').addEventListener('input',function(){C.sapaan=I('S').value;draw()});I('P').addEventListener('input',function(){C.pembuka=I('P').value;draw()});
I('save').addEventListener('click',function(){var kode='${esc(d.prefix || '.')}simpanmenu T:'+C.template+'|W:'+C.tema+'|B:'+C.bentuk+'|L:'+C.latar+'|F:'+C.font+(C.sapaan?'|S:'+C.sapaan.replace(/\|/g,'/'):'')+(C.pembuka?'|P:'+C.pembuka.replace(/\|/g,'/'):'');var ok=false;try{var ta=document.createElement('textarea');ta.value=kode;document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');document.body.removeChild(ta)}catch(e){}
 var k=I('kode');k.innerHTML='<b>✅ '+(ok?'Kode tersalin!':'Salin kode ini:')+' Kirim ke chat untuk menyimpan sebagai MENU${esc(d.nomorBaru || 4)}</b>'+kode.replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]});k.className='kode on';toast(ok?'📋 Kode disalin — tempel & kirim ke chat':'Salin kode di bawah lalu kirim ke chat')});
draw()})();</script>`
}

export default { TEMPLATE, TEMA, BENTUK, LATAR, FONT, kodeKeCfg, cfgKeKode, renderMenuKustom, builderHtml }
