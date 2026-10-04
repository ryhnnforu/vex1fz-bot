/**
 * lib/spotifyhtml.js — PEMUTAR ALA SPOTIFY "PLAYING FROM SEARCH" (v7.10.0)
 * ------------------------------------------------------------------
 *  Meniru layar Now Playing Spotify (referensi screenshot pengguna):
 *  header "PLAYING FROM SEARCH" + judul, cover besar rounded, judul +
 *  artis + ♥, seekbar tipis putih, ⇄ ⏮ (⏯ putih besar) ⏭ ↻, latar
 *  gradasi gelap dari warna cover. Ketuk cover / geser ke atas → LIRIK
 *  (sinkron per baris jika tersedia, baris aktif menyala, auto-scroll).
 *  Audio ditanam base64 (webview WA memblokir URL luar).
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#121212;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.sp{position:relative;max-width:520px;margin:0 auto;min-height:100vh;padding:14px 18px 26px;background:linear-gradient(180deg,var(--c1,#3a2a2f) 0%,#1a1517 45%,#121212 100%);overflow:hidden}
.top{display:flex;align-items:center;justify-content:space-between;height:40px}
.top .ic{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#fff;opacity:.9}
.top .mid{text-align:center;flex:1;min-width:0}
.top .mid small{display:block;font-size:10px;letter-spacing:2px;color:#d0d0d0;text-transform:uppercase}
.top .mid b{display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}
.cv{position:relative;margin:26px 0 26px;border-radius:10px;overflow:hidden;aspect-ratio:1/1;background:#2a2a2a;box-shadow:0 18px 40px rgba(0,0,0,.6)}
.cv img{width:100%;height:100%;object-fit:cover;display:block}
.cv .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#535353,#212121)}
.cv .ph svg{width:38%;height:38%;opacity:.8}
.lyr{position:absolute;inset:0;background:rgba(20,16,18,.94);padding:18px 16px;overflow:auto;display:none;scroll-behavior:smooth}
.lyr.on{display:block}
.lyr small{display:block;font-size:10px;letter-spacing:2px;color:#b3b3b3;text-transform:uppercase;margin-bottom:12px}
.lyr .l{font-size:18px;line-height:1.45;font-weight:700;color:rgba(255,255,255,.45);padding:4px 0;transition:color .2s}
.lyr .l.on{color:#fff}
.lyr .l.ps{color:rgba(255,255,255,.9)}
.lyr .kos{color:#b3b3b3;font-size:14px;font-weight:400;text-align:center;margin-top:40px}
.ttl{display:flex;align-items:center;justify-content:space-between;gap:12px}
.ttl .t{min-width:0}
.ttl .t b{display:block;font-size:22px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl .t span{display:block;font-size:15px;color:#b3b3b3;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hrt{flex:none;width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:#fff}
.hrt.on{color:#1ed760}
.sk{margin-top:18px}
.sk input{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;outline:none;background:linear-gradient(90deg,#fff var(--p,0%),rgba(255,255,255,.28) var(--p,0%))}
.sk input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff}
.sk .tm{display:flex;justify-content:space-between;font-size:12px;color:#b3b3b3;margin-top:8px}
.ctl{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.ctl .b{flex:none;width:48px;height:48px;display:flex;align-items:center;justify-content:center;color:#fff}
.ctl .b.dim{color:#b3b3b3}
.ctl .b.on{color:#1ed760}
.ctl .big{flex:none;width:76px;height:76px;min-width:76px;aspect-ratio:1/1;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.ctl .big:active{transform:scale(.96)}
.bot{display:flex;justify-content:space-between;align-items:center;margin-top:22px;color:#b3b3b3;font-size:11px;letter-spacing:1px}
.bot .pill{border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:5px 10px;text-transform:uppercase}
.wm{text-align:center;font-size:10px;color:rgba(255,255,255,.35);margin-top:14px;letter-spacing:1px}
`

const JS = `
(function(){
  var D = __SP, au = document.getElementById('au'), seek = document.getElementById('seek'), cur = document.getElementById('cur'), tot = document.getElementById('tot');
  var big = document.getElementById('big'), rep = document.getElementById('rep'), shf = document.getElementById('shf'), hrt = document.getElementById('hrt'), lyr = document.getElementById('lyr'), cv = document.getElementById('cv'), st = document.getElementById('st'), tgl = document.getElementById('tgl');
  var IP = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>', IZ = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var loop = false, acak = false, drag = false;
  function fmt (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  big.innerHTML = IP; tot.textContent = fmt(D.durasi || 0);
  au.src = D.url; au.load();
  au.onloadedmetadata = function () { if (isFinite(au.duration) && au.duration > 0) tot.textContent = fmt(au.duration); st.textContent = 'SIAP'; };
  au.onerror = function () { if (D.cadangan && au.src !== D.cadangan) { st.textContent = 'STREAM GAGAL → CADANGAN'; au.src = D.cadangan; au.load(); au.play().catch(function(){}); return } st.textContent = 'AUDIO GAGAL'; };
  au.onplay = function () { big.innerHTML = IZ; st.textContent = 'PLAYING'; };
  au.onpause = function () { big.innerHTML = IP; if (!au.ended) st.textContent = 'PAUSED'; };
  au.onended = function () { if (loop) { au.currentTime = 0; au.play(); } else { big.innerHTML = IP; st.textContent = 'SELESAI'; } };
  function toggle () { if (au.paused) { var p = au.play(); if (p && p.catch) p.catch(function(){ st.textContent = 'KETUK ▶ LAGI'; }); } else au.pause(); }
  big.onclick = toggle;
  document.getElementById('prev').onclick = function () { au.currentTime = 0; };
  document.getElementById('next').onclick = function () { au.currentTime = Math.max(0, (au.duration || D.durasi || 0) - 0.3); };
  rep.onclick = function () { loop = !loop; rep.className = 'b' + (loop ? ' on' : ' dim'); };
  shf.onclick = function () { acak = !acak; shf.className = 'b' + (acak ? ' on' : ' dim'); if (acak) au.currentTime = Math.random() * (au.duration || D.durasi || 1) * 0.8; };
  hrt.onclick = function () { hrt.classList.toggle('on'); try { localStorage.setItem('sp_like_' + D.judul, hrt.classList.contains('on') ? '1' : ''); } catch (e) {} };
  try { if (localStorage.getItem('sp_like_' + D.judul)) hrt.classList.add('on'); } catch (e) {}
  au.ontimeupdate = function () { if (drag) return; var d = au.duration || D.durasi || 0; var p = d ? au.currentTime / d * 100 : 0; seek.value = p; seek.style.setProperty('--p', p + '%'); cur.textContent = fmt(au.currentTime); sorotLirik(au.currentTime); };
  seek.oninput = function () { drag = true; seek.style.setProperty('--p', seek.value + '%'); cur.textContent = fmt((au.duration || D.durasi || 0) * seek.value / 100); };
  seek.onchange = function () { drag = false; au.currentTime = (au.duration || D.durasi || 0) * seek.value / 100; };
  /* ---- lirik ---- */
  var L = D.lirik || null, baris = [], aktif = -1;
  if (L && L.sinkron && L.sinkron.length) { L.sinkron.forEach(function (x) { var d = document.createElement('div'); d.className = 'l'; d.textContent = x[1]; d.setAttribute('data-t', x[0]); d.onclick = function (e) { e.stopPropagation(); au.currentTime = x[0]; if (au.paused) toggle(); }; lyr.appendChild(d); baris.push(d); }); }
  else if (L && L.polos) { L.polos.split('\\n').forEach(function (t) { var d = document.createElement('div'); d.className = 'l ps'; d.textContent = t; lyr.appendChild(d); }); }
  else { var k = document.createElement('div'); k.className = 'kos'; k.textContent = 'Lirik tidak tersedia untuk lagu ini'; lyr.appendChild(k); }
  function sorotLirik (t) { if (!baris.length) return; var i = -1; for (var j = 0; j < baris.length; j++) { if (+baris[j].getAttribute('data-t') <= t + 0.2) i = j; else break; } if (i === aktif) return; if (aktif >= 0) baris[aktif].classList.remove('on'); aktif = i; if (i >= 0) { baris[i].classList.add('on'); if (lyr.classList.contains('on')) lyr.scrollTop = Math.max(0, baris[i].offsetTop - lyr.clientHeight / 2 + 20); } }
  function toggleLirik () { lyr.classList.toggle('on'); tgl.textContent = lyr.classList.contains('on') ? 'COVER' : 'LIRIK'; if (aktif >= 0 && lyr.classList.contains('on')) lyr.scrollTop = Math.max(0, baris[aktif].offsetTop - lyr.clientHeight / 2 + 20); }
  cv.onclick = toggleLirik; tgl.onclick = toggleLirik;
  var y0 = null; cv.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true }); cv.addEventListener('touchend', function (e) { if (y0 !== null && y0 - e.changedTouches[0].clientY > 40) { if (!lyr.classList.contains('on')) toggleLirik(); } y0 = null; }, { passive: true });
})();
`

/**
 * @param {string} brand
 * @param {object} d {judul, artis, cover(dataURI/url), url(dataURI/url), durasi, lirik:{sinkron,polos}, sumber, warna}
 */
export function spotifyHtml (brand, d = {}) {
  const data = {
    judul: String(d.judul || 'Tanpa judul').slice(0, 120),
    artis: String(d.artis || '-').slice(0, 100),
    url: String(d.url || ''), cadangan: String(d.cadangan || ''),
    durasi: Number(d.durasi) || 0,
    lirik: d.lirik ? { sinkron: (d.lirik.sinkron || []).slice(0, 120), polos: d.lirik.polos ? String(d.lirik.polos).slice(0, 6000) : null } : null
  }
  const cover = d.cover
    ? `<img src="${esc(d.cover)}" alt="">`
    : '<div class="ph"><svg viewBox="0 0 24 24" fill="#b3b3b3"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg></div>'
  const c1 = /^#[0-9a-f]{6}$/i.test(d.warna || '') ? d.warna : '#4a2f36'
  const I = {
    down: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    dots: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.6-9.3-9A5.2 5.2 0 0 1 12 6.3 5.2 5.2 0 0 1 21.3 12C19 16.4 12 21 12 21z"/></svg>',
    shuf: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10.6 9.2 7.4 5H3v2h3.4l2.9 3.8zM14 5v2h2.6l-3.4 4.4 1.3 1.6L18.6 7H21v3l3-4-3-4v3zm-1.4 8.4L11.3 15 8.4 19H3v-2h4.4zM17 15.4V13l4 4-4 4v-2.6h-3.4l-2.5-3.3 1.3-1.6 2.2 2.9z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M16 6h2v12h-2zm-1.5 6L6 18V6z"/></svg>',
    rep: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg>'
  }
  return '<style>' + CSS + '</style>' +
    `<div class="sp" style="--c1:${esc(c1)}">` +
      `<div class="top"><div class="ic">${I.down}</div><div class="mid"><small>Playing from search</small><b>${esc(data.judul)}</b></div><div class="ic">${I.dots}</div></div>` +
      `<div class="cv" id="cv">${cover}<div class="lyr" id="lyr"><small>Lirik · ${esc(data.artis)}</small></div></div>` +
      `<div class="ttl"><div class="t"><b>${esc(data.judul)}</b><span>${esc(data.artis)}</span></div><div class="hrt" id="hrt">${I.heart}</div></div>` +
      '<div class="sk"><input id="seek" type="range" min="0" max="100" step="0.1" value="0" style="--p:0%"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
      `<div class="ctl"><div class="b dim" id="shf">${I.shuf}</div><div class="b" id="prev">${I.prev}</div><div class="big" id="big"></div><div class="b" id="next">${I.next}</div><div class="b dim" id="rep">${I.rep}</div></div>` +
      `<div class="bot"><span class="pill" id="tgl">LIRIK</span><span id="st">MEMUAT</span><span class="pill">${esc(d.sumber || 'FULL')}</span></div>` +
      `<div class="wm">${esc(brand)} • ${data.lirik ? (data.lirik.sinkron.length ? 'LIRIK SINKRON' : 'LIRIK') : 'PLAYER'}</div>` +
    '</div>' +
    '<audio id="au" preload="auto" playsinline></audio>' +
    '<script>var __SP=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { spotifyHtml }
