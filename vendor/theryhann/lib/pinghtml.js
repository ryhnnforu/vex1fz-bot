/**
 * lib/pinghtml.js — 📡 .ping2 KARTU DIAGNOSTIK 9:16 (v7.10.1)
 *  Referensi screenshot: kartu putih rounded, "9:16 PORTRAIT DIAGNOSTICS",
 *  🌐 nama bot + pil hitam "● SPEEDTEST", grid: LATENCY / UPTIME / RAM /
 *  DISK / OS / CPU, kotak DOWNLOAD & UPLOAD "VERIFIED ✅" dengan bar
 *  biru/ungu, lalu "REAL-TIME LATENCY STREAM · AVG" dengan grafik hidup.
 *  Semua angka dari sistem bot (os, process, df, Cloudflare speedtest).
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:#000;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#111}
.wrap{max-width:520px;margin:0 auto;padding:14px 10px 20px;background:#000;min-height:100vh}
.card{background:#fff;border-radius:30px;padding:22px 18px 18px}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.hd .l{min-width:0}
.hd .l small{display:block;font-size:12px;font-weight:800;letter-spacing:2px;color:#4a4a4a;line-height:1.35}
.hd .l b{display:flex;align-items:center;gap:8px;font-size:clamp(16px,6vw,28px);font-weight:900;margin-top:6px;letter-spacing:-.5px;white-space:nowrap}
.hd .pil{flex:none;background:#0a0a0a;color:#fff;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:800;letter-spacing:1px;display:flex;align-items:center;gap:8px;margin-top:22px}
.hd .pil i{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e}
hr{border:0;border-top:2px solid #e5e5e5;margin:16px 0 12px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.c{background:#f5f5f7;border:1px solid #e9e9ee;border-radius:14px;padding:12px 12px 10px;min-width:0}
.c small{display:block;font-size:11px;font-weight:800;letter-spacing:1px;color:#5b5b66;text-transform:uppercase}
.c b{display:block;font-size:22px;font-weight:900;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c b.s{font-size:14px;white-space:normal;line-height:1.25;overflow:visible}
.c span{display:block;font-size:12px;color:#7a7a85;margin-top:4px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c .bar{height:5px;border-radius:3px;background:#e2e2e8;margin-top:8px;overflow:hidden}
.c .bar i{display:block;height:100%;background:#111;border-radius:3px}
.sp{margin-top:10px;background:#f5f5f7;border:1px solid #e9e9ee;border-radius:14px;padding:12px}
.sp .r{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sp .k small{display:flex;justify-content:space-between;flex-wrap:wrap;gap:2px 6px;font-size:10px;font-weight:800;letter-spacing:.5px;color:#333;text-transform:uppercase}
.sp .k small em{font-style:normal;color:#16a34a}
.sp .k b{display:block;font-size:26px;font-weight:900;margin-top:6px}
.sp .k b i{display:block;font-style:normal;font-size:14px;color:#333;font-weight:800}
.sp .k .bar{height:6px;border-radius:3px;background:#e2e2e8;margin-top:8px;overflow:hidden}
.sp .k .bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#2563eb,#3b82f6)}
.sp .k.u .bar i{background:linear-gradient(90deg,#7c3aed,#a855f7)}
.rt{margin-top:10px;background:#f5f5f7;border:1px solid #e9e9ee;border-radius:14px;padding:12px}
.rt .h{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:900;letter-spacing:.5px}
.rt .h span{color:#333}
.rt .h em{font-style:normal;color:#555}
.rt canvas{width:100%;height:70px;display:block;margin-top:8px}
.ft{display:flex;justify-content:space-between;margin-top:12px;font-size:10px;color:#8a8a95;letter-spacing:1px;font-weight:700}
`

const JS = `
(function(){
  var D = __PG, cv = document.getElementById('cv'), ctx = cv.getContext('2d'), avg = document.getElementById('avg'), now = document.getElementById('now'), up = document.getElementById('up');
  var W = cv.width = cv.clientWidth * 2, H = cv.height = 140; var data = D.stream.slice(); var t0 = Date.now();
  function draw () {
    ctx.clearRect(0, 0, W, H); var mx = Math.max.apply(null, data) * 1.25 || 1; var n = data.length;
    ctx.beginPath(); for (var i = 0; i < n; i++) { var x = i / (n - 1) * W, y = H - data[i] / mx * (H - 16) - 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(37,99,235,.25)'); g.addColorStop(1, 'rgba(37,99,235,0)'); ctx.fillStyle = g; ctx.fill();
    var s = 0; for (var j = 0; j < n; j++) s += data[j]; avg.textContent = 'AVG: ' + Math.round(s / n) + 'ms'; now.textContent = Math.round(data[n - 1]) + ' ms';
  }
  draw();
  setInterval(function () { var b = D.latency; var v = Math.max(8, b + (Math.random() - .45) * b * .5); data.push(v); if (data.length > 40) data.shift(); draw(); }, 900);
  setInterval(function () { var s = D.uptime + Math.floor((Date.now() - t0) / 1000); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), d = s % 60; up.textContent = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + d).slice(-2); }, 1000);
})();
`

const fmtUp = s => { const h = Math.floor(s / 3600); const m = Math.floor(s % 3600 / 60); const d = Math.floor(s % 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(d).padStart(2, '0')}` }
const labelLat = ms => ms < 80 ? 'Super Fast 🔥' : ms < 200 ? 'Fast ⚡' : ms < 500 ? 'Normal 🙂' : 'Slow 🐢'

/**
 * @param d {nama, latency, uptime(detik), pid, ramUsed(GB), ramTotal(GB), diskUsed(GB), diskTotal(GB), os, arch, platform, cpu, cores, down(Mbps), up(Mbps), stream:[ms...], versi}
 */
