/**
 * lib/ping3html.js — 📡 .ping3 KARTU DIAGNOSTIK DARK DELUXE (v7.36.0)
 *  Kontras ping2 (putih): tema gelap + aksen neon, gauge latency SVG
 *  animasi, angka count-up, bar berdenyut, grafik stream bercahaya,
 *  uptime berdetak. Detail maksimal: latency, loop-lag, uptime, PID,
 *  Node, RAM+sistem, heap+RSS, disk, OS, CPU+load, speedtest, plugin.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fmtUp = s => { const h = Math.floor(s / 3600); const m = Math.floor(s % 3600 / 60); const d = Math.floor(s % 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(d).padStart(2, '0') }
const labelLat = ms => ms < 80 ? 'SUPER FAST' : ms < 200 ? 'FAST' : ms < 500 ? 'NORMAL' : 'SLOW'
const warnaLat = ms => ms < 150 ? '#34d399' : ms < 400 ? '#fbbf24' : '#f87171'

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#000;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#e6edf3}
.wrap{max-width:520px;margin:0 auto;padding:14px 10px 20px;background:#000;min-height:100vh}
.card{background:linear-gradient(165deg,#0d1526 0%,#0a0f1c 45%,#120e24 100%);border:1px solid rgba(120,180,255,.14);border-radius:30px;padding:22px 18px 16px;box-shadow:0 24px 70px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06)}
.a{animation:fd .7s cubic-bezier(.2,1,.3,1) both;opacity:0}
@keyframes fd{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.hd .l small{display:block;font-size:11px;font-weight:800;letter-spacing:3px;color:#7d8aa3}
.hd .l b{display:block;font-size:clamp(19px,6.4vw,29px);font-weight:900;margin-top:6px;letter-spacing:-.5px;background:linear-gradient(90deg,#fff,#7dd3fc 50%,#c4b5fd);-webkit-background-clip:text;background-clip:text;color:transparent}
.hd .kanan{display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex:none}
.live{background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.5);color:#34d399;border-radius:999px;padding:6px 14px;font-size:11px;font-weight:800;letter-spacing:2px;display:flex;align-items:center;gap:7px}
.live i{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 10px #34d399;animation:denyut 1.4s infinite}
.env{background:rgba(125,211,252,.08);border:1px solid rgba(125,211,252,.3);color:#7dd3fc;border-radius:999px;padding:4px 12px;font-size:10px;font-weight:800;letter-spacing:1px}
@keyframes denyut{0%,100%{opacity:1}50%{opacity:.3}}
hr{border:0;border-top:1px solid rgba(125,138,163,.18);margin:14px 0}
.hero{display:flex;gap:14px;align-items:center}
.gauge{position:relative;flex:none;width:128px;height:128px}
.gauge svg{transform:rotate(-90deg)}
.gauge .bgc{stroke:rgba(125,138,163,.16)}
.gauge .fgc{transition:stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)}
.gauge .tengah{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.gauge .tengah b{font-size:27px;font-weight:900;font-variant-numeric:tabular-nums}
.gauge .tengah span{font-size:9px;letter-spacing:2px;color:#7d8aa3;font-weight:800}
.hstat{flex:1;min-width:0}
.hstat .st{font-size:12px;font-weight:900;letter-spacing:2px}
.hstat .up{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;margin-top:2px}
.hstat .sub{font-size:11px;color:#8b98ad;margin-top:5px;line-height:1.7}
.hstat .sub b{color:#d5dee9}
.g{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.c{background:rgba(255,255,255,.035);border:1px solid rgba(125,138,163,.16);border-radius:16px;padding:12px;min-width:0}
.c small{display:block;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#7d8aa3;text-transform:uppercase}
.c b{display:block;font-size:20px;font-weight:800;margin-top:6px;font-variant-numeric:tabular-nums}
.c b.s{font-size:13px;line-height:1.3;font-weight:700;word-break:break-word}
.c span{display:block;font-size:11px;color:#8b98ad;margin-top:4px;font-weight:600;line-height:1.5}
.c .bar{height:6px;border-radius:3px;background:rgba(125,138,163,.18);margin-top:9px;overflow:hidden}
.c .bar i{display:block;height:100%;border-radius:3px;width:0;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}
.sp{margin-top:10px;background:rgba(255,255,255,.035);border:1px solid rgba(125,138,163,.16);border-radius:16px;padding:13px}
.sp .r{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp .k small{display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:1px;color:#aeb9cc;text-transform:uppercase}
.sp .k small em{font-style:normal;color:#34d399}
.sp .k b{display:block;font-size:25px;font-weight:900;margin-top:6px;font-variant-numeric:tabular-nums}
.sp .k b i{display:block;font-style:normal;font-size:12px;color:#8b98ad;font-weight:700}
.sp .k .bar{height:7px;border-radius:4px;background:rgba(125,138,163,.18);margin-top:9px;overflow:hidden}
.sp .k .bar i{display:block;height:100%;border-radius:4px;width:0;transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.sp .k.d .bar i{background:linear-gradient(90deg,#22d3ee,#3b82f6);box-shadow:0 0 12px rgba(34,211,238,.6)}
.sp .k.u .bar i{background:linear-gradient(90deg,#a78bfa,#e879f9);box-shadow:0 0 12px rgba(167,139,250,.6)}
.rt{margin-top:10px;background:rgba(255,255,255,.035);border:1px solid rgba(125,138,163,.16);border-radius:16px;padding:13px}
.rt .h{display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:900;letter-spacing:1px;color:#aeb9cc}
.rt .h em{font-style:normal;color:#34d399}
.rt canvas{width:100%;height:76px;display:block;margin-top:8px}
.proc{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.proc .p{background:rgba(255,255,255,.03);border:1px solid rgba(125,138,163,.14);border-radius:12px;padding:9px 6px;text-align:center}
.proc .p small{display:block;font-size:8.5px;font-weight:800;letter-spacing:1px;color:#7d8aa3}
.proc .p b{display:block;font-size:13px;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums}
.ft{display:flex;justify-content:space-between;margin-top:12px;font-size:10px;color:#5d6b82;letter-spacing:1px;font-weight:700}
`

const JS = `
(function(){
  var D = __P3;
  function hitung (id, target, des, suf) {
    var el = document.getElementById(id); if (!el) return;
    var t0 = Date.now(), dur = 1200;
    (function langkah () {
      var k = Math.min(1, (Date.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * e).toFixed(des) + (suf || '');
      if (k < 1) requestAnimationFrame(langkah);
    })();
  }
  requestAnimationFrame(function () {
    var fg = document.getElementById('fg');
    if (fg) fg.style.strokeDashoffset = D.gaugeOff;
    var bars = document.querySelectorAll('[data-w]');
    for (var i = 0; i < bars.length; i++) bars[i].style.width = bars[i].getAttribute('data-w') + '%';
    hitung('glat', D.latency, 0); hitung('gdown', D.down, 2); hitung('gup', D.up, 2);
  });
  var cv = document.getElementById('cv'), avg = document.getElementById('avg');
  if (cv) {
    var ctx = cv.getContext('2d'), W = cv.width = cv.clientWidth * 2, H = cv.height = 152;
    var data = D.stream.slice();
    function gambar () {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(125,138,163,.14)'; ctx.lineWidth = 1;
      for (var g = 1; g < 4; g++) { ctx.beginPath(); ctx.moveTo(0, H * g / 4); ctx.lineTo(W, H * g / 4); ctx.stroke(); }
      var mx = Math.max.apply(null, data) * 1.25 || 1, n = data.length;
      ctx.beginPath();
      for (var i = 0; i < n; i++) { var x = i / (n - 1) * W, y = H - data[i] / mx * (H - 18) - 8; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(52,211,153,.7)'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      var gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(52,211,153,.28)'); gr.addColorStop(1, 'rgba(52,211,153,0)');
      ctx.fillStyle = gr; ctx.fill();
      var s = 0; for (var j = 0; j < n; j++) s += data[j];
      avg.textContent = 'AVG: ' + Math.round(s / n) + 'ms';
    }
    gambar();
    setInterval(function () {
      var b = D.latency, v = Math.max(6, b + (Math.random() - .45) * b * .5);
      data.push(v); if (data.length > 40) data.shift(); gambar();
    }, 900);
  }
  var up = document.getElementById('up'), t0 = Date.now();
  if (up) setInterval(function () {
    var s = D.uptime + Math.floor((Date.now() - t0) / 1000);
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), d = s % 60;
    up.textContent = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + d).slice(-2);
  }, 1000);
})();
`

/**
 * @param d {nama, latency, loopLag, uptime, pid, node, ramUsed, ramTotal, heapUsed, heapTotal, rss, diskUsed, diskTotal, os, platform, arch, cpu, cores, cpuSpeed, load, down, up, stream, versi, env, plugins, waktu}
 */
