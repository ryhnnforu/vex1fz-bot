/**
 * lib/vidhtml.js — 🎬 .playvid PEMUTAR VIDEO HTML (v7.10.0)
 * ------------------------------------------------------------------
 *  Referensi screenshot pengguna: kartu ungu-gelap, header avatar "VM"
 *  gradasi pink-ungu + judul tebal + "artis • durasi" ungu + kode acak
 *  kanan, layar video hitam, seekbar ungu dengan bulatan, waktu, tombol
 *  ⏸ / VOL / slider VOL / ↻, status "PLAYING" hijau berspasi.
 *  Video ditanam base64 (dikecilkan ffmpeg 240p) — webview WA memblokir
 *  URL luar.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#0b0a14;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
.vm{max-width:560px;margin:0 auto;background:#12111f;border-radius:20px;padding:14px 12px 12px;min-height:100vh}
.hd{display:flex;align-items:center;gap:12px}
.hd .av{flex:none;width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,#ff5fb8,#7a4dff);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;letter-spacing:.5px}
.hd .t{flex:1;min-width:0}
.hd .t b{display:block;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd .t span{display:block;font-size:11px;color:#a98cff;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd .kode{flex:none;font:11px "Courier New",monospace;color:#c9c4e6;background:#1c1a2e;border:1px solid #2a2744;border-radius:7px;padding:4px 7px}
.scr{position:relative;margin-top:14px;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center}
.scr video{width:100%;height:100%;object-fit:contain;display:block;background:#000}
.scr .ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.25)}
.scr .ov.hide{display:none}
.scr .ov i{width:66px;height:66px;border-radius:50%;background:rgba(122,77,255,.85);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(122,77,255,.5)}
.pn{margin-top:12px;background:#1a1829;border-radius:16px;padding:14px 12px 10px}
.sb input{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;background:linear-gradient(90deg,#7a4dff var(--p,0%),#2b2842 var(--p,0%))}
.sb input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:5px solid #b79cff;box-shadow:0 0 0 2px #7a4dff}
.sb .tm{display:flex;justify-content:space-between;font-size:11px;color:#8f8ab0;margin-top:6px}
.ct{display:flex;align-items:center;gap:10px;margin-top:12px}
.ct .b{flex:none;width:56px;height:48px;border-radius:12px;background:#221f38;border:1px solid #2f2b4c;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px}
.ct .b:active{background:#2c2848}
.ct .vl{flex:1;display:flex;align-items:center;gap:8px;min-width:0}
.ct .vl small{font-size:10px;color:#8f8ab0;letter-spacing:.5px;flex:none}
.ct .vl input{-webkit-appearance:none;appearance:none;flex:1;height:5px;border-radius:3px;outline:none;background:linear-gradient(90deg,#7a4dff var(--p,80%),#2b2842 var(--p,80%))}
.ct .vl input::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#7a4dff}
.st{text-align:center;font-size:11px;letter-spacing:4px;color:#3ddc84;margin-top:12px;font-weight:700}
.st.p{color:#f5b942}.st.e{color:#ff6b6b}
.wm{text-align:center;font-size:10px;color:#3d3a58;margin-top:12px;letter-spacing:1px}
`

const JS = `
(function(){
  var D = __VD, v = document.getElementById('v'), sk = document.getElementById('sk'), cur = document.getElementById('cur'), tot = document.getElementById('tot'), pp = document.getElementById('pp'), vb = document.getElementById('vb'), vol = document.getElementById('vol'), rp = document.getElementById('rp'), st = document.getElementById('st'), ov = document.getElementById('ov');
  var IP = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>', IZ = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  var loop = false, drag = false, muted = false, lastVol = 80;
  function fmt (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function setSt (t, k) { st.textContent = t; st.className = 'st' + (k ? ' ' + k : ''); }
  pp.innerHTML = IP; tot.textContent = fmt(D.durasi || 0); v.volume = .8;
  var pakaiCadangan = false, mulaiMain = false;
  function keCadangan () { if (pakaiCadangan || !D.cadangan) { setSt('VIDEO GAGAL', 'e'); return; } pakaiCadangan = true; v.src = D.cadangan; v.load(); setSt('MODE KLIP ' + (D.klip ? D.klip + 's' : ''), 'p'); if (mulaiMain) v.play().catch(function(){}); }
  var jaga = null;
  if (D.url) { v.src = D.url; v.load(); jaga = setTimeout(function () { if (v.readyState < 1) keCadangan(); }, 9000); } else keCadangan();
  v.onloadedmetadata = function () { if (jaga) clearTimeout(jaga); if (isFinite(v.duration) && v.duration > 0) tot.textContent = fmt(v.duration); setSt(pakaiCadangan ? 'KLIP SIAP' : 'READY', 'p'); };
  v.onerror = function () { if (jaga) clearTimeout(jaga); keCadangan(); };
  v.onstalled = function () { if (!pakaiCadangan && v.currentTime < 0.5) setTimeout(function () { if (!pakaiCadangan && v.currentTime < 0.5 && v.readyState < 3) keCadangan(); }, 6000); };
  v.onplay = function () { pp.innerHTML = IZ; ov.className = 'ov hide'; setSt('PLAYING'); };
  v.onpause = function () { pp.innerHTML = IP; ov.className = 'ov'; if (!v.ended) setSt('PAUSED', 'p'); };
  v.onended = function () { if (loop) { v.currentTime = 0; v.play(); } else { pp.innerHTML = IP; ov.className = 'ov'; setSt('SELESAI', 'p'); } };
  function toggle () { mulaiMain = true; if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () { setSt('KETUK ▶ LAGI', 'e'); }); } else v.pause(); }
  pp.onclick = toggle; ov.onclick = toggle; v.onclick = toggle;
  rp.onclick = function () { loop = !loop; v.loop = loop; rp.style.background = loop ? '#7a4dff' : ''; };
  vb.onclick = function () { muted = !muted; v.muted = muted; if (muted) { lastVol = +vol.value; vol.value = 0; } else vol.value = lastVol; vol.style.setProperty('--p', vol.value + '%'); vb.textContent = muted ? 'MUTE' : 'VOL'; };
  vol.oninput = function () { v.volume = vol.value / 100; v.muted = muted = vol.value == 0; vb.textContent = muted ? 'MUTE' : 'VOL'; vol.style.setProperty('--p', vol.value + '%'); };
  v.ontimeupdate = function () { if (drag) return; var d = v.duration || D.durasi || 0; var p = d ? v.currentTime / d * 100 : 0; sk.value = p; sk.style.setProperty('--p', p + '%'); cur.textContent = fmt(v.currentTime); };
  sk.oninput = function () { drag = true; sk.style.setProperty('--p', sk.value + '%'); cur.textContent = fmt((v.duration || D.durasi || 0) * sk.value / 100); };
  sk.onchange = function () { drag = false; v.currentTime = (v.duration || D.durasi || 0) * sk.value / 100; };
})();
`

/** @param {object} d {judul, artis, durasi, url(dataURI/url), poster(dataURI), kode, sumber} */
export function vidHtml (brand, d = {}) {
  const data = { url: String(d.url || ''), cadangan: String(d.cadangan || ''), klip: Number(d.klip) || 0, durasi: Number(d.durasi) || 0 }
  const kode = String(d.kode || Math.random().toString(36).slice(2, 9)).slice(0, 8)
  const fmt = s => s ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '-'
  return '<style>' + CSS + '</style>' +
    '<div class="vm">' +
      `<div class="hd"><div class="av">VM</div><div class="t"><b>${esc(d.judul || 'Video')}</b><span>${esc(d.artis || '-')} • ${fmt(data.durasi)}</span></div><div class="kode">${esc(kode)}</div></div>` +
      `<div class="scr"><video id="v" playsinline preload="auto"${d.poster ? ` poster="${esc(d.poster)}"` : ''}></video><div class="ov" id="ov"><i><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M8 5v14l11-7z"/></svg></i></div></div>` +
      '<div class="pn"><div class="sb"><input id="sk" type="range" min="0" max="100" step="0.1" value="0" style="--p:0%"><div class="tm"><span id="cur">0:00</span><span id="tot">0:00</span></div></div>' +
        '<div class="ct"><div class="b" id="pp"></div><div class="b" id="vb">VOL</div><div class="vl"><small>VOL</small><input id="vol" type="range" min="0" max="100" value="80" style="--p:80%"></div><div class="b" id="rp"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg></div></div>' +
        `<div class="st" id="st">LOADING</div></div>` +
      `<div class="wm">${esc(brand)} • VIDEO PLAYER${d.sumber ? ' • ' + esc(d.sumber) : ''}</div>` +
    '</div>' +
    '<script>var __VD=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { vidHtml }