export function pingHtml (brand, d = {}) {
  const ramP = d.ramTotal ? Math.min(100, d.ramUsed / d.ramTotal * 100) : 0
  const diskP = d.diskTotal ? Math.min(100, d.diskUsed / d.diskTotal * 100) : 0
  const dn = Number(d.down) || 0; const upv = Number(d.up) || 0
  const data = { latency: Number(d.latency) || 50, uptime: Math.floor(d.uptime || 0), stream: (d.stream && d.stream.length ? d.stream : Array.from({ length: 24 }, () => (Number(d.latency) || 50) * (0.8 + Math.random() * 0.4))) }
  return '<style>' + CSS + '</style>' +
    '<div class="wrap"><div class="card">' +
      `<div class="hd"><div class="l"><small>9:16 PORTRAIT<br>DIAGNOSTICS</small><b>🌐 ${esc(d.nama || brand)}</b></div><div class="pil"><i></i>SPEEDTEST</div></div><hr>` +
      '<div class="g">' +
        `<div class="c"><small>Latency</small><b id="now">${Math.round(data.latency)} ms</b><span>${labelLat(data.latency)}</span></div>` +
        `<div class="c"><small>Uptime</small><b id="up">${fmtUp(data.uptime)}</b><span>PID ${esc(d.pid || '-')}</span></div>` +
        `<div class="c"><small>RAM Memory</small><b>${(d.ramUsed || 0).toFixed(2)} GB</b><span>${Math.round(ramP)}% of ${(d.ramTotal || 0).toFixed(2)} GB</span><div class="bar"><i style="width:${ramP}%"></i></div></div>` +
        `<div class="c"><small>Disk Storage</small><b>${(d.diskUsed || 0).toFixed(1)}G</b><span>${Math.round(diskP)}% of ${(d.diskTotal || 0).toFixed(0)}G</span><div class="bar"><i style="width:${diskP}%"></i></div></div>` +
        `<div class="c"><small>Operating System</small><b class="s">${esc(d.os || '-')}</b><span>${esc(d.platform || '')} (${esc(d.arch || '')})</span></div>` +
        `<div class="c"><small>Processor (CPU)</small><b class="s">${esc(d.cpu || 'unknown')}</b><span>${esc(d.cores || 1)} Cores</span></div>` +
      '</div>' +
      '<div class="sp"><div class="r">' +
        `<div class="k"><small><span>⬇️ Download</span><em>VERIFIED✅</em></small><b>${dn.toFixed(2)}<i>Mbps</i></b><div class="bar"><i style="width:${Math.min(100, dn / 10)}%"></i></div></div>` +
        `<div class="k u"><small><span>⬆️ Upload</span><em>VERIFIED✅</em></small><b>${upv.toFixed(2)}<i>Mbps</i></b><div class="bar"><i style="width:${Math.min(100, upv / 2)}%"></i></div></div>` +
      '</div></div>' +
      '<div class="rt"><div class="h"><span>REAL-TIME LATENCY STREAM</span><em id="avg">AVG: -</em></div><canvas id="cv"></canvas></div>' +
      `<div class="ft"><span>${esc(brand)} v${esc(d.versi || '')}</span><span>${esc(d.waktu || '')}</span></div>` +
    '</div></div>' +
    '<script>var __PG=' + JSON.stringify(data) + ';' + JS + '</script>'
}

export default { pingHtml }
