/**
 * lib/playhtml.js — 🎧 .play : PEMUTAR MUSIK HTML "NOW PLAYING" (v7.9.2)
 * ------------------------------------------------------------------
 *  Meniru pemutar referensi: panel gelap membulat, NOW PLAYING + judul,
 *  tombol speaker, cover besar (judul/artis/durasi di pojok), judul tebal,
 *  artis, visualizer batang, seekbar + waktu, ⏮ ⏸ ⏭ (tombol putih besar),
 *  kartu "🌙 Sleep Timer" dengan slider, tombol repeat, mute + volume,
 *  lalu panel "STREAM AUDIO" (host, Loop, Downloaded, Total, Progress,
 *  Chunks, MIME, bar gradasi) yang benar-benar dihitung dari fetch stream.
 *
 *  Audio: URL langsung (mp3/m4a). Diunduh via fetch streaming → Blob →
 *  <audio>; kalau fetch diblokir CORS, fallback src langsung.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
body{margin:0;background:#0b0b0d;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#eee}
.wrap{max-width:520px;margin:0 auto;padding:12px 10px 16px}
.panel{background:#151517;border:1px solid #26262a;border-radius:26px;padding:22px 20px 20px;box-shadow:0 12px 40px rgba(0,0,0,.6)}
.np{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.np h5{margin:0;font-size:15px;letter-spacing:1.5px;font-weight:800;color:#e8e8e8}
.np p{margin:4px 0 0;font-size:10.5px;color:#9a9aa0;letter-spacing:.4px;line-height:1.35;max-width:300px;text-transform:uppercase}
.spk{flex:none;width:44px;height:44px;min-width:44px;aspect-ratio:1/1;border-radius:50%;background:#2a2a2e;color:#fff;display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer}
.cover{position:relative;margin-top:16px;border-radius:14px;overflow:hidden;background:#222;aspect-ratio:16/9}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
.cover .ov{position:absolute;left:12px;top:10px;font-size:12px;color:#fff;text-shadow:0 1px 4px #000;line-height:1.3}
.cover .ov small{display:block;font-size:11px;color:#ddd}
.title{margin:18px 0 0;font-size:24px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.artist{margin:4px 0 0;font-size:16px;color:#a7a7ad}
.vis{display:flex;justify-content:center;align-items:flex-end;gap:5px;height:34px;margin:16px 0 14px}
.vis i{width:4px;height:8px;border-radius:2px;background:#fff;display:block;transition:height .12s}
.seek{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,#fff var(--p,0%),#3a3a3f var(--p,0%));outline:0;margin:6px 0 4px}
.seek::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.6)}
.times{display:flex;justify-content:space-between;font-size:12px;color:#9a9aa0}
.ctrl{display:flex;justify-content:center;align-items:center;gap:44px;margin:14px 0 22px}
.ctrl .sm{flex:none;color:#fff;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center}
.ctrl .big{flex:none;width:92px;height:92px;min-width:92px;aspect-ratio:1/1;border-radius:50%;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:36px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.sleep{background:#1e1e21;border:1px solid #2c2c31;border-radius:18px;padding:14px 16px 12px}
.sleep .h{display:flex;justify-content:space-between;font-size:15px;font-weight:800}
.sleep .h b{color:#3ddc84;font-weight:800}
.sleep .h b.on{color:#ffd166}
.sleep input{margin-top:10px}
.sleep p{margin:8px 0 0;font-size:11px;color:#8d8d94;text-align:center;line-height:1.35}
.row{display:flex;align-items:center;gap:22px;margin-top:18px}
.rb{flex:none;width:56px;height:56px;min-width:56px;aspect-ratio:1/1;border-radius:50%;background:#2a2a2e;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none}
.rb.on{background:#fff;color:#111}
.vol{flex:1}
.ws{margin-top:14px;background:#151517;border:1px solid #26262a;border-radius:22px;padding:18px 16px 16px}
.ws .h{display:flex;justify-content:space-between;align-items:center;font-family:'Courier New',monospace;font-weight:800;letter-spacing:1px;font-size:14px}
.ws .st{background:#3a2f16;color:#ffd166;font-size:11px;padding:6px 12px;border-radius:12px;font-weight:800}
.ws .st.ok{background:#3a2f16;color:#ffd166}.ws .st.load{background:#16283a;color:#66c2ff}.ws .st.err{background:#3a1616;color:#ff6b6b}
.ws .host{font-family:'Courier New',monospace;font-size:12px;color:#8d8d94;margin:8px 0 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.cell{background:#1e1e21;border-radius:12px;padding:10px 12px;font-family:'Courier New',monospace}
.cell small{display:block;font-size:10px;color:#8d8d94}
.cell b{display:block;font-size:14px;color:#fff;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{height:6px;border-radius:3px;background:#26262a;margin-top:14px;overflow:hidden}
.bar i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#4f7cff,#b26bff 40%,#ff6bd6 70%,#5be7a9);transition:width .2s}
.wm{text-align:center;font-size:10px;color:#55555c;margin-top:10px;letter-spacing:1px}
`

const JS = `
(function(){
  var D = __PLAY;
  var au = document.getElementById('au'), seek = document.getElementById('seek'), cur = document.getElementById('cur'), tot = document.getElementById('tot');
  var big = document.getElementById('big'), rep = document.getElementById('rep'), mute = document.getElementById('mute'), vol = document.getElementById('vol'), spk = document.getElementById('spk');
  var slp = document.getElementById('slp'), slpV = document.getElementById('slpV'), slpT = document.getElementById('slpT');
  var st = document.getElementById('st'), cDl = document.getElementById('cDl'), cTot = document.getElementById('cTot'), cPr = document.getElementById('cPr'), cCh = document.getElementById('cCh'), cMime = document.getElementById('cMime'), cLoop = document.getElementById('cLoop'), bar = document.getElementById('bar');
  var vis = document.getElementById('vis').children;
  var loop = false, sleepEnd = 0, sleepMin = 0, mainkan = false;
  function mb (n) { return (n / 1048576).toFixed(2) + ' MB'; }
  function fmt (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function setSt (k, t) { st.className = 'st ' + k; st.textContent = t; }
  /* unduh streaming: hitung chunk & byte seperti panel referensi */
  function muat () {
    setSt('load', 'LOADING'); cMime.textContent = D.mime || '-';
    if (D.url.indexOf('data:') === 0) {
      /* audio tertanam (base64) — paling andal di webview WhatsApp, tidak butuh jaringan */
      var b64 = D.url.split(',')[1] || ''; var total = Math.floor(b64.length * 3 / 4); var got = 0, n = 0;
      cTot.textContent = mb(total);
      var tik = setInterval(function () { got = Math.min(total, got + 65536 * 4); n++; cDl.textContent = mb(got); cCh.textContent = n; var pr = got / total * 100; cPr.textContent = pr.toFixed(1) + '%'; bar.style.width = pr + '%';
        if (got >= total) { clearInterval(tik); setSt('ok', 'COMPLETE'); } }, 40);
      au.src = D.url; au.load(); return;
    }
    if (!window.fetch || !window.ReadableStream) { au.src = D.url; setSt('ok', 'DIRECT'); return; }
    fetch(D.url).then(function (r) {
      if (!r.ok || !r.body) throw new Error('http ' + r.status);
      var total = +r.headers.get('content-length') || 0; cTot.textContent = total ? mb(total) : '?';
      cMime.textContent = (r.headers.get('content-type') || D.mime || '-').split(';')[0];
      var rd = r.body.getReader(), got = 0, n = 0, parts = [];
      function baca () { return rd.read().then(function (x) {
        if (x.done) { var b = new Blob(parts, { type: cMime.textContent }); if (!total) { total = got; cTot.textContent = mb(total); } cDl.textContent = mb(got); cPr.textContent = '100.0%'; bar.style.width = '100%'; setSt('ok', 'COMPLETE'); au.src = URL.createObjectURL(b); if (mainkan) au.play().catch(function(){}); return; }
        got += x.value.length; n++; parts.push(x.value); cDl.textContent = mb(got); cCh.textContent = n;
        var p = total ? got / total * 100 : 0; cPr.textContent = p.toFixed(1) + '%'; bar.style.width = p + '%'; return baca(); }); }
      return baca();
    }).catch(function () { au.src = D.cadangan || D.url; setSt('ok', D.cadangan ? 'CADANGAN' : 'DIRECT'); cTot.textContent = '-'; cPr.textContent = '-'; });
  }
  function toggle () { if (au.paused) { mainkan = true; if (!au.src) { au.src = D.url; au.load(); } var pr = au.play(); if (pr && pr.catch) pr.catch(function (e) { setSt('err', 'KETUK LAGI'); }); } else au.pause(); }
  document.getElementById('cover').onclick = toggle;
  big.onclick = toggle; var SPK_ON = spk.innerHTML, SPK_OFF = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9zm13 3 2.3 2.3 1.4-1.4L17.4 12l2.3-2.3-1.4-1.4L16 10.6l-2.3-2.3-1.4 1.4 2.3 2.3-2.3 2.3 1.4 1.4z"/></svg>';
  spk.onclick = function () { au.muted = !au.muted; spk.innerHTML = mute.innerHTML = au.muted ? SPK_OFF : SPK_ON; };
  var ICO_PLAY = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>', ICO_PAUSE = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  big.innerHTML = ICO_PLAY; au.onplay = function () { big.innerHTML = ICO_PAUSE; }; au.onpause = function () { big.innerHTML = ICO_PLAY; };
  au.onloadedmetadata = function () { tot.textContent = fmt(au.duration); };
  au.ontimeupdate = function () { if (!au.duration) return; var p = au.currentTime / au.duration * 100; seek.value = p; seek.style.setProperty('--p', p + '%'); cur.textContent = fmt(au.currentTime);
    if (sleepEnd && Date.now() > sleepEnd) { au.pause(); sleepEnd = 0; slp.value = 0; slpV.textContent = 'Off'; slpV.className = ''; loop = false; rep.className = 'rb'; cLoop.textContent = 'OFF'; au.loop = false; } };
  au.onended = function () { if (!loop) { big.innerHTML = ICO_PLAY; seek.value = 0; seek.style.setProperty('--p', '0%'); } };
  seek.oninput = function () { if (au.duration) au.currentTime = seek.value / 100 * au.duration; };
  rep.onclick = function () { loop = !loop; au.loop = loop; rep.className = 'rb' + (loop ? ' on' : ''); cLoop.textContent = loop ? 'ON' : 'OFF'; };
  mute.onclick = spk.onclick;
  vol.oninput = function () { au.volume = vol.value / 100; };
  slp.oninput = function () { sleepMin = +slp.value; if (!sleepMin) { sleepEnd = 0; slpV.textContent = 'Off'; slpV.className = ''; return; }
    sleepEnd = Date.now() + sleepMin * 60000; slpV.textContent = sleepMin + ' mnt'; slpV.className = 'on'; loop = true; au.loop = true; rep.className = 'rb on'; cLoop.textContent = 'ON'; };
  document.getElementById('prev').onclick = function () { au.currentTime = 0; };
  document.getElementById('next').onclick = function () { if (au.duration) au.currentTime = Math.min(au.duration - 0.5, au.currentTime + 10); };
  setInterval(function () { for (var i = 0; i < vis.length; i++) vis[i].style.height = (au.paused ? 8 : 8 + Math.random() * 26) + 'px'; }, 130);
  au.volume = 0.85; muat();
})();
`

/**
 * @param {string} brand
 * @param {object} d { judul, artis, cover, url, mime, durasi(detik), host, sumber }
 */
export function playHtml (brand = 'THERYHANN!', d = {}) {
  const data = { url: String(d.url || ''), cadangan: String(d.cadangan || ''), mime: d.mime || 'audio/mpeg' }
  const host = d.host || (() => { try { return new URL(String(d.url)).host } catch { return '-' } })()
  const dur = d.durasi ? `${Math.floor(d.durasi / 60)}:${String(d.durasi % 60).padStart(2, '0')}` : ''
  const bars = Array.from({ length: 7 }, () => '<i></i>').join('')
  return '<style>' + CSS + '</style>' +
    '<div class="wrap"><div class="panel">' +
      '<div class="np"><div><h5>NOW PLAYING</h5><p>' + esc(d.judul) + ' BY ' + esc(d.artis) + '</p></div><div class="spk" id="spk"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg></div></div>' +
      '<div class="cover" id="cover">' + (d.cover ? '<img src="' + esc(d.cover) + '" alt="">' : '') + '<div class="ov">' + esc(d.artis) + '<small>' + esc(d.judul) + '</small><small>' + esc(dur) + '</small></div></div>' +
      '<div class="title">' + esc(d.judul) + '</div><div class="artist">' + esc(d.artis) + (d.sumber ? ' · ' + esc(d.sumber) : '') + '</div>' +
      '<div class="vis" id="vis">' + bars + '</div>' +
      '<input class="seek" id="seek" type="range" min="0" max="100" value="0" step="0.1">' +
      '<div class="times"><span id="cur">0:00</span><span id="tot">' + esc(dur || '0:00') + '</span></div>' +
      '<div class="ctrl"><div class="sm" id="prev"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></div><div class="big" id="big"></div><div class="sm" id="next"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M16 6h2v12h-2zm-1.5 6L6 18V6z"/></svg></div></div>' +
      '<div class="sleep"><div class="h"><span style="display:flex;align-items:center;gap:6px;color:#ffd166"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg><span style="color:#fff">Sleep Timer</span></span><b id="slpV">Off</b></div><input class="seek" id="slp" type="range" min="0" max="60" step="5" value="0"><p>Repeat aktif selama timer berjalan — musik berhenti sendiri saat waktu habis</p></div>' +
      '<div class="row"><div class="rb" id="rep"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"/></svg></div><div class="rb" id="mute"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg></div><input class="seek vol" id="vol" type="range" min="0" max="100" value="85" style="--p:85%"></div>' +
    '</div>' +
    '<div class="ws"><div class="h"><span>STREAM AUDIO</span><span class="st load" id="st">LOADING</span></div><div class="host">' + esc(host) + '</div>' +
      '<div class="grid"><div class="cell"><small>Loop</small><b id="cLoop">OFF</b></div><div class="cell"><small>Downloaded</small><b id="cDl">0.00 MB</b></div><div class="cell"><small>Total</small><b id="cTot">-</b></div>' +
      '<div class="cell"><small>Progress</small><b id="cPr">0.0%</b></div><div class="cell"><small>Chunks</small><b id="cCh">0</b></div><div class="cell"><small>MIME</small><b id="cMime">' + esc(data.mime) + '</b></div></div>' +
      '<div class="bar"><i id="bar"></i></div></div>' +
    '<div class="wm">' + esc(brand) + ' • MUSIC PLAYER</div></div>' +
    '<audio id="au" preload="auto" playsinline></audio>' +
    '<script>var __PLAY=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';' + JS + '</script>'
}

export default { playHtml }