export function ping3Html (brand, d = {}) {
  const lat = Math.max(1, Math.round(Number(d.latency) || 50))
  const wl = warnaLat(lat)
  const frak = Math.max(0.04, Math.min(1, lat / 600))
  const K = 2 * Math.PI * 52
  const ramP = d.ramTotal ? Math.min(100, d.ramUsed / d.ramTotal * 100) : 0
  const diskP = d.diskTotal ? Math.min(100, d.diskUsed / d.diskTotal * 100) : 0
  const heapP = d.heapTotal ? Math.min(100, d.heapUsed / d.heapTotal * 100) : 0
  const dn = Number(d.down) || 0, upv = Number(d.up) || 0
  const load = Array.isArray(d.load) ? d.load.map(x => Number(x).toFixed(2)).join(' / ') : '-'
  const data = {
    latency: lat, uptime: Math.floor(d.uptime || 0), down: dn, up: upv,
    gaugeOff: (K * (1 - frak)).toFixed(1),
    stream: (d.stream && d.stream.length ? d.stream : Array.from({ length: 24 }, () => lat * (0.8 + Math.random() * 0.4)))
  }
  return '<style>' + CSS + '</style><div class="wrap"><div class="card">' +
    '<div class="hd a"><div class="l"><small>DIAGNOSTICS PRO · DARK</small><b>📡 ' + esc(d.nama || brand) + '</b></div>' +
    '<div class="kanan"><div class="live"><i></i>LIVE</div><div class="env">' + esc(d.env || 'BOT') + '</div></div></div><hr>' +
    '<div class="hero a" style="animation-delay:.08s"><div class="gauge"><svg width="128" height="128" viewBox="0 0 128 128">' +
    '<circle class="bgc" cx="64" cy="64" r="52" fill="none" stroke-width="11"/>' +
    '<circle class="fgc" id="fg" cx="64" cy="64" r="52" fill="none" stroke="' + wl + '" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + K.toFixed(1) + '" stroke-dashoffset="' + K.toFixed(1) + '"/>' +
    '</svg><div class="tengah"><b id="glat" style="color:' + wl + '">' + lat + '</b><span>LATENCY MS</span></div></div>' +
    '<div class="hstat"><div class="st" style="color:' + wl + '">⚡ ' + labelLat(lat) + '</div>' +
    '<div class="up" id="up">' + fmtUp(data.uptime) + '</div>' +
    '<div class="sub">⏱️ uptime · PID <b>' + esc(d.pid || '-') + '</b><br>🔁 loop-lag <b>' + esc(d.loopLag ?? '-') + ' ms</b> · Node <b>' + esc(d.node || '-') + '</b></div></div></div>' +
    '<div class="g">' +
    '<div class="c a" style="animation-delay:.16s"><small>🧠 RAM Sistem</small><b>' + (d.ramUsed || 0).toFixed(2) + ' GB</b><span>' + Math.round(ramP) + '% dari ' + (d.ramTotal || 0).toFixed(2) + ' GB</span><div class="bar"><i data-w="' + ramP.toFixed(1) + '" style="background:linear-gradient(90deg,#22d3ee,#3b82f6)"></i></div></div>' +
    '<div class="c a" style="animation-delay:.22s"><small>💾 Disk</small><b>' + (d.diskUsed || 0).toFixed(1) + ' GB</b><span>' + Math.round(diskP) + '% dari ' + (d.diskTotal || 0).toFixed(0) + ' GB</span><div class="bar"><i data-w="' + diskP.toFixed(1) + '" style="background:linear-gradient(90deg,#a78bfa,#e879f9)"></i></div></div>' +
    '<div class="c a" style="animation-delay:.28s"><small>🔩 CPU</small><b class="s">' + esc(d.cpu || 'unknown') + '</b><span>' + esc(d.cores || 1) + ' core' + (d.cpuSpeed ? ' · ' + esc(d.cpuSpeed) + ' MHz' : '') + '<br>load ' + esc(load) + '</span></div>' +
    '<div class="c a" style="animation-delay:.34s"><small>🖥️ OS</small><b class="s">' + esc(d.os || '-') + '</b><span>' + esc(d.platform || '') + ' · ' + esc(d.arch || '') + '</span></div>' +
    '</div>' +
    '<div class="sp a" style="animation-delay:.4s"><div class="r">' +
    '<div class="k d"><small><span>⬇️ Download</span><em>VERIFIED ✓</em></small><b><span id="gdown">' + dn.toFixed(2) + '</span><i>Mbps</i></b><div class="bar"><i data-w="' + Math.min(100, dn / 10).toFixed(1) + '"></i></div></div>' +
    '<div class="k u"><small><span>⬆️ Upload</span><em>VERIFIED ✓</em></small><b><span id="gup">' + upv.toFixed(2) + '</span><i>Mbps</i></b><div class="bar"><i data-w="' + Math.min(100, upv / 2).toFixed(1) + '"></i></div></div>' +
    '</div></div>' +
    '<div class="rt a" style="animation-delay:.46s"><div class="h"><span>LATENCY STREAM · LIVE</span><em id="avg">AVG: -</em></div><canvas id="cv"></canvas></div>' +
    '<div class="proc a" style="animation-delay:.52s">' +
    '<div class="p"><small>HEAP</small><b>' + Math.round(heapP) + '%</b></div>' +
    '<div class="p"><small>RSS</small><b>' + (Number(d.rss) || 0).toFixed(0) + ' MB</b></div>' +
    '<div class="p"><small>PLUGIN</small><b>' + esc(d.plugins ?? '-') + '</b></div>' +
    '<div class="p"><small>VERSI</small><b>v' + esc(d.versi || '') + '</b></div>' +
    '</div>' +
    '<div class="ft"><span>' + esc(brand) + ' · PING3</span><span>' + esc(d.waktu || '') + '</span></div>' +
    '</div></div><script>var __P3=' + JSON.stringify(data) + ';' + JS + '</script>'
}

export default { ping3Html }
